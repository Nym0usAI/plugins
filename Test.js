(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v2) return;
    window.captions_fix_plugin_v2 = true;
    
    console.log("[Captions Fix v2] Плагин запущен");
    
    function CaptionsFix() {
        var self = this;
        self.initialized = false;
        self.styleElement = null;
        self.observer = null;
        self.lastSection = "";
        
        // РАЗДЕЛЫ ГДЕ НАЗВАНИЯ ДОЛЖНЫ ПОКАЗЫВАТЬСЯ
        self.SHOW_IN_SECTIONS = [
            "Релизы", "Releases", "релизы", "releases",
            "Избранное", "Favorites", "Избранное", "favorites", 
            "История", "History", "история", "history",
            "Торренты", "Torrents", "торренты", "torrents",
            "Поиск", "Search", "поиск", "search"
        ];
        
        // Ключевые слова для определения разделов
        self.SECTION_KEYWORDS = {
            'releases': ['релиз', 'release', 'новинк'],
            'favorites': ['избранн', 'favorit', 'закладк', 'bookmark'],
            'history': ['истори', 'histor', 'просмотр', 'watch'],
            'torrents': ['торрент', 'torrent', 'загрузк', 'download'],
            'search': ['поиск', 'search', 'искан', 'find']
        };
        
        // Инициализация
        self.init = function() {
            if (self.initialized) return;
            
            console.log("[Captions Fix v2] Инициализация...");
            
            if (!document.body) {
                requestAnimationFrame(self.init);
                return;
            }
            
            self.addStyles();
            self.startObserver();
            self.checkAndUpdate();
            self.initialized = true;
            console.log("[Captions Fix v2] Инициализирован");
        };
        
        self.getCurrentSection = function() {
            var section = "";
            try {
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) {
                    section = headerTitle.textContent.trim();
                    if (section) return section;
                }
                
                if (Lampa.Activity && Lampa.Activity.active) {
                    var activity = Lampa.Activity.active();
                    if (activity) {
                        if (activity.title) section = activity.title;
                        else if (activity.name) section = activity.name;
                        else if (activity.component && activity.component.title) section = activity.component.title;
                        if (section) return section;
                    }
                }
                
                var hash = window.location.hash.toLowerCase();
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное";
                if (hash.includes('history') || hash.includes('истори')) return "История";
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
                if (hash.includes('search') || hash.includes('поиск')) return "Поиск";
                
                var bodyClass = document.body.className;
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное";
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История";
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты";
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы";
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск";
                
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка определения раздела:", e);
            }
            
            return section || "";
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
        
        // =============================
        // ✅ Исправление для актёров и режиссёров
        // =============================
        self.shouldShowCaptions = function() {
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            var search = window.location.search.toLowerCase();
            var bodyClass = document.body.className.toLowerCase();

            // Страница карточки фильма/сериала — показываем
            if (search.includes('card=') && (search.includes('media=movie') || search.includes('media=tv'))) {
                return true;
            }

            // Страница поиска — показываем
            if (search.includes('query=') || bodyClass.includes('search')) {
                return true;
            }

            // Страницы актёров/режиссёров — скрываем
            if (search.includes('component=actor') || search.includes('job=acting') || search.includes('job=director')) {
                return false;
            }

            // Раздел Избранное — показываем ВСЕ подпункты
            if (sectionType === 'favorites') {
                return true;
            }

            // Остальные разделы — стандартная логика
            return sectionType !== '';
        };
        
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            if (shouldShow) {
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
            
            var styleId = "captions-fix-styles-v2";
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
            var cards = document.querySelectorAll('.card:not(.card--collection)');
            cards.forEach(function(card) {
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
            var shouldShow = self.shouldShowCaptions();
            console.log("=== Captions Fix Debug ===");
            console.log("Раздел:", section);
            console.log("Тип:", type);
            console.log("Показывать названия:", shouldShow);
            console.log("========================");
            return {section, type, shouldShow};
        };
        
        self.forceShow = function() {
            document.body.classList.add('captions-force-show');
            self.applyToCards();
        };
        
        self.forceHide = function() {
            document.body.classList.add('captions-force-hide');
            self.applyToCards();
        };
        
        self.destroy = function() {
            if (self.observer) self.observer.disconnect();
            if (self.styleElement) self.styleElement.remove();
            window.captions_fix_plugin_v2 = false;
            console.log("[Captions Fix v2] Остановлен");
        };
    }
    
    var plugin = new CaptionsFix();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { plugin.init(); });
    } else { plugin.init(); }
    
    window.debugCaptions = function() { return plugin.debugInfo(); };
    window.showCaptions = function() { plugin.forceShow(); console.log("[Captions Fix] Принудительно показать названия"); };
    window.hideCaptions = function() { plugin.forceHide(); console.log("[Captions Fix] Принудительно скрыть названия"); };
    window.CaptionsFixPlugin = plugin;
})();
