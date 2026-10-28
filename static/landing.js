/**
 * DITHERIX // Y2K LANDING PAGE JAVASCRIPT
 * Live HUD Clock, Glitch Soundwave Visualizer & Interactive Portal Controls
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initHudClock();
    initPortalDropdown();
    initGlitchWaveform();
});

/* ==========================================================================
   1. LIVE HUD CLOCK & COORDINATE DISPLAY
   ========================================================================== */
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
        hours = hours ? hours : 12; // 12-hour clock
        const hoursStr = String(hours).padStart(2, "0");

        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const millis = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0");

        if (dayEl) dayEl.textContent = day;
        if (monthEl) monthEl.textContent = month;
        if (yearEl) yearEl.textContent = year;

        timeEl.textContent = `${hoursStr}:${minutes}:${seconds}:${millis} ${ampm}`;
    }

    // High frequency update for milliseconds ticker
    updateClock();
    setInterval(updateClock, 33);
}

/* ==========================================================================
   2. PORTAL DROPDOWN MENU
   ========================================================================== */
function initPortalDropdown() {
    const dropdownWrap = document.getElementById("portalDropdownWrap");
    const portalBtn = document.getElementById("portalBtn");
    const portalMenu = document.getElementById("portalMenu");

    if (!dropdownWrap || !portalBtn) return;

    portalBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdownWrap.classList.toggle("open");
        portalBtn.setAttribute("aria-expanded", String(isOpen));
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
        if (!dropdownWrap.contains(e.target)) {
            dropdownWrap.classList.remove("open");
            portalBtn.setAttribute("aria-expanded", "false");
        }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            dropdownWrap.classList.remove("open");
            portalBtn.setAttribute("aria-expanded", "false");
        }
    });
}

/* ==========================================================================
   3. GLITCH SOUNDWAVE / FREQUENCY MATRIX VISUALIZER (From Reference Image 3)
   ========================================================================== */
function initGlitchWaveform() {
    const canvas = document.getElementById("waveformCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let mouseX = -1000;
    let width = canvas.width;
    let height = canvas.height;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0) {
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            width = canvas.width;
            height = canvas.height;
        }
    }

    window.addEventListener("resize", resize);
    resize();

    window.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.top <= e.clientY && e.clientY <= rect.bottom) {
            mouseX = (e.clientX - rect.left) * window.devicePixelRatio;
        } else {
            mouseX = -1000;
        }
    });

    let time = 0;

    function draw() {
        time += 0.04;
        ctx.clearRect(0, 0, width, height);

        const totalBars = Math.floor(width / (4 * window.devicePixelRatio));
        const barWidth = 2 * window.devicePixelRatio;
        const spacing = 4 * window.devicePixelRatio;
        const centerY = height / 2;

        for (let i = 0; i < totalBars; i++) {
            const x = i * spacing;

            // Frequency oscillation combining multiple harmonics + glitch spikes
            const normX = i / totalBars;
            let wave1 = Math.sin(normX * 14 + time * 1.5);
            let wave2 = Math.cos(normX * 32 - time * 2.2);
            let wave3 = Math.sin(normX * 64 + time * 0.8);
            
            // Random glitch spikes characteristic of Y2K audio matrix
            const noise = (Math.sin(i * 99 + time * 10) > 0.88) ? 0.7 : 0.15;
            
            let amplitude = (Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) + noise);

            // Proximity to mouse increases agitation
            const distToMouse = Math.abs(x - mouseX);
            if (distToMouse < 180 * window.devicePixelRatio) {
                const mouseFactor = 1 - (distToMouse / (180 * window.devicePixelRatio));
                amplitude += mouseFactor * 0.8 * (Math.random() * 0.5 + 0.5);
            }

            // Clamping and height calculation
            amplitude = Math.min(amplitude, 1.0);
            const barHeight = Math.max(4, amplitude * (height * 0.85));

            // Bar drawing with matrix halftone & pure high contrast white
            const topY = centerY - barHeight / 2;

            if (i % 7 === 0) {
                // Occasional red/bright marker
                ctx.fillStyle = "rgba(255, 42, 42, 0.85)";
            } else if (amplitude > 0.6) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            } else {
                ctx.fillStyle = "rgba(180, 180, 195, 0.4)";
            }

            ctx.fillRect(x, topY, barWidth, barHeight);

            // Top and bottom point markers for extreme high bars
            if (barHeight > height * 0.65) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(x - 1, topY - 3, barWidth + 2, 2);
                ctx.fillRect(x - 1, topY + barHeight + 1, barWidth + 2, 2);
            }
        }

        animationFrameId = requestAnimationFrame(draw);
    }

    draw();
}
