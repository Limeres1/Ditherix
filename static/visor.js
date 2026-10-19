"user strict";

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

const btnToggleEdit = document.getElementById("btn-toggle-edit");
const btnCloseEdit = document.getElementById("btn-close-edit");
const editMenu = document.getElementById("edit-menu");

const btnToggleDetalle = document.getElementById("btn-toggle-detalle");
const btnCloseDetalle = document.getElementById("btn-close-detalle");
const detalleMenu = document.getElementById("detalle-menu");

function setEditMenuOpen(open) {
    if (open && typeof setDetalleMenuOpen === "function") {
        setDetalleMenuOpen(false);
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
        setEditMenuOpen(false);
    }
    if (detalleMenu && btnToggleDetalle) {
        detalleMenu.classList.toggle("hidden", !open);
        detalleMenu.setAttribute("aria-hidden", String(!open));
        btnToggleDetalle.setAttribute("aria-expanded", String(open));
        btnToggleDetalle.classList.toggle("active", open);
    }
}

if (btnToggleEdit) {
    btnToggleEdit.addEventListener("click", () => {
        setEditMenuOpen(editMenu.classList.contains("hidden"));
    });
}

if (btnCloseEdit) {
    btnCloseEdit.addEventListener("click", () => {
        setEditMenuOpen(false);
        btnToggleEdit.focus();
    });
}

if (btnToggleDetalle) {
    btnToggleDetalle.addEventListener("click", () => {
        setDetalleMenuOpen(detalleMenu.classList.contains("hidden"));
    });
}

if (btnCloseDetalle) {
    btnCloseDetalle.addEventListener("click", () => {
        setDetalleMenuOpen(false);
        btnToggleDetalle.focus();
    });
}

document.addEventListener("click", (event) => {
    if (editMenu && btnToggleEdit && !editMenu.contains(event.target) && !btnToggleEdit.contains(event.target)) {
        setEditMenuOpen(false);
    }
    if (detalleMenu && btnToggleDetalle && !detalleMenu.contains(event.target) && !btnToggleDetalle.contains(event.target)) {
        setDetalleMenuOpen(false);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (editMenu && !editMenu.classList.contains("hidden")) {
            setEditMenuOpen(false);
            btnToggleEdit.focus();
        }
        if (detalleMenu && !detalleMenu.classList.contains("hidden")) {
            setDetalleMenuOpen(false);
            btnToggleDetalle.focus();
        }
    }
});
