// ==UserScript==
// @name         LAMPA Stylish Titles (Selected Sections)
// @version      1.0.0
// @description  Show poster titles only in Releases, Favorites, History, Torrents and Sport
// @author       ChatGPT
// ==/UserScript==

(function () {

    function applyTitles() {

        // Сначала скрываем названия везде (стильный интерфейс)
        $('.card__title').css({
            display: 'none'
        });

        // Разрешённые разделы
        const allowedSelectors = [
            '.activity--releases',
            '.activity--favorites',
            '.activity--history',
            '.activity--torrents',
            '.activity--sport'
        ];

        // Показываем названия ТОЛЬКО в нужных разделах
        allowedSelectors.forEach(selector => {
            $(selector).find('.card__title').css({
                display: 'block',
                opacity: '1',
                maxHeight: '2.6em',
                overflow: 'hidden',
                fontSize: '0.95em',
                lineHeight: '1.3em'
            });
        });
    }

    // Применяем при старте
    applyTitles();

    // Применяем после каждой перерисовки интерфейса
    Lampa.Listener.follow('full', function () {
        applyTitles();
    });

})();