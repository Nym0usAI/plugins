(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v2) return;
    window.captions_fix_plugin_v2 = true;
    
    console.log("[Captions Fix v2.1] Плагин запущен");
    
    function CaptionsFix() {
        var self = this;
        self.initialized = false;
        self.styleElement = null;
        self.observer = null;
        self.lastSection = "";
        self.isActorPage = false;
        self.lastURL = window.location.href;
        
        // Разделы где названия ДОЛЖНЫ показываться
        self.SHOW_SECTIONS = {
            'releases': true,
            'favorites': true,
            'history': true,
            'torrents': true,
            'search': true,
            'actor': false, // НЕ показывать на странице актёра
            'person': false // НЕ показывать на странице персоны
        };
        
        // Ключевые слова для определения разделов
        self.SECTION_KEYWORDS = {
            'releases': ['релиз', 'release', 'новинк', 'последние', 'latest'],
            'favorites': ['избранн', 'favorit', 'закладк', 'bookmark', 'любим'],
            'history': ['истори', 'histor', 'просмотр', 'watch'],
            'torrents': ['торрент', 'torrent', 'загрузк', 'download'],
            'search': ['поиск', 'search', 'искан', 'find', 'найти'],
            'actor': ['актер', 'актёр', 'actor', 'персона', 'person', 'режиссёр', 'director', 'producer', 'продюсер']
        };
        
        // Признаки страницы актёра/режиссёра
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
            '/person/',
            'id=',
            '&job='
        ];
        
        // Инициализация
        self.init = function() {
            if (self.initialized) return;
            
            console.log("[Captions Fix v2.1] Инициализация...");
            
            // Проверяем готовность DOM
            if (!document.body) {
                setTimeout(function() {
                    self.init();
                }, 50);
                return;
            }
            
            self.continueInit();
        };
        
        self.continueInit = function() {
            // Проверяем страницу актёра
            self.checkIfActorPage();
            
            // Добавляем стили сразу
            self.addStyles();
            
            // Запускаем наблюдатель за DOM
            self.startObserver();
            
            // Запускаем наблюдатель за URL
            self.setupURLWatcher();
            
            // ПЕРВОНАЧАЛЬНАЯ ПРОВЕРКА СРАЗУ
            self.checkAndUpdate();
            
            // Применяем к уже существующим карточкам
            self.applyToCards();
            
            // Дополнительная проверка через небольшой интервал
            setTimeout(function() {
                self.checkAndUpdate();
                self.applyToCards();
            }, 500);
            
            self.initialized = true;
            console.log("[Captions Fix v2.1] Инициализирован");
        };
        
        // Проверка является ли текущая страница страницей актёра/режиссёра
        self.checkIfActorPage = function() {
            self.isActorPage = false;
            
            try {
                // Проверяем URL
                var currentUrl = window.location.href.toLowerCase();
                var currentHash = window.location.hash.toLowerCase();
                
                // Проверяем URL на наличие признаков страницы персоны
                for (var i = 0; i < self.ACTOR_URL_PATTERNS.length; i++) {
                    if (currentUrl.includes(self.ACTOR_URL_PATTERNS[i]) || 
                        currentHash.includes(self.ACTOR_URL_PATTERNS[i])) {
                        self.isActorPage = true;
                        console.log("[Captions Fix v2.1] Обнаружена страница персоны по URL");
                        break;
                    }
                }
                
                // Дополнительная проверка по DOM
                if (!self.isActorPage) {
                    // Проверяем наличие элементов характерных для страницы персоны
                    var personElements = document.querySelectorAll(
                        '.actor-info, .person-info, .director-info, .profile-info, ' +
                        '[data-component="actor"], [data-component="person"], ' +
                        '.filmography, .credits, .works, .person__content'
                    );
                    
                    if (personElements.length > 0) {
                        self.isActorPage = true;
                        console.log("[Captions Fix v2.1] Обнаружена страница персоны по DOM");
                    }
                    
                    // Проверяем заголовки
                    var titles = document.querySelectorAll('.head__title, h1, .page-title, .person__name');
                    for (var j = 0; j < titles.length; j++) {
                        var text = titles[j].textContent.toLowerCase();
                        if (text.includes('актер') || text.includes('актёр') || 
                            text.includes('actor') || text.includes('режиссёр') ||
                            text.includes('режиссер') || text.includes('director') ||
                            text.includes('продюсер') || text.includes('producer') ||
                            text.includes('person') || text.includes('персона')) {
                            self.isActorPage = true;
                            console.log("[Captions Fix v2.1] Обнаружена страница персоны по заголовку:", text);
                            break;
                        }
                    }
                }
                
            } catch(e) {
                console.error("[Captions Fix v2.1] Ошибка проверки страницы персоны:", e);
            }
            
            return self.isActorPage;
        };
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА
        self.getCurrentSection = function() {
            var section = "";
            
            try {
                // ПРОВЕРКА СТРАНИЦЫ АКТЁРА ПЕРВЫМ ДЕЛОМ
                if (self.isActorPage) {
                    return "actor";
                }
                
                // СПОСОБ 1: Из заголовка в шапке
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) {
                    section = headerTitle.textContent.trim();
                    if (section) {
                        console.log("[Captions Fix v2.1] Раздел из заголовка:", section);
                        return section;
                    }
                }
                
                // СПОСОБ 2: Из URL/hash
                var hash = window.location.hash.toLowerCase();
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное";
                if (hash.includes('history') || hash.includes('истори')) return "История";
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
                if (hash.includes('search') || hash.includes('поиск')) return "Поиск";
                if (hash.includes('actor') || hash.includes('актер') || hash.includes('актёр')) return "actor";
                if (hash.includes('component=actor') || hash.includes('component=person')) return "actor";
                
                // СПОСОБ 3: Из классов body
                var bodyClass = document.body.className.toLowerCase();
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное";
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История";
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты";
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы";
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск";
                if (bodyClass.includes('actor') || bodyClass.includes('актер')) return "actor";
                
                // СПОСОБ 4: Из содержимого страницы поиска
                var searchInput = document.querySelector('input[type="search"], input[placeholder*="поиск"], input[placeholder*="search"]');
                if (searchInput) {
                    console.log("[Captions Fix v2.1] Найден элемент поиска");
                    return "Поиск";
                }
                
                // СПОСОБ 5: По тексту на странице
                var pageText = document.body.textContent || "";
                pageText = pageText.toLowerCase();
                
                if (pageText.includes('избранное') || pageText.includes('favorite')) return "Избранное";
                if (pageText.includes('история') || pageText.includes('history')) return "История";
                if (pageText.includes('торренты') || pageText.includes('torrent')) return "Торренты";
                if (pageText.includes('релизы') || pageText.includes('release')) return "Релизы";
                if (pageText.includes('поиск') || pageText.includes('search') || pageText.includes('результаты поиска')) {
                    console.log("[Captions Fix v2.1] Раздел 'Поиск' найден по тексту");
                    return "Поиск";
                }
                
                // СПОСОБ 6: По структуре страницы
                var searchResults = document.querySelector('.search-results, .results-list, [data-type="search"]');
                if (searchResults) {
                    console.log("[Captions Fix v2.1] Найден контейнер результатов поиска");
                    return "Поиск";
                }
                
            } catch(e) {
                console.error("[Captions Fix v2.1] Ошибка определения раздела:", e);
            }
            
            console.log("[Captions Fix v2.1] Раздел не определен, возвращаем:", section);
            return section || "";
        };
        
        // Определение типа раздела по ключевым словам
        self.detectSectionType = function(sectionName) {
            if (!sectionName) return '';
            
            var name = sectionName.toLowerCase();
            
            // Проверяем страницу актёра
            if (self.isActorPage || name === 'actor' || name.includes('актер') || name.includes('актёр')) {
                return 'actor';
            }
            
            // Проверяем по ключевым словам
            for (var type in self.SECTION_KEYWORDS) {
                var keywords = self.SECTION_KEYWORDS[type];
                for (var i = 0; i < keywords.length; i++) {
                    if (name.includes(keywords[i])) {
                        console.log("[Captions Fix v2.1] Тип раздела по ключевым словам:", type, "из", name);
                        return type;
                    }
                }
            }
            
            // Прямое сравнение
            if (name.includes('поиск') || name.includes('search')) return 'search';
            if (name.includes('релиз') || name.includes('release')) return 'releases';
            if (name.includes('избран') || name.includes('favorite')) return 'favorites';
            if (name.includes('истори') || name.includes('history')) return 'history';
            if (name.includes('торрент') || name.includes('torrent')) return 'torrents';
            
            return '';
        };
        
        // Проверка, нужно ли показывать названия в текущем разделе
        self.shouldShowCaptions = function() {
            // На страницах актёров НЕ показываем названия
            if (self.isActorPage) {
                console.log("[Captions Fix v2.1] Страница актёра - НЕ показывать названия");
                return false;
            }
            
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            
            // Если это поиск - ОБЯЗАТЕЛЬНО показываем
            if (sectionType === 'search') {
                console.log("[Captions Fix v2.1] Раздел поиска - ПОКАЗЫВАТЬ названия");
                return true;
            }
            
            // Показываем в разрешённых разделах
            var shouldShow = self.SHOW_SECTIONS[sectionType] || false;
            
            console.log("[Captions Fix v2.1] Решение по показу названий:", {
                section: section,
                type: sectionType,
                shouldShow: shouldShow,
                isActorPage: self.isActorPage
            });
            
            return shouldShow;
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            
            if (self.isActorPage) {
                // СКРЫВАТЬ названия на странице актёра/режиссёра
                return `
                    /* Captions Fix v2.1 - СКРЫТЬ названия на странице актёра/режиссёра */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                    }
                    
                    /* Отключаем ховер-эффекты названий */
                    body .card:not(.card--collection):hover .card__title {
                        display: none !important;
                    }
                `;
            } else if (shouldShow) {
                // ПОКАЗЫВАТЬ в разрешённых разделах
                return `
                    /* Captions Fix v2.1 - ПОКАЗЫВАТЬ названия в этом разделе */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                    
                    /* Убедимся, что стили приоритетнее всех других */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: block !important;
                    }
                    
                    /* Особенно для поиска */
                    body.search .card .card__title,
                    body.search .card .card__age,
                    body[class*="search"] .card .card__title,
                    body[class*="search"] .card .card__age,
                    body[data-page*="search"] .card .card__title,
                    body[data-page*="search"] .card .card__age {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                `;
            } else {
                // СКРЫВАТЬ в остальных разделах
                return `
                    /* Captions Fix v2.1 - СКРЫВАТЬ названия в этом разделе */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                    }
                `;
            }
        };
        
        // Проверка и обновление
        self.checkAndUpdate = function() {
            try {
                // Проверяем, не изменилась ли страница на страницу актёра
                var wasActorPage = self.isActorPage;
                self.checkIfActorPage();
                
                var currentSection = self.getCurrentSection();
                var sectionChanged = currentSection !== self.lastSection;
                var pageTypeChanged = wasActorPage !== self.isActorPage;
                
                console.log("[Captions Fix v2.1] Проверка:", {
                    currentSection: currentSection,
                    lastSection: self.lastSection,
                    sectionChanged: sectionChanged,
                    isActorPage: self.isActorPage,
                    wasActorPage: wasActorPage,
                    pageTypeChanged: pageTypeChanged
                });
                
                // Если что-то изменилось или это поиск
                if (sectionChanged || pageTypeChanged || currentSection.toLowerCase().includes('search')) {
                    self.lastSection = currentSection;
                    self.addStyles();
                    self.applyToCards();
                    
                    // Особое внимание для страницы поиска
                    if (currentSection.toLowerCase().includes('search') || self.detectSectionType(currentSection) === 'search') {
                        console.log("[Captions Fix v2.1] Страница поиска обнаружена, применяем стили...");
                        // Принудительно показываем названия на поиске
                        var searchCSS = `
                            /* Принудительные стили для поиска */
                            body .card .card__title,
                            body .card .card__age {
                                display: block !important;
                                opacity: 1 !important;
                                visibility: visible !important;
                            }
                        `;
                        var style = document.createElement('style');
                        style.id = 'captions-fix-search-forced';
                        style.textContent = searchCSS;
                        document.head.appendChild(style);
                        
                        // Через 100ms повторно применяем для уверенности
                        setTimeout(function() {
                            self.applyToCards();
                        }, 100);
                    }
                }
            } catch(e) {
                console.error("[Captions Fix v2.1] Ошибка проверки:", e);
            }
        };
        
        // Добавление/обновление стилей
        self.addStyles = function() {
            var css = self.generateCSS();
            var styleId = "captions-fix-styles-v2";
            
            // Удаляем старый элемент
            var oldStyle = document.getElementById(styleId);
            if (oldStyle) oldStyle.remove();
            
            // Удаляем все наши стили
            var allStyles = document.querySelectorAll('style[id^="captions-fix"]');
            for (var i = 0; i < allStyles.length; i++) {
                allStyles[i].remove();
            }
            
            // Создаём новый
            var style = document.createElement("style");
            style.id = styleId;
            style.textContent = css;
            
            // Вставляем с максимальным приоритетом
            var head = document.head || document.getElementsByTagName('head')[0];
            if (head.firstChild) {
                head.insertBefore(style, head.firstChild);
            } else {
                head.appendChild(style);
            }
            
            self.styleElement = style;
        };
        
        // Применение к существующим карточкам
        self.applyToCards = function() {
            try {
                var shouldShow = self.shouldShowCaptions();
                var isActor = self.isActorPage;
                var cards = document.querySelectorAll('.card:not(.card--collection)');
                
                console.log("[Captions Fix v2.1] Применение к карточкам:", {
                    totalCards: cards.length,
                    shouldShow: shouldShow,
                    isActorPage: isActor
                });
                
                for (var i = 0; i < cards.length; i++) {
                    var card = cards[i];
                    var age = card.querySelector('.card__age');
                    var title = card.querySelector('.card__title');
                    
                    if (age) {
                        age.style.display = (isActor || !shouldShow) ? 'none' : 'block';
                        age.style.opacity = (isActor || !shouldShow) ? '0' : '1';
                        age.style.visibility = (isActor || !shouldShow) ? 'hidden' : 'visible';
                    }
                    
                    if (title) {
                        title.style.display = (isActor || !shouldShow) ? 'none' : 'block';
                        title.style.opacity = (isActor || !shouldShow) ? '0' : '1';
                        title.style.visibility = (isActor || !shouldShow) ? 'hidden' : 'visible';
                    }
                }
            } catch(e) {
                console.error("[Captions Fix v2.1] Ошибка применения к карточкам:", e);
            }
        };
        
        // Наблюдатель за изменениями DOM
        self.startObserver = function() {
            if (self.observer) return;
            
            self.observer = new MutationObserver(function(mutations) {
                var shouldCheck = false;
                
                for (var i = 0; i < mutations.length; i++) {
                    var mutation = mutations[i];
                    
                    // Если добавляются карточки - всегда проверяем
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        for (var j = 0; j < mutation.addedNodes.length; j++) {
                            var node = mutation.addedNodes[j];
                            if (node.nodeType === 1) {
                                if (node.classList && node.classList.contains('card')) {
                                    shouldCheck = true;
                                    break;
                                }
                                if (node.querySelector && node.querySelector('.card')) {
                                    shouldCheck = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Если меняется текст в заголовке
                    if (mutation.target.classList && 
                        mutation.target.classList.contains('head__title')) {
                        shouldCheck = true;
                    }
                    
                    // Если меняются классы body
                    if (mutation.target === document.body && 
                        mutation.attributeName === 'class') {
                        shouldCheck = true;
                    }
                    
                    // Особое внимание к поиску
                    if (mutation.target.matches && 
                       (mutation.target.matches('input[type="search"]') || 
                        mutation.target.matches('.search-field') ||
                        mutation.target.matches('.search-results'))) {
                        shouldCheck = true;
                    }
                    
                    if (shouldCheck) break;
                }
                
                if (shouldCheck) {
                    self.checkAndUpdate();
                    setTimeout(function() {
                        self.applyToCards();
                    }, 50);
                }
            });
            
            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['class']
            });
        };
        
        // Наблюдатель за URL
        self.setupURLWatcher = function() {
            // Перехватываем history API
            var originalPushState = history.pushState;
            var originalReplaceState = history.replaceState;
            
            history.pushState = function() {
                originalPushState.apply(this, arguments);
                self.lastURL = window.location.href;
                setTimeout(function() {
                    self.checkIfActorPage();
                    self.checkAndUpdate();
                    self.applyToCards();
                }, 100);
            };
            
            history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                self.lastURL = window.location.href;
                setTimeout(function() {
                    self.checkIfActorPage();
                    self.checkAndUpdate();
                    self.applyToCards();
                }, 100);
            };
            
            // Отслеживаем hashchange
            window.addEventListener('hashchange', function() {
                self.lastURL = window.location.href;
                setTimeout(function() {
                    self.checkIfActorPage();
                    self.checkAndUpdate();
                    self.applyToCards();
                }, 100);
            }, false);
            
            // Отслеживаем popstate
            window.addEventListener('popstate', function() {
                self.lastURL = window.location.href;
                setTimeout(function() {
                    self.checkIfActorPage();
                    self.checkAndUpdate();
                    self.applyToCards();
                }, 100);
            }, false);
            
            // Интервал для проверки URL изменений
            setInterval(function() {
                var currentURL = window.location.href;
                if (currentURL !== self.lastURL) {
                    self.lastURL = currentURL;
                    self.checkIfActorPage();
                    self.checkAndUpdate();
                    self.applyToCards();
                }
            }, 300);
        };
        
        // Ручное управление
        self.forceShowInSearch = function() {
            // Создаём принудительные стили для поиска
            var forcedCSS = `
                /* Принудительное отображение названий */
                body .card .card__title,
                body .card .card__age {
                    display: block !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                }
            `;
            var style = document.createElement('style');
            style.id = 'captions-fix-force-show';
            style.textContent = forcedCSS;
            document.head.appendChild(style);
            
            // Применяем ко всем карточкам
            self.applyToCards();
            console.log("[Captions Fix v2.1] Принудительное отображение названий активировано");
        };
        
        // Дебаг функция
        self.debugInfo = function() {
            var section = self.getCurrentSection();
            var type = self.detectSectionType(section);
            var shouldShow = self.shouldShowCaptions();
            
            return {
                section: section,
                type: type,
                shouldShow: shouldShow,
                isActorPage: self.isActorPage,
                currentURL: window.location.href,
                bodyClasses: document.body.className
            };
        };
        
        // Очистка
        self.destroy = function() {
            if (self.observer) {
                self.observer.disconnect();
                self.observer = null;
            }
            var allStyles = document.querySelectorAll('style[id^="captions-fix"]');
            for (var i = 0; i < allStyles.length; i++) {
                allStyles[i].remove();
            }
            window.captions_fix_plugin_v2 = false;
        };
    }
    
    // Создаём и запускаем плагин
    var plugin = new CaptionsFix();
    
    // Запускаем сразу
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            plugin.init();
        });
    } else {
        plugin.init();
    }
    
    // Добавляем в глобальную область для дебага
    window.debugCaptions = function() {
        return plugin.debugInfo();
    };
    
    // Команда для принудительного отображения в поиске
    window.forceShowInSearch = function() {
        plugin.forceShowInSearch();
    };
    
    // Экспортируем плагин
    window.CaptionsFixPlugin = plugin;
    
})();
