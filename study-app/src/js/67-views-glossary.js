"use strict";
APP.router.register("glossary", function (route, root) {
  const CATS = [
    ["data", "Data & Formats"],
    ["api", "APIs & Requests"],
    ["ai", "AI & Agents"],
    ["tooling", "Developer Tools"],
  ];

  root.innerHTML =
    '<div class="card"><span class="eyebrow">Glossary</span><h2>Plain-English decoder</h2>' +
    '<p class="muted small">Every technical term and acronym used in the questions and lessons — what it stands for, what it means, and how to read it when it appears in a sentence. Start typing to filter.</p>' +
    '<input id="gloss-search" type="search" placeholder="Search terms… e.g. JSON, grep, schema" ' +
    'style="width:100%;padding:.6rem .9rem;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--ink);font:inherit"></div>' +
    '<div id="gloss-list"></div>';

  const list = root.querySelector("#gloss-list");

  function render(filter) {
    const q = (filter || "").trim().toLowerCase();
    const items = APP.content.glossary.filter((g) => {
      if (!q) return true;
      return (g.term + " " + (g.expansion || "") + " " + g.plain).toLowerCase().includes(q);
    });
    if (!items.length) {
      list.innerHTML = '<div class="card muted">No terms match "' + APP.ui.esc(q) + '" — try a shorter fragment.</div>';
      return;
    }
    list.innerHTML = CATS.map(([key, label]) => {
      const group = items.filter((g) => g.category === key);
      if (!group.length) return "";
      return '<div class="card"><h3>' + label + '</h3><div class="stack" style="margin-top:.7rem">' +
        group.map((g) =>
          '<div style="border-bottom:1px solid var(--border);padding-bottom:.7rem">' +
          "<strong>" + APP.ui.esc(g.term) + "</strong>" +
          (g.expansion ? ' <span class="muted small">— ' + APP.ui.esc(g.expansion) + "</span>" : "") +
          '<p class="small" style="margin:.3rem 0">' + APP.ui.esc(g.plain) + "</p>" +
          '<p class="small muted" style="margin:.2rem 0"><em>In the guide:</em> “' + APP.ui.fmt(g.example) + '”</p>' +
          '<p class="small" style="margin:.2rem 0;color:var(--accent)"><strong>How to read it:</strong> ' + APP.ui.esc(g.reading) + "</p>" +
          "</div>"
        ).join("") + "</div></div>";
    }).join("");
  }

  root.querySelector("#gloss-search").addEventListener("input", (e) => render(e.target.value));
  render("");
});
