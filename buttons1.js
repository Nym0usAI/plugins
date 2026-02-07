/** 
 * Плагин управления кнопками Lampa 
 * Версия: 1.1.1 
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

    // Вспомогательная функция для поиска кнопки
    function findButton(btnId) {
        var btn = allButtonsOriginal.find(function(b) {
            return getBtnIdentifier(b) === btnId;
        });
        if (!btn) {
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

            // Пропускаем кнопки из .person-start__bottom (info, subscribe)
            if ($btn.closest('.person-start__bottom').length) {
                return;
            }

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
            
            // Удаляем все классы режимов
            btn.removeClass('button-mode-1 button-mode-2 button-mode-3');
            // Добавляем класс текущего режима
            btn.addClass('button-mode-' + mode);
            
            // Универсальная обработка для всех кнопок с нестандартной структурой
            // Проверяем есть ли у кнопки текстовые ноды или span элементы вне SVG
            var hasTextContent = false;
            btn.contents().each(function() {
                if ((this.nodeType === 3 && this.nodeValue.trim()) || (this.nodeName === 'SPAN' && !$(this).parent().is('svg') && !$(this).hasClass('text-wrapper'))) {
                    hasTextContent = true;
                    return false; // break
                }
            });
            
            if (hasTextContent) {
                // Сначала разворачиваем все обернутые ноды
                btn.find('.text-wrapper').each(function() {
                    $(this).replaceWith($(this).contents());
                });
                
                // Получаем все текстовые ноды и span элементы (не в SVG и не специальные классы)
                var nodesToWrap = [];
                btn.contents().each(function() {
                    if (this.nodeType === 3 && this.nodeValue.trim()) { // Text node
                        nodesToWrap.push(this);
                    } else if (this.nodeName === 'SPAN' && !$(this).parent().is('svg') && !$(this).hasClass('text-wrapper') && !$(this).hasClass('shots-view-button__title') && !$(this).hasClass('shots-view-button__count')) {
                        // Для span элемента - добавляем класс вместо оборачивания
                        $(this).addClass('text-wrapper');
                    }
                });
                
                // Оборачиваем только текстовые ноды в .text-wrapper
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

        // Проверяем настройку и скрываем кнопку если редактор выключен
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

    function applyChanges() {
    if (!currentContainer) return;

    var targetContainer = currentContainer.find('.full-start-new__buttons');
    if (!targetContainer.length) return;

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
    folders.forEach(function(folder){
        buttonsInFolders = buttonsInFolders.concat(folder.buttons);
    });

    currentButtons = allButtons.filter(function(btn){
        return buttonsInFolders.indexOf(getBtnIdentifier(btn)) === -1;
    });

    applyBtnVisibility(currentButtons);
    applyButtonDisplayModes(currentButtons);

    targetContainer.find('.full-start__button')
        .not('.button--edit-order, .button--folder')
        .each(function(){
            $(this).appendTo(targetContainer);
        });

    currentButtons.forEach(function(btn){
        if (!btn.hasClass('hidden')) btn.appendTo(targetContainer);
    });

    folders.forEach(function(folder){
        var folderBtn = targetContainer.find('.button--folder[data-folder-id="' + folder.id + '"]');
        if (!folderBtn.length) folderBtn = createFolderButton(folder);
        folderBtn.appendTo(targetContainer);
    });

    var editBtn = targetContainer.find('.button--edit-order');
    if (editBtn.length) editBtn.appendTo(targetContainer);

    saveOrder();
    setupButtonNavigation(currentContainer);
})();
