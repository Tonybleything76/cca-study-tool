"use strict";
APP.router.register("lessons", function (route, root) {
  root.innerHTML = '<div class="card"><span class="eyebrow">Lessons</span><h2>Learn each section from zero</h2>' +
    '<p class="muted small">Every lesson starts assuming no LLM experience, shows how the concept works with Claude, then goes to exam depth.</p></div>' +
    '<div class="stack">' +
    APP.content.sections.map((s) => {
      const lesson = APP.content.bySection[s.num].lesson;
      const m = APP.engine.mastery(s.num);
      return '<div class="card flat spread"><div><strong>' + s.num + ". " + APP.ui.esc(s.title) + "</strong>" +
        (lesson ? '<br><span class="small muted">~' + lesson.minutes + " min read</span>" : '<br><span class="small muted">Coming soon</span>') +
        "</div><div class=\"row\">" + APP.ui.masteryPill(m) +
        (lesson ? '<a class="btn sm primary" href="#/lesson/' + s.num + '">Read</a>' : "") +
        "</div></div>";
    }).join("") + "</div>";
});

APP.router.register("lesson", function (route, root) {
  const sec = parseInt(route.arg, 10);
  const bundle = APP.content.bySection[sec];
  if (!bundle) { APP.router.go("#/lessons"); return; }
  const lesson = bundle.lesson;
  if (!lesson) {
    root.innerHTML = '<div class="card"><h2>' + APP.ui.esc(bundle.meta.title) + "</h2>" +
      '<p class="muted">This lesson hasn’t been written yet.</p><a class="btn" href="#/lessons">Back to lessons</a></div>';
    return;
  }
  const blockLabel = { plain: "The idea", example: "How it works with Claude", examLevel: "Exam depth", takeaways: "Key takeaways" };
  root.innerHTML = '<div class="card"><span class="eyebrow">Lesson ' + sec + "</span><h1>" + APP.ui.esc(lesson.title) + "</h1>" +
    '<p class="muted small">~' + lesson.minutes + " min · Section " + sec + " of 15</p></div>" +
    lesson.blocks.map((b) => {
      if (b.type === "takeaways") {
        return '<div class="card"><span class="eyebrow">' + blockLabel.takeaways + "</span><ul>" +
          b.items.map((t) => "<li>" + APP.ui.fmt(t) + "</li>").join("") + "</ul></div>";
      }
      // Lesson HTML is trusted authored content, whitelisted by the build lint.
      return '<div class="card"><span class="eyebrow">' + (blockLabel[b.type] || "") + "</span><div>" + b.html + "</div></div>";
    }).join("") +
    (lesson.resources && lesson.resources.length
      ? '<div class="card"><span class="eyebrow">Go deeper</span><ul>' +
        lesson.resources.map((rid) => {
          const r = APP.content.resources.find((x) => x.id === rid);
          return r ? '<li><a href="' + APP.ui.esc(r.url) + '" target="_blank" rel="noopener">' + APP.ui.esc(r.title) + "</a> — " + APP.ui.esc(r.desc) + "</li>" : "";
        }).join("") + "</ul></div>"
      : "") +
    '<div class="row"><a class="btn primary" href="#/drill/' + sec + '">Drill this section</a>' +
    '<a class="btn" href="#/lessons">All lessons</a></div>';
});
