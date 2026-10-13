import React from "react";
import { createRoot } from "react-dom/client";
import EfectoLiquidGlass from "./prueba.jsx";
import "./prueba.css";

const root = document.getElementById("liquid-glass-root");

if (!root) {
  throw new Error("No se encontró el contenedor del efecto Liquid Glass.");
}

createRoot(root).render(
  <React.StrictMode>
    <EfectoLiquidGlass />
  </React.StrictMode>,
);
