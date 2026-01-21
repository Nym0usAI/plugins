(function () {
    "use strict";
    if (typeof Lampa === "undefined") return;
    if (window.title_plugin_fast) return;
    window.title_plugin_fast = true;

    const LANGS = ["en", "tl", "uk", "be", "ru"];
    const STORAGE_ORDER_KEY = "title_plugin_order";
    const STORAGE_HIDDEN_KEY = "title_plugin_hidden";
    const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

    let titleCache = Lampa.Storage.get("title_cache") || {};

    function countryFlag(code) {
        if (!code) return "";
        return ` <img src="https://flagcdn.com/${code.toLowerCase()}.svg"
            style="width:1.15em;height:auto;vertical-align:middle;">`;
    }

    function renderTitles(render, html) {
        let box = $(".original_title", render);
        if (box.length) box.html(html);
        else {
            $(".full-start-new__title", render).after(
                `<div class="original_title" style="margin-bottom:7px;text-align:right;">${html}</div>`
            );
        }
    }

    function buildHTML(card, data) {
        const order = Lampa.Storage.get(STORAGE_ORDER_KEY, LANGS);
        const hidden = Lampa.Storage.get(STORAGE_HIDDEN_KEY, []);
        const lines = [];

        lines.push(
            `<div style="font-size:1.25em;">${card.original_title || card.original_name}
            ${countryFlag(card.origin_country?.[0])}</div>`
        );

        order.forEach((lang) => {
            if (hidden.includes(lang)) return;
            const val = data[lang];
            if (!val) return;
            lines.push(
                `<div style="font-size:1.25em;">${val}
                ${countryFlag({ ru: "RU", en: "US", uk: "UA", be: "BY" }[lang])}</div>`
            );
        });

        return lines.join("");
    }

    async function loadFromTMDB(card, cacheKey) {
        try {
            const type = card.first_air_date ? "tv" : "movie";
            const data = await new Promise((res, rej) => {
                Lampa.Api.sources.tmdb.get(
                    `${type}/${card.id}?append_to_response=translations`,
                    {},
                    res,
                    rej
                );
            });

            const tr = data.translations?.translations || [];
            const find = (codes) =>
                tr.find(
                    (t) =>
                        codes.includes(t.iso_3166_1) ||
                        codes.includes(t.iso_639_1)
                )?.data?.title;

            const result = {
                en: find(["US", "en"]),
                ru: find(["RU", "ru"]),
                uk: find(["UA", "uk"]),
                be: find(["BY", "be"]),
                tl: tr.find((t) =>
                    ["Transliteration", "romaji"].includes(t.type)
                )?.data?.title,
            };

            titleCache[cacheKey] = {
                ...result,
                timestamp: Date.now(),
            };
            Lampa.Storage.set("title_cache", titleCache);

            return result;
        } catch (e) {
            console.error("[Title Plugin]", e);
            return null;
        }
    }

    async function showTitles(card) {
        const render = Lampa.Activity.active()?.activity?.render();
        if (!render) return;

        const type = card.first_air_date ? "tv" : "movie";
        const cacheKey = `${type}_${card.id}`;
        const now = Date.now();

        const cache = titleCache[cacheKey];
        const alt = card.alternative_titles?.titles || [];

        const baseData = {
            en: alt.find((t) => t.iso_3166_1 === "US")?.title,
            ru: alt.find((t) => t.iso_3166_1 === "RU")?.title,
            uk: alt.find((t) => t.iso_3166_1 === "UA")?.title,
            be: alt.find((t) => t.iso_3166_1 === "BY")?.title,
            tl: alt.find((t) =>
                ["romaji", "Transliteration"].includes(t.type)
            )?.title,
        };

        // 👉 МГНОВЕННЫЙ РЕНДЕР
        renderTitles(render, buildHTML(card, cache || baseData));

        // 👉 TMDB ТОЛЬКО ЕСЛИ ВООБЩЕ НЕТ ДАННЫХ
        if (
            (!cache || now - cache.timestamp > CACHE_TTL) &&
            !Object.values(baseData).some(Boolean)
        ) {
            const fresh = await loadFromTMDB(card, cacheKey);
            if (fresh) {
                renderTitles(render, buildHTML(card, fresh));
            }
        }
    }

    Lampa.Listener.follow("full", (e) => {
        if (e.type === "complite" && e.data?.movie) {
            showTitles(e.data.movie);
        }
    });
})();
