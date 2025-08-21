({
    site: "mykadri.tv",
    version: "1.1",
    author: "Alex Boyka",

    search: async function(query) {
        let url = "https://mykadri.tv/index.php?do=search";

        // отправляем POST, как на сайте
        let html = await http.post(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "subaction=search&story=" + encodeURIComponent(query)
        });

        let doc = new DOMParser().parseFromString(html, "text/html");

        let results = [];
        let items = doc.querySelectorAll("div.post");

        items.forEach(item => {
            let link = item.querySelector("a")?.href;
            let poster = item.querySelector("img.post-image")?.src;
            let title = item.querySelector(".post-title")?.innerText.trim();

            if (link && title) {
                results.push({
                    title: title,
                    url: link,
                    poster: poster
                });
            }
        });

        return results;
    }
})
