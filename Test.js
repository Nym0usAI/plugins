(function() {
    'use strict';

    // Polyfills для старых устройств
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
                if (k in O) callback.call(T, O[k], k, O);
                k++;
            }
        };
    }

    // ... остальные polyfills и функции как в твоем коде ...

    // Функция анимации кнопок — **как в первом коде**
    function animateBtnFadeIn(buttons) {
        buttons.forEach(function(btn, index) {
            btn.css({
                'opacity': '0',
                'animation': 'button-fade-in 0.4s ease forwards',
                'animation-delay': (index * 0.08) + 's'
            });
        });
    }

    // Пример CSS анимации (надо добавить в стиль страницы, если нет)
    var style = document.createElement('style');
    style.innerHTML = `
        @keyframes button-fade-in {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Основная функция применения изменений
    function applyChanges() {
        if (!currentContainer) return;

        var categories = groupBtnsByType(currentContainer);
        var allButtons = [].concat(
            categories.online,
            categories.torrent,
            categories.trailer,
            categories.shots,
            categories.book,
            categories.reaction,
            categories.subscribe,
            categories.other
        );

        allButtons = arrangeBtnsByOrder(allButtons);
        allButtonsCache = allButtons;

        // Фильтруем кнопки из папок
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

        var targetContainer = currentContainer.find('.full-start-new__buttons');
        if (!targetContainer.length) return;

        targetContainer.find('.full-start__button').not('.button--edit-order').detach();

        // Вставка кнопок по порядку
        filteredButtons.forEach(function(btn) {
            targetContainer.append(btn);
        });

        // **Запуск анимации**
        animateBtnFadeIn(filteredButtons);

        // Редактор кнопок в конце
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

    // Здесь остальной код плагина без изменений (редактор, папки, сохранение, UI)

})();
