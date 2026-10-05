/* so mockups — shared framework (W261005F2A7 shared R3, forked from RM261003ABZP shared R2; git hooks: st.signs, o.git, r.git — rendered by git.js) */
/* so v1 mockups — shared framework (shared R2)
 * - Mock.create(cfg): builds the review page (sidebar with states, keys, viewport/theme controls) and a
 *   simulated terminal (or browser) frame; routes real key presses to cfg.onKey; provides leader + which-key.
 * - Mock.md: tiny Obsidian-flavoured Markdown renderer used by the editor mockups (live / source / reading,
 *   cursor-line and block reveal per RM261003ABZP-REQ5@R2).
 * - Mock.ui: shared chrome (bufferline, statusline, explorer, floats, pickers, toasts).
 * Mockup-only code: no production dependency. */
(function () {
  "use strict";
  const Mock = (window.Mock = {});
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  Mock.esc = esc;
  Mock.span = (cls, text) => `<span class="${cls}">${esc(text)}</span>`;
  Mock.pad = (s, n) => { s = String(s); return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length); };
  Mock.padL = (s, n) => { s = String(s); return s.length >= n ? s.slice(0, n) : " ".repeat(n - s.length) + s; };
  Mock.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- key normalization ---------------- */
  function keyName(e) {
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return null;
    if (e.metaKey) return null;
    const map = { Escape: "<Esc>", Enter: "<CR>", Backspace: "<BS>", Tab: "<Tab>", " ": "<Space>", ArrowUp: "<Up>", ArrowDown: "<Down>", ArrowLeft: "<Left>", ArrowRight: "<Right>", Delete: "<Del>" };
    let k = map[e.key] || e.key;
    if (e.ctrlKey && e.key.length === 1) return `<C-${e.key.toLowerCase()}>`;
    if (e.ctrlKey && k === "<Space>") return "<C-Space>";
    return k;
  }
  Mock.isChar = (k) => k.length === 1;

  /* ---------------- default leader map (LazyVim-style; RM261003ABZP-REQ3@R2) ---------------- */
  const SEE = (m, what) => (app) => Mock.toast(app, "info", "Shown in " + m, what, 2600);
  Mock.defaultLeader = () => ({
    e: { label: "Explorer", run: SEE("m1 App shell", "<leader>e toggles the explorer") },
    o: { label: "Outline", run: SEE("m1 App shell", "<leader>o toggles the heading outline") },
    m: { label: "Cycle live → source → reading", run: SEE("m2 Live preview", "<leader>m cycles the note mode") },
    x: { label: "Toggle checkbox", run: SEE("m2 Live preview", "<leader>x toggles a task checkbox") },
    ":": { label: "Command palette", run: SEE("m3 Overlays", "<leader>: opens the command palette") },
    "?": { label: "Help: keymap", run: SEE("m3 Overlays", "<leader>? shows the active keymap") },
    f: { label: "find", items: {
      f: { label: "Files (quick switcher)", run: SEE("m3 Overlays", "Space f f") },
      r: { label: "Recent notes", run: SEE("m3 Overlays", "Space f r") },
      b: { label: "Open buffers", run: SEE("m3 Overlays", "Space f b") },
    } },
    s: { label: "search", items: {
      g: { label: "Grep (full text)", run: SEE("m3 Overlays", "Space s g") },
      h: { label: "Headings in note", run: SEE("m3 Overlays", "Space s h") },
      t: { label: "Tags", run: SEE("m3 Overlays", "Space s t") },
      b: { label: "Backlinks", run: SEE("m3 Overlays", "Space s b") },
      c: { label: "Commands", run: SEE("m3 Overlays", "Space s c") },
      k: { label: "Keymaps", run: SEE("m3 Overlays", "Space s k") },
    } },
    n: { label: "notes", items: {
      d: { label: "Daily note (today)", run: SEE("m5 Daily & templates", "Space n d = :Today") },
      p: { label: "Pick a date", run: SEE("m5 Daily & templates", "Space n p") },
      t: { label: "Insert template", run: SEE("m5 Daily & templates", "Space n t") },
      n: { label: "New note", run: SEE("m5 Daily & templates", "Space n n") },
    } },
    l: { label: "links", items: {
      b: { label: "Backlinks panel", run: SEE("m4 Links & files", "Space l b") },
      r: { label: "Rename note (update links)", run: SEE("m4 Links & files", "Space l r") },
      u: { label: "Unlinked mentions", run: SEE("m4 Links & files", "Space l u") },
    } },
    b: { label: "buffer", items: {
      d: { label: "Delete buffer", run: SEE("m1 App shell", ":bd") },
      n: { label: "Next buffer", run: SEE("m1 App shell", ":bn") },
      p: { label: "Previous buffer", run: SEE("m1 App shell", ":bp") },
    } },
    w: { label: "window", items: {
      v: { label: "Split vertical", run: SEE("m1 App shell", ":vs") },
      s: { label: "Split horizontal", run: SEE("m1 App shell", ":sp") },
      d: { label: "Close window", run: SEE("m1 App shell", ":q") },
    } },
    u: { label: "ui toggles", items: {
      i: { label: "Images: auto / blocks / off", run: SEE("m2 Live preview", "Space u i") },
      w: { label: "Wrap", run: SEE("m2 Live preview", "Space u w") },
      p: { label: "Browser preview (:Preview)", run: SEE("m7 Web preview", ":Preview") },
    } },
  });
  Mock.leaderWith = (overrides) => {
    const m = Mock.defaultLeader();
    for (const [path, run] of Object.entries(overrides || {})) {
      const parts = path.split(".");
      let node = m;
      for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]].items;
      const last = parts[parts.length - 1];
      node[last] = Object.assign({}, node[last] || { label: last }, typeof run === "function" ? { run } : run);
    }
    return m;
  };

  /* ---------------- toasts ---------------- */
  Mock.toast = (app, level, title, body, ms) => {
    const t = { id: Math.random(), level, title, body };
    app.toasts.push(t);
    if (app.toasts.length > 3) app.toasts.shift();
    if (ms !== 0) setTimeout(() => { app.toasts = app.toasts.filter((x) => x !== t); Mock.render(); }, ms || 3500);
    Mock.render();
  };
  function toastsHtml(app) {
    if (!app.toasts.length) return "";
    const icon = { info: "i", warn: "!", error: "✗", ok: "✓" };
    return `<div class="toasts">${app.toasts.map((t) => `<div class="toast ${t.level}"><div class="ln"><span class="tt t-${t.level === "error" ? "err" : t.level}">${icon[t.level] || "i"} ${esc(t.title)}</span></div>${(Array.isArray(t.body) ? t.body : t.body ? [t.body] : []).map((b) => `<div class="ln">${b.startsWith("<") ? b : esc(b)}</div>`).join("")}</div>`).join("")}</div>`;
  }

  /* ---------------- which-key ---------------- */
  function whichKeyHtml(app) {
    if (!app.leader || !app.wk) return "";
    let node = app.leaderMap;
    for (const k of app.leader.path) node = node[k].items;
    const entries = Object.entries(node).sort((a, b) => (a[1].items ? 1 : 0) - (b[1].items ? 1 : 0) || a[0].localeCompare(b[0]));
    const colW = 30;
    const ncol = Math.max(1, Math.floor((app.cols - 4) / colW));
    const nrow = Math.ceil(entries.length / ncol);
    const lines = [];
    for (let r = 0; r < nrow; r++) {
      let s = "";
      for (let c = 0; c < ncol; c++) {
        const e = entries[c * nrow + r];
        if (!e) continue;
        const [k, v] = e;
        const label = v.items ? `+${v.label}` : v.label;
        s += `<span class="wk-key">${esc(Mock.padL(k === " " ? "␣" : k, 3))}</span> <span class="dim">→</span> <span class="${v.items ? "wk-grp" : "wk-desc"}">${esc(Mock.pad(label, colW - 7))}</span>`;
      }
      lines.push(`<div class="ln"> ${s}</div>`);
    }
    const title = "␣" + app.leader.path.map((k) => " " + k).join("");
    const h = nrow + 2;
    return `<div class="float" style="left:0;right:0;bottom:calc(var(--lh)*2);height:calc(var(--lh)*${h});border-radius:0;border-left:0;border-right:0"><span class="ftitle">${esc(title)}</span><div class="ln"></div>${lines.join("")}<div class="ln dim"> <span class="wk-key">esc</span> close   <span class="wk-key">bs</span> back</div></div>`;
  }

  /* ---------------- page + render loop ---------------- */
  let CFG = null, APP = null, termEl = null, captionEl = null, winEl = null, stateBtns = {};
  Mock.app = () => APP;
  Mock.create = (cfg) => {
    CFG = cfg;
    APP = Object.assign({ cols: 120, rows: 36, theme: "dark", toasts: [], leader: null, wk: false, showcmd: "", stateId: null }, cfg.init());
    APP.leaderMap = cfg.leader ? cfg.leader(APP) : Mock.defaultLeader();
    document.addEventListener("DOMContentLoaded", build);
  };
  function seg(label, opts, get, set) {
    const wrap = document.createElement("div");
    wrap.className = "seg"; wrap.setAttribute("role", "group"); wrap.setAttribute("aria-label", label);
    for (const [val, text] of opts) {
      const b = document.createElement("button");
      b.textContent = text; b.type = "button";
      b.onclick = () => { set(val); refreshSeg(); Mock.render(); termEl && termEl.focus(); };
      b.dataset.val = val;
      wrap.appendChild(b);
    }
    const refreshSeg = () => wrap.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(String(get()) === b.dataset.val)));
    refreshSeg();
    wrap._refresh = refreshSeg;
    return wrap;
  }
  const segs = [];
  function build() {
    document.body.className = "page";
    const aside = document.createElement("aside");
    aside.className = "review";
    aside.innerHTML = `<a class="home" href="index.html">← All mockups</a><h1>${esc(CFG.title)}</h1><div class="mid">${esc(CFG.id)} · ${esc(CFG.rev || "R1")} · ${esc(CFG.path || "")}</div><p class="sub">${esc(CFG.subtitle || "")}</p>`;
    const h2 = (t) => { const e = document.createElement("h2"); e.textContent = t; aside.appendChild(e); };
    h2("View");
    const controls = document.createElement("div"); controls.className = "controls";
    if (CFG.frame !== "browser") {
      const s1 = seg("Viewport", [["120x36", "120×36"], ["80x24", "80×24"]], () => `${APP.cols}x${APP.rows}`, (v) => { const [c, r] = v.split("x").map(Number); APP.cols = c; APP.rows = r; CFG.onResize && CFG.onResize(APP); });
      controls.appendChild(s1); segs.push(s1);
    } else {
      const s1 = seg("Viewport", [["1200", "Desktop"], ["375", "375 px"]], () => String(APP.vw || 1200), (v) => { APP.vw = Number(v); });
      controls.appendChild(s1); segs.push(s1);
    }
    const s2 = seg("Theme", [["dark", "dark"], ["light", "light"], ["nocolor", "NO_COLOR"]], () => APP.theme, (v) => (APP.theme = v));
    controls.appendChild(s2); segs.push(s2);
    for (const c of CFG.controls || []) { const s = seg(c.label, c.options, () => c.get(APP), (v) => c.set(APP, v)); controls.appendChild(s); segs.push(s); }
    aside.appendChild(controls);
    h2("States — click to jump");
    const ul = document.createElement("ul"); ul.className = "states";
    let grp = null;
    for (const st of CFG.states) {
      if (st.group !== grp) { grp = st.group; const g = document.createElement("li"); g.className = "grp"; g.textContent = grp; ul.appendChild(g); }
      const li = document.createElement("li");
      const b = document.createElement("button"); b.type = "button";
      b.innerHTML = `<span class="sid">${esc(st.id)}</span><span>${esc(st.label)}</span>`;
      b.onclick = () => { Mock.go(st.id); termEl && termEl.focus(); };
      stateBtns[st.id] = b;
      li.appendChild(b); ul.appendChild(li);
    }
    aside.appendChild(ul);
    h2("Keys in this mockup");
    const tbl = document.createElement("table"); tbl.className = "keys";
    tbl.innerHTML = (CFG.keys || []).map(([k, d]) => `<tr><td>${k.split(" ").map((x) => `<kbd>${esc(x)}</kbd>`).join(" ")}</td><td>${esc(d)}</td></tr>`).join("");
    aside.appendChild(tbl);
    if (CFG.notes) { h2("Notes"); const p = document.createElement("p"); p.className = "sub"; p.innerHTML = CFG.notes; aside.appendChild(p); }
    const main = document.createElement("main"); main.className = "stage";
    main.innerHTML = `<p class="hint">${CFG.frame === "browser" ? "Click links inside the page; use the states on the left." : "Click the terminal, then use real keys (vim-style). Every state is also reachable from the list on the left."}</p>`;
    winEl = document.createElement("div"); winEl.className = "window";
    if (CFG.frame === "browser") {
      winEl.innerHTML = "";
      termEl = document.createElement("div"); termEl.className = "browser"; termEl.tabIndex = 0;
      winEl.appendChild(termEl);
    } else {
      winEl.innerHTML = `<div class="titlebar"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span><span class="t">${esc(CFG.windowTitle || "so — ~/notes")}</span></div>`;
      termEl = document.createElement("div"); termEl.className = "term"; termEl.tabIndex = 0; termEl.setAttribute("role", "application"); termEl.setAttribute("aria-label", "Simulated so terminal");
      winEl.appendChild(termEl);
    }
    main.appendChild(winEl);
    captionEl = document.createElement("div"); captionEl.className = "caption"; captionEl.setAttribute("aria-live", "polite");
    // a long browser page would push the caption far down, so it goes above the frame there
    if (CFG.frame === "browser") main.insertBefore(captionEl, winEl); else main.appendChild(captionEl);
    document.body.innerHTML = "";
    document.body.appendChild(aside); document.body.appendChild(main);
    termEl.addEventListener("keydown", onKeyDown);
    termEl.addEventListener("click", (e) => { const t = e.target.closest("[data-click]"); if (t && CFG.onClick) { CFG.onClick(APP, t.dataset.click, e); Mock.render(); } });
    Mock.go(CFG.states[0].id);
    termEl.focus();
  }
  Mock.go = (id) => {
    const st = CFG.states.find((s) => s.id === id);
    if (!st) return;
    const keep = { cols: APP.cols, rows: APP.rows, theme: APP.theme, vw: APP.vw };
    for (const k of Object.keys(APP)) delete APP[k];
    Object.assign(APP, { toasts: [], leader: null, wk: false, showcmd: "" }, CFG.init(), keep, { stateId: id });
    APP.leaderMap = CFG.leader ? CFG.leader(APP) : Mock.defaultLeader();
    if (st.apply) st.apply(APP);
    APP.stateId = id;
    const stage = document.querySelector(".stage");
    if (stage) stage.scrollTop = 0;
    for (const [sid, b] of Object.entries(stateBtns)) b.setAttribute("aria-current", String(sid === id));
    Mock.render();
  };
  Mock.markState = (id) => { APP.stateId = id; for (const [sid, b] of Object.entries(stateBtns)) b.setAttribute("aria-current", String(sid === id)); };
  Mock.render = () => {
    if (!termEl) return;
    segs.forEach((s) => s._refresh());
    winEl.className = `window theme-${APP.theme}`;
    if (CFG.frame === "browser") {
      termEl.style.width = (APP.vw || 1200) + "px";
      termEl.innerHTML = CFG.render(APP);
    } else {
      termEl.style.setProperty("--cols", APP.cols);
      termEl.style.setProperty("--rows", APP.rows);
      termEl.innerHTML = CFG.render(APP) + toastsHtml(APP) + whichKeyHtml(APP);
    }
    const st = CFG.states.find((s) => s.id === APP.stateId);
    const cap = APP.caption || (st && st.caption) || "";
    const refs = (st && st.refs) || "";
    captionEl.innerHTML = `<b>${esc(st ? st.id + " · " + st.label : "")}</b> — ${cap}${refs ? `<div class="refs">Traces to: ${esc(refs)}</div>` : ""}`;
  };
  function pushShowcmd(k) {
    APP.showcmd = (APP.showcmd + (k === "<Space>" ? "␣" : k.length > 1 ? k : k)).slice(-10);
    clearTimeout(pushShowcmd.t);
    pushShowcmd.t = setTimeout(() => { APP.showcmd = ""; Mock.render(); }, 1400);
  }
  function onKeyDown(e) {
    const k = keyName(e);
    if (!k) return;
    pushShowcmd(k);
    // leader sequence in progress
    if (APP.leader) {
      e.preventDefault();
      if (k === "<Esc>") { APP.leader = null; APP.wk = false; Mock.render(); return; }
      if (k === "<BS>") { if (APP.leader.path.length) APP.leader.path.pop(); else { APP.leader = null; APP.wk = false; } Mock.render(); return; }
      let node = APP.leaderMap;
      for (const p of APP.leader.path) node = node[p].items;
      const hit = node[k];
      if (!hit) { APP.leader = null; APP.wk = false; Mock.render(); return; }
      if (hit.items) { APP.leader.path.push(k); APP.wk = true; clearTimeout(APP.leader.t); Mock.render(); return; }
      APP.leader = null; APP.wk = false;
      hit.run && hit.run(APP);
      Mock.render();
      return;
    }
    const handled = CFG.onKey ? CFG.onKey(APP, k, e) : false;
    if (handled) { e.preventDefault(); Mock.render(); return; }
    const leaderOk = CFG.leaderAllowed ? CFG.leaderAllowed(APP) : true;
    if (k === "<Space>" && leaderOk) {
      e.preventDefault();
      APP.leader = { path: [] };
      APP.leader.t = setTimeout(() => { if (APP.leader) { APP.wk = true; Mock.render(); } }, 300);
      Mock.render();
      return;
    }
    if (k === "<Tab>" || k.startsWith("<C-") || k === "<Space>") e.preventDefault();
    Mock.render();
  }

  /* ---------------- UI helpers ---------------- */
  const ui = (Mock.ui = {});
  ui.ln = (html, cls) => `<div class="ln${cls ? " " + cls : ""}">${html}</div>`;
  ui.lines = (arr) => arr.map((h) => ui.ln(h)).join("");
  ui.bufferline = (bufs, active, right) => {
    const items = bufs.map((b, i) => `<span class="buf${i === active ? " active" : ""}" data-click="buf:${i}">${esc(b.icon || "")}${esc(b.name)}${b.dirty ? ' <span class="dirty">●</span>' : ""}</span>`).join("");
    return `<div class="ln bufferline" style="display:flex">${items}<span style="margin-left:auto" class="dim">${esc(right || "")} </span></div>`;
  };
  ui.statusline = (app, o) => {
    const modeCls = { NORMAL: "mode-normal", INSERT: "mode-insert", VISUAL: "mode-visual", "V-LINE": "mode-visual", COMMAND: "mode-cmd", EXPLORER: "mode-normal", PICKER: "mode-cmd", BASE: "mode-normal", READING: "mode-normal", CONFLICT: "mode-cmd" }[o.mode] || "mode-normal";
    const narrow = app.cols < 100;
    const L = [];
    L.push(`<span class="seg-s mode ${modeCls}">${esc(o.mode)}</span>`);
    if (o.view && !narrow) L.push(`<span class="seg-s alt">${esc(o.view)}</span>`);
    L.push(`<span class="seg-s">${esc(o.path || "")}${o.dirty ? ' <span class="dirty">●</span>' : ""}</span>`);
    if (o.git && !narrow) L.push(Mock.gitSegment(o.git));
    if (o.saveError) L.push(`<span class="seg-s t-err">✗ save failed: ${esc(o.saveError)}</span>`);
    const R = [];
    if (o.extra) R.push(`<span class="seg-s">${o.extra}</span>`);
    if (o.backlinks != null) R.push(`<span class="seg-s t-wiki" style="text-decoration:none">⇠ ${o.backlinks}${narrow ? "" : " backlinks"}</span>`);
    if (o.words != null && !narrow) R.push(`<span class="seg-s dim">${o.words} words</span>`);
    if (o.preview && !narrow) R.push(`<span class="seg-s ${o.preview === "off" ? "dim" : "t-ok"}">${o.preview === "off" ? "preview off" : "◉ " + esc(o.preview)}</span>`);
    if (o.index) R.push(`<span class="seg-s ${o.index === "ready" ? "dim" : "t-warn"}">${o.index === "ready" ? (narrow ? "◆" : "◆ index ready") : "◌ " + esc(o.index)}</span>`);
    if (o.ln != null) R.push(`<span class="seg-s alt">${o.ln}:${o.col}</span>`);
    return `<div class="status">${L.join("")}<span style="flex:1"></span>${R.join("")}</div>`;
  };
  ui.cmdline = (app, html) => `<div class="cmdline"><span>${html || ""}</span><span class="showcmd">${esc(app.showcmd)}</span></div>`;
  const ICON = { dir: ["▸ ", "ic-dir"], diropen: ["▾ ", "ic-dir"], md: ["◇ ", "ic-md"], base: ["▦ ", "ic-base"], img: ["◩ ", "ic-img"], text: ["≡ ", "ic-text"], bin: ["▫ ", "ic-bin"] };
  ui.icon = (kind) => ICON[kind] || ICON.md;
  ui.explorer = (o) => {
    const out = [ui.ln(` <span class="pane-title">${esc(o.title || "NOTES")}</span>${o.hint ? `<span class="dim">  ${esc(o.hint)}</span>` : ""}`)];
    o.rows.forEach((r, i) => {
      const ic = r.kind === "dir" ? (r.open ? ICON.diropen : ICON.dir) : ICON[r.kind] || ICON.md;
      const sel = i === o.sel ? " tree-sel" : "";
      const name = r.edit != null ? `<span class="cur-under">${esc(r.edit)}</span><span class="cur"> </span>` : esc(r.name);
      out.push(`<div class="ln${sel}" data-click="tree:${i}"> ${"  ".repeat(r.depth)}<span class="${ic[1]}">${ic[0]}</span>${r.kind === "dir" ? `<span class="ic-dir">${name}</span>` : name}${r.dirty ? ' <span class="dirty">●</span>' : ""}${r.git ? Mock.gitMarker(r, o) : ""}${r.note ? ` <span class="dim">${esc(r.note)}</span>` : ""}</div>`);
    });
    return `<div class="vcol${o.focus ? " tree-focus" : ""}" style="width:${o.width || 30}ch;flex:none;background:var(--bg-dark);overflow:hidden">${out.join("")}</div>`;
  };
  ui.float = (o) => {
    const style = `left:calc(${o.x}*1ch);top:calc(${o.y}*var(--lh));width:calc(${o.w}*1ch);height:calc(${o.h}*var(--lh));${o.style || ""}`;
    return `<div class="float" style="${style}">${o.title ? `<span class="ftitle">${esc(o.title)}</span>` : ""}<div class="ln"></div>${o.body}</div>`;
  };
  ui.center = (app, w, h) => ({ x: Math.max(0, Math.floor((app.cols - w) / 2)), y: Math.max(1, Math.floor((app.rows - h) / 2) - 1), w: Math.min(w, app.cols), h: Math.min(h, app.rows - 2) });
  ui.highlightHits = (text, q) => {
    if (!q) return esc(text);
    let out = "", qi = 0;
    const ql = q.toLowerCase();
    for (const ch of text) {
      if (qi < ql.length && ch.toLowerCase() === ql[qi]) { out += `<span class="pick-hit">${esc(ch)}</span>`; qi++; } else out += esc(ch);
    }
    return out;
  };
  ui.fuzzy = (text, q) => {
    if (!q) return 1;
    const t = text.toLowerCase(), ql = q.toLowerCase();
    let ti = 0, score = 0, last = -1;
    for (const ch of ql) {
      const at = t.indexOf(ch, ti);
      if (at < 0) return 0;
      // fzf-style bonuses: consecutive characters and word starts (after / - _ . or space)
      score += (at === last + 1 ? 3 : 1) + (at === 0 || "/-_. ".includes(t[at - 1]) ? 4 : 0);
      last = at; ti = at + 1;
    }
    return score + 1 / (t.length + 1);
  };
  // picker: list on the left, preview on the right (hidden when narrow)
  ui.picker = (app, o) => {
    const box = ui.center(app, Math.min(app.cols - 4, o.w || 104), Math.min(app.rows - 4, o.h || 26));
    const showPrev = o.preview && app.cols >= 100;
    const listW = showPrev ? Math.floor(box.w * 0.45) : box.w - 2;
    const prevW = box.w - listW - 3;
    const listH = box.h - 4;
    const top = Mock.clamp(o.sel - listH + 1, 0, Math.max(0, o.items.length - listH));
    const rows = [];
    rows.push(`<div class="ln"> <span class="t-h2">${esc(o.promptIcon || "❯")}</span> ${esc(o.query || "")}<span class="cur"> </span><span style="float:right" class="dim">${esc(o.count || `${o.items.length}`)} </span></div>`);
    rows.push(`<div class="ln dim"> ${"─".repeat(Math.max(0, listW - 1))}</div>`);
    for (let i = 0; i < listH; i++) {
      const it = o.items[top + i];
      rows.push(`<div class="ln${it && top + i === o.sel ? " pick-sel" : ""}">${it ? (top + i === o.sel ? '<span class="t-h2">▌</span>' : " ") + it.html : ""}</div>`);
    }
    const left = `<div class="vcol" style="width:${listW}ch;flex:none">${rows.join("")}</div>`;
    const right = showPrev ? `<div class="sep-v">${'<div class="ln"></div>'.repeat(box.h)}</div><div class="vcol fill" style="width:${prevW}ch">${(o.preview || []).slice(0, box.h - 2).map((h) => `<div class="ln">${h}</div>`).join("")}</div>` : "";
    const foot = o.foot || "↑↓/C-n C-p move · ⏎ open · esc close";
    return ui.float({ x: box.x, y: box.y, w: box.w, h: box.h, title: o.title, body: `<div class="row fill">${left}${right}</div><div class="ln ffoot"> ${esc(foot)}</div>` });
  };

  /* ---------------- Markdown model + renderer ---------------- */
  const md = (Mock.md = {});
  md.parse = (text) => {
    const L = text.replace(/^\n/, "").split("\n");
    const out = [];
    let i = 0, bid = 0;
    if (L[0] === "---") {
      const b = ++bid;
      out.push({ raw: L[0], kind: "fm-open", block: b });
      i = 1;
      while (i < L.length && L[i] !== "---") { out.push({ raw: L[i], kind: "fm", block: b }); i++; }
      if (i < L.length) { out.push({ raw: L[i], kind: "fm-close", block: b }); i++; }
    }
    for (; i < L.length; i++) {
      const r = L[i];
      if (/^```/.test(r)) {
        const lang = r.slice(3).trim();
        const b = ++bid, kind = lang === "mermaid" ? "mermaid" : "code";
        out.push({ raw: r, kind: kind + "-open", block: b, lang });
        i++;
        while (i < L.length && !/^```/.test(L[i])) { out.push({ raw: L[i], kind, block: b, lang }); i++; }
        if (i < L.length) out.push({ raw: L[i], kind: kind + "-close", block: b, lang });
        continue;
      }
      if (r.trim() === "$$") {
        const b = ++bid;
        out.push({ raw: r, kind: "math-open", block: b });
        i++;
        while (i < L.length && L[i].trim() !== "$$") { out.push({ raw: L[i], kind: "math", block: b }); i++; }
        if (i < L.length) out.push({ raw: L[i], kind: "math-close", block: b });
        continue;
      }
      if (/^\|/.test(r)) {
        const b = ++bid, rows = [];
        const start = out.length;
        while (i < L.length && /^\|/.test(L[i])) { rows.push(L[i]); out.push({ raw: L[i], kind: "table", block: b }); i++; }
        i--;
        const cells = rows.map((x) => x.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        const widths = [];
        cells.forEach((row, ri) => { if (ri === 1) return; row.forEach((c, ci) => (widths[ci] = Math.max(widths[ci] || 3, md.visibleLen(c)))); });
        const align = (cells[1] || []).map((c) => (/^:-+:$/.test(c) ? "c" : /-+:$/.test(c) ? "r" : "l"));
        for (let k = start; k < out.length; k++) Object.assign(out[k], { cells: cells[k - start], widths, align, ti: k - start, tlen: rows.length });
        continue;
      }
      const co = r.match(/^> \[!(\w+)\]([-+]?)\s*(.*)$/);
      if (co) {
        const b = ++bid;
        const meta = { ctype: co[1].toLowerCase(), fold: co[2], title: co[3] };
        out.push(Object.assign({ raw: r, kind: "callout-open", block: b }, meta));
        while (i + 1 < L.length && /^>/.test(L[i + 1])) { i++; out.push(Object.assign({ raw: L[i], kind: "callout", block: b }, meta)); }
        continue;
      }
      if (/^> /.test(r)) { out.push({ raw: r, kind: "quote", block: null }); continue; }
      out.push({ raw: r, kind: "p", block: null });
    }
    return out;
  };
  md.visibleLen = (s) => s.replace(/\*\*|==|~~|`|\[\[|\]\]/g, "").replace(/\|[^\]]*(?=\]\])/g, "").length;
  const INL = /(!?\[\[[^\]]+\]\])|(\*\*[^*]+\*\*)|(==[^=]+==)|(~~[^~]+~~)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(%%.*?%%)|(\[\^[^\]]+\])|((?:^|(?<=[\s(]))#[A-Za-z][\w/-]*)|(\*[^*\s][^*]*\*)|(\$[^$]+\$)/g;
  const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  md.wikiLabel = (inner) => {
    const [target, alias] = inner.split("|");
    if (alias) return alias;
    const [path, ...sub] = target.split("#");
    const base = path.split("/").pop();
    return sub.length ? (base ? base + " › " : "") + sub.join(" › ").replace(/^\^/, "^") : base;
  };
  md.mathText = (tex) => tex.replace(/\\sum_\{([^}]*)\}\^\{([^}]*)\}/g, "Σ[$1..$2]").replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)").replace(/\\alpha/g, "α").replace(/\\beta/g, "β").replace(/\\Delta/g, "Δ").replace(/\\le/g, "≤").replace(/\\cdot/g, "·").replace(/\\times/g, "×").replace(/\^2/g, "²").replace(/_i/g, "ᵢ").replace(/[{}]/g, "");
  md.inline = (s, reveal, ctx) => {
    ctx = ctx || {};
    // trailing block id (^id): hidden when rendered, dimmed when revealed
    const bid = s.match(/\s\^[\w-]+(?=\u0000?$)/);
    if (bid && !/\u0000/.test(bid[0])) return md.inline(s.slice(0, bid.index) + s.slice(bid.index + bid[0].length), reveal, ctx) + (reveal ? `<span class="dim">${esc(bid[0])}</span>` : "");
    let out = "", last = 0;
    s.replace(INL, (m, wl, b, hl, st, code, mdl, cmt, fn, tag, it, math, off) => {
      out += esc(s.slice(last, off));
      last = off + m.length;
      const D = (x) => (reveal ? `<span class="t-marker">${esc(x)}</span>` : "");
      if (wl) {
        const emb = wl.startsWith("!");
        const inner = wl.replace(/^!?\[\[|\]\]$/g, "");
        const target = inner.split("|")[0].split("#")[0];
        const bad = ctx.unresolved && ctx.unresolved.includes(target);
        const cls = bad ? "t-wiki-bad" : "t-wiki";
        out += reveal ? `${D(emb ? "![[" : "[[")}<span class="${cls}">${esc(inner)}</span>${D("]]")}` : `<span class="${cls}">${esc(md.wikiLabel(inner))}</span>`;
      } else if (b) out += `${D("**")}<span class="t-b">${md.inline(b.slice(2, -2), reveal, ctx)}</span>${D("**")}`;
      else if (hl) out += `${D("==")}<span class="t-hl">${esc(hl.slice(2, -2))}</span>${D("==")}`;
      else if (st) out += `${D("~~")}<span class="t-s">${esc(st.slice(2, -2))}</span>${D("~~")}`;
      else if (code) out += `${D("`")}<span class="t-code">${esc(code.slice(1, -1))}</span>${D("`")}`;
      else if (mdl) { const mm = mdl.match(/^\[([^\]]+)\]\(([^)]+)\)$/); out += reveal ? `${D("[")}<span class="t-link">${esc(mm[1])}</span>${D("](" + mm[2] + ")")}` : `<span class="t-link">${esc(mm[1])}</span>`; }
      else if (cmt) out += reveal ? `<span class="t-cmt">${esc(cmt)}</span>` : "";
      else if (fn) out += reveal ? `<span class="t-marker">${esc(fn)}</span>` : `<span class="t-link" style="text-decoration:none">${fn.slice(2, -1).split("").map((c) => SUP[c] || c).join("")}</span>`;
      else if (tag) out += `<span class="t-tag">${esc(tag)}</span>`;
      else if (it) out += `${D("*")}<span class="t-i">${esc(it.slice(1, -1))}</span>${D("*")}`;
      else if (math) out += reveal ? `${D("$")}<span class="t-h5">${esc(math.slice(1, -1))}</span>${D("$")}` : `<span class="t-h5 t-i">${esc(md.mathText(math.slice(1, -1)))}</span>`;
      return m;
    });
    out += esc(s.slice(last));
    return out;
  };
  const KW = /\b(const|let|var|function|return|import|from|export|type|interface|await|async|if|else|new|for|of|in|class|extends|throw|try|catch)\b/g;
  md.code = (s) => {
    const parts = [];
    let rest = s;
    const cm = rest.indexOf("//");
    let comment = "";
    if (cm >= 0) { comment = rest.slice(cm); rest = rest.slice(0, cm); }
    let out = "", last = 0;
    rest.replace(/("[^"]*"|'[^']*'|`[^`]*`)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)(?=\()|\b(const|let|var|function|return|import|from|export|type|interface|await|async|if|else|new|for|of|in|class|extends|throw|try|catch)\b|\b([A-Z]\w*)\b/g, (m, str, num, fn, kw, ty, off) => {
      out += esc(rest.slice(last, off)); last = off + m.length;
      out += str ? `<span class="t-str">${esc(str)}</span>` : num ? `<span class="t-num">${esc(num)}</span>` : kw ? `<span class="t-kw">${esc(kw)}</span>` : fn ? `<span class="t-fn">${esc(fn)}</span>` : `<span class="t-type">${esc(ty)}</span>`;
      return m;
    });
    out += esc(rest.slice(last));
    return out + (comment ? `<span class="t-cmt">${esc(comment)}</span>` : "");
  };
  // non-Markdown text files (shared R2, RM261003ABZP-DES17@R1): one "src" line per row, coloured by the language's highlighter or plain
  md.parseFile = (text, lang) => text.replace(/^\n/, "").split("\n").map((raw) => ({ raw, kind: "src", lang: lang || "plain", block: null }));
  md.yaml = (s) => {
    const cm = s.match(/^(\s*)(#.*)$/);
    if (cm) return esc(cm[1]) + `<span class="t-cmt">${esc(cm[2])}</span>`;
    const m = s.match(/^(\s*(?:- )?)([\w.-]+)(:)(.*)$/);
    if (!m) return esc(s);
    const v = m[4];
    const val = /^\s*(["'].*["'])\s*$/.test(v) ? `<span class="t-str">${esc(v)}</span>` : /^\s*(\d+(?:\.\d+)?|true|false)\s*$/.test(v) ? `<span class="t-num">${esc(v)}</span>` : esc(v);
    return `${esc(m[1])}<span class="t-h4">${esc(m[2])}</span><span class="t-marker">${m[3]}</span>${val}`;
  };
  const HIGHLIGHT = { typescript: (r) => md.code(r), yaml: (r) => md.yaml(r) };
  // source (revealed) html for one line
  md.source = (line, ctx) => {
    if (line.kind === "src") return (HIGHLIGHT[line.lang] || esc)(line.raw);
    // a cursor sentinel at column 0 would defeat the anchored marker patterns below
    if (line.raw.charAt(0) === "\u0000") return "\u0000" + md.source(Object.assign({}, line, { raw: line.raw.slice(1) }), ctx);
    const r = line.raw, k = line.kind;
    if (k === "code" ) return `<span class="codebg">${md.code(r)}</span>`;
    if (k === "code-open" || k === "code-close" || k === "mermaid-open" || k === "mermaid-close") return `<span class="t-marker">${esc(r)}</span>`;
    if (k === "mermaid") return `<span class="t-fn">${esc(r)}</span>`;
    if (k.startsWith("math")) return k === "math" ? `<span class="t-h5">${esc(r)}</span>` : `<span class="t-marker">${esc(r)}</span>`;
    if (k === "fm-open" || k === "fm-close") return `<span class="t-marker">${esc(r)}</span>`;
    if (k === "fm") { const m = r.match(/^([\w-]+):(.*)$/); return m ? `<span class="t-h4">${esc(m[1])}</span><span class="t-marker">:</span>${esc(m[2])}` : esc(r); }
    if (k === "table") return r.split("|").map((c, i) => (i === 0 ? "" : md.inline(c, true, ctx))).join('<span class="t-marker">|</span>').replace(/^/, '<span class="t-marker">|</span>').replace(/<span class="t-marker">\|<\/span>$/, "") + (r.endsWith("|") ? '<span class="t-marker">|</span>' : "");
    if (k === "callout-open") { const m = r.match(/^(> )(\[!\w+\][-+]?)(.*)$/); if (!m) return `<span class="c-${line.ctype}">${esc(r)}</span>`; return `<span class="t-marker">${esc(m[1])}</span><span class="c-${line.ctype}">${esc(m[2])}</span>${md.inline(m[3], true, ctx)}`; }
    if (k === "callout" || k === "quote") return `<span class="t-marker">${esc(r.slice(0, 2))}</span>${md.inline(r.slice(2), true, ctx)}`;
    const h = r.match(/^(#{1,6} )(.*)$/);
    if (h) return `<span class="t-marker">${esc(h[1])}</span><span class="t-h${h[1].length - 1}">${md.inline(h[2], true, ctx)}</span>`;
    const li = r.match(/^(\s*)(- \[[ x]\] |[-*] |\d+\. )(.*)$/);
    if (li) return `${esc(li[1])}<span class="t-h2">${esc(li[2])}</span>${md.inline(li[3], true, ctx)}`;
    return md.inline(r, true, ctx);
  };
  // live rows for one line: array of {h, cls, tall}
  md.live = (line, ctx, doc) => {
    const r = line.raw, k = line.kind, W = ctx.width || 80;
    const row = (h, cls, tall) => ({ h, cls, tall });
    if (k === "src") return [row(md.source(line, ctx))];
    if (k === "fm-open") return [row(`<span class="dim">▾ </span><span class="muted">Properties</span>`)];
    if (k === "fm") {
      const m = r.match(/^([\w-]+):\s*(.*)$/);
      if (!m) return [row(esc(r))];
      let v = m[2];
      let vh;
      if (/^\[.*\]$/.test(v)) vh = v.slice(1, -1).split(",").map((x) => x.trim()).filter(Boolean).map((x) => (m[1] === "tags" ? `<span class="t-tag">#${esc(x)}</span>` : /^"?\[\[/.test(x) ? `<span class="t-wiki">${esc(md.wikiLabel(x.replace(/^"?\[\[|\]\]"?$/g, "")))}</span>` : esc(x))).join("  ");
      else if (/^"?\[\[/.test(v)) vh = `<span class="t-wiki">${esc(md.wikiLabel(v.replace(/^"?\[\[|\]\]"?$/g, "")))}</span>`;
      else if (v === "true" || v === "false") vh = v === "true" ? "☑" : "☐";
      else vh = esc(v.replace(/^"|"$/g, ""));
      return [row(`  <span class="muted">${esc(Mock.pad(m[1], 12))}</span>${vh}`)];
    }
    if (k === "fm-close") return [row(`<span class="dim">${"─".repeat(Math.min(48, W - 2))}</span>`)];
    if (k === "code-open") return [row(`<span class="codebg dim">${esc(Mock.pad("  " + (line.lang || "text"), W))}</span>`)];
    if (k === "code") return [row(`<span class="codebg">  ${md.code(r)}${" ".repeat(Math.max(0, W - r.length - 2))}</span>`)];
    if (k === "code-close") return [row(`<span class="codebg">${" ".repeat(W)}</span>`)];
    if (k === "mermaid-open") return (ctx.mermaidArt || md.defaultMermaid).map((a) => row(`<span class="t-fn">${esc(a)}</span>`)).concat([row(`<span class="dim">  mermaid · text approximation · ⏎ to zoom</span>`)]);
    if (k === "mermaid" || k === "mermaid-close") return [];
    if (k === "math-open") { const body = doc.filter((x) => x.block === line.block && x.kind === "math").map((x) => x.raw).join(" "); return [row(""), row(`<span class="t-h5 t-i">        ${esc(md.mathText(body))}</span>`), row("")]; }
    if (k === "math" || k === "math-close") return [];
    if (k === "table") {
      const { cells, widths, align, ti } = line;
      const fmt = (c, i) => { const vis = md.visibleLen(c); const pad = widths[i] - vis; const a = align[i] || "l"; const L = a === "r" ? pad : a === "c" ? Math.floor(pad / 2) : 0; return " ".repeat(L) + md.inline(c, false, ctx) + " ".repeat(pad - L); };
      if (ti === 1) return [row(`<span class="dim">├${widths.map((w) => "─".repeat(w + 2)).join("┼")}┤</span>`)];
      const inner = cells.map((c, i) => " " + (ti === 0 ? `<span class="t-b">${fmt(c, i)}</span>` : fmt(c, i)) + " ").join('<span class="dim">│</span>');
      const rows = [];
      if (ti === 0) rows.push(row(`<span class="dim">┌${widths.map((w) => "─".repeat(w + 2)).join("┬")}┐</span>`));
      rows.push(row(`<span class="dim">│</span>${inner}<span class="dim">│</span>`));
      if (ti === line.tlen - 1) rows.push(row(`<span class="dim">└${widths.map((w) => "─".repeat(w + 2)).join("┴")}┘</span>`));
      return rows;
    }
    if (k === "callout-open") {
      const icon = { note: "●", info: "●", tip: "★", warning: "▲", danger: "✗", todo: "☐", quote: "❝" }[line.ctype] || "●";
      const cname = line.ctype.charAt(0).toUpperCase() + line.ctype.slice(1);
      const folded = line.fold === "-" && !(ctx.unfold && ctx.unfold.includes(line.block));
      const cls = `c-${["note", "tip", "warning", "danger"].includes(line.ctype) ? line.ctype : "note"}`;
      return [row(`<span class="${cls}">▎ ${icon} <span class="t-b ${cls}">${esc(line.title || cname)}</span></span> <span class="dim">${line.fold ? (folded ? "▸ folded" : "▾") : ""}</span>`)];
    }
    if (k === "callout") {
      const folded = line.fold === "-" && !(ctx.unfold && ctx.unfold.includes(line.block));
      if (folded) return [];
      const cls = `c-${["note", "tip", "warning", "danger"].includes(line.ctype) ? line.ctype : "note"}`;
      return [row(`<span class="${cls}">▎</span> ${md.inline(r.replace(/^>\s?/, ""), false, ctx)}`)];
    }
    if (k === "quote") return [row(`<span class="t-quote">▎ ${md.inline(r.slice(2), false, ctx)}</span>`)];
    // paragraph-level
    if (r.trim() === "") return [row("")];
    if (/^%%.*%%$/.test(r.trim())) return [];
    if (/^---+$/.test(r)) return [row(`<span class="dim">${"─".repeat(W - 1)}</span>`)];
    const h = r.match(/^(#{1,6}) (.*)$/);
    if (h) { const n = h[1].length; const pre = n === 1 ? "█ " : n === 2 ? "▊ " : n === 3 ? "▌ " : "▏ "; return [row(`<span class="t-h${n}">${pre}${md.inline(h[2], false, ctx)}</span>`, n <= 3 ? `band-h${n}` : "")]; }
    const task = r.match(/^(\s*)- \[( |x)\] (.*)$/);
    if (task) return [row(`${esc(task[1])}${task[2] === "x" ? '<span class="t-ok">☑</span> <span class="t-s">' + md.inline(task[3], false, ctx) + "</span>" : '<span class="t-h2">☐</span> ' + md.inline(task[3], false, ctx)}`)];
    const li = r.match(/^(\s*)[-*] (.*)$/);
    if (li) { const d = Math.floor(li[1].length / 2); return [row(`${esc(li[1])}<span class="t-h2">${["•", "◦", "▪"][d % 3]}</span> ${md.inline(li[2], false, ctx)}`)]; }
    const ol = r.match(/^(\s*)(\d+)\. (.*)$/);
    if (ol) return [row(`${esc(ol[1])}<span class="t-h2">${ol[2]}.</span> ${md.inline(ol[3], false, ctx)}`)];
    const fd = r.match(/^\[\^(\w+)\]: (.*)$/);
    if (fd) return [row(`<span class="dim">${fd[1].split("").map((c) => SUP[c] || c).join("")} </span><span class="muted">${md.inline(fd[2], false, ctx)}</span>`)];
    const img = r.match(/^!\[\[([^\]|]+\.(png|jpg|jpeg|gif|svg|webp))(\|\d+)?\]\]$/i);
    if (img) return md.imageRows(img[1], ctx);
    const emb = r.match(/^!\[\[([^\]]+)\]\]$/);
    if (emb) return md.embedRows(emb[1], ctx);
    return [row(md.inline(r, false, ctx))];
  };
  md.defaultMermaid = [
    "  ┌─────────┐     ┌────────┐     ┌────────┐     ┌──────┐",
    "  │ Capture │ ──▶ │ Triage │ ──▶ │  Plan  │ ──▶ │ Ship │",
    "  └─────────┘     └───┬────┘     └────────┘     └──────┘",
    "                      │ someday",
    "                      ▼",
    "                 ┌─────────┐",
    "                 │ Archive │",
    "                 └─────────┘",
  ];
  md.embedRows = (target, ctx) => {
    const e = (ctx.embeds || {})[target] || { lines: ["(embedded note)"], more: 0 };
    // e.html: pre-rendered rows (e.g. an embedded Bases view); e.lines: Markdown lines
    const max = e.html ? e.html.length : ctx.embedMaxRows || 4;
    const body = e.html || e.lines.map((l) => md.inline(l, false, ctx));
    const rows = [{ h: `<span class="dim">╭ </span><span class="t-wiki">↳ ${esc(md.wikiLabel(target))}</span><span class="dim"> · ${esc(e.label || "embed")}</span>` }];
    body.slice(0, max).forEach((h) => rows.push({ h: `<span class="dim">│</span> ${h}` }));
    const more = body.length - max + (e.more || 0);
    rows.push({ h: `<span class="dim">╰ ${e.foot ? esc(e.foot) : more > 0 ? `… ${more} more lines · ⏎ open · za expand` : "end of embed"}</span>` });
    return rows;
  };
  // images: kitty/sixel = real picture, blocks = unicode half blocks, off = placeholder
  md.imageRows = (name, ctx) => {
    const tier = ctx.imageTier || "kitty";
    const Wc = 46, Hc = 10;
    if (tier === "off") return [{ h: `<span class="dim">[image: ${esc(name)}]</span>` }];
    if (tier === "kitty" || tier === "sixel") {
      return [{ h: `<span style="display:inline-block;width:${Wc}ch;height:calc(${Hc}*var(--lh));vertical-align:top;background:center/contain no-repeat url('${md.diagramSvg()}');border-radius:2px"></span>`, tall: Hc }, { h: `<span class="dim">  ${esc(name)} · 1280×720 · ${tier} graphics · ⏎ zoom</span>` }];
    }
    return md.blockArt(Wc, Hc).map((h) => ({ h })).concat([{ h: `<span class="dim">  ${esc(name)} · unicode blocks (Terminal.app / tmux) · ⏎ zoom</span>` }]);
  };
  md.diagramSvg = () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 180'><rect width='460' height='180' rx='8' fill='#f4f1ea'/><g font-family='Helvetica,Arial' font-size='13' text-anchor='middle'><rect x='18' y='62' width='110' height='52' rx='8' fill='#7aa2f7'/><text x='73' y='93' fill='#fff'>Input</text><rect x='176' y='62' width='110' height='52' rx='8' fill='#9ece6a'/><text x='231' y='93' fill='#1a1b26'>Core (pure)</text><rect x='334' y='22' width='108' height='44' rx='8' fill='#bb9af7'/><text x='388' y='49' fill='#fff'>Terminal</text><rect x='334' y='112' width='108' height='44' rx='8' fill='#e0af68'/><text x='388' y='139' fill='#1a1b26'>Preview</text></g><g stroke='#565f89' stroke-width='2.5' fill='none'><path d='M128 88h42'/><path d='M286 80l44-30'/><path d='M286 98l44 32'/></g><text x='230' y='168' text-anchor='middle' font-family='Helvetica' font-size='11' fill='#565f89'>one-way data flow</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  };
  md.blockArt = (W, H) => {
    // tiny rasterizer: 2 vertical pixels per cell using ▀ (fg = top, bg = bottom)
    const PW = W, PH = H * 2;
    const C = { bg: "#f4f1ea", a: "#7aa2f7", b: "#9ece6a", c: "#bb9af7", d: "#e0af68", l: "#565f89" };
    const g = Array.from({ length: PH }, () => Array(PW).fill(C.bg));
    const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i < PW) g[j][i] = c; };
    rect(1, 7, 11, 6, C.a); rect(17, 7, 11, 6, C.b); rect(33, 2, 11, 5, C.c); rect(33, 13, 11, 5, C.d);
    rect(12, 10, 5, 1, C.l); rect(28, 8, 3, 1, C.l); rect(30, 5, 1, 4, C.l); rect(31, 5, 2, 1, C.l); rect(28, 12, 3, 1, C.l); rect(30, 12, 1, 4, C.l); rect(31, 15, 2, 1, C.l);
    const rows = [];
    for (let y = 0; y < PH; y += 2) {
      let s = "";
      for (let x = 0; x < PW; x++) s += `<span style="color:${g[y][x]};background:${g[y + 1][x]}">▀</span>`;
      rows.push(s);
    }
    return rows;
  };

  // editor window: returns html rows; st: {cur:{l,c}, view, vim, vstart, top, height, width, focused, numbers}
  md.editor = (doc, st, ctx) => {
    ctx = Object.assign({ width: st.width - 6 }, ctx);
    const cl = Mock.clamp(st.cur.l, 0, doc.length - 1);
    const curBlock = doc[cl] && doc[cl].block;
    const vis = st.vim === "visual" || st.vim === "vline";
    const vA = vis ? Math.min(st.vstart.l, cl) : -1, vB = vis ? Math.max(st.vstart.l, cl) : -1;
    const blockish = (k) => /^(fm|code|mermaid|math|table|callout)/.test(k);
    const revealed = (i) => {
      if (st.view === "source") return true;
      if (st.view === "reading") return false;
      if (i === cl) return true;
      if (vis && i >= vA && i <= vB) return true;
      const ln = doc[i];
      if (ln.block && blockish(ln.kind) && (ln.block === curBlock && blockish(doc[cl].kind))) return true;
      if (vis && ln.block && blockish(ln.kind)) { for (let j = vA; j <= vB; j++) if (doc[j].block === ln.block) return true; }
      return false;
    };
    const rowsOf = (i) => {
      const ln = doc[i];
      if (revealed(i)) {
        let html;
        if (i === cl && st.focused !== false && !vis && st.view !== "reading") {
          const raw = ln.raw;
          const c = Mock.clamp(st.cur.c, 0, raw.length);
          const withS = Object.assign({}, ln, { raw: raw.slice(0, c) + "\u0000" + raw.slice(c) });
          html = md.source(withS, ctx);
          const cc = st.vim === "insert" ? "cur-bar" : "cur";
          if (/\u0000((?:<[^>]+>)*)(&[a-z]+;|[^<])/.test(html)) html = html.replace(/\u0000((?:<[^>]+>)*)(&[a-z]+;|[^<])/, `$1<span class="${cc}">$2</span>`);
          else html = html.replace("\u0000", `<span class="${cc}"> </span>`);
        } else if (vis && i >= vA && i <= vB) {
          if (st.vim === "vline") html = `<span class="sel">${md.source(ln, ctx) || " "}</span>`;
          else {
            const a = i === vA ? (st.vstart.l === vA ? st.vstart.c : st.cur.c) : 0;
            const bRaw = i === vB ? (st.vstart.l === vB && vA !== vB ? st.vstart.c : st.vstart.l === vB && vA === vB ? Math.max(st.vstart.c, st.cur.c) : st.cur.c) : ln.raw.length - 1;
            const a2 = vA === vB ? Math.min(st.vstart.c, st.cur.c) : a;
            const b2 = Math.min(ln.raw.length, (vA === vB ? Math.max(st.vstart.c, st.cur.c) : bRaw) + 1);
            html = md.inline(ln.raw.slice(0, a2), true, ctx) + `<span class="sel">${esc(ln.raw.slice(a2, b2)) || " "}</span>` + md.inline(ln.raw.slice(b2), true, ctx);
          }
        } else html = md.source(ln, ctx);
        return [{ h: html, src: true }];
      }
      return md.live(ln, ctx, doc);
    };
    // scroll so cursor is visible
    let top = Mock.clamp(st.top || 0, 0, doc.length - 1);
    if (cl < top) top = cl;
    const fits = (t) => { let used = 0; for (let i = t; i <= cl; i++) { const rs = rowsOf(i); for (const r of rs) used += r.tall || 1; } return used <= st.height; };
    let guard = 0;
    while (!fits(top) && top < cl && guard++ < 500) top++;
    st.top = top;
    const out = [];
    let used = 0;
    for (let i = top; i < doc.length && used < st.height; i++) {
      const rs = rowsOf(i);
      rs.forEach((r, ri) => {
        if (used >= st.height) return;
        const isCur = i === cl;
        if (isCur && ri === 0) st.curRow = used; // screen row of the cursor, for popups anchored to it
        const num = st.numbers === false ? "" : ri > 0 ? "     " : isCur ? Mock.padL(i + 1, 4) + " " : Mock.padL(Math.abs(i - cl), 4) + " ";
        const sign = ri === 0 && r.src && st.view === "live" && !isCur ? '<span class="reveal-mark">▕</span>' : ri === 0 && r.src && st.view === "live" && isCur ? '<span class="reveal-mark">▕</span>' : " ";
        // git column: its own leftmost cell, before the line number, present only inside a repository (st.signs !== null)
        const gs = ri === 0 && st.signs ? st.signs[i] : null;
        const gitCol = st.signs ? `<span class="git-col">${gs ? Mock.gitSign(gs) : " "}</span>` : "";
        const tall = r.tall ? ` style="height:calc(${r.tall}*var(--lh))"` : "";
        out.push(`<div class="ln${isCur && st.focused !== false ? " cursorline" : ""}${r.cls ? " " + r.cls : ""}"${tall}>${gitCol}<span class="gutter">${num}</span>${st.view === "live" ? sign : ""}${r.h}</div>`);
        used += r.tall || 1;
      });
    }
    while (used < st.height) { out.push(`<div class="ln">${st.signs ? '<span class="git-col"> </span>' : ""}<span class="dim">${st.numbers === false ? "" : "     "}~</span></div>`); used++; }
    return out.join("");
  };
  // cursor helpers for mockups
  md.move = (doc, st, k) => {
    const L = doc.length;
    const cur = st.cur;
    const lineLen = (l) => doc[l].raw.length;
    if (k === "j" || k === "<Down>") cur.l = Mock.clamp(cur.l + 1, 0, L - 1);
    else if (k === "k" || k === "<Up>") cur.l = Mock.clamp(cur.l - 1, 0, L - 1);
    else if (k === "h" || k === "<Left>") cur.c = Math.max(0, cur.c - 1);
    else if (k === "l" || k === "<Right>") cur.c = Math.min(Math.max(0, lineLen(cur.l) - 1), cur.c + 1);
    else if (k === "0") cur.c = 0;
    else if (k === "$") cur.c = Math.max(0, lineLen(cur.l) - 1);
    else if (k === "G") cur.l = L - 1;
    else if (k === "<C-d>") cur.l = Mock.clamp(cur.l + 10, 0, L - 1);
    else if (k === "<C-u>") cur.l = Mock.clamp(cur.l - 10, 0, L - 1);
    else if (k === "w") { const r = doc[cur.l].raw; const m = r.slice(cur.c + 1).search(/(?<=\s)\S|(?<=\w)(?=[^\w\s])|(?<=[^\w\s])(?=\w)/); if (m >= 0) cur.c = cur.c + 1 + m; else if (cur.l < L - 1) { cur.l++; cur.c = 0; } }
    else if (k === "b") { const r = doc[cur.l].raw.slice(0, cur.c); const m = r.search(/\S+\s*$/); cur.c = m >= 0 ? m : 0; }
    else if (k === "}") { let l = cur.l + 1; while (l < L - 1 && doc[l].raw.trim() !== "") l++; cur.l = l; }
    else if (k === "{") { let l = cur.l - 1; while (l > 0 && doc[l].raw.trim() !== "") l--; cur.l = Math.max(0, l); }
    else return false;
    if (cur.c > Math.max(0, lineLen(cur.l) - 1) && !["0"].includes(k)) cur.c = Math.max(0, Math.min(cur.c, lineLen(cur.l) - 1));
    return true;
  };
})();
