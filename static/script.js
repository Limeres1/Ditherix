"use strict";

const botonCargar = document.getElementById("botonCargar");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const mensaje = document.getElementById("mensaje");
const indicadorCarga = document.getElementById("cargando");
const brilloInput = document.getElementById("brilloInput");
const brilloValor = document.getElementById("brilloValor");
const botonBrillo = document.getElementById("botonBrillo");
const contrasteInput = document.getElementById("contrasteInput");
const contrasteValor = document.getElementById("contrasteValor");
const botonContraste = document.getElementById("botonContraste");
const saturacionInput = document.getElementById("saturacionInput");
const saturacionValor = document.getElementById("saturacionValor");
const botonSaturacion = document.getElementById("botonSaturacion");
const btnIniciarRecorte = document.getElementById("btn-iniciar-recorte");
const btnConfirmarRecorte = document.getElementById("btn-confirmar-recorte");
const btnCancelarRecorte = document.getElementById("btn-cancelar-recorte");
const cropOverlay = document.getElementById("cropOverlay");
const cropSelection = document.getElementById("cropSelection");
const contenedorVisor = document.getElementById("visor");
const escenarioImagen = document.getElementById("escenario");


let imagenActual = null;
let solicitudActual = 0;
let controladorCarga = null;
let cancelarVistaPendiente = null;
let modoRecorte = false;
let procesandoAccion = false;
let puntoInicioRecorte = null;
let puntoFinRecorte = null;
let punteroRecorte = null;

function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    mensaje.classList.toggle("oculto", !texto);
}

function mostrarValorSlider(valor) {
    const numero = Number(valor);
    return `${numero > 0 ? "+" : ""}${numero}%`;
}

function actualizarControlesEdicion() {
    const deshabilitados = !imagenActual || Boolean(controladorCarga) || procesandoAccion || modoRecorte;
    brilloInput.disabled = deshabilitados;
    botonBrillo.disabled = deshabilitados;
    contrasteInput.disabled = deshabilitados;
    botonContraste.disabled = deshabilitados;
    saturacionInput.disabled = deshabilitados;
    botonSaturacion.disabled = deshabilitados;
    btnIniciarRecorte.disabled = deshabilitados;
    btnConfirmarRecorte.disabled = !modoRecorte || !obtenerCoordenadasRecorte() || procesandoAccion;
    btnCancelarRecorte.disabled = !modoRecorte || procesandoAccion;
}

function establecerModoRecorte(activar) {
    modoRecorte = activar;
    puntoInicioRecorte = null;
    puntoFinRecorte = null;
    punteroRecorte = null;
    contenedorVisor.classList.toggle("modo-recorte", activar);
    cropOverlay.classList.toggle("oculto", !activar);
    cropSelection.classList.add("oculto");
    btnIniciarRecorte.classList.toggle("oculto", activar);
    btnConfirmarRecorte.classList.toggle("oculto", !activar);
    btnCancelarRecorte.classList.toggle("oculto", !activar);

    if (activar) {
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
    const escalaImagen = Math.max(
        anchoVista / preview.naturalWidth,
        altoVista / preview.naturalHeight,
    );
    const anchoRenderizado = preview.naturalWidth * escalaImagen;
    const altoRenderizado = preview.naturalHeight * escalaImagen;
    const desplazamientoX = (anchoVista - anchoRenderizado) / 2;
    const desplazamientoY = (altoVista - altoRenderizado) / 2;

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

imageInput.addEventListener("change", async () => {
    const archivo = imageInput.files[0];
    if (!archivo) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    procesandoAccion = false;
    establecerModoRecorte(false);
    imagenActual = null;
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
            return;
        }

        imagenActual = resultado.id;
        actualizarControlesEdicion();
        const vistaCargada = await esperarVista(resultado.url, numeroSolicitud);
        if (numeroSolicitud !== solicitudActual) {
            return;
        }
        if (!vistaCargada) {
            mostrarMensaje("No se pudo mostrar la imagen procesada. Inténtalo de nuevo.");
            return;
        }

        preview.classList.remove("oculto");
    } catch (error) {
        if (numeroSolicitud !== solicitudActual || error.name === "AbortError") {
            return;
        }
        if (error instanceof SyntaxError) {
            mostrarMensaje("El servidor devolvió una respuesta inesperada.");
        } else {
            mostrarMensaje("No se pudo conectar con el servidor. Comprueba que esté iniciado e inténtalo otra vez.");
        }
    } finally {
        if (numeroSolicitud === solicitudActual) {
            controladorCarga = null;
            indicadorCarga.classList.add("oculto");
            imageInput.value = "";
            actualizarControlesEdicion();
        }
    }
});

brilloInput.addEventListener("input", () => {
    brilloValor.value = mostrarValorSlider(brilloInput.value);
});

contrasteInput.addEventListener("input", () => {
    contrasteValor.value = mostrarValorSlider(contrasteInput.value);
});

saturacionInput.addEventListener("input", () => {
    saturacionValor.value = mostrarValorSlider(saturacionInput.value);
});

async function aplicarAjustes(nombreAjuste) {
    if (!imagenActual || procesandoAccion || modoRecorte) {
        return;
    }

    const numeroSolicitud = ++solicitudActual;
    const imagenId = imagenActual;
    procesandoAccion = true;
    actualizarControlesEdicion();
    indicadorCarga.textContent = `Aplicando ${nombreAjuste}…`;
    indicadorCarga.classList.remove("oculto");

    try {
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

botonBrillo.addEventListener("click", () => aplicarAjustes("brillo"));
botonContraste.addEventListener("click", () => aplicarAjustes("contraste"));
botonSaturacion.addEventListener("click", () => aplicarAjustes("saturación"));

btnIniciarRecorte.addEventListener("click", () => {
    if (!imagenActual || procesandoAccion) {
        return;
    }
    mostrarMensaje("");
    establecerModoRecorte(true);
});

btnCancelarRecorte.addEventListener("click", () => {
    establecerModoRecorte(false);
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

        preview.classList.remove("oculto");
        mostrarMensaje("");
        establecerModoRecorte(false);
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

actualizarControlesEdicion();