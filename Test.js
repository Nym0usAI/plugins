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
        
        // Определяем, показывать ли надписи
        self.shouldShowCaptions = function() {
            try {
                var searchParams = new URLSearchParams(window.location.search);
                var typeParam = (searchParams.get('type') || '').toLowerCase();
                var compParam = (searchParams.get('component') || '').toLowerCase();
                var bodyClass = document.body.className.toLowerCase();

                // Берём активную Activity
                var activity = Lampa.Activity && Lampa.Activity.active ? Lampa.Activity.active() : null;
                var activeType = (activity && activity.type) ? activity.type.toLowerCase() : '';
                var activeComponent = (activity && activity.component) ? activity.component.toLowerCase() : '';

                // 1️⃣ Любой подпункт Избранного или bookmarks
                if (
                    (compParam === 'favorite' && self.FAVORITE_SUBSECTIONS.includes(typeParam)) ||
                    (activeComponent === 'favorite' && self.FAVORITE_SUBSECTIONS.includes(activeType)) ||
                    (compParam === 'bookmarks') ||
                    (activeComponent === 'bookmarks')
                ) return true;

                // 2️⃣ Страница релизов — показываем
                if (compParam === 'release' || activeComponent === 'release') return true;

                // 3️⃣ Страница карточки фильма/сериала
                if (window.location.search.toLowerCase().includes('card=') &&
                    (window.location.search.toLowerCase().includes('media=movie') || window.location.search.toLowerCase().includes('media=tv'))
                ) return true;

                // 4️⃣ Страница поиска
                if (bodyClass.includes('search') || window.location.search.toLowerCase().includes('query=')) return true;

                // 5️⃣ Страницы актёров/режиссёров — скрываем
                if (window.location.search.toLowerCase().includes('component=actor') ||
                    window.location.search.toLowerCase().includes('job=acting') ||
                    window.location.search.toLowerCase().includes('job=director')
                ) return false;

            } catch(e) {
                console.error("[Captions Fix v4] Ошибка shouldShowCaptions:", e);
            }

            return false;
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
