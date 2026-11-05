"""
DITHERIX // MÓDULO DE BLANCO Y NEGRO FOTOGRÁFICO Y MEZCLADOR DE CANALES
Conversión fotográfica profesional a escala de grises con:
1. Mezclador continuo de 8 canales (Rojo, Naranja, Amarillo, Verde, Cyan, Azul, Violeta, Rosa)
2. Filtros analógicos ópticos preestablecidos (Rojo, Amarillo, Verde, Azul, Infrarrojo Wood, etc.)
3. Virados químicos clásicos de laboratorio (Sepia, Cianotipia, Selenio, Platino) con intensidad
Implementado con cálculo matricial vectorizado en NumPy para máximo rendimiento.
"""

from __future__ import annotations

import numpy as np
from PIL import Image

from color_mixer import (
    COLORES_CANALES,
    CENTROS_COLOR,
    NOMBRES_CANALES,
    rgb_a_hsl,
)

# Filtros analógicos clásicos que ajustan los canales de forma fotográfica
FILTROS_BYN: dict[str, dict[str, float]] = {
    "neutro": {c: 0.0 for c in COLORES_CANALES},
    "rojo": {
        "rojo": 70.0,
        "naranja": 45.0,
        "amarillo": 15.0,
        "verde": -25.0,
        "cyan": -50.0,
        "azul": -75.0,
        "violeta": -20.0,
        "rosa": 25.0,
    },
    "naranja": {
        "rojo": 40.0,
        "naranja": 55.0,
        "amarillo": 30.0,
        "verde": -15.0,
        "cyan": -35.0,
        "azul": -55.0,
        "violeta": -10.0,
        "rosa": 15.0,
    },
    "amarillo": {
        "rojo": 15.0,
        "naranja": 35.0,
        "amarillo": 55.0,
        "verde": 15.0,
        "cyan": -20.0,
        "azul": -45.0,
        "violeta": -15.0,
        "rosa": 0.0,
    },
    "verde": {
        "rojo": -35.0,
        "naranja": -15.0,
        "amarillo": 25.0,
        "verde": 75.0,
        "cyan": 25.0,
        "azul": -35.0,
        "violeta": -40.0,
        "rosa": -30.0,
    },
    "azul": {
        "rojo": -55.0,
        "naranja": -45.0,
        "amarillo": -30.0,
        "verde": -10.0,
        "cyan": 45.0,
        "azul": 75.0,
        "violeta": 40.0,
        "rosa": -10.0,
    },
    "infrarrojo": {
        "rojo": 35.0,
        "naranja": 25.0,
        "amarillo": 65.0,
        "verde": 100.0,
        "cyan": -75.0,
        "azul": -95.0,
        "violeta": -50.0,
        "rosa": 20.0,
    },
}

# Paletas de virado químico (sombras -> altas luces) en rango [0.0, 1.0]
VIRADOS_BYN: dict[str, dict[str, tuple[float, float, float]]] = {
    "sepia": {
        "dark": (0.22, 0.12, 0.05),
        "light": (1.00, 0.94, 0.82),
    },
    "cianotipia": {
        "dark": (0.06, 0.16, 0.28),
        "light": (0.84, 0.92, 0.98),
    },
    "selenio": {
        "dark": (0.16, 0.14, 0.20),
        "light": (0.96, 0.95, 0.98),
    },
    "platino": {
        "dark": (0.12, 0.14, 0.16),
        "light": (0.95, 0.96, 0.98),
    },
}


def procesar_byn(
    imagen: Image.Image,
    activo: bool = False,
    canales: dict[str, float] | None = None,
    virado: str = "ninguno",
    virado_intensidad: float = 70.0,
) -> Image.Image:
    """Convierte la imagen a Blanco y Negro utilizando un mezclador selectivo de canales y virado.

    Args:
        imagen: Imagen PIL de entrada.
        activo: Si True, se ejecuta la conversión a blanco y negro.
        canales: Diccionario con valor [-100..100] para cada color.
        virado: "ninguno", "sepia", "cianotipia", "selenio" o "platino".
        virado_intensidad: Intensidad del virado [0..100].
    """
    if not activo:
        return imagen

    arr = np.array(imagen.convert("RGB"), dtype=np.float32) / 255.0
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]

    # Luminancia base Rec. 709 perceptualmente calibrada
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b

    # Cálculo de los pesos continuos por canal
    h, s, _ = rgb_a_hsl(arr)
    sat_gate = np.clip((s - 0.03) / 0.12, 0.0, 1.0)
    pesos = {nombre: np.zeros_like(h) for nombre in COLORES_CANALES}

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

    # Modulación de luminancia por canal de color
    delta_y = np.zeros_like(y)
    if canales:
        for col in COLORES_CANALES:
            val = float(canales.get(col, 0.0))
            if val != 0.0:
                delta_y += pesos[col] * (val / 100.0 * 0.45)

    y_final = np.clip(y + delta_y, 0.0, 1.0)

    # Virado químico monocromo (Split toning)
    virado_norm = (virado or "ninguno").lower().strip()
    if virado_norm != "ninguno" and virado_norm in VIRADOS_BYN and virado_intensidad > 0.0:
        t_data = VIRADOS_BYN[virado_norm]
        c_dark = np.array(t_data["dark"], dtype=np.float32)
        c_light = np.array(t_data["light"], dtype=np.float32)

        alpha = float(np.clip(virado_intensidad, 0.0, 100.0) / 100.0)
        y_exp = y_final[..., None]
        toned_rgb = (1.0 - y_exp) * c_dark + y_exp * c_light
        rgb_res = (1.0 - alpha) * y_exp + alpha * toned_rgb
    else:
        rgb_res = np.repeat(y_final[..., None], 3, axis=-1)

    res_uint8 = np.clip(rgb_res * 255.0 + 0.5, 0, 255).astype(np.uint8)
    return Image.fromarray(res_uint8)

