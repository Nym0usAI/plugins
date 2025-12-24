// ==UserScript==
// @name         InterfaceLAMPA Extended
// @version      1.3.0
// @description  Ribbon position + description lines control for Lampa interface
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
                4: '4 строки',
                5: '5 строк',
                6: '6 строк'
            },
            default: 5
        },
        field: {
            name: 'Строки описания',
            description: 'Количество строк текста описания'
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
        let lines = Lampa.Storage.field('DescriptionLines') || 5;

        let style = `
            <style id="custom-interface-extended">

                /* Положение ленты */
                .new-interface-info {
                    height: ${heightValue}em !important;
                }

                /* Описание: настраиваемое количество строк */
                .new-interface-info__description {
                    display: -webkit-box !important;
                    -webkit-line-clamp: ${lines};
                    line-clamp: ${lines};
                    -webkit-box-orient: vertical;
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

    // повторное применение при перерисовке главного экрана
    Lampa.Listener.follow('full', function () {
        applyStyles();
    });

})();
