// Inject keyframes for spinner animation
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

// Inject Google Font for consistent typography
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400;1,8..60,600&display=swap';
document.head.appendChild(fontLink);

const snackbar = document.createElement('div');
snackbar.id = 'loading-snackbar';

// Progress bar background
const progressBar = document.createElement('div');
progressBar.id = 'loading-progress';

// Spinner icon
const spinner = document.createElement('div');
spinner.id = 'loading-spinner';

// Text content
const textSpan = document.createElement('span');
textSpan.textContent = 'Sustainify Analyzing...';

// Dismiss button
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
        dismissHover: 'hsl(160 40% 30%)'
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
        dismissHover: 'hsl(150 35% 70%)'
    }
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
    fontWeight: '550',
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
    animation: 'loading-progress 5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
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

// Parse any rgb/rgba format to [r, g, b, a]
const parseRGBA = str => {
    // Use a temp element to normalize any color format
    const div = document.createElement('div');
    div.style.color = str;
    document.body.appendChild(div);
    const computed = getComputedStyle(div).color;
    div.remove();

    // Match "rgb(r, g, b)" or "rgba(r, g, b, a)" with comma or space separators
    const nums = computed.match(/[\d.]+/g);
    if (!nums || nums.length < 3) return null;

    return {
        r: parseFloat(nums[0]),
        g: parseFloat(nums[1]),
        b: parseFloat(nums[2]),
        a: nums[3] !== undefined ? parseFloat(nums[3]) : 1
    };
};

// Relative luminance (0=black, 1=white)
const luminance = (r, g, b) => {
    const f = c => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

// Walk up from element to find first opaque background
const getBackgroundLuminance = startEl => {
    let el = startEl;
    while (el) {
        const bg = getComputedStyle(el).backgroundColor;
        const rgba = parseRGBA(bg);

        if (rgba && rgba.a > 0.1) { // not transparent
            return luminance(rgba.r, rgba.g, rgba.b);
        }
        el = el.parentElement;
    }
    return null;
};

// Sample the page
const detectPageBrightness = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const points = [
        [w / 2, h / 2],
        [w * 0.25, h * 0.25],
        [w * 0.75, h * 0.25],
        [w * 0.25, h * 0.75],
        [w * 0.75, h * 0.75],
        [w - 100, 50],
    ];

    const lums = [];

    for (const [x, y] of points) {
        const el = document.elementFromPoint(x, y);
        if (el && el !== snackbar) {
            const lum = getBackgroundLuminance(el);
            if (lum !== null) lums.push(lum);
        }
    }

    console.log('Sustainify lums:', lums);

    if (lums.length === 0) return 1;
    return lums.reduce((a, b) => a + b, 0) / lums.length;
};

const checkTheme = () => {
    const brightness = detectPageBrightness();
    console.log('Sustainify brightness:', brightness);
    applyTheme(brightness < 0.5);
};


let debounce;
new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(checkTheme, 50);
}).observe(document.documentElement, { attributes: true, childList: true, subtree: true });

// Show snackbar only after font loads and theme is applied
const showSnackbar = () => {
    document.body.appendChild(snackbar);
    checkTheme();
    requestAnimationFrame(() => {
        snackbar.style.opacity = '1';
        snackbar.style.transform = 'translateY(0) scale(1)';
    });
};

// Wait for Source Serif 4 font to load before displaying
document.fonts.ready.then(() => {
    if (document.fonts.check("1rem 'Source Serif 4'")) {
        showSnackbar();
    } else {
        // Font not available yet, wait a bit for it to load
        document.fonts.load("1rem 'Source Serif 4'").then(showSnackbar).catch(showSnackbar);
    }
});
