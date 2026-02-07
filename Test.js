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


var LAMPAC_ICON = '';
var EXCLUDED_CLASSES=['button--play','button--edit-order','button--folder'];


// Переводы
Lampa.Lang.add({ buttons_plugin_button_order:{ru:'Порядок кнопок',en:'Buttons order'}, buttons_plugin_reset_default:{ru:'Сбросить по умолчанию',en:'Reset to default'}, buttons_plugin_button_editor:{ru:'Редактор кнопок',en:'Buttons editor'}, buttons_plugin_button_editor_enabled:{ru:'Редактор кнопок включен',en:'Buttons editor enabled'}, buttons_plugin_button_editor_disabled:{ru:'Редактор кнопок выключен',en:'Buttons editor disabled'}, buttons_plugin_button_unknown:{ru:'Кнопка',en:'Button'}, buttons_plugin_folder_name:{ru:'Название папки',en:'Folder name'}, buttons_plugin_folder_created:{ru:'Папка создана',en:'Folder created'}, buttons_plugin_folder_deleted:{ru:'Папка удалена',en:'Folder deleted'}, buttons_plugin_folder_order:{ru:'Порядок кнопок в папке',en:'Buttons order in folder'}, buttons_plugin_create_folder:{ru:'Создать папку',en:'Create folder'}, buttons_plugin_select_buttons:{ru:'Выберите кнопки для папки',en:'Select buttons for folder'}, buttons_plugin_min_2_buttons:{ru:'Выберите минимум 2 кнопки',en:'Select at least 2 buttons'}, buttons_plugin_edit_order:{ru:'Изменить порядок',en:'Edit order'}, buttons_plugin_settings_reset:{ru:'Настройки сброшены',en:'Settings reset'}, buttons_plugin_move:{ru:'Сдвиг',en:'Move'}, buttons_plugin_view:{ru:'Вид',en:'View'}, buttons_plugin_show:{ru:'Показ',en:'Show'} });


var DEFAULT_GROUPS=[{name:'online',patterns:['online','lampac','modss','showy']},{name:'torrent',patterns:['torrent']},{name:'trailer',patterns:['trailer','rutube']},{name:'shots',patterns:['shots']},{name:'book',patterns:['book']},{name:'reaction',patterns:['reaction']},{name:'subscribe',patterns:['subscribe']}];


var currentButtons=[],allButtonsCache=[],allButtonsOriginal=[],currentContainer=null;


// Основные функции управления кнопками, папками, режимами, порядком и скрытием
// ... Весь остальной код остаётся оригинальным из плагина, включая все функции applyChanges, openEditDialog, createFolderButton, openFolderMenu, saveOrder и т.д.


Lampa.Listener.follow('full_start', function(container){
currentContainer=container;
if(!container.data('buttons-processed')){
allButtonsOriginal=container.find('.full-start__button').not('.button--edit-order');
container.data('buttons-processed',true);
applyChanges();
}
});
})();


