from collections import OrderedDict
from dataclasses import dataclass, field, replace
import math
from pathlib import Path
import re
from threading import Lock
import uuid

from flask import Flask, jsonify, render_template, request, url_for

from manejo_imagen import (
    ErrorImagen,
    abrir_imagen,
    generar_vista,
    guardar_procesada_sin_perdida,
)
from ajustes_imagen import (
    AJUSTES_DISPONIBLES,
    AJUSTES_TONO_AVANZADO,
    procesar_ajustes,
    slider_a_factor,
)
from geometria import aplicar_enderezado, rotar_90
from optica import aplicar_scanlines, procesar_optica_lente
from recortar import aplicar_recorte
from voltear_imagen import voltear_horizontal, voltear_vertical
from detalle import AJUSTES_DETALLE, procesar_detalle
from dithering import aplicar_dithering
from color_mixer import COLORES_CANALES, procesar_color
from marcos import ESTILOS_MARCO, aplicar_marco
from byn import FILTROS_BYN, VIRADOS_BYN, procesar_byn
from presets import PRESETS_DISPONIBLES, procesar_preset

_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

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
    dither_umbral: int = 0
    dither_duotono_oscuro: str = "#0a0a10"
    dither_duotono_claro: str = "#f2f2ea"
    angulo: float = 0.0
    halacion: float = 0.0
    aberracion: float = 0.0
    scanlines: float = 0.0
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
    pre_recorte_original: bytes = b""
    pre_recorte_procesada: bytes = b""
    pre_recorte_vista: bytes = b""
    pre_recorte_vista_original: bytes = b""
    pre_recorte_ancho: int = 0
    pre_recorte_alto: int = 0
    pre_recorte_ancho_vista: int = 0
    pre_recorte_alto_vista: int = 0
    pre_recorte_ajustes: dict[str, float] = field(default_factory=dict)
    pre_recorte_dither_algoritmo: str = "ninguno"
    pre_recorte_dither_paleta: str = "bn"
    pre_recorte_dither_pixel: int = 1
    pre_recorte_dither_intensidad: int = 100
    pre_recorte_dither_umbral: int = 0
    pre_recorte_dither_duotono_oscuro: str = "#0a0a10"
    pre_recorte_dither_duotono_claro: str = "#f2f2ea"
    pre_recorte_angulo: float = 0.0
    pre_recorte_halacion: float = 0.0
    pre_recorte_aberracion: float = 0.0
    pre_recorte_scanlines: float = 0.0
    pre_recorte_temperatura: float = 0.0
    pre_recorte_tinte: float = 0.0
    pre_recorte_mezcla_color: dict[str, dict[str, float]] = field(default_factory=dict)
    pre_recorte_marco_estilo: str = "ninguno"
    pre_recorte_marco_color: str = "#ffffff"
    pre_recorte_marco_grosor: int = 24
    pre_recorte_byn_activo: bool = False
    pre_recorte_byn_canales: dict[str, float] = field(default_factory=dict)
    pre_recorte_byn_virado: str = "ninguno"
    pre_recorte_byn_virado_intensidad: float = 70.0
    pre_recorte_preset_activo: str = "ninguno"
    pre_recorte_preset_intensidad: float = 100.0
    pre_recorte_fue_recortada: bool = False


AJUSTES_DEFECTO: dict[str, float] = {
    "brillo": 0.0,
    "contraste": 0.0,
    "saturacion": 0.0,
    "altas_luces": 0.0,
    "sombras": 0.0,
    "fade": 0.0,
    "vineta": 0.0,
    "desenfoque": 0.0,
    "nitidez": 0.0,
    "grano": 0.0,
}


def calcular_factores(ajustes: dict[str, float]) -> dict[str, float]:
    factores = {}
    for nombre, val in ajustes.items():
        if nombre == "grano" or nombre in AJUSTES_TONO_AVANZADO:
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
    dither_umbral: int = 0,
    dither_duotono_oscuro: str = "#0a0a10",
    dither_duotono_claro: str = "#f2f2ea",
    angulo: float = 0.0,
    halacion: float = 0.0,
    aberracion: float = 0.0,
    scanlines: float = 0.0,
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

    # 2. Geometría no destructiva (enderezado de horizonte sin bordes negros)
    resultado = imagen_base
    if abs(angulo) >= 0.05:
        resultado = aplicar_enderezado(imagen_base, angulo)

    # 3. Ajustes manuales tonales base y avanzados
    siguiente = procesar_ajustes(resultado, factores)
    if resultado is not imagen_base and resultado is not siguiente:
        resultado.close()
    resultado = siguiente

    # 4. Aplicación del preset estilístico (sin el marco todavía, para procesar la foto pura)
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

    # 5. Color, B&N y Detalle
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

    # 6. Efectos ópticos analógicos (halación y aberración cromática)
    if halacion > 0.0 or aberracion > 0.0:
        siguiente = procesar_optica_lente(resultado, halacion=halacion, aberracion=aberracion)
        if resultado is not imagen_base and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    # 7. Dithering retro manual si está activo
    if dither_algoritmo and dither_algoritmo != "ninguno":
        siguiente = aplicar_dithering(
            resultado,
            dither_algoritmo,
            dither_paleta,
            dither_pixel,
            dither_intensidad,
            umbral=dither_umbral,
            duotono_oscuro=dither_duotono_oscuro,
            duotono_claro=dither_duotono_claro,
        )
        if resultado is not imagen_base and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    # 8. Scanlines CRT después del dithering para conservar líneas limpias
    if scanlines > 0.0:
        siguiente = aplicar_scanlines(resultado, scanlines)
        if resultado is not imagen_base and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    # 9. Marco decorativo final limpio (del preset o del selector manual)
    if estilo_marco_final and estilo_marco_final != "ninguno":
        siguiente = aplicar_marco(resultado, estilo_marco_final, color_marco_final, grosor_marco_final)
        if resultado is not imagen_base and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    return resultado


def ejecutar_pipeline_desde_estado(imagen_base, estado: ImagenGuardada, **overrides):
    """Ejecuta el pipeline completo leyendo los parámetros de ImagenGuardada más cualquier override."""
    ajustes = overrides.get("ajustes", estado.ajustes)
    return ejecutar_pipeline(
        imagen_base,
        calcular_factores(ajustes),
        dither_algoritmo=overrides.get("dither_algoritmo", estado.dither_algoritmo),
        dither_paleta=overrides.get("dither_paleta", estado.dither_paleta),
        dither_pixel=overrides.get("dither_pixel", estado.dither_pixel),
        dither_intensidad=overrides.get("dither_intensidad", estado.dither_intensidad),
        temperatura=overrides.get("temperatura", estado.temperatura),
        tinte=overrides.get("tinte", estado.tinte),
        mezcla_color=overrides.get("mezcla_color", estado.mezcla_color),
        marco_estilo=overrides.get("marco_estilo", estado.marco_estilo),
        marco_color=overrides.get("marco_color", estado.marco_color),
        marco_grosor=overrides.get("marco_grosor", estado.marco_grosor),
        byn_activo=overrides.get("byn_activo", estado.byn_activo),
        byn_canales=overrides.get("byn_canales", estado.byn_canales),
        byn_virado=overrides.get("byn_virado", estado.byn_virado),
        byn_virado_intensidad=overrides.get("byn_virado_intensidad", estado.byn_virado_intensidad),
        preset_activo=overrides.get("preset_activo", estado.preset_activo),
        preset_intensidad=overrides.get("preset_intensidad", estado.preset_intensidad),
        dither_umbral=overrides.get("dither_umbral", estado.dither_umbral),
        dither_duotono_oscuro=overrides.get("dither_duotono_oscuro", estado.dither_duotono_oscuro),
        dither_duotono_claro=overrides.get("dither_duotono_claro", estado.dither_duotono_claro),
        angulo=overrides.get("angulo", estado.angulo),
        halacion=overrides.get("halacion", estado.halacion),
        aberracion=overrides.get("aberracion", estado.aberracion),
        scanlines=overrides.get("scanlines", estado.scanlines),
    )


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


EXTENSIONES_AUDIO = {".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac", ".webm"}


def _clave_orden_natural(nombre: str) -> list[tuple[int, int | str]]:
    partes = re.split(r"(\d+)", nombre)
    return [(0, int(p)) if p.isdigit() else (1, p.lower()) for p in partes]


@app.get("/api/music")
def listar_musica():
    carpeta = Path(app.static_folder or "static") / "music"
    tracks: list[dict[str, str]] = []
    if carpeta.is_dir():
        entradas = sorted(
            (e for e in carpeta.iterdir() if e.is_file() and not e.name.startswith(".")),
            key=lambda p: _clave_orden_natural(p.name),
        )
        for entrada in entradas:
            if entrada.suffix.lower() not in EXTENSIONES_AUDIO:
                continue
            titulo = re.sub(r"[_]+", " ", entrada.stem).strip() or entrada.name
            tracks.append(
                {
                    "id": f"folder:{entrada.name}",
                    "title": titulo,
                    "filename": entrada.name,
                    "url": url_for("static", filename=f"music/{entrada.name}"),
                    "source": "folder",
                }
            )
    resp = jsonify(ok=True, tracks=tracks)
    resp.headers["Cache-Control"] = "no-store"
    return resp


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

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original)
        resultado = ejecutar_pipeline_desde_estado(imagen, imagen_guardada, ajustes=ajustes_actualizados)

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

    for nombre, (etiqueta, min_val, max_val) in AJUSTES_TONO_AVANZADO.items():
        if nombre in datos:
            valor_slider = datos.get(nombre)
            if (
                isinstance(valor_slider, bool)
                or not isinstance(valor_slider, (int, float))
                or not min_val <= valor_slider <= max_val
                or not math.isfinite(valor_slider)
            ):
                return respuesta_error(
                    "FACTOR_INVALIDO",
                    f"El ajuste de {etiqueta} debe estar entre {int(min_val)} y {int(max_val)}.",
                    400,
                )
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
        if abs(imagen_guardada.angulo) >= 0.05:
            enderezada = aplicar_enderezado(imagen_original, imagen_guardada.angulo)
            if enderezada is not imagen_original:
                imagen_original.close()
                imagen_original = enderezada
        imagen_procesada = abrir_imagen(imagen_guardada.procesada)

        if imagen_original.size == imagen_procesada.size:
            if x + ancho > imagen_original.width or y + alto > imagen_original.height:
                return respuesta_error(
                    "RECORTE_FUERA_DE_IMAGEN",
                    "El área seleccionada excede los límites de la imagen.",
                    400,
                )
            original_recortado = aplicar_recorte(imagen_original, x, y, ancho, alto)
            procesada_recortada = aplicar_recorte(imagen_procesada, x, y, ancho, alto)
            ajustes_final = imagen_guardada.ajustes
            marco_final = imagen_guardada.marco_estilo
            preset_final = imagen_guardada.preset_activo
            dither_algo_final = imagen_guardada.dither_algoritmo
            dither_pal_final = imagen_guardada.dither_paleta
            dither_pix_final = imagen_guardada.dither_pixel
            dither_int_final = imagen_guardada.dither_intensidad
            dither_umbral_final = imagen_guardada.dither_umbral
            dither_duo_osc_final = imagen_guardada.dither_duotono_oscuro
            dither_duo_cla_final = imagen_guardada.dither_duotono_claro
            halacion_final = imagen_guardada.halacion
            aberracion_final = imagen_guardada.aberracion
            scanlines_final = imagen_guardada.scanlines
            temp_final = imagen_guardada.temperatura
            tinte_final = imagen_guardada.tinte
            mezcla_final = imagen_guardada.mezcla_color
            byn_act_final = imagen_guardada.byn_activo
            byn_can_final = imagen_guardada.byn_canales
            byn_vir_final = imagen_guardada.byn_virado
            byn_vir_int_final = imagen_guardada.byn_virado_intensidad
            preset_int_final = imagen_guardada.preset_intensidad
        else:
            if x + ancho > imagen_procesada.width or y + alto > imagen_procesada.height:
                return respuesta_error(
                    "RECORTE_FUERA_DE_IMAGEN",
                    "El área seleccionada excede los límites de la imagen.",
                    400,
                )
            procesada_recortada = aplicar_recorte(imagen_procesada, x, y, ancho, alto)
            original_recortado = procesada_recortada.copy()
            ajustes_final = dict(AJUSTES_DEFECTO)
            marco_final = "ninguno"
            preset_final = "ninguno"
            dither_algo_final = "ninguno"
            dither_pal_final = "bn"
            dither_pix_final = 1
            dither_int_final = 100
            dither_umbral_final = 0
            dither_duo_osc_final = "#0a0a10"
            dither_duo_cla_final = "#f2f2ea"
            halacion_final = 0.0
            aberracion_final = 0.0
            scanlines_final = 0.0
            temp_final = 0.0
            tinte_final = 0.0
            mezcla_final = {}
            byn_act_final = False
            byn_canales = {}
            byn_can_final = byn_canales
            byn_vir_final = "ninguno"
            byn_vir_int_final = 70.0
            preset_int_final = 100.0

        nuevo_ancho, nuevo_alto = procesada_recortada.size
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
            angulo=0.0,
            ajustes=ajustes_final,
            marco_estilo=marco_final,
            preset_activo=preset_final,
            dither_algoritmo=dither_algo_final,
            dither_paleta=dither_pal_final,
            dither_pixel=dither_pix_final,
            dither_intensidad=dither_int_final,
            dither_umbral=dither_umbral_final,
            dither_duotono_oscuro=dither_duo_osc_final,
            dither_duotono_claro=dither_duo_cla_final,
            halacion=halacion_final,
            aberracion=aberracion_final,
            scanlines=scanlines_final,
            temperatura=temp_final,
            tinte=tinte_final,
            mezcla_color=mezcla_final,
            byn_activo=byn_act_final,
            byn_canales=byn_can_final,
            byn_virado=byn_vir_final,
            byn_virado_intensidad=byn_vir_int_final,
            preset_intensidad=preset_int_final,
            pre_recorte_original=imagen_guardada.original,
            pre_recorte_procesada=imagen_guardada.procesada,
            pre_recorte_vista=imagen_guardada.vista,
            pre_recorte_vista_original=imagen_guardada.vista_original,
            pre_recorte_ancho=imagen_guardada.ancho,
            pre_recorte_alto=imagen_guardada.alto,
            pre_recorte_ancho_vista=imagen_guardada.ancho_vista,
            pre_recorte_alto_vista=imagen_guardada.alto_vista,
            pre_recorte_ajustes=dict(imagen_guardada.ajustes),
            pre_recorte_dither_algoritmo=imagen_guardada.dither_algoritmo,
            pre_recorte_dither_paleta=imagen_guardada.dither_paleta,
            pre_recorte_dither_pixel=imagen_guardada.dither_pixel,
            pre_recorte_dither_intensidad=imagen_guardada.dither_intensidad,
            pre_recorte_dither_umbral=imagen_guardada.dither_umbral,
            pre_recorte_dither_duotono_oscuro=imagen_guardada.dither_duotono_oscuro,
            pre_recorte_dither_duotono_claro=imagen_guardada.dither_duotono_claro,
            pre_recorte_angulo=imagen_guardada.angulo,
            pre_recorte_halacion=imagen_guardada.halacion,
            pre_recorte_aberracion=imagen_guardada.aberracion,
            pre_recorte_scanlines=imagen_guardada.scanlines,
            pre_recorte_temperatura=imagen_guardada.temperatura,
            pre_recorte_tinte=imagen_guardada.tinte,
            pre_recorte_mezcla_color=dict(imagen_guardada.mezcla_color),
            pre_recorte_marco_estilo=imagen_guardada.marco_estilo,
            pre_recorte_marco_color=imagen_guardada.marco_color,
            pre_recorte_marco_grosor=imagen_guardada.marco_grosor,
            pre_recorte_byn_activo=imagen_guardada.byn_activo,
            pre_recorte_byn_canales=dict(imagen_guardada.byn_canales),
            pre_recorte_byn_virado=imagen_guardada.byn_virado,
            pre_recorte_byn_virado_intensidad=imagen_guardada.byn_virado_intensidad,
            pre_recorte_preset_activo=imagen_guardada.preset_activo,
            pre_recorte_preset_intensidad=imagen_guardada.preset_intensidad,
            pre_recorte_fue_recortada=imagen_guardada.fue_recortada,
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

    if not imagen_guardada.fue_recortada and not imagen_guardada.pre_recorte_procesada:
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
        if imagen_guardada.pre_recorte_procesada:
            imagen_actualizada = replace(
                imagen_guardada,
                original=imagen_guardada.pre_recorte_original,
                procesada=imagen_guardada.pre_recorte_procesada,
                vista=imagen_guardada.pre_recorte_vista,
                vista_original=imagen_guardada.pre_recorte_vista_original,
                ancho=imagen_guardada.pre_recorte_ancho,
                alto=imagen_guardada.pre_recorte_alto,
                ancho_vista=imagen_guardada.pre_recorte_ancho_vista,
                alto_vista=imagen_guardada.pre_recorte_alto_vista,
                ajustes=dict(imagen_guardada.pre_recorte_ajustes),
                dither_algoritmo=imagen_guardada.pre_recorte_dither_algoritmo,
                dither_paleta=imagen_guardada.pre_recorte_dither_paleta,
                dither_pixel=imagen_guardada.pre_recorte_dither_pixel,
                dither_intensidad=imagen_guardada.pre_recorte_dither_intensidad,
                dither_umbral=imagen_guardada.pre_recorte_dither_umbral,
                dither_duotono_oscuro=imagen_guardada.pre_recorte_dither_duotono_oscuro,
                dither_duotono_claro=imagen_guardada.pre_recorte_dither_duotono_claro,
                angulo=imagen_guardada.pre_recorte_angulo,
                halacion=imagen_guardada.pre_recorte_halacion,
                aberracion=imagen_guardada.pre_recorte_aberracion,
                scanlines=imagen_guardada.pre_recorte_scanlines,
                temperatura=imagen_guardada.pre_recorte_temperatura,
                tinte=imagen_guardada.pre_recorte_tinte,
                mezcla_color=dict(imagen_guardada.pre_recorte_mezcla_color),
                marco_estilo=imagen_guardada.pre_recorte_marco_estilo,
                marco_color=imagen_guardada.pre_recorte_marco_color,
                marco_grosor=imagen_guardada.pre_recorte_marco_grosor,
                byn_activo=imagen_guardada.pre_recorte_byn_activo,
                byn_canales=dict(imagen_guardada.pre_recorte_byn_canales),
                byn_virado=imagen_guardada.pre_recorte_byn_virado,
                byn_virado_intensidad=imagen_guardada.pre_recorte_byn_virado_intensidad,
                preset_activo=imagen_guardada.pre_recorte_preset_activo,
                preset_intensidad=imagen_guardada.pre_recorte_preset_intensidad,
                fue_recortada=imagen_guardada.pre_recorte_fue_recortada,
                pre_recorte_original=b"",
                pre_recorte_procesada=b"",
                pre_recorte_vista=b"",
                pre_recorte_vista_original=b"",
            )
        else:
            imagen = abrir_imagen(imagen_guardada.original_inicial)
            vista_original_inic, _, _ = generar_vista(imagen)
            resultado = ejecutar_pipeline_desde_estado(imagen, imagen_guardada)

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
            ancho=imagen_actualizada.ancho,
            alto=imagen_actualizada.alto,
            ancho_vista=imagen_actualizada.ancho_vista,
            alto_vista=imagen_actualizada.alto_vista,
            fue_recortada=imagen_actualizada.fue_recortada,
            ajustes=imagen_actualizada.ajustes,
            dither_algoritmo=imagen_actualizada.dither_algoritmo,
            dither_paleta=imagen_actualizada.dither_paleta,
            dither_pixel=imagen_actualizada.dither_pixel,
            dither_intensidad=imagen_actualizada.dither_intensidad,
            dither_umbral=imagen_actualizada.dither_umbral,
            dither_duotono_oscuro=imagen_actualizada.dither_duotono_oscuro,
            dither_duotono_claro=imagen_actualizada.dither_duotono_claro,
            angulo=imagen_actualizada.angulo,
            halacion=imagen_actualizada.halacion,
            aberracion=imagen_actualizada.aberracion,
            scanlines=imagen_actualizada.scanlines,
            temperatura=imagen_actualizada.temperatura,
            tinte=imagen_actualizada.tinte,
            mezcla_color=imagen_actualizada.mezcla_color,
            marco_estilo=imagen_actualizada.marco_estilo,
            marco_color=imagen_actualizada.marco_color,
            marco_grosor=imagen_actualizada.marco_grosor,
            byn_activo=imagen_actualizada.byn_activo,
            byn_canales=imagen_actualizada.byn_canales,
            byn_virado=imagen_actualizada.byn_virado,
            byn_virado_intensidad=imagen_actualizada.byn_virado_intensidad,
            preset_activo=imagen_actualizada.preset_activo,
            preset_intensidad=imagen_actualizada.preset_intensidad,
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
        nuevo_angulo = -imagen_guardada.angulo if abs(imagen_guardada.angulo) >= 0.05 else 0.0

        if (
            imagen_guardada.marco_estilo != "ninguno"
            or abs(nuevo_angulo) >= 0.05
            or imagen_guardada.aberracion > 0
            or imagen_guardada.halacion > 0
        ):
            nueva_proc = ejecutar_pipeline_desde_estado(
                nueva_orig, imagen_guardada, angulo=nuevo_angulo
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
            angulo=nuevo_angulo,
            ancho_vista=ancho_v,
            alto_vista=alto_v,
        )
        with imagenes_lock:
            imagenes_guardadas[imagen_id] = imagen_actualizada
        return jsonify(
            ok=True,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
            angulo=nuevo_angulo,
            ancho_vista=ancho_v,
            alto_vista=alto_v,
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
    "duotono",
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
    umbral_raw = datos.get("umbral", 0)
    duotono_oscuro = str(datos.get("duotono_oscuro", "#0a0a10")).strip()
    duotono_claro = str(datos.get("duotono_claro", "#f2f2ea")).strip()

    if not _HEX_COLOR_RE.match(duotono_oscuro):
        duotono_oscuro = "#0a0a10"
    if not _HEX_COLOR_RE.match(duotono_claro):
        duotono_claro = "#f2f2ea"

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

    if (
        isinstance(umbral_raw, bool)
        or not isinstance(umbral_raw, (int, float))
        or not -100 <= umbral_raw <= 100
        or not math.isfinite(umbral_raw)
    ):
        return respuesta_error("UMBRAL_INVALIDO", "El umbral del dither debe estar entre -100 y 100.", 400)
    umbral = int(round(umbral_raw))

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible. Vuelve a cargarla.", 404)

    if (
        imagen_guardada.dither_algoritmo == algoritmo
        and imagen_guardada.dither_paleta == paleta
        and imagen_guardada.dither_pixel == tamano_pixel
        and imagen_guardada.dither_intensidad == intensidad
        and imagen_guardada.dither_umbral == umbral
        and imagen_guardada.dither_duotono_oscuro == duotono_oscuro
        and imagen_guardada.dither_duotono_claro == duotono_claro
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
        resultado = ejecutar_pipeline_desde_estado(
            imagen,
            imagen_guardada,
            dither_algoritmo=algoritmo,
            dither_paleta=paleta,
            dither_pixel=tamano_pixel,
            dither_intensidad=intensidad,
            dither_umbral=umbral,
            dither_duotono_oscuro=duotono_oscuro,
            dither_duotono_claro=duotono_claro,
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
            dither_umbral=umbral,
            dither_duotono_oscuro=duotono_oscuro,
            dither_duotono_claro=duotono_claro,
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

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original)
        resultado = ejecutar_pipeline_desde_estado(
            imagen,
            imagen_guardada,
            temperatura=temperatura,
            tinte=tinte,
            mezcla_color=mezcla_color,
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

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original)
        resultado = ejecutar_pipeline_desde_estado(
            imagen,
            imagen_guardada,
            marco_estilo=estilo,
            marco_color=color,
            marco_grosor=grosor,
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

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original)
        resultado = ejecutar_pipeline_desde_estado(
            imagen,
            imagen_guardada,
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

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original)
        resultado = ejecutar_pipeline_desde_estado(
            imagen,
            imagen_guardada,
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


@app.post("/imagen/<imagen_id>/rotar")
def rotar_imagen_ruta(imagen_id: str):
    datos = request.get_json(silent=True) or {}
    sentido = str(datos.get("sentido", "derecha")).strip().lower()
    if sentido not in ("derecha", "izquierda"):
        sentido = "derecha"

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible.", 404)

    imagen_orig = None
    imagen_inic = None
    nueva_orig = None
    nueva_inic = None
    resultado = None
    try:
        imagen_orig = abrir_imagen(imagen_guardada.original)
        imagen_inic = abrir_imagen(imagen_guardada.original_inicial)
        nueva_orig = rotar_90(imagen_orig, sentido=sentido)
        nueva_inic = rotar_90(imagen_inic, sentido=sentido)

        resultado = ejecutar_pipeline_desde_estado(nueva_orig, imagen_guardada)

        nuevo_original = guardar_procesada_sin_perdida(nueva_orig)
        nuevo_inicial = guardar_procesada_sin_perdida(nueva_inic)
        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)
        vista_original_rot, _, _ = generar_vista(nueva_orig)

        imagen_actualizada = replace(
            imagen_guardada,
            original=nuevo_original,
            original_inicial=nuevo_inicial,
            procesada=procesada,
            vista=vista,
            vista_original=vista_original_rot,
            ancho=resultado.width,
            alto=resultado.height,
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
            ancho=resultado.width,
            alto=resultado.height,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
        )
    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error inesperado al rotar la imagen.")
        return respuesta_error("ERROR_INTERNO", "No se pudo rotar la imagen.", 500)
    finally:
        if resultado is not None and resultado is not nueva_orig:
            resultado.close()
        if nueva_orig is not None and nueva_orig is not imagen_orig:
            nueva_orig.close()
        if nueva_inic is not None and nueva_inic is not imagen_inic:
            nueva_inic.close()
        if imagen_orig is not None:
            imagen_orig.close()
        if imagen_inic is not None:
            imagen_inic.close()


@app.post("/imagen/<imagen_id>/enderezar")
def enderezar_imagen_ruta(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos de rotación no son válidos.", 400)

    angulo_raw = datos.get("angulo", 0.0)
    if (
        isinstance(angulo_raw, bool)
        or not isinstance(angulo_raw, (int, float))
        or not -45.0 <= float(angulo_raw) <= 45.0
        or not math.isfinite(float(angulo_raw))
    ):
        return respuesta_error(
            "ANGULO_INVALIDO",
            "El ángulo de enderezado debe estar entre -45° y 45°.",
            400,
        )
    angulo = round(float(angulo_raw), 2)

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible.", 404)

    if abs(imagen_guardada.angulo - angulo) < 0.01:
        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id, v=uuid.uuid4().hex),
            angulo=imagen_guardada.angulo,
            ancho=imagen_guardada.ancho,
            alto=imagen_guardada.alto,
            ancho_vista=imagen_guardada.ancho_vista,
            alto_vista=imagen_guardada.alto_vista,
            sin_cambios=True,
        )

    imagen = None
    resultado = None
    try:
        imagen = abrir_imagen(imagen_guardada.original)
        resultado = ejecutar_pipeline_desde_estado(imagen, imagen_guardada, angulo=angulo)

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            procesada=procesada,
            vista=vista,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            angulo=angulo,
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
            angulo=angulo,
            ancho=resultado.width,
            alto=resultado.height,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
        )
    except ErrorImagen as error:
        return respuesta_error(error.codigo, error.mensaje, error.status)
    except Exception:
        app.logger.exception("Error inesperado al enderezar el horizonte.")
        return respuesta_error("ERROR_INTERNO", "No se pudo enderezar la imagen.", 500)
    finally:
        if resultado is not None and resultado is not imagen:
            resultado.close()
        if imagen is not None:
            imagen.close()


@app.post("/imagen/<imagen_id>/optica")
def aplicar_optica_ruta(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos ópticos no son válidos.", 400)

    def _leer_pct(clave: str, default: float) -> float | None:
        val = datos.get(clave, default)
        if (
            isinstance(val, bool)
            or not isinstance(val, (int, float))
            or not 0.0 <= float(val) <= 100.0
            or not math.isfinite(float(val))
        ):
            return None
        return float(val)

    with imagenes_lock:
        imagen_guardada = imagenes_guardadas.get(imagen_id)

    if imagen_guardada is None:
        return respuesta_error("IMAGEN_NO_ENCONTRADA", "La imagen ya no está disponible.", 404)

    halacion = _leer_pct("halacion", imagen_guardada.halacion)
    aberracion = _leer_pct("aberracion", imagen_guardada.aberracion)
    scanlines = _leer_pct("scanlines", imagen_guardada.scanlines)

    if halacion is None or aberracion is None or scanlines is None:
        return respuesta_error(
            "PARAMETRO_INVALIDO",
            "Los efectos ópticos deben estar entre 0 y 100.",
            400,
        )

    if (
        imagen_guardada.halacion == halacion
        and imagen_guardada.aberracion == aberracion
        and imagen_guardada.scanlines == scanlines
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
        resultado = ejecutar_pipeline_desde_estado(
            imagen,
            imagen_guardada,
            halacion=halacion,
            aberracion=aberracion,
            scanlines=scanlines,
        )

        procesada = guardar_procesada_sin_perdida(resultado)
        vista, ancho_vista, alto_vista = generar_vista(resultado)

        imagen_actualizada = replace(
            imagen_guardada,
            procesada=procesada,
            vista=vista,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
            halacion=halacion,
            aberracion=aberracion,
            scanlines=scanlines,
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
        app.logger.exception("Error inesperado al aplicar efectos ópticos.")
        return respuesta_error(
            "ERROR_INTERNO",
            "No se pudieron aplicar los efectos ópticos.",
            500,
        )
    finally:
        if resultado is not None and resultado is not imagen:
            resultado.close()
        if imagen is not None:
            imagen.close()


if __name__ == "__main__":
    app.run(debug=True)