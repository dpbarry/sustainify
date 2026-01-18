document.addEventListener('DOMContentLoaded', () => {
    const keys = ['environment', 'social', 'resources', 'health'];
    const btnTheme = document.getElementById('btn-theme');
    const iconSun = document.querySelector('.icon-sun');
    const iconMoon = document.querySelector('.icon-moon');

    const setTheme = dark => {
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
        iconSun.style.display = dark ? 'block' : 'none';
        iconMoon.style.display = dark ? 'none' : 'block';
    };

    chrome.storage.sync.get([...keys, 'darkMode'], r => {
        setTheme(r.darkMode ?? false);
        keys.forEach(k => {
            const el = document.getElementById(k);
            el.value = r[k] ?? 3;
            el.oninput = () => chrome.storage.sync.set({ [k]: +el.value });
        });
    });

    btnTheme.onclick = () => {
        const dark = document.documentElement.dataset.theme !== 'dark';
        setTheme(dark);
        chrome.storage.sync.set({ darkMode: dark });
    };

    document.getElementById('btn-home').onclick = () => {
        chrome.tabs.create({ url: 'dashboard.html' });
    };

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' && changes.darkMode) {
            setTheme(changes.darkMode.newValue);
        }
    });
});
