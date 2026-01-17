(function () { 
    "use strict"; 
    if (typeof Lampa === "undefined") return; 
    if (window.captions_fix_plugin_v4) return; 
    window.captions_fix_plugin_v4 = true; 
    console.log("[Captions Fix v5] Плагин запущен"); 
    
    function CaptionsFix() { 
        var self = this; 
        self.initialized = false; 
        self.styleElement = null; 
        self.observer = null; 
        self.lastSection = ""; 
        self.lastUrl = window.location.href; 
        
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
            "Персона", "Person", 
            "Биография", "Biography", 
            "О персоне", "About"
        ]; 
        
        // Ключевые слова для определения разделов
        self.SECTION_KEYWORDS = { 
            'releases': ['релиз', 'release', 'новинк'], 
            'favorites': ['избранн', 'favorit', 'закладк', 'bookmark'], 
            'history': ['истори', 'histor', 'просмотр', 'watch'], 
            'torrents': ['торрент', 'torrent', 'загрузк', 'download'], 
            'search': ['поиск', 'search', 'искан', 'find'], 
            'details': ['подробност', 'details', 'информац', 'info'],
            'person': ['персон', 'person', 'актер', 'actor', 'режиссер', 'director']
        }; 
        
        // ========== ФУНКЦИЯ: Проверка на страницу персоны (УЛУЧШЕННАЯ) ==========
        self.isPersonPage = function() {
            var url = window.location.href.toLowerCase();
            var hash = window.location.hash.toLowerCase();
            var search = window.location.search.toLowerCase();
            
            console.log("[Captions Fix] Анализ URL:", {url: url, hash: hash, search: search});
            
            // 1. Проверка URL параметров (ВАШ СЛУЧАЙ!)
            if (search.includes('component=actor') || 
                search.includes('component=director') ||
                search.includes('job=acting') ||
                search.includes('person=') ||
                search.includes('id=') && (search.includes('actor') || search.includes('director'))) {
                console.log("[Captions Fix] Страница персоны по параметрам URL");
                return true;
            }
            
            // 2. Проверка hash (старый формат)
            if (hash.includes('#person/') || 
                hash.match(/#person\/\d+/) || 
                hash.includes('/person/')) {
                console.log("[Captions Fix] Страница персоны по hash");
                return true;
            }
            
            // 3. Проверка по структуре страницы
            var personSpecificElements = [
                '.person__poster', 
                '.person__biography', 
                '.person__info',
                '[class*="person-"]',
                '[data-component="actor"]',
                '[data-component="director"]',
                '.actor-page',
                '.director-page'
            ];
            
            for (var i = 0; i < personSpecificElements.length; i++) {
                var element = document.querySelector(personSpecificElements[i]);
                if (element) {
                    console.log("[Captions Fix] Найден элемент персоны:", personSpecificElements[i]);
                    return true;
                }
            }
            
            // 4. Проверка по содержимому
            var pageText = document.body.textContent || '';
            var hasPersonContent = (
                (pageText.includes('Дата рождения') || pageText.includes('Date of birth')) &&
                (pageText.includes('Родился') || pageText.includes('Родилась') || pageText.includes('Место рождения'))
            );
            
            if (hasPersonContent) {
                // Проверяем, что это НЕ страница фильма
                var hasMovieElements = document.querySelector('.movie__info, .series__info, .details__block:not(.person__info)');
                if (!hasMovieElements) {
                    console.log("[Captions Fix] Страница персоны по содержимому");
                    return true;
                }
            }
            
            // 5. Проверка заголовка
            var headerTitle = document.querySelector('.head__title');
            if (headerTitle && headerTitle.textContent) {
                var title = headerTitle.textContent.toLowerCase();
                var isPersonTitle = (
                    title.includes('актер') || title.includes('actor') || 
                    title.includes('режиссер') || title.includes('director')
                );
                var isMovieTitle = (
                    title.includes('фильм') || title.includes('сериал') || 
                    title.includes('movie') || title.includes('tv')
                );
                
                if (isPersonTitle && !isMovieTitle) {
                    console.log("[Captions Fix] Страница персоны по заголовку:", headerTitle.textContent);
                    return true;
                }
            }
            
            // 6. Проверка по URL path (если есть)
            var path = window.location.pathname.toLowerCase();
            if (path.includes('/actor/') || path.includes('/director/') || path.includes('/person/')) {
                console.log("[Captions Fix] Страница персоны по path");
                return true;
            }
            
            return false;
        };
        
        // ========== ФУНКЦИЯ: Проверка на страницу фильма ==========
        self.isMoviePage = function() {
            var url = window.location.href.toLowerCase();
            var search = window.location.search.toLowerCase();
            var hash = window.location.hash.toLowerCase();
            
            // 1. Проверка URL параметров фильма
            if (search.includes('component=movie') || 
                search.includes('component=tv') ||
                search.includes('type=movie') ||
                search.includes('type=tv') ||
                search.includes('movie=') ||
                search.includes('tv=')) {
                console.log("[Captions Fix] Страница фильма по параметрам URL");
                return true;
            }
            
            // 2. Проверка hash
            if (hash.includes('/movie/') || 
                hash.includes('/tv/') ||
                hash.includes('#movie/') ||
                hash.includes('#tv/')) {
                return true;
            }
            
            // 3. Проверка по структуре
            var movieElements = [
                '.movie__poster',
                '.series__poster',
                '.details__poster',
                '.movie__info',
                '.series__info',
                '.details__block',
                '[data-component="movie"]',
                '[data-component="tv"]',
                '[data-type="movie"]',
                '[data-type="tv"]'
            ];
            
            for (var i = 0; i < movieElements.length; i++) {
                var element = document.querySelector(movieElements[i]);
                if (element) {
                    // Убедимся, что это не страница персоны
                    var isPerson = element.closest('.person__info, .actor-page, .director-page');
                    if (!isPerson) {
                        return true;
                    }
                }
            }
            
            // 4. Проверка заголовка
            var headerTitle = document.querySelector('.head__title');
            if (headerTitle && headerTitle.textContent) {
                var title = headerTitle.textContent.toLowerCase();
                if (title.includes('фильм') || title.includes('сериал') || 
                    title.includes('movie') || title.includes('tv') ||
                    title.includes('подробности') || title.includes('details')) {
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
            console.log("[Captions Fix v5] Инициализация..."); 
            
            if (!document.body) { 
                requestAnimationFrame(self.init); 
                return; 
            } 
            
            self.addStyles(); 
            self.startObserver(); 
            
            // Отслеживание изменений URL
            var lastUrl = window.location.href;
            setInterval(function() {
                var currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    lastUrl = currentUrl;
                    setTimeout(function() {
                        self.checkAndUpdate();
                    }, 300);
                }
            }, 500);
            
            window.addEventListener('hashchange', function() {
                setTimeout(function() {
                    self.checkAndUpdate();
                }, 300);
            });
            
            self.checkAndUpdate(); 
            self.initialized = true; 
            console.log("[Captions Fix v5] Инициализирован"); 
        }; 
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА 
        self.getCurrentSection = function() { 
            var section = ""; 
            try { 
                // 1. Проверка на страницу ПЕРСОНЫ
                if (self.isPersonPage()) {
                    console.log("[Captions Fix] Определена страница: Персона");
                    return "Персона";
                }
                
                // 2. Проверка на страницу ФИЛЬМА
                if (self.isMoviePage()) {
                    // Проверяем активный таб
                    var activeTab = document.querySelector('.tabs__item.active, .tab.active, .selector__item.active, .nav__item.active');
                    if (activeTab) {
                        var tabText = activeTab.textContent.toLowerCase();
                        if (tabText.includes('актер') || tabText.includes('actor') || 
                            tabText.includes('роли') || tabText.includes('cast') ||
                            tabText.includes('актёр') || tabText.includes('в ролях')) {
                            console.log("[Captions Fix] Определена страница: Подробности-Актеры");
                            return "Подробности-Актеры";
                        }
                    }
                    console.log("[Captions Fix] Определена страница: Подробности");
                    return "Подробности";
                }
                
                // 3. Остальные способы определения (как раньше)
                var headerTitle = document.querySelector('.head__title'); 
                if (headerTitle && headerTitle.textContent) { 
                    section = headerTitle.textContent.trim(); 
                    if (section) { 
                        return section; 
                    } 
                } 
                
                if (Lampa.Activity && Lampa.Activity.active) { 
                    var activity = Lampa.Activity.active(); 
                    if (activity) { 
                        if (activity.title) section = activity.title; 
                        else if (activity.name) section = activity.name; 
                        else if (activity.component && activity.component.title) { 
                            section = activity.component.title; 
                        } 
                        if (section) { 
                            return section; 
                        } 
                    } 
                } 
                
                var hash = window.location.hash.toLowerCase(); 
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное"; 
                if (hash.includes('history') || hash.includes('истори')) return "История"; 
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты"; 
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы"; 
                if (hash.includes('search') || hash.includes('поиск')) return "Поиск"; 
                
                var bodyClass = document.body.className; 
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное"; 
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История"; 
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты"; 
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы"; 
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск"; 
                
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
        
        // Определение типа раздела 
        self.detectSectionType = function(sectionName) { 
            if (!sectionName) return ''; 
            var name = sectionName.toLowerCase(); 
            
            // 1. Проверяем HIDE_IN_SECTIONS
            for (var i = 0; i < self.HIDE_IN_SECTIONS.length; i++) { 
                var hideSection = self.HIDE_IN_SECTIONS[i].toLowerCase(); 
                if (name.includes(hideSection) || hideSection.includes(name)) { 
                    return 'hide'; 
                } 
            } 
            
            // 2. Специальные проверки
            if (name.includes('персона') || name.includes('person')) {
                return 'hide'; // Страница актёра
            }
            
            if (name.includes('подробности-актеры')) {
                return 'show'; // Таб актёров в фильме
            }
            
            if (name.includes('подробности') || name.includes('details')) {
                return 'show'; // Страница фильма
            }
            
            // 3. Проверка по ключевым словам
            for (var type in self.SECTION_KEYWORDS) { 
                var keywords = self.SECTION_KEYWORDS[type]; 
                for (var j = 0; j < keywords.length; j++) { 
                    if (name.includes(keywords[j])) { 
                        if (type === 'person') return 'hide';
                        if (type === 'details') return 'show';
                        return type; 
                    } 
                } 
            } 
            
            return ''; 
        }; 
        
        // Проверка, нужно ли показывать названия 
        self.shouldShowCaptions = function() { 
            var section = self.getCurrentSection(); 
            var sectionType = self.detectSectionType(section); 
            
            console.log("[Captions Fix v5] Результат:", {
                раздел: section,
                тип: sectionType,
                показывать: sectionType !== '' && sectionType !== 'hide',
                url: window.location.href,
                isPersonPage: self.isPersonPage(),
                isMoviePage: self.isMoviePage()
            });
            
            if (sectionType === 'hide') { 
                return false; 
            } 
            
            return sectionType !== ''; 
        }; 
        
        // Генерация CSS 
        self.generateCSS = function() { 
            var shouldShow = self.shouldShowCaptions(); 
            
            // Усиленные селекторы для гарантии
            if (shouldShow) { 
                return ` 
                /* Captions Fix v5 - ПОКАЗЫВАТЬ */ 
                .card .card__title,
                .card .card__age,
                [class*="card"] [class*="title"],
                [class*="card"] [class*="age"],
                [class*="card-"] [class*="title"],
                [class*="card-"] [class*="age"] { 
                    display: block !important; 
                    opacity: 1 !important; 
                    visibility: visible !important; 
                } 
                `; 
            } else { 
                return ` 
                /* Captions Fix v5 - СКРЫВАТЬ */ 
                .card .card__title,
                .card .card__age,
                [class*="card"] [class*="title"],
                [class*="card"] [class*="age"],
                [class*="card-"] [class*="title"],
                [class*="card-"] [class*="age"] { 
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
                var currentUrl = window.location.href;
                
                if (currentSection !== self.lastSection || currentUrl !== self.lastUrl) { 
                    console.log("[Captions Fix] Обновление из-за смены URL/раздела"); 
                    self.lastSection = currentSection; 
                    self.lastUrl = currentUrl;
                    self.addStyles(); 
                    self.applyToCards(); 
                } 
            } catch(e) { 
                console.error("[Captions Fix] Ошибка проверки:", e); 
            } 
        }; 
        
        // Добавление стилей 
        self.addStyles = function() { 
            var css = self.generateCSS(); 
            var styleId = "captions-fix-styles-v5"; 
            
            var oldStyle = document.getElementById(styleId); 
            if (oldStyle) oldStyle.remove(); 
            
            var style = document.createElement("style"); 
            style.id = styleId; 
            style.textContent = css; 
            
            document.head.appendChild(style); 
            self.styleElement = style; 
        }; 
        
        // Применение к карточкам 
        self.applyToCards = function() { 
            try { 
                var shouldShow = self.shouldShowCaptions(); 
                var cards = document.querySelectorAll('.card, [class*="card-"], [class*="card__"]'); 
                cards.forEach(function(card) { 
                    var title = card.querySelector('.card__title, [class*="title"], .title, .name'); 
                    var age = card.querySelector('.card__age, [class*="age"], .age'); 
                    
                    if (title) { 
                        title.style.display = shouldShow ? 'block' : 'none'; 
                        title.style.opacity = shouldShow ? '1' : '0'; 
                    } 
                    if (age) { 
                        age.style.display = shouldShow ? 'block' : 'none'; 
                        age.style.opacity = shouldShow ? '1' : '0'; 
                    } 
                }); 
            } catch(e) { 
                console.error("[Captions Fix] Ошибка применения к карточкам:", e); 
            } 
        }; 
        
        // Наблюдатель 
        self.startObserver = function() { 
            if (self.observer) return; 
            self.observer = new MutationObserver(function() { 
                self.checkAndUpdate(); 
            }); 
            
            self.observer.observe(document.body, { 
                childList: true, 
                subtree: true, 
                attributes: true, 
                characterData: true 
            }); 
        }; 
        
        // Дебаг функция 
        self.debugInfo = function() { 
            return { 
                раздел: self.getCurrentSection(),
                тип: self.detectSectionType(self.getCurrentSection()),
                показывать: self.shouldShowCaptions(),
                isPersonPage: self.isPersonPage(),
                isMoviePage: self.isMoviePage(),
                url: window.location.href,
                hash: window.location.hash,
                search: window.location.search,
                заголовок: document.querySelector('.head__title')?.textContent
            }; 
        }; 
        
        self.destroy = function() { 
            if (self.observer) self.observer.disconnect(); 
            if (self.styleElement) self.styleElement.remove(); 
            window.captions_fix_plugin_v4 = false; 
            console.log("[Captions Fix v5] Остановлен"); 
        }; 
    } 
    
    var plugin = new CaptionsFix(); 
    
    if (document.readyState === 'loading') { 
        document.addEventListener('DOMContentLoaded', function() { 
            plugin.init(); 
        }); 
    } else { 
        plugin.init(); 
    } 
    
    window.debugCaptions = function() { 
        console.log("=== Captions Fix Debug ===", plugin.debugInfo()); 
        return plugin.debugInfo(); 
    }; 
    
    window.CaptionsFixPlugin = plugin; 
})();
