// ultra-minimal-captions.js
(function(){
    var showIn = ["Релизы","Избранное","История","Торренты","Поиск"];
    function check(){
        var t = document.querySelector('.head__title')?.textContent || '';
        var show = showIn.some(s => t.includes(s));
        var s = document.getElementById('cap-fix') || document.createElement('style');
        s.id='cap-fix'; s.textContent = show ? '.card__age,.card__title{display:block!important}' : '.card__age,.card__title{display:none!important}';
        document.head.appendChild(s);
    }
    setInterval(check, 1500);
    setTimeout(check, 500);
})();
