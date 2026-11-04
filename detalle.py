import random
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


_CACHE_GRANO: dict[tuple[int, int], Image.Image] = {}


def _obtener_trama_grano(ancho: int, alto: int) -> Image.Image:
    """Genera una trama de ruido monocromático reproducible y la guarda en caché por resolución."""
    clave = (ancho, alto)
    if clave not in _CACHE_GRANO:
        rng = random.Random(1984)  # Semilla fija para evitar parpadeos al ajustar otros controles
        datos = rng.randbytes(ancho * alto)
        _CACHE_GRANO[clave] = Image.frombytes("L", (ancho, alto), datos)
    return _CACHE_GRANO[clave]


def aplicar_grano(imagen: Image.Image, valor: float) -> Image.Image:
    """
    Agrega textura granulada analógica.
    valor: 0 a 100. Neutro es 0 (o menor), donde devuelve la imagen original sin tocar.
    """
    if valor <= 0:
        return imagen
    ancho, alto = imagen.size
    trama_rgb = _obtener_trama_grano(ancho, alto).convert("RGB")
    alpha = (limitar(valor, 0, 100) / 100.0) * 0.28
    return Image.blend(imagen, trama_rgb, alpha)


AJUSTES_DETALLE: dict[str, tuple[str, TipoAjuste]] = {
    "desenfoque": ("desenfoque", aplicar_desenfoque),
    "nitidez": ("nitidez", aplicar_nitidez),
    "grano": ("grano", aplicar_grano),
}


def procesar_detalle(
    imagen: Image.Image,
    factores: dict[str, float],
) -> Image.Image:
    def es_neutro(nombre: str, val: float) -> bool:
        if nombre == "grano":
            return val <= 0
        return val == 1.0

    if all(es_neutro(nombre, factores.get(nombre, 0.0 if nombre == "grano" else 1.0)) for nombre in AJUSTES_DETALLE):
        return imagen

    resultado = imagen
    try:
        for nombre, (_, funcion) in AJUSTES_DETALLE.items():
            if nombre in factores:
                factor = factores[nombre]
                if es_neutro(nombre, factor):
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