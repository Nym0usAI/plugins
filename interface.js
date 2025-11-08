(function () {
    'use strict';

    function create() {
        var html;
        var timer;
        var network = new Lampa.Request(); // ✅ заменено с Reguest()
        var loaded = {};

        this.create = function () {
            html = $(`<div class="new-interface-info">
                <div class="new-interface-info__body">
                    <div class="new-interface-info__head"></div>
                    <div class="new-interface-info__title"></div>
                    <div class="new-interface-info__details"></div>
                    <div class="new-interface-info__description"></div>
                </div>
            </div>`);
        };

        this.update = function (data) {
            html.find('.new-interface-info__head,.new-interface-info__details').text('---');
            html.find('.new-interface-info__title').text(data.title);
            html.find('.new-interface-info__description').text(data.overview || Lampa.Lang.translate('full_notext'));
            Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
            this.load(data);
        };

        this.draw = function (data) {
            var create = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4);
            var vote = parseFloat((data.vote_average || 0) + '').toFixed(1);
            var head = [];
            var details = [];
            var countries = Lampa.Api.sources.tmdb.parseCountries(data);
            var pg = Lampa.Api.sources.tmdb.parsePG(data);
            var hoursMinutes = `${parseInt(timeDuration(data)[0])}ч ${parseInt(timeDuration(data)[1])}мин`;

            if (create !== '0000') head.push('<span>' + create + '</span>');
            if (countries.length > 0) head.push(countries.join(', '));
            if (vote > 0) details.push('<div class="full-start__rate"><div>' + vote + '</div><div>TMDB</div></div>');
            if (pg) details.push('<span class="full-start__pg" style="font-size: 0.9em;">' + pg + '</span>');
            if (data.runtime) details.push('<span class="full-start__pg" style="font-size: 0.9em;">' + hoursMinutes + '</span>');
            if (data.number_of_seasons) details.push('<span class="full-start__pg" style="font-size: 0.9em;">Сезонов ' + data.number_of_seasons + '</span>');
            if (data.genres && data.genres.length > 0 && Lampa.Storage.field('Genres') == true)
                details.push(data.genres.map(it => Lampa.Utils.capitalizeFirstLetter(it.name)).join(' '));

            html.find('.new-interface-info__head').empty().append(head.join(', '));
            html.find('.new-interface-info__details').html(details.join('<span class="new-interface-info__split"> </span>'));
        };

        this.load = function (data) {
            var _this = this;

            clearTimeout(timer);
            var url = Lampa.TMDB.api(
                (data.name ? 'tv' : 'movie') +
                    '/' + data.id +
                    '?api_key=' + (Lampa.TMDB.api_key ? Lampa.TMDB.api_key() : Lampa.TMDB.key()) +
                    '&append_to_response=content_ratings,release_dates&language=' +
                    Lampa.Storage.get('language')
            );

            if (loaded[url]) return this.draw(loaded[url]);

            timer = setTimeout(function () {
                network.clear();
                network.timeout(5000);
                network.silent(url, function (movie) {
                    loaded[url] = movie;
                    _this.draw(movie);
                });
            }, 300);
        };

        this.render = function () {
            return html;
        };

        this.empty = function () {};
        this.destroy = function () {
            html.remove();
            loaded = {};
            html = null;
        };
    }

    function component(object) {
        var network = new Lampa.Request(); // ✅ заменено
        var scroll = new Lampa.Scroll({
            mask: true,
            over: true,
            scroll_by_item: true
        });
        var items = [];
        var html = $('<div class="new-interface"><img class="full-start__background"></div>');
        var active = 0;
        var newlampa = ((Lampa.App && Lampa.App.version_code) ? Lampa.App.version_code : Lampa.Manifest.app_digital) >= 166;
        var info;
        var lezydata;
        var viewall = Lampa.Storage.field('card_views_type') == 'view' || Lampa.Storage.field('navigation_type') == 'mouse';
        var background_img = html.find('.full-start__background');
        var background_last = '';
        var background_timer;

        this.create = function () {};

        this.empty = function () {
            var button;
            if (object.source == 'tmdb') {
                button = $('<div class="empty__footer"><div class="simple-button selector">' + Lampa.Lang.translate('change_source_on_cub') + '</div></div>');
                button.find('.selector').on('hover:enter', function () {
                    Lampa.Storage.set('source', 'cub');
                    Lampa.Activity.replace({ source: 'cub' });
                });
            }
            var empty = new Lampa.Empty();
            html.append(empty.render(button));
            this.start = empty.start;
            this.activity.loader(false);
            this.activity.toggle();
        };

        this.loadNext = function () {
            var _this = this;
            if (this.next && !this.next_wait && items.length) {
                this.next_wait = true;
                this.next(function (new_data) {
                    _this.next_wait = false;
                    new_data.forEach(_this.append.bind(_this));
                    if (Lampa.Layer && Lampa.Layer.visible) Lampa.Layer.visible(items[active + 1].render(true));
                }, function () {
                    _this.next_wait = false;
                });
            }
        };

        this.build = function (data) {
            var _this2 = this;

            lezydata = data;
            info = new create(object);
            info.create();
            scroll.minus(info.render());
            data.slice(0, viewall ? data.length : 2).forEach(this.append.bind(this));
            html.append(info.render());
            html.append(scroll.render());

            if (newlampa) {
                if (Lampa.Layer && Lampa.Layer.update) {
                    Lampa.Layer.update(html);
                    Lampa.Layer.visible(scroll.render(true));
                }
                scroll.onEnd = this.loadNext.bind(this);
                scroll.onWheel = function (step) {
                    if (!Lampa.Controller.own(_this2)) _this2.start();
                    if (step > 0) _this2.down();
                    else if (active > 0) _this2.up();
                };
            }

            this.activity.loader(false);
            this.activity.toggle();
        };

        this.append = function (element) {
            if (element.ready) return;
            element.ready = true;
            var item = new Lampa.InteractionLine(element, {
                url: element.url,
                card_small: true,
                cardClass: element.cardClass,
                genres: object.genres,
                object: object,
                card_wide: Lampa.Storage.field('WidePosters'),
                nomore: element.nomore
            });
            item.create();
            item.onDown = this.down.bind(this);
            item.onUp = this.up.bind(this);
            item.onBack = this.back.bind(this);
            item.onToggle = () => active = items.indexOf(item);
            if (this.onMore) item.onMore = this.onMore.bind(this);

            item.onFocus = elem => { info.update(elem); this.background(elem); };
            item.onHover = elem => { info.update(elem); this.background(elem); };

            item.onFocusMore = info.empty.bind(info);
            scroll.append(item.render());
            items.push(item);
        };

        this.background = function (elem) {
            var new_background = Lampa.Api.img(elem.backdrop_path, 'w1280');
            clearTimeout(background_timer);
            if (new_background == background_last) return;
            background_timer = setTimeout(function () {
                background_img.removeClass('loaded');
                background_img[0].onload = function () { background_img.addClass('loaded'); };
                background_img[0].onerror = function () { background_img.removeClass('loaded'); };
                background_last = new_background;
                setTimeout(() => { background_img[0].src = background_last; }, 300);
            }, 1000);
        };

        this.down = function () {
            active++;
            active = Math.min(active, items.length - 1);
            if (!viewall) lezydata.slice(0, active + 2).forEach(this.append.bind(this));
            items[active].toggle();
            scroll.update(items[active].render());
        };

        this.up = function () {
            active--;
            if (active < 0) {
                active = 0;
                Lampa.Controller.toggle('head');
            } else {
                items[active].toggle();
                scroll.update(items[active].render());
            }
        };

        this.back = function () {
            Lampa.Activity.backward();
        };

        this.render = function () {
            return html;
        };

        this.destroy = function () {
            network.clear();
            Lampa.Arrays.destroy(items);
            scroll.destroy();
            if (info) info.destroy();
            html.remove();
            items = null;
            network = null;
            lezydata = null;
        };
    }

    function timeDuration(data) {
        var timeToSplit = Lampa.Utils.secondsToTime(data.runtime * 60, true).split(':');
        return timeToSplit;
    }

    function startPlugin() {
        window.plugin_interface_ready = true;
        var old_interface = Lampa.InteractionMain;
        var new_interface = component;

        // ✅ Задержка для SettingsApi
        setTimeout(() => {
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: { name: 'WidePosters', type: 'trigger', default: false },
                field: { name: 'Широкие постеры', description: '' },
                onChange: Lampa.Settings.update
            });

            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: { name: 'Genres', type: 'trigger', default: true },
                field: { name: 'Показывать жанр', description: '' },
                onChange: Lampa.Settings.update
            });

            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    name: 'HeightControl',
                    type: 'select',
                    values: { Control_Low: 'Низкое', Control_Middle: 'Среднее' },
                    default: 'Control_Middle'
                },
                field: { name: 'Положение ленты', description: 'Положение постеров относительно описания' },
                onChange: Lampa.Settings.update
            });
        }, 1200);

        Lampa.InteractionMain = function (object) {
            var use = new_interface;
            if (Lampa.Storage.field('useNewInterface') == false) use = old_interface;
            if (!(object.source == 'tmdb' || object.source == 'cub')) use = old_interface;
            if (window.innerWidth < 767) use = old_interface;
            if ((Lampa.App && Lampa.App.version_code < 153) || Lampa.Manifest.app_digital < 153) use = old_interface;
            if (Lampa.Platform.screen('mobile')) use = old_interface;
            return new use(object);
        };

        // Оформление
        var heightValue = '0';
        if (Lampa.Storage.field('HeightControl') == 'Control_Low') heightValue = '23';
        if (Lampa.Storage.field('HeightControl') == 'Control_Middle') heightValue = '20';

        // стиль оставлен без изменений
    }

    if (!window.plugin_interface_ready) startPlugin();
})();