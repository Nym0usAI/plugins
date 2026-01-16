(function () {
    "use strict";
    
    // Проверяем, загружена ли Lampa
    if (typeof Lampa === "undefined") return;
    
    // Проверяем, не запущен ли уже этот плагин
    if (window.plugin_captions_fix) return;
    window.plugin_captions_fix = true;
    
    console.log("[Captions Fix Plugin] Инициализация...");
    
    // Основная функция плагина
    function CaptionsFixPlugin() {
        var self = this;
        self.stylesAdded = false;
        self.currentStyle = null;
        
        // Инициализация
        self.init = function() {
            // Ждём загрузки Lampa
            if (!Lampa.Storage || !Lampa.Template) {
                setTimeout(self.init, 100);
                return;
            }
            
            // Добавляем настройку в интерфейс
            addSetting();
            
            // Добавляем стили
            addStyles();
            
            // Слушаем изменения настроек
            Lampa.Storage.listener.follow('change', function(e) {
                if (e.name === 'show_captions_everywhere') {
                    updateStyles();
                }
            });
            
            console.log("[Captions Fix Plugin] Запущен");
        };
        
        // Добавление настройки
        function addSetting() {
            // Ждём готовности SettingsApi
            if (!Lampa.SettingsApi || !Lampa.SettingsApi.addParam) {
                setTimeout(addSetting, 100);
                return;
            }
            
            // Добавляем параметр в настройки интерфейса
            Lampa.SettingsApi.addParam({
                component: "interface",
                param: { 
                    name: "show_captions_everywhere", 
                    type: "trigger", 
                    default: false 
                },
                field: { 
                    name: "Показывать названия везде", 
                    description: "Отображать названия и год фильмов во всех разделах" 
                },
                onRender: function (item) {
                    // Размещаем после настройки размера интерфейса
                    item.css("opacity", "0");
                    requestAnimationFrame(function () {
                        var target = $('div[data-name="interface_size"]');
                        if (target.length) {
                            item.insertAfter(target);
                        } else {
                            // Ищем вручную
                            var interfaceItems = $('[data-component="interface"] .selector--settings');
                            if (interfaceItems.length > 1) {
                                item.insertAfter(interfaceItems.eq(1));
                            } else {
                                item.appendTo('[data-component="interface"] .settings__list');
                            }
                        }
                        item.css("opacity", "");
                    });
                },
                onChange: function(value) {
                    // Обновляем стили при изменении настройки
                    updateStyles();
                }
            });
        }
        
        // Добавление CSS стилей
        function addStyles() {
            if (self.stylesAdded) return;
            
            var styleId = "captions-fix-styles";
            
            // Удаляем старые стили если есть
            $("#" + styleId).remove();
            
            // Создаём элемент стилей
            var styleElement = document.createElement("style");
            styleElement.id = styleId;
            styleElement.textContent = getStyles();
            
            // Добавляем в head
            document.head.appendChild(styleElement);
            
            self.stylesAdded = true;
            self.currentStyle = styleElement;
            
            console.log("[Captions Fix Plugin] Стили добавлены");
        }
        
        // Генерация CSS стилей
        function getStyles() {
            var showEverywhere = Lampa.Storage.get("show_captions_everywhere", false);
            
            if (showEverywhere) {
                // Показывать везде - убираем скрытие
                return `
                    /* Captions Fix Plugin - Показывать названия везде */
                    .new-interface .card:not(.card--collection) .card__age,
                    .new-interface .card:not(.card--collection) .card__title {
                        display: block !important;
                    }
                `;
            } else {
                // Скрывать только в новом интерфейсе (по умолчанию)
                return `
                    /* Captions Fix Plugin - Скрывать только в новом интерфейсе */
                    .new-interface .card:not(.card--collection) .card__age,
                    .new-interface .card:not(.card--collection) .card__title {
                        display: none !important;
                    }
                    
                    /* Гарантированно показывать вне нового интерфейса */
                    body:not(.new-interface) .card:not(.card--collection) .card__age,
                    body:not(.new-interface) .card:not(.card--collection) .card__title {
                        display: block !important;
                    }
                `;
            }
        }
        
        // Обновление стилей
        function updateStyles() {
            if (!self.currentStyle) {
                addStyles();
                return;
            }
            
            self.currentStyle.textContent = getStyles();
            console.log("[Captions Fix Plugin] Стили обновлены");
        }
        
        // Уничтожение плагина
        self.destroy = function() {
            if (self.currentStyle) {
                self.currentStyle.remove();
                self.currentStyle = null;
            }
            window.plugin_captions_fix = false;
            console.log("[Captions Fix Plugin] Остановлен");
        };
    }
    
    // Создаём и запускаем плагин
    var plugin = new CaptionsFixPlugin();
    
    // Запускаем при полной загрузке
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            setTimeout(plugin.init, 1000);
        });
    } else {
        setTimeout(plugin.init, 1000);
    }
    
    // Экспортируем для ручного управления
    window.CaptionsFixPlugin = plugin;
    
})();