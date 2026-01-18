const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes loading-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes loading-progress {
        from { width: 0%; }
        to { width: 95%; }
    }
`;
document.head.appendChild(styleSheet);

const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400;1,8..60,600&display=swap';
document.head.appendChild(fontLink);

// --- Constants & Config ---

const GUMLOOP_USER_ID = '0tRVlm6oZphK1PR9l7aZKbtm6F03';
const GUMLOOP_API_KEY = '42e34acecabd4bb8ba6836ed7d7fbdce';
const GUMLOOP_DETECT_PIPELINE = 'iEffyHGNXYf3bgPeV1epnH';
const GUMLOOP_ANALYSIS_PIPELINE = '1gnnojPMpuoQKtPvxbjrNX';
const GUMLOOP_ALTERNATIVES_PIPELINE = '4vnG2foJZQrAfR5n4kWwPo';

// Track last analyzed URL to avoid duplicate runs
let lastAnalyzedUrl = null;
let isAnalyzing = false;
let cachedAlternatives = null;
let cachedCategory = null;

const ICONS_SVG = {
    environmental: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    resource: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    health: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7v6M9 10h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
    social: `<circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M21 21v-2a4 4 0 0 0-3-3.85" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
    sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
};

// Personal view toggle state
let personalViewActive = false;
let cachedUserWeights = { environment: 1.25, social: 1.25, resources: 1.25, health: 1.25 };

// Slider value (0-4) to weight (0.5-1.5)
const sliderToWeight = v => 0.5 + (v / 4);

// Calculate personal score: improved weighting with pivot at 65
// Scores < 65: High importance = PENALTY, Low importance = BOOST
// Scores > 65: High importance = BOOST, Low importance = DAMPEN
const calculatePersonalScore = (scores, weights) => {
    const PIVOT = 85; // Harsh pivot: everything below 85 is considered 'lacking'
    const AMPLIFICATION = 3.0; // Very powerful weighting effect

    const getWeightedScore = (score, weight) => {
        // Amplify the deviation of the weight from 1.0
        const effectiveWeightDelta = (weight - 1) * AMPLIFICATION;
        // Effective weight for calculation = 1 + delta
        // e.g. Weight 1.5 -> Delta 0.5 -> Amp 1.25 -> Eff 2.25
        // e.g. Weight 0.5 -> Delta -0.5 -> Amp -1.25 -> Eff -0.25 (Capped at 0 logic below handles this implicitly?)

        let multiplier;
        if (score >= PIVOT) {
            // Scale from 1.0 at Pivot to `effectiveWeight` at 100
            // Formula: 1 + (W_eff - 1) * progress
            // (W_eff - 1) is simply effectiveWeightDelta
            const progress = (score - PIVOT) / (100 - PIVOT);
            multiplier = 1 + effectiveWeightDelta * progress;
        } else {
            // Scale from 1.0 at Pivot
            // If High Importance (Delta > 0): Penalty.
            // Formula was: 1 + (1 - W) * progress... wait.
            // Let's stick to the Delta mental model.
            // We want Multiplier to go DOWN if Delta is Positive (High Importance)
            // We want Multiplier to go UP if Delta is Negative (Low Importance)

            // At Pivot, multiplier is 1.
            // At 0, we want max effect.

            // Standard Linear Interpolation:
            // Multiplier = 1 - (effectiveWeightDelta * progress)
            // Check:
            // High Imp (Delta +1.25). Progress 1 (Score 0). Mult = 1 - 1.25 = -0.25. (Clamp to 0).
            // Low Imp (Delta -1.25). Progress 1 (Score 0). Mult = 1 - (-1.25) = 2.25. (Big Boost).

            const progress = (PIVOT - score) / PIVOT;
            multiplier = 1 - (effectiveWeightDelta * progress);
        }

        // Safety clamp for multiplier to prevent negative scores
        multiplier = Math.max(0, multiplier);

        return score * multiplier;
    };

    const scaledEnv = getWeightedScore(scores.environmental, weights.environment);
    const scaledRes = getWeightedScore(scores.resource, weights.resources);
    const scaledHealth = getWeightedScore(scores.health, weights.health);
    const scaledSocial = getWeightedScore(scores.social, weights.social);

    const avg = (scaledEnv + scaledRes + scaledHealth + scaledSocial) / 4;
    return Math.round(Math.min(100, Math.max(0, avg)));
};

const THEMES = {
    light: {
        bg: 'hsl(145 30% 97%)',
        card: 'hsl(145 25% 94%)',
        text: 'hsl(155 30% 18%)',
        border: 'hsl(145 20% 80%)',
        accent: 'hsl(155 40% 28%)',
        accentSoft: 'hsl(155 35% 55%)',
        muted: 'hsl(145 15% 50%)',
        shadow: '0 1px 3px hsl(155 20% 50% / 0.25)',
        shadowHover: '0 4px 8px hsl(155 25% 40% / 0.2)',
        progressBg: 'hsl(145 25% 85%)',
        spinnerColor: 'hsl(155 40% 28%)',
        dismissColor: 'hsl(145 15% 50%)',
        dismissHover: 'hsl(155 40% 28%)',
        chartFill: 'hsl(155 40% 28% / 0.2)',
        chartStroke: 'hsl(155 40% 28%)',
        chartAxis: 'hsl(145 20% 80%)',
        btnHover: 'hsl(145 20% 90%)'
    },
    dark: {
        bg: 'hsl(155 25% 10%)',
        card: 'hsl(155 20% 14%)',
        text: 'hsl(145 20% 90%)',
        border: 'hsl(155 15% 25%)',
        accent: 'hsl(155 50% 55%)',
        accentSoft: 'hsl(155 40% 40%)',
        muted: 'hsl(155 15% 50%)',
        shadow: '0 1px 3px hsl(0 0% 0% / 0.4)',
        shadowHover: '0 6px 12px hsl(0 0% 0% / 0.5)',
        progressBg: 'hsl(155 20% 20%)',
        spinnerColor: 'hsl(155 50% 55%)',
        dismissColor: 'hsl(155 15% 50%)',
        dismissHover: 'hsl(155 50% 55%)',
        chartFill: 'hsl(155 50% 55% / 0.2)',
        chartStroke: 'hsl(155 50% 55%)',
        chartAxis: 'hsl(155 15% 25%)',
        btnHover: 'hsl(155 20% 20%)'
    }
};

// --- Helper Functions ---

const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeArc = (cx, cy, r, startA, endA) => {
    const start = polarToCartesian(cx, cy, r, startA);
    const end = polarToCartesian(cx, cy, r, endA);
    const largeArc = endA - startA <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

const getScoreColor = (score, isDark) => {
    // Hue spectrum: 0 = red (0°), 50 = yellow (55°), 100 = sage green (130°)
    const hue = score <= 50
        ? (score / 50) * 55           // 0→55 for scores 0→50
        : 55 + ((score - 50) / 50) * 75; // 55→130 for scores 50→100
    const saturation = 55;
    const lightness = isDark ? 50 : 45;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const renderGaugeChart = (score, isDark, t, isPersonal = false) => {
    const gaugeSize = 160;
    const gaugeCx = gaugeSize / 2;
    const gaugeCy = gaugeSize / 2 + 10;
    const gaugeR = 55;
    const gaugeStroke = 8;
    const startAngle = 220;
    const endAngle = 500;
    const totalArc = endAngle - startAngle;
    const scoreAngle = startAngle + (score / 100) * totalArc;

    const bgArc = describeArc(gaugeCx, gaugeCy, gaugeR, startAngle, endAngle);
    const scoreArc = describeArc(gaugeCx, gaugeCy, gaugeR, startAngle, scoreAngle);
    const scoreColor = getScoreColor(score, isDark);
    const trackColor = isDark ? 'hsl(155 15% 20%)' : 'hsl(145 20% 85%)';

    return `
        <svg viewBox="0 0 ${gaugeSize} ${gaugeSize + 10}" class="score-gauge">
            <defs>
                <filter id="arcShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="${isDark ? 'hsl(0 0% 0%)' : 'hsl(155 20% 30%)'}" flood-opacity="${isDark ? '0.4' : '0.15'}"/>
                </filter>
            </defs>
            <path d="${bgArc}" fill="none" stroke="${trackColor}" stroke-width="${gaugeStroke + 4}" stroke-linecap="round"/>
            <path d="${bgArc}" fill="none" stroke="${t.bg}" stroke-width="${gaugeStroke}" stroke-linecap="round"/>
            <path d="${scoreArc}" fill="none" stroke="${isDark ? 'hsl(155 10% 25%)' : 'hsl(155 15% 70%)'}" stroke-width="${gaugeStroke + 2}" stroke-linecap="round" class="score-arc-border"/>
            <path d="${scoreArc}" fill="none" stroke="${scoreColor}" stroke-width="${gaugeStroke}" stroke-linecap="round" filter="url(#arcShadow)" class="score-arc"/>
            <text x="${gaugeCx}" y="${gaugeCy - 2}" text-anchor="middle" dominant-baseline="middle" class="gauge-score" fill="${t.text}">${score}</text>
            <text x="${gaugeCx}" y="${gaugeCy + 28}" text-anchor="middle" class="gauge-label label-green ${isPersonal ? 'hidden' : ''}" fill="${t.muted}">Green</text>
            <text x="${gaugeCx}" y="${gaugeCy + 40}" text-anchor="middle" class="gauge-label label-green ${isPersonal ? 'hidden' : ''}" fill="${t.muted}">Score</text>
            <text x="${gaugeCx}" y="${gaugeCy + 28}" text-anchor="middle" class="gauge-label label-personal ${isPersonal ? '' : 'hidden'}" fill="${t.muted}">My</text>
            <text x="${gaugeCx}" y="${gaugeCy + 40}" text-anchor="middle" class="gauge-label label-personal ${isPersonal ? '' : 'hidden'}" fill="${t.muted}">Score</text>
        </svg>
    `;
};

const renderRadarChart = (scores, isDark, t) => {
    const radarCx = 90, radarCy = 90, radarR = 50;
    const floorScore = 50;
    const floorRadius = 0.4;

    const toPoint = (angle, value) => {
        const rad = (angle - 90) * Math.PI / 180;
        const clamped = Math.max(0, Math.min(100, value));
        let scaled;
        if (clamped >= floorScore) {
            const range = (clamped - floorScore) / (100 - floorScore);
            scaled = floorRadius + range * (1 - floorRadius);
        } else {
            scaled = (clamped / floorScore) * floorRadius;
        }
        const dist = scaled * radarR;
        return [radarCx + dist * Math.cos(rad), radarCy + dist * Math.sin(rad)];
    };

    const [envX, envY] = toPoint(0, scores.environmental);
    const [resX, resY] = toPoint(90, scores.resource);
    const [hltX, hltY] = toPoint(180, scores.health);
    const [socX, socY] = toPoint(270, scores.social);

    const iconSize = 16;
    const labelGap = 6;
    const labels = [
        { key: 'environmental', text: 'Environmental', x: radarCx - iconSize / 2, y: radarCy - radarR - labelGap - iconSize - 8, score: scores.environmental },
        { key: 'resource', text: 'Resources', x: radarCx + radarR + labelGap, y: radarCy - iconSize / 2, score: scores.resource },
        { key: 'health', text: 'Health', x: radarCx - iconSize / 2, y: radarCy + radarR + labelGap, score: scores.health },
        { key: 'social', text: 'Social', x: radarCx - radarR - labelGap - iconSize, y: radarCy - iconSize / 2, score: scores.social }
    ];

    const labelsSvg = labels.map(l => {
        const captionX = l.x + iconSize / 2;
        const captionY = l.y + iconSize + 8;
        return `
            <g class="chart-label" data-key="${l.key}" data-text="${l.text}" style="cursor: pointer;">
                <rect x="${l.x - 6}" y="${l.y - 6}" width="${iconSize + 12}" height="${iconSize + 24}" fill="transparent" rx="4"/>
                <svg x="${l.x}" y="${l.y}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" style="color: ${t.text}; transition: color 0.2s ease;">
                    ${ICONS_SVG[l.key]}
                </svg>
                <text x="${captionX}" y="${captionY}" text-anchor="middle" class="icon-caption" fill="${t.text}">${l.score}</text>
            </g>
        `;
    }).join('');

    return `
        <svg viewBox="0 0 180 180" class="radar-chart">
            <defs>
                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${t.chartFill};stop-opacity:0.8"/>
                    <stop offset="100%" style="stop-color:${t.chartFill};stop-opacity:0.3"/>
                </linearGradient>
            </defs>
            <line x1="${radarCx}" y1="${radarCy - radarR}" x2="${radarCx}" y2="${radarCy + radarR}" stroke="${t.chartAxis}" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
            <line x1="${radarCx - radarR}" y1="${radarCy}" x2="${radarCx + radarR}" y2="${radarCy}" stroke="${t.chartAxis}" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
            <polygon points="${radarCx},${radarCy - radarR} ${radarCx + radarR},${radarCy} ${radarCx},${radarCy + radarR} ${radarCx - radarR},${radarCy}" fill="none" stroke="${t.chartAxis}" stroke-width="1" opacity="0.4"/>
            <polygon points="${radarCx},${radarCy - radarR * floorRadius} ${radarCx + radarR * floorRadius},${radarCy} ${radarCx},${radarCy + radarR * floorRadius} ${radarCx - radarR * floorRadius},${radarCy}" fill="none" stroke="${t.chartAxis}" stroke-width="0.5" opacity="0.35" stroke-dasharray="3,2"/>
            <polygon points="${envX},${envY} ${resX},${resY} ${hltX},${hltY} ${socX},${socY}" fill="url(#radarGradient)" stroke="${t.chartStroke}" stroke-width="2" stroke-linejoin="round" class="data-polygon"/>
            <circle cx="${envX}" cy="${envY}" r="3" fill="${t.chartStroke}"/>
            <circle cx="${resX}" cy="${resY}" r="3" fill="${t.chartStroke}"/>
            <circle cx="${hltX}" cy="${hltY}" r="3" fill="${t.chartStroke}"/>
            <circle cx="${socX}" cy="${socY}" r="3" fill="${t.chartStroke}"/>
            ${labelsSvg}
        </svg>
    `;
};

// --- Application Logic ---

// Track state
let currentDarkMode = false;
let cachedScores = null;
let cachedJustifications = null;
let cachedPopup = null;

// UI Elements (created once and reused/appended)
const snackbar = document.createElement('div');
snackbar.id = 'loading-snackbar';
const progressBar = document.createElement('div');
progressBar.id = 'loading-progress';
const spinner = document.createElement('div');
spinner.id = 'loading-spinner';
const textSpan = document.createElement('span');
textSpan.textContent = 'Sustainify Analyzing...';
const dismissBtn = document.createElement('button');
dismissBtn.id = 'loading-dismiss';
dismissBtn.innerHTML = '×';
dismissBtn.setAttribute('aria-label', 'Dismiss');

snackbar.append(progressBar, spinner, textSpan, dismissBtn);

const pollPipeline = (runId, onComplete, onError) => {
    const poll = () => {
        fetch(`https://api.gumloop.com/api/v1/get_pl_run?run_id=${runId}&user_id=${GUMLOOP_USER_ID}`, {
            headers: { 'Authorization': `Bearer ${GUMLOOP_API_KEY}` }
        })
            .then(res => res.json())
            .then(result => {
                console.log('Poll result:', result.state);
                if (result.state === 'DONE') onComplete(result.outputs);
                else if (result.state === 'RUNNING') setTimeout(poll, 500);
                else onError?.(result);
            })
            .catch(onError);
    };
    poll();
};




const startPipeline = (pipelineId, inputContent, inputName = 'Product Content') => {
    return fetch(`https://api.gumloop.com/api/v1/start_pipeline?user_id=${GUMLOOP_USER_ID}&saved_item_id=${pipelineId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GUMLOOP_API_KEY}` },
        body: JSON.stringify({ [inputName]: inputContent })
    }).then(res => res.json());
};

const getPageText = () => {
    return document.body.innerText;
};

const applyAlternativesToTiles = (tiles, items) => {
    tiles.forEach((tile, i) => {
        const num = i + 1;
        const brand = items[`item${num}_brand`] || '';
        const link = items[`item${num}_link`] || '';

        tile.classList.remove('loading');
        if (brand && link) {
            tile.innerHTML = `<a href="${link}" target="_blank" class="alt-link">${brand}</a>`;
        } else if (brand) {
            tile.innerHTML = `<span class="alt-text">${brand}</span>`;
        } else {
            tile.innerHTML = `<span class="alt-text alt-empty">—</span>`;
        }
    });
};

const showAlternativesError = () => {
    cachedAlternatives = { error: true };
    const tilesContainer = document.querySelector('#sustainify-results .alt-tiles');
    if (tilesContainer) {
        tilesContainer.innerHTML = '<div class="alt-error">No similar items found</div>';
    }
};

// Main Execution Flow - wrapped in a function for SPA navigation support
const runPageAnalysis = () => {
    const currentUrl = window.location.href;

    // Skip if already analyzing or if URL hasn't changed
    if (isAnalyzing || currentUrl === lastAnalyzedUrl) {
        console.log('Sustainify: Skipping - already analyzing or same URL');
        return;
    }

    // Remove any existing popup when navigating to new page
    if (cachedPopup) {
        cachedPopup.remove();
        cachedPopup = null;
        cachedScores = null;
        cachedJustifications = null;
    }

    console.log('Sustainify: Checking page...', currentUrl);
    isAnalyzing = true;
    lastAnalyzedUrl = currentUrl;

    startPipeline(GUMLOOP_DETECT_PIPELINE, currentUrl, 'URL')
        .then(data => {
            console.log('Detection pipeline started, run_id:', data.run_id);
            pollPipeline(data.run_id, (outputs) => {
                console.log('Detection result:', outputs);
                const isProduct = Object.values(outputs).some(v => v === '1' || v === 1);

                if (!isProduct) {
                    console.log('Sustainify: Not a product page, skipping analysis');
                    isAnalyzing = false;
                    return;
                }

                console.log('Sustainify: Product detected, starting analysis...');
                const pageText = getPageText();
                showSnackbar();

                // Start alternatives pipeline concurrently
                startPipeline(GUMLOOP_ALTERNATIVES_PIPELINE, pageText, 'scraped_page_data')
                    .then(altData => {
                        console.log('Alternatives pipeline started, run_id:', altData.run_id);
                        pollPipeline(altData.run_id, (altOutputs) => {
                            console.log('Alternatives complete:', altOutputs);

                            // Parse the JSON output (may be wrapped in markdown code blocks)
                            let items = {};
                            try {
                                const rawOutput = altOutputs.output || '';
                                const jsonStr = rawOutput.replace(/```json\n?|\n?```/g, '').trim();
                                items = JSON.parse(jsonStr);
                            } catch (e) {
                                console.error('Failed to parse alternatives:', e);
                            }

                            // Cache alternatives
                            cachedAlternatives = items;

                            // Populate alt tiles if popup exists
                            const tiles = document.querySelectorAll('#sustainify-results .alt-tile');
                            if (tiles.length > 0) {
                                applyAlternativesToTiles(tiles, items);
                            }
                        }, err => {
                            console.error('Alternatives failed:', err);
                            showAlternativesError();
                        });
                    })
                    .catch(err => {
                        console.error('Failed to start alternatives:', err);
                        showAlternativesError();
                    });

                // Start analysis pipeline
                startPipeline(GUMLOOP_ANALYSIS_PIPELINE, pageText, 'Product Content')
                    .then(analysisData => {
                        console.log('Analysis pipeline started, run_id:', analysisData.run_id);
                        pollPipeline(analysisData.run_id, (analysisOutputs) => {
                            console.log('Analysis complete:', analysisOutputs);
                            isAnalyzing = false;

                            // Smooth finish animation
                            const currentWidth = window.getComputedStyle(progressBar).width;
                            progressBar.style.width = currentWidth;
                            progressBar.style.animation = 'none';
                            progressBar.offsetHeight; // Force reflow

                            progressBar.style.transition = 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)'; // Fast zoom to end
                            progressBar.style.width = '100%';
                            progressBar.style.borderRight = 'none';

                            setTimeout(() => {
                                snackbar.style.opacity = '0';
                                snackbar.style.transform = 'translateY(-10px) scale(0.98)';
                                setTimeout(() => snackbar.remove(), 350);
                                showResultsPopup(analysisOutputs);
                            }, 250);
                        }, err => { console.error('Analysis failed:', err); isAnalyzing = false; });
                    })
                    .catch(err => { console.error('Failed to start analysis:', err); isAnalyzing = false; });
            }, err => { console.error('Detection failed:', err); isAnalyzing = false; });
        })
        .catch(err => { console.error('Failed to start detection:', err); isAnalyzing = false; });
};

// SPA Navigation Detection - poll for URL changes (most reliable method)
let lastCheckedUrl = window.location.href;

const checkForUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastCheckedUrl) {
        console.log('Sustainify: URL change detected', lastCheckedUrl, '->', currentUrl);
        lastCheckedUrl = currentUrl;

        // Dismiss popup when leaving the page
        if (cachedPopup) {
            cachedPopup.style.opacity = '0';
            cachedPopup.style.transform = 'translateY(-12px) scale(0.96)';
            setTimeout(() => {
                cachedPopup.remove();
                cachedPopup = null;
                cachedScores = null;
                cachedJustifications = null;
                cachedAlternatives = null;
                cachedCategory = null;
            }, 400);
        }

        // Delay slightly to let page content load
        setTimeout(runPageAnalysis, 300);
    }
};

// Poll for URL changes every 500ms
setInterval(checkForUrlChange, 500);

// Also listen for popstate (back/forward buttons)
window.addEventListener('popstate', () => {
    console.log('Sustainify: popstate detected');
    setTimeout(checkForUrlChange, 100);
});

// Run on initial page load
runPageAnalysis();

// UI Render Logic
const rerenderAnalysisPanel = (popup, scores, justifications) => {
    if (!popup) return;
    const isDark = currentDarkMode;
    const t = isDark ? THEMES.dark : THEMES.light;
    const normalScore = Math.round((scores.environmental + scores.health + scores.resource + scores.social) / 4);
    const displayScore = personalViewActive ? calculatePersonalScore(scores, cachedUserWeights) : normalScore;

    // Update Popup Styles
    Object.assign(popup.style, { background: t.bg, color: t.text, borderColor: t.border, boxShadow: t.shadow });

    const themeBtn = popup.querySelector('.theme-toggle-btn');
    if (themeBtn) {
        themeBtn.innerHTML = isDark ? ICONS_SVG.sun : ICONS_SVG.moon;
        Object.assign(themeBtn.style, { borderColor: t.border, color: t.accent });
    }

    const homeBtn = popup.querySelector('.home-btn');
    if (homeBtn) {
        Object.assign(homeBtn.style, { borderColor: t.border, color: t.accent });
    }

    const closeBtn = popup.querySelector('button[aria-label="Close"]');
    if (closeBtn) closeBtn.style.color = t.dismissColor;

    const tooltip = popup.querySelector('.chart-tooltip');
    if (tooltip) Object.assign(tooltip.style, { background: t.card, borderColor: t.border, boxShadow: t.shadowHover });

    const hoverHint = popup.querySelector('.hover-hint');
    if (hoverHint) hoverHint.style.color = t.muted;

    const suggestedSection = popup.querySelector('.suggested-section');
    if (suggestedSection) suggestedSection.style.borderTopColor = t.border;



    // Rerender Charts with correct score based on personal view state
    const gaugeContainer = popup.querySelector('.gauge-container');
    if (gaugeContainer) gaugeContainer.innerHTML = renderGaugeChart(displayScore, isDark, t, personalViewActive);

    const radarContainer = popup.querySelector('.radar-container');
    if (radarContainer) radarContainer.innerHTML = renderRadarChart(scores, isDark, t);

    // Update Styles
    const styleTag = popup.querySelector('style');
    if (styleTag) styleTag.textContent = getPopupStyles(t, isDark);

    // Reattach hover listeners since radar chart was replaced
    setupTooltipListeners(popup, scores, justifications);
};

const showResultsPopup = (outputs) => {
    const scores = {
        environmental: parseInt(outputs['Environmental Score']) || 50,
        health: parseInt(outputs['Health Score']) || 50,
        resource: parseInt(outputs['Resource Score']) || 50,
        social: parseInt(outputs['Social Score']) || 50
    };

    const justifications = {
        environmental: outputs['Environmental Justification'] || 'No data available',
        health: outputs['Health Justification'] || 'No data available',
        resource: outputs['Resource Justification'] || 'No data available',
        social: outputs['Social Justification'] || 'No data available'
    };

    cachedScores = scores;
    cachedJustifications = justifications;
    cachedCategory = outputs['category'] || outputs['Category'] || '';

    chrome.storage.sync.get(['darkMode'], prefs => {
        currentDarkMode = prefs.darkMode ?? false;
        const isDark = currentDarkMode;
        const t = isDark ? THEMES.dark : THEMES.light;
        const averageScore = Math.round((scores.environmental + scores.health + scores.resource + scores.social) / 4);

        const popup = document.createElement('div');
        popup.id = 'sustainify-results';

        const suggestedSection = `
            <div class="suggested-section">
                <div class="suggested-header">Suggested Alternatives</div>
                <div class="alt-tiles">
                    <div class="alt-tile loading"><div class="shimmer"></div></div>
                    <div class="alt-tile loading"><div class="shimmer"></div></div>
                    <div class="alt-tile loading"><div class="shimmer"></div></div>
                </div>
            </div>
        `;

        const stashBtn = document.createElement('button');
        stashBtn.className = 'stash-btn';
        stashBtn.innerHTML = `<span class="stash-text">Save to Stash</span>`;

        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';

        const themeBtn = document.createElement('button');
        themeBtn.className = 'theme-toggle-btn';
        themeBtn.setAttribute('aria-label', 'Toggle theme');
        themeBtn.innerHTML = isDark ? ICONS_SVG.sun : ICONS_SVG.moon;

        const homeBtn = document.createElement('button');
        homeBtn.className = 'home-btn';
        homeBtn.setAttribute('aria-label', 'Open Dashboard');
        homeBtn.innerHTML = ICONS_SVG.home;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close');

        popup.innerHTML = `
            <div class="gauge-container">${renderGaugeChart(averageScore, isDark, t, false)}</div>
            <div class="hover-hint">hover icons for explanation</div>
            <div class="radar-container">${renderRadarChart(scores, isDark, t)}</div>
            ${suggestedSection}
        `;
        popup.append(tooltip, themeBtn, homeBtn, closeBtn, stashBtn);

        // --- Styles & Events ---

        // Styles injection
        const styleTag = document.createElement('style');
        styleTag.textContent = getPopupStyles(t, isDark); // See helper below
        popup.appendChild(styleTag);

        Object.assign(popup.style, {
            position: 'fixed', top: '16px', right: '16px', padding: '20px 24px 16px',
            fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px',
            background: t.bg, color: t.text, border: `1px solid ${t.border}`,
            borderRadius: '10px', boxShadow: t.shadow, zIndex: '1000001',
            opacity: '0', transform: 'translateY(-12px) scale(0.96)',
            transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            width: '280px', maxWidth: 'calc(100vw - 32px)'
        });

        // Button Styles
        Object.assign(themeBtn.style, {
            position: 'absolute', top: '10px', left: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center',
            width: '28px', height: '28px', border: `1px solid ${t.border}`, padding: '0', margin: '0',
            borderRadius: '6px', color: t.accent, cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s'
        });

        // Home Button Styles
        Object.assign(homeBtn.style, {
            position: 'absolute', top: '10px', left: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center',
            width: '28px', height: '28px', border: `1px solid ${t.border}`, padding: '0', margin: '0',
            borderRadius: '6px', color: t.accent, cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s'
        });

        Object.assign(closeBtn.style, {
            position: 'absolute', top: '10px', right: '12px', background: 'none', border: 'none',
            fontSize: '20px', cursor: 'pointer', color: t.dismissColor, lineHeight: '1',
            transition: 'color 0.2s, transform 0.2s', opacity: '0.7'
        });

        // Event Listeners
        themeBtn.addEventListener('click', () => {
            currentDarkMode = !currentDarkMode;
            chrome.storage.sync.set({ darkMode: currentDarkMode });
            // Rerender will happen via storage listener, but we call it here for instant feel
            rerenderAnalysisPanel(popup, scores, justifications);
        });

        homeBtn.addEventListener('click', () => {
            window.open(chrome.runtime.getURL('dashboard.html'), '_blank');
        });


        stashBtn.addEventListener('click', () => {
            if (stashBtn.classList.contains('saved')) return;

            const productName = document.title || 'Unknown Product';
            const productUrl = window.location.href;
            const avgScore = Math.round((scores.environmental + scores.health + scores.resource + scores.social) / 4);
            const stashItem = {
                name: productName,
                link: productUrl,
                scores: { ...scores, average: avgScore },
                type: cachedCategory,
                timestamp: new Date().toISOString()
            };

            chrome.storage.sync.get(['stash'], result => {
                const stash = result.stash ? JSON.parse(result.stash) : [];
                stash.push(stashItem);
                chrome.storage.sync.set({ stash: JSON.stringify(stash) }, () => {
                    stashBtn.classList.add('saved');
                    stashBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span class="stash-text">Saved to Stash</span>
                    `;
                });
            });
        });

        // Gauge click to toggle personal/green score view
        const gaugeContainer = popup.querySelector('.gauge-container');
        gaugeContainer.addEventListener('click', () => {
            personalViewActive = !personalViewActive;

            // Load weights from storage and calculate personal score
            chrome.storage.sync.get(['environment', 'social', 'resources', 'health'], prefs => {
                console.log('Sustainify - Slider prefs from storage:', prefs);
                const weights = {
                    environment: sliderToWeight(prefs.environment ?? 3),
                    social: sliderToWeight(prefs.social ?? 3),
                    resources: sliderToWeight(prefs.resources ?? 3),
                    health: sliderToWeight(prefs.health ?? 3)
                };
                console.log('Sustainify - Calculated weights:', weights);
                cachedUserWeights = weights;

                const normalScore = Math.round((scores.environmental + scores.health + scores.resource + scores.social) / 4);
                const personalScore = calculatePersonalScore(scores, weights);
                console.log('Sustainify - Scores:', { normalScore, personalScore, scores });
                const targetScore = personalViewActive ? personalScore : normalScore;

                const isDark = currentDarkMode;
                const t = isDark ? THEMES.dark : THEMES.light;

                // Cross-fade labels
                const labelGreens = gaugeContainer.querySelectorAll('.label-green');
                const labelPersonals = gaugeContainer.querySelectorAll('.label-personal');
                labelGreens.forEach(el => el.classList.toggle('hidden', personalViewActive));
                labelPersonals.forEach(el => el.classList.toggle('hidden', !personalViewActive));

                // Animate score number and arc
                const scoreText = gaugeContainer.querySelector('.gauge-score');
                const scoreArc = gaugeContainer.querySelector('.score-arc');
                const scoreArcBorder = gaugeContainer.querySelector('.score-arc-border');

                const startScore = parseInt(scoreText.textContent);
                const duration = 400;
                const startTime = performance.now();

                const animateScore = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                    const currentScore = Math.round(startScore + (targetScore - startScore) * eased);

                    scoreText.textContent = currentScore;

                    // Update arc
                    const startAngle = 220, endAngle = 500;
                    const totalArc = endAngle - startAngle;
                    const scoreAngle = startAngle + (currentScore / 100) * totalArc;
                    const newArc = describeArc(80, 90, 55, startAngle, scoreAngle);
                    scoreArc.setAttribute('d', newArc);
                    scoreArcBorder.setAttribute('d', newArc);
                    scoreArc.style.stroke = getScoreColor(currentScore, isDark);

                    if (progress < 1) requestAnimationFrame(animateScore);
                };
                requestAnimationFrame(animateScore);
            });
        });

        closeBtn.addEventListener('mouseenter', () => { closeBtn.style.color = t.dismissHover; closeBtn.style.transform = 'scale(1.15)'; closeBtn.style.opacity = '1'; });
        closeBtn.addEventListener('mouseleave', () => { closeBtn.style.color = t.dismissColor; closeBtn.style.transform = 'scale(1)'; closeBtn.style.opacity = '0.7'; });
        closeBtn.addEventListener('click', () => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(-12px) scale(0.96)';
            setTimeout(() => popup.remove(), 400);
        });

        cachedPopup = popup;
        document.body.appendChild(popup);

        setupTooltipListeners(popup, scores, justifications);

        // Apply cached alternatives if they loaded before the popup
        if (cachedAlternatives) {
            if (cachedAlternatives.error) {
                const tilesContainer = popup.querySelector('.alt-tiles');
                if (tilesContainer) tilesContainer.innerHTML = '<div class="alt-error">No similar items found</div>';
            } else {
                const tiles = popup.querySelectorAll('.alt-tile');
                applyAlternativesToTiles(tiles, cachedAlternatives);
            }
        }

        requestAnimationFrame(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translateY(0) scale(1)';
        });
    });
};

const setupTooltipListeners = (popup, scores, justifications) => {
    const tooltip = popup.querySelector('.chart-tooltip');

    // Remove old listeners? The elements are replaced so no need to clean up old listeners manually.
    const chartLabels = popup.querySelectorAll('.chart-label');

    chartLabels.forEach(label => {
        label.addEventListener('mouseenter', () => {
            const key = label.dataset.key;
            tooltip.innerHTML = `
                <div class="tooltip-title">
                    ${label.dataset.text}
                    <span class="tooltip-score">${scores[key]}/100</span>
                </div>
                <div class="tooltip-text">${justifications[key]}</div>
            `;

            const labelRect = label.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();
            const labelCenterX = labelRect.left + labelRect.width / 2 - popupRect.left;
            const labelBottom = labelRect.bottom - popupRect.top;

            tooltip.style.top = (labelBottom + 10) + 'px';
            tooltip.classList.add('visible');

            requestAnimationFrame(() => {
                const tooltipWidth = tooltip.offsetWidth;
                const popupWidth = popupRect.width;
                const padding = 10;
                let left = labelCenterX - tooltipWidth / 2;
                if (left < padding) left = padding;
                else if (left + tooltipWidth > popupWidth - padding) left = popupWidth - tooltipWidth - padding;
                tooltip.style.left = left + 'px';
            });
        });

        label.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
    });
};

const getPopupStyles = (t, isDark) => `
    @keyframes arcDraw { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
    
    /* Clickable gauge for toggle */
    #sustainify-results .gauge-container { 
        width: 100%; 
        display: flex; 
        justify-content: center; 
        cursor: pointer;
        transition: transform 0.15s ease;
    }
    #sustainify-results .gauge-container:hover {
        transform: scale(1.02);
    }
    #sustainify-results .gauge-container:active {
        transform: scale(0.98);
    }
    
    #sustainify-results .theme-toggle-btn svg { display: block; }
    #sustainify-results .theme-toggle-btn, #sustainify-results .home-btn { background: transparent; }
    #sustainify-results .theme-toggle-btn:hover, #sustainify-results .home-btn:hover { background-color: ${t.btnHover} !important; }
    #sustainify-results .score-gauge { width: 160px; height: 170px; }
    #sustainify-results .score-arc, #sustainify-results .score-arc-border { stroke-dasharray: 300; animation: arcDraw 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    #sustainify-results .gauge-score { font-size: 42px; font-weight: 600; font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.02em; transition: opacity 0.3s ease; }
    #sustainify-results .gauge-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'Source Serif 4', Georgia, serif; transition: opacity 0.3s ease; }
    #sustainify-results .gauge-label.hidden { opacity: 0; }
    #sustainify-results .label-green, #sustainify-results .label-personal { transition: opacity 0.3s ease; }
    #sustainify-results .hover-hint { font-size: 10px; font-style: italic; color: ${t.muted}; text-align: center; opacity: 0.7; margin-top: -20px; }
    #sustainify-results .radar-container { width: 100%; display: flex; justify-content: center; margin-top: -4px; }
    #sustainify-results .radar-chart { width: 200px; height: 170px; }
    #sustainify-results .icon-caption { font-size: 9px; font-weight: 600; opacity: 0.75; font-family: 'Source Serif 4', Georgia, serif; }
    #sustainify-results .chart-label { cursor: pointer; }
    #sustainify-results .chart-label:hover svg { color: ${t.chartStroke} !important; }
    #sustainify-results .chart-label:hover .icon-caption { opacity: 1; }
    #sustainify-results .data-polygon { transition: opacity 0.3s ease; }
    #sustainify-results .suggested-section { width: 100%; margin-top: 8px; padding-top: 12px; border-top: 1px solid ${t.border}; }
    #sustainify-results .suggested-header { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: ${t.accent}; margin-bottom: 10px; }
    
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
    
    #sustainify-results .alt-tiles {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
    }
    
    #sustainify-results .alt-tile {
        width: 100%;
        height: 24px;
        border-radius: 8px;
        background: ${t.card};
        position: relative;
        overflow: hidden;
    }
    
    #sustainify-results .alt-tile.loading .shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            ${t.progressBg} 50%,
            transparent 100%
        );
        animation: shimmer 1.8s infinite ease-in-out;
    }
    
    #sustainify-results .alt-link, #sustainify-results .alt-text {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-size: 11px;
        font-weight: 600;
        text-decoration: none;
        color: ${t.text};
        transition: color 0.2s;
    }
    
    #sustainify-results .alt-link:hover {
        color: ${t.accent};
    }
    
    #sustainify-results .alt-empty {
        color: ${t.muted};
        font-weight: 400;
    }

    #sustainify-results .alt-error {
        width: 100%;
        text-align: center;
        font-size: 11px;
        color: ${t.muted};
        font-style: italic;
        padding: 8px 0;
    }
    
    #sustainify-results .stash-btn {
        width: 100%;
        padding: 11px 16px;
        margin-top: 12px;
        background: transparent;
        color: ${t.accent};
        border: 1.5px solid ${t.border};
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        font-family: 'Source Serif 4', Georgia, serif;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    
    #sustainify-results .stash-btn:hover:not(.saved) {
        background: ${t.card};
        border-color: ${t.accent};
        transform: translateY(-1px);
    }
    
    #sustainify-results .stash-btn:active:not(.saved) {
        transform: translateY(0);
    }
    
    #sustainify-results .stash-btn.saved {
        background: ${isDark ? 'hsl(155 30% 18%)' : 'hsl(155 35% 92%)'};
        border-color: ${t.accent};
        cursor: default;
    }
    
    #sustainify-results .chart-tooltip {
        position: absolute; background: ${t.card}; border: 1px solid ${t.border}; border-radius: 10px;
        padding: 12px 16px; font-size: 12px; line-height: 1.5; max-width: 260px; width: max-content;
        box-shadow: ${t.shadowHover}; opacity: 0; visibility: hidden; transform: translateY(6px);
        transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s; pointer-events: none; z-index: 100;
        :first-child {
            font-size: 15px;
        }
    }
    #sustainify-results .chart-tooltip.visible { opacity: 1; visibility: visible; transform: translateY(0); }
    #sustainify-results .chart-tooltip .tooltip-title { font-weight: 600; color: ${t.accent}; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
    #sustainify-results .chart-tooltip .tooltip-score { 
        font-size: 12px; 
        color: ${t.text}; 
        background: ${t.bg}; 
        padding: 0 10px; 
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        line-height: 1;
        font-feature-settings: "tnum";
    }
    #sustainify-results .chart-tooltip .tooltip-text { color: ${t.text}; opacity: 0.85; line-height: 1.6; }
`;

const applyTheme = dark => {
    const t = dark ? THEMES.dark : THEMES.light;
    Object.assign(snackbar.style, { background: t.bg, color: t.text, borderColor: t.border, boxShadow: t.shadow });
    progressBar.style.background = t.progressBg;
    progressBar.style.borderRight = `1px solid ${t.accent}`;
    spinner.style.borderTopColor = t.spinnerColor;
    spinner.style.borderRightColor = t.spinnerColor;
    dismissBtn.style.color = t.dismissColor;
    dismissBtn.dataset.hoverColor = t.dismissHover;
};

// Apply styles to initial snackbar
Object.assign(snackbar.style, {
    position: 'fixed', top: '16px', right: '16px', padding: '12px 18px 12px 14px',
    fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '13px', fontWeight: 'normal',
    fontStyle: 'italic', letterSpacing: '0.01em', border: '1px solid', borderRadius: '10px',
    zIndex: '1000000', opacity: '0', transform: 'translateY(-10px) scale(0.98)',
    transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s, color 0.3s, box-shadow 0.3s',
    display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden'
});

Object.assign(progressBar.style, {
    position: 'absolute', top: '0', left: '0', height: '100%', width: '0%',
    borderRadius: '5px 0 0 5px', opacity: '0.5', animation: 'loading-progress 6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
    pointerEvents: 'none', zIndex: '0'
});

Object.assign(spinner.style, {
    width: '14px', height: '14px', border: '2px solid transparent', borderRadius: '50%',
    animation: 'loading-spin 1s cubic-bezier(0.45, 0.2, 0.55, 0.8) infinite', flexShrink: '0', position: 'relative', zIndex: '1'
});

Object.assign(textSpan.style, { position: 'relative', zIndex: '1' });

Object.assign(dismissBtn.style, {
    position: 'relative', zIndex: '1', background: 'none', border: 'none', fontSize: '18px',
    fontWeight: '400', lineHeight: '1', cursor: 'pointer', padding: '0 0 0 6px', marginLeft: 'auto',
    transition: 'color 0.2s, transform 0.2s'
});

// Snackbar Event Listeners
dismissBtn.addEventListener('mouseenter', () => { dismissBtn.style.color = dismissBtn.dataset.hoverColor; dismissBtn.style.transform = 'scale(1.1)'; });
dismissBtn.addEventListener('mouseleave', () => { const t = currentDarkMode ? THEMES.dark : THEMES.light; dismissBtn.style.color = t.dismissColor; dismissBtn.style.transform = 'scale(1)'; });
dismissBtn.addEventListener('click', () => { snackbar.style.opacity = '0'; snackbar.style.transform = 'translateY(-10px) scale(0.98)'; setTimeout(() => snackbar.remove(), 350); });

const showSnackbar = () => {
    document.body.appendChild(snackbar);
    chrome.storage.sync.get(['darkMode'], prefs => {
        currentDarkMode = prefs.darkMode ?? false;
        applyTheme(currentDarkMode);
    });
    requestAnimationFrame(() => { snackbar.style.opacity = '1'; snackbar.style.transform = 'translateY(0) scale(1)'; });
};

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.darkMode) {
        currentDarkMode = changes.darkMode.newValue;
        if (document.getElementById('loading-snackbar')) applyTheme(currentDarkMode);
        if (cachedPopup && cachedScores && cachedJustifications) rerenderAnalysisPanel(cachedPopup, cachedScores, cachedJustifications);
    }
});
