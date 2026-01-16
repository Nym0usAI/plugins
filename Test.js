(function () {
    "use strict";

    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v4) return;
    window.captions_fix_plugin_v4 = true;

    function CaptionsFix() {
        var self = this;
        self.lastMode = null;

        self.SECTION_KEYWORDS = [
            'релиз', 'release',
            'избран', 'favorite',
            'истор', 'history',
            'торрент', 'torrent',
            'поиск', 'search'
        ];

        self.isMoviePage = function () {
            return !!(
                document.querySelector('.full-start, .card__view, .player') ||
                location.hash.includes('card')
            );
        };

        self.shouldShowList = function () {
            var text = (
                (document.querySelector('.head__title')?.textContent || '') +
                document.body.className +
                location.hash
            ).toLowerCase();

            return self.SECTION_KEYWORDS.some(k => text.includes(k));
        };

        self.updateCSS = function () {
            var showList = self.shouldShowList();
            var moviePage = self.isMoviePage();

            var mode = showList || moviePage ? 'show' : 'hide';
            if (mode === self.lastMode) return;
            self.lastMode = mode;

            var css = `
            body .card:not(.card--collection) .card__title,
            body .card:not(.card--collection) .card__age {
                display: ${mode === 'show' ? 'block' : 'none'} !important;
                opacity: ${mode === 'show' ? '1' : '0'} !important;
                visibility: ${mode === 'show' ? 'visible' : 'hidden'} !important;
            }`;

            var style = document.getElementById('captions-fix-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'captions-fix-style';
                document.head.appendChild(style);
            }
            style.textContent = css;
        };

        self.observe = function () {
            self.updateCSS();
            new MutationObserver(self.updateCSS).observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        };
    }

    var plugin = new CaptionsFix();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', plugin.observe);
    } else {
        plugin.observe();
    }

})();
