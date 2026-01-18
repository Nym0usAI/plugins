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
        self.lastDecision = null; // хранит последнюю логику показа/скрытия

        // подпункты избранного
        self.FAVORITE_SUBSECTIONS = ['book','scheduled','wath','like','look','viewed','thrown','continued'];
        
        self.SHOW_IN_SECTIONS = [
            "Релизы", "Releases", "релизы", "releases",
            "Избранное", "Favorites", "Избранное", "favorites", 
            "История", "History", "история", "history",
            "Торренты", "Torrents", "торренты", "torrents",
            "Поиск", "Search", "поиск", "search"
        ];
        
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
        // ✅ FIX ДЛЯ ПОДПУНКТОВ ИЗБРАННОГО
        // =============================
        self.shouldShowCaptions = function() {
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            var urlParams = new URLSearchParams(window.location.search);
            var typeParam = urlParams.get('type');

            // 1️⃣ Если подпункт Избранного — показываем
            if (sectionType === 'favorites' && self.FAVORITE_SUBSECTIONS.includes(typeParam)) {
                return true;
            }

            // 2️⃣ Страница карточки фильма/сериала — показываем
            if (window.location.search.includes('card=') && 
                (window.location.search.includes('media=movie') || window.location.search.includes('media=tv'))) {
                return true;
            }

            // 3️⃣ Страница поиска — показываем
            if (window.location.search.includes('query=') || document.body.className.toLowerCase().includes('search')) {
                return true;
            }

            // 4️⃣ Страницы актёров/режиссёров — скрываем
            if (window.location.search.includes('component=actor') || 
                window.location.search.includes('job=acting') || 
                window.location.search.includes('job=director')) {
                return false;
            }

            // 5️⃣ Остальные разделы — стандартная логика
            return sectionType !== '';
        };
        
        self.generateCSS = function() {
            var decision = self.shouldShowCaptions();
            if (decision === self.lastDecision) return self.styleElement ? self.styleElement.textContent : '';
            self.lastDecision = decision;

            if (decision) {
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
