"use strict";
APP.ui = {};

APP.ui.esc = function (s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

// Two-rule inline formatter for question/flashcard text: `code` and **strong**.
APP.ui.fmt = function (s) {
  return APP.ui.esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
};

APP.ui.letters = ["A", "B", "C", "D"];

// Question renderer. opts: {selected, locked, showFeedback, onSelect}
APP.ui.renderQuestion = function (container, q, opts) {
  opts = opts || {};
  const div = document.createElement("div");
  div.innerHTML =
    '<div class="q-stem">' + APP.ui.fmt(q.stem) + "</div>" +
    '<div class="q-opts">' +
    q.options.map((opt, i) => {
      let cls = "q-opt";
      if (opts.selected === i) cls += " selected";
      if (opts.showFeedback) {
        if (i === q.answer) cls += " correct";
        else if (opts.selected === i) cls += " wrong";
      }
      return (
        '<button type="button" class="' + cls + '" data-i="' + i + '"' + (opts.locked ? " disabled" : "") + ">" +
        '<span class="letter">' + APP.ui.letters[i] + "</span><span>" + APP.ui.fmt(opt) + "</span></button>" +
        (opts.showFeedback ? '<div class="q-rationale"><strong>' + (i === q.answer ? "Correct" : "Why not") + ":</strong> " + APP.ui.fmt(q.rationales[i]) + "</div>" : "")
      );
    }).join("") +
    "</div>";
  if (opts.onSelect && !opts.locked) {
    div.querySelectorAll(".q-opt").forEach((btn) => {
      btn.addEventListener("click", () => opts.onSelect(parseInt(btn.dataset.i, 10)));
    });
  }
  container.appendChild(div);
  return div;
};

// Wall-clock timer: computes remaining from an absolute end time so refresh keeps it honest.
APP.ui.createTimer = function (endEpoch, onTick, onExpire) {
  let id = null;
  function tick() {
    const ms = endEpoch - Date.now();
    if (ms <= 0) { clearInterval(id); onTick(0); onExpire(); return; }
    onTick(ms);
  }
  id = setInterval(tick, 500);
  tick();
  return { stop: () => clearInterval(id) };
};

APP.ui.fmtClock = function (ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
};

APP.ui.progressBar = function (pct, markerPct) {
  return '<div class="bar"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i>' +
    (markerPct != null ? '<b class="marker" style="left:' + Math.max(0, Math.min(100, markerPct)) + '%"></b>' : "") +
    "</div>";
};

APP.ui.masteryPill = function (m) {
  if (m == null) return '<span class="pill neutral">Not started</span>';
  if (m >= 80) return '<span class="pill ok">' + m + "%</span>";
  if (m >= 55) return '<span class="pill warn">' + m + "%</span>";
  return '<span class="pill bad">' + m + "%</span>";
};

// Overall mastery ring as inline SVG.
APP.ui.ring = function (pct, size) {
  size = size || 96;
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const filled = pct == null ? 0 : (pct / 100) * c;
  return (
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" role="img" aria-label="Overall mastery">' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--card-alt)" stroke-width="10"/>' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" ' +
    'stroke-dasharray="' + filled + " " + c + '" transform="rotate(-90 ' + size / 2 + " " + size / 2 + ')"/>' +
    '<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="' + size / 4.2 + '" font-weight="700" fill="var(--ink)" font-family="var(--mono)">' +
    (pct == null ? "—" : pct + "%") + "</text></svg>"
  );
};

// Score-over-time sparkline.
APP.ui.sparkline = function (points, width, height) {
  width = width || 260; height = height || 48;
  if (points.length < 2) return '<span class="muted small">Complete two sessions to see a trend.</span>';
  const min = 0, max = 100;
  const xs = points.map((_, i) => (i / (points.length - 1)) * (width - 8) + 4);
  const ys = points.map((p) => height - 6 - ((p - min) / (max - min)) * (height - 12));
  const pts = xs.map((x, i) => x.toFixed(1) + "," + ys[i].toFixed(1)).join(" ");
  const last = points[points.length - 1];
  return (
    '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="Score trend">' +
    '<polyline points="' + pts + '" fill="none" stroke="var(--accent)" stroke-width="2"/>' +
    '<circle cx="' + xs[xs.length - 1].toFixed(1) + '" cy="' + ys[ys.length - 1].toFixed(1) + '" r="3.5" fill="var(--accent)"/>' +
    '<text x="' + (width - 4) + '" y="12" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">' + last + "%</text></svg>"
  );
};

APP.ui.streakGrid = function () {
  const days = new Set(APP.state.streak.activeDays);
  const cells = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    cells.push('<span title="' + d + '" style="width:12px;height:12px;border-radius:3px;background:' +
      (days.has(d) ? "var(--accent)" : "var(--card-alt)") + '"></span>');
  }
  return '<div style="display:flex;gap:3px;flex-wrap:wrap">' + cells.join("") + "</div>";
};

APP.ui.confirm = function (msg) { return window.confirm(msg); };
