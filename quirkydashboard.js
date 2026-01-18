const body = document.body;
const toggleBtn = document.getElementById("sun-toggle");
const toggleIcon = document.getElementById("toggle-icon");
const sceneElement = document.getElementById("scene-container"); // New container
const backdropFade = document.getElementById("backdrop-fade");

// Modal Elements
const itemModal = document.getElementById("item-modal");
const modalTitle = document.getElementById("modal-title");
const modalList = document.getElementById("modal-list");
const modalClose = document.getElementById("modal-close");
const scoreSlider = document.getElementById("score-slider");
const scoreDisplay = document.getElementById("score-display");

let currentStash = [];
let currentDarkMode = false;
let activeVisualScore = null;
let fadeTimer = null;

// --- Backdrop Logic ---
const setBackdrop = (name) => {
    const imageUrl = `backdrops/${name}.png`;

    // Check if actually changing to avoid flicker
    if (sceneElement.dataset.activeBackdrop === name) return;
    sceneElement.dataset.activeBackdrop = name;

    backdropFade.style.transition = "none";
    backdropFade.style.opacity = "0";
    backdropFade.style.background = `url("${imageUrl}") center/cover no-repeat`; // Removed bgcolor, just image

    // Force reflow
    backdropFade.offsetHeight;

    backdropFade.style.transition = "opacity 0.8s ease";
    backdropFade.style.opacity = "1";

    if (fadeTimer) {
        clearTimeout(fadeTimer);
    }

    fadeTimer = setTimeout(() => {
        sceneElement.style.backgroundImage = `url("${imageUrl}")`;
        backdropFade.style.transition = "none";
        backdropFade.style.opacity = "0";
    }, 800);
};

const getBackdropIndex = (score) => {
    // If no score (empty stash), default to neutral/start
    if (!score && score !== 0) return 3;

    if (score >= 85) return 5;
    if (score >= 70) return 4;
    if (score >= 50) return 3;
    if (score >= 40) return 2;
    return 1;
};

const updateBackdrop = (overrideScore = null) => {
    if (overrideScore !== null) {
        activeVisualScore = overrideScore;
    }

    let score = activeVisualScore;

    // If no manual override active, calculate from stash
    if (score === null) {
        score = calculateAverage(currentStash);
    }

    // Sync slider to whatever score we are using
    if (score !== null && scoreSlider) {
        scoreSlider.value = score;
        scoreDisplay.textContent = score;
    }

    const index = getBackdropIndex(score);
    const mode = currentDarkMode ? 'night' : 'day';
    setBackdrop(`${mode}${index}`);

    updateToggleIcon(mode);
    updateToggleLabel(mode);
};

const calculateAverage = (stash) => {
    if (!stash || stash.length === 0) return null;
    return Math.round(stash.reduce((sum, item) => sum + (item.scores.average || 0), 0) / stash.length);
};

const updateToggleLabel = (mode) => {
    toggleBtn.setAttribute(
        "aria-label",
        mode === "day" ? "Switch to night" : "Switch to day"
    );
};

const updateToggleIcon = (mode) => {
    toggleIcon.src = mode === "day"
        ? "backdrops/sun.png"
        : "backdrops/moon.png";
};

// --- Modal & Render Logic ---
const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const renderList = (items) => {
    if (items.length === 0) {
        modalList.innerHTML = '<div style="text-align:center; color:var(--muted); padding:20px; font-style:italic;">No items found in this room.</div>';
        return;
    }

    modalList.innerHTML = items.map(item => `
        <a href="${item.link}" target="_blank" class="stash-item">
            <div class="score">${item.scores.average}</div>
            <div class="info">
                <div class="name">${item.name}</div>
                <div class="date">${formatDate(item.timestamp)}</div>
            </div>
        </a>
    `).join('');
};

const openModal = (categoryKey) => {
    let title = 'Room';
    let filteredItems = [];

    // Filter Logic
    // Using simple keyword matching on 'type' and 'name'
    const contains = (str, keywords) => {
        if (!str) return false;
        const s = str.toLowerCase();
        return keywords.some(k => s.includes(k));
    };

    if (categoryKey === 'wardrobe') {
        title = 'Wardrobe';
        filteredItems = currentStash.filter(i => contains(i.type, ['cloth', 'shoe', 'wear', 'apparel', 'fashion', 'shirt', 'pant', 'dress']) || contains(i.name, ['shirt', 'pant', 'dress', 'shoe']));
    } else if (categoryKey === 'tech') {
        title = 'Technology';
        filteredItems = currentStash.filter(i => contains(i.type, ['electr', 'tech', 'computer', 'phone', 'gadget', 'device', 'audio']));
    } else if (categoryKey === 'kitchen') {
        title = 'Kitchen';
        filteredItems = currentStash.filter(i => contains(i.type, ['kitchen', 'home', 'cook', 'food', 'appliance', 'dining']) || contains(i.name, ['pan', 'pot', 'knife']));
    } else if (categoryKey === 'toys') {
        title = 'Toys';
        filteredItems = currentStash.filter(i => contains(i.type, ['toy', 'game', 'play', 'kid', 'baby', 'fun']));
    }

    // Fallback: if no items found in rooms, maybe strictly uncategorized items go somewhere? 
    // For now, if no match, show empty list.

    modalTitle.textContent = title;
    renderList(filteredItems);
    itemModal.classList.add('open');
};

const closeModal = () => {
    itemModal.classList.remove('open');
    setTimeout(() => {
        modalList.innerHTML = ''; // Clear content
    }, 300);
};

// --- Storage & Init ---
const init = () => {
    chrome.storage.sync.get(['stash', 'darkMode'], result => {
        currentStash = result.stash ? JSON.parse(result.stash) : [];
        currentDarkMode = result.darkMode || false;
        updateBackdrop();
    });
};

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        let shouldUpdate = false;
        if (changes.darkMode) {
            currentDarkMode = changes.darkMode.newValue;
            shouldUpdate = true;
        }
        if (changes.stash) {
            currentStash = changes.stash.newValue ? JSON.parse(changes.stash.newValue) : [];
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            updateBackdrop();
            // Note: If modal is open, we technically could re-render, but simple is fine.
        }
    }
});

// --- Event Listeners ---
toggleBtn.addEventListener("click", () => {
    // We only update storage, listener handles the UI update
    chrome.storage.sync.set({ darkMode: !currentDarkMode });
});

document.querySelectorAll('.room-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(link.dataset.category);
    });
});

modalClose.addEventListener('click', closeModal);
itemModal.addEventListener('click', (e) => {
    if (e.target === itemModal) closeModal();
});

if (scoreSlider) {
    scoreSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        scoreDisplay.textContent = val;
        updateBackdrop(val);
    });
}

// Start
init();
