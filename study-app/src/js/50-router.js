"use strict";
APP.router = (function () {
  const routes = {}; // name -> viewFn(params, root)
  let currentGuard = null; // set by exam view; returns false to block navigation

  function register(name, fn) { routes[name] = fn; }

  function parse() {
    const hash = location.hash.replace(/^#\/?/, "") || "dashboard";
    const [pathPart, queryPart] = hash.split("?");
    const segs = pathPart.split("/");
    const params = {};
    if (queryPart) queryPart.split("&").forEach((kv) => {
      const [k, v] = kv.split("=");
      params[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
    return { name: segs[0], arg: segs[1] || null, params };
  }

  let lastHash = location.hash;
  function render() {
    const { name, arg, params } = parse();
    if (currentGuard && !currentGuard()) {
      // Navigation blocked (unfinished timed exam) — restore previous hash.
      history.replaceState(null, "", lastHash || "#/exam");
      return;
    }
    currentGuard = null;
    lastHash = location.hash;
    const root = document.getElementById("app");
    root.innerHTML = "";
    const fn = routes[name] || routes.dashboard;
    fn({ arg, params }, root);
    document.querySelectorAll("nav.tabs a").forEach((a) => {
      a.classList.toggle("active", a.dataset.route === name);
    });
    window.scrollTo(0, 0);
  }

  return {
    register,
    render,
    setGuard(fn) { currentGuard = fn; },
    go(hash) { location.hash = hash; },
    init() {
      const tabs = [
        ["dashboard", "Home"],
        ["plan", "Study Plan"],
        ["lessons", "Lessons"],
        ["cards", "Flashcards"],
        ["practice-menu", "Practice"],
        ["tracker", "Tracker"],
        ["glossary", "Glossary"],
        ["resources", "Resources"],
        ["settings", "Settings"],
      ];
      document.getElementById("nav").innerHTML = tabs
        .map(([r, label]) => '<a href="#/' + r + '" data-route="' + r + '">' + label + "</a>")
        .join("");
      window.addEventListener("hashchange", render);
      render();
    },
  };
})();
