(function () {
    'use strict';

    // --- Константы плагина ---
    const STYLE_TAG = 'cardbtn-style';           // ID для тега стилей
    const ORDER_STORAGE = 'cardbtn_order';       // Ключ для хранения порядка кнопок
    const HIDE_STORAGE = 'cardbtn_hidden';       // Ключ для хранения скрытых кнопок
    let currentCard = null;                      // Текущий контейнер карточки

    // Метки по умолчанию для кнопок без текста
    const DEFAULT_LABELS = {
        'button--play': () => Lampa.Lang.translate('title_watch'),
        'button--book': () => Lampa.Lang.translate('settings_input_links'),
        'button--reaction': () => Lampa.Lang.translate('title_reactions'),
        'button--subscribe': () => Lampa.Lang.translate('title_subscribe'),
        'button--options': () => Lampa.Lang.translate('more'),
        'view--torrent': () => Lampa.Lang.translate('full_torrents'),
        'view--trailer': () => Lampa.Lang.translate('full_trailers')
    };

    // --- Стили плагина ---
    function addStyles() {
        if (document.getElementById(STYLE_TAG)) return;
        const css = `
        .card-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .card-button-hidden {
            display: none !important;
        }
        .card-button span {
            display: inline-block;
            margin-left: 5px;
        }`;
        const style = document.createElement('style');
        style.id = STYLE_TAG;
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    // --- Поиск кнопок внутри карточки ---
    function findCardButtons(container) {
        return Array.from(container.querySelectorAll('.full-start__button'))
            .filter(btn => !btn.classList.contains('button--edit-order') && !btn.classList.contains('button--folder'));
    }

    // --- Получение текста кнопки ---
    function getButtonText(btn) {
        let text = btn.querySelector('span')?.textContent?.trim();
        if (!text) {
            const cls = Array.from(btn.classList).find(c => DEFAULT_LABELS[c]);
            if (cls) text = DEFAULT_LABELS[cls]();
            else text = Lampa.Lang.translate('buttons_plugin_button_unknown') || 'Button';
        }
        return text;
    }

    // --- Применение стандартного стиля и текста ---
    function applyButtons(card) {
        const buttons = findCardButtons(card);
        buttons.forEach(btn => {
            btn.classList.remove('card-button-hidden');
            btn.classList.add('card-button');
            const span = btn.querySelector('span');
            if (!span) {
                const text = getButtonText(btn);
                const spanEl = document.createElement('span');
                spanEl.textContent = text;
                btn.appendChild(spanEl);
            }
        });
    }

    // --- Основная функция обновления карточки ---
    function updateCard(card) {
        if (!card) return;
        currentCard = card;
        addStyles();
        applyButtons(card);
    }

    // --- Слежение за открытием карточек ---
    Lampa.Controller.add('full_start', {
        toggle: function () {
            const card = document.querySelector('.full-start-new__buttons');
            if (card && card !== currentCard) {
                updateCard(card);
            }
        }
    });

})();
