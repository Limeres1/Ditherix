"use strict";

(() => {
    const VIS_MODES = [
        { id: "vortex", label: "VOID // PULSE" },
        { id: "flame", label: "FLAME // DITHER" },
    ];

    const BAYER_4X4 = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
    ];

    const els = {
        btnTopToggle: document.getElementById("botonMusica"),
        player: document.getElementById("musicPlayer"),
        miniBar: document.getElementById("musicMiniBar"),
        audioEl: document.getElementById("musicAudioEl"),
        fileInput: document.getElementById("musicFileInput"),
        visCanvas: document.getElementById("musicVisCanvas"),
        visLabel: document.getElementById("musicVisLabel"),
        timeDisplay: document.getElementById("musicTimeDisplay"),
        trackTitle: document.getElementById("musicTrackTitle"),
        miniTitle: document.getElementById("musicMiniTitle"),
        miniTime: document.getElementById("musicMiniTime"),
        btnMinimize: document.getElementById("btnMusicMinimize"),
        btnClose: document.getElementById("btnMusicClose"),
        btnRestore: document.getElementById("btnMusicRestore"),
        btnMiniClose: document.getElementById("btnMiniClose"),
        btnPrev: document.getElementById("btnMusicPrev"),
        btnPlayPause: document.getElementById("btnMusicPlayPause"),
        btnNext: document.getElementById("btnMusicNext"),
        btnVisMode: document.getElementById("btnMusicVisMode"),
        btnMiniPrev: document.getElementById("btnMiniPrev"),
        btnMiniPlayPause: document.getElementById("btnMiniPlayPause"),
        btnMiniNext: document.getElementById("btnMiniNext"),
        btnMiniMute: document.getElementById("btnMiniMute"),
        btnVolMenu: document.getElementById("btnMusicVolMenu"),
        volBtnLabel: document.getElementById("musicVolBtnLabel"),
        volPopover: document.getElementById("musicVolPopover"),
        btnMute: document.getElementById("btnMusicMute"),
        volumeInput: document.getElementById("musicVolumeInput"),
        volumeVal: document.getElementById("musicVolumeVal"),
        btnListMenu: document.getElementById("btnMusicListMenu"),
        listPopover: document.getElementById("musicListPopover"),
        trackBadge: document.getElementById("musicTrackBadge"),
        seekInput: document.getElementById("musicSeekInput"),
        trackList: document.getElementById("musicTrackList"),
        btnAddFiles: document.getElementById("btnMusicAddFiles"),
        btnRefresh: document.getElementById("btnMusicRefresh"),
    };

    if (!els.player || !els.miniBar || !els.btnTopToggle) {
        return;
    }

    const state = {
        open: false,
        minimized: false,
        playing: false,
        paused: false,
        muted: false,
        volume: 0.75,
        visModeIndex: 0,
        activePopover: null,
        folderTracks: [],
        localTracks: [],
        currentTrackId: null,
        userSeeking: false,
        posFull: null,
        posMini: null,
    };

    const audioGraph = {
        ctx: null,
        masterGain: null,
        analyser: null,
        mediaSource: null,
        mediaElementWired: false,
        freqData: null,
        timeData: null,
    };

    let visRafId = null;
    let flameBuf = null;
    const flameW = 122;
    const flameH = 75;
    let flameOffscreen = null;
    let flameOffCtx = null;
    let vortexPhase = 0;

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
        const total = Math.floor(seconds);
        const mins = Math.floor(total / 60);
        const secs = total % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function obtenerTodasLasPistas() {
        return [...state.folderTracks, ...state.localTracks];
    }

    function obtenerPistaActual() {
        const todas = obtenerTodasLasPistas();
        if (!todas.length) return null;
        return todas.find((t) => t.id === state.currentTrackId) || todas[0];
    }

    function asegurarAudioGraph() {
        if (audioGraph.ctx) {
            if (audioGraph.ctx.state === "suspended") {
                audioGraph.ctx.resume().catch(() => {});
            }
            return audioGraph.ctx;
        }
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;

        try {
            const ctx = new AudioContextClass();
            const masterGain = ctx.createGain();
            masterGain.gain.value = state.muted ? 0 : state.volume;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.78;
            masterGain.connect(analyser);
            analyser.connect(ctx.destination);

            audioGraph.ctx = ctx;
            audioGraph.masterGain = masterGain;
            audioGraph.analyser = analyser;
            audioGraph.freqData = new Uint8Array(analyser.frequencyBinCount);
            audioGraph.timeData = new Uint8Array(analyser.fftSize);

            if (els.audioEl) {
                const src = ctx.createMediaElementSource(els.audioEl);
                src.connect(masterGain);
                audioGraph.mediaSource = src;
                audioGraph.mediaElementWired = true;
                els.audioEl.volume = 1;
                els.audioEl.muted = false;
            }
            if (ctx.state === "suspended") {
                ctx.resume().catch(() => {});
            }
            return ctx;
        } catch (_err) {
            return null;
        }
    }

    function aplicarVolumenYMute() {
        const efectivo = state.muted ? 0 : state.volume;
        if (audioGraph.masterGain && audioGraph.ctx) {
            audioGraph.masterGain.gain.setTargetAtTime(efectivo, audioGraph.ctx.currentTime, 0.015);
        }
        if (els.audioEl) {
            if (audioGraph.mediaElementWired) {
                els.audioEl.volume = 1;
                els.audioEl.muted = false;
            } else {
                els.audioEl.volume = state.volume;
                els.audioEl.muted = state.muted;
            }
        }
        actualizarControlesVolumenYMute();
    }

    async function reproducirPista(track, resumeFromPause = false) {
        if (!track) {
            alternarPopover("list", true);
            return;
        }
        state.currentTrackId = track.id;
        asegurarAudioGraph();
        aplicarVolumenYMute();

        const mismaPista = els.audioEl.dataset.trackId === track.id;
        if (!resumeFromPause || !mismaPista) {
            els.audioEl.src = track.url;
            els.audioEl.dataset.trackId = track.id;
            els.audioEl.currentTime = 0;
        }
        try {
            await els.audioEl.play();
            state.playing = true;
            state.paused = false;
        } catch (_err) {
            state.playing = false;
            state.paused = false;
        }
        actualizarEstadoUI();
    }

    function pausarPlayback() {
        if (!state.playing) return;
        state.playing = false;
        state.paused = true;
        if (els.audioEl && !els.audioEl.paused) {
            els.audioEl.pause();
        }
        actualizarEstadoUI();
    }

    function detenerPlayback() {
        state.playing = false;
        state.paused = false;
        if (els.audioEl) {
            els.audioEl.pause();
            try {
                els.audioEl.currentTime = 0;
            } catch (_err) {
                /* sin metadatos cargados todavía */
            }
        }
        actualizarEstadoUI();
    }

    function alternarPlayPause() {
        const track = obtenerPistaActual();
        if (!track) {
            alternarPopover("list", true);
            return;
        }
        if (state.playing) {
            pausarPlayback();
        } else {
            reproducirPista(track, state.paused);
        }
    }

    function cambiarPistaPorPaso(delta) {
        const lista = obtenerTodasLasPistas();
        if (!lista.length) {
            alternarPopover("list", true);
            return;
        }
        if (delta < 0 && els.audioEl && els.audioEl.currentTime > 4) {
            reproducirPista(obtenerPistaActual(), false);
            return;
        }
        const idx = lista.findIndex((t) => t.id === state.currentTrackId);
        const base = idx >= 0 ? idx : 0;
        const nextIdx = (base + delta + lista.length) % lista.length;
        reproducirPista(lista[nextIdx], false);
    }

    function alternarMute() {
        state.muted = !state.muted;
        asegurarAudioGraph();
        aplicarVolumenYMute();
    }

    function actualizarControlesVolumenYMute() {
        const pct = Math.round(state.volume * 100);
        const muted = state.muted;

        els.player.classList.toggle("is-muted", muted);
        els.miniBar.classList.toggle("is-muted", muted);

        if (els.volBtnLabel) els.volBtnLabel.textContent = muted ? "MUTE" : `${pct}%`;
        if (els.volumeVal) els.volumeVal.textContent = `${pct}%`;
        if (els.volumeInput) els.volumeInput.value = String(pct);
        if (els.btnMute) {
            els.btnMute.setAttribute("aria-pressed", String(muted));
            els.btnMute.textContent = muted ? "MUTED" : "MUTE";
        }
        if (els.btnMiniMute) els.btnMiniMute.setAttribute("aria-pressed", String(muted));
    }

    function actualizarProgresoUI() {
        const track = obtenerPistaActual();
        let current = 0;
        let total = 0;
        if (track) {
            if (els.audioEl && els.audioEl.dataset.trackId === track.id) {
                current = els.audioEl.currentTime || 0;
                total = Number.isFinite(els.audioEl.duration) ? els.audioEl.duration : (track.duration || 0);
            } else {
                total = track.duration || 0;
            }
        }
        const timeStr = total > 0 ? `${formatTime(current)} / ${formatTime(total)}` : formatTime(current);
        if (els.timeDisplay) els.timeDisplay.textContent = timeStr;
        if (els.miniTime) els.miniTime.textContent = formatTime(current);
        if (els.seekInput && !state.userSeeking) {
            els.seekInput.value = total > 0 ? String(Math.round((current / total) * 1000)) : "0";
        }
    }

    function renderizarListaCanciones() {
        if (!els.trackList) return;
        const tracks = obtenerTodasLasPistas();
        if (els.trackBadge) els.trackBadge.textContent = String(tracks.length);

        els.trackList.innerHTML = "";
        if (!tracks.length) {
            const empty = document.createElement("div");
            empty.className = "hs-track-empty";
            empty.textContent = "Sin canciones en static/music/. Copiá tus archivos ahí o tocá '+' para elegir desde tu PC.";
            els.trackList.appendChild(empty);
            return;
        }

        const frag = document.createDocumentFragment();
        tracks.forEach((track, idx) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "hs-track-item";
            btn.setAttribute("role", "option");
            const active = track.id === state.currentTrackId;
            if (active) btn.classList.add("active");
            btn.setAttribute("aria-selected", String(active));

            const nameSpan = document.createElement("span");
            nameSpan.className = "hs-track-name";
            const prefijo = /^\d+\./.test(track.title) ? "" : `${String(idx + 1).padStart(2, "0")}. `;
            nameSpan.textContent = `${prefijo}${track.title}`;

            const durSpan = document.createElement("span");
            durSpan.className = "hs-track-dur";
            durSpan.textContent = track.duration > 0 ? formatTime(track.duration) : "--:--";

            btn.appendChild(nameSpan);
            btn.appendChild(durSpan);

            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                reproducirPista(track, false);
            });
            frag.appendChild(btn);
        });
        els.trackList.appendChild(frag);
    }

    function actualizarEstadoUI() {
        const track = obtenerPistaActual();
        const title = track ? track.title : "SIN CANCIONES";

        if (els.trackTitle) els.trackTitle.textContent = title;
        if (els.miniTitle) els.miniTitle.textContent = title;

        els.player.classList.toggle("is-playing", state.playing);
        els.miniBar.classList.toggle("is-playing", state.playing);
        els.btnTopToggle.classList.toggle("is-playing", state.playing);

        if (els.btnPlayPause) {
            els.btnPlayPause.setAttribute("aria-label", state.playing ? "Pausar" : "Reproducir");
        }
        if (els.btnMiniPlayPause) {
            els.btnMiniPlayPause.textContent = state.playing ? "❚❚" : "▶";
            els.btnMiniPlayPause.setAttribute("aria-label", state.playing ? "Pausar" : "Reproducir");
        }

        if (els.visLabel) {
            els.visLabel.textContent = VIS_MODES[state.visModeIndex].label;
        }

        actualizarControlesVolumenYMute();
        renderizarListaCanciones();
        actualizarProgresoUI();
    }

    function alternarPopover(nombre, forzar = null) {
        const siguiente = forzar !== null ? (forzar ? nombre : null) : (state.activePopover === nombre ? null : nombre);
        state.activePopover = siguiente;

        const map = [
            { key: "vol", btn: els.btnVolMenu, pop: els.volPopover },
            { key: "list", btn: els.btnListMenu, pop: els.listPopover },
        ];

        const playerRect = els.player.getBoundingClientRect();
        const abrirArriba = playerRect.bottom + 210 > window.innerHeight;

        map.forEach((item) => {
            if (!item.pop || !item.btn) return;
            const activo = item.key === siguiente;
            item.pop.classList.toggle("hidden", !activo);
            item.pop.classList.toggle("pop-up", activo && abrirArriba);
            item.pop.setAttribute("aria-hidden", String(!activo));
            item.btn.setAttribute("aria-expanded", String(activo));
        });
    }

    /* ======================================================================
       Visualizador CRT (Void Pulse & Flame Dither)
       ====================================================================== */
    function inicializarVisualizador() {
        flameBuf = new Uint8Array(flameW * flameH);
        flameOffscreen = document.createElement("canvas");
        flameOffscreen.width = flameW;
        flameOffscreen.height = flameH;
        flameOffCtx = flameOffscreen.getContext("2d");
    }

    function dibujarVoidPulse(ctx, w, h, freqData, timeData, bass) {
        ctx.fillStyle = "rgba(2, 2, 3, 0.34)";
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        vortexPhase += 0.032 + bass * 0.12;

        const maxR = Math.hypot(cx, cy);
        for (let r = 8; r < maxR; r += 12) {
            const prog = (r + (vortexPhase * 22) % 12) / maxR;
            const bin = Math.min(freqData.length - 1, Math.floor(prog * 28));
            const amp = state.playing ? freqData[bin] / 255 : 0.12;
            const alpha = Math.max(0.06, Math.min(0.9, amp * 0.85));
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1 + amp * 1.8;
            ctx.beginPath();
            ctx.arc(cx, cy, r * (0.85 + bass * 0.16), 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        const pts = 64;
        for (let i = 0; i <= pts; i += 1) {
            const ang = (i / pts) * Math.PI * 2 + vortexPhase * 0.4;
            const idx = Math.floor((i % pts) / pts * timeData.length);
            const norm = state.playing ? (timeData[idx] - 128) / 128 : 0.05 * Math.sin(ang * 4 + vortexPhase);
            const radius = 26 + bass * 18 + norm * 18;
            const x = cx + Math.cos(ang) * radius;
            const y = cy + Math.sin(ang) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    function dibujarFlameDither(ctx, w, h, freqData, energiaMedia) {
        if (!flameBuf || !flameOffCtx) return;

        for (let x = 0; x < flameW; x += 1) {
            const bin = Math.min(freqData.length - 1, Math.floor((x / flameW) * 32));
            const mag = freqData[bin] / 255;
            const spark = state.playing
                ? Math.min(255, Math.floor(85 + mag * 195 + Math.random() * 65))
                : (Math.random() < 0.08 ? 85 : 18);
            flameBuf[(flameH - 1) * flameW + x] = spark;
            flameBuf[(flameH - 2) * flameW + x] = Math.floor(spark * 0.85);
        }

        const cool = state.playing ? Math.max(2, Math.round(7 - energiaMedia * 4)) : 12;
        for (let y = 0; y < flameH - 2; y += 1) {
            for (let x = 0; x < flameW; x += 1) {
                const xl = x > 0 ? x - 1 : 0;
                const xr = x < flameW - 1 ? x + 1 : flameW - 1;
                const sum =
                    flameBuf[(y + 1) * flameW + xl] +
                    flameBuf[(y + 1) * flameW + x] +
                    flameBuf[(y + 1) * flameW + xr] +
                    flameBuf[(y + 2) * flameW + x];
                const jitter = Math.random() < 0.35 ? 2 : 0;
                flameBuf[y * flameW + x] = Math.max(0, Math.floor(sum / 4) - cool - jitter);
            }
        }

        const imgData = flameOffCtx.createImageData(flameW, flameH);
        const px = imgData.data;
        for (let y = 0; y < flameH; y += 1) {
            const rowB = BAYER_4X4[y & 3];
            for (let x = 0; x < flameW; x += 1) {
                const val = flameBuf[y * flameW + x] / 255;
                const bayer = (rowB[x & 3] + 0.5) / 16;
                const on = val > bayer * 0.88;
                const lum = on ? Math.min(255, Math.round(170 + val * 85)) : (val > 0.18 ? 28 : 4);
                const i = (y * flameW + x) * 4;
                px[i] = lum;
                px[i + 1] = lum;
                px[i + 2] = lum;
                px[i + 3] = 255;
            }
        }
        flameOffCtx.putImageData(imgData, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(flameOffscreen, 0, 0, w, h);
    }

    function loopVisualizador() {
        if (!state.open || state.minimized) {
            visRafId = null;
            return;
        }
        const canvas = els.visCanvas;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            const w = canvas.width;
            const h = canvas.height;
            const analyser = audioGraph.analyser;
            const freqData = audioGraph.freqData || new Uint8Array(64);
            const timeData = audioGraph.timeData || new Uint8Array(128).fill(128);

            let bass = 0;
            let avg = 0;
            if (analyser && state.playing && !state.muted) {
                analyser.getByteFrequencyData(freqData);
                analyser.getByteTimeDomainData(timeData);
                for (let i = 0; i < 6; i += 1) bass += freqData[i];
                bass = bass / (6 * 255);
                for (let i = 0; i < 32; i += 1) avg += freqData[i];
                avg = avg / (32 * 255);
            } else if (state.playing && !state.muted) {
                bass = 0.25 + 0.15 * Math.sin(performance.now() * 0.014);
                avg = 0.22;
            }

            const mode = VIS_MODES[state.visModeIndex].id;
            if (mode === "vortex") {
                dibujarVoidPulse(ctx, w, h, freqData, timeData, bass);
            } else {
                dibujarFlameDither(ctx, w, h, freqData, avg);
            }
        }
        visRafId = window.requestAnimationFrame(loopVisualizador);
    }

    function asegurarBucleVisual() {
        if (state.open && !state.minimized && visRafId === null) {
            visRafId = window.requestAnimationFrame(loopVisualizador);
        } else if ((!state.open || state.minimized) && visRafId !== null) {
            window.cancelAnimationFrame(visRafId);
            visRafId = null;
        }
    }

    /* ======================================================================
       Arrastre Libre con el Mouse y Ventana
       ====================================================================== */
    function ajustarPosicionEnViewport(el, x, y) {
        const rect = el.getBoundingClientRect();
        const ancho = rect.width || el.offsetWidth || 266;
        const alto = rect.height || el.offsetHeight || 60;
        const maxX = Math.max(8, window.innerWidth - ancho - 8);
        const maxY = Math.max(8, window.innerHeight - Math.min(alto, 90) - 8);
        return {
            x: Math.round(Math.min(maxX, Math.max(8, x))),
            y: Math.round(Math.min(maxY, Math.max(8, y))),
        };
    }

    function aplicarPosicion(el, pos) {
        if (!pos) return;
        const ajustada = ajustarPosicionEnViewport(el, pos.x, pos.y);
        el.style.left = `${ajustada.x}px`;
        el.style.top = `${ajustada.y}px`;
        el.style.transform = "none";
        return ajustada;
    }

    function habilitarArrastre(el, keyEstadoPos) {
        let activo = false;
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let originX = 0;
        let originY = 0;

        el.addEventListener("wheel", (e) => {
            e.stopPropagation();
        }, { passive: true });

        el.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            if (e.button !== 0) return;
            if (e.target.closest("button, input, select, option, a, label, .crt-popover, .hs-track-list, canvas")) {
                return;
            }
            const rect = el.getBoundingClientRect();
            activo = true;
            pointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            originX = rect.left;
            originY = rect.top;
            el.style.left = `${Math.round(originX)}px`;
            el.style.top = `${Math.round(originY)}px`;
            el.style.transform = "none";
            el.classList.add("dragging");
            if (el.setPointerCapture) {
                try {
                    el.setPointerCapture(pointerId);
                } catch (_err) {
                    /* ignorar */
                }
            }
        });

        el.addEventListener("pointermove", (e) => {
            if (!activo || e.pointerId !== pointerId) return;
            const next = ajustarPosicionEnViewport(
                el,
                originX + (e.clientX - startX),
                originY + (e.clientY - startY),
            );
            el.style.left = `${next.x}px`;
            el.style.top = `${next.y}px`;
            state[keyEstadoPos] = next;
        });

        function terminarArrastre(e) {
            if (!activo || (e.pointerId !== undefined && e.pointerId !== pointerId)) return;
            activo = false;
            el.classList.remove("dragging");
            if (el.releasePointerCapture && pointerId !== null) {
                try {
                    el.releasePointerCapture(pointerId);
                } catch (_err) {
                    /* ignorar */
                }
            }
            pointerId = null;
        }

        el.addEventListener("pointerup", terminarArrastre);
        el.addEventListener("pointercancel", terminarArrastre);
    }

    function centrarPlayerInicial() {
        const rect = els.player.getBoundingClientRect();
        const ancho = rect.width || 266;
        const alto = rect.height || 265;
        const x = Math.max(12, Math.round((window.innerWidth - ancho) / 2));
        const y = Math.max(82, Math.round((window.innerHeight - alto) / 2));
        state.posFull = aplicarPosicion(els.player, { x, y });
    }

    function mostrarVistaReproductor(abrir, minimizar = false) {
        state.open = abrir;
        state.minimized = abrir ? minimizar : false;
        if (!abrir || minimizar) {
            alternarPopover(null, false);
        }

        const mostrarFull = state.open && !state.minimized;
        const mostrarMini = state.open && state.minimized;

        els.player.classList.toggle("oculto", !mostrarFull);
        els.player.setAttribute("aria-hidden", String(!mostrarFull));

        els.miniBar.classList.toggle("oculto", !mostrarMini);
        els.miniBar.setAttribute("aria-hidden", String(!mostrarMini));

        els.btnTopToggle.classList.toggle("active", state.open);
        els.btnTopToggle.setAttribute("aria-pressed", String(state.open));
        els.btnTopToggle.setAttribute("aria-expanded", String(mostrarFull));

        if (mostrarFull) {
            if (state.posFull) {
                state.posFull = aplicarPosicion(els.player, state.posFull);
            } else {
                centrarPlayerInicial();
            }
        } else if (mostrarMini) {
            if (!state.posMini) {
                const ref = state.posFull || { x: 24, y: 84 };
                state.posMini = { x: ref.x, y: Math.max(84, ref.y) };
            }
            state.posMini = aplicarPosicion(els.miniBar, state.posMini);
        }

        asegurarBucleVisual();
    }

    function abrirOCerrarDesdeBotonSuperior() {
        if (!state.open) {
            cargarPistasServidor();
            mostrarVistaReproductor(true, false);
        } else if (state.minimized) {
            mostrarVistaReproductor(true, false);
        } else {
            cerrarReproductor();
        }
    }

    function cerrarReproductor() {
        detenerPlayback();
        mostrarVistaReproductor(false, false);
    }

    /* ======================================================================
       Carga desde static/music/ y Archivos Locales
       ====================================================================== */
    async function cargarPistasServidor() {
        try {
            const resp = await fetch("/api/music", { cache: "no-store" });
            if (!resp.ok) return;
            const datos = await resp.json();
            if (!datos || !Array.isArray(datos.tracks)) return;

            const prevDurs = new Map(state.folderTracks.map((t) => [t.id, t.duration]));
            state.folderTracks = datos.tracks.map((t) => ({
                id: t.id,
                title: t.title,
                url: t.url,
                source: "folder",
                duration: prevDurs.get(t.id) || 0,
            }));

            state.folderTracks.forEach((track) => {
                if (!track.duration) {
                    extraerDuracionPista(track);
                }
            });

            if (!obtenerPistaActual() || !obtenerTodasLasPistas().some((t) => t.id === state.currentTrackId)) {
                state.currentTrackId = state.folderTracks[0]?.id || state.localTracks[0]?.id || null;
            }
            actualizarEstadoUI();
        } catch (_err) {
            /* fallback silencioso */
        }
    }

    function extraerDuracionPista(track) {
        const probe = new Audio();
        probe.preload = "metadata";
        probe.src = track.url;
        probe.addEventListener("loadedmetadata", () => {
            if (Number.isFinite(probe.duration) && probe.duration > 0) {
                track.duration = probe.duration;
                renderizarListaCanciones();
                actualizarProgresoUI();
            }
            probe.removeAttribute("src");
            probe.load();
        }, { once: true });
    }

    function agregarArchivosLocales(fileList) {
        if (!fileList || !fileList.length) return;
        const nuevas = [];
        Array.from(fileList).forEach((file) => {
            if (!file.type.startsWith("audio/") && !/\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i.test(file.name)) {
                return;
            }
            const url = URL.createObjectURL(file);
            const titulo = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").trim() || file.name;
            const track = {
                id: `local:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
                title: titulo,
                url,
                source: "local",
                duration: 0,
            };
            extraerDuracionPista(track);
            state.localTracks.push(track);
            nuevas.push(track);
        });
        if (nuevas.length) {
            reproducirPista(nuevas[0], false);
        }
    }

    /* ======================================================================
       Eventos e Inicialización
       ====================================================================== */
    function enlazarEventos() {
        els.btnTopToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            abrirOCerrarDesdeBotonSuperior();
        });

        els.btnMinimize?.addEventListener("click", () => {
            mostrarVistaReproductor(true, true);
        });
        els.btnClose?.addEventListener("click", cerrarReproductor);
        els.btnRestore?.addEventListener("click", () => {
            mostrarVistaReproductor(true, false);
        });
        els.btnMiniClose?.addEventListener("click", cerrarReproductor);

        els.btnPlayPause?.addEventListener("click", alternarPlayPause);
        els.btnMiniPlayPause?.addEventListener("click", alternarPlayPause);
        els.btnPrev?.addEventListener("click", () => cambiarPistaPorPaso(-1));
        els.btnMiniPrev?.addEventListener("click", () => cambiarPistaPorPaso(-1));
        els.btnNext?.addEventListener("click", () => cambiarPistaPorPaso(1));
        els.btnMiniNext?.addEventListener("click", () => cambiarPistaPorPaso(1));

        els.btnMute?.addEventListener("click", alternarMute);
        els.btnMiniMute?.addEventListener("click", alternarMute);

        function alternarVisMode() {
            state.visModeIndex = (state.visModeIndex + 1) % VIS_MODES.length;
            actualizarEstadoUI();
        }
        els.btnVisMode?.addEventListener("click", alternarVisMode);
        els.visCanvas?.addEventListener("click", alternarVisMode);

        els.btnVolMenu?.addEventListener("click", (e) => {
            e.stopPropagation();
            alternarPopover("vol");
        });
        els.btnListMenu?.addEventListener("click", (e) => {
            e.stopPropagation();
            alternarPopover("list");
        });

        document.addEventListener("click", (e) => {
            if (!state.activePopover) return;
            if (!e.target.closest(".crt-popover-anchor")) {
                alternarPopover(null, false);
            }
        });

        els.volumeInput?.addEventListener("input", () => {
            asegurarAudioGraph();
            const val = Math.max(0, Math.min(100, parseInt(els.volumeInput.value, 10) || 0)) / 100;
            state.volume = val;
            state.muted = val === 0;
            aplicarVolumenYMute();
        });

        els.btnAddFiles?.addEventListener("click", () => {
            els.fileInput?.click();
        });
        els.fileInput?.addEventListener("change", () => {
            agregarArchivosLocales(els.fileInput.files);
            els.fileInput.value = "";
        });
        els.btnRefresh?.addEventListener("click", () => {
            cargarPistasServidor();
        });

        if (els.seekInput) {
            els.seekInput.addEventListener("pointerdown", () => {
                state.userSeeking = true;
            });
            els.seekInput.addEventListener("input", () => {
                const ratio = (parseInt(els.seekInput.value, 10) || 0) / 1000;
                if (els.audioEl && Number.isFinite(els.audioEl.duration)) {
                    els.audioEl.currentTime = ratio * els.audioEl.duration;
                }
                actualizarProgresoUI();
            });
            const endSeek = () => {
                state.userSeeking = false;
            };
            els.seekInput.addEventListener("pointerup", endSeek);
            els.seekInput.addEventListener("change", endSeek);
        }

        if (els.audioEl) {
            els.audioEl.addEventListener("timeupdate", actualizarProgresoUI);
            els.audioEl.addEventListener("loadedmetadata", () => {
                const track = obtenerPistaActual();
                if (track && Number.isFinite(els.audioEl.duration)) {
                    track.duration = els.audioEl.duration;
                    renderizarListaCanciones();
                    actualizarProgresoUI();
                }
            });
            els.audioEl.addEventListener("ended", () => {
                cambiarPistaPorPaso(1);
            });
        }

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && state.activePopover) {
                alternarPopover(null, false);
                return;
            }
            const tag = (e.target?.tagName || "").toLowerCase();
            if (tag === "input" || tag === "textarea" || tag === "select") return;
            if (e.key === "m" || e.key === "M") {
                e.preventDefault();
                abrirOCerrarDesdeBotonSuperior();
            }
        });

        window.addEventListener("resize", () => {
            if (state.open && !state.minimized && state.posFull) {
                state.posFull = aplicarPosicion(els.player, state.posFull);
            }
            if (state.open && state.minimized && state.posMini) {
                state.posMini = aplicarPosicion(els.miniBar, state.posMini);
            }
        });

        window.addEventListener("beforeunload", () => {
            state.localTracks.forEach((t) => {
                if (t.url?.startsWith("blob:")) {
                    URL.revokeObjectURL(t.url);
                }
            });
        });

        habilitarArrastre(els.player, "posFull");
        habilitarArrastre(els.miniBar, "posMini");
    }

    inicializarVisualizador();
    enlazarEventos();
    actualizarEstadoUI();
    cargarPistasServidor();
})();
