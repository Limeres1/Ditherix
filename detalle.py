from collections.abc import Callable

from PIL import Image, ImageEnhance, ImageFilter

TipoAjuste = Callable[[Image.Image, float], Image.Image]


def limitar(valor: float, minimo: float, maximo: float) -> float:
    return max(minimo, min(maximo, valor))


def slider_a_factor(valor: float) -> float:
    return 1 + limitar(valor, -100, 100) / 100


def aplicar_nitidez(imagen: Image.Image, factor: float) -> Image.Image:
    if factor == 1.0:
        return imagen
    return ImageEnhance.Sharpness(imagen).enhance(factor)


def aplicar_enfoque(imagen: Image.Image, factor: float) -> Image.Image:
    if factor == 1.0:
        return imagen
    if factor > 1.0:
        percent = int(limitar((factor - 1.0) * 150, 0, 300))
        return imagen.filter(ImageFilter.UnsharpMask(radius=2, percent=percent, threshold=3))
    else:
        radius = limitar((1.0 - factor) * 10, 0, 20)
        return imagen.filter(ImageFilter.GaussianBlur(radius=radius))


def aplicar_desenfoque(imagen: Image.Image, factor: float) -> Image.Image:
    if factor == 1.0:
        return imagen
    if factor > 1.0:
        radius = limitar((factor - 1.0) * 10, 0, 20)
        return imagen.filter(ImageFilter.GaussianBlur(radius=radius))
    else:
        percent = int(limitar((1.0 - factor) * 150, 0, 300))
        return imagen.filter(ImageFilter.UnsharpMask(radius=2, percent=percent, threshold=3))


AJUSTES_DETALLE: dict[str, tuple[str, TipoAjuste]] = {
    "desenfoque": ("desenfoque", aplicar_desenfoque),
    "nitidez": ("nitidez", aplicar_nitidez),
}


def procesar_detalle(
    imagen: Image.Image,
    factores: dict[str, float],
) -> Image.Image:
    if all(factores.get(nombre, 1.0) == 1.0 for nombre in AJUSTES_DETALLE):
        return imagen

    resultado = imagen
    try:
        for nombre, (_, funcion) in AJUSTES_DETALLE.items():
            if nombre in factores:
                factor = factores[nombre]
                if factor == 1.0:
                    continue
                siguiente = funcion(resultado, factor)
                if resultado is not imagen and resultado is not siguiente:
                    resultado.close()
                resultado = siguiente
        return resultado
    except Exception:
        if resultado is not imagen:
            resultado.close()
        raise