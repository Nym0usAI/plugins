(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v3) return;
    window.captions_fix_plugin_v3 = true;
    
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
        
        // РАЗДЕЛЫ ГДЕ НАЗВАНИЯ ДОЛЖНЫ СКРЫВАТЬСЯ (даже если они в SHOW_IN_SECTIONS)
        self.HIDE_IN_SECTIONS = [
            "Подробности", "Details", "Информация", "Info", 
            "Биография", "Biography", "О персоне", "About",
            "Актер", "Actor", "Режиссер", "Director"
        ];
        
        // Ключевые слова для определения разделов
        self.SECTION_KEYWORDS = {
            'releases': ['релиз', 'release', 'новинк'],
            'favorites': ['избранн', 'favorit', 'закладк', 'bookmark'],
            'history': ['истори', 'histor', 'просмотр', 'watch'],
            'torrents': ['торрент', 'torrent', 'загрузк', 'download'],
            'search': ['поиск', 'search', 'искан', 'find'],
            'details': ['подробност', 'details', 'информац', 'info', 'биографи', 'biography', 'актер', 'actor', 'режиссер', 'director', 'персон', 'person', 'about']
        };
        
        // Инициализация
        self.init = function() {
            if (self.initialized) return;
            
            console.log("[Captions Fix v3] Инициализация...");
            
            // Ждём загрузки DOM
            if (!document.body) {
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
            console.log("[Captions Fix v3] Инициализирован");
        };
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА
        self.getCurrentSection = function() {
            var section = "";
            
            try {
                // СПОСОБ 1: Из заголовка в шапке
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) {
                    section = headerTitle.textContent.trim();
                    if (section) {
                        console.log("[Captions Fix] Найден заголовок:", section);
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
                            console.log("[Captions Fix] Найдена Activity:", section);
                            return section;
                        }
                    }
                }
                
                // СПОСОБ 3: Проверка на раздел "Подробности/Информация"
                // Ищем элементы характерные для страницы информации о персоне
                var personInfoElements = document.querySelectorAll('.person__info, .info__block, .details__section, [class*="info"], [class*="detail"]');
                if (personInfoElements.length > 0) {
                    // Проверяем есть ли дата рождения или другие признаки страницы персоны
                    var pageText = document.body.textContent || "";
                    if (pageText.includes('Дата рождения') || pageText.includes('Date of birth') || 
                        pageText.includes('Родился') || pageText.includes('Родилась') ||
                        pageText.includes('Актер') || pageText.includes('Actor') ||
                        pageText.includes('Режиссер') || pageText.includes('Director')) {
                        return "Подробности";
                    }
                }
                
                // СПОСОБ 4: Из URL/hash
                var hash = window.location.hash.toLowerCase();
                if (hash.includes('person') || hash.includes('актер') || hash.includes('режиссер') || hash.includes('details')) {
                    return "Подробности";
                }
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное";
                if (hash.includes('history') || hash.includes('истори')) return "История";
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты";
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы";
                if (hash.includes('search') || hash.includes('поиск')) return "Поиск";
                
                // СПОСОБ 5: Из классов body
                var bodyClass = document.body.className;
                if (bodyClass.includes('person') || bodyClass.includes('details') || bodyClass.includes('info')) {
                    return "Подробности";
                }
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное";
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История";
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты";
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы";
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск";
                
                // СПОСОБ 6: По содержимому страницы
                var pageText = document.body.textContent || "";
                pageText = pageText.toLowerCase();
                
                if (pageText.includes('дата рождения') || pageText.includes('date of birth') || 
                    pageText.includes('родился') || pageText.includes('родилась')) {
                    return "Подробности";
                }
                if (pageText.includes('избранное') || pageText.includes('favorite')) return "Избранное";
                if (pageText.includes('история') || pageText.includes('history')) return "История";
                if (pageText.includes('торренты') || pageText.includes('torrent')) return "Торренты";
                if (pageText.includes('релизы') || pageText.includes('release')) return "Релизы";
                if (pageText.includes('поиск') || pageText.includes('search')) return "Поиск";
                
            } catch(e) {
                console.error("[Captions Fix] Ошибка определения раздела:", e);
            }
            
            return section || "";
        };
        
        // Определение типа раздела по ключевым словам
        self.detectSectionType = function(sectionName) {
            if (!sectionName) return '';
            
            var name = sectionName.toLowerCase();
            
            // Сначала проверяем разделы где нужно СКРЫВАТЬ (приоритет выше)
            for (var i = 0; i < self.HIDE_IN_SECTIONS.length; i++) {
                var hideSection = self.HIDE_IN_SECTIONS[i].toLowerCase();
                if (name.includes(hideSection) || hideSection.includes(name)) {
                    return 'hide'; // специальный тип для разделов где скрываем
                }
            }
            
            // Затем проверяем разделы где нужно ПОКАЗЫВАТЬ
            for (var type in self.SECTION_KEYWORDS) {
                var keywords = self.SECTION_KEYWORDS[type];
                for (var j = 0; j < keywords.length; j++) {
                    if (name.includes(keywords[j])) {
                        return type;
                    }
                }
            }
            
            return '';
        };
        
        // Проверка, нужно ли показывать названия в текущем разделе
        self.shouldShowCaptions = function() {
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            
            console.log("[Captions Fix] Раздел:", section, "Тип:", sectionType);
            
            // Если это раздел где нужно скрывать - возвращаем false
            if (sectionType === 'hide') {
                return false;
            }
            
            // Иначе проверяем по обычной логике
            return sectionType !== '';
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            
            if (shouldShow) {
                // ПОКАЗЫВАТЬ в разрешенных разделах
                return `
                    /* Captions Fix v3 - ПОКАЗЫВАТЬ названия */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                `;
            } else {
                // СКРЫВАТЬ в остальных разделах (включая "Подробности")
                return `
                    /* Captions Fix v3 - СКРЫВАТЬ названия */
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
                var currentSection = self.getCurrentSection();
                
                // Если раздел изменился
                if (currentSection !== self.lastSection) {
                    console.log("[Captions Fix] Смена раздела:", self.lastSection, "->", currentSection);
                    self.lastSection = currentSection;
                    self.addStyles();
                    self.applyToCards();
                }
            } catch(e) {
                console.error("[Captions Fix] Ошибка проверки:", e);
            }
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
                console.error("[Captions Fix] Ошибка применения к карточкам:", e);
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
        
        // Дебаг функция
        self.debugInfo = function() {
            var section = self.getCurrentSection();
            var type = self.detectSectionType(section);
            var shouldShow = self.shouldShowCaptions();
            
            console.log("=== Captions Fix Debug ===");
            console.log("Раздел:", section);
            console.log("Тип:", type);
            console.log("Показывать названия:", shouldShow);
            console.log("========================");
            
            return {
                section: section,
                type: type,
                shouldShow: shouldShow
            };
        };
        
        // Деструктор
        self.destroy = function() {
            if (self.observer) {
                self.observer.disconnect();
                self.observer = null;
            }
            if (self.styleElement) {
                self.styleElement.remove();
                self.styleElement = null;
            }
            window.captions_fix_plugin_v3 = false;
            console.log("[Captions Fix v3] Остановлен");
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
    
    // Экспортируем плагин
    window.CaptionsFixPlugin = plugin;
    
})();
