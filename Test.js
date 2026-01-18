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
            
            // Добавляем стили сразу
            self.addStyles();
            
            // Запускаем наблюдатель
            self.startObserver();
            
            // ПЕРВОНАЧАЛЬНАЯ ПРОВЕРКА СРАЗУ
            self.checkAndUpdate();
            
            self.initialized = true;
            console.log("[Captions Fix v2] Инициализирован");
        };
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА - 8 СПОСОБОВ
        self.getCurrentSection = function() {
            var section = "";
            
            try {
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
                
                // СПОСОБ 4: Из классов body
                var bodyClass = document.body.className;
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное";
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История";
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты";
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы";
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск";
                
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
                if (pageText.includes('поиск') || pageText.includes('search')) return "Поиск";
                
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка определения раздела:", e);
            }
            
            return section || "";
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
            
            console.log("[Captions Fix v2] Раздел:", section, "Тип:", sectionType);
            
            // Если определили тип раздела - показываем
            return sectionType !== '';
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            
            if (shouldShow) {
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
        
        // Проверка и обновление
        self.checkAndUpdate = function() {
            try {
                var currentSection = self.getCurrentSection();
                
                // Если раздел изменился
                if (currentSection !== self.lastSection) {
                    console.log("[Captions Fix v2] Смена раздела:", self.lastSection, "->", currentSection);
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
        
        // Применение к существующим карточкам (БЕЗ ЗАДЕРЖКИ)
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
        
        // Дебаг функция - показывает текущий раздел
        self.debugInfo = function() {
            var section = self.getCurrentSection();
            var type = self.detectSectionType(section);
            var shouldShow = self.shouldShowCaptions();
            
            console.log("=== Captions Fix Debug ===");
            console.log("Раздел:", section);
            console.log("Тип:", type);
            console.log("Показывать названия:", shouldShow);
            console.log("Текущий CSS:", self.styleElement ? self.styleElement.textContent.substring(0, 200) + "..." : "нет");
            console.log("========================");
            
            return {
                section: section,
                type: type,
                shouldShow: shouldShow
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

    // ==============================================
// ДОПОЛНИТЕЛЬНАЯ ФИКСАЦИЯ ДЛЯ СТРАНИЦ АКТЁРОВ
// ==============================================

// 1. Функция проверки страницы актёра
function checkIfActorPage() {
    try {
        var url = window.location.href.toLowerCase();
        var hash = window.location.hash.toLowerCase();
        
        // Паттерны для поиска в URL
        var patterns = [
            'component=actor', 'component=person',
            'job=acting', 'job=directing', 'job=',
            'type=actor', 'type=person',
            'view=actor', 'view=person',
            '/actor/', '/person/',
            '&id=', '?id=', 'id='
        ];
        
        // Проверяем URL
        for (var i = 0; i < patterns.length; i++) {
            if (url.includes(patterns[i]) || hash.includes(patterns[i])) {
                console.log("[Actor Fix] ✅ Обнаружена страница актёра по URL:", patterns[i]);
                return true;
            }
        }
        
        // Проверяем заголовок
        var headers = [
            '.head__title', 'h1', '.page-title', 
            '.title', '.person__name', '.actor__name',
            '[class*="title"]', '[class*="header"]'
        ];
        
        for (var j = 0; j < headers.length; j++) {
            var header = document.querySelector(headers[j]);
            if (header && header.textContent) {
                var text = header.textContent.toLowerCase();
                var keywords = [
                    'актер', 'актёр', 'actor', 'актриса', 'actress',
                    'режиссёр', 'режиссер', 'director',
                    'сценарист', 'writer', 'продюсер', 'producer',
                    'композитор', 'composer', 'оператор', 'cinematographer'
                ];
                
                for (var k = 0; k < keywords.length; k++) {
                    if (text.includes(keywords[k])) {
                        console.log("[Actor Fix] ✅ Обнаружена страница актёра по заголовку:", keywords[k]);
                        return true;
                    }
                }
            }
        }
        
        // Проверяем DOM-элементы
        var actorElements = document.querySelectorAll(
            '.actor-info, .person-info, .director-info, ' +
            '.filmography, .credits, .works, ' +
            '[data-component="actor"], [data-component="person"], ' +
            '.person__content, .actor__content'
        );
        
        if (actorElements.length > 0) {
            console.log("[Actor Fix] ✅ Обнаружена страница актёра по DOM элементам:", actorElements.length);
            return true;
        }
        
        return false;
    } catch(e) {
        console.error("[Actor Fix] Ошибка проверки:", e);
        return false;
    }
}

// 2. Функция принудительного скрытия названий
function forceHideActorCaptions() {
    try {
        // Создаём стили с максимальным приоритетом
        var styleId = 'actor-captions-fix-force';
        var oldStyle = document.getElementById(styleId);
        if (oldStyle) oldStyle.remove();
        
        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Actor Fix - Принудительное скрытие */
            body .card .card__title,
            body .card .card__age,
            .card:not(.card--collection) .card__title,
            .card:not(.card--collection) .card__age,
            .filmography .card .card__title,
            .filmography .card .card__age,
            .credits .card .card__title,
            .credits .card .card__age {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
            
            /* Отключаем любые hover-эффекты */
            .card:hover .card__title,
            .card:hover .card__age {
                display: none !important;
            }
        `;
        
        // Вставляем в самое начало head для максимального приоритета
        var head = document.head || document.getElementsByTagName('head')[0];
        if (head.firstChild) {
            head.insertBefore(style, head.firstChild);
        } else {
            head.appendChild(style);
        }
        
        // Применяем к существующим карточкам
        var cards = document.querySelectorAll('.card');
        cards.forEach(function(card) {
            var title = card.querySelector('.card__title');
            var age = card.querySelector('.card__age');
            
            if (title) {
                title.style.display = 'none';
                title.style.opacity = '0';
                title.style.visibility = 'hidden';
            }
            if (age) {
                age.style.display = 'none';
                age.style.opacity = '0';
                age.style.visibility = 'hidden';
            }
        });
        
        console.log("[Actor Fix] 🎬 Названия принудительно скрыты");
        return true;
    } catch(e) {
        console.error("[Actor Fix] Ошибка скрытия:", e);
        return false;
    }
}

// 3. Визуальный индикатор для отладки
function createActorDebugIndicator() {
    try {
        var indicatorId = 'actor-fix-debug';
        var oldIndicator = document.getElementById(indicatorId);
        if (oldIndicator) oldIndicator.remove();
        
        var indicator = document.createElement('div');
        indicator.id = indicatorId;
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #ff4444;
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 999999;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            border: 2px solid white;
            display: none;
        `;
        
        document.body.appendChild(indicator);
        return indicator;
    } catch(e) {
        console.error("[Actor Fix] Ошибка создания индикатора:", e);
        return null;
    }
}

// 4. Главная функция проверки и применения
function applyActorFix() {
    var isActorPage = checkIfActorPage();
    
    if (isActorPage) {
        console.log("[Actor Fix] 🔴 Обнаружена страница актёра, применяю фикс...");
        forceHideActorCaptions();
        
        // Показываем индикатор
        var indicator = document.getElementById('actor-fix-debug') || createActorDebugIndicator();
        if (indicator) {
            indicator.style.display = 'block';
            indicator.innerHTML = `
                <div><strong>ACTOR FIX ACTIVE</strong></div>
                <div>🛑 Названия скрыты</div>
                <div>URL: ${window.location.href.substring(0, 40)}...</div>
                <div>Время: ${new Date().toLocaleTimeString()}</div>
            `;
            indicator.style.background = '#ff4444';
        }
        
        return true;
    } else {
        // Если не актёрская страница - скрываем индикатор
        var indicator = document.getElementById('actor-fix-debug');
        if (indicator) {
            indicator.style.display = 'none';
        }
        return false;
    }
}

// 5. Интеграция с вашим плагином
function integrateWithMainPlugin() {
    if (typeof CaptionsFixPlugin !== 'undefined') {
        // Добавляем методы в основной плагин
        CaptionsFixPlugin.checkIfActorPage = checkIfActorPage;
        CaptionsFixPlugin.forceHideActorCaptions = forceHideActorCaptions;
        CaptionsFixPlugin.applyActorFix = applyActorFix;
        
        console.log("[Actor Fix] ✅ Интегрировано с основным плагином");
        
        // Переопределяем shouldShowCaptions если нужно
        if (CaptionsFixPlugin.shouldShowCaptions) {
            var originalShouldShow = CaptionsFixPlugin.shouldShowCaptions;
            CaptionsFixPlugin.shouldShowCaptions = function() {
                if (checkIfActorPage()) {
                    console.log("[Actor Fix] Переопределение: страница актёра - не показывать");
                    return false;
                }
                return originalShouldShow.apply(this, arguments);
            };
        }
    }
}

// 6. Запуск с задержками для надёжности
function startActorFix() {
    console.log("[Actor Fix] 🚀 Запуск фикса для страниц актёров");
    
    // Создаём индикатор
    createActorDebugIndicator();
    
    // Интегрируем с основным плагином
    integrateWithMainPlugin();
    
    // Запускаем проверку несколько раз с задержками
    var checkAttempts = [
        500,   // 0.5 секунды
        1000,  // 1 секунда
        2000,  // 2 секунды
        3000,  // 3 секунды
        5000   // 5 секунд
    ];
    
    checkAttempts.forEach(function(delay, index) {
        setTimeout(function() {
            console.log(`[Actor Fix] Попытка ${index + 1} через ${delay}мс`);
            applyActorFix();
        }, delay);
    });
    
    // Наблюдатель за изменениями DOM
    var observer = new MutationObserver(function(mutations) {
        var shouldCheck = false;
        
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];
            
            // Если добавляются карточки
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (var j = 0; j < mutation.addedNodes.length; j++) {
                    var node = mutation.addedNodes[j];
                    if (node.nodeType === 1 && 
                       (node.classList.contains('card') || 
                        (node.querySelector && node.querySelector('.card')))) {
                        shouldCheck = true;
                        break;
                    }
                }
            }
            
            // Если меняется URL (hashchange)
            if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
                shouldCheck = true;
            }
        }
        
        if (shouldCheck) {
            setTimeout(applyActorFix, 100);
        }
    });
    
    // Начинаем наблюдение
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href', 'class']
    });
    
    // Наблюдатель за изменениями URL
    window.addEventListener('hashchange', function() {
        setTimeout(applyActorFix, 300);
    });
    
    // Интервал для периодической проверки
    setInterval(applyActorFix, 5000);
    
    console.log("[Actor Fix] ✅ Система активирована");
}

// 7. Запускаем после загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(startActorFix, 1000);
    });
} else {
    setTimeout(startActorFix, 1000);
}

// 8. Глобальные функции для ручного вызова
window.forceHideActorTitles = forceHideActorCaptions;
window.checkActorPage = checkIfActorPage;
window.reapplyActorFix = applyActorFix;

console.log("[Actor Fix] 📦 Модуль загружен, ожидание запуска...");

// ==============================================
// КОНЕЦ ДОПОЛНИТЕЛЬНОГО КОДА
// ==============================================
    
})();
