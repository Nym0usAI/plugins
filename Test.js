(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;
    if (window.captions_fix_balanced_v2) return;
    window.captions_fix_balanced_v2 = true;

    console.log('[Captions Fix] Balanced v2 started');

    /* =======================
       SECTION KEYWORDS
    ======================= */

    const SECTIONS = {
        releases: ['релиз', 'release', 'новин'],
        favorites: ['избран', 'favorit', 'bookmark'],
        history: ['истор', 'history', 'watch'],
        torrents: ['торрент', 'torrent', 'download'],
        search: ['поиск', 'search', 'find']
    };

    const STYLE_ID = 'captions-fix-balanced-v2-style';
    let lastSection = '';

    /* =======================
       SECTION DETECTION
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
       CSS INJECTION
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

            /* === РЕКОМЕНДАЦИИ / ПОХОЖИЕ === */
            .recommendation-card .card__title,
            .recommendation-card .card__age,
            .similar-card .card__title,
            .similar-card .card__age {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
        `;
        document.head.appendChild(style);
    }

    /* =======================
       CORE LOGIC
    ======================= */

    function applyToCards() {
        const show = shouldShowGlobal();
        document.body.classList.toggle('captions-show', show);
        document.body.classList.toggle('captions-hide', !show);

        const selectors = ['.card:not(.card--collection)', '.recommendation-card', '.similar-card'];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(card => {
                ['.card__title', '.card__age'].forEach(sub => {
                    const el = card.querySelector(sub);
                    if (el) {
                        el.style.display = show ? 'block' : 'none';
                        el.style.opacity = show ? '1' : '0';
                    }
                });
            });
        });
    }

    function update() {
        const current = detectSection();
        if (current !== lastSection) {
            lastSection = current;
            applyToCards();
        }
    }

    function init() {
        injectCSS();
        update();

        new MutationObserver(update).observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });

        console.log('[Captions Fix] Balanced v2 initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Debug
    window.debugCaptions = function () {
        const sec = detectSection();
        const type = detectSectionType(sec);
        const show = shouldShowGlobal();
        console.log('=== Captions Fix v2 Debug ===', { sec, type, show });
        return { sec, type, show };
    };

    // Force show/hide
    window.showCaptions = () => { document.body.classList.add('captions-show'); applyToCards(); console.log('[Captions Fix] Show captions'); };
    window.hideCaptions = () => { document.body.classList.add('captions-hide'); applyToCards(); console.log('[Captions Fix] Hide captions'); };
})();
