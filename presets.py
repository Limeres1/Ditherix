"""
DITHERIX // MOTOR FOTOGRÁFICO DE PRESETS Y ESTILOS DE AUTOR
Presets profesionales multicapa que orquestan el ecosistema completo de Ditherix:
- Curvas tonales fotográficas (brillo, contraste, ambiente, luces, sombras, blancos, negros fade)
- Balance de blancos Kelvin y mezcla de color HSL
- Blanco y negro con filtros ópticos y virados químicos (Cianotipia, Selenio, Sepia, Platino)
- Textura analógica: desenfoque Orton bloom, nitidez de alta frecuencia y grano de 35mm
- Dithering retro con paletas auténticas (Game Boy, CGA, etc.)
- Marcos decorativos procedimentales (Polaroid, Polaroid quemado, Tira de 35mm, Liso)
"""

from __future__ import annotations

from dataclasses import dataclass, field
import numpy as np
from PIL import Image

from detalle import aplicar_grano, aplicar_desenfoque, aplicar_nitidez
from marcos import aplicar_marco
from dithering import aplicar_dithering
from byn import procesar_byn, FILTROS_BYN
from color_mixer import procesar_color


@dataclass(frozen=True)
class DefinicionPreset:
    id: str
    nombre: str
    subtitulo: str
    categoria: str
    color_acento: str
    icon: str
    swatch_gradient: str
    # Curvas tonales
    brillo: float = 0.0
    contraste: float = 0.0
    saturacion: float = 0.0
    ambiente: float = 0.0
    iluminaciones: float = 0.0
    sombras: float = 0.0
    calidez: float = 0.0
    blancos: float = 0.0
    negros: float = 0.0
    # Detalle & Textura
    grano: float = 0.0
    nitidez: float = 0.0
    desenfoque: float = 0.0
    # Color & Balance
    temperatura: float = 0.0
    tinte: float = 0.0
    mezcla_color: dict[str, dict[str, float]] | None = None
    # Blanco y Negro
    byn_activo: bool = False
    byn_filtro: str = "neutro"
    byn_canales: dict[str, float] | None = None
    byn_virado: str = "ninguno"
    byn_virado_intensidad: float = 0.0
    # Dithering
    dither_algoritmo: str = "ninguno"
    dither_paleta: str = "bn"
    dither_pixel: int = 1
    dither_intensidad: int = 100
    # Marcos
    marco_estilo: str = "ninguno"
    marco_color: str = "#ffffff"
    marco_grosor: int = 24
    # Herramientas UI
    herramientas: tuple[str, ...] = ()


_PRESETS_BASE: dict[str, DefinicionPreset] = {
    # 1. Polaroid Instant Film
    "polaroid_vintage": DefinicionPreset(
        id="polaroid_vintage",
        nombre="Polaroid 600",
        subtitulo="Marco envejecido & film ámbar",
        categoria="INSTANT",
        color_acento="#ff7744",
        icon="01",
        swatch_gradient="linear-gradient(135deg, #fce4b8, #e07a42, #422013)",
        brillo=6.0,
        contraste=-8.0,
        saturacion=12.0,
        ambiente=18.0,
        iluminaciones=-22.0,
        sombras=20.0,
        calidez=28.0,
        negros=24.0,
        grano=35.0,
        marco_estilo="polaroid_gastado",
        herramientas=("Polaroid", "Calidez +28", "Grano 35"),
    ),
    # 2. 35mm Celluloid Film
    "kodak_portra_35mm": DefinicionPreset(
        id="kodak_portra_35mm",
        nombre="Portra 35mm",
        subtitulo="Tira de celuloide & color cálido",
        categoria="35MM",
        color_acento="#ffaa00",
        icon="02",
        swatch_gradient="linear-gradient(135deg, #111111, #3a200a, #d48228, #f5d061)",
        brillo=4.0,
        contraste=18.0,
        saturacion=14.0,
        ambiente=15.0,
        iluminaciones=-18.0,
        sombras=15.0,
        calidez=22.0,
        negros=12.0,
        grano=45.0,
        nitidez=25.0,
        marco_estilo="pelicula",
        herramientas=("Película 35mm", "Grano 45", "Nitidez +25"),
    ),
    # 3. Cianotipia Química 1842
    "cianotipia_1842": DefinicionPreset(
        id="cianotipia_1842",
        nombre="Cianotipia 1842",
        subtitulo="Azul de Prusia & sales férricas",
        categoria="QUÍMICA",
        color_acento="#00d4ff",
        icon="03",
        swatch_gradient="linear-gradient(135deg, #041021, #0a2f54, #1b6ca8, #72efdd)",
        contraste=28.0,
        ambiente=20.0,
        blancos=15.0,
        negros=-12.0,
        grano=25.0,
        byn_activo=True,
        byn_filtro="azul",
        byn_virado="cianotipia",
        byn_virado_intensidad=92.0,
        marco_estilo="liso",
        marco_color="#071526",
        marco_grosor=26,
        herramientas=("Cianotipia", "Filtro Azul", "Marco Azul"),
    ),
    # 4. Plata & Selenio Fine Art
    "fine_art_selenio": DefinicionPreset(
        id="fine_art_selenio",
        nombre="Plata & Selenio",
        subtitulo="B&N de galería en papel baritado",
        categoria="FINE ART",
        color_acento="#e0e0e0",
        icon="04",
        swatch_gradient="linear-gradient(135deg, #100f14, #272130, #736980, #f2f0f7)",
        contraste=38.0,
        ambiente=25.0,
        blancos=25.0,
        negros=-24.0,
        grano=28.0,
        nitidez=30.0,
        byn_activo=True,
        byn_filtro="rojo",
        byn_virado="selenio",
        byn_virado_intensidad=82.0,
        marco_estilo="liso",
        marco_color="#ffffff",
        marco_grosor=30,
        herramientas=("Selenio", "Filtro Rojo", "Marco Galería"),
    ),
    # 5. Game Boy 8-Bit Matrix
    "gameboy_1989": DefinicionPreset(
        id="gameboy_1989",
        nombre="Game Boy 1989",
        subtitulo="4 tonos verde LCD & matriz Bayer",
        categoria="8-BIT",
        color_acento="#9bbc0f",
        icon="05",
        swatch_gradient="linear-gradient(135deg, #0f380f, #306230, #8bac0f, #9bbc0f)",
        brillo=6.0,
        contraste=22.0,
        dither_algoritmo="bayer_4",
        dither_paleta="gameboy",
        dither_pixel=2,
        dither_intensidad=95,
        marco_estilo="liso",
        marco_color="#306230",
        marco_grosor=18,
        herramientas=("Dither Bayer", "Paleta Game Boy", "Marco LCD"),
    ),
    # 6. CGA Cyberpunk 1981
    "cyber_cga_80s": DefinicionPreset(
        id="cyber_cga_80s",
        nombre="CGA Cyberpunk",
        subtitulo="Difusión Floyd & neón 1981",
        categoria="CYBER",
        color_acento="#ff00aa",
        icon="06",
        swatch_gradient="linear-gradient(135deg, #000000 20%, #00ffff 50%, #ff55ff 80%, #ffffff 100%)",
        contraste=32.0,
        dither_algoritmo="floyd_steinberg",
        dither_paleta="cga",
        dither_pixel=1,
        dither_intensidad=85,
        marco_estilo="liso",
        marco_color="#000000",
        marco_grosor=16,
        herramientas=("Dither Floyd", "Paleta CGA", "Borde Cyber"),
    ),
    # 7. Cinematic Teal & Orange
    "moody_teal_orange": DefinicionPreset(
        id="moody_teal_orange",
        nombre="Teal & Orange",
        subtitulo="Color grading de cine contemporáneo",
        categoria="CINE",
        color_acento="#00e5ff",
        icon="07",
        swatch_gradient="linear-gradient(135deg, #04181f, #093b45, #cf6d17, #ffa938)",
        contraste=30.0,
        ambiente=18.0,
        iluminaciones=-24.0,
        sombras=18.0,
        negros=22.0,
        grano=24.0,
        temperatura=-18.0,
        tinte=8.0,
        mezcla_color={
            "cyan": {"tono": 0.0, "sat": 25.0, "lum": -5.0},
            "azul": {"tono": -10.0, "sat": 25.0, "lum": -10.0},
            "naranja": {"tono": 0.0, "sat": 20.0, "lum": 10.0},
            "amarillo": {"tono": -5.0, "sat": 15.0, "lum": 8.0},
        },
        herramientas=("HSL Cine", "Fade Negros +22", "Grano 24"),
    ),
    # 8. Fallen Angels 90s Cine
    "fallen_angels_90s": DefinicionPreset(
        id="fallen_angels_90s",
        nombre="Fallen Angels",
        subtitulo="Verde neón Wong Kar-wai & celuloide",
        categoria="NOIR 90S",
        color_acento="#00ff9d",
        icon="08",
        swatch_gradient="linear-gradient(135deg, #01140e, #053322, #00d280, #e6c800)",
        contraste=34.0,
        ambiente=15.0,
        negros=15.0,
        grano=48.0,
        temperatura=-16.0,
        tinte=-22.0,
        marco_estilo="pelicula",
        herramientas=("Tinte Neón -22", "Marco Película", "Grano 48"),
    ),
    # 9. Y2K Digicam Direct Flash
    "y2k_digicam_flash": DefinicionPreset(
        id="y2k_digicam_flash",
        nombre="Y2K Digicam Flash",
        subtitulo="Flash directo frontal & nitidez 2000s",
        categoria="Y2K",
        color_acento="#00ff66",
        icon="09",
        swatch_gradient="linear-gradient(135deg, #181818, #555555, #f5f5f5, #99aaff)",
        brillo=16.0,
        contraste=24.0,
        iluminaciones=35.0,
        blancos=28.0,
        negros=8.0,
        grano=50.0,
        nitidez=45.0,
        marco_estilo="liso",
        marco_color="#000000",
        marco_grosor=14,
        herramientas=("Flash Directo", "Nitidez +45", "Borde Negro"),
    ),
    # 10. Orton Glow & Bloom
    "dreamy_orton_bloom": DefinicionPreset(
        id="dreamy_orton_bloom",
        nombre="Orton Bloom",
        subtitulo="Resplandor etéreo & marco instantáneo",
        categoria="FANTASÍA",
        color_acento="#e6a8d7",
        icon="10",
        swatch_gradient="linear-gradient(135deg, #241129, #59254f, #be73a6, #fff0fa)",
        brillo=12.0,
        contraste=-14.0,
        ambiente=32.0,
        iluminaciones=25.0,
        calidez=16.0,
        desenfoque=8.0,
        nitidez=20.0,
        marco_estilo="polaroid",
        herramientas=("Bloom Orton", "Marco Polaroid", "Calidez +16"),
    ),
}

# Diccionario público con los 10 presets principales + alias de retrocompatibilidad
PRESETS_DISPONIBLES: dict[str, DefinicionPreset] = dict(_PRESETS_BASE)

# Alias de compatibilidad hacia atrás
PRESETS_DISPONIBLES["moody_cinematic"] = _PRESETS_BASE["moody_teal_orange"]
PRESETS_DISPONIBLES["golden_hour"] = _PRESETS_BASE["kodak_portra_35mm"]
PRESETS_DISPONIBLES["cyber_neotokyo"] = _PRESETS_BASE["cyber_cga_80s"]
PRESETS_DISPONIBLES["editorial_bw"] = _PRESETS_BASE["fine_art_selenio"]
PRESETS_DISPONIBLES["y2k_flash"] = _PRESETS_BASE["y2k_digicam_flash"]
PRESETS_DISPONIBLES["clean_muted"] = _PRESETS_BASE["moody_teal_orange"]
PRESETS_DISPONIBLES["fallen_angels"] = _PRESETS_BASE["fallen_angels_90s"]
PRESETS_DISPONIBLES["polaroid_600"] = _PRESETS_BASE["polaroid_vintage"]
PRESETS_DISPONIBLES["dreamy_glow"] = _PRESETS_BASE["dreamy_orton_bloom"]
PRESETS_DISPONIBLES["neo_noir"] = _PRESETS_BASE["fallen_angels_90s"]


def aplicar_tonos_vectorizados(
    arr: np.ndarray,
    brillo: float = 0.0,
    contraste: float = 0.0,
    saturacion: float = 0.0,
    ambiente: float = 0.0,
    iluminaciones: float = 0.0,
    sombras: float = 0.0,
    calidez: float = 0.0,
    blancos: float = 0.0,
    negros: float = 0.0,
) -> np.ndarray:
    """
    Aplica la cadena de transformaciones tonales fotográficas sobre un arreglo RGB float32 [0.0, 1.0].
    Vectorizado y de alto rendimiento en NumPy.
    """
    out = arr.copy()

    # 1. Calidez / Temperatura de color analógica
    if calidez != 0.0:
        k = calidez / 100.0
        if k > 0.0:
            out[..., 0] *= (1.0 + k * 0.35)
            out[..., 2] *= (1.0 - k * 0.45)
            out[..., 1] *= (1.0 + k * 0.05)
        else:
            out[..., 0] *= (1.0 + k * 0.40)
            out[..., 2] *= (1.0 - k * 0.35)
            out[..., 1] *= (1.0 - k * 0.05)
        np.clip(out, 0.0, 1.0, out=out)

    # 2. Luminancia ponderada Rec. 709
    y = 0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]

    # 3. Ambiente (Snapseed Ambiance: balance dinámico luces/sombras y microcontraste)
    if ambiente != 0.0:
        a = ambiente / 100.0
        m_a = 4.0 * y * (1.0 - y)
        delta_amb = a * (m_a * 0.22 + ((1.0 - y) ** 2) * 0.20 - (y ** 2) * 0.15)
        out += delta_amb[..., None]
        np.clip(out, 0.0, 1.0, out=out)
        y = 0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]

    # 4. Sombras e Iluminaciones
    m_sombras = ((1.0 - np.clip(y / 0.65, 0.0, 1.0)) ** 2)
    m_luces = ((np.clip((y - 0.35) / 0.65, 0.0, 1.0)) ** 2)

    if sombras != 0.0:
        delta_s = (sombras / 100.0) * 0.38 * m_sombras
        out += delta_s[..., None]

    if iluminaciones != 0.0:
        delta_h = (iluminaciones / 100.0) * 0.35 * m_luces
        out += delta_h[..., None]

    np.clip(out, 0.0, 1.0, out=out)
    y = 0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]

    # 5. Blancos y Negros (Matte / Fade effect)
    m_blancos = ((np.clip((y - 0.65) / 0.35, 0.0, 1.0)) ** 2)
    m_negros = ((1.0 - np.clip(y / 0.35, 0.0, 1.0)) ** 2)

    if blancos != 0.0:
        delta_w = (blancos / 100.0) * 0.28 * m_blancos
        out += delta_w[..., None]

    if negros != 0.0:
        delta_k = (negros / 100.0) * 0.24 * m_negros
        out += delta_k[..., None]

    np.clip(out, 0.0, 1.0, out=out)

    # 6. Brillo
    if brillo != 0.0:
        b = brillo / 100.0
        campana = 1.0 - ((2.0 * y - 1.0) ** 2)
        out += (b * 0.30 * campana[..., None] + b * 0.12)
        np.clip(out, 0.0, 1.0, out=out)

    # 7. Contraste
    if contraste != 0.0:
        c = contraste / 100.0
        factor_c = (1.0 + c * 0.75) if c > 0.0 else (1.0 + c * 0.65)
        out = 0.5 + (out - 0.5) * factor_c
        np.clip(out, 0.0, 1.0, out=out)

    # 8. Saturación
    if saturacion != 0.0:
        y_fin = 0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]
        s = saturacion / 100.0
        if s <= -1.0:
            out = np.repeat(y_fin[..., None], 3, axis=-1)
        else:
            factor_s = (1.0 + s) if s < 0.0 else (1.0 + s * 0.85)
            out = y_fin[..., None] + (out - y_fin[..., None]) * factor_s
        np.clip(out, 0.0, 1.0, out=out)

    return out


def procesar_preset(
    imagen: Image.Image,
    preset_id: str,
    intensidad: float = 100.0,
    aplicar_marco_preset: bool = True,
) -> Image.Image:
    """
    Aplica un preset preestablecido con intensidad configurable [0.0, 100.0].
    Combina curvas tonales, color HSL, blanco y negro químico, detalle/grano, dithering y marcos.
    Si preset_id es 'ninguno' o desconocido, devuelve una copia intacta.
    """
    if not preset_id or preset_id == "ninguno" or intensidad <= 0.0:
        return imagen.copy()

    preset = PRESETS_DISPONIBLES.get(preset_id)
    if preset is None:
        return imagen.copy()

    alpha = max(0.0, min(100.0, float(intensidad))) / 100.0
    if alpha <= 0.001:
        return imagen.copy()

    modo_original = imagen.mode
    imagen_rgb = imagen if modo_original == "RGB" else imagen.convert("RGB")

    # 1. Curvas tonales fotográficas vectorizadas
    arr = np.array(imagen_rgb, dtype=np.float32) / 255.0
    arr_procesado = aplicar_tonos_vectorizados(
        arr,
        brillo=preset.brillo,
        contraste=preset.contraste,
        saturacion=preset.saturacion,
        ambiente=preset.ambiente,
        iluminaciones=preset.iluminaciones,
        sombras=preset.sombras,
        calidez=preset.calidez,
        blancos=preset.blancos,
        negros=preset.negros,
    )
    res_uint8 = np.clip(arr_procesado * 255.0 + 0.5, 0, 255).astype(np.uint8)
    actual = Image.fromarray(res_uint8)

    # 2. Balance de Color & Mezcla HSL si el preset lo define
    if preset.temperatura != 0.0 or preset.tinte != 0.0 or preset.mezcla_color is not None:
        siguiente = procesar_color(
            actual,
            preset.temperatura,
            preset.tinte,
            preset.mezcla_color,
        )
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    # 3. Blanco y Negro / Virado químico si corresponde
    if preset.byn_activo:
        canales = preset.byn_canales
        if canales is None and preset.byn_filtro in FILTROS_BYN:
            canales = FILTROS_BYN[preset.byn_filtro]
        siguiente = procesar_byn(
            actual,
            activo=True,
            canales=canales,
            virado=preset.byn_virado,
            virado_intensidad=preset.byn_virado_intensidad,
        )
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    # 4. Detalle: Desenfoque, Nitidez y Grano analógico
    if preset.desenfoque > 0.0:
        siguiente = aplicar_desenfoque(actual, preset.desenfoque)
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    if preset.nitidez > 0.0:
        siguiente = aplicar_nitidez(actual, preset.nitidez)
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    if preset.grano > 0.0:
        siguiente = aplicar_grano(actual, preset.grano)
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    # 5. Dithering retro si el preset lo especifica
    if preset.dither_algoritmo != "ninguno":
        siguiente = aplicar_dithering(
            actual,
            preset.dither_algoritmo,
            preset.dither_paleta,
            preset.dither_pixel,
            preset.dither_intensidad,
        )
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    # 6. Mezcla de intensidad (Alpha blend con la imagen original sin preset)
    if alpha < 0.999:
        blended = Image.blend(imagen_rgb, actual, alpha)
        if actual is not imagen_rgb:
            actual.close()
        actual = blended

    # 7. Marco decorativo si el preset lo incluye (aplicado al final del encuadre estilizado)
    if aplicar_marco_preset and preset.marco_estilo != "ninguno":
        siguiente = aplicar_marco(
            actual,
            preset.marco_estilo,
            preset.marco_color,
            preset.marco_grosor,
        )
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    if modo_original != "RGB":
        final = actual.convert(modo_original)
        if actual is not final:
            actual.close()
        actual = final

    return actual
