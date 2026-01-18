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
// ЭКСТРЕННЫЙ ФИКС ДЛЯ СКРЫТИЯ НАЗВАНИЙ
// ==============================================

(function EmergencyFix() {
    console.log("🚨 Активирую экстренный фикс...");
    
    // 1. Постоянный индикатор с кнопкой
    var emergencyIndicator = document.createElement('div');
    emergencyIndicator.id = 'emergency-fix-indicator';
    emergencyIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff0000, #ff4444);
        color: white;
        padding: 15px;
        border-radius: 10px;
        font-family: Arial;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 5px 20px rgba(255,0,0,0.5);
        border: 3px solid white;
        max-width: 350px;
        cursor: pointer;
        text-align: center;
    `;
    
    emergencyIndicator.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">🚨 НАЗВАНИЯ НЕ СКРЫТЫ</div>
        <div>Нажмите здесь для принудительного скрытия</div>
        <div style="font-size: 11px; margin-top: 8px; opacity: 0.8;">
            ${window.location.href.substring(0, 50)}...
        </div>
    `;
    
    document.body.appendChild(emergencyIndicator);
    
    // 2. Функция АТОМАРНОГО скрытия
    function atomicHideTitles() {
        console.log("⚛️ Atomic hide triggered");
        
        // СТРАТЕГИЯ 1: Удаление элементов напрямую
        var titles = document.querySelectorAll('.card__title, .card__age, [class*="title"], [class*="name"]');
        titles.forEach(function(el) {
            if (el.closest && el.closest('.card')) {
                el.style.cssText = 'display: none !important; opacity: 0 !important; visibility: hidden !important; height: 0 !important; width: 0 !important; overflow: hidden !important;';
            }
        });
        
        // СТРАТЕГИЯ 2: Стили с ядерным приоритетом
        var nuclearStyle = document.createElement('style');
        nuclearStyle.id = 'nuclear-hide-style';
        nuclearStyle.textContent = `
            /* ЯДЕРНЫЕ СТИЛИ - МАКСИМАЛЬНЫЙ ПРИОРИТЕТ */
            html body .card .card__title,
            html body .card .card__age,
            body .card .card__title,
            body .card .card__age,
            .card .card__title,
            .card .card__age,
            [class*="card"] [class*="title"],
            [class*="card"] [class*="age"],
            .filmography * .card__title,
            .filmography * .card__age,
            .credits * .card__title,
            .credits * .card__age,
            .works * .card__title,
            .works * .card__age {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 0 !important;
                line-height: 0 !important;
                overflow: hidden !important;
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                pointer-events: none !important;
                user-select: none !important;
                -webkit-user-select: none !important;
            }
            
            /* Уничтожаем контейнеры названий */
            .card__captions,
            .card__info,
            .card__text,
            [class*="caption"],
            [class*="info"] {
                display: none !important;
                height: 0 !important;
                opacity: 0 !important;
            }
            
            /* Отключаем все переходы и анимации */
            .card * {
                transition: none !important;
                animation: none !important;
            }
        `;
        
        // Вставляем в самое начало документа
        document.documentElement.insertBefore(nuclearStyle, document.documentElement.firstChild);
        
        // СТРАТЕГИЯ 3: Мутация DOM
        var cards = document.querySelectorAll('.card');
        cards.forEach(function(card, index) {
            // Удаляем через 10мс для каждого элемента
            setTimeout(function() {
                var title = card.querySelector('.card__title, [class*="title"]');
                var age = card.querySelector('.card__age, [class*="age"], [class*="year"]');
                
                if (title) {
                    title.remove();
                    console.log("🗑️ Удалён заголовок в карточке", index);
                }
                if (age) {
                    age.remove();
                    console.log("🗑️ Удалён год в карточке", index);
                }
                
                // Добавляем атрибут для отслеживания
                card.setAttribute('data-titles-removed', 'true');
            }, index * 10);
        });
        
        // СТРАТЕГИЯ 4: Observer для новых элементов
        var destroyObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) {
                            // Проверяем карточки
                            var cards = node.classList && node.classList.contains('card') 
                                ? [node] 
                                : node.querySelectorAll ? node.querySelectorAll('.card') : [];
                            
                            // Проверяем вложенные карточки
                            if (cards.length === 0 && node.querySelectorAll) {
                                cards = node.querySelectorAll('.card');
                            }
                            
                            cards.forEach(function(card) {
                                if (!card.hasAttribute('data-titles-removed')) {
                                    var title = card.querySelector('.card__title, [class*="title"]');
                                    var age = card.querySelector('.card__age, [class*="age"]');
                                    
                                    if (title) {
                                        title.style.cssText = 'display: none !important; opacity: 0 !important;';
                                        setTimeout(function() { title.remove(); }, 50);
                                    }
                                    if (age) {
                                        age.style.cssText = 'display: none !important; opacity: 0 !important;';
                                        setTimeout(function() { age.remove(); }, 50);
                                    }
                                    
                                    card.setAttribute('data-titles-removed', 'true');
                                }
                            });
                        }
                    });
                }
            });
        });
        
        destroyObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Обновляем индикатор
        emergencyIndicator.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">✅ НАЗВАНИЯ СКРЫТЫ</div>
            <div>Атомарный фикс активирован</div>
            <div style="font-size: 11px; margin-top: 8px; opacity: 0.8;">
                Скрыто: ${titles.length} элементов<br>
                Карточек: ${cards.length}
            </div>
        `;
        emergencyIndicator.style.background = 'linear-gradient(135deg, #00aa00, #44ff44)';
        
        console.log("✅ Atomic hide completed. Titles:", titles.length, "Cards:", cards.length);
    }
    
    // 3. Кнопка для ручного скрытия
    emergencyIndicator.addEventListener('click', function() {
        console.log("🖱️ Manual hide triggered by click");
        atomicHideTitles();
        
        // Меняем текст кнопки
        setTimeout(function() {
            emergencyIndicator.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px;">🔄 ОБНОВИТЬ СТРАНИЦУ</div>
                <div>Для полного сброса</div>
            `;
            emergencyIndicator.style.background = 'linear-gradient(135deg, #ffaa00, #ffcc44)';
            
            emergencyIndicator.onclick = function() {
                window.location.reload();
            };
        }, 2000);
    });
    
    // 4. Автозапуск через 2 секунды
    setTimeout(function() {
        // Проверяем, видны ли ещё названия
        var visibleTitles = document.querySelectorAll('.card__title:not([style*="display: none"]), .card__age:not([style*="display: none"])');
        
        if (visibleTitles.length > 0) {
            console.log("🕒 Auto-hide triggered, visible titles:", visibleTitles.length);
            atomicHideTitles();
        } else {
            emergencyIndicator.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px;">✅ ВСЁ ОК</div>
                <div>Названия скрыты</div>
            `;
            emergencyIndicator.style.background = 'linear-gradient(135deg, #00aa00, #44ff44)';
        }
    }, 2000);
    
    // 5. Проверка каждые 3 секунды
    setInterval(function() {
        var checkTitles = document.querySelectorAll('.card__title, .card__age');
        var visible = Array.from(checkTitles).filter(function(el) {
            var style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });
        
        if (visible.length > 0) {
            console.log("🔍 Found visible titles:", visible.length);
            atomicHideTitles();
        }
    }, 3000);
    
    console.log("🚨 Emergency fix deployed");
})();

// ==============================================
// КОНЕЦ ЭКСТРЕННОГО ФИКСА
// ==============================================
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
