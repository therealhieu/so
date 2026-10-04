// The preview page: follows the note active in so, renders math and diagrams
// after every swap, and never sends anything but GET requests.
(() => {
  const article = document.querySelector("[data-article]");
  const badge = document.querySelector("[data-badge]");
  const pathLabel = document.querySelector("[data-path]");
  const banner = document.querySelector("[data-banner]");
  const bannerText = document.querySelector("[data-banner-text]");
  const followButton = document.querySelector("[data-follow]");
  const themeButton = document.querySelector("[data-theme-toggle]");

  /** How long the page waits for a lost connection to come back before it shows Offline. */
  const OFFLINE_AFTER_MS = 10_000;

  let following = true;
  let state = "connecting";
  let shown = decodePath(location.pathname);
  /** The latest note so reported, kept while following is paused. */
  let latest;
  let offlineTimer;
  let diagramId = 0;

  function decodePath(pathname) {
    try {
      return decodeURIComponent(pathname.replace(/^\/+/, ""));
    } catch {
      return "";
    }
  }

  const encodePath = (path) =>
    `/${path.split("/").map(encodeURIComponent).join("/")}`;

  function readTheme() {
    try {
      return localStorage.getItem("so-preview-theme");
    } catch {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem("so-preview-theme", theme);
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
  }

  function currentTheme() {
    const chosen = document.documentElement.dataset.theme;
    if (chosen === "dark" || chosen === "light") return chosen;
    return matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function initDiagrams() {
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      theme: currentTheme() === "dark" ? "dark" : "default",
    });
  }

  function setBadge(text) {
    if (badge.textContent !== text) badge.textContent = text;
    badge.dataset.state = text.replace(/\W+/g, "").toLowerCase();
  }

  function showBanner(text, offerFollow) {
    bannerText.textContent = text;
    followButton.hidden = !offerFollow;
    banner.hidden = false;
  }

  function hideBanner() {
    banner.hidden = true;
  }

  function setShown(path) {
    shown = path;
    pathLabel.textContent = path === "" ? "current note" : path;
    document.title = path === "" ? "so preview" : `${path} — so preview`;
  }

  function swapArticle(html) {
    article.innerHTML = html;
    const empty = [...article.children].every(
      (s) => s.textContent.trim() === "" && s.querySelector("img") === null,
    );
    if (empty)
      article.innerHTML = '<p class="placeholder">This note is empty.</p>';
  }

  async function renderBlocks() {
    for (const el of article.querySelectorAll(".math[data-tex]")) {
      try {
        window.katex.render(el.dataset.tex, el, {
          throwOnError: false,
          displayMode: el.tagName === "DIV",
        });
        // KaTeX shows a formula it cannot parse as red source; label it like a diagram.
        if (el.querySelector(".katex-error") !== null)
          throw new Error("formula did not parse");
      } catch {
        el.textContent = el.dataset.tex;
        el.classList.add("render-error");
      }
    }
    for (const pre of article.querySelectorAll("pre.mermaid")) {
      try {
        diagramId += 1;
        const { svg } = await window.mermaid.render(
          `so-diagram-${diagramId}`,
          pre.textContent,
        );
        const figure = document.createElement("figure");
        figure.className = "mermaid";
        figure.innerHTML = svg;
        pre.replaceWith(figure);
      } catch {
        pre.classList.add("render-error");
      }
    }
  }

  const sections = () => [...article.querySelectorAll(":scope > section")];

  function flashNew(old) {
    if (old.size === 0) return;
    for (const s of sections())
      if (!old.has(s.dataset.hash)) {
        s.classList.remove("changed");
        void s.offsetWidth;
        s.classList.add("changed");
      }
  }

  function scrollToLine(line) {
    let target;
    for (const s of sections())
      if (Number(s.dataset.line) <= line) target = s;
      else break;
    target?.scrollIntoView({ block: "nearest" });
  }

  async function show(path, line) {
    const query = path === "" ? "" : `?path=${encodeURIComponent(path)}`;
    const res = await fetch(`/render${query}`);
    if (res.status === 404) {
      article.innerHTML =
        '<p class="placeholder">This note is not available.</p>';
      setShown(path);
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const old = new Set(sections().map((s) => s.dataset.hash));
    swapArticle(html);
    await renderBlocks();
    if (path === shown) flashNew(old);
    setShown(path);
    if (line !== undefined) scrollToLine(line);
  }

  function lostConnection() {
    if (state === "stopped" || state === "offline") return;
    state = "reconnecting";
    setBadge("Reconnecting…");
    offlineTimer ??= setTimeout(goOffline, OFFLINE_AFTER_MS);
  }

  function goOffline() {
    state = "offline";
    setBadge("Offline");
    document.body.classList.add("offline");
    showBanner("so is not reachable — showing the last copy.", false);
  }

  function follow() {
    const events = new EventSource("/events");
    events.addEventListener("open", () => {
      if (state === "stopped" || state === "offline") return;
      clearTimeout(offlineTimer);
      offlineTimer = undefined;
      state = "live";
      setBadge("Live");
    });
    events.addEventListener("doc", async (e) => {
      latest = JSON.parse(e.data);
      if (!following) return;
      try {
        await show(latest.path, latest.line);
        history.replaceState(null, "", encodePath(latest.path));
        if (state === "live") setBadge("Live");
      } catch {
        lostConnection();
      }
    });
    events.addEventListener("stopped", () => {
      events.close();
      clearTimeout(offlineTimer);
      state = "stopped";
      setBadge("Stopped");
      showBanner("Preview stopped in so — updates have ended.", false);
    });
    events.addEventListener("error", () => {
      if (events.readyState === EventSource.CLOSED) goOffline();
      else lostConnection();
    });
  }

  article.addEventListener("click", async (e) => {
    const link = e.target.closest("a");
    if (link === null || !article.contains(link)) return;
    const href = link.getAttribute("href");
    if (href === null || !href.startsWith("/") || href.startsWith("/file/"))
      return;
    e.preventDefault();
    if (state === "offline") return;
    const path = decodePath(href);
    following = false;
    try {
      await show(path);
      history.pushState(null, "", encodePath(path));
      article.scrollIntoView({ block: "start" });
      showBanner("Following so paused —", true);
    } catch {
      lostConnection();
    }
  });

  followButton.addEventListener("click", async () => {
    following = true;
    hideBanner();
    try {
      await show(latest?.path ?? "", latest?.line);
      if (latest !== undefined)
        history.replaceState(null, "", encodePath(latest.path));
    } catch {
      lostConnection();
    }
  });

  themeButton.addEventListener("click", async () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    storeTheme(next);
    initDiagrams();
    if (state !== "offline") await show(shown).catch(lostConnection);
  });

  const stored = readTheme();
  if (stored === "dark" || stored === "light")
    document.documentElement.dataset.theme = stored;
  initDiagrams();
  setShown(shown);
  if (shown !== "") article.firstElementChild.textContent = `Loading ${shown}…`;
  show(shown).catch(lostConnection);
  follow();
})();
