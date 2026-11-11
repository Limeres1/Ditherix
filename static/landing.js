/**
 * DITHERIX - Landing Page Interactive Core
 * Fondo líquido blanco animado (WebGL Shader) + Preloader 000% -> 100% + Scroll Horizontal 60 FPS
 * + Sound Design táctil procedural Web Audio (siempre activo)
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.removeAttribute("data-theme");
    initLiquidBackground();
    initTactileAudio();
    initCinemaLoader();
    initSplitComparator();
    initHorizontalScroll();
    initHudClock();
    initGlitchWaveform();
});

/* ========================================================================= */
/* 1. CINEMA PRELOADER (000% -> 100% CON CORTINAS TEATRALES)                */
/* ========================================================================= */
function initCinemaLoader() {
    const loader = document.getElementById("cinemaLoader");
    const numEl = document.getElementById("loaderNumber");
    const fillEl = document.getElementById("loaderFill");
    const statusEl = document.getElementById("loaderStatusText");
    const skipBtn = document.getElementById("loaderSkipBtn");

    if (!loader || !numEl) return;

    let isFinished = false;
    const duration = 1450; // milisegundos totales de carga
    const startTime = performance.now();

    const statusMilestones = [
        { pct: 0, text: "INICIALIZANDO MOTOR DITHERIX..." },
        { pct: 22, text: "CALIBRANDO MATRICES BAYER & FLOYD..." },
        { pct: 50, text: "CARGANDO VIRADOS QUÍMICOS Y CURVAS S..." },
        { pct: 75, text: "SINCRONIZANDO TEXTURAS 35MM Y MARCOS..." },
        { pct: 95, text: "SISTEMA CALIBRADO // ACCESO AUTORIZADO" }
    ];

    function finishLoader() {
        if (isFinished) return;
        isFinished = true;

        numEl.textContent = "100";
        if (fillEl) fillEl.style.width = "100%";
        if (statusEl) statusEl.textContent = "SISTEMA CALIBRADO // ACCESO AUTORIZADO";

        loader.classList.add("is-complete");
        document.body.classList.add("page-ready");

        if (window.DitherixAudio) {
            window.DitherixAudio.playShutter();
        }

        setTimeout(() => {
            loader.style.display = "none";
        }, 750);
    }

    function updateLoader(now) {
        if (isFinished) return;

        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        let eased;
        if (progress < 0.65) {
            eased = (progress / 0.65) * 0.72;
        } else if (progress < 0.88) {
            eased = 0.72 + ((progress - 0.65) / 0.23) * 0.18;
        } else {
            eased = 0.90 + ((progress - 0.88) / 0.12) * 0.10;
        }

        const currentVal = Math.min(100, Math.floor(eased * 100));

        numEl.textContent = String(currentVal).padStart(3, "0");
        if (fillEl) fillEl.style.width = `${currentVal}%`;

        if (statusEl) {
            for (let i = statusMilestones.length - 1; i >= 0; i--) {
                if (currentVal >= statusMilestones[i].pct) {
                    statusEl.textContent = statusMilestones[i].text;
                    break;
                }
            }
        }

        if (progress < 1) {
            requestAnimationFrame(updateLoader);
        } else {
            setTimeout(finishLoader, 140);
        }
    }

    if (skipBtn) {
        skipBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            finishLoader();
        });
    }

    loader.addEventListener("click", () => {
        finishLoader();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !isFinished) {
            finishLoader();
        }
    });

    setTimeout(finishLoader, 2800);

    requestAnimationFrame(updateLoader);
}

/* ========================================================================= */
/* 2. HORIZONTAL SCROLL + PARALLAX EN PROFUNDIDAD (Opción 4)                 */
/* ========================================================================= */
function initHorizontalScroll() {
    const container = document.getElementById("horizontalGallery");
    const track = document.getElementById("hTrack");
    const progressBar = document.getElementById("hProgressBar");
    const activeNum = document.getElementById("hActiveNum");
    const navPills = Array.from(document.querySelectorAll(".h-pill"));
    const prevBtn = document.getElementById("hNavPrev");
    const nextBtn = document.getElementById("hNavNext");
    const heroTrigger = document.querySelector(".h-next-trigger");

    if (!container || !track) return;

    const slides = Array.from(track.querySelectorAll(".h-slide"));
    const totalSlides = slides.length;
    if (totalSlides === 0) return;

    let targetProgress = 0;
    let currentProgress = 0;
    let maxTranslate = 0;
    let containerTop = 0;
    let containerHeight = 0;
    let isTicking = false;
    let lastActiveIndex = 0;
    let isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function recalculate() {
        if (isReducedMotion) return;
        const rect = container.getBoundingClientRect();
        containerTop = rect.top + window.scrollY;
        containerHeight = container.offsetHeight;
        maxTranslate = Math.max(0, track.scrollWidth - window.innerWidth);
    }

    recalculate();

    window.addEventListener("resize", () => {
        isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        recalculate();
        onScroll();
    }, { passive: true });

    window.addEventListener("load", recalculate);
    track.querySelectorAll("img").forEach(img => {
        if (img.complete) return;
        img.addEventListener("load", recalculate);
    });

    function onScroll() {
        if (isReducedMotion) return;

        const scrollY = window.scrollY;
        const scrollDistance = containerHeight - window.innerHeight;
        if (scrollDistance <= 0) return;

        const relativeY = scrollY - containerTop;
        targetProgress = Math.max(0, Math.min(1, relativeY / scrollDistance));

        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(renderLoop);
        }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    function renderLoop() {
        if (isReducedMotion) {
            isTicking = false;
            return;
        }

        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) > 0.0004) {
            currentProgress += diff * 0.088;
            isTicking = true;
            requestAnimationFrame(renderLoop);
        } else {
            currentProgress = targetProgress;
            isTicking = false;
        }

        const translateX = currentProgress * maxTranslate;
        track.style.transform = `translate3d(-${translateX.toFixed(2)}px, 0, 0)`;

        if (progressBar) {
            progressBar.style.width = `${(currentProgress * 100).toFixed(1)}%`;
        }

        // Determinar diapositiva activa
        const activeIndex = Math.min(
            totalSlides - 1,
            Math.max(0, Math.round(currentProgress * (totalSlides - 1)))
        );

        if (activeNum) {
            activeNum.textContent = String(activeIndex + 1).padStart(2, "0");
        }

        navPills.forEach((pill, idx) => {
            pill.classList.toggle("active", idx === activeIndex);
        });

        // Opción 7: Emitir sonido sutil de paso de diapositiva
        if (activeIndex !== lastActiveIndex) {
            lastActiveIndex = activeIndex;
            if (window.DitherixAudio) {
                window.DitherixAudio.playTick();
            }
        }

        // =====================================================================
        // OPCIÓN 4: PARALLAX INTERNO EN LAS IMÁGENES SEGÚN EL SCROLL
        // =====================================================================
        const viewportCenter = window.innerWidth / 2;
        slides.forEach((slide) => {
            if (slide.classList.contains("h-slide--hero") || slide.id === "comparador") return;
            const rect = slide.getBoundingClientRect();
            // Solo calcular si está cerca o dentro del viewport visible
            if (rect.right >= -100 && rect.left <= window.innerWidth + 100) {
                const slideCenter = rect.left + rect.width / 2;
                const offset = (slideCenter - viewportCenter) / (window.innerWidth / 2);
                const img = slide.querySelector(".slide-img");
                if (img) {
                    const parallaxX = -offset * 38;
                    img.style.transform = `scale(1.14) translate3d(${parallaxX.toFixed(1)}px, 0, 0)`;
                }
            }
        });
    }

    // =====================================================================
    // OPCIÓN 4: TILT 3D PERSPECTIVA SUTIL AL MOVER EL MOUSE SOBRE LA TARJETA
    // =====================================================================
    slides.forEach((slide) => {
        const card = slide.querySelector(".slide-card");
        if (!card) return;

        card.addEventListener("mousemove", (e) => {
            if (isReducedMotion) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(1000px) rotateY(${(x * 5).toFixed(2)}deg) rotateX(${(-y * 5).toFixed(2)}deg)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
    });

    function scrollToSlide(slideIdx) {
        if (isReducedMotion) {
            if (slides[slideIdx]) {
                slides[slideIdx].scrollIntoView({ behavior: "smooth" });
            }
            return;
        }

        const scrollDistance = containerHeight - window.innerHeight;
        if (scrollDistance <= 0) return;

        const targetY = containerTop + (slideIdx / (totalSlides - 1)) * scrollDistance;
        window.scrollTo({
            top: targetY,
            behavior: "smooth"
        });
    }

    navPills.forEach((pill) => {
        pill.addEventListener("click", () => {
            const slideIdx = parseInt(pill.getAttribute("data-slide"), 10);
            if (!isNaN(slideIdx)) {
                scrollToSlide(slideIdx);
            }
        });
    });

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            const currentIdx = Math.round(currentProgress * (totalSlides - 1));
            const prevIdx = Math.max(0, currentIdx - 1);
            scrollToSlide(prevIdx);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const currentIdx = Math.round(currentProgress * (totalSlides - 1));
            const nextIdx = Math.min(totalSlides - 1, currentIdx + 1);
            scrollToSlide(nextIdx);
        });
    }

    if (heroTrigger) {
        heroTrigger.addEventListener("click", () => {
            scrollToSlide(1);
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

        const rect = container.getBoundingClientRect();
        const isInViewport = rect.top <= window.innerHeight && rect.bottom >= 0;
        if (!isInViewport) return;

        if (e.key === "ArrowRight") {
            const currentIdx = Math.round(currentProgress * (totalSlides - 1));
            const nextIdx = Math.min(totalSlides - 1, currentIdx + 1);
            scrollToSlide(nextIdx);
        } else if (e.key === "ArrowLeft") {
            const currentIdx = Math.round(currentProgress * (totalSlides - 1));
            const prevIdx = Math.max(0, currentIdx - 1);
            scrollToSlide(prevIdx);
        }
    });

    onScroll();
}

/* ========================================================================= */
/* 5. SOUND DESIGN TÁCTIL PROCEDURAL WEB AUDIO (SIEMPRE ACTIVO)              */
/* ========================================================================= */
function initTactileAudio() {
    const isAudioEnabled = true;
    let audioCtx = null;
    const unlockEvents = ["pointerdown", "keydown", "touchstart", "click"];

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        return audioCtx;
    }

    function unlockAudio() {
        const ctx = getAudioContext();
        if (!ctx) return;

        if (ctx.state === "suspended") {
            ctx.resume().then(() => {
                if (ctx.state === "running") {
                    unlockEvents.forEach((evt) => {
                        window.removeEventListener(evt, unlockAudio, { capture: true });
                    });
                }
            }).catch(() => {});
        } else if (ctx.state === "running") {
            unlockEvents.forEach((evt) => {
                window.removeEventListener(evt, unlockAudio, { capture: true });
            });
        }
    }

    // Auto-desbloquear Web Audio en el primer gesto válido del usuario
    unlockEvents.forEach((evt) => {
        window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
    });

    // Sonido seco y mecánico de obturador de cámara analógica (35mm SLR)
    function playShutter() {
        if (!isAudioEnabled) return;
        const ctx = getAudioContext();
        if (!ctx || ctx.state !== "running") return;

        const now = ctx.currentTime;

        // 1. Ráfaga de ruido blanco modelada (arrastre de cortina)
        const bufferSize = Math.floor(ctx.sampleRate * 0.045);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1900, now);
        filter.Q.setValueAtTime(3.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + 0.045);

        // 2. Golpe de subgraves mecánicos (espejo réflex)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

        oscGain.gain.setValueAtTime(0.22, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Tic agudo y cristalino al cambiar de diapositiva
    function playTick() {
        if (!isAudioEnabled) return;
        const ctx = getAudioContext();
        if (!ctx || ctx.state !== "running") return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.015);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.015);
    }

    // Tono sutil al alternar botones
    function playSwitch() {
        if (!isAudioEnabled) return;
        const ctx = getAudioContext();
        if (!ctx || ctx.state !== "running") return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(980, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.03);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.035);
    }

    window.DitherixAudio = {
        playShutter,
        playTick,
        playSwitch
    };

    document.querySelectorAll(".btn--primary").forEach(btn => {
        btn.addEventListener("click", () => {
            playShutter();
        });
    });
}

/* ========================================================================= */
/* 6. RELOJ DE SISTEMA HUD EN TIEMPO REAL                                    */
/* ========================================================================= */
function initHudClock() {
    const dayEl = document.getElementById("hudDay");
    const monthEl = document.getElementById("hudMonth");
    const yearEl = document.getElementById("hudYear");
    const timeEl = document.getElementById("hudTime");

    if (!timeEl) return;

    function updateClock() {
        const now = new Date();

        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();

        let hours = now.getHours();
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = String(hours).padStart(2, "0");

        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const millis = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0");

        if (dayEl) dayEl.textContent = day;
        if (monthEl) monthEl.textContent = month;
        if (yearEl) yearEl.textContent = year;

        timeEl.textContent = `${hoursStr}:${minutes}:${seconds}:${millis} ${ampm}`;
    }

    updateClock();
    setInterval(updateClock, 33);
}

/* ========================================================================= */
/* 7. MATRIZ DE FRECUENCIA / SOUNDWAVE VISUALIZER (CANVAS)                  */
/* ========================================================================= */
function initGlitchWaveform() {
    const canvas = document.getElementById("waveformCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let mouseX = -1000;
    let width = canvas.width;
    let height = canvas.height;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0) {
            canvas.width = rect.width * (window.devicePixelRatio || 1);
            canvas.height = rect.height * (window.devicePixelRatio || 1);
            width = canvas.width;
            height = canvas.height;
        }
    }

    window.addEventListener("resize", resize);
    resize();

    window.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.top <= e.clientY && e.clientY <= rect.bottom) {
            mouseX = (e.clientX - rect.left) * (window.devicePixelRatio || 1);
        } else {
            mouseX = -1000;
        }
    });

    let time = 0;

    function draw() {
        time += 0.04;
        ctx.clearRect(0, 0, width, height);

        const dpr = window.devicePixelRatio || 1;
        const totalBars = Math.floor(width / (4 * dpr));
        const barWidth = 2 * dpr;
        const spacing = 4 * dpr;
        const centerY = height / 2;

        for (let i = 0; i < totalBars; i++) {
            const x = i * spacing;
            const normX = i / totalBars;

            const wave1 = Math.sin(normX * 14 + time * 1.5);
            const wave2 = Math.cos(normX * 32 - time * 2.2);
            const wave3 = Math.sin(normX * 64 + time * 0.8);
            const noise = (Math.sin(i * 99 + time * 10) > 0.88) ? 0.7 : 0.15;

            let amplitude = (Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) + noise);

            const distToMouse = Math.abs(x - mouseX);
            if (distToMouse < 180 * dpr) {
                const mouseFactor = 1 - (distToMouse / (180 * dpr));
                amplitude += mouseFactor * 0.8 * (Math.random() * 0.5 + 0.5);
            }

            amplitude = Math.min(amplitude, 1.0);
            const barHeight = Math.max(4, amplitude * (height * 0.85));
            const topY = centerY - barHeight / 2;

            if (i % 7 === 0) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.92)";
            } else if (amplitude > 0.6) {
                ctx.fillStyle = "rgba(25, 25, 30, 0.72)";
            } else {
                ctx.fillStyle = "rgba(130, 130, 145, 0.30)";
            }

            ctx.fillRect(x, topY, barWidth, barHeight);

            if (barHeight > height * 0.65) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.90)";
                ctx.fillRect(x - 1, topY - 3, barWidth + 2, 2);
                ctx.fillRect(x - 1, topY + barHeight + 1, barWidth + 2, 2);
            }
        }

        requestAnimationFrame(draw);
    }

    draw();
}

/* ========================================================================= */
/* 8. COMPARADOR INTERACTIVO ANTES / DESPUÉS (SPLIT SLIDER)                 */
/* ========================================================================= */
function initSplitComparator() {
    const viewport = document.getElementById("splitViewport");
    const handle = document.getElementById("splitHandle");
    const canvas = document.getElementById("splitCanvas");
    const beforeImg = document.getElementById("splitImgBefore");
    const modeButtons = document.querySelectorAll(".split-mode-btn");
    const activeModeText = document.getElementById("splitActiveModeText");
    const latencyVal = document.getElementById("splitLatencyVal");

    if (!viewport || !canvas || !beforeImg) return;

    let currentSplit = 50;
    let isDragging = false;
    let activeMode = "floyd";
    let cachedSourceData = null;

    // 1. Control de arrastre del tirador (Mouse y Touch unificado con Pointer Events)
    function updateSplit(clientX) {
        const rect = viewport.getBoundingClientRect();
        if (rect.width <= 0) return;
        const relativeX = clientX - rect.left;
        const pct = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
        currentSplit = pct;
        viewport.style.setProperty("--split-pos", `${pct.toFixed(2)}%`);
        if (handle) {
            handle.setAttribute("aria-valuenow", Math.round(pct));
        }
    }

    viewport.addEventListener("pointerdown", (e) => {
        isDragging = true;
        try {
            viewport.setPointerCapture(e.pointerId);
        } catch (_) {}
        if (handle) handle.classList.add("is-dragging");
        updateSplit(e.clientX);
    });

    viewport.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        updateSplit(e.clientX);
    });

    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        try {
            viewport.releasePointerCapture(e.pointerId);
        } catch (_) {}
        if (handle) handle.classList.remove("is-dragging");
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    // Accesibilidad por teclado (Flechas ← y →)
    if (handle) {
        handle.setAttribute("tabindex", "0");
        handle.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                currentSplit = Math.max(0, currentSplit - 5);
                viewport.style.setProperty("--split-pos", `${currentSplit}%`);
                handle.setAttribute("aria-valuenow", Math.round(currentSplit));
            } else if (e.key === "ArrowRight") {
                currentSplit = Math.min(100, currentSplit + 5);
                viewport.style.setProperty("--split-pos", `${currentSplit}%`);
                handle.setAttribute("aria-valuenow", Math.round(currentSplit));
            }
        });
    }

    // 2. Motor de síntesis de Dithering auténtico en tiempo real (Canvas GPU)
    const bayer8 = [
        [ 0, 32,  8, 40,  2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44,  4, 36, 14, 46,  6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [ 3, 35, 11, 43,  1, 33,  9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47,  7, 39, 13, 45,  5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21]
    ];

    function renderDither() {
        if (!beforeImg.complete || beforeImg.naturalWidth === 0) {
            beforeImg.addEventListener("load", renderDither, { once: true });
            return;
        }

        const t0 = performance.now();

        // Resolución de cálculo óptima para rendimiento ultra fluido a 60 FPS
        const maxWidth = 900;
        const scale = Math.min(1, maxWidth / beforeImg.naturalWidth);
        const w = Math.round(beforeImg.naturalWidth * scale);
        const h = Math.round(beforeImg.naturalHeight * scale);

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        // Buffer de origen
        if (!cachedSourceData || cachedSourceData.width !== w || cachedSourceData.height !== h) {
            ctx.drawImage(beforeImg, 0, 0, w, h);
            cachedSourceData = ctx.getImageData(0, 0, w, h);
        }

        const srcData = cachedSourceData.data;
        const outImg = ctx.createImageData(w, h);
        const outData = outImg.data;

        // Conversión a escala de grises con luminancia Rec. 709 y curva de contraste analógica
        const gray = new Float32Array(w * h);
        for (let i = 0, j = 0; i < srcData.length; i += 4, j++) {
            const r = srcData[i];
            const g = srcData[i + 1];
            const b = srcData[i + 2];
            let y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            y = ((y / 255 - 0.5) * 1.25 + 0.5) * 255;
            gray[j] = Math.max(0, Math.min(255, y));
        }

        if (activeMode === "bayer") {
            // Matriz Ordenada Bayer 8x8 (CRT Phosphor)
            for (let y = 0; y < h; y++) {
                const bayerRow = bayer8[y % 8];
                const rowOffset = y * w;
                for (let x = 0; x < w; x++) {
                    const idx = rowOffset + x;
                    const threshold = (bayerRow[x % 8] / 64) * 255;
                    const val = gray[idx] > threshold ? 255 : 0;
                    const p = idx * 4;
                    outData[p] = val;
                    outData[p + 1] = val;
                    outData[p + 2] = val;
                    outData[p + 3] = 255;
                }
            }
        } else if (activeMode === "atkinson") {
            // Difusión de error Atkinson 1984 (MacPaint 3/4)
            for (let y = 0; y < h; y++) {
                const row = y * w;
                for (let x = 0; x < w; x++) {
                    const idx = row + x;
                    const oldPixel = gray[idx];
                    const newPixel = oldPixel > 127 ? 255 : 0;
                    const error = Math.floor((oldPixel - newPixel) / 8);

                    const p = idx * 4;
                    outData[p] = newPixel;
                    outData[p + 1] = newPixel;
                    outData[p + 2] = newPixel;
                    outData[p + 3] = 255;

                    if (x + 1 < w) gray[idx + 1] += error;
                    if (x + 2 < w) gray[idx + 2] += error;
                    if (y + 1 < h) {
                        if (x - 1 >= 0) gray[idx + w - 1] += error;
                        gray[idx + w] += error;
                        if (x + 1 < w) gray[idx + w + 1] += error;
                    }
                    if (y + 2 < h) {
                        gray[idx + w * 2] += error;
                    }
                }
            }
        } else if (activeMode === "haluro" || activeMode === "cyanotype") {
            // Haluro de Plata 1930 (Difusión analógica pura en blanco y negro)
            for (let y = 0; y < h; y++) {
                const row = y * w;
                for (let x = 0; x < w; x++) {
                    const idx = row + x;
                    const oldPixel = gray[idx];
                    const isHigh = oldPixel > 115;
                    const newPixel = isHigh ? 255 : 0;
                    const error = oldPixel - newPixel;

                    const p = idx * 4;
                    outData[p] = newPixel;
                    outData[p + 1] = newPixel;
                    outData[p + 2] = newPixel;
                    outData[p + 3] = 255;

                    if (x + 1 < w) gray[idx + 1] += (error * 7) >> 4;
                    if (y + 1 < h) {
                        if (x - 1 >= 0) gray[idx + w - 1] += (error * 3) >> 4;
                        gray[idx + w] += (error * 5) >> 4;
                        if (x + 1 < w) gray[idx + w + 1] += (error * 1) >> 4;
                    }
                }
            }
        } else {
            // Floyd-Steinberg estándar ponderado
            for (let y = 0; y < h; y++) {
                const row = y * w;
                for (let x = 0; x < w; x++) {
                    const idx = row + x;
                    const oldPixel = gray[idx];
                    const newPixel = oldPixel > 127 ? 255 : 0;
                    const error = oldPixel - newPixel;

                    const p = idx * 4;
                    outData[p] = newPixel;
                    outData[p + 1] = newPixel;
                    outData[p + 2] = newPixel;
                    outData[p + 3] = 255;

                    if (x + 1 < w) gray[idx + 1] += (error * 7) >> 4;
                    if (y + 1 < h) {
                        if (x - 1 >= 0) gray[idx + w - 1] += (error * 3) >> 4;
                        gray[idx + w] += (error * 5) >> 4;
                        if (x + 1 < w) gray[idx + w + 1] += (error * 1) >> 4;
                    }
                }
            }
        }

        ctx.putImageData(outImg, 0, 0);

        const elapsed = performance.now() - t0;
        if (latencyVal) {
            latencyVal.textContent = `< ${Math.max(4, Math.round(elapsed))} ms`;
        }
    }

    // 3. Selección interactiva de algoritmo
    const modeNames = {
        floyd: "DITHERIX // FLOYD-STEINBERG",
        atkinson: "DITHERIX // ATKINSON 1984",
        bayer: "DITHERIX // BAYER 8×8 CRT",
        haluro: "DITHERIX // HALURO DE PLATA 1930",
        cyanotype: "DITHERIX // HALURO DE PLATA 1930"
    };

    modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const mode = btn.getAttribute("data-mode");
            if (!mode || mode === activeMode) return;

            activeMode = mode;
            modeButtons.forEach(b => b.classList.toggle("active", b === btn));

            if (activeModeText && modeNames[mode]) {
                activeModeText.textContent = modeNames[mode];
            }

            renderDither();

            if (window.DitherixAudio) {
                window.DitherixAudio.playTick();
            }
        });
    });

    if (beforeImg.complete) {
        renderDither();
    } else {
        beforeImg.addEventListener("load", renderDither);
    }
}

/* ========================================================================= */
/* 9. LIQUID BACKGROUND WEBGL (ESTILO MAXIMILIAN KASPAR - WHITE SILK FLUID)  */
/* ========================================================================= */
function initLiquidBackground() {
    const canvas = document.getElementById("liquidCanvas");
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: "high-performance"
    }) || canvas.getContext("experimental-webgl");

    if (!gl) {
        initCanvas2DFallback(canvas);
        return;
    }

    const vsSource = `
        attribute vec2 a_pos;
        void main() {
            gl_Position = vec4(a_pos, 0.0, 1.0);
        }
    `;

    const fsSource = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform vec2 u_mouse_vel;
        uniform float u_mouse_energy;
        uniform float u_time;
        uniform float u_scroll;

        vec2 hash2(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        float gradNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                    dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                    dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
                u.y
            );
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.55;
            mat2 rot = mat2(0.87758, 0.47942, -0.47942, 0.87758);
            for (int i = 0; i < 3; i++) {
                v += a * gradNoise(p);
                p = rot * p * 1.95 + vec2(11.3, 4.7);
                a *= 0.5;
            }
            return v;
        }

        float liquidHeight(vec2 p) {
            float t = u_time * 0.24;
            vec2 scaledP = p * 0.78;

            vec2 mDiff = p - u_mouse;
            float mDist = length(mDiff);
            float mLens = exp(-mDist * 2.2) * 0.09;
            float mRipple = exp(-mDist * 2.8) * sin(mDist * 14.0 - u_time * 4.5) * 0.22 * u_mouse_energy;
            vec2 mPush = normalize(mDiff + vec2(0.0001)) * exp(-mDist * 2.4) * length(u_mouse_vel) * 0.55;

            vec2 pMod = scaledP + mPush;

            vec2 q = vec2(
                fbm(pMod + vec2(t * 0.32, t * 0.20)),
                fbm(pMod + vec2(5.2, 1.3) + vec2(-t * 0.24, t * 0.28))
            );

            vec2 r = vec2(
                fbm(pMod + 2.4 * q + vec2(1.7, 9.2) + vec2(t * 0.14, -t * 0.16)),
                fbm(pMod + 2.4 * q + vec2(8.3, 2.8) + vec2(-t * 0.11, t * 0.18))
            );

            float h = fbm(pMod + 2.2 * r + vec2(u_scroll * 1.6, 0.0));
            h += mRipple - mLens;
            return h;
        }

        void main() {
            vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

            float eps = 0.012;
            float hCenter = liquidHeight(p);
            float hRight  = liquidHeight(p + vec2(eps, 0.0));
            float hUp     = liquidHeight(p + vec2(0.0, eps));

            vec3 normal = normalize(vec3(-(hRight - hCenter) / eps, -(hUp - hCenter) / eps, 1.45));

            vec3 lightDir = normalize(vec3(-0.42, 0.68, 0.85));
            float diff = dot(normal, lightDir);

            vec3 paperWhite = vec3(1.0, 1.0, 1.0);
            vec3 foldShadow = vec3(0.90, 0.91, 0.94);
            vec3 deepCrease = vec3(0.83, 0.84, 0.88);

            float shadowFactor = smoothstep(-0.35, 0.78, diff);
            vec3 surfaceCol = mix(deepCrease, paperWhite, shadowFactor);
            surfaceCol = mix(foldShadow, surfaceCol, smoothstep(-0.15, 0.65, hCenter + 0.45));

            vec3 viewDir = vec3(0.0, 0.0, 1.0);
            vec3 halfVec = normalize(lightDir + viewDir);
            float spec = pow(max(dot(normal, halfVec), 0.0), 22.0) * 0.12;
            surfaceCol += vec3(spec);

            float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.014;
            surfaceCol += grain;

            surfaceCol = clamp(surfaceCol, 0.0, 1.0);
            gl_FragColor = vec4(surfaceCol, 1.0);
        }
    `;

    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn("Shader error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
        initCanvas2DFallback(canvas);
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("Program link error:", gl.getProgramInfoLog(program));
        initCanvas2DFallback(canvas);
        return;
    }

    gl.useProgram(program);

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0
        ]),
        gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uResLoc   = gl.getUniformLocation(program, "u_resolution");
    const uMouseLoc = gl.getUniformLocation(program, "u_mouse");
    const uMVelLoc  = gl.getUniformLocation(program, "u_mouse_vel");
    const uMEnrLoc  = gl.getUniformLocation(program, "u_mouse_energy");
    const uTimeLoc  = gl.getUniformLocation(program, "u_time");
    const uScrlLoc  = gl.getUniformLocation(program, "u_scroll");

    let mouseTargetX = 0;
    let mouseTargetY = 0;
    let mouseCurrentX = 0;
    let mouseCurrentY = 0;
    let mouseVelX = 0;
    let mouseVelY = 0;
    let mouseEnergy = 0;
    let scrollProgress = 0;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = Math.floor(window.innerWidth * dpr);
        const h = Math.floor(window.innerHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
            gl.uniform2f(uResLoc, w, h);
        }
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();

    function updatePointer(clientX, clientY) {
        const minDim = Math.min(window.innerWidth, window.innerHeight);
        mouseTargetX = (clientX * 2.0 - window.innerWidth) / minDim;
        mouseTargetY = -((clientY * 2.0 - window.innerHeight) / minDim);
        mouseEnergy = Math.min(1.0, mouseEnergy + 0.35);
    }

    window.addEventListener("mousemove", (e) => {
        updatePointer(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches.length > 0) {
            updatePointer(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    window.addEventListener("scroll", () => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scrollProgress = window.scrollY / maxScroll;
    }, { passive: true });

    const startTime = performance.now();
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function renderFrame(elapsed) {
        const prevX = mouseCurrentX;
        const prevY = mouseCurrentY;
        mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.055;
        mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.055;

        mouseVelX = mouseCurrentX - prevX;
        mouseVelY = mouseCurrentY - prevY;
        mouseEnergy *= 0.94;

        gl.uniform1f(uTimeLoc, elapsed);
        gl.uniform2f(uMouseLoc, mouseCurrentX, mouseCurrentY);
        gl.uniform2f(uMVelLoc, mouseVelX * 12.0, mouseVelY * 12.0);
        gl.uniform1f(uMEnrLoc, mouseEnergy);
        gl.uniform1f(uScrlLoc, scrollProgress);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    if (isReducedMotion) {
        renderFrame(1.5);
        return;
    }

    function renderLoop(now) {
        const elapsed = (now - startTime) * 0.001;
        renderFrame(elapsed);
        requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
}

function initCanvas2DFallback(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
        const w = canvas.width = window.innerWidth;
        const h = canvas.height = window.innerHeight;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 50, w * 0.5, h * 0.5, w * 0.8);
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(1, "rgba(240, 240, 245, 0.9)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    window.addEventListener("resize", draw, { passive: true });
    draw();
}
