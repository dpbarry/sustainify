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
    
    // Calculate number of leaves using diminishing returns (only above 50)
    // 50: 0 leaves, 66 (+16): 1, 74 (+8): 2, 78 (+4): 3, 80 (+2): 4, then +1 per point
    const calculateLeaves = (s) => {
        if (s < 50) return 0;
        if (s < 66) return 0;
        if (s < 74) return 1;
        if (s < 78) return 2;
        if (s < 80) return 3;
        if (s < 81) return 4;
        return 4 + (s - 80); // 5 leaves at 81, 6 at 82, etc.
    };
    const numLeaves = calculateLeaves(score);
    const hasFlower = score >= 80;
    const isWilting = score < 50;
    
    // Color interpolation for wilting: green (50) → yellow (25) → brown (0)
    const getPlantColor = (s) => {
        if (s >= 50) {
            return { hue: 155, sat: 40, light: 28 }; // Healthy green
        } else if (s >= 25) {
            // Green to yellow (50 → 25)
            const t = (s - 25) / 25; // 1 at 50, 0 at 25
            return {
                hue: 155 * t + 50 * (1 - t), // 155 → 50
                sat: 40 * t + 70 * (1 - t),   // 40 → 70
                light: 28 * t + 45 * (1 - t)  // 28 → 45
            };
        } else {
            // Yellow to brown (25 → 0)
            const t = s / 25; // 1 at 25, 0 at 0
            return {
                hue: 50 * t + 25 * (1 - t),   // 50 → 25
                sat: 70 * t + 50 * (1 - t),   // 70 → 50
                light: 45 * t + 30 * (1 - t)  // 45 → 30
            };
        }
    };
    const plantColor = getPlantColor(score);
    const stemColor = `hsl(${plantColor.hue} ${plantColor.sat}% ${plantColor.light}%)`;
    const leafColor = `hsl(${plantColor.hue} ${Math.max(35, plantColor.sat - 5)}% ${Math.min(55, plantColor.light + 15)}%)`;
    const budColor = stemColor;
    
    // SVG dimensions
    const width = 100;
    const height = 360;
    const centerX = width / 2;
    
    // Pot dimensions
    const potTopY = height - 70;
    const potBottomY = height - 30;
    const potTopWidth = 28;
    const potBottomWidth = 20;
    const potRimHeight = 6;
    
    // Stem emerges from pot
    const stemBaseY = potTopY;
    
    // Stem height based on score
    // Below 50: smaller wilted stem, Above 50: grows taller
    let stemHeight, stemTopY, wiltAmount = 0;
    
    if (score <= 0) {
        stemHeight = 0; // No stem at 0
    } else if (score < 50) {
        // Wilting: stem is shorter and droops
        const wiltProgress = score / 50; // 0 at score 0, 1 at score 50
        stemHeight = 15 + wiltProgress * 35; // 15px to 50px
        wiltAmount = (1 - wiltProgress) * 20; // How much it droops sideways
    } else {
        // Growing: stem gets taller from 50 to 260px
        const growProgress = (score - 50) / 50; // 0 at 50, 1 at 100
        stemHeight = 20 + growProgress * 260; // 50px to 260px
    }
    stemTopY = stemBaseY - stemHeight;
    
    // Build SVG
    let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true">`;
    
    // Pot shadow (drawn first so it's behind)
    svg += `<ellipse cx="${centerX}" cy="${potBottomY + 4}" rx="${potBottomWidth + 8}" ry="5" fill="hsl(0 0% 0% / 0.15)"/>`;
    
    // Clay pot - brownish red terracotta
    svg += `<path d="
        M ${centerX - potTopWidth} ${potTopY + potRimHeight}
        L ${centerX - potBottomWidth} ${potBottomY}
        L ${centerX + potBottomWidth} ${potBottomY}
        L ${centerX + potTopWidth} ${potTopY + potRimHeight}
        Z" fill="hsl(15 55% 45%)"/>`;
    
    // Pot rim
    svg += `<rect 
        x="${centerX - potTopWidth - 3}" y="${potTopY}" 
        width="${(potTopWidth + 3) * 2}" height="${potRimHeight}" 
        rx="2" fill="hsl(15 50% 38%)"/>`;
    
    // Pot highlight
    svg += `<path d="
        M ${centerX - potTopWidth + 4} ${potTopY + potRimHeight + 2}
        L ${centerX - potBottomWidth + 3} ${potBottomY - 3}
        L ${centerX - potBottomWidth + 8} ${potBottomY - 3}
        L ${centerX - potTopWidth + 9} ${potTopY + potRimHeight + 2}
        Z" fill="hsl(15 50% 55%)" opacity="0.5"/>`;
    
    // Soil
    svg += `<ellipse cx="${centerX}" cy="${potTopY + potRimHeight - 1}" rx="${potTopWidth - 2}" ry="4" fill="hsl(25 40% 25%)"/>`;
    
    // Potential growth line (dashed) - shows max possible height
    const maxStemHeight = 280; // Max height at score 100
    const potentialTopY = stemBaseY - maxStemHeight;
    const isDarkMode = document.body.dataset.theme === 'dark';
    const guideLineColor = isDarkMode ? 'hsl(155 25% 35%)' : 'hsl(155 30% 60%)';
    svg += `<line 
        x1="${centerX}" y1="${stemBaseY - 10}" 
        x2="${centerX}" y2="${potentialTopY}" 
        stroke="${guideLineColor}" 
        stroke-width="1.5" 
        stroke-dasharray="4 6" 
        stroke-linecap="round"
        opacity="0.5"/>`;
    
    // Only draw plant if score > 0
    if (score > 0) {
        if (isWilting) {
            // Wilted stem - curved/drooping path
            const droopDirection = 1; // Droop to the right
            const controlX = centerX + wiltAmount * droopDirection;
            const tipX = centerX + wiltAmount * 1.5 * droopDirection;
            svg += `<path d="
                M ${centerX} ${stemBaseY}
                Q ${controlX} ${stemBaseY - stemHeight * 0.6}, ${tipX} ${stemTopY + 5}
            " stroke="${stemColor}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
            
            // Wilted bud (smaller, drooping)
            if (score > 10) {
                const budSize = 4 + (score / 50) * 3;
                svg += `<circle cx="${tipX}" cy="${stemTopY}" r="${budSize}" fill="${budColor}"/>`;
            }
        } else {
            // Healthy stem - straight line
            svg += `<line x1="${centerX}" y1="${stemBaseY}" x2="${centerX}" y2="${stemTopY}" 
                stroke="${stemColor}" stroke-width="4" stroke-linecap="round"/>`;
            
            // Leaves - positioned along the stem, alternating sides
            if (numLeaves > 0) {
                const minLeafSpacing = 14;
                const leafSpacing = Math.max(minLeafSpacing, (stemHeight - 30) / Math.max(numLeaves, 1));
                
                for (let i = 0; i < numLeaves; i++) {
                    const leafY = stemBaseY - 18 - (i * leafSpacing);
                    if (leafY < stemTopY + 15) continue;
                    
                    const isLeft = i % 2 === 0;
                    const leafSize = 16;
                    
                    if (isLeft) {
                        svg += `<path d="
                            M ${centerX} ${leafY}
                            C ${centerX - leafSize * 0.6} ${leafY - leafSize * 0.5},
                              ${centerX - leafSize} ${leafY - leafSize * 0.3},
                              ${centerX - leafSize * 1.2} ${leafY}
                            C ${centerX - leafSize} ${leafY + leafSize * 0.3},
                              ${centerX - leafSize * 0.6} ${leafY + leafSize * 0.5},
                              ${centerX} ${leafY}
                            Z" fill="${leafColor}"/>`;
                    } else {
                        svg += `<path d="
                            M ${centerX} ${leafY}
                            C ${centerX + leafSize * 0.6} ${leafY - leafSize * 0.5},
                              ${centerX + leafSize} ${leafY - leafSize * 0.3},
                              ${centerX + leafSize * 1.2} ${leafY}
                            C ${centerX + leafSize} ${leafY + leafSize * 0.3},
                              ${centerX + leafSize * 0.6} ${leafY + leafSize * 0.5},
                              ${centerX} ${leafY}
                            Z" fill="${leafColor}"/>`;
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
                    svg += `<ellipse 
                        cx="${petalX}" cy="${petalY}" 
                        rx="${petalSize * 0.6}" ry="${petalSize * 0.4}"
                        transform="rotate(${(angle * 180 / Math.PI) + 90}, ${petalX}, ${petalY})"
                        fill="hsl(340 70% 65%)"/>`;
                }
                svg += `<circle cx="${centerX}" cy="${budY}" r="6" fill="hsl(45 90% 60%)"/>`;
            } else {
                svg += `<circle cx="${centerX}" cy="${budY}" r="7" fill="${budColor}"/>`;
            }
        }
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

            html = categories.map(cat => {
                const items = grouped[cat];
                const catAvg = Math.round(items.reduce((sum, item) => sum + (item.scores.average || 0), 0) / items.length);
                return `
                    <div class="category-header">${cat} : <span class="category-avg">${catAvg}</span></div>
                    ${items.map((item, i) => renderItem(item, item.originalIndex, i * 0.04)).join('')}
                `;
            }).join('');
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

// Modal helper function
const setupModal = (modalId, buttonId, closeId) => {
    const modal = document.getElementById(modalId);
    const btn = document.getElementById(buttonId);
    const closeBtn = document.getElementById(closeId);

    if (btn && modal) {
        btn.addEventListener('click', () => {
            modal.classList.add('active');
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    return modal;
};

// Setup all modals
const shareModal = setupModal('share-modal', 'btn-share', 'share-modal-close');
const supportModal = setupModal('support-modal', 'btn-support', 'support-modal-close');
const contactModal = setupModal('contact-modal', 'btn-contact', 'contact-modal-close');

// Close any open modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        [shareModal, supportModal, contactModal].forEach(modal => {
            if (modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    }
});
