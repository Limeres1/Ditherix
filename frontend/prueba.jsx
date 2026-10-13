import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { createPortal } from "react-dom";
import * as THREE from "three";
import {
  Environment,
  MeshTransmissionMaterial,
  RoundedBox,
  Sphere,
} from "@react-three/drei";
import "./prueba.css";

function BarraDeVidrio({ borde }) {
  const { viewport } = useThree();
  const colorFondo = useMemo(() => new THREE.Color("#303b4a"), []);
  const altoPixeles = window.innerWidth <= 600 ? 62 : 72;
  const alto = (viewport.height * altoPixeles) / window.innerHeight;
  const y = borde === "superior"
    ? viewport.height / 2 - alto / 2
    : -viewport.height / 2 + alto / 2;

  return (
    <RoundedBox
      args={[viewport.width * 1.005, alto, 0.055]}
      radius={Math.min(alto * 0.14, 0.035)}
      smoothness={6}
      position={[0, y, 0.1]}
    >
      <MeshTransmissionMaterial
        color="#e4edff"
        background={colorFondo}
        metalness={0}
        roughness={0.01}
        ior={1.8}
        thickness={0.45}
        reflectivity={0.45}
        chromaticAberration={0.1}
        clearcoat={0.4}
        resolution={256}
        clearcoatRoughness={0.05}
        iridescence={0.9}
        iridescenceIOR={0.1}
        iridescenceThicknessRange={[0, 140]}
        samples={2}
      />
    </RoundedBox>
  );
}

function CursorLiquidGlass({ color }) {
  const cursorRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const { viewport, invalidate } = useThree();
  const colorFondo = useMemo(
    () => new THREE.Color(color).multiplyScalar(0.45),
    [color],
  );

  useEffect(() => {
    const actualizarPuntero = (event) => {
      if (event.pointerType === "touch") {
        return;
      }
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = 1 - (event.clientY / window.innerHeight) * 2;
      pointerRef.current.active = true;
      invalidate();
    };
    const ocultarPuntero = () => {
      pointerRef.current.active = false;
      invalidate();
    };

    window.addEventListener("pointermove", actualizarPuntero);
    window.addEventListener("pointerleave", ocultarPuntero);
    document.body.classList.add("liquid-cursor-active");

    return () => {
      window.removeEventListener("pointermove", actualizarPuntero);
      window.removeEventListener("pointerleave", ocultarPuntero);
      document.body.classList.remove("liquid-cursor-active");
    };
  }, [invalidate]);

  useFrame(() => {
    if (!cursorRef.current) {
      return;
    }
    const { x, y, active } = pointerRef.current;
    cursorRef.current.visible = active;
    if (active) {
      cursorRef.current.position.set(
        x * (viewport.width / 2),
        y * (viewport.height / 2),
        0.55,
      );
    }
  });

  return (
    <group ref={cursorRef} visible={false}>
      <Sphere args={[0.1, 64, 64]} scale={[0.5, 0.5, 0.12]}>
        <MeshTransmissionMaterial
          color={color}
          metalness={0}
          roughness={0.01}
          ior={1.8}
          thickness={0.45}
          transmission={1}
          background={colorFondo}
          chromaticAberration={0.18}
          distortion={0.18}
          distortionScale={0.35}
          temporalDistortion={0.08}
          clearcoat={0.4}
          resolution={256}
          clearcoatRoughness={0.05}
          iridescence={0.9}
          iridescenceIOR={0.1}
          iridescenceThicknessRange={[0, 140]}
          samples={2}
        />
      </Sphere>
    </group>
  );
}

function SelectorColor({ color, onChange }) {
  const [draft, setDraft] = useState(color);
  const valido = /^#[0-9a-fA-F]{6}$/.test(draft);

  useEffect(() => {
    setDraft(color);
  }, [color]);

  function actualizarBorrador(nextColor) {
    setDraft(nextColor);
    if (/^#[0-9a-fA-F]{6}$/.test(nextColor)) {
      onChange(nextColor.toUpperCase());
    }
  }

  return (
    <div className="liquid-color-field">
      <label htmlFor="liquid-cursor-hex">Color del cursor</label>
      <div className="liquid-color-inputs">
        <input
          aria-label="Elegir color del cursor"
          className="liquid-color-picker"
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          type="color"
          value={color}
        />
        <input
          aria-label="Código HEX del cursor"
          aria-invalid={!valido}
          className="liquid-hex-input"
          id="liquid-cursor-hex"
          maxLength={7}
          onBlur={() => {
            if (!valido) {
              setDraft(color);
            }
          }}
          onChange={(event) => actualizarBorrador(event.target.value)}
          pattern="#[0-9A-Fa-f]{6}"
          spellCheck="false"
          type="text"
          value={draft}
        />
      </div>
      {!valido && (
        <span className="liquid-color-error">Usá el formato #RRGGBB.</span>
      )}
    </div>
  );
}

export default function EfectoLiquidGlass() {
  const [colorCursor, setColorCursor] = useState("#808080");
  const cursorRoot = document.getElementById("liquid-cursor-root");

  return (
    <>
      <Canvas
        className="liquid-glass-scene"
        frameloop="demand"
        camera={{ near: 0.01, far: 1000, fov: 5, position: [0, 0, 25] }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
      >
        <Environment preset="warehouse" environmentIntensity={0.25} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[0.4, 1, -0.2]} intensity={8} />
        <BarraDeVidrio borde="superior" />
        <BarraDeVidrio borde="inferior" />
      </Canvas>
      {cursorRoot &&
        createPortal(
          <Canvas
            className="liquid-cursor-scene"
            frameloop="demand"
            camera={{ near: 0.01, far: 1000, fov: 5, position: [0, 0, 25] }}
            dpr={[1, 1.5]}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: "high-performance",
              stencil: false,
            }}
          >
            <Environment preset="warehouse" environmentIntensity={0.8} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[0.4, 1, 2]} intensity={3} />
            <CursorLiquidGlass color={colorCursor} />
          </Canvas>,
          cursorRoot,
        )}
      <aside className="liquid-color-options" aria-label="Opciones del cursor Liquid Glass">
        <h2>Cursor Liquid Glass</h2>
        <SelectorColor color={colorCursor} onChange={setColorCursor} />
      </aside>
    </>
  );
}
