import io

from PIL import Image, ImageEnhance, ImageOps, UnidentifiedImageError

# Este límite protege Pillow de imágenes comprimidas que explotan al decodificarse.
MAX_LADO_PX = 6000
# Se aceptan estos formatos porque Pillow puede decodificarlos de forma fiable.
FORMATOS_PERMITIDOS = {"JPEG", "PNG", "WEBP"}

# El límite por píxeles complementa la comprobación explícita de cada lado.
Image.MAX_IMAGE_PIXELS = MAX_LADO_PX * MAX_LADO_PX


class ErrorImagen(Exception):
    def __init__(self, codigo: str, mensaje: str, status: int):
        super().__init__(mensaje)
        self.codigo = codigo
        self.mensaje = mensaje
        self.status = status


def _error_corrupta() -> ErrorImagen:
    return ErrorImagen(
        "ARCHIVO_CORRUPTO",
        "El archivo de imagen está dañado y no se puede abrir.",
        400,
    )


def _a_rgb(imagen: Image.Image) -> Image.Image:
    tiene_transparencia = "A" in imagen.getbands() or "transparency" in imagen.info
    if not tiene_transparencia:
        return imagen.convert("RGB")

    imagen_rgba = imagen.convert("RGBA")
    fondo = Image.new("RGBA", imagen_rgba.size, "white")
    return Image.alpha_composite(fondo, imagen_rgba).convert("RGB")


def abrir_imagen(datos: bytes) -> Image.Image:
    try:
        encabezado = Image.open(io.BytesIO(datos))
    except UnidentifiedImageError as error:
        raise ErrorImagen(
            "FORMATO_INVALIDO",
            "El archivo no es una imagen JPEG, PNG o WEBP válida.",
            415,
        ) from error
    except Image.DecompressionBombError as error:
        raise ErrorImagen(
            "DIMENSIONES_EXCEDIDAS",
            "La imagen supera las dimensiones máximas de 6000 píxeles por lado.",
            413,
        ) from error
    except (OSError, ValueError) as error:
        raise _error_corrupta() from error

    try:
        formato = encabezado.format
        ancho, alto = encabezado.size

        if formato not in FORMATOS_PERMITIDOS:
            raise ErrorImagen(
                "FORMATO_INVALIDO",
                "El archivo no es una imagen JPEG, PNG o WEBP válida.",
                415,
            )
        if ancho > MAX_LADO_PX or alto > MAX_LADO_PX:
            raise ErrorImagen(
                "DIMENSIONES_EXCEDIDAS",
                "La imagen supera las dimensiones máximas de 6000 píxeles por lado.",
                413,
            )

        encabezado.verify()
    except ErrorImagen:
        raise
    except Image.DecompressionBombError as error:
        raise ErrorImagen(
            "DIMENSIONES_EXCEDIDAS",
            "La imagen supera las dimensiones máximas de 6000 píxeles por lado.",
            413,
        ) from error
    except (OSError, SyntaxError, ValueError, EOFError) as error:
        raise _error_corrupta() from error
    finally:
        encabezado.close()

    try:
        with Image.open(io.BytesIO(datos)) as decodificada:
            decodificada.load()
            orientada = ImageOps.exif_transpose(decodificada)
            return _a_rgb(orientada)
    except Image.DecompressionBombError as error:
        raise ErrorImagen(
            "DIMENSIONES_EXCEDIDAS",
            "La imagen supera las dimensiones máximas de 6000 píxeles por lado.",
            413,
        ) from error
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, EOFError) as error:
        raise _error_corrupta() from error


def generar_vista(imagen: Image.Image) -> tuple[bytes, int, int]:
    ancho_vista, alto_vista = imagen.size
    salida = io.BytesIO()
    imagen.save(salida, format="JPEG", quality=90)
    return salida.getvalue(), ancho_vista, alto_vista


def guardar_procesada_sin_perdida(imagen: Image.Image) -> bytes:
    salida = io.BytesIO()
    imagen.save(salida, format="PNG")
    return salida.getvalue()

