from PIL import Image


def aplicar_recorte(imagen: Image.Image, x: int, y: int, ancho: int, alto: int) -> Image.Image:
    caja = (x, y, x + ancho, y + alto)
    return imagen.crop(caja)
