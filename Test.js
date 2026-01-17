(function () {
    "use strict";
    
    // Мгновенная проверка Lampa
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v2) return;
    window.captions_fix_plugin_v2 = true;
    
    console.log("[Captions Fix v2] Плагин запущен");
    
    function CaptionsFix() {
        var self = this;
        self.initialized = false;
        self.styleElement = null;
        self.observer = null;
        self.urlObserver = null;
        self.lastSection = "";
        self.isActorPage = false;
        self.lastURL = window.location.href;
        
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
            'search': ['поиск', 'search', 'искан', 'find'],
            'actor': ['актер', 'актёр', 'actor', 'персона', 'person']
        };
        
        // Признаки страницы актёра/режиссёра в URL
        self.ACTOR_URL_PATTERNS = [
            'component=actor',
            'component=person',
            'job=acting',
            'job=directing',
            'type=actor',
            'type=person',
            'view=actor',
            'view=person',
            '/actor/',
            '/person/'
        ];
        
        // Инициализация БЕЗ ЗАДЕРЖКИ
        self.init = function() {
            if (self.initialized) return;
            
            console.log("[Captions Fix v2] Инициализация...");
            
            // Мгновенная проверка DOM
            if (!document.body) {
                // Используем microtask вместо setTimeout
                Promise.resolve().then(self.init);
                return;
            }
            
            // ВСЕ ОПЕРАЦИИ БЕЗ ЗАДЕРЖЕК
            self.checkIfActorPage();
            self.addStyles();
            self.startObserver();
            self.setupURLWatcher();
            self.checkAndUpdate();
            
            self.initialized = true;
            console.log("[Captions Fix v2] Инициализирован");
        };
        
        // Проверка является ли текущая страница страницей актёра/режиссёра
        self.checkIfActorPage = function() {
            self.isActorPage = false;
            
            // Проверяем URL мгновенно
            var currentUrl = window.location.href.toLowerCase();
            var currentHash = window.location.hash.toLowerCase();
            
            // Быстрая проверка по URL
            for (var i = 0; i < self.ACTOR_URL_PATTERNS.length; i++) {
                if (currentUrl.includes(self.ACTOR_URL_PATTERNS[i]) || 
                    currentHash.includes(self.ACTOR_URL_PATTERNS[i])) {
                    self.isActorPage = true;
                    return true;
                }
            }
            
            // Быстрая проверка по DOM если доступно
            if (document.querySelector) {
                // Быстрый поиск по ключевым классам
                var quickSelectors = '.actor-info, .person-info, [data-component="actor"], [data-component="person"]';
                if (document.querySelector(quickSelectors)) {
                    self.isActorPage = true;
                    return true;
                }
                
                // Проверка заголовка
                var title = document.querySelector('.head__title, h1');
                if (title) {
                    var text = title.textContent.toLowerCase();
                    if (text.includes('актер') || text.includes('актёр') || text.includes('actor')) {
                        self.isActorPage = true;
                        return true;
                    }
                }
            }
            
            return false;
        };
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА БЕЗ ЗАДЕРЖЕК
        self.getCurrentSection = function() {
            // ПРОВЕРКА СТРАНИЦЫ АКТЁРА ПЕРВЫМ ДЕЛОМ
            if (self.isActorPage) {
                return "actor";
            }
            
            // Быстрая проверка по URL
            var hash = window.location.hash.toLowerCase();
            if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное";
            if (hash.includes('history') || hash.includes('истори')) return "История";
            if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
            if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
            if (hash.includes('search') || hash.includes('поиск')) return "Поиск";
            if (hash.includes('actor') || hash.includes('актер') || hash.includes('актёр')) return "actor";
            
            // Проверка заголовка
            var headerTitle = document.querySelector('.head__title');
            if (headerTitle && headerTitle.textContent) {
                return headerTitle.textContent.trim();
            }
            
            return "";
        };
        
        // Определение типа раздела
        self.detectSectionType = function(sectionName) {
            if (!sectionName) return '';
            
            var name = sectionName.toLowerCase();
            
            // Проверяем страницу актёра
            if (self.isActorPage || name === 'actor' || name.includes('актер') || name.includes('актёр')) {
                return 'actor';
            }
            
            // Быстрая проверка по ключевым словам
            for (var type in self.SECTION_KEYWORDS) {
                var keywords = self.SECTION_KEYWORDS[type];
                for (var i = 0; i < keywords.length; i++) {
                    if (name.includes(keywords[i])) {
                        return type;
                    }
                }
            }
            
            return '';
        };
        
        // Проверка, нужно ли показывать названия
        self.shouldShowCaptions = function() {
            // На страницах актёров НЕ показываем названия
            if (self.isActorPage) {
                return false;
            }
            
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            return sectionType !== '' && sectionType !== 'actor';
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            if (self.isActorPage) {
                // СКРЫВАТЬ названия на странице актёра
                return `
                    /* Captions Fix v2 - Скрыть названия на странице актёра */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                    }
                `;
            } else if (self.shouldShowCaptions()) {
                // ПОКАЗЫВАТЬ в разрешённых разделах
                return `
                    /* Captions Fix v2 - Показать названия */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: block !important;
                    }
                `;
            } else {
                // СКРЫВАТЬ в остальных разделах
                return `
                    /* Captions Fix v2 - Скрыть названия */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                    }
                `;
            }
        };
        
        // Проверка и обновление БЕЗ ЗАДЕРЖКИ
        self.checkAndUpdate = function() {
            // Быстрая проверка изменений
            var currentSection = self.getCurrentSection();
            var wasActorPage = self.isActorPage;
            self.checkIfActorPage();
            
            if (currentSection !== self.lastSection || wasActorPage !== self.isActorPage) {
                self.lastSection = currentSection;
                self.addStyles();
                self.applyToCards();
            }
        };
        
        // Добавление/обновление стилей БЕЗ ЗАДЕРЖКИ
        self.addStyles = function() {
            var css = self.generateCSS();
            var styleId = "captions-fix-styles-v2";
            
            var oldStyle = document.getElementById(styleId);
            if (oldStyle) oldStyle.remove();
            
            var style = document.createElement("style");
            style.id = styleId;
            style.textContent = css;
            
            var head = document.head || document.getElementsByTagName('head')[0];
            if (head.firstChild) {
                head.insertBefore(style, head.firstChild);
            } else {
                head.appendChild(style);
            }
            
            self.styleElement = style;
        };
        
        // Применение к карточкам БЕЗ ЗАДЕРЖКИ
        self.applyToCards = function() {
            var shouldShow = self.shouldShowCaptions();
            var isActor = self.isActorPage;
            var cards = document.querySelectorAll('.card:not(.card--collection)');
            
            for (var i = 0; i < cards.length; i++) {
                var card = cards[i];
                var age = card.querySelector('.card__age');
                var title = card.querySelector('.card__title');
                
                if (age) age.style.display = (isActor || !shouldShow) ? 'none' : 'block';
                if (title) title.style.display = (isActor || !shouldShow) ? 'none' : 'block';
            }
        };
        
        // Наблюдатель за DOM БЕЗ ЗАДЕРЖЕК
        self.startObserver = function() {
            if (self.observer) return;
            
            self.observer = new MutationObserver(function(mutations) {
                // Быстрая проверка изменений
                for (var i = 0; i < mutations.length; i++) {
                    var mutation = mutations[i];
                    if (mutation.addedNodes.length > 0 || 
                        (mutation.target.classList && mutation.target.classList.contains('head__title')) ||
                        mutation.target === document.body) {
                        self.checkAndUpdate();
                        break;
                    }
                }
            });
            
            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true
            });
        };
        
        // Наблюдатель за URL БЕЗ ЗАДЕРЖЕК
        self.setupURLWatcher = function() {
            if (self.urlObserver) return;
            
            // 1. Перехват history API
            var originalPushState = history.pushState;
            var originalReplaceState = history.replaceState;
            
            history.pushState = function() {
                originalPushState.apply(this, arguments);
                self.lastURL = window.location.href;
                self.checkAndUpdate();
            };
            
            history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                self.lastURL = window.location.href;
                self.checkAndUpdate();
            };
            
            // 2. MutationObserver для изменений в body (URL может меняться через изменения DOM)
            self.urlObserver = new MutationObserver(function() {
                var currentURL = window.location.href;
                if (currentURL !== self.lastURL) {
                    self.lastURL = currentURL;
                    self.checkAndUpdate();
                }
            });
            
            self.urlObserver.observe(document.body, {
                childList: false,
                subtree: false,
                attributes: true,
                attributeFilter: ['href', 'src']
            });
            
            // 3. Событие hashchange
            window.addEventListener('hashchange', function() {
                self.lastURL = window.location.href;
                self.checkAndUpdate();
            }, false);
            
            // 4. Событие popstate
            window.addEventListener('popstate', function() {
                self.lastURL = window.location.href;
                self.checkAndUpdate();
            }, false);
        };
        
        // Дебаг функция
        self.debugInfo = function() {
            return {
                section: self.getCurrentSection(),
                isActorPage: self.isActorPage,
                shouldShow: self.shouldShowCaptions()
            };
        };
        
        // Очистка
        self.destroy = function() {
            if (self.observer) self.observer.disconnect();
            if (self.urlObserver) self.urlObserver.disconnect();
            if (self.styleElement) self.styleElement.remove();
            window.captions_fix_plugin_v2 = false;
        };
    }
    
    // Создаём и запускаем плагин БЕЗ ЗАДЕРЖКИ
    var plugin = new CaptionsFix();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            plugin.init();
        });
    } else {
        // Используем microtask для мгновенной инициализации
        Promise.resolve().then(function() {
            plugin.init();
        });
    }
    
    // Экспортируем плагин
    window.CaptionsFixPlugin = plugin;
    
})();
