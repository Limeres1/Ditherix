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
from color_mixer import COLORES_CANALES, procesar_color
from marcos import ESTILOS_MARCO, aplicar_marco
from byn import FILTROS_BYN, VIRADOS_BYN, procesar_byn
from presets import PRESETS_DISPONIBLES, procesar_preset

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
    vista_original: bytes = b""
    ajustes: dict[str, float] = field(default_factory=dict)
    fue_recortada: bool = False
    dither_algoritmo: str = "ninguno"
    dither_paleta: str = "bn"
    dither_pixel: int = 1
    dither_intensidad: int = 100
    temperatura: float = 0.0
    tinte: float = 0.0
    mezcla_color: dict[str, dict[str, float]] = field(default_factory=dict)
    marco_estilo: str = "ninguno"
    marco_color: str = "#ffffff"
    marco_grosor: int = 24
    byn_activo: bool = False
    byn_canales: dict[str, float] = field(default_factory=dict)
    byn_virado: str = "ninguno"
    byn_virado_intensidad: float = 70.0
    preset_activo: str = "ninguno"
    preset_intensidad: float = 100.0


AJUSTES_DEFECTO: dict[str, float] = {
    "brillo": 0.0,
    "contraste": 0.0,
    "saturacion": 0.0,
    "desenfoque": 0.0,
    "nitidez": 0.0,
    "grano": 0.0,
}


def calcular_factores(ajustes: dict[str, float]) -> dict[str, float]:
    factores = {}
    for nombre, val in ajustes.items():
        if nombre == "grano":
            factores[nombre] = float(val)
        else:
            factores[nombre] = slider_a_factor(val)
    return factores


def ejecutar_pipeline(
    imagen_base,
    factores: dict[str, float],
    dither_algoritmo: str = "ninguno",
    dither_paleta: str = "bn",
    dither_pixel: int = 1,
    dither_intensidad: int = 100,
    temperatura: float = 0.0,
    tinte: float = 0.0,
    mezcla_color: dict[str, dict[str, float]] | None = None,
    marco_estilo: str = "ninguno",
    marco_color: str = "#ffffff",
    marco_grosor: int = 24,
    byn_activo: bool = False,
    byn_canales: dict[str, float] | None = None,
    byn_virado: str = "ninguno",
    byn_virado_intensidad: float = 70.0,
    preset_activo: str = "ninguno",
    preset_intensidad: float = 100.0,
):
    # 1. Determinar el marco final: si no hay marco manual explícito, hereda el del preset activo
    estilo_marco_final = marco_estilo
    color_marco_final = marco_color
    grosor_marco_final = marco_grosor

    if (not estilo_marco_final or estilo_marco_final == "ninguno") and preset_activo and preset_activo != "ninguno":
        preset_def = PRESETS_DISPONIBLES.get(preset_activo)
        if preset_def and preset_def.marco_estilo != "ninguno":
            estilo_marco_final = preset_def.marco_estilo
            color_marco_final = preset_def.marco_color
            grosor_marco_final = preset_def.marco_grosor

    # 2. Ajustes manuales tonales base
    resultado = procesar_ajustes(imagen_base, factores)

    # 3. Aplicación del preset estilístico (sin el marco todavía, para procesar la foto pura)
    if preset_activo and preset_activo != "ninguno":
        siguiente = procesar_preset(
            resultado,
            preset_activo,
            preset_intensidad,
            aplicar_marco_preset=False,
        )
        if resultado is not imagen_base and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    # 4. Color, B&N y Detalle
    siguiente = procesar_color(resultado, temperatura, tinte, mezcla_color)
    if resultado is not imagen_base and resultado is not siguiente:
        resultado.close()
    resultado = siguiente

    if byn_activo:
        siguiente = procesar_byn(
            resultado,
            activo=True,
            canales=byn_canales,
            virado=byn_virado,
            virado_intensidad=byn_virado_intensidad,
        )
        if resultado is not imagen_base and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    siguiente = procesar_detalle(resultado, factores)
    if resultado is not imagen_base and resultado is not siguiente:
        resultado.close()
    resultado = siguiente

    # 5. Dithering retro manual si está activo (si no, el preset ya aplicó su dither si correspondía)
    if dither_algoritmo and dither_algoritmo != "ninguno":
        siguiente = aplicar_dithering(
            resultado,
            dither_algoritmo,
            dither_paleta,
            dither_pixel,
            dither_intensidad,
        )
        if resultado is not imagen_base and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    # 6. Marco decorativo final limpio (del preset o del selector manual)
    if estilo_marco_final and estilo_marco_final != "ninguno":
        siguiente = aplicar_marco(resultado, estilo_marco_final, color_marco_final, grosor_marco_final)
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
            vista_original=vista,
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

    factores = calcular_factores(ajustes_actualizados)

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
            imagen_guardada.dither_intensidad,
            temperatura=imagen_guardada.temperatura,
            tinte=imagen_guardada.tinte,
            mezcla_color=imagen_guardada.mezcla_color,
            marco_estilo=imagen_guardada.marco_estilo,
            marco_color=imagen_guardada.marco_color,
            marco_grosor=imagen_guardada.marco_grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=imagen_guardada.preset_activo,
            preset_intensidad=imagen_guardada.preset_intensidad,
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
            min_val = 0 if nombre == "grano" else -100
            if (
                not isinstance(valor_slider, bool)
                and isinstance(valor_slider, (int, float))
                and min_val <= valor_slider <= 100
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


@app.get("/original/<imagen_id>")
def ver_original(imagen_id: str):
    with imagenes_lock:
        imagen = imagenes_guardadas.get(imagen_id)

    if imagen is None:
        return respuesta_error(
            "IMAGEN_NO_ENCONTRADA",
            "La imagen ya no está disponible. Vuelve a cargarla.",
            404,
        )

    if imagen.vista_original:
        respuesta = app.response_class(imagen.vista_original, mimetype="image/jpeg")
        respuesta.headers["Cache-Control"] = "no-store"
        return respuesta

    img = None
    try:
        img = abrir_imagen(imagen.original)
        vista_orig, _, _ = generar_vista(img)
        respuesta = app.response_class(vista_orig, mimetype="image/jpeg")
        respuesta.headers["Cache-Control"] = "no-store"
        return respuesta
    except Exception:
        respuesta = app.response_class(imagen.original, mimetype="image/jpeg")
        respuesta.headers["Cache-Control"] = "no-store"
        return respuesta
    finally:
        if img is not None:
            img.close()


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
        vista_original_rec, _, _ = generar_vista(original_recortado)

        imagen_actualizada = replace(
            imagen_guardada,
            original=nuevo_original,
            procesada=nueva_procesada,
            vista=vista,
            vista_original=vista_original_rec,
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
        vista_original_inic, _, _ = generar_vista(imagen)
        factores = calcular_factores(imagen_guardada.ajustes)
        resultado = ejecutar_pipeline(
            imagen,
            factores,
            imagen_guardada.dither_algoritmo,
            imagen_guardada.dither_paleta,
            imagen_guardada.dither_pixel,
            imagen_guardada.dither_intensidad,
            temperatura=imagen_guardada.temperatura,
            tinte=imagen_guardada.tinte,
            mezcla_color=imagen_guardada.mezcla_color,
            marco_estilo=imagen_guardada.marco_estilo,
            marco_color=imagen_guardada.marco_color,
            marco_grosor=imagen_guardada.marco_grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=imagen_guardada.preset_activo,
            preset_intensidad=imagen_guardada.preset_intensidad,
        )

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            original=imagen_guardada.original_inicial,
            procesada=procesada,
            vista=vista,
            vista_original=vista_original_inic,
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
        nueva_inic = funcion_voltear(imagen_inicial)

        if imagen_guardada.marco_estilo != "ninguno":
            factores = calcular_factores(imagen_guardada.ajustes)
            nueva_proc = ejecutar_pipeline(
                nueva_orig,
                factores,
                imagen_guardada.dither_algoritmo,
                imagen_guardada.dither_paleta,
                imagen_guardada.dither_pixel,
                imagen_guardada.dither_intensidad,
                temperatura=imagen_guardada.temperatura,
                tinte=imagen_guardada.tinte,
                mezcla_color=imagen_guardada.mezcla_color,
                marco_estilo=imagen_guardada.marco_estilo,
                marco_color=imagen_guardada.marco_color,
                marco_grosor=imagen_guardada.marco_grosor,
                byn_activo=imagen_guardada.byn_activo,
                byn_canales=imagen_guardada.byn_canales,
                byn_virado=imagen_guardada.byn_virado,
                byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
                preset_activo=imagen_guardada.preset_activo,
                preset_intensidad=imagen_guardada.preset_intensidad,
            )
        else:
            nueva_proc = funcion_voltear(imagen_procesada)
        nuevo_original = guardar_procesada_sin_perdida(nueva_orig)
        nueva_procesada = guardar_procesada_sin_perdida(nueva_proc)
        nuevo_inicial = guardar_procesada_sin_perdida(nueva_inic)
        vista, ancho_v, alto_v = generar_vista(nueva_proc)
        vista_orig_vol, _, _ = generar_vista(nueva_orig)
        imagen_actualizada = replace(
            imagen_guardada,
            original=nuevo_original,
            procesada=nueva_procesada,
            vista=vista,
            vista_original=vista_orig_vol,
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
            min_val = 0 if nombre == "grano" else -100
            if (
                isinstance(valor_slider, bool)
                or not isinstance(valor_slider, (int, float))
                or not min_val <= valor_slider <= 100
                or not math.isfinite(valor_slider)
            ):
                return respuesta_error(
                    "FACTOR_INVALIDO",
                    f"El ajuste de {etiqueta} debe estar entre {min_val} y 100.",
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
    "matrix",
    "vaporwave",
    "termica",
}


@app.post("/imagen/<imagen_id>/dithering")
def aplicar_dithering_ruta(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos del efecto no son válidos.", 400)

    algoritmo = datos.get("algoritmo", "ninguno")
    paleta = datos.get("paleta", "bn")
    tamano_pixel = datos.get("tamano_pixel", 1)
    intensidad = datos.get("intensidad", 100)

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

    if (
        isinstance(intensidad, bool)
        or not isinstance(intensidad, int)
        or not 0 <= intensidad <= 100
    ):
        return respuesta_error("INTENSIDAD_INVALIDA", "La intensidad del dither debe ser un número entre 0 y 100.", 400)

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible. Vuelve a cargarla.", 404)

    if (
        imagen_guardada.dither_algoritmo == algoritmo
        and imagen_guardada.dither_paleta == paleta
        and imagen_guardada.dither_pixel == tamano_pixel
        and imagen_guardada.dither_intensidad == intensidad
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
        factores = calcular_factores(imagen_guardada.ajustes)
        resultado = ejecutar_pipeline(
            imagen,
            factores,
            algoritmo,
            paleta,
            tamano_pixel,
            intensidad,
            temperatura=imagen_guardada.temperatura,
            tinte=imagen_guardada.tinte,
            mezcla_color=imagen_guardada.mezcla_color,
            marco_estilo=imagen_guardada.marco_estilo,
            marco_color=imagen_guardada.marco_color,
            marco_grosor=imagen_guardada.marco_grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=imagen_guardada.preset_activo,
            preset_intensidad=imagen_guardada.preset_intensidad,
        )

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
            dither_intensidad=intensidad,
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


@app.post("/imagen/<imagen_id>/color")
def aplicar_color(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos de color no son válidos.", 400)

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible.", 404)

    temperatura_val = datos.get("temperatura", imagen_guardada.temperatura)
    tinte_val = datos.get("tinte", imagen_guardada.tinte)

    if (
        isinstance(temperatura_val, bool)
        or not isinstance(temperatura_val, (int, float))
        or not math.isfinite(temperatura_val)
        or not -100 <= temperatura_val <= 100
    ):
        return respuesta_error("VALOR_INVALIDO", "La temperatura debe estar entre -100 y 100.", 400)
    if (
        isinstance(tinte_val, bool)
        or not isinstance(tinte_val, (int, float))
        or not math.isfinite(tinte_val)
        or not -100 <= tinte_val <= 100
    ):
        return respuesta_error("VALOR_INVALIDO", "El tinte debe estar entre -100 y 100.", 400)

    temperatura = float(temperatura_val)
    tinte = float(tinte_val)

    mezcla_raw = datos.get("mezcla_color", imagen_guardada.mezcla_color)
    mezcla_color = {}
    if isinstance(mezcla_raw, dict):
        for canal in COLORES_CANALES:
            c_datos = mezcla_raw.get(canal, {})
            if isinstance(c_datos, dict):
                canal_ajustes = {}
                for param in ("tono", "saturacion", "luminancia"):
                    val = c_datos.get(param, 0.0)
                    if not isinstance(val, bool) and isinstance(val, (int, float)) and math.isfinite(val) and -100 <= val <= 100:
                        canal_ajustes[param] = float(val)
                    else:
                        canal_ajustes[param] = 0.0
                mezcla_color[canal] = canal_ajustes

    factores = calcular_factores(imagen_guardada.ajustes)

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
            imagen_guardada.dither_intensidad,
            temperatura=temperatura,
            tinte=tinte,
            mezcla_color=mezcla_color,
            marco_estilo=imagen_guardada.marco_estilo,
            marco_color=imagen_guardada.marco_color,
            marco_grosor=imagen_guardada.marco_grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=imagen_guardada.preset_activo,
            preset_intensidad=imagen_guardada.preset_intensidad,
        )

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            procesada=procesada,
            vista=vista,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            temperatura=temperatura,
            tinte=tinte,
            mezcla_color=mezcla_color,
            marco_estilo=imagen_guardada.marco_estilo,
            marco_color=imagen_guardada.marco_color,
            marco_grosor=imagen_guardada.marco_grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=imagen_guardada.preset_activo,
            preset_intensidad=imagen_guardada.preset_intensidad,
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
            temperatura=temperatura,
            tinte=tinte,
            mezcla_color=mezcla_color,
            marco_estilo=imagen_guardada.marco_estilo,
            marco_color=imagen_guardada.marco_color,
            marco_grosor=imagen_guardada.marco_grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=imagen_guardada.preset_activo,
            preset_intensidad=imagen_guardada.preset_intensidad,
        )
    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error al procesar balance y mezcla de color.")
        return respuesta_error(
            "ERROR_INTERNO",
            "No se pudieron aplicar los ajustes de color a la imagen.",
            500,
        )
    finally:
        if resultado is not None and resultado is not imagen:
            resultado.close()
        if imagen is not None:
            imagen.close()


@app.post("/imagen/<imagen_id>/marco")
def aplicar_marco_ruta(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos del marco no son válidos.", 400)

    estilo = str(datos.get("estilo", "ninguno")).strip().lower()
    color = str(datos.get("color", "#ffffff")).strip()
    try:
        grosor = int(datos.get("grosor", 24))
    except (ValueError, TypeError):
        grosor = 24

    if estilo not in ESTILOS_MARCO:
        return respuesta_error("ESTILO_INVALIDO", "El estilo de marco seleccionado no es válido.", 400)

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible.", 404)

    factores = calcular_factores(imagen_guardada.ajustes)

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
            imagen_guardada.dither_intensidad,
            temperatura=imagen_guardada.temperatura,
            tinte=imagen_guardada.tinte,
            mezcla_color=imagen_guardada.mezcla_color,
            marco_estilo=estilo,
            marco_color=color,
            marco_grosor=grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=imagen_guardada.preset_activo,
            preset_intensidad=imagen_guardada.preset_intensidad,
        )

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            procesada=procesada,
            vista=vista,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            marco_estilo=estilo,
            marco_color=color,
            marco_grosor=grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=imagen_guardada.preset_activo,
            preset_intensidad=imagen_guardada.preset_intensidad,
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
            marco_estilo=estilo,
            marco_color=color,
            marco_grosor=grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=imagen_guardada.preset_activo,
            preset_intensidad=imagen_guardada.preset_intensidad,
        )
    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error al aplicar marco decorativo a la imagen.")
        return respuesta_error(
            "ERROR_INTERNO",
            "No se pudo aplicar el marco decorativo a la imagen.",
            500,
        )
    finally:
        if resultado is not None and resultado is not imagen:
            resultado.close()
        if imagen is not None:
            imagen.close()


@app.post("/imagen/<imagen_id>/byn")
def aplicar_byn_ruta(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos de blanco y negro no son válidos.", 400)

    activo = bool(datos.get("activo", False))
    virado = str(datos.get("virado", "ninguno")).strip().lower()
    try:
        virado_intensidad = float(datos.get("virado_intensidad", 70.0))
    except (ValueError, TypeError):
        virado_intensidad = 70.0

    canales_raw = datos.get("canales", {})
    canales = {}
    if isinstance(canales_raw, dict):
        for c in COLORES_CANALES:
            val = canales_raw.get(c, 0.0)
            if not isinstance(val, bool) and isinstance(val, (int, float)) and math.isfinite(val) and -100 <= val <= 100:
                canales[c] = float(val)
            else:
                canales[c] = 0.0
    else:
        canales = {c: 0.0 for c in COLORES_CANALES}

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible.", 404)

    factores = calcular_factores(imagen_guardada.ajustes)

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
            imagen_guardada.dither_intensidad,
            temperatura=imagen_guardada.temperatura,
            tinte=imagen_guardada.tinte,
            mezcla_color=imagen_guardada.mezcla_color,
            marco_estilo=imagen_guardada.marco_estilo,
            marco_color=imagen_guardada.marco_color,
            marco_grosor=imagen_guardada.marco_grosor,
            byn_activo=activo,
            byn_canales=canales,
            byn_virado=virado,
            byn_virado_intensidad=virado_intensidad,
        )

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            procesada=procesada,
            vista=vista,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            byn_activo=activo,
            byn_canales=canales,
            byn_virado=virado,
            byn_virado_intensidad=virado_intensidad,
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
            byn_activo=activo,
            byn_canales=canales,
            byn_virado=virado,
            byn_virado_intensidad=virado_intensidad,
        )
    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error al aplicar blanco y negro a la imagen.")
        return respuesta_error(
            "ERROR_INTERNO",
            "No se pudieron aplicar los ajustes de blanco y negro.",
            500,
        )
    finally:
        if resultado is not None and resultado is not imagen:
            resultado.close()
        if imagen is not None:
            imagen.close()


@app.get("/presets")
def listar_presets():
    from presets import _PRESETS_BASE
    return jsonify(
        ok=True,
        presets=[
            {
                "id": p.id,
                "nombre": p.nombre,
                "subtitulo": p.subtitulo,
                "categoria": p.categoria,
                "color_acento": p.color_acento,
                "icon": p.icon,
                "swatch_gradient": p.swatch_gradient,
                "herramientas": list(p.herramientas),
                "marco_estilo": p.marco_estilo,
                "dither_algoritmo": p.dither_algoritmo,
                "byn_activo": p.byn_activo,
            }
            for p in _PRESETS_BASE.values()
        ],
    )


@app.post("/imagen/<imagen_id>/preset")
def aplicar_preset_ruta(imagen_id: str):
    datos = request.get_json(silent=True) or {}
    preset_id = str(datos.get("preset", "ninguno")).strip().lower()
    try:
        intensidad = float(datos.get("intensidad", 100.0))
        intensidad = max(0.0, min(100.0, intensidad))
    except (ValueError, TypeError):
        intensidad = 100.0

    if preset_id != "ninguno" and preset_id not in PRESETS_DISPONIBLES:
        return respuesta_error("PRESET_INVALIDO", f"El estilo '{preset_id}' no es válido.", 400)

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible.", 404)

    factores = calcular_factores(imagen_guardada.ajustes)

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
            imagen_guardada.dither_intensidad,
            temperatura=imagen_guardada.temperatura,
            tinte=imagen_guardada.tinte,
            mezcla_color=imagen_guardada.mezcla_color,
            marco_estilo=imagen_guardada.marco_estilo,
            marco_color=imagen_guardada.marco_color,
            marco_grosor=imagen_guardada.marco_grosor,
            byn_activo=imagen_guardada.byn_activo,
            byn_canales=imagen_guardada.byn_canales,
            byn_virado=imagen_guardada.byn_virado,
            byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            preset_activo=preset_id,
            preset_intensidad=intensidad,
        )

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            procesada=procesada,
            vista=vista,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            preset_activo=preset_id,
            preset_intensidad=intensidad,
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
            preset=preset_id,
            intensidad=intensidad,
        )
    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error al aplicar el estilo a la imagen.")
        return respuesta_error(
            "ERROR_INTERNO",
            "No se pudo aplicar el estilo a la imagen.",
            500,
        )
    finally:
        if resultado is not None and resultado is not imagen:
            resultado.close()
        if imagen is not None:
            imagen.close()


if __name__ == "__main__":
    app.run(debug=True)