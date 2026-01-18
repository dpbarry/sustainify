// Theme toggle
const themeBtn = document.getElementById('btn-theme');
const iconSun = themeBtn.querySelector('.icon-sun');
const iconMoon = themeBtn.querySelector('.icon-moon');
const plantEl = document.getElementById('growth-plant');

const setTheme = (dark) => {
    document.body.dataset.theme = dark ? 'dark' : 'light';
    iconSun.style.display = dark ? 'none' : 'block';
    iconMoon.style.display = dark ? 'block' : 'none';
};

chrome.storage.sync.get(['darkMode'], prefs => {
    setTheme(prefs.darkMode ?? false);
});

themeBtn.addEventListener('click', () => {
    const isDark = document.body.dataset.theme === 'dark';
    setTheme(!isDark);
    chrome.storage.sync.set({ darkMode: !isDark });
});

// Sync theme changes from other contexts
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.darkMode) {
        setTheme(changes.darkMode.newValue);
    }
    // Also refresh stash if it changes elsewhere
    if (area === 'sync' && changes.stash) {
        renderStash();
    }
});

// Format date
const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// Plant growth rendering
const updatePlantGrowth = (avgScore) => {
    if (!plantEl) return;
    
    const score = Math.max(0, Math.min(100, Number(avgScore) || 0));
    const numLeaves = Math.floor(score / 5); // 1 leaf per 5 points, max 20
    const hasFlower = score >= 80;
    
    // SVG dimensions
    const width = 100;
    const height = 300;
    const centerX = width / 2;
    
    // Pot dimensions - positioned higher up
    const potTopY = height - 70;
    const potBottomY = height - 30;
    const potHeight = potBottomY - potTopY;
    const potTopWidth = 28;
    const potBottomWidth = 20;
    const potRimHeight = 6;
    
    // Stem emerges from pot
    const stemBaseY = potTopY;
    
    // Stem grows from 35px (score 0) to 200px (score 100)
    const minStemHeight = 35;
    const maxStemHeight = 200;
    const stemHeight = minStemHeight + (score / 100) * (maxStemHeight - minStemHeight);
    const stemTopY = stemBaseY - stemHeight;
    
    // Build SVG
    let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true">`;
    
    // Clay pot - brownish red terracotta
    // Pot body (trapezoid shape)
    svg += `<path class="plant-pot-body" d="
        M ${centerX - potTopWidth} ${potTopY + potRimHeight}
        L ${centerX - potBottomWidth} ${potBottomY}
        L ${centerX + potBottomWidth} ${potBottomY}
        L ${centerX + potTopWidth} ${potTopY + potRimHeight}
        Z" fill="hsl(15 55% 45%)"/>`;
    
    // Pot rim (top edge)
    svg += `<rect class="plant-pot-rim" 
        x="${centerX - potTopWidth - 3}" y="${potTopY}" 
        width="${(potTopWidth + 3) * 2}" height="${potRimHeight}" 
        rx="2" fill="hsl(15 50% 38%)"/>`;
    
    // Pot highlight (subtle 3D effect)
    svg += `<path class="plant-pot-highlight" d="
        M ${centerX - potTopWidth + 4} ${potTopY + potRimHeight + 2}
        L ${centerX - potBottomWidth + 3} ${potBottomY - 3}
        L ${centerX - potBottomWidth + 8} ${potBottomY - 3}
        L ${centerX - potTopWidth + 9} ${potTopY + potRimHeight + 2}
        Z" fill="hsl(15 50% 55%)" opacity="0.5"/>`;
    
    // Soil in pot
    svg += `<ellipse class="plant-soil" cx="${centerX}" cy="${potTopY + potRimHeight - 1}" rx="${potTopWidth - 2}" ry="4" fill="hsl(25 40% 25%)"/>`;
    
    // Stem
    svg += `<line class="plant-stem" x1="${centerX}" y1="${stemBaseY}" x2="${centerX}" y2="${stemTopY}"/>`;
    
    // Leaves - positioned along the stem, alternating sides with more spacing
    if (numLeaves > 0) {
        const minLeafSpacing = 12; // Minimum space between leaves
        const leafSpacing = Math.max(minLeafSpacing, (stemHeight - 25) / Math.max(numLeaves, 1));
        
        for (let i = 0; i < numLeaves; i++) {
            const leafY = stemBaseY - 15 - (i * leafSpacing);
            // Don't draw leaves above the stem top
            if (leafY < stemTopY + 15) continue;
            
            const isLeft = i % 2 === 0;
            const leafSize = 16;
            
            if (isLeft) {
                // Left leaf
                svg += `<path class="plant-leaf" d="
                    M ${centerX} ${leafY}
                    C ${centerX - leafSize * 0.6} ${leafY - leafSize * 0.5},
                      ${centerX - leafSize} ${leafY - leafSize * 0.3},
                      ${centerX - leafSize * 1.2} ${leafY}
                    C ${centerX - leafSize} ${leafY + leafSize * 0.3},
                      ${centerX - leafSize * 0.6} ${leafY + leafSize * 0.5},
                      ${centerX} ${leafY}
                    Z"/>`;
            } else {
                // Right leaf
                svg += `<path class="plant-leaf" d="
                    M ${centerX} ${leafY}
                    C ${centerX + leafSize * 0.6} ${leafY - leafSize * 0.5},
                      ${centerX + leafSize} ${leafY - leafSize * 0.3},
                      ${centerX + leafSize * 1.2} ${leafY}
                    C ${centerX + leafSize} ${leafY + leafSize * 0.3},
                      ${centerX + leafSize * 0.6} ${leafY + leafSize * 0.5},
                      ${centerX} ${leafY}
                    Z"/>`;
            }
        }
    }
    
    // Bud or Flower at top
    const budY = stemTopY - 5;
    
    if (hasFlower) {
        // Pink flower with petals
        const petalSize = 10;
        const numPetals = 6;
        for (let i = 0; i < numPetals; i++) {
            const angle = (i / numPetals) * Math.PI * 2 - Math.PI / 2;
            const petalX = centerX + Math.cos(angle) * petalSize * 0.8;
            const petalY = budY + Math.sin(angle) * petalSize * 0.8;
            svg += `<ellipse class="plant-flower-petal" 
                cx="${petalX}" cy="${petalY}" 
                rx="${petalSize * 0.6}" ry="${petalSize * 0.4}"
                transform="rotate(${(angle * 180 / Math.PI) + 90}, ${petalX}, ${petalY})"/>`;
        }
        // Flower center
        svg += `<circle class="plant-flower-center" cx="${centerX}" cy="${budY}" r="6"/>`;
    } else {
        // Simple bud/sphere
        svg += `<circle class="plant-bud" cx="${centerX}" cy="${budY}" r="7"/>`;
    }
    
    svg += '</svg>';
    plantEl.innerHTML = svg;
};

// Sort state
let currentSort = 'recency';

// Render stash
const renderStash = () => {
    chrome.storage.sync.get(['stash'], result => {
        const stash = result.stash ? JSON.parse(result.stash) : [];
        console.log('Sustainify Stash:', stash);

        const listEl = document.getElementById('stash-list');
        const avgEl = document.getElementById('avg-number');

        if (stash.length === 0) {
            listEl.innerHTML = '<div class="empty">No items stashed yet</div>';
            avgEl.textContent = '--';
            updatePlantGrowth(0);
            return;
        }

        // Calculate average
        const totalAvg = Math.round(stash.reduce((sum, item) => sum + (item.scores.average || 0), 0) / stash.length);
        avgEl.textContent = totalAvg;
        updatePlantGrowth(totalAvg);

        let html = '';

        if (currentSort === 'recency') {
            html = stash.slice().reverse().map((item, i) => {
                const originalIndex = stash.length - 1 - i;
                return renderItem(item, originalIndex, i * 0.04);
            }).join('');
        } else if (currentSort === 'category') {
            // Group by category
            const grouped = stash.reduce((acc, item, index) => {
                const type = item.type || 'Uncategorized';
                if (!acc[type]) acc[type] = [];
                acc[type].push({ ...item, originalIndex: index });
                return acc;
            }, {});

            // Sort categories alphabetically-ish (Uncategorized last)
            const categories = Object.keys(grouped).sort((a, b) => {
                if (a === 'Uncategorized') return 1;
                if (b === 'Uncategorized') return -1;
                return a.localeCompare(b);
            });

            html = categories.map(cat => `
                <div class="category-header">${cat}</div>
                ${grouped[cat].map((item, i) => renderItem(item, item.originalIndex, i * 0.04)).join('')}
            `).join('');
        }

        listEl.innerHTML = html;

        // Attach delete listeners
        attachDeleteListeners();
    });
};

const renderItem = (item, originalIndex, delay) => `
    <div class="stash-row" style="animation-delay: ${delay}s">
        <a class="stash-item" href="${item.link}" target="_blank">
            <div class="score">${item.scores.average}</div>
            <div class="info">
                <div class="name">${item.name}</div>
                <div class="date">${formatDate(item.timestamp)}</div>
            </div>
        </a>
        <button class="delete-btn" data-index="${originalIndex}" aria-label="Delete item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    </div>
`;

const attachDeleteListeners = () => {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteItem(parseInt(btn.dataset.index));
        });
    });
};

// Sort handlers
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentSort = btn.dataset.sort;
        chrome.storage.sync.set({ sortPreference: currentSort });

        // Update active state
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        renderStash();
    });
});

const deleteItem = (index) => {
    chrome.storage.sync.get(['stash'], result => {
        if (!result.stash) return;
        const stash = JSON.parse(result.stash);
        stash.splice(index, 1);
        chrome.storage.sync.set({ stash: JSON.stringify(stash) }, () => {
            renderStash();
        });
    });
};

// Init: Load sort preference then render
chrome.storage.sync.get(['sortPreference'], result => {
    if (result.sortPreference) {
        currentSort = result.sortPreference;
        // Update UI buttons
        document.querySelectorAll('.sort-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.sort === currentSort);
        });
    }
    renderStash();
});

// Clear Stash button
document.getElementById('btn-clear').addEventListener('click', () => {
    chrome.storage.sync.remove('stash', () => {
        location.reload();
    });
});

const btnQuirky = document.getElementById('btn-quirky') || document.getElementById('btn-funky');
if (btnQuirky) {
    btnQuirky.addEventListener('click', () => {
        window.location.href = 'quirkydashboard.html';
    });
}

// Debug slider for testing plant growth
const debugSlider = document.getElementById('debug-score');
if (debugSlider) {
    debugSlider.addEventListener('input', (e) => {
        const score = parseInt(e.target.value);
        updatePlantGrowth(score);
        document.getElementById('avg-number').textContent = score;
    });
}
