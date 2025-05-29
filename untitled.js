(function () { 
    'use strict'; 
    var DEFAULT_PLUGIN = 'default'; 

    // Общие стили для качества видео (будут добавлены ко всем темам) 
    var qualityColorsCSS = ` 
    .card__quality, .card-v2 .card__quality { 
        border-radius: 4px; 
        padding: 2px 6px; 
        font-size: 12px; 
        font-weight: bold; 
        text-transform: uppercase; 
    } 
    
    /* 4K */ 
    .card__quality[data-quality="4K"], .card-v2 .card__quality[data-quality="4K"] { 
        background: linear-gradient(135deg, #8a2be2, #6a5acd) !important; 
        color: white !important; 
    } 
    
    /* WEB-DL */ 
    .card__quality[data-quality="WEB-DL"], .card-v2 .card__quality[data-quality="WEB-DL"] { 
        background: linear-gradient(135deg, #1e90ff, #4169e1) !important; 
        color: black !important; 
    } 
    
    /* BD/BDRIP */ 
    .card__quality[data-quality="BD"], .card__quality[data-quality="BDRIP"], .card-v2 .card__quality[data-quality="BD"], .card-v2 .card__quality[data-quality="BDRIP"] { 
        background: linear-gradient(135deg, #ffd700, #daa520) !important; 
        color: black !important; 
    } 
    
    /* HDTV */ 
    .card__quality[data-quality="HDTV"], .card-v2 .card__quality[data-quality="HDTV"] { 
        background: linear-gradient(135deg, #2ecc71, #27ae60) !important; 
        color: white !important; 
    } 
    
    /* TC/TS/TELECINE */ 
    .card__quality[data-quality="TC"], .card__quality[data-quality="TS"], .card__quality[data-quality="TELECINE"], .card-v2 .card__quality[data-quality="TC"], .card-v2 .card__quality[data-quality="TS"], .card-v2 .card__quality[data-quality="TELECINE"] { 
        background: linear-gradient(135deg, #ff6b6b, #e74c3c) !important; 
        color: white !important; 
    } 
    
    /* VHS */ 
    .card__quality[data-quality="VHS"], .card-v2 .card__quality[data-quality="VHS"] { 
        background: linear-gradient(135deg, #00cccc, #009999) !important; 
        color: white !important; 
    } 
    
    /* DVDRIP */ 
    .card__quality[data-quality="DVDRIP"], .card-v2 .card__quality[data-quality="DVDRIP"] { 
        background: linear-gradient(135deg, #88ff88, #aaffaa) !important; 
        color: black !important; 
    } 
    
    /* DVB */ 
    .card__quality[data-quality="DVB"], .card-v2 .card__quality[data-quality="DVB"] { 
        background: linear-gradient(135deg, #ffddbb, #ff99cc) !important; 
        color: black !important; 
    } 
    
    /* По умолчанию */ 
    .card__quality:not([data-quality]), .card-v2 .card__quality:not([data-quality]) { 
        background: #fff816 !important; 
        color: black !important; 
    } 
    `; 

    // Стили для рейтингов и голосования
    var ratingStyles = `
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
    
    .card__vote::before { 
        /* Иконка звезды */ 
        content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 -960 960 960'%3E%3Cpath fill='%2362a3c9' d='M349.923-241.308 480-320.077l131.077 79.769-34.615-148.307 115.384-99.924L540.077-502 480-642.308 420.923-503l-151.769 13.461 115.384 99.693-34.615 148.538ZM283-150.076l52.615-223.539-173.923-150.847 229.231-18.846L480-754.693l90.077 211.385 228.231 18.846-173.923 150.847L677-150.076 480-268.923 283-150.076Zm197-281.616Z'/%3E%3C/svg%3E"); 
        width: 24px; 
        height: 24px; 
        margin-bottom: 1px; 
        display: flex; 
        justify-content: center; 
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
    
    .explorer-card__head-rate > svg { 
        /* Иконка звезды */ 
        width: 1.5em !important; 
        height: 1.5em !important; 
        margin-right: 0.5em; 
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
    
    /* Общие стили для всех иконок рейтингов */ 
    .full-start__rate > div:last-child, 
    .full-start__rate .source--name { 
        font-size: 0; /* Скрываем текст */ 
        color: transparent; 
        display: inline-block; 
        width: 24px; 
        height: 24px; 
        background-repeat: no-repeat; 
        background-position: center; 
        background-size: contain; 
    } 
    
    /* TMDB из официального лого */ 
    .rate--tmdb .source--name { 
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 185.04 133.4'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:url(%23linear-gradient);%7D%3C/style%3E%3ClinearGradient id='linear-gradient' y1='66.7' x2='185.04' y2='66.7' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%2390cea1'/%3E%3Cstop offset='0.56' stop-color='%233cbec9'/%3E%3Cstop offset='1' stop-color='%2300b3e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ctitle%3EAsset 4%3C/title%3E%3Cg id='Layer_2' data-name='Layer 2'%3E%3Cg id='Layer_1-2' data-name='Layer 1'%3E%3Cpath class='cls-1' d='M51.06,66.7h0A17.67,17.67,0,0,1,68.73,49h-.1A17.67,17.67,0,0,1,86.3,66.7h0A17.67,17.67,0,0,1,68.63,84.37h.1A17.67,17.67,0,0,1,51.06,66.7Zm82.67-31.33h32.9A17.67,17.67,0,0,0,184.3,17.7h0A17.67,17.67,0,0,0,166.63,0h-32.9A17.67,17.67,0,0,0,116.06,17.7h0A17.67,17.67,0,0,0,133.73,35.37Zm-113,98h63.9A17.67,17.67,0,0,0,102.3,115.7h0A17.67,17.67,0,0,0,84.63,98H20.73A17.67,17.67,0,0,0,3.06,115.7h0A17.67,17.67,0,0,0,20.73,133.37Zm83.92-49h6.25L125.5,49h-8.35l-8.9,23.2h-.1L99.4,49H90.5Zm32.45,0h7.8V49h-7.8Zm22.2,0h24.95V77.2H167.1V70h15.35V62.8H167.1V56.2h16.25V49h-24ZM10.1,35.4h7.8V6.9H28V0H0V6.9H10.1ZM39,35.4h7.8V20.1H61.9V35.4h7.8V0H61.9V13.2H46.75V0H39Zm41.25,0h25V28.2H88V21h15.35V13.8H88V7.2h16.25V0h-24Zm-79,49H9V57.25h.1l9,27.15H24l9.3-27.15h.1V84.4h7.8V49H29.45l-8.2,23.1h-.1L13,49H1.2Zm112.09,49H126a24.59,24.59,0,0,0,7.56-1.15,19.52,19.52,0,0,0,6.35-3.37,16.37,16.37,0,0,0,4.37-5.5A16.91,16.91,0,0,0,146,115.8a18.5,18.5,0,0,0-1.68-8.25,15.1,15.1,0,0,0-4.52-5.53A18.55,18.55,0,0,0,133.07,99,33.54,33.54,0,0,0,125,98H113.29Zm7.81-28.2h4.6a17.43,17.43,0,0,1,4.67.62,11.68,11.68,0,0,1,3.88,1.88,9,9,0,0,1,2.62,3.18,9.87,9.87,0,0,1,1,4.52,11.92,11.92,0,0,1-1,5.08,8.69,8.69,0,0,1-2.67,3.34,10.87,10.87,0,0,1-4,1.83,21.57,21.57,0,0,1-5,.55H121.1Zm36.14,28.2h14.5a23.11,23.11,0,0,0,4.73-.5,13.38,13.38,0,0,0,4.27-1.65,9.42,9.42,0,0,0,3.1-3,8.52,8.52,0,0,0,1.2-4.68,9.16,9.16,0,0,0-.55-3.2,7.79,7.79,0,0,0-1.57-2.62,8.38,8.38,0,0,0-2.45-1.85,10,10,0,0,0-3.18-1v-.1a9.28,9.28,0,0,0,4.43-2.82,7.42,7.42,0,0,0,1.67-5,8.34,8.34,0,0,0-1.15-4.65,7.88,7.88,0,0,0-3-2.73,12.9,12.9,0,0,0-4.17-1.3,34.42,34.42,0,0,0-4.63-.32h-13.2Zm7.8-28.8h5.3a10.79,10.79,0,0,1,1.85.17,5.77,5.77,0,0,1,1.7.58,3.33,3.33,0,0,1,1.23,1.13,3.22,3.22,0,0,1,.47,1.82,3.63,3.63,0,0,1-.42,1.8,3.34,3.34,0,0,1-1.13,1.2,4.78,4.78,0,0,1-1.57.65,8.16,8.16,0,0,1-1.78.2H165Zm0,14.15h5.9a15.12,15.12,0,0,1,2.05.15,7.83,7.83,0,0,1,2,.55,4,4,0,0,1,1.58,1.17,3.13,3.13,0,0,1,.62,2,3.71,3.71,0,0,1-.47,1.95,4,4,0,0,1-1.23,1.3,4.78,4.78,0,0,1-1.67.7,8.91,8.91,0,0,1-1.83.2h-7Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); 
    } 
    
    /* IMDb из официального лого */ 
    .rate--imdb > div:last-child { 
        background-image: url("data:image/svg+xml,%3Csvg fill='%23ffcc00' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='SVGRepo_bgCarrier' stroke-width='0'%3E%3C/g%3E%3Cg id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'%3E%3