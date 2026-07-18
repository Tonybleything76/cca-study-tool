"use strict";
APP.engine = {};

// Tunable weights — adjust here to change how the study plan prioritizes.
APP.engine.WEIGHTS = { weakness: 60, staleness: 30, dueCards: 10 };
APP.engine.MASTERY_BLEND = { quiz: 0.7, cards: 0.3 };
APP.engine.LEITNER_INTERVALS = [0, 1, 3, 7, 14]; // days until due, per box 1–5
APP.engine.STALENESS_CAP_DAYS = 14;

// ---- Per-section stats ----

APP.engine.sectionAttempts = function (sectionNum) {
  const out = [];
  for (const [qid, attempts] of Object.entries(APP.state.attempts)) {
    const q = APP.content.questionById[qid];
    if (q && q.section === sectionNum) attempts.forEach((a) => out.push(a));
  }
  return out.sort((a, b) => a.t - b.t);
};

APP.engine.quizAccuracy = function (sectionNum) {
  const attempts = APP.engine.sectionAttempts(sectionNum).slice(-10);
  if (attempts.length === 0) {
    const runs = APP.state.baseline.runs;
    if (runs.length && runs[runs.length - 1].sectionScores[sectionNum] != null) {
      return runs[runs.length - 1].sectionScores[sectionNum];
    }
    return null;
  }
  return attempts.filter((a) => a.correct).length / attempts.length;
};

APP.engine.cardMastery = function (sectionNum) {
  const cards = APP.content.bySection[sectionNum].flashcards;
  if (!cards.length) return null;
  const seen = cards.filter((c) => APP.state.leitner[c.id]);
  if (!seen.length) return null;
  const sum = seen.reduce((acc, c) => acc + (APP.state.leitner[c.id].box - 1) / 4, 0);
  return sum / cards.length;
};

// Mastery 0–100, or null if the section hasn't been touched at all.
APP.engine.mastery = function (sectionNum) {
  const quiz = APP.engine.quizAccuracy(sectionNum);
  const cards = APP.engine.cardMastery(sectionNum);
  if (quiz == null && cards == null) return null;
  if (cards == null) return Math.round(100 * quiz);
  if (quiz == null) return Math.round(100 * cards);
  const b = APP.engine.MASTERY_BLEND;
  return Math.round(100 * (b.quiz * quiz + b.cards * cards));
};

APP.engine.baselineScore = function (sectionNum) {
  const runs = APP.state.baseline.runs;
  if (!runs.length) return null;
  const v = runs[0].sectionScores[sectionNum];
  return v == null ? null : Math.round(100 * v);
};

APP.engine.lastActivityDays = function (sectionNum) {
  let last = 0;
  APP.engine.sectionAttempts(sectionNum).forEach((a) => { last = Math.max(last, a.t); });
  APP.content.bySection[sectionNum].flashcards.forEach((c) => {
    const l = APP.state.leitner[c.id];
    if (l) last = Math.max(last, l.lastSeen);
  });
  if (!last) return null;
  return (Date.now() - last) / 86400000;
};

APP.engine.dueCards = function (sectionNum) {
  const today = new Date().toISOString().slice(0, 10);
  return APP.content.bySection[sectionNum].flashcards.filter((c) => {
    const l = APP.state.leitner[c.id];
    return !l || l.due <= today;
  });
};

// ---- Priority queue ----

APP.engine.priority = function (sectionNum) {
  const W = APP.engine.WEIGHTS;
  const m = APP.engine.mastery(sectionNum);
  const weakness = m == null ? 1 : (100 - m) / 100;
  const days = APP.engine.lastActivityDays(sectionNum);
  const staleness = days == null ? 1 : Math.min(days, APP.engine.STALENESS_CAP_DAYS) / APP.engine.STALENESS_CAP_DAYS;
  const dueFrac = Math.min(APP.engine.dueCards(sectionNum).length, 10) / 10;
  return W.weakness * weakness + W.staleness * staleness + W.dueCards * dueFrac;
};

APP.engine.plan = function () {
  return APP.content.sections
    .map((s) => ({
      section: s,
      mastery: APP.engine.mastery(s.num),
      days: APP.engine.lastActivityDays(s.num),
      due: APP.engine.dueCards(s.num).length,
      score: APP.engine.priority(s.num),
    }))
    .sort((a, b) => b.score - a.score || a.section.num - b.section.num);
};

// ---- Question selection ----

APP.engine.qStats = function (qid) {
  const attempts = APP.state.attempts[qid] || [];
  const last = attempts[attempts.length - 1] || null;
  return {
    timesAsked: attempts.length,
    lastAskedAt: last ? last.t : 0,
    lastCorrect: last ? last.correct : null,
  };
};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
APP.engine.shuffle = shuffle;

// Tiered pick from one section: never-asked, then last-wrong, then least-recently-asked.
APP.engine.pickFromSection = function (sectionNum, count, excludeIds) {
  const exclude = new Set(excludeIds || []);
  const pool = APP.content.bySection[sectionNum].questions.filter((q) => !exclude.has(q.id));
  const dayAgo = Date.now() - 86400000;
  const fresh = [], wrong = [], rest = [];
  pool.forEach((q) => {
    const st = APP.engine.qStats(q.id);
    if (st.timesAsked === 0) fresh.push(q);
    else if (st.lastCorrect === false) wrong.push(q);
    else rest.push(q);
  });
  rest.sort((a, b) => APP.engine.qStats(a.id).lastAskedAt - APP.engine.qStats(b.id).lastAskedAt);
  // Within "rest", prefer questions not asked in the last 24h (fall back if pool is small).
  const cold = rest.filter((q) => APP.engine.qStats(q.id).lastAskedAt < dayAgo);
  const warm = rest.filter((q) => APP.engine.qStats(q.id).lastAskedAt >= dayAgo);
  const ordered = shuffle(fresh).concat(shuffle(wrong), cold, warm);
  return ordered.slice(0, count);
};

APP.engine.selectBaseline = function () {
  const priorIds = new Set(APP.state.baseline.runs.flatMap((r) => r.questionIds));
  const picks = [];
  APP.content.sections.forEach((s) => {
    let pool = APP.content.bySection[s.num].questions
      .filter((q) => q.baselineEligible && q.difficulty === "core" && !priorIds.has(q.id));
    if (pool.length < 2) {
      pool = APP.content.bySection[s.num].questions.filter((q) => q.baselineEligible && q.difficulty === "core");
    }
    picks.push(...shuffle(pool).slice(0, 2));
  });
  return shuffle(picks);
};

APP.engine.selectExam = function (total) {
  total = total || 40;
  const lastExam = APP.state.sessions.filter((s) => s.mode === "exam").slice(-1)[0];
  const exclude = lastExam ? lastExam.questionIds : [];
  const picks = [];
  APP.content.sections.forEach((s) => {
    picks.push(...APP.engine.pickFromSection(s.num, 2, exclude.concat(picks.map((q) => q.id))));
  });
  // Remaining slots go to the weakest sections, one each.
  const weakest = APP.engine.plan().map((p) => p.section.num);
  let i = 0;
  while (picks.length < total && i < weakest.length * 3) {
    const sec = weakest[i % weakest.length];
    const extra = APP.engine.pickFromSection(sec, 1, picks.map((q) => q.id));
    picks.push(...extra);
    i++;
  }
  return shuffle(picks).slice(0, total);
};

APP.engine.selectDrill = function (sectionNum, count) {
  return APP.engine.pickFromSection(sectionNum, count || 8, []);
};

APP.engine.selectPractice = function (count) {
  // Sample sections weighted by priority, then tier within each.
  const plan = APP.engine.plan();
  const totalScore = plan.reduce((acc, p) => acc + p.score, 0) || 1;
  const picks = [];
  let guard = 0;
  while (picks.length < count && guard++ < count * 20) {
    let r = Math.random() * totalScore;
    let chosen = plan[0];
    for (const p of plan) { r -= p.score; if (r <= 0) { chosen = p; break; } }
    const got = APP.engine.pickFromSection(chosen.section.num, 1, picks.map((q) => q.id));
    if (got.length) picks.push(got[0]);
  }
  return picks;
};

// ---- Leitner ----

APP.engine.reviewCard = function (cardId, gotIt) {
  const l = APP.state.leitner[cardId] || { box: 1, due: null, lastSeen: 0 };
  l.box = gotIt ? Math.min(l.box + 1, 5) : 1;
  l.lastSeen = Date.now();
  const days = APP.engine.LEITNER_INTERVALS[l.box - 1];
  l.due = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  APP.state.leitner[cardId] = l;
  APP.touchStreak();
  APP.save();
};

APP.engine.cardSession = function () {
  // All due cards, ordered by section priority, shuffled within section, capped at 30.
  const planOrder = APP.engine.plan().map((p) => p.section.num);
  const deck = [];
  planOrder.forEach((sec) => {
    deck.push(...shuffle(APP.engine.dueCards(sec)));
  });
  return deck.slice(0, 30);
};

APP.engine.masteredCount = function (sectionNum) {
  return APP.content.bySection[sectionNum].flashcards
    .filter((c) => (APP.state.leitner[c.id] || {}).box >= 4).length;
};
