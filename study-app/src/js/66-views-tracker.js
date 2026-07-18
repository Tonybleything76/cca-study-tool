"use strict";
APP.router.register("tracker", function (route, root) {
  const plan = APP.engine.plan().slice().sort((a, b) => a.section.num - b.section.num);
  const sessions = APP.state.sessions.filter((s) => s.mode !== "baseline");
  const trend = APP.state.sessions.map((s) => Math.round(s.score * 100));

  root.innerHTML =
    '<div class="card"><span class="eyebrow">Progress tracker</span><h2>Mastery by section</h2>' +
    '<p class="muted small">The orange tick marks your baseline — the bar growing past it is your improvement.</p>' +
    '<div class="stack" style="margin-top:.7rem">' +
    plan.map((p) => {
      const base = APP.engine.baselineScore(p.section.num);
      const delta = p.mastery != null && base != null ? p.mastery - base : null;
      return '<div><div class="spread"><span class="small">' + p.section.num + ". " + APP.ui.esc(p.section.short) + "</span>" +
        '<span class="small num">' + (p.mastery == null ? "—" : p.mastery + "%") +
        (delta != null ? ' <span class="' + (delta >= 0 ? "muted" : "") + '">(' + (delta >= 0 ? "+" : "") + delta + " vs baseline)</span>" : "") +
        "</span></div>" + APP.ui.progressBar(p.mastery || 0, base) + "</div>";
    }).join("") + "</div></div>" +

    '<div class="grid2">' +
    '<div class="card"><h3>Score trend</h3><div style="margin-top:.5rem">' + APP.ui.sparkline(trend) + "</div>" +
    '<p class="muted small" style="margin-top:.4rem">Every finished session, oldest to newest.</p></div>' +
    '<div class="card"><h3>Activity</h3><div class="stack" style="margin-top:.5rem">' +
    '<span class="small"><span class="num">' + APP.state.streak.current + '</span> day streak (best <span class="num">' + APP.state.streak.best + "</span>)</span>" +
    APP.ui.streakGrid() +
    '<span class="small muted num">' + sessions.length + " study sessions · " +
    Object.keys(APP.state.attempts).length + " questions attempted</span></div></div></div>" +

    '<div class="card"><h3>Session history</h3><div class="table-wrap"><table><thead><tr>' +
    "<th>Date</th><th>Type</th><th>Score</th><th>Questions</th></tr></thead><tbody>" +
    (APP.state.sessions.length
      ? APP.state.sessions.slice().reverse().slice(0, 20).map((s) => {
          const secMeta = s.section ? APP.content.sections.find((x) => x.num === s.section) : null;
          return "<tr><td class=\"small\">" + APP.ui.esc((s.finishedAt || "").slice(0, 10)) + "</td>" +
            '<td class="small">' + APP.ui.esc(s.mode) + (secMeta ? " · " + APP.ui.esc(secMeta.short) : "") + "</td>" +
            '<td class="small num">' + Math.round(s.score * 100) + "%</td>" +
            '<td class="small num">' + s.questionIds.length + "</td></tr>";
        }).join("")
      : '<tr><td colspan="4" class="muted small">No sessions yet.</td></tr>') +
    "</tbody></table></div></div>";
});
