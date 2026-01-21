(function () {
"use strict";
if (typeof Lampa === "undefined") return;
if (window.title_plugin_orig_en_fix) return;
window.title_plugin_orig_en_fix = true;

/* ===== Флаг страны ===== */
function countryFlag(code) {
  if (!code) return "";
  return ` <img src="https://flagcdn.com/${code.toLowerCase()}.svg"
    style="width:1.15em;height:auto;vertical-align:middle;">`;
}

/* ===== Контейнер ===== */
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

/* ===== Основная логика ===== */
function showTitles(card) {
  const render = Lampa.Activity.active()?.activity?.render();
  if (!render) return;

  const box = ensureBox(render);

  const orig = card.original_title || card.original_name;

  const alt =
    card.alternative_titles?.titles ||
    card.alternative_titles?.results ||
    [];

  // ✅ КОРРЕКТНОЕ EN
  const en =
    alt.find(t => t.iso_3166_1 === "US")?.title ||
    (card.original_language === "en"
      ? (card.title || card.name)
      : "");

  const lines = [];

  if (orig) {
    lines.push(
      `<div style="font-size:1.25em;">
        ${orig}
        ${countryFlag(card.origin_country?.[0])}
      </div>`
    );
  }

  if (en && en !== orig) {
    lines.push(
      `<div style="font-size:1.25em;">
        ${en}
        ${countryFlag("US")}
      </div>`
    );
  }

  box.html(lines.join(""));
}

/* ===== Listener ===== */
Lampa.Listener.follow("full", (e) => {
  if (e.type === "complite" && e.data?.movie) {
    showTitles(e.data.movie);
  }
});

})();
