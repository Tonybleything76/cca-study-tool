"use strict";
APP.router.register("resources", function (route, root) {
  const groups = [
    ["official", "Official Anthropic Documentation"],
    ["mcp", "MCP Documentation"],
    ["engineering", "Engineering and Courses"],
  ];
  const filterSec = route.params.section ? parseInt(route.params.section, 10) : null;
  const items = APP.content.resources.filter((r) => !filterSec || (r.sections || []).includes(filterSec));

  root.innerHTML =
    '<div class="card"><span class="eyebrow">Resources</span><h2>Go-deeper reading</h2>' +
    '<p class="muted small">External links from the guide — official docs, MCP references, and courses. Filter by section from the dropdown.</p>' +
    '<select id="sec-filter" class="btn" style="max-width:100%">' +
    '<option value="">All sections</option>' +
    APP.content.sections.map((s) =>
      '<option value="' + s.num + '"' + (filterSec === s.num ? " selected" : "") + ">" + s.num + ". " + APP.ui.esc(s.short) + "</option>"
    ).join("") + "</select></div>" +
    groups.map(([key, label]) => {
      const list = items.filter((r) => r.group === key);
      if (!list.length) return "";
      return '<div class="card"><h3>' + label + "</h3><ul>" +
        list.map((r) =>
          '<li style="margin-bottom:.4rem"><a href="' + APP.ui.esc(r.url) + '" target="_blank" rel="noopener">' +
          APP.ui.esc(r.title) + "</a><br><span class=\"small muted\">" + APP.ui.esc(r.desc) + "</span></li>"
        ).join("") + "</ul></div>";
    }).join("");

  root.querySelector("#sec-filter").addEventListener("change", (e) => {
    APP.router.go("#/resources" + (e.target.value ? "?section=" + e.target.value : ""));
  });
});
