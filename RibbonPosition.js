// ==UserScript==
// @name         InterfaceLAMPA Extended
// @version      1.3.2
// @description  Ribbon position + description lines control for Lampa interface
// ==/UserScript==

(function () {
    'use strict';

    if (window.__bylampa_desc_lines__) return;
    window.__bylampa_desc_lines__ = true;

    function waitLampa(cb) {
        if (typeof Lampa !== 'undefined' && Lampa.SettingsApi) cb();
        else setTimeout(() => waitLampa(cb), 300);
    }

    waitLampa(init);

    function init() {

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
            onChange: applyRibbon
        });

        // --- Количество строк описания (НОВАЯ ЛОГИКА) ---
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'bylampa_description_lines',
                type: 'select',
                values: {
                    1: '1 строка',
                    2: '2 строки',
                    3: '3 строки',
                    4: '4 строки',
                    5: '5 строк',
                },
                default: 5
            },
            field: {
                name: 'Описание: строки',
                description: 'Количество строк описания'
            },
            onChange: applyDescriptionLines
        });

        /* ================= ЛЕНТА ================= */

        function applyRibbon() {
            let heightValue = '20';

            switch (Lampa.Storage.field('RibbonPosition')) {
                case 'high': heightValue = '16'; break;
                case 'middle': heightValue = '20'; break;
                case 'low': heightValue = '24'; break;
            }

            const id = 'custom-interface-ribbon-style';
            document.getElementById(id)?.remove();

            const style = document.createElement('style');
            style.id = id;
            style.textContent = `
                .new-interface-info {
                    height: ${heightValue}em !important;
                }
            `;

            document.head.appendChild(style);
        }

        /* ================= ОПИСАНИЕ (ТВОЙ КОД) ================= */

        function applyDescriptionLines() {
            const lines = Number(
                Lampa.Storage.field('bylampa_description_lines') || 4
            );

            const id = 'bylampa-description-lines-style';
            document.getElementById(id)?.remove();

            const style = document.createElement('style');
            style.id = id;
            style.textContent = `
                .new-interface-info__description {
                    display: -webkit-box !important;
                    -webkit-box-orient: vertical !important;
                    -webkit-line-clamp: ${lines} !important;
                    overflow: hidden !important;
                }
            `;

            document.head.appendChild(style);
        }

        /* ================= ИНИЦИАЛИЗАЦИЯ ================= */

        applyRibbon();
        applyDescriptionLines();

        Lampa.Listener.follow('full', applyRibbon);
        Lampa.Listener.follow('full', applyDescriptionLines);

        Lampa.Listener.follow('activity', applyDescriptionLines);
        Lampa.Listener.follow('back', applyDescriptionLines);
    }
})();
