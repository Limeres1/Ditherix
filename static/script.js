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
const altasLucesInput = document.getElementById("altasLucesInput");
const altasLucesValor = document.getElementById("altasLucesValor");
const sombrasInput = document.getElementById("sombrasInput");
const sombrasValor = document.getElementById("sombrasValor");
const fadeInput = document.getElementById("fadeInput");
const fadeValor = document.getElementById("fadeValor");
const vinetaInput = document.getElementById("vinetaInput");
const vinetaValor = document.getElementById("vinetaValor");
const histogramCanvas = document.getElementById("histogramCanvas");
const histogramWrap = document.getElementById("histogramWrap");
const histogramModeBadge = document.getElementById("histogramModeBadge");
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
const opcionesDuotono = document.getElementById("opcionesDuotono");
const duotonoOscuroInput = document.getElementById("duotonoOscuroInput");
const duotonoClaroInput = document.getElementById("duotonoClaroInput");
const duotonoSwatchBtns = document.querySelectorAll(".duotono-swatch-btn");
const ditherUmbralInput = document.getElementById("ditherUmbralInput");
const ditherUmbralValor = document.getElementById("ditherUmbralValor");
const ditherIntensidadInput = document.getElementById("ditherIntensidadInput");
const ditherIntensidadValor = document.getElementById("ditherIntensidadValor");
const ditherPixelInput = document.getElementById("ditherPixelInput");
const ditherPixelValor = document.getElementById("ditherPixelValor");
const ditherPixelPerfectInput = document.getElementById("ditherPixelPerfectInput");
const botonAplicarDither = document.getElementById("botonAplicarDither");
const botonResetDither = document.getElementById("botonResetDither");
const halacionInput = document.getElementById("halacionInput");
const halacionValor = document.getElementById("halacionValor");
const aberracionInput = document.getElementById("aberracionInput");
const aberracionValor = document.getElementById("aberracionValor");
const scanlinesInput = document.getElementById("scanlinesInput");
const scanlinesValor = document.getElementById("scanlinesValor");
const botonResetOptica = document.getElementById("botonResetOptica");
const btnIniciarRecorte = document.getElementById("btn-iniciar-recorte");
const cropMenu = document.getElementById("crop-menu");
const btnConfirmarRecorte = document.getElementById("btn-confirmar-recorte");
const btnCancelarRecorte = document.getElementById("btn-cancelar-recorte");
const btnRestablecerRecorte = document.getElementById("btn-restablecer-recorte");
const cropRatioBtns = document.querySelectorAll(".crop-ratio-btn");
const anguloEnderezarInput = document.getElementById("anguloEnderezarInput");
const anguloEnderezarValor = document.getElementById("anguloEnderezarValor");
const btnResetAngulo = document.getElementById("btn-reset-angulo");
const cropOverlay = document.getElementById("cropOverlay");
const cropSelection = document.getElementById("cropSelection");
const contenedorVisor = document.getElementById("visor");
const escenarioImagen = document.getElementById("escenario");
const botonRotar90 = document.getElementById("botonRotar90");
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
let proporcionRecorte = null;
let procesandoAccion = false;
let puntoInicioRecorte = null;
let puntoFinRecorte = null;
let punteroRecorte = null;
let imagenFueRecortada = false;
let pixelPerfectOverride = null;
let modoHistogramaRGB = false;
const histAnalizerCanvas = document.createElement("canvas");

function esDitherVisualActivo() {
    const algoActivo = Boolean(ditherAlgoritmo && ditherAlgoritmo.value && ditherAlgoritmo.value !== "ninguno");
    const cardActiva = estadoPreset.id && estadoPreset.id !== "ninguno"
        ? document.querySelector(`.preset-card[data-preset="${estadoPreset.id}"]`)
        : null;
    const presetConDither = Boolean(cardActiva && cardActiva.dataset.dither === "true");
    return algoActivo || presetConDither;
}

function actualizarPixelPerfectUI() {
    const activo = pixelPerfectOverride !== null ? pixelPerfectOverride : esDitherVisualActivo();
    if (preview) {
        preview.classList.toggle("pixelated", activo);
    }
    if (ditherPixelPerfectInput) {
        ditherPixelPerfectInput.checked = activo;
    }
}

function actualizarDuotonoUI() {
    if (!opcionesDuotono || !ditherPaleta) return;
    opcionesDuotono.classList.toggle("oculto", ditherPaleta.value !== "duotono");
}

function mostrarAnguloGrados(valor) {
    const n = Number(valor) || 0;
    return `${n > 0 ? "+" : ""}${n.toFixed(1)}°`;
}

function parsearProporcion(clave) {
    if (!clave || clave === "free") return null;
    const partes = clave.split(":");
    if (partes.length !== 2) return null;
    const w = Number(partes[0]);
    const h = Number(partes[1]);
    return w > 0 && h > 0 ? w / h : null;
}

function actualizarHistograma() {
    if (!histogramCanvas) return;
    const hCtx = histogramCanvas.getContext("2d");
    if (!hCtx) return;

    const cw = histogramCanvas.width;
    const ch = histogramCanvas.height;
    hCtx.clearRect(0, 0, cw, ch);

    // Rejilla tonal sutil (25%, 50%, 75%)
    hCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    hCtx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const gx = Math.round((cw * i) / 4) + 0.5;
        hCtx.beginPath();
        hCtx.moveTo(gx, 0);
        hCtx.lineTo(gx, ch);
        hCtx.stroke();
    }

    if (!preview || preview.classList.contains("oculto") || !preview.naturalWidth || !preview.naturalHeight) {
        return;
    }

    try {
        const escalaAnal = Math.min(1, 150 / Math.max(preview.naturalWidth, preview.naturalHeight));
        const sw = Math.max(1, Math.round(preview.naturalWidth * escalaAnal));
        const sh = Math.max(1, Math.round(preview.naturalHeight * escalaAnal));
        histAnalizerCanvas.width = sw;
        histAnalizerCanvas.height = sh;
        const aCtx = histAnalizerCanvas.getContext("2d", { willReadFrequently: true });
        if (!aCtx) return;
        aCtx.drawImage(preview, 0, 0, sw, sh);
        const datos = aCtx.getImageData(0, 0, sw, sh).data;

        const binsL = new Uint32Array(256);
        const binsR = new Uint32Array(256);
        const binsG = new Uint32Array(256);
        const binsB = new Uint32Array(256);

        for (let i = 0; i < datos.length; i += 4) {
            const r = datos[i];
            const g = datos[i + 1];
            const b = datos[i + 2];
            const luma = Math.min(255, Math.round(0.299 * r + 0.587 * g + 0.114 * b));
            binsL[luma]++;
            binsR[r]++;
            binsG[g]++;
            binsB[b]++;
        }

        const suavizar = (src) => {
            const out = new Float32Array(256);
            let maxVal = 1;
            for (let i = 0; i < 256; i++) {
                const a = src[Math.max(0, i - 1)];
                const b = src[i];
                const c = src[Math.min(255, i + 1)];
                out[i] = (a + b * 2 + c) * 0.25;
                if (i > 2 && i < 253 && out[i] > maxVal) maxVal = out[i];
            }
            const techo = Math.max(maxVal, out[0] * 0.45, out[255] * 0.45, 1);
            for (let i = 0; i < 256; i++) {
                out[i] = Math.min(1, out[i] / techo);
            }
            return out;
        };

        const trazarCurva = (norm, fillStyle, strokeStyle) => {
            hCtx.beginPath();
            hCtx.moveTo(0, ch);
            for (let i = 0; i < 256; i++) {
                const px = (i / 255) * cw;
                const py = ch - norm[i] * (ch - 4);
                hCtx.lineTo(px, py);
            }
            hCtx.lineTo(cw, ch);
            hCtx.closePath();
            if (fillStyle) {
                hCtx.fillStyle = fillStyle;
                hCtx.fill();
            }
            if (strokeStyle) {
                hCtx.strokeStyle = strokeStyle;
                hCtx.lineWidth = 1.15;
                hCtx.stroke();
            }
        };

        if (modoHistogramaRGB) {
            hCtx.save();
            hCtx.globalCompositeOperation = "screen";
            trazarCurva(suavizar(binsR), "rgba(255, 78, 88, 0.36)", "rgba(255, 110, 120, 0.78)");
            trazarCurva(suavizar(binsG), "rgba(75, 228, 128, 0.36)", "rgba(110, 245, 155, 0.78)");
            trazarCurva(suavizar(binsB), "rgba(78, 168, 255, 0.36)", "rgba(110, 195, 255, 0.78)");
            hCtx.restore();
            trazarCurva(suavizar(binsL), null, "rgba(255, 255, 255, 0.45)");
        } else {
            trazarCurva(suavizar(binsL), "rgba(255, 255, 255, 0.22)", "#ffffff");
        }
    } catch (_) {
        // Silenciar si la imagen aún no está lista
    }
}

if (preview) {
    preview.addEventListener("load", actualizarHistograma);
}

if (histogramWrap) {
    const alternarModoHistograma = () => {
        modoHistogramaRGB = !modoHistogramaRGB;
        if (histogramModeBadge) {
            histogramModeBadge.textContent = modoHistogramaRGB ? "RGB" : "LUMA";
        }
        actualizarHistograma();
    };
    histogramWrap.addEventListener("click", alternarModoHistograma);
    histogramWrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            alternarModoHistograma();
        }
    });
}

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
    if (typeof window.setZoomHudVisible === "function") {
        window.setZoomHudVisible(Boolean(hayImagen));
    }
    if (!hayImagen) {
        actualizarHistograma();
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

const timersTiempoReal = {};
const enProgresoTiempoReal = {};
const pendientesTiempoReal = {};

function programarTiempoReal(canal, fnAplicar, delay = 75, permitirEnRecorte = false) {
    if (!imagenActual || (modoRecorte && !permitirEnRecorte)) return;
    clearTimeout(timersTiempoReal[canal]);
    timersTiempoReal[canal] = setTimeout(async () => {
        if (enProgresoTiempoReal[canal]) {
            pendientesTiempoReal[canal] = fnAplicar;
            return;
        }
        enProgresoTiempoReal[canal] = true;
        try {
            await fnAplicar({ esTiempoReal: true });
        } catch (e) {
            console.error(`Error en tiempo real (${canal}):`, e);
        } finally {
            enProgresoTiempoReal[canal] = false;
            if (pendientesTiempoReal[canal]) {
                const siguienteFn = pendientesTiempoReal[canal];
                pendientesTiempoReal[canal] = null;
                programarTiempoReal(canal, siguienteFn, 20, permitirEnRecorte);
            }
        }
    }, delay);
}

function actualizarControlesEdicion() {
    const deshabilitados = !imagenActual || Boolean(controladorCarga) || procesandoAccion;
    const deshabilitadosPorRecorte = deshabilitados || modoRecorte;
    const slidersDeshabilitados = !imagenActual || Boolean(controladorCarga) || modoRecorte;

    brilloInput.disabled = slidersDeshabilitados;
    contrasteInput.disabled = slidersDeshabilitados;
    saturacionInput.disabled = slidersDeshabilitados;
    if (altasLucesInput) altasLucesInput.disabled = slidersDeshabilitados;
    if (sombrasInput) sombrasInput.disabled = slidersDeshabilitados;
    if (fadeInput) fadeInput.disabled = slidersDeshabilitados;
    if (vinetaInput) vinetaInput.disabled = slidersDeshabilitados;
    if (botonAplicarAjustes) botonAplicarAjustes.disabled = deshabilitadosPorRecorte;
    if (botonResetAjustes) botonResetAjustes.disabled = deshabilitadosPorRecorte;

    if (desenfoqueInput) desenfoqueInput.disabled = slidersDeshabilitados;
    if (nitidezInput) nitidezInput.disabled = slidersDeshabilitados;
    if (granoInput) granoInput.disabled = slidersDeshabilitados;
    if (botonAplicarDetalle) botonAplicarDetalle.disabled = deshabilitadosPorRecorte;
    if (botonResetDetalle) botonResetDetalle.disabled = deshabilitadosPorRecorte;

    if (ditherAlgoritmo) ditherAlgoritmo.disabled = slidersDeshabilitados;
    if (ditherPaleta) ditherPaleta.disabled = slidersDeshabilitados;
    if (duotonoOscuroInput) duotonoOscuroInput.disabled = slidersDeshabilitados;
    if (duotonoClaroInput) duotonoClaroInput.disabled = slidersDeshabilitados;
    duotonoSwatchBtns.forEach((b) => { b.disabled = slidersDeshabilitados; });
    if (ditherUmbralInput) ditherUmbralInput.disabled = slidersDeshabilitados;
    if (ditherIntensidadInput) ditherIntensidadInput.disabled = slidersDeshabilitados;
    if (ditherPixelInput) ditherPixelInput.disabled = slidersDeshabilitados;
    if (ditherPixelPerfectInput) ditherPixelPerfectInput.disabled = slidersDeshabilitados;
    if (botonAplicarDither) botonAplicarDither.disabled = deshabilitadosPorRecorte;
    if (botonResetDither) botonResetDither.disabled = deshabilitadosPorRecorte;

    if (halacionInput) halacionInput.disabled = slidersDeshabilitados;
    if (aberracionInput) aberracionInput.disabled = slidersDeshabilitados;
    if (scanlinesInput) scanlinesInput.disabled = slidersDeshabilitados;
    if (botonResetOptica) botonResetOptica.disabled = deshabilitadosPorRecorte;

    if (temperaturaInput) temperaturaInput.disabled = slidersDeshabilitados;
    if (tinteInput) tinteInput.disabled = slidersDeshabilitados;
    if (hslTonoInput) hslTonoInput.disabled = slidersDeshabilitados;
    if (hslSatInput) hslSatInput.disabled = slidersDeshabilitados;
    if (hslLumInput) hslLumInput.disabled = slidersDeshabilitados;
    if (botonResetColor) botonResetColor.disabled = deshabilitadosPorRecorte;
    if (botonAplicarColor) botonAplicarColor.disabled = deshabilitadosPorRecorte;
    swatchButtons.forEach(btn => btn.disabled = slidersDeshabilitados);
    if (tabBtnBalance) tabBtnBalance.disabled = slidersDeshabilitados;
    if (tabBtnMezcla) tabBtnMezcla.disabled = slidersDeshabilitados;

    if (marcoEstiloSelect) marcoEstiloSelect.disabled = slidersDeshabilitados;
    if (marcoColorInput) marcoColorInput.disabled = slidersDeshabilitados;
    if (marcoGrosorInput) marcoGrosorInput.disabled = slidersDeshabilitados;
    if (botonResetMarco) botonResetMarco.disabled = deshabilitadosPorRecorte;
    if (botonAplicarMarco) botonAplicarMarco.disabled = deshabilitadosPorRecorte;
    presetColorDots.forEach(dot => dot.disabled = slidersDeshabilitados);

    if (bynActivoInput) bynActivoInput.disabled = slidersDeshabilitados;
    const bynInternosDeshabilitados = slidersDeshabilitados || !estadoByn.activo;
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

    if (presetIntensidadInput) presetIntensidadInput.disabled = slidersDeshabilitados;
    if (botonResetPresets) botonResetPresets.disabled = deshabilitadosPorRecorte;
    if (botonAplicarPreset) botonAplicarPreset.disabled = deshabilitadosPorRecorte;
    presetCards.forEach((c) => (c.disabled = slidersDeshabilitados));

    btnIniciarRecorte.disabled = deshabilitados;
    if (anguloEnderezarInput) anguloEnderezarInput.disabled = deshabilitados;
    if (btnResetAngulo) btnResetAngulo.disabled = deshabilitados;
    cropRatioBtns.forEach((b) => { b.disabled = deshabilitados; });
    if (botonRotar90) botonRotar90.disabled = deshabilitadosPorRecorte;
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
        if (typeof setOpticaMenuOpen === "function") setOpticaMenuOpen(false);
        indicadorCarga.textContent = "Arrastra sobre la imagen para seleccionar el recorte.";
        indicadorCarga.classList.remove("oculto");
        if (proporcionRecorte !== null) {
            aplicarCajaRecortePorProporcion(proporcionRecorte);
        }
    } else if (!procesandoAccion && !controladorCarga) {
        indicadorCarga.classList.add("oculto");
        indicadorCarga.textContent = "Procesando imagen…";
    }

    actualizarControlesEdicion();
}

function obtenerRectImagenRenderizada() {
    if (!preview || !preview.naturalWidth || !preview.naturalHeight) {
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
    const left = padLeft + (anchoContenido - anchoRenderizado) / 2;
    const top = padTop + (altoContenido - altoRenderizado) / 2;
    return { left, top, width: anchoRenderizado, height: altoRenderizado, escalaImagen };
}

function puntoLocalDesdeEvento(evento) {
    const transformacion = getComputedStyle(escenarioImagen).transform;
    const matriz = transformacion === "none"
        ? { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
        : new DOMMatrixReadOnly(transformacion);
    if (matriz.a === 0 || matriz.d === 0 || matriz.b !== 0 || matriz.c !== 0) {
        return null;
    }

    let lx = Math.max(0, Math.min(escenarioImagen.clientWidth, (evento.clientX - matriz.e) / matriz.a));
    let ly = Math.max(0, Math.min(escenarioImagen.clientHeight, (evento.clientY - matriz.f) / matriz.d));
    const rect = obtenerRectImagenRenderizada();
    if (rect) {
        lx = Math.max(rect.left, Math.min(rect.left + rect.width, lx));
        ly = Math.max(rect.top, Math.min(rect.top + rect.height, ly));
    }
    return { x: lx, y: ly };
}

function aplicarCajaRecortePorProporcion(ratio) {
    const rect = obtenerRectImagenRenderizada();
    if (!rect || !ratio) return;
    let boxW = rect.width * 0.86;
    let boxH = boxW / ratio;
    if (boxH > rect.height * 0.86) {
        boxH = rect.height * 0.86;
        boxW = boxH * ratio;
    }
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    puntoInicioRecorte = { x: cx - boxW / 2, y: cy - boxH / 2 };
    actualizarSeleccionRecorte({ x: cx + boxW / 2, y: cy + boxH / 2 });
}

function actualizarSeleccionRecorte(punto) {
    let fin = punto;
    if (proporcionRecorte && puntoInicioRecorte) {
        const rect = obtenerRectImagenRenderizada();
        const maxLeft = rect ? rect.left : 0;
        const maxTop = rect ? rect.top : 0;
        const maxRight = rect ? rect.left + rect.width : escenarioImagen.clientWidth;
        const maxBottom = rect ? rect.top + rect.height : escenarioImagen.clientHeight;

        const sx = punto.x >= puntoInicioRecorte.x ? 1 : -1;
        const sy = punto.y >= puntoInicioRecorte.y ? 1 : -1;
        const maxW = sx > 0 ? maxRight - puntoInicioRecorte.x : puntoInicioRecorte.x - maxLeft;
        const maxH = sy > 0 ? maxBottom - puntoInicioRecorte.y : puntoInicioRecorte.y - maxTop;

        let boxW = Math.min(maxW, Math.max(Math.abs(punto.x - puntoInicioRecorte.x), Math.abs(punto.y - puntoInicioRecorte.y) * proporcionRecorte));
        if (boxW / proporcionRecorte > maxH) {
            boxW = maxH * proporcionRecorte;
        }
        const boxH = boxW / proporcionRecorte;
        fin = {
            x: puntoInicioRecorte.x + sx * boxW,
            y: puntoInicioRecorte.y + sy * boxH,
        };
    }

    puntoFinRecorte = fin;
    const izquierda = Math.min(puntoInicioRecorte.x, fin.x);
    const arriba = Math.min(puntoInicioRecorte.y, fin.y);
    cropSelection.style.left = `${izquierda}px`;
    cropSelection.style.top = `${arriba}px`;
    cropSelection.style.width = `${Math.abs(fin.x - puntoInicioRecorte.x)}px`;
    cropSelection.style.height = `${Math.abs(fin.y - puntoInicioRecorte.y)}px`;
    cropSelection.classList.remove("oculto");
    actualizarControlesEdicion();
}

function obtenerCoordenadasRecorte() {
    if (!puntoInicioRecorte || !puntoFinRecorte) {
        return null;
    }
    const rect = obtenerRectImagenRenderizada();
    if (!rect) return null;

    const aPixelX = (x) => Math.max(
        0,
        Math.min(preview.naturalWidth, (x - rect.left) / rect.width * preview.naturalWidth),
    );
    const aPixelY = (y) => Math.max(
        0,
        Math.min(preview.naturalHeight, (y - rect.top) / rect.height * preview.naturalHeight),
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
    if (altasLucesInput) altasLucesInput.value = "0";
    if (altasLucesValor) altasLucesValor.value = "0%";
    if (sombrasInput) sombrasInput.value = "0";
    if (sombrasValor) sombrasValor.value = "0%";
    if (fadeInput) fadeInput.value = "0";
    if (fadeValor) fadeValor.value = "0%";
    if (vinetaInput) vinetaInput.value = "0";
    if (vinetaValor) vinetaValor.value = "0%";
    if (desenfoqueInput) desenfoqueInput.value = "0";
    if (desenfoqueValor) desenfoqueValor.value = "0%";
    if (nitidezInput) nitidezInput.value = "0";
    if (nitidezValor) nitidezValor.value = "0%";
    if (granoInput) granoInput.value = "0";
    if (granoValor) granoValor.value = "0%";
    if (ditherAlgoritmo) ditherAlgoritmo.value = "ninguno";
    if (ditherPaleta) ditherPaleta.value = "bn";
    if (duotonoOscuroInput) duotonoOscuroInput.value = "#0a0a10";
    if (duotonoClaroInput) duotonoClaroInput.value = "#f2f2ea";
    if (ditherUmbralInput) ditherUmbralInput.value = "0";
    if (ditherUmbralValor) ditherUmbralValor.value = "0";
    if (ditherIntensidadInput) ditherIntensidadInput.value = "100";
    if (ditherIntensidadValor) ditherIntensidadValor.value = "100%";
    if (ditherPixelInput) ditherPixelInput.value = "1";
    if (ditherPixelValor) ditherPixelValor.value = "1 px";
    pixelPerfectOverride = null;
    actualizarDuotonoUI();
    actualizarPixelPerfectUI();
    if (halacionInput) halacionInput.value = "0";
    if (halacionValor) halacionValor.value = "0%";
    if (aberracionInput) aberracionInput.value = "0";
    if (aberracionValor) aberracionValor.value = "0%";
    if (scanlinesInput) scanlinesInput.value = "0";
    if (scanlinesValor) scanlinesValor.value = "0%";
    if (anguloEnderezarInput) anguloEnderezarInput.value = "0";
    if (anguloEnderezarValor) anguloEnderezarValor.value = "0.0°";
    proporcionRecorte = null;
    cropRatioBtns.forEach((b) => b.classList.toggle("active", b.dataset.ratio === "free"));
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
    programarTiempoReal("ajustes", aplicarAjustes);
});

contrasteInput.addEventListener("input", () => {
    contrasteValor.value = mostrarValorSlider(contrasteInput.value);
    programarTiempoReal("ajustes", aplicarAjustes);
});

saturacionInput.addEventListener("input", () => {
    saturacionValor.value = mostrarValorSlider(saturacionInput.value);
    programarTiempoReal("ajustes", aplicarAjustes);
});

[
    [altasLucesInput, altasLucesValor],
    [sombrasInput, sombrasValor],
    [fadeInput, fadeValor],
    [vinetaInput, vinetaValor],
].forEach(([inp, out]) => {
    if (inp && out) {
        inp.addEventListener("input", () => {
            out.value = mostrarValorSlider(inp.value);
            programarTiempoReal("ajustes", aplicarAjustes);
        });
    }
});

function obtenerTodosLosAjustes() {
    return {
        brillo: Number(brilloInput ? brilloInput.value : 0),
        contraste: Number(contrasteInput ? contrasteInput.value : 0),
        saturacion: Number(saturacionInput ? saturacionInput.value : 0),
        altas_luces: Number(altasLucesInput ? altasLucesInput.value : 0),
        sombras: Number(sombrasInput ? sombrasInput.value : 0),
        fade: Number(fadeInput ? fadeInput.value : 0),
        vineta: Number(vinetaInput ? vinetaInput.value : 0),
        desenfoque: Number(desenfoqueInput ? desenfoqueInput.value : 0),
        nitidez: Number(nitidezInput ? nitidezInput.value : 0),
        grano: Number(granoInput ? granoInput.value : 0),
    };
}

async function aplicarAjustes(opciones = {}) {
    const esTiempoReal = Boolean(opciones && opciones.esTiempoReal);
    if (!imagenActual || (!esTiempoReal && procesandoAccion) || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    if (!esTiempoReal) {
        procesandoAccion = true;
        actualizarControlesEdicion();
        indicadorCarga.textContent = `Aplicando ajustes...`;
        indicadorCarga.classList.remove("oculto");
    }

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
            if (!esTiempoReal) {
                mostrarMensaje(resultado.mensaje || "No se pudieron aplicar los ajustes.");
            }
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            if (!esTiempoReal) {
                mostrarMensaje("No se pudo mostrar la imagen con los ajustes aplicados.");
            }
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
        if (!esTiempoReal) {
            if (error instanceof SyntaxError) {
                mostrarMensaje("El servidor devolvió una respuesta inesperada.");
            } else {
                mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
            }
        }
    } finally {
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

if (botonAplicarAjustes) {
    botonAplicarAjustes.addEventListener("click", () => aplicarAjustes());
}

if (botonResetAjustes) {
    botonResetAjustes.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        brilloInput.value = "0";
        brilloValor.value = "0%";
        contrasteInput.value = "0";
        contrasteValor.value = "0%";
        saturacionInput.value = "0";
        saturacionValor.value = "0%";
        if (altasLucesInput) altasLucesInput.value = "0";
        if (altasLucesValor) altasLucesValor.value = "0%";
        if (sombrasInput) sombrasInput.value = "0";
        if (sombrasValor) sombrasValor.value = "0%";
        if (fadeInput) fadeInput.value = "0";
        if (fadeValor) fadeValor.value = "0%";
        if (vinetaInput) vinetaInput.value = "0";
        if (vinetaValor) vinetaValor.value = "0%";
        aplicarAjustes();
    });
}

if (desenfoqueInput && desenfoqueValor) {
    desenfoqueInput.addEventListener("input", () => {
        desenfoqueValor.value = mostrarValorSlider(desenfoqueInput.value);
        programarTiempoReal("detalle", aplicarDetalle);
    });
}

if (nitidezInput && nitidezValor) {
    nitidezInput.addEventListener("input", () => {
        nitidezValor.value = mostrarValorSlider(nitidezInput.value);
        programarTiempoReal("detalle", aplicarDetalle);
    });
}

async function aplicarDetalle(opciones = {}) {
    const esTiempoReal = Boolean(opciones && opciones.esTiempoReal);
    if (!imagenActual || (!esTiempoReal && procesandoAccion) || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    if (!esTiempoReal) {
        procesandoAccion = true;
        actualizarControlesEdicion();
        indicadorCarga.textContent = "Aplicando detalle…";
        indicadorCarga.classList.remove("oculto");
    }

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
            if (!esTiempoReal) {
                mostrarMensaje(resultado.mensaje || "No se pudieron aplicar los ajustes de detalle.");
            }
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            if (!esTiempoReal) {
                mostrarMensaje("No se pudo mostrar la imagen con los ajustes aplicados.");
            }
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
        if (!esTiempoReal) {
            if (error instanceof SyntaxError) {
                mostrarMensaje("El servidor devolvió una respuesta inesperada.");
            } else {
                mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
            }
        }
    } finally {
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
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
        programarTiempoReal("detalle", aplicarDetalle);
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
        programarTiempoReal("dither", aplicarDithering);
    });
}

if (ditherPixelInput && ditherPixelValor) {
    ditherPixelInput.addEventListener("input", () => {
        ditherPixelValor.value = `${ditherPixelInput.value} px`;
        programarTiempoReal("dither", aplicarDithering);
    });
}

if (ditherAlgoritmo) {
    ditherAlgoritmo.addEventListener("change", () => {
        pixelPerfectOverride = null;
        actualizarPixelPerfectUI();
        programarTiempoReal("dither", aplicarDithering, 10);
    });
}

if (ditherPaleta) {
    ditherPaleta.addEventListener("change", () => {
        actualizarDuotonoUI();
        programarTiempoReal("dither", aplicarDithering, 10);
    });
}

if (ditherUmbralInput && ditherUmbralValor) {
    ditherUmbralInput.addEventListener("input", () => {
        ditherUmbralValor.value = mostrarValorEntero(ditherUmbralInput.value);
        programarTiempoReal("dither", aplicarDithering);
    });
}

if (duotonoOscuroInput) {
    duotonoOscuroInput.addEventListener("input", () => {
        if (ditherPaleta && ditherPaleta.value !== "duotono") {
            ditherPaleta.value = "duotono";
            actualizarDuotonoUI();
        }
        programarTiempoReal("dither", aplicarDithering, 40);
    });
}

if (duotonoClaroInput) {
    duotonoClaroInput.addEventListener("input", () => {
        if (ditherPaleta && ditherPaleta.value !== "duotono") {
            ditherPaleta.value = "duotono";
            actualizarDuotonoUI();
        }
        programarTiempoReal("dither", aplicarDithering, 40);
    });
}

duotonoSwatchBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        const osc = btn.dataset.oscuro || "#0a0a10";
        const cla = btn.dataset.claro || "#f2f2ea";
        if (duotonoOscuroInput) duotonoOscuroInput.value = osc;
        if (duotonoClaroInput) duotonoClaroInput.value = cla;
        if (ditherPaleta) ditherPaleta.value = "duotono";
        if (ditherAlgoritmo && ditherAlgoritmo.value === "ninguno") {
            ditherAlgoritmo.value = "floyd_steinberg";
            pixelPerfectOverride = null;
            actualizarPixelPerfectUI();
        }
        actualizarDuotonoUI();
        programarTiempoReal("dither", aplicarDithering, 10);
    });
});

if (ditherPixelPerfectInput) {
    ditherPixelPerfectInput.addEventListener("change", () => {
        pixelPerfectOverride = ditherPixelPerfectInput.checked;
        actualizarPixelPerfectUI();
    });
}

async function aplicarDithering(opciones = {}) {
    const esTiempoReal = Boolean(opciones && opciones.esTiempoReal);
    if (!imagenActual || (!esTiempoReal && procesandoAccion) || modoRecorte) {
        return;
    }

    const algo = ditherAlgoritmo ? ditherAlgoritmo.value : "ninguno";
    const pal = ditherPaleta ? ditherPaleta.value : "bn";
    const pixel = Number(ditherPixelInput ? ditherPixelInput.value : 1);
    const intensidad = Number(ditherIntensidadInput ? ditherIntensidadInput.value : 100);
    const umbral = Number(ditherUmbralInput ? ditherUmbralInput.value : 0);
    const duotonoOscuro = duotonoOscuroInput ? duotonoOscuroInput.value : "#0a0a10";
    const duotonoClaro = duotonoClaroInput ? duotonoClaroInput.value : "#f2f2ea";

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    if (!esTiempoReal) {
        procesandoAccion = true;
        actualizarControlesEdicion();
        indicadorCarga.textContent = "Aplicando dithering…";
        indicadorCarga.classList.remove("oculto");
    }

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/dithering`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                algoritmo: algo,
                paleta: pal,
                tamano_pixel: pixel,
                intensidad: intensidad,
                umbral: umbral,
                duotono_oscuro: duotonoOscuro,
                duotono_claro: duotonoClaro,
            }),
        });
        const resultado = await respuesta.json();

        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!respuesta.ok || !resultado.ok) {
            if (!esTiempoReal) {
                mostrarMensaje(resultado.mensaje || "No se pudo aplicar el efecto de dithering.");
            }
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            if (!esTiempoReal) {
                mostrarMensaje("No se pudo mostrar la imagen con el dithering aplicado.");
            }
            return;
        }

        mostrarMensaje("");
        preview.classList.remove("oculto");
        actualizarPixelPerfectUI();
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!esTiempoReal) {
            if (error instanceof SyntaxError) {
                mostrarMensaje("El servidor devolvió una respuesta inesperada.");
            } else {
                mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
            }
        }
    } finally {
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
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
        if (duotonoOscuroInput) duotonoOscuroInput.value = "#0a0a10";
        if (duotonoClaroInput) duotonoClaroInput.value = "#f2f2ea";
        if (ditherUmbralInput) ditherUmbralInput.value = "0";
        if (ditherUmbralValor) ditherUmbralValor.value = "0";
        if (ditherIntensidadInput) ditherIntensidadInput.value = "100";
        if (ditherIntensidadValor) ditherIntensidadValor.value = "100%";
        if (ditherPixelInput) ditherPixelInput.value = "1";
        if (ditherPixelValor) ditherPixelValor.value = "1 px";
        pixelPerfectOverride = null;
        actualizarDuotonoUI();
        actualizarPixelPerfectUI();
        aplicarDithering();
    });
}

[
    [halacionInput, halacionValor],
    [aberracionInput, aberracionValor],
    [scanlinesInput, scanlinesValor],
].forEach(([inp, out]) => {
    if (inp && out) {
        inp.addEventListener("input", () => {
            out.value = `${inp.value}%`;
            programarTiempoReal("optica", aplicarOptica);
        });
    }
});

async function aplicarOptica(opciones = {}) {
    const esTiempoReal = Boolean(opciones && opciones.esTiempoReal);
    if (!imagenActual || (!esTiempoReal && procesandoAccion) || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    if (!esTiempoReal) {
        procesandoAccion = true;
        actualizarControlesEdicion();
        indicadorCarga.textContent = "Procesando óptica…";
        indicadorCarga.classList.remove("oculto");
    }

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/optica`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                halacion: Number(halacionInput ? halacionInput.value : 0),
                aberracion: Number(aberracionInput ? aberracionInput.value : 0),
                scanlines: Number(scanlinesInput ? scanlinesInput.value : 0),
            }),
        });
        const resultado = await respuesta.json();
        if (numeroSolicitud !== solicitudActual) return;
        if (!respuesta.ok || !resultado.ok) {
            if (!esTiempoReal) {
                mostrarMensaje(resultado.mensaje || "No se pudieron aplicar los efectos ópticos.");
            }
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
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
            mostrarMensaje("No se pudo conectar con el servidor.");
        }
    } finally {
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
            procesandoAccion = false;
            actualizarControlesEdicion();
            indicadorCarga.classList.add("oculto");
            indicadorCarga.textContent = "Procesando imagen…";
        }
    }
}

if (botonResetOptica) {
    botonResetOptica.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion || modoRecorte) return;
        if (halacionInput) halacionInput.value = "0";
        if (halacionValor) halacionValor.value = "0%";
        if (aberracionInput) aberracionInput.value = "0";
        if (aberracionValor) aberracionValor.value = "0%";
        if (scanlinesInput) scanlinesInput.value = "0";
        if (scanlinesValor) scanlinesValor.value = "0%";
        aplicarOptica();
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
        programarTiempoReal("color", aplicarColor);
    });
}

if (tinteInput) {
    tinteInput.addEventListener("input", () => {
        estadoColor.tinte = Number(tinteInput.value);
        if (tinteValor) tinteValor.value = mostrarValorEntero(tinteInput.value);
        programarTiempoReal("color", aplicarColor);
    });
}

if (hslTonoInput) {
    hslTonoInput.addEventListener("input", () => {
        if (!estadoColor.mezcla[canalColorActivo]) {
            estadoColor.mezcla[canalColorActivo] = { tono: 0, saturacion: 0, luminancia: 0 };
        }
        estadoColor.mezcla[canalColorActivo].tono = Number(hslTonoInput.value);
        if (hslTonoValor) hslTonoValor.value = mostrarValorEntero(hslTonoInput.value);
        programarTiempoReal("color", aplicarColor);
    });
}

if (hslSatInput) {
    hslSatInput.addEventListener("input", () => {
        if (!estadoColor.mezcla[canalColorActivo]) {
            estadoColor.mezcla[canalColorActivo] = { tono: 0, saturacion: 0, luminancia: 0 };
        }
        estadoColor.mezcla[canalColorActivo].saturacion = Number(hslSatInput.value);
        if (hslSatValor) hslSatValor.value = mostrarValorSlider(hslSatInput.value);
        programarTiempoReal("color", aplicarColor);
    });
}

if (hslLumInput) {
    hslLumInput.addEventListener("input", () => {
        if (!estadoColor.mezcla[canalColorActivo]) {
            estadoColor.mezcla[canalColorActivo] = { tono: 0, saturacion: 0, luminancia: 0 };
        }
        estadoColor.mezcla[canalColorActivo].luminancia = Number(hslLumInput.value);
        if (hslLumValor) hslLumValor.value = mostrarValorSlider(hslLumInput.value);
        programarTiempoReal("color", aplicarColor);
    });
}

async function aplicarColor(opciones = {}) {
    const esTiempoReal = Boolean(opciones && opciones.esTiempoReal);
    if (!imagenActual || (!esTiempoReal && procesandoAccion) || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    if (!esTiempoReal) {
        procesandoAccion = true;
        actualizarControlesEdicion();
        indicadorCarga.textContent = "Aplicando balance y mezcla de color…";
        indicadorCarga.classList.remove("oculto");
    }

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
            if (!esTiempoReal) {
                mostrarMensaje(resultado.mensaje || "No se pudo aplicar la mezcla de color.");
            }
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            if (!esTiempoReal) {
                mostrarMensaje("No se pudo mostrar la imagen con los ajustes de color aplicados.");
            }
            return;
        }

        mostrarMensaje("");
        preview.classList.remove("oculto");
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!esTiempoReal) {
            if (error instanceof SyntaxError) {
                mostrarMensaje("El servidor devolvió una respuesta inesperada.");
            } else {
                mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
            }
        }
    } finally {
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
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

cropRatioBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion) return;
        const clave = btn.dataset.ratio || "free";
        proporcionRecorte = parsearProporcion(clave);
        cropRatioBtns.forEach((b) => b.classList.toggle("active", b === btn));
        if (modoRecorte) {
            if (proporcionRecorte !== null) {
                aplicarCajaRecortePorProporcion(proporcionRecorte);
            } else {
                puntoInicioRecorte = null;
                puntoFinRecorte = null;
                cropSelection.classList.add("oculto");
                actualizarControlesEdicion();
            }
        }
    });
});

async function aplicarEnderezado(opciones = {}) {
    const esTiempoReal = Boolean(opciones && opciones.esTiempoReal);
    if (!imagenActual || (!esTiempoReal && procesandoAccion) || !anguloEnderezarInput) {
        return;
    }

    const angulo = Number(anguloEnderezarInput.value || 0);
    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;

    try {
        const respuesta = await fetch(`/imagen/${imagenId}/enderezar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ angulo }),
        });
        const resultado = await respuesta.json();
        if (numeroSolicitud !== solicitudActual) return;
        if (!respuesta.ok || !resultado.ok) {
            if (!esTiempoReal) {
                mostrarMensaje(resultado.mensaje || "No se pudo enderezar el horizonte.");
            }
            return;
        }
        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (!vistaCargada || numeroSolicitud !== solicitudActual) return;
        mostrarMensaje("");
        preview.classList.remove("oculto");
        if (modoRecorte) {
            if (proporcionRecorte !== null) {
                aplicarCajaRecortePorProporcion(proporcionRecorte);
            } else {
                puntoInicioRecorte = null;
                puntoFinRecorte = null;
                cropSelection.classList.add("oculto");
                actualizarControlesEdicion();
            }
        }
        if (typeof actualizarVistaComparador === "function") {
            actualizarVistaComparador();
        }
    } catch (error) {
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
            mostrarMensaje("No se pudo conectar con el servidor.");
        }
    }
}

if (anguloEnderezarInput && anguloEnderezarValor) {
    anguloEnderezarInput.addEventListener("input", () => {
        anguloEnderezarValor.value = mostrarAnguloGrados(anguloEnderezarInput.value);
        programarTiempoReal("enderezar", aplicarEnderezado, 85, true);
    });
}

if (btnResetAngulo && anguloEnderezarInput && anguloEnderezarValor) {
    btnResetAngulo.addEventListener("click", () => {
        if (!imagenActual || procesandoAccion) return;
        anguloEnderezarInput.value = "0";
        anguloEnderezarValor.value = "0.0°";
        programarTiempoReal("enderezar", aplicarEnderezado, 10, true);
    });
}

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
        if (anguloEnderezarInput) anguloEnderezarInput.value = "0";
        if (anguloEnderezarValor) anguloEnderezarValor.value = "0.0°";
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

            imagenFueRecortada = Boolean(resultado.fue_recortada);

            if (resultado.ajustes) {
                if (brilloInput && resultado.ajustes.brillo !== undefined) {
                    brilloInput.value = String(resultado.ajustes.brillo);
                    if (brilloValor) brilloValor.value = mostrarValorSlider(resultado.ajustes.brillo);
                }
                if (contrasteInput && resultado.ajustes.contraste !== undefined) {
                    contrasteInput.value = String(resultado.ajustes.contraste);
                    if (contrasteValor) contrasteValor.value = mostrarValorSlider(resultado.ajustes.contraste);
                }
                if (saturacionInput && resultado.ajustes.saturacion !== undefined) {
                    saturacionInput.value = String(resultado.ajustes.saturacion);
                    if (saturacionValor) saturacionValor.value = mostrarValorSlider(resultado.ajustes.saturacion);
                }
                if (altasLucesInput && resultado.ajustes.altas_luces !== undefined) {
                    altasLucesInput.value = String(resultado.ajustes.altas_luces);
                    if (altasLucesValor) altasLucesValor.value = mostrarValorSlider(resultado.ajustes.altas_luces);
                }
                if (sombrasInput && resultado.ajustes.sombras !== undefined) {
                    sombrasInput.value = String(resultado.ajustes.sombras);
                    if (sombrasValor) sombrasValor.value = mostrarValorSlider(resultado.ajustes.sombras);
                }
                if (fadeInput && resultado.ajustes.fade !== undefined) {
                    fadeInput.value = String(resultado.ajustes.fade);
                    if (fadeValor) fadeValor.value = mostrarValorSlider(resultado.ajustes.fade);
                }
                if (vinetaInput && resultado.ajustes.vineta !== undefined) {
                    vinetaInput.value = String(resultado.ajustes.vineta);
                    if (vinetaValor) vinetaValor.value = mostrarValorSlider(resultado.ajustes.vineta);
                }
                if (desenfoqueInput && resultado.ajustes.desenfoque !== undefined) {
                    desenfoqueInput.value = String(resultado.ajustes.desenfoque);
                    if (desenfoqueValor) desenfoqueValor.value = mostrarValorSlider(resultado.ajustes.desenfoque);
                }
                if (nitidezInput && resultado.ajustes.nitidez !== undefined) {
                    nitidezInput.value = String(resultado.ajustes.nitidez);
                    if (nitidezValor) nitidezValor.value = mostrarValorSlider(resultado.ajustes.nitidez);
                }
                if (granoInput && resultado.ajustes.grano !== undefined) {
                    granoInput.value = String(resultado.ajustes.grano);
                    if (granoValor) granoValor.value = mostrarValorSlider(resultado.ajustes.grano);
                }
            }

            if (resultado.dither_algoritmo !== undefined && ditherAlgoritmo) {
                ditherAlgoritmo.value = resultado.dither_algoritmo;
            }
            if (resultado.dither_paleta !== undefined && ditherPaleta) {
                ditherPaleta.value = resultado.dither_paleta;
            }
            if (resultado.dither_duotono_oscuro !== undefined && duotonoOscuroInput) {
                duotonoOscuroInput.value = resultado.dither_duotono_oscuro;
            }
            if (resultado.dither_duotono_claro !== undefined && duotonoClaroInput) {
                duotonoClaroInput.value = resultado.dither_duotono_claro;
            }
            if (resultado.dither_umbral !== undefined && ditherUmbralInput) {
                ditherUmbralInput.value = String(resultado.dither_umbral);
                if (ditherUmbralValor) ditherUmbralValor.value = mostrarValorEntero(resultado.dither_umbral);
            }
            if (resultado.dither_intensidad !== undefined && ditherIntensidadInput) {
                ditherIntensidadInput.value = String(resultado.dither_intensidad);
                if (ditherIntensidadValor) ditherIntensidadValor.value = `${resultado.dither_intensidad}%`;
            }
            if (resultado.dither_pixel !== undefined && ditherPixelInput) {
                ditherPixelInput.value = String(resultado.dither_pixel);
                if (ditherPixelValor) ditherPixelValor.value = `${resultado.dither_pixel} px`;
            }
            pixelPerfectOverride = null;
            actualizarDuotonoUI();

            if (resultado.halacion !== undefined && halacionInput) {
                halacionInput.value = String(resultado.halacion);
                if (halacionValor) halacionValor.value = `${resultado.halacion}%`;
            }
            if (resultado.aberracion !== undefined && aberracionInput) {
                aberracionInput.value = String(resultado.aberracion);
                if (aberracionValor) aberracionValor.value = `${resultado.aberracion}%`;
            }
            if (resultado.scanlines !== undefined && scanlinesInput) {
                scanlinesInput.value = String(resultado.scanlines);
                if (scanlinesValor) scanlinesValor.value = `${resultado.scanlines}%`;
            }
            if (resultado.angulo !== undefined && anguloEnderezarInput) {
                anguloEnderezarInput.value = String(resultado.angulo);
                if (anguloEnderezarValor) anguloEnderezarValor.value = mostrarAnguloGrados(resultado.angulo);
            }

            if (resultado.temperatura !== undefined || resultado.tinte !== undefined || resultado.mezcla_color) {
                estadoColor.temperatura = Number(resultado.temperatura ?? 0);
                estadoColor.tinte = Number(resultado.tinte ?? 0);
                estadoColor.mezcla = resultado.mezcla_color ? JSON.parse(JSON.stringify(resultado.mezcla_color)) : {};
                sincronizarTodosLosControlesColor();
            }

            if (resultado.marco_estilo !== undefined) {
                estadoMarco.estilo = resultado.marco_estilo;
                estadoMarco.color = resultado.marco_color ?? "#ffffff";
                estadoMarco.grosor = Number(resultado.marco_grosor ?? 24);
                if (marcoEstiloSelect) marcoEstiloSelect.value = estadoMarco.estilo;
                if (marcoColorInput) marcoColorInput.value = estadoMarco.color;
                if (marcoGrosorInput) marcoGrosorInput.value = String(estadoMarco.grosor);
                if (marcoGrosorValor) marcoGrosorValor.value = `${estadoMarco.grosor} px`;
                if (typeof actualizarOpcionesMarcoUI === "function") actualizarOpcionesMarcoUI();
            }

            if (resultado.byn_activo !== undefined) {
                estadoByn.activo = Boolean(resultado.byn_activo);
                estadoByn.canales = resultado.byn_canales ? { ...resultado.byn_canales } : {};
                estadoByn.virado = resultado.byn_virado ?? "ninguno";
                estadoByn.virado_intensidad = Number(resultado.byn_virado_intensidad ?? 70);
                if (typeof sincronizarTodosLosControlesByn === "function") sincronizarTodosLosControlesByn();
            }

            if (resultado.preset_activo !== undefined) {
                estadoPreset.id = resultado.preset_activo;
                estadoPreset.intensidad = Number(resultado.preset_intensidad ?? 100);
                if (typeof sincronizarControlesPresetUI === "function") sincronizarControlesPresetUI();
            }
            actualizarPixelPerfectUI();

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
        if (resultado.angulo !== undefined && anguloEnderezarInput) {
            anguloEnderezarInput.value = String(resultado.angulo);
            if (anguloEnderezarValor) anguloEnderezarValor.value = mostrarAnguloGrados(resultado.angulo);
        }
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

async function rotarImagen90(sentido = "derecha") {
    if (!imagenActual || procesandoAccion || modoRecorte) return;
    const numeroSolicitud = ++solicitudActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = "Rotando 90°…";
    indicadorCarga.classList.remove("oculto");
    try {
        const respuesta = await fetch(`/imagen/${imagenActual}/rotar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sentido }),
        });
        const resultado = await respuesta.json();
        if (numeroSolicitud !== solicitudActual) return;
        if (!respuesta.ok || !resultado.ok) {
            mostrarMensaje(resultado.mensaje || "No se pudo rotar la imagen.");
            return;
        }
        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (!vistaCargada || numeroSolicitud !== solicitudActual) return;
        mostrarMensaje("");
        preview.classList.remove("oculto");
        if (typeof reiniciarVista === "function") {
            reiniciarVista();
        }
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

if (botonRotar90) {
    botonRotar90.addEventListener("click", () => rotarImagen90("derecha"));
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
        programarTiempoReal("marco", aplicarMarco, 10);
    });
}

if (marcoColorInput) {
    marcoColorInput.addEventListener("input", () => {
        estadoMarco.color = marcoColorInput.value;
        actualizarOpcionesMarcoUI();
        programarTiempoReal("marco", aplicarMarco);
    });
}

presetColorDots.forEach(dot => {
    dot.addEventListener("click", () => {
        const c = dot.dataset.color;
        if (c) {
            estadoMarco.color = c;
            if (marcoColorInput) marcoColorInput.value = c;
            actualizarOpcionesMarcoUI();
            programarTiempoReal("marco", aplicarMarco, 10);
        }
    });
});

if (marcoGrosorInput) {
    marcoGrosorInput.addEventListener("input", () => {
        estadoMarco.grosor = Number(marcoGrosorInput.value);
        if (marcoGrosorValor) marcoGrosorValor.value = `${marcoGrosorInput.value} px`;
        programarTiempoReal("marco", aplicarMarco);
    });
}

async function aplicarMarco(opciones = {}) {
    const esTiempoReal = Boolean(opciones && opciones.esTiempoReal);
    if (!imagenActual || (!esTiempoReal && procesandoAccion) || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    if (!esTiempoReal) {
        procesandoAccion = true;
        actualizarControlesEdicion();
        indicadorCarga.textContent = "Aplicando marco decorativo…";
        indicadorCarga.classList.remove("oculto");
    }

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
            if (!esTiempoReal) {
                mostrarMensaje(resultado.mensaje || "No se pudo aplicar el marco decorativo.");
            }
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            if (!esTiempoReal) {
                mostrarMensaje("No se pudo mostrar la imagen con el marco aplicado.");
            }
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
        if (!esTiempoReal) {
            if (error instanceof SyntaxError) {
                mostrarMensaje("El servidor devolvió una respuesta inesperada.");
            } else {
                mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
            }
        }
    } finally {
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
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
        programarTiempoReal("byn", aplicarByn, 10);
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
            programarTiempoReal("byn", aplicarByn, 10);
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
            programarTiempoReal("byn", aplicarByn);
        });
    }
});

if (bynViradoSelect) {
    bynViradoSelect.addEventListener("change", () => {
        estadoByn.virado = bynViradoSelect.value;
        programarTiempoReal("byn", aplicarByn, 10);
    });
}

if (bynViradoIntensidadInput) {
    bynViradoIntensidadInput.addEventListener("input", () => {
        estadoByn.virado_intensidad = Number(bynViradoIntensidadInput.value);
        if (bynViradoIntensidadValor) {
            bynViradoIntensidadValor.value = `${bynViradoIntensidadInput.value}%`;
        }
        programarTiempoReal("byn", aplicarByn);
    });
}

async function aplicarByn(opciones = {}) {
    const esTiempoReal = Boolean(opciones && opciones.esTiempoReal);
    if (!imagenActual || (!esTiempoReal && procesandoAccion) || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    if (!esTiempoReal) {
        procesandoAccion = true;
        actualizarControlesEdicion();
        indicadorCarga.textContent = "Aplicando blanco y negro…";
        indicadorCarga.classList.remove("oculto");
    }

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
            if (!esTiempoReal) {
                mostrarMensaje(resultado.mensaje || "No se pudieron aplicar los ajustes de blanco y negro.");
            }
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            if (!esTiempoReal) {
                mostrarMensaje("No se pudo mostrar la imagen en blanco y negro.");
            }
            return;
        }

        mostrarMensaje("");
        preview.classList.remove("oculto");
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!esTiempoReal) {
            if (error instanceof SyntaxError) {
                mostrarMensaje("El servidor devolvió una respuesta inesperada.");
            } else {
                mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
            }
        }
    } finally {
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
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
        if (estadoPreset.id && estadoPreset.id !== "ninguno") {
            programarTiempoReal("preset", aplicarPreset);
        }
    });

    presetIntensidadInput.addEventListener("change", () => {
        if (estadoPreset.id !== "ninguno" && imagenActual && !procesandoAccion && !modoRecorte) {
            programarTiempoReal("preset", aplicarPreset, 10);
        }
    });
}

async function aplicarPreset(opciones = {}) {
    const esTiempoReal = Boolean(opciones && opciones.esTiempoReal);
    if (!imagenActual || (!esTiempoReal && procesandoAccion) || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    if (!esTiempoReal) {
        procesandoAccion = true;
        actualizarControlesEdicion();
        indicadorCarga.textContent = "Aplicando estilo fotográfico…";
        indicadorCarga.classList.remove("oculto");
    }

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
            if (!esTiempoReal) {
                mostrarMensaje(resultado.mensaje || "No se pudo aplicar el estilo.");
            }
            return;
        }

        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            if (!esTiempoReal) {
                mostrarMensaje("No se pudo mostrar la imagen con el estilo aplicado.");
            }
            return;
        }

        mostrarMensaje("");
        preview.classList.remove("oculto");
        pixelPerfectOverride = null;
        actualizarPixelPerfectUI();
    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!esTiempoReal) {
            if (error instanceof SyntaxError) {
                mostrarMensaje("El servidor devolvió una respuesta inesperada.");
            } else {
                mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
            }
        }
    } finally {
        if (!esTiempoReal && numeroSolicitud === solicitudActual) {
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
        pixelPerfectOverride = null;
        sincronizarControlesPresetUI();
        actualizarPixelPerfectUI();
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

