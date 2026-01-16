(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin) return;
    window.captions_fix_plugin = true;
    
    console.log("[Captions Fix] Плагин запущен");
    
    function CaptionsFix() {
        var self = this;
        self.initialized = false;
        self.styleElement = null;
        self.observer = null;
        self.checkInterval = null;
        
        // РАЗДЕЛЫ ГДЕ НАЗВАНИЯ ДОЛЖНЫ ПОКАЗЫВАТЬСЯ
        self.SHOW_IN_SECTIONS = [
            "Релизы",
            "Избранное", 
            "История",
            "Торренты",
            "Поиск",
            "Releases",     // английская версия
            "Favorites",    // английская версия
            "History",      // английская версия
            "Torrents",     // английская версия
            "Search"        // английская версия
        ];
        
        // Инициализация
        self.init = function() {
            if (self.initialized) return;
            
            // Ждём загрузки необходимых компонентов
            if (!Lampa.Storage || !Lampa.SettingsApi) {
                setTimeout(self.init, 500);
                return;
            }
            
            // Добавляем настройку
            self.addSetting();
            
            // Добавляем стили сразу
            self.addStyles();
            
            // Запускаем наблюдатель для динамических элементов
            self.startObserver();
            
            // Периодически проверяем и обновляем стили
            self.checkInterval = setInterval(function() {
                self.addStyles();
            }, 3000);
            
            self.initialized = true;
            console.log("[Captions Fix] Инициализирован");
        };
        
        // Добавление настройки
        self.addSetting = function() {
            // Проверяем, не добавлена ли уже настройка
            if (Lampa.Storage.get('__captions_setting_added')) return;
            
            try {
                // Добавляем в настройки интерфейса
                Lampa.SettingsApi.addParam({
                    component: "interface",
                    param: { 
                        name: "captions_show_mode", 
                        type: "select", 
                        default: "section",
                        values: {
                            "section": "По разделам (скрыть кроме указанных)",
                            "show": "Показывать везде",
                            "hide": "Скрывать везде"
                        }
                    },
                    field: { 
                        name: "Отображение названий", 
                        description: "Скрывать названия везде кроме: Релизы, Избранное, История, Торренты, Поиск" 
                    },
                    onRender: function (item) {
                        // Размещаем в нужном месте
                        setTimeout(function() {
                            var target = $('div[data-name="interface_size"]');
                            if (target.length) {
                                item.insertAfter(target);
                            }
                            item.css("opacity", "1");
                        }, 100);
                    },
                    onChange: function(value) {
                        // Обновляем стили при изменении
                        setTimeout(self.addStyles, 100);
                    }
                });
                
                // Помечаем, что настройка добавлена
                Lampa.Storage.set('__captions_setting_added', true);
                console.log("[Captions Fix] Настройка добавлена");
            } catch(e) {
                console.error("[Captions Fix] Ошибка добавления настройки:", e);
            }
        };
        
        // Получение текущего режима
        self.getMode = function() {
            return Lampa.Storage.get("captions_show_mode", "section");
        };
        
        // Определение текущего раздела
        self.getCurrentSection = function() {
            try {
                // Способ 1: Из заголовка страницы
                var pageTitle = $('.head__title').text().trim();
                if (pageTitle) return pageTitle;
                
                // Способ 2: Из активной активности Lampa
                var activity = Lampa.Activity.active();
                if (activity && activity.component && activity.component.title) {
                    return activity.component.title;
                }
                
                // Способ 3: Из URL или других признаков
                if (window.location.hash.indexOf('search') !== -1) return "Поиск";
                if (window.location.hash.indexOf('favorite') !== -1) return "Избранное";
                if (window.location.hash.indexOf('history') !== -1) return "История";
                if (window.location.hash.indexOf('torrent') !== -1) return "Торренты";
                if (window.location.hash.indexOf('release') !== -1) return "Релизы";
                
                return "";
            } catch(e) {
                return "";
            }
        };
        
        // Проверка, нужно ли показывать названия в текущем разделе
        self.shouldShowInCurrentSection = function() {
            var currentSection = self.getCurrentSection();
            return self.SHOW_IN_SECTIONS.some(function(section) {
                return currentSection.includes(section) || section.includes(currentSection);
            });
        };
        
        // Генерация CSS в зависимости от режима
        self.generateCSS = function() {
            var mode = self.getMode();
            var css = "/* Captions Fix Plugin - Скрыть названия кроме указанных разделов */\n";
            
            switch(mode) {
                case "show":
                    // Показывать везде
                    css += `
                        .card:not(.card--collection) .card__age,
                        .card:not(.card--collection) .card__title {
                            display: block !important;
                            opacity: 1 !important;
                            visibility: visible !important;
                        }
                    `;
                    break;
                    
                case "hide":
                    // Скрывать везде
                    css += `
                        .card:not(.card--collection) .card__age,
                        .card:not(.card--collection) .card__title {
                            display: none !important;
                        }
                    `;
                    break;
                    
                case "section":
                default:
                    // ПО УМОЛЧАНИЮ: скрывать везде кроме указанных разделов
                    css += `
                        /* По умолчанию - скрывать везде */
                        .card:not(.card--collection) .card__age,
                        .card:not(.card--collection) .card__title {
                            display: none !important;
                        }
                        
                        /* Показать только в указанных разделах */
                        body.section-releases .card:not(.card--collection) .card__age,
                        body.section-releases .card:not(.card--collection) .card__title,
                        body.section-favorites .card:not(.card--collection) .card__age,
                        body.section-favorites .card:not(.card--collection) .card__title,
                        body.section-history .card:not(.card--collection) .card__age,
                        body.section-history .card:not(.card--collection) .card__title,
                        body.section-torrents .card:not(.card--collection) .card__age,
                        body.section-torrents .card:not(.card--collection) .card__title,
                        body.section-search .card:not(.card--collection) .card__age,
                        body.section-search .card:not(.card--collection) .card__title {
                            display: block !important;
                            opacity: 1 !important;
                            visibility: visible !important;
                        }
                    `;
                    break;
            }
            
            return css;
        };
        
        // Добавление классов разделов к body для CSS селекторов
        self.updateBodyClasses = function() {
            var currentSection = self.getCurrentSection();
            var body = document.body;
            
            // Удаляем старые классы разделов
            body.classList.remove(
                'section-releases',
                'section-favorites', 
                'section-history',
                'section-torrents',
                'section-search'
            );
            
            // Добавляем новый класс в зависимости от раздела
            if (currentSection.includes("Релизы") || currentSection.includes("Releases")) {
                body.classList.add('section-releases');
            } else if (currentSection.includes("Избранное") || currentSection.includes("Favorites")) {
                body.classList.add('section-favorites');
            } else if (currentSection.includes("История") || currentSection.includes("History")) {
                body.classList.add('section-history');
            } else if (currentSection.includes("Торренты") || currentSection.includes("Torrents")) {
                body.classList.add('section-torrents');
            } else if (currentSection.includes("Поиск") || currentSection.includes("Search")) {
                body.classList.add('section-search');
            }
        };
        
        // Добавление/обновление стилей
        self.addStyles = function() {
            // Обновляем классы body для CSS селекторов
            self.updateBodyClasses();
            
            var css = self.generateCSS();
            var styleId = "captions-fix-styles";
            
            // Удаляем старый элемент если есть
            var oldStyle = document.getElementById(styleId);
            if (oldStyle) {
                oldStyle.remove();
            }
            
            // Создаём новый элемент
            var style = document.createElement("style");
            style.id = styleId;
            style.textContent = css;
            
            // Вставляем в самое начало head для максимального приоритета
            var head = document.head || document.getElementsByTagName('head')[0];
            if (head.firstChild) {
                head.insertBefore(style, head.firstChild);
            } else {
                head.appendChild(style);
            }
            
            self.styleElement = style;
            
            // Принудительно применяем стили к существующим карточкам
            setTimeout(self.applyToExistingCards, 50);
        };
        
        // Применение стилей к уже существующим карточкам
        self.applyToExistingCards = function() {
            var mode = self.getMode();
            var shouldShow = self.shouldShowInCurrentSection();
            
            $('.card:not(.card--collection)').each(function() {
                var $card = $(this);
                var $age = $card.find('.card__age');
                var $title = $card.find('.card__title');
                
                if (mode === 'show') {
                    // Показать везде
                    $age.css({
                        'display': 'block',
                        'opacity': '1',
                        'visibility': 'visible'
                    });
                    $title.css({
                        'display': 'block',
                        'opacity': '1',
                        'visibility': 'visible'
                    });
                } else if (mode === 'hide') {
                    // Скрыть везде
                    $age.css('display', 'none');
                    $title.css('display', 'none');
                } else if (mode === 'section') {
                    // По разделу
                    if (shouldShow) {
                        // Показать в этом разделе
                        $age.css({
                            'display': 'block',
                            'opacity': '1'
                        });
                        $title.css({
                            'display': 'block',
                            'opacity': '1'
                        });
                    } else {
                        // Скрыть в этом разделе
                        $age.css('display', 'none');
                        $title.css('display', 'none');
                    }
                }
            });
        };
        
        // Наблюдатель за изменениями DOM и переходами между разделами
        self.startObserver = function() {
            if (self.observer) return;
            
            // Наблюдатель за изменениями DOM
            self.observer = new MutationObserver(function(mutations) {
                var shouldUpdate = false;
                var sectionChanged = false;
                
                // Проверяем изменения заголовка (смена раздела)
                for (var i = 0; i < mutations.length; i++) {
                    var mutation = mutations[i];
                    
                    // Если меняется текст заголовка - сменился раздел
                    if (mutation.target.classList && 
                        (mutation.target.classList.contains('head__title') || 
                         mutation.type === 'characterData')) {
                        sectionChanged = true;
                    }
                    
                    // Если добавляются новые карточки
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        for (var j = 0; j < mutation.addedNodes.length; j++) {
                            var node = mutation.addedNodes[j];
                            if (node.nodeType === 1) {
                                if (node.classList && node.classList.contains('card')) {
                                    shouldUpdate = true;
                                    break;
                                }
                                if (node.querySelector && node.querySelector('.card')) {
                                    shouldUpdate = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                if (sectionChanged) {
                    // Раздел сменился - обновляем всё
                    setTimeout(function() {
                        self.updateBodyClasses();
                        self.addStyles();
                        self.applyToExistingCards();
                    }, 300);
                } else if (shouldUpdate) {
                    // Просто добавились новые карточки
                    setTimeout(self.applyToExistingCards, 100);
                }
            });
            
            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['class']
            });
            
            // Также слушаем события Lampa о смене активности
            if (Lampa.Listener) {
                Lampa.Listener.follow('activity', function(e) {
                    if (e.type === 'active' || e.type === 'start') {
                        setTimeout(function() {
                            self.updateBodyClasses();
                            self.addStyles();
                            self.applyToExistingCards();
                        }, 500);
                    }
                });
            }
        };
        
        // Очистка
        self.destroy = function() {
            if (self.styleElement) {
                self.styleElement.remove();
                self.styleElement = null;
            }
            if (self.observer) {
                self.observer.disconnect();
                self.observer = null;
            }
            if (self.checkInterval) {
                clearInterval(self.checkInterval);
                self.checkInterval = null;
            }
            window.captions_fix_plugin = false;
            console.log("[Captions Fix] Остановлен");
        };
    }
    
    // Создаём и запускаем плагин
    var plugin = new CaptionsFix();
    
    // Запускаем с задержкой
    setTimeout(function() {
        plugin.init();
    }, 2000);
    
    // Экспортируем для ручного управления
    window.CaptionsFixPlugin = plugin;
    
})();
