(function () {
    "use strict";
    if (typeof Lampa === "undefined" || window.captions_fix_short) return;
    window.captions_fix_short = true;
    
    console.log("[Captions Short] Запуск");
    
    var SHOW_SECTIONS = ["Релизы","Избранное","История","Торренты","Поиск"];
    var styleElement = null;
    var lastSection = "";
    
    function getCurrentSection() {
        var title = document.querySelector('.head__title');
        if (title && title.textContent) return title.textContent.trim();
        
        if (Lampa.Activity && Lampa.Activity.active()) {
            var act = Lampa.Activity.active();
            if (act.title) return act.title;
            if (act.component && act.component.title) return act.component.title;
        }
        
        var hash = window.location.hash.toLowerCase();
        if (hash.includes('favorite') || hash.includes('избран')) return "Избранное";
        if (hash.includes('history') || hash.includes('истори')) return "История";
        if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
        if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
        if (hash.includes('search') || hash.includes('поиск')) return "Поиск";
        
        return "";
    }
    
    function shouldShowCaptions() {
        var section = getCurrentSection();
        return SHOW_SECTIONS.some(s => section.includes(s) || s.includes(section));
    }
    
    function updateStyles() {
        var show = shouldShowCaptions();
        var css = show 
            ? `.card:not(.card--collection) .card__age,
               .card:not(.card--collection) .card__title {
                   display: block !important;
               }`
            : `.card:not(.card--collection) .card__age,
               .card:not(.card--collection) .card__title {
                   display: none !important;
               }`;
        
        if (styleElement) styleElement.remove();
        styleElement = document.createElement('style');
        styleElement.id = 'captions-short-style';
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
    }
    
    function checkAndUpdate() {
        var currentSection = getCurrentSection();
        if (currentSection !== lastSection) {
            lastSection = currentSection;
            updateStyles();
        }
    }
    
    // Инициализация
    function init() {
        if (!document.body) {
            requestAnimationFrame(init);
            return;
        }
        
        updateStyles();
        
        new MutationObserver(checkAndUpdate).observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['class']
        });
        
        console.log("[Captions Short] Готов");
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
