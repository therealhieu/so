# W261003HEGE Implementation Plan Index

## Status

`Ready`

## Sources

- Plan context: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-context.md`
- System design: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-system-design.md`
- UI design: `Not applicable — no work-level UI design; parent rm261003abzp-ui-design.md (Ready for Planning) supplies visuals through DES9 and is verified by S14 → V14.1–V14.4`
- System requirements: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-requirements.md`
- UI requirements: `Not applicable — parent UREQ1/2/3/7/11 stay bound through W261003HEGE-REQ1@R3`
- Research: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-research.md`
- Discussion context: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-discuss-context.md`
- UI context: `Not applicable — no work-level UI context artifact`

## Roadmap Contract

- **Accepted binding:** `w261003hege-discuss-context.md`, Roadmap Binding (RM261003ABZP, PH1@R2, DI1@R2).
- **Assigned parent coverage:** `w261003hege-system-design.md`, section 1, Assigned Parent Obligation Coverage.
- **Finalization assessment:** Aligned (reconciler, 2026-10-03). Checked: `git log -- .s1mple/work/active/rm261003abzp-so-v1/` → only `d00d3a3` (accepted baseline); `rm261003abzp-roadmap-index.md:131` DI1@R2, Work `Pending`; `:142` Work Progress DI1 unchanged; `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73` G1 row (producer DI1, consumer DI2, owner DI2); `…phase-1…md:395` DI1 Dependencies `None`; no other W under `.s1mple/work/` binds DI1. Every row of system design §1 Assigned Parent Obligation Coverage maps to a part, group, and task. No gate is due within this plan; G1 is placed at P1-G1, P1-G2, P2-G1, P2-G2, and P3-G1 boundaries with evidence assembled in P3-G1-T6/T7 and owner RM261003ABZP-DI2@R2.
- **Cross-work gates:** G1 (`rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Cross-Work Dependency Gates; plan context section 2). This work produces G1; it is due before DI2 execution, not within this plan. Outputs are produced across P1-G2 (kernel contracts, file types, highlighter), P2-G1 (store, Action/Effect), P2-G2 (`readTextFile`, `atomicWrite`, watcher, effect runner), P3-G1 (shell, `editorViews`, `OverlayHost`, `Prompt`, bench harness), and P1-G1 (`bun run check`, CI). P3-G1 records the G1 evidence list for the DI2 integration owner.
- **Parent synchronization:** Pending parent synchronization — discuss-context registration receipt plus the seven proposed changes in system design section 1, Parent Synchronization (including RM261003ABZP-REQ10@R2 "every push and pull request" → "every pull request"). Parent writes are not authorized in this run. Plan-stage receipt (main orchestrator, 2026-10-03): no parent file was written during planning; the same seven changes remain pending, unchanged, with the evidence cited in system design section 1; planning readiness does not imply parent update or DI1 delivery.

## Plan Overview

Build `so` from an empty repository in dependency order: toolchain and repository policy first, so every later group runs `bun run check`; then the pure kernel and file types; then the core protocol, store, and reducers; then workspace adapters behind the serial effect runner; and finally the OpenTUI shell, composition root, lifecycle, PTY/bench verification, and delivery checks. The system design (sections 4, 7, 8) is the single technical authority; parts reference it and show only task-owned deltas.

S1MPLE behavior carried into execution: **Plan** and **Verification** are not established, so the system design section 8 verification tree is the verification contract; **Implementation** is "keep it lean and simple" — no abstractions, files, or later-DI fields beyond the design; **Delivery** is not established, so pushing the branch, opening the PR, and pushing `v0.1.0-rc.1` are explicit user-authorized steps. Two execution-sequencing rules keep each group green without changing the final design: until P3-G1 wires `src/app/main.ts`, `knip` may report only G1 symbols whose consumer is a later group (P3-G1-T6 requires zero findings); and P2-G1-T1 adds a temporary `default` branch to `update.ts` that P2-G1-T5 removes, restoring the exhaustive check. `V2.1` replays non-ex cases through `handleKey` in P1-G2-T4 and all cases, including `:s`/`:%s`, through `createUpdate` in P2-G1-T5.

Every delegated agent reads `.s1mple/S1MPLE.md` and its required references; subagents do not spawn subagents; the native `Explore` subagent is not used.

## Execution Flow

```text
Plan 1: Toolchain and kernel → Plan 2: Core state and workspace → Plan 3: UI shell, app, and delivery
```

## Plan Parts

| Part | File | Scope | Dependencies | System design | UI design | Verification focus |
|---|---|---|---|---|---|---|
| 1 | `w261003hege-plan-1-toolchain-and-kernel.md` | Toolchain files, docs, repo/boundary policy tests, CI and release workflows and config; `core/kernel/**`, `core/filetypes`, `core/lang/**`, vim recorder and replay | None | `REQ1, REQ2, REQ3, REQ4, REQ10, REQ11, REQ12 → DES1, DES3, DES6, DES7, DES13 (explorer default bindings), DES14 (ci.yml, boundaries, repo test), DES15 (workflows, config) → S1, S2, S6, S7, S15, S16, S17 → V1.1, V1.2, V1.4, V2.1 (non-ex cases), V2.2–V2.4, V6.1–V6.3, V7.1, V7.2, V7.4, V15.1, V16.2` | None | Pins and SHA pins, boundary rules, Neovim equality, file-type resolution, viewport-bound view |
| 2 | `w261003hege-plan-2-core-state-and-workspace.md` | `core/state/*`, `core/config/schema.ts`; `workspace/*`; `app/effects.ts` serial runner; integration tests | 1 | `REQ1, REQ3, REQ5, REQ6, REQ7, REQ8, REQ9, REQ10, REQ11 → DES2, DES3, DES4, DES5, DES6, DES8, DES10, DES11, DES12, DES13 → S2, S3, S4, S5, S6, S7, S10, S11, S12, S13 → V2.1 (ex cases), V3.1–V3.5, V4.1–V4.4, V5.1–V5.5, V6.4, V6.5, V7.3, V7.5, V10.1–V10.4, V11.1–V11.3, V12.1–V12.4, V13.1–V13.5` | None | Data safety (atomic save, retry, conflict, deletion, quit flush), serial queue, exclusion, trash, clipboard, reducer purity |
| 3 | `w261003hege-plan-3-ui-shell-app-and-delivery.md` | `ui/**`, `app/main.ts`, `app/lifecycle.ts`, component goldens, PTY e2e, bench files and gate; user-authorized delivery verification | 1, 2 | `REQ1, REQ2, REQ4, REQ5, REQ7, REQ8, REQ10, REQ11, REQ12 → DES1 (V1.3), DES2 (main wiring), DES4 (lifecycle flush), DES6 (bench), DES7 (paint), DES9, DES10 (OSC 52 wiring), DES11 (V11.4), DES13 (explorer view), DES14 (pty, bench), DES15 (VERSION, rc) → S1, S4, S8, S9, S10, S11, S14, S15, S16, S17 → V1.3, V4.5, V8.1–V8.3, V9.1–V9.3, V11.4, V14.1–V14.4, V15.2, V15.3, V16.1, V17.1` | Parent `UREQ1/2/7/11 → UDES1/2/7/11 (UDES3 non-Markdown window) → US1, US5, US9 → UV1 (DI1), UV2, UV6, UV10 (DI1)` via S14 → V14.1–V14.4 | Terminal restore, Esc timing, UI goldens, bench gate, CI on PR, rc release smoke |

## Group Layout

| Group | Shared context | Split rule |
|---|---|---|
| `P1-G1` | `package.json`, `bun.lock`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `bin/so`, `.gitignore`, `.github/workflows/*`, release-please config, `test/repo.test.ts`, `test/boundaries.test.ts` + fixtures, `.s1mple/docs/{project.md,languages/typescript.md}`; checks `bun run check` | `First group` |
| `P1-G2` | `src/core/kernel/**`, `src/core/filetypes/registry.ts`, `src/core/lang/**`, `scripts/record-vim.ts`, `test/vim/*`; kernel contracts (`TextBuffer`, `handleKey`, `CommandRegistry`, `Keymap`, `layoutText`, `Highlighter`, `FileTypeRegistry`) and their unit tests | `Checkpoint — every reducer, adapter, and view consumes the verified kernel contracts and the toolchain must be green first` |
| `P2-G1` | `src/core/state/*`, `src/core/config/schema.ts`; `AppState`/`Action`/`Effect` protocol, `createStore`, `createUpdate`, reducer unit tests | `Ordered phase — reducers consume the verified kernel contracts from Part 1` |
| `P2-G2` | `src/workspace/*`, `src/app/effects.ts`, `test/integration/*`, `test/fixtures/{workspace,generate.ts}`; `Effect` execution, serial FS queue, `OwnOps` | `Different context — real-file-system adapters and integration tests share no files with the pure reducers, only the frozen protocol from P2-G1` |
| `P3-G1` | `src/ui/**`, `src/app/{main,lifecycle}.ts`, `test/ui/*`, `test/e2e/*`, `test/bench/*`, `scripts/bench-gate.ts`; delivery verification on the PR and `v0.1.0-rc.1` | `Ordered phase — the shell and composition root wire every verified core and workspace module` |

Each group exceeds the `Too large` threshold (about 8 tasks or 15 files) because DI1 is a greenfield application; further splits would exceed the 5-group limit, so the layout merges at the weakest seams and keeps each group to one shared context.

## Cross-Part Coordination

| Boundary | Producing part | Consuming part | Coordination requirement |
|---|---|---|---|
| `bun run check`, `test:ci`, `bench` scripts; `test/boundaries.test.ts` `LAYER_RULES` | 1 | 2, 3 | Every later group passes `check`; `ci.yml` jobs call the scripts that Parts 2–3 populate |
| Kernel contracts (`Pos`, `TextBuffer`, `VimState`, `VimEffect`, `handleKey`, `CommandRegistry`, `Keymap`, `KeyScope`, `layoutText`, `Decoration`, `Highlighter`) | 1 | 2, 3 | Parent DES3/DES4/DES5@R2/DES9@R3 shapes; no later edits beyond the system design |
| `FileTypeRegistry`, `codeFileTypes`, `markdownFileType`, `lowlightHighlighter` | 1 | 2, 3 | Registered by `main`; consumed by `buffers.ts` open policy and `ui/editors` |
| `src/core/state/types.ts` protocol (`AppState`, `Action`, `Effect`, `FsOp`, `FileEvent`, `Stamp`, `TextFile`, `DirEntry`, `TimerId`) | 2 | 3 | Additive members only: `listDir`, `dirListed`, `clipboardText.error`, `FsOp.permanent`, `"io"` |
| `createStore`, `createUpdate(registries)`, `initialState`, `pendingWrites`, `requestQuit` | 2 | 3 | `main` and `lifecycle` use them as designed; lifecycle flush bounded by `FLUSH_BOUND_MS` |
| `createEffectRunner`, `watchWorkspace`, `createOwnOps`, `detectTrash`, `detectClipboard` | 2 | 3 | `main` constructs and wires them; OSC 52 copy goes through `shell.copyOsc52` |
| `.github/workflows/release.yml` smoke of `so --version` | 1 | 3 | `VERSION` in `src/app/main.ts` matches the smoke expectation |

## Coverage

| Source item | Covered by parts | Expected outcome |
|---|---|---|
| `W261003HEGE-REQ1@R3` | 1, 2, 3 | All DI1 obligations and G1 outputs at parent shapes; additive protocol members only |
| `W261003HEGE-REQ2@R2` | 1, 3 | Exact pins, frozen lockfile, SHA-pinned actions, docs updated |
| `W261003HEGE-REQ3@R1` | 1, 2 | Neovim 0.11 recorded expectations; recorder rejects other versions |
| `W261003HEGE-REQ4@R3` | 1, 3 | PR-only CI, test layers, PTY harness, bench gate |
| `W261003HEGE-REQ5@R1` | 2, 3 | Quit/close rules in reducers; signal and crash flush in lifecycle |
| `W261003HEGE-REQ6@R1` | 2 | Deleted-on-disk handling without resurrection |
| `W261003HEGE-REQ7@R2` | 2, 3 | Clipboard chain; OSC 52 through the shell |
| `W261003HEGE-REQ8@R2` | 2, 3 | Trash adapters; manual macOS check in delivery |
| `W261003HEGE-REQ9@R1` | 2 | Exclusion matcher used by `listDir` |
| `W261003HEGE-REQ10@R2` | 1, 2, 3 | Safe explorer operations through the serial queue |
| `W261003HEGE-REQ11@R2` | 1, 2, 3 | 34-language table, `text` fallback, Markdown source view |
| `W261003HEGE-REQ12@R1` | 1, 3 | Release workflows; rc tag smoke on four native runners |
| `W261003HEGE-DES1` | 1, 3 | Toolchain and docs |
| `W261003HEGE-DES2` | 2, 3 | Protocol, store, update, init; `main` wiring |
| `W261003HEGE-DES3` | 1, 2 | Kernel split and recorded vim table |
| `W261003HEGE-DES4` | 2, 3 | Save pipeline, serial queue, quit flush, lifecycle flush |
| `W261003HEGE-DES5` | 2 | Watcher, own-op suppression, read-back disk events |
| `W261003HEGE-DES6` | 1, 2, 3 | File types, lowlight table, windowed highlighting |
| `W261003HEGE-DES7` | 1, 3 | Kernel text view; UI paint |
| `W261003HEGE-DES8` | 2 | Workspace file adapter |
| `W261003HEGE-DES9` | 3 | OpenTUI shell, input normalizer, lifecycle |
| `W261003HEGE-DES10` | 2, 3 | Clipboard provider chain; OSC 52 wiring |
| `W261003HEGE-DES11` | 2, 3 | Trash adapters |
| `W261003HEGE-DES12` | 2 | Exclusion matcher |
| `W261003HEGE-DES13` | 1, 2, 3 | Explorer operations reducer; explorer view |
| `W261003HEGE-DES14` | 1, 3 | CI, boundary and repo tests; PTY harness and bench gate |
| `W261003HEGE-DES15` | 1, 3 | Release workflows and config; `VERSION` and rc dry run |
| `V2.5` obsolete-reference check | None | Not applicable — greenfield; no removed paths or symbols (system design §8 Non-test) |
| Parent UI obligations (US1@R2, US5@R2, US9@R1; UV1 DI1 states, UV2, UV6, UV10 DI1 states) | 3 | Goldens and interactions match the accepted parent UI design (V14.1–V14.4) |
| G1 gate outputs | 1, 2, 3 | Produced and evidenced for DI2; not due in this plan |
| Binding constraints (import rules, pure `update`, DI1-only fields, no later-DI files, lean implementation) | 1, 2, 3 | Enforced by `test/boundaries.test.ts`, reducer tests, and review |
| Execution prerequisites (Bun 1.4.2, Neovim 0.11.7 for recording) | 1 | Installed and confirmed before lockfile generation and recording |

## Overall Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast check | `bun run check` | Format, lint, typecheck, knip, unit, boundary, and repo tests pass in < 30 s (V1.3) |
| Integration | `bun test test/integration src/workspace` | V3.1, V3.2, V3.4, V5.1, V5.5, V6.4, V6.5, V11.1–V11.3, V12.4, V13.1, V13.4 pass |
| Component | `bun test test/ui` | V9.3, V14.1–V14.4 pass |
| E2E PTY | `bun test test/e2e` | V4.5, V8.1–V8.3 pass |
| Benchmark gate | `bun run bench` | V17.1 medians within 2× targets |
| CI on PR (user-authorized push + PR) | GitHub Actions `ci.yml` on the DI1 PR | `check` and `test` on `ubuntu-24.04` and `macos-15` green, bench gated on Linux, < 3 min (V15.2, V15.3) |
| Release dry run (user-authorized tag) | Push `v0.1.0-rc.1` | Four binaries + `SHA256SUMS`, four native smoke jobs pass before prerelease publish (V16.1) |
| Manual macOS trash | Trash a file via explorer on macOS | Item appears in Finder Trash with Put Back, no prompt (V11.4) |

## Completion Criteria

- Every listed plan part is implemented and verified.
- Every system design chain, applicable parent UI obligation, and binding constraint has complete coverage.
- Cross-part coordination is integrated and verified.
- For roadmap-linked work, assigned parent obligations and cross-work checks have actual evidence, and all gates due within this execution scope are satisfied. G1 is reported separately for DI2; roadmap delivery is not inferred from work completion.
- All overall verification checks pass.

## Planning Gaps

`None`
