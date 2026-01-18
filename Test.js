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
        
        // Подпункты Избранного, где нужно всегда показывать надписи
        self.FAVORITE_SUBSECTIONS = [
            'book', 'scheduled', 'wath', 'like', 'look', 'viewed', 'thrown', 'continued'
        ];
        
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
        
        // Определение текущего раздела
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
                        else if (activity.component && activity.component.title) {
                            section = activity.component.title;
                        }
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

                var activeNav = document.querySelector('.navigation__item.active, .menu__item.active');
                if (activeNav && activeNav.textContent) {
                    section = activeNav.textContent.trim();
                    if (section) return section;
                }

                var pageHeaders = document.querySelectorAll('h1, h2, .page-title, .section-title');
                for (var i = 0; i < pageHeaders.length; i++) {
                    if (pageHeaders[i].textContent && pageHeaders[i].offsetParent !== null) {
                        var text = pageHeaders[i].textContent.trim();
                        if (text && text.length < 50) { section = text; break; }
                    }
                }

                var dataSection = document.querySelector('[data-section], [data-page]');
                if (dataSection) {
                    var attr = dataSection.getAttribute('data-section') || dataSection.getAttribute('data-page');
                    if (attr) return attr;
                }

                var pageText = document.body.textContent || "";
                pageText = pageText.toLowerCase();

                if (pageText.includes('избранное') || pageText.includes('favorite')) return "Избранное";
                if (pageText.includes('история') || pageText.includes('history')) return "История";
                if (pageText.includes('торренты') || pageText.includes('torrent')) return "Торренты";
                if (pageText.includes('релизы') || pageText.includes('release')) return "Релизы";
                if (pageText.includes('поиск') || pageText.includes('search')) return "Поиск";

            } catch(e) {
                console.error("[Captions Fix v2] Ошибка определения раздела:", e);
            }
            return section || "";
        };
        
        // Определение типа раздела
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
                if (name.includes(lowerSections[j]) || lowerSections[j].includes(name)) {
                    return self.SHOW_IN_SECTIONS[j].toLowerCase();
                }
            }

            return '';
        };

        // Нужно ли показывать надписи
        self.shouldShowCaptions = function() {
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);

            // Проверяем подпункты избранного
            if (sectionType === 'favorites') {
                var urlParams = new URLSearchParams(window.location.search);
                var typeParam = urlParams.get('type');
                if (self.FAVORITE_SUBSECTIONS.includes(typeParam)) return true;
            }

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
            try {
                var currentSection = self.getCurrentSection();
                if (currentSection !== self.lastSection) {
                    self.lastSection = currentSection;
                    self.addStyles();
                    self.applyToCards();
                }
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки:", e);
            }
        };

        self.addStyles = function() {
            var css = self.generateCSS();
            var styleId = "captions-fix-styles-v2";
            var oldStyle = document.getElementById(styleId);
            if (oldStyle) oldStyle.remove();

            var style = document.createElement("style");
            style.id = styleId;
            style.textContent = css;

            var head = document.head || document.getElementsByTagName('head')[0];
            if (head.firstChild) head.insertBefore(style, head.firstChild);
            else head.appendChild(style);

            self.styleElement = style;
        };

        self.applyToCards = function() {
            try {
                var shouldShow = self.shouldShowCaptions();
                var cards = document.querySelectorAll('.card:not(.card--collection)');
                cards.forEach(function(card) {
                    var age = card.querySelector('.card__age');
                    var title = card.querySelector('.card__title');
                    if (age) { age.style.display = shouldShow ? 'block' : 'none'; age.style.opacity = shouldShow ? '1' : '0'; }
                    if (title) { title.style.display = shouldShow ? 'block' : 'none'; title.style.opacity = shouldShow ? '1' : '0'; }
                });
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка применения к карточкам:", e);
            }
        };

        self.startObserver = function() {
            if (self.observer) return;

            self.observer = new MutationObserver(function(mutations) {
                var shouldCheck = false;
                for (var i = 0; i < mutations.length; i++) {
                    var mutation = mutations[i];
                    if (mutation.target.classList && mutation.target.classList.contains('head__title')) { shouldCheck = true; break; }
                    if (mutation.target === document.body && mutation.attributeName === 'class') { shouldCheck = true; break; }
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        for (var j = 0; j < mutation.addedNodes.length; j++) {
                            var node = mutation.addedNodes[j];
                            if (node.nodeType === 1 && (node.classList.contains('card') || node.querySelector('.card'))) { shouldCheck = true; break; }
                        }
                    }
                    if (shouldCheck) break;
                }
                if (shouldCheck) self.checkAndUpdate();
            });

            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['class']
            });
        };

        self.debugInfo = function() {
            var section = self.getCurrentSection();
            var type = self.detectSectionType(section);
            var shouldShow = self.shouldShowCaptions();
            return { section, type, shouldShow };
        };

        self.forceShow = function() { document.body.classList.add('captions-force-show'); self.applyToCards(); };
        self.forceHide = function() { document.body.classList.add('captions-force-hide'); self.applyToCards(); };
        self.destroy = function() { if (self.observer) { self.observer.disconnect(); self.observer = null; } if (self.styleElement) { self.styleElement.remove(); self.styleElement = null; } window.captions_fix_plugin_v2 = false; };
    }

    var plugin = new CaptionsFix();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { plugin.init(); });
    else plugin.init();

    window.debugCaptions = function() { return plugin.debugInfo(); };
    window.showCaptions = function() { plugin.forceShow(); console.log("[Captions Fix] Принудительно показать названия"); };
    window.hideCaptions = function() { plugin.forceHide(); console.log("[Captions Fix] Принудительно скрыть названия"); };
    window.CaptionsFixPlugin = plugin;
})();
