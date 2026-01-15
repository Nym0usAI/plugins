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
           Показывать названия и год только в нужных разделах
        ========================================== */
        body:not(.new-interface) .card__title,
        body:not(.new-interface) .card__name,
        body:not(.new-interface) .card__year {
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

    // Разделы, где показываем названия и год
    const allowedSections = ['favorites', 'history', 'torrents', 'releases'];

    // MutationObserver
    const observer = new MutationObserver(() => {
        document.querySelectorAll('body:not(.new-interface) .card').forEach(card => {
            const sectionEl = card.closest('[data-section]');
            const section = sectionEl ? sectionEl.dataset.section : null;
            const item = $(card).data('item') || {};

            // проверяем условие: раздел нужный или карточка фильма
            if (allowedSections.includes(section) || item.type === 'movie') {

                // Показываем title и year
                ['title', 'name', 'year'].forEach(cls => {
                    const el = card.querySelector('.card__' + cls);
                    if (el) {
                        el.style.display = 'block';
                        el.style.opacity = '1';
                        el.style.visibility = 'visible';
                    }
                });

                // Подставляем год, если пустой
                const yearEl = card.querySelector('.card__year');
                if (yearEl && !yearEl.textContent.trim() && item.year) {
                    yearEl.textContent = item.year;
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
