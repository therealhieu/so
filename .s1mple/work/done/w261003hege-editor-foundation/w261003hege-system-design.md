# W261003HEGE: editor-foundation — System Design

**Design Status:** Finalized System Design

**Context Source:** `w261003hege-discuss-context.md`

**Requirements Source:** `w261003hege-requirements.md`

**Research Source:** `w261003hege-research.md` (commit `4867795`, baseline `5a90bd8`)

**Current Requirement Revisions:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ2@R2`, `W261003HEGE-REQ3@R1`, `W261003HEGE-REQ4@R3`, `W261003HEGE-REQ5@R1`, `W261003HEGE-REQ6@R1`, `W261003HEGE-REQ7@R2`, `W261003HEGE-REQ8@R2`, `W261003HEGE-REQ9@R1`, `W261003HEGE-REQ10@R2`, `W261003HEGE-REQ11@R2`, `W261003HEGE-REQ12@R1`

**Research Reconciliation:** `w261003hege-requirements.md`, section 6 — Research Impact Review (commit `398221d`)

**Unresolved Items:** None

**Design Boundary:** This artifact is authoritative for whole-system architecture and technical design, including UI/frontend applications, routes, modules, components, state ownership, contracts, files, symbols, boundaries, wiring, and verification when material. UI/UX look and feel, visual composition, concrete interaction treatment, responsive presentation, accessibility realization, mockups, and accepted UI-design authority belong to `s1mple-discuss-ui`. For DI1 that authority is the accepted parent UI design (`rm261003abzp-ui-design.md`, UDES1@R2, UDES2@R1, UDES3@R2 non-Markdown part, UDES7@R2, UDES11@R1), which this design consumes and does not restate.

**Approval evidence:** Self-drive requested by the user on 2026-10-03 ("self drive /s1mple-discuss about this DI … choose options/designs/options that are stable, simple, easy to maintain and extend with industry compliance"). Under that delegation the agent aligned the design overview (topics D1–D5) and chose the recommended option for every decision in section 9. The user's mid-discussion instruction "CI should only run in PR" is applied through `W261003HEGE-REQ4@R3` and `W261003HEGE-DES14`. The single design review reported two major problems, which the agent resolved under the same delegation: protocol additions beyond the allowed list (resolved by revising `W261003HEGE-REQ1` to R3 for `FsOp.permanent` and the `"io"` refusal, and by dropping `version` from `write`/`saved`), and a restore-before-flush shutdown order (resolved by restoring the `W261003HEGE-REQ5@R1` order: flush, then restore).

**Finalized System Design Checklist:**

- [x] Every current qualified requirement revision has exactly one valid system-design coverage outcome: `System design required`, `No system design change`, or `No system design applicable`.
- [x] Every `System design required` outcome has the full `REQ → DES → S → V` chain.
- [x] Every `No system design change` outcome cites the existing system mechanism, exact current source, and existing verification evidence.
- [x] Every `No system design applicable` outcome explains why the requirement creates no system architecture or technical-design obligation and omits invented `DES`, `S`, and `V` records.
- [x] For roadmap-linked work, the accepted baseline has been checked against current parent definitions, every assigned parent obligation has valid child coverage, and gates due before design approval have evidence.
- [x] Historical requirement revisions are excluded from current design coverage.
- [x] When research exists, every RF-to-evaluated-revision relationship is reconciled and evaluated-versus-informed lineage is accurate; a finding that evaluated no requirement has one `None` relationship row.
- [x] When any requirement requires changed system design, the design progresses from system context and architecture to concrete files and symbols; otherwise sections 2–8 record explicit non-applicability without inventing system changes.
- [x] Every focal component, when any, has an existing target or proposed location and clear ownership.
- [x] The proposed project tree accounts for every affected source, wiring, configuration, migration, and test file as added, modified, renamed/moved, or deleted, or states why no system file changes apply.
- [x] Every changed or proposed logical contract, data model, and state item has a canonical section 7 detailed-shape reference; every unchanged item cites its exact current source and identifies affected section 7 consumers when relevant.
- [x] Every changed boundary has a contract, state rule, or signature.
- [x] Every modified symbol has an exact current source, current → final delta, and affected callers or consumers.
- [x] Detailed code design covers every important changed type, class, function, dependency, invariant, focused control flow, construction point, registration, and export; each code preview is immediately followed by an explanation of the definitions shown and how they interact.
- [x] Changed runtime flows name the participating symbols and define relevant failure policies.
- [x] Every cross-cutting, migration, and delivery concern is resolved with a concrete design location or `None — <reason>`.
- [x] Every `System design required` requirement, every design decision, and every changed invariant maps to an observable success criterion and an exact verification case and assertion.
- [x] Test suites and nested cases form one verification tree; every case names its unique risk and uses the lowest sufficient test level.
- [x] Unit and integration tests follow the section 8 quality rules without duplicating the same proof across levels.
- [x] Traceability is complete for every `System design required` outcome: `current REQ revision → DES → affected file → affected symbol → caller or wiring → runtime flow → success criterion → suite or check → exact verification case and assertion`; other outcomes have their required evidence instead of fabricated links.
- [x] UI/frontend technical design stays within the Design Boundary; UI/UX realization is deferred to `s1mple-discuss-ui`.
- [x] Every omitted structure, code preview, test level, or non-test check explains why it does not apply.

# Table of Contents

1. [Design Goals, Constraints, and Requirement Coverage](#1-design-goals-constraints-and-requirement-coverage)
2. [System Context and Architecture](#2-system-context-and-architecture)
3. [Components and Boundaries](#3-components-and-boundaries)
4. [Project Structure Changes](#4-project-structure-changes)
5. [Runtime Flows and Error Policies](#5-runtime-flows-and-error-policies)
6. [Logical Contracts, Data Models, and State](#6-logical-contracts-data-models-and-state)
7. [Detailed Code Design](#7-detailed-code-design)
8. [Testing and Verification](#8-testing-and-verification)
9. [Finalized Design Decisions](#9-finalized-design-decisions)
   - [W261003HEGE-DES1: Toolchain, scripts, and exact pins](#w261003hege-des1-toolchain-scripts-and-exact-pins)
   - [W261003HEGE-DES2: Store, protocol, and DI1 state shape](#w261003hege-des2-store-protocol-and-di1-state-shape)
   - [W261003HEGE-DES3: Kernel module split and recorded vim table](#w261003hege-des3-kernel-module-split-and-recorded-vim-table)
   - [W261003HEGE-DES4: Save pipeline, serial file-system queue, and quit flush](#w261003hege-des4-save-pipeline-serial-file-system-queue-and-quit-flush)
   - [W261003HEGE-DES5: Watcher with own-operation suppression and read-back disk events](#w261003hege-des5-watcher-with-own-operation-suppression-and-read-back-disk-events)
   - [W261003HEGE-DES6: File types, lowlight table, and windowed highlighting](#w261003hege-des6-file-types-lowlight-table-and-windowed-highlighting)
   - [W261003HEGE-DES7: Kernel text view at the parent shape](#w261003hege-des7-kernel-text-view-at-the-parent-shape)
   - [W261003HEGE-DES8: Workspace file adapter](#w261003hege-des8-workspace-file-adapter)
   - [W261003HEGE-DES9: OpenTUI shell, input normalizer, and lifecycle coordinator](#w261003hege-des9-opentui-shell-input-normalizer-and-lifecycle-coordinator)
   - [W261003HEGE-DES10: Clipboard provider chain](#w261003hege-des10-clipboard-provider-chain)
   - [W261003HEGE-DES11: Trash adapters](#w261003hege-des11-trash-adapters)
   - [W261003HEGE-DES12: Shared exclusion matcher](#w261003hege-des12-shared-exclusion-matcher)
   - [W261003HEGE-DES13: Explorer operations reducer](#w261003hege-des13-explorer-operations-reducer)
   - [W261003HEGE-DES14: Test layout, PR-only CI, PTY harness, and bench gate](#w261003hege-des14-test-layout-pr-only-ci-pty-harness-and-bench-gate)
   - [W261003HEGE-DES15: Release workflows with native smoke](#w261003hege-des15-release-workflows-with-native-smoke)

# 1. Design Goals, Constraints, and Requirement Coverage

## Goals

- Land every RM261003ABZP-DI1@R2 obligation and the G1 outputs at their parent contract shapes (`W261003HEGE-REQ1@R3`).
- Make every data-safety rule a pure reducer decision backed by one serial file-system queue, so saves, quits, explorer operations, and disk events cannot race (`W261003HEGE-REQ5@R1`, `W261003HEGE-REQ6@R1`, `W261003HEGE-REQ10@R2`).
- Contain OpenTUI's process-level defaults behind one lifecycle coordinator, so restore and flush are guaranteed (`W261003HEGE-REQ5@R1`, RF3).
- Keep platform integrations (clipboard, trash, ignore) as small detection-plus-adapter modules in `src/workspace` (`W261003HEGE-REQ7@R2`, `W261003HEGE-REQ8@R2`, `W261003HEGE-REQ9@R1`).
- Keep the toolchain, CI, and release reproducible and cheap: exact pins, PR-only CI, native release smoke (`W261003HEGE-REQ2@R2`, `W261003HEGE-REQ4@R3`, `W261003HEGE-REQ12@R1`).

## Requirement Coverage

- `W261003HEGE-REQ1@R3` — inherited DI1 obligations, with additive DI1 protocol needs only
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES2`, `W261003HEGE-DES3`, `W261003HEGE-DES4`, `W261003HEGE-DES5`, `W261003HEGE-DES6`, `W261003HEGE-DES7`, `W261003HEGE-DES8`, `W261003HEGE-DES9`, `W261003HEGE-DES14`, `W261003HEGE-DES15`
  - **How Addressed:** each parent DES assigned to DI1 maps to one W design that fixes its files, symbols, and wiring (Assigned Parent Obligation Coverage below); the protocol additions are exactly `listDir`, `dirListed`, `clipboardText.error`, `FsOp.permanent`, and the `"io"` refusal reason
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/types.ts` — `AppState`, `Action`, `Effect`; `src/core/state/store.ts` — `createStore`; `src/core/kernel/**`; `src/core/filetypes/registry.ts`; `src/workspace/fs.ts`; `src/ui/shell.ts`; `src/app/main.ts`
  - **Callers and Wiring:** `src/app/main.ts` `main` constructs registries, store, effect runner, shell, watcher, lifecycle
  - **Runtime Flow:** section 5 — Startup and first frame; Keystroke to frame; Open a file
  - **Success Criteria:** S2, S3, S6, S7, S8, S9, S14, S15, S16, S17
  - **Verification:** V2.1, V3.1–V3.4, V6.1–V6.5, V7.1–V7.3, V8.1–V8.3, V9.1–V9.2, V14.1–V14.4, V15.1–V15.3, V16.1, V17.1
  - **Research Support:** RF2, RF4, RF5, RF7, RF9, RF10 evaluated `W261003HEGE-REQ1@R1` and retained it; R2 and R3 are design-driven and not research-informed

- `W261003HEGE-REQ2@R2` — exact toolchain, dependency, and action pins
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES1`
  - **How Addressed:** `package.json` exact versions, `bunfig.toml` `install.exact`, committed `bun.lock`, `packageManager` as the single Bun source, SHA-pinned actions, docs updated
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `package.json`, `bunfig.toml`, `bun.lock`, `tsconfig.json`, `.github/workflows/*.yml`, `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md`
  - **Callers and Wiring:** `oven-sh/setup-bun` reads `packageManager`; scripts in `package.json`
  - **Runtime Flow:** None — build-time configuration
  - **Success Criteria:** S1
  - **Verification:** V1.1, V1.2, V1.3, V1.4
  - **Research Support:** RF1 and RF9 evaluated `W261003HEGE-REQ2@R1` and informed `W261003HEGE-REQ2@R2`; RF7 evaluated R1 with no impact

- `W261003HEGE-REQ3@R1` — recorded Neovim expectations
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES3`
  - **How Addressed:** `scripts/record-vim.ts` drives Neovim 0.11.x over RPC (`--listen`) and writes `test/vim/expected.json`; `test/vim/vim.test.ts` replays cases against `handleKey`
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `scripts/record-vim.ts` — `main`, `assertNvim011`; `test/vim/cases.ts` — `cases`; `test/vim/expected.json`; `test/vim/vim.test.ts`
  - **Callers and Wiring:** `package.json` script `record:vim`; not referenced by `check` or CI
  - **Runtime Flow:** section 5 — Vim expectation recording
  - **Success Criteria:** S2
  - **Verification:** V2.1, V2.2, V2.3
  - **Research Support:** RF13 evaluated `W261003HEGE-REQ3@R1` and retained it (RPC and 0.11.7 are design details)

- `W261003HEGE-REQ4@R3` — test layers, PR-only CI, platforms, PTY tooling
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES14`
  - **How Addressed:** `check` script; `ci.yml` on `pull_request` only with PR concurrency; `test` matrix `ubuntu-24.04` + `macos-15`, bench step on Linux; `test/e2e/pty.ts` harness with `Bun.Terminal`, kitty-query reply, `@xterm/headless`, raw-stream assertions
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `.github/workflows/ci.yml`; `package.json` scripts; `test/e2e/pty.ts` — `runInPty`, `TerminalProbe`; `test/e2e/restore.test.ts`; `test/bench/**`
  - **Callers and Wiring:** GitHub `pull_request` event → `ci.yml`
  - **Runtime Flow:** section 5 — CI and PTY verification
  - **Success Criteria:** S8, S15
  - **Verification:** V8.1, V8.2, V15.1, V15.2, V15.3
  - **Research Support:** RF4 and RF6 evaluated `W261003HEGE-REQ4@R1` and informed `W261003HEGE-REQ4@R2` (carried into R3 unchanged); R3's trigger change is user-driven

- `W261003HEGE-REQ5@R1` — quit and close with unsaved buffers
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES4`, `W261003HEGE-DES9`
  - **How Addressed:** `terminal.quit` continuation in state; `save.ts` flush and block rules; `lifecycle.ts` handles signals and exceptions with a 2 s bounded flush through `pendingWrites`
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/save.ts` — `requestQuit`, `closeBuffer`, `pendingWrites`; `src/app/lifecycle.ts` — `installLifecycle`, `shutdown`
  - **Callers and Wiring:** ex commands `:q`, `:wq`, `:q!`, `:bd`, `:bd!` registered in `src/core/state/commands.ts`; `main` installs lifecycle
  - **Runtime Flow:** section 5 — Quit and close; Signal and crash shutdown
  - **Success Criteria:** S4, S8
  - **Verification:** V4.1–V4.5, V8.1, V8.3
  - **Research Support:** RF3 evaluated `W261003HEGE-REQ5@R1` and retained it

- `W261003HEGE-REQ6@R1` — open file deleted or moved outside `so`
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES5`
  - **How Addressed:** `BufferState.disk`; `disk.ts` handles `removed` events and read-back loads; autosave skips deleted buffers; `:w` recreates
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/disk.ts` — `onFileChanged`, `onDiskLoaded`; `src/core/state/save.ts` — `scheduleAutosave`
  - **Callers and Wiring:** `update` routes `fileChanged` and `fileLoaded`
  - **Runtime Flow:** section 5 — External change
  - **Success Criteria:** S5
  - **Verification:** V5.1, V5.2, V5.3, V5.4
  - **Research Support:** RF8 evaluated `W261003HEGE-REQ6@R1` and retained it

- `W261003HEGE-REQ7@R2` — clipboard provider chain
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES10`
  - **How Addressed:** `detectClipboard` in `src/workspace/system.ts` in Neovim order; OSC 52 through `shell.copyOsc52`; session fallback in `vim.registers["+"]`
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/workspace/system.ts` — `detectClipboard`, `ClipboardProvider`; `src/app/effects.ts` — `clipboardWrite`/`clipboardRead` cases; `src/core/state/keys.ts` — paste continuation
  - **Callers and Wiring:** `main` detects once and passes the provider to `createEffectRunner`
  - **Runtime Flow:** section 5 — Clipboard
  - **Success Criteria:** S10
  - **Verification:** V10.1–V10.4
  - **Research Support:** RF12 evaluated `W261003HEGE-REQ7@R1` and informed `W261003HEGE-REQ7@R2`

- `W261003HEGE-REQ8@R2` — trash mechanics per platform
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES11`
  - **How Addressed:** `src/workspace/trash.ts` with `freedesktopTrash` and `macTrash`; `detectTrash`; runtime failure flips availability
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/workspace/trash.ts` — `detectTrash`, `freedesktopTrash`, `macTrash`, `Trash`
  - **Callers and Wiring:** `main` → `detectTrash` → `dispatch(trashAvailable)`; effect runner `trash` case
  - **Runtime Flow:** section 5 — Explorer operation
  - **Success Criteria:** S11
  - **Verification:** V11.1–V11.4
  - **Research Support:** RF11 evaluated `W261003HEGE-REQ8@R1` and informed `W261003HEGE-REQ8@R2`

- `W261003HEGE-REQ9@R1` — workspace exclusion rules
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES12`
  - **How Addressed:** `src/workspace/ignore.ts` `ExclusionMatcher` with per-scope `ignore` instances and cross-scope precedence; used by `listDir`
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/workspace/ignore.ts` — `createExclusionMatcher`, `ExclusionMatcher.isExcluded`; `src/workspace/fs.ts` — `listDir`
  - **Callers and Wiring:** effect runner `listDir` case; DI2 worker reuses the module
  - **Runtime Flow:** section 5 — Explorer listing
  - **Success Criteria:** S12
  - **Verification:** V12.1–V12.4
  - **Research Support:** RF8 and RF14 evaluated `W261003HEGE-REQ9@R1` and retained it

- `W261003HEGE-REQ10@R2` — safe explorer operations and open buffers
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES13`, `W261003HEGE-DES4`, `W261003HEGE-DES5`
  - **How Addressed:** `explorer.ts` emits flush writes followed by the operation through the serial queue; `fsResult` re-paths buffers; no-overwrite file operations; own-operation suppression in the watcher
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/explorer.ts` — `explorerOp`, `onFsResult`; `src/workspace/fs.ts` — `createEntry`, `moveEntry`; `src/workspace/watcher.ts` — `OwnOps`
  - **Callers and Wiring:** explorer keys `a r m d` bound in `src/core/kernel/commands/defaults.ts` to `explorer.*` commands
  - **Runtime Flow:** section 5 — Explorer operation
  - **Success Criteria:** S13, S5
  - **Verification:** V13.1–V13.5, V5.5
  - **Research Support:** RF8 evaluated `W261003HEGE-REQ10@R1` and informed `W261003HEGE-REQ10@R2`; RF11 evaluated R1 with no impact

- `W261003HEGE-REQ11@R2` — recognized languages and file types
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES6`
  - **How Addressed:** `src/core/lang/code/file-types.ts` static table over the 34 non-session `common` grammars; `lowlightHighlighter` windowed with a look-back
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/lang/code/file-types.ts` — `CODE_LANGUAGES`, `codeFileTypes`; `src/core/lang/code/highlight.ts` — `lowlightHighlighter`; `src/core/lang/markdown/file-type.ts` — `markdownFileType`
  - **Callers and Wiring:** `main` registers them into `FileTypeRegistry`
  - **Runtime Flow:** section 5 — Open a file
  - **Success Criteria:** S6, S17
  - **Verification:** V6.1, V6.2, V6.3, V17.1
  - **Research Support:** RF10 evaluated `W261003HEGE-REQ11@R1` and informed `W261003HEGE-REQ11@R2`

- `W261003HEGE-REQ12@R1` — native smoke of every release binary
  - **Coverage Outcome:** System design required
  - **System Design:** `W261003HEGE-DES15`
  - **How Addressed:** `release.yml` builds on one runner, smokes on four native runners, publishes after all smoke jobs pass
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `.github/workflows/release.yml` — jobs `build`, `smoke`, `publish`; `.github/workflows/release-please.yml`; `src/app/main.ts` — `VERSION`
  - **Callers and Wiring:** `release-please.yml` calls `release.yml` via `workflow_call`; tag push `v*` triggers it directly
  - **Runtime Flow:** section 5 — Release
  - **Success Criteria:** S16
  - **Verification:** V16.1, V16.2
  - **Research Support:** RF7 evaluated `W261003HEGE-REQ1@R1` and informed `W261003HEGE-REQ12@R1`

## Assigned Parent Obligation Coverage

- **Parent Baseline**
  - **Binding:** `w261003hege-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH1@R2, RM261003ABZP-DI1@R2).
  - **Assessment:** Aligned. On 2026-10-03 the index (`rm261003abzp-roadmap-index.md:131`, `:142`) and phase file (`rm261003abzp-roadmap-phase-1-daily-usable-editor.md:323-424`) carry the accepted revisions; no newer PH/DI/REQ/DES/UDES revision exists; no other W is bound to DI1. RF2 confirms the OpenTUI shape and RF8 confirms recursive `fs.watch` on macOS and Linux, so the phase's return-to-design condition (`…phase-1…md:423`) is not met. Two parent changes are approved and await parent writes (Parent Synchronization below).
  - **Design Approval Gates:** None — DI1 has no prerequisite (`…phase-1…md:395`); G1 is produced by this work and checked at DI2 execution.

Parent obligations are grouped by record. Every group is `System design required`, because DI1 starts from an empty repository.

| Obligation | Parent | Work Requirements | Work Design | Success | Verification | Treatment |
|---|---|---|---|---|---|---|
| Folder workspace, text files, safe files | RM261003ABZP-REQ1@R3 | REQ1@R3, REQ5@R1, REQ6@R1, REQ8@R2, REQ9@R1, REQ10@R2, REQ11@R2 | DES4, DES5, DES8, DES11, DES12, DES13, DES6 | S3, S4, S5, S6, S11, S12, S13 | V3.*, V4.*, V5.*, V6.*, V11.*, V12.*, V13.* | Refined: quit, deletion, trash, exclusion, explorer, and language rules added |
| Vim editing | RM261003ABZP-REQ2@R2 | REQ1@R3, REQ3@R1, REQ5@R1, REQ7@R2 | DES3, DES9, DES10 | S2, S9, S10 | V2.*, V9.*, V10.* | Refined: Neovim recording method; `"+` providers; Esc effective timeout `max(escTimeoutMs, 20)` (RF4) |
| Benchmark harness and gate | RM261003ABZP-REQ9@R2 (harness only) | REQ1@R3, REQ4@R3 | DES14, DES7 | S15, S17 | V15.3, V17.1 | Inherited |
| Development, CI, release | RM261003ABZP-REQ10@R2 | REQ1@R3, REQ2@R2, REQ4@R3, REQ12@R1 | DES1, DES14, DES15 | S1, S15, S16 | V1.*, V15.*, V16.* | Refined with an approved parent change: CI triggers on pull requests only (user instruction, REQ4@R3); native smoke added (REQ12@R1) |
| Foundations, kernel rule, restore | RM261003ABZP-REQ11@R3 | REQ1@R3, REQ4@R3, REQ11@R2 | DES2, DES3, DES6, DES7, DES9, DES14 | S7, S8 | V7.*, V8.* | Inherited |
| Four layers, kernel rule, boundary test | RM261003ABZP-DES1@R2 | REQ1@R3 | DES2, DES14 | S7 | V7.1, V7.2 | Inherited |
| Store and data effects | RM261003ABZP-DES2@R2 | REQ1@R3 | DES2, DES4 | S3, S7 | V3.1, V7.3 | Refined: `createStore(initial, update, run)` with `createUpdate(registries)`; additive `listDir`/`dirListed`/`clipboardText.error`/`FsOp.permanent`/`fileRefused` `"io"` |
| TextBuffer and undo | RM261003ABZP-DES3@R1 | REQ1@R3 | DES3 | S2 | V2.1, V2.4 | Inherited |
| Table-driven vim engine | RM261003ABZP-DES4@R1 | REQ1@R3, REQ3@R1 | DES3 | S2 | V2.1 | Inherited |
| Registry and keymap with `KeyScope` | RM261003ABZP-DES5@R2 | REQ1@R3 | DES3 | S7 | V7.5 | Inherited (global bindings only) |
| Atomic save, watching, trash | RM261003ABZP-DES8@R1 | REQ1@R3, REQ6@R1, REQ8@R2, REQ10@R2 | DES4, DES5, DES8, DES11 | S3, S5, S11 | V3.*, V5.*, V11.* | Refined: macOS trash via `NSFileManager` instead of Finder (REQ8@R2) |
| Kernel text view | RM261003ABZP-DES9@R3 (kernel only) | REQ1@R3 | DES7 | S17, S7 | V17.1, V7.4 | Inherited at final shape |
| OpenTUI shell, input, restore | RM261003ABZP-DES10@R2 | REQ1@R3, REQ5@R1 | DES9 | S8, S9, S14 | V8.*, V9.*, V14.* | Refined: renderer options and lifecycle ownership (RF3); Esc hold (RF4) |
| Config schema defaults | RM261003ABZP-DES14@R1 (DI1 part) | REQ1@R3 | DES2 | S9 | V9.1 | Inherited (defaults only) |
| Toolchain, CI, release | RM261003ABZP-DES15@R1 | REQ1@R3, REQ2@R2, REQ4@R3, REQ12@R1 | DES1, DES14, DES15 | S1, S15, S16 | V1.*, V15.*, V16.* | Refined: PR-only CI; reusable release workflow (RF9); four native smoke jobs |
| Performance by construction, bench gate | RM261003ABZP-DES16@R1 | REQ1@R3, REQ4@R3 | DES7, DES9, DES14 | S15, S17 | V15.3, V17.1 | Inherited |
| File types, highlighter, open policy | RM261003ABZP-DES17@R1 | REQ1@R3, REQ11@R2 | DES6, DES8 | S6 | V6.* | Inherited |
| Notes never lost | RM261003ABZP-S1@R1 / V1@R1 | REQ1@R3, REQ5@R1, REQ6@R1 | DES4, DES5, DES8 | S3, S4, S5 | V3.1–V3.4 (V1 a–d), V4.*, V5.* | Inherited |
| Neovim-equal vim | RM261003ABZP-S2@R1 / V2@R1, V3@R1 | REQ1@R3, REQ3@R1 | DES3, DES9 | S2, S9 | V2.1 (V2), V9.1–V9.2 (V3) | Inherited |
| Fast check, CI, release | RM261003ABZP-S10@R1 / V14@R1 | REQ2@R2, REQ4@R3, REQ12@R1 | DES1, DES14, DES15 | S1, S15, S16 | V1.3, V15.2, V16.1 | Refined (PR-only CI) |
| Boundaries and restore | RM261003ABZP-S11@R1 / V15@R2, V17@R1 | REQ1@R3, REQ4@R3 | DES14, DES9 | S7, S8 | V7.1–V7.2 (V15), V8.1–V8.2 (V17) | Inherited |
| Any text file opens safely | RM261003ABZP-S12@R1 / V18@R1 | REQ1@R3, REQ11@R2 | DES6, DES8 | S6, S3 | V6.1–V6.5 (V18) | Inherited |
| UI shell, modes, file safety, accessibility | RM261003ABZP-US1@R2 (UV1 DI1 states, UV2), US5@R2 (UV6), US9@R1 (UV10 DI1 states); UREQ1/2/3/7/11; UDES1/2/3/7/11; M1@R1, M4@R1, AD4 | REQ1@R3 | DES9, DES13 | S14 | V14.1–V14.4 | Inherited: this design supplies the state, components, and wiring; visuals come from the accepted UI design |

### Parent Synchronization

`Pending parent synchronization` — parent writes are not authorized in this run. Proposed changes, each with its evidence:

1. `rm261003abzp-requirements.md` RM261003ABZP-REQ10@R2 acceptance "CI on every push and pull request" → "CI on every pull request". Evidence: user instruction 2026-10-03 "CI should only run in PR"; `W261003HEGE-REQ4@R3`; this design's DES14. Affected: `rm261003abzp-design.md` DES15@R1 ("CI jobs `check` and `test`"), phase file line 132.
2. `rm261003abzp-design.md` DES15@R1 smoke "on `macos-latest` and `ubuntu-latest`" → four native runners; release job reached through `workflow_call` from release-please (RF9). Evidence: RF7, RF9, `W261003HEGE-REQ12@R1`, DES15.
3. Phase file DI1 code shape `src/core/state/types.ts` (lines 205–220): add Effect `listDir`, Action `dirListed`, optional `clipboardText.error`, optional `FsOp.permanent: true`, `"io"` in `fileRefused.reason`; `createStore(initial, update, run)`. Evidence: `W261003HEGE-REQ1@R3`, DES2.
4. Phase file Unresolved Items line 632 and DI1 boundary line 417: "Finder-trash automation" → "macOS trash via `/usr/bin/trash` or `NSFileManager`". Evidence: RF11, `W261003HEGE-REQ8@R2`.
5. `rm261003abzp-design.md` V3@R1 and AppConfig `escTimeoutMs`: effective timeout is `max(escTimeoutMs, 20)` because OpenTUI resolves legacy Esc at 20 ms. The default 50 ms result is unchanged. Evidence: RF4, DES9.
6. Delivery confirmations to record against phase Unresolved Items: Bun 1.4.2 and `@opentui/core` 0.5.14 pinned (RF1); OpenTUI paint, buffer, and test-renderer APIs confirmed (RF2, RF5); recursive `fs.watch` confirmed on macOS and Linux (RF8; CI re-proves); lowlight `common` 37 grammars (RF10).
7. Index Work Progress DI1 and phase Progress DI1: stage `Discussing` → `System design finalized`, Work `W261003HEGE` (the context receipt's registration change still applies).

## Binding Constraints

- `rm261003abzp-design.md:50-57` — import rules: `core` imports no I/O, UI, or runtime APIs; only `src/ui` imports `@opentui/*`; `core/kernel` imports only `core/kernel`; `core/filetypes` → kernel; `core/lang` → kernel, filetypes; `core/state` and `core/config` compose all core.
- `rm261003abzp-design.md:342` — `update` is pure and synchronous; no effect runs inside `update`; effects carry all data.
- `rm261003abzp-design.md:357` — one active window; a buffer's `view` is one of its file type's views; `dirty=false` buffers match their saved stamp.
- `rm261003abzp-design.md:367` — TextBuffer keeps `\n` in memory and restores separator, trailing newline, and BOM on save; UTF-16 positions.
- `rm261003abzp-design.md:395-397` — `Highlighter` and `Span` are kernel types; file types never change at runtime; providers are pure and visible-lines only.
- `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:188-192` — DI1 AppState fields only; the final shape equals DES2@R2.
- `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:416-423` — no later-DI fields, no weakened safety/restore/boundary rules, no G1 contract changes, no language code in `core/kernel`.
- `.s1mple/S1MPLE.md:59` — keep the implementation lean and simple.
- `rm261003abzp-ui-design.md:404-421` — UI composition model and file names consumed by DES9.

## Cross-Cutting Applicability

| Concern | Applicability | Design Location or Reason |
|---|---|---|
| Security and privacy | Applicable | No network at runtime; clipboard and trash spawn fixed argv (no shell) in `src/workspace/system.ts`, `src/workspace/trash.ts`; JXA script passes the path as an argument, never interpolated (DES11, V11.3); temp files are `0600` until `chmod` to the original mode (DES8, V3.2); SHA-pinned actions (DES1, V1.2); no note content logged |
| Configuration | Applicable | `src/core/config/schema.ts` `defaults` used directly (no file in DI1); `NO_COLOR` read once in `main` into `AppState.terminal.color` (DES2, DES9, V8.2) |
| Observability | None — `SO_LOG` debug logging belongs to the config work in DI2 (`rm261003abzp-design.md:837`, DES14@R1); DI1 failures surface in the message line and toasts, and `so --version` prints the build version (DES15, V16.1) |
| Performance and scalability | Applicable | Viewport-only `layoutText` (DES7), windowed highlighting with 200-line look-back and per-buffer-version cache (DES6), render coalescing via `requestRender` (DES9), first frame from shallow `listDir` (DES2); bench gate (DES14, V15.3, V17.1) |
| Concurrency | Applicable | Single-threaded store; one serial FS queue for `write/create/rename/move/trash` in `src/app/effects.ts` `createEffectRunner` (DES4, V3.4, V13.4); watcher events debounced per path (DES5) |
| Retry and idempotency | Applicable | Autosave retry backoff 1/2/4…30 s via timers (DES4, V3.3); own-operation stamps make watcher events idempotent (DES5, V5.1); exclusive create and no-replace move make explorer operations safe to retry (DES8, V13.1) |
| Migration and rollout | None — greenfield repository; no persisted format exists in DI1 (state file arrives in DI2). Rollout is the DI1 PR plus the `v0.1.0-rc.1` prerelease (DES15) |

## Focused Code Surface

- **Existing:** None — the repository holds only `.s1mple/`, `.gitignore`, `AGENTS.md`, and `CLAUDE.md` (`w261003hege-discuss-context.md`, Project Structure).
- **Proposed:** `package.json`, `tsconfig.json`, `bunfig.toml`, `biome.json`, `knip.json` — toolchain — Traces to `W261003HEGE-DES1`
- **Proposed:** `src/core/state/{types,store,update,keys,save,disk,explorer,commands,status,init}.ts` — store and reducers — Traces to `W261003HEGE-DES2`, `W261003HEGE-DES4`, `W261003HEGE-DES5`, `W261003HEGE-DES13`
- **Proposed:** `src/core/kernel/{text,editor,vim,commands,view}/*` — kernel — Traces to `W261003HEGE-DES3`, `W261003HEGE-DES7`
- **Proposed:** `src/core/filetypes/registry.ts`, `src/core/lang/code/*`, `src/core/lang/markdown/file-type.ts` — Traces to `W261003HEGE-DES6`
- **Proposed:** `src/workspace/{fs,watcher,trash,system,ignore}.ts` — Traces to `W261003HEGE-DES5`, `W261003HEGE-DES8`, `W261003HEGE-DES10`, `W261003HEGE-DES11`, `W261003HEGE-DES12`
- **Proposed:** `src/ui/**`, `src/app/{main,effects,lifecycle}.ts` — Traces to `W261003HEGE-DES9`, `W261003HEGE-DES4`
- **Proposed:** `test/**`, `scripts/record-vim.ts`, `.github/workflows/*` — Traces to `W261003HEGE-DES3`, `W261003HEGE-DES14`, `W261003HEGE-DES15`

# 2. System Context and Architecture

## System Context

```text
                    ┌──────────────────────────── so (one Bun process) ───────────────────────────┐
 user ⇄ terminal ⇄  │ OpenTUI renderer (src/ui) ⇄ store (src/core) ⇄ effect runner (src/app)      │
 (keys, mouse,      │                                              │                               │
  OSC 52, PTY)      └──────────────────────────────────────────────┼───────────────────────────────┘
                                                                   ▼
          workspace folder (fs, fs.watch) · $XDG_DATA_HOME/Trash · /usr/bin/trash | osascript
          pbcopy/wl-copy/xsel/xclip/tmux · $TMPDIR (OpenTUI native lib extraction)
 developer ⇄ bun run check · scripts/record-vim.ts (Neovim 0.11.x, local only)
 GitHub ⇄ ci.yml (pull_request) · release-please.yml (push main) · release.yml (workflow_call | tag v*)
```

## Proposed Architecture

```text
bin/so ─► src/app/main.ts main()
            ├─ parseArgs → resolveWorkspace (missing → stderr, exit 2) · --version → VERSION
            ├─ registries: FileTypeRegistry(text, codeFileTypes, markdownFileType) · EditorKindRegistry(text)
            │              CommandRegistry(builtinCommands) · Keymap(defaultBindings)
            ├─ ui: createRenderer() ─► createShell(renderer, store, deps)
            ├─ store = createStore(initialState(...), createUpdate(registries), runner.run)
            ├─ runner = createEffectRunner({fs, trash, clipboard, ownOps, shell, dispatch})
            │            serial queue: write | create | rename | move | trash      parallel: read | listDir
            ├─ installLifecycle({store, shell, runner})   ← signals, uncaughtException, :q exit
            └─ after first frame: watchWorkspace(root, ownOps, emit) · detectTrash · detectClipboard

src/core/state  update(state, action) ─► keys.ts (keymap → command | vim.handleKey) · save.ts · disk.ts
                                          explorer.ts · commands.ts (ex + built-ins) · status.ts (segments)
src/core/kernel text · editor (undo, registers, windows) · vim (parser, motions, operators, text objects,
                search, ex parse) · commands (registry, keymap trie, defaults) · view (layoutText, marks)
src/core/filetypes registry · src/core/lang/code (lowlight table + highlighter) · lang/markdown/file-type.ts
src/workspace  fs (readTextFile, atomicWrite, listDir, createEntry, moveEntry, removeEntry) · watcher (OwnOps)
               ignore (ExclusionMatcher) · trash · system (clipboard)
src/ui         shell · input (KeyNormalizer) · theme · editors/{registry,text-view} · views/* · overlays/*
```

The core decides everything; adapters only execute effects and report results as actions. DI1's main design choice is one **serial file-system queue** in the effect runner. Saves, explorer operations, and quit flushes are emitted by pure reducers as ordered effect lists. Ordering is a property of the queue, so no reducer needs locks or callbacks. The tradeoff is that independent file operations never run in parallel. For an interactive single-user editor this is invisible, and it removes the main class of save races (write-vs-rename, write-vs-trash).

The second choice is that **OpenTUI's process handlers are switched off** and replaced by `src/app/lifecycle.ts` (RF3). This is the only way to get a bounded flush before restore, and a guaranteed exit on uncaught exceptions.

# 3. Components and Boundaries

## App composition root

- **Target:** `src/app/main.ts`, `src/app/effects.ts`, `src/app/lifecycle.ts`, `bin/so`
- **Kind:** composition root and adapters orchestration
- **Responsibilities:**
  - Parse CLI arguments, resolve the workspace, print `--version`.
  - Construct registries, store, effect runner, shell, watcher, detectors; install lifecycle handlers.
  - Run effects in order (serial FS queue) and dispatch result actions.
  - Own process exit codes and shutdown order (flush → restore → exit).
- **Collaborators:**

  ```text
  main → createStore, createUpdate, createEffectRunner, createRenderer, createShell, installLifecycle, watchWorkspace
  createEffectRunner.run(effect) → workspace/* → dispatch(resultAction)
  ```

- **Boundary Contract:** Action and Effect protocol (section 6)
- **Detailed Design:** section 7 — `src/app/main.ts`, `src/app/effects.ts`, `src/app/lifecycle.ts`
- **Must Not Own:**
  - product rules (autosave timing, conflict decisions, buffer re-pathing) — core owns them.

## Core state

- **Target:** `src/core/state/`
- **Kind:** pure reducer modules
- **Responsibilities:**
  - `AppState` DI1 shape, `Action`/`Effect` unions, `createUpdate`, `createStore`.
  - Key routing (keymap first, then vim), ex execution, built-in commands.
  - Save state machine, autosave and retry timers, quit continuation, close rules.
  - Disk events: reload, conflict, deleted on disk.
  - Explorer tree state and operations; status segments.
- **Collaborators:**

  ```text
  update → keys.handleKey → Keymap.lookup | vim.handleKey → TextBuffer.apply
  update → save.* | disk.* | explorer.* → Effect[]
  ```

- **Boundary Contract:** Action and Effect protocol; AppState
- **Detailed Design:** section 7 — `src/core/state/*`
- **Must Not Own:**
  - I/O, timers, terminal sequences, `Date.now()`.

## Core kernel

- **Target:** `src/core/kernel/`
- **Kind:** language-neutral library
- **Responsibilities:** TextBuffer, undo blocks, registers, window tree, vim engine, ex parsing and completion data, command registry, keymap trie, text view and mark providers.
- **Collaborators:**

  ```text
  core/state → handleKey(BufferVim, Key, VimEnv) → { s, effects: VimEffect[] }
  ui/editors/text-view → layoutText(TextView, providers, analysis) → RenderLine[]
  ```

- **Boundary Contract:** parent shapes at `rm261003abzp-design.md:492-510` (registry), `:536-551` (TextBuffer, vim), `:607-620` (view)
- **Detailed Design:** section 7 — `src/core/kernel/vim/*`, `src/core/kernel/editor/*`, `src/core/kernel/view/*`
- **Must Not Own:**
  - anything Markdown-, note-, or file-system-specific; imports outside `core/kernel`.

## File types and languages

- **Target:** `src/core/filetypes/registry.ts`, `src/core/lang/code/`, `src/core/lang/markdown/file-type.ts`
- **Kind:** registries and registrations
- **Responsibilities:** path → file type; lowlight highlighter; code file-type table; `markdown` source-only file type.
- **Collaborators:**

  ```text
  main → FileTypeRegistry.register(...) ; core/state open → forPath(path)
  highlightMarks(ft.highlighter) → Highlighter.highlight(buf, lines)
  ```

- **Boundary Contract:** FileType and Decoration model (`rm261003abzp-design.md:391-399`)
- **Detailed Design:** section 7 — `src/core/filetypes/registry.ts`, `src/core/lang/code/file-types.ts`, `src/core/lang/code/highlight.ts`
- **Must Not Own:**
  - file reading; UI colours (style tokens only).

## Workspace adapters

- **Target:** `src/workspace/`
- **Kind:** I/O adapters
- **Responsibilities:** text read policy, atomic write, listing with exclusion, create/move/remove, watcher with own-operation suppression, trash, clipboard detection.
- **Collaborators:**

  ```text
  effect runner → readTextFile | atomicWrite | listDir | createEntry | moveEntry | removeEntry | Trash.move | ClipboardProvider
  watchWorkspace → OwnOps.isOwn → emit(FileEvent)
  ```

- **Boundary Contract:** Effect protocol; `FileEvent`; `TextFile`; `Stamp`
- **Detailed Design:** section 7 — `src/workspace/*`
- **Must Not Own:**
  - conflict, autosave, or re-pathing decisions.

## UI shell

- **Target:** `src/ui/`
- **Kind:** OpenTUI adapter
- **Responsibilities:** renderer construction with safe options; key normalization with Esc hold; region composition per `rm261003abzp-ui-design.md:404-421`; `EditorView` painting `RenderLine[]`; theme with `NO_COLOR`; OSC 52 copy; `destroy()` for restore.
- **Collaborators:**

  ```text
  OpenTUI keypress → KeyNormalizer.feed → dispatch(key)
  store.subscribe → views.update(state, layoutClass) → renderer.requestRender()
  ```

- **Boundary Contract:** `Key`, `RenderLine`, `AppState` (read-only)
- **Detailed Design:** section 7 — `src/ui/shell.ts`, `src/ui/input.ts`, `src/ui/editors/text-view.ts`, `src/ui/theme.ts`
- **Must Not Own:**
  - state changes, file-type branching, file I/O.

# 4. Project Structure Changes

**Proposed Structure — not an actual Git diff.**

**Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [A] package.json
│       Contains: one package "so"; exact pins; scripts dev, check, test, test:ci, bench, build, record:vim
│       Symbols: packageManager "bun@1.4.2", bin.so, scripts.*
│       Decisions: DES1, DES14
├── [A] bun.lock
│       Contains: frozen lockfile, all platform optional packages recorded
│       Decisions: DES1
├── [A] bunfig.toml
│       Contains: [install] exact = true
│       Decisions: DES1
├── [A] tsconfig.json
│       Contains: strict ESM, noEmit, module Preserve, moduleResolution bundler, verbatimModuleSyntax, types [bun], skipLibCheck
│       Decisions: DES1
├── [A] biome.json
│       Contains: formatter + linter; ignores test/vim/expected.json, dist
│       Decisions: DES1
├── [A] knip.json
│       Contains: entry src/app/main.ts, scripts/*.ts, test/**; project src/**
│       Decisions: DES1
├── [A] release-please-config.json
│       Contains: packages "." release-type node, bump-minor-pre-major, include-component-in-tag false, initial-version 0.1.0
│       Decisions: DES15
├── [A] .release-please-manifest.json
│       Contains: { ".": "0.0.0" }
│       Decisions: DES15
├── [M] .gitignore
│       Contains: + dist/ already present; add .so-bench/ (bench output)
│       Decisions: DES14
├── [A] .github/workflows/ci.yml
│       Contains: on pull_request only; concurrency per PR; jobs check (ubuntu-24.04), test matrix [ubuntu-24.04, macos-15] with bench step on Linux
│       Decisions: DES14
├── [A] .github/workflows/release-please.yml
│       Contains: on push main; release-please-action v5 (SHA); calls release.yml when release_created
│       Decisions: DES15
├── [A] .github/workflows/release.yml
│       Contains: on workflow_call(tag) | push tags v*; jobs build, smoke[4 native], publish
│       Decisions: DES15
├── [A] bin/so
│       Contains: #!/usr/bin/env bun → import "../src/app/main.ts"
│       Decisions: DES1
├── [A] scripts/record-vim.ts
│       Contains: Neovim 0.11.x RPC recorder
│       Symbols: main, assertNvim011, recordCase
│       Decisions: DES3
├── [A] scripts/bench-gate.ts
│       Contains: runs bench files 5×, median, compares 2× target, exit code
│       Symbols: main, TARGETS
│       Decisions: DES14
├── [A] src/app/main.ts
│       Symbols: main, parseCli, resolveWorkspace, VERSION
│       Decisions: DES2, DES9, DES15
├── [A] src/app/effects.ts
│       Symbols: createEffectRunner, EffectRunner, serialQueue
│       Decisions: DES4, DES10, DES11, DES13
├── [A] src/app/lifecycle.ts
│       Symbols: installLifecycle, shutdown, FLUSH_BOUND_MS
│       Decisions: DES9, DES4
├── [A] src/core/state/types.ts
│       Symbols: AppState, BufferState, SaveState, WindowState, ExplorerState, Overlay, Action, Effect, FsOp, FileEvent, Stamp, TextFile, DirEntry, TimerId
│       Decisions: DES2
├── [A] src/core/state/store.ts
│       Symbols: createStore, Store
│       Decisions: DES2
├── [A] src/core/state/update.ts
│       Symbols: createUpdate, Update, Registries
│       Decisions: DES2
├── [A] src/core/state/init.ts
│       Symbols: initialState
│       Decisions: DES2
├── [A] src/core/state/keys.ts
│       Symbols: handleKeyAction, applyVimEffects
│       Decisions: DES2, DES3, DES10
├── [A] src/core/state/buffers.ts
│       Symbols: openPath, onFileLoaded, onFileRefused, bufferForPath, saveText
│       Decisions: DES2, DES6
├── [A] src/core/state/save.ts
│       Symbols: scheduleAutosave, onTimer, writeBuffer, onSaved, onSaveFailed, requestQuit, closeBuffer, pendingWrites, retryDelay
│       Decisions: DES4
├── [A] src/core/state/disk.ts
│       Symbols: onFileChanged, onDiskLoaded, resolveConflict
│       Decisions: DES5
├── [A] src/core/state/explorer.ts
│       Symbols: explorerOp, onDirListed, onFsResult, toggleExplorer
│       Decisions: DES13
├── [A] src/core/state/commands.ts
│       Symbols: AppCommand, CommandContext, registerBuiltins, EX_ALIASES
│       Decisions: DES2, DES4, DES13
├── [A] src/core/state/status.ts
│       Symbols: statusSegments, countWords
│       Decisions: DES2
├── [A] src/core/config/schema.ts
│       Symbols: ConfigSchema, defaults, AppConfig
│       Decisions: DES2
├── [A] src/core/kernel/text/{pos,text-buffer}.ts
│       Symbols: Pos, Range, Edit, TextBuffer, createTextBuffer
│       Decisions: DES3
├── [A] src/core/kernel/editor/{undo,registers,windows}.ts
│       Symbols: UndoHistory, Registers, RegisterName, WindowTree, splitWindow, closeWindow, focusDirection
│       Decisions: DES3
├── [A] src/core/kernel/vim/{types,keys,parser,motions,operators,text-objects,search,ex,engine}.ts
│       Symbols: Key, VimState, BufferVim, VimEnv, VimEffect, parseKeys, motions, operators, textObjects, searchPattern, parseEx, exCompletions, handleKey
│       Decisions: DES3
├── [A] src/core/kernel/commands/{registry,keymap,defaults}.ts
│       Symbols: Command, CommandRegistry, Mode, KeyScope, Keymap, WhichKeyItem, defaultBindings
│       Decisions: DES3, DES13
├── [A] src/core/kernel/view/{types,decorations,text-view,marks}.ts
│       Symbols: TextView, RenderLine, Span, StyleToken, Widget, Decoration, DecorationProvider, Highlighter, layoutText, highlightMarks, searchMarks, selectionMarks
│       Decisions: DES7
├── [A] src/core/filetypes/registry.ts
│       Symbols: FileType, ViewSpec, EditorKind, EditorKindSpec, FileTypeRegistry, EditorKindRegistry, textFileType
│       Decisions: DES6
├── [A] src/core/lang/code/{file-types,highlight}.ts
│       Symbols: CODE_LANGUAGES, codeFileTypes, lowlightHighlighter, HLJS_TOKENS
│       Decisions: DES6
├── [A] src/core/lang/markdown/file-type.ts
│       Symbols: markdownFileType
│       Decisions: DES6
├── [A] src/workspace/fs.ts
│       Symbols: readTextFile, atomicWrite, listDir, createEntry, moveEntry, removeEntry, stampOf, FsError
│       Decisions: DES8, DES12, DES13
├── [A] src/workspace/watcher.ts
│       Symbols: watchWorkspace, OwnOps, createOwnOps
│       Decisions: DES5
├── [A] src/workspace/ignore.ts
│       Symbols: createExclusionMatcher, ExclusionMatcher, ALWAYS_HIDDEN
│       Decisions: DES12
├── [A] src/workspace/trash.ts
│       Symbols: Trash, detectTrash, freedesktopTrash, macTrash, trashInfo
│       Decisions: DES11
├── [A] src/workspace/system.ts
│       Symbols: ClipboardProvider, detectClipboard, commandProvider, osc52Provider
│       Decisions: DES10
├── [A] src/ui/shell.ts
│       Symbols: createRenderer, createShell, Shell, layoutClass, RENDERER_OPTIONS
│       Decisions: DES9
├── [A] src/ui/input.ts
│       Symbols: createKeyNormalizer, KeyNormalizer, toKey, OPENTUI_ESC_MS
│       Decisions: DES9
├── [A] src/ui/theme.ts
│       Symbols: Theme, themes (dark, light, nocolor), resolveTheme
│       Decisions: DES9
├── [A] src/ui/editors/{registry,text-view}.ts
│       Symbols: editorViews, registerEditorView, EditorView, paintLine
│       Decisions: DES9, DES7
├── [A] src/ui/views/{bufferline,explorer,statusline,cmdline,window-tree}.ts
│       Symbols: Bufferline, ExplorerView, Statusline, CommandLine, WindowTree
│       Decisions: DES9
├── [A] src/ui/overlays/{host,prompt,conflict,notify}.ts
│       Symbols: OverlayHost, PromptView, ConflictView, ToastStack
│       Decisions: DES9
├── [A] src/**/*.test.ts (colocated unit tests; names in section 8)
│       Decisions: DES3, DES4, DES5, DES6, DES7, DES9, DES10, DES12, DES13
├── [A] test/boundaries.test.ts
│       Symbols: LAYER_RULES, checkImports
│       Decisions: DES14
├── [A] test/repo.test.ts
│       Contains: exact npm pins, SHA-pinned actions, CI trigger shape
│       Decisions: DES1, DES14
├── [A] test/fixtures/boundary-violation/{core-imports-fs.ts,kernel-imports-markdown.ts}
│       Decisions: DES14
├── [A] test/fixtures/workspace/
│       Contains: notes, scripts/sync.ts, config.yaml, notes.txt, Makefile, photo.png, nul-at-100.bin, invalid-utf8.txt,
│                 crlf-bom.md, .gitignore files (root and pkg/), .env, node_modules/, build/, pkg/dist/, keep.log
│       Decisions: DES6, DES12, DES14
├── [A] test/fixtures/generate.ts
│       Symbols: makeLargeFile (17 MiB), make5000LineNote
│       Decisions: DES14
├── [A] test/vim/{cases.ts,expected.json,vim.test.ts}
│       Decisions: DES3
├── [A] test/integration/{save-safety,open-save,explorer-ops}.test.ts
│       Decisions: DES4, DES5, DES8, DES13
├── [A] test/ui/{shell.golden,cmdline,file-ops,esc}.test.ts, test/ui/__snapshots__/
│       Decisions: DES9
├── [A] test/e2e/{pty.ts,restore.test.ts,quit.test.ts}
│       Symbols: runInPty, TerminalProbe
│       Decisions: DES14, DES4, DES9
├── [A] test/bench/{source-keystroke,open-file}.bench.ts
│       Decisions: DES14, DES7
├── [M] .s1mple/docs/project.md
│       Contains: stack, pins, scripts, test layers, CI trigger, structure (replaces "Not established")
│       Decisions: DES1, DES14
└── [M] .s1mple/docs/languages/typescript.md
        Contains: TS 7.0.2, tsconfig rules incl. skipLibCheck, Biome, knip, bun test conventions
        Decisions: DES1
```

`src/preview/`, `src/ui/widgets/`, `src/core/lang/markdown/{doc,blocks,syntax}.ts`, `src/core/features/**`, and `src/workspace/{index-worker,config-file,state-file}.ts` are intentionally absent (later DIs, `…phase-1…md:110`, `:140-146`).

# 5. Runtime Flows and Error Policies

## Startup and first frame

**Participating Symbols:** `main`, `parseCli`, `resolveWorkspace`, `initialState`, `createRenderer`, `createShell`, `createStore`, `createEffectRunner`, `installLifecycle`, `watchWorkspace`, `detectTrash`, `detectClipboard`

**Illustrative Flow:**

```text
so [path] → parseCli ─ --version → print "so <VERSION>" → exit 0
          → resolveWorkspace(path ?? cwd) ─ missing → stderr "so: no such file or directory: <path>" → exit 2
          → {root, file?} → registries → createRenderer(RENDERER_OPTIONS) → store(initialState) → shell
          → dispatch boot: Effect listDir(root) [+ read(file)] → dirListed / fileLoaded → first frame
          → setImmediate after first render: watchWorkspace · detectTrash → trashAvailable · detectClipboard
```

1. `parseCli` uses `node:util` `parseArgs` (`--version`, `--help`, one positional).
2. `resolveWorkspace` returns the folder, or the file's parent plus the file; `ENOENT` exits 2 before the renderer starts, so the terminal is never touched.
3. `initialState` reads `cols/rows` from the renderer and `NO_COLOR`/defaults into `terminal` and `config`.
4. The first frame needs only `listDir(root)` (shallow) and the opened file; watcher and detectors start afterwards.

**Detailed Control Flow:** section 7 — `src/app/main.ts` `main`

## Keystroke to frame

**Participating Symbols:** `KeyNormalizer.feed`, `handleKeyAction`, `Keymap.lookup`, `handleKey`, `applyVimEffects`, `scheduleAutosave`, `layoutText`, `EditorView.renderSelf`

**Illustrative Flow:**

```text
OpenTUI KeyEvent → KeyNormalizer.feed (Esc hold) → dispatch({type:"key", key, now})
  → update → handleKeyAction: mode cmdline? → cmdline edit / execute ex
                              Keymap.lookup({mode}, pending) → command → run(ctx)
                              else vim.handleKey(BufferVim, key, env) → VimEffect[] → applyVimEffects
                                   changed → buffer.dirty, scheduleAutosave(now) ; yank "+ → clipboardWrite ; ex → executeEx
  → store notifies → shell.update → requestRender (coalesced) → EditorView.renderSelf → layoutText(visible rows) → paint
```

1. A thrown error inside a command or engine step is caught in `update`, which keeps the previous state and appends an error notification (parent `rm261003abzp-design.md:240`).

**Detailed Control Flow:** section 7 — `src/core/state/keys.ts`, `src/ui/input.ts`

## Open a file

**Participating Symbols:** `openPath`, `readTextFile`, `onFileLoaded`, `onFileRefused`, `FileTypeRegistry.forPath`

**Illustrative Flow:**

```text
:e p | explorer Enter | boot file → openPath(state, p): buffer exists → switch window content
                                     else → Effect read(p) → readTextFile
   → fileLoaded{path, file} → bufferForPath? (yes → disk.onDiskLoaded) : new buffer {fileType: forPath(p).id, view: "source", …}
   → fileRefused{reason} → message line text (binary | tooLarge | io); no buffer; active buffer unchanged
```

**Detailed Control Flow:** section 7 — `src/core/state/buffers.ts`, `src/workspace/fs.ts` `readTextFile`

## Save and autosave

**Participating Symbols:** `scheduleAutosave`, `onTimer`, `writeBuffer`, `saveText`, `atomicWrite`, `onSaved`, `onSaveFailed`, `retryDelay`

**Illustrative Flow:**

```text
edit (now) → save = scheduled(at = now + 1000) + startTimer(autosave:<id>, 1000)
leave Insert | switch buffer | :w → writeBuffer immediately (cancelTimer)
timer(autosave:<id>, now) → at ≤ now ∧ dirty ∧ disk present ∧ no conflict → writeBuffer
writeBuffer → save = writing(version) → Effect write{path, text: saveText(buf), expected: buf.stamp}
  serial queue → atomicWrite: stat(target) ≠ expected → FsError("conflict") ; tmp(0600) → write → fsync → chmod → rename
             → OwnOps.noteWrite(path, stamp) → saved{path, stamp, version}
  saved: version == buffer.version → dirty=false ; else (typed during write) → scheduleAutosave
  saveFailed{reason:"conflict"} → overlay conflict (autosave paused)
  saveFailed{other} → save = failed(attempt+1, retryAt) + startTimer(retry:<id>, retryDelay) ; status "save failed: <reason> · retry in Ns"
```

**Detailed Control Flow:** section 7 — `src/core/state/save.ts`, `src/workspace/fs.ts` `atomicWrite`

## Quit and close

**Participating Symbols:** `requestQuit`, `closeBuffer`, `pendingWrites`, `onSaved`, `onSaveFailed`

**Illustrative Flow:**

```text
:q (last window) | :wq → blocked = buffers in conflict ∨ (dirty ∧ disk deleted)
     blocked ≠ ∅ → message "E37: No write since last change (<path>)" ; no effects
     else → writes = pendingWrites(state) ; writes = ∅ → Effect exit(0)
            else → terminal.quit = {code:0, waiting: ids} + writes
saved(id) while quit → waiting −= id → ∅ → Effect exit(0)
saveFailed while quit → terminal.quit = undefined ; "save failed: <reason>" (so stays open)
:q! → Effect exit(0) (no writes) ; :q (other windows) → closeWindow only
:bd → same block/flush rules for one buffer, then close ; :bd! → close without writing
```

**Detailed Control Flow:** section 7 — `src/core/state/save.ts` `requestQuit`, `closeBuffer`

## Signal and crash shutdown

**Participating Symbols:** `installLifecycle`, `shutdown`, `pendingWrites`, `atomicWrite`, `Shell.destroy`

**Illustrative Flow:**

```text
SIGTERM | SIGHUP | SIGINT → shutdown(0) ; uncaughtException | unhandledRejection → shutdown(1)
shutdown(code): once-guard → writes = pendingWrites(store.get()) (non-conflict, disk present)
              → Promise.race([runner.flush(writes), sleep(2000)])
              → shell.destroy() (restore: main screen, cursor, modes)
              → unsaved paths → stderr "so: unsaved: <path>" → process.exit(code)
Effect exit(code) (from :q) → shell.destroy() → process.exit(code)
```

**Detailed Control Flow:** section 7 — `src/app/lifecycle.ts`

## External change

**Participating Symbols:** `watchWorkspace`, `OwnOps.isOwn`, `onFileChanged`, `onDiskLoaded`, `resolveConflict`

**Illustrative Flow:**

```text
fs.watch(root, {recursive}) event(path) → debounce 50 ms/path → excluded? drop
   → lstat(path): ENOENT → OwnOps.isOwnRemoval(path) ? drop : emit {kind:"removed", path}
                  exists → stamp → OwnOps.isOwnWrite(path, stamp) ∨ isOwnMove(path) ? drop : emit {kind:"changed", path, isDir}
update fileChanged:
   removed ∧ open buffer → disk = "deleted" ; message "deleted on disk — :w to recreate" ; cancel autosave
   removed ∧ dir expanded → listDir(parent)
   changed ∧ open buffer → Effect read(path) → fileLoaded → onDiskLoaded:
        same stamp → ignore ; clean → reload as one undo block + "Reloaded from disk — u to undo" ; disk = "present"
        dirty → overlay conflict{bufferId} (autosave paused) → k: write (expected = disk stamp) │ t: reload │ d: diff view
   changed ∧ isDir ∧ expanded → listDir(path)
```

**Detailed Control Flow:** section 7 — `src/workspace/watcher.ts`, `src/core/state/disk.ts`

## Explorer listing and operation

**Participating Symbols:** `listDir`, `ExclusionMatcher.isExcluded`, `explorerOp`, `onFsResult`, `createEntry`, `moveEntry`, `removeEntry`, `Trash.move`

**Illustrative Flow:**

```text
expand dir → Effect listDir(dir) → listDir: readdir withFileTypes → isExcluded(rel, isDir) → sort dirs first → dirListed
a <name> → explorerOp(create) → Effect create{op} → createEntry: mkdir -p parent ; open(wx) | mkdir (trailing /) → fsResult
r | m <to> → explorerOp(rename|move) → [write(flush) for dirty buffers under from] + Effect rename|move{op}
           → moveEntry: lstat(to) exists → FsError E13 ; rename ; OwnOps.noteMove(from,to) → fsResult
           → ok → buffers under from re-pathed (text, dirty, undo kept) ; listDir(parents)
d → prompt "Move to Trash? [y/N]" (trashAvailable) | typed name (else)
  → [write(flush) for dirty buffers under path] + Effect trash{op} | Effect remove{op}
  → fsResult ok → close clean buffers under path ; buffers still dirty (flush failed) → disk = "deleted"
  → fsResult fail (trash) → trashAvailable=false ; error toast "Move to Trash failed: <reason>"
```

`remove` is the typed-confirm permanent deletion. It is carried by the existing `trash` effect kind with `op.permanent = true`, so no new Effect kind is added.

**Detailed Control Flow:** section 7 — `src/core/state/explorer.ts`, `src/workspace/fs.ts`, `src/workspace/trash.ts`

## Clipboard

**Participating Symbols:** `detectClipboard`, `ClipboardProvider`, `applyVimEffects`, `osc52Provider`

**Illustrative Flow:**

```text
"+y → VimEffect yank{register:"+", text} → registers["+"] = text + Effect clipboardWrite{text}
     → provider.copy(text) (pbcopy | wl-copy | xsel | xclip | tmux | OSC 52 via shell.copyOsc52) ; fail → clipboardText{text:"", error}
"+p → vim.pendingPaste = {register:"+", …} + Effect clipboardRead → provider.paste()
     → clipboardText{text} → paste text ; no reader | fail → clipboardText{text: "", error?} → paste registers["+"] (+ message if error)
```

**Detailed Control Flow:** section 7 — `src/workspace/system.ts`, `src/app/effects.ts`

## Vim expectation recording

**Participating Symbols:** `scripts/record-vim.ts` `main`, `assertNvim011`, `recordCase`

**Illustrative Flow:**

```text
bun run record:vim → assertNvim011(NVIM ?? "nvim") ─ not "NVIM v0.11." → exit 1 "requires Neovim 0.11.x"
  → per case: spawn nvim --clean --headless --listen <sock>
      setup: nvim_buf_set_lines + cursor + clear undo (undolevels=-1 then reset) + clear registers
      keys: nvim_input(keys) via --remote-expr ; wait for nvim_get_mode().blocking == false
      read: json_encode({lines, curpos, mode: mode(1), regs})
  → write test/vim/expected.json {nvim: "0.11.7", recordedAt, cases:[…]}
```

**Detailed Control Flow:** section 7 — `scripts/record-vim.ts`

## CI and PTY verification

**Participating Symbols:** `ci.yml` jobs `check`, `test`; `runInPty`; `TerminalProbe`; `scripts/bench-gate.ts` `main`

**Illustrative Flow:**

```text
pull_request (opened | synchronize | reopened) → concurrency ci-${{ github.event.pull_request.number }} (cancel in progress)
  check  [ubuntu-24.04]: setup-bun (packageManager) → bun install --frozen-lockfile → bun run check
  test   [ubuntu-24.04, macos-15]: install → bun run test:ci (test/ui, test/integration, test/e2e)
         Linux only: bun run bench (scripts/bench-gate.ts: 5 runs, median ≤ 2 × target)
runInPty(argv, env) → Bun.spawn({terminal:{cols:100, rows:30, data}}) → reply "\x1b[?0u" to "\x1b[?u"
   → xterm.write(bytes) + TerminalProbe(raw) → exit → assertions
```

**Detailed Control Flow:** section 7 — `.github/workflows/ci.yml`, `test/e2e/pty.ts`

## Release

**Participating Symbols:** `release-please.yml` job `rp`; `release.yml` jobs `build`, `smoke`, `publish`; `VERSION`

**Illustrative Flow:**

```text
push main → release-please (v5) → release PR | on merge: release_created → workflow_call release.yml(tag)
push tag v* (manual, e.g. v0.1.0-rc.1) → release.yml(tag = github.ref_name)
build [ubuntu-24.04]: bun install --frozen-lockfile --os="*" --cpu="*" → 4 × bun build --compile
      --define SO_VERSION=<tag without v> [--define process.env.OPENTUI_LIBC="glibc"] → SHA256SUMS → upload artifacts
smoke [macos-15, macos-15-intel, ubuntu-24.04, ubuntu-24.04-arm] → so-<target> --version == "so <version>"
publish (needs all smoke) → gh release create <tag> [--prerelease when tag has "-"] assets + SHA256SUMS
```

**Detailed Control Flow:** section 7 — `.github/workflows/release.yml`, `src/app/main.ts` `VERSION`

## Failure and Recovery Rules

- **Write fails (permission, disk full)** — Detected by `atomicWrite` throwing `FsError`; represented as `saveFailed{path, reason}`; handled by `onSaveFailed` with retry timers 1, 2, 4, 8, 16, 30, 30… s; `:w` retries now; temp file removed in `finally`.
- **Disk changed under an autosave** — Detected by `atomicWrite` comparing `stat` to `expected` before writing; represented as `saveFailed{reason:"conflict"}`; handled by opening the conflict overlay; no write happens.
- **Crash mid-write** — Same-directory temp + fsync + rename leaves old or new file; V3.1 simulates a throw after fsync.
- **Quit while a write fails** — `onSaveFailed` clears `terminal.quit`; `so` stays open with the reason.
- **Signal flush hangs** — 2 s `Promise.race` bound in `shutdown`; terminal already restored; unsaved paths printed to stderr.
- **Watcher event storms (Linux child re-reports, macOS replays)** — 50 ms per-path debounce plus `OwnOps` suppression (writes by stamp; moves and removals by path prefix for 1 s after completion).
- **Trash failure at runtime** — `fsResult{ok:false}` for a `trash` op sets `trashAvailable=false` and shows the reason; the item is unchanged.
- **Clipboard provider failure** — `clipboardText{error}` → message `clipboard unavailable`; paste falls back to `registers["+"]`.
- **Highlighter throws** — `highlightMarks` catches per range and returns no marks for it (parent invariant `rm261003abzp-design.md:687`).
- **Render error** — caught in `EditorView.renderSelf`; the window paints raw lines; an error notification is dispatched once per buffer version.

## Construction and Wiring Flow

```text
src/app/main.ts main()
  → fileTypes = new FileTypeRegistry(textFileType); codeFileTypes.forEach(register); register(markdownFileType)
  → editorKinds = new EditorKindRegistry()            (built-in "text" handled by core/state)
  → commands = new CommandRegistry<CommandContext, CommandResult>(); registerBuiltins(commands)
  → keymap = new Keymap(); defaultBindings.forEach(b => keymap.bind(b.scope, b.seq, b.id))
  → renderer = await createRenderer(); shell = createShell(renderer, deps)
  → ownOps = createOwnOps(); runner = createEffectRunner({ownOps, shell, trash, clipboard, dispatch})
  → store = createStore(initialState(boot), createUpdate({fileTypes, editorKinds, commands, keymap}), runner.run)
  → shell.attach(store) ; lifecycle = installLifecycle({store, shell, runner})
  → runner deps.exit is late-bound: (code) => lifecycle.exitNow(code)   (runner is built before lifecycle)
  → store.dispatch boot actions ; after first frame: watchWorkspace(root, ownOps, e => dispatch({type:"fileChanged", event: e}))
```

- **Construction:** `src/app/main.ts` — `main` — creates every registry, adapter, store, shell, and lifecycle; registries are frozen after construction.
- **Registration:** `src/core/state/commands.ts` — `registerBuiltins` — ex and built-in commands; `src/core/kernel/commands/defaults.ts` — `defaultBindings` — global vim/ex/explorer bindings and `<leader>e`; `src/ui/editors/registry.ts` — `registerEditorView("text", EditorView)`.
- **Exports:** G1 public surface — `src/core/state/{types,store,update}.ts` (`AppState`, `Action`, `Effect`, `createStore`, `createUpdate`), `src/core/kernel/commands/{registry,keymap}.ts`, `src/core/kernel/view/{types,text-view}.ts`, `src/core/filetypes/registry.ts`, `src/core/lang/code/highlight.ts` (`lowlightHighlighter`), `src/ui/shell.ts` (`createShell`), `src/ui/editors/registry.ts` (`editorViews`), `src/ui/overlays/{host,prompt}.ts` (`OverlayHost`, `PromptView`), `src/workspace/{fs,watcher}.ts`, `src/app/effects.ts` (`createEffectRunner`).
- **Configuration:** `src/core/config/schema.ts` — `defaults` (`escTimeoutMs: 50`, `autosave: {enabled: true, delayMs: 1000}`, `theme: "dark"`, `color: "auto"`) — read at construction; `NO_COLOR` from `process.env` in `main`.

# 6. Logical Contracts, Data Models, and State

| Item | Kind | Purpose | Used By |
|---|---|---|---|
| `Action` / `Effect` | Contract (discriminated unions) | only way state changes and side effects start | ui, runner, watcher → `update` → runner |
| `AppState` (DI1) | State Model | single source of truth for DI1 | `update` (owner) → ui (reader), lifecycle (reader) |
| `BufferState` / `SaveState` | State Model | buffer text, disk identity, save machine | save.ts, disk.ts, explorer.ts, status.ts |
| `TerminalState` | State Model | size, colour mode, quit continuation | shell, save.ts |
| `ExplorerState` | State Model | listed tree, expansion, cursor | explorer.ts, ExplorerView |
| `FileEvent` | Message | watcher result | watcher → `update` |
| `Stamp`, `TextFile`, `DirEntry`, `FsOp` | Data Model | file identity and adapter payloads | fs.ts ↔ core |
| `CommandContext` | Contract | what a built-in command may read and return | registry → `commands.ts` |
| `VimState`, `BufferVim`, `VimEffect` | State Model / Contract | engine state and engine output | engine ↔ keys.ts |
| `FileType`, `Highlighter`, `Decoration`, `RenderLine`, `TextView` | Contract (parent) | language-neutral extension point | registries, layoutText, EditorView |
| `ClipboardProvider`, `Trash`, `ExclusionMatcher`, `OwnOps` | Contract (adapter) | platform integrations | runner, watcher, listDir |
| `test/vim/expected.json` | Schema | recorded Neovim results | recorder → vim.test.ts |

## `Action` / `Effect` — Contract

**Purpose:** The parent protocol, at the DI1 variant set plus three additive members.

**Includes:**

- Parent DI1 variants (`…phase-1…md:205-217`), unchanged.
- `Effect` `{kind:"listDir"; dir}` and `Action` `{type:"dirListed"; dir; entries: DirEntry[] | null; reason?}` — explorer folder listing.
- `clipboardText.error?: string` — clipboard failure.
- `FsOp` gains `permanent?: true` for typed-confirm deletion carried by the `trash` effect kind.

**Usage:**

```text
ui (key, resize, mouse) · watcher (fileChanged) · runner (results) → Action → update → Effect[] → runner
```

**Rules:**

- **Compatibility:** additive only; DI2 extends the same unions (`indexBatch`, `search`, …).
- **Invariants:** every fallible effect answers with exactly one result action; `key` and `timer` carry `now`; no callbacks in effects.
- **Ownership and Lifecycle:** defined in `core/state`; produced by adapters and `update`; consumed by `update` and `runEffect`.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 — `src/core/state/types.ts` `Action`, `Effect`

## `AppState` (DI1) — State Model

**Purpose:** Exactly the DI1 fields from the phase file (`…phase-1…md:189`), with concrete sub-shapes.

**Includes:**

- `workspace` — `{root}`.
- `buffers` — `Record<BufferId, BufferState>` and `nextBufferId`.
- `windows` — `WindowTree` + `Record<WindowId, WindowState>` + `active`.
- `vim` — mode, pending keys, registers, last change, search, cmdline, `pendingPaste?`.
- `panels.explorer` — `ExplorerState`.
- `overlay` — `none | prompt | conflict`.
- `notifications` — toasts and the message line.
- `config` — `AppConfig` defaults.
- `terminal` — `TerminalState`.

**Usage:**

```text
update (only writer) → AppState → shell views, statusSegments, lifecycle.pendingWrites
```

**Rules:**

- **Compatibility:** no field for DI2+ (`index`, `jumps`, `recent`, `panels.side`, other overlays, `analysis`, `folds`).
- **Invariants:** parent invariants (`rm261003abzp-design.md:357`); a buffer with `overlay.conflict` for its id never autosaves; `terminal.quit` is set only while its `waiting` ids have writes in flight.
- **Ownership and Lifecycle:** created by `initialState`; replaced per action; never persisted in DI1.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 — `src/core/state/types.ts` `AppState`

## `BufferState` / `SaveState` — State Model

**Purpose:** One open file: text, file identity on disk, and where its save stands.

**Includes:**

- `path`, `fileType`, `view` (`"source"`), `text: TextBuffer`, `undo: UndoHistory`.
- `bom`, `eol`, `finalNewline`, `stamp` — restore bytes on save.
- `dirty` — text differs from the last saved or loaded version.
- `disk: "present" | "deleted"` — REQ6.
- `save: idle | scheduled{at} | writing{version} | failed{reason, attempt, retryAt}`.

**Usage:**

```text
buffers.onFileLoaded → BufferState → save.* (writes) → disk.* (reloads) → explorer.onFsResult (re-path)
```

**Rules:**

- **Compatibility:** DI2 adds `analysis` (phase file line 190); nothing else depends on the save sub-shape.
- **Invariants:** `save.kind === "writing"` at most once per buffer at a time (the next write is scheduled after `saved`); `disk === "deleted"` ⇒ no autosave; `dirty === false` ⇒ `text.version` equals the version saved or loaded.
- **Ownership and Lifecycle:** created on `fileLoaded`; removed by `closeBuffer` or a successful delete of a clean buffer.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 — `src/core/state/types.ts` `BufferState`, `SaveState`; `src/core/state/save.ts`

## `TerminalState` — State Model

**Purpose:** Terminal facts the core needs (size, colour) and the quit continuation (REQ5).

**Includes:**

- `cols`, `rows` — from `resize`.
- `color: "color" | "nocolor"` — resolved from `NO_COLOR` and `config.color` at boot.
- `quit?: {code: 0; waiting: BufferId[]}`.

**Usage:**

```text
save.requestQuit → terminal.quit → save.onSaved / onSaveFailed → Effect exit
```

**Rules:**

- **Compatibility:** internal to DI1; `terminal` is a DI1 top-level field.
- **Invariants:** `quit` cleared on any `saveFailed` of a waiting buffer.
- **Ownership and Lifecycle:** set by `initialState`, `resize`, `requestQuit`.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 — `src/core/state/types.ts` `TerminalState`

## `ExplorerState` — State Model

**Purpose:** The visible tree, built from `dirListed` results.

**Includes:**

- `open`, `focused` — toggled by `<leader>e`; placement (dock or float) comes from the layout class in the UI.
- `entries: Record<dir, DirEntry[]>` — listed folders.
- `expanded: string[]` — folders shown open.
- `cursor` — selected path.
- `trash: "unknown" | "available" | "unavailable"`.

**Usage:**

```text
explorer.onDirListed → ExplorerState → ExplorerView ; explorer.explorerOp → Effects
```

**Rules:**

- **Compatibility:** DI2 adds link impact text only to the move prompt.
- **Invariants:** entries are already excluded by `ExclusionMatcher`; paths are workspace-relative POSIX.
- **Ownership and Lifecycle:** root listed at boot; refreshed by `fileChanged` for expanded folders and by successful operations.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 — `src/core/state/explorer.ts`

## `FileEvent` — Message

**Purpose:** A filtered, debounced change from the watcher.

**Includes:**

- `{kind:"changed"; path; isDir}` | `{kind:"removed"; path}`.

**Usage:**

```text
watchWorkspace → FileEvent → Action fileChanged → disk.onFileChanged
```

**Rules:**

- **Compatibility:** DI2's worker maps the same events to `changed`/`removed` messages.
- **Invariants:** never emitted for own writes (stamp match) or own moves and removals (1 s window); never carries file content — the core reads it back through `read`.
- **Ownership and Lifecycle:** produced only by `watchWorkspace`.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 — `src/workspace/watcher.ts`

## `Stamp`, `TextFile`, `DirEntry`, `FsOp` — Data Model

**Purpose:** Adapter payloads.

**Includes:**

- `Stamp {mtimeMs, size, hash}` — `hash` is `Bun.hash` of the bytes as a hex string.
- `TextFile {text, bom, eol, stamp}`.
- `DirEntry {name, kind: "file" | "dir"}` — symlinks report their target kind (lazy listing).
- `FsOp {kind: "create" | "rename" | "move" | "trash", from, to?, dir?: boolean, permanent?: true}`.

**Usage:**

```text
fs.ts ↔ runner ↔ Action payloads
```

**Rules:**

- **Compatibility:** `Stamp` equality is exact on all three fields.
- **Invariants:** `TextFile.text` has no BOM; `eol` is `"\r\n"` when any CRLF exists, else `"\n"`.
- **Ownership and Lifecycle:** created by adapters; stored in `BufferState.stamp`.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 — `src/core/state/types.ts`; `src/workspace/fs.ts`

## `CommandContext` — Contract

**Purpose:** What `core/state` passes to built-in commands, instantiating the parent's generic `Command<Ctx, R>`.

**Includes:**

- `state`, `now`, `args?`, `registries` (read-only); result `{state, effects}`.

**Usage:**

```text
handleKeyAction → CommandRegistry.get(id).run(ctx) → {state, effects}
```

**Rules:**

- **Compatibility:** DI2 adds `layoutClass` and index access to the same context type.
- **Invariants:** commands are pure.
- **Ownership and Lifecycle:** constructed per command run.

**Location:** `src/core/state/commands.ts` — None — proposed item

**Detailed Shape:** section 7 — `src/core/state/commands.ts`

## `VimState`, `BufferVim`, `VimEffect` — State Model / Contract

**Purpose:** The engine's state and its only outputs (parent `rm261003abzp-design.md:549-551`).

**Includes:**

- `VimState {mode, pending: Key[], count?, register?, lastChange?, search?, cmdline, visualAnchor?}`.
- `BufferVim {text, cursor, undo, registers}`.
- `VimEffect` — `changed` | `yank{register, text, linewise}` | `modeChanged{mode}` | `ex{line}` | `search{pattern, dir}` | `paste{register, before}`.

**Usage:**

```text
keys.handleKeyAction → handleKey → VimEffect[] → applyVimEffects
```

**Rules:**

- **Compatibility:** `paste` is added to the parent's illustrative effect list so `"+p` can wait for the clipboard; it is kernel-internal.
- **Invariants:** an operator with a failed motion is a no-op; counts multiply; one Normal command or one Insert session is one undo block.
- **Ownership and Lifecycle:** `VimState` in `AppState.vim`; `BufferVim` assembled per key from the active buffer and window.

**Location:** `src/core/kernel/vim/types.ts` — None — proposed item

**Detailed Shape:** section 7 — `src/core/kernel/vim/engine.ts`

## `FileType`, `Highlighter`, `Decoration`, `RenderLine`, `TextView` — Contract

**Purpose:** The parent extension contracts, unchanged.

**Includes:**

- Shapes at `rm261003abzp-design.md:607-620` (view) and `:653-676` (file types).

**Usage:**

```text
lang/* → FileTypeRegistry ; core/state → forPath ; EditorView → layoutText
```

**Rules:**

- **Compatibility:** frozen for DI2 and DI3 (phase file line 137, 420).
- **Invariants:** parent invariants (`rm261003abzp-design.md:397`, `:635`).
- **Ownership and Lifecycle:** registered at startup; immutable.

**Location:** `src/core/kernel/view/types.ts`, `src/core/filetypes/registry.ts` — `rm261003abzp-design.md:607-681` (parent definition; no code exists yet)

**Detailed Shape:** None — unchanged item; consumers in section 7: `src/core/lang/code/highlight.ts`, `src/core/kernel/view/text-view.ts`, `src/ui/editors/text-view.ts`

## `ClipboardProvider`, `Trash`, `ExclusionMatcher`, `OwnOps` — Contract

**Purpose:** Small adapter interfaces chosen once at startup.

**Includes:**

- `ClipboardProvider {name, copy(text): Promise<void>, paste?(): Promise<string>}`.
- `Trash {available: boolean, move(absPath): Promise<void>}`.
- `ExclusionMatcher {isExcluded(rel, isDir): boolean}`.
- `OwnOps {noteWrite(path, stamp), noteMove(from, to), noteRemove(path), isOwn(path, stamp?): boolean}`.

**Usage:**

```text
main → detect* → runner ; runner + watcher share one OwnOps
```

**Rules:**

- **Compatibility:** DI2's worker reuses `ExclusionMatcher`.
- **Invariants:** providers never throw synchronously; failures become result actions.
- **Ownership and Lifecycle:** created in `main`; process lifetime.

**Location:** `src/workspace/{system,trash,ignore,watcher}.ts` — None — proposed items

**Detailed Shape:** section 7 — those files

## `test/vim/expected.json` — Schema

**Purpose:** Committed Neovim results for V2.

**Includes:**

- `nvim` (e.g. `"0.11.7"`), `recordedAt`, `cases[{id, before:{lines, cursor}, keys, after:{lines, cursor, mode, regs}}]`.

**Usage:**

```text
scripts/record-vim.ts → expected.json → test/vim/vim.test.ts
```

**Rules:**

- **Compatibility:** regenerated only by the recorder.
- **Invariants:** `nvim` starts with `0.11.`; every `cases.ts` id has one entry.
- **Ownership and Lifecycle:** committed; reviewed in PR diffs.

**Location:** `test/vim/expected.json` — None — proposed item

**Detailed Shape:** section 7 — `scripts/record-vim.ts`

# 7. Detailed Code Design

## `package.json`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `bin/so`

- **Change:** Add
- **Decisions:** DES1, DES14
- **Requirements:** `W261003HEGE-REQ2@R2`, `W261003HEGE-REQ4@R3`
- **Responsibilities:** toolchain, scripts, exact pins.
- **Affected Callers/Consumers:** `ci.yml`, `release.yml`, developers.
- **Construction/Wiring:** `setup-bun` reads `packageManager`.
- **Dependencies:** Bun 1.4.2, `@opentui/core` 0.5.14, `lowlight` 3.3.0, `zod` 4.6.5, `ignore` 7.0.12; dev: `typescript` 7.0.2, `@types/bun` 1.4.2, `@biomejs/biome` 2.5.15, `knip` 6.39.0, `@xterm/headless` 6.0.0.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `scripts.check` | None — new symbol | biome + tsc + knip + unit tests | developers, `ci.yml` `check` |
| `scripts.test:ci` | None — new symbol | component, integration, e2e | `ci.yml` `test` |
| `scripts.bench` | None — new symbol | `bun scripts/bench-gate.ts` | `ci.yml` `test` (Linux) |
| `scripts.record:vim` | None — new symbol | `bun scripts/record-vim.ts` | developers only |

**Existing Shape:** None — new file or symbol

```json
None
```

None — the repository has no toolchain files.

**Proposed Shape:**

```jsonc
// package.json
{ "name": "so", "version": "0.0.0", "type": "module", "private": true, "packageManager": "bun@1.4.2",
  "bin": { "so": "bin/so" },
  "scripts": {
    "dev": "bun src/app/main.ts",
    "check": "biome check . && bun --bun run tsc --noEmit -p . && bun --bun run knip && bun test src test/boundaries.test.ts test/repo.test.ts test/vim",
    "test:ci": "bun test test/ui test/integration test/e2e",
    "bench": "bun scripts/bench-gate.ts",
    "build": "bun build --compile src/app/main.ts --outfile dist/so",
    "record:vim": "bun scripts/record-vim.ts" },
  "dependencies": { "@opentui/core": "0.5.14", "lowlight": "3.3.0", "zod": "4.6.5", "ignore": "7.0.12" },
  "devDependencies": { "typescript": "7.0.2", "@types/bun": "1.4.2", "@biomejs/biome": "2.5.15",
                       "knip": "6.39.0", "@xterm/headless": "6.0.0" } }
```

```toml
# bunfig.toml
[install]
exact = true
```

```jsonc
// tsconfig.json
{ "compilerOptions": { "strict": true, "noEmit": true, "target": "ESNext", "module": "Preserve",
    "moduleResolution": "bundler", "verbatimModuleSyntax": true, "types": ["bun"], "skipLibCheck": true,
    "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true },
  "include": ["src", "test", "scripts"] }
```

- **`check`** runs `bun test` with explicit paths, so component, integration, and e2e suites stay out of the < 30 s local budget (REQ4@R3).
- **`tsc`** runs through `bun --bun`, so no Node is needed (RF1).
- **`skipLibCheck`** is required because TS 7 reports TS2416 inside OpenTUI's `KeyHandler.d.ts` (RF1). Project sources are still fully checked.
- **`bunfig.toml`** makes every later `bun add` exact, so pins cannot drift.

- **Invariants:**
  - No version string in `package.json` starts with `^` or `~`.
  - `bun run dev` needs no build step (parent REQ10@R2).
- **Verification Coverage:** S1 — V1.1, V1.3

## `src/core/state/types.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ5@R1`, `W261003HEGE-REQ6@R1`, `W261003HEGE-REQ7@R2`
- **Responsibilities:** DI1 `AppState`, `Action`, `Effect`, and payload types.
- **Affected Callers/Consumers:** every `core/state` module, `src/app/effects.ts`, `src/ui/**`, DI2 (extends).
- **Construction/Wiring:** None — types only.
- **Dependencies:** kernel types (`TextBuffer`, `UndoHistory`, `VimState`, `WindowTree`, `Key`), `AppConfig`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Action` | `…phase-1…md:206-212` (parent shape, not code) | parent variants + `dirListed`; `clipboardText.error?`; `fileRefused.reason` + `"io"` | `update`, runner, ui, watcher |
| `Effect` | `…phase-1…md:213-217` (parent shape) | parent variants + `listDir`; `FsOp.permanent?` | `update`, runner |
| `AppState` | `rm261003abzp-design.md:355` meaning; DI1 field list `…phase-1…md:189` | concrete DI1 shape below | all core/state, ui |

**Existing Shape:** `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:205-217`

```ts
export type Action =
  | { type: "key"; key: Key; now: number } | { type: "resize"; cols: number; rows: number }
  | { type: "fileLoaded"; path: string; file: TextFile } | { type: "fileRefused"; path: string; reason: "binary" | "tooLarge" }
  …
  | { type: "clipboardText"; text: string } | { type: "mouse"; event: MouseEvent };
export type Effect = | { kind: "read"; path: string } | … | { kind: "exit"; code: number };
```

The parent defines the DI1 variants as a design shape. Every fallible effect answers with a result action, and `key`/`timer` carry `now`.

**Proposed Shape:**

```ts
export type BufferId = number; export type WindowId = number;
export type Stamp = { mtimeMs: number; size: number; hash: string };
export type TextFile = { text: string; bom: boolean; eol: "\n" | "\r\n"; stamp: Stamp };
export type DirEntry = { name: string; kind: "file" | "dir" };
export type FsOp = { kind: "create" | "rename" | "move" | "trash"; from: string; to?: string; dir?: boolean; permanent?: true };
export type FileEvent = { kind: "changed"; path: string; isDir: boolean } | { kind: "removed"; path: string };
export type TimerId = `autosave:${BufferId}` | `retry:${BufferId}` | `toast:${number}`;

export type SaveState =
  | { kind: "idle" } | { kind: "scheduled"; at: number } | { kind: "writing"; version: number }
  | { kind: "failed"; reason: string; attempt: number; retryAt: number };
export type BufferState = {
  id: BufferId; path: string; fileType: string; view: string; text: TextBuffer; undo: UndoHistory;
  bom: boolean; eol: "\n" | "\r\n"; finalNewline: boolean; stamp: Stamp; savedVersion: number;
  dirty: boolean; disk: "present" | "deleted"; save: SaveState };
export type WindowState = { id: WindowId; content: { editor: "text"; bufferId: BufferId; cursor: Pos; scroll: number } };
export type TerminalState = { cols: number; rows: number; color: "color" | "nocolor"; quit?: { code: 0; waiting: BufferId[] } };
export type ExplorerState = { open: boolean; focused: boolean; entries: Record<string, DirEntry[]>; expanded: string[];
                              cursor: string; trash: "unknown" | "available" | "unavailable" };
export type Overlay = { kind: "none" }
  | { kind: "prompt"; prompt: PromptState }                    // create/rename/move/delete/typed-confirm
  | { kind: "conflict"; bufferId: BufferId; disk: TextFile; showDiff: boolean };
export type AppState = {
  workspace: { root: string }; buffers: Record<BufferId, BufferState>; nextBufferId: BufferId;
  windows: { tree: WindowTree; byId: Record<WindowId, WindowState>; active: WindowId; nextWindowId: WindowId };
  vim: VimState & { pendingPaste?: { bufferId: BufferId; before: boolean } };
  panels: { explorer: ExplorerState }; overlay: Overlay;
  notifications: { toasts: Toast[]; message?: { text: string; level: "info" | "error" } };
  config: AppConfig; terminal: TerminalState };

export type Action = /* parent DI1 variants */
  | { type: "dirListed"; dir: string; entries: DirEntry[] | null; reason?: string }
  | { type: "clipboardText"; text: string; error?: string }      // replaces the parent member, adds `error?`
  | { type: "fileRefused"; path: string; reason: "binary" | "tooLarge" | "io" };   // replaces the parent member, adds "io"
export type Effect = /* parent DI1 variants, `write` and `saved` unchanged */
  | { kind: "listDir"; dir: string };
```

- **Additions:** `dirListed`/`listDir` let the explorer expand folders. `clipboardText.error` carries clipboard failures. `FsOp.permanent` turns the existing `trash` kind into the typed-confirm delete, without adding an Effect kind.
- **`"io"` refusal:** the parent flow already refuses unreadable files with `io` (`rm261003abzp-design.md:280`); the phase union omitted it.
- **Allowed set:** these four are exactly the additions `W261003HEGE-REQ1@R3` allows. All are additive for DI2 and appear in the Parent Synchronization receipt (item 3). `write` and `saved` keep their parent shapes: the written version lives in `BufferState.save` (`writing{version}`).
- **`BufferState.savedVersion`:** makes `dirty` derivable and testable.
- **`disk`:** carries REQ6.
- **`terminal.quit`:** carries REQ5.
- **`conflict.disk`:** holds the disk text needed for take and diff.

- **Invariants:**
  - No top-level field outside the phase file's DI1 list.
- **Verification Coverage:** S7 — V7.3 (type check and reducer purity); S4, S5 cases use these shapes

## `src/core/state/store.ts` and `src/core/state/update.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** `W261003HEGE-REQ1@R3`
- **Responsibilities:** the only mutable cell; reducer construction with frozen registries; error containment.
- **Affected Callers/Consumers:** `src/app/main.ts`; tests construct stores with stub runners.
- **Construction/Wiring:** `main` → `createStore(initialState(boot), createUpdate(registries), runner.run)`.
- **Dependencies:** `types.ts`, all reducer modules.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `createStore` | `rm261003abzp-design.md:460-467` `createStore(initial, run)` | `createStore(initial, update, run)` | `main`, tests |
| `update` | `rm261003abzp-design.md:451-458` module-level `update` | `createUpdate(registries): Update` | `main`, tests |

**Existing Shape:** `rm261003abzp-design.md:449-467`

```ts
export type Update = (state: AppState, action: Action) => { state: AppState; effects: Effect[] };
export const update: Update = (state, action) => { switch (action.type) { … } };
export function createStore(initial: AppState, run: (e: Effect) => void) { … }
```

The parent's `update` reaches registries implicitly, and the store calls it directly.

**Proposed Shape:**

```ts
export type Registries = { fileTypes: FileTypeRegistry; editorKinds: EditorKindRegistry;
                           commands: CommandRegistry<CommandContext, CommandResult>; keymap: Keymap };
export function createUpdate(reg: Registries): Update {
  return (state, action) => {
    try {
      switch (action.type) {
        case "key": return handleKeyAction(state, action, reg);
        case "timer": return onTimer(state, action);
        case "fileLoaded": return onFileLoaded(state, action, reg);
        case "fileRefused": return onFileRefused(state, action);
        case "saved": return onSaved(state, action);
        case "saveFailed": return onSaveFailed(state, action);
        case "fileChanged": return onFileChanged(state, action.event);
        case "dirListed": return onDirListed(state, action);
        case "fsResult": return onFsResult(state, action);
        case "trashAvailable": return withTrash(state, action.available);
        case "clipboardText": return onClipboardText(state, action);
        case "resize": return onResize(state, action);
        case "mouse": return onMouse(state, action, reg);
      }
    } catch (e) { return { state: notifyError(state, e), effects: [] }; }   // previous state kept
  };
}
export function createStore(initial: AppState, update: Update, run: (e: Effect) => void): Store {
  let state = initial; const subs = new Set<(s: AppState) => void>();
  return { get: () => state,
    dispatch(a) { const r = update(state, a); state = r.state; for (const e of r.effects) run(e); for (const f of subs) f(state); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); } };
}
```

`createUpdate` closes over the frozen registries, so `update` stays a pure function of `(state, action)` for a given registry set. That makes DI1 tests construct their own registries instead of mutating globals. The switch is exhaustive over the closed `Action` union (TS `never` check), and the `try` keeps the previous state on any thrown error.

- **Invariants:**
  - Effects run in the order returned (the runner's serial queue preserves FS order).
  - Subscribers see each committed state once.
- **Verification Coverage:** S7 — V7.3; S3 — V3.4

## `src/core/state/save.ts`

- **Change:** Add
- **Decisions:** DES4
- **Requirements:** `W261003HEGE-REQ1@R3` (S1, autosave policy), `W261003HEGE-REQ5@R1`, `W261003HEGE-REQ6@R1`
- **Responsibilities:** autosave scheduling, write emission, retry, quit continuation, close rules, flush list for shutdown.
- **Affected Callers/Consumers:** `update` (`timer`, `saved`, `saveFailed`), `keys.ts` (edits, leave Insert), `commands.ts` (`:w`, `:q`, `:wq`, `:q!`, `:bd`, `:bd!`, buffer switch), `explorer.ts` (flush before op), `lifecycle.ts` (`pendingWrites`).
- **Construction/Wiring:** None — pure module.
- **Dependencies:** `types.ts`, `buffers.saveText`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `scheduleAutosave` | None — new symbol | `(s, id, now) → {state, effects}` | `keys.ts` |
| `writeBuffer` | None — new symbol | `(s, id) → {state, effects}` (no-op when not writable) | commands, timers, explorer |
| `onSaved` / `onSaveFailed` | None — new symbol | update buffer, retry, advance quit | `update` |
| `requestQuit` / `closeBuffer` | None — new symbol | REQ5 rules | `commands.ts` |
| `pendingWrites` | None — new symbol | `(s) → WriteEffect[]` | `requestQuit`, `explorer.ts`, `lifecycle.ts` |
| `retryDelay` | None — new symbol | `attempt → min(1000·2^(attempt−1), 30000)` | `onSaveFailed` |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
const writable = (b: BufferState, s: AppState) =>
  b.dirty && b.disk === "present" && !(s.overlay.kind === "conflict" && s.overlay.bufferId === b.id);

export function scheduleAutosave(s: AppState, id: BufferId, now: number): Result {
  if (!s.config.autosave.enabled) return none(s);
  const at = now + s.config.autosave.delayMs;
  return { state: setSave(s, id, { kind: "scheduled", at }), effects: [{ kind: "startTimer", id: `autosave:${id}`, ms: s.config.autosave.delayMs }] };
}
export function writeBuffer(s: AppState, id: BufferId): Result {
  const b = s.buffers[id]; if (!b || !writable(b, s) || b.save.kind === "writing") return none(s);
  return { state: setSave(s, id, { kind: "writing", version: b.text.version }),
           effects: [{ kind: "cancelTimer", id: `autosave:${id}` },
                     { kind: "write", path: b.path, text: saveText(b), expected: b.stamp }] };
}
export function onSaved(s: AppState, a: Extract<Action, { type: "saved" }>): Result {
  // v = buffer.save.version (writing) ; stamp ← a.stamp; savedVersion ← v; dirty ← text.version !== v; save ← idle
  // if still dirty → writeBuffer again (typed during write) ; if terminal.quit waits on id → remove; empty → exit(0)
}
export function onSaveFailed(s: AppState, a: Extract<Action, { type: "saveFailed" }>): Result {
  // reason "conflict" → open conflict overlay (read-back via Effect read) ; else save ← failed(attempt+1, now+retryDelay)
  // + startTimer(retry:id) ; message "save failed: <reason>" ; terminal.quit → cleared
}
export function requestQuit(s: AppState, opts: { force: boolean }): Result {
  if (opts.force) return { state: s, effects: [{ kind: "exit", code: 0 }] };
  const blocked = Object.values(s.buffers).find((b) => isConflicted(s, b) || (b.dirty && b.disk === "deleted"));
  if (blocked) return message(s, `E37: No write since last change (${blocked.path})`, "error");
  const ids = Object.values(s.buffers).filter((b) => writable(b, s) || b.save.kind === "writing").map((b) => b.id);
  if (ids.length === 0) return { state: s, effects: [{ kind: "exit", code: 0 }] };
  return ids.reduce((r, id) => chain(r, (st) => writeBuffer(st, id)), { state: withQuit(s, ids), effects: [] });
}
export function pendingWrites(s: AppState): Extract<Effect, { kind: "write" }>[];   // every writable buffer's write effect
export const retryDelay = (attempt: number) => Math.min(1000 * 2 ** (attempt - 1), 30_000);
```

`writable` is the single gate that REQ5 and REQ6 rely on: conflicted and deleted-on-disk buffers never autosave, and the quit path refuses them instead of writing. `writeBuffer` emits at most one in-flight write per buffer. `save.writing` records the text version being written, so `onSaved` can tell whether the user typed during the write and needs another write; the parent `write`/`saved` shapes stay unchanged. `requestQuit` either exits at once or sets `terminal.quit` and emits writes, and `onSaved`/`onSaveFailed` then finish or cancel the quit. `pendingWrites` is the same gate exposed for `lifecycle.ts`.

- **Invariants:**
  - No `write` effect for a conflicted or deleted-on-disk buffer.
  - Retry delays are 1, 2, 4, 8, 16, 30, 30… s.
  - A `saveFailed` never leaves `terminal.quit` set.
- **Verification Coverage:** S3 — V3.3, V3.5; S4 — V4.1–V4.5

## `src/core/state/disk.ts`

- **Change:** Add
- **Decisions:** DES5
- **Requirements:** `W261003HEGE-REQ1@R3` (V1 b–d), `W261003HEGE-REQ6@R1`
- **Responsibilities:** apply watcher events and read-backs to buffers and the explorer; conflict choices.
- **Affected Callers/Consumers:** `update` (`fileChanged`; `fileLoaded` for an open path), conflict overlay keys `k`/`t`/`d`.
- **Construction/Wiring:** None — pure module.
- **Dependencies:** `types.ts`, `save.ts`, `buffers.ts`, kernel `UndoHistory`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `onFileChanged` | None — new symbol | removed → deleted on disk or `listDir`; changed → `read` or `listDir` | `update` |
| `onDiskLoaded` | None — new symbol | same stamp → none; clean → undoable reload; dirty → conflict | `buffers.onFileLoaded` |
| `resolveConflict` | None — new symbol | `k` keep (write with disk stamp), `t` take (reload), `d` toggle diff | conflict overlay keys |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
export function onFileChanged(s: AppState, e: FileEvent): Result {
  const b = bufferForPath(s, e.path);
  if (e.kind === "removed") return b ? markDeleted(s, b.id) /* disk="deleted", cancel autosave, message */ : relistParent(s, e.path);
  if (e.isDir) return relistIfExpanded(s, e.path);
  return b ? { state: s, effects: [{ kind: "read", path: e.path }] } : relistParent(s, e.path);
}
export function onDiskLoaded(s: AppState, b: BufferState, f: TextFile): Result {
  if (sameStamp(b.stamp, f.stamp) && b.disk === "present") return none(s);
  if (!b.dirty) return reload(s, b.id, f);        // one undo block: replace all; disk="present"; "Reloaded from disk — u to undo"
  return openConflict(s, b.id, f);                // overlay conflict; autosave paused by `writable`
}
export function resolveConflict(s: AppState, choice: "keep" | "take" | "diff"): Result;
// keep → stamp ← disk.stamp, writeBuffer (toast "Kept your version — saved"); take → reload(disk); diff → showDiff toggle
```

Events never carry file content. A change to an open file becomes a `read` effect, and the comparison happens in `onDiskLoaded`. That reuses the open policy (binary and size checks) for reloads, so a file replaced by a binary is refused rather than loaded. `keep` sets the buffer's expected stamp to the disk stamp just read, so the next `atomicWrite` passes its expected-stamp check and overwrites only after the explicit choice.

- **Invariants:**
  - A dirty buffer is never replaced without a conflict choice.
  - A reload is exactly one undo step.
  - A deleted-on-disk buffer is never written by autosave.
- **Verification Coverage:** S5 — V5.1–V5.4; V3.2 (parent V1 b, c)

## `src/core/state/explorer.ts`

- **Change:** Add
- **Decisions:** DES13
- **Requirements:** `W261003HEGE-REQ10@R2`, `W261003HEGE-REQ8@R2`, `W261003HEGE-REQ1@R3` (UV6)
- **Responsibilities:** tree state, prompts, operation effects with preceding flush writes, result handling, buffer re-pathing.
- **Affected Callers/Consumers:** commands `explorer.toggle`, `explorer.create`, `explorer.rename`, `explorer.move`, `explorer.delete`, `explorer.open`, `explorer.expand`; `update` (`dirListed`, `fsResult`, `trashAvailable`).
- **Construction/Wiring:** commands registered in `commands.ts`; keys `a r m d Enter l h` bound in mode `explorer` in `defaults.ts`.
- **Dependencies:** `save.ts` (`writeBuffer`), `types.ts`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `explorerOp` | None — new symbol | `(s, op) → flush writes ++ [op effect]` | explorer commands |
| `onFsResult` | None — new symbol | re-path, close, relist, E13, trash failure | `update` |
| `onDirListed` | None — new symbol | store entries; error → message | `update` |
| `createTarget` | None — new symbol | `.md` when no extension; trailing `/` → dir | `explorer.create` |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
export function explorerOp(s: AppState, op: FsOp): Result {
  const affected = buffersUnder(s, op.from);                       // the path itself or anything below a folder
  const flush = op.kind === "create" ? [] : affected.map((b) => (st: AppState) => writeBuffer(st, b.id));
  const kind = op.kind === "trash" ? "trash" : op.kind;            // permanent delete rides on "trash" with op.permanent
  return chainAll(s, flush, (st) => ({ state: st, effects: [{ kind, op }] }));
}
export function onFsResult(s: AppState, a: Extract<Action, { type: "fsResult" }>): Result {
  if (!a.ok) return a.op.kind === "trash" && !a.op.permanent
    ? withTrashUnavailable(messageError(s, `Move to Trash failed: ${a.reason}`))
    : messageError(s, a.reason ?? "operation failed");             // e.g. "E13: File exists (b.md)"
  switch (a.op.kind) {
    case "rename": case "move": return relist(repathBuffers(s, a.op.from, a.op.to!), [a.op.from, a.op.to!]);
    case "trash": return relist(closeOrMarkDeleted(s, a.op.from), [a.op.from]);   // dirty after failed flush → disk="deleted"
    case "create": return relist(openIfFile(s, a.op), [a.op.from]);
  }
}
export const createTarget = (name: string): { path: string; dir: boolean } =>
  name.endsWith("/") ? { path: name.slice(0, -1), dir: true }
                     : { path: extname(name) ? name : `${name}.md`, dir: false };
```

The flush writes and the operation reach the runner's serial queue in one ordered list, so the move or trash always sees the newest bytes. `repathBuffers` changes only `path` and keeps `text`, `undo`, `dirty`, and `stamp`, so the next save writes to the new path. If a flush failed, the trash still runs (on the old bytes), but the buffer stays open marked `deleted` (REQ6 rules) instead of closing, so no typed text is lost.

- **Invariants:**
  - No operation overwrites (enforced in `fs.ts`; the reducer only reports E13).
  - Buffers follow renames and moves.
  - A delete closes only buffers that are clean after the flush.
- **Verification Coverage:** S13 — V13.1–V13.5

## `src/core/state/keys.ts`, `src/core/state/commands.ts`, `src/core/state/buffers.ts`, `src/core/state/status.ts`, `src/core/state/init.ts`, `src/core/config/schema.ts`

- **Change:** Add
- **Decisions:** DES2, DES3, DES10
- **Requirements:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ5@R1`, `W261003HEGE-REQ7@R2`, `W261003HEGE-REQ11@R2`
- **Responsibilities:** key routing; ex execution and built-in commands; open/load/refuse; status segments; initial state; config defaults.
- **Affected Callers/Consumers:** `update`; UI statusline reads `statusSegments`.
- **Construction/Wiring:** `registerBuiltins(commands)` in `main`.
- **Dependencies:** kernel, filetypes, `lang/markdown/file-type.ts` (status words decision), zod.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `handleKeyAction` | None — new symbol | cmdline → ex; `Keymap.lookup({mode})` → command; else `handleKey` | `update` |
| `applyVimEffects` | None — new symbol | `changed` → dirty + autosave; `yank "+` → `clipboardWrite`; `paste "+` → `clipboardRead` + `pendingPaste`; `modeChanged` leave Insert → `writeBuffer`; `ex` → `executeEx` | `handleKeyAction` |
| `registerBuiltins` | None — new symbol | registers `buffer.write`, `app.quit`, `app.quitForce`, `buffer.delete`, `buffer.deleteForce`, `buffer.next`, `buffer.prev`, `file.edit`, `window.split`, `window.vsplit`, `window.focus{h,j,k,l}`, `explorer.*` | `main` |
| `EX_ALIASES` | None — new symbol | `w q wq q! e sp vs bn bp bd bd!` + long forms → command ids | `executeEx`, `:` completion |
| `statusSegments` | None — new symbol | `{mode, view, path, dirty, words?, saveError?, position}`; `words` only when `fileType === "markdown"` | `Statusline` |
| `defaults` | None — new symbol | zod-parsed defaults (`escTimeoutMs: 50`, autosave, theme, color) | `initialState` |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
export type CommandContext = { state: AppState; now: number; args?: string; reg: Registries };
export type CommandResult = { state: AppState; effects: Effect[] };
export type AppCommand = Command<CommandContext, CommandResult>;

export function handleKeyAction(s: AppState, a: { key: Key; now: number }, reg: Registries): Result {
  if (s.overlay.kind !== "none") return overlayKey(s, a, reg);                 // prompt / conflict keys
  if (s.vim.mode === "cmdline") return cmdlineKey(s, a, reg);                  // edit, Tab completion, Enter → executeEx
  const mode = s.panels.explorer.focused ? "explorer" : s.vim.mode;
  const hit = reg.keymap.lookup({ mode }, [...s.vim.pending, a.key]);
  if (hit.kind === "command") return runCommand(s, hit.id, a.now, reg);
  if (hit.kind === "prefix") return withPending(s, a.key);
  return runVim(s, a, reg);                                                    // handleKey + applyVimEffects
}
export function statusSegments(s: AppState): StatusSegments {
  const b = activeBuffer(s);
  return { mode: s.vim.mode, view: b.view, path: b.path, dirty: b.dirty,
           words: b.fileType === markdownFileType.id ? countWords(b.text) : undefined,   // cached by text.version
           saveError: b.save.kind === "failed" ? { reason: b.save.reason, retryAt: b.save.retryAt } : undefined,
           position: cursorOf(s) };
}
```

Keymap bindings take precedence over the engine, so explorer keys and `<leader>e` never reach vim. Ex commands resolve through `EX_ALIASES` to command ids, so `:w` and running `buffer.write` from `:` are one code path. Completion lists ex names first, then command ids (UDES2@R1). The note-only status decision (`words`) lives in `core/state`, the composition layer allowed to know file-type ids, so the UI never branches on a file type (parent `rm261003abzp-design.md:395`).

- **Invariants:**
  - Unknown ex command → `E492: Not an editor command: <cmd>`.
  - `:e <path>` resolves relative to `workspace.root`.
  - `statusSegments` is pure.
- **Verification Coverage:** S14 — V14.2 (E492, completion); S4 — V4.*; S10 — V10.3

## `src/core/kernel/**` (text, editor, vim, commands)

- **Change:** Add (vim redesigned from `../alfred/apps/tui/src/view/editor/vim.ts`, reference only)
- **Decisions:** DES3
- **Requirements:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ3@R1`
- **Responsibilities:** parent DES3/DES4/DES5 kernel at file granularity.
- **Affected Callers/Consumers:** `core/state/keys.ts`, `core/state/commands.ts`, `ui/editors/text-view.ts`.
- **Construction/Wiring:** `defaultBindings` read by `main`.
- **Dependencies:** kernel only (boundary rule).

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `TextBuffer`, `createTextBuffer` | `rm261003abzp-design.md:537-542` | same interface; `createTextBuffer(text)` splits on `\n`, tracks `finalNewline` outside | `buffers.ts`, engine |
| `handleKey` | `rm261003abzp-design.md:549` | same signature; `VimEffect` adds `paste` | `keys.ts` |
| `motions`, `textObjects`, `operators` | `rm261003abzp-design.md:544-547` | tables keyed by key string, one file each | engine |
| `parseEx`, `exCompletions` | None — new symbol | `parseEx(line) → {cmd, bang, arg}`; `:s/:%s` parsed here | `commands.ts` |
| `CommandRegistry`, `Keymap`, `KeyScope` | `rm261003abzp-design.md:493-510` | exact parent shape | `main`, `keys.ts` |
| `UndoHistory`, `Registers`, `WindowTree` | None — new symbol | undo blocks with cursor; registers `"`, `0-9`, `a-z`, `+`, `-`; split tree with `focusDirection` | engine, `commands.ts` |
| `defaultBindings` | None — new symbol | global vim/ex/window/explorer bindings, `<leader>e`, `Ctrl-w h/j/k/l` | `main` |

**Existing Shape:** `../alfred/apps/tui/src/view/editor/vim.ts:15-40` (porting reference, outside this repository)

```ts
export type VimMode = "normal" | "insert";
export type VimState = { readonly mode: VimMode; readonly buffer: EditorBuffer; readonly pending: "" | "g" | "d"; … };
```

Alfred's engine is pure but has two modes and a hard-coded pending set.

**Proposed Shape:**

```ts
// src/core/kernel/vim/engine.ts
export function handleKey(s: BufferVim & { vim: VimState }, key: Key, env: VimEnv): { s: typeof s; effects: VimEffect[] } {
  const p = parseKeys([...s.vim.pending, key], s.vim.mode);       // grammar [count]["x][count]op[count](motion|textobject)
  if (p.kind === "incomplete") return { s: withPending(s, key), effects: [] };
  if (p.kind === "invalid") return { s: clearPending(s), effects: [] };
  return execute(s, p.command, env);                               // table lookup → operator → undo block → lastChange
}
// src/core/kernel/vim/types.ts
export type VimEffect = { kind: "changed" } | { kind: "yank"; register: RegisterName; text: string; linewise: boolean }
  | { kind: "paste"; register: RegisterName; before: boolean } | { kind: "modeChanged"; mode: Mode }
  | { kind: "ex"; line: string } | { kind: "search"; pattern: string; dir: 1 | -1 };
```

The engine is a parser plus tables, so each REQ2 command is one table entry tested by recorded cases. `paste` from `"+` is the only effect that waits for I/O. The engine emits it, and `core/state` performs the paste when `clipboardText` arrives. Every other register paste is applied inside the engine. Insert-mode keys accumulate into one undo block until `Esc`. The search pattern is translated from vim regex to a JS `RegExp` (very-magic subset: `\<`, `\>`, `\{n,m}`), and an invalid pattern yields `E486: Pattern not found`.

- **Invariants:**
  - Parent invariants (`rm261003abzp-design.md:557`).
  - `src/core/kernel/**` imports only `src/core/kernel/**`.
- **Verification Coverage:** S2 — V2.1, V2.4; S7 — V7.1

## `scripts/record-vim.ts`, `test/vim/*`

- **Change:** Add
- **Decisions:** DES3
- **Requirements:** `W261003HEGE-REQ3@R1`
- **Responsibilities:** record and replay Neovim expectations.
- **Affected Callers/Consumers:** developers (`bun run record:vim`); `bun run check` runs `test/vim`.
- **Construction/Wiring:** `package.json` scripts.
- **Dependencies:** a local Neovim 0.11.x binary (`NVIM` env or `nvim` on `PATH`).

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `assertNvim011` | None — new symbol | exits 1 unless `--version` starts `NVIM v0.11.` | `main` |
| `recordCase` | None — new symbol | RPC session per case | `main` |
| `cases` | None — new symbol | `{id, before, keys}[]` covering REQ2's command list | recorder, `vim.test.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
async function recordCase(nvim: string, c: VimCase): Promise<Recorded> {
  const sock = join(tmpdir(), `so-rec-${c.id}.sock`);
  const server = Bun.spawn([nvim, "--clean", "--headless", "--listen", sock]);
  const expr = (e: string) => Bun.$`${nvim} --server ${sock} --remote-expr ${e}`.text();
  await expr(setupExpr(c.before));                       // setline, cursor, undolevels=-1 → reset, clear regs
  await expr(`nvim_input(${vimString(c.keys)})`);
  await waitNotBlocking(expr);                           // nvim_get_mode().blocking == v:false
  const after = JSON.parse(await expr(`json_encode({"lines":getline(1,'$'),"pos":getcurpos(),"mode":mode(1),"regs":${REGS_EXPR}})`));
  server.kill(); return { id: c.id, before: c.before, keys: c.keys, after };
}
```

The RPC session follows RF13. `feedkeys(…, "x")` would force Insert to end and hide operator-pending modes, so it is not used. Built-in default mappings (`Y` → `y$`) stay active under `--clean`, so cases are recorded with them and the engine must match them. The test reads `expected.json` and asserts `{lines, cursor, mode, registers}` equality per case. `cursor` converts Neovim's 1-based byte columns to the kernel's 0-based UTF-16 columns for the ASCII and BMP fixtures.

- **Invariants:**
  - `expected.json.nvim` starts with `0.11.`.
  - The recorder is never invoked by `check` or CI.
- **Verification Coverage:** S2 — V2.1, V2.2, V2.3

## `src/core/kernel/view/*`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ11@R2`
- **Responsibilities:** parent DES9@R3 kernel view at its final shape; DI1 `mark` providers.
- **Affected Callers/Consumers:** `src/ui/editors/text-view.ts`; DI3's `livePreview` (later).
- **Construction/Wiring:** window providers assembled in `src/ui/editors/text-view.ts` from the buffer's file type.
- **Dependencies:** kernel `TextBuffer`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `TextView`, `Decoration`, `DecorationProvider`, `layoutText`, `Highlighter`, `highlightMarks`, `RenderLine` | `rm261003abzp-design.md:607-620`, `:385` | exact parent shapes | EditorView, lang/code |
| `searchMarks`, `selectionMarks` | `…phase-1…md:242` (named only) | `(search) → DecorationProvider`, `(selection) → DecorationProvider` | EditorView |

**Existing Shape:** `rm261003abzp-design.md:607-620`

```ts
export type Decoration = | { kind: "mark"; range: Range; style: StyleToken } | { kind: "replace"; … } | { kind: "widget"; … } | { kind: "line"; … };
export function layoutText(v: TextView, providers: readonly DecorationProvider[], analysis: unknown): RenderLine[];
```

The parent defines the full decoration union, and DI1 produces only `mark`.

**Proposed Shape:**

```ts
export function layoutText(v: TextView, providers: readonly DecorationProvider[], analysis: unknown): RenderLine[] {
  const decos = providers.flatMap((p) => p(v, analysis));                       // visible lines only
  return rowsOf(v).map((line) => spansFor(v.buf.line(line), marksOn(decos, line), line));   // replace/widget/line handled per parent rules
}
export const searchMarks = (q: SearchState | undefined): DecorationProvider => (v) => q ? matchesIn(v, q.regex).map(toMark("searchMatch")) : [];
export const selectionMarks = (sel: Range | undefined): DecorationProvider => (v) => sel ? clip(v, sel).map(toMark("selection")) : [];
```

`layoutText` implements all four decoration kinds now, so DI3 adds only providers. DI1 tests exercise `replace`, `widget`, and `line` with synthetic providers, which keeps the contract proven before DI3 depends on it. Search and selection marks are language-neutral, so they live in the kernel.

- **Invariants:**
  - No providers → raw lines.
  - Rows outside the viewport never produced.
  - Span offsets map cursor ↔ source column.
- **Verification Coverage:** S17 — V17.1; S7 — V7.4

## `src/core/filetypes/registry.ts`, `src/core/lang/code/file-types.ts`, `src/core/lang/code/highlight.ts`, `src/core/lang/markdown/file-type.ts`

- **Change:** Add (highlighter adapted from `../alfred/apps/tui/src/view/markdown/code-highlight.ts`, reference only)
- **Decisions:** DES6
- **Requirements:** `W261003HEGE-REQ11@R2`, `W261003HEGE-REQ1@R3`
- **Responsibilities:** registry (parent shape); language table; windowed lowlight highlighting; Markdown source-only file type.
- **Affected Callers/Consumers:** `main` (registration); `buffers.onFileLoaded` (`forPath`); `EditorView` (`highlightMarks`).
- **Construction/Wiring:** `main` registers `textFileType`, `codeFileTypes`, `markdownFileType`.
- **Dependencies:** `lowlight` 3.3.0 (`createLowlight(common)`).

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `FileTypeRegistry`, `EditorKindRegistry`, `FileType` | `rm261003abzp-design.md:654-676` | exact parent shapes; `forPath` = extension → file name → `text` | `main`, `buffers.ts` |
| `CODE_LANGUAGES` | None — new symbol | 34 entries `{id, extensions, names}` | `codeFileTypes`, tests |
| `lowlightHighlighter` | `rm261003abzp-design.md:679` | `(language) → Highlighter` with 200-line look-back, `WeakMap<TextBuffer, cache>` | code file types, `markdownFileType` |
| `markdownFileType` | None — new symbol | `{id:"markdown", match:{extensions:[".md"]}, editor:"text", views:[{id:"source", decorations:[]}], highlighter: lowlightHighlighter("markdown")}` | `main` |

**Existing Shape:** `rm261003abzp-design.md:672-681`

```ts
export class FileTypeRegistry { register(ft: FileType<any>): void; forPath(path: string): FileType; get(id: string): FileType | undefined; }
export function lowlightHighlighter(language: string): Highlighter;
```

The parent fixes the registry contract and a highlighter that reads up to 200 lines above the requested range.

**Proposed Shape:**

```ts
// src/core/lang/code/file-types.ts — 37 common grammars minus shell, python-repl, plaintext
export const CODE_LANGUAGES = [
  { id: "typescript", extensions: [".ts", ".tsx", ".mts", ".cts"] }, { id: "javascript", extensions: [".js", ".jsx", ".mjs", ".cjs"] },
  { id: "json", extensions: [".json", ".jsonc"] }, { id: "yaml", extensions: [".yaml", ".yml"] },
  { id: "ini", extensions: [".toml", ".ini", ".cfg"] }, { id: "bash", extensions: [".sh", ".bash", ".zsh"] },
  { id: "xml", extensions: [".html", ".htm", ".xml", ".svg"] }, { id: "makefile", extensions: [".mk"], names: ["Makefile", "GNUmakefile", "makefile"] },
  /* python, css, scss, less, go, rust, c, cpp, csharp, java, kotlin, swift, objectivec, php, php-template, ruby, perl,
     lua, r, sql, graphql, diff, wasm, vbnet, arduino — each with its conventional extensions */
] as const satisfies readonly LanguageSpec[];
export const codeFileTypes: FileType[] = CODE_LANGUAGES.map((l) => ({
  id: l.id, match: { extensions: l.extensions, names: l.names }, editor: "text",
  views: [{ id: "source", decorations: [] }], highlighter: lowlightHighlighter(l.id) }));

// src/core/lang/code/highlight.ts
const LOOK_BACK = 200;
export function lowlightHighlighter(language: string): Highlighter {
  const cache = new WeakMap<TextBuffer, { from: number; to: number; spans: Span[][] }>();
  return { language, highlight(buf, lines) {
    const hit = cache.get(buf); if (hit && hit.from <= lines.from && hit.to >= lines.to) return hit.spans.slice(lines.from - hit.from, lines.to - hit.from);
    const from = Math.max(0, lines.from - LOOK_BACK);
    const tree = low.highlight(language, joinLines(buf, from, lines.to), { prefix: "" });
    const all = hastToLineSpans(tree, HLJS_TOKENS);                             // split text nodes on "\n"; hljs class → StyleToken
    cache.set(buf, { from: lines.from, to: lines.to, spans: all.slice(lines.from - from) });
    return all.slice(lines.from - from);
  } };
}
```

- **Mapping:** the table is the only mapping from paths to languages. The registry's duplicate-extension check proves it unambiguous at startup.
- **Caching:** because `TextBuffer` is immutable per version, a `WeakMap` keyed by the buffer object is exactly a per-version cache that frees itself.
- **Look-back:** highlighting the look-back plus the window as one string is the only option, because lowlight has no incremental API (RF10). At about 1.7 ms per 260 lines it fits the keystroke budget.
- **Markdown in DI1:** Markdown gets the `markdown` grammar for colouring only. DI2 adds `analyze`, and DI3 adds the `live` and `reading` views.

- **Invariants:**
  - `forPath` is pure and deterministic.
  - No file type for `shell`, `python-repl`, `plaintext`.
  - A highlighter error yields no marks for that range.
- **Verification Coverage:** S6 — V6.1, V6.2, V6.3; S17 — V17.1

## `src/workspace/fs.ts`

- **Change:** Add
- **Decisions:** DES8, DES12, DES13
- **Requirements:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ9@R1`, `W261003HEGE-REQ10@R2`
- **Responsibilities:** open policy; atomic write with expected-stamp check; listing with exclusion; create/move/remove without overwrite.
- **Affected Callers/Consumers:** `src/app/effects.ts`; DI2 rename writes.
- **Construction/Wiring:** runner imports functions directly; `ExclusionMatcher` passed in.
- **Dependencies:** `node:fs/promises`, `Bun.file`, `Bun.hash`, `src/workspace/ignore.ts`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `readTextFile` | `rm261003abzp-design.md:734-743` | same policy; `stamp` from bytes; `io` refusal on read errors | runner `read` |
| `atomicWrite` | `rm261003abzp-design.md:744-751` `(path, text)` | `(path, text, expected?) → Stamp`; temp `0600` then `chmod` original mode; `unlink` temp in `finally` on failure; throws `FsError("conflict")` when `stat ≠ expected` | runner `write`, lifecycle flush |
| `listDir` | None — new symbol | `(root, rel, matcher) → DirEntry[]` | runner `listDir` |
| `createEntry`, `moveEntry`, `removeEntry` | None — new symbol | exclusive create (`wx`), `mkdir -p` parents; move refuses existing target (`E13`); recursive remove | runner |

**Existing Shape:** `rm261003abzp-design.md:744-751`

```ts
export async function atomicWrite(path: string, text: string): Promise<Stamp> {
  const target = await realpathOrSelf(path);
  const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
  …; await rename(tmp, target); return stampOf(target, text);
}
```

The parent writes the temp file, fsyncs it, and renames it over the target.

**Proposed Shape:**

```ts
export async function atomicWrite(path: string, text: string, expected?: Stamp): Promise<Stamp> {
  const target = await realpathOrSelf(path);
  const cur = await statOrNull(target);
  if (expected && cur && !sameStamp(await stampOfFile(target, cur), expected)) throw new FsError("conflict");
  const tmp = join(dirname(target), `.${basename(target)}.so-tmp-${process.pid}`);
  const fd = await open(tmp, "w", 0o600);
  try { await fd.writeFile(text); await fd.sync(); await fd.close(); await chmod(tmp, cur?.mode ?? 0o644); await rename(tmp, target); }
  catch (e) { await fd.close().catch(() => {}); await rm(tmp, { force: true }); throw FsError.from(e); }
  return stampOfBytes(target, text);
}
export async function moveEntry(root: string, from: string, to: string): Promise<void> {
  if (await exists(abs(root, to))) throw new FsError(`E13: File exists (${to})`);
  await mkdir(dirname(abs(root, to)), { recursive: true }); await rename(abs(root, from), abs(root, to));
}
export async function createEntry(root: string, rel: string, dir: boolean): Promise<void>;  // mkdir -p parent; dir ? mkdir : open(wx) → EEXIST → E13
```

- **Conflict check:** the expected-stamp check closes the window between an external edit and the watcher's 50 ms debounce. A save never overwrites a disk version it hasn't seen.
- **Temp file:** created `0600`, then `chmod` to the original mode, so other users can never read a half-written note in a shared folder.
- **Overwrite race:** `moveEntry`'s existence check plus `rename` leaves a tiny race against a concurrent external create of the same target. It is accepted, because POSIX `rename` cannot express "no replace" for directories portably.

- **Invariants:**
  - Old-or-new file on any failure.
  - No temp file left after a failed write.
  - Never overwrites in create/move.
- **Verification Coverage:** S3 — V3.1, V3.2, V3.5; S6 — V6.4, V6.5; S13 — V13.1

## `src/workspace/watcher.ts`

- **Change:** Add
- **Decisions:** DES5
- **Requirements:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ6@R1`, `W261003HEGE-REQ10@R2`
- **Responsibilities:** recursive watch, per-path debounce, stat-based classification, own-operation suppression, exclusion.
- **Affected Callers/Consumers:** `main` (start/stop); runner (notes own operations).
- **Construction/Wiring:** `createOwnOps()` shared by runner and watcher.
- **Dependencies:** `node:fs` `watch`, `lstat`; `fs.ts` `stampOfFile`; `ignore.ts`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `watchWorkspace` | `rm261003abzp-design.md:752-753` `(root, ownWrites, emit)` | `(root, ownOps, matcher, emit) → stop()` | `main` |
| `OwnOps` | `rm261003abzp-design.md:752` `OwnWrites` | writes by stamp + moves/removals by path prefix for 1 s after completion | runner, watcher |

**Existing Shape:** `rm261003abzp-design.md:752-753`

```ts
export function watchWorkspace(root: string, ownWrites: OwnWrites, emit: (e: FileEvent) => void): () => void;
// fs.watch(root, { recursive: true }); debounce 50 ms per path; ignore if stamp ∈ ownWrites
```

The parent suppresses own writes only.

**Proposed Shape:**

```ts
export function createOwnOps(clock = () => performance.now()): OwnOps {
  const writes = new Map<string, Stamp>(); const paths: { prefix: string; until: number }[] = [];
  return { noteWrite: (p, s) => writes.set(p, s),
           noteMove: (from, to) => paths.push({ prefix: from, until: clock() + 1000 }, { prefix: to, until: clock() + 1000 }),
           noteRemove: (p) => paths.push({ prefix: p, until: clock() + 1000 }),
           isOwn: (p, s) => (s !== undefined && sameStamp(writes.get(p), s)) || paths.some((x) => x.until > clock() && within(p, x.prefix)) };
}
export function watchWorkspace(root: string, own: OwnOps, matcher: ExclusionMatcher, emit: (e: FileEvent) => void): () => void {
  const timers = new Map<string, Timer>();
  const w = watch(root, { recursive: true }, (_type, name) => { if (!name || matcher.isExcludedPath(name)) return;
    clearTimeout(timers.get(name)); timers.set(name, setTimeout(() => classify(name), 50)); });
  async function classify(rel: string) {
    const st = await lstatOrNull(join(root, rel));
    if (!st) { if (!own.isOwn(rel)) emit({ kind: "removed", path: rel }); return; }
    const stamp = st.isFile() ? await stampOfFile(join(root, rel), st) : undefined;
    if (!own.isOwn(rel, stamp)) emit({ kind: "changed", path: rel, isDir: st.isDirectory() });
  }
  return () => { w.close(); for (const t of timers.values()) clearTimeout(t); };
}
```

Event types are ignored and only `lstat` decides, because Bun reports almost everything as `rename` (RF8). Writes are matched by exact stamp, so a later external edit of the same file is never suppressed. Moves and removals are matched by path prefix for 1 s, which absorbs Linux's per-child re-reports and macOS replays (RF8). The accepted cost: a genuine external change inside a just-moved folder within that second is missed until the next event.

- **Invariants:**
  - No event for `so`'s own writes or own moves and removals.
  - Excluded paths never emitted.
  - Symlinks never followed (Bun behaviour, RF8).
- **Verification Coverage:** S5 — V5.1, V5.5; S3 — V3.2 (parent V1 d)

## `src/workspace/ignore.ts`

- **Change:** Add
- **Decisions:** DES12
- **Requirements:** `W261003HEGE-REQ9@R1`
- **Responsibilities:** hidden-name rule plus nested `.gitignore` scopes with git precedence.
- **Affected Callers/Consumers:** `fs.listDir`, `watchWorkspace`; DI2 index worker.
- **Construction/Wiring:** `main` → `createExclusionMatcher(root, readFileSync)`.
- **Dependencies:** `ignore` 7.0.12.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `createExclusionMatcher` | None — new symbol | lazy per-directory scope loading | `main` |
| `isExcluded(rel, isDir)` | None — new symbol | hidden or `node_modules` → true; else scopes root → leaf, last decisive `test()` wins | `listDir` |
| `isExcludedPath(rel)` | None — new symbol | true if any ancestor segment is excluded (watcher, no `stat`) | watcher |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
export const ALWAYS_HIDDEN = (name: string) => name.startsWith(".") || name === "node_modules";
export function createExclusionMatcher(root: string, read: (p: string) => string | null): ExclusionMatcher {
  const scopes = new Map<string, Ignore | null>();                         // dir → ignore() of its .gitignore, cached
  const scope = (dir: string) => scopes.get(dir) ?? load(dir);
  return { isExcluded(rel, isDir) {
    const parts = rel.split("/"); if (parts.some(ALWAYS_HIDDEN)) return true;
    let ignored = false;
    for (let i = 0; i < parts.length; i++) {                                // root scope first, deepest last
      const dir = parts.slice(0, i).join("/"), sub = parts.slice(i).join("/") + (isDir ? "/" : "");
      const r = scope(dir)?.test(sub); if (r?.ignored) ignored = true; else if (r?.unignored) ignored = false;
    }
    return ignored;
  }, isExcludedPath: (rel) => ancestorsExcluded(rel) };
}
```

Each `.gitignore` is tested with paths relative to its own folder, and directories get a trailing `/` (RF14). Scopes are applied root first, and a deeper `unignored` result overrides a shallower `ignored`, which is git's "deeper file wins" rule. A file under an excluded directory is never listed, because the explorer never lists that directory, matching git's "cannot re-include under an excluded parent".

- **Invariants:**
  - Dot entries and `node_modules` always excluded.
  - `.gitignore` files only (no `.git/info/exclude`).
- **Verification Coverage:** S12 — V12.1–V12.4

## `src/workspace/trash.ts`

- **Change:** Add
- **Decisions:** DES11
- **Requirements:** `W261003HEGE-REQ8@R2`
- **Responsibilities:** platform trash and availability.
- **Affected Callers/Consumers:** runner `trash` (non-permanent); `main` (`detectTrash` → `trashAvailable`).
- **Construction/Wiring:** `main` → `detectTrash({platform, env, root})`.
- **Dependencies:** `node:fs/promises`, `Bun.spawn`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `detectTrash` | None — new symbol | Linux: home trash dirs creatable and `st_dev(root) === st_dev(trash)`; macOS: `/usr/bin/trash` or `osascript` present | `main` |
| `freedesktopTrash` | None — new symbol | info-first `O_EXCL`, unique name, rename; `EXDEV`/failure → unlink info, throw | runner |
| `macTrash` | None — new symbol | `/usr/bin/trash <p>` exit 0, or JXA printing `ok` | runner |
| `trashInfo` | None — new symbol | `(absPath, date) → string` | `freedesktopTrash`, tests |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
export function trashInfo(absPath: string, d: Date): string {
  return `[Trash Info]\nPath=${absPath.split("/").map(encodeURIComponent).join("/")}\nDeletionDate=${localIso(d)}\n`;
}
export function freedesktopTrash(home: string, now: () => Date): Trash {
  return { available: true, async move(abs) {
    const base = basename(abs); let name = base;
    for (let n = 2; ; n++) { try { await writeFile(join(home, "info", `${name}.trashinfo`), trashInfo(abs, now()), { flag: "wx" }); break; }
                            catch (e) { if (code(e) !== "EEXIST") throw e; name = `${base}.${n}`; } }
    try { await rename(abs, join(home, "files", name)); } catch (e) { await rm(join(home, "info", `${name}.trashinfo`), { force: true }); throw e; }
  } };
}
const JXA = `function run(argv){ObjC.import('Foundation');return $.NSFileManager.defaultManager.trashItemAtURLResultingItemURLError($.NSURL.fileURLWithPath(argv[0]),null,null)?'ok':'failed'}`;
export function macTrash(hasTrashCli: boolean): Trash {
  return { available: true, async move(abs) {
    if (hasTrashCli) { if ((await Bun.spawn(["/usr/bin/trash", abs]).exited) !== 0) throw new Error("trash failed"); return; }
    const p = Bun.spawn(["osascript", "-l", "JavaScript", "-e", JXA, abs], { stdout: "pipe" });
    if ((await new Response(p.stdout).text()).trim() !== "ok") throw new Error("trash failed");
  } };
}
```

- **Linux:** follows the spec's order (info first, exclusive), so two trashes of `draft.md` never collide. `directorysizes` is not written (RF11).
- **macOS:** the path reaches JXA as `argv[0]`, never interpolated, so a file name cannot inject script. Success is read from stdout, because `osascript` exits 0 on failure (RF11).

- **Invariants:**
  - No orphan `.trashinfo` after a failed move.
  - No shell interpretation of paths.
- **Verification Coverage:** S11 — V11.1–V11.4

## `src/workspace/system.ts`

- **Change:** Add
- **Decisions:** DES10
- **Requirements:** `W261003HEGE-REQ7@R2`
- **Responsibilities:** clipboard provider detection and command providers.
- **Affected Callers/Consumers:** `main`; runner `clipboardWrite`/`clipboardRead`.
- **Construction/Wiring:** `main` → `detectClipboard({platform, env, which: Bun.which, run}, osc52)` where `osc52` wraps `shell.copyOsc52`.
- **Dependencies:** `Bun.which`, `Bun.spawn`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `detectClipboard` | None — new symbol | Neovim 0.11 order (RF12) | `main` |
| `commandProvider` | None — new symbol | `(name, copyArgv, pasteArgv?) → ClipboardProvider` (stdin/stdout, no shell) | `detectClipboard` |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
export async function detectClipboard(d: SysDeps, osc52: (text: string) => void): Promise<ClipboardProvider> {
  const has = (c: string) => d.which(c) !== null;
  if (d.platform === "darwin" && has("pbcopy")) return commandProvider("pbcopy", ["pbcopy"], ["pbpaste"]);
  if (d.env.WAYLAND_DISPLAY && has("wl-copy") && has("wl-paste")) return commandProvider("wl-copy", ["wl-copy"], ["wl-paste", "--no-newline"]);
  if (d.env.DISPLAY && has("xsel") && (await d.run(["xsel", "-o", "-b"])) === 0) return commandProvider("xsel", ["xsel", "-i", "-b"], ["xsel", "-o", "-b"]);
  if (d.env.DISPLAY && has("xclip")) return commandProvider("xclip", ["xclip", "-i", "-selection", "clipboard"], ["xclip", "-o", "-selection", "clipboard"]);
  if (d.env.TMUX && has("tmux")) return commandProvider("tmux", ["tmux", "load-buffer", "-w", "-"], ["tmux", "save-buffer", "-"]);
  return { name: "osc52", copy: async (t) => osc52(t) };                       // no paste: session register fallback
}
```

The order is Neovim 0.11's (RF12). Detection runs once after the first frame, so `xsel -o -b` never delays startup. The OSC 52 provider calls into the shell (`renderer.copyToClipboardOSC52`), the only place that can write terminal sequences, which keeps `src/workspace` free of OpenTUI.

- **Invariants:**
  - The first matching provider wins.
  - Provider failures become `clipboardText{error}` in the runner.
- **Verification Coverage:** S10 — V10.1–V10.4

## `src/app/effects.ts`

- **Change:** Add
- **Decisions:** DES4, DES10, DES11, DES13
- **Requirements:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ5@R1`, `W261003HEGE-REQ7@R2`, `W261003HEGE-REQ8@R2`, `W261003HEGE-REQ10@R2`
- **Responsibilities:** run effects; serial FS queue; timers; result actions; flush API for lifecycle.
- **Affected Callers/Consumers:** `createStore` (`run`), `lifecycle.ts` (`flush`).
- **Construction/Wiring:** `main` → `createEffectRunner(deps)`.
- **Dependencies:** `src/workspace/*`, `src/ui/shell.ts` (`copyOsc52`, `destroy` via exit handler).

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `runEffect` | `rm261003abzp-design.md:72` (name only) | `createEffectRunner(deps).run` | `createStore` |
| `flush` | None — new symbol | `(writes) → Promise<void>` through the same queue | `lifecycle.shutdown` |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
export function createEffectRunner(d: RunnerDeps): EffectRunner {
  let tail = Promise.resolve();                                              // serial FS queue
  const serial = (job: () => Promise<void>) => { tail = tail.then(job, job); return tail; };
  const timers = new Map<TimerId, Timer>();
  const run = (e: Effect): void => { switch (e.kind) {
    case "read": void readTextFile(abs(d.root, e.path)).then((r) => d.dispatch("refused" in r ? { type: "fileRefused", path: e.path, reason: r.refused } : { type: "fileLoaded", path: e.path, file: r })); return;
    case "listDir": void listDir(d.root, e.dir, d.matcher).then((entries) => d.dispatch({ type: "dirListed", dir: e.dir, entries }), (x) => d.dispatch({ type: "dirListed", dir: e.dir, entries: null, reason: msg(x) })); return;
    case "write": void serial(async () => { try { const stamp = await atomicWrite(abs(d.root, e.path), e.text, e.expected); d.ownOps.noteWrite(e.path, stamp); d.dispatch({ type: "saved", path: e.path, stamp }); } catch (x) { d.dispatch({ type: "saveFailed", path: e.path, reason: msg(x) }); } }); return;
    case "create": case "rename": case "move": case "trash": void serial(() => runFsOp(d, e.op)); return;   // → fsResult; notes own ops
    case "startTimer": timers.set(e.id, setTimeout(() => d.dispatch({ type: "timer", id: e.id, now: d.now() }), e.ms)); return;
    case "cancelTimer": clearTimeout(timers.get(e.id)); timers.delete(e.id); return;
    case "clipboardWrite": void d.clipboard.copy(e.text).catch((x) => d.dispatch({ type: "clipboardText", text: "", error: msg(x) })); return;
    case "clipboardRead": void (d.clipboard.paste?.() ?? Promise.resolve("")).then((text) => d.dispatch({ type: "clipboardText", text }), (x) => d.dispatch({ type: "clipboardText", text: "", error: msg(x) })); return;
    case "exit": d.exit(e.code); return;                                       // lifecycle: destroy → process.exit
  } };
  return { run, flush: (writes) => Promise.all(writes.map((w) => serial(() => atomicWrite(abs(d.root, w.path), w.text, w.expected).then(() => {})))).then(() => {}) };
}
```

All mutating file-system effects share one promise chain, so the order `update` emits is the order the disk sees, which is the property DES4 and DES13 rely on. Reads and listings run in parallel because they never change the disk. Every fallible branch dispatches exactly one result action. `flush` reuses the queue, so a signal arriving mid-autosave waits for that write instead of racing it.

- **Invariants:**
  - Mutating effects never run concurrently.
  - Every `write`/FS op answers once.
  - `now` comes from `performance.timeOrigin + performance.now()` in one place (`d.now`).
- **Verification Coverage:** S3 — V3.4; S13 — V13.4; S10 — V10.4

## `src/app/lifecycle.ts`

- **Change:** Add (coordinator adapted from `../alfred/apps/tui/src/terminal/shutdown.ts`, reference only)
- **Decisions:** DES9, DES4
- **Requirements:** `W261003HEGE-REQ5@R1`, `W261003HEGE-REQ1@R3` (V17)
- **Responsibilities:** process handlers, once-only shutdown, bounded flush, exit codes.
- **Affected Callers/Consumers:** `main`; runner `exit` effect.
- **Construction/Wiring:** `installLifecycle({store, shell, runner})` after the shell exists.
- **Dependencies:** `save.pendingWrites`, `Shell.destroy`, `EffectRunner.flush`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `installLifecycle` | None — new symbol | registers SIGTERM, SIGHUP, SIGINT, uncaughtException, unhandledRejection | `main` |
| `shutdown` | None — new symbol | once-guard → bounded flush → destroy → stderr → exit | handlers, `exit` effect |
| `FLUSH_BOUND_MS` | None — new symbol | `2000` | `shutdown` |

**Existing Shape:** None — new file or symbol

```ts
None
```

None — greenfield.

**Proposed Shape:**

```ts
export const FLUSH_BOUND_MS = 2000;
export function installLifecycle(d: { store: Store; shell: Shell; runner: EffectRunner; exit?: (c: number) => never }) {
  let done = false;
  const shutdown = async (code: number, flush: boolean) => {
    if (done) return; done = true;
    const writes = flush ? pendingWrites(d.store.get()) : [];
    await Promise.race([d.runner.flush(writes).catch(() => {}), Bun.sleep(FLUSH_BOUND_MS)]);
    d.shell.destroy();                                                        // restore: main screen, cursor, modes
    const unsaved = unsavedPaths(d.store.get(), writes);                     // still dirty or not confirmed written
    for (const p of unsaved) process.stderr.write(`so: unsaved: ${p}\n`);
    (d.exit ?? process.exit)(code);
  };
  for (const s of ["SIGTERM", "SIGHUP", "SIGINT"] as const) process.on(s, () => void shutdown(0, true));
  process.on("uncaughtException", (e) => { process.stderr.write(`so: ${String(e)}\n`); void shutdown(1, true); });
  process.on("unhandledRejection", (e) => { process.stderr.write(`so: ${String(e)}\n`); void shutdown(1, true); });
  return { exitNow: (code: number) => void shutdown(code, false) };          // used by Effect exit after :q flushed
}
```

The renderer is created with OpenTUI's own handlers disabled (`src/ui/shell.ts` `RENDERER_OPTIONS`), so these are the only handlers that end the process (RF3). The order follows `W261003HEGE-REQ5@R1`: flush, then restore. The flush is bounded, so a hung disk delays restore by at most 2 s, and stderr is written after restore so the lines land on the user's main screen. `pendingWrites` is the same gate the reducer uses, so a crash never writes a conflicted or deleted buffer.

- **Invariants:**
  - `shell.destroy()` runs exactly once on every exit path.
  - Exit code 0 for signals and `:q`, 1 for exceptions.
- **Verification Coverage:** S8 — V8.1, V8.3; S4 — V4.5

## `src/ui/shell.ts`, `src/ui/input.ts`, `src/ui/theme.ts`, `src/ui/editors/*`, `src/ui/views/*`, `src/ui/overlays/*`

- **Change:** Add
- **Decisions:** DES9, DES7
- **Requirements:** `W261003HEGE-REQ1@R3` (DES10, UI obligations, V3), `W261003HEGE-REQ5@R1`
- **Responsibilities:** renderer with safe options; composition per the UI design; Esc hold; painting; theme; OSC 52; destroy.
- **Affected Callers/Consumers:** `main`, `lifecycle.ts`, `system.ts` (via `copyOsc52`).
- **Construction/Wiring:** `createRenderer()` → `createShell(renderer, deps)` → `shell.attach(store)`; `registerEditorView("text", …)`.
- **Dependencies:** `@opentui/core` 0.5.14 (only here).

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `createShell` | `rm261003abzp-ui-design.md:521-536` | same composition; `attach(store)`; `copyOsc52`; `destroy` | `main`, lifecycle |
| `normalizeKey` | `rm261003abzp-design.md:788` `(e: KeyEvent) → Key` | `createKeyNormalizer({escTimeoutMs, now, setTimer, emit})` with `feed(e)` | `createShell` |
| `EditorView` | `rm261003abzp-design.md:778-784` | parent class; cursor via `ctx.setCursorPosition`/`setCursorStyle("block"|"line")`; focused window only | `editorViews` |
| `RENDERER_OPTIONS` | None — new symbol | `{exitOnCtrlC:false, exitSignals:[], openConsoleOnError:false, useMouse:true, enableMouseMovement:false, screenMode:"alternate-screen", useKittyKeyboard:{}}` | `createRenderer` |

**Existing Shape:** `rm261003abzp-design.md:776-789`

```ts
export class EditorView extends Renderable { constructor(ctx: RenderContext, private getView: () => TextViewInput) { … }
  protected renderSelf(buf: OptimizedBuffer) { … layoutText(view, providers, analysis) … paintLine(…) } }
export function normalizeKey(e: KeyEvent): Key;       // kitty protocol when available; legacy Esc via escTimeoutMs
```

The parent marks the class illustrative and asks DI1 to confirm it. RF2 confirms it.

**Proposed Shape:**

```ts
export const OPENTUI_ESC_MS = 20;                                            // OpenTUI StdinParser fixed timeout (RF4)
export function createKeyNormalizer(o: { escTimeoutMs: number; now: () => number; setTimer: SetTimer; emit: (k: Key, now: number) => void }) {
  let held: Timer | undefined;
  const release = () => { if (held) { o.clear(held); held = undefined; o.emit(ESC, o.now()); } };
  return { feed(e: KeyEvent) {
    const key = toKey(e);                                                    // name/ctrl/meta/shift → Key; kitty and raw alike
    if (key === ESC && e.source === "raw") { const extra = Math.max(0, o.escTimeoutMs - OPENTUI_ESC_MS);
      if (extra === 0) return o.emit(ESC, o.now()); held = o.setTimer(release, extra); return; }
    release();                                                               // a key during the hold: Esc first, then the key
    if (e.meta && e.source === "raw" && isPrintable(e)) { o.emit(ESC, o.now()); return o.emit(unmeta(key), o.now()); }   // legacy Esc+key merge
    o.emit(key, o.now());
  } };
}
export async function createRenderer() { return createCliRenderer(RENDERER_OPTIONS); }
```

- **Esc hold:** OpenTUI already waits 20 ms before reporting a lone legacy `escape`. The normalizer holds it another `escTimeoutMs − 20` ms, so the effective timeout is `max(escTimeoutMs, 20)`, and the default 50 ms meets V3 (RF4). Kitty `escape` is unambiguous and passes through at once.
- **Esc+key merge:** a legacy Esc followed quickly by a key arrives from OpenTUI as `meta+key`. DI1 has no Alt bindings, so it is split back into `Esc`, key. That is Neovim's own treatment of unmapped `<M-x>` in Insert mode.
- **Renderer options:** turn off every OpenTUI process handler (RF3) and any-motion mouse tracking, which the editor does not use (RF2).
- **Theme:** the `nocolor` theme paints only with `RGBA.defaultForeground()`/`defaultBackground()` plus attributes, and `EditorView` never calls `fillRect` in that theme, so `NO_COLOR` output has no colour SGR (RF2).
- **Visuals:** region placement, prompts, conflict and diff, toasts, and statusline visuals follow `rm261003abzp-ui-design.md` (Surface: Application shell; File operations and disk changes) and are not restated here.

- **Invariants:**
  - Only `src/ui/**` imports `@opentui/*`.
  - Only the focused window sets the hardware cursor.
  - UI never mutates `AppState`.
- **Verification Coverage:** S9 — V9.1, V9.2; S8 — V8.2; S14 — V14.1–V14.4

## `.github/workflows/ci.yml`, `test/e2e/pty.ts`, `scripts/bench-gate.ts`, `test/boundaries.test.ts`, `test/repo.test.ts`

- **Change:** Add
- **Decisions:** DES14
- **Requirements:** `W261003HEGE-REQ4@R3`, `W261003HEGE-REQ2@R2`, `W261003HEGE-REQ1@R3` (V15, V17, bench)
- **Responsibilities:** PR-only CI; PTY harness; bench gate; boundary and repo-policy tests.
- **Affected Callers/Consumers:** GitHub; developers.
- **Construction/Wiring:** `pull_request` event.
- **Dependencies:** `oven-sh/setup-bun` (SHA-pinned), `@xterm/headless`, `Bun.Terminal`, `Bun.Transpiler`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ci.yml` | None — new symbol | below | GitHub |
| `runInPty` | None — new symbol | `(argv, {env, cols, rows, script}) → {exitCode, probe, screen}` | `restore.test.ts`, `quit.test.ts` |
| `TerminalProbe` | None — new symbol | last `?25h/l`, kitty push/pop, SGR colour seen | e2e tests |
| `TARGETS` | None — new symbol | `{sourceKeystrokeP95: 16, openFile: 50}` ms | `bench-gate.ts` |

**Existing Shape:** None — new file or symbol

```yaml
None
```

None — greenfield.

**Proposed Shape:**

```yaml
# .github/workflows/ci.yml
name: ci
on: { pull_request: { branches: [main] } }
concurrency: { group: ci-${{ github.event.pull_request.number }}, cancel-in-progress: true }
permissions: { contents: read }
jobs:
  check:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@<sha> # v5
      - uses: oven-sh/setup-bun@<sha> # v2.2.0 — reads packageManager
      - run: bun install --frozen-lockfile
      - run: bun run check
  test:
    strategy: { fail-fast: false, matrix: { os: [ubuntu-24.04, macos-15] } }
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@<sha> # v5
      - uses: oven-sh/setup-bun@<sha> # v2.2.0
      - run: bun install --frozen-lockfile
      - run: bun run test:ci
      - if: runner.os == 'Linux'
        run: bun run bench
```

```ts
// test/e2e/pty.ts
export async function runInPty(argv: string[], o: PtyOptions): Promise<PtyRun> {
  const xterm = new Terminal({ cols: o.cols, rows: o.rows, allowProposedApi: true }); const probe = new TerminalProbe();
  const proc = Bun.spawn(argv, { env: o.env, terminal: { cols: o.cols, rows: o.rows, data(t, bytes) {
    const s = decoder.decode(bytes); probe.feed(s); xterm.write(s);
    if (s.includes("\x1b[?u")) t.write("\x1b[?0u");                           // answer the kitty query (RF4)
  } } });
  await o.script(proc);                                                       // type keys, send signals
  const exitCode = await proc.exited;
  return { exitCode, probe, screen: { buffer: xterm.buffer.active.type, mouse: xterm.modes.mouseTrackingMode } };
}
```

- **Triggers:** CI has only a `pull_request` trigger, as the user instructed. The PR-number concurrency group cancels superseded runs, which is the cost control the instruction aims at.
- **Two jobs:** the parent's two-job shape is kept. The bench runs as a Linux-only step of `test`, which keeps one fixed runner type (`ubuntu-24.04`) for timing.
- **Probe:** `TerminalProbe` records the last `?25` and kitty push/pop and any colour SGR in the raw stream, because `@xterm/headless` exposes only the buffer type and mouse mode (RF6).
- **Repo policy:** `test/repo.test.ts` asserts exact npm pins, 40-character action SHAs, and the `pull_request`-only trigger, so the policies of REQ2@R2 and REQ4@R3 can't regress silently.
- **Boundaries:** `test/boundaries.test.ts` scans `src/**/*.ts` with `Bun.Transpiler.scanImports` against `LAYER_RULES` and runs the two violation fixtures (parent V15@R2).

- **Invariants:**
  - No `push` trigger in `ci.yml`.
  - Bench runs only on Linux.
  - The harness always answers the kitty query.
- **Verification Coverage:** S15 — V15.1–V15.3; S8 — V8.1, V8.2; S7 — V7.1, V7.2; S1 — V1.1, V1.2

## `.github/workflows/release-please.yml`, `.github/workflows/release.yml`, `release-please-config.json`, `src/app/main.ts` `VERSION`

- **Change:** Add
- **Decisions:** DES15
- **Requirements:** `W261003HEGE-REQ12@R1`, `W261003HEGE-REQ1@R3` (DES15, V14), `W261003HEGE-REQ2@R2`
- **Responsibilities:** release PRs, cross-compile, native smoke, publish.
- **Affected Callers/Consumers:** GitHub; users downloading binaries.
- **Construction/Wiring:** `release-please.yml` → `uses: ./.github/workflows/release.yml` when `release_created`; `release.yml` also `on: push: tags: ["v*"]`.
- **Dependencies:** `googleapis/release-please-action` v5 (SHA), `actions/upload-artifact`/`download-artifact` (SHA), `gh` CLI.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `VERSION` | None — new symbol | `process.env.SO_VERSION ?? pkg.version` (define-inlined at build) | `parseCli` (`--version`) |
| `release.yml` jobs | None — new symbol | `build` → `smoke` (4 native) → `publish` | GitHub |

**Existing Shape:** None — new file or symbol

```yaml
None
```

None — greenfield.

**Proposed Shape:**

```yaml
# .github/workflows/release.yml
on:
  push: { tags: ["v*"] }
  workflow_call: { inputs: { tag: { type: string, required: true } } }
permissions: { contents: write }
env: { TAG: ${{ inputs.tag || github.ref_name }} }
jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@<sha> # v5
        with: { ref: ${{ env.TAG }} }
      - uses: oven-sh/setup-bun@<sha> # v2.2.0
      - run: bun install --frozen-lockfile --os="*" --cpu="*"
      - run: |
          V="${TAG#v}"
          for t in darwin-arm64 darwin-x64; do bun build --compile --target=bun-$t --define "process.env.SO_VERSION=\"$V\"" src/app/main.ts --outfile dist/so-$t; done
          for t in linux-x64 linux-arm64; do bun build --compile --target=bun-$t --define "process.env.SO_VERSION=\"$V\"" --define 'process.env.OPENTUI_LIBC="glibc"' src/app/main.ts --outfile dist/so-$t; done
          (cd dist && sha256sum so-* > SHA256SUMS)
      - uses: actions/upload-artifact@<sha> # v4
        with: { name: dist, path: dist/ }
  smoke:
    needs: build
    strategy: { matrix: { include: [ {os: macos-15, t: darwin-arm64}, {os: macos-15-intel, t: darwin-x64},
                                     {os: ubuntu-24.04, t: linux-x64}, {os: ubuntu-24.04-arm, t: linux-arm64} ] } }
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/download-artifact@<sha> # v4
        with: { name: dist }
      - run: chmod +x so-${{ matrix.t }} && test "$(./so-${{ matrix.t }} --version)" = "so ${TAG#v}"
  publish:
    needs: smoke
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/download-artifact@<sha> # v4
        with: { name: dist }
      - run: gh release create "$TAG" so-* SHA256SUMS --title "$TAG" $([[ "$TAG" == *-* ]] && echo --prerelease) --repo "$GITHUB_REPOSITORY"
        env: { GH_TOKEN: ${{ github.token }} }
```

```jsonc
// release-please-config.json
{ "packages": { ".": { "release-type": "node", "bump-minor-pre-major": true, "include-component-in-tag": false,
                       "initial-version": "0.1.0" } } }
```

- **One definition, two triggers:** `workflow_call` serves release-please, whose `GITHUB_TOKEN` tags do not trigger other workflows (RF9). The tag trigger serves the manual `v0.1.0-rc.1`.
- **Build:** stays on one runner (parent DES15).
- **Smoke:** runs each binary on its own architecture (REQ12, RF7).
- **Publish:** needs every smoke job, so a failing smoke publishes nothing. A tag containing `-` becomes a GitHub prerelease.
- **Version:** `VERSION` comes from the tag through `--define`, so `so --version` prints the tag's version even for `-rc` builds, while `package.json` stays release-please's source for real releases.

- **Invariants:**
  - No asset is published before all four smoke jobs pass.
  - Every action is SHA-pinned.
- **Verification Coverage:** S16 — V16.1, V16.2

## Migration and Delivery

- **Database or Schema Migration:** None — no persisted data in DI1; notes are read and written as-is.
- **Data Backfill:** None — greenfield.
- **Mixed-Version Compatibility:** None — single binary; Obsidian-compatible files are untouched except by user edits (BOM, EOL, trailing newline preserved: V6.5).
- **Feature Flags:** None — DI1 ships whole behind one PR; no partial exposure is needed before `v0.1.0`.
- **Rollout Constraints:** CI must pass on the DI1 PR (PR-only CI); the release path is exercised once on a manually pushed `v0.1.0-rc.1` tag (prerelease); no `v0.1.0` until PH1 exit.
- **Rollback:** revert the DI1 PR on `main`; delete the `v0.1.0-rc.1` prerelease if needed; notes need no rollback.

# 8. Testing and Verification

## Design Success Criteria

| ID | Observable Success Condition | Traceability |
|---|---|---|
| `S1` | Every npm dependency is exact, `bun.lock` is frozen in CI, every action is SHA-pinned, and `bun run check` finishes < 30 s on the reference machine | REQ2@R2, REQ4@R3; DES1, DES14 |
| `S2` | Every REQ2 vim command produces the recorded Neovim 0.11 result (text, cursor, mode, registers), and the recorder refuses non-0.11 Neovim | REQ1@R3, REQ3@R1; DES3 |
| `S3` | Saves are atomic, keep mode/BOM/EOL/trailing newline, retry with backoff, never overwrite an unseen disk version, and leave no temp file | REQ1@R3; DES4, DES8 |
| `S4` | `:q`, `:wq`, `:q!`, `:bd`, `:bd!`, signals, and crashes follow REQ5 exactly | REQ5@R1; DES4, DES9 |
| `S5` | External edits reload (undoable) or conflict; external deletion marks the buffer deleted without resurrection; own operations never trigger handling | REQ1@R3, REQ6@R1, REQ10@R2; DES5 |
| `S6` | Files open by the open policy and resolve to the right file type; refused files create no buffer | REQ1@R3, REQ11@R2; DES6, DES8 |
| `S7` | Layer and kernel boundaries hold, and the reducer is pure and exhaustive | REQ1@R3; DES2, DES3, DES7, DES14 |
| `S8` | The terminal is restored on `:q`, SIGTERM, SIGINT, and an uncaught exception (kitty observed on, then popped), and `NO_COLOR` output has no colour SGR | REQ1@R3, REQ4@R3, REQ5@R1; DES9, DES14 |
| `S9` | A lone legacy Esc yields `escape` after `max(escTimeoutMs, 20)` ms (50 ± 10 by default); escape sequences resolve immediately | REQ1@R3; DES9 |
| `S10` | `"+` uses the first provider in Neovim 0.11 order, falls back to OSC 52 copy and the session register, and reports failures | REQ7@R2; DES10 |
| `S11` | Trash follows the freedesktop spec on Linux and the non-prompting macOS paths; failures fall back to typed confirmation without orphans | REQ8@R2; DES11 |
| `S12` | The explorer hides dot entries, `node_modules`, and nested `.gitignore` matches with git precedence, and never hangs on symlink loops | REQ9@R1; DES12 |
| `S13` | Explorer operations never overwrite, flush before move and trash, and keep open buffers consistent | REQ10@R2; DES13 |
| `S14` | DI1 UI states match the accepted UI design goldens and interactions (UV1 DI1 states, UV2, UV6, UV10 DI1 states) | REQ1@R3; DES9, DES13 |
| `S15` | CI runs only on pull requests, cancels superseded runs, proves V1 and V17 on Ubuntu and macOS, gates benchmarks on Linux, and finishes < 3 min | REQ4@R3; DES14 |
| `S16` | A `v*` tag produces four binaries plus `SHA256SUMS`, each smoke-tested natively, published as a (pre)release only after all smoke jobs pass | REQ12@R1, REQ1@R3; DES15 |
| `S17` | Keystroke and open in source view stay viewport-bound on the 5,000-line fixture within 2× targets, highlighting included | REQ1@R3, REQ11@R2; DES6, DES7 |

## Test Suites and Cases

```text
so/
├── src/core/kernel/text/text-buffer.test.ts [Unit]
│   Purpose: buffer primitives and inverse edits
│   SUT: createTextBuffer, TextBuffer.apply
│   Infra: None
│   Doubles: None
│   └── V2.4 apply(edit) then apply(inverse) on multi-line, empty, and UTF-16 surrogate text
│       ├── Expect: round-trip text and version+2; lineCount ≥ 1 always [S2]
│       └── Unique risk: undo corrupting text at line joins or surrogate pairs
├── test/vim/vim.test.ts [Unit]
│   Purpose: Neovim equality for the REQ2 command set (parent V2@R1)
│   SUT: handleKey via core/state key routing for registers and undo
│   Infra: None
│   Doubles: None
│   ├── V2.1 every case in expected.json (motions, operators, text objects, counts, registers incl. "a–"z and "0–"9, search, :s, :%s, u, Ctrl-r, .)
│   │   ├── Expect: lines, cursor, mode, registers equal the recorded values exactly [S2]
│   │   └── Unique risk: inclusive/exclusive, linewise, cursor-after-undo divergence
│   └── V2.2 expected.json metadata
│       ├── Expect: nvim starts "0.11." and every cases.ts id has one entry [S2]
│       └── Unique risk: stale or hand-edited fixture
├── scripts/record-vim.test.ts [Unit]
│   Purpose: recorder version guard
│   SUT: assertNvim011
│   Infra: None
│   Doubles: stub executable printing "NVIM v0.12.4"
│   └── V2.3 run guard with a 0.12 stub
│       ├── Expect: exit code 1 and message "requires Neovim 0.11.x" [S2]
│       └── Unique risk: recording with the wrong reference version
├── src/core/kernel/view/text-view.test.ts [Unit]
│   Purpose: kernel layout contract (all decoration kinds)
│   SUT: layoutText, searchMarks, selectionMarks
│   Infra: None
│   Doubles: synthetic providers
│   └── V7.4 no providers; mark; replace (inline/block); widget; line sign; viewport rows only
│       ├── Expect: raw lines with no providers; spans and widget rows per parent model; rows outside view never requested from providers [S7, S17]
│       └── Unique risk: DI3 depending on decoration kinds never exercised in DI1
├── src/core/filetypes/registry.test.ts and src/core/lang/code/file-types.test.ts [Unit]
│   Purpose: path → file type; language table integrity (parent V18 a)
│   SUT: FileTypeRegistry.forPath, CODE_LANGUAGES, codeFileTypes
│   Infra: None
│   Doubles: None
│   ├── V6.1 forPath: scripts/sync.ts, config.yaml, notes.txt, Makefile, a.md, run.sh, pyproject.toml, Dockerfile
│   │   ├── Expect: typescript, yaml, text, makefile, markdown (views ["source"]), bash, ini, text [S6]
│   │   └── Unique risk: wrong grammar or note features on code files
│   └── V6.2 table integrity
│       ├── Expect: every id ∈ lowlight common; shell, python-repl, plaintext absent; no duplicate extension or name (register throws on duplicates) [S6]
│       └── Unique risk: a mapping to a grammar missing from the bundle
├── src/core/lang/code/highlight.test.ts [Unit]
│   Purpose: windowed highlighting and cache
│   SUT: lowlightHighlighter, highlightMarks
│   Infra: None
│   Doubles: None
│   └── V6.3 highlight lines 400–440 of a 5,000-line TS buffer; same buffer twice; a throwing grammar
│       ├── Expect: marks carry code* style tokens; second call served from cache (same array); throw → no marks, no exception [S6, S17]
│       └── Unique risk: whole-file highlighting per keystroke or crash on grammar error
├── src/core/state/save.test.ts [Unit]
│   Purpose: autosave, retry, quit, close (pure)
│   SUT: createUpdate(registries) with key/timer/saved/saveFailed actions
│   Infra: None
│   Doubles: None (effects inspected as data)
│   ├── V3.3 edit at t=0 → timer at t=1000 → write; saveFailed ×3 → retry delays 1000, 2000, 4000; …→ 30000 cap
│   │   ├── Expect: exactly one write per stage; startTimer ms sequence 1000,2000,4000,…,30000; status saveError set [S3]
│   │   └── Unique risk: autosave storm or retry without backoff
│   ├── V3.5 type during an in-flight write (saved with older version)
│   │   ├── Expect: buffer stays dirty and a second write with the newer version is emitted [S3]
│   │   └── Unique risk: marking a buffer clean while newer text is unsaved
│   ├── V4.1 :q with a dirty buffer → write → saved
│   │   ├── Expect: terminal.quit set with waiting [id]; after saved → Effect exit(0) [S4]
│   │   └── Unique risk: exiting before the flush completes
│   ├── V4.2 :q with saveFailed during quit
│   │   ├── Expect: no exit effect; terminal.quit cleared; message "save failed: EACCES…" [S4]
│   │   └── Unique risk: losing edits by exiting on a failed save
│   ├── V4.3 :q with a conflicted buffer and with a dirty deleted-on-disk buffer
│   │   ├── Expect: message "E37: No write since last change (<path>)"; zero effects [S4]
│   │   └── Unique risk: silent overwrite or resurrection on quit
│   └── V4.4 :q! after edits; :q with two windows; :bd! on dirty
│       ├── Expect: exit(0) with no write; closeWindow only (buffer kept); buffer removed with no write [S4]
│       └── Unique risk: vim ! semantics or window/buffer distinction broken
├── src/core/state/disk.test.ts [Unit]
│   Purpose: reload, conflict, deletion rules (pure)
│   SUT: createUpdate with fileChanged/fileLoaded actions
│   Infra: None
│   Doubles: None
│   ├── V5.2 removed event on clean buffer; then timer(autosave); then :q; separately, the file reappears (changed → fileLoaded)
│   │   ├── Expect: disk "deleted", message "deleted on disk — :w to recreate"; no write effect; exit(0); on reappearance the normal reload rule applies and disk is "present" [S5]
│   │   └── Unique risk: autosave resurrecting a deleted file
│   ├── V5.3 removed on dirty buffer; then :w
│   │   ├── Expect: :q blocked (E37); :w emits write with no expected stamp; saved → disk "present" [S5]
│   │   └── Unique risk: losing dirty edits of a deleted file
│   └── V5.4 changed → fileLoaded with new stamp on clean buffer; then u; and on dirty buffer
│       ├── Expect: one undo block reload + "Reloaded from disk — u to undo"; u restores; dirty → overlay conflict, no write [S5]
│       └── Unique risk: non-undoable reload or silent overwrite of dirty text
├── src/core/state/explorer.test.ts [Unit]
│   Purpose: explorer operation effects and results (pure)
│   SUT: createUpdate with explorer commands and fsResult
│   Infra: None
│   Doubles: None
│   ├── V13.2 rename dirty open a.md → c.md
│   │   ├── Expect: effects [write a.md, rename a.md→c.md]; after fsResult ok → buffer.path c.md, dirty, undo kept [S13]
│   │   └── Unique risk: buffer pointing at a vanished path or losing undo
│   ├── V13.3 trash dirty open buffer: effects; fsResult ok after saved; fsResult ok after saveFailed
│   │   ├── Expect: [write, trash]; buffer closed; buffer kept with disk "deleted" [S13]
│   │   └── Unique risk: typed text lost when deleting
│   └── V13.5 create "draft", "sync.ts", "ideas/", "projects/new/idea"; fsResult fail "E13: File exists (b.md)"; trash failure
│       ├── Expect: draft.md, sync.ts, dir ideas, projects/new/idea.md; message E13 text; trash → "unavailable" + error toast [S13, S11]
│       └── Unique risk: extension rule or failure handling wrong
├── src/workspace/ignore.test.ts [Unit]
│   Purpose: exclusion rules
│   SUT: createExclusionMatcher
│   Infra: None
│   Doubles: in-memory read() of .gitignore contents
│   ├── V12.1 .git, .obsidian, .env, node_modules, build/ (root), pkg/dist/ (pkg/.gitignore)
│   │   ├── Expect: all excluded [S12]
│   │   └── Unique risk: hidden or ignored entries shown
│   ├── V12.2 root "*.log" + "!keep.log"; root "*.tmp" + pkg/.gitignore "!x.tmp"
│   │   ├── Expect: keep.log shown; pkg/x.tmp shown (deeper negation wins) [S12]
│   │   └── Unique risk: cross-scope precedence wrong
│   └── V12.3 directory-only pattern "build/" vs file named build
│       ├── Expect: dir excluded, file shown [S12]
│       └── Unique risk: trailing-slash convention ignored
├── src/workspace/fs.test.ts [Integration]
│   Purpose: listing with exclusion and symlinks on a real file system
│   Real: listDir, createExclusionMatcher, readTextFile
│   Infra: filesystem (tmp workspace with a symlinked folder and a symlink loop)
│   Doubles: None
│   └── V12.4 listDir(root); listDir(link-to-dir); listDir on a folder containing a loop; readTextFile(".env")
│       ├── Expect: symlinks listed with their target kind; the linked folder lists only when expanded; loop listing returns without recursion; .env opens by path though hidden [S12]
│       └── Unique risk: hangs on symlink loops or hidden files unreachable by path
├── src/workspace/system.test.ts [Unit]
│   Purpose: provider detection order
│   SUT: detectClipboard
│   Infra: None
│   Doubles: SysDeps (platform, env, which, run)
│   ├── V10.1 darwin+pbcopy; Wayland; DISPLAY with xsel ok; DISPLAY with xsel failing; TMUX only; nothing
│   │   ├── Expect: pbcopy, wl-copy, xsel, xclip, tmux, osc52 [S10]
│   │   └── Unique risk: wrong provider order vs Neovim
│   └── V10.2 osc52 provider copy("héllo")
│       ├── Expect: osc52 callback receives "héllo"; provider has no paste [S10]
│       └── Unique risk: SSH copy silently dropped
├── src/core/state/keys.test.ts [Unit]
│   Purpose: key routing and the "+ paste continuation
│   SUT: createUpdate with key and clipboardText actions
│   Infra: None
│   Doubles: None (effects inspected as data)
│   ├── V7.5 keymap binding vs vim key; explorer focused; global {mode} binding with a {mode, filetype} binding present
│   │   ├── Expect: bound sequence runs its command and never reaches handleKey; explorer keys resolve in mode "explorer"; the filetype-scoped binding wins [S7]
│   │   └── Unique risk: keymap/vim precedence or KeyScope lookup order wrong
│   └── V10.3 "+yy then clipboardText{error}; "+p then clipboardText{text:"", error}
│       ├── Expect: message "clipboard unavailable"; paste inserts registers["+"] at the cursor [S10]
│       └── Unique risk: paste lost when no clipboard provider works
├── src/app/effects.test.ts [Unit]
│   Purpose: runner result mapping
│   SUT: createEffectRunner
│   Infra: None
│   Doubles: ClipboardProvider whose copy rejects; recording dispatch
│   └── V10.4 run clipboardWrite with a rejecting provider
│       ├── Expect: exactly one dispatch clipboardText{text:"", error} [S10]
│       └── Unique risk: clipboard failure swallowed silently
├── src/core/state/update.test.ts [Unit]
│   Purpose: reducer purity and error containment
│   SUT: createUpdate, createStore
│   Infra: None
│   Doubles: a registered command that throws
│   └── V7.3 same (state, action) twice on a deep-frozen state; a throwing command
│       ├── Expect: equal results and no mutation error; the throwing command keeps the previous state and appends an error notification with zero effects [S7]
│       └── Unique risk: impure update or a crash on a command error
├── src/workspace/trash.test.ts [Integration]
│   Purpose: freedesktop trash on a real file system; macOS path selection
│   Real: freedesktopTrash, trashInfo, detectTrash
│   Infra: filesystem (tmp XDG_DATA_HOME and workspace)
│   Doubles: rename failure injected for the EXDEV case; Bun.spawn stub for macTrash
│   ├── V11.1 trash "My draft.md" at a fixed Date
│   │   ├── Expect: files/My draft.md exists; info/My draft.md.trashinfo = "[Trash Info]\nPath=/…/My%20draft.md\nDeletionDate=<local ISO>\n" [S11]
│   │   └── Unique risk: Trash spec non-compliance (file managers cannot restore)
│   ├── V11.2 trash two different files both named draft.md
│   │   ├── Expect: files/draft.md and files/draft.md.2, two info files, nothing overwritten [S11]
│   │   └── Unique risk: collision overwrites an earlier trashed file
│   └── V11.3 rename throws EXDEV; macTrash JXA stub prints "failed" with exit 0; path containing "'); doShellScript('x"
│       ├── Expect: no orphan .trashinfo, source intact, move rejects; JXA rejects; argv carries the path verbatim as one element [S11]
│       └── Unique risk: orphan metadata, false success, or script injection
├── src/ui/input.test.ts [Unit]
│   Purpose: Esc hold and legacy merge (parent V3@R1 core)
│   SUT: createKeyNormalizer
│   Infra: None
│   Doubles: fake timer and clock
│   ├── V9.1 raw escape at t=20 with escTimeoutMs 50; escTimeoutMs 10; kitty escape
│   │   ├── Expect: emit escape at t=50 (± 0 with fake timers); immediate for 10; immediate for kitty [S9]
│   │   └── Unique risk: Esc slower or faster than configured
│   └── V9.2 raw escape then "j" at t+5; meta+"j" raw; "up" event
│       ├── Expect: [escape, j]; [escape, j]; [up] immediately [S9]
│       └── Unique risk: Esc swallowed or arrows misread
├── test/integration/save-safety.test.ts [Integration]
│   Purpose: parent V1@R1 a–d with real fs and real fs.watch
│   Real: atomicWrite, watchWorkspace, createOwnOps, store with createUpdate, effect runner
│   Infra: filesystem (tmpdir), fs.watch
│   Doubles: atomicWrite throws after fsync for (a) via injected fault hook
│   ├── V3.1 (a) throw after fsync during save
│   │   ├── Expect: original bytes intact; no ".so-tmp-" file in the folder [S3]
│   │   └── Unique risk: partial write or leaked temp file
│   ├── V3.2 (b) external edit of clean open file; (c) of dirty open file; (d) so's own save; permissions 0640 preserved
│   │   ├── Expect: (b) reload, u restores; (c) conflict overlay, disk and buffer unchanged; (d) no fileChanged within 500 ms; mode 0640 after save [S3, S5]
│   │   └── Unique risk: lost events after rename-over; self-triggered reload loops
│   └── V3.4 autosave write queued, then external write, then flush: expected-stamp mismatch
│       ├── Expect: saveFailed{reason:"conflict"} → conflict overlay; disk keeps the external text [S3]
│       └── Unique risk: overwriting a version the user never saw
├── test/integration/open-save.test.ts [Integration]
│   Purpose: parent V18@R1 b–e through the store
│   Real: readTextFile, atomicWrite, store, runner
│   Infra: filesystem (fixture copy; 17 MiB file generated)
│   Doubles: None
│   ├── V6.4 :e photo.png; NUL at offset 100; invalid UTF-8; 17 MiB file
│   │   ├── Expect: "binary file — not opened" ×3, "file too large — not opened (limit 16 MiB)"; no buffer; no write effect [S6]
│   │   └── Unique risk: binary file corrupted by a text save
│   └── V6.5 edit and save crlf-bom.md (with and without trailing newline)
│       ├── Expect: saved bytes start EF BB BF, every line ends \r\n, trailing newline presence unchanged [S3, S6]
│       └── Unique risk: BOM or line endings lost
├── test/integration/explorer-ops.test.ts [Integration]
│   Purpose: explorer operations on a real fs with the watcher running
│   Real: createEntry, moveEntry, runner serial queue, watchWorkspace, OwnOps, store
│   Infra: filesystem, fs.watch
│   Doubles: None
│   ├── V13.1 rename a.md → existing b.md; create existing name
│   │   ├── Expect: "E13: File exists (b.md)"; both files byte-identical before/after [S13]
│   │   └── Unique risk: overwrite through the explorer
│   ├── V13.4 rename dirty open a.md → c.md, then autosave
│   │   ├── Expect: c.md has the new text; a.md absent; no reload/conflict/"deleted on disk" within 1 s [S13, S5]
│   │   └── Unique risk: write-vs-rename race recreating a.md
│   └── V5.5 move folder notes/ (two open buffers) → archive/notes/
│       ├── Expect: both buffer paths updated; zero fileChanged actions reach update for own paths (macOS and Linux runners) [S5, S13]
│       └── Unique risk: Linux child re-reports or macOS replays producing false notices
├── src/workspace/watcher.test.ts [Integration]
│   Purpose: watcher classification and suppression edges
│   Real: watchWorkspace, createOwnOps
│   Infra: filesystem, fs.watch
│   Doubles: clock for OwnOps window
│   └── V5.1 own write stamp then external write to the same file; excluded path write; symlink loop present
│       ├── Expect: own write → no event; external → changed; excluded → none; watch() returns < 100 ms [S5, S12]
│       └── Unique risk: suppressing real external edits; hanging on loops
├── test/ui/esc.test.ts [Component]
│   Purpose: parent V3@R1 end to end through OpenTUI's parser
│   Real: test renderer stdin, createShell, createKeyNormalizer
│   Infra: OpenTUI test renderer
│   Doubles: None (real timers, measured)
│   └── V9.3 write "\x1b" raw in legacy mode; write "\x1b[A"
│       ├── Expect: escape dispatched at 50 ms ± 10 ms; up dispatched < 10 ms [S9]
│       └── Unique risk: OpenTUI's 20 ms and the hold combining wrongly
├── test/ui/shell.golden.test.ts [Component]
│   Purpose: UV1 (DI1 states) and UV10 (DI1 states)
│   Real: createShell, views, theme, store with fixture state
│   Infra: OpenTUI test renderer (120×36, 80×24), fixed clock
│   Doubles: effect runner stub
│   ├── V14.1 startup frame; explorer hidden; :vs split; save-failed; info and error toasts; scripts/sync.ts active
│   │   ├── Expect: captureCharFrame equals goldens; sync.ts statusline "MODE │ source │ scripts/sync.ts │ Ln:Col"; info toast gone after 3 s, error toast present after 10 s [S14]
│   │   └── Unique risk: region or segment regressions; note segments on code files
│   └── V14.3 dark, light, nocolor for Normal/Insert badge, visual selection, cursorline, dirty buffer, error toast
│       ├── Expect: captureSpans goldens; nocolor spans use only default fg/bg plus attributes [S14, S8]
│       └── Unique risk: state conveyed by colour alone
├── test/ui/cmdline.test.ts [Component]
│   Purpose: UV2
│   Real: createShell, store, normalizer
│   Infra: OpenTUI test renderer 120×36
│   Doubles: effect runner stub
│   └── V14.2 i, type, Esc; v j; V; :foo Enter; : vs Tab
│       ├── Expect: badges INSERT→NORMAL→VISUAL→V-LINE→COMMAND; cursor style "line" in Insert, "block" after; "E492: Not an editor command: foo"; Tab → vsplit listed first [S14]
│       └── Unique risk: mode feedback or ex-error text diverging from vim
├── test/ui/file-ops.test.ts [Component]
│   Purpose: UV6
│   Real: createShell, explorer view, prompts, conflict view, store
│   Infra: OpenTUI test renderer
│   Doubles: runner stub answering fsResult/fileRefused/trashAvailable
│   └── V14.4 UV6 action list (a ideas/, a draft, a sync.ts, r, m, d with/without trash, conflict d q k, reload u, photo.png, :e big.log)
│       ├── Expect: every UV6@R2 assertion (prompt texts, typed-confirm Enter ignored until exact name, "autosave paused", +/− diff, "Kept your version — saved", reload notice, refusal texts, no write effect) [S14, S13]
│       └── Unique risk: destructive path reachable without confirmation
├── test/e2e/restore.test.ts [E2E]
│   Purpose: parent V17@R1 with kitty exercised
│   Real: compiled-from-source `bun src/app/main.ts` in a PTY
│   Infra: Bun.Terminal PTY, @xterm/headless; ubuntu-24.04 and macos-15
│   Doubles: SO_TEST_THROW=1 env hook throws inside a command (test-only)
│   ├── V8.1 exit by :q, SIGTERM, SIGINT, injected exception
│   │   ├── Expect: kitty push seen during run; after exit buffer "normal", mouse "none", last ?25 = h, last kitty = CSI < u; exit codes 0,0,0,1 [S8, S4]
│   │   └── Unique risk: leaving the user's terminal broken
│   ├── V8.2 NO_COLOR=1 run to :q
│   │   ├── Expect: no SGR with 3x/4x/38/48 colour parameters other than 39/49 [S8]
│   │   └── Unique risk: colour emitted despite NO_COLOR (fillRect path)
│   └── V8.3 type Ctrl-C ("\x03") in Normal mode, then :q
│       ├── Expect: process still running 500 ms after Ctrl-C; exits only after :q with code 0 [S4, S8]
│       └── Unique risk: OpenTUI's default exit-on-Ctrl-C left enabled
├── test/e2e/quit.test.ts [E2E]
│   Purpose: REQ5 data safety at process level
│   Real: so in a PTY on a tmp workspace
│   Infra: Bun.Terminal PTY, filesystem
│   Doubles: SO_TEST_SLOW_WRITE=3000 env hook delays atomicWrite (test-only)
│   └── V4.5 type then SIGTERM within 1 s; slow write then SIGTERM
│       ├── Expect: new text on disk, exit 0; with slow write: process exits within 2.5 s, terminal restored, stderr "so: unsaved: <path>" [S4, S8]
│       └── Unique risk: hang on shutdown or unsaved typing lost on signal
├── test/boundaries.test.ts [Unit]
│   Purpose: parent V15@R2
│   SUT: checkImports over src/**/*.ts
│   Infra: None
│   Doubles: None
│   ├── V7.1 scan src
│   │   ├── Expect: no violation of LAYER_RULES (core no I/O/runtime; only src/ui imports @opentui; kernel → kernel only) [S7]
│   │   └── Unique risk: layering eroding silently
│   └── V7.2 fixtures core-imports-fs.ts and kernel-imports-markdown.ts
│       ├── Expect: both reported as violations [S7]
│       └── Unique risk: a boundary test that never fails
├── test/repo.test.ts [Unit]
│   Purpose: repository policies for REQ2@R2 and REQ4@R3
│   SUT: package.json, .github/workflows/*.yml (parsed)
│   Infra: None
│   Doubles: None
│   ├── V1.1 package.json dependency versions
│   │   ├── Expect: every version matches /^\d+\.\d+\.\d+(-[\w.]+)?$/; packageManager "bun@1.4.2" [S1]
│   │   └── Unique risk: a caret range slipping in
│   ├── V1.2 every `uses:` in workflows
│   │   ├── Expect: ref is a 40-hex SHA followed by a version comment [S1]
│   │   └── Unique risk: mutable action tags
│   └── V15.1 ci.yml triggers and concurrency
│       ├── Expect: `on` has only pull_request; concurrency group references the PR number; cancel-in-progress true [S15]
│       └── Unique risk: push trigger reintroduced (cost) or runs not cancelled
├── test/bench/{source-keystroke,open-file}.bench.ts + scripts/bench-gate.ts [Benchmark]
│   Purpose: DI1 early guard (not S9 evidence of the parent)
│   Real: store, createUpdate, layoutText, EditorView via test renderer
│   Infra: OpenTUI test renderer on ubuntu-24.04
│   Doubles: runner stub
│   └── V17.1 200 keystrokes in a 5,000-line TS file in source view; open of the 5,000-line note
│       ├── Expect: median of 5 runs: keystroke p95 ≤ 32 ms, open ≤ 100 ms (2× targets 16 ms / 50 ms); gate exits non-zero otherwise [S17]
│       └── Unique risk: a full-file pass on the keystroke path
└── Non-test verification
    ├── V1.3 Type/build check — `bun run check` on the reference Mac
    │   ├── Expect: exit 0 in < 30 s (time recorded in the PR) [S1]
    │   └── Unique risk: slow local feedback; type errors in contracts
    ├── V1.4 Docs pins — review of `.s1mple/docs/project.md` and `.s1mple/docs/languages/typescript.md` in the DI1 PR
    │   ├── Expect: recorded versions equal package.json and packageManager exactly [S1]
    │   └── Unique risk: documented toolchain drifting from the lockfile
    ├── V11.4 macOS trash — manual check on the developer Mac (recorded in the DI1 PR)
    │   ├── Expect: d → y moves a file to ~/.Trash via the path detectTrash picked; no permission prompt [S11]
    │   └── Unique risk: macOS behaviour untestable on hosted runners
    ├── V15.2 CI timing — the DI1 PR's CI run
    │   ├── Expect: check and test (both OS) green; wall clock < 3 min [S15]
    │   └── Unique risk: CI budget exceeded
    ├── V15.3 Bench gate wiring — the DI1 PR's Linux test job log
    │   ├── Expect: bench step ran and printed medians for both benchmarks [S15, S17]
    │   └── Unique risk: gate silently skipped
    ├── V16.1 Release dry run — manually pushed v0.1.0-rc.1
    │   ├── Expect: GitHub prerelease with so-darwin-arm64, so-darwin-x64, so-linux-x64, so-linux-arm64, SHA256SUMS; four smoke jobs printed "so 0.1.0-rc.1" [S16]
    │   └── Unique risk: binaries missing the native library; unexecuted artifacts
    ├── V16.2 Release gating — workflow definition review in the PR
    │   ├── Expect: publish `needs: smoke`; smoke matrix has four native labels; an unavailable label recorded as a blocker in the PR [S16]
    │   └── Unique risk: publishing before smoke
    ├── V2.5 Obsolete-reference check — None — greenfield; no removed paths or symbols
    ├── Migration: None — no persisted format in DI1
    ├── Configuration: covered by V9.1 (escTimeoutMs default) and V8.2 (NO_COLOR)
    └── Observability: None — no logging surface in DI1 (DI2 adds SO_LOG)
```

## Coverage Balance

- Pure rules (autosave, quit, disk, explorer, exclusion, provider order, Esc hold) are proven once at unit level. Integration suites prove only what needs a real file system or real `fs.watch`: atomicity, permissions, event suppression, and serial ordering.
- Parent V1, V3, V17, and V18 keep their named levels: integration, unit plus component, e2e, and unit plus integration. V3's component case V9.3 exists because the OpenTUI parser and the hold interact, which a unit test cannot see.
- UI goldens assert the accepted UI design. They do not re-test reducer rules, because the runner is stubbed and the state comes from fixtures.
- The two env hooks (`SO_TEST_THROW`, `SO_TEST_SLOW_WRITE`) are read only in `src/app/main.ts` when `process.env.SO_TEST === "1"`. They are the minimal way to reach the crash and slow-flush paths in a real process.

## Test Quality Rules

- **Unit:** one behavior per case, asserting returned state and effect lists, with no timers or I/O. Doubles exist only for platform detection (`SysDeps`) and clocks.
- **Integration/Contract:** each suite gets its own tmp folder created per suite, and the watcher is stopped in `afterAll`. Event assertions wait for `debounce + 300 ms` on macOS replays, not fixed sleeps elsewhere.
- **Component:** the test renderer is shared per file (RF5's 72 ms setup), and goldens are reviewed in the PR diff.
- **Non-test:** V1.3, V1.4, V11.4, V15.2, V15.3, V16.1, and V16.2 record their evidence in the DI1 PR description.

# 9. Finalized Design Decisions

## W261003HEGE-DES1: Toolchain, scripts, and exact pins

**Question:** How are the toolchain, scripts, and pins configured so that builds are reproducible and `check` stays under 30 s?

**Decision:** One `package.json` with exact versions from RF1, `bunfig.toml` `install.exact = true`, a committed `bun.lock`, `packageManager: "bun@1.4.2"` as the only Bun source, strict TS 7 run through `bun --bun run tsc` with `skipLibCheck`, Biome, knip, and a `check` script that runs only unit suites. Actions are SHA-pinned. Project docs record the pins.

**Requirements Addressed:** `W261003HEGE-REQ2@R2`, `W261003HEGE-REQ4@R3`

**Research Support:** RF1 evaluated `W261003HEGE-REQ2@R1` and informed `W261003HEGE-REQ2@R2`; RF9 informed the action pinning.

**Rationale:** Exact pins plus a frozen lockfile are the standard for reproducible builds and stable benchmark baselines. Running `tsc` under Bun avoids a Node dependency. `skipLibCheck` is the minimal workaround for OpenTUI's `.d.ts` error.

**Code Impact:**

- `package.json`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `bin/so` — toolchain and scripts.
- `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md` — recorded facts.

**Detailed Design:** section 7 — `package.json`, `bunfig.toml`, `tsconfig.json`, …

**Tradeoffs:**

- `skipLibCheck` hides third-party `.d.ts` errors.
- SHA pins need a bot or manual bumps (accepted; upgrades are deliberate PRs).

**Success Criteria:** S1

**Verification Impact:**

- `test/repo.test.ts` V1.1, V1.2 — exact versions and SHA refs; non-test V1.3 — `check` < 30 s.

## W261003HEGE-DES2: Store, protocol, and DI1 state shape

**Question:** What exact state and protocol does DI1 ship, and how does the reducer reach the registries while staying pure?

**Decision:** `AppState` uses exactly the phase file's DI1 top-level fields, with concrete sub-shapes (`BufferState.save`/`disk`/`savedVersion`, `TerminalState.quit`/`color`, `ExplorerState`). The unions add only `listDir`/`dirListed`, `clipboardText.error`, `FsOp.permanent`, and the `"io"` value of `fileRefused.reason` — the set `W261003HEGE-REQ1@R3` allows. `createUpdate(registries)` returns a pure `update` with error containment, and `createStore(initial, update, run)` is the only mutable cell. `statusSegments` keeps file-type-dependent status decisions in `core/state`.

**Requirements Addressed:** `W261003HEGE-REQ1@R3`

**Research Support:** None — design-driven (the R2 revision of REQ1)

**Rationale:** Injecting frozen registries keeps `update` testable without globals. Additive protocol members keep DI2's consumption valid. Every new member serves a DI1 behaviour (explorer listing, clipboard failure, typed-confirm delete, typing during a write).

**Code Impact:**

- `src/core/state/{types,store,update,init,buffers,status}.ts` — protocol, store, reducers.
- `src/core/config/schema.ts` — defaults.

**Detailed Design:** section 7 — `src/core/state/types.ts`; `src/core/state/store.ts` and `src/core/state/update.ts`; `src/core/state/keys.ts`, …

**Tradeoffs:**

- `createStore` gains a parameter relative to the parent's illustrative shape (reported for parent synchronization).
- One `switch` over a closed union (the parent's stated choice) rather than a reducer registry.

**Success Criteria:** S7

**Verification Impact:**

- `tsc` exhaustiveness and V7.1 (core imports no I/O); V3.3–V5.4 drive `createUpdate` purely.

## W261003HEGE-DES3: Kernel module split and recorded vim table

**Question:** How is the vim kernel split into files, and how are its results proven Neovim-equal?

**Decision:** The kernel is split as `text/`, `editor/{undo,registers,windows}`, `vim/{types,keys,parser,motions,operators,text-objects,search,ex,engine}`, and `commands/{registry,keymap,defaults}`, with parent shapes and a `paste` VimEffect for `"+`. Expectations come from `scripts/record-vim.ts`, which drives Neovim 0.11.x over RPC (`--listen`, `nvim_input`, `json_encode`) and writes `test/vim/expected.json`. `test/vim/vim.test.ts` replays every case.

**Requirements Addressed:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ3@R1`

**Research Support:** RF13 evaluated `W261003HEGE-REQ3@R1` and retained it; it supplies the RPC method and v0.11.7.

**Rationale:** One table entry per command keeps the engine extensible, and recorded cases make S2 provable offline. RPC captures Insert and operator-pending modes, which `feedkeys(…, "x")` cannot.

**Code Impact:**

- `src/core/kernel/**` — engine, buffer, registers, windows, registry, keymap.
- `scripts/record-vim.ts`, `test/vim/*` — recorder and replay.

**Detailed Design:** section 7 — `src/core/kernel/**`; `scripts/record-vim.ts`, `test/vim/*`

**Tradeoffs:**

- Cases use ASCII/BMP text to keep column conversion trivial; non-BMP behaviour is covered by V2.4 only.
- Recording needs a local Neovim 0.11 install.

**Success Criteria:** S2

**Verification Impact:**

- V2.1 every recorded case equal; V2.2 fixture metadata; V2.3 version guard; V2.4 buffer round-trip.

## W261003HEGE-DES4: Save pipeline, serial file-system queue, and quit flush

**Question:** How do autosave, retries, `:w`, quit, and explorer flushes stay ordered and safe without locks?

**Decision:**

- **Reducers:** pure reducers in `save.ts` emit ordered effect lists, gated by one `writable` predicate (dirty ∧ disk present ∧ not conflicted).
- **Queue:** `createEffectRunner` executes every mutating FS effect on one promise chain.
- **Writes:** writes carry the `expected` stamp; `save.writing{version}` records which text version is in flight.
- **Retries:** failed saves retry at `min(2^(n−1) s, 30 s)`.
- **Quit:** `:q` uses `terminal.quit` as a continuation completed by `saved` and cancelled by `saveFailed`.
- **Shutdown:** `lifecycle.ts` reuses `pendingWrites` and the queue, bounded to 2 s.

**Requirements Addressed:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ5@R1`, `W261003HEGE-REQ10@R2`

**Research Support:** RF3 (shutdown ownership) evaluated `W261003HEGE-REQ5@R1` and retained it.

**Rationale:** The order of the effect list plus a serial queue gives correctness by construction (write before rename or trash, and no concurrent writes to one file). The expected-stamp check closes the debounce window, so a save never overwrites an unseen disk version.

**Code Impact:**

- `src/core/state/save.ts` — `scheduleAutosave`, `writeBuffer`, `onSaved`, `onSaveFailed`, `requestQuit`, `closeBuffer`, `pendingWrites`, `retryDelay`.
- `src/app/effects.ts` — `createEffectRunner`, serial queue, `flush`.
- `src/workspace/fs.ts` — `atomicWrite` with `expected`.

**Detailed Design:** section 7 — `src/core/state/save.ts`; `src/app/effects.ts`; `src/workspace/fs.ts`

**Tradeoffs:**

- File operations never run in parallel (invisible at interactive scale).
- A save waits behind a slow trash or move.

**Success Criteria:** S3, S4

**Verification Impact:**

- V3.1–V3.5 (atomicity, events, retry, typing during write, stamp conflict); V4.1–V4.5 (quit and signal rules).

## W261003HEGE-DES5: Watcher with own-operation suppression and read-back disk events

**Question:** How are external changes detected and applied without false notices from `so`'s own operations?

**Decision:**

- **Watch:** recursive `fs.watch` over the root, with a 50 ms debounce per path.
- **Classify:** each event is classified by `lstat` (event types ignored).
- **Suppress:** `OwnOps` drops `so`'s own writes by exact stamp, and its moves and removals by path prefix for 1 s.
- **Emit:** events carry no content; changes to open files become `read` effects, compared in `onDiskLoaded`.
- **Deletion:** a removal marks the buffer `disk: "deleted"` (no autosave) and shows the REQ6 message.

**Requirements Addressed:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ6@R1`, `W261003HEGE-REQ10@R2`

**Research Support:** RF8 evaluated `W261003HEGE-REQ6@R1` (retained) and `W261003HEGE-REQ10@R1` (informed `W261003HEGE-REQ10@R2`).

**Rationale:** Bun reports nearly everything as `rename` and re-reports children on Linux (RF8), so `stat` plus own-operation memory is the reliable signal. Read-back reuses the open policy for reloads.

**Code Impact:**

- `src/workspace/watcher.ts` — `watchWorkspace`, `createOwnOps`.
- `src/core/state/disk.ts` — `onFileChanged`, `onDiskLoaded`, `resolveConflict`.

**Detailed Design:** section 7 — `src/workspace/watcher.ts`; `src/core/state/disk.ts`

**Tradeoffs:**

- A real external change inside a just-moved folder within 1 s is missed until its next event.
- One extra read per external change.

**Success Criteria:** S5

**Verification Impact:**

- V5.1–V5.5 and V3.2 (parent V1 b–d) on both CI platforms.

## W261003HEGE-DES6: File types, lowlight table, and windowed highlighting

**Question:** How do files map to languages, and how is highlighting kept viewport-bound?

**Decision:**

- **Registry:** `FileTypeRegistry` at the parent shape, with `text` as the fallback.
- **Table:** `CODE_LANGUAGES` is a static table over lowlight `common` minus `shell`, `python-repl`, and `plaintext`, with `.sh` → `bash`, `.toml` → `ini`, and `.html`/`.xml`/`.svg` → `xml`.
- **Markdown:** `markdownFileType` has one `source` view and the `markdown` grammar.
- **Highlighting:** `lowlightHighlighter` highlights the 200-line look-back plus the requested range as one string, splits the hast into per-line spans, and caches results in a `WeakMap` keyed by the immutable buffer version.

**Requirements Addressed:** `W261003HEGE-REQ11@R2`, `W261003HEGE-REQ1@R3`

**Research Support:** RF10 evaluated `W261003HEGE-REQ11@R1` and informed `W261003HEGE-REQ11@R2`; it also gave the 1.7 ms per 260 lines measurement used for S17.

**Rationale:** A static table is pure and auditable. lowlight has no incremental API, so windowed full-string highlighting is the only option, and it fits the budget.

**Code Impact:**

- `src/core/filetypes/registry.ts` — registries and `textFileType`.
- `src/core/lang/code/{file-types,highlight}.ts` — `CODE_LANGUAGES`, `codeFileTypes`, `lowlightHighlighter`, `HLJS_TOKENS`.
- `src/core/lang/markdown/file-type.ts` — `markdownFileType`.

**Detailed Design:** section 7 — `src/core/filetypes/registry.ts`, …

**Tradeoffs:**

- Look-back can mis-colour the top of a window that starts inside a long block comment (inherent to the parent design).
- `Dockerfile` stays plain.

**Success Criteria:** S6, S17

**Verification Impact:**

- V6.1–V6.3, V17.1.

## W261003HEGE-DES7: Kernel text view at the parent shape

**Question:** What does DI1 ship of the kernel view so that DI3 can add live preview without changing it?

**Decision:** Ship `TextView`, `Decoration` (all four kinds), `DecorationProvider`, `layoutText`, `RenderLine`, `Highlighter`, and `highlightMarks` at their exact parent shapes. Add `searchMarks` and `selectionMarks` as kernel providers. DI1 tests prove `replace`, `widget`, and `line` with synthetic providers.

**Requirements Addressed:** `W261003HEGE-REQ1@R3`

**Research Support:** None — parent shapes (DES9@R3); no RF evaluated a view-specific question.

**Rationale:** The phase file freezes these contracts for DI3, and exercising every decoration kind now keeps that freeze honest.

**Code Impact:**

- `src/core/kernel/view/{types,decorations,text-view,marks}.ts` — the view contract and DI1 providers.

**Detailed Design:** section 7 — `src/core/kernel/view/*`

**Tradeoffs:**

- Code for decoration kinds that DI1 does not use in production (accepted; it is the contract).

**Success Criteria:** S7, S17

**Verification Impact:**

- V7.4 decoration kinds and viewport; V17.1 benchmark.

## W261003HEGE-DES8: Workspace file adapter

**Question:** How do reads, writes, listings, and file operations enforce the open policy and never overwrite?

**Decision:**

- **`readTextFile`:** the parent policy (16 MiB, NUL in the first 8 KiB, fatal UTF-8, BOM and EOL detection) plus an `io` refusal.
- **`atomicWrite`:** realpath; expected-stamp check; temp `0600` → write → fsync → `chmod` to the original mode → rename; temp removed on failure.
- **Other operations:** `listDir` applies the exclusion matcher; `createEntry` uses an exclusive create with `mkdir -p`; `moveEntry` refuses an existing target with `E13`.

**Requirements Addressed:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ9@R1`, `W261003HEGE-REQ10@R2`

**Research Support:** None beyond the parent research (RF11 of the parent).

**Rationale:** These are the parent's S1/S12 mechanisms, plus the two safety gaps found in design: the conflict window, and temp-file permissions in shared folders.

**Code Impact:**

- `src/workspace/fs.ts` — `readTextFile`, `atomicWrite`, `listDir`, `createEntry`, `moveEntry`, `removeEntry`, `stampOf*`, `FsError`.

**Detailed Design:** section 7 — `src/workspace/fs.ts`

**Tradeoffs:**

- Hashing the bytes on every stamp costs a read of the target before a save (about 1 ms at notes scale).
- A move has a tiny race against an external create of the same target.

**Success Criteria:** S3, S6, S13

**Verification Impact:**

- V3.1, V3.2, V3.4, V6.4, V6.5, V13.1.

## W261003HEGE-DES9: OpenTUI shell, input normalizer, and lifecycle coordinator

**Question:** How does the UI adapter guarantee restore, flush, Esc timing, and `NO_COLOR` on OpenTUI 0.5.14?

**Decision:**

- **Renderer:** created with `exitOnCtrlC: false`, `exitSignals: []`, `openConsoleOnError: false`, `enableMouseMovement: false`.
- **Lifecycle:** `src/app/lifecycle.ts` owns SIGTERM, SIGHUP, SIGINT, `uncaughtException`, and `unhandledRejection`, in the order: bounded 2 s flush, destroy (restore), stderr unsaved paths, exit 0 or 1 (`W261003HEGE-REQ5@R1`).
- **Input:** `createKeyNormalizer` holds raw `escape` for `escTimeoutMs − 20` ms and splits legacy `meta+key` into Esc, key.
- **Painting:** the `nocolor` theme paints with default colours and attributes only, never `fillRect`. Only the focused window sets the cursor (`"block"`/`"line"`).
- **Composition:** follows the accepted UI design.

**Requirements Addressed:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ5@R1`

**Research Support:** RF2, RF3, RF4, and RF5 evaluated `W261003HEGE-REQ1@R1` (retained) and supply the API facts; RF3 evaluated `W261003HEGE-REQ5@R1` (retained).

**Rationale:** OpenTUI's defaults would skip the flush on SIGTERM and never exit on an exception (RF3). The Esc hold keeps the parent's configurable 50 ms contract on top of OpenTUI's fixed 20 ms (RF4).

**Code Impact:**

- `src/ui/{shell,input,theme}.ts`, `src/ui/editors/*`, `src/ui/views/*`, `src/ui/overlays/*` — renderer, normalizer, theme, composition.
- `src/app/lifecycle.ts` — handlers and shutdown.

**Detailed Design:** section 7 — `src/ui/shell.ts`, …; `src/app/lifecycle.ts`

**Tradeoffs:**

- Effective Esc timeout cannot go below 20 ms (reported for parent synchronization).
- A slow flush keeps the alternate screen up for at most 2 s before restore.

**Success Criteria:** S8, S9, S14

**Verification Impact:**

- V8.1, V8.2 (PTY), V9.1–V9.3 (Esc), V14.1–V14.4 (UI goldens and interactions), V4.5 (signal flush).

## W261003HEGE-DES10: Clipboard provider chain

**Question:** How is the `"+` provider chosen and wired without putting terminal code in `src/workspace`?

**Decision:** `detectClipboard` runs once after the first frame, in Neovim 0.11 order: pbcopy → wl-copy → xsel (when `xsel -o -b` succeeds) → xclip → tmux (`load-buffer -w`) → OSC 52 copy-only. The OSC 52 provider is a callback into `shell.copyOsc52`. The runner turns failures into `clipboardText{error}`, and core falls back to `registers["+"]` for paste.

**Requirements Addressed:** `W261003HEGE-REQ7@R2`

**Research Support:** RF12 evaluated `W261003HEGE-REQ7@R1` and informed `W261003HEGE-REQ7@R2`.

**Rationale:** Matching Neovim's order keeps vim users' expectations. A callback keeps OpenTUI inside `src/ui` (boundary rule).

**Code Impact:**

- `src/workspace/system.ts` — `detectClipboard`, `commandProvider`.
- `src/app/effects.ts` — clipboard cases.
- `src/core/state/keys.ts` — `pendingPaste` handling.

**Detailed Design:** section 7 — `src/workspace/system.ts`; `src/app/effects.ts`; `src/core/state/keys.ts`, …

**Tradeoffs:**

- OSC 52 paste is not attempted (most terminals ignore or prompt).
- The tmux provider needs tmux ≥ 3.2 for `-w`.

**Success Criteria:** S10

**Verification Impact:**

- V10.1, V10.2 (unit).
- V10.3: the cmdline/keys unit case `"+yy` with provider failure shows `clipboard unavailable` and `"+p` pastes `registers["+"]` (`src/core/state/keys.test.ts`).
- V10.4: the runner unit case where a rejecting `copy` dispatches `clipboardText{error}` (`src/app/effects.test.ts`).

## W261003HEGE-DES11: Trash adapters

**Question:** How is delete-to-trash implemented per platform, safely and without permission prompts?

**Decision:**

- **Linux:** `freedesktopTrash` writes `info/<name>.trashinfo` first with `wx` and a unique name (`name.2`, …), then renames into `files/`, removing the info file on failure. It never writes `directorysizes`.
- **macOS:** `macTrash` uses `/usr/bin/trash` when present, else JXA `NSFileManager.trashItemAtURL` with the path as `argv`, checking stdout for `ok`.
- **Availability:** `detectTrash` checks the device and tool presence. A runtime failure flips availability so the typed confirmation takes over.

**Requirements Addressed:** `W261003HEGE-REQ8@R2`

**Research Support:** RF11 evaluated `W261003HEGE-REQ8@R1` and informed `W261003HEGE-REQ8@R2`.

**Rationale:** This follows the spec's prescribed order and its refuse-and-warn branch. It uses the same system API as Finder without its Automation prompt, and argv passing prevents injection.

**Code Impact:**

- `src/workspace/trash.ts` — `detectTrash`, `freedesktopTrash`, `macTrash`, `trashInfo`.

**Detailed Design:** section 7 — `src/workspace/trash.ts`

**Tradeoffs:**

- No topdir trash (deferred in the requirements).
- JXA relies on the ObjC bridge.

**Success Criteria:** S11

**Verification Impact:**

- V11.1–V11.3 integration; V11.4 manual macOS record; V13.5 failure handling.

## W261003HEGE-DES12: Shared exclusion matcher

**Question:** How are hidden and ignored entries decided consistently for the explorer, the watcher, and DI2's worker?

**Decision:** `createExclusionMatcher(root, read)` always hides names starting with `.` and `node_modules`. It loads one `ignore` instance per folder's `.gitignore` lazily, tests paths relative to each scope (directories with a trailing `/`), and applies scopes root-first with the deeper `unignored` result winning. `isExcludedPath` checks ancestors for watcher events.

**Requirements Addressed:** `W261003HEGE-REQ9@R1`

**Research Support:** RF14 and RF8 evaluated `W261003HEGE-REQ9@R1` and retained it; RF14 supplies the caller-side precedence rule.

**Rationale:** This is git's semantics with a maintained library and no Git dependency, in one module the worker can import (workspace layer).

**Code Impact:**

- `src/workspace/ignore.ts` — `createExclusionMatcher`, `ALWAYS_HIDDEN`.

**Detailed Design:** section 7 — `src/workspace/ignore.ts`

**Tradeoffs:**

- `.git/info/exclude` and global excludes are ignored (consistent with "no Git").

**Success Criteria:** S12

**Verification Impact:**

- V12.1–V12.3 unit; V12.4 symlinks and open-by-path (integration); V5.1 excluded-path watcher case.

## W261003HEGE-DES13: Explorer operations reducer

**Question:** How do explorer operations stay safe for open buffers and never overwrite?

**Decision:** `explorerOp` emits the flush writes of every affected buffer, then the operation effect, as one ordered list. Permanent deletion is `trash` with `op.permanent`. `onFsResult`:

- re-paths buffers on rename and move, keeping text, undo, dirty state, and stamp;
- after a trash, closes buffers that are clean and marks still-dirty ones `deleted`;
- relists affected folders;
- reports `E13`;
- flips trash availability on a trash failure.

The adapter enforces no-overwrite, and the runner notes own operations for the watcher.

**Requirements Addressed:** `W261003HEGE-REQ10@R2`, `W261003HEGE-REQ8@R2`

**Research Support:** RF8 evaluated `W261003HEGE-REQ10@R1` and informed `W261003HEGE-REQ10@R2`; RF11 evaluated it with no impact.

**Rationale:** Ordering through the serial queue makes "flush first" a property of the effect list. Re-pathing preserves editing state, and the deleted fallback avoids losing text when a flush fails.

**Code Impact:**

- `src/core/state/explorer.ts` — `explorerOp`, `onFsResult`, `onDirListed`, `createTarget`, `toggleExplorer`.
- `src/core/kernel/commands/defaults.ts` — explorer bindings.

**Detailed Design:** section 7 — `src/core/state/explorer.ts`

**Tradeoffs:**

- Re-pathing after DI2 also needs link rewriting; DI2 routes `file.rename`/`file.move` through `planRename` (phase file line 158).

**Success Criteria:** S13, S14

**Verification Impact:**

- V13.1–V13.5; V5.5; V14.4 (UV6).

## W261003HEGE-DES14: Test layout, PR-only CI, PTY harness, and bench gate

**Question:** Where do tests live, what runs locally versus in CI, and how is terminal state observed?

**Decision:**

- **Layout:** unit tests are colocated in `src/` plus `test/{vim,boundaries,repo}` in `check`; component tests in `test/ui`; integration in `test/integration` and the watcher and trash suites; e2e in `test/e2e`; benchmarks in `test/bench`.
- **CI:** `ci.yml` runs on `pull_request` only, with PR-number concurrency and `cancel-in-progress`. Jobs are `check` (`ubuntu-24.04`) and `test` (matrix `ubuntu-24.04`, `macos-15`), with a Linux-only bench step and the 2× gate in `scripts/bench-gate.ts`.
- **PTY harness:** `runInPty` uses `Bun.Terminal`, answers `CSI ? u`, reads the screen and mouse from `@xterm/headless`, and reads `?25` and kitty push/pop from `TerminalProbe`.
- **Policy tests:** `test/repo.test.ts` locks the pin and trigger policies.

**Requirements Addressed:** `W261003HEGE-REQ4@R3`, `W261003HEGE-REQ2@R2`, `W261003HEGE-REQ1@R3`

**Research Support:** RF4 and RF6 evaluated `W261003HEGE-REQ4@R1` and informed `W261003HEGE-REQ4@R2`, whose test content R3 keeps. R3's PR-only trigger is the user's instruction.

**Rationale:**

- **Cost:** PR-only CI plus cancellation keeps paid macOS minutes for reviews, as the user asked.
- **Two jobs:** the parent's two-job shape and one fixed bench runner are kept.
- **Kitty probe:** answering the kitty query is what makes the restore assertion meaningful (RF4).

**Code Impact:**

- `.github/workflows/ci.yml` — triggers, concurrency, jobs.
- `test/e2e/pty.ts` — `runInPty`, `TerminalProbe`.
- `scripts/bench-gate.ts` — `TARGETS`, median gate.
- `test/boundaries.test.ts`, `test/repo.test.ts`, fixtures — boundary and policy checks.

**Detailed Design:** section 7 — `.github/workflows/ci.yml`, `test/e2e/pty.ts`, …

**Tradeoffs:**

- A direct push to a branch gets no CI feedback until a PR exists.
- The release-please bot PR does not trigger CI (`GITHUB_TOKEN` events), which is acceptable because it changes only the version and changelog.

**Success Criteria:** S15, S8, S7, S1

**Verification Impact:**

- V15.1 trigger shape; V15.2 timing; V15.3 bench wiring; V8.1, V8.2 PTY; V7.1, V7.2 boundaries; V1.1, V1.2 policies.

## W261003HEGE-DES15: Release workflows with native smoke

**Question:** How do release-please releases and the manual rc tag produce verified binaries with one workflow definition?

**Decision:**

- **Trigger:** `release-please.yml` (on push to `main`, action v5 SHA-pinned) calls `release.yml` through `workflow_call` when `release_created`. `release.yml` also runs on `push: tags: ["v*"]`.
- **`build`:** one `ubuntu-24.04` runner, with `bun install --os="*" --cpu="*"`, four `--compile` targets, `SO_VERSION` defined from the tag, glibc defined for Linux, and `SHA256SUMS`.
- **`smoke`:** native runners `macos-15`, `macos-15-intel`, `ubuntu-24.04`, `ubuntu-24.04-arm`.
- **`publish`:** needs `smoke`, and marks tags containing `-` as prereleases.

**Requirements Addressed:** `W261003HEGE-REQ12@R1`, `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ2@R2`

**Research Support:** RF7 evaluated `W261003HEGE-REQ1@R1` and informed `W261003HEGE-REQ12@R1`; RF9 (trigger limits, v5) evaluated `W261003HEGE-REQ1@R1` and `W261003HEGE-REQ2@R1`.

**Rationale:**

- **Reusable workflow:** sidesteps the rule that `GITHUB_TOKEN` tags do not trigger workflows, without a PAT.
- **Native smoke:** catches the darwin-x64 class of failure (RF7).
- **Gating:** publishing only after smoke means no unverified asset ships.

**Code Impact:**

- `.github/workflows/{release-please,release}.yml` — triggers and jobs.
- `release-please-config.json`, `.release-please-manifest.json` — release-please config.
- `src/app/main.ts` — `VERSION`.

**Detailed Design:** section 7 — `.github/workflows/release-please.yml`, …

**Tradeoffs:**

- Four extra short jobs per release (rare: the rc and phase exits).
- Hosted label availability for a private repository is confirmed only by the rc run (a recorded blocker if missing).

**Success Criteria:** S16

**Verification Impact:**

- V16.1 rc dry run (four smoke outputs, prerelease assets); V16.2 gating definition.
