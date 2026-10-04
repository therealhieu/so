# RM261003ABZP: so v1 — Design Revisions

- **Current design:** `rm261003abzp-design.md`
- **Purpose:** Append-only history of prior design definitions and decisions; not current planning inputs.
- **Revision scope:** Individual design decisions and design-owned success and verification records, not this document. Reused records remain in their owning documents and histories.

## Archived Changes

- **Requirement baseline REQ3@R2 → REQ3@R3 — Coverage update**
  - **Archived at:** 2026-10-03T02:37:31Z
  - **Change type:** Coverage update
  - **Reason:** RM261003ABZP-REQ3 revised (help key `<leader>?` or `:help`); no design decision changes meaning.
  - **Changes:** requirement references RM261003ABZP-REQ3@R2 → RM261003ABZP-REQ3@R3 in DES5, DES7, DES10, DES14, S3, and the traceability table.
  - **Record transitions:**
    - RM261003ABZP-DES5@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES10@R1, RM261003ABZP-DES14@R1, RM261003ABZP-S3@R1, RM261003ABZP-V4@R1 → same references - Revision retained
  - **Requirement baseline:** RM261003ABZP-REQ3@R2 → RM261003ABZP-REQ3@R3; others unchanged
  - **Evidence:** `rm261003abzp-requirements-revisions.md` entry "REQ3@R2 — Help key conflict"
  - **Research provenance:**
    - None
  - **Affected coverage:** REQ3@R2 → REQ3@R3 rows; same DES/S/V
  - **Approval evidence:** User delegation of 2026-10-03; agent approved.
  - **Downstream impact:** None — no roadmap artifacts yet.

`````markdown
# RM261003ABZP: so v1 — Design

- **Status:** Approved
- **Outcome:** One Bun process with a pure TypeScript core (editor, vim, Markdown, index, Bases, templates) driven by one-way state flow, thin I/O adapters, an OpenTUI shell that draws only visible lines, and a read-only `Bun.serve` preview — enforced by an import-boundary test and gated by fast CI with in-process performance benchmarks.
- **History:** `rm261003abzp-design-revisions.md`

Use `None — <reason>` for sections or fields that do not apply. Diagrams and code previews show proposed design unless labeled as current evidence.

## Baseline and Goals

- **Context:** `rm261003abzp-roadmap-context.md@R1` - empty repository; Alfred code available to port (Markdown parse, Obsidian syntax, vim core, terminal graphics, Bases).
- **Requirements:** `rm261003abzp-requirements.md` - RM261003ABZP-REQ1@R2 … RM261003ABZP-REQ11@R2 (approved).
- **Research:** `rm261003abzp-research.md`
- **Reconciliation:** `rm261003abzp-requirements.md` Research Reconciliation — Complete.
- **Goals:**
  - Meet REQ1–REQ11 with the fewest moving parts: one process, one package, one state store.
  - Keep every product rule in a pure, unit-testable core; keep OpenTUI, Bun, and the file system at the edges.
  - Extend by registration (commands, keymaps, syntax extensions, block renderers, Bases view types) — the known extension needs from RM261003ABZP-REQ11@R2.
- **Binding constraints:**
  - `.s1mple/S1MPLE.md` Implementation - "Keep it lean and simple": no monorepo, no server between UI and core, no speculative plugin system.
  - RM261003ABZP-REQ11@R2 - only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs.
  - RM261003ABZP-REQ10@R2 - no tool may depend on the TypeScript compiler API (TypeScript 7 ships none, `RM261003ABZP-RF13`).

## System Architecture

- **System context:** One user in a terminal runs `so [path]`. External systems: the file system (the workspace folder, `$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, trash), the terminal emulator (keys, mouse, graphics), the system clipboard, and — only while `:Preview` runs — a local browser over `127.0.0.1`. No network service, database, Git, or AI.
- **Current architecture:** `rm261003abzp-roadmap-context.md@R1` Current System — empty repository.

```text
Not established — empty repository (only .s1mple/ guidance)
```

- **Proposed architecture:**

```text
                         ┌──────────────────────── src/app (composition root) ────────────────────────┐
 terminal ⇄ OpenTUI ⇄    │  main.ts → loads config/state → creates Store → starts UI, effects, workers │
                         └──────┬──────────────────────┬───────────────────────┬────────────────────┬──┘
                                │                      │                       │                    │
                   ┌────────────▼─────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
                   │ src/ui  (OpenTUI)    │  │ src/workspace (I/O)│  │ src/preview       │  │ src/core (pure)│
                   │ views, input, paint  │  │ fs, watcher, trash │  │ Bun.serve + SSE   │  │ state, vim,    │
                   │ images, theme        │  │ index worker, cfg  │  │ read-only HTML    │  │ markdown,index │
                   └────────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │ bases, layout  │
                                │ reads state,          │ executes effects,     │ reads state, └───────▲────────┘
                                │ dispatches actions    │ dispatches results    │ renders HTML         │
                                └───────────────────────┴───────────────────────┴──────── import ──────┘

 Allowed imports:  app → ui, workspace, preview, core      ui → core      workspace → core      preview → core
                   core → (nothing outside core; npm parsing libs only)
```

The core owns all product behavior; the three edge layers are adapters. This reuses Alfred's parsing, Obsidian syntax, vim, terminal-graphics knowledge, and Bases engine by porting them into `core/` (Alfred's kernel, client, protocol, chat, Git, SQLite, Ink, and Next.js are not reused). Main tradeoff: one process keeps latency and code minimal, but a CPU-heavy task on the main thread would stall input — so scanning, parsing for the index, and full-text search run in a worker (RM261003ABZP-DES7@R1).

## Components and Boundaries

- **App (composition root)**
  - **Decisions:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R1
  - **Location:** `src/app/`
  - **Responsibilities:** parse CLI args; load config and state; construct the store, effect runner, workspace adapters, index worker, UI, and preview on demand; own process lifecycle and exit codes.
  - **Collaborators:** `bin/so` → `app/main.ts` → `core/store`, `workspace/*`, `ui/shell`, `preview/server`
  - **Contracts:** Action and Effect protocol; AppConfig
  - **Code shape:** `src/app/main.ts` `main`, `src/app/effects.ts` `runEffect`
  - **Must not own:** product rules, rendering, Markdown semantics.

- **Core — state and commands**
  - **Decisions:** RM261003ABZP-DES2@R1, RM261003ABZP-DES5@R1
  - **Location:** `src/core/state/`, `src/core/commands/`
  - **Responsibilities:** `AppState`, pure `update(state, action) → { state, effects }`; command registry, keymap trie, which-key data, palette data, jump list, autosave policy.
  - **Collaborators:** ui/workspace/preview → `dispatch(action)` → `update` → effects → app effect runner
  - **Contracts:** Action and Effect protocol; Command and Keymap registry; AppState
  - **Code shape:** `src/core/state/update.ts` `update`; `src/core/commands/registry.ts` `CommandRegistry`, `Keymap`
  - **Must not own:** timers, I/O, terminal escape codes.

- **Core — editor and vim**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Location:** `src/core/editor/`, `src/core/vim/`
  - **Responsibilities:** text buffer, cursor and selections, undo blocks, registers; vim mode machine, key-sequence parser, motions, operators, text objects, dot-repeat, search, ex commands, window tree.
  - **Collaborators:** `update` → `vim.handleKey(bufferState, key)` → `TextBuffer`
  - **Contracts:** TextBuffer; VimState
  - **Code shape:** `src/core/editor/text-buffer.ts` `TextBuffer`; `src/core/vim/engine.ts` `handleKey`
  - **Must not own:** rendering, clipboard I/O (expressed as effects).

- **Core — Markdown and layout**
  - **Decisions:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R1
  - **Location:** `src/core/markdown/`, `src/core/layout/`, `src/core/render-html/`
  - **Responsibilities:** block splitting, per-block parse cache, Obsidian syntax extensions, `Doc` model; live-preview layout of visible rows into `RenderLine[]`; pure HTML rendering for the preview.
  - **Collaborators:** `update`/UI → `parseDoc(text, prev)` → `layoutViewport(doc, view)` → UI paint; preview → `renderHtml(doc, ctx)`
  - **Contracts:** Doc model; RenderLine model
  - **Code shape:** `src/core/markdown/doc.ts` `parseDoc`; `src/core/layout/layout.ts` `layoutViewport`; `src/core/render-html/render.ts` `renderHtml`
  - **Must not own:** terminal escape output, image decoding, HTTP.

- **Core — index and links**
  - **Decisions:** RM261003ABZP-DES7@R1
  - **Location:** `src/core/index/`
  - **Responsibilities:** `NoteSummary` extraction, `NoteIndex` (names, aliases, headings, blocks, links, tags, backlinks), link resolution rule, rename planning, fuzzy matching, full-text search functions.
  - **Collaborators:** index worker → `summarize(path, text)` → `NoteIndex.apply(delta)`; `update` → `resolveLink`, `planRename`
  - **Contracts:** NoteSummary and NoteIndex; LinkTarget
  - **Code shape:** `src/core/index/note-index.ts` `NoteIndex`; `src/core/index/resolve.ts` `resolveLink`; `src/core/index/rename.ts` `planRename`
  - **Must not own:** file scanning (worker), persistence.

- **Core — Bases and notes**
  - **Decisions:** RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R1
  - **Location:** `src/core/bases/`, `src/core/notes/`, `src/core/time/`
  - **Responsibilities:** `.base` parsing, expression evaluation, table and Kanban view models, YAML-preserving frontmatter patches; daily-note paths, template expansion, Moment-subset date formatting.
  - **Collaborators:** `update` → `evaluateBase(base, index)` → `BaseViewModel`; `update` → `expandTemplate(tpl, vars)`
  - **Contracts:** BaseViewModel; Template variables
  - **Code shape:** `src/core/bases/evaluate.ts` `evaluateBase`; `src/core/time/format.ts` `formatDate`
  - **Must not own:** file writes (expressed as `write` effects).

- **Workspace adapters**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES14@R1
  - **Location:** `src/workspace/`
  - **Responsibilities:** atomic save, read, create, rename, move, delete-to-trash; directory watcher with own-write suppression; index worker (scan, summarize, search); config and state files; clipboard; opening URLs/browser.
  - **Collaborators:** app effect runner → `workspace/*` → `dispatch(resultAction)`
  - **Contracts:** Effect protocol; FileEvent; WorkerMessage
  - **Code shape:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`; `src/workspace/index-worker.ts`
  - **Must not own:** decisions about conflicts, autosave timing, or link rewriting (core decides).

- **UI shell**
  - **Decisions:** RM261003ABZP-DES10@R1, RM261003ABZP-DES9@R1
  - **Location:** `src/ui/`
  - **Responsibilities:** OpenTUI renderer lifecycle; key/mouse normalization (kitty keyboard protocol, Esc timeout); layout of explorer, bufferline, editor windows, side panel, statusline, command line, overlays (picker, which-key, palette, prompts, help, notifications), Bases views; painting `RenderLine[]`; inline images; theme and `NO_COLOR`; terminal restore.
  - **Collaborators:** OpenTUI → `ui/input` → `dispatch`; store subscription → `ui/shell.render(state)`
  - **Contracts:** Key; RenderLine; AppState (read-only)
  - **Code shape:** `src/ui/shell.ts` `createShell`; `src/ui/editor-view.ts` `EditorView`; `src/ui/input.ts` `normalizeKey`
  - **Must not own:** editing logic, Markdown parsing, file I/O.

- **Preview server**
  - **Decisions:** RM261003ABZP-DES13@R1
  - **Location:** `src/preview/`
  - **Responsibilities:** `Bun.serve` on `127.0.0.1:0`, Host allowlist, SSE updates, read-only page, contained asset serving.
  - **Collaborators:** app → `startPreview(store)` → browser; store subscription → SSE push
  - **Contracts:** Preview HTTP routes
  - **Code shape:** `src/preview/server.ts` `startPreview`
  - **Must not own:** editing; files outside the workspace.

## Project Structure

- **Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json                 Purpose: one package; scripts dev/check/test/bench/build; exact pins
│       Symbols: scripts.check, packageManager, "@opentui/core": "<exact>"   Decisions: DES15
├── [A] tsconfig.json                Purpose: strict ESM, noEmit, TS 7          Decisions: DES15
├── [A] biome.json                   Purpose: format + lint                      Decisions: DES15
├── [A] knip.json                    Purpose: dead-code check                    Decisions: DES15
├── [A] release-please-config.json   Purpose: Conventional Commits → SemVer      Decisions: DES15
├── [A] .github/workflows/ci.yml     Purpose: check ∥ test+bench jobs            Decisions: DES15, DES16
├── [A] .github/workflows/release.yml Purpose: release-please + compile ×4 + smoke  Decisions: DES15
├── [A] bin/so                        Purpose: `#!/usr/bin/env bun` entry for source runs  Decisions: DES1
├── [A] src/app/
│   ├── main.ts                      Purpose: CLI, wiring, lifecycle            Symbols: main, parseArgs   Decisions: DES1, DES2
│   └── effects.ts                   Purpose: effect runner                     Symbols: runEffect         Decisions: DES2
├── [A] src/core/
│   ├── state/                       Purpose: AppState, Action, Effect, update  Symbols: update, AppState  Decisions: DES2
│   ├── commands/                    Purpose: registry, keymap trie, which-key  Symbols: CommandRegistry, Keymap  Decisions: DES5
│   ├── editor/                      Purpose: TextBuffer, undo, registers, windows  Symbols: TextBuffer, UndoStack, Registers  Decisions: DES3
│   ├── vim/                         Purpose: modes, parser, motions, operators, text objects, ex  Symbols: handleKey, motions, textObjects  Decisions: DES4
│   ├── markdown/                    Purpose: block split, parse cache, Obsidian extensions  Symbols: parseDoc, Doc, Block  Decisions: DES6
│   ├── layout/                      Purpose: live-preview layout of visible rows  Symbols: layoutViewport, RenderLine  Decisions: DES9
│   ├── render-html/                 Purpose: Doc → HTML for preview             Symbols: renderHtml        Decisions: DES13
│   ├── index/                       Purpose: summaries, index, resolve, rename, search  Symbols: NoteIndex, resolveLink, planRename  Decisions: DES7
│   ├── bases/                       Purpose: ported Bases engine + view models   Symbols: parseBase, evaluateBase, KANBAN_TYPE  Decisions: DES12
│   ├── notes/                       Purpose: daily notes, templates             Symbols: dailyPath, expandTemplate  Decisions: DES11
│   ├── time/                        Purpose: Moment-subset formatter            Symbols: formatDate        Decisions: DES11
│   └── config/                      Purpose: config schema and defaults         Symbols: ConfigSchema, defaults  Decisions: DES14
├── [A] src/workspace/
│   ├── fs.ts                        Purpose: read, atomicWrite, create, rename, move  Symbols: atomicWrite  Decisions: DES8
│   ├── trash.ts                     Purpose: freedesktop trash, macOS Finder trash  Symbols: moveToTrash  Decisions: DES8
│   ├── watcher.ts                   Purpose: directory watching, own-write suppression  Symbols: watchWorkspace  Decisions: DES8
│   ├── index-worker.ts              Purpose: scan, summarize, search in a Worker  Symbols: onmessage  Decisions: DES7
│   ├── config-file.ts               Purpose: XDG config load + validation       Symbols: loadConfig        Decisions: DES14
│   ├── state-file.ts                Purpose: XDG state load/save                Symbols: loadState, saveState  Decisions: DES14
│   └── system.ts                    Purpose: clipboard, open browser           Symbols: clipboard, openUrl  Decisions: DES8
├── [A] src/ui/
│   ├── shell.ts                     Purpose: renderer lifecycle, layout, restore  Symbols: createShell  Decisions: DES10
│   ├── input.ts                     Purpose: key/mouse normalization, Esc timeout  Symbols: normalizeKey  Decisions: DES10
│   ├── editor-view.ts               Purpose: paints RenderLine rows, cursor, images  Symbols: EditorView  Decisions: DES9, DES10
│   ├── views/                       Purpose: explorer, bufferline, statusline, cmdline, side panel, base views  Decisions: DES10, DES12
│   ├── overlays/                    Purpose: picker, which-key, palette, prompt, help, notify  Decisions: DES10, DES5
│   └── theme.ts                     Purpose: tokens, NO_COLOR                   Symbols: theme     Decisions: DES10
├── [A] src/preview/
│   ├── server.ts                    Purpose: Bun.serve, Host check, SSE, assets  Symbols: startPreview  Decisions: DES13
│   └── page.html                    Purpose: read-only page shell (embedded)   Decisions: DES13
└── [A] test/
    ├── boundaries.test.ts           Purpose: import-boundary enforcement        Decisions: DES1
    ├── e2e/                         Purpose: few PTY tests (start, edit, save, exit, restore)  Decisions: DES15
    ├── bench/                       Purpose: performance benchmarks via test renderer  Decisions: DES16
    └── fixtures/                    Purpose: sample workspace, 5,000-line note, 10,000-note generator  Decisions: DES16
```

Unit tests sit next to code as `*.test.ts`.

## Runtime Flows

- **Keystroke to frame**
  - **Decisions:** RM261003ABZP-DES2@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES16@R1
  - **Participants:** OpenTUI key event → `ui/input.normalizeKey` → `store.dispatch({type:"key"})` → `core/state/update` → `vim.handleKey` → `TextBuffer.apply` → `markdown.reparseBlock` → store notifies → `ui/shell.render` → `layoutViewport` (visible rows only) → `EditorView` paint → OpenTUI native diff
  - **Flow:**

    ```text
    key ─→ normalizeKey ─→ dispatch(key) ─→ update(state,key)
                                              ├─ keymap trie: pending prefix? → state.pending, effect: startWhichKeyTimer
                                              ├─ command → run(ctx) → new state + effects (e.g. scheduleAutosave)
                                              └─ text edit → TextBuffer' + undo block + dirty block ids
          ui.render(state) ← store.notify ←───┘
            └─ reparse dirty blocks (cache by block hash) → layoutViewport(rows in view) → paint → native diff → terminal
    ```

    State changes only inside `update`. Rendering is coalesced to at most one frame per input burst.

  - **Failure and recovery:** a command throws → `update` catches, keeps the previous state, emits `notify(error)`; a render error in one block → that block renders as source with a diagnostic marker; nothing crashes the process.
  - **Contracts and state:** Action and Effect protocol; AppState; RenderLine model
  - **Control flow:** `src/core/state/update.ts` `update`; `src/ui/shell.ts` `createShell`

- **Startup**
  - **Decisions:** RM261003ABZP-DES1@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES14@R1, RM261003ABZP-DES16@R1
  - **Participants:** `app/main` → `loadConfig`, `loadState` → `createStore` → `createShell` (first frame) → `startIndexWorker` → `watchWorkspace`
  - **Flow:**

    ```text
    so [path] → resolve workspace (folder | file's parent) ── missing → stderr + exit 2
             → load config (invalid → defaults + error notice) → load state (corrupt → empty)
             → first frame (explorer from a shallow readdir; opened file read directly)   ← < 200 ms target
             → worker: scan + summarize all notes → post batches → dispatch(indexBatch) → status "indexing 4,210/10,000"
             → watcher starts → index ready
    ```

  - **Failure and recovery:** worker crash → notify and restart once; link features show "index unavailable" until restart succeeds; editing keeps working.
  - **Contracts and state:** AppConfig; WorkerMessage; NoteIndex
  - **Control flow:** `src/app/main.ts` `main`

- **Save and external change**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R1
  - **Participants:** `update` (autosave policy) → effect `write` → `workspace/fs.atomicWrite` → `watcher` → `dispatch(fileChanged)` → `update` (conflict rules)
  - **Flow:**

    ```text
    edit → state.dirty=true → effect scheduleAutosave(1000ms) | leaveInsert | switchNote | exit | :w
         → effect write(path, text, expectedStamp) → atomicWrite: realpath → tmp in same dir → write → fsync → chmod → rename
         → record ownWrite(path, stamp) → dispatch(saved(stamp))
    watcher(dir) event → stat+hash → ownWrite? ignore
                                   → buffer clean → dispatch(reload(text)) → undoable reload
                                   → buffer dirty → dispatch(conflict) → prompt: keep mine | take disk | view diff
    ```

  - **Failure and recovery:** write fails (permission, disk full) → buffer stays dirty, status shows `save failed: <reason>`, autosave retries with backoff (1 s, 2 s, 4 s, max 30 s); `:w` retries immediately. Rename failure leaves the temp file removed and the original intact.
  - **Contracts and state:** FileEvent; BufferState.stamp
  - **Control flow:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`

- **Follow, complete, and rename links**
  - **Decisions:** RM261003ABZP-DES7@R1
  - **Participants:** `update` → `resolveLink(index, sourcePath, target)` → open buffer + jump; `planRename(index, from, to)` → `write` effects
  - **Flow:**

    ```text
    gd on [[plan#Goals]] → resolveLink → {path:"projects/plan.md", heading:"Goals"} → push jumplist → open → cursor at heading
                         → unresolved → prompt "Create projects/plan.md?" → create effect
    rename a.md → b.md → planRename → [{path, edits[]}…] → apply to open buffers in memory + write effects for closed files
                       → fs rename → notify "12 files updated"
    ```

  - **Failure and recovery:** a link-rewrite write fails → remaining writes continue; failures are listed in a notification with paths; the rename itself is rolled back only if the file rename failed (links already rewritten are reported, not reverted).
  - **Contracts and state:** NoteIndex; LinkTarget
  - **Control flow:** `src/core/index/resolve.ts` `resolveLink`; `src/core/index/rename.ts` `planRename`

- **Preview**
  - **Decisions:** RM261003ABZP-DES13@R1
  - **Participants:** `:Preview` → effect `startPreview` → `preview/server` → browser; store change (active doc or version) → SSE event → page fetches `/render`
  - **Flow:**

    ```text
    :Preview → Bun.serve({hostname:"127.0.0.1", port:0}) → open http://127.0.0.1:<port>/
    page → GET /events (SSE) ; edit → debounce 100 ms → event "doc" {path, version, anchor}
    page → GET /render?path=… → renderHtml(doc) → swap <main>, scroll to anchor
    any request with bad Host → 403 ; /file/<p> → realpath ⊂ workspace & not hidden? → bytes : 404
    ```

  - **Failure and recovery:** port bind fails → notify; browser cannot open → notify the URL; SSE drop → browser auto-reconnects and refetches.
  - **Contracts and state:** Preview HTTP routes
  - **Control flow:** `src/preview/server.ts` `startPreview`

## Contracts, Data, and State

- **Action and Effect protocol — State model**
  - **Decisions:** RM261003ABZP-DES2@R1
  - **Purpose:** the only way state changes and the only way side effects start.
  - **Participants:** ui, workspace, preview, timers → `Action` → `update` → `Effect[]` → app effect runner → result `Action`
  - **Meaning:** `Action` is a discriminated union (`key`, `mouse`, `resize`, `fileLoaded`, `saved`, `saveFailed`, `fileChanged`, `indexBatch`, `searchResults`, `timer`, …). `Effect` is a discriminated union (`read`, `write`, `create`, `rename`, `move`, `trash`, `startTimer`, `cancelTimer`, `clipboardWrite`, `clipboardRead`, `search`, `startPreview`, `stopPreview`, `openUrl`, `saveState`, `exit`).
  - **Ownership and lifecycle:** core defines both unions; app runs effects; every effect that can fail returns a success or failure action.
  - **Invariants:** `update` is pure and synchronous; no effect runs inside `update`; effects carry all data they need (no callbacks).
  - **State flow:**

    ```text
    Action → update → (State', Effect[]) → runEffect → Action …
    ```

  - **Shape:** `src/core/state/types.ts`

- **AppState — State model**
  - **Decisions:** RM261003ABZP-DES2@R1, RM261003ABZP-DES3@R1, RM261003ABZP-DES10@R1
  - **Purpose:** single source of truth for everything visible.
  - **Participants:** `update` (owner) → ui/preview (readers)
  - **Meaning:** `workspace` (root, tree), `buffers` (by id: path, TextBuffer, doc, stamp, dirty, mode view live|source|reading), `windows` (split tree, active, per-window cursor and scroll), `vim` (mode, pending keys, registers, last change, search), `panels` (explorer, side panel kind), `overlay` (none | picker | whichKey | palette | prompt | help | conflict), `index` (NoteIndex + status), `notifications`, `config`, `jumps`, `preview` (off | on(port)).
  - **Ownership and lifecycle:** created at startup from config + state file; `jumps` and recent notes persisted through `saveState` effects (debounced 2 s and on exit).
  - **Invariants:** one active window; each window references an open buffer; a buffer with `dirty=false` matches its last saved stamp.
  - **State flow:** `None — plain value replaced by update`
  - **Shape:** `src/core/state/types.ts` `AppState`

- **TextBuffer — Data model**
  - **Decisions:** RM261003ABZP-DES3@R1
  - **Purpose:** text storage and edit primitives behind a stable interface.
  - **Participants:** vim engine, rename planner, template insertion → `TextBuffer` → markdown parser
  - **Meaning:** lines array, version number, `apply(edit)` returning a new buffer and the inverse edit; positions are `{line, col}` in UTF-16 code units aligned to grapheme boundaries.
  - **Ownership and lifecycle:** owned by a buffer entry; replaced on each edit (structural sharing of untouched lines).
  - **Invariants:** at least one line; line separators normalized to `\n` in memory, original separator (`\n`/`\r\n`) and trailing newline restored on save.
  - **State flow:** `None`
  - **Shape:** `src/core/editor/text-buffer.ts`

- **Doc model — Data model**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Purpose:** parsed Markdown shared by live preview, index summaries, and HTML preview.
  - **Participants:** `parseDoc` → `Doc` → layout, `summarize`, `renderHtml`
  - **Meaning:** `Doc { frontmatter?, blocks: Block[] }`; `Block { id, kind, startLine, endLine, hash, node }` where `node` is mdast extended with Obsidian nodes (`wikiLink`, `embed`, `tag`, `highlight`, `comment`, `callout`, `blockId`, `footnote*`, `math`).
  - **Ownership and lifecycle:** recomputed per buffer version; unchanged blocks reused by hash.
  - **Invariants:** blocks cover the document without overlap; a fenced code block or frontmatter is never split.
  - **State flow:** `None`
  - **Shape:** `src/core/markdown/doc.ts`

- **RenderLine model — Data model**
  - **Decisions:** RM261003ABZP-DES9@R1
  - **Purpose:** UI-independent description of one screen row.
  - **Participants:** `layoutViewport` → `RenderLine[]` → `EditorView`
  - **Meaning:** `RenderLine { sourceLine, spans: {text, style: StyleToken, link?}[], widget?: {kind:"image"|"embed"|"base"|"rule", ref, rows} , reveal: boolean }`; `StyleToken` names a theme token (`heading1`, `bold`, `link`, `tag`, `codeKeyword`, …), never a colour.
  - **Ownership and lifecycle:** computed per frame for visible rows only.
  - **Invariants:** cursor column maps back to a source column through `spans` offsets; widget rows are counted in scroll math.
  - **State flow:** `None`
  - **Shape:** `src/core/layout/types.ts`

- **NoteSummary and NoteIndex — Data model**
  - **Decisions:** RM261003ABZP-DES7@R1
  - **Purpose:** workspace-wide link, tag, heading, and block knowledge.
  - **Participants:** worker `summarize` → `NoteSummary` → main `NoteIndex.apply`
  - **Meaning:** `NoteSummary { path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind:"wiki"|"md"|"embed"}], frontmatter }`. `NoteIndex` holds summaries by path plus derived maps: basename → paths, alias → paths, tag → paths, target path → backlinks.
  - **Ownership and lifecycle:** built at startup by the worker; updated per file event and per buffer save; never persisted.
  - **Invariants:** derived maps are rebuilt only for changed paths; resolution order is fixed (RM261003ABZP-DES7@R1).
  - **State flow:** `empty → indexing(n/total) → ready → (fileEvent) ready`
  - **Shape:** `src/core/index/note-index.ts`

- **Preview HTTP routes — API**
  - **Decisions:** RM261003ABZP-DES13@R1
  - **Purpose:** read-only browser preview.
  - **Participants:** browser → `preview/server` → core `renderHtml`
  - **Meaning:** `GET /` page shell; `GET /events` SSE (`doc` events with `{path, version, anchor}`); `GET /render?path=` HTML fragment; `GET /file/<path>` workspace asset bytes.
  - **Ownership and lifecycle:** exists only between `:Preview` and `:PreviewStop` or exit.
  - **Invariants:** hostname `127.0.0.1`; Host header ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403; realpath containment else 404; no mutating routes.
  - **State flow:** `off → on(port) → off`
  - **Shape:** `src/preview/server.ts`

- **AppConfig — Data model**
  - **Decisions:** RM261003ABZP-DES14@R1
  - **Purpose:** user options and keymap overrides.
  - **Participants:** `config-file.loadConfig` → `ConfigSchema` (zod) → `AppState.config`
  - **Meaning:** `leader`, `escTimeoutMs` (50), `autosave` (`{ enabled: true, delayMs: 1000 }`), `editor` (`tabWidth`, `wrap`, `relativeNumbers`), `preview` (`mode: "live"`, `embedMaxRows`, `images: "auto"|"blocks"|"off"`), `daily` (`folder`, `format`, `template`), `templates.folder`, `theme`, `color` (overrides `NO_COLOR`), `keys.<mode>` (`"<key-seq>" = "<command-id>"`).
  - **Ownership and lifecycle:** read at startup and on `:ConfigReload`.
  - **Invariants:** unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
  - **State flow:** `None`
  - **Shape:** `src/core/config/schema.ts`

## Detailed Code Design

- **`src/core/state/update.ts`**
  - **Decisions:** RM261003ABZP-DES2@R1
  - **Change:** Add
  - **Responsibilities:** reducer entry; routes actions to feature reducers.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };

    export const update: Update = (state, action) => {
      switch (action.type) {
        case "key":        return handleKeyAction(state, action.key);   // keymap → command or vim edit
        case "fileChanged":return handleFileChanged(state, action);     // reload | conflict | ignore
        case "indexBatch": return { state: withIndex(state, action.summaries), effects: [] };
        // … one case per Action variant; feature logic lives in feature modules
      }
    };

    export function createStore(initial: AppState, run: (e: Effect) => void) {
      let state = initial; const subs = new Set<(s: AppState) => void>();
      return {
        get: () => state,
        dispatch(action: Action) { const r = update(state, action); state = r.state; r.effects.forEach(run); subs.forEach((f) => f(state)); },
        subscribe(f: (s: AppState) => void) { subs.add(f); return () => subs.delete(f); },
      };
    }
    ```

    `update` routes; `createStore` is the only mutable cell. The switch dispatches on a closed Action union (core protocol, not an extension point); commands extend through the registry instead.

  - **Dependencies:** Action and Effect protocol; CommandRegistry
  - **Callers and wiring:** `app/main.ts` creates the store with `runEffect`; ui and preview subscribe.
  - **Invariants:** pure; no `Date.now()` — time arrives in actions.
  - **Verification:** RM261003ABZP-S11@R1, RM261003ABZP-V15@R1

- **`src/core/commands/registry.ts`**
  - **Decisions:** RM261003ABZP-DES5@R1
  - **Change:** Add
  - **Responsibilities:** named commands, keymap trie, which-key and palette data, config overrides.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Command = {
      id: string;                       // "file.find", "note.today", "link.follow"
      title: string;                    // shown in palette and which-key
      group?: string;                   // which-key group: "find", "note", "buffer"
      run: (ctx: CommandContext, args?: string) => { state: AppState; effects: Effect[] };
    };
    export type Mode = "normal" | "insert" | "visual" | "cmdline" | "explorer" | "picker" | "base";

    export class CommandRegistry { register(cmd: Command): void; get(id: string): Command | undefined; list(): Command[] }

    export class Keymap {
      bind(mode: Mode, seq: string, commandId: string): void;      // "<leader>ff", "gd", "<C-o>"
      lookup(mode: Mode, pending: Key[]): { kind: "command"; id: string } | { kind: "prefix"; next: WhichKeyItem[] } | { kind: "none" };
    }
    ```

    Features call `registry.register` and `keymap.bind` at startup from their own module (`src/core/notes/commands.ts`, …). Which-key reads `lookup(...).next`; the palette reads `list()`. Config `keys.<mode>` rebinds by command id.

  - **Dependencies:** AppState
  - **Callers and wiring:** `core/commands/defaults.ts` registers built-ins; `app/main.ts` applies config overrides.
  - **Invariants:** duplicate ids throw at startup; binding an unknown id is a config error, not a crash.
  - **Verification:** RM261003ABZP-S3@R1, RM261003ABZP-V4@R1; RM261003ABZP-S11@R1, RM261003ABZP-V16@R1

- **`src/core/editor/text-buffer.ts` and `src/core/vim/engine.ts`**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Change:** Add (vim engine redesigned from `alfred/apps/tui/src/view/editor/vim.ts`)
  - **Responsibilities:** buffer primitives; vim grammar `[count]["x][count]operator[count](motion|textobject)`.
  - **Current source:** `alfred/apps/tui/src/view/editor/vim.ts:15-40` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    export type VimMode = "normal" | "insert";
    export type VimEffect = "changed" | "insert-exited" | "toggle-mode" | "leave";
    export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
    ```

    Alfred's engine is pure with effects but supports two modes and a hard-coded pending set.

  - **Proposed shape:**

    ```ts
    export interface TextBuffer {
      readonly version: number; readonly lineCount: number;
      line(i: number): string;
      apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };     // Edit = { range, text }
      slice(range: Range): string;
    }

    export type Motion = (buf: TextBuffer, at: Pos, count: number, ctx: MotionCtx) => { to: Pos; linewise: boolean; inclusive: boolean } | null;
    export type TextObject = (buf: TextBuffer, at: Pos, count: number) => Range | null;
    export const motions: Record<string, Motion>;       // "w","b","e","gg","G","f",… registered by key
    export const textObjects: Record<string, TextObject>; // "iw","a(","ip",…

    export function handleKey(s: BufferVim, key: Key, env: VimEnv): { s: BufferVim; effects: VimEffect[] };
    // VimEffect: { kind:"yank", register, text } | { kind:"changed" } | { kind:"modeChanged", mode } | { kind:"ex", line } | { kind:"search", pattern, dir }
    ```

    The parser accumulates keys into a pending command; when complete it resolves the motion or text object by table lookup, applies the operator, and records an undo block and last-change for `.`. Insert mode collects edits into one undo block until `Esc`.

  - **Dependencies:** TextBuffer; registers in AppState
  - **Callers and wiring:** `update` → `handleKeyAction` → `handleKey` when no keymap binding matches in normal/visual/insert mode.
  - **Invariants:** an operator with a failed motion is a no-op; counts multiply (`2d3w` = `d6w`); undo restores cursor.
  - **Verification:** RM261003ABZP-S2@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1

- **`src/core/markdown/doc.ts`**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Change:** Add (ported from `alfred/apps/tui/src/view/markdown/parse.ts` and `alfred/packages/view-model/src/markdown/obsidian-syntax.ts`)
  - **Responsibilities:** split into blocks, parse each block with micromark + GFM + math + Obsidian extensions, reuse unchanged blocks.
  - **Current source:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` (imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math`)
  - **Current shape:**

    ```ts
    // Alfred parses the whole document per render and post-processes Obsidian syntax with regexes from obsidian-syntax.ts
    export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    ```

    Whole-document parse; Obsidian syntax by regex over text nodes.

  - **Proposed shape:**

    ```ts
    export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; node: MdNode };
    export type Doc = { version: number; frontmatter?: Frontmatter; blocks: Block[] };

    export function splitBlocks(buf: TextBuffer): { startLine: number; endLine: number }[]; // blank-line bounded; fences, frontmatter, $$ kept whole; lists kept whole
    export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;   // reparse only ranges whose hash changed
    export const syntaxExtensions: SyntaxExtension[];             // wikiLink, embed, tag, highlight, comment, callout, blockId — registration point
    ```

    Block-level reparse keeps per-keystroke work proportional to the edited block (`RM261003ABZP-RF7`). Obsidian syntax is applied as mdast transforms registered in `syntaxExtensions`.

  - **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`
  - **Callers and wiring:** `update` after edits; worker `summarize`; preview `renderHtml`.
  - **Invariants:** `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally (cache is transparent).
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R1; RM261003ABZP-S9@R1, RM261003ABZP-V12@R1

- **`src/core/layout/layout.ts`**
  - **Decisions:** RM261003ABZP-DES9@R1
  - **Change:** Add (adapted from `alfred/apps/tui/src/view/markdown/layout.ts` and `alfred/apps/tui/src/view/editor/reveal-units.ts`)
  - **Responsibilities:** visible-row layout with reveal rules and block renderers.
  - **Current source:** `alfred/apps/tui/src/view/editor/reveal-units.ts` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    None — Alfred lays out whole documents for Ink rendering
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    export type LayoutView = { doc: Doc; buf: TextBuffer; width: number; topRow: number; rows: number; cursor: Pos; selection?: Range; mode: "live" | "source" | "reading" };
    export function layoutViewport(v: LayoutView, ctx: LayoutCtx): RenderLine[];
    export type BlockRenderer = (block: Block, v: LayoutView, ctx: LayoutCtx) => RenderLine[];
    export const blockRenderers: Partial<Record<BlockKind, BlockRenderer>>;   // heading, list, table, callout, code, embed, base, math, mermaid …
    ```

    Reveal: the cursor's line shows raw inline syntax; if the cursor is inside a multi-line block (table, callout, code, math, frontmatter) the whole block renders as source. Rows outside the viewport are never laid out; a per-block row-height cache gives scroll positions.

  - **Dependencies:** Doc model; theme tokens; `lowlight` for code tokens; ported math and mermaid text renderers
  - **Callers and wiring:** `ui/editor-view.ts` per frame.
  - **Invariants:** `mode: "source"` returns raw lines with syntax tokens only; reading mode never reveals.
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R1, RM261003ABZP-V8@R1

- **`src/core/index/resolve.ts` and `src/core/index/rename.ts`**
  - **Decisions:** RM261003ABZP-DES7@R1
  - **Change:** Add
  - **Responsibilities:** deterministic link resolution; format-preserving rename planning.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function resolveLink(ix: NoteIndex, from: string, raw: string): LinkTarget | { unresolved: string };
    // order: exact root path (with/without .md) → alias → basename candidates ranked by
    //        (same folder as `from`) → (shortest path) → (alphabetical)
    export function planRename(ix: NoteIndex, from: string, to: string, read: (p: string) => string): FileEdit[];
    // keeps link kind (wiki/md), alias, #heading / #^block; writes the shortest unique form of `to`
    ```

  - **Dependencies:** NoteIndex
  - **Callers and wiring:** `link.follow`, completion, backlinks, `file.rename`, `file.move` commands.
  - **Invariants:** resolution is a pure function of index contents; rename never touches text outside link spans.
  - **Verification:** RM261003ABZP-S4@R1, RM261003ABZP-V5@R1, RM261003ABZP-V6@R1

- **`src/workspace/fs.ts` and `src/workspace/watcher.ts`**
  - **Decisions:** RM261003ABZP-DES8@R1
  - **Change:** Add
  - **Responsibilities:** atomic writes and directory watching with own-write suppression.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export async function atomicWrite(path: string, text: string): Promise<Stamp> {
      const target = await realpathOrSelf(path);
      const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
      const fd = await open(tmp, "w", await modeOr(target, 0o644));
      try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp, target);                     // same directory → atomic on POSIX
      return stampOf(target, text);                  // { mtimeMs, size, hash }
    }
    export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
    // fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
    ```

  - **Dependencies:** `node:fs/promises`, `node:fs` (Bun-compatible)
  - **Callers and wiring:** effect runner for `write`, `create`, `rename`, `move`; `main` starts the watcher.
  - **Invariants:** temp files never appear in the index (prefix `.` is hidden); a failed write deletes its temp file.
  - **Verification:** RM261003ABZP-S1@R1, RM261003ABZP-V1@R1

- **`src/ui/editor-view.ts` and `src/ui/input.ts`**
  - **Decisions:** RM261003ABZP-DES10@R1, RM261003ABZP-DES9@R1
  - **Change:** Add
  - **Responsibilities:** paint RenderLine rows onto an OpenTUI buffer; place images; normalize input.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    // Only file family allowed to import @opentui/*
    export class EditorView extends Renderable {           // custom renderable, not Textarea
      constructor(ctx: RenderContext, private getView: () => LayoutView) { super(ctx, { flexGrow: 1 }); }
      protected renderSelf(buf: OptimizedBuffer) {
        for (const [row, line] of layoutViewport(this.getView(), layoutCtx).entries()) paintLine(buf, row, line, theme);
      }
    }
    export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via escTimeoutMs
    ```

    Exact OpenTUI buffer and image APIs are confirmed against the pinned version in the first delivery item (the class above is illustrative).

  - **Dependencies:** `@opentui/core` (exact pin)
  - **Callers and wiring:** `ui/shell.ts` composes views; store subscription triggers `requestRender()`.
  - **Invariants:** UI never mutates AppState; all input becomes Actions.
  - **Verification:** RM261003ABZP-S9@R1, RM261003ABZP-V12@R1; RM261003ABZP-S11@R1, RM261003ABZP-V17@R1

- **`src/preview/server.ts`**
  - **Decisions:** RM261003ABZP-DES13@R1
  - **Change:** Add
  - **Responsibilities:** read-only preview server.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function startPreview(store: Store, root: string): { port: number; stop(): void } {
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0,
        fetch(req) {
          const host = req.headers.get("host");
          if (host !== `127.0.0.1:${server.port}` && host !== `localhost:${server.port}`) return new Response(null, { status: 403 });
          return route(req, store, root);              // "/", "/events", "/render", "/file/*"
        },
      });
      return { port: server.port, stop: () => server.stop(true) };
    }
    ```

  - **Dependencies:** `Bun.serve`; core `renderHtml`
  - **Callers and wiring:** effect runner for `startPreview`/`stopPreview`.
  - **Invariants:** no write routes; `/file/*` passes realpath containment and hidden-folder exclusion.
  - **Verification:** RM261003ABZP-S8@R1, RM261003ABZP-V11@R1

## Cross-cutting and Evolution

| Concern | Mechanism and canonical design location | Verification or reason not applicable |
|---|---|---|
| Security and privacy | No network except loopback preview with Host allowlist and realpath containment (RM261003ABZP-DES13@R1); config is data (TOML), never executed (RM261003ABZP-DES14@R1); no telemetry; notes never logged | RM261003ABZP-V11@R1 |
| Configuration and observability | XDG TOML config validated by schema; errors as notifications; `so --version`; `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content (RM261003ABZP-DES14@R1) | RM261003ABZP-V4@R1 |
| Performance and scalability | Viewport-only layout, block parse cache, worker index and search, frame coalescing, lazy image decode with cache (RM261003ABZP-DES16@R1) | RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 |
| Concurrency, retry, and idempotency | Single-threaded store; worker communicates by messages; saves serialized per path; autosave retry with backoff; own-write stamps make watcher events idempotent (RM261003ABZP-DES8@R1) | RM261003ABZP-V1@R1 |
| Migration and backfill | None — greenfield; Obsidian files are read as-is and written in place | None — no prior data format |
| Mixed-version compatibility | Obsidian file compatibility (Markdown, links, frontmatter, `.base`); Kanban `type` constant isolated in `core/bases/types.ts` and verified against an Obsidian-saved file (RM261003ABZP-DES12@R1) | RM261003ABZP-V10@R1 |
| Rollout and rollback | SemVer releases via release-please; users roll back by installing a previous release binary (RM261003ABZP-DES15@R1) | RM261003ABZP-V14@R1 |
| Known extension needs | Registries: commands and keymaps (DES5), syntax extensions (DES6), block renderers (DES9), Bases view types (DES12) — RM261003ABZP-REQ11@R2 | RM261003ABZP-V16@R1 |

- **System transition:**

```text
empty repo → scaffold (tooling, CI, boundary test, shell) → editor usable → knowledge features → release binaries
                                  └→ rollback: previous release binary; files are plain Markdown, no state migration
```

- **Delivery constraints:** the boundary test and CI exist before feature code so violations never land; the OpenTUI paint and image APIs are confirmed against the pinned version before live-preview work depends on them; the Kanban `type` value is confirmed before Kanban ships.

## Success and Verification

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** This document
  - **Outcome:** across crash, external edit, and save failure scenarios, the file on disk is always a complete old or new version and dirty buffers are never overwritten without a prompt.
  - **Requirements:** RM261003ABZP-REQ1@R2
  - **Design:** RM261003ABZP-DES8@R1 - atomic write, own-write suppression, conflict rules
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S1@R1
      - **Scenario:** in a temp workspace: (a) kill the writer between write and rename (simulated by throwing after fsync); (b) modify an open clean file externally; (c) modify an open dirty file externally; (d) save `so`'s own buffer.
      - **Expected result:** (a) original content intact, no temp file left; (b) buffer reloads and `u` restores previous text; (c) conflict prompt appears, file and buffer unchanged until chosen; (d) no reload or conflict triggered.
      - **Method and target:** integration test on `workspace/fs.ts`, `workspace/watcher.ts`, and `core` conflict reducer
      - **Environment:** real file system (tmpdir), real `fs.watch`
      - **Unique risk:** per-file watch losing events after rename; self-triggered reload loops; partial writes.
      - **Predecessors:** None

- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** This document
  - **Outcome:** every command listed in RM261003ABZP-REQ2@R2 produces Neovim's result on the shared fixture cases.
  - **Requirements:** RM261003ABZP-REQ2@R2
  - **Design:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 - grammar, undo blocks, dot-repeat
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** table of `{ before text + cursor, keys, after text + cursor + register }` cases covering each motion, operator, text object, count, register, search, `:s`, undo/redo, and `.`; expected values recorded from Neovim 0.11 `--clean`.
      - **Expected result:** each case matches exactly.
      - **Method and target:** unit tests on `core/vim/engine.ts` `handleKey`
      - **Environment:** None — pure functions
      - **Unique risk:** subtle divergence (inclusive/exclusive motions, linewise yanks, cursor after undo).
      - **Predecessors:** None
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** feed a lone `\x1b` byte without kitty protocol, then `\x1b[A`, through `ui/input.normalizeKey` with `escTimeoutMs=50`.
      - **Expected result:** lone Esc yields `escape` after 50 ms ± 10 ms; the sequence yields `up` immediately.
      - **Method and target:** unit test on `ui/input.ts`
      - **Environment:** fake timers
      - **Unique risk:** Esc swallowed or arrow keys misread as Esc + letters.
      - **Predecessors:** None

- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** This document
  - **Outcome:** every command is reachable by name in the palette, leader sequences show which-key hints, pickers filter fuzzily, and config overrides apply or fail safely.
  - **Requirements:** RM261003ABZP-REQ3@R2
  - **Design:** RM261003ABZP-DES5@R1, RM261003ABZP-DES14@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V4@R1 — Keymap, which-key, palette, and config**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S3@R1
      - **Scenario:** (a) press `Space` and wait; (b) bind `"<leader>w" = "file.save"` in config and press it; (c) load a config with a syntax error on line 7; (d) set `XDG_CONFIG_HOME=relative/path`; (e) open the palette and type `today`.
      - **Expected result:** (a) which-key lists groups; (b) file saved; (c) notification names `config.toml:7` and defaults apply; (d) `~/.config/so/config.toml` used; (e) `note.today` ranks first.
      - **Method and target:** unit tests on `core/commands`, `workspace/config-file.ts`; component test through the OpenTUI test renderer for (a)
      - **Environment:** tmp config dirs; OpenTUI test renderer
      - **Unique risk:** config error crashing startup; overrides silently ignored.
      - **Predecessors:** None

- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** This document
  - **Outcome:** link following, completion, backlinks, and tags match the index; rename updates every reference while preserving format.
  - **Requirements:** RM261003ABZP-REQ4@R2
  - **Design:** RM261003ABZP-DES7@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** workspace with `a/plan.md`, `b/plan.md`, `plan-x.md` (alias `plan`), `c/deep/plan.md`; resolve `[[plan]]` from `a/x.md`, from `root.md`, `[[b/plan]]`, `[[plan.md]]`, `[[note#H1#H2]]`, `[text](a/plan%20x.md)`.
      - **Expected result:** results follow the documented order exactly.
      - **Method and target:** unit tests on `core/index/resolve.ts`
      - **Environment:** None — in-memory index
      - **Unique risk:** nondeterministic or Obsidian-incompatible targets.
      - **Predecessors:** None
    - **RM261003ABZP-V6@R1 — Rename preserves link formats**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** rename `plan.md` → `projects/roadmap.md` with references `[[plan]]`, `[[plan|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)`, frontmatter `related: "[[plan]]"`, and an open dirty buffer containing `[[plan]]`.
      - **Expected result:** all rewritten in place with kind, alias, subpath preserved and shortest unique path; the dirty buffer is edited in memory (not overwritten on disk); notification reports the file count.
      - **Method and target:** unit test on `planRename` + integration test of the rename command
      - **Environment:** tmp workspace
      - **Unique risk:** broken links or clobbered unsaved edits.
      - **Predecessors:** None

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** This document
  - **Outcome:** each element listed in RM261003ABZP-REQ5@R2 renders as specified, reveal follows the cursor line or block, and images use the best available protocol.
  - **Requirements:** RM261003ABZP-REQ5@R2
  - **Design:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES10@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V7@R1 — Layout golden tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** `test/fixtures/tour.md` (every element) laid out at widths 60 and 100 with the cursor outside any block, on a bold line, inside a table, inside a callout.
      - **Expected result:** `RenderLine[]` serialized to text + style tokens matches committed goldens.
      - **Method and target:** unit tests on `layoutViewport`
      - **Environment:** None — pure
      - **Unique risk:** reveal or hiding regressions; broken table alignment.
      - **Predecessors:** None
    - **RM261003ABZP-V8@R1 — Image protocol selection**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** render a note with a PNG in the OpenTUI test renderer with capabilities kitty / sixel / none / `images="off"`.
      - **Expected result:** kitty or sixel placement, block characters, or `[image: name.png]` placeholder respectively.
      - **Method and target:** component test on `ui/editor-view.ts`
      - **Environment:** OpenTUI test renderer with mocked capabilities
      - **Unique risk:** images breaking layout or crashing on unsupported terminals.
      - **Predecessors:** None

- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** This document
  - **Outcome:** `:Today` and template insertion produce the same text Obsidian's core plugins would for the supported tokens.
  - **Requirements:** RM261003ABZP-REQ6@R2
  - **Design:** RM261003ABZP-DES11@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S6@R1
      - **Scenario:** format 2026-10-03T09:05 with every supported token and `[literal]`; expand a template containing all variables; compute daily paths for `YYYY-MM-DD` and `YYYY/MM/YYYY-MM-DD`; run `:Today` twice.
      - **Expected result:** strings equal Moment.js output for the same tokens; unsupported tokens stay literal; second `:Today` opens the existing file without changing it.
      - **Method and target:** unit tests on `core/time`, `core/notes`; integration test for `:Today`
      - **Environment:** fixed clock; tmp workspace
      - **Unique risk:** wrong dates, overwritten daily notes.
      - **Predecessors:** None

- **RM261003ABZP-S7@R1 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** This document
  - **Outcome:** table and Kanban views show the correct rows, edits write valid frontmatter, and unsupported layouts fall back safely.
  - **Requirements:** RM261003ABZP-REQ7@R2
  - **Design:** RM261003ABZP-DES12@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V10@R1 — Bases evaluation, edit, and compatibility**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S7@R1
      - **Scenario:** fixtures ported from Alfred's Bases tests plus a Kanban `.base` saved by Obsidian 1.14+; edit a cell; move a card; open a `cards` view; group by a formula.
      - **Expected result:** rows and order match fixtures; frontmatter patched with comments and order preserved; card move sets the property; `cards` opens as table with notice; moving is disabled for formula grouping.
      - **Method and target:** unit tests on `core/bases`; integration test of write-back
      - **Environment:** tmp workspace
      - **Unique risk:** YAML corruption; Kanban type mismatch with Obsidian.
      - **Predecessors:** None

- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** This document
  - **Outcome:** the browser follows edits within 300 ms and the server rejects foreign hosts and out-of-workspace paths.
  - **Requirements:** RM261003ABZP-REQ8@R2
  - **Design:** RM261003ABZP-DES13@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V11@R1 — Preview server behavior and safety**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S8@R1
      - **Scenario:** start preview; request with Host `evil.test:<port>`; request `/file/..%2f..%2fetc/passwd`; request a symlink pointing outside; request `/file/.git/config`; dispatch an edit and measure time to the SSE event.
      - **Expected result:** 403; 404; 404; 404; SSE event < 300 ms after the edit; server bound only to 127.0.0.1.
      - **Method and target:** integration test on `preview/server.ts`
      - **Environment:** real `Bun.serve`, tmp workspace with symlink
      - **Unique risk:** DNS rebinding, traversal, network exposure.
      - **Predecessors:** None

- **RM261003ABZP-S9@R1 — Performance targets hold**
  - **Definition:** This document
  - **Outcome:** the targets in RM261003ABZP-REQ9@R2 are met on the reference machine and gated at 2× in CI.
  - **Requirements:** RM261003ABZP-REQ9@R2
  - **Design:** RM261003ABZP-DES16@R1, RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES7@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V12@R1 — Keystroke and open-note benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** open the 5,000-line fixture in live preview in the OpenTUI test renderer (120×40); send 200 mixed keystrokes (`j`, `w`, `i` + text + `Esc`, `dd`, `u`); measure input → frame complete; measure open time.
      - **Expected result:** p95 < 16 ms and open < 50 ms on the reference machine; CI median of 5 runs < 32 ms and < 100 ms.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** OpenTUI test renderer; fixed CI runner type
      - **Unique risk:** full-document parse or layout sneaking into the keystroke path.
      - **Predecessors:** None
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** generate a 10,000-note workspace; start `so`; record time to first interactive frame and to index ready; type during indexing.
      - **Expected result:** first frame < 200 ms; index ready < 3 s; keystrokes during indexing still meet the V12 budget.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** generated fixture; real worker
      - **Unique risk:** indexing blocking the main thread.
      - **Predecessors:** None

- **RM261003ABZP-S10@R1 — Development, CI, and release are fast and automatic**
  - **Definition:** This document
  - **Outcome:** `bun run check` < 30 s; CI < 3 min; release produces four checksummed binaries that start.
  - **Requirements:** RM261003ABZP-REQ10@R2
  - **Design:** RM261003ABZP-DES15@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V14@R1 — Check timing, CI timing, and release dry run**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S10@R1
      - **Scenario:** time `bun run check` locally; read CI run durations; run the release workflow on a pre-release tag.
      - **Expected result:** < 30 s; < 3 min; GitHub Release with 4 binaries + `SHA256SUMS`; smoke jobs print `so <version>` on macOS and Linux.
      - **Method and target:** non-test check on CI and release workflows
      - **Environment:** GitHub Actions
      - **Unique risk:** slow feedback loops; binaries missing OpenTUI's native library.
      - **Predecessors:** None

- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored**
  - **Definition:** This document
  - **Outcome:** boundary violations fail CI; features extend by registration; terminal state is restored on every exit path; standards are followed.
  - **Requirements:** RM261003ABZP-REQ11@R2
  - **Design:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R1, RM261003ABZP-DES5@R1, RM261003ABZP-DES10@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V15@R1 — Import boundary test**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** scan every `src/**/*.ts` with `Bun.Transpiler.scanImports`; include a deliberate violation fixture.
      - **Expected result:** core imports only core and allowed parsing packages; only `src/ui/**` imports `@opentui/*`; the fixture fails.
      - **Method and target:** `test/boundaries.test.ts`
      - **Environment:** None
      - **Unique risk:** layering eroding silently.
      - **Predecessors:** None
    - **RM261003ABZP-V16@R1 — Registration-only extension**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** a test module registers a command, a keymap, a syntax extension, and a block renderer without touching other modules.
      - **Expected result:** the command runs from the palette and keymap; the syntax renders through the renderer.
      - **Method and target:** unit test across `core/commands`, `core/markdown`, `core/layout`
      - **Environment:** None
      - **Unique risk:** hidden switch statements that require edits to extend.
      - **Predecessors:** None
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** in a PTY, start `so`, then exit by `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception; set `NO_COLOR=1` in one run.
      - **Expected result:** after each exit the PTY is back on the main screen with cursor visible, mouse and kitty keyboard modes off; the `NO_COLOR` run emits no colour SGR codes.
      - **Method and target:** e2e PTY test in `test/e2e/`
      - **Environment:** real PTY (`Bun.spawn` with a pseudo-terminal), headless terminal emulator to read state
      - **Unique risk:** leaving the user's terminal broken.
      - **Predecessors:** None

## Design Decisions and Traceability

- **RM261003ABZP-DES1@R1 — One process, one package, four layers with a tested import boundary**
  - **Requirements:** RM261003ABZP-REQ11@R2 - pure core, enforced boundaries; RM261003ABZP-REQ10@R2 - fast checks
  - **Decision:** `src/core` (pure), `src/workspace` (I/O), `src/ui` (OpenTUI), `src/preview` (HTTP), wired only in `src/app`. A `bun test` boundary test using `Bun.Transpiler.scanImports` enforces the import rules.
  - **Explanation:** System Architecture diagram; `test/boundaries.test.ts`. One package keeps install and CI fast; the test needs no TypeScript API (`RM261003ABZP-RF13`).
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred needed six packages because of its kernel; `so` has no server boundary.
  - **Research:** `RM261003ABZP-RF1` - contain OpenTUI to the UI layer; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2. `RM261003ABZP-RF13` - avoid TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Tradeoffs:** folder conventions rather than package boundaries; rejected a Turborepo monorepo (slower, more config) and dependency-cruiser (TS 7 issue).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES2@R1 — One store with a pure reducer and data-only effects**
  - **Requirements:** RM261003ABZP-REQ11@R2 - stable, testable foundations; RM261003ABZP-REQ1@R2 - autosave and conflicts; RM261003ABZP-REQ9@R2 - predictable rendering
  - **Decision:** `update(state, action) → { state, effects }`; effects are plain data executed by `app/effects.ts`; results return as actions.
  - **Explanation:** Action and Effect protocol; AppState; `src/core/state/update.ts`. Every behavior (autosave timing, conflict choice, rename) is a pure function test.
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts` - Alfred's vim core already returns effects instead of performing them.
  - **Research:** None
  - **Tradeoffs:** an extra indirection for I/O; rejected UI components holding state (hard to test, the Ink/React pattern Alfred needed a compositor around).
  - **Dependencies:** RM261003ABZP-DES1@R1
  - **Predecessors:** None

- **RM261003ABZP-DES3@R1 — Line-array TextBuffer behind an interface, with vim undo blocks**
  - **Requirements:** RM261003ABZP-REQ2@R2 - undo per undo block; RM261003ABZP-REQ9@R2 - 5,000-line target
  - **Decision:** immutable line array with structural sharing; `apply(edit)` returns an inverse; undo stack of blocks (one Normal command or one Insert session).
  - **Explanation:** TextBuffer model; `src/core/editor/text-buffer.ts`. A piece table can replace the implementation without changing callers.
  - **Evidence:** `alfred/apps/tui/src/view/editor/text-buffer.ts` - single-string buffer (186 lines) as reference.
  - **Research:** `RM261003ABZP-RF6` - line array adequate at ≤ 5,000 lines; undo block = typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** O(lines) splices on huge files; rejected OpenTUI's native `EditBuffer` as source of truth (couples core to a 0.x UI library).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES4@R1 — Table-driven vim engine**
  - **Requirements:** RM261003ABZP-REQ2@R2 - core vim command set, Esc timeout
  - **Decision:** a pure key-sequence parser for `[count]["reg][count]op[count](motion|textobject)` with motion, operator, and text-object tables; mode machine (normal, insert, visual char/line, cmdline); last-change record for `.`; ex command table.
  - **Explanation:** `src/core/vim/engine.ts`; Esc timeout handled in `ui/input.ts` (RM261003ABZP-DES10@R1).
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts:15` - Alfred supports only two modes with a hard-coded pending set.
  - **Research:** `RM261003ABZP-RF5` - kitty keyboard protocol, 50 ms timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** no macros or Visual block in v1 (deferred); rejected embedding Neovim (user decision).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES5@R1 — Command registry and keymap trie as the single extension point for actions**
  - **Requirements:** RM261003ABZP-REQ3@R2 - leader, which-key, palette, config; RM261003ABZP-REQ11@R2 - extend by registration
  - **Decision:** every action is a named `Command`; keys map to command ids through a per-mode trie; which-key, palette, help, and config overrides read the same registry.
  - **Explanation:** `src/core/commands/registry.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input - LazyVim style.
  - **Research:** None
  - **Tradeoffs:** commands must be pure (state + effects), which forbids quick ad-hoc I/O in commands; accepted for testability.
  - **Dependencies:** RM261003ABZP-DES2@R1
  - **Predecessors:** None

- **RM261003ABZP-DES6@R1 — micromark/mdast with Obsidian extensions and block-level reparse**
  - **Requirements:** RM261003ABZP-REQ4@R2, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2
  - **Decision:** port Alfred's micromark + GFM + math parsing and Obsidian syntax into `core/markdown`; split into blocks and reparse only changed blocks; one `Doc` feeds layout, index, and HTML.
  - **Explanation:** Doc model; `src/core/markdown/doc.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` - existing micromark pipeline.
  - **Research:** `RM261003ABZP-RF7` - micromark conformant but not incremental; block reparse meets budgets; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block splitting must handle lists, fences, and frontmatter carefully; rejected OpenTUI's tree-sitter Markdown (UI-layer dependency, no Obsidian syntax) and Lezer (skips link reference validation; another parser to learn).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES7@R1 — Worker-built in-memory index with a documented resolution rule**
  - **Requirements:** RM261003ABZP-REQ4@R2 - links, backlinks, tags, rename; RM261003ABZP-REQ3@R2 - pickers and full-text search; RM261003ABZP-REQ9@R2 - non-blocking index
  - **Decision:** a Bun `Worker` scans and summarizes notes and answers full-text queries; the main thread holds `NoteIndex` built from summaries; resolution order: root path → alias → basename ranked by same folder, shortest path, alphabetical; `planRename` rewrites link spans only.
  - **Explanation:** NoteSummary and NoteIndex; `resolve.ts`; `rename.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred used SQLite; `so` has no persistence need for the index.
  - **Research:** `RM261003ABZP-RF8` - duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2
  - **Tradeoffs:** reindex on every start (< 3 s target); rejected SQLite (persistence and schema cost without need) and ripgrep (external binary).
  - **Dependencies:** RM261003ABZP-DES6@R1
  - **Predecessors:** None

- **RM261003ABZP-DES8@R1 — Atomic saves, directory watching, own-write stamps, and trash adapters**
  - **Requirements:** RM261003ABZP-REQ1@R2 - safe file management
  - **Decision:** `atomicWrite` (realpath → same-dir temp → fsync → chmod → rename); `fs.watch(root, {recursive:true})` with per-path debounce and own-write stamps; trash via freedesktop spec on Linux and Finder automation (`osascript`) on macOS, else typed confirmation; autosave policy and conflict rules live in core.
  - **Explanation:** `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow.
  - **Evidence:** `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - autosave queue reference.
  - **Research:** `RM261003ABZP-RF11` - fsync, same directory, directory watching, undoable reload; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2
  - **Tradeoffs:** rename-based saves replace hard links (acceptable for notes); recursive `fs.watch` relies on platform support in Bun on macOS and Linux — verified in the first delivery item.
  - **Dependencies:** RM261003ABZP-DES2@R1
  - **Predecessors:** None

- **RM261003ABZP-DES9@R1 — Viewport-only live-preview layout with line and block reveal and registered block renderers**
  - **Requirements:** RM261003ABZP-REQ5@R2 - live preview; RM261003ABZP-REQ9@R2 - smooth scrolling
  - **Decision:** pure `layoutViewport` produces `RenderLine[]` for visible rows only; cursor line reveals inline syntax, cursor inside a multi-line block reveals the whole block; block renderers are registered per block kind; widgets (image, embed, base) reserve rows.
  - **Explanation:** RenderLine model; `src/core/layout/layout.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/editor/reveal-units.ts` - reveal units reference.
  - **Research:** `RM261003ABZP-RF7` - per-element reveal in Obsidian; block reveal for multi-line constructs; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal; rejected OpenTUI `MarkdownRenderable` conceal (UI-owned parsing, no Obsidian syntax).
  - **Dependencies:** RM261003ABZP-DES6@R1
  - **Predecessors:** None

- **RM261003ABZP-DES10@R1 — OpenTUI shell with a custom editor renderable, normalized input, and guaranteed terminal restore**
  - **Requirements:** RM261003ABZP-REQ2@R2 - Esc, cursor shape; RM261003ABZP-REQ3@R2 - explorer, overlays; RM261003ABZP-REQ5@R2 - images; RM261003ABZP-REQ11@R2 - restore, `NO_COLOR`, terminal support
  - **Decision:** `@opentui/core` pinned exactly; layout of explorer, bufferline, window splits, side panel, statusline, cmdline, overlays; a custom `EditorView` renderable paints `RenderLine[]`; images via OpenTUI's auto protocol (kitty → sixel → blocks); input normalized to `Key` with kitty keyboard protocol and Esc timeout; theme tokens with `NO_COLOR`; restore on exit, signals, and uncaught errors.
  - **Explanation:** `src/ui/*`; `src/ui/editor-view.ts`.
  - **Evidence:** `alfred/apps/tui/src/terminal/shutdown.ts` - restore coordinator reference; Context7 `/anomalyco/opentui`.
  - **Research:** `RM261003ABZP-RF1`, `RM261003ABZP-RF2`, `RM261003ABZP-RF4`, `RM261003ABZP-RF5`; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Tradeoffs:** dependence on a 0.x library contained to `src/ui`; rejected Ink (React redraw cost) and a custom renderer (upfront cost).
  - **Dependencies:** RM261003ABZP-DES1@R1, RM261003ABZP-DES9@R1
  - **Predecessors:** None

- **RM261003ABZP-DES11@R1 — Shared Moment-subset formatter, pure template expansion, and daily-note commands**
  - **Requirements:** RM261003ABZP-REQ6@R2 - daily notes and templates; RM261003ABZP-REQ7@R2 - Bases date formatting
  - **Decision:** `core/time/format.ts` implements the documented token subset and `[literal]`; `core/notes` computes daily paths (with `/` subfolders) and expands `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}`; commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`.
  - **Explanation:** `src/core/time/format.ts`; `src/core/notes/*`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input.
  - **Research:** `RM261003ABZP-RF10` - Moment tokens, `{{time:FORMAT}}`, subfolders; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Tradeoffs:** rare tokens unsupported (kept literal); rejected Moment.js and Day.js dependencies (maintenance mode; extra weight).
  - **Dependencies:** RM261003ABZP-DES5@R1
  - **Predecessors:** None

- **RM261003ABZP-DES12@R1 — Ported Bases engine with table and Kanban view models and YAML-preserving write-back**
  - **Requirements:** RM261003ABZP-REQ7@R2 - Bases table and Kanban views
  - **Decision:** port `alfred/packages/vault/src/domain/bases/*` (parser, evaluator, expression, yaml-patcher) and `alfred/packages/view-model/src/base/*` row and board rules into `core/bases`; view models `TableModel` and `KanbanModel`; unknown layouts map to `TableModel` with a notice; the Kanban `type` string is one constant verified against an Obsidian 1.14+ file; edits become `write` effects through the atomic save path; embeds render through a `base` block renderer.
  - **Explanation:** `src/core/bases/*`; Base views in `src/ui/views/`.
  - **Evidence:** `alfred/packages/vault/src/domain/bases/parser.ts:19`, `evaluator.ts:164` - no file-system or Bun imports (context assumption).
  - **Research:** `RM261003ABZP-RF9` - layouts, Kanban rules; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - **Tradeoffs:** follows an early-access Obsidian layout; guarded by the constant, a fixture, and the table fallback.
  - **Dependencies:** RM261003ABZP-DES7@R1, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES11@R1
  - **Predecessors:** None

- **RM261003ABZP-DES13@R1 — `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering**
  - **Requirements:** RM261003ABZP-REQ8@R2 - read-only preview
  - **Decision:** `preview/server.ts` binds `127.0.0.1:0`, checks Host, serves a page shell, SSE `/events`, `/render` fragments from core `renderHtml(doc)`, and contained `/file/*`; the page loads KaTeX and Mermaid from jsDelivr and falls back to showing source when offline.
  - **Explanation:** Preview HTTP routes; `src/preview/server.ts`; `src/core/render-html/render.ts`.
  - **Evidence:** user decision "no Next.js".
  - **Research:** `RM261003ABZP-RF12` - binding, Host check, containment, SSE; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Tradeoffs:** math and diagrams need network in the browser (fallback to source); rejected bundling KaTeX/Mermaid into the binary (multi-MB size) and WebSocket (bidirectional not needed).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R1
  - **Predecessors:** None

- **RM261003ABZP-DES14@R1 — TOML config at XDG path validated by schema; per-workspace state at XDG state path**
  - **Requirements:** RM261003ABZP-REQ3@R2 - configuration and state
  - **Decision:** `Bun.TOML.parse` + zod schema (`core/config/schema.ts`); config path honors XDG rules (relative values ignored); invalid config → error notice + defaults; state JSON at `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json` holding recent notes, jump list, open buffers, window layout.
  - **Explanation:** AppConfig; `src/workspace/config-file.ts`; `src/workspace/state-file.ts`.
  - **Evidence:** `rm261003abzp-research.md` S21, S9, S30.
  - **Research:** `RM261003ABZP-RF15` - TOML, XDG rules, state home; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2
  - **Tradeoffs:** TOML instead of the proposal's `config.ts` — no code execution and simpler validation, at the cost of no scripting in config (agent decision under delegation).
  - **Dependencies:** RM261003ABZP-DES5@R1
  - **Predecessors:** None

- **RM261003ABZP-DES15@R1 — Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile**
  - **Requirements:** RM261003ABZP-REQ10@R2 - fast checks, CI, release; RM261003ABZP-REQ11@R2 - Conventional Commits, SemVer
  - **Decision:** Bun (exact version in `packageManager`), TypeScript 7 `tsc --noEmit` strict, Biome, knip, `bun test` (unit colocated; component via OpenTUI test renderer; few PTY e2e); `bun run check` = biome check + tsc + knip + boundary test + unit tests; CI jobs `check` and `test` (component, e2e, bench) in parallel with Bun cache; release-please on `main`; release job on tag: `bun install --os="*" --cpu="*"`, compile `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64`, `bun-linux-arm64` with `OPENTUI_LIBC=glibc` defined for Linux, `SHA256SUMS`, smoke `so --version` on `macos-latest` and `ubuntu-latest`.
  - **Explanation:** Project Structure (`package.json`, `.github/workflows/*`).
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's eight CI groups are the anti-pattern avoided.
  - **Research:** `RM261003ABZP-RF3`, `RM261003ABZP-RF13`, `RM261003ABZP-RF14`; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - **Tradeoffs:** unsigned macOS binaries (signing deferred); release-please adds a bot PR.
  - **Dependencies:** RM261003ABZP-DES1@R1
  - **Predecessors:** None

- **RM261003ABZP-DES16@R1 — Performance by construction plus benchmark gates**
  - **Requirements:** RM261003ABZP-REQ9@R2 - performance targets
  - **Decision:** viewport-only layout (DES9), block parse cache (DES6), worker index and search (DES7), frame coalescing (one render per input burst), first frame before indexing, lazy image decode with an LRU cache (64 MiB), and benchmarks through the OpenTUI test renderer gated at 2× (median of 5) in CI.
  - **Explanation:** Keystroke to frame and Startup flows; `test/bench/`.
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's 64 MiB image budget precedent.
  - **Research:** `RM261003ABZP-RF2` - in-process metrics; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Tradeoffs:** benchmarks add CI time (bounded by the 3 min budget); terminal display latency is outside the measurement.
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES9@R1
  - **Predecessors:** None

| Current requirement | Design decision | Canonical design location | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R2 - folder workspace, safe files | RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R1 | `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow | RM261003ABZP-S1@R1 | RM261003ABZP-V1@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R1 | `src/core/editor/`, `src/core/vim/`, `src/ui/input.ts` | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R2 - navigation, config, state | RM261003ABZP-DES5@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES10@R1, RM261003ABZP-DES14@R1 | `src/core/commands/`, `src/ui/overlays/`, `src/workspace/config-file.ts`, `state-file.ts` | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R1 |
| RM261003ABZP-REQ4@R2 - links | RM261003ABZP-DES7@R1, RM261003ABZP-DES6@R1 | `src/core/index/` | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R1 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES10@R1 | `src/core/markdown/`, `src/core/layout/`, `src/ui/editor-view.ts` | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R1, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | `src/core/time/`, `src/core/notes/` | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R1, RM261003ABZP-DES11@R1 | `src/core/bases/`, `src/ui/views/` | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - preview | RM261003ABZP-DES13@R1, RM261003ABZP-DES6@R1 | `src/preview/`, `src/core/render-html/` | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R1 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-DES16@R1 | Keystroke and Startup flows; `test/bench/` | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R2 - dev, CI, release | RM261003ABZP-DES15@R1, RM261003ABZP-DES1@R1 | `package.json`, `.github/workflows/` | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R2 - foundations | RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R1, RM261003ABZP-DES5@R1, RM261003ABZP-DES10@R1 | `test/boundaries.test.ts`, registries, `src/ui/shell.ts` | RM261003ABZP-S11@R1 | RM261003ABZP-V15@R1, RM261003ABZP-V16@R1, RM261003ABZP-V17@R1 |

## Unresolved Items

None — open technical confirmations (OpenTUI paint/image API details at the pinned version, recursive `fs.watch` behavior, Kanban `type` value) are delivery constraints with named verification, not design decisions.

## Approval

- **Requirement baseline:** RM261003ABZP-REQ1@R2 … RM261003ABZP-REQ11@R2
- **Approved design:** RM261003ABZP-DES1@R1 … RM261003ABZP-DES16@R1
- **Approved success and verification:** RM261003ABZP-S1@R1 … RM261003ABZP-S11@R1; RM261003ABZP-V1@R1 … RM261003ABZP-V17@R1
- **Approval evidence:** User delegated all decisions on 2026-10-03 ("you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"); the agent approved this design under that delegation.
`````

- **RM261003ABZP-DES2@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES13@R1 — UI system support (step 10)**
  - **Archived at:** 2026-10-03T03:41:02Z
  - **Change type:** Revised
  - **Reason:** System-impact assessment of the draft UI design found four uncovered supports: per-window fold/expand state, `calendar` and `completion` overlays, linking an unlinked mention, and a preview `stopped` signal.
  - **Changes:** DES2 AppState adds `windows[].folds` and overlay variants `calendar`, `completion`; DES9 `LayoutView` adds `folds`; DES7 adds command `link.linkMention` (span edit through `write` effects); DES13 SSE adds a `stopped` event sent before shutdown. Requirement baseline REQ4@R2 → REQ4@R3.
  - **Record transitions:**
    - RM261003ABZP-DES2@R1 → RM261003ABZP-DES2@R2 - revision change
    - RM261003ABZP-DES7@R1 → RM261003ABZP-DES7@R2 - revision change
    - RM261003ABZP-DES9@R1 → RM261003ABZP-DES9@R2 - revision change
    - RM261003ABZP-DES13@R1 → RM261003ABZP-DES13@R2 - revision change
    - S and V records - Revision retained (assertions unchanged; V5 and V11 scenarios gain cases without changing their risk)
  - **Requirement baseline:** RM261003ABZP-REQ4@R2 → RM261003ABZP-REQ4@R3; others unchanged
  - **Evidence:** `rm261003abzp-ui-design.md` Required System Support gaps (UDES4, UDES6, UDES8, UDES10)
  - **Research provenance:**
    - None
  - **Affected coverage:** REQ4 row → REQ4@R3; DES references in UI design Required System Support now cover every row.
  - **Approval evidence:** User delegation of 2026-10-03; agent approved.
  - **Downstream impact:** UI design coverage cells and open items; UI requirements and manifest pointers (non-semantic).

`````markdown
# RM261003ABZP: so v1 — Design

- **Status:** Approved
- **Outcome:** One Bun process with a pure TypeScript core (editor, vim, Markdown, index, Bases, templates) driven by one-way state flow, thin I/O adapters, an OpenTUI shell that draws only visible lines, and a read-only `Bun.serve` preview — enforced by an import-boundary test and gated by fast CI with in-process performance benchmarks.
- **History:** `rm261003abzp-design-revisions.md`

Use `None — <reason>` for sections or fields that do not apply. Diagrams and code previews show proposed design unless labeled as current evidence.

## Baseline and Goals

- **Context:** `rm261003abzp-roadmap-context.md@R1` - empty repository; Alfred code available to port (Markdown parse, Obsidian syntax, vim core, terminal graphics, Bases).
- **Requirements:** `rm261003abzp-requirements.md` - RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ4@R2 … RM261003ABZP-REQ11@R2 (approved).
- **Research:** `rm261003abzp-research.md`
- **Reconciliation:** `rm261003abzp-requirements.md` Research Reconciliation — Complete.
- **Goals:**
  - Meet REQ1–REQ11 with the fewest moving parts: one process, one package, one state store.
  - Keep every product rule in a pure, unit-testable core; keep OpenTUI, Bun, and the file system at the edges.
  - Extend by registration (commands, keymaps, syntax extensions, block renderers, Bases view types) — the known extension needs from RM261003ABZP-REQ11@R2.
- **Binding constraints:**
  - `.s1mple/S1MPLE.md` Implementation - "Keep it lean and simple": no monorepo, no server between UI and core, no speculative plugin system.
  - RM261003ABZP-REQ11@R2 - only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs.
  - RM261003ABZP-REQ10@R2 - no tool may depend on the TypeScript compiler API (TypeScript 7 ships none, `RM261003ABZP-RF13`).

## System Architecture

- **System context:** One user in a terminal runs `so [path]`. External systems: the file system (the workspace folder, `$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, trash), the terminal emulator (keys, mouse, graphics), the system clipboard, and — only while `:Preview` runs — a local browser over `127.0.0.1`. No network service, database, Git, or AI.
- **Current architecture:** `rm261003abzp-roadmap-context.md@R1` Current System — empty repository.

```text
Not established — empty repository (only .s1mple/ guidance)
```

- **Proposed architecture:**

```text
                         ┌──────────────────────── src/app (composition root) ────────────────────────┐
 terminal ⇄ OpenTUI ⇄    │  main.ts → loads config/state → creates Store → starts UI, effects, workers │
                         └──────┬──────────────────────┬───────────────────────┬────────────────────┬──┘
                                │                      │                       │                    │
                   ┌────────────▼─────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
                   │ src/ui  (OpenTUI)    │  │ src/workspace (I/O)│  │ src/preview       │  │ src/core (pure)│
                   │ views, input, paint  │  │ fs, watcher, trash │  │ Bun.serve + SSE   │  │ state, vim,    │
                   │ images, theme        │  │ index worker, cfg  │  │ read-only HTML    │  │ markdown,index │
                   └────────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │ bases, layout  │
                                │ reads state,          │ executes effects,     │ reads state, └───────▲────────┘
                                │ dispatches actions    │ dispatches results    │ renders HTML         │
                                └───────────────────────┴───────────────────────┴──────── import ──────┘

 Allowed imports:  app → ui, workspace, preview, core      ui → core      workspace → core      preview → core
                   core → (nothing outside core; npm parsing libs only)
```

The core owns all product behavior; the three edge layers are adapters. This reuses Alfred's parsing, Obsidian syntax, vim, terminal-graphics knowledge, and Bases engine by porting them into `core/` (Alfred's kernel, client, protocol, chat, Git, SQLite, Ink, and Next.js are not reused). Main tradeoff: one process keeps latency and code minimal, but a CPU-heavy task on the main thread would stall input — so scanning, parsing for the index, and full-text search run in a worker (RM261003ABZP-DES7@R1).

## Components and Boundaries

- **App (composition root)**
  - **Decisions:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R1
  - **Location:** `src/app/`
  - **Responsibilities:** parse CLI args; load config and state; construct the store, effect runner, workspace adapters, index worker, UI, and preview on demand; own process lifecycle and exit codes.
  - **Collaborators:** `bin/so` → `app/main.ts` → `core/store`, `workspace/*`, `ui/shell`, `preview/server`
  - **Contracts:** Action and Effect protocol; AppConfig
  - **Code shape:** `src/app/main.ts` `main`, `src/app/effects.ts` `runEffect`
  - **Must not own:** product rules, rendering, Markdown semantics.

- **Core — state and commands**
  - **Decisions:** RM261003ABZP-DES2@R1, RM261003ABZP-DES5@R1
  - **Location:** `src/core/state/`, `src/core/commands/`
  - **Responsibilities:** `AppState`, pure `update(state, action) → { state, effects }`; command registry, keymap trie, which-key data, palette data, jump list, autosave policy.
  - **Collaborators:** ui/workspace/preview → `dispatch(action)` → `update` → effects → app effect runner
  - **Contracts:** Action and Effect protocol; Command and Keymap registry; AppState
  - **Code shape:** `src/core/state/update.ts` `update`; `src/core/commands/registry.ts` `CommandRegistry`, `Keymap`
  - **Must not own:** timers, I/O, terminal escape codes.

- **Core — editor and vim**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Location:** `src/core/editor/`, `src/core/vim/`
  - **Responsibilities:** text buffer, cursor and selections, undo blocks, registers; vim mode machine, key-sequence parser, motions, operators, text objects, dot-repeat, search, ex commands, window tree.
  - **Collaborators:** `update` → `vim.handleKey(bufferState, key)` → `TextBuffer`
  - **Contracts:** TextBuffer; VimState
  - **Code shape:** `src/core/editor/text-buffer.ts` `TextBuffer`; `src/core/vim/engine.ts` `handleKey`
  - **Must not own:** rendering, clipboard I/O (expressed as effects).

- **Core — Markdown and layout**
  - **Decisions:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R1
  - **Location:** `src/core/markdown/`, `src/core/layout/`, `src/core/render-html/`
  - **Responsibilities:** block splitting, per-block parse cache, Obsidian syntax extensions, `Doc` model; live-preview layout of visible rows into `RenderLine[]`; pure HTML rendering for the preview.
  - **Collaborators:** `update`/UI → `parseDoc(text, prev)` → `layoutViewport(doc, view)` → UI paint; preview → `renderHtml(doc, ctx)`
  - **Contracts:** Doc model; RenderLine model
  - **Code shape:** `src/core/markdown/doc.ts` `parseDoc`; `src/core/layout/layout.ts` `layoutViewport`; `src/core/render-html/render.ts` `renderHtml`
  - **Must not own:** terminal escape output, image decoding, HTTP.

- **Core — index and links**
  - **Decisions:** RM261003ABZP-DES7@R1
  - **Location:** `src/core/index/`
  - **Responsibilities:** `NoteSummary` extraction, `NoteIndex` (names, aliases, headings, blocks, links, tags, backlinks), link resolution rule, rename planning, fuzzy matching, full-text search functions.
  - **Collaborators:** index worker → `summarize(path, text)` → `NoteIndex.apply(delta)`; `update` → `resolveLink`, `planRename`
  - **Contracts:** NoteSummary and NoteIndex; LinkTarget
  - **Code shape:** `src/core/index/note-index.ts` `NoteIndex`; `src/core/index/resolve.ts` `resolveLink`; `src/core/index/rename.ts` `planRename`
  - **Must not own:** file scanning (worker), persistence.

- **Core — Bases and notes**
  - **Decisions:** RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R1
  - **Location:** `src/core/bases/`, `src/core/notes/`, `src/core/time/`
  - **Responsibilities:** `.base` parsing, expression evaluation, table and Kanban view models, YAML-preserving frontmatter patches; daily-note paths, template expansion, Moment-subset date formatting.
  - **Collaborators:** `update` → `evaluateBase(base, index)` → `BaseViewModel`; `update` → `expandTemplate(tpl, vars)`
  - **Contracts:** BaseViewModel; Template variables
  - **Code shape:** `src/core/bases/evaluate.ts` `evaluateBase`; `src/core/time/format.ts` `formatDate`
  - **Must not own:** file writes (expressed as `write` effects).

- **Workspace adapters**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES14@R1
  - **Location:** `src/workspace/`
  - **Responsibilities:** atomic save, read, create, rename, move, delete-to-trash; directory watcher with own-write suppression; index worker (scan, summarize, search); config and state files; clipboard; opening URLs/browser.
  - **Collaborators:** app effect runner → `workspace/*` → `dispatch(resultAction)`
  - **Contracts:** Effect protocol; FileEvent; WorkerMessage
  - **Code shape:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`; `src/workspace/index-worker.ts`
  - **Must not own:** decisions about conflicts, autosave timing, or link rewriting (core decides).

- **UI shell**
  - **Decisions:** RM261003ABZP-DES10@R1, RM261003ABZP-DES9@R1
  - **Location:** `src/ui/`
  - **Responsibilities:** OpenTUI renderer lifecycle; key/mouse normalization (kitty keyboard protocol, Esc timeout); layout of explorer, bufferline, editor windows, side panel, statusline, command line, overlays (picker, which-key, palette, prompts, help, notifications), Bases views; painting `RenderLine[]`; inline images; theme and `NO_COLOR`; terminal restore.
  - **Collaborators:** OpenTUI → `ui/input` → `dispatch`; store subscription → `ui/shell.render(state)`
  - **Contracts:** Key; RenderLine; AppState (read-only)
  - **Code shape:** `src/ui/shell.ts` `createShell`; `src/ui/editor-view.ts` `EditorView`; `src/ui/input.ts` `normalizeKey`
  - **Must not own:** editing logic, Markdown parsing, file I/O.

- **Preview server**
  - **Decisions:** RM261003ABZP-DES13@R1
  - **Location:** `src/preview/`
  - **Responsibilities:** `Bun.serve` on `127.0.0.1:0`, Host allowlist, SSE updates, read-only page, contained asset serving.
  - **Collaborators:** app → `startPreview(store)` → browser; store subscription → SSE push
  - **Contracts:** Preview HTTP routes
  - **Code shape:** `src/preview/server.ts` `startPreview`
  - **Must not own:** editing; files outside the workspace.

## Project Structure

- **Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json                 Purpose: one package; scripts dev/check/test/bench/build; exact pins
│       Symbols: scripts.check, packageManager, "@opentui/core": "<exact>"   Decisions: DES15
├── [A] tsconfig.json                Purpose: strict ESM, noEmit, TS 7          Decisions: DES15
├── [A] biome.json                   Purpose: format + lint                      Decisions: DES15
├── [A] knip.json                    Purpose: dead-code check                    Decisions: DES15
├── [A] release-please-config.json   Purpose: Conventional Commits → SemVer      Decisions: DES15
├── [A] .github/workflows/ci.yml     Purpose: check ∥ test+bench jobs            Decisions: DES15, DES16
├── [A] .github/workflows/release.yml Purpose: release-please + compile ×4 + smoke  Decisions: DES15
├── [A] bin/so                        Purpose: `#!/usr/bin/env bun` entry for source runs  Decisions: DES1
├── [A] src/app/
│   ├── main.ts                      Purpose: CLI, wiring, lifecycle            Symbols: main, parseArgs   Decisions: DES1, DES2
│   └── effects.ts                   Purpose: effect runner                     Symbols: runEffect         Decisions: DES2
├── [A] src/core/
│   ├── state/                       Purpose: AppState, Action, Effect, update  Symbols: update, AppState  Decisions: DES2
│   ├── commands/                    Purpose: registry, keymap trie, which-key  Symbols: CommandRegistry, Keymap  Decisions: DES5
│   ├── editor/                      Purpose: TextBuffer, undo, registers, windows  Symbols: TextBuffer, UndoStack, Registers  Decisions: DES3
│   ├── vim/                         Purpose: modes, parser, motions, operators, text objects, ex  Symbols: handleKey, motions, textObjects  Decisions: DES4
│   ├── markdown/                    Purpose: block split, parse cache, Obsidian extensions  Symbols: parseDoc, Doc, Block  Decisions: DES6
│   ├── layout/                      Purpose: live-preview layout of visible rows  Symbols: layoutViewport, RenderLine  Decisions: DES9
│   ├── render-html/                 Purpose: Doc → HTML for preview             Symbols: renderHtml        Decisions: DES13
│   ├── index/                       Purpose: summaries, index, resolve, rename, search  Symbols: NoteIndex, resolveLink, planRename  Decisions: DES7
│   ├── bases/                       Purpose: ported Bases engine + view models   Symbols: parseBase, evaluateBase, KANBAN_TYPE  Decisions: DES12
│   ├── notes/                       Purpose: daily notes, templates             Symbols: dailyPath, expandTemplate  Decisions: DES11
│   ├── time/                        Purpose: Moment-subset formatter            Symbols: formatDate        Decisions: DES11
│   └── config/                      Purpose: config schema and defaults         Symbols: ConfigSchema, defaults  Decisions: DES14
├── [A] src/workspace/
│   ├── fs.ts                        Purpose: read, atomicWrite, create, rename, move  Symbols: atomicWrite  Decisions: DES8
│   ├── trash.ts                     Purpose: freedesktop trash, macOS Finder trash  Symbols: moveToTrash  Decisions: DES8
│   ├── watcher.ts                   Purpose: directory watching, own-write suppression  Symbols: watchWorkspace  Decisions: DES8
│   ├── index-worker.ts              Purpose: scan, summarize, search in a Worker  Symbols: onmessage  Decisions: DES7
│   ├── config-file.ts               Purpose: XDG config load + validation       Symbols: loadConfig        Decisions: DES14
│   ├── state-file.ts                Purpose: XDG state load/save                Symbols: loadState, saveState  Decisions: DES14
│   └── system.ts                    Purpose: clipboard, open browser           Symbols: clipboard, openUrl  Decisions: DES8
├── [A] src/ui/
│   ├── shell.ts                     Purpose: renderer lifecycle, layout, restore  Symbols: createShell  Decisions: DES10
│   ├── input.ts                     Purpose: key/mouse normalization, Esc timeout  Symbols: normalizeKey  Decisions: DES10
│   ├── editor-view.ts               Purpose: paints RenderLine rows, cursor, images  Symbols: EditorView  Decisions: DES9, DES10
│   ├── views/                       Purpose: explorer, bufferline, statusline, cmdline, side panel, base views  Decisions: DES10, DES12
│   ├── overlays/                    Purpose: picker, which-key, palette, prompt, help, notify  Decisions: DES10, DES5
│   └── theme.ts                     Purpose: tokens, NO_COLOR                   Symbols: theme     Decisions: DES10
├── [A] src/preview/
│   ├── server.ts                    Purpose: Bun.serve, Host check, SSE, assets  Symbols: startPreview  Decisions: DES13
│   └── page.html                    Purpose: read-only page shell (embedded)   Decisions: DES13
└── [A] test/
    ├── boundaries.test.ts           Purpose: import-boundary enforcement        Decisions: DES1
    ├── e2e/                         Purpose: few PTY tests (start, edit, save, exit, restore)  Decisions: DES15
    ├── bench/                       Purpose: performance benchmarks via test renderer  Decisions: DES16
    └── fixtures/                    Purpose: sample workspace, 5,000-line note, 10,000-note generator  Decisions: DES16
```

Unit tests sit next to code as `*.test.ts`.

## Runtime Flows

- **Keystroke to frame**
  - **Decisions:** RM261003ABZP-DES2@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES16@R1
  - **Participants:** OpenTUI key event → `ui/input.normalizeKey` → `store.dispatch({type:"key"})` → `core/state/update` → `vim.handleKey` → `TextBuffer.apply` → `markdown.reparseBlock` → store notifies → `ui/shell.render` → `layoutViewport` (visible rows only) → `EditorView` paint → OpenTUI native diff
  - **Flow:**

    ```text
    key ─→ normalizeKey ─→ dispatch(key) ─→ update(state,key)
                                              ├─ keymap trie: pending prefix? → state.pending, effect: startWhichKeyTimer
                                              ├─ command → run(ctx) → new state + effects (e.g. scheduleAutosave)
                                              └─ text edit → TextBuffer' + undo block + dirty block ids
          ui.render(state) ← store.notify ←───┘
            └─ reparse dirty blocks (cache by block hash) → layoutViewport(rows in view) → paint → native diff → terminal
    ```

    State changes only inside `update`. Rendering is coalesced to at most one frame per input burst.

  - **Failure and recovery:** a command throws → `update` catches, keeps the previous state, emits `notify(error)`; a render error in one block → that block renders as source with a diagnostic marker; nothing crashes the process.
  - **Contracts and state:** Action and Effect protocol; AppState; RenderLine model
  - **Control flow:** `src/core/state/update.ts` `update`; `src/ui/shell.ts` `createShell`

- **Startup**
  - **Decisions:** RM261003ABZP-DES1@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES14@R1, RM261003ABZP-DES16@R1
  - **Participants:** `app/main` → `loadConfig`, `loadState` → `createStore` → `createShell` (first frame) → `startIndexWorker` → `watchWorkspace`
  - **Flow:**

    ```text
    so [path] → resolve workspace (folder | file's parent) ── missing → stderr + exit 2
             → load config (invalid → defaults + error notice) → load state (corrupt → empty)
             → first frame (explorer from a shallow readdir; opened file read directly)   ← < 200 ms target
             → worker: scan + summarize all notes → post batches → dispatch(indexBatch) → status "indexing 4,210/10,000"
             → watcher starts → index ready
    ```

  - **Failure and recovery:** worker crash → notify and restart once; link features show "index unavailable" until restart succeeds; editing keeps working.
  - **Contracts and state:** AppConfig; WorkerMessage; NoteIndex
  - **Control flow:** `src/app/main.ts` `main`

- **Save and external change**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R1
  - **Participants:** `update` (autosave policy) → effect `write` → `workspace/fs.atomicWrite` → `watcher` → `dispatch(fileChanged)` → `update` (conflict rules)
  - **Flow:**

    ```text
    edit → state.dirty=true → effect scheduleAutosave(1000ms) | leaveInsert | switchNote | exit | :w
         → effect write(path, text, expectedStamp) → atomicWrite: realpath → tmp in same dir → write → fsync → chmod → rename
         → record ownWrite(path, stamp) → dispatch(saved(stamp))
    watcher(dir) event → stat+hash → ownWrite? ignore
                                   → buffer clean → dispatch(reload(text)) → undoable reload
                                   → buffer dirty → dispatch(conflict) → prompt: keep mine | take disk | view diff
    ```

  - **Failure and recovery:** write fails (permission, disk full) → buffer stays dirty, status shows `save failed: <reason>`, autosave retries with backoff (1 s, 2 s, 4 s, max 30 s); `:w` retries immediately. Rename failure leaves the temp file removed and the original intact.
  - **Contracts and state:** FileEvent; BufferState.stamp
  - **Control flow:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`

- **Follow, complete, and rename links**
  - **Decisions:** RM261003ABZP-DES7@R1
  - **Participants:** `update` → `resolveLink(index, sourcePath, target)` → open buffer + jump; `planRename(index, from, to)` → `write` effects
  - **Flow:**

    ```text
    gd on [[plan#Goals]] → resolveLink → {path:"projects/plan.md", heading:"Goals"} → push jumplist → open → cursor at heading
                         → unresolved → prompt "Create projects/plan.md?" → create effect
    rename a.md → b.md → planRename → [{path, edits[]}…] → apply to open buffers in memory + write effects for closed files
                       → fs rename → notify "12 files updated"
    ```

  - **Failure and recovery:** a link-rewrite write fails → remaining writes continue; failures are listed in a notification with paths; the rename itself is rolled back only if the file rename failed (links already rewritten are reported, not reverted).
  - **Contracts and state:** NoteIndex; LinkTarget
  - **Control flow:** `src/core/index/resolve.ts` `resolveLink`; `src/core/index/rename.ts` `planRename`

- **Preview**
  - **Decisions:** RM261003ABZP-DES13@R1
  - **Participants:** `:Preview` → effect `startPreview` → `preview/server` → browser; store change (active doc or version) → SSE event → page fetches `/render`
  - **Flow:**

    ```text
    :Preview → Bun.serve({hostname:"127.0.0.1", port:0}) → open http://127.0.0.1:<port>/
    page → GET /events (SSE) ; edit → debounce 100 ms → event "doc" {path, version, anchor}
    page → GET /render?path=… → renderHtml(doc) → swap <main>, scroll to anchor
    any request with bad Host → 403 ; /file/<p> → realpath ⊂ workspace & not hidden? → bytes : 404
    ```

  - **Failure and recovery:** port bind fails → notify; browser cannot open → notify the URL; SSE drop → browser auto-reconnects and refetches.
  - **Contracts and state:** Preview HTTP routes
  - **Control flow:** `src/preview/server.ts` `startPreview`

## Contracts, Data, and State

- **Action and Effect protocol — State model**
  - **Decisions:** RM261003ABZP-DES2@R1
  - **Purpose:** the only way state changes and the only way side effects start.
  - **Participants:** ui, workspace, preview, timers → `Action` → `update` → `Effect[]` → app effect runner → result `Action`
  - **Meaning:** `Action` is a discriminated union (`key`, `mouse`, `resize`, `fileLoaded`, `saved`, `saveFailed`, `fileChanged`, `indexBatch`, `searchResults`, `timer`, …). `Effect` is a discriminated union (`read`, `write`, `create`, `rename`, `move`, `trash`, `startTimer`, `cancelTimer`, `clipboardWrite`, `clipboardRead`, `search`, `startPreview`, `stopPreview`, `openUrl`, `saveState`, `exit`).
  - **Ownership and lifecycle:** core defines both unions; app runs effects; every effect that can fail returns a success or failure action.
  - **Invariants:** `update` is pure and synchronous; no effect runs inside `update`; effects carry all data they need (no callbacks).
  - **State flow:**

    ```text
    Action → update → (State', Effect[]) → runEffect → Action …
    ```

  - **Shape:** `src/core/state/types.ts`

- **AppState — State model**
  - **Decisions:** RM261003ABZP-DES2@R1, RM261003ABZP-DES3@R1, RM261003ABZP-DES10@R1
  - **Purpose:** single source of truth for everything visible.
  - **Participants:** `update` (owner) → ui/preview (readers)
  - **Meaning:** `workspace` (root, tree), `buffers` (by id: path, TextBuffer, doc, stamp, dirty, mode view live|source|reading), `windows` (split tree, active, per-window cursor and scroll), `vim` (mode, pending keys, registers, last change, search), `panels` (explorer, side panel kind), `overlay` (none | picker | whichKey | palette | prompt | help | conflict), `index` (NoteIndex + status), `notifications`, `config`, `jumps`, `preview` (off | on(port)).
  - **Ownership and lifecycle:** created at startup from config + state file; `jumps` and recent notes persisted through `saveState` effects (debounced 2 s and on exit).
  - **Invariants:** one active window; each window references an open buffer; a buffer with `dirty=false` matches its last saved stamp.
  - **State flow:** `None — plain value replaced by update`
  - **Shape:** `src/core/state/types.ts` `AppState`

- **TextBuffer — Data model**
  - **Decisions:** RM261003ABZP-DES3@R1
  - **Purpose:** text storage and edit primitives behind a stable interface.
  - **Participants:** vim engine, rename planner, template insertion → `TextBuffer` → markdown parser
  - **Meaning:** lines array, version number, `apply(edit)` returning a new buffer and the inverse edit; positions are `{line, col}` in UTF-16 code units aligned to grapheme boundaries.
  - **Ownership and lifecycle:** owned by a buffer entry; replaced on each edit (structural sharing of untouched lines).
  - **Invariants:** at least one line; line separators normalized to `\n` in memory, original separator (`\n`/`\r\n`) and trailing newline restored on save.
  - **State flow:** `None`
  - **Shape:** `src/core/editor/text-buffer.ts`

- **Doc model — Data model**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Purpose:** parsed Markdown shared by live preview, index summaries, and HTML preview.
  - **Participants:** `parseDoc` → `Doc` → layout, `summarize`, `renderHtml`
  - **Meaning:** `Doc { frontmatter?, blocks: Block[] }`; `Block { id, kind, startLine, endLine, hash, node }` where `node` is mdast extended with Obsidian nodes (`wikiLink`, `embed`, `tag`, `highlight`, `comment`, `callout`, `blockId`, `footnote*`, `math`).
  - **Ownership and lifecycle:** recomputed per buffer version; unchanged blocks reused by hash.
  - **Invariants:** blocks cover the document without overlap; a fenced code block or frontmatter is never split.
  - **State flow:** `None`
  - **Shape:** `src/core/markdown/doc.ts`

- **RenderLine model — Data model**
  - **Decisions:** RM261003ABZP-DES9@R1
  - **Purpose:** UI-independent description of one screen row.
  - **Participants:** `layoutViewport` → `RenderLine[]` → `EditorView`
  - **Meaning:** `RenderLine { sourceLine, spans: {text, style: StyleToken, link?}[], widget?: {kind:"image"|"embed"|"base"|"rule", ref, rows} , reveal: boolean }`; `StyleToken` names a theme token (`heading1`, `bold`, `link`, `tag`, `codeKeyword`, …), never a colour.
  - **Ownership and lifecycle:** computed per frame for visible rows only.
  - **Invariants:** cursor column maps back to a source column through `spans` offsets; widget rows are counted in scroll math.
  - **State flow:** `None`
  - **Shape:** `src/core/layout/types.ts`

- **NoteSummary and NoteIndex — Data model**
  - **Decisions:** RM261003ABZP-DES7@R1
  - **Purpose:** workspace-wide link, tag, heading, and block knowledge.
  - **Participants:** worker `summarize` → `NoteSummary` → main `NoteIndex.apply`
  - **Meaning:** `NoteSummary { path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind:"wiki"|"md"|"embed"}], frontmatter }`. `NoteIndex` holds summaries by path plus derived maps: basename → paths, alias → paths, tag → paths, target path → backlinks.
  - **Ownership and lifecycle:** built at startup by the worker; updated per file event and per buffer save; never persisted.
  - **Invariants:** derived maps are rebuilt only for changed paths; resolution order is fixed (RM261003ABZP-DES7@R1).
  - **State flow:** `empty → indexing(n/total) → ready → (fileEvent) ready`
  - **Shape:** `src/core/index/note-index.ts`

- **Preview HTTP routes — API**
  - **Decisions:** RM261003ABZP-DES13@R1
  - **Purpose:** read-only browser preview.
  - **Participants:** browser → `preview/server` → core `renderHtml`
  - **Meaning:** `GET /` page shell; `GET /events` SSE (`doc` events with `{path, version, anchor}`); `GET /render?path=` HTML fragment; `GET /file/<path>` workspace asset bytes.
  - **Ownership and lifecycle:** exists only between `:Preview` and `:PreviewStop` or exit.
  - **Invariants:** hostname `127.0.0.1`; Host header ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403; realpath containment else 404; no mutating routes.
  - **State flow:** `off → on(port) → off`
  - **Shape:** `src/preview/server.ts`

- **AppConfig — Data model**
  - **Decisions:** RM261003ABZP-DES14@R1
  - **Purpose:** user options and keymap overrides.
  - **Participants:** `config-file.loadConfig` → `ConfigSchema` (zod) → `AppState.config`
  - **Meaning:** `leader`, `escTimeoutMs` (50), `autosave` (`{ enabled: true, delayMs: 1000 }`), `editor` (`tabWidth`, `wrap`, `relativeNumbers`), `preview` (`mode: "live"`, `embedMaxRows`, `images: "auto"|"blocks"|"off"`), `daily` (`folder`, `format`, `template`), `templates.folder`, `theme`, `color` (overrides `NO_COLOR`), `keys.<mode>` (`"<key-seq>" = "<command-id>"`).
  - **Ownership and lifecycle:** read at startup and on `:ConfigReload`.
  - **Invariants:** unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
  - **State flow:** `None`
  - **Shape:** `src/core/config/schema.ts`

## Detailed Code Design

- **`src/core/state/update.ts`**
  - **Decisions:** RM261003ABZP-DES2@R1
  - **Change:** Add
  - **Responsibilities:** reducer entry; routes actions to feature reducers.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };

    export const update: Update = (state, action) => {
      switch (action.type) {
        case "key":        return handleKeyAction(state, action.key);   // keymap → command or vim edit
        case "fileChanged":return handleFileChanged(state, action);     // reload | conflict | ignore
        case "indexBatch": return { state: withIndex(state, action.summaries), effects: [] };
        // … one case per Action variant; feature logic lives in feature modules
      }
    };

    export function createStore(initial: AppState, run: (e: Effect) => void) {
      let state = initial; const subs = new Set<(s: AppState) => void>();
      return {
        get: () => state,
        dispatch(action: Action) { const r = update(state, action); state = r.state; r.effects.forEach(run); subs.forEach((f) => f(state)); },
        subscribe(f: (s: AppState) => void) { subs.add(f); return () => subs.delete(f); },
      };
    }
    ```

    `update` routes; `createStore` is the only mutable cell. The switch dispatches on a closed Action union (core protocol, not an extension point); commands extend through the registry instead.

  - **Dependencies:** Action and Effect protocol; CommandRegistry
  - **Callers and wiring:** `app/main.ts` creates the store with `runEffect`; ui and preview subscribe.
  - **Invariants:** pure; no `Date.now()` — time arrives in actions.
  - **Verification:** RM261003ABZP-S11@R1, RM261003ABZP-V15@R1

- **`src/core/commands/registry.ts`**
  - **Decisions:** RM261003ABZP-DES5@R1
  - **Change:** Add
  - **Responsibilities:** named commands, keymap trie, which-key and palette data, config overrides.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Command = {
      id: string;                       // "file.find", "note.today", "link.follow"
      title: string;                    // shown in palette and which-key
      group?: string;                   // which-key group: "find", "note", "buffer"
      run: (ctx: CommandContext, args?: string) => { state: AppState; effects: Effect[] };
    };
    export type Mode = "normal" | "insert" | "visual" | "cmdline" | "explorer" | "picker" | "base";

    export class CommandRegistry { register(cmd: Command): void; get(id: string): Command | undefined; list(): Command[] }

    export class Keymap {
      bind(mode: Mode, seq: string, commandId: string): void;      // "<leader>ff", "gd", "<C-o>"
      lookup(mode: Mode, pending: Key[]): { kind: "command"; id: string } | { kind: "prefix"; next: WhichKeyItem[] } | { kind: "none" };
    }
    ```

    Features call `registry.register` and `keymap.bind` at startup from their own module (`src/core/notes/commands.ts`, …). Which-key reads `lookup(...).next`; the palette reads `list()`. Config `keys.<mode>` rebinds by command id.

  - **Dependencies:** AppState
  - **Callers and wiring:** `core/commands/defaults.ts` registers built-ins; `app/main.ts` applies config overrides.
  - **Invariants:** duplicate ids throw at startup; binding an unknown id is a config error, not a crash.
  - **Verification:** RM261003ABZP-S3@R1, RM261003ABZP-V4@R1; RM261003ABZP-S11@R1, RM261003ABZP-V16@R1

- **`src/core/editor/text-buffer.ts` and `src/core/vim/engine.ts`**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Change:** Add (vim engine redesigned from `alfred/apps/tui/src/view/editor/vim.ts`)
  - **Responsibilities:** buffer primitives; vim grammar `[count]["x][count]operator[count](motion|textobject)`.
  - **Current source:** `alfred/apps/tui/src/view/editor/vim.ts:15-40` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    export type VimMode = "normal" | "insert";
    export type VimEffect = "changed" | "insert-exited" | "toggle-mode" | "leave";
    export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
    ```

    Alfred's engine is pure with effects but supports two modes and a hard-coded pending set.

  - **Proposed shape:**

    ```ts
    export interface TextBuffer {
      readonly version: number; readonly lineCount: number;
      line(i: number): string;
      apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };     // Edit = { range, text }
      slice(range: Range): string;
    }

    export type Motion = (buf: TextBuffer, at: Pos, count: number, ctx: MotionCtx) => { to: Pos; linewise: boolean; inclusive: boolean } | null;
    export type TextObject = (buf: TextBuffer, at: Pos, count: number) => Range | null;
    export const motions: Record<string, Motion>;       // "w","b","e","gg","G","f",… registered by key
    export const textObjects: Record<string, TextObject>; // "iw","a(","ip",…

    export function handleKey(s: BufferVim, key: Key, env: VimEnv): { s: BufferVim; effects: VimEffect[] };
    // VimEffect: { kind:"yank", register, text } | { kind:"changed" } | { kind:"modeChanged", mode } | { kind:"ex", line } | { kind:"search", pattern, dir }
    ```

    The parser accumulates keys into a pending command; when complete it resolves the motion or text object by table lookup, applies the operator, and records an undo block and last-change for `.`. Insert mode collects edits into one undo block until `Esc`.

  - **Dependencies:** TextBuffer; registers in AppState
  - **Callers and wiring:** `update` → `handleKeyAction` → `handleKey` when no keymap binding matches in normal/visual/insert mode.
  - **Invariants:** an operator with a failed motion is a no-op; counts multiply (`2d3w` = `d6w`); undo restores cursor.
  - **Verification:** RM261003ABZP-S2@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1

- **`src/core/markdown/doc.ts`**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Change:** Add (ported from `alfred/apps/tui/src/view/markdown/parse.ts` and `alfred/packages/view-model/src/markdown/obsidian-syntax.ts`)
  - **Responsibilities:** split into blocks, parse each block with micromark + GFM + math + Obsidian extensions, reuse unchanged blocks.
  - **Current source:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` (imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math`)
  - **Current shape:**

    ```ts
    // Alfred parses the whole document per render and post-processes Obsidian syntax with regexes from obsidian-syntax.ts
    export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    ```

    Whole-document parse; Obsidian syntax by regex over text nodes.

  - **Proposed shape:**

    ```ts
    export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; node: MdNode };
    export type Doc = { version: number; frontmatter?: Frontmatter; blocks: Block[] };

    export function splitBlocks(buf: TextBuffer): { startLine: number; endLine: number }[]; // blank-line bounded; fences, frontmatter, $$ kept whole; lists kept whole
    export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;   // reparse only ranges whose hash changed
    export const syntaxExtensions: SyntaxExtension[];             // wikiLink, embed, tag, highlight, comment, callout, blockId — registration point
    ```

    Block-level reparse keeps per-keystroke work proportional to the edited block (`RM261003ABZP-RF7`). Obsidian syntax is applied as mdast transforms registered in `syntaxExtensions`.

  - **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`
  - **Callers and wiring:** `update` after edits; worker `summarize`; preview `renderHtml`.
  - **Invariants:** `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally (cache is transparent).
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R1; RM261003ABZP-S9@R1, RM261003ABZP-V12@R1

- **`src/core/layout/layout.ts`**
  - **Decisions:** RM261003ABZP-DES9@R1
  - **Change:** Add (adapted from `alfred/apps/tui/src/view/markdown/layout.ts` and `alfred/apps/tui/src/view/editor/reveal-units.ts`)
  - **Responsibilities:** visible-row layout with reveal rules and block renderers.
  - **Current source:** `alfred/apps/tui/src/view/editor/reveal-units.ts` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    None — Alfred lays out whole documents for Ink rendering
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    export type LayoutView = { doc: Doc; buf: TextBuffer; width: number; topRow: number; rows: number; cursor: Pos; selection?: Range; mode: "live" | "source" | "reading" };
    export function layoutViewport(v: LayoutView, ctx: LayoutCtx): RenderLine[];
    export type BlockRenderer = (block: Block, v: LayoutView, ctx: LayoutCtx) => RenderLine[];
    export const blockRenderers: Partial<Record<BlockKind, BlockRenderer>>;   // heading, list, table, callout, code, embed, base, math, mermaid …
    ```

    Reveal: the cursor's line shows raw inline syntax; if the cursor is inside a multi-line block (table, callout, code, math, frontmatter) the whole block renders as source. Rows outside the viewport are never laid out; a per-block row-height cache gives scroll positions.

  - **Dependencies:** Doc model; theme tokens; `lowlight` for code tokens; ported math and mermaid text renderers
  - **Callers and wiring:** `ui/editor-view.ts` per frame.
  - **Invariants:** `mode: "source"` returns raw lines with syntax tokens only; reading mode never reveals.
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R1, RM261003ABZP-V8@R1

- **`src/core/index/resolve.ts` and `src/core/index/rename.ts`**
  - **Decisions:** RM261003ABZP-DES7@R1
  - **Change:** Add
  - **Responsibilities:** deterministic link resolution; format-preserving rename planning.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function resolveLink(ix: NoteIndex, from: string, raw: string): LinkTarget | { unresolved: string };
    // order: exact root path (with/without .md) → alias → basename candidates ranked by
    //        (same folder as `from`) → (shortest path) → (alphabetical)
    export function planRename(ix: NoteIndex, from: string, to: string, read: (p: string) => string): FileEdit[];
    // keeps link kind (wiki/md), alias, #heading / #^block; writes the shortest unique form of `to`
    ```

  - **Dependencies:** NoteIndex
  - **Callers and wiring:** `link.follow`, completion, backlinks, `file.rename`, `file.move` commands.
  - **Invariants:** resolution is a pure function of index contents; rename never touches text outside link spans.
  - **Verification:** RM261003ABZP-S4@R1, RM261003ABZP-V5@R1, RM261003ABZP-V6@R1

- **`src/workspace/fs.ts` and `src/workspace/watcher.ts`**
  - **Decisions:** RM261003ABZP-DES8@R1
  - **Change:** Add
  - **Responsibilities:** atomic writes and directory watching with own-write suppression.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export async function atomicWrite(path: string, text: string): Promise<Stamp> {
      const target = await realpathOrSelf(path);
      const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
      const fd = await open(tmp, "w", await modeOr(target, 0o644));
      try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp, target);                     // same directory → atomic on POSIX
      return stampOf(target, text);                  // { mtimeMs, size, hash }
    }
    export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
    // fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
    ```

  - **Dependencies:** `node:fs/promises`, `node:fs` (Bun-compatible)
  - **Callers and wiring:** effect runner for `write`, `create`, `rename`, `move`; `main` starts the watcher.
  - **Invariants:** temp files never appear in the index (prefix `.` is hidden); a failed write deletes its temp file.
  - **Verification:** RM261003ABZP-S1@R1, RM261003ABZP-V1@R1

- **`src/ui/editor-view.ts` and `src/ui/input.ts`**
  - **Decisions:** RM261003ABZP-DES10@R1, RM261003ABZP-DES9@R1
  - **Change:** Add
  - **Responsibilities:** paint RenderLine rows onto an OpenTUI buffer; place images; normalize input.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    // Only file family allowed to import @opentui/*
    export class EditorView extends Renderable {           // custom renderable, not Textarea
      constructor(ctx: RenderContext, private getView: () => LayoutView) { super(ctx, { flexGrow: 1 }); }
      protected renderSelf(buf: OptimizedBuffer) {
        for (const [row, line] of layoutViewport(this.getView(), layoutCtx).entries()) paintLine(buf, row, line, theme);
      }
    }
    export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via escTimeoutMs
    ```

    Exact OpenTUI buffer and image APIs are confirmed against the pinned version in the first delivery item (the class above is illustrative).

  - **Dependencies:** `@opentui/core` (exact pin)
  - **Callers and wiring:** `ui/shell.ts` composes views; store subscription triggers `requestRender()`.
  - **Invariants:** UI never mutates AppState; all input becomes Actions.
  - **Verification:** RM261003ABZP-S9@R1, RM261003ABZP-V12@R1; RM261003ABZP-S11@R1, RM261003ABZP-V17@R1

- **`src/preview/server.ts`**
  - **Decisions:** RM261003ABZP-DES13@R1
  - **Change:** Add
  - **Responsibilities:** read-only preview server.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function startPreview(store: Store, root: string): { port: number; stop(): void } {
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0,
        fetch(req) {
          const host = req.headers.get("host");
          if (host !== `127.0.0.1:${server.port}` && host !== `localhost:${server.port}`) return new Response(null, { status: 403 });
          return route(req, store, root);              // "/", "/events", "/render", "/file/*"
        },
      });
      return { port: server.port, stop: () => server.stop(true) };
    }
    ```

  - **Dependencies:** `Bun.serve`; core `renderHtml`
  - **Callers and wiring:** effect runner for `startPreview`/`stopPreview`.
  - **Invariants:** no write routes; `/file/*` passes realpath containment and hidden-folder exclusion.
  - **Verification:** RM261003ABZP-S8@R1, RM261003ABZP-V11@R1

## Cross-cutting and Evolution

| Concern | Mechanism and canonical design location | Verification or reason not applicable |
|---|---|---|
| Security and privacy | No network except loopback preview with Host allowlist and realpath containment (RM261003ABZP-DES13@R1); config is data (TOML), never executed (RM261003ABZP-DES14@R1); no telemetry; notes never logged | RM261003ABZP-V11@R1 |
| Configuration and observability | XDG TOML config validated by schema; errors as notifications; `so --version`; `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content (RM261003ABZP-DES14@R1) | RM261003ABZP-V4@R1 |
| Performance and scalability | Viewport-only layout, block parse cache, worker index and search, frame coalescing, lazy image decode with cache (RM261003ABZP-DES16@R1) | RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 |
| Concurrency, retry, and idempotency | Single-threaded store; worker communicates by messages; saves serialized per path; autosave retry with backoff; own-write stamps make watcher events idempotent (RM261003ABZP-DES8@R1) | RM261003ABZP-V1@R1 |
| Migration and backfill | None — greenfield; Obsidian files are read as-is and written in place | None — no prior data format |
| Mixed-version compatibility | Obsidian file compatibility (Markdown, links, frontmatter, `.base`); Kanban `type` constant isolated in `core/bases/types.ts` and verified against an Obsidian-saved file (RM261003ABZP-DES12@R1) | RM261003ABZP-V10@R1 |
| Rollout and rollback | SemVer releases via release-please; users roll back by installing a previous release binary (RM261003ABZP-DES15@R1) | RM261003ABZP-V14@R1 |
| Known extension needs | Registries: commands and keymaps (DES5), syntax extensions (DES6), block renderers (DES9), Bases view types (DES12) — RM261003ABZP-REQ11@R2 | RM261003ABZP-V16@R1 |

- **System transition:**

```text
empty repo → scaffold (tooling, CI, boundary test, shell) → editor usable → knowledge features → release binaries
                                  └→ rollback: previous release binary; files are plain Markdown, no state migration
```

- **Delivery constraints:** the boundary test and CI exist before feature code so violations never land; the OpenTUI paint and image APIs are confirmed against the pinned version before live-preview work depends on them; the Kanban `type` value is confirmed before Kanban ships.

## Success and Verification

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** This document
  - **Outcome:** across crash, external edit, and save failure scenarios, the file on disk is always a complete old or new version and dirty buffers are never overwritten without a prompt.
  - **Requirements:** RM261003ABZP-REQ1@R2
  - **Design:** RM261003ABZP-DES8@R1 - atomic write, own-write suppression, conflict rules
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S1@R1
      - **Scenario:** in a temp workspace: (a) kill the writer between write and rename (simulated by throwing after fsync); (b) modify an open clean file externally; (c) modify an open dirty file externally; (d) save `so`'s own buffer.
      - **Expected result:** (a) original content intact, no temp file left; (b) buffer reloads and `u` restores previous text; (c) conflict prompt appears, file and buffer unchanged until chosen; (d) no reload or conflict triggered.
      - **Method and target:** integration test on `workspace/fs.ts`, `workspace/watcher.ts`, and `core` conflict reducer
      - **Environment:** real file system (tmpdir), real `fs.watch`
      - **Unique risk:** per-file watch losing events after rename; self-triggered reload loops; partial writes.
      - **Predecessors:** None

- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** This document
  - **Outcome:** every command listed in RM261003ABZP-REQ2@R2 produces Neovim's result on the shared fixture cases.
  - **Requirements:** RM261003ABZP-REQ2@R2
  - **Design:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 - grammar, undo blocks, dot-repeat
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** table of `{ before text + cursor, keys, after text + cursor + register }` cases covering each motion, operator, text object, count, register, search, `:s`, undo/redo, and `.`; expected values recorded from Neovim 0.11 `--clean`.
      - **Expected result:** each case matches exactly.
      - **Method and target:** unit tests on `core/vim/engine.ts` `handleKey`
      - **Environment:** None — pure functions
      - **Unique risk:** subtle divergence (inclusive/exclusive motions, linewise yanks, cursor after undo).
      - **Predecessors:** None
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** feed a lone `\x1b` byte without kitty protocol, then `\x1b[A`, through `ui/input.normalizeKey` with `escTimeoutMs=50`.
      - **Expected result:** lone Esc yields `escape` after 50 ms ± 10 ms; the sequence yields `up` immediately.
      - **Method and target:** unit test on `ui/input.ts`
      - **Environment:** fake timers
      - **Unique risk:** Esc swallowed or arrow keys misread as Esc + letters.
      - **Predecessors:** None

- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** This document
  - **Outcome:** every command is reachable by name in the palette, leader sequences show which-key hints, pickers filter fuzzily, and config overrides apply or fail safely.
  - **Requirements:** RM261003ABZP-REQ3@R3
  - **Design:** RM261003ABZP-DES5@R1, RM261003ABZP-DES14@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V4@R1 — Keymap, which-key, palette, and config**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S3@R1
      - **Scenario:** (a) press `Space` and wait; (b) bind `"<leader>w" = "file.save"` in config and press it; (c) load a config with a syntax error on line 7; (d) set `XDG_CONFIG_HOME=relative/path`; (e) open the palette and type `today`.
      - **Expected result:** (a) which-key lists groups; (b) file saved; (c) notification names `config.toml:7` and defaults apply; (d) `~/.config/so/config.toml` used; (e) `note.today` ranks first.
      - **Method and target:** unit tests on `core/commands`, `workspace/config-file.ts`; component test through the OpenTUI test renderer for (a)
      - **Environment:** tmp config dirs; OpenTUI test renderer
      - **Unique risk:** config error crashing startup; overrides silently ignored.
      - **Predecessors:** None

- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** This document
  - **Outcome:** link following, completion, backlinks, and tags match the index; rename updates every reference while preserving format.
  - **Requirements:** RM261003ABZP-REQ4@R2
  - **Design:** RM261003ABZP-DES7@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** workspace with `a/plan.md`, `b/plan.md`, `plan-x.md` (alias `plan`), `c/deep/plan.md`; resolve `[[plan]]` from `a/x.md`, from `root.md`, `[[b/plan]]`, `[[plan.md]]`, `[[note#H1#H2]]`, `[text](a/plan%20x.md)`.
      - **Expected result:** results follow the documented order exactly.
      - **Method and target:** unit tests on `core/index/resolve.ts`
      - **Environment:** None — in-memory index
      - **Unique risk:** nondeterministic or Obsidian-incompatible targets.
      - **Predecessors:** None
    - **RM261003ABZP-V6@R1 — Rename preserves link formats**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** rename `plan.md` → `projects/roadmap.md` with references `[[plan]]`, `[[plan|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)`, frontmatter `related: "[[plan]]"`, and an open dirty buffer containing `[[plan]]`.
      - **Expected result:** all rewritten in place with kind, alias, subpath preserved and shortest unique path; the dirty buffer is edited in memory (not overwritten on disk); notification reports the file count.
      - **Method and target:** unit test on `planRename` + integration test of the rename command
      - **Environment:** tmp workspace
      - **Unique risk:** broken links or clobbered unsaved edits.
      - **Predecessors:** None

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** This document
  - **Outcome:** each element listed in RM261003ABZP-REQ5@R2 renders as specified, reveal follows the cursor line or block, and images use the best available protocol.
  - **Requirements:** RM261003ABZP-REQ5@R2
  - **Design:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES10@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V7@R1 — Layout golden tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** `test/fixtures/tour.md` (every element) laid out at widths 60 and 100 with the cursor outside any block, on a bold line, inside a table, inside a callout.
      - **Expected result:** `RenderLine[]` serialized to text + style tokens matches committed goldens.
      - **Method and target:** unit tests on `layoutViewport`
      - **Environment:** None — pure
      - **Unique risk:** reveal or hiding regressions; broken table alignment.
      - **Predecessors:** None
    - **RM261003ABZP-V8@R1 — Image protocol selection**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** render a note with a PNG in the OpenTUI test renderer with capabilities kitty / sixel / none / `images="off"`.
      - **Expected result:** kitty or sixel placement, block characters, or `[image: name.png]` placeholder respectively.
      - **Method and target:** component test on `ui/editor-view.ts`
      - **Environment:** OpenTUI test renderer with mocked capabilities
      - **Unique risk:** images breaking layout or crashing on unsupported terminals.
      - **Predecessors:** None

- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** This document
  - **Outcome:** `:Today` and template insertion produce the same text Obsidian's core plugins would for the supported tokens.
  - **Requirements:** RM261003ABZP-REQ6@R2
  - **Design:** RM261003ABZP-DES11@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S6@R1
      - **Scenario:** format 2026-10-03T09:05 with every supported token and `[literal]`; expand a template containing all variables; compute daily paths for `YYYY-MM-DD` and `YYYY/MM/YYYY-MM-DD`; run `:Today` twice.
      - **Expected result:** strings equal Moment.js output for the same tokens; unsupported tokens stay literal; second `:Today` opens the existing file without changing it.
      - **Method and target:** unit tests on `core/time`, `core/notes`; integration test for `:Today`
      - **Environment:** fixed clock; tmp workspace
      - **Unique risk:** wrong dates, overwritten daily notes.
      - **Predecessors:** None

- **RM261003ABZP-S7@R1 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** This document
  - **Outcome:** table and Kanban views show the correct rows, edits write valid frontmatter, and unsupported layouts fall back safely.
  - **Requirements:** RM261003ABZP-REQ7@R2
  - **Design:** RM261003ABZP-DES12@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V10@R1 — Bases evaluation, edit, and compatibility**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S7@R1
      - **Scenario:** fixtures ported from Alfred's Bases tests plus a Kanban `.base` saved by Obsidian 1.14+; edit a cell; move a card; open a `cards` view; group by a formula.
      - **Expected result:** rows and order match fixtures; frontmatter patched with comments and order preserved; card move sets the property; `cards` opens as table with notice; moving is disabled for formula grouping.
      - **Method and target:** unit tests on `core/bases`; integration test of write-back
      - **Environment:** tmp workspace
      - **Unique risk:** YAML corruption; Kanban type mismatch with Obsidian.
      - **Predecessors:** None

- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** This document
  - **Outcome:** the browser follows edits within 300 ms and the server rejects foreign hosts and out-of-workspace paths.
  - **Requirements:** RM261003ABZP-REQ8@R2
  - **Design:** RM261003ABZP-DES13@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V11@R1 — Preview server behavior and safety**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S8@R1
      - **Scenario:** start preview; request with Host `evil.test:<port>`; request `/file/..%2f..%2fetc/passwd`; request a symlink pointing outside; request `/file/.git/config`; dispatch an edit and measure time to the SSE event.
      - **Expected result:** 403; 404; 404; 404; SSE event < 300 ms after the edit; server bound only to 127.0.0.1.
      - **Method and target:** integration test on `preview/server.ts`
      - **Environment:** real `Bun.serve`, tmp workspace with symlink
      - **Unique risk:** DNS rebinding, traversal, network exposure.
      - **Predecessors:** None

- **RM261003ABZP-S9@R1 — Performance targets hold**
  - **Definition:** This document
  - **Outcome:** the targets in RM261003ABZP-REQ9@R2 are met on the reference machine and gated at 2× in CI.
  - **Requirements:** RM261003ABZP-REQ9@R2
  - **Design:** RM261003ABZP-DES16@R1, RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES7@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V12@R1 — Keystroke and open-note benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** open the 5,000-line fixture in live preview in the OpenTUI test renderer (120×40); send 200 mixed keystrokes (`j`, `w`, `i` + text + `Esc`, `dd`, `u`); measure input → frame complete; measure open time.
      - **Expected result:** p95 < 16 ms and open < 50 ms on the reference machine; CI median of 5 runs < 32 ms and < 100 ms.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** OpenTUI test renderer; fixed CI runner type
      - **Unique risk:** full-document parse or layout sneaking into the keystroke path.
      - **Predecessors:** None
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** generate a 10,000-note workspace; start `so`; record time to first interactive frame and to index ready; type during indexing.
      - **Expected result:** first frame < 200 ms; index ready < 3 s; keystrokes during indexing still meet the V12 budget.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** generated fixture; real worker
      - **Unique risk:** indexing blocking the main thread.
      - **Predecessors:** None

- **RM261003ABZP-S10@R1 — Development, CI, and release are fast and automatic**
  - **Definition:** This document
  - **Outcome:** `bun run check` < 30 s; CI < 3 min; release produces four checksummed binaries that start.
  - **Requirements:** RM261003ABZP-REQ10@R2
  - **Design:** RM261003ABZP-DES15@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V14@R1 — Check timing, CI timing, and release dry run**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S10@R1
      - **Scenario:** time `bun run check` locally; read CI run durations; run the release workflow on a pre-release tag.
      - **Expected result:** < 30 s; < 3 min; GitHub Release with 4 binaries + `SHA256SUMS`; smoke jobs print `so <version>` on macOS and Linux.
      - **Method and target:** non-test check on CI and release workflows
      - **Environment:** GitHub Actions
      - **Unique risk:** slow feedback loops; binaries missing OpenTUI's native library.
      - **Predecessors:** None

- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored**
  - **Definition:** This document
  - **Outcome:** boundary violations fail CI; features extend by registration; terminal state is restored on every exit path; standards are followed.
  - **Requirements:** RM261003ABZP-REQ11@R2
  - **Design:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R1, RM261003ABZP-DES5@R1, RM261003ABZP-DES10@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V15@R1 — Import boundary test**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** scan every `src/**/*.ts` with `Bun.Transpiler.scanImports`; include a deliberate violation fixture.
      - **Expected result:** core imports only core and allowed parsing packages; only `src/ui/**` imports `@opentui/*`; the fixture fails.
      - **Method and target:** `test/boundaries.test.ts`
      - **Environment:** None
      - **Unique risk:** layering eroding silently.
      - **Predecessors:** None
    - **RM261003ABZP-V16@R1 — Registration-only extension**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** a test module registers a command, a keymap, a syntax extension, and a block renderer without touching other modules.
      - **Expected result:** the command runs from the palette and keymap; the syntax renders through the renderer.
      - **Method and target:** unit test across `core/commands`, `core/markdown`, `core/layout`
      - **Environment:** None
      - **Unique risk:** hidden switch statements that require edits to extend.
      - **Predecessors:** None
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** in a PTY, start `so`, then exit by `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception; set `NO_COLOR=1` in one run.
      - **Expected result:** after each exit the PTY is back on the main screen with cursor visible, mouse and kitty keyboard modes off; the `NO_COLOR` run emits no colour SGR codes.
      - **Method and target:** e2e PTY test in `test/e2e/`
      - **Environment:** real PTY (`Bun.spawn` with a pseudo-terminal), headless terminal emulator to read state
      - **Unique risk:** leaving the user's terminal broken.
      - **Predecessors:** None

## Design Decisions and Traceability

- **RM261003ABZP-DES1@R1 — One process, one package, four layers with a tested import boundary**
  - **Requirements:** RM261003ABZP-REQ11@R2 - pure core, enforced boundaries; RM261003ABZP-REQ10@R2 - fast checks
  - **Decision:** `src/core` (pure), `src/workspace` (I/O), `src/ui` (OpenTUI), `src/preview` (HTTP), wired only in `src/app`. A `bun test` boundary test using `Bun.Transpiler.scanImports` enforces the import rules.
  - **Explanation:** System Architecture diagram; `test/boundaries.test.ts`. One package keeps install and CI fast; the test needs no TypeScript API (`RM261003ABZP-RF13`).
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred needed six packages because of its kernel; `so` has no server boundary.
  - **Research:** `RM261003ABZP-RF1` - contain OpenTUI to the UI layer; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2. `RM261003ABZP-RF13` - avoid TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Tradeoffs:** folder conventions rather than package boundaries; rejected a Turborepo monorepo (slower, more config) and dependency-cruiser (TS 7 issue).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES2@R1 — One store with a pure reducer and data-only effects**
  - **Requirements:** RM261003ABZP-REQ11@R2 - stable, testable foundations; RM261003ABZP-REQ1@R2 - autosave and conflicts; RM261003ABZP-REQ9@R2 - predictable rendering
  - **Decision:** `update(state, action) → { state, effects }`; effects are plain data executed by `app/effects.ts`; results return as actions.
  - **Explanation:** Action and Effect protocol; AppState; `src/core/state/update.ts`. Every behavior (autosave timing, conflict choice, rename) is a pure function test.
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts` - Alfred's vim core already returns effects instead of performing them.
  - **Research:** None
  - **Tradeoffs:** an extra indirection for I/O; rejected UI components holding state (hard to test, the Ink/React pattern Alfred needed a compositor around).
  - **Dependencies:** RM261003ABZP-DES1@R1
  - **Predecessors:** None

- **RM261003ABZP-DES3@R1 — Line-array TextBuffer behind an interface, with vim undo blocks**
  - **Requirements:** RM261003ABZP-REQ2@R2 - undo per undo block; RM261003ABZP-REQ9@R2 - 5,000-line target
  - **Decision:** immutable line array with structural sharing; `apply(edit)` returns an inverse; undo stack of blocks (one Normal command or one Insert session).
  - **Explanation:** TextBuffer model; `src/core/editor/text-buffer.ts`. A piece table can replace the implementation without changing callers.
  - **Evidence:** `alfred/apps/tui/src/view/editor/text-buffer.ts` - single-string buffer (186 lines) as reference.
  - **Research:** `RM261003ABZP-RF6` - line array adequate at ≤ 5,000 lines; undo block = typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** O(lines) splices on huge files; rejected OpenTUI's native `EditBuffer` as source of truth (couples core to a 0.x UI library).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES4@R1 — Table-driven vim engine**
  - **Requirements:** RM261003ABZP-REQ2@R2 - core vim command set, Esc timeout
  - **Decision:** a pure key-sequence parser for `[count]["reg][count]op[count](motion|textobject)` with motion, operator, and text-object tables; mode machine (normal, insert, visual char/line, cmdline); last-change record for `.`; ex command table.
  - **Explanation:** `src/core/vim/engine.ts`; Esc timeout handled in `ui/input.ts` (RM261003ABZP-DES10@R1).
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts:15` - Alfred supports only two modes with a hard-coded pending set.
  - **Research:** `RM261003ABZP-RF5` - kitty keyboard protocol, 50 ms timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** no macros or Visual block in v1 (deferred); rejected embedding Neovim (user decision).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES5@R1 — Command registry and keymap trie as the single extension point for actions**
  - **Requirements:** RM261003ABZP-REQ3@R3 - leader, which-key, palette, config; RM261003ABZP-REQ11@R2 - extend by registration
  - **Decision:** every action is a named `Command`; keys map to command ids through a per-mode trie; which-key, palette, help, and config overrides read the same registry.
  - **Explanation:** `src/core/commands/registry.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input - LazyVim style.
  - **Research:** None
  - **Tradeoffs:** commands must be pure (state + effects), which forbids quick ad-hoc I/O in commands; accepted for testability.
  - **Dependencies:** RM261003ABZP-DES2@R1
  - **Predecessors:** None

- **RM261003ABZP-DES6@R1 — micromark/mdast with Obsidian extensions and block-level reparse**
  - **Requirements:** RM261003ABZP-REQ4@R2, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2
  - **Decision:** port Alfred's micromark + GFM + math parsing and Obsidian syntax into `core/markdown`; split into blocks and reparse only changed blocks; one `Doc` feeds layout, index, and HTML.
  - **Explanation:** Doc model; `src/core/markdown/doc.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` - existing micromark pipeline.
  - **Research:** `RM261003ABZP-RF7` - micromark conformant but not incremental; block reparse meets budgets; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block splitting must handle lists, fences, and frontmatter carefully; rejected OpenTUI's tree-sitter Markdown (UI-layer dependency, no Obsidian syntax) and Lezer (skips link reference validation; another parser to learn).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES7@R1 — Worker-built in-memory index with a documented resolution rule**
  - **Requirements:** RM261003ABZP-REQ4@R2 - links, backlinks, tags, rename; RM261003ABZP-REQ3@R3 - pickers and full-text search; RM261003ABZP-REQ9@R2 - non-blocking index
  - **Decision:** a Bun `Worker` scans and summarizes notes and answers full-text queries; the main thread holds `NoteIndex` built from summaries; resolution order: root path → alias → basename ranked by same folder, shortest path, alphabetical; `planRename` rewrites link spans only.
  - **Explanation:** NoteSummary and NoteIndex; `resolve.ts`; `rename.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred used SQLite; `so` has no persistence need for the index.
  - **Research:** `RM261003ABZP-RF8` - duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2
  - **Tradeoffs:** reindex on every start (< 3 s target); rejected SQLite (persistence and schema cost without need) and ripgrep (external binary).
  - **Dependencies:** RM261003ABZP-DES6@R1
  - **Predecessors:** None

- **RM261003ABZP-DES8@R1 — Atomic saves, directory watching, own-write stamps, and trash adapters**
  - **Requirements:** RM261003ABZP-REQ1@R2 - safe file management
  - **Decision:** `atomicWrite` (realpath → same-dir temp → fsync → chmod → rename); `fs.watch(root, {recursive:true})` with per-path debounce and own-write stamps; trash via freedesktop spec on Linux and Finder automation (`osascript`) on macOS, else typed confirmation; autosave policy and conflict rules live in core.
  - **Explanation:** `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow.
  - **Evidence:** `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - autosave queue reference.
  - **Research:** `RM261003ABZP-RF11` - fsync, same directory, directory watching, undoable reload; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2
  - **Tradeoffs:** rename-based saves replace hard links (acceptable for notes); recursive `fs.watch` relies on platform support in Bun on macOS and Linux — verified in the first delivery item.
  - **Dependencies:** RM261003ABZP-DES2@R1
  - **Predecessors:** None

- **RM261003ABZP-DES9@R1 — Viewport-only live-preview layout with line and block reveal and registered block renderers**
  - **Requirements:** RM261003ABZP-REQ5@R2 - live preview; RM261003ABZP-REQ9@R2 - smooth scrolling
  - **Decision:** pure `layoutViewport` produces `RenderLine[]` for visible rows only; cursor line reveals inline syntax, cursor inside a multi-line block reveals the whole block; block renderers are registered per block kind; widgets (image, embed, base) reserve rows.
  - **Explanation:** RenderLine model; `src/core/layout/layout.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/editor/reveal-units.ts` - reveal units reference.
  - **Research:** `RM261003ABZP-RF7` - per-element reveal in Obsidian; block reveal for multi-line constructs; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal; rejected OpenTUI `MarkdownRenderable` conceal (UI-owned parsing, no Obsidian syntax).
  - **Dependencies:** RM261003ABZP-DES6@R1
  - **Predecessors:** None

- **RM261003ABZP-DES10@R1 — OpenTUI shell with a custom editor renderable, normalized input, and guaranteed terminal restore**
  - **Requirements:** RM261003ABZP-REQ2@R2 - Esc, cursor shape; RM261003ABZP-REQ3@R3 - explorer, overlays; RM261003ABZP-REQ5@R2 - images; RM261003ABZP-REQ11@R2 - restore, `NO_COLOR`, terminal support
  - **Decision:** `@opentui/core` pinned exactly; layout of explorer, bufferline, window splits, side panel, statusline, cmdline, overlays; a custom `EditorView` renderable paints `RenderLine[]`; images via OpenTUI's auto protocol (kitty → sixel → blocks); input normalized to `Key` with kitty keyboard protocol and Esc timeout; theme tokens with `NO_COLOR`; restore on exit, signals, and uncaught errors.
  - **Explanation:** `src/ui/*`; `src/ui/editor-view.ts`.
  - **Evidence:** `alfred/apps/tui/src/terminal/shutdown.ts` - restore coordinator reference; Context7 `/anomalyco/opentui`.
  - **Research:** `RM261003ABZP-RF1`, `RM261003ABZP-RF2`, `RM261003ABZP-RF4`, `RM261003ABZP-RF5`; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Tradeoffs:** dependence on a 0.x library contained to `src/ui`; rejected Ink (React redraw cost) and a custom renderer (upfront cost).
  - **Dependencies:** RM261003ABZP-DES1@R1, RM261003ABZP-DES9@R1
  - **Predecessors:** None

- **RM261003ABZP-DES11@R1 — Shared Moment-subset formatter, pure template expansion, and daily-note commands**
  - **Requirements:** RM261003ABZP-REQ6@R2 - daily notes and templates; RM261003ABZP-REQ7@R2 - Bases date formatting
  - **Decision:** `core/time/format.ts` implements the documented token subset and `[literal]`; `core/notes` computes daily paths (with `/` subfolders) and expands `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}`; commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`.
  - **Explanation:** `src/core/time/format.ts`; `src/core/notes/*`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input.
  - **Research:** `RM261003ABZP-RF10` - Moment tokens, `{{time:FORMAT}}`, subfolders; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Tradeoffs:** rare tokens unsupported (kept literal); rejected Moment.js and Day.js dependencies (maintenance mode; extra weight).
  - **Dependencies:** RM261003ABZP-DES5@R1
  - **Predecessors:** None

- **RM261003ABZP-DES12@R1 — Ported Bases engine with table and Kanban view models and YAML-preserving write-back**
  - **Requirements:** RM261003ABZP-REQ7@R2 - Bases table and Kanban views
  - **Decision:** port `alfred/packages/vault/src/domain/bases/*` (parser, evaluator, expression, yaml-patcher) and `alfred/packages/view-model/src/base/*` row and board rules into `core/bases`; view models `TableModel` and `KanbanModel`; unknown layouts map to `TableModel` with a notice; the Kanban `type` string is one constant verified against an Obsidian 1.14+ file; edits become `write` effects through the atomic save path; embeds render through a `base` block renderer.
  - **Explanation:** `src/core/bases/*`; Base views in `src/ui/views/`.
  - **Evidence:** `alfred/packages/vault/src/domain/bases/parser.ts:19`, `evaluator.ts:164` - no file-system or Bun imports (context assumption).
  - **Research:** `RM261003ABZP-RF9` - layouts, Kanban rules; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - **Tradeoffs:** follows an early-access Obsidian layout; guarded by the constant, a fixture, and the table fallback.
  - **Dependencies:** RM261003ABZP-DES7@R1, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES11@R1
  - **Predecessors:** None

- **RM261003ABZP-DES13@R1 — `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering**
  - **Requirements:** RM261003ABZP-REQ8@R2 - read-only preview
  - **Decision:** `preview/server.ts` binds `127.0.0.1:0`, checks Host, serves a page shell, SSE `/events`, `/render` fragments from core `renderHtml(doc)`, and contained `/file/*`; the page loads KaTeX and Mermaid from jsDelivr and falls back to showing source when offline.
  - **Explanation:** Preview HTTP routes; `src/preview/server.ts`; `src/core/render-html/render.ts`.
  - **Evidence:** user decision "no Next.js".
  - **Research:** `RM261003ABZP-RF12` - binding, Host check, containment, SSE; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Tradeoffs:** math and diagrams need network in the browser (fallback to source); rejected bundling KaTeX/Mermaid into the binary (multi-MB size) and WebSocket (bidirectional not needed).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R1
  - **Predecessors:** None

- **RM261003ABZP-DES14@R1 — TOML config at XDG path validated by schema; per-workspace state at XDG state path**
  - **Requirements:** RM261003ABZP-REQ3@R3 - configuration and state
  - **Decision:** `Bun.TOML.parse` + zod schema (`core/config/schema.ts`); config path honors XDG rules (relative values ignored); invalid config → error notice + defaults; state JSON at `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json` holding recent notes, jump list, open buffers, window layout.
  - **Explanation:** AppConfig; `src/workspace/config-file.ts`; `src/workspace/state-file.ts`.
  - **Evidence:** `rm261003abzp-research.md` S21, S9, S30.
  - **Research:** `RM261003ABZP-RF15` - TOML, XDG rules, state home; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R3)
  - **Tradeoffs:** TOML instead of the proposal's `config.ts` — no code execution and simpler validation, at the cost of no scripting in config (agent decision under delegation).
  - **Dependencies:** RM261003ABZP-DES5@R1
  - **Predecessors:** None

- **RM261003ABZP-DES15@R1 — Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile**
  - **Requirements:** RM261003ABZP-REQ10@R2 - fast checks, CI, release; RM261003ABZP-REQ11@R2 - Conventional Commits, SemVer
  - **Decision:** Bun (exact version in `packageManager`), TypeScript 7 `tsc --noEmit` strict, Biome, knip, `bun test` (unit colocated; component via OpenTUI test renderer; few PTY e2e); `bun run check` = biome check + tsc + knip + boundary test + unit tests; CI jobs `check` and `test` (component, e2e, bench) in parallel with Bun cache; release-please on `main`; release job on tag: `bun install --os="*" --cpu="*"`, compile `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64`, `bun-linux-arm64` with `OPENTUI_LIBC=glibc` defined for Linux, `SHA256SUMS`, smoke `so --version` on `macos-latest` and `ubuntu-latest`.
  - **Explanation:** Project Structure (`package.json`, `.github/workflows/*`).
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's eight CI groups are the anti-pattern avoided.
  - **Research:** `RM261003ABZP-RF3`, `RM261003ABZP-RF13`, `RM261003ABZP-RF14`; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - **Tradeoffs:** unsigned macOS binaries (signing deferred); release-please adds a bot PR.
  - **Dependencies:** RM261003ABZP-DES1@R1
  - **Predecessors:** None

- **RM261003ABZP-DES16@R1 — Performance by construction plus benchmark gates**
  - **Requirements:** RM261003ABZP-REQ9@R2 - performance targets
  - **Decision:** viewport-only layout (DES9), block parse cache (DES6), worker index and search (DES7), frame coalescing (one render per input burst), first frame before indexing, lazy image decode with an LRU cache (64 MiB), and benchmarks through the OpenTUI test renderer gated at 2× (median of 5) in CI.
  - **Explanation:** Keystroke to frame and Startup flows; `test/bench/`.
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's 64 MiB image budget precedent.
  - **Research:** `RM261003ABZP-RF2` - in-process metrics; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Tradeoffs:** benchmarks add CI time (bounded by the 3 min budget); terminal display latency is outside the measurement.
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES9@R1
  - **Predecessors:** None

| Current requirement | Design decision | Canonical design location | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R2 - folder workspace, safe files | RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R1 | `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow | RM261003ABZP-S1@R1 | RM261003ABZP-V1@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R1 | `src/core/editor/`, `src/core/vim/`, `src/ui/input.ts` | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R3 - navigation, config, state | RM261003ABZP-DES5@R1, RM261003ABZP-DES7@R1, RM261003ABZP-DES10@R1, RM261003ABZP-DES14@R1 | `src/core/commands/`, `src/ui/overlays/`, `src/workspace/config-file.ts`, `state-file.ts` | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R1 |
| RM261003ABZP-REQ4@R2 - links | RM261003ABZP-DES7@R1, RM261003ABZP-DES6@R1 | `src/core/index/` | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R1 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R1, RM261003ABZP-DES10@R1 | `src/core/markdown/`, `src/core/layout/`, `src/ui/editor-view.ts` | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R1, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | `src/core/time/`, `src/core/notes/` | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R1, RM261003ABZP-DES11@R1 | `src/core/bases/`, `src/ui/views/` | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - preview | RM261003ABZP-DES13@R1, RM261003ABZP-DES6@R1 | `src/preview/`, `src/core/render-html/` | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R1 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-DES16@R1 | Keystroke and Startup flows; `test/bench/` | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R2 - dev, CI, release | RM261003ABZP-DES15@R1, RM261003ABZP-DES1@R1 | `package.json`, `.github/workflows/` | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R2 - foundations | RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R1, RM261003ABZP-DES5@R1, RM261003ABZP-DES10@R1 | `test/boundaries.test.ts`, registries, `src/ui/shell.ts` | RM261003ABZP-S11@R1 | RM261003ABZP-V15@R1, RM261003ABZP-V16@R1, RM261003ABZP-V17@R1 |

## Unresolved Items

None — open technical confirmations (OpenTUI paint/image API details at the pinned version, recursive `fs.watch` behavior, Kanban `type` value) are delivery constraints with named verification, not design decisions.

## Approval

- **Requirement baseline:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ4@R2 … RM261003ABZP-REQ11@R2
- **Approved design:** RM261003ABZP-DES1@R1 … RM261003ABZP-DES16@R1
- **Approved success and verification:** RM261003ABZP-S1@R1 … RM261003ABZP-S11@R1; RM261003ABZP-V1@R1 … RM261003ABZP-V17@R1
- **Approval evidence:** User delegated all decisions on 2026-10-03 ("you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"); the agent approved this design under that delegation.
`````

- **RM261003ABZP-V6@R1, RM261003ABZP-V11@R1 — Verification for step-10 commands and events**
  - **Archived at:** 2026-10-03T03:43:48Z
  - **Change type:** Revised
  - **Reason:** The step-10 entry said "V5 and V11 scenarios gain cases", but no scenario was edited. That left `link.linkMention` writes (DES7@R2) and the preview `stopped` event (DES13@R2) without system verification. This entry corrects that claim.
  - **Changes:** V6 adds a `link.linkMention` case: the mention is wrapped as `[[…]]`, an open buffer is edited in memory, and a closed file is written through the atomic write path. The rename-based V6 covers the same write path, so it fits better than the resolution-only V5. V11 adds a `:PreviewStop` case: a connected SSE client receives `stopped` before the server closes.
  - **Record transitions:**
    - RM261003ABZP-V6@R1 → RM261003ABZP-V6@R2 - revision change
    - RM261003ABZP-V11@R1 → RM261003ABZP-V11@R2 - revision change
    - RM261003ABZP-S4@R1, RM261003ABZP-S8@R1 - Revision retained (outcomes unchanged; verification lists point to the new V revisions)
  - **Requirement baseline:** unchanged
  - **Evidence:** step-11 reconciliation found no V5/V11 scenario change after the step-10 entry
  - **Research provenance:**
    - None
  - **Affected coverage:** REQ4@R3 row → V6@R2; REQ8@R2 row and the security cross-cutting row → V11@R2
  - **Approval evidence:** User delegation of 2026-10-03; agent approved.
  - **Downstream impact:** UI design UV10 setup reference and Coverage Balance range (non-semantic pointer updates).

`````markdown
# RM261003ABZP: so v1 — Design

- **Status:** Approved
- **Outcome:** One Bun process with a pure TypeScript core (editor, vim, Markdown, index, Bases, templates) driven by one-way state flow, thin I/O adapters, an OpenTUI shell that draws only visible lines, and a read-only `Bun.serve` preview — enforced by an import-boundary test and gated by fast CI with in-process performance benchmarks.
- **History:** `rm261003abzp-design-revisions.md`

Use `None — <reason>` for sections or fields that do not apply. Diagrams and code previews show proposed design unless labeled as current evidence.

## Baseline and Goals

- **Context:** `rm261003abzp-roadmap-context.md@R1` - empty repository; Alfred code available to port (Markdown parse, Obsidian syntax, vim core, terminal graphics, Bases).
- **Requirements:** `rm261003abzp-requirements.md` - RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ4@R3 … RM261003ABZP-REQ11@R2 (approved).
- **Research:** `rm261003abzp-research.md`
- **Reconciliation:** `rm261003abzp-requirements.md` Research Reconciliation — Complete.
- **Goals:**
  - Meet REQ1–REQ11 with the fewest moving parts: one process, one package, one state store.
  - Keep every product rule in a pure, unit-testable core; keep OpenTUI, Bun, and the file system at the edges.
  - Extend by registration (commands, keymaps, syntax extensions, block renderers, Bases view types) — the known extension needs from RM261003ABZP-REQ11@R2.
- **Binding constraints:**
  - `.s1mple/S1MPLE.md` Implementation - "Keep it lean and simple": no monorepo, no server between UI and core, no speculative plugin system.
  - RM261003ABZP-REQ11@R2 - only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs.
  - RM261003ABZP-REQ10@R2 - no tool may depend on the TypeScript compiler API (TypeScript 7 ships none, `RM261003ABZP-RF13`).

## System Architecture

- **System context:** One user in a terminal runs `so [path]`. External systems: the file system (the workspace folder, `$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, trash), the terminal emulator (keys, mouse, graphics), the system clipboard, and — only while `:Preview` runs — a local browser over `127.0.0.1`. No network service, database, Git, or AI.
- **Current architecture:** `rm261003abzp-roadmap-context.md@R1` Current System — empty repository.

```text
Not established — empty repository (only .s1mple/ guidance)
```

- **Proposed architecture:**

```text
                         ┌──────────────────────── src/app (composition root) ────────────────────────┐
 terminal ⇄ OpenTUI ⇄    │  main.ts → loads config/state → creates Store → starts UI, effects, workers │
                         └──────┬──────────────────────┬───────────────────────┬────────────────────┬──┘
                                │                      │                       │                    │
                   ┌────────────▼─────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
                   │ src/ui  (OpenTUI)    │  │ src/workspace (I/O)│  │ src/preview       │  │ src/core (pure)│
                   │ views, input, paint  │  │ fs, watcher, trash │  │ Bun.serve + SSE   │  │ state, vim,    │
                   │ images, theme        │  │ index worker, cfg  │  │ read-only HTML    │  │ markdown,index │
                   └────────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │ bases, layout  │
                                │ reads state,          │ executes effects,     │ reads state, └───────▲────────┘
                                │ dispatches actions    │ dispatches results    │ renders HTML         │
                                └───────────────────────┴───────────────────────┴──────── import ──────┘

 Allowed imports:  app → ui, workspace, preview, core      ui → core      workspace → core      preview → core
                   core → (nothing outside core; npm parsing libs only)
```

The core owns all product behavior; the three edge layers are adapters. This reuses Alfred's parsing, Obsidian syntax, vim, terminal-graphics knowledge, and Bases engine by porting them into `core/` (Alfred's kernel, client, protocol, chat, Git, SQLite, Ink, and Next.js are not reused). Main tradeoff: one process keeps latency and code minimal, but a CPU-heavy task on the main thread would stall input — so scanning, parsing for the index, and full-text search run in a worker (RM261003ABZP-DES7@R2).

## Components and Boundaries

- **App (composition root)**
  - **Decisions:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2
  - **Location:** `src/app/`
  - **Responsibilities:** parse CLI args; load config and state; construct the store, effect runner, workspace adapters, index worker, UI, and preview on demand; own process lifecycle and exit codes.
  - **Collaborators:** `bin/so` → `app/main.ts` → `core/store`, `workspace/*`, `ui/shell`, `preview/server`
  - **Contracts:** Action and Effect protocol; AppConfig
  - **Code shape:** `src/app/main.ts` `main`, `src/app/effects.ts` `runEffect`
  - **Must not own:** product rules, rendering, Markdown semantics.

- **Core — state and commands**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R1
  - **Location:** `src/core/state/`, `src/core/commands/`
  - **Responsibilities:** `AppState`, pure `update(state, action) → { state, effects }`; command registry, keymap trie, which-key data, palette data, jump list, autosave policy.
  - **Collaborators:** ui/workspace/preview → `dispatch(action)` → `update` → effects → app effect runner
  - **Contracts:** Action and Effect protocol; Command and Keymap registry; AppState
  - **Code shape:** `src/core/state/update.ts` `update`; `src/core/commands/registry.ts` `CommandRegistry`, `Keymap`
  - **Must not own:** timers, I/O, terminal escape codes.

- **Core — editor and vim**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Location:** `src/core/editor/`, `src/core/vim/`
  - **Responsibilities:** text buffer, cursor and selections, undo blocks, registers; vim mode machine, key-sequence parser, motions, operators, text objects, dot-repeat, search, ex commands, window tree.
  - **Collaborators:** `update` → `vim.handleKey(bufferState, key)` → `TextBuffer`
  - **Contracts:** TextBuffer; VimState
  - **Code shape:** `src/core/editor/text-buffer.ts` `TextBuffer`; `src/core/vim/engine.ts` `handleKey`
  - **Must not own:** rendering, clipboard I/O (expressed as effects).

- **Core — Markdown and layout**
  - **Decisions:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2
  - **Location:** `src/core/markdown/`, `src/core/layout/`, `src/core/render-html/`
  - **Responsibilities:** block splitting, per-block parse cache, Obsidian syntax extensions, `Doc` model; live-preview layout of visible rows into `RenderLine[]`; pure HTML rendering for the preview.
  - **Collaborators:** `update`/UI → `parseDoc(text, prev)` → `layoutViewport(doc, view)` → UI paint; preview → `renderHtml(doc, ctx)`
  - **Contracts:** Doc model; RenderLine model
  - **Code shape:** `src/core/markdown/doc.ts` `parseDoc`; `src/core/layout/layout.ts` `layoutViewport`; `src/core/render-html/render.ts` `renderHtml`
  - **Must not own:** terminal escape output, image decoding, HTTP.

- **Core — index and links**
  - **Decisions:** RM261003ABZP-DES7@R2
  - **Location:** `src/core/index/`
  - **Responsibilities:** `NoteSummary` extraction, `NoteIndex` (names, aliases, headings, blocks, links, tags, backlinks), link resolution rule, rename planning, fuzzy matching, full-text search functions.
  - **Collaborators:** index worker → `summarize(path, text)` → `NoteIndex.apply(delta)`; `update` → `resolveLink`, `planRename`
  - **Contracts:** NoteSummary and NoteIndex; LinkTarget
  - **Code shape:** `src/core/index/note-index.ts` `NoteIndex`; `src/core/index/resolve.ts` `resolveLink`; `src/core/index/rename.ts` `planRename`
  - **Must not own:** file scanning (worker), persistence.

- **Core — Bases and notes**
  - **Decisions:** RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R1
  - **Location:** `src/core/bases/`, `src/core/notes/`, `src/core/time/`
  - **Responsibilities:** `.base` parsing, expression evaluation, table and Kanban view models, YAML-preserving frontmatter patches; daily-note paths, template expansion, Moment-subset date formatting.
  - **Collaborators:** `update` → `evaluateBase(base, index)` → `BaseViewModel`; `update` → `expandTemplate(tpl, vars)`
  - **Contracts:** BaseViewModel; Template variables
  - **Code shape:** `src/core/bases/evaluate.ts` `evaluateBase`; `src/core/time/format.ts` `formatDate`
  - **Must not own:** file writes (expressed as `write` effects).

- **Workspace adapters**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES14@R1
  - **Location:** `src/workspace/`
  - **Responsibilities:** atomic save, read, create, rename, move, delete-to-trash; directory watcher with own-write suppression; index worker (scan, summarize, search); config and state files; clipboard; opening URLs/browser.
  - **Collaborators:** app effect runner → `workspace/*` → `dispatch(resultAction)`
  - **Contracts:** Effect protocol; FileEvent; WorkerMessage
  - **Code shape:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`; `src/workspace/index-worker.ts`
  - **Must not own:** decisions about conflicts, autosave timing, or link rewriting (core decides).

- **UI shell**
  - **Decisions:** RM261003ABZP-DES10@R1, RM261003ABZP-DES9@R2
  - **Location:** `src/ui/`
  - **Responsibilities:** OpenTUI renderer lifecycle; key/mouse normalization (kitty keyboard protocol, Esc timeout); layout of explorer, bufferline, editor windows, side panel, statusline, command line, overlays (picker, which-key, palette, prompts, help, notifications), Bases views; painting `RenderLine[]`; inline images; theme and `NO_COLOR`; terminal restore.
  - **Collaborators:** OpenTUI → `ui/input` → `dispatch`; store subscription → `ui/shell.render(state)`
  - **Contracts:** Key; RenderLine; AppState (read-only)
  - **Code shape:** `src/ui/shell.ts` `createShell`; `src/ui/editor-view.ts` `EditorView`; `src/ui/input.ts` `normalizeKey`
  - **Must not own:** editing logic, Markdown parsing, file I/O.

- **Preview server**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Location:** `src/preview/`
  - **Responsibilities:** `Bun.serve` on `127.0.0.1:0`, Host allowlist, SSE updates, read-only page, contained asset serving.
  - **Collaborators:** app → `startPreview(store)` → browser; store subscription → SSE push
  - **Contracts:** Preview HTTP routes
  - **Code shape:** `src/preview/server.ts` `startPreview`
  - **Must not own:** editing; files outside the workspace.

## Project Structure

- **Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json                 Purpose: one package; scripts dev/check/test/bench/build; exact pins
│       Symbols: scripts.check, packageManager, "@opentui/core": "<exact>"   Decisions: DES15
├── [A] tsconfig.json                Purpose: strict ESM, noEmit, TS 7          Decisions: DES15
├── [A] biome.json                   Purpose: format + lint                      Decisions: DES15
├── [A] knip.json                    Purpose: dead-code check                    Decisions: DES15
├── [A] release-please-config.json   Purpose: Conventional Commits → SemVer      Decisions: DES15
├── [A] .github/workflows/ci.yml     Purpose: check ∥ test+bench jobs            Decisions: DES15, DES16
├── [A] .github/workflows/release.yml Purpose: release-please + compile ×4 + smoke  Decisions: DES15
├── [A] bin/so                        Purpose: `#!/usr/bin/env bun` entry for source runs  Decisions: DES1
├── [A] src/app/
│   ├── main.ts                      Purpose: CLI, wiring, lifecycle            Symbols: main, parseArgs   Decisions: DES1, DES2
│   └── effects.ts                   Purpose: effect runner                     Symbols: runEffect         Decisions: DES2
├── [A] src/core/
│   ├── state/                       Purpose: AppState, Action, Effect, update  Symbols: update, AppState  Decisions: DES2
│   ├── commands/                    Purpose: registry, keymap trie, which-key  Symbols: CommandRegistry, Keymap  Decisions: DES5
│   ├── editor/                      Purpose: TextBuffer, undo, registers, windows  Symbols: TextBuffer, UndoStack, Registers  Decisions: DES3
│   ├── vim/                         Purpose: modes, parser, motions, operators, text objects, ex  Symbols: handleKey, motions, textObjects  Decisions: DES4
│   ├── markdown/                    Purpose: block split, parse cache, Obsidian extensions  Symbols: parseDoc, Doc, Block  Decisions: DES6
│   ├── layout/                      Purpose: live-preview layout of visible rows  Symbols: layoutViewport, RenderLine  Decisions: DES9
│   ├── render-html/                 Purpose: Doc → HTML for preview             Symbols: renderHtml        Decisions: DES13
│   ├── index/                       Purpose: summaries, index, resolve, rename, search  Symbols: NoteIndex, resolveLink, planRename  Decisions: DES7
│   ├── bases/                       Purpose: ported Bases engine + view models   Symbols: parseBase, evaluateBase, KANBAN_TYPE  Decisions: DES12
│   ├── notes/                       Purpose: daily notes, templates             Symbols: dailyPath, expandTemplate  Decisions: DES11
│   ├── time/                        Purpose: Moment-subset formatter            Symbols: formatDate        Decisions: DES11
│   └── config/                      Purpose: config schema and defaults         Symbols: ConfigSchema, defaults  Decisions: DES14
├── [A] src/workspace/
│   ├── fs.ts                        Purpose: read, atomicWrite, create, rename, move  Symbols: atomicWrite  Decisions: DES8
│   ├── trash.ts                     Purpose: freedesktop trash, macOS Finder trash  Symbols: moveToTrash  Decisions: DES8
│   ├── watcher.ts                   Purpose: directory watching, own-write suppression  Symbols: watchWorkspace  Decisions: DES8
│   ├── index-worker.ts              Purpose: scan, summarize, search in a Worker  Symbols: onmessage  Decisions: DES7
│   ├── config-file.ts               Purpose: XDG config load + validation       Symbols: loadConfig        Decisions: DES14
│   ├── state-file.ts                Purpose: XDG state load/save                Symbols: loadState, saveState  Decisions: DES14
│   └── system.ts                    Purpose: clipboard, open browser           Symbols: clipboard, openUrl  Decisions: DES8
├── [A] src/ui/
│   ├── shell.ts                     Purpose: renderer lifecycle, layout, restore  Symbols: createShell  Decisions: DES10
│   ├── input.ts                     Purpose: key/mouse normalization, Esc timeout  Symbols: normalizeKey  Decisions: DES10
│   ├── editor-view.ts               Purpose: paints RenderLine rows, cursor, images  Symbols: EditorView  Decisions: DES9, DES10
│   ├── views/                       Purpose: explorer, bufferline, statusline, cmdline, side panel, base views  Decisions: DES10, DES12
│   ├── overlays/                    Purpose: picker, which-key, palette, prompt, help, notify  Decisions: DES10, DES5
│   └── theme.ts                     Purpose: tokens, NO_COLOR                   Symbols: theme     Decisions: DES10
├── [A] src/preview/
│   ├── server.ts                    Purpose: Bun.serve, Host check, SSE, assets  Symbols: startPreview  Decisions: DES13
│   └── page.html                    Purpose: read-only page shell (embedded)   Decisions: DES13
└── [A] test/
    ├── boundaries.test.ts           Purpose: import-boundary enforcement        Decisions: DES1
    ├── e2e/                         Purpose: few PTY tests (start, edit, save, exit, restore)  Decisions: DES15
    ├── bench/                       Purpose: performance benchmarks via test renderer  Decisions: DES16
    └── fixtures/                    Purpose: sample workspace, 5,000-line note, 10,000-note generator  Decisions: DES16
```

Unit tests sit next to code as `*.test.ts`.

## Runtime Flows

- **Keystroke to frame**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES4@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES16@R1
  - **Participants:** OpenTUI key event → `ui/input.normalizeKey` → `store.dispatch({type:"key"})` → `core/state/update` → `vim.handleKey` → `TextBuffer.apply` → `markdown.reparseBlock` → store notifies → `ui/shell.render` → `layoutViewport` (visible rows only) → `EditorView` paint → OpenTUI native diff
  - **Flow:**

    ```text
    key ─→ normalizeKey ─→ dispatch(key) ─→ update(state,key)
                                              ├─ keymap trie: pending prefix? → state.pending, effect: startWhichKeyTimer
                                              ├─ command → run(ctx) → new state + effects (e.g. scheduleAutosave)
                                              └─ text edit → TextBuffer' + undo block + dirty block ids
          ui.render(state) ← store.notify ←───┘
            └─ reparse dirty blocks (cache by block hash) → layoutViewport(rows in view) → paint → native diff → terminal
    ```

    State changes only inside `update`. Rendering is coalesced to at most one frame per input burst.

  - **Failure and recovery:** a command throws → `update` catches, keeps the previous state, emits `notify(error)`; a render error in one block → that block renders as source with a diagnostic marker; nothing crashes the process.
  - **Contracts and state:** Action and Effect protocol; AppState; RenderLine model
  - **Control flow:** `src/core/state/update.ts` `update`; `src/ui/shell.ts` `createShell`

- **Startup**
  - **Decisions:** RM261003ABZP-DES1@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES16@R1
  - **Participants:** `app/main` → `loadConfig`, `loadState` → `createStore` → `createShell` (first frame) → `startIndexWorker` → `watchWorkspace`
  - **Flow:**

    ```text
    so [path] → resolve workspace (folder | file's parent) ── missing → stderr + exit 2
             → load config (invalid → defaults + error notice) → load state (corrupt → empty)
             → first frame (explorer from a shallow readdir; opened file read directly)   ← < 200 ms target
             → worker: scan + summarize all notes → post batches → dispatch(indexBatch) → status "indexing 4,210/10,000"
             → watcher starts → index ready
    ```

  - **Failure and recovery:** worker crash → notify and restart once; link features show "index unavailable" until restart succeeds; editing keeps working.
  - **Contracts and state:** AppConfig; WorkerMessage; NoteIndex
  - **Control flow:** `src/app/main.ts` `main`

- **Save and external change**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R2
  - **Participants:** `update` (autosave policy) → effect `write` → `workspace/fs.atomicWrite` → `watcher` → `dispatch(fileChanged)` → `update` (conflict rules)
  - **Flow:**

    ```text
    edit → state.dirty=true → effect scheduleAutosave(1000ms) | leaveInsert | switchNote | exit | :w
         → effect write(path, text, expectedStamp) → atomicWrite: realpath → tmp in same dir → write → fsync → chmod → rename
         → record ownWrite(path, stamp) → dispatch(saved(stamp))
    watcher(dir) event → stat+hash → ownWrite? ignore
                                   → buffer clean → dispatch(reload(text)) → undoable reload
                                   → buffer dirty → dispatch(conflict) → prompt: keep mine | take disk | view diff
    ```

  - **Failure and recovery:** write fails (permission, disk full) → buffer stays dirty, status shows `save failed: <reason>`, autosave retries with backoff (1 s, 2 s, 4 s, max 30 s); `:w` retries immediately. Rename failure leaves the temp file removed and the original intact.
  - **Contracts and state:** FileEvent; BufferState.stamp
  - **Control flow:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`

- **Follow, complete, and rename links**
  - **Decisions:** RM261003ABZP-DES7@R2
  - **Participants:** `update` → `resolveLink(index, sourcePath, target)` → open buffer + jump; `planRename(index, from, to)` → `write` effects
  - **Flow:**

    ```text
    gd on [[plan#Goals]] → resolveLink → {path:"projects/plan.md", heading:"Goals"} → push jumplist → open → cursor at heading
                         → unresolved → prompt "Create projects/plan.md?" → create effect
    rename a.md → b.md → planRename → [{path, edits[]}…] → apply to open buffers in memory + write effects for closed files
                       → fs rename → notify "12 files updated"
    ```

  - **Failure and recovery:** a link-rewrite write fails → remaining writes continue; failures are listed in a notification with paths; the rename itself is rolled back only if the file rename failed (links already rewritten are reported, not reverted).
  - **Contracts and state:** NoteIndex; LinkTarget
  - **Control flow:** `src/core/index/resolve.ts` `resolveLink`; `src/core/index/rename.ts` `planRename`

- **Preview**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Participants:** `:Preview` → effect `startPreview` → `preview/server` → browser; store change (active doc or version) → SSE event → page fetches `/render`
  - **Flow:**

    ```text
    :Preview → Bun.serve({hostname:"127.0.0.1", port:0}) → open http://127.0.0.1:<port>/
    page → GET /events (SSE) ; edit → debounce 100 ms → event "doc" {path, version, anchor} ; :PreviewStop/exit → event "stopped" → close
    page → GET /render?path=… → renderHtml(doc) → swap <main>, scroll to anchor
    any request with bad Host → 403 ; /file/<p> → realpath ⊂ workspace & not hidden? → bytes : 404
    ```

  - **Failure and recovery:** port bind fails → notify; browser cannot open → notify the URL; SSE drop → browser auto-reconnects and refetches.
  - **Contracts and state:** Preview HTTP routes
  - **Control flow:** `src/preview/server.ts` `startPreview`

## Contracts, Data, and State

- **Action and Effect protocol — State model**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Purpose:** the only way state changes and the only way side effects start.
  - **Participants:** ui, workspace, preview, timers → `Action` → `update` → `Effect[]` → app effect runner → result `Action`
  - **Meaning:** `Action` is a discriminated union (`key`, `mouse`, `resize`, `fileLoaded`, `saved`, `saveFailed`, `fileChanged`, `indexBatch`, `searchResults`, `timer`, …). `Effect` is a discriminated union (`read`, `write`, `create`, `rename`, `move`, `trash`, `startTimer`, `cancelTimer`, `clipboardWrite`, `clipboardRead`, `search`, `startPreview`, `stopPreview`, `openUrl`, `saveState`, `exit`).
  - **Ownership and lifecycle:** core defines both unions; app runs effects; every effect that can fail returns a success or failure action.
  - **Invariants:** `update` is pure and synchronous; no effect runs inside `update`; effects carry all data they need (no callbacks).
  - **State flow:**

    ```text
    Action → update → (State', Effect[]) → runEffect → Action …
    ```

  - **Shape:** `src/core/state/types.ts`

- **AppState — State model**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES10@R1
  - **Purpose:** single source of truth for everything visible.
  - **Participants:** `update` (owner) → ui/preview (readers)
  - **Meaning:** `workspace` (root, tree), `buffers` (by id: path, TextBuffer, doc, stamp, dirty, mode view live|source|reading), `windows` (split tree, active, per-window cursor, scroll, and `folds`: the set of folded callout and expanded embed block ids), `vim` (mode, pending keys, registers, last change, search), `panels` (explorer, side panel kind), `overlay` (none | picker | whichKey | palette | prompt | help | conflict | calendar | completion), `index` (NoteIndex + status), `notifications`, `config`, `jumps`, `preview` (off | on(port)).
  - **Ownership and lifecycle:** created at startup from config + state file; `jumps` and recent notes persisted through `saveState` effects (debounced 2 s and on exit).
  - **Invariants:** one active window; each window references an open buffer; a buffer with `dirty=false` matches its last saved stamp.
  - **State flow:** `None — plain value replaced by update`
  - **Shape:** `src/core/state/types.ts` `AppState`

- **TextBuffer — Data model**
  - **Decisions:** RM261003ABZP-DES3@R1
  - **Purpose:** text storage and edit primitives behind a stable interface.
  - **Participants:** vim engine, rename planner, template insertion → `TextBuffer` → markdown parser
  - **Meaning:** lines array, version number, `apply(edit)` returning a new buffer and the inverse edit; positions are `{line, col}` in UTF-16 code units aligned to grapheme boundaries.
  - **Ownership and lifecycle:** owned by a buffer entry; replaced on each edit (structural sharing of untouched lines).
  - **Invariants:** at least one line; line separators normalized to `\n` in memory, original separator (`\n`/`\r\n`) and trailing newline restored on save.
  - **State flow:** `None`
  - **Shape:** `src/core/editor/text-buffer.ts`

- **Doc model — Data model**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Purpose:** parsed Markdown shared by live preview, index summaries, and HTML preview.
  - **Participants:** `parseDoc` → `Doc` → layout, `summarize`, `renderHtml`
  - **Meaning:** `Doc { frontmatter?, blocks: Block[] }`; `Block { id, kind, startLine, endLine, hash, node }` where `node` is mdast extended with Obsidian nodes (`wikiLink`, `embed`, `tag`, `highlight`, `comment`, `callout`, `blockId`, `footnote*`, `math`).
  - **Ownership and lifecycle:** recomputed per buffer version; unchanged blocks reused by hash.
  - **Invariants:** blocks cover the document without overlap; a fenced code block or frontmatter is never split.
  - **State flow:** `None`
  - **Shape:** `src/core/markdown/doc.ts`

- **RenderLine model — Data model**
  - **Decisions:** RM261003ABZP-DES9@R2
  - **Purpose:** UI-independent description of one screen row.
  - **Participants:** `layoutViewport` → `RenderLine[]` → `EditorView`
  - **Meaning:** `RenderLine { sourceLine, spans: {text, style: StyleToken, link?}[], widget?: {kind:"image"|"embed"|"base"|"rule", ref, rows} , reveal: boolean }`; `StyleToken` names a theme token (`heading1`, `bold`, `link`, `tag`, `codeKeyword`, …), never a colour.
  - **Ownership and lifecycle:** computed per frame for visible rows only.
  - **Invariants:** cursor column maps back to a source column through `spans` offsets; widget rows are counted in scroll math.
  - **State flow:** `None`
  - **Shape:** `src/core/layout/types.ts`

- **NoteSummary and NoteIndex — Data model**
  - **Decisions:** RM261003ABZP-DES7@R2
  - **Purpose:** workspace-wide link, tag, heading, and block knowledge.
  - **Participants:** worker `summarize` → `NoteSummary` → main `NoteIndex.apply`
  - **Meaning:** `NoteSummary { path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind:"wiki"|"md"|"embed"}], frontmatter }`. `NoteIndex` holds summaries by path plus derived maps: basename → paths, alias → paths, tag → paths, target path → backlinks.
  - **Ownership and lifecycle:** built at startup by the worker; updated per file event and per buffer save; never persisted.
  - **Invariants:** derived maps are rebuilt only for changed paths; resolution order is fixed (RM261003ABZP-DES7@R2).
  - **State flow:** `empty → indexing(n/total) → ready → (fileEvent) ready`
  - **Shape:** `src/core/index/note-index.ts`

- **Preview HTTP routes — API**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Purpose:** read-only browser preview.
  - **Participants:** browser → `preview/server` → core `renderHtml`
  - **Meaning:** `GET /` page shell; `GET /events` SSE (`doc` events with `{path, version, anchor}`; a `stopped` event sent before `:PreviewStop` or exit closes the server); `GET /render?path=` HTML fragment; `GET /file/<path>` workspace asset bytes.
  - **Ownership and lifecycle:** exists only between `:Preview` and `:PreviewStop` or exit.
  - **Invariants:** hostname `127.0.0.1`; Host header ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403; realpath containment else 404; no mutating routes.
  - **State flow:** `off → on(port) → off`
  - **Shape:** `src/preview/server.ts`

- **AppConfig — Data model**
  - **Decisions:** RM261003ABZP-DES14@R1
  - **Purpose:** user options and keymap overrides.
  - **Participants:** `config-file.loadConfig` → `ConfigSchema` (zod) → `AppState.config`
  - **Meaning:** `leader`, `escTimeoutMs` (50), `autosave` (`{ enabled: true, delayMs: 1000 }`), `editor` (`tabWidth`, `wrap`, `relativeNumbers`), `preview` (`mode: "live"`, `embedMaxRows`, `images: "auto"|"blocks"|"off"`), `daily` (`folder`, `format`, `template`), `templates.folder`, `theme`, `color` (overrides `NO_COLOR`), `keys.<mode>` (`"<key-seq>" = "<command-id>"`).
  - **Ownership and lifecycle:** read at startup and on `:ConfigReload`.
  - **Invariants:** unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
  - **State flow:** `None`
  - **Shape:** `src/core/config/schema.ts`

## Detailed Code Design

- **`src/core/state/update.ts`**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Change:** Add
  - **Responsibilities:** reducer entry; routes actions to feature reducers.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };

    export const update: Update = (state, action) => {
      switch (action.type) {
        case "key":        return handleKeyAction(state, action.key);   // keymap → command or vim edit
        case "fileChanged":return handleFileChanged(state, action);     // reload | conflict | ignore
        case "indexBatch": return { state: withIndex(state, action.summaries), effects: [] };
        // … one case per Action variant; feature logic lives in feature modules
      }
    };

    export function createStore(initial: AppState, run: (e: Effect) => void) {
      let state = initial; const subs = new Set<(s: AppState) => void>();
      return {
        get: () => state,
        dispatch(action: Action) { const r = update(state, action); state = r.state; r.effects.forEach(run); subs.forEach((f) => f(state)); },
        subscribe(f: (s: AppState) => void) { subs.add(f); return () => subs.delete(f); },
      };
    }
    ```

    `update` routes; `createStore` is the only mutable cell. The switch dispatches on a closed Action union (core protocol, not an extension point); commands extend through the registry instead.

  - **Dependencies:** Action and Effect protocol; CommandRegistry
  - **Callers and wiring:** `app/main.ts` creates the store with `runEffect`; ui and preview subscribe.
  - **Invariants:** pure; no `Date.now()` — time arrives in actions.
  - **Verification:** RM261003ABZP-S11@R1, RM261003ABZP-V15@R1

- **`src/core/commands/registry.ts`**
  - **Decisions:** RM261003ABZP-DES5@R1
  - **Change:** Add
  - **Responsibilities:** named commands, keymap trie, which-key and palette data, config overrides.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Command = {
      id: string;                       // "file.find", "note.today", "link.follow"
      title: string;                    // shown in palette and which-key
      group?: string;                   // which-key group: "find", "note", "buffer"
      run: (ctx: CommandContext, args?: string) => { state: AppState; effects: Effect[] };
    };
    export type Mode = "normal" | "insert" | "visual" | "cmdline" | "explorer" | "picker" | "base";

    export class CommandRegistry { register(cmd: Command): void; get(id: string): Command | undefined; list(): Command[] }

    export class Keymap {
      bind(mode: Mode, seq: string, commandId: string): void;      // "<leader>ff", "gd", "<C-o>"
      lookup(mode: Mode, pending: Key[]): { kind: "command"; id: string } | { kind: "prefix"; next: WhichKeyItem[] } | { kind: "none" };
    }
    ```

    Features call `registry.register` and `keymap.bind` at startup from their own module (`src/core/notes/commands.ts`, …). Which-key reads `lookup(...).next`; the palette reads `list()`. Config `keys.<mode>` rebinds by command id.

  - **Dependencies:** AppState
  - **Callers and wiring:** `core/commands/defaults.ts` registers built-ins; `app/main.ts` applies config overrides.
  - **Invariants:** duplicate ids throw at startup; binding an unknown id is a config error, not a crash.
  - **Verification:** RM261003ABZP-S3@R1, RM261003ABZP-V4@R1; RM261003ABZP-S11@R1, RM261003ABZP-V16@R1

- **`src/core/editor/text-buffer.ts` and `src/core/vim/engine.ts`**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Change:** Add (vim engine redesigned from `alfred/apps/tui/src/view/editor/vim.ts`)
  - **Responsibilities:** buffer primitives; vim grammar `[count]["x][count]operator[count](motion|textobject)`.
  - **Current source:** `alfred/apps/tui/src/view/editor/vim.ts:15-40` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    export type VimMode = "normal" | "insert";
    export type VimEffect = "changed" | "insert-exited" | "toggle-mode" | "leave";
    export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
    ```

    Alfred's engine is pure with effects but supports two modes and a hard-coded pending set.

  - **Proposed shape:**

    ```ts
    export interface TextBuffer {
      readonly version: number; readonly lineCount: number;
      line(i: number): string;
      apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };     // Edit = { range, text }
      slice(range: Range): string;
    }

    export type Motion = (buf: TextBuffer, at: Pos, count: number, ctx: MotionCtx) => { to: Pos; linewise: boolean; inclusive: boolean } | null;
    export type TextObject = (buf: TextBuffer, at: Pos, count: number) => Range | null;
    export const motions: Record<string, Motion>;       // "w","b","e","gg","G","f",… registered by key
    export const textObjects: Record<string, TextObject>; // "iw","a(","ip",…

    export function handleKey(s: BufferVim, key: Key, env: VimEnv): { s: BufferVim; effects: VimEffect[] };
    // VimEffect: { kind:"yank", register, text } | { kind:"changed" } | { kind:"modeChanged", mode } | { kind:"ex", line } | { kind:"search", pattern, dir }
    ```

    The parser accumulates keys into a pending command; when complete it resolves the motion or text object by table lookup, applies the operator, and records an undo block and last-change for `.`. Insert mode collects edits into one undo block until `Esc`.

  - **Dependencies:** TextBuffer; registers in AppState
  - **Callers and wiring:** `update` → `handleKeyAction` → `handleKey` when no keymap binding matches in normal/visual/insert mode.
  - **Invariants:** an operator with a failed motion is a no-op; counts multiply (`2d3w` = `d6w`); undo restores cursor.
  - **Verification:** RM261003ABZP-S2@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1

- **`src/core/markdown/doc.ts`**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Change:** Add (ported from `alfred/apps/tui/src/view/markdown/parse.ts` and `alfred/packages/view-model/src/markdown/obsidian-syntax.ts`)
  - **Responsibilities:** split into blocks, parse each block with micromark + GFM + math + Obsidian extensions, reuse unchanged blocks.
  - **Current source:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` (imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math`)
  - **Current shape:**

    ```ts
    // Alfred parses the whole document per render and post-processes Obsidian syntax with regexes from obsidian-syntax.ts
    export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    ```

    Whole-document parse; Obsidian syntax by regex over text nodes.

  - **Proposed shape:**

    ```ts
    export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; node: MdNode };
    export type Doc = { version: number; frontmatter?: Frontmatter; blocks: Block[] };

    export function splitBlocks(buf: TextBuffer): { startLine: number; endLine: number }[]; // blank-line bounded; fences, frontmatter, $$ kept whole; lists kept whole
    export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;   // reparse only ranges whose hash changed
    export const syntaxExtensions: SyntaxExtension[];             // wikiLink, embed, tag, highlight, comment, callout, blockId — registration point
    ```

    Block-level reparse keeps per-keystroke work proportional to the edited block (`RM261003ABZP-RF7`). Obsidian syntax is applied as mdast transforms registered in `syntaxExtensions`.

  - **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`
  - **Callers and wiring:** `update` after edits; worker `summarize`; preview `renderHtml`.
  - **Invariants:** `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally (cache is transparent).
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R1; RM261003ABZP-S9@R1, RM261003ABZP-V12@R1

- **`src/core/layout/layout.ts`**
  - **Decisions:** RM261003ABZP-DES9@R2
  - **Change:** Add (adapted from `alfred/apps/tui/src/view/markdown/layout.ts` and `alfred/apps/tui/src/view/editor/reveal-units.ts`)
  - **Responsibilities:** visible-row layout with reveal rules and block renderers.
  - **Current source:** `alfred/apps/tui/src/view/editor/reveal-units.ts` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    None — Alfred lays out whole documents for Ink rendering
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    export type LayoutView = { doc: Doc; buf: TextBuffer; width: number; topRow: number; rows: number; cursor: Pos; selection?: Range; mode: "live" | "source" | "reading"; folds: ReadonlySet<number> };
    export function layoutViewport(v: LayoutView, ctx: LayoutCtx): RenderLine[];
    export type BlockRenderer = (block: Block, v: LayoutView, ctx: LayoutCtx) => RenderLine[];
    export const blockRenderers: Partial<Record<BlockKind, BlockRenderer>>;   // heading, list, table, callout, code, embed, base, math, mermaid …
    ```

    Reveal: the cursor's line shows raw inline syntax; if the cursor is inside a multi-line block (table, callout, code, math, frontmatter) the whole block renders as source. Rows outside the viewport are never laid out; a per-block row-height cache gives scroll positions.

  - **Dependencies:** Doc model; theme tokens; `lowlight` for code tokens; ported math and mermaid text renderers
  - **Callers and wiring:** `ui/editor-view.ts` per frame.
  - **Invariants:** `mode: "source"` returns raw lines with syntax tokens only; reading mode never reveals.
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R1, RM261003ABZP-V8@R1

- **`src/core/index/resolve.ts` and `src/core/index/rename.ts`**
  - **Decisions:** RM261003ABZP-DES7@R2
  - **Change:** Add
  - **Responsibilities:** deterministic link resolution; format-preserving rename planning.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function resolveLink(ix: NoteIndex, from: string, raw: string): LinkTarget | { unresolved: string };
    // order: exact root path (with/without .md) → alias → basename candidates ranked by
    //        (same folder as `from`) → (shortest path) → (alphabetical)
    export function planRename(ix: NoteIndex, from: string, to: string, read: (p: string) => string): FileEdit[];
    // keeps link kind (wiki/md), alias, #heading / #^block; writes the shortest unique form of `to`
    ```

  - **Dependencies:** NoteIndex
  - **Callers and wiring:** `link.follow`, completion, backlinks, `file.rename`, `file.move` commands.
  - **Invariants:** resolution is a pure function of index contents; rename never touches text outside link spans.
  - **Verification:** RM261003ABZP-S4@R1, RM261003ABZP-V5@R1, RM261003ABZP-V6@R1

- **`src/workspace/fs.ts` and `src/workspace/watcher.ts`**
  - **Decisions:** RM261003ABZP-DES8@R1
  - **Change:** Add
  - **Responsibilities:** atomic writes and directory watching with own-write suppression.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export async function atomicWrite(path: string, text: string): Promise<Stamp> {
      const target = await realpathOrSelf(path);
      const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
      const fd = await open(tmp, "w", await modeOr(target, 0o644));
      try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp, target);                     // same directory → atomic on POSIX
      return stampOf(target, text);                  // { mtimeMs, size, hash }
    }
    export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
    // fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
    ```

  - **Dependencies:** `node:fs/promises`, `node:fs` (Bun-compatible)
  - **Callers and wiring:** effect runner for `write`, `create`, `rename`, `move`; `main` starts the watcher.
  - **Invariants:** temp files never appear in the index (prefix `.` is hidden); a failed write deletes its temp file.
  - **Verification:** RM261003ABZP-S1@R1, RM261003ABZP-V1@R1

- **`src/ui/editor-view.ts` and `src/ui/input.ts`**
  - **Decisions:** RM261003ABZP-DES10@R1, RM261003ABZP-DES9@R2
  - **Change:** Add
  - **Responsibilities:** paint RenderLine rows onto an OpenTUI buffer; place images; normalize input.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    // Only file family allowed to import @opentui/*
    export class EditorView extends Renderable {           // custom renderable, not Textarea
      constructor(ctx: RenderContext, private getView: () => LayoutView) { super(ctx, { flexGrow: 1 }); }
      protected renderSelf(buf: OptimizedBuffer) {
        for (const [row, line] of layoutViewport(this.getView(), layoutCtx).entries()) paintLine(buf, row, line, theme);
      }
    }
    export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via escTimeoutMs
    ```

    Exact OpenTUI buffer and image APIs are confirmed against the pinned version in the first delivery item (the class above is illustrative).

  - **Dependencies:** `@opentui/core` (exact pin)
  - **Callers and wiring:** `ui/shell.ts` composes views; store subscription triggers `requestRender()`.
  - **Invariants:** UI never mutates AppState; all input becomes Actions.
  - **Verification:** RM261003ABZP-S9@R1, RM261003ABZP-V12@R1; RM261003ABZP-S11@R1, RM261003ABZP-V17@R1

- **`src/preview/server.ts`**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Change:** Add
  - **Responsibilities:** read-only preview server.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function startPreview(store: Store, root: string): { port: number; stop(): void } {
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0,
        fetch(req) {
          const host = req.headers.get("host");
          if (host !== `127.0.0.1:${server.port}` && host !== `localhost:${server.port}`) return new Response(null, { status: 403 });
          return route(req, store, root);              // "/", "/events", "/render", "/file/*"
        },
      });
      return { port: server.port, stop: () => server.stop(true) };
    }
    ```

  - **Dependencies:** `Bun.serve`; core `renderHtml`
  - **Callers and wiring:** effect runner for `startPreview`/`stopPreview`.
  - **Invariants:** no write routes; `/file/*` passes realpath containment and hidden-folder exclusion.
  - **Verification:** RM261003ABZP-S8@R1, RM261003ABZP-V11@R1

## Cross-cutting and Evolution

| Concern | Mechanism and canonical design location | Verification or reason not applicable |
|---|---|---|
| Security and privacy | No network except loopback preview with Host allowlist and realpath containment (RM261003ABZP-DES13@R2); config is data (TOML), never executed (RM261003ABZP-DES14@R1); no telemetry; notes never logged | RM261003ABZP-V11@R1 |
| Configuration and observability | XDG TOML config validated by schema; errors as notifications; `so --version`; `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content (RM261003ABZP-DES14@R1) | RM261003ABZP-V4@R1 |
| Performance and scalability | Viewport-only layout, block parse cache, worker index and search, frame coalescing, lazy image decode with cache (RM261003ABZP-DES16@R1) | RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 |
| Concurrency, retry, and idempotency | Single-threaded store; worker communicates by messages; saves serialized per path; autosave retry with backoff; own-write stamps make watcher events idempotent (RM261003ABZP-DES8@R1) | RM261003ABZP-V1@R1 |
| Migration and backfill | None — greenfield; Obsidian files are read as-is and written in place | None — no prior data format |
| Mixed-version compatibility | Obsidian file compatibility (Markdown, links, frontmatter, `.base`); Kanban `type` constant isolated in `core/bases/types.ts` and verified against an Obsidian-saved file (RM261003ABZP-DES12@R1) | RM261003ABZP-V10@R1 |
| Rollout and rollback | SemVer releases via release-please; users roll back by installing a previous release binary (RM261003ABZP-DES15@R1) | RM261003ABZP-V14@R1 |
| Known extension needs | Registries: commands and keymaps (DES5), syntax extensions (DES6), block renderers (DES9), Bases view types (DES12) — RM261003ABZP-REQ11@R2 | RM261003ABZP-V16@R1 |

- **System transition:**

```text
empty repo → scaffold (tooling, CI, boundary test, shell) → editor usable → knowledge features → release binaries
                                  └→ rollback: previous release binary; files are plain Markdown, no state migration
```

- **Delivery constraints:** the boundary test and CI exist before feature code so violations never land; the OpenTUI paint and image APIs are confirmed against the pinned version before live-preview work depends on them; the Kanban `type` value is confirmed before Kanban ships.

## Success and Verification

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** This document
  - **Outcome:** across crash, external edit, and save failure scenarios, the file on disk is always a complete old or new version and dirty buffers are never overwritten without a prompt.
  - **Requirements:** RM261003ABZP-REQ1@R2
  - **Design:** RM261003ABZP-DES8@R1 - atomic write, own-write suppression, conflict rules
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S1@R1
      - **Scenario:** in a temp workspace: (a) kill the writer between write and rename (simulated by throwing after fsync); (b) modify an open clean file externally; (c) modify an open dirty file externally; (d) save `so`'s own buffer.
      - **Expected result:** (a) original content intact, no temp file left; (b) buffer reloads and `u` restores previous text; (c) conflict prompt appears, file and buffer unchanged until chosen; (d) no reload or conflict triggered.
      - **Method and target:** integration test on `workspace/fs.ts`, `workspace/watcher.ts`, and `core` conflict reducer
      - **Environment:** real file system (tmpdir), real `fs.watch`
      - **Unique risk:** per-file watch losing events after rename; self-triggered reload loops; partial writes.
      - **Predecessors:** None

- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** This document
  - **Outcome:** every command listed in RM261003ABZP-REQ2@R2 produces Neovim's result on the shared fixture cases.
  - **Requirements:** RM261003ABZP-REQ2@R2
  - **Design:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 - grammar, undo blocks, dot-repeat
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** table of `{ before text + cursor, keys, after text + cursor + register }` cases covering each motion, operator, text object, count, register, search, `:s`, undo/redo, and `.`; expected values recorded from Neovim 0.11 `--clean`.
      - **Expected result:** each case matches exactly.
      - **Method and target:** unit tests on `core/vim/engine.ts` `handleKey`
      - **Environment:** None — pure functions
      - **Unique risk:** subtle divergence (inclusive/exclusive motions, linewise yanks, cursor after undo).
      - **Predecessors:** None
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** feed a lone `\x1b` byte without kitty protocol, then `\x1b[A`, through `ui/input.normalizeKey` with `escTimeoutMs=50`.
      - **Expected result:** lone Esc yields `escape` after 50 ms ± 10 ms; the sequence yields `up` immediately.
      - **Method and target:** unit test on `ui/input.ts`
      - **Environment:** fake timers
      - **Unique risk:** Esc swallowed or arrow keys misread as Esc + letters.
      - **Predecessors:** None

- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** This document
  - **Outcome:** every command is reachable by name in the palette, leader sequences show which-key hints, pickers filter fuzzily, and config overrides apply or fail safely.
  - **Requirements:** RM261003ABZP-REQ3@R3
  - **Design:** RM261003ABZP-DES5@R1, RM261003ABZP-DES14@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V4@R1 — Keymap, which-key, palette, and config**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S3@R1
      - **Scenario:** (a) press `Space` and wait; (b) bind `"<leader>w" = "file.save"` in config and press it; (c) load a config with a syntax error on line 7; (d) set `XDG_CONFIG_HOME=relative/path`; (e) open the palette and type `today`.
      - **Expected result:** (a) which-key lists groups; (b) file saved; (c) notification names `config.toml:7` and defaults apply; (d) `~/.config/so/config.toml` used; (e) `note.today` ranks first.
      - **Method and target:** unit tests on `core/commands`, `workspace/config-file.ts`; component test through the OpenTUI test renderer for (a)
      - **Environment:** tmp config dirs; OpenTUI test renderer
      - **Unique risk:** config error crashing startup; overrides silently ignored.
      - **Predecessors:** None

- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** This document
  - **Outcome:** link following, completion, backlinks, and tags match the index; rename updates every reference while preserving format.
  - **Requirements:** RM261003ABZP-REQ4@R3
  - **Design:** RM261003ABZP-DES7@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** workspace with `a/plan.md`, `b/plan.md`, `plan-x.md` (alias `plan`), `c/deep/plan.md`; resolve `[[plan]]` from `a/x.md`, from `root.md`, `[[b/plan]]`, `[[plan.md]]`, `[[note#H1#H2]]`, `[text](a/plan%20x.md)`.
      - **Expected result:** results follow the documented order exactly.
      - **Method and target:** unit tests on `core/index/resolve.ts`
      - **Environment:** None — in-memory index
      - **Unique risk:** nondeterministic or Obsidian-incompatible targets.
      - **Predecessors:** None
    - **RM261003ABZP-V6@R1 — Rename preserves link formats**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** rename `plan.md` → `projects/roadmap.md` with references `[[plan]]`, `[[plan|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)`, frontmatter `related: "[[plan]]"`, and an open dirty buffer containing `[[plan]]`.
      - **Expected result:** all rewritten in place with kind, alias, subpath preserved and shortest unique path; the dirty buffer is edited in memory (not overwritten on disk); notification reports the file count.
      - **Method and target:** unit test on `planRename` + integration test of the rename command
      - **Environment:** tmp workspace
      - **Unique risk:** broken links or clobbered unsaved edits.
      - **Predecessors:** None

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** This document
  - **Outcome:** each element listed in RM261003ABZP-REQ5@R2 renders as specified, reveal follows the cursor line or block, and images use the best available protocol.
  - **Requirements:** RM261003ABZP-REQ5@R2
  - **Design:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V7@R1 — Layout golden tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** `test/fixtures/tour.md` (every element) laid out at widths 60 and 100 with the cursor outside any block, on a bold line, inside a table, inside a callout.
      - **Expected result:** `RenderLine[]` serialized to text + style tokens matches committed goldens.
      - **Method and target:** unit tests on `layoutViewport`
      - **Environment:** None — pure
      - **Unique risk:** reveal or hiding regressions; broken table alignment.
      - **Predecessors:** None
    - **RM261003ABZP-V8@R1 — Image protocol selection**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** render a note with a PNG in the OpenTUI test renderer with capabilities kitty / sixel / none / `images="off"`.
      - **Expected result:** kitty or sixel placement, block characters, or `[image: name.png]` placeholder respectively.
      - **Method and target:** component test on `ui/editor-view.ts`
      - **Environment:** OpenTUI test renderer with mocked capabilities
      - **Unique risk:** images breaking layout or crashing on unsupported terminals.
      - **Predecessors:** None

- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** This document
  - **Outcome:** `:Today` and template insertion produce the same text Obsidian's core plugins would for the supported tokens.
  - **Requirements:** RM261003ABZP-REQ6@R2
  - **Design:** RM261003ABZP-DES11@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S6@R1
      - **Scenario:** format 2026-10-03T09:05 with every supported token and `[literal]`; expand a template containing all variables; compute daily paths for `YYYY-MM-DD` and `YYYY/MM/YYYY-MM-DD`; run `:Today` twice.
      - **Expected result:** strings equal Moment.js output for the same tokens; unsupported tokens stay literal; second `:Today` opens the existing file without changing it.
      - **Method and target:** unit tests on `core/time`, `core/notes`; integration test for `:Today`
      - **Environment:** fixed clock; tmp workspace
      - **Unique risk:** wrong dates, overwritten daily notes.
      - **Predecessors:** None

- **RM261003ABZP-S7@R1 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** This document
  - **Outcome:** table and Kanban views show the correct rows, edits write valid frontmatter, and unsupported layouts fall back safely.
  - **Requirements:** RM261003ABZP-REQ7@R2
  - **Design:** RM261003ABZP-DES12@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V10@R1 — Bases evaluation, edit, and compatibility**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S7@R1
      - **Scenario:** fixtures ported from Alfred's Bases tests plus a Kanban `.base` saved by Obsidian 1.14+; edit a cell; move a card; open a `cards` view; group by a formula.
      - **Expected result:** rows and order match fixtures; frontmatter patched with comments and order preserved; card move sets the property; `cards` opens as table with notice; moving is disabled for formula grouping.
      - **Method and target:** unit tests on `core/bases`; integration test of write-back
      - **Environment:** tmp workspace
      - **Unique risk:** YAML corruption; Kanban type mismatch with Obsidian.
      - **Predecessors:** None

- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** This document
  - **Outcome:** the browser follows edits within 300 ms and the server rejects foreign hosts and out-of-workspace paths.
  - **Requirements:** RM261003ABZP-REQ8@R2
  - **Design:** RM261003ABZP-DES13@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V11@R1 — Preview server behavior and safety**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S8@R1
      - **Scenario:** start preview; request with Host `evil.test:<port>`; request `/file/..%2f..%2fetc/passwd`; request a symlink pointing outside; request `/file/.git/config`; dispatch an edit and measure time to the SSE event.
      - **Expected result:** 403; 404; 404; 404; SSE event < 300 ms after the edit; server bound only to 127.0.0.1.
      - **Method and target:** integration test on `preview/server.ts`
      - **Environment:** real `Bun.serve`, tmp workspace with symlink
      - **Unique risk:** DNS rebinding, traversal, network exposure.
      - **Predecessors:** None

- **RM261003ABZP-S9@R1 — Performance targets hold**
  - **Definition:** This document
  - **Outcome:** the targets in RM261003ABZP-REQ9@R2 are met on the reference machine and gated at 2× in CI.
  - **Requirements:** RM261003ABZP-REQ9@R2
  - **Design:** RM261003ABZP-DES16@R1, RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES7@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V12@R1 — Keystroke and open-note benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** open the 5,000-line fixture in live preview in the OpenTUI test renderer (120×40); send 200 mixed keystrokes (`j`, `w`, `i` + text + `Esc`, `dd`, `u`); measure input → frame complete; measure open time.
      - **Expected result:** p95 < 16 ms and open < 50 ms on the reference machine; CI median of 5 runs < 32 ms and < 100 ms.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** OpenTUI test renderer; fixed CI runner type
      - **Unique risk:** full-document parse or layout sneaking into the keystroke path.
      - **Predecessors:** None
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** generate a 10,000-note workspace; start `so`; record time to first interactive frame and to index ready; type during indexing.
      - **Expected result:** first frame < 200 ms; index ready < 3 s; keystrokes during indexing still meet the V12 budget.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** generated fixture; real worker
      - **Unique risk:** indexing blocking the main thread.
      - **Predecessors:** None

- **RM261003ABZP-S10@R1 — Development, CI, and release are fast and automatic**
  - **Definition:** This document
  - **Outcome:** `bun run check` < 30 s; CI < 3 min; release produces four checksummed binaries that start.
  - **Requirements:** RM261003ABZP-REQ10@R2
  - **Design:** RM261003ABZP-DES15@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V14@R1 — Check timing, CI timing, and release dry run**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S10@R1
      - **Scenario:** time `bun run check` locally; read CI run durations; run the release workflow on a pre-release tag.
      - **Expected result:** < 30 s; < 3 min; GitHub Release with 4 binaries + `SHA256SUMS`; smoke jobs print `so <version>` on macOS and Linux.
      - **Method and target:** non-test check on CI and release workflows
      - **Environment:** GitHub Actions
      - **Unique risk:** slow feedback loops; binaries missing OpenTUI's native library.
      - **Predecessors:** None

- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored**
  - **Definition:** This document
  - **Outcome:** boundary violations fail CI; features extend by registration; terminal state is restored on every exit path; standards are followed.
  - **Requirements:** RM261003ABZP-REQ11@R2
  - **Design:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R1, RM261003ABZP-DES10@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V15@R1 — Import boundary test**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** scan every `src/**/*.ts` with `Bun.Transpiler.scanImports`; include a deliberate violation fixture.
      - **Expected result:** core imports only core and allowed parsing packages; only `src/ui/**` imports `@opentui/*`; the fixture fails.
      - **Method and target:** `test/boundaries.test.ts`
      - **Environment:** None
      - **Unique risk:** layering eroding silently.
      - **Predecessors:** None
    - **RM261003ABZP-V16@R1 — Registration-only extension**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** a test module registers a command, a keymap, a syntax extension, and a block renderer without touching other modules.
      - **Expected result:** the command runs from the palette and keymap; the syntax renders through the renderer.
      - **Method and target:** unit test across `core/commands`, `core/markdown`, `core/layout`
      - **Environment:** None
      - **Unique risk:** hidden switch statements that require edits to extend.
      - **Predecessors:** None
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** in a PTY, start `so`, then exit by `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception; set `NO_COLOR=1` in one run.
      - **Expected result:** after each exit the PTY is back on the main screen with cursor visible, mouse and kitty keyboard modes off; the `NO_COLOR` run emits no colour SGR codes.
      - **Method and target:** e2e PTY test in `test/e2e/`
      - **Environment:** real PTY (`Bun.spawn` with a pseudo-terminal), headless terminal emulator to read state
      - **Unique risk:** leaving the user's terminal broken.
      - **Predecessors:** None

## Design Decisions and Traceability

- **RM261003ABZP-DES1@R1 — One process, one package, four layers with a tested import boundary**
  - **Requirements:** RM261003ABZP-REQ11@R2 - pure core, enforced boundaries; RM261003ABZP-REQ10@R2 - fast checks
  - **Decision:** `src/core` (pure), `src/workspace` (I/O), `src/ui` (OpenTUI), `src/preview` (HTTP), wired only in `src/app`. A `bun test` boundary test using `Bun.Transpiler.scanImports` enforces the import rules.
  - **Explanation:** System Architecture diagram; `test/boundaries.test.ts`. One package keeps install and CI fast; the test needs no TypeScript API (`RM261003ABZP-RF13`).
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred needed six packages because of its kernel; `so` has no server boundary.
  - **Research:** `RM261003ABZP-RF1` - contain OpenTUI to the UI layer; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2. `RM261003ABZP-RF13` - avoid TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Tradeoffs:** folder conventions rather than package boundaries; rejected a Turborepo monorepo (slower, more config) and dependency-cruiser (TS 7 issue).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES2@R2 — One store with a pure reducer and data-only effects**
  - **Requirements:** RM261003ABZP-REQ11@R2 - stable, testable foundations; RM261003ABZP-REQ1@R2 - autosave and conflicts; RM261003ABZP-REQ9@R2 - predictable rendering
  - **Decision:** `update(state, action) → { state, effects }`; effects are plain data executed by `app/effects.ts`; results return as actions.
  - **Explanation:** Action and Effect protocol; AppState; `src/core/state/update.ts`. Every behavior (autosave timing, conflict choice, rename) is a pure function test.
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts` - Alfred's vim core already returns effects instead of performing them.
  - **Research:** None
  - **Tradeoffs:** an extra indirection for I/O; rejected UI components holding state (hard to test, the Ink/React pattern Alfred needed a compositor around).
  - **Dependencies:** RM261003ABZP-DES1@R1
  - **Predecessors:** RM261003ABZP-DES2@R1

- **RM261003ABZP-DES3@R1 — Line-array TextBuffer behind an interface, with vim undo blocks**
  - **Requirements:** RM261003ABZP-REQ2@R2 - undo per undo block; RM261003ABZP-REQ9@R2 - 5,000-line target
  - **Decision:** immutable line array with structural sharing; `apply(edit)` returns an inverse; undo stack of blocks (one Normal command or one Insert session).
  - **Explanation:** TextBuffer model; `src/core/editor/text-buffer.ts`. A piece table can replace the implementation without changing callers.
  - **Evidence:** `alfred/apps/tui/src/view/editor/text-buffer.ts` - single-string buffer (186 lines) as reference.
  - **Research:** `RM261003ABZP-RF6` - line array adequate at ≤ 5,000 lines; undo block = typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** O(lines) splices on huge files; rejected OpenTUI's native `EditBuffer` as source of truth (couples core to a 0.x UI library).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES4@R1 — Table-driven vim engine**
  - **Requirements:** RM261003ABZP-REQ2@R2 - core vim command set, Esc timeout
  - **Decision:** a pure key-sequence parser for `[count]["reg][count]op[count](motion|textobject)` with motion, operator, and text-object tables; mode machine (normal, insert, visual char/line, cmdline); last-change record for `.`; ex command table.
  - **Explanation:** `src/core/vim/engine.ts`; Esc timeout handled in `ui/input.ts` (RM261003ABZP-DES10@R1).
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts:15` - Alfred supports only two modes with a hard-coded pending set.
  - **Research:** `RM261003ABZP-RF5` - kitty keyboard protocol, 50 ms timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** no macros or Visual block in v1 (deferred); rejected embedding Neovim (user decision).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES5@R1 — Command registry and keymap trie as the single extension point for actions**
  - **Requirements:** RM261003ABZP-REQ3@R3 - leader, which-key, palette, config; RM261003ABZP-REQ11@R2 - extend by registration
  - **Decision:** every action is a named `Command`; keys map to command ids through a per-mode trie; which-key, palette, help, and config overrides read the same registry.
  - **Explanation:** `src/core/commands/registry.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input - LazyVim style.
  - **Research:** None
  - **Tradeoffs:** commands must be pure (state + effects), which forbids quick ad-hoc I/O in commands; accepted for testability.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** None

- **RM261003ABZP-DES6@R1 — micromark/mdast with Obsidian extensions and block-level reparse**
  - **Requirements:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2
  - **Decision:** port Alfred's micromark + GFM + math parsing and Obsidian syntax into `core/markdown`; split into blocks and reparse only changed blocks; one `Doc` feeds layout, index, and HTML.
  - **Explanation:** Doc model; `src/core/markdown/doc.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` - existing micromark pipeline.
  - **Research:** `RM261003ABZP-RF7` - micromark conformant but not incremental; block reparse meets budgets; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block splitting must handle lists, fences, and frontmatter carefully; rejected OpenTUI's tree-sitter Markdown (UI-layer dependency, no Obsidian syntax) and Lezer (skips link reference validation; another parser to learn).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES7@R2 — Worker-built in-memory index with a documented resolution rule**
  - **Requirements:** RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename; RM261003ABZP-REQ3@R3 - pickers and full-text search; RM261003ABZP-REQ9@R2 - non-blocking index
  - **Decision:** a Bun `Worker` scans and summarizes notes and answers full-text queries; the main thread holds `NoteIndex` built from summaries; resolution order: root path → alias → basename ranked by same folder, shortest path, alphabetical; `planRename` rewrites link spans only; `link.linkMention` wraps one unlinked mention in `[[…]]` in its source note through a span edit (open buffer in memory, closed file via `write`).
  - **Explanation:** NoteSummary and NoteIndex; `resolve.ts`; `rename.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred used SQLite; `so` has no persistence need for the index.
  - **Research:** `RM261003ABZP-RF8` - duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Tradeoffs:** reindex on every start (< 3 s target); rejected SQLite (persistence and schema cost without need) and ripgrep (external binary).
  - **Dependencies:** RM261003ABZP-DES6@R1
  - **Predecessors:** RM261003ABZP-DES7@R1

- **RM261003ABZP-DES8@R1 — Atomic saves, directory watching, own-write stamps, and trash adapters**
  - **Requirements:** RM261003ABZP-REQ1@R2 - safe file management
  - **Decision:** `atomicWrite` (realpath → same-dir temp → fsync → chmod → rename); `fs.watch(root, {recursive:true})` with per-path debounce and own-write stamps; trash via freedesktop spec on Linux and Finder automation (`osascript`) on macOS, else typed confirmation; autosave policy and conflict rules live in core.
  - **Explanation:** `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow.
  - **Evidence:** `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - autosave queue reference.
  - **Research:** `RM261003ABZP-RF11` - fsync, same directory, directory watching, undoable reload; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2
  - **Tradeoffs:** rename-based saves replace hard links (acceptable for notes); recursive `fs.watch` relies on platform support in Bun on macOS and Linux — verified in the first delivery item.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** None

- **RM261003ABZP-DES9@R2 — Viewport-only live-preview layout with line and block reveal and registered block renderers**
  - **Requirements:** RM261003ABZP-REQ5@R2 - live preview; RM261003ABZP-REQ9@R2 - smooth scrolling
  - **Decision:** pure `layoutViewport` produces `RenderLine[]` for visible rows only; cursor line reveals inline syntax, cursor inside a multi-line block reveals the whole block; folded callouts and expanded embeds follow the window's `folds` set; block renderers are registered per block kind; widgets (image, embed, base) reserve rows.
  - **Explanation:** RenderLine model; `src/core/layout/layout.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/editor/reveal-units.ts` - reveal units reference.
  - **Research:** `RM261003ABZP-RF7` - per-element reveal in Obsidian; block reveal for multi-line constructs; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal; rejected OpenTUI `MarkdownRenderable` conceal (UI-owned parsing, no Obsidian syntax).
  - **Dependencies:** RM261003ABZP-DES6@R1
  - **Predecessors:** RM261003ABZP-DES9@R1

- **RM261003ABZP-DES10@R1 — OpenTUI shell with a custom editor renderable, normalized input, and guaranteed terminal restore**
  - **Requirements:** RM261003ABZP-REQ2@R2 - Esc, cursor shape; RM261003ABZP-REQ3@R3 - explorer, overlays; RM261003ABZP-REQ5@R2 - images; RM261003ABZP-REQ11@R2 - restore, `NO_COLOR`, terminal support
  - **Decision:** `@opentui/core` pinned exactly; layout of explorer, bufferline, window splits, side panel, statusline, cmdline, overlays; a custom `EditorView` renderable paints `RenderLine[]`; images via OpenTUI's auto protocol (kitty → sixel → blocks); input normalized to `Key` with kitty keyboard protocol and Esc timeout; theme tokens with `NO_COLOR`; restore on exit, signals, and uncaught errors.
  - **Explanation:** `src/ui/*`; `src/ui/editor-view.ts`.
  - **Evidence:** `alfred/apps/tui/src/terminal/shutdown.ts` - restore coordinator reference; Context7 `/anomalyco/opentui`.
  - **Research:** `RM261003ABZP-RF1`, `RM261003ABZP-RF2`, `RM261003ABZP-RF4`, `RM261003ABZP-RF5`; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Tradeoffs:** dependence on a 0.x library contained to `src/ui`; rejected Ink (React redraw cost) and a custom renderer (upfront cost).
  - **Dependencies:** RM261003ABZP-DES1@R1, RM261003ABZP-DES9@R2
  - **Predecessors:** None

- **RM261003ABZP-DES11@R1 — Shared Moment-subset formatter, pure template expansion, and daily-note commands**
  - **Requirements:** RM261003ABZP-REQ6@R2 - daily notes and templates; RM261003ABZP-REQ7@R2 - Bases date formatting
  - **Decision:** `core/time/format.ts` implements the documented token subset and `[literal]`; `core/notes` computes daily paths (with `/` subfolders) and expands `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}`; commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`.
  - **Explanation:** `src/core/time/format.ts`; `src/core/notes/*`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input.
  - **Research:** `RM261003ABZP-RF10` - Moment tokens, `{{time:FORMAT}}`, subfolders; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Tradeoffs:** rare tokens unsupported (kept literal); rejected Moment.js and Day.js dependencies (maintenance mode; extra weight).
  - **Dependencies:** RM261003ABZP-DES5@R1
  - **Predecessors:** None

- **RM261003ABZP-DES12@R1 — Ported Bases engine with table and Kanban view models and YAML-preserving write-back**
  - **Requirements:** RM261003ABZP-REQ7@R2 - Bases table and Kanban views
  - **Decision:** port `alfred/packages/vault/src/domain/bases/*` (parser, evaluator, expression, yaml-patcher) and `alfred/packages/view-model/src/base/*` row and board rules into `core/bases`; view models `TableModel` and `KanbanModel`; unknown layouts map to `TableModel` with a notice; the Kanban `type` string is one constant verified against an Obsidian 1.14+ file; edits become `write` effects through the atomic save path; embeds render through a `base` block renderer.
  - **Explanation:** `src/core/bases/*`; Base views in `src/ui/views/`.
  - **Evidence:** `alfred/packages/vault/src/domain/bases/parser.ts:19`, `evaluator.ts:164` - no file-system or Bun imports (context assumption).
  - **Research:** `RM261003ABZP-RF9` - layouts, Kanban rules; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - **Tradeoffs:** follows an early-access Obsidian layout; guarded by the constant, a fixture, and the table fallback.
  - **Dependencies:** RM261003ABZP-DES7@R2, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES11@R1
  - **Predecessors:** None

- **RM261003ABZP-DES13@R2 — `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering**
  - **Requirements:** RM261003ABZP-REQ8@R2 - read-only preview
  - **Decision:** `preview/server.ts` binds `127.0.0.1:0`, checks Host, serves a page shell, SSE `/events` (`doc` and `stopped` events), `/render` fragments from core `renderHtml(doc)`, and contained `/file/*`; the page loads KaTeX and Mermaid from jsDelivr and falls back to showing source when offline.
  - **Explanation:** Preview HTTP routes; `src/preview/server.ts`; `src/core/render-html/render.ts`.
  - **Evidence:** user decision "no Next.js".
  - **Research:** `RM261003ABZP-RF12` - binding, Host check, containment, SSE; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Tradeoffs:** math and diagrams need network in the browser (fallback to source); rejected bundling KaTeX/Mermaid into the binary (multi-MB size) and WebSocket (bidirectional not needed).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R2
  - **Predecessors:** RM261003ABZP-DES13@R1

- **RM261003ABZP-DES14@R1 — TOML config at XDG path validated by schema; per-workspace state at XDG state path**
  - **Requirements:** RM261003ABZP-REQ3@R3 - configuration and state
  - **Decision:** `Bun.TOML.parse` + zod schema (`core/config/schema.ts`); config path honors XDG rules (relative values ignored); invalid config → error notice + defaults; state JSON at `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json` holding recent notes, jump list, open buffers, window layout.
  - **Explanation:** AppConfig; `src/workspace/config-file.ts`; `src/workspace/state-file.ts`.
  - **Evidence:** `rm261003abzp-research.md` S21, S9, S30.
  - **Research:** `RM261003ABZP-RF15` - TOML, XDG rules, state home; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R3)
  - **Tradeoffs:** TOML instead of the proposal's `config.ts` — no code execution and simpler validation, at the cost of no scripting in config (agent decision under delegation).
  - **Dependencies:** RM261003ABZP-DES5@R1
  - **Predecessors:** None

- **RM261003ABZP-DES15@R1 — Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile**
  - **Requirements:** RM261003ABZP-REQ10@R2 - fast checks, CI, release; RM261003ABZP-REQ11@R2 - Conventional Commits, SemVer
  - **Decision:** Bun (exact version in `packageManager`), TypeScript 7 `tsc --noEmit` strict, Biome, knip, `bun test` (unit colocated; component via OpenTUI test renderer; few PTY e2e); `bun run check` = biome check + tsc + knip + boundary test + unit tests; CI jobs `check` and `test` (component, e2e, bench) in parallel with Bun cache; release-please on `main`; release job on tag: `bun install --os="*" --cpu="*"`, compile `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64`, `bun-linux-arm64` with `OPENTUI_LIBC=glibc` defined for Linux, `SHA256SUMS`, smoke `so --version` on `macos-latest` and `ubuntu-latest`.
  - **Explanation:** Project Structure (`package.json`, `.github/workflows/*`).
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's eight CI groups are the anti-pattern avoided.
  - **Research:** `RM261003ABZP-RF3`, `RM261003ABZP-RF13`, `RM261003ABZP-RF14`; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - **Tradeoffs:** unsigned macOS binaries (signing deferred); release-please adds a bot PR.
  - **Dependencies:** RM261003ABZP-DES1@R1
  - **Predecessors:** None

- **RM261003ABZP-DES16@R1 — Performance by construction plus benchmark gates**
  - **Requirements:** RM261003ABZP-REQ9@R2 - performance targets
  - **Decision:** viewport-only layout (DES9), block parse cache (DES6), worker index and search (DES7), frame coalescing (one render per input burst), first frame before indexing, lazy image decode with an LRU cache (64 MiB), and benchmarks through the OpenTUI test renderer gated at 2× (median of 5) in CI.
  - **Explanation:** Keystroke to frame and Startup flows; `test/bench/`.
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's 64 MiB image budget precedent.
  - **Research:** `RM261003ABZP-RF2` - in-process metrics; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Tradeoffs:** benchmarks add CI time (bounded by the 3 min budget); terminal display latency is outside the measurement.
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES9@R2
  - **Predecessors:** None

| Current requirement | Design decision | Canonical design location | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R2 - folder workspace, safe files | RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R2 | `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow | RM261003ABZP-S1@R1 | RM261003ABZP-V1@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R1 | `src/core/editor/`, `src/core/vim/`, `src/ui/input.ts` | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R3 - navigation, config, state | RM261003ABZP-DES5@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES10@R1, RM261003ABZP-DES14@R1 | `src/core/commands/`, `src/ui/overlays/`, `src/workspace/config-file.ts`, `state-file.ts` | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R1 |
| RM261003ABZP-REQ4@R3 - links | RM261003ABZP-DES7@R2, RM261003ABZP-DES6@R1 | `src/core/index/` | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R1 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1 | `src/core/markdown/`, `src/core/layout/`, `src/ui/editor-view.ts` | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R1, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | `src/core/time/`, `src/core/notes/` | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R1, RM261003ABZP-DES11@R1 | `src/core/bases/`, `src/ui/views/` | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - preview | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R1 | `src/preview/`, `src/core/render-html/` | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R1 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-DES16@R1 | Keystroke and Startup flows; `test/bench/` | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R2 - dev, CI, release | RM261003ABZP-DES15@R1, RM261003ABZP-DES1@R1 | `package.json`, `.github/workflows/` | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R2 - foundations | RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R1, RM261003ABZP-DES10@R1 | `test/boundaries.test.ts`, registries, `src/ui/shell.ts` | RM261003ABZP-S11@R1 | RM261003ABZP-V15@R1, RM261003ABZP-V16@R1, RM261003ABZP-V17@R1 |

## Unresolved Items

None — open technical confirmations (OpenTUI paint/image API details at the pinned version, recursive `fs.watch` behavior, Kanban `type` value) are delivery constraints with named verification, not design decisions.

## Approval

- **Requirement baseline:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ4@R3 … RM261003ABZP-REQ11@R2
- **Approved design:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1 … RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1 … RM261003ABZP-DES12@R1, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R1 … RM261003ABZP-DES16@R1
- **Approved success and verification:** RM261003ABZP-S1@R1 … RM261003ABZP-S11@R1; RM261003ABZP-V1@R1 … RM261003ABZP-V17@R1
- **Approval evidence:** User delegated all decisions on 2026-10-03 ("you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"); the agent approved this design, and the DES2/DES7/DES9/DES13 R2 revisions from the UI system-impact assessment, under that delegation.
`````

- **RM261003ABZP-DES1@R1, RM261003ABZP-DES5@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1, RM261003ABZP-DES12@R1, RM261003ABZP-V4@R1, RM261003ABZP-V7@R1, RM261003ABZP-V12@R1, RM261003ABZP-V15@R1, RM261003ABZP-V16@R1, RM261003ABZP-V11@R2 — Language-neutral editor kernel and file-type registry**
  - **Archived at:** 2026-10-03T04:08:12Z
  - **Change type:** Revised
  - **Reason:** Scope change 2026-10-03 (`rm261003abzp-roadmap-context.md@R2`): `so` stays Markdown-first but must be able to grow into a code editor and notebooks; the requirements were revised to RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ11@R3.
  - **Changes:** `src/core` splits into a language-neutral `kernel/` (text, editor, vim, commands, view) and `filetypes/`, `lang/`, `features/` modules, with a kernel import rule in the boundary test (DES1). Keymaps bind by mode and optional file type, and commands declare file types (DES5). The worker lists every non-excluded file, summarizes Markdown, and searches text files (DES7). Live-preview layout becomes a generic viewport text view consuming decorations, with Markdown live preview as a decoration provider (DES9). The UI paints windows through an editor-kind view registry and widget painters keyed by widget type (DES10). Bases is a registered file type with the `base` editor kind (DES12). New DES17 defines the FileType registry, the core `EditorKindRegistry` (non-text kinds create their window state through `open`; `text` is built in), the per-language view-input context built by `core/state`, the highlighter interface (lowlight in v1), and the text-file open policy (binary and size guard, BOM). New S12/V18 prove non-Markdown files open safely; V4, V7, V12, V15, V16 extend their scenarios. Unchanged decisions keep their revisions; their code moved under the new folders (non-semantic location edits).
  - **Record transitions:**
    - RM261003ABZP-DES1@R1 → RM261003ABZP-DES1@R2 - revision change (kernel/lang/features layers; kernel import rule)
    - RM261003ABZP-DES5@R1 → RM261003ABZP-DES5@R2 - revision change (file-type-scoped keymaps and commands)
    - RM261003ABZP-DES7@R2 → RM261003ABZP-DES7@R3 - revision change (all-file listing; text-file search; moved to `features/links`)
    - RM261003ABZP-DES9@R2 → RM261003ABZP-DES9@R3 - revision change (generic text view + decoration providers)
    - RM261003ABZP-DES10@R1 → RM261003ABZP-DES10@R2 - revision change (editor-kind views, widget painters)
    - RM261003ABZP-DES12@R1 → RM261003ABZP-DES12@R2 - revision change (Bases registered as an editor kind)
    - None → RM261003ABZP-DES17@R1 - New identity at R1 (FileType registry, highlighters, text-file open policy)
    - None → RM261003ABZP-S12@R1, RM261003ABZP-V18@R1 - New identity at R1
    - RM261003ABZP-V4@R1 → RM261003ABZP-V4@R2; RM261003ABZP-V7@R1 → RM261003ABZP-V7@R2; RM261003ABZP-V12@R1 → RM261003ABZP-V12@R2; RM261003ABZP-V15@R1 → RM261003ABZP-V15@R2; RM261003ABZP-V16@R1 → RM261003ABZP-V16@R2 - revision change (scenarios extended)
    - RM261003ABZP-V11@R2 → RM261003ABZP-V11@R3 - revision change (preview follows Markdown buffers only; `:Preview` is note-only)
    - Roadmap review resolutions in the same change (2026-10-03): kernel types made generic (`Command<Ctx, R>`, open `Mode`, kernel-owned `Highlighter` and `highlightMarks`); `EditorKind` opened to registered strings with `registerEditorView`; views gain an `input` hook and `livePreview` takes `MarkdownViewInput`; V4@R2 (e)/(f) use DI2 commands; V12@R2 adds the 60 fps scroll case; V16@R2 adds an editor-kind registration; V18@R1 states the `Makefile` file type; S12@R1 leaves note-key exclusion to V4@R2.
    - RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES6@R1, RM261003ABZP-DES8@R1, RM261003ABZP-DES11@R1, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES16@R1 → same references - Revision retained (paths under `src/core/kernel`, `lang`, `features` only; requirement references updated). DES13@R2 is retained deliberately: `:Preview` following Markdown notes only is a flow-level refinement of the existing decision, consistent with RM261003ABZP-REQ8@R2 ("serves the current note"), and is recorded in the Preview flow and RM261003ABZP-V11@R3
  - **Requirement baseline:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ11@R2 → RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ11@R3; others unchanged
  - **Evidence:** `rm261003abzp-requirements-revisions.md` entry "REQ1@R2, REQ3@R3, REQ11@R2 — Markdown-first, language-neutral editor core"; `rm261003abzp-roadmap-context.md@R2` User Input.
  - **Research provenance:**
    - `RM261003ABZP-RF6` - line array and pure TS text model; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R3 (via R2); supports RM261003ABZP-DES1@R2
    - `RM261003ABZP-RF7` - block reparse and reveal; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2; supports RM261003ABZP-DES9@R3
    - `RM261003ABZP-RF15` - TOML and XDG; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R4 (via R2, R3); supports RM261003ABZP-DES5@R2
  - **Affected coverage:** REQ1@R2 → REQ1@R3 adds DES17/S12/V18; REQ3@R3 → REQ3@R4 rows add DES5@R2, DES17@R1; REQ11@R2 → REQ11@R3 rows add DES1@R2, DES9@R3, DES17@R1, S12@R1
  - **Approval evidence:** User selected "Apply all six (Recommended)" in `AskUserQuestion` on 2026-10-03 after the chat proposal (kernel split, FileType registry, decorations, file-type keymaps, highlighter interface, open any text file; non-goals listed). The user then delegated every remaining sub-decision on 2026-10-03 ("you self-drive everything. Everything is good now, don't need to stop"), covering the 16 MiB limit, binary check, BOM preservation, all-file picker and text-file search, `[filetypes.<id>.keys.<mode>]` config, no statusline file-type segment, S12/V18, the TypeScript benchmark, and the lowlight look-back.
  - **Downstream impact:** `rm261003abzp-ui-requirements.md`, `rm261003abzp-ui-design.md` (non-Markdown file states and system-contract references); both phase files and `rm261003abzp-roadmap-index.md` (DI1–DI4 revisions). No Work or PR exists yet.

`````markdown
# RM261003ABZP: so v1 — Design

- **Status:** Approved
- **Outcome:** One Bun process with a pure TypeScript core (editor, vim, Markdown, index, Bases, templates) driven by one-way state flow, thin I/O adapters, an OpenTUI shell that draws only visible lines, and a read-only `Bun.serve` preview — enforced by an import-boundary test and gated by fast CI with in-process performance benchmarks.
- **History:** `rm261003abzp-design-revisions.md`

Use `None — <reason>` for sections or fields that do not apply. Diagrams and code previews show proposed design unless labeled as current evidence.

## Baseline and Goals

- **Context:** `rm261003abzp-roadmap-context.md@R1` - empty repository; Alfred code available to port (Markdown parse, Obsidian syntax, vim core, terminal graphics, Bases).
- **Requirements:** `rm261003abzp-requirements.md` - RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ4@R3 … RM261003ABZP-REQ11@R2 (approved).
- **Research:** `rm261003abzp-research.md`
- **Reconciliation:** `rm261003abzp-requirements.md` Research Reconciliation — Complete.
- **Goals:**
  - Meet REQ1–REQ11 with the fewest moving parts: one process, one package, one state store.
  - Keep every product rule in a pure, unit-testable core; keep OpenTUI, Bun, and the file system at the edges.
  - Extend by registration (commands, keymaps, syntax extensions, block renderers, Bases view types) — the known extension needs from RM261003ABZP-REQ11@R2.
- **Binding constraints:**
  - `.s1mple/S1MPLE.md` Implementation - "Keep it lean and simple": no monorepo, no server between UI and core, no speculative plugin system.
  - RM261003ABZP-REQ11@R2 - only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs.
  - RM261003ABZP-REQ10@R2 - no tool may depend on the TypeScript compiler API (TypeScript 7 ships none, `RM261003ABZP-RF13`).

## System Architecture

- **System context:** One user in a terminal runs `so [path]`. External systems: the file system (the workspace folder, `$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, trash), the terminal emulator (keys, mouse, graphics), the system clipboard, and — only while `:Preview` runs — a local browser over `127.0.0.1`. No network service, database, Git, or AI.
- **Current architecture:** `rm261003abzp-roadmap-context.md@R1` Current System — empty repository.

```text
Not established — empty repository (only .s1mple/ guidance)
```

- **Proposed architecture:**

```text
                         ┌──────────────────────── src/app (composition root) ────────────────────────┐
 terminal ⇄ OpenTUI ⇄    │  main.ts → loads config/state → creates Store → starts UI, effects, workers │
                         └──────┬──────────────────────┬───────────────────────┬────────────────────┬──┘
                                │                      │                       │                    │
                   ┌────────────▼─────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
                   │ src/ui  (OpenTUI)    │  │ src/workspace (I/O)│  │ src/preview       │  │ src/core (pure)│
                   │ views, input, paint  │  │ fs, watcher, trash │  │ Bun.serve + SSE   │  │ state, vim,    │
                   │ images, theme        │  │ index worker, cfg  │  │ read-only HTML    │  │ markdown,index │
                   └────────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │ bases, layout  │
                                │ reads state,          │ executes effects,     │ reads state, └───────▲────────┘
                                │ dispatches actions    │ dispatches results    │ renders HTML         │
                                └───────────────────────┴───────────────────────┴──────── import ──────┘

 Allowed imports:  app → ui, workspace, preview, core      ui → core      workspace → core      preview → core
                   core → (nothing outside core; npm parsing libs only)
```

The core owns all product behavior; the three edge layers are adapters. This reuses Alfred's parsing, Obsidian syntax, vim, terminal-graphics knowledge, and Bases engine by porting them into `core/` (Alfred's kernel, client, protocol, chat, Git, SQLite, Ink, and Next.js are not reused). Main tradeoff: one process keeps latency and code minimal, but a CPU-heavy task on the main thread would stall input — so scanning, parsing for the index, and full-text search run in a worker (RM261003ABZP-DES7@R2).

## Components and Boundaries

- **App (composition root)**
  - **Decisions:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2
  - **Location:** `src/app/`
  - **Responsibilities:** parse CLI args; load config and state; construct the store, effect runner, workspace adapters, index worker, UI, and preview on demand; own process lifecycle and exit codes.
  - **Collaborators:** `bin/so` → `app/main.ts` → `core/store`, `workspace/*`, `ui/shell`, `preview/server`
  - **Contracts:** Action and Effect protocol; AppConfig
  - **Code shape:** `src/app/main.ts` `main`, `src/app/effects.ts` `runEffect`
  - **Must not own:** product rules, rendering, Markdown semantics.

- **Core — state and commands**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R1
  - **Location:** `src/core/state/`, `src/core/commands/`
  - **Responsibilities:** `AppState`, pure `update(state, action) → { state, effects }`; command registry, keymap trie, which-key data, palette data, jump list, autosave policy.
  - **Collaborators:** ui/workspace/preview → `dispatch(action)` → `update` → effects → app effect runner
  - **Contracts:** Action and Effect protocol; Command and Keymap registry; AppState
  - **Code shape:** `src/core/state/update.ts` `update`; `src/core/commands/registry.ts` `CommandRegistry`, `Keymap`
  - **Must not own:** timers, I/O, terminal escape codes.

- **Core — editor and vim**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Location:** `src/core/editor/`, `src/core/vim/`
  - **Responsibilities:** text buffer, cursor and selections, undo blocks, registers; vim mode machine, key-sequence parser, motions, operators, text objects, dot-repeat, search, ex commands, window tree.
  - **Collaborators:** `update` → `vim.handleKey(bufferState, key)` → `TextBuffer`
  - **Contracts:** TextBuffer; VimState
  - **Code shape:** `src/core/editor/text-buffer.ts` `TextBuffer`; `src/core/vim/engine.ts` `handleKey`
  - **Must not own:** rendering, clipboard I/O (expressed as effects).

- **Core — Markdown and layout**
  - **Decisions:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2
  - **Location:** `src/core/markdown/`, `src/core/layout/`, `src/core/render-html/`
  - **Responsibilities:** block splitting, per-block parse cache, Obsidian syntax extensions, `Doc` model; live-preview layout of visible rows into `RenderLine[]`; pure HTML rendering for the preview.
  - **Collaborators:** `update`/UI → `parseDoc(text, prev)` → `layoutViewport(doc, view)` → UI paint; preview → `renderHtml(doc, ctx)`
  - **Contracts:** Doc model; RenderLine model
  - **Code shape:** `src/core/markdown/doc.ts` `parseDoc`; `src/core/layout/layout.ts` `layoutViewport`; `src/core/render-html/render.ts` `renderHtml`
  - **Must not own:** terminal escape output, image decoding, HTTP.

- **Core — index and links**
  - **Decisions:** RM261003ABZP-DES7@R2
  - **Location:** `src/core/index/`
  - **Responsibilities:** `NoteSummary` extraction, `NoteIndex` (names, aliases, headings, blocks, links, tags, backlinks), link resolution rule, rename planning, fuzzy matching, full-text search functions.
  - **Collaborators:** index worker → `summarize(path, text)` → `NoteIndex.apply(delta)`; `update` → `resolveLink`, `planRename`
  - **Contracts:** NoteSummary and NoteIndex; LinkTarget
  - **Code shape:** `src/core/index/note-index.ts` `NoteIndex`; `src/core/index/resolve.ts` `resolveLink`; `src/core/index/rename.ts` `planRename`
  - **Must not own:** file scanning (worker), persistence.

- **Core — Bases and notes**
  - **Decisions:** RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R1
  - **Location:** `src/core/bases/`, `src/core/notes/`, `src/core/time/`
  - **Responsibilities:** `.base` parsing, expression evaluation, table and Kanban view models, YAML-preserving frontmatter patches; daily-note paths, template expansion, Moment-subset date formatting.
  - **Collaborators:** `update` → `evaluateBase(base, index)` → `BaseViewModel`; `update` → `expandTemplate(tpl, vars)`
  - **Contracts:** BaseViewModel; Template variables
  - **Code shape:** `src/core/bases/evaluate.ts` `evaluateBase`; `src/core/time/format.ts` `formatDate`
  - **Must not own:** file writes (expressed as `write` effects).

- **Workspace adapters**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES14@R1
  - **Location:** `src/workspace/`
  - **Responsibilities:** atomic save, read, create, rename, move, delete-to-trash; directory watcher with own-write suppression; index worker (scan, summarize, search); config and state files; clipboard; opening URLs/browser.
  - **Collaborators:** app effect runner → `workspace/*` → `dispatch(resultAction)`
  - **Contracts:** Effect protocol; FileEvent; WorkerMessage
  - **Code shape:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`; `src/workspace/index-worker.ts`
  - **Must not own:** decisions about conflicts, autosave timing, or link rewriting (core decides).

- **UI shell**
  - **Decisions:** RM261003ABZP-DES10@R1, RM261003ABZP-DES9@R2
  - **Location:** `src/ui/`
  - **Responsibilities:** OpenTUI renderer lifecycle; key/mouse normalization (kitty keyboard protocol, Esc timeout); layout of explorer, bufferline, editor windows, side panel, statusline, command line, overlays (picker, which-key, palette, prompts, help, notifications), Bases views; painting `RenderLine[]`; inline images; theme and `NO_COLOR`; terminal restore.
  - **Collaborators:** OpenTUI → `ui/input` → `dispatch`; store subscription → `ui/shell.render(state)`
  - **Contracts:** Key; RenderLine; AppState (read-only)
  - **Code shape:** `src/ui/shell.ts` `createShell`; `src/ui/editor-view.ts` `EditorView`; `src/ui/input.ts` `normalizeKey`
  - **Must not own:** editing logic, Markdown parsing, file I/O.

- **Preview server**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Location:** `src/preview/`
  - **Responsibilities:** `Bun.serve` on `127.0.0.1:0`, Host allowlist, SSE updates, read-only page, contained asset serving.
  - **Collaborators:** app → `startPreview(store)` → browser; store subscription → SSE push
  - **Contracts:** Preview HTTP routes
  - **Code shape:** `src/preview/server.ts` `startPreview`
  - **Must not own:** editing; files outside the workspace.

## Project Structure

- **Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json                 Purpose: one package; scripts dev/check/test/bench/build; exact pins
│       Symbols: scripts.check, packageManager, "@opentui/core": "<exact>"   Decisions: DES15
├── [A] tsconfig.json                Purpose: strict ESM, noEmit, TS 7          Decisions: DES15
├── [A] biome.json                   Purpose: format + lint                      Decisions: DES15
├── [A] knip.json                    Purpose: dead-code check                    Decisions: DES15
├── [A] release-please-config.json   Purpose: Conventional Commits → SemVer; initial-version 0.1.0  Decisions: DES15
├── [A] .release-please-manifest.json Purpose: release-please version manifest ({".": "0.0.0"})  Decisions: DES15
├── [A] .github/workflows/ci.yml     Purpose: check ∥ test+bench jobs            Decisions: DES15, DES16
├── [A] .github/workflows/release.yml Purpose: release-please + compile ×4 + smoke  Decisions: DES15
├── [A] bin/so                        Purpose: `#!/usr/bin/env bun` entry for source runs  Decisions: DES1
├── [A] src/app/
│   ├── main.ts                      Purpose: CLI, wiring, lifecycle            Symbols: main, parseArgs   Decisions: DES1, DES2
│   └── effects.ts                   Purpose: effect runner                     Symbols: runEffect         Decisions: DES2
├── [A] src/core/
│   ├── state/                       Purpose: AppState, Action, Effect, update  Symbols: update, AppState  Decisions: DES2
│   ├── commands/                    Purpose: registry, keymap trie, which-key  Symbols: CommandRegistry, Keymap  Decisions: DES5
│   ├── editor/                      Purpose: TextBuffer, undo, registers, windows  Symbols: TextBuffer, UndoStack, Registers  Decisions: DES3
│   ├── vim/                         Purpose: modes, parser, motions, operators, text objects, ex  Symbols: handleKey, motions, textObjects  Decisions: DES4
│   ├── markdown/                    Purpose: block split, parse cache, Obsidian extensions  Symbols: parseDoc, Doc, Block  Decisions: DES6
│   ├── layout/                      Purpose: live-preview layout of visible rows  Symbols: layoutViewport, RenderLine  Decisions: DES9
│   ├── render-html/                 Purpose: Doc → HTML for preview             Symbols: renderHtml        Decisions: DES13
│   ├── index/                       Purpose: summaries, index, resolve, rename, search  Symbols: NoteIndex, resolveLink, planRename  Decisions: DES7
│   ├── bases/                       Purpose: ported Bases engine + view models   Symbols: parseBase, evaluateBase, KANBAN_TYPE  Decisions: DES12
│   ├── notes/                       Purpose: daily notes, templates             Symbols: dailyPath, expandTemplate  Decisions: DES11
│   ├── time/                        Purpose: Moment-subset formatter            Symbols: formatDate        Decisions: DES11
│   └── config/                      Purpose: config schema and defaults         Symbols: ConfigSchema, defaults  Decisions: DES14
├── [A] src/workspace/
│   ├── fs.ts                        Purpose: read, atomicWrite, create, rename, move  Symbols: atomicWrite  Decisions: DES8
│   ├── trash.ts                     Purpose: freedesktop trash, macOS Finder trash  Symbols: moveToTrash  Decisions: DES8
│   ├── watcher.ts                   Purpose: directory watching, own-write suppression  Symbols: watchWorkspace  Decisions: DES8
│   ├── index-worker.ts              Purpose: scan, summarize, search in a Worker  Symbols: onmessage  Decisions: DES7
│   ├── config-file.ts               Purpose: XDG config load + validation       Symbols: loadConfig        Decisions: DES14
│   ├── state-file.ts                Purpose: XDG state load/save                Symbols: loadState, saveState  Decisions: DES14
│   └── system.ts                    Purpose: clipboard, open browser           Symbols: clipboard, openUrl  Decisions: DES8
├── [A] src/ui/
│   ├── shell.ts                     Purpose: renderer lifecycle, layout, restore  Symbols: createShell  Decisions: DES10
│   ├── input.ts                     Purpose: key/mouse normalization, Esc timeout  Symbols: normalizeKey  Decisions: DES10
│   ├── editor-view.ts               Purpose: paints RenderLine rows, cursor, images  Symbols: EditorView  Decisions: DES9, DES10
│   ├── views/                       Purpose: explorer, bufferline, statusline, cmdline, side panel, base views  Decisions: DES10, DES12
│   ├── overlays/                    Purpose: picker, which-key, palette, prompt, help, notify  Decisions: DES10, DES5
│   └── theme.ts                     Purpose: tokens, NO_COLOR                   Symbols: theme     Decisions: DES10
├── [A] src/preview/
│   ├── server.ts                    Purpose: Bun.serve, Host check, SSE, assets  Symbols: startPreview  Decisions: DES13
│   └── page.html                    Purpose: read-only page shell (embedded)   Decisions: DES13
└── [A] test/
    ├── boundaries.test.ts           Purpose: import-boundary enforcement        Decisions: DES1
    ├── e2e/                         Purpose: few PTY tests (start, edit, save, exit, restore)  Decisions: DES15
    ├── bench/                       Purpose: performance benchmarks via test renderer  Decisions: DES16
    └── fixtures/                    Purpose: sample workspace, 5,000-line note, 10,000-note generator  Decisions: DES16
```

Unit tests sit next to code as `*.test.ts`.

## Runtime Flows

- **Keystroke to frame**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES4@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES16@R1
  - **Participants:** OpenTUI key event → `ui/input.normalizeKey` → `store.dispatch({type:"key"})` → `core/state/update` → `vim.handleKey` → `TextBuffer.apply` → `markdown.reparseBlock` → store notifies → `ui/shell.render` → `layoutViewport` (visible rows only) → `EditorView` paint → OpenTUI native diff
  - **Flow:**

    ```text
    key ─→ normalizeKey ─→ dispatch(key) ─→ update(state,key)
                                              ├─ keymap trie: pending prefix? → state.pending, effect: startWhichKeyTimer
                                              ├─ command → run(ctx) → new state + effects (e.g. scheduleAutosave)
                                              └─ text edit → TextBuffer' + undo block + dirty block ids
          ui.render(state) ← store.notify ←───┘
            └─ reparse dirty blocks (cache by block hash) → layoutViewport(rows in view) → paint → native diff → terminal
    ```

    State changes only inside `update`. Rendering is coalesced to at most one frame per input burst.

  - **Failure and recovery:** a command throws → `update` catches, keeps the previous state, emits `notify(error)`; a render error in one block → that block renders as source with a diagnostic marker; nothing crashes the process.
  - **Contracts and state:** Action and Effect protocol; AppState; RenderLine model
  - **Control flow:** `src/core/state/update.ts` `update`; `src/ui/shell.ts` `createShell`

- **Startup**
  - **Decisions:** RM261003ABZP-DES1@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES16@R1
  - **Participants:** `app/main` → `loadConfig`, `loadState` → `createStore` → `createShell` (first frame) → `startIndexWorker` → `watchWorkspace`
  - **Flow:**

    ```text
    so [path] → resolve workspace (folder | file's parent) ── missing → stderr + exit 2
             → load config (invalid → defaults + error notice) → load state (corrupt → empty)
             → first frame (explorer from a shallow readdir; opened file read directly)   ← < 200 ms target
             → worker: scan + summarize all notes → post batches → dispatch(indexBatch) → status "indexing 4,210/10,000"
             → watcher starts → index ready
    ```

  - **Failure and recovery:** worker crash → notify and restart once; link features show "index unavailable" until restart succeeds; editing keeps working.
  - **Contracts and state:** AppConfig; WorkerMessage; NoteIndex
  - **Control flow:** `src/app/main.ts` `main`

- **Save and external change**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R2
  - **Participants:** `update` (autosave policy) → effect `write` → `workspace/fs.atomicWrite` → `watcher` → `dispatch(fileChanged)` → `update` (conflict rules)
  - **Flow:**

    ```text
    edit → state.dirty=true → effect scheduleAutosave(1000ms) | leaveInsert | switchNote | exit | :w
         → effect write(path, text, expectedStamp) → atomicWrite: realpath → tmp in same dir → write → fsync → chmod → rename
         → record ownWrite(path, stamp) → dispatch(saved(stamp))
    watcher(dir) event → stat+hash → ownWrite? ignore
                                   → buffer clean → dispatch(reload(text)) → undoable reload
                                   → buffer dirty → dispatch(conflict) → prompt: keep mine | take disk | view diff
    ```

  - **Failure and recovery:** write fails (permission, disk full) → buffer stays dirty, status shows `save failed: <reason>`, autosave retries with backoff (1 s, 2 s, 4 s, max 30 s); `:w` retries immediately. Rename failure leaves the temp file removed and the original intact.
  - **Contracts and state:** FileEvent; BufferState.stamp
  - **Control flow:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`

- **Follow, complete, and rename links**
  - **Decisions:** RM261003ABZP-DES7@R2
  - **Participants:** `update` → `resolveLink(index, sourcePath, target)` → open buffer + jump; `planRename(index, from, to)` → `write` effects
  - **Flow:**

    ```text
    gd on [[plan#Goals]] → resolveLink → {path:"projects/plan.md", heading:"Goals"} → push jumplist → open → cursor at heading
                         → unresolved → prompt "Create projects/plan.md?" → create effect
    rename a.md → b.md → planRename → [{path, edits[]}…] → apply to open buffers in memory + write effects for closed files
                       → fs rename → notify "12 files updated"
    ```

  - **Failure and recovery:** a link-rewrite write fails → remaining writes continue; failures are listed in a notification with paths; the rename itself is rolled back only if the file rename failed (links already rewritten are reported, not reverted).
  - **Contracts and state:** NoteIndex; LinkTarget
  - **Control flow:** `src/core/index/resolve.ts` `resolveLink`; `src/core/index/rename.ts` `planRename`

- **Preview**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Participants:** `:Preview` → effect `startPreview` → `preview/server` → browser; store change (active doc or version) → SSE event → page fetches `/render`
  - **Flow:**

    ```text
    :Preview → Bun.serve({hostname:"127.0.0.1", port:0}) → open http://127.0.0.1:<port>/
    page → GET /events (SSE) ; edit → debounce 100 ms → event "doc" {path, version, anchor} ; :PreviewStop/exit → event "stopped" → close
    page → GET /render?path=… → renderHtml(doc) → swap <main>, scroll to anchor
    any request with bad Host → 403 ; /file/<p> → realpath ⊂ workspace & not hidden? → bytes : 404
    ```

  - **Failure and recovery:** port bind fails → notify; browser cannot open → notify the URL; SSE drop → browser auto-reconnects and refetches.
  - **Contracts and state:** Preview HTTP routes
  - **Control flow:** `src/preview/server.ts` `startPreview`

## Contracts, Data, and State

- **Action and Effect protocol — State model**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Purpose:** the only way state changes and the only way side effects start.
  - **Participants:** ui, workspace, preview, timers → `Action` → `update` → `Effect[]` → app effect runner → result `Action`
  - **Meaning:** `Action` is a discriminated union (`key`, `mouse`, `resize`, `fileLoaded`, `saved`, `saveFailed`, `fileChanged`, `indexBatch`, `searchResults`, `timer`, …). `Effect` is a discriminated union (`read`, `write`, `create`, `rename`, `move`, `trash`, `startTimer`, `cancelTimer`, `clipboardWrite`, `clipboardRead`, `search`, `startPreview`, `stopPreview`, `openUrl`, `saveState`, `exit`).
  - **Ownership and lifecycle:** core defines both unions; app runs effects; every effect that can fail returns a success or failure action.
  - **Invariants:** `update` is pure and synchronous; no effect runs inside `update`; effects carry all data they need (no callbacks).
  - **State flow:**

    ```text
    Action → update → (State', Effect[]) → runEffect → Action …
    ```

  - **Shape:** `src/core/state/types.ts`

- **AppState — State model**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES10@R1
  - **Purpose:** single source of truth for everything visible.
  - **Participants:** `update` (owner) → ui/preview (readers)
  - **Meaning:** `workspace` (root, tree), `buffers` (by id: path, TextBuffer, doc, stamp, dirty, mode view live|source|reading), `windows` (split tree, active, per-window cursor, scroll, and `folds`: the set of folded callout and expanded embed block ids), `vim` (mode, pending keys, registers, last change, search), `panels` (explorer, side panel kind), `overlay` (none | picker | whichKey | palette | prompt | help | conflict | calendar | completion), `index` (NoteIndex + status), `notifications`, `config`, `jumps`, `preview` (off | on(port)).
  - **Ownership and lifecycle:** created at startup from config + state file; `jumps` and recent notes persisted through `saveState` effects (debounced 2 s and on exit).
  - **Invariants:** one active window; each window references an open buffer; a buffer with `dirty=false` matches its last saved stamp.
  - **State flow:** `None — plain value replaced by update`
  - **Shape:** `src/core/state/types.ts` `AppState`

- **TextBuffer — Data model**
  - **Decisions:** RM261003ABZP-DES3@R1
  - **Purpose:** text storage and edit primitives behind a stable interface.
  - **Participants:** vim engine, rename planner, template insertion → `TextBuffer` → markdown parser
  - **Meaning:** lines array, version number, `apply(edit)` returning a new buffer and the inverse edit; positions are `{line, col}` in UTF-16 code units aligned to grapheme boundaries.
  - **Ownership and lifecycle:** owned by a buffer entry; replaced on each edit (structural sharing of untouched lines).
  - **Invariants:** at least one line; line separators normalized to `\n` in memory, original separator (`\n`/`\r\n`) and trailing newline restored on save.
  - **State flow:** `None`
  - **Shape:** `src/core/editor/text-buffer.ts`

- **Doc model — Data model**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Purpose:** parsed Markdown shared by live preview, index summaries, and HTML preview.
  - **Participants:** `parseDoc` → `Doc` → layout, `summarize`, `renderHtml`
  - **Meaning:** `Doc { frontmatter?, blocks: Block[] }`; `Block { id, kind, startLine, endLine, hash, node }` where `node` is mdast extended with Obsidian nodes (`wikiLink`, `embed`, `tag`, `highlight`, `comment`, `callout`, `blockId`, `footnote*`, `math`).
  - **Ownership and lifecycle:** recomputed per buffer version; unchanged blocks reused by hash.
  - **Invariants:** blocks cover the document without overlap; a fenced code block or frontmatter is never split.
  - **State flow:** `None`
  - **Shape:** `src/core/markdown/doc.ts`

- **RenderLine model — Data model**
  - **Decisions:** RM261003ABZP-DES9@R2
  - **Purpose:** UI-independent description of one screen row.
  - **Participants:** `layoutViewport` → `RenderLine[]` → `EditorView`
  - **Meaning:** `RenderLine { sourceLine, spans: {text, style: StyleToken, link?}[], widget?: {kind:"image"|"embed"|"base"|"rule", ref, rows} , reveal: boolean }`; `StyleToken` names a theme token (`heading1`, `bold`, `link`, `tag`, `codeKeyword`, …), never a colour.
  - **Ownership and lifecycle:** computed per frame for visible rows only.
  - **Invariants:** cursor column maps back to a source column through `spans` offsets; widget rows are counted in scroll math.
  - **State flow:** `None`
  - **Shape:** `src/core/layout/types.ts`

- **NoteSummary and NoteIndex — Data model**
  - **Decisions:** RM261003ABZP-DES7@R2
  - **Purpose:** workspace-wide link, tag, heading, and block knowledge.
  - **Participants:** worker `summarize` → `NoteSummary` → main `NoteIndex.apply`
  - **Meaning:** `NoteSummary { path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind:"wiki"|"md"|"embed"}], frontmatter }`. `NoteIndex` holds summaries by path plus derived maps: basename → paths, alias → paths, tag → paths, target path → backlinks.
  - **Ownership and lifecycle:** built at startup by the worker; updated per file event and per buffer save; never persisted.
  - **Invariants:** derived maps are rebuilt only for changed paths; resolution order is fixed (RM261003ABZP-DES7@R2).
  - **State flow:** `empty → indexing(n/total) → ready → (fileEvent) ready`
  - **Shape:** `src/core/index/note-index.ts`

- **Preview HTTP routes — API**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Purpose:** read-only browser preview.
  - **Participants:** browser → `preview/server` → core `renderHtml`
  - **Meaning:** `GET /` page shell; `GET /events` SSE (`doc` events with `{path, version, anchor}`; a `stopped` event sent before `:PreviewStop` or exit closes the server); `GET /render?path=` HTML fragment; `GET /file/<path>` workspace asset bytes.
  - **Ownership and lifecycle:** exists only between `:Preview` and `:PreviewStop` or exit.
  - **Invariants:** hostname `127.0.0.1`; Host header ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403; realpath containment else 404; no mutating routes.
  - **State flow:** `off → on(port) → off`
  - **Shape:** `src/preview/server.ts`

- **AppConfig — Data model**
  - **Decisions:** RM261003ABZP-DES14@R1
  - **Purpose:** user options and keymap overrides.
  - **Participants:** `config-file.loadConfig` → `ConfigSchema` (zod) → `AppState.config`
  - **Meaning:** `leader`, `escTimeoutMs` (50), `autosave` (`{ enabled: true, delayMs: 1000 }`), `editor` (`tabWidth`, `wrap`, `relativeNumbers`), `preview` (`mode: "live"`, `embedMaxRows`, `images: "auto"|"blocks"|"off"`), `daily` (`folder`, `format`, `template`), `templates.folder`, `theme`, `color` (overrides `NO_COLOR`), `keys.<mode>` (`"<key-seq>" = "<command-id>"`).
  - **Ownership and lifecycle:** read at startup and on `:ConfigReload`.
  - **Invariants:** unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
  - **State flow:** `None`
  - **Shape:** `src/core/config/schema.ts`

## Detailed Code Design

- **`src/core/state/update.ts`**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Change:** Add
  - **Responsibilities:** reducer entry; routes actions to feature reducers.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };

    export const update: Update = (state, action) => {
      switch (action.type) {
        case "key":        return handleKeyAction(state, action.key);   // keymap → command or vim edit
        case "fileChanged":return handleFileChanged(state, action);     // reload | conflict | ignore
        case "indexBatch": return { state: withIndex(state, action.summaries), effects: [] };
        // … one case per Action variant; feature logic lives in feature modules
      }
    };

    export function createStore(initial: AppState, run: (e: Effect) => void) {
      let state = initial; const subs = new Set<(s: AppState) => void>();
      return {
        get: () => state,
        dispatch(action: Action) { const r = update(state, action); state = r.state; r.effects.forEach(run); subs.forEach((f) => f(state)); },
        subscribe(f: (s: AppState) => void) { subs.add(f); return () => subs.delete(f); },
      };
    }
    ```

    `update` routes; `createStore` is the only mutable cell. The switch dispatches on a closed Action union (core protocol, not an extension point); commands extend through the registry instead.

  - **Dependencies:** Action and Effect protocol; CommandRegistry
  - **Callers and wiring:** `app/main.ts` creates the store with `runEffect`; ui and preview subscribe.
  - **Invariants:** pure; no `Date.now()` — time arrives in actions.
  - **Verification:** RM261003ABZP-S11@R1, RM261003ABZP-V15@R1

- **`src/core/commands/registry.ts`**
  - **Decisions:** RM261003ABZP-DES5@R1
  - **Change:** Add
  - **Responsibilities:** named commands, keymap trie, which-key and palette data, config overrides.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Command = {
      id: string;                       // "file.find", "note.today", "link.follow"
      title: string;                    // shown in palette and which-key
      group?: string;                   // which-key group: "find", "note", "buffer"
      run: (ctx: CommandContext, args?: string) => { state: AppState; effects: Effect[] };
    };
    export type Mode = "normal" | "insert" | "visual" | "cmdline" | "explorer" | "picker" | "base";

    export class CommandRegistry { register(cmd: Command): void; get(id: string): Command | undefined; list(): Command[] }

    export class Keymap {
      bind(mode: Mode, seq: string, commandId: string): void;      // "<leader>ff", "gd", "<C-o>"
      lookup(mode: Mode, pending: Key[]): { kind: "command"; id: string } | { kind: "prefix"; next: WhichKeyItem[] } | { kind: "none" };
    }
    ```

    Features call `registry.register` and `keymap.bind` at startup from their own module (`src/core/notes/commands.ts`, …). Which-key reads `lookup(...).next`; the palette reads `list()`. Config `keys.<mode>` rebinds by command id.

  - **Dependencies:** AppState
  - **Callers and wiring:** `core/commands/defaults.ts` registers built-ins; `app/main.ts` applies config overrides.
  - **Invariants:** duplicate ids throw at startup; binding an unknown id is a config error, not a crash.
  - **Verification:** RM261003ABZP-S3@R1, RM261003ABZP-V4@R1; RM261003ABZP-S11@R1, RM261003ABZP-V16@R1

- **`src/core/editor/text-buffer.ts` and `src/core/vim/engine.ts`**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Change:** Add (vim engine redesigned from `alfred/apps/tui/src/view/editor/vim.ts`)
  - **Responsibilities:** buffer primitives; vim grammar `[count]["x][count]operator[count](motion|textobject)`.
  - **Current source:** `alfred/apps/tui/src/view/editor/vim.ts:15-40` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    export type VimMode = "normal" | "insert";
    export type VimEffect = "changed" | "insert-exited" | "toggle-mode" | "leave";
    export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
    ```

    Alfred's engine is pure with effects but supports two modes and a hard-coded pending set.

  - **Proposed shape:**

    ```ts
    export interface TextBuffer {
      readonly version: number; readonly lineCount: number;
      line(i: number): string;
      apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };     // Edit = { range, text }
      slice(range: Range): string;
    }

    export type Motion = (buf: TextBuffer, at: Pos, count: number, ctx: MotionCtx) => { to: Pos; linewise: boolean; inclusive: boolean } | null;
    export type TextObject = (buf: TextBuffer, at: Pos, count: number) => Range | null;
    export const motions: Record<string, Motion>;       // "w","b","e","gg","G","f",… registered by key
    export const textObjects: Record<string, TextObject>; // "iw","a(","ip",…

    export function handleKey(s: BufferVim, key: Key, env: VimEnv): { s: BufferVim; effects: VimEffect[] };
    // VimEffect: { kind:"yank", register, text } | { kind:"changed" } | { kind:"modeChanged", mode } | { kind:"ex", line } | { kind:"search", pattern, dir }
    ```

    The parser accumulates keys into a pending command; when complete it resolves the motion or text object by table lookup, applies the operator, and records an undo block and last-change for `.`. Insert mode collects edits into one undo block until `Esc`.

  - **Dependencies:** TextBuffer; registers in AppState
  - **Callers and wiring:** `update` → `handleKeyAction` → `handleKey` when no keymap binding matches in normal/visual/insert mode.
  - **Invariants:** an operator with a failed motion is a no-op; counts multiply (`2d3w` = `d6w`); undo restores cursor.
  - **Verification:** RM261003ABZP-S2@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1

- **`src/core/markdown/doc.ts`**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Change:** Add (ported from `alfred/apps/tui/src/view/markdown/parse.ts` and `alfred/packages/view-model/src/markdown/obsidian-syntax.ts`)
  - **Responsibilities:** split into blocks, parse each block with micromark + GFM + math + Obsidian extensions, reuse unchanged blocks.
  - **Current source:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` (imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math`)
  - **Current shape:**

    ```ts
    // Alfred parses the whole document per render and post-processes Obsidian syntax with regexes from obsidian-syntax.ts
    export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    ```

    Whole-document parse; Obsidian syntax by regex over text nodes.

  - **Proposed shape:**

    ```ts
    export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; node: MdNode };
    export type Doc = { version: number; frontmatter?: Frontmatter; blocks: Block[] };

    export function splitBlocks(buf: TextBuffer): { startLine: number; endLine: number }[]; // blank-line bounded; fences, frontmatter, $$ kept whole; lists kept whole
    export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;   // reparse only ranges whose hash changed
    export const syntaxExtensions: SyntaxExtension[];             // wikiLink, embed, tag, highlight, comment, callout, blockId — registration point
    ```

    Block-level reparse keeps per-keystroke work proportional to the edited block (`RM261003ABZP-RF7`). Obsidian syntax is applied as mdast transforms registered in `syntaxExtensions`.

  - **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`
  - **Callers and wiring:** `update` after edits; worker `summarize`; preview `renderHtml`.
  - **Invariants:** `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally (cache is transparent).
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R1; RM261003ABZP-S9@R1, RM261003ABZP-V12@R1

- **`src/core/layout/layout.ts`**
  - **Decisions:** RM261003ABZP-DES9@R2
  - **Change:** Add (adapted from `alfred/apps/tui/src/view/markdown/layout.ts` and `alfred/apps/tui/src/view/editor/reveal-units.ts`)
  - **Responsibilities:** visible-row layout with reveal rules and block renderers.
  - **Current source:** `alfred/apps/tui/src/view/editor/reveal-units.ts` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    None — Alfred lays out whole documents for Ink rendering
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    export type LayoutView = { doc: Doc; buf: TextBuffer; width: number; topRow: number; rows: number; cursor: Pos; selection?: Range; mode: "live" | "source" | "reading"; folds: ReadonlySet<number> };
    export function layoutViewport(v: LayoutView, ctx: LayoutCtx): RenderLine[];
    export type BlockRenderer = (block: Block, v: LayoutView, ctx: LayoutCtx) => RenderLine[];
    export const blockRenderers: Partial<Record<BlockKind, BlockRenderer>>;   // heading, list, table, callout, code, embed, base, math, mermaid …
    ```

    Reveal: the cursor's line shows raw inline syntax; if the cursor is inside a multi-line block (table, callout, code, math, frontmatter) the whole block renders as source. Rows outside the viewport are never laid out; a per-block row-height cache gives scroll positions.

  - **Dependencies:** Doc model; theme tokens; `lowlight` for code tokens; ported math and mermaid text renderers
  - **Callers and wiring:** `ui/editor-view.ts` per frame.
  - **Invariants:** `mode: "source"` returns raw lines with syntax tokens only; reading mode never reveals.
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R1, RM261003ABZP-V8@R1

- **`src/core/index/resolve.ts` and `src/core/index/rename.ts`**
  - **Decisions:** RM261003ABZP-DES7@R2
  - **Change:** Add
  - **Responsibilities:** deterministic link resolution; format-preserving rename planning.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function resolveLink(ix: NoteIndex, from: string, raw: string): LinkTarget | { unresolved: string };
    // order: exact root path (with/without .md) → alias → basename candidates ranked by
    //        (same folder as `from`) → (shortest path) → (alphabetical)
    export function planRename(ix: NoteIndex, from: string, to: string, read: (p: string) => string): FileEdit[];
    // keeps link kind (wiki/md), alias, #heading / #^block; writes the shortest unique form of `to`
    ```

  - **Dependencies:** NoteIndex
  - **Callers and wiring:** `link.follow`, completion, backlinks, `file.rename`, `file.move` commands.
  - **Invariants:** resolution is a pure function of index contents; rename never touches text outside link spans.
  - **Verification:** RM261003ABZP-S4@R1, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2

- **`src/workspace/fs.ts` and `src/workspace/watcher.ts`**
  - **Decisions:** RM261003ABZP-DES8@R1
  - **Change:** Add
  - **Responsibilities:** atomic writes and directory watching with own-write suppression.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export async function atomicWrite(path: string, text: string): Promise<Stamp> {
      const target = await realpathOrSelf(path);
      const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
      const fd = await open(tmp, "w", await modeOr(target, 0o644));
      try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp, target);                     // same directory → atomic on POSIX
      return stampOf(target, text);                  // { mtimeMs, size, hash }
    }
    export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
    // fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
    ```

  - **Dependencies:** `node:fs/promises`, `node:fs` (Bun-compatible)
  - **Callers and wiring:** effect runner for `write`, `create`, `rename`, `move`; `main` starts the watcher.
  - **Invariants:** temp files never appear in the index (prefix `.` is hidden); a failed write deletes its temp file.
  - **Verification:** RM261003ABZP-S1@R1, RM261003ABZP-V1@R1

- **`src/ui/editor-view.ts` and `src/ui/input.ts`**
  - **Decisions:** RM261003ABZP-DES10@R1, RM261003ABZP-DES9@R2
  - **Change:** Add
  - **Responsibilities:** paint RenderLine rows onto an OpenTUI buffer; place images; normalize input.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    // Only file family allowed to import @opentui/*
    export class EditorView extends Renderable {           // custom renderable, not Textarea
      constructor(ctx: RenderContext, private getView: () => LayoutView) { super(ctx, { flexGrow: 1 }); }
      protected renderSelf(buf: OptimizedBuffer) {
        for (const [row, line] of layoutViewport(this.getView(), layoutCtx).entries()) paintLine(buf, row, line, theme);
      }
    }
    export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via escTimeoutMs
    ```

    Exact OpenTUI buffer and image APIs are confirmed against the pinned version in the first delivery item (the class above is illustrative).

  - **Dependencies:** `@opentui/core` (exact pin)
  - **Callers and wiring:** `ui/shell.ts` composes views; store subscription triggers `requestRender()`.
  - **Invariants:** UI never mutates AppState; all input becomes Actions.
  - **Verification:** RM261003ABZP-S9@R1, RM261003ABZP-V12@R1; RM261003ABZP-S11@R1, RM261003ABZP-V17@R1

- **`src/preview/server.ts`**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Change:** Add
  - **Responsibilities:** read-only preview server.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function startPreview(store: Store, root: string): { port: number; stop(): void } {
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0,
        fetch(req) {
          const host = req.headers.get("host");
          if (host !== `127.0.0.1:${server.port}` && host !== `localhost:${server.port}`) return new Response(null, { status: 403 });
          return route(req, store, root);              // "/", "/events", "/render", "/file/*"
        },
      });
      return { port: server.port, stop: () => server.stop(true) };
    }
    ```

  - **Dependencies:** `Bun.serve`; core `renderHtml`
  - **Callers and wiring:** effect runner for `startPreview`/`stopPreview`.
  - **Invariants:** no write routes; `/file/*` passes realpath containment and hidden-folder exclusion.
  - **Verification:** RM261003ABZP-S8@R1, RM261003ABZP-V11@R2

## Cross-cutting and Evolution

| Concern | Mechanism and canonical design location | Verification or reason not applicable |
|---|---|---|
| Security and privacy | No network except loopback preview with Host allowlist and realpath containment (RM261003ABZP-DES13@R2); config is data (TOML), never executed (RM261003ABZP-DES14@R1); no telemetry; notes never logged | RM261003ABZP-V11@R2 |
| Configuration and observability | XDG TOML config validated by schema; errors as notifications; `so --version`; `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content (RM261003ABZP-DES14@R1) | RM261003ABZP-V4@R1 |
| Performance and scalability | Viewport-only layout, block parse cache, worker index and search, frame coalescing, lazy image decode with cache (RM261003ABZP-DES16@R1) | RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 |
| Concurrency, retry, and idempotency | Single-threaded store; worker communicates by messages; saves serialized per path; autosave retry with backoff; own-write stamps make watcher events idempotent (RM261003ABZP-DES8@R1) | RM261003ABZP-V1@R1 |
| Migration and backfill | None — greenfield; Obsidian files are read as-is and written in place | None — no prior data format |
| Mixed-version compatibility | Obsidian file compatibility (Markdown, links, frontmatter, `.base`); Kanban `type` constant isolated in `core/bases/types.ts` and verified against an Obsidian-saved file (RM261003ABZP-DES12@R1) | RM261003ABZP-V10@R1 |
| Rollout and rollback | SemVer releases via release-please; users roll back by installing a previous release binary (RM261003ABZP-DES15@R1) | RM261003ABZP-V14@R1 |
| Known extension needs | Registries: commands and keymaps (DES5), syntax extensions (DES6), block renderers (DES9), Bases view types (DES12) — RM261003ABZP-REQ11@R2 | RM261003ABZP-V16@R1 |

- **System transition:**

```text
empty repo → scaffold (tooling, CI, boundary test, shell) → editor usable → knowledge features → release binaries
                                  └→ rollback: previous release binary; files are plain Markdown, no state migration
```

- **Delivery constraints:** the boundary test and CI exist before feature code so violations never land; the OpenTUI paint and image APIs are confirmed against the pinned version before live-preview work depends on them; the Kanban `type` value is confirmed before Kanban ships.

## Success and Verification

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** This document
  - **Outcome:** across crash, external edit, and save failure scenarios, the file on disk is always a complete old or new version and dirty buffers are never overwritten without a prompt.
  - **Requirements:** RM261003ABZP-REQ1@R2
  - **Design:** RM261003ABZP-DES8@R1 - atomic write, own-write suppression, conflict rules
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S1@R1
      - **Scenario:** in a temp workspace: (a) kill the writer between write and rename (simulated by throwing after fsync); (b) modify an open clean file externally; (c) modify an open dirty file externally; (d) save `so`'s own buffer.
      - **Expected result:** (a) original content intact, no temp file left; (b) buffer reloads and `u` restores previous text; (c) conflict prompt appears, file and buffer unchanged until chosen; (d) no reload or conflict triggered.
      - **Method and target:** integration test on `workspace/fs.ts`, `workspace/watcher.ts`, and `core` conflict reducer
      - **Environment:** real file system (tmpdir), real `fs.watch`
      - **Unique risk:** per-file watch losing events after rename; self-triggered reload loops; partial writes.
      - **Predecessors:** None

- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** This document
  - **Outcome:** every command listed in RM261003ABZP-REQ2@R2 produces Neovim's result on the shared fixture cases.
  - **Requirements:** RM261003ABZP-REQ2@R2
  - **Design:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 - grammar, undo blocks, dot-repeat
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** table of `{ before text + cursor, keys, after text + cursor + register }` cases covering each motion, operator, text object, count, register, search, `:s`, undo/redo, and `.`; expected values recorded from Neovim 0.11 `--clean`.
      - **Expected result:** each case matches exactly.
      - **Method and target:** unit tests on `core/vim/engine.ts` `handleKey`
      - **Environment:** None — pure functions
      - **Unique risk:** subtle divergence (inclusive/exclusive motions, linewise yanks, cursor after undo).
      - **Predecessors:** None
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** feed a lone `\x1b` byte without kitty protocol, then `\x1b[A`, through `ui/input.normalizeKey` with `escTimeoutMs=50`.
      - **Expected result:** lone Esc yields `escape` after 50 ms ± 10 ms; the sequence yields `up` immediately.
      - **Method and target:** unit test on `ui/input.ts`
      - **Environment:** fake timers
      - **Unique risk:** Esc swallowed or arrow keys misread as Esc + letters.
      - **Predecessors:** None

- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** This document
  - **Outcome:** every command is reachable by name in the palette, leader sequences show which-key hints, pickers filter fuzzily, and config overrides apply or fail safely.
  - **Requirements:** RM261003ABZP-REQ3@R3
  - **Design:** RM261003ABZP-DES5@R1, RM261003ABZP-DES14@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V4@R1 — Keymap, which-key, palette, and config**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S3@R1
      - **Scenario:** (a) press `Space` and wait; (b) bind `"<leader>w" = "file.save"` in config and press it; (c) load a config with a syntax error on line 7; (d) set `XDG_CONFIG_HOME=relative/path`; (e) open the palette and type `today`.
      - **Expected result:** (a) which-key lists groups; (b) file saved; (c) notification names `config.toml:7` and defaults apply; (d) `~/.config/so/config.toml` used; (e) `note.today` ranks first.
      - **Method and target:** unit tests on `core/commands`, `workspace/config-file.ts`; component test through the OpenTUI test renderer for (a)
      - **Environment:** tmp config dirs; OpenTUI test renderer
      - **Unique risk:** config error crashing startup; overrides silently ignored.
      - **Predecessors:** None

- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** This document
  - **Outcome:** link following, completion, backlinks, and tags match the index; rename updates every reference while preserving format.
  - **Requirements:** RM261003ABZP-REQ4@R3
  - **Design:** RM261003ABZP-DES7@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** workspace with `a/plan.md`, `b/plan.md`, `plan-x.md` (alias `plan`), `c/deep/plan.md`; resolve `[[plan]]` from `a/x.md`, from `root.md`, `[[b/plan]]`, `[[plan.md]]`, `[[note#H1#H2]]`, `[text](a/plan%20x.md)`.
      - **Expected result:** results follow the documented order exactly.
      - **Method and target:** unit tests on `core/index/resolve.ts`
      - **Environment:** None — in-memory index
      - **Unique risk:** nondeterministic or Obsidian-incompatible targets.
      - **Predecessors:** None
    - **RM261003ABZP-V6@R2 — Rename and link-mention preserve link formats**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** (a) rename `plan.md` → `projects/roadmap.md` with references `[[plan]]`, `[[plan|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)`, frontmatter `related: "[[plan]]"`, and an open dirty buffer containing `[[plan]]`; (b) run `link.linkMention` on an unlinked mention "Plan" of `plan.md` in an open dirty buffer and in a closed file.
      - **Expected result:** (a) all rewritten in place with kind, alias, subpath preserved and shortest unique path; the dirty buffer is edited in memory (not overwritten on disk); notification reports the file count. (b) only the mention span becomes `[[plan|Plan]]` (or `[[plan]]` when the text equals the basename); the open buffer is edited in memory and marked dirty; the closed file is written through the atomic write path; the mention moves from unlinked to linked in the backlinks result.
      - **Method and target:** unit tests on `planRename` and the mention span edit + integration test of the rename and `link.linkMention` commands
      - **Environment:** tmp workspace
      - **Unique risk:** broken links or clobbered unsaved edits.
      - **Predecessors:** RM261003ABZP-V6@R1

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** This document
  - **Outcome:** each element listed in RM261003ABZP-REQ5@R2 renders as specified, reveal follows the cursor line or block, and images use the best available protocol.
  - **Requirements:** RM261003ABZP-REQ5@R2
  - **Design:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V7@R1 — Layout golden tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** `test/fixtures/tour.md` (every element) laid out at widths 60 and 100 with the cursor outside any block, on a bold line, inside a table, inside a callout.
      - **Expected result:** `RenderLine[]` serialized to text + style tokens matches committed goldens.
      - **Method and target:** unit tests on `layoutViewport`
      - **Environment:** None — pure
      - **Unique risk:** reveal or hiding regressions; broken table alignment.
      - **Predecessors:** None
    - **RM261003ABZP-V8@R1 — Image protocol selection**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** render a note with a PNG in the OpenTUI test renderer with capabilities kitty / sixel / none / `images="off"`.
      - **Expected result:** kitty or sixel placement, block characters, or `[image: name.png]` placeholder respectively.
      - **Method and target:** component test on `ui/editor-view.ts`
      - **Environment:** OpenTUI test renderer with mocked capabilities
      - **Unique risk:** images breaking layout or crashing on unsupported terminals.
      - **Predecessors:** None

- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** This document
  - **Outcome:** `:Today` and template insertion produce the same text Obsidian's core plugins would for the supported tokens.
  - **Requirements:** RM261003ABZP-REQ6@R2
  - **Design:** RM261003ABZP-DES11@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S6@R1
      - **Scenario:** format 2026-10-03T09:05 with every supported token and `[literal]`; expand a template containing all variables; compute daily paths for `YYYY-MM-DD` and `YYYY/MM/YYYY-MM-DD`; run `:Today` twice.
      - **Expected result:** strings equal Moment.js output for the same tokens; unsupported tokens stay literal; second `:Today` opens the existing file without changing it.
      - **Method and target:** unit tests on `core/time`, `core/notes`; integration test for `:Today`
      - **Environment:** fixed clock; tmp workspace
      - **Unique risk:** wrong dates, overwritten daily notes.
      - **Predecessors:** None

- **RM261003ABZP-S7@R1 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** This document
  - **Outcome:** table and Kanban views show the correct rows, edits write valid frontmatter, and unsupported layouts fall back safely.
  - **Requirements:** RM261003ABZP-REQ7@R2
  - **Design:** RM261003ABZP-DES12@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V10@R1 — Bases evaluation, edit, and compatibility**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S7@R1
      - **Scenario:** fixtures ported from Alfred's Bases tests plus a Kanban `.base` saved by Obsidian 1.14+; edit a cell; move a card; open a `cards` view; group by a formula.
      - **Expected result:** rows and order match fixtures; frontmatter patched with comments and order preserved; card move sets the property; `cards` opens as table with notice; moving is disabled for formula grouping.
      - **Method and target:** unit tests on `core/bases`; integration test of write-back
      - **Environment:** tmp workspace
      - **Unique risk:** YAML corruption; Kanban type mismatch with Obsidian.
      - **Predecessors:** None

- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** This document
  - **Outcome:** the browser follows edits within 300 ms and the server rejects foreign hosts and out-of-workspace paths.
  - **Requirements:** RM261003ABZP-REQ8@R2
  - **Design:** RM261003ABZP-DES13@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V11@R2 — Preview server behavior and safety**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S8@R1
      - **Scenario:** start preview; request with Host `evil.test:<port>`; request `/file/..%2f..%2fetc/passwd`; request a symlink pointing outside; request `/file/.git/config`; dispatch an edit and measure time to the SSE event; with an SSE client connected, run `:PreviewStop`.
      - **Expected result:** 403; 404; 404; 404; SSE `doc` event < 300 ms after the edit; the client receives a `stopped` event before the connection closes and the port stops accepting connections; server bound only to 127.0.0.1.
      - **Method and target:** integration test on `preview/server.ts`
      - **Environment:** real `Bun.serve`, tmp workspace with symlink
      - **Unique risk:** DNS rebinding, traversal, network exposure.
      - **Predecessors:** RM261003ABZP-V11@R1

- **RM261003ABZP-S9@R1 — Performance targets hold**
  - **Definition:** This document
  - **Outcome:** the targets in RM261003ABZP-REQ9@R2 are met on the reference machine and gated at 2× in CI.
  - **Requirements:** RM261003ABZP-REQ9@R2
  - **Design:** RM261003ABZP-DES16@R1, RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES7@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V12@R1 — Keystroke and open-note benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** open the 5,000-line fixture in live preview in the OpenTUI test renderer (120×40); send 200 mixed keystrokes (`j`, `w`, `i` + text + `Esc`, `dd`, `u`); measure input → frame complete; measure open time.
      - **Expected result:** p95 < 16 ms and open < 50 ms on the reference machine; CI median of 5 runs < 32 ms and < 100 ms.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** OpenTUI test renderer; fixed CI runner type
      - **Unique risk:** full-document parse or layout sneaking into the keystroke path.
      - **Predecessors:** None
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** generate a 10,000-note workspace; start `so`; record time to first interactive frame and to index ready; type during indexing.
      - **Expected result:** first frame < 200 ms; index ready < 3 s; keystrokes during indexing still meet the V12 budget.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** generated fixture; real worker
      - **Unique risk:** indexing blocking the main thread.
      - **Predecessors:** None

- **RM261003ABZP-S10@R1 — Development, CI, and release are fast and automatic**
  - **Definition:** This document
  - **Outcome:** `bun run check` < 30 s; CI < 3 min; release produces four checksummed binaries that start.
  - **Requirements:** RM261003ABZP-REQ10@R2
  - **Design:** RM261003ABZP-DES15@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V14@R1 — Check timing, CI timing, and release dry run**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S10@R1
      - **Scenario:** time `bun run check` locally; read CI run durations; run the release workflow on a pre-release tag.
      - **Expected result:** < 30 s; < 3 min; GitHub Release with 4 binaries + `SHA256SUMS`; smoke jobs print `so <version>` on macOS and Linux.
      - **Method and target:** non-test check on CI and release workflows
      - **Environment:** GitHub Actions
      - **Unique risk:** slow feedback loops; binaries missing OpenTUI's native library.
      - **Predecessors:** None

- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored**
  - **Definition:** This document
  - **Outcome:** boundary violations fail CI; features extend by registration; terminal state is restored on every exit path; standards are followed.
  - **Requirements:** RM261003ABZP-REQ11@R2
  - **Design:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R1, RM261003ABZP-DES10@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V15@R1 — Import boundary test**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** scan every `src/**/*.ts` with `Bun.Transpiler.scanImports`; include a deliberate violation fixture.
      - **Expected result:** core imports only core and allowed parsing packages; only `src/ui/**` imports `@opentui/*`; the fixture fails.
      - **Method and target:** `test/boundaries.test.ts`
      - **Environment:** None
      - **Unique risk:** layering eroding silently.
      - **Predecessors:** None
    - **RM261003ABZP-V16@R1 — Registration-only extension**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** a test module registers a command, a keymap, a syntax extension, and a block renderer without touching other modules.
      - **Expected result:** the command runs from the palette and keymap; the syntax renders through the renderer.
      - **Method and target:** unit test across `core/commands`, `core/markdown`, `core/layout`
      - **Environment:** None
      - **Unique risk:** hidden switch statements that require edits to extend.
      - **Predecessors:** None
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** in a PTY, start `so`, then exit by `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception; set `NO_COLOR=1` in one run.
      - **Expected result:** after each exit the PTY is back on the main screen with cursor visible, mouse and kitty keyboard modes off; the `NO_COLOR` run emits no colour SGR codes.
      - **Method and target:** e2e PTY test in `test/e2e/`
      - **Environment:** real PTY (`Bun.spawn` with a pseudo-terminal), headless terminal emulator to read state
      - **Unique risk:** leaving the user's terminal broken.
      - **Predecessors:** None

## Design Decisions and Traceability

- **RM261003ABZP-DES1@R1 — One process, one package, four layers with a tested import boundary**
  - **Requirements:** RM261003ABZP-REQ11@R2 - pure core, enforced boundaries; RM261003ABZP-REQ10@R2 - fast checks
  - **Decision:** `src/core` (pure), `src/workspace` (I/O), `src/ui` (OpenTUI), `src/preview` (HTTP), wired only in `src/app`. A `bun test` boundary test using `Bun.Transpiler.scanImports` enforces the import rules.
  - **Explanation:** System Architecture diagram; `test/boundaries.test.ts`. One package keeps install and CI fast; the test needs no TypeScript API (`RM261003ABZP-RF13`).
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred needed six packages because of its kernel; `so` has no server boundary.
  - **Research:** `RM261003ABZP-RF1` - contain OpenTUI to the UI layer; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2. `RM261003ABZP-RF13` - avoid TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Tradeoffs:** folder conventions rather than package boundaries; rejected a Turborepo monorepo (slower, more config) and dependency-cruiser (TS 7 issue).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES2@R2 — One store with a pure reducer and data-only effects**
  - **Requirements:** RM261003ABZP-REQ11@R2 - stable, testable foundations; RM261003ABZP-REQ1@R2 - autosave and conflicts; RM261003ABZP-REQ9@R2 - predictable rendering
  - **Decision:** `update(state, action) → { state, effects }`; effects are plain data executed by `app/effects.ts`; results return as actions.
  - **Explanation:** Action and Effect protocol; AppState; `src/core/state/update.ts`. Every behavior (autosave timing, conflict choice, rename) is a pure function test.
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts` - Alfred's vim core already returns effects instead of performing them.
  - **Research:** None
  - **Tradeoffs:** an extra indirection for I/O; rejected UI components holding state (hard to test, the Ink/React pattern Alfred needed a compositor around).
  - **Dependencies:** RM261003ABZP-DES1@R1
  - **Predecessors:** RM261003ABZP-DES2@R1

- **RM261003ABZP-DES3@R1 — Line-array TextBuffer behind an interface, with vim undo blocks**
  - **Requirements:** RM261003ABZP-REQ2@R2 - undo per undo block; RM261003ABZP-REQ9@R2 - 5,000-line target
  - **Decision:** immutable line array with structural sharing; `apply(edit)` returns an inverse; undo stack of blocks (one Normal command or one Insert session).
  - **Explanation:** TextBuffer model; `src/core/editor/text-buffer.ts`. A piece table can replace the implementation without changing callers.
  - **Evidence:** `alfred/apps/tui/src/view/editor/text-buffer.ts` - single-string buffer (186 lines) as reference.
  - **Research:** `RM261003ABZP-RF6` - line array adequate at ≤ 5,000 lines; undo block = typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** O(lines) splices on huge files; rejected OpenTUI's native `EditBuffer` as source of truth (couples core to a 0.x UI library).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES4@R1 — Table-driven vim engine**
  - **Requirements:** RM261003ABZP-REQ2@R2 - core vim command set, Esc timeout
  - **Decision:** a pure key-sequence parser for `[count]["reg][count]op[count](motion|textobject)` with motion, operator, and text-object tables; mode machine (normal, insert, visual char/line, cmdline); last-change record for `.`; ex command table.
  - **Explanation:** `src/core/vim/engine.ts`; Esc timeout handled in `ui/input.ts` (RM261003ABZP-DES10@R1).
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts:15` - Alfred supports only two modes with a hard-coded pending set.
  - **Research:** `RM261003ABZP-RF5` - kitty keyboard protocol, 50 ms timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** no macros or Visual block in v1 (deferred); rejected embedding Neovim (user decision).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES5@R1 — Command registry and keymap trie as the single extension point for actions**
  - **Requirements:** RM261003ABZP-REQ3@R3 - leader, which-key, palette, config; RM261003ABZP-REQ11@R2 - extend by registration
  - **Decision:** every action is a named `Command`; keys map to command ids through a per-mode trie; which-key, palette, help, and config overrides read the same registry.
  - **Explanation:** `src/core/commands/registry.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input - LazyVim style.
  - **Research:** None
  - **Tradeoffs:** commands must be pure (state + effects), which forbids quick ad-hoc I/O in commands; accepted for testability.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** None

- **RM261003ABZP-DES6@R1 — micromark/mdast with Obsidian extensions and block-level reparse**
  - **Requirements:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2
  - **Decision:** port Alfred's micromark + GFM + math parsing and Obsidian syntax into `core/markdown`; split into blocks and reparse only changed blocks; one `Doc` feeds layout, index, and HTML.
  - **Explanation:** Doc model; `src/core/markdown/doc.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` - existing micromark pipeline.
  - **Research:** `RM261003ABZP-RF7` - micromark conformant but not incremental; block reparse meets budgets; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block splitting must handle lists, fences, and frontmatter carefully; rejected OpenTUI's tree-sitter Markdown (UI-layer dependency, no Obsidian syntax) and Lezer (skips link reference validation; another parser to learn).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES7@R2 — Worker-built in-memory index with a documented resolution rule**
  - **Requirements:** RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename; RM261003ABZP-REQ3@R3 - pickers and full-text search; RM261003ABZP-REQ9@R2 - non-blocking index
  - **Decision:** a Bun `Worker` scans and summarizes notes and answers full-text queries; the main thread holds `NoteIndex` built from summaries; resolution order: root path → alias → basename ranked by same folder, shortest path, alphabetical; `planRename` rewrites link spans only; `link.linkMention` wraps one unlinked mention in `[[…]]` in its source note through a span edit (open buffer in memory, closed file via `write`).
  - **Explanation:** NoteSummary and NoteIndex; `resolve.ts`; `rename.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred used SQLite; `so` has no persistence need for the index.
  - **Research:** `RM261003ABZP-RF8` - duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Tradeoffs:** reindex on every start (< 3 s target); rejected SQLite (persistence and schema cost without need) and ripgrep (external binary).
  - **Dependencies:** RM261003ABZP-DES6@R1
  - **Predecessors:** RM261003ABZP-DES7@R1

- **RM261003ABZP-DES8@R1 — Atomic saves, directory watching, own-write stamps, and trash adapters**
  - **Requirements:** RM261003ABZP-REQ1@R2 - safe file management
  - **Decision:** `atomicWrite` (realpath → same-dir temp → fsync → chmod → rename); `fs.watch(root, {recursive:true})` with per-path debounce and own-write stamps; trash via freedesktop spec on Linux and Finder automation (`osascript`) on macOS, else typed confirmation; autosave policy and conflict rules live in core.
  - **Explanation:** `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow.
  - **Evidence:** `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - autosave queue reference.
  - **Research:** `RM261003ABZP-RF11` - fsync, same directory, directory watching, undoable reload; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2
  - **Tradeoffs:** rename-based saves replace hard links (acceptable for notes); recursive `fs.watch` relies on platform support in Bun on macOS and Linux — verified in the first delivery item.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** None

- **RM261003ABZP-DES9@R2 — Viewport-only live-preview layout with line and block reveal and registered block renderers**
  - **Requirements:** RM261003ABZP-REQ5@R2 - live preview; RM261003ABZP-REQ9@R2 - smooth scrolling
  - **Decision:** pure `layoutViewport` produces `RenderLine[]` for visible rows only; cursor line reveals inline syntax, cursor inside a multi-line block reveals the whole block; folded callouts and expanded embeds follow the window's `folds` set; block renderers are registered per block kind; widgets (image, embed, base) reserve rows.
  - **Explanation:** RenderLine model; `src/core/layout/layout.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/editor/reveal-units.ts` - reveal units reference.
  - **Research:** `RM261003ABZP-RF7` - per-element reveal in Obsidian; block reveal for multi-line constructs; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal; rejected OpenTUI `MarkdownRenderable` conceal (UI-owned parsing, no Obsidian syntax).
  - **Dependencies:** RM261003ABZP-DES6@R1
  - **Predecessors:** RM261003ABZP-DES9@R1

- **RM261003ABZP-DES10@R1 — OpenTUI shell with a custom editor renderable, normalized input, and guaranteed terminal restore**
  - **Requirements:** RM261003ABZP-REQ2@R2 - Esc, cursor shape; RM261003ABZP-REQ3@R3 - explorer, overlays; RM261003ABZP-REQ5@R2 - images; RM261003ABZP-REQ11@R2 - restore, `NO_COLOR`, terminal support
  - **Decision:** `@opentui/core` pinned exactly; layout of explorer, bufferline, window splits, side panel, statusline, cmdline, overlays; a custom `EditorView` renderable paints `RenderLine[]`; images via OpenTUI's auto protocol (kitty → sixel → blocks); input normalized to `Key` with kitty keyboard protocol and Esc timeout; theme tokens with `NO_COLOR`; restore on exit, signals, and uncaught errors.
  - **Explanation:** `src/ui/*`; `src/ui/editor-view.ts`.
  - **Evidence:** `alfred/apps/tui/src/terminal/shutdown.ts` - restore coordinator reference; Context7 `/anomalyco/opentui`.
  - **Research:** `RM261003ABZP-RF1`, `RM261003ABZP-RF2`, `RM261003ABZP-RF4`, `RM261003ABZP-RF5`; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Tradeoffs:** dependence on a 0.x library contained to `src/ui`; rejected Ink (React redraw cost) and a custom renderer (upfront cost).
  - **Dependencies:** RM261003ABZP-DES1@R1, RM261003ABZP-DES9@R2
  - **Predecessors:** None

- **RM261003ABZP-DES11@R1 — Shared Moment-subset formatter, pure template expansion, and daily-note commands**
  - **Requirements:** RM261003ABZP-REQ6@R2 - daily notes and templates; RM261003ABZP-REQ7@R2 - Bases date formatting
  - **Decision:** `core/time/format.ts` implements the documented token subset and `[literal]`; `core/notes` computes daily paths (with `/` subfolders) and expands `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}`; commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`.
  - **Explanation:** `src/core/time/format.ts`; `src/core/notes/*`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input.
  - **Research:** `RM261003ABZP-RF10` - Moment tokens, `{{time:FORMAT}}`, subfolders; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Tradeoffs:** rare tokens unsupported (kept literal); rejected Moment.js and Day.js dependencies (maintenance mode; extra weight).
  - **Dependencies:** RM261003ABZP-DES5@R1
  - **Predecessors:** None

- **RM261003ABZP-DES12@R1 — Ported Bases engine with table and Kanban view models and YAML-preserving write-back**
  - **Requirements:** RM261003ABZP-REQ7@R2 - Bases table and Kanban views
  - **Decision:** port `alfred/packages/vault/src/domain/bases/*` (parser, evaluator, expression, yaml-patcher) and `alfred/packages/view-model/src/base/*` row and board rules into `core/bases`; view models `TableModel` and `KanbanModel`; unknown layouts map to `TableModel` with a notice; the Kanban `type` string is one constant verified against an Obsidian 1.14+ file; edits become `write` effects through the atomic save path; embeds render through a `base` block renderer.
  - **Explanation:** `src/core/bases/*`; Base views in `src/ui/views/`.
  - **Evidence:** `alfred/packages/vault/src/domain/bases/parser.ts:19`, `evaluator.ts:164` - no file-system or Bun imports (context assumption).
  - **Research:** `RM261003ABZP-RF9` - layouts, Kanban rules; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - **Tradeoffs:** follows an early-access Obsidian layout; guarded by the constant, a fixture, and the table fallback.
  - **Dependencies:** RM261003ABZP-DES7@R2, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES11@R1
  - **Predecessors:** None

- **RM261003ABZP-DES13@R2 — `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering**
  - **Requirements:** RM261003ABZP-REQ8@R2 - read-only preview
  - **Decision:** `preview/server.ts` binds `127.0.0.1:0`, checks Host, serves a page shell, SSE `/events` (`doc` and `stopped` events), `/render` fragments from core `renderHtml(doc)`, and contained `/file/*`; the page loads KaTeX and Mermaid from jsDelivr and falls back to showing source when offline.
  - **Explanation:** Preview HTTP routes; `src/preview/server.ts`; `src/core/render-html/render.ts`.
  - **Evidence:** user decision "no Next.js".
  - **Research:** `RM261003ABZP-RF12` - binding, Host check, containment, SSE; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Tradeoffs:** math and diagrams need network in the browser (fallback to source); rejected bundling KaTeX/Mermaid into the binary (multi-MB size) and WebSocket (bidirectional not needed).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R2
  - **Predecessors:** RM261003ABZP-DES13@R1

- **RM261003ABZP-DES14@R1 — TOML config at XDG path validated by schema; per-workspace state at XDG state path**
  - **Requirements:** RM261003ABZP-REQ3@R3 - configuration and state
  - **Decision:** `Bun.TOML.parse` + zod schema (`core/config/schema.ts`); config path honors XDG rules (relative values ignored); invalid config → error notice + defaults; state JSON at `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json` holding recent notes, jump list, open buffers, window layout.
  - **Explanation:** AppConfig; `src/workspace/config-file.ts`; `src/workspace/state-file.ts`.
  - **Evidence:** `rm261003abzp-research.md` S21, S9, S30.
  - **Research:** `RM261003ABZP-RF15` - TOML, XDG rules, state home; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R3)
  - **Tradeoffs:** TOML instead of the proposal's `config.ts` — no code execution and simpler validation, at the cost of no scripting in config (agent decision under delegation).
  - **Dependencies:** RM261003ABZP-DES5@R1
  - **Predecessors:** None

- **RM261003ABZP-DES15@R1 — Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile**
  - **Requirements:** RM261003ABZP-REQ10@R2 - fast checks, CI, release; RM261003ABZP-REQ11@R2 - Conventional Commits, SemVer
  - **Decision:** Bun (exact version in `packageManager`), TypeScript 7 `tsc --noEmit` strict, Biome, knip, `bun test` (unit colocated; component via OpenTUI test renderer; few PTY e2e); `bun run check` = biome check + tsc + knip + boundary test + unit tests; CI jobs `check` and `test` (component, e2e, bench) in parallel with Bun cache; release-please on `main`; release job on tag: `bun install --os="*" --cpu="*"`, compile `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64`, `bun-linux-arm64` with `OPENTUI_LIBC=glibc` defined for Linux, `SHA256SUMS`, smoke `so --version` on `macos-latest` and `ubuntu-latest`.
  - **Explanation:** Project Structure (`package.json`, `.github/workflows/*`).
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's eight CI groups are the anti-pattern avoided.
  - **Research:** `RM261003ABZP-RF3`, `RM261003ABZP-RF13`, `RM261003ABZP-RF14`; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - **Tradeoffs:** unsigned macOS binaries (signing deferred); release-please adds a bot PR.
  - **Dependencies:** RM261003ABZP-DES1@R1
  - **Predecessors:** None

- **RM261003ABZP-DES16@R1 — Performance by construction plus benchmark gates**
  - **Requirements:** RM261003ABZP-REQ9@R2 - performance targets
  - **Decision:** viewport-only layout (DES9), block parse cache (DES6), worker index and search (DES7), frame coalescing (one render per input burst), first frame before indexing, lazy image decode with an LRU cache (64 MiB), and benchmarks through the OpenTUI test renderer gated at 2× (median of 5) in CI.
  - **Explanation:** Keystroke to frame and Startup flows; `test/bench/`.
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's 64 MiB image budget precedent.
  - **Research:** `RM261003ABZP-RF2` - in-process metrics; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Tradeoffs:** benchmarks add CI time (bounded by the 3 min budget); terminal display latency is outside the measurement.
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES9@R2
  - **Predecessors:** None

| Current requirement | Design decision | Canonical design location | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R2 - folder workspace, safe files | RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R2 | `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow | RM261003ABZP-S1@R1 | RM261003ABZP-V1@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R1 | `src/core/editor/`, `src/core/vim/`, `src/ui/input.ts` | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R3 - navigation, config, state | RM261003ABZP-DES5@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES10@R1, RM261003ABZP-DES14@R1 | `src/core/commands/`, `src/ui/overlays/`, `src/workspace/config-file.ts`, `state-file.ts` | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R1 |
| RM261003ABZP-REQ4@R3 - links | RM261003ABZP-DES7@R2, RM261003ABZP-DES6@R1 | `src/core/index/` | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1 | `src/core/markdown/`, `src/core/layout/`, `src/ui/editor-view.ts` | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R1, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | `src/core/time/`, `src/core/notes/` | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R1, RM261003ABZP-DES11@R1 | `src/core/bases/`, `src/ui/views/` | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - preview | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R1 | `src/preview/`, `src/core/render-html/` | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R2 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-DES16@R1 | Keystroke and Startup flows; `test/bench/` | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R2 - dev, CI, release | RM261003ABZP-DES15@R1, RM261003ABZP-DES1@R1 | `package.json`, `.github/workflows/` | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R2 - foundations | RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R1, RM261003ABZP-DES10@R1 | `test/boundaries.test.ts`, registries, `src/ui/shell.ts` | RM261003ABZP-S11@R1 | RM261003ABZP-V15@R1, RM261003ABZP-V16@R1, RM261003ABZP-V17@R1 |

## Unresolved Items

None — open technical confirmations (OpenTUI paint/image API details at the pinned version, recursive `fs.watch` behavior, Kanban `type` value) are delivery constraints with named verification, not design decisions.

## Approval

- **Requirement baseline:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ4@R3 … RM261003ABZP-REQ11@R2
- **Approved design:** RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1 … RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1 … RM261003ABZP-DES12@R1, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R1 … RM261003ABZP-DES16@R1
- **Approved success and verification:** RM261003ABZP-S1@R1 … RM261003ABZP-S11@R1; RM261003ABZP-V1@R1 … RM261003ABZP-V5@R1, RM261003ABZP-V6@R2, RM261003ABZP-V7@R1 … RM261003ABZP-V10@R1, RM261003ABZP-V11@R2, RM261003ABZP-V12@R1 … RM261003ABZP-V17@R1
- **Approval evidence:** User delegated all decisions on 2026-10-03 ("you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"); the agent approved this design, the DES2/DES7/DES9/DES13 R2 revisions from the UI system-impact assessment, and the V6/V11 R2 verification revisions, under that delegation.
`````

- **RM261003ABZP-DES8@R1, RM261003ABZP-DES15@R1 — Post-DI1 synchronization: macOS trash without a prompt, pull-request-only CI, native smoke**
  - **Archived at:** 2026-10-03T11:56:27Z
  - **Change type:** Revised
  - **Reason:** DI1 (W261003HEGE, PR #1, merged as `c98aa19`) delivered approved refinements that change these decisions: the user decided CI runs on pull requests only (RM261003ABZP-REQ10@R3); DI1 research found that Finder automation prompts for Automation permission, that only a native runner proves each binary starts, and that a release created by release-please does not trigger tag workflows.
  - **Changes:**
    - DES8: macOS trash uses `/usr/bin/trash` when present, else `NSFileManager` through JXA with the path as an argument, both without a permission prompt; Finder automation is dropped. Recursive `fs.watch` is recorded as confirmed. Project Structure `trash.ts` purpose updated.
    - DES15: CI runs on pull requests only and cancels superseded runs; release-please calls the release workflow through `workflow_call` (a pushed `v*` tag still triggers it); smoke runs natively on four runners instead of `macos-latest` and `ubuntu-latest`. Project Structure adds `release-please.yml` and restates `ci.yml` and `release.yml` purposes.
    - Contract clarification, revisions retained: AppConfig `escTimeoutMs` and `normalizeKey` state the effective timeout `max(escTimeoutMs, 20)` because OpenTUI resolves a legacy lone Esc at 20 ms. The default 50 ms and the RM261003ABZP-V3@R1 expected result are unchanged; only configured values below 20 ms are affected.
    - Reference updates, revisions retained: RM261003ABZP-S10@R1 and RM261003ABZP-V14@R1 (V14's "smoke jobs on macOS and Linux" still holds with four native runners), DES1@R2 requirements, the cross-cutting rollout row, and the coverage table now cite REQ10@R3, DES8@R2, DES15@R2.
    - Unresolved Items record DI1's confirmations (OpenTUI 0.5.14 paint, buffer, and test-renderer APIs; recursive `fs.watch`) and keep the OpenTUI image API (before DI3) and Kanban `type` (DI4) open.
  - **Record transitions:**
    - RM261003ABZP-DES8@R1 → RM261003ABZP-DES8@R2 - revision change (macOS trash mechanism)
    - RM261003ABZP-DES15@R1 → RM261003ABZP-DES15@R2 - revision change (CI trigger, release wiring, native smoke)
    - RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-S10@R1, RM261003ABZP-V3@R1, RM261003ABZP-V14@R1 - Revision retained
  - **Requirement baseline:** RM261003ABZP-REQ10@R2 → RM261003ABZP-REQ10@R3; others unchanged.
  - **Evidence:** `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-system-design.md` Parent Synchronization items 1, 2, 4, 5, 6; `w261003hege-research.md` RF4 (20 ms Esc), RF7 (cross-compile, native smoke), RF8 (recursive `fs.watch`), RF9 (release-please outputs), RF11 (macOS trash without prompt); `.github/workflows/{ci,release-please,release}.yml`, `src/workspace/trash.ts`, `src/ui/input.ts` at `c98aa19`.
  - **Research provenance:**
    - None - no new roadmap research; DI1's work-level findings are cited as evidence. RF3, RF11, RF13, and RF14 support for DES8 and DES15 is unchanged.
  - **Affected coverage:** RM261003ABZP-REQ10@R2 → DES15@R1 → S10@R1 → V14@R1 becomes RM261003ABZP-REQ10@R3 → DES15@R2 → S10@R1 → V14@R1; RM261003ABZP-REQ1@R3 → DES8@R1 becomes → DES8@R2; S1@R1/V1@R1 unchanged.
  - **Approval evidence:** Synchronization approved by the user on 2026-10-03.
  - **Downstream impact:** `rm261003abzp-roadmap-index.md`, `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, `rm261003abzp-roadmap-phase-2-obsidian-experience.md` cite DES8@R2 and DES15@R2 with PH/DI revisions retained. UI artifacts keep DES8@R1 and DES15@R1 as their approved system baseline; the conflict rules, trash availability result, and test policy they depend on are unchanged. W261003HEGE delivered the R2 behaviour; no other Work exists.

``````markdown
# RM261003ABZP: so v1 — Design

- **Status:** Approved
- **Outcome:** One Bun process with a pure TypeScript core — a language-neutral editor kernel (text, vim, commands, view) plus registered file types, Markdown language support, and note features (links, notes, Bases) — driven by one-way state flow, thin I/O adapters, an OpenTUI shell that draws only visible lines, and a read-only `Bun.serve` preview — enforced by an import-boundary test and gated by fast CI with in-process performance benchmarks.
- **History:** `rm261003abzp-design-revisions.md`

Use `None — <reason>` for sections or fields that do not apply. Diagrams and code previews show proposed design unless labeled as current evidence.

## Baseline and Goals

- **Context:** `rm261003abzp-roadmap-context.md@R2` - empty repository; Alfred code available to port (Markdown parse, Obsidian syntax, vim core, terminal graphics, Bases); scope change 2026-10-03: Markdown-first on a language-neutral core.
- **Requirements:** `rm261003abzp-requirements.md` - RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3 … RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R3 (approved).
- **Research:** `rm261003abzp-research.md`
- **Reconciliation:** `rm261003abzp-requirements.md` Research Reconciliation — Complete.
- **Goals:**
  - Meet REQ1–REQ11 with the fewest moving parts: one process, one package, one state store.
  - Keep every product rule in a pure, unit-testable core; keep OpenTUI, Bun, and the file system at the edges.
  - Keep the editor kernel language-neutral: Markdown, links, notes, and Bases plug in through a file-type registry, so code editing and notebooks can be added later as registrations, not rewrites (RM261003ABZP-REQ11@R3).
  - Extend by registration (commands, keymaps, syntax extensions, block renderers, Bases view types, file types, highlighters, decoration providers, editor kinds) — the known extension needs from RM261003ABZP-REQ11@R3.
- **Binding constraints:**
  - `.s1mple/S1MPLE.md` Implementation - "Keep it lean and simple": no monorepo, no server between UI and core, no speculative plugin system.
  - RM261003ABZP-REQ11@R3 - only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs; `src/core/kernel/` imports nothing from `filetypes/`, `lang/`, or `features/`.
  - RM261003ABZP-REQ10@R2 - no tool may depend on the TypeScript compiler API (TypeScript 7 ships none, `RM261003ABZP-RF13`).

## System Architecture

- **System context:** One user in a terminal runs `so [path]`. External systems: the file system (the workspace folder, `$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, trash), the terminal emulator (keys, mouse, graphics), the system clipboard, and — only while `:Preview` runs — a local browser over `127.0.0.1`. No network service, database, Git, or AI.
- **Current architecture:** `rm261003abzp-roadmap-context.md@R2` Current System — empty repository.

```text
Not established — empty repository (only .s1mple/ guidance)
```

- **Proposed architecture:**

```text
                         ┌──────────────────────── src/app (composition root) ────────────────────────┐
 terminal ⇄ OpenTUI ⇄    │  main.ts → loads config/state → creates Store → starts UI, effects, workers │
                         └──────┬──────────────────────┬───────────────────────┬────────────────────┬──┘
                                │                      │                       │                    │
                   ┌────────────▼─────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
                   │ src/ui  (OpenTUI)    │  │ src/workspace (I/O)│  │ src/preview       │  │ src/core (pure)│
                   │ views, input, paint  │  │ fs, watcher, trash │  │ Bun.serve + SSE   │  │ state, vim,    │
                   │ images, theme        │  │ index worker, cfg  │  │ read-only HTML    │  │ kernel, file-  │
                   └────────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │ types,lang,feat│
                                │ reads state,          │ executes effects,     │ reads state, └───────▲────────┘
                                │ dispatches actions    │ dispatches results    │ renders HTML         │
                                └───────────────────────┴───────────────────────┴──────── import ──────┘

 Allowed imports:  app → ui, workspace, preview, core      ui → core      workspace → core      preview → core
                   core → (nothing outside core; npm parsing libs only)

 Inside core:      core/kernel  (text, editor, vim, commands, view)  → kernel only        ← language-neutral
                   core/filetypes                                     → kernel
                   core/lang/*, core/features/*                       → kernel, filetypes, lang, features, time
                   core/state, core/config                            → any core module (composition)
                   nothing outside core/state and core/config imports them
```

The core owns all product behavior; the three edge layers are adapters. This reuses Alfred's parsing, Obsidian syntax, vim, terminal-graphics knowledge, and Bases engine by porting them into `core/` (Alfred's kernel, client, protocol, chat, Git, SQLite, Ink, and Next.js are not reused). Main tradeoff: one process keeps latency and code minimal, but a CPU-heavy task on the main thread would stall input — so scanning, parsing for the index, and full-text search run in a worker (RM261003ABZP-DES7@R3).

Inside the core, the kernel edits and lays out text for any language; Markdown is one registered file type whose parser, live-preview decorations, and highlighter plug into the kernel (RM261003ABZP-DES1@R2, RM261003ABZP-DES17@R1). A code editor or notebook later adds file types, decoration providers, and editor kinds; the kernel does not change. Tradeoff: one more indirection (the file-type registry) between an open buffer and its Markdown behaviour, accepted because it is also what Bases and plain text files need in v1.

## Components and Boundaries

- **App (composition root)**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2
  - **Location:** `src/app/`
  - **Responsibilities:** parse CLI args; register file types (`text`, `markdown`, `base`, code types), commands, and keymaps; load config and state; construct the store, effect runner, workspace adapters, index worker, UI, and preview on demand; own process lifecycle and exit codes.
  - **Collaborators:** `bin/so` → `app/main.ts` → `core/store`, `workspace/*`, `ui/shell`, `preview/server`
  - **Contracts:** Action and Effect protocol; AppConfig
  - **Code shape:** `src/app/main.ts` `main`, `src/app/effects.ts` `runEffect`
  - **Must not own:** product rules, rendering, Markdown semantics.

- **Core — state**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Location:** `src/core/state/`
  - **Responsibilities:** `AppState`, pure `update(state, action) → { state, effects }`; jump list, autosave policy, conflict rules; opening a file as a buffer of its registered file type.
  - **Collaborators:** ui/workspace/preview → `dispatch(action)` → `update` → effects → app effect runner
  - **Contracts:** Action and Effect protocol; AppState
  - **Code shape:** `src/core/state/update.ts` `update`
  - **Must not own:** timers, I/O, terminal escape codes.

- **Core — editor kernel**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/core/kernel/` (`text/`, `editor/`, `vim/`, `commands/`, `view/`)
  - **Responsibilities:** text buffer, cursor and selections, undo blocks, registers, window tree; vim mode machine, key-sequence parser, motions, operators, text objects, dot-repeat, search, ex commands; command registry, file-type-scoped keymap trie, which-key and palette data; the viewport text view that lays out visible rows from text and decorations.
  - **Collaborators:** `update` → `vim.handleKey(bufferState, key)` → `TextBuffer`; `update` → `keymap.lookup({mode, filetype})`; UI → `layoutText(view, providers, analysis)` → `RenderLine[]`
  - **Contracts:** TextBuffer; VimState; Command and Keymap registry; Decoration and RenderLine model
  - **Code shape:** `src/core/kernel/text/text-buffer.ts` `TextBuffer`; `src/core/kernel/vim/engine.ts` `handleKey`; `src/core/kernel/commands/registry.ts` `CommandRegistry`, `Keymap`; `src/core/kernel/view/text-view.ts` `layoutText`
  - **Must not own:** rendering, clipboard I/O (expressed as effects), and anything Markdown-, link-, note-, or Bases-specific (enforced by the boundary test).

- **Core — file types**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Location:** `src/core/filetypes/`
  - **Responsibilities:** `FileType` contract and `FileTypeRegistry`: path → file type (extension, then file name, then the `text` fallback); per file type the editor kind, views, highlighter, and analysis hook; the built-in `text` file type.
  - **Collaborators:** `app/main` → registers `markdown`, `base`, and code file types; `update` → `fileTypes.forPath(path)` on open
  - **Contracts:** FileType and Decoration model
  - **Code shape:** `src/core/filetypes/registry.ts` `FileTypeRegistry`, `FileType`
  - **Must not own:** language parsing (lives in `lang/`), file reading (workspace).

- **Core — languages (Markdown and code highlighting)**
  - **Decisions:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES13@R2, RM261003ABZP-DES17@R1
  - **Location:** `src/core/lang/markdown/`, `src/core/lang/code/`
  - **Responsibilities:** Markdown block splitting, per-block parse cache, Obsidian syntax extensions, `Doc` model; the live-preview decoration provider with reveal rules and block renderers; pure HTML rendering for the preview; the `markdown` file type. `lang/code` wraps lowlight as `Highlighter`s and registers code file types (TypeScript, JavaScript, JSON, YAML, TOML, shell, Python, CSS, HTML, …) used for code files and fenced code blocks.
  - **Collaborators:** `update` → `markdown.analyze(buf, prevDoc)` → `Doc`; UI → `layoutText(view, [highlight, livePreview(doc)])` → paint; preview → `renderHtml(doc, ctx)`
  - **Contracts:** Doc model; FileType and Decoration model
  - **Code shape:** `src/core/lang/markdown/doc.ts` `parseDoc`; `src/core/lang/markdown/live-preview.ts` `livePreview`; `src/core/lang/markdown/html.ts` `renderHtml`; `src/core/lang/code/highlight.ts` `lowlightHighlighter`
  - **Must not own:** terminal escape output, image decoding, HTTP.

- **Core — links feature**
  - **Decisions:** RM261003ABZP-DES7@R3
  - **Location:** `src/core/features/links/`
  - **Responsibilities:** `NoteSummary` extraction, `NoteIndex` (names, aliases, headings, blocks, links, tags, backlinks) plus the workspace file list for the file picker, link resolution rule, rename planning, fuzzy matching, full-text search functions.
  - **Collaborators:** index worker → `summarize(path, text)` → `NoteIndex.apply(delta)`; `update` → `resolveLink`, `planRename`
  - **Contracts:** NoteSummary and NoteIndex; LinkTarget
  - **Code shape:** `src/core/features/links/note-index.ts` `NoteIndex`; `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`
  - **Must not own:** file scanning (worker), persistence.

- **Core — Bases and notes features**
  - **Decisions:** RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2
  - **Location:** `src/core/features/bases/`, `src/core/features/notes/`, `src/core/time/`
  - **Responsibilities:** `.base` parsing, expression evaluation, table and Kanban view models, YAML-preserving frontmatter patches, the `base` file type and editor kind; daily-note paths, template expansion, Moment-subset date formatting.
  - **Collaborators:** `update` → `evaluateBase(base, index)` → `BaseViewModel`; `update` → `expandTemplate(tpl, vars)`
  - **Contracts:** BaseViewModel; Template variables
  - **Code shape:** `src/core/features/bases/evaluate.ts` `evaluateBase`; `src/core/time/format.ts` `formatDate`
  - **Must not own:** file writes (expressed as `write` effects).

- **Workspace adapters**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1, RM261003ABZP-DES17@R1
  - **Location:** `src/workspace/`
  - **Responsibilities:** atomic save, text read with binary and size checks, create, rename, move, delete-to-trash; directory watcher with own-write suppression; index worker (scan, summarize, search); config and state files; clipboard; opening URLs/browser.
  - **Collaborators:** app effect runner → `workspace/*` → `dispatch(resultAction)`
  - **Contracts:** Effect protocol; FileEvent; WorkerMessage
  - **Code shape:** `src/workspace/fs.ts` `atomicWrite`, `readTextFile`; `src/workspace/watcher.ts` `watchWorkspace`; `src/workspace/index-worker.ts`
  - **Must not own:** decisions about conflicts, autosave timing, or link rewriting (core decides).

- **UI shell**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/ui/`
  - **Responsibilities:** OpenTUI renderer lifecycle; key/mouse normalization (kitty keyboard protocol, Esc timeout); layout of explorer, bufferline, editor windows, side panel, statusline, command line, overlays (picker, which-key, palette, prompts, help, notifications); one view per editor kind (`text` → `EditorView`, `base` → Bases view); painting `RenderLine[]`; widget painters keyed by widget type (image, embed, base); theme and `NO_COLOR`; terminal restore.
  - **Collaborators:** OpenTUI → `ui/input` → `dispatch`; store subscription → `ui/shell.render(state)`
  - **Contracts:** Key; RenderLine; AppState (read-only)
  - **Code shape:** `src/ui/shell.ts` `createShell`; `src/ui/editors/registry.ts` `editorViews`; `src/ui/editors/text-view.ts` `EditorView`; `src/ui/widgets/registry.ts` `widgetPainters`; `src/ui/input.ts` `normalizeKey`
  - **Must not own:** editing logic, Markdown parsing, file-type decisions, file I/O.

- **Preview server**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Location:** `src/preview/`
  - **Responsibilities:** `Bun.serve` on `127.0.0.1:0`, Host allowlist, SSE updates, read-only page, contained asset serving.
  - **Collaborators:** app → `startPreview(store)` → browser; store subscription → SSE push
  - **Contracts:** Preview HTTP routes
  - **Code shape:** `src/preview/server.ts` `startPreview`
  - **Must not own:** editing; files outside the workspace.

## Project Structure

- **Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json                 Purpose: one package; scripts dev/check/test/bench/build; exact pins
│       Symbols: scripts.check, packageManager, "@opentui/core": "<exact>"   Decisions: DES15
├── [A] tsconfig.json                Purpose: strict ESM, noEmit, TS 7          Decisions: DES15
├── [A] biome.json                   Purpose: format + lint                      Decisions: DES15
├── [A] knip.json                    Purpose: dead-code check                    Decisions: DES15
├── [A] release-please-config.json   Purpose: Conventional Commits → SemVer; initial-version 0.1.0  Decisions: DES15
├── [A] .release-please-manifest.json Purpose: release-please version manifest ({".": "0.0.0"})  Decisions: DES15
├── [A] .github/workflows/ci.yml     Purpose: check ∥ test+bench jobs            Decisions: DES15, DES16
├── [A] .github/workflows/release.yml Purpose: release-please + compile ×4 + smoke  Decisions: DES15
├── [A] bin/so                        Purpose: `#!/usr/bin/env bun` entry for source runs  Decisions: DES1
├── [A] src/app/
│   ├── main.ts                      Purpose: CLI, wiring, lifecycle            Symbols: main, parseArgs   Decisions: DES1, DES2
│   └── effects.ts                   Purpose: effect runner                     Symbols: runEffect         Decisions: DES2
├── [A] src/core/
│   ├── kernel/                      Purpose: language-neutral editor kernel; imports only kernel  Decisions: DES1
│   │   ├── text/                    Purpose: TextBuffer, Edit, Pos, Range       Symbols: TextBuffer, Edit  Decisions: DES3
│   │   ├── editor/                  Purpose: undo, registers, windows           Symbols: UndoStack, Registers  Decisions: DES3
│   │   ├── vim/                     Purpose: modes, parser, motions, operators, text objects, ex  Symbols: handleKey, motions, textObjects  Decisions: DES4
│   │   ├── commands/                Purpose: registry, file-type-scoped keymap trie, which-key  Symbols: CommandRegistry, Keymap, KeyScope  Decisions: DES5
│   │   └── view/                    Purpose: viewport text layout from decorations  Symbols: layoutText, Decoration, RenderLine  Decisions: DES9
│   ├── filetypes/                   Purpose: FileType contract, registry, `text` fallback  Symbols: FileTypeRegistry, FileType, Highlighter  Decisions: DES17
│   ├── lang/
│   │   ├── markdown/                Purpose: block split, parse cache, Obsidian extensions, live-preview provider, HTML  Symbols: parseDoc, Doc, livePreview, renderHtml, markdownFileType  Decisions: DES6, DES9, DES13
│   │   └── code/                    Purpose: lowlight highlighter, code file types  Symbols: lowlightHighlighter, codeFileTypes  Decisions: DES17
│   ├── features/
│   │   ├── links/                   Purpose: summaries, index, file list, resolve, rename, search  Symbols: NoteIndex, resolveLink, planRename  Decisions: DES7
│   │   ├── bases/                   Purpose: ported Bases engine, view models, `base` file type  Symbols: parseBase, evaluateBase, KANBAN_TYPE, baseFileType  Decisions: DES12
│   │   └── notes/                   Purpose: daily notes, templates             Symbols: dailyPath, expandTemplate  Decisions: DES11
│   ├── time/                        Purpose: Moment-subset formatter            Symbols: formatDate        Decisions: DES11
│   ├── state/                       Purpose: AppState, Action, Effect, update  Symbols: update, AppState  Decisions: DES2
│   └── config/                      Purpose: config schema and defaults         Symbols: ConfigSchema, defaults  Decisions: DES14
├── [A] src/workspace/
│   ├── fs.ts                        Purpose: readTextFile (binary/size/BOM/EOL), atomicWrite, create, rename, move  Symbols: readTextFile, atomicWrite  Decisions: DES8, DES17
│   ├── trash.ts                     Purpose: freedesktop trash, macOS Finder trash  Symbols: moveToTrash  Decisions: DES8
│   ├── watcher.ts                   Purpose: directory watching, own-write suppression  Symbols: watchWorkspace  Decisions: DES8
│   ├── index-worker.ts              Purpose: list files, summarize notes, search text files in a Worker  Symbols: onmessage  Decisions: DES7
│   ├── config-file.ts               Purpose: XDG config load + validation       Symbols: loadConfig        Decisions: DES14
│   ├── state-file.ts                Purpose: XDG state load/save                Symbols: loadState, saveState  Decisions: DES14
│   └── system.ts                    Purpose: clipboard, open browser           Symbols: clipboard, openUrl  Decisions: DES8
├── [A] src/ui/
│   ├── shell.ts                     Purpose: renderer lifecycle, layout, restore  Symbols: createShell  Decisions: DES10
│   ├── input.ts                     Purpose: key/mouse normalization, Esc timeout  Symbols: normalizeKey  Decisions: DES10
│   ├── editors/                     Purpose: one view per editor kind: text (paints RenderLine rows, cursor), base  Symbols: editorViews, EditorView  Decisions: DES9, DES10, DES12
│   ├── widgets/                     Purpose: widget painters by type: image, embed, base  Symbols: widgetPainters  Decisions: DES10
│   ├── views/                       Purpose: explorer, bufferline, statusline, cmdline, side panel  Decisions: DES10
│   ├── overlays/                    Purpose: picker, which-key, palette, prompt, help, notify  Decisions: DES10, DES5
│   └── theme.ts                     Purpose: tokens, NO_COLOR                   Symbols: theme     Decisions: DES10
├── [A] src/preview/
│   ├── server.ts                    Purpose: Bun.serve, Host check, SSE, assets  Symbols: startPreview  Decisions: DES13
│   └── page.html                    Purpose: read-only page shell (embedded)   Decisions: DES13
└── [A] test/
    ├── boundaries.test.ts           Purpose: import-boundary enforcement (layers + kernel rule)  Decisions: DES1
    ├── e2e/                         Purpose: few PTY tests (start, edit, save, exit, restore)  Decisions: DES15
    ├── bench/                       Purpose: performance benchmarks via test renderer  Decisions: DES16
    └── fixtures/                    Purpose: sample workspace (notes, code files, a binary; an over-16 MiB file is generated at test time), 5,000-line note, 5,000-line TypeScript file, 10,000-note generator  Decisions: DES16, DES17
```

Unit tests sit next to code as `*.test.ts`.

## Runtime Flows

- **Keystroke to frame**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** OpenTUI key event → `ui/input.normalizeKey` → `store.dispatch({type:"key"})` → `core/state/update` → `keymap.lookup({mode, filetype})` or `vim.handleKey` → `TextBuffer.apply` → file type `analyze` (Markdown: `parseDoc` reparses changed blocks) → store notifies → `ui/shell.render` → `layoutText` with the view's decoration providers (visible rows only) → `EditorView` paint → OpenTUI native diff
  - **Flow:**

    ```text
    key ─→ normalizeKey ─→ dispatch(key) ─→ update(state,key)
                                              ├─ keymap trie {mode, buffer filetype} → {mode}: pending prefix? → state.pending, effect: startWhichKeyTimer
                                              ├─ command → run(ctx) → new state + effects (e.g. scheduleAutosave)
                                              └─ text edit → TextBuffer' + undo block + dirty block ids
                                                   → fileType.analyze (Markdown: reparse dirty blocks, cache by block hash)
          ui.render(state) ← store.notify ←───┘
            └─ layoutText(rows in view, [highlightMarks, view providers e.g. livePreview], view input) → paint → native diff → terminal
    ```

    State changes only inside `update`. Rendering is coalesced to at most one frame per input burst.

  - **Failure and recovery:** a command throws → `update` catches, keeps the previous state, emits `notify(error)`; a render error in one block → that block renders as source with a diagnostic marker; nothing crashes the process.
  - **Contracts and state:** Action and Effect protocol; AppState; FileType and Decoration model; RenderLine model
  - **Control flow:** `src/core/state/update.ts` `update`; `src/core/kernel/view/text-view.ts` `layoutText`; `src/ui/shell.ts` `createShell`

- **Startup**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** `app/main` → register file types (`markdown`, `base`, code types, `text` fallback) → `loadConfig`, `loadState` → `createStore` → `createShell` (first frame) → `startIndexWorker` → `watchWorkspace`
  - **Flow:**

    ```text
    so [path] → resolve workspace (folder | file's parent) ── missing → stderr + exit 2
             → load config (invalid → defaults + error notice) → load state (corrupt → empty)
             → first frame (explorer from a shallow readdir; opened file read directly)   ← < 200 ms target
             → worker: list all non-excluded files + summarize Markdown notes → post batches → dispatch(indexBatch) → status "indexing 4,210/10,000"
             → watcher starts → index ready
    ```

  - **Failure and recovery:** worker crash → notify and restart once; link features show "index unavailable" until restart succeeds; editing keeps working.
  - **Contracts and state:** AppConfig; WorkerMessage; NoteIndex
  - **Control flow:** `src/app/main.ts` `main`

- **Open a file**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES12@R2
  - **Participants:** `:e`, explorer `Enter`, picker, or link follow → effect `read(path)` → `workspace/fs.readTextFile` → `dispatch(fileLoaded | fileRefused)` → `update` → `fileTypes.forPath(path)` → buffer and window content
  - **Flow:**

    ```text
    open(path) → effect read(path) → readTextFile: size > 16 MiB          → fileRefused{reason:"tooLarge"}
                                                 NUL in first 8 KiB       → fileRefused{reason:"binary"}
                                                 not valid UTF-8 (fatal)  → fileRefused{reason:"binary"}
                                                 else strip BOM, detect EOL → fileLoaded{text, bom, eol, stamp}
    fileLoaded → fileTypes.forPath(path): ".md" → markdown (views live|source|reading, editor "text")
                                          ".base" → base (editor "base" → Bases view)
                                          ".ts" → typescript (views source, lowlight highlighter)
                                          other  → text (views source, no highlighter)
               → editor "text": buffer {fileType, view: first view, analysis: analyze?(buf)} → content {editor:"text", bufferId, …}
               → other editor: editorKinds.get(fileType.editor).open(path, text) → content {editor, state}
    fileRefused → notify "binary file — not opened" | "file too large — not opened (limit 16 MiB)"; no buffer, no write
    ```

  - **Failure and recovery:** read error → `fileRefused{reason:"io", message}` → notification; the previous buffer stays active.
  - **Contracts and state:** Action and Effect protocol; FileType and Decoration model; AppState
  - **Control flow:** `src/workspace/fs.ts` `readTextFile`; `src/core/filetypes/registry.ts` `FileTypeRegistry.forPath`, `EditorKindRegistry.get`

- **Save and external change**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R2
  - **Participants:** `update` (autosave policy) → effect `write` → `workspace/fs.atomicWrite` → `watcher` → `dispatch(fileChanged)` → `update` (conflict rules)
  - **Flow:**

    ```text
    edit → state.dirty=true → effect scheduleAutosave(1000ms) | leaveInsert | switchNote | exit | :w
         → effect write(path, text, expectedStamp) → atomicWrite: realpath → tmp in same dir → write (BOM + EOL restored) → fsync → chmod → rename
         → record ownWrite(path, stamp) → dispatch(saved(stamp))
    watcher(dir) event → stat+hash → ownWrite? ignore
                                   → buffer clean → dispatch(reload(text)) → undoable reload
                                   → buffer dirty → dispatch(conflict) → prompt: keep mine | take disk | view diff
    ```

  - **Failure and recovery:** write fails (permission, disk full) → buffer stays dirty, status shows `save failed: <reason>`, autosave retries with backoff (1 s, 2 s, 4 s, max 30 s); `:w` retries immediately. Rename failure leaves the temp file removed and the original intact.
  - **Contracts and state:** FileEvent; BufferState.stamp
  - **Control flow:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`

- **Follow, complete, and rename links**
  - **Decisions:** RM261003ABZP-DES7@R3, RM261003ABZP-DES5@R2
  - **Participants:** `update` → `resolveLink(index, sourcePath, target)` → open buffer + jump; `planRename(index, from, to)` → `write` effects
  - **Flow:**

    ```text
    gd on [[plan#Goals]] → resolveLink → {path:"projects/plan.md", heading:"Goals"} → push jumplist → open → cursor at heading
                         → unresolved → prompt "Create projects/plan.md?" → create effect
    rename a.md → b.md → planRename → [{path, edits[]}…] → apply to open buffers in memory + write effects for closed files
                       → fs rename → notify "12 files updated"
    ```

  - **Failure and recovery:** a link-rewrite write fails → remaining writes continue; failures are listed in a notification with paths; the rename itself is rolled back only if the file rename failed (links already rewritten are reported, not reverted).
  - **Contracts and state:** NoteIndex; LinkTarget
  - **Control flow:** `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`

- **Preview**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Participants:** `:Preview` (a Markdown-scoped command) → effect `startPreview` → `preview/server` → browser; store change (active Markdown doc or version) → SSE event → page fetches `/render`. Switching to a non-Markdown buffer sends nothing, so the page keeps the last note (RM261003ABZP-DES17@R1 note-only scope)
  - **Flow:**

    ```text
    :Preview → Bun.serve({hostname:"127.0.0.1", port:0}) → open http://127.0.0.1:<port>/
    page → GET /events (SSE) ; edit → debounce 100 ms → event "doc" {path, version, anchor} ; :PreviewStop/exit → event "stopped" → close
    page → GET /render?path=… → renderHtml(doc) → swap <main>, scroll to anchor
    any request with bad Host → 403 ; /file/<p> → realpath ⊂ workspace & not hidden? → bytes : 404
    ```

  - **Failure and recovery:** port bind fails → notify; browser cannot open → notify the URL; SSE drop → browser auto-reconnects and refetches.
  - **Contracts and state:** Preview HTTP routes
  - **Control flow:** `src/preview/server.ts` `startPreview`

## Contracts, Data, and State

- **Action and Effect protocol — State model**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Purpose:** the only way state changes and the only way side effects start.
  - **Participants:** ui, workspace, preview, timers → `Action` → `update` → `Effect[]` → app effect runner → result `Action`
  - **Meaning:** `Action` is a discriminated union (`key`, `mouse`, `resize`, `fileLoaded`, `fileRefused`, `saved`, `saveFailed`, `fileChanged`, `indexBatch`, `searchResults`, `timer`, …). `Effect` is a discriminated union (`read`, `write`, `create`, `rename`, `move`, `trash`, `startTimer`, `cancelTimer`, `clipboardWrite`, `clipboardRead`, `search`, `startPreview`, `stopPreview`, `openUrl`, `saveState`, `exit`).
  - **Ownership and lifecycle:** core defines both unions; app runs effects; every effect that can fail returns a success or failure action.
  - **Invariants:** `update` is pure and synchronous; no effect runs inside `update`; effects carry all data they need (no callbacks).
  - **State flow:**

    ```text
    Action → update → (State', Effect[]) → runEffect → Action …
    ```

  - **Shape:** `src/core/state/types.ts`

- **AppState — State model**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1
  - **Purpose:** single source of truth for everything visible.
  - **Participants:** `update` (owner) → ui/preview (readers)
  - **Meaning:** `workspace` (root, tree), `buffers` (by id: path, `fileType` id, TextBuffer, `analysis` (the file type's analysis state; Markdown: `Doc`), stamp, `bom`, `eol`, dirty, `view` — one of the file type's view ids, e.g. live|source|reading for Markdown, source for code), `windows` (split tree, active, and per-window `content` by editor kind: `{editor:"text", bufferId, cursor, scroll, folds}` where `folds` is the set of folded callout and expanded embed block ids, or `{editor: <registered kind>, state}` whose `state` comes from that kind's `EditorKindSpec.open` — in v1 only `base`, with state `{path, view, cursor}`), `vim` (mode, pending keys, registers, last change, search), `panels` (explorer, side panel kind), `overlay` (none | picker | whichKey | palette | prompt | help | conflict | calendar | completion), `index` (NoteIndex + status), `notifications`, `config`, `jumps`, `preview` (off | on(port)).
  - **Ownership and lifecycle:** created at startup from config + state file; `jumps` and recent notes persisted through `saveState` effects (debounced 2 s and on exit).
  - **Invariants:** one active window; each `text` window references an open buffer; a buffer's `view` is one of its file type's views; a buffer with `dirty=false` matches its last saved stamp. Adding an editor kind (a notebook later) registers an `EditorKindSpec` in core and an editor view in the UI; neither the `AppState` type nor the kernel changes.
  - **State flow:** `None — plain value replaced by update`
  - **Shape:** `src/core/state/types.ts` `AppState`

- **TextBuffer — Data model**
  - **Decisions:** RM261003ABZP-DES3@R1
  - **Purpose:** text storage and edit primitives behind a stable interface.
  - **Participants:** vim engine, rename planner, template insertion → `TextBuffer` → file type `analyze` (Markdown parser), highlighter, text view
  - **Meaning:** lines array, version number, `apply(edit)` returning a new buffer and the inverse edit; positions are `{line, col}` in UTF-16 code units aligned to grapheme boundaries.
  - **Ownership and lifecycle:** owned by a buffer entry; replaced on each edit (structural sharing of untouched lines).
  - **Invariants:** at least one line; line separators normalized to `\n` in memory, original separator (`\n`/`\r\n`), trailing newline, and leading UTF-8 BOM restored on save. UTF-16 positions match the Language Server Protocol's default position encoding, so a future LSP client needs no conversion.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/text/text-buffer.ts`

- **Doc model — Data model**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Purpose:** parsed Markdown shared by live preview, index summaries, and HTML preview.
  - **Participants:** `parseDoc` (the `markdown` file type's `analyze`) → `Doc` → live-preview provider, `summarize`, `renderHtml`
  - **Meaning:** `Doc { frontmatter?, blocks: Block[] }`; `Block { id, kind, startLine, endLine, hash, node }` where `node` is mdast extended with Obsidian nodes (`wikiLink`, `embed`, `tag`, `highlight`, `comment`, `callout`, `blockId`, `footnote*`, `math`).
  - **Ownership and lifecycle:** recomputed per buffer version; unchanged blocks reused by hash.
  - **Invariants:** blocks cover the document without overlap; a fenced code block or frontmatter is never split.
  - **State flow:** `None`
  - **Shape:** `src/core/lang/markdown/doc.ts`

- **RenderLine model — Data model**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Purpose:** UI-independent, language-neutral description of one screen row.
  - **Participants:** `layoutText` → `RenderLine[]` → `EditorView` (widgets → UI widget painters by `type`)
  - **Meaning:** `RenderLine { sourceLine, spans: {text, style: StyleToken, link?}[], widget?: {type: string, data, rows}, sign?: {text, style} }`; widget types in v1 are `image`, `embed`, `base`, `rule`, registered by `lang/markdown` and `features/bases`; `StyleToken` names a theme token (`heading1`, `bold`, `link`, `tag`, `codeKeyword`, …), never a colour.
  - **Ownership and lifecycle:** computed per frame for visible rows only.
  - **Invariants:** cursor column maps back to a source column through `spans` offsets; widget rows are counted in scroll math.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/view/types.ts`

- **FileType and Decoration model — Data model**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Purpose:** the only way language-specific behaviour reaches the kernel.
  - **Participants:** `lang/*`, `features/bases` → `FileTypeRegistry.register` (wired in `app/main`) → `update` (`forPath` on open; `analyze` per version) → `layoutText(view, providers, analysis)`
  - **Meaning:** `FileType { id, match: {extensions, names}, editor: EditorKind (an open string: "text" and "base" in v1, more by registration), views: [{id, readOnly?, decorations: DecorationProvider[], input?}], highlighter?, analyze? }`. `Decoration` = `mark` (style a range) | `replace` (hide or substitute a range, inline or whole lines, optionally with spans or a widget) | `widget` (insert rows or inline content at a position) | `line` (line style or sign). The kernel's `highlightMarks` turns `Highlighter` output into `mark` decorations; `Highlighter` and `Span` are kernel types, so the kernel never imports `filetypes`. A view's optional `input(analysis, ctx)` hook builds the per-frame provider input from a context type the language declares and `core/state` builds (Markdown: `MarkdownViewInput`), so the UI never branches on a file type. This is the decoration model of CodeMirror 6 (Obsidian's editor), Neovim extmarks, and VS Code decorations.
  - **Ownership and lifecycle:** file types are registered at startup and never change at runtime; providers run per frame on visible lines only.
  - **Invariants:** `text` is the fallback for any unmatched path; every `text` editor file type has a `source` view; decorations never change buffer text; providers are pure.
  - **State flow:** `None`
  - **Shape:** `src/core/filetypes/types.ts`, `src/core/kernel/view/decorations.ts`

- **NoteSummary and NoteIndex — Data model**
  - **Decisions:** RM261003ABZP-DES7@R3
  - **Purpose:** workspace-wide link, tag, heading, and block knowledge, plus the workspace file list.
  - **Participants:** worker `summarize` → `NoteSummary` → main `NoteIndex.apply`
  - **Meaning:** `NoteSummary { path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind:"wiki"|"md"|"embed"}], frontmatter }`. `NoteIndex` holds summaries by path plus derived maps: basename → paths, alias → paths, tag → paths, target path → backlinks; and `files` — every non-excluded workspace path — for the file picker.
  - **Ownership and lifecycle:** built at startup by the worker; updated per file event and per buffer save; never persisted.
  - **Invariants:** derived maps are rebuilt only for changed paths; only Markdown files are summarized; resolution order is fixed (RM261003ABZP-DES7@R3).
  - **State flow:** `empty → indexing(n/total) → ready → (fileEvent) ready`
  - **Shape:** `src/core/features/links/note-index.ts`

- **Preview HTTP routes — API**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Purpose:** read-only browser preview.
  - **Participants:** browser → `preview/server` → core `renderHtml`
  - **Meaning:** `GET /` page shell; `GET /events` SSE (`doc` events with `{path, version, anchor}`; a `stopped` event sent before `:PreviewStop` or exit closes the server); `GET /render?path=` HTML fragment; `GET /file/<path>` workspace asset bytes.
  - **Ownership and lifecycle:** exists only between `:Preview` and `:PreviewStop` or exit.
  - **Invariants:** hostname `127.0.0.1`; Host header ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403; realpath containment else 404; no mutating routes.
  - **State flow:** `off → on(port) → off`
  - **Shape:** `src/preview/server.ts`

- **AppConfig — Data model**
  - **Decisions:** RM261003ABZP-DES14@R1, RM261003ABZP-DES5@R2
  - **Purpose:** user options and keymap overrides.
  - **Participants:** `config-file.loadConfig` → `ConfigSchema` (zod) → `AppState.config`
  - **Meaning:** `leader`, `escTimeoutMs` (50), `autosave` (`{ enabled: true, delayMs: 1000 }`), `editor` (`tabWidth`, `wrap`, `relativeNumbers`), `preview` (`mode: "live"`, `embedMaxRows`, `images: "auto"|"blocks"|"off"`), `daily` (`folder`, `format`, `template`), `templates.folder`, `theme`, `color` (overrides `NO_COLOR`), `keys.<mode>` (`"<key-seq>" = "<command-id>"`, global), `filetypes.<id>.keys.<mode>` (same form, one file type).
  - **Ownership and lifecycle:** read at startup and on `:ConfigReload`.
  - **Invariants:** unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
  - **State flow:** `None`
  - **Shape:** `src/core/config/schema.ts`

## Detailed Code Design

- **`src/core/state/update.ts`**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Change:** Add
  - **Responsibilities:** reducer entry; routes actions to feature reducers.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };

    export const update: Update = (state, action) => {
      switch (action.type) {
        case "key":        return handleKeyAction(state, action.key);   // keymap {mode, filetype} → command, else vim edit
        case "fileChanged":return handleFileChanged(state, action);     // reload | conflict | ignore
        case "indexBatch": return { state: withIndex(state, action.summaries), effects: [] };
        // … one case per Action variant; feature logic lives in feature modules
      }
    };

    export function createStore(initial: AppState, run: (e: Effect) => void) {
      let state = initial; const subs = new Set<(s: AppState) => void>();
      return {
        get: () => state,
        dispatch(action: Action) { const r = update(state, action); state = r.state; r.effects.forEach(run); subs.forEach((f) => f(state)); },
        subscribe(f: (s: AppState) => void) { subs.add(f); return () => subs.delete(f); },
      };
    }
    ```

    `update` routes; `createStore` is the only mutable cell. The switch dispatches on a closed Action union (core protocol, not an extension point); commands extend through the registry instead.

  - **Dependencies:** Action and Effect protocol; CommandRegistry
  - **Callers and wiring:** `app/main.ts` creates the store with `runEffect`; ui and preview subscribe.
  - **Invariants:** pure; no `Date.now()` — time arrives in actions.
  - **Verification:** RM261003ABZP-S11@R1, RM261003ABZP-V15@R2

- **`src/core/kernel/commands/registry.ts`**
  - **Decisions:** RM261003ABZP-DES5@R2
  - **Change:** Add
  - **Responsibilities:** named commands, file-type-scoped keymap trie, which-key and palette data, config overrides.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Command<Ctx = unknown, R = unknown> = {   // generic: the kernel never imports core/state
      id: string;                       // "file.find", "note.today", "link.follow"
      title: string;                    // shown in palette and which-key
      group?: string;                   // which-key group: "find", "note", "buffer"
      filetypes?: readonly string[];    // omitted = every file type; ["markdown"] for link.follow, view.cycle, task.toggle
      run: (ctx: Ctx, args?: string) => R;   // core/state instantiates Ctx = CommandContext, R = { state: AppState; effects: Effect[] }
    };
    export type Mode = "normal" | "insert" | "visual" | "cmdline" | (string & {});   // "explorer", "picker", "base" are declared by their owners
    export type KeyScope = { mode: Mode; filetype?: string };   // filetype omitted = global

    export class CommandRegistry<Ctx, R> { register(cmd: Command<Ctx, R>): void; get(id: string): Command<Ctx, R> | undefined; list(filetype?: string): Command<Ctx, R>[] }

    export class Keymap {
      bind(scope: KeyScope, seq: string, commandId: string): void;   // "<leader>ff", "gd", "<C-o>"
      lookup(scope: KeyScope, pending: Key[]): { kind: "command"; id: string } | { kind: "prefix"; next: WhichKeyItem[] } | { kind: "none" };
      // lookup checks {mode, filetype} first, then {mode}; which-key merges both levels
    }
    ```

    Features call `registry.register` and `keymap.bind` at startup from their own module (`src/core/features/notes/commands.ts`, …); `lang/markdown` binds `gd`, `Enter`, `<leader>m`, `<leader>x` with `filetype: "markdown"`. Which-key reads `lookup(...).next`; the palette reads `list(activeFiletype)`. Config `keys.<mode>` rebinds globally and `filetypes.<id>.keys.<mode>` per file type, both by command id. This mirrors Neovim's buffer-local keymaps set from ftplugins, so `gd` stays free for go-to-definition in code files later.

  - **Dependencies:** None inside the kernel (generic over context and result); `core/state` defines `AppCommand = Command<CommandContext, { state: AppState; effects: Effect[] }>`
  - **Callers and wiring:** `core/state` default registration registers built-ins; `app/main.ts` applies config overrides.
  - **Invariants:** duplicate ids throw at startup; binding an unknown id or file type is a config error, not a crash; running a command whose `filetypes` exclude the active buffer's file type is a no-op with the notice `not available for <type> files`.
  - **Verification:** RM261003ABZP-S3@R1, RM261003ABZP-V4@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/kernel/text/text-buffer.ts` and `src/core/kernel/vim/engine.ts`**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Change:** Add (vim engine redesigned from `alfred/apps/tui/src/view/editor/vim.ts`)
  - **Responsibilities:** buffer primitives; vim grammar `[count]["x][count]operator[count](motion|textobject)`.
  - **Current source:** `alfred/apps/tui/src/view/editor/vim.ts:15-40` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    export type VimMode = "normal" | "insert";
    export type VimEffect = "changed" | "insert-exited" | "toggle-mode" | "leave";
    export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
    ```

    Alfred's engine is pure with effects but supports two modes and a hard-coded pending set.

  - **Proposed shape:**

    ```ts
    export interface TextBuffer {
      readonly version: number; readonly lineCount: number;
      line(i: number): string;
      apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };     // Edit = { range, text }
      slice(range: Range): string;
    }

    export type Motion = (buf: TextBuffer, at: Pos, count: number, ctx: MotionCtx) => { to: Pos; linewise: boolean; inclusive: boolean } | null;
    export type TextObject = (buf: TextBuffer, at: Pos, count: number) => Range | null;
    export const motions: Record<string, Motion>;       // "w","b","e","gg","G","f",… registered by key
    export const textObjects: Record<string, TextObject>; // "iw","a(","ip",…

    export function handleKey(s: BufferVim, key: Key, env: VimEnv): { s: BufferVim; effects: VimEffect[] };
    // VimEffect: { kind:"yank", register, text } | { kind:"changed" } | { kind:"modeChanged", mode } | { kind:"ex", line } | { kind:"search", pattern, dir }
    ```

    The parser accumulates keys into a pending command; when complete it resolves the motion or text object by table lookup, applies the operator, and records an undo block and last-change for `.`. Insert mode collects edits into one undo block until `Esc`.

  - **Dependencies:** TextBuffer; registers in AppState
  - **Callers and wiring:** `update` → `handleKeyAction` → `handleKey` when no keymap binding matches in normal/visual/insert mode.
  - **Invariants:** an operator with a failed motion is a no-op; counts multiply (`2d3w` = `d6w`); undo restores cursor.
  - **Verification:** RM261003ABZP-S2@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1

- **`src/core/lang/markdown/doc.ts`**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Change:** Add (ported from `alfred/apps/tui/src/view/markdown/parse.ts` and `alfred/packages/view-model/src/markdown/obsidian-syntax.ts`)
  - **Responsibilities:** split into blocks, parse each block with micromark + GFM + math + Obsidian extensions, reuse unchanged blocks.
  - **Current source:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` (imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math`)
  - **Current shape:**

    ```ts
    // Alfred parses the whole document per render and post-processes Obsidian syntax with regexes from obsidian-syntax.ts
    export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    ```

    Whole-document parse; Obsidian syntax by regex over text nodes.

  - **Proposed shape:**

    ```ts
    export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; node: MdNode };
    export type Doc = { version: number; frontmatter?: Frontmatter; blocks: Block[] };

    export function splitBlocks(buf: TextBuffer): { startLine: number; endLine: number }[]; // blank-line bounded; fences, frontmatter, $$ kept whole; lists kept whole
    export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;   // reparse only ranges whose hash changed
    export const syntaxExtensions: SyntaxExtension[];             // wikiLink, embed, tag, highlight, comment, callout, blockId — registration point
    ```

    Block-level reparse keeps per-keystroke work proportional to the edited block (`RM261003ABZP-RF7`). Obsidian syntax is applied as mdast transforms registered in `syntaxExtensions`.

  - **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`
  - **Callers and wiring:** registered as the `markdown` file type's `analyze`; `update` runs it after edits; worker `summarize`; preview `renderHtml`.
  - **Invariants:** `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally (cache is transparent).
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2

- **`src/core/kernel/view/text-view.ts` and `src/core/lang/markdown/live-preview.ts`**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Change:** Add (live preview adapted from `alfred/apps/tui/src/view/markdown/layout.ts` and `alfred/apps/tui/src/view/editor/reveal-units.ts`)
  - **Responsibilities:** language-neutral visible-row layout from decorations (kernel); Markdown live preview as a decoration provider with reveal rules and block renderers (lang).
  - **Current source:** `alfred/apps/tui/src/view/editor/reveal-units.ts` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    None — Alfred lays out whole documents for Ink rendering
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    // src/core/kernel/view — knows nothing about Markdown
    export type TextView = { buf: TextBuffer; width: number; topRow: number; rows: number; cursor: Pos; selection?: Range; folds: ReadonlySet<number>; visible: LineRange };
    export type Widget = { type: string; data: unknown; rows: number };            // painted by a UI widget painter
    export type Decoration =
      | { kind: "mark"; range: Range; style: StyleToken }                          // syntax colour, bold, search match
      | { kind: "replace"; range: Range; block: boolean; spans?: Span[]; widget?: Widget } // hidden `**`, rendered table rows
      | { kind: "widget"; at: Pos; block: boolean; widget: Widget }                // image, embed, base view
      | { kind: "line"; line: number; style?: StyleToken; sign?: Sign };           // ▕ reveal sign, ⚠ render error
    export type DecorationProvider<S = unknown> = (v: TextView, analysis: S) => Decoration[]; // visible lines only
    export function layoutText(v: TextView, providers: readonly DecorationProvider[], analysis: unknown): RenderLine[];
    export type TextViewInput = { view: TextView; providers: readonly DecorationProvider[]; analysis: unknown };  // what a text editor view paints
    export interface Highlighter { language: string; highlight(buf: TextBuffer, lines: LineRange): Span[][] }      // kernel-owned; lang/code implements it
    export function highlightMarks(h: Highlighter | undefined): DecorationProvider;                               // Span[][] → mark decorations

    // src/core/lang/markdown/live-preview.ts — one provider among many
    export type PreviewCtx = { isResolved(target: string): boolean; embed(path: string): { doc: Doc } | "loading" | "missing";
                               image(ref: string): { rows: number } | "unknown"; embedMaxRows: number; images: "auto" | "blocks" | "off" };
    export type MarkdownViewInput = { doc: Doc; view: "live" | "reading"; ctx: PreviewCtx };   // built by the Markdown views' `input` hook
    export const livePreview: DecorationProvider<MarkdownViewInput>;   // views "live" and "reading" (reading: no reveal)
    export type BlockRenderer = (block: Block, v: TextView, input: MarkdownViewInput) => Decoration[];
    export const blockRenderers: Partial<Record<BlockKind, BlockRenderer>>;   // heading, list, table, callout, code, embed, base, math, mermaid …
    ```

    Reveal is the provider's rule, not the kernel's: on the cursor's line it emits no inline `replace` decorations; when the cursor is inside a multi-line block (table, callout, code, math, frontmatter) it emits none for that block, so the source shows. `source` view uses only the highlighter's `mark` decorations; a code file gets exactly that path. Rows outside the viewport are never laid out; a per-block row-height cache gives scroll positions.

  - **Dependencies:** Doc model; FileType and Decoration model; theme tokens; `lang/code` highlighter for fenced code; ported math and mermaid text renderers
  - **Callers and wiring:** `ui/editors/text-view.ts` per frame with the active view's providers from the buffer's file type.
  - **Invariants:** `layoutText` with no providers returns raw lines; the source view of Markdown and any code file use the same path; reading view never reveals.
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/filetypes/registry.ts` and `src/core/lang/code/highlight.ts`**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Change:** Add (highlighter adapted from `alfred/apps/tui/src/view/markdown/code-highlight.ts`)
  - **Responsibilities:** file-type contract and lookup; the lowlight-backed highlighter.
  - **Current source:** `alfred/apps/tui/src/view/markdown/code-highlight.ts` (96 lines, `lowlight`; porting reference)
  - **Current shape:**

    ```ts
    None — Alfred highlights fenced code only
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    export type EditorKind = string;                                // "text" and "base" in v1; a notebook registers "notebook" later
    export type ViewSpec<S, I = S, C = unknown> = { id: string; readOnly?: boolean; decorations: readonly DecorationProvider<I>[];
                                       input?: (analysis: S, ctx: C) => I };   // per-frame provider input; default: analysis
    // C is declared by the language (Markdown: PreviewCtx); core/state/view-context.ts builds it from AppState
    // through a builder registered per file type id, so filetypes/ and lang/ never import core/state.
    export type EditorKindSpec<St = unknown> = { id: EditorKind; open(path: string, text: string): St };
    export class EditorKindRegistry { register(spec: EditorKindSpec<any>): void; get(id: EditorKind): EditorKindSpec | undefined }
    // "text" is built in (core/state creates the buffer); "base" is registered by features/bases; a notebook registers later.
    export type FileType<S = unknown> = {
      id: string;                                                   // "markdown", "base", "typescript", "text"
      match: { extensions?: readonly string[]; names?: readonly string[] };   // [".md"], ["Makefile"]
      editor: EditorKind;
      views: readonly ViewSpec<S>[];                                // first = default
      highlighter?: Highlighter;
      analyze?: (buf: TextBuffer, prev?: S) => S;                   // Markdown: parseDoc with block cache
    };
    // `Highlighter` is the kernel type from `src/core/kernel/view/types.ts`

    export class FileTypeRegistry {
      register(ft: FileType<any>): void;                            // duplicate id or extension throws at startup
      forPath(path: string): FileType;                              // extension → file name → `text`
      get(id: string): FileType | undefined;
    }

    // src/core/lang/code/highlight.ts
    export function lowlightHighlighter(language: string): Highlighter;   // highlights from up to 200 lines above
                                                                           // the requested range; cached per buffer version
    ```

    `app/main` registers `text`, `markdown` (`lang/markdown`), `base` (`features/bases`), and code file types (`lang/code`). Tree-sitter can replace lowlight behind `Highlighter` later without changing callers.

  - **Dependencies:** `lowlight`; TextBuffer
  - **Callers and wiring:** `update` (`forPath` on `fileLoaded`; `analyze` after edits); the kernel's `highlightMarks` (`Highlighter` → `mark` decorations); `lang/markdown` fenced code blocks.
  - **Invariants:** registry lookup is deterministic and pure; highlighting is viewport-bounded and never runs the whole file per keystroke; a highlighter error drops to plain text for that range.
  - **Verification:** RM261003ABZP-S12@R1, RM261003ABZP-V18@R1; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/features/links/resolve.ts` and `src/core/features/links/rename.ts`**
  - **Decisions:** RM261003ABZP-DES7@R3
  - **Change:** Add
  - **Responsibilities:** deterministic link resolution; format-preserving rename planning.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function resolveLink(ix: NoteIndex, from: string, raw: string): LinkTarget | { unresolved: string };
    // order: exact root path (with/without .md) → alias → basename candidates ranked by
    //        (same folder as `from`) → (shortest path) → (alphabetical)
    export function planRename(ix: NoteIndex, from: string, to: string, read: (p: string) => string): FileEdit[];
    // keeps link kind (wiki/md), alias, #heading / #^block; writes the shortest unique form of `to`
    ```

  - **Dependencies:** NoteIndex
  - **Callers and wiring:** `link.follow`, completion, backlinks, `file.rename`, `file.move` commands.
  - **Invariants:** resolution is a pure function of index contents; rename never touches text outside link spans.
  - **Verification:** RM261003ABZP-S4@R1, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2

- **`src/workspace/fs.ts` and `src/workspace/watcher.ts`**
  - **Decisions:** RM261003ABZP-DES8@R1, RM261003ABZP-DES17@R1
  - **Change:** Add
  - **Responsibilities:** text reads with binary and size checks; atomic writes and directory watching with own-write suppression.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export async function readTextFile(path: string): Promise<TextFile | { refused: "binary" | "tooLarge" }> {
      const file = Bun.file(path);
      if (file.size > 16 * 1024 * 1024) return { refused: "tooLarge" };
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.subarray(0, 8192).includes(0)) return { refused: "binary" };
      let text: string;
      try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); } catch { return { refused: "binary" }; }
      const bom = text.startsWith("\uFEFF");
      return { text: bom ? text.slice(1) : text, bom, eol: text.includes("\r\n") ? "\r\n" : "\n", stamp: stampOf(path, text) };
    }
    export async function atomicWrite(path: string, text: string): Promise<Stamp> {   // text already has BOM + EOL restored
      const target = await realpathOrSelf(path);
      const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
      const fd = await open(tmp, "w", await modeOr(target, 0o644));
      try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp, target);                     // same directory → atomic on POSIX
      return stampOf(target, text);                  // { mtimeMs, size, hash }
    }
    export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
    // fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
    ```

  - **Dependencies:** `node:fs/promises`, `node:fs` (Bun-compatible)
  - **Callers and wiring:** effect runner for `read`, `write`, `create`, `rename`, `move`; `main` starts the watcher.
  - **Invariants:** temp files never appear in the index (prefix `.` is hidden); a failed write deletes its temp file.
  - **Verification:** RM261003ABZP-S1@R1, RM261003ABZP-V1@R1; RM261003ABZP-S12@R1, RM261003ABZP-V18@R1

- **`src/ui/editors/text-view.ts`, `src/ui/widgets/registry.ts`, and `src/ui/input.ts`**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Change:** Add
  - **Responsibilities:** paint RenderLine rows onto an OpenTUI buffer; paint widgets through painters keyed by widget type; pick the view for a window's editor kind; normalize input.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    // Only file family allowed to import @opentui/*
    export class EditorView extends Renderable {           // custom renderable, not Textarea
      constructor(ctx: RenderContext, private getView: () => TextViewInput) { super(ctx, { flexGrow: 1 }); }
      protected renderSelf(buf: OptimizedBuffer) {
        const { view, providers, analysis } = this.getView();
        for (const [row, line] of layoutText(view, providers, analysis).entries()) paintLine(buf, row, line, theme, widgetPainters);
      }
    }
    export const editorViews = new Map<EditorKind, (ctx: RenderContext, win: WindowId) => Renderable>();  // registered: text → EditorView, base → BaseView
    export function registerEditorView(kind: EditorKind, view: (ctx: RenderContext, win: WindowId) => Renderable): void;
    export const widgetPainters: Record<string, WidgetPainter>;                                        // image, embed, base, rule
    export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via escTimeoutMs
    ```

    Exact OpenTUI buffer and image APIs are confirmed against the pinned version in the first delivery item (the class above is illustrative).

  - **Dependencies:** `@opentui/core` (exact pin)
  - **Callers and wiring:** `ui/shell.ts` composes views; store subscription triggers `requestRender()`.
  - **Invariants:** UI never mutates AppState; all input becomes Actions.
  - **Verification:** RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V17@R1

- **`src/preview/server.ts`**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Change:** Add
  - **Responsibilities:** read-only preview server.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function startPreview(store: Store, root: string): { port: number; stop(): void } {
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0,
        fetch(req) {
          const host = req.headers.get("host");
          if (host !== `127.0.0.1:${server.port}` && host !== `localhost:${server.port}`) return new Response(null, { status: 403 });
          return route(req, store, root);              // "/", "/events", "/render", "/file/*"
        },
      });
      return { port: server.port, stop: () => server.stop(true) };
    }
    ```

  - **Dependencies:** `Bun.serve`; core `renderHtml`
  - **Callers and wiring:** effect runner for `startPreview`/`stopPreview`.
  - **Invariants:** no write routes; `/file/*` passes realpath containment and hidden-folder exclusion.
  - **Verification:** RM261003ABZP-S8@R1, RM261003ABZP-V11@R3

## Cross-cutting and Evolution

| Concern | Mechanism and canonical design location | Verification or reason not applicable |
|---|---|---|
| Security and privacy | No network except loopback preview with Host allowlist and realpath containment (RM261003ABZP-DES13@R2); config is data (TOML), never executed (RM261003ABZP-DES14@R1); no telemetry; notes never logged | RM261003ABZP-V11@R3 |
| Configuration and observability | XDG TOML config validated by schema; errors as notifications; `so --version`; `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content (RM261003ABZP-DES14@R1) | RM261003ABZP-V4@R2 |
| Performance and scalability | Viewport-only layout, block parse cache, worker index and search, frame coalescing, lazy image decode with cache (RM261003ABZP-DES16@R1) | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| Concurrency, retry, and idempotency | Single-threaded store; worker communicates by messages; saves serialized per path; autosave retry with backoff; own-write stamps make watcher events idempotent (RM261003ABZP-DES8@R1) | RM261003ABZP-V1@R1 |
| Migration and backfill | None — greenfield; Obsidian files are read as-is and written in place | None — no prior data format |
| Mixed-version compatibility | Obsidian file compatibility (Markdown, links, frontmatter, `.base`); Kanban `type` constant isolated in `core/features/bases/types.ts` and verified against an Obsidian-saved file (RM261003ABZP-DES12@R2) | RM261003ABZP-V10@R1 |
| Rollout and rollback | SemVer releases via release-please; users roll back by installing a previous release binary (RM261003ABZP-DES15@R1) | RM261003ABZP-V14@R1 |
| Known extension needs | Registries: commands and file-type-scoped keymaps (DES5), syntax extensions (DES6), block renderers and decoration providers (DES9), editor-kind views and widget painters (DES10), Bases view types (DES12), file types and highlighters (DES17) — RM261003ABZP-REQ11@R3 | RM261003ABZP-V16@R2 |
| Evolution toward code editing and notebooks | Kernel boundary (DES1) keeps editing language-neutral; future work adds registrations only: an LSP client is a workspace adapter whose results become `mark`/`line` decorations and file-type commands (`gd` → definition); tree-sitter replaces lowlight behind `Highlighter`; a notebook is a new editor kind whose cells each hold a `TextBuffer`. None of these is built in v1 (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3 deferrals) | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V18@R1 |

- **System transition:**

```text
empty repo → scaffold (tooling, CI, boundary test, shell) → editor usable → knowledge features → release binaries
                                  └→ rollback: previous release binary; files are plain Markdown, no state migration
```

- **Delivery constraints:** the boundary test and CI exist before feature code so violations never land; the OpenTUI paint and image APIs are confirmed against the pinned version before live-preview work depends on them; the Kanban `type` value is confirmed before Kanban ships.

## Success and Verification

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** This document
  - **Outcome:** across crash, external edit, and save failure scenarios, the file on disk is always a complete old or new version and dirty buffers are never overwritten without a prompt.
  - **Requirements:** RM261003ABZP-REQ1@R3
  - **Design:** RM261003ABZP-DES8@R1 - atomic write, own-write suppression, conflict rules
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S1@R1
      - **Scenario:** in a temp workspace: (a) kill the writer between write and rename (simulated by throwing after fsync); (b) modify an open clean file externally; (c) modify an open dirty file externally; (d) save `so`'s own buffer.
      - **Expected result:** (a) original content intact, no temp file left; (b) buffer reloads and `u` restores previous text; (c) conflict prompt appears, file and buffer unchanged until chosen; (d) no reload or conflict triggered.
      - **Method and target:** integration test on `workspace/fs.ts`, `workspace/watcher.ts`, and `core` conflict reducer
      - **Environment:** real file system (tmpdir), real `fs.watch`
      - **Unique risk:** per-file watch losing events after rename; self-triggered reload loops; partial writes.
      - **Predecessors:** None

- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** This document
  - **Outcome:** every command listed in RM261003ABZP-REQ2@R2 produces Neovim's result on the shared fixture cases.
  - **Requirements:** RM261003ABZP-REQ2@R2
  - **Design:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 - grammar, undo blocks, dot-repeat
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** table of `{ before text + cursor, keys, after text + cursor + register }` cases covering each motion, operator, text object, count, register, search, `:s`, undo/redo, and `.`; expected values recorded from Neovim 0.11 `--clean`.
      - **Expected result:** each case matches exactly.
      - **Method and target:** unit tests on `core/kernel/vim/engine.ts` `handleKey`
      - **Environment:** None — pure functions
      - **Unique risk:** subtle divergence (inclusive/exclusive motions, linewise yanks, cursor after undo).
      - **Predecessors:** None
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** feed a lone `\x1b` byte without kitty protocol, then `\x1b[A`, through `ui/input.normalizeKey` with `escTimeoutMs=50`.
      - **Expected result:** lone Esc yields `escape` after 50 ms ± 10 ms; the sequence yields `up` immediately.
      - **Method and target:** unit test on `ui/input.ts`
      - **Environment:** fake timers
      - **Unique risk:** Esc swallowed or arrow keys misread as Esc + letters.
      - **Predecessors:** None

- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** This document
  - **Outcome:** every command is reachable by name in the palette, leader sequences show which-key hints, pickers filter fuzzily, and config overrides apply or fail safely.
  - **Requirements:** RM261003ABZP-REQ3@R4
  - **Design:** RM261003ABZP-DES5@R2, RM261003ABZP-DES14@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V4@R2 — Keymap, which-key, palette, file-type scope, and config**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S3@R1
      - **Scenario:** (a) press `Space` and wait; (b) bind `"<leader>w" = "file.save"` in config and press it; (c) load a config with a syntax error on line 7; (d) set `XDG_CONFIG_HOME=relative/path`; (e) open the palette and type `back`; (f) bind `[filetypes.markdown.keys.normal] "<leader>w" = "link.backlinks"` alongside (b), press `<leader>w` in a note and in `sync.ts`; (g) press `gd` on `[[plan]]` in a note and on an identifier in `sync.ts`; (h) open the palette in `sync.ts` and type `follow`; (i) in `sync.ts`, run `:link.follow`.
      - **Expected result:** (a) which-key lists groups; (b) file saved; (c) notification names `config.toml:7` and defaults apply; (d) `~/.config/so/config.toml` used; (e) `link.backlinks` ranks first; (f) the note opens its backlinks, `sync.ts` saves; (g) the note follows the link, `sync.ts` does nothing; (h) `link.follow` is not listed; (i) the message line shows `not available for typescript files` and nothing changes.
      - **Method and target:** unit tests on `core/kernel/commands`, `workspace/config-file.ts`; component test through the OpenTUI test renderer for (a)
      - **Environment:** tmp config dirs; OpenTUI test renderer
      - **Unique risk:** config error crashing startup; overrides silently ignored; note keys leaking into other file types.
      - **Predecessors:** RM261003ABZP-V4@R1

- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** This document
  - **Outcome:** link following, completion, backlinks, and tags match the index; rename updates every reference while preserving format.
  - **Requirements:** RM261003ABZP-REQ4@R3
  - **Design:** RM261003ABZP-DES7@R3
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** workspace with `a/plan.md`, `b/plan.md`, `plan-x.md` (alias `plan`), `c/deep/plan.md`; resolve `[[plan]]` from `a/x.md`, from `root.md`, `[[b/plan]]`, `[[plan.md]]`, `[[note#H1#H2]]`, `[text](a/plan%20x.md)`.
      - **Expected result:** results follow the documented order exactly.
      - **Method and target:** unit tests on `core/features/links/resolve.ts`
      - **Environment:** None — in-memory index
      - **Unique risk:** nondeterministic or Obsidian-incompatible targets.
      - **Predecessors:** None
    - **RM261003ABZP-V6@R2 — Rename and link-mention preserve link formats**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** (a) rename `plan.md` → `projects/roadmap.md` with references `[[plan]]`, `[[plan|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)`, frontmatter `related: "[[plan]]"`, and an open dirty buffer containing `[[plan]]`; (b) run `link.linkMention` on an unlinked mention "Plan" of `plan.md` in an open dirty buffer and in a closed file.
      - **Expected result:** (a) all rewritten in place with kind, alias, subpath preserved and shortest unique path; the dirty buffer is edited in memory (not overwritten on disk); notification reports the file count. (b) only the mention span becomes `[[plan|Plan]]` (or `[[plan]]` when the text equals the basename); the open buffer is edited in memory and marked dirty; the closed file is written through the atomic write path; the mention moves from unlinked to linked in the backlinks result.
      - **Method and target:** unit tests on `planRename` and the mention span edit + integration test of the rename and `link.linkMention` commands
      - **Environment:** tmp workspace
      - **Unique risk:** broken links or clobbered unsaved edits.
      - **Predecessors:** RM261003ABZP-V6@R1

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** This document
  - **Outcome:** each element listed in RM261003ABZP-REQ5@R2 renders as specified, reveal follows the cursor line or block, and images use the best available protocol.
  - **Requirements:** RM261003ABZP-REQ5@R2
  - **Design:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V7@R2 — Layout golden tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** `test/fixtures/tour.md` (every element) laid out by `layoutText` with the Markdown `livePreview` provider at widths 60 and 100 with the cursor outside any block, on a bold line, inside a table, inside a callout; the same note in `source` view.
      - **Expected result:** `RenderLine[]` serialized to text + style tokens matches committed goldens.
      - **Method and target:** unit tests on `layoutText` + `lang/markdown/live-preview.ts`
      - **Environment:** None — pure
      - **Unique risk:** reveal or hiding regressions; broken table alignment; Markdown logic leaking into the kernel view.
      - **Predecessors:** RM261003ABZP-V7@R1
    - **RM261003ABZP-V8@R1 — Image protocol selection**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** render a note with a PNG in the OpenTUI test renderer with capabilities kitty / sixel / none / `images="off"`.
      - **Expected result:** kitty or sixel placement, block characters, or `[image: name.png]` placeholder respectively.
      - **Method and target:** component test on `ui/editors/text-view.ts` and the `image` widget painter
      - **Environment:** OpenTUI test renderer with mocked capabilities
      - **Unique risk:** images breaking layout or crashing on unsupported terminals.
      - **Predecessors:** None

- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** This document
  - **Outcome:** `:Today` and template insertion produce the same text Obsidian's core plugins would for the supported tokens.
  - **Requirements:** RM261003ABZP-REQ6@R2
  - **Design:** RM261003ABZP-DES11@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S6@R1
      - **Scenario:** format 2026-10-03T09:05 with every supported token and `[literal]`; expand a template containing all variables; compute daily paths for `YYYY-MM-DD` and `YYYY/MM/YYYY-MM-DD`; run `:Today` twice.
      - **Expected result:** strings equal Moment.js output for the same tokens; unsupported tokens stay literal; second `:Today` opens the existing file without changing it.
      - **Method and target:** unit tests on `core/time`, `core/features/notes`; integration test for `:Today`
      - **Environment:** fixed clock; tmp workspace
      - **Unique risk:** wrong dates, overwritten daily notes.
      - **Predecessors:** None

- **RM261003ABZP-S7@R1 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** This document
  - **Outcome:** table and Kanban views show the correct rows, edits write valid frontmatter, and unsupported layouts fall back safely.
  - **Requirements:** RM261003ABZP-REQ7@R2
  - **Design:** RM261003ABZP-DES12@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V10@R1 — Bases evaluation, edit, and compatibility**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S7@R1
      - **Scenario:** fixtures ported from Alfred's Bases tests plus a Kanban `.base` saved by Obsidian 1.14+; edit a cell; move a card; open a `cards` view; group by a formula.
      - **Expected result:** rows and order match fixtures; frontmatter patched with comments and order preserved; card move sets the property; `cards` opens as table with notice; moving is disabled for formula grouping.
      - **Method and target:** unit tests on `core/features/bases`; integration test of write-back
      - **Environment:** tmp workspace
      - **Unique risk:** YAML corruption; Kanban type mismatch with Obsidian.
      - **Predecessors:** None

- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** This document
  - **Outcome:** the browser follows edits within 300 ms and the server rejects foreign hosts and out-of-workspace paths.
  - **Requirements:** RM261003ABZP-REQ8@R2
  - **Design:** RM261003ABZP-DES13@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V11@R3 — Preview server behavior and safety**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S8@R1
      - **Scenario:** start preview; request with Host `evil.test:<port>`; request `/file/..%2f..%2fetc/passwd`; request a symlink pointing outside; request `/file/.git/config`; dispatch an edit and measure time to the SSE event; switch the active buffer to `scripts/sync.ts`; with an SSE client connected, run `:PreviewStop`; with `sync.ts` active, run `:Preview`.
      - **Expected result:** 403; 404; 404; 404; SSE `doc` event < 300 ms after the edit; no `doc` event for the switch to `sync.ts`, and `/render` still returns the last note; the client receives a `stopped` event before the connection closes and the port stops accepting connections; `:Preview` from `sync.ts` shows `not available for typescript files` and starts no server; server bound only to 127.0.0.1.
      - **Method and target:** integration test on `preview/server.ts`
      - **Environment:** real `Bun.serve`, tmp workspace with symlink
      - **Unique risk:** DNS rebinding, traversal, network exposure.
      - **Predecessors:** RM261003ABZP-V11@R1, RM261003ABZP-V11@R2

- **RM261003ABZP-S9@R1 — Performance targets hold**
  - **Definition:** This document
  - **Outcome:** the targets in RM261003ABZP-REQ9@R2 are met on the reference machine and gated at 2× in CI.
  - **Requirements:** RM261003ABZP-REQ9@R2
  - **Design:** RM261003ABZP-DES16@R1, RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES7@R3, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V12@R2 — Keystroke and open-file benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** open the 5,000-line fixture note in live preview, and the 5,000-line TypeScript fixture in source view with highlighting, in the OpenTUI test renderer (120×40); send 200 mixed keystrokes (`j`, `w`, `i` + text + `Esc`, `dd`, `u`) to each; measure input → frame complete; measure open time; scroll each file for 2 s with held `j` and repeated `Ctrl-d`/`Ctrl-u` and record frame times with the in-process frame metrics (`RM261003ABZP-RF2`).
      - **Expected result:** for both files, p95 < 16 ms and open < 50 ms on the reference machine; scrolling frame time p95 < 16.7 ms (60 fps); CI median of 5 runs < 32 ms, < 100 ms, and < 33.4 ms.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** OpenTUI test renderer; fixed CI runner type
      - **Unique risk:** full-document parse, layout, or highlighting sneaking into the keystroke path.
      - **Predecessors:** RM261003ABZP-V12@R1
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** generate a 10,000-note workspace; start `so`; record time to first interactive frame and to index ready; type during indexing.
      - **Expected result:** first frame < 200 ms; index ready < 3 s; keystrokes during indexing still meet the V12 budget.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** generated fixture; real worker
      - **Unique risk:** indexing blocking the main thread.
      - **Predecessors:** None

- **RM261003ABZP-S10@R1 — Development, CI, and release are fast and automatic**
  - **Definition:** This document
  - **Outcome:** `bun run check` < 30 s; CI < 3 min; release produces four checksummed binaries that start.
  - **Requirements:** RM261003ABZP-REQ10@R2
  - **Design:** RM261003ABZP-DES15@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V14@R1 — Check timing, CI timing, and release dry run**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S10@R1
      - **Scenario:** time `bun run check` locally; read CI run durations; run the release workflow on a pre-release tag.
      - **Expected result:** < 30 s; < 3 min; GitHub Release with 4 binaries + `SHA256SUMS`; smoke jobs print `so <version>` on macOS and Linux.
      - **Method and target:** non-test check on CI and release workflows
      - **Environment:** GitHub Actions
      - **Unique risk:** slow feedback loops; binaries missing OpenTUI's native library.
      - **Predecessors:** None

- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored**
  - **Definition:** This document
  - **Outcome:** boundary violations fail CI; features extend by registration; terminal state is restored on every exit path; standards are followed.
  - **Requirements:** RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V15@R2 — Import boundary test**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** scan every `src/**/*.ts` with `Bun.Transpiler.scanImports`; include two deliberate violation fixtures: a core file importing `node:fs`, and a `src/core/kernel/**` file importing `src/core/lang/markdown`.
      - **Expected result:** core imports only core and allowed parsing packages; only `src/ui/**` imports `@opentui/*`; `src/core/kernel/**` imports only `src/core/kernel/**`; both fixtures fail.
      - **Method and target:** `test/boundaries.test.ts`
      - **Environment:** None
      - **Unique risk:** layering eroding silently; Markdown assumptions creeping into the kernel.
      - **Predecessors:** RM261003ABZP-V15@R1
    - **RM261003ABZP-V16@R2 — Registration-only extension**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** a test module registers a command, a keymap, a syntax extension, and a block renderer; a second test module registers a `csv` file type with a highlighter, a decoration provider, and a `csv`-scoped keymap; a third registers an editor kind `grid`, a `.grid` file type using it, and a UI view for it — none touches other modules.
      - **Expected result:** the command runs from the palette and keymap; the syntax renders through the renderer; opening `data.csv` uses the `csv` file type, its highlighter marks, its decorations, and its key binding; opening `t.grid` creates window content `{editor: "grid"}` and the shell paints the registered view, with no edit to dispatch code.
      - **Method and target:** unit test across `core/kernel/commands`, `core/filetypes`, `core/lang/markdown`, `core/kernel/view`; component test for `ui/editors` registration
      - **Environment:** None
      - **Unique risk:** hidden switch statements that require edits to extend.
      - **Predecessors:** RM261003ABZP-V16@R1
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** in a PTY, start `so`, then exit by `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception; set `NO_COLOR=1` in one run.
      - **Expected result:** after each exit the PTY is back on the main screen with cursor visible, mouse and kitty keyboard modes off; the `NO_COLOR` run emits no colour SGR codes.
      - **Method and target:** e2e PTY test in `test/e2e/`
      - **Environment:** real PTY (`Bun.spawn` with a pseudo-terminal), headless terminal emulator to read state
      - **Unique risk:** leaving the user's terminal broken.
      - **Predecessors:** None

- **RM261003ABZP-S12@R1 — Any text file opens safely on a language-neutral core**
  - **Definition:** This document
  - **Outcome:** non-Markdown UTF-8 files open in source view with highlighting where recognized, binary and oversized files are refused without writes, and saves keep the file's BOM and line endings. Keeping note-only keys and commands out of other file types is part of RM261003ABZP-S3@R1 (RM261003ABZP-V4@R2).
  - **Requirements:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V18@R1 — Open text, code, binary, and oversized files**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S12@R1
      - **Scenario:** in a tmp workspace: (a) `:e scripts/sync.ts`, `:e config.yaml`, `:e notes.txt`, `:e Makefile`; (b) `:e photo.png` and a file with a NUL byte at offset 100; (c) a file containing invalid UTF-8; (d) a generated 17 MiB text file; (e) edit and save a CRLF file with a UTF-8 BOM.
      - **Expected result:** (a) each opens in source view; `.ts` and `.yaml` lines carry highlighter style tokens, `notes.txt` resolves to `text` and `Makefile` resolves to `makefile` by file name; (b, c) `binary file — not opened`, no buffer created; (d) `file too large — not opened (limit 16 MiB)`; (e) the saved bytes keep the BOM and every `\r\n`.
      - **Method and target:** unit tests on `core/filetypes` and `workspace/fs.readTextFile`; integration test of open and save through the store
      - **Environment:** tmp workspace; real file system
      - **Unique risk:** binary files corrupted by a text save; file-type mismatch; BOM or line endings lost on save.
      - **Predecessors:** None

## Design Decisions and Traceability

- **RM261003ABZP-DES1@R2 — One process, one package, four layers, and a language-neutral kernel, with a tested import boundary**
  - **Requirements:** RM261003ABZP-REQ11@R3 - pure core, enforced boundaries, language-neutral kernel; RM261003ABZP-REQ10@R2 - fast checks
  - **Decision:** `src/core` (pure), `src/workspace` (I/O), `src/ui` (OpenTUI), `src/preview` (HTTP), wired only in `src/app`. Inside the core, `kernel/` (text, editor, vim, commands, view) imports only `kernel/`; `filetypes/`, `lang/`, and `features/` build on it; `state/` and `config/` compose everything. A `bun test` boundary test using `Bun.Transpiler.scanImports` enforces both the layer rules and the kernel rule.
  - **Explanation:** System Architecture diagram; Project Structure; `test/boundaries.test.ts`. One package keeps install and CI fast; the test needs no TypeScript API (`RM261003ABZP-RF13`). The kernel rule is what keeps `so` able to become a code or notebook editor: Markdown cannot leak into editing, and a new language is a new folder plus registrations.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred needed six packages because of its kernel; `so` has no server boundary. `rm261003abzp-roadmap-context.md@R2` - scope change: leave room for code editing and notebooks.
  - **Research:** `RM261003ABZP-RF1` - contain OpenTUI to the UI layer; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3). `RM261003ABZP-RF13` - avoid TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** folder conventions rather than package boundaries; rejected a Turborepo monorepo (slower, more config) and dependency-cruiser (TS 7 issue). Rejected separate `editor-core` and `markdown` packages: same isolation as the kernel rule but with workspace and build overhead.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-DES1@R1

- **RM261003ABZP-DES2@R2 — One store with a pure reducer and data-only effects**
  - **Requirements:** RM261003ABZP-REQ11@R3 - stable, testable foundations; RM261003ABZP-REQ1@R3 - autosave and conflicts; RM261003ABZP-REQ9@R2 - predictable rendering
  - **Decision:** `update(state, action) → { state, effects }`; effects are plain data executed by `app/effects.ts`; results return as actions.
  - **Explanation:** Action and Effect protocol; AppState; `src/core/state/update.ts`. Every behavior (autosave timing, conflict choice, rename) is a pure function test.
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts` - Alfred's vim core already returns effects instead of performing them.
  - **Research:** None
  - **Tradeoffs:** an extra indirection for I/O; rejected UI components holding state (hard to test, the Ink/React pattern Alfred needed a compositor around).
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** RM261003ABZP-DES2@R1

- **RM261003ABZP-DES3@R1 — Line-array TextBuffer behind an interface, with vim undo blocks**
  - **Requirements:** RM261003ABZP-REQ2@R2 - undo per undo block; RM261003ABZP-REQ9@R2 - 5,000-line target
  - **Decision:** immutable line array with structural sharing; `apply(edit)` returns an inverse; undo stack of blocks (one Normal command or one Insert session).
  - **Explanation:** TextBuffer model; `src/core/kernel/text/text-buffer.ts`. A piece table can replace the implementation without changing callers.
  - **Evidence:** `alfred/apps/tui/src/view/editor/text-buffer.ts` - single-string buffer (186 lines) as reference.
  - **Research:** `RM261003ABZP-RF6` - line array adequate at ≤ 5,000 lines; undo block = typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** O(lines) splices on huge files; rejected OpenTUI's native `EditBuffer` as source of truth (couples core to a 0.x UI library).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES4@R1 — Table-driven vim engine**
  - **Requirements:** RM261003ABZP-REQ2@R2 - core vim command set, Esc timeout
  - **Decision:** a pure key-sequence parser for `[count]["reg][count]op[count](motion|textobject)` with motion, operator, and text-object tables; mode machine (normal, insert, visual char/line, cmdline); last-change record for `.`; ex command table.
  - **Explanation:** `src/core/kernel/vim/engine.ts`; Esc timeout handled in `ui/input.ts` (RM261003ABZP-DES10@R2).
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts:15` - Alfred supports only two modes with a hard-coded pending set.
  - **Research:** `RM261003ABZP-RF5` - kitty keyboard protocol, 50 ms timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** no macros or Visual block in v1 (deferred); rejected embedding Neovim (user decision).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES5@R2 — Command registry and file-type-scoped keymap trie as the single extension point for actions**
  - **Requirements:** RM261003ABZP-REQ3@R4 - leader, which-key, palette, config, file-type scope; RM261003ABZP-REQ11@R3 - extend by registration
  - **Decision:** every action is a named `Command`, optionally limited to file types; keys map to command ids through a trie keyed by `{mode, filetype?}`, with the file-type level checked before the global level; which-key, palette, help, and config overrides (`keys.<mode>`, `filetypes.<id>.keys.<mode>`) read the same registry. Note keys (`gd`, `Enter` on links, `<leader>m`, `<leader>x`) are bound for `markdown` only.
  - **Explanation:** `src/core/kernel/commands/registry.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input - LazyVim style; `rm261003abzp-roadmap-context.md@R2` - keymaps scoped by mode and file type.
  - **Research:** None
  - **Tradeoffs:** commands must be pure (state + effects), which forbids quick ad-hoc I/O in commands; accepted for testability. Rejected VS Code-style `when` expressions: a file-type scope covers v1 and the known code-editor need with far less machinery.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** RM261003ABZP-DES5@R1

- **RM261003ABZP-DES6@R1 — micromark/mdast with Obsidian extensions and block-level reparse**
  - **Requirements:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2
  - **Decision:** port Alfred's micromark + GFM + math parsing and Obsidian syntax into `core/lang/markdown` as the `markdown` file type's `analyze`; split into blocks and reparse only changed blocks; one `Doc` feeds layout, index, and HTML.
  - **Explanation:** Doc model; `src/core/lang/markdown/doc.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` - existing micromark pipeline.
  - **Research:** `RM261003ABZP-RF7` - micromark conformant but not incremental; block reparse meets budgets; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block splitting must handle lists, fences, and frontmatter carefully; rejected OpenTUI's tree-sitter Markdown (UI-layer dependency, no Obsidian syntax) and Lezer (skips link reference validation; another parser to learn).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES7@R3 — Worker-built in-memory index with a documented resolution rule**
  - **Requirements:** RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename; RM261003ABZP-REQ3@R4 - pickers and full-text search; RM261003ABZP-REQ9@R2 - non-blocking index
  - **Decision:** a Bun `Worker` lists every non-excluded workspace file, summarizes Markdown notes, and answers full-text queries over Markdown notes and other text files that pass the REQ1 text checks; the main thread holds `NoteIndex` (summaries plus the file list) under `core/features/links`; resolution order: root path → alias → basename ranked by same folder, shortest path, alphabetical; `planRename` rewrites link spans only; `link.linkMention` wraps one unlinked mention in `[[…]]` in its source note through a span edit (open buffer in memory, closed file via `write`).
  - **Explanation:** NoteSummary and NoteIndex; `resolve.ts`; `rename.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred used SQLite; `so` has no persistence need for the index.
  - **Research:** `RM261003ABZP-RF8` - duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Tradeoffs:** reindex on every start (< 3 s target); searching all text files reads more bytes than notes alone, bounded by `.gitignore` exclusion and the 16 MiB per-file limit; rejected SQLite (persistence and schema cost without need) and ripgrep (external binary).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES7@R1, RM261003ABZP-DES7@R2

- **RM261003ABZP-DES8@R1 — Atomic saves, directory watching, own-write stamps, and trash adapters**
  - **Requirements:** RM261003ABZP-REQ1@R3 - safe file management
  - **Decision:** `atomicWrite` (realpath → same-dir temp → fsync → chmod → rename); `fs.watch(root, {recursive:true})` with per-path debounce and own-write stamps; trash via freedesktop spec on Linux and Finder automation (`osascript`) on macOS, else typed confirmation; autosave policy and conflict rules live in core.
  - **Explanation:** `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow.
  - **Evidence:** `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - autosave queue reference.
  - **Research:** `RM261003ABZP-RF11` - fsync, same directory, directory watching, undoable reload; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (current RM261003ABZP-REQ1@R3)
  - **Tradeoffs:** rename-based saves replace hard links (acceptable for notes); recursive `fs.watch` relies on platform support in Bun on macOS and Linux — verified in the first delivery item.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** None

- **RM261003ABZP-DES9@R3 — Viewport-only text view with decorations; Markdown live preview as a decoration provider**
  - **Requirements:** RM261003ABZP-REQ5@R2 - live preview; RM261003ABZP-REQ9@R2 - smooth scrolling; RM261003ABZP-REQ11@R3 - language-neutral kernel, registered decoration providers
  - **Decision:** the kernel's pure `layoutText` produces `RenderLine[]` for visible rows only from text plus decorations (`mark`, `replace`, `widget`, `line`) returned by the view's providers and the file type's highlighter. Markdown live preview is the `livePreview` provider in `lang/markdown`: the cursor line reveals inline syntax, a cursor inside a multi-line block reveals the whole block, folded callouts and expanded embeds follow the window's `folds` set, block renderers are registered per block kind, and widgets (image, embed, base) reserve rows. Source view uses highlighter marks only — the same path code files use. The live-preview input (`MarkdownViewInput`: the `Doc` plus a read-only `PreviewCtx`) comes from the Markdown views' `input` hook, so neither the kernel nor the UI knows about Markdown.
  - **Explanation:** FileType and Decoration model; RenderLine model; `src/core/kernel/view/text-view.ts`; `src/core/lang/markdown/live-preview.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/editor/reveal-units.ts` - reveal units reference. Industry precedent: CodeMirror 6 decorations (the basis of Obsidian's live preview), Neovim extmarks and conceal, VS Code decorations.
  - **Research:** `RM261003ABZP-RF7` - per-element reveal in Obsidian; block reveal for multi-line constructs; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal; one decoration list per frame instead of direct painting, accepted because it is bounded by visible lines; rejected OpenTUI `MarkdownRenderable` conceal (UI-owned parsing, no Obsidian syntax) and a Markdown-specific `layoutViewport` (would make every future language reimplement layout).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES9@R1, RM261003ABZP-DES9@R2

- **RM261003ABZP-DES10@R2 — OpenTUI shell with editor-kind views, widget painters, normalized input, and guaranteed terminal restore**
  - **Requirements:** RM261003ABZP-REQ2@R2 - Esc, cursor shape; RM261003ABZP-REQ3@R4 - explorer, overlays; RM261003ABZP-REQ5@R2 - images; RM261003ABZP-REQ7@R2 - Bases views; RM261003ABZP-REQ11@R3 - restore, `NO_COLOR`, terminal support, registration
  - **Decision:** `@opentui/core` pinned exactly; layout of explorer, bufferline, window splits, side panel, statusline, cmdline, overlays; each window renders through the view registered for its editor kind (`text` → custom `EditorView` renderable painting `RenderLine[]`; `base` → Bases view); widgets are painted by painters registered per widget type (`image` via OpenTUI's auto protocol kitty → sixel → blocks, `embed`, `base`, `rule`); input normalized to `Key` with kitty keyboard protocol and Esc timeout; theme tokens with `NO_COLOR`; restore on exit, signals, and uncaught errors.
  - **Explanation:** `src/ui/*`; `src/ui/editors/`; `src/ui/widgets/`.
  - **Evidence:** `alfred/apps/tui/src/terminal/shutdown.ts` - restore coordinator reference; Context7 `/anomalyco/opentui`.
  - **Research:** `RM261003ABZP-RF1`, `RM261003ABZP-RF2`, `RM261003ABZP-RF4`, `RM261003ABZP-RF5`; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** dependence on a 0.x library contained to `src/ui`; rejected Ink (React redraw cost) and a custom renderer (upfront cost). A notebook later adds one editor view; no shell change.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES9@R3
  - **Predecessors:** RM261003ABZP-DES10@R1

- **RM261003ABZP-DES11@R1 — Shared Moment-subset formatter, pure template expansion, and daily-note commands**
  - **Requirements:** RM261003ABZP-REQ6@R2 - daily notes and templates; RM261003ABZP-REQ7@R2 - Bases date formatting
  - **Decision:** `core/time/format.ts` implements the documented token subset and `[literal]`; `core/features/notes` computes daily paths (with `/` subfolders) and expands `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}`; commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`.
  - **Explanation:** `src/core/time/format.ts`; `src/core/features/notes/*`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input.
  - **Research:** `RM261003ABZP-RF10` - Moment tokens, `{{time:FORMAT}}`, subfolders; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Tradeoffs:** rare tokens unsupported (kept literal); rejected Moment.js and Day.js dependencies (maintenance mode; extra weight).
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** None

- **RM261003ABZP-DES12@R2 — Ported Bases engine as a registered `base` editor kind, with table and Kanban view models and YAML-preserving write-back**
  - **Requirements:** RM261003ABZP-REQ7@R2 - Bases table and Kanban views; RM261003ABZP-REQ11@R3 - editor kinds by registration
  - **Decision:** port `alfred/packages/vault/src/domain/bases/*` (parser, evaluator, expression, yaml-patcher) and `alfred/packages/view-model/src/base/*` row and board rules into `core/features/bases`; `.base` is registered as file type `base` with editor kind `base`, so opening it puts `{editor:"base", path, view, cursor}` in the window; view models `TableModel` and `KanbanModel`; unknown layouts map to `TableModel` with a notice; the Kanban `type` string is one constant verified against an Obsidian 1.14+ file; edits become `write` effects through the atomic save path; embeds render through a `base` block renderer and `base` widget painter.
  - **Explanation:** `src/core/features/bases/*`; `src/ui/editors/` Bases view.
  - **Evidence:** `alfred/packages/vault/src/domain/bases/parser.ts:19`, `evaluator.ts:164` - no file-system or Bun imports (context assumption).
  - **Research:** `RM261003ABZP-RF9` - layouts, Kanban rules; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - **Tradeoffs:** follows an early-access Obsidian layout; guarded by the constant, a fixture, and the table fallback. Bases is the first non-text editor kind, so the seam a notebook needs is exercised in v1 rather than designed speculatively.
  - **Dependencies:** RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES12@R1

- **RM261003ABZP-DES13@R2 — `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering**
  - **Requirements:** RM261003ABZP-REQ8@R2 - read-only preview
  - **Decision:** `preview/server.ts` binds `127.0.0.1:0`, checks Host, serves a page shell, SSE `/events` (`doc` and `stopped` events), `/render` fragments from core `renderHtml(doc)`, and contained `/file/*`; the page loads KaTeX and Mermaid from jsDelivr and falls back to showing source when offline. `:Preview` is a Markdown-only command and the page follows Markdown notes only; switching to another file type sends no `doc` event (flow-level refinement, revision retained).
  - **Explanation:** Preview HTTP routes; `src/preview/server.ts`; `src/core/lang/markdown/html.ts`.
  - **Evidence:** user decision "no Next.js".
  - **Research:** `RM261003ABZP-RF12` - binding, Host check, containment, SSE; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Tradeoffs:** math and diagrams need network in the browser (fallback to source); rejected bundling KaTeX/Mermaid into the binary (multi-MB size) and WebSocket (bidirectional not needed).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3
  - **Predecessors:** RM261003ABZP-DES13@R1

- **RM261003ABZP-DES14@R1 — TOML config at XDG path validated by schema; per-workspace state at XDG state path**
  - **Requirements:** RM261003ABZP-REQ3@R4 - configuration and state
  - **Decision:** `Bun.TOML.parse` + zod schema (`core/config/schema.ts`); config path honors XDG rules (relative values ignored); invalid config → error notice + defaults; state JSON at `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json` holding recent notes, jump list, open buffers, window layout.
  - **Explanation:** AppConfig; `src/workspace/config-file.ts`; `src/workspace/state-file.ts`.
  - **Evidence:** `rm261003abzp-research.md` S21, S9, S30.
  - **Research:** `RM261003ABZP-RF15` - TOML, XDG rules, state home; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4)
  - **Tradeoffs:** TOML instead of the proposal's `config.ts` — no code execution and simpler validation, at the cost of no scripting in config (agent decision under delegation).
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** None

- **RM261003ABZP-DES15@R1 — Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile**
  - **Requirements:** RM261003ABZP-REQ10@R2 - fast checks, CI, release; RM261003ABZP-REQ11@R3 - Conventional Commits, SemVer
  - **Decision:** Bun (exact version in `packageManager`), TypeScript 7 `tsc --noEmit` strict, Biome, knip, `bun test` (unit colocated; component via OpenTUI test renderer; few PTY e2e); `bun run check` = biome check + tsc + knip + boundary test + unit tests; CI jobs `check` and `test` (component, e2e, bench) in parallel with Bun cache; release-please on `main`; release job on tag: `bun install --os="*" --cpu="*"`, compile `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64`, `bun-linux-arm64` with `OPENTUI_LIBC=glibc` defined for Linux, `SHA256SUMS`, smoke `so --version` on `macos-latest` and `ubuntu-latest`.
  - **Explanation:** Project Structure (`package.json`, `.github/workflows/*`).
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's eight CI groups are the anti-pattern avoided.
  - **Research:** `RM261003ABZP-RF3`, `RM261003ABZP-RF13`, `RM261003ABZP-RF14`; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - **Tradeoffs:** unsigned macOS binaries (signing deferred); release-please adds a bot PR.
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** None

- **RM261003ABZP-DES16@R1 — Performance by construction plus benchmark gates**
  - **Requirements:** RM261003ABZP-REQ9@R2 - performance targets
  - **Decision:** viewport-only layout (DES9), block parse cache (DES6), worker index and search (DES7), frame coalescing (one render per input burst), first frame before indexing, lazy image decode with an LRU cache (64 MiB), and benchmarks through the OpenTUI test renderer gated at 2× (median of 5) in CI.
  - **Explanation:** Keystroke to frame and Startup flows; `test/bench/`.
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's 64 MiB image budget precedent.
  - **Research:** `RM261003ABZP-RF2` - in-process metrics; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Tradeoffs:** benchmarks add CI time (bounded by the 3 min budget); terminal display latency is outside the measurement.
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES9@R3
  - **Predecessors:** None

- **RM261003ABZP-DES17@R1 — File-type registry, highlighter interface, and text-file open policy**
  - **Requirements:** RM261003ABZP-REQ1@R3 - any text file, binary and size guard, BOM; RM261003ABZP-REQ3@R4 - file-type scope; RM261003ABZP-REQ11@R3 - file types, highlighters, decoration providers, editor kinds by registration
  - **Decision:** a `FileTypeRegistry` maps a path to a `FileType` (extension, then file name, then the built-in `text` fallback); a file type declares its editor kind (an open string; non-`text` kinds register an `EditorKindSpec` in core, which creates the window state, and a UI view in `editorViews`, which paints it), views with decoration providers and an optional `input` hook whose context type the language declares and `core/state` builds, optional `Highlighter` (a kernel interface), and optional `analyze` hook. Note-only commands, including `:Preview`, are limited to `markdown`. v1 registers `text`, `markdown`, `base`, and code file types backed by one lowlight `Highlighter` (viewport-bounded, cached per buffer version). `workspace/fs.readTextFile` refuses files over 16 MiB and files with a NUL in the first 8 KiB or invalid UTF-8, strips and remembers a BOM and line separator; saves restore both.
  - **Explanation:** FileType and Decoration model; Open a file flow; `src/core/filetypes/registry.ts`; `src/core/lang/code/highlight.ts`; `src/workspace/fs.ts` `readTextFile`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R2` - "Apply all six" decision; `alfred/apps/tui/src/view/markdown/code-highlight.ts` - lowlight precedent. Industry precedent: Neovim `filetype` + ftplugins, VS Code language contributions, Git's NUL-byte binary heuristic.
  - **Research:** None - the decision reuses existing findings (RF6 pure text model, RF7 parse and reveal).
  - **Tradeoffs:** lowlight is regex-based and not incremental, so very long multi-line constructs above the 200-line look-back can highlight wrongly; accepted for v1 and replaceable by tree-sitter behind `Highlighter`. Rejected adding tree-sitter now (WASM grammars, build and size cost without a v1 need) and a generic notebook-ready `Document` abstraction (speculative; editor kinds already cover it). The 16 MiB limit is a fixed constant, not configuration.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES8@R1
  - **Predecessors:** None

| Current requirement | Design decision | Canonical design location | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; `src/core/filetypes/`; Open a file and Save and external change flows | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | `src/core/kernel/text/`, `src/core/kernel/editor/`, `src/core/kernel/vim/`, `src/ui/input.ts` | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, config, state, file-type scope | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES17@R1 | `src/core/kernel/commands/`, `src/ui/overlays/`, `src/workspace/config-file.ts`, `state-file.ts` | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links | RM261003ABZP-DES7@R3, RM261003ABZP-DES6@R1 | `src/core/features/links/` | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | `src/core/lang/markdown/`, `src/core/kernel/view/`, `src/ui/editors/`, `src/ui/widgets/` | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | `src/core/time/`, `src/core/features/notes/` | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | `src/core/features/bases/`, `src/ui/editors/` | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - preview | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R1 | `src/preview/`, `src/core/lang/markdown/html.ts` | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-DES16@R1 | Keystroke and Startup flows; `test/bench/` | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R2 - dev, CI, release | RM261003ABZP-DES15@R1, RM261003ABZP-DES1@R2 | `package.json`, `.github/workflows/` | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1 | `test/boundaries.test.ts`, `src/core/kernel/`, `src/core/filetypes/`, registries, `src/ui/shell.ts` | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

## Unresolved Items

None — open technical confirmations (OpenTUI paint/image API details at the pinned version, recursive `fs.watch` behavior, Kanban `type` value) are delivery constraints with named verification, not design decisions.

## Approval

- **Requirement baseline:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 … RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R3
- **Approved design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
- **Approved success and verification:** RM261003ABZP-S1@R1 … RM261003ABZP-S12@R1; RM261003ABZP-V1@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1, RM261003ABZP-V4@R2, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1, RM261003ABZP-V9@R1, RM261003ABZP-V10@R1, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V13@R1, RM261003ABZP-V14@R1, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1
- **Approval evidence:** User delegated all decisions on 2026-10-03 ("you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"); the agent approved this design, the DES2/DES7/DES9/DES13 R2 revisions from the UI system-impact assessment, and the V6/V11 R2 verification revisions, under that delegation. On 2026-10-03 the user approved the Markdown-first, language-neutral core by selecting "Apply all six (Recommended)" (kernel split, FileType registry, decorations, file-type keymaps, highlighter interface, open any text file); this produced DES1@R2, DES5@R2, DES7@R3, DES9@R3, DES10@R2, DES12@R2, DES17@R1, S12@R1, V18@R1, and the V4/V7/V12/V15/V16 R2 revisions. The user then delegated every remaining sub-decision on 2026-10-03 ("you self-drive everything. Everything is good now, don't need to stop"), covering the 16 MiB limit, binary check, BOM preservation, all-file picker and text-file search, `[filetypes.<id>.keys.<mode>]` config, no statusline file-type segment, S12/V18, the TypeScript benchmark, and the lowlight look-back.
``````

- **RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R2 — Post-DI2 synchronization: two-level Markdown model, rename from scans, line-numbered TOML errors, worker entrypoint**
  - **Archived at:** 2026-10-03T21:59:02Z
  - **Change type:** Revised
  - **Reason:** DI2 (W261003FX70, PR #2) merged to `main` as `9adb285`. Its approved refinements change these decisions: a full mdast parse misses the index and open budgets; `Bun.TOML.parse` cannot report the TOML line of an error; a single-entrypoint binary drops the index worker; rename planning works from scans instead of reading files.
  - **Changes:**
    - DES6: one `Doc` with two levels — a linear scan level (links, tags, headings, block ids, frontmatter) for the index and link features, and mdast built lazily per block for live preview and HTML; `scanDoc` and `blockNode` added; `syntaxExtensions` defines each syntax once for both levels. Doc model, `doc.ts` code shape, Project Structure, and Tradeoffs updated (W261003FX70 parent synchronization row 3).
    - DES7: summaries come from the scan level; `planRename(ix, moves, open)` replaces `planRename(ix, from, to, read)` and reads no file; closed-file edits carry their expected text and go through `applyEdits`; one link rewrite at a time, with `links still updating — try again when the update finishes` for a second rename or move (deviation D2); `LinkRef` gains `raw`, `range`, and `context?` (deviation D3); fuzzy ranking lives in `src/core/kernel/text/fuzzy.ts` (rows 3, 4, 7).
    - DES14: `toml-eslint-parser` 1.0.3 replaces `Bun.TOML.parse` so errors name the TOML line (`parseConfig` in `core/config/toml.ts`); AppConfig records `editor.tabWidth` (1–16, default 8), `editor.wrap` (default `true`), and `editor.relativeNumbers` (default `true`) as delivered by DI2 (rows 2, 6).
    - DES15: every `bun build --compile` lists `src/workspace/index-worker.ts` as a second entrypoint (row 5).
    - Not changed here: row 9 (`file.save`) — this design already names `file.save` in RM261003ABZP-V4@R2 scenario (b) and never named DI1's `buffer.write`. Row 8 (optional worker message fields) and row 4's additive Actions, Effects, and TimerIds are phase-design shapes, recorded in the PH1 file. Deviation D1 (the palette ranks command titles) keeps the RM261003ABZP-V4@R2 (e) expectation and is recorded in the PH1 file. Deviation D4 (`navigated?` on pending restores) is internal state that never reaches the state file; no design text names it.
    - Reference updates, revisions retained: every other reference in this document (components, data models, runtime flows, code design, the DES7 dependency on DES6, approval, and the traceability table) cites DES6@R2, DES7@R4, DES14@R2, DES15@R3.
  - **Record transitions:**
    - RM261003ABZP-DES6@R1 → RM261003ABZP-DES6@R2 - revision change (two-level model, lazy mdast)
    - RM261003ABZP-DES7@R3 → RM261003ABZP-DES7@R4 - revision change (scan-level summaries, rename from scans, one rewrite at a time)
    - RM261003ABZP-DES14@R1 → RM261003ABZP-DES14@R2 - revision change (config parser, editor options)
    - RM261003ABZP-DES15@R2 → RM261003ABZP-DES15@R3 - revision change (worker compile entrypoint)
    - RM261003ABZP-DES5@R2, RM261003ABZP-DES16@R1, RM261003ABZP-S3@R1, RM261003ABZP-S4@R1, RM261003ABZP-S9@R1, RM261003ABZP-S10@R1, RM261003ABZP-V4@R2, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2, RM261003ABZP-V13@R1, RM261003ABZP-V14@R1 - Revision retained
  - **Requirement baseline:** Unchanged.
  - **Evidence:** `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md` section 1, Parent Synchronization rows 1–9; `w261003fx70-goal.md` Blockers and Deviations D1–D4; `reports/overall-verification-report.md` (Passed); `src/core/lang/markdown/{doc,scan,mdast}.ts`, `src/core/features/links/{rename,summarize}.ts`, `src/core/config/{schema,toml}.ts`, `src/core/kernel/text/fuzzy.ts`, `package.json`, `.github/workflows/release.yml` at `9adb285`.
  - **Research provenance:**
    - None - no new roadmap research; DI2's work-level measurements are cited as evidence. RF7 support for DES6, RF8 for DES7, RF15 for DES14, and RF3, RF13, RF14 for DES15 are unchanged (RF15's `Bun.TOML.parse` fit is superseded only by the line-number need).
  - **Affected coverage:** RM261003ABZP-REQ3@R4 → DES7@R3, DES14@R1 becomes → DES7@R4, DES14@R2; RM261003ABZP-REQ4@R3 → DES7@R3, DES6@R1 becomes → DES7@R4, DES6@R2; RM261003ABZP-REQ8@R2 → DES6@R2; RM261003ABZP-REQ10@R3 → DES15@R3; S and V links unchanged.
  - **Approval evidence:** Synchronization approved by the user on 2026-10-04.
  - **Downstream impact:** `rm261003abzp-roadmap-index.md`, `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, and `rm261003abzp-roadmap-phase-2-obsidian-experience.md` cite the new revisions with PH/DI revisions retained. DI3's live preview and HTML preview consume mdast through `blockNode` (DES6@R2). UI artifacts keep DES6@R1, DES7@R3, DES14@R1, and DES15@R1 as their approved system baseline; the behaviour they depend on (resolution order, impact counts, config errors with lines, jumps) is unchanged. W261003FX70 delivered the new revisions; W261003HEGE is unaffected.

``````markdown
# RM261003ABZP: so v1 — Design

- **Status:** Approved
- **Outcome:** One Bun process with a pure TypeScript core — a language-neutral editor kernel (text, vim, commands, view) plus registered file types, Markdown language support, and note features (links, notes, Bases) — driven by one-way state flow, thin I/O adapters, an OpenTUI shell that draws only visible lines, and a read-only `Bun.serve` preview — enforced by an import-boundary test and gated by fast CI with in-process performance benchmarks.
- **History:** `rm261003abzp-design-revisions.md`

Use `None — <reason>` for sections or fields that do not apply. Diagrams and code previews show proposed design unless labeled as current evidence.

## Baseline and Goals

- **Context:** `rm261003abzp-roadmap-context.md@R2` - empty repository; Alfred code available to port (Markdown parse, Obsidian syntax, vim core, terminal graphics, Bases); scope change 2026-10-03: Markdown-first on a language-neutral core.
- **Requirements:** `rm261003abzp-requirements.md` - RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3 … RM261003ABZP-REQ10@R3, RM261003ABZP-REQ11@R3 (approved).
- **Research:** `rm261003abzp-research.md`
- **Reconciliation:** `rm261003abzp-requirements.md` Research Reconciliation — Complete.
- **Goals:**
  - Meet REQ1–REQ11 with the fewest moving parts: one process, one package, one state store.
  - Keep every product rule in a pure, unit-testable core; keep OpenTUI, Bun, and the file system at the edges.
  - Keep the editor kernel language-neutral: Markdown, links, notes, and Bases plug in through a file-type registry, so code editing and notebooks can be added later as registrations, not rewrites (RM261003ABZP-REQ11@R3).
  - Extend by registration (commands, keymaps, syntax extensions, block renderers, Bases view types, file types, highlighters, decoration providers, editor kinds) — the known extension needs from RM261003ABZP-REQ11@R3.
- **Binding constraints:**
  - `.s1mple/S1MPLE.md` Implementation - "Keep it lean and simple": no monorepo, no server between UI and core, no speculative plugin system.
  - RM261003ABZP-REQ11@R3 - only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs; `src/core/kernel/` imports nothing from `filetypes/`, `lang/`, or `features/`.
  - RM261003ABZP-REQ10@R3 - no tool may depend on the TypeScript compiler API (TypeScript 7 ships none, `RM261003ABZP-RF13`).

## System Architecture

- **System context:** One user in a terminal runs `so [path]`. External systems: the file system (the workspace folder, `$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, trash), the terminal emulator (keys, mouse, graphics), the system clipboard, and — only while `:Preview` runs — a local browser over `127.0.0.1`. No network service, database, Git, or AI.
- **Current architecture:** `rm261003abzp-roadmap-context.md@R2` Current System — empty repository.

```text
Not established — empty repository (only .s1mple/ guidance)
```

- **Proposed architecture:**

```text
                         ┌──────────────────────── src/app (composition root) ────────────────────────┐
 terminal ⇄ OpenTUI ⇄    │  main.ts → loads config/state → creates Store → starts UI, effects, workers │
                         └──────┬──────────────────────┬───────────────────────┬────────────────────┬──┘
                                │                      │                       │                    │
                   ┌────────────▼─────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
                   │ src/ui  (OpenTUI)    │  │ src/workspace (I/O)│  │ src/preview       │  │ src/core (pure)│
                   │ views, input, paint  │  │ fs, watcher, trash │  │ Bun.serve + SSE   │  │ state, vim,    │
                   │ images, theme        │  │ index worker, cfg  │  │ read-only HTML    │  │ kernel, file-  │
                   └────────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │ types,lang,feat│
                                │ reads state,          │ executes effects,     │ reads state, └───────▲────────┘
                                │ dispatches actions    │ dispatches results    │ renders HTML         │
                                └───────────────────────┴───────────────────────┴──────── import ──────┘

 Allowed imports:  app → ui, workspace, preview, core      ui → core      workspace → core      preview → core
                   core → (nothing outside core; npm parsing libs only)

 Inside core:      core/kernel  (text, editor, vim, commands, view)  → kernel only        ← language-neutral
                   core/filetypes                                     → kernel
                   core/lang/*, core/features/*                       → kernel, filetypes, lang, features, time
                   core/state, core/config                            → any core module (composition)
                   nothing outside core/state and core/config imports them
```

The core owns all product behavior; the three edge layers are adapters. This reuses Alfred's parsing, Obsidian syntax, vim, terminal-graphics knowledge, and Bases engine by porting them into `core/` (Alfred's kernel, client, protocol, chat, Git, SQLite, Ink, and Next.js are not reused). Main tradeoff: one process keeps latency and code minimal, but a CPU-heavy task on the main thread would stall input — so scanning, parsing for the index, and full-text search run in a worker (RM261003ABZP-DES7@R3).

Inside the core, the kernel edits and lays out text for any language; Markdown is one registered file type whose parser, live-preview decorations, and highlighter plug into the kernel (RM261003ABZP-DES1@R2, RM261003ABZP-DES17@R1). A code editor or notebook later adds file types, decoration providers, and editor kinds; the kernel does not change. Tradeoff: one more indirection (the file-type registry) between an open buffer and its Markdown behaviour, accepted because it is also what Bases and plain text files need in v1.

## Components and Boundaries

- **App (composition root)**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2
  - **Location:** `src/app/`
  - **Responsibilities:** parse CLI args; register file types (`text`, `markdown`, `base`, code types), commands, and keymaps; load config and state; construct the store, effect runner, workspace adapters, index worker, UI, and preview on demand; own process lifecycle and exit codes.
  - **Collaborators:** `bin/so` → `app/main.ts` → `core/store`, `workspace/*`, `ui/shell`, `preview/server`
  - **Contracts:** Action and Effect protocol; AppConfig
  - **Code shape:** `src/app/main.ts` `main`, `src/app/effects.ts` `runEffect`
  - **Must not own:** product rules, rendering, Markdown semantics.

- **Core — state**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Location:** `src/core/state/`
  - **Responsibilities:** `AppState`, pure `update(state, action) → { state, effects }`; jump list, autosave policy, conflict rules; opening a file as a buffer of its registered file type.
  - **Collaborators:** ui/workspace/preview → `dispatch(action)` → `update` → effects → app effect runner
  - **Contracts:** Action and Effect protocol; AppState
  - **Code shape:** `src/core/state/update.ts` `update`
  - **Must not own:** timers, I/O, terminal escape codes.

- **Core — editor kernel**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/core/kernel/` (`text/`, `editor/`, `vim/`, `commands/`, `view/`)
  - **Responsibilities:** text buffer, cursor and selections, undo blocks, registers, window tree; vim mode machine, key-sequence parser, motions, operators, text objects, dot-repeat, search, ex commands; command registry, file-type-scoped keymap trie, which-key and palette data; the viewport text view that lays out visible rows from text and decorations.
  - **Collaborators:** `update` → `vim.handleKey(bufferState, key)` → `TextBuffer`; `update` → `keymap.lookup({mode, filetype})`; UI → `layoutText(view, providers, analysis)` → `RenderLine[]`
  - **Contracts:** TextBuffer; VimState; Command and Keymap registry; Decoration and RenderLine model
  - **Code shape:** `src/core/kernel/text/text-buffer.ts` `TextBuffer`; `src/core/kernel/vim/engine.ts` `handleKey`; `src/core/kernel/commands/registry.ts` `CommandRegistry`, `Keymap`; `src/core/kernel/view/text-view.ts` `layoutText`
  - **Must not own:** rendering, clipboard I/O (expressed as effects), and anything Markdown-, link-, note-, or Bases-specific (enforced by the boundary test).

- **Core — file types**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Location:** `src/core/filetypes/`
  - **Responsibilities:** `FileType` contract and `FileTypeRegistry`: path → file type (extension, then file name, then the `text` fallback); per file type the editor kind, views, highlighter, and analysis hook; the built-in `text` file type.
  - **Collaborators:** `app/main` → registers `markdown`, `base`, and code file types; `update` → `fileTypes.forPath(path)` on open
  - **Contracts:** FileType and Decoration model
  - **Code shape:** `src/core/filetypes/registry.ts` `FileTypeRegistry`, `FileType`
  - **Must not own:** language parsing (lives in `lang/`), file reading (workspace).

- **Core — languages (Markdown and code highlighting)**
  - **Decisions:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES13@R2, RM261003ABZP-DES17@R1
  - **Location:** `src/core/lang/markdown/`, `src/core/lang/code/`
  - **Responsibilities:** Markdown block splitting, per-block parse cache, Obsidian syntax extensions, `Doc` model; the live-preview decoration provider with reveal rules and block renderers; pure HTML rendering for the preview; the `markdown` file type. `lang/code` wraps lowlight as `Highlighter`s and registers code file types (TypeScript, JavaScript, JSON, YAML, TOML, shell, Python, CSS, HTML, …) used for code files and fenced code blocks.
  - **Collaborators:** `update` → `markdown.analyze(buf, prevDoc)` → `Doc`; UI → `layoutText(view, [highlight, livePreview(doc)])` → paint; preview → `renderHtml(doc, ctx)`
  - **Contracts:** Doc model; FileType and Decoration model
  - **Code shape:** `src/core/lang/markdown/doc.ts` `parseDoc`; `src/core/lang/markdown/live-preview.ts` `livePreview`; `src/core/lang/markdown/html.ts` `renderHtml`; `src/core/lang/code/highlight.ts` `lowlightHighlighter`
  - **Must not own:** terminal escape output, image decoding, HTTP.

- **Core — links feature**
  - **Decisions:** RM261003ABZP-DES7@R3
  - **Location:** `src/core/features/links/`
  - **Responsibilities:** `NoteSummary` extraction, `NoteIndex` (names, aliases, headings, blocks, links, tags, backlinks) plus the workspace file list for the file picker, link resolution rule, rename planning, fuzzy matching, full-text search functions.
  - **Collaborators:** index worker → `summarize(path, text)` → `NoteIndex.apply(delta)`; `update` → `resolveLink`, `planRename`
  - **Contracts:** NoteSummary and NoteIndex; LinkTarget
  - **Code shape:** `src/core/features/links/note-index.ts` `NoteIndex`; `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`
  - **Must not own:** file scanning (worker), persistence.

- **Core — Bases and notes features**
  - **Decisions:** RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2
  - **Location:** `src/core/features/bases/`, `src/core/features/notes/`, `src/core/time/`
  - **Responsibilities:** `.base` parsing, expression evaluation, table and Kanban view models, YAML-preserving frontmatter patches, the `base` file type and editor kind; daily-note paths, template expansion, Moment-subset date formatting.
  - **Collaborators:** `update` → `evaluateBase(base, index)` → `BaseViewModel`; `update` → `expandTemplate(tpl, vars)`
  - **Contracts:** BaseViewModel; Template variables
  - **Code shape:** `src/core/features/bases/evaluate.ts` `evaluateBase`; `src/core/time/format.ts` `formatDate`
  - **Must not own:** file writes (expressed as `write` effects).

- **Workspace adapters**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1, RM261003ABZP-DES17@R1
  - **Location:** `src/workspace/`
  - **Responsibilities:** atomic save, text read with binary and size checks, create, rename, move, delete-to-trash; directory watcher with own-write suppression; index worker (scan, summarize, search); config and state files; clipboard; opening URLs/browser.
  - **Collaborators:** app effect runner → `workspace/*` → `dispatch(resultAction)`
  - **Contracts:** Effect protocol; FileEvent; WorkerMessage
  - **Code shape:** `src/workspace/fs.ts` `atomicWrite`, `readTextFile`; `src/workspace/watcher.ts` `watchWorkspace`; `src/workspace/index-worker.ts`
  - **Must not own:** decisions about conflicts, autosave timing, or link rewriting (core decides).

- **UI shell**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/ui/`
  - **Responsibilities:** OpenTUI renderer lifecycle; key/mouse normalization (kitty keyboard protocol, Esc timeout); layout of explorer, bufferline, editor windows, side panel, statusline, command line, overlays (picker, which-key, palette, prompts, help, notifications); one view per editor kind (`text` → `EditorView`, `base` → Bases view); painting `RenderLine[]`; widget painters keyed by widget type (image, embed, base); theme and `NO_COLOR`; terminal restore.
  - **Collaborators:** OpenTUI → `ui/input` → `dispatch`; store subscription → `ui/shell.render(state)`
  - **Contracts:** Key; RenderLine; AppState (read-only)
  - **Code shape:** `src/ui/shell.ts` `createShell`; `src/ui/editors/registry.ts` `editorViews`; `src/ui/editors/text-view.ts` `EditorView`; `src/ui/widgets/registry.ts` `widgetPainters`; `src/ui/input.ts` `normalizeKey`
  - **Must not own:** editing logic, Markdown parsing, file-type decisions, file I/O.

- **Preview server**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Location:** `src/preview/`
  - **Responsibilities:** `Bun.serve` on `127.0.0.1:0`, Host allowlist, SSE updates, read-only page, contained asset serving.
  - **Collaborators:** app → `startPreview(store)` → browser; store subscription → SSE push
  - **Contracts:** Preview HTTP routes
  - **Code shape:** `src/preview/server.ts` `startPreview`
  - **Must not own:** editing; files outside the workspace.

## Project Structure

- **Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json                 Purpose: one package; scripts dev/check/test/bench/build; exact pins
│       Symbols: scripts.check, packageManager, "@opentui/core": "<exact>"   Decisions: DES15
├── [A] tsconfig.json                Purpose: strict ESM, noEmit, TS 7          Decisions: DES15
├── [A] biome.json                   Purpose: format + lint                      Decisions: DES15
├── [A] knip.json                    Purpose: dead-code check                    Decisions: DES15
├── [A] release-please-config.json   Purpose: Conventional Commits → SemVer; initial-version 0.1.0  Decisions: DES15
├── [A] .release-please-manifest.json Purpose: release-please version manifest ({".": "0.0.0"})  Decisions: DES15
├── [A] .github/workflows/ci.yml     Purpose: check ∥ test+bench jobs on pull requests  Decisions: DES15, DES16
├── [A] .github/workflows/release-please.yml Purpose: release PR on main; calls release.yml when a release is created  Decisions: DES15
├── [A] .github/workflows/release.yml Purpose: compile ×4 + native smoke ×4 + publish (on `v*` tag or workflow_call)  Decisions: DES15
├── [A] bin/so                        Purpose: `#!/usr/bin/env bun` entry for source runs  Decisions: DES1
├── [A] src/app/
│   ├── main.ts                      Purpose: CLI, wiring, lifecycle            Symbols: main, parseArgs   Decisions: DES1, DES2
│   └── effects.ts                   Purpose: effect runner                     Symbols: runEffect         Decisions: DES2
├── [A] src/core/
│   ├── kernel/                      Purpose: language-neutral editor kernel; imports only kernel  Decisions: DES1
│   │   ├── text/                    Purpose: TextBuffer, Edit, Pos, Range       Symbols: TextBuffer, Edit  Decisions: DES3
│   │   ├── editor/                  Purpose: undo, registers, windows           Symbols: UndoStack, Registers  Decisions: DES3
│   │   ├── vim/                     Purpose: modes, parser, motions, operators, text objects, ex  Symbols: handleKey, motions, textObjects  Decisions: DES4
│   │   ├── commands/                Purpose: registry, file-type-scoped keymap trie, which-key  Symbols: CommandRegistry, Keymap, KeyScope  Decisions: DES5
│   │   └── view/                    Purpose: viewport text layout from decorations  Symbols: layoutText, Decoration, RenderLine  Decisions: DES9
│   ├── filetypes/                   Purpose: FileType contract, registry, `text` fallback  Symbols: FileTypeRegistry, FileType, Highlighter  Decisions: DES17
│   ├── lang/
│   │   ├── markdown/                Purpose: block split, parse cache, Obsidian extensions, live-preview provider, HTML  Symbols: parseDoc, Doc, livePreview, renderHtml, markdownFileType  Decisions: DES6, DES9, DES13
│   │   └── code/                    Purpose: lowlight highlighter, code file types  Symbols: lowlightHighlighter, codeFileTypes  Decisions: DES17
│   ├── features/
│   │   ├── links/                   Purpose: summaries, index, file list, resolve, rename, search  Symbols: NoteIndex, resolveLink, planRename  Decisions: DES7
│   │   ├── bases/                   Purpose: ported Bases engine, view models, `base` file type  Symbols: parseBase, evaluateBase, KANBAN_TYPE, baseFileType  Decisions: DES12
│   │   └── notes/                   Purpose: daily notes, templates             Symbols: dailyPath, expandTemplate  Decisions: DES11
│   ├── time/                        Purpose: Moment-subset formatter            Symbols: formatDate        Decisions: DES11
│   ├── state/                       Purpose: AppState, Action, Effect, update  Symbols: update, AppState  Decisions: DES2
│   └── config/                      Purpose: config schema and defaults         Symbols: ConfigSchema, defaults  Decisions: DES14
├── [A] src/workspace/
│   ├── fs.ts                        Purpose: readTextFile (binary/size/BOM/EOL), atomicWrite, create, rename, move  Symbols: readTextFile, atomicWrite  Decisions: DES8, DES17
│   ├── trash.ts                     Purpose: freedesktop trash, macOS trash (`/usr/bin/trash` or NSFileManager)  Symbols: moveToTrash  Decisions: DES8
│   ├── watcher.ts                   Purpose: directory watching, own-write suppression  Symbols: watchWorkspace  Decisions: DES8
│   ├── index-worker.ts              Purpose: list files, summarize notes, search text files in a Worker  Symbols: onmessage  Decisions: DES7
│   ├── config-file.ts               Purpose: XDG config load + validation       Symbols: loadConfig        Decisions: DES14
│   ├── state-file.ts                Purpose: XDG state load/save                Symbols: loadState, saveState  Decisions: DES14
│   └── system.ts                    Purpose: clipboard, open browser           Symbols: clipboard, openUrl  Decisions: DES8
├── [A] src/ui/
│   ├── shell.ts                     Purpose: renderer lifecycle, layout, restore  Symbols: createShell  Decisions: DES10
│   ├── input.ts                     Purpose: key/mouse normalization, Esc timeout  Symbols: normalizeKey  Decisions: DES10
│   ├── editors/                     Purpose: one view per editor kind: text (paints RenderLine rows, cursor), base  Symbols: editorViews, EditorView  Decisions: DES9, DES10, DES12
│   ├── widgets/                     Purpose: widget painters by type: image, embed, base  Symbols: widgetPainters  Decisions: DES10
│   ├── views/                       Purpose: explorer, bufferline, statusline, cmdline, side panel  Decisions: DES10
│   ├── overlays/                    Purpose: picker, which-key, palette, prompt, help, notify  Decisions: DES10, DES5
│   └── theme.ts                     Purpose: tokens, NO_COLOR                   Symbols: theme     Decisions: DES10
├── [A] src/preview/
│   ├── server.ts                    Purpose: Bun.serve, Host check, SSE, assets  Symbols: startPreview  Decisions: DES13
│   └── page.html                    Purpose: read-only page shell (embedded)   Decisions: DES13
└── [A] test/
    ├── boundaries.test.ts           Purpose: import-boundary enforcement (layers + kernel rule)  Decisions: DES1
    ├── e2e/                         Purpose: few PTY tests (start, edit, save, exit, restore)  Decisions: DES15
    ├── bench/                       Purpose: performance benchmarks via test renderer  Decisions: DES16
    └── fixtures/                    Purpose: sample workspace (notes, code files, a binary; an over-16 MiB file is generated at test time), 5,000-line note, 5,000-line TypeScript file, 10,000-note generator  Decisions: DES16, DES17
```

Unit tests sit next to code as `*.test.ts`.

## Runtime Flows

- **Keystroke to frame**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** OpenTUI key event → `ui/input.normalizeKey` → `store.dispatch({type:"key"})` → `core/state/update` → `keymap.lookup({mode, filetype})` or `vim.handleKey` → `TextBuffer.apply` → file type `analyze` (Markdown: `parseDoc` reparses changed blocks) → store notifies → `ui/shell.render` → `layoutText` with the view's decoration providers (visible rows only) → `EditorView` paint → OpenTUI native diff
  - **Flow:**

    ```text
    key ─→ normalizeKey ─→ dispatch(key) ─→ update(state,key)
                                              ├─ keymap trie {mode, buffer filetype} → {mode}: pending prefix? → state.pending, effect: startWhichKeyTimer
                                              ├─ command → run(ctx) → new state + effects (e.g. scheduleAutosave)
                                              └─ text edit → TextBuffer' + undo block + dirty block ids
                                                   → fileType.analyze (Markdown: reparse dirty blocks, cache by block hash)
          ui.render(state) ← store.notify ←───┘
            └─ layoutText(rows in view, [highlightMarks, view providers e.g. livePreview], view input) → paint → native diff → terminal
    ```

    State changes only inside `update`. Rendering is coalesced to at most one frame per input burst.

  - **Failure and recovery:** a command throws → `update` catches, keeps the previous state, emits `notify(error)`; a render error in one block → that block renders as source with a diagnostic marker; nothing crashes the process.
  - **Contracts and state:** Action and Effect protocol; AppState; FileType and Decoration model; RenderLine model
  - **Control flow:** `src/core/state/update.ts` `update`; `src/core/kernel/view/text-view.ts` `layoutText`; `src/ui/shell.ts` `createShell`

- **Startup**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** `app/main` → register file types (`markdown`, `base`, code types, `text` fallback) → `loadConfig`, `loadState` → `createStore` → `createShell` (first frame) → `startIndexWorker` → `watchWorkspace`
  - **Flow:**

    ```text
    so [path] → resolve workspace (folder | file's parent) ── missing → stderr + exit 2
             → load config (invalid → defaults + error notice) → load state (corrupt → empty)
             → first frame (explorer from a shallow readdir; opened file read directly)   ← < 200 ms target
             → worker: list all non-excluded files + summarize Markdown notes → post batches → dispatch(indexBatch) → status "indexing 4,210/10,000"
             → watcher starts → index ready
    ```

  - **Failure and recovery:** worker crash → notify and restart once; link features show "index unavailable" until restart succeeds; editing keeps working.
  - **Contracts and state:** AppConfig; WorkerMessage; NoteIndex
  - **Control flow:** `src/app/main.ts` `main`

- **Open a file**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES12@R2
  - **Participants:** `:e`, explorer `Enter`, picker, or link follow → effect `read(path)` → `workspace/fs.readTextFile` → `dispatch(fileLoaded | fileRefused)` → `update` → `fileTypes.forPath(path)` → buffer and window content
  - **Flow:**

    ```text
    open(path) → effect read(path) → readTextFile: size > 16 MiB          → fileRefused{reason:"tooLarge"}
                                                 NUL in first 8 KiB       → fileRefused{reason:"binary"}
                                                 not valid UTF-8 (fatal)  → fileRefused{reason:"binary"}
                                                 else strip BOM, detect EOL → fileLoaded{text, bom, eol, stamp}
    fileLoaded → fileTypes.forPath(path): ".md" → markdown (views live|source|reading, editor "text")
                                          ".base" → base (editor "base" → Bases view)
                                          ".ts" → typescript (views source, lowlight highlighter)
                                          other  → text (views source, no highlighter)
               → editor "text": buffer {fileType, view: first view, analysis: analyze?(buf)} → content {editor:"text", bufferId, …}
               → other editor: editorKinds.get(fileType.editor).open(path, text) → content {editor, state}
    fileRefused → notify "binary file — not opened" | "file too large — not opened (limit 16 MiB)"; no buffer, no write
    ```

  - **Failure and recovery:** read error → `fileRefused{reason:"io", message}` → notification; the previous buffer stays active.
  - **Contracts and state:** Action and Effect protocol; FileType and Decoration model; AppState
  - **Control flow:** `src/workspace/fs.ts` `readTextFile`; `src/core/filetypes/registry.ts` `FileTypeRegistry.forPath`, `EditorKindRegistry.get`

- **Save and external change**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2
  - **Participants:** `update` (autosave policy) → effect `write` → `workspace/fs.atomicWrite` → `watcher` → `dispatch(fileChanged)` → `update` (conflict rules)
  - **Flow:**

    ```text
    edit → state.dirty=true → effect scheduleAutosave(1000ms) | leaveInsert | switchNote | exit | :w
         → effect write(path, text, expectedStamp) → atomicWrite: realpath → tmp in same dir → write (BOM + EOL restored) → fsync → chmod → rename
         → record ownWrite(path, stamp) → dispatch(saved(stamp))
    watcher(dir) event → stat+hash → ownWrite? ignore
                                   → buffer clean → dispatch(reload(text)) → undoable reload
                                   → buffer dirty → dispatch(conflict) → prompt: keep mine | take disk | view diff
    ```

  - **Failure and recovery:** write fails (permission, disk full) → buffer stays dirty, status shows `save failed: <reason>`, autosave retries with backoff (1 s, 2 s, 4 s, max 30 s); `:w` retries immediately. Rename failure leaves the temp file removed and the original intact.
  - **Contracts and state:** FileEvent; BufferState.stamp
  - **Control flow:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`

- **Follow, complete, and rename links**
  - **Decisions:** RM261003ABZP-DES7@R3, RM261003ABZP-DES5@R2
  - **Participants:** `update` → `resolveLink(index, sourcePath, target)` → open buffer + jump; `planRename(index, from, to)` → `write` effects
  - **Flow:**

    ```text
    gd on [[plan#Goals]] → resolveLink → {path:"projects/plan.md", heading:"Goals"} → push jumplist → open → cursor at heading
                         → unresolved → prompt "Create projects/plan.md?" → create effect
    rename a.md → b.md → planRename → [{path, edits[]}…] → apply to open buffers in memory + write effects for closed files
                       → fs rename → notify "12 files updated"
    ```

  - **Failure and recovery:** a link-rewrite write fails → remaining writes continue; failures are listed in a notification with paths; the rename itself is rolled back only if the file rename failed (links already rewritten are reported, not reverted).
  - **Contracts and state:** NoteIndex; LinkTarget
  - **Control flow:** `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`

- **Preview**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Participants:** `:Preview` (a Markdown-scoped command) → effect `startPreview` → `preview/server` → browser; store change (active Markdown doc or version) → SSE event → page fetches `/render`. Switching to a non-Markdown buffer sends nothing, so the page keeps the last note (RM261003ABZP-DES17@R1 note-only scope)
  - **Flow:**

    ```text
    :Preview → Bun.serve({hostname:"127.0.0.1", port:0}) → open http://127.0.0.1:<port>/
    page → GET /events (SSE) ; edit → debounce 100 ms → event "doc" {path, version, anchor} ; :PreviewStop/exit → event "stopped" → close
    page → GET /render?path=… → renderHtml(doc) → swap <main>, scroll to anchor
    any request with bad Host → 403 ; /file/<p> → realpath ⊂ workspace & not hidden? → bytes : 404
    ```

  - **Failure and recovery:** port bind fails → notify; browser cannot open → notify the URL; SSE drop → browser auto-reconnects and refetches.
  - **Contracts and state:** Preview HTTP routes
  - **Control flow:** `src/preview/server.ts` `startPreview`

## Contracts, Data, and State

- **Action and Effect protocol — State model**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Purpose:** the only way state changes and the only way side effects start.
  - **Participants:** ui, workspace, preview, timers → `Action` → `update` → `Effect[]` → app effect runner → result `Action`
  - **Meaning:** `Action` is a discriminated union (`key`, `mouse`, `resize`, `fileLoaded`, `fileRefused`, `saved`, `saveFailed`, `fileChanged`, `indexBatch`, `searchResults`, `timer`, …). `Effect` is a discriminated union (`read`, `write`, `create`, `rename`, `move`, `trash`, `startTimer`, `cancelTimer`, `clipboardWrite`, `clipboardRead`, `search`, `startPreview`, `stopPreview`, `openUrl`, `saveState`, `exit`).
  - **Ownership and lifecycle:** core defines both unions; app runs effects; every effect that can fail returns a success or failure action.
  - **Invariants:** `update` is pure and synchronous; no effect runs inside `update`; effects carry all data they need (no callbacks).
  - **State flow:**

    ```text
    Action → update → (State', Effect[]) → runEffect → Action …
    ```

  - **Shape:** `src/core/state/types.ts`

- **AppState — State model**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1
  - **Purpose:** single source of truth for everything visible.
  - **Participants:** `update` (owner) → ui/preview (readers)
  - **Meaning:** `workspace` (root, tree), `buffers` (by id: path, `fileType` id, TextBuffer, `analysis` (the file type's analysis state; Markdown: `Doc`), stamp, `bom`, `eol`, dirty, `view` — one of the file type's view ids, e.g. live|source|reading for Markdown, source for code), `windows` (split tree, active, and per-window `content` by editor kind: `{editor:"text", bufferId, cursor, scroll, folds}` where `folds` is the set of folded callout and expanded embed block ids, or `{editor: <registered kind>, state}` whose `state` comes from that kind's `EditorKindSpec.open` — in v1 only `base`, with state `{path, view, cursor}`), `vim` (mode, pending keys, registers, last change, search), `panels` (explorer, side panel kind), `overlay` (none | picker | whichKey | palette | prompt | help | conflict | calendar | completion), `index` (NoteIndex + status), `notifications`, `config`, `jumps`, `preview` (off | on(port)).
  - **Ownership and lifecycle:** created at startup from config + state file; `jumps` and recent notes persisted through `saveState` effects (debounced 2 s and on exit).
  - **Invariants:** one active window; each `text` window references an open buffer; a buffer's `view` is one of its file type's views; a buffer with `dirty=false` matches its last saved stamp. Adding an editor kind (a notebook later) registers an `EditorKindSpec` in core and an editor view in the UI; neither the `AppState` type nor the kernel changes.
  - **State flow:** `None — plain value replaced by update`
  - **Shape:** `src/core/state/types.ts` `AppState`

- **TextBuffer — Data model**
  - **Decisions:** RM261003ABZP-DES3@R1
  - **Purpose:** text storage and edit primitives behind a stable interface.
  - **Participants:** vim engine, rename planner, template insertion → `TextBuffer` → file type `analyze` (Markdown parser), highlighter, text view
  - **Meaning:** lines array, version number, `apply(edit)` returning a new buffer and the inverse edit; positions are `{line, col}` in UTF-16 code units aligned to grapheme boundaries.
  - **Ownership and lifecycle:** owned by a buffer entry; replaced on each edit (structural sharing of untouched lines).
  - **Invariants:** at least one line; line separators normalized to `\n` in memory, original separator (`\n`/`\r\n`), trailing newline, and leading UTF-8 BOM restored on save. UTF-16 positions match the Language Server Protocol's default position encoding, so a future LSP client needs no conversion.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/text/text-buffer.ts`

- **Doc model — Data model**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Purpose:** parsed Markdown shared by live preview, index summaries, and HTML preview.
  - **Participants:** `parseDoc` (the `markdown` file type's `analyze`) → `Doc` → live-preview provider, `summarize`, `renderHtml`
  - **Meaning:** `Doc { frontmatter?, blocks: Block[] }`; `Block { id, kind, startLine, endLine, hash, node }` where `node` is mdast extended with Obsidian nodes (`wikiLink`, `embed`, `tag`, `highlight`, `comment`, `callout`, `blockId`, `footnote*`, `math`).
  - **Ownership and lifecycle:** recomputed per buffer version; unchanged blocks reused by hash.
  - **Invariants:** blocks cover the document without overlap; a fenced code block or frontmatter is never split.
  - **State flow:** `None`
  - **Shape:** `src/core/lang/markdown/doc.ts`

- **RenderLine model — Data model**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Purpose:** UI-independent, language-neutral description of one screen row.
  - **Participants:** `layoutText` → `RenderLine[]` → `EditorView` (widgets → UI widget painters by `type`)
  - **Meaning:** `RenderLine { sourceLine, spans: {text, style: StyleToken, link?}[], widget?: {type: string, data, rows}, sign?: {text, style} }`; widget types in v1 are `image`, `embed`, `base`, `rule`, registered by `lang/markdown` and `features/bases`; `StyleToken` names a theme token (`heading1`, `bold`, `link`, `tag`, `codeKeyword`, …), never a colour.
  - **Ownership and lifecycle:** computed per frame for visible rows only.
  - **Invariants:** cursor column maps back to a source column through `spans` offsets; widget rows are counted in scroll math.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/view/types.ts`

- **FileType and Decoration model — Data model**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Purpose:** the only way language-specific behaviour reaches the kernel.
  - **Participants:** `lang/*`, `features/bases` → `FileTypeRegistry.register` (wired in `app/main`) → `update` (`forPath` on open; `analyze` per version) → `layoutText(view, providers, analysis)`
  - **Meaning:** `FileType { id, match: {extensions, names}, editor: EditorKind (an open string: "text" and "base" in v1, more by registration), views: [{id, readOnly?, decorations: DecorationProvider[], input?}], highlighter?, analyze? }`. `Decoration` = `mark` (style a range) | `replace` (hide or substitute a range, inline or whole lines, optionally with spans or a widget) | `widget` (insert rows or inline content at a position) | `line` (line style or sign). The kernel's `highlightMarks` turns `Highlighter` output into `mark` decorations; `Highlighter` and `Span` are kernel types, so the kernel never imports `filetypes`. A view's optional `input(analysis, ctx)` hook builds the per-frame provider input from a context type the language declares and `core/state` builds (Markdown: `MarkdownViewInput`), so the UI never branches on a file type. This is the decoration model of CodeMirror 6 (Obsidian's editor), Neovim extmarks, and VS Code decorations.
  - **Ownership and lifecycle:** file types are registered at startup and never change at runtime; providers run per frame on visible lines only.
  - **Invariants:** `text` is the fallback for any unmatched path; every `text` editor file type has a `source` view; decorations never change buffer text; providers are pure.
  - **State flow:** `None`
  - **Shape:** `src/core/filetypes/types.ts`, `src/core/kernel/view/decorations.ts`

- **NoteSummary and NoteIndex — Data model**
  - **Decisions:** RM261003ABZP-DES7@R3
  - **Purpose:** workspace-wide link, tag, heading, and block knowledge, plus the workspace file list.
  - **Participants:** worker `summarize` → `NoteSummary` → main `NoteIndex.apply`
  - **Meaning:** `NoteSummary { path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind:"wiki"|"md"|"embed"}], frontmatter }`. `NoteIndex` holds summaries by path plus derived maps: basename → paths, alias → paths, tag → paths, target path → backlinks; and `files` — every non-excluded workspace path — for the file picker.
  - **Ownership and lifecycle:** built at startup by the worker; updated per file event and per buffer save; never persisted.
  - **Invariants:** derived maps are rebuilt only for changed paths; only Markdown files are summarized; resolution order is fixed (RM261003ABZP-DES7@R3).
  - **State flow:** `empty → indexing(n/total) → ready → (fileEvent) ready`
  - **Shape:** `src/core/features/links/note-index.ts`

- **Preview HTTP routes — API**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Purpose:** read-only browser preview.
  - **Participants:** browser → `preview/server` → core `renderHtml`
  - **Meaning:** `GET /` page shell; `GET /events` SSE (`doc` events with `{path, version, anchor}`; a `stopped` event sent before `:PreviewStop` or exit closes the server); `GET /render?path=` HTML fragment; `GET /file/<path>` workspace asset bytes.
  - **Ownership and lifecycle:** exists only between `:Preview` and `:PreviewStop` or exit.
  - **Invariants:** hostname `127.0.0.1`; Host header ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403; realpath containment else 404; no mutating routes.
  - **State flow:** `off → on(port) → off`
  - **Shape:** `src/preview/server.ts`

- **AppConfig — Data model**
  - **Decisions:** RM261003ABZP-DES14@R1, RM261003ABZP-DES5@R2
  - **Purpose:** user options and keymap overrides.
  - **Participants:** `config-file.loadConfig` → `ConfigSchema` (zod) → `AppState.config`
  - **Meaning:** `leader`, `escTimeoutMs` (50; effective `max(escTimeoutMs, 20)` because OpenTUI resolves a legacy lone Esc at 20 ms), `autosave` (`{ enabled: true, delayMs: 1000 }`), `editor` (`tabWidth`, `wrap`, `relativeNumbers`), `preview` (`mode: "live"`, `embedMaxRows`, `images: "auto"|"blocks"|"off"`), `daily` (`folder`, `format`, `template`), `templates.folder`, `theme`, `color` (overrides `NO_COLOR`), `keys.<mode>` (`"<key-seq>" = "<command-id>"`, global), `filetypes.<id>.keys.<mode>` (same form, one file type).
  - **Ownership and lifecycle:** read at startup and on `:ConfigReload`.
  - **Invariants:** unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
  - **State flow:** `None`
  - **Shape:** `src/core/config/schema.ts`

## Detailed Code Design

- **`src/core/state/update.ts`**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Change:** Add
  - **Responsibilities:** reducer entry; routes actions to feature reducers.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };

    export const update: Update = (state, action) => {
      switch (action.type) {
        case "key":        return handleKeyAction(state, action.key);   // keymap {mode, filetype} → command, else vim edit
        case "fileChanged":return handleFileChanged(state, action);     // reload | conflict | ignore
        case "indexBatch": return { state: withIndex(state, action.summaries), effects: [] };
        // … one case per Action variant; feature logic lives in feature modules
      }
    };

    export function createStore(initial: AppState, run: (e: Effect) => void) {
      let state = initial; const subs = new Set<(s: AppState) => void>();
      return {
        get: () => state,
        dispatch(action: Action) { const r = update(state, action); state = r.state; r.effects.forEach(run); subs.forEach((f) => f(state)); },
        subscribe(f: (s: AppState) => void) { subs.add(f); return () => subs.delete(f); },
      };
    }
    ```

    `update` routes; `createStore` is the only mutable cell. The switch dispatches on a closed Action union (core protocol, not an extension point); commands extend through the registry instead.

  - **Dependencies:** Action and Effect protocol; CommandRegistry
  - **Callers and wiring:** `app/main.ts` creates the store with `runEffect`; ui and preview subscribe.
  - **Invariants:** pure; no `Date.now()` — time arrives in actions.
  - **Verification:** RM261003ABZP-S11@R1, RM261003ABZP-V15@R2

- **`src/core/kernel/commands/registry.ts`**
  - **Decisions:** RM261003ABZP-DES5@R2
  - **Change:** Add
  - **Responsibilities:** named commands, file-type-scoped keymap trie, which-key and palette data, config overrides.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Command<Ctx = unknown, R = unknown> = {   // generic: the kernel never imports core/state
      id: string;                       // "file.find", "note.today", "link.follow"
      title: string;                    // shown in palette and which-key
      group?: string;                   // which-key group: "find", "note", "buffer"
      filetypes?: readonly string[];    // omitted = every file type; ["markdown"] for link.follow, view.cycle, task.toggle
      run: (ctx: Ctx, args?: string) => R;   // core/state instantiates Ctx = CommandContext, R = { state: AppState; effects: Effect[] }
    };
    export type Mode = "normal" | "insert" | "visual" | "cmdline" | (string & {});   // "explorer", "picker", "base" are declared by their owners
    export type KeyScope = { mode: Mode; filetype?: string };   // filetype omitted = global

    export class CommandRegistry<Ctx, R> { register(cmd: Command<Ctx, R>): void; get(id: string): Command<Ctx, R> | undefined; list(filetype?: string): Command<Ctx, R>[] }

    export class Keymap {
      bind(scope: KeyScope, seq: string, commandId: string): void;   // "<leader>ff", "gd", "<C-o>"
      lookup(scope: KeyScope, pending: Key[]): { kind: "command"; id: string } | { kind: "prefix"; next: WhichKeyItem[] } | { kind: "none" };
      // lookup checks {mode, filetype} first, then {mode}; which-key merges both levels
    }
    ```

    Features call `registry.register` and `keymap.bind` at startup from their own module (`src/core/features/notes/commands.ts`, …); `lang/markdown` binds `gd`, `Enter`, `<leader>m`, `<leader>x` with `filetype: "markdown"`. Which-key reads `lookup(...).next`; the palette reads `list(activeFiletype)`. Config `keys.<mode>` rebinds globally and `filetypes.<id>.keys.<mode>` per file type, both by command id. This mirrors Neovim's buffer-local keymaps set from ftplugins, so `gd` stays free for go-to-definition in code files later.

  - **Dependencies:** None inside the kernel (generic over context and result); `core/state` defines `AppCommand = Command<CommandContext, { state: AppState; effects: Effect[] }>`
  - **Callers and wiring:** `core/state` default registration registers built-ins; `app/main.ts` applies config overrides.
  - **Invariants:** duplicate ids throw at startup; binding an unknown id or file type is a config error, not a crash; running a command whose `filetypes` exclude the active buffer's file type is a no-op with the notice `not available for <type> files`.
  - **Verification:** RM261003ABZP-S3@R1, RM261003ABZP-V4@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/kernel/text/text-buffer.ts` and `src/core/kernel/vim/engine.ts`**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Change:** Add (vim engine redesigned from `alfred/apps/tui/src/view/editor/vim.ts`)
  - **Responsibilities:** buffer primitives; vim grammar `[count]["x][count]operator[count](motion|textobject)`.
  - **Current source:** `alfred/apps/tui/src/view/editor/vim.ts:15-40` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    export type VimMode = "normal" | "insert";
    export type VimEffect = "changed" | "insert-exited" | "toggle-mode" | "leave";
    export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
    ```

    Alfred's engine is pure with effects but supports two modes and a hard-coded pending set.

  - **Proposed shape:**

    ```ts
    export interface TextBuffer {
      readonly version: number; readonly lineCount: number;
      line(i: number): string;
      apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };     // Edit = { range, text }
      slice(range: Range): string;
    }

    export type Motion = (buf: TextBuffer, at: Pos, count: number, ctx: MotionCtx) => { to: Pos; linewise: boolean; inclusive: boolean } | null;
    export type TextObject = (buf: TextBuffer, at: Pos, count: number) => Range | null;
    export const motions: Record<string, Motion>;       // "w","b","e","gg","G","f",… registered by key
    export const textObjects: Record<string, TextObject>; // "iw","a(","ip",…

    export function handleKey(s: BufferVim, key: Key, env: VimEnv): { s: BufferVim; effects: VimEffect[] };
    // VimEffect: { kind:"yank", register, text } | { kind:"changed" } | { kind:"modeChanged", mode } | { kind:"ex", line } | { kind:"search", pattern, dir }
    ```

    The parser accumulates keys into a pending command; when complete it resolves the motion or text object by table lookup, applies the operator, and records an undo block and last-change for `.`. Insert mode collects edits into one undo block until `Esc`.

  - **Dependencies:** TextBuffer; registers in AppState
  - **Callers and wiring:** `update` → `handleKeyAction` → `handleKey` when no keymap binding matches in normal/visual/insert mode.
  - **Invariants:** an operator with a failed motion is a no-op; counts multiply (`2d3w` = `d6w`); undo restores cursor.
  - **Verification:** RM261003ABZP-S2@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1

- **`src/core/lang/markdown/doc.ts`**
  - **Decisions:** RM261003ABZP-DES6@R1
  - **Change:** Add (ported from `alfred/apps/tui/src/view/markdown/parse.ts` and `alfred/packages/view-model/src/markdown/obsidian-syntax.ts`)
  - **Responsibilities:** split into blocks, parse each block with micromark + GFM + math + Obsidian extensions, reuse unchanged blocks.
  - **Current source:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` (imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math`)
  - **Current shape:**

    ```ts
    // Alfred parses the whole document per render and post-processes Obsidian syntax with regexes from obsidian-syntax.ts
    export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    ```

    Whole-document parse; Obsidian syntax by regex over text nodes.

  - **Proposed shape:**

    ```ts
    export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; node: MdNode };
    export type Doc = { version: number; frontmatter?: Frontmatter; blocks: Block[] };

    export function splitBlocks(buf: TextBuffer): { startLine: number; endLine: number }[]; // blank-line bounded; fences, frontmatter, $$ kept whole; lists kept whole
    export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;   // reparse only ranges whose hash changed
    export const syntaxExtensions: SyntaxExtension[];             // wikiLink, embed, tag, highlight, comment, callout, blockId — registration point
    ```

    Block-level reparse keeps per-keystroke work proportional to the edited block (`RM261003ABZP-RF7`). Obsidian syntax is applied as mdast transforms registered in `syntaxExtensions`.

  - **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`
  - **Callers and wiring:** registered as the `markdown` file type's `analyze`; `update` runs it after edits; worker `summarize`; preview `renderHtml`.
  - **Invariants:** `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally (cache is transparent).
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2

- **`src/core/kernel/view/text-view.ts` and `src/core/lang/markdown/live-preview.ts`**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Change:** Add (live preview adapted from `alfred/apps/tui/src/view/markdown/layout.ts` and `alfred/apps/tui/src/view/editor/reveal-units.ts`)
  - **Responsibilities:** language-neutral visible-row layout from decorations (kernel); Markdown live preview as a decoration provider with reveal rules and block renderers (lang).
  - **Current source:** `alfred/apps/tui/src/view/editor/reveal-units.ts` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    None — Alfred lays out whole documents for Ink rendering
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    // src/core/kernel/view — knows nothing about Markdown
    export type TextView = { buf: TextBuffer; width: number; topRow: number; rows: number; cursor: Pos; selection?: Range; folds: ReadonlySet<number>; visible: LineRange };
    export type Widget = { type: string; data: unknown; rows: number };            // painted by a UI widget painter
    export type Decoration =
      | { kind: "mark"; range: Range; style: StyleToken }                          // syntax colour, bold, search match
      | { kind: "replace"; range: Range; block: boolean; spans?: Span[]; widget?: Widget } // hidden `**`, rendered table rows
      | { kind: "widget"; at: Pos; block: boolean; widget: Widget }                // image, embed, base view
      | { kind: "line"; line: number; style?: StyleToken; sign?: Sign };           // ▕ reveal sign, ⚠ render error
    export type DecorationProvider<S = unknown> = (v: TextView, analysis: S) => Decoration[]; // visible lines only
    export function layoutText(v: TextView, providers: readonly DecorationProvider[], analysis: unknown): RenderLine[];
    export type TextViewInput = { view: TextView; providers: readonly DecorationProvider[]; analysis: unknown };  // what a text editor view paints
    export interface Highlighter { language: string; highlight(buf: TextBuffer, lines: LineRange): Span[][] }      // kernel-owned; lang/code implements it
    export function highlightMarks(h: Highlighter | undefined): DecorationProvider;                               // Span[][] → mark decorations

    // src/core/lang/markdown/live-preview.ts — one provider among many
    export type PreviewCtx = { isResolved(target: string): boolean; embed(path: string): { doc: Doc } | "loading" | "missing";
                               image(ref: string): { rows: number } | "unknown"; embedMaxRows: number; images: "auto" | "blocks" | "off" };
    export type MarkdownViewInput = { doc: Doc; view: "live" | "reading"; ctx: PreviewCtx };   // built by the Markdown views' `input` hook
    export const livePreview: DecorationProvider<MarkdownViewInput>;   // views "live" and "reading" (reading: no reveal)
    export type BlockRenderer = (block: Block, v: TextView, input: MarkdownViewInput) => Decoration[];
    export const blockRenderers: Partial<Record<BlockKind, BlockRenderer>>;   // heading, list, table, callout, code, embed, base, math, mermaid …
    ```

    Reveal is the provider's rule, not the kernel's: on the cursor's line it emits no inline `replace` decorations; when the cursor is inside a multi-line block (table, callout, code, math, frontmatter) it emits none for that block, so the source shows. `source` view uses only the highlighter's `mark` decorations; a code file gets exactly that path. Rows outside the viewport are never laid out; a per-block row-height cache gives scroll positions.

  - **Dependencies:** Doc model; FileType and Decoration model; theme tokens; `lang/code` highlighter for fenced code; ported math and mermaid text renderers
  - **Callers and wiring:** `ui/editors/text-view.ts` per frame with the active view's providers from the buffer's file type.
  - **Invariants:** `layoutText` with no providers returns raw lines; the source view of Markdown and any code file use the same path; reading view never reveals.
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/filetypes/registry.ts` and `src/core/lang/code/highlight.ts`**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Change:** Add (highlighter adapted from `alfred/apps/tui/src/view/markdown/code-highlight.ts`)
  - **Responsibilities:** file-type contract and lookup; the lowlight-backed highlighter.
  - **Current source:** `alfred/apps/tui/src/view/markdown/code-highlight.ts` (96 lines, `lowlight`; porting reference)
  - **Current shape:**

    ```ts
    None — Alfred highlights fenced code only
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    export type EditorKind = string;                                // "text" and "base" in v1; a notebook registers "notebook" later
    export type ViewSpec<S, I = S, C = unknown> = { id: string; readOnly?: boolean; decorations: readonly DecorationProvider<I>[];
                                       input?: (analysis: S, ctx: C) => I };   // per-frame provider input; default: analysis
    // C is declared by the language (Markdown: PreviewCtx); core/state/view-context.ts builds it from AppState
    // through a builder registered per file type id, so filetypes/ and lang/ never import core/state.
    export type EditorKindSpec<St = unknown> = { id: EditorKind; open(path: string, text: string): St };
    export class EditorKindRegistry { register(spec: EditorKindSpec<any>): void; get(id: EditorKind): EditorKindSpec | undefined }
    // "text" is built in (core/state creates the buffer); "base" is registered by features/bases; a notebook registers later.
    export type FileType<S = unknown> = {
      id: string;                                                   // "markdown", "base", "typescript", "text"
      match: { extensions?: readonly string[]; names?: readonly string[] };   // [".md"], ["Makefile"]
      editor: EditorKind;
      views: readonly ViewSpec<S>[];                                // first = default
      highlighter?: Highlighter;
      analyze?: (buf: TextBuffer, prev?: S) => S;                   // Markdown: parseDoc with block cache
    };
    // `Highlighter` is the kernel type from `src/core/kernel/view/types.ts`

    export class FileTypeRegistry {
      register(ft: FileType<any>): void;                            // duplicate id or extension throws at startup
      forPath(path: string): FileType;                              // extension → file name → `text`
      get(id: string): FileType | undefined;
    }

    // src/core/lang/code/highlight.ts
    export function lowlightHighlighter(language: string): Highlighter;   // highlights from up to 200 lines above
                                                                           // the requested range; cached per buffer version
    ```

    `app/main` registers `text`, `markdown` (`lang/markdown`), `base` (`features/bases`), and code file types (`lang/code`). Tree-sitter can replace lowlight behind `Highlighter` later without changing callers.

  - **Dependencies:** `lowlight`; TextBuffer
  - **Callers and wiring:** `update` (`forPath` on `fileLoaded`; `analyze` after edits); the kernel's `highlightMarks` (`Highlighter` → `mark` decorations); `lang/markdown` fenced code blocks.
  - **Invariants:** registry lookup is deterministic and pure; highlighting is viewport-bounded and never runs the whole file per keystroke; a highlighter error drops to plain text for that range.
  - **Verification:** RM261003ABZP-S12@R1, RM261003ABZP-V18@R1; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/features/links/resolve.ts` and `src/core/features/links/rename.ts`**
  - **Decisions:** RM261003ABZP-DES7@R3
  - **Change:** Add
  - **Responsibilities:** deterministic link resolution; format-preserving rename planning.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function resolveLink(ix: NoteIndex, from: string, raw: string): LinkTarget | { unresolved: string };
    // order: exact root path (with/without .md) → alias → basename candidates ranked by
    //        (same folder as `from`) → (shortest path) → (alphabetical)
    export function planRename(ix: NoteIndex, from: string, to: string, read: (p: string) => string): FileEdit[];
    // keeps link kind (wiki/md), alias, #heading / #^block; writes the shortest unique form of `to`
    ```

  - **Dependencies:** NoteIndex
  - **Callers and wiring:** `link.follow`, completion, backlinks, `file.rename`, `file.move` commands.
  - **Invariants:** resolution is a pure function of index contents; rename never touches text outside link spans.
  - **Verification:** RM261003ABZP-S4@R1, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2

- **`src/workspace/fs.ts` and `src/workspace/watcher.ts`**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES17@R1
  - **Change:** Add
  - **Responsibilities:** text reads with binary and size checks; atomic writes and directory watching with own-write suppression.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export async function readTextFile(path: string): Promise<TextFile | { refused: "binary" | "tooLarge" }> {
      const file = Bun.file(path);
      if (file.size > 16 * 1024 * 1024) return { refused: "tooLarge" };
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.subarray(0, 8192).includes(0)) return { refused: "binary" };
      let text: string;
      try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); } catch { return { refused: "binary" }; }
      const bom = text.startsWith("\uFEFF");
      return { text: bom ? text.slice(1) : text, bom, eol: text.includes("\r\n") ? "\r\n" : "\n", stamp: stampOf(path, text) };
    }
    export async function atomicWrite(path: string, text: string): Promise<Stamp> {   // text already has BOM + EOL restored
      const target = await realpathOrSelf(path);
      const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
      const fd = await open(tmp, "w", await modeOr(target, 0o644));
      try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp, target);                     // same directory → atomic on POSIX
      return stampOf(target, text);                  // { mtimeMs, size, hash }
    }
    export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
    // fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
    ```

  - **Dependencies:** `node:fs/promises`, `node:fs` (Bun-compatible)
  - **Callers and wiring:** effect runner for `read`, `write`, `create`, `rename`, `move`; `main` starts the watcher.
  - **Invariants:** temp files never appear in the index (prefix `.` is hidden); a failed write deletes its temp file.
  - **Verification:** RM261003ABZP-S1@R1, RM261003ABZP-V1@R1; RM261003ABZP-S12@R1, RM261003ABZP-V18@R1

- **`src/ui/editors/text-view.ts`, `src/ui/widgets/registry.ts`, and `src/ui/input.ts`**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Change:** Add
  - **Responsibilities:** paint RenderLine rows onto an OpenTUI buffer; paint widgets through painters keyed by widget type; pick the view for a window's editor kind; normalize input.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    // Only file family allowed to import @opentui/*
    export class EditorView extends Renderable {           // custom renderable, not Textarea
      constructor(ctx: RenderContext, private getView: () => TextViewInput) { super(ctx, { flexGrow: 1 }); }
      protected renderSelf(buf: OptimizedBuffer) {
        const { view, providers, analysis } = this.getView();
        for (const [row, line] of layoutText(view, providers, analysis).entries()) paintLine(buf, row, line, theme, widgetPainters);
      }
    }
    export const editorViews = new Map<EditorKind, (ctx: RenderContext, win: WindowId) => Renderable>();  // registered: text → EditorView, base → BaseView
    export function registerEditorView(kind: EditorKind, view: (ctx: RenderContext, win: WindowId) => Renderable): void;
    export const widgetPainters: Record<string, WidgetPainter>;                                        // image, embed, base, rule
    export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via max(escTimeoutMs, 20)
    ```

    Exact OpenTUI buffer and image APIs are confirmed against the pinned version in the first delivery item (the class above is illustrative).

  - **Dependencies:** `@opentui/core` (exact pin)
  - **Callers and wiring:** `ui/shell.ts` composes views; store subscription triggers `requestRender()`.
  - **Invariants:** UI never mutates AppState; all input becomes Actions.
  - **Verification:** RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V17@R1

- **`src/preview/server.ts`**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Change:** Add
  - **Responsibilities:** read-only preview server.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function startPreview(store: Store, root: string): { port: number; stop(): void } {
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0,
        fetch(req) {
          const host = req.headers.get("host");
          if (host !== `127.0.0.1:${server.port}` && host !== `localhost:${server.port}`) return new Response(null, { status: 403 });
          return route(req, store, root);              // "/", "/events", "/render", "/file/*"
        },
      });
      return { port: server.port, stop: () => server.stop(true) };
    }
    ```

  - **Dependencies:** `Bun.serve`; core `renderHtml`
  - **Callers and wiring:** effect runner for `startPreview`/`stopPreview`.
  - **Invariants:** no write routes; `/file/*` passes realpath containment and hidden-folder exclusion.
  - **Verification:** RM261003ABZP-S8@R1, RM261003ABZP-V11@R3

## Cross-cutting and Evolution

| Concern | Mechanism and canonical design location | Verification or reason not applicable |
|---|---|---|
| Security and privacy | No network except loopback preview with Host allowlist and realpath containment (RM261003ABZP-DES13@R2); config is data (TOML), never executed (RM261003ABZP-DES14@R1); no telemetry; notes never logged | RM261003ABZP-V11@R3 |
| Configuration and observability | XDG TOML config validated by schema; errors as notifications; `so --version`; `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content (RM261003ABZP-DES14@R1) | RM261003ABZP-V4@R2 |
| Performance and scalability | Viewport-only layout, block parse cache, worker index and search, frame coalescing, lazy image decode with cache (RM261003ABZP-DES16@R1) | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| Concurrency, retry, and idempotency | Single-threaded store; worker communicates by messages; saves serialized per path; autosave retry with backoff; own-write stamps make watcher events idempotent (RM261003ABZP-DES8@R2) | RM261003ABZP-V1@R1 |
| Migration and backfill | None — greenfield; Obsidian files are read as-is and written in place | None — no prior data format |
| Mixed-version compatibility | Obsidian file compatibility (Markdown, links, frontmatter, `.base`); Kanban `type` constant isolated in `core/features/bases/types.ts` and verified against an Obsidian-saved file (RM261003ABZP-DES12@R2) | RM261003ABZP-V10@R1 |
| Rollout and rollback | SemVer releases via release-please; users roll back by installing a previous release binary (RM261003ABZP-DES15@R2) | RM261003ABZP-V14@R1 |
| Known extension needs | Registries: commands and file-type-scoped keymaps (DES5), syntax extensions (DES6), block renderers and decoration providers (DES9), editor-kind views and widget painters (DES10), Bases view types (DES12), file types and highlighters (DES17) — RM261003ABZP-REQ11@R3 | RM261003ABZP-V16@R2 |
| Evolution toward code editing and notebooks | Kernel boundary (DES1) keeps editing language-neutral; future work adds registrations only: an LSP client is a workspace adapter whose results become `mark`/`line` decorations and file-type commands (`gd` → definition); tree-sitter replaces lowlight behind `Highlighter`; a notebook is a new editor kind whose cells each hold a `TextBuffer`. None of these is built in v1 (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3 deferrals) | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V18@R1 |

- **System transition:**

```text
empty repo → scaffold (tooling, CI, boundary test, shell) → editor usable → knowledge features → release binaries
                                  └→ rollback: previous release binary; files are plain Markdown, no state migration
```

- **Delivery constraints:** the boundary test and CI exist before feature code so violations never land; the OpenTUI paint and image APIs are confirmed against the pinned version before live-preview work depends on them; the Kanban `type` value is confirmed before Kanban ships.

## Success and Verification

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** This document
  - **Outcome:** across crash, external edit, and save failure scenarios, the file on disk is always a complete old or new version and dirty buffers are never overwritten without a prompt.
  - **Requirements:** RM261003ABZP-REQ1@R3
  - **Design:** RM261003ABZP-DES8@R2 - atomic write, own-write suppression, conflict rules
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S1@R1
      - **Scenario:** in a temp workspace: (a) kill the writer between write and rename (simulated by throwing after fsync); (b) modify an open clean file externally; (c) modify an open dirty file externally; (d) save `so`'s own buffer.
      - **Expected result:** (a) original content intact, no temp file left; (b) buffer reloads and `u` restores previous text; (c) conflict prompt appears, file and buffer unchanged until chosen; (d) no reload or conflict triggered.
      - **Method and target:** integration test on `workspace/fs.ts`, `workspace/watcher.ts`, and `core` conflict reducer
      - **Environment:** real file system (tmpdir), real `fs.watch`
      - **Unique risk:** per-file watch losing events after rename; self-triggered reload loops; partial writes.
      - **Predecessors:** None

- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** This document
  - **Outcome:** every command listed in RM261003ABZP-REQ2@R2 produces Neovim's result on the shared fixture cases.
  - **Requirements:** RM261003ABZP-REQ2@R2
  - **Design:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 - grammar, undo blocks, dot-repeat
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** table of `{ before text + cursor, keys, after text + cursor + register }` cases covering each motion, operator, text object, count, register, search, `:s`, undo/redo, and `.`; expected values recorded from Neovim 0.11 `--clean`.
      - **Expected result:** each case matches exactly.
      - **Method and target:** unit tests on `core/kernel/vim/engine.ts` `handleKey`
      - **Environment:** None — pure functions
      - **Unique risk:** subtle divergence (inclusive/exclusive motions, linewise yanks, cursor after undo).
      - **Predecessors:** None
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** feed a lone `\x1b` byte without kitty protocol, then `\x1b[A`, through `ui/input.normalizeKey` with `escTimeoutMs=50`.
      - **Expected result:** lone Esc yields `escape` after 50 ms ± 10 ms; the sequence yields `up` immediately.
      - **Method and target:** unit test on `ui/input.ts`
      - **Environment:** fake timers
      - **Unique risk:** Esc swallowed or arrow keys misread as Esc + letters.
      - **Predecessors:** None

- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** This document
  - **Outcome:** every command is reachable by name in the palette, leader sequences show which-key hints, pickers filter fuzzily, and config overrides apply or fail safely.
  - **Requirements:** RM261003ABZP-REQ3@R4
  - **Design:** RM261003ABZP-DES5@R2, RM261003ABZP-DES14@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V4@R2 — Keymap, which-key, palette, file-type scope, and config**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S3@R1
      - **Scenario:** (a) press `Space` and wait; (b) bind `"<leader>w" = "file.save"` in config and press it; (c) load a config with a syntax error on line 7; (d) set `XDG_CONFIG_HOME=relative/path`; (e) open the palette and type `back`; (f) bind `[filetypes.markdown.keys.normal] "<leader>w" = "link.backlinks"` alongside (b), press `<leader>w` in a note and in `sync.ts`; (g) press `gd` on `[[plan]]` in a note and on an identifier in `sync.ts`; (h) open the palette in `sync.ts` and type `follow`; (i) in `sync.ts`, run `:link.follow`.
      - **Expected result:** (a) which-key lists groups; (b) file saved; (c) notification names `config.toml:7` and defaults apply; (d) `~/.config/so/config.toml` used; (e) `link.backlinks` ranks first; (f) the note opens its backlinks, `sync.ts` saves; (g) the note follows the link, `sync.ts` does nothing; (h) `link.follow` is not listed; (i) the message line shows `not available for typescript files` and nothing changes.
      - **Method and target:** unit tests on `core/kernel/commands`, `workspace/config-file.ts`; component test through the OpenTUI test renderer for (a)
      - **Environment:** tmp config dirs; OpenTUI test renderer
      - **Unique risk:** config error crashing startup; overrides silently ignored; note keys leaking into other file types.
      - **Predecessors:** RM261003ABZP-V4@R1

- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** This document
  - **Outcome:** link following, completion, backlinks, and tags match the index; rename updates every reference while preserving format.
  - **Requirements:** RM261003ABZP-REQ4@R3
  - **Design:** RM261003ABZP-DES7@R3
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** workspace with `a/plan.md`, `b/plan.md`, `plan-x.md` (alias `plan`), `c/deep/plan.md`; resolve `[[plan]]` from `a/x.md`, from `root.md`, `[[b/plan]]`, `[[plan.md]]`, `[[note#H1#H2]]`, `[text](a/plan%20x.md)`.
      - **Expected result:** results follow the documented order exactly.
      - **Method and target:** unit tests on `core/features/links/resolve.ts`
      - **Environment:** None — in-memory index
      - **Unique risk:** nondeterministic or Obsidian-incompatible targets.
      - **Predecessors:** None
    - **RM261003ABZP-V6@R2 — Rename and link-mention preserve link formats**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** (a) rename `plan.md` → `projects/roadmap.md` with references `[[plan]]`, `[[plan|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)`, frontmatter `related: "[[plan]]"`, and an open dirty buffer containing `[[plan]]`; (b) run `link.linkMention` on an unlinked mention "Plan" of `plan.md` in an open dirty buffer and in a closed file.
      - **Expected result:** (a) all rewritten in place with kind, alias, subpath preserved and shortest unique path; the dirty buffer is edited in memory (not overwritten on disk); notification reports the file count. (b) only the mention span becomes `[[plan|Plan]]` (or `[[plan]]` when the text equals the basename); the open buffer is edited in memory and marked dirty; the closed file is written through the atomic write path; the mention moves from unlinked to linked in the backlinks result.
      - **Method and target:** unit tests on `planRename` and the mention span edit + integration test of the rename and `link.linkMention` commands
      - **Environment:** tmp workspace
      - **Unique risk:** broken links or clobbered unsaved edits.
      - **Predecessors:** RM261003ABZP-V6@R1

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** This document
  - **Outcome:** each element listed in RM261003ABZP-REQ5@R2 renders as specified, reveal follows the cursor line or block, and images use the best available protocol.
  - **Requirements:** RM261003ABZP-REQ5@R2
  - **Design:** RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V7@R2 — Layout golden tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** `test/fixtures/tour.md` (every element) laid out by `layoutText` with the Markdown `livePreview` provider at widths 60 and 100 with the cursor outside any block, on a bold line, inside a table, inside a callout; the same note in `source` view.
      - **Expected result:** `RenderLine[]` serialized to text + style tokens matches committed goldens.
      - **Method and target:** unit tests on `layoutText` + `lang/markdown/live-preview.ts`
      - **Environment:** None — pure
      - **Unique risk:** reveal or hiding regressions; broken table alignment; Markdown logic leaking into the kernel view.
      - **Predecessors:** RM261003ABZP-V7@R1
    - **RM261003ABZP-V8@R1 — Image protocol selection**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** render a note with a PNG in the OpenTUI test renderer with capabilities kitty / sixel / none / `images="off"`.
      - **Expected result:** kitty or sixel placement, block characters, or `[image: name.png]` placeholder respectively.
      - **Method and target:** component test on `ui/editors/text-view.ts` and the `image` widget painter
      - **Environment:** OpenTUI test renderer with mocked capabilities
      - **Unique risk:** images breaking layout or crashing on unsupported terminals.
      - **Predecessors:** None

- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** This document
  - **Outcome:** `:Today` and template insertion produce the same text Obsidian's core plugins would for the supported tokens.
  - **Requirements:** RM261003ABZP-REQ6@R2
  - **Design:** RM261003ABZP-DES11@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S6@R1
      - **Scenario:** format 2026-10-03T09:05 with every supported token and `[literal]`; expand a template containing all variables; compute daily paths for `YYYY-MM-DD` and `YYYY/MM/YYYY-MM-DD`; run `:Today` twice.
      - **Expected result:** strings equal Moment.js output for the same tokens; unsupported tokens stay literal; second `:Today` opens the existing file without changing it.
      - **Method and target:** unit tests on `core/time`, `core/features/notes`; integration test for `:Today`
      - **Environment:** fixed clock; tmp workspace
      - **Unique risk:** wrong dates, overwritten daily notes.
      - **Predecessors:** None

- **RM261003ABZP-S7@R1 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** This document
  - **Outcome:** table and Kanban views show the correct rows, edits write valid frontmatter, and unsupported layouts fall back safely.
  - **Requirements:** RM261003ABZP-REQ7@R2
  - **Design:** RM261003ABZP-DES12@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V10@R1 — Bases evaluation, edit, and compatibility**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S7@R1
      - **Scenario:** fixtures ported from Alfred's Bases tests plus a Kanban `.base` saved by Obsidian 1.14+; edit a cell; move a card; open a `cards` view; group by a formula.
      - **Expected result:** rows and order match fixtures; frontmatter patched with comments and order preserved; card move sets the property; `cards` opens as table with notice; moving is disabled for formula grouping.
      - **Method and target:** unit tests on `core/features/bases`; integration test of write-back
      - **Environment:** tmp workspace
      - **Unique risk:** YAML corruption; Kanban type mismatch with Obsidian.
      - **Predecessors:** None

- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** This document
  - **Outcome:** the browser follows edits within 300 ms and the server rejects foreign hosts and out-of-workspace paths.
  - **Requirements:** RM261003ABZP-REQ8@R2
  - **Design:** RM261003ABZP-DES13@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V11@R3 — Preview server behavior and safety**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S8@R1
      - **Scenario:** start preview; request with Host `evil.test:<port>`; request `/file/..%2f..%2fetc/passwd`; request a symlink pointing outside; request `/file/.git/config`; dispatch an edit and measure time to the SSE event; switch the active buffer to `scripts/sync.ts`; with an SSE client connected, run `:PreviewStop`; with `sync.ts` active, run `:Preview`.
      - **Expected result:** 403; 404; 404; 404; SSE `doc` event < 300 ms after the edit; no `doc` event for the switch to `sync.ts`, and `/render` still returns the last note; the client receives a `stopped` event before the connection closes and the port stops accepting connections; `:Preview` from `sync.ts` shows `not available for typescript files` and starts no server; server bound only to 127.0.0.1.
      - **Method and target:** integration test on `preview/server.ts`
      - **Environment:** real `Bun.serve`, tmp workspace with symlink
      - **Unique risk:** DNS rebinding, traversal, network exposure.
      - **Predecessors:** RM261003ABZP-V11@R1, RM261003ABZP-V11@R2

- **RM261003ABZP-S9@R1 — Performance targets hold**
  - **Definition:** This document
  - **Outcome:** the targets in RM261003ABZP-REQ9@R2 are met on the reference machine and gated at 2× in CI.
  - **Requirements:** RM261003ABZP-REQ9@R2
  - **Design:** RM261003ABZP-DES16@R1, RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES7@R3, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V12@R2 — Keystroke and open-file benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** open the 5,000-line fixture note in live preview, and the 5,000-line TypeScript fixture in source view with highlighting, in the OpenTUI test renderer (120×40); send 200 mixed keystrokes (`j`, `w`, `i` + text + `Esc`, `dd`, `u`) to each; measure input → frame complete; measure open time; scroll each file for 2 s with held `j` and repeated `Ctrl-d`/`Ctrl-u` and record frame times with the in-process frame metrics (`RM261003ABZP-RF2`).
      - **Expected result:** for both files, p95 < 16 ms and open < 50 ms on the reference machine; scrolling frame time p95 < 16.7 ms (60 fps); CI median of 5 runs < 32 ms, < 100 ms, and < 33.4 ms.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** OpenTUI test renderer; fixed CI runner type
      - **Unique risk:** full-document parse, layout, or highlighting sneaking into the keystroke path.
      - **Predecessors:** RM261003ABZP-V12@R1
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** generate a 10,000-note workspace; start `so`; record time to first interactive frame and to index ready; type during indexing.
      - **Expected result:** first frame < 200 ms; index ready < 3 s; keystrokes during indexing still meet the V12 budget.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** generated fixture; real worker
      - **Unique risk:** indexing blocking the main thread.
      - **Predecessors:** None

- **RM261003ABZP-S10@R1 — Development, CI, and release are fast and automatic**
  - **Definition:** This document
  - **Outcome:** `bun run check` < 30 s; CI < 3 min; release produces four checksummed binaries that start.
  - **Requirements:** RM261003ABZP-REQ10@R3
  - **Design:** RM261003ABZP-DES15@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V14@R1 — Check timing, CI timing, and release dry run**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S10@R1
      - **Scenario:** time `bun run check` locally; read CI run durations; run the release workflow on a pre-release tag.
      - **Expected result:** < 30 s; < 3 min; GitHub Release with 4 binaries + `SHA256SUMS`; smoke jobs print `so <version>` on macOS and Linux.
      - **Method and target:** non-test check on CI and release workflows
      - **Environment:** GitHub Actions
      - **Unique risk:** slow feedback loops; binaries missing OpenTUI's native library.
      - **Predecessors:** None

- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored**
  - **Definition:** This document
  - **Outcome:** boundary violations fail CI; features extend by registration; terminal state is restored on every exit path; standards are followed.
  - **Requirements:** RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V15@R2 — Import boundary test**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** scan every `src/**/*.ts` with `Bun.Transpiler.scanImports`; include two deliberate violation fixtures: a core file importing `node:fs`, and a `src/core/kernel/**` file importing `src/core/lang/markdown`.
      - **Expected result:** core imports only core and allowed parsing packages; only `src/ui/**` imports `@opentui/*`; `src/core/kernel/**` imports only `src/core/kernel/**`; both fixtures fail.
      - **Method and target:** `test/boundaries.test.ts`
      - **Environment:** None
      - **Unique risk:** layering eroding silently; Markdown assumptions creeping into the kernel.
      - **Predecessors:** RM261003ABZP-V15@R1
    - **RM261003ABZP-V16@R2 — Registration-only extension**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** a test module registers a command, a keymap, a syntax extension, and a block renderer; a second test module registers a `csv` file type with a highlighter, a decoration provider, and a `csv`-scoped keymap; a third registers an editor kind `grid`, a `.grid` file type using it, and a UI view for it — none touches other modules.
      - **Expected result:** the command runs from the palette and keymap; the syntax renders through the renderer; opening `data.csv` uses the `csv` file type, its highlighter marks, its decorations, and its key binding; opening `t.grid` creates window content `{editor: "grid"}` and the shell paints the registered view, with no edit to dispatch code.
      - **Method and target:** unit test across `core/kernel/commands`, `core/filetypes`, `core/lang/markdown`, `core/kernel/view`; component test for `ui/editors` registration
      - **Environment:** None
      - **Unique risk:** hidden switch statements that require edits to extend.
      - **Predecessors:** RM261003ABZP-V16@R1
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** in a PTY, start `so`, then exit by `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception; set `NO_COLOR=1` in one run.
      - **Expected result:** after each exit the PTY is back on the main screen with cursor visible, mouse and kitty keyboard modes off; the `NO_COLOR` run emits no colour SGR codes.
      - **Method and target:** e2e PTY test in `test/e2e/`
      - **Environment:** real PTY (`Bun.spawn` with a pseudo-terminal), headless terminal emulator to read state
      - **Unique risk:** leaving the user's terminal broken.
      - **Predecessors:** None

- **RM261003ABZP-S12@R1 — Any text file opens safely on a language-neutral core**
  - **Definition:** This document
  - **Outcome:** non-Markdown UTF-8 files open in source view with highlighting where recognized, binary and oversized files are refused without writes, and saves keep the file's BOM and line endings. Keeping note-only keys and commands out of other file types is part of RM261003ABZP-S3@R1 (RM261003ABZP-V4@R2).
  - **Requirements:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V18@R1 — Open text, code, binary, and oversized files**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S12@R1
      - **Scenario:** in a tmp workspace: (a) `:e scripts/sync.ts`, `:e config.yaml`, `:e notes.txt`, `:e Makefile`; (b) `:e photo.png` and a file with a NUL byte at offset 100; (c) a file containing invalid UTF-8; (d) a generated 17 MiB text file; (e) edit and save a CRLF file with a UTF-8 BOM.
      - **Expected result:** (a) each opens in source view; `.ts` and `.yaml` lines carry highlighter style tokens, `notes.txt` resolves to `text` and `Makefile` resolves to `makefile` by file name; (b, c) `binary file — not opened`, no buffer created; (d) `file too large — not opened (limit 16 MiB)`; (e) the saved bytes keep the BOM and every `\r\n`.
      - **Method and target:** unit tests on `core/filetypes` and `workspace/fs.readTextFile`; integration test of open and save through the store
      - **Environment:** tmp workspace; real file system
      - **Unique risk:** binary files corrupted by a text save; file-type mismatch; BOM or line endings lost on save.
      - **Predecessors:** None

## Design Decisions and Traceability

- **RM261003ABZP-DES1@R2 — One process, one package, four layers, and a language-neutral kernel, with a tested import boundary**
  - **Requirements:** RM261003ABZP-REQ11@R3 - pure core, enforced boundaries, language-neutral kernel; RM261003ABZP-REQ10@R3 - fast checks
  - **Decision:** `src/core` (pure), `src/workspace` (I/O), `src/ui` (OpenTUI), `src/preview` (HTTP), wired only in `src/app`. Inside the core, `kernel/` (text, editor, vim, commands, view) imports only `kernel/`; `filetypes/`, `lang/`, and `features/` build on it; `state/` and `config/` compose everything. A `bun test` boundary test using `Bun.Transpiler.scanImports` enforces both the layer rules and the kernel rule.
  - **Explanation:** System Architecture diagram; Project Structure; `test/boundaries.test.ts`. One package keeps install and CI fast; the test needs no TypeScript API (`RM261003ABZP-RF13`). The kernel rule is what keeps `so` able to become a code or notebook editor: Markdown cannot leak into editing, and a new language is a new folder plus registrations.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred needed six packages because of its kernel; `so` has no server boundary. `rm261003abzp-roadmap-context.md@R2` - scope change: leave room for code editing and notebooks.
  - **Research:** `RM261003ABZP-RF1` - contain OpenTUI to the UI layer; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3). `RM261003ABZP-RF13` - avoid TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** folder conventions rather than package boundaries; rejected a Turborepo monorepo (slower, more config) and dependency-cruiser (TS 7 issue). Rejected separate `editor-core` and `markdown` packages: same isolation as the kernel rule but with workspace and build overhead.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-DES1@R1

- **RM261003ABZP-DES2@R2 — One store with a pure reducer and data-only effects**
  - **Requirements:** RM261003ABZP-REQ11@R3 - stable, testable foundations; RM261003ABZP-REQ1@R3 - autosave and conflicts; RM261003ABZP-REQ9@R2 - predictable rendering
  - **Decision:** `update(state, action) → { state, effects }`; effects are plain data executed by `app/effects.ts`; results return as actions.
  - **Explanation:** Action and Effect protocol; AppState; `src/core/state/update.ts`. Every behavior (autosave timing, conflict choice, rename) is a pure function test.
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts` - Alfred's vim core already returns effects instead of performing them.
  - **Research:** None
  - **Tradeoffs:** an extra indirection for I/O; rejected UI components holding state (hard to test, the Ink/React pattern Alfred needed a compositor around).
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** RM261003ABZP-DES2@R1

- **RM261003ABZP-DES3@R1 — Line-array TextBuffer behind an interface, with vim undo blocks**
  - **Requirements:** RM261003ABZP-REQ2@R2 - undo per undo block; RM261003ABZP-REQ9@R2 - 5,000-line target
  - **Decision:** immutable line array with structural sharing; `apply(edit)` returns an inverse; undo stack of blocks (one Normal command or one Insert session).
  - **Explanation:** TextBuffer model; `src/core/kernel/text/text-buffer.ts`. A piece table can replace the implementation without changing callers.
  - **Evidence:** `alfred/apps/tui/src/view/editor/text-buffer.ts` - single-string buffer (186 lines) as reference.
  - **Research:** `RM261003ABZP-RF6` - line array adequate at ≤ 5,000 lines; undo block = typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** O(lines) splices on huge files; rejected OpenTUI's native `EditBuffer` as source of truth (couples core to a 0.x UI library).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES4@R1 — Table-driven vim engine**
  - **Requirements:** RM261003ABZP-REQ2@R2 - core vim command set, Esc timeout
  - **Decision:** a pure key-sequence parser for `[count]["reg][count]op[count](motion|textobject)` with motion, operator, and text-object tables; mode machine (normal, insert, visual char/line, cmdline); last-change record for `.`; ex command table.
  - **Explanation:** `src/core/kernel/vim/engine.ts`; Esc timeout handled in `ui/input.ts` (RM261003ABZP-DES10@R2).
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts:15` - Alfred supports only two modes with a hard-coded pending set.
  - **Research:** `RM261003ABZP-RF5` - kitty keyboard protocol, 50 ms timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** no macros or Visual block in v1 (deferred); rejected embedding Neovim (user decision).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES5@R2 — Command registry and file-type-scoped keymap trie as the single extension point for actions**
  - **Requirements:** RM261003ABZP-REQ3@R4 - leader, which-key, palette, config, file-type scope; RM261003ABZP-REQ11@R3 - extend by registration
  - **Decision:** every action is a named `Command`, optionally limited to file types; keys map to command ids through a trie keyed by `{mode, filetype?}`, with the file-type level checked before the global level; which-key, palette, help, and config overrides (`keys.<mode>`, `filetypes.<id>.keys.<mode>`) read the same registry. Note keys (`gd`, `Enter` on links, `<leader>m`, `<leader>x`) are bound for `markdown` only.
  - **Explanation:** `src/core/kernel/commands/registry.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input - LazyVim style; `rm261003abzp-roadmap-context.md@R2` - keymaps scoped by mode and file type.
  - **Research:** None
  - **Tradeoffs:** commands must be pure (state + effects), which forbids quick ad-hoc I/O in commands; accepted for testability. Rejected VS Code-style `when` expressions: a file-type scope covers v1 and the known code-editor need with far less machinery.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** RM261003ABZP-DES5@R1

- **RM261003ABZP-DES6@R1 — micromark/mdast with Obsidian extensions and block-level reparse**
  - **Requirements:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2
  - **Decision:** port Alfred's micromark + GFM + math parsing and Obsidian syntax into `core/lang/markdown` as the `markdown` file type's `analyze`; split into blocks and reparse only changed blocks; one `Doc` feeds layout, index, and HTML.
  - **Explanation:** Doc model; `src/core/lang/markdown/doc.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` - existing micromark pipeline.
  - **Research:** `RM261003ABZP-RF7` - micromark conformant but not incremental; block reparse meets budgets; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block splitting must handle lists, fences, and frontmatter carefully; rejected OpenTUI's tree-sitter Markdown (UI-layer dependency, no Obsidian syntax) and Lezer (skips link reference validation; another parser to learn).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES7@R3 — Worker-built in-memory index with a documented resolution rule**
  - **Requirements:** RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename; RM261003ABZP-REQ3@R4 - pickers and full-text search; RM261003ABZP-REQ9@R2 - non-blocking index
  - **Decision:** a Bun `Worker` lists every non-excluded workspace file, summarizes Markdown notes, and answers full-text queries over Markdown notes and other text files that pass the REQ1 text checks; the main thread holds `NoteIndex` (summaries plus the file list) under `core/features/links`; resolution order: root path → alias → basename ranked by same folder, shortest path, alphabetical; `planRename` rewrites link spans only; `link.linkMention` wraps one unlinked mention in `[[…]]` in its source note through a span edit (open buffer in memory, closed file via `write`).
  - **Explanation:** NoteSummary and NoteIndex; `resolve.ts`; `rename.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred used SQLite; `so` has no persistence need for the index.
  - **Research:** `RM261003ABZP-RF8` - duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Tradeoffs:** reindex on every start (< 3 s target); searching all text files reads more bytes than notes alone, bounded by `.gitignore` exclusion and the 16 MiB per-file limit; rejected SQLite (persistence and schema cost without need) and ripgrep (external binary).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES7@R1, RM261003ABZP-DES7@R2

- **RM261003ABZP-DES8@R2 — Atomic saves, directory watching, own-write stamps, and trash adapters**
  - **Requirements:** RM261003ABZP-REQ1@R3 - safe file management
  - **Decision:** `atomicWrite` (realpath → same-dir temp → fsync → chmod → rename); `fs.watch(root, {recursive:true})` with per-path debounce and own-write stamps; trash via freedesktop spec on Linux and, on macOS, `/usr/bin/trash` when present, else `NSFileManager` through JXA (`osascript -l JavaScript` with the path as an argument), both without a permission prompt; else typed confirmation; autosave policy and conflict rules live in core.
  - **Explanation:** `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow.
  - **Evidence:** `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - autosave queue reference; `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-research.md` RF11 - Finder automation prompts for Automation permission, while `/usr/bin/trash` (macOS 15+) and `NSFileManager` move to the trash without a prompt; RF8 - recursive `fs.watch` confirmed on macOS and Linux; delivered in `src/workspace/trash.ts` and `watcher.ts` (PR #1).
  - **Research:** `RM261003ABZP-RF11` - fsync, same directory, directory watching, undoable reload; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (current RM261003ABZP-REQ1@R3)
  - **Tradeoffs:** rename-based saves replace hard links (acceptable for notes); recursive `fs.watch` relies on platform support in Bun on macOS and Linux — confirmed by DI1 (RF8 above) and re-proved in CI on both platforms.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** RM261003ABZP-DES8@R1

- **RM261003ABZP-DES9@R3 — Viewport-only text view with decorations; Markdown live preview as a decoration provider**
  - **Requirements:** RM261003ABZP-REQ5@R2 - live preview; RM261003ABZP-REQ9@R2 - smooth scrolling; RM261003ABZP-REQ11@R3 - language-neutral kernel, registered decoration providers
  - **Decision:** the kernel's pure `layoutText` produces `RenderLine[]` for visible rows only from text plus decorations (`mark`, `replace`, `widget`, `line`) returned by the view's providers and the file type's highlighter. Markdown live preview is the `livePreview` provider in `lang/markdown`: the cursor line reveals inline syntax, a cursor inside a multi-line block reveals the whole block, folded callouts and expanded embeds follow the window's `folds` set, block renderers are registered per block kind, and widgets (image, embed, base) reserve rows. Source view uses highlighter marks only — the same path code files use. The live-preview input (`MarkdownViewInput`: the `Doc` plus a read-only `PreviewCtx`) comes from the Markdown views' `input` hook, so neither the kernel nor the UI knows about Markdown.
  - **Explanation:** FileType and Decoration model; RenderLine model; `src/core/kernel/view/text-view.ts`; `src/core/lang/markdown/live-preview.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/editor/reveal-units.ts` - reveal units reference. Industry precedent: CodeMirror 6 decorations (the basis of Obsidian's live preview), Neovim extmarks and conceal, VS Code decorations.
  - **Research:** `RM261003ABZP-RF7` - per-element reveal in Obsidian; block reveal for multi-line constructs; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal; one decoration list per frame instead of direct painting, accepted because it is bounded by visible lines; rejected OpenTUI `MarkdownRenderable` conceal (UI-owned parsing, no Obsidian syntax) and a Markdown-specific `layoutViewport` (would make every future language reimplement layout).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES9@R1, RM261003ABZP-DES9@R2

- **RM261003ABZP-DES10@R2 — OpenTUI shell with editor-kind views, widget painters, normalized input, and guaranteed terminal restore**
  - **Requirements:** RM261003ABZP-REQ2@R2 - Esc, cursor shape; RM261003ABZP-REQ3@R4 - explorer, overlays; RM261003ABZP-REQ5@R2 - images; RM261003ABZP-REQ7@R2 - Bases views; RM261003ABZP-REQ11@R3 - restore, `NO_COLOR`, terminal support, registration
  - **Decision:** `@opentui/core` pinned exactly; layout of explorer, bufferline, window splits, side panel, statusline, cmdline, overlays; each window renders through the view registered for its editor kind (`text` → custom `EditorView` renderable painting `RenderLine[]`; `base` → Bases view); widgets are painted by painters registered per widget type (`image` via OpenTUI's auto protocol kitty → sixel → blocks, `embed`, `base`, `rule`); input normalized to `Key` with kitty keyboard protocol and Esc timeout; theme tokens with `NO_COLOR`; restore on exit, signals, and uncaught errors.
  - **Explanation:** `src/ui/*`; `src/ui/editors/`; `src/ui/widgets/`.
  - **Evidence:** `alfred/apps/tui/src/terminal/shutdown.ts` - restore coordinator reference; Context7 `/anomalyco/opentui`.
  - **Research:** `RM261003ABZP-RF1`, `RM261003ABZP-RF2`, `RM261003ABZP-RF4`, `RM261003ABZP-RF5`; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** dependence on a 0.x library contained to `src/ui`; rejected Ink (React redraw cost) and a custom renderer (upfront cost). A notebook later adds one editor view; no shell change.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES9@R3
  - **Predecessors:** RM261003ABZP-DES10@R1

- **RM261003ABZP-DES11@R1 — Shared Moment-subset formatter, pure template expansion, and daily-note commands**
  - **Requirements:** RM261003ABZP-REQ6@R2 - daily notes and templates; RM261003ABZP-REQ7@R2 - Bases date formatting
  - **Decision:** `core/time/format.ts` implements the documented token subset and `[literal]`; `core/features/notes` computes daily paths (with `/` subfolders) and expands `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}`; commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`.
  - **Explanation:** `src/core/time/format.ts`; `src/core/features/notes/*`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input.
  - **Research:** `RM261003ABZP-RF10` - Moment tokens, `{{time:FORMAT}}`, subfolders; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Tradeoffs:** rare tokens unsupported (kept literal); rejected Moment.js and Day.js dependencies (maintenance mode; extra weight).
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** None

- **RM261003ABZP-DES12@R2 — Ported Bases engine as a registered `base` editor kind, with table and Kanban view models and YAML-preserving write-back**
  - **Requirements:** RM261003ABZP-REQ7@R2 - Bases table and Kanban views; RM261003ABZP-REQ11@R3 - editor kinds by registration
  - **Decision:** port `alfred/packages/vault/src/domain/bases/*` (parser, evaluator, expression, yaml-patcher) and `alfred/packages/view-model/src/base/*` row and board rules into `core/features/bases`; `.base` is registered as file type `base` with editor kind `base`, so opening it puts `{editor:"base", path, view, cursor}` in the window; view models `TableModel` and `KanbanModel`; unknown layouts map to `TableModel` with a notice; the Kanban `type` string is one constant verified against an Obsidian 1.14+ file; edits become `write` effects through the atomic save path; embeds render through a `base` block renderer and `base` widget painter.
  - **Explanation:** `src/core/features/bases/*`; `src/ui/editors/` Bases view.
  - **Evidence:** `alfred/packages/vault/src/domain/bases/parser.ts:19`, `evaluator.ts:164` - no file-system or Bun imports (context assumption).
  - **Research:** `RM261003ABZP-RF9` - layouts, Kanban rules; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - **Tradeoffs:** follows an early-access Obsidian layout; guarded by the constant, a fixture, and the table fallback. Bases is the first non-text editor kind, so the seam a notebook needs is exercised in v1 rather than designed speculatively.
  - **Dependencies:** RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES12@R1

- **RM261003ABZP-DES13@R2 — `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering**
  - **Requirements:** RM261003ABZP-REQ8@R2 - read-only preview
  - **Decision:** `preview/server.ts` binds `127.0.0.1:0`, checks Host, serves a page shell, SSE `/events` (`doc` and `stopped` events), `/render` fragments from core `renderHtml(doc)`, and contained `/file/*`; the page loads KaTeX and Mermaid from jsDelivr and falls back to showing source when offline. `:Preview` is a Markdown-only command and the page follows Markdown notes only; switching to another file type sends no `doc` event (flow-level refinement, revision retained).
  - **Explanation:** Preview HTTP routes; `src/preview/server.ts`; `src/core/lang/markdown/html.ts`.
  - **Evidence:** user decision "no Next.js".
  - **Research:** `RM261003ABZP-RF12` - binding, Host check, containment, SSE; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Tradeoffs:** math and diagrams need network in the browser (fallback to source); rejected bundling KaTeX/Mermaid into the binary (multi-MB size) and WebSocket (bidirectional not needed).
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3
  - **Predecessors:** RM261003ABZP-DES13@R1

- **RM261003ABZP-DES14@R1 — TOML config at XDG path validated by schema; per-workspace state at XDG state path**
  - **Requirements:** RM261003ABZP-REQ3@R4 - configuration and state
  - **Decision:** `Bun.TOML.parse` + zod schema (`core/config/schema.ts`); config path honors XDG rules (relative values ignored); invalid config → error notice + defaults; state JSON at `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json` holding recent notes, jump list, open buffers, window layout.
  - **Explanation:** AppConfig; `src/workspace/config-file.ts`; `src/workspace/state-file.ts`.
  - **Evidence:** `rm261003abzp-research.md` S21, S9, S30.
  - **Research:** `RM261003ABZP-RF15` - TOML, XDG rules, state home; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4)
  - **Tradeoffs:** TOML instead of the proposal's `config.ts` — no code execution and simpler validation, at the cost of no scripting in config (agent decision under delegation).
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** None

- **RM261003ABZP-DES15@R2 — Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile**
  - **Requirements:** RM261003ABZP-REQ10@R3 - fast checks, CI, release; RM261003ABZP-REQ11@R3 - Conventional Commits, SemVer
  - **Decision:** Bun (exact version in `packageManager`), TypeScript 7 `tsc --noEmit` strict, Biome, knip, `bun test` (unit colocated; component via OpenTUI test renderer; few PTY e2e); `bun run check` = biome check + tsc + knip + boundary test + unit tests; CI jobs `check` and `test` (component, e2e, bench) in parallel with Bun cache, triggered on pull requests only, a newer push cancelling the superseded run; release-please on `main`, which calls the release workflow through `workflow_call` when it creates a release (a manually pushed `v*` tag also triggers it); release workflow: `bun install --os="*" --cpu="*"`, compile `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64`, `bun-linux-arm64` with `OPENTUI_LIBC=glibc` defined for Linux, `SHA256SUMS`, smoke `so --version` natively for each target (`macos-15` arm64, `macos-15-intel` x64, `ubuntu-24.04` x64, `ubuntu-24.04-arm` arm64) before publishing.
  - **Explanation:** Project Structure (`package.json`, `.github/workflows/*`).
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's eight CI groups are the anti-pattern avoided; user decision 2026-10-03 for PR-only CI (private repository, billed macOS minutes); `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-research.md` RF7 - one runner cross-compiles all four targets, and only a native runner proves each binary starts; RF9 - a release created by release-please with `GITHUB_TOKEN` does not trigger tag workflows, so the build is wired to its outputs; delivered in `.github/workflows/` (PR #1).
  - **Research:** `RM261003ABZP-RF3`, `RM261003ABZP-RF13`, `RM261003ABZP-RF14`; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R3)
  - **Tradeoffs:** unsigned macOS binaries (signing deferred); release-please adds a bot PR; pushes to `main` run no CI, so `main` relies on the pull-request run of its merge head; four smoke runners add billed macOS minutes per release only.
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** RM261003ABZP-DES15@R1

- **RM261003ABZP-DES16@R1 — Performance by construction plus benchmark gates**
  - **Requirements:** RM261003ABZP-REQ9@R2 - performance targets
  - **Decision:** viewport-only layout (DES9), block parse cache (DES6), worker index and search (DES7), frame coalescing (one render per input burst), first frame before indexing, lazy image decode with an LRU cache (64 MiB), and benchmarks through the OpenTUI test renderer gated at 2× (median of 5) in CI.
  - **Explanation:** Keystroke to frame and Startup flows; `test/bench/`.
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's 64 MiB image budget precedent.
  - **Research:** `RM261003ABZP-RF2` - in-process metrics; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Tradeoffs:** benchmarks add CI time (bounded by the 3 min budget); terminal display latency is outside the measurement.
  - **Dependencies:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES9@R3
  - **Predecessors:** None

- **RM261003ABZP-DES17@R1 — File-type registry, highlighter interface, and text-file open policy**
  - **Requirements:** RM261003ABZP-REQ1@R3 - any text file, binary and size guard, BOM; RM261003ABZP-REQ3@R4 - file-type scope; RM261003ABZP-REQ11@R3 - file types, highlighters, decoration providers, editor kinds by registration
  - **Decision:** a `FileTypeRegistry` maps a path to a `FileType` (extension, then file name, then the built-in `text` fallback); a file type declares its editor kind (an open string; non-`text` kinds register an `EditorKindSpec` in core, which creates the window state, and a UI view in `editorViews`, which paints it), views with decoration providers and an optional `input` hook whose context type the language declares and `core/state` builds, optional `Highlighter` (a kernel interface), and optional `analyze` hook. Note-only commands, including `:Preview`, are limited to `markdown`. v1 registers `text`, `markdown`, `base`, and code file types backed by one lowlight `Highlighter` (viewport-bounded, cached per buffer version). `workspace/fs.readTextFile` refuses files over 16 MiB and files with a NUL in the first 8 KiB or invalid UTF-8, strips and remembers a BOM and line separator; saves restore both.
  - **Explanation:** FileType and Decoration model; Open a file flow; `src/core/filetypes/registry.ts`; `src/core/lang/code/highlight.ts`; `src/workspace/fs.ts` `readTextFile`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R2` - "Apply all six" decision; `alfred/apps/tui/src/view/markdown/code-highlight.ts` - lowlight precedent. Industry precedent: Neovim `filetype` + ftplugins, VS Code language contributions, Git's NUL-byte binary heuristic.
  - **Research:** None - the decision reuses existing findings (RF6 pure text model, RF7 parse and reveal).
  - **Tradeoffs:** lowlight is regex-based and not incremental, so very long multi-line constructs above the 200-line look-back can highlight wrongly; accepted for v1 and replaceable by tree-sitter behind `Highlighter`. Rejected adding tree-sitter now (WASM grammars, build and size cost without a v1 need) and a generic notebook-ready `Document` abstraction (speculative; editor kinds already cover it). The 16 MiB limit is a fixed constant, not configuration.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES8@R2
  - **Predecessors:** None

| Current requirement | Design decision | Canonical design location | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; `src/core/filetypes/`; Open a file and Save and external change flows | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | `src/core/kernel/text/`, `src/core/kernel/editor/`, `src/core/kernel/vim/`, `src/ui/input.ts` | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, config, state, file-type scope | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES17@R1 | `src/core/kernel/commands/`, `src/ui/overlays/`, `src/workspace/config-file.ts`, `state-file.ts` | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links | RM261003ABZP-DES7@R3, RM261003ABZP-DES6@R1 | `src/core/features/links/` | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | `src/core/lang/markdown/`, `src/core/kernel/view/`, `src/ui/editors/`, `src/ui/widgets/` | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | `src/core/time/`, `src/core/features/notes/` | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | `src/core/features/bases/`, `src/ui/editors/` | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - preview | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R1 | `src/preview/`, `src/core/lang/markdown/html.ts` | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-DES16@R1 | Keystroke and Startup flows; `test/bench/` | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R3 - dev, CI, release | RM261003ABZP-DES15@R2, RM261003ABZP-DES1@R2 | `package.json`, `.github/workflows/` | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1 | `test/boundaries.test.ts`, `src/core/kernel/`, `src/core/filetypes/`, registries, `src/ui/shell.ts` | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

## Unresolved Items

None — open technical confirmations are delivery constraints with named verification, not design decisions. DI1 confirmed the OpenTUI paint, buffer, and test-renderer APIs at `@opentui/core` 0.5.14 and recursive `fs.watch` on macOS and Linux. The OpenTUI image API at the pinned version (before DI3 relies on it) and the Kanban `type` value (DI4) remain.

## Approval

- **Requirement baseline:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 … RM261003ABZP-REQ10@R3, RM261003ABZP-REQ11@R3
- **Approved design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R2, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
- **Approved success and verification:** RM261003ABZP-S1@R1 … RM261003ABZP-S12@R1; RM261003ABZP-V1@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1, RM261003ABZP-V4@R2, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1, RM261003ABZP-V9@R1, RM261003ABZP-V10@R1, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V13@R1, RM261003ABZP-V14@R1, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1
- **Approval evidence:** User delegated all decisions on 2026-10-03 ("you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"); the agent approved this design, the DES2/DES7/DES9/DES13 R2 revisions from the UI system-impact assessment, and the V6/V11 R2 verification revisions, under that delegation. On 2026-10-03 the user approved the Markdown-first, language-neutral core by selecting "Apply all six (Recommended)" (kernel split, FileType registry, decorations, file-type keymaps, highlighter interface, open any text file); this produced DES1@R2, DES5@R2, DES7@R3, DES9@R3, DES10@R2, DES12@R2, DES17@R1, S12@R1, V18@R1, and the V4/V7/V12/V15/V16 R2 revisions. The user then delegated every remaining sub-decision on 2026-10-03 ("you self-drive everything. Everything is good now, don't need to stop"), covering the 16 MiB limit, binary check, BOM preservation, all-file picker and text-file search, `[filetypes.<id>.keys.<mode>]` config, no statusline file-type segment, S12/V18, the TypeScript benchmark, and the lowlight look-back. Post-DI1 synchronization approved by the user on 2026-10-03: DES8@R2 (macOS trash without a prompt) and DES15@R2 (pull-request-only CI, `workflow_call` release, native smoke).
``````

- **RM261003ABZP-DES15@R3, RM261003ABZP-S10@R1, RM261003ABZP-V14@R1 — Manual releases with a non-publishing dry run**
  - **Archived at:** 2026-10-03T22:14:09Z
  - **Change type:** Revised
  - **Reason:** On 2026-10-04 the user decided that nothing is released automatically: a release happens only when the user asks, through a pushed `v*` tag, and phase exits run a release dry run that publishes nothing (RM261003ABZP-REQ10@R4). release-please had failed on every push to `main` with `GitHub Actions is not permitted to create or approve pull requests`, so it had never opened a release pull request.
  - **Changes:**
    - DES15: release-please is removed. `release.yml` runs on a `v*` tag (build, native smoke, publish to a GitHub Release with generated notes) or on `workflow_dispatch` (dry run: same build and smoke with version `0.0.0-dev+<short sha>`, publish skipped). `workflow_call` is dropped. Title, Tradeoffs (no CHANGELOG file; rejected release-please on manual dispatch), Evidence, and Research updated. Project Structure drops `release-please-config.json`, `.release-please-manifest.json`, and `release-please.yml`; the rollout row and the rollout diagram say releases happen on request.
    - S10: the outcome is a non-publishing dry run that produces four checksummed binaries that start; nothing is released unless the user asks.
    - V14: the scenario runs the release workflow manually on `main`; the expected result is the `dist` artifact, four smoke jobs printing `so 0.0.0-dev+<short sha>`, a skipped publish job, and no tag or GitHub Release. Unique risk adds a missing index worker and an accidental release.
    - Reference updates: REQ10@R3 → R4 throughout; the approved success and verification list names S10@R2 and V14@R2.
  - **Record transitions:**
    - RM261003ABZP-DES15@R3 → RM261003ABZP-DES15@R4 - revision change (manual tag releases, dry run, release-please removed)
    - RM261003ABZP-S10@R1 → RM261003ABZP-S10@R2 - revision change (dry run instead of a published release)
    - RM261003ABZP-V14@R1 → RM261003ABZP-V14@R2 - revision change (manual dry run, no publish)
  - **Requirement baseline:** RM261003ABZP-REQ10@R3 → RM261003ABZP-REQ10@R4; others unchanged.
  - **Evidence:** user decision in this conversation on 2026-10-04; `gh run list --workflow release-please.yml` (runs after PR #1, #2, #3 failed); `gh release list` and remote tags empty; `.github/workflows/release.yml` in the same change as this revision.
  - **Research provenance:**
    - None - no new research. RF14 (release-please) is superseded by the user decision; RF3 and RF13 support for DES15 is unchanged.
  - **Affected coverage:** RM261003ABZP-REQ10@R3 → DES15@R3 → S10@R1 → V14@R1 becomes RM261003ABZP-REQ10@R4 → DES15@R4 → S10@R2 → V14@R2.
  - **Approval evidence:** Approved by the user on 2026-10-04.
  - **Downstream impact:** `rm261003abzp-roadmap-index.md` and both phase files: PH1@R2 → R3 and PH2@R2 → R3 (phase exits run the dry run instead of releasing `v0.1.0`/`v1.0.0`). W261003HEGE delivered release-please and the tag/`workflow_call` release against DES15@R1/R2 and V14@R1; that delivery stays tied to its baseline, and the workflows change in the same pull request as this revision. UI artifacts are unaffected.

``````markdown
# RM261003ABZP: so v1 — Design

- **Status:** Approved
- **Outcome:** One Bun process with a pure TypeScript core — a language-neutral editor kernel (text, vim, commands, view) plus registered file types, Markdown language support, and note features (links, notes, Bases) — driven by one-way state flow, thin I/O adapters, an OpenTUI shell that draws only visible lines, and a read-only `Bun.serve` preview — enforced by an import-boundary test and gated by fast CI with in-process performance benchmarks.
- **History:** `rm261003abzp-design-revisions.md`

Use `None — <reason>` for sections or fields that do not apply. Diagrams and code previews show proposed design unless labeled as current evidence.

## Baseline and Goals

- **Context:** `rm261003abzp-roadmap-context.md@R2` - empty repository; Alfred code available to port (Markdown parse, Obsidian syntax, vim core, terminal graphics, Bases); scope change 2026-10-03: Markdown-first on a language-neutral core.
- **Requirements:** `rm261003abzp-requirements.md` - RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3 … RM261003ABZP-REQ10@R3, RM261003ABZP-REQ11@R3 (approved).
- **Research:** `rm261003abzp-research.md`
- **Reconciliation:** `rm261003abzp-requirements.md` Research Reconciliation — Complete.
- **Goals:**
  - Meet REQ1–REQ11 with the fewest moving parts: one process, one package, one state store.
  - Keep every product rule in a pure, unit-testable core; keep OpenTUI, Bun, and the file system at the edges.
  - Keep the editor kernel language-neutral: Markdown, links, notes, and Bases plug in through a file-type registry, so code editing and notebooks can be added later as registrations, not rewrites (RM261003ABZP-REQ11@R3).
  - Extend by registration (commands, keymaps, syntax extensions, block renderers, Bases view types, file types, highlighters, decoration providers, editor kinds) — the known extension needs from RM261003ABZP-REQ11@R3.
- **Binding constraints:**
  - `.s1mple/S1MPLE.md` Implementation - "Keep it lean and simple": no monorepo, no server between UI and core, no speculative plugin system.
  - RM261003ABZP-REQ11@R3 - only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs; `src/core/kernel/` imports nothing from `filetypes/`, `lang/`, or `features/`.
  - RM261003ABZP-REQ10@R3 - no tool may depend on the TypeScript compiler API (TypeScript 7 ships none, `RM261003ABZP-RF13`).

## System Architecture

- **System context:** One user in a terminal runs `so [path]`. External systems: the file system (the workspace folder, `$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, trash), the terminal emulator (keys, mouse, graphics), the system clipboard, and — only while `:Preview` runs — a local browser over `127.0.0.1`. No network service, database, Git, or AI.
- **Current architecture:** `rm261003abzp-roadmap-context.md@R2` Current System — empty repository.

```text
Not established — empty repository (only .s1mple/ guidance)
```

- **Proposed architecture:**

```text
                         ┌──────────────────────── src/app (composition root) ────────────────────────┐
 terminal ⇄ OpenTUI ⇄    │  main.ts → loads config/state → creates Store → starts UI, effects, workers │
                         └──────┬──────────────────────┬───────────────────────┬────────────────────┬──┘
                                │                      │                       │                    │
                   ┌────────────▼─────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
                   │ src/ui  (OpenTUI)    │  │ src/workspace (I/O)│  │ src/preview       │  │ src/core (pure)│
                   │ views, input, paint  │  │ fs, watcher, trash │  │ Bun.serve + SSE   │  │ state, vim,    │
                   │ images, theme        │  │ index worker, cfg  │  │ read-only HTML    │  │ kernel, file-  │
                   └────────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │ types,lang,feat│
                                │ reads state,          │ executes effects,     │ reads state, └───────▲────────┘
                                │ dispatches actions    │ dispatches results    │ renders HTML         │
                                └───────────────────────┴───────────────────────┴──────── import ──────┘

 Allowed imports:  app → ui, workspace, preview, core      ui → core      workspace → core      preview → core
                   core → (nothing outside core; npm parsing libs only)

 Inside core:      core/kernel  (text, editor, vim, commands, view)  → kernel only        ← language-neutral
                   core/filetypes                                     → kernel
                   core/lang/*, core/features/*                       → kernel, filetypes, lang, features, time
                   core/state, core/config                            → any core module (composition)
                   nothing outside core/state and core/config imports them
```

The core owns all product behavior; the three edge layers are adapters. This reuses Alfred's parsing, Obsidian syntax, vim, terminal-graphics knowledge, and Bases engine by porting them into `core/` (Alfred's kernel, client, protocol, chat, Git, SQLite, Ink, and Next.js are not reused). Main tradeoff: one process keeps latency and code minimal, but a CPU-heavy task on the main thread would stall input — so scanning, parsing for the index, and full-text search run in a worker (RM261003ABZP-DES7@R4).

Inside the core, the kernel edits and lays out text for any language; Markdown is one registered file type whose parser, live-preview decorations, and highlighter plug into the kernel (RM261003ABZP-DES1@R2, RM261003ABZP-DES17@R1). A code editor or notebook later adds file types, decoration providers, and editor kinds; the kernel does not change. Tradeoff: one more indirection (the file-type registry) between an open buffer and its Markdown behaviour, accepted because it is also what Bases and plain text files need in v1.

## Components and Boundaries

- **App (composition root)**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2
  - **Location:** `src/app/`
  - **Responsibilities:** parse CLI args; register file types (`text`, `markdown`, `base`, code types), commands, and keymaps; load config and state; construct the store, effect runner, workspace adapters, index worker, UI, and preview on demand; own process lifecycle and exit codes.
  - **Collaborators:** `bin/so` → `app/main.ts` → `core/store`, `workspace/*`, `ui/shell`, `preview/server`
  - **Contracts:** Action and Effect protocol; AppConfig
  - **Code shape:** `src/app/main.ts` `main`, `src/app/effects.ts` `runEffect`
  - **Must not own:** product rules, rendering, Markdown semantics.

- **Core — state**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Location:** `src/core/state/`
  - **Responsibilities:** `AppState`, pure `update(state, action) → { state, effects }`; jump list, autosave policy, conflict rules; opening a file as a buffer of its registered file type.
  - **Collaborators:** ui/workspace/preview → `dispatch(action)` → `update` → effects → app effect runner
  - **Contracts:** Action and Effect protocol; AppState
  - **Code shape:** `src/core/state/update.ts` `update`
  - **Must not own:** timers, I/O, terminal escape codes.

- **Core — editor kernel**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/core/kernel/` (`text/`, `editor/`, `vim/`, `commands/`, `view/`)
  - **Responsibilities:** text buffer, cursor and selections, undo blocks, registers, window tree; vim mode machine, key-sequence parser, motions, operators, text objects, dot-repeat, search, ex commands; command registry, file-type-scoped keymap trie, which-key and palette data; the viewport text view that lays out visible rows from text and decorations.
  - **Collaborators:** `update` → `vim.handleKey(bufferState, key)` → `TextBuffer`; `update` → `keymap.lookup({mode, filetype})`; UI → `layoutText(view, providers, analysis)` → `RenderLine[]`
  - **Contracts:** TextBuffer; VimState; Command and Keymap registry; Decoration and RenderLine model
  - **Code shape:** `src/core/kernel/text/text-buffer.ts` `TextBuffer`; `src/core/kernel/vim/engine.ts` `handleKey`; `src/core/kernel/commands/registry.ts` `CommandRegistry`, `Keymap`; `src/core/kernel/view/text-view.ts` `layoutText`
  - **Must not own:** rendering, clipboard I/O (expressed as effects), and anything Markdown-, link-, note-, or Bases-specific (enforced by the boundary test).

- **Core — file types**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Location:** `src/core/filetypes/`
  - **Responsibilities:** `FileType` contract and `FileTypeRegistry`: path → file type (extension, then file name, then the `text` fallback); per file type the editor kind, views, highlighter, and analysis hook; the built-in `text` file type.
  - **Collaborators:** `app/main` → registers `markdown`, `base`, and code file types; `update` → `fileTypes.forPath(path)` on open
  - **Contracts:** FileType and Decoration model
  - **Code shape:** `src/core/filetypes/registry.ts` `FileTypeRegistry`, `FileType`
  - **Must not own:** language parsing (lives in `lang/`), file reading (workspace).

- **Core — languages (Markdown and code highlighting)**
  - **Decisions:** RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES13@R2, RM261003ABZP-DES17@R1
  - **Location:** `src/core/lang/markdown/`, `src/core/lang/code/`
  - **Responsibilities:** Markdown block splitting, per-block parse cache, Obsidian syntax extensions, `Doc` model; the live-preview decoration provider with reveal rules and block renderers; pure HTML rendering for the preview; the `markdown` file type. `lang/code` wraps lowlight as `Highlighter`s and registers code file types (TypeScript, JavaScript, JSON, YAML, TOML, shell, Python, CSS, HTML, …) used for code files and fenced code blocks.
  - **Collaborators:** `update` → `markdown.analyze(buf, prevDoc)` → `Doc`; UI → `layoutText(view, [highlight, livePreview(doc)])` → paint; preview → `renderHtml(doc, ctx)`
  - **Contracts:** Doc model; FileType and Decoration model
  - **Code shape:** `src/core/lang/markdown/doc.ts` `parseDoc`; `src/core/lang/markdown/live-preview.ts` `livePreview`; `src/core/lang/markdown/html.ts` `renderHtml`; `src/core/lang/code/highlight.ts` `lowlightHighlighter`
  - **Must not own:** terminal escape output, image decoding, HTTP.

- **Core — links feature**
  - **Decisions:** RM261003ABZP-DES7@R4
  - **Location:** `src/core/features/links/`
  - **Responsibilities:** `NoteSummary` extraction, `NoteIndex` (names, aliases, headings, blocks, links, tags, backlinks) plus the workspace file list for the file picker, link resolution rule, rename planning, full-text search functions. Fuzzy ranking is kernel text code (`src/core/kernel/text/fuzzy.ts`) because the palette and every picker use it.
  - **Collaborators:** index worker → `scanDoc(text)` → `summarize(path, mtime, scan, lines)` → `NoteIndex.apply(delta)`; `update` → `resolveLink`, `planRename`
  - **Contracts:** NoteSummary and NoteIndex; LinkTarget
  - **Code shape:** `src/core/features/links/note-index.ts` `NoteIndex`; `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`
  - **Must not own:** file scanning (worker), persistence.

- **Core — Bases and notes features**
  - **Decisions:** RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2
  - **Location:** `src/core/features/bases/`, `src/core/features/notes/`, `src/core/time/`
  - **Responsibilities:** `.base` parsing, expression evaluation, table and Kanban view models, YAML-preserving frontmatter patches, the `base` file type and editor kind; daily-note paths, template expansion, Moment-subset date formatting.
  - **Collaborators:** `update` → `evaluateBase(base, index)` → `BaseViewModel`; `update` → `expandTemplate(tpl, vars)`
  - **Contracts:** BaseViewModel; Template variables
  - **Code shape:** `src/core/features/bases/evaluate.ts` `evaluateBase`; `src/core/time/format.ts` `formatDate`
  - **Must not own:** file writes (expressed as `write` effects).

- **Workspace adapters**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R1
  - **Location:** `src/workspace/`
  - **Responsibilities:** atomic save, text read with binary and size checks, create, rename, move, delete-to-trash; directory watcher with own-write suppression; index worker (scan, summarize, search); config and state files; clipboard; opening URLs/browser.
  - **Collaborators:** app effect runner → `workspace/*` → `dispatch(resultAction)`
  - **Contracts:** Effect protocol; FileEvent; WorkerMessage
  - **Code shape:** `src/workspace/fs.ts` `atomicWrite`, `readTextFile`; `src/workspace/watcher.ts` `watchWorkspace`; `src/workspace/index-worker.ts`
  - **Must not own:** decisions about conflicts, autosave timing, or link rewriting (core decides).

- **UI shell**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/ui/`
  - **Responsibilities:** OpenTUI renderer lifecycle; key/mouse normalization (kitty keyboard protocol, Esc timeout); layout of explorer, bufferline, editor windows, side panel, statusline, command line, overlays (picker, which-key, palette, prompts, help, notifications); one view per editor kind (`text` → `EditorView`, `base` → Bases view); painting `RenderLine[]`; widget painters keyed by widget type (image, embed, base); theme and `NO_COLOR`; terminal restore.
  - **Collaborators:** OpenTUI → `ui/input` → `dispatch`; store subscription → `ui/shell.render(state)`
  - **Contracts:** Key; RenderLine; AppState (read-only)
  - **Code shape:** `src/ui/shell.ts` `createShell`; `src/ui/editors/registry.ts` `editorViews`; `src/ui/editors/text-view.ts` `EditorView`; `src/ui/widgets/registry.ts` `widgetPainters`; `src/ui/input.ts` `normalizeKey`
  - **Must not own:** editing logic, Markdown parsing, file-type decisions, file I/O.

- **Preview server**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Location:** `src/preview/`
  - **Responsibilities:** `Bun.serve` on `127.0.0.1:0`, Host allowlist, SSE updates, read-only page, contained asset serving.
  - **Collaborators:** app → `startPreview(store)` → browser; store subscription → SSE push
  - **Contracts:** Preview HTTP routes
  - **Code shape:** `src/preview/server.ts` `startPreview`
  - **Must not own:** editing; files outside the workspace.

## Project Structure

- **Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json                 Purpose: one package; scripts dev/check/test/bench/build; exact pins
│       Symbols: scripts.check, packageManager, "@opentui/core": "<exact>"   Decisions: DES15
├── [A] tsconfig.json                Purpose: strict ESM, noEmit, TS 7          Decisions: DES15
├── [A] biome.json                   Purpose: format + lint                      Decisions: DES15
├── [A] knip.json                    Purpose: dead-code check                    Decisions: DES15
├── [A] release-please-config.json   Purpose: Conventional Commits → SemVer; initial-version 0.1.0  Decisions: DES15
├── [A] .release-please-manifest.json Purpose: release-please version manifest ({".": "0.0.0"})  Decisions: DES15
├── [A] .github/workflows/ci.yml     Purpose: check ∥ test+bench jobs on pull requests  Decisions: DES15, DES16
├── [A] .github/workflows/release-please.yml Purpose: release PR on main; calls release.yml when a release is created  Decisions: DES15
├── [A] .github/workflows/release.yml Purpose: compile ×4 + native smoke ×4 + publish (on `v*` tag or workflow_call)  Decisions: DES15
├── [A] bin/so                        Purpose: `#!/usr/bin/env bun` entry for source runs  Decisions: DES1
├── [A] src/app/
│   ├── main.ts                      Purpose: CLI, wiring, lifecycle            Symbols: main, parseArgs   Decisions: DES1, DES2
│   └── effects.ts                   Purpose: effect runner                     Symbols: runEffect         Decisions: DES2
├── [A] src/core/
│   ├── kernel/                      Purpose: language-neutral editor kernel; imports only kernel  Decisions: DES1
│   │   ├── text/                    Purpose: TextBuffer, Edit, Pos, Range, fuzzy ranking  Symbols: TextBuffer, Edit, fuzzyScore, rankBy  Decisions: DES3, DES7
│   │   ├── editor/                  Purpose: undo, registers, windows           Symbols: UndoStack, Registers  Decisions: DES3
│   │   ├── vim/                     Purpose: modes, parser, motions, operators, text objects, ex  Symbols: handleKey, motions, textObjects  Decisions: DES4
│   │   ├── commands/                Purpose: registry, file-type-scoped keymap trie, which-key  Symbols: CommandRegistry, Keymap, KeyScope  Decisions: DES5
│   │   └── view/                    Purpose: viewport text layout from decorations  Symbols: layoutText, Decoration, RenderLine  Decisions: DES9
│   ├── filetypes/                   Purpose: FileType contract, registry, `text` fallback  Symbols: FileTypeRegistry, FileType, Highlighter  Decisions: DES17
│   ├── lang/
│   │   ├── markdown/                Purpose: block split, linear scan, lazy mdast, parse cache, Obsidian extensions, live-preview provider, HTML  Symbols: parseDoc, Doc, scanDoc, blockNode, livePreview, renderHtml, markdownFileType  Decisions: DES6, DES9, DES13
│   │   └── code/                    Purpose: lowlight highlighter, code file types  Symbols: lowlightHighlighter, codeFileTypes  Decisions: DES17
│   ├── features/
│   │   ├── links/                   Purpose: summaries, index, file list, resolve, rename, search  Symbols: NoteIndex, resolveLink, planRename  Decisions: DES7
│   │   ├── bases/                   Purpose: ported Bases engine, view models, `base` file type  Symbols: parseBase, evaluateBase, KANBAN_TYPE, baseFileType  Decisions: DES12
│   │   └── notes/                   Purpose: daily notes, templates             Symbols: dailyPath, expandTemplate  Decisions: DES11
│   ├── time/                        Purpose: Moment-subset formatter            Symbols: formatDate        Decisions: DES11
│   ├── state/                       Purpose: AppState, Action, Effect, update  Symbols: update, AppState  Decisions: DES2
│   └── config/                      Purpose: config schema, defaults, TOML parse with line numbers  Symbols: ConfigSchema, defaults, parseConfig  Decisions: DES14
├── [A] src/workspace/
│   ├── fs.ts                        Purpose: readTextFile (binary/size/BOM/EOL), atomicWrite, create, rename, move  Symbols: readTextFile, atomicWrite  Decisions: DES8, DES17
│   ├── trash.ts                     Purpose: freedesktop trash, macOS trash (`/usr/bin/trash` or NSFileManager)  Symbols: moveToTrash  Decisions: DES8
│   ├── watcher.ts                   Purpose: directory watching, own-write suppression  Symbols: watchWorkspace  Decisions: DES8
│   ├── index-worker.ts              Purpose: list files, summarize notes, search text files in a Worker  Symbols: onmessage  Decisions: DES7
│   ├── config-file.ts               Purpose: XDG config load + validation       Symbols: loadConfig        Decisions: DES14
│   ├── state-file.ts                Purpose: XDG state load/save                Symbols: loadState, saveState  Decisions: DES14
│   └── system.ts                    Purpose: clipboard, open browser           Symbols: clipboard, openUrl  Decisions: DES8
├── [A] src/ui/
│   ├── shell.ts                     Purpose: renderer lifecycle, layout, restore  Symbols: createShell  Decisions: DES10
│   ├── input.ts                     Purpose: key/mouse normalization, Esc timeout  Symbols: normalizeKey  Decisions: DES10
│   ├── editors/                     Purpose: one view per editor kind: text (paints RenderLine rows, cursor), base  Symbols: editorViews, EditorView  Decisions: DES9, DES10, DES12
│   ├── widgets/                     Purpose: widget painters by type: image, embed, base  Symbols: widgetPainters  Decisions: DES10
│   ├── views/                       Purpose: explorer, bufferline, statusline, cmdline, side panel  Decisions: DES10
│   ├── overlays/                    Purpose: picker, which-key, palette, prompt, help, notify  Decisions: DES10, DES5
│   └── theme.ts                     Purpose: tokens, NO_COLOR                   Symbols: theme     Decisions: DES10
├── [A] src/preview/
│   ├── server.ts                    Purpose: Bun.serve, Host check, SSE, assets  Symbols: startPreview  Decisions: DES13
│   └── page.html                    Purpose: read-only page shell (embedded)   Decisions: DES13
└── [A] test/
    ├── boundaries.test.ts           Purpose: import-boundary enforcement (layers + kernel rule)  Decisions: DES1
    ├── e2e/                         Purpose: few PTY tests (start, edit, save, exit, restore)  Decisions: DES15
    ├── bench/                       Purpose: performance benchmarks via test renderer  Decisions: DES16
    └── fixtures/                    Purpose: sample workspace (notes, code files, a binary; an over-16 MiB file is generated at test time), 5,000-line note, 5,000-line TypeScript file, 10,000-note generator  Decisions: DES16, DES17
```

Unit tests sit next to code as `*.test.ts`.

## Runtime Flows

- **Keystroke to frame**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** OpenTUI key event → `ui/input.normalizeKey` → `store.dispatch({type:"key"})` → `core/state/update` → `keymap.lookup({mode, filetype})` or `vim.handleKey` → `TextBuffer.apply` → file type `analyze` (Markdown: `parseDoc` reparses changed blocks) → store notifies → `ui/shell.render` → `layoutText` with the view's decoration providers (visible rows only) → `EditorView` paint → OpenTUI native diff
  - **Flow:**

    ```text
    key ─→ normalizeKey ─→ dispatch(key) ─→ update(state,key)
                                              ├─ keymap trie {mode, buffer filetype} → {mode}: pending prefix? → state.pending, effect: startWhichKeyTimer
                                              ├─ command → run(ctx) → new state + effects (e.g. scheduleAutosave)
                                              └─ text edit → TextBuffer' + undo block + dirty block ids
                                                   → fileType.analyze (Markdown: reparse dirty blocks, cache by block hash)
          ui.render(state) ← store.notify ←───┘
            └─ layoutText(rows in view, [highlightMarks, view providers e.g. livePreview], view input) → paint → native diff → terminal
    ```

    State changes only inside `update`. Rendering is coalesced to at most one frame per input burst.

  - **Failure and recovery:** a command throws → `update` catches, keeps the previous state, emits `notify(error)`; a render error in one block → that block renders as source with a diagnostic marker; nothing crashes the process.
  - **Contracts and state:** Action and Effect protocol; AppState; FileType and Decoration model; RenderLine model
  - **Control flow:** `src/core/state/update.ts` `update`; `src/core/kernel/view/text-view.ts` `layoutText`; `src/ui/shell.ts` `createShell`

- **Startup**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** `app/main` → register file types (`markdown`, `base`, code types, `text` fallback) → `loadConfig`, `loadState` → `createStore` → `createShell` (first frame) → `startIndexWorker` → `watchWorkspace`
  - **Flow:**

    ```text
    so [path] → resolve workspace (folder | file's parent) ── missing → stderr + exit 2
             → load config (invalid → defaults + error notice) → load state (corrupt → empty)
             → first frame (explorer from a shallow readdir; opened file read directly)   ← < 200 ms target
             → worker: list all non-excluded files + summarize Markdown notes → post batches → dispatch(indexBatch) → status "indexing 4,210/10,000"
             → watcher starts → index ready
    ```

  - **Failure and recovery:** worker crash → notify and restart once; link features show "index unavailable" until restart succeeds; editing keeps working.
  - **Contracts and state:** AppConfig; WorkerMessage; NoteIndex
  - **Control flow:** `src/app/main.ts` `main`

- **Open a file**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES12@R2
  - **Participants:** `:e`, explorer `Enter`, picker, or link follow → effect `read(path)` → `workspace/fs.readTextFile` → `dispatch(fileLoaded | fileRefused)` → `update` → `fileTypes.forPath(path)` → buffer and window content
  - **Flow:**

    ```text
    open(path) → effect read(path) → readTextFile: size > 16 MiB          → fileRefused{reason:"tooLarge"}
                                                 NUL in first 8 KiB       → fileRefused{reason:"binary"}
                                                 not valid UTF-8 (fatal)  → fileRefused{reason:"binary"}
                                                 else strip BOM, detect EOL → fileLoaded{text, bom, eol, stamp}
    fileLoaded → fileTypes.forPath(path): ".md" → markdown (views live|source|reading, editor "text")
                                          ".base" → base (editor "base" → Bases view)
                                          ".ts" → typescript (views source, lowlight highlighter)
                                          other  → text (views source, no highlighter)
               → editor "text": buffer {fileType, view: first view, analysis: analyze?(buf)} → content {editor:"text", bufferId, …}
               → other editor: editorKinds.get(fileType.editor).open(path, text) → content {editor, state}
    fileRefused → notify "binary file — not opened" | "file too large — not opened (limit 16 MiB)"; no buffer, no write
    ```

  - **Failure and recovery:** read error → `fileRefused{reason:"io", message}` → notification; the previous buffer stays active.
  - **Contracts and state:** Action and Effect protocol; FileType and Decoration model; AppState
  - **Control flow:** `src/workspace/fs.ts` `readTextFile`; `src/core/filetypes/registry.ts` `FileTypeRegistry.forPath`, `EditorKindRegistry.get`

- **Save and external change**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2
  - **Participants:** `update` (autosave policy) → effect `write` → `workspace/fs.atomicWrite` → `watcher` → `dispatch(fileChanged)` → `update` (conflict rules)
  - **Flow:**

    ```text
    edit → state.dirty=true → effect scheduleAutosave(1000ms) | leaveInsert | switchNote | exit | :w
         → effect write(path, text, expectedStamp) → atomicWrite: realpath → tmp in same dir → write (BOM + EOL restored) → fsync → chmod → rename
         → record ownWrite(path, stamp) → dispatch(saved(stamp))
    watcher(dir) event → stat+hash → ownWrite? ignore
                                   → buffer clean → dispatch(reload(text)) → undoable reload
                                   → buffer dirty → dispatch(conflict) → prompt: keep mine | take disk | view diff
    ```

  - **Failure and recovery:** write fails (permission, disk full) → buffer stays dirty, status shows `save failed: <reason>`, autosave retries with backoff (1 s, 2 s, 4 s, max 30 s); `:w` retries immediately. Rename failure leaves the temp file removed and the original intact.
  - **Contracts and state:** FileEvent; BufferState.stamp
  - **Control flow:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`

- **Follow, complete, and rename links**
  - **Decisions:** RM261003ABZP-DES7@R4, RM261003ABZP-DES5@R2
  - **Participants:** `update` → `resolveLink(index, sourcePath, target)` → open buffer + jump; `planRename(index, moves, open)` → `applyEdits` effect
  - **Flow:**

    ```text
    gd on [[plan#Goals]] → resolveLink → {path:"projects/plan.md", heading:"Goals"} → push jumplist → open → cursor at heading
                         → unresolved → prompt "Create projects/plan.md?" → create effect
    rename a.md → b.md → planRename(index, [{from, to}], open scans) → [{path, edits[]}…] → apply to open buffers in memory + applyEdits for closed files (each span checked against its expected text)
                       → fs rename → notify "12 files updated"
    ```

  - **Failure and recovery:** a second rename or move while a link rewrite is in flight is refused with `links still updating — try again when the update finishes` and changes nothing; a closed file whose span no longer matches the expected text is skipped unchanged and reported; a link-rewrite write fails → remaining writes continue; failures are listed in a notification with paths; the rename itself is rolled back only if the file rename failed (links already rewritten are reported, not reverted).
  - **Contracts and state:** NoteIndex; LinkTarget
  - **Control flow:** `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`

- **Preview**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Participants:** `:Preview` (a Markdown-scoped command) → effect `startPreview` → `preview/server` → browser; store change (active Markdown doc or version) → SSE event → page fetches `/render`. Switching to a non-Markdown buffer sends nothing, so the page keeps the last note (RM261003ABZP-DES17@R1 note-only scope)
  - **Flow:**

    ```text
    :Preview → Bun.serve({hostname:"127.0.0.1", port:0}) → open http://127.0.0.1:<port>/
    page → GET /events (SSE) ; edit → debounce 100 ms → event "doc" {path, version, anchor} ; :PreviewStop/exit → event "stopped" → close
    page → GET /render?path=… → renderHtml(doc) → swap <main>, scroll to anchor
    any request with bad Host → 403 ; /file/<p> → realpath ⊂ workspace & not hidden? → bytes : 404
    ```

  - **Failure and recovery:** port bind fails → notify; browser cannot open → notify the URL; SSE drop → browser auto-reconnects and refetches.
  - **Contracts and state:** Preview HTTP routes
  - **Control flow:** `src/preview/server.ts` `startPreview`

## Contracts, Data, and State

- **Action and Effect protocol — State model**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Purpose:** the only way state changes and the only way side effects start.
  - **Participants:** ui, workspace, preview, timers → `Action` → `update` → `Effect[]` → app effect runner → result `Action`
  - **Meaning:** `Action` is a discriminated union (`key`, `mouse`, `resize`, `fileLoaded`, `fileRefused`, `saved`, `saveFailed`, `fileChanged`, `indexBatch`, `searchResults`, `timer`, …). `Effect` is a discriminated union (`read`, `write`, `create`, `rename`, `move`, `trash`, `startTimer`, `cancelTimer`, `clipboardWrite`, `clipboardRead`, `search`, `startPreview`, `stopPreview`, `openUrl`, `saveState`, `exit`).
  - **Ownership and lifecycle:** core defines both unions; app runs effects; every effect that can fail returns a success or failure action.
  - **Invariants:** `update` is pure and synchronous; no effect runs inside `update`; effects carry all data they need (no callbacks).
  - **State flow:**

    ```text
    Action → update → (State', Effect[]) → runEffect → Action …
    ```

  - **Shape:** `src/core/state/types.ts`

- **AppState — State model**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1
  - **Purpose:** single source of truth for everything visible.
  - **Participants:** `update` (owner) → ui/preview (readers)
  - **Meaning:** `workspace` (root, tree), `buffers` (by id: path, `fileType` id, TextBuffer, `analysis` (the file type's analysis state; Markdown: `Doc`), stamp, `bom`, `eol`, dirty, `view` — one of the file type's view ids, e.g. live|source|reading for Markdown, source for code), `windows` (split tree, active, and per-window `content` by editor kind: `{editor:"text", bufferId, cursor, scroll, folds}` where `folds` is the set of folded callout and expanded embed block ids, or `{editor: <registered kind>, state}` whose `state` comes from that kind's `EditorKindSpec.open` — in v1 only `base`, with state `{path, view, cursor}`), `vim` (mode, pending keys, registers, last change, search), `panels` (explorer, side panel kind), `overlay` (none | picker | whichKey | palette | prompt | help | conflict | calendar | completion), `index` (NoteIndex + status), `notifications`, `config`, `jumps`, `preview` (off | on(port)).
  - **Ownership and lifecycle:** created at startup from config + state file; `jumps` and recent notes persisted through `saveState` effects (debounced 2 s and on exit).
  - **Invariants:** one active window; each `text` window references an open buffer; a buffer's `view` is one of its file type's views; a buffer with `dirty=false` matches its last saved stamp. Adding an editor kind (a notebook later) registers an `EditorKindSpec` in core and an editor view in the UI; neither the `AppState` type nor the kernel changes.
  - **State flow:** `None — plain value replaced by update`
  - **Shape:** `src/core/state/types.ts` `AppState`

- **TextBuffer — Data model**
  - **Decisions:** RM261003ABZP-DES3@R1
  - **Purpose:** text storage and edit primitives behind a stable interface.
  - **Participants:** vim engine, rename planner, template insertion → `TextBuffer` → file type `analyze` (Markdown parser), highlighter, text view
  - **Meaning:** lines array, version number, `apply(edit)` returning a new buffer and the inverse edit; positions are `{line, col}` in UTF-16 code units aligned to grapheme boundaries.
  - **Ownership and lifecycle:** owned by a buffer entry; replaced on each edit (structural sharing of untouched lines).
  - **Invariants:** at least one line; line separators normalized to `\n` in memory, original separator (`\n`/`\r\n`), trailing newline, and leading UTF-8 BOM restored on save. UTF-16 positions match the Language Server Protocol's default position encoding, so a future LSP client needs no conversion.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/text/text-buffer.ts`

- **Doc model — Data model**
  - **Decisions:** RM261003ABZP-DES6@R2
  - **Purpose:** parsed Markdown shared by live preview, index summaries, and HTML preview.
  - **Participants:** `parseDoc` (the `markdown` file type's `analyze`) → `Doc` → live-preview provider, `summarize`, `renderHtml`; the index worker calls `scanDoc(text)` for the scan level only
  - **Meaning:** two levels. Scan level: `Doc { version, frontmatter?, blocks: Block[], scan: DocScan }`; `Block { id, kind, startLine, endLine, hash, scan: BlockScan }`, where `BlockScan` holds headings, links, tags, block ids, and excluded ranges (code, math, comments) from one linear pass. mdast level: `blockNode(doc, block, text)` returns the block's mdast, extended with Obsidian nodes (`wikiLink`, `embed`, `tag`, `highlight`, `comment`, `callout`, `blockId`, `footnote*`, `math`), parsed on first request and cached by block hash.
  - **Ownership and lifecycle:** the scan level is recomputed per buffer version, reusing unchanged blocks by hash; mdast is built lazily per block, only for blocks a consumer asks for (live preview on screen, HTML preview).
  - **Invariants:** blocks cover the document without overlap; a fenced code block or frontmatter is never split.
  - **State flow:** `None`
  - **Shape:** `src/core/lang/markdown/doc.ts`

- **RenderLine model — Data model**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Purpose:** UI-independent, language-neutral description of one screen row.
  - **Participants:** `layoutText` → `RenderLine[]` → `EditorView` (widgets → UI widget painters by `type`)
  - **Meaning:** `RenderLine { sourceLine, spans: {text, style: StyleToken, link?}[], widget?: {type: string, data, rows}, sign?: {text, style} }`; widget types in v1 are `image`, `embed`, `base`, `rule`, registered by `lang/markdown` and `features/bases`; `StyleToken` names a theme token (`heading1`, `bold`, `link`, `tag`, `codeKeyword`, …), never a colour.
  - **Ownership and lifecycle:** computed per frame for visible rows only.
  - **Invariants:** cursor column maps back to a source column through `spans` offsets; widget rows are counted in scroll math.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/view/types.ts`

- **FileType and Decoration model — Data model**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Purpose:** the only way language-specific behaviour reaches the kernel.
  - **Participants:** `lang/*`, `features/bases` → `FileTypeRegistry.register` (wired in `app/main`) → `update` (`forPath` on open; `analyze` per version) → `layoutText(view, providers, analysis)`
  - **Meaning:** `FileType { id, match: {extensions, names}, editor: EditorKind (an open string: "text" and "base" in v1, more by registration), views: [{id, readOnly?, decorations: DecorationProvider[], input?}], highlighter?, analyze? }`. `Decoration` = `mark` (style a range) | `replace` (hide or substitute a range, inline or whole lines, optionally with spans or a widget) | `widget` (insert rows or inline content at a position) | `line` (line style or sign). The kernel's `highlightMarks` turns `Highlighter` output into `mark` decorations; `Highlighter` and `Span` are kernel types, so the kernel never imports `filetypes`. A view's optional `input(analysis, ctx)` hook builds the per-frame provider input from a context type the language declares and `core/state` builds (Markdown: `MarkdownViewInput`), so the UI never branches on a file type. This is the decoration model of CodeMirror 6 (Obsidian's editor), Neovim extmarks, and VS Code decorations.
  - **Ownership and lifecycle:** file types are registered at startup and never change at runtime; providers run per frame on visible lines only.
  - **Invariants:** `text` is the fallback for any unmatched path; every `text` editor file type has a `source` view; decorations never change buffer text; providers are pure.
  - **State flow:** `None`
  - **Shape:** `src/core/filetypes/types.ts`, `src/core/kernel/view/decorations.ts`

- **NoteSummary and NoteIndex — Data model**
  - **Decisions:** RM261003ABZP-DES7@R4
  - **Purpose:** workspace-wide link, tag, heading, and block knowledge, plus the workspace file list.
  - **Participants:** worker `scanDoc` → `summarize` → `NoteSummary` → main `NoteIndex.apply`
  - **Meaning:** `NoteSummary { path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind:"wiki"|"md"|"embed", raw, range, context?}], frontmatter }`; `raw` and `range` let rename plan edits without reading the file, and `context` is the trimmed source line (≤ 160 characters) shown as a closed note's backlink context. `NoteIndex` holds summaries by path plus derived maps: basename → paths, alias → paths, tag → paths, target path → backlinks; and `files` — every non-excluded workspace path — for the file picker.
  - **Ownership and lifecycle:** built at startup by the worker; updated per file event and per buffer save; never persisted.
  - **Invariants:** derived maps are rebuilt only for changed paths; only Markdown files are summarized; resolution order is fixed (RM261003ABZP-DES7@R4).
  - **State flow:** `empty → indexing(n/total) → ready → (fileEvent) ready`
  - **Shape:** `src/core/features/links/note-index.ts`

- **Preview HTTP routes — API**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Purpose:** read-only browser preview.
  - **Participants:** browser → `preview/server` → core `renderHtml`
  - **Meaning:** `GET /` page shell; `GET /events` SSE (`doc` events with `{path, version, anchor}`; a `stopped` event sent before `:PreviewStop` or exit closes the server); `GET /render?path=` HTML fragment; `GET /file/<path>` workspace asset bytes.
  - **Ownership and lifecycle:** exists only between `:Preview` and `:PreviewStop` or exit.
  - **Invariants:** hostname `127.0.0.1`; Host header ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403; realpath containment else 404; no mutating routes.
  - **State flow:** `off → on(port) → off`
  - **Shape:** `src/preview/server.ts`

- **AppConfig — Data model**
  - **Decisions:** RM261003ABZP-DES14@R2, RM261003ABZP-DES5@R2
  - **Purpose:** user options and keymap overrides.
  - **Participants:** `config-file.loadConfig` → `parseConfig` (`toml-eslint-parser` AST → `ConfigSchema` (zod), errors carry the TOML line) → `AppState.config`
  - **Meaning:** `leader`, `escTimeoutMs` (50; effective `max(escTimeoutMs, 20)` because OpenTUI resolves a legacy lone Esc at 20 ms), `autosave` (`{ enabled: true, delayMs: 1000 }`), `editor` (`tabWidth` 1–16, default 8; `wrap`, default `true`; `relativeNumbers`, default `true`), `preview` (`mode: "live"`, `embedMaxRows`, `images: "auto"|"blocks"|"off"`), `daily` (`folder`, `format`, `template`), `templates.folder`, `theme`, `color` (overrides `NO_COLOR`), `keys.<mode>` (`"<key-seq>" = "<command-id>"`, global), `filetypes.<id>.keys.<mode>` (same form, one file type).
  - **Ownership and lifecycle:** read at startup and on `:ConfigReload`.
  - **Invariants:** unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
  - **State flow:** `None`
  - **Shape:** `src/core/config/schema.ts`

## Detailed Code Design

- **`src/core/state/update.ts`**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Change:** Add
  - **Responsibilities:** reducer entry; routes actions to feature reducers.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };

    export const update: Update = (state, action) => {
      switch (action.type) {
        case "key":        return handleKeyAction(state, action.key);   // keymap {mode, filetype} → command, else vim edit
        case "fileChanged":return handleFileChanged(state, action);     // reload | conflict | ignore
        case "indexBatch": return { state: withIndex(state, action.summaries), effects: [] };
        // … one case per Action variant; feature logic lives in feature modules
      }
    };

    export function createStore(initial: AppState, run: (e: Effect) => void) {
      let state = initial; const subs = new Set<(s: AppState) => void>();
      return {
        get: () => state,
        dispatch(action: Action) { const r = update(state, action); state = r.state; r.effects.forEach(run); subs.forEach((f) => f(state)); },
        subscribe(f: (s: AppState) => void) { subs.add(f); return () => subs.delete(f); },
      };
    }
    ```

    `update` routes; `createStore` is the only mutable cell. The switch dispatches on a closed Action union (core protocol, not an extension point); commands extend through the registry instead.

  - **Dependencies:** Action and Effect protocol; CommandRegistry
  - **Callers and wiring:** `app/main.ts` creates the store with `runEffect`; ui and preview subscribe.
  - **Invariants:** pure; no `Date.now()` — time arrives in actions.
  - **Verification:** RM261003ABZP-S11@R1, RM261003ABZP-V15@R2

- **`src/core/kernel/commands/registry.ts`**
  - **Decisions:** RM261003ABZP-DES5@R2
  - **Change:** Add
  - **Responsibilities:** named commands, file-type-scoped keymap trie, which-key and palette data, config overrides.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Command<Ctx = unknown, R = unknown> = {   // generic: the kernel never imports core/state
      id: string;                       // "file.find", "note.today", "link.follow"
      title: string;                    // shown in palette and which-key
      group?: string;                   // which-key group: "find", "note", "buffer"
      filetypes?: readonly string[];    // omitted = every file type; ["markdown"] for link.follow, view.cycle, task.toggle
      run: (ctx: Ctx, args?: string) => R;   // core/state instantiates Ctx = CommandContext, R = { state: AppState; effects: Effect[] }
    };
    export type Mode = "normal" | "insert" | "visual" | "cmdline" | (string & {});   // "explorer", "picker", "base" are declared by their owners
    export type KeyScope = { mode: Mode; filetype?: string };   // filetype omitted = global

    export class CommandRegistry<Ctx, R> { register(cmd: Command<Ctx, R>): void; get(id: string): Command<Ctx, R> | undefined; list(filetype?: string): Command<Ctx, R>[] }

    export class Keymap {
      bind(scope: KeyScope, seq: string, commandId: string): void;   // "<leader>ff", "gd", "<C-o>"
      lookup(scope: KeyScope, pending: Key[]): { kind: "command"; id: string } | { kind: "prefix"; next: WhichKeyItem[] } | { kind: "none" };
      // lookup checks {mode, filetype} first, then {mode}; which-key merges both levels
    }
    ```

    Features call `registry.register` and `keymap.bind` at startup from their own module (`src/core/features/notes/commands.ts`, …); `lang/markdown` binds `gd`, `Enter`, `<leader>m`, `<leader>x` with `filetype: "markdown"`. Which-key reads `lookup(...).next`; the palette reads `list(activeFiletype)`. Config `keys.<mode>` rebinds globally and `filetypes.<id>.keys.<mode>` per file type, both by command id. This mirrors Neovim's buffer-local keymaps set from ftplugins, so `gd` stays free for go-to-definition in code files later.

  - **Dependencies:** None inside the kernel (generic over context and result); `core/state` defines `AppCommand = Command<CommandContext, { state: AppState; effects: Effect[] }>`
  - **Callers and wiring:** `core/state` default registration registers built-ins; `app/main.ts` applies config overrides.
  - **Invariants:** duplicate ids throw at startup; binding an unknown id or file type is a config error, not a crash; running a command whose `filetypes` exclude the active buffer's file type is a no-op with the notice `not available for <type> files`.
  - **Verification:** RM261003ABZP-S3@R1, RM261003ABZP-V4@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/kernel/text/text-buffer.ts` and `src/core/kernel/vim/engine.ts`**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Change:** Add (vim engine redesigned from `alfred/apps/tui/src/view/editor/vim.ts`)
  - **Responsibilities:** buffer primitives; vim grammar `[count]["x][count]operator[count](motion|textobject)`.
  - **Current source:** `alfred/apps/tui/src/view/editor/vim.ts:15-40` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    export type VimMode = "normal" | "insert";
    export type VimEffect = "changed" | "insert-exited" | "toggle-mode" | "leave";
    export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
    ```

    Alfred's engine is pure with effects but supports two modes and a hard-coded pending set.

  - **Proposed shape:**

    ```ts
    export interface TextBuffer {
      readonly version: number; readonly lineCount: number;
      line(i: number): string;
      apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };     // Edit = { range, text }
      slice(range: Range): string;
    }

    export type Motion = (buf: TextBuffer, at: Pos, count: number, ctx: MotionCtx) => { to: Pos; linewise: boolean; inclusive: boolean } | null;
    export type TextObject = (buf: TextBuffer, at: Pos, count: number) => Range | null;
    export const motions: Record<string, Motion>;       // "w","b","e","gg","G","f",… registered by key
    export const textObjects: Record<string, TextObject>; // "iw","a(","ip",…

    export function handleKey(s: BufferVim, key: Key, env: VimEnv): { s: BufferVim; effects: VimEffect[] };
    // VimEffect: { kind:"yank", register, text } | { kind:"changed" } | { kind:"modeChanged", mode } | { kind:"ex", line } | { kind:"search", pattern, dir }
    ```

    The parser accumulates keys into a pending command; when complete it resolves the motion or text object by table lookup, applies the operator, and records an undo block and last-change for `.`. Insert mode collects edits into one undo block until `Esc`.

  - **Dependencies:** TextBuffer; registers in AppState
  - **Callers and wiring:** `update` → `handleKeyAction` → `handleKey` when no keymap binding matches in normal/visual/insert mode.
  - **Invariants:** an operator with a failed motion is a no-op; counts multiply (`2d3w` = `d6w`); undo restores cursor.
  - **Verification:** RM261003ABZP-S2@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1

- **`src/core/lang/markdown/doc.ts`**
  - **Decisions:** RM261003ABZP-DES6@R2
  - **Change:** Add (ported from `alfred/apps/tui/src/view/markdown/parse.ts` and `alfred/packages/view-model/src/markdown/obsidian-syntax.ts`)
  - **Responsibilities:** split into blocks, scan each block linearly for links, tags, headings, and block ids, parse a block to mdast with micromark + GFM + math + Obsidian extensions only when asked, reuse unchanged blocks.
  - **Current source:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` (imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math`)
  - **Current shape:**

    ```ts
    // Alfred parses the whole document per render and post-processes Obsidian syntax with regexes from obsidian-syntax.ts
    export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    ```

    Whole-document parse; Obsidian syntax by regex over text nodes.

  - **Proposed shape:**

    ```ts
    export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; scan: BlockScan };
    export type Doc = { version: number; frontmatter?: Frontmatter; blocks: Block[]; scan: DocScan };

    export function splitBlocks(buf: TextBuffer): { startLine: number; endLine: number }[]; // blank-line bounded; fences, frontmatter, $$ kept whole; lists kept whole
    export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;   // rescan only ranges whose hash changed
    export function scanDoc(text: string): DocScan;               // scan level only; used by the index worker
    export function blockNode(doc: Doc, block: Block, text: (from: number, to: number) => string): MdNode; // lazy mdast, cached by hash
    export const syntaxExtensions: SyntaxExtension[];             // wikiLink, embed, tag, highlight, comment, callout, blockId — one definition for both levels
    ```

    Block-level reparse keeps per-keystroke work proportional to the edited block (`RM261003ABZP-RF7`). Whole-document facts (links, tags, headings, block ids, frontmatter) come from the linear scan level, and mdast is built lazily per block: parsing every note to mdast took 11.8 s for 10,000 notes and about 350 ms for the `openFile` fixture, missing RM261003ABZP-V13@R1 and the open budget. Each Obsidian syntax is defined once in `syntaxExtensions` for both levels, and a conformance test checks that the levels agree.

  - **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`
  - **Callers and wiring:** registered as the `markdown` file type's `analyze`; `update` runs it after edits; the worker runs `scanDoc` before `summarize`; live preview and `renderHtml` call `blockNode`.
  - **Invariants:** `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally (cache is transparent).
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2

- **`src/core/kernel/view/text-view.ts` and `src/core/lang/markdown/live-preview.ts`**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Change:** Add (live preview adapted from `alfred/apps/tui/src/view/markdown/layout.ts` and `alfred/apps/tui/src/view/editor/reveal-units.ts`)
  - **Responsibilities:** language-neutral visible-row layout from decorations (kernel); Markdown live preview as a decoration provider with reveal rules and block renderers (lang).
  - **Current source:** `alfred/apps/tui/src/view/editor/reveal-units.ts` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    None — Alfred lays out whole documents for Ink rendering
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    // src/core/kernel/view — knows nothing about Markdown
    export type TextView = { buf: TextBuffer; width: number; topRow: number; rows: number; cursor: Pos; selection?: Range; folds: ReadonlySet<number>; visible: LineRange };
    export type Widget = { type: string; data: unknown; rows: number };            // painted by a UI widget painter
    export type Decoration =
      | { kind: "mark"; range: Range; style: StyleToken }                          // syntax colour, bold, search match
      | { kind: "replace"; range: Range; block: boolean; spans?: Span[]; widget?: Widget } // hidden `**`, rendered table rows
      | { kind: "widget"; at: Pos; block: boolean; widget: Widget }                // image, embed, base view
      | { kind: "line"; line: number; style?: StyleToken; sign?: Sign };           // ▕ reveal sign, ⚠ render error
    export type DecorationProvider<S = unknown> = (v: TextView, analysis: S) => Decoration[]; // visible lines only
    export function layoutText(v: TextView, providers: readonly DecorationProvider[], analysis: unknown): RenderLine[];
    export type TextViewInput = { view: TextView; providers: readonly DecorationProvider[]; analysis: unknown };  // what a text editor view paints
    export interface Highlighter { language: string; highlight(buf: TextBuffer, lines: LineRange): Span[][] }      // kernel-owned; lang/code implements it
    export function highlightMarks(h: Highlighter | undefined): DecorationProvider;                               // Span[][] → mark decorations

    // src/core/lang/markdown/live-preview.ts — one provider among many
    export type PreviewCtx = { isResolved(target: string): boolean; embed(path: string): { doc: Doc } | "loading" | "missing";
                               image(ref: string): { rows: number } | "unknown"; embedMaxRows: number; images: "auto" | "blocks" | "off" };
    export type MarkdownViewInput = { doc: Doc; view: "live" | "reading"; ctx: PreviewCtx };   // built by the Markdown views' `input` hook
    export const livePreview: DecorationProvider<MarkdownViewInput>;   // views "live" and "reading" (reading: no reveal)
    export type BlockRenderer = (block: Block, v: TextView, input: MarkdownViewInput) => Decoration[];
    export const blockRenderers: Partial<Record<BlockKind, BlockRenderer>>;   // heading, list, table, callout, code, embed, base, math, mermaid …
    ```

    Reveal is the provider's rule, not the kernel's: on the cursor's line it emits no inline `replace` decorations; when the cursor is inside a multi-line block (table, callout, code, math, frontmatter) it emits none for that block, so the source shows. `source` view uses only the highlighter's `mark` decorations; a code file gets exactly that path. Rows outside the viewport are never laid out; a per-block row-height cache gives scroll positions.

  - **Dependencies:** Doc model; FileType and Decoration model; theme tokens; `lang/code` highlighter for fenced code; ported math and mermaid text renderers
  - **Callers and wiring:** `ui/editors/text-view.ts` per frame with the active view's providers from the buffer's file type.
  - **Invariants:** `layoutText` with no providers returns raw lines; the source view of Markdown and any code file use the same path; reading view never reveals.
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/filetypes/registry.ts` and `src/core/lang/code/highlight.ts`**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Change:** Add (highlighter adapted from `alfred/apps/tui/src/view/markdown/code-highlight.ts`)
  - **Responsibilities:** file-type contract and lookup; the lowlight-backed highlighter.
  - **Current source:** `alfred/apps/tui/src/view/markdown/code-highlight.ts` (96 lines, `lowlight`; porting reference)
  - **Current shape:**

    ```ts
    None — Alfred highlights fenced code only
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    export type EditorKind = string;                                // "text" and "base" in v1; a notebook registers "notebook" later
    export type ViewSpec<S, I = S, C = unknown> = { id: string; readOnly?: boolean; decorations: readonly DecorationProvider<I>[];
                                       input?: (analysis: S, ctx: C) => I };   // per-frame provider input; default: analysis
    // C is declared by the language (Markdown: PreviewCtx); core/state/view-context.ts builds it from AppState
    // through a builder registered per file type id, so filetypes/ and lang/ never import core/state.
    export type EditorKindSpec<St = unknown> = { id: EditorKind; open(path: string, text: string): St };
    export class EditorKindRegistry { register(spec: EditorKindSpec<any>): void; get(id: EditorKind): EditorKindSpec | undefined }
    // "text" is built in (core/state creates the buffer); "base" is registered by features/bases; a notebook registers later.
    export type FileType<S = unknown> = {
      id: string;                                                   // "markdown", "base", "typescript", "text"
      match: { extensions?: readonly string[]; names?: readonly string[] };   // [".md"], ["Makefile"]
      editor: EditorKind;
      views: readonly ViewSpec<S>[];                                // first = default
      highlighter?: Highlighter;
      analyze?: (buf: TextBuffer, prev?: S) => S;                   // Markdown: parseDoc with block cache
    };
    // `Highlighter` is the kernel type from `src/core/kernel/view/types.ts`

    export class FileTypeRegistry {
      register(ft: FileType<any>): void;                            // duplicate id or extension throws at startup
      forPath(path: string): FileType;                              // extension → file name → `text`
      get(id: string): FileType | undefined;
    }

    // src/core/lang/code/highlight.ts
    export function lowlightHighlighter(language: string): Highlighter;   // highlights from up to 200 lines above
                                                                           // the requested range; cached per buffer version
    ```

    `app/main` registers `text`, `markdown` (`lang/markdown`), `base` (`features/bases`), and code file types (`lang/code`). Tree-sitter can replace lowlight behind `Highlighter` later without changing callers.

  - **Dependencies:** `lowlight`; TextBuffer
  - **Callers and wiring:** `update` (`forPath` on `fileLoaded`; `analyze` after edits); the kernel's `highlightMarks` (`Highlighter` → `mark` decorations); `lang/markdown` fenced code blocks.
  - **Invariants:** registry lookup is deterministic and pure; highlighting is viewport-bounded and never runs the whole file per keystroke; a highlighter error drops to plain text for that range.
  - **Verification:** RM261003ABZP-S12@R1, RM261003ABZP-V18@R1; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/features/links/resolve.ts` and `src/core/features/links/rename.ts`**
  - **Decisions:** RM261003ABZP-DES7@R4
  - **Change:** Add
  - **Responsibilities:** deterministic link resolution; format-preserving rename planning.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function resolveLink(ix: NoteIndex, from: string, raw: string): LinkTarget | { unresolved: string };
    // order: exact root path (with/without .md) → alias → basename candidates ranked by
    //        (same folder as `from`) → (shortest path) → (alphabetical)
    export type PathMove = { from: string; to: string };
    export type FileEdit = { path: string; edits: { range: Range; expected: string; text: string }[] };
    export function planRename(ix: NoteIndex, moves: readonly PathMove[], open: ReadonlyMap<string, DocScan>): FileEdit[];
    // keeps link kind (wiki/md), alias, #heading / #^block; writes the shortest unique form of `to`;
    // link spans come from open buffers' scans and from summaries (`raw`, `range`), so planning reads no file
    ```

  - **Dependencies:** NoteIndex
  - **Callers and wiring:** `link.follow`, completion, backlinks, `file.rename`, `file.move` commands.
  - **Invariants:** resolution is a pure function of index contents; rename never touches text outside link spans.
  - **Verification:** RM261003ABZP-S4@R1, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2

- **`src/workspace/fs.ts` and `src/workspace/watcher.ts`**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES17@R1
  - **Change:** Add
  - **Responsibilities:** text reads with binary and size checks; atomic writes and directory watching with own-write suppression.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export async function readTextFile(path: string): Promise<TextFile | { refused: "binary" | "tooLarge" }> {
      const file = Bun.file(path);
      if (file.size > 16 * 1024 * 1024) return { refused: "tooLarge" };
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.subarray(0, 8192).includes(0)) return { refused: "binary" };
      let text: string;
      try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); } catch { return { refused: "binary" }; }
      const bom = text.startsWith("\uFEFF");
      return { text: bom ? text.slice(1) : text, bom, eol: text.includes("\r\n") ? "\r\n" : "\n", stamp: stampOf(path, text) };
    }
    export async function atomicWrite(path: string, text: string): Promise<Stamp> {   // text already has BOM + EOL restored
      const target = await realpathOrSelf(path);
      const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
      const fd = await open(tmp, "w", await modeOr(target, 0o644));
      try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp, target);                     // same directory → atomic on POSIX
      return stampOf(target, text);                  // { mtimeMs, size, hash }
    }
    export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
    // fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
    ```

  - **Dependencies:** `node:fs/promises`, `node:fs` (Bun-compatible)
  - **Callers and wiring:** effect runner for `read`, `write`, `create`, `rename`, `move`; `main` starts the watcher.
  - **Invariants:** temp files never appear in the index (prefix `.` is hidden); a failed write deletes its temp file.
  - **Verification:** RM261003ABZP-S1@R1, RM261003ABZP-V1@R1; RM261003ABZP-S12@R1, RM261003ABZP-V18@R1

- **`src/ui/editors/text-view.ts`, `src/ui/widgets/registry.ts`, and `src/ui/input.ts`**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Change:** Add
  - **Responsibilities:** paint RenderLine rows onto an OpenTUI buffer; paint widgets through painters keyed by widget type; pick the view for a window's editor kind; normalize input.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    // Only file family allowed to import @opentui/*
    export class EditorView extends Renderable {           // custom renderable, not Textarea
      constructor(ctx: RenderContext, private getView: () => TextViewInput) { super(ctx, { flexGrow: 1 }); }
      protected renderSelf(buf: OptimizedBuffer) {
        const { view, providers, analysis } = this.getView();
        for (const [row, line] of layoutText(view, providers, analysis).entries()) paintLine(buf, row, line, theme, widgetPainters);
      }
    }
    export const editorViews = new Map<EditorKind, (ctx: RenderContext, win: WindowId) => Renderable>();  // registered: text → EditorView, base → BaseView
    export function registerEditorView(kind: EditorKind, view: (ctx: RenderContext, win: WindowId) => Renderable): void;
    export const widgetPainters: Record<string, WidgetPainter>;                                        // image, embed, base, rule
    export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via max(escTimeoutMs, 20)
    ```

    Exact OpenTUI buffer and image APIs are confirmed against the pinned version in the first delivery item (the class above is illustrative).

  - **Dependencies:** `@opentui/core` (exact pin)
  - **Callers and wiring:** `ui/shell.ts` composes views; store subscription triggers `requestRender()`.
  - **Invariants:** UI never mutates AppState; all input becomes Actions.
  - **Verification:** RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V17@R1

- **`src/preview/server.ts`**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Change:** Add
  - **Responsibilities:** read-only preview server.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function startPreview(store: Store, root: string): { port: number; stop(): void } {
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0,
        fetch(req) {
          const host = req.headers.get("host");
          if (host !== `127.0.0.1:${server.port}` && host !== `localhost:${server.port}`) return new Response(null, { status: 403 });
          return route(req, store, root);              // "/", "/events", "/render", "/file/*"
        },
      });
      return { port: server.port, stop: () => server.stop(true) };
    }
    ```

  - **Dependencies:** `Bun.serve`; core `renderHtml`
  - **Callers and wiring:** effect runner for `startPreview`/`stopPreview`.
  - **Invariants:** no write routes; `/file/*` passes realpath containment and hidden-folder exclusion.
  - **Verification:** RM261003ABZP-S8@R1, RM261003ABZP-V11@R3

## Cross-cutting and Evolution

| Concern | Mechanism and canonical design location | Verification or reason not applicable |
|---|---|---|
| Security and privacy | No network except loopback preview with Host allowlist and realpath containment (RM261003ABZP-DES13@R2); config is data (TOML), never executed (RM261003ABZP-DES14@R2); no telemetry; notes never logged | RM261003ABZP-V11@R3 |
| Configuration and observability | XDG TOML config validated by schema; errors as notifications; `so --version`; `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content (RM261003ABZP-DES14@R2) | RM261003ABZP-V4@R2 |
| Performance and scalability | Viewport-only layout, block parse cache, worker index and search, frame coalescing, lazy image decode with cache (RM261003ABZP-DES16@R1) | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| Concurrency, retry, and idempotency | Single-threaded store; worker communicates by messages; saves serialized per path; autosave retry with backoff; own-write stamps make watcher events idempotent (RM261003ABZP-DES8@R2) | RM261003ABZP-V1@R1 |
| Migration and backfill | None — greenfield; Obsidian files are read as-is and written in place | None — no prior data format |
| Mixed-version compatibility | Obsidian file compatibility (Markdown, links, frontmatter, `.base`); Kanban `type` constant isolated in `core/features/bases/types.ts` and verified against an Obsidian-saved file (RM261003ABZP-DES12@R2) | RM261003ABZP-V10@R1 |
| Rollout and rollback | SemVer releases via release-please; users roll back by installing a previous release binary (RM261003ABZP-DES15@R3) | RM261003ABZP-V14@R1 |
| Known extension needs | Registries: commands and file-type-scoped keymaps (DES5), syntax extensions (DES6), block renderers and decoration providers (DES9), editor-kind views and widget painters (DES10), Bases view types (DES12), file types and highlighters (DES17) — RM261003ABZP-REQ11@R3 | RM261003ABZP-V16@R2 |
| Evolution toward code editing and notebooks | Kernel boundary (DES1) keeps editing language-neutral; future work adds registrations only: an LSP client is a workspace adapter whose results become `mark`/`line` decorations and file-type commands (`gd` → definition); tree-sitter replaces lowlight behind `Highlighter`; a notebook is a new editor kind whose cells each hold a `TextBuffer`. None of these is built in v1 (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3 deferrals) | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V18@R1 |

- **System transition:**

```text
empty repo → scaffold (tooling, CI, boundary test, shell) → editor usable → knowledge features → release binaries
                                  └→ rollback: previous release binary; files are plain Markdown, no state migration
```

- **Delivery constraints:** the boundary test and CI exist before feature code so violations never land; the OpenTUI paint and image APIs are confirmed against the pinned version before live-preview work depends on them; the Kanban `type` value is confirmed before Kanban ships.

## Success and Verification

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** This document
  - **Outcome:** across crash, external edit, and save failure scenarios, the file on disk is always a complete old or new version and dirty buffers are never overwritten without a prompt.
  - **Requirements:** RM261003ABZP-REQ1@R3
  - **Design:** RM261003ABZP-DES8@R2 - atomic write, own-write suppression, conflict rules
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S1@R1
      - **Scenario:** in a temp workspace: (a) kill the writer between write and rename (simulated by throwing after fsync); (b) modify an open clean file externally; (c) modify an open dirty file externally; (d) save `so`'s own buffer.
      - **Expected result:** (a) original content intact, no temp file left; (b) buffer reloads and `u` restores previous text; (c) conflict prompt appears, file and buffer unchanged until chosen; (d) no reload or conflict triggered.
      - **Method and target:** integration test on `workspace/fs.ts`, `workspace/watcher.ts`, and `core` conflict reducer
      - **Environment:** real file system (tmpdir), real `fs.watch`
      - **Unique risk:** per-file watch losing events after rename; self-triggered reload loops; partial writes.
      - **Predecessors:** None

- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** This document
  - **Outcome:** every command listed in RM261003ABZP-REQ2@R2 produces Neovim's result on the shared fixture cases.
  - **Requirements:** RM261003ABZP-REQ2@R2
  - **Design:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 - grammar, undo blocks, dot-repeat
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** table of `{ before text + cursor, keys, after text + cursor + register }` cases covering each motion, operator, text object, count, register, search, `:s`, undo/redo, and `.`; expected values recorded from Neovim 0.11 `--clean`.
      - **Expected result:** each case matches exactly.
      - **Method and target:** unit tests on `core/kernel/vim/engine.ts` `handleKey`
      - **Environment:** None — pure functions
      - **Unique risk:** subtle divergence (inclusive/exclusive motions, linewise yanks, cursor after undo).
      - **Predecessors:** None
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** feed a lone `\x1b` byte without kitty protocol, then `\x1b[A`, through `ui/input.normalizeKey` with `escTimeoutMs=50`.
      - **Expected result:** lone Esc yields `escape` after 50 ms ± 10 ms; the sequence yields `up` immediately.
      - **Method and target:** unit test on `ui/input.ts`
      - **Environment:** fake timers
      - **Unique risk:** Esc swallowed or arrow keys misread as Esc + letters.
      - **Predecessors:** None

- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** This document
  - **Outcome:** every command is reachable by name in the palette, leader sequences show which-key hints, pickers filter fuzzily, and config overrides apply or fail safely.
  - **Requirements:** RM261003ABZP-REQ3@R4
  - **Design:** RM261003ABZP-DES5@R2, RM261003ABZP-DES14@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V4@R2 — Keymap, which-key, palette, file-type scope, and config**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S3@R1
      - **Scenario:** (a) press `Space` and wait; (b) bind `"<leader>w" = "file.save"` in config and press it; (c) load a config with a syntax error on line 7; (d) set `XDG_CONFIG_HOME=relative/path`; (e) open the palette and type `back`; (f) bind `[filetypes.markdown.keys.normal] "<leader>w" = "link.backlinks"` alongside (b), press `<leader>w` in a note and in `sync.ts`; (g) press `gd` on `[[plan]]` in a note and on an identifier in `sync.ts`; (h) open the palette in `sync.ts` and type `follow`; (i) in `sync.ts`, run `:link.follow`.
      - **Expected result:** (a) which-key lists groups; (b) file saved; (c) notification names `config.toml:7` and defaults apply; (d) `~/.config/so/config.toml` used; (e) `link.backlinks` ranks first; (f) the note opens its backlinks, `sync.ts` saves; (g) the note follows the link, `sync.ts` does nothing; (h) `link.follow` is not listed; (i) the message line shows `not available for typescript files` and nothing changes.
      - **Method and target:** unit tests on `core/kernel/commands`, `workspace/config-file.ts`; component test through the OpenTUI test renderer for (a)
      - **Environment:** tmp config dirs; OpenTUI test renderer
      - **Unique risk:** config error crashing startup; overrides silently ignored; note keys leaking into other file types.
      - **Predecessors:** RM261003ABZP-V4@R1

- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** This document
  - **Outcome:** link following, completion, backlinks, and tags match the index; rename updates every reference while preserving format.
  - **Requirements:** RM261003ABZP-REQ4@R3
  - **Design:** RM261003ABZP-DES7@R4
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** workspace with `a/plan.md`, `b/plan.md`, `plan-x.md` (alias `plan`), `c/deep/plan.md`; resolve `[[plan]]` from `a/x.md`, from `root.md`, `[[b/plan]]`, `[[plan.md]]`, `[[note#H1#H2]]`, `[text](a/plan%20x.md)`.
      - **Expected result:** results follow the documented order exactly.
      - **Method and target:** unit tests on `core/features/links/resolve.ts`
      - **Environment:** None — in-memory index
      - **Unique risk:** nondeterministic or Obsidian-incompatible targets.
      - **Predecessors:** None
    - **RM261003ABZP-V6@R2 — Rename and link-mention preserve link formats**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** (a) rename `plan.md` → `projects/roadmap.md` with references `[[plan]]`, `[[plan|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)`, frontmatter `related: "[[plan]]"`, and an open dirty buffer containing `[[plan]]`; (b) run `link.linkMention` on an unlinked mention "Plan" of `plan.md` in an open dirty buffer and in a closed file.
      - **Expected result:** (a) all rewritten in place with kind, alias, subpath preserved and shortest unique path; the dirty buffer is edited in memory (not overwritten on disk); notification reports the file count. (b) only the mention span becomes `[[plan|Plan]]` (or `[[plan]]` when the text equals the basename); the open buffer is edited in memory and marked dirty; the closed file is written through the atomic write path; the mention moves from unlinked to linked in the backlinks result.
      - **Method and target:** unit tests on `planRename` and the mention span edit + integration test of the rename and `link.linkMention` commands
      - **Environment:** tmp workspace
      - **Unique risk:** broken links or clobbered unsaved edits.
      - **Predecessors:** RM261003ABZP-V6@R1

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** This document
  - **Outcome:** each element listed in RM261003ABZP-REQ5@R2 renders as specified, reveal follows the cursor line or block, and images use the best available protocol.
  - **Requirements:** RM261003ABZP-REQ5@R2
  - **Design:** RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V7@R2 — Layout golden tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** `test/fixtures/tour.md` (every element) laid out by `layoutText` with the Markdown `livePreview` provider at widths 60 and 100 with the cursor outside any block, on a bold line, inside a table, inside a callout; the same note in `source` view.
      - **Expected result:** `RenderLine[]` serialized to text + style tokens matches committed goldens.
      - **Method and target:** unit tests on `layoutText` + `lang/markdown/live-preview.ts`
      - **Environment:** None — pure
      - **Unique risk:** reveal or hiding regressions; broken table alignment; Markdown logic leaking into the kernel view.
      - **Predecessors:** RM261003ABZP-V7@R1
    - **RM261003ABZP-V8@R1 — Image protocol selection**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** render a note with a PNG in the OpenTUI test renderer with capabilities kitty / sixel / none / `images="off"`.
      - **Expected result:** kitty or sixel placement, block characters, or `[image: name.png]` placeholder respectively.
      - **Method and target:** component test on `ui/editors/text-view.ts` and the `image` widget painter
      - **Environment:** OpenTUI test renderer with mocked capabilities
      - **Unique risk:** images breaking layout or crashing on unsupported terminals.
      - **Predecessors:** None

- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** This document
  - **Outcome:** `:Today` and template insertion produce the same text Obsidian's core plugins would for the supported tokens.
  - **Requirements:** RM261003ABZP-REQ6@R2
  - **Design:** RM261003ABZP-DES11@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S6@R1
      - **Scenario:** format 2026-10-03T09:05 with every supported token and `[literal]`; expand a template containing all variables; compute daily paths for `YYYY-MM-DD` and `YYYY/MM/YYYY-MM-DD`; run `:Today` twice.
      - **Expected result:** strings equal Moment.js output for the same tokens; unsupported tokens stay literal; second `:Today` opens the existing file without changing it.
      - **Method and target:** unit tests on `core/time`, `core/features/notes`; integration test for `:Today`
      - **Environment:** fixed clock; tmp workspace
      - **Unique risk:** wrong dates, overwritten daily notes.
      - **Predecessors:** None

- **RM261003ABZP-S7@R1 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** This document
  - **Outcome:** table and Kanban views show the correct rows, edits write valid frontmatter, and unsupported layouts fall back safely.
  - **Requirements:** RM261003ABZP-REQ7@R2
  - **Design:** RM261003ABZP-DES12@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V10@R1 — Bases evaluation, edit, and compatibility**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S7@R1
      - **Scenario:** fixtures ported from Alfred's Bases tests plus a Kanban `.base` saved by Obsidian 1.14+; edit a cell; move a card; open a `cards` view; group by a formula.
      - **Expected result:** rows and order match fixtures; frontmatter patched with comments and order preserved; card move sets the property; `cards` opens as table with notice; moving is disabled for formula grouping.
      - **Method and target:** unit tests on `core/features/bases`; integration test of write-back
      - **Environment:** tmp workspace
      - **Unique risk:** YAML corruption; Kanban type mismatch with Obsidian.
      - **Predecessors:** None

- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** This document
  - **Outcome:** the browser follows edits within 300 ms and the server rejects foreign hosts and out-of-workspace paths.
  - **Requirements:** RM261003ABZP-REQ8@R2
  - **Design:** RM261003ABZP-DES13@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V11@R3 — Preview server behavior and safety**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S8@R1
      - **Scenario:** start preview; request with Host `evil.test:<port>`; request `/file/..%2f..%2fetc/passwd`; request a symlink pointing outside; request `/file/.git/config`; dispatch an edit and measure time to the SSE event; switch the active buffer to `scripts/sync.ts`; with an SSE client connected, run `:PreviewStop`; with `sync.ts` active, run `:Preview`.
      - **Expected result:** 403; 404; 404; 404; SSE `doc` event < 300 ms after the edit; no `doc` event for the switch to `sync.ts`, and `/render` still returns the last note; the client receives a `stopped` event before the connection closes and the port stops accepting connections; `:Preview` from `sync.ts` shows `not available for typescript files` and starts no server; server bound only to 127.0.0.1.
      - **Method and target:** integration test on `preview/server.ts`
      - **Environment:** real `Bun.serve`, tmp workspace with symlink
      - **Unique risk:** DNS rebinding, traversal, network exposure.
      - **Predecessors:** RM261003ABZP-V11@R1, RM261003ABZP-V11@R2

- **RM261003ABZP-S9@R1 — Performance targets hold**
  - **Definition:** This document
  - **Outcome:** the targets in RM261003ABZP-REQ9@R2 are met on the reference machine and gated at 2× in CI.
  - **Requirements:** RM261003ABZP-REQ9@R2
  - **Design:** RM261003ABZP-DES16@R1, RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES7@R4, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V12@R2 — Keystroke and open-file benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** open the 5,000-line fixture note in live preview, and the 5,000-line TypeScript fixture in source view with highlighting, in the OpenTUI test renderer (120×40); send 200 mixed keystrokes (`j`, `w`, `i` + text + `Esc`, `dd`, `u`) to each; measure input → frame complete; measure open time; scroll each file for 2 s with held `j` and repeated `Ctrl-d`/`Ctrl-u` and record frame times with the in-process frame metrics (`RM261003ABZP-RF2`).
      - **Expected result:** for both files, p95 < 16 ms and open < 50 ms on the reference machine; scrolling frame time p95 < 16.7 ms (60 fps); CI median of 5 runs < 32 ms, < 100 ms, and < 33.4 ms.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** OpenTUI test renderer; fixed CI runner type
      - **Unique risk:** full-document parse, layout, or highlighting sneaking into the keystroke path.
      - **Predecessors:** RM261003ABZP-V12@R1
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** generate a 10,000-note workspace; start `so`; record time to first interactive frame and to index ready; type during indexing.
      - **Expected result:** first frame < 200 ms; index ready < 3 s; keystrokes during indexing still meet the V12 budget.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** generated fixture; real worker
      - **Unique risk:** indexing blocking the main thread.
      - **Predecessors:** None

- **RM261003ABZP-S10@R1 — Development, CI, and release are fast and automatic**
  - **Definition:** This document
  - **Outcome:** `bun run check` < 30 s; CI < 3 min; release produces four checksummed binaries that start.
  - **Requirements:** RM261003ABZP-REQ10@R3
  - **Design:** RM261003ABZP-DES15@R3
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V14@R1 — Check timing, CI timing, and release dry run**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S10@R1
      - **Scenario:** time `bun run check` locally; read CI run durations; run the release workflow on a pre-release tag.
      - **Expected result:** < 30 s; < 3 min; GitHub Release with 4 binaries + `SHA256SUMS`; smoke jobs print `so <version>` on macOS and Linux.
      - **Method and target:** non-test check on CI and release workflows
      - **Environment:** GitHub Actions
      - **Unique risk:** slow feedback loops; binaries missing OpenTUI's native library.
      - **Predecessors:** None

- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored**
  - **Definition:** This document
  - **Outcome:** boundary violations fail CI; features extend by registration; terminal state is restored on every exit path; standards are followed.
  - **Requirements:** RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V15@R2 — Import boundary test**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** scan every `src/**/*.ts` with `Bun.Transpiler.scanImports`; include two deliberate violation fixtures: a core file importing `node:fs`, and a `src/core/kernel/**` file importing `src/core/lang/markdown`.
      - **Expected result:** core imports only core and allowed parsing packages; only `src/ui/**` imports `@opentui/*`; `src/core/kernel/**` imports only `src/core/kernel/**`; both fixtures fail.
      - **Method and target:** `test/boundaries.test.ts`
      - **Environment:** None
      - **Unique risk:** layering eroding silently; Markdown assumptions creeping into the kernel.
      - **Predecessors:** RM261003ABZP-V15@R1
    - **RM261003ABZP-V16@R2 — Registration-only extension**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** a test module registers a command, a keymap, a syntax extension, and a block renderer; a second test module registers a `csv` file type with a highlighter, a decoration provider, and a `csv`-scoped keymap; a third registers an editor kind `grid`, a `.grid` file type using it, and a UI view for it — none touches other modules.
      - **Expected result:** the command runs from the palette and keymap; the syntax renders through the renderer; opening `data.csv` uses the `csv` file type, its highlighter marks, its decorations, and its key binding; opening `t.grid` creates window content `{editor: "grid"}` and the shell paints the registered view, with no edit to dispatch code.
      - **Method and target:** unit test across `core/kernel/commands`, `core/filetypes`, `core/lang/markdown`, `core/kernel/view`; component test for `ui/editors` registration
      - **Environment:** None
      - **Unique risk:** hidden switch statements that require edits to extend.
      - **Predecessors:** RM261003ABZP-V16@R1
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** in a PTY, start `so`, then exit by `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception; set `NO_COLOR=1` in one run.
      - **Expected result:** after each exit the PTY is back on the main screen with cursor visible, mouse and kitty keyboard modes off; the `NO_COLOR` run emits no colour SGR codes.
      - **Method and target:** e2e PTY test in `test/e2e/`
      - **Environment:** real PTY (`Bun.spawn` with a pseudo-terminal), headless terminal emulator to read state
      - **Unique risk:** leaving the user's terminal broken.
      - **Predecessors:** None

- **RM261003ABZP-S12@R1 — Any text file opens safely on a language-neutral core**
  - **Definition:** This document
  - **Outcome:** non-Markdown UTF-8 files open in source view with highlighting where recognized, binary and oversized files are refused without writes, and saves keep the file's BOM and line endings. Keeping note-only keys and commands out of other file types is part of RM261003ABZP-S3@R1 (RM261003ABZP-V4@R2).
  - **Requirements:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V18@R1 — Open text, code, binary, and oversized files**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S12@R1
      - **Scenario:** in a tmp workspace: (a) `:e scripts/sync.ts`, `:e config.yaml`, `:e notes.txt`, `:e Makefile`; (b) `:e photo.png` and a file with a NUL byte at offset 100; (c) a file containing invalid UTF-8; (d) a generated 17 MiB text file; (e) edit and save a CRLF file with a UTF-8 BOM.
      - **Expected result:** (a) each opens in source view; `.ts` and `.yaml` lines carry highlighter style tokens, `notes.txt` resolves to `text` and `Makefile` resolves to `makefile` by file name; (b, c) `binary file — not opened`, no buffer created; (d) `file too large — not opened (limit 16 MiB)`; (e) the saved bytes keep the BOM and every `\r\n`.
      - **Method and target:** unit tests on `core/filetypes` and `workspace/fs.readTextFile`; integration test of open and save through the store
      - **Environment:** tmp workspace; real file system
      - **Unique risk:** binary files corrupted by a text save; file-type mismatch; BOM or line endings lost on save.
      - **Predecessors:** None

## Design Decisions and Traceability

- **RM261003ABZP-DES1@R2 — One process, one package, four layers, and a language-neutral kernel, with a tested import boundary**
  - **Requirements:** RM261003ABZP-REQ11@R3 - pure core, enforced boundaries, language-neutral kernel; RM261003ABZP-REQ10@R3 - fast checks
  - **Decision:** `src/core` (pure), `src/workspace` (I/O), `src/ui` (OpenTUI), `src/preview` (HTTP), wired only in `src/app`. Inside the core, `kernel/` (text, editor, vim, commands, view) imports only `kernel/`; `filetypes/`, `lang/`, and `features/` build on it; `state/` and `config/` compose everything. A `bun test` boundary test using `Bun.Transpiler.scanImports` enforces both the layer rules and the kernel rule.
  - **Explanation:** System Architecture diagram; Project Structure; `test/boundaries.test.ts`. One package keeps install and CI fast; the test needs no TypeScript API (`RM261003ABZP-RF13`). The kernel rule is what keeps `so` able to become a code or notebook editor: Markdown cannot leak into editing, and a new language is a new folder plus registrations.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred needed six packages because of its kernel; `so` has no server boundary. `rm261003abzp-roadmap-context.md@R2` - scope change: leave room for code editing and notebooks.
  - **Research:** `RM261003ABZP-RF1` - contain OpenTUI to the UI layer; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3). `RM261003ABZP-RF13` - avoid TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** folder conventions rather than package boundaries; rejected a Turborepo monorepo (slower, more config) and dependency-cruiser (TS 7 issue). Rejected separate `editor-core` and `markdown` packages: same isolation as the kernel rule but with workspace and build overhead.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-DES1@R1

- **RM261003ABZP-DES2@R2 — One store with a pure reducer and data-only effects**
  - **Requirements:** RM261003ABZP-REQ11@R3 - stable, testable foundations; RM261003ABZP-REQ1@R3 - autosave and conflicts; RM261003ABZP-REQ9@R2 - predictable rendering
  - **Decision:** `update(state, action) → { state, effects }`; effects are plain data executed by `app/effects.ts`; results return as actions.
  - **Explanation:** Action and Effect protocol; AppState; `src/core/state/update.ts`. Every behavior (autosave timing, conflict choice, rename) is a pure function test.
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts` - Alfred's vim core already returns effects instead of performing them.
  - **Research:** None
  - **Tradeoffs:** an extra indirection for I/O; rejected UI components holding state (hard to test, the Ink/React pattern Alfred needed a compositor around).
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** RM261003ABZP-DES2@R1

- **RM261003ABZP-DES3@R1 — Line-array TextBuffer behind an interface, with vim undo blocks**
  - **Requirements:** RM261003ABZP-REQ2@R2 - undo per undo block; RM261003ABZP-REQ9@R2 - 5,000-line target
  - **Decision:** immutable line array with structural sharing; `apply(edit)` returns an inverse; undo stack of blocks (one Normal command or one Insert session).
  - **Explanation:** TextBuffer model; `src/core/kernel/text/text-buffer.ts`. A piece table can replace the implementation without changing callers.
  - **Evidence:** `alfred/apps/tui/src/view/editor/text-buffer.ts` - single-string buffer (186 lines) as reference.
  - **Research:** `RM261003ABZP-RF6` - line array adequate at ≤ 5,000 lines; undo block = typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** O(lines) splices on huge files; rejected OpenTUI's native `EditBuffer` as source of truth (couples core to a 0.x UI library).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES4@R1 — Table-driven vim engine**
  - **Requirements:** RM261003ABZP-REQ2@R2 - core vim command set, Esc timeout
  - **Decision:** a pure key-sequence parser for `[count]["reg][count]op[count](motion|textobject)` with motion, operator, and text-object tables; mode machine (normal, insert, visual char/line, cmdline); last-change record for `.`; ex command table.
  - **Explanation:** `src/core/kernel/vim/engine.ts`; Esc timeout handled in `ui/input.ts` (RM261003ABZP-DES10@R2).
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts:15` - Alfred supports only two modes with a hard-coded pending set.
  - **Research:** `RM261003ABZP-RF5` - kitty keyboard protocol, 50 ms timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** no macros or Visual block in v1 (deferred); rejected embedding Neovim (user decision).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES5@R2 — Command registry and file-type-scoped keymap trie as the single extension point for actions**
  - **Requirements:** RM261003ABZP-REQ3@R4 - leader, which-key, palette, config, file-type scope; RM261003ABZP-REQ11@R3 - extend by registration
  - **Decision:** every action is a named `Command`, optionally limited to file types; keys map to command ids through a trie keyed by `{mode, filetype?}`, with the file-type level checked before the global level; which-key, palette, help, and config overrides (`keys.<mode>`, `filetypes.<id>.keys.<mode>`) read the same registry. Note keys (`gd`, `Enter` on links, `<leader>m`, `<leader>x`) are bound for `markdown` only.
  - **Explanation:** `src/core/kernel/commands/registry.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input - LazyVim style; `rm261003abzp-roadmap-context.md@R2` - keymaps scoped by mode and file type.
  - **Research:** None
  - **Tradeoffs:** commands must be pure (state + effects), which forbids quick ad-hoc I/O in commands; accepted for testability. Rejected VS Code-style `when` expressions: a file-type scope covers v1 and the known code-editor need with far less machinery.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** RM261003ABZP-DES5@R1

- **RM261003ABZP-DES6@R2 — micromark/mdast with Obsidian extensions and block-level reparse**
  - **Requirements:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2
  - **Decision:** port Alfred's micromark + GFM + math parsing and Obsidian syntax into `core/lang/markdown` as the `markdown` file type's `analyze`; split into blocks and reparse only changed blocks; one `Doc` with two levels feeds layout, index, and HTML: a linear scan level (links, tags, headings, block ids, frontmatter) used by the index and link features, and mdast built lazily per block for live preview and HTML. Each Obsidian syntax is defined once in `syntaxExtensions` for both levels.
  - **Explanation:** Doc model; `src/core/lang/markdown/doc.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` - existing micromark pipeline; `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md` (DES2, Assigned Parent Obligation Coverage) - a full mdast parse took 11.8 s for 10,000 notes and about 350 ms for the `openFile` fixture; delivered in `src/core/lang/markdown/` (PR #2).
  - **Research:** `RM261003ABZP-RF7` - micromark conformant but not incremental; block reparse meets budgets; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block splitting must handle lists, fences, and frontmatter carefully; two parse levels must agree, which the shared `syntaxExtensions` registry and a conformance test enforce; rejected OpenTUI's tree-sitter Markdown (UI-layer dependency, no Obsidian syntax) and Lezer (skips link reference validation; another parser to learn).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** RM261003ABZP-DES6@R1

- **RM261003ABZP-DES7@R4 — Worker-built in-memory index with a documented resolution rule**
  - **Requirements:** RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename; RM261003ABZP-REQ3@R4 - pickers and full-text search; RM261003ABZP-REQ9@R2 - non-blocking index
  - **Decision:** a Bun `Worker` lists every non-excluded workspace file, summarizes Markdown notes from the scan level of `parseDoc`, and answers full-text queries over Markdown notes and other text files that pass the REQ1 text checks; the main thread holds `NoteIndex` (summaries plus the file list) under `core/features/links`; resolution order: root path → alias → basename ranked by same folder, shortest path, alphabetical; `planRename(ix, moves, open)` rewrites link spans only, from open buffers' scans and the summaries' link spans, without reading files; one link rewrite runs at a time; `link.linkMention` wraps one unlinked mention in `[[…]]` in its source note through a span edit (open buffer in memory, closed file via `write`).
  - **Explanation:** NoteSummary and NoteIndex; `resolve.ts`; `rename.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred used SQLite; `so` has no persistence need for the index; `.s1mple/work/done/w261003fx70-navigation-and-links/` system design DES3, DES4, DES6 and goal deviations D2, D3; delivered in `src/core/features/links/` and `src/workspace/index-worker.ts` (PR #2).
  - **Research:** `RM261003ABZP-RF8` - duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Tradeoffs:** reindex on every start (< 3 s target); searching all text files reads more bytes than notes alone, bounded by `.gitignore` exclusion and the 16 MiB per-file limit; rejected SQLite (persistence and schema cost without need) and ripgrep (external binary).
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES7@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES7@R3

- **RM261003ABZP-DES8@R2 — Atomic saves, directory watching, own-write stamps, and trash adapters**
  - **Requirements:** RM261003ABZP-REQ1@R3 - safe file management
  - **Decision:** `atomicWrite` (realpath → same-dir temp → fsync → chmod → rename); `fs.watch(root, {recursive:true})` with per-path debounce and own-write stamps; trash via freedesktop spec on Linux and, on macOS, `/usr/bin/trash` when present, else `NSFileManager` through JXA (`osascript -l JavaScript` with the path as an argument), both without a permission prompt; else typed confirmation; autosave policy and conflict rules live in core.
  - **Explanation:** `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow.
  - **Evidence:** `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - autosave queue reference; `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-research.md` RF11 - Finder automation prompts for Automation permission, while `/usr/bin/trash` (macOS 15+) and `NSFileManager` move to the trash without a prompt; RF8 - recursive `fs.watch` confirmed on macOS and Linux; delivered in `src/workspace/trash.ts` and `watcher.ts` (PR #1).
  - **Research:** `RM261003ABZP-RF11` - fsync, same directory, directory watching, undoable reload; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (current RM261003ABZP-REQ1@R3)
  - **Tradeoffs:** rename-based saves replace hard links (acceptable for notes); recursive `fs.watch` relies on platform support in Bun on macOS and Linux — confirmed by DI1 (RF8 above) and re-proved in CI on both platforms.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** RM261003ABZP-DES8@R1

- **RM261003ABZP-DES9@R3 — Viewport-only text view with decorations; Markdown live preview as a decoration provider**
  - **Requirements:** RM261003ABZP-REQ5@R2 - live preview; RM261003ABZP-REQ9@R2 - smooth scrolling; RM261003ABZP-REQ11@R3 - language-neutral kernel, registered decoration providers
  - **Decision:** the kernel's pure `layoutText` produces `RenderLine[]` for visible rows only from text plus decorations (`mark`, `replace`, `widget`, `line`) returned by the view's providers and the file type's highlighter. Markdown live preview is the `livePreview` provider in `lang/markdown`: the cursor line reveals inline syntax, a cursor inside a multi-line block reveals the whole block, folded callouts and expanded embeds follow the window's `folds` set, block renderers are registered per block kind, and widgets (image, embed, base) reserve rows. Source view uses highlighter marks only — the same path code files use. The live-preview input (`MarkdownViewInput`: the `Doc` plus a read-only `PreviewCtx`) comes from the Markdown views' `input` hook, so neither the kernel nor the UI knows about Markdown.
  - **Explanation:** FileType and Decoration model; RenderLine model; `src/core/kernel/view/text-view.ts`; `src/core/lang/markdown/live-preview.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/editor/reveal-units.ts` - reveal units reference. Industry precedent: CodeMirror 6 decorations (the basis of Obsidian's live preview), Neovim extmarks and conceal, VS Code decorations.
  - **Research:** `RM261003ABZP-RF7` - per-element reveal in Obsidian; block reveal for multi-line constructs; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal; one decoration list per frame instead of direct painting, accepted because it is bounded by visible lines; rejected OpenTUI `MarkdownRenderable` conceal (UI-owned parsing, no Obsidian syntax) and a Markdown-specific `layoutViewport` (would make every future language reimplement layout).
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES9@R1, RM261003ABZP-DES9@R2

- **RM261003ABZP-DES10@R2 — OpenTUI shell with editor-kind views, widget painters, normalized input, and guaranteed terminal restore**
  - **Requirements:** RM261003ABZP-REQ2@R2 - Esc, cursor shape; RM261003ABZP-REQ3@R4 - explorer, overlays; RM261003ABZP-REQ5@R2 - images; RM261003ABZP-REQ7@R2 - Bases views; RM261003ABZP-REQ11@R3 - restore, `NO_COLOR`, terminal support, registration
  - **Decision:** `@opentui/core` pinned exactly; layout of explorer, bufferline, window splits, side panel, statusline, cmdline, overlays; each window renders through the view registered for its editor kind (`text` → custom `EditorView` renderable painting `RenderLine[]`; `base` → Bases view); widgets are painted by painters registered per widget type (`image` via OpenTUI's auto protocol kitty → sixel → blocks, `embed`, `base`, `rule`); input normalized to `Key` with kitty keyboard protocol and Esc timeout; theme tokens with `NO_COLOR`; restore on exit, signals, and uncaught errors.
  - **Explanation:** `src/ui/*`; `src/ui/editors/`; `src/ui/widgets/`.
  - **Evidence:** `alfred/apps/tui/src/terminal/shutdown.ts` - restore coordinator reference; Context7 `/anomalyco/opentui`.
  - **Research:** `RM261003ABZP-RF1`, `RM261003ABZP-RF2`, `RM261003ABZP-RF4`, `RM261003ABZP-RF5`; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** dependence on a 0.x library contained to `src/ui`; rejected Ink (React redraw cost) and a custom renderer (upfront cost). A notebook later adds one editor view; no shell change.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES9@R3
  - **Predecessors:** RM261003ABZP-DES10@R1

- **RM261003ABZP-DES11@R1 — Shared Moment-subset formatter, pure template expansion, and daily-note commands**
  - **Requirements:** RM261003ABZP-REQ6@R2 - daily notes and templates; RM261003ABZP-REQ7@R2 - Bases date formatting
  - **Decision:** `core/time/format.ts` implements the documented token subset and `[literal]`; `core/features/notes` computes daily paths (with `/` subfolders) and expands `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}`; commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`.
  - **Explanation:** `src/core/time/format.ts`; `src/core/features/notes/*`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input.
  - **Research:** `RM261003ABZP-RF10` - Moment tokens, `{{time:FORMAT}}`, subfolders; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Tradeoffs:** rare tokens unsupported (kept literal); rejected Moment.js and Day.js dependencies (maintenance mode; extra weight).
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** None

- **RM261003ABZP-DES12@R2 — Ported Bases engine as a registered `base` editor kind, with table and Kanban view models and YAML-preserving write-back**
  - **Requirements:** RM261003ABZP-REQ7@R2 - Bases table and Kanban views; RM261003ABZP-REQ11@R3 - editor kinds by registration
  - **Decision:** port `alfred/packages/vault/src/domain/bases/*` (parser, evaluator, expression, yaml-patcher) and `alfred/packages/view-model/src/base/*` row and board rules into `core/features/bases`; `.base` is registered as file type `base` with editor kind `base`, so opening it puts `{editor:"base", path, view, cursor}` in the window; view models `TableModel` and `KanbanModel`; unknown layouts map to `TableModel` with a notice; the Kanban `type` string is one constant verified against an Obsidian 1.14+ file; edits become `write` effects through the atomic save path; embeds render through a `base` block renderer and `base` widget painter.
  - **Explanation:** `src/core/features/bases/*`; `src/ui/editors/` Bases view.
  - **Evidence:** `alfred/packages/vault/src/domain/bases/parser.ts:19`, `evaluator.ts:164` - no file-system or Bun imports (context assumption).
  - **Research:** `RM261003ABZP-RF9` - layouts, Kanban rules; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - **Tradeoffs:** follows an early-access Obsidian layout; guarded by the constant, a fixture, and the table fallback. Bases is the first non-text editor kind, so the seam a notebook needs is exercised in v1 rather than designed speculatively.
  - **Dependencies:** RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES12@R1

- **RM261003ABZP-DES13@R2 — `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering**
  - **Requirements:** RM261003ABZP-REQ8@R2 - read-only preview
  - **Decision:** `preview/server.ts` binds `127.0.0.1:0`, checks Host, serves a page shell, SSE `/events` (`doc` and `stopped` events), `/render` fragments from core `renderHtml(doc)`, and contained `/file/*`; the page loads KaTeX and Mermaid from jsDelivr and falls back to showing source when offline. `:Preview` is a Markdown-only command and the page follows Markdown notes only; switching to another file type sends no `doc` event (flow-level refinement, revision retained).
  - **Explanation:** Preview HTTP routes; `src/preview/server.ts`; `src/core/lang/markdown/html.ts`.
  - **Evidence:** user decision "no Next.js".
  - **Research:** `RM261003ABZP-RF12` - binding, Host check, containment, SSE; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Tradeoffs:** math and diagrams need network in the browser (fallback to source); rejected bundling KaTeX/Mermaid into the binary (multi-MB size) and WebSocket (bidirectional not needed).
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4
  - **Predecessors:** RM261003ABZP-DES13@R1

- **RM261003ABZP-DES14@R2 — TOML config at XDG path validated by schema; per-workspace state at XDG state path**
  - **Requirements:** RM261003ABZP-REQ3@R4 - configuration and state
  - **Decision:** `toml-eslint-parser` (1.0.3, exact pin) + zod schema (`core/config/schema.ts`, `core/config/toml.ts`), so every error names the TOML line; `editor.tabWidth`, `editor.wrap`, and `editor.relativeNumbers` are delivered with DI2; config path honors XDG rules (relative values ignored); invalid config → error notice + defaults; state JSON at `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json` holding recent notes, jump list, open buffers, window layout.
  - **Explanation:** AppConfig; `src/workspace/config-file.ts`; `src/workspace/state-file.ts`.
  - **Evidence:** `rm261003abzp-research.md` S21, S9, S30; `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-requirements.md` Discussion Evidence - `Bun.TOML.parse` errors report the JavaScript call site, not the TOML line; the editor options were approved by the user for DI2 on 2026-10-03; delivered in `src/core/config/` (PR #2).
  - **Research:** `RM261003ABZP-RF15` - TOML, XDG rules, state home; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4)
  - **Tradeoffs:** TOML instead of the proposal's `config.ts` — no code execution and simpler validation, at the cost of no scripting in config (agent decision under delegation). One pinned parser dependency instead of Bun's built-in parser, for line-numbered errors.
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** RM261003ABZP-DES14@R1

- **RM261003ABZP-DES15@R3 — Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile**
  - **Requirements:** RM261003ABZP-REQ10@R3 - fast checks, CI, release; RM261003ABZP-REQ11@R3 - Conventional Commits, SemVer
  - **Decision:** Bun (exact version in `packageManager`), TypeScript 7 `tsc --noEmit` strict, Biome, knip, `bun test` (unit colocated; component via OpenTUI test renderer; few PTY e2e); `bun run check` = biome check + tsc + knip + boundary test + unit tests; CI jobs `check` and `test` (component, e2e, bench) in parallel with Bun cache, triggered on pull requests only, a newer push cancelling the superseded run; release-please on `main`, which calls the release workflow through `workflow_call` when it creates a release (a manually pushed `v*` tag also triggers it); release workflow: `bun install --os="*" --cpu="*"`, compile `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64`, `bun-linux-arm64` with `OPENTUI_LIBC=glibc` defined for Linux, every `bun build --compile` (local `build` and release) listing `src/app/main.ts` and `src/workspace/index-worker.ts` as entrypoints so the binary embeds the index worker, `SHA256SUMS`, smoke `so --version` natively for each target (`macos-15` arm64, `macos-15-intel` x64, `ubuntu-24.04` x64, `ubuntu-24.04-arm` arm64) before publishing.
  - **Explanation:** Project Structure (`package.json`, `.github/workflows/*`).
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's eight CI groups are the anti-pattern avoided; user decision 2026-10-03 for PR-only CI (private repository, billed macOS minutes); `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-research.md` RF7 - one runner cross-compiles all four targets, and only a native runner proves each binary starts; RF9 - a release created by release-please with `GITHUB_TOKEN` does not trigger tag workflows, so the build is wired to its outputs; delivered in `.github/workflows/` (PR #1); a single-entrypoint binary drops the worker (`.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-requirements.md` Discussion Evidence), fixed in `package.json` and `release.yml` (PR #2).
  - **Research:** `RM261003ABZP-RF3`, `RM261003ABZP-RF13`, `RM261003ABZP-RF14`; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R3)
  - **Tradeoffs:** unsigned macOS binaries (signing deferred); release-please adds a bot PR; pushes to `main` run no CI, so `main` relies on the pull-request run of its merge head; four smoke runners add billed macOS minutes per release only.
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** RM261003ABZP-DES15@R1, RM261003ABZP-DES15@R2

- **RM261003ABZP-DES16@R1 — Performance by construction plus benchmark gates**
  - **Requirements:** RM261003ABZP-REQ9@R2 - performance targets
  - **Decision:** viewport-only layout (DES9), block parse cache (DES6), worker index and search (DES7), frame coalescing (one render per input burst), first frame before indexing, lazy image decode with an LRU cache (64 MiB), and benchmarks through the OpenTUI test renderer gated at 2× (median of 5) in CI.
  - **Explanation:** Keystroke to frame and Startup flows; `test/bench/`.
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's 64 MiB image budget precedent.
  - **Research:** `RM261003ABZP-RF2` - in-process metrics; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Tradeoffs:** benchmarks add CI time (bounded by the 3 min budget); terminal display latency is outside the measurement.
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES9@R3
  - **Predecessors:** None

- **RM261003ABZP-DES17@R1 — File-type registry, highlighter interface, and text-file open policy**
  - **Requirements:** RM261003ABZP-REQ1@R3 - any text file, binary and size guard, BOM; RM261003ABZP-REQ3@R4 - file-type scope; RM261003ABZP-REQ11@R3 - file types, highlighters, decoration providers, editor kinds by registration
  - **Decision:** a `FileTypeRegistry` maps a path to a `FileType` (extension, then file name, then the built-in `text` fallback); a file type declares its editor kind (an open string; non-`text` kinds register an `EditorKindSpec` in core, which creates the window state, and a UI view in `editorViews`, which paints it), views with decoration providers and an optional `input` hook whose context type the language declares and `core/state` builds, optional `Highlighter` (a kernel interface), and optional `analyze` hook. Note-only commands, including `:Preview`, are limited to `markdown`. v1 registers `text`, `markdown`, `base`, and code file types backed by one lowlight `Highlighter` (viewport-bounded, cached per buffer version). `workspace/fs.readTextFile` refuses files over 16 MiB and files with a NUL in the first 8 KiB or invalid UTF-8, strips and remembers a BOM and line separator; saves restore both.
  - **Explanation:** FileType and Decoration model; Open a file flow; `src/core/filetypes/registry.ts`; `src/core/lang/code/highlight.ts`; `src/workspace/fs.ts` `readTextFile`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R2` - "Apply all six" decision; `alfred/apps/tui/src/view/markdown/code-highlight.ts` - lowlight precedent. Industry precedent: Neovim `filetype` + ftplugins, VS Code language contributions, Git's NUL-byte binary heuristic.
  - **Research:** None - the decision reuses existing findings (RF6 pure text model, RF7 parse and reveal).
  - **Tradeoffs:** lowlight is regex-based and not incremental, so very long multi-line constructs above the 200-line look-back can highlight wrongly; accepted for v1 and replaceable by tree-sitter behind `Highlighter`. Rejected adding tree-sitter now (WASM grammars, build and size cost without a v1 need) and a generic notebook-ready `Document` abstraction (speculative; editor kinds already cover it). The 16 MiB limit is a fixed constant, not configuration.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES8@R2
  - **Predecessors:** None

| Current requirement | Design decision | Canonical design location | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; `src/core/filetypes/`; Open a file and Save and external change flows | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | `src/core/kernel/text/`, `src/core/kernel/editor/`, `src/core/kernel/vim/`, `src/ui/input.ts` | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, config, state, file-type scope | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R1 | `src/core/kernel/commands/`, `src/ui/overlays/`, `src/workspace/config-file.ts`, `state-file.ts` | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links | RM261003ABZP-DES7@R4, RM261003ABZP-DES6@R2 | `src/core/features/links/` | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | `src/core/lang/markdown/`, `src/core/kernel/view/`, `src/ui/editors/`, `src/ui/widgets/` | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | `src/core/time/`, `src/core/features/notes/` | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | `src/core/features/bases/`, `src/ui/editors/` | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - preview | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R2 | `src/preview/`, `src/core/lang/markdown/html.ts` | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-DES16@R1 | Keystroke and Startup flows; `test/bench/` | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R3 - dev, CI, release | RM261003ABZP-DES15@R3, RM261003ABZP-DES1@R2 | `package.json`, `.github/workflows/` | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1 | `test/boundaries.test.ts`, `src/core/kernel/`, `src/core/filetypes/`, registries, `src/ui/shell.ts` | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

## Unresolved Items

None — open technical confirmations are delivery constraints with named verification, not design decisions. DI1 confirmed the OpenTUI paint, buffer, and test-renderer APIs at `@opentui/core` 0.5.14 and recursive `fs.watch` on macOS and Linux. The OpenTUI image API at the pinned version (before DI3 relies on it) and the Kanban `type` value (DI4) remain.

## Approval

- **Requirement baseline:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 … RM261003ABZP-REQ10@R3, RM261003ABZP-REQ11@R3
- **Approved design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R3, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
- **Approved success and verification:** RM261003ABZP-S1@R1 … RM261003ABZP-S12@R1; RM261003ABZP-V1@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1, RM261003ABZP-V4@R2, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1, RM261003ABZP-V9@R1, RM261003ABZP-V10@R1, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V13@R1, RM261003ABZP-V14@R1, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1
- **Approval evidence:** User delegated all decisions on 2026-10-03 ("you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"); the agent approved this design, the DES2/DES7/DES9/DES13 R2 revisions from the UI system-impact assessment, and the V6/V11 R2 verification revisions, under that delegation. On 2026-10-03 the user approved the Markdown-first, language-neutral core by selecting "Apply all six (Recommended)" (kernel split, FileType registry, decorations, file-type keymaps, highlighter interface, open any text file); this produced DES1@R2, DES5@R2, DES7@R3, DES9@R3, DES10@R2, DES12@R2, DES17@R1, S12@R1, V18@R1, and the V4/V7/V12/V15/V16 R2 revisions. The user then delegated every remaining sub-decision on 2026-10-03 ("you self-drive everything. Everything is good now, don't need to stop"), covering the 16 MiB limit, binary check, BOM preservation, all-file picker and text-file search, `[filetypes.<id>.keys.<mode>]` config, no statusline file-type segment, S12/V18, the TypeScript benchmark, and the lowlight look-back. Post-DI1 synchronization approved by the user on 2026-10-03: DES8@R2 (macOS trash without a prompt) and DES15@R2 (pull-request-only CI, `workflow_call` release, native smoke). Post-DI2 synchronization approved by the user on 2026-10-04: DES6@R2 (two-level Markdown model), DES7@R4 (scan-level summaries, `planRename` from moves and open scans, one link rewrite at a time), DES14@R2 (`toml-eslint-parser`, editor options), and DES15@R3 (index worker as a second compile entrypoint).
``````

- **RM261003ABZP-DES13@R2 — DI3 design synchronization: KaTeX and Mermaid served from the binary, web images, cursor-line payload**
  - **Archived at:** 2026-10-03T23:53:33Z
  - **Change type:** Revised
  - **Reason:** The DI3 system design (W261003S6BQ, finalized at `7b9bfa6`) records three user decisions of 2026-10-04: the browser preview serves KaTeX and Mermaid from the repository instead of jsDelivr; the browser preview loads web images when the internet is available; and the terminal editor downloads web images referenced by notes. The first reverses the DES13@R2 tradeoff, and the last two change the cross-cutting network rule.
  - **Changes:**
    - DES13: the page loads KaTeX and Mermaid from `/assets/*`, embedded in the binary from exact-pinned npm packages; every response carries a Content Security Policy that allows code, styles, fonts and connections only from the server's own origin, and images also from the web, with `nosniff` and `no-referrer`; a render error shows that block's source. The `doc` payload is `{path, version, line}` (the cursor line) instead of `{path, version, anchor}`. Tradeoffs: binary size and the web-image IP disclosure replace "math and diagrams need network"; loading KaTeX and Mermaid from a CDN is the rejected option. Preview runtime flow, Preview HTTP routes (routes, invariants, `off → starting → on(port) → off`), and the `src/preview/server.ts` shape updated.
    - AppState `preview` gains the `starting` variant (`off | starting | on(port)`).
    - Cross-cutting Security and privacy row: the only outbound network use is fetching web images referenced by notes the user views, in the terminal (`src/workspace/images.ts`) and in the browser preview; everything else stays loopback-only. No DES record limited image sources, so no other record changes revision; the terminal fetch details (10 s timeout, 16 MiB cap, no cookies, no Referer, `preview.images = "off"` disables it, memory-only cache, `[image: <name>]` with a 60 s retry) are recorded in the PH2 phase design.
    - Reference updates, revisions retained: every other reference in this document (components, runtime flows, contracts, code design, S8, traceability, approval) cites DES13@R3.
  - **Record transitions:**
    - RM261003ABZP-DES13@R2 → RM261003ABZP-DES13@R3 - revision change (local KaTeX and Mermaid, same-origin policy with web images, `line` payload)
    - RM261003ABZP-DES2@R2, RM261003ABZP-DES16@R1, RM261003ABZP-S8@R1, RM261003ABZP-V11@R3 - Revision retained
  - **Requirement baseline:** Unchanged.
  - **Evidence:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md` Assigned Parent Obligation Coverage, Pending parent synchronization items 1–9; `w261003s6bq-requirements.md` W261003S6BQ-REQ7@R2 and W261003S6BQ-REQ2@R2.
  - **Research provenance:**
    - None - no new roadmap research. RM261003ABZP-RF12 support for DES13 (binding, Host check, containment, SSE) is unchanged.
  - **Affected coverage:** RM261003ABZP-REQ8@R2 → DES13@R2, DES6@R2 becomes → DES13@R3, DES6@R2; S8@R1 and V11@R3 links unchanged.
  - **Approval evidence:** Approved by the user on 2026-10-04.
  - **Downstream impact:** `rm261003abzp-roadmap-index.md`, `rm261003abzp-roadmap-phase-2-obsidian-experience.md` (PH2@R4, DI3@R3), `rm261003abzp-ui-design.md` (UDES10@R2, UV9@R2), and `rm261003abzp-ui-requirements.md` cite DES13@R3. `rm261003abzp-ui-context.md@R2` and `ui-mockups/manifest.md` keep DES13@R2 as the source evidence of their accepted revisions. W261003S6BQ (DI3) produced this change and reconciles its binding; W261003HEGE and W261003FX70 are unaffected.

``````markdown
# RM261003ABZP: so v1 — Design

- **Status:** Approved
- **Outcome:** One Bun process with a pure TypeScript core — a language-neutral editor kernel (text, vim, commands, view) plus registered file types, Markdown language support, and note features (links, notes, Bases) — driven by one-way state flow, thin I/O adapters, an OpenTUI shell that draws only visible lines, and a read-only `Bun.serve` preview — enforced by an import-boundary test and gated by fast CI with in-process performance benchmarks.
- **History:** `rm261003abzp-design-revisions.md`

Use `None — <reason>` for sections or fields that do not apply. Diagrams and code previews show proposed design unless labeled as current evidence.

## Baseline and Goals

- **Context:** `rm261003abzp-roadmap-context.md@R2` - empty repository; Alfred code available to port (Markdown parse, Obsidian syntax, vim core, terminal graphics, Bases); scope change 2026-10-03: Markdown-first on a language-neutral core.
- **Requirements:** `rm261003abzp-requirements.md` - RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3 … RM261003ABZP-REQ10@R4, RM261003ABZP-REQ11@R3 (approved).
- **Research:** `rm261003abzp-research.md`
- **Reconciliation:** `rm261003abzp-requirements.md` Research Reconciliation — Complete.
- **Goals:**
  - Meet REQ1–REQ11 with the fewest moving parts: one process, one package, one state store.
  - Keep every product rule in a pure, unit-testable core; keep OpenTUI, Bun, and the file system at the edges.
  - Keep the editor kernel language-neutral: Markdown, links, notes, and Bases plug in through a file-type registry, so code editing and notebooks can be added later as registrations, not rewrites (RM261003ABZP-REQ11@R3).
  - Extend by registration (commands, keymaps, syntax extensions, block renderers, Bases view types, file types, highlighters, decoration providers, editor kinds) — the known extension needs from RM261003ABZP-REQ11@R3.
- **Binding constraints:**
  - `.s1mple/S1MPLE.md` Implementation - "Keep it lean and simple": no monorepo, no server between UI and core, no speculative plugin system.
  - RM261003ABZP-REQ11@R3 - only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs; `src/core/kernel/` imports nothing from `filetypes/`, `lang/`, or `features/`.
  - RM261003ABZP-REQ10@R4 - no tool may depend on the TypeScript compiler API (TypeScript 7 ships none, `RM261003ABZP-RF13`).

## System Architecture

- **System context:** One user in a terminal runs `so [path]`. External systems: the file system (the workspace folder, `$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, trash), the terminal emulator (keys, mouse, graphics), the system clipboard, and — only while `:Preview` runs — a local browser over `127.0.0.1`. No network service, database, Git, or AI.
- **Current architecture:** `rm261003abzp-roadmap-context.md@R2` Current System — empty repository.

```text
Not established — empty repository (only .s1mple/ guidance)
```

- **Proposed architecture:**

```text
                         ┌──────────────────────── src/app (composition root) ────────────────────────┐
 terminal ⇄ OpenTUI ⇄    │  main.ts → loads config/state → creates Store → starts UI, effects, workers │
                         └──────┬──────────────────────┬───────────────────────┬────────────────────┬──┘
                                │                      │                       │                    │
                   ┌────────────▼─────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
                   │ src/ui  (OpenTUI)    │  │ src/workspace (I/O)│  │ src/preview       │  │ src/core (pure)│
                   │ views, input, paint  │  │ fs, watcher, trash │  │ Bun.serve + SSE   │  │ state, vim,    │
                   │ images, theme        │  │ index worker, cfg  │  │ read-only HTML    │  │ kernel, file-  │
                   └────────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │ types,lang,feat│
                                │ reads state,          │ executes effects,     │ reads state, └───────▲────────┘
                                │ dispatches actions    │ dispatches results    │ renders HTML         │
                                └───────────────────────┴───────────────────────┴──────── import ──────┘

 Allowed imports:  app → ui, workspace, preview, core      ui → core      workspace → core      preview → core
                   core → (nothing outside core; npm parsing libs only)

 Inside core:      core/kernel  (text, editor, vim, commands, view)  → kernel only        ← language-neutral
                   core/filetypes                                     → kernel
                   core/lang/*, core/features/*                       → kernel, filetypes, lang, features, time
                   core/state, core/config                            → any core module (composition)
                   nothing outside core/state and core/config imports them
```

The core owns all product behavior; the three edge layers are adapters. This reuses Alfred's parsing, Obsidian syntax, vim, terminal-graphics knowledge, and Bases engine by porting them into `core/` (Alfred's kernel, client, protocol, chat, Git, SQLite, Ink, and Next.js are not reused). Main tradeoff: one process keeps latency and code minimal, but a CPU-heavy task on the main thread would stall input — so scanning, parsing for the index, and full-text search run in a worker (RM261003ABZP-DES7@R4).

Inside the core, the kernel edits and lays out text for any language; Markdown is one registered file type whose parser, live-preview decorations, and highlighter plug into the kernel (RM261003ABZP-DES1@R2, RM261003ABZP-DES17@R1). A code editor or notebook later adds file types, decoration providers, and editor kinds; the kernel does not change. Tradeoff: one more indirection (the file-type registry) between an open buffer and its Markdown behaviour, accepted because it is also what Bases and plain text files need in v1.

## Components and Boundaries

- **App (composition root)**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2
  - **Location:** `src/app/`
  - **Responsibilities:** parse CLI args; register file types (`text`, `markdown`, `base`, code types), commands, and keymaps; load config and state; construct the store, effect runner, workspace adapters, index worker, UI, and preview on demand; own process lifecycle and exit codes.
  - **Collaborators:** `bin/so` → `app/main.ts` → `core/store`, `workspace/*`, `ui/shell`, `preview/server`
  - **Contracts:** Action and Effect protocol; AppConfig
  - **Code shape:** `src/app/main.ts` `main`, `src/app/effects.ts` `runEffect`
  - **Must not own:** product rules, rendering, Markdown semantics.

- **Core — state**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Location:** `src/core/state/`
  - **Responsibilities:** `AppState`, pure `update(state, action) → { state, effects }`; jump list, autosave policy, conflict rules; opening a file as a buffer of its registered file type.
  - **Collaborators:** ui/workspace/preview → `dispatch(action)` → `update` → effects → app effect runner
  - **Contracts:** Action and Effect protocol; AppState
  - **Code shape:** `src/core/state/update.ts` `update`
  - **Must not own:** timers, I/O, terminal escape codes.

- **Core — editor kernel**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/core/kernel/` (`text/`, `editor/`, `vim/`, `commands/`, `view/`)
  - **Responsibilities:** text buffer, cursor and selections, undo blocks, registers, window tree; vim mode machine, key-sequence parser, motions, operators, text objects, dot-repeat, search, ex commands; command registry, file-type-scoped keymap trie, which-key and palette data; the viewport text view that lays out visible rows from text and decorations.
  - **Collaborators:** `update` → `vim.handleKey(bufferState, key)` → `TextBuffer`; `update` → `keymap.lookup({mode, filetype})`; UI → `layoutText(view, providers, analysis)` → `RenderLine[]`
  - **Contracts:** TextBuffer; VimState; Command and Keymap registry; Decoration and RenderLine model
  - **Code shape:** `src/core/kernel/text/text-buffer.ts` `TextBuffer`; `src/core/kernel/vim/engine.ts` `handleKey`; `src/core/kernel/commands/registry.ts` `CommandRegistry`, `Keymap`; `src/core/kernel/view/text-view.ts` `layoutText`
  - **Must not own:** rendering, clipboard I/O (expressed as effects), and anything Markdown-, link-, note-, or Bases-specific (enforced by the boundary test).

- **Core — file types**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Location:** `src/core/filetypes/`
  - **Responsibilities:** `FileType` contract and `FileTypeRegistry`: path → file type (extension, then file name, then the `text` fallback); per file type the editor kind, views, highlighter, and analysis hook; the built-in `text` file type.
  - **Collaborators:** `app/main` → registers `markdown`, `base`, and code file types; `update` → `fileTypes.forPath(path)` on open
  - **Contracts:** FileType and Decoration model
  - **Code shape:** `src/core/filetypes/registry.ts` `FileTypeRegistry`, `FileType`
  - **Must not own:** language parsing (lives in `lang/`), file reading (workspace).

- **Core — languages (Markdown and code highlighting)**
  - **Decisions:** RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES13@R2, RM261003ABZP-DES17@R1
  - **Location:** `src/core/lang/markdown/`, `src/core/lang/code/`
  - **Responsibilities:** Markdown block splitting, per-block parse cache, Obsidian syntax extensions, `Doc` model; the live-preview decoration provider with reveal rules and block renderers; pure HTML rendering for the preview; the `markdown` file type. `lang/code` wraps lowlight as `Highlighter`s and registers code file types (TypeScript, JavaScript, JSON, YAML, TOML, shell, Python, CSS, HTML, …) used for code files and fenced code blocks.
  - **Collaborators:** `update` → `markdown.analyze(buf, prevDoc)` → `Doc`; UI → `layoutText(view, [highlight, livePreview(doc)])` → paint; preview → `renderHtml(doc, ctx)`
  - **Contracts:** Doc model; FileType and Decoration model
  - **Code shape:** `src/core/lang/markdown/doc.ts` `parseDoc`; `src/core/lang/markdown/live-preview.ts` `livePreview`; `src/core/lang/markdown/html.ts` `renderHtml`; `src/core/lang/code/highlight.ts` `lowlightHighlighter`
  - **Must not own:** terminal escape output, image decoding, HTTP.

- **Core — links feature**
  - **Decisions:** RM261003ABZP-DES7@R4
  - **Location:** `src/core/features/links/`
  - **Responsibilities:** `NoteSummary` extraction, `NoteIndex` (names, aliases, headings, blocks, links, tags, backlinks) plus the workspace file list for the file picker, link resolution rule, rename planning, full-text search functions. Fuzzy ranking is kernel text code (`src/core/kernel/text/fuzzy.ts`) because the palette and every picker use it.
  - **Collaborators:** index worker → `scanDoc(text)` → `summarize(path, mtime, scan, lines)` → `NoteIndex.apply(delta)`; `update` → `resolveLink`, `planRename`
  - **Contracts:** NoteSummary and NoteIndex; LinkTarget
  - **Code shape:** `src/core/features/links/note-index.ts` `NoteIndex`; `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`
  - **Must not own:** file scanning (worker), persistence.

- **Core — Bases and notes features**
  - **Decisions:** RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2
  - **Location:** `src/core/features/bases/`, `src/core/features/notes/`, `src/core/time/`
  - **Responsibilities:** `.base` parsing, expression evaluation, table and Kanban view models, YAML-preserving frontmatter patches, the `base` file type and editor kind; daily-note paths, template expansion, Moment-subset date formatting.
  - **Collaborators:** `update` → `evaluateBase(base, index)` → `BaseViewModel`; `update` → `expandTemplate(tpl, vars)`
  - **Contracts:** BaseViewModel; Template variables
  - **Code shape:** `src/core/features/bases/evaluate.ts` `evaluateBase`; `src/core/time/format.ts` `formatDate`
  - **Must not own:** file writes (expressed as `write` effects).

- **Workspace adapters**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R1
  - **Location:** `src/workspace/`
  - **Responsibilities:** atomic save, text read with binary and size checks, create, rename, move, delete-to-trash; directory watcher with own-write suppression; index worker (scan, summarize, search); config and state files; clipboard; opening URLs/browser.
  - **Collaborators:** app effect runner → `workspace/*` → `dispatch(resultAction)`
  - **Contracts:** Effect protocol; FileEvent; WorkerMessage
  - **Code shape:** `src/workspace/fs.ts` `atomicWrite`, `readTextFile`; `src/workspace/watcher.ts` `watchWorkspace`; `src/workspace/index-worker.ts`
  - **Must not own:** decisions about conflicts, autosave timing, or link rewriting (core decides).

- **UI shell**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/ui/`
  - **Responsibilities:** OpenTUI renderer lifecycle; key/mouse normalization (kitty keyboard protocol, Esc timeout); layout of explorer, bufferline, editor windows, side panel, statusline, command line, overlays (picker, which-key, palette, prompts, help, notifications); one view per editor kind (`text` → `EditorView`, `base` → Bases view); painting `RenderLine[]`; widget painters keyed by widget type (image, embed, base); theme and `NO_COLOR`; terminal restore.
  - **Collaborators:** OpenTUI → `ui/input` → `dispatch`; store subscription → `ui/shell.render(state)`
  - **Contracts:** Key; RenderLine; AppState (read-only)
  - **Code shape:** `src/ui/shell.ts` `createShell`; `src/ui/editors/registry.ts` `editorViews`; `src/ui/editors/text-view.ts` `EditorView`; `src/ui/widgets/registry.ts` `widgetPainters`; `src/ui/input.ts` `normalizeKey`
  - **Must not own:** editing logic, Markdown parsing, file-type decisions, file I/O.

- **Preview server**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Location:** `src/preview/`
  - **Responsibilities:** `Bun.serve` on `127.0.0.1:0`, Host allowlist, SSE updates, read-only page, contained asset serving.
  - **Collaborators:** app → `startPreview(store)` → browser; store subscription → SSE push
  - **Contracts:** Preview HTTP routes
  - **Code shape:** `src/preview/server.ts` `startPreview`
  - **Must not own:** editing; files outside the workspace.

## Project Structure

- **Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json                 Purpose: one package; scripts dev/check/test/bench/build; exact pins
│       Symbols: scripts.check, packageManager, "@opentui/core": "<exact>"   Decisions: DES15
├── [A] tsconfig.json                Purpose: strict ESM, noEmit, TS 7          Decisions: DES15
├── [A] biome.json                   Purpose: format + lint                      Decisions: DES15
├── [A] knip.json                    Purpose: dead-code check                    Decisions: DES15
├── [A] .github/workflows/ci.yml     Purpose: check ∥ test+bench jobs on pull requests  Decisions: DES15, DES16
├── [A] .github/workflows/release.yml Purpose: compile ×4 + native smoke ×4; publish on a `v*` tag pushed at the user's request; manual run = dry run, no publish  Decisions: DES15
├── [A] bin/so                        Purpose: `#!/usr/bin/env bun` entry for source runs  Decisions: DES1
├── [A] src/app/
│   ├── main.ts                      Purpose: CLI, wiring, lifecycle            Symbols: main, parseArgs   Decisions: DES1, DES2
│   └── effects.ts                   Purpose: effect runner                     Symbols: runEffect         Decisions: DES2
├── [A] src/core/
│   ├── kernel/                      Purpose: language-neutral editor kernel; imports only kernel  Decisions: DES1
│   │   ├── text/                    Purpose: TextBuffer, Edit, Pos, Range, fuzzy ranking  Symbols: TextBuffer, Edit, fuzzyScore, rankBy  Decisions: DES3, DES7
│   │   ├── editor/                  Purpose: undo, registers, windows           Symbols: UndoStack, Registers  Decisions: DES3
│   │   ├── vim/                     Purpose: modes, parser, motions, operators, text objects, ex  Symbols: handleKey, motions, textObjects  Decisions: DES4
│   │   ├── commands/                Purpose: registry, file-type-scoped keymap trie, which-key  Symbols: CommandRegistry, Keymap, KeyScope  Decisions: DES5
│   │   └── view/                    Purpose: viewport text layout from decorations  Symbols: layoutText, Decoration, RenderLine  Decisions: DES9
│   ├── filetypes/                   Purpose: FileType contract, registry, `text` fallback  Symbols: FileTypeRegistry, FileType, Highlighter  Decisions: DES17
│   ├── lang/
│   │   ├── markdown/                Purpose: block split, linear scan, lazy mdast, parse cache, Obsidian extensions, live-preview provider, HTML  Symbols: parseDoc, Doc, scanDoc, blockNode, livePreview, renderHtml, markdownFileType  Decisions: DES6, DES9, DES13
│   │   └── code/                    Purpose: lowlight highlighter, code file types  Symbols: lowlightHighlighter, codeFileTypes  Decisions: DES17
│   ├── features/
│   │   ├── links/                   Purpose: summaries, index, file list, resolve, rename, search  Symbols: NoteIndex, resolveLink, planRename  Decisions: DES7
│   │   ├── bases/                   Purpose: ported Bases engine, view models, `base` file type  Symbols: parseBase, evaluateBase, KANBAN_TYPE, baseFileType  Decisions: DES12
│   │   └── notes/                   Purpose: daily notes, templates             Symbols: dailyPath, expandTemplate  Decisions: DES11
│   ├── time/                        Purpose: Moment-subset formatter            Symbols: formatDate        Decisions: DES11
│   ├── state/                       Purpose: AppState, Action, Effect, update  Symbols: update, AppState  Decisions: DES2
│   └── config/                      Purpose: config schema, defaults, TOML parse with line numbers  Symbols: ConfigSchema, defaults, parseConfig  Decisions: DES14
├── [A] src/workspace/
│   ├── fs.ts                        Purpose: readTextFile (binary/size/BOM/EOL), atomicWrite, create, rename, move  Symbols: readTextFile, atomicWrite  Decisions: DES8, DES17
│   ├── trash.ts                     Purpose: freedesktop trash, macOS trash (`/usr/bin/trash` or NSFileManager)  Symbols: moveToTrash  Decisions: DES8
│   ├── watcher.ts                   Purpose: directory watching, own-write suppression  Symbols: watchWorkspace  Decisions: DES8
│   ├── index-worker.ts              Purpose: list files, summarize notes, search text files in a Worker  Symbols: onmessage  Decisions: DES7
│   ├── config-file.ts               Purpose: XDG config load + validation       Symbols: loadConfig        Decisions: DES14
│   ├── state-file.ts                Purpose: XDG state load/save                Symbols: loadState, saveState  Decisions: DES14
│   └── system.ts                    Purpose: clipboard, open browser           Symbols: clipboard, openUrl  Decisions: DES8
├── [A] src/ui/
│   ├── shell.ts                     Purpose: renderer lifecycle, layout, restore  Symbols: createShell  Decisions: DES10
│   ├── input.ts                     Purpose: key/mouse normalization, Esc timeout  Symbols: normalizeKey  Decisions: DES10
│   ├── editors/                     Purpose: one view per editor kind: text (paints RenderLine rows, cursor), base  Symbols: editorViews, EditorView  Decisions: DES9, DES10, DES12
│   ├── widgets/                     Purpose: widget painters by type: image, embed, base  Symbols: widgetPainters  Decisions: DES10
│   ├── views/                       Purpose: explorer, bufferline, statusline, cmdline, side panel  Decisions: DES10
│   ├── overlays/                    Purpose: picker, which-key, palette, prompt, help, notify  Decisions: DES10, DES5
│   └── theme.ts                     Purpose: tokens, NO_COLOR                   Symbols: theme     Decisions: DES10
├── [A] src/preview/
│   ├── server.ts                    Purpose: Bun.serve, Host check, SSE, assets  Symbols: startPreview  Decisions: DES13
│   └── page.html                    Purpose: read-only page shell (embedded)   Decisions: DES13
└── [A] test/
    ├── boundaries.test.ts           Purpose: import-boundary enforcement (layers + kernel rule)  Decisions: DES1
    ├── e2e/                         Purpose: few PTY tests (start, edit, save, exit, restore)  Decisions: DES15
    ├── bench/                       Purpose: performance benchmarks via test renderer  Decisions: DES16
    └── fixtures/                    Purpose: sample workspace (notes, code files, a binary; an over-16 MiB file is generated at test time), 5,000-line note, 5,000-line TypeScript file, 10,000-note generator  Decisions: DES16, DES17
```

Unit tests sit next to code as `*.test.ts`.

## Runtime Flows

- **Keystroke to frame**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** OpenTUI key event → `ui/input.normalizeKey` → `store.dispatch({type:"key"})` → `core/state/update` → `keymap.lookup({mode, filetype})` or `vim.handleKey` → `TextBuffer.apply` → file type `analyze` (Markdown: `parseDoc` reparses changed blocks) → store notifies → `ui/shell.render` → `layoutText` with the view's decoration providers (visible rows only) → `EditorView` paint → OpenTUI native diff
  - **Flow:**

    ```text
    key ─→ normalizeKey ─→ dispatch(key) ─→ update(state,key)
                                              ├─ keymap trie {mode, buffer filetype} → {mode}: pending prefix? → state.pending, effect: startWhichKeyTimer
                                              ├─ command → run(ctx) → new state + effects (e.g. scheduleAutosave)
                                              └─ text edit → TextBuffer' + undo block + dirty block ids
                                                   → fileType.analyze (Markdown: reparse dirty blocks, cache by block hash)
          ui.render(state) ← store.notify ←───┘
            └─ layoutText(rows in view, [highlightMarks, view providers e.g. livePreview], view input) → paint → native diff → terminal
    ```

    State changes only inside `update`. Rendering is coalesced to at most one frame per input burst.

  - **Failure and recovery:** a command throws → `update` catches, keeps the previous state, emits `notify(error)`; a render error in one block → that block renders as source with a diagnostic marker; nothing crashes the process.
  - **Contracts and state:** Action and Effect protocol; AppState; FileType and Decoration model; RenderLine model
  - **Control flow:** `src/core/state/update.ts` `update`; `src/core/kernel/view/text-view.ts` `layoutText`; `src/ui/shell.ts` `createShell`

- **Startup**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** `app/main` → register file types (`markdown`, `base`, code types, `text` fallback) → `loadConfig`, `loadState` → `createStore` → `createShell` (first frame) → `startIndexWorker` → `watchWorkspace`
  - **Flow:**

    ```text
    so [path] → resolve workspace (folder | file's parent) ── missing → stderr + exit 2
             → load config (invalid → defaults + error notice) → load state (corrupt → empty)
             → first frame (explorer from a shallow readdir; opened file read directly)   ← < 200 ms target
             → worker: list all non-excluded files + summarize Markdown notes → post batches → dispatch(indexBatch) → status "indexing 4,210/10,000"
             → watcher starts → index ready
    ```

  - **Failure and recovery:** worker crash → notify and restart once; link features show "index unavailable" until restart succeeds; editing keeps working.
  - **Contracts and state:** AppConfig; WorkerMessage; NoteIndex
  - **Control flow:** `src/app/main.ts` `main`

- **Open a file**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES12@R2
  - **Participants:** `:e`, explorer `Enter`, picker, or link follow → effect `read(path)` → `workspace/fs.readTextFile` → `dispatch(fileLoaded | fileRefused)` → `update` → `fileTypes.forPath(path)` → buffer and window content
  - **Flow:**

    ```text
    open(path) → effect read(path) → readTextFile: size > 16 MiB          → fileRefused{reason:"tooLarge"}
                                                 NUL in first 8 KiB       → fileRefused{reason:"binary"}
                                                 not valid UTF-8 (fatal)  → fileRefused{reason:"binary"}
                                                 else strip BOM, detect EOL → fileLoaded{text, bom, eol, stamp}
    fileLoaded → fileTypes.forPath(path): ".md" → markdown (views live|source|reading, editor "text")
                                          ".base" → base (editor "base" → Bases view)
                                          ".ts" → typescript (views source, lowlight highlighter)
                                          other  → text (views source, no highlighter)
               → editor "text": buffer {fileType, view: first view, analysis: analyze?(buf)} → content {editor:"text", bufferId, …}
               → other editor: editorKinds.get(fileType.editor).open(path, text) → content {editor, state}
    fileRefused → notify "binary file — not opened" | "file too large — not opened (limit 16 MiB)"; no buffer, no write
    ```

  - **Failure and recovery:** read error → `fileRefused{reason:"io", message}` → notification; the previous buffer stays active.
  - **Contracts and state:** Action and Effect protocol; FileType and Decoration model; AppState
  - **Control flow:** `src/workspace/fs.ts` `readTextFile`; `src/core/filetypes/registry.ts` `FileTypeRegistry.forPath`, `EditorKindRegistry.get`

- **Save and external change**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2
  - **Participants:** `update` (autosave policy) → effect `write` → `workspace/fs.atomicWrite` → `watcher` → `dispatch(fileChanged)` → `update` (conflict rules)
  - **Flow:**

    ```text
    edit → state.dirty=true → effect scheduleAutosave(1000ms) | leaveInsert | switchNote | exit | :w
         → effect write(path, text, expectedStamp) → atomicWrite: realpath → tmp in same dir → write (BOM + EOL restored) → fsync → chmod → rename
         → record ownWrite(path, stamp) → dispatch(saved(stamp))
    watcher(dir) event → stat+hash → ownWrite? ignore
                                   → buffer clean → dispatch(reload(text)) → undoable reload
                                   → buffer dirty → dispatch(conflict) → prompt: keep mine | take disk | view diff
    ```

  - **Failure and recovery:** write fails (permission, disk full) → buffer stays dirty, status shows `save failed: <reason>`, autosave retries with backoff (1 s, 2 s, 4 s, max 30 s); `:w` retries immediately. Rename failure leaves the temp file removed and the original intact.
  - **Contracts and state:** FileEvent; BufferState.stamp
  - **Control flow:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`

- **Follow, complete, and rename links**
  - **Decisions:** RM261003ABZP-DES7@R4, RM261003ABZP-DES5@R2
  - **Participants:** `update` → `resolveLink(index, sourcePath, target)` → open buffer + jump; `planRename(index, moves, open)` → `applyEdits` effect
  - **Flow:**

    ```text
    gd on [[plan#Goals]] → resolveLink → {path:"projects/plan.md", heading:"Goals"} → push jumplist → open → cursor at heading
                         → unresolved → prompt "Create projects/plan.md?" → create effect
    rename a.md → b.md → planRename(index, [{from, to}], open scans) → [{path, edits[]}…] → apply to open buffers in memory + applyEdits for closed files (each span checked against its expected text)
                       → fs rename → notify "12 files updated"
    ```

  - **Failure and recovery:** a second rename or move while a link rewrite is in flight is refused with `links still updating — try again when the update finishes` and changes nothing; a closed file whose span no longer matches the expected text is skipped unchanged and reported; a link-rewrite write fails → remaining writes continue; failures are listed in a notification with paths; the rename itself is rolled back only if the file rename failed (links already rewritten are reported, not reverted).
  - **Contracts and state:** NoteIndex; LinkTarget
  - **Control flow:** `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`

- **Preview**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Participants:** `:Preview` (a Markdown-scoped command) → effect `startPreview` → `preview/server` → browser; store change (active Markdown doc or version) → SSE event → page fetches `/render`. Switching to a non-Markdown buffer sends nothing, so the page keeps the last note (RM261003ABZP-DES17@R1 note-only scope)
  - **Flow:**

    ```text
    :Preview → Bun.serve({hostname:"127.0.0.1", port:0}) → open http://127.0.0.1:<port>/
    page → GET /events (SSE) ; edit → debounce 100 ms → event "doc" {path, version, anchor} ; :PreviewStop/exit → event "stopped" → close
    page → GET /render?path=… → renderHtml(doc) → swap <main>, scroll to anchor
    any request with bad Host → 403 ; /file/<p> → realpath ⊂ workspace & not hidden? → bytes : 404
    ```

  - **Failure and recovery:** port bind fails → notify; browser cannot open → notify the URL; SSE drop → browser auto-reconnects and refetches.
  - **Contracts and state:** Preview HTTP routes
  - **Control flow:** `src/preview/server.ts` `startPreview`

## Contracts, Data, and State

- **Action and Effect protocol — State model**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Purpose:** the only way state changes and the only way side effects start.
  - **Participants:** ui, workspace, preview, timers → `Action` → `update` → `Effect[]` → app effect runner → result `Action`
  - **Meaning:** `Action` is a discriminated union (`key`, `mouse`, `resize`, `fileLoaded`, `fileRefused`, `saved`, `saveFailed`, `fileChanged`, `indexBatch`, `searchResults`, `timer`, …). `Effect` is a discriminated union (`read`, `write`, `create`, `rename`, `move`, `trash`, `startTimer`, `cancelTimer`, `clipboardWrite`, `clipboardRead`, `search`, `startPreview`, `stopPreview`, `openUrl`, `saveState`, `exit`).
  - **Ownership and lifecycle:** core defines both unions; app runs effects; every effect that can fail returns a success or failure action.
  - **Invariants:** `update` is pure and synchronous; no effect runs inside `update`; effects carry all data they need (no callbacks).
  - **State flow:**

    ```text
    Action → update → (State', Effect[]) → runEffect → Action …
    ```

  - **Shape:** `src/core/state/types.ts`

- **AppState — State model**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1
  - **Purpose:** single source of truth for everything visible.
  - **Participants:** `update` (owner) → ui/preview (readers)
  - **Meaning:** `workspace` (root, tree), `buffers` (by id: path, `fileType` id, TextBuffer, `analysis` (the file type's analysis state; Markdown: `Doc`), stamp, `bom`, `eol`, dirty, `view` — one of the file type's view ids, e.g. live|source|reading for Markdown, source for code), `windows` (split tree, active, and per-window `content` by editor kind: `{editor:"text", bufferId, cursor, scroll, folds}` where `folds` is the set of folded callout and expanded embed block ids, or `{editor: <registered kind>, state}` whose `state` comes from that kind's `EditorKindSpec.open` — in v1 only `base`, with state `{path, view, cursor}`), `vim` (mode, pending keys, registers, last change, search), `panels` (explorer, side panel kind), `overlay` (none | picker | whichKey | palette | prompt | help | conflict | calendar | completion), `index` (NoteIndex + status), `notifications`, `config`, `jumps`, `preview` (off | on(port)).
  - **Ownership and lifecycle:** created at startup from config + state file; `jumps` and recent notes persisted through `saveState` effects (debounced 2 s and on exit).
  - **Invariants:** one active window; each `text` window references an open buffer; a buffer's `view` is one of its file type's views; a buffer with `dirty=false` matches its last saved stamp. Adding an editor kind (a notebook later) registers an `EditorKindSpec` in core and an editor view in the UI; neither the `AppState` type nor the kernel changes.
  - **State flow:** `None — plain value replaced by update`
  - **Shape:** `src/core/state/types.ts` `AppState`

- **TextBuffer — Data model**
  - **Decisions:** RM261003ABZP-DES3@R1
  - **Purpose:** text storage and edit primitives behind a stable interface.
  - **Participants:** vim engine, rename planner, template insertion → `TextBuffer` → file type `analyze` (Markdown parser), highlighter, text view
  - **Meaning:** lines array, version number, `apply(edit)` returning a new buffer and the inverse edit; positions are `{line, col}` in UTF-16 code units aligned to grapheme boundaries.
  - **Ownership and lifecycle:** owned by a buffer entry; replaced on each edit (structural sharing of untouched lines).
  - **Invariants:** at least one line; line separators normalized to `\n` in memory, original separator (`\n`/`\r\n`), trailing newline, and leading UTF-8 BOM restored on save. UTF-16 positions match the Language Server Protocol's default position encoding, so a future LSP client needs no conversion.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/text/text-buffer.ts`

- **Doc model — Data model**
  - **Decisions:** RM261003ABZP-DES6@R2
  - **Purpose:** parsed Markdown shared by live preview, index summaries, and HTML preview.
  - **Participants:** `parseDoc` (the `markdown` file type's `analyze`) → `Doc` → live-preview provider, `summarize`, `renderHtml`; the index worker calls `scanDoc(text)` for the scan level only
  - **Meaning:** two levels. Scan level: `Doc { version, frontmatter?, blocks: Block[], scan: DocScan }`; `Block { id, kind, startLine, endLine, hash, scan: BlockScan }`, where `BlockScan` holds headings, links, tags, block ids, and excluded ranges (code, math, comments) from one linear pass. mdast level: `blockNode(doc, block, text)` returns the block's mdast, extended with Obsidian nodes (`wikiLink`, `embed`, `tag`, `highlight`, `comment`, `callout`, `blockId`, `footnote*`, `math`), parsed on first request and cached by block hash.
  - **Ownership and lifecycle:** the scan level is recomputed per buffer version, reusing unchanged blocks by hash; mdast is built lazily per block, only for blocks a consumer asks for (live preview on screen, HTML preview).
  - **Invariants:** blocks cover the document without overlap; a fenced code block or frontmatter is never split.
  - **State flow:** `None`
  - **Shape:** `src/core/lang/markdown/doc.ts`

- **RenderLine model — Data model**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Purpose:** UI-independent, language-neutral description of one screen row.
  - **Participants:** `layoutText` → `RenderLine[]` → `EditorView` (widgets → UI widget painters by `type`)
  - **Meaning:** `RenderLine { sourceLine, spans: {text, style: StyleToken, link?}[], widget?: {type: string, data, rows}, sign?: {text, style} }`; widget types in v1 are `image`, `embed`, `base`, `rule`, registered by `lang/markdown` and `features/bases`; `StyleToken` names a theme token (`heading1`, `bold`, `link`, `tag`, `codeKeyword`, …), never a colour.
  - **Ownership and lifecycle:** computed per frame for visible rows only.
  - **Invariants:** cursor column maps back to a source column through `spans` offsets; widget rows are counted in scroll math.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/view/types.ts`

- **FileType and Decoration model — Data model**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Purpose:** the only way language-specific behaviour reaches the kernel.
  - **Participants:** `lang/*`, `features/bases` → `FileTypeRegistry.register` (wired in `app/main`) → `update` (`forPath` on open; `analyze` per version) → `layoutText(view, providers, analysis)`
  - **Meaning:** `FileType { id, match: {extensions, names}, editor: EditorKind (an open string: "text" and "base" in v1, more by registration), views: [{id, readOnly?, decorations: DecorationProvider[], input?}], highlighter?, analyze? }`. `Decoration` = `mark` (style a range) | `replace` (hide or substitute a range, inline or whole lines, optionally with spans or a widget) | `widget` (insert rows or inline content at a position) | `line` (line style or sign). The kernel's `highlightMarks` turns `Highlighter` output into `mark` decorations; `Highlighter` and `Span` are kernel types, so the kernel never imports `filetypes`. A view's optional `input(analysis, ctx)` hook builds the per-frame provider input from a context type the language declares and `core/state` builds (Markdown: `MarkdownViewInput`), so the UI never branches on a file type. This is the decoration model of CodeMirror 6 (Obsidian's editor), Neovim extmarks, and VS Code decorations.
  - **Ownership and lifecycle:** file types are registered at startup and never change at runtime; providers run per frame on visible lines only.
  - **Invariants:** `text` is the fallback for any unmatched path; every `text` editor file type has a `source` view; decorations never change buffer text; providers are pure.
  - **State flow:** `None`
  - **Shape:** `src/core/filetypes/types.ts`, `src/core/kernel/view/decorations.ts`

- **NoteSummary and NoteIndex — Data model**
  - **Decisions:** RM261003ABZP-DES7@R4
  - **Purpose:** workspace-wide link, tag, heading, and block knowledge, plus the workspace file list.
  - **Participants:** worker `scanDoc` → `summarize` → `NoteSummary` → main `NoteIndex.apply`
  - **Meaning:** `NoteSummary { path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind:"wiki"|"md"|"embed", raw, range, context?}], frontmatter }`; `raw` and `range` let rename plan edits without reading the file, and `context` is the trimmed source line (≤ 160 characters) shown as a closed note's backlink context. `NoteIndex` holds summaries by path plus derived maps: basename → paths, alias → paths, tag → paths, target path → backlinks; and `files` — every non-excluded workspace path — for the file picker.
  - **Ownership and lifecycle:** built at startup by the worker; updated per file event and per buffer save; never persisted.
  - **Invariants:** derived maps are rebuilt only for changed paths; only Markdown files are summarized; resolution order is fixed (RM261003ABZP-DES7@R4).
  - **State flow:** `empty → indexing(n/total) → ready → (fileEvent) ready`
  - **Shape:** `src/core/features/links/note-index.ts`

- **Preview HTTP routes — API**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Purpose:** read-only browser preview.
  - **Participants:** browser → `preview/server` → core `renderHtml`
  - **Meaning:** `GET /` page shell; `GET /events` SSE (`doc` events with `{path, version, anchor}`; a `stopped` event sent before `:PreviewStop` or exit closes the server); `GET /render?path=` HTML fragment; `GET /file/<path>` workspace asset bytes.
  - **Ownership and lifecycle:** exists only between `:Preview` and `:PreviewStop` or exit.
  - **Invariants:** hostname `127.0.0.1`; Host header ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403; realpath containment else 404; no mutating routes.
  - **State flow:** `off → on(port) → off`
  - **Shape:** `src/preview/server.ts`

- **AppConfig — Data model**
  - **Decisions:** RM261003ABZP-DES14@R2, RM261003ABZP-DES5@R2
  - **Purpose:** user options and keymap overrides.
  - **Participants:** `config-file.loadConfig` → `parseConfig` (`toml-eslint-parser` AST → `ConfigSchema` (zod), errors carry the TOML line) → `AppState.config`
  - **Meaning:** `leader`, `escTimeoutMs` (50; effective `max(escTimeoutMs, 20)` because OpenTUI resolves a legacy lone Esc at 20 ms), `autosave` (`{ enabled: true, delayMs: 1000 }`), `editor` (`tabWidth` 1–16, default 8; `wrap`, default `true`; `relativeNumbers`, default `true`), `preview` (`mode: "live"`, `embedMaxRows`, `images: "auto"|"blocks"|"off"`), `daily` (`folder`, `format`, `template`), `templates.folder`, `theme`, `color` (overrides `NO_COLOR`), `keys.<mode>` (`"<key-seq>" = "<command-id>"`, global), `filetypes.<id>.keys.<mode>` (same form, one file type).
  - **Ownership and lifecycle:** read at startup and on `:ConfigReload`.
  - **Invariants:** unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
  - **State flow:** `None`
  - **Shape:** `src/core/config/schema.ts`

## Detailed Code Design

- **`src/core/state/update.ts`**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Change:** Add
  - **Responsibilities:** reducer entry; routes actions to feature reducers.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };

    export const update: Update = (state, action) => {
      switch (action.type) {
        case "key":        return handleKeyAction(state, action.key);   // keymap {mode, filetype} → command, else vim edit
        case "fileChanged":return handleFileChanged(state, action);     // reload | conflict | ignore
        case "indexBatch": return { state: withIndex(state, action.summaries), effects: [] };
        // … one case per Action variant; feature logic lives in feature modules
      }
    };

    export function createStore(initial: AppState, run: (e: Effect) => void) {
      let state = initial; const subs = new Set<(s: AppState) => void>();
      return {
        get: () => state,
        dispatch(action: Action) { const r = update(state, action); state = r.state; r.effects.forEach(run); subs.forEach((f) => f(state)); },
        subscribe(f: (s: AppState) => void) { subs.add(f); return () => subs.delete(f); },
      };
    }
    ```

    `update` routes; `createStore` is the only mutable cell. The switch dispatches on a closed Action union (core protocol, not an extension point); commands extend through the registry instead.

  - **Dependencies:** Action and Effect protocol; CommandRegistry
  - **Callers and wiring:** `app/main.ts` creates the store with `runEffect`; ui and preview subscribe.
  - **Invariants:** pure; no `Date.now()` — time arrives in actions.
  - **Verification:** RM261003ABZP-S11@R1, RM261003ABZP-V15@R2

- **`src/core/kernel/commands/registry.ts`**
  - **Decisions:** RM261003ABZP-DES5@R2
  - **Change:** Add
  - **Responsibilities:** named commands, file-type-scoped keymap trie, which-key and palette data, config overrides.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Command<Ctx = unknown, R = unknown> = {   // generic: the kernel never imports core/state
      id: string;                       // "file.find", "note.today", "link.follow"
      title: string;                    // shown in palette and which-key
      group?: string;                   // which-key group: "find", "note", "buffer"
      filetypes?: readonly string[];    // omitted = every file type; ["markdown"] for link.follow, view.cycle, task.toggle
      run: (ctx: Ctx, args?: string) => R;   // core/state instantiates Ctx = CommandContext, R = { state: AppState; effects: Effect[] }
    };
    export type Mode = "normal" | "insert" | "visual" | "cmdline" | (string & {});   // "explorer", "picker", "base" are declared by their owners
    export type KeyScope = { mode: Mode; filetype?: string };   // filetype omitted = global

    export class CommandRegistry<Ctx, R> { register(cmd: Command<Ctx, R>): void; get(id: string): Command<Ctx, R> | undefined; list(filetype?: string): Command<Ctx, R>[] }

    export class Keymap {
      bind(scope: KeyScope, seq: string, commandId: string): void;   // "<leader>ff", "gd", "<C-o>"
      lookup(scope: KeyScope, pending: Key[]): { kind: "command"; id: string } | { kind: "prefix"; next: WhichKeyItem[] } | { kind: "none" };
      // lookup checks {mode, filetype} first, then {mode}; which-key merges both levels
    }
    ```

    Features call `registry.register` and `keymap.bind` at startup from their own module (`src/core/features/notes/commands.ts`, …); `lang/markdown` binds `gd`, `Enter`, `<leader>m`, `<leader>x` with `filetype: "markdown"`. Which-key reads `lookup(...).next`; the palette reads `list(activeFiletype)`. Config `keys.<mode>` rebinds globally and `filetypes.<id>.keys.<mode>` per file type, both by command id. This mirrors Neovim's buffer-local keymaps set from ftplugins, so `gd` stays free for go-to-definition in code files later.

  - **Dependencies:** None inside the kernel (generic over context and result); `core/state` defines `AppCommand = Command<CommandContext, { state: AppState; effects: Effect[] }>`
  - **Callers and wiring:** `core/state` default registration registers built-ins; `app/main.ts` applies config overrides.
  - **Invariants:** duplicate ids throw at startup; binding an unknown id or file type is a config error, not a crash; running a command whose `filetypes` exclude the active buffer's file type is a no-op with the notice `not available for <type> files`.
  - **Verification:** RM261003ABZP-S3@R1, RM261003ABZP-V4@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/kernel/text/text-buffer.ts` and `src/core/kernel/vim/engine.ts`**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Change:** Add (vim engine redesigned from `alfred/apps/tui/src/view/editor/vim.ts`)
  - **Responsibilities:** buffer primitives; vim grammar `[count]["x][count]operator[count](motion|textobject)`.
  - **Current source:** `alfred/apps/tui/src/view/editor/vim.ts:15-40` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    export type VimMode = "normal" | "insert";
    export type VimEffect = "changed" | "insert-exited" | "toggle-mode" | "leave";
    export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
    ```

    Alfred's engine is pure with effects but supports two modes and a hard-coded pending set.

  - **Proposed shape:**

    ```ts
    export interface TextBuffer {
      readonly version: number; readonly lineCount: number;
      line(i: number): string;
      apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };     // Edit = { range, text }
      slice(range: Range): string;
    }

    export type Motion = (buf: TextBuffer, at: Pos, count: number, ctx: MotionCtx) => { to: Pos; linewise: boolean; inclusive: boolean } | null;
    export type TextObject = (buf: TextBuffer, at: Pos, count: number) => Range | null;
    export const motions: Record<string, Motion>;       // "w","b","e","gg","G","f",… registered by key
    export const textObjects: Record<string, TextObject>; // "iw","a(","ip",…

    export function handleKey(s: BufferVim, key: Key, env: VimEnv): { s: BufferVim; effects: VimEffect[] };
    // VimEffect: { kind:"yank", register, text } | { kind:"changed" } | { kind:"modeChanged", mode } | { kind:"ex", line } | { kind:"search", pattern, dir }
    ```

    The parser accumulates keys into a pending command; when complete it resolves the motion or text object by table lookup, applies the operator, and records an undo block and last-change for `.`. Insert mode collects edits into one undo block until `Esc`.

  - **Dependencies:** TextBuffer; registers in AppState
  - **Callers and wiring:** `update` → `handleKeyAction` → `handleKey` when no keymap binding matches in normal/visual/insert mode.
  - **Invariants:** an operator with a failed motion is a no-op; counts multiply (`2d3w` = `d6w`); undo restores cursor.
  - **Verification:** RM261003ABZP-S2@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1

- **`src/core/lang/markdown/doc.ts`**
  - **Decisions:** RM261003ABZP-DES6@R2
  - **Change:** Add (ported from `alfred/apps/tui/src/view/markdown/parse.ts` and `alfred/packages/view-model/src/markdown/obsidian-syntax.ts`)
  - **Responsibilities:** split into blocks, scan each block linearly for links, tags, headings, and block ids, parse a block to mdast with micromark + GFM + math + Obsidian extensions only when asked, reuse unchanged blocks.
  - **Current source:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` (imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math`)
  - **Current shape:**

    ```ts
    // Alfred parses the whole document per render and post-processes Obsidian syntax with regexes from obsidian-syntax.ts
    export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    ```

    Whole-document parse; Obsidian syntax by regex over text nodes.

  - **Proposed shape:**

    ```ts
    export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; scan: BlockScan };
    export type Doc = { version: number; frontmatter?: Frontmatter; blocks: Block[]; scan: DocScan };

    export function splitBlocks(buf: TextBuffer): { startLine: number; endLine: number }[]; // blank-line bounded; fences, frontmatter, $$ kept whole; lists kept whole
    export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;   // rescan only ranges whose hash changed
    export function scanDoc(text: string): DocScan;               // scan level only; used by the index worker
    export function blockNode(doc: Doc, block: Block, text: (from: number, to: number) => string): MdNode; // lazy mdast, cached by hash
    export const syntaxExtensions: SyntaxExtension[];             // wikiLink, embed, tag, highlight, comment, callout, blockId — one definition for both levels
    ```

    Block-level reparse keeps per-keystroke work proportional to the edited block (`RM261003ABZP-RF7`). Whole-document facts (links, tags, headings, block ids, frontmatter) come from the linear scan level, and mdast is built lazily per block: parsing every note to mdast took 11.8 s for 10,000 notes and about 350 ms for the `openFile` fixture, missing RM261003ABZP-V13@R1 and the open budget. Each Obsidian syntax is defined once in `syntaxExtensions` for both levels, and a conformance test checks that the levels agree.

  - **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`
  - **Callers and wiring:** registered as the `markdown` file type's `analyze`; `update` runs it after edits; the worker runs `scanDoc` before `summarize`; live preview and `renderHtml` call `blockNode`.
  - **Invariants:** `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally (cache is transparent).
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2

- **`src/core/kernel/view/text-view.ts` and `src/core/lang/markdown/live-preview.ts`**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Change:** Add (live preview adapted from `alfred/apps/tui/src/view/markdown/layout.ts` and `alfred/apps/tui/src/view/editor/reveal-units.ts`)
  - **Responsibilities:** language-neutral visible-row layout from decorations (kernel); Markdown live preview as a decoration provider with reveal rules and block renderers (lang).
  - **Current source:** `alfred/apps/tui/src/view/editor/reveal-units.ts` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    None — Alfred lays out whole documents for Ink rendering
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    // src/core/kernel/view — knows nothing about Markdown
    export type TextView = { buf: TextBuffer; width: number; topRow: number; rows: number; cursor: Pos; selection?: Range; folds: ReadonlySet<number>; visible: LineRange };
    export type Widget = { type: string; data: unknown; rows: number };            // painted by a UI widget painter
    export type Decoration =
      | { kind: "mark"; range: Range; style: StyleToken }                          // syntax colour, bold, search match
      | { kind: "replace"; range: Range; block: boolean; spans?: Span[]; widget?: Widget } // hidden `**`, rendered table rows
      | { kind: "widget"; at: Pos; block: boolean; widget: Widget }                // image, embed, base view
      | { kind: "line"; line: number; style?: StyleToken; sign?: Sign };           // ▕ reveal sign, ⚠ render error
    export type DecorationProvider<S = unknown> = (v: TextView, analysis: S) => Decoration[]; // visible lines only
    export function layoutText(v: TextView, providers: readonly DecorationProvider[], analysis: unknown): RenderLine[];
    export type TextViewInput = { view: TextView; providers: readonly DecorationProvider[]; analysis: unknown };  // what a text editor view paints
    export interface Highlighter { language: string; highlight(buf: TextBuffer, lines: LineRange): Span[][] }      // kernel-owned; lang/code implements it
    export function highlightMarks(h: Highlighter | undefined): DecorationProvider;                               // Span[][] → mark decorations

    // src/core/lang/markdown/live-preview.ts — one provider among many
    export type PreviewCtx = { isResolved(target: string): boolean; embed(path: string): { doc: Doc } | "loading" | "missing";
                               image(ref: string): { rows: number } | "unknown"; embedMaxRows: number; images: "auto" | "blocks" | "off" };
    export type MarkdownViewInput = { doc: Doc; view: "live" | "reading"; ctx: PreviewCtx };   // built by the Markdown views' `input` hook
    export const livePreview: DecorationProvider<MarkdownViewInput>;   // views "live" and "reading" (reading: no reveal)
    export type BlockRenderer = (block: Block, v: TextView, input: MarkdownViewInput) => Decoration[];
    export const blockRenderers: Partial<Record<BlockKind, BlockRenderer>>;   // heading, list, table, callout, code, embed, base, math, mermaid …
    ```

    Reveal is the provider's rule, not the kernel's: on the cursor's line it emits no inline `replace` decorations; when the cursor is inside a multi-line block (table, callout, code, math, frontmatter) it emits none for that block, so the source shows. `source` view uses only the highlighter's `mark` decorations; a code file gets exactly that path. Rows outside the viewport are never laid out; a per-block row-height cache gives scroll positions.

  - **Dependencies:** Doc model; FileType and Decoration model; theme tokens; `lang/code` highlighter for fenced code; ported math and mermaid text renderers
  - **Callers and wiring:** `ui/editors/text-view.ts` per frame with the active view's providers from the buffer's file type.
  - **Invariants:** `layoutText` with no providers returns raw lines; the source view of Markdown and any code file use the same path; reading view never reveals.
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/filetypes/registry.ts` and `src/core/lang/code/highlight.ts`**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Change:** Add (highlighter adapted from `alfred/apps/tui/src/view/markdown/code-highlight.ts`)
  - **Responsibilities:** file-type contract and lookup; the lowlight-backed highlighter.
  - **Current source:** `alfred/apps/tui/src/view/markdown/code-highlight.ts` (96 lines, `lowlight`; porting reference)
  - **Current shape:**

    ```ts
    None — Alfred highlights fenced code only
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    export type EditorKind = string;                                // "text" and "base" in v1; a notebook registers "notebook" later
    export type ViewSpec<S, I = S, C = unknown> = { id: string; readOnly?: boolean; decorations: readonly DecorationProvider<I>[];
                                       input?: (analysis: S, ctx: C) => I };   // per-frame provider input; default: analysis
    // C is declared by the language (Markdown: PreviewCtx); core/state/view-context.ts builds it from AppState
    // through a builder registered per file type id, so filetypes/ and lang/ never import core/state.
    export type EditorKindSpec<St = unknown> = { id: EditorKind; open(path: string, text: string): St };
    export class EditorKindRegistry { register(spec: EditorKindSpec<any>): void; get(id: EditorKind): EditorKindSpec | undefined }
    // "text" is built in (core/state creates the buffer); "base" is registered by features/bases; a notebook registers later.
    export type FileType<S = unknown> = {
      id: string;                                                   // "markdown", "base", "typescript", "text"
      match: { extensions?: readonly string[]; names?: readonly string[] };   // [".md"], ["Makefile"]
      editor: EditorKind;
      views: readonly ViewSpec<S>[];                                // first = default
      highlighter?: Highlighter;
      analyze?: (buf: TextBuffer, prev?: S) => S;                   // Markdown: parseDoc with block cache
    };
    // `Highlighter` is the kernel type from `src/core/kernel/view/types.ts`

    export class FileTypeRegistry {
      register(ft: FileType<any>): void;                            // duplicate id or extension throws at startup
      forPath(path: string): FileType;                              // extension → file name → `text`
      get(id: string): FileType | undefined;
    }

    // src/core/lang/code/highlight.ts
    export function lowlightHighlighter(language: string): Highlighter;   // highlights from up to 200 lines above
                                                                           // the requested range; cached per buffer version
    ```

    `app/main` registers `text`, `markdown` (`lang/markdown`), `base` (`features/bases`), and code file types (`lang/code`). Tree-sitter can replace lowlight behind `Highlighter` later without changing callers.

  - **Dependencies:** `lowlight`; TextBuffer
  - **Callers and wiring:** `update` (`forPath` on `fileLoaded`; `analyze` after edits); the kernel's `highlightMarks` (`Highlighter` → `mark` decorations); `lang/markdown` fenced code blocks.
  - **Invariants:** registry lookup is deterministic and pure; highlighting is viewport-bounded and never runs the whole file per keystroke; a highlighter error drops to plain text for that range.
  - **Verification:** RM261003ABZP-S12@R1, RM261003ABZP-V18@R1; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/features/links/resolve.ts` and `src/core/features/links/rename.ts`**
  - **Decisions:** RM261003ABZP-DES7@R4
  - **Change:** Add
  - **Responsibilities:** deterministic link resolution; format-preserving rename planning.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function resolveLink(ix: NoteIndex, from: string, raw: string): LinkTarget | { unresolved: string };
    // order: exact root path (with/without .md) → alias → basename candidates ranked by
    //        (same folder as `from`) → (shortest path) → (alphabetical)
    export type PathMove = { from: string; to: string };
    export type FileEdit = { path: string; edits: { range: Range; expected: string; text: string }[] };
    export function planRename(ix: NoteIndex, moves: readonly PathMove[], open: ReadonlyMap<string, DocScan>): FileEdit[];
    // keeps link kind (wiki/md), alias, #heading / #^block; writes the shortest unique form of `to`;
    // link spans come from open buffers' scans and from summaries (`raw`, `range`), so planning reads no file
    ```

  - **Dependencies:** NoteIndex
  - **Callers and wiring:** `link.follow`, completion, backlinks, `file.rename`, `file.move` commands.
  - **Invariants:** resolution is a pure function of index contents; rename never touches text outside link spans.
  - **Verification:** RM261003ABZP-S4@R1, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2

- **`src/workspace/fs.ts` and `src/workspace/watcher.ts`**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES17@R1
  - **Change:** Add
  - **Responsibilities:** text reads with binary and size checks; atomic writes and directory watching with own-write suppression.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export async function readTextFile(path: string): Promise<TextFile | { refused: "binary" | "tooLarge" }> {
      const file = Bun.file(path);
      if (file.size > 16 * 1024 * 1024) return { refused: "tooLarge" };
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.subarray(0, 8192).includes(0)) return { refused: "binary" };
      let text: string;
      try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); } catch { return { refused: "binary" }; }
      const bom = text.startsWith("\uFEFF");
      return { text: bom ? text.slice(1) : text, bom, eol: text.includes("\r\n") ? "\r\n" : "\n", stamp: stampOf(path, text) };
    }
    export async function atomicWrite(path: string, text: string): Promise<Stamp> {   // text already has BOM + EOL restored
      const target = await realpathOrSelf(path);
      const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
      const fd = await open(tmp, "w", await modeOr(target, 0o644));
      try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp, target);                     // same directory → atomic on POSIX
      return stampOf(target, text);                  // { mtimeMs, size, hash }
    }
    export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
    // fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
    ```

  - **Dependencies:** `node:fs/promises`, `node:fs` (Bun-compatible)
  - **Callers and wiring:** effect runner for `read`, `write`, `create`, `rename`, `move`; `main` starts the watcher.
  - **Invariants:** temp files never appear in the index (prefix `.` is hidden); a failed write deletes its temp file.
  - **Verification:** RM261003ABZP-S1@R1, RM261003ABZP-V1@R1; RM261003ABZP-S12@R1, RM261003ABZP-V18@R1

- **`src/ui/editors/text-view.ts`, `src/ui/widgets/registry.ts`, and `src/ui/input.ts`**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Change:** Add
  - **Responsibilities:** paint RenderLine rows onto an OpenTUI buffer; paint widgets through painters keyed by widget type; pick the view for a window's editor kind; normalize input.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    // Only file family allowed to import @opentui/*
    export class EditorView extends Renderable {           // custom renderable, not Textarea
      constructor(ctx: RenderContext, private getView: () => TextViewInput) { super(ctx, { flexGrow: 1 }); }
      protected renderSelf(buf: OptimizedBuffer) {
        const { view, providers, analysis } = this.getView();
        for (const [row, line] of layoutText(view, providers, analysis).entries()) paintLine(buf, row, line, theme, widgetPainters);
      }
    }
    export const editorViews = new Map<EditorKind, (ctx: RenderContext, win: WindowId) => Renderable>();  // registered: text → EditorView, base → BaseView
    export function registerEditorView(kind: EditorKind, view: (ctx: RenderContext, win: WindowId) => Renderable): void;
    export const widgetPainters: Record<string, WidgetPainter>;                                        // image, embed, base, rule
    export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via max(escTimeoutMs, 20)
    ```

    Exact OpenTUI buffer and image APIs are confirmed against the pinned version in the first delivery item (the class above is illustrative).

  - **Dependencies:** `@opentui/core` (exact pin)
  - **Callers and wiring:** `ui/shell.ts` composes views; store subscription triggers `requestRender()`.
  - **Invariants:** UI never mutates AppState; all input becomes Actions.
  - **Verification:** RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V17@R1

- **`src/preview/server.ts`**
  - **Decisions:** RM261003ABZP-DES13@R2
  - **Change:** Add
  - **Responsibilities:** read-only preview server.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function startPreview(store: Store, root: string): { port: number; stop(): void } {
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0,
        fetch(req) {
          const host = req.headers.get("host");
          if (host !== `127.0.0.1:${server.port}` && host !== `localhost:${server.port}`) return new Response(null, { status: 403 });
          return route(req, store, root);              // "/", "/events", "/render", "/file/*"
        },
      });
      return { port: server.port, stop: () => server.stop(true) };
    }
    ```

  - **Dependencies:** `Bun.serve`; core `renderHtml`
  - **Callers and wiring:** effect runner for `startPreview`/`stopPreview`.
  - **Invariants:** no write routes; `/file/*` passes realpath containment and hidden-folder exclusion.
  - **Verification:** RM261003ABZP-S8@R1, RM261003ABZP-V11@R3

## Cross-cutting and Evolution

| Concern | Mechanism and canonical design location | Verification or reason not applicable |
|---|---|---|
| Security and privacy | No network except loopback preview with Host allowlist and realpath containment (RM261003ABZP-DES13@R2); config is data (TOML), never executed (RM261003ABZP-DES14@R2); no telemetry; notes never logged | RM261003ABZP-V11@R3 |
| Configuration and observability | XDG TOML config validated by schema; errors as notifications; `so --version`; `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content (RM261003ABZP-DES14@R2) | RM261003ABZP-V4@R2 |
| Performance and scalability | Viewport-only layout, block parse cache, worker index and search, frame coalescing, lazy image decode with cache (RM261003ABZP-DES16@R1) | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| Concurrency, retry, and idempotency | Single-threaded store; worker communicates by messages; saves serialized per path; autosave retry with backoff; own-write stamps make watcher events idempotent (RM261003ABZP-DES8@R2) | RM261003ABZP-V1@R1 |
| Migration and backfill | None — greenfield; Obsidian files are read as-is and written in place | None — no prior data format |
| Mixed-version compatibility | Obsidian file compatibility (Markdown, links, frontmatter, `.base`); Kanban `type` constant isolated in `core/features/bases/types.ts` and verified against an Obsidian-saved file (RM261003ABZP-DES12@R2) | RM261003ABZP-V10@R1 |
| Rollout and rollback | SemVer releases only when the user asks, from a pushed `v*` tag; users roll back by installing a previous release binary (RM261003ABZP-DES15@R4) | RM261003ABZP-V14@R2 |
| Known extension needs | Registries: commands and file-type-scoped keymaps (DES5), syntax extensions (DES6), block renderers and decoration providers (DES9), editor-kind views and widget painters (DES10), Bases view types (DES12), file types and highlighters (DES17) — RM261003ABZP-REQ11@R3 | RM261003ABZP-V16@R2 |
| Evolution toward code editing and notebooks | Kernel boundary (DES1) keeps editing language-neutral; future work adds registrations only: an LSP client is a workspace adapter whose results become `mark`/`line` decorations and file-type commands (`gd` → definition); tree-sitter replaces lowlight behind `Highlighter`; a notebook is a new editor kind whose cells each hold a `TextBuffer`. None of these is built in v1 (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3 deferrals) | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V18@R1 |

- **System transition:**

```text
empty repo → scaffold (tooling, CI, boundary test, shell) → editor usable → knowledge features → release binaries (on request)
                                  └→ rollback: previous release binary; files are plain Markdown, no state migration
```

- **Delivery constraints:** the boundary test and CI exist before feature code so violations never land; the OpenTUI paint and image APIs are confirmed against the pinned version before live-preview work depends on them; the Kanban `type` value is confirmed before Kanban ships.

## Success and Verification

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** This document
  - **Outcome:** across crash, external edit, and save failure scenarios, the file on disk is always a complete old or new version and dirty buffers are never overwritten without a prompt.
  - **Requirements:** RM261003ABZP-REQ1@R3
  - **Design:** RM261003ABZP-DES8@R2 - atomic write, own-write suppression, conflict rules
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S1@R1
      - **Scenario:** in a temp workspace: (a) kill the writer between write and rename (simulated by throwing after fsync); (b) modify an open clean file externally; (c) modify an open dirty file externally; (d) save `so`'s own buffer.
      - **Expected result:** (a) original content intact, no temp file left; (b) buffer reloads and `u` restores previous text; (c) conflict prompt appears, file and buffer unchanged until chosen; (d) no reload or conflict triggered.
      - **Method and target:** integration test on `workspace/fs.ts`, `workspace/watcher.ts`, and `core` conflict reducer
      - **Environment:** real file system (tmpdir), real `fs.watch`
      - **Unique risk:** per-file watch losing events after rename; self-triggered reload loops; partial writes.
      - **Predecessors:** None

- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** This document
  - **Outcome:** every command listed in RM261003ABZP-REQ2@R2 produces Neovim's result on the shared fixture cases.
  - **Requirements:** RM261003ABZP-REQ2@R2
  - **Design:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 - grammar, undo blocks, dot-repeat
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** table of `{ before text + cursor, keys, after text + cursor + register }` cases covering each motion, operator, text object, count, register, search, `:s`, undo/redo, and `.`; expected values recorded from Neovim 0.11 `--clean`.
      - **Expected result:** each case matches exactly.
      - **Method and target:** unit tests on `core/kernel/vim/engine.ts` `handleKey`
      - **Environment:** None — pure functions
      - **Unique risk:** subtle divergence (inclusive/exclusive motions, linewise yanks, cursor after undo).
      - **Predecessors:** None
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** feed a lone `\x1b` byte without kitty protocol, then `\x1b[A`, through `ui/input.normalizeKey` with `escTimeoutMs=50`.
      - **Expected result:** lone Esc yields `escape` after 50 ms ± 10 ms; the sequence yields `up` immediately.
      - **Method and target:** unit test on `ui/input.ts`
      - **Environment:** fake timers
      - **Unique risk:** Esc swallowed or arrow keys misread as Esc + letters.
      - **Predecessors:** None

- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** This document
  - **Outcome:** every command is reachable by name in the palette, leader sequences show which-key hints, pickers filter fuzzily, and config overrides apply or fail safely.
  - **Requirements:** RM261003ABZP-REQ3@R4
  - **Design:** RM261003ABZP-DES5@R2, RM261003ABZP-DES14@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V4@R2 — Keymap, which-key, palette, file-type scope, and config**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S3@R1
      - **Scenario:** (a) press `Space` and wait; (b) bind `"<leader>w" = "file.save"` in config and press it; (c) load a config with a syntax error on line 7; (d) set `XDG_CONFIG_HOME=relative/path`; (e) open the palette and type `back`; (f) bind `[filetypes.markdown.keys.normal] "<leader>w" = "link.backlinks"` alongside (b), press `<leader>w` in a note and in `sync.ts`; (g) press `gd` on `[[plan]]` in a note and on an identifier in `sync.ts`; (h) open the palette in `sync.ts` and type `follow`; (i) in `sync.ts`, run `:link.follow`.
      - **Expected result:** (a) which-key lists groups; (b) file saved; (c) notification names `config.toml:7` and defaults apply; (d) `~/.config/so/config.toml` used; (e) `link.backlinks` ranks first; (f) the note opens its backlinks, `sync.ts` saves; (g) the note follows the link, `sync.ts` does nothing; (h) `link.follow` is not listed; (i) the message line shows `not available for typescript files` and nothing changes.
      - **Method and target:** unit tests on `core/kernel/commands`, `workspace/config-file.ts`; component test through the OpenTUI test renderer for (a)
      - **Environment:** tmp config dirs; OpenTUI test renderer
      - **Unique risk:** config error crashing startup; overrides silently ignored; note keys leaking into other file types.
      - **Predecessors:** RM261003ABZP-V4@R1

- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** This document
  - **Outcome:** link following, completion, backlinks, and tags match the index; rename updates every reference while preserving format.
  - **Requirements:** RM261003ABZP-REQ4@R3
  - **Design:** RM261003ABZP-DES7@R4
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** workspace with `a/plan.md`, `b/plan.md`, `plan-x.md` (alias `plan`), `c/deep/plan.md`; resolve `[[plan]]` from `a/x.md`, from `root.md`, `[[b/plan]]`, `[[plan.md]]`, `[[note#H1#H2]]`, `[text](a/plan%20x.md)`.
      - **Expected result:** results follow the documented order exactly.
      - **Method and target:** unit tests on `core/features/links/resolve.ts`
      - **Environment:** None — in-memory index
      - **Unique risk:** nondeterministic or Obsidian-incompatible targets.
      - **Predecessors:** None
    - **RM261003ABZP-V6@R2 — Rename and link-mention preserve link formats**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** (a) rename `plan.md` → `projects/roadmap.md` with references `[[plan]]`, `[[plan|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)`, frontmatter `related: "[[plan]]"`, and an open dirty buffer containing `[[plan]]`; (b) run `link.linkMention` on an unlinked mention "Plan" of `plan.md` in an open dirty buffer and in a closed file.
      - **Expected result:** (a) all rewritten in place with kind, alias, subpath preserved and shortest unique path; the dirty buffer is edited in memory (not overwritten on disk); notification reports the file count. (b) only the mention span becomes `[[plan|Plan]]` (or `[[plan]]` when the text equals the basename); the open buffer is edited in memory and marked dirty; the closed file is written through the atomic write path; the mention moves from unlinked to linked in the backlinks result.
      - **Method and target:** unit tests on `planRename` and the mention span edit + integration test of the rename and `link.linkMention` commands
      - **Environment:** tmp workspace
      - **Unique risk:** broken links or clobbered unsaved edits.
      - **Predecessors:** RM261003ABZP-V6@R1

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** This document
  - **Outcome:** each element listed in RM261003ABZP-REQ5@R2 renders as specified, reveal follows the cursor line or block, and images use the best available protocol.
  - **Requirements:** RM261003ABZP-REQ5@R2
  - **Design:** RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V7@R2 — Layout golden tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** `test/fixtures/tour.md` (every element) laid out by `layoutText` with the Markdown `livePreview` provider at widths 60 and 100 with the cursor outside any block, on a bold line, inside a table, inside a callout; the same note in `source` view.
      - **Expected result:** `RenderLine[]` serialized to text + style tokens matches committed goldens.
      - **Method and target:** unit tests on `layoutText` + `lang/markdown/live-preview.ts`
      - **Environment:** None — pure
      - **Unique risk:** reveal or hiding regressions; broken table alignment; Markdown logic leaking into the kernel view.
      - **Predecessors:** RM261003ABZP-V7@R1
    - **RM261003ABZP-V8@R1 — Image protocol selection**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** render a note with a PNG in the OpenTUI test renderer with capabilities kitty / sixel / none / `images="off"`.
      - **Expected result:** kitty or sixel placement, block characters, or `[image: name.png]` placeholder respectively.
      - **Method and target:** component test on `ui/editors/text-view.ts` and the `image` widget painter
      - **Environment:** OpenTUI test renderer with mocked capabilities
      - **Unique risk:** images breaking layout or crashing on unsupported terminals.
      - **Predecessors:** None

- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** This document
  - **Outcome:** `:Today` and template insertion produce the same text Obsidian's core plugins would for the supported tokens.
  - **Requirements:** RM261003ABZP-REQ6@R2
  - **Design:** RM261003ABZP-DES11@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S6@R1
      - **Scenario:** format 2026-10-03T09:05 with every supported token and `[literal]`; expand a template containing all variables; compute daily paths for `YYYY-MM-DD` and `YYYY/MM/YYYY-MM-DD`; run `:Today` twice.
      - **Expected result:** strings equal Moment.js output for the same tokens; unsupported tokens stay literal; second `:Today` opens the existing file without changing it.
      - **Method and target:** unit tests on `core/time`, `core/features/notes`; integration test for `:Today`
      - **Environment:** fixed clock; tmp workspace
      - **Unique risk:** wrong dates, overwritten daily notes.
      - **Predecessors:** None

- **RM261003ABZP-S7@R1 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** This document
  - **Outcome:** table and Kanban views show the correct rows, edits write valid frontmatter, and unsupported layouts fall back safely.
  - **Requirements:** RM261003ABZP-REQ7@R2
  - **Design:** RM261003ABZP-DES12@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V10@R1 — Bases evaluation, edit, and compatibility**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S7@R1
      - **Scenario:** fixtures ported from Alfred's Bases tests plus a Kanban `.base` saved by Obsidian 1.14+; edit a cell; move a card; open a `cards` view; group by a formula.
      - **Expected result:** rows and order match fixtures; frontmatter patched with comments and order preserved; card move sets the property; `cards` opens as table with notice; moving is disabled for formula grouping.
      - **Method and target:** unit tests on `core/features/bases`; integration test of write-back
      - **Environment:** tmp workspace
      - **Unique risk:** YAML corruption; Kanban type mismatch with Obsidian.
      - **Predecessors:** None

- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** This document
  - **Outcome:** the browser follows edits within 300 ms and the server rejects foreign hosts and out-of-workspace paths.
  - **Requirements:** RM261003ABZP-REQ8@R2
  - **Design:** RM261003ABZP-DES13@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V11@R3 — Preview server behavior and safety**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S8@R1
      - **Scenario:** start preview; request with Host `evil.test:<port>`; request `/file/..%2f..%2fetc/passwd`; request a symlink pointing outside; request `/file/.git/config`; dispatch an edit and measure time to the SSE event; switch the active buffer to `scripts/sync.ts`; with an SSE client connected, run `:PreviewStop`; with `sync.ts` active, run `:Preview`.
      - **Expected result:** 403; 404; 404; 404; SSE `doc` event < 300 ms after the edit; no `doc` event for the switch to `sync.ts`, and `/render` still returns the last note; the client receives a `stopped` event before the connection closes and the port stops accepting connections; `:Preview` from `sync.ts` shows `not available for typescript files` and starts no server; server bound only to 127.0.0.1.
      - **Method and target:** integration test on `preview/server.ts`
      - **Environment:** real `Bun.serve`, tmp workspace with symlink
      - **Unique risk:** DNS rebinding, traversal, network exposure.
      - **Predecessors:** RM261003ABZP-V11@R1, RM261003ABZP-V11@R2

- **RM261003ABZP-S9@R1 — Performance targets hold**
  - **Definition:** This document
  - **Outcome:** the targets in RM261003ABZP-REQ9@R2 are met on the reference machine and gated at 2× in CI.
  - **Requirements:** RM261003ABZP-REQ9@R2
  - **Design:** RM261003ABZP-DES16@R1, RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES7@R4, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V12@R2 — Keystroke and open-file benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** open the 5,000-line fixture note in live preview, and the 5,000-line TypeScript fixture in source view with highlighting, in the OpenTUI test renderer (120×40); send 200 mixed keystrokes (`j`, `w`, `i` + text + `Esc`, `dd`, `u`) to each; measure input → frame complete; measure open time; scroll each file for 2 s with held `j` and repeated `Ctrl-d`/`Ctrl-u` and record frame times with the in-process frame metrics (`RM261003ABZP-RF2`).
      - **Expected result:** for both files, p95 < 16 ms and open < 50 ms on the reference machine; scrolling frame time p95 < 16.7 ms (60 fps); CI median of 5 runs < 32 ms, < 100 ms, and < 33.4 ms.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** OpenTUI test renderer; fixed CI runner type
      - **Unique risk:** full-document parse, layout, or highlighting sneaking into the keystroke path.
      - **Predecessors:** RM261003ABZP-V12@R1
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** generate a 10,000-note workspace; start `so`; record time to first interactive frame and to index ready; type during indexing.
      - **Expected result:** first frame < 200 ms; index ready < 3 s; keystrokes during indexing still meet the V12 budget.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** generated fixture; real worker
      - **Unique risk:** indexing blocking the main thread.
      - **Predecessors:** None

- **RM261003ABZP-S10@R2 — Development and CI are fast; releases are manual and proven by a dry run**
  - **Definition:** This document
  - **Outcome:** `bun run check` < 30 s; CI < 3 min; a dry run of the release workflow produces four checksummed binaries that start, without publishing; nothing is released unless the user asks.
  - **Requirements:** RM261003ABZP-REQ10@R4
  - **Design:** RM261003ABZP-DES15@R4
  - **Predecessors:** RM261003ABZP-S10@R1
  - **Verification:**
    - **RM261003ABZP-V14@R2 — Check timing, CI timing, and non-publishing release dry run**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S10@R2
      - **Scenario:** time `bun run check` locally; read CI run durations; run the release workflow manually on `main` (`gh workflow run release.yml`).
      - **Expected result:** < 30 s; < 3 min; the run's `dist` artifact holds 4 binaries + `SHA256SUMS`; the four native smoke jobs print `so 0.0.0-dev+<short sha>`; the publish job is skipped, and no tag or GitHub Release is created.
      - **Method and target:** non-test check on CI and release workflows
      - **Environment:** GitHub Actions
      - **Unique risk:** slow feedback loops; binaries missing OpenTUI's native library or the index worker; an accidental release.
      - **Predecessors:** RM261003ABZP-V14@R1

- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored**
  - **Definition:** This document
  - **Outcome:** boundary violations fail CI; features extend by registration; terminal state is restored on every exit path; standards are followed.
  - **Requirements:** RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V15@R2 — Import boundary test**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** scan every `src/**/*.ts` with `Bun.Transpiler.scanImports`; include two deliberate violation fixtures: a core file importing `node:fs`, and a `src/core/kernel/**` file importing `src/core/lang/markdown`.
      - **Expected result:** core imports only core and allowed parsing packages; only `src/ui/**` imports `@opentui/*`; `src/core/kernel/**` imports only `src/core/kernel/**`; both fixtures fail.
      - **Method and target:** `test/boundaries.test.ts`
      - **Environment:** None
      - **Unique risk:** layering eroding silently; Markdown assumptions creeping into the kernel.
      - **Predecessors:** RM261003ABZP-V15@R1
    - **RM261003ABZP-V16@R2 — Registration-only extension**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** a test module registers a command, a keymap, a syntax extension, and a block renderer; a second test module registers a `csv` file type with a highlighter, a decoration provider, and a `csv`-scoped keymap; a third registers an editor kind `grid`, a `.grid` file type using it, and a UI view for it — none touches other modules.
      - **Expected result:** the command runs from the palette and keymap; the syntax renders through the renderer; opening `data.csv` uses the `csv` file type, its highlighter marks, its decorations, and its key binding; opening `t.grid` creates window content `{editor: "grid"}` and the shell paints the registered view, with no edit to dispatch code.
      - **Method and target:** unit test across `core/kernel/commands`, `core/filetypes`, `core/lang/markdown`, `core/kernel/view`; component test for `ui/editors` registration
      - **Environment:** None
      - **Unique risk:** hidden switch statements that require edits to extend.
      - **Predecessors:** RM261003ABZP-V16@R1
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** in a PTY, start `so`, then exit by `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception; set `NO_COLOR=1` in one run.
      - **Expected result:** after each exit the PTY is back on the main screen with cursor visible, mouse and kitty keyboard modes off; the `NO_COLOR` run emits no colour SGR codes.
      - **Method and target:** e2e PTY test in `test/e2e/`
      - **Environment:** real PTY (`Bun.spawn` with a pseudo-terminal), headless terminal emulator to read state
      - **Unique risk:** leaving the user's terminal broken.
      - **Predecessors:** None

- **RM261003ABZP-S12@R1 — Any text file opens safely on a language-neutral core**
  - **Definition:** This document
  - **Outcome:** non-Markdown UTF-8 files open in source view with highlighting where recognized, binary and oversized files are refused without writes, and saves keep the file's BOM and line endings. Keeping note-only keys and commands out of other file types is part of RM261003ABZP-S3@R1 (RM261003ABZP-V4@R2).
  - **Requirements:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V18@R1 — Open text, code, binary, and oversized files**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S12@R1
      - **Scenario:** in a tmp workspace: (a) `:e scripts/sync.ts`, `:e config.yaml`, `:e notes.txt`, `:e Makefile`; (b) `:e photo.png` and a file with a NUL byte at offset 100; (c) a file containing invalid UTF-8; (d) a generated 17 MiB text file; (e) edit and save a CRLF file with a UTF-8 BOM.
      - **Expected result:** (a) each opens in source view; `.ts` and `.yaml` lines carry highlighter style tokens, `notes.txt` resolves to `text` and `Makefile` resolves to `makefile` by file name; (b, c) `binary file — not opened`, no buffer created; (d) `file too large — not opened (limit 16 MiB)`; (e) the saved bytes keep the BOM and every `\r\n`.
      - **Method and target:** unit tests on `core/filetypes` and `workspace/fs.readTextFile`; integration test of open and save through the store
      - **Environment:** tmp workspace; real file system
      - **Unique risk:** binary files corrupted by a text save; file-type mismatch; BOM or line endings lost on save.
      - **Predecessors:** None

## Design Decisions and Traceability

- **RM261003ABZP-DES1@R2 — One process, one package, four layers, and a language-neutral kernel, with a tested import boundary**
  - **Requirements:** RM261003ABZP-REQ11@R3 - pure core, enforced boundaries, language-neutral kernel; RM261003ABZP-REQ10@R4 - fast checks
  - **Decision:** `src/core` (pure), `src/workspace` (I/O), `src/ui` (OpenTUI), `src/preview` (HTTP), wired only in `src/app`. Inside the core, `kernel/` (text, editor, vim, commands, view) imports only `kernel/`; `filetypes/`, `lang/`, and `features/` build on it; `state/` and `config/` compose everything. A `bun test` boundary test using `Bun.Transpiler.scanImports` enforces both the layer rules and the kernel rule.
  - **Explanation:** System Architecture diagram; Project Structure; `test/boundaries.test.ts`. One package keeps install and CI fast; the test needs no TypeScript API (`RM261003ABZP-RF13`). The kernel rule is what keeps `so` able to become a code or notebook editor: Markdown cannot leak into editing, and a new language is a new folder plus registrations.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred needed six packages because of its kernel; `so` has no server boundary. `rm261003abzp-roadmap-context.md@R2` - scope change: leave room for code editing and notebooks.
  - **Research:** `RM261003ABZP-RF1` - contain OpenTUI to the UI layer; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3). `RM261003ABZP-RF13` - avoid TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** folder conventions rather than package boundaries; rejected a Turborepo monorepo (slower, more config) and dependency-cruiser (TS 7 issue). Rejected separate `editor-core` and `markdown` packages: same isolation as the kernel rule but with workspace and build overhead.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-DES1@R1

- **RM261003ABZP-DES2@R2 — One store with a pure reducer and data-only effects**
  - **Requirements:** RM261003ABZP-REQ11@R3 - stable, testable foundations; RM261003ABZP-REQ1@R3 - autosave and conflicts; RM261003ABZP-REQ9@R2 - predictable rendering
  - **Decision:** `update(state, action) → { state, effects }`; effects are plain data executed by `app/effects.ts`; results return as actions.
  - **Explanation:** Action and Effect protocol; AppState; `src/core/state/update.ts`. Every behavior (autosave timing, conflict choice, rename) is a pure function test.
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts` - Alfred's vim core already returns effects instead of performing them.
  - **Research:** None
  - **Tradeoffs:** an extra indirection for I/O; rejected UI components holding state (hard to test, the Ink/React pattern Alfred needed a compositor around).
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** RM261003ABZP-DES2@R1

- **RM261003ABZP-DES3@R1 — Line-array TextBuffer behind an interface, with vim undo blocks**
  - **Requirements:** RM261003ABZP-REQ2@R2 - undo per undo block; RM261003ABZP-REQ9@R2 - 5,000-line target
  - **Decision:** immutable line array with structural sharing; `apply(edit)` returns an inverse; undo stack of blocks (one Normal command or one Insert session).
  - **Explanation:** TextBuffer model; `src/core/kernel/text/text-buffer.ts`. A piece table can replace the implementation without changing callers.
  - **Evidence:** `alfred/apps/tui/src/view/editor/text-buffer.ts` - single-string buffer (186 lines) as reference.
  - **Research:** `RM261003ABZP-RF6` - line array adequate at ≤ 5,000 lines; undo block = typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** O(lines) splices on huge files; rejected OpenTUI's native `EditBuffer` as source of truth (couples core to a 0.x UI library).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES4@R1 — Table-driven vim engine**
  - **Requirements:** RM261003ABZP-REQ2@R2 - core vim command set, Esc timeout
  - **Decision:** a pure key-sequence parser for `[count]["reg][count]op[count](motion|textobject)` with motion, operator, and text-object tables; mode machine (normal, insert, visual char/line, cmdline); last-change record for `.`; ex command table.
  - **Explanation:** `src/core/kernel/vim/engine.ts`; Esc timeout handled in `ui/input.ts` (RM261003ABZP-DES10@R2).
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts:15` - Alfred supports only two modes with a hard-coded pending set.
  - **Research:** `RM261003ABZP-RF5` - kitty keyboard protocol, 50 ms timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** no macros or Visual block in v1 (deferred); rejected embedding Neovim (user decision).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES5@R2 — Command registry and file-type-scoped keymap trie as the single extension point for actions**
  - **Requirements:** RM261003ABZP-REQ3@R4 - leader, which-key, palette, config, file-type scope; RM261003ABZP-REQ11@R3 - extend by registration
  - **Decision:** every action is a named `Command`, optionally limited to file types; keys map to command ids through a trie keyed by `{mode, filetype?}`, with the file-type level checked before the global level; which-key, palette, help, and config overrides (`keys.<mode>`, `filetypes.<id>.keys.<mode>`) read the same registry. Note keys (`gd`, `Enter` on links, `<leader>m`, `<leader>x`) are bound for `markdown` only.
  - **Explanation:** `src/core/kernel/commands/registry.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input - LazyVim style; `rm261003abzp-roadmap-context.md@R2` - keymaps scoped by mode and file type.
  - **Research:** None
  - **Tradeoffs:** commands must be pure (state + effects), which forbids quick ad-hoc I/O in commands; accepted for testability. Rejected VS Code-style `when` expressions: a file-type scope covers v1 and the known code-editor need with far less machinery.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** RM261003ABZP-DES5@R1

- **RM261003ABZP-DES6@R2 — micromark/mdast with Obsidian extensions and block-level reparse**
  - **Requirements:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2
  - **Decision:** port Alfred's micromark + GFM + math parsing and Obsidian syntax into `core/lang/markdown` as the `markdown` file type's `analyze`; split into blocks and reparse only changed blocks; one `Doc` with two levels feeds layout, index, and HTML: a linear scan level (links, tags, headings, block ids, frontmatter) used by the index and link features, and mdast built lazily per block for live preview and HTML. Each Obsidian syntax is defined once in `syntaxExtensions` for both levels.
  - **Explanation:** Doc model; `src/core/lang/markdown/doc.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` - existing micromark pipeline; `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md` (DES2, Assigned Parent Obligation Coverage) - a full mdast parse took 11.8 s for 10,000 notes and about 350 ms for the `openFile` fixture; delivered in `src/core/lang/markdown/` (PR #2).
  - **Research:** `RM261003ABZP-RF7` - micromark conformant but not incremental; block reparse meets budgets; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block splitting must handle lists, fences, and frontmatter carefully; two parse levels must agree, which the shared `syntaxExtensions` registry and a conformance test enforce; rejected OpenTUI's tree-sitter Markdown (UI-layer dependency, no Obsidian syntax) and Lezer (skips link reference validation; another parser to learn).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** RM261003ABZP-DES6@R1

- **RM261003ABZP-DES7@R4 — Worker-built in-memory index with a documented resolution rule**
  - **Requirements:** RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename; RM261003ABZP-REQ3@R4 - pickers and full-text search; RM261003ABZP-REQ9@R2 - non-blocking index
  - **Decision:** a Bun `Worker` lists every non-excluded workspace file, summarizes Markdown notes from the scan level of `parseDoc`, and answers full-text queries over Markdown notes and other text files that pass the REQ1 text checks; the main thread holds `NoteIndex` (summaries plus the file list) under `core/features/links`; resolution order: root path → alias → basename ranked by same folder, shortest path, alphabetical; `planRename(ix, moves, open)` rewrites link spans only, from open buffers' scans and the summaries' link spans, without reading files; one link rewrite runs at a time; `link.linkMention` wraps one unlinked mention in `[[…]]` in its source note through a span edit (open buffer in memory, closed file via `write`).
  - **Explanation:** NoteSummary and NoteIndex; `resolve.ts`; `rename.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred used SQLite; `so` has no persistence need for the index; `.s1mple/work/done/w261003fx70-navigation-and-links/` system design DES3, DES4, DES6 and goal deviations D2, D3; delivered in `src/core/features/links/` and `src/workspace/index-worker.ts` (PR #2).
  - **Research:** `RM261003ABZP-RF8` - duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Tradeoffs:** reindex on every start (< 3 s target); searching all text files reads more bytes than notes alone, bounded by `.gitignore` exclusion and the 16 MiB per-file limit; rejected SQLite (persistence and schema cost without need) and ripgrep (external binary).
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES7@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES7@R3

- **RM261003ABZP-DES8@R2 — Atomic saves, directory watching, own-write stamps, and trash adapters**
  - **Requirements:** RM261003ABZP-REQ1@R3 - safe file management
  - **Decision:** `atomicWrite` (realpath → same-dir temp → fsync → chmod → rename); `fs.watch(root, {recursive:true})` with per-path debounce and own-write stamps; trash via freedesktop spec on Linux and, on macOS, `/usr/bin/trash` when present, else `NSFileManager` through JXA (`osascript -l JavaScript` with the path as an argument), both without a permission prompt; else typed confirmation; autosave policy and conflict rules live in core.
  - **Explanation:** `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow.
  - **Evidence:** `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - autosave queue reference; `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-research.md` RF11 - Finder automation prompts for Automation permission, while `/usr/bin/trash` (macOS 15+) and `NSFileManager` move to the trash without a prompt; RF8 - recursive `fs.watch` confirmed on macOS and Linux; delivered in `src/workspace/trash.ts` and `watcher.ts` (PR #1).
  - **Research:** `RM261003ABZP-RF11` - fsync, same directory, directory watching, undoable reload; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (current RM261003ABZP-REQ1@R3)
  - **Tradeoffs:** rename-based saves replace hard links (acceptable for notes); recursive `fs.watch` relies on platform support in Bun on macOS and Linux — confirmed by DI1 (RF8 above) and re-proved in CI on both platforms.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** RM261003ABZP-DES8@R1

- **RM261003ABZP-DES9@R3 — Viewport-only text view with decorations; Markdown live preview as a decoration provider**
  - **Requirements:** RM261003ABZP-REQ5@R2 - live preview; RM261003ABZP-REQ9@R2 - smooth scrolling; RM261003ABZP-REQ11@R3 - language-neutral kernel, registered decoration providers
  - **Decision:** the kernel's pure `layoutText` produces `RenderLine[]` for visible rows only from text plus decorations (`mark`, `replace`, `widget`, `line`) returned by the view's providers and the file type's highlighter. Markdown live preview is the `livePreview` provider in `lang/markdown`: the cursor line reveals inline syntax, a cursor inside a multi-line block reveals the whole block, folded callouts and expanded embeds follow the window's `folds` set, block renderers are registered per block kind, and widgets (image, embed, base) reserve rows. Source view uses highlighter marks only — the same path code files use. The live-preview input (`MarkdownViewInput`: the `Doc` plus a read-only `PreviewCtx`) comes from the Markdown views' `input` hook, so neither the kernel nor the UI knows about Markdown.
  - **Explanation:** FileType and Decoration model; RenderLine model; `src/core/kernel/view/text-view.ts`; `src/core/lang/markdown/live-preview.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/editor/reveal-units.ts` - reveal units reference. Industry precedent: CodeMirror 6 decorations (the basis of Obsidian's live preview), Neovim extmarks and conceal, VS Code decorations.
  - **Research:** `RM261003ABZP-RF7` - per-element reveal in Obsidian; block reveal for multi-line constructs; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal; one decoration list per frame instead of direct painting, accepted because it is bounded by visible lines; rejected OpenTUI `MarkdownRenderable` conceal (UI-owned parsing, no Obsidian syntax) and a Markdown-specific `layoutViewport` (would make every future language reimplement layout).
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES9@R1, RM261003ABZP-DES9@R2

- **RM261003ABZP-DES10@R2 — OpenTUI shell with editor-kind views, widget painters, normalized input, and guaranteed terminal restore**
  - **Requirements:** RM261003ABZP-REQ2@R2 - Esc, cursor shape; RM261003ABZP-REQ3@R4 - explorer, overlays; RM261003ABZP-REQ5@R2 - images; RM261003ABZP-REQ7@R2 - Bases views; RM261003ABZP-REQ11@R3 - restore, `NO_COLOR`, terminal support, registration
  - **Decision:** `@opentui/core` pinned exactly; layout of explorer, bufferline, window splits, side panel, statusline, cmdline, overlays; each window renders through the view registered for its editor kind (`text` → custom `EditorView` renderable painting `RenderLine[]`; `base` → Bases view); widgets are painted by painters registered per widget type (`image` via OpenTUI's auto protocol kitty → sixel → blocks, `embed`, `base`, `rule`); input normalized to `Key` with kitty keyboard protocol and Esc timeout; theme tokens with `NO_COLOR`; restore on exit, signals, and uncaught errors.
  - **Explanation:** `src/ui/*`; `src/ui/editors/`; `src/ui/widgets/`.
  - **Evidence:** `alfred/apps/tui/src/terminal/shutdown.ts` - restore coordinator reference; Context7 `/anomalyco/opentui`.
  - **Research:** `RM261003ABZP-RF1`, `RM261003ABZP-RF2`, `RM261003ABZP-RF4`, `RM261003ABZP-RF5`; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** dependence on a 0.x library contained to `src/ui`; rejected Ink (React redraw cost) and a custom renderer (upfront cost). A notebook later adds one editor view; no shell change.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES9@R3
  - **Predecessors:** RM261003ABZP-DES10@R1

- **RM261003ABZP-DES11@R1 — Shared Moment-subset formatter, pure template expansion, and daily-note commands**
  - **Requirements:** RM261003ABZP-REQ6@R2 - daily notes and templates; RM261003ABZP-REQ7@R2 - Bases date formatting
  - **Decision:** `core/time/format.ts` implements the documented token subset and `[literal]`; `core/features/notes` computes daily paths (with `/` subfolders) and expands `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}`; commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`.
  - **Explanation:** `src/core/time/format.ts`; `src/core/features/notes/*`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input.
  - **Research:** `RM261003ABZP-RF10` - Moment tokens, `{{time:FORMAT}}`, subfolders; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Tradeoffs:** rare tokens unsupported (kept literal); rejected Moment.js and Day.js dependencies (maintenance mode; extra weight).
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** None

- **RM261003ABZP-DES12@R2 — Ported Bases engine as a registered `base` editor kind, with table and Kanban view models and YAML-preserving write-back**
  - **Requirements:** RM261003ABZP-REQ7@R2 - Bases table and Kanban views; RM261003ABZP-REQ11@R3 - editor kinds by registration
  - **Decision:** port `alfred/packages/vault/src/domain/bases/*` (parser, evaluator, expression, yaml-patcher) and `alfred/packages/view-model/src/base/*` row and board rules into `core/features/bases`; `.base` is registered as file type `base` with editor kind `base`, so opening it puts `{editor:"base", path, view, cursor}` in the window; view models `TableModel` and `KanbanModel`; unknown layouts map to `TableModel` with a notice; the Kanban `type` string is one constant verified against an Obsidian 1.14+ file; edits become `write` effects through the atomic save path; embeds render through a `base` block renderer and `base` widget painter.
  - **Explanation:** `src/core/features/bases/*`; `src/ui/editors/` Bases view.
  - **Evidence:** `alfred/packages/vault/src/domain/bases/parser.ts:19`, `evaluator.ts:164` - no file-system or Bun imports (context assumption).
  - **Research:** `RM261003ABZP-RF9` - layouts, Kanban rules; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - **Tradeoffs:** follows an early-access Obsidian layout; guarded by the constant, a fixture, and the table fallback. Bases is the first non-text editor kind, so the seam a notebook needs is exercised in v1 rather than designed speculatively.
  - **Dependencies:** RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES12@R1

- **RM261003ABZP-DES13@R2 — `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering**
  - **Requirements:** RM261003ABZP-REQ8@R2 - read-only preview
  - **Decision:** `preview/server.ts` binds `127.0.0.1:0`, checks Host, serves a page shell, SSE `/events` (`doc` and `stopped` events), `/render` fragments from core `renderHtml(doc)`, and contained `/file/*`; the page loads KaTeX and Mermaid from jsDelivr and falls back to showing source when offline. `:Preview` is a Markdown-only command and the page follows Markdown notes only; switching to another file type sends no `doc` event (flow-level refinement, revision retained).
  - **Explanation:** Preview HTTP routes; `src/preview/server.ts`; `src/core/lang/markdown/html.ts`.
  - **Evidence:** user decision "no Next.js".
  - **Research:** `RM261003ABZP-RF12` - binding, Host check, containment, SSE; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Tradeoffs:** math and diagrams need network in the browser (fallback to source); rejected bundling KaTeX/Mermaid into the binary (multi-MB size) and WebSocket (bidirectional not needed).
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4
  - **Predecessors:** RM261003ABZP-DES13@R1

- **RM261003ABZP-DES14@R2 — TOML config at XDG path validated by schema; per-workspace state at XDG state path**
  - **Requirements:** RM261003ABZP-REQ3@R4 - configuration and state
  - **Decision:** `toml-eslint-parser` (1.0.3, exact pin) + zod schema (`core/config/schema.ts`, `core/config/toml.ts`), so every error names the TOML line; `editor.tabWidth`, `editor.wrap`, and `editor.relativeNumbers` are delivered with DI2; config path honors XDG rules (relative values ignored); invalid config → error notice + defaults; state JSON at `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json` holding recent notes, jump list, open buffers, window layout.
  - **Explanation:** AppConfig; `src/workspace/config-file.ts`; `src/workspace/state-file.ts`.
  - **Evidence:** `rm261003abzp-research.md` S21, S9, S30; `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-requirements.md` Discussion Evidence - `Bun.TOML.parse` errors report the JavaScript call site, not the TOML line; the editor options were approved by the user for DI2 on 2026-10-03; delivered in `src/core/config/` (PR #2).
  - **Research:** `RM261003ABZP-RF15` - TOML, XDG rules, state home; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4)
  - **Tradeoffs:** TOML instead of the proposal's `config.ts` — no code execution and simpler validation, at the cost of no scripting in config (agent decision under delegation). One pinned parser dependency instead of Bun's built-in parser, for line-numbered errors.
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** RM261003ABZP-DES14@R1

- **RM261003ABZP-DES15@R4 — Bun-native toolchain, two-job CI, manual tag releases, and single-runner cross-compile**
  - **Requirements:** RM261003ABZP-REQ10@R4 - fast checks, CI, release; RM261003ABZP-REQ11@R3 - Conventional Commits, SemVer
  - **Decision:** Bun (exact version in `packageManager`), TypeScript 7 `tsc --noEmit` strict, Biome, knip, `bun test` (unit colocated; component via OpenTUI test renderer; few PTY e2e); `bun run check` = biome check + tsc + knip + boundary test + unit tests; CI jobs `check` and `test` (component, e2e, bench) in parallel with Bun cache, triggered on pull requests only, a newer push cancelling the superseded run; no workflow creates a release, tag, or release pull request on its own; release workflow `release.yml`, triggered by a `v*` tag pushed at the user's request (publishes) or by `workflow_dispatch` (dry run: same build and smoke, version `0.0.0-dev+<short sha>`, no tag and no GitHub Release): `bun install --os="*" --cpu="*"`, compile `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64`, `bun-linux-arm64` with `OPENTUI_LIBC=glibc` defined for Linux, every `bun build --compile` (local `build` and release) listing `src/app/main.ts` and `src/workspace/index-worker.ts` as entrypoints so the binary embeds the index worker, `SHA256SUMS`, smoke `so --version` natively for each target (`macos-15` arm64, `macos-15-intel` x64, `ubuntu-24.04` x64, `ubuntu-24.04-arm` arm64), then publish to a GitHub Release with generated notes only for a tag run.
  - **Explanation:** Project Structure (`package.json`, `.github/workflows/*`).
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's eight CI groups are the anti-pattern avoided; user decision 2026-10-03 for PR-only CI (private repository, billed macOS minutes); `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-research.md` RF7 - one runner cross-compiles all four targets, and only a native runner proves each binary starts; RF9 - a release created by release-please with `GITHUB_TOKEN` does not trigger tag workflows, so the build is wired to its outputs; delivered in `.github/workflows/` (PR #1); a single-entrypoint binary drops the worker (`.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-requirements.md` Discussion Evidence), fixed in `package.json` and `release.yml` (PR #2); user decision 2026-10-04 for manual releases only, after release-please failed on every push to `main` (`GitHub Actions is not permitted to create or approve pull requests`).
  - **Research:** `RM261003ABZP-RF3`, `RM261003ABZP-RF13`, `RM261003ABZP-RF14`; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4); RF14's release-please is dropped by the user's manual-release decision
  - **Tradeoffs:** unsigned macOS binaries (signing deferred); no CHANGELOG file — release notes come from GitHub's generated notes, and the version is whatever tag the user asks for; pushes to `main` run no CI, so `main` relies on the pull-request run of its merge head; four smoke runners add billed macOS minutes per release and per phase-exit dry run only. Rejected keeping release-please on manual dispatch: it needs a repository setting to open pull requests and adds a two-step release.
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** RM261003ABZP-DES15@R1, RM261003ABZP-DES15@R2, RM261003ABZP-DES15@R3

- **RM261003ABZP-DES16@R1 — Performance by construction plus benchmark gates**
  - **Requirements:** RM261003ABZP-REQ9@R2 - performance targets
  - **Decision:** viewport-only layout (DES9), block parse cache (DES6), worker index and search (DES7), frame coalescing (one render per input burst), first frame before indexing, lazy image decode with an LRU cache (64 MiB), and benchmarks through the OpenTUI test renderer gated at 2× (median of 5) in CI.
  - **Explanation:** Keystroke to frame and Startup flows; `test/bench/`.
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's 64 MiB image budget precedent.
  - **Research:** `RM261003ABZP-RF2` - in-process metrics; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Tradeoffs:** benchmarks add CI time (bounded by the 3 min budget); terminal display latency is outside the measurement.
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES9@R3
  - **Predecessors:** None

- **RM261003ABZP-DES17@R1 — File-type registry, highlighter interface, and text-file open policy**
  - **Requirements:** RM261003ABZP-REQ1@R3 - any text file, binary and size guard, BOM; RM261003ABZP-REQ3@R4 - file-type scope; RM261003ABZP-REQ11@R3 - file types, highlighters, decoration providers, editor kinds by registration
  - **Decision:** a `FileTypeRegistry` maps a path to a `FileType` (extension, then file name, then the built-in `text` fallback); a file type declares its editor kind (an open string; non-`text` kinds register an `EditorKindSpec` in core, which creates the window state, and a UI view in `editorViews`, which paints it), views with decoration providers and an optional `input` hook whose context type the language declares and `core/state` builds, optional `Highlighter` (a kernel interface), and optional `analyze` hook. Note-only commands, including `:Preview`, are limited to `markdown`. v1 registers `text`, `markdown`, `base`, and code file types backed by one lowlight `Highlighter` (viewport-bounded, cached per buffer version). `workspace/fs.readTextFile` refuses files over 16 MiB and files with a NUL in the first 8 KiB or invalid UTF-8, strips and remembers a BOM and line separator; saves restore both.
  - **Explanation:** FileType and Decoration model; Open a file flow; `src/core/filetypes/registry.ts`; `src/core/lang/code/highlight.ts`; `src/workspace/fs.ts` `readTextFile`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R2` - "Apply all six" decision; `alfred/apps/tui/src/view/markdown/code-highlight.ts` - lowlight precedent. Industry precedent: Neovim `filetype` + ftplugins, VS Code language contributions, Git's NUL-byte binary heuristic.
  - **Research:** None - the decision reuses existing findings (RF6 pure text model, RF7 parse and reveal).
  - **Tradeoffs:** lowlight is regex-based and not incremental, so very long multi-line constructs above the 200-line look-back can highlight wrongly; accepted for v1 and replaceable by tree-sitter behind `Highlighter`. Rejected adding tree-sitter now (WASM grammars, build and size cost without a v1 need) and a generic notebook-ready `Document` abstraction (speculative; editor kinds already cover it). The 16 MiB limit is a fixed constant, not configuration.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES8@R2
  - **Predecessors:** None

| Current requirement | Design decision | Canonical design location | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; `src/core/filetypes/`; Open a file and Save and external change flows | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | `src/core/kernel/text/`, `src/core/kernel/editor/`, `src/core/kernel/vim/`, `src/ui/input.ts` | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, config, state, file-type scope | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R1 | `src/core/kernel/commands/`, `src/ui/overlays/`, `src/workspace/config-file.ts`, `state-file.ts` | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links | RM261003ABZP-DES7@R4, RM261003ABZP-DES6@R2 | `src/core/features/links/` | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | `src/core/lang/markdown/`, `src/core/kernel/view/`, `src/ui/editors/`, `src/ui/widgets/` | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | `src/core/time/`, `src/core/features/notes/` | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | `src/core/features/bases/`, `src/ui/editors/` | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - preview | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R2 | `src/preview/`, `src/core/lang/markdown/html.ts` | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-DES16@R1 | Keystroke and Startup flows; `test/bench/` | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R4 - dev, CI, release | RM261003ABZP-DES15@R4, RM261003ABZP-DES1@R2 | `package.json`, `.github/workflows/` | RM261003ABZP-S10@R2 | RM261003ABZP-V14@R2 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1 | `test/boundaries.test.ts`, `src/core/kernel/`, `src/core/filetypes/`, registries, `src/ui/shell.ts` | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

## Unresolved Items

None — open technical confirmations are delivery constraints with named verification, not design decisions. DI1 confirmed the OpenTUI paint, buffer, and test-renderer APIs at `@opentui/core` 0.5.14 and recursive `fs.watch` on macOS and Linux. The OpenTUI image API at the pinned version (before DI3 relies on it) and the Kanban `type` value (DI4) remain.

## Approval

- **Requirement baseline:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 … RM261003ABZP-REQ10@R4, RM261003ABZP-REQ11@R3
- **Approved design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R4, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
- **Approved success and verification:** RM261003ABZP-S1@R1 … RM261003ABZP-S9@R1, RM261003ABZP-S10@R2, RM261003ABZP-S11@R1, RM261003ABZP-S12@R1; RM261003ABZP-V1@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1, RM261003ABZP-V4@R2, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1, RM261003ABZP-V9@R1, RM261003ABZP-V10@R1, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V13@R1, RM261003ABZP-V14@R2, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1
- **Approval evidence:** User delegated all decisions on 2026-10-03 ("you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"); the agent approved this design, the DES2/DES7/DES9/DES13 R2 revisions from the UI system-impact assessment, and the V6/V11 R2 verification revisions, under that delegation. On 2026-10-03 the user approved the Markdown-first, language-neutral core by selecting "Apply all six (Recommended)" (kernel split, FileType registry, decorations, file-type keymaps, highlighter interface, open any text file); this produced DES1@R2, DES5@R2, DES7@R3, DES9@R3, DES10@R2, DES12@R2, DES17@R1, S12@R1, V18@R1, and the V4/V7/V12/V15/V16 R2 revisions. The user then delegated every remaining sub-decision on 2026-10-03 ("you self-drive everything. Everything is good now, don't need to stop"), covering the 16 MiB limit, binary check, BOM preservation, all-file picker and text-file search, `[filetypes.<id>.keys.<mode>]` config, no statusline file-type segment, S12/V18, the TypeScript benchmark, and the lowlight look-back. Post-DI1 synchronization approved by the user on 2026-10-03: DES8@R2 (macOS trash without a prompt) and DES15@R2 (pull-request-only CI, `workflow_call` release, native smoke). Post-DI2 synchronization approved by the user on 2026-10-04: DES6@R2 (two-level Markdown model), DES7@R4 (scan-level summaries, `planRename` from moves and open scans, one link rewrite at a time), DES14@R2 (`toml-eslint-parser`, editor options), and DES15@R3 (index worker as a second compile entrypoint). On 2026-10-04 the user decided that releases are manual (a `v*` tag pushed only on request) and that phase exits run a non-publishing dry run: DES15@R4, S10@R2, V14@R2.
``````

- **RM261003ABZP-DES17@R1, RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 — DI3 delivery synchronization: window editor kind, relaxed live-view and startup targets**
  - **Archived at:** 2026-10-04T05:55:53Z
  - **Change type:** Revised
  - **Reason:** DI3 (W261003S6BQ, PR #6) merged to `main` as `e228bb5` on 2026-10-04. RM261003ABZP-REQ9@R3 relaxes the live-view and startup targets that V12 and V13 state as numbers (approved by the user on 2026-10-04). DI3 also derives each window's editor kind from its buffer's file type, where DES17@R1 said that a non-`text` kind's `EditorKindSpec` creates the window state.
  - **Changes:**
    - DES17: a window shows its buffer in the buffer's file-type editor kind when that kind is registered in core, else in `text`; the kind is derived after each reducer step and never persisted. `EditorKindSpec.open` creates window state only for a kind that needs its own, first used by `base` (DI4). The explanation adds `src/core/state/update.ts` `syncEditorKinds`, and the evidence adds the W261003S6BQ system design §6 and PR #6. The AppState contract (buffer windows are `{editor, bufferId, cursor, scroll, folds}` with the derived `editor`; the invariant covers every window showing a buffer) and the Open a file flow follow.
    - V12: the expected result splits by view. The note in live preview has keystroke p95 < 24 ms and open < 80 ms; the TypeScript file in source view has keystroke p95 < 16 ms and open < 50 ms; scrolling p95 stays < 16.7 ms for both. CI 2× limits: < 48 ms and < 160 ms, < 32 ms and < 100 ms, and < 33.4 ms.
    - V13: first frame < 250 ms (was < 200 ms); keystroke p95 while indexing < 30 ms (was the 16 ms V12 budget); index ready < 3 s unchanged; CI 2× limits < 500 ms, < 6 s, and < 60 ms.
    - Startup flow: the first-frame target reads < 250 ms.
    - Unresolved Items: DI3 confirmed the OpenTUI image API at the pinned version (W261003S6BQ V43 terminal spike).
    - Not changed here: the `embed?: true` tag on `read`, `fileLoaded`, and `fileRefused`, and `BufferState.embeds.requested` kept until its read answers. This design names the Action and Effect members and the `buffers` fields without that detail, so both are phase-design shapes recorded in the PH2 file, as the post-DI2 synchronization recorded DI2's additive actions and effects in the PH1 file.
    - Reference updates, revisions retained: every current citation of RM261003ABZP-REQ9 (S9, DES2, DES3, DES6, DES7, DES9, DES16, traceability) cites REQ9@R3, and the DES16 research line notes the current revision. DES17, V12, and V13 citations (project structure, components, runtime flows, contracts, code design, cross-cutting, traceability, approval) cite the new revisions. The DES6 explanation keeps its DI2-era RM261003ABZP-V13@R1 measurement, and the approval history keeps DES17@R1.
  - **Record transitions:**
    - RM261003ABZP-DES17@R1 → RM261003ABZP-DES17@R2 - revision change (window editor kind derived from the buffer's file type)
    - RM261003ABZP-V12@R2 → RM261003ABZP-V12@R3 - revision change (live-view keystroke and open targets)
    - RM261003ABZP-V13@R1 → RM261003ABZP-V13@R2 - revision change (first-frame and indexing keystroke targets)
    - RM261003ABZP-S9@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES16@R1 - Revision retained
  - **Requirement baseline:** RM261003ABZP-REQ9@R2 → RM261003ABZP-REQ9@R3; others unchanged.
  - **Evidence:** `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md` §6 and §7; `w261003s6bq-goal.md` Blockers and Deviations; `reports/overall-verification-report.md`; PR #6 body (Pending parent synchronization, Performance); `src/core/state/types.ts` `WindowState`, `src/core/state/update.ts` `syncEditorKinds`, `scripts/bench-gate.ts` `TARGETS`, and `test/ui/extension.test.ts` (the `grid` editor kind) at `e228bb5`.
  - **Research provenance:**
    - None - no new roadmap research. RF2 support for DES16 is unchanged.
  - **Affected coverage:** RM261003ABZP-REQ9@R2 → DES16@R1, S9@R1, V12@R2, V13@R1 becomes RM261003ABZP-REQ9@R3 → DES16@R1, S9@R1, V12@R3, V13@R2; the REQ1, REQ3, REQ5, REQ7, and REQ11 rows cite DES17@R2.
  - **Approval evidence:** Approved by the user on 2026-10-04.
  - **Downstream impact:** `rm261003abzp-roadmap-index.md` and `rm261003abzp-roadmap-phase-2-obsidian-experience.md` cite DES17@R2, V12@R3, and V13@R2 (PH2@R5, DI3@R4). UI artifacts keep DES17@R1 and V12@R2 as their approved system baseline; the UI behaviour they depend on (views by editor kind, source view for other text files, no loading state) is unchanged. PH1 (completed) keeps DES17@R1 and V13@R1 as its delivered baseline. W261003S6BQ produced these changes; DI4 is the first caller of `EditorKindSpec.open`.

``````markdown
# RM261003ABZP: so v1 — Design

- **Status:** Approved
- **Outcome:** One Bun process with a pure TypeScript core — a language-neutral editor kernel (text, vim, commands, view) plus registered file types, Markdown language support, and note features (links, notes, Bases) — driven by one-way state flow, thin I/O adapters, an OpenTUI shell that draws only visible lines, and a read-only `Bun.serve` preview — enforced by an import-boundary test and gated by fast CI with in-process performance benchmarks.
- **History:** `rm261003abzp-design-revisions.md`

Use `None — <reason>` for sections or fields that do not apply. Diagrams and code previews show proposed design unless labeled as current evidence.

## Baseline and Goals

- **Context:** `rm261003abzp-roadmap-context.md@R2` - empty repository; Alfred code available to port (Markdown parse, Obsidian syntax, vim core, terminal graphics, Bases); scope change 2026-10-03: Markdown-first on a language-neutral core.
- **Requirements:** `rm261003abzp-requirements.md` - RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3 … RM261003ABZP-REQ10@R4, RM261003ABZP-REQ11@R3 (approved).
- **Research:** `rm261003abzp-research.md`
- **Reconciliation:** `rm261003abzp-requirements.md` Research Reconciliation — Complete.
- **Goals:**
  - Meet REQ1–REQ11 with the fewest moving parts: one process, one package, one state store.
  - Keep every product rule in a pure, unit-testable core; keep OpenTUI, Bun, and the file system at the edges.
  - Keep the editor kernel language-neutral: Markdown, links, notes, and Bases plug in through a file-type registry, so code editing and notebooks can be added later as registrations, not rewrites (RM261003ABZP-REQ11@R3).
  - Extend by registration (commands, keymaps, syntax extensions, block renderers, Bases view types, file types, highlighters, decoration providers, editor kinds) — the known extension needs from RM261003ABZP-REQ11@R3.
- **Binding constraints:**
  - `.s1mple/S1MPLE.md` Implementation - "Keep it lean and simple": no monorepo, no server between UI and core, no speculative plugin system.
  - RM261003ABZP-REQ11@R3 - only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs; `src/core/kernel/` imports nothing from `filetypes/`, `lang/`, or `features/`.
  - RM261003ABZP-REQ10@R4 - no tool may depend on the TypeScript compiler API (TypeScript 7 ships none, `RM261003ABZP-RF13`).

## System Architecture

- **System context:** One user in a terminal runs `so [path]`. External systems: the file system (the workspace folder, `$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, trash), the terminal emulator (keys, mouse, graphics), the system clipboard, and — only while `:Preview` runs — a local browser over `127.0.0.1`. No network service, database, Git, or AI.
- **Current architecture:** `rm261003abzp-roadmap-context.md@R2` Current System — empty repository.

```text
Not established — empty repository (only .s1mple/ guidance)
```

- **Proposed architecture:**

```text
                         ┌──────────────────────── src/app (composition root) ────────────────────────┐
 terminal ⇄ OpenTUI ⇄    │  main.ts → loads config/state → creates Store → starts UI, effects, workers │
                         └──────┬──────────────────────┬───────────────────────┬────────────────────┬──┘
                                │                      │                       │                    │
                   ┌────────────▼─────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
                   │ src/ui  (OpenTUI)    │  │ src/workspace (I/O)│  │ src/preview       │  │ src/core (pure)│
                   │ views, input, paint  │  │ fs, watcher, trash │  │ Bun.serve + SSE   │  │ state, vim,    │
                   │ images, theme        │  │ index worker, cfg  │  │ read-only HTML    │  │ kernel, file-  │
                   └────────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │ types,lang,feat│
                                │ reads state,          │ executes effects,     │ reads state, └───────▲────────┘
                                │ dispatches actions    │ dispatches results    │ renders HTML         │
                                └───────────────────────┴───────────────────────┴──────── import ──────┘

 Allowed imports:  app → ui, workspace, preview, core      ui → core      workspace → core      preview → core
                   core → (nothing outside core; npm parsing libs only)

 Inside core:      core/kernel  (text, editor, vim, commands, view)  → kernel only        ← language-neutral
                   core/filetypes                                     → kernel
                   core/lang/*, core/features/*                       → kernel, filetypes, lang, features, time
                   core/state, core/config                            → any core module (composition)
                   nothing outside core/state and core/config imports them
```

The core owns all product behavior; the three edge layers are adapters. This reuses Alfred's parsing, Obsidian syntax, vim, terminal-graphics knowledge, and Bases engine by porting them into `core/` (Alfred's kernel, client, protocol, chat, Git, SQLite, Ink, and Next.js are not reused). Main tradeoff: one process keeps latency and code minimal, but a CPU-heavy task on the main thread would stall input — so scanning, parsing for the index, and full-text search run in a worker (RM261003ABZP-DES7@R4).

Inside the core, the kernel edits and lays out text for any language; Markdown is one registered file type whose parser, live-preview decorations, and highlighter plug into the kernel (RM261003ABZP-DES1@R2, RM261003ABZP-DES17@R1). A code editor or notebook later adds file types, decoration providers, and editor kinds; the kernel does not change. Tradeoff: one more indirection (the file-type registry) between an open buffer and its Markdown behaviour, accepted because it is also what Bases and plain text files need in v1.

## Components and Boundaries

- **App (composition root)**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2
  - **Location:** `src/app/`
  - **Responsibilities:** parse CLI args; register file types (`text`, `markdown`, `base`, code types), commands, and keymaps; load config and state; construct the store, effect runner, workspace adapters, index worker, UI, and preview on demand; own process lifecycle and exit codes.
  - **Collaborators:** `bin/so` → `app/main.ts` → `core/store`, `workspace/*`, `ui/shell`, `preview/server`
  - **Contracts:** Action and Effect protocol; AppConfig
  - **Code shape:** `src/app/main.ts` `main`, `src/app/effects.ts` `runEffect`
  - **Must not own:** product rules, rendering, Markdown semantics.

- **Core — state**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Location:** `src/core/state/`
  - **Responsibilities:** `AppState`, pure `update(state, action) → { state, effects }`; jump list, autosave policy, conflict rules; opening a file as a buffer of its registered file type.
  - **Collaborators:** ui/workspace/preview → `dispatch(action)` → `update` → effects → app effect runner
  - **Contracts:** Action and Effect protocol; AppState
  - **Code shape:** `src/core/state/update.ts` `update`
  - **Must not own:** timers, I/O, terminal escape codes.

- **Core — editor kernel**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/core/kernel/` (`text/`, `editor/`, `vim/`, `commands/`, `view/`)
  - **Responsibilities:** text buffer, cursor and selections, undo blocks, registers, window tree; vim mode machine, key-sequence parser, motions, operators, text objects, dot-repeat, search, ex commands; command registry, file-type-scoped keymap trie, which-key and palette data; the viewport text view that lays out visible rows from text and decorations.
  - **Collaborators:** `update` → `vim.handleKey(bufferState, key)` → `TextBuffer`; `update` → `keymap.lookup({mode, filetype})`; UI → `layoutText(view, providers, analysis)` → `RenderLine[]`
  - **Contracts:** TextBuffer; VimState; Command and Keymap registry; Decoration and RenderLine model
  - **Code shape:** `src/core/kernel/text/text-buffer.ts` `TextBuffer`; `src/core/kernel/vim/engine.ts` `handleKey`; `src/core/kernel/commands/registry.ts` `CommandRegistry`, `Keymap`; `src/core/kernel/view/text-view.ts` `layoutText`
  - **Must not own:** rendering, clipboard I/O (expressed as effects), and anything Markdown-, link-, note-, or Bases-specific (enforced by the boundary test).

- **Core — file types**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Location:** `src/core/filetypes/`
  - **Responsibilities:** `FileType` contract and `FileTypeRegistry`: path → file type (extension, then file name, then the `text` fallback); per file type the editor kind, views, highlighter, and analysis hook; the built-in `text` file type.
  - **Collaborators:** `app/main` → registers `markdown`, `base`, and code file types; `update` → `fileTypes.forPath(path)` on open
  - **Contracts:** FileType and Decoration model
  - **Code shape:** `src/core/filetypes/registry.ts` `FileTypeRegistry`, `FileType`
  - **Must not own:** language parsing (lives in `lang/`), file reading (workspace).

- **Core — languages (Markdown and code highlighting)**
  - **Decisions:** RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES13@R3, RM261003ABZP-DES17@R1
  - **Location:** `src/core/lang/markdown/`, `src/core/lang/code/`
  - **Responsibilities:** Markdown block splitting, per-block parse cache, Obsidian syntax extensions, `Doc` model; the live-preview decoration provider with reveal rules and block renderers; pure HTML rendering for the preview; the `markdown` file type. `lang/code` wraps lowlight as `Highlighter`s and registers code file types (TypeScript, JavaScript, JSON, YAML, TOML, shell, Python, CSS, HTML, …) used for code files and fenced code blocks.
  - **Collaborators:** `update` → `markdown.analyze(buf, prevDoc)` → `Doc`; UI → `layoutText(view, [highlight, livePreview(doc)])` → paint; preview → `renderHtml(doc, ctx)`
  - **Contracts:** Doc model; FileType and Decoration model
  - **Code shape:** `src/core/lang/markdown/doc.ts` `parseDoc`; `src/core/lang/markdown/live-preview.ts` `livePreview`; `src/core/lang/markdown/html.ts` `renderHtml`; `src/core/lang/code/highlight.ts` `lowlightHighlighter`
  - **Must not own:** terminal escape output, image decoding, HTTP.

- **Core — links feature**
  - **Decisions:** RM261003ABZP-DES7@R4
  - **Location:** `src/core/features/links/`
  - **Responsibilities:** `NoteSummary` extraction, `NoteIndex` (names, aliases, headings, blocks, links, tags, backlinks) plus the workspace file list for the file picker, link resolution rule, rename planning, full-text search functions. Fuzzy ranking is kernel text code (`src/core/kernel/text/fuzzy.ts`) because the palette and every picker use it.
  - **Collaborators:** index worker → `scanDoc(text)` → `summarize(path, mtime, scan, lines)` → `NoteIndex.apply(delta)`; `update` → `resolveLink`, `planRename`
  - **Contracts:** NoteSummary and NoteIndex; LinkTarget
  - **Code shape:** `src/core/features/links/note-index.ts` `NoteIndex`; `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`
  - **Must not own:** file scanning (worker), persistence.

- **Core — Bases and notes features**
  - **Decisions:** RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2
  - **Location:** `src/core/features/bases/`, `src/core/features/notes/`, `src/core/time/`
  - **Responsibilities:** `.base` parsing, expression evaluation, table and Kanban view models, YAML-preserving frontmatter patches, the `base` file type and editor kind; daily-note paths, template expansion, Moment-subset date formatting.
  - **Collaborators:** `update` → `evaluateBase(base, index)` → `BaseViewModel`; `update` → `expandTemplate(tpl, vars)`
  - **Contracts:** BaseViewModel; Template variables
  - **Code shape:** `src/core/features/bases/evaluate.ts` `evaluateBase`; `src/core/time/format.ts` `formatDate`
  - **Must not own:** file writes (expressed as `write` effects).

- **Workspace adapters**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R1
  - **Location:** `src/workspace/`
  - **Responsibilities:** atomic save, text read with binary and size checks, create, rename, move, delete-to-trash; directory watcher with own-write suppression; index worker (scan, summarize, search); config and state files; clipboard; opening URLs/browser.
  - **Collaborators:** app effect runner → `workspace/*` → `dispatch(resultAction)`
  - **Contracts:** Effect protocol; FileEvent; WorkerMessage
  - **Code shape:** `src/workspace/fs.ts` `atomicWrite`, `readTextFile`; `src/workspace/watcher.ts` `watchWorkspace`; `src/workspace/index-worker.ts`
  - **Must not own:** decisions about conflicts, autosave timing, or link rewriting (core decides).

- **UI shell**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Location:** `src/ui/`
  - **Responsibilities:** OpenTUI renderer lifecycle; key/mouse normalization (kitty keyboard protocol, Esc timeout); layout of explorer, bufferline, editor windows, side panel, statusline, command line, overlays (picker, which-key, palette, prompts, help, notifications); one view per editor kind (`text` → `EditorView`, `base` → Bases view); painting `RenderLine[]`; widget painters keyed by widget type (image, embed, base); theme and `NO_COLOR`; terminal restore.
  - **Collaborators:** OpenTUI → `ui/input` → `dispatch`; store subscription → `ui/shell.render(state)`
  - **Contracts:** Key; RenderLine; AppState (read-only)
  - **Code shape:** `src/ui/shell.ts` `createShell`; `src/ui/editors/registry.ts` `editorViews`; `src/ui/editors/text-view.ts` `EditorView`; `src/ui/widgets/registry.ts` `widgetPainters`; `src/ui/input.ts` `normalizeKey`
  - **Must not own:** editing logic, Markdown parsing, file-type decisions, file I/O.

- **Preview server**
  - **Decisions:** RM261003ABZP-DES13@R3
  - **Location:** `src/preview/`
  - **Responsibilities:** `Bun.serve` on `127.0.0.1:0`, Host allowlist, SSE updates, read-only page, contained asset serving.
  - **Collaborators:** app → `startPreview(store)` → browser; store subscription → SSE push
  - **Contracts:** Preview HTTP routes
  - **Code shape:** `src/preview/server.ts` `startPreview`
  - **Must not own:** editing; files outside the workspace.

## Project Structure

- **Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json                 Purpose: one package; scripts dev/check/test/bench/build; exact pins
│       Symbols: scripts.check, packageManager, "@opentui/core": "<exact>"   Decisions: DES15
├── [A] tsconfig.json                Purpose: strict ESM, noEmit, TS 7          Decisions: DES15
├── [A] biome.json                   Purpose: format + lint                      Decisions: DES15
├── [A] knip.json                    Purpose: dead-code check                    Decisions: DES15
├── [A] .github/workflows/ci.yml     Purpose: check ∥ test+bench jobs on pull requests  Decisions: DES15, DES16
├── [A] .github/workflows/release.yml Purpose: compile ×4 + native smoke ×4; publish on a `v*` tag pushed at the user's request; manual run = dry run, no publish  Decisions: DES15
├── [A] bin/so                        Purpose: `#!/usr/bin/env bun` entry for source runs  Decisions: DES1
├── [A] src/app/
│   ├── main.ts                      Purpose: CLI, wiring, lifecycle            Symbols: main, parseArgs   Decisions: DES1, DES2
│   └── effects.ts                   Purpose: effect runner                     Symbols: runEffect         Decisions: DES2
├── [A] src/core/
│   ├── kernel/                      Purpose: language-neutral editor kernel; imports only kernel  Decisions: DES1
│   │   ├── text/                    Purpose: TextBuffer, Edit, Pos, Range, fuzzy ranking  Symbols: TextBuffer, Edit, fuzzyScore, rankBy  Decisions: DES3, DES7
│   │   ├── editor/                  Purpose: undo, registers, windows           Symbols: UndoStack, Registers  Decisions: DES3
│   │   ├── vim/                     Purpose: modes, parser, motions, operators, text objects, ex  Symbols: handleKey, motions, textObjects  Decisions: DES4
│   │   ├── commands/                Purpose: registry, file-type-scoped keymap trie, which-key  Symbols: CommandRegistry, Keymap, KeyScope  Decisions: DES5
│   │   └── view/                    Purpose: viewport text layout from decorations  Symbols: layoutText, Decoration, RenderLine  Decisions: DES9
│   ├── filetypes/                   Purpose: FileType contract, registry, `text` fallback  Symbols: FileTypeRegistry, FileType, Highlighter  Decisions: DES17
│   ├── lang/
│   │   ├── markdown/                Purpose: block split, linear scan, lazy mdast, parse cache, Obsidian extensions, live-preview provider, HTML  Symbols: parseDoc, Doc, scanDoc, blockNode, livePreview, renderHtml, markdownFileType  Decisions: DES6, DES9, DES13
│   │   └── code/                    Purpose: lowlight highlighter, code file types  Symbols: lowlightHighlighter, codeFileTypes  Decisions: DES17
│   ├── features/
│   │   ├── links/                   Purpose: summaries, index, file list, resolve, rename, search  Symbols: NoteIndex, resolveLink, planRename  Decisions: DES7
│   │   ├── bases/                   Purpose: ported Bases engine, view models, `base` file type  Symbols: parseBase, evaluateBase, KANBAN_TYPE, baseFileType  Decisions: DES12
│   │   └── notes/                   Purpose: daily notes, templates             Symbols: dailyPath, expandTemplate  Decisions: DES11
│   ├── time/                        Purpose: Moment-subset formatter            Symbols: formatDate        Decisions: DES11
│   ├── state/                       Purpose: AppState, Action, Effect, update  Symbols: update, AppState  Decisions: DES2
│   └── config/                      Purpose: config schema, defaults, TOML parse with line numbers  Symbols: ConfigSchema, defaults, parseConfig  Decisions: DES14
├── [A] src/workspace/
│   ├── fs.ts                        Purpose: readTextFile (binary/size/BOM/EOL), atomicWrite, create, rename, move  Symbols: readTextFile, atomicWrite  Decisions: DES8, DES17
│   ├── trash.ts                     Purpose: freedesktop trash, macOS trash (`/usr/bin/trash` or NSFileManager)  Symbols: moveToTrash  Decisions: DES8
│   ├── watcher.ts                   Purpose: directory watching, own-write suppression  Symbols: watchWorkspace  Decisions: DES8
│   ├── index-worker.ts              Purpose: list files, summarize notes, search text files in a Worker  Symbols: onmessage  Decisions: DES7
│   ├── config-file.ts               Purpose: XDG config load + validation       Symbols: loadConfig        Decisions: DES14
│   ├── state-file.ts                Purpose: XDG state load/save                Symbols: loadState, saveState  Decisions: DES14
│   └── system.ts                    Purpose: clipboard, open browser           Symbols: clipboard, openUrl  Decisions: DES8
├── [A] src/ui/
│   ├── shell.ts                     Purpose: renderer lifecycle, layout, restore  Symbols: createShell  Decisions: DES10
│   ├── input.ts                     Purpose: key/mouse normalization, Esc timeout  Symbols: normalizeKey  Decisions: DES10
│   ├── editors/                     Purpose: one view per editor kind: text (paints RenderLine rows, cursor), base  Symbols: editorViews, EditorView  Decisions: DES9, DES10, DES12
│   ├── widgets/                     Purpose: widget painters by type: image, embed, base  Symbols: widgetPainters  Decisions: DES10
│   ├── views/                       Purpose: explorer, bufferline, statusline, cmdline, side panel  Decisions: DES10
│   ├── overlays/                    Purpose: picker, which-key, palette, prompt, help, notify  Decisions: DES10, DES5
│   └── theme.ts                     Purpose: tokens, NO_COLOR                   Symbols: theme     Decisions: DES10
├── [A] src/preview/
│   ├── server.ts                    Purpose: Bun.serve, Host check, SSE, assets  Symbols: startPreview  Decisions: DES13
│   └── page.html                    Purpose: read-only page shell (embedded)   Decisions: DES13
└── [A] test/
    ├── boundaries.test.ts           Purpose: import-boundary enforcement (layers + kernel rule)  Decisions: DES1
    ├── e2e/                         Purpose: few PTY tests (start, edit, save, exit, restore)  Decisions: DES15
    ├── bench/                       Purpose: performance benchmarks via test renderer  Decisions: DES16
    └── fixtures/                    Purpose: sample workspace (notes, code files, a binary; an over-16 MiB file is generated at test time), 5,000-line note, 5,000-line TypeScript file, 10,000-note generator  Decisions: DES16, DES17
```

Unit tests sit next to code as `*.test.ts`.

## Runtime Flows

- **Keystroke to frame**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** OpenTUI key event → `ui/input.normalizeKey` → `store.dispatch({type:"key"})` → `core/state/update` → `keymap.lookup({mode, filetype})` or `vim.handleKey` → `TextBuffer.apply` → file type `analyze` (Markdown: `parseDoc` reparses changed blocks) → store notifies → `ui/shell.render` → `layoutText` with the view's decoration providers (visible rows only) → `EditorView` paint → OpenTUI native diff
  - **Flow:**

    ```text
    key ─→ normalizeKey ─→ dispatch(key) ─→ update(state,key)
                                              ├─ keymap trie {mode, buffer filetype} → {mode}: pending prefix? → state.pending, effect: startWhichKeyTimer
                                              ├─ command → run(ctx) → new state + effects (e.g. scheduleAutosave)
                                              └─ text edit → TextBuffer' + undo block + dirty block ids
                                                   → fileType.analyze (Markdown: reparse dirty blocks, cache by block hash)
          ui.render(state) ← store.notify ←───┘
            └─ layoutText(rows in view, [highlightMarks, view providers e.g. livePreview], view input) → paint → native diff → terminal
    ```

    State changes only inside `update`. Rendering is coalesced to at most one frame per input burst.

  - **Failure and recovery:** a command throws → `update` catches, keeps the previous state, emits `notify(error)`; a render error in one block → that block renders as source with a diagnostic marker; nothing crashes the process.
  - **Contracts and state:** Action and Effect protocol; AppState; FileType and Decoration model; RenderLine model
  - **Control flow:** `src/core/state/update.ts` `update`; `src/core/kernel/view/text-view.ts` `layoutText`; `src/ui/shell.ts` `createShell`

- **Startup**
  - **Decisions:** RM261003ABZP-DES1@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
  - **Participants:** `app/main` → register file types (`markdown`, `base`, code types, `text` fallback) → `loadConfig`, `loadState` → `createStore` → `createShell` (first frame) → `startIndexWorker` → `watchWorkspace`
  - **Flow:**

    ```text
    so [path] → resolve workspace (folder | file's parent) ── missing → stderr + exit 2
             → load config (invalid → defaults + error notice) → load state (corrupt → empty)
             → first frame (explorer from a shallow readdir; opened file read directly)   ← < 200 ms target
             → worker: list all non-excluded files + summarize Markdown notes → post batches → dispatch(indexBatch) → status "indexing 4,210/10,000"
             → watcher starts → index ready
    ```

  - **Failure and recovery:** worker crash → notify and restart once; link features show "index unavailable" until restart succeeds; editing keeps working.
  - **Contracts and state:** AppConfig; WorkerMessage; NoteIndex
  - **Control flow:** `src/app/main.ts` `main`

- **Open a file**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES12@R2
  - **Participants:** `:e`, explorer `Enter`, picker, or link follow → effect `read(path)` → `workspace/fs.readTextFile` → `dispatch(fileLoaded | fileRefused)` → `update` → `fileTypes.forPath(path)` → buffer and window content
  - **Flow:**

    ```text
    open(path) → effect read(path) → readTextFile: size > 16 MiB          → fileRefused{reason:"tooLarge"}
                                                 NUL in first 8 KiB       → fileRefused{reason:"binary"}
                                                 not valid UTF-8 (fatal)  → fileRefused{reason:"binary"}
                                                 else strip BOM, detect EOL → fileLoaded{text, bom, eol, stamp}
    fileLoaded → fileTypes.forPath(path): ".md" → markdown (views live|source|reading, editor "text")
                                          ".base" → base (editor "base" → Bases view)
                                          ".ts" → typescript (views source, lowlight highlighter)
                                          other  → text (views source, no highlighter)
               → editor "text": buffer {fileType, view: first view, analysis: analyze?(buf)} → content {editor:"text", bufferId, …}
               → other editor: editorKinds.get(fileType.editor).open(path, text) → content {editor, state}
    fileRefused → notify "binary file — not opened" | "file too large — not opened (limit 16 MiB)"; no buffer, no write
    ```

  - **Failure and recovery:** read error → `fileRefused{reason:"io", message}` → notification; the previous buffer stays active.
  - **Contracts and state:** Action and Effect protocol; FileType and Decoration model; AppState
  - **Control flow:** `src/workspace/fs.ts` `readTextFile`; `src/core/filetypes/registry.ts` `FileTypeRegistry.forPath`, `EditorKindRegistry.get`

- **Save and external change**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2
  - **Participants:** `update` (autosave policy) → effect `write` → `workspace/fs.atomicWrite` → `watcher` → `dispatch(fileChanged)` → `update` (conflict rules)
  - **Flow:**

    ```text
    edit → state.dirty=true → effect scheduleAutosave(1000ms) | leaveInsert | switchNote | exit | :w
         → effect write(path, text, expectedStamp) → atomicWrite: realpath → tmp in same dir → write (BOM + EOL restored) → fsync → chmod → rename
         → record ownWrite(path, stamp) → dispatch(saved(stamp))
    watcher(dir) event → stat+hash → ownWrite? ignore
                                   → buffer clean → dispatch(reload(text)) → undoable reload
                                   → buffer dirty → dispatch(conflict) → prompt: keep mine | take disk | view diff
    ```

  - **Failure and recovery:** write fails (permission, disk full) → buffer stays dirty, status shows `save failed: <reason>`, autosave retries with backoff (1 s, 2 s, 4 s, max 30 s); `:w` retries immediately. Rename failure leaves the temp file removed and the original intact.
  - **Contracts and state:** FileEvent; BufferState.stamp
  - **Control flow:** `src/workspace/fs.ts` `atomicWrite`; `src/workspace/watcher.ts` `watchWorkspace`

- **Follow, complete, and rename links**
  - **Decisions:** RM261003ABZP-DES7@R4, RM261003ABZP-DES5@R2
  - **Participants:** `update` → `resolveLink(index, sourcePath, target)` → open buffer + jump; `planRename(index, moves, open)` → `applyEdits` effect
  - **Flow:**

    ```text
    gd on [[plan#Goals]] → resolveLink → {path:"projects/plan.md", heading:"Goals"} → push jumplist → open → cursor at heading
                         → unresolved → prompt "Create projects/plan.md?" → create effect
    rename a.md → b.md → planRename(index, [{from, to}], open scans) → [{path, edits[]}…] → apply to open buffers in memory + applyEdits for closed files (each span checked against its expected text)
                       → fs rename → notify "12 files updated"
    ```

  - **Failure and recovery:** a second rename or move while a link rewrite is in flight is refused with `links still updating — try again when the update finishes` and changes nothing; a closed file whose span no longer matches the expected text is skipped unchanged and reported; a link-rewrite write fails → remaining writes continue; failures are listed in a notification with paths; the rename itself is rolled back only if the file rename failed (links already rewritten are reported, not reverted).
  - **Contracts and state:** NoteIndex; LinkTarget
  - **Control flow:** `src/core/features/links/resolve.ts` `resolveLink`; `src/core/features/links/rename.ts` `planRename`

- **Preview**
  - **Decisions:** RM261003ABZP-DES13@R3
  - **Participants:** `:Preview` (a Markdown-scoped command) → effect `startPreview` → `preview/server` → browser; store change (active Markdown doc or version) → SSE event → page fetches `/render`. Switching to a non-Markdown buffer sends nothing, so the page keeps the last note (RM261003ABZP-DES17@R1 note-only scope)
  - **Flow:**

    ```text
    :Preview → Bun.serve({hostname:"127.0.0.1", port:0}) → open http://127.0.0.1:<port>/
    page → GET /events (SSE) ; edit → debounce 100 ms → event "doc" {path, version, line} ; :PreviewStop/exit → event "stopped" → close
    page → GET /render?path=… → renderHtml(doc) → swap <main>, scroll to the block containing line
    page → GET /assets/<name> → KaTeX and Mermaid builds embedded in the binary
    any request with bad Host → 403 ; /file/<p> → realpath ⊂ workspace & not hidden? → bytes : 404
    ```

  - **Failure and recovery:** port bind fails → notify; browser cannot open → notify the URL; SSE drop → browser auto-reconnects and refetches.
  - **Contracts and state:** Preview HTTP routes
  - **Control flow:** `src/preview/server.ts` `startPreview`

## Contracts, Data, and State

- **Action and Effect protocol — State model**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Purpose:** the only way state changes and the only way side effects start.
  - **Participants:** ui, workspace, preview, timers → `Action` → `update` → `Effect[]` → app effect runner → result `Action`
  - **Meaning:** `Action` is a discriminated union (`key`, `mouse`, `resize`, `fileLoaded`, `fileRefused`, `saved`, `saveFailed`, `fileChanged`, `indexBatch`, `searchResults`, `timer`, …). `Effect` is a discriminated union (`read`, `write`, `create`, `rename`, `move`, `trash`, `startTimer`, `cancelTimer`, `clipboardWrite`, `clipboardRead`, `search`, `startPreview`, `stopPreview`, `openUrl`, `saveState`, `exit`).
  - **Ownership and lifecycle:** core defines both unions; app runs effects; every effect that can fail returns a success or failure action.
  - **Invariants:** `update` is pure and synchronous; no effect runs inside `update`; effects carry all data they need (no callbacks).
  - **State flow:**

    ```text
    Action → update → (State', Effect[]) → runEffect → Action …
    ```

  - **Shape:** `src/core/state/types.ts`

- **AppState — State model**
  - **Decisions:** RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1
  - **Purpose:** single source of truth for everything visible.
  - **Participants:** `update` (owner) → ui/preview (readers)
  - **Meaning:** `workspace` (root, tree), `buffers` (by id: path, `fileType` id, TextBuffer, `analysis` (the file type's analysis state; Markdown: `Doc`), stamp, `bom`, `eol`, dirty, `view` — one of the file type's view ids, e.g. live|source|reading for Markdown, source for code), `windows` (split tree, active, and per-window `content` by editor kind: `{editor:"text", bufferId, cursor, scroll, folds}` where `folds` is the set of folded callout and expanded embed block ids, or `{editor: <registered kind>, state}` whose `state` comes from that kind's `EditorKindSpec.open` — in v1 only `base`, with state `{path, view, cursor}`), `vim` (mode, pending keys, registers, last change, search), `panels` (explorer, side panel kind), `overlay` (none | picker | whichKey | palette | prompt | help | conflict | calendar | completion), `index` (NoteIndex + status), `notifications`, `config`, `jumps`, `preview` (off | starting | on(port)).
  - **Ownership and lifecycle:** created at startup from config + state file; `jumps` and recent notes persisted through `saveState` effects (debounced 2 s and on exit).
  - **Invariants:** one active window; each `text` window references an open buffer; a buffer's `view` is one of its file type's views; a buffer with `dirty=false` matches its last saved stamp. Adding an editor kind (a notebook later) registers an `EditorKindSpec` in core and an editor view in the UI; neither the `AppState` type nor the kernel changes.
  - **State flow:** `None — plain value replaced by update`
  - **Shape:** `src/core/state/types.ts` `AppState`

- **TextBuffer — Data model**
  - **Decisions:** RM261003ABZP-DES3@R1
  - **Purpose:** text storage and edit primitives behind a stable interface.
  - **Participants:** vim engine, rename planner, template insertion → `TextBuffer` → file type `analyze` (Markdown parser), highlighter, text view
  - **Meaning:** lines array, version number, `apply(edit)` returning a new buffer and the inverse edit; positions are `{line, col}` in UTF-16 code units aligned to grapheme boundaries.
  - **Ownership and lifecycle:** owned by a buffer entry; replaced on each edit (structural sharing of untouched lines).
  - **Invariants:** at least one line; line separators normalized to `\n` in memory, original separator (`\n`/`\r\n`), trailing newline, and leading UTF-8 BOM restored on save. UTF-16 positions match the Language Server Protocol's default position encoding, so a future LSP client needs no conversion.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/text/text-buffer.ts`

- **Doc model — Data model**
  - **Decisions:** RM261003ABZP-DES6@R2
  - **Purpose:** parsed Markdown shared by live preview, index summaries, and HTML preview.
  - **Participants:** `parseDoc` (the `markdown` file type's `analyze`) → `Doc` → live-preview provider, `summarize`, `renderHtml`; the index worker calls `scanDoc(text)` for the scan level only
  - **Meaning:** two levels. Scan level: `Doc { version, frontmatter?, blocks: Block[], scan: DocScan }`; `Block { id, kind, startLine, endLine, hash, scan: BlockScan }`, where `BlockScan` holds headings, links, tags, block ids, and excluded ranges (code, math, comments) from one linear pass. mdast level: `blockNode(doc, block, text)` returns the block's mdast, extended with Obsidian nodes (`wikiLink`, `embed`, `tag`, `highlight`, `comment`, `callout`, `blockId`, `footnote*`, `math`), parsed on first request and cached by block hash.
  - **Ownership and lifecycle:** the scan level is recomputed per buffer version, reusing unchanged blocks by hash; mdast is built lazily per block, only for blocks a consumer asks for (live preview on screen, HTML preview).
  - **Invariants:** blocks cover the document without overlap; a fenced code block or frontmatter is never split.
  - **State flow:** `None`
  - **Shape:** `src/core/lang/markdown/doc.ts`

- **RenderLine model — Data model**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Purpose:** UI-independent, language-neutral description of one screen row.
  - **Participants:** `layoutText` → `RenderLine[]` → `EditorView` (widgets → UI widget painters by `type`)
  - **Meaning:** `RenderLine { sourceLine, spans: {text, style: StyleToken, link?}[], widget?: {type: string, data, rows}, sign?: {text, style} }`; widget types in v1 are `image`, `embed`, `base`, `rule`, registered by `lang/markdown` and `features/bases`; `StyleToken` names a theme token (`heading1`, `bold`, `link`, `tag`, `codeKeyword`, …), never a colour.
  - **Ownership and lifecycle:** computed per frame for visible rows only.
  - **Invariants:** cursor column maps back to a source column through `spans` offsets; widget rows are counted in scroll math.
  - **State flow:** `None`
  - **Shape:** `src/core/kernel/view/types.ts`

- **FileType and Decoration model — Data model**
  - **Decisions:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Purpose:** the only way language-specific behaviour reaches the kernel.
  - **Participants:** `lang/*`, `features/bases` → `FileTypeRegistry.register` (wired in `app/main`) → `update` (`forPath` on open; `analyze` per version) → `layoutText(view, providers, analysis)`
  - **Meaning:** `FileType { id, match: {extensions, names}, editor: EditorKind (an open string: "text" and "base" in v1, more by registration), views: [{id, readOnly?, decorations: DecorationProvider[], input?}], highlighter?, analyze? }`. `Decoration` = `mark` (style a range) | `replace` (hide or substitute a range, inline or whole lines, optionally with spans or a widget) | `widget` (insert rows or inline content at a position) | `line` (line style or sign). The kernel's `highlightMarks` turns `Highlighter` output into `mark` decorations; `Highlighter` and `Span` are kernel types, so the kernel never imports `filetypes`. A view's optional `input(analysis, ctx)` hook builds the per-frame provider input from a context type the language declares and `core/state` builds (Markdown: `MarkdownViewInput`), so the UI never branches on a file type. This is the decoration model of CodeMirror 6 (Obsidian's editor), Neovim extmarks, and VS Code decorations.
  - **Ownership and lifecycle:** file types are registered at startup and never change at runtime; providers run per frame on visible lines only.
  - **Invariants:** `text` is the fallback for any unmatched path; every `text` editor file type has a `source` view; decorations never change buffer text; providers are pure.
  - **State flow:** `None`
  - **Shape:** `src/core/filetypes/types.ts`, `src/core/kernel/view/decorations.ts`

- **NoteSummary and NoteIndex — Data model**
  - **Decisions:** RM261003ABZP-DES7@R4
  - **Purpose:** workspace-wide link, tag, heading, and block knowledge, plus the workspace file list.
  - **Participants:** worker `scanDoc` → `summarize` → `NoteSummary` → main `NoteIndex.apply`
  - **Meaning:** `NoteSummary { path, mtime, title, aliases, tags, headings[{text, level, line}], blocks[{id, line}], links[{target, subpath?, alias?, line, col, kind:"wiki"|"md"|"embed", raw, range, context?}], frontmatter }`; `raw` and `range` let rename plan edits without reading the file, and `context` is the trimmed source line (≤ 160 characters) shown as a closed note's backlink context. `NoteIndex` holds summaries by path plus derived maps: basename → paths, alias → paths, tag → paths, target path → backlinks; and `files` — every non-excluded workspace path — for the file picker.
  - **Ownership and lifecycle:** built at startup by the worker; updated per file event and per buffer save; never persisted.
  - **Invariants:** derived maps are rebuilt only for changed paths; only Markdown files are summarized; resolution order is fixed (RM261003ABZP-DES7@R4).
  - **State flow:** `empty → indexing(n/total) → ready → (fileEvent) ready`
  - **Shape:** `src/core/features/links/note-index.ts`

- **Preview HTTP routes — API**
  - **Decisions:** RM261003ABZP-DES13@R3
  - **Purpose:** read-only browser preview.
  - **Participants:** browser → `preview/server` → core `renderHtml`
  - **Meaning:** `GET /` page shell; `GET /events` SSE (`doc` events with `{path, version, line}`, where `line` is the cursor line; a `stopped` event sent before `:PreviewStop` or exit closes the server); `GET /render?path=` HTML fragment; `GET /file/<path>` workspace asset bytes; `GET /assets/<name>` the page script and stylesheet and the KaTeX and Mermaid builds embedded in the binary.
  - **Ownership and lifecycle:** exists only between `:Preview` and `:PreviewStop` or exit.
  - **Invariants:** hostname `127.0.0.1`; Host header ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403; realpath containment else 404; no mutating routes; every response carries a Content Security Policy that allows code, styles, fonts and connections only from the server's own origin, and images also from the web, plus `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`.
  - **State flow:** `off → starting → on(port) → off`
  - **Shape:** `src/preview/server.ts`

- **AppConfig — Data model**
  - **Decisions:** RM261003ABZP-DES14@R2, RM261003ABZP-DES5@R2
  - **Purpose:** user options and keymap overrides.
  - **Participants:** `config-file.loadConfig` → `parseConfig` (`toml-eslint-parser` AST → `ConfigSchema` (zod), errors carry the TOML line) → `AppState.config`
  - **Meaning:** `leader`, `escTimeoutMs` (50; effective `max(escTimeoutMs, 20)` because OpenTUI resolves a legacy lone Esc at 20 ms), `autosave` (`{ enabled: true, delayMs: 1000 }`), `editor` (`tabWidth` 1–16, default 8; `wrap`, default `true`; `relativeNumbers`, default `true`), `preview` (`mode: "live"`, `embedMaxRows`, `images: "auto"|"blocks"|"off"`), `daily` (`folder`, `format`, `template`), `templates.folder`, `theme`, `color` (overrides `NO_COLOR`), `keys.<mode>` (`"<key-seq>" = "<command-id>"`, global), `filetypes.<id>.keys.<mode>` (same form, one file type).
  - **Ownership and lifecycle:** read at startup and on `:ConfigReload`.
  - **Invariants:** unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
  - **State flow:** `None`
  - **Shape:** `src/core/config/schema.ts`

## Detailed Code Design

- **`src/core/state/update.ts`**
  - **Decisions:** RM261003ABZP-DES2@R2
  - **Change:** Add
  - **Responsibilities:** reducer entry; routes actions to feature reducers.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };

    export const update: Update = (state, action) => {
      switch (action.type) {
        case "key":        return handleKeyAction(state, action.key);   // keymap {mode, filetype} → command, else vim edit
        case "fileChanged":return handleFileChanged(state, action);     // reload | conflict | ignore
        case "indexBatch": return { state: withIndex(state, action.summaries), effects: [] };
        // … one case per Action variant; feature logic lives in feature modules
      }
    };

    export function createStore(initial: AppState, run: (e: Effect) => void) {
      let state = initial; const subs = new Set<(s: AppState) => void>();
      return {
        get: () => state,
        dispatch(action: Action) { const r = update(state, action); state = r.state; r.effects.forEach(run); subs.forEach((f) => f(state)); },
        subscribe(f: (s: AppState) => void) { subs.add(f); return () => subs.delete(f); },
      };
    }
    ```

    `update` routes; `createStore` is the only mutable cell. The switch dispatches on a closed Action union (core protocol, not an extension point); commands extend through the registry instead.

  - **Dependencies:** Action and Effect protocol; CommandRegistry
  - **Callers and wiring:** `app/main.ts` creates the store with `runEffect`; ui and preview subscribe.
  - **Invariants:** pure; no `Date.now()` — time arrives in actions.
  - **Verification:** RM261003ABZP-S11@R1, RM261003ABZP-V15@R2

- **`src/core/kernel/commands/registry.ts`**
  - **Decisions:** RM261003ABZP-DES5@R2
  - **Change:** Add
  - **Responsibilities:** named commands, file-type-scoped keymap trie, which-key and palette data, config overrides.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export type Command<Ctx = unknown, R = unknown> = {   // generic: the kernel never imports core/state
      id: string;                       // "file.find", "note.today", "link.follow"
      title: string;                    // shown in palette and which-key
      group?: string;                   // which-key group: "find", "note", "buffer"
      filetypes?: readonly string[];    // omitted = every file type; ["markdown"] for link.follow, view.cycle, task.toggle
      run: (ctx: Ctx, args?: string) => R;   // core/state instantiates Ctx = CommandContext, R = { state: AppState; effects: Effect[] }
    };
    export type Mode = "normal" | "insert" | "visual" | "cmdline" | (string & {});   // "explorer", "picker", "base" are declared by their owners
    export type KeyScope = { mode: Mode; filetype?: string };   // filetype omitted = global

    export class CommandRegistry<Ctx, R> { register(cmd: Command<Ctx, R>): void; get(id: string): Command<Ctx, R> | undefined; list(filetype?: string): Command<Ctx, R>[] }

    export class Keymap {
      bind(scope: KeyScope, seq: string, commandId: string): void;   // "<leader>ff", "gd", "<C-o>"
      lookup(scope: KeyScope, pending: Key[]): { kind: "command"; id: string } | { kind: "prefix"; next: WhichKeyItem[] } | { kind: "none" };
      // lookup checks {mode, filetype} first, then {mode}; which-key merges both levels
    }
    ```

    Features call `registry.register` and `keymap.bind` at startup from their own module (`src/core/features/notes/commands.ts`, …); `lang/markdown` binds `gd`, `Enter`, `<leader>m`, `<leader>x` with `filetype: "markdown"`. Which-key reads `lookup(...).next`; the palette reads `list(activeFiletype)`. Config `keys.<mode>` rebinds globally and `filetypes.<id>.keys.<mode>` per file type, both by command id. This mirrors Neovim's buffer-local keymaps set from ftplugins, so `gd` stays free for go-to-definition in code files later.

  - **Dependencies:** None inside the kernel (generic over context and result); `core/state` defines `AppCommand = Command<CommandContext, { state: AppState; effects: Effect[] }>`
  - **Callers and wiring:** `core/state` default registration registers built-ins; `app/main.ts` applies config overrides.
  - **Invariants:** duplicate ids throw at startup; binding an unknown id or file type is a config error, not a crash; running a command whose `filetypes` exclude the active buffer's file type is a no-op with the notice `not available for <type> files`.
  - **Verification:** RM261003ABZP-S3@R1, RM261003ABZP-V4@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/kernel/text/text-buffer.ts` and `src/core/kernel/vim/engine.ts`**
  - **Decisions:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1
  - **Change:** Add (vim engine redesigned from `alfred/apps/tui/src/view/editor/vim.ts`)
  - **Responsibilities:** buffer primitives; vim grammar `[count]["x][count]operator[count](motion|textobject)`.
  - **Current source:** `alfred/apps/tui/src/view/editor/vim.ts:15-40` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    export type VimMode = "normal" | "insert";
    export type VimEffect = "changed" | "insert-exited" | "toggle-mode" | "leave";
    export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
    ```

    Alfred's engine is pure with effects but supports two modes and a hard-coded pending set.

  - **Proposed shape:**

    ```ts
    export interface TextBuffer {
      readonly version: number; readonly lineCount: number;
      line(i: number): string;
      apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };     // Edit = { range, text }
      slice(range: Range): string;
    }

    export type Motion = (buf: TextBuffer, at: Pos, count: number, ctx: MotionCtx) => { to: Pos; linewise: boolean; inclusive: boolean } | null;
    export type TextObject = (buf: TextBuffer, at: Pos, count: number) => Range | null;
    export const motions: Record<string, Motion>;       // "w","b","e","gg","G","f",… registered by key
    export const textObjects: Record<string, TextObject>; // "iw","a(","ip",…

    export function handleKey(s: BufferVim, key: Key, env: VimEnv): { s: BufferVim; effects: VimEffect[] };
    // VimEffect: { kind:"yank", register, text } | { kind:"changed" } | { kind:"modeChanged", mode } | { kind:"ex", line } | { kind:"search", pattern, dir }
    ```

    The parser accumulates keys into a pending command; when complete it resolves the motion or text object by table lookup, applies the operator, and records an undo block and last-change for `.`. Insert mode collects edits into one undo block until `Esc`.

  - **Dependencies:** TextBuffer; registers in AppState
  - **Callers and wiring:** `update` → `handleKeyAction` → `handleKey` when no keymap binding matches in normal/visual/insert mode.
  - **Invariants:** an operator with a failed motion is a no-op; counts multiply (`2d3w` = `d6w`); undo restores cursor.
  - **Verification:** RM261003ABZP-S2@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1

- **`src/core/lang/markdown/doc.ts`**
  - **Decisions:** RM261003ABZP-DES6@R2
  - **Change:** Add (ported from `alfred/apps/tui/src/view/markdown/parse.ts` and `alfred/packages/view-model/src/markdown/obsidian-syntax.ts`)
  - **Responsibilities:** split into blocks, scan each block linearly for links, tags, headings, and block ids, parse a block to mdast with micromark + GFM + math + Obsidian extensions only when asked, reuse unchanged blocks.
  - **Current source:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` (imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math`)
  - **Current shape:**

    ```ts
    // Alfred parses the whole document per render and post-processes Obsidian syntax with regexes from obsidian-syntax.ts
    export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    ```

    Whole-document parse; Obsidian syntax by regex over text nodes.

  - **Proposed shape:**

    ```ts
    export type Block = { id: number; kind: BlockKind; startLine: number; endLine: number; hash: string; scan: BlockScan };
    export type Doc = { version: number; frontmatter?: Frontmatter; blocks: Block[]; scan: DocScan };

    export function splitBlocks(buf: TextBuffer): { startLine: number; endLine: number }[]; // blank-line bounded; fences, frontmatter, $$ kept whole; lists kept whole
    export function parseDoc(buf: TextBuffer, prev?: Doc): Doc;   // rescan only ranges whose hash changed
    export function scanDoc(text: string): DocScan;               // scan level only; used by the index worker
    export function blockNode(doc: Doc, block: Block, text: (from: number, to: number) => string): MdNode; // lazy mdast, cached by hash
    export const syntaxExtensions: SyntaxExtension[];             // wikiLink, embed, tag, highlight, comment, callout, blockId — one definition for both levels
    ```

    Block-level reparse keeps per-keystroke work proportional to the edited block (`RM261003ABZP-RF7`). Whole-document facts (links, tags, headings, block ids, frontmatter) come from the linear scan level, and mdast is built lazily per block: parsing every note to mdast took 11.8 s for 10,000 notes and about 350 ms for the `openFile` fixture, missing RM261003ABZP-V13@R1 and the open budget. Each Obsidian syntax is defined once in `syntaxExtensions` for both levels, and a conformance test checks that the levels agree.

  - **Dependencies:** `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`
  - **Callers and wiring:** registered as the `markdown` file type's `analyze`; `update` runs it after edits; the worker runs `scanDoc` before `summarize`; live preview and `renderHtml` call `blockNode`.
  - **Invariants:** `parseDoc(buf, prev)` equals `parseDoc(buf)` structurally (cache is transparent).
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2

- **`src/core/kernel/view/text-view.ts` and `src/core/lang/markdown/live-preview.ts`**
  - **Decisions:** RM261003ABZP-DES9@R3
  - **Change:** Add (live preview adapted from `alfred/apps/tui/src/view/markdown/layout.ts` and `alfred/apps/tui/src/view/editor/reveal-units.ts`)
  - **Responsibilities:** language-neutral visible-row layout from decorations (kernel); Markdown live preview as a decoration provider with reveal rules and block renderers (lang).
  - **Current source:** `alfred/apps/tui/src/view/editor/reveal-units.ts` (Alfred, porting reference)
  - **Current shape:**

    ```ts
    None — Alfred lays out whole documents for Ink rendering
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    // src/core/kernel/view — knows nothing about Markdown
    export type TextView = { buf: TextBuffer; width: number; topRow: number; rows: number; cursor: Pos; selection?: Range; folds: ReadonlySet<number>; visible: LineRange };
    export type Widget = { type: string; data: unknown; rows: number };            // painted by a UI widget painter
    export type Decoration =
      | { kind: "mark"; range: Range; style: StyleToken }                          // syntax colour, bold, search match
      | { kind: "replace"; range: Range; block: boolean; spans?: Span[]; widget?: Widget } // hidden `**`, rendered table rows
      | { kind: "widget"; at: Pos; block: boolean; widget: Widget }                // image, embed, base view
      | { kind: "line"; line: number; style?: StyleToken; sign?: Sign };           // ▕ reveal sign, ⚠ render error
    export type DecorationProvider<S = unknown> = (v: TextView, analysis: S) => Decoration[]; // visible lines only
    export function layoutText(v: TextView, providers: readonly DecorationProvider[], analysis: unknown): RenderLine[];
    export type TextViewInput = { view: TextView; providers: readonly DecorationProvider[]; analysis: unknown };  // what a text editor view paints
    export interface Highlighter { language: string; highlight(buf: TextBuffer, lines: LineRange): Span[][] }      // kernel-owned; lang/code implements it
    export function highlightMarks(h: Highlighter | undefined): DecorationProvider;                               // Span[][] → mark decorations

    // src/core/lang/markdown/live-preview.ts — one provider among many
    export type PreviewCtx = { isResolved(target: string): boolean; embed(path: string): { doc: Doc } | "loading" | "missing";
                               image(ref: string): { rows: number } | "unknown"; embedMaxRows: number; images: "auto" | "blocks" | "off" };
    export type MarkdownViewInput = { doc: Doc; view: "live" | "reading"; ctx: PreviewCtx };   // built by the Markdown views' `input` hook
    export const livePreview: DecorationProvider<MarkdownViewInput>;   // views "live" and "reading" (reading: no reveal)
    export type BlockRenderer = (block: Block, v: TextView, input: MarkdownViewInput) => Decoration[];
    export const blockRenderers: Partial<Record<BlockKind, BlockRenderer>>;   // heading, list, table, callout, code, embed, base, math, mermaid …
    ```

    Reveal is the provider's rule, not the kernel's: on the cursor's line it emits no inline `replace` decorations; when the cursor is inside a multi-line block (table, callout, code, math, frontmatter) it emits none for that block, so the source shows. `source` view uses only the highlighter's `mark` decorations; a code file gets exactly that path. Rows outside the viewport are never laid out; a per-block row-height cache gives scroll positions.

  - **Dependencies:** Doc model; FileType and Decoration model; theme tokens; `lang/code` highlighter for fenced code; ported math and mermaid text renderers
  - **Callers and wiring:** `ui/editors/text-view.ts` per frame with the active view's providers from the buffer's file type.
  - **Invariants:** `layoutText` with no providers returns raw lines; the source view of Markdown and any code file use the same path; reading view never reveals.
  - **Verification:** RM261003ABZP-S5@R1, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/filetypes/registry.ts` and `src/core/lang/code/highlight.ts`**
  - **Decisions:** RM261003ABZP-DES17@R1
  - **Change:** Add (highlighter adapted from `alfred/apps/tui/src/view/markdown/code-highlight.ts`)
  - **Responsibilities:** file-type contract and lookup; the lowlight-backed highlighter.
  - **Current source:** `alfred/apps/tui/src/view/markdown/code-highlight.ts` (96 lines, `lowlight`; porting reference)
  - **Current shape:**

    ```ts
    None — Alfred highlights fenced code only
    ```

    Reference only.

  - **Proposed shape:**

    ```ts
    export type EditorKind = string;                                // "text" and "base" in v1; a notebook registers "notebook" later
    export type ViewSpec<S, I = S, C = unknown> = { id: string; readOnly?: boolean; decorations: readonly DecorationProvider<I>[];
                                       input?: (analysis: S, ctx: C) => I };   // per-frame provider input; default: analysis
    // C is declared by the language (Markdown: PreviewCtx); core/state/view-context.ts builds it from AppState
    // through a builder registered per file type id, so filetypes/ and lang/ never import core/state.
    export type EditorKindSpec<St = unknown> = { id: EditorKind; open(path: string, text: string): St };
    export class EditorKindRegistry { register(spec: EditorKindSpec<any>): void; get(id: EditorKind): EditorKindSpec | undefined }
    // "text" is built in (core/state creates the buffer); "base" is registered by features/bases; a notebook registers later.
    export type FileType<S = unknown> = {
      id: string;                                                   // "markdown", "base", "typescript", "text"
      match: { extensions?: readonly string[]; names?: readonly string[] };   // [".md"], ["Makefile"]
      editor: EditorKind;
      views: readonly ViewSpec<S>[];                                // first = default
      highlighter?: Highlighter;
      analyze?: (buf: TextBuffer, prev?: S) => S;                   // Markdown: parseDoc with block cache
    };
    // `Highlighter` is the kernel type from `src/core/kernel/view/types.ts`

    export class FileTypeRegistry {
      register(ft: FileType<any>): void;                            // duplicate id or extension throws at startup
      forPath(path: string): FileType;                              // extension → file name → `text`
      get(id: string): FileType | undefined;
    }

    // src/core/lang/code/highlight.ts
    export function lowlightHighlighter(language: string): Highlighter;   // highlights from up to 200 lines above
                                                                           // the requested range; cached per buffer version
    ```

    `app/main` registers `text`, `markdown` (`lang/markdown`), `base` (`features/bases`), and code file types (`lang/code`). Tree-sitter can replace lowlight behind `Highlighter` later without changing callers.

  - **Dependencies:** `lowlight`; TextBuffer
  - **Callers and wiring:** `update` (`forPath` on `fileLoaded`; `analyze` after edits); the kernel's `highlightMarks` (`Highlighter` → `mark` decorations); `lang/markdown` fenced code blocks.
  - **Invariants:** registry lookup is deterministic and pure; highlighting is viewport-bounded and never runs the whole file per keystroke; a highlighter error drops to plain text for that range.
  - **Verification:** RM261003ABZP-S12@R1, RM261003ABZP-V18@R1; RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V16@R2

- **`src/core/features/links/resolve.ts` and `src/core/features/links/rename.ts`**
  - **Decisions:** RM261003ABZP-DES7@R4
  - **Change:** Add
  - **Responsibilities:** deterministic link resolution; format-preserving rename planning.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function resolveLink(ix: NoteIndex, from: string, raw: string): LinkTarget | { unresolved: string };
    // order: exact root path (with/without .md) → alias → basename candidates ranked by
    //        (same folder as `from`) → (shortest path) → (alphabetical)
    export type PathMove = { from: string; to: string };
    export type FileEdit = { path: string; edits: { range: Range; expected: string; text: string }[] };
    export function planRename(ix: NoteIndex, moves: readonly PathMove[], open: ReadonlyMap<string, DocScan>): FileEdit[];
    // keeps link kind (wiki/md), alias, #heading / #^block; writes the shortest unique form of `to`;
    // link spans come from open buffers' scans and from summaries (`raw`, `range`), so planning reads no file
    ```

  - **Dependencies:** NoteIndex
  - **Callers and wiring:** `link.follow`, completion, backlinks, `file.rename`, `file.move` commands.
  - **Invariants:** resolution is a pure function of index contents; rename never touches text outside link spans.
  - **Verification:** RM261003ABZP-S4@R1, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2

- **`src/workspace/fs.ts` and `src/workspace/watcher.ts`**
  - **Decisions:** RM261003ABZP-DES8@R2, RM261003ABZP-DES17@R1
  - **Change:** Add
  - **Responsibilities:** text reads with binary and size checks; atomic writes and directory watching with own-write suppression.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export async function readTextFile(path: string): Promise<TextFile | { refused: "binary" | "tooLarge" }> {
      const file = Bun.file(path);
      if (file.size > 16 * 1024 * 1024) return { refused: "tooLarge" };
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.subarray(0, 8192).includes(0)) return { refused: "binary" };
      let text: string;
      try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); } catch { return { refused: "binary" }; }
      const bom = text.startsWith("\uFEFF");
      return { text: bom ? text.slice(1) : text, bom, eol: text.includes("\r\n") ? "\r\n" : "\n", stamp: stampOf(path, text) };
    }
    export async function atomicWrite(path: string, text: string): Promise<Stamp> {   // text already has BOM + EOL restored
      const target = await realpathOrSelf(path);
      const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
      const fd = await open(tmp, "w", await modeOr(target, 0o644));
      try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp, target);                     // same directory → atomic on POSIX
      return stampOf(target, text);                  // { mtimeMs, size, hash }
    }
    export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
    // fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
    ```

  - **Dependencies:** `node:fs/promises`, `node:fs` (Bun-compatible)
  - **Callers and wiring:** effect runner for `read`, `write`, `create`, `rename`, `move`; `main` starts the watcher.
  - **Invariants:** temp files never appear in the index (prefix `.` is hidden); a failed write deletes its temp file.
  - **Verification:** RM261003ABZP-S1@R1, RM261003ABZP-V1@R1; RM261003ABZP-S12@R1, RM261003ABZP-V18@R1

- **`src/ui/editors/text-view.ts`, `src/ui/widgets/registry.ts`, and `src/ui/input.ts`**
  - **Decisions:** RM261003ABZP-DES10@R2, RM261003ABZP-DES9@R3
  - **Change:** Add
  - **Responsibilities:** paint RenderLine rows onto an OpenTUI buffer; paint widgets through painters keyed by widget type; pick the view for a window's editor kind; normalize input.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    // Only file family allowed to import @opentui/*
    export class EditorView extends Renderable {           // custom renderable, not Textarea
      constructor(ctx: RenderContext, private getView: () => TextViewInput) { super(ctx, { flexGrow: 1 }); }
      protected renderSelf(buf: OptimizedBuffer) {
        const { view, providers, analysis } = this.getView();
        for (const [row, line] of layoutText(view, providers, analysis).entries()) paintLine(buf, row, line, theme, widgetPainters);
      }
    }
    export const editorViews = new Map<EditorKind, (ctx: RenderContext, win: WindowId) => Renderable>();  // registered: text → EditorView, base → BaseView
    export function registerEditorView(kind: EditorKind, view: (ctx: RenderContext, win: WindowId) => Renderable): void;
    export const widgetPainters: Record<string, WidgetPainter>;                                        // image, embed, base, rule
    export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via max(escTimeoutMs, 20)
    ```

    Exact OpenTUI buffer and image APIs are confirmed against the pinned version in the first delivery item (the class above is illustrative).

  - **Dependencies:** `@opentui/core` (exact pin)
  - **Callers and wiring:** `ui/shell.ts` composes views; store subscription triggers `requestRender()`.
  - **Invariants:** UI never mutates AppState; all input becomes Actions.
  - **Verification:** RM261003ABZP-S9@R1, RM261003ABZP-V12@R2; RM261003ABZP-S11@R1, RM261003ABZP-V17@R1

- **`src/preview/server.ts`**
  - **Decisions:** RM261003ABZP-DES13@R3
  - **Change:** Add
  - **Responsibilities:** read-only preview server.
  - **Current source:** None — new surface
  - **Current shape:**

    ```ts
    None
    ```

    None — greenfield.

  - **Proposed shape:**

    ```ts
    export function startPreview(store: Store, root: string): { port: number; stop(): void } {
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0,
        fetch(req) {
          const host = req.headers.get("host");
          if (host !== `127.0.0.1:${server.port}` && host !== `localhost:${server.port}`) return new Response(null, { status: 403 });
          return route(req, store, root);              // "/", "/events", "/render", "/file/*", "/assets/*"
        },
      });
      return { port: server.port, stop: () => server.stop(true) };
    }
    ```

  - **Dependencies:** `Bun.serve`; core `renderHtml`
  - **Callers and wiring:** effect runner for `startPreview`/`stopPreview`.
  - **Invariants:** no write routes; `/file/*` passes realpath containment and hidden-folder exclusion.
  - **Verification:** RM261003ABZP-S8@R1, RM261003ABZP-V11@R3

## Cross-cutting and Evolution

| Concern | Mechanism and canonical design location | Verification or reason not applicable |
|---|---|---|
| Security and privacy | The only outbound network use is fetching web (`http:`/`https:`) images referenced by notes the user views, in the terminal (`src/workspace/images.ts`: 10 s timeout, 16 MiB cap, no cookies, no Referer, disabled by `preview.images = "off"`, kept only in the in-memory image cache) and in the browser preview, whose Content Security Policy allows `http:` and `https:` images; everything else is loopback-only: the preview binds 127.0.0.1 with a Host allowlist, realpath containment, and a same-origin Content Security Policy for code, styles, fonts and connections (RM261003ABZP-DES13@R3); config is data (TOML), never executed (RM261003ABZP-DES14@R2); no telemetry; notes never logged | RM261003ABZP-V11@R3 |
| Configuration and observability | XDG TOML config validated by schema; errors as notifications; `so --version`; `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content (RM261003ABZP-DES14@R2) | RM261003ABZP-V4@R2 |
| Performance and scalability | Viewport-only layout, block parse cache, worker index and search, frame coalescing, lazy image decode with cache (RM261003ABZP-DES16@R1) | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| Concurrency, retry, and idempotency | Single-threaded store; worker communicates by messages; saves serialized per path; autosave retry with backoff; own-write stamps make watcher events idempotent (RM261003ABZP-DES8@R2) | RM261003ABZP-V1@R1 |
| Migration and backfill | None — greenfield; Obsidian files are read as-is and written in place | None — no prior data format |
| Mixed-version compatibility | Obsidian file compatibility (Markdown, links, frontmatter, `.base`); Kanban `type` constant isolated in `core/features/bases/types.ts` and verified against an Obsidian-saved file (RM261003ABZP-DES12@R2) | RM261003ABZP-V10@R1 |
| Rollout and rollback | SemVer releases only when the user asks, from a pushed `v*` tag; users roll back by installing a previous release binary (RM261003ABZP-DES15@R4) | RM261003ABZP-V14@R2 |
| Known extension needs | Registries: commands and file-type-scoped keymaps (DES5), syntax extensions (DES6), block renderers and decoration providers (DES9), editor-kind views and widget painters (DES10), Bases view types (DES12), file types and highlighters (DES17) — RM261003ABZP-REQ11@R3 | RM261003ABZP-V16@R2 |
| Evolution toward code editing and notebooks | Kernel boundary (DES1) keeps editing language-neutral; future work adds registrations only: an LSP client is a workspace adapter whose results become `mark`/`line` decorations and file-type commands (`gd` → definition); tree-sitter replaces lowlight behind `Highlighter`; a notebook is a new editor kind whose cells each hold a `TextBuffer`. None of these is built in v1 (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3 deferrals) | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V18@R1 |

- **System transition:**

```text
empty repo → scaffold (tooling, CI, boundary test, shell) → editor usable → knowledge features → release binaries (on request)
                                  └→ rollback: previous release binary; files are plain Markdown, no state migration
```

- **Delivery constraints:** the boundary test and CI exist before feature code so violations never land; the OpenTUI paint and image APIs are confirmed against the pinned version before live-preview work depends on them; the Kanban `type` value is confirmed before Kanban ships.

## Success and Verification

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** This document
  - **Outcome:** across crash, external edit, and save failure scenarios, the file on disk is always a complete old or new version and dirty buffers are never overwritten without a prompt.
  - **Requirements:** RM261003ABZP-REQ1@R3
  - **Design:** RM261003ABZP-DES8@R2 - atomic write, own-write suppression, conflict rules
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S1@R1
      - **Scenario:** in a temp workspace: (a) kill the writer between write and rename (simulated by throwing after fsync); (b) modify an open clean file externally; (c) modify an open dirty file externally; (d) save `so`'s own buffer.
      - **Expected result:** (a) original content intact, no temp file left; (b) buffer reloads and `u` restores previous text; (c) conflict prompt appears, file and buffer unchanged until chosen; (d) no reload or conflict triggered.
      - **Method and target:** integration test on `workspace/fs.ts`, `workspace/watcher.ts`, and `core` conflict reducer
      - **Environment:** real file system (tmpdir), real `fs.watch`
      - **Unique risk:** per-file watch losing events after rename; self-triggered reload loops; partial writes.
      - **Predecessors:** None

- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** This document
  - **Outcome:** every command listed in RM261003ABZP-REQ2@R2 produces Neovim's result on the shared fixture cases.
  - **Requirements:** RM261003ABZP-REQ2@R2
  - **Design:** RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 - grammar, undo blocks, dot-repeat
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** table of `{ before text + cursor, keys, after text + cursor + register }` cases covering each motion, operator, text object, count, register, search, `:s`, undo/redo, and `.`; expected values recorded from Neovim 0.11 `--clean`.
      - **Expected result:** each case matches exactly.
      - **Method and target:** unit tests on `core/kernel/vim/engine.ts` `handleKey`
      - **Environment:** None — pure functions
      - **Unique risk:** subtle divergence (inclusive/exclusive motions, linewise yanks, cursor after undo).
      - **Predecessors:** None
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S2@R1
      - **Scenario:** feed a lone `\x1b` byte without kitty protocol, then `\x1b[A`, through `ui/input.normalizeKey` with `escTimeoutMs=50`.
      - **Expected result:** lone Esc yields `escape` after 50 ms ± 10 ms; the sequence yields `up` immediately.
      - **Method and target:** unit test on `ui/input.ts`
      - **Environment:** fake timers
      - **Unique risk:** Esc swallowed or arrow keys misread as Esc + letters.
      - **Predecessors:** None

- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** This document
  - **Outcome:** every command is reachable by name in the palette, leader sequences show which-key hints, pickers filter fuzzily, and config overrides apply or fail safely.
  - **Requirements:** RM261003ABZP-REQ3@R4
  - **Design:** RM261003ABZP-DES5@R2, RM261003ABZP-DES14@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V4@R2 — Keymap, which-key, palette, file-type scope, and config**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S3@R1
      - **Scenario:** (a) press `Space` and wait; (b) bind `"<leader>w" = "file.save"` in config and press it; (c) load a config with a syntax error on line 7; (d) set `XDG_CONFIG_HOME=relative/path`; (e) open the palette and type `back`; (f) bind `[filetypes.markdown.keys.normal] "<leader>w" = "link.backlinks"` alongside (b), press `<leader>w` in a note and in `sync.ts`; (g) press `gd` on `[[plan]]` in a note and on an identifier in `sync.ts`; (h) open the palette in `sync.ts` and type `follow`; (i) in `sync.ts`, run `:link.follow`.
      - **Expected result:** (a) which-key lists groups; (b) file saved; (c) notification names `config.toml:7` and defaults apply; (d) `~/.config/so/config.toml` used; (e) `link.backlinks` ranks first; (f) the note opens its backlinks, `sync.ts` saves; (g) the note follows the link, `sync.ts` does nothing; (h) `link.follow` is not listed; (i) the message line shows `not available for typescript files` and nothing changes.
      - **Method and target:** unit tests on `core/kernel/commands`, `workspace/config-file.ts`; component test through the OpenTUI test renderer for (a)
      - **Environment:** tmp config dirs; OpenTUI test renderer
      - **Unique risk:** config error crashing startup; overrides silently ignored; note keys leaking into other file types.
      - **Predecessors:** RM261003ABZP-V4@R1

- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** This document
  - **Outcome:** link following, completion, backlinks, and tags match the index; rename updates every reference while preserving format.
  - **Requirements:** RM261003ABZP-REQ4@R3
  - **Design:** RM261003ABZP-DES7@R4
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** workspace with `a/plan.md`, `b/plan.md`, `plan-x.md` (alias `plan`), `c/deep/plan.md`; resolve `[[plan]]` from `a/x.md`, from `root.md`, `[[b/plan]]`, `[[plan.md]]`, `[[note#H1#H2]]`, `[text](a/plan%20x.md)`.
      - **Expected result:** results follow the documented order exactly.
      - **Method and target:** unit tests on `core/features/links/resolve.ts`
      - **Environment:** None — in-memory index
      - **Unique risk:** nondeterministic or Obsidian-incompatible targets.
      - **Predecessors:** None
    - **RM261003ABZP-V6@R2 — Rename and link-mention preserve link formats**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S4@R1
      - **Scenario:** (a) rename `plan.md` → `projects/roadmap.md` with references `[[plan]]`, `[[plan|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)`, frontmatter `related: "[[plan]]"`, and an open dirty buffer containing `[[plan]]`; (b) run `link.linkMention` on an unlinked mention "Plan" of `plan.md` in an open dirty buffer and in a closed file.
      - **Expected result:** (a) all rewritten in place with kind, alias, subpath preserved and shortest unique path; the dirty buffer is edited in memory (not overwritten on disk); notification reports the file count. (b) only the mention span becomes `[[plan|Plan]]` (or `[[plan]]` when the text equals the basename); the open buffer is edited in memory and marked dirty; the closed file is written through the atomic write path; the mention moves from unlinked to linked in the backlinks result.
      - **Method and target:** unit tests on `planRename` and the mention span edit + integration test of the rename and `link.linkMention` commands
      - **Environment:** tmp workspace
      - **Unique risk:** broken links or clobbered unsaved edits.
      - **Predecessors:** RM261003ABZP-V6@R1

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** This document
  - **Outcome:** each element listed in RM261003ABZP-REQ5@R2 renders as specified, reveal follows the cursor line or block, and images use the best available protocol.
  - **Requirements:** RM261003ABZP-REQ5@R2
  - **Design:** RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V7@R2 — Layout golden tests**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** `test/fixtures/tour.md` (every element) laid out by `layoutText` with the Markdown `livePreview` provider at widths 60 and 100 with the cursor outside any block, on a bold line, inside a table, inside a callout; the same note in `source` view.
      - **Expected result:** `RenderLine[]` serialized to text + style tokens matches committed goldens.
      - **Method and target:** unit tests on `layoutText` + `lang/markdown/live-preview.ts`
      - **Environment:** None — pure
      - **Unique risk:** reveal or hiding regressions; broken table alignment; Markdown logic leaking into the kernel view.
      - **Predecessors:** RM261003ABZP-V7@R1
    - **RM261003ABZP-V8@R1 — Image protocol selection**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S5@R1
      - **Scenario:** render a note with a PNG in the OpenTUI test renderer with capabilities kitty / sixel / none / `images="off"`.
      - **Expected result:** kitty or sixel placement, block characters, or `[image: name.png]` placeholder respectively.
      - **Method and target:** component test on `ui/editors/text-view.ts` and the `image` widget painter
      - **Environment:** OpenTUI test renderer with mocked capabilities
      - **Unique risk:** images breaking layout or crashing on unsupported terminals.
      - **Predecessors:** None

- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** This document
  - **Outcome:** `:Today` and template insertion produce the same text Obsidian's core plugins would for the supported tokens.
  - **Requirements:** RM261003ABZP-REQ6@R2
  - **Design:** RM261003ABZP-DES11@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S6@R1
      - **Scenario:** format 2026-10-03T09:05 with every supported token and `[literal]`; expand a template containing all variables; compute daily paths for `YYYY-MM-DD` and `YYYY/MM/YYYY-MM-DD`; run `:Today` twice.
      - **Expected result:** strings equal Moment.js output for the same tokens; unsupported tokens stay literal; second `:Today` opens the existing file without changing it.
      - **Method and target:** unit tests on `core/time`, `core/features/notes`; integration test for `:Today`
      - **Environment:** fixed clock; tmp workspace
      - **Unique risk:** wrong dates, overwritten daily notes.
      - **Predecessors:** None

- **RM261003ABZP-S7@R1 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** This document
  - **Outcome:** table and Kanban views show the correct rows, edits write valid frontmatter, and unsupported layouts fall back safely.
  - **Requirements:** RM261003ABZP-REQ7@R2
  - **Design:** RM261003ABZP-DES12@R2
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V10@R1 — Bases evaluation, edit, and compatibility**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S7@R1
      - **Scenario:** fixtures ported from Alfred's Bases tests plus a Kanban `.base` saved by Obsidian 1.14+; edit a cell; move a card; open a `cards` view; group by a formula.
      - **Expected result:** rows and order match fixtures; frontmatter patched with comments and order preserved; card move sets the property; `cards` opens as table with notice; moving is disabled for formula grouping.
      - **Method and target:** unit tests on `core/features/bases`; integration test of write-back
      - **Environment:** tmp workspace
      - **Unique risk:** YAML corruption; Kanban type mismatch with Obsidian.
      - **Predecessors:** None

- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** This document
  - **Outcome:** the browser follows edits within 300 ms and the server rejects foreign hosts and out-of-workspace paths.
  - **Requirements:** RM261003ABZP-REQ8@R2
  - **Design:** RM261003ABZP-DES13@R3
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V11@R3 — Preview server behavior and safety**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S8@R1
      - **Scenario:** start preview; request with Host `evil.test:<port>`; request `/file/..%2f..%2fetc/passwd`; request a symlink pointing outside; request `/file/.git/config`; dispatch an edit and measure time to the SSE event; switch the active buffer to `scripts/sync.ts`; with an SSE client connected, run `:PreviewStop`; with `sync.ts` active, run `:Preview`.
      - **Expected result:** 403; 404; 404; 404; SSE `doc` event < 300 ms after the edit; no `doc` event for the switch to `sync.ts`, and `/render` still returns the last note; the client receives a `stopped` event before the connection closes and the port stops accepting connections; `:Preview` from `sync.ts` shows `not available for typescript files` and starts no server; server bound only to 127.0.0.1.
      - **Method and target:** integration test on `preview/server.ts`
      - **Environment:** real `Bun.serve`, tmp workspace with symlink
      - **Unique risk:** DNS rebinding, traversal, network exposure.
      - **Predecessors:** RM261003ABZP-V11@R1, RM261003ABZP-V11@R2

- **RM261003ABZP-S9@R1 — Performance targets hold**
  - **Definition:** This document
  - **Outcome:** the targets in RM261003ABZP-REQ9@R2 are met on the reference machine and gated at 2× in CI.
  - **Requirements:** RM261003ABZP-REQ9@R2
  - **Design:** RM261003ABZP-DES16@R1, RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES7@R4, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V12@R2 — Keystroke and open-file benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** open the 5,000-line fixture note in live preview, and the 5,000-line TypeScript fixture in source view with highlighting, in the OpenTUI test renderer (120×40); send 200 mixed keystrokes (`j`, `w`, `i` + text + `Esc`, `dd`, `u`) to each; measure input → frame complete; measure open time; scroll each file for 2 s with held `j` and repeated `Ctrl-d`/`Ctrl-u` and record frame times with the in-process frame metrics (`RM261003ABZP-RF2`).
      - **Expected result:** for both files, p95 < 16 ms and open < 50 ms on the reference machine; scrolling frame time p95 < 16.7 ms (60 fps); CI median of 5 runs < 32 ms, < 100 ms, and < 33.4 ms.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** OpenTUI test renderer; fixed CI runner type
      - **Unique risk:** full-document parse, layout, or highlighting sneaking into the keystroke path.
      - **Predecessors:** RM261003ABZP-V12@R1
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S9@R1
      - **Scenario:** generate a 10,000-note workspace; start `so`; record time to first interactive frame and to index ready; type during indexing.
      - **Expected result:** first frame < 200 ms; index ready < 3 s; keystrokes during indexing still meet the V12 budget.
      - **Method and target:** benchmark in `test/bench/`
      - **Environment:** generated fixture; real worker
      - **Unique risk:** indexing blocking the main thread.
      - **Predecessors:** None

- **RM261003ABZP-S10@R2 — Development and CI are fast; releases are manual and proven by a dry run**
  - **Definition:** This document
  - **Outcome:** `bun run check` < 30 s; CI < 3 min; a dry run of the release workflow produces four checksummed binaries that start, without publishing; nothing is released unless the user asks.
  - **Requirements:** RM261003ABZP-REQ10@R4
  - **Design:** RM261003ABZP-DES15@R4
  - **Predecessors:** RM261003ABZP-S10@R1
  - **Verification:**
    - **RM261003ABZP-V14@R2 — Check timing, CI timing, and non-publishing release dry run**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S10@R2
      - **Scenario:** time `bun run check` locally; read CI run durations; run the release workflow manually on `main` (`gh workflow run release.yml`).
      - **Expected result:** < 30 s; < 3 min; the run's `dist` artifact holds 4 binaries + `SHA256SUMS`; the four native smoke jobs print `so 0.0.0-dev+<short sha>`; the publish job is skipped, and no tag or GitHub Release is created.
      - **Method and target:** non-test check on CI and release workflows
      - **Environment:** GitHub Actions
      - **Unique risk:** slow feedback loops; binaries missing OpenTUI's native library or the index worker; an accidental release.
      - **Predecessors:** RM261003ABZP-V14@R1

- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored**
  - **Definition:** This document
  - **Outcome:** boundary violations fail CI; features extend by registration; terminal state is restored on every exit path; standards are followed.
  - **Requirements:** RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V15@R2 — Import boundary test**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** scan every `src/**/*.ts` with `Bun.Transpiler.scanImports`; include two deliberate violation fixtures: a core file importing `node:fs`, and a `src/core/kernel/**` file importing `src/core/lang/markdown`.
      - **Expected result:** core imports only core and allowed parsing packages; only `src/ui/**` imports `@opentui/*`; `src/core/kernel/**` imports only `src/core/kernel/**`; both fixtures fail.
      - **Method and target:** `test/boundaries.test.ts`
      - **Environment:** None
      - **Unique risk:** layering eroding silently; Markdown assumptions creeping into the kernel.
      - **Predecessors:** RM261003ABZP-V15@R1
    - **RM261003ABZP-V16@R2 — Registration-only extension**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** a test module registers a command, a keymap, a syntax extension, and a block renderer; a second test module registers a `csv` file type with a highlighter, a decoration provider, and a `csv`-scoped keymap; a third registers an editor kind `grid`, a `.grid` file type using it, and a UI view for it — none touches other modules.
      - **Expected result:** the command runs from the palette and keymap; the syntax renders through the renderer; opening `data.csv` uses the `csv` file type, its highlighter marks, its decorations, and its key binding; opening `t.grid` creates window content `{editor: "grid"}` and the shell paints the registered view, with no edit to dispatch code.
      - **Method and target:** unit test across `core/kernel/commands`, `core/filetypes`, `core/lang/markdown`, `core/kernel/view`; component test for `ui/editors` registration
      - **Environment:** None
      - **Unique risk:** hidden switch statements that require edits to extend.
      - **Predecessors:** RM261003ABZP-V16@R1
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S11@R1
      - **Scenario:** in a PTY, start `so`, then exit by `:q`, `SIGTERM`, `SIGINT`, and an injected uncaught exception; set `NO_COLOR=1` in one run.
      - **Expected result:** after each exit the PTY is back on the main screen with cursor visible, mouse and kitty keyboard modes off; the `NO_COLOR` run emits no colour SGR codes.
      - **Method and target:** e2e PTY test in `test/e2e/`
      - **Environment:** real PTY (`Bun.spawn` with a pseudo-terminal), headless terminal emulator to read state
      - **Unique risk:** leaving the user's terminal broken.
      - **Predecessors:** None

- **RM261003ABZP-S12@R1 — Any text file opens safely on a language-neutral core**
  - **Definition:** This document
  - **Outcome:** non-Markdown UTF-8 files open in source view with highlighting where recognized, binary and oversized files are refused without writes, and saves keep the file's BOM and line endings. Keeping note-only keys and commands out of other file types is part of RM261003ABZP-S3@R1 (RM261003ABZP-V4@R2).
  - **Requirements:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3
  - **Design:** RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3
  - **Predecessors:** None
  - **Verification:**
    - **RM261003ABZP-V18@R1 — Open text, code, binary, and oversized files**
      - **Definition:** This document
      - **Success:** RM261003ABZP-S12@R1
      - **Scenario:** in a tmp workspace: (a) `:e scripts/sync.ts`, `:e config.yaml`, `:e notes.txt`, `:e Makefile`; (b) `:e photo.png` and a file with a NUL byte at offset 100; (c) a file containing invalid UTF-8; (d) a generated 17 MiB text file; (e) edit and save a CRLF file with a UTF-8 BOM.
      - **Expected result:** (a) each opens in source view; `.ts` and `.yaml` lines carry highlighter style tokens, `notes.txt` resolves to `text` and `Makefile` resolves to `makefile` by file name; (b, c) `binary file — not opened`, no buffer created; (d) `file too large — not opened (limit 16 MiB)`; (e) the saved bytes keep the BOM and every `\r\n`.
      - **Method and target:** unit tests on `core/filetypes` and `workspace/fs.readTextFile`; integration test of open and save through the store
      - **Environment:** tmp workspace; real file system
      - **Unique risk:** binary files corrupted by a text save; file-type mismatch; BOM or line endings lost on save.
      - **Predecessors:** None

## Design Decisions and Traceability

- **RM261003ABZP-DES1@R2 — One process, one package, four layers, and a language-neutral kernel, with a tested import boundary**
  - **Requirements:** RM261003ABZP-REQ11@R3 - pure core, enforced boundaries, language-neutral kernel; RM261003ABZP-REQ10@R4 - fast checks
  - **Decision:** `src/core` (pure), `src/workspace` (I/O), `src/ui` (OpenTUI), `src/preview` (HTTP), wired only in `src/app`. Inside the core, `kernel/` (text, editor, vim, commands, view) imports only `kernel/`; `filetypes/`, `lang/`, and `features/` build on it; `state/` and `config/` compose everything. A `bun test` boundary test using `Bun.Transpiler.scanImports` enforces both the layer rules and the kernel rule.
  - **Explanation:** System Architecture diagram; Project Structure; `test/boundaries.test.ts`. One package keeps install and CI fast; the test needs no TypeScript API (`RM261003ABZP-RF13`). The kernel rule is what keeps `so` able to become a code or notebook editor: Markdown cannot leak into editing, and a new language is a new folder plus registrations.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred needed six packages because of its kernel; `so` has no server boundary. `rm261003abzp-roadmap-context.md@R2` - scope change: leave room for code editing and notebooks.
  - **Research:** `RM261003ABZP-RF1` - contain OpenTUI to the UI layer; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3). `RM261003ABZP-RF13` - avoid TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** folder conventions rather than package boundaries; rejected a Turborepo monorepo (slower, more config) and dependency-cruiser (TS 7 issue). Rejected separate `editor-core` and `markdown` packages: same isolation as the kernel rule but with workspace and build overhead.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-DES1@R1

- **RM261003ABZP-DES2@R2 — One store with a pure reducer and data-only effects**
  - **Requirements:** RM261003ABZP-REQ11@R3 - stable, testable foundations; RM261003ABZP-REQ1@R3 - autosave and conflicts; RM261003ABZP-REQ9@R2 - predictable rendering
  - **Decision:** `update(state, action) → { state, effects }`; effects are plain data executed by `app/effects.ts`; results return as actions.
  - **Explanation:** Action and Effect protocol; AppState; `src/core/state/update.ts`. Every behavior (autosave timing, conflict choice, rename) is a pure function test.
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts` - Alfred's vim core already returns effects instead of performing them.
  - **Research:** None
  - **Tradeoffs:** an extra indirection for I/O; rejected UI components holding state (hard to test, the Ink/React pattern Alfred needed a compositor around).
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** RM261003ABZP-DES2@R1

- **RM261003ABZP-DES3@R1 — Line-array TextBuffer behind an interface, with vim undo blocks**
  - **Requirements:** RM261003ABZP-REQ2@R2 - undo per undo block; RM261003ABZP-REQ9@R2 - 5,000-line target
  - **Decision:** immutable line array with structural sharing; `apply(edit)` returns an inverse; undo stack of blocks (one Normal command or one Insert session).
  - **Explanation:** TextBuffer model; `src/core/kernel/text/text-buffer.ts`. A piece table can replace the implementation without changing callers.
  - **Evidence:** `alfred/apps/tui/src/view/editor/text-buffer.ts` - single-string buffer (186 lines) as reference.
  - **Research:** `RM261003ABZP-RF6` - line array adequate at ≤ 5,000 lines; undo block = typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** O(lines) splices on huge files; rejected OpenTUI's native `EditBuffer` as source of truth (couples core to a 0.x UI library).
  - **Dependencies:** None
  - **Predecessors:** None

- **RM261003ABZP-DES4@R1 — Table-driven vim engine**
  - **Requirements:** RM261003ABZP-REQ2@R2 - core vim command set, Esc timeout
  - **Decision:** a pure key-sequence parser for `[count]["reg][count]op[count](motion|textobject)` with motion, operator, and text-object tables; mode machine (normal, insert, visual char/line, cmdline); last-change record for `.`; ex command table.
  - **Explanation:** `src/core/kernel/vim/engine.ts`; Esc timeout handled in `ui/input.ts` (RM261003ABZP-DES10@R2).
  - **Evidence:** `alfred/apps/tui/src/view/editor/vim.ts:15` - Alfred supports only two modes with a hard-coded pending set.
  - **Research:** `RM261003ABZP-RF5` - kitty keyboard protocol, 50 ms timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Tradeoffs:** no macros or Visual block in v1 (deferred); rejected embedding Neovim (user decision).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** None

- **RM261003ABZP-DES5@R2 — Command registry and file-type-scoped keymap trie as the single extension point for actions**
  - **Requirements:** RM261003ABZP-REQ3@R4 - leader, which-key, palette, config, file-type scope; RM261003ABZP-REQ11@R3 - extend by registration
  - **Decision:** every action is a named `Command`, optionally limited to file types; keys map to command ids through a trie keyed by `{mode, filetype?}`, with the file-type level checked before the global level; which-key, palette, help, and config overrides (`keys.<mode>`, `filetypes.<id>.keys.<mode>`) read the same registry. Note keys (`gd`, `Enter` on links, `<leader>m`, `<leader>x`) are bound for `markdown` only.
  - **Explanation:** `src/core/kernel/commands/registry.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input - LazyVim style; `rm261003abzp-roadmap-context.md@R2` - keymaps scoped by mode and file type.
  - **Research:** None
  - **Tradeoffs:** commands must be pure (state + effects), which forbids quick ad-hoc I/O in commands; accepted for testability. Rejected VS Code-style `when` expressions: a file-type scope covers v1 and the known code-editor need with far less machinery.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** RM261003ABZP-DES5@R1

- **RM261003ABZP-DES6@R2 — micromark/mdast with Obsidian extensions and block-level reparse**
  - **Requirements:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2
  - **Decision:** port Alfred's micromark + GFM + math parsing and Obsidian syntax into `core/lang/markdown` as the `markdown` file type's `analyze`; split into blocks and reparse only changed blocks; one `Doc` with two levels feeds layout, index, and HTML: a linear scan level (links, tags, headings, block ids, frontmatter) used by the index and link features, and mdast built lazily per block for live preview and HTML. Each Obsidian syntax is defined once in `syntaxExtensions` for both levels.
  - **Explanation:** Doc model; `src/core/lang/markdown/doc.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/markdown/parse.ts:40-44` - existing micromark pipeline; `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md` (DES2, Assigned Parent Obligation Coverage) - a full mdast parse took 11.8 s for 10,000 notes and about 350 ms for the `openFile` fixture; delivered in `src/core/lang/markdown/` (PR #2).
  - **Research:** `RM261003ABZP-RF7` - micromark conformant but not incremental; block reparse meets budgets; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block splitting must handle lists, fences, and frontmatter carefully; two parse levels must agree, which the shared `syntaxExtensions` registry and a conformance test enforce; rejected OpenTUI's tree-sitter Markdown (UI-layer dependency, no Obsidian syntax) and Lezer (skips link reference validation; another parser to learn).
  - **Dependencies:** RM261003ABZP-DES3@R1
  - **Predecessors:** RM261003ABZP-DES6@R1

- **RM261003ABZP-DES7@R4 — Worker-built in-memory index with a documented resolution rule**
  - **Requirements:** RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename; RM261003ABZP-REQ3@R4 - pickers and full-text search; RM261003ABZP-REQ9@R2 - non-blocking index
  - **Decision:** a Bun `Worker` lists every non-excluded workspace file, summarizes Markdown notes from the scan level of `parseDoc`, and answers full-text queries over Markdown notes and other text files that pass the REQ1 text checks; the main thread holds `NoteIndex` (summaries plus the file list) under `core/features/links`; resolution order: root path → alias → basename ranked by same folder, shortest path, alphabetical; `planRename(ix, moves, open)` rewrites link spans only, from open buffers' scans and the summaries' link spans, without reading files; one link rewrite runs at a time; `link.linkMention` wraps one unlinked mention in `[[…]]` in its source note through a span edit (open buffer in memory, closed file via `write`).
  - **Explanation:** NoteSummary and NoteIndex; `resolve.ts`; `rename.ts`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` - Alfred used SQLite; `so` has no persistence need for the index; `.s1mple/work/done/w261003fx70-navigation-and-links/` system design DES3, DES4, DES6 and goal deviations D2, D3; delivered in `src/core/features/links/` and `src/workspace/index-worker.ts` (PR #2).
  - **Research:** `RM261003ABZP-RF8` - duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Tradeoffs:** reindex on every start (< 3 s target); searching all text files reads more bytes than notes alone, bounded by `.gitignore` exclusion and the 16 MiB per-file limit; rejected SQLite (persistence and schema cost without need) and ripgrep (external binary).
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES7@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES7@R3

- **RM261003ABZP-DES8@R2 — Atomic saves, directory watching, own-write stamps, and trash adapters**
  - **Requirements:** RM261003ABZP-REQ1@R3 - safe file management
  - **Decision:** `atomicWrite` (realpath → same-dir temp → fsync → chmod → rename); `fs.watch(root, {recursive:true})` with per-path debounce and own-write stamps; trash via freedesktop spec on Linux and, on macOS, `/usr/bin/trash` when present, else `NSFileManager` through JXA (`osascript -l JavaScript` with the path as an argument), both without a permission prompt; else typed confirmation; autosave policy and conflict rules live in core.
  - **Explanation:** `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; Save and external change flow.
  - **Evidence:** `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - autosave queue reference; `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-research.md` RF11 - Finder automation prompts for Automation permission, while `/usr/bin/trash` (macOS 15+) and `NSFileManager` move to the trash without a prompt; RF8 - recursive `fs.watch` confirmed on macOS and Linux; delivered in `src/workspace/trash.ts` and `watcher.ts` (PR #1).
  - **Research:** `RM261003ABZP-RF11` - fsync, same directory, directory watching, undoable reload; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (current RM261003ABZP-REQ1@R3)
  - **Tradeoffs:** rename-based saves replace hard links (acceptable for notes); recursive `fs.watch` relies on platform support in Bun on macOS and Linux — confirmed by DI1 (RF8 above) and re-proved in CI on both platforms.
  - **Dependencies:** RM261003ABZP-DES2@R2
  - **Predecessors:** RM261003ABZP-DES8@R1

- **RM261003ABZP-DES9@R3 — Viewport-only text view with decorations; Markdown live preview as a decoration provider**
  - **Requirements:** RM261003ABZP-REQ5@R2 - live preview; RM261003ABZP-REQ9@R2 - smooth scrolling; RM261003ABZP-REQ11@R3 - language-neutral kernel, registered decoration providers
  - **Decision:** the kernel's pure `layoutText` produces `RenderLine[]` for visible rows only from text plus decorations (`mark`, `replace`, `widget`, `line`) returned by the view's providers and the file type's highlighter. Markdown live preview is the `livePreview` provider in `lang/markdown`: the cursor line reveals inline syntax, a cursor inside a multi-line block reveals the whole block, folded callouts and expanded embeds follow the window's `folds` set, block renderers are registered per block kind, and widgets (image, embed, base) reserve rows. Source view uses highlighter marks only — the same path code files use. The live-preview input (`MarkdownViewInput`: the `Doc` plus a read-only `PreviewCtx`) comes from the Markdown views' `input` hook, so neither the kernel nor the UI knows about Markdown.
  - **Explanation:** FileType and Decoration model; RenderLine model; `src/core/kernel/view/text-view.ts`; `src/core/lang/markdown/live-preview.ts`.
  - **Evidence:** `alfred/apps/tui/src/view/editor/reveal-units.ts` - reveal units reference. Industry precedent: CodeMirror 6 decorations (the basis of Obsidian's live preview), Neovim extmarks and conceal, VS Code decorations.
  - **Research:** `RM261003ABZP-RF7` - per-element reveal in Obsidian; block reveal for multi-line constructs; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal; one decoration list per frame instead of direct painting, accepted because it is bounded by visible lines; rejected OpenTUI `MarkdownRenderable` conceal (UI-owned parsing, no Obsidian syntax) and a Markdown-specific `layoutViewport` (would make every future language reimplement layout).
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES9@R1, RM261003ABZP-DES9@R2

- **RM261003ABZP-DES10@R2 — OpenTUI shell with editor-kind views, widget painters, normalized input, and guaranteed terminal restore**
  - **Requirements:** RM261003ABZP-REQ2@R2 - Esc, cursor shape; RM261003ABZP-REQ3@R4 - explorer, overlays; RM261003ABZP-REQ5@R2 - images; RM261003ABZP-REQ7@R2 - Bases views; RM261003ABZP-REQ11@R3 - restore, `NO_COLOR`, terminal support, registration
  - **Decision:** `@opentui/core` pinned exactly; layout of explorer, bufferline, window splits, side panel, statusline, cmdline, overlays; each window renders through the view registered for its editor kind (`text` → custom `EditorView` renderable painting `RenderLine[]`; `base` → Bases view); widgets are painted by painters registered per widget type (`image` via OpenTUI's auto protocol kitty → sixel → blocks, `embed`, `base`, `rule`); input normalized to `Key` with kitty keyboard protocol and Esc timeout; theme tokens with `NO_COLOR`; restore on exit, signals, and uncaught errors.
  - **Explanation:** `src/ui/*`; `src/ui/editors/`; `src/ui/widgets/`.
  - **Evidence:** `alfred/apps/tui/src/terminal/shutdown.ts` - restore coordinator reference; Context7 `/anomalyco/opentui`.
  - **Research:** `RM261003ABZP-RF1`, `RM261003ABZP-RF2`, `RM261003ABZP-RF4`, `RM261003ABZP-RF5`; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - **Tradeoffs:** dependence on a 0.x library contained to `src/ui`; rejected Ink (React redraw cost) and a custom renderer (upfront cost). A notebook later adds one editor view; no shell change.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES9@R3
  - **Predecessors:** RM261003ABZP-DES10@R1

- **RM261003ABZP-DES11@R1 — Shared Moment-subset formatter, pure template expansion, and daily-note commands**
  - **Requirements:** RM261003ABZP-REQ6@R2 - daily notes and templates; RM261003ABZP-REQ7@R2 - Bases date formatting
  - **Decision:** `core/time/format.ts` implements the documented token subset and `[literal]`; `core/features/notes` computes daily paths (with `/` subfolders) and expands `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}`; commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`.
  - **Explanation:** `src/core/time/format.ts`; `src/core/features/notes/*`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R1` User Input.
  - **Research:** `RM261003ABZP-RF10` - Moment tokens, `{{time:FORMAT}}`, subfolders; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Tradeoffs:** rare tokens unsupported (kept literal); rejected Moment.js and Day.js dependencies (maintenance mode; extra weight).
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** None

- **RM261003ABZP-DES12@R2 — Ported Bases engine as a registered `base` editor kind, with table and Kanban view models and YAML-preserving write-back**
  - **Requirements:** RM261003ABZP-REQ7@R2 - Bases table and Kanban views; RM261003ABZP-REQ11@R3 - editor kinds by registration
  - **Decision:** port `alfred/packages/vault/src/domain/bases/*` (parser, evaluator, expression, yaml-patcher) and `alfred/packages/view-model/src/base/*` row and board rules into `core/features/bases`; `.base` is registered as file type `base` with editor kind `base`, so opening it puts `{editor:"base", path, view, cursor}` in the window; view models `TableModel` and `KanbanModel`; unknown layouts map to `TableModel` with a notice; the Kanban `type` string is one constant verified against an Obsidian 1.14+ file; edits become `write` effects through the atomic save path; embeds render through a `base` block renderer and `base` widget painter.
  - **Explanation:** `src/core/features/bases/*`; `src/ui/editors/` Bases view.
  - **Evidence:** `alfred/packages/vault/src/domain/bases/parser.ts:19`, `evaluator.ts:164` - no file-system or Bun imports (context assumption).
  - **Research:** `RM261003ABZP-RF9` - layouts, Kanban rules; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - **Tradeoffs:** follows an early-access Obsidian layout; guarded by the constant, a fixture, and the table fallback. Bases is the first non-text editor kind, so the seam a notebook needs is exercised in v1 rather than designed speculatively.
  - **Dependencies:** RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1
  - **Predecessors:** RM261003ABZP-DES12@R1

- **RM261003ABZP-DES13@R3 — `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering**
  - **Requirements:** RM261003ABZP-REQ8@R2 - read-only preview
  - **Decision:** `preview/server.ts` binds `127.0.0.1:0`, checks Host, serves a page shell, SSE `/events` (`doc` events with `{path, version, line}` and `stopped` events), `/render` fragments from core `renderHtml(doc)`, contained `/file/*`, and `/assets/*`; the page loads KaTeX and Mermaid from the server's own `/assets/*`, embedded in the binary from exact-pinned npm packages, under a Content Security Policy that allows code, styles, fonts and connections only from the server's own origin, and images also from the web, with `nosniff` and `no-referrer`; a render error shows that block's source. `:Preview` is a Markdown-only command and the page follows Markdown notes only; switching to another file type sends no `doc` event.
  - **Explanation:** Preview HTTP routes; `src/preview/server.ts`; `src/core/lang/markdown/html.ts`.
  - **Evidence:** user decision "no Next.js".
  - **Research:** `RM261003ABZP-RF12` - binding, Host check, containment, SSE; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Tradeoffs:** binary grows by several MB for the embedded KaTeX and Mermaid builds (no size budget); loading a web image reveals the viewer's IP address to that image's host (no Referer is sent); rejected loading KaTeX and Mermaid from a CDN (third-party code in a page showing private notes; no offline rendering) and WebSocket (bidirectional not needed).
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4
  - **Predecessors:** RM261003ABZP-DES13@R1, RM261003ABZP-DES13@R2

- **RM261003ABZP-DES14@R2 — TOML config at XDG path validated by schema; per-workspace state at XDG state path**
  - **Requirements:** RM261003ABZP-REQ3@R4 - configuration and state
  - **Decision:** `toml-eslint-parser` (1.0.3, exact pin) + zod schema (`core/config/schema.ts`, `core/config/toml.ts`), so every error names the TOML line; `editor.tabWidth`, `editor.wrap`, and `editor.relativeNumbers` are delivered with DI2; config path honors XDG rules (relative values ignored); invalid config → error notice + defaults; state JSON at `$XDG_STATE_HOME/so/<sha256(realpath(root)).slice(0,16)>/state.json` holding recent notes, jump list, open buffers, window layout.
  - **Explanation:** AppConfig; `src/workspace/config-file.ts`; `src/workspace/state-file.ts`.
  - **Evidence:** `rm261003abzp-research.md` S21, S9, S30; `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-requirements.md` Discussion Evidence - `Bun.TOML.parse` errors report the JavaScript call site, not the TOML line; the editor options were approved by the user for DI2 on 2026-10-03; delivered in `src/core/config/` (PR #2).
  - **Research:** `RM261003ABZP-RF15` - TOML, XDG rules, state home; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4)
  - **Tradeoffs:** TOML instead of the proposal's `config.ts` — no code execution and simpler validation, at the cost of no scripting in config (agent decision under delegation). One pinned parser dependency instead of Bun's built-in parser, for line-numbered errors.
  - **Dependencies:** RM261003ABZP-DES5@R2
  - **Predecessors:** RM261003ABZP-DES14@R1

- **RM261003ABZP-DES15@R4 — Bun-native toolchain, two-job CI, manual tag releases, and single-runner cross-compile**
  - **Requirements:** RM261003ABZP-REQ10@R4 - fast checks, CI, release; RM261003ABZP-REQ11@R3 - Conventional Commits, SemVer
  - **Decision:** Bun (exact version in `packageManager`), TypeScript 7 `tsc --noEmit` strict, Biome, knip, `bun test` (unit colocated; component via OpenTUI test renderer; few PTY e2e); `bun run check` = biome check + tsc + knip + boundary test + unit tests; CI jobs `check` and `test` (component, e2e, bench) in parallel with Bun cache, triggered on pull requests only, a newer push cancelling the superseded run; no workflow creates a release, tag, or release pull request on its own; release workflow `release.yml`, triggered by a `v*` tag pushed at the user's request (publishes) or by `workflow_dispatch` (dry run: same build and smoke, version `0.0.0-dev+<short sha>`, no tag and no GitHub Release): `bun install --os="*" --cpu="*"`, compile `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64`, `bun-linux-arm64` with `OPENTUI_LIBC=glibc` defined for Linux, every `bun build --compile` (local `build` and release) listing `src/app/main.ts` and `src/workspace/index-worker.ts` as entrypoints so the binary embeds the index worker, `SHA256SUMS`, smoke `so --version` natively for each target (`macos-15` arm64, `macos-15-intel` x64, `ubuntu-24.04` x64, `ubuntu-24.04-arm` arm64), then publish to a GitHub Release with generated notes only for a tag run.
  - **Explanation:** Project Structure (`package.json`, `.github/workflows/*`).
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's eight CI groups are the anti-pattern avoided; user decision 2026-10-03 for PR-only CI (private repository, billed macOS minutes); `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-research.md` RF7 - one runner cross-compiles all four targets, and only a native runner proves each binary starts; RF9 - a release created by release-please with `GITHUB_TOKEN` does not trigger tag workflows, so the build is wired to its outputs; delivered in `.github/workflows/` (PR #1); a single-entrypoint binary drops the worker (`.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-requirements.md` Discussion Evidence), fixed in `package.json` and `release.yml` (PR #2); user decision 2026-10-04 for manual releases only, after release-please failed on every push to `main` (`GitHub Actions is not permitted to create or approve pull requests`).
  - **Research:** `RM261003ABZP-RF3`, `RM261003ABZP-RF13`, `RM261003ABZP-RF14`; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4); RF14's release-please is dropped by the user's manual-release decision
  - **Tradeoffs:** unsigned macOS binaries (signing deferred); no CHANGELOG file — release notes come from GitHub's generated notes, and the version is whatever tag the user asks for; pushes to `main` run no CI, so `main` relies on the pull-request run of its merge head; four smoke runners add billed macOS minutes per release and per phase-exit dry run only. Rejected keeping release-please on manual dispatch: it needs a repository setting to open pull requests and adds a two-step release.
  - **Dependencies:** RM261003ABZP-DES1@R2
  - **Predecessors:** RM261003ABZP-DES15@R1, RM261003ABZP-DES15@R2, RM261003ABZP-DES15@R3

- **RM261003ABZP-DES16@R1 — Performance by construction plus benchmark gates**
  - **Requirements:** RM261003ABZP-REQ9@R2 - performance targets
  - **Decision:** viewport-only layout (DES9), block parse cache (DES6), worker index and search (DES7), frame coalescing (one render per input burst), first frame before indexing, lazy image decode with an LRU cache (64 MiB), and benchmarks through the OpenTUI test renderer gated at 2× (median of 5) in CI.
  - **Explanation:** Keystroke to frame and Startup flows; `test/bench/`.
  - **Evidence:** `alfred/.s1mple/docs/project.md` - Alfred's 64 MiB image budget precedent.
  - **Research:** `RM261003ABZP-RF2` - in-process metrics; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Tradeoffs:** benchmarks add CI time (bounded by the 3 min budget); terminal display latency is outside the measurement.
  - **Dependencies:** RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES9@R3
  - **Predecessors:** None

- **RM261003ABZP-DES17@R1 — File-type registry, highlighter interface, and text-file open policy**
  - **Requirements:** RM261003ABZP-REQ1@R3 - any text file, binary and size guard, BOM; RM261003ABZP-REQ3@R4 - file-type scope; RM261003ABZP-REQ11@R3 - file types, highlighters, decoration providers, editor kinds by registration
  - **Decision:** a `FileTypeRegistry` maps a path to a `FileType` (extension, then file name, then the built-in `text` fallback); a file type declares its editor kind (an open string; non-`text` kinds register an `EditorKindSpec` in core, which creates the window state, and a UI view in `editorViews`, which paints it), views with decoration providers and an optional `input` hook whose context type the language declares and `core/state` builds, optional `Highlighter` (a kernel interface), and optional `analyze` hook. Note-only commands, including `:Preview`, are limited to `markdown`. v1 registers `text`, `markdown`, `base`, and code file types backed by one lowlight `Highlighter` (viewport-bounded, cached per buffer version). `workspace/fs.readTextFile` refuses files over 16 MiB and files with a NUL in the first 8 KiB or invalid UTF-8, strips and remembers a BOM and line separator; saves restore both.
  - **Explanation:** FileType and Decoration model; Open a file flow; `src/core/filetypes/registry.ts`; `src/core/lang/code/highlight.ts`; `src/workspace/fs.ts` `readTextFile`.
  - **Evidence:** `rm261003abzp-roadmap-context.md@R2` - "Apply all six" decision; `alfred/apps/tui/src/view/markdown/code-highlight.ts` - lowlight precedent. Industry precedent: Neovim `filetype` + ftplugins, VS Code language contributions, Git's NUL-byte binary heuristic.
  - **Research:** None - the decision reuses existing findings (RF6 pure text model, RF7 parse and reveal).
  - **Tradeoffs:** lowlight is regex-based and not incremental, so very long multi-line constructs above the 200-line look-back can highlight wrongly; accepted for v1 and replaceable by tree-sitter behind `Highlighter`. Rejected adding tree-sitter now (WASM grammars, build and size cost without a v1 need) and a generic notebook-ready `Document` abstraction (speculative; editor kinds already cover it). The 16 MiB limit is a fixed constant, not configuration.
  - **Dependencies:** RM261003ABZP-DES1@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES8@R2
  - **Predecessors:** None

| Current requirement | Design decision | Canonical design location | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | `src/workspace/fs.ts`, `watcher.ts`, `trash.ts`; `src/core/filetypes/`; Open a file and Save and external change flows | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | `src/core/kernel/text/`, `src/core/kernel/editor/`, `src/core/kernel/vim/`, `src/ui/input.ts` | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, config, state, file-type scope | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R1 | `src/core/kernel/commands/`, `src/ui/overlays/`, `src/workspace/config-file.ts`, `state-file.ts` | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links | RM261003ABZP-DES7@R4, RM261003ABZP-DES6@R2 | `src/core/features/links/` | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | `src/core/lang/markdown/`, `src/core/kernel/view/`, `src/ui/editors/`, `src/ui/widgets/` | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | `src/core/time/`, `src/core/features/notes/` | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | `src/core/features/bases/`, `src/ui/editors/` | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - preview | RM261003ABZP-DES13@R3, RM261003ABZP-DES6@R2 | `src/preview/`, `src/core/lang/markdown/html.ts` | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-DES16@R1 | Keystroke and Startup flows; `test/bench/` | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R4 - dev, CI, release | RM261003ABZP-DES15@R4, RM261003ABZP-DES1@R2 | `package.json`, `.github/workflows/` | RM261003ABZP-S10@R2 | RM261003ABZP-V14@R2 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1 | `test/boundaries.test.ts`, `src/core/kernel/`, `src/core/filetypes/`, registries, `src/ui/shell.ts` | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

## Unresolved Items

None — open technical confirmations are delivery constraints with named verification, not design decisions. DI1 confirmed the OpenTUI paint, buffer, and test-renderer APIs at `@opentui/core` 0.5.14 and recursive `fs.watch` on macOS and Linux. The OpenTUI image API at the pinned version (before DI3 relies on it) and the Kanban `type` value (DI4) remain.

## Approval

- **Requirement baseline:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 … RM261003ABZP-REQ10@R4, RM261003ABZP-REQ11@R3
- **Approved design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R4, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
- **Approved success and verification:** RM261003ABZP-S1@R1 … RM261003ABZP-S9@R1, RM261003ABZP-S10@R2, RM261003ABZP-S11@R1, RM261003ABZP-S12@R1; RM261003ABZP-V1@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1, RM261003ABZP-V4@R2, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V8@R1, RM261003ABZP-V9@R1, RM261003ABZP-V10@R1, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V13@R1, RM261003ABZP-V14@R2, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1
- **Approval evidence:** User delegated all decisions on 2026-10-03 ("you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"); the agent approved this design, the DES2/DES7/DES9/DES13 R2 revisions from the UI system-impact assessment, and the V6/V11 R2 verification revisions, under that delegation. On 2026-10-03 the user approved the Markdown-first, language-neutral core by selecting "Apply all six (Recommended)" (kernel split, FileType registry, decorations, file-type keymaps, highlighter interface, open any text file); this produced DES1@R2, DES5@R2, DES7@R3, DES9@R3, DES10@R2, DES12@R2, DES17@R1, S12@R1, V18@R1, and the V4/V7/V12/V15/V16 R2 revisions. The user then delegated every remaining sub-decision on 2026-10-03 ("you self-drive everything. Everything is good now, don't need to stop"), covering the 16 MiB limit, binary check, BOM preservation, all-file picker and text-file search, `[filetypes.<id>.keys.<mode>]` config, no statusline file-type segment, S12/V18, the TypeScript benchmark, and the lowlight look-back. Post-DI1 synchronization approved by the user on 2026-10-03: DES8@R2 (macOS trash without a prompt) and DES15@R2 (pull-request-only CI, `workflow_call` release, native smoke). Post-DI2 synchronization approved by the user on 2026-10-04: DES6@R2 (two-level Markdown model), DES7@R4 (scan-level summaries, `planRename` from moves and open scans, one link rewrite at a time), DES14@R2 (`toml-eslint-parser`, editor options), and DES15@R3 (index worker as a second compile entrypoint). On 2026-10-04 the user decided that releases are manual (a `v*` tag pushed only on request) and that phase exits run a non-publishing dry run: DES15@R4, S10@R2, V14@R2. DI3 design synchronization (W261003S6BQ) approved by the user on 2026-10-04: DES13@R3 (KaTeX and Mermaid served from the binary, same-origin Content Security Policy with web images, `line` in the `doc` payload) and the outbound-network rule for web images.
``````
