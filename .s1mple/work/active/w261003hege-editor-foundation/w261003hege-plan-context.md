# W261003HEGE Plan Context

## Status

`Ready`

Planning can start: the system design is `Finalized System Design` with no unresolved items, the parent roadmap baseline is unchanged since the accepted binding, DI1 has no due gate, and every remaining gap is an execution prerequisite or a delivery-time check, not a design decision.

## 1. Sources

| Source | Path | Use |
|---|---|---|
| s1mple instructions | `.s1mple/S1MPLE.md` | Workflow behavior and required context |
| Project document | `.s1mple/docs/project.md` | Reusable project baseline (stale: says branch `master`, no commits; DES1 rewrites it) |
| System design | `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-system-design.md` | Technical authority (commit `36af047`) |
| UI design | Not applicable — no work-level UI design; the accepted parent UI design `rm261003abzp-ui-design.md` (Status `Ready for Planning`) is consumed through the system design's Design Boundary and DES9 | Visual authority for S14 / V14.* goldens |
| System requirements | `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-requirements.md` | REQ1@R3 … REQ12@R1 |
| UI requirements | Not applicable — no work-level UI requirements; parent UREQ1@R2, UREQ2@R1, UREQ3@R2 (non-Markdown), UREQ7@R2, UREQ11@R1 stay bound through `W261003HEGE-REQ1@R3` | — |
| Research | `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-research.md` | RF1–RF14 (commit `4867795`) |
| Discussion context | `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-discuss-context.md` | Roadmap Binding, scope, constraints |
| UI context | Not applicable — no work-level UI context artifact | — |
| Roadmap sources | `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md`, `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, `rm261003abzp-design.md`, `rm261003abzp-requirements.md`, `rm261003abzp-ui-design.md` | Validate binding, DI1 scope, G1 gate |
| Additional project files | `git log`, `git remote -v`, `.gitignore`, `bun --version`, `nvim --version`, `../alfred/**` porting references, user memory `ci-pull-request-only` | Toolchain and repository state on 2026-10-03 |

## 2. Governing Design Handoff

### Source Authority

- **System design:** `w261003hege-system-design.md` — authoritative for every file, symbol, contract, flow, and verification case of DI1 (sections 3–9; DES1–DES15).
- **UI design:** Not applicable at work level — visuals come from parent `rm261003abzp-ui-design.md` (UDES1@R2, UDES2@R1, UDES3@R2 non-Markdown part, UDES7@R2, UDES11@R1; mockups M1@R1, M4@R1, AD4), composition model at `rm261003abzp-ui-design.md:404-421`.
- **Alignment:** Single governing design. The system design consumes the parent UI composition model and file names (`src/ui/shell.ts`, `views/*`, `overlays/*`, `editors/text-view.ts`) without restating visuals.

### Approved Direction

Build `so` from an empty repository as one Bun/TypeScript 7 package with four layers (`app → ui, workspace, core`; `core/kernel` imports only itself; only `src/ui` imports `@opentui/*`). The core is a pure reducer (`createUpdate(registries)`) behind one mutable store (`createStore(initial, update, run)`); every side effect is an `Effect` run by `src/app/effects.ts`, which serializes all mutating file-system effects on one promise chain (system design section 2, Proposed Architecture). OpenTUI's own exit and error handlers are disabled; `src/app/lifecycle.ts` owns flush → restore → exit (DES9, RF3). Toolchain, PR-only CI, release-please plus a four-target release with native smoke, the boundary test, PTY harness, and bench gate ship in the same PR (DES1, DES14, DES15).

### Design Coverage

| Source | Chain | Planning meaning | Canonical detail |
|---|---|---|---|
| System design | `REQ1@R3 → DES2–DES9, DES14, DES15 → S2, S3, S6–S9, S14–S17 → V2.1, V3.*, V6.*, V7.*, V8.*, V9.*, V14.*, V15.*, V16.1, V17.1` | Inherited DI1 obligations and G1 outputs at parent shapes | Section 1 Requirement Coverage; section 7 |
| System design | `REQ2@R2 → DES1 → S1 → V1.1–V1.4` | Exact pins, lockfile, SHA-pinned actions, docs | Section 7 `package.json`… |
| System design | `REQ3@R1 → DES3 → S2 → V2.1–V2.3` | Neovim 0.11 RPC recorder and replay | Section 7 `scripts/record-vim.ts`, `test/vim/*` |
| System design | `REQ4@R3 → DES14 → S8, S15 → V8.1, V8.2, V15.1–V15.3` | PR-only CI, test layers, PTY harness, bench gate | Section 7 `.github/workflows/ci.yml`, `test/e2e/pty.ts`… |
| System design | `REQ5@R1 → DES4, DES9 → S4, S8 → V4.1–V4.5, V8.1, V8.3` | Quit/close continuation, bounded signal flush | Section 7 `src/core/state/save.ts`, `src/app/lifecycle.ts` |
| System design | `REQ6@R1 → DES5 → S5 → V5.1–V5.4` | Deleted/moved-on-disk buffers | Section 7 `src/core/state/disk.ts`, `src/workspace/watcher.ts` |
| System design | `REQ7@R2 → DES10 → S10 → V10.1–V10.4` | Clipboard provider chain | Section 7 `src/workspace/system.ts` |
| System design | `REQ8@R2 → DES11 → S11 → V11.1–V11.4` | Trash adapters | Section 7 `src/workspace/trash.ts` |
| System design | `REQ9@R1 → DES12 → S12 → V12.1–V12.4` | Exclusion matcher | Section 7 `src/workspace/ignore.ts` |
| System design | `REQ10@R2 → DES13, DES4, DES5 → S13, S5 → V13.1–V13.5, V5.5` | Safe explorer operations | Section 7 `src/core/state/explorer.ts` |
| System design | `REQ11@R2 → DES6 → S6, S17 → V6.1–V6.3, V17.1` | File types, lowlight table, windowed highlighting | Section 7 `src/core/filetypes/registry.ts`… |
| System design | `REQ12@R1 → DES15 → S16 → V16.1, V16.2` | Release with native smoke | Section 7 `.github/workflows/release-please.yml`… |
| UI design | Not applicable — parent UV1@R2 (DI1 states), UV2@R1, UV6@R2, UV10@R1 (DI1 states) are verified through S14 → V14.1–V14.4 | Goldens and interactions match accepted parent UI | System design section 8, `test/ui/*` |

### Applicable Code Shapes

| Source shape | Target | Planning use |
|---|---|---|
| Section 7 `package.json`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `bin/so` | Toolchain files; `scripts.check`, `scripts.test:ci`, `scripts.bench`, `scripts.record:vim` | First group; every later group runs `bun run check` |
| Section 7 `src/core/state/types.ts` | `AppState`, `BufferState`, `SaveState`, `Action`, `Effect`, `FsOp`, `FileEvent`, `Stamp`, `TextFile`, `DirEntry`, `TimerId` | Frozen protocol for all reducers, runner, UI; additive members only (`listDir`, `dirListed`, `clipboardText.error`, `FsOp.permanent`, `"io"`) |
| Section 7 `src/core/state/store.ts` and `update.ts` | `createStore`, `createUpdate`, `Registries` | Store and pure reducer with error containment |
| Section 7 `save.ts`, `disk.ts`, `explorer.ts`, `keys.ts`/`commands.ts`/`buffers.ts`/`status.ts`/`init.ts`, `src/core/config/schema.ts` | Reducer modules, `ConfigSchema`, `defaults` | Save/quit, disk events, explorer ops, key routing, status |
| Section 7 `src/core/kernel/**` and `src/core/kernel/view/*` | `TextBuffer`, `UndoHistory`, `Registers`, `WindowTree`, `handleKey`, `CommandRegistry`, `Keymap`, `KeyScope`, `layoutText`, `Decoration`, `Highlighter` | Kernel; G1 contracts at parent DES5@R2, DES9@R3, DES17@R1 shapes |
| Section 7 `scripts/record-vim.ts`, `test/vim/*` | `main`, `assertNvim011`, `recordCase`; `cases`, `expected.json` | Recorder and replay table |
| Section 7 `src/core/filetypes/registry.ts`, `src/core/lang/code/*`, `src/core/lang/markdown/file-type.ts` | `FileTypeRegistry`, `EditorKindRegistry`, `CODE_LANGUAGES`, `codeFileTypes`, `lowlightHighlighter`, `markdownFileType` | File types and highlighting |
| Section 7 `src/workspace/{fs,watcher,ignore,trash,system}.ts` | `readTextFile`, `atomicWrite`, `listDir`, `createEntry`, `moveEntry`, `removeEntry`, `watchWorkspace`, `createOwnOps`, `createExclusionMatcher`, `detectTrash`, `detectClipboard` | Adapters |
| Section 7 `src/app/effects.ts`, `src/app/lifecycle.ts`, `src/app/main.ts` | `createEffectRunner` (serial queue), `installLifecycle`, `shutdown`, `FLUSH_BOUND_MS`, `main`, `parseCli`, `resolveWorkspace`, `VERSION` | Composition root and lifecycle |
| Section 7 `src/ui/shell.ts`, `input.ts`, `theme.ts`, `editors/*`, `views/*`, `overlays/*` | `createRenderer`, `RENDERER_OPTIONS`, `createShell`, `createKeyNormalizer`, `editorViews`, `OverlayHost`, `PromptView`, `ConflictView`, `ToastStack`, `resolveTheme` | OpenTUI shell |
| Section 7 `.github/workflows/ci.yml`, `test/e2e/pty.ts`, `scripts/bench-gate.ts`, `test/boundaries.test.ts`, `test/repo.test.ts` | CI jobs, `runInPty`, `TerminalProbe`, `TARGETS`, `LAYER_RULES`, `checkImports` | Verification infrastructure |
| Section 7 `.github/workflows/release-please.yml`, `release.yml`, `release-please-config.json` | jobs `build`, `smoke`, `publish` | Release path |

### Runtime Flow

```text
so [path] → parseCli (--version → exit 0) → resolveWorkspace (missing → stderr, exit 2)
  → registries → createRenderer(RENDERER_OPTIONS) → createStore(initialState, createUpdate(registries), runner.run) → shell
  → boot effects listDir(root) [+ read(file)] → first frame → watchWorkspace · detectTrash · detectClipboard
key → KeyNormalizer (Esc hold max(escTimeoutMs,20)) → dispatch(key, now) → update → Keymap | vim.handleKey → VimEffect[]
    → dirty → scheduleAutosave → timer → Effect write (serial queue) → atomicWrite → saved | saveFailed → retry 1/2/4…30 s
watcher → OwnOps? ignore : changed/removed → disk.ts → reload (undoable) | conflict | deleted on disk
explorer a/r/m/d → explorer.ts → flush writes → op (serial queue) → fsResult → re-path buffers
:q / SIGTERM / SIGINT / uncaught → flush (≤ 2 s) → restore terminal → exit
```

Canonical detail: system design section 5.

### Roadmap Validation

- **Accepted binding:** `w261003hege-discuss-context.md`, Roadmap Binding (RM261003ABZP, PH1@R2, DI1@R2).
- **Parent-to-child coverage:** `w261003hege-system-design.md`, section 1, Assigned Parent Obligation Coverage (every parent REQ/DES/S/V and UI obligation mapped to W REQ/DES/S/V). No assigned UI design scope at work level; parent UI obligations verified through S14 / V14.1–V14.4.
- **Baseline assessment:** Aligned. The whole `rm261003abzp-so-v1/` folder has one commit (`d00d3a3`), the same baseline the binding accepted. Index Delivery Items row DI1 (`rm261003abzp-roadmap-index.md:131`) still shows DI1@R2, Work `Pending`; phase DI1 definition (`…phase-1…md:392-424`) still DI1@R2 with Dependencies `None`; no other W binds DI1. The phase return-to-design condition (`…phase-1…md:423`) is not met (RF2, RF8).
- **Unresolved impacts:** None. Pending parent synchronization (not authorized in this run, owned by the main orchestrator): the discuss-context registration receipt and the seven proposed changes in system design section 1, Parent Synchronization — including RM261003ABZP-REQ10@R2 "every push and pull request" → "every pull request" (user instruction "CI should only run in PR"; memory `ci-pull-request-only`; `W261003HEGE-REQ4@R3`). Parent writes are separate from technical verification and must not be claimed as done.

### Cross-Work Dependency Gates

- **G1 — Editor foundation outputs for DI2**
  - **Parent Gate:** `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Cross-Work Dependency Gates (G1 row, ~line 73).
  - **Producer:** RM261003ABZP-DI1@R2 — W261003HEGE (this work; parent assignment pending synchronization).
  - **Required Output:** store (`update`, `createStore`, Action/Effect unions), `CommandRegistry`, `Keymap` with `KeyScope`, `layoutText`, `Decoration`, `FileTypeRegistry` (`text`, code, `markdown` source), `lowlightHighlighter`, the OpenTUI shell with `editorViews`, `OverlayHost`, `Prompt`, `readTextFile`, `atomicWrite`, watcher, effect runner, `bun run check`, CI, bench harness.
  - **Required Before:** RM261003ABZP-DI2@R2 execution (DI2 discussion and planning may start earlier against this plan).
  - **Evidence / Pending Condition:** Pending — DI1 PR merged to `main` with CI green; parent V1@R1 (W V3.1–V3.4), V2@R1 (W V2.1), V15@R2 (W V7.1–V7.2), V17@R1 (W V8.1–V8.2), V18@R1 (W V6.1–V6.5) passing. Not due for this work's planning or execution.
  - **Integration Owner:** RM261003ABZP-DI2@R2.

No gate is due before DI1 planning or execution (`…phase-1…md`, DI1 Dependencies: None).

## 3. Binding Constraints

| Constraint | Source | Planning implication |
|---|---|---|
| Plan behavior: Not established | `.s1mple/S1MPLE.md` §3 Plan | Follow the s1mple-plan skill defaults |
| Implementation: keep it lean and simple (user decision, 2026-10-03) | `.s1mple/S1MPLE.md` §3 Implementation | No abstractions beyond the system design; no speculative modules or later-DI files |
| Verification: Not established | `.s1mple/S1MPLE.md` §3 Verification | Use the system design section 8 verification tree as the verification contract |
| Delivery: Not established | `.s1mple/S1MPLE.md` §3 Delivery | Pushing the branch, opening the PR, and pushing `v0.1.0-rc.1` are outward-facing; the plan must stage them as user-authorized delivery steps, not silent execution |
| Do not use the native `Explore` subagent; prefer direct inspection or `s1mple-explore` | `.s1mple/S1MPLE.md` §3 Exploration | Carry into execution artifacts |
| Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required references | s1mple-plan Principle 1; `.s1mple/S1MPLE.md` §2 | Include in every group prompt |
| Subagents must not spawn subagents | User global `AGENTS.md`, Reviews and Subagents | Only the main orchestrator delegates |
| Communication rules for documents and reports | `.s1mple/docs/communication.md` | Plan parts and reports lead with conclusions, cite sources |
| TypeScript rules (currently Not established; DES1 establishes them) | `.s1mple/docs/languages/typescript.md` | DES1 group updates this file with TS 7.0.2, tsconfig, Biome, knip, `bun test` conventions (V1.4) |
| Import boundaries: core imports no I/O/UI/runtime; only `src/ui` imports `@opentui/*`; `core/kernel` imports only `core/kernel` | `rm261003abzp-design.md:50-57`; system design Binding Constraints | Enforced by `test/boundaries.test.ts` from the boundary group onward |
| DI1 AppState fields only; no G1 contract changes; no language code in `core/kernel`; no weakened safety/restore/boundary rules | `…phase-1…md:416-423` | Plan must not add later-DI fields or files (`src/preview`, `src/ui/widgets`, `core/features`, index/config/state files) |
| `update` pure and synchronous; no `Date.now()` in core | `rm261003abzp-design.md:342`; system design §3 Core state | Time arrives in `key`/`timer` actions |
| CI on `pull_request` only, PR concurrency with cancel-in-progress | `W261003HEGE-REQ4@R3`; memory `ci-pull-request-only` | No push triggers in `ci.yml`; V15.1 locks it |
| Exact pins; `packageManager: bun@1.4.2`; SHA-pinned actions; frozen lockfile | `W261003HEGE-REQ2@R2`; DES1 | Install with exact versions; V1.1, V1.2 |
| One Work, one PR; no real `v0.1.0` release (only `v0.1.0-rc.1`) | `rm261003abzp-roadmap-index.md`; requirements §4 Constraints | Single PR delivery; rc tag only |
| Parent roadmap files not written in this run | discuss context Parent Synchronization; requirements Out of Scope | Plan records pending sync; no parent edits |

## 4. Supporting Evidence

### Requirements

| Requirement | Design coverage | Required outcome |
|---|---|---|
| `W261003HEGE-REQ1@R3` | DES2–DES9, DES14, DES15 | All DI1 obligations and G1 outputs at parent shapes; protocol additions limited to `listDir`, `dirListed`, `clipboardText.error`, `FsOp.permanent`, `"io"` |
| `W261003HEGE-REQ2@R2` | DES1 | Exact pins (Bun 1.4.2, `@opentui/core` 0.5.14, `lowlight` 3.3.0, `zod` 4.6.5, `ignore` 7.0.12, TS 7.0.2, Biome 2.5.15, knip 6.39.0, `@xterm/headless` 6.0.0), frozen lockfile, SHA-pinned actions, docs updated |
| `W261003HEGE-REQ3@R1` | DES3 | Neovim 0.11.x recorded expectations; recorder refuses other versions |
| `W261003HEGE-REQ4@R3` | DES14 | Test layers, PR-only CI on Ubuntu + macOS, PTY harness, bench gate; CI < 3 min |
| `W261003HEGE-REQ5@R1` | DES4, DES9 | `:q`/`:wq`/`:q!`/`:bd`/`:bd!`, signals and crashes flush then restore |
| `W261003HEGE-REQ6@R1` | DES5 | External delete/move marks buffer deleted; no resurrection; `:w` recreates |
| `W261003HEGE-REQ7@R2` | DES10 | `"+` provider chain in Neovim 0.11 order; OSC 52 and session fallback |
| `W261003HEGE-REQ8@R2` | DES11 | freedesktop trash on Linux; `/usr/bin/trash` or `NSFileManager` on macOS; typed-confirm fallback |
| `W261003HEGE-REQ9@R1` | DES12 | Dot entries, `node_modules`, nested `.gitignore` excluded with git precedence; no symlink-loop hang |
| `W261003HEGE-REQ10@R2` | DES13, DES4, DES5 | No-overwrite ops, flush before move/trash, buffers re-pathed, own ops suppressed |
| `W261003HEGE-REQ11@R2` | DES6 | 34 non-session lowlight `common` grammars mapped; `text` fallback; Markdown source view |
| `W261003HEGE-REQ12@R1` | DES15 | Four binaries smoke-tested natively before publish |

### Research Findings

| Finding | Relevance | Planning implication |
|---|---|---|
| `RF1` | Pins are latest stable and compatible | Use the exact versions in DES1; `skipLibCheck`; run `tsc` via `bun --bun run tsc` |
| `RF2` | OpenTUI 0.5.14 paint API matches parent `EditorView` | Implement `EditorView.renderSelf` against the pinned API; paint default colours under `NO_COLOR` |
| `RF3` | OpenTUI installs exit/error handlers | `RENDERER_OPTIONS` disables them; lifecycle owns shutdown |
| `RF4` | 20 ms legacy Esc; kitty enabled only on reply | Esc hold in `input.ts`; PTY harness answers `CSI ? u` |
| `RF5` | Test renderer and stats exist | Component goldens in `test/ui`; bench harness |
| `RF6` | `Bun.Terminal` PTY; `@xterm/headless` lacks cursor/kitty fields | `runInPty` + raw-stream `TerminalProbe` |
| `RF7` | One runner cross-compiles four targets | `release.yml` build job; native smoke jobs |
| `RF8` | Recursive `fs.watch` works on macOS and Linux; deletes arrive as `rename` | Watcher stats on events; own-op suppression covers child events on Linux |
| `RF9` | release-please tags don't trigger workflows; action v5 | `workflow_call` from `release-please.yml`; SHA pins |
| `RF10` | lowlight `common` has 37 grammars, no incremental API | Static 34-language table; windowed highlight with 200-line look-back and cache |
| `RF11` | Non-prompting macOS trash paths | `macTrash` via `/usr/bin/trash` or JXA `NSFileManager`; path passed as argument |
| `RF12` | Neovim clipboard order; xsel before xclip | `detectClipboard` order |
| `RF13` | Neovim 0.11.7 recording needs RPC | Recorder uses `--listen` and `nvim_input`; needs a local 0.11.x binary |
| `RF14` | `ignore` 7.x; cross-scope precedence is the caller's job | `ExclusionMatcher` per-scope instances with precedence logic |

## 5. Project Implementation Context

### Relevant Structure

```text
so/                       (branch feat/rm261003abzp-di1-editor-foundation, remote github.com/therealhieu/so — private)
├── .gitignore            (node_modules/, dist/, build/, out/, *.tsbuildinfo, coverage/, .cache/, .tmp/, .playwright-mcp/)
├── AGENTS.md, CLAUDE.md  (@.s1mple/S1MPLE.md)
└── .s1mple/              (guidance, roadmap, this work folder)
No package.json, tsconfig.json, src/, test/, scripts/, bin/, or .github/ exists. Target tree: system design section 4.
```

### Established Patterns

| Pattern | Evidence | Planning use |
|---|---|---|
| No code patterns exist; greenfield | `git ls-files` (only `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `.s1mple/**`) | System design section 7 shapes are the patterns |
| Alfred restore coordinator (porting reference only) | `../alfred/apps/tui/src/terminal/shutdown.ts` | Reference for `src/app/lifecycle.ts`; not a dependency |
| Alfred pure vim core returning effects | `../alfred/apps/tui/src/view/editor/vim.ts` | Reference for `src/core/kernel/vim/engine.ts` |
| Alfred lowlight highlighting | `../alfred/apps/tui/src/view/markdown/code-highlight.ts` | Reference for `src/core/lang/code/highlight.ts` |
| Alfred autosave queue | `../alfred/packages/view-model/src/knowledge/autosave-queue.ts` | Reference for save timing in `save.ts`/`effects.ts` |

### Code Surfaces

| Path | Current symbol or wiring | Intended change | Evidence |
|---|---|---|---|
| Toolchain files (`package.json`, `bun.lock`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `bin/so`) | New | Add (DES1) | System design §4, §7 |
| `src/core/state/*`, `src/core/config/schema.ts` | New | Add (DES2, DES4, DES5, DES13) | System design §4 |
| `src/core/kernel/**` | New | Add (DES3, DES7) | System design §4 |
| `src/core/filetypes/registry.ts`, `src/core/lang/**` | New | Add (DES6) | System design §4 |
| `src/workspace/*` | New | Add (DES5, DES8, DES10–DES12) | System design §4 |
| `src/app/*`, `src/ui/**` | New | Add (DES4, DES9, DES15) | System design §4 |
| `test/**`, `scripts/*`, `.github/workflows/*`, release-please config | New | Add (DES3, DES14, DES15) | System design §4 |
| `.gitignore` | Existing ignores | Add `.so-bench/` | `.gitignore`; system design §4 |
| `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md` | "Not established" | Record stack, pins, scripts, test layers, CI trigger (V1.4) | System design §4 |

### Verification Surfaces

| Suite or check | Location or command | Required verification |
|---|---|---|
| Unit (in `check`) | `bun run check` → colocated `src/**/*.test.ts`, `test/vim`, `test/boundaries.test.ts`, `test/repo.test.ts` | V1.1, V1.2, V2.1–V2.4, V3.3, V3.5, V4.1–V4.4, V5.2–V5.4, V6.1–V6.3, V7.1–V7.5, V9.1, V9.2, V10.1–V10.4, V12.1–V12.3, V13.2, V13.3, V13.5, V15.1 |
| Integration | `bun test test/integration src/workspace/{fs,watcher,trash}.test.ts` | V3.1, V3.2, V3.4, V5.1, V5.5, V6.4, V6.5, V11.1–V11.3, V12.4, V13.1, V13.4 |
| Component | `bun test test/ui` | V9.3, V14.1–V14.4 |
| E2E (PTY) | `bun test test/e2e` | V4.5, V8.1–V8.3 |
| CI test job | `bun run test:ci` on `ubuntu-24.04`, `macos-15` | Integration, component, e2e on both platforms |
| Benchmark | `bun run bench` (Linux CI) | V17.1 (median of 5 ≤ 2× target) |
| Non-test | system design §8 non-test checks | V1.3 check < 30 s; V1.4 docs; V11.4 manual macOS trash; V15.2 CI timing; V15.3 bench wiring; V16.1 rc dry run; V16.2 release gating review |

## 6. Additional Inspections

| Planning question | Files inspected | Finding |
|---|---|---|
| Has the parent baseline changed since the binding? | `git log -- .s1mple/work/active/rm261003abzp-so-v1/`; index rows 131, 142; phase file 392–424, 618–635 | No: single commit `d00d3a3`; DI1@R2, Work `Pending`, Dependencies `None` |
| Is any other W bound to DI1? | `.s1mple/work/active/`, `.s1mple/work/done/` | No; only `w261003hege-editor-foundation` |
| Does the local toolchain match the pins? | `bun --version` → `1.3.10`; `nvim --version` → `v0.12.4`; `uname -m` → `arm64` | Bun 1.4.2 and Neovim 0.11.x must be installed before the toolchain and vim-recording groups (see Planning Gaps) |
| Do the Alfred porting references exist? | `../alfred/...` four files | All four exist |
| Is a GitHub remote available for PR-only CI and release? | `git remote -v` | `origin https://github.com/therealhieu/so.git` (private) |
| Is the CI-trigger narrowing reflected consistently? | Memory `ci-pull-request-only`; `W261003HEGE-REQ4@R3`; DES14; system design Parent Synchronization item 1 | Consistent; parent sync pending |

## 7. Planning Gaps

| Gap | Classification | Evidence or blocker |
|---|---|---|
| Local Bun is 1.3.10; design pins `bun@1.4.2` | `Resolved from project evidence` | The toolchain group installs Bun 1.4.2 first (official installer with version argument) and confirms `bun --version` = `1.4.2` before generating `bun.lock` |
| Local Neovim is 0.12.4; recorder requires 0.11.x (`assertNvim011`, `NVIM ?? "nvim"`) | `Resolved from project evidence` | The vim-recording task downloads the Neovim v0.11.7 release tarball to a temporary location and runs `NVIM=<path> bun run record:vim`; V2.3 proves the guard |
| V11.4, V15.2, V15.3, V16.1 need a pushed branch, an open PR, and a pushed `v0.1.0-rc.1` tag | `Resolved from project evidence` | S1MPLE Delivery is `Not established`; plan these as final delivery-verification steps requiring explicit user authorization for push, PR, and tag; record results in the PR |
| `.s1mple/docs/project.md` is stale (branch `master`, no commits) | `Resolved from project evidence` | DES1 rewrites it with the stack, pins, scripts, test layers, and CI trigger (V1.4) |
| Parent synchronization pending (registration + seven proposed changes) | `Resolved from project evidence` | Not authorized in this run; carry as pending receipt in the plan index; never claimed as done |
| Draft mockups M1@R2, M3@R2 await user review | `Resolved from project evidence` | Not part of the binding (manifest unchanged since `d00d3a3`); if accepted before UI verification, reconcile the binding before finalizing V14.* |
| Hosted runner label availability for a private repo (`macos-15-intel`, `ubuntu-24.04-arm`) | `Resolved from project evidence` | Confirmed only by the rc run; a missing label is a recorded release blocker (requirements §4 Risks) |

## 8. Planning Handoff

- **Scope:** Every file in system design section 4 (toolchain, `src/core`, `src/workspace`, `src/app`, `src/ui`, tests, scripts, workflows, release config, docs) and every verification case in section 8 (V1.1–V17.1 plus non-test checks), delivered as one PR on `feat/rm261003abzp-di1-editor-foundation`.
- **Primary boundaries:** toolchain/CI/release; `core/kernel`; `core/filetypes` + `core/lang`; `core/state` + `core/config`; `workspace`; `app` (effects, lifecycle, main); `ui`.
- **Likely sequence:** toolchain + boundary/policy tests → `core/state/types.ts` protocol + store/update → kernel (text, editor, vim, commands, view) + vim recorder/replay → file types + highlighter → core reducers (keys, buffers, save, disk, explorer, commands, status) → workspace adapters (fs, ignore, watcher, trash, system) → app effects + lifecycle + main → UI shell, input, theme, editors, views, overlays + component goldens → e2e PTY + bench gate + CI workflow → release workflows + docs → delivery verification (PR, CI, rc tag; user-authorized).
- **Verification focus:** S3/S4/S5 data safety (V3.*, V4.*, V5.*, V13.*), S2 Neovim equality (V2.1), S7 boundaries and purity (V7.*), S8 restore (V8.*), S9 Esc timing, S14 UI goldens, S15 CI shape and timing, S17 bench gate, S1 `check` < 30 s.
- **Excluded scope:** DI2–DI4 features and files (`src/preview`, `src/ui/widgets`, `core/lang/markdown/{doc,blocks,syntax}.ts`, `core/features/**`, `workspace/{index-worker,config-file,state-file}.ts`); config file loading; real `v0.1.0` release; index Deferred Scope; hidden-files toggle, topdir trash, crash-recovery files; parent roadmap writes.
- **Blocking items:** None
