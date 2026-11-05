"""
DITHERIX // MÓDULO DE MARCOS DECORATIVOS
Generación procedimental de alta calidad con Pillow y NumPy:
1. Ninguno (sin marco)
2. Marco Liso (color y grosor configurables)
3. Polaroid Clásico (proporciones de emulsión blanca con bisel fino)
4. Polaroid Gastado / Quemado (cartón envejecido, viñeteado quemado, grano de papel)
5. Tira de Película de 35mm (negativo negro mate con perforaciones auténticas y códigos analógicos)
"""

from __future__ import annotations

import re
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ESTILOS_MARCO = ("ninguno", "liso", "polaroid", "polaroid_gastado", "pelicula")


def _color_valido(color_hex: str, color_defecto: str = "#ffffff") -> str:
    """Valida y normaliza un color hexadecimal."""
    if not isinstance(color_hex, str):
        return color_defecto
    color_hex = color_hex.strip()
    if re.match(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", color_hex):
        return color_hex
    return color_defecto


def _marco_liso(imagen: Image.Image, color: str = "#ffffff", grosor: int = 24) -> Image.Image:
    """Genera un marco liso con color y grosor configurables."""
    w, h = imagen.size
    # Escalar el grosor mínimo y máximo proporcionalmente
    g = max(4, min(int(grosor), int(max(w, h) * 0.25)))
    c = _color_valido(color, "#ffffff")

    nuevo_w = w + 2 * g
    nuevo_h = h + 2 * g

    lienzo = Image.new("RGB", (nuevo_w, nuevo_h), color=c)
    lienzo.paste(imagen, (g, g))
    return lienzo


def _marco_polaroid(imagen: Image.Image) -> Image.Image:
    """Genera un marco clásico estilo Polaroid con bordes tradicionales."""
    w, h = imagen.size

    # Proporciones clásicas de Polaroid: lados y arriba ~6.5%, base amplia ~23%
    borde_lr = max(16, int(w * 0.065))
    borde_top = max(16, int(h * 0.065))
    borde_bottom = max(54, int(h * 0.23))

    nuevo_w = w + 2 * borde_lr
    nuevo_h = h + borde_top + borde_bottom

    # Tono blanco roto clásico de cartón fotográfico
    lienzo = Image.new("RGB", (nuevo_w, nuevo_h), color="#f7f6f2")
    lienzo.paste(imagen, (borde_lr, borde_top))

    # Bisel interior tenue para simular el corte y profundidad de la ventana
    draw = ImageDraw.Draw(lienzo)
    draw.rectangle([borde_lr - 1, borde_top - 1, borde_lr + w, borde_top + h], outline="#dedbd2")
    return lienzo


def _marco_polaroid_gastado(imagen: Image.Image) -> Image.Image:
    """Genera un marco Polaroid con cartón envejecido, viñeteado quemado y grano orgánico."""
    w, h = imagen.size

    borde_lr = max(18, int(w * 0.07))
    borde_top = max(18, int(h * 0.07))
    borde_bottom = max(58, int(h * 0.24))

    nuevo_w = w + 2 * borde_lr
    nuevo_h = h + borde_top + borde_bottom

    # Base de cartón envejecido cálido
    base_arr = np.full((nuevo_h, nuevo_w, 3), [236, 224, 202], dtype=np.float32)

    # Grano de papel orgánico
    rng = np.random.default_rng(seed=42)
    ruido = rng.normal(0.0, 3.2, (nuevo_h, nuevo_w, 1)).astype(np.float32)
    base_arr += ruido

    # Gradiente de bordes quemados / envejecidos
    yy, xx = np.mgrid[0:nuevo_h, 0:nuevo_w]
    dist_izq = xx
    dist_der = nuevo_w - 1 - xx
    dist_arr = yy
    dist_aba = nuevo_h - 1 - yy
    dist_borde_min = np.minimum(np.minimum(dist_izq, dist_der), np.minimum(dist_arr, dist_aba))

    alcance_quemado = max(24.0, float(min(borde_lr, borde_top)) * 1.4)
    mascara_quemado = np.clip((alcance_quemado - dist_borde_min) / alcance_quemado, 0.0, 1.0)

    # Tostar los bordes exteriores hacia tonos sepia/ámbar oscuro
    base_arr[..., 0] -= mascara_quemado * 42.0
    base_arr[..., 1] -= mascara_quemado * 58.0
    base_arr[..., 2] -= mascara_quemado * 78.0

    carton = Image.fromarray(np.clip(base_arr, 0, 255).astype(np.uint8))
    carton.paste(imagen, (borde_lr, borde_top))

    draw = ImageDraw.Draw(carton)
    # Doble línea interior desgastada
    draw.rectangle([borde_lr - 1, borde_top - 1, borde_lr + w, borde_top + h], outline="#8f7253")
    draw.rectangle([borde_lr - 2, borde_top - 2, borde_lr + w + 1, borde_top + h + 1], outline="#bfa384")

    return carton


def _marco_pelicula(imagen: Image.Image) -> Image.Image:
    """Genera un marco estilo negativo de tira de película de 35mm con perforaciones y tipografía analógica."""
    w, h = imagen.size

    margen_y = max(38, int(h * 0.13))
    margen_x = max(18, int(w * 0.04))

    nuevo_w = w + 2 * margen_x
    nuevo_h = h + 2 * margen_y

    # Fondo negro mate de película
    lienzo = Image.new("RGB", (nuevo_w, nuevo_h), color="#0c0c0e")
    draw = ImageDraw.Draw(lienzo)

    # Pegar fotografía en el fotograma central
    lienzo.paste(imagen, (margen_x, margen_y))

    # Perforaciones (sprocket holes)
    agujero_w = max(10, int(margen_y * 0.38))
    agujero_h = max(14, int(margen_y * 0.50))
    radio_esquina = max(2, int(agujero_w * 0.28))
    paso = max(28, int(agujero_w * 2.2))

    y_arr = int((margen_y - agujero_h) / 2)
    y_aba = nuevo_h - margen_y + int((margen_y - agujero_h) / 2)

    color_agujero = "#ffffff"  # Perforación iluminada / translúcida

    x_inicio = int((nuevo_w % paso) / 2) + int(paso * 0.25)
    for x_pos in range(x_inicio, nuevo_w - agujero_w, paso):
        draw.rounded_rectangle(
            [x_pos, y_arr, x_pos + agujero_w, y_arr + agujero_h],
            radius=radio_esquina,
            fill=color_agujero,
        )
        draw.rounded_rectangle(
            [x_pos, y_aba, x_pos + agujero_w, y_aba + agujero_h],
            radius=radio_esquina,
            fill=color_agujero,
        )

    # Tipografía analógica en color ámbar retro
    color_texto = "#ff9f43"
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    # Textos característicos de película 35mm
    y_texto_arr = y_arr + agujero_h + 2
    y_texto_aba = nuevo_h - margen_y - 13

    if y_texto_arr < margen_y - 2:
        draw.text((margen_x + 8, y_texto_arr), "KODAK 400", fill=color_texto, font=font)
        draw.text((nuevo_w - margen_x - 64, y_texto_arr), "▶ 24A", fill=color_texto, font=font)

    if y_texto_aba > nuevo_h - margen_y + 1 or y_texto_aba < nuevo_h:
        draw.text((margen_x + 8, nuevo_h - int(margen_y * 0.38)), "SAFETY FILM", fill=color_texto, font=font)
        draw.text((nuevo_w - margen_x - 52, nuevo_h - int(margen_y * 0.38)), "▶ 24", fill=color_texto, font=font)

    return lienzo


def aplicar_marco(
    imagen: Image.Image,
    estilo: str = "ninguno",
    color: str = "#ffffff",
    grosor: int = 24,
) -> Image.Image:
    """Aplica el estilo de marco decorativo especificado a la imagen.

    Args:
        imagen: Imagen PIL procesada.
        estilo: "ninguno", "liso", "polaroid", "polaroid_gastado" o "pelicula".
        color: Color hexadecimal para marco liso (ej: "#ffffff", "#000000").
        grosor: Grosor en píxeles para marco liso.
    """
    if not estilo or estilo == "ninguno":
        return imagen

    estilo_norm = estilo.lower().strip()
    if estilo_norm == "liso":
        return _marco_liso(imagen, color=color, grosor=grosor)
    elif estilo_norm == "polaroid":
        return _marco_polaroid(imagen)
    elif estilo_norm == "polaroid_gastado":
        return _marco_polaroid_gastado(imagen)
    elif estilo_norm == "pelicula":
        return _marco_pelicula(imagen)

    return imagen

