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
            releases: ['релиз', 'release', 'новинк'],
            favorites: ['избранн', 'favorit', 'закладк', 'bookmark'],
            history: ['истори', 'histor', 'просмотр', 'watch'],
            torrents: ['торрент', 'torrent', 'загрузк', 'download'],
            search: ['поиск', 'search', 'искан', 'find']
        };
        
        self.init = function() {
            if (self.initialized) return;
            
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
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА
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
                        if (section) return section;
                    }
                }
                
                var hash = window.location.hash.toLowerCase();
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное";
                if (hash.includes('history') || hash.includes('истори')) return "История";
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
                if (hash.includes('search') || hash.includes('поиск')) return "Поиск";
                
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
            return '';
        };
        
        // ✅ ОБОИ ФИКСА
        self.shouldShowCaptions = function() {
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            var hash = window.location.hash.toLowerCase();

            // +++ FIX #1: карточка фильма / сериала — показывать надписи в каруселях
            if (
                hash.includes('card=') &&
                (hash.includes('media=movie') || hash.includes('media=tv'))
            ) {
                return true;
            }

            // +++ FIX #2: страницы актёров / режиссёров — скрывать
            if (
                hash.includes('component=actor') ||
                hash.includes('job=acting') ||
                hash.includes('job=director')
            ) {
                return false;
            }

            // стандартная логика для всех остальных разделов
            return sectionType !== '';
        };
        
        self.generateCSS = function() {
            if (self.shouldShowCaptions()) {
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
            var currentSection = self.getCurrentSection();
            if (currentSection !== self.lastSection) {
                self.lastSection = currentSection;
                self.addStyles();
                self.applyToCards();
            }
        };
        
        self.addStyles = function() {
            var styleId = "captions-fix-styles-v2";
            var old = document.getElementById(styleId);
            if (old) old.remove();
            
            var style = document.createElement("style");
            style.id = styleId;
            style.textContent = self.generateCSS();
            
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
    }
    
    var plugin = new CaptionsFix();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            plugin.init();
        });
    } else {
        plugin.init();
    }
    
    window.CaptionsFixPlugin = plugin;
    window.debugCaptions = function() {
        return {
            section: plugin.getCurrentSection(),
            show: plugin.shouldShowCaptions()
        };
    };
})();
