// ==UserScript==
// @name         InterfaceLAMPA Extended
// @version      1.1.0
// @description  Ribbon position + custom card buttons for LAMPA
// @author       ChatGPT
// ==/UserScript==

(function () {
    'use strict';

    /* =========================================================
       RIBBON POSITION
    ========================================================= */

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

    function applyRibbonPosition() {
        let heightValue = '20';

        switch (Lampa.Storage.field('RibbonPosition')) {
            case 'high': heightValue = '16'; break;
            case 'middle': heightValue = '20'; break;
            case 'low': heightValue = '24'; break;
        }

        $('body').find('#custom-ribbon-position').remove();
        $('body').append(`
            <style id="custom-ribbon-position">
                .new-interface-info {
                    height: ${heightValue}em !important;
                }
            </style>
        `);
    }

    applyRibbonPosition();

    Lampa.Listener.follow('full', function () {
        applyRibbonPosition();
    });

    /* =========================================================
       CUSTOM CARD BUTTONS
    ========================================================= */

    const STYLE_TAG = 'cardbtn-style';
    const ORDER_STORAGE = 'cardbtn_order';
    const HIDE_STORAGE = 'cardbtn_hidden';

    let currentCard = null;
    let currentActivity = null;

    function addStyles() {
        if (document.getElementById(STYLE_TAG)) return;
        $('head').append(`
            <style id="${STYLE_TAG}">
                .card-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .card-button-hidden {
                    display: none !important;
                }
                .card-icons-only span { display: none; }
                .card-always-text span { display: block !important; }
            </style>
        `);
    }

    function getStoredArray(key) {
        const data = Lampa.Storage.get(key);
        if (Array.isArray(data)) return data.slice();
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return data.split(',').map(v => v.trim()).filter(Boolean);
            }
        }
        return [];
    }

    function collectButtons(container, detach) {
        const main = container.find('.full-start-new__buttons');
        const extra = container.find('.buttons--container');
        const keys = [];
        const elements = {};

        function process(items) {
            items.each(function () {
                const el = $(this);
                if (el.hasClass('button--play') || el.hasClass('button--priority')) return;
                const cls = (el.attr('class') || '').split(/\s+/).find(c => c.startsWith('button--') || c.startsWith('view--'));
                if (!cls || elements[cls]) return;
                elements[cls] = detach ? el.detach() : el;
                keys.push(cls);
            });
        }

        process(main.find('.full-start__button'));
        process(extra.find('.full-start__button'));

        return { keys, elements, main };
    }

    function rebuildCard(container) {
        if (Lampa.Storage.get('cardbtn_showall') !== true) return;
        if (!container || !container.length) return;

        addStyles();

        container.find('.button--play').remove();
        const collected = collectButtons(container, true);

        const saved = getStoredArray(ORDER_STORAGE);
        const order = saved.length ? saved : collected.keys;

        collected.main.empty();
        order.forEach(k => {
            if (collected.elements[k]) {
                collected.main.append(collected.elements[k]);
            }
        });

        collected.main.addClass('card-buttons');

        const hidden = new Set(getStoredArray(HIDE_STORAGE));
        Object.keys(collected.elements).forEach(k => {
            collected.elements[k].toggleClass('card-button-hidden', hidden.has(k));
        });

        Lampa.Controller.toggle('full_start');

        if (currentActivity && container[0] === currentActivity.html[0]) {
            const first = collected.main.find('.full-start__button.selector').not('.card-button-hidden').first();
            if (first.length) currentActivity.last = first[0];
        }
    }

    Lampa.Listener.follow('full', e => {
        if (e.type === 'build' && e.item) currentActivity = e.item;
        if (e.type === 'complite') {
            currentCard = e.object?.activity?.render?.();
            if (currentCard) rebuildCard(currentCard);
        }
    });

    /* =========================================================
       SETTINGS + MANIFEST
    ========================================================= */

    Lampa.SettingsApi.addComponent({
        component: 'cardbtn',
        name: 'Кнопки в карточке'
    });

    Lampa.SettingsApi.addParam({
        component: 'cardbtn',
        param: {
            name: 'cardbtn_showall',
            type: 'trigger',
            default: false
        },
        field: {
            name: 'Все кнопки в карточке',
            description: 'Требуется перезагрузка приложения'
        },
        onChange: () => Lampa.Settings.update()
    });

    const pluginInfo = {
        type: 'other',
        name: 'InterfaceLAMPA Extended',
        description: 'Ribbon position + custom card buttons',
        version: '1.1.0'
    };

    if (!Array.isArray(Lampa.Manifest.plugins)) {
        Lampa.Manifest.plugins = [];
    }
    Lampa.Manifest.plugins.push(pluginInfo);

})();