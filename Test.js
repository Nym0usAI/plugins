(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v2) return;
    window.captions_fix_plugin_v2 = true;
    
    console.log("[Captions Fix v3] Плагин запущен");
    
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
            'search': ['поиск', 'search', 'искан', 'find', 'результат']
        };
        
        // Инициализация
        self.init = function() {
            if (self.initialized) return;
            
            console.log("[Captions Fix v3] Инициализация...");
            
            // Ждём загрузки DOM (без задержки, проверяем сразу)
            if (!document.body) {
                requestAnimationFrame(self.init);
                return;
            }
            
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
            console.log("[Captions Fix v3] Инициализирован");
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
                // ПРОВЕРКА ПОИСКА ПЕРВЫМ ДЕЛОМ
                var searchCheck = self.checkForSearch();
                if (searchCheck) {
                    console.log("[Captions Fix v3] Обнаружен поиск:", searchCheck);
                    return "Поиск";
                }
                
                // СПОСОБ 1: Из заголовка в шапке
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) {
                    section = headerTitle.textContent.trim();
                    if (section) {
                        console.log("[Captions Fix v3] Раздел из заголовка:", section);
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
                            console.log("[Captions Fix v3] Раздел из Activity:", section);
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
                    console.log("[Captions Fix v3] Раздел из hash (поиск):", hash);
                    return "Поиск";
                }
                
                // СПОСОБ 4: Из классов body
                var bodyClass = document.body.className.toLowerCase();
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное";
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История";
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты";
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы";
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) {
                    console.log("[Captions Fix v3] Раздел из body class (поиск):", bodyClass);
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
                    console.log("[Captions Fix v3] Раздел из текста страницы (поиск)");
                    return "Поиск";
                }
                
            } catch(e) {
                console.error("[Captions Fix v3] Ошибка определения раздела:", e);
            }
            
            return section || "";
        };
        
        // Специальная проверка для поиска
        self.checkForSearch = function() {
            try {
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
                    if (text.includes('результаты поиска') || text.includes('search results') || 
                        text.includes('найдено') || text.includes('found')) {
                        return "search_text";
                    }
                }
                
                // 5. Путь в URL
                if (window.location.pathname.includes('/search/') || 
                    window.location.search.includes('search=') ||
                    window.location.hash.includes('search')) {
                    return "search_url";
                }
                
                return false;
            } catch(e) {
                console.error("[Captions Fix v3] Ошибка проверки поиска:", e);
                return false;
            }
        };
        
        // Определение типа раздела по ключевым словам
        self.detectSectionType = function(sectionName) {
            if (!sectionName) return '';
            
            var name = sectionName.toLowerCase();
            
            // Проверяем по ключевым словам
            for (var type in self.SECTION_KEYWORDS) {
                var keywords = self.SECTION_KEYWORDS[type];
                for (var i = 0; i < keywords.length; i++) {
                    if (name.includes(keywords[i])) {
                        console.log("[Captions Fix v3] Тип по ключевому слову:", type);
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
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            
            console.log("[Captions Fix v3] Раздел:", section, "Тип:", sectionType, "Показывать:", sectionType !== '');
            
            // Если определили тип раздела - показываем
            return sectionType !== '';
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            
            if (shouldShow) {
                // ПОКАЗЫВАТЬ в текущем разделе
                return `
                    /* Captions Fix v3 - ПОКАЗЫВАТЬ названия в этом разделе */
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
                    /* Captions Fix v3 - СКРЫВАТЬ названия в этом разделе */
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
                var currentSection = self.getCurrentSection();
                
                // Если раздел изменился
                if (currentSection !== self.lastSection) {
                    console.log("[Captions Fix v3] Смена раздела:", self.lastSection, "->", currentSection);
                    self.lastSection = currentSection;
                    self.addStyles();
                    self.applyToCards();
                }
            } catch(e) {
                console.error("[Captions Fix v3] Ошибка проверки:", e);
            }
        };
        
        // Принудительное отображение для поиска
        self.forceShowInSearch = function() {
            console.log("[Captions Fix v3] Принудительное отображение для поиска");
            
            // Создаем принудительные стили
            var forcedStyleId = "captions-fix-search-forced";
            var oldStyle = document.getElementById(forcedStyleId);
            if (oldStyle) oldStyle.remove();
            
            var forcedCSS = `
                /* Captions Fix v3 - ПРИНУДИТЕЛЬНО для поиска */
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
            var styleId = "captions-fix-styles-v3";
            
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
        
        // Применение к существующим карточкам (БЕЗ ЗАДЕРЖКИ)
        self.applyToCards = function() {
            try {
                var shouldShow = self.shouldShowCaptions();
                var cards = document.querySelectorAll('.card:not(.card--collection)');
                
                console.log("[Captions Fix v3] Применение к карточкам:", cards.length, "показывать:", shouldShow);
                
                cards.forEach(function(card) {
                    var age = card.querySelector('.card__age');
                    var title = card.querySelector('.card__title');
                    
                    if (age) {
                        age.style.display = shouldShow ? 'block' : 'none';
                        age.style.opacity = shouldShow ? '1' : '0';
                        age.style.visibility = shouldShow ? 'visible' : 'hidden';
                    }
                    
                    if (title) {
                        title.style.display = shouldShow ? 'block' : 'none';
                        title.style.opacity = shouldShow ? '1' : '0';
                        title.style.visibility = shouldShow ? 'visible' : 'hidden';
                    }
                });
            } catch(e) {
                console.error("[Captions Fix v3] Ошибка применения к карточкам:", e);
            }
        };
        
        // Наблюдатель за изменениями (БЕЗ ЗАДЕРЖКИ)
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
                    
                    if (shouldCheck) break;
                }
                
                if (shouldCheck) {
                    // БЕЗ ЗАДЕРЖКИ!
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
            
            console.log("=== Captions Fix v3 Debug ===");
            console.log("Раздел:", section);
            console.log("Тип:", type);
            console.log("Показывать названия:", shouldShow);
            console.log("Проверка поиска:", self.checkForSearch());
            console.log("========================");
            
            return {
                section: section,
                type: type,
                shouldShow: shouldShow,
                searchCheck: self.checkForSearch()
            };
        };
        
        // Ручное управление
        self.forceShow = function() {
            document.body.classList.add('captions-force-show');
            self.applyToCards();
        };
        
        self.forceHide = function() {
            document.body.classList.add('captions-force-hide');
            self.applyToCards();
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
            console.log("[Captions Fix v3] Остановлен");
        };
    }
    
    // Создаём и запускаем плагин
    var plugin = new CaptionsFix();
    
    // Запускаем сразу БЕЗ ЗАДЕРЖКИ
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
    
    // Команды для ручного управления
    window.showCaptions = function() {
        plugin.forceShow();
        console.log("[Captions Fix] Принудительно показать названия");
    };
    
    window.hideCaptions = function() {
        plugin.forceHide();
        console.log("[Captions Fix] Принудительно скрыть названия");
    };
    
    // Принудительное отображение в поиске
    window.forceSearchCaptions = function() {
        plugin.forceShowInSearch();
        console.log("[Captions Fix] Принудительно показать названия в поиске");
    };
    
    // Экспортируем плагин
    window.CaptionsFixPlugin = plugin;
    
})();
