(function () { 
    "use strict"; 
    if (typeof Lampa === "undefined") return; 
    if (window.captions_fix_plugin_v3) return; 
    window.captions_fix_plugin_v3 = true; 
    console.log("[Captions Fix v3.1] Плагин запущен"); 
    
    function CaptionsFix() { 
        var self = this; 
        self.initialized = false; 
        self.styleElement = null; 
        self.observer = null; 
        self.lastSection = ""; 
        self.lastHash = window.location.hash; // Добавим отслеживание hash
        
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
            "Подробности", "Details", 
            "Информация", "Info", 
            "Биография", "Biography", 
            "О персоне", "About" 
            // УБРАЛИ "Актер", "Actor", "Режиссер", "Director" - они теперь проверяются отдельно
        ]; 
        
        // Ключевые слова для определения разделов
        self.SECTION_KEYWORDS = { 
            'releases': ['релиз', 'release', 'новинк'], 
            'favorites': ['избранн', 'favorit', 'закладк', 'bookmark'], 
            'history': ['истори', 'histor', 'просмотр', 'watch'], 
            'torrents': ['торрент', 'torrent', 'загрузк', 'download'], 
            'search': ['поиск', 'search', 'искан', 'find'], 
            'details': ['подробност', 'details', 'информац', 'info', 'биографи', 'biography', 'персон', 'person', 'about'] 
            // УБРАЛИ 'актер', 'actor', 'режиссер', 'director' - они теперь проверяются отдельно
        }; 
        
        // ========== НОВАЯ ФУНКЦИЯ: Проверка на страницу персоны ==========
        self.isPersonPage = function() {
            var hash = window.location.hash.toLowerCase();
            
            // 1. Проверка URL - самый надежный способ
            // Только явные ссылки на персону
            if (hash.includes('#person/') || 
                hash.match(/#person\/\d+/) || 
                hash.includes('/person/')) {
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
                'body.person-page'           // Класс body
            ];
            
            for (var i = 0; i < personSpecificElements.length; i++) {
                if (document.querySelector(personSpecificElements[i])) {
                    // Проверяем, что это НЕ страница фильма
                    if (!document.querySelector('.movie__poster, .series__poster, .details__poster')) {
                        console.log("[Captions Fix] Страница персоны определена по элементу:", personSpecificElements[i]);
                        return true;
                    }
                }
            }
            
            // 3. Комбинированная проверка (должны быть ОБА условия)
            var pageText = document.body.textContent || '';
            var hasBirthDate = pageText.includes('Дата рождения') || 
                               pageText.includes('Date of birth') ||
                               pageText.includes('Родился') ||
                               pageText.includes('Родилась');
            
            var hasPersonLayout = document.querySelector('.person__left, .person__right, .person-grid, .person-header');
            
            // Проверяем, что это НЕ страница фильма
            var isMoviePage = document.querySelector('.movie__info, .series__info, .details__block:not(.person__info)');
            
            if (hasBirthDate && hasPersonLayout && !isMoviePage) {
                console.log("[Captions Fix] Страница персоны определена по структуре и содержимому");
                return true;
            }
            
            return false;
        };
        
        // ========== НОВАЯ ФУНКЦИЯ: Проверка на страницу фильма ==========
        self.isMoviePage = function() {
            var hash = window.location.hash.toLowerCase();
            
            // Явные URL фильмов/сериалов
            if (hash.includes('/movie/') || 
                hash.includes('/tv/') ||
                hash.includes('movie=') ||
                hash.includes('tv=')) {
                return true;
            }
            
            // Структурные элементы страницы фильма
            var movieElements = [
                '.movie__poster',
                '.series__poster',
                '.details__poster',
                '.movie__info',
                '.series__info',
                '.details__block:not(.person__info)',
                '[data-id^="movie"]',
                '[data-id^="tv"]'
            ];
            
            for (var i = 0; i < movieElements.length; i++) {
                if (document.querySelector(movieElements[i])) {
                    return true;
                }
            }
            
            return false;
        };
        
        // Инициализация 
        self.init = function() { 
            if (self.initialized) return; 
            console.log("[Captions Fix v3.1] Инициализация..."); 
            
            // Ждём загрузки DOM 
            if (!document.body) { 
                requestAnimationFrame(self.init); 
                return; 
            } 
            
            // Добавляем стили сразу 
            self.addStyles(); 
            
            // Запускаем наблюдатель 
            self.startObserver(); 
            
            // Добавляем отслеживание изменения hash
            window.addEventListener('hashchange', function() {
                setTimeout(function() {
                    self.checkAndUpdate();
                }, 300); // Задержка для загрузки контента
            });
            
            // ПЕРВОНАЧАЛЬНАЯ ПРОВЕРКА СРАЗУ 
            self.checkAndUpdate(); 
            self.initialized = true; 
            console.log("[Captions Fix v3.1] Инициализирован"); 
        }; 
        
        // ОПРЕДЕЛЕНИЕ РАЗДЕЛА 
        self.getCurrentSection = function() { 
            var section = ""; 
            try { 
                // СПЕЦИАЛЬНАЯ ПРОВЕРКА: Если это страница персоны
                if (self.isPersonPage()) {
                    return "Подробности-Персона"; // Специальный тип для страницы персоны
                }
                
                // СПЕЦИАЛЬНАЯ ПРОВЕРКА: Если это страница фильма
                if (self.isMoviePage()) {
                    // Проверяем активный таб на странице фильма
                    var activeTab = document.querySelector('.tabs__item.active, .tab.active, .selector__item.active');
                    if (activeTab) {
                        var tabText = activeTab.textContent.toLowerCase();
                        if (tabText.includes('актер') || tabText.includes('actor') || 
                            tabText.includes('роли') || tabText.includes('cast')) {
                            return "Фильм-Актеры"; // Отдельный тип для раздела актёров в фильме
                        }
                    }
                    return "Фильм";
                }
                
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
                
                // ИЗМЕНЕНИЕ: УБРАЛИ СПОСОБ 3 (старая проверка на персону) 
                // Теперь используется отдельная функция isPersonPage()
                
                // СПОСОБ 4: Из URL/hash 
                var hash = window.location.hash.toLowerCase(); 
                if (hash.includes('favorite') || hash.includes('избранн')) return "Избранное"; 
                if (hash.includes('history') || hash.includes('истори')) return "История"; 
                if (hash.includes('torrent') || hash.includes('торрент')) return "Торренты"; 
                if (hash.includes('release') || hash.includes('релиз')) return "Релизы"; 
                if (hash.includes('search') || hash.includes('поиск')) return "Поиск"; 
                
                // УБРАЛИ проверку на person/актер/режиссер/details - теперь в isPersonPage()
                
                // СПОСОБ 5: Из классов body 
                var bodyClass = document.body.className; 
                if (bodyClass.includes('favorite') || bodyClass.includes('избран')) return "Избранное"; 
                if (bodyClass.includes('history') || bodyClass.includes('истор')) return "История"; 
                if (bodyClass.includes('torrent') || bodyClass.includes('торрент')) return "Торренты"; 
                if (bodyClass.includes('release') || bodyClass.includes('релиз')) return "Релизы"; 
                if (bodyClass.includes('search') || bodyClass.includes('поиск')) return "Поиск"; 
                
                // УБРАЛИ проверку на person/details/info - теперь в isPersonPage()
                
                // СПОСОБ 6: По содержимому страницы 
                var pageText = document.body.textContent || ""; 
                pageText = pageText.toLowerCase(); 
                if (pageText.includes('избранное') || pageText.includes('favorite')) return "Избранное"; 
                if (pageText.includes('история') || pageText.includes('history')) return "История"; 
                if (pageText.includes('торренты') || pageText.includes('torrent')) return "Торренты"; 
                if (pageText.includes('релизы') || pageText.includes('release')) return "Релизы"; 
                if (pageText.includes('поиск') || pageText.includes('search')) return "Поиск"; 
                
                // УБРАЛИ проверку на дату рождения - теперь в isPersonPage()
                
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
            
            // ========== НОВАЯ ПРОВЕРКА: Специальные типы ==========
            if (name.includes('подробности-персона')) {
                return 'hide'; // Страница персоны - скрываем
            }
            
            if (name.includes('фильм-актеры')) {
                return 'show'; // Раздел актёров на странице фильма - ПОКАЗЫВАЕМ
            }
            
            if (name.includes('фильм')) {
                return 'show'; // Страница фильма - показываем
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
            console.log("[Captions Fix v3.1] Раздел:", section, "Тип:", sectionType); 
            
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
                /* Captions Fix v3.1 - ПОКАЗЫВАТЬ названия */ 
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
                /* Captions Fix v3.1 - СКРЫВАТЬ названия */ 
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
                var currentHash = window.location.hash;
                
                // Если раздел изменился ИЛИ изменился hash
                if (currentSection !== self.lastSection || currentHash !== self.lastHash) { 
                    console.log("[Captions Fix] Смена раздела:", self.lastSection, "->", currentSection); 
                    console.log("[Captions Fix] Смена hash:", self.lastHash, "->", currentHash);
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
                    if (mutation.target.classList && mutation.target.classList.contains('head__title')) { 
                        shouldCheck = true; 
                        break; 
                    } 
                    // Если меняются классы body 
                    if (mutation.target === document.body && mutation.attributeName === 'class') { 
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
            var isPerson = self.isPersonPage();
            var isMovie = self.isMoviePage();
            
            console.log("=== Captions Fix Debug ==="); 
            console.log("Раздел:", section); 
            console.log("Тип:", type); 
            console.log("Показывать названия:", shouldShow); 
            console.log("Страница персоны:", isPerson);
            console.log("Страница фильма:", isMovie);
            console.log("Hash:", window.location.hash);
            console.log("========================"); 
            
            return { 
                section: section, 
                type: type, 
                shouldShow: shouldShow,
                isPersonPage: isPerson,
                isMoviePage: isMovie
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
            console.log("[Captions Fix v3.1] Остановлен"); 
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
