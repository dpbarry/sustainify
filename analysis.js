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


const extractPageText = () => {
    const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'TEMPLATE']);
    const chunks = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: n => {
            const p = n.parentElement;
            if (!p || skip.has(p.tagName) || !p.offsetParent) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    while (walker.nextNode()) {
        const t = walker.currentNode.textContent.trim();
        if (t) chunks.push(t);
    }
    return chunks.join(' ');
};

console.log('Page text:', extractPageText());

const GUMLOOP_USER_ID = '0tRVlm6oZphK1PR9l7aZKbtm6F03';
const GUMLOOP_API_KEY = '42e34acecabd4bb8ba6836ed7d7fbdce';
const GUMLOOP_PIPELINE_ID = '1gnnojPMpuoQKtPvxbjrNX';

fetch('https://api.gumloop.com/api/v1/start_pipeline', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GUMLOOP_API_KEY}`
    },
    body: JSON.stringify({
        user_id: GUMLOOP_USER_ID,
        saved_item_id: GUMLOOP_PIPELINE_ID,
        pipeline_inputs: [
            { input_name: 'Product URL', value: window.location.href }
        ]
    })
})
    .then(res => res.json())
    .then(data => {
        const runId = data.run_id;
        console.log('Pipeline started, run_id:', runId);

        const pollResults = () => {
            fetch(`https://api.gumloop.com/api/v1/get_pl_run?run_id=${runId}&user_id=${GUMLOOP_USER_ID}`, {
                headers: { 'Authorization': `Bearer ${GUMLOOP_API_KEY}` }
            })
                .then(res => res.json())
                .then(result => {
                    console.log('Poll result:', result.state);
                    if (result.state === 'DONE') {
                        console.log('Pipeline complete:', result.outputs);
                        snackbar.style.opacity = '0';
                        snackbar.style.transform = 'translateY(-10px) scale(0.98)';
                        setTimeout(() => snackbar.remove(), 350);
                        showResultsPopup(result.outputs);
                    } else if (result.state === 'RUNNING') {
                        setTimeout(pollResults, 1000);
                    } else {
                        console.error('Pipeline failed:', result);
                    }
                });
        };

        pollResults();
    })
    .catch(err => console.error(err));


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



snackbar.appendChild(progressBar);
snackbar.appendChild(spinner);
snackbar.appendChild(textSpan);
snackbar.appendChild(dismissBtn);

const themes = {
    light: {
        bg: 'hsl(150 20% 98%)',
        text: 'hsl(160 50% 15%)',
        border: 'hsl(150 30% 75%)',
        shadow: `
            0 2px 4px hsl(150 20% 40% / 0.08),
            0 6px 16px hsl(150 25% 30% / 0.12),
            0 12px 32px hsl(150 30% 20% / 0.08),
            inset 0 1px 0 hsl(0 0% 100% / 0.6)
        `,
        progressBg: 'hsl(150 35% 88%)',
        spinnerColor: 'hsl(160 60% 35%)',
        dismissColor: 'hsl(160 30% 45%)',
        dismissHover: 'hsl(160 40% 30%)',
        chartFill: 'hsl(160 50% 40% / 0.25)',
        chartStroke: 'hsl(160 60% 35%)',
        chartAxis: 'hsl(160 20% 70%)'
    },
    dark: {
        bg: 'hsl(160 30% 8%)',
        text: 'hsl(145 30% 92%)',
        border: 'hsl(160 25% 25%)',
        shadow: `
            0 2px 4px hsl(0 0% 0% / 0.2),
            0 8px 24px hsl(0 0% 0% / 0.35),
            0 16px 48px hsl(0 0% 0% / 0.25),
            inset 0 1px 0 hsl(160 20% 20% / 0.4)
        `,
        progressBg: 'hsl(160 40% 15%)',
        spinnerColor: 'hsl(150 60% 55%)',
        dismissColor: 'hsl(150 25% 55%)',
        dismissHover: 'hsl(150 35% 70%)',
        chartFill: 'hsl(150 50% 45% / 0.3)',
        chartStroke: 'hsl(150 60% 50%)',
        chartAxis: 'hsl(150 20% 40% / 0.3)'
    }
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

    chrome.storage.sync.get(['country', 'materials', 'animal', 'labor'], prefs => {
        const weights = {
            environmental: (prefs.country ?? 2) + 1,
            resource: (prefs.materials ?? 2) + 1,
            health: (prefs.animal ?? 2) + 1,
            social: (prefs.labor ?? 2) + 1
        };

        const totalWeight = weights.environmental + weights.health + weights.resource + weights.social;
        const weightedScore = Math.round(
            (scores.environmental * weights.environmental +
                scores.health * weights.health +
                scores.resource * weights.resource +
                scores.social * weights.social) / totalWeight
        );

        const isDark = window.SustainifyTheme.isPageDark();
        const t = isDark ? themes.dark : themes.light;

        const popup = document.createElement('div');
        popup.id = 'sustainify-results';

        // Diamond chart with center at 50
        const cx = 120, cy = 110, r = 65;
        const minScore = 50, maxScore = 100;

        const toPoint = (angle, value) => {
            const rad = (angle - 90) * Math.PI / 180;
            const normalized = (Math.max(minScore, Math.min(maxScore, value)) - minScore) / (maxScore - minScore);
            const dist = normalized * r;
            return [cx + dist * Math.cos(rad), cy + dist * Math.sin(rad)];
        };

        const [envX, envY] = toPoint(0, scores.environmental);
        const [resX, resY] = toPoint(90, scores.resource);
        const [hltX, hltY] = toPoint(180, scores.health);
        const [socX, socY] = toPoint(270, scores.social);

        // SVG icon paths for each category (Feather-style icons)
        const icons = {
            // Leaf icon for Environmental
            environmental: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            // Recycle/refresh arrows for Resources  
            resource: `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 3v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 21v-5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            // Heart with plus for Health
            health: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7v6M9 10h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
            // People/users icon for Social
            social: `<circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M21 21v-2a4 4 0 0 0-3-3.85" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`
        };

        // Create chart labels data - positions adjusted for icons
        const iconSize = 22;
        const labels = [
            { key: 'environmental', text: 'Environmental', x: cx - iconSize / 2, y: 8, score: scores.environmental },
            { key: 'resource', text: 'Resources', x: cx + r + 6, y: cy - iconSize / 2, score: scores.resource },
            { key: 'health', text: 'Health', x: cx - iconSize / 2, y: cy + r + 8, score: scores.health },
            { key: 'social', text: 'Social', x: cx - r - iconSize - 6, y: cy - iconSize / 2, score: scores.social }
        ];

        // Build SVG with interactive icon labels
        const labelsSvg = labels.map(l => `
            <g class="chart-label" data-key="${l.key}" data-text="${l.text}" style="cursor: pointer;">
                <rect x="${l.x - 4}" y="${l.y - 4}" width="${iconSize + 8}" height="${iconSize + 8}" 
                      fill="transparent" rx="4"/>
                <svg x="${l.x}" y="${l.y}" width="${iconSize}" height="${iconSize}" 
                     viewBox="0 0 24 24" fill="none" style="color: ${t.text}; transition: color 0.2s ease, transform 0.2s ease;">
                    ${icons[l.key]}
                </svg>
            </g>
        `).join('');

        const svg = `
            <svg viewBox="0 0 240 210" class="diamond-chart">
                <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${t.chartFill};stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:${t.chartFill};stop-opacity:0.4" />
                    </linearGradient>
                </defs>
                
                <!-- Axis lines -->
                <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="${t.chartAxis}" stroke-width="1" stroke-dasharray="3,3"/>
                <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${t.chartAxis}" stroke-width="1" stroke-dasharray="3,3"/>
                
                <!-- Outer diamond boundary -->
                <polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" 
                    fill="none" stroke="${t.chartAxis}" stroke-width="1.5"/>
                
                <!-- Mid-point reference (75) -->
                <polygon points="${cx},${cy - r / 2} ${cx + r / 2},${cy} ${cx},${cy + r / 2} ${cx - r / 2},${cy}" 
                    fill="none" stroke="${t.chartAxis}" stroke-width="0.5" opacity="0.5"/>
                
                <!-- Data polygon with gradient fill -->
                <polygon points="${envX},${envY} ${resX},${resY} ${hltX},${hltY} ${socX},${socY}" 
                    fill="url(#chartGradient)" stroke="${t.chartStroke}" stroke-width="2.5" 
                    stroke-linejoin="round" class="data-polygon"/>
                
                <!-- Data point dots -->
                <circle cx="${envX}" cy="${envY}" r="4" fill="${t.chartStroke}" class="data-dot"/>
                <circle cx="${resX}" cy="${resY}" r="4" fill="${t.chartStroke}" class="data-dot"/>
                <circle cx="${hltX}" cy="${hltY}" r="4" fill="${t.chartStroke}" class="data-dot"/>
                <circle cx="${socX}" cy="${socY}" r="4" fill="${t.chartStroke}" class="data-dot"/>
                
                <!-- Labels -->
                ${labelsSvg}
            </svg>
        `;

        // Tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close');

        popup.innerHTML = svg + `<div class="score-header">Sustainability Score: <strong>${weightedScore}</strong></div>`;
        popup.appendChild(tooltip);
        popup.appendChild(closeBtn);

        Object.assign(popup.style, {
            position: 'fixed',
            top: '16px',
            right: '16px',
            padding: '24px 28px',
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: '14px',
            background: t.bg,
            color: t.text,
            border: `1px solid ${t.border}`,
            borderRadius: '12px',
            boxShadow: t.shadow,
            zIndex: '1000001',
            opacity: '0',
            transform: 'translateY(-10px) scale(0.98)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            maxWidth: 'min(340px, calc(100vw - 32px))'
        });

        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '10px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '22px',
            cursor: 'pointer',
            color: t.dismissColor,
            lineHeight: '1',
            transition: 'color 0.2s, transform 0.2s'
        });

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.color = t.dismissHover;
            closeBtn.style.transform = 'scale(1.15)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.color = t.dismissColor;
            closeBtn.style.transform = 'scale(1)';
        });

        closeBtn.addEventListener('click', () => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(-10px) scale(0.98)';
            setTimeout(() => popup.remove(), 350);
        });

        const styleTag = document.createElement('style');
        styleTag.textContent = `
            #sustainify-results .diamond-chart {
                width: 100%;
                max-width: 240px;
                height: auto;
            }
            #sustainify-results .data-polygon {
                transition: opacity 0.3s ease;
            }
            #sustainify-results .data-dot {
                transition: r 0.2s ease, opacity 0.2s ease;
            }
            #sustainify-results .chart-label {
                transition: transform 0.2s ease;
            }
            #sustainify-results .chart-label:hover {
                transform: scale(1.15);
            }
            #sustainify-results .chart-label:hover svg {
                color: ${t.chartStroke} !important;
            }
            #sustainify-results .score-header {
                font-size: 15px;
                font-weight: 600;
                text-align: center;
                letter-spacing: 0.01em;
            }
            #sustainify-results .score-header strong {
                font-size: 32px;
                color: ${t.spinnerColor};
                display: block;
                margin-top: 2px;
            }
            #sustainify-results .chart-tooltip {
                position: absolute;
                background: ${isDark ? 'hsl(160 25% 15%)' : 'hsl(150 25% 98%)'};
                border: 1px solid ${t.border};
                border-radius: 8px;
                padding: 10px 14px;
                font-size: 12px;
                line-height: 1.5;
                max-width: 220px;
                box-shadow: 0 4px 16px ${isDark ? 'hsl(0 0% 0% / 0.4)' : 'hsl(150 20% 30% / 0.15)'};
                opacity: 0;
                visibility: hidden;
                transform: translateY(4px);
                transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
                pointer-events: none;
                z-index: 10;
            }
            #sustainify-results .chart-tooltip.visible {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            #sustainify-results .chart-tooltip .tooltip-title {
                font-weight: 600;
                color: ${t.chartStroke};
                margin-bottom: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #sustainify-results .chart-tooltip .tooltip-score {
                font-size: 11px;
                opacity: 0.8;
            }
            #sustainify-results .chart-tooltip .tooltip-text {
                color: ${t.text};
                opacity: 0.9;
            }
        `;
        popup.appendChild(styleTag);

        document.body.appendChild(popup);

        // Setup label hover interactions
        const chartLabels = popup.querySelectorAll('.chart-label');
        chartLabels.forEach(label => {
            label.addEventListener('mouseenter', (e) => {
                const key = label.dataset.key;
                const score = scores[key];
                const justification = justifications[key];
                const title = label.dataset.text;

                tooltip.innerHTML = `
                    <div class="tooltip-title">
                        ${title}
                        <span class="tooltip-score">${score}/100</span>
                    </div>
                    <div class="tooltip-text">${justification}</div>
                `;

                // Position tooltip
                const labelRect = label.getBoundingClientRect();
                const popupRect = popup.getBoundingClientRect();

                let left = labelRect.left - popupRect.left + labelRect.width / 2;
                let top = labelRect.bottom - popupRect.top + 8;

                // Adjust if tooltip would go off edges
                tooltip.style.left = `${Math.max(10, Math.min(left, popupRect.width - 10))}px`;
                tooltip.style.top = `${top}px`;
                tooltip.style.transform = 'translateX(-50%) translateY(0)';

                tooltip.classList.add('visible');
            });

            label.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
        });

        requestAnimationFrame(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translateY(0) scale(1)';
        });
    });
};

const applyTheme = dark => {
    const t = dark ? themes.dark : themes.light;
    snackbar.style.background = t.bg;
    snackbar.style.color = t.text;
    snackbar.style.borderColor = t.border;
    snackbar.style.boxShadow = t.shadow;
    progressBar.style.background = t.progressBg;
    spinner.style.borderTopColor = t.spinnerColor;
    spinner.style.borderRightColor = t.spinnerColor;
    dismissBtn.style.color = t.dismissColor;
    dismissBtn.dataset.hoverColor = t.dismissHover;
};

Object.assign(snackbar.style, {
    position: 'fixed',
    top: '16px',
    right: '16px',
    padding: '12px 18px 12px 14px',
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: '13px',
    fontWeight: 'normal',
    fontStyle: 'italic',
    letterSpacing: '0.01em',
    border: '1px solid',
    borderRadius: '5px',
    zIndex: '1000000',
    opacity: '0',
    transform: 'translateY(-10px) scale(0.98)',
    transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s, color 0.3s, box-shadow 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    overflow: 'hidden',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
});

Object.assign(progressBar.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%',
    width: '0%',
    borderRadius: '5px 0 0 5px',
    opacity: '0.5',
    animation: 'loading-progress 10s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
    pointerEvents: 'none',
    zIndex: '0'
});

Object.assign(spinner.style, {
    width: '14px',
    height: '14px',
    border: '2px solid transparent',
    borderRadius: '50%',
    animation: 'loading-spin 0.8s linear infinite',
    flexShrink: '0',
    position: 'relative',
    zIndex: '1'
});

Object.assign(textSpan.style, {
    position: 'relative',
    zIndex: '1'
});

Object.assign(dismissBtn.style, {
    position: 'relative',
    zIndex: '1',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    fontWeight: '400',
    lineHeight: '1',
    cursor: 'pointer',
    padding: '0 0 0 6px',
    marginLeft: 'auto',
    transition: 'color 0.2s, transform 0.2s'
});

dismissBtn.addEventListener('mouseenter', () => {
    dismissBtn.style.color = dismissBtn.dataset.hoverColor;
    dismissBtn.style.transform = 'scale(1.1)';
});
dismissBtn.addEventListener('mouseleave', () => {
    const t = document.documentElement.dataset.theme === 'dark' ? themes.dark : themes.light;
    dismissBtn.style.color = t.dismissColor;
    dismissBtn.style.transform = 'scale(1)';
});
dismissBtn.addEventListener('click', () => {
    snackbar.style.opacity = '0';
    snackbar.style.transform = 'translateY(-10px) scale(0.98)';
    setTimeout(() => snackbar.remove(), 350);
});

const checkTheme = () => {
    const isDark = window.SustainifyTheme.isPageDark(snackbar);
    applyTheme(isDark);
};

window.SustainifyTheme.createThemeObserver(isDark => applyTheme(isDark), snackbar);

const showSnackbar = () => {
    document.body.appendChild(snackbar);
    checkTheme();
    requestAnimationFrame(() => {
        snackbar.style.opacity = '1';
        snackbar.style.transform = 'translateY(0) scale(1)';
    });
};

document.fonts.ready.then(() => {
    if (document.fonts.check("1rem 'Source Serif 4'")) {
        showSnackbar();
    } else {
        document.fonts.load("1rem 'Source Serif 4'").then(showSnackbar).catch(showSnackbar);
    }
});
