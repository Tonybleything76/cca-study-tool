"use strict";
APP.router.register("plan", function (route, root) {
  const plan = APP.engine.plan();
  const hasBaseline = APP.state.baseline.runs.length > 0;
  root.innerHTML =
    (!hasBaseline
      ? '<div class="banner warn spread"><span>No baseline yet — the plan starts with everything as a priority. Take the baseline to make it accurate.</span><a class="btn sm" href="#/baseline">Baseline</a></div>'
      : "") +
    '<div class="card"><span class="eyebrow">Study plan</span><h2>What to study next</h2>' +
    '<p class="muted small">Ranked by weakness, time since you last touched it, and flashcards due. It re-sorts itself every time you study — just work from the top.</p></div>' +
    plan.map((p, i) => {
      const reasons = [];
      reasons.push(p.mastery == null ? "not started" : p.mastery + "% mastery");
      if (p.days != null) reasons.push(p.days < 1 ? "reviewed today" : Math.floor(p.days) + "d since review");
      else reasons.push("never reviewed");
      if (p.due) reasons.push(p.due + " cards due");
      return '<div class="card flat"><div class="spread">' +
        "<div><strong>" + (i + 1) + ". " + APP.ui.esc(p.section.title) + "</strong><br>" +
        '<span class="small muted">' + reasons.join(" · ") + "</span></div>" +
        APP.ui.masteryPill(p.mastery) + "</div>" +
        '<div class="row" style="margin-top:.7rem">' +
        '<a class="btn sm" href="#/lesson/' + p.section.num + '">Lesson</a>' +
        '<a class="btn sm" href="#/drill/' + p.section.num + '">Drill</a>' +
        (p.due ? '<a class="btn sm" href="#/cards">Review ' + p.due + " cards</a>" : "") +
        "</div></div>";
    }).join("");
});
