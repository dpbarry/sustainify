const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes loading-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes loading-progress {
        from { width: 0%; }
        to { width: 100%; }
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
const PAGE_URL = window.location.href;

const ICONS_SVG = {
    environmental: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    resource: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    health: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7v6M9 10h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
    social: `<circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M21 21v-2a4 4 0 0 0-3-3.85" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
    sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
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
        chartAxis: 'hsl(145 20% 80%)'
    },
    dark: {
        bg: 'hsl(155 25% 10%)',
        card: 'hsl(155 20% 14%)',
        text: 'hsl(145 20% 90%)',
        border: 'hsl(155 15% 25%)',
        accent: 'hsl(155 50% 55%)',
        accentSoft: 'hsl(155 40% 40%)',
        muted: 'hsl(155 15% 50%)',
        shadow: '0 1px 3px hsl(0 0% 0% / 0.4), inset 0 1px 0 hsl(155 20% 20%)',
        shadowHover: '0 6px 12px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(155 20% 22%)',
        progressBg: 'hsl(155 20% 20%)',
        spinnerColor: 'hsl(155 50% 55%)',
        dismissColor: 'hsl(155 15% 50%)',
        dismissHover: 'hsl(155 50% 55%)',
        chartFill: 'hsl(155 50% 55% / 0.2)',
        chartStroke: 'hsl(155 50% 55%)',
        chartAxis: 'hsl(155 15% 25%)'
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
    if (score >= 70) {
        const ratio = (score - 70) / 30;
        return isDark
            ? `hsl(155, ${40 + ratio * 10}%, ${45 + ratio * 10}%)`
            : `hsl(155, ${35 + ratio * 5}%, ${25 + ratio * 3}%)`;
    } else if (score >= 40) {
        const ratio = (score - 40) / 30;
        return `hsl(${35 + ratio * 120}, ${45 + ratio * 10}%, ${isDark ? 50 : 35}%)`;
    } else {
        const ratio = score / 40;
        return `hsl(${ratio * 35}, ${55 + ratio * 10}%, ${isDark ? 45 : 38}%)`;
    }
};

const renderGaugeChart = (score, isDark, t) => {
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
            <text x="${gaugeCx}" y="${gaugeCy + 28}" text-anchor="middle" class="gauge-label" fill="${t.muted}">Green</text>
            <text x="${gaugeCx}" y="${gaugeCy + 40}" text-anchor="middle" class="gauge-label" fill="${t.muted}">Score</text>
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
                else if (result.state === 'RUNNING') setTimeout(poll, 1000);
                else onError?.(result);
            })
            .catch(onError);
    };
    poll();
};

const startPipeline = (pipelineId, inputName = 'URL') => {
    return fetch(`https://api.gumloop.com/api/v1/start_pipeline?user_id=${GUMLOOP_USER_ID}&saved_item_id=${pipelineId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GUMLOOP_API_KEY}` },
        body: JSON.stringify({ [inputName]: PAGE_URL })
    }).then(res => res.json());
};

// Main Execution Flow
console.log('Sustainify: Checking page...');

startPipeline(GUMLOOP_DETECT_PIPELINE)
    .then(data => {
        console.log('Detection pipeline started, run_id:', data.run_id);
        pollPipeline(data.run_id, (outputs) => {
            console.log('Detection result:', outputs);
            const isProduct = Object.values(outputs).some(v => v === '1' || v === 1);

            if (!isProduct) {
                console.log('Sustainify: Not a product page, skipping analysis');
                return;
            }

            console.log('Sustainify: Product detected, starting analysis...');
            showSnackbar();

            startPipeline(GUMLOOP_ANALYSIS_PIPELINE, 'Product URL')
                .then(analysisData => {
                    console.log('Analysis pipeline started, run_id:', analysisData.run_id);
                    pollPipeline(analysisData.run_id, (analysisOutputs) => {
                        console.log('Analysis complete:', analysisOutputs);
                        progressBar.style.animation = 'none';
                        progressBar.style.width = '100%';
                        progressBar.style.transition = 'width 0.1s ease';

                        setTimeout(() => {
                            snackbar.style.opacity = '0';
                            snackbar.style.transform = 'translateY(-10px) scale(0.98)';
                            setTimeout(() => snackbar.remove(), 350);
                            showResultsPopup(analysisOutputs);
                        }, 400);
                    }, err => console.error('Analysis failed:', err));
                })
                .catch(err => console.error('Failed to start analysis:', err));
        }, err => console.error('Detection failed:', err));
    })
    .catch(err => console.error('Failed to start detection:', err));

// UI Render Logic
const rerenderAnalysisPanel = (popup, scores, justifications) => {
    if (!popup) return;
    const isDark = currentDarkMode;
    const t = isDark ? THEMES.dark : THEMES.light;
    const averageScore = Math.round((scores.environmental + scores.health + scores.resource + scores.social) / 4);

    // Update Popup Styles
    Object.assign(popup.style, { background: t.bg, color: t.text, borderColor: t.border, boxShadow: t.shadow });

    const themeBtn = popup.querySelector('.theme-toggle-btn');
    if (themeBtn) {
        themeBtn.innerHTML = isDark ? ICONS_SVG.sun : ICONS_SVG.moon;
        Object.assign(themeBtn.style, { borderColor: t.border, color: t.accent });
    }

    const closeBtn = popup.querySelector('button[aria-label="Close"]');
    if (closeBtn) closeBtn.style.color = t.dismissColor;

    const tooltip = popup.querySelector('.chart-tooltip');
    if (tooltip) Object.assign(tooltip.style, { background: t.card, borderColor: t.border, boxShadow: t.shadowHover });

    const hoverHint = popup.querySelector('.hover-hint');
    if (hoverHint) hoverHint.style.color = t.muted;

    const suggestedSection = popup.querySelector('.suggested-section');
    if (suggestedSection) suggestedSection.style.borderTopColor = t.border;

    // Rerender Charts
    const gaugeContainer = popup.querySelector('.gauge-container');
    if (gaugeContainer) gaugeContainer.innerHTML = renderGaugeChart(averageScore, isDark, t);

    const radarContainer = popup.querySelector('.radar-container');
    if (radarContainer) radarContainer.innerHTML = renderRadarChart(scores, isDark, t);

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
                <div class="suggested-empty">Coming soon...</div>
            </div>
        `;

        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';

        const themeBtn = document.createElement('button');
        themeBtn.className = 'theme-toggle-btn';
        themeBtn.setAttribute('aria-label', 'Toggle theme');
        themeBtn.innerHTML = isDark ? ICONS_SVG.sun : ICONS_SVG.moon;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close');

        popup.innerHTML = `
            <div class="gauge-container">${renderGaugeChart(averageScore, isDark, t)}</div>
            <div class="hover-hint">hover icons for explanation</div>
            <div class="radar-container">${renderRadarChart(scores, isDark, t)}</div>
            ${suggestedSection}
        `;
        popup.append(tooltip, themeBtn, closeBtn);

        // --- Styles & Events ---

        // Styles injection
        const styleTag = document.createElement('style');
        styleTag.textContent = getPopupStyles(t); // See helper below
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
            position: 'absolute', top: '10px', left: '12px', display: 'flex', placeItems: 'center',
            width: '28px', height: '28px', background: 'none', border: `1px solid ${t.border}`,
            borderRadius: '6px', color: t.accent, cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s'
        });

        Object.assign(closeBtn.style, {
            position: 'absolute', top: '10px', right: '12px', background: 'none', border: 'none',
            fontSize: '20px', cursor: 'pointer', color: t.dismissColor, lineHeight: '1',
            transition: 'color 0.2s, transform 0.2s', opacity: '0.7'
        });

        // Event Listeners
        themeBtn.addEventListener('mouseenter', () => themeBtn.style.background = t.card);
        themeBtn.addEventListener('mouseleave', () => themeBtn.style.background = 'none');
        themeBtn.addEventListener('click', () => {
            currentDarkMode = !currentDarkMode;
            chrome.storage.sync.set({ darkMode: currentDarkMode });
            // Rerender will happen via storage listener, but we call it here for instant feel
            rerenderAnalysisPanel(popup, scores, justifications);
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

const getPopupStyles = (t) => `
    @keyframes arcDraw { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
    #sustainify-results .gauge-container { width: 100%; display: flex; justify-content: center; }
    #sustainify-results .theme-toggle-btn svg { display: block; }
    #sustainify-results .score-gauge { width: 160px; height: 170px; }
    #sustainify-results .score-arc, #sustainify-results .score-arc-border { stroke-dasharray: 300; animation: arcDraw 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    #sustainify-results .gauge-score { font-size: 42px; font-weight: 600; font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.02em; }
    #sustainify-results .gauge-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'Source Serif 4', Georgia, serif; }
    #sustainify-results .hover-hint { font-size: 10px; font-style: italic; color: ${t.muted}; text-align: center; opacity: 0.7; margin-top: 4px; }
    #sustainify-results .radar-container { width: 100%; display: flex; justify-content: center; margin-top: -4px; }
    #sustainify-results .radar-chart { width: 200px; height: 170px; }
    #sustainify-results .icon-caption { font-size: 9px; font-weight: 600; opacity: 0.75; font-family: 'Source Serif 4', Georgia, serif; }
    #sustainify-results .chart-label { cursor: pointer; }
    #sustainify-results .chart-label:hover svg { color: ${t.chartStroke} !important; }
    #sustainify-results .chart-label:hover .icon-caption { opacity: 1; }
    #sustainify-results .data-polygon { transition: opacity 0.3s ease; }
    #sustainify-results .suggested-section { width: 100%; margin-top: 8px; padding-top: 12px; border-top: 1px solid ${t.border}; }
    #sustainify-results .suggested-header { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: ${t.accent}; margin-bottom: 8px; }
    #sustainify-results .suggested-empty { font-size: 12px; color: ${t.muted}; font-style: italic; text-align: center; padding: 12px 0; }
    #sustainify-results .chart-tooltip {
        position: absolute; background: ${t.card}; border: 1px solid ${t.border}; border-radius: 10px;
        padding: 12px 16px; font-size: 12px; line-height: 1.5; max-width: 260px; width: max-content;
        box-shadow: ${t.shadowHover}; opacity: 0; visibility: hidden; transform: translateY(6px);
        transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s; pointer-events: none; z-index: 100;
    }
    #sustainify-results .chart-tooltip.visible { opacity: 1; visibility: visible; transform: translateY(0); }
    #sustainify-results .chart-tooltip .tooltip-title { font-weight: 600; color: ${t.accent}; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
    #sustainify-results .chart-tooltip .tooltip-score { font-size: 11px; color: ${t.muted}; background: ${t.bg}; padding: 2px 8px; border-radius: 10px; }
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
    borderRadius: '5px 0 0 5px', opacity: '0.5', animation: 'loading-progress 10s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
    pointerEvents: 'none', zIndex: '0'
});

Object.assign(spinner.style, {
    width: '14px', height: '14px', border: '2px solid transparent', borderRadius: '50%',
    animation: 'loading-spin 0.8s linear infinite', flexShrink: '0', position: 'relative', zIndex: '1'
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
