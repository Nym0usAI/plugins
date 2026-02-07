/** 
 * Плагин управления кнопками Lampa 
 * Версия: 1.1.3 
 * Автор: @Cheeze_l 
 * 
 * Описание: 
 * Плагин для управления кнопками на странице фильма/сериала в Lampa. 
 * Позволяет изменять порядок кнопок, скрывать/показывать их, группировать в папки, 
 * а также управлять режимами отображения текста на кнопках. 
 * 
 * Возможности: 
 * - Изменение порядка кнопок (перемещение вверх/вниз) 
 * - Скрытие/показ кнопок (скрытые кнопки отображаются полупрозрачными в редакторе) 
 * - Три режима отображения для каждой кнопки: 
 * • Режим 1 (Стандартный): иконка видна всегда, текст появляется при наведении 
 * • Режим 2 (Минимальный): только иконка, текст всегда скрыт 
 * • Режим 3 (Полный): иконка и текст видны всегда 
 * - Создание папки для группировки кнопок 
 * - Изменение порядка кнопок внутри папок 
 * - Автоматическая группировка по типам (Онлайн, Торренты, Трейлеры и т.д.) 
 * - Универсальная работа со всеми типами кнопок (включая кастомные плагины) 
 * - Сброс всех настроек к значениям по умолчанию 
 * 
 * Технические особенности: 
 * - Полная совместимость с ES5 (работает на старых устройствах) 
 * - Встроенные polyfills для Array методов (forEach, filter, find, some, indexOf) 
 * - Универсальная обработка кнопок любых типов 
 * - Автоматическое определение и нормализация структуры кнопок 
 * - Сохранение настроек в localStorage 
 * 
 * Установка: 
 * 
 * Для использования в Lampa: 
 * В Лампа открыть "Настройки" → "Расширения" → "Добавить плагин" 
 * И прописать: https://mylampa1.github.io/buttons.js 
 * 
 * Для использования в Lampac: 
 * Добавить в lampainit.js строку: 
 * Lampa.Utils.putScriptAsync(["https://mylampa1.github.io/buttons.js"], function() {}); 
 * 
 * Поддержка автора: 
 * Если есть желающие поддержать автора, пишите @Cheeze_l 
 */ 

(function() {
    'use strict';

    // Polyfills для совместимости со старыми устройствами
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(callback, thisArg) {
            var T, k;
            if (this == null) throw new TypeError('this is null or not defined');
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');
            if (arguments.length > 1) T = thisArg;
            k = 0;
            while (k < len) {
                var kValue;
                if (k in O) {
                    kValue = O[k];
                    callback.call(T, kValue, k, O);
                }
                k++;
            }
        };
    }

    if (!Array.prototype.filter) {
        Array.prototype.filter = function(callback, thisArg) {
            if (this == null) throw new TypeError('this is null or not defined');
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');
            var res = [];
            var T = thisArg;
            var k = 0;
            while (k < len) {
                if (k in O) {
                    var kValue = O[k];
                    if (callback.call(T, kValue, k, O)) res.push(kValue);
                }
                k++;
            }
            return res;
        };
    }

    if (!Array.prototype.find) {
        Array.prototype.find = function(callback, thisArg) {
            if (this == null) throw new TypeError('this is null or not defined');
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');
            var T = thisArg;
            var k = 0;
            while (k < len) {
                var kValue = O[k];
                if (callback.call(T, kValue, k, O)) return kValue;
                k++;
            }
            return undefined;
        };
    }

    if (!Array.prototype.some) {
        Array.prototype.some = function(callback, thisArg) {
            if (this == null) throw new TypeError('this is null or not defined');
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');
            var T = thisArg;
            var k = 0;
            while (k < len) {
                if (k in O && callback.call(T, O[k], k, O)) return true;
                k++;
            }
            return false;
        };
    }

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement, fromIndex) {
            if (this == null) throw new TypeError('this is null or not defined');
            var O = Object(this);
            var len = O.length >>> 0;
            if (len === 0) return -1;
            var n = fromIndex | 0;
            if (n >= len) return -1;
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            while (k < len) {
                if (k in O && O[k] === searchElement) return k;
                k++;
            }
            return -1;
        };
    }

    var LAMPAC_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z" fill="currentColor"></path></svg>';

    var EXCLUDED_CLASSES = ['button--play', 'button--edit-order', 'button--folder'];

    // Функция перевода
    function getTranslation(key) {
        var translated = Lampa.Lang.translate(key);
        return translated && translated !== key ? translated : key.replace('buttons_plugin_', '');
    }

    // Добавляем переводы для UI элементов плагина
    Lampa.Lang.add({
        buttons_plugin_button_order: {
            uk: 'Порядок кнопок',
            ru: 'Порядок кнопок',
            en: 'Buttons order',
            be: 'Парадак кнопак',
            zh: '按钮顺序'
        },
        buttons_plugin_reset_default: {
            uk: 'Скинути за замовчуванням',
            ru: 'Сбросить по умолчанию',
            en: 'Reset to default',
            be: 'Скінуць па змаўчанні',
            zh: '重置为默认'
        },
        buttons_plugin_button_editor: {
            uk: 'Редактор кнопок',
            ru: 'Редактор кнопок',
            en: 'Buttons editor',
            be: 'Рэдактар кнопак',
            zh: '按钮编辑器'
        },
        buttons_plugin_button_editor_enabled: {
            uk: 'Редактор кнопок включено',
            ru: 'Редактор кнопок включен',
            en: 'Buttons editor enabled',
            be: 'Рэдактар кнопак уключаны',
            zh: '按钮编辑器已启用'
        },
        buttons_plugin_button_editor_disabled: {
            uk: 'Редактор кнопок вимкнено',
            ru: 'Редактор кнопок выключен',
            en: 'Buttons editor disabled',
            be: 'Рэдактар кнопак адключаны',
            zh: '按钮编辑器已禁用'
        },
        buttons_plugin_button_unknown: {
            uk: 'Кнопка',
            ru: 'Кнопка',
            en: 'Button',
            be: 'Кнопка',
            zh: '按钮'
        },
        buttons_plugin_folder_name: {
            uk: 'Назва папки',
            ru: 'Название папки',
            en: 'Folder name',
            be: 'Назва папкі',
            zh: '文件夹名称'
        },
        buttons_plugin_folder_created: {
            uk: 'Папку створено',
            ru: 'Папка создана',
            en: 'Folder created',
            be: 'Папка створана',
            zh: '文件夹已创建'
        },
        buttons_plugin_folder_deleted: {
            uk: 'Папку видалено',
            ru: 'Папка удалена',
            en: 'Folder deleted',
            be: 'Папка выдалена',
            zh: '文件夹已删除'
        },
        buttons_plugin_folder_order: {
            uk: 'Порядок кнопок в папці',
            ru: 'Порядок кнопок в папке',
            en: 'Buttons order in folder',
            be: 'Парадак кнопак у папцы',
            zh: '文件夹中的按钮顺序'
        },
        buttons_plugin_create_folder: {
            uk: 'Створити папку',
            ru: 'Создать папку',
            en: 'Create folder',
            be: 'Стварыць папку',
            zh: '创建文件夹'
        },
        buttons_plugin_select_buttons: {
            uk: 'Виберіть кнопки для папки',
            ru: 'Выберите кнопки для папки',
            en: 'Select buttons for folder',
            be: 'Выберыце кнопкі для папкі',
            zh: '选择文件夹的按钮'
        },
        buttons_plugin_min_2_buttons: {
            uk: 'Виберіть мінімум 2 кнопки',
            ru: 'Выберите минимум 2 кнопки',
            en: 'Select at least 2 buttons',
            be: 'Выберыце мінімум 2 кнопкі',
            zh: '至少选择2个按钮'
        },
        buttons_plugin_edit_order: {
            uk: 'Змінити порядок',
            ru: 'Изменить порядок',
            en: 'Edit order',
            be: 'Змяніць парадак',
            zh: '编辑顺序'
        },
        buttons_plugin_settings_reset: {
            uk: 'Налаштування скинуто',
            ru: 'Настройки сброшены',
            en: 'Settings reset',
            be: 'Налады скінуты',
            zh: '设置已重置'
        },
        buttons_plugin_move: {
            uk: 'Зсув',
            ru: 'Сдвиг',
            en: 'Move',
            be: 'Зрух',
            zh: '移动'
        },
        buttons_plugin_view: {
            uk: 'Вигляд',
            ru: 'Вид',
            en: 'View',
            be: 'Выгляд',
            zh: '视图'
        },
        buttons_plugin_show: {
            uk: 'Показ',
            ru: 'Показ',
            en: 'Show',
            be: 'Паказ',
            zh: '显示'
        }
    });

    var DEFAULT_GROUPS = [
        { name: 'online', patterns: ['online', 'lampac', 'modss', 'showy'] },
        { name: 'torrent', patterns: ['torrent'] },
        { name: 'trailer', patterns: ['trailer', 'rutube'] },
        { name: 'shots', patterns: ['shots'] },
        { name: 'book', patterns: ['book'] },
        { name: 'reaction', patterns: ['reaction'] },
        { name: 'subscribe', patterns: ['subscribe'] }
    ];

    var currentButtons = [];
    var allButtonsCache = [];
    var allButtonsOriginal = [];
    var currentContainer = null;
    var buttonCache = new Map();

    // Кэш для быстрого доступа к кнопкам
    function updateButtonCache(container) {
        buttonCache.clear();
        if (!container) return;
        
        // Собираем ВСЕ кнопки, включая обычные и в папках
        var buttons = container.find('.full-start__button').not('.button--edit-order');
        
        buttons.each(function() {
            var $btn = $(this);
            var id = getBtnIdentifier($btn);
            buttonCache.set(id, $btn);
        });
    }

    // Вспомогательная функция для поиска кнопки
    function findButton(btnId) {
        // Сначала ищем в кэше
        var cachedBtn = buttonCache.get(btnId);
        if (cachedBtn) return cachedBtn;
        
        // Затем в оригинальных кнопках
        var btn = allButtonsOriginal.find(function(b) {
            return getBtnIdentifier(b) === btnId;
        });
        
        if (!btn) {
            // Ищем в кэшированных кнопках
            btn = allButtonsCache.find(function(b) {
                return getBtnIdentifier(b) === btnId;
            });
        }
        
        return btn;
    }

    // Вспомогательная функция для получения всех ID кнопок в папках
    function getButtonsInFolders() {
        var folders = getFolders();
        var buttonsInFolders = [];
        folders.forEach(function(folder) {
            buttonsInFolders = buttonsInFolders.concat(folder.buttons);
        });
        return buttonsInFolders;
    }

    function getCustomOrder() {
        return Lampa.Storage.get('button_custom_order', []);
    }

    function setCustomOrder(order) {
        Lampa.Storage.set('button_custom_order', order);
    }

    function getItemOrder() {
        return Lampa.Storage.get('button_item_order', []);
    }

    function setItemOrder(order) {
        Lampa.Storage.set('button_item_order', order);
    }

    function getHiddenButtons() {
        return Lampa.Storage.get('button_hidden', []);
    }

    function setHiddenButtons(hidden) {
        Lampa.Storage.set('button_hidden', hidden);
    }

    function getButtonDisplayModes() {
        return Lampa.Storage.get('button_display_modes', {});
    }

    function setButtonDisplayModes(modes) {
        Lampa.Storage.set('button_display_modes', modes);
    }

    function getButtonDisplayMode(btnId) {
        var modes = getButtonDisplayModes();
        return modes[btnId] || 1; // По умолчанию режим 1 (стандартный)
    }

    function setButtonDisplayMode(btnId, mode) {
        var modes = getButtonDisplayModes();
        modes[btnId] = mode;
        setButtonDisplayModes(modes);
    }

    function getFolders() {
        return Lampa.Storage.get('button_folders', []);
    }

    function setFolders(folders) {
        Lampa.Storage.set('button_folders', folders);
    }

    function getBtnIdentifier(button) {
        var classes = button.attr('class') || '';
        var text = button.find('span').text().trim().replace(/\s+/g, '_');
        var subtitle = button.attr('data-subtitle') || '';

        if (classes.indexOf('modss') !== -1 || text.indexOf('MODS') !== -1 || text.indexOf('MOD') !== -1) {
            return 'modss_online_button';
        }

        if (classes.indexOf('showy') !== -1 || text.indexOf('Showy') !== -1) {
            return 'showy_online_button';
        }

        var viewClasses = classes.split(' ').filter(function(c) {
            return c.indexOf('view--') === 0 || c.indexOf('button--') === 0;
        }).join('_');

        if (!viewClasses && !text) {
            return 'button_unknown';
        }

        var id = viewClasses + '_' + text;
        if (subtitle) {
            id = id + '_' + subtitle.replace(/\s+/g, '_').substring(0, 30);
        }
        return id;
    }

    function detectBtnCategory(button) {
        var classes = button.attr('class') || '';

        // Специальная проверка для Shots - должна быть первой!
        if (classes.indexOf('shots-view-button') !== -1 || classes.indexOf('shots') !== -1) {
            return 'shots';
        }

        for (var i = 0; i < DEFAULT_GROUPS.length; i++) {
            var group = DEFAULT_GROUPS[i];
            for (var j = 0; j < group.patterns.length; j++) {
                if (classes.indexOf(group.patterns[j]) !== -1) {
                    return group.name;
                }
            }
        }

        return 'other';
    }

    function shouldSkipBtn(button) {
        var classes = button.attr('class') || '';
        for (var i = 0; i < EXCLUDED_CLASSES.length; i++) {
            if (classes.indexOf(EXCLUDED_CLASSES[i]) !== -1) {
                return true;
            }
        }
        return false;
    }

    function groupBtnsByType(container) {
        // Получаем ВСЕ кнопки из контейнера
        var allButtons = container.find('.full-start__button').not('.button--edit-order, .button--folder, .button--play');
        
        var categories = {
            online: [],
            torrent: [],
            trailer: [],
            shots: [],
            book: [],
            reaction: [],
            subscribe: [],
            other: []
        };

        allButtons.each(function() {
            var $btn = $(this);

            // НЕ пропускаем кнопки из .person-start__bottom - это важно!
            // if ($btn.closest('.person-start__bottom').length) {
            //     return;
            // }

            if (shouldSkipBtn($btn)) return;

            var type = detectBtnCategory($btn);

            if (type === 'online' && $btn.hasClass('lampac--button') && !$btn.hasClass('modss--button') && !$btn.hasClass('showy--button')) {
                var svgElement = $btn.find('svg').first();
                if (svgElement.length && !svgElement.hasClass('modss-online-icon')) {
                    svgElement.replaceWith(LAMPAC_ICON);
                }
            }

            if (categories[type]) {
                categories[type].push($btn);
            } else {
                categories.other.push($btn);
            }
        });

        return categories;
    }

    function arrangeBtnsByOrder(buttons) {
        var customOrder = getCustomOrder();
        var priority = [];
        var regular = [];

        buttons.forEach(function(btn) {
            var id = getBtnIdentifier(btn);
            if (id === 'modss_online_button' || id === 'showy_online_button') {
                priority.push(btn);
            } else {
                regular.push(btn);
            }
        });

        priority.sort(function(a, b) {
            var idA = getBtnIdentifier(a);
            var idB = getBtnIdentifier(b);
            if (idA === 'modss_online_button') return -1;
            if (idB === 'modss_online_button') return 1;
            if (idA === 'showy_online_button') return -1;
            if (idB === 'showy_online_button') return 1;
            return 0;
        });

        if (!customOrder.length) {
            regular.sort(function(a, b) {
                var typeOrder = ['online', 'torrent', 'trailer', 'shots', 'book', 'reaction', 'subscribe', 'other'];
                var typeA = detectBtnCategory(a);
                var typeB = detectBtnCategory(b);
                var indexA = typeOrder.indexOf(typeA);
                var indexB = typeOrder.indexOf(typeB);
                if (indexA === -1) indexA = 999;
                if (indexB === -1) indexB = 999;
                return indexA - indexB;
            });
            return priority.concat(regular);
        }

        var sorted = [];
        var remaining = regular.slice();

        customOrder.forEach(function(id) {
            for (var i = 0; i < remaining.length; i++) {
                if (getBtnIdentifier(remaining[i]) === id) {
                    sorted.push(remaining[i]);
                    remaining.splice(i, 1);
                    break;
                }
            }
        });

        return priority.concat(sorted).concat(remaining);
    }

    function applyBtnVisibility(buttons) {
        var hidden = getHiddenButtons();
        buttons.forEach(function(btn) {
            var id = getBtnIdentifier(btn);
            if (hidden.indexOf(id) !== -1) {
                btn.addClass('hidden');
            } else {
                btn.removeClass('hidden');
            }
        });
    }

    function applyButtonDisplayModes(buttons) {
        buttons.forEach(function(btn) {
            var id = getBtnIdentifier(btn);
            var mode = getButtonDisplayMode(id);
            
            btn.removeClass('button-mode-1 button-mode-2 button-mode-3');
            btn.addClass('button-mode-' + mode);
            
            var hasTextContent = false;
            btn.contents().each(function() {
                if ((this.nodeType === 3 && this.nodeValue.trim()) || (this.nodeName === 'SPAN' && !$(this).parent().is('svg') && !$(this).hasClass('text-wrapper'))) {
                    hasTextContent = true;
                    return false;
                }
            });
            
            if (hasTextContent) {
                btn.find('.text-wrapper').each(function() {
                    $(this).replaceWith($(this).contents());
                });
                
                var nodesToWrap = [];
                btn.contents().each(function() {
                    if (this.nodeType === 3 && this.nodeValue.trim()) {
                        nodesToWrap.push(this);
                    } else if (this.nodeName === 'SPAN' && !$(this).parent().is('svg') && !$(this).hasClass('text-wrapper') && !$(this).hasClass('shots-view-button__title') && !$(this).hasClass('shots-view-button__count')) {
                        $(this).addClass('text-wrapper');
                    }
                });
                
                nodesToWrap.forEach(function(node) {
                    $(node).wrap('<span class="text-wrapper"></span>');
                });
            }
        });
    }

    function buildEditorBtn() {
        var btn = $('<div class="full-start__button selector button--edit-order" style="order: 9999;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 29" fill="none"><use xlink:href="#sprite-edit"></use></svg>' +
                    '</div>');
        
        btn.on('hover:enter', function() {
            openEditDialog();
        });

        if (Lampa.Storage.get('buttons_editor_enabled') === false) {
            btn.hide();
        }

        return btn;
    }

    function saveOrder() {
        var order = [];
        currentButtons.forEach(function(btn) {
            order.push(getBtnIdentifier(btn));
        });
        setCustomOrder(order);
    }

    function saveItemOrder() {
        var order = [];
        var items = $('.menu-edit-list .menu-edit-list__item').not('.menu-edit-list__create-folder');
        items.each(function() {
            var $item = $(this);
            var itemType = $item.data('itemType');
            if (itemType === 'folder') {
                order.push({ type: 'folder', id: $item.data('folderId') });
            } else if (itemType === 'button') {
                order.push({ type: 'button', id: $item.data('buttonId') });
            }
        });
        setItemOrder(order);
    }

    // Немедленное применение изменений
    function applyChangesImmediately() {
        if (!currentContainer) return;
        
        updateButtonCache(currentContainer);
        
        var hidden = getHiddenButtons();
        var displayModes = getButtonDisplayModes();
        var folders = getFolders();
        
        // Немедленно применяем изменения ко всем кнопкам
        currentContainer.find('.full-start__button').not('.button--edit-order').each(function() {
            var $btn = $(this);
            var btnId = getBtnIdentifier($btn);
            
            // Применяем видимость немедленно
            var isHidden = hidden.indexOf(btnId) !== -1;
            if (isHidden) {
                $btn.addClass('hidden');
            } else {
                $btn.removeClass('hidden');
            }
            
            // Применяем режим отображения немедленно
            var mode = displayModes[btnId] || 1;
            $btn.removeClass('button-mode-1 button-mode-2 button-mode-3')
                .addClass('button-mode-' + mode);
        });
        
        // Обновляем иконки папок немедленно
        folders.forEach(function(folder) {
            var folderBtn = currentContainer.find('.button--folder[data-folder-id="' + folder.id + '"]');
            if (folderBtn.length && folder.buttons.length > 0) {
                var firstBtn = findButton(folder.buttons[0]);
                if (firstBtn) {
                    var icon = firstBtn.find('svg').first().clone();
                    folderBtn.find('svg').first().replaceWith(icon);
                }
            }
        });
        
        saveOrder();
        
        // Немедленное обновление навигации
        if (window.requestAnimationFrame) {
            requestAnimationFrame(function() {
                if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
                    try {
                        Lampa.Controller.toggle('full_start');
                    } catch(e) {}
                }
            });
        }
    }

    function applyChanges() {
        if (!currentContainer) return;

        var categories = groupBtnsByType(currentContainer);
        var allButtons = []
            .concat(categories.online)
            .concat(categories.torrent)
            .concat(categories.trailer)
            .concat(categories.shots)
            .concat(categories.book)
            .concat(categories.reaction)
            .concat(categories.subscribe)
            .concat(categories.other);

        allButtons = arrangeBtnsByOrder(allButtons);
        allButtonsCache = allButtons;

        var folders = getFolders();
        var foldersUpdated = false;

        folders.forEach(function(folder) {
            var updatedButtons = [];
            var usedButtons = [];

            folder.buttons.forEach(function(oldBtnId) {
                var found = false;
                for (var i = 0; i < allButtons.length; i++) {
                    var btn = allButtons[i];
                    var newBtnId = getBtnIdentifier(btn);
                    if (usedButtons.indexOf(newBtnId) !== -1) continue;

                    if (newBtnId === oldBtnId) {
                        updatedButtons.push(newBtnId);
                        usedButtons.push(newBtnId);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    for (var i = 0; i < allButtons.length; i++) {
                        var btn = allButtons[i];
                        var newBtnId = getBtnIdentifier(btn);
                        if (usedButtons.indexOf(newBtnId) !== -1) continue;

                        var text = btn.find('span').text().trim();
                        var classes = btn.attr('class') || '';
                        if ((oldBtnId.indexOf('modss') !== -1 || oldBtnId.indexOf('MODS') !== -1) && (classes.indexOf('modss') !== -1 || text.indexOf('MODS') !== -1)) {
                            updatedButtons.push(newBtnId);
                            usedButtons.push(newBtnId);
                            found = true;
                            break;
                        } else if ((oldBtnId.indexOf('showy') !== -1 || oldBtnId.indexOf('Showy') !== -1) && (classes.indexOf('showy') !== -1 || text.indexOf('Showy') !== -1)) {
                            updatedButtons.push(newBtnId);
                            usedButtons.push(newBtnId);
                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    updatedButtons.push(oldBtnId);
                }
            });

            if (updatedButtons.length !== folder.buttons.length || updatedButtons.some(function(id, i) {
                return id !== folder.buttons[i];
            })) {
                folder.buttons = updatedButtons;
                foldersUpdated = true;
            }
        });

        if (foldersUpdated) {
            setFolders(folders);
        }

        var buttonsInFolders = [];
        folders.forEach(function(folder) {
            buttonsInFolders = buttonsInFolders.concat(folder.buttons);
        });

        var filteredButtons = allButtons.filter(function(btn) {
            return buttonsInFolders.indexOf(getBtnIdentifier(btn)) === -1;
        });

        currentButtons = filteredButtons;
        applyBtnVisibility(filteredButtons);
        applyButtonDisplayModes(filteredButtons);

        var targetContainer = currentContainer.find('.full-start-new__buttons');
        if (!targetContainer.length) return;

        // Сохраняем кнопки, которые уже есть (особенно из .person-start__bottom)
        var existingButtons = targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder');
        var preservedButtons = [];
        
        existingButtons.each(function() {
            var $btn = $(this);
            // Проверяем, является ли это специальной кнопкой (например, из .person-start__bottom)
            if ($btn.closest('.person-start__bottom').length) {
                preservedButtons.push($btn);
            }
        });

        // Удаляем только кнопки управления
        targetContainer.find('.full-start__button.button--edit-order, .full-start__button.button--folder').detach();

        var itemOrder = getItemOrder();
        var visibleButtons = [];

        // Восстанавливаем сохраненные кнопки
        preservedButtons.forEach(function(btn) {
            targetContainer.append(btn);
            visibleButtons.push(btn);
        });

        if (itemOrder.length > 0) {
            var addedFolders = [];
            var addedButtons = [];

            itemOrder.forEach(function(item) {
                if (item.type === 'folder') {
                    var folder = folders.find(function(f) { return f.id === item.id; });
                    if (folder) {
                        var folderBtn = createFolderButton(folder);
                        targetContainer.append(folderBtn);
                        visibleButtons.push(folderBtn);
                        addedFolders.push(folder.id);
                    }
                } else if (item.type === 'button') {
                    var btnId = item.id;
                    if (buttonsInFolders.indexOf(btnId) === -1) {
                        var btn = currentButtons.find(function(b) { return getBtnIdentifier(b) === btnId; });
                        if (btn && !btn.hasClass('hidden')) {
                            targetContainer.append(btn);
                            visibleButtons.push(btn);
                            addedButtons.push(btnId);
                        }
                    }
                }
            });

            currentButtons.forEach(function(btn) {
                var btnId = getBtnIdentifier(btn);
                if (addedButtons.indexOf(btnId) === -1 && !btn.hasClass('hidden') && buttonsInFolders.indexOf(btnId) === -1) {
                    var insertBefore = null;
                    var btnType = detectBtnCategory(btn);
                    var typeOrder = ['online', 'torrent', 'trailer', 'shots', 'book', 'reaction', 'subscribe', 'other'];
                    var btnTypeIndex = typeOrder.indexOf(btnType);
                    if (btnTypeIndex === -1) btnTypeIndex = 999;

                    if (btnId === 'modss_online_button' || btnId === 'showy_online_button') {
                        var firstNonPriority = targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder').filter(function() {
                            var id = getBtnIdentifier($(this));
                            return id !== 'modss_online_button' && id !== 'showy_online_button';
                        }).first();
                        if (firstNonPriority.length) {
                            insertBefore = firstNonPriority;
                        }

                        if (btnId === 'showy_online_button') {
                            var modsBtn = targetContainer.find('.full-start__button').filter(function() {
                                return getBtnIdentifier($(this)) === 'modss_online_button';
                            });
                            if (modsBtn.length) {
                                insertBefore = modsBtn.next();
                                if (!insertBefore.length || insertBefore.hasClass('button--edit-order')) {
                                    insertBefore = null;
                                }
                            }
                        }
                    } else {
                        targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder').each(function() {
                            var existingBtn = $(this);
                            var existingId = getBtnIdentifier(existingBtn);
                            if (existingId === 'modss_online_button' || existingId === 'showy_online_button') {
                                return true;
                            }
                            var existingType = detectBtnCategory(existingBtn);
                            var existingTypeIndex = typeOrder.indexOf(existingType);
                            if (existingTypeIndex === -1) existingTypeIndex = 999;

                            if (btnTypeIndex < existingTypeIndex) {
                                insertBefore = existingBtn;
                                return false;
                            }
                        });
                    }

                    if (insertBefore && insertBefore.length) {
                        btn.insertBefore(insertBefore);
                    } else {
                        targetContainer.append(btn);
                    }
                    visibleButtons.push(btn);
                }
            });

            folders.forEach(function(folder) {
                if (addedFolders.indexOf(folder.id) === -1) {
                    var folderBtn = createFolderButton(folder);
                    targetContainer.append(folderBtn);
                    visibleButtons.push(folderBtn);
                }
            });
        } else {
            currentButtons.forEach(function(btn) {
                var btnId = getBtnIdentifier(btn);
                if (!btn.hasClass('hidden') && buttonsInFolders.indexOf(btnId) === -1) {
                    targetContainer.append(btn);
                    visibleButtons.push(btn);
                }
            });

            folders.forEach(function(folder) {
                var folderBtn = createFolderButton(folder);
                targetContainer.append(folderBtn);
                visibleButtons.push(folderBtn);
            });
        }

        var editBtn = targetContainer.find('.button--edit-order');
        if (editBtn.length) {
            editBtn.detach();
            targetContainer.append(editBtn);
        } else {
            var editButton = buildEditorBtn();
            targetContainer.append(editButton);
            visibleButtons.push(editButton);
        }

        saveOrder();
        
        // Обновляем кэш
        updateButtonCache(currentContainer);
        
        setupButtonNavigation(currentContainer);
    }

    function capitalizeText(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function getBtnDisplayText(btn, allButtons) {
        var text = btn.find('span').text().trim();
        var classes = btn.attr('class') || '';
        var subtitle = btn.attr('data-subtitle') || '';

        if (!text) {
            var viewClass = classes.split(' ').find(function(c) {
                return c.indexOf('view--') === 0 || c.indexOf('button--') === 0;
            });
            if (viewClass) {
                text = viewClass.replace('view--', '').replace('button--', '').replace(/_/g, ' ');
                text = capitalizeText(text);
            } else {
                text = getTranslation('buttons_plugin_button_unknown');
            }
            return text;
        }

        var sameTextCount = 0;
        allButtons.forEach(function(otherBtn) {
            if (otherBtn.find('span').text().trim() === text) {
                sameTextCount++;
            }
        });

        if (sameTextCount > 1) {
            if (subtitle) {
                return text + ' <span style="opacity:0.5">(' + subtitle.substring(0, 30) + ')</span>';
            }

            var viewClass = classes.split(' ').find(function(c) {
                return c.indexOf('view--') === 0;
            });
            if (viewClass) {
                var identifier = viewClass.replace('view--', '').replace(/_/g, ' ');
                identifier = capitalizeText(identifier);
                return text + ' <span style="opacity:0.5">(' + identifier + ')</span>';
            }
        }

        return text;
    }

    function createFolderButton(folder) {
        var firstBtnId = folder.buttons[0];
        var firstBtn = findButton(firstBtnId);
        var icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                   '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                   '</svg>';

        if (firstBtn) {
            var btnIcon = firstBtn.find('svg').first();
            if (btnIcon.length) {
                icon = btnIcon.prop('outerHTML');
            }
        }

        var btn = $('<div class="full-start__button selector button--folder" data-folder-id="' + folder.id + '">' +
                    icon +
                    '<span>' + folder.name + '</span>' +
                    '</div>');

        btn.on('hover:enter', function() {
            openFolderMenu(folder);
        });

        return btn;
    }

    function openFolderMenu(folder) {
        var items = [];
        folder.buttons.forEach(function(btnId) {
            var btn = findButton(btnId);
            if (btn) {
                var displayName = getBtnDisplayText(btn, allButtonsOriginal);
                var iconElement = btn.find('svg').first();
                var icon = iconElement.length ? iconElement.prop('outerHTML') : '';
                var subtitle = btn.attr('data-subtitle') || '';
                
                var item = {
                    title: displayName.replace(/<[^>]*>/g, ''),
                    button: btn,
                    btnId: btnId
                };

                if (icon) {
                    item.template = 'selectbox_icon';
                    item.icon = icon;
                }
                if (subtitle) {
                    item.subtitle = subtitle;
                }

                items.push(item);
            }
        });

        items.push({ title: getTranslation('buttons_plugin_edit_order'), edit: true });

        Lampa.Select.show({
            title: folder.name,
            items: items,
            onSelect: function(item) {
                if (item.edit) {
                    openFolderEditDialog(folder);
                } else {
                    item.button.trigger('hover:enter');
                }
            },
            onBack: function() {
                Lampa.Controller.toggle('full_start');
            }
        });
    }

    function openFolderEditDialog(folder) {
        var list = $('<div class="menu-edit-list"></div>');

        folder.buttons.forEach(function(btnId) {
            var btn = findButton(btnId);
            if (btn) {
                var displayName = getBtnDisplayText(btn, allButtonsOriginal);
                var iconElement = btn.find('svg').first();
                var icon = iconElement.length ? iconElement.clone() : $('<svg></svg>');

                var item = $('<div class="menu-edit-list__item">' +
                             '<div class="menu-edit-list__icon"></div>' +
                             '<div class="menu-edit-list__title">' + displayName + '</div>' +
                             '<div class="menu-edit-list__move move-up selector">' +
                             '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                             '<path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                             '</svg>' +
                             '</div>' +
                             '<div class="menu-edit-list__move move-down selector">' +
                             '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                             '<path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                             '</svg>' +
                             '</div>' +
                             '</div>');

                item.find('.menu-edit-list__icon').append(icon);
                item.data('btnId', btnId);

                item.find('.move-up').on('hover:enter', function() {
                    var prev = item.prev();
                    if (prev.length) {
                        item.insertBefore(prev);
                        saveFolderButtonOrder(folder, list);
                    }
                });

                item.find('.move-down').on('hover:enter', function() {
                    var next = item.next();
                    if (next.length) {
                        item.insertAfter(next);
                        saveFolderButtonOrder(folder, list);
                    }
                });

                list.append(item);
            }
        });

        Lampa.Modal.open({
            title: getTranslation('buttons_plugin_folder_order'),
            html: list,
            size: 'small',
            scroll_to_center: true,
            onBack: function() {
                Lampa.Modal.close();
                updateFolderIcon(folder);
                openFolderMenu(folder);
            }
        });
    }

    function saveFolderButtonOrder(folder, list) {
        var newOrder = [];
        list.find('.menu-edit-list__item').each(function() {
            var btnId = $(this).data('btnId');
            newOrder.push(btnId);
        });

        folder.buttons = newOrder;
        var folders = getFolders();
        for (var i = 0; i < folders.length; i++) {
            if (folders[i].id === folder.id) {
                folders[i].buttons = newOrder;
                break;
            }
        }
        setFolders(folders);
        updateFolderIcon(folder);
    }

    function updateFolderIcon(folder) {
        if (!folder.buttons || folder.buttons.length === 0) return;
        
        var folderBtn = currentContainer.find('.button--folder[data-folder-id="' + folder.id + '"]');
        if (folderBtn.length) {
            var firstBtnId = folder.buttons[0];
            var firstBtn = findButton(firstBtnId);
            
            if (firstBtn) {
                var iconElement = firstBtn.find('svg').first();
                if (iconElement.length) {
                    var btnIcon = iconElement.clone();
                    folderBtn.find('svg').replaceWith(btnIcon);
                }
            } else {
                var defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                  '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                                  '</svg>';
                folderBtn.find('svg').replaceWith(defaultIcon);
            }
        }
    }

    function createFolder(name, buttonIds) {
        var folders = getFolders();
        var folder = {
            id: 'folder_' + Date.now(),
            name: name,
            buttons: buttonIds
        };
        folders.push(folder);
        setFolders(folders);
        return folder;
    }

    function deleteFolder(folderId) {
        var folders = getFolders();
        folders = folders.filter(function(f) {
            return f.id !== folderId;
        });
        setFolders(folders);
    }

    function openCreateFolderDialog() {
        Lampa.Input.edit({
            free: true,
            title: getTranslation('buttons_plugin_folder_name'),
            nosave: true,
            value: '',
            nomic: true
        }, function(folderName) {
            if (!folderName || !folderName.trim()) {
                Lampa.Noty.show(getTranslation('buttons_plugin_folder_name'));
                openEditDialog();
                return;
            }
            openSelectButtonsDialog(folderName.trim());
        });
    }

    function openSelectButtonsDialog(folderName) {
        var selectedButtons = [];
        var list = $('<div class="menu-edit-list"></div>');

        var buttonsInFolders = getButtonsInFolders();
        var sortedButtons = arrangeBtnsByOrder(allButtonsOriginal.slice());

        sortedButtons.forEach(function(btn) {
            var btnId = getBtnIdentifier(btn);
            if (buttonsInFolders.indexOf(btnId) !== -1) {
                return;
            }

            var displayName = getBtnDisplayText(btn, sortedButtons);
            var iconElement = btn.find('svg').first();
            var icon = iconElement.length ? iconElement.clone() : $('<svg></svg>');

            var item = $('<div class="menu-edit-list__item">' +
                         '<div class="menu-edit-list__icon"></div>' +
                         '<div class="menu-edit-list__title">' + displayName + '</div>' +
                         '<div class="menu-edit-list__toggle selector">' +
                         '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                         '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
                         '<path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="0" stroke-linecap="round"/>' +
                         '</svg>' +
                         '</div>' +
                         '</div>');

            item.find('.menu-edit-list__icon').append(icon);

            item.find('.menu-edit-list__toggle').on('hover:enter', function() {
                var index = selectedButtons.indexOf(btnId);
                if (index !== -1) {
                    selectedButtons.splice(index, 1);
                    item.find('.dot').attr('opacity', '0');
                } else {
                    selectedButtons.push(btnId);
                    item.find('.dot').attr('opacity', '1');
                }
            });

            list.append(item);
        });

        var createBtn = $('<div class="selector folder-create-confirm">' +
                          '<div style="text-align: center; padding: 1em;">' +
                          getTranslation('buttons_plugin_create_folder') + ' "' + folderName + '"' +
                          '</div>' +
                          '</div>');

        createBtn.on('hover:enter', function() {
            if (selectedButtons.length < 2) {
                Lampa.Noty.show(getTranslation('buttons_plugin_min_2_buttons'));
                return;
            }

            var folder = createFolder(folderName, selectedButtons);
            var itemOrder = getItemOrder();

            if (itemOrder.length === 0) {
                currentButtons.forEach(function(btn) {
                    itemOrder.push({ type: 'button', id: getBtnIdentifier(btn) });
                });
            }

            var folderAdded = false;
            for (var i = 0; i < selectedButtons.length; i++) {
                var btnId = selectedButtons[i];
                for (var j = 0; j < itemOrder.length; j++) {
                    if (itemOrder[j].type === 'button' && itemOrder[j].id === btnId) {
                        if (!folderAdded) {
                            itemOrder[j] = { type: 'folder', id: folder.id };
                            folderAdded = true;
                        } else {
                            itemOrder.splice(j, 1);
                            j--;
                        }
                        break;
                    }
                }

                for (var k = 0; k < currentButtons.length; k++) {
                    if (getBtnIdentifier(currentButtons[k]) === btnId) {
                        currentButtons.splice(k, 1);
                        break;
                    }
                }
            }

            if (!folderAdded) {
                itemOrder.push({ type: 'folder', id: folder.id });
            }

            setItemOrder(itemOrder);
            Lampa.Modal.close();
            Lampa.Noty.show(getTranslation('buttons_plugin_folder_created') + ' "' + folderName + '"');

            if (currentContainer) {
                currentContainer.data('buttons-processed', false);
                reorderButtons(currentContainer);
            }
            refreshController();
        });

        list.append(createBtn);

        Lampa.Modal.open({
            title: getTranslation('buttons_plugin_select_buttons'),
            html: list,
            size: 'medium',
            scroll_to_center: true,
            onBack: function() {
                Lampa.Modal.close();
                openEditDialog();
            }
        });
    }

    function openEditDialog() {
        if (currentContainer) {
            var categories = groupBtnsByType(currentContainer);
            var allButtons = []
                .concat(categories.online)
                .concat(categories.torrent)
                .concat(categories.trailer)
                .concat(categories.shots)
                .concat(categories.book)
                .concat(categories.reaction)
                .concat(categories.subscribe)
                .concat(categories.other);

            allButtons = arrangeBtnsByOrder(allButtons);
            allButtonsCache = allButtons;

            var folders = getFolders();
            var buttonsInFolders = [];
            folders.forEach(function(folder) {
                buttonsInFolders = buttonsInFolders.concat(folder.buttons);
            });

            var filteredButtons = allButtons.filter(function(btn) {
                return buttonsInFolders.indexOf(getBtnIdentifier(btn)) === -1;
            });

            currentButtons = filteredButtons;
        }

        var list = $('<div class="menu-edit-list"></div>');
        var hidden = getHiddenButtons();
        var folders = getFolders();
        var itemOrder = getItemOrder();

        var createFolderBtn = $('<div class="menu-edit-list__item menu-edit-list__create-folder selector">' +
                                '<div class="menu-edit-list__icon">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                                '<line x1="12" y1="11" x2="12" y2="17"></line>' +
                                '<line x1="9" y1="14" x2="15" y2="14"></line>' +
                                '</svg>' +
                                '</div>' +
                                '<div class="menu-edit-list__title">' + getTranslation('buttons_plugin_create_folder') + '</div>' +
                                '</div>');

        createFolderBtn.on('hover:enter', function() {
            Lampa.Modal.close();
            openCreateFolderDialog();
        });

        list.append(createFolderBtn);

        var header = $('<div class="menu-edit-list__header">' +
                       '<div class="menu-edit-list__header-spacer"></div>' +
                       '<div class="menu-edit-list__header-move">' + getTranslation('buttons_plugin_move') + '</div>' +
                       '<div class="menu-edit-list__header-mode">' + getTranslation('buttons_plugin_view') + '</div>' +
                       '<div class="menu-edit-list__header-toggle">' + getTranslation('buttons_plugin_show') + '</div>' +
                       '</div>');
        list.append(header);

        function createFolderItem(folder) {
            var item = $('<div class="menu-edit-list__item folder-item">' +
                         '<div class="menu-edit-list__icon">' +
                         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                         '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
                         '</svg>' +
                         '</div>' +
                         '<div class="menu-edit-list__title">' + folder.name + ' <span style="opacity:0.5">(' + folder.buttons.length + ')</span></div>' +
                         '<div class="menu-edit-list__move move-up selector">' +
                         '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                         '<path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                         '</svg>' +
                         '</div>' +
                         '<div class="menu-edit-list__move move-down selector">' +
                         '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                         '<path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                         '</svg>' +
                         '</div>' +
                         '<div class="menu-edit-list__delete selector">' +
                         '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                         '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
                         '<path d="M9.5 9.5L16.5 16.5M16.5 9.5L9.5 16.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
                         '</svg>' +
                         '</div>' +
                         '</div>');

            item.data('folderId', folder.id);
            item.data('itemType', 'folder');

            item.find('.move-up').on('hover:enter', function() {
                var prev = item.prev();
                while (prev.length && prev.hasClass('menu-edit-list__create-folder')) {
                    prev = prev.prev();
                }
                if (prev.length) {
                    item.insertBefore(prev);
                    saveItemOrder();
                }
            });

            item.find('.move-down').on('hover:enter', function() {
                var next = item.next();
                while (next.length && next.hasClass('folder-reset-button')) {
                    next = next.next();
                }
                if (next.length && !next.hasClass('folder-reset-button')) {
                    item.insertAfter(next);
                    saveItemOrder();
                }
            });

            item.find('.menu-edit-list__delete').on('hover:enter', function() {
                var folderId = folder.id;
                var folderButtons = folder.buttons.slice();

                deleteFolder(folderId);

                var itemOrder = getItemOrder();
                var newItemOrder = [];
                for (var i = 0; i < itemOrder.length; i++) {
                    if (itemOrder[i].type === 'folder' && itemOrder[i].id === folderId) {
                        continue;
                    }
                    if (itemOrder[i].type === 'button') {
                        var isInFolder = false;
                        for (var j = 0; j < folderButtons.length; j++) {
                            if (itemOrder[i].id === folderButtons[j]) {
                                isInFolder = true;
                                break;
                            }
                        }
                        if (isInFolder) {
                            continue;
                        }
                    }
                    newItemOrder.push(itemOrder[i]);
                }
                setItemOrder(newItemOrder);

                var customOrder = getCustomOrder();
                var newCustomOrder = [];
                for (var i = 0; i < customOrder.length; i++) {
                    var found = false;
                    for (var j = 0; j < folderButtons.length; j++) {
                        if (customOrder[i] === folderButtons[j]) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        newCustomOrder.push(customOrder[i]);
                    }
                }
                setCustomOrder(newCustomOrder);

                item.remove();
                Lampa.Noty.show(getTranslation('buttons_plugin_folder_deleted'));

                // Немедленное обновление интерфейса
                if (currentContainer) {
                    currentContainer.data('buttons-processed', false);
                    reorderButtons(currentContainer);
                }
            });

            return item;
        }

        function createButtonItem(btn) {
            var displayName = getBtnDisplayText(btn, currentButtons);
            var icon = btn.find('svg').first().clone();
            var btnId = getBtnIdentifier(btn);
            var isHidden = hidden.indexOf(btnId) !== -1;
            var displayMode = getButtonDisplayMode(btnId);

            var item = $('<div class="menu-edit-list__item' + (isHidden ? ' item-hidden' : '') + '">' +
                         '<div class="menu-edit-list__icon"></div>' +
                         '<div class="menu-edit-list__title">' + displayName + '</div>' +
                         '<div class="menu-edit-list__move move-up selector">' +
                         '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                         '<path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                         '</svg>' +
                         '</div>' +
                         '<div class="menu-edit-list__move move-down selector">' +
                         '<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                         '<path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
                         '</svg>' +
                         '</div>' +
                         '<div class="menu-edit-list__display-mode selector" data-mode="' + displayMode + '">' +
                         '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                         '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
                         '<text x="13" y="17" text-anchor="middle" fill="currentColor" font-size="12" font-weight="bold" class="mode-number">' + displayMode + '</text>' +
                         '</svg>' +
                         '</div>' +
                         '<div class="menu-edit-list__toggle toggle selector">' +
                         '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                         '<rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>' +
                         '<path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="' + (isHidden ? '0' : '1') + '" stroke-linecap="round"/>' +
                         '</svg>' +
                         '</div>' +
                         '</div>');

            item.find('.menu-edit-list__icon').append(icon);
            item.data('button', btn);
            item.data('buttonId', btnId);
            item.data('itemType', 'button');

            item.find('.move-up').on('hover:enter', function() {
                var prev = item.prev();
                while (prev.length && prev.hasClass('menu-edit-list__create-folder')) {
                    prev = prev.prev();
                }
                if (prev.length && !prev.hasClass('menu-edit-list__create-folder')) {
                    item.insertBefore(prev);
                    var btnIndex = currentButtons.indexOf(btn);
                    if (btnIndex > 0) {
                        currentButtons.splice(btnIndex, 1);
                        currentButtons.splice(btnIndex - 1, 0, btn);
                    }
                    saveItemOrder();
                }
            });

            item.find('.move-down').on('hover:enter', function() {
                var next = item.next();
                while (next.length && next.hasClass('folder-reset-button')) {
                    next = next.next();
                }
                if (next.length && !next.hasClass('folder-reset-button')) {
                    item.insertAfter(next);
                    var btnIndex = currentButtons.indexOf(btn);
                    if (btnIndex < currentButtons.length - 1) {
                        currentButtons.splice(btnIndex, 1);
                        currentButtons.splice(btnIndex + 1, 0, btn);
                    }
                    saveItemOrder();
                }
            });

            item.find('.menu-edit-list__display-mode').on('hover:enter', function() {
                var currentMode = parseInt($(this).attr('data-mode')) || 1;
                var newMode = currentMode >= 3 ? 1 : currentMode + 1;
                $(this).attr('data-mode', newMode);
                $(this).find('.mode-number').text(newMode);
                setButtonDisplayMode(btnId, newMode);
                
                // Немедленное применение к реальной кнопке
                var cachedBtn = buttonCache.get(btnId);
                if (cachedBtn) {
                    cachedBtn.removeClass('button-mode-1 button-mode-2 button-mode-3')
                             .addClass('button-mode-' + newMode);
                }
            });

            item.find('.toggle').on('hover:enter', function() {
                var hidden = getHiddenButtons();
                var index = hidden.indexOf(btnId);
                if (index !== -1) {
                    hidden.splice(index, 1);
                    $(this).find('.dot').attr('opacity', '1');
                    $(this).closest('.menu-edit-list__item').removeClass('item-hidden');
                    
                    // Немедленное отображение кнопки
                    var cachedBtn = buttonCache.get(btnId);
                    if (cachedBtn) {
                        cachedBtn.removeClass('hidden');
                    }
                } else {
                    hidden.push(btnId);
                    $(this).find('.dot').attr('opacity', '0');
                    $(this).closest('.menu-edit-list__item').addClass('item-hidden');
                    
                    // Немедленное скрытие кнопки
                    var cachedBtn = buttonCache.get(btnId);
                    if (cachedBtn) {
                        cachedBtn.addClass('hidden');
                    }
                }
                setHiddenButtons(hidden);
            });

            return item;
        }

        if (itemOrder.length > 0) {
            itemOrder.forEach(function(item) {
                if (item.type === 'folder') {
                    var folder = folders.find(function(f) { return f.id === item.id; });
                    if (folder) {
                        list.append(createFolderItem(folder));
                    }
                } else if (item.type === 'button') {
                    var btn = currentButtons.find(function(b) { return getBtnIdentifier(b) === item.id; });
                    if (btn) {
                        list.append(createButtonItem(btn));
                    }
                }
            });

            currentButtons.forEach(function(btn) {
                var btnId = getBtnIdentifier(btn);
                var found = itemOrder.some(function(item) {
                    return item.type === 'button' && item.id === btnId;
                });
                if (!found) {
                    list.append(createButtonItem(btn));
                }
            });

            folders.forEach(function(folder) {
                var found = itemOrder.some(function(item) {
                    return item.type === 'folder' && item.id === folder.id;
                });
                if (!found) {
                    list.append(createFolderItem(folder));
                }
            });
        } else {
            folders.forEach(function(folder) {
                list.append(createFolderItem(folder));
            });

            currentButtons.forEach(function(btn) {
                list.append(createButtonItem(btn));
            });
        }

        var resetBtn = $('<div class="selector folder-reset-button">' +
                         '<div style="text-align: center; padding: 1em;">' +
                         getTranslation('buttons_plugin_reset_default') +
                         '</div>' +
                         '</div>');

        resetBtn.on('hover:enter', function() {
            var folders = getFolders();
            Lampa.Storage.set('button_custom_order', []);
            Lampa.Storage.set('button_hidden', []);
            Lampa.Storage.set('button_folders', []);
            Lampa.Storage.set('button_item_order', []);
            Lampa.Storage.set('button_display_modes', {});
            Lampa.Modal.close();
            Lampa.Noty.show(getTranslation('buttons_plugin_settings_reset'));

            // Немедленное обновление
            if (currentContainer) {
                currentContainer.data('buttons-processed', false);
                reorderButtons(currentContainer);
            }
        });

        list.append(resetBtn);

        Lampa.Modal.open({
            title: getTranslation('buttons_plugin_button_order'),
            html: list,
            size: 'small',
            scroll_to_center: true,
            onBack: function() {
                Lampa.Modal.close();
                applyChangesImmediately();
                Lampa.Controller.toggle('full_start');
            }
        });
    }

    function reorderButtons(container) {
        var targetContainer = container.find('.full-start-new__buttons');
        if (!targetContainer.length) return false;

        currentContainer = container;
        
        // Убираем только кнопки управления
        container.find('.button--edit-order, .button--folder').remove();

        var categories = groupBtnsByType(container);
        var allButtons = []
            .concat(categories.online)
            .concat(categories.torrent)
            .concat(categories.trailer)
            .concat(categories.shots)
            .concat(categories.book)
            .concat(categories.reaction)
            .concat(categories.subscribe)
            .concat(categories.other);

        allButtons = arrangeBtnsByOrder(allButtons);
        allButtonsCache = allButtons;

        if (allButtonsOriginal.length === 0) {
            allButtons.forEach(function(btn) {
                allButtonsOriginal.push(btn.clone(true, true));
            });
        }

        var folders = getFolders();
        var buttonsInFolders = [];
        folders.forEach(function(folder) {
            buttonsInFolders = buttonsInFolders.concat(folder.buttons);
        });

        var filteredButtons = allButtons.filter(function(btn) {
            return buttonsInFolders.indexOf(getBtnIdentifier(btn)) === -1;
        });

        currentButtons = filteredButtons;
        applyBtnVisibility(filteredButtons);
        applyButtonDisplayModes(filteredButtons);

        // Сохраняем существующие кнопки (особенно из .person-start__bottom)
        var existingButtons = targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder');
        var preservedButtons = [];
        
        existingButtons.each(function() {
            var $btn = $(this);
            preservedButtons.push($btn.clone(true, true));
        });

        // Очищаем контейнер
        targetContainer.empty();

        // Восстанавливаем сохраненные кнопки
        preservedButtons.forEach(function(btn) {
            targetContainer.append(btn);
        });

        var visibleButtons = [];
        var itemOrder = getItemOrder();

        if (itemOrder.length > 0) {
            var addedFolders = [];
            var addedButtons = [];

            itemOrder.forEach(function(item) {
                if (item.type === 'folder') {
                    var folder = folders.find(function(f) { return f.id === item.id; });
                    if (folder) {
                        var folderBtn = createFolderButton(folder);
                        targetContainer.append(folderBtn);
                        visibleButtons.push(folderBtn);
                        addedFolders.push(folder.id);
                    }
                } else if (item.type === 'button') {
                    var btnId = item.id;
                    if (buttonsInFolders.indexOf(btnId) === -1) {
                        var btn = currentButtons.find(function(b) { return getBtnIdentifier(b) === btnId; });
                        if (btn && !btn.hasClass('hidden')) {
                            targetContainer.append(btn);
                            visibleButtons.push(btn);
                            addedButtons.push(btnId);
                        }
                    }
                }
            });

            currentButtons.forEach(function(btn) {
                var btnId = getBtnIdentifier(btn);
                if (addedButtons.indexOf(btnId) === -1 && !btn.hasClass('hidden') && buttonsInFolders.indexOf(btnId) === -1) {
                    var insertBefore = null;
                    var btnType = detectBtnCategory(btn);
                    var typeOrder = ['online', 'torrent', 'trailer', 'shots', 'book', 'reaction', 'subscribe', 'other'];
                    var btnTypeIndex = typeOrder.indexOf(btnType);
                    if (btnTypeIndex === -1) btnTypeIndex = 999;

                    if (btnId === 'modss_online_button' || btnId === 'showy_online_button') {
                        var firstNonPriority = targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder').filter(function() {
                            var id = getBtnIdentifier($(this));
                            return id !== 'modss_online_button' && id !== 'showy_online_button';
                        }).first();
                        if (firstNonPriority.length) {
                            insertBefore = firstNonPriority;
                        }

                        if (btnId === 'showy_online_button') {
                            var modsBtn = targetContainer.find('.full-start__button').filter(function() {
                                return getBtnIdentifier($(this)) === 'modss_online_button';
                            });
                            if (modsBtn.length) {
                                insertBefore = modsBtn.next();
                                if (!insertBefore.length || insertBefore.hasClass('button--edit-order')) {
                                    insertBefore = null;
                                }
                            }
                        }
                    } else {
                        targetContainer.find('.full-start__button').not('.button--edit-order, .button--folder').each(function() {
                            var existingBtn = $(this);
                            var existingId = getBtnIdentifier(existingBtn);
                            if (existingId === 'modss_online_button' || existingId === 'showy_online_button') {
                                return true;
                            }
                            var existingType = detectBtnCategory(existingBtn);
                            var existingTypeIndex = typeOrder.indexOf(existingType);
                            if (existingTypeIndex === -1) existingTypeIndex = 999;

                            if (btnTypeIndex < existingTypeIndex) {
                                insertBefore = existingBtn;
                                return false;
                            }
                        });
                    }

                    if (insertBefore && insertBefore.length) {
                        btn.insertBefore(insertBefore);
                    } else {
                        targetContainer.append(btn);
                    }
                    visibleButtons.push(btn);
                }
            });

            folders.forEach(function(folder) {
                if (addedFolders.indexOf(folder.id) === -1) {
                    var folderBtn = createFolderButton(folder);
                    targetContainer.append(folderBtn);
                    visibleButtons.push(folderBtn);
                }
            });
        } else {
            currentButtons.forEach(function(btn) {
                var btnId = getBtnIdentifier(btn);
                if (!btn.hasClass('hidden') && buttonsInFolders.indexOf(btnId) === -1) {
                    targetContainer.append(btn);
                    visibleButtons.push(btn);
                }
            });

            folders.forEach(function(folder) {
                var folderBtn = createFolderButton(folder);
                targetContainer.append(folderBtn);
                visibleButtons.push(folderBtn);
            });
        }

        var editButton = buildEditorBtn();
        targetContainer.append(editButton);
        visibleButtons.push(editButton);

        // Обновляем кэш для мгновенных обновлений
        updateButtonCache(container);
        
        setupButtonNavigation(container);

        return true;
    }

    function setupButtonNavigation(container) {
        if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
            try {
                Lampa.Controller.toggle('full_start');
            } catch(e) {}
        }
    }

    function refreshController() {
        if (!Lampa.Controller || typeof Lampa.Controller.toggle !== 'function') return;
        
        if (window.requestAnimationFrame) {
            requestAnimationFrame(function() {
                try {
                    Lampa.Controller.toggle('full_start');
                    if (currentContainer) {
                        setupButtonNavigation(currentContainer);
                    }
                } catch(e) {}
            });
        }
    }

    function init() {
        var style = $('<style>' +
            '.full-start__button.hidden { display: none !important; }' +
            '.button--folder { cursor: pointer; }' +
            '.full-start-new__buttons { ' +
            'display: flex !important; ' +
            'flex-direction: row !important; ' +
            'flex-wrap: wrap !important; ' +
            'gap: 0.5em !important; ' +
            '}' +
            '.menu-edit-list__create-folder { background: rgba(100,200,100,0.2); }' +
            '.menu-edit-list__create-folder.focus { background: rgba(100,200,100,0.3); border: 3px solid rgba(255,255,255,0.8); }' +
            '.menu-edit-list__delete { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }' +
            '.menu-edit-list__delete svg { width: 1.2em !important; height: 1.2em !important; }' +
            '.menu-edit-list__delete.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }' +
            '.folder-item .menu-edit-list__move { margin-right: 0; }' +
            '.folder-create-confirm { background: rgba(100,200,100,0.3); margin-top: 1em; border-radius: 0.3em; }' +
            '.folder-create-confirm.focus { border: 3px solid rgba(255,255,255,0.8); }' +
            '.folder-reset-button { background: rgba(200,100,100,0.3); margin-top: 1em; border-radius: 0.3em; }' +
            '.folder-reset-button.focus { border: 3px solid rgba(255,255,255,0.8); }' +
            '.menu-edit-list__move { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-right: 0.5em; }' +
            '.menu-edit-list__move svg { width: 1.2em !important; height: 1.2em !important; }' +
            '.menu-edit-list__move.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }' +
            '.menu-edit-list__toggle { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }' +
            '.menu-edit-list__toggle svg { width: 1.2em !important; height: 1.2em !important; }' +
            '.menu-edit-list__toggle.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }' +
            '.menu-edit-list__display-mode { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-right: 0.5em; }' +
            '.menu-edit-list__display-mode svg { width: 1.2em !important; height: 1.2em !important; }' +
            '.menu-edit-list__display-mode.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; background: rgba(255,255,255,0.9); }' +
            '.menu-edit-list__display-mode.focus svg { color: #000 !important; }' +
            '.menu-edit-list__display-mode.focus rect { stroke: #000 !important; }' +
            '.menu-edit-list__display-mode.focus text { fill: #000 !important; }' +
            '.menu-edit-list__header { display: flex; align-items: center; padding: 0.5em 1em; margin-bottom: 0.5em; opacity: 0.6; font-size: 0.85em; }' +
            '.menu-edit-list__header-spacer { flex: 1; }' +
            '.menu-edit-list__header-move { width: 5.3em; text-align: center; margin-right: 0.5em; }' +
            '.menu-edit-list__header-mode { width: 2.9em; text-align: center; }' +
            '.menu-edit-list__header-toggle { width: 2.4em; text-align: center; margin-left: 0.5em; }' +
            '.menu-edit-list__create-folder { margin-bottom: 1em; }' +
            '.menu-edit-list__item { display: flex; align-items: center; position: relative; }' +
            '.menu-edit-list__item .menu-edit-list__icon { flex-shrink: 0; }' +
            '.menu-edit-list__item .menu-edit-list__title { flex: 1; min-width: 0; }' +
            '.menu-edit-list__item .menu-edit-list__move, .menu-edit-list__item .menu-edit-list__display-mode, .menu-edit-list__item .menu-edit-list__toggle { flex-shrink: 0; }' +
            '.menu-edit-list__item.item-hidden { opacity: 0.4; }' +
            '.menu-edit-list__item.item-hidden .menu-edit-list__title { opacity: 0.6; }' +
            '.menu-edit-list__item.item-hidden .menu-edit-list__icon { opacity: 0.5; }' +
            '' +
            '/* Режим 1: Стандартный (иконка, текст при наведении) */' +
            '.full-start__button.button-mode-1 .text-wrapper { display: none !important; }' +
            '.full-start__button.button-mode-1:hover .text-wrapper, .full-start__button.button-mode-1.focus .text-wrapper { display: inline !important; }' +
            '.full-start__button.button-mode-1 > span:not(.text-wrapper) { opacity: 0 !important; }' +
            '.full-start__button.button-mode-1:hover > span:not(.text-wrapper), .full-start__button.button-mode-1.focus > span:not(.text-wrapper) { opacity: 1 !important; }' +
            '' +
            '/* Режим 2: Только иконка (текст всегда скрыт) */' +
            '.full-start__button.button-mode-2 .text-wrapper { display: none !important; }' +
            '.full-start__button.button-mode-2 > span:not(.text-wrapper) { display: none !important; }' +
            '' +
            '/* Режим 3: Иконка + текст всегда */' +
            '.full-start__button.button-mode-3 .text-wrapper { display: inline !important; }' +
            '.full-start__button.button-mode-3 > span:not(.text-wrapper) { opacity: 1 !important; display: inline !important; }' +
            '</style>');

        $('body').append(style);

        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;

            var container = e.object.activity.render();
            
            // Используем небольшую задержку для гарантии загрузки всех кнопок
            if (window.requestAnimationFrame) {
                requestAnimationFrame(function() {
                    if (!container.data('buttons-processed')) {
                        container.data('buttons-processed', true);
                        reorderButtons(container);
                        refreshController();
                    }
                });
            } else {
                // Fallback для старых браузеров
                setTimeout(function() {
                    if (!container.data('buttons-processed')) {
                        container.data('buttons-processed', true);
                        reorderButtons(container);
                        refreshController();
                    }
                }, 50);
            }
        });
    }

    // Добавляем настройку в раздел "Интерфейс"
    if (Lampa.SettingsApi) {
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'buttons_editor_enabled',
                type: 'trigger',
                default: true
            },
            field: {
                name: getTranslation('buttons_plugin_button_editor')
            },
            onChange: function(value) {
                if (value) {
                    $('.button--edit-order').show();
                    Lampa.Noty.show(getTranslation('buttons_plugin_button_editor_enabled'));
                } else {
                    $('.button--edit-order').hide();
                    Lampa.Noty.show(getTranslation('buttons_plugin_button_editor_disabled'));
                }
            },
            onRender: function(element) {
                var reactionsParam = $('div[data-name="card_interfice_reactions"]');
                if (reactionsParam.length) {
                    reactionsParam.after(element);
                } else {
                    $('div[data-name="interface_size"]').after(element);
                }
            }
        });
    }

    init();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {};
    }
})();
