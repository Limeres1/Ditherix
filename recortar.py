from PIL import Image


def aplicar_recorte(imagen: Image.Image, x: int, y: int, ancho: int, alto: int) -> Image.Image:
    if x < 0 or y < 0 or ancho <= 0 or alto <= 0:
        raise ValueError("El área de recorte debe tener coordenadas y dimensiones válidas.")
    if x + ancho > imagen.width or y + alto > imagen.height:
        raise ValueError("El área de recorte debe estar dentro de la imagen.")

    caja = (x, y, x + ancho, y + alto)
    return imagen.crop(caja)
