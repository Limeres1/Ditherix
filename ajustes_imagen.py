from collections.abc import Callable

from PIL import Image, ImageEnhance

TipoAjuste = Callable[[Image.Image, float], Image.Image]


def limitar(valor: float, minimo: float, maximo: float) -> float:
    return max(minimo, min(maximo, valor))

def slider_a_factor(valor: float) -> float:
    return 1 + limitar(valor, -100, 100) / 100

def aplicar_brillo(imagen: Image.Image, factor: float) -> Image.Image:
    return ImageEnhance.Brightness(imagen).enhance(factor)

def aplicar_contraste(imagen: Image.Image, factor: float) -> Image.Image:
    return ImageEnhance.Contrast(imagen).enhance(factor)

def aplicar_saturacion(imagen: Image.Image, factor: float) -> Image.Image:
    return ImageEnhance.Color(imagen).enhance(factor)



AJUSTES_DISPONIBLES: dict[str, tuple[str, TipoAjuste]] = {
    "brillo": ("brillo", aplicar_brillo),
    "contraste": ("contraste", aplicar_contraste),
    "saturacion": ("saturación", aplicar_saturacion)
}


def procesar_ajustes(
    imagen: Image.Image,
    factores: dict[str, float],
) -> Image.Image:
    resultado = imagen
    try:
        for nombre, (_, funcion) in AJUSTES_DISPONIBLES.items():
            siguiente = funcion(resultado, factores[nombre])
            if resultado is not imagen and resultado is not siguiente:
                resultado.close()
            resultado = siguiente
        return resultado
    except Exception:
        if resultado is not imagen:
            resultado.close()
        raise
