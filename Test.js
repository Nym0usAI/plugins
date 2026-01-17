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
        self.lastUrl = window.location.href;
        self.lastState = {};
        
        // РАЗДЕЛЫ ГДЕ НАЗВАНИЯ ДОЛЖНЫ ПОКАЗЫВАТЬСЯ (ВСЕГДА)
        self.SHOW_IN_SECTIONS = [
            "Релизы", "Releases", "релизы", "releases",
            "Избранное", "Favorites", "избранное", "favorites", 
            "История", "History", "история", "history",
            "Торренты", "Torrents", "торренты", "torrents",
            "Поиск", "Search", "поиск", "search"
        ];
        
        // СТРАНИЦЫ ГДЕ НАЗВАНИЯ ДОЛЖНЫ СКРЫВАТЬСЯ
        self.HIDE_IN_PAGES = [
            "actor", "director", "person", "актер", "актёр", "режиссер", "режиссёр"
        ];
        
        // Инициализация
        self.init = function() {
            if (self.initialized) return;
            
            console.log("[Captions Fix v2] Инициализация...");
            
            if (!document.body) {
                requestAnimationFrame(self.init);
                return;
            }
            
            // Добавляем стили сразу
            self.addStyles();
            
            // Запускаем наблюдатель
            self.startObserver();
            
            // Первоначальная проверка
            self.checkAndUpdate();
            
            self.initialized = true;
            console.log("[Captions Fix v2] Инициализирован");
        };
        
        // Проверка, находимся ли на странице актёра/режиссёра
        self.isPersonPage = function() {
            try {
                // 1. Проверяем по URL (самый надёжный способ)
                var url = window.location.href.toLowerCase();
                
                // Если URL содержит явные признаки страницы актёра
                if (url.includes('component=actor') || 
                    url.includes('component=director') ||
                    url.includes('job=acting')) {
                    return true;
                }
                
                // 2. Проверяем по содержимому страницы
                var pageText = document.body.textContent.toLowerCase();
                var hasPersonKeywords = false;
                var hideKeywords = self.HIDE_IN_PAGES;
                
                for (var i = 0; i < hideKeywords.length; i++) {
                    if (pageText.includes(hideKeywords[i])) {
                        hasPersonKeywords = true;
                        break;
                    }
                }
                
                // 3. Но проверяем, что это не просто карточка фильма в разделе
                // Если есть заголовок одного из основных разделов - это не страница актёра
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) {
                    var title = headerTitle.textContent.toLowerCase();
                    var sectionKeywords = ['релизы', 'избранное', 'история', 'торренты', 'поиск', 'releases', 'favorites', 'history', 'torrents', 'search'];
                    
                    for (var j = 0; j < sectionKeywords.length; j++) {
                        if (title.includes(sectionKeywords[j])) {
                            // Мы находимся в основном разделе, даже если есть упоминание актёра
                            return false;
                        }
                    }
                }
                
                return hasPersonKeywords;
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки страницы актёра:", e);
                return false;
            }
        };
        
        // Проверка, находимся ли в основном разделе ГДЕ НАДО ПОКАЗЫВАТЬ названия
        self.isMainShowSection = function() {
            try {
                // 1. Проверяем заголовок
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) {
                    var title = headerTitle.textContent.trim();
                    
                    // Проверяем, совпадает ли заголовок с нашими разделами
                    for (var i = 0; i < self.SHOW_IN_SECTIONS.length; i++) {
                        if (title === self.SHOW_IN_SECTIONS[i] || 
                            title.includes(self.SHOW_IN_SECTIONS[i])) {
                            return true;
                        }
                    }
                }
                
                // 2. Проверяем URL на наличие признаков основных разделов
                var url = window.location.href.toLowerCase();
                
                var urlKeywords = [
                    'release', 'releases', 'релиз', 'релизы',
                    'favorite', 'favorites', 'избран', 'избранное',
                    'history', 'история', 'истори',
                    'torrent', 'torrents', 'торрент', 'торренты',
                    'search', 'поиск'
                ];
                
                for (var j = 0; j < urlKeywords.length; j++) {
                    if (url.includes(urlKeywords[j])) {
                        // Но проверяем, что это не страница актёра
                        if (!self.isPersonPage()) {
                            return true;
                        }
                    }
                }
                
                // 3. Проверяем наличие навигационных элементов
                var activeNav = document.querySelector('.navigation__item.active, .menu__item.active');
                if (activeNav && activeNav.textContent) {
                    var navText = activeNav.textContent.trim().toLowerCase();
                    
                    var navKeywords = [
                        'релизы', 'releases',
                        'избранное', 'favorites',
                        'история', 'history',
                        'торренты', 'torrents',
                        'поиск', 'search'
                    ];
                    
                    for (var k = 0; k < navKeywords.length; k++) {
                        if (navText.includes(navKeywords[k])) {
                            return true;
                        }
                    }
                }
                
                return false;
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки основного раздела:", e);
                return false;
            }
        };
        
        // Проверка, находимся ли на странице отдельного фильма (не в разделе)
        self.isSingleMoviePage = function() {
            try {
                // Проверяем структуру страницы фильма
                // У страниц фильмов обычно есть:
                // 1. Большой постер
                // 2. Описание
                // 3. Кнопки просмотра
                // 4. Нет списка карточек как в разделах
                
                var hasMovieStructure = false;
                
                // Проверяем наличие элементов страницы фильма
                var movieElements = [
                    '.movie__poster-large',
                    '.movie__description',
                    '.movie__watch-button',
                    '.movie__info',
                    '.player__container',
                    '[class*="movie-page"]',
                    '[class*="film-page"]'
                ];
                
                for (var i = 0; i < movieElements.length; i++) {
                    if (document.querySelector(movieElements[i])) {
                        hasMovieStructure = true;
                        break;
                    }
                }
                
                // Проверяем, что это не страница актёра
                if (hasMovieStructure && !self.isPersonPage()) {
                    // Проверяем, есть ли заголовок раздела
                    // Если есть - значит мы в разделе, просматривая фильм
                    var headerTitle = document.querySelector('.head__title');
                    if (headerTitle && headerTitle.textContent) {
                        var title = headerTitle.textContent.toLowerCase();
                        var sectionKeywords = ['релизы', 'избранное', 'история', 'торренты', 'поиск'];
                        
                        for (var j = 0; j < sectionKeywords.length; j++) {
                            if (title.includes(sectionKeywords[j])) {
                                // Мы в разделе, просматривая фильм - показываем названия
                                return false;
                            }
                        }
                    }
                    return true;
                }
                
                return false;
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки страницы фильма:", e);
                return false;
            }
        };
        
        // ОСНОВНАЯ ЛОГИКА: Когда показывать названия
        self.shouldShowCaptions = function() {
            try {
                // 1. Если это страница актёра - СКРЫВАЕМ
                if (self.isPersonPage()) {
                    console.log("[Captions Fix v2] Страница актёра - СКРЫВАЕМ названия");
                    return false;
                }
                
                // 2. Если это основной раздел (Релизы, Избранное и т.д.) - ПОКАЗЫВАЕМ
                if (self.isMainShowSection()) {
                    console.log("[Captions Fix v2] Основной раздел - ПОКАЗЫВАЕМ названия");
                    return true;
                }
                
                // 3. Если это страница отдельного фильма (не в разделе) - СКРЫВАЕМ
                if (self.isSingleMoviePage()) {
                    console.log("[Captions Fix v2] Страница фильма - СКРЫВАЕМ названия");
                    return false;
                }
                
                // 4. По умолчанию - СКРЫВАЕМ
                console.log("[Captions Fix v2] Неизвестная страница - СКРЫВАЕМ названия");
                return false;
                
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка определения:", e);
                return false;
            }
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            
            if (shouldShow) {
                // ПОКАЗЫВАТЬ названия в карточках
                return `
                    /* Captions Fix v2 - ПОКАЗЫВАТЬ названия */
                    .card:not(.card--collection) .card__age,
                    .card:not(.card--collection) .card__title {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    
                    /* Гарантируем, что стили применятся */
                    body.captions-fix-show .card:not(.card--collection) .card__age,
                    body.captions-fix-show .card:not(.card--collection) .card__title {
                        display: block !important;
                        opacity: 1 !important;
                    }
                `;
            } else {
                // СКРЫВАТЬ названия в карточках
                return `
                    /* Captions Fix v2 - СКРЫВАТЬ названия */
                    .card:not(.card--collection) .card__age,
                    .card:not(.card--collection) .card__title {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        overflow: hidden !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Гарантируем, что стили применятся */
                    body.captions-fix-hide .card:not(.card--collection) .card__age,
                    body.captions-fix-hide .card:not(.card--collection) .card__title {
                        display: none !important;
                        opacity: 0 !important;
                    }
                `;
            }
        };
        
        // Проверка и обновление
        self.checkAndUpdate = function() {
            try {
                var currentUrl = window.location.href;
                var shouldShow = self.shouldShowCaptions();
                
                // Если что-то изменилось
                if (currentUrl !== self.lastUrl || 
                    shouldShow !== self.lastState.shouldShow) {
                    
                    console.log("[Captions Fix v2] Обновление состояний...");
                    console.log("URL было:", self.lastUrl);
                    console.log("URL стало:", currentUrl);
                    console.log("Показывать было:", self.lastState.shouldShow);
                    console.log("Показывать стало:", shouldShow);
                    
                    self.lastUrl = currentUrl;
                    self.lastState = {
                        shouldShow: shouldShow,
                        isPersonPage: self.isPersonPage(),
                        isMainSection: self.isMainShowSection(),
                        isMoviePage: self.isSingleMoviePage()
                    };
                    
                    // Обновляем стили
                    self.addStyles();
                    
                    // Применяем к карточкам
                    self.applyToCards();
                    
                    // Добавляем классы для отладки
                    document.body.classList.remove('captions-fix-show', 'captions-fix-hide');
                    if (shouldShow) {
                        document.body.classList.add('captions-fix-show');
                    } else {
                        document.body.classList.add('captions-fix-hide');
                    }
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
            
            // Вставляем в head
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
                
                console.log("[Captions Fix v2] Применение к", cards.length, "карточкам");
                
                cards.forEach(function(card, index) {
                    var age = card.querySelector('.card__age');
                    var title = card.querySelector('.card__title');
                    
                    if (age) {
                        age.style.display = shouldShow ? 'block' : 'none';
                        age.style.opacity = shouldShow ? '1' : '0';
                        age.style.visibility = shouldShow ? 'visible' : 'hidden';
                        age.style.height = shouldShow ? 'auto' : '0';
                    }
                    
                    if (title) {
                        title.style.display = shouldShow ? 'block' : 'none';
                        title.style.opacity = shouldShow ? '1' : '0';
                        title.style.visibility = shouldShow ? 'visible' : 'hidden';
                        title.style.height = shouldShow ? 'auto' : '0';
                    }
                });
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка применения к карточкам:", e);
            }
        };
        
        // Наблюдатель за изменениями
        self.startObserver = function() {
            if (self.observer) return;
            
            var checkTimer = null;
            
            // Функция для отложенной проверки
            function scheduleCheck() {
                if (checkTimer) clearTimeout(checkTimer);
                checkTimer = setTimeout(function() {
                    self.checkAndUpdate();
                }, 100);
            }
            
            // Наблюдатель за DOM
            self.observer = new MutationObserver(function(mutations) {
                var shouldCheck = false;
                
                for (var i = 0; i < mutations.length; i++) {
                    var mutation = mutations[i];
                    
                    // Если меняется заголовок
                    if (mutation.target.classList && 
                        mutation.target.classList.contains('head__title')) {
                        shouldCheck = true;
                        break;
                    }
                    
                    // Если меняется активный элемент навигации
                    if (mutation.target.classList && (
                        mutation.target.classList.contains('navigation__item') ||
                        mutation.target.classList.contains('menu__item'))) {
                        shouldCheck = true;
                        break;
                    }
                    
                    // Если добавляются/удаляются карточки
                    if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                        shouldCheck = true;
                        break;
                    }
                    
                    // Если меняются классы body
                    if (mutation.target === document.body && mutation.attributeName === 'class') {
                        shouldCheck = true;
                        break;
                    }
                }
                
                if (shouldCheck) {
                    scheduleCheck();
                }
            });
            
            // Перехват History API
            var originalPushState = history.pushState;
            var originalReplaceState = history.replaceState;
            
            history.pushState = function() {
                originalPushState.apply(this, arguments);
                scheduleCheck();
            };
            
            history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                scheduleCheck();
            };
            
            // События
            window.addEventListener('hashchange', scheduleCheck);
            window.addEventListener('popstate', scheduleCheck);
            
            // Наблюдаем за изменениями
            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style'],
                characterData: true
            });
            
            // Также периодическая проверка (на случай, если что-то пропустили)
            setInterval(function() {
                self.checkAndUpdate();
            }, 2000);
        };
        
        // Дебаг информация
        self.debugInfo = function() {
            var info = {
                url: window.location.href,
                isPersonPage: self.isPersonPage(),
                isMainSection: self.isMainShowSection(),
                isMoviePage: self.isSingleMoviePage(),
                shouldShow: self.shouldShowCaptions(),
                headerTitle: document.querySelector('.head__title')?.textContent || 'нет заголовка'
            };
            
            console.log("=== Captions Fix Debug ===");
            console.log("URL:", info.url);
            console.log("Заголовок:", info.headerTitle);
            console.log("Страница актёра:", info.isPersonPage);
            console.log("Основной раздел:", info.isMainSection);
            console.log("Страница фильма:", info.isMoviePage);
            console.log("Показывать названия:", info.shouldShow);
            console.log("========================");
            
            return info;
        };
        
        // Ручное управление
        self.forceShow = function() {
            var css = `.card:not(.card--collection) .card__age,
                      .card:not(.card--collection) .card__title {
                          display: block !important;
                          opacity: 1 !important;
                      }`;
            
            var style = document.createElement('style');
            style.id = 'captions-force-show';
            style.textContent = css;
            document.head.appendChild(style);
            console.log("[Captions Fix] Принудительно показать названия");
        };
        
        self.forceHide = function() {
            var css = `.card:not(.card--collection) .card__age,
                      .card:not(.card--collection) .card__title {
                          display: none !important;
                          opacity: 0 !important;
                      }`;
            
            var style = document.createElement('style');
            style.id = 'captions-force-hide';
            style.textContent = css;
            document.head.appendChild(style);
            console.log("[Captions Fix] Принудительно скрыть названия");
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
    
    // Запускаем
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            plugin.init();
        });
    } else {
        plugin.init();
    }
    
    // Глобальные функции для дебага
    window.debugCaptions = function() {
        return plugin.debugInfo();
    };
    
    window.showCaptions = function() {
        plugin.forceShow();
    };
    
    window.hideCaptions = function() {
        plugin.forceHide();
    };
    
    window.CaptionsFixPlugin = plugin;
    
    // Экспорт для других плагинов
    if (typeof Lampa !== 'undefined' && Lampa.Plugins) {
        Lampa.Plugins.CaptionsFix = plugin;
    }
    
})();
