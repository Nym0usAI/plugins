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
                        let items = doc.querySelectorAll("div.post");
                        let results = [];

                        items.forEach(item => {
                            let link = item.querySelector("a")?.href;
                            let poster = item.querySelector("img.post-image")?.src;
                            let title = item.querySelector(".post-title")?.innerText.trim();

                            if (link && poster && title) {
                                results.push({ title, link, poster });
                            }
                        });

                        callback(results);
                    })
                    .catch(() => callback([]));
            },
            searchLink: function(episode, movie) {
                return movie.link;
            }
        });
    }

    startPlugin();
})();
