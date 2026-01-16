(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_fast) return;
    window.captions_fix_fast = true;
    
    console.log("[Captions Fix Fast] Плагин запущен");
    
    // Разделы где названия должны показываться
    var SHOW_SECTIONS = [
        "Релизы",
        "Избранное", 
        "История",
        "Торренты",
        "Поиск"
    ];
    
    var styleElement = null;
    var currentMode = null;
    
    // Быстрая проверка раздела
    function getCurrentSection() {
        // Способ 1: Заголовок страницы
        var titleEl = document.querySelector('.head__title');
        if (titleEl && titleEl.textContent) {
            return titleEl.textContent.trim();
        }
        
        // Способ 2: URL/hash для надёжности
        var hash = window.location.hash.toLowerCase();
        if (hash.includes('favorite') || hash.includes('избран')) return "Избранное";
        if (hash.includes('history') || hash.includes('истори')) return "История";
        if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
        if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
        if (hash.includes('search') || hash.includes('поиск')) return "Поиск";
        
        return "";
    }
    
    // Быстрая проверка нужно ли показывать
    function shouldShowNow() {
        var section = getCurrentSection();
        if (!section) return false;
        
        // Проверяем точное совпадение или частичное
        for (var i = 0; i < SHOW_SECTIONS.length; i++) {
            if (section === SHOW_SECTIONS[i] || 
                section.includes(SHOW_SECTIONS[i]) ||
                SHOW_SECTIONS[i].includes(section)) {
                return true;
            }
        }
        return false;
    }
    
    // Мгновенное применение стилей
    function applyStylesNow() {
        var show = shouldShowNow();
        
        // Если режим не изменился - выходим
        if (currentMode === show) return;
        currentMode = show;
        
        // Удаляем старый стиль
        if (styleElement) {
            styleElement.remove();
            styleElement = null;
        }
        
        // Создаём новый стиль
        styleElement = document.createElement('style');
        styleElement.id = 'captions-fast-style';
        
        if (show) {
            // ПОКАЗЫВАТЬ названия
            styleElement.textContent = `
                .card:not(.card--collection) .card__age,
                .card:not(.card--collection) .card__title {
                    display: block !important;
                    opacity: 1 !important;
                }
            `;
        } else {
            // СКРЫВАТЬ названия
            styleElement.textContent = `
                .card:not(.card--collection) .card__age,
                .card:not(.card--collection) .card__title {
                    display: none !important;
                }
            `;
        }
        
        // Вставляем в head
        document.head.appendChild(styleElement);
    }
    
    // Мгновенное применение к карточкам
    function applyToCardsNow() {
        var show = shouldShowNow();
        var cards = document.querySelectorAll('.card:not(.card--collection)');
        var display = show ? 'block' : 'none';
        
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var age = card.querySelector('.card__age');
            var title = card.querySelector('.card__title');
            
            if (age) age.style.display = display;
            if (title) title.style.display = display;
        }
    }
    
    // Основная функция обновления
    function updateNow() {
        applyStylesNow();
        applyToCardsNow();
    }
    
    // Наблюдатель
    function startObserver() {
        var observer = new MutationObserver(function(mutations) {
            var shouldUpdate = false;
            
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                
                // Если меняется заголовок
                if (mutation.target.classList && 
                    mutation.target.classList.contains('head__title')) {
                    shouldUpdate = true;
                    break;
                }
                
                // Если добавляются карточки
                if (mutation.addedNodes) {
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
                
                if (shouldUpdate) break;
            }
            
            if (shouldUpdate) updateNow();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    // Инициализация
    function init() {
        console.log("[Captions Fix Fast] Инициализация...");
        
        // Первое применение сразу
        updateNow();
        
        // Запускаем наблюдателя
        startObserver();
        
        // Дополнительная проверка через 100мс (на всякий случай)
        setTimeout(updateNow, 100);
        
        console.log("[Captions Fix Fast] Готов. Показывать в разделах:", SHOW_SECTIONS);
    }
    
    // Запускаем
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 50); // Минимальная задержка для стабильности
    }
    
})();
