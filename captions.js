(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;

    // защита от повторного подключения
    if (window.plugin_old_interface_captions) return;
    window.plugin_old_interface_captions = true;

    // добавляем CSS
    Lampa.Template.add('old_interface_captions_style', `
        <style>
        /* =========================================
           СТАРЫЙ ИНТЕРФЕЙС
           Всегда показывать названия и год
           (только без .new-interface)
        ========================================== */

        body:not(.new-interface) .card__title,
        body:not(.new-interface) .card__name,
        body:not(.new-interface) .card__year,
        body:not(.new-interface) .card__caption,
        body:not(.new-interface) .card__bottom,
        body:not(.new-interface) .card__details,
        body:not(.new-interface) .card__description,
        body:not(.new-interface) .card__text,
        body:not(.new-interface) .card__subtitle {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        </style>
    `);

    // вставляем стиль в DOM
    $('body').append(
        Lampa.Template.get('old_interface_captions_style', {}, true)
    );

})();
