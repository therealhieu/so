# W261003FX70: Navigation and links

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md` | DI2 assignment state (`:132`, `:143`), accepted baseline (`:9-49`) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-1-daily-usable-editor.md` | DI2 definition (`:429-517`), Phase Design (`:100-322`), gate G1 (`:73`), integration obligation (`:591`) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-2-obsidian-experience.md` | Gates G2 and G3 that DI2 produces (`:70-71`) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-design.md` | DES5/6/7/14/16/17 decisions, data models, flows, and V4/V5/V6/V13 definitions |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-requirements.md` | REQ3@R4 (`:106`), REQ4@R3 (`:128`), REQ9@R2 (`:226`), REQ11@R3 (`:271`) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-requirements.md`, `rm261003abzp-ui-design.md`, `ui-mockups/manifest.md` | Assigned UI obligations and mockup acceptance state |
| `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-system-design.md` | DI1 compatibility notes for DI2 (`:187`, `:294`, `:956`, `:988`, `:1094`, `:1145`, `:1222`) |
| `src/core/state/*`, `src/core/kernel/commands/*`, `src/core/kernel/vim/keys.ts`, `src/core/filetypes/registry.ts`, `src/core/lang/markdown/file-type.ts`, `src/core/config/schema.ts`, `src/app/{main,effects}.ts`, `src/ui/{shell.ts,overlays/host.ts,views/statusline.ts,editors/registry.ts}`, `src/workspace/{fs,watcher,ignore}.ts`, `test/boundaries.test.ts`, `scripts/bench-gate.ts`, `package.json`, `.github/workflows/release.yml` | Delivered DI1 surfaces that DI2 extends |

## Roadmap Binding

- **Roadmap:** RM261003ABZP — `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md`
- **Phase:** RM261003ABZP-PH1@R2 — Daily-usable editor; `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Phase Definition (`:10-36`) and Phase Design (`:100-322`)
- **Delivery item:** RM261003ABZP-DI2@R2 — Navigation and links; `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:429-517`; index Delivery Items row `rm261003abzp-roadmap-index.md:132`
- **Accepted upstream baseline:**
  - Context: `rm261003abzp-roadmap-context.md@R2`.
  - Requirements (`rm261003abzp-requirements.md`): RM261003ABZP-REQ3@R4 (`:106`), RM261003ABZP-REQ4@R3 (`:128`), RM261003ABZP-REQ9@R2 (`:226`, startup and index part), RM261003ABZP-REQ11@R3 (`:271`, `syntaxExtensions` registration).
  - Design (`rm261003abzp-design.md`, Design Decisions and Traceability): RM261003ABZP-DES5@R2 (`:1158`), RM261003ABZP-DES6@R1 (`:1168`), RM261003ABZP-DES7@R3 (`:1178`), RM261003ABZP-DES8@R2, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1 (`:1248`), RM261003ABZP-DES16@R1 (`:1268`), RM261003ABZP-DES17@R1 (`:1278`).
  - Success and verification (`rm261003abzp-design.md`, Success and Verification): RM261003ABZP-S3@R1 (`:900`) with RM261003ABZP-V4@R2 (`:908`); RM261003ABZP-S4@R1 with RM261003ABZP-V5@R1 (`:925`) and RM261003ABZP-V6@R2 (`:934`); RM261003ABZP-S9@R1 (startup and index part) with RM261003ABZP-V13@R1 (`:1037`).
  - Mockups (`ui-mockups/manifest.md`, Acceptance `:89-93`): RM261003ABZP-M3@R1, RM261003ABZP-M4@R1 (S1–S9, S18), RM261003ABZP-M1@R1 (panel and indexing states); manifest AD4.
  - UI requirements (`rm261003abzp-ui-requirements.md`): RM261003ABZP-UREQ5@R2 (`:88`), RM261003ABZP-UREQ6@R1 (`:105`), RM261003ABZP-UREQ1@R2 (`:23`, index, backlinks, panels), RM261003ABZP-UREQ7@R2 (`:120`, move impact), RM261003ABZP-UREQ11@R1 (`:184`).
  - UI design (`rm261003abzp-ui-design.md`): RM261003ABZP-UDES5@R2 (`:2311`), RM261003ABZP-UDES6@R1 (`:2321`), RM261003ABZP-UDES1@R2 (`:2271`), RM261003ABZP-UDES7@R2 (`:2331`), RM261003ABZP-UDES11@R1 (`:2371`); RM261003ABZP-US3@R2 (`:2079`), RM261003ABZP-US4@R1 (`:2088`), RM261003ABZP-US1@R2 (`:2061`), RM261003ABZP-US5@R2 (`:2097`), RM261003ABZP-US9@R1 (`:2133`); RM261003ABZP-UV4@R2 (`:2180`), RM261003ABZP-UV5@R1 (`:2192`), RM261003ABZP-UV1@R2 (`:2144`, index and panel states), RM261003ABZP-UV6@R2 (`:2204`, move impact), RM261003ABZP-UV10@R1 (`:2252`, picker selection state).
- **Assigned parent obligations:**
  - Requirements: RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ9@R2 (cold start < 200 ms with 10,000 notes, index < 3 s without blocking input), RM261003ABZP-REQ11@R3 (`syntaxExtensions`).
  - Design: RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R2 (rename and link-mention writes), RM261003ABZP-DES10@R2 (overlays, side panel), RM261003ABZP-DES14@R1, RM261003ABZP-DES16@R1 (worker off the input path), RM261003ABZP-DES17@R1 (`markdown` `analyze`; search within the open-policy limits).
  - Success and verification: RM261003ABZP-S3@R1 / RM261003ABZP-V4@R2; RM261003ABZP-S4@R1 / RM261003ABZP-V5@R1, RM261003ABZP-V6@R2; RM261003ABZP-S9@R1 (startup and index part) / RM261003ABZP-V13@R1.
  - UI: RM261003ABZP-US3@R2 via RM261003ABZP-UV4@R2; RM261003ABZP-US4@R1 via RM261003ABZP-UV5@R1; RM261003ABZP-US1@R2 via RM261003ABZP-UV1@R2 (indexing segment, index-ready toast, outline and backlinks panel); RM261003ABZP-US5@R2 via RM261003ABZP-UV6@R2 (move with link impact); RM261003ABZP-US9@R1 via RM261003ABZP-UV10@R1 (picker selection state).
  - Cross-work integration (`…phase-1…md:591`): DI2's CI run on top of merged DI1 re-passes RM261003ABZP-V1@R1, RM261003ABZP-V17@R1, and RM261003ABZP-V18@R1 alongside its own records.
  - Downstream work boundary (`…phase-1…md:511-516`): DI2 refines fuzzy scoring constants, picker preview content, and search result limits; it may not change the resolution order or rename format preservation, change worker protocol semantics consumed by DI3 and DI4, persist the index, write non-user files into the workspace, or bind note keys or commands outside the `markdown` file type.
- **Dependency gates:**
  - G1 (`…phase-1…md:73`, DI2 consumer, required before DI2 execution): **met** — DI1 merged to `main` as `c98aa19` (PR #1, 2026-10-03T11:00:09Z) with CI green; recorded at `rm261003abzp-roadmap-index.md:142-143` and `…phase-1…md:626-627`.
  - G2 and G3 (`rm261003abzp-roadmap-phase-2-obsidian-experience.md:70-71`, DI2 producer): future gates on DI3 and DI4 execution. DI2 must deliver `parseDoc` with block cache and `syntaxExtensions`, `markdownFileType` with `analyze` and the Markdown key scope, NoteIndex with `resolveLink`, the statusline segment framework, the `Picker` with preview, the `Prompt`, NoteIndex paths and frontmatter in summaries, and the `search` and `write` effects, evidenced by V4@R2, V5@R1, V6@R2, V18@R1 passing on the merged DI2 PR. They do not block DI2's discussion.
- **Accepted at:** Roadmap baseline approved (index Approval `:262-272`); post-DI1 synchronization approved by the user on 2026-10-03 (commit `2f907fa`). DI2 had no W binding in `.s1mple/work/active/` or `.s1mple/work/done/` before this work. Self-drive of this discussion approved by the user on 2026-10-03. Every revision listed above matches the current index, phase, design, requirement, and UI files as of this context.

### Previous Accepted Bindings

None

### Parent Synchronization

- **Registration or discussion update:** Pending parent synchronization. Proposed changes:
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md` — Delivery Items row RM261003ABZP-DI2@R2 (`:132`): Work `Pending` → `W261003FX70`; Work Progress row RM261003ABZP-DI2@R2 (`:143`): stage `Not started` → `Discuss`, evidence = the commit of this context document.
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-1-daily-usable-editor.md` — Progress row RM261003ABZP-DI2@R2 (`:627`): Work `Pending` → `W261003FX70`.
  - Evidence: the commit that adds this document. No parent file is modified by this work without explicit authorization.

## 1. User Input

### Original Input

Self-drive `s1mple-discuss` for DI2: choose options and designs that are stable, simple, and easy to maintain and extend; meet project requirements and standards; and meet industry standards and practices.

### Consolidated Requirement or Problem

Deliver RM261003ABZP-DI2@R2 (Navigation and links) on top of the merged DI1 editor. The folder becomes a navigable, linked knowledge base: leader with which-key; the picker family (files, recent, grep, headings, tags, backlinks, commands); palette and help filtered by file type; Markdown-scoped keymaps; XDG TOML config loading with keymap and option overrides; persisted per-workspace state (recents, jumps, open buffers, layout); Markdown `parseDoc` with the Obsidian `syntaxExtensions` registry; the worker-built NoteIndex with the documented resolution rule; link follow, jumps, `[[` completion, and the create prompt; tags; the backlinks side panel with link-mention; the outline; link-safe rename and move; statusline index and backlinks segments; and the 10,000-note V13 benchmark. DI2 completes PH1, so `v0.1.0` can ship after the phase exit evidence passes.

### Constraints and Assumptions

- The user delegated discussion decisions for this run; choices must favor stable, simple, maintainable, extensible designs that meet project and industry standards.
- Parent definitions are binding: DI2 cannot change the resolution order, rename format preservation, worker protocol semantics consumed by DI3/DI4, index persistence, or the Markdown-only scope of note keys (`…phase-1…md:511-516`).
- AppState fields and Action/Effect variants are introduced by the DI that first uses them; DI2's additions are listed at `…phase-1…md:190`, and the final shape must equal RM261003ABZP-DES2@R2 (`:192`).
- `src/core` stays pure; only `src/ui` imports `@opentui/*`; `src/workspace/index-worker.ts` follows the `workspace` layer rule (`…phase-1…md:111-112`).
- Every npm dependency is an exact pin; upgrades are deliberate (`.s1mple/docs/project.md`, Constraints).
- No work-process identifiers in code, comments, test names, or logs (`.s1mple/S1MPLE.md`, Implementation).
- CI runs on pull requests only; `bun run check` < 30 s and CI < 3 min remain obligations (RM261003ABZP-S10@R1).

## 2. Project Structure

- `src/core/state/` — reducer modules split by concern (`buffers`, `commands`, `disk`, `explorer`, `keys`, `save`, `status`, `update`, `init`, `types`); DI2 adds index, jumps, recents, side panel, and overlay state here.
- `src/core/kernel/commands/` — `registry.ts`, `keymap.ts`, `defaults.ts`; DI2 adds Markdown-scoped bindings, which-key data, and config overrides.
- `src/core/lang/markdown/` — only `file-type.ts` (source view, highlighter) exists; DI2 adds `doc.ts`, `blocks.ts`, `syntax.ts` and `analyze`.
- `src/core/features/` — does not exist yet; DI2 creates `features/links/{note-index,summarize,resolve,rename,mentions,fuzzy,commands}.ts` (`…phase-1…md:141`). `test/boundaries.test.ts:13` already lists `src/core/features/` as pure core.
- `src/core/config/schema.ts` — DI1 schema with four options; DI2 loads it from file.
- `src/workspace/` — `fs`, `watcher`, `ignore`, `trash`, `system`; DI2 adds `config-file.ts`, `state-file.ts`, `index-worker.ts`.
- `src/ui/overlays/` — `host`, `prompt`, `conflict`, `notify`; DI2 adds `whichkey`, `picker`, `completion`; `src/ui/views/side-panel.ts` is new.
- `src/app/{main,effects}.ts` — composition root and effect runner; DI2 adds worker start/restart, config and state loading, `search` and `saveState` effects.
- `test/bench/`, `scripts/bench-gate.ts` — DI1 benchmarks; DI2 adds the 10,000-note generator and V13 benchmark.
- `test/ui/`, `test/integration/`, `test/support/` — component and integration harnesses DI2 extends for UV4, UV5, V6.

## 3. Standards and Patterns

### Applicable Standards

- `test/boundaries.test.ts:9-42` — layer rules: `src/core/features/` and `src/core/lang/` are pure (no runtime, I/O, or `@opentui`); `src/core/kernel/` imports only the kernel with no packages; `src/workspace/` may import `src/core/`.
- `.s1mple/docs/languages/typescript.md` — strict TS 7, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; colocated `*.test.ts`; knip must report zero findings.
- `.s1mple/docs/languages/typescript.md`, Error Handling — a throwing `update` handler keeps the previous state and shows an error toast; adapters report failures as result actions.
- `rm261003abzp-design.md:428` — AppConfig invariant: unknown keys and invalid values produce errors with file and line; the invalid file is ignored as a whole and defaults apply.
- `rm261003abzp-design.md:408` — NoteIndex invariants: derived maps rebuilt only for changed paths; only Markdown files are summarized; resolution order is fixed; the index is never persisted (`…phase-1…md:185`).
- `rm261003abzp-design.md:716` — resolution is a pure function of index contents; rename never touches text outside link spans.
- `rm261003abzp-design.md:517` — duplicate command ids throw at startup; binding an unknown id or file type is a config error, not a crash; a command excluded by `filetypes` is a no-op with `not available for <type> files`.
- `…phase-1…md:272` — the main thread never scans or reads every note; the worker never writes files.
- `…phase-1…md:299` — the state file carries `"version": 1`; missing, corrupt, or unknown-version files load as empty state.
- `rm261003abzp-design.md:838` — `SO_LOG=debug` writes a log to `$XDG_STATE_HOME/so/so.log` without note content; DI1 deferred this to DI2's config work (`w261003hege-system-design.md:294`).

### Existing Patterns

- `src/core/kernel/commands/registry.ts:5-12` — `Command<Ctx, R>` is generic so the kernel never imports app state; `list(filetype)` (`:28-35`) already filters by file type.
- `src/core/kernel/commands/keymap.ts:41-68` — `lookup` checks `{mode, filetype}` before `{mode}` and merges which-key items from both levels; a complete binding wins over a longer one.
- `src/core/state/keys.ts:23-50` — key routing: overlays first, then the `:` line, then keymap lookup scoped by the active buffer's file type, then the vim engine. DI1 already passes `filetype` in the scope.
- `src/core/state/update.ts:21-26` — `Registries` (file types, editor kinds, commands, keymap) are injected into the pure reducer once at startup.
- `src/core/state/update.ts:29-66` — exhaustive `switch` over `Action` with a `never` check; new actions must be added here.
- `src/core/filetypes/registry.ts:35-43` — `FileType.analyze?(buf, prev)` is the hook for Markdown parsing.
- `src/app/main.ts:191-216` — post-first-frame work (watcher, trash, clipboard detection) runs in `setImmediate`; the worker start belongs here.
- `src/workspace/ignore.ts:21-58` — one `ExclusionMatcher` (hidden names, `node_modules`, nested `.gitignore`) shared by explorer and watcher; DI1 design states the DI2 worker reuses it (`w261003hege-system-design.md:1222`).
- `src/workspace/watcher.ts:9-14` — `OwnOps` suppresses echoes of the app's own writes and moves; rename rewrites must go through the same path.
- `src/core/state/explorer.ts:113-158` — explorer rename and move already repath open buffers, keeping text, undo, dirty state, and stamp.
- `src/ui/overlays/host.ts:68-94` — `OverlayHost` holds one view per overlay kind; each shows itself only while its kind is open.
- `src/ui/editors/registry.ts` — `editorViews` registers window views per editor kind.
- `scripts/bench-gate.ts:7-13` — benchmarks are registered in `TARGETS`/`BENCHES`; median of 5, fail above 2× target.

## 4. Architecture

```text
key → src/ui/input → store.dispatch(action) → core update(state, action, registries) → { state, effects }
                                                                                         │
     src/ui repaints (shell, statusline, OverlayHost[prompt, conflict, +whichkey, +picker, +completion], +side-panel)
                                                                                         │ effects
src/app/effects.ts (serial fs queue) ──► src/workspace/{fs, watcher, trash, system, +config-file, +state-file}
src/app/main.ts ──spawn after first frame──► +src/workspace/index-worker.ts (Bun Worker)
        ▲ indexBatch / indexReady / searchResults        │ scan, changed, removed, search
        └────────────────────────────────────────────────┘
core: state ─► kernel/{text, editor, vim, commands, view}, filetypes, lang/code,
               lang/markdown (+doc, +blocks, +syntax), +features/links, config
```

- `src/core/state` — owns AppState, actions, and effects; DI2 adds `analysis`, `index`, `jumps`, `recent`, `panels.side`, and overlay variants `picker | whichKey | palette | help | completion` (`…phase-1…md:190`).
- `src/core/kernel/commands` — the single extension point for actions; which-key, palette, help, and config overrides read it (RM261003ABZP-DES5@R2).
- `src/core/lang/markdown` — `parseDoc` with block cache and Obsidian `syntaxExtensions`; feeds `analyze`, the index summarizer, and later DI3's live preview (RM261003ABZP-DES6@R1).
- `src/core/features/links` — NoteSummary/NoteIndex, `resolveLink`, `planRename`, `linkMentionEdit`, fuzzy matching, link commands with `filetypes: ["markdown"]` (RM261003ABZP-DES7@R3).
- `src/workspace/index-worker.ts` — lists non-excluded files, summarizes notes, answers full-text search; never writes (`…phase-1…md:254-273`).
- `src/workspace/{config-file,state-file}.ts` — XDG TOML config and per-workspace JSON state (RM261003ABZP-DES14@R1).
- `src/ui/overlays/{whichkey,picker,completion}.ts`, `src/ui/views/side-panel.ts` — one `Picker` for every list source; which-key at 300 ms; completion popup never on the cursor row (RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1).

## 5. Code Flow

```text
Current (DI1):
so [path] → resolve workspace → registries() → createRenderer → createStore(initialState{config: defaults})
          → listDir("") [+ read(file)] → first frame → setImmediate: watcher, trash, clipboard
key → handleKeyAction → overlay? → ":" line? → keymap.lookup({mode, filetype}) → command | prefix(pending) | vim engine
explorer rename/move → FsOp effect → fsResult → repath buffers (links untouched)

Target (DI2, from …phase-1…md:162-171):
so [path] → resolve → load config (invalid → defaults + toast) → load state → first frame
          → spawn worker → scan + summarize → indexBatch* (◌ indexing n/total) → indexReady
                          └─ crash → restart once → crash → "index unavailable"
<leader>lr → planRename → prompt "31 links in 12 files" → Enter → in-memory edits + write effects + fs rename
```

1. `src/app/main.ts:139-145` resolves the workspace; missing paths exit 2.
2. `src/app/main.ts:78-87` builds registries (file types, built-in commands, default bindings); config overrides are not applied yet.
3. `src/core/state/init.ts:40` seeds `config: defaults`; no config file or state file is read.
4. `src/app/main.ts:188-189` lists the root and reads the opened file before the first frame.
5. `src/app/main.ts:192-216` starts the watcher and platform detection after the first frame.
6. `src/core/state/keys.ts:36-50` resolves keys through the keymap with the buffer's file type, then the vim engine; a pending prefix is kept in `vim.pending` but no which-key overlay exists.
7. `src/core/state/explorer.ts:113-135` handles rename and move results by repathing buffers; DI2 routes `file.rename` and `file.move` through `planRename` (`…phase-1…md:158`).

## 6. Boundaries

### In Scope

- DI2 scope as defined at `…phase-1…md:447-472`: `core/lang/markdown` parsing and syntax extensions; `core/features/links`; the index worker with scan, watcher updates, full-text search, and restart-once; which-key, pickers, palette, help, Markdown-scoped bindings and the unavailable notice; outline and backlinks side panel (pickers at 80×24); link follow, jumps, create prompt, `[[` completion, rename and move with link rewrite; XDG TOML config with keymap and option overrides; the state file; statusline index and backlinks segments; the 10,000-note generator and V13 benchmark in CI.
- `SO_LOG=debug` logging, assigned to DI2's config work by the DI1 design (`w261003hege-system-design.md:294`, `rm261003abzp-design.md:838`).
- Re-passing RM261003ABZP-V1@R1, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 in DI2's CI run (`…phase-1…md:591`).
- Producing gates G2 and G3 for PH2 (`…phase-2…md:70-71`).

### Out of Scope

- Rendering links as styled text and the unresolved-link error colour (DI3); inline embeds (DI3); calendar and template pickers (DI4); reading or writing `.obsidian/` (`…phase-1…md:473-477`).
- Live and reading views, widgets, the browser preview (DI3); daily notes, templates, Bases (DI4).
- Config options owned by later DIs: `preview.*` (DI3), `daily.*` and `templates.*` (DI4) (`rm261003abzp-design.md:426`).
- Everything in the index's Deferred Scope (`rm261003abzp-roadmap-index.md:227-256`), including code intelligence and a plugin API.
- Persisting the NoteIndex; writing any non-user file into the workspace.

### Interfaces and Dependencies

- `Action`/`Effect` unions (`src/core/state/types.ts:139-168`) — DI2 adds `indexBatch | indexReady | searchResults | configLoaded | stateLoaded` and `search | saveState` (`…phase-1…md:221-222`).
- `AppState` (`src/core/state/types.ts:114-137`) and `Overlay` (`:105-108`) — DI2 additions per `…phase-1…md:190`.
- `TimerId` (`src/core/state/types.ts:35-38`) — which-key delay (300 ms) and state-save debounce (2 s) need timer ids.
- Worker protocol `ToWorker`/`FromWorker` (`…phase-1…md:259-267`) — semantics consumed by DI3 and DI4; frozen by the downstream boundary.
- `NoteSummary` and `NoteIndex` (`rm261003abzp-design.md:402-409`); `resolveLink` and `planRename` signatures (`rm261003abzp-design.md:707-711`); `linkMentionEdit` (`…phase-1…md:280-286`).
- `Doc`/`Block` model and `parseDoc`/`syntaxExtensions` (`rm261003abzp-design.md:372-380`, `:578-590`).
- `AppConfig` (`rm261003abzp-design.md:422-431`) versus current `ConfigSchema` (`src/core/config/schema.ts:3-13`).
- `Picker` component contract (`rm261003abzp-ui-design.md:1352-1430`): `PickerSource`, preview via EditorView, counter `n/total`, preview only ≥ 100 cols.
- `readTextFile` and `atomicWrite` (`src/workspace/fs.ts:54`, `:99`) and `OwnOps` (`src/workspace/watcher.ts:9-14`) for rename and link-mention writes.
- Bun `Worker` in `bun build --compile` binaries (`package.json` `build`; `.github/workflows/release.yml:25-26`).
- New packages required by RM261003ABZP-DES6@R1 (`rm261003abzp-design.md:588`): `mdast-util-from-markdown`, `micromark-extension-gfm`, `mdast-util-gfm`, `micromark-extension-math`, `mdast-util-math`, `yaml`. None is in `package.json` today; `Bun.TOML.parse` is built in (RM261003ABZP-DES14@R1).

## 7. Unknowns

- **Markdown parser dependencies and pins:** none of the DES6 packages are installed. Their exact versions, whether `micromark-extension-math`/`mdast-util-math` are needed in DI2 (math rendering is DI3), and whether `yaml` or a lighter frontmatter parser serves `tags`/`aliases` must be decided and pinned.
- **TOML error line numbers:** V4@R2 (c) requires a notification naming `config.toml:7`. Whether `Bun.TOML.parse` errors at Bun 1.4.2 expose a line number, and how zod validation errors map back to TOML lines for unknown keys and invalid values, is unverified.
- **`planRename` reading closed files:** the design signature `planRename(ix, from, to, read: (p) => string)` (`rm261003abzp-design.md:710`) takes a synchronous reader, but `core` is pure and the main thread must not read every note. How closed-file texts reach the planner (worker-provided spans or text, an effect round-trip, or summary-stored link positions) is open, as is re-validation against current disk text before writing.
- **Worker in compiled binaries:** the build and release commands compile only `src/app/main.ts`. Whether Bun 1.4.2 `--compile` bundles a `new Worker(...)` entry automatically or needs it as an extra entry point, and how the worker resolves its path from the binary, is unverified.
- **Leader key configuration:** `<leader>` is hard-coded to Space in `src/core/kernel/vim/keys.ts:10`, while AppConfig lists a `leader` option (`rm261003abzp-design.md:426`). Whether DI2 makes the leader configurable, and which other AppConfig options (`editor.tabWidth`, `wrap`, `relativeNumbers`) DI2 adds, is unsettled; the DI2 scope names only keymap overrides, `escTimeoutMs`, autosave, and `theme`/`color` (`…phase-1…md:469`).
- **`:ConfigReload`:** AppConfig is "read at startup and on `:ConfigReload`" (`rm261003abzp-design.md:427`); the DI2 scope does not mention reload. Whether DI2 ships it, and how rebinding a frozen `Keymap` works at runtime, is open.
- **Fuzzy scoring constants, picker preview content, and search result limits:** explicitly left to the DI2 discussion (`…phase-1…md:511`). The UI design fixes only "consecutive and word-start matches rank first" and the UV4 ranking assertions (`srd` → `projects/so-roadmap.md`, `back` → `link.backlinks`).
- **Picker preview for notes:** the Picker contract renders note previews in the reading view (`rm261003abzp-ui-design.md:1391`), which DI3 delivers. DI2 needs an interim preview (source view or plain text) that DI3 can switch without contract change.
- **Index update on buffer save and open-buffer analysis:** NoteIndex updates "per file event and per buffer save" (`rm261003abzp-design.md:407`). Whether the main thread summarizes a saved or dirty buffer from its `Doc` (and whether backlinks reflect unsaved edits) or always defers to the worker is unspecified.
- **Mockup acceptance state:** `ui-mockups/manifest.md:3-5`, `:92` shows RM261003ABZP-M1@R2 and RM261003ABZP-M3@R2 (cycle 3, drawing the AD4 file-type states) as `Draft`, awaiting the user's review; the binding stays M1@R1 and M3@R1 plus AD4. If the user accepts R2 during DI2, the binding must be reconciled; no behavior difference is expected because AD4 already accepts those states.
- **Jump list and recents semantics:** which actions push a jump (link follow only, or also picker opens and `:e`), list length limits, and which open buffers and window layouts restore on start (and how restored buffers interact with the explorer-focused startup in `src/core/state/init.ts:28-37`) are not specified upstream.
- **Rename/move trigger surface:** DI2 routes explorer `r`/`m` through `planRename` and adds `<leader>lr`; whether link rewriting applies to non-Markdown files moved through the explorer (no links to rewrite, but Markdown links may target them) and how folder moves are planned is not specified.
