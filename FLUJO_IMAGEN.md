# Cómo viaja y se modifica una imagen en Ditherix

Este documento explica el flujo que está implementado hoy. Los bloques de código son fragmentos copiados de los archivos fuente; las explicaciones de cada bloque describen qué sucede con la imagen.

## Mapa rápido

```text
HTML: el usuario selecciona un archivo
  → JavaScript lo manda como multipart/form-data a POST /upload
  → Flask/Pillow valida, decodifica y guarda los datos en memoria
  → JavaScript recibe un ID y una URL
  → el navegador pide GET /imagen/<id>
  → Flask responde los bytes JPEG de la vista previa
  → el navegador pone esa URL en <img id="preview">

Al aplicar un ajuste:
  → JavaScript manda el ID y los valores de los tres sliders como JSON
  → Flask vuelve a abrir los bytes originales y aplica los tres valores
  → Flask reemplaza la versión procesada y la vista previa en memoria
  → JavaScript recibe una URL nueva y el navegador carga la vista previa
```

La imagen no se pasa entre módulos como un archivo temporal en el disco. Flask conserva sus bytes en memoria; las funciones Python reciben objetos de imagen Pillow o bytes y devuelven objetos de imagen o bytes.

## 1. La página contiene el selector, los sliders y la imagen de vista previa

Fragmento de [`templates/index.html`](./templates/index.html):

```html
<input
    class="oculto"
    type="file"
    id="imageInput"
    accept="image/jpeg,image/png,image/webp"
>
```

Los tres controles HTML (`brilloInput`, `contrasteInput` y `saturacionInput`) aceptan valores de `-100` a `100`. La imagen se muestra en este elemento:

```html
<img id="preview" class="preview oculto" alt="Vista previa de la imagen procesada" draggable="false">
```

La página carga dos scripts:

```html
<script src="{{ url_for('static', filename='script.js') }}"></script>
<script src="{{ url_for('static', filename='visor.js') }}"></script>
```

`script.js` se ocupa de subir la imagen, pedir ajustes y actualizar la vista previa. `visor.js` se ocupa del zoom, el arrastre y el menú; no altera los píxeles.

## 2. JavaScript envía el archivo seleccionado

Fragmento de [`static/script.js`](./static/script.js):

```javascript
imageInput.addEventListener("change", async () => {
    const archivo = imageInput.files[0];
    if (!archivo) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    imagenActual = null;
    brilloInput.disabled = true;
    botonBrillo.disabled = true;
    contrasteInput.disabled = true;
    botonContraste.disabled = true;
    saturacionInput.disabled = true;
    botonSaturacion.disabled = true;

    if (controladorCarga) {
        controladorCarga.abort();
    }
    if (cancelarVistaPendiente) {
        cancelarVistaPendiente();
    }

    controladorCarga = new AbortController();
    const controladorActual = controladorCarga;
    const formulario = new FormData();
    formulario.append("imagen", archivo);
    imageInput.value = "";

    mostrarMensaje("");
    indicadorCarga.textContent = "Procesando imagen…";
    preview.classList.add("oculto");
    preview.removeAttribute("src");
    indicadorCarga.classList.remove("oculto");

    try {
        const respuesta = await fetch("/upload", {
            method: "POST",
            body: formulario,
            signal: controladorActual.signal,
        });
        const resultado = await respuesta.json();
```

`FormData` crea una solicitud multipart con el nombre de campo `imagen`; ese nombre debe coincidir con `request.files.get("imagen")` en Flask. El navegador envía el archivo, no una ruta local del disco. `AbortController` permite cancelar una subida anterior si el usuario selecciona otra imagen.

## 3. Flask recibe los bytes y crea las representaciones iniciales

Fragmento de [`app.py`](./app.py):

```python
@app.post("/upload")
def subir_imagen():
    archivo = request.files.get("imagen")
    if archivo is None:
        return respuesta_error("SIN_ARCHIVO", "Selecciona una imagen para subir.", 400)

    try:
        datos_originales = archivo.stream.read(MAX_ARCHIVO_BYTES + 1)
        if not datos_originales:
            return respuesta_error("SIN_ARCHIVO", "Selecciona una imagen para subir.", 400)
        if len(datos_originales) > MAX_ARCHIVO_BYTES:
            return respuesta_error(
                "ARCHIVO_MUY_GRANDE",
                "La imagen supera el tamaño máximo de 25 MB.",
                413,
            )

        imagen = abrir_imagen(datos_originales)
        try:
            ancho, alto = imagen.size
            procesada = guardar_procesada_sin_perdida(imagen)
            vista, ancho_vista, alto_vista = generar_vista(imagen)
        finally:
            imagen.close()

        imagen_id = uuid.uuid4().hex
        imagen_guardada = ImagenGuardada(
            original=datos_originales,
            procesada=procesada,
            vista=vista,
            ancho=ancho,
            alto=alto,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
        )

        with imagenes_lock:
            imagenes_guardadas[imagen_id] = imagen_guardada
            while len(imagenes_guardadas) > MAX_IMAGENES_EN_MEMORIA:
                imagenes_guardadas.popitem(last=False)

        return jsonify(
            ok=True,
            id=imagen_id,
            url=url_for("ver_imagen", imagen_id=imagen_id),
            ancho=ancho,
            alto=alto,
            ancho_vista=ancho_vista,
            alto_vista=alto_vista,
        )
```

`abrir_imagen` de [`manejo_imagen.py`](./manejo_imagen.py) comprueba que el archivo sea una imagen JPEG, PNG o WebP válida y que sus lados no superen 6000 píxeles. Luego la decodifica con Pillow, aplica la orientación EXIF y la convierte a RGB. Si el original tiene transparencia, `_a_rgb` la compone sobre un fondo blanco.

En la subida inicial se guardan tres cosas en `ImagenGuardada`:

- `original`: los bytes tal como llegaron desde el navegador. Se vuelven a usar como base al aplicar ajustes.
- `procesada`: la imagen normalizada guardada como PNG.
- `vista`: la imagen guardada como JPEG para mostrarla en el navegador.

El ID aleatorio relaciona esos datos. La estructura se mantiene en `imagenes_guardadas`, un diccionario en memoria que retiene como máximo cinco imágenes. No es almacenamiento permanente: se pierde cuando se reinicia el proceso y una imagen puede dejar de estar disponible cuando se supera ese límite.

## 4. JavaScript recibe el ID y solicita la vista previa

Después de interpretar la respuesta JSON de `/upload`, el código comprueba que la solicitud siga siendo la actual y que haya terminado bien. El fragmento que conecta el ID con la vista es:

```javascript
imagenActual = resultado.id;
const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
if (numeroSolicitud !== solicitudActual) {
    return;
}
if (!vistaCargada) {
    mostrarMensaje("No se pudo mostrar la imagen procesada. Inténtalo de nuevo.");
    return;
}

preview.classList.remove("oculto");
```

La función que recibe esa URL espera a que la imagen termine de cargar:

```javascript
function esperarVista(url, numeroSolicitud) {
    return new Promise((resolve) => {
        function finalizar(cargada) {
            preview.removeEventListener("load", alCargar);
            preview.removeEventListener("error", alFallar);
            if (cancelarVistaPendiente === cancelar) {
                cancelarVistaPendiente = null;
            }
            resolve(cargada && numeroSolicitud === solicitudActual);
        }

        function alCargar() {
            finalizar(true);
        }

        function alFallar() {
            finalizar(false);
        }

        function cancelar() {
            finalizar(false);
        }

        cancelarVistaPendiente = cancelar;
        preview.addEventListener("load", alCargar, { once: true });
        preview.addEventListener("error", alFallar, { once: true });
        preview.src = url;
    });
}
```

Asignar `preview.src` hace que el navegador envíe otra solicitud HTTP, esta vez un `GET` a la URL devuelta. El JSON de `/upload` contiene el ID y la URL, no los bytes de la imagen.

## 5. Flask devuelve los bytes JPEG de la vista previa

Fragmento de [`app.py`](./app.py):

```python
@app.get("/imagen/<imagen_id>")
def ver_imagen(imagen_id: str):
    with imagenes_lock:
        imagen = imagenes_guardadas.get(imagen_id)

    if imagen is None:
        return respuesta_error(
            "IMAGEN_NO_ENCONTRADA",
            "La imagen ya no está disponible. Vuelve a cargarla.",
            404,
        )

    respuesta = app.response_class(imagen.vista, mimetype="image/jpeg")
    respuesta.headers["Cache-Control"] = "no-store"
    return respuesta
```

Esta ruta busca el ID en memoria y devuelve `imagen.vista` con tipo MIME `image/jpeg`. Aunque también existe `imagen.procesada`, esta ruta no la devuelve: el `<img>` muestra la vista previa JPEG.

Las funciones de codificación están en [`manejo_imagen.py`](./manejo_imagen.py):

```python
def generar_vista(imagen: Image.Image) -> tuple[bytes, int, int]:
    ancho_vista, alto_vista = imagen.size
    salida = io.BytesIO()
    imagen.save(salida, format="JPEG", quality=90)
    return salida.getvalue(), ancho_vista, alto_vista


def guardar_procesada_sin_perdida(imagen: Image.Image) -> bytes:
    salida = io.BytesIO()
    imagen.save(salida, format="PNG")
    return salida.getvalue()
```

`BytesIO` escribe los formatos en memoria, no en un archivo físico.

## 6. Al aplicar un ajuste, JavaScript manda los valores de los tres sliders

Fragmento de [`static/script.js`](./static/script.js):

```javascript
const respuesta = await fetch(`/imagen/${imagenId}/ajustes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        brillo: Number(brilloInput.value),
        contraste: Number(contrasteInput.value),
        saturacion: Number(saturacionInput.value),
    }),
});
const resultado = await respuesta.json();
```

Aunque se pulse un botón de ajuste específico, el cuerpo JSON incluye los valores actuales de los tres controles. El ID viaja en la URL de la solicitud, no dentro de ese JSON.

## 7. Flask convierte los valores y vuelve a procesar desde el original

Fragmento de [`app.py`](./app.py):

```python
@app.post("/imagen/<imagen_id>/ajustes")
def aplicar_ajustes(imagen_id: str):
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return respuesta_error("DATOS_INVALIDOS", "Los datos del efecto no son válidos.", 400)

    factores = {}
    for nombre, (etiqueta, _) in AJUSTES_DISPONIBLES.items():
        valor_slider = datos.get(nombre)
        if (
            isinstance(valor_slider, bool)
            or not isinstance(valor_slider, (int, float))
            or not -100 <= valor_slider <= 100
            or not math.isfinite(valor_slider)
        ):
            return respuesta_error(
                "FACTOR_INVALIDO",
                f"El ajuste de {etiqueta} debe estar entre -100 y 100.",
                400,
            )
        factores[nombre] = slider_a_factor(float(valor_slider))
```

Después de validar, la ruta recupera la imagen guardada y ejecuta este fragmento:

```python
imagen = abrir_imagen(imagen_guardada.original)
resultado = procesar_ajustes(imagen, factores)

procesada = guardar_procesada_sin_perdida(resultado)
vista, ancho_vista, alto_vista = generar_vista(resultado)

imagen_actualizada = replace(
    imagen_guardada,
    procesada=procesada,
    vista=vista,
    ancho_vista=ancho_vista,
    alto_vista=alto_vista,
)
with imagenes_lock:
    if imagenes_guardadas.get(imagen_id) is not imagen_guardada:
        return respuesta_error(
            "IMAGEN_MODIFICADA",
            "La imagen cambió durante el procesamiento. Inténtalo de nuevo.",
            409,
        )
    imagenes_guardadas[imagen_id] = imagen_actualizada
```

La línea importante es `abrir_imagen(imagen_guardada.original)`: cada operación parte de los bytes originales, no de la vista previa ni del último PNG procesado. Se sustituyen `procesada` y `vista` del registro en memoria, mientras que `original` queda igual.

## 8. Cómo `ajustes_imagen.py` modifica los píxeles

El archivo [`ajustes_imagen.py`](./ajustes_imagen.py) convierte el valor del slider a un factor:

```python
def limitar(valor: float, minimo: float, maximo: float) -> float:
    return max(minimo, min(maximo, valor))

def slider_a_factor(valor: float) -> float:
    return 1 + limitar(valor, -100, 100) / 100
```

La relación queda así:

| Slider | Factor enviado a Pillow | Resultado esperado |
| ---: | ---: | --- |
| `-100` | `0` | brillo/contraste/saturación mínimos |
| `0` | `1` | sin cambio para ese ajuste |
| `+100` | `2` | factor 2 para ese ajuste |

Las funciones delegan cada operación a Pillow:

```python
def aplicar_brillo(imagen: Image.Image, factor: float) -> Image.Image:
    return ImageEnhance.Brightness(imagen).enhance(factor)

def aplicar_contraste(imagen: Image.Image, factor: float) -> Image.Image:
    return ImageEnhance.Contrast(imagen).enhance(factor)

def aplicar_saturacion(imagen: Image.Image, factor: float) -> Image.Image:
    return ImageEnhance.Color(imagen).enhance(factor)
```

El registro y el bucle determinan qué operaciones se ejecutan y en qué orden:

```python
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
```

En Python, `resultado` se vuelve la entrada del siguiente ajuste: primero brillo, luego contraste y luego saturación. Si un factor es `1`, ese ajuste no cambia la imagen; los demás valores igualmente se procesan.

## 9. La respuesta de ajustes cambia la URL mostrada

Tras reemplazar los datos de la imagen, Flask responde con el ID y una URL para cargar la vista nueva. La URL lleva además un parámetro aleatorio `v`, y el navegador espera a que la imagen cargue:

```javascript
const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
if (numeroSolicitud !== solicitudActual) {
    return;
}
if (!vistaCargada) {
    mostrarMensaje("No se pudo mostrar la imagen con los ajustes aplicados.");
    return;
}

mostrarMensaje("");
preview.classList.remove("oculto");
```

El ciclo termina igual que al subir: el navegador pide la URL de la imagen y la pone en `preview.src`. La diferencia es que el servidor ha reemplazado en memoria los bytes de `vista` para ese mismo ID.

## Recorte

El botón «Recortar» activa una capa sobre la vista previa. Arrastrás el puntero para seleccionar el área; el navegador convierte esa selección a píxeles de la imagen original teniendo en cuenta el ajuste visual `object-fit: cover` y el zoom/desplazamiento del visor. «Aplicar recorte» manda esas coordenadas al endpoint `POST /imagen/<id>/recortar`.

Flask valida que el rectángulo esté dentro de la imagen y recorta tanto la base original como la versión procesada actual. Así, la vista mantiene los ajustes existentes y los cambios posteriores siguen aplicándose sobre la imagen recortada. El servidor actualiza la vista previa en memoria y el navegador carga la URL que devuelve. «Cancelar» sale del modo de selección sin cambiar la imagen.

## Otras funciones

- [`static/visor.js`](./static/visor.js) solo transforma visualmente el escenario con CSS (`translate` y `scale`) para permitir mover y ampliar la imagen; no envía ajustes al servidor.
- El botón « » está deshabilitado en el HTML; en el código revisado no hay un endpoint de exportación conectado a este flujo.

## Archivos principales

- [`templates/index.html`](./templates/index.html): controles y elemento de vista previa.
- [`static/script.js`](./static/script.js): solicitudes HTTP y actualización del navegador.
- [`app.py`](./app.py): endpoints Flask y almacenamiento temporal en memoria.
- [`manejo_imagen.py`](./manejo_imagen.py): validación, decodificación y codificación de imágenes.
- [`ajustes_imagen.py`](./ajustes_imagen.py): conversión de valores y operaciones Pillow.
- [`recortar.py`](./recortar.py): validación básica y recorte del rectángulo en Pillow.
- [`static/visor.js`](./static/visor.js): zoom, desplazamiento y menú de edición.
