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

        self.SECTION_KEYWORDS = {
            'releases': ['релиз', 'release', 'новинк'],
            'favorites': ['избранн', 'favorit'],
            'history': ['истори', 'histor'],
            'torrents': ['торрент', 'torrent'],
            'search': ['поиск', 'search']
        };

        self.init = function () {
            if (self.initialized) return;
            if (!document.body) return;

            self.addStyles();
            self.startObserver();

            self.lastSection = self.getCurrentSection();
            self.initialized = true;

            console.log("[Captions Fix v2] Инициализирован БЕЗ задержки");
        };

        self.getCurrentSection = function () {
            try {
                var title = document.querySelector('.head__title');
                if (title && title.textContent) return title.textContent.trim();

                var hash = location.hash.toLowerCase();
                if (hash.includes('card')) return 'card';

                return document.body.className;
            } catch (e) {
                return '';
            }
        };

        self.shouldShowCaptions = function () {
            var text = (
                self.getCurrentSection() +
                location.hash +
                document.body.className
            ).toLowerCase();

            for (var k in self.SECTION_KEYWORDS) {
                for (var i = 0; i < self.SECTION_KEYWORDS[k].length; i++) {
                    if (text.includes(self.SECTION_KEYWORDS[k][i])) {
                        return true;
                    }
                }
            }

            // ✅ ВСЕГДА показываем в карточке фильма
            if (location.hash.includes('card')) return true;

            return false;
        };

        self.generateCSS = function () {
            return self.shouldShowCaptions()
                ? `
                body .card:not(.card--collection) .card__title,
                body .card:not(.card--collection) .card__age {
                    display: block !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                }`
                : `
                body .card:not(.card--collection) .card__title,
                body .card:not(.card--collection) .card__age {
                    display: none !important;
                }`;
        };

        self.addStyles = function () {
            var css = self.generateCSS();
            var id = "captions-fix-style";

            var style = document.getElementById(id);
            if (!style) {
                style = document.createElement("style");
                style.id = id;
                document.head.appendChild(style);
            }
            style.textContent = css;
        };

        self.startObserver = function () {
            if (self.observer) return;

            self.observer = new MutationObserver(function () {
                var section = self.getCurrentSection();
                if (section !== self.lastSection) {
                    self.lastSection = section;
                    self.addStyles();
                }
            });

            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        };
    }

    var plugin = new CaptionsFix();

    // 🚀 МГНОВЕННЫЙ СТАРТ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', plugin.init);
    } else {
        plugin.init();
    }

})();
