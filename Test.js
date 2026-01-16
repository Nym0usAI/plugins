(function () {
    "use strict";

    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v3) return;
    window.captions_fix_plugin_v3 = true;

    console.log("[Captions Fix v3] Плагин запущен");

    function CaptionsFix() {
        var self = this;
        self.initialized = false;
        self.styleElement = null;
        self.observer = null;
        self.lastSection = "";

        self.SECTION_KEYWORDS = {
            'releases': ['релиз', 'release', 'новинк'],
            'favorites': ['избранн', 'favorit', 'закладк', 'bookmark'],
            'history': ['истори', 'histor', 'просмотр', 'watch'],
            'torrents': ['торрент', 'torrent', 'загрузк', 'download'],
            'search': ['поиск', 'search', 'искан', 'find']
        };

        self.init = function () {
            if (self.initialized) return;
            if (!document.body) return;

            self.addStyles();
            self.startObserver();

            self.lastSection = self.getCurrentSection();
            self.initialized = true;

            console.log("[Captions Fix v3] Инициализирован без задержек");
        };

        self.getCurrentSection = function () {
            try {
                var header = document.querySelector('.head__title');
                if (header && header.textContent) {
                    return header.textContent.trim();
                }

                if (Lampa.Activity && Lampa.Activity.active) {
                    var a = Lampa.Activity.active();
                    if (a) {
                        return a.title || a.name || '';
                    }
                }

                var hash = location.hash.toLowerCase();
                if (hash.includes('release')) return 'Релизы';
                if (hash.includes('favorite')) return 'Избранное';
                if (hash.includes('history')) return 'История';
                if (hash.includes('torrent')) return 'Торренты';
                if (hash.includes('search')) return 'Поиск';

            } catch (e) {}

            return '';
        };

        self.detectSectionType = function (section) {
            if (!section) return '';
            section = section.toLowerCase();

            for (var key in self.SECTION_KEYWORDS) {
                var words = self.SECTION_KEYWORDS[key];
                for (var i = 0; i < words.length; i++) {
                    if (section.includes(words[i])) return key;
                }
            }
            return '';
        };

        self.shouldShowCaptions = function () {
            return self.detectSectionType(self.getCurrentSection()) !== '';
        };

        self.generateCSS = function () {
            return self.shouldShowCaptions()
                ? `
                body .card--simple .card__title,
                body .card--simple .card__age {
                    display: block !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                }`
                : `
                body .card--simple .card__title,
                body .card--simple .card__age {
                    display: none !important;
                }`;
        };

        self.addStyles = function () {
            var id = 'captions-fix-style-v3';
            var old = document.getElementById(id);
            if (old) old.remove();

            var style = document.createElement('style');
            style.id = id;
            style.textContent = self.generateCSS();
            document.head.appendChild(style);
            self.styleElement = style;
        };

        self.checkAndUpdate = function () {
            var section = self.getCurrentSection();
            if (section !== self.lastSection) {
                self.lastSection = section;
                self.addStyles();
            }
        };

        self.startObserver = function () {
            if (self.observer) return;

            self.observer = new MutationObserver(function () {
                self.checkAndUpdate();
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            plugin.init();
        });
    } else {
        plugin.init();
    }

})();
