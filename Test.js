(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;
    if (window.captions_fix_balanced) return;
    window.captions_fix_balanced = true;

    console.log('[Captions Fix] Balanced FINAL started');

    /* =======================
       SECTION KEYWORDS (основные экраны)
    ======================= */

    const SECTIONS = {
        releases: ['релиз', 'release', 'новин'],
        favorites: ['избран', 'favorit', 'bookmark'],
        history: ['истор', 'history', 'watch'],
        torrents: ['торрент', 'torrent', 'download'],
        search: ['поиск', 'search', 'find']
    };

    const STYLE_ID = 'captions-fix-balanced-style';
    let lastSection = '';

    /* =======================
       SECTION DETECTION (ЭКРАНЫ)
    ======================= */

    function detectSection() {
        const header = document.querySelector('.head__title');
        if (header && header.textContent) return header.textContent.trim();

        if (Lampa.Activity && Lampa.Activity.active) {
            const a = Lampa.Activity.active();
            if (a) return a.title || a.name || '';
        }

        return window.location.hash.replace('#', '');
    }

    function detectSectionType(name) {
        if (!name) return '';
        const v = name.toLowerCase();

        for (const t in SECTIONS) {
            if (SECTIONS[t].some(k => v.includes(k))) return t;
        }
        return '';
    }

    function shouldShowGlobal() {
        return Boolean(detectSectionType(detectSection()));
    }

    /* =======================
       STYLES
    ======================= */

    function injectCSS() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            /* === ГЛОБАЛЬНЫЕ РАЗДЕЛЫ === */
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

            /* === РЕКОМЕНДАЦИИ / ПОХОЖИЕ (ВСЕГДА ПОКАЗЫВАТЬ) === */
            .items__title,
            .line__title {
                /* якоря для блоков */
            }

            .items__title:has-text("Рекомен"),
            .items__title:has-text("Похож"),
            .line__title:has-text("Рекомен"),
            .line__title:has-text("Похож") {
                display: block;
            }

            .items__title ~ .items .card .card__title,
            .items__title ~ .items .card .card__age,
            .line__title ~ .items .card .card__title,
            .line__title ~ .items .card .card__age {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
        `;
        document.head.appendChild(style);
    }

    /* =======================
       CORE
    ======================= */

    function update() {
        const show = shouldShowGlobal();
        document.body.classList.toggle('captions-show', show);
        document.body.classList.toggle('captions-hide', !show);
    }

    function init() {
        injectCSS();
        update();

        new MutationObserver(update).observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[Captions Fix] Balanced FINAL initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
