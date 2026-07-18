"use strict";
APP.router.register("cards", function (route, root) {
  const deck = APP.engine.cardSession();
  const totalCards = APP.content.flashcards.length;
  const masteredTotal = APP.content.sections.reduce((acc, s) => acc + APP.engine.masteredCount(s.num), 0);

  if (!deck.length) {
    root.innerHTML = '<div class="card"><span class="eyebrow">Flashcards</span><h2>Nothing due right now</h2>' +
      '<p class="muted">All caught up. Cards come back on a schedule — the better you know one, the longer it stays away.</p>' +
      '<p class="small num muted">' + masteredTotal + " / " + totalCards + " cards mastered</p>" +
      '<a class="btn primary" href="#/dashboard">Dashboard</a></div>' + sectionBars();
    return;
  }

  let idx = 0, flipped = false, gotIt = 0, missed = 0;

  function sectionBars() {
    return '<div class="card"><h3>Mastered by section</h3><div class="stack" style="margin-top:.6rem">' +
      APP.content.sections.map((s) => {
        const cards = APP.content.bySection[s.num].flashcards;
        if (!cards.length) return "";
        const m = APP.engine.masteredCount(s.num);
        return '<div><div class="spread"><span class="small">' + APP.ui.esc(s.short) +
          '</span><span class="small num">' + m + "/" + cards.length + "</span></div>" +
          APP.ui.progressBar((m / cards.length) * 100) + "</div>";
      }).join("") + "</div></div>";
  }

  function render() {
    if (idx >= deck.length) {
      root.innerHTML = '<div class="card" style="text-align:center"><span class="eyebrow">Session complete</span>' +
        "<h2>" + deck.length + " cards reviewed</h2>" +
        '<p class="muted"><span class="num">' + gotIt + "</span> known · <span class=\"num\">" + missed + "</span> to see again soon</p>" +
        '<div class="row" style="justify-content:center"><a class="btn primary" href="#/dashboard">Done</a></div></div>' + sectionBars();
      return;
    }
    const card = deck[idx];
    const secMeta = APP.content.sections.find((s) => s.num === card.section);
    const box = (APP.state.leitner[card.id] || { box: 0 }).box;
    root.innerHTML = '<div class="card"><div class="spread">' +
      '<span class="eyebrow">' + APP.ui.esc(secMeta ? secMeta.short : "") + (box ? " · box " + box : " · new") + "</span>" +
      '<span class="muted small num">' + (idx + 1) + " / " + deck.length + "</span></div>" +
      '<div class="flashcard card flat" id="face" role="button" tabindex="0" aria-label="Flip card">' +
      "<div>" + APP.ui.fmt(flipped ? card.back : card.front) +
      (!flipped ? '<div class="muted small" style="margin-top:.8rem">tap to reveal</div>' : "") + "</div></div>" +
      '<div class="row" style="justify-content:center;margin-top:.6rem" id="actions"></div></div>';
    const face = root.querySelector("#face");
    const flip = () => { flipped = !flipped; render(); };
    face.addEventListener("click", flip);
    face.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    if (flipped) {
      const actions = root.querySelector("#actions");
      const miss = document.createElement("button");
      miss.className = "btn danger"; miss.textContent = "Missed it";
      miss.addEventListener("click", () => { APP.engine.reviewCard(card.id, false); missed++; idx++; flipped = false; render(); });
      const got = document.createElement("button");
      got.className = "btn primary"; got.textContent = "Got it";
      got.addEventListener("click", () => { APP.engine.reviewCard(card.id, true); gotIt++; idx++; flipped = false; render(); });
      actions.append(miss, got);
    }
  }
  render();
});
