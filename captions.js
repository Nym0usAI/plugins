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
           (работает только БЕЗ .new-interface)
        ========================================== */

        :not(.new-interface) .card__title,
        :not(.new-interface) .card__name,
        :not(.new-interface) .card__year,
        :not(.new-interface) .card__caption,
        :not(.new-interface) .card__bottom,
        :not(.new-interface) .card__details,
        :not(.new-interface) .card__description,
        :not(.new-interface) .card__text,
        :not(.new-interface) .card__subtitle {
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