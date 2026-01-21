const plantEl = document.getElementById('growth-plant');
let currentScore = 0;

document.body.dataset.theme = 'light';

class PlantRenderer {
    constructor(element, skipAnimation = false) {
        this.element = element;
        this.skipAnimation = skipAnimation;
        this.width = 100;
        this.height = 360;
        this.centerX = this.width / 2;
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    bezier(t, p0, p1, p2, p3) {
        const cX = 3 * (p1.x - p0.x);
        const bX = 3 * (p2.x - p1.x) - cX;
        const aX = p3.x - p0.x - cX - bX;

        const cY = 3 * (p1.y - p0.y);
        const bY = 3 * (p2.y - p1.y) - cY;
        const aY = p3.y - p0.y - cY - bY;

        const x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
        const y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

        return { x, y };
    }

    getAngle(t, p0, p1, p2, p3) {
        const dx = 3 * (1 - t) * (1 - t) * (p1.x - p0.x) + 6 * (1 - t) * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
        const dy = 3 * (1 - t) * (1 - t) * (p1.y - p0.y) + 6 * (1 - t) * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
        return Math.atan2(dy, dx) * (180 / Math.PI);
    }

    getAssetDefs(isDark) {
        const veinColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)';
        return `
        <defs>
            <symbol id="asset-leaf" viewBox="0 0 40 40">
                <path d="M 0 20 C 5 15, 15 5, 25 5 C 32 5, 38 12, 40 20 C 38 28, 32 35, 25 35 C 15 35, 5 25, 0 20 Z" fill="currentColor" />
                <path d="M 0 20 C 10 20, 20 20, 40 20" stroke="${veinColor}" stroke-width="1.5" stroke-linecap="round" fill="none" />
            </symbol>

            <symbol id="asset-petal" viewBox="0 0 30 50">
                <path d="M 15 50 C 5 40, 0 25, 0 15 C 0 5, 8 0, 15 0 C 22 0, 30 5, 30 15 C 30 25, 25 40, 15 50" fill="currentColor" />
                <path d="M 15 50 L 15 10" stroke="${isDark ? '#fff' : '#000'}" stroke-width="1" opacity="0.2" />
            </symbol>

            <symbol id="asset-sepal" viewBox="0 0 20 30">
                <path d="M 10 30 C 5 20, 0 10, 0 5 C 0 2, 4 0, 10 0 C 16 0, 20 2, 20 5 C 20 10, 15 20, 10 30" fill="currentColor" />
            </symbol>
            
            <filter id="glow-mote" x="-50%" y="-100%" width="200%" height="300%">
                 <feGaussianBlur stdDeviation="1.5" result="blur" />
                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        `;
    }

    lerp(start, end, t) {
        return start + (end - start) * Math.max(0, Math.min(1, t));
    }

    lerpHsl(h1, s1, l1, h2, s2, l2, t) {
        const h = this.lerp(h1, h2, t);
        const s = this.lerp(s1, s2, t);
        const l = this.lerp(l1, l2, t);
        return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
    }

    render(score) {
        const isDark = document.body.dataset.theme === 'dark';

        const t = score / 100;
        const startX = this.centerX;
        const startY = this.height - 70;

        const currentHeight = this.lerp(40, 260, t);
        const curveDirection = 1;

        const droop = this.lerp(1.5, 0.2, t);

        const p0 = { x: startX, y: startY };
        const p1 = {
            x: startX + (30 * droop * curveDirection),
            y: startY - (currentHeight * 0.33)
        };
        const p2 = {
            x: startX + (10 * droop * -curveDirection), // Zig-zag?
            y: startY - (currentHeight * 0.66)
        };
        const tipX = startX + (20 * droop * curveDirection);
        const tipY = startY - currentHeight;
        const p3 = { x: tipX, y: tipY };

        const stemPath = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

        const stemHue = this.lerp(30, 145, t);
        const stemSat = this.lerp(30, 45, t);
        const stemLight = isDark ? this.lerp(30, 35, t) : this.lerp(40, 42, t);
        const stemColor = `hsl(${stemHue.toFixed(1)} ${stemSat.toFixed(1)}% ${stemLight.toFixed(1)}%)`;

        let leavesSvg = '';
        if (score >= 10) {
            const leafCount = Math.floor(this.lerp(1, 10, t));

            for (let i = 0; i < leafCount; i++) {
                const lt = 0.2 + (i / Math.max(leafCount, 1)) * 0.75;
                const pos = this.bezier(lt, p0, p1, p2, p3);
                const angle = this.getAngle(lt, p0, p1, p2, p3);

                const side = i % 2 === 0 ? 1 : -1;
                // Droop angle: Low score = leaves point down (+130). High score = Perky (+60)
                const perkyAngle = this.lerp(130, 60, t);
                const rotation = angle + (perkyAngle * side);

                // Size: Small at low score
                const baseSize = this.lerp(0.4, 1.0, t);
                const rScale = 0.8 + (Math.sin(i * 99) * 0.2);
                const sizeScale = baseSize * rScale;

                leavesSvg += `
                    <g transform="translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) rotate(${rotation.toFixed(1)}) scale(${sizeScale.toFixed(2)})">
                        <use href="#asset-leaf" x="0" y="-20" width="40" height="40" style="color: ${stemColor}" />
                    </g>
                `;
            }
        }

        // --- 3. Flower Head Generation (FULL CONTINUOUS) ---
        // We render a "flower" even at low scores, but it represents the "state"
        let flowerSvg = '';

        // Hue: Brown(30) -> Pink(330).
        // Use lerp but handle wrap manually if we wanted 30->0->330.
        // Actually simplest is: 30 maps to 390. 330 maps to 330.
        // Let's just interpolate 30 -> 330 linearly: It goes through orange, yellow, green, blue... maybe unwanted?
        // User wants "Worse version".
        // 40 -> -30 (330) is good (70 degree span).
        let fHue = this.lerp(40, -30, t);
        if (fHue < 0) fHue += 360;

        // Saturation: Dead (10%) -> Vibrant (90%)
        const fSat = this.lerp(10, 90, t);

        // Lightness: Dark/Rotten (20%) -> Bright (60%)
        const fLight = isDark ? this.lerp(20, 60, t) : this.lerp(30, 70, t);

        const petalColor = `hsl(${fHue.toFixed(1)} ${fSat.toFixed(1)}% ${fLight.toFixed(1)}%)`;
        const innerColor = `hsl(${fHue.toFixed(1)} ${fSat.toFixed(1)}% ${(Math.max(10, fLight - 15)).toFixed(1)}%)`;
        const outerColor = `hsl(${fHue.toFixed(1)} ${fSat.toFixed(1)}% ${(Math.max(10, fLight - 20)).toFixed(1)}%)`;

        // Scale: Tiny (0.2) -> Normal (1.0) -> Extravagant (1.2)
        const fScale = this.lerp(0.2, 1.25, t);

        // Opacity of outer petals: only high scores
        const outerOpacity = Math.max(0, (score - 70) / 30);

        // Sepal color
        const sepalColor = stemColor;

        // Render flower at ALL scores (even 0)
        let sepals = '';
        const sepalSpread = this.lerp(30, 72, t);
        for (let i = 0; i < 5; i++) {
            // Actually standard ring is better
            const r = i * 72;
            sepals += `<use href="#asset-sepal" x="-10" y="-30" width="20" height="30" transform="rotate(${r}) translate(0, 10)" style="color: ${sepalColor}" />`;
        }

        let outerPetals = '';
        if (score >= 70) {
            const numOuter = 10;
            for (let i = 0; i < numOuter; i++) {
                const rot = i * (360 / numOuter);
                // Removed opacity attribute
                outerPetals += `<use href="#asset-petal" x="-18" y="-60" width="36" height="60" transform="rotate(${rot + 18})" style="color: ${outerColor}" />`;
            }
        }

        let petals = '';
        const numPetals = 8;
        for (let i = 0; i < numPetals; i++) {
            const rot = i * (360 / numPetals);
            petals += `<use href="#asset-petal" x="-15" y="-50" width="30" height="50" transform="rotate(${rot})" style="color: ${petalColor}" />`;
        }

        // Inner petals are always visible but look withered at low scores due to scale/color
        let innerPetals = '';
        const numInner = 6;
        for (let i = 0; i < numInner; i++) {
            const rot = i * (360 / numInner) + 30;
            innerPetals += `<use href="#asset-petal" x="-10" y="-35" width="20" height="35" transform="rotate(${rot})" style="color: ${innerColor}" />`;
        }

        let corePetals = '';
        if (score >= 90) {
            const numCore = 5;
            for (let i = 0; i < numCore; i++) {
                const rot = i * (360 / numCore);
                corePetals += `<use href="#asset-petal" x="-6" y="-20" width="12" height="20" transform="rotate(${rot})" style="color: ${petalColor}" style="filter: brightness(1.2)" />`;
            }
        }

        const stamenHue = this.lerp(30, 48, t);
        const stamenSat = this.lerp(20, 100, t);
        const stamenLight = this.lerp(30, 60, t);
        const stamenColor = `hsl(${stamenHue.toFixed(1)} ${stamenSat.toFixed(1)}% ${stamenLight.toFixed(1)}%)`;
        const stamenStroke = `hsl(${stamenHue.toFixed(1)} ${stamenSat.toFixed(1)}% ${(stamenLight * 0.8).toFixed(1)}%)`;

        const stamen = `<circle cx="0" cy="0" r="6" fill="${stamenColor}" stroke="${stamenStroke}" stroke-width="2" />`;
        const tipAngle = this.getAngle(1, p0, p1, p2, p3) - 90;

        flowerSvg = `
        <g class="flower-positioner" transform="translate(${p3.x.toFixed(1)}, ${p3.y.toFixed(1)}) rotate(${tipAngle.toFixed(1)})">
            <g class="flower-scaler" style="transform: scale(${fScale.toFixed(2)}); transition: transform 0.5s ease;">
                <g class="svg-flower-head" style="${this.skipAnimation ? '' : 'animation: bloom-grow 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;'}">
                    ${sepals}
                    ${outerPetals}
                    ${petals}
                    ${innerPetals}
                    ${corePetals}
                    ${stamen}
                </g>
            </g>
        </g>`;

        const potY = this.height - 30;
        const potBase = isDark ? 'hsl(25 40% 35%)' : 'hsl(25 55% 55%)';
        const potShadow = isDark ? 'hsl(25 45% 25%)' : 'hsl(25 50% 45%)';
        const potRim = isDark ? 'hsl(25 45% 42%)' : 'hsl(25 55% 62%)';

        const potBackSvg = `
            <g class="pot-back" transform="translate(${this.centerX}, ${potY})">
                 <ellipse cx="0" cy="4" rx="25" ry="5" fill="hsl(0 0% 0% / 0.15)" />
                 <path d="M -18 -40 Q -24 -20, -14 0 L 14 0 Q 24 -20, 18 -40 Z" fill="url(#potGradient)" />
                 <defs><linearGradient id="potGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${potBase}" /><stop offset="1" stop-color="${potShadow}" /></linearGradient></defs>
            </g>
        `;

        const soilColor = isDark ? 'hsl(30 25% 20%)' : 'hsl(30 35% 35%)';
        const soilSvg = `
            <g class="pot-soil" transform="translate(${this.centerX}, ${potY})">
                <ellipse cx="0" cy="-38" rx="16" ry="4" fill="${soilColor}" />
            </g>
        `;

        const potFrontSvg = `
            <g class="pot-front" transform="translate(${this.centerX}, ${potY})">
                <rect x="-20" y="-46" width="40" height="8" rx="2" fill="${potRim}" />
            </g>
        `;

        return `
        <svg viewBox="0 0 ${this.width} ${this.height}" role="img" aria-hidden="true" style="overflow: visible;">
            ${this.getAssetDefs(isDark)}
            ${potBackSvg}
            <g class="svg-plant-group">
                <path d="${stemPath}" stroke="${stemColor}" stroke-width="${this.lerp(3, 5, t)}" fill="none" stroke-linecap="round" />
                ${leavesSvg}
                ${flowerSvg}
            </g>
            ${soilSvg}
            ${potFrontSvg}
        </svg>
        `;
    }
}

class MoteSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        // Add glow filter class for better visual pop
        this.canvas.classList.add('mote-filter-target');
        this.particles = [];
        this.isActive = false;
        this.animationFrame = null;
        this.width = 0;
        this.height = 0;
        this.time = 0;
        this.mouse = { x: 0, y: 0 };

        // Custom noise offset per instance
        this.noiseOffsetX = Math.random() * 1000;
        this.noiseOffsetY = Math.random() * 1000;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Track mouse for interaction
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
    }

    resize() {
        if (!this.canvas.parentElement) return;
        this.width = this.canvas.parentElement.offsetWidth;
        this.height = this.canvas.parentElement.offsetHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    start(score) {
        // "Shouldn't appear until 75"
        if (score < 75) {
            this.stop();
            return;
        }

        this.canvas.style.opacity = '1';
        if (!this.isActive) {
            this.isActive = true;
            this.animate();
        }

        // Scale: 0 to 1 over the range 75-100
        const t = (score - 75) / 25;

        // Count: 5 (drift) -> 35 (rich starry field)
        const targetCount = 5 + Math.floor(t * 30);

        // Add particles
        while (this.particles.length < targetCount) {
            this.particles.push(this.createParticle());
        }

        // Remove excess
        if (this.particles.length > targetCount) {
            this.particles.splice(0, this.particles.length - targetCount);
        }
    }

    stop() {
        this.canvas.style.opacity = '0';
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    createParticle() {
        // "More distributed" - Simple rejection sampling to avoid overlapping
        let x, y;
        let attempts = 0;
        let safe = false;

        while (!safe && attempts < 5) {
            x = Math.random() * this.width;
            y = Math.random() * this.height;
            safe = true;
            for (let i = Math.max(0, this.particles.length - 10); i < this.particles.length; i++) {
                const other = this.particles[i];
                const dx = x - other.x;
                const dy = y - other.y;
                if (dx * dx + dy * dy < 2500) {
                    safe = false; break;
                }
            }
            attempts++;
        }

        // Palette: Lighter, brighter, twinkling colors
        const palettes = [
            { h: 340, s: 100, l: 80 }, // Pink
            { h: 280, s: 90, l: 85 }, // Purple
            { h: 40, s: 100, l: 80 }, // Gold
            { h: 10, s: 90, l: 85 }, // Coral
        ];

        const p = palettes[Math.floor(Math.random() * palettes.length)];

        return {
            x: x,
            y: y,
            uniqueOffset: Math.random() * 1000,

            // smaller, crisper sparks
            sizeBase: 0.6 + Math.random() * 1.2,

            hue: p.h,
            sat: p.s,
            light: p.l,

            // Much slower, subtler breathing
            pulseSpeed: 0.02 + Math.random() * 0.04,
            pulsePhase: Math.random() * Math.PI * 2,

            life: Math.random() * 1000
        };
    }

    // Simple pseudo-noise function for organic flow
    noise(x, y) {
        return Math.sin(x) * Math.cos(y);
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.width, this.height);

        const isDark = document.body.dataset.theme === 'dark';
        this.ctx.globalCompositeOperation = isDark ? 'screen' : 'source-over';
        this.time += 0.08; // Slower time step for physics/pulsing

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // --- Physics ---
            const noisePreX = (p.x * 0.0015) + this.noiseOffsetX;
            const noisePreY = (p.y * 0.0015) + this.noiseOffsetY;
            const timeOffset = this.time * 0.003;

            const angle = (this.noise(noisePreX + timeOffset, noisePreY) + 1) * Math.PI;

            const speed = 0.06; // Half speed for soft movement

            p.x += Math.cos(angle) * speed;
            p.y += Math.sin(angle) * speed - 0.04; // Less aggressive upward drift

            // Wrap around
            const buffer = 40;
            if (p.x < -buffer) p.x = this.width + buffer;
            if (p.x > this.width + buffer) p.x = -buffer;
            if (p.y < -buffer) p.y = this.height + buffer;
            if (p.y > this.height + buffer) p.y = -buffer;

            // --- Visuals: Glowy Sparks ---

            // Gentle breathing alpha, no aggressive flashing
            const alpha = 0.6 + Math.sin(this.time * p.pulseSpeed + p.pulsePhase) * 0.4;
            const size = p.sizeBase;

            // Tight, crisp gradient for "spark" look with a brighter core
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 1.5);

            // In light mode, we need slightly darker/more saturated colors for contrast
            const lightnessBase = isDark ? p.light : Math.max(20, p.light - 20);
            const coreLightness = isDark ? 95 : Math.max(40, p.light);

            // Stop 0: Brighter core for "spark" intensity
            gradient.addColorStop(0, `hsla(${p.hue}, 100%, ${coreLightness}%, ${alpha})`);
            // Stop 0.2: Saturated primary color
            gradient.addColorStop(0.2, `hsla(${p.hue}, 100%, ${lightnessBase}%, ${alpha})`);
            // Stop 0.5: Fading saturated color
            gradient.addColorStop(0.5, `hsla(${p.hue}, 100%, ${lightnessBase}%, ${alpha * 0.3})`);
            gradient.addColorStop(1, `hsla(${p.hue}, 100%, ${lightnessBase}%, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalCompositeOperation = 'source-over';
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

let moteSystem = null;

const updatePlantGrowth = (avgScore, skipAnimation = false) => {
    if (!plantEl) return;

    const score = Math.max(0, Math.min(100, Number(avgScore) || 0));
    currentScore = score;
    const renderer = new PlantRenderer(plantEl, skipAnimation);
    plantEl.innerHTML = renderer.render(score);

    // Initialize or update particle system
    if (!moteSystem) { // Lazy init
        const canvas = document.getElementById('mote-canvas');
        if (canvas) moteSystem = new MoteSystem('mote-canvas');
    }

    if (moteSystem) {
        moteSystem.start(score);
    }

    // Mouse Interaction
    if (!plantEl.dataset.hasMouseListener) {
        plantEl.addEventListener('mousemove', (e) => {
            const rect = plantEl.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const container = plantEl.querySelector('.plant-container');
            if (container) {
                const centerX = rect.width / 2;
                const deltaX = (mouseX - centerX) / centerX;
                const lean = deltaX * -5;
                container.style.transform = `rotate(${lean}deg)`;
            }
        });
        plantEl.addEventListener('mouseleave', () => {
            const container = plantEl.querySelector('.plant-container');
            if (container) container.style.transform = '';
        });
        plantEl.dataset.hasMouseListener = 'true';
    }
};

updatePlantGrowth(0, true);

setTimeout(() => {
    const incrementInterval = setInterval(() => {
        currentScore = Math.min(100, currentScore + 1);
        updatePlantGrowth(currentScore, true);
        
        if (currentScore >= 100) {
            clearInterval(incrementInterval);
        }
    }, 20);
}, 1000);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        const isDark = document.body.dataset.theme === 'dark';
        document.body.dataset.theme = isDark ? 'light' : 'dark';
        updatePlantGrowth(currentScore, true);
    }
});
