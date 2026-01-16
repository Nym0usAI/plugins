(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_fast) return;
    window.captions_fix_fast = true;
    
    console.log("[Captions Fast] Плагин запущен");
    
    // Разделы где названия ДОЛЖНЫ показываться
    var SHOW_SECTIONS = [
        "Релизы",
        "Избранное", 
        "История",
        "Торренты",
        "Поиск"
    ];
    
    // Стили уже загружены?
    var styleAdded = false;
    var currentMode = null;
    
    // 1. БЫСТРАЯ проверка раздела
    function getCurrentSection() {
        // Только самый быстрый способ - заголовок
        var titleEl = document.querySelector('.head__title');
        return titleEl ? titleEl.textContent.trim() : "";
    }
    
    // 2. БЫСТРАЯ проверка нужно ли показывать
    function shouldShowNow() {
        var section = getCurrentSection();
        for (var i = 0; i < SHOW_SECTIONS.length; i++) {
            if (section === SHOW_SECTIONS[i]) {
                return true;
            }
        }
        return false;
    }
    
    // 3. МГНОВЕННОЕ применение стилей
    function applyStylesNow() {
        var show = shouldShowNow();
        if (currentMode === show) return; // Уже установлено
        
        currentMode = show;
        
        // Удаляем старый стиль если есть
        var oldStyle = document.getElementById('captions-fast-style');
        if (oldStyle) oldStyle.remove();
        
        // Создаём новый стиль
        var style = document.createElement('style');
        style.id = 'captions-fast-style';
        
        if (show) {
            style.textContent = `
                /* Captions Fast - ПОКАЗАТЬ */
                .card:not(.card--collection) .card__age,
                .card:not(.card--collection) .card__title {
                    display: block !important;
                }
            `;
        } else {
            style.textContent = `
                /* Captions Fast - СКРЫТЬ */
                .card:not(.card--collection) .card__age,
                .card:not(.card--collection) .card__title {
                    display: none !important;
                }
            `;
        }
        
        // Мгновенно вставляем
        document.head.appendChild(style);
        console.log("[Captions Fast] Стили обновлены:", show ? "ПОКАЗАТЬ" : "СКРЫТЬ");
        
        // СРАЗУ применяем к видимым карточкам
        applyToVisibleCards(show);
    }
    
    // 4. НЕМЕДЛЕННОЕ применение к видимым карточкам
    function applyToVisibleCards(show) {
        var cards = document.querySelectorAll('.card:not(.card--collection)');
        var display = show ? 'block' : 'none';
        
        cards.forEach(function(card) {
            var age = card.querySelector('.card__age');
            var title = card.querySelector('.card__title');
            
            if (age) age.style.display = display;
            if (title) title.style.display = display;
        });
    }
    
    // 5. НАБЛЮДАТЕЛЬ без задержек
    function startFastObserver() {
        var lastSection = "";
        
        var observer = new MutationObserver(function() {
            // Проверяем раздел сразу
            var section = getCurrentSection();
            if (section !== lastSection) {
                lastSection = section;
                applyStylesNow(); // Мгновенно!
            }
        });
        
        // Следим ТОЛЬКО за заголовком и body
        observer.observe(document.body, {
            childList: false,
            subtree: false,
            characterData: true,
            attributes: true,
            attributeFilter: ['class']
        });
        
        // Отдельно следим за заголовком
        var titleEl = document.querySelector('.head__title');
        if (titleEl) {
            observer.observe(titleEl, {
                characterData: true,
                childList: true,
                subtree: true
            });
        }
        
        return observer;
    }
    
    // 6. Запуск без задержек
    function initFast() {
        console.log("[Captions Fast] Быстрая инициализация");
        
        // Первое применение СРАЗУ
        applyStylesNow();
        
        // Запускаем наблюдателя
        var observer = startFastObserver();
        
        // Дополнительно: при любом клике проверяем
        document.addEventListener('click', function() {
            setTimeout(applyStylesNow, 50); // Минимальная задержка
        });
        
        // Дополнительно: при фокусе на карточке
        document.addEventListener('focusin', function(e) {
            if (e.target.closest('.card')) {
                applyStylesNow();
            }
        });
        
        console.log("[Captions Fast] Готов. Разделы для показа:", SHOW_SECTIONS);
    }
    
    // 7. Запускаем СРАЗУ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFast);
    } else {
        initFast();
    }
    
    // 8. Экспорт для дебага
    window.captionsDebug = function() {
        console.log("Раздел:", getCurrentSection());
        console.log("Показывать:", shouldShowNow());
        console.log("Режим:", currentMode);
    };
    
})();
