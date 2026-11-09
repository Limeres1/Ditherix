"use strict";

const botonExportar = document.getElementById("botonExportar");
const botonCargar = document.getElementById("botonCargar");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const dropZone = document.getElementById("dropZone");
const mensaje = document.getElementById("mensaje");
const indicadorCarga = document.getElementById("cargando");
const brilloInput = document.getElementById("brilloInput");
const brilloValor = document.getElementById("brilloValor");
const contrasteInput = document.getElementById("contrasteInput");
const contrasteValor = document.getElementById("contrasteValor");
const saturacionInput = document.getElementById("saturacionInput");
const saturacionValor = document.getElementById("saturacionValor");
const botonAplicarAjustes = document.getElementById("botonAplicarAjustes");
const botonResetAjustes = document.getElementById("botonResetAjustes");
const desenfoqueInput = document.getElementById("desenfoqueInput");
const desenfoqueValor = document.getElementById("desenfoqueValor");
const nitidezInput = document.getElementById("nitidezInput");
const nitidezValor = document.getElementById("nitidezValor");
const granoInput = document.getElementById("granoInput");
const granoValor = document.getElementById("granoValor");
const botonAplicarDetalle = document.getElementById("botonAplicarDetalle");
const botonResetDetalle = document.getElementById("botonResetDetalle");
const ditherAlgoritmo = document.getElementById("ditherAlgoritmo");
const ditherPaleta = document.getElementById("ditherPaleta");
const ditherIntensidadInput = document.getElementById("ditherIntensidadInput");
const ditherIntensidadValor = document.getElementById("ditherIntensidadValor");
const ditherPixelInput = document.getElementById("ditherPixelInput");
const ditherPixelValor = document.getElementById("ditherPixelValor");
const botonAplicarDither = document.getElementById("botonAplicarDither");
const botonResetDither = document.getElementById("botonResetDither");
const btnIniciarRecorte = document.getElementById("btn-iniciar-recorte");
const cropMenu = document.getElementById("crop-menu");
const btnConfirmarRecorte = document.getElementById("btn-confirmar-recorte");
const btnCancelarRecorte = document.getElementById("btn-cancelar-recorte");
const btnRestablecerRecorte = document.getElementById("btn-restablecer-recorte");
const cropOverlay = document.getElementById("cropOverlay");
const cropSelection = document.getElementById("cropSelection");
const contenedorVisor = document.getElementById("visor");
const escenarioImagen = document.getElementById("escenario");
const botonVoltearHorizontal = document.getElementById("botonVoltearHorizontal");
const botonVoltearVertical = document.getElementById("botonVoltearVertical");
const botonComparar = document.getElementById("botonComparar");
const splitOverlay = document.getElementById("splitOverlay");
const splitPreviewOriginal = document.getElementById("splitPreviewOriginal");
const splitDivider = document.getElementById("splitDivider");
const splitBadgesHud = document.getElementById("splitBadgesHud");
const btnSplitQuickOrig = document.getElementById("btnSplitQuickOrig");
const btnSplitQuickProc = document.getElementById("btnSplitQuickProc");
const tabBtnBalance = document.getElementById("tab-btn-balance");
const tabBtnMezcla = document.getElementById("tab-btn-mezcla");
const colorViewBalance = document.getElementById("color-view-balance");
const colorViewMezcla = document.getElementById("color-view-mezcla");
const temperaturaInput = document.getElementById("temperaturaInput");
const temperaturaValor = document.getElementById("temperaturaValor");
const tinteInput = document.getElementById("tinteInput");
const tinteValor = document.getElementById("tinteValor");
const swatchButtons = document.querySelectorAll(".color-swatch-circle");
const colorActiveDot = document.getElementById("colorActiveDot");
const colorActiveName = document.getElementById("colorActiveName");
const hslTonoInput = document.getElementById("hslTonoInput");
const hslTonoValor = document.getElementById("hslTonoValor");
const hslSatInput = document.getElementById("hslSatInput");
const hslSatValor = document.getElementById("hslSatValor");
const hslLumInput = document.getElementById("hslLumInput");
const hslLumValor = document.getElementById("hslLumValor");
const botonResetColor = document.getElementById("botonResetColor");
const botonAplicarColor = document.getElementById("botonAplicarColor");

const marcoEstiloSelect = document.getElementById("marcoEstiloSelect");
const opcionesMarcoLiso = document.getElementById("opcionesMarcoLiso");
const marcoColorInput = document.getElementById("marcoColorInput");
const marcoGrosorInput = document.getElementById("marcoGrosorInput");
const marcoGrosorValor = document.getElementById("marcoGrosorValor");
const botonResetMarco = document.getElementById("botonResetMarco");
const botonAplicarMarco = document.getElementById("botonAplicarMarco");
const presetColorDots = document.querySelectorAll(".preset-color-dot");

function crearEstadoMarcoDefecto() {
    return {
        estilo: "ninguno",
        color: "#ffffff",
        grosor: 24,
    };
}

let estadoMarco = crearEstadoMarcoDefecto();

const presetIntensidadInput = document.getElementById("presetIntensidadInput");
const presetIntensidadValor = document.getElementById("presetIntensidadValor");
const presetsCardsContainer = document.getElementById("presetsCardsContainer");
const botonResetPresets = document.getElementById("botonResetPresets");
const botonAplicarPreset = document.getElementById("botonAplicarPreset");
const presetCards = document.querySelectorAll(".preset-card");

let estadoPreset = {
    id: "ninguno",
    intensidad: 100,
};

const bynActivoInput = document.getElementById("bynActivoInput");
const bynControlsWrap = document.getElementById("bynControlsWrap");
const bynFiltroPreset = document.getElementById("bynFiltroPreset");
const bynRojoInput = document.getElementById("bynRojoInput");
const bynRojoValor = document.getElementById("bynRojoValor");
const bynNaranjaInput = document.getElementById("bynNaranjaInput");
const bynNaranjaValor = document.getElementById("bynNaranjaValor");
const bynAmarilloInput = document.getElementById("bynAmarilloInput");
const bynAmarilloValor = document.getElementById("bynAmarilloValor");
const bynVerdeInput = document.getElementById("bynVerdeInput");
const bynVerdeValor = document.getElementById("bynVerdeValor");
const bynCyanInput = document.getElementById("bynCyanInput");
const bynCyanValor = document.getElementById("bynCyanValor");
const bynAzulInput = document.getElementById("bynAzulInput");
const bynAzulValor = document.getElementById("bynAzulValor");
const bynVioletaInput = document.getElementById("bynVioletaInput");
const bynVioletaValor = document.getElementById("bynVioletaValor");
const bynRosaInput = document.getElementById("bynRosaInput");
const bynRosaValor = document.getElementById("bynRosaValor");
const bynViradoSelect = document.getElementById("bynViradoSelect");
const bynViradoIntensidadInput = document.getElementById("bynViradoIntensidadInput");
const bynViradoIntensidadValor = document.getElementById("bynViradoIntensidadValor");
const botonResetByn = document.getElementById("botonResetByn");
const botonAplicarByn = document.getElementById("botonAplicarByn");

const FILTROS_BYN_MAP = {
    neutro: { rojo: 0, naranja: 0, amarillo: 0, verde: 0, cyan: 0, azul: 0, violeta: 0, rosa: 0 },
    rojo: { rojo: 40, naranja: 20, amarillo: 0, verde: -20, cyan: -30, azul: -40, violeta: -20, rosa: 20 },
    naranja: { rojo: 30, naranja: 40, amarillo: 20, verde: -10, cyan: -20, azul: -30, violeta: -10, rosa: 10 },
    amarillo: { rojo: 15, naranja: 25, amarillo: 35, verde: 10, cyan: -10, azul: -20, violeta: -10, rosa: 5 },
    verde: { rojo: -25, naranja: -15, amarillo: 20, verde: 45, cyan: 15, azul: -20, violeta: -20, rosa: -15 },
    azul: { rojo: -30, naranja: -20, amarillo: -20, verde: -10, cyan: 20, azul: 45, violeta: 30, rosa: 0 },
    infrarrojo: { rojo: 80, naranja: 50, amarillo: 60, verde: 70, cyan: -50, azul: -70, violeta: -60, rosa: 30 },
};

const CANALES_BYN_INPUTS = {
    rojo: { input: bynRojoInput, output: bynRojoValor },
    naranja: { input: bynNaranjaInput, output: bynNaranjaValor },
    amarillo: { input: bynAmarilloInput, output: bynAmarilloValor },
    verde: { input: bynVerdeInput, output: bynVerdeValor },
    cyan: { input: bynCyanInput, output: bynCyanValor },
    azul: { input: bynAzulInput, output: bynAzulValor },
    violeta: { input: bynVioletaInput, output: bynVioletaValor },
    rosa: { input: bynRosaInput, output: bynRosaValor },
};

function crearEstadoBynDefecto() {
    return {
        activo: false,
        preset: "neutro",
        canales: {
            rojo: 0,
            naranja: 0,
            amarillo: 0,
            verde: 0,
            cyan: 0,
            azul: 0,
            violeta: 0,
            rosa: 0,
        },
        virado: "ninguno",
        virado_intensidad: 70,
    };
}

let estadoByn = crearEstadoBynDefecto();

const CANALES_COLOR_INFO = {
    rojo: { nombre: "Rojo", color: "#ff3b30" },
    naranja: { nombre: "Naranja", color: "#ff9500" },
    amarillo: { nombre: "Amarillo", color: "#ffcc00" },
    verde: { nombre: "Verde", color: "#34c759" },
    cyan: { nombre: "Cyan", color: "#32ade6" },
    azul: { nombre: "Azul", color: "#007aff" },
    violeta: { nombre: "Violeta", color: "#af52de" },
    rosa: { nombre: "Rosa", color: "#ff2d55" }
};

function crearEstadoColorDefecto() {
    return {
        temperatura: 0,
        tinte: 0,
        mezcla: {
            rojo: { tono: 0, saturacion: 0, luminancia: 0 },
            naranja: { tono: 0, saturacion: 0, luminancia: 0 },
            amarillo: { tono: 0, saturacion: 0, luminancia: 0 },
            verde: { tono: 0, saturacion: 0, luminancia: 0 },
            cyan: { tono: 0, saturacion: 0, luminancia: 0 },
            azul: { tono: 0, saturacion: 0, luminancia: 0 },
            violeta: { tono: 0, saturacion: 0, luminancia: 0 },
            rosa: { tono: 0, saturacion: 0, luminancia: 0 }
        }
    };
}

let canalColorActivo = "rojo";
let estadoColor = crearEstadoColorDefecto();

let imagenActual = null;
let solicitudActual = 0;
let controladorCarga = null;
let cancelarVistaPendiente = null;
let modoRecorte = false;
let procesandoAccion = false;
let puntoInicioRecorte = null;
let puntoFinRecorte = null;
let punteroRecorte = null;
let imagenFueRecortada = false;

function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    mensaje.classList.toggle("oculto", !texto);
}

function actualizarEstadoDropZone() {
    if (!dropZone) return;
    const hayImagen = Boolean(imagenActual) || (preview && preview.src && !preview.classList.contains("oculto"));
    if (hayImagen) {
        dropZone.classList.add("oculto");
        dropZone.style.setProperty("display", "none", "important");
    } else {
        dropZone.classList.remove("oculto");
        dropZone.style.removeProperty("display");
    }
}

function mostrarValorSlider(valor) {
    const numero = Number(valor);
    return `${numero > 0 ? "+" : ""}${numero}%`;
}

function mostrarValorEntero(valor) {
    const numero = Number(valor);
    return `${numero > 0 ? "+" : ""}${numero}`;
}

function actualizarControlesEdicion() {
    const deshabilitados = !imagenActual || Boolean(controladorCarga) || procesandoAccion;
    const deshabilitadosPorRecorte = deshabilitados || modoRecorte;

    brilloInput.disabled = deshabilitadosPorRecorte;
    contrasteInput.disabled = deshabilitadosPorRecorte;
    saturacionInput.disabled = deshabilitadosPorRecorte;
    botonAplicarAjustes.disabled = deshabilitadosPorRecorte;
    if (botonResetAjustes) botonResetAjustes.disabled = deshabilitadosPorRecorte;

    if (desenfoqueInput) desenfoqueInput.disabled = deshabilitadosPorRecorte;
    if (nitidezInput) nitidezInput.disabled = deshabilitadosPorRecorte;
    if (granoInput) granoInput.disabled = deshabilitadosPorRecorte;
    if (botonAplicarDetalle) botonAplicarDetalle.disabled = deshabilitadosPorRecorte;
    if (botonResetDetalle) botonResetDetalle.disabled = deshabilitadosPorRecorte;

    if (ditherAlgoritmo) ditherAlgoritmo.disabled = deshabilitadosPorRecorte;
    if (ditherPaleta) ditherPaleta.disabled = deshabilitadosPorRecorte;
    if (ditherIntensidadInput) ditherIntensidadInput.disabled = deshabilitadosPorRecorte;
    if (ditherPixelInput) ditherPixelInput.disabled = deshabilitadosPorRecorte;
    if (botonAplicarDither) botonAplicarDither.disabled = deshabilitadosPorRecorte;
    if (botonResetDither) botonResetDither.disabled = deshabilitadosPorRecorte;

    if (temperaturaInput) temperaturaInput.disabled = deshabilitadosPorRecorte;
    if (tinteInput) tinteInput.disabled = deshabilitadosPorRecorte;
    if (hslTonoInput) hslTonoInput.disabled = deshabilitadosPorRecorte;
    if (hslSatInput) hslSatInput.disabled = deshabilitadosPorRecorte;
    if (hslLumInput) hslLumInput.disabled = deshabilitadosPorRecorte;
    if (botonResetColor) botonResetColor.disabled = deshabilitadosPorRecorte;
    if (botonAplicarColor) botonAplicarColor.disabled = deshabilitadosPorRecorte;
    swatchButtons.forEach(btn => btn.disabled = deshabilitadosPorRecorte);
    if (tabBtnBalance) tabBtnBalance.disabled = deshabilitadosPorRecorte;
    if (tabBtnMezcla) tabBtnMezcla.disabled = deshabilitadosPorRecorte;

    if (marcoEstiloSelect) marcoEstiloSelect.disabled = deshabilitadosPorRecorte;
    if (marcoColorInput) marcoColorInput.disabled = deshabilitadosPorRecorte;
    if (marcoGrosorInput) marcoGrosorInput.disabled = deshabilitadosPorRecorte;
    if (botonResetMarco) botonResetMarco.disabled = deshabilitadosPorRecorte;
    if (botonAplicarMarco) botonAplicarMarco.disabled = deshabilitadosPorRecorte;
    presetColorDots.forEach(dot => dot.disabled = deshabilitadosPorRecorte);

    if (bynActivoInput) bynActivoInput.disabled = deshabilitadosPorRecorte;
    const bynInternosDeshabilitados = deshabilitadosPorRecorte || !estadoByn.activo;
    if (bynFiltroPreset) bynFiltroPreset.disabled = bynInternosDeshabilitados;
    Object.keys(CANALES_BYN_INPUTS).forEach(canal => {
        const inp = CANALES_BYN_INPUTS[canal].input;
        if (inp) inp.disabled = bynInternosDeshabilitados;
    });
    if (bynViradoSelect) bynViradoSelect.disabled = bynInternosDeshabilitados;
    if (bynViradoIntensidadInput) bynViradoIntensidadInput.disabled = bynInternosDeshabilitados;
    if (botonResetByn) botonResetByn.disabled = deshabilitadosPorRecorte;
    if (botonAplicarByn) botonAplicarByn.disabled = deshabilitadosPorRecorte;
    if (bynControlsWrap) {
        bynControlsWrap.classList.toggle("byn-disabled", bynInternosDeshabilitados);
    }

    if (presetIntensidadInput) presetIntensidadInput.disabled = deshabilitadosPorRecorte;
    if (botonResetPresets) botonResetPresets.disabled = deshabilitadosPorRecorte;
    if (botonAplicarPreset) botonAplicarPreset.disabled = deshabilitadosPorRecorte;
    presetCards.forEach((c) => (c.disabled = deshabilitadosPorRecorte));

    btnIniciarRecorte.disabled = deshabilitados;
    botonVoltearHorizontal.disabled = deshabilitadosPorRecorte;
    botonVoltearVertical.disabled = deshabilitadosPorRecorte;

    if (botonExportar) {
        botonExportar.disabled = !imagenActual || Boolean(controladorCarga) || procesandoAccion;
    }
    if (botonComparar) {
        botonComparar.disabled = deshabilitadosPorRecorte;
    }
    btnConfirmarRecorte.disabled = !modoRecorte || !obtenerCoordenadasRecorte() || procesandoAccion;
    btnCancelarRecorte.disabled = !modoRecorte || procesandoAccion;
    if (btnRestablecerRecorte) {
        btnRestablecerRecorte.disabled = !imagenActual || !imagenFueRecortada || procesandoAccion;
    }
}

function establecerModoRecorte(activar) {
    if (activar && typeof establecerModoComparar === "function" && modoComparar) {
        establecerModoComparar(false);
    }
    modoRecorte = activar;
    puntoInicioRecorte = null;
    puntoFinRecorte = null;
    punteroRecorte = null;
    contenedorVisor.classList.toggle("modo-recorte", activar);
    cropOverlay.classList.toggle("oculto", !activar);
    cropSelection.classList.add("oculto");

    btnIniciarRecorte.classList.toggle("active", activar);
    btnIniciarRecorte.setAttribute("aria-expanded", String(activar));
    if (cropMenu) {
        cropMenu.classList.toggle("hidden", !activar);
    }

    if (activar) {
        if (typeof setPresetsMenuOpen === "function") setPresetsMenuOpen(false);
        if (typeof setEditMenuOpen === "function") setEditMenuOpen(false);
        if (typeof setDetalleMenuOpen === "function") setDetalleMenuOpen(false);
        if (typeof setDitherMenuOpen === "function") setDitherMenuOpen(false);
        if (typeof setColorMenuOpen === "function") setColorMenuOpen(false);
        if (typeof setBynMenuOpen === "function") setBynMenuOpen(false);
        if (typeof setMarcosMenuOpen === "function") setMarcosMenuOpen(false);
        indicadorCarga.textContent = "Arrastra sobre la imagen para seleccionar el recorte.";
        indicadorCarga.classList.remove("oculto");
    } else if (!procesandoAccion && !controladorCarga) {
        indicadorCarga.classList.add("oculto");
        indicadorCarga.textContent = "Procesando imagen…";
    }

    actualizarControlesEdicion();
}

function puntoLocalDesdeEvento(evento) {
    const transformacion = getComputedStyle(escenarioImagen).transform;
    const matriz = transformacion === "none"
        ? { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
        : new DOMMatrixReadOnly(transformacion);
    if (matriz.a === 0 || matriz.d === 0 || matriz.b !== 0 || matriz.c !== 0) {
        return null;
    }

    return {
        x: Math.max(0, Math.min(escenarioImagen.clientWidth, (evento.clientX - matriz.e) / matriz.a)),
        y: Math.max(0, Math.min(escenarioImagen.clientHeight, (evento.clientY - matriz.f) / matriz.d)),
    };
}

function actualizarSeleccionRecorte(punto) {
    puntoFinRecorte = punto;
    const izquierda = Math.min(puntoInicioRecorte.x, punto.x);
    const arriba = Math.min(puntoInicioRecorte.y, punto.y);
    cropSelection.style.left = `${izquierda}px`;
    cropSelection.style.top = `${arriba}px`;
    cropSelection.style.width = `${Math.abs(punto.x - puntoInicioRecorte.x)}px`;
    cropSelection.style.height = `${Math.abs(punto.y - puntoInicioRecorte.y)}px`;
    cropSelection.classList.remove("oculto");
    actualizarControlesEdicion();
}

function obtenerCoordenadasRecorte() {
    if (!puntoInicioRecorte || !puntoFinRecorte || !preview.naturalWidth || !preview.naturalHeight) {
        return null;
    }

    const anchoVista = escenarioImagen.clientWidth;
    const altoVista = escenarioImagen.clientHeight;

    const estilo = getComputedStyle(preview);
    const padLeft = parseFloat(estilo.paddingLeft) || 0;
    const padRight = parseFloat(estilo.paddingRight) || 0;
    const padTop = parseFloat(estilo.paddingTop) || 0;
    const padBottom = parseFloat(estilo.paddingBottom) || 0;

    const anchoContenido = Math.max(1, anchoVista - padLeft - padRight);
    const altoContenido = Math.max(1, altoVista - padTop - padBottom);

    const esCover = estilo.objectFit === "cover";
    const escalaImagen = esCover
        ? Math.max(anchoContenido / preview.naturalWidth, altoContenido / preview.naturalHeight)
        : Math.min(anchoContenido / preview.naturalWidth, altoContenido / preview.naturalHeight);
    const anchoRenderizado = preview.naturalWidth * escalaImagen;
    const altoRenderizado = preview.naturalHeight * escalaImagen;
    const desplazamientoX = padLeft + (anchoContenido - anchoRenderizado) / 2;
    const desplazamientoY = padTop + (altoContenido - altoRenderizado) / 2;

    const aPixelX = (x) => Math.max(
        0,
        Math.min(preview.naturalWidth, (x - desplazamientoX) / anchoRenderizado * preview.naturalWidth),
    );
    const aPixelY = (y) => Math.max(
        0,
        Math.min(preview.naturalHeight, (y - desplazamientoY) / altoRenderizado * preview.naturalHeight),
    );

    const x1 = aPixelX(Math.min(puntoInicioRecorte.x, puntoFinRecorte.x));
    const y1 = aPixelY(Math.min(puntoInicioRecorte.y, puntoFinRecorte.y));
    const x2 = aPixelX(Math.max(puntoInicioRecorte.x, puntoFinRecorte.x));
    const y2 = aPixelY(Math.max(puntoInicioRecorte.y, puntoFinRecorte.y));
    const x = Math.floor(x1);
    const y = Math.floor(y1);
    const derecha = Math.ceil(x2);
    const abajo = Math.ceil(y2);

    if (derecha <= x || abajo <= y) {
        return null;
    }
    return { x, y, ancho: derecha - x, alto: abajo - y };
}

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

botonCargar.addEventListener("click", () => {
    imageInput.click();
});

async function procesarArchivoSubida(archivo) {
    if (!archivo) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    procesandoAccion = false;
    establecerModoRecorte(false);
    if (typeof establecerModoComparar === "function") {
        establecerModoComparar(false);
    }
    imagenActual = null;
    imagenFueRecortada = false;
    brilloInput.value = "0";
    brilloValor.value = "0%";
    contrasteInput.value = "0";
    contrasteValor.value = "0%";
    saturacionInput.value = "0";
    saturacionValor.value = "0%";
    if (desenfoqueInput) desenfoqueInput.value = "0";
    if (desenfoqueValor) desenfoqueValor.value = "0%";
    if (nitidezInput) nitidezInput.value = "0";
    if (nitidezValor) nitidezValor.value = "0%";
    if (granoInput) granoInput.value = "0";
    if (granoValor) granoValor.value = "0%";
    if (ditherAlgoritmo) ditherAlgoritmo.value = "ninguno";
    if (ditherPaleta) ditherPaleta.value = "bn";
    if (ditherIntensidadInput) ditherIntensidadInput.value = "100";
    if (ditherIntensidadValor) ditherIntensidadValor.value = "100%";
    if (ditherPixelInput) ditherPixelInput.value = "1";
    if (ditherPixelValor) ditherPixelValor.value = "1 px";
    estadoColor = crearEstadoColorDefecto();
    canalColorActivo = "rojo";
    sincronizarTodosLosControlesColor();
    estadoMarco = crearEstadoMarcoDefecto();
    if (marcoEstiloSelect) marcoEstiloSelect.value = "ninguno";
    if (marcoColorInput) marcoColorInput.value = "#ffffff";
    if (marcoGrosorInput) marcoGrosorInput.value = "24";
    if (marcoGrosorValor) marcoGrosorValor.value = "24 px";
    if (typeof actualizarOpcionesMarcoUI === "function") actualizarOpcionesMarcoUI();
    estadoByn = crearEstadoBynDefecto();
    if (typeof sincronizarTodosLosControlesByn === "function") sincronizarTodosLosControlesByn();
    estadoPreset = { id: "ninguno", intensidad: 100 };
    if (typeof sincronizarControlesPresetUI === "function") sincronizarControlesPresetUI();
    actualizarControlesEdicion();

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
    if (dropZone) {
        dropZone.classList.add("oculto");
        dropZone.style.setProperty("display", "none", "important");
    }

    try {
        const respuesta = await fetch("/upload", {
            method: "POST",
            body: formulario,
            signal: controladorActual.signal,
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudo procesar la imagen.");
            actualizarEstadoDropZone();
            return;
        }

        imagenActual = resultado.id;
        imagenFueRecortada = Boolean(resultado.fue_recortada);
        actualizarControlesEdicion();
        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            mostrarMensaje("No se pudo mostrar la imagen procesada. Inténtalo de nuevo.");
            actualizarEstadoDropZone();
            return;
        }

        preview.classList.remove("oculto");
        actualizarEstadoDropZone();
        if (typeof reiniciarVista === "function") {
            reiniciarVista();
        }
    } catch (error) {
        if (numeroSolicitud !== solicitudActual || error.name === "AbortError") {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
        actualizarEstadoDropZone();
    } finally {
        if (numeroSolicitud === solicitudActual) {
            controladorCarga = null;
            indicadorCarga.classList.add("oculto");
            imageInput.value = "";
            actualizarControlesEdicion();
            actualizarEstadoDropZone();
        }
    }
}

imageInput.addEventListener("change", () => {
    const archivo = imageInput.files ? imageInput.files[0] : null;
    if (archivo) {
        procesarArchivoSubida(archivo);
    }
});

if (dropZone) {
    dropZone.addEventListener("click", () => {
        imageInput.click();
    });

    dropZone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            imageInput.click();
        }
    });

    ["pointerdown", "dblclick"].forEach((evento) => {
        dropZone.addEventListener(evento, (e) => e.stopPropagation());
    });
}

// Configurar Drag and Drop en el visor
let contadorArrastre = 0;

["dragenter", "dragover", "dragleave", "drop"].forEach((nombreEvento) => {
    window.addEventListener(nombreEvento, (e) => {
        e.preventDefault();
    }, false);
});

window.addEventListener("dragenter", (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
        contadorArrastre++;
        if (contenedorVisor) {
            contenedorVisor.classList.add("drag-over");
        }
    }
});

window.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
    }
});

window.addEventListener("dragleave", (e) => {
    e.preventDefault();
    contadorArrastre = Math.max(0, contadorArrastre - 1);
    if (contadorArrastre === 0 && contenedorVisor) {
        contenedorVisor.classList.remove("drag-over");
    }
});

window.addEventListener("drop", (e) => {
    e.preventDefault();
    contadorArrastre = 0;
    if (contenedorVisor) {
        contenedorVisor.classList.remove("drag-over");
    }

    const archivos = e.dataTransfer ? e.dataTransfer.files : null;
    if (!archivos || archivos.length === 0) return;

    const archivo = archivos[0];
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    const extensionValida = /\.(jpe?g|png|webp)$/i.test(archivo.name || "");

    if (!tiposPermitidos.includes(archivo.type) && !extensionValida) {
        mostrarMensaje("Formato no compatible. Por favor sube una imagen JPEG, PNG o WebP.");
        return;
    }

    procesarArchivoSubida(archivo);
});

actualizarEstadoDropZone();

brilloInput.addEventListener("input", () => {
    brilloValor.value = mostrarValorSlider(brilloInput.value);
});

contrasteInput.addEventListener("input", () => {
    contrasteValor.value = mostrarValorSlider(contrasteInput.value);
});

saturacionInput.addEventListener("input", () => {
    saturacionValor.value = mostrarValorSlider(saturacionInput.value);
});

function obtenerTodosLosAjustes() {
    return {
        brillo: Number(brilloInput ? brilloInput.value : 0),
        contraste: Number(contrasteInput ? contrasteInput.value : 0),
        saturacion: Number(saturacionInput ? saturacionInput.value : 0),
        desenfoque: Number(desenfoqueInput ? desenfoqueInput.value : 0),
        nitidez: Number(nitidezInput ? nitidezInput.value : 0),
        grano: Number(granoInput ? granoInput.value : 0),
    };
}

async function aplicarAjustes(nombreAjuste) {
    if (!imagenActual || procesandoAccion || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = `Aplicando ajustes...`;
    indicadorCarga.classList.remove("oculto");

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/ajustes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(obtenerTodosLosAjustes()),
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudieron aplicar los ajustes.");
            return;
        }

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
        if (typeof actualizarVistaComparador === "function") {
            actualizarVistaComparador();
        }
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
    } finally {
        if (numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

botonAplicarAjustes.addEventListener("click", () => aplicarAjustes());

if (botonResetAjustes) {
    botonResetAjustes.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        brilloInput.value = "0";
        brilloValor.value = "0%";
        contrasteInput.value = "0";
        contrasteValor.value = "0%";
        saturacionInput.value = "0";
        saturacionValor.value = "0%";
        aplicarAjustes();
    });
}

if (desenfoqueInput && desenfoqueValor) {
    desenfoqueInput.addEventListener("input", () => {
        desenfoqueValor.value = mostrarValorSlider(desenfoqueInput.value);
    });
}

if (nitidezInput && nitidezValor) {
    nitidezInput.addEventListener("input", () => {
        nitidezValor.value = mostrarValorSlider(nitidezInput.value);
    });
}

async function aplicarDetalle() {
    if (!imagenActual || procesandoAccion || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = "Aplicando detalle…";
    indicadorCarga.classList.remove("oculto");

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/detalle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(obtenerTodosLosAjustes()),
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudieron aplicar los ajustes de detalle.");
            return;
        }

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
        if (typeof actualizarVistaComparador === "function") {
            actualizarVistaComparador();
        }
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
    } finally {
        if (numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

if (botonAplicarDetalle) {
    botonAplicarDetalle.addEventListener("click", () => aplicarDetalle());
}

if (granoInput && granoValor) {
    granoInput.addEventListener("input", () => {
        granoValor.value = `${granoInput.value}%`;
    });
}

if (botonResetDetalle) {
    botonResetDetalle.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        if (desenfoqueInput) desenfoqueInput.value = "0";
        if (desenfoqueValor) desenfoqueValor.value = "0%";
        if (nitidezInput) nitidezInput.value = "0";
        if (nitidezValor) nitidezValor.value = "0%";
        if (granoInput) granoInput.value = "0";
        if (granoValor) granoValor.value = "0%";
        aplicarDetalle();
    });
}

if (ditherIntensidadInput && ditherIntensidadValor) {
    ditherIntensidadInput.addEventListener("input", () => {
        ditherIntensidadValor.value = `${ditherIntensidadInput.value}%`;
    });
}

if (ditherPixelInput && ditherPixelValor) {
    ditherPixelInput.addEventListener("input", () => {
        ditherPixelValor.value = `${ditherPixelInput.value} px`;
    });
}

async function aplicarDithering() {
    if (!imagenActual || procesandoAccion || modoRecorte) {
        return;
    }

    const algo = ditherAlgoritmo ? ditherAlgoritmo.value : "ninguno";
    const pal = ditherPaleta ? ditherPaleta.value : "bn";
    const pixel = Number(ditherPixelInput ? ditherPixelInput.value : 1);
    const intensidad = Number(ditherIntensidadInput ? ditherIntensidadInput.value : 100);

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = "Aplicando dithering…";
    indicadorCarga.classList.remove("oculto");

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/dithering`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                algoritmo: algo,
                paleta: pal,
                tamano_pixel: pixel,
                intensidad: intensidad,
            }),
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudo aplicar el efecto de dithering.");
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            mostrarMensaje("No se pudo mostrar la imagen con el dithering aplicado.");
            return;
        }

        mostrarMensaje("");
        preview.classList.remove("oculto");
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
    } finally {
        if (numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

if (botonAplicarDither) {
    botonAplicarDither.addEventListener("click", () => aplicarDithering());
}

if (botonResetDither) {
    botonResetDither.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        if (ditherAlgoritmo) ditherAlgoritmo.value = "ninguno";
        if (ditherPaleta) ditherPaleta.value = "bn";
        if (ditherIntensidadInput) ditherIntensidadInput.value = "100";
        if (ditherIntensidadValor) ditherIntensidadValor.value = "100%";
        if (ditherPixelInput) ditherPixelInput.value = "1";
        if (ditherPixelValor) ditherPixelValor.value = "1 px";
        aplicarDithering();
    });
}

function sincronizarSlidersCanalActivo() {
    const canal = (estadoColor.mezcla && estadoColor.mezcla[canalColorActivo]) || { tono: 0, saturacion: 0, luminancia: 0 };
    if (hslTonoInput) {
        hslTonoInput.value = String(canal.tono);
        if (hslTonoValor) hslTonoValor.value = mostrarValorEntero(canal.tono);
    }
    if (hslSatInput) {
        hslSatInput.value = String(canal.saturacion);
        if (hslSatValor) hslSatValor.value = mostrarValorSlider(canal.saturacion);
    }
    if (hslLumInput) {
        hslLumInput.value = String(canal.luminancia);
        if (hslLumValor) hslLumValor.value = mostrarValorSlider(canal.luminancia);
    }

    swatchButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.color === canalColorActivo);
    });

    const info = CANALES_COLOR_INFO[canalColorActivo];
    if (info) {
        if (colorActiveDot) colorActiveDot.style.background = info.color;
        if (colorActiveName) colorActiveName.textContent = info.nombre;
    }
}

function sincronizarTodosLosControlesColor() {
    if (temperaturaInput) {
        temperaturaInput.value = String(estadoColor.temperatura);
        if (temperaturaValor) temperaturaValor.value = mostrarValorEntero(estadoColor.temperatura);
    }
    if (tinteInput) {
        tinteInput.value = String(estadoColor.tinte);
        if (tinteValor) tinteValor.value = mostrarValorEntero(estadoColor.tinte);
    }
    sincronizarSlidersCanalActivo();
}

if (tabBtnBalance && tabBtnMezcla) {
    tabBtnBalance.addEventListener("click", () => {
        tabBtnBalance.classList.add("active");
        tabBtnMezcla.classList.remove("active");
        if (colorViewBalance) colorViewBalance.classList.remove("hidden");
        if (colorViewMezcla) colorViewMezcla.classList.add("hidden");
    });

    tabBtnMezcla.addEventListener("click", () => {
        tabBtnMezcla.classList.add("active");
        tabBtnBalance.classList.remove("active");
        if (colorViewMezcla) colorViewMezcla.classList.remove("hidden");
        if (colorViewBalance) colorViewBalance.classList.add("hidden");
    });
}

swatchButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const canal = btn.dataset.color;
        if (canal && CANALES_COLOR_INFO[canal]) {
            canalColorActivo = canal;
            sincronizarSlidersCanalActivo();
        }
    });
});

if (temperaturaInput) {
    temperaturaInput.addEventListener("input", () => {
        estadoColor.temperatura = Number(temperaturaInput.value);
        if (temperaturaValor) temperaturaValor.value = mostrarValorEntero(temperaturaInput.value);
    });
}

if (tinteInput) {
    tinteInput.addEventListener("input", () => {
        estadoColor.tinte = Number(tinteInput.value);
        if (tinteValor) tinteValor.value = mostrarValorEntero(tinteInput.value);
    });
}

if (hslTonoInput) {
    hslTonoInput.addEventListener("input", () => {
        if (!estadoColor.mezcla[canalColorActivo]) {
            estadoColor.mezcla[canalColorActivo] = { tono: 0, saturacion: 0, luminancia: 0 };
        }
        estadoColor.mezcla[canalColorActivo].tono = Number(hslTonoInput.value);
        if (hslTonoValor) hslTonoValor.value = mostrarValorEntero(hslTonoInput.value);
    });
}

if (hslSatInput) {
    hslSatInput.addEventListener("input", () => {
        if (!estadoColor.mezcla[canalColorActivo]) {
            estadoColor.mezcla[canalColorActivo] = { tono: 0, saturacion: 0, luminancia: 0 };
        }
        estadoColor.mezcla[canalColorActivo].saturacion = Number(hslSatInput.value);
        if (hslSatValor) hslSatValor.value = mostrarValorSlider(hslSatInput.value);
    });
}

if (hslLumInput) {
    hslLumInput.addEventListener("input", () => {
        if (!estadoColor.mezcla[canalColorActivo]) {
            estadoColor.mezcla[canalColorActivo] = { tono: 0, saturacion: 0, luminancia: 0 };
        }
        estadoColor.mezcla[canalColorActivo].luminancia = Number(hslLumInput.value);
        if (hslLumValor) hslLumValor.value = mostrarValorSlider(hslLumInput.value);
    });
}

async function aplicarColor() {
    if (!imagenActual || procesandoAccion || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = "Aplicando balance y mezcla de color…";
    indicadorCarga.classList.remove("oculto");

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/color`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                temperatura: estadoColor.temperatura,
                tinte: estadoColor.tinte,
                mezcla_color: estadoColor.mezcla
            }),
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudo aplicar la mezcla de color.");
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            mostrarMensaje("No se pudo mostrar la imagen con los ajustes de color aplicados.");
            return;
        }

        mostrarMensaje("");
        preview.classList.remove("oculto");
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
    } finally {
        if (numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

if (botonAplicarColor) {
    botonAplicarColor.addEventListener("click", () => aplicarColor());
}

if (botonResetColor) {
    botonResetColor.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        estadoColor = crearEstadoColorDefecto();
        sincronizarTodosLosControlesColor();
        aplicarColor();
    });
}

btnIniciarRecorte.addEventListener("click", () => {
    if (!imagenActual || procesandoAccion) {
        return;
    }
    mostrarMensaje("");
    establecerModoRecorte(!modoRecorte);
});

btnCancelarRecorte.addEventListener("click", () => {
    establecerModoRecorte(false);
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && modoRecorte && !procesandoAccion) {
        establecerModoRecorte(false);
        btnIniciarRecorte.focus();
    }
});

cropOverlay.addEventListener("pointerdown", (evento) => {
    if (!modoRecorte || procesandoAccion || evento.button !== 0) {
        return;
    }
    const punto = puntoLocalDesdeEvento(evento);
    if (!punto) {
        mostrarMensaje("No se pudo determinar el área de recorte.");
        return;
    }

    evento.preventDefault();
    evento.stopPropagation();
    punteroRecorte = evento.pointerId;
    puntoInicioRecorte = punto;
    puntoFinRecorte = null;
    cropOverlay.setPointerCapture(evento.pointerId);
    cropSelection.classList.remove("oculto");
    actualizarSeleccionRecorte(punto);
});

cropOverlay.addEventListener("pointermove", (evento) => {
    if (evento.pointerId !== punteroRecorte || !puntoInicioRecorte) {
        return;
    }
    evento.preventDefault();
    evento.stopPropagation();
    const punto = puntoLocalDesdeEvento(evento);
    if (punto) {
        actualizarSeleccionRecorte(punto);
    }
});

cropOverlay.addEventListener("pointerup", (evento) => {
    if (evento.pointerId !== punteroRecorte || !puntoInicioRecorte) {
        return;
    }
    evento.preventDefault();
    evento.stopPropagation();
    const punto = puntoLocalDesdeEvento(evento);
    if (punto) {
        actualizarSeleccionRecorte(punto);
    }
    punteroRecorte = null;
});

cropOverlay.addEventListener("pointercancel", (evento) => {
    if (evento.pointerId !== punteroRecorte) {
        return;
    }
    evento.stopPropagation();
    punteroRecorte = null;
    puntoInicioRecorte = null;
    puntoFinRecorte = null;
    cropSelection.classList.add("oculto");
    actualizarControlesEdicion();
});

btnConfirmarRecorte.addEventListener("click", async () => {
    const coordenadas = obtenerCoordenadasRecorte();
    if (!imagenActual || !coordenadas || procesandoAccion) {
        mostrarMensaje("Selecciona un área válida para recortar.");
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = "Aplicando recorte…";
    indicadorCarga.classList.remove("oculto");

    try {
        const respuesta = await fetch(`/imagen/${imagenActual}/recortar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(coordenadas),
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudo recortar la imagen.");
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            mostrarMensaje("No se pudo mostrar la imagen recortada.");
            return;
        }
        imagenFueRecortada = true;
        actualizarControlesEdicion();
        if (false) {
            return;
        }


        preview.classList.remove("oculto");
        if (typeof reiniciarVista === "function") {
            reiniciarVista();
        }
        mostrarMensaje("");
        establecerModoRecorte(false);
        if (typeof actualizarVistaComparador === "function") {
            actualizarVistaComparador();
        }
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
    } finally {
        if (numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
});


if (btnRestablecerRecorte) {
    btnRestablecerRecorte.addEventListener("click", async () => {
        if (!imagenActual || !imagenFueRecortada || procesandoAccion) {
            return;
        }

        const numeroSolicitud = ++solicitudActual;
        procesandoAccion = true;
        actualizarControlesEdicion();
        indicadorCarga.textContent = "Restableciendo tamaño original…";
        indicadorCarga.classList.remove("oculto");

        try {
            const respuesta = await fetch(`/imagen/${imagenActual}/restablecer-recorte`, {
                method: "POST",
            });
            const resultado = await respuesta.json();

            if (numeroSolicitud !== solicitudActual) return;
            if (!respuesta.ok || !resultado.ok) {
                mostrarMensaje(resultado.mensaje || "No se pudo restablecer el tamaño.");
                return;
            }

            const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
            if (numeroSolicitud !== solicitudActual) return;
            if (!vistaCargada) {
                mostrarMensaje("No se pudo mostrar la imagen restablecida.");
                return;
            }

            imagenFueRecortada = false;
            preview.classList.remove("oculto");
            if (typeof reiniciarVista === "function") {
                reiniciarVista();
            }
            mostrarMensaje("");
            establecerModoRecorte(false);
            if (typeof actualizarVistaComparador === "function") {
                actualizarVistaComparador();
            }
        } catch (error) {
            if (numeroSolicitud !== solicitudActual) return;
            mostrarMensaje("No se pudo conectar con el servidor.");
        } finally {
            if (numeroSolicitud === solicitudActual) {
                procesandoAccion = false;
                actualizarControlesEdicion();
                indicadorCarga.classList.add("oculto");
                indicadorCarga.textContent = "Procesando imagen…";
            }
        }
    });
}

if (botonExportar) {
    botonExportar.addEventListener("click", () => {
        if (!preview.src) return;
        const enlace = document.createElement("a");
        enlace.href = preview.src;
        enlace.download = "ditherix-export.jpg";
        enlace.click();
    });
}

actualizarControlesEdicion();

async function voltearImagen(direccion) {
    if (!imagenActual || procesandoAccion || modoRecorte) return;
    const numeroSolicitud = ++solicitudActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = `Volteando ${direccion}…`;
    indicadorCarga.classList.remove("oculto");
    try {
        const respuesta = await fetch(`/imagen/${imagenActual}/voltear/${direccion}`, {
            method: "POST",
        });
        const resultado = await respuesta.json();
        if (numeroSolicitud !== solicitudActual) return;
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudo voltear la imagen.");
            return;
        }
        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (!vistaCargada || numeroSolicitud !== solicitudActual) return;
        mostrarMensaje("");

        preview.classList.remove("oculto");
        if (typeof actualizarVistaComparador === "function") {
            actualizarVistaComparador();
        }
    } catch (error) {
        mostrarMensaje("No se pudo conectar con el servidor.");
    } finally {
        if (numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

botonVoltearHorizontal.addEventListener("click", () => {
    voltearImagen("horizontal");
});
botonVoltearVertical.addEventListener("click", () => {
    voltearImagen("vertical");
});

function actualizarOpcionesMarcoUI() {
    if (opcionesMarcoLiso) {
        opcionesMarcoLiso.classList.toggle("hidden", estadoMarco.estilo !== "liso");
    }
    presetColorDots.forEach(dot => {
        const dotColor = (dot.dataset.color || "").toLowerCase();
        const activeColor = (estadoMarco.color || "").toLowerCase();
        dot.classList.toggle("active", dotColor === activeColor);
    });
}

if (marcoEstiloSelect) {
    marcoEstiloSelect.addEventListener("change", () => {
        estadoMarco.estilo = marcoEstiloSelect.value;
        actualizarOpcionesMarcoUI();
    });
}

if (marcoColorInput) {
    marcoColorInput.addEventListener("input", () => {
        estadoMarco.color = marcoColorInput.value;
        actualizarOpcionesMarcoUI();
    });
}

presetColorDots.forEach(dot => {
    dot.addEventListener("click", () => {
        const c = dot.dataset.color;
        if (c) {
            estadoMarco.color = c;
            if (marcoColorInput) marcoColorInput.value = c;
            actualizarOpcionesMarcoUI();
        }
    });
});

if (marcoGrosorInput) {
    marcoGrosorInput.addEventListener("input", () => {
        estadoMarco.grosor = Number(marcoGrosorInput.value);
        if (marcoGrosorValor) marcoGrosorValor.value = `${marcoGrosorInput.value} px`;
    });
}

async function aplicarMarco() {
    if (!imagenActual || procesandoAccion || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = "Aplicando marco decorativo…";
    indicadorCarga.classList.remove("oculto");

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/marco`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                estilo: estadoMarco.estilo,
                color: estadoMarco.color,
                grosor: estadoMarco.grosor,
            }),
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudo aplicar el marco decorativo.");
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            mostrarMensaje("No se pudo mostrar la imagen con el marco aplicado.");
            return;
        }

        mostrarMensaje("");
        preview.classList.remove("oculto");
        if (typeof reiniciarVista === "function") {
            reiniciarVista();
        }
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
    } finally {
        if (numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

if (botonAplicarMarco) {
    botonAplicarMarco.addEventListener("click", () => aplicarMarco());
}

if (botonResetMarco) {
    botonResetMarco.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        estadoMarco.estilo = "ninguno";
        if (marcoEstiloSelect) marcoEstiloSelect.value = "ninguno";
        actualizarOpcionesMarcoUI();
        aplicarMarco();
    });
}

function sincronizarTodosLosControlesByn() {
    if (bynActivoInput) {
        bynActivoInput.checked = Boolean(estadoByn.activo);
    }
    if (bynFiltroPreset) {
        bynFiltroPreset.value = estadoByn.preset || "neutro";
    }
    Object.keys(CANALES_BYN_INPUTS).forEach((canal) => {
        const item = CANALES_BYN_INPUTS[canal];
        const val = estadoByn.canales[canal] ?? 0;
        if (item.input) item.input.value = String(val);
        if (item.output) item.output.value = mostrarValorEntero(val);
    });
    if (bynViradoSelect) {
        bynViradoSelect.value = estadoByn.virado || "ninguno";
    }
    if (bynViradoIntensidadInput) {
        bynViradoIntensidadInput.value = String(estadoByn.virado_intensidad ?? 70);
    }
    if (bynViradoIntensidadValor) {
        bynViradoIntensidadValor.value = `${estadoByn.virado_intensidad ?? 70}%`;
    }
    if (bynControlsWrap) {
        bynControlsWrap.classList.toggle("byn-disabled", !estadoByn.activo);
    }
}

if (bynActivoInput) {
    bynActivoInput.addEventListener("change", () => {
        estadoByn.activo = bynActivoInput.checked;
        actualizarControlesEdicion();
    });
}

if (bynFiltroPreset) {
    bynFiltroPreset.addEventListener("change", () => {
        const presetVal = bynFiltroPreset.value;
        estadoByn.preset = presetVal;
        if (presetVal !== "personalizado" && FILTROS_BYN_MAP[presetVal]) {
            const vals = FILTROS_BYN_MAP[presetVal];
            Object.keys(vals).forEach((canal) => {
                estadoByn.canales[canal] = vals[canal];
            });
            sincronizarTodosLosControlesByn();
        }
    });
}

Object.keys(CANALES_BYN_INPUTS).forEach((canal) => {
    const item = CANALES_BYN_INPUTS[canal];
    if (item.input) {
        item.input.addEventListener("input", () => {
            const val = Number(item.input.value);
            estadoByn.canales[canal] = val;
            if (item.output) {
                item.output.value = mostrarValorEntero(val);
            }
            estadoByn.preset = "personalizado";
            if (bynFiltroPreset) {
                bynFiltroPreset.value = "personalizado";
            }
        });
    }
});

if (bynViradoSelect) {
    bynViradoSelect.addEventListener("change", () => {
        estadoByn.virado = bynViradoSelect.value;
    });
}

if (bynViradoIntensidadInput) {
    bynViradoIntensidadInput.addEventListener("input", () => {
        estadoByn.virado_intensidad = Number(bynViradoIntensidadInput.value);
        if (bynViradoIntensidadValor) {
            bynViradoIntensidadValor.value = `${bynViradoIntensidadInput.value}%`;
        }
    });
}

async function aplicarByn() {
    if (!imagenActual || procesandoAccion || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = "Aplicando blanco y negro…";
    indicadorCarga.classList.remove("oculto");

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/byn`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                activo: estadoByn.activo,
                canales: estadoByn.canales,
                virado: estadoByn.virado,
                virado_intensidad: estadoByn.virado_intensidad,
            }),
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudieron aplicar los ajustes de blanco y negro.");
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            mostrarMensaje("No se pudo mostrar la imagen en blanco y negro.");
            return;
        }

        mostrarMensaje("");
        preview.classList.remove("oculto");
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
    } finally {
        if (numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

if (botonAplicarByn) {
    botonAplicarByn.addEventListener("click", () => aplicarByn());
}

if (botonResetByn) {
    botonResetByn.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        estadoByn = crearEstadoBynDefecto();
        sincronizarTodosLosControlesByn();
        aplicarByn();
    });
}

function sincronizarControlesPresetUI() {
    if (presetIntensidadInput) {
        presetIntensidadInput.value = String(estadoPreset.intensidad ?? 100);
    }
    if (presetIntensidadValor) {
        presetIntensidadValor.value = `${estadoPreset.intensidad ?? 100}%`;
    }
    presetCards.forEach((card) => {
        const id = card.dataset.preset;
        const activo = id === estadoPreset.id;
        card.classList.toggle("active", activo);
        card.setAttribute("aria-checked", String(activo));
    });
}

presetCards.forEach((card) => {
    card.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        const id = card.dataset.preset;
        if (!id) return;
        if (estadoPreset.id === id) {
            estadoPreset.id = "ninguno";
        } else {
            estadoPreset.id = id;
        }
        sincronizarControlesPresetUI();
        aplicarPreset();
    });
});

if (presetIntensidadInput) {
    presetIntensidadInput.addEventListener("input", () => {
        estadoPreset.intensidad = Number(presetIntensidadInput.value);
        if (presetIntensidadValor) {
            presetIntensidadValor.value = `${presetIntensidadInput.value}%`;
        }
    });

    presetIntensidadInput.addEventListener("change", () => {
        if (estadoPreset.id !== "ninguno" && imagenActual && !procesandoAccion && !modoRecorte) {
            aplicarPreset();
        }
    });
}

async function aplicarPreset() {
    if (!imagenActual || procesandoAccion || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = "Aplicando estilo fotográfico…";
    indicadorCarga.classList.remove("oculto");

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/preset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                preset: estadoPreset.id,
                intensidad: estadoPreset.intensidad,
            }),
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudo aplicar el estilo.");
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            mostrarMensaje("No se pudo mostrar la imagen con el estilo aplicado.");
            return;
        }

        mostrarMensaje("");
        preview.classList.remove("oculto");
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
    } finally {
        if (numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

if (botonAplicarPreset) {
    botonAplicarPreset.addEventListener("click", () => aplicarPreset());
}

if (botonResetPresets) {
    botonResetPresets.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        estadoPreset.id = "ninguno";
        sincronizarControlesPresetUI();
        aplicarPreset();
    });
}

// ==========================================================================
// Comparador Interactivo Split Antes / Después
// ==========================================================================

let modoComparar = false;
let splitPos = 50;
let splitArrastrando = false;

function fijarPosicionSplit(pct) {
    splitPos = Math.max(1, Math.min(99, pct));
    if (splitOverlay) {
        splitOverlay.style.setProperty("--split-pos", `${splitPos}%`);
    }
    if (splitDivider) {
        splitDivider.setAttribute("aria-valuenow", Math.round(splitPos).toString());
    }
}

function actualizarVistaComparador() {
    if (!modoComparar || !imagenActual) return;
    if (splitPreviewOriginal) {
        splitPreviewOriginal.src = `/original/${imagenActual}?t=${Date.now()}`;
    }
}

function establecerModoComparar(activar) {
    if (!imagenActual && activar) return;
    if (modoRecorte && activar) return;

    modoComparar = Boolean(activar);
    if (botonComparar) {
        botonComparar.classList.toggle("active", modoComparar);
        botonComparar.setAttribute("aria-pressed", String(modoComparar));
    }
    if (splitOverlay) {
        splitOverlay.classList.toggle("oculto", !modoComparar);
        splitOverlay.setAttribute("aria-hidden", String(!modoComparar));
    }
    if (splitBadgesHud) {
        splitBadgesHud.classList.toggle("oculto", !modoComparar);
        splitBadgesHud.setAttribute("aria-hidden", String(!modoComparar));
    }

    if (modoComparar) {
        actualizarVistaComparador();
        fijarPosicionSplit(50);
    }
}

function actualizarPosicionSplitDesdePointer(clientX) {
    if (!escenarioImagen) return;
    const transformacion = getComputedStyle(escenarioImagen).transform;
    const matriz = transformacion === "none"
        ? { a: 1, e: 0 }
        : new DOMMatrixReadOnly(transformacion);
    if (matriz.a === 0) return;

    const localX = (clientX - matriz.e) / matriz.a;
    const clientWidth = escenarioImagen.clientWidth || window.innerWidth;
    const pct = (localX / clientWidth) * 100;
    fijarPosicionSplit(pct);
}

if (botonComparar) {
    botonComparar.addEventListener("click", () => {
        establecerModoComparar(!modoComparar);
    });
}

if (splitDivider) {
    splitDivider.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        splitArrastrando = true;
        splitDivider.setPointerCapture(e.pointerId);
        splitDivider.classList.add("dragging");
        actualizarPosicionSplitDesdePointer(e.clientX);
    });

    splitDivider.addEventListener("pointermove", (e) => {
        if (!splitArrastrando) return;
        e.stopPropagation();
        actualizarPosicionSplitDesdePointer(e.clientX);
    });

    function soltarArrastreSplit(e) {
        if (!splitArrastrando) return;
        splitArrastrando = false;
        splitDivider.classList.remove("dragging");
        try {
            splitDivider.releasePointerCapture(e.pointerId);
        } catch (_) {}
    }

    splitDivider.addEventListener("pointerup", soltarArrastreSplit);
    splitDivider.addEventListener("pointercancel", soltarArrastreSplit);

    splitDivider.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        fijarPosicionSplit(50);
    });

    splitDivider.addEventListener("keydown", (e) => {
        const paso = e.shiftKey ? 10 : 2;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            fijarPosicionSplit(splitPos - paso);
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            fijarPosicionSplit(splitPos + paso);
        } else if (e.key === "Home") {
            e.preventDefault();
            fijarPosicionSplit(1);
        } else if (e.key === "End") {
            e.preventDefault();
            fijarPosicionSplit(99);
        }
    });
}

if (btnSplitQuickOrig) {
    btnSplitQuickOrig.addEventListener("click", (e) => {
        e.stopPropagation();
        fijarPosicionSplit(90);
    });
}

if (btnSplitQuickProc) {
    btnSplitQuickProc.addEventListener("click", (e) => {
        e.stopPropagation();
        fijarPosicionSplit(10);
    });
}

document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    if (e.key === "c" || e.key === "C" || e.key === "\\") {
        if (imagenActual && !modoRecorte && !procesandoAccion) {
            e.preventDefault();
            establecerModoComparar(!modoComparar);
        }
    }
});

