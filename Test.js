(function () {
    'use strict';

    // Константы плагина
    const STYLE_TAG = 'cardbtn-style';
    const ORDER_STORAGE = 'cardbtn_order';
    const HIDE_STORAGE = 'cardbtn_hidden';
    const VIEWMODE_STORAGE = 'cardbtn_viewmode';
    const ENABLED_STORAGE = 'cardbtn_enabled';
    
    let currentCard = null;
    let currentActivity = null;
    let allButtonsOriginal = [];
    let currentButtons = [];

    // Иконка для ламповых кнопок
    const LAMPAC_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z" fill="currentColor"></path></svg>';

    // Группы кнопок для категоризации
    const BUTTON_GROUPS = [
        { name: 'online', patterns: ['online', 'lampac', 'modss', 'showy'], label: 'Онлайн' },
        { name: 'torrent', patterns: ['torrent'], label: 'Торренты' },
        { name: 'trailer', patterns: ['trailer', 'rutube'], label: 'Трейлеры' },
        { name: 'favorite', patterns: ['favorite'], label: 'Избранное' },
        { name: 'subscribe', patterns: ['subscribe'], label: 'Подписка' },
        { name: 'book', patterns: ['book'], label: 'Закладки' },
        { name: 'reaction', patterns: ['reaction'], label: 'Реакции' }
    ];

    // Метки по умолчанию
    const DEFAULT_LABELS = {
        'button--play': () => Lampa.Lang.translate('title_watch'),
        'button--book': () => Lampa.Lang.translate('settings_input_links'),
        'button--reaction': () => Lampa.Lang.translate('title_reactions'),
        'button--subscribe': () => Lampa.Lang.translate('title_subscribe'),
        'button--options': () => Lampa.Lang.translate('more'),
        'view--torrent': () => Lampa.Lang.translate('full_torrents'),
        'view--trailer': () => Lampa.Lang.translate('full_trailers')
    };

    // Добавляет стили плагина
    function addStyles() {
        if (document.getElementById(STYLE_TAG)) return;
        const css = `
            .card-buttons {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 10px !important;
            }
            .card-button-hidden {
                display: none !important;
            }
            .card-icons-only span {
                display: none !important;
            }
            .card-always-text span {
                display: block !important;
            }
            .head__action.edit-card svg {
                width: 26px;
                height: 26px;
            }
            .button--edit-order {
                order: 9999 !important;
            }
            .menu-edit-list__item-hidden {
                opacity: 0.5;
            }
            .viewmode-switch, .folder-reset-button {
                background: rgba(100,100,255,0.3);
                margin: 0.5em 0;
                border-radius: 0.3em;
                text-align: center;
                padding: 1em;
            }
            .viewmode-switch.focus, .folder-reset-button.focus {
                border: 3px solid rgba(255,255,255,0.8);
            }
            .folder-reset-button {
                background: rgba(200,100,100,0.3);
                margin-top: 1em;
            }
            .menu-edit-list__toggle.focus {
                border: 2px solid rgba(255,255,255,0.8);
                border-radius: 0.3em;
            }
        `;
        $('head').append(`<style id="${STYLE_TAG}">${css}</style>`);
    }

    // Читает массив из Storage
    function getStoredArray(key) {
        const data = Lampa.Storage.get(key);
        if (Array.isArray(data)) return data.slice();
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return data.split(',').map(v => v.trim()).filter(Boolean);
            }
        }
        return [];
    }

    // Получает контейнер карточки
    function getCardContainer(e) {
        if (e && e.body) return e.body;
        if (e && e.link && e.link.html) return e.link.html;
        if (e && e.object && e.object.activity && typeof e.object.activity.render === 'function') 
            return e.object.activity.render();
        return null;
    }

    // Извлекает уникальный ключ кнопки
    function extractButtonKey($element) {
        const classes = ($element.attr('class') || '').split(/\s+/);
        
        // Специальные случаи
        if (classes.some(c => c.includes('modss'))) return 'modss_online_button';
        if (classes.some(c => c.includes('showy'))) return 'showy_online_button';
        
        const keyClass = classes.find(c => c.startsWith('button--') && c !== 'button--priority') ||
                       classes.find(c => c.startsWith('view--'));
        if (keyClass) return keyClass;
        
        const dataKey = $element.data('id') || $element.data('name') || $element.attr('data-name');
        if (dataKey) return `data:${dataKey}`;
        
        const text = $element.find('span').first().text().trim() || $element.text().trim();
        if (text) return `text:${text.replace(/\s+/g, '_')}`;
        
        return `hash:${Lampa.Utils.hash($element.clone().removeClass('focus').prop('outerHTML'))}`;
    }

    // Определяет тип кнопки для сортировки
    function getButtonType($button) {
        const classes = ($button.attr('class') || '').toLowerCase();
        for (const group of BUTTON_GROUPS) {
            for (const pattern of group.patterns) {
                if (classes.includes(pattern)) {
                    return group.name;
                }
            }
        }
        return 'other';
    }

    // Извлекает текст кнопки
    function extractButtonLabel(key, $element) {
        const text = $element.find('span').first().text().trim() || $element.text().trim();
        if (text) return text;
        if (DEFAULT_LABELS[key]) return DEFAULT_LABELS[key]();
        return key.replace(/^[^_]+_/, '').replace(/_/g, ' ');
    }

    // Собирает все кнопки из карточки
    function collectButtons(container, detach = false) {
        const mainArea = container.find('.full-start-new__buttons');
        const extraArea = container.find('.buttons--container');
        const keys = [];
        const elements = {};

        function process($items) {
            $items.each(function () {
                const $item = $(this);
                // Пропускаем кнопки воспроизведения и редактирования
                if ($item.hasClass('button--play') || $item.hasClass('button--edit-order')) return;
                
                // Обновляем иконку для ламповых кнопок
                if ($item.hasClass('lampac--button') && !$item.hasClass('modss--button') && !$item.hasClass('showy--button')) {
                    const svg = $item.find('svg').first();
                    if (svg.length && !svg.hasClass('modss-online-icon')) {
                        svg.replaceWith(LAMPAC_ICON);
                    }
                }

                const key = extractButtonKey($item);
                if (!key || elements[key]) return;

                elements[key] = detach ? $item.detach() : $item;
                keys.push(key);
                
                // Сохраняем оригинальную кнопку для сброса
                if (detach && !allButtonsOriginal.some(b => extractButtonKey($(b)) === key)) {
                    allButtonsOriginal.push($item.clone(true, true));
                }
            });
        }

        process(mainArea.find('.full-start__button'));
        process(extraArea.find('.full-start__button'));

        return { keys, elements, mainArea };
    }

    // Создает кнопку редактирования
    function createEditButton() {
        const btn = $(`
            <div class="full-start__button selector button--edit-order">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </div>
        `);

        btn.on('hover:enter', () => {
            startEditor(currentCard || findActiveCard(), false);
        });

        return btn;
    }

    // Сортирует кнопки по пользовательскому порядку
    function sortButtonsByOrder(buttons, savedOrder) {
        if (!savedOrder.length) {
            // Сортировка по умолчанию: онлайн → торренты → трейлеры → остальное
            return buttons.sort((a, b) => {
                const order = ['online', 'torrent', 'trailer', 'favorite', 'subscribe', 'book', 'reaction', 'other'];
                const typeA = getButtonType($(a));
                const typeB = getButtonType($(b));
                const indexA = order.indexOf(typeA);
                const indexB = order.indexOf(typeB);
                
                // Приоритет для специальных кнопок
                const keyA = extractButtonKey($(a));
                const keyB = extractButtonKey($(b));
                if (keyA === 'modss_online_button') return -1;
                if (keyB === 'modss_online_button') return 1;
                if (keyA === 'showy_online_button') return -1;
                if (keyB === 'showy_online_button') return 1;
                
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            });
        }

        const sorted = [];
        const remaining = buttons.slice();
        const buttonMap = new Map();
        
        buttons.forEach(btn => {
            buttonMap.set(extractButtonKey($(btn)), btn);
        });

        // Добавляем в сохраненном порядке
        savedOrder.forEach(key => {
            const btn = buttonMap.get(key);
            if (btn) {
                sorted.push(btn);
                const index = remaining.indexOf(btn);
                if (index > -1) remaining.splice(index, 1);
            }
        });

        // Добавляем оставшиеся
        return sorted.concat(remaining);
    }

    // Применяет скрытие кнопок
    function applyHiddenButtons(buttons) {
        const hidden = new Set(getStoredArray(HIDE_STORAGE));
        buttons.forEach(btn => {
            const $btn = $(btn);
            const key = extractButtonKey($btn);
            $btn.toggleClass('card-button-hidden', hidden.has(key));
        });
    }

    // Основная функция перестройки кнопок
    function rebuildCard(container) {
        if (!container || !container.length) return;
        if (Lampa.Storage.get(ENABLED_STORAGE) !== true) return;

        addStyles();

        // Добавляем кнопку редактирования в заголовок
        const header = container.find('.head__actions');
        if (header.length) {
            let pencil = header.find('.edit-card');
            if (!pencil.length) {
                pencil = $(`
                    <div class="head__action selector edit-card">
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                `);
                header.find('.open--settings').after(pencil);
                pencil.on('hover:enter', () => startEditor(container, false));
            }
        }

        // Собираем кнопки
        const priorityBtn = container.find('.full-start-new__buttons .button--priority').detach();
        container.find('.full-start-new__buttons .button--play').remove();
        
        const collected = collectButtons(container, true);
        const { elements, mainArea } = collected;

        // Конвертируем объект в массив
        let buttons = Object.values(elements);
        
        // Сортируем
        const savedOrder = getStoredArray(ORDER_STORAGE);
        buttons = sortButtonsByOrder(buttons, savedOrder);
        currentButtons = buttons;

        // Восстанавливаем контейнер
        mainArea.empty();
        if (priorityBtn.length) mainArea.append(priorityBtn);
        buttons.forEach(btn => mainArea.append(btn));
        
        // Добавляем кнопку редактирования
        const editBtn = createEditButton();
        mainArea.append(editBtn);

        // Применяем настройки
        applyHiddenButtons(buttons);
        
        const mode = Lampa.Storage.get(VIEWMODE_STORAGE, 'default');
        mainArea.removeClass('card-icons-only card-always-text');
        if (mode === 'icons') mainArea.addClass('card-icons-only');
        if (mode === 'always') mainArea.addClass('card-always-text');
        
        mainArea.addClass('card-buttons');

        // Обновляем фокус
        if (currentActivity && currentActivity.html && container[0] === currentActivity.html[0]) {
            const first = mainArea.find('.full-start__button.selector').not('.card-button-hidden').first();
            if (first.length) currentActivity.last = first[0];
        }

        Lampa.Controller.toggle("full_start");
    }

    // Получает отображаемое имя кнопки
    function getButtonDisplayName($btn) {
        let text = $btn.find('span').text().trim();
        if (text) return text;
        
        const classes = $btn.attr('class') || '';
        const keyClass = classes.split(' ').find(c => c.startsWith('view--') || c.startsWith('button--'));
        if (keyClass) {
            return keyClass.replace('view--', '').replace('button--', '')
                          .replace(/_/g, ' ')
                          .replace(/^\w/, c => c.toUpperCase());
        }
        
        return 'Кнопка';
    }

    // Открывает редактор кнопок
    function startEditor(container, fromSettings = false) {
        if (!container || !container.length) return;

        const collected = collectButtons(container, false);
        const buttons = Object.values(collected.elements);
        const orderedButtons = sortButtonsByOrder(buttons, getStoredArray(ORDER_STORAGE));
        
        const hidden = new Set(getStoredArray(HIDE_STORAGE));
        const editorList = $('<div class="menu-edit-list"></div>');

        // Переключатель режима отображения
        const modes = ['default', 'icons', 'always'];
        const modeLabels = { default: 'Стандартный', icons: 'Только иконки', always: 'Всегда с текстом' };
        let currentMode = Lampa.Storage.get(VIEWMODE_STORAGE, 'default');
        
        const modeBtn = $(`
            <div class="selector viewmode-switch">
                <div>Режим отображения: ${modeLabels[currentMode]}</div>
            </div>
        `);
        
        modeBtn.on('hover:enter', () => {
            const idx = modes.indexOf(currentMode);
            currentMode = modes[(idx + 1) % modes.length];
            Lampa.Storage.set(VIEWMODE_STORAGE, currentMode);
            modeBtn.find('div').text(`Режим отображения: ${modeLabels[currentMode]}`);
            
            if (container) {
                const target = container.find('.full-start-new__buttons');
                target.removeClass('card-icons-only card-always-text');
                if (currentMode === 'icons') target.addClass('card-icons-only');
                if (currentMode === 'always') target.addClass('card-always-text');
            }
        });
        
        editorList.append(modeBtn);

        // Создаем элементы списка
        orderedButtons.forEach(btn => {
            const $btn = $(btn);
            const key = extractButtonKey($btn);
            const label = getButtonDisplayName($btn);
            const isHidden = hidden.has(key);
            const icon = $btn.find('svg').first().clone();

            const row = $(`
                <div class="menu-edit-list__item" data-key="${key}">
                    <div class="menu-edit-list__icon"></div>
                    <div class="menu-edit-list__title">${label}</div>
                    <div class="menu-edit-list__move move-up selector">
                        <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="menu-edit-list__move move-down selector">
                        <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="menu-edit-list__toggle toggle selector">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>
                            <path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="${isHidden ? 0 : 1}" stroke-linecap="round"/>
                        </svg>
                    </div>
                </div>
            `);

            if (icon.length) row.find('.menu-edit-list__icon').append(icon);
            row.toggleClass('menu-edit-list__item-hidden', isHidden);

            // Перемещение вверх
            row.find('.move-up').on('hover:enter', () => {
                const prev = row.prev();
                if (prev.length && !prev.hasClass('viewmode-switch')) {
                    row.insertBefore(prev);
                }
            });

            // Перемещение вниз
            row.find('.move-down').on('hover:enter', () => {
                const next = row.next();
                if (next.length && !next.hasClass('folder-reset-button')) {
                    row.insertAfter(next);
                }
            });

            // Переключение видимости
            row.find('.toggle').on('hover:enter', () => {
                const nowHidden = !row.hasClass('menu-edit-list__item-hidden');
                row.toggleClass('menu-edit-list__item-hidden', nowHidden);
                row.find('.dot').attr('opacity', nowHidden ? 0 : 1);
                
                const hiddenArray = getStoredArray(HIDE_STORAGE);
                const index = hiddenArray.indexOf(key);
                
                if (nowHidden && index === -1) {
                    hiddenArray.push(key);
                } else if (!nowHidden && index !== -1) {
                    hiddenArray.splice(index, 1);
                }
                
                Lampa.Storage.set(HIDE_STORAGE, hiddenArray);
                $btn.toggleClass('card-button-hidden', nowHidden);
            });

            editorList.append(row);
        });

        // Кнопка сброса
        const resetBtn = $(`
            <div class="selector folder-reset-button">
                <div>Сбросить настройки по умолчанию</div>
            </div>
        `);
        
        resetBtn.on('hover:enter', () => {
            Lampa.Storage.set(ORDER_STORAGE, []);
            Lampa.Storage.set(HIDE_STORAGE, []);
            Lampa.Storage.set(VIEWMODE_STORAGE, 'default');
            Lampa.Modal.close();
            
            setTimeout(() => {
                if (container) {
                    rebuildCard(container);
                    Lampa.Controller.toggle("full_start");
                }
            }, 100);
        });
        
        editorList.append(resetBtn);

        // Открываем модальное окно
        Lampa.Modal.open({
            title: 'Редактировать кнопки',
            html: editorList,
            size: 'small',
            scroll_to_center: true,
            onBack: () => {
                // Сохраняем новый порядок
                const newOrder = [];
                editorList.find('.menu-edit-list__item').each(function() {
                    const key = $(this).data('key');
                    if (key) newOrder.push(key);
                });
                
                Lampa.Storage.set(ORDER_STORAGE, newOrder);
                Lampa.Modal.close();
                
                // Перестраиваем карточку
                rebuildCard(container);
                
                setTimeout(() => {
                    if (fromSettings) {
                        Lampa.Controller.toggle("settings_component");
                    } else {
                        Lampa.Controller.toggle("full_start");
                    }
                }, 100);
            }
        });
    }

    // Запуск редактора из настроек
    function startEditorFromSettings() {
        const activeCard = findActiveCard();
        if (!activeCard || !activeCard.length) {
            Lampa.Modal.open({
                title: Lampa.Lang.translate('title_error'),
                html: Lampa.Template.get('error', {
                    title: Lampa.Lang.translate('title_error'),
                    text: 'Откройте карточку фильма для редактирования кнопок'
                }),
                size: 'small',
                onBack: () => {
                    Lampa.Modal.close();
                    setTimeout(() => Lampa.Controller.toggle("settings_component"), 100);
                }
            });
            return;
        }
        
        currentCard = activeCard;
        startEditor(activeCard, true);
    }

    // Находит активную карточку
    function findActiveCard() {
        return $('.full-start-new').first();
    }

    // Слушатель событий карточки
    function cardListener() {
        Lampa.Listener.follow('full', e => {
            if (e.type === 'build' && e.name === 'start' && e.item && e.item.html) {
                currentActivity = e.item;
            }
            
            if (e.type === 'complite') {
                const container = getCardContainer(e);
                if (!container) return;
                
                currentCard = container;
                container.data('buttons-processed', false);
                
                setTimeout(() => {
                    if (!container.data('buttons-processed')) {
                        container.data('buttons-processed', true);
                        rebuildCard(container);
                    }
                }, 400);
            }
        });
    }

    const CardHandler = {
        run: cardListener,
        fromSettings: startEditorFromSettings
    };

    // Настройки плагина
    function setupSettings() {
        Lampa.SettingsApi.addComponent({
            component: "cardbtn",
            name: 'Кнопки в карточке',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'
        });

        // Включение плагина
        Lampa.SettingsApi.addParam({
            component: "cardbtn",
            param: {
                name: ENABLED_STORAGE,
                type: "trigger",
                default: false
            },
            field: {
                name: 'Включить управление кнопками',
                description: 'Требуется перезагрузка карточки после включения'
            },
            onChange: (value) => {
                setTimeout(() => {
                    if (value && currentCard) {
                        rebuildCard(currentCard);
                    }
                }, 100);
            }
        });

        if (Lampa.Storage.get(ENABLED_STORAGE) === true) {
            // Режим отображения
            Lampa.SettingsApi.addParam({
                component: "cardbtn",
                param: {
                    name: VIEWMODE_STORAGE,
                    type: "select",
                    values: {
                        default: 'Стандартный',
                        icons: 'Только иконки',
                        always: 'Всегда с текстом'
                    },
                    default: 'default'
                },
                field: {
                    name: 'Режим отображения кнопок'
                },
                onChange: () => {
                    if (currentCard) rebuildCard(currentCard);
                }
            });

            // Кнопка редактора
            Lampa.SettingsApi.addParam({
                component: "cardbtn",
                param: {
                    name: "cardbtn_editor",
                    type: "button"
                },
                field: {
                    name: 'Редактировать кнопки',
                    description: 'Изменить порядок и скрыть кнопки в карточке'
                },
                onChange: () => {
                    CardHandler.fromSettings();
                }
            });
        }
    }

    const SettingsConfig = {
        run: setupSettings
    };

    const pluginInfo = {
        type: "other",
        version: "2.0.0",
        author: '@custom',
        name: "Улучшенные кнопки карточки",
        description: "Полное управление кнопками в карточке фильма/сериала",
        component: "cardbtn"
    };

    // Загрузка плагина
    function loadPlugin() {
        Lampa.Manifest.plugins = pluginInfo;
        SettingsConfig.run();
        
        if (Lampa.Storage.get(ENABLED_STORAGE) === true) {
            CardHandler.run();
        }
    }

    // Инициализация
    function init() {
        window.plugin_cardbtn_ready = true;
        
        if (window.appready) {
            loadPlugin();
        } else {
            Lampa.Listener.follow("app", e => {
                if (e.type === "ready") loadPlugin();
            });
        }
    }

    if (!window.plugin_cardbtn_ready) init();

})();
