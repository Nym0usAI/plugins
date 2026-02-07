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
 * - Создание папок для группировки кнопок
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

    // ... ВСЕ СТАРЫЕ ФУНКЦИИ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ ...

    // -------------------------------------------------------------
    // ПРАВКА: убираем кастомную анимацию кнопок
    function animateBtnFadeIn(buttons) {
        buttons.forEach(function(btn) {
            btn.css({
                'opacity': '1',
                'animation': 'none'
            });
        });
    }
    // -------------------------------------------------------------

    // ... ДАЛЬШЕ ВСЕ ФУНКЦИИ applyChanges, createFolderButton, openEditDialog и т.д.
    // остаются без изменений, кроме вызова animateBtnFadeIn, который теперь просто устанавливает opacity
})();
