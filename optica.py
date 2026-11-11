import numpy as np
from PIL import Image, ImageFilter


def _limitar(valor: float, minimo: float, maximo: float) -> float:
    return max(minimo, min(maximo, float(valor)))


def aplicar_halacion(imagen: Image.Image, intensidad: float) -> Image.Image:
    """
    Emula halación química de película 35mm (Cinestill):
    halo cálido rojo-naranja alrededor de brillos especulares intensos.
    """
    intensidad = _limitar(intensidad, 0.0, 100.0)
    if intensidad <= 0.0:
        return imagen

    img_rgb = imagen.convert("RGB")
    w, h = img_rgb.size
    arr = np.asarray(img_rgb, dtype=np.float32) / 255.0

    lum = 0.2126 * arr[:, :, 0] + 0.7152 * arr[:, :, 1] + 0.0722 * arr[:, :, 2]
    hot = np.clip((lum - 0.70) / 0.30, 0.0, 1.0) ** 1.35
    if float(hot.max()) < 0.01:
        return imagen

    hot_img = Image.fromarray((hot * 255.0).astype(np.uint8), mode="L")
    dw, dh = max(1, w // 4), max(1, h // 4)
    hot_peq = hot_img.resize((dw, dh), Image.Resampling.BILINEAR)
    radio = max(2.0, min(26.0, min(dw, dh) * 0.032))
    halo_peq = hot_peq.filter(ImageFilter.GaussianBlur(radius=radio))
    halo_img = halo_peq.resize((w, h), Image.Resampling.BILINEAR)

    hot_img.close()
    hot_peq.close()
    halo_peq.close()

    halo = (np.asarray(halo_img, dtype=np.float32) / 255.0) * (intensidad / 100.0) * 0.92
    halo_img.close()

    # Tinte cálido bermellón / ámbar de emulsión sin capa anti-halación
    halo_rgb = np.empty_like(arr)
    halo_rgb[:, :, 0] = np.clip(halo * 1.15, 0.0, 1.0)
    halo_rgb[:, :, 1] = np.clip(halo * 0.26, 0.0, 1.0)
    halo_rgb[:, :, 2] = np.clip(halo * 0.05, 0.0, 1.0)

    # Mezcla tipo Screen para iluminar sin quemar en exceso
    res = 1.0 - (1.0 - arr) * (1.0 - halo_rgb)
    np.clip(res, 0.0, 1.0, out=res)
    return Image.fromarray((res * 255.0).astype(np.uint8), mode="RGB")


def aplicar_aberracion_cromatica(imagen: Image.Image, intensidad: float) -> Image.Image:
    """
    Aplica dispersión cromática óptica radial escalando suavemente los canales R y G
    desde el centro hacia los bordes respecto al canal B.
    """
    intensidad = _limitar(intensidad, 0.0, 100.0)
    if intensidad <= 0.0:
        return imagen

    img_rgb = imagen.convert("RGB")
    w, h = img_rgb.size
    if w < 4 or h < 4:
        return img_rgb

    k = (intensidad / 100.0) * 0.018
    cx, cy = (w - 1) * 0.5, (h - 1) * 0.5

    r, g, b = img_rgb.split()

    def escalar_canal(canal: Image.Image, zoom: float) -> Image.Image:
        inv = 1.0 / zoom
        ox = cx * (1.0 - inv)
        oy = cy * (1.0 - inv)
        return canal.transform(
            (w, h),
            Image.Transform.AFFINE,
            (inv, 0.0, ox, 0.0, inv, oy),
            resample=Image.Resampling.BILINEAR,
        )

    r_mod = escalar_canal(r, 1.0 + k)
    g_mod = escalar_canal(g, 1.0 + k * 0.45)

    try:
        return Image.merge("RGB", (r_mod, g_mod, b))
    finally:
        r_mod.close()
        g_mod.close()


def aplicar_scanlines(imagen: Image.Image, intensidad: float) -> Image.Image:
    """
    Aplica líneas de barrido horizontales estilo monitor CRT clásico,
    adaptando el grosor de línea a la resolución real de la imagen.
    """
    intensidad = _limitar(intensidad, 0.0, 100.0)
    if intensidad <= 0.0:
        return imagen

    img_rgb = imagen.convert("RGB")
    w, h = img_rgb.size
    if h < 4:
        return img_rgb

    arr = np.asarray(img_rgb, dtype=np.float32)
    paso = max(2, int(round(h / 240.0)))
    grosor = max(1, paso // 2)

    factor_osc = 1.0 - (intensidad / 100.0) * 0.58
    factor_luz = 1.0 + (intensidad / 100.0) * 0.09

    filas = np.arange(h) % paso
    mascara_oscura = filas < grosor

    mod = np.where(mascara_oscura, factor_osc, factor_luz).astype(np.float32)[:, None, None]
    res = np.clip(arr * mod, 0.0, 255.0).astype(np.uint8)
    return Image.fromarray(res, mode="RGB")


def procesar_optica_lente(
    imagen: Image.Image,
    halacion: float = 0.0,
    aberracion: float = 0.0,
) -> Image.Image:
    """Ejecuta los efectos ópticos analógicos (halación y aberración cromática)."""
    resultado = imagen
    if float(halacion) > 0.0:
        siguiente = aplicar_halacion(resultado, halacion)
        if resultado is not imagen and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    if float(aberracion) > 0.0:
        siguiente = aplicar_aberracion_cromatica(resultado, aberracion)
        if resultado is not imagen and resultado is not siguiente:
            resultado.close()
        resultado = siguiente

    return resultado

