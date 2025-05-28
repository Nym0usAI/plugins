(function() {
    'use strict';

    // Основной объект плагина
    var naruzhe_themes = {
        // Название плагина
        name: 'naruzhe_themes',
        // Версия плагина
        version: '2.0.0',
        // Настройки по умолчанию
        settings: {
            theme: 'mint_dark'
        }
    };

    // Цвета loader'а для каждой темы
    var loaderColors = {
        "default": '#fff',
        violet_blue: '#6a11cb',
        mint_dark: '#3da18d',
        deep_aurora: '#7e7ed9',
        crystal_cyan: '#7ed0f9',
        amber_noir: '#f4a261',
        velvet_sakura: '#f6a5b0'
    };

    // Функция для применения тем
    function applyTheme(theme) {
        // Удаляем предыдущие стили темы
        $('#interface_mod_theme').remove();

        // Если выбрано "Нет", просто удаляем стили
        if (theme === 'default') return;

        var color = loaderColors[theme] || loaderColors["default"];

        var svgCode = encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"135\" height=\"140\" fill=\"".concat(color, "\"><rect width=\"10\" height=\"40\" y=\"100\" rx=\"6\"><animate attributeName=\"height\" begin=\"0s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"40;100;40\" keyTimes=\"0;0.5;1\"/><animate attributeName=\"y\" begin=\"0s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"100;40;100\" keyTimes=\"0;0.5;1\"/></rect><rect width=\"10\" height=\"40\" x=\"20\" y=\"100\" rx=\"6\"><animate attributeName=\"height\" begin=\"0.2s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"40;100;40\" keyTimes=\"0;0.5;1\"/><animate attributeName=\"y\" begin=\"0.2s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"100;40;100\" keyTimes=\"0;0.5;1\"/></rect><rect width=\"10\" height=\"40\" x=\"40\" y=\"100\" rx=\"6\"><animate attributeName=\"height\" begin=\"0.4s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"40;100;40\" keyTimes=\"0;0.5;1\"/><animate attributeName=\"y\" begin=\"0.4s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"100;40;100\" keyTimes=\"0;0.5;1\"/></rect><rect width=\"10\" height=\"40\" x=\"60\" y=\"100\" rx=\"6\"><animate attributeName=\"height\" begin=\"0.6s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"40;100;40\" keyTimes=\"0;0.5;1\"/><animate attributeName=\"y\" begin=\"0.6s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"100;40;100\" keyTimes=\"0;0.5;1\"/></rect><rect width=\"10\" height=\"40\" x=\"80\" y=\"100\" rx=\"6\"><animate attributeName=\"height\" begin=\"0.8s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"40;100;40\" keyTimes=\"0;0.5;1\"/><animate attributeName=\"y\" begin=\"0.8s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"100;40;100\" keyTimes=\"0;0.5;1\"/></rect><rect width=\"10\" height=\"40\" x=\"100\" y=\"100\" rx=\"6\"><animate attributeName=\"height\" begin=\"1s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"40;100;40\" keyTimes=\"0;0.5;1\"/><animate attributeName=\"y\" begin=\"1s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"100;40;100\" keyTimes=\"0;0.5;1\"/></rect><rect width=\"10\" height=\"40\" x=\"120\" y=\"100\" rx=\"6\"><animate attributeName=\"height\" begin=\"1.2s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"40;100;40\" keyTimes=\"0;0.5;1\"/><animate attributeName=\"y\" begin=\"1.2s\" calcMode=\"linear\" dur=\"1s\" repeatCount=\"indefinite\" values=\"100;40;100\" keyTimes=\"0;0.5;1\"/></rect></svg>"));


        // Создаем новый стиль
        var style = $('<style id="interface_mod_theme"></style>');

        // Определяем стили для разных тем
        var themes = {
            mint_dark: "\n.navigation-bar__body\n{background: rgba(18, 32, 36, 0.96);\n}\n.card__quality,\n .card--tv .card__type {\nbackground: linear-gradient(to right, #1e6262dd, #3da18ddd);\n}\n.screensaver__preload {\nbackground:url(\"data:image/svg+xml,".concat(svgCode, "\") no-repeat 50% 50%\n}\n.activity__loader {\nposition:absolute;\ntop:0;\nleft:0;\nwidth:100%;\nheight:100%;\ndisplay:none;\nbackground:url(\"data:image/svg+xml,").concat(svgCode, "\") no-repeat 50% 50%\n \n}\nbody {\nbackground: linear-gradient(135deg, #0a1b2a, #1a4036);\ncolor: #ffffff;\n}\n.company-start.icon--broken .company-start__icon,\n.explorer-card__head-img > img,\n.bookmarks-folder__layer,\n.card-more__box,\n.card__img {\nbackground-color: #1e2c2f;\n}\n.search-source.focus,\n.simple-button.focus,\n.menu__item.focus,\n.menu__item.traverse,\n.menu__item.hover,\n.full-start__button.focus,\n.full-descr__tag.focus,\n.player-panel .button.focus,\n.full-person.selector.focus,\n.tag-count.selector.focus {\nbackground: linear-gradient(to right, #1e6262, #3da18d);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(61, 161, 141, 0.0);\n}\n.selectbox-item.focus,\n.settings-folder.focus,\n.settings-param.focus {\nbackground: linear-gradient(to right, #1e6262, #3da18d);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(61, 161, 141, 0.0);\nborder-radius: 0.5em 0 0 0.5em;\n}\n.full-episode.focus::after,\n.card-episode.focus .full-episode::after,\n.items-cards .selector.focus::after,  \n.card-more.focus .card-more__box::after,\n.card-episode.focus .full-episode::after,\n.card-episode.hover .full-episode::after,\n.card.focus .card__view::after,\n.card.hover .card__view::after,\n.torrent-item.focus::after,\n.online-prestige.selector.focus::after,\n.online-prestige--full.selector.focus::after,\n.explorer-card__head-img.selector.focus::after,\n.extensions__item.focus::after,\n.extensions__block-add.focus::after {\nborder: 0.2em solid #3da18d;\nbox-shadow: 0 0 0.8em rgba(61, 161, 141, 0.0);\n}\n.head__action.focus,\n.head__action.hover {\nbackground: linear-gradient(45deg, #3da18d, #1e6262);\n}\n.modal__content {\nbackground: rgba(18, 32, 36, 0.96);\nborder: 0em solid rgba(18, 32, 36, 0.96);\n}\n.settings__content,\n.settings-input__content,\n.selectbox__content {\nbackground: rgba(18, 32, 36, 0.96);\n}\n.torrent-serial {\nbackground: rgba(0, 0, 0, 0.22);\nborder: 0.2em solid rgba(0, 0, 0, 0.22);\n}\n.torrent-serial.focus {\nbackground-color: #1a3b36cc;\nborder: 0.2em solid #3da18d;\n}\n"),
            crystal_cyan: "\n.navigation-bar__body\n{background: rgba(10, 25, 40, 0.96);\n}\n.card__quality,\n .card--tv .card__type {\nbackground: linear-gradient(to right, #00d2ffdd, #3a8ee6dd);\n}\n.screensaver__preload {\nbackground:url(\"data:image/svg+xml,".concat(svgCode, "\") no-repeat 50% 50%\n}\n.activity__loader {\nposition:absolute;\ntop:0;\nleft:0;\nwidth:100%;\nheight:100%;\ndisplay:none;\nbackground:url(\"data:image/svg+xml,").concat(svgCode, "\") no-repeat 50% 50%\n \n}\nbody {\nbackground: linear-gradient(135deg, #081822, #104059);\ncolor: #ffffff;\n}\n.company-start.icon--broken .company-start__icon,\n.explorer-card__head-img > img,\n.bookmarks-folder__layer,\n.card-more__box,\n.card__img {\nbackground-color: #112b3a;\n}\n.search-source.focus,\n.simple-button.focus,\n.menu__item.focus,\n.menu__item.traverse,\n.menu__item.hover,\n.full-start__button.focus,\n.full-descr__tag.focus,\n.player-panel .button.focus,\n.full-person.selector.focus,\n.tag-count.selector.focus {\nbackground: linear-gradient(to right, #00d2ff, #3a8ee6);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(72, 216, 255, 0.0);\n}\n.selectbox-item.focus,\n.settings-folder.focus,\n.settings-param.focus {\nbackground: linear-gradient(to right, #00d2ff, #3a8ee6);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(72, 216, 255, 0.0);\nborder-radius: 0.5em 0 0 0.5em;\n}\n.full-episode.focus::after,\n.card-episode.focus .full-episode::after,\n.items-cards .selector.focus::after,  \n.card-more.focus .card-more__box::after,\n.card-episode.focus .full-episode::after,\n.card-episode.hover .full-episode::after,\n.card.focus .card__view::after,\n.card.hover .card__view::after,\n.torrent-item.focus::after,\n.online-prestige.selector.focus::after,\n.online-prestige--full.selector.focus::after,\n.explorer-card__head-img.selector.focus::after,\n.extensions__item.focus::after,\n.extensions__block-add.focus::after {\nborder: 0.2em solid #00d2ff;\nbox-shadow: 0 0 0.8em rgba(72, 216, 255, 0.0);\n}\n.head__action.focus,\n.head__action.hover {\nbackground: linear-gradient(45deg, #00d2ff, #3a8ee6);\n}\n.modal__content {\nbackground: rgba(10, 25, 40, 0.96);\nborder: 0em solid rgba(10, 25, 40, 0.96);\n}\n.settings__content,\n.settings-input__content,\n.selectbox__content {\nbackground: rgba(10, 25, 40, 0.96);\n}\n.torrent-serial {\nbackground: rgba(0, 0, 0, 0.22);\nborder: 0.2em solid rgba(0, 0, 0, 0.22);\n}\n.torrent-serial.focus {\nbackground-color: #0c2e45cc;\nborder: 0.2em solid #00d2ff;\n}\n"),
            deep_aurora: "\n.navigation-bar__body\n{background: rgba(18, 34, 59, 0.96);\n}\n.card__quality,\n .card--tv .card__type {\nbackground: linear-gradient(to right, #2c6fc1dd, #7e7ed9dd);\n}\n.screensaver__preload {\nbackground:url(\"data:image/svg+xml,".concat(svgCode, "\") no-repeat 50% 50%\n}\n.activity__loader {\nposition:absolute;\ntop:0;\nleft:0;\nwidth:100%;\nheight:100%;\ndisplay:none;\nbackground:url(\"data:image/svg+xml,").concat(svgCode, "\") no-repeat 50% 50%\n \n}\nbody {\nbackground: linear-gradient(135deg, #1a102b, #0a1c3f);\ncolor: #ffffff;\n}\n.company-start.icon--broken .company-start__icon,\n.explorer-card__head-img > img,\n.bookmarks-folder__layer,\n.card-more__box,\n.card__img {\nbackground-color: #171f3a;\n}\n.search-source.focus,\n.simple-button.focus,\n.menu__item.focus,\n.menu__item.traverse,\n.menu__item.hover,\n.full-start__button.focus,\n.full-descr__tag.focus,\n.player-panel .button.focus,\n.full-person.selector.focus,\n.tag-count.selector.focus {\nbackground: linear-gradient(to right, #2c6fc1, #7e7ed9);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(124, 194, 255, 0.0);\n}\n.selectbox-item.focus,\n.settings-folder.focus,\n.settings-param.focus {\nbackground: linear-gradient(to right, #2c6fc1, #7e7ed9);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(124, 194, 255, 0.0);\nborder-radius: 0.5em 0 0 0.5em;\n}\n.full-episode.focus::after,\n.card-episode.focus .full-episode::after,\n.items-cards .selector.focus::after,  \n.card-more.focus .card-more__box::after,\n.card-episode.focus .full-episode::after,\n.card-episode.hover .full-episode::after,\n.card.focus .card__view::after,\n.card.hover .card__view::after,\n.torrent-item.focus::after,\n.online-prestige.selector.focus::after,\n.online-prestige--full.selector.focus::after,\n.explorer-card__head-img.selector.focus::after,\n.extensions__item.focus::after,\n.extensions__block-add.focus::after {\nborder: 0.2em solid #7e7ed9;\nbox-shadow: 0 0 0.8em rgba(124, 194, 255, 0.0);\n}\n.head__action.focus,\n.head__action.hover {\nbackground: linear-gradient(45deg, #7e7ed9, #2c6fc1);\n}\n.modal__content {\nbackground: rgba(18, 34, 59, 0.96);\nborder: 0em solid rgba(18, 34, 59, 0.96);\n}\n.settings__content,\n.settings-input__content,\n.selectbox__content {\nbackground: rgba(18, 34, 59, 0.96);\n}\n.torrent-serial {\nbackground: rgba(0, 0, 0, 0.22);\nborder: 0.2em solid rgba(0, 0, 0, 0.22);\n}\n.torrent-serial.focus {\nbackground-color: #1a102bcc;\nborder: 0.2em solid #7e7ed9;\n}\n"),
            amber_noir: "\n.navigation-bar__body\n{background: rgba(28, 18, 10, 0.96);\n}\n.card__quality,\n .card--tv .card__type {\nbackground: linear-gradient(to right, #f4a261dd, #e76f51dd);\n}\n.screensaver__preload {\nbackground:url(\"data:image/svg+xml,".concat(svgCode, "\") no-repeat 50% 50%\n}\n.activity__loader {\nposition:absolute;\ntop:0;\nleft:0;\nwidth:100%;\nheight:100%;\ndisplay:none;\nbackground:url(\"data:image/svg+xml,").concat(svgCode, "\") no-repeat 50% 50%\n \n}\nbody {\nbackground: linear-gradient(135deg, #1f0e04, #3b2a1e);\ncolor: #ffffff;\n}\n.company-start.icon--broken .company-start__icon,\n.explorer-card__head-img > img,\n.bookmarks-folder__layer,\n.card-more__box,\n.card__img {\nbackground-color: #2a1c11;\n}\n.search-source.focus,\n.simple-button.focus,\n.menu__item.focus,\n.menu__item.traverse,\n.menu__item.hover,\n.full-start__button.focus,\n.full-descr__tag.focus,\n.player-panel .button.focus,\n.full-person.selector.focus,\n.tag-count.selector.focus {\nbackground: linear-gradient(to right, #f4a261, #e76f51);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(255, 160, 90, 0.0);\n}\n.selectbox-item.focus,\n.settings-folder.focus,\n.settings-param.focus {\nbackground: linear-gradient(to right, #f4a261, #e76f51);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(255, 160, 90, 0.0);\nborder-radius: 0.5em 0 0 0.5em;\n}\n.full-episode.focus::after,\n.card-episode.focus .full-episode::after,\n.items-cards .selector.focus::after,  \n.card-more.focus .card-more__box::after,\n.card-episode.focus .full-episode::after,\n.card-episode.hover .full-episode::after,\n.card.focus .card__view::after,\n.card.hover .card__view::after,\n.torrent-item.focus::after,\n.online-prestige.selector.focus::after,\n.online-prestige--full.selector.focus::after,\n.explorer-card__head-img.selector.focus::after,\n.extensions__item.focus::after,\n.extensions__block-add.focus::after {\nborder: 0.2em solid #f4a261;\nbox-shadow: 0 0 0.8em rgba(255, 160, 90, 0.0);\n}\n.head__action.focus,\n.head__action.hover {\nbackground: linear-gradient(45deg, #f4a261, #e76f51);\n}\n.modal__content {\nbackground: rgba(28, 18, 10, 0.96);\nborder: 0em solid rgba(28, 18, 10, 0.96);\n}\n.settings__content,\n.settings-input__content,\n.selectbox__content {\nbackground: rgba(28, 18, 10, 0.96);\n}\n.torrent-serial {\nbackground: rgba(0, 0, 0, 0.22);\nborder: 0.2em solid rgba(0, 0, 0, 0.22);\n}\n.torrent-serial.focus {\nbackground-color: #3b2412cc;\nborder: 0.2em solid #f4a261;\n}\n"),
            velvet_sakura: "\n.navigation-bar__body\n{background: rgba(56, 32, 45, 0.96);\n}\n.card__quality,\n .card--tv .card__type {\nbackground: linear-gradient(to right, #f6a5b0dd, #f9b8d3dd);\n}\n.screensaver__preload {\nbackground:url(\"data:image/svg+xml,".concat(svgCode, "\") no-repeat 50% 50%\n}\n.activity__loader {\nposition:absolute;\ntop:0;\nleft:0;\nwidth:100%;\nheight:100%;\ndisplay:none;\nbackground:url(\"data:image/svg+xml,").concat(svgCode, "\") no-repeat 50% 50%\n \n}\nbody {\nbackground: linear-gradient(135deg, #4b0e2b, #7c2a57);\ncolor: #ffffff;\n}\n.company-start.icon--broken .company-start__icon,\n.explorer-card__head-img > img,\n.bookmarks-folder__layer,\n.card-more__box,\n.card__img {\nbackground-color: #5c0f3f;\n}\n.search-source.focus,\n.simple-button.focus,\n.menu__item.focus,\n.menu__item.traverse,\n.menu__item.hover,\n.full-start__button.focus,\n.full-descr__tag.focus,\n.player-panel .button.focus,\n.full-person.selector.focus,\n.tag-count.selector.focus {\nbackground: linear-gradient(to right, #f6a5b0, #f9b8d3);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(246, 165, 176, 0.0);\n}\n.selectbox-item.focus,\n.settings-folder.focus,\n.settings-param.focus {\nbackground: linear-gradient(to right, #f6a5b0, #f9b8d3);\ncolor: #fff;\nbox-shadow: 0 0.0em 0.4em rgba(246, 165, 176, 0.0);\nborder-radius: 0.5em 0 0 0.5em;\n}\n.full-episode.focus::after,\n.card-episode.focus .full-episode::after,\n.items-cards .selector.focus::after,  \n.card-more.focus .card-more__box::after,\n.card-episode.focus .full-episode::after,\n.card-episode.hover .full-episode::after,\n.card.focus .card__view::after,\n.card.hover .card__view::after,\n.torrent-item.focus::after,\n.online-prestige.selector.focus::after,\n.online-prestige--full.selector.focus::after,\n.explorer-card__head-img.selector.focus::after,\n.extensions__item.focus::after,\n.extensions__block-add.focus::after {\nborder: 0.2em solid #f6a5b0;\nbox-shadow: 0 0 0.8em rgba(246, 165, 176, 0.0);\n}\n.head__action.focus,\n.head__action.hover {\nbackground: linear-gradient(45deg, #f9b8d3, #f6a5b0);\n}\n.modal__content {\nbackground: rgba(56, 32, 45, 0.96);\nborder: 0em solid rgba(56, 32, 45, 0.96);\n}\n.settings__content,\n.settings-input__content,\n.selectbox__content {\nbackground: rgba(56, 32, 45, 0.96);\n}\n.torrent-serial {\nbackground: rgba(0, 0, 0, 0.22);\nborder: 0.2em solid rgba(0, 0, 0, 0.22);\n}\n.torrent-serial.focus {\nbackground-color: #7c2a57cc;\nborder: 0.2em solid #f6a5b0;\n}\n")
        };

        // Устанавливаем стили для выбранной темы
        style.html(themes[theme] || '');

        // Добавляем стиль в head
        $('head').append(style);
    }
    
  // Дополнительные Шаблоны, не меняющиеся от цветовых стилей    
  function AddIn() {
        // Стили 
        var style = "\n        <style>\n " +
            // Круглые чек-боксы
            ".selectbox-item__checkbox\n {\nborder-radius: 100%\n}\n" +
            ".selectbox-item--checked .selectbox-item__checkbox\n {\nbackground: #ccc;\n}\n" +
            // Пробуем немного анимацмм
            ".card\n{transform: scale(1);\ntransition: transform 0.3s ease;\n}\n" +
            ".card.focus\n{transform: scale(1.03);\n}\n" +
            ".torrent-item,\n.online-prestige\n{transform: scale(1);\ntransition: transform 0.3s ease;\n}\n" +
            ".torrent-item.focus,\n.online-prestige.focus\n{transform: scale(1.01);\n}\n" +
            ".tag-count,\n.full-person,\n.full-episode,\n.simple-button,\n.full-start__button,\n.items-cards .selector,\n.card-more,\n.explorer-card__head-img.selector,\n.card-episode\n{transform: scale(1);\ntransition: transform 0.3s ease;\n}\n" +
            ".tag-count.focus,\n.full-person.focus,\n.full-episode.focus,\n.simple-button.focus,\n.full-start__button.focus,\n.items-cards .selector.focus,\n.card-more.focus,\n.explorer-card__head-img.selector.focus,\n.card-episode.focus\n{transform: scale(1.03);\n}\n" +
            ".menu__item {\n  transition: transform 0.3s ease;\n}\n" +
            ".menu__item.focus {\n transform: translateX(-0.2em);\n}\n" +
            ".selectbox-item,\n.settings-folder,\n.settings-param {\n transition: transform 0.3s ease;\n}\n" +
            ".selectbox-item.focus,\n.settings-folder.focus,\n.settings-param.focus {\n transform: translateX(0.2em);\n}\n" +
            // Меню слева
            ".menu__item.focus {border-radius: 0 0.5em 0.5em 0;\n}\n" +
            ".menu__list {\npadding-left: 0em;\n}\n" +
            "</style>\n";
        Lampa.Template.add('card_css', style);
        $('body').append(Lampa.Template.get('card_css', {}, true));
                       // Тип (Сериал)

            ".card__type  {\n  position: absolute;\n  bottom: auto; \n left: 0em; \nright: auto;\n  top: 0em;\n  background: rgba(0, 0, 0, 0.6);\n  color: #fff;\n  font-weight: 700;\n  padding: 0.4em 0.6em;\n  -webkit-border-radius: 0.4em 0 0.4em 0;\n     -moz-border-radius: 0.4em 0 0.4em 0;;\n          border-radius: 0.4em 0 0.4em 0;\nline-height: 1.0;\nfont-size: 1.0em;\n}\n " +

            ".card--tv .card__type {\n  color: #fff;\n}\n" +
                           // отметка качества background: rgba(0, 0, 0, 0.6);\n  

            ".card__quality {\n  position: absolute;\n  left: auto;\n right: 0em;\n  bottom: 2.4em;\n  padding: 0.4em 0.6em;\n  color: #fff;\n font-weight: 700;\n  font-size: 1.0em;\n  -webkit-border-radius: 0.5em 0 0 0.5em;\n  -moz-border-radius: 0.5em 0 0 0.5em;\n  border-radius: 0.5em 0 0 0.5em;\n  text-transform: uppercase;\n}\n" +
    }

    // Функция инициализации плагина
    function startPlugin() {
        // Список доступных тем
        var availableThemes = ['mint_dark', 'deep_aurora', 'crystal_cyan', 'amber_noir', 'velvet_sakura'];
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'theme_select',
                type: 'select',
                values: {
                    mint_dark: 'Mint Dark',
                    deep_aurora: 'Deep Aurora',
                    crystal_cyan: 'Crystal Cyan',
                    amber_noir: 'Amber Noir',
                    velvet_sakura: 'Velvet Sakura'
                    //default: 'Classic'
                },
                "default": 'Mint Dark'
            },
            field: {
                name: 'Тема оформления',
                description: ''
            },
            onChange: function onChange(value) {
                naruzhe_themes.settings.theme = value;
                Lampa.Settings.update();
                applyTheme(value);
            }
        });
        Lampa.Settings.listener.follow('open', function(e) {
            if (e.name == 'interface') {
                $("div[data-name=interface_size]").after($("div[data-name=theme_select]"));
            }
        });

        // Применяем настройки и проверяем, существует ли выбранная тема
        var savedTheme = Lampa.Storage.get('theme_select', 'mint_dark');
        if (availableThemes.indexOf(savedTheme) === -1) {
            // Если сохраненная тема не существует, ставим по умолчанию
            Lampa.Storage.set('theme_select', 'mint_dark');
            savedTheme = 'mint_dark';
        }
        naruzhe_themes.settings.theme = savedTheme;
        applyTheme(naruzhe_themes.settings.theme);
    }

    // Ждем загрузки приложения и запускаем плагин
    if (window.appready) {
        startPlugin();
        AddIn();
    } else {
        Lampa.Listener.follow('app', function(event) {
            if (event.type === 'ready') {
                startPlugin();
                AddIn();
            }
        });
    }
    // Регистрация плагина в манифесте
    Lampa.Manifest.plugins = {
        name: 'naruzhe_themes',
        version: '2.0.0',
        description: 'naruzhe_themes'
    };

    // Экспортируем объект плагина для внешнего доступа
    window.naruzhe_themes = naruzhe_themes;
})();