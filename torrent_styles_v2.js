// ==UserScript==
// @name         Lampa Torrent Styles MOD
// @namespace    http://github.com/yourusername
// @version      1.0
// @description  Подсветка торрентов в Lampa без ошибок 500
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const TH = {
        seeds: { danger_below: 6, top_from: 21 },
        bitrate: { warn_from: 46, danger_from: 66 }
    };

    const styles = {
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
        '.torrent-item__seeds > span.ts-seeds': { color: '#ffc371', 'background-color': 'rgba(255,195,113,0.15)', border: '0.15em solid rgba(255,195,113,0.9)' },
        '.torrent-item__seeds > span.low-seeds': { color: '#ff5f6d', 'background-color': 'rgba(255,95,109,0.15)', border: '0.15em solid rgba(255,95,109,0.9)' },
        '.torrent-item__seeds > span.high-seeds': { color: '#43cea2', 'background-color': 'rgba(67,206,162,0.15)', border: '0.15em solid rgba(67,206,162,0.9)' },
        '.torrent-item__bitrate > span.ts-bitrate': { color: '#43cea2', 'background-color': 'rgba(67,206,162,0.12)', border: '0.15em solid rgba(67,206,162,0.85)' },
        '.torrent-item__bitrate > span.high-bitrate': { color: '#ffc371', 'background-color': 'rgba(255,195,113,0.18)', border: '0.15em solid rgba(255,195,113,0.9)' },
        '.torrent-item__bitrate > span.very-high-bitrate': { color: '#ff5f6d', 'background-color': 'rgba(255,95,109,0.18)', border: '0.15em solid rgba(255,95,109,0.9)' },
        '.torrent-item__size.ts-size': { color: '#b983ff', 'background-color': 'rgba(185,131,255,0.14)', border: '0.15em solid rgba(185,131,255,0.9)' },
        '.torrent-item__grabs > span.ts-grabs': { color: '#4db6ff', 'background-color': 'rgba(77,182,255,0.18)', border: '0.15em solid rgba(77,182,255,0.92)' }
    };

    function injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = Object.entries(styles).map(([selector, rules]) => {
            const css = Object.entries(rules).map(([prop, val]) => `${prop}:${val}!important`).join(';');
            return `${selector}{${css}}`;
        }).join('\n');
        document.head.appendChild(style);
    }

    function updateTorrentStyles() {
        document.querySelectorAll('.torrent-item__seeds span').forEach(s => {
            const v = parseInt(s.textContent) || 0;
            s.className = 'ts-seeds';
            if (v < TH.seeds.danger_below) s.classList.add('low-seeds');
            else if (v >= TH.seeds.top_from) s.classList.add('high-seeds');
        });

        document.querySelectorAll('.torrent-item__bitrate span').forEach(s => {
            const v = parseFloat(s.textContent) || 0;
            s.className = 'ts-bitrate';
            if (v >= TH.bitrate.danger_from) s.classList.add('very-high-bitrate');
            else if (v >= TH.bitrate.warn_from) s.classList.add('high-bitrate');
        });

        document.querySelectorAll('.torrent-item__grabs span').forEach(s => s.className = 'ts-grabs');
        document.querySelectorAll('.torrent-item__size').forEach(s => s.className = 'torrent-item__size ts-size');
    }

    injectStyles();
    new MutationObserver(updateTorrentStyles).observe(document.body, { childList: true, subtree: true });
    updateTorrentStyles();

})();
