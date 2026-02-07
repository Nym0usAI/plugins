/**




Плагин управления кнопками Lampa


Версия: 1.1.1


Автор: @Cheeze_l





Описание:


Плагин для управления кнопками на странице фильма/сериала в Lampa.


Возможности: порядок кнопок, скрытие/показ, создание папок, режимы текста.
*/
(function() {
'use strict';




// Полные polyfills для старых устройств
if (!Array.prototype.forEach) { Array.prototype.forEach = function(callback, thisArg) { var O = Object(this); var len = O.length >>> 0; var T = thisArg; for (var k=0; k<len; k++) { if (k in O) callback.call(T,O[k],k,O); } }; }
if (!Array.prototype.filter) { Array.prototype.filter = function(callback,thisArg){ var O = Object(this); var len=O.length>>>0; var res=[]; var T=thisArg; for(var k=0;k<len;k++){if(k in O){if(callback.call(T,O[k],k,O)) res.push(O[k]);}} return res;};}
if (!Array.prototype.find) { Array.prototype.find=function(callback,thisArg){var O=Object(this);var len=O.length>>>0;var T=thisArg;for(var k=0;k<len;k++){if(k in O){if(callback.call(T,O[k],k,O)) return O[k];}} return undefined;};}
if (!Array.prototype.some) { Array.prototype.some=function(callback,thisArg){var O=Object(this);var len=O.length>>>0;var T=thisArg;for(var k=0;k<len;k++){if(k in O&&callback.call(T,O[k],k,O)) return true;}return false;};}
if (!Array.prototype.indexOf) { Array.prototype.indexOf=function(searchElement,fromIndex){var O=Object(this);var len=O.length>>>0;var n=fromIndex|0;var k=Math.max(n>=0?n:len-Math.abs(n),0);while(k<len){if(k in O&&O[k]===searchElement) return k;k++;}return -1;};}


// Отключена анимация кнопок
function animateBtnFadeIn(buttons){ /* пусто */ }


var LAMPAC_ICON = '<path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1


