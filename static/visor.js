"use strict";

const visor = document.getElementById("visor");
const escenario = document.getElementById("escenario");
const menuImagen = document.getElementById("menuImagen");

const ESCALA_MIN = 0.2;
const ESCALA_MAX = 8;

let escala = 1;
let x = 0;
let y = 0;

function aplicar(){
    escenario.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
}

function reiniciarVista() {
    escala = 1;
    x = 0;
    y = 0;
    aplicar();
}
window.reiniciarVista = reiniciarVista;

["pointerdown", "wheel", "dblclick"].forEach((evento) => {
    menuImagen.addEventListener(evento, (e) => e.stopPropagation());
});


let arrastrando = false;
let inicioX, inicioY, xInicial, yInicial;

visor.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    arrastrando = true;
    inicioX = e.clientX;
    inicioY = e.clientY;
    xInicial = x;
    yInicial = y;
    visor.setPointerCapture(e.pointerId);
    visor.classList.add("arrastrando");
});

visor.addEventListener("pointermove", (e) => {
    if (!arrastrando) return;
    x = xInicial + (e.clientX - inicioX);
    y = yInicial + (e.clientY - inicioY);
    aplicar();
});

function soltar() {
    arrastrando = false;
    visor.classList.remove("arrastrando");
}
visor.addEventListener("pointerup", soltar);
visor.addEventListener("pointercancel", soltar);


visor.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (visor.classList.contains("modo-recorte")) return;

    const caja = visor.getBoundingClientRect();
    const mx = e.clientX - caja.left;
    const my = e.clientY - caja.top;

    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const nueva = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escala * factor));

    const px = (mx - x) / escala;
    const py = (my - y) / escala;

    x = mx - px * nueva;
    y = my - py * nueva;
    escala = nueva;
    aplicar();
}, { passive: false });

visor.addEventListener("dblclick", () => {
    if (!visor.classList.contains("modo-recorte")) {
        reiniciarVista();
    }
});

const btnTogglePresets = document.getElementById("btn-toggle-presets");
const btnClosePresets = document.getElementById("btn-close-presets");
const presetsMenu = document.getElementById("presets-menu");

const btnToggleEdit = document.getElementById("btn-toggle-edit");
const btnCloseEdit = document.getElementById("btn-close-edit");
const editMenu = document.getElementById("edit-menu");

const btnToggleDetalle = document.getElementById("btn-toggle-detalle");
const btnCloseDetalle = document.getElementById("btn-close-detalle");
const detalleMenu = document.getElementById("detalle-menu");

const btnToggleDither = document.getElementById("btn-toggle-dither");
const btnCloseDither = document.getElementById("btn-close-dither");
const ditherMenu = document.getElementById("dither-menu");

const btnToggleColor = document.getElementById("btn-toggle-color");
const btnCloseColor = document.getElementById("btn-close-color");
const colorMenu = document.getElementById("color-menu");

const btnToggleByn = document.getElementById("btn-toggle-byn");
const btnCloseByn = document.getElementById("btn-close-byn");
const bynMenu = document.getElementById("byn-menu");

const btnToggleMarcos = document.getElementById("btn-toggle-marcos");
const btnCloseMarcos = document.getElementById("btn-close-marcos");
const marcosMenu = document.getElementById("marcos-menu");

function setPresetsMenuOpen(open) {
    if (open) {
        if (typeof setEditMenuOpen === "function") setEditMenuOpen(false);
        if (typeof setDetalleMenuOpen === "function") setDetalleMenuOpen(false);
        if (typeof setDitherMenuOpen === "function") setDitherMenuOpen(false);
        if (typeof setColorMenuOpen === "function") setColorMenuOpen(false);
        if (typeof setBynMenuOpen === "function") setBynMenuOpen(false);
        if (typeof setMarcosMenuOpen === "function") setMarcosMenuOpen(false);
    }
    if (presetsMenu && btnTogglePresets) {
        presetsMenu.classList.toggle("hidden", !open);
        presetsMenu.setAttribute("aria-hidden", String(!open));
        btnTogglePresets.setAttribute("aria-expanded", String(open));
        btnTogglePresets.classList.toggle("active", open);
    }
}
window.setPresetsMenuOpen = setPresetsMenuOpen;

function setEditMenuOpen(open) {
    if (open) {
        if (typeof setPresetsMenuOpen === "function") setPresetsMenuOpen(false);
        if (typeof setDetalleMenuOpen === "function") setDetalleMenuOpen(false);
        if (typeof setDitherMenuOpen === "function") setDitherMenuOpen(false);
        if (typeof setColorMenuOpen === "function") setColorMenuOpen(false);
        if (typeof setBynMenuOpen === "function") setBynMenuOpen(false);
        if (typeof setMarcosMenuOpen === "function") setMarcosMenuOpen(false);
    }
    if (editMenu && btnToggleEdit) {
        editMenu.classList.toggle("hidden", !open);
        editMenu.setAttribute("aria-hidden", String(!open));
        btnToggleEdit.setAttribute("aria-expanded", String(open));
        btnToggleEdit.classList.toggle("active", open);
    }
}

function setDetalleMenuOpen(open) {
    if (open) {
        if (typeof setPresetsMenuOpen === "function") setPresetsMenuOpen(false);
        if (typeof setEditMenuOpen === "function") setEditMenuOpen(false);
        if (typeof setDitherMenuOpen === "function") setDitherMenuOpen(false);
        if (typeof setColorMenuOpen === "function") setColorMenuOpen(false);
        if (typeof setBynMenuOpen === "function") setBynMenuOpen(false);
        if (typeof setMarcosMenuOpen === "function") setMarcosMenuOpen(false);
    }
    if (detalleMenu && btnToggleDetalle) {
        detalleMenu.classList.toggle("hidden", !open);
        detalleMenu.setAttribute("aria-hidden", String(!open));
        btnToggleDetalle.setAttribute("aria-expanded", String(open));
        btnToggleDetalle.classList.toggle("active", open);
    }
}

function setDitherMenuOpen(open) {
    if (open) {
        if (typeof setPresetsMenuOpen === "function") setPresetsMenuOpen(false);
        if (typeof setEditMenuOpen === "function") setEditMenuOpen(false);
        if (typeof setDetalleMenuOpen === "function") setDetalleMenuOpen(false);
        if (typeof setColorMenuOpen === "function") setColorMenuOpen(false);
        if (typeof setBynMenuOpen === "function") setBynMenuOpen(false);
        if (typeof setMarcosMenuOpen === "function") setMarcosMenuOpen(false);
    }
    if (ditherMenu && btnToggleDither) {
        ditherMenu.classList.toggle("hidden", !open);
        ditherMenu.setAttribute("aria-hidden", String(!open));
        btnToggleDither.setAttribute("aria-expanded", String(open));
        btnToggleDither.classList.toggle("active", open);
    }
}

function setColorMenuOpen(open) {
    if (open) {
        if (typeof setPresetsMenuOpen === "function") setPresetsMenuOpen(false);
        if (typeof setEditMenuOpen === "function") setEditMenuOpen(false);
        if (typeof setDetalleMenuOpen === "function") setDetalleMenuOpen(false);
        if (typeof setDitherMenuOpen === "function") setDitherMenuOpen(false);
        if (typeof setBynMenuOpen === "function") setBynMenuOpen(false);
        if (typeof setMarcosMenuOpen === "function") setMarcosMenuOpen(false);
    }
    if (colorMenu && btnToggleColor) {
        colorMenu.classList.toggle("hidden", !open);
        colorMenu.setAttribute("aria-hidden", String(!open));
        btnToggleColor.setAttribute("aria-expanded", String(open));
        btnToggleColor.classList.toggle("active", open);
    }
}
window.setColorMenuOpen = setColorMenuOpen;

function setBynMenuOpen(open) {
    if (open) {
        if (typeof setPresetsMenuOpen === "function") setPresetsMenuOpen(false);
        if (typeof setEditMenuOpen === "function") setEditMenuOpen(false);
        if (typeof setDetalleMenuOpen === "function") setDetalleMenuOpen(false);
        if (typeof setDitherMenuOpen === "function") setDitherMenuOpen(false);
        if (typeof setColorMenuOpen === "function") setColorMenuOpen(false);
        if (typeof setMarcosMenuOpen === "function") setMarcosMenuOpen(false);
    }
    if (bynMenu && btnToggleByn) {
        bynMenu.classList.toggle("hidden", !open);
        bynMenu.setAttribute("aria-hidden", String(!open));
        btnToggleByn.setAttribute("aria-expanded", String(open));
        btnToggleByn.classList.toggle("active", open);
    }
}
window.setBynMenuOpen = setBynMenuOpen;

function setMarcosMenuOpen(open) {
    if (open) {
        if (typeof setPresetsMenuOpen === "function") setPresetsMenuOpen(false);
        if (typeof setEditMenuOpen === "function") setEditMenuOpen(false);
        if (typeof setDetalleMenuOpen === "function") setDetalleMenuOpen(false);
        if (typeof setDitherMenuOpen === "function") setDitherMenuOpen(false);
        if (typeof setColorMenuOpen === "function") setColorMenuOpen(false);
        if (typeof setBynMenuOpen === "function") setBynMenuOpen(false);
    }
    if (marcosMenu && btnToggleMarcos) {
        marcosMenu.classList.toggle("hidden", !open);
        marcosMenu.setAttribute("aria-hidden", String(!open));
        btnToggleMarcos.setAttribute("aria-expanded", String(open));
        btnToggleMarcos.classList.toggle("active", open);
    }
}
window.setMarcosMenuOpen = setMarcosMenuOpen;

if (btnTogglePresets) {
    btnTogglePresets.addEventListener("click", (e) => {
        e.stopPropagation();
        setPresetsMenuOpen(presetsMenu.classList.contains("hidden"));
    });
}

if (btnClosePresets) {
    btnClosePresets.addEventListener("click", (e) => {
        e.stopPropagation();
        setPresetsMenuOpen(false);
        btnTogglePresets.focus();
    });
}

if (btnToggleEdit) {
    btnToggleEdit.addEventListener("click", (e) => {
        e.stopPropagation();
        setEditMenuOpen(editMenu.classList.contains("hidden"));
    });
}

if (btnCloseEdit) {
    btnCloseEdit.addEventListener("click", (e) => {
        e.stopPropagation();
        setEditMenuOpen(false);
        btnToggleEdit.focus();
    });
}

if (btnToggleDetalle) {
    btnToggleDetalle.addEventListener("click", (e) => {
        e.stopPropagation();
        setDetalleMenuOpen(detalleMenu.classList.contains("hidden"));
    });
}

if (btnCloseDetalle) {
    btnCloseDetalle.addEventListener("click", (e) => {
        e.stopPropagation();
        setDetalleMenuOpen(false);
        btnToggleDetalle.focus();
    });
}

if (btnToggleDither) {
    btnToggleDither.addEventListener("click", (e) => {
        e.stopPropagation();
        setDitherMenuOpen(ditherMenu.classList.contains("hidden"));
    });
}

if (btnCloseDither) {
    btnCloseDither.addEventListener("click", (e) => {
        e.stopPropagation();
        setDitherMenuOpen(false);
        btnToggleDither.focus();
    });
}

if (btnToggleColor) {
    btnToggleColor.addEventListener("click", (e) => {
        e.stopPropagation();
        setColorMenuOpen(colorMenu.classList.contains("hidden"));
    });
}

if (btnCloseColor) {
    btnCloseColor.addEventListener("click", (e) => {
        e.stopPropagation();
        setColorMenuOpen(false);
        btnToggleColor.focus();
    });
}

if (btnToggleByn) {
    btnToggleByn.addEventListener("click", (e) => {
        e.stopPropagation();
        setBynMenuOpen(bynMenu.classList.contains("hidden"));
    });
}

if (btnCloseByn) {
    btnCloseByn.addEventListener("click", (e) => {
        e.stopPropagation();
        setBynMenuOpen(false);
        btnToggleByn.focus();
    });
}

if (btnToggleMarcos) {
    btnToggleMarcos.addEventListener("click", (e) => {
        e.stopPropagation();
        setMarcosMenuOpen(marcosMenu.classList.contains("hidden"));
    });
}

if (btnCloseMarcos) {
    btnCloseMarcos.addEventListener("click", (e) => {
        e.stopPropagation();
        setMarcosMenuOpen(false);
        btnToggleMarcos.focus();
    });
}

[presetsMenu, editMenu, detalleMenu, ditherMenu, colorMenu, bynMenu, marcosMenu].forEach((menu) => {
    if (menu) {
        menu.addEventListener("click", (e) => e.stopPropagation());
    }
});

document.addEventListener("click", (event) => {
    if (presetsMenu && !presetsMenu.classList.contains("hidden") && !presetsMenu.contains(event.target) && !btnTogglePresets.contains(event.target)) {
        setPresetsMenuOpen(false);
    }
    if (editMenu && !editMenu.classList.contains("hidden") && !editMenu.contains(event.target) && !btnToggleEdit.contains(event.target)) {
        setEditMenuOpen(false);
    }
    if (detalleMenu && !detalleMenu.classList.contains("hidden") && !detalleMenu.contains(event.target) && !btnToggleDetalle.contains(event.target)) {
        setDetalleMenuOpen(false);
    }
    if (ditherMenu && !ditherMenu.classList.contains("hidden") && !ditherMenu.contains(event.target) && !btnToggleDither.contains(event.target)) {
        setDitherMenuOpen(false);
    }
    if (colorMenu && !colorMenu.classList.contains("hidden") && !colorMenu.contains(event.target) && !btnToggleColor.contains(event.target)) {
        setColorMenuOpen(false);
    }
    if (bynMenu && !bynMenu.classList.contains("hidden") && !bynMenu.contains(event.target) && !btnToggleByn.contains(event.target)) {
        setBynMenuOpen(false);
    }
    if (marcosMenu && !marcosMenu.classList.contains("hidden") && !marcosMenu.contains(event.target) && !btnToggleMarcos.contains(event.target)) {
        setMarcosMenuOpen(false);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (presetsMenu && !presetsMenu.classList.contains("hidden")) {
            setPresetsMenuOpen(false);
            btnTogglePresets.focus();
        }
        if (editMenu && !editMenu.classList.contains("hidden")) {
            setEditMenuOpen(false);
            btnToggleEdit.focus();
        }
        if (detalleMenu && !detalleMenu.classList.contains("hidden")) {
            setDetalleMenuOpen(false);
            btnToggleDetalle.focus();
        }
        if (ditherMenu && !ditherMenu.classList.contains("hidden")) {
            setDitherMenuOpen(false);
            btnToggleDither.focus();
        }
        if (colorMenu && !colorMenu.classList.contains("hidden")) {
            setColorMenuOpen(false);
            btnToggleColor.focus();
        }
        if (bynMenu && !bynMenu.classList.contains("hidden")) {
            setBynMenuOpen(false);
            btnToggleByn.focus();
        }
        if (marcosMenu && !marcosMenu.classList.contains("hidden")) {
            setMarcosMenuOpen(false);
            btnToggleMarcos.focus();
        }
    }
});
