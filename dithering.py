"""
DITHERIX // MÓDULO DE DITHERING RETRO Y CUANTIZACIÓN DE COLOR
Implementación de alto rendimiento acelerada con Pillow nativo (sin bibliotecas externas).
Algoritmos soportados: Floyd-Steinberg, Bayer 4x4, Bayer 8x8, Atkinson y Cuantización Directa.
Paletas: Monocromo B&N, Game Boy Clásico, CGA Retro, Ámbar CRT y Cyberpunk.
"""

from PIL import Image, ImageChops

PALETAS = {
    "bn": [(0, 0, 0), (255, 255, 255)],
    "gameboy": [(15, 56, 15), (48, 98, 48), (139, 172, 15), (155, 188, 15)],
    "cga": [(0, 0, 0), (85, 255, 255), (255, 85, 255), (255, 255, 255)],
    "ambar": [(20, 10, 0), (100, 48, 0), (190, 110, 0), (255, 185, 0)],
    "cyberpunk": [(10, 10, 24), (255, 0, 90), (0, 235, 255), (255, 255, 255)],
    "matrix": [(5, 15, 5), (15, 60, 20), (35, 160, 45), (140, 255, 150)],
    "vaporwave": [(25, 10, 40), (150, 40, 140), (255, 110, 180), (100, 240, 255)],
    "termica": [(0, 0, 40), (120, 0, 140), (230, 60, 20), (255, 220, 0), (255, 255, 255)],
}

MATRIZ_BAYER_4X4 = [
    0, 136, 34, 170,
    204, 68, 238, 102,
    51, 187, 17, 153,
    255, 119, 221, 85,
]

MATRIZ_BAYER_8X8 = [
    0, 128, 32, 160, 8, 136, 40, 168,
    192, 64, 224, 96, 200, 72, 232, 104,
    48, 176, 16, 144, 56, 184, 24, 152,
    240, 112, 208, 80, 248, 120, 216, 88,
    12, 140, 44, 172, 4, 132, 36, 164,
    204, 76, 236, 108, 196, 68, 228, 100,
    60, 188, 28, 156, 52, 180, 20, 148,
    252, 124, 220, 92, 244, 116, 212, 84,
]


def _crear_imagen_paleta(colores: list[tuple[int, int, int]]) -> Image.Image:
    """Crea una imagen modo 'P' de 1x1 con los 256 colores requeridos por Pillow."""
    img_pal = Image.new("P", (1, 1))
    datos_paleta = []
    for r, g, b in colores:
        datos_paleta.extend([r, g, b])
    # Pillow exige que la paleta en putpalette tenga exactamente 768 valores (256 colores * 3 canales)
    datos_paleta.extend([0] * (768 - len(datos_paleta)))
    img_pal.putpalette(datos_paleta)
    return img_pal


def _generar_trama_bayer(ancho: int, alto: int, tamano: int = 4) -> Image.Image:
    """Genera una imagen en escala de grises con el patrón de Bayer repetido para cubrir el tamaño dado."""
    matriz = MATRIZ_BAYER_4X4 if tamano == 4 else MATRIZ_BAYER_8X8
    dim = tamano
    cuadro = Image.frombytes("L", (dim, dim), bytes(matriz))

    tile = cuadro
    while tile.width < ancho:
        ancho_sig = min(ancho, tile.width * 2)
        nuevo = Image.new("L", (ancho_sig, tile.height))
        nuevo.paste(tile, (0, 0))
        nuevo.paste(tile, (tile.width, 0))
        tile = nuevo

    while tile.height < alto:
        alto_sig = min(alto, tile.height * 2)
        nuevo = Image.new("L", (tile.width, alto_sig))
        nuevo.paste(tile, (0, 0))
        nuevo.paste(tile, (0, tile.height))
        tile = nuevo

    return tile


def _aplicar_dithering_atkinson(imagen: Image.Image, colores: list[tuple[int, int, int]]) -> Image.Image:
    """
    Algoritmo de difusión de error Atkinson (usado originalmente en Mac OS clásico).
    Distribuye 3/4 del error hacia 6 píxeles vecinos (1/8 a cada uno).
    """
    ancho_orig, alto_orig = imagen.size

    # Si la imagen es muy grande, limitamos temporalmente a 640 px para que no tarde más de 1 segundo
    if max(ancho_orig, alto_orig) > 640:
        escala = max(ancho_orig, alto_orig) / 640.0
        nuevo_w = max(1, int(ancho_orig / escala))
        nuevo_h = max(1, int(alto_orig / escala))
        gris = imagen.convert("L").resize((nuevo_w, nuevo_h), Image.Resampling.BILINEAR)
    else:
        escala = 1.0
        gris = imagen.convert("L")

    ancho, alto = gris.size
    pixeles = list(gris.getdata())

    oscuro = colores[0]
    claro = colores[-1]

    for y in range(alto):
        y_ancho = y * ancho
        for x in range(ancho):
            idx = y_ancho + x
            antiguo = pixeles[idx]
            nuevo = 255 if antiguo > 127 else 0
            pixeles[idx] = nuevo

            error = (antiguo - nuevo) >> 3  # equivale a error // 8

            if error != 0:
                # Vecino derecha (+1, 0)
                if x + 1 < ancho:
                    pixeles[idx + 1] = max(0, min(255, pixeles[idx + 1] + error))
                # Vecino dos a la derecha (+2, 0)
                if x + 2 < ancho:
                    pixeles[idx + 2] = max(0, min(255, pixeles[idx + 2] + error))

                # Fila de abajo (y + 1)
                if y + 1 < alto:
                    # (-1, +1)
                    if x > 0:
                        pixeles[idx + ancho - 1] = max(0, min(255, pixeles[idx + ancho - 1] + error))
                    # (0, +1)
                    pixeles[idx + ancho] = max(0, min(255, pixeles[idx + ancho] + error))
                    # (+1, +1)
                    if x + 1 < ancho:
                        pixeles[idx + ancho + 1] = max(0, min(255, pixeles[idx + ancho + 1] + error))

                # Dos filas abajo (y + 2, 0)
                if y + 2 < alto:
                    pixeles[idx + (ancho * 2)] = max(0, min(255, pixeles[idx + (ancho * 2)] + error))

    resultado = Image.new("RGB", (ancho, alto))
    datos_rgb = [claro if p > 127 else oscuro for p in pixeles]
    resultado.putdata(datos_rgb)

    if escala > 1.0:
        escalado = resultado.resize((ancho_orig, alto_orig), Image.Resampling.NEAREST)
        resultado.close()
        return escalado

    return resultado


def aplicar_dithering(
    imagen: Image.Image,
    algoritmo: str,
    paleta_nombre: str = "bn",
    tamano_pixel: int = 1,
    intensidad: int = 100,
) -> Image.Image:
    """
    Aplica dithering o cuantización de color sobre una imagen PIL.

    Parámetros:
        imagen: Objeto PIL.Image.
        algoritmo: 'ninguno', 'floyd_steinberg', 'bayer_4', 'bayer_8', 'atkinson' o 'cuantizacion'.
        paleta_nombre: 'bn', 'gameboy', 'cga', 'ambar' o 'cyberpunk'.
        tamano_pixel: Entero de 1 a 8 indicando el tamaño de cada píxel retro.
    """
    if algoritmo == "ninguno" or not algoritmo:
        return imagen

    colores = PALETAS.get(paleta_nombre, PALETAS["bn"])
    img_paleta = _crear_imagen_paleta(colores)

    ancho_orig, alto_orig = imagen.size
    tamano_pixel = max(1, min(8, int(tamano_pixel)))

    # Reducción previa si tamano_pixel > 1 para dar el efecto de píxeles retro grandes
    if tamano_pixel > 1:
        ancho_reducido = max(1, ancho_orig // tamano_pixel)
        alto_reducido = max(1, alto_orig // tamano_pixel)
        imagen_trabajo = imagen.resize((ancho_reducido, alto_reducido), Image.Resampling.BILINEAR)
    else:
        imagen_trabajo = imagen

    w, h = imagen_trabajo.size
    img_rgb = imagen_trabajo.convert("RGB")

    if algoritmo == "floyd_steinberg":
        dithered = img_rgb.quantize(palette=img_paleta, dither=Image.Dither.FLOYDSTEINBERG).convert("RGB")

    elif algoritmo in ("bayer_4", "bayer_8"):
        tam = 4 if algoritmo == "bayer_4" else 8
        trama = _generar_trama_bayer(w, h, tamano=tam)
        modulada = ImageChops.add(img_rgb.convert("L"), trama, scale=1.0, offset=-64)
        modulada_rgb = modulada.convert("RGB")
        dithered = modulada_rgb.quantize(palette=img_paleta, dither=Image.Dither.NONE).convert("RGB")

    elif algoritmo == "atkinson":
        dithered = _aplicar_dithering_atkinson(img_rgb, colores)

    else:
        # Cuantización directa (sin trama ni difusión de error)
        dithered = img_rgb.quantize(palette=img_paleta, dither=Image.Dither.NONE).convert("RGB")

    # Restaurar tamaño original con escalado NEAREST para que los píxeles queden nítidos y cuadrados
    if tamano_pixel > 1:
        resultado = dithered.resize((ancho_orig, alto_orig), Image.Resampling.NEAREST)
        dithered.close()
    else:
        resultado = dithered

    # Mezcla de intensidad (0..100) para permitir que la foto original se trasluzca
    intensidad = max(0, min(100, int(intensidad)))
    if intensidad <= 0:
        if resultado is not imagen:
            resultado.close()
        return imagen
    elif intensidad < 100:
        alpha = intensidad / 100.0
        mezcla = Image.blend(imagen.convert("RGB"), resultado, alpha)
        if resultado is not imagen:
            resultado.close()
        return mezcla

    return resultado

