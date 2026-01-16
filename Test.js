(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;
    if (window.captions_fix_balanced) return;
    window.captions_fix_balanced = true;

    console.log('[Captions Fix] Balanced version started');

    const SECTIONS = {
        releases: ['релиз', 'release', 'новин'],
        favorites: ['избран', 'favorit', 'bookmark'],
        history: ['истор', 'history', 'watch'],
        torrents: ['торрент', 'torrent', 'download'],
        search: ['поиск', 'search', 'find']
    };

    const STYLE_ID = 'captions-fix-balanced-style';

    let lastSection = '';
    let observer = null;

    /* =======================
       SECTION DETECTION
    ======================= */

    function detectSection() {
        // 1. Header title
        const header = document.querySelector('.head__title');
        if (header && header.textContent) {
            return header.textContent.trim();
        }

        // 2. Lampa Activity
        if (Lampa.Activity && Lampa.Activity.active) {
            const a = Lampa.Activity.active();
            if (a) {
                return a.title || a.name || '';
            }
        }

        // 3. URL hash
        return window.location.hash.replace('#', '');
    }

    function detectSectionType(name) {
        if (!name) return '';

        const value = name.toLowerCase();

        for (const type in SECTIONS) {
            if (SECTIONS[type].some(k => value.includes(k))) {
                return type;
            }
        }

        return '';
    }

    function shouldShow() {
        const section = detectSection();
        const type = detectSectionType(section);

        console.log('[Captions Fix] Section:', section, 'Type:', type);
        return Boolean(type);
    }

    /* =======================
       STYLES
    ======================= */

    function applyStyles(show) {
        document.body.classList.toggle('captions-show', show);
        document.body.classList.toggle('captions-hide', !show);
    }

    function injectCSS() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            body.captions-show .card:not(.card--collection) .card__title,
            body.captions-show .card:not(.card--collection) .card__age {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }

            body.captions-hide .card:not(.card--collection) .card__title,
            body.captions-hide .card:not(.card--collection) .card__age {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    /* =======================
       CORE
    ======================= */

    function update() {
        const section = detectSection();

        if (section !== lastSection) {
            lastSection = section;
            applyStyles(shouldShow());
        }
    }

    function startObserver() {
        observer = new MutationObserver(update);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    function init() {
        injectCSS();
        update();
        startObserver();
        console.log('[Captions Fix] Balanced initialized');
    }

    /* =======================
       PUBLIC API
    ======================= */

    window.debugCaptions = () => ({
        section: detectSection(),
        type: detectSectionType(detectSection()),
        show: shouldShow()
    });

    window.showCaptions = () => applyStyles(true);
    window.hideCaptions = () => applyStyles(false);

    /* =======================
       START
    ======================= */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();