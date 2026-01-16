// ultra-fast-captions.js
(function(){
    var showIn = ["Релизы","Избранное","История","Торренты","Поиск"];
    function update(){
        var t = document.querySelector('.head__title')?.textContent?.trim() || '';
        var show = showIn.includes(t);
        var s = document.getElementById('cap-uf') || document.createElement('style');
        s.id='cap-uf'; 
        s.textContent = show 
            ? '.card__age,.card__title{display:block!important}' 
            : '.card__age,.card__title{display:none!important}';
        document.head.appendChild(s);
    }
    new MutationObserver(update).observe(document.body,{
        childList:true, subtree:true, characterData:true
    });
    update(); // Сразу при запуске
})();
