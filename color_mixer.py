"""
DITHERIX // MÓDULO DE BALANCE DE BLANCOS Y MEZCLA DE COLORES (HSL)
Motor fotográfico continuo de alto rendimiento vectorizado en NumPy.
Emula de forma precisa el comportamiento del "Color Mixer" de 8 canales de Adobe Lightroom:
- Cobertura continua del espectro cromático sin zonas muertas (Hermite smoothstep).
- Ponderación fotográfica que respeta tonos neutros y sombras (Saturation Gating).
- Desplazamiento de tono (Hue Shift) completo hacia colores contiguos.
- Luminancia fotográfica proporcional (evita el lavado lechoso/pastel del HSL ingenuo).
"""

from __future__ import annotations

import numpy as np
from PIL import Image

COLORES_CANALES = (
    "rojo",
    "naranja",
    "amarillo",
    "verde",
    "cyan",
    "azul",
    "violeta",
    "rosa",
)

# Centros angulares de tono (Hue) en grados [0, 360)
CENTROS_COLOR: list[float] = [0.0, 30.0, 60.0, 120.0, 180.0, 240.0, 280.0, 320.0, 360.0]
NOMBRES_CANALES: list[str] = [
    "rojo",
    "naranja",
    "amarillo",
    "verde",
    "cyan",
    "azul",
    "violeta",
    "rosa",
    "rojo",
]

# Rangos máximos de desplazamiento de tono (hacia la izquierda [-] y derecha [+])
# En Lightroom, el slider al 100% alcanza de forma natural al canal contiguo
RANGOS_TONO: dict[str, tuple[float, float]] = {
    "rojo": (-40.0, 30.0),      # -40° hacia Rosa, +30° hacia Naranja
    "naranja": (-30.0, 30.0),   # -30° hacia Rojo, +30° hacia Amarillo
    "amarillo": (-30.0, 60.0),  # -30° hacia Naranja, +60° hacia Verde
    "verde": (-60.0, 60.0),     # -60° hacia Amarillo, +60° hacia Cyan
    "cyan": (-60.0, 60.0),      # -60° hacia Verde, +60° hacia Azul
    "azul": (-60.0, 40.0),      # -60° hacia Cyan, +40° hacia Violeta
    "violeta": (-40.0, 40.0),   # -40° hacia Azul, +40° hacia Rosa
    "rosa": (-40.0, 40.0),      # -40° hacia Violeta, +40° hacia Rojo
}


def rgb_a_hsl(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Convierte un arreglo RGB en rango [0.0, 1.0] a H [0, 360), S [0, 1], L [0, 1]."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    delta = max_c - min_c

    l = (max_c + min_c) * 0.5
    s = np.zeros_like(l)

    mask = delta > 1e-5
    denom = np.where(l < 0.5, max_c + min_c, 2.0 - max_c - min_c)
    s[mask] = delta[mask] / (denom[mask] + 1e-7)

    h = np.zeros_like(l)
    mask_r = mask & (max_c == r)
    h[mask_r] = ((g[mask_r] - b[mask_r]) / (delta[mask_r] + 1e-7)) % 6.0

    mask_g = mask & (max_c == g)
    h[mask_g] = ((b[mask_g] - r[mask_g]) / (delta[mask_g] + 1e-7)) + 2.0

    mask_b = mask & (max_c == b)
    h[mask_b] = ((r[mask_b] - g[mask_b]) / (delta[mask_b] + 1e-7)) + 4.0

    h = (h * 60.0) % 360.0
    return h, s, l


def hsl_a_rgb(h: np.ndarray, s: np.ndarray, l: np.ndarray) -> np.ndarray:
    """Convierte H [0, 360), S [0, 1], L [0, 1] a RGB en rango [0.0, 1.0]."""
    c = (1.0 - np.abs(2.0 * l - 1.0)) * s
    x = c * (1.0 - np.abs((h / 60.0) % 2.0 - 1.0))
    m = l - c * 0.5

    h_idx = (h / 60.0).astype(np.int32) % 6
    rgb = np.zeros(h.shape + (3,), dtype=np.float32)

    m0 = h_idx == 0
    rgb[m0, 0] = c[m0]; rgb[m0, 1] = x[m0]; rgb[m0, 2] = 0.0

    m1 = h_idx == 1
    rgb[m1, 0] = x[m1]; rgb[m1, 1] = c[m1]; rgb[m1, 2] = 0.0

    m2 = h_idx == 2
    rgb[m2, 0] = 0.0; rgb[m2, 1] = c[m2]; rgb[m2, 2] = x[m2]

    m3 = h_idx == 3
    rgb[m3, 0] = 0.0; rgb[m3, 1] = x[m3]; rgb[m3, 2] = c[m3]

    m4 = h_idx == 4
    rgb[m4, 0] = x[m4]; rgb[m4, 1] = 0.0; rgb[m4, 2] = c[m4]

    m5 = h_idx == 5
    rgb[m5, 0] = c[m5]; rgb[m5, 1] = 0.0; rgb[m5, 2] = x[m5]

    rgb += m[..., None]
    return np.clip(rgb, 0.0, 1.0)


def procesar_color(
    imagen: Image.Image,
    temperatura: float = 0.0,
    tinte: float = 0.0,
    mezcla_color: dict[str, dict[str, float]] | None = None,
) -> Image.Image:
    """Aplica balance de blancos (temperatura y tinte) y mezcla de colores HSL.

    Args:
        imagen: Imagen PIL de entrada.
        temperatura: -100.0 (Frío/Azul) a +100.0 (Cálido/Ámbar).
        tinte: -100.0 (Verde) a +100.0 (Magenta).
        mezcla_color: Diccionario con canal ('rojo', 'naranja', etc.) y valores
                      {'tono': [-100..100], 'saturacion': [-100..100], 'luminancia': [-100..100]}.
    """
    temp_activa = temperatura != 0.0 or tinte != 0.0
    hay_mezcla = False
    if mezcla_color:
        for params in mezcla_color.values():
            if any(params.get(k, 0.0) != 0.0 for k in ("tono", "saturacion", "luminancia")):
                hay_mezcla = True
                break

    if not temp_activa and not hay_mezcla:
        return imagen

    arr = np.array(imagen.convert("RGB"), dtype=np.float32) / 255.0

    # 1. Balance de temperatura y tinte (Von Kries fotográfico equilibrado)
    if temp_activa:
        t = np.clip(temperatura, -100.0, 100.0) / 100.0
        ti = np.clip(tinte, -100.0, 100.0) / 100.0

        if t > 0:
            r_gain = 1.0 + t * 0.40
            b_gain = 1.0 - t * 0.35
            g_gain = 1.0 + t * 0.04
        else:
            r_gain = 1.0 + t * 0.35
            b_gain = 1.0 - t * 0.45
            g_gain = 1.0 - t * 0.04

        if ti > 0:
            g_gain -= ti * 0.28
            r_gain += ti * 0.14
            b_gain += ti * 0.14
        else:
            g_gain -= ti * 0.30
            r_gain += ti * 0.12
            b_gain += ti * 0.12

        arr[..., 0] *= r_gain
        arr[..., 1] *= g_gain
        arr[..., 2] *= b_gain
        np.clip(arr, 0.0, 1.0, out=arr)

    # 2. Mezcla de colores HSL continua estilo Lightroom
    if hay_mezcla and mezcla_color:
        h, s, l = rgb_a_hsl(arr)

        # Máscara de saturación: evita contaminar tonos neutros, blancos y sombras grises
        sat_gate = np.clip((s - 0.03) / 0.12, 0.0, 1.0)
        pesos = {nombre: np.zeros_like(h) for nombre in COLORES_CANALES}

        # Interpolación cúbica Hermite continua sobre el círculo de matices
        for i in range(len(CENTROS_COLOR) - 1):
            c_low = CENTROS_COLOR[i]
            c_high = CENTROS_COLOR[i + 1]
            n_low = NOMBRES_CANALES[i]
            n_high = NOMBRES_CANALES[i + 1]

            mask = (h >= c_low) & (h < c_high)
            if not np.any(mask):
                continue

            t_val = (h[mask] - c_low) / (c_high - c_low)
            w_high = t_val * t_val * (3.0 - 2.0 * t_val)
            w_low = 1.0 - w_high

            gate = sat_gate[mask]
            pesos[n_low][mask] += w_low * gate
            pesos[n_high][mask] += w_high * gate

        delta_h = np.zeros_like(h)
        factor_s = np.ones_like(s)
        factor_l = np.ones_like(l)

        for col, params in mezcla_color.items():
            if col not in pesos:
                continue

            dt = float(params.get("tono", 0.0))
            ds = float(params.get("saturacion", 0.0))
            dl = float(params.get("luminancia", 0.0))

            if dt == 0.0 and ds == 0.0 and dl == 0.0:
                continue

            w = pesos[col]

            # Desplazamiento direccional de tono
            if dt != 0.0:
                span_neg, span_pos = RANGOS_TONO[col]
                span = span_pos if dt > 0.0 else -span_neg
                delta_h += w * (dt / 100.0 * span)

            # Modificación de saturación
            if ds != 0.0:
                if ds < 0.0:
                    # Desaturación progresiva hacia monocromo
                    factor_s *= (1.0 + w * (ds / 100.0))
                else:
                    # Realce rico sin quemar
                    factor_s += w * (ds / 100.0 * 0.90)

            # Luminancia fotográfica (multiplicador de exposición cromática)
            if dl != 0.0:
                factor_l += w * (dl / 100.0 * 0.55)

        h = (h + delta_h) % 360.0
        s = np.clip(s * np.maximum(0.0, factor_s), 0.0, 1.0)

        # Convertir H & S ajustados a RGB
        arr = hsl_a_rgb(h, s, l)

        # Aplicar luminancia selectiva preservando la riqueza cromática
        arr = np.clip(arr * np.maximum(0.0, factor_l)[..., None], 0.0, 1.0)

    res_uint8 = np.clip(arr * 255.0 + 0.5, 0, 255).astype(np.uint8)
    return Image.fromarray(res_uint8)
