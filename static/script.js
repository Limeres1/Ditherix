"use strict";

const botonCargar = document.getElementById("botonCargar");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const mensaje = document.getElementById("mensaje");
const indicadorCarga = document.getElementById("cargando");


let imagenActual = null;
let solicitudActual = 0;
let controladorCarga = null;
let cancelarVistaPendiente = null;

function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    mensaje.classList.toggle("oculto", !texto);
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
    imagenActual = null;
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
        }
    }
});
