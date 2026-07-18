"use strict";
const APP = {};

// Content is embedded as <script type="application/json" data-kind data-src> blocks by the build.
APP.loadContent = function () {
  const content = { sections: [], questions: [], flashcards: [], lessons: [], resources: [], glossary: [], manifest: null };
  document.querySelectorAll('script[type="application/json"]').forEach((el) => {
    const kind = el.dataset.kind;
    let data;
    try { data = JSON.parse(el.textContent); }
    catch (e) { throw new Error("Bad JSON in embedded block " + kind + "/" + el.dataset.src + ": " + e.message); }
    if (kind === "sections") content.sections = data;
    else if (kind === "questions" || kind === "scenarios") content.questions.push(...data);
    else if (kind === "flashcards") content.flashcards.push(...data);
    else if (kind === "lessons") content.lessons.push(...data);
    else if (kind === "resources") content.resources = data;
    else if (kind === "glossary") content.glossary = data;
    else if (kind === "manifest") content.manifest = data;
  });
  content.bySection = {};
  content.sections.forEach((s) => {
    content.bySection[s.num] = {
      meta: s,
      questions: content.questions.filter((q) => q.section === s.num),
      flashcards: content.flashcards.filter((f) => f.section === s.num),
      lesson: content.lessons.find((l) => l.section === s.num) || null,
    };
  });
  content.questionById = Object.fromEntries(content.questions.map((q) => [q.id, q]));
  content.flashcardById = Object.fromEntries(content.flashcards.map((f) => [f.id, f]));
  return content;
};

// Self-check: compare parsed counts against the build-time manifest.
APP.verifyContent = function (content) {
  const m = content.manifest;
  if (!m) return ["No content manifest found — was this file built with build-study-app.sh?"];
  const problems = [];
  if (content.questions.length !== m.questions) problems.push("questions: expected " + m.questions + ", found " + content.questions.length);
  if (content.flashcards.length !== m.flashcards) problems.push("flashcards: expected " + m.flashcards + ", found " + content.flashcards.length);
  if (content.lessons.length !== m.lessons) problems.push("lessons: expected " + m.lessons + ", found " + content.lessons.length);
  if (content.resources.length !== m.resources) problems.push("resources: expected " + m.resources + ", found " + content.resources.length);
  if (m.glossary != null && content.glossary.length !== m.glossary) problems.push("glossary: expected " + m.glossary + ", found " + content.glossary.length);
  return problems;
};
