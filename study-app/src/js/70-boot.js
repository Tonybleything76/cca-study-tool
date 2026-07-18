"use strict";
(function boot() {
  try {
    APP.content = APP.loadContent();
  } catch (e) {
    document.getElementById("app").textContent = "This file is damaged: " + e.message + " — rebuild with ./scripts/build-study-app.sh";
    return;
  }
  const problems = APP.verifyContent(APP.content);
  const bannerEl = document.getElementById("storage-banner");
  if (problems.length) {
    const div = document.createElement("div");
    div.className = "banner bad";
    div.textContent = "Content check failed: " + problems.join("; ") + ". Rebuild with ./scripts/build-study-app.sh.";
    bannerEl.appendChild(div);
  }
  APP.state = APP.loadState();
  if (!APP.storage.persistent) {
    const div = document.createElement("div");
    div.className = "banner warn";
    div.innerHTML = "This environment can’t save progress between visits — it lasts only while this tab is open. " +
      'Use <a href="#/settings">Settings → Download backup</a> before you leave, and restore it next time.';
    bannerEl.appendChild(div);
  }
  APP.router.init();
})();
