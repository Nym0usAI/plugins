(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;

    const STYLE_ID = 'title_year_fallback_autodetect';

    function isOldInterface() {
        const body = document.body;

        if (!body) return false;

        // 1. Новый интерфейс явно активен
        if (body.classList.contains('new-interface')) return false;

        // 2. Есть карточки нового интерфейса
        if (document.querySelector('.card--small, .card--wide')) return false;

        // 3. Есть инфо-блок нового интерфейса
        if (document.querySelector('.new-interface-info')) return false;

        return true; // старый интерфейс
    }

    function applyStyle() {
        if (!isOldInterface()) return;

        if (document.getElementById(STYLE_ID)) return;

        const css = `
            /* AUTO-DETECT OLD INTERFACE */

            .card .card__title,
            .card .card__year {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }

            /* защита от пустого года */
            .card .card__year:empty {
                display: none !important;
            }
        `;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;

        document.body.appendChild(style);
    }

    function removeStyle() {
        const style = document.getElementById(STYLE_ID);
        if (style) style.remove();
    }

    function check() {
        if (isOldInterface()) applyStyle();
        else removeStyle();
    }

    // старт
    check();

    // защита от динамической подгрузки
    setTimeout(check, 300);
    setTimeout(check, 1000);
    setTimeout(check, 2000);

})();
