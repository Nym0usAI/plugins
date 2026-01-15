(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;

    // защита от повторного подключения
    if (window.plugin_old_interface_captions) return;
    window.plugin_old_interface_captions = true;

    // CSS для старого интерфейса
    Lampa.Template.add('old_interface_captions_style', `
        <style>
        /* =========================================
           СТАРЫЙ ИНТЕРФЕЙС
           Всегда показывать названия и год
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

    // ==========================
    // MutationObserver — следим за динамически появляющимися карточками
    // ==========================
    const observer = new MutationObserver(() => {
        document.querySelectorAll('body:not(.new-interface) .card').forEach(card => {

            // Показываем все нужные элементы
            ['title', 'name', 'year', 'caption', 'bottom', 'details', 'description', 'text', 'subtitle'].forEach(cls => {
                const el = card.querySelector('.card__' + cls);
                if (el) {
                    el.style.display = 'block';
                    el.style.opacity = '1';
                    el.style.visibility = 'visible';
                }
            });

            // Подставляем год, если пустой
            const yearEl = card.querySelector('.card__year');
            if (yearEl && !yearEl.textContent.trim()) {
                // берем год из данных карточки Lampa (если есть)
                const item = $(card).data('item') || {};
                if (item.year) yearEl.textContent = item.year;
            }

        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
