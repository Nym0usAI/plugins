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
        
        // РАЗДЕЛЫ ГДЕ НАЗВАНИЯ ДОЛЖНЫ ПОКАЗЫВАТЬСЯ
        self.SHOW_IN_SECTIONS = [
            "Релизы", "Releases", "релизы", "releases",
            "Избранное", "Favorites", "избранное", "favorites", 
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
                
                // Проверяем параметры URL
                if (url.includes('component=actor') || 
                    url.includes('component=director') ||
                    url.includes('job=acting') ||
                    url.includes('/person/') ||
                    url.includes('?id=')) {
                    
                    // Но проверяем, что это не просто страница с ID фильма
                    if (url.includes('component=actor') || 
                        url.includes('component=director') ||
                        url.includes('job=acting')) {
                        return true;
                    }
                    
                    // Дополнительная проверка по структуре страницы
                    var title = document.title.toLowerCase();
                    if (title.includes('актер') || 
                        title.includes('актёр') || 
                        title.includes('actor') ||
                        title.includes('режиссер') ||
                        title.includes('режиссёр') ||
                        title.includes('director')) {
                        return true;
                    }
                }
                
                // 2. Проверяем структуру DOM
                var pageContent = document.body.innerHTML.toLowerCase();
                if (pageContent.includes('фильмографи') || 
                    pageContent.includes('filmography') ||
                    pageContent.includes('биографи') ||
                    pageContent.includes('biography')) {
                    
                    // Проверяем, что это не обычная страница фильма
                    var commonSections = ['релизы', 'избранное', 'история', 'торренты', 'поиск'];
                    var hasSection = false;
                    for (var i = 0; i < commonSections.length; i++) {
                        if (pageContent.includes(commonSections[i])) {
                            hasSection = true;
                            break;
                        }
                    }
                    
                    if (!hasSection) {
                        return true;
                    }
                }
                
                // 3. Проверяем наличие элементов персоны
                var personElements = document.querySelectorAll([
                    '[class*="person"]',
                    '[class*="actor"]', 
                    '[class*="director"]',
                    '.person-info',
                    '.actor-info',
                    '.director-info',
                    '.person__name',
                    '.actor__name',
                    '.person__biography',
                    '.actor__biography'
                ].join(','));
                
                if (personElements.length > 0) {
                    // Проверяем, действительно ли это страница персоны
                    for (var i = 0; i < personElements.length; i++) {
                        var element = personElements[i];
                        var text = element.textContent.toLowerCase();
                        if (text && (text.includes('актер') || 
                                     text.includes('актёр') || 
                                     text.includes('actor') ||
                                     text.includes('родился') ||
                                     text.includes('рождения') ||
                                     text.includes('биография'))) {
                            return true;
                        }
                    }
                }
                
                return false;
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки страницы актёра:", e);
                return false;
            }
        };
        
        // Проверка, находимся ли в основном разделе
        self.isMainSection = function() {
            try {
                var sectionName = "";
                
                // Проверяем заголовок
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) {
                    sectionName = headerTitle.textContent.trim().toLowerCase();
                }
                
                // Проверяем основные разделы
                var mainSections = [
                    'релизы', 'releases',
                    'избранное', 'favorites',
                    'история', 'history',
                    'торренты', 'torrents',
                    'поиск', 'search'
                ];
                
                for (var i = 0; i < mainSections.length; i++) {
                    if (sectionName.includes(mainSections[i])) {
                        return true;
                    }
                }
                
                // Проверяем URL на наличие параметров основных разделов
                var url = window.location.href.toLowerCase();
                var urlParams = ['release', 'favorite', 'history', 'torrent', 'search'];
                for (var j = 0; j < urlParams.length; j++) {
                    if (url.includes(urlParams[j])) {
                        return true;
                    }
                }
                
                return false;
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки основного раздела:", e);
                return false;
            }
        };
        
        // Основная логика проверки
        self.shouldShowCaptions = function() {
            try {
                // 1. Если это страница актёра - СКРЫВАЕМ названия
                if (self.isPersonPage()) {
                    console.log("[Captions Fix v2] Страница актёра - скрываем названия");
                    return false;
                }
                
                // 2. Если это основной раздел - ПОКАЗЫВАЕМ названия
                if (self.isMainSection()) {
                    console.log("[Captions Fix v2] Основной раздел - показываем названия");
                    return true;
                }
                
                // 3. По умолчанию скрываем
                console.log("[Captions Fix v2] Неизвестный раздел - скрываем названия");
                return false;
                
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка определения показа названий:", e);
                return false;
            }
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            
            if (shouldShow) {
                // ПОКАЗЫВАТЬ в основных разделах
                return `
                    /* Captions Fix v2 - ПОКАЗЫВАТЬ названия в основных разделах */
                    .card:not(.card--collection) .card__age,
                    .card:not(.card--collection) .card__title {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                `;
            } else {
                // СКРЫВАТЬ на страницах актёров и других
                return `
                    /* Captions Fix v2 - СКРЫВАТЬ названия на страницах актёров */
                    .card:not(.card--collection) .card__age,
                    .card:not(.card--collection) .card__title {
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
                var currentUrl = window.location.href;
                
                // Если URL изменился или прошло больше 1 секунды
                if (currentUrl !== self.lastUrl) {
                    console.log("[Captions Fix v2] Смена URL:", self.lastUrl, "->", currentUrl);
                    self.lastUrl = currentUrl;
                    
                    // Обновляем стили
                    self.addStyles();
                    
                    // Применяем к карточкам
                    self.applyToCards();
                    
                    // Добавляем/удаляем класс для отладки
                    if (self.isPersonPage()) {
                        document.body.classList.add('captions-person-page');
                        document.body.classList.remove('captions-main-section');
                    } else if (self.isMainSection()) {
                        document.body.classList.add('captions-main-section');
                        document.body.classList.remove('captions-person-page');
                    } else {
                        document.body.classList.remove('captions-person-page', 'captions-main-section');
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
                
                cards.forEach(function(card) {
                    var age = card.querySelector('.card__age');
                    var title = card.querySelector('.card__title');
                    
                    if (age) {
                        age.style.display = shouldShow ? 'block' : 'none';
                        age.style.opacity = shouldShow ? '1' : '0';
                    }
                    
                    if (title) {
                        title.style.display = shouldShow ? 'block' : 'none';
                        title.style.opacity = shouldShow ? '1' : '0';
                    }
                });
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка применения к карточкам:", e);
            }
        };
        
        // Наблюдатель за изменениями
        self.startObserver = function() {
            if (self.observer) return;
            
            // Таймер для проверки URL
            var urlCheckTimer = null;
            
            self.observer = new MutationObserver(function() {
                // Откладываем проверку на 100мс, чтобы избежать частых вызовов
                if (urlCheckTimer) clearTimeout(urlCheckTimer);
                urlCheckTimer = setTimeout(function() {
                    self.checkAndUpdate();
                }, 100);
            });
            
            // Наблюдаем за изменениями URL через History API
            var originalPushState = history.pushState;
            var originalReplaceState = history.replaceState;
            
            history.pushState = function() {
                originalPushState.apply(this, arguments);
                setTimeout(function() {
                    self.checkAndUpdate();
                }, 50);
            };
            
            history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                setTimeout(function() {
                    self.checkAndUpdate();
                }, 50);
            };
            
            // Наблюдаем за изменениями в DOM
            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
            
            // Также отслеживаем события hashchange
            window.addEventListener('hashchange', function() {
                setTimeout(function() {
                    self.checkAndUpdate();
                }, 100);
            });
        };
        
        // Дебаг информация
        self.debugInfo = function() {
            var isPerson = self.isPersonPage();
            var isMain = self.isMainSection();
            var shouldShow = self.shouldShowCaptions();
            
            console.log("=== Captions Fix Debug ===");
            console.log("URL:", window.location.href);
            console.log("Страница актёра:", isPerson);
            console.log("Основной раздел:", isMain);
            console.log("Показывать названия:", shouldShow);
            console.log("========================");
            
            return {
                url: window.location.href,
                isPersonPage: isPerson,
                isMainSection: isMain,
                shouldShow: shouldShow
            };
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
    
    // Добавляем в глобальную область для дебага
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
    
})();
