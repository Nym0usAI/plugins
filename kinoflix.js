(function() {
  'use strict';

  function startPlugin() {
    Lampa.Source.add('kinoflix', {
      title: 'KinoFlix.TV',
      link: 'https://kinoflix.tv',

      // Поиск фильмов
      search: function(query, callback) {
        let searchUrl = 'https://kinoflix.tv/index.php?do=search&subaction=search&story=' + encodeURIComponent(query);

        fetch(searchUrl)
          .then(res => res.text())
          .then(html => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, 'text/html');
            let items = [];

            // Карточки фильмов
            doc.querySelectorAll('.shortstory .zagolovok a').forEach(a => {
              let href = a.href;
              let title = a.textContent.trim();
              let poster = a.closest('.shortstory')?.querySelector('img')?.src;
              if (title && href) {
                items.push({
                  title,
                  url: href,
                  poster: poster || ''
                });
              }
            });

            callback(items);
          })
          .catch(err => {
            console.error('Error search kinoflix:', err);
            callback([]);
          });
      },

      // Получение ссылки на плеер
      play: function(item, callback) {
        fetch(item.url)
          .then(res => res.text())
          .then(html => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, 'text/html');

            // Ищем iframe плеера
            let iframe = doc.querySelector('iframe');
            if (iframe && iframe.src) {
              callback({
                url: iframe.src,
                quality: 'auto',
                subtitles: false
              });
            } else {
              // fallback — <video>
              let video = doc.querySelector('video source');
              if (video && video.src) {
                callback({
                  url: video.src,
                  quality: 'auto',
                  subtitles: false
                });
              } else {
                callback({ error: 'Плеер не найден' });
              }
            }
          })
          .catch(err => {
            console.error('Error play kinoflix:', err);
            callback({ error: 'Ошибка загрузки страницы' });
          });
      }
    });
  }

  if (window.appready) startPlugin();
  else document.addEventListener('appready', startPlugin);
})();