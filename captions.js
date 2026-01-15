(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;

    const css = `
        /* Fallback: если НЕ активен new-interface */
        :not(.new-interface) .card__title,
        :not(.new-interface) .card__year {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
        }

        /* защита от пустого года */
        .card__year:empty {
            display: none !important;
        }
    `;

    Lampa.Template.add('title_year_fallback_style', `<style>${css}</style>`);
    $('body').append(Lampa.Template.get('title_year_fallback_style', {}, true));
})();
