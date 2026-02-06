(function () {
    'use strict';

    // Константы плагина
    const STYLE_TAG = 'cardbtn-style';
    const ORDER_STORAGE = 'cardbtn_order';
    const HIDE_STORAGE = 'cardbtn_hidden';
    let currentCard = null;
    let currentActivity = null;

    const DEFAULT_LABELS = {
        'button--play': () => Lampa.Lang.translate('title_watch'),
        'button--book': () => Lampa.Lang.translate('settings_input_links'),
        'button--reaction': () => Lampa.Lang.translate('title_reactions'),
        'button--subscribe': () => Lampa.Lang.translate('title_subscribe'),
        'button--options': () => Lampa.Lang.translate('more'),
        'view--torrent': () => Lampa.Lang.translate('full_torrents'),
        'view--trailer': () => Lampa.Lang.translate('full_trailers')
    };

    // Добавляем стили плагина
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
        `;
        const style = document.createElement('style');
        style.id = STYLE_TAG;
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    // Функция поиска кнопки по ID
    function findButton(btnId) {
        let btn = allButtonsOriginal.find(b => getBtnIdentifier(b) === btnId);
        if (!btn) btn = allButtonsCache.find(b => getBtnIdentifier(b) === btnId);
        return btn;
    }

    function getBtnIdentifier(button) {
        const classes = button.attr('class') || '';
        const text = button.find('span').text().trim().replace(/\s+/g, '');
        const subtitle = button.attr('data-subtitle') || '';
        let id = classes.split(' ').filter(c => c.indexOf('view--') === 0 || c.indexOf('button--') === 0).join('') + text;
        if (subtitle) id += subtitle.replace(/\s+/g, '').substring(0, 30);
        return id || 'button_unknown';
    }

    function detectBtnCategory(button) {
        const classes = button.attr('class') || '';
        if (classes.indexOf('shots-view-button') !== -1 || classes.indexOf('shots') !== -1) return 'shots';
        for (let group of DEFAULT_GROUPS) {
            for (let pattern of group.patterns) {
                if (classes.indexOf(pattern) !== -1) return group.name;
            }
        }
        return 'other';
    }

    function shouldSkipBtn(button) {
        const EXCLUDED_CLASSES = ['button--play', 'button--edit-order', 'button--folder'];
        const classes = button.attr('class') || '';
        return EXCLUDED_CLASSES.some(c => classes.indexOf(c) !== -1);
    }

    // Группировка кнопок
    function groupBtnsByType(container) {
        const allButtons = container.find('.full-start__button').not('.button--edit-order, .button--folder, .button--play');
        const categories = { online: [], torrent: [], trailer: [], shots: [], book: [], reaction: [], subscribe: [], other: [] };
        allButtons.each(function() {
            const $btn = $(this);
            if ($btn.closest('.person-start__bottom').length) return;
            if (shouldSkipBtn($btn)) return;
            const type = detectBtnCategory($btn);
            (categories[type] || categories.other).push($btn);
        });
        return categories;
    }

    function arrangeBtnsByOrder(buttons) {
        // Простая сортировка по типу
        const typeOrder = ['online', 'torrent', 'trailer', 'shots', 'book', 'reaction', 'subscribe', 'other'];
        return buttons.sort((a, b) => {
            const indexA = typeOrder.indexOf(detectBtnCategory(a));
            const indexB = typeOrder.indexOf(detectBtnCategory(b));
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
    }

    function applyBtnVisibility(buttons) {
        const hidden = getHiddenButtons();
        buttons.forEach(btn => {
            const id = getBtnIdentifier(btn);
            btn.toggleClass('hidden', hidden.indexOf(id) !== -1);
        });
    }

    function applyButtonDisplayModes(buttons) {
        // Только стандартный режим: текст + иконка
        buttons.forEach(btn => btn.removeClass('button-mode-1 button-mode-2 button-mode-3').addClass('button-mode-1'));
    }

    // Применяем изменения на странице
    function applyChanges() {
        if (!currentContainer) return;
        const categories = groupBtnsByType(currentContainer);
        const allButtons = [].concat(categories.online, categories.torrent, categories.trailer, categories.shots,
            categories.book, categories.reaction, categories.subscribe, categories.other);
        const sorted = arrangeBtnsByOrder(allButtons);
        currentButtons = sorted;
        applyBtnVisibility(sorted);
        applyButtonDisplayModes(sorted);

        const targetContainer = currentContainer.find('.full-start-new__buttons');
        if (!targetContainer.length) return;

        targetContainer.find('.full-start__button').not('.button--edit-order').detach();
        currentButtons.forEach(btn => targetContainer.append(btn));
    }

    // Вспомогательные функции для хранения
    function getHiddenButtons() { return Lampa.Storage.get('button_hidden', []); }
    function setHiddenButtons(hidden) { Lampa.Storage.set('button_hidden', hidden); }

    // Инициализация
    function init(container) {
        currentContainer = container;
        addStyles();
        applyChanges();
    }

    // Экспорт
    window.CardButtonManager = { init, findButton };
})();
