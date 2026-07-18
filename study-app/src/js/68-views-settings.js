"use strict";
APP.router.register("settings", function (route, root) {
  root.innerHTML =
    '<div class="card"><span class="eyebrow">Settings</span><h2>Your data</h2>' +
    '<p class="muted small">Progress lives in this browser' + (APP.storage.persistent ? "" : " — <strong>and this environment can’t keep it after the tab closes</strong>") +
    ". Export regularly if you study on more than one device.</p>" +
    '<div class="row"><button class="btn primary" id="export-dl">Download backup</button>' +
    '<button class="btn" id="export-copy">Copy to clipboard</button></div>' +
    '<textarea id="export-area" class="card flat" style="width:100%;min-height:6rem;display:none;font-family:var(--mono);font-size:.8rem" readonly></textarea></div>' +

    '<div class="card"><h3>Restore from backup</h3>' +
    '<p class="muted small">Paste an export below or choose a file. This replaces everything currently saved here.</p>' +
    '<textarea id="import-area" style="width:100%;min-height:6rem;font-family:var(--mono);font-size:.8rem" placeholder="Paste backup JSON here…"></textarea>' +
    '<div class="row" style="margin-top:.6rem"><button class="btn" id="import-paste">Restore from pasted text</button>' +
    '<label class="btn">Restore from file<input type="file" id="import-file" accept=".json,application/json" style="display:none"></label></div></div>' +

    '<div class="card"><h3>Baseline</h3>' +
    '<p class="muted small">Re-run the 30-question baseline with fresh questions to measure how far you’ve come. Your original baseline stays as the comparison point.</p>' +
    '<a class="btn" href="#/baseline">Retake baseline</a></div>' +

    '<div class="card"><h3 style="color:var(--bad)">Danger zone</h3>' +
    '<p class="muted small">Wipe all progress in this browser: baseline, history, flashcard schedule, everything.</p>' +
    '<button class="btn danger" id="reset">Reset all progress</button></div>' +

    '<div class="card flat small muted">Content adapted from the ' +
    '<a href="https://github.com/daronyondem/claude-architect-exam-guide" target="_blank" rel="noopener">Claude Architect Exam Preparation Guide</a> ' +
    "by Daron Yondem (CC BY 4.0). This study tool is an independent community project, not affiliated with Anthropic.</div>";

  root.querySelector("#export-dl").addEventListener("click", () => {
    const blob = new Blob([APP.exportState()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cca-study-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  root.querySelector("#export-copy").addEventListener("click", () => {
    const area = root.querySelector("#export-area");
    area.style.display = "block";
    area.value = APP.exportState();
    area.select();
    try { navigator.clipboard.writeText(area.value); } catch (e) { /* selection fallback remains */ }
  });

  function doImport(text) {
    if (!text.trim()) { alert("Nothing to restore — the text box is empty."); return; }
    if (!APP.ui.confirm("Replace ALL progress in this browser with the backup?")) return;
    try {
      APP.importState(text);
      alert("Backup restored.");
      APP.router.go("#/dashboard");
    } catch (e) { alert("That didn’t work: " + e.message); }
  }

  root.querySelector("#import-paste").addEventListener("click", () => doImport(root.querySelector("#import-area").value));
  root.querySelector("#import-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => doImport(reader.result);
    reader.readAsText(file);
  });

  root.querySelector("#reset").addEventListener("click", () => {
    if (!APP.ui.confirm("Really wipe all progress? This cannot be undone.")) return;
    if (!APP.ui.confirm("Last chance — export a backup first if you might want this data. Wipe now?")) return;
    APP.storage.clear();
    APP.state = APP.freshState();
    APP.save();
    APP.router.go("#/dashboard");
    APP.router.render();
  });
});
