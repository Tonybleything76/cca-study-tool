#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT_DIR/study-app/src"
CONTENT="$ROOT_DIR/study-app/content"
OUT="$ROOT_DIR/cca-study-app.html"

command -v python3 >/dev/null 2>&1 || { echo "python3 is required to build the study app." >&2; exit 1; }

# 1. Validate content (fails the build on structural errors and coverage gaps)
STRICT_CONTENT=1 python3 "$ROOT_DIR/scripts/lint-study-content.py"

# 2. Assemble
{
  printf '<!-- Built %s by scripts/build-study-app.sh — do not edit directly; edit study-app/ and rebuild. -->\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  cat "$SRC/00-head.html"
  cat "$SRC/10-shell.html"

  # Embedded content blocks
  emit_json() { # kind, src-name, file
    printf '<script type="application/json" data-kind="%s" data-src="%s">\n' "$1" "$2"
    cat "$3"
    printf '</script>\n'
  }
  emit_json "sections" "sections" "$CONTENT/sections.json"
  for f in "$CONTENT"/questions/*.json; do
    [ -e "$f" ] || continue
    emit_json "questions" "$(basename "$f" .json)" "$f"
  done
  emit_json "scenarios" "scenarios" "$CONTENT/scenarios.json"
  for f in "$CONTENT"/flashcards/*.json; do
    [ -e "$f" ] || continue
    emit_json "flashcards" "$(basename "$f" .json)" "$f"
  done
  for f in "$CONTENT"/lessons/*.json; do
    [ -e "$f" ] || continue
    emit_json "lessons" "$(basename "$f" .json)" "$f"
  done
  emit_json "resources" "resources" "$CONTENT/resources.json"
  emit_json "glossary" "glossary" "$CONTENT/glossary.json"

  # Manifest for the app's boot-time self-check
  python3 - "$CONTENT" <<'PY'
import json, sys
from pathlib import Path
c = Path(sys.argv[1])
def count(pattern):
    return sum(len(json.loads(p.read_text())) for p in sorted(c.glob(pattern)))
manifest = {
    "questions": count("questions/*.json") + len(json.loads((c / "scenarios.json").read_text())),
    "flashcards": count("flashcards/*.json"),
    "lessons": count("lessons/*.json"),
    "resources": len(json.loads((c / "resources.json").read_text())),
    "glossary": len(json.loads((c / "glossary.json").read_text())),
}
print('<script type="application/json" data-kind="manifest" data-src="manifest">')
print(json.dumps(manifest))
print('</script>')
PY

  # App code
  printf '<script>\n'
  for f in "$SRC"/js/*.js; do
    cat "$f"
    printf '\n'
  done
  printf '</script>\n'
  cat "$SRC/99-tail.html"
} > "$OUT"

cp "$OUT" "$ROOT_DIR/index.html"

SIZE=$(wc -c < "$OUT" | tr -d ' ')
echo "Built $OUT ($(( SIZE / 1024 ))KB) and index.html for GitHub Pages"
