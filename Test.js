/** 
 * Плагин управления кнопками Lampa 
 * Версия: 1.1.1 
 * Автор: @Cheeze_l 
 * 
 * Описание: 
 * Плагин для управления кнопками на странице фильма/сериала в Lampa. 
 * Позволяет изменять порядок кнопок, скрывать/показывать их, 
 * а также управлять режимами отображения текста на кнопках. 
 * 
 * Возможности: 
 * - Изменение порядка кнопок (перемещение вверх/вниз) 
 * - Скрытие/показ кнопок (скрытые кнопки отображаются полупрозрачными в редакторе) 
 * - Три режима отображения для каждой кнопки: 
 * • Режим 1 (Стандартный): иконка видна всегда, текст появляется при наведении 
 * • Режим 2 (Минимальный): только иконка, текст всегда скрыт 
 * • Режим 3 (Полный): иконка и текст видны всегда 
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

    var EXCLUDED_CLASSES = ['button--play', 'button--edit-order'];

    // Функция перевода
    function getTranslation(key) {
        var translated = Lampa.Lang.translate(key);
        return translated && translated !== key ? translated : key.replace('buttons_plugin_', '');
    }

    // Добавляем переводы для UI элементов плагина (только русский)
    Lampa.Lang.add({
        buttons_plugin_button_order: 'Порядок кнопок',
        buttons_plugin_reset_default: 'Сбросить по умолчанию',
        buttons_plugin_button_editor: 'Редактор кнопок',
        buttons_plugin_button_editor_enabled: 'Редактор кнопок включен',
        buttons_plugin_button_editor_disabled: 'Редактор кнопок выключен',
        buttons_plugin_button_unknown: 'Кнопка',
        buttons_plugin_edit_order: 'Изменить порядок',
        buttons_plugin_settings_reset: 'Настройки сброшены',
        buttons_plugin_move: 'Сдвиг',
        buttons_plugin_view: 'Вид',
        buttons_plugin_show: 'Показ'
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
        return modes[btnId] || 1;
    }

    function setButtonDisplayMode(btnId, mode) {
        var modes = getButtonDisplayModes();
        modes[btnId] = mode;
        setButtonDisplayModes(modes);
    }

    function getBtnIdentifier(button) {
        var classes = button.attr('class') || '';
        var text = button.find('span').text().trim().replace(/\s+/g, '_');
        var subtitle = button.attr('data-subtitle') || '';

        // Специальная обработка для известных типов кнопок
        if (classes.indexOf('modss') !== -1 || text.indexOf('MODS') !== -1 || text.indexOf('MOD') !== -1) {
            return 'modss_online_button';
        }

        if (classes.indexOf('showy') !== -1 || text.indexOf('Showy') !== -1) {
            return 'showy_online_button';
        }

        // Трейлеры - специальная обработка
        if (classes.indexOf('trailer') !== -1 || text.indexOf('Трейлер') !== -1 || text.indexOf('Trailer') !== -1 || text.indexOf('Трэлер') !== -1) {
            return 'trailer_button';
        }

        // Онлайн просмотр
        if (classes.indexOf('online') !== -1 || text.indexOf('Онлайн') !== -1 || text.indexOf('Online') !== -1) {
            return 'online_button';
        }

        // Торренты
        if (classes.indexOf('torrent') !== -1 || text.indexOf('Торрент') !== -1 || text.indexOf('Torrent') !== -1) {
            return 'torrent_button';
        }

        // Shots
        if (classes.indexOf('shots') !== -1 || text.indexOf('Кадры') !== -1 || text.indexOf('Shots') !== -1) {
            return 'shots_button';
        }

        // По умолчанию - комбинация классов и текста
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
        var text = button.find('span').text().trim().toLowerCase();

        // Специальная проверка для Shots - должна быть первой!
        if (classes.indexOf('shots-view-button') !== -1 || classes.indexOf('shots') !== -1 || text.indexOf('кадры') !== -1 || text.indexOf('shots') !== -1) {
            return 'shots';
        }

        for (var i = 0; i < DEFAULT_GROUPS.length; i++) {
            var group = DEFAULT_GROUPS[i];
            for (var j = 0; j < group.patterns.length; j++) {
                var pattern = group.patterns[j];
                // Проверяем в классах
                if (classes.indexOf(pattern) !== -1) {
                    // Дополнительная проверка для трейлеров
                    if (group.name === 'trailer') {
                        // Убедимся что это действительно трейлер, а не что-то другое
                        if (classes.indexOf('rutube') !== -1 || text.indexOf('трейлер') !== -1 || text.indexOf('trailer') !== -1) {
                            return group.name;
                        }
                    } else {
                        return group.name;
                    }
                }
                // Также проверяем в тексте кнопки
                if (text.indexOf(pattern) !== -1) {
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
        var allButtons = container.find('.full-start__button').not('.button--edit-order, .button--play');
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

        var buttonIds = {};

        allButtons.each(function() {
            var $btn = $(this);

            // Пропускаем кнопки из .person-start__bottom (info, subscribe)
            if ($btn.closest('.person-start__bottom').length) {
                return;
            }

            if (shouldSkipBtn($btn)) return;

            // Получаем уникальный идентификатор кнопки
            var btnId = getBtnIdentifier($btn);
            
            // Проверяем, не была ли уже добавлена кнопка с таким ID
            if (buttonIds[btnId]) {
                return; // Пропускаем дубликат
            }
            
            // Помечаем кнопку как добавленную
            buttonIds[btnId] = true;

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
                    return false;
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
                    if (this.nodeType === 3 && this.nodeValue.trim()) {
                        nodesToWrap.push(this);
                    } else if (this.nodeName === 'SPAN' && !$(this).parent().is('svg') && !$(this).hasClass('text-wrapper') && !$(this).hasClass('shots-view-button__title') && !$(this).hasClass('shots-view-button__count')) {
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
        var items = $('.menu-edit-list .menu-edit-list__item');
        items.each(function() {
            var $item = $(this);
            var itemType = $item.data('itemType');
            if (itemType === 'button') {
                order.push({ type: 'button', id: $item.data('buttonId') });
            }
        });
        setItemOrder(order);
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

        currentButtons = allButtons;
        applyBtnVisibility(allButtons);
        applyButtonDisplayModes(allButtons);

        var targetContainer = currentContainer.find('.full-start-new__buttons');
        if (!targetContainer.length) return;

        targetContainer.find('.full-start__button').not('.button--edit-order').detach();

        var itemOrder = getItemOrder();
        var visibleButtons = [];

        if (itemOrder.length > 0) {
            var addedButtons = [];

            itemOrder.forEach(function(item) {
                if (item.type === 'button') {
                    var btnId = item.id;
                    var btn = currentButtons.find(function(b) { return getBtnIdentifier(b) === btnId; });
                    if (btn && !btn.hasClass('hidden')) {
                        targetContainer.append(btn);
                        visibleButtons.push(btn);
                        addedButtons.push(btnId);
                    }
                }
            });

            currentButtons.forEach(function(btn) {
                var btnId = getBtnIdentifier(btn);
                if (addedButtons.indexOf(btnId) === -1 && !btn.hasClass('hidden')) {
                    var insertBefore = null;
                    var btnType = detectBtnCategory(btn);
                    var typeOrder = ['online', 'torrent', 'trailer', 'shots', 'book', 'reaction', 'subscribe', 'other'];
                    var btnTypeIndex = typeOrder.indexOf(btnType);
                    if (btnTypeIndex === -1) btnTypeIndex = 999;

                    if (btnId === 'modss_online_button' || btnId === 'showy_online_button') {
                        var firstNonPriority = targetContainer.find('.full-start__button').not('.button--edit-order').filter(function() {
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
                        targetContainer.find('.full-start__button').not('.button--edit-order').each(function() {
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
                        var editBtn = targetContainer.find('.button--edit-order');
                        if (editBtn.length) {
                            btn.insertBefore(editBtn);
                        } else {
                            targetContainer.append(btn);
                        }
                    }
                    visibleButtons.push(btn);
                }
            });
        } else {
            currentButtons.forEach(function(btn) {
                if (!btn.hasClass('hidden')) {
                    targetContainer.append(btn);
                    visibleButtons.push(btn);
                }
            });
        }

        var editBtn = targetContainer.find('.button--edit-order');
        if (editBtn.length) {
            editBtn.detach();
            targetContainer.append(editBtn);
        }

        saveOrder();

        setTimeout(function() {
            if (currentContainer) {
                setupButtonNavigation(currentContainer);
            }
        }, 10);
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

            currentButtons = allButtons;
        }

        var list = $('<div class="menu-edit-list"></div>');
        var hidden = getHiddenButtons();
        var itemOrder = getItemOrder();

        var header = $('<div class="menu-edit-list__header">' +
                       '<div class="menu-edit-list__header-spacer"></div>' +
                       '<div class="menu-edit-list__header-move">' + getTranslation('buttons_plugin_move') + '</div>' +
                       '<div class="menu-edit-list__header-mode">' + getTranslation('buttons_plugin_view') + '</div>' +
                       '<div class="menu-edit-list__header-toggle">' + getTranslation('buttons_plugin_show') + '</div>' +
                       '</div>');
        list.append(header);

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
                if (prev.length) {
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
                
                btn.removeClass('button-mode-1 button-mode-2 button-mode-3');
                btn.addClass('button-mode-' + newMode);
            });

            item.find('.toggle').on('hover:enter', function() {
                var hidden = getHiddenButtons();
                var index = hidden.indexOf(btnId);
                if (index !== -1) {
                    hidden.splice(index, 1);
                    btn.removeClass('hidden');
                    item.find('.dot').attr('opacity', '1');
                    item.removeClass('item-hidden');
                } else {
                    hidden.push(btnId);
                    btn.addClass('hidden');
                    item.find('.dot').attr('opacity', '0');
                    item.addClass('item-hidden');
                }
                setHiddenButtons(hidden);
            });

            return item;
        }

        if (itemOrder.length > 0) {
            itemOrder.forEach(function(item) {
                if (item.type === 'button') {
                    var btn = currentButtons.find(function(b) { return getBtnIdentifier(b) === item.id; });
                    if (btn) {
                        list.append(createButtonItem(btn));
                    }
                }
            });

            currentButtons.forEach(function(btn) {
                var btn
