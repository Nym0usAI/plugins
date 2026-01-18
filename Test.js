(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v2) return;
    window.captions_fix_plugin_v2 = true;
    
    console.log("[Captions Fix v4] Плагин запущен");
    
    function CaptionsFix() {
        var self = this;
        self.initialized = false;
        self.styleElement = null;
        self.observer = null;
        self.lastSection = "";
        self.isActorPage = false;
        
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
            'search': ['поиск', 'search', 'искан', 'find', 'результат']
        };
        
        // Признаки страницы актёра/режиссёра
        self.ACTOR_SECTION_KEYWORDS = [
            'актер', 'актёр', 'actor', 'актриса', 'actress',
            'режиссёр', 'режиссер', 'director', 'режиссёр', 
            'сценарист', 'writer', 'продюсер', 'producer',
            'композитор', 'composer', 'оператор', 'cinematographer',
            'персона', 'person', 'исполнитель', 'исполнители'
        ];
        
        // Инициализация
        self.init = function() {
            if (self.initialized) return;
            
            console.log("[Captions Fix v4] Инициализация...");
            
            // Ждём загрузки DOM
            if (!document.body) {
                requestAnimationFrame(self.init);
                return;
            }
            
            // Проверяем страницу актёра
            self.checkIfActorPage();
            
            // Добавляем стили сразу
            self.addStyles();
            
            // Запускаем наблюдатель
            self.startObserver();
            
            // Дополнительный наблюдатель для поиска
            self.setupSearchWatcher();
            
            // ПЕРВОНАЧАЛЬНАЯ ПРОВЕРКА СРАЗУ
            self.checkAndUpdate();
            
            // Дополнительная проверка через небольшой интервал
            setTimeout(function() {
                self.checkAndUpdate();
                self.applyToCards();
            }, 300);
            
            self.initialized = true;
            console.log("[Captions Fix v4] Инициализирован");
        };
        
        // Проверка является ли текущая страница страницей актёра/режиссёра
        self.checkIfActorPage = function() {
            self.isActorPage = false;
            
            try {
                var currentUrl = window.location.href.toLowerCase();
                var currentHash = window.location.hash.toLowerCase();
                
                // 1. Проверка URL на наличие признаков страницы персоны
                var actorUrlPatterns = [
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
                
                for (var i = 0; i < actorUrlPatterns.length; i++) {
                    if (currentUrl.includes(actorUrlPatterns[i]) || 
                        currentHash.includes(actorUrlPatterns[i])) {
                        self.isActorPage = true;
                        console.log("[Captions Fix v4] Обнаружена страница персоны по URL:", actorUrlPatterns[i]);
                        break;
                    }
                }
                
                // 2. Проверка по заголовку
                if (!self.isActorPage) {
                    var headerTitle = document.querySelector('.head__title, h1, .page-title');
                    if (headerTitle && headerTitle.textContent) {
                        var titleText = headerTitle.textContent.toLowerCase();
                        for (var j = 0; j < self.ACTOR_SECTION_KEYWORDS.length; j++) {
                            if (titleText.includes(self.ACTOR_SECTION_KEYWORDS[j])) {
                                self.isActorPage = true;
                                console.log("[Captions Fix v4] Обнаружена страница персоны по заголовку:", self.ACTOR_SECTION_KEYWORDS[j]);
                                break;
                            }
                        }
                    }
                }
                
                // 3. Проверка по структуре DOM
                if (!self.isActorPage) {
                    var actorElements = document.querySelectorAll(
                        '.actor-info, .person-info, .director-info, .profile-info, ' +
                        '[data-component="actor"], [data-component="person"], ' +
                        '.filmography, .credits, .works, .person__content, ' +
                        '.actor__filmography, .person__filmography'
                    );
                    
                    if (actorElements.length > 0) {
                        self.isActorPage = true;
                        console.log("[Captions Fix v4] Обнаружена страница персоны по DOM элементам:", actorElements.length);
                    }
                }
                
                // 4. Проверка по тексту на странице
                if (!self.isActorPage) {
                    var pageText = document.body.textContent.toLowerCase();
                    var actorKeywordsFound = 0;
                    
                    for (var k = 0; k < self.ACTOR_SECTION_KEYWORDS.length; k++) {
                        if (pageText.includes(self.ACTOR_SECTION_KEYWORDS[k])) {
                            actorKeywordsFound++;
                            // Если найдено несколько ключевых слов - вероятно страница актёра
                            if (actorKeywordsFound > 2) {
                                self.isActorPage = true;
                                console.log("[Captions Fix v4] Обнаружена страница персоны по тексту (найдено ключевых слов:", actorKeywordsFound);
                                break;
                            }
                        }
                    }
                }
                
            } catch(e) {
                console.error("[Captions Fix v4] Ошибка проверки страницы персоны:", e);
            }
            
            return self.isActorPage;
        };
        
        // Наблюдатель специально для поиска
        self.setupSearchWatcher = function() {
            // Интервал для отслеживания поля поиска
            setInterval(function() {
                // Проверяем наличие поля поиска
                var searchInput = document.querySelector('input[type="search"], .search-field, [placeholder*="поиск"], [placeholder*="search"]');
                if (searchInput) {
                    var isFocused = document.activeElement === searchInput;
                    var hasValue = searchInput.value && searchInput.value.trim() !== '';
                    
                    if (isFocused || hasValue) {
                        // Если поле поиска активно или есть значение - принудительно показываем названия
                        self.forceShowInSearch();
                    }
                }
                
                // Проверяем наличие результатов поиска
                var searchResults = document.querySelector('.search-results, .search__results, [data-type="search"]');
                if (searchResults) {
                    self.forceShowInSearch();
                }
            }, 500);
        };
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА - улучшенная версия
        self.getCurrentSection = function() {
            var section = "";
            
            try {
                // ПРОВЕРКА СТРАНИЦЫ АКТЁРА ПЕРВЫМ ДЕЛОМ
                if (self.isActorPage) {
                    console.log("[Captions Fix v4] Страница актёра, пропускаем проверку разделов");
                    return "actor_page";
                }
                
                // ПРОВЕРКА ПОИСКА
                var searchCheck = self.checkForSearch();
                if (searchCheck) {
                    console.log("[Captions Fix v4] Обнаружен поиск:", searchCheck);
                    return "Поиск";
                }
                
                // СПОСОБ 1: Из заголовка в шапке
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) {
                    section = headerTitle.textContent.trim();
                    if (section) {
                        console.log("[Captions Fix v4] Раздел из заголовка:", section);
                        return section;
                    }
                }
                
                // СПОСОБ 2: Из активной Activity Lampa
                if (Lampa.Activity && Lampa.Activity.active) {
                    var activity = Lampa.Activity.active();
                    if (activity) {
                        if (activity.title) section = activity.title;
                        else if (activity.name) section = activity.name;
                        else if (activity.component && activity.component.title) {
                            section = activity.component.title;
                        }
                        if (section) {
                            console.log("[Captions Fix v4] Раздел из Activity:", section);
                            return section;
                        }
                    }
                }
                
                // СПОСОБ 3: Из URL/hash
                var hash = window.location.hash.toLowerCase();
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное";
                if (hash.includes('history') || hash.includes('истори')) return "История";
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
                if (hash.includes('search') || hash.includes('поиск')) {
                    console.log("[Captions Fix v4] Раздел из hash (поиск):", hash);
                    return "Поиск";
                }
                
                // СПОСОБ 4: Из классов body
                var bodyClass = document.body.className.toLowerCase();
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное";
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История";
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты";
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы";
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) {
                    console.log("[Captions Fix v4] Раздел из body class (поиск):", bodyClass);
                    return "Поиск";
                }
                
                // СПОСОБ 5: Из активного меню/навигации
                var activeNav = document.querySelector('.navigation__item.active, .menu__item.active');
                if (activeNav && activeNav.textContent) {
                    section = activeNav.textContent.trim();
                    if (section) return section;
                }
                
                // СПОСОБ 6: Из заголовков на странице
                var pageHeaders = document.querySelectorAll('h1, h2, .page-title, .section-title');
                for (var i = 0; i < pageHeaders.length; i++) {
                    if (pageHeaders[i].textContent && pageHeaders[i].offsetParent !== null) {
                        var text = pageHeaders[i].textContent.trim();
                        if (text && text.length < 50) {
                            section = text;
                            break;
                        }
                    }
                }
                
                // СПОСОБ 7: Из атрибутов data-*
                var dataSection = document.querySelector('[data-section], [data-page]');
                if (dataSection) {
                    var attr = dataSection.getAttribute('data-section') || 
                               dataSection.getAttribute('data-page');
                    if (attr) return attr;
                }
                
                // СПОСОБ 8: По содержимому страницы
                var pageText = document.body.textContent || "";
                pageText = pageText.toLowerCase();
                
                if (pageText.includes('избранное') || pageText.includes('favorite')) return "Избранное";
                if (pageText.includes('история') || pageText.includes('history')) return "История";
                if (pageText.includes('торренты') || pageText.includes('torrent')) return "Торренты";
                if (pageText.includes('релизы') || pageText.includes('release')) return "Релизы";
                if (pageText.includes('поиск') || pageText.includes('search') || pageText.includes('результаты поиска')) {
                    console.log("[Captions Fix v4] Раздел из текста страницы (поиск)");
                    return "Поиск";
                }
                
            } catch(e) {
                console.error("[Captions Fix v4] Ошибка определения раздела:", e);
            }
            
            return section || "";
        };
        
        // Специальная проверка для поиска
        self.checkForSearch = function() {
            try {
                // Сначала проверяем, не страница ли актёра
                if (self.isActorPage) return false;
                
                // 1. Поле поиска
                var searchInput = document.querySelector('input[type="search"], .search-field, .search-input');
                if (searchInput) {
                    return "search_input";
                }
                
                // 2. Кнопка поиска
                var searchButton = document.querySelector('.search-button, .search__button, [class*="search"] button');
                if (searchButton) {
                    return "search_button";
                }
                
                // 3. Результаты поиска
                var searchResults = document.querySelector('.search-results, .search__results, .results-container');
                if (searchResults) {
                    return "search_results";
                }
                
                // 4. Текст "Результаты поиска"
                var searchTextElements = document.querySelectorAll('div, h1, h2, h3, span, p');
                for (var i = 0; i < searchTextElements.length; i++) {
                    var text = searchTextElements[i].textContent.toLowerCase();
                    if ((text.includes('результаты поиска') || text.includes('search results') || 
                        text.includes('найдено') || text.includes('found')) &&
                        !self.isActorPage) { // Исключаем страницы актёров
                        return "search_text";
                    }
                }
                
                // 5. Путь в URL
                if ((window.location.pathname.includes('/search/') || 
                    window.location.search.includes('search=') ||
                    window.location.hash.includes('search')) &&
                    !self.isActorPage) { // Исключаем страницы актёров
                    return "search_url";
                }
                
                return false;
            } catch(e) {
                console.error("[Captions Fix v4] Ошибка проверки поиска:", e);
                return false;
            }
        };
        
        // Определение типа раздела по ключевым словам
        self.detectSectionType = function(sectionName) {
            if (!sectionName) return '';
            
            var name = sectionName.toLowerCase();
            
            // Если страница актёра - сразу возвращаем 'actor'
            if (self.isActorPage || name === 'actor_page') {
                return 'actor';
            }
            
            // Проверяем по ключевым словам
            for (var type in self.SECTION_KEYWORDS) {
                var keywords = self.SECTION_KEYWORDS[type];
                for (var i = 0; i < keywords.length; i++) {
                    if (name.includes(keywords[i])) {
                        console.log("[Captions Fix v4] Тип по ключевому слову:", type);
                        return type;
                    }
                }
            }
            
            // Прямое сравнение с нашими разделами
            var lowerSections = self.SHOW_IN_SECTIONS.map(function(s) {
                return s.toLowerCase();
            });
            
            for (var j = 0; j < lowerSections.length; j++) {
                if (name.includes(lowerSections[j]) || 
                    lowerSections[j].includes(name)) {
                    return self.SHOW_IN_SECTIONS[j].toLowerCase();
                }
            }
            
            return '';
        };
        
        // Проверка, нужно ли показывать названия в текущем разделе
        self.shouldShowCaptions = function() {
            // На страницах актёров НИКОГДА не показываем названия
            if (self.isActorPage) {
                console.log("[Captions Fix v4] Страница актёра - НЕ показывать названия");
                return false;
            }
            
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            
            console.log("[Captions Fix v4] Раздел:", section, "Тип:", sectionType, "Показывать:", sectionType !== '' && sectionType !== 'actor');
            
            // Если определили тип раздела и это не актёр - показываем
            return sectionType !== '' && sectionType !== 'actor';
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            
            if (self.isActorPage) {
                // СКРЫВАТЬ названия на странице актёра/режиссёра
                return `
                    /* Captions Fix v4 - СКРЫТЬ названия на странице актёра/режиссёра */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                    }
                    
                    /* Отключаем ховер-эффекты на странице актёра */
                    body .card:not(.card--collection):hover .card__title {
                        display: none !important;
                    }
                `;
            } else if (shouldShow) {
                // ПОКАЗЫВАТЬ в разрешённых разделах
                return `
                    /* Captions Fix v4 - ПОКАЗЫВАТЬ названия в этом разделе */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                        pointer-events: auto !important;
                    }
                    
                    /* Дополнительные селекторы для поиска */
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
                    
                    /* Для любых карточек в контейнерах поиска */
                    .search-results .card .card__title,
                    .search-results .card .card__age,
                    .search__results .card .card__title,
                    .search__results .card .card__age {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                `;
            } else {
                // СКРЫВАТЬ в остальных разделах
                return `
                    /* Captions Fix v4 - СКРЫВАТЬ названия в этом разделе */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                    }
                `;
            }
        };
        
        // Проверка и обновление
        self.checkAndUpdate = function() {
            try {
                // Проверяем страницу актёра каждый раз
                var wasActorPage = self.isActorPage;
                self.checkIfActorPage();
                
                var currentSection = self.getCurrentSection();
                var sectionChanged = currentSection !== self.lastSection;
                var actorPageChanged = wasActorPage !== self.isActorPage;
                
                // Если что-то изменилось
                if (sectionChanged || actorPageChanged) {
                    console.log("[Captions Fix v4] Изменение: раздел", self.lastSection, "->", currentSection, "actor page:", wasActorPage, "->", self.isActorPage);
                    self.lastSection = currentSection;
                    self.addStyles();
                    self.applyToCards();
                }
            } catch(e) {
                console.error("[Captions Fix v4] Ошибка проверки:", e);
            }
        };
        
        // Принудительное отображение для поиска
        self.forceShowInSearch = function() {
            console.log("[Captions Fix v4] Принудительное отображение для поиска");
            
            // Создаем принудительные стили
            var forcedStyleId = "captions-fix-search-forced";
            var oldStyle = document.getElementById(forcedStyleId);
            if (oldStyle) oldStyle.remove();
            
            var forcedCSS = `
                /* Captions Fix v4 - ПРИНУДИТЕЛЬНО для поиска */
                body .card .card__title,
                body .card .card__age {
                    display: block !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    pointer-events: auto !important;
                }
            `;
            
            var style = document.createElement("style");
            style.id = forcedStyleId;
            style.textContent = forcedCSS;
            
            var head = document.head || document.getElementsByTagName('head')[0];
            if (head.firstChild) {
                head.insertBefore(style, head.firstChild);
            } else {
                head.appendChild(style);
            }
            
            // Применяем к карточкам
            self.applyToCards();
        };
        
        // Добавление/обновление стилей
        self.addStyles = function() {
            var css = self.generateCSS();
            var styleId = "captions-fix-styles-v4";
            
            // Удаляем старый элемент
            var oldStyle = document.getElementById(styleId);
            if (oldStyle) oldStyle.remove();
            
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
                var cards = document.querySelectorAll('.card:not(.card--collection)');
                
                console.log("[Captions Fix v4] Применение к карточкам:", cards.length, "показывать:", shouldShow, "isActorPage:", self.isActorPage);
                
                cards.forEach(function(card) {
                    var age = card.querySelector('.card__age');
                    var title = card.querySelector('.card__title');
                    
                    if (age) {
                        age.style.display = (self.isActorPage || !shouldShow) ? 'none' : 'block';
                        age.style.opacity = (self.isActorPage || !shouldShow) ? '0' : '1';
                        age.style.visibility = (self.isActorPage || !shouldShow) ? 'hidden' : 'visible';
                    }
                    
                    if (title) {
                        title.style.display = (self.isActorPage || !shouldShow) ? 'none' : 'block';
                        title.style.opacity = (self.isActorPage || !shouldShow) ? '0' : '1';
                        title.style.visibility = (self.isActorPage || !shouldShow) ? 'hidden' : 'visible';
                    }
                });
            } catch(e) {
                console.error("[Captions Fix v4] Ошибка применения к карточкам:", e);
            }
        };
        
        // Наблюдатель за изменениями
        self.startObserver = function() {
            if (self.observer) return;
            
            self.observer = new MutationObserver(function(mutations) {
                var shouldCheck = false;
                
                for (var i = 0; i < mutations.length; i++) {
                    var mutation = mutations[i];
                    
                    // Если меняется текст в заголовке
                    if (mutation.target.classList && 
                        mutation.target.classList.contains('head__title')) {
                        shouldCheck = true;
                        break;
                    }
                    
                    // Если меняются классы body
                    if (mutation.target === document.body && 
                        mutation.attributeName === 'class') {
                        shouldCheck = true;
                        break;
                    }
                    
                    // Если добавляются карточки
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
                    
                    // Если меняется URL
                    if (mutation.target === window && mutation.attributeName === 'href') {
                        shouldCheck = true;
                        break;
                    }
                    
                    if (shouldCheck) break;
                }
                
                if (shouldCheck) {
                    self.checkAndUpdate();
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
        
        // Дебаг функция
        self.debugInfo = function() {
            var section = self.getCurrentSection();
            var type = self.detectSectionType(section);
            var shouldShow = self.shouldShowCaptions();
            
            console.log("=== Captions Fix v4 Debug ===");
            console.log("Раздел:", section);
            console.log("Тип:", type);
            console.log("Показывать названия:", shouldShow);
            console.log("Страница актёра:", self.isActorPage);
            console.log("Проверка поиска:", self.checkForSearch());
            console.log("========================");
            
            return {
                section: section,
                type: type,
                shouldShow: shouldShow,
                isActorPage: self.isActorPage,
                searchCheck: self.checkForSearch()
            };
        };
        
        // Очистка
        self.destroy = function() {
            if (self.observer) {
                self.observer.disconnect();
                self.observer = null;
            }
            if (self.styleElement) {
                self.styleElement.remove();
                self.styleElement = null;
            }
            window.captions_fix_plugin_v2 = false;
            console.log("[Captions Fix v4] Остановлен");
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
    
    // Принудительное отображение в поиске
    window.forceSearchCaptions = function() {
        plugin.forceShowInSearch();
        console.log("[Captions Fix] Принудительно показать названия в поиске");
    };
    
    // Экспортируем плагин
    window.CaptionsFixPlugin = plugin;
    
})();
