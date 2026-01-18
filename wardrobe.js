const container = document.getElementById('clothes-center');
const emptyState = document.getElementById('empty-state');
const modal = document.getElementById('tshirt-modal');
const tshirtShape = document.getElementById('tshirt-shape');
const shirtPath = document.getElementById('shirt-path');
const modalScore = document.getElementById('modal-score');
const modalName = document.getElementById('modal-name');
const modalDate = document.getElementById('modal-date');
const modalLink = document.getElementById('modal-link');
const modalClose = document.getElementById('modal-close');

// Get color based on sustainability score (0-100)
// Low score = red/orange, high score = green
const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50'; // Bright green
    if (score >= 65) return '#7cb87c'; // Medium green
    if (score >= 50) return '#a0c46c'; // Yellow-green
    if (score >= 35) return '#e8a948'; // Orange
    return '#d65a4a'; // Red-orange
};

const shade = (hex, amt) => {
    const num = parseInt(hex.slice(1), 16);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp((num >> 16) + amt);
    const g = clamp(((num >> 8) & 0x00ff) + amt);
    const b = clamp((num & 0x0000ff) + amt);
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
};

const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const isClothing = (item) => {
    const type = (item.type || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    // Match clothing-related types
    const typeMatch = ['cloth', 'shoe', 'wear', 'apparel', 'fashion', 'shirt', 'pant', 'dress', 'garment', 'textile', 'jacket', 'coat', 'sweater', 'hoodie', 'jeans', 'shorts', 'skirt', 'blouse', 'top', 't-shirt', 'socks', 'underwear']
        .some(keyword => type.includes(keyword));
    // Also match by name
    const nameMatch = ['shirt', 'pant', 'dress', 'shoe', 'jacket', 'coat', 'sweater', 'hoodie', 'jeans', 'shorts', 'skirt', 'blouse', 'socks']
        .some(keyword => name.includes(keyword));
    return typeMatch || nameMatch;
};

const openModal = (item) => {
    const score = item.scores?.average || 0;
    const color = getScoreColor(score);

    shirtPath.setAttribute('fill', color);
    tshirtShape.style.setProperty('--shirt-color', color);

    modalScore.textContent = score;
    modalName.textContent = item.name || 'Clothing Item';
    modalDate.textContent = formatDate(item.timestamp);

    if (item.link) {
        modalLink.href = item.link;
        modalLink.style.display = 'inline-block';
    } else {
        modalLink.style.display = 'none';
    }

    modal.classList.add('open');
};

const closeModal = () => {
    modal.classList.remove('open');
};

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
    }
});

const renderClothes = (stash) => {
    // Filter to clothing, take 6 most recent
    const clothing = stash
        .filter(isClothing)
        .slice(-6)
        .reverse(); // Most recent first

    // Clear existing stacks (but not empty state)
    container.querySelectorAll('.folded-stack').forEach(el => el.remove());

    if (clothing.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    clothing.forEach((item) => {
        const score = item.scores?.average || 50;
        const baseColor = getScoreColor(score);
        const name = item.name || 'Clothing Item';

        const stack = document.createElement('button');
        stack.className = 'folded-stack';
        stack.style.setProperty('--stack-base', baseColor);
        stack.style.setProperty('--stack-mid', shade(baseColor, -25));
        stack.style.setProperty('--stack-dark', shade(baseColor, -50));
        stack.textContent = name;
        stack.title = name; // Show full name on hover

        stack.addEventListener('click', () => openModal(item));

        container.appendChild(stack);
    });
};

const parseStash = (data) => {
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('Failed to parse stash data:', e);
        return [];
    }
};

const loadStash = () => {
    if (window.chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['stash'], result => {
            renderClothes(parseStash(result.stash));
        });

        // Listen for changes
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync' && changes.stash) {
                renderClothes(parseStash(changes.stash.newValue));
            }
        });
    } else {
        renderClothes([]);
    }
};

loadStash();

