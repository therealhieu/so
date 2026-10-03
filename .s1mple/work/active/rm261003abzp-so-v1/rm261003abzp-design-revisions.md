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
