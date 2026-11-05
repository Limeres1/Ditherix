# Ditherix

> **Estación de trabajo fotográfica, cuarto oscuro digital y laboratorio de tramado retro.**  
> Procesamiento de imagen en memoria 100% no destructivo con aceleración vectorial en NumPy, Pillow y Flask, bajo una interfaz táctil Cyber Y2K / Hallmark Darkroom.

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Características Principales](#características-principales)
   - [Pipeline No Destructivo en Memoria](#1-pipeline-no-destructivo-en-memoria)
   - [Motor de Dithering Retro](#2-motor-de-dithering-retro)
   - [Laboratorio de Blanco y Negro & Virados Químicos](#3-laboratorio-de-blanco-y-negro--virados-químicos)
   - [Mezclador HSL & Balance de Color](#4-mezclador-hsl--balance-de-color)
   - [Marcos Decorativos & Analógicos](#5-marcos-decorativos--analógicos)
   - [Presets de Autor](#6-presets-de-autor)
   - [Detalle & Grano Estocástico](#7-detalle--grano-estocástico)
   - [Herramientas Espaciales & Visor](#8-herramientas-espaciales--visor)
3. [Arquitectura y Workflow](#arquitectura-y-workflow)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Instalación y Puesta en Marcha](#instalación-y-puesta-en-marcha)
6. [Referencia de la API REST](#referencia-de-la-api-rest)
7. [Catálogo de Presets de Autor](#catálogo-de-presets-de-autor)
8. [Estética & Filosofía de Diseño (Hallmark)](#estética--filosofía-de-diseño-hallmark)
9. [Atajos y Navegación](#atajos-y-navegación)
10. [Licencia](#licencia)

---

## Visión General

**Ditherix** transforma fotografías digitales en obras de arte analógicas, cinematográficas y retro-digitales de 8 bits. A diferencia de editores convencionales basados en canvas destructivo, Ditherix procesa cada transformación directamente en el backend mediante operaciones vectorizadas en **NumPy** y algoritmos optimizados en **Pillow**, manteniendo los datos originales intactos en memoria.

La interfaz de usuario implementa un diseño inspirado en el estándar **Hallmark Darkroom**:
- Vidrio ahumado negro profundo y semitraslúcido (`rgba(7, 7, 9, 0.78)` con `backdrop-filter: blur(20px)`).
- Ángulos rectos de 90° (`border-radius: 0`) para una sensación técnica, sobria y de alta precisión.
- Cero emojis y cero texto genérico (*AI slop*).
- Cumplimiento estricto de transiciones explícitas (prohibido `transition: all`).

---

## Características Principales

### 1. Pipeline No Destructivo en Memoria
- El archivo subido original permanece inmutable como un arreglo de bytes en memoria (`ImagenGuardada`).
- Todas las capas de ajuste (curvas, HSL, virado, dither, marcos) se apilan y ejecutan dinámicamente en orden matemático óptimo.
- Vista previa responsiva generada en tiempo real (máx. 1600px) para mantener 60 FPS, mientras que la exportación final procesa la imagen en su resolución completa sin pérdida.
- Capacidad de revertir recortes o reiniciar cualquier filtro individual sin alterar el resto de los ajustes.

### 2. Motor de Dithering Retro
- **Algoritmos de difusión de error**:
  - `floyd_steinberg` (Difusión clásica equilibrada de 4 coeficientes).
  - `atkinson` (Difusión con 75% de dispersión, estética Apple Macintosh de 1984).
  - `burkes` y `sierra` (Difusión de rango amplio).
- **Tramados ordenados por matriz**:
  - `bayer_2` (Matriz 2×2), `bayer_4` (Matriz 4×4), `bayer_8` (Matriz 8×8).
- **Paletas cromáticas históricas indexadas**:
  - `bn` (1-bit monocromo puro).
  - `gameboy` (4 niveles verde fósforo LCD Nintendo 1989).
  - `cga` (IBM CGA Modo 1: negro, cian, magenta, blanco).
  - `cyberpunk` (Neón de alto contraste).
  - `sepia` y `solar` (Estilos fotográficos monocromáticos).
- **Control de tamaño de celda de píxel** (1× a 16×) y **mezcla de intensidad** (0% a 100%).

### 3. Laboratorio de Blanco y Negro & Virados Químicos
- Conversión monocroma con ponderación espectral calibrada (Rec. 709).
- **Filtros ópticos físicos (Wratten)**:
  - Rojo (oscurece cielos y resalta arquitectura).
  - Naranja y Amarillo (contraste suave y retratos).
  - Verde (resalta follaje y separa tonos de piel).
  - Azul (simula emulsiones ortocromáticas tempranas).
- **Mezclador de canales luminosos**: Control granular sobre los 8 espectros cromáticos de la imagen.
- **Virados químicos tradicionales de laboratorio**:
  - *Sepia* (Sulfuro de plata cálido).
  - *Cianotipia 1842* (Azul de Prusia a base de sales férricas).
  - *Selenio* (Tonos berenjena y negros profundos de galería).
  - *Platino* (Rango tonal extendido y luces neutras).
  - Control de intensidad de virado porcentual (0% a 100%).

### 4. Mezclador HSL & Balance de Color
- **Balance de temperatura y tinte**:
  - Temperatura de color Kelvin (frío - azul / cálido - ámbar).
  - Tinte verde / magenta para corrección de fuentes de iluminación complejas.
- **Mezclador espectral de 8 canales (estilo Adobe Lightroom)**:
  - Canales: Rojo, Naranja, Amarillo, Verde, Cian, Azul, Púrpura, Magenta.
  - Ajuste independiente de **Tono** (-100 a +100), **Saturación** (-100 a +100) y **Luminancia** (-100 a +100).
  - Selector táctil con chips cuadrados de filtro fotográfico.

### 5. Marcos Decorativos & Analógicos
- **Marco Liso**: Color personalizable mediante paleta rápida o selector hex y grosor regulable en píxeles.
- **Polaroid Clásico**: Borde instantáneo asimétrico blanco con área inferior amplia para notas.
- **Polaroid Gastado (`polaroid_gastado`)**: Emulsión degradada con viñeteo analógico y bordes añejos.
- **Tira de Película de 35mm (`pelicula`)**: Encuadre de celuloide negro con perforaciones de arrastre en ambos laterales.
- Los marcos se aplican al final del pipeline para garantizar que los bordes y perforaciones se mantengan nítidos e inalterados por filtros posteriores.

### 6. Presets de Autor
Diez recetas artesanales completas que aprovechan simultáneamente marcos, química, dither y curvas tonales, con ajuste de intensidad porcentual en tiempo real y reinicio rápido.

### 7. Detalle & Grano Estocástico
- **Desenfoque gaussiano**: Control suave para efectos atmosféricos o resplandor Orton.
- **Máscara de enfoque (Unsharp Mask)**: Realce de microcontrastes y nitidez de bordes sin artefactos de halo.
- **Grano analógico**: Ruido gaussiano estocástico que simula la estructura de cristales de haluro de plata de películas ISO 400 a 3200.

### 8. Herramientas Espaciales & Visor
- Visor con arrastre táctil fluido (*pan & drag*) y zoom infinito centrado en el cursor mediante rueda del ratón.
- Recorte interactivo no destructivo con superposición visual y preservación de píxeles originales.
- Volteo simétrico horizontal y vertical sin pérdida de calidad.

---

## Arquitectura y Workflow

```mermaid
flowchart TD
    subgraph Entrada
        A["Cliente Web / Navegador"] -->|"POST /upload (FormData)"| B["app.py: subir_imagen()"]
        B --> C["manejo_imagen.py: abrir_imagen()"]
        C --> D["Sanitización EXIF + Instancia ImagenGuardada"]
    end

    subgraph Pipeline No Destructivo (ejecutar_pipeline)
        D --> E["1. Imagen Base (Original / Recortada)"]
        E --> F["2. Curvas Tonales (Brillo, Contraste, Saturación)"]
        F --> G["3. Preset de Autor (Curvas avanzadas + HSL)"]
        G --> H["4. Balance de Blancos y Mezclador HSL (8 canales)"]
        H --> I["5. Monocromo ByN & Virados Químicos"]
        I --> J["6. Filtros de Detalle (Desenfoque, Nitidez, Grano)"]
        J --> K["7. Algoritmo de Dithering Retro & Paleta"]
        K --> L["8. Aplicación de Marco Decorativo Final"]
    end

    subgraph Salida
        L --> M["guardar_procesada_sin_perdida (PNG Master)"]
        L --> N["generar_vista (JPEG 1600px Max)"]
        N --> O["Respuesta JSON con URL y token cache-buster"]
        O --> A
    end
```

---

## Estructura del Proyecto

```text
b:\Ditherix\
├── app.py                  # Servidor Flask, gestión de estado en memoria y orquestador del pipeline
├── presets.py              # Definiciones de los 10 presets de autor y motor de curvas vectorizadas
├── color_mixer.py          # Balance de temperatura/tinte y mezclador espectral HSL de 8 canales
├── byn.py                  # Monocromo Rec. 709, filtros Wratten y virados químicos (Sepia, Cianotipia, etc.)
├── dithering.py            # Motor de difusión de error (Floyd-Steinberg, Atkinson) y matrices Bayer
├── detalle.py              # Filtros de desenfoque, máscara de enfoque y grano analógico estocástico
├── marcos.py               # Generador procedural de marcos (Liso, Polaroid, Gastado, Tira de 35mm)
├── recortar.py             # Recorte interactivo con coordenadas relativas y conservación de master
├── voltear_imagen.py       # Transformaciones de espejo horizontal y vertical
├── manejo_imagen.py        # Decodificación segura, corrección de rotación EXIF y compresión de vistas
├── requirements.txt        # Dependencias esenciales del entorno Python
├── DOCUMENTACION_TECNICA.md# Especificación técnica exhaustiva y matemáticas de algoritmos
├── templates/
│   ├── index.html          # Interfaz principal de la estación de trabajo y menús Hallmark
│   └── landing.html        # Página de bienvenida minimalista
└── static/
    ├── script.js           # Orquestación de peticiones, debounce, estado de UI y llamadas fetch
    ├── visor.js            # Motor del visor: transformaciones de matriz CSS, zoom y paneo
    ├── style.css           # Estilos Hallmark Darkroom: negro traslúcido, border-radius: 0
    ├── landing.css         # Estilos específicos de la página de aterrizaje
    └── images/             # Muestrarios y capturas de las herramientas
```

---

## Instalación y Puesta en Marcha

### Prerrequisitos
- **Python 3.10 o superior**
- **pip** o gestor de paquetes de Python

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/ditherix.git
cd ditherix
```

### 2. Crear y activar un entorno virtual
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Ejecutar el servidor de desarrollo
```bash
python app.py
```
El servidor se iniciará en `http://127.0.0.1:5000/`.

- **Portal de inicio**: `http://127.0.0.1:5000/`
- **Editor Ditherix**: `http://127.0.0.1:5000/editor` (o `/app`)

---

## Referencia de la API REST

Todos los endpoints que modifican el estado de la imagen consumen y responden en formato JSON (`application/json`).

| Método | Endpoint | Parámetros Principales | Descripción |
|---|---|---|---|
| `POST` | `/upload` | `FormData(imagen=File)` | Carga una imagen (JPG, PNG, WEBP), sanitiza orientación y crea la sesión. |
| `GET` | `/imagen/<id>/vista` | Query param `?v=<uuid>` | Devuelve los bytes JPEG optimizados de la vista previa para el canvas. |
| `GET` | `/imagen/<id>/completa` | Query param `?descargar=1` | Descarga el archivo maestro en resolución completa sin compresión destructiva. |
| `POST` | `/imagen/<id>/ajustes` | `{ brillo, contraste, saturacion }` | Aplica curvas tonales básicas (-100 a +100). |
| `POST` | `/imagen/<id>/color` | `{ temperatura, tinte, mezcla_color }` | Aplica balance Kelvin y mezcla de los 8 canales HSL. |
| `POST` | `/imagen/<id>/byn` | `{ activo, canales, virado, virado_intensidad }` | Controla monocromo, pesos de canal y virados químicos. |
| `POST` | `/imagen/<id>/detalle` | `{ desenfoque, nitidez, grano }` | Aplica filtros espaciales de textura y enfoque. |
| `POST` | `/imagen/<id>/dither` | `{ algoritmo, paleta, pixel, intensidad }` | Ejecuta el algoritmo de dithering retro especificado. |
| `POST` | `/imagen/<id>/marco` | `{ estilo, color, grosor }` | Aplica un marco decorativo al encuadre exterior. |
| `POST` | `/imagen/<id>/preset` | `{ preset, intensidad }` | Aplica un preset de autor con mezcla porcentual. |
| `POST` | `/imagen/<id>/recortar` | `{ x, y, ancho, alto }` | Recorta la imagen base preservando coordenadas del master. |
| `POST` | `/imagen/<id>/voltear` | `{ direccion: "horizontal"|"vertical" }` | Aplica un efecto espejo a la imagen. |
| `POST` | `/imagen/<id>/reset` | `{ tipo: "todos"|"ajustes"|"dither"|... }` | Restablece los parámetros seleccionados a su valor neutro. |
| `GET` | `/presets` | *(Ninguno)* | Lista los 10 presets disponibles con metadatos y categorías. |

---

## Catálogo de Presets de Autor

| ID | Nombre | Categoría | Herramientas Clave |
|---|---|---|---|
| `01` | **Polaroid 600** | INSTANT | Marco Polaroid desgastado, Calidez analógica (+28), Grano de película (35). |
| `02` | **Portra 35mm** | 35MM | Tira de celuloide con perforaciones, Calidez ámbar (+22), Grano 45, Nitidez +25. |
| `03` | **Cianotipia 1842** | QUÍMICA | Monocromo con virado Azul de Prusia (92%), Filtro Wratten azul, Marco paspartú. |
| `04` | **Plata & Selenio** | FINE ART | B&N baritado de galería, Virado al Selenio (82%), Filtro rojo de contraste, Paspartú blanco. |
| `05` | **Game Boy 1989** | 8-BIT | Matriz ordenada Bayer 4×4, Paleta verde LCD de 4 tonos, Píxel x2 al 95%. |
| `06` | **CGA Cyberpunk** | CYBER | Difusión Floyd-Steinberg, Paleta IBM CGA Modo 1 (negro/cian/magenta/blanco), Contraste +32. |
| `07` | **Teal & Orange** | CINE | Color grading de cine contemporáneo, Medios tonos ámbar/naranja, Sombras cian, Fade negros +22. |
| `08` | **Fallen Angels** | NOIR 90S | Tinte neón Wong Kar-wai (-22), Alto contraste (+34), Marco de película de 35mm, Grano 48. |
| `09` | **Y2K Flash** | Y2K | Iluminación de flash frontal directo (+35), Enfoque acentuado (+45), Borde fino negro. |
| `10` | **Orton Bloom** | FANTASÍA | Resplandor etéreo difuso (desenfoque gaussiano + máscara de enfoque), Calidez +16, Marco Polaroid. |

---

## Estética & Filosofía de Diseño (Hallmark)

El desarrollo visual de Ditherix sigue estrictas pautas de diseño:

- **Ángulos rectos**: Cero radios de curvatura (`border-radius: 0`). Paneles, botones, fichas e interruptores emplean geometría ortogonal estricta.
- **Negro traslúcido**: Las superficies flotantes utilizan `rgba(7, 7, 9, 0.78)` combinado con `backdrop-filter: blur(20px)` y bordes de filamento de 1px a baja opacidad para un acabado de alta gama.
- **Tipografía clara**: Uso de títulos en caja alta con tracking espaciado (`letter-spacing: 0.08em`), salidas numéricas en fuentes monoespaciadas y etiquetas concisas.
- **Sin elementos distractores**: Ausencia total de emojis en menús técnicos o descripciones artificiales genéricas.
- **Transiciones explícitas**: Prohibido el uso de `transition: all`. Cada elemento interactivo especifica con exactitud las propiedades animadas (`background`, `border-color`, `transform`, `opacity`) para un rendimiento impecable sin repaints innecesarios.

---

## Atajos y Navegación

| Acción | Control / Atajo |
|---|---|
| **Cargar Imagen** | Clic en el botón central de carga, arrastrar archivo a la zona de drop o usar el botón en la barra superior. |
| **Mover Imagen (Pan)** | Clic izquierdo sostenido y arrastre sobre el visor. |
| **Zoom Dinámico** | Rueda del ratón hacia arriba (acercar) o hacia abajo (alejar) centrado en el puntero. |
| **Restablecer Visor** | Doble clic sobre el visor para centrar la imagen y restablecer la escala 1:1. |
| **Alternar Menús** | Botones de la barra inferior (Presets, Edición, Detalle, Dithering, Color, Blanco y Negro, Marcos). |
| **Recorte Rápido** | Botón de tijeras en la barra superior; dibujar rectángulo y presionar "Aplicar". |
| **Volteo Espejo** | Botones de volteo horizontal y vertical en la barra superior derecha. |

---

## Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.
Desarrollado con pasión por la fotografía química, el arte retro-digital y el diseño de interfaces moderno.

