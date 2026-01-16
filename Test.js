(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") {
        console.log("[Captions Fix] Lampa не найдена, ожидание...");
        setTimeout(arguments.callee, 1000);
        return;
    }
    
    console.log("[Captions Fix] Инициализация плагина");
    
    // Разделы где названия ДОЛЖНЫ показываться
    var SHOW_SECTIONS = [
        "Релизы",
        "Избранное", 
        "История",
        "Торренты",
        "Поиск"
    ];
    
    // Основная функция проверки
    function shouldShowCaptions() {
        try {
            // Способ 1: Заголовок страницы
            var titleElem = document.querySelector('.head__title');
            if (titleElem && titleElem.textContent) {
                var currentSection = titleElem.textContent.trim();
                console.log("[Captions Fix] Текущий раздел:", currentSection);
                
                // Проверяем каждый раздел
                for (var i = 0; i < SHOW_SECTIONS.length; i++) {
                    if (currentSection === SHOW_SECTIONS[i]) {
                        console.log("[Captions Fix] Названия ПОКАЗЫВАТЬ в разделе:", currentSection);
                        return true;
                    }
                }
                
                console.log("[Captions Fix] Названия СКРЫТЬ в разделе:", currentSection);
                return false;
            }
            
            // Способ 2: Если заголовка нет, проверяем URL
            var hash = window.location.hash.toLowerCase();
            if (hash.includes('favorite') || hash.includes('избран')) return true;
            if (hash.includes('history') || hash.includes('истори')) return true;
            if (hash.includes('torrent') || hash.includes('торрент')) return true;
            if (hash.includes('release') || hash.includes('релиз')) return true;
            if (hash.includes('search') || hash.includes('поиск')) return true;
            
        } catch(e) {
            console.error("[Captions Fix] Ошибка проверки:", e);
        }
        
        return false;
    }
    
    // Функция обновления стилей
    function updateStyles() {
        var shouldShow = shouldShowCaptions();
        
        // Удаляем старые стили
        var oldStyle = document.getElementById('captions-fix-style');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        // Создаём новые стили
        var style = document.createElement('style');
        style.id = 'captions-fix-style';
        
        if (shouldShow) {
            // ПОКАЗЫВАТЬ названия
            style.textContent = `
                /* Captions Fix - ПОКАЗАТЬ названия */
                .card:not(.card--collection) .card__age,
                .card:not(.card--collection) .card__title {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            `;
            console.log("[Captions Fix] Стили: ПОКАЗАТЬ названия");
        } else {
            // СКРЫТЬ названия
            style.textContent = `
                /* Captions Fix - СКРЫТЬ названия */
                .card:not(.card--collection) .card__age,
                .card:not(.card--collection) .card__title {
                    display: none !important;
                }
            `;
            console.log("[Captions Fix] Стили: СКРЫТЬ названия");
        }
        
        // Добавляем стили в начало head для приоритета
        var head = document.head || document.getElementsByTagName('head')[0];
        if (head.firstChild) {
            head.insertBefore(style, head.firstChild);
        } else {
            head.appendChild(style);
        }
    }
    
    // Наблюдатель за изменениями DOM
    function startObserver() {
        var observer = new MutationObserver(function(mutations) {
            var shouldUpdate = false;
            
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                
                // Если добавляются новые карточки
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    for (var j = 0; j < mutation.addedNodes.length; j++) {
                        var node = mutation.addedNodes[j];
                        if (node.nodeType === 1 && 
                            (node.classList.contains('card') || 
                             (node.querySelector && node.querySelector('.card')))) {
                            shouldUpdate = true;
                            break;
                        }
                    }
                }
                
                // Если меняется заголовок
                if (mutation.type === 'characterData' && 
                    mutation.target.parentNode && 
                    mutation.target.parentNode.classList.contains('head__title')) {
                    shouldUpdate = true;
                }
                
                if (shouldUpdate) break;
            }
            
            if (shouldUpdate) {
                setTimeout(updateStyles, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        return observer;
    }
    
    // Инициализация плагина
    function init() {
        console.log("[Captions Fix] Запуск плагина...");
        
        // Ждём полной загрузки страницы
        if (document.readyState !== 'complete') {
            setTimeout(init, 500);
            return;
        }
        
        // Первое обновление стилей
        updateStyles();
        
        // Запускаем наблюдатель
        var observer = startObserver();
        
        // Также периодически проверяем (на случай если наблюдатель пропустит)
        setInterval(updateStyles, 3000);
        
        // Слушаем события навигации Lampa
        if (Lampa.Listener) {
            Lampa.Listener.follow('activity', function(e) {
                if (e.type === 'active' || e.type === 'start') {
                    setTimeout(updateStyles, 500);
                }
            });
        }
        
        console.log("[Captions Fix] Плагин запущен успешно");
        
        // Добавляем глобальную функцию для дебага
        window.debugCaptions = function() {
            console.log("=== Captions Debug ===");
            console.log("Разделы для показа:", SHOW_SECTIONS);
            console.log("Показывать сейчас?", shouldShowCaptions());
            console.log("Стиль элемента:", document.getElementById('captions-fix-style')?.textContent?.substring(0, 100) + "...");
            console.log("======================");
        };
    }
    
    // Запускаем с задержкой
    setTimeout(init, 2000);
    
})();
