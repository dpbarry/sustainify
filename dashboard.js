// Theme toggle
const themeBtn = document.getElementById('btn-theme');
const iconSun = themeBtn.querySelector('.icon-sun');
const iconMoon = themeBtn.querySelector('.icon-moon');

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
            return;
        }

        // Calculate average
        const totalAvg = Math.round(stash.reduce((sum, item) => sum + (item.scores.average || 0), 0) / stash.length);
        avgEl.textContent = totalAvg;

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
    <div class="stash-row" style="position: relative; animation-delay: ${delay}s">
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
            e.stopPropagation(); // Stop propagation so we don't click the link underneath/nearby if layout shifts (though button is absolute)
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


