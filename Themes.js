(function () {
    'use strict';

    var DEFAULT_PLUGIN = 'default';

    // Общие стили для качества видео (будут добавлены ко всем темам)
    var qualityColorsCSS = `
        .card__quality, 
        .card-v2 .card__quality {
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        /* 4K */
        .card__quality[data-quality="4K"],
        .card-v2 .card__quality[data-quality="4K"] {
            background: linear-gradient(135deg, #8a2be2, #6a5acd) !important;
            color: white !important;
        }
        
        /* WEB-DL */
        .card__quality[data-quality="WEB-DL"],
        .card-v2 .card__quality[data-quality="WEB-DL"] {
            background: linear-gradient(135deg, #1e90ff, #4169e1) !important;
            color: black !important;
        }
        
        /* BD/BDRIP */
        .card__quality[data-quality="BD"],
        .card__quality[data-quality="BDRIP"],
        .card-v2 .card__quality[data-quality="BD"],
        .card-v2 .card__quality[data-quality="BDRIP"] {
            background: linear-gradient(135deg, #ffd700, #daa520) !important;
            color: black !important;
        }
        
        /* HDTV */
        .card__quality[data-quality="HDTV"],
        .card-v2 .card__quality[data-quality="HDTV"] {
            background: linear-gradient(135deg, #2ecc71, #27ae60) !important;
            color: white !important;
        }
        
        /* TC/TS/TELECINE */
        .card__quality[data-quality="TC"],
        .card__quality[data-quality="TS"],
        .card__quality[data-quality="TELECINE"],
        .card-v2 .card__quality[data-quality="TC"],
        .card-v2 .card__quality[data-quality="TS"],
        .card-v2 .card__quality[data-quality="TELECINE"] {
            background: linear-gradient(135deg, #ff6b6b, #e74c3c) !important;
            color: white !important;
        }
        
        /* VHS */
        .card__quality[data-quality="VHS"],
        .card-v2 .card__quality[data-quality="VHS"] {
            background: linear-gradient(135deg, #00cccc, #009999) !important;
            color: white !important;
        }
        
        /* DVDRIP */
        .card__quality[data-quality="DVDRIP"],
        .card-v2 .card__quality[data-quality="DVDRIP"] {
            background: linear-gradient(135deg, #88ff88, #aaffaa) !important;
            color: black !important;
        }
        
        /* DVB */
        .card__quality[data-quality="DVB"],
        .card-v2 .card__quality[data-quality="DVB"] {
            background: linear-gradient(135deg, #ffddbb, #ff99cc) !important;
            color: black !important;
        }
        
        /* По умолчанию */
        .card__quality:not([data-quality]),
        .card-v2 .card__quality:not([data-quality]) {
            background: #fff816 !important;
            color: black !important;
        }
    `;

    // Встроенные темы CSS
    var themes = {
        prisma: `
        
/* =========== КАРТОЧКИ КОНТЕНТА =========== */
.card.focus, .card.hover {
    /* Анимация увеличения при фокусе */
    z-index: 2;
    transform: scale(1.1);
    outline: none;
}

.card--tv .card__type {
    /* Бейдж типа контента (ТВ) */
    position: absolute;
    background: linear-gradient(90deg, #69ffbd, #62a3c9);
    color: #000;
    z-index: 4;
}

/* =========== ЭФФЕКТЫ ВЫДЕЛЕНИЯ =========== */
.card.focus .card__view::before,
.card.hover .card__view::before {
    /* Элемент свечения */
    content: "";
    position: absolute;
    top: -0.5em;
    left: -0.5em;
    right: -0.5em;
    bottom: -0.5em;
    border-radius: 1.4em;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    box-shadow: 0 0 0 #6666ff;
    animation: glow-pulse 1s 0.4s infinite ease-in-out;
}
.full-episode.focus::after,
.extensions__item.focus::after,
.explorer-card__head-img.focus::after,
.torrent-item.focus::after {
    /* Общий стиль рамки выделения */
    content: "";
    position: absolute;
    top: -0.5em;
    left: -0.5em;
    right: -0.5em;
    bottom: -0.5em;
    border: 0.3em solid #69ffbd;
    border-radius: 1.4em;
    z-index: -1;
    pointer-events: none;
}

.card.focus .card__view::after, 
.card.hover .card__view::after {
    /* Элемент рамки */
    content: "";
    position: absolute;
    top: -0.5em;
    left: -0.5em;
    right: -0.5em;
    bottom: -0.5em;
    border: 0.3em solid transparent;
    border-radius: 1.4em;
    z-index: -1;
    pointer-events: none;
    clip-path: polygon(0 0, 0% 0, 0% 100%, 0 100%);
    animation: 
        border-draw 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards,
        border-glow 0.5s 0.5s ease-out forwards;
}

@keyframes border-draw {
    0% {
        border-color: transparent;
        clip-path: polygon(0 0, 0% 0, 0% 100%, 0 100%);
    }
    25% {
        border-top-color: #69ffbd;
        clip-path: polygon(0 0, 100% 0, 100% 0%, 0 0);
    }
    50% {
        border-right-color: #69ffbd;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 100% 100%);
    }
    75% {
        border-bottom-color: #69ffbd;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
    }
    100% {
        border-color: #69ffbd;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
}

@keyframes border-glow {
    0% {
        border-color: #69ffbd;
    }
    100% {
        border-color: #69ffbd;
    }
}

@keyframes glow-pulse {
    0%, 100% {
        opacity: 0.8;
        box-shadow: 0 0 16px #6666ff;
    }
    50% {
        opacity: 1;
        box-shadow: 0 0 16px #77ffff;
    }
}
/* Микрофон и клавиатура */
.search-source.active {
  opacity: 1;
  background-color: #62a3c9;
  color: #fff;
}

.simple-keyboard .hg-button[data-skbtn="{MIC}"] {
  color: #62a3c9;
}

/* =========== РЕЙТИНГИ И ГОЛОСОВАНИЕ =========== */
.card__vote {
    /* Контейнер рейтинга */
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 3px 3px;
    margin: 2px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    color: #fff;
    align-items: center;
}

.card__vote-count {
    /* Число рейтинга */
    font-size: 14px;
    font-weight: bold;
    line-height: 1;
}

.explorer-card__head-rate {
    /* Рейтинг в карточке */
    color: #62a3c9;
}

.explorer-card__head-rate > span {
    /* Число рейтинга */
    font-size: 1.5em;
    font-weight: 600;
}

.full-start__rate {
    /* Облик рейтинга в описании карточки */
  background: rgb(98 163 201 / 3%);
  -webkit-border-radius: 0.3em;
  -moz-border-radius: 0.3em;
  border-radius: 0.3em;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -moz-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  font-size: 1.45em;
  margin-right: 1em;
}

/* =========== КНОПКИ И ФОКУС =========== */
.full-start__button {
  margin-right: 0.75em;
  font-size: 1.3em;
  background-color: rgb(98 163 201 / 20%);
  padding: 0.3em 1em;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-border-radius: 1em;
  -moz-border-radius: 1em;
  border-radius: 1em;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -moz-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  height: 2.8em;
  -webkit-flex-shrink: 0;
  -ms-flex-negative: 0;
  flex-shrink: 0;
}

/* Стиль для состояния кнопок при фокусе focus */
.full-start__button.focus {
  background: linear-gradient(90deg, #69ffbd, #62a3c9);
  color: #fff;
}

/* =========== НАВИГАЦИЯ И МЕНЮ =========== */
.menu__item.focus, 
.menu__item.traverse, 
.menu__item.hover,
.menuitem.focus.red,
.menuitem.traverse.red,
.menu__item.hover.red,
.broadcast__scan > div,
.broadcast__device.focus,
.head__action.focus, 
.head__action.hover,
.settings-param.focus,
.simple-button.focus,
.selectbox-item.focus,
.full-person.focus {
    /* Общие стили для активных элементов */
    background: linear-gradient(90deg, #69ffbd, #62a3c9);
    color: #000;
    border-radius: 1em;
}

.tag-count.focus {
    /* Особый стиль для тегов */
    background: linear-gradient(90deg, #69ffbd, #62a3c9);
    color: #000;
}

.settings-folder.focus {
    /* Папка в настройках */
    background: linear-gradient(90deg, #69ffbd, #62a3c9);
    border-radius: 1em;
    color: #000;
}

.head__action {
    /* Радиус фокуса */
    border-radius: 20%;
}

/* =========== ИНДИКАТОРЫ И БЕЙДЖИ =========== */
.extensions__cub {
    /* Бейдж расширений */
    position: absolute;
    top: 1em;
    right: 1em;
    background-color: rgba(34, 229, 10, 0.32);
    border-radius: 0.3em;
    padding: 0.3em 0.4em;
    font-size: 0.78em;
}

.head__action.active::after {
    /* Индикатор активности */
    content: "";
    display: block;
    width: 0.5em;
    height: 0.5em;
    position: absolute;
    top: 0;
    right: 0;
    background: linear-gradient(90deg, #69ffbd, #62a3c9);
    border: 0.1em solid #fff;
    border-radius: 100%;
}

.explorer-card__head-age {
    /* Бейдж возраста */
    border: 1px solid #ffff77;
    border-radius: 0.2em;
    padding: 0.2em 0.3em;
    margin-top: 1.4em;
    font-size: 0.9em;
}

/* =========== ЛОАДЕРЫ =========== */
.activity__loader {
    /* Полноэкранный лоадер */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100px' height='100px' viewBox='0 0 100 100'%3E%3Crect y='25' width='10' height='50' rx='4' ry='4' fill='%23fff'%3E%3Canimate attributeName='x' values='10;100' dur='1.2s' repeatCount='indefinite'/%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 10 70' to='-60 100 70' dur='1.2s' repeatCount='indefinite'/%3E%3Canimate attributeName='opacity' values='0;1;0' dur='1.2s' repeatCount='indefinite'/%3E%3C/rect%3E%3Crect y='25' width='10' height='50' rx='4' ry='4' fill='%23fff'%3E%3Canimate attributeName='x' values='10;100' dur='1.2s' begin='0.4s' repeatCount='indefinite'/%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 10 70' to='-60 100 70' dur='1.2s' begin='0.4s' repeatCount='indefinite'/%3E%3Canimate attributeName='opacity' values='0;1;0' dur='1.2s' begin='0.4s' repeatCount='indefinite'/%3E%3C/rect%3E%3Crect y='25' width='10' height='50' rx='4' ry='4' fill='%23fff'%3E%3Canimate attributeName='x' values='10;100' dur='1.2s' begin='0.8s' repeatCount='indefinite'/%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 10 70' to='-60 100 70' dur='1.2s' begin='0.8s' repeatCount='indefinite'/%3E%3Canimate attributeName='opacity' values='0;1;0' dur='1.2s' begin='0.8s' repeatCount='indefinite'/%3E%3C/rect%3E%3C/svg%3E") no-repeat 50% 50%;
}

.modal-loading {
    /* Лоадер в модальном окне */
    height: 6em;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100px' height='100px' viewBox='0 0 100 100'%3E%3Crect y='25' width='10' height='50' rx='4' ry='4' fill='%23fff'%3E%3Canimate attributeName='x' values='10;100' dur='1.2s' repeatCount='indefinite'/%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 10 70' to='-60 100 70' dur='1.2s' repeatCount='indefinite'/%3E%3Canimate attributeName='opacity' values='0;1;0' dur='1.2s' repeatCount='indefinite'/%3E%3C/rect%3E%3Crect y='25' width='10' height='50' rx='4' ry='4' fill='%23fff'%3E%3Canimate attributeName='x' values='10;100' dur='1.2s' begin='0.4s' repeatCount='indefinite'/%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 10 70' to='-60 100 70' dur='1.2s' begin='0.4s' repeatCount='indefinite'/%3E%3Canimate attributeName='opacity' values='0;1;0' dur='1.2s' begin='0.4s' repeatCount='indefinite'/%3E%3C/rect%3E%3Crect y='25' width='10' height='50' rx='4' ry='4' fill='%23fff'%3E%3Canimate attributeName='x' values='10;100' dur='1.2s' begin='0.8s' repeatCount='indefinite'/%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 10 70' to='-60 100 70' dur='1.2s' begin='0.8s' repeatCount='indefinite'/%3E%3Canimate attributeName='opacity' values='0;1;0' dur='1.2s' begin='0.8s' repeatCount='indefinite'/%3E%3C/rect%3E%3C/svg%3E") no-repeat 50% 50%;
    background-size: contain;
}

/* =========== ПАНЕЛЬ НАСТРОЕК =========== */
.settings__content {
  position: fixed;
  top: 35;
  left: 100%;
  -webkit-transition: -webkit-transform 0.2s;
  transition: -webkit-transform 0.2s;
  -o-transition: -o-transform 0.2s;
  -moz-transition: transform 0.2s, -moz-transform 0.2s;
  transition: transform 0.2s;
  transition: transform 0.2s, -webkit-transform 0.2s, -moz-transform 0.2s, -o-transform 0.2s;
  background: #262829;
  width: 35%;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -webkit-border-top-left-radius: 2em;
  -webkit-border-top-right-radius: 2em;
  -moz-box-orient: vertical;
  -moz-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  will-change: transform;
  /* Единственное добавление */
  max-height: 95vh;
  overflow-y: auto;
}

@media screen and (max-width: 767px) {
  .settings__content {
    width: 50%;
  }
}
@media screen and (max-width: 580px) {
  .settings__content {
    width: 70%;
  }
}
@media screen and (max-width: 480px) {
  .settings__content {
    width: 100%;
    left: 0;
    top: unset;
    bottom: 0;
    height: auto !important;
    -webkit-transition: none;
    -o-transition: none;
    -moz-transition: none;
    transition: none;
    -webkit-transform: translate3d(0, 100%, 0);
       -moz-transform: translate3d(0, 100%, 0);
            transform: translate3d(0, 100%, 0);
    -webkit-border-top-left-radius: 2em;
       -moz-border-radius-topleft: 2em;
            border-top-left-radius: 2em;
    -webkit-border-top-right-radius: 2em;
       -moz-border-radius-topright: 2em;
            border-top-right-radius: 2em;
    /* Единственное добавление для мобилок */
    max-height: 85vh;
  }
}

.head__action.open-settings {
  position: relative;
  display: inline-block;
}

.head__action.open-settings::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent 40%, white 50%, transparent 60%);
  background-size: 400% 400%;
  animation: blink-effect 1s ease;
  pointer-events: none;
}

.items-line__more.focus {
  background-color: #62a3c9;
  color: #000;
}

/* =========== ПЕРСОНЫ =========== */
.full-person__photo {
    /* Аватар персоны */
    width: 7em;
    height: 7em;
    border-radius: 50%;
    background-color: #fff;
    margin-right: 1em;
    background-size: cover;
    background-position: 50% 50%;
    display: flex;
    align-items: center;
}

.full-start__pg, .full-start__status {
    /* Статус просмотра */
    font-size: 1.2em;
    border: 1px solid #ffeb3b;
    border-radius: 0.2em;
    padding: 0.3em;
}

/* =========== ВЫБОР ЭЛЕМЕНТОВ =========== */
.selectbox-item.selected:not(.nomark)::after, 
.selectbox-item.picked::after {
    /* Индикатор выбора */
    content: "";
    display: block;
    width: 1.2em;
    height: 1.2em;
    border: 0.15em solid #ccc;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    right: 1.4em;
    transform: translateY(-50%);
}

.selectbox-item.selected:not(.nomark)::after, 
.selectbox-item.picked::after {
    /* Анимация заполнения круга */
    border-color: #fff;
    border-top-color: transparent; /* Начинаем с прозрачной верхней границы */
    animation: circle-fill 3s ease-in-out forwards; /* Плавная анимация с фиксацией конечного состояния */
}

@keyframes circle-fill {
    /* 
     * Анимация имитирует "заполнение" круга по часовой стрелке 
     * с одновременным изменением цвета границ
     */
    0% {
        transform: translateY(-50%) rotate(0deg);
        border-color: #ccc; /* Начальный цвет - серый */
        border-top-color: transparent;
        border-right-color: transparent;
        border-bottom-color: transparent;
        border-left-color: transparent;
    }
    25% {
        border-right-color: #fff; /* Появление правой границы */
    }
    50% {
        border-bottom-color: #fff; /* Появление нижней границы */
    }
    75% {
        border-left-color: #fff; /* Появление левой границы */
    }
    100% {
        transform: translateY(-50%) rotate(360deg); /* Полный оборот */
        border-color: #fff; /* Все границы белые */
        border-top-color: #fff; /* Верхняя граница становится видимой в конце */
        box-shadow: 0 0 0 3px rgba(98, 163, 201, 0.3); /* Дополнительный эффект свечения */
    }
}

/* Дополнительные состояния для лучшей визуализации */
.selectbox-item {
    position: relative;
    transition: all 0.3s ease;
}

.selectbox-item:hover {
    background-color: rgba(98, 163, 201, 0.1); /* Подсветка при наведении */
}

/* Не удалять, обводка рамки в модуле, действует как показатель какой цвет выбран */
            :root {
            --theme-accent-color: #69ffbd;
            }
            .button--primary {
                background-color: var(--theme-base-color);
            }
            
            ${qualityColorsCSS}
        `,
        blue: `
        
/* =========== КАРТОЧКИ КОНТЕНТА =========== */
.card.focus, .card.hover {
    /* Анимация увеличения при фокусе */
    z-index: 2;
    transform: scale(1.1);
    outline: none;
}

.card--tv .card__type {
    /* Бейдж типа контента (ТВ) */
    position: absolute;
    background: linear-gradient(90deg, #5555ff, #3333ff);
    color: #fff;
    z-index: 4;
}

/* =========== ЭФФЕКТЫ ВЫДЕЛЕНИЯ =========== */
.card.focus .card__view::before,
.card.hover .card__view::before {
    /* Элемент свечения */
    content: "";
    position: absolute;
    top: -0.5em;
    left: -0.5em;
    right: -0.5em;
    bottom: -0.5em;
    border-radius: 1.4em;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    box-shadow: 0 0 0 #6666ff;
    animation: glow-pulse 1s 0.4s infinite ease-in-out;
}
.full-episode.focus::after,
.extensions__item.focus::after,
.explorer-card__head-img.focus::after,
.torrent-item.focus::after {
    /* Общий стиль рамки выделения */
    content: "";
    position: absolute;
    top: -0.5em;
    left: -0.5em;
    right: -0.5em;
    bottom: -0.5em;
    border: 0.3em solid #3333ff;
    border-radius: 1.4em;
    z-index: -1;
    pointer-events: none;
}

.card.focus .card__view::after, 
.card.hover .card__view::after {
    /* Элемент рамки */
    content: "";
    position: absolute;
    top: -0.5em;
    left: -0.5em;
    right: -0.5em;
    bottom: -0.5em;
    border: 0.3em solid transparent;
    border-radius: 1.4em;
    z-index: -1;
    pointer-events: none;
    clip-path: polygon(0 0, 0% 0, 0% 100%, 0 100%);
    animation: 
        border-draw 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards,
        border-glow 0.5s 0.5s ease-out forwards;
}

@keyframes border-draw {
    0% {
        border-color: transparent;
        clip-path: polygon(0 0, 0% 0, 0% 100%, 0 100%);
    }
    25% {
        border-top-color: #3333ff;
        clip-path: polygon(0 0, 100% 0, 100% 0%, 0 0);
    }
    50% {
        border-right-color: #3333ff;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 100% 100%);
    }
    75% {
        border-bottom-color: #3333ff;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
    }
    100% {
        border-color: #3333ff;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
}

@keyframes border-glow {
    0% {
        border-color: #3333ff;
    }
    100% {
        border-color: #3333ff;
    }
}

@keyframes glow-pulse {
    0%, 100% {
        opacity: 0.8;
        box-shadow: 0 0 16px #6666ff;
    }
    50% {
        opacity: 1;
        box-shadow: 0 0 16px #8888ff;
    }
}

/* Микрофон и клавиатура */
.search-source.active {
  opacity: 1;
  background-color: #3333ff;
  color: #fff;
}

.simple-keyboard .hg-button[data-skbtn="{MIC}"] {
  color: #3333ff;
}

/* =========== РЕЙТИНГИ И ГОЛОСОВАНИЕ =========== */
.card__vote {
    /* Контейнер рейтинга */
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 3px 3px;
    margin: 2px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    color: #fff;
    align-items: center;
}

.card__vote-count {
    /* Число рейтинга */
    font-size: 14px;
    font-weight: bold;
    line-height: 1;
}

.explorer-card__head-rate {
    /* Рейтинг в карточке */
    color: #3333ff;
}

.explorer-card__head-rate > span {
    /* Число рейтинга */
    font-size: 1.5em;
    font-weight: 600;
}

.full-start__rate {
    /* Облик рейтинга в описании карточки */
  background: rgb(0 0 255 / 3%);
  -webkit-border-radius: 0.3em;
  -moz-border-radius: 0.3em;
  border-radius: 0.3em;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -moz-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  font-size: 1.45em;
  margin-right: 1em;
}

/* =========== КНОПКИ И ФОКУС =========== */
.full-start__button {
  margin-right: 0.75em;
  font-size: 1.3em;
  background-color: rgb(0 0 255 / 24%);
  padding: 0.3em 1em;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-border-radius: 1em;
  -moz-border-radius: 1em;
  border-radius: 1em;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -moz-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  height: 2.8em;
  -webkit-flex-shrink: 0;
  -ms-flex-negative: 0;
  flex-shrink: 0;
}

/* Стиль для состояния кнопок при фокусе focus */
.full-start__button.focus {
  background: linear-gradient(90deg, #5555ff, #3333ff);
  color: #fff;
}

/* =========== НАВИГАЦИЯ И МЕНЮ =========== */
.menu__item.focus, 
.menu__item.traverse, 
.menu__item.hover,
.menuitem.focus.red,
.menuitem.traverse.red,
.menu__item.hover.red,
.broadcast__scan > div,
.broadcast__device.focus,
.head__action.focus, 
.head__action.hover,
.settings-param.focus,
.simple-button.focus,
.selectbox-item.focus,
.full-person.focus {
    /* Общие стили для активных элементов */
    background: linear-gradient(90deg, #5555ff, #3333ff);
    color: #fff;
    border-radius: 1em;
}

.tag-count.focus {
    /* Особый стиль для тегов */
    background: linear-gradient(90deg, #5555ff, #3333ff);
    color: #000;
}

.settings-folder.focus {
    /* Папка в настройках */
    background: linear-gradient(90deg, #5555ff, #3333ff);
    border-radius: 1em;
}

.head__action {
    /* Радиус фокуса */
    border-radius: 20%;
}

/* =========== ИНДИКАТОРЫ И БЕЙДЖИ =========== */
.extensions__cub {
    /* Бейдж расширений */
    position: absolute;
    top: 1em;
    right: 1em;
    background-color: rgba(34, 229, 10, 0.32);
    border-radius: 0.3em;
    padding: 0.3em 0.4em;
    font-size: 0.78em;
}

.head__action.active::after {
    /* Индикатор активности */
    content: "";
    display: block;
    width: 0.5em;
    height: 0.5em;
    position: absolute;
    top: 0;
    right: 0;
    background: linear-gradient(90deg, #5555ff, #3333ff);
    border: 0.1em solid #fff;
    border-radius: 100%;
}

.explorer-card__head-age {
    /* Бейдж возраста */
    border: 1px solid #ffff77;
    border-radius: 0.2em;
    padding: 0.2em 0.3em;
    margin-top: 1.4em;
    font-size: 0.9em;
}

/* =========== ЛОАДЕРЫ =========== */
.activity__loader {
    /* Полноэкранный лоадер */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 24 24' style='display: block; margin: auto;'%3E%3Cpath fill='%233333ff' d='M2,12A11.2,11.2,0,0,1,13