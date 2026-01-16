(function () {
    "use strict";
    
    if (typeof Lampa === "undefined") return;
    
    console.log("[Captions Mini] Плагин запущен");
    
    // 1. РАЗДЕЛЫ где названия ДОЛЖНЫ показываться
    var SHOW_SECTIONS = ["Релизы", "Избранное", "История", "Торренты", "Поиск"];
    
    // 2. Основная функция проверки раздела
    function shouldShowCaptions() {
        // Ищем заголовок страницы
        var title = document.querySelector('.head__title');
        if (title && title.textContent) {
            var section = title.textContent.trim();
            // Проверяем, есть ли этот раздел в нашем списке
            return SHOW_SECTIONS.some(function(s) {
                return section.includes(s) || s.includes(section);
            });
        }
        return false;
    }
    
    // 3. Добавляем CSS стили
    function updateStyles() {
        var show = shouldShowCaptions();
        var css = show 
            ? `.card .card__age, .card .card__title { display: block !important; }`
            : `.card .card__age, .card .card__title { display: none !important; }`;
        
        // Удаляем старые стили
        var oldStyle = document.getElementById('captions-mini-style');
        if (oldStyle) oldStyle.remove();
        
        // Добавляем новые
        var style = document.createElement('style');
        style.id = 'captions-mini-style';
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    // 4. Запускаем при загрузке
    setTimeout(updateStyles, 1000);
    
    // 5. Обновляем при изменениях на странице (простой наблюдатель)
    setInterval(updateStyles, 2000);
    
    console.log("[Captions Mini] Готово. Названия скрыты везде кроме: " + SHOW_SECTIONS.join(", "));
    
})();
