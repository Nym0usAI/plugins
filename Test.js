(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_no_delay) return;
    window.captions_fix_no_delay = true;
    
    console.log("[Captions No Delay] Плагин запущен");
    
    // Разделы где названия ДОЛЖНЫ показываться
    var SHOW_SECTIONS = [
        "Релизы",
        "Избранное", 
        "История",
        "Торренты",
        "Поиск"
    ];
    
    // Мгновенная проверка раздела
    function getCurrentSection() {
        var titleEl = document.querySelector('.head__title');
        return titleEl ? titleEl.textContent.trim() : "";
    }
    
    // Мгновенная проверка нужно ли показывать
    function shouldShowNow() {
        var section = getCurrentSection();
        return SHOW_SECTIONS.includes(section);
    }
    
    // Мгновенное применение стилей
    function applyStylesNow() {
        var show = shouldShowNow();
        var css = show 
            ? `.card:not(.card--collection) .card__age,
               .card:not(.card--collection) .card__title {
                   display: block !important;
               }`
            : `.card:not(.card--collection) .card__age,
               .card:not(.card--collection) .card__title {
                   display: none !important;
               }`;
        
        // Удаляем старый стиль
        var oldStyle = document.getElementById('captions-now-style');
        if (oldStyle) oldStyle.remove();
        
        // Создаём новый
        var style = document.createElement('style');
        style.id = 'captions-now-style';
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    // Мгновенное применение к карточкам
    function applyToCardsNow() {
        var show = shouldShowNow();
        var cards = document.querySelectorAll('.card:not(.card--collection)');
        var display = show ? 'block' : 'none';
        
        cards.forEach(function(card) {
            var age = card.querySelector('.card__age');
            var title = card.querySelector('.card__title');
            if (age) age.style.display = display;
            if (title) title.style.display = display;
        });
    }
    
    // Основная функция обновления (без задержек)
    function updateNow() {
        applyStylesNow();
        applyToCardsNow();
    }
    
    // Наблюдатель без задержек
    function startObserverNow() {
        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                
                // Если меняется заголовок
                if (mutation.target.classList && 
                    mutation.target.classList.contains('head__title')) {
                    updateNow(); // НЕМЕДЛЕННО!
                    return;
                }
                
                // Если добавляются карточки
                if (mutation.addedNodes) {
                    for (var j = 0; j < mutation.addedNodes.length; j++) {
                        var node = mutation.addedNodes[j];
                        if (node.nodeType === 1 && 
                            (node.classList.contains('card') || 
                             (node.querySelector && node.querySelector('.card')))) {
                            applyToCardsNow(); // НЕМЕДЛЕННО!
                            return;
                        }
                    }
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        return observer;
    }
    
    // Инициализация БЕЗ ЗАДЕРЖЕК
    function initNow() {
        console.log("[Captions No Delay] Инициализация...");
        
        // Первое применение сразу
        updateNow();
        
        // Запускаем наблюдателя
        startObserverNow();
        
        console.log("[Captions No Delay] Готов. Названия показываются в:", SHOW_SECTIONS);
    }
    
    // Запускаем сразу
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNow);
    } else {
        initNow();
    }
    
})();
