// ==UserScript==
// @name         Combined Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Объединение Lable.js, Color-rating.js, themes.js и title.js
// @author       Ваше имя
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Lable.js
    function addLabels() {
        // Пример: добавление метки к элементам с классом 'example'
        document.querySelectorAll('.example').forEach(el => {
            const label = document.createElement('span');
            label.textContent = 'Метка';
            label.style.backgroundColor = '#ff0';
            el.appendChild(label);
        });
    }

    // 2. Color-rating.js
    function applyColors() {
        // Для элементов .card__vote
        document.querySelectorAll('.card__vote').forEach(el => {
            const rating = parseFloat(el.textContent.trim());
            el.style.background = 'rgba(0, 0, 0, 0.8)';

            if(rating >= 0 && rating <= 3) el.style.color = '#e74c3c';
            else if(rating > 3 && rating <= 5) el.style.color = '#e67e22';
            else if(rating > 5 && rating <= 6.5) el.style.color = '#f1c40f';
            else if(rating > 6.5 && rating < 8) el.style.color = '#3498db';
            else if(rating >= 8 && rating <= 10) el.style.color = '#2ecc71';
        });

        // Для элементов .full-start__rate > div, .info__rate > span
        document.querySelectorAll('.full-start__rate > div, .info__rate > span').forEach(el => {
            const rating = parseFloat(el.textContent.trim());

            if(rating >= 0 && rating <= 3) el.style.color = '#e74c3c';
            else if(rating > 3 && rating <= 5) el.style.color = '#e67e22';
            else if(rating > 5 && rating <= 6.5) el.style.color = '#f1c40f';
            else if(rating > 6.5 && rating < 8) el.style.color = '#3498db';
            else if(rating >= 8 && rating <= 10) el.style.color = '#2ecc71';
        });
    }

    // 3. themes.js
    function applyTheme() {
        // Пример: установка темы оформления
        document.body.classList.add('dark-theme');
    }

    // 4. title.js
    function setTitle() {
        // Пример: изменение заголовка страницы
        document.title = 'Новый заголовок страницы';
    }

    // Инициализация после загрузки DOM
    document.addEventListener('DOMContentLoaded', () => {
        addLabels();
        applyColors();
        applyTheme();
        setTitle();
    });

    // Наблюдение за изменениями в DOM для повторного применения цветов
    const observer = new MutationObserver(applyColors);
    observer.observe(document.body, {childList: true, subtree: true});
})();