(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v3) return;
    window.captions_fix_plugin_v3 = true;
    
    console.log("[Captions Fix v3] Плагин запущен");
    
    function CaptionsFix() {
        var self = this;
        self.initialized = false;
        self.styleElement = null;
        self.observer = null;
        
        self.SHOW_IN_SECTIONS = [
            "Релизы", "Releases", "релизы", "releases",
            "Избранное", "Favorites", "избранное", "favorites", 
            "История", "History", "история", "history",
            "Торренты", "Torrents", "торренты", "torrents",
            "Поиск", "Search", "поиск", "search"
        ];
        
        self.SECTION_KEYWORDS = {
            'releases': ['релиз', 'release', 'новинк'],
            'favorites': ['избранн', 'favorit', 'закладк', 'bookmark'],
            'history': ['истори', 'histor', 'просмотр', 'watch'],
            'torrents': ['торрент', 'torrent', 'загрузк', 'download'],
            'search': ['поиск', 'search', 'искан', 'find']
        };
        
        self.init = function() {
            if (self.initialized) return;
            if (!document.body) { requestAnimationFrame(self.init); return; }
            self.addStyles();
            self.startObserver();
            self.checkAndUpdate();
            self.initialized = true;
            console.log("[Captions Fix v3] Инициализирован");
        };
        
        self.getCurrentSection = function() {
            try {
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) return headerTitle.textContent.trim();
                
                if (Lampa.Activity && Lampa.Activity.active) {
                    var activity = Lampa.Activity.active();
                    if (activity) return activity.title || activity.name || (activity.component && activity.component.title) || '';
                }
                
                var hash = window.location.hash.toLowerCase();
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное";
                if (hash.includes('history') || hash.includes('истори')) return "История";
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
                if (hash.includes('search') || hash.includes('поиск')) return "Поиск";
                
                var bodyClass = document.body.className.toLowerCase();
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное";
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История";
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты";
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы";
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск";
                
            } catch(e) { console.error("[Captions Fix v3] Ошибка определения раздела:", e); }
            return "";
        };
        
        self.detectSectionType = function(sectionName) {
            if (!sectionName) return '';
            var name = sectionName.toLowerCase();
            for (var type in self.SECTION_KEYWORDS) {
                var keywords = self.SECTION_KEYWORDS[type];
                for (var i = 0; i < keywords.length; i++) {
                    if (name.includes(keywords[i])) return type;
                }
            }
            var lowerSections = self.SHOW_IN_SECTIONS.map(s => s.toLowerCase());
            for (var j = 0; j < lowerSections.length; j++) {
                if (name.includes(lowerSections[j]) || lowerSections[j].includes(name)) return lowerSections[j];
            }
            return '';
        };
        
        // ================================
        // ✅ Основная логика показа/скрытия
        // ================================
        self.shouldShowCaptions = function() {
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            var search = window.location.search.toLowerCase();
            var bodyClass = document.body.className.toLowerCase();
            
            // Фильмы/сериалы — показываем
            if (search.includes('card=') && (search.includes('media=movie') || search.includes('media=tv'))) return true;
            
            // Поиск — показываем
            if (search.includes('query=') || bodyClass.includes('search')) return true;
            
            // Актёры/режиссёры — скрываем
            if (search.includes('component=actor') || search.includes('job=acting') || search.includes('job=director')) return false;
            
            // Избранное — показываем ВСЕ подпункты
            if (sectionType === 'favorites') return true;
            
            // Остальные разделы — стандартная логика
            return sectionType !== '';
        };
        
        self.generateCSS = function() {
            var show = self.shouldShowCaptions();
            if (show) {
                return `
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                `;
            } else {
                return `
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                    }
                `;
            }
        };
        
        self.checkAndUpdate = function() {
            self.addStyles();
            self.applyToCards();
        };
        
        self.addStyles = function() {
            var css = self.generateCSS();
            if (!css) return;
            var styleId = "captions-fix-styles-v3";
            var oldStyle = document.getElementById(styleId);
            if (oldStyle) oldStyle.remove();
            var style = document.createElement("style");
            style.id = styleId;
            style.textContent = css;
            var head = document.head || document.getElementsByTagName('head')[0];
            head.insertBefore(style, head.firstChild);
            self.styleElement = style;
        };
        
        self.applyToCards = function() {
            var show = self.shouldShowCaptions();
            document.querySelectorAll('.card:not(.card--collection)').forEach(card => {
                var age = card.querySelector('.card__age');
                var title = card.querySelector('.card__title');
                if (age) age.style.display = show ? 'block' : 'none';
                if (title) title.style.display = show ? 'block' : 'none';
            });
        };
        
        self.startObserver = function() {
            if (self.observer) return;
            self.observer = new MutationObserver(self.checkAndUpdate);
            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        };
        
        self.debugInfo = function() {
            var section = self.getCurrentSection();
            var type = self.detectSectionType(section);
            var show = self.shouldShowCaptions();
            console.log("=== Captions Fix Debug ===");
            console.log("Раздел:", section);
            console.log("Тип:", type);
            console.log("Показывать надписи:", show);
            console.log("========================");
            return {section, type, show};
        };
        
        self.forceShow = function() { document.body.classList.add('captions-force-show'); self.applyToCards(); };
        self.forceHide = function() { document.body.classList.add('captions-force-hide'); self.applyToCards(); };
        self.destroy = function() { if (self.observer) self.observer.disconnect(); if (self.styleElement) self.styleElement.remove(); window.captions_fix_plugin_v3 = false; console.log("[Captions Fix v3] Остановлен"); };
    }
    
    var plugin = new CaptionsFix();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => plugin.init());
    else plugin.init();
    
    window.debugCaptions = () => plugin.debugInfo();
    window.showCaptions = () => { plugin.forceShow(); console.log("[Captions Fix] Принудительно показать названия"); };
    window.hideCaptions = () => { plugin.forceHide(); console.log("[Captions Fix] Принудительно скрыть названия"); };
    window.CaptionsFixPlugin = plugin;
})();
