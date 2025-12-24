// ==UserScript==
// @name         InterfaceLAMPA Extended
// @version      1.0.0
// @description  Add ribbon position control to Lampa interface
// @author       ChatGPT
// ==/UserScript==

(function () {
    // ========== Настройки ==========

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
            description: 'Контролирует вертикальное положение постеров'
        },
        onChange: function () {
            Lampa.Settings.update();
            applyRibbonPosition();
        }
    });

    // ========== Функция применения позиции ==========

    function applyRibbonPosition() {
        let heightValue = '20'; // default

        switch (Lampa.Storage.field('RibbonPosition')) {
            case 'high':
                heightValue = '16';
                break;
            case 'middle':
                heightValue = '20';
                break;
            case 'low':
                heightValue = '24';
                break;
        }

        // Внедряем CSS
        let style = `
            <style id="custom-ribbon-position">
                .new-interface-info {
                    height: ${heightValue}em !important;
                }
            </style>
        `;

        // Удаляем старый
        $('body').find('#custom-ribbon-position').remove();
        // Добавляем новый
        $('body').append(style);
    }

    // ========== Инициализация при старте ==========

    applyRibbonPosition();

    // ========== Перехват рендера интерфейса ==========

    // Если интерфейс динамически перерисовывается,
    // то применяем позицию после рендера постеров
    Lampa.Listener.follow('full', function () {
        applyRibbonPosition();
    });
})();