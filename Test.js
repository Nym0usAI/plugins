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

        self.SHOW_IN_SECTIONS = [
            "Релизы", "Releases", "релизы", "releases",
            "Избранное", "Favorites", "Избранное", "favorites",
            "История", "History", "история", "history",
            "Торренты", "Torrents", "торренты", "torrents",
            "Поиск", "Search", "поиск", "search"
        ];

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

            console.log("[Captions Fix v2] Инициализирован БЕЗ задержки");
        };

        self.getCurrentSection = function () {
            var section = "";

            try {
                var headerTitle = document.querySelector('.head__title');
                if (headerTitle && headerTitle.textContent) {
                    section = headerTitle.textContent.trim();
                    if (section) return section;
                }

                if (Lampa.Activity && Lampa.Activity.active) {
                    var activity = Lampa.Activity.active();
                    if (activity) {
                        if (activity.title) section = activity.title;
                        else if (activity.name) section = activity.name;
                        else if (activity.component && activity.component.title) {
                            section = activity.component.title;
                        }
                        if (section) return section;
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

            } catch (e) {}

            return section || "";
        };

        self.detectSectionType = function (sectionName) {
            if (!sectionName) return '';
            var name = sectionName.toLowerCase();

            for (var type in self.SECTION_KEYWORDS) {
                var keywords = self.SECTION_KEYWORDS[type];
                for (var i = 0; i < keywords.length; i++) {
                    if (name.includes(keywords[i])) return type;
                }
            }
            return '';
        };

        self.shouldShowCaptions = function () {
            var section = self.getCurrentSection();
            return self.detectSectionType(section) !== '';
        };

        self.generateCSS = function () {
            return self.shouldShowCaptions()
                ? `
                body .card:not(.card--collection) .card__age,
                body .card:not(.card--collection) .card__title {
                    display: block !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                }`
                : `
                body .card:not(.card--collection) .card__age,
                body .card:not(.card--collection) .card__title {
                    display: none !important;
                }`;
        };

        self.addStyles = function () {
            var css = self.generateCSS();
            var id = "captions-fix-styles-v2";

            var old = document.getElementById(id);
            if (old) old.remove();

            var style = document.createElement("style");
            style.id = id;
            style.textContent = css;
            document.head.insertBefore(style, document.head.firstChild);

            self.styleElement = style;
        };

        self.checkAndUpdate = function () {
            var current = self.getCurrentSection();
            if (current !== self.lastSection) {
                self.lastSection = current;
                self.addStyles();
            }
        };

        self.startObserver = function () {
            if (self.observer) return;

            self.observer = new MutationObserver(function () {
                self.checkAndUpdate(); // ⬅ БЕЗ ЗАДЕРЖКИ
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

    // 🚀 СТАРТ СРАЗУ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            plugin.init();
        });
    } else {
        plugin.init();
    }

})();
