(function() {
  'use strict';

  function startPlugin() {
    Lampa.Source.add('mykadri', {
      title: 'MyKadri.TV',
      link: 'https://mykadri.tv',
      search: function(query, callback) {
        let searchUrl = 'https://mykadri.tv/?s=' + encodeURIComponent(query);

        fetch(searchUrl)
          .then(res => res.text())
          .then(html => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, 'text/html');
            let items = [];

            doc.querySelectorAll('.result-item a').forEach(a => {
              let href = a.href;
              let title = a.querySelector('.title') ? a.querySelector('.title').textContent.trim() : a.textContent.trim();
              let poster = a.querySelector('img') ? a.querySelector('img').src : '';
              if (href && title) {
                items.push({
                  title: title,
                  url: href,
                  poster: poster
                });
              }
            });

            callback(items);
          })
          .catch(err => {
            console.error('Error search mykadri:', err);
            callback([]);
          });
      },
      play: function(item, callback) {
        fetch(item.url)
          .then(res => res.text())
          .then(html => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, 'text/html');
            let iframe = doc.querySelector('iframe');
            if (iframe && iframe.src) {
              callback({
                url: iframe.src,
                quality: 'auto',
                subtitles: false
              });
            } else {
              let video = doc.querySelector('video source');
              if (video && video.src) {
                callback({
                  url: video.src,
                  quality: 'auto',
                  subtitles: false
                });
              } else {
                callback({ error: 'Не удалось найти плеер' });
              }
            }
          })
          .catch(err => {
            console.error('Error play mykadri:', err);
            callback({ error: 'Ошибка загрузки страницы' });
          });
      }
    });
  }

  if (window.appready) startPlugin();
  else document.addEventListener('appready', startPlugin);
})();
