(function () {
  'use strict';

  var Defined = {
    api: 'lampac',
    localhost: 'http://wtch.ch/',
    apn: ''
  };

  var balansers_with_search;

  /* ===============================
     УНИКАЛЬНЫЙ ID
  =============================== */

  var unic_id = Lampa.Storage.get('lampac_unic_id', '');
  if (!unic_id) {
    unic_id = Lampa.Utils.uid(8).toLowerCase();
    Lampa.Storage.set('lampac_unic_id', unic_id);
  }

  /* ===============================
     СЕТЕВЫЕ ЗАПРОСЫ
  =============================== */

  function request(url, data, method) {
    method = method || 'POST';

    return new Promise(function (resolve, reject) {
      Lampa.Network.request(
        url,
        data,
        function (result) {
          resolve(result);
        },
        function (a, c) {
          reject(c);
        },
        false,
        {
          method: method,
          headers: {
            'X-Lampac': unic_id
          }
        }
      );
    });
  }

  function api(method, data) {
    return request(Defined.localhost + method, data);
  }

  function search(params) {
    return api('search', params);
  }

  function source(params) {
    return api('source', params);
  }

  /* ===============================
     UI ПЛАГИНА
  =============================== */

  function create(params) {
    var html = $('<div class="lampac"></div>');
    var body = $('<div class="lampac__body"></div>');
    var loader = $('<div class="lampac__loader"><div></div></div>');
    var hint = $('<div class="lampac__hint">Нажмите OK — Смотреть</div>');

    html.append(body);
    html.append(loader);
    html.append(hint);

    function loading(status) {
      loader.toggleClass('active', status);
    }

    function empty() {
      body.html('<div class="empty">Ничего не найдено</div>');
    }

    function render(items) {
      body.empty();

      items.forEach(function (item) {
        var element = $('<div class="lampac__item"></div>');
        element.text(item.title || item.name);

        /* ✅ ПРАВИЛЬНЫЕ СОБЫТИЯ LAMPA */
        element.on('hover:enter', function () {
          hint.addClass('active');
        });

        element.on('hover:leave', function () {
          hint.removeClass('active');
        });

        element.on('click', function () {
          source(item).then(function (result) {
            Lampa.Player.play(result);
          });
        });

        body.append(element);
      });
    }

    loading(true);

    search(params)
      .then(function (result) {
        loading(false);
        if (!result || !result.length) empty();
        else render(result);
      })
      .catch(function () {
        loading(false);
        empty();
      });

    return html;
  }

  /* ===============================
     РЕГИСТРАЦИЯ
  =============================== */

  Lampa.Plugin.add('lampac', {
    title: 'Lampac',
    description: 'Онлайн источники',
    version: '1.1.1',
    type: 'video',

    onRender: function (item) {
      return create({
        query: item.title,
        year: item.year,
        imdb_id: item.imdb_id,
        kinopoisk_id: item.kinopoisk_id
      });
    }
  });

})();
