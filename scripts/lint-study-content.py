#!/usr/bin/env python3
"""Validate study-app content JSON. Structural problems are errors (exit 1).
Coverage minimums are warnings until STRICT_CONTENT=1 is set (then errors too).

Usage:
  lint-study-content.py                 # validate everything
  lint-study-content.py --review s03    # print section 3's questions/cards as readable markdown
"""
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "study-app" / "content"

ALLOWED_LESSON_TAGS = {"p", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td",
                       "code", "pre", "strong", "em", "h4", "br"}
DIFFICULTIES = {"warmup", "core", "stretch"}
CARD_SOURCES = {"pitfall", "cheatsheet", "table"}
RESOURCE_GROUPS = {"official", "mcp", "engineering"}

errors, warnings = [], []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        err(f"{path.relative_to(ROOT)}: invalid JSON — {e}")
        return None


def no_script_close(obj, where):
    text = json.dumps(obj)
    if "</script" in text.lower():
        err(f"{where}: contains '</script' which would break the embedded build")


def check_question(q, where, ids):
    for field in ("id", "section", "type", "difficulty", "stem", "options", "answer",
                  "rationales", "baselineEligible", "sourceRef"):
        if field not in q:
            err(f"{where}: missing field '{field}'")
            return
    if q["id"] in ids:
        err(f"{where}: duplicate id {q['id']}")
    ids.add(q["id"])
    if not (isinstance(q["section"], int) and 0 <= q["section"] <= 15):
        err(f"{where}: section must be 0–15, got {q['section']}")
    if q["type"] not in ("mcq", "scenario"):
        err(f"{where}: bad type {q['type']}")
    if q["difficulty"] not in DIFFICULTIES:
        err(f"{where}: bad difficulty {q['difficulty']}")
    if not (isinstance(q["options"], list) and len(q["options"]) == 4):
        err(f"{where}: needs exactly 4 options")
    if not (isinstance(q["rationales"], list) and len(q["rationales"]) == 4):
        err(f"{where}: needs exactly 4 rationales")
    if not (isinstance(q["answer"], int) and 0 <= q["answer"] <= 3):
        err(f"{where}: answer must be 0–3")


def check_lesson_html(html, where):
    for tag in re.findall(r"</?([a-zA-Z0-9]+)", html):
        if tag.lower() not in ALLOWED_LESSON_TAGS:
            err(f"{where}: tag <{tag}> not in lesson whitelist")


def main():
    ids = set()
    all_questions = []

    sections = load(CONTENT / "sections.json") or []
    if len(sections) != 16:
        err(f"sections.json: expected 16 sections (0–15), found {len(sections)}")

    qdir = CONTENT / "questions"
    for path in sorted(qdir.glob("*.json")) if qdir.exists() else []:
        data = load(path)
        if data is None:
            continue
        no_script_close(data, path.name)
        for i, q in enumerate(data):
            check_question(q, f"{path.name}[{i}]", ids)
            all_questions.append(q)

    scenarios = load(CONTENT / "scenarios.json")
    if scenarios is not None:
        no_script_close(scenarios, "scenarios.json")
        for i, q in enumerate(scenarios):
            check_question(q, f"scenarios.json[{i}]", ids)
            all_questions.append(q)

    all_cards = []
    fdir = CONTENT / "flashcards"
    for path in sorted(fdir.glob("*.json")) if fdir.exists() else []:
        data = load(path)
        if data is None:
            continue
        no_script_close(data, path.name)
        for i, c in enumerate(data):
            where = f"{path.name}[{i}]"
            for field in ("id", "section", "front", "back", "source"):
                if field not in c:
                    err(f"{where}: missing field '{field}'")
                    break
            else:
                if c["id"] in ids:
                    err(f"{where}: duplicate id {c['id']}")
                ids.add(c["id"])
                if c["source"] not in CARD_SOURCES:
                    err(f"{where}: bad source {c['source']}")
                if not (isinstance(c["section"], int) and 0 <= c["section"] <= 15):
                    err(f"{where}: section must be 0–15")
                all_cards.append(c)

    resources = load(CONTENT / "resources.json") or []
    no_script_close(resources, "resources.json")
    resource_ids = set()
    for i, r in enumerate(resources):
        where = f"resources.json[{i}]"
        for field in ("id", "title", "url", "desc", "group"):
            if field not in r:
                err(f"{where}: missing field '{field}'")
                break
        else:
            resource_ids.add(r["id"])
            if not r["url"].startswith("https://"):
                err(f"{where}: url must be https")
            if r["group"] not in RESOURCE_GROUPS:
                err(f"{where}: bad group {r['group']}")

    lessons = []
    ldir = CONTENT / "lessons"
    for path in sorted(ldir.glob("*.json")) if ldir.exists() else []:
        data = load(path)
        if data is None:
            continue
        no_script_close(data, path.name)
        for i, l in enumerate(data):
            where = f"{path.name}[{i}]"
            for field in ("id", "section", "title", "minutes", "blocks"):
                if field not in l:
                    err(f"{where}: missing field '{field}'")
                    break
            else:
                if l["id"] in ids:
                    err(f"{where}: duplicate id {l['id']}")
                ids.add(l["id"])
                lessons.append(l)
                for j, b in enumerate(l["blocks"]):
                    if b.get("type") == "takeaways":
                        if not isinstance(b.get("items"), list):
                            err(f"{where} block {j}: takeaways needs items[]")
                    elif b.get("type") in ("plain", "example", "examLevel"):
                        check_lesson_html(b.get("html", ""), f"{where} block {j}")
                    else:
                        err(f"{where} block {j}: unknown block type {b.get('type')}")
                for rid in l.get("resources", []):
                    if rid not in resource_ids:
                        err(f"{where}: unknown resource id {rid}")

    glossary = load(CONTENT / "glossary.json") if (CONTENT / "glossary.json").exists() else []
    if glossary:
        no_script_close(glossary, "glossary.json")
        for i, g in enumerate(glossary):
            where = f"glossary.json[{i}]"
            for field in ("id", "term", "category", "plain", "example", "reading"):
                if field not in g:
                    err(f"{where}: missing field '{field}'")
                    break
            else:
                if g["id"] in ids:
                    err(f"{where}: duplicate id {g['id']}")
                ids.add(g["id"])
                if g["category"] not in {"data", "api", "ai", "tooling"}:
                    err(f"{where}: bad category {g['category']}")

    # Coverage minimums (warnings until STRICT_CONTENT=1)
    strict = os.environ.get("STRICT_CONTENT") == "1"
    report = warn if not strict else err
    q_by_sec = Counter(q["section"] for q in all_questions)
    c_by_sec = Counter(c["section"] for c in all_cards)
    l_secs = {l["section"] for l in lessons}
    for s in range(0, 16):
        if q_by_sec[s] < 10:
            report(f"section {s}: only {q_by_sec[s]} questions (target ≥10)")
        eligible = sum(1 for q in all_questions
                       if q["section"] == s and q.get("baselineEligible") and q.get("difficulty") == "core")
        if eligible < 3:
            report(f"section {s}: only {eligible} baseline-eligible core questions (target ≥3)")
        if c_by_sec[s] < 8:
            report(f"section {s}: only {c_by_sec[s]} flashcards (target ≥8)")
        if s not in l_secs:
            report(f"section {s}: no lesson")

    # Answer-position distribution (guard against "C is always right")
    dist = Counter(q["answer"] for q in all_questions)
    total = sum(dist.values())
    if total >= 40:
        for pos, count in dist.items():
            if count / total > 0.40:
                warn(f"answer position {'ABCD'[pos]} is correct in {count}/{total} questions — rebalance")

    print(f"Content: {len(all_questions)} questions, {len(all_cards)} flashcards, "
          f"{len(lessons)} lessons, {len(resources)} resources, {len(glossary)} glossary terms")
    for w in warnings:
        print(f"  warning: {w}")
    for e in errors:
        print(f"  ERROR: {e}", file=sys.stderr)
    if errors:
        sys.exit(1)


def review(section_key):
    """Print one section's content as human-readable markdown for batch review."""
    num = int(section_key.lstrip("s0") or "0")
    qpath = CONTENT / "questions" / f"{section_key}.json"
    print(f"# Review sheet — section {num}\n")
    if qpath.exists():
        for q in load(qpath) or []:
            print(f"## {q['id']} ({q['difficulty']})\n\n{q['stem']}\n")
            for i, opt in enumerate(q["options"]):
                marker = " ✅" if i == q["answer"] else ""
                print(f"- **{'ABCD'[i]}.** {opt}{marker}")
            print()
            for i, r in enumerate(q["rationales"]):
                print(f"  - {'ABCD'[i]}: {r}")
            print(f"\n  _source: {q['sourceRef']}_\n")
    fpath = CONTENT / "flashcards" / f"{section_key}.json"
    if fpath.exists():
        print("\n# Flashcards\n")
        for c in load(fpath) or []:
            print(f"- **{c['front']}**\n  → {c['back']}\n")


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--review":
        review(sys.argv[2])
    else:
        main()
