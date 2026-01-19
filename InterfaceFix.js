(function () {
    'use strict';

    if (typeof Lampa === 'undefined') return;
    if (window.captions_fix_plugin_v2) return;
    window.captions_fix_plugin_v2 = true;

    /* ==================================================
       PART 1: CAPTIONS FIX (titles + age) — NO FLICKER
    ================================================== */

    function CaptionsFix() {
        var self = this;
        self.observer = null;
        self.lastDecision = null;

        self.FAVORITE_SUBSECTIONS = [
            'book','scheduled','wath','like','look','viewed','thrown','continued'
        ];

        self.SECTION_KEYWORDS = {
            releases: ['релиз','release','новинк'],
            favorites: ['избранн','favorit','закладк','bookmark'],
            history: ['истори','histor','просмотр','watch'],
            torrents: ['торрент','torrent','загрузк','download']
        };

        self.getCurrentSection = function () {
            try {
                var title = document.querySelector('.head__title');
                if (title && title.textContent) return title.textContent.trim();

                var act = Lampa.Activity?.active?.();
                if (act?.title) return act.title;
                if (act?.name) return act.name;
            } catch (e) {}
            return '';
        };

        self.detectSectionType = function (name) {
            if (!name) return '';
            name = name.toLowerCase();

            for (var k in self.SECTION_KEYWORDS) {
                for (var i = 0; i < self.SECTION_KEYWORDS[k].length; i++) {
                    if (name.includes(self.SECTION_KEYWORDS[k][i])) return k;
                }
            }
            return '';
        };

        self.shouldShowCaptions = function () {
            try {
                var search = location.search.toLowerCase();
                var bodyClass = document.body.className.toLowerCase();
                var params = new URLSearchParams(location.search);

                var type = params.get('type')?.toLowerCase() || '';
                var comp = params.get('component')?.toLowerCase() || '';

                var act = Lampa.Activity?.active?.();
                var actType = act?.type?.toLowerCase() || '';
                var actComp = act?.component?.toLowerCase() || '';

                /* FAVORITES */
                if (
                    (comp === 'favorite' && self.FAVORITE_SUBSECTIONS.includes(type)) ||
                    (actComp === 'favorite' && self.FAVORITE_SUBSECTIONS.includes(actType)) ||
                    comp === 'bookmarks' ||
                    actComp === 'bookmarks'
                ) return true;

                /* CARD */
                if (
                    search.includes('card=') &&
                    (search.includes('media=movie') || search.includes('media=tv'))
                ) return true;

                /* SEARCH */
                if (
                    search.includes('query=') ||
                    search.includes('component=search') ||
                    bodyClass.includes('search') ||
                    actComp === 'search'
                ) return true;

                /* ACTORS / DIRECTORS — HIDE */
                if (
                    search.includes('component=actor') ||
                    search.includes('job=acting') ||
                    search.includes('job=director')
                ) return false;

                /* OTHER SECTIONS */
                return self.detectSectionType(self.getCurrentSection()) !== '';

            } catch (e) {
                return false;
            }
        };

        self.applyStyles = function () {
            var show = self.shouldShowCaptions();
            if (show === self.lastDecision) return;
            self.lastDecision = show;

            var id = 'lampa-interface-fix-captions';
            document.getElementById(id)?.remove();

            var style = document.createElement('style');
            style.id = id;

            style.textContent = `
.card:not(.card--collection) .card__title,
.card:not(.card--collection) .card__age {
    visibility: ${show ? 'visible' : 'hidden'} !important;
    opacity: ${show ? '1' : '0'} !important;
    height: ${show ? 'auto' : '0'} !important;
    overflow: hidden !important;
    pointer-events: none !important;
}
            `;

            document.head.appendChild(style);
        };

        self.startObserver = function () {
            if (self.observer) return;

            self.observer = new MutationObserver(self.applyStyles);
            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        };

        self.init = function () {
            if (!document.body) {
                requestAnimationFrame(self.init);
                return;
            }
            self.startObserver();
            self.applyStyles();
            console.log('[Lampa Interface Fix] CaptionsFix loaded (no flicker)');
        };
    }

    new CaptionsFix().init();

    /* ==================================================
       PART 2: INTERFACE EXTENDED
    ================================================== */

    function waitSettings(cb) {
        if (Lampa.SettingsApi && Lampa.Storage) cb();
        else setTimeout(() => waitSettings(cb), 300);
    }

    waitSettings(function () {
        if (window.lampa_interface_extended) return;
        window.lampa_interface_extended = true;

        /* Ribbon position */
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'RibbonPosition',
                type: 'select',
                values: { high: 'Высоко', middle: 'Средне', low: 'Низко' },
                default: 'middle'
            },
            field: { name: 'Положение ленты' },
            onChange: applyRibbon
        });

        /* Description lines */
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'description_lines_fix',
                type: 'select',
                values: {
                    1: '1 строка',
                    2: '2 строки',
                    3: '3 строки',
                    4: '4 строки',
                    5: '5 строк'
                },
                default: 5
            },
            field: { name: 'Описание: строки' },
            onChange: applyDescription
        });

        function applyRibbon() {
            const val = Lampa.Storage.field('RibbonPosition');
            const map = { high: 16, middle: 20, low: 24 };

            document.getElementById('lampa-ribbon-fix')?.remove();
            const s = document.createElement('style');
            s.id = 'lampa-ribbon-fix';
            s.textContent = `
.new-interface-info {
    height: ${map[val] || 20}em !important;
}`;
            document.head.appendChild(s);
        }

        function applyDescription() {
            const lines = Number(Lampa.Storage.field('description_lines_fix') || 5);

            document.getElementById('lampa-desc-fix')?.remove();
            const s = document.createElement('style');
            s.id = 'lampa-desc-fix';
            s.textContent = `
.new-interface-info__description {
    display: -webkit-box !important;
    -webkit-line-clamp: ${lines} !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
}`;
            document.head.appendChild(s);
        }

        applyRibbon();
        applyDescription();

        Lampa.Listener.follow('activity', applyDescription);
        Lampa.Listener.follow('full', applyRibbon);
    });

})();
