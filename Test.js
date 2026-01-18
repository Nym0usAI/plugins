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
            '/person/',
            'id=',
            '&job='
        ];
        
        // Инициализация
        self.init = function() {
            if (self.initialized) return;
            
            console.log("[Captions Fix v2] Инициализация...");
            
            // Мгновенная проверка DOM
            if (!document.body) {
                // Используем microtask вместо requestAnimationFrame
                (function checkDOM() {
                    if (document.body) {
                        self.continueInit();
                    } else {
                        setTimeout(checkDOM, 0);
                    }
                })();
                return;
            }
            
            self.continueInit();
        };
        
        self.continueInit = function() {
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
                            break;
                        }
                    }
                }
                
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки страницы персоны:", e);
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
                    if (section) return section;
                }
                
                // СПОСОБ 2: Из активной Activity Lampa
                if (Lampa.Activity && Lampa.Activity.active) {
                    try {
                        var activity = Lampa.Activity.active();
                        if (activity) {
                            if (activity.title) section = activity.title;
                            else if (activity.name) section = activity.name;
                            else if (activity.component && activity.component.title) {
                                section = activity.component.title;
                            }
                            if (section) return section;
                        }
                    } catch(e) {}
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
                        if (text && text.length < 50) {
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
            // На страницах актёров НЕ показываем названия
            if (self.isActorPage) {
                return false;
            }
            
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            
            // Если определили тип раздела - показываем
            return sectionType !== '' && sectionType !== 'actor';
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            
            if (self.isActorPage) {
                // СКРЫВАТЬ названия на странице актёра/режиссёра
                return `
                    /* Captions Fix v2 - СКРЫТЬ названия на странице актёра/режиссёра */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                    }
                `;
            } else if (shouldShow) {
                // ПОКАЗЫВАТЬ в текущем разделе
                return `
                    /* Captions Fix v2 - ПОКАЗЫВАТЬ названия в этом разделе */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: block !important;
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
        
        // Проверка и обновление
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
        
        // Применение к существующим карточкам
        self.applyToCards = function() {
            try {
                var shouldShow = self.shouldShowCaptions();
                var isActor = self.isActorPage;
                var cards = document.querySelectorAll('.card:not(.card--collection)');
                
                for (var i = 0; i < cards.length; i++) {
                    var card = cards[i];
                    var age = card.querySelector('.card__age');
                    var title = card.querySelector('.card__title');
                    
                    if (age) {
                        age.style.display = (isActor || !shouldShow) ? 'none' : 'block';
                    }
                    
                    if (title) {
                        title.style.display = (isActor || !shouldShow) ? 'none' : 'block';
                    }
                }
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка применения к карточкам:", e);
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
        
        // Наблюдатель за URL (БЕЗ requestAnimationFrame)
        self.setupURLWatcher = function() {
            // Перехватываем history API
            var originalPushState = history.pushState;
            var originalReplaceState = history.replaceState;
            
            history.pushState = function() {
                originalPushState.apply(this, arguments);
                self.lastURL = window.location.href;
                // Мгновенная проверка
                self.checkIfActorPage();
                self.checkAndUpdate();
            };
            
            history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                self.lastURL = window.location.href;
                // Мгновенная проверка
                self.checkIfActorPage();
                self.checkAndUpdate();
            };
            
            // Отслеживаем hashchange
            window.addEventListener('hashchange', function() {
                self.lastURL = window.location.href;
                // Мгновенная проверка
                self.checkIfActorPage();
                self.checkAndUpdate();
            }, false);
            
            // Отслеживаем popstate
            window.addEventListener('popstate', function() {
                self.lastURL = window.location.href;
                // Мгновенная проверка
                self.checkIfActorPage();
                self.checkAndUpdate();
            }, false);
            
            // Простой интервал для проверки URL изменений
            setInterval(function() {
                var currentURL = window.location.href;
                if (currentURL !== self.lastURL) {
                    self.lastURL = currentURL;
                    self.checkIfActorPage();
                    self.checkAndUpdate();
                }
            }, 100); // 100ms - достаточно быстро, но безопасно
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
        // Используем setTimeout 0 для асинхронного запуска
        setTimeout(function() {
            plugin.init();
        }, 0);
    }
    
    // Добавляем в глобальную область для дебага
    window.debugCaptions = function() {
        return plugin.debugInfo();
    };
    
    // Команды для ручного управления
    window.showCaptions = function() {
        plugin.forceShow();
    };
    
    window.hideCaptions = function() {
        plugin.forceHide();
    };
    
    // Экспортируем плагин
    window.CaptionsFixPlugin = plugin;
    
})();
