(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;

    const STYLE_ID = 'title_year_fallback_style';

    function applyFallback() {
        // если новый интерфейс активен — ничего не делаем
        if (document.body.classList.contains('new-interface')) return;

        // стиль уже добавлен
        if (document.getElementById(STYLE_ID)) return;

        const css = `
            /* OLD INTERFACE FALLBACK */

            .card .card__title {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }

            .card .card__year {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }

            /* если года реально нет — не показываем */
            .card .card__year:empty {
                display: none !important;
            }
        `;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.body.appendChild(style);
    }

    // запуск
    applyFallback();

    // защита от поздней инициализации
    document.addEventListener('DOMContentLoaded', applyFallback);
    setTimeout(applyFallback, 500);
    setTimeout(applyFallback, 1500);
})();
