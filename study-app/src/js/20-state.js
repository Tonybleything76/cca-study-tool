"use strict";
// Storage adapter: localStorage when available, in-memory fallback otherwise.
APP.storage = (function () {
  const KEY = "cca-study.state";
  let memory = null;
  let usable = false;
  try {
    localStorage.setItem("cca-probe", "1");
    localStorage.removeItem("cca-probe");
    usable = true;
  } catch (e) { usable = false; }
  return {
    persistent: usable,
    read() {
      if (!usable) return memory;
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    },
    write(state) {
      if (!usable) { memory = state; return; }
      localStorage.setItem(KEY, JSON.stringify(state));
    },
    clear() {
      memory = null;
      if (usable) localStorage.removeItem(KEY);
    },
  };
})();

APP.freshState = function () {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    baseline: { runs: [] },
    attempts: {},        // questionId -> [{t, chosen, correct, mode}], capped at last 10
    leitner: {},         // flashcardId -> {box, due, lastSeen}
    sessions: [],        // finished quiz/exam/baseline sessions
    activeExam: null,    // in-progress timed exam, survives refresh
    streak: { current: 0, best: 0, lastActiveDay: null, activeDays: [] },
    settings: {},
  };
};

APP.migrate = function (state) {
  switch (state.schemaVersion) {
    case 1:
      break; // current
    default:
      throw new Error("Unknown schema version: " + state.schemaVersion);
  }
  return state;
};

APP.loadState = function () {
  let state = null;
  try { state = APP.storage.read(); } catch (e) { state = null; }
  if (!state) return APP.freshState();
  try { return APP.migrate(state); } catch (e) { return APP.freshState(); }
};

APP.save = function () {
  APP.state.updatedAt = new Date().toISOString();
  APP.storage.write(APP.state);
};

// ---- Mutations (every mutation saves) ----

APP.recordAttempt = function (questionId, chosen, correct, mode) {
  const list = APP.state.attempts[questionId] || (APP.state.attempts[questionId] = []);
  list.push({ t: Date.now(), chosen, correct, mode });
  if (list.length > 10) list.splice(0, list.length - 10);
  APP.touchStreak();
  APP.save();
};

APP.touchStreak = function () {
  const today = new Date().toISOString().slice(0, 10);
  const s = APP.state.streak;
  if (s.lastActiveDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.current = s.lastActiveDay === yesterday ? s.current + 1 : 1;
  s.best = Math.max(s.best, s.current);
  s.lastActiveDay = today;
  s.activeDays.push(today);
  if (s.activeDays.length > 366) s.activeDays.splice(0, s.activeDays.length - 366);
};

// ---- Export / import ----

APP.exportState = function () {
  return JSON.stringify({ app: "cca-study", exportedAt: new Date().toISOString(), state: APP.state }, null, 2);
};

APP.importState = function (text) {
  const parsed = JSON.parse(text);
  if (parsed.app !== "cca-study" || !parsed.state) throw new Error("Not a CCA Study Tool export file.");
  const migrated = APP.migrate(parsed.state);
  APP.state = migrated;
  APP.save();
};
