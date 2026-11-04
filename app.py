from collections import OrderedDict
from dataclasses import dataclass, field, replace
import math
from threading import Lock
import uuid

from flask import Flask, jsonify, render_template, request, url_for

from manejo_imagen import (
    ErrorImagen,
    abrir_imagen,
    generar_vista,
    guardar_procesada_sin_perdida,
)
from ajustes_imagen import AJUSTES_DISPONIBLES, procesar_ajustes, slider_a_factor
from recortar import aplicar_recorte
from voltear_imagen import voltear_horizontal, voltear_vertical
from detalle import AJUSTES_DETALLE, procesar_detalle
from dithering import aplicar_dithering

MAX_ARCHIVO_BYTES = 25 * 1024 * 1024
MARGEN_MULTIPART_BYTES = 64 * 1024
MAX_IMAGENES_EN_MEMORIA = 5

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_ARCHIVO_BYTES + MARGEN_MULTIPART_BYTES


@dataclass(frozen=True)
class ImagenGuardada:
    original: bytes
    original_inicial: bytes
    procesada: bytes
    vista: bytes
    ancho: int
    alto: int
    ancho_inicial: int
    alto_inicial: int
    ancho_vista: int
    alto_vista: int
    ajustes: dict[str, float] = field(default_factory=dict)
    fue_recortada: bool = False
    dither_algoritmo: str = "ninguno"
    dither_paleta: str = "bn"
    dither_pixel: int = 1


AJUSTES_DEFECTO: dict[str, float] = {
    "brillo": 0.0,
    "contraste": 0.0,
    "saturacion": 0.0,
    "desenfoque": 0.0,
    "nitidez": 0.0,
}


def ejecutar_pipeline(
    imagen_base,
    factores: dict[str, float],
    dither_algoritmo: str = "ninguno",
    dither_paleta: str = "bn",
    dither_pixel: int = 1,
):
    resultado = procesar_ajustes(imagen_base, factores)

    siguiente = procesar_detalle(resultado, factores)
    if resultado is not imagen_base and resultado is not siguiente:
        resultado.close()
    resultado = siguiente

    if dither_algoritmo and dither_algoritmo != "ninguno":
        siguiente = aplicar_dithering(resultado, dither_algoritmo, dither_paleta, dither_pixel)
        if resultado is not imagen_base and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    return resultado


imagenes_guardadas: OrderedDict[str, ImagenGuardada] = OrderedDict()
imagenes_lock = Lock()


def respuesta_error(codigo: str, mensaje: str, status: int):
    return jsonify(ok=False, error=codigo, mensaje=mensaje), status


@app.get("/")
def index():
    return render_template("landing.html")


@app.get("/editor")
def editor():
    return render_template("index.html")


@app.get("/app")
def app_view():
    return render_template("index.html")


@app.post("/upload")
def subir_imagen():
    archivo = request.files.get("imagen")
    if archivo is None:
        return respuesta_error("SIN_ARCHIVO", "Selecciona una imagen para subir.", 400)

    try:
        datos_originales = archivo.stream.read(MAX_ARCHIVO_BYTES + 1)
        if not datos_originales:
            return respuesta_error("SIN_ARCHIVO", "Selecciona una imagen para subir.", 400)
        if len(datos_originales) > MAX_ARCHIVO_BYTES:
            return respuesta_error(
                "ARCHIVO_MUY_GRANDE",
                "La imagen supera el tamaño máximo de 25 MB.",
                413,
            )

        imagen = abrir_imagen(datos_originales)
        try:
            ancho, alto = imagen.size
            procesada = guardar_procesada_sin_perdida(imagen)
            vista, ancho_vista, alto_vista = generar_vista(imagen)
        finally:
            imagen.close()

        imagen_id = uuid.uuid4().hex
        imagen_guardada = ImagenGuardada(
            original=datos_originales,
            original_inicial=datos_originales,
            procesada=procesada,
            vista=vista,
            ancho=ancho,
            alto=alto,
            ancho_inicial=ancho,
            alto_inicial=alto,
            fue_recortada=False,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            ajustes=dict(AJUSTES_DEFECTO),
        )

        with imagenes_lock:
            imagenes_guardadas[imagen_id] = imagen_guardada
            while len(imagenes_guardadas) > MAX_IMAGENES_EN_MEMORIA:
                imagenes_guardadas.popitem(last=False)

        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id),
            ancho=ancho,
            alto=alto,
            ancho_inicial=ancho,
            alto_inicial=alto,
            fue_recortada=False,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
        )
    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error inesperado al procesar una imagen.")
        return respuesta_error(
            "ERROR_INTERNO",
            "No se pudo procesar la imagen. Inténtalo de nuevo.",
            500,
        )

def aplicar_ajustes_a_imagen(imagen_id: str, nuevos_valores: dict[str, float]):
    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error(
            "IMAGEN_NO_ENCONTRADA",
            "La imagen ya no está disponible. Vuelve a cargarla.",
            404,
        )

    ajustes_actualizados = dict(imagen_guardada.ajustes)
    ajustes_actualizados.update(nuevos_valores)

    if ajustes_actualizados == imagen_guardada.ajustes:
        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
            ancho_vista=imagen_guardada.ancho_vista,
            alto_vista=imagen_guardada.alto_vista,
            sin_cambios=True,
        )

    factores = {nombre: slider_a_factor(val) for nombre, val in ajustes_actualizados.items()}

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original)
        resultado = ejecutar_pipeline(
            imagen,
            factores,
            imagen_guardada.dither_algoritmo,
            imagen_guardada.dither_paleta,
            imagen_guardada.dither_pixel,
        )

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            procesada=procesada,
            vista=vista,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            ajustes=ajustes_actualizados,
        )
        with imagenes_lock:
            if imagenes_guardadas.get(imagen_id) is not imagen_guardada:
                return respuesta_error(
                    "IMAGEN_MODIFICADA",
                    "La imagen cambió durante el procesamiento. Inténtalo de nuevo.",
                    409,
                )
            imagenes_guardadas[imagen_id] = imagen_actualizada

        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
        )
    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error inesperado al aplicar los ajustes a una imagen.")
        return respuesta_error(
            "ERROR_INTERNO",
            "No se pudieron aplicar los ajustes a la imagen. Inténtalo de nuevo.",
            500,
        )
    finally:
        if resultado is not None and resultado is not imagen:
            resultado.close()
        if imagen is not None:
            imagen.close()


@app.post("/imagen/<imagen_id>/ajustes")
def aplicar_ajustes(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos del efecto no son válidos.", 400)

    valores = {}
    for nombre, (etiqueta, _) in AJUSTES_DISPONIBLES.items():
        if nombre in datos:
            valor_slider = datos.get(nombre)
            if (
                isinstance(valor_slider, bool)
                or not isinstance(valor_slider, (int, float))
                or not -100 <= valor_slider <= 100
                or not math.isfinite(valor_slider)
            ):
                return respuesta_error(
                    "FACTOR_INVALIDO",
                    f"El ajuste de {etiqueta} debe estar entre -100 y 100.",
                    400,
                )
            valores[nombre] = float(valor_slider)

    for nombre, (etiqueta, _) in AJUSTES_DETALLE.items():
        if nombre in datos:
            valor_slider = datos.get(nombre)
            if (
                not isinstance(valor_slider, bool)
                and isinstance(valor_slider, (int, float))
                and -100 <= valor_slider <= 100
                and math.isfinite(valor_slider)
            ):
                valores[nombre] = float(valor_slider)

    return aplicar_ajustes_a_imagen(imagen_id, valores)



@app.get("/imagen/<imagen_id>")
def ver_imagen(imagen_id: str):
    with imagenes_lock:
        imagen = imagenes_guardadas.get(imagen_id)

    if imagen is None:
        return respuesta_error(
            "IMAGEN_NO_ENCONTRADA",
            "La imagen ya no está disponible. Vuelve a cargarla.",
            404,
        )

    respuesta = app.response_class(imagen.vista, mimetype="image/jpeg")
    respuesta.headers["Cache-Control"] = "no-store"
    return respuesta


@app.errorhandler(413)
def archivo_demasiado_grande(_error):
    _ = _error
    return respuesta_error(
        "ARCHIVO_MUY_GRANDE",
        "La imagen supera el tamaño máximo de 25 MB.",
        413,
    )

@app.post("/imagen/<imagen_id>/recortar")
def recortar_imagen(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Las coordenadas no son válidas.", 400)

    coordenadas = {}
    for nombre in ("x", "y", "ancho", "alto"):
        valor = datos.get(nombre)
        if (
            isinstance(valor, bool)
            or not isinstance(valor, int)
        ):
            return respuesta_error(
                "COORDENADAS_INVALIDAS",
                "Las coordenadas deben ser números enteros.",
                400,
            )
        coordenadas[nombre] = int(valor)

    x = coordenadas["x"]
    y = coordenadas["y"]
    ancho = coordenadas["ancho"]
    alto = coordenadas["alto"]
    if x < 0 or y < 0:
        return respuesta_error(
            "COORDENADAS_INVALIDAS",
            "El origen del recorte debe estar dentro de la imagen.",
            400,
        )
    if ancho <= 0 or alto <= 0:
        return respuesta_error("DIMENSIONES_INVALIDAS", "El ancho y alto deben ser mayores a cero.", 400)

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error(
            "IMAGEN_NO_ENCONTRADA",
            "La imagen ya no está disponible. Vuelve a cargarla.",
            404,
        )

    imagen_original = None
    imagen_procesada = None

    original_recortado = None
    procesada_recortada = None
    try:
        imagen_original = abrir_imagen(imagen_guardada.original)
        imagen_procesada = abrir_imagen(imagen_guardada.procesada)

        if imagen_original.size != imagen_procesada.size:
            return respuesta_error(
                "IMAGEN_MODIFICADA",
                "La imagen cambió durante el procesamiento. Inténtalo de nuevo.",
                409,
            )
        if x + ancho > imagen_original.width or y + alto > imagen_original.height:
            return respuesta_error(
                "RECORTE_FUERA_DE_IMAGEN",
                "El área seleccionada excede los límites de la imagen.",
                400,
            )

        original_recortado = aplicar_recorte(imagen_original, x, y, ancho, alto)
        procesada_recortada = aplicar_recorte(imagen_procesada, x, y, ancho, alto)
        nuevo_ancho, nuevo_alto = original_recortado.size
        nuevo_original = guardar_procesada_sin_perdida(original_recortado)
        nueva_procesada = guardar_procesada_sin_perdida(procesada_recortada)
        vista, ancho_vista, alto_vista = generar_vista(procesada_recortada)

        imagen_actualizada = replace(
            imagen_guardada,
            original=nuevo_original,
            procesada=nueva_procesada,
            vista=vista,
            ancho=nuevo_ancho,
            alto=nuevo_alto,
            fue_recortada=True,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
        )

        with imagenes_lock:
            if imagenes_guardadas.get(imagen_id) is not imagen_guardada:
                return respuesta_error(
                    "IMAGEN_MODIFICADA",
                    "La imagen cambió durante el procesamiento. Inténtalo de nuevo.",
                    409,
                )
            imagenes_guardadas[imagen_id] = imagen_actualizada

        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
            ancho=nuevo_ancho,
            alto=nuevo_alto,
            fue_recortada=True,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
        )

    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error inesperado al recortar una imagen.")
        return respuesta_error("ERROR_INTERNO", "No se pudo recortar la imagen. Inténtalo de nuevo.", 500)
    finally:
        if original_recortado is not None:
            original_recortado.close()
        if procesada_recortada is not None:
            procesada_recortada.close()
        if imagen_original is not None:
            imagen_original.close()
        if imagen_procesada is not None:
            imagen_procesada.close()


@app.post("/imagen/<imagen_id>/restablecer-recorte")
def restablecer_recorte(imagen_id: str):
    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error(
            "IMAGEN_NO_ENCONTRADA",
            "La imagen ya no está disponible. Vuelve a cargarla.",
            404,
        )

    if not imagen_guardada.fue_recortada:
        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
            ancho=imagen_guardada.ancho,
            alto=imagen_guardada.alto,
            ancho_vista=imagen_guardada.ancho_vista,
            alto_vista=imagen_guardada.alto_vista,
            sin_cambios=True,
            fue_recortada=False,
        )

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original_inicial)
        factores = {nombre: slider_a_factor(val) for nombre, val in imagen_guardada.ajustes.items()}
        resultado = ejecutar_pipeline(
            imagen,
            factores,
            imagen_guardada.dither_algoritmo,
            imagen_guardada.dither_paleta,
            imagen_guardada.dither_pixel,
        )

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            original=imagen_guardada.original_inicial,
            procesada=procesada,
            vista=vista,
            ancho=imagen_guardada.ancho_inicial,
            alto=imagen_guardada.alto_inicial,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            fue_recortada=False,
        )

        with imagenes_lock:
            if imagenes_guardadas.get(imagen_id) is not imagen_guardada:
                return respuesta_error(
                    "IMAGEN_MODIFICADA",
                    "La imagen cambió durante el procesamiento. Inténtalo de nuevo.",
                    409,
                )
            imagenes_guardadas[imagen_id] = imagen_actualizada

        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
            ancho=imagen_guardada.ancho_inicial,
            alto=imagen_guardada.alto_inicial,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            fue_recortada=False,
        )

    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error al restablecer el recorte de la imagen.")
        return respuesta_error(
            "ERROR_INTERNO",
            "No se pudo restablecer el tamaño original de la imagen.",
            500,
        )
    finally:
        if resultado is not None and resultado is not imagen:
            resultado.close()
        if imagen is not None:
            imagen.close()


@app.post("/imagen/<imagen_id>/voltear/<direccion>")
def voltear(imagen_id: str, direccion: str):
    if direccion not in ("horizontal", "vertical"):
        return respuesta_error("DIRECCION_INVALIDA", "Dirección no permitida.", 400)
    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)
    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible.", 404)
    imagen_original = None
    imagen_procesada = None

    try:
        imagen_original = abrir_imagen(imagen_guardada.original)
        imagen_procesada = abrir_imagen(imagen_guardada.procesada)

        imagen_inicial = abrir_imagen(imagen_guardada.original_inicial)
        funcion_voltear = voltear_horizontal if direccion == "horizontal" else voltear_vertical
        nueva_orig = funcion_voltear(imagen_original)
        nueva_proc = funcion_voltear(imagen_procesada)
        nueva_inic = funcion_voltear(imagen_inicial)
        nuevo_original = guardar_procesada_sin_perdida(nueva_orig)
        nueva_procesada = guardar_procesada_sin_perdida(nueva_proc)
        nuevo_inicial = guardar_procesada_sin_perdida(nueva_inic)
        vista, ancho_v, alto_v = generar_vista(nueva_proc)
        imagen_actualizada = replace(
            imagen_guardada,
            original=nuevo_original,
            procesada=nueva_procesada,
            vista=vista,
            original_inicial=nuevo_inicial,
            ancho_vista=ancho_v,
            alto_vista=alto_v,
        )
        with imagenes_lock:
            imagenes_guardadas[imagen_id] = imagen_actualizada
        return jsonify(
            ok=True,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
        )
    except Exception:
        app.logger.exception("Error al voltear la imagen.")
        return respuesta_error("ERROR_INTERNO", "No se pudo voltear la imagen.", 500)



@app.post("/imagen/<imagen_id>/detalle")
def aplicar_detalle(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos del efecto no son válidos.", 400)

    valores = {}
    for nombre, (etiqueta, _) in AJUSTES_DETALLE.items():
        valor_slider = datos.get(nombre)
        if valor_slider is None and nombre == "desenfoque" and "enfoque" in datos:
            valor_slider = datos.get("enfoque")

        if valor_slider is not None:
            if (
                isinstance(valor_slider, bool)
                or not isinstance(valor_slider, (int, float))
                or not -100 <= valor_slider <= 100
                or not math.isfinite(valor_slider)
            ):
                return respuesta_error(
                    "FACTOR_INVALIDO",
                    f"El ajuste de {etiqueta} debe estar entre -100 y 100.",
                    400,
                )
            valores[nombre] = float(valor_slider)

    for nombre in ("brillo", "contraste", "saturacion"):
        if nombre in datos:
            valor_slider = datos.get(nombre)
            if (
                not isinstance(valor_slider, bool)
                and isinstance(valor_slider, (int, float))
                and -100 <= valor_slider <= 100
                and math.isfinite(valor_slider)
            ):
                valores[nombre] = float(valor_slider)

    return aplicar_ajustes_a_imagen(imagen_id, valores)





ALGORITMOS_DITHERING_VALIDOS = {
    "ninguno",
    "floyd_steinberg",
    "bayer_4",
    "bayer_8",
    "atkinson",
    "cuantizacion",
}

PALETAS_DITHERING_VALIDAS = {
    "bn",
    "gameboy",
    "cga",
    "ambar",
    "cyberpunk",
}


@app.post("/imagen/<imagen_id>/dithering")
def aplicar_dithering_ruta(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos del efecto no son válidos.", 400)

    algoritmo = datos.get("algoritmo", "ninguno")
    paleta = datos.get("paleta", "bn")
    tamano_pixel = datos.get("tamano_pixel", 1)

    if algoritmo not in ALGORITMOS_DITHERING_VALIDOS:
        return respuesta_error("ALGORITMO_INVALIDO", "El algoritmo de dithering seleccionado no es válido.", 400)

    if paleta not in PALETAS_DITHERING_VALIDAS:
        return respuesta_error("PALETA_INVALIDA", "La paleta de color seleccionada no es válida.", 400)

    if (
        isinstance(tamano_pixel, bool)
        or not isinstance(tamano_pixel, int)
        or not 1 <= tamano_pixel <= 8
    ):
        return respuesta_error("PIXEL_INVALIDO", "El tamaño de píxel debe ser un número entero entre 1 y 8.", 400)

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible. Vuelve a cargarla.", 404)

    if (
        imagen_guardada.dither_algoritmo == algoritmo
        and imagen_guardada.dither_paleta == paleta
        and imagen_guardada.dither_pixel == tamano_pixel
    ):
        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
            ancho_vista=imagen_guardada.ancho_vista,
            alto_vista=imagen_guardada.alto_vista,
            sin_cambios=True,
        )

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original)
        factores = {nombre: slider_a_factor(val) for nombre, val in imagen_guardada.ajustes.items()}
        resultado = ejecutar_pipeline(imagen, factores, algoritmo, paleta, tamano_pixel)

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            procesada=procesada,
            vista=vista,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            dither_algoritmo=algoritmo,
            dither_paleta=paleta,
            dither_pixel=tamano_pixel,
        )

        with imagenes_lock:
            if imagenes_guardadas.get(imagen_id) is not imagen_guardada:
                return respuesta_error(
                    "IMAGEN_MODIFICADA",
                    "La imagen cambió durante el procesamiento. Inténtalo de nuevo.",
                    409,
                )
            imagenes_guardadas[imagen_id] = imagen_actualizada

        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
        )
    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error inesperado al aplicar dithering a una imagen.")
        return respuesta_error(
            "ERROR_INTERNO",
            "No se pudo aplicar el efecto de dithering a la imagen.",
            500,
        )
    finally:
        if resultado is not None and resultado is not imagen:
            resultado.close()
        if imagen is not None:
            imagen.close()


if __name__ == "__main__":
    app.run(debug=True)