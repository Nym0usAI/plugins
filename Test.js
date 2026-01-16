(function () {
    "use strict";

    if (typeof Lampa === "undefined") return;
    if (window.captions_fix_plugin_v3) return;
    window.captions_fix_plugin_v3 = true;

    console.log("[Captions Fix v3] Запущен");

    function CaptionsFix() {
        var self = this;
        self.lastMode = null;

        // Ключевые слова разрешённых разделов
        self.SECTION_KEYWORDS = [
            'релиз', 'release',
            'избран', 'favorite',
            'истор', 'history',
            'торрент', 'torrent',
            'поиск', 'search'
        ];

        // Быстрое определение: показывать или нет
        self.shouldShow = function () {
            try {
                var text = (
                    (document.querySelector('.head__title')?.textContent || '') +
                    document.body.className +
                    location.hash
                ).toLowerCase();

                return self.SECTION_KEYWORDS.some(k => text.includes(k));
            } catch (e) {
                return false;
            }
        };

        // Мгновенная генерация CSS
        self.updateCSS = function () {
            var mode = self.shouldShow() ? 'show' : 'hide';
            if (mode === self.lastMode) return;
            self.lastMode = mode;

            var css = mode === 'show'
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

            var style = document.getElementById('captions-fix-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'captions-fix-style';
                document.head.appendChild(style);
            }
            style.textContent = css;
        };

        // Observer — реагирует сразу при рендере
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

    // 🔥 ИНИЦИАЛИЗАЦИЯ БЕЗ ЗАДЕРЖКИ
    var plugin = new CaptionsFix();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', plugin.observe);
    } else {
        plugin.observe();
    }

})();
