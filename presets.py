"""
DITHERIX // MOTOR FOTOGRÁFICO DE PRESETS Y ESTILOS DE AUTOR
Presets profesionales multicapa que orquestan el ecosistema completo de Ditherix:
- Curvas tonales fotográficas y luz avanzada (altas luces, sombras, fade mate, viñeta óptica)
- Transformación espectral Aerochrome (infrarrojo falso en NumPy)
- Balance de blancos Kelvin y mezcla de color HSL de 8 canales
- Blanco y negro con filtros ópticos y virados químicos (Cianotipia, Selenio, Sepia, Platino)
- Laboratorio Óptico / CRT: halación 35mm, aberración cromática radial y scanlines CRT
- Dithering multicapa con duotono personalizado, pre-umbral, Atkinson, Floyd y Bayer
- Marcos decorativos procedimentales (Polaroid, Polaroid gastado, Tira de 35mm, Liso)
"""

from __future__ import annotations

from dataclasses import dataclass
import numpy as np
from PIL import Image

from ajustes_imagen import aplicar_luz_avanzada
from detalle import aplicar_grano, aplicar_desenfoque, aplicar_nitidez
from marcos import aplicar_marco
from dithering import aplicar_dithering
from optica import aplicar_scanlines, procesar_optica_lente
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
    fade: float = 0.0
    vineta: float = 0.0
    aerochrome: bool = False
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
    # Laboratorio Óptico / CRT
    halacion: float = 0.0
    aberracion: float = 0.0
    scanlines: float = 0.0
    # Dithering
    dither_algoritmo: str = "ninguno"
    dither_paleta: str = "bn"
    dither_pixel: int = 1
    dither_intensidad: int = 100
    dither_umbral: int = 0
    dither_duotono_oscuro: str = "#0a0a10"
    dither_duotono_claro: str = "#f2f2ea"
    # Marcos
    marco_estilo: str = "ninguno"
    marco_color: str = "#ffffff"
    marco_grosor: int = 24
    # Herramientas UI
    herramientas: tuple[str, ...] = ()


def _aplicar_aerochrome_rgb(arr: np.ndarray) -> np.ndarray:
    """Emula película Kodak Aerochrome IR desplazando vegetación verde a carmesí."""
    r = arr[..., 0]
    g = arr[..., 1]
    b = arr[..., 2]

    exceso_g = np.clip((g - np.maximum(r, b) * 0.86) * 2.4, 0.0, 1.0)
    r_nuevo = r * (1.0 - exceso_g * 0.55) + (g * 1.12 + 0.08) * exceso_g
    g_nuevo = g * (1.0 - exceso_g * 0.72) + r * 0.18 * exceso_g
    b_nuevo = b * (0.94 - exceso_g * 0.10) + g * 0.24 * exceso_g
    res = np.stack([r_nuevo, g_nuevo, b_nuevo], axis=-1)
    return np.clip(res, 0.0, 1.0)


_PRESETS_BASE: dict[str, DefinicionPreset] = {
    # 1. Cinestill 800T (Halación roja 35mm + Tira de película)
    "cinestill_neon_800": DefinicionPreset(
        id="cinestill_neon_800",
        nombre="Cinestill 800T",
        subtitulo="Tungsteno nocturno, halación 35mm & tira negativa",
        categoria="CINE 35MM",
        color_acento="#ff6e40",
        icon="01",
        swatch_gradient="linear-gradient(135deg, #07131c 0%, #103247 40%, #d9381e 78%, #ffb478 100%)",
        contraste=22.0,
        ambiente=14.0,
        iluminaciones=-12.0,
        sombras=10.0,
        negros=8.0,
        fade=10.0,
        vineta=-26.0,
        temperatura=-18.0,
        tinte=5.0,
        halacion=78.0,
        aberracion=16.0,
        nitidez=24.0,
        grano=32.0,
        mezcla_color={
            "cyan": {"tono": -6.0, "saturacion": 26.0, "luminancia": -6.0},
            "azul": {"tono": -10.0, "saturacion": 22.0, "luminancia": -10.0},
            "rojo": {"tono": -4.0, "saturacion": 32.0, "luminancia": 8.0},
            "naranja": {"tono": 0.0, "saturacion": 22.0, "luminancia": 6.0},
        },
        marco_estilo="pelicula",
        herramientas=("Halación +78", "Tira 35mm", "Tungsteno"),
    ),
    # 2. Midnight Touge (Automotriz CRT + Aberración RGB + Halación)
    "midnight_touge": DefinicionPreset(
        id="midnight_touge",
        nombre="Midnight Touge",
        subtitulo="Asfalto nocturno, aberración RGB & transmisión CRT",
        categoria="MOTOR CRT",
        color_acento="#00d9ff",
        icon="02",
        swatch_gradient="linear-gradient(135deg, #05050a 0%, #170e2e 38%, #6d1d5a 72%, #00d9ff 100%)",
        contraste=34.0,
        ambiente=18.0,
        iluminaciones=-10.0,
        sombras=10.0,
        fade=14.0,
        vineta=-40.0,
        temperatura=-14.0,
        tinte=10.0,
        halacion=42.0,
        aberracion=36.0,
        scanlines=22.0,
        nitidez=42.0,
        grano=18.0,
        mezcla_color={
            "azul": {"tono": -12.0, "saturacion": 34.0, "luminancia": -12.0},
            "cyan": {"tono": 0.0, "saturacion": 32.0, "luminancia": 4.0},
            "rojo": {"tono": 0.0, "saturacion": 36.0, "luminancia": 10.0},
            "violeta": {"tono": 8.0, "saturacion": 24.0, "luminancia": 4.0},
        },
        herramientas=("Aberración RGB", "Scanlines CRT", "Halación +42"),
    ),
    # 3. Risograph Press (Duotono custom índigo/coral + Bayer 8x8)
    "riso_crimson_press": DefinicionPreset(
        id="riso_crimson_press",
        nombre="Risograph Press",
        subtitulo="Serigrafía editorial duotono índigo/coral & trama fina",
        categoria="DUOTONO",
        color_acento="#ff6352",
        icon="03",
        swatch_gradient="linear-gradient(135deg, #141c52 0%, #24338f 42%, #ff6352 78%, #ffe7d6 100%)",
        contraste=24.0,
        ambiente=12.0,
        vineta=-18.0,
        nitidez=20.0,
        dither_algoritmo="bayer_8",
        dither_paleta="duotono",
        dither_pixel=1,
        dither_intensidad=88,
        dither_umbral=10,
        dither_duotono_oscuro="#141c52",
        dither_duotono_claro="#ff6352",
        herramientas=("Duotono Ink", "Bayer 8x8", "Umbral +10"),
    ),
    # 4. Macintosh 1984 (Atkinson 1-bit auténtico + pixel-perfect)
    "mac_atkinson_1bit": DefinicionPreset(
        id="mac_atkinson_1bit",
        nombre="Macintosh 1984",
        subtitulo="Difusión Atkinson de 1 bit, tinta carbón & papel fósforo",
        categoria="1-BIT",
        color_acento="#eceae1",
        icon="04",
        swatch_gradient="linear-gradient(135deg, #0b0c10 0%, #262930 45%, #a8a69d 80%, #eceae1 100%)",
        contraste=22.0,
        sombras=14.0,
        nitidez=30.0,
        dither_algoritmo="atkinson",
        dither_paleta="duotono",
        dither_pixel=2,
        dither_intensidad=100,
        dither_umbral=6,
        dither_duotono_oscuro="#0b0c10",
        dither_duotono_claro="#eceae1",
        herramientas=("Atkinson 1-Bit", "Píxel x2", "Pixel-Perfect"),
    ),
    # 5. Kodak Aerochrome (Falso color infrarrojo + halación + viñeta)
    "infrared_aerochrome": DefinicionPreset(
        id="infrared_aerochrome",
        nombre="Kodak Aerochrome",
        subtitulo="Película infrarroja falso color, vegetación carmesí & cielo cobalto",
        categoria="INFRARROJO",
        color_acento="#ff4d6d",
        icon="05",
        swatch_gradient="linear-gradient(135deg, #07142b 0%, #163a70 38%, #c9184a 75%, #ff758f 100%)",
        contraste=20.0,
        ambiente=14.0,
        iluminaciones=-14.0,
        sombras=16.0,
        fade=8.0,
        vineta=-32.0,
        aerochrome=True,
        halacion=34.0,
        nitidez=22.0,
        grano=24.0,
        herramientas=("Falso IR", "Halación +34", "Viñeta -32"),
    ),
    # 6. VHS Camcorder 94 (Scanlines + Aberración fuerte + Fade)
    "vhs_camcorder_94": DefinicionPreset(
        id="vhs_camcorder_94",
        nombre="VHS Camcorder 94",
        subtitulo="Cinta magnética, líneas de rastreo CRT & aberración cromática",
        categoria="ANALOG CRT",
        color_acento="#e8d29c",
        icon="06",
        swatch_gradient="linear-gradient(135deg, #12101a 0%, #3d2240 40%, #b56b45 75%, #e8d29c 100%)",
        contraste=-4.0,
        calidez=14.0,
        fade=28.0,
        vineta=-44.0,
        temperatura=10.0,
        tinte=10.0,
        desenfoque=8.0,
        grano=42.0,
        aberracion=58.0,
        scanlines=52.0,
        herramientas=("Scanlines +52", "Aberración +58", "Fade +28"),
    ),
    # 7. Kodachrome 64 (Diapositiva clásica + Montura blanca)
    "kodachrome_archive": DefinicionPreset(
        id="kodachrome_archive",
        nombre="Kodachrome 64",
        subtitulo="Diapositiva de archivo, rojos profundos & montura hueso",
        categoria="ARCHIVO",
        color_acento="#d96b38",
        icon="07",
        swatch_gradient="linear-gradient(135deg, #1c100b 0%, #5c2018 40%, #c96a2b 75%, #f5f3ec 100%)",
        contraste=24.0,
        ambiente=16.0,
        iluminaciones=-18.0,
        sombras=14.0,
        calidez=12.0,
        fade=10.0,
        vineta=-22.0,
        nitidez=28.0,
        grano=18.0,
        mezcla_color={
            "rojo": {"tono": 0.0, "saturacion": 28.0, "luminancia": -4.0},
            "naranja": {"tono": -6.0, "saturacion": 18.0, "luminancia": 6.0},
            "amarillo": {"tono": -12.0, "saturacion": 18.0, "luminancia": 4.0},
            "cyan": {"tono": 6.0, "saturacion": -18.0, "luminancia": -6.0},
            "verde": {"tono": 12.0, "saturacion": -14.0, "luminancia": -4.0},
        },
        marco_estilo="liso",
        marco_color="#f5f3ec",
        marco_grosor=28,
        herramientas=("Montura Slide", "Rojos 64", "Viñeta -22"),
    ),
    # 8. Platino Paladio (B&N Virado Platino + Fade mate galería)
    "monochrome_platinum": DefinicionPreset(
        id="monochrome_platinum",
        nombre="Platino Paladio",
        subtitulo="Copia por contacto B&N, negros aterciopelados & virado platino",
        categoria="GALERÍA B&N",
        color_acento="#d6dce2",
        icon="08",
        swatch_gradient="linear-gradient(135deg, #0c0e10 0%, #2a2f36 42%, #7d858e 78%, #f2f4f7 100%)",
        contraste=26.0,
        ambiente=20.0,
        iluminaciones=-22.0,
        sombras=26.0,
        fade=22.0,
        vineta=-30.0,
        nitidez=28.0,
        grano=22.0,
        byn_activo=True,
        byn_filtro="naranja",
        byn_virado="platino",
        byn_virado_intensidad=80.0,
        herramientas=("Virado Platino", "Fade +22", "Filtro Naranja"),
    ),
    # 9. Thermal Predator (Paleta térmica + Bayer 4x4 + Scanlines + Aberración)
    "cyber_thermal_hud": DefinicionPreset(
        id="cyber_thermal_hud",
        nombre="Thermal Predator",
        subtitulo="Visor FLIR térmico, matriz Bayer, aberración & scanlines",
        categoria="TÉRMICO",
        color_acento="#ffdc00",
        icon="09",
        swatch_gradient="linear-gradient(135deg, #000028 0%, #78008c 38%, #e63c14 72%, #ffdc00 100%)",
        contraste=26.0,
        aberracion=24.0,
        scanlines=30.0,
        dither_algoritmo="bayer_4",
        dither_paleta="termica",
        dither_pixel=2,
        dither_intensidad=92,
        dither_umbral=-6,
        herramientas=("Paleta Térmica", "Scanlines +30", "Bayer 4x4"),
    ),
    # 10. Silver Bleach (Bleach Bypass cinematográfico crudo + Halación metálica)
    "bleach_bypass_noir": DefinicionPreset(
        id="bleach_bypass_noir",
        nombre="Silver Bleach",
        subtitulo="Retención de plata cruda, desaturado acerado & viñeta densa",
        categoria="CINE NOIR",
        color_acento="#b9c3cc",
        icon="10",
        swatch_gradient="linear-gradient(135deg, #08090a 0%, #24282c 45%, #697077 78%, #d8dee4 100%)",
        contraste=42.0,
        saturacion=-56.0,
        iluminaciones=-18.0,
        sombras=-18.0,
        negros=-10.0,
        vineta=-52.0,
        halacion=18.0,
        nitidez=50.0,
        grano=36.0,
        herramientas=("Retención Plata", "Viñeta -52", "Nitidez +50"),
    ),
    # 11. Ámbar Mainframe (Terminal CRT 1982 + Floyd + Scanlines + Halación)
    "amber_terminal_crt": DefinicionPreset(
        id="amber_terminal_crt",
        nombre="Ámbar Mainframe",
        subtitulo="Monitor fósforo ámbar 1982, difusión Floyd & barrido CRT",
        categoria="TERMINAL",
        color_acento="#ffb900",
        icon="11",
        swatch_gradient="linear-gradient(135deg, #140a00 0%, #5e2c00 42%, #be6e00 76%, #ffb900 100%)",
        contraste=28.0,
        vineta=-48.0,
        halacion=30.0,
        scanlines=46.0,
        dither_algoritmo="floyd_steinberg",
        dither_paleta="ambar",
        dither_pixel=2,
        dither_intensidad=100,
        dither_umbral=4,
        herramientas=("Fósforo Ámbar", "CRT +46", "Viñeta -48"),
    ),
    # 12. Instant SX-70 Dream (Polaroid clásico + Halación solar + Fade pastel)
    "instant_sx70_dream": DefinicionPreset(
        id="instant_sx70_dream",
        nombre="Instant SX-70",
        subtitulo="Emulsión Time-Zero pastel, halación solar & marco Polaroid",
        categoria="POLAROID",
        color_acento="#f7f6f2",
        icon="12",
        swatch_gradient="linear-gradient(135deg, #1e2421 0%, #4d6b5e 40%, #cfa178 75%, #f7f6f2 100%)",
        brillo=6.0,
        contraste=-6.0,
        ambiente=18.0,
        calidez=16.0,
        fade=32.0,
        temperatura=6.0,
        tinte=-6.0,
        halacion=54.0,
        desenfoque=4.0,
        nitidez=18.0,
        grano=24.0,
        mezcla_color={
            "verde": {"tono": 18.0, "saturacion": -12.0, "luminancia": 6.0},
            "amarillo": {"tono": -10.0, "saturacion": 16.0, "luminancia": 8.0},
            "azul": {"tono": -14.0, "saturacion": -10.0, "luminancia": 8.0},
        },
        marco_estilo="polaroid",
        herramientas=("Halación +54", "Fade +32", "Marco Polaroid"),
    ),
}

PRESETS_DISPONIBLES: dict[str, DefinicionPreset] = dict(_PRESETS_BASE)

# Alias de compatibilidad hacia atrás
PRESETS_DISPONIBLES["gt_supercar_chrome"] = _PRESETS_BASE["midnight_touge"]
PRESETS_DISPONIBLES["night_runner_drift"] = _PRESETS_BASE["cinestill_neon_800"]
PRESETS_DISPONIBLES["kodak_portra_35mm"] = _PRESETS_BASE["kodachrome_archive"]
PRESETS_DISPONIBLES["polaroid_vintage"] = _PRESETS_BASE["instant_sx70_dream"]
PRESETS_DISPONIBLES["moody_teal_orange"] = _PRESETS_BASE["cinestill_neon_800"]
PRESETS_DISPONIBLES["fallen_angels_90s"] = _PRESETS_BASE["midnight_touge"]
PRESETS_DISPONIBLES["fine_art_selenio"] = _PRESETS_BASE["monochrome_platinum"]
PRESETS_DISPONIBLES["cianotipia_1842"] = _PRESETS_BASE["riso_crimson_press"]
PRESETS_DISPONIBLES["y2k_digicam_flash"] = _PRESETS_BASE["vhs_camcorder_94"]
PRESETS_DISPONIBLES["dreamy_orton_bloom"] = _PRESETS_BASE["instant_sx70_dream"]
PRESETS_DISPONIBLES["gameboy_1989"] = _PRESETS_BASE["mac_atkinson_1bit"]
PRESETS_DISPONIBLES["cyber_cga_80s"] = _PRESETS_BASE["cyber_thermal_hud"]


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

    # 1. Transformación espectral Aerochrome & curvas tonales vectorizadas
    arr = np.array(imagen_rgb, dtype=np.float32) / 255.0
    if preset.aerochrome:
        arr = _aplicar_aerochrome_rgb(arr)
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

    if preset.fade != 0.0 or preset.vineta != 0.0:
        siguiente = aplicar_luz_avanzada(
            actual,
            fade=preset.fade,
            vineta=preset.vineta,
        )
        if actual is not siguiente:
            actual.close()
        actual = siguiente

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

    # 5. Laboratorio Óptico (Halación 35mm y Aberración Cromática radial)
    if preset.halacion > 0.0 or preset.aberracion > 0.0:
        siguiente = procesar_optica_lente(
            actual,
            halacion=preset.halacion,
            aberracion=preset.aberracion,
        )
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    # 6. Dithering retro / duotono personalizado si el preset lo especifica
    if preset.dither_algoritmo != "ninguno":
        siguiente = aplicar_dithering(
            actual,
            preset.dither_algoritmo,
            preset.dither_paleta,
            preset.dither_pixel,
            preset.dither_intensidad,
            umbral=preset.dither_umbral,
            duotono_oscuro=preset.dither_duotono_oscuro,
            duotono_claro=preset.dither_duotono_claro,
        )
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    # 7. Scanlines CRT tras dithering y óptica
    if preset.scanlines > 0.0:
        siguiente = aplicar_scanlines(actual, preset.scanlines)
        if actual is not siguiente:
            actual.close()
        actual = siguiente

    # 8. Mezcla de intensidad (Alpha blend con la imagen original sin preset)
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
