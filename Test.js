(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v4) return;
    window.captions_fix_plugin_v4 = true;
    
    console.log("[Captions Fix v4] Плагин запущен");
    
    function CaptionsFix() {
        var self = this;
        self.initialized = false;
        self.styleElement = null;
        self.observer = null;
        self.lastDecision = null;

        // Все подпункты избранного
        self.FAVORITE_SUBSECTIONS = ['book','scheduled','wath','like','look','viewed','thrown','continued'];
        
        self.init = function() {
            if (self.initialized) return;
            if (!document.body) {
                requestAnimationFrame(self.init);
                return;
            }
            
            self.addStyles();
            self.startObserver();
            self.checkAndUpdate();
            
            self.initialized = true;
            console.log("[Captions Fix v4] Инициализирован");
        };
        
        // Проверяем, показывать ли надписи
        self.shouldShowCaptions = function() {
            try {
                var search = window.location.search.toLowerCase();
                var bodyClass = document.body.className.toLowerCase();
                var hash = window.location.hash.toLowerCase();

                // Берём текущую Activity Лампы
                var activity = Lampa.Activity && Lampa.Activity.active ? Lampa.Activity.active() : null;
                var activeType = (activity && activity.type) ? activity.type.toLowerCase() : '';
                var activeComponent = (activity && activity.component) ? activity.component.toLowerCase() : '';

                // 1️⃣ Любой подпункт Избранного или bookmarks — показываем
                if ((activeComponent === 'favorite' && self.FAVORITE_SUBSECTIONS.includes(activeType)) ||
                    (activeComponent === 'bookmarks')) {
                    return true;
                }

                // 2️⃣ Страница карточки фильма/сериала
                if (search.includes('card=') && (search.includes('media=movie') || search.includes('media=tv'))) {
                    return true;
                }

                // 3️⃣ Страница поиска
                if (search.includes('query=') || bodyClass.includes('search')) {
                    return true;
                }

                // 4️⃣ Страницы актёров/режиссёров — скрываем
                if (search.includes('component=actor') || search.includes('job=acting') || search.includes('job=director')) {
                    return false;
                }

            } catch(e) {
                console.error("[Captions Fix v4] Ошибка shouldShowCaptions:", e);
            }

            return false; // остальные разделы скрываем
        };
        
        self.generateCSS = function() {
            var decision = self.shouldShowCaptions();

            if (decision === self.lastDecision) return self.styleElement ? self.styleElement.textContent : '';
            self.lastDecision = decision;

            if (decision) {
                return `
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                `;
            } else {
                return `
                    body .card:not(.card--collection) .card__age,
                    body .card:not(.card--collection) .card__title {
                        display: none !important;
                    }
                `;
            }
        };

        self.checkAndUpdate = function() {
            self.addStyles();
            self.applyToCards();
        };
        
        self.addStyles = function() {
            var css = self.generateCSS();
            if (!css) return;
            
            var styleId = "captions-fix-styles-v4";
            var oldStyle = document.getElementById(styleId);
            if (oldStyle) oldStyle.remove();
            
            var style = document.createElement("style");
            style.id = styleId;
            style.textContent = css;
            var head = document.head || document.getElementsByTagName('head')[0];
            head.insertBefore(style, head.firstChild);
            
            self.styleElement = style;
        };
        
        self.applyToCards = function() {
            var show = self.shouldShowCaptions();
            var cards = document.querySelectorAll('.card:not(.card--collection)');
            cards.forEach(function(card) {
                var age = card.querySelector('.card__age');
                var title = card.querySelector('.card__title');
                if (age) age.style.display = show ? 'block' : 'none';
                if (title) title.style.display = show ? 'block' : 'none';
            });
        };
        
        self.startObserver = function() {
            if (self.observer) return;
            self.observer = new MutationObserver(self.checkAndUpdate);
            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        };
    }
    
    var plugin = new CaptionsFix();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            plugin.init();
        });
    } else {
        plugin.init();
    }
    
    window.CaptionsFixPlugin = plugin;
    window.debugCaptions = function() {
        var activity = Lampa.Activity && Lampa.Activity.active ? Lampa.Activity.active() : {};
        return {
            section: activity.title || '',
            component: activity.component || '',
            type: activity.type || '',
            show: plugin.shouldShowCaptions()
        };
    };
})();
