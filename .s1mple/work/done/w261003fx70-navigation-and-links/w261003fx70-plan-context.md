# W261003FX70 Plan Context

## Status

`Ready`

The finalized system design is the only governing design, it agrees with the requirements and the discussion context, and the roadmap baseline is unchanged since the accepted binding. Gate G1 is met. Three mechanical gaps were resolved from project evidence (section 7); none blocks planning.

## 1. Sources

| Source | Path | Use |
|---|---|---|
| s1mple instructions | `.s1mple/S1MPLE.md` | Workflow behavior and required context |
| Project document | `.s1mple/docs/project.md` | Reusable project baseline |
| System design | `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md` | Technical authority (`Finalized System Design`, commit `1aa1fae`) |
| UI design | Not applicable — this Work has no UI design; the accepted parent UI design (`rm261003abzp-ui-design.md`) and mockups are bound through W261003FX70-REQ1@R1 and realized by system design DES9 | Visual realization reference only |
| System requirements | `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-requirements.md` | Required system behavior (`Ready for System Design`) |
| UI requirements | Not applicable — no Work-level UI requirements; parent UREQ5@R2, UREQ6@R1, UREQ1@R2, UREQ7@R2, UREQ11@R1 are bound through REQ1@R1 | — |
| Research | Not needed — research was skipped; local experiments are recorded in the requirements' Discussion Evidence | — |
| Discussion context | `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-discuss-context.md` | Roadmap binding, constraints, DI1 surfaces |
| UI context | Not applicable — no Work-level UI context | — |
| Roadmap sources | `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md`, `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, `ui-mockups/manifest.md` | Validate the accepted binding, assigned scope, and gates |
| Additional project files | `.s1mple/docs/communication.md`, `.s1mple/docs/languages/typescript.md`, `package.json`, `knip.json`, `.github/workflows/{ci,release}.yml`, `scripts/{bench-gate,record-vim}.ts`, `src/core/kernel/vim/{keys,motions}.ts`, `src/ui/editors/text-view.ts`, `src/core/state/{types,commands}.ts`, `test/` tree | Confirm cited current shapes and resolve gaps |

## 2. Governing Design Handoff

### Source Authority

- **System design:** `w261003fx70-system-design.md` — authoritative for every file, symbol, contract, flow, success criterion (S1–S21), and verification case (V1–V59) in this Work, including UI module structure, state, and wiring (sections 3–8; decisions DES1–DES11 in section 9).
- **UI design:** Not applicable — no Work UI design. Look and feel follows the accepted parent UI design and mockups (M1@R1, M3@R1, M4@R1, AD4) as bound in the discussion context.
- **Alignment:** Single governing design

### Approved Direction

DI2 extends the merged DI1 editor additively (design section 1, Goals). Cost decides where work runs (section 2, Proposed Architecture): the index worker scans, summarizes, and searches; the main thread runs only a linear Markdown scan; mdast parses lazily per block; pure planning (resolution, rename, ranking, picker state) lives in `src/core`. Link edits are planned purely, closed files are re-validated span by span at write time, and the operation is refused while indexing. Keys, config, and discovery derive from registries: one effective keymap per config (`keymapFor`), one pure `PickerSource` model. Navigation state persists outside the workspace. `editor.*` display options (DES11) are delivered here.

### Design Coverage

| Source | Chain | Planning meaning | Canonical detail |
|---|---|---|---|
| System design | `REQ1@R1 → DES1, DES2, DES3, DES4, DES6, DES7, DES8, DES9, DES10 → S1, S5, S6, S15, S18, S20 → V8, V22, V42–V46, V48, V49, V52` | Every inherited DI2 obligation and G2/G3 output exists; protocol additive; DI1 suites re-pass | Section 1 Requirement Coverage; Assigned Parent Obligation Coverage |
| System design | `REQ2@R1 → DES2, DES7 → S13, S19 → V17, V18, V35, V53, V55` | Seven exact pins, per-package import homes, TOML lines from AST | Section 7 `test/boundaries.test.ts…`, `src/core/config/toml.ts` |
| System design | `REQ3@R1 → DES2, DES10 → S2–S5 → V1–V7, V49–V51` | Two-level Markdown model within budgets | Section 7 `src/core/lang/markdown/*`, `src/core/state/buffers.ts` |
| System design | `REQ4@R1 → DES4, DES10 → S5, S11 → V36, V47, V49, V50, V52, V56` | Worker as second compile entrypoint; restart once | Section 7 `src/workspace/index-worker.ts`, `src/app/index-host.ts` |
| System design | `REQ5@R1 → DES5 → S12 → V25, V37` | Main-thread index freshness | Section 7 `src/core/state/index.ts` |
| System design | `REQ6@R1 → DES3, DES6 → S7–S10 → V11–V15, V24, V34, V38` | Link-safe rename, move, link-mention | Section 7 `rename.ts`, `mentions.ts`, `link-edits.ts`, `effects.ts` |
| System design | `REQ7@R2 → DES7 → S13–S15 → V17–V20, V31, V33, V39, V41` | Config file, strict schema, reload, leader, debug log | Section 7 `config/*`, `state/{config,keymap}.ts`, `workspace/{config-file,log}.ts` |
| System design | `REQ8@R1 → DES8 → S16 → V26–V28, V32, V40` | Jumps, recents, session restore | Section 7 `state/{jumps,recent,session}.ts`, `workspace/state-file.ts` |
| System design | `REQ9@R1 → DES3, DES9 → S17 → V16, V29, V34, V42` | Fuzzy ranking, grep limits, preview | Section 7 `kernel/text/fuzzy.ts`, `state/picker.ts`, `ui/overlays/picker.ts` |
| System design | `REQ10@R1 → DES11 → S21 → V18, V19, V39, V48, V57–V59` | Tab width, wrap, relative numbers | Section 7 `kernel/view/wrap.ts`, vim files, `ui/editors/text-view.ts` |
| UI design | Not applicable | Parent UI chains (US3/UV4, US4/UV5, US1/UV1, US5/UV6, US9/UV10) are realized through V42–V46 | Design section 1, UI obligations |

### Applicable Code Shapes

| Source shape | Target | Planning use |
|---|---|---|
| Section 7 `src/core/state/types.ts`, `update.ts` | `AppState`, `Action`, `Effect`, `Overlay`, `TimerId`, `Registries`, `createUpdate` | Protocol additions first; every later group adds handlers to the exhaustive switch |
| Section 7 `src/core/lang/markdown/{blocks,syntax,scan,doc,mdast,file-type}.ts` | `splitBlocks`, `syntaxExtensions`, `scanBlock`, `parseDoc`, `blockNode`, `markdownFileType.analyze` | Markdown model tasks |
| Section 7 `src/core/state/buffers.ts`, `src/ui/editors/text-view.ts` | `withAnalysis`, `EditorView.rows` | Analysis computed in `update`, read in UI |
| Section 7 `src/core/features/links/*` | `summarize`, `NoteIndex`/`applySummaries`, `resolveLink`/`linkText`, `planRename`/`renameImpact`, `linkMentionEdit`, `linkAt`, `linkCommands`/`linkBindings`/`linkGroups` | Links core tasks |
| Section 7 `src/core/kernel/text/fuzzy.ts` | `fuzzyScore`, `rankBy` | Ranking task |
| Section 7 `src/workspace/index-worker.ts`, `src/app/index-host.ts` | `ToWorker`, `FromWorker`, `IndexHost`, `createIndexHost` | Worker tasks |
| Section 7 `src/core/state/index.ts` | `onIndexBatch`, `onIndexReady`, `onIndexFailed`, `summarizeSaved`, `indexAfterFsOp`, `indexAfterFileEvent`, `nextSearchId` | Freshness tasks |
| Section 7 `src/core/state/link-edits.ts`, `explorer.ts`, `src/app/effects.ts` | `requireIndex`, `startRename`, `beginRewrite`, `onEditsApplied`, `applyEdits` case | Link-safe edit tasks |
| Section 7 `src/core/config/{schema,toml}.ts`, `src/core/state/{config,keymap}.ts`, kernel `keymap.ts`/`keys.ts`, `workspace/{config-file,log}.ts` | `ConfigSchema`, `parseConfig`, `onConfigLoaded`, `validateBindings`, `keymapFor`, `splitKeys` leader, `configPath`, `createLogger` | Config tasks |
| Section 7 `src/core/kernel/commands/defaults.ts`, `src/core/state/{commands,keys}.ts` | `defaultBindings`, `defaultGroups`, `EX_ALIASES`, `executeEx`, `builtins` (`file.save`), `handleKeyAction`, `applyVimEffects`, `envOf` | Key routing tasks |
| Section 7 vim `types/engine/motions/operators` | `VimEffect.jumped`, `VimEnv.tabWidth`, `JUMP_MOTIONS`, `cursorDisplayCol`, `colForDisplay`, `shift` | Jumps and tab width tasks |
| Section 7 `src/core/kernel/view/wrap.ts` | `cellWidth`, `displayWidth`, `wrapLine`, `rowOf` | Display options tasks |
| Section 7 `state/{jumps,recent,session}.ts`, `workspace/state-file.ts`, `app/lifecycle.ts` | `pushJump`, `jumpBack`, `jumpForward`, `touchRecent`, `snapshotSession`, `onStateLoaded`, `sessionChanged`, `parsePersisted`, `statePath`, `saveStateFile`, `installLifecycle` | Session tasks |
| Section 7 `state/{whichkey,picker,completion,side-panel,status}.ts` | `armWhichKey`, `PickerSource`, `pickerSources`, `openPicker`, `pickerKey`, `onSearchResults`, `onPreviewLoaded`, `maybeOpenCompletion`, `toggleSidePanel`, `statusSegments` | Discovery state tasks |
| Section 7 `src/ui/…` (overlays, side panel, prompt, window-tree, shell, theme, statusline) | `WhichKeyView`, `PickerView`, `CompletionView`, `SidePanelView`, `PromptView`, `WindowTree`, `createShell`, `themeOf` | Discovery UI tasks |
| Section 7 `src/app/main.ts` | `registries`, `main` | Final wiring task |
| Section 7 `test/boundaries.test.ts`, `test/repo.test.ts`, `knip.json`, `package.json`, `release.yml` | `PACKAGE_HOMES`, `checkImports`, "compile includes the worker", `entry`, `scripts.build` | Toolchain tasks |
| Section 7 `scripts/bench-gate.ts`, `test/bench/*`, `test/fixtures/generate.ts` | `TARGETS`, `BENCHES`, `runOnce`, `makeNoteWorkspace` | Benchmark tasks |

### Runtime Flow

```text
main → resolveWorkspace → registries() → createStore(initialState)
     → configLoaded(parseConfig(readConfigText(configPath(env))))   invalid → defaults + "config.toml:<line>: …" toast
     → stateLoaded(parsePersisted(readStateFile(statePath)), restore: no file argument)
     → first frame → setImmediate: watchWorkspace (+ indexHost.notify) ; indexHost.start(root)
          worker → batch* → indexBatch (◌ indexing n/total) → ready → indexReady ("index ready")
          crash → restart once → crash → indexFailed final → "index unavailable"
key → overlays (conflict/prompt, whichKey, picker, completion) → side panel → ":" line
    → keymapFor(reg, config).lookup({mode, filetype}) → command (filetype check) | prefix (300 ms which-key) | vim engine
edit → withAnalysis → parseDoc(text, prev) → Doc.scan (block cache)
rename/move → requireIndex → prompt impact → planRename → fs op → fsResult ok
     → open buffers: applyBufferEdits (one undo step) ; closed: applyEdits (validate spans → atomicWrite) → editsApplied
```

Full flows: design section 5.

### Roadmap Validation

- **Accepted binding:** `w261003fx70-discuss-context.md`, Roadmap Binding (commit `3f01513`): RM261003ABZP-PH1@R2, RM261003ABZP-DI2@R2.
- **Parent-to-child coverage:** `w261003fx70-system-design.md`, section 1, Assigned Parent Obligation Coverage (eight coverage groups, all `System design required`). No Work-level UI design; UI obligations map to DES9 and V42–V46.
- **Baseline assessment:** Aligned. `git log` shows no change to `.s1mple/work/done/rm261003abzp-so-v1/` after `2f907fa`, the commit the binding was accepted against. Checked on 2026-10-03: `rm261003abzp-roadmap-index.md:132` (DI2@R2, Work `Pending`), `:143` (stage `Not started`), `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73` (G1), `:591` (integration obligation), `:627` (DI2 progress `Pending`), `rm261003abzp-roadmap-phase-2-obsidian-experience.md:70-71` (G2, G3), and `ui-mockups/manifest.md:3-5`, `:89-93` (M1@R2 and M3@R2 still `Draft`; binding stays M1@R1, M3@R1, AD4).
- **Unresolved impacts:** None. Nine parent synchronization updates remain pending authorization (design section 1, Parent Synchronization, rows 1–9). They are refinements that change no contract consumed by DI3 or DI4 and do not block planning.

### Cross-Work Dependency Gates

- **G1 — DI1 foundation**
  - **Parent Gate:** `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`
  - **Producer:** RM261003ABZP-DI1@R2 / W261003HEGE
  - **Required Output:** store and Action/Effect unions, `CommandRegistry` and `Keymap` with `KeyScope`, `layoutText`, `FileTypeRegistry`, `lowlightHighlighter`, OpenTUI shell with `editorViews`, `OverlayHost`, `Prompt`, `readTextFile`, `atomicWrite`, watcher, effect runner, `bun run check`, CI, bench harness
  - **Required Before:** DI2 execution
  - **Evidence / Pending Condition:** Met — DI1 merged to `main` as `c98aa19` (PR #1, 2026-10-03T11:00:09Z) with CI green (`…phase-1…md:626`).
  - **Integration Owner:** RM261003ABZP-DI2@R2 / W261003FX70
- **G2 — Markdown and link foundations for DI3**
  - **Parent Gate:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md:70`
  - **Producer:** RM261003ABZP-DI2@R2 / W261003FX70
  - **Required Output:** `parseDoc` with block cache and `syntaxExtensions`; `markdownFileType` with `analyze` and the Markdown key scope; NoteIndex with `resolveLink`; statusline segment framework; `Picker`
  - **Required Before:** DI3 execution (future; does not block this Work)
  - **Evidence / Pending Condition:** Pending — DI2 PR merged with RM261003ABZP-V4@R2, V5@R1, V6@R2, V18@R1 passing; PH1 exit evidence recorded. This Work proves them through V8–V15, V22, V38, V39, V42–V44, V48.
  - **Integration Owner:** RM261003ABZP-DI3@R2
- **G3 — Picker, prompt, index, and effects for DI4**
  - **Parent Gate:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md:71`
  - **Producer:** RM261003ABZP-DI2@R2 / W261003FX70
  - **Required Output:** `Picker` with preview, `Prompt`, NoteIndex paths and frontmatter in summaries, `FileTypeRegistry` and `editorViews`, `search` and `write` effects
  - **Required Before:** DI4 execution (future; does not block this Work)
  - **Evidence / Pending Condition:** Pending — as G2.
  - **Integration Owner:** RM261003ABZP-DI4@R2

## 3. Binding Constraints

| Constraint | Source | Planning implication |
|---|---|---|
| Follow the plan built from finalized designs; every delegated agent reads `.s1mple/S1MPLE.md` | `.s1mple/S1MPLE.md` §1–3 | Execution artifacts repeat the entrypoint requirement |
| Do not use the native `Explore` subagent; prefer `s1mple-explore` when delegation is needed | `.s1mple/S1MPLE.md` §3 Exploration | Implementers inspect directly |
| Keep it lean and simple | `.s1mple/S1MPLE.md` Implementation | No abstractions beyond the design's symbols |
| No work, requirement, design, phase, goal, task, or verification identifiers in comments, identifiers, test names, SQL comments, or logs | `.s1mple/S1MPLE.md` Implementation; `languages/typescript.md:38` | Test names describe behavior (e.g. "rename keeps every resolved link"), never `V12` or `DES6` |
| Verification: not established beyond project checks | `.s1mple/S1MPLE.md` Verification | Use `bun run check`, `bun run test:ci`, `bun run bench`, `bun run build` and the design's V cases |
| Delivery: open a PR, make CI pass, resolve conflicts; move the work folder to `work/done/` and update `.s1mple/` references; push again with green CI; never force-push or merge without approval | `.s1mple/S1MPLE.md` Delivery | Final group covers PR, CI, folder move, second push |
| `src/core` pure; `src/core/kernel` package-free; only `src/ui` imports `@opentui/*`; worker follows the `src/workspace` rule | `test/boundaries.test.ts:9-42`; project.md Boundaries | Place every file per design section 4; `fuzzy.ts` and `wrap.ts` import nothing outside the kernel |
| Exact npm pins; `bun.lock` committed; `--frozen-lockfile` | project.md Constraints; `test/repo.test.ts` | Add packages with `bun add` (exact via `bunfig.toml`) |
| No TypeScript compiler API dependency | project.md Constraints | No tooling based on `ts` API |
| Strict TS 7 (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`) | `languages/typescript.md` | Type-only imports use `import type` |
| knip zero findings | `languages/typescript.md:32` | Worker added to `knip.json` `entry`; no unused exports |
| `update` pure and synchronous; adapters report failures as actions | `languages/typescript.md` Error Handling; `src/core/state/update.ts` | New handlers only in `createUpdate`; every fallible effect answers with one action |
| `bun run check` < 30 s, CI < 3 min | RM261003ABZP-S10@R1 (requirements Constraints) | Benches and PTY tests stay out of `check`; property tests keep bounded iterations |
| Main thread never scans every note; worker never writes | `…phase-1…md:272` | Only `applyEdits`/`write` on the main thread's serial queue write files |
| Resolution order, rename format preservation, worker protocol semantics fixed; index never persisted; note keys only in `markdown` scope | `…phase-1…md:511-516` | Protocol additions are optional fields only |
| One Work, one PR; CI pull-request only | requirements Constraints; project.md CI Checks | Single branch `feat/rm261003abzp-di2-navigation-and-links` |
| Parent files are not edited without explicit authorization | discussion context Parent Synchronization | Parent sync rows stay pending in the plan index |
| Commit only after `bun run check` passes | `languages/typescript.md:55` | Each group ends with `bun run check` |

## 4. Supporting Evidence

### Requirements

| Requirement | Design coverage | Required outcome |
|---|---|---|
| `W261003FX70-REQ1@R1` | DES1–DES4, DES6–DES10 | Every RM261003ABZP-DI2@R2 obligation and G2/G3 output delivered additively; DI1 suites re-pass |
| `W261003FX70-REQ2@R1` | DES2, DES7 | `mdast-util-from-markdown` 2.0.3, `micromark-extension-gfm` 3.0.0, `mdast-util-gfm` 3.1.0, `micromark-extension-math` 3.1.0, `mdast-util-math` 3.0.0, `yaml` 2.9.1, `toml-eslint-parser` 1.0.3 pinned and imported only from their homes |
| `W261003FX70-REQ3@R1` | DES2, DES10 | Linear scan + lazy per-block mdast; block cache; conformance; budgets hold |
| `W261003FX70-REQ4@R1` | DES4, DES10 | Worker compiled as second entrypoint; spawned after first frame; restart once |
| `W261003FX70-REQ5@R1` | DES5 | Saves, explorer ops, link edits, and external changes reach the index without a rescan |
| `W261003FX70-REQ6@R1` | DES3, DES6 | Rename/move/link-mention keep every resolved link; validated closed-file writes; refused while indexing |
| `W261003FX70-REQ7@R2` | DES7 | XDG `config.toml` with `config.toml:<line>` errors, reload, leader, `SO_LOG=debug` log, `editor` table accepted |
| `W261003FX70-REQ8@R1` | DES8 | Neovim-equivalent jumps, MRU recents, session restore on folder start, state file `0600` outside the workspace |
| `W261003FX70-REQ9@R1` | DES3, DES9 | fzf v1 ranking with smart-case; literal grep debounced 100 ms, capped 1,000; preview only ≥ 100 cols |
| `W261003FX70-REQ10@R1` | DES11 | `editor.tabWidth` (1–16, default 8), `editor.wrap` (default `true`), `editor.relativeNumbers` (default `true`) |

### Research Findings

Not needed — no research artifact; the requirements' Discussion Evidence records the local experiments (TOML line reporting, compiled-binary worker, mdast timing) that the design already applies.

## 5. Project Implementation Context

### Relevant Structure

```text
src/
├── app/{main,effects,lifecycle}.ts            (+ index-host.ts)
├── core/
│   ├── config/schema.ts                       (+ toml.ts)
│   ├── features/                              (new: links/*)
│   ├── filetypes/registry.ts
│   ├── kernel/{commands,editor,text,view,vim}/ (+ text/fuzzy.ts, view/wrap.ts)
│   ├── lang/{code,markdown/file-type.ts}      (+ markdown/{blocks,syntax,scan,doc,mdast}.ts)
│   └── state/{types,update,init,keys,commands,buffers,save,disk,explorer,status,store,result}.ts
│                                              (+ index, link-edits, config, keymap, jumps, recent, session,
│                                                 whichkey, picker, completion, side-panel)
├── ui/{shell,theme,input}.ts, editors/, overlays/{host,prompt,conflict,notify}.ts, views/
│                                              (+ overlays/{whichkey,picker,completion}.ts, views/side-panel.ts)
└── workspace/{fs,watcher,ignore,trash,system}.ts (+ index-worker, config-file, state-file, log)
test/ boundaries, repo, vim/, ui/, integration/, e2e/, bench/, fixtures/, support/
scripts/ bench-gate.ts, record-vim.ts
```

### Established Patterns

| Pattern | Evidence | Planning use |
|---|---|---|
| Exhaustive `Action` switch with `never` check | `src/core/state/update.ts:29-66` | Each new action gets a case; type check fails otherwise |
| Registries injected once into the pure reducer | `src/core/state/update.ts:21-26` | DES7 replaces `keymap` with derived keymaps |
| Keymap lookup by `{mode, filetype}` then `{mode}` | `src/core/kernel/commands/keymap.ts:41-68` | Markdown-scoped link bindings |
| Command registry filtered by file type | `src/core/kernel/commands/registry.ts:28-35` | Palette, help, `:` completion |
| Post-first-frame work in `setImmediate` | `src/app/main.ts:191-216` | Worker start |
| One `ExclusionMatcher` for explorer and watcher | `src/workspace/ignore.ts:21-58` | Worker scan reuses it |
| `OwnOps` echo suppression | `src/workspace/watcher.ts:9-28` | `applyEdits` calls `noteWrite` |
| Serial file-system queue | `src/app/effects.ts:66-73` | `applyEdits` joins it |
| Bench registry, median of 5, 2× gate | `scripts/bench-gate.ts:7-13` | New targets |
| Vim expectations recorded from Neovim 0.11.x | `scripts/record-vim.ts:1-2`, `:30` (`assertNvim011`) | V27 cases need a 0.11 recording |
| Colocated unit tests, repo suites in `test/` | `languages/typescript.md:53` | Test placement per design section 8 |

### Code Surfaces

| Path | Current symbol or wiring | Intended change | Evidence |
|---|---|---|---|
| `package.json` | `dependencies`, `scripts.build` (single entrypoint) | Seven pins; build lists the worker | `package.json` |
| `.github/workflows/release.yml` | two compile loops, `src/app/main.ts` only | Add `src/workspace/index-worker.ts` | `release.yml:25-26` |
| `knip.json` | `entry` scripts and tests | Add the worker | `knip.json` |
| `src/core/state/types.ts` | `Overlay` (prompt, conflict), `Action` (13 variants), `Effect` (9 kinds) | DI2 fields, overlays, actions, effects, timer ids | `types.ts:105-168` |
| `src/core/state/commands.ts` | `EX_ALIASES` `w`/`write` → `buffer.write`; builtin `buffer.write` | Rename to `file.save`; discovery and jump builtins | `commands.ts:46-47`, `:261`; `keys.test.ts:198` |
| `src/core/kernel/vim/keys.ts` | `"<leader>": " "` constant | Leader parameter to `splitKeys` | `keys.ts:10` |
| `src/core/kernel/vim/motions.ts` | `const TABSTOP = 8` | Tab width from `VimEnv` | `motions.ts:34` |
| `src/ui/editors/text-view.ts` | `TABSTOP = 8`, `GUTTER = 5` | Tab width, gutter width, wrap, `›`, analysis from state, `paintPreview` | `text-view.ts:20-22` |
| `scripts/bench-gate.ts` | `TARGETS { sourceKeystrokeP95: 16, openFile: 50 }` | Add `firstFrame`, `indexReady`, `indexingKeystrokeP95`; `runOnce` args | `bench-gate.ts:8-13` |
| `test/boundaries.test.ts` | `checkImports` layer/package policy | `PACKAGE_HOMES` | `boundaries.test.ts:62-85` |
| Other `src` files | Per design section 4 | Per design section 7 | Design sections 4, 7 |

### Verification Surfaces

| Suite or check | Location or command | Required verification |
|---|---|---|
| Fast gate | `bun run check` | Biome, `tsc`, knip, unit suites (V1–V35, V52–V58 except V47); < 30 s |
| Component, integration, e2e | `bun run test:ci` | V36–V48, V59 on `ubuntu-24.04` and `macos-15` |
| Benchmarks | `bun run bench` (Linux CI) | V49–V51; medians ≤ 2× target; PH1 exit needs medians below targets |
| Binary build | `bun run build` | Compiles main and worker (V52); V47 runs the output |
| Vim recordings | `NVIM=<path-to-nvim-0.11.x> bun run record:vim` | V27 cases added to `test/vim/expected.json` |
| Frozen lockfile | `bun install --frozen-lockfile` | V55 |
| CI | `.github/workflows/ci.yml` (pull request only) | `check`, `test:ci` matrix, Linux `bench` |

## 6. Additional Inspections

| Planning question | Files inspected | Finding |
|---|---|---|
| Has the roadmap changed since the binding? | `git log -- .s1mple/work/done/rm261003abzp-so-v1/`; index, phase files, manifest | No commit after `2f907fa`; rows and gates match the binding |
| Do the design's cited current shapes still hold? | `keys.ts:10`, `motions.ts:34`, `text-view.ts:20-22`, `commands.ts:46-47,261`, `types.ts:105-168`, `bench-gate.ts:8-13`, `release.yml:25-26`, `package.json` | All match |
| Does CI build `dist/so` before `test:ci` for V47? | `.github/workflows/ci.yml` | No build step exists; design section 4 does not modify `ci.yml` |
| Is Neovim 0.11.x available for V27 recordings? | `which nvim`; `scripts/record-vim.ts:1-2,30` | Local `nvim` is 0.12.4; the script requires 0.11.x and accepts `NVIM=/path` |
| Do all section 8 test files appear in the section 4 tree? | Design sections 4 and 8; `test/` tree | Section 8 adds files absent from section 4: `test/integration/log.test.ts` (V41), `test/ui/theme.golden.test.ts` (V46; does not exist yet), `src/core/state/links.test.ts` (V23), `src/core/kernel/vim/tab-width.test.ts` (V58), plus colocated unit tests; section 4 states colocated tests are listed in section 8 |
| Where does V54 (obsolete references) run? | Design section 8 Non-test, section 7 `text-view.ts` invariants | Must run in `bun run check`; no file named |

## 7. Planning Gaps

| Gap | Classification | Evidence or blocker |
|---|---|---|
| V47 needs `dist/so`, but CI's `test` job has no build step | `Resolved from project evidence` | `test/e2e/binary-index.test.ts` runs `bun run build` in its own setup (design: "Real: `bun run build` output"); `ci.yml` stays unchanged, matching design section 4 |
| V27 needs Neovim 0.11.x; local `nvim` is 0.12.4 | `Resolved from project evidence` | `scripts/record-vim.ts` accepts `NVIM=/path`; execution downloads an official Neovim 0.11.x release into a temporary directory outside the repository and runs `NVIM=<path> bun run record:vim` |
| V54 has no named file | `Resolved from project evidence` | Implement as a case in `test/repo.test.ts`, which already runs in `bun run check` and scans repository files |
| Section 8 test files absent from section 4 tree | `Resolved from project evidence` | Section 8 is the verification authority; add `test/integration/log.test.ts`, `test/ui/theme.golden.test.ts`, and the colocated unit tests it lists |

## 8. Planning Handoff

- **Scope:** All of design sections 4 and 7 (DES1–DES11), verification V1–V59 from section 8, DI1 re-pass (V48), docs update in `.s1mple/docs/project.md`, and delivery per `.s1mple/S1MPLE.md` (PR, green CI, move work folder to `work/done/`, second push). Parent synchronization rows stay pending unless the user authorizes them.
- **Primary boundaries:** `src/core/state` protocol; `src/core/lang/markdown`; `src/core/features/links`; `src/core/kernel/{text/fuzzy,view/wrap,vim,commands}`; `src/core/config`; `src/workspace/{index-worker,config-file,state-file,log}`; `src/app/{main,effects,index-host,lifecycle}`; `src/ui` overlays, views, editor view; toolchain (`package.json`, `bun.lock`, `knip.json`, `release.yml`, boundary and repo tests); benches.
- **Likely sequence:**

  ```text
  1 deps + boundaries + protocol (DES1, pins)
  → 2 Markdown model (DES2)  ┐
  → 3 links core + fuzzy (DES3) ┘ pure, parallel-safe after 1
  → 4 config, keymap, leader, log, file.save (DES7)
  → 5 editor display options (DES11)
  → 6 index worker, host, freshness, build entrypoint (DES4, DES5)
  → 7 link-safe edits (DES6)
  → 8 jumps, recents, session (DES8)
  → 9 discovery and link UI (DES9)
  → 10 benches, main wiring, docs, DI1 re-pass, delivery (DES10)
  ```

- **Verification focus:** resolution and rename property tests (V8–V14); `applyEdits` validation (V38); worker restart and binary (V36, V47); config line errors (V17–V20, V39); Neovim jump parity (V27); UV4/UV5 component suites (V42, V43); V13 benchmarks (V49–V51); DI1 suites (V48); `check` < 30 s.
- **Excluded scope:** Link styling and unresolved-link colour, embeds, live/reading views, browser preview (DI3); daily notes, templates, Bases, calendar/template pickers (DI4); `preview.*`, `daily.*`, `templates.*` config; `.obsidian/`; index persistence; `gj`/`gk`; parent file edits without authorization.
- **Blocking items:** None
