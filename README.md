# CCA Study Tool

An interactive study tool for the **Claude Certified Architect – Foundations** exam: a baseline assessment, an adaptive study plan that prioritizes your weakest areas, beginner-friendly lessons, practice exams, spaced-repetition flashcards, a plain-English glossary, and a progress tracker — all in a single HTML file that runs entirely in your browser.

## Use it now

**→ [Open the study tool](https://tonybleything76.github.io/cca-study-tool/)** — no account, no install.

Or download [`cca-study-app.html`](cca-study-app.html) and double-click it. Everything works offline.

Your progress (baseline scores, quiz history, flashcard schedule, streak) is stored **only in your own browser** — nothing is sent to any server. Use **Settings → Download backup** to move progress between devices or keep a safety copy.

## What's inside

- **Baseline assessment** — 32 questions (2 per section) that score you across all 16 knowledge areas and seed your study plan
- **Study plan** — a ranked "study this next" list, re-sorted after every session by weakness, staleness, and due flashcards
- **16 lessons** — starting with a Level 0 "Foundations: Reading the Language" section that teaches the vocabulary and notation (JSON, code snippets, the request lifecycle) the rest of the course assumes; every lesson starts from zero LLM experience and goes to exam depth
- **197 practice questions** — with per-option explanations, playable as a timed 40-question exam, untimed practice, or per-section drills
- **154 flashcards** — Leitner spaced repetition: cards you miss come back sooner
- **Glossary** — 77 technical terms and acronyms decoded in plain English, with "how to read it in context" guidance
- **Progress tracker** — mastery per section vs. your baseline, score trend, and streak calendar

## For maintainers

Content lives as JSON under `study-app/content/` (questions, flashcards, lessons, resources, glossary). The app shell is in `study-app/src/`. Never edit the built HTML directly — rebuild instead:

```bash
./scripts/build-study-app.sh
```

The build validates all content (exact option/rationale counts, valid answer keys, unique IDs, per-section coverage minimums, answer-position balance) and fails on any error. It emits `cca-study-app.html` and an identical `index.html` for GitHub Pages. Requires only `python3` and `bash` — no Node, no dependencies.

To review a section's questions as readable markdown:

```bash
python3 scripts/lint-study-content.py --review s07
```

## Attribution and license

The study content is adapted from the [Claude Architect Exam Preparation Guide](https://github.com/daronyondem/claude-architect-exam-guide) by Daron Yondem, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This repository (content adaptations and application code) is likewise released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

This is an independent community project and is **not affiliated with or endorsed by Anthropic**. It contains no actual exam content — all questions are original teaching material.
