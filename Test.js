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
                        default: "auto",
                        values: {
                            "auto": "Авто (скрыть в новом интерфейсе)",
                            "show": "Показывать везде",
                            "hide": "Скрывать везде"
                        }
                    },
                    field: { 
                        name: "Отображение названий", 
                        description: "Управление названиями и годом под карточками" 
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
            return Lampa.Storage.get("captions_show_mode", "auto");
        };
        
        // Генерация CSS в зависимости от режима
        self.generateCSS = function() {
            var mode = self.getMode();
            var css = "/* Captions Fix Plugin */\n";
            
            switch(mode) {
                case "show":
                    // Показывать везде - переопределяем скрытие
                    css += `
                        .card:not(.card--collection) .card__age,
                        .card:not(.card--collection) .card__title {
                            display: block !important;
                            opacity: 1 !important;
                            visibility: visible !important;
                        }
                        
                        /* Отменяем все возможные скрытия */
                        .new-interface .card:not(.card--collection) .card__age,
                        .new-interface .card:not(.card--collection) .card__title,
                        body .card:not(.card--collection) .card__age,
                        body .card:not(.card--collection) .card__title {
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
                    
                case "auto":
                default:
                    // Авто: скрывать только в новом интерфейсе
                    css += `
                        /* В новом интерфейсе - скрыть */
                        .new-interface .card:not(.card--collection) .card__age,
                        .new-interface .card:not(.card--collection) .card__title {
                            display: none !important;
                        }
                        
                        /* Вне нового интерфейса - показать (с повышенным приоритетом) */
                        body:not(.new-interface) .card:not(.card--collection) .card__age,
                        body:not(.new-interface) .card:not(.card--collection) .card__title,
                        :not(.new-interface) .card:not(.card--collection) .card__age,
                        :not(.new-interface) .card:not(.card--collection) .card__title {
                            display: block !important;
                            opacity: 1 !important;
                            visibility: visible !important;
                        }
                    `;
                    break;
            }
            
            return css;
        };
        
        // Добавление/обновление стилей
        self.addStyles = function() {
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
            
            $('.card:not(.card--collection)').each(function() {
                var $card = $(this);
                var $age = $card.find('.card__age');
                var $title = $card.find('.card__title');
                
                if (mode === 'show') {
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
                    $age.css('display', 'none');
                    $title.css('display', 'none');
                } else if (mode === 'auto') {
                    // Проверяем, находится ли карточка в новом интерфейсе
                    var inNewInterface = $card.closest('.new-interface').length > 0;
                    if (inNewInterface) {
                        $age.css('display', 'none');
                        $title.css('display', 'none');
                    } else {
                        $age.css({
                            'display': 'block',
                            'opacity': '1'
                        });
                        $title.css({
                            'display': 'block',
                            'opacity': '1'
                        });
                    }
                }
            });
        };
        
        // Наблюдатель за изменениями DOM
        self.startObserver = function() {
            if (self.observer) return;
            
            self.observer = new MutationObserver(function(mutations) {
                var shouldUpdate = false;
                
                for (var i = 0; i < mutations.length; i++) {
                    var mutation = mutations[i];
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
                    if (shouldUpdate) break;
                }
                
                if (shouldUpdate) {
                    setTimeout(self.applyToExistingCards, 100);
                }
            });
            
            self.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
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
    
    // Перехватываем добавление стилей основным плагином
    var originalAppend = $.fn.append;
    $.fn.append = function() {
        var result = originalAppend.apply(this, arguments);
        
        // Проверяем, не добавляются ли стили основного плагина
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (typeof arg === 'string' && arg.indexOf('hide_captions') !== -1) {
                // Основной плагин добавил свои стили - обновляем наши
                setTimeout(plugin.addStyles, 100);
            }
        }
        
        return result;
    };
    
    // Экспортируем для ручного управления
    window.CaptionsFixPlugin = plugin;
    
})();
