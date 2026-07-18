"use strict";
APP.router.register("dashboard", function (route, root) {
  const hasBaseline = APP.state.baseline.runs.length > 0;
  const plan = APP.engine.plan();
  const masteries = plan.map((p) => p.mastery).filter((m) => m != null);
  const overall = masteries.length
    ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length)
    : null;
  const dueTotal = plan.reduce((acc, p) => acc + p.due, 0);
  const top3 = plan.slice(0, 3);

  let html = "";

  if (APP.state.activeExam) {
    html += '<div class="banner warn spread"><span>You have a timed exam in progress.</span>' +
      '<a class="btn sm primary" href="#/exam">Resume exam</a></div>';
  }

  if (!hasBaseline) {
    html += '<div class="card"><span class="eyebrow">Start here</span>' +
      "<h2>Take the baseline assessment</h2>" +
      '<p class="muted">30 questions, two per section, about 35–45 minutes. No feedback during — it measures where you are today so the study plan knows what to prioritize. You only do this once.</p>' +
      '<a class="btn primary" href="#/baseline">Start baseline</a></div>';
  }

  html += '<div class="grid2">';
  html += '<div class="card"><span class="eyebrow">Overall mastery</span>' +
    '<div class="ring-wrap" style="margin-top:.5rem">' + APP.ui.ring(overall) +
    '<div class="stack"><span class="small muted">Average across sections you’ve started.</span>' +
    '<span class="small"><span class="num">' + APP.state.streak.current + '</span> day streak · best <span class="num">' + APP.state.streak.best + "</span></span>" +
    APP.ui.streakGrid() + "</div></div></div>";

  html += '<div class="card"><span class="eyebrow">Study next</span><div class="stack" style="margin-top:.5rem">' +
    top3.map((p) =>
      '<div class="spread"><span><strong>' + APP.ui.esc(p.section.short) + "</strong><br><span class=\"small muted\">" +
      (p.mastery == null ? "not started" : p.mastery + "% mastery") +
      (p.due ? " · " + p.due + " cards due" : "") + "</span></span>" +
      '<a class="btn sm" href="#/drill/' + p.section.num + '">Drill</a></div>'
    ).join("") +
    '</div><div style="margin-top:.75rem"><a href="#/plan" class="small">Full study plan →</a></div></div>';
  html += "</div>";

  html += '<div class="card"><span class="eyebrow">Quick actions</span><div class="row" style="margin-top:.6rem">' +
    '<a class="btn" href="#/exam-intro">Timed exam</a>' +
    '<a class="btn" href="#/practice-menu">Practice</a>' +
    '<a class="btn" href="#/cards">Flashcards' + (dueTotal ? ' (<span class="num">' + dueTotal + "</span> due)" : "") + "</a>" +
    '<a class="btn" href="#/lessons">Lessons</a></div></div>';

  root.innerHTML = html;
});
