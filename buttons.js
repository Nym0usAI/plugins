/**
 * Плагин управления кнопками Lampa
 * Версия: 1.1.3
 * Автор: @Cheeze_l
 * 
 * Исправление: мгновенное применение изменений без задержек и скачков
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
    var isProcessing = false;

    // Функция перевода (только русский)
    function getTranslation(key) {
        var translations = {
            'buttons_plugin_button_order': 'Порядок кнопок',
            'buttons_plugin_reset_default': 'Сбросить по умолчанию',
            'buttons_plugin_button_editor': 'Редактор кнопок',
            'buttons_plugin_button_editor_enabled': 'Редактор кнопок включен',
            'buttons_plugin_button_editor_disabled': 'Редактор кнопок выключен',
            'buttons_plugin_button_unknown': 'Кнопка',
            'buttons_plugin_edit_order': 'Изменить порядок',
            'buttons_plugin_settings_reset': 'Настройки сброшены',
            'buttons_plugin_move': 'Сдвиг',
            'buttons_plugin_view': 'Вид',
            'buttons_plugin_show': 'Показать'
        };
        
        return translations[key] || key.replace('buttons_plugin_', '');
    }

    function getCustomOrder() {
        return Lampa.Storage.get('button_custom_order', []);
    }

    function setCustomOrder(order) {
        Lampa.Storage.set('button_custom_order', order);
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
                btn.css('display', 'none');
            } else {
                btn.removeClass('hidden');
                btn.css('display', '');
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
            
            // Применяем стили сразу
            var textWrappers = btn.find('.text-wrapper');
            var otherSpans = btn.find('span:not(.text-wrapper)');
            
            if (mode === 1) {
                // Режим 1: текст скрыт, показывается при наведении
                textWrappers.css('display', 'none');
                otherSpans.css('opacity', '0');
            } else if (mode === 2) {
                // Режим 2: только иконка
                textWrappers.css('display', 'none');
                otherSpans.css('display', 'none');
            } else if (mode === 3) {
                // Режим 3: иконка + текст всегда
                textWrappers.css('display', 'inline');
                otherSpans.css('display', 'inline').css('opacity', '1');
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

    function updateButtonsDisplay() {
        if (!currentContainer || isProcessing) return;
        
        isProcessing = true;
        
        try {
            var targetContainer = currentContainer.find('.full-start-new__buttons');
            if (!targetContainer.length) return;
            
            // Сохраняем текущий фокус
            var focusedBtn = targetContainer.find('.full-start__button.focus');
            var focusedId = focusedBtn.length ? getBtnIdentifier(focusedBtn) : null;
            
            // Применяем изменения без пересоздания DOM
            applyBtnVisibility(currentButtons);
            applyButtonDisplayModes(currentButtons);
            
            // Восстанавливаем фокус
            if (focusedId) {
                targetContainer.find('.full-start__button').each(function() {
                    if (getBtnIdentifier($(this)) === focusedId) {
                        $(this).addClass('focus');
                        // Обновляем контроллер
                        if (Lampa.Controller && Lampa.Controller.active().name === 'full_start') {
                            Lampa.Controller.collectionSet('full_start');
                        }
                    }
                });
            }
            
            // Обновляем навигацию немедленно
            refreshController();
        } catch (e) {
            console.error('Error updating buttons:', e);
        } finally {
            isProcessing = false;
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

        currentButtons = allButtons;
        updateButtonsDisplay();
        saveOrder();
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

        // Добавляем заголовок с подписями
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
                var index = currentButtons.indexOf(btn);
                if (index > 0) {
                    // Меняем местами в массиве
                    var temp = currentButtons[index - 1];
                    currentButtons[index - 1] = btn;
                    currentButtons[index] = temp;
                    
                    // Меняем местами в DOM
                    var prevItem = item.prev();
                    if (prevItem.length) {
                        item.insertBefore(prevItem);
                    }
                    
                    // Сохраняем порядок
                    saveOrder();
                    
                    // Немедленно обновляем навигацию
                    refreshController();
                }
            });

            item.find('.move-down').on('hover:enter', function() {
                var index = currentButtons.indexOf(btn);
                if (index < currentButtons.length - 1) {
                    // Меняем местами в массиве
                    var temp = currentButtons[index + 1];
                    currentButtons[index + 1] = btn;
                    currentButtons[index] = temp;
                    
                    // Меняем местами в DOM
                    var nextItem = item.next();
                    if (nextItem.length) {
                        item.insertAfter(nextItem);
                    }
                    
                    // Сохраняем порядок
                    saveOrder();
                    
                    // Немедленно обновляем навигацию
                    refreshController();
                }
            });

            item.find('.menu-edit-list__display-mode').on('hover:enter', function() {
                var currentMode = parseInt($(this).attr('data-mode')) || 1;
                var newMode = currentMode >= 3 ? 1 : currentMode + 1;
                $(this).attr('data-mode', newMode);
                $(this).find('.mode-number').text(newMode);
                setButtonDisplayMode(btnId, newMode);
                
                // Применяем режим к кнопке сразу
                btn.removeClass('button-mode-1 button-mode-2 button-mode-3');
                btn.addClass('button-mode-' + newMode);
                
                // Форсируем обновление отображения текста
                var textWrappers = btn.find('.text-wrapper');
                var otherSpans = btn.find('span:not(.text-wrapper)');
                
                if (newMode === 1) {
                    // Режим 1: текст скрыт, показывается при наведении
                    textWrappers.css('display', 'none');
                    otherSpans.css('opacity', '0');
                } else if (newMode === 2) {
                    // Режим 2: только иконка
                    textWrappers.css('display', 'none');
                    otherSpans.css('display', 'none');
                } else if (newMode === 3) {
                    // Режим 3: иконка + текст всегда
                    textWrappers.css('display', 'inline');
                    otherSpans.css('display', 'inline').css('opacity', '1');
                }
                
                // Немедленно обновляем навигацию
                refreshController();
            });

            item.find('.toggle').on('hover:enter', function() {
                var hidden = getHiddenButtons();
                var index = hidden.indexOf(btnId);
                if (index !== -1) {
                    hidden.splice(index, 1);
                    btn.removeClass('hidden');
                    btn.css('display', ''); // Сразу показываем кнопку
                    item.find('.dot').attr('opacity', '1');
                    item.removeClass('item-hidden');
                } else {
                    hidden.push(btnId);
                    btn.addClass('hidden');
                    btn.css('display', 'none'); // Сразу скрываем кнопку
                    item.find('.dot').attr('opacity', '0');
                    item.addClass('item-hidden');
                }
                setHiddenButtons(hidden);
                
                // Немедленно обновляем навигацию
                refreshController();
            });

            return item;
        }

        // Создаем элементы для всех кнопок
        currentButtons.forEach(function(btn) {
            list.append(createButtonItem(btn));
        });

        var resetBtn = $('<div class="selector folder-reset-button">' +
                         '<div style="text-align: center; padding: 1em;">' +
                         getTranslation('buttons_plugin_reset_default') +
                         '</div>' +
                         '</div>');

        resetBtn.on('hover:enter', function() {
            Lampa.Storage.set('button_custom_order', []);
            Lampa.Storage.set('button_hidden', []);
            Lampa.Storage.set('button_display_modes', {}); // Сброс режимов отображения
            Lampa.Modal.close();
            Lampa.Noty.show(getTranslation('buttons_plugin_settings_reset'));

            // Немедленное обновление без задержек
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
                applyChanges();
                Lampa.Controller.toggle('full_start');
            }
        });
    }

    function reorderButtons(container) {
        var targetContainer = container.find('.full-start-new__buttons');
        if (!targetContainer.length) return false;

        currentContainer = container;
        container.find('.button--edit-order').remove();

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

        currentButtons = allButtons;
        
        // Очищаем контейнер
        targetContainer.children().detach();
        
        // Добавляем кнопки в правильном порядке
        currentButtons.forEach(function(btn) {
            targetContainer.append(btn);
        });

        var editButton = buildEditorBtn();
        targetContainer.append(editButton);

        // Применяем видимость и режимы отображения
        applyBtnVisibility(currentButtons);
        applyButtonDisplayModes(currentButtons);

        // Немедленное обновление навигации
        refreshController();

        return true;
    }

    function setupButtonNavigation(container) {
        // Обновляем навигацию без задержек
        if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
            try {
                var currentController = Lampa.Controller.active();
                if (currentController && currentController.name === 'full_start') {
                    // Используем requestAnimationFrame для мгновенного обновления
                    requestAnimationFrame(function() {
                        Lampa.Controller.collectionSet('full_start');
                        Lampa.Controller.toggle('full_start');
                    });
                }
            } catch(e) {
                // Просто игнорируем ошибки
            }
        }
    }

    function refreshController() {
        if (!Lampa.Controller || typeof Lampa.Controller.toggle !== 'function') return;
        
        // Используем requestAnimationFrame для мгновенного обновления без скачков
        requestAnimationFrame(function() {
            try {
                if (Lampa.Controller.active().name === 'full_start') {
                    Lampa.Controller.collectionSet('full_start');
                }
            } catch(e) {
                // Просто игнорируем ошибки
            }
        });
    }

    function init() {
        var style = $('<style>' +
            '.full-start__button.hidden { display: none !important; }' +
            '.full-start-new__buttons { ' +
            'display: flex !important; ' +
            'flex-direction: row !important; ' +
            'flex-wrap: wrap !important; ' +
            'gap: 0.5em !important; ' +
            '}' +
            '.menu-edit-list__delete { width: 2.4em; height: 2.4em; display: flex; align-items: center; justify-content: center; cursor: pointer; }' +
            '.menu-edit-list__delete svg { width: 1.2em !important; height: 1.2em !important; }' +
            '.menu-edit-list__delete.focus { border: 2px solid rgba(255,255,255,0.8); border-radius: 0.3em; }' +
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
            
            // Используем requestAnimationFrame для мгновенной отрисовки
            requestAnimationFrame(function() {
                try {
                    if (!container.data('buttons-processed')) {
                        container.data('buttons-processed', true);
                        reorderButtons(container);
                    }
                } catch(err) {
                    console.error('Error processing buttons:', err);
                }
            });
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
                // Немедленное применение
                requestAnimationFrame(function() {
                    var currentValue = Lampa.Storage.get('buttons_editor_enabled', true);
                    if (currentValue) {
                        $('.button--edit-order').show();
                        Lampa.Noty.show(getTranslation('buttons_plugin_button_editor_enabled'));
                    } else {
                        $('.button--edit-order').hide();
                        Lampa.Noty.show(getTranslation('buttons_plugin_button_editor_disabled'));
                    }
                });
            },
            onRender: function(element) {
                setTimeout(function() {
                    // Вставляем после "Показать реакции" в разделе "Карточка"
                    var reactionsParam = $('div[data-name="card_interfice_reactions"]');
                    if (reactionsParam.length) {
                        reactionsParam.after(element);
                    } else {
                        // Fallback: вставляем после "Размер интерфейса"
                        $('div[data-name="interface_size"]').after(element);
                    }
                }, 0);
            }
        });
    }

    init();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {};
    }
})();
