from collections.abc import Callable

import numpy as np
from PIL import Image, ImageEnhance

TipoAjuste = Callable[[Image.Image, float], Image.Image]


def limitar(valor: float, minimo: float, maximo: float) -> float:
    return max(minimo, min(maximo, valor))


def slider_a_factor(valor: float) -> float:
    return 1 + limitar(valor, -100, 100) / 100


def aplicar_brillo(imagen: Image.Image, factor: float) -> Image.Image:
    if factor == 1.0:
        return imagen
    return ImageEnhance.Brightness(imagen).enhance(factor)


def aplicar_contraste(imagen: Image.Image, factor: float) -> Image.Image:
    if factor == 1.0:
        return imagen
    return ImageEnhance.Contrast(imagen).enhance(factor)


def aplicar_saturacion(imagen: Image.Image, factor: float) -> Image.Image:
    if factor == 1.0:
        return imagen
    return ImageEnhance.Color(imagen).enhance(factor)


def aplicar_luz_avanzada(
    imagen: Image.Image,
    altas_luces: float = 0.0,
    sombras: float = 0.0,
    fade: float = 0.0,
    vineta: float = 0.0,
) -> Image.Image:
    """
    Aplica curvas tonales avanzadas (altas luces, sombras, fade mate y viñeta)
    en un único paso vectorizado float32 para evitar posterización.
    """
    altas_luces = limitar(float(altas_luces), -100.0, 100.0)
    sombras = limitar(float(sombras), -100.0, 100.0)
    fade = limitar(float(fade), 0.0, 100.0)
    vineta = limitar(float(vineta), -100.0, 100.0)

    if altas_luces == 0.0 and sombras == 0.0 and fade == 0.0 and vineta == 0.0:
        return imagen

    arr = np.asarray(imagen.convert("RGB"), dtype=np.float32) / 255.0

    # 1. Altas luces y sombras basadas en luminancia perceptual Rec. 709
    if altas_luces != 0.0 or sombras != 0.0:
        lum = 0.2126 * arr[:, :, 0] + 0.7152 * arr[:, :, 1] + 0.0722 * arr[:, :, 2]

        if sombras != 0.0:
            sh_mask = np.clip((0.65 - lum) / 0.65, 0.0, 1.0) ** 1.6
            if sombras > 0.0:
                amt = (sombras / 100.0) * 0.52
                arr += sh_mask[:, :, None] * amt * (1.0 - arr)
            else:
                amt = (-sombras / 100.0) * 0.65
                arr *= 1.0 - sh_mask[:, :, None] * amt

        if altas_luces != 0.0:
            hi_mask = np.clip((lum - 0.35) / 0.65, 0.0, 1.0) ** 1.6
            if altas_luces < 0.0:
                amt = (-altas_luces / 100.0) * 0.48
                arr *= 1.0 - hi_mask[:, :, None] * amt
            else:
                amt = (altas_luces / 100.0) * 0.42
                arr += hi_mask[:, :, None] * amt * (1.0 - arr)

    # 2. Fade mate cinematográfico (eleva el punto negro suavemente)
    if fade > 0.0:
        piso = (fade / 100.0) * 0.24
        arr = arr * (1.0 - piso * 0.35) + piso * np.exp(-arr * 2.4)

    # 3. Viñeta óptica elíptica
    if vineta != 0.0:
        h, w = arr.shape[:2]
        cy, cx = (h - 1) * 0.5, (w - 1) * 0.5
        ry = np.linspace(-1.0, 1.0, h, dtype=np.float32) if h > 1 else np.zeros(1, dtype=np.float32)
        rx = np.linspace(-1.0, 1.0, w, dtype=np.float32) if w > 1 else np.zeros(1, dtype=np.float32)
        dist2 = (rx[None, :] ** 2) + (ry[:, None] ** 2)
        mask_v = np.clip((dist2 - 0.22) / 1.45, 0.0, 1.0) ** 1.35

        if vineta < 0.0:
            fuerza = (-vineta / 100.0) * 0.88
            arr *= 1.0 - mask_v[:, :, None] * fuerza
        else:
            fuerza = (vineta / 100.0) * 0.78
            arr += mask_v[:, :, None] * fuerza * (1.0 - arr)

    np.clip(arr, 0.0, 1.0, out=arr)
    return Image.fromarray((arr * 255.0).astype(np.uint8), mode="RGB")


AJUSTES_DISPONIBLES: dict[str, tuple[str, TipoAjuste]] = {
    "brillo": ("brillo", aplicar_brillo),
    "contraste": ("contraste", aplicar_contraste),
    "saturacion": ("saturación", aplicar_saturacion),
}

AJUSTES_TONO_AVANZADO: dict[str, tuple[str, float, float]] = {
    "altas_luces": ("altas luces", -100.0, 100.0),
    "sombras": ("sombras", -100.0, 100.0),
    "fade": ("desvanecer", 0.0, 100.0),
    "vineta": ("viñeta", -100.0, 100.0),
}


def procesar_ajustes(
    imagen: Image.Image,
    factores: dict[str, float],
) -> Image.Image:
    tiene_basicos = any(factores.get(nombre, 1.0) != 1.0 for nombre in AJUSTES_DISPONIBLES)
    altas = float(factores.get("altas_luces", 0.0))
    sombras = float(factores.get("sombras", 0.0))
    fade = float(factores.get("fade", 0.0))
    vineta = float(factores.get("vineta", 0.0))
    tiene_avanzados = any(v != 0.0 for v in (altas, sombras, fade, vineta))

    if not tiene_basicos and not tiene_avanzados:
        return imagen

    resultado = imagen
    try:
        for nombre, (_, funcion) in AJUSTES_DISPONIBLES.items():
            factor = factores.get(nombre, 1.0)
            if factor == 1.0:
                continue
            siguiente = funcion(resultado, factor)
            if resultado is not imagen and resultado is not siguiente:
                resultado.close()
            resultado = siguiente

        if tiene_avanzados:
            siguiente = aplicar_luz_avanzada(
                resultado,
                altas_luces=altas,
                sombras=sombras,
                fade=fade,
                vineta=vineta,
            )
            if resultado is not imagen and resultado is not siguiente:
                resultado.close()
            resultado = siguiente

        return resultado
    except Exception:
        if resultado is not imagen:
            resultado.close()
        raise
