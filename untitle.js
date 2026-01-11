(function () {
  'use strict';

  var config = {
    version: '2.0.6-soft-bg',
    name: 'Torrent Styles MOD (Soft Background)',
    pluginId: 'torrent_styles_mod'
  };

  var TH = {
    seeds: {
      danger_below: 6,
      top_from: 21
    },
    bitrate: {
      warn_from: 46,
      danger_from: 66
    }
  };

  var styles = {
    /* BASE */
    '.torrent-item__bitrate > span.ts-bitrate, .torrent-item__seeds > span.ts-seeds, .torrent-item__grabs > span.ts-grabs, .torrent-item__size.ts-size': {
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'min-height': '1.7em',
      padding: '0.15em 0.45em',
      'border-radius': '0.5em',
      'font-weight': '700',
      'font-size': '0.9em',
      'white-space': 'nowrap',
      'background-color': '#f2f3f5'
    },

    /* SEEDS */
    '.torrent-item__seeds > span.ts-seeds': {
      color: '#ffc371',
      border: '0.15em solid #ffc371'
    },
    '.torrent-item__seeds > span.low-seeds': {
      color: '#ff5f6d',
      border: '0.15em solid #ff5f6d'
    },
    '.torrent-item__seeds > span.high-seeds': {
      color: '#43cea2',
      border: '0.15em solid #43cea2'
    },

    /* BITRATE */
    '.torrent-item__bitrate > span.ts-bitrate': {
      color: '#43cea2',
      border: '0.15em solid #43cea2'
    },
    '.torrent-item__bitrate > span.high-bitrate': {
      color: '#ffc371',
      border: '0.15em solid #ffc371'
    },
    '.torrent-item__bitrate > span.very-high-bitrate': {
      color: '#ff5f6d',
      border: '0.15em solid #ff5f6d'
    },

    /* SIZE — ALWAYS PURPLE */
    '.torrent-item__size.ts-size': {
      color: '#b983ff',
      border: '0.15em solid #b983ff'
    },

    /* PEERS / GRABS — ALWAYS STRONG BLUE */
    '.torrent-item__grabs > span.ts-grabs': {
      color: '#4db6ff',
      border: '0.15em solid #4db6ff'
    }
  };

  function injectStyles() {
    var style = document.createElement('style');
    style.innerHTML = Object.keys(styles).map(function (s) {
      return s + '{' + Object.keys(styles[s]).map(function (p) {
        return p + ':' + styles[s][p] + '!important';
      }).join(';') + '}';
    }).join('\n');
    document.head.appendChild(style);
  }

  function updateTorrentStyles() {
    document.querySelectorAll('.torrent-item__seeds span').forEach(function (s) {
      var v = parseInt(s.textContent) || 0;
      s.className = 'ts-seeds';
      if (v < TH.seeds.danger_below) s.classList.add('low-seeds');
      else if (v >= TH.seeds.top_from) s.classList.add('high-seeds');
    });

    document.querySelectorAll('.torrent-item__bitrate span').forEach(function (s) {
      var v = parseFloat(s.textContent) || 0;
      s.className = 'ts-bitrate';
      if (v >= TH.bitrate.danger_from) s.classList.add('very-high-bitrate');
      else if (v >= TH.bitrate.warn_from) s.classList.add('high-bitrate');
    });

    document.querySelectorAll('.torrent-item__grabs span').forEach(function (s) {
      s.className = 'ts-grabs';
    });

    document.querySelectorAll('.torrent-item__size').forEach(function (s) {
      s.className = 'torrent-item__size ts-size';
    });
  }

  injectStyles();
  new MutationObserver(updateTorrentStyles).observe(document.body, {
    childList: true,
    subtree: true
  });
  updateTorrentStyles();

})();
