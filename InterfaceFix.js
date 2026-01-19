(function () {
  'use strict';

  if (typeof Lampa === 'undefined') return;

  /* ==================================================
     PART 1: CAPTIONS FIX
  ================================================== */

  if (!window.captions_fix_plugin_v2) {
    window.captions_fix_plugin_v2 = true;

    function CaptionsFix() {
      var self = this;
      self.initialized = false;
      self.styleElement = null;
      self.observer = null;
      self.lastDecision = null;

      self.FAVORITE_SUBSECTIONS = [
        'book','scheduled','wath','like','look','viewed','thrown','continued'
      ];

      self.SECTION_KEYWORDS = {
        releases: ['релиз','release','новинк'],
        favorites: ['избранн','favorit','закладк','bookmark'],
        history: ['истори','histor','просмотр','watch'],
        torrents: ['торрент','torrent','загрузк','download'],
        search: ['поиск','search','искан','find']
      };

      self.init = function () {
        if (self.initialized) return;
        if (!document.body) {
          requestAnimationFrame(self.init);
          return;
        }
        self.startObserver();
        self.checkAndUpdate();
        self.initialized = true;
        console.log('[Lampa Interface Fix] CaptionsFix initialized');
      };

      self.getCurrentSection = function () {
        try {
          var title = document.querySelector('.head__title');
          if (title && title.textContent) return title.textContent.trim();

          if (Lampa.Activity && Lampa.Activity.active) {
            var a = Lampa.Activity.active();
            if (a?.title) return a.title;
            if (a?.name) return a.name;
          }
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
          var params = new URLSearchParams(location.search);

          var type = params.get('type')?.toLowerCase() || '';
          var comp = params.get('component')?.toLowerCase() || '';

          var act = Lampa.Activity?.active?.();
          var actType = act?.type?.toLowerCase() || '';
          var actComp = act?.component?.toLowerCase() || '';

          if (
            (comp === 'favorite' && self.FAVORITE_SUBSECTIONS.includes(type)) ||
            (actComp === 'favorite' && self.FAVORITE_SUBSECTIONS.includes(actType)) ||
            comp === 'bookmarks' || actComp === 'bookmarks'
          ) return true;

          if (search.includes('card=') &&
              (search.includes('media=movie') || search.includes('media=tv')))
            return true;

          if (search.includes('query=')) return true;

          if (search.includes('component=actor')) return false;

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
            display: ${show ? 'block' : 'none'} !important;
          }
        `;
        document.head.appendChild(style);
      };

      self.checkAndUpdate = function () {
        self.applyStyles();
      };

      self.startObserver = function () {
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

    new CaptionsFix().init();
  }

  /* ==================================================
     PART 2: INTERFACE EXTENDED (Ribbon + Description)
  ================================================== */

  function waitLampaSettings(cb) {
    if (Lampa.SettingsApi && Lampa.Storage) cb();
    else setTimeout(() => waitLampaSettings(cb), 300);
  }

  waitLampaSettings(function () {

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
        values: { 1:'1',2:'2',3:'3',4:'4',5:'5' },
        default: 5
      },
      field: { name: 'Описание: строки' },
      onChange: applyDescription
    });

    function applyRibbon() {
      const val = Lampa.Storage.field('RibbonPosition');
      const map = { high:16, middle:20, low:24 };

      document.getElementById('lampa-ribbon-fix')?.remove();
      const s = document.createElement('style');
      s.id = 'lampa-ribbon-fix';
      s.textContent = `
        .new-interface-info {
          height: ${map[val] || 20}em !important;
        }
      `;
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
        }
      `;
      document.head.appendChild(s);
    }

    applyRibbon();
    applyDescription();

    Lampa.Listener.follow('activity', applyDescription);
    Lampa.Listener.follow('full', applyRibbon);
  });

})();
