(function () {
"use strict";
if (typeof Lampa === "undefined") return;

/* ===== Локализация (БЕЗ ИЗМЕНЕНИЙ) ===== */
Lampa.Lang.add({
  title_plugin: { ru: "Title Plugin", en: "Title Plugin", uk: "Title Plugin", be: "Title Plugin" },
  reset_to_default: { ru: "Сбросить по умолчанию", en: "Reset to Default", uk: "Скинути за замовчуванням", be: "Скінуць па змаўчанні" },
  show_en: { ru: 'Показывать EN', en: 'Show EN', uk: 'Показувати EN', be: 'Паказваць EN' },
  show_tl: { ru: "Показывать Romaji", en: "Show Romaji", uk: "Показувати Romaji", be: "Паказваць Romaji" },
  show_uk: { ru: 'Показывать UA', en: 'Show UA', uk: 'Показувати UA', be: 'Паказваць UA' },
  show_be: { ru: 'Показывать BE', en: 'Show BE', uk: 'Показувати BE', be: 'Паказваць BE' },
  show_ru: { ru: 'Показывать RU', en: 'Show RU', uk: 'Показувати RU', be: 'Паказваць RU' },
});

const LANGS = ["en", "tl", "uk", "be", "ru"];
const STORAGE_ORDER_KEY = "title_plugin_order";
const STORAGE_HIDDEN_KEY = "title_plugin_hidden";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

let titleCache = Lampa.Storage.get("title_cache") || {};

/* ===== ВСПОМОГАТЕЛЬНОЕ ===== */
function countryFlag(code) {
  if (!code) return "";
  return ` <img src="https://flagcdn.com/${code.toLowerCase()}.svg" style="width:1.15em;height:auto;vertical-align:middle;">`;
}

/* ===== БЫСТРАЯ ВСТАВКА КОНТЕЙНЕРА (НОВОЕ) ===== */
function ensureBox(render) {
  let box = $(".original_title", render);
  if (!box.length) {
    $(".full-start-new__title", render).after(
      `<div class="original_title" style="margin-bottom:7px;text-align:right;"></div>`
    );
    box = $(".original_title", render);
  }
  return box;
}

/* ===== ОСНОВНАЯ ЛОГИКА (НЕ МЕНЯЛАСЬ) ===== */
async function showTitles(card) {
  const render = Lampa.Activity.active()?.activity?.render();
  if (!render) return;

  const box = ensureBox(render); // 🔥 МГНОВЕННО

  const orig = card.original_title || card.original_name;
  const alt = card.alternative_titles?.titles || card.alternative_titles?.results || [];

  let ru = "", en = "", uk = "", be = "", translit = "";

  const now = Date.now();
  const cache = titleCache[card.id];

  if (cache && now - cache.timestamp < CACHE_TTL) {
    ru = cache.ru;
    en = cache.en;
    uk = cache.uk;
    be = cache.be;
    translit = cache.tl;
  }

  /* ===== МГНОВЕННЫЙ РЕНДЕР ИЗ ТОГО, ЧТО ЕСТЬ ===== */
  renderHTML();

  /* ===== ОРИГИНАЛЬНАЯ ЛОГИКА ЗАГРУЗКИ ===== */
  if (!ru || !en || !uk || !be || !translit) {
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

      function findLang(codes) {
        const t = tr.find(t => codes.includes(t.iso_3166_1) || codes.includes(t.iso_639_1));
        return t?.data?.title || t?.data?.name;
      }

      en ||= findLang(["US", "en"]);
      ru ||= findLang(["RU", "ru"]);
      uk ||= findLang(["UA", "uk"]);
      be ||= findLang(["BY", "be"]);

      translit ||= tr.find(t =>
        ["Transliteration", "romaji", "Romanization"].includes(t.type)
      )?.data?.title;

      titleCache[card.id] = { ru, en, uk, be, tl: translit, timestamp: now };
      Lampa.Storage.set("title_cache", titleCache);

      renderHTML(); // 🔥 ОБНОВЛЕНИЕ БЕЗ ЛАГА
    } catch (e) {
      console.error(e);
    }
  }

  function renderHTML() {
    const order = Lampa.Storage.get(STORAGE_ORDER_KEY, LANGS.slice());
    const hidden = Lampa.Storage.get(STORAGE_HIDDEN_KEY, []);
    const lines = [];

    lines.push(
      `<div style="font-size:1.25em;">${orig} ${countryFlag(card.origin_country?.[0])}</div>`
    );

    order.forEach(lang => {
      if (hidden.includes(lang)) return;
      const val = lang === "tl" ? translit : { en, ru, uk, be }[lang];
      if (!val) return;
      lines.push(
        `<div style="font-size:1.25em;">${val} ${countryFlag({ ru:"RU", en:"US", uk:"UA", be:"BY" }[lang])}</div>`
      );
    });

    box.html(lines.join(""));
  }
}

/* ===== LISTENER (БЕЗ ИЗМЕНЕНИЙ) ===== */
if (!window.title_plugin) {
  window.title_plugin = true;
  Lampa.Listener.follow("full", e => {
    if (e.type === "complite" && e.data?.movie) {
      showTitles(e.data.movie);
    }
  });
}
})();
