"""
DITHERIX // MOTOR FOTOGRÁFICO DE PRESETS Y CURVAS TONALES
Procesa ajustes avanzados de fotografía profesional emulando Lightroom y Snapseed:
- Brillo (Exposure / Midtone shift)
- Contraste (Sigmoidal S-Curve)
- Saturación (Vibrance cromático)
- Ambiente (Ambiance: balance dinámico de luces/sombras y micro-contraste)
- Iluminaciones (Highlights compression/expansion)
- Sombras (Shadows recovery/depth)
- Calidez (Kelvin White Balance)
- Blancos (White point scaling)
- Negros (Black point matte fade / crush)
- Grano analógico de película
"""

from __future__ import annotations

from dataclasses import dataclass, field
import numpy as np
from PIL import Image

from detalle import aplicar_grano


@dataclass(frozen=True)
class DefinicionPreset:
    id: str
    nombre: str
    badge: str
    badge_color: str
    descripcion: str
    tags: tuple[str, ...]
    brillo: float = 0.0
    contraste: float = 0.0
    saturacion: float = 0.0
    ambiente: float = 0.0
    iluminaciones: float = 0.0
    sombras: float = 0.0
    calidez: float = 0.0
    blancos: float = 0.0
    negros: float = 0.0
    grano: float = 0.0


PRESETS_DISPONIBLES: dict[str, DefinicionPreset] = {
    "moody_cinematic": DefinicionPreset(
        id="moody_cinematic",
        nombre="Moody Cinematic Teal & Dark",
        badge="CINE",
        badge_color="#00e5ff",
        descripcion="Look cinematográfico contemporáneo: sombras desvanecidas, tonos oscuros fríos y contraste marcado.",
        tags=("Fade +25", "Grano 20", "Frío -12", "Contraste +28"),
        brillo=-10.0,
        contraste=28.0,
        saturacion=-15.0,
        ambiente=15.0,
        iluminaciones=-25.0,
        sombras=20.0,
        calidez=-12.0,
        blancos=-15.0,
        negros=25.0,
        grano=20.0,
    ),
    "golden_hour": DefinicionPreset(
        id="golden_hour",
        nombre="Golden Hour Vintage (35mm)",
        badge="35MM",
        badge_color="#ffaa00",
        descripcion="Calidez analógica estilo Kodak Portra/Gold en atardeceres: tonos ámbar suaves y grano visible.",
        tags=("Ámbar +35", "Grano 45", "Negros lechosos", "Luces suaves"),
        brillo=5.0,
        contraste=-12.0,
        saturacion=10.0,
        ambiente=20.0,
        iluminaciones=-30.0,
        sombras=25.0,
        calidez=35.0,
        blancos=10.0,
        negros=18.0,
        grano=45.0,
    ),
    "cyber_neotokyo": DefinicionPreset(
        id="cyber_neotokyo",
        nombre="Cyber / Neo-Tokyo Minimal",
        badge="CYBER",
        badge_color="#ff007f",
        descripcion="Estética nocturna de alto impacto: sombras profundas y limpias, negros puros y luces que destacan.",
        tags=("Contraste +40", "Negros puros -35", "Saturación +22", "Frío -20"),
        brillo=-5.0,
        contraste=40.0,
        saturacion=22.0,
        ambiente=-20.0,
        iluminaciones=15.0,
        sombras=-30.0,
        calidez=-20.0,
        blancos=25.0,
        negros=-35.0,
        grano=0.0,
    ),
    "editorial_bw": DefinicionPreset(
        id="editorial_bw",
        nombre="Editorial B&W Fine Art",
        badge="B&N",
        badge_color="#e0e0e0",
        descripcion="Blanco y negro de alto contraste con textura dramática para retratos, arquitectura y fotografía urbana.",
        tags=("B&N Puro", "Contraste +35", "Ambiente +25", "Grano 35"),
        brillo=0.0,
        contraste=35.0,
        saturacion=-100.0,
        ambiente=25.0,
        iluminaciones=-15.0,
        sombras=10.0,
        calidez=0.0,
        blancos=30.0,
        negros=-25.0,
        grano=35.0,
    ),
    "y2k_flash": DefinicionPreset(
        id="y2k_flash",
        nombre="Y2K Flash / Nostalgia Retro",
        badge="Y2K",
        badge_color="#00ff66",
        descripcion="Cámara digital compacta de los 2000: luces duras de flash directo, contraste punchy y grano grueso.",
        tags=("Flash +30", "Grano 55", "Punchy +22", "Brillo +15"),
        brillo=15.0,
        contraste=22.0,
        saturacion=18.0,
        ambiente=-10.0,
        iluminaciones=30.0,
        sombras=-15.0,
        calidez=8.0,
        blancos=25.0,
        negros=10.0,
        grano=55.0,
    ),
    "clean_muted": DefinicionPreset(
        id="clean_muted",
        nombre="Clean Muted / Nordic Pastel",
        badge="PASTEL",
        badge_color="#88ccff",
        descripcion="Minimalismo nórdico: baja saturación general, tonos neutros suaves y exposición luminosa sin sombras pesadas.",
        tags=("Muted -30", "Suave -18", "Brillo +12", "Grano 10"),
        brillo=12.0,
        contraste=-18.0,
        saturacion=-30.0,
        ambiente=10.0,
        iluminaciones=-20.0,
        sombras=30.0,
        calidez=-5.0,
        blancos=-10.0,
        negros=15.0,
        grano=10.0,
    ),
    "fallen_angels": DefinicionPreset(
        id="fallen_angels",
        nombre="Fallen Angels 90s Cine",
        badge="NEON",
        badge_color="#00ffbb",
        descripcion="Inspirado en Wong Kar-wai & Christopher Doyle: atmósfera nocturna de Hong Kong, luces de neón verdosas y celuloide forzado.",
        tags=("Verde Neón -16", "Celuloide 40", "Contraste +32", "Nocturno"),
        brillo=-8.0,
        contraste=32.0,
        saturacion=14.0,
        ambiente=18.0,
        iluminaciones=-18.0,
        sombras=-10.0,
        calidez=-16.0,
        blancos=15.0,
        negros=12.0,
        grano=40.0,
    ),
    "polaroid_600": DefinicionPreset(
        id="polaroid_600",
        nombre="Polaroid 600 Instant Film",
        badge="POLAROID",
        badge_color="#ff7744",
        descripcion="Química analógica instantánea: colores ricos cálidos, rango dinámico suave, altas luces amortiguadas y negros lechosos.",
        tags=("Instantáneo", "Fade +28", "Calidez +22", "Grano 30"),
        brillo=8.0,
        contraste=-10.0,
        saturacion=12.0,
        ambiente=15.0,
        iluminaciones=-25.0,
        sombras=22.0,
        calidez=22.0,
        blancos=-8.0,
        negros=28.0,
        grano=30.0,
    ),
    "dreamy_glow": DefinicionPreset(
        id="dreamy_glow",
        nombre="Dreamy Glow (Efecto Orton)",
        badge="DREAMY",
        badge_color="#dda0dd",
        descripcion="Estética de ensueño y fantasía: luces resplandecientes difusas (soft bloom), contraste etéreo y calidez romántica.",
        tags=("Orton Bloom", "Ambiente +30", "Suave -15", "Calidez +14"),
        brillo=10.0,
        contraste=-15.0,
        saturacion=-8.0,
        ambiente=30.0,
        iluminaciones=20.0,
        sombras=25.0,
        calidez=14.0,
        blancos=10.0,
        negros=10.0,
        grano=15.0,
    ),
    "neo_noir": DefinicionPreset(
        id="neo_noir",
        nombre="Hong Kong Neo-Noir",
        badge="NOIR",
        badge_color="#ff4444",
        descripcion="Claroscuro cinematográfico agresivo: sombras densas impenetrables, luces de tungsteno callejeras y alta tensión visual.",
        tags=("Deep Shadows", "Contraste +38", "Blancos +20", "Grano 25"),
        brillo=-12.0,
        contraste=38.0,
        saturacion=-5.0,
        ambiente=-15.0,
        iluminaciones=10.0,
        sombras=-25.0,
        calidez=10.0,
        blancos=20.0,
        negros=-20.0,
        grano=25.0,
    ),
}


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

    # 1. Calidez / Temperatura de color
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

    # 3. Ambiente (Snapseed Ambiance: balance dinámico luces/sombras)
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
) -> Image.Image:
    """
    Aplica un preset preestablecido con intensidad configurable [0.0, 100.0].
    Si preset_id es 'ninguno' o desconocido, o intensidad <= 0, devuelve la imagen sin tocar.
    """
    if not preset_id or preset_id == "ninguno" or intensidad <= 0.0:
        return imagen

    preset = PRESETS_DISPONIBLES.get(preset_id)
    if preset is None:
        return imagen

    # Asegurar formato RGB
    modo_original = imagen.mode
    imagen_rgb = imagen if modo_original == "RGB" else imagen.convert("RGB")

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
    resultado = Image.fromarray(res_uint8)

    # Grano analógico del preset
    if preset.grano > 0.0:
        resultado = aplicar_grano(resultado, preset.grano)

    # Mezclar con la imagen original según la intensidad elegida (0-100%)
    alfa = max(0.0, min(100.0, intensidad)) / 100.0
    if alfa < 0.999:
        resultado = Image.blend(imagen_rgb, resultado, alfa)

    if modo_original != "RGB":
        resultado = resultado.convert(modo_original)

    return resultado

