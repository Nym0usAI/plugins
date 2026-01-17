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
            'search': ['поиск', 'search', 'искан', 'find'],
            'actor': ['актер', 'актёр', 'actor', 'персона', 'person'] // Добавлено для актёров
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
            '/person/',
            'id=', // ID обычно есть на страницах персон
            '&job=' // Параметр job указывает на страницу персоны
        ];
        
        // Инициализация
        self.init = function() {
            if (self.initialized) return;
            
            console.log("[Captions Fix v2] Инициализация...");
            
            // Ждём загрузки DOM (без задержки, проверяем сразу)
            if (!document.body) {
                // Проверяем в следующем цикле event loop без setTimeout
                requestAnimationFrame(self.init);
                return;
            }
            
            // Проверяем страницу актёра при инициализации
            self.checkIfActorPage();
            
            // Добавляем стили сразу
            self.addStyles();
            
            // Запускаем наблюдатель
            self.startObserver();
            
            // Запускаем наблюдатель за URL
            self.setupURLWatcher();
            
            // ПЕРВОНАЧАЛЬНАЯ ПРОВЕРКА СРАЗУ
            self.checkAndUpdate();
            
            self.initialized = true;
            console.log("[Captions Fix v2] Инициализирован");
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
                        console.log("[Captions Fix v2] Найдена страница персоны по URL:", self.ACTOR_URL_PATTERNS[i]);
                        break;
                    }
                }
                
                // Дополнительная проверка по DOM
                if (!self.isActorPage) {
                    // Проверяем наличие элементов характерных для страницы персоны
                    var personElements = document.querySelectorAll(
                        '.actor-info, .person-info, .director-info, .profile-info, ' +
                        '[data-component="actor"], [data-component="person"], ' +
                        '.filmography, .credits, .works'
                    );
                    
                    if (personElements.length > 0) {
                        self.isActorPage = true;
                        console.log("[Captions Fix v2] Найдена страница персоны по DOM элементам");
                    }
                    
                    // Проверяем заголовки
                    var titles = document.querySelectorAll('.head__title, h1, .page-title');
                    for (var j = 0; j < titles.length; j++) {
                        var text = titles[j].textContent.toLowerCase();
                        if (text.includes('актер') || text.includes('актёр') || 
                            text.includes('actor') || text.includes('режиссёр') ||
                            text.includes('режиссер') || text.includes('director') ||
                            text.includes('продюсер') || text.includes('producer')) {
                            self.isActorPage = true;
                            console.log("[Captions Fix v2] Найдена страница персоны по заголовку:", text);
                            break;
                        }
                    }
                }
                
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки страницы персоны:", e);
            }
            
            return self.isActorPage;
        };
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА - 8 СПОСОБОВ (обновлено с учётом страниц актёров)
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
                    if (section) return section;
                }
                
                // СПОСОБ 2: Из активной Activity Lampa
                if (Lampa.Activity && Lampa.Activity.active) {
                    var activity = Lampa.Activity.active();
                    if (activity) {
                        // Проверяем разные свойства activity
                        if (activity.title) section = activity.title;
                        else if (activity.name) section = activity.name;
                        else if (activity.component && activity.component.title) {
                            section = activity.component.title;
                        }
                        if (section) return section;
                    }
                }
                
                // СПОСОБ 3: Из URL/hash
                var hash = window.location.hash.toLowerCase();
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное";
                if (hash.includes('history') || hash.includes('истори')) return "История";
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
                if (hash.includes('search') || hash.includes('поиск')) return "Поиск";
                if (hash.includes('actor') || hash.includes('актер') || hash.includes('актёр')) return "actor";
                if (hash.includes('component=actor') || hash.includes('component=person')) return "actor";
                
                // СПОСОБ 4: Из классов body
                var bodyClass = document.body.className.toLowerCase();
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное";
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История";
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты";
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы";
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск";
                if (bodyClass.includes('actor') || bodyClass.includes('актер')) return "actor";
                
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
                        if (text && text.length < 50) { // Не слишком длинные
                            section = text;
                            break;
                        }
                    }
                }
                
                // СПОСОБ 7: Из атрибутов data-*
                var dataSection = document.querySelector('[data-section], [data-page], [data-component]');
                if (dataSection) {
                    var attr = dataSection.getAttribute('data-section') || 
                               dataSection.getAttribute('data-page') ||
                               dataSection.getAttribute('data-component');
                    if (attr) return attr;
                }
                
                // СПОСОБ 8: По содержимому страницы
                var pageText = document.body.textContent || "";
                pageText = pageText.toLowerCase();
                
                if (pageText.includes('избранное') || pageText.includes('favorite')) return "Избранное";
                if (pageText.includes('история') || pageText.includes('history')) return "История";
                if (pageText.includes('торренты') || pageText.includes('torrent')) return "Торренты";
                if (pageText.includes('релизы') || pageText.includes('release')) return "Релизы";
                if (pageText.includes('поиск') || pageText.includes('search')) return "Поиск";
                if (pageText.includes('актер') || pageText.includes('актёр') || pageText.includes('actor')) return "actor";
                
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка определения раздела:", e);
            }
            
            return section || "";
        };
        
        // Определение типа раздела по ключевым словам (обновлено)
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
        
        // Проверка, нужно ли показывать названия в текущем разделе (обновлено)
        self.shouldShowCaptions = function() {
            // На страницах актёров НЕ показываем названия
            if (self.isActorPage) {
                console.log("[Captions Fix v2] Страница актёра - скрываем названия");
                return false;
            }
            
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            
            console.log("[Captions Fix v2] Раздел:", section, "Тип:", sectionType);
            
            // Если определили тип раздела - показываем
            return sectionType !== '' && sectionType !== 'actor';
        };
        
        // Генерация динамического CSS (обновлено)
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            
            if (self.isActorPage) {
                // СКРЫВАТЬ названия на странице актёра/режиссёра
                return `
                    /* Captions Fix v2 - СКРЫТЬ названия на странице актёра/режиссёра */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title,
                    body .card:not(.card--collection) .card__subtitle,
                    body .card:not(.card--collection) .card__caption,
                    body .card:not(.card--collection) .card__description,
                    body .card:not(.card--collection) .card__info,
                    body .card:not(.card--collection) .card__text {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Оптимизация отображения карточек без названий */
                    body .card:not(.card--collection) {
                        min-height: auto !important;
                    }
                    
                    body .card:not(.card--collection) .card__body {
                        padding: 0 !important;
                        min-height: 0 !important;
                    }
                `;
            } else if (shouldShow) {
                // ПОКАЗЫВАТЬ в текущем разделе
                return `
                    /* Captions Fix v2 - ПОКАЗЫВАТЬ названия в этом разделе */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                `;
            } else {
                // СКРЫВАТЬ в остальных разделах
                return `
                    /* Captions Fix v2 - СКРЫВАТЬ названия в этом разделе */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                    }
                `;
            }
        };
        
        // Проверка и обновление (обновлено)
        self.checkAndUpdate = function() {
            try {
                // Проверяем, не изменилась ли страница на страницу актёра
                var wasActorPage = self.isActorPage;
                self.checkIfActorPage();
                
                var currentSection = self.getCurrentSection();
                var sectionChanged = currentSection !== self.lastSection;
                var pageTypeChanged = wasActorPage !== self.isActorPage;
                
                // Если что-то изменилось
                if (sectionChanged || pageTypeChanged) {
                    console.log("[Captions Fix v2] Смена раздела:", 
                        "Была страница актёра:", wasActorPage, 
                        "Стала:", self.isActorPage,
                        "Раздел:", self.lastSection, "->", currentSection);
                    
                    self.lastSection = currentSection;
                    self.addStyles();
                    self.applyToCards();
                }
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки:", e);
            }
        };
        
        // Добавление/обновление стилей
        self.addStyles = function() {
            var css = self.generateCSS();
            var styleId = "captions-fix-styles-v2";
            
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
        
        // Применение к существующим карточкам (БЕЗ ЗАДЕРЖКИ, обновлено)
        self.applyToCards = function() {
            try {
                var shouldShow = self.shouldShowCaptions();
                var isActor = self.isActorPage;
                var cards = document.querySelectorAll('.card:not(.card--collection)');
                
                cards.forEach(function(card) {
                    var age = card.querySelector('.card__age');
                    var title = card.querySelector('.card__title');
                    
                    if (age) {
                        if (isActor) {
                            age.style.display = 'none';
                            age.style.opacity = '0';
                            age.style.visibility = 'hidden';
                        } else {
                            age.style.display = shouldShow ? 'block' : 'none';
                            age.style.opacity = shouldShow ? '1' : '0';
                        }
                    }
                    
                    if (title) {
                        if (isActor) {
                            title.style.display = 'none';
                            title.style.opacity = '0';
                            title.style.visibility = 'hidden';
                        } else {
                            title.style.display = shouldShow ? 'block' : 'none';
                            title.style.opacity = shouldShow ? '1' : '0';
                        }
                    }
                });
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка применения к карточкам:", e);
            }
        };
        
        // Наблюдатель за изменениями (БЕЗ ЗАДЕРЖЕК)
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
        
        // Наблюдатель за URL (БЕЗ ЗАДЕРЖЕК)
        self.setupURLWatcher = function() {
            var lastURL = window.location.href;
            
            // Используем MutationObserver для мгновенного отслеживания изменений
            var urlObserver = new MutationObserver(function() {
                var currentURL = window.location.href;
                if (currentURL !== lastURL) {
                    lastURL = currentURL;
                    
                    // Проверяем мгновенно, без задержки
                    requestAnimationFrame(function() {
                        var wasActorPage = self.isActorPage;
                        self.checkIfActorPage();
                        
                        if (wasActorPage !== self.isActorPage) {
                            console.log("[Captions Fix v2] URL изменился мгновенно, страница актёра:", self.isActorPage);
                            self.checkAndUpdate();
                        }
                    });
                }
            });
            
            // Наблюдаем за изменениями в body
            urlObserver.observe(document.body, {
                childList: false,
                subtree: false,
                attributes: false,
                characterData: false
            });
            
            // Перехватываем history API для мгновенного отслеживания
            var originalPushState = history.pushState;
            var originalReplaceState = history.replaceState;
            
            history.pushState = function() {
                originalPushState.apply(this, arguments);
                // Мгновенная проверка после pushState
                requestAnimationFrame(function() {
                    self.checkIfActorPage();
                    self.checkAndUpdate();
                });
            };
            
            history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                // Мгновенная проверка после replaceState
                requestAnimationFrame(function() {
                    self.checkIfActorPage();
                    self.checkAndUpdate();
                });
            };
            
            // Отслеживаем hashchange
            window.addEventListener('hashchange', function() {
                requestAnimationFrame(function() {
                    self.checkIfActorPage();
                    self.checkAndUpdate();
                });
            }, false);
        };
        
        // Дебаг функция - показывает текущий раздел
        self.debugInfo = function() {
            var section = self.getCurrentSection();
            var type = self.detectSectionType(section);
            var shouldShow = self.shouldShowCaptions();
            
            console.log("=== Captions Fix Debug ===");
            console.log("Раздел:", section);
            console.log("Тип:", type);
            console.log("Показывать названия:", shouldShow);
            console.log("Страница актёра:", self.isActorPage);
            console.log("Текущий CSS:", self.styleElement ? self.styleElement.textContent.substring(0, 200) + "..." : "нет");
            console.log("========================");
            
            return {
                section: section,
                type: type,
                shouldShow: shouldShow,
                isActorPage: self.isActorPage
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
            console.log("[Captions Fix v2] Остановлен");
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
    
    // Экспортируем плагин
    window.CaptionsFixPlugin = plugin;
    
})();
