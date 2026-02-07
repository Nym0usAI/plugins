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
 *   • Режим 1 (Стандартный): иконка видна всегда, текст появляется при наведении
 *   • Режим 2 (Минимальный): только иконка, текст всегда скрыт
 *   • Режим 3 (Полный): иконка и текст видны всегда
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

    // ===========================
    // Polyfills
    // ===========================
    if (!Array.prototype.forEach) { /*... оригинальный код ...*/ }
    if (!Array.prototype.filter) { /*... оригинальный код ...*/ }
    if (!Array.prototype.find) { /*... оригинальный код ...*/ }
    if (!Array.prototype.some) { /*... оригинальный код ...*/ }
    if (!Array.prototype.indexOf) { /*... оригинальный код ...*/ }

    var LAMPAC_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z" fill="currentColor"></path></svg>';

    var EXCLUDED_CLASSES = ['button--play', 'button--edit-order', 'button--folder'];

    // ===========================
    // Функция анимации отключена
    // ===========================
    function animateBtnFadeIn(buttons) {
        // Пустая функция — оригинальная анимация Lampa будет работать
    }

    // ===========================
    // Остальные функции плагина без изменений
    // ===========================
    function getTranslation(key) { /*... оригинальный код ...*/ }
    Lampa.Lang.add({ /*... оригинальный код ...*/ });

    var DEFAULT_GROUPS = [ /*... оригинальный код ...*/ ];

    var currentButtons = [];
    var allButtonsCache = [];
    var allButtonsOriginal = [];
    var currentContainer = null;

    function findButton(btnId) { /*... оригинальный код ...*/ }
    function getButtonsInFolders() { /*... оригинальный код ...*/ }
    function getCustomOrder() { /*... оригинальный код ...*/ }
    function setCustomOrder(order) { /*... оригинальный код ...*/ }
    function getItemOrder() { /*... оригинальный код ...*/ }
    function setItemOrder(order) { /*... оригинальный код ...*/ }
    function getHiddenButtons() { /*... оригинальный код ...*/ }
    function setHiddenButtons(hidden) { /*... оригинальный код ...*/ }
    function getButtonDisplayModes() { /*... оригинальный код ...*/ }
    function setButtonDisplayModes(modes) { /*... оригинальный код ...*/ }
    function getButtonDisplayMode(btnId) { /*... оригинальный код ...*/ }
    function setButtonDisplayMode(btnId, mode) { /*... оригинальный код ...*/ }
    function getFolders() { /*... оригинальный код ...*/ }
    function setFolders(folders) { /*... оригинальный код ...*/ }
    function getBtnIdentifier(button) { /*... оригинальный код ...*/ }
    function detectBtnCategory(button) { /*... оригинальный код ...*/ }
    function shouldSkipBtn(button) { /*... оригинальный код ...*/ }
    function groupBtnsByType(container) { /*... оригинальный код ...*/ }
    function arrangeBtnsByOrder(buttons) { /*... оригинальный код ...*/ }
    function applyBtnVisibility(buttons) { /*... оригинальный код ...*/ }
    function applyButtonDisplayModes(buttons) { /*... оригинальный код ...*/ }
    function buildEditorBtn() { /*... оригинальный код ...*/ }
    function saveOrder() { /*... оригинальный код ...*/ }
    function saveItemOrder() { /*... оригинальный код ...*/ }
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
        folders.forEach(function(folder) { /*... оригинальный код ...*/ });

        // Оптимизация: получаем buttonsInFolders один раз
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

        targetContainer.find('.full-start__button').not('.button--edit-order').detach();

        var itemOrder = getItemOrder();
        var visibleButtons = [];
        if (itemOrder.length > 0) {
            /*... оригинальный код обработки order ...*/
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

        // ======== Здесь анимация отключена ========
        // animateBtnFadeIn(visibleButtons);

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
        }, 100);
    }

    // ===========================
    // Остальные функции плагина (createFolderButton, openFolderMenu, openEditDialog и т.д.)
    // без изменений
    // ===========================
    function createFolderButton(folder) { /*... оригинальный код ...*/ }
    function openFolderMenu(folder) { /*... оригинальный код ...*/ }
    function openFolderEditDialog(folder) { /*... оригинальный код ...*/ }
    function saveFolderButtonOrder(folder, list) { /*... оригинальный код ...*/ }
    function updateFolderIcon(folder) { /*... оригинальный код ...*/ }
    function createFolder(name, buttonIds) { /*... оригинальный код ...*/ }
    function deleteFolder(folderId) { /*... оригинальный код ...*/ }
    function openCreateFolderDialog() { /*... оригинальный код ...*/ }
    function openSelectButtonsDialog(folderName) { /*... оригинальный код ...*/ }
    function openEditDialog() { /*... оригинальный код ...*/ }

})();
