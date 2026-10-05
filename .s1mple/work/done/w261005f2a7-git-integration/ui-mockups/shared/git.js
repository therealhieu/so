/* so mockups — Git display helpers and sample repository (W261005F2A7 shared R3). Mockup data only.
 * Renders the hooks added to term.js: st.signs (gutter), o.git (statusline), r.git (explorer). */
(function () {
  "use strict";
  const M = window.Mock;
  const esc = M.esc;
  const G = (M.git = {});

  /* ---------- gutter signs: a dedicated leftmost column before the line number; ▕ / ⚠ keep their own cell next to the text ---------- */
  // one distinct glyph per kind, so meaning survives NO_COLOR
  G.SIGNS = { add: "+", change: "~", delete: "_", topdelete: "‾", changedelete: "≃", untracked: "┆" };
  G.KIND_LABEL = { add: "added", change: "changed", delete: "deleted below", topdelete: "deleted at top", changedelete: "changed + deleted", untracked: "untracked" };
  M.gitSign = (kind) => `<span class="gs-${kind}" title="${G.KIND_LABEL[kind]}">${esc(G.SIGNS[kind])}</span>`;

  /* ---------- statusline segment: ⎇ ref [op] +a ~c -r (counts for the active file, zeros hidden) ---------- */
  M.gitSegment = (g) => {
    const c = [];
    if (g.added) c.push(`<span class="gca">+${g.added}</span>`);
    if (g.changed) c.push(`<span class="gcc">~${g.changed}</span>`);
    if (g.removed) c.push(`<span class="gcr">-${g.removed}</span>`);
    return `<span class="seg-s gseg"><span class="gref">⎇ ${esc(g.ref)}</span>${g.op ? ` <span class="gop">${esc(g.op)}</span>` : ""}${c.length ? " " + c.join(" ") : ""}</span>`;
  };

  /* ---------- explorer markers: one cell, precedence conflict > untracked > modified > staged; deleted files have no row and only mark ancestors with • ---------- */
  G.MARKERS = { conflict: "U", untracked: "?", modified: "M", staged: "S", contains: "•" };
  M.gitMarker = (r) => ` <span class="gm-${r.git}" title="${r.git}">${G.MARKERS[r.git]}</span>`;

  /* ---------- diff model: base (index) text + edits → buffer lines, hunks, signs, counts ---------- */
  // edit: { at: "line prefix in base" | 0 (file start), del: n, add: [lines], staged?, id }
  G.build = (base, edits) => {
    const idx = base.split("\n");
    const buf = [], hunks = [];
    let i = 0;
    const ordered = edits.map((e) => Object.assign({}, e, { pos: e.at === 0 ? 0 : idx.findIndex((l) => l.startsWith(e.at)) + (e.after ? 1 : 0) }))
      .filter((e) => e.pos >= 0).sort((a, b) => a.pos - b.pos);
    for (const e of ordered) {
      while (i < e.pos) buf.push(idx[i++]);
      const old = idx.slice(i, i + (e.del || 0));
      const add = e.add || [];
      const start = buf.length;
      add.forEach((l) => buf.push(l));
      i += e.del || 0;
      if (e.staged) continue;
      const kind = !old.length ? "add" : !add.length ? (start === 0 ? "topdelete" : "delete") : "change";
      hunks.push({ id: e.id, kind, start, len: add.length, old, add, indexLine: e.pos + 1 });
    }
    while (i < idx.length) buf.push(idx[i++]);
    const signs = {};
    let added = 0, changed = 0, removed = 0;
    for (const h of hunks) {
      if (h.kind === "add") { for (let k = 0; k < h.len; k++) signs[h.start + k] = "add"; added += h.len; }
      else if (h.kind === "delete") { signs[h.start - 1] = "delete"; removed += h.old.length; h.anchor = h.start - 1; }
      else if (h.kind === "topdelete") { signs[0] = "topdelete"; removed += h.old.length; h.anchor = 0; }
      else {
        const r = h.old.length, a = h.len;
        for (let k = 0; k < a; k++) signs[h.start + k] = k >= r ? "add" : r > a && k === a - 1 ? "changedelete" : "change";
        changed += Math.min(a, r); added += Math.max(0, a - r); removed += Math.max(0, r - a);
        if (r > a) h.kind = "changedelete";
      }
      h.first = h.anchor != null ? h.anchor : h.start;
    }
    return { text: buf.join("\n"), lines: buf, hunks, signs, counts: { added, changed, removed } };
  };
  G.untracked = (text) => { const signs = {}; text.split("\n").forEach((_, i) => (signs[i] = "untracked")); return signs; };
  G.hunkAt = (d, line) => d.hunks.find((h) => line >= h.first && line < Math.max(h.first + 1, h.start + h.len));
  G.nextHunk = (d, line) => d.hunks.map((h) => h.first).filter((l) => l > line).sort((a, b) => a - b)[0];
  G.prevHunk = (d, line) => d.hunks.map((h) => h.first).filter((l) => l < line).sort((a, b) => b - a)[0];

  /* ---------- hunk preview float (DES11): index lines removed, buffer lines added; Esc / q / click outside close ---------- */
  G.hunkFloat = (app, d, h, o) => {
    o = o || {};
    const w = Math.min(o.w || 64, app.cols - 4);
    const maxBody = o.maxLines || 12;
    const n = d.hunks.indexOf(h) + 1;
    const range = h.len > 1 ? `lines ${h.start + 1}–${h.start + h.len}` : h.len ? `line ${h.start + 1}` : `after line ${h.first + 1}`;
    const body = [];
    body.push(`<div class="ln hk-head"> ${G.SIGNS[h.kind]} ${esc(G.KIND_LABEL[h.kind])} · ${range} · hunk ${n}/${d.hunks.length}</div>`);
    const diff = h.old.map((l) => ["del", l]).concat(h.add.map((l) => ["add", l]));
    const shown = diff.slice(0, maxBody);
    for (const [k, l] of shown) body.push(`<div class="ln hk-${k}">${k === "del" ? "-" : "+"} ${esc(M.pad(l, w - 4))}</div>`);
    if (diff.length > shown.length) body.push(`<div class="ln dim">  … ${diff.length - shown.length} more lines (${h.old.length} removed, ${h.add.length} added)</div>`);
    body.push(`<div class="ln ffoot"> esc / q close</div>`);
    const hgt = body.length + 2;
    // below the cursor line when it fits, otherwise above it, never covering it
    const cy = o.cursorY != null ? o.cursorY : 2;
    const y = cy + 1 + hgt <= app.rows - 2 ? cy + 1 : Math.max(1, cy - hgt);
    return M.ui.float({ x: o.x != null ? o.x : 8, y, w, h: hgt, title: " hunk preview ", body: body.join("") });
  };

  /* ---------- message-line notices (one row) ---------- */
  G.msg = {
    blame: (who, when, summary, sha) => `<span class="dim">${esc(who)}, ${esc(when)} · </span>${esc(summary)} <span class="dim">(${esc(sha)})</span>`,
    notCommitted: () => `<span class="dim">not committed yet</span>`,
    info: (t) => `<span class="dim">${esc(t)}</span>`,
    err: (t) => `<span class="t-err">${esc(t)}</span>`,
    warn: (t) => `<span class="t-warn">${esc(t)}</span>`,
  };

  /* ---------- which-key groups: <leader>g = git, <leader>gh = hunk ---------- */
  G.leader = (run) => ({
    g: { label: "git", items: {
      g: { label: "Lazygit (full screen)", run: run.tool },
      h: { label: "hunk", items: {
        s: { label: "Stage hunk", run: run.stage },
        r: { label: "Reset hunk", run: run.reset },
        p: { label: "Preview hunk", run: run.preview },
        b: { label: "Blame line", run: run.blame },
      } },
    } },
  });

  /* ---------- sample repository: so-roadmap.md edited against the index ---------- */
  G.roadmapEdits = () => [
    { id: "h1", at: "status: active", del: 1, add: ["status: shipping"] },
    { id: "h2", at: "- [x] Pick the renderer", after: true, del: 0, add: ["- [ ] Git signs in the gutter", "- [ ] Hand off to lazygit with <leader>gg"] },
    { id: "h3", at: "Talked to [[people/linh|Linh]]", del: 3, add: ["Talked to [[people/linh|Linh]] about *block reveal* — tables show pipes inside."] },
    { id: "h4", at: "- 10-02 boundary test green", del: 1, add: [] },
  ];
  // long hunk for the size-limit state
  G.longEdits = () => [{ id: "h1", at: "## Log", del: 0, after: true, add: Array.from({ length: 22 }, (_, k) => `- 10-${String(4 + k).padStart(2, "0")} ${["git status parser", "index read", "hunk diff", "sign provider", "stage patch", "blame parse", "watcher", "suspend/resume"][k % 8]} ${k % 3 === 0 ? "done" : "in progress"}`) }];

  G.inboxBase = `# Inbox\n\n- [ ] Call the bank about the card\n- [ ] Buy milk\n- [ ] Reply to Linh about sensors`;
  G.inboxEdits = () => [{ id: "t1", at: 0, del: 2, add: [] }];
  G.linh = `# Linh\n\n<<<<<<< HEAD\nSensors: capacitive, read every 10 min.\n=======\nSensors: resistive, read hourly.\n>>>>>>> feat/garden\n\nSee [[garden-app]].`;
  G.ideas = `# Ideas\n\n- Terminal Kanban for tasks.base\n- Weekly review template\n- Sync attachments with rsync`;

  // explorer tree with git markers; it lists disk entries only, so a deleted file has no row and its folders show •
  G.tree = (o) => {
    o = o || {};
    const rm = o.roadmap || "modified";
    return [
      { depth: 0, kind: "dir", name: "daily", open: true, path: "daily", git: "contains" },
      { depth: 1, kind: "md", name: "2026-10-01.md", path: "daily/2026-10-01.md" },
      { depth: 1, kind: "md", name: "2026-10-02.md", path: "daily/2026-10-02.md", git: "staged" },
      { depth: 0, kind: "dir", name: "projects", open: true, path: "projects", git: rm ? "contains" : undefined },
      { depth: 1, kind: "md", name: "so-roadmap.md", path: "projects/so-roadmap.md", git: rm || undefined },
      { depth: 1, kind: "md", name: "garden-app.md", path: "projects/garden-app.md" },
      { depth: 1, kind: "dir", name: "ideas", open: o.ideasOpen !== false, path: "projects/ideas", git: "contains" },
    ].concat(o.ideasOpen !== false ? [
      { depth: 2, kind: "md", name: "ideas.md", path: "projects/ideas/ideas.md", git: "untracked" },
      { depth: 2, kind: "md", name: "kanban.md", path: "projects/ideas/kanban.md", git: "untracked" },
    ] : []).concat([
      { depth: 0, kind: "dir", name: "people", open: true, path: "people", git: "contains" },
      { depth: 1, kind: "md", name: "linh.md", path: "people/linh.md", git: "conflict" },
      { depth: 0, kind: "dir", name: "templates", open: false, path: "templates" },
      { depth: 0, kind: "base", name: "tasks.base", path: "tasks.base" },
      { depth: 0, kind: "md", name: "inbox.md", path: "inbox.md", git: "modified" },
      { depth: 0, kind: "md", name: "index.md", path: "index.md" },
    ]).map((r) => (r.git ? r : Object.assign(r, { git: undefined })));
  };

  /* ---------- lazygit stand-in (a separate program owns the screen while so is suspended) ---------- */
  G.lazygit = (app) => {
    const W = app.cols, H = app.rows;
    const lw = Math.floor(W * 0.38), rw = W - lw - 1;
    const box = (title, w, lines, h, active) => {
      const top = `${active ? '<span class="lg-active">' : ""}╭─${esc(title)}${"─".repeat(Math.max(0, w - title.length - 3))}╮${active ? "</span>" : ""}`;
      const body = Array.from({ length: h - 2 }, (_, k) => `│${lines[k] != null ? lines[k] : " ".repeat(w - 2)}│`);
      return [top].concat(body, [`╰${"─".repeat(w - 2)}╯`]);
    };
    const p = (s, w) => esc(M.pad(s, w - 2));
    const hs = [3, 6, 6, Math.max(4, H - 1 - 3 - 6 - 6)];
    const left = [].concat(
      box("[1] Status", lw, [p(" so → main ✓", lw)], hs[0]),
      box("[2] Files", lw, [p(" M  projects/so-roadmap.md", lw), p(" M  inbox.md", lw), p("M   daily/2026-10-02.md", lw), p(" D  daily/2026-10-03.md", lw)], hs[1], true),
      box("[3] Branches", lw, [p(" * main", lw), p("   feat/kanban", lw)], hs[2]),
      box("[4] Commits", lw, [p(" 3f2a9c1 vim motions done", lw), p(" 8d01e4b boundary test", lw)], hs[3])
    );
    const diff = [" diff --git a/projects/so-roadmap.md", " -status: active", " +status: shipping", " ", " +- [ ] Git signs in the gutter"];
    const right = box("Unstaged changes", rw, diff.map((l) => p(l, rw)), H - 1);
    const rows = [];
    for (let r = 0; r < H - 1; r++) rows.push(`<div class="ln lg-box">${left[r] || ""} ${right[r] || ""}</div>`);
    rows.push(`<div class="ln dim"> lazygit · not part of so — q quits and returns to so</div>`);
    return rows.join("");
  };

  /* ---------- shared interactive workspace: editor + explorer + statusline with git ---------- */
  const C = () => M.content;
  G.FILES = () => ({
    "projects/so-roadmap.md": { base: C().roadmap, edits: G.roadmapEdits, backlinks: 7 },
    "inbox.md": { base: G.inboxBase, edits: G.inboxEdits },
    "projects/ideas/ideas.md": { text: G.ideas, untracked: true },
    "people/linh.md": { text: G.linh, conflict: true },
  });
  const BLAME = { who: "hieu", when: "2 days ago", summary: "plan the git integration", sha: "3f2a9c1" };

  G.init = () => {
    const files = G.FILES();
    const edits = {};
    for (const [p, f] of Object.entries(files)) if (f.edits) edits[p] = f.edits();
    return {
      path: "projects/so-roadmap.md", edits, explorer: true, treeSel: 5, treeFocus: false,
      win: { st: { cur: { l: 14, c: 2 }, view: "live", vim: "normal", top: 0 } },
      repo: { ref: "main" }, msg: "", float: null, pending: null, screen: "so", dirty: false,
    };
  };
  G.fileDiff = (app, path) => {
    const f = G.FILES()[path];
    if (!f) return null;
    if (f.conflict) return { text: f.text, signs: {}, hunks: [], counts: {} };
    if (f.untracked) return { text: f.text, signs: G.untracked(f.text), hunks: [], counts: {}, untracked: true };
    return G.build(f.base, (app.edits[path] || []).filter((e) => !e.reset));
  };
  G.markerFor = (app, path) => {
    const f = G.FILES()[path];
    if (!f || f.untracked || f.conflict) return null;
    const d = G.fileDiff(app, path);
    if (d.hunks.length) return "modified";
    return (app.edits[path] || []).some((e) => e.staged && !e.reset) ? "staged" : null;
  };
  G.sync = (app) => {
    const d = G.fileDiff(app, app.path);
    app.d = d;
    app.win.doc = M.md.parse(d.text);
    app.win.st.signs = app.repo ? d.signs : null;
    app.win.st.cur.l = M.clamp(app.win.st.cur.l, 0, app.win.doc.length - 1);
  };
  G.open = (app, path) => {
    if (!G.FILES()[path]) { app.msg = G.msg.info(`"${path}" is not in this mockup`); return; }
    app.path = path; app.win.st.cur = { l: 0, c: 0 }; app.win.st.top = 0; app.float = null;
    G.sync(app);
    app.treeFocus = false;
    app.msg = G.msg.info(`"${path}" ${app.win.doc.length}L`);
  };
  G.tree = ((tree) => (app) => {
    const rows = tree({ roadmap: G.markerFor(app, "projects/so-roadmap.md"), ideasOpen: app.ideasOpen });
    for (const r of rows) {
      if (r.path === "inbox.md") r.git = G.markerFor(app, "inbox.md") || undefined;
      if (r.path === app.path && app.dirty) r.dirty = true;
    }
    if (!app.repo) return rows.map((r) => Object.assign({}, r, { git: undefined }));
    if (app.treeOverride) return app.treeOverride(rows);
    return rows;
  })(G.tree);

  const hunkHere = (app) => (app.d ? G.hunkAt(app.d, app.win.st.cur.l) : null);
  const curHunkNo = (app, h) => `${app.d.hunks.indexOf(h) + 1}/${app.d.hunks.length}`;
  G.run = {
    tool: (a) => {
      if (!a.repo) { a.msg = G.msg.err("not a git repository"); return; }
      if (a.busy) { a.msg = G.msg.err("git: another operation is running"); return; }
      if (a.saveFail) { a.msg = G.msg.err(`git tool not started: ${a.path} could not be saved`); return; }
      if (a.toolMissing) { a.msg = G.msg.err("lazygit not found (git.tool)"); return; }
      const go = () => { a.screen = "lazygit"; a.msg = ""; M.render(); };
      if (a.dirty) { a.msg = G.msg.info(`"${a.path}" written · opening lazygit`); a.dirty = false; M.render(); setTimeout(go, 700); return; }
      go();
    },
    stage: (a) => {
      if (!a.repo) { a.msg = G.msg.err("not a git repository"); return; }
      if ((G.FILES()[a.path] || {}).conflict) { a.msg = G.msg.err(`${a.path} has conflicts; resolve them in lazygit`); return; }
      if (a.stale) { a.stale = false; a.msg = G.msg.warn("index changed; hunks refreshed"); return; }
      const h = hunkHere(a);
      if (!h) { a.msg = G.msg.info("no hunk at cursor"); return; }
      const no = curHunkNo(a, h);
      a.edits[a.path].find((e) => e.id === h.id).staged = true;
      const saved = a.dirty ? `"${a.path}" written · ` : "";
      a.dirty = false; a.float = null;
      G.sync(a);
      a.msg = G.msg.info(`${saved}staged hunk ${no}`);
    },
    reset: (a) => {
      if (!a.repo) { a.msg = G.msg.err("not a git repository"); return; }
      const h = hunkHere(a);
      if (!h) { a.msg = G.msg.info("no hunk at cursor"); return; }
      const no = curHunkNo(a, h);
      a.edits[a.path].find((e) => e.id === h.id).reset = true;
      a.float = null; a.dirty = true;
      G.sync(a);
      a.msg = G.msg.info(`reset hunk ${no} · buffer changed, autosave pending`);
    },
    preview: (a) => {
      if (!a.repo) { a.msg = G.msg.err("not a git repository"); return; }
      const h = hunkHere(a);
      if (!h) { a.msg = G.msg.info("no hunk at cursor"); return; }
      a.float = h.id;
    },
    blame: (a) => {
      if (!a.repo) { a.msg = G.msg.err("not a git repository"); return; }
      const h = hunkHere(a);
      const s = a.win.st.signs && a.win.st.signs[a.win.st.cur.l];
      if (a.repo.unborn || (a.d && a.d.untracked) || (h && (s === "add" || s === "change" || s === "changedelete"))) { a.msg = G.msg.notCommitted(); return; }
      a.msg = G.msg.blame(BLAME.who, BLAME.when, BLAME.summary, BLAME.sha);
    },
  };
  G.leaderMap = () => {
    const m = M.leaderWith(G.leader(G.run));
    m.m = { label: "Cycle live → source → reading", run: (a) => { const v = ["live", "source", "reading"]; a.win.st.view = v[(v.indexOf(a.win.st.view) + 1) % 3]; } };
    return m;
  };

  G.render = (app) => {
    if (app.screen === "lazygit") return G.lazygit(app);
    const st = app.win.st, d = app.d;
    const f = G.FILES()[app.path];
    const git = app.repo ? Object.assign({ ref: app.repo.ref, op: app.repo.op }, d && !d.untracked ? d.counts : {}) : null;
    const status = { mode: app.treeFocus ? "EXPLORER" : M.modeLabel(app, st), view: st.view, path: app.path, dirty: app.dirty, backlinks: f && f.backlinks != null ? f.backlinks : 0, words: M.words(app.win.doc), ln: st.cur.l + 1, col: st.cur.c, index: "ready", git };
    let cmd = app.pending ? `<span class="dim">${esc(app.pending)}</span>` : app.msg;
    let html = M.shell(app, {
      explorer: app.explorer, tree: G.tree(app), treeSel: app.treeSel, treeFocus: app.treeFocus,
      bufs: [{ name: app.path.split("/").pop(), dirty: app.dirty }, { name: "garden-app.md" }], activeBuf: 0,
      windows: [{ doc: app.win.doc, st, title: app.path, active: true }],
      status, cmd, overlayFocus: !!app.float,
    });
    if (app.float && d) {
      const h = d.hunks.find((x) => x.id === app.float);
      if (h) {
        const left = app.explorer && app.cols >= 100 ? 31 : 0;
        html += `<div data-click="backdrop" style="position:absolute;inset:0"></div>`;
        html += G.hunkFloat(app, d, h, { x: left + 6, cursorY: (st.curRow || 0) + 1, w: Math.min(70, app.cols - left - 8), maxLines: app.cols < 100 ? 8 : 12 });
      }
    }
    return html;
  };

  G.onKey = (app, k) => {
    if (app.screen === "lazygit") { if (k === "q") { app.screen = "so"; G.sync(app); app.msg = app.resumeMsg || ""; } return true; }
    if (app.float) { if (k === "<Esc>" || k === "q") app.float = null; return true; }
    const st = app.win.st;
    if (app.treeFocus) {
      const rows = G.tree(app);
      if (k === "j" || k === "<Down>") { app.treeSel = Math.min(rows.length - 1, app.treeSel + 1); return true; }
      if (k === "k" || k === "<Up>") { app.treeSel = Math.max(0, app.treeSel - 1); return true; }
      if (k === "<CR>" || k === "l") { const r = rows[app.treeSel]; if (r.kind === "dir") { if (r.path === "projects/ideas") app.ideasOpen = !(app.ideasOpen !== false); } else G.open(app, r.path); return true; }
      if (k === "<Esc>" || k === "q") { app.treeFocus = false; return true; }
      return k !== "<Space>";
    }
    if (app.pending) {
      const p = app.pending + k; app.pending = null;
      if (p === "]h" || p === "[h") {
        const to = p === "]h" ? G.nextHunk(app.d, st.cur.l) : G.prevHunk(app.d, st.cur.l);
        if (to == null) { app.msg = G.msg.info(p === "]h" ? "no next hunk" : "no previous hunk"); return true; }
        st.cur.l = to; st.cur.c = 0;
        app.msg = G.msg.info(`hunk ${curHunkNo(app, G.hunkAt(app.d, to))}`);
        return true;
      }
      if (p === "gg") { st.cur.l = 0; return true; }
      return true;
    }
    if (k === "]" || k === "[" || k === "g") { app.pending = k; return true; }
    if (k === "<C-h>" && app.explorer) { app.treeFocus = true; return true; }
    if (k === "i" || k === "a" || k === "o") { app.msg = G.msg.info("editing is not simulated here; signs follow the live buffer"); return true; }
    if (M.md.move(app.win.doc, st, k)) { app.msg = ""; return true; }
    return false;
  };
  G.onClick = (app, what) => {
    const [kind, v] = what.split(":");
    if (kind === "backdrop") { app.float = null; return; }
    if (kind === "tree") { app.treeSel = Number(v); app.treeFocus = true; const r = G.tree(app)[app.treeSel]; if (r.kind !== "dir") G.open(app, r.path); }
  };

  // create a mockup page on the shared workspace; states may set app fields, then call G.sync in apply
  G.mock = (cfg) => M.create(Object.assign({
    init: () => { const a = G.init(); G.sync(a); return a; },
    render: G.render, onKey: G.onKey, onClick: G.onClick, leader: G.leaderMap,
    leaderAllowed: (app) => app.screen === "so" && !app.float && !app.treeFocus && !app.pending,
    controls: cfg.extraControls || [],
  }, cfg));
})();
