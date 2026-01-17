(function () { 
    "use strict"; 
    if (typeof Lampa === "undefined") return; 
    if (window.captions_fix_plugin_v3) return; 
    window.captions_fix_plugin_v3 = true; 
    console.log("[Captions Fix v4] Плагин запущен"); 
    
    function CaptionsFix() { 
        var self = this; 
        self.initialized = false; 
        self.styleElement = null; 
        self.observer = null; 
        self.lastSection = ""; 
        self.lastHash = window.location.hash; 
        
        // РАЗДЕЛЫ ГДЕ НАЗВАНИЯ ДОЛЖНЫ ПОКАЗЫВАТЬСЯ
        self.SHOW_IN_SECTIONS = [ 
            "Релизы", "Releases", "релизы", "releases", 
            "Избранное", "Favorites", "Избранное", "favorites", 
            "История", "History", "история", "history", 
            "Торренты", "Torrents", "торренты", "torrents", 
            "Поиск", "Search", "поиск", "search" 
        ]; 
        
        // РАЗДЕЛЫ ГДЕ НАЗВАНИЯ ДОЛЖНЫ СКРЫВАТЬСЯ
        self.HIDE_IN_SECTIONS = [ 
            "Персона", "Person",          // Страница актёра/режиссёра
            "Биография", "Biography", 
            "О персоне", "About"
            // УБРАНО: "Подробности", "Details" - это страница фильма!
        ]; 
        
        // Ключевые слова для определения разделов
        self.SECTION_KEYWORDS = { 
            'releases': ['релиз', 'release', 'новинк'], 
            'favorites': ['избранн', 'favorit', 'закладк', 'bookmark'], 
            'history': ['истори', 'histor', 'просмотр', 'watch'], 
            'torrents': ['торрент', 'torrent', 'загрузк', 'download'], 
            'search': ['поиск', 'search', 'искан', 'find'], 
            'details': ['подробност', 'details', 'информац', 'info'], // Только для фильмов
            'person': ['персон', 'person', 'актер', 'actor', 'режиссер', 'director', 'биографи', 'biography'] // Для страниц персон
        }; 
        
        // ========== ФУНКЦИЯ: Проверка на страницу персоны ==========
        self.isPersonPage = function() {
            var hash = window.location.hash.toLowerCase();
            
            // 1. Проверка URL - самый надежный способ
            if (hash.includes('#person/') || 
                hash.match(/#person\/\d+/) || 
                hash.includes('/person/') ||
                hash.includes('person=')) {
                console.log("[Captions Fix] Страница персоны определена по URL:", hash);
                return true;
            }
            
            // 2. Проверка по структуре страницы
            var personSpecificElements = [
                '.person__poster',           // Постер персоны
                '.person__biography',        // Биография
                '.person__info',             // Информация о персоне
                '[data-type="person"]',      // Data-атрибут
                '.page-person',              // Класс страницы
                'body.person-page',          // Класс body
                '.person-header',            // Шапка страницы персоны
                '.person__name'              // Имя персоны
            ];
            
            for (var i = 0; i < personSpecificElements.length; i++) {
                var element = document.querySelector(personSpecificElements[i]);
                if (element) {
                    console.log("[Captions Fix] Найден элемент персоны:", personSpecificElements[i]);
                    return true;
                }
            }
            
            // 3. Проверка по содержимому (должны быть ОБА признака)
            var pageText = document.body.textContent || '';
            var hasBirthDate = pageText.includes('Дата рождения') || 
                               pageText.includes('Date of birth') ||
                               pageText.includes('Родился') ||
                               pageText.includes('Родилась');
            
            var hasPersonName = pageText.includes('Дэвид Харбор') || // Пример имени
                                document.querySelector('.name--person, .person-name');
            
            // 4. Убедимся, что это НЕ страница фильма
            var isMovie = document.querySelector('.movie__poster, .series__poster, .details__poster, [data-type="movie"], [data-type="tv"]');
            
            if (hasBirthDate && hasPersonName && !isMovie) {
                console.log("[Captions Fix] Страница персоны определена по содержимому");
                return true;
            }
            
            // 5. Проверка заголовка
            var headerTitle = document.querySelector('.head__title');
            if (headerTitle && headerTitle.textContent) {
                var title = headerTitle.textContent.toLowerCase();
                if ((title.includes('актер') || title.includes('actor') || 
                     title.includes('режиссер') || title.includes('director')) &&
                    !title.includes('фильм') && !title.includes('movie') && !title.includes('сериал')) {
                    console.log("[Captions Fix] Страница персоны определена по заголовку:", headerTitle.textContent);
                    return true;
                }
            }
            
            return false;
        };
        
        // ========== ФУНКЦИЯ: Проверка на страницу фильма ==========
        self.isMoviePage = function() {
            var hash = window.location.hash.toLowerCase();
            
            // Явные URL фильмов/сериалов
            if (hash.includes('/movie/') || 
                hash.includes('/tv/') ||
                hash.includes('movie=') ||
                hash.includes('tv=') ||
                hash.includes('card=')) {
                return true;
            }
            
            // Структурные элементы страницы фильма
            var movieElements = [
                '.movie__poster',
                '.series__poster',
                '.details__poster',
                '.movie__info',
                '.series__info',
                '.details__block',
                '[data-type="movie"]',
                '[data-type="tv"]',
                '.card--movie',
                '.card--series'
            ];
            
            for (var i = 0; i < movieElements.length; i++) {
                if (document.querySelector(movieElements[i])) {
                    // Убедимся, что это не страница персоны
                    if (!document.querySelector('.person__poster, .person__info')) {
                        return true;
                    }
                }
            }
            
            // Проверка заголовка
            var headerTitle = document.querySelector('.head__title');
            if (headerTitle && headerTitle.textContent) {
                var title = headerTitle.textContent.toLowerCase();
                if (title.includes('фильм') || title.includes('сериал') || 
                    title.includes('movie') || title.includes('tv') ||
                    title.includes('details') || title.includes('подробности')) {
                    // Проверяем, что это не актёр в заголовке
                    if (!title.includes('актер') && !title.includes('actor') && 
                        !title.includes('режиссер') && !title.includes('director')) {
                        return true;
                    }
                }
            }
            
            return false;
        };
        
        // Инициализация 
        self.init = function() { 
            if (self.initialized) return; 
            console.log("[Captions Fix v4] Инициализация..."); 
            
            if (!document.body) { 
                requestAnimationFrame(self.init); 
                return; 
            } 
            
            self.addStyles(); 
            self.startObserver(); 
            
            window.addEventListener('hashchange', function() {
                setTimeout(function() {
                    self.checkAndUpdate();
                }, 300);
            });
            
            self.checkAndUpdate(); 
            self.initialized = true; 
            console.log("[Captions Fix v4] Инициализирован"); 
        }; 
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА 
        self.getCurrentSection = function() { 
            var section = ""; 
            try { 
                // 1. ПЕРВОЕ: Проверка на страницу ПЕРСОНЫ (актёра/режиссёра)
                if (self.isPersonPage()) {
                    console.log("[Captions Fix] Определена страница: Персона");
                    return "Персона";
                }
                
                // 2. ВТОРОЕ: Проверка на страницу ФИЛЬМА/СЕРИАЛА
                if (self.isMoviePage()) {
                    // Проверяем активный таб
                    var activeTab = document.querySelector('.tabs__item.active, .tab.active, .selector__item.active');
                    if (activeTab) {
                        var tabText = activeTab.textContent.toLowerCase();
                        if (tabText.includes('актер') || tabText.includes('actor') || 
                            tabText.includes('роли') || tabText.includes('cast') ||
                            tabText.includes('актёр')) {
                            console.log("[Captions Fix] Определена страница: Подробности-Актеры");
                            return "Подробности-Актеры";
                        }
                    }
                    console.log("[Captions Fix] Определена страница: Подробности");
                    return "Подробности";
                }
                
                // 3. Из заголовка в шапке 
                var headerTitle = document.querySelector('.head__title'); 
                if (headerTitle && headerTitle.textContent) { 
                    section = headerTitle.textContent.trim(); 
                    if (section) { 
                        console.log("[Captions Fix] Найден заголовок:", section); 
                        return section; 
                    } 
                } 
                
                // 4. Из активной Activity Lampa 
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
                
                // 5. Из URL/hash 
                var hash = window.location.hash.toLowerCase(); 
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное"; 
                if (hash.includes('history') || hash.includes('истори')) return "История"; 
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты"; 
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы"; 
                if (hash.includes('search') || hash.includes('поиск')) return "Поиск"; 
                
                // 6. Из классов body 
                var bodyClass = document.body.className; 
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное"; 
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История"; 
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты"; 
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы"; 
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск"; 
                
                // 7. По содержимому страницы 
                var pageText = document.body.textContent || ""; 
                pageText = pageText.toLowerCase(); 
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
            
            console.log("[Captions Fix] Анализ раздела:", name);
            
            // 1. Проверяем разделы где нужно СКРЫВАТЬ (страницы персон)
            for (var i = 0; i < self.HIDE_IN_SECTIONS.length; i++) { 
                var hideSection = self.HIDE_IN_SECTIONS[i].toLowerCase(); 
                if (name.includes(hideSection) || hideSection.includes(name)) { 
                    console.log("[Captions Fix] Раздел в HIDE_IN_SECTIONS:", hideSection);
                    return 'hide'; 
                } 
            } 
            
            // 2. Специальные проверки (приоритетные)
            if (name.includes('персона') || name.includes('person')) {
                console.log("[Captions Fix] Раздел 'Персона' - скрывать");
                return 'hide'; // Страница актёра - СКРЫВАТЬ
            }
            
            if (name.includes('подробности-актеры') || name.includes('details-actors')) {
                console.log("[Captions Fix] Раздел 'Подробности-Актеры' - показывать");
                return 'show'; // Раздел актёров на странице фильма - ПОКАЗЫВАТЬ
            }
            
            if (name.includes('подробности') || name.includes('details')) {
                console.log("[Captions Fix] Раздел 'Подробности' - показывать");
                return 'show'; // Страница фильма - ПОКАЗЫВАТЬ
            }
            
            // 3. Проверяем по ключевым словам
            for (var type in self.SECTION_KEYWORDS) { 
                var keywords = self.SECTION_KEYWORDS[type]; 
                for (var j = 0; j < keywords.length; j++) { 
                    if (name.includes(keywords[j])) { 
                        console.log("[Captions Fix] Найдено ключевое слово:", keywords[j], "-> тип:", type);
                        
                        // Особые правила для типов
                        if (type === 'person') {
                            return 'hide'; // Все person-разделы скрываем
                        }
                        if (type === 'details') {
                            return 'show'; // Все details-разделы показываем
                        }
                        
                        return type; 
                    } 
                } 
            } 
            
            console.log("[Captions Fix] Раздел не определен");
            return ''; 
        }; 
        
        // Проверка, нужно ли показывать названия 
        self.shouldShowCaptions = function() { 
            var section = self.getCurrentSection(); 
            var sectionType = self.detectSectionType(section); 
            console.log("[Captions Fix v4] Раздел:", section, "Тип:", sectionType, "Показывать:", sectionType !== '' && sectionType !== 'hide'); 
            
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
                return ` 
                /* Captions Fix v4 - ПОКАЗЫВАТЬ названия */ 
                body .card:not(.card--collection) .card__age, 
                body .card:not(.card--collection) .card__title,
                .card:not(.card--collection) .card__age, 
                .card:not(.card--collection) .card__title { 
                    display: block !important; 
                    opacity: 1 !important; 
                    visibility: visible !important; 
                } 
                `; 
            } else { 
                return ` 
                /* Captions Fix v4 - СКРЫВАТЬ названия */ 
                body .card:not(.card--collection) .card__age, 
                body .card:not(.card--collection) .card__title,
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
                var currentSection = self.getCurrentSection(); 
                var currentHash = window.location.hash;
                
                if (currentSection !== self.lastSection || currentHash !== self.lastHash) { 
                    console.log("[Captions Fix] Смена:", self.lastSection + " -> " + currentSection); 
                    self.lastSection = currentSection; 
                    self.lastHash = currentHash;
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
            var styleId = "captions-fix-styles-v4"; 
            
            var oldStyle = document.getElementById(styleId); 
            if (oldStyle) oldStyle.remove(); 
            
            var style = document.createElement("style"); 
            style.id = styleId; 
            style.textContent = css; 
            
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
                    
                    if (mutation.target.classList && mutation.target.classList.contains('head__title')) { 
                        shouldCheck = true; 
                        break; 
                    } 
                    
                    if (mutation.target === document.body && mutation.attributeName === 'class') { 
                        shouldCheck = true; 
                        break; 
                    } 
                    
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
            var isPerson = self.isPersonPage();
            var isMovie = self.isMoviePage();
            
            console.log("=== Captions Fix Debug v4 ==="); 
            console.log("Раздел:", section); 
            console.log("Тип раздела:", type); 
            console.log("Показывать названия:", shouldShow); 
            console.log("isPersonPage():", isPerson);
            console.log("isMoviePage():", isMovie);
            console.log("Hash:", window.location.hash);
            console.log("Body класс:", document.body.className);
            console.log("Заголовок:", document.querySelector('.head__title')?.textContent);
            console.log("========================"); 
            
            return { 
                section: section, 
                type: type, 
                shouldShow: shouldShow,
                isPersonPage: isPerson,
                isMoviePage: isMovie,
                hash: window.location.hash
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
            console.log("[Captions Fix v4] Остановлен"); 
        }; 
    } 
    
    // Создаём и запускаем плагин 
    var plugin = new CaptionsFix(); 
    
    if (document.readyState === 'loading') { 
        document.addEventListener('DOMContentLoaded', function() { 
            plugin.init(); 
        }); 
    } else { 
        plugin.init(); 
    } 
    
    window.debugCaptions = function() { 
        return plugin.debugInfo(); 
    }; 
    
    window.CaptionsFixPlugin = plugin; 
})();
