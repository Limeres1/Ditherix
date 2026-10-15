from collections import OrderedDict
from dataclasses import dataclass, replace
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

MAX_ARCHIVO_BYTES = 25 * 1024 * 1024
MARGEN_MULTIPART_BYTES = 64 * 1024
MAX_IMAGENES_EN_MEMORIA = 5

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_ARCHIVO_BYTES + MARGEN_MULTIPART_BYTES


@dataclass(frozen=True)
class ImagenGuardada:
    original: bytes
    procesada: bytes
    vista: bytes
    ancho: int
    alto: int
    ancho_vista: int
    alto_vista: int


imagenes_guardadas: OrderedDict[str, ImagenGuardada] = OrderedDict()
imagenes_lock = Lock()


def respuesta_error(codigo: str, mensaje: str, status: int):
    return jsonify(ok=False, error=codigo, mensaje=mensaje), status


@app.get("/")
def index():
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
            procesada=procesada,
            vista=vista,
            ancho=ancho,
            alto=alto,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
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

@app.post("/imagen/<imagen_id>/ajustes")
def aplicar_ajustes(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos del efecto no son válidos.", 400)

    factores = {}
    for nombre, (etiqueta, _) in AJUSTES_DISPONIBLES.items():
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
        factores[nombre] = slider_a_factor(float(valor_slider))

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error(
            "IMAGEN_NO_ENCONTRADA",
            "La imagen ya no está disponible. Vuelve a cargarla.",
            404,
        )

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original)
        resultado = procesar_ajustes(imagen, factores)

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            procesada=procesada,
            vista=vista,
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
        # Elegir la función según la dirección
        funcion_voltear = voltear_horizontal if direccion == "horizontal" else voltear_vertical
        nueva_orig = funcion_voltear(imagen_original)
        nueva_proc = funcion_voltear(imagen_procesada)
        # Guardar en memoria y generar nueva vista previa
        nuevo_original = guardar_procesada_sin_perdida(nueva_orig)
        nueva_procesada = guardar_procesada_sin_perdida(nueva_proc)
        vista, ancho_v, alto_v = generar_vista(nueva_proc)
        # Actualizar el registro en memoria
        imagen_actualizada = replace(
            imagen_guardada,
            original=nuevo_original,
            procesada=nueva_procesada,
            vista=vista,
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


if __name__ == "__main__":
    app.run(debug=True)