({
    site: "mykadri.tv",
    version: "1.0",
    author: "Alex Boyka",

    search: async function(query) {
        let url = "https://mykadri.tv/index.php?do=search&subaction=search&story=" + encodeURIComponent(query);
        let html = await http.get(url);
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