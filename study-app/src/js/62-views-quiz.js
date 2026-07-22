"use strict";
// One quiz runner, four configurations: baseline, exam (timed), practice, drill.

APP.quiz = {};

APP.quiz.sectionScores = function (questionIds, answers) {
  const bySec = {};
  questionIds.forEach((qid) => {
    const q = APP.content.questionById[qid];
    if (!q) return;
    const s = (bySec[q.section] = bySec[q.section] || { right: 0, total: 0 });
    s.total++;
    if (answers[qid] === q.answer) s.right++;
  });
  const out = {};
  Object.entries(bySec).forEach(([sec, v]) => { out[sec] = v.right / v.total; });
  return out;
};

APP.quiz.finishSession = function (mode, sectionNum, questionIds, answers, startedAt) {
  const scores = APP.quiz.sectionScores(questionIds, answers);
  let right = 0;
  questionIds.forEach((qid) => {
    const q = APP.content.questionById[qid];
    const chosen = answers[qid];
    const correct = chosen === q.answer;
    if (correct) right++;
    if (chosen != null) APP.recordAttempt(qid, chosen, correct, mode);
  });
  const session = {
    mode, section: sectionNum || null,
    startedAt, finishedAt: new Date().toISOString(),
    questionIds, answers,
    score: questionIds.length ? right / questionIds.length : 0,
    sectionScores: scores,
  };
  APP.state.sessions.push(session);
  APP.save();
  return session;
};

// ---- Instant-feedback runner (practice + drill) ----

function feedbackRunner(root, opts) {
  const { title, questions, mode, sectionNum } = opts;
  const startedAt = new Date().toISOString();
  const answers = {};
  let idx = 0;
  let answered = false;

  function render() {
    const q = questions[idx];
    root.innerHTML = '<div class="card"><div class="spread">' +
      "<h2>" + APP.ui.esc(title) + "</h2>" +
      '<span class="muted small num">' + (idx + 1) + " / " + questions.length + "</span></div>" +
      '<div id="q-holder"></div><div class="row" style="margin-top:1rem" id="q-actions"></div></div>';
    const holder = root.querySelector("#q-holder");
    const actions = root.querySelector("#q-actions");
    APP.ui.renderQuestion(holder, q, {
      selected: answers[q.id],
      locked: answered,
      showFeedback: answered,
      onSelect(i) {
        answers[q.id] = i;
        answered = true;
        render();
      },
    });
    if (answered) {
      const isLast = idx === questions.length - 1;
      const btn = document.createElement("button");
      btn.className = "btn primary";
      btn.textContent = isLast ? "See results" : "Next question";
      btn.addEventListener("click", () => {
        if (isLast) {
          const session = APP.quiz.finishSession(mode, sectionNum, questions.map((q) => q.id), answers, startedAt);
          APP.quiz.results(root, session, { retryHash: opts.retryHash });
        } else { idx++; answered = false; render(); }
      });
      actions.appendChild(btn);
    }
  }
  render();
}

// ---- Silent runner (baseline + exam): no feedback until the end ----

function silentRunner(root, opts) {
  const { title, questions, mode, endEpoch, onFinish } = opts;
  const startedAt = opts.startedAt || new Date().toISOString();
  const answers = opts.answers || {};
  let idx = opts.startIndex || 0;
  let timer = null;

  function persistExam() {
    if (mode !== "exam") return;
    APP.state.activeExam = {
      questionIds: questions.map((q) => q.id),
      answers, startedAt, endEpoch, index: idx,
    };
    APP.save();
  }

  function submit() {
    if (timer) timer.stop();
    if (mode === "exam") { APP.state.activeExam = null; APP.save(); }
    const session = APP.quiz.finishSession(mode, null, questions.map((q) => q.id), answers, startedAt);
    APP.router.setGuard(null);
    onFinish(session);
  }

  function render() {
    const q = questions[idx];
    const answeredCount = Object.keys(answers).length;
    root.innerHTML = '<div class="card"><div class="spread">' +
      "<h2>" + APP.ui.esc(title) + "</h2><div class=\"row\">" +
      (endEpoch ? '<span class="timer" id="clock"></span>' : "") +
      '<span class="muted small num">' + (idx + 1) + " / " + questions.length + "</span></div></div>" +
      '<div id="q-holder"></div>' +
      '<div class="spread" style="margin-top:1rem"><div class="row">' +
      '<button class="btn sm" id="prev"' + (idx === 0 ? " disabled" : "") + ">← Prev</button>" +
      '<button class="btn sm" id="next"' + (idx === questions.length - 1 ? " disabled" : "") + ">Next →</button></div>" +
      '<button class="btn primary" id="submit">Submit (' + answeredCount + "/" + questions.length + " answered)</button></div>" +
      '<div class="row" style="margin-top:.9rem;gap:.3rem" id="palette"></div></div>';

    const holder = root.querySelector("#q-holder");
    APP.ui.renderQuestion(holder, q, {
      selected: answers[q.id],
      onSelect(i) { answers[q.id] = i; persistExam(); render(); },
    });

    // Question palette for jumping around.
    const palette = root.querySelector("#palette");
    questions.forEach((qq, i) => {
      const b = document.createElement("button");
      b.className = "btn sm";
      b.style.minWidth = "2.2rem";
      b.classList.toggle("primary", i === idx);
      b.textContent = i + 1;
      if (answers[qq.id] != null && i !== idx) b.style.borderColor = "var(--accent)";
      b.addEventListener("click", () => { idx = i; persistExam(); render(); });
      palette.appendChild(b);
    });

    root.querySelector("#prev").addEventListener("click", () => { idx--; persistExam(); render(); });
    root.querySelector("#next").addEventListener("click", () => { idx++; persistExam(); render(); });
    root.querySelector("#submit").addEventListener("click", () => {
      const un = questions.length - Object.keys(answers).length;
      if (un > 0 && !APP.ui.confirm(un + " unanswered question" + (un === 1 ? "" : "s") + " will be marked wrong. Submit anyway?")) return;
      submit();
    });

    if (endEpoch) {
      if (timer) timer.stop();
      timer = APP.ui.createTimer(endEpoch, (ms) => {
        const el = document.getElementById("clock");
        if (el) { el.textContent = APP.ui.fmtClock(ms); el.classList.toggle("low", ms < 5 * 60000); }
      }, submit);
    }
  }

  if (mode === "exam") {
    APP.router.setGuard(() => APP.ui.confirm("Leave the exam? Your timer keeps running — you can resume from the dashboard."));
    persistExam();
  }
  render();
}

APP.quiz.feedbackRunner = feedbackRunner;
APP.quiz.silentRunner = silentRunner;

// ---- Results screen ----

APP.quiz.results = function (root, session, opts) {
  opts = opts || {};
  const pct = Math.round(session.score * 100);
  const secRows = Object.entries(session.sectionScores)
    .map(([sec, v]) => ({ sec: parseInt(sec, 10), pct: Math.round(v * 100) }))
    .sort((a, b) => a.pct - b.pct);
  root.innerHTML = '<div class="card" style="text-align:center">' +
    '<span class="eyebrow">' + APP.ui.esc(session.mode) + " complete</span>" +
    '<div style="margin:.8rem 0">' + APP.ui.ring(pct, 120) + "</div>" +
    '<p class="muted">' + Math.round(session.score * session.questionIds.length) + " of " + session.questionIds.length + " correct</p></div>" +
    (secRows.length > 1
      ? '<div class="card"><h3>By section</h3><div class="stack" style="margin-top:.6rem">' +
        secRows.map((r) => {
          const meta = APP.content.sections.find((s) => s.num === r.sec);
          return '<div><div class="spread"><span class="small">' + APP.ui.esc(meta ? meta.short : "Section " + r.sec) +
            '</span><span class="small num">' + r.pct + "%</span></div>" + APP.ui.progressBar(r.pct) + "</div>";
        }).join("") + "</div></div>"
      : "") +
    '<div class="row">' +
    (opts.retryHash ? '<a class="btn" href="' + opts.retryHash + '">Go again</a>' : "") +
    '<a class="btn" href="#/plan">Study plan</a><a class="btn primary" href="#/dashboard">Dashboard</a></div>';
};

// ---- Route registrations ----

APP.router.register("baseline", function (route, root) {
  root.innerHTML = '<div class="card"><span class="eyebrow">Baseline assessment</span>' +
    "<h2>" + (APP.content.sections.length * 2) + " questions, no feedback until the end</h2>" +
    '<p class="muted">Two questions from each of the ' + APP.content.sections.length + ' sections. Answer honestly — guessing wildly just makes your study plan less useful. Takes about 35–45 minutes, untimed.</p>' +
    '<button class="btn primary" id="start">Begin</button></div>';
  root.querySelector("#start").addEventListener("click", () => {
    const questions = APP.engine.selectBaseline();
    silentRunner(root, {
      title: "Baseline", questions, mode: "baseline",
      onFinish(session) {
        APP.state.baseline.runs.push({
          startedAt: session.startedAt, finishedAt: session.finishedAt,
          questionIds: session.questionIds, answers: session.answers,
          sectionScores: session.sectionScores,
        });
        APP.save();
        APP.quiz.results(root, session, {});
      },
    });
  });
});

APP.router.register("exam-intro", function (route, root) {
  root.innerHTML = '<div class="card"><span class="eyebrow">Timed exam</span>' +
    "<h2>40 questions · 60 minutes</h2>" +
    '<p class="muted">Covers all sections, with extra questions from your weakest areas. No feedback until you submit. The timer runs on the clock — refreshing the page won’t pause it. Auto-submits at zero.</p>' +
    '<a class="btn primary" href="#/exam">Start exam</a></div>';
});

APP.router.register("exam", function (route, root) {
  const minutes = route.params.minutes ? parseFloat(route.params.minutes) : 60;
  let cfg;
  if (APP.state.activeExam) {
    const ae = APP.state.activeExam;
    cfg = {
      questions: ae.questionIds.map((id) => APP.content.questionById[id]).filter(Boolean),
      answers: ae.answers, startedAt: ae.startedAt, endEpoch: ae.endEpoch, startIndex: ae.index || 0,
    };
  } else {
    cfg = {
      questions: APP.engine.selectExam(40),
      endEpoch: Date.now() + minutes * 60000,
    };
  }
  silentRunner(root, {
    title: "Timed Exam", mode: "exam", ...cfg,
    onFinish(session) { APP.quiz.results(root, session, { retryHash: "#/exam-intro" }); },
  });
});

APP.router.register("practice-menu", function (route, root) {
  root.innerHTML = '<div class="card"><span class="eyebrow">Practice</span>' +
    "<h2>Pick your session</h2>" +
    '<p class="muted">Practice pulls questions from your weakest sections first and shows the full explanation after every answer.</p>' +
    '<div class="row">' +
    '<a class="btn" href="#/practice/5">Quick — 5 questions</a>' +
    '<a class="btn" href="#/practice/10">Standard — 10</a>' +
    '<a class="btn" href="#/practice/20">Long — 20</a></div></div>' +
    '<div class="card"><h3>Or drill one section</h3><div class="stack" style="margin-top:.6rem">' +
    APP.engine.plan().map((p) =>
      '<div class="spread"><span class="small">' + APP.ui.esc(p.section.short) + " " + APP.ui.masteryPill(p.mastery) +
      '</span><a class="btn sm" href="#/drill/' + p.section.num + '">Drill</a></div>'
    ).join("") + "</div></div>";
});

APP.router.register("practice", function (route, root) {
  const count = Math.max(1, Math.min(40, parseInt(route.arg, 10) || 10));
  const questions = APP.engine.selectPractice(count);
  feedbackRunner(root, { title: "Practice", questions, mode: "practice", retryHash: "#/practice/" + count });
});

APP.router.register("drill", function (route, root) {
  const sec = parseInt(route.arg, 10);
  const meta = APP.content.sections.find((s) => s.num === sec);
  if (!meta) { APP.router.go("#/practice-menu"); return; }
  const questions = APP.engine.selectDrill(sec, 8);
  feedbackRunner(root, {
    title: "Drill: " + meta.short, questions, mode: "drill",
    sectionNum: sec, retryHash: "#/drill/" + sec,
  });
});
