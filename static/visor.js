"use strict";

const visor = document.getElementById("visor");
const escenario = document.getElementById("escenario");
const menuImagen = document.getElementById("menuImagen");
const zoomHud = document.getElementById("zoomHud");
const btnZoomOut = document.getElementById("btnZoomOut");
const btnZoomReset = document.getElementById("btnZoomReset");
const btnZoomIn = document.getElementById("btnZoomIn");

const ESCALA_MIN = 0.2;
const ESCALA_MAX = 8;

let escala = 1;
let x = 0;
let y = 0;

function actualizarIndicadorZoom() {
    if (btnZoomReset) {
        btnZoomReset.textContent = `${Math.round(escala * 100)}%`;
    }
}

function aplicar() {
    escenario.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
    actualizarIndicadorZoom();
}

function reiniciarVista() {
    escala = 1;
    x = 0;
    y = 0;
    aplicar();
}
window.reiniciarVista = reiniciarVista;

function zoomDesdeCentro(factor) {
    if (visor.classList.contains("modo-recorte")) return;
    const caja = visor.getBoundingClientRect();
    const cx = caja.width / 2;
    const cy = caja.height / 2;
    const nueva = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escala * factor));
    const px = (cx - x) / escala;
    const py = (cy - y) / escala;
    x = cx - px * nueva;
    y = cy - py * nueva;
    escala = nueva;
    aplicar();
}

window.setZoomHudVisible = (visible) => {
    if (zoomHud) {
        zoomHud.classList.toggle("oculto", !visible);
    }
    actualizarIndicadorZoom();
};

if (btnZoomIn) {
    btnZoomIn.addEventListener("click", (e) => {
        e.stopPropagation();
        zoomDesdeCentro(1.25);
    });
}
if (btnZoomOut) {
    btnZoomOut.addEventListener("click", (e) => {
        e.stopPropagation();
        zoomDesdeCentro(1 / 1.25);
    });
}
if (btnZoomReset) {
    btnZoomReset.addEventListener("click", (e) => {
        e.stopPropagation();
        reiniciarVista();
    });
}

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

const btnToggleOptica = document.getElementById("btn-toggle-optica");
const btnCloseOptica = document.getElementById("btn-close-optica");
const opticaMenu = document.getElementById("optica-menu");

const PANELES_MENUS = [
    { key: "presets", menu: presetsMenu, toggle: btnTogglePresets, close: btnClosePresets },
    { key: "edit", menu: editMenu, toggle: btnToggleEdit, close: btnCloseEdit },
    { key: "detalle", menu: detalleMenu, toggle: btnToggleDetalle, close: btnCloseDetalle },
    { key: "dither", menu: ditherMenu, toggle: btnToggleDither, close: btnCloseDither },
    { key: "color", menu: colorMenu, toggle: btnToggleColor, close: btnCloseColor },
    { key: "byn", menu: bynMenu, toggle: btnToggleByn, close: btnCloseByn },
    { key: "marcos", menu: marcosMenu, toggle: btnToggleMarcos, close: btnCloseMarcos },
    { key: "optica", menu: opticaMenu, toggle: btnToggleOptica, close: btnCloseOptica },
];

function alternarPanel(targetKey, open) {
    for (const panel of PANELES_MENUS) {
        if (!panel.menu || !panel.toggle) continue;
        if (panel.key === targetKey) {
            panel.menu.classList.toggle("hidden", !open);
            panel.menu.setAttribute("aria-hidden", String(!open));
            panel.toggle.setAttribute("aria-expanded", String(open));
            panel.toggle.classList.toggle("active", open);
        } else if (open) {
            panel.menu.classList.add("hidden");
            panel.menu.setAttribute("aria-hidden", "true");
            panel.toggle.setAttribute("aria-expanded", "false");
            panel.toggle.classList.remove("active");
        }
    }
}

const setPresetsMenuOpen = (open) => alternarPanel("presets", open);
const setEditMenuOpen = (open) => alternarPanel("edit", open);
const setDetalleMenuOpen = (open) => alternarPanel("detalle", open);
const setDitherMenuOpen = (open) => alternarPanel("dither", open);
const setColorMenuOpen = (open) => alternarPanel("color", open);
const setBynMenuOpen = (open) => alternarPanel("byn", open);
const setMarcosMenuOpen = (open) => alternarPanel("marcos", open);
const setOpticaMenuOpen = (open) => alternarPanel("optica", open);

window.setPresetsMenuOpen = setPresetsMenuOpen;
window.setEditMenuOpen = setEditMenuOpen;
window.setDetalleMenuOpen = setDetalleMenuOpen;
window.setDitherMenuOpen = setDitherMenuOpen;
window.setColorMenuOpen = setColorMenuOpen;
window.setBynMenuOpen = setBynMenuOpen;
window.setMarcosMenuOpen = setMarcosMenuOpen;
window.setOpticaMenuOpen = setOpticaMenuOpen;

for (const panel of PANELES_MENUS) {
    if (panel.toggle && panel.menu) {
        panel.toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            alternarPanel(panel.key, panel.menu.classList.contains("hidden"));
        });
    }
    if (panel.close) {
        panel.close.addEventListener("click", (e) => {
            e.stopPropagation();
            alternarPanel(panel.key, false);
            if (panel.toggle) panel.toggle.focus();
        });
    }
    if (panel.menu) {
        panel.menu.addEventListener("click", (e) => e.stopPropagation());
    }
}

document.addEventListener("click", (event) => {
    for (const panel of PANELES_MENUS) {
        if (
            panel.menu &&
            !panel.menu.classList.contains("hidden") &&
            !panel.menu.contains(event.target) &&
            (!panel.toggle || !panel.toggle.contains(event.target))
        ) {
            alternarPanel(panel.key, false);
        }
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        for (const panel of PANELES_MENUS) {
            if (panel.menu && !panel.menu.classList.contains("hidden")) {
                alternarPanel(panel.key, false);
                if (panel.toggle) panel.toggle.focus();
            }
        }
        return;
    }

    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (!zoomHud || zoomHud.classList.contains("oculto")) return;

    if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomDesdeCentro(1.2);
    } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomDesdeCentro(1 / 1.2);
    } else if (event.key === "0") {
        event.preventDefault();
        reiniciarVista();
    }
});
