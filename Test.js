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
        self.lastIsActorPage = false;
        
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
            'actors': ['актер', 'актёр', 'actor', 'исполнител', 'персонаж', 'person', 'starring']
        };
        
        // Ключевые слова для страниц актёров (которые будут СКРЫВАТЬ названия)
        self.ACTOR_PAGE_KEYWORDS = [
            'актер', 'актёр', 'actor', 'актриса', 'actress',
            'исполнител', 'персонаж', 'person', 'starring',
            'в ролях', 'cast', 'состав'
        ];
        
        // Дополнительные селекторы для страниц актёров (из скриншота)
        self.ACTOR_PAGE_SELECTORS = [
            '.person__block',            // Блоки на странице актёра
            '.person-filmography',       // Фильмография
            '.person-content',           // Контент страницы актёра
            '.person-details',           // Детали актёра
            '.person-credits',           // Кредиты актёра
            '.credits-wrapper',          // Обёртка кредитов
            '[data-page="person"]',      // Страница персонажа
            '[data-type="person"]',      // Тип персонаж
            '.card--person',             // Карточки в контексте персоны
            '.card-section',             // Секции с карточками
            '.compilation',              // Подборки
            '.credits-list',             // Список кредитов
            '.film-list',                // Список фильмов
            '.media-section'             // Медиа-секции
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
            
            // Добавляем стили сразу
            self.addStyles();
            
            // Запускаем наблюдатель
            self.startObserver();
            
            // ПЕРВОНАЧАЛЬНАЯ ПРОВЕРКА СРАЗУ
            self.checkAndUpdate();
            
            // Дополнительная проверка через 500мс на случай динамической загрузки
            setTimeout(function() {
                self.checkAndUpdate();
            }, 500);
            
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
                if (hash.includes('person') || hash.includes('актер') || hash.includes('actor')) return "Актёр";
                
                // СПОСОБ 4: Из классов body
                var bodyClass = document.body.className;
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное";
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История";
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты";
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы";
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск";
                if (bodyClass.includes('person') || bodyClass.includes('actor')) return "Актёр";
                
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
                if (pageText.includes('актер') || pageText.includes('actor') || pageText.includes('актриса')) return "Актёр";
                
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка определения раздела:", e);
            }
            
            return section || "";
        };
        
        // Проверка, является ли страница страницей актёра
        self.isActorPage = function() {
            try {
                var section = self.getCurrentSection();
                var sectionLower = section.toLowerCase();
                
                // 1. Проверка по ключевым словам в названии раздела
                for (var i = 0; i < self.ACTOR_PAGE_KEYWORDS.length; i++) {
                    if (sectionLower.includes(self.ACTOR_PAGE_KEYWORDS[i])) {
                        console.log("[Captions Fix v2] Определена страница актёра по названию:", section);
                        return true;
                    }
                }
                
                // 2. Проверка по структуре страницы (специфичные для актёров элементы)
                var actorElements = self.ACTOR_PAGE_SELECTORS.concat([
                    '.person-header',    // Шапка с информацией об актёре
                    '.actor-profile',    // Профиль актёра
                    '.person-info',      // Информация об актёре
                    '.biography',        // Биография
                    '[data-type="person"]', // Элементы с типом person
                    '.filmography',      // Фильмография
                    '.known-for',        // Известные работы
                    '.person-filmography', // Фильмография персоны
                    '.person-credits',   // Кредиты персоны
                    '.credits-wrapper',  // Обёртка кредитов
                    '.compilation',      // Подборки
                    '.credits-list'      // Список кредитов
                ]);
                
                for (var j = 0; j < actorElements.length; j++) {
                    if (document.querySelector(actorElements[j])) {
                        console.log("[Captions Fix v2] Найден элемент страницы актёра:", actorElements[j]);
                        return true;
                    }
                }
                
                // 3. Проверка по контенту страницы (из скриншота)
                var pageText = document.body.textContent || "";
                var pageTextLower = pageText.toLowerCase();
                
                // Проверяем наличие типичных для страницы актёра элементов
                var actorContentIndicators = [
                    /подписаться/i,              // Кнопка подписки
                    /фильмы\s*\(\d+\)/i,         // "Фильмы (64)"
                    /сериалы\s*\(\d+\)/i,        // "Сериалы (7)"
                    /остальное\s*\(\d+\)/i,      // "Остальное (9)"
                    /\d+\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s*\d{4}/i, // Дата рождения
                    /родился/i,                  // "Родился"
                    /биография/i,                // "Биография"
                    /место рождения/i,           // "Место рождения"
                    /в ролях/i,                  // "В ролях"
                    /filmography/i               // "Фильмография"
                ];
                
                var actorContentCount = 0;
                for (var k = 0; k < actorContentIndicators.length; k++) {
                    if (actorContentIndicators[k].test(pageText)) {
                        actorContentCount++;
                    }
                }
                
                // Если найдено несколько индикаторов и есть карточки
                if (actorContentCount >= 2 && document.querySelector('.card')) {
                    console.log("[Captions Fix v2] Определена страница актёра по контенту (индикаторов:", actorContentCount + ")");
                    return true;
                }
                
                // 4. Проверка URL (дополнительная проверка)
                var url = window.location.href.toLowerCase();
                if (url.includes('/person/') || url.includes('/actor/') || url.includes('/актер/')) {
                    console.log("[Captions Fix v2] Определена страница актёра по URL");
                    return true;
                }
                
                // 5. Проверка по наличию блоков с фильмами/сериалами на актёра
                var hasFilmSections = false;
                var sections = document.querySelectorAll('h2, h3, .section-title, .block__title');
                for (var l = 0; l < sections.length; l++) {
                    var sectionText = (sections[l].textContent || '').toLowerCase();
                    if ((sectionText.includes('фильм') || sectionText.includes('сериал') || sectionText.includes('сезон')) && 
                        sectionText.includes('(') && sectionText.includes(')')) {
                        hasFilmSections = true;
                        break;
                    }
                }
                
                if (hasFilmSections && document.querySelector('.card')) {
                    console.log("[Captions Fix v2] Определена страница актёра по структуре секций");
                    return true;
                }
                
            } catch(e) {
                console.error("[Captions Fix v2] Ошибка проверки страницы актёра:", e);
            }
            
            return false;
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
            // Сначала проверяем, не страница ли актёра
            var isActorPage = self.isActorPage();
            
            if (isActorPage) {
                console.log("[Captions Fix v2] Страница актёра - скрываем названия");
                return false;
            }
            
            // Если не страница актёра, проверяем раздел как обычно
            var section = self.getCurrentSection();
            var sectionType = self.detectSectionType(section);
            
            console.log("[Captions Fix v2] Раздел:", section, "Тип:", sectionType, "Страница актёра:", isActorPage);
            
            // Если определили тип раздела - показываем
            return sectionType !== '';
        };
        
        // Генерация динамического CSS
        self.generateCSS = function() {
            var shouldShow = self.shouldShowCaptions();
            var isActorPage = self.isActorPage();
            
            if (shouldShow && !isActorPage) {
                // ПОКАЗЫВАТЬ в разрешённых разделах (но не на страницах актёров)
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
                // СКРЫВАТЬ на страницах актёров и в других разделах
                return `
                    /* Captions Fix v2 - СКРЫВАТЬ названия (страница актёра или другой раздел) */
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                    }
                    
                    /* Усиленные селекторы для страниц актёров - СКРЫТЬ ВСЁ */
                    body .card .card__age,
                    body .card .card__title,
                    body .card .card__info,
                    body .card .card__subtitle,
                    body .card .card__description,
                    body .card span,
                    body .card div {
                        display: none !important;
                    }
                    
                    /* Показываем только изображение в карточке на странице актёра */
                    body .card .card__poster,
                    body .card .card__image,
                    body .card img {
                        display: block !important;
                        visibility: visible !important;
                    }
                    
                    /* Специфичные селекторы для страниц актёров */
                    ${self.ACTOR_PAGE_SELECTORS.map(function(selector) {
                        return selector + ' .card__age,\n' +
                               selector + ' .card__title,\n' +
                               selector + ' .card__info,\n' +
                               selector + ' .card__subtitle {\n' +
                               '    display: none !important;\n' +
                               '}\n';
                    }).join('')}
                `;
            }
        };
        
        // Проверка и обновление
        self.checkAndUpdate = function() {
            try {
                var currentSection = self.getCurrentSection();
                var currentIsActorPage = self.isActorPage();
                
                // Если раздел изменился ИЛИ статус страницы актёра изменился
                if (currentSection !== self.lastSection || currentIsActorPage !== self.lastIsActorPage) {
                    console.log("[Captions Fix v2] Изменение состояния:", 
                        "Раздел:", self.lastSection, "->", currentSection,
                        "Страница актёра:", self.lastIsActorPage, "->", currentIsActorPage);
                    
                    self.lastSection = currentSection;
                    self.lastIsActorPage = currentIsActorPage;
                    self.addStyles();
                    self.applyToCards();
                }
                
                // Всегда применяем к карточкам на странице актёра (дополнительная проверка)
                if (currentIsActorPage) {
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
                var isActorPage = self.isActorPage();
                
                // Получаем ВСЕ карточки на странице
                var cards = document.querySelectorAll('.card');
                
                cards.forEach(function(card) {
                    // Пропускаем коллекции если нужно
                    if (card.classList.contains('card--collection') && !isActorPage) {
                        return;
                    }
                    
                    var age = card.querySelector('.card__age');
                    var title = card.querySelector('.card__title');
                    var info = card.querySelector('.card__info');
                    var subtitle = card.querySelector('.card__subtitle');
                    
                    // Если это страница актёра - СКРЫВАЕМ ВСЕ текстовые элементы
                    if (isActorPage) {
                        // Скрываем все возможные текстовые элементы
                        if (age) {
                            age.style.display = 'none';
                            age.style.opacity = '0';
                            age.style.visibility = 'hidden';
                        }
                        if (title) {
                            title.style.display = 'none';
                            title.style.opacity = '0';
                            title.style.visibility = 'hidden';
                        }
                        if (info) {
                            info.style.display = 'none';
                            info.style.opacity = '0';
                            info.style.visibility = 'hidden';
                        }
                        if (subtitle) {
                            subtitle.style.display = 'none';
                            subtitle.style.opacity = '0';
                            subtitle.style.visibility = 'hidden';
                        }
                        
                        // Дополнительно: скрываем все span и div внутри карточки кроме изображений
                        var textElements = card.querySelectorAll('span, div:not(.card__poster):not(.card__image)');
                        for (var i = 0; i < textElements.length; i++) {
                            var elem = textElements[i];
                            // Проверяем, содержит ли элемент текст
                            if (elem.textContent && elem.textContent.trim() && 
                                !elem.classList.contains('card__poster') &&
                                !elem.classList.contains('card__image')) {
                                elem.style.display = 'none';
                                elem.style.opacity = '0';
                                elem.style.visibility = 'hidden';
                            }
                        }
                    } else {
                        // Обычные карточки
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
                    }
                });
                
                // Дополнительно: скрываем элементы в блоках актёра
                if (isActorPage) {
                    self.ACTOR_PAGE_SELECTORS.forEach(function(selector) {
                        var blocks = document.querySelectorAll(selector);
                        blocks.forEach(function(block) {
                            var textElements = block.querySelectorAll('.card__age, .card__title, .card__info, .card__subtitle, span, div');
                            textElements.forEach(function(elem) {
                                if (elem.textContent && elem.textContent.trim() &&
                                    !elem.classList.contains('card__poster') &&
                                    !elem.classList.contains('card__image') &&
                                    !elem.querySelector('img')) {
                                    elem.style.display = 'none';
                                    elem.style.opacity = '0';
                                    elem.style.visibility = 'hidden';
                                }
                            });
                        });
                    });
                }
                
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
                    
                    // Если появляются элементы связанные с актёрами
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        for (var j = 0; j < mutation.addedNodes.length; j++) {
                            var node = mutation.addedNodes[j];
                            if (node.nodeType === 1) {
                                // Проверяем все селекторы актёров
                                var selectors = self.ACTOR_PAGE_SELECTORS.concat([
                                    '.person-header', '.actor-profile', '.person-info',
                                    '.biography', '.filmography', '.known-for',
                                    '[data-type="person"]', '[data-page="person"]'
                                ]);
                                
                                for (var k = 0; k < selectors.length; k++) {
                                    if (node.matches && node.matches(selectors[k])) {
                                        shouldCheck = true;
                                        break;
                                    }
                                    if (node.querySelector && node.querySelector(selectors[k])) {
                                        shouldCheck = true;
                                        break;
                                    }
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
            
            // Более агрессивное наблюдение для страниц актёров
            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        };
        
        // Дебаг функция - показывает текущий раздел
        self.debugInfo = function() {
            var section = self.getCurrentSection();
            var type = self.detectSectionType(section);
            var isActorPage = self.isActorPage();
            var shouldShow = self.shouldShowCaptions();
            
            console.log("=== Captions Fix Debug ===");
            console.log("Раздел:", section);
            console.log("Тип:", type);
            console.log("Страница актёра:", isActorPage);
            console.log("Показывать названия:", shouldShow);
            console.log("Текущий CSS:", self.styleElement ? self.styleElement.textContent.substring(0, 200) + "..." : "нет");
            console.log("Карточек на странице:", document.querySelectorAll('.card').length);
            console.log("========================");
            
            return {
                section: section,
                type: type,
                isActorPage: isActorPage,
                shouldShow: shouldShow,
                cardCount: document.querySelectorAll('.card').length
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
        
        // Специальная функция для принудительного скрытия на странице актёра
        self.forceHideOnActorPage = function() {
            if (self.isActorPage()) {
                // Создаём супер-селектор для скрытия всего
                var forceStyle = document.createElement('style');
                forceStyle.id = 'captions-force-hide-actor';
                forceStyle.textContent = `
                    /* СИЛЬНОЕ СКРЫТИЕ ДЛЯ СТРАНИЦЫ АКТЁРА */
                    .card * {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                    }
                    
                    .card .card__poster,
                    .card .card__image,
                    .card img {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    
                    /* Скрываем ВСЕ текстовые элементы на странице актёра */
                    [data-page="person"] .card__age,
                    [data-page="person"] .card__title,
                    [data-page="person"] .card__info,
                    [data-page="person"] .card__subtitle,
                    [data-page="person"] span,
                    [data-page="person"] div:not(.card__poster):not(.card__image) {
                        display: none !important;
                    }
                `;
                
                document.head.appendChild(forceStyle);
                console.log("[Captions Fix v2] Принудительно скрыты все названия на странице актёра");
            }
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
            var forceStyle = document.getElementById('captions-force-hide-actor');
            if (forceStyle) forceStyle.remove();
            
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
    
    // Специальная команда для страниц актёров
    window.hideActorCaptions = function() {
        plugin.forceHideOnActorPage();
    };
    
    // Экспортируем плагин
    window.CaptionsFixPlugin = plugin;
    
})();
