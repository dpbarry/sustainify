const body = document.body;
const toggleBtn = document.getElementById("sun-toggle");
const toggleIcon = document.getElementById("toggle-icon");
const backdropFade = document.getElementById("backdrop-fade");
const scoreInput = document.getElementById("score-input");
const scoreValue = document.getElementById("score-value");
let fadeTimer = null;

const setBackdrop = (name) => {
    const imageUrl = `backdrops/${name}.png`;
    body.dataset.backdrop = name;
    backdropFade.style.transition = "none";
    backdropFade.style.opacity = "0";
    backdropFade.style.background = `#f5faf6 url("${imageUrl}") center/cover no-repeat`;
    backdropFade.offsetHeight;
    backdropFade.style.transition = "opacity 5s ease";
    backdropFade.style.opacity = "1";

    if (fadeTimer) {
        clearTimeout(fadeTimer);
    }

    fadeTimer = setTimeout(() => {
        body.style.background = `#f5faf6 url("${imageUrl}") center/cover no-repeat`;
        backdropFade.style.transition = "none";
        backdropFade.style.opacity = "0";
    }, 3000);
};

const parseBackdrop = () => {
    const match = (body.dataset.backdrop || "").match(/^(day|night)(\d)$/);
    if (!match) {
        return { mode: "day", index: "3" };
    }
    return { mode: match[1], index: match[2] };
};

const getBackdropForScore = (score, mode) => {
    if (!Number.isFinite(score)) {
        return null;
    }

    let index = 1;
    if (score >= 85) {
        index = 5;
    } else if (score >= 60) {
        index = 4;
    } else if (score >= 50) {
        index = 3;
    } else if (score >= 40) {
        index = 2;
    }

    return `${mode}${index}`;
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

toggleBtn.addEventListener("click", () => {
    const { mode, index } = parseBackdrop();
    const nextMode = mode === "day" ? "night" : "day";
    setBackdrop(`${nextMode}${index}`);
    updateToggleLabel(nextMode);
    updateToggleIcon(nextMode);
});

const applyScoreBackdrop = () => {
    const mode = parseBackdrop().mode;
    const backdrop = getBackdropForScore(Number(scoreInput.value), mode);
    if (!backdrop) {
        return;
    }
    setBackdrop(backdrop);
    updateToggleLabel(mode);
    updateToggleIcon(mode);
};

scoreInput.addEventListener("input", () => {
    scoreValue.textContent = scoreInput.value;
    applyScoreBackdrop();
});

const initialMode = parseBackdrop().mode;
updateToggleLabel(initialMode);
updateToggleIcon(initialMode);

