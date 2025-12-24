// ==UserScript==
// @name         InterfaceLAMPA Extended
// @version      1.1.0
// @description  Ribbon position + description control for Lampa interface
// @author       ChatGPT
// ==/UserScript==

(function () {

    /* ================= НАСТРОЙКИ ================= */

    // --- Положение ленты ---
    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'RibbonPosition',
            type: 'select',
            values: {
                high: 'Высоко',
                middle: 'Средне',
                low: 'Низко'
            },
            default: 'middle'
        },
        field: {
            name: 'Положение ленты',
            description: 'Вертикальное положение постеров'
        },
        onChange: function () {
            Lampa.Settings.update();
            applyStyles();
        }
    });

    // --- Показывать описание ---
    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'ShowDescription',
            type: 'trigger',
            default: true
        },
        field: {
            name: 'Показывать описание',
            description: 'Описание фильма/сериала на главной'
        },
        onChange: function () {
            Lampa.Settings.update();
            applyStyles();
        }
    });

    // --- Количество строк описания ---
    Lampa.SettingsApi.addParam({
        component: 'interface',
        param: {
            name: 'DescriptionLines',
            type: 'select',
            values: {
                1: '1 строка',
                2: '2 строки',
                3: '3 строки',
                4: '4 строки'
            },
            default: 4
        },
        field: {
            name: 'Строки описания',
            description: 'Сколько строк текста показывать'
        },
        onChange: function () {
            Lampa.Settings.update();
            applyStyles();
        }
    });

    /* ================= ПРИМЕНЕНИЕ СТИЛЕЙ ================= */

    function applyStyles() {

        /* --- ЛЕНТА --- */
        let heightValue = '20';

        switch (Lampa.Storage.field('RibbonPosition')) {
            case 'high': heightValue = '16'; break;
            case 'middle': heightValue = '20'; break;
            case 'low': heightValue = '24'; break;
        }

        /* --- ОПИСАНИЕ --- */
        let showDesc = Lampa.Storage.field('ShowDescription');
        let lines = Lampa.Storage.field('DescriptionLines') || 4;

        let descCSS = showDesc
            ? `
                display: -webkit-box;
                -webkit-line-clamp: ${lines};
                line-clamp: ${lines};
                -webkit-box-orient: vertical;
              `
            : `
                display: none !important;
              `;

        let style = `
            <style id="custom-interface-extended">

                /* Положение ленты */
                .new-interface-info {
                    height: ${heightValue}em !important;
                }

                /* Описание */
                .new-interface-info__description {
                    ${descCSS}
                }

            </style>
        `;

        // удалить старый стиль
        $('#custom-interface-extended').remove();
        // добавить новый
        $('body').append(style);
    }

    /* ================= ИНИЦИАЛИЗАЦИЯ ================= */

    applyStyles();

    // повторно применять при перерисовке интерфейса
    Lampa.Listener.follow('full', function () {
        applyStyles();
    });

})();
