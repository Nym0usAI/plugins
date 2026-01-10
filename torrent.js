(function () {
  'use strict';

  var config = {
    version: '2.0.1-custom',
    name: 'Torrent Styles MOD (Custom)',
    pluginId: 'torrent_styles_mod'
  };

  var TH = {
    seeds: {
      danger_below: 6, // 0–5 red
      good_from: 21,   // 21+ green
      top_from: 21
    },
    bitrate: {
      warn_from: 46,   // 46–65 gold
      danger_from: 66  // 66+ red
    },
    size: {
      low_bad_to_gb: 5,      // 0–5 red
      gold_small_to_gb: 10,  // 6–10 gold
      green_to_gb: 50,       // 11–50 green
      gold_big_to_gb: 65     // 51–65 gold
    },
    debounce_ms: 60
  };

  var styles = {
    '.torrent-item__bitrate > span.ts-bitrate, .torrent-item__seeds > span.ts-seeds, .torrent-item__grabs > span.ts-grabs, .torrent-item__size.ts-size': {
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'min-height': '1.7em',
      padding: '0.15em 0.45em',
      'border-radius': '0.5em',
      'font-weight': '700',
      'font-size': '0.9em',
      'white-space': 'nowrap'
    },

    '.torrent-item__seeds > span.ts-seeds': {
      color: '#ffc371',
      'background-color': 'rgba(255,195,113,0.15)',
      border: '0.15em solid rgba(255,195,113,0.9)'
    },
    '.torrent-item__seeds > span.low-seeds': {
      color: '#ff5f6d',
      'background-color': 'rgba(255,95,109,0.15)',
      border: '0.15em solid rgba(255,95,109,0.9)'
    },
    '.torrent-item__seeds > span.high-seeds': {
      color: '#43cea2',
      'background-color': 'rgba(67,206,162,0.15)',
      border: '0.15em solid rgba(67,206,162,0.9)'
    },

    '.torrent-item__bitrate > span.ts-bitrate': {
      color: '#43cea2',
      'background-color': 'rgba(67,206,162,0.12)',
      border: '0.15em solid rgba(67,206,162,0.85)'
    },
    '.torrent-item__bitrate > span.high-bitrate': {
      color: '#ffc371',
      'background-color': 'rgba(255,195,113,0.18)',
      border: '0.15em solid rgba(255,195,113,0.9)'
    },
    '.torrent-item__bitrate > span.very-high-bitrate': {
      color: '#ff5f6d',
      'background-color': 'rgba(255,95,109,0.18)',
      border: '0.15em solid rgba(255,95,109,0.9)'
    },

    '.torrent-item__size.ts-size': {
      color: '#43cea2',
      'background-color': 'rgba(67,206,162,0.12)',
      border: '0.15em solid rgba(67,206,162,0.85)'
    },
    '.torrent-item__size.high-size': {
      color: '#ffc371',
      'background-color': 'rgba(255,195,113,0.18)',
      border: '0.15em solid rgba(255,195,113,0.9)'
    },
    '.torrent-item__size.top-size': {
      color: '#ff5f6d',
      'background-color': 'rgba(255,95,109,0.18)',
      border: '0.15em solid rgba(255,95,109,0.9)'
    }
  };

  function injectStyles() {
    var style = document.createElement('style');
    style.innerHTML = Object.keys(styles).map(s =>
      s + '{' + Object.entries(styles[s]).map(p => p[0] + ':' + p[1] + '!important').join(';') + '}'
    ).join('\n');
    document.head.appendChild(style);
  }

  function tsParseSizeToGb(text) {
    var m = text.replace(',', '.').match(/(\d+(\.\d+)?)\s*(gb|tb|mb)/i);
    if (!m) return null;
    var v = parseFloat(m[1]);
    if (m[3].toLowerCase() === 'tb') return v * 1024;
    if (m[3].toLowerCase() === 'mb') return v / 1024;
    return v;
  }

  function updateTorrentStyles() {
    document.querySelectorAll('.torrent-item__seeds span').forEach(s => {
      var v = parseInt(s.textContent) || 0;
      s.className = 'ts-seeds';
      if (v < TH.seeds.danger_below) s.classList.add('low-seeds');
      else if (v >= TH.seeds.top_from) s.classList.add('high-seeds');
    });

    document.querySelectorAll('.torrent-item__bitrate span').forEach(s => {
      var v = parseFloat(s.textContent) || 0;
      s.className = 'ts-bitrate';
      if (v >= TH.bitrate.danger_from) s.classList.add('very-high-bitrate');
      else if (v >= TH.bitrate.warn_from) s.classList.add('high-bitrate');
    });

    document.querySelectorAll('.torrent-item__size').forEach(s => {
      var gb = tsParseSizeToGb(s.textContent);
      s.className = 'torrent-item__size ts-size';
      if (gb <= TH.size.low_bad_to_gb) s.classList.add('top-size');
      else if (gb <= TH.size.gold_small_to_gb) s.classList.add('high-size');
      else if (gb <= TH.size.green_to_gb) {}
      else if (gb <= TH.size.gold_big_to_gb) s.classList.add('high-size');
      else s.classList.add('top-size');
    });
  }

  injectStyles();
  new MutationObserver(updateTorrentStyles).observe(document.body, { childList: true, subtree: true });
  updateTorrentStyles();

})();