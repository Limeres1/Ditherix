from PIL import Image, ImageOps


def voltear_horizontal(imagen: Image.Image) -> Image.Image:
    return ImageOps.mirror(imagen)

def voltear_vertical(imagen: Image.Image) -> Image.Image:
    return ImageOps.flip(imagen)
