import math
from PIL import Image


def rotar_90(imagen: Image.Image, sentido: str = "derecha") -> Image.Image:
    """Rota la imagen 90 grados en el sentido indicado sin pérdida."""
    if sentido == "izquierda":
        return imagen.transpose(Image.Transpose.ROTATE_90)
    return imagen.transpose(Image.Transpose.ROTATE_270)


def _rectangulo_inscrito_rotado(ancho: int, alto: int, angulo_grados: float) -> tuple[int, int]:
    """
    Calcula las dimensiones máximas del rectángulo sin bordes negros
    inscrito dentro de una imagen rotada.
    """
    if ancho <= 0 or alto <= 0:
        return ancho, alto

    alpha = math.radians(abs(angulo_grados))
    if alpha < 1e-6:
        return ancho, alto

    ancho_mayor = ancho >= alto
    lado_largo, lado_corto = (ancho, alto) if ancho_mayor else (alto, ancho)
    sin_a = abs(math.sin(alpha))
    cos_a = abs(math.cos(alpha))

    if sin_a < 1e-9:
        return ancho, alto

    if lado_corto <= 2.0 * sin_a * cos_a * lado_largo or abs(sin_a - cos_a) < 1e-9:
        x = 0.5 * lado_corto
        wr, hr = (x / sin_a, x / cos_a) if ancho_mayor else (x / cos_a, x / sin_a)
    else:
        cos_2a = cos_a * cos_a - sin_a * sin_a
        wr = (ancho * cos_a - alto * sin_a) / cos_2a
        hr = (alto * cos_a - ancho * sin_a) / cos_2a

    # Margen de 2px cuando la imagen es suficientemente grande para evitar anti-aliasing negro en bordes
    w_final = max(1, int(math.floor(wr)) - (2 if wr > 16 else 0))
    h_final = max(1, int(math.floor(hr)) - (2 if hr > 16 else 0))
    return min(w_final, ancho), min(h_final, alto)


def aplicar_enderezado(imagen: Image.Image, angulo: float) -> Image.Image:
    """
    Endereza el horizonte rotando la imagen (-45 a +45 grados) y recortando
    automáticamente al área útil inscrita para no dejar esquinas negras.
    """
    angulo = max(-45.0, min(45.0, float(angulo)))
    if abs(angulo) < 0.05:
        return imagen

    ancho, alto = imagen.size
    rotada = imagen.rotate(-angulo, resample=Image.Resampling.BICUBIC, expand=True)
    try:
        rw, rh = rotada.size
        crop_w, crop_h = _rectangulo_inscrito_rotado(ancho, alto, angulo)
        crop_w = min(crop_w, rw)
        crop_h = min(crop_h, rh)

        left = max(0, (rw - crop_w) // 2)
        top = max(0, (rh - crop_h) // 2)
        return rotada.crop((left, top, left + crop_w, top + crop_h))
    finally:
        rotada.close()

