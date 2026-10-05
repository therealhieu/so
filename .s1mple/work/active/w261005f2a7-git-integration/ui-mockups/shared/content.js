/* so v1 mockups — shared sample workspace and app-shell layout (shared R2). Mockup data only. */
(function () {
  "use strict";
  const M = window.Mock;
  const C = (M.content = {});

  C.tree = [
    { depth: 0, kind: "dir", name: "daily", open: true, path: "daily" },
    { depth: 1, kind: "md", name: "2026-10-01.md", path: "daily/2026-10-01.md" },
    { depth: 1, kind: "md", name: "2026-10-02.md", path: "daily/2026-10-02.md" },
    { depth: 1, kind: "md", name: "2026-10-03.md", path: "daily/2026-10-03.md" },
    { depth: 0, kind: "dir", name: "projects", open: true, path: "projects" },
    { depth: 1, kind: "md", name: "so-roadmap.md", path: "projects/so-roadmap.md" },
    { depth: 1, kind: "md", name: "garden-app.md", path: "projects/garden-app.md" },
    { depth: 1, kind: "md", name: "reading-list.md", path: "projects/reading-list.md" },
    { depth: 0, kind: "dir", name: "areas", open: false, path: "areas" },
    { depth: 0, kind: "dir", name: "people", open: true, path: "people" },
    { depth: 1, kind: "md", name: "linh.md", path: "people/linh.md" },
    { depth: 0, kind: "dir", name: "templates", open: false, path: "templates" },
    { depth: 0, kind: "dir", name: "attachments", open: false, path: "attachments" },
    { depth: 0, kind: "base", name: "tasks.base", path: "tasks.base" },
    { depth: 0, kind: "md", name: "inbox.md", path: "inbox.md" },
    { depth: 0, kind: "md", name: "index.md", path: "index.md" },
    { depth: 0, kind: "md", name: "tour.md", path: "tour.md" },
  ];

  // explorer tree with every file type (shared R2, AD4): notes, a base, an image, and non-Markdown text files
  C.treeAll = C.tree.slice(0, 12).concat([
    { depth: 0, kind: "dir", name: "attachments", open: true, path: "attachments" },
    { depth: 1, kind: "img", name: "photo.png", path: "attachments/photo.png" },
    { depth: 0, kind: "dir", name: "scripts", open: true, path: "scripts" },
    { depth: 1, kind: "text", name: "sync.ts", path: "scripts/sync.ts" },
    { depth: 1, kind: "text", name: "crontab", path: "scripts/crontab" },
    { depth: 1, kind: "text", name: "fixtures.json", path: "scripts/fixtures.json" },
  ], C.tree.slice(13), [{ depth: 0, kind: "text", name: "config.yaml", path: "config.yaml" }]);

  C.roadmap = `---
title: so roadmap
tags: [project, so, terminal]
status: active
due: 2026-12-15
related: "[[garden-app]]"
---
# so roadmap

A **fast, vim-modal** Markdown editor for my notes folder. See [[index|Home]]
and last week's review in [[daily/2026-10-02]].

## Goals
- Ship the editor core by #milestone/m1
- Keep notes as plain files — no vault, no sync
- [ ] Measure keystroke latency on the 5,000-line fixture
- [x] Pick the renderer (OpenTUI) ^renderer

## Open questions
> [!warning] Kanban type value
> Confirm the \`type\` string from a \`.base\` file saved by Obsidian 1.14.

| Milestone | Scope | Status |
|---|---|---|
| M1 | Editor + links | ==in progress== |
| M2 | Live preview | planned |
| M3 | Bases + preview | planned |

## Notes
Talked to [[people/linh|Linh]] about *block reveal* — tables should
show their pipes while the cursor is inside. Related: [[garden-app]],
[[plan]] %%plan.md does not exist yet%%

## Log
- 10-01 scaffolded tooling and CI
- 10-02 boundary test green
- 10-03 vim motions: w b e f t done`;

  C.garden = `---
title: Garden app
tags: [project, side]
status: paused
---
# Garden app

Watering schedule for the balcony. Paused until spring.

## Ideas
- Moisture sensor → notify phone
- Reuse the [[so-roadmap#Goals|so goals]] format for tasks
- See [[people/linh|Linh]]'s notes on sensors`;

  C.daily = `---
date: 2026-10-03
tags: [daily]
---
# Saturday, October 3

## Plan
- [x] Morning run 5 km
- [ ] Review [[so-roadmap]] milestones
- [ ] Call [[people/linh|Linh]] about the sensor kit

## Notes
Read about the kitty graphics protocol. iTerm2 supports it now,
so the separate iTerm2 image path is not needed.

## Log
09:05 coffee, inbox zero
11:30 vim engine: text objects done`;

  C.index = `# Home

- [[so-roadmap]] — current focus
- [[garden-app]] — paused
- [[reading-list]]
- Daily: [[daily/2026-10-03|today]]`;

  /* non-Markdown text files (shared R2; RM261003ABZP-REQ1@R3, DES17@R1, AD4): opened in source view by M1/M3 */
  const SYNC_TS = `// Mirror ~/notes to the backup disk every night (run by cron).
import { cp, stat } from "node:fs/promises";
import { join } from "node:path";

const SRC = join(process.env.HOME ?? "", "notes");
const DEST = "/Volumes/Backup/notes";

export async function sync(src = SRC, dest = DEST): Promise<number> {
  const started = Date.now();
  await stat(dest); // throws when the backup disk is not mounted
  await cp(src, dest, { recursive: true, force: true });
  return Date.now() - started;
}

if (import.meta.main) {
  const ms = await sync();
  console.log(\`synced \${SRC} → \${DEST} in \${ms} ms\`);
}`;
  const CRONTAB = `# m  h  dom mon dow  command
30 2  *   *   *    bun ~/notes/scripts/sync.ts >> ~/notes/.sync.log 2>&1
0  9  *   *   1    so ~/notes/daily`;
  const CONFIG_YAML = `# backup settings
backup:
  dest: "/Volumes/Backup/notes"
  keep_days: 30
exclude:
  - .trash
  - attachments/raw`;
  C.textFiles = {
    "scripts/sync.ts": { ft: "typescript", text: SYNC_TS },
    "scripts/crontab": { ft: "text", lang: "plain", text: CRONTAB },
    "config.yaml": { ft: "yaml", text: CONFIG_YAML },
  };

  C.embeds = {
    "so-roadmap#Goals": { lines: ["- Ship the editor core by #milestone/m1", "- Keep notes as plain files — no vault, no sync", "- [ ] Measure keystroke latency on the 5,000-line fixture", "- [x] Pick the renderer (OpenTUI)"], more: 0 },
    "daily/2026-10-02#Review": { lines: ["- Boundary test green on CI (1m 48s)", "- Vim motions: 23 of 31 done", "- Next: text objects and registers", "- Blocked: none"], more: 12 },
  };

  /* ---------- app shell: explorer | windows | side panel, global statusline ---------- */
  // o: { explorer, tree, treeSel, treeFocus, bufs, activeBuf, windows:[{doc, st, title, active, ctx}], side:{title, lines}, status, cmd, overlay }
  M.shell = (app, o) => {
    const narrow = app.cols < 100;
    const mainH = app.rows - 3;
    const expW = 30, sideW = 36;
    const showExpDocked = o.explorer && !narrow;
    const showSide = o.side && !narrow;
    let free = app.cols - (showExpDocked ? expW + 1 : 0) - (showSide ? sideW + 1 : 0);
    const n = o.windows.length;
    const winW = Math.floor((free - (n - 1)) / n);
    const sepCol = (h) => `<div class="sep-v">${'<div class="ln"></div>'.repeat(h)}</div>`;
    let html = M.ui.bufferline(o.bufs, o.activeBuf, narrow ? "" : "~/notes");
    let row = "";
    if (showExpDocked) row += M.ui.explorer({ rows: o.tree, sel: o.treeSel, focus: o.treeFocus, width: expW, title: "NOTES  ~/notes" }) + sepCol(mainH);
    o.windows.forEach((w, i) => {
      const winbar = n > 1;
      const st = w.st;
      st.width = winW; st.height = mainH - (winbar ? 1 : 0); st.focused = w.active && !o.treeFocus && !o.overlayFocus;
      const bar = winbar ? `<div class="ln" style="background:var(--bg-dark)"> <span class="${w.active ? "t-b" : "dim"}">${M.esc(w.title)}</span>${w.dirty ? ' <span class="dirty">●</span>' : ""}</div>` : "";
      row += `<div class="vcol" style="width:${winW}ch;flex:none">${bar}${M.md.editor(w.doc, st, Object.assign({ embeds: C.embeds, unresolved: ["plan"] }, w.ctx || {}))}</div>`;
      if (i < n - 1) row += sepCol(mainH);
    });
    if (showSide) {
      const lines = o.side.lines.slice(0, mainH - 1);
      row += sepCol(mainH) + `<div class="vcol" style="width:${sideW}ch;flex:none;background:var(--bg-dark)"><div class="ln"> <span class="pane-title">${M.esc(o.side.title)}</span></div>${lines.map((l) => `<div class="ln">${l}</div>`).join("")}</div>`;
    }
    html += `<div class="row" style="height:calc(${mainH}*var(--lh))">${row}</div>`;
    html += M.ui.statusline(app, o.status);
    html += M.ui.cmdline(app, o.cmd || "");
    if (o.explorer && narrow) {
      html += M.ui.float({ x: 0, y: 1, w: expW + 2, h: mainH, body: M.ui.explorer({ rows: o.tree, sel: o.treeSel, focus: true, width: expW }).replace(/^<div class="vcol[^"]*" style="[^"]*">/, '<div class="vcol">') });
    }
    if (o.overlay) html += o.overlay;
    return html;
  };

  C.backlinksPanel = (unlinked) => {
    const L = [
      '<span class="t-h3">▾ Linked mentions</span> <span class="dim">(7)</span>',
      ' <span class="t-wiki" style="text-decoration:none">◇ index</span>',
      '   <span class="dim">- [[so-roadmap]] — current focus</span>',
      ' <span class="t-wiki" style="text-decoration:none">◇ daily/2026-10-03</span>',
      '   <span class="dim">- [ ] Review [[so-roadmap]] mil…</span>',
      ' <span class="t-wiki" style="text-decoration:none">◇ daily/2026-10-02</span>',
      '   <span class="dim">…demoed [[so-roadmap#Goals]] to…</span>',
      ' <span class="t-wiki" style="text-decoration:none">◇ garden-app</span>',
      '   <span class="dim">Reuse the [[so-roadmap#Goals|so…</span>',
      ' <span class="t-wiki" style="text-decoration:none">◇ people/linh</span>',
      '   <span class="dim">helping with [[so-roadmap]] UX</span>',
      ' <span class="dim">+2 more · ⏎ open · p preview</span>',
      "",
    ];
    if (unlinked) {
      L.push('<span class="t-h2">▾ Unlinked mentions</span> <span class="dim">(2)</span>');
      L.push(' <span class="muted">◇ inbox</span>');
      L.push('   <span class="dim">…ask about the <span class="t-hl">so roadmap</span>…</span>');
      L.push('   <span class="dim">l link it</span>');
      L.push(' <span class="muted">◇ reading-list</span>');
      L.push('   <span class="dim">…ties into <span class="t-hl">so roadmap</span>…</span>');
    } else L.push('<span class="dim">▸ Unlinked mentions (2)</span>');
    return L;
  };
  C.outlinePanel = (curHeading) => {
    const hs = [["so roadmap", 1], ["Goals", 2], ["Open questions", 2], ["Notes", 2], ["Log", 2]];
    return hs.map(([t, l]) => `${"  ".repeat(l - 1)}<span class="${t === curHeading ? "t-h2 t-b" : "t-h" + l}">${t === curHeading ? "▸ " : "  "}${M.esc(t)}</span>`).concat(["", '<span class="dim">⏎ jump · esc close</span>']);
  };
})();

/* ---------- minimal vim interaction shared by editor mockups (illustrative subset of RM261003ABZP-REQ2@R2) ---------- */
(function () {
  "use strict";
  const M = window.Mock;
  // w: { doc, st, text() , setText(t) } stored on app via accessor; hooks: { onEx(app, cmd), onChange(app), onFollow(app) }
  M.vim = (app, w, k, hooks) => {
    hooks = hooks || {};
    const st = w.st;
    const lines = () => w.doc.map((l) => l.raw);
    const commit = (arr) => { w.doc = M.md.parse(arr.join("\n")); hooks.onChange && hooks.onChange(app); };
    // command line
    if (app.cmdline != null) {
      if (k === "<Esc>") { app.cmdline = null; return true; }
      if (k === "<CR>") { const c = app.cmdline; app.cmdline = null; hooks.onEx ? hooks.onEx(app, c) : null; return true; }
      if (k === "<BS>") { app.cmdline = app.cmdline.slice(0, -1); if (app.cmdline === "" ) {} return true; }
      if (k === "<Tab>") { hooks.onTab && hooks.onTab(app); return true; }
      if (M.isChar(k) || k === "<Space>") { app.cmdline += k === "<Space>" ? " " : k; return true; }
      return true;
    }
    if (st.vim === "insert") {
      const arr = lines();
      const l = st.cur.l, c = st.cur.c;
      if (k === "<Esc>") { st.vim = "normal"; st.cur.c = Math.max(0, c - 1); hooks.onLeaveInsert && hooks.onLeaveInsert(app); return true; }
      if (k === "<BS>") { if (c > 0) { arr[l] = arr[l].slice(0, c - 1) + arr[l].slice(c); st.cur.c--; commit(arr); } else if (l > 0) { const pl = arr[l - 1].length; arr[l - 1] += arr[l]; arr.splice(l, 1); st.cur.l--; st.cur.c = pl; commit(arr); } return true; }
      if (k === "<CR>") { const rest = arr[l].slice(c); arr[l] = arr[l].slice(0, c); const ind = (arr[l].match(/^(\s*(?:[-*] (?:\[[ x]\] )?)?)/) || ["", ""])[1]; arr.splice(l + 1, 0, ind + rest); st.cur.l++; st.cur.c = ind.length; commit(arr); return true; }
      if (k === "<Tab>") { arr[l] = arr[l].slice(0, c) + "  " + arr[l].slice(c); st.cur.c += 2; commit(arr); return true; }
      if (M.isChar(k) || k === "<Space>") { const ch = k === "<Space>" ? " " : k; arr[l] = arr[l].slice(0, c) + ch + arr[l].slice(c); st.cur.c++; commit(arr); hooks.onType && hooks.onType(app, ch); return true; }
      if (["<Up>", "<Down>", "<Left>", "<Right>"].includes(k)) { M.md.move(w.doc, st, k); return true; }
      return true;
    }
    const vis = st.vim === "visual" || st.vim === "vline";
    if (vis) {
      if (k === "<Esc>" || (k === "v" && st.vim === "visual") || (k === "V" && st.vim === "vline")) { st.vim = "normal"; return true; }
      if (k === "v") { st.vim = "visual"; return true; }
      if (k === "V") { st.vim = "vline"; return true; }
      if (k === "y" || k === "d") {
        const a = Math.min(st.vstart.l, st.cur.l), b = Math.max(st.vstart.l, st.cur.l);
        const n = b - a + 1;
        if (k === "d") { const arr = lines(); if (st.vim === "vline") { arr.splice(a, n); st.cur.l = Math.min(a, arr.length - 1); } commit(arr); }
        M.toast(app, "info", k === "y" ? `${n} line${n > 1 ? "s" : ""} yanked` : `${n} fewer line${n > 1 ? "s" : ""}`, k === "y" ? 'into register " (unnamed) and "0' : 'u undoes · register "1', 2200);
        st.vim = "normal"; st.cur.l = a;
        return true;
      }
      if (M.md.move(w.doc, st, k)) return true;
      return true;
    }
    // normal mode
    if (app.pending) {
      const p = app.pending + k; app.pending = null;
      if (p === "gg") { st.cur.l = 0; st.cur.c = 0; return true; }
      if (p === "dd") { const arr = lines(); w.undo = (w.undo || []).concat([arr.join("\n")]); arr.splice(st.cur.l, 1); st.cur.l = Math.min(st.cur.l, arr.length - 1); commit(arr); M.toast(app, "info", "1 line deleted", 'register "1 · u undoes', 1800); return true; }
      if (p === "gd") { hooks.onFollow && hooks.onFollow(app); return true; }
      if (p === "yy") { M.toast(app, "info", "1 line yanked", 'register " and "0', 1800); return true; }
      if (p === "za") { hooks.onFold && hooks.onFold(app); return true; }
      return true;
    }
    if (k === "g" || k === "d" || k === "y" || k === "z") { app.pending = k; return true; }
    if (k === "i") { st.vim = "insert"; return true; }
    if (k === "a") { st.vim = "insert"; st.cur.c = Math.min(w.doc[st.cur.l].raw.length, st.cur.c + 1); return true; }
    if (k === "A") { st.vim = "insert"; st.cur.c = w.doc[st.cur.l].raw.length; return true; }
    if (k === "I") { st.vim = "insert"; st.cur.c = (w.doc[st.cur.l].raw.match(/^\s*/) || [""])[0].length; return true; }
    if (k === "o" || k === "O") { const arr = lines(); const at = k === "o" ? st.cur.l + 1 : st.cur.l; arr.splice(at, 0, ""); commit(arr); st.cur.l = at; st.cur.c = 0; st.vim = "insert"; return true; }
    if (k === "x") { const arr = lines(); w.undo = (w.undo || []).concat([arr.join("\n")]); arr[st.cur.l] = arr[st.cur.l].slice(0, st.cur.c) + arr[st.cur.l].slice(st.cur.c + 1); commit(arr); return true; }
    if (k === "u") { if (w.undo && w.undo.length) { w.doc = M.md.parse(w.undo.pop()); hooks.onChange && hooks.onChange(app); M.toast(app, "info", "1 change; before #2", "undo block restored", 1500); } else M.toast(app, "info", "Already at oldest change", "", 1400); return true; }
    if (k === "v" || k === "V") { st.vim = k === "v" ? "visual" : "vline"; st.vstart = { l: st.cur.l, c: st.cur.c }; return true; }
    if (k === ":") { app.cmdline = ""; return true; }
    if (k === "<CR>" && hooks.onEnter) { return hooks.onEnter(app); }
    if (M.md.move(w.doc, st, k)) return true;
    return false;
  };
  M.modeLabel = (app, st) => (app.cmdline != null ? "COMMAND" : st.vim === "insert" ? "INSERT" : st.vim === "visual" ? "VISUAL" : st.vim === "vline" ? "V-LINE" : "NORMAL");
  M.cmdHtml = (app, msg) => (app.cmdline != null ? `:${M.esc(app.cmdline)}<span class="cur"> </span>` : msg || "");
  M.words = (doc) => doc.map((l) => l.raw).join(" ").split(/\s+/).filter(Boolean).length;
})();
