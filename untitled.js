(function() {
    'use strict';

    Lampa.Platform.tv();

    // Original string array and accessor functions
    var string_array_snapshot = [
        '.settings-param > div:contains("Мои темы")', 'hover:enter hover:click', '10tKwlSs', 'selectGroup', 'logo', 'Activity', '#ffe216', 'Template', 'collectionFocus', 'show', 'console', 'parent', 'set', 'hasClass', 'removeItem', '4dljhcu', 'my_themes', 'bind', '<div class="info layer--width"><div class="info__left"><div class="info__title"></div><div class="info__title-original"></div><div class="info__create"></div></div><div class="info__right">  <div id="stantion_filtr"></div></div></div>', '47475BXhtza', '#353535a6', '.info__title', 'Reguest', '.card__img', 'toString', 'canmove', 'right', 'enabled', '42kKXRSO', 'active', 'false', 'createElement', 'pause', '-3%', 'myBackground', '0.3em', 'clear', 'destroy', 'css', 'info_tvtv', 'Focus Pack', '143nmiQCe', 'type', 'card', 'build', '70%', '.card__quality', 'card__quality', 'Empty', 'background', 'trace', 'table', 'warn', 'append', 'origin', 'layer--wheight', 'Удалить', 'prototype', 'get', 'data', 'myBlackStyle', 'addClass', 'onerror', 'change', 'toggle', 'update', 'return (function() ', 'head', 'Background', 'url', 'static', 'loader', 'Select', 'start', 'absolute', 'src', 'left', 'Manifest', 'silent', '.view--category', 'hover:focus', 'div[data-name="interface_size"]', 'ready', '37992KKoOiC', 'push', '__proto__', 'myGlassStyle', 'app', 'activity', 'down', 'move', 'collectionSet', '42wBTKCW', '.card__view', 'history', 'https://bylampa.github.io/themes/categories/stroke.json', 'listener', 'button_category', 'Тема установлена:', 'themesCurrent', 'uppercase', '<div class="my_themes category-full"></div>', 'getItem', 'insertAfter', '.settings-param', 'focus', 'Scroll', 'Установить', '<div id=\'button_category\'><style>@media screen and (max-width: 2560px) {.themes .card--collection {width: 14.2%!important;}.scroll__content {padding:1.5em 0!important;}.info {height:9em!important;}.info__title-original {font-size:1.2em;}}@media screen and (max-width: 385px) {.info__right {display:contents!important;}.themes .card--collection {width: 33.3%!important;}}@media screen and (max-width: 580px) {.info__right {display:contents!important;}.themes .card--collection {width: 25%!important;}}</style><div class="full-start__button selector view--category"><svg style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="info"/><g id="icons"><g id="menu"><path d="M20,10H4c-1.1,0-2,0.9-2,2c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2C22,10.9,21.1,10,20,10z" fill="currentColor"/><path d="M4,8h12c1.1,0,2-0.9,2-2c0-1.1-0.9-2-2-2H4C2.9,4,2,4.9,2,6C2,7.1,2.9,8,4,8z" fill="currentColor"/><path d="M16,16H4c-1.1,0-2,0.9-2,2c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2C18,16.9,17.1,16,16,16z" fill="currentColor"/></g></g></svg> <span>Категории тем</span>\n </div></div>', 'center', 'glass_style', 'selectedTheme', 'black_style', '0.4em 0.4em', 'mheight', 'setItem', '8632KUwyHe', '(((.+)+)+)$', 'hover:enter', '0.8em', 'name', 'component', '56606kcZTCE', 'constructor', 'addParam', '168716nqOicV', 'content', 'Storage', '126729cBBLCH', 'remove', 'Listener', '<div></div>', 'backward', '.settings-folder', 'add', 'body', 'link[rel="stylesheet"][href^="https://bylampa.github.io/themes/css/"]', 'Ошибка доступа', '#button_category', 'Controller', 'follow', 'Измени палитру элементов приложения', 'length', 'log', '129665culwCe', 'Color Gallery', 'stringify', '#000', 'render', 'pointer', '<link rel="stylesheet" href="', 'onload', 'find', 'title', './img/img_broken.svg', 'menu', '{}.constructor("return this")()', 'Установлена'
    ];
    var string_offset = 0x87;

    function getStringFromSnapshot(hex_val) {
        var index = hex_val - string_offset;
        if (index >= 0 && index < string_array_snapshot.length) {
            return string_array_snapshot[index];
        }
        return "STRING_LOOKUP_ERROR(" + hex_val + ")";
    }

    // This IIFE shuffles the string array.
    (function(shufflerFunc, targetValue) {
        var getString = function(hex) { return getStringFromSnapshot(hex); };
        var stringArrayRef = shufflerFunc();

        while (true) {
            try {
                var calculatedValue = -parseInt('.card__quality') / 0x1 + 
                                   -parseInt('listener') / 0x2 * (parseInt('0.4em 0.4em') / 0x3) + 
                                   parseInt('0.8em') / 0x4 + 
                                   -parseInt('card__quality') / 0x5 * (-parseInt('hover:enter hover:click') / 0x6) + 
                                   -parseInt('backward') / 0x7 * (parseInt('my_themes') / 0x8) + 
                                   -parseInt('Focus Pack') / 0x9 * (-parseInt('add') / 0xa) + 
                                   -parseInt('Установить') / 0xb * (parseInt('menu') / 0xc);
                if (calculatedValue === targetValue) break;
                else stringArrayRef.push(stringArrayRef.shift());
            } catch (error) {
                stringArrayRef.push(stringArrayRef.shift());
            }
        }
    }(function() { return string_array_snapshot; }, 0x18e0f));

    // Main plugin logic
    (function() {
        var antiDebugFunc1 = (function() {
            var isFirstCall = true;
            return function(callback, context) {
                var wrappedFunc = isFirstCall ? function() {
                    if (context) {
                        var result = context.apply(callback, arguments);
                        context = null;
                        return result;
                    }
                } : function() {};
                isFirstCall = false;
                return wrappedFunc;
            };
        }());

        var antiDebugFunc2 = (function() {
            var isFirstCall = true;
            return function(callback, context) {
                var wrappedFunc = isFirstCall ? function() {
                    if (context) {
                        var result = context.apply(callback, arguments);
                        context = null;
                        return result;
                    }
                } : function() {};
                isFirstCall = false;
                return wrappedFunc;
            };
        }());

        function initPlugin() {
            var debugCheck1 = antiDebugFunc1(this, function() {
                return debugCheck1.toString().search('right').toString().constructor(debugCheck1).search('right');
            });
            debugCheck1();

            var debugCheck2 = antiDebugFunc2(this, function() {
                var globalObj;
                try {
                    var getGlobal = Function('return (function() ' + '{}.constructor("return this")()' + ');');
                    globalObj = getGlobal();
                } catch (error) {
                    globalObj = window;
                }
                var consoleObj = globalObj.console = globalObj.console || {},
                    methods = ['log', 'warn', 'info', 'error', 'exception', 'table', 'trace'];
                for (var i = 0; i < methods.length; i++) {
                    var originalMethod = antiDebugFunc2.constructor.prototype.bind(antiDebugFunc2),
                        methodName = methods[i],
                        originalConsoleMethod = consoleObj[methodName] || originalMethod;
                    originalMethod.toString = antiDebugFunc2.bind(antiDebugFunc2);
                    originalMethod.toString = originalConsoleMethod.toString.bind(originalConsoleMethod);
                    consoleObj[methodName] = originalMethod;
                }
            });
            debugCheck2();


            var selectedTheme = localStorage.getItem('selectedTheme');
            if (selectedTheme) {
                var themeLink = $('<link rel="stylesheet" href="' + selectedTheme + '">');
                $('head').append(themeLink);
            }

            Lampa.SettingsApi.addParam({
                'component': 'interface',
                'param': {
                    'name': 'my_themes',
                    'type': 'Select'
                },
                'field': {
                    'name': 'Мои темы',
                    'description': 'Измени палитру элементов приложения'
                },
                'onRender': function(settingsElement) {
                    setTimeout(function() {
                        $('.settings-param').parent().insertAfter($('.settings-folder'));
                        settingsElement.on('hover:enter', function() {
                            setTimeout(function() {
                                if ($('.settings-param > div:contains("Мои темы")').length || $('div[data-name="interface_size"]').length) {
                                    window.history.back();
                                }
                            }, 50);
                            setTimeout(function() {
                                var currentTheme = Lampa.Storage.get('themesCurrent');
                                var themeData;
                                if (currentTheme !== '') {
                                   themeData = JSON.parse(JSON.stringify(currentTheme));
                                } else {
                                   themeData = {
                                        'url': 'https://bylampa.github.io/themes/categories/stroke.json',
                                        'title': 'Focus Pack',
                                        'component': 'info_tvtv',
                                        'page': 1
                                    };
                                }
                                Lampa.Activity.push(themeData);
                                Lampa.Storage.set('themesCurrent', JSON.stringify(Lampa.Activity.active()));
                            }, 100);
                        });
                    }, 0);
                }
            });

            function ThemesComponent(initialData) {
                var request = new Lampa.Request();
                var scroll = new Lampa.Scroll({
                    'mask': true,
                    'over': true,
                    'step': 250
                });
                var cards = [];
                var container = $('<div></div>');
                var themesContainer = $('<div class="my_themes category-full"></div>');
                var categoryButton, infoPanel;
                var categories = [{
                    'title': 'Focus Pack',
                    'url': 'https://bylampa.github.io/themes/categories/stroke.json'
                }, {
                    'title': 'Color Gallery',
                    'url': 'https://bylampa.github.io/themes/categories/color_gallery.json'
                }];

                this.create = function() {
                    var self = this;
                    return this.activity.loader(true);
                    request.start(initialData.url, this.build.bind(this), function() {
                        var template = new Lampa.Template();
                        container.append(template.render());
                        self.start = template.start;
                        self.activity.loader(false);
                        self.activity.toggle();
                    });
                    this.render();
                };

                this.append = function(themes) {
                    var self = this;
                    themes.forEach(function(theme) {
                        var card = Lampa.Template.get('card', {
                            'title': theme.title,
                            'release_year': ''
                        });
                        card.addClass('card--collection');
                        card.find('.card__img').css({
                            'cursor': 'pointer',
                            'background-color': '#353535a6'
                        });
                        card.css({
                            'text-align': 'center'
                        });
                        var cardImage = card.find('.card__img')[0];
                        cardImage.onload = function() {
                            card.addClass('card--loaded');
                        };
                        cardImage.onerror = function(error) {
                            cardImage.src = './img/img_broken.svg';
                        };
                        cardImage.src = theme.logo;
                        $('.info__title').empty();

                        function markAsInstalled() {
                            var installedBadge = document.createElement('div');
                            installedBadge.innerText = 'Установлена';
                            installedBadge.classList.add('card__quality');
                            card.find('.card__view').append(installedBadge);
                            $(installedBadge).css({
                                'position': 'absolute',
                                'left': '-3%',
                                'bottom': '70%',
                                'padding': '0.4em 0.4em',
                                'background': '#ffe216',
                                'color': '#000',
                                'fontSize': '0.8em',
                                'WebkitBorderRadius': '0.3em',
                                'MozBorderRadius': '0.3em',
                                'borderRadius': '0.3em',
                                'textTransform': 'uppercase'
                            });
                        }
                        var currentTheme = localStorage.getItem('selectedTheme');
                        if (currentTheme && theme.css === currentTheme) markAsInstalled();

                        card.on('hover:focus', function() {
                            categoryButton = card[0];
                            scroll.focus(card, true);
                            infoPanel.find('.info__title').text(theme.title);
                        });

                        var themeCss = theme.css;
                        card.on('hover:enter', function() {
                            var controllerState = Lampa.Controller.enabled().content;
                            var menuItems = [];
                            menuItems.push({
                                'title': 'Установить'
                            });
                            menuItems.push({
                                'title': 'Удалить'
                            });
                            Lampa.Select.show({
                                'title': '',
                                'items': menuItems,
                                'onBack': function backHandler() {
                                    Lampa.Controller.toggle('activity');
                                },
                                'onSelect': function selectHandler(item) {
                                    if (item.title == 'Установить') {
                                        $('link[rel="stylesheet"][href^="https://bylampa.github.io/themes/css/"]').remove();
                                        var themeStyle = $('<link rel="stylesheet" href="' + themeCss + '">');
                                        $('head').append(themeStyle);
                                        localStorage.setItem('selectedTheme', themeCss);
                                        console.log('Тема установлена:', themeCss);
                                        if ($('.card__quality').length > 0) $('.card__quality').remove();
                                        markAsInstalled();
                                        if (Lampa.Storage.get('myBackground') == true) {
                                            var backgroundValue = Lampa.Storage.get('myBackground');
                                            Lampa.Storage.set('myBackground', backgroundValue);
                                            Lampa.Storage.set('background', 'false');
                                        }
                                        if (Lampa.Storage.get('glass_style') == true) {
                                            var glassStyleValue = Lampa.Storage.get('glass_style');
                                            Lampa.Storage.set('myGlassStyle', glassStyleValue);
                                            Lampa.Storage.set('glass_style', 'false');
                                        }
                                        if (Lampa.Storage.get('black_style') == true) {
                                            var blackStyleValue = Lampa.Storage.get('black_style');
                                            Lampa.Storage.set('myBlackStyle', blackStyleValue);
                                            Lampa.Storage.set('black_style', 'false');
                                        }
                                        Lampa.Controller.toggle('activity');
                                    } else if (item.title == 'Удалить') {
                                        $('link[rel="stylesheet"][href^="https://bylampa.github.io/themes/css/"]').remove();
                                        localStorage.removeItem('selectedTheme');
                                        $('.card__quality').remove();
                                        if(localStorage.getItem('myBackground')) Lampa.Storage.set('myBackground', Lampa.Storage.get('myBackground'));
                                        localStorage.removeItem('myBackground');
                                        if(localStorage.getItem('myGlassStyle')) Lampa.Storage.set('glass_style', Lampa.Storage.get('myGlassStyle'));
                                        localStorage.removeItem('myGlassStyle');
                                        if(localStorage.getItem('myBlackStyle')) Lampa.Storage.set('black_style', Lampa.Storage.get('myBlackStyle'));
                                        localStorage.removeItem('myBlackStyle');
                                        Lampa.Controller.toggle('activity');
                                    }
                                }
                            });
                        });
                        themesContainer.append(card);
                        cards.push(card);
                    });
                };

                this.build = function(themes) {
                    var self = this;
                    Lampa.Listener.send('');
                    Lampa.Template.add('#button_category', '<div id=\'button_category\'><style>@media screen and (max-width: 2560px) {.themes .card--collection {width: 14.2%!important;}.scroll__content {padding:1.5em 0!important;}.info {height:9em!important;}.info__title-original {font-size:1.2em;}}@media screen and (max-width: 385px) {.info__right {display:contents!important;}.themes .card--collection {width: 33.3%!important;}}@media screen and (max-width: 580px) {.info__right {display:contents!important;}.themes .card--collection {width: 25%!important;}}</style><div class="full-start__button selector view--category"><svg style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="info"/><g id="icons"><g id="menu"><path d="M20,10H4c-1.1,0-2,0.9-2,2c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2C22,10.9,21.1,10,20,10z" fill="currentColor"/><path d="M4,8h12c1.1,0,2-0.9,2-2c0-1.1-0.9-2-2-2H4C2.9,4,2,4.9,2,6C2,7.1,2.9,8,4,8z" fill="currentColor"/><path d="M16,16H4c-1.1,0-2,0.9-2,2c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2C18,16.9,17.1,16,16,16z" fill="currentColor"/></g></g></svg> <span>Категории тем</span>\n </div></div>');
                    Lampa.Template.add('info_tvtv', '<div class="info layer--width"><div class="info__left"><div class="info__title"></div><div class="info__title-original"></div><div class="info__create"></div></div><div class="info__right">  <div id="stantion_filtr"></div></div></div>');

                    var categoryButtonTemplate = Lampa.Template.get('#button_category');
                    infoPanel = Lampa.Template.get('info_tvtv');
                    infoPanel.find('#stantion_filtr').append(categoryButtonTemplate);
                    infoPanel.find('.full-start__button').on('hover:enter hover:click', function() {
                        self.selectGroup();
                    });
                    scroll.render().addClass('layer--wheight').mheight('mheight', infoPanel);
                    container.append(infoPanel.append());
                    container.append(scroll.render());
                    this.append(themes);
                    scroll.append(themesContainer);
                    this.activity.loader(false);
                    this.activity.toggle();
                };

                this.selectGroup = function() {
                    Lampa.Select.show({
                        'title': 'Категории тем',
                        'items': categories,
                        'onSelect': function handler(selectedItem) {
                            Lampa.Activity.push({
                                'url': selectedItem.url,
                                'title': selectedItem.title,
                                'component': 'info_tvtv',
                                'page': 1
                            });
                            Lampa.Storage.set('themesCurrent', JSON.stringify(Lampa.Activity.active()));
                        },
                        'onBack': function backHandler() {
                            Lampa.Controller.toggle('activity');
                        }
                    });
                };
                
                this.start = function() {
                    var self = this;
                    Lampa.Controller.add('activity', {
                        'toggle': function toggleHandler() {
                            Lampa.Controller.collectionSet(scroll.render());
                            Lampa.Controller.collectionFocus(categoryButton || false, scroll.render());
                        },
                        'left': function leftHandler() {
                            if (Navigator.canmove('left')) Navigator.move('left');
                            else Lampa.Controller.toggle('menu');
                        },
                        'right': function rightHandler() {
                            if (Navigator.canmove('right')) Navigator.move('right');
                            else self.selectGroup();
                        },
                        'up': function upHandler() {
                            if (Navigator.canmove('up')) Navigator.move('up');
                            else {
                                if (!infoPanel.find('.full-start__button').hasClass('active')) {
                                    Lampa.Controller.collectionSet(infoPanel);
                                    Navigator.move('right');
                                } else Lampa.Controller.toggle('Controller');
                            }
                        },
                        'down': function downHandler() {
                            if (Navigator.canmove('down')) Navigator.move('down');
                            else if (infoPanel.find('.full-start__button').hasClass('active')) {
                                Lampa.Controller.toggle('activity');
                            }
                        },
                        'back': function backHandler() {
                            Lampa.Activity.backward();
                        }
                    });
                    Lampa.Controller.toggle('activity');
                };

                this.pause = function() {};
                this.stop = function() {};
                this.render = function() {
                    return container;
                };
                this.destroy = function() {
                    request.clear();
                    scroll.destroy();
                    if (infoPanel) infoPanel.remove();
                    container.remove();
                    themesContainer.remove();
                    request = null;
                    cards = null;
                    container = null;
                    themesContainer = null;
                    infoPanel = null;
                };
            }

            Lampa.Component.add('info_tvtv', ThemesComponent);
            Lampa.Storage.listener.follow('app', function(event) {
                if (event.name == 'change') {
                    if (Lampa.Activity.active().component !== 'info_tvtv') {
                        $('.view--category').remove();
                    }
                }
            });
        }

        if (window.appready) {
            initPlugin();
        } else {
            Lampa.Listener.follow('app', function(event) {
                if (event.type == 'ready') initPlugin();
            });
        }
    }());
}());