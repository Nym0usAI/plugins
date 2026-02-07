(function () {
    'use strict';

    /** 
     * Плагин управления кнопками Lampa
     * Версия: 1.1.1 (без кастомной анимации, без папок, один стандартный режим)
     * Автор: @Cheeze_l
     */

    const STYLE_TAG = 'cardbtn-style';
    const ORDER_STORAGE = 'cardbtn_order';
    const HIDE_STORAGE  = 'cardbtn_hidden';

    let currentContainer = null;

    /* =========================
       ЯЗЫКИ (БЕЗ ИЗМЕНЕНИЙ)
    ========================== */
    Lampa.Lang.add({
        buttons_plugin_title: {
            ru: 'Кнопки',
            en: 'Buttons',
            uk: 'Кнопки',
            be: 'Кнопкі',
            zh: '按钮'
        },
        buttons_plugin_order: {
            ru: 'Порядок кнопок',
            en: 'Buttons order',
            uk: 'Парадак кнопак',
            be: 'Парадак кнопак',
            zh: '按钮顺序'
        }
    });

    /* =========================
       СТИЛИ (ТОЛЬКО НАТИВНЫЕ)
    ========================== */
    function injectStyle() {
        if (document.getElementById(STYLE_TAG)) return;

        const style = document.createElement('style');
        style.id = STYLE_TAG;
        style.textContent = `
            .button--edit-order {
                opacity: .6;
            }
        `;
        document.head.appendChild(style);
    }

    /* =========================
       STORAGE
    ========================== */
    function getOrder() {
        return Lampa.Storage.get(ORDER_STORAGE, []);
    }

    function setOrder(order) {
        Lampa.Storage.set(ORDER_STORAGE, order);
    }

    function getHidden() {
        return Lampa.Storage.get(HIDE_STORAGE, []);
    }

    function setHidden(hidden) {
        Lampa.Storage.set(HIDE_STORAGE, hidden);
    }

    /* =========================
       ОСНОВНАЯ ЛОГИКА
    ========================== */
    function applyChanges(container) {
        if (!container) return;

        currentContainer = container;

        const buttons = container.find('.full-start__button')
            .not('.button--edit-order');

        let order  = getOrder();
        let hidden = getHidden();

        let map = {};
        buttons.each(function () {
            const btn = Lampa.$(this);
            map[btn.data('type')] = btn;
        });

        container.children().detach();

        order.forEach(function (id) {
            if (map[id] && hidden.indexOf(id) === -1) {
                container.append(map[id]);
                delete map[id];
            }
        });

        Object.keys(map).forEach(function (id) {
            if (hidden.indexOf(id) === -1) {
                container.append(map[id]);
            }
        });

        Lampa.Controller.toggle('full_start');
    }

    /* =========================
       РЕДАКТОР КНОПОК
    ========================== */
    function openEditDialog(container) {
        const buttons = container.find('.full-start__button')
            .not('.button--edit-order');

        let order  = getOrder();
        let hidden = getHidden();

        let list = [];

        buttons.each(function () {
            const btn = Lampa.$(this);
            const id  = btn.data('type');

            list.push({
                id: id,
                title: btn.find('.full-start__title').text(),
                hidden: hidden.indexOf(id) !== -1
            });
        });

        Lampa.Select.show({
            title: Lampa.Lang.translate('buttons_plugin_order'),
            items: list,
            onSelect: function (item) {
                if (item.hidden) {
                    hidden = hidden.filter(i => i !== item.id);
                } else {
                    hidden.push(item.id);
                }

                setHidden(hidden);
                applyChanges(container);
            },
            onBack: function () {
                setOrder(list.map(i => i.id));
            }
        });
    }

    /* =========================
       ИНИЦИАЛИЗАЦИЯ
    ========================== */
    function init() {
        injectStyle();

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'start') {
                const container = e.object.activity.render()
                    .find('.full-start__buttons');

                if (!container.length) return;

                currentContainer = container;

                if (!container.find('.button--edit-order').length) {
                    const edit = Lampa.$('<div class="full-start__button button--edit-order"><div class="full-start__title">⋮</div></div>');
                    edit.on('hover:enter', function () {
                        openEditDialog(container);
                    });
                    container.append(edit);
                }

                applyChanges(container);
            }
        });
    }

    init();

})();
