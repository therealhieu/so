# W261005F2A7: git-integration — System Design

**Design Status:** Finalized System Design

**Context Source:** `w261005f2a7-discuss-context.md`

**Requirements Source:** `w261005f2a7-requirements.md`

**Research Source:** `w261005f2a7-research.md`

**Current Requirement Revisions:** `W261005F2A7-REQ1@R2`, `W261005F2A7-REQ2@R2`, `W261005F2A7-REQ3@R1`, `W261005F2A7-REQ4@R2`, `W261005F2A7-REQ5@R2`, `W261005F2A7-REQ6@R2`, `W261005F2A7-REQ7@R2`, `W261005F2A7-REQ8@R1`, `W261005F2A7-REQ9@R1`

**Research Reconciliation:** `w261005f2a7-requirements.md` §6 Research Impact Review (28 relationships, approved by the user on 2026-10-05)

**Unresolved Items:** None

**Design Approval:** The user delegated the system-design decisions to self-drive on 2026-10-05. Every decision in §9 was made under that delegation.

**Design Boundary:** This artifact is authoritative for whole-system architecture and technical design, including UI/frontend applications, routes, modules, components, state ownership, contracts, files, symbols, boundaries, wiring, and verification when material. UI/UX look and feel, visual composition, concrete interaction treatment, responsive presentation, accessibility realization, mockups, and accepted UI-design authority belong to `s1mple-discuss-ui`.

**Finalized System Design Checklist:**

- [x] Every current qualified requirement revision has exactly one valid system-design coverage outcome: `System design required`, `No system design change`, or `No system design applicable`.
- [x] Every `System design required` outcome has the full `REQ → DES → S → V` chain.
- [x] Every `No system design change` outcome cites the existing system mechanism, exact current source, and existing verification evidence. (None used.)
- [x] Every `No system design applicable` outcome explains why the requirement creates no system architecture or technical-design obligation and omits invented `DES`, `S`, and `V` records. (None used.)
- [x] For roadmap-linked work, the accepted baseline has been checked against current parent definitions, every assigned parent obligation has valid child coverage, and gates due before design approval have evidence. (Not applicable — standalone work.)
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
   - [W261005F2A7-DES1: Git state lives in core, Git processes in one workspace adapter](#w261005f2a7-des1-git-state-lives-in-core-git-processes-in-one-workspace-adapter)
   - [W261005F2A7-DES2: Hunks come from an in-repo bounded Myers diff on normalized lines](#w261005f2a7-des2-hunks-come-from-an-in-repo-bounded-myers-diff-on-normalized-lines)
   - [W261005F2A7-DES3: Index entries are read with ls-files and cat-file, then normalized](#w261005f2a7-des3-index-entries-are-read-with-ls-files-and-cat-file-then-normalized)
   - [W261005F2A7-DES4: Stage hunk is a save-gated, oid-guarded serial effect](#w261005f2a7-des4-stage-hunk-is-a-save-gated-oid-guarded-serial-effect)
   - [W261005F2A7-DES5: Reset hunk is one applyBufferEdits step](#w261005f2a7-des5-reset-hunk-is-one-applybufferedits-step)
   - [W261005F2A7-DES6: Refresh is one coalesced status read plus per-buffer index checks](#w261005f2a7-des6-refresh-is-one-coalesced-status-read-plus-per-buffer-index-checks)
   - [W261005F2A7-DES7: A separate git-dir watcher retargets on branch changes](#w261005f2a7-des7-a-separate-git-dir-watcher-retargets-on-branch-changes)
   - [W261005F2A7-DES8: Discovery and the version gate run after the first frame](#w261005f2a7-des8-discovery-and-the-version-gate-run-after-the-first-frame)
   - [W261005F2A7-DES9: The tool hand-off is a save-gated effect run by a suspend-aware shell](#w261005f2a7-des9-the-tool-hand-off-is-a-save-gated-effect-run-by-a-suspend-aware-shell)
   - [W261005F2A7-DES10: Display is derived per frame from git state](#w261005f2a7-des10-display-is-derived-per-frame-from-git-state)
   - [W261005F2A7-DES11: Commands, keys, preview overlay, blame, and config](#w261005f2a7-des11-commands-keys-preview-overlay-blame-and-config)

# 1. Design Goals, Constraints, and Requirement Coverage

## Goals

- Keep every Git decision pure in `src/core`, and run every Git process from one injectable adapter in `src/workspace`, so the one-way `action → update → effect` protocol is unchanged (REQ1–REQ9).
- Make live hunks cheap and bounded: debounced, normalized, and capped so typing stays within the keystroke budget (REQ5).
- Make the two Git writes safe: stage never lands at a wrong position, and reset is an ordinary undoable edit (REQ1, REQ9).
- Hand the terminal to the Git tool and get it back intact: no mouse leak, no Ctrl-C shutdown, no stale buffers (REQ2, REQ3, REQ8).
- Keep repo-wide state fresh without polling, and never write the index (REQ6, REQ7).

## Requirement Coverage

- `W261005F2A7-REQ1@R2` — Native Git writes are limited to stage hunk and reset hunk, with intent-to-add, conflict refusal, an oid guard, EOL form, and EOF newline handling.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005F2A7-DES1`, `W261005F2A7-DES4`, `W261005F2A7-DES5`
  - **How Addressed:** `stageHunk` saves first, builds a zero-context patch in index form, and runs a serial `gitStage` effect. The effect adds intent-to-add for untracked files, compares the expected index oid, and only then applies. `resetHunk` is one `applyBufferEdits` span plus a `finalNewline` patch. The adapter exposes no other mutating command.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/features/git/patch.ts` — `hunkPatch`; `src/core/state/git.ts` — `stageHunk`, `resetHunk`, `onGitStaged`; `src/workspace/git.ts` — `stage`; `src/app/effects.ts` — `gitStage` case
  - **Callers and Wiring:** `gitCommands` in `src/core/state/git-commands.ts`; `serial` queue in `createEffectRunner`
  - **Runtime Flow:** §5 Stage Hunk; §5 Reset Hunk
  - **Success Criteria:** `S1`, `S2`, `S3`, `S4`, `S5`, `S6`, `S30`
  - **Verification:** `V1`–`V3`, `V10`–`V13`, `V20`–`V23`, `V40`, `V62`
  - **Research Support:** `RF2`, `RF3`, `RF4`, `RF5` evaluated `W261005F2A7-REQ1@R1` and informed `W261005F2A7-REQ1@R2`

- `W261005F2A7-REQ2@R2` — The Git tool runs full screen with so suspended, survives interrupts, resets foreign modes, and refreshes after exit.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005F2A7-DES9`
  - **How Addressed:** A `runTool` effect calls the `ToolHost` built in `main.ts`, which holds interrupts, calls `Shell.suspend()`, spawns the tool with inherited stdio, writes the foreign-mode reset, calls `Shell.resume()`, and dispatches `toolExited`. `onToolExited` emits a refresh and a `read` for every open buffer.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/ui/shell.ts` — `Shell.suspend`, `Shell.resume`, `paint`, `FOREIGN_MODES_RESET`; `src/app/lifecycle.ts` — `holdInterrupts`; `src/app/tool-host.ts` — `createToolHost`; `src/core/state/git.ts` — `openTool`, `onToolExited`
  - **Callers and Wiring:** `main.ts` builds the `ToolHost` from `shell` and `lifecycle` and sets `deps.tool`
  - **Runtime Flow:** §5 Tool Hand-off
  - **Success Criteria:** `S12`, `S13`, `S14`, `S15`, `S31`
  - **Verification:** `V30`–`V33`, `V41`, `V42`, `V50`, `V60`, `V61`
  - **Research Support:** `RF11`, `RF12` evaluated `W261005F2A7-REQ2@R1` and informed `W261005F2A7-REQ2@R2`; `RF10` evaluated `W261005F2A7-REQ2@R1` and supported the retained shape

- `W261005F2A7-REQ3@R1` — The `git.tool` argv is configurable, with a notice when it is missing or there is no repository.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005F2A7-DES9`, `W261005F2A7-DES11`
  - **How Addressed:** `ConfigSchema.git.tool` is a non-empty string array. `openTool` refuses with "not a git repository" when `git.repo` is absent. `ToolHost.run` resolves `argv[0]` with `which` before suspending and reports `missing`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/config/schema.ts` — `git`; `src/core/state/git.ts` — `openTool`, `onToolExited`; `src/app/tool-host.ts` — `run`
  - **Callers and Wiring:** `toml.ts` reports schema errors with line numbers (existing)
  - **Runtime Flow:** §5 Tool Hand-off
  - **Success Criteria:** `S16`, `S17`
  - **Verification:** `V34`, `V35`, `V43`
  - **Research Support:** `RF8` evaluated and retained `W261005F2A7-REQ3@R1`; the `RF10` consideration was deferred

- `W261005F2A7-REQ4@R2` — Native display: six sign types, navigation, preview, stage and reset, the statusline segment, explorer markers, and blame.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005F2A7-DES10`, `W261005F2A7-DES11`
  - **How Addressed:** `hunkSigns` is a decoration provider built per frame from `git.files`. `statusSegments` adds `git`. Explorer rows read the `explorerMarkers` derivation. The `gitHunk` overlay shows preview. Navigation commands move to hunk starts. `blameLine` emits a `gitBlame` effect, or answers "not committed yet" in core when there is no base.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/features/git/signs.ts`; `src/core/features/git/status.ts` — `explorerMarkers`; `src/core/state/status.ts` — `statusSegments`; `src/core/kernel/view/text-view.ts` — `layoutText`; `src/ui/editors/text-view.ts` — `layoutFrame`; `src/ui/views/statusline.ts`; `src/ui/views/explorer.ts`; `src/ui/overlays/hunk.ts`
  - **Callers and Wiring:** `EditorView.layoutFrame` provider list; `OverlayHost` view list in `shell.ts`
  - **Runtime Flow:** §5 Live Hunks; §5 Blame
  - **Success Criteria:** `S7`, `S8`, `S9`, `S10`, `S11`
  - **Verification:** `V4`–`V9`, `V14`–`V17`, `V24`, `V44`–`V47`
  - **Research Support:** `RF1`, `RF8`, `RF9`, `RF13` evaluated `W261005F2A7-REQ4@R1` and informed `W261005F2A7-REQ4@R2`; `RF6` evaluated it with no impact

- `W261005F2A7-REQ5@R2` — Live buffer against index, normalized, bounded, debounced, with an untracked sign.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005F2A7-DES2`, `W261005F2A7-DES3`
  - **How Addressed:** `normalizeIndexText` puts the blob in the buffer's LF, BOM-free, final-newline-split form. `diffLines` trims, then runs Myers with an edit cap that falls back to one change hunk. The root update wrapper starts a `gitDiff:<id>` timer (100 ms) when a buffer's text version changes.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/features/git/diff.ts` — `diffLines`; `src/core/features/git/index-text.ts` — `normalizeIndexText`; `src/core/state/update.ts` — wrapper; `src/core/state/git.ts` — `onGitDiffTimer`
  - **Callers and Wiring:** `onTimerAction` routes `gitDiff:` ids
  - **Runtime Flow:** §5 Live Hunks
  - **Success Criteria:** `S7`, `S18`, `S19`
  - **Verification:** `V1`–`V6`, `V18`, `V25`, `V51`
  - **Research Support:** `RF1`, `RF2`, `RF4`, `RF14` evaluated `W261005F2A7-REQ5@R1` and informed `W261005F2A7-REQ5@R2`

- `W261005F2A7-REQ6@R2` — Event-driven, coalesced, lock-free refresh with a narrow git-dir watch and fallback to the other triggers.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005F2A7-DES6`, `W261005F2A7-DES7`
  - **How Addressed:** Every trigger restarts the `gitRefresh` timer (200 ms). On expiry, core emits one `gitStatus` effect. The adapter's base argv always carries `--no-optional-locks`. `watchGitDirs` watches first-level entries of the git dir, common dir, and branch ref dir, drops `*.lock` and `.watchman-cookie*`, and is retargeted by a `gitWatch` effect when the branch changes. A watcher start failure is logged and ignored.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/git.ts` — `requestRefresh`, `onGitStatus`; `src/workspace/git.ts` — `baseArgv`, `status`; `src/workspace/git-watcher.ts` — `watchGitDirs`; `src/app/effects.ts` — `gitStatus`, `gitWatch` cases
  - **Callers and Wiring:** `main.ts` starts the watcher after `gitDetected`; `onSaved`, `onFileChanged`, `onGitStaged`, and `onToolExited` call `requestRefresh`
  - **Runtime Flow:** §5 Refresh
  - **Success Criteria:** `S20`, `S21`, `S22`, `S23`
  - **Verification:** `V19`, `V26`, `V27`, `V36`–`V38`
  - **Research Support:** `RF6`, `RF7` evaluated `W261005F2A7-REQ6@R1` and informed `W261005F2A7-REQ6@R2`; `RF9` supported it; `RF3` had no impact

- `W261005F2A7-REQ7@R2` — Any layout inside one repository, linked worktrees, no-commit repositories, Git ≥ 2.31, and silence without Git.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005F2A7-DES8`, `W261005F2A7-DES6`
  - **How Addressed:** `detectRepo` runs `git --version` (gate at 2.31), then one `rev-parse --path-format=absolute --show-toplevel --git-dir --git-common-dir --show-prefix`, then `symbolic-ref -q HEAD` for unborn branches. Status runs with pathspec `-- <prefix>` and converts repo-relative paths to workspace-relative ones.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/workspace/git.ts` — `detectRepo`, `parseVersion`; `src/core/features/git/status.ts` — `parseStatus`; `src/core/state/git.ts` — `onGitDetected`
  - **Callers and Wiring:** `main.ts` deferred startup block
  - **Runtime Flow:** §5 Discovery
  - **Success Criteria:** `S24`, `S25`, `S26`
  - **Verification:** `V14`, `V28`, `V29`, `V39`
  - **Research Support:** `RF7`, `RF8` evaluated `W261005F2A7-REQ7@R1` and informed `W261005F2A7-REQ7@R2`; `RF9` supported it

- `W261005F2A7-REQ8@R1` — Dirty buffers are saved before the tool opens; a failed save cancels the launch.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005F2A7-DES9`
  - **How Addressed:** `openTool` sets `git.pending = { op: "tool", waiting }` and emits `writeBuffer` for each dirty buffer. `onSaved` advances the pending operation and `onSaveFailed` cancels it with a notice, mirroring `advanceQuit` (`src/core/state/save.ts:165-191`). A dirty buffer that cannot be written (`blocked`: in a conflict, or dirty and deleted on disk; read-only buffers cannot become dirty) cancels up front.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/git.ts` — `openTool`, `advanceGitPending`, `cancelGitPending`; `src/core/state/save.ts` — `onSaved`, `onSaveFailed`, `blocked` export
  - **Callers and Wiring:** `onSaved` / `onSaveFailed` call into `git.ts`
  - **Runtime Flow:** §5 Tool Hand-off
  - **Success Criteria:** `S27`, `S28`
  - **Verification:** `V31`, `V32`
  - **Research Support:** `RF10` evaluated and retained `W261005F2A7-REQ8@R1`

- `W261005F2A7-REQ9@R1` — Stage hunk saves the buffer first; a failed save stages nothing.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005F2A7-DES4`
  - **How Addressed:** `stageHunk` uses the same pending mechanism with `{ op: "stage", bufferId, line }`. The patch is computed from the saved text after `saved` arrives.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/git.ts` — `stageHunk`, `advanceGitPending`
  - **Callers and Wiring:** Same as REQ8
  - **Runtime Flow:** §5 Stage Hunk
  - **Success Criteria:** `S29`
  - **Verification:** `V20`, `V40`
  - **Research Support:** `RF2`, `RF3` evaluated and retained `W261005F2A7-REQ9@R1`

## Assigned Parent Obligation Coverage

None — standalone work

## Binding Constraints

- `.s1mple/docs/project.md` Boundaries; `test/boundaries.test.ts:16-42` — the rules for each layer:
  - New `src/core/features/git/*` and `src/core/state/git*.ts` import only core.
  - `src/workspace/git*.ts` import only workspace and core.
  - `src/app/tool-host.ts` imports no UI package; it receives the shell through an interface.
- `src/core/state/update.ts:128-217` — `update` stays pure and synchronous. Git results enter only as actions, and timers are runner-owned (`src/app/effects.ts:117-134`).
- `src/app/main.ts:361-390` — no Git process runs before the first frame.
- `src/workspace/system.ts:85-99`, `src/workspace/trash.ts:11-18` — argv spawning with no shell and an injectable spawn for tests.
- `src/core/config/schema.ts:46-105` — the strict schema gets one `git` section with defaults (`prefault({})`).
- `.s1mple/docs/project.md` Pins and `knip` zero findings — no new npm dependency; every new export has a consumer.
- `src/core/kernel/view/text-view.ts:98-101` — the last provider with a sign wins. Git signs are appended last, so they win over the transient `▕` reveal and `⚠` error signs (`src/core/lang/markdown/live-preview.ts:86-141`).
- `.s1mple/S1MPLE.md` Implementation — no work-process identifiers in code, comments, tests, or logs.

## Cross-Cutting Applicability

| Concern | Applicability | Design Location or Reason |
|---|---|---|
| Security and privacy | Applicable | The adapter spawns argv with no shell, and paths go after `--` with `--literal-pathspecs`. The patch and blame contents go through stdin, never argv (§7 `src/workspace/git.ts`). The tool argv comes from user config only. Checked by `V62`. |
| Configuration | Applicable | `git.tool` in `src/core/config/schema.ts` (§7). `V43` covers a valid value, `[]`, and a non-string. |
| Observability | Applicable | The adapter logs `git.fail` with argv[1..2], exit code, and the first stderr line through the existing `Logger`. `ToolHost` logs `git.tool.exit` with the code and signal. No buffer text is logged. Checked by `V39`. |
| Performance and scalability | Applicable | The diff is debounced (100 ms) and capped (`MAX_EDIT = 2000`). Status is scoped to `-- <prefix>` and coalesced (200 ms). Index reads happen only for open buffers whose oid changed. One new bench, `gitDiffKeystrokeP95`, joins the gate (§7 `scripts/bench-gate.ts`). Checked by `V18`, `V51`. |
| Concurrency | Applicable | Stage runs on the runner's `serial` queue after pending writes. The oid guard covers index changes made by other tools. At most one pending Git operation exists at a time, and a new request while one is pending is refused with a notice. Covered by `V12`, `V21`. |
| Retry and idempotency | Applicable | No automatic retry. A stale oid triggers a refresh and a notice, and the user re-stages. Refresh is idempotent: the latest status wins. Covered by `V12`. |
| Migration and rollout | None | None — new optional feature. It is inactive outside a repository, the new config section defaults, and no persisted data changes. |

## Focused Code Surface

- **Existing:** `src/core/state/types.ts` — `AppState`, `Action`, `Effect`, `TimerId`, `Overlay` — new git members. Traces to `W261005F2A7-DES1`
- **Existing:** `src/core/state/update.ts` — `createUpdate` switch, wrapper, `onTimerAction` — new cases, diff timer hook. Traces to `W261005F2A7-DES1`, `W261005F2A7-DES2`
- **Existing:** `src/core/state/save.ts` — `onSaved`, `onSaveFailed`, `blocked` — the git pending operation. Traces to `W261005F2A7-DES4`, `W261005F2A7-DES9`
- **Existing:** `src/ui/shell.ts` — `Shell`, `paint` — suspend and resume, plus the paint guard. Traces to `W261005F2A7-DES9`
- **Existing:** `src/app/lifecycle.ts` — signal handlers — interrupt hold. Traces to `W261005F2A7-DES9`
- **Existing:** `src/core/kernel/view/text-view.ts` — `layoutText` block-replace row — sign inheritance. Traces to `W261005F2A7-DES10`
- **Proposed:** `src/core/features/git/` — diff, patch, index text, status parse, blame parse, signs. Traces to `W261005F2A7-DES2`, `W261005F2A7-DES3`, `W261005F2A7-DES10`
- **Proposed:** `src/core/state/git.ts`, `git-commands.ts` — reducers and commands. Traces to `W261005F2A7-DES4`, `W261005F2A7-DES5`, `W261005F2A7-DES6`, `W261005F2A7-DES9`, `W261005F2A7-DES11`
- **Proposed:** `src/workspace/git.ts`, `git-watcher.ts`; `src/app/tool-host.ts`; `src/ui/overlays/hunk.ts`. Traces to `W261005F2A7-DES1`, `W261005F2A7-DES7`, `W261005F2A7-DES9`, `W261005F2A7-DES11`

# 2. System Context and Architecture

## System Context

```text
             ┌──────────────────────────── so process ────────────────────────────┐
 user keys ─►│ src/ui (OpenTUI) ─► store ─► core update ─► effects ─► src/app runner │
             │      ▲ paint                                   │                     │
             │      └──────────── state ◄── actions ◄─────────┤                     │
             │                                               ▼                     │
             │                           src/workspace/git.ts (Bun.spawn argv)      │
             │                           src/workspace/git-watcher.ts (fs.watch)    │
             └──────────────┬───────────────────────┬──────────────────┬───────────┘
                            ▼                       ▼                  ▼
                     git ≥ 2.31 CLI          <gitdir>, <commondir>   git.tool (lazygit)
                 (read: status, ls-files,     HEAD/index/refs          full screen, inherited
                  cat-file, blame;            first-level events       stdio, so suspended
                  write: add -N, apply --cached)
```

## Proposed Architecture

```text
src/core/features/git/        pure algorithms, no state
  diff.ts        diffLines(old, new) → Hunk[]          (bounded Myers)
  index-text.ts  normalizeIndexText(bytes, eol) → IndexText
  patch.ts       hunkPatch(path, mode, hunk, index, buf) → string
  status.ts      parseStatus(z, prefix) → RepoStatus;  explorerMarkers(status) → Map
  blame.ts       parseBlame(porcelain) → BlameLine
  signs.ts       hunkSigns(hunks) → DecorationProvider; hunkAt / nextHunk / prevHunk

src/core/state/
  git.ts          GitState reducers: onGitDetected, onGitStatus, onGitIndexRead,
                  onGitDiffTimer, requestRefresh, stageHunk, resetHunk, openTool,
                  advanceGitPending, cancelGitPending, onGitStaged, onToolExited, onGitBlamed
  git-commands.ts gitCommands, gitBindings, gitGroups
  types.ts        AppState.git, Action/Effect/TimerId/Overlay members
  update.ts       switch cases, text-version → gitDiff timer hook, gitRefresh timer routing
  status.ts       StatusSegments.git

src/workspace/
  git.ts          createGit(spawn, logger) → Git { detect, status, readIndex, stage, blame }
  git-watcher.ts  watchGitDirs(dirs, onChange) → { retarget, stop }

src/app/
  effects.ts      git* effect cases (stage on serial), runTool → deps.tool
  tool-host.ts    createToolHost({ shell, lifecycle, spawn, which, stdout }) → ToolHost
  main.ts         construct git, tool host; deferred detect → gitDetected → watcher
  lifecycle.ts    holdInterrupts()

src/ui/
  shell.ts        Shell.suspend/resume, paint guard, FOREIGN_MODES_RESET
  editors/text-view.ts  append hunkSigns provider
  views/statusline.ts, views/explorer.ts   git segment, markers
  overlays/hunk.ts      HunkView (gitHunk overlay)
  theme.ts        git* style tokens
```

Core owns every decision: which hunk to stage, when to refresh, when the tool may start, what the statusline says. The workspace adapter owns every byte that crosses the Git CLI boundary, and the app owns timing, the terminal hand-off, and process signals. The main tradeoff is a new runner dependency (`tool`) that reaches the UI shell through an interface built in `main.ts`, rather than letting the runner touch the renderer. That keeps `src/app` free of UI imports (`test/boundaries.test.ts:16`).

# 3. Components and Boundaries

## Git algorithms (core)

- **Target:** `src/core/features/git/`
- **Kind:** Pure function modules
- **Responsibilities:**
  - Compute hunks from two line arrays with bounded cost.
  - Normalize index bytes to the buffer's line model.
  - Build a zero-context patch for one hunk in the index's EOL form.
  - Parse porcelain v2 status and porcelain blame.
  - Produce gutter sign decorations and hunk navigation targets.
- **Collaborators:**

  ```text
  src/core/state/git.ts → diffLines, normalizeIndexText, hunkPatch, parseStatus, parseBlame
  src/ui/editors/text-view.ts → hunkSigns
  src/workspace/git.ts → parseStatus, parseBlame, normalizeIndexText
  ```

- **Boundary Contract:** §6 `Hunk`, `IndexText`, `RepoStatus`, `BlameLine`
- **Detailed Design:** §7 `src/core/features/git/*.ts`
- **Must Not Own:**
  - State transitions, timers, or I/O.

## Git state reducers (core)

- **Target:** `src/core/state/git.ts`, `src/core/state/git-commands.ts`
- **Kind:** Reducer module and command registry entries
- **Responsibilities:**
  - Own `AppState.git` and every transition on it.
  - Gate stage and tool launch on saves (pending operation).
  - Emit `gitStatus`, `gitReadIndex`, `gitStage`, `gitBlame`, `gitWatch`, and `runTool` effects.
  - Turn results into notices (`message()`, `src/core/state/result.ts:12-21`).
- **Collaborators:**

  ```text
  createUpdate switch → onGitDetected | onGitStatus | onGitIndexRead | onGitStaged | onToolExited | onGitBlamed
  onSaved / onSaveFailed → advanceGitPending / cancelGitPending
  gitCommands → stageHunk | resetHunk | openTool | nextHunk | prevHunk | previewHunk | blameLine
  ```

- **Boundary Contract:** §6 `GitState`, git `Action`/`Effect` members
- **Detailed Design:** §7 `src/core/state/git.ts`, `git-commands.ts`
- **Must Not Own:**
  - Process spawning, terminal control, or file watching.

## Git adapter (workspace)

- **Target:** `src/workspace/git.ts`
- **Kind:** Adapter with an injectable spawn
- **Responsibilities:**
  - Build every Git argv with the lock-free base options.
  - Run discovery, status, index reads, stage, and blame, and return typed results.
  - Never run any other mutating Git command.
- **Collaborators:**

  ```text
  createEffectRunner(git) → git.status | git.readIndex | git.stage | git.blame
  main.ts deferred block → git.detect
  ```

- **Boundary Contract:** §6 `Git`
- **Detailed Design:** §7 `src/workspace/git.ts`
- **Must Not Own:**
  - Decisions about when to refresh or what to stage.

## Git-dir watcher (workspace)

- **Target:** `src/workspace/git-watcher.ts`
- **Kind:** Adapter
- **Responsibilities:**
  - Watch first-level entries of a set of directories, without recursion.
  - Drop lock and cookie names, and call `onChange` once per event.
  - Retarget when the set changes, and survive start failures.
- **Collaborators:**

  ```text
  main.ts → watchGitDirs(dirs, () => store.dispatch({ type: "gitDirChanged" }))
  effects.ts gitWatch → watcher.retarget(dirs)
  ```

- **Boundary Contract:** §6 `GitWatcher`
- **Detailed Design:** §7 `src/workspace/git-watcher.ts`
- **Must Not Own:**
  - Debounce. Coalescing is the core `gitRefresh` timer.

## Tool host (app) and suspend-aware shell (ui)

- **Target:** `src/app/tool-host.ts`, `src/ui/shell.ts`, `src/app/lifecycle.ts`
- **Kind:** Composition-level service plus UI shell extension
- **Responsibilities:**
  - Resolve the tool executable, and refuse before suspending if it is missing.
  - Hold interrupts, suspend, spawn with inherited stdio at the repo top level, and await exit or signal.
  - Reset foreign terminal modes, resume, and release interrupts in a `finally`.
  - Stop painting while suspended.
- **Collaborators:**

  ```text
  effects.ts runTool → deps.tool.run(argv, cwd) → { kind: "exited" | "missing" | "failed" }
  ToolHost → lifecycle.holdInterrupts() · shell.suspend() · spawn · shell.resume()
  ```

- **Boundary Contract:** §6 `ToolHost`, `Shell` extension
- **Detailed Design:** §7 `src/app/tool-host.ts`, `src/ui/shell.ts`, `src/app/lifecycle.ts`
- **Must Not Own:**
  - Saving buffers (core gates that) or refreshing (core reacts to `toolExited`).

## Display surfaces (ui)

- **Target:** `src/ui/editors/text-view.ts`, `src/ui/views/statusline.ts`, `src/ui/views/explorer.ts`, `src/ui/overlays/hunk.ts`, `src/ui/theme.ts`
- **Kind:** Views
- **Responsibilities:**
  - Paint git-derived data: signs, segment, markers, hunk popup.
- **Collaborators:**

  ```text
  layoutFrame → hunkSigns(s.git.files[b.path]?.hunks)
  statusline → statusSegments(s).git
  explorer → explorerMarkers(s.git.status)
  OverlayHost → HunkView when overlay.kind === "gitHunk"
  ```

- **Boundary Contract:** §6 `StatusSegments.git`, `Overlay` `gitHunk`
- **Detailed Design:** §7 UI files
- **Must Not Own:**
  - Hunk computation or Git calls.

# 4. Project Structure Changes

**Proposed Structure — not an actual Git diff.**

**Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── src/
│   ├── core/
│   │   ├── features/git/
│   │   │   ├── [A] diff.ts            Contains: bounded Myers line diff → hunks
│   │   │   │                          Symbols: Hunk, HunkKind, diffLines, MAX_EDIT
│   │   │   │                          Decisions: DES2
│   │   │   ├── [A] index-text.ts      Contains: index blob normalization
│   │   │   │                          Symbols: IndexText, normalizeIndexText
│   │   │   │                          Decisions: DES3
│   │   │   ├── [A] patch.ts           Contains: zero-context patch for one hunk
│   │   │   │                          Symbols: hunkPatch
│   │   │   │                          Decisions: DES4
│   │   │   ├── [A] status.ts          Contains: porcelain v2 parse, marker derivation
│   │   │   │                          Symbols: RepoStatus, FileStatus, parseStatus, explorerMarkers
│   │   │   │                          Decisions: DES6, DES10
│   │   │   ├── [A] blame.ts           Contains: porcelain blame parse, not-committed detection
│   │   │   │                          Symbols: BlameLine, parseBlame
│   │   │   │                          Decisions: DES11
│   │   │   ├── [A] signs.ts           Contains: sign provider, hunk lookup and navigation
│   │   │   │                          Symbols: hunkSigns, hunkAt, nextHunkLine, prevHunkLine, GIT_SIGNS
│   │   │   │                          Decisions: DES10
│   │   │   └── [A] *.test.ts          Contains: unit suites (§8)
│   │   ├── kernel/view/
│   │   │   ├── [M] text-view.ts       Contains: block-replace row inherits a line sign in its range
│   │   │   │                          Symbols: layoutText
│   │   │   │                          Decisions: DES10
│   │   │   └── [M] text-view.test.ts  Contains: V9
│   │   ├── config/
│   │   │   ├── [M] schema.ts          Contains: git section
│   │   │   │                          Symbols: ConfigSchema.git
│   │   │   │                          Decisions: DES11
│   │   │   └── [M] schema.test.ts     Contains: V43
│   │   └── state/
│   │       ├── [A] git.ts             Contains: GitState reducers and pending gate
│   │       │                          Symbols: initialGit, onGitDetected, onGitStatus, onGitIndexRead,
│   │       │                                   onGitDiffTimer, requestRefresh, stageHunk, resetHunk,
│   │       │                                   openTool, advanceGitPending, cancelGitPending,
│   │       │                                   onGitStaged, onToolExited, onGitBlamed, onGitRefreshTimer
│   │       │                          Decisions: DES1, DES4, DES5, DES6, DES9
│   │       ├── [A] git-commands.ts    Contains: commands, default bindings, group
│   │       │                          Symbols: gitCommands, gitBindings, gitGroups
│   │       │                          Decisions: DES11
│   │       ├── [A] git.test.ts        Contains: reducer suites (§8)
│   │       ├── [M] types.ts           Contains: AppState.git, Action/Effect/TimerId/Overlay members
│   │       │                          Symbols: GitState, AppState, Action, Effect, TimerId, Overlay
│   │       │                          Decisions: DES1
│   │       ├── [M] update.ts          Contains: switch cases, diff timer hook, timer routing
│   │       │                          Symbols: createUpdate, onTimerAction
│   │       │                          Decisions: DES1, DES2, DES6
│   │       ├── [M] save.ts            Contains: pending git op advance/cancel; export blocked
│   │       │                          Symbols: onSaved, onSaveFailed, blocked
│   │       │                          Decisions: DES4, DES9
│   │       ├── [M] disk.ts            Contains: fileChanged requests refresh
│   │       │                          Symbols: onFileChanged
│   │       │                          Decisions: DES6
│   │       ├── [M] status.ts          Contains: git segment
│   │       │                          Symbols: StatusSegments, statusSegments
│   │       │                          Decisions: DES10
│   │       ├── [M] keys.ts            Contains: gitHunk overlay key route (Esc/q close)
│   │       │                          Symbols: routeKey
│   │       │                          Decisions: DES11
│   │       ├── [M] mouse.ts           Contains: gitHunk overlay gate (click outside closes)
│   │       │                          Symbols: pressStops, overlayGate
│   │       │                          Decisions: DES11
│   │       └── [M] init.ts            Contains: git: initialGit in initialState
│   │                                  Symbols: initialState
│   │                                  Decisions: DES1
│   ├── workspace/
│   │   ├── [A] git.ts                 Contains: Git adapter
│   │   │                              Symbols: Git, createGit, GitSpawn, parseVersion, MIN_GIT
│   │   │                              Decisions: DES1, DES3, DES4, DES6, DES8, DES11
│   │   ├── [A] git.test.ts            Contains: adapter suites with real git in tmp repos
│   │   ├── [A] git-watcher.ts         Contains: first-level multi-dir watcher
│   │   │                              Symbols: GitWatcher, watchGitDirs, IGNORED_NAME
│   │   │                              Decisions: DES7
│   │   └── [A] git-watcher.test.ts
│   ├── app/
│   │   ├── [A] tool-host.ts           Contains: suspend/spawn/resume orchestration
│   │   │                              Symbols: ToolHost, ToolResult, createToolHost
│   │   │                              Decisions: DES9
│   │   ├── [A] tool-host.test.ts
│   │   ├── [M] effects.ts             Contains: git effect cases; deps git, tool, gitWatcher
│   │   │                              Symbols: RunnerDeps, createEffectRunner
│   │   │                              Decisions: DES1, DES4, DES6, DES7, DES9
│   │   ├── [M] effects.test.ts        Contains: V40, V41
│   │   ├── [M] lifecycle.ts           Contains: interrupt hold
│   │   │                              Symbols: installLifecycle (returns holdInterrupts)
│   │   │                              Decisions: DES9
│   │   ├── [M] lifecycle.test.ts      Contains: V42
│   │   └── [M] main.ts                Contains: registries + construction + deferred detect/watch
│   │                                  Symbols: registries, main startup block
│   │                                  Decisions: DES8, DES9, DES11
│   └── ui/
│       ├── [M] shell.ts               Contains: suspend/resume, paint guard, HunkView registration
│       │                              Symbols: Shell, createShell, FOREIGN_MODES_RESET
│       │                              Decisions: DES9, DES11
│       ├── [M] editors/text-view.ts   Contains: hunkSigns provider appended last
│       │                              Symbols: EditorView.layoutFrame
│       │                              Decisions: DES10
│       ├── [M] views/statusline.ts    Contains: git segment, first optional dropped
│       │                              Decisions: DES10
│       ├── [M] views/explorer.ts      Contains: marker after name
│       │                              Decisions: DES10
│       ├── [A] overlays/hunk.ts       Contains: hunk preview float
│       │                              Symbols: HunkView
│       │                              Decisions: DES11
│       └── [M] theme.ts               Contains: gitAdd, gitChange, gitDelete, gitTopDelete,
│                                                gitChangeDelete, gitUntracked, gitConflict, gitBranch tokens
│                                      Decisions: DES10
├── test/
│   ├── support/[M] state.ts           Contains: testRegistries adds git commands/bindings/groups
│   ├── support/[A] git-repo.ts        Contains: gitRepo(files, opts) temp repo helper (isolated config)
│   ├── integration/[A] git.test.ts    Contains: V36–V39 real runner + real git
│   ├── ui/[A] git.test.ts             Contains: V44–V47 mounted shell snapshots
│   ├── e2e/[A] git-tool.test.ts       Contains: V50 PTY hand-off with a stub tool
│   └── bench/[A] git-diff.bench.ts    Contains: V51 keystroke P95 with a 5,000-line all-changed note
├── scripts/[M] bench-gate.ts          Contains: gitDiffKeystrokeP95 target 24 ms
└── .s1mple/docs/[M] project.md        Contains: git config key, git module map, min Git 2.31
```

# 5. Runtime Flows and Error Policies

## Discovery

**Participating Symbols:** `createGit().detect`, `parseVersion`, `MIN_GIT`, `onGitDetected`, `watchGitDirs`, `Effect gitWatch`

**Illustrative Flow:**

```text
first frame → setImmediate → git.detect(root)
  ├─ which git = null ──────────────────────► gitDetected { repo: null }                  (silent)
  ├─ git --version < 2.31 ──────────────────► gitDetected { repo: null, notice: "git 2.20 is older than 2.31; git features off" }
  ├─ rev-parse fails (not a repo) ──────────► gitDetected { repo: null }                  (silent)
  └─ ok → { top, gitDir, commonDir, prefix, head } ► gitDetected { repo }
          onGitDetected → state.git.repo = repo → effects [gitWatch(dirs), requestRefresh]
          main: on first gitWatch the runner calls watchGitDirs
```

1. `main.ts` calls `git.detect(ws.root)` inside the deferred block (`src/app/main.ts:361-390`) and dispatches `gitDetected`.
2. `onGitDetected` stores `repo`, shows a notice when one is present, emits `gitWatch` with `watchDirs(repo, head)`, and starts the refresh timer.

**Detailed Control Flow:** §7 `src/workspace/git.ts` `detect`; §7 `src/core/state/git.ts` `onGitDetected`

## Live Hunks

**Participating Symbols:** `createUpdate` wrapper, `TimerId gitDiff:${BufferId}`, `onGitDiffTimer`, `diffLines`, `Effect gitReadIndex`, `onGitIndexRead`, `normalizeIndexText`

**Illustrative Flow:**

```text
buffer opened / index changed → gitReadIndex { bufferId, path } → git.readIndex
   → gitIndexRead { path, entry: { oid, mode, untracked, conflicted, eol, text: IndexText } | { ignored } }
   → onGitIndexRead → files[path].index = entry → diff now
keystroke → update → wrapper sees text.version changed → startTimer gitDiff:<id> 100 ms
   → timer → onGitDiffTimer → files[path].hunks = diffLines(index.lines, bufferLines)
frame → layoutFrame → hunkSigns(files[path].hunks)
```

1. When a buffer is loaded (`fileLoaded`) in a repo, or when status shows its path changed in the index, core emits `gitReadIndex`.
2. The wrapper compares `prev.buffers[id].text.version` with `next.buffers[id].text.version` and emits one `startTimer` for each changed buffer.
3. `onGitDiffTimer` runs the diff synchronously in core. It is bounded by `MAX_EDIT`.

**Detailed Control Flow:** §7 `src/core/features/git/diff.ts`; §7 `src/core/state/update.ts`

## Refresh

**Participating Symbols:** `requestRefresh`, `TimerId gitRefresh`, `onGitRefreshTimer`, `Effect gitStatus`, `git.status`, `parseStatus`, `onGitStatus`

**Illustrative Flow:**

```text
saved | fileChanged | gitStaged | toolExited | gitDirChanged | gitDetected
  → requestRefresh(s) → startTimer gitRefresh 200 ms   (same id → trailing coalesce)
  → timer → gitStatus { prefix } → git --no-optional-locks status --porcelain=v2 -z --branch -uall -- <prefix>
  → gitStatus action { status } → onGitStatus:
       state.git.status = status
       head changed? → gitWatch(dirs)
       for open buffer paths whose index may have changed → gitReadIndex
```

1. `onGitStatus` compares the previous and new entry for each open buffer's path. When the index-side XY or the `hI` hash differs, or the entry appears or disappears, it emits `gitReadIndex`. On `toolExited` and on `gitDirChanged` with an `index` change, every open buffer is re-read, because `ls-files` is the source of truth for the oid.
2. A refresh result that arrives after `repo` became `null` is dropped.

**Detailed Control Flow:** §7 `src/core/state/git.ts` `onGitStatus`

## Stage Hunk

**Participating Symbols:** `stageHunk`, `GitPending`, `advanceGitPending`, `cancelGitPending`, `hunkAt`, `hunkPatch`, `Effect gitStage`, `git.stage`, `onGitStaged`

**Illustrative Flow:**

```text
<leader>ghs → stageHunk
  ├─ no repo / no hunk at cursor / file conflicted / pending op ─► message, no effect
  ├─ buffer blocked (read-only, deleted, conflict overlay) ─────► message "cannot save <path>"
  ├─ buffer dirty → git.pending = { op: "stage", bufferId, line } → writeBuffer
  │     saved → onSaved → advanceGitPending → continue below
  │     saveFailed → cancelGitPending → message "not staged: <path> could not be saved"
  └─ clean → hunks = diffLines(index.lines, buffer lines)     (fresh, not the debounced copy)
            hunk = hunkAt(hunks, line)
            gitStage { path, expectedOid, intentToAdd: untracked, patch: hunkPatch(...) }   (serial queue)
              adapter: intentToAdd? git add --intent-to-add -- path
                       ls-files -s -- path → oid ≠ expectedOid (and not intent-to-add) → { kind: "stale" }
                       git apply --cached --unidiff-zero --whitespace=nowarn -   (stdin = patch)
            gitStaged { ok | stale | failed(reason) } → onGitStaged → message on non-ok → gitReadIndex + requestRefresh
```

1. The hunk is recomputed at execution time. A stale debounced copy therefore never selects the wrong lines.
2. The oid guard compares against the `IndexText.oid` the diff used. A difference means another writer changed the index, so nothing is applied.

**Detailed Control Flow:** §7 `src/core/state/git.ts` `stageHunk`; §7 `src/workspace/git.ts` `stage`; §7 `src/core/features/git/patch.ts`

## Reset Hunk

**Participating Symbols:** `resetHunk`, `hunkAt`, `applyBufferEdits` (`src/core/state/buffers.ts:182-237`), `setBuffer`

**Illustrative Flow:**

```text
<leader>ghr → resetHunk → hunk = hunkAt(diffLines(index.lines, lines), cursorLine)
   → applyBufferEdits(s, { path, edits: [{ range: newSideRange, expected, text: oldSideText }] })
        stale → message "buffer changed; try again"
   → hunk touches EOF and index.finalNewline ≠ buffer.finalNewline → setBuffer({ finalNewline: index.finalNewline })
   → normal autosave / save path
```

1. The edit is one undo step. The `finalNewline` flag is restored outside undo history, an accepted limitation: `u` restores the lines, not the flag (§9 DES5).

**Detailed Control Flow:** §7 `src/core/state/git.ts` `resetHunk`

## Tool Hand-off

**Participating Symbols:** `openTool`, `GitPending`, `advanceGitPending`, `Effect runTool`, `ToolHost.run`, `Shell.suspend`, `Shell.resume`, `FOREIGN_MODES_RESET`, `holdInterrupts`, `onToolExited`

**Illustrative Flow:**

```text
<leader>gg → openTool
  ├─ no repo ───────────────────────► message "not a git repository"
  ├─ pending op ────────────────────► message "busy"
  ├─ any dirty buffer blocked ──────► message "cannot save <path>; git tool not started"
  ├─ dirty buffers → git.pending = { op: "tool", waiting } → writeBuffer each
  │     all saved → runTool { argv: config.git.tool, cwd: repo.top }
  │     any saveFailed → cancel → message "git tool not started: <path> could not be saved"
  └─ none dirty → runTool
runner → deps.tool.run(argv, cwd):
   which(argv[0]) = null → { kind: "missing" }              (no suspend)
   release = lifecycle.holdInterrupts(); shell.suspend()
   try   child = spawn(argv, { cwd, stdio: inherit }); await child.exited
   finally shell.resetForeignModes(); shell.resume(); release()
   → toolExited { result: exited(code, signal) | missing | failed(reason) }
onToolExited → missing → message "<tool> not found (git.tool)"
             → exited  → requestRefresh + read effect for every open buffer + gitReadIndex for each
```

1. While suspended, `paint` returns early, so watcher events and timers cannot re-enable the mouse. The latest state is painted once on resume.
2. `holdInterrupts` makes the permanent SIGINT handler ignore SIGINT until release. SIGTERM and SIGHUP still shut down. The child shares the terminal and receives them too.
3. Re-reading each open buffer reuses `onDiskLoaded`. It reloads clean buffers and does nothing for unchanged stamps. Buffers are clean after the save gate, so no conflict dialog appears.

**Detailed Control Flow:** §7 `src/app/tool-host.ts`; §7 `src/ui/shell.ts`; §7 `src/core/state/git.ts` `openTool`

## Blame

**Participating Symbols:** `blameLine`, `Effect gitBlame`, `git.blame`, `parseBlame`, `onGitBlamed`

**Illustrative Flow:**

```text
<leader>ghb → blameLine
  ├─ no repo ────────────────────────────► message "not a git repository"
  ├─ untracked / repo.head unborn ───────► message "not committed yet"           (no process)
  └─ gitBlame { path, line, contents: saveText(buffer) } → git blame --porcelain --contents - -L n,+1 -- path
       → gitBlamed { line: BlameLine | failed } → message "<author>, <relative date> · <summary> (<short sha>)"
                                                 or "not committed yet"
```

**Detailed Control Flow:** §7 `src/core/features/git/blame.ts`; §7 `src/core/state/git.ts` `blameLine`

## Failure and Recovery Rules

- **git missing or older than 2.31** — Detected by `git.detect`; represented as `gitDetected { repo: null, notice? }`; handled by leaving all Git UI off. The version case shows one notice.
- **Not a repository** — Detected by `rev-parse` exit ≠ 0; represented as `repo: null`; commands answer "not a git repository".
- **Status/read/blame process failure** — Detected by the adapter (exit ≠ 0); represented as `gitStatus { failed }`, `gitIndexRead { failed }`, or `gitBlamed { failed }`; logged as `git.fail`. The previous state is kept, and the next trigger retries naturally. A blame failure shows a notice.
- **Stale index at stage** — Detected by the adapter oid check; represented as `{ kind: "stale" }`; handled by `gitReadIndex` + refresh + notice "index changed; hunks refreshed". There is no retry.
- **Patch rejected by git apply** — Detected by exit ≠ 0; represented as `{ kind: "failed", reason }`; handled by a notice with the first stderr line, plus a refresh.
- **Save fails before stage or tool** — Detected by `onSaveFailed`; represented by clearing `git.pending`; handled by a notice naming the path.
- **Tool missing** — Detected by `ToolHost.run` (`which`); represented as `{ kind: "missing" }`; handled with no suspend and a notice.
- **Tool spawn throws or child killed** — Detected by `ToolHost.run` (catch / exit signal); represented as `{ kind: "failed" }` or `exited { signal }`. `finally` always resets modes, resumes, and releases interrupts, then refresh runs as for a normal exit.
- **Git-dir watcher cannot start** — Detected by `watchGitDirs` (`fs.watch` throws); logged as `git.watch.fail`. The other triggers continue (REQ6).
- **Diff exceeds MAX_EDIT** — Detected by `diffLines`; represented as one `change` hunk covering the trimmed middle. There is no error.
- **Shutdown during the tool** — SIGTERM or SIGHUP run the existing shutdown. `shell.destroy()` is safe while suspended, because OpenTUI's destroy runs the same reset sequence.

## Construction and Wiring Flow

```text
src/app/main.ts
  ├→ git = createGit({ spawn: bunGitSpawn, which: Bun.which, logger })
  ├→ deps: RunnerDeps = { ..., git, tool: pendingTool, gitWatcher: undefined }
  ├→ store = createStore(initialState(...git: initialGit), createUpdate(reg), runner.run)
  ├→ lifecycle = installLifecycle(...)          → { exitNow, holdInterrupts }
  ├→ deps.tool = createToolHost({ shell, holdInterrupts: lifecycle.holdInterrupts, spawn, which, stdout })
  └→ setImmediate: void git.detect(ws.root).then((r) => store.dispatch({ type: "gitDetected", ...r }))
     runner gitWatch → (deps.gitWatcher ??= watchGitDirs(dirs, onChange)).retarget(dirs)
```

- **Construction:** `src/app/main.ts` — `createGit`, `createToolHost` — built after `shell` and `lifecycle`. `deps.tool` is late-bound like `deps.exit` (`main.ts:356`).
- **Registration:** `src/app/main.ts` `registries()` and `test/support/state.ts` `testRegistries()` — add `gitCommands`, `gitBindings`, and `gitGroups` (`{ "<leader>g": "git", "<leader>gh": "hunk" }`). `src/ui/shell.ts` — add `HunkView` to the `OverlayHost` list.
- **Exports:** new module exports listed in §7. Each one has a consumer, so knip stays clean.
- **Configuration:** `src/core/config/schema.ts` — `git.tool`, default `["lazygit"]`.

# 6. Logical Contracts, Data Models, and State

| Item | Kind | Purpose | Used By |
|---|---|---|---|
| `GitState` | State Model | All runtime Git state, never persisted | `src/core/state/git.ts` (owner); status, explorer, text-view (readers) |
| `RepoInfo` | Data Model | Discovery result | `onGitDetected`, `requestRefresh`, `openTool` |
| `Hunk` | Data Model | One changed region, old/new line ranges and kind | diff, signs, patch, reset, statusline |
| `IndexText` | Data Model | Normalized index side of one file | diff, patch, reset |
| `RepoStatus` | Data Model | Parsed status scoped to the workspace | explorer markers, statusline, refresh |
| `GitPending` | State Model | Save-gated continuation for stage or tool | `onSaved`, `onSaveFailed` |
| git `Action` members | Message | Adapter results into core | effects runner → update |
| git `Effect` members | Message | Core requests to the adapter and tool host | update → effects runner |
| `TimerId` members | Message | `gitDiff:<id>` and `gitRefresh` debounce keys | wrapper / reducers → runner timers |
| `Overlay` `gitHunk` | State Model | Hunk preview float | keys, mouse, HunkView |
| `Git` | Contract | Adapter interface | effects runner, main |
| `GitWatcher` | Contract | Multi-dir first-level watcher | effects runner, main |
| `ToolHost` | Contract | Terminal hand-off | effects runner |
| `Shell` extension | Contract | `suspend` / `resume` | ToolHost |
| `StatusSegments.git` | Data Model | Statusline Git fields | statusline view |
| `ConfigSchema.git` | Schema | User config | core reducers |

## `GitState` — State Model

**Purpose:** Holds discovery, repo status, per-file index and hunks, and the pending operation, so every surface derives from one place.

**Includes:**

- `repo: RepoInfo | null` — `null` outside a repository or without usable Git.
- `status: RepoStatus | null` — last successful status.
- `files: Record<string, { index?: IndexEntry; hunks: Hunk[] }>` — keyed by workspace-relative path, for open buffers only.
- `pending?: GitPending` — at most one.

**Usage:**

```text
onGitDetected / onGitStatus / onGitIndexRead / onGitDiffTimer → GitState → statusSegments, explorerMarkers, hunkSigns, commands
```

**Rules:**

- **Compatibility:** Not persisted; `saveState` ignores it.
- **Invariants:** `files` keys are a subset of open buffer paths, and a closed buffer's entry is dropped in the same transition. `hunks` were computed against `files[p].index`. `pending` refers to existing buffers.
- **Ownership and Lifecycle:** Created as `initialGit`, set by `gitDetected`, never reset except on a new `gitDetected`.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** §7 `src/core/state/types.ts`

## `RepoInfo` — Data Model

**Purpose:** The resolved repository for the workspace.

**Includes:**

- `top`, `gitDir`, `commonDir` — absolute paths.
- `prefix` — the workspace's repo-relative prefix (`""` at the top level, else `"notes/"`).
- `head: { kind: "branch"; name } | { kind: "unborn"; name } | { kind: "detached"; short }`.
- `op?: "rebasing" | "merging"`.

**Usage:**

```text
git.detect → gitDetected → onGitDetected; parseStatus updates head/op on each status
```

**Rules:**

- **Compatibility:** None — runtime only.
- **Invariants:** `prefix` ends with `/` or is empty, and every path in state is workspace-relative.
- **Ownership and Lifecycle:** Owned by `GitState.repo`.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** §7 `src/core/state/types.ts`

## `Hunk` — Data Model

**Purpose:** One change between index lines and buffer lines.

**Includes:**

- `kind: "add" | "change" | "delete" | "topdelete" | "changedelete" | "untracked"`.
- `old: { start; count }`, `new: { start; count }` — 0-based starts, with `count = 0` for pure insert or delete.
- `oldLines: string[]` — the index lines it replaces (for preview and reset).

**Usage:**

```text
diffLines → Hunk[] → hunkSigns, hunkAt, hunkPatch, resetHunk, statusline counts
```

**Rules:**

- **Compatibility:** None — runtime only.
- **Invariants:**
  - Hunks are sorted and non-overlapping.
  - A `delete` hunk has `new.count = 0` and anchors at `new.start` (`topdelete` when `new.start = 0`).
  - A `changedelete` hunk is a change where `old.count > new.count`.
  - An untracked file produces one `untracked` hunk covering every line.
- **Ownership and Lifecycle:** Recomputed on each diff timer and at stage/reset time.

**Location:** `src/core/features/git/diff.ts` — None — proposed item

**Detailed Shape:** §7 `src/core/features/git/diff.ts`

## `IndexText` — Data Model

**Purpose:** The index side, in the buffer's model, plus what is needed to write it back.

**Includes:**

- `oid`, `mode` — from `ls-files -s`.
- `lines: string[]` — LF-split with no BOM, and without the final empty line when there is a final newline.
- `finalNewline: boolean`, `bom: boolean`, `eol: "\n" | "\r\n"` — index-side form (from `ls-files --eol` `i/crlf`).

**Usage:**

```text
git.readIndex → normalizeIndexText → IndexEntry.text → diffLines / hunkPatch / resetHunk
```

**Rules:**

- **Compatibility:** None.
- **Invariants:** `normalizeIndexText(bytes).lines` joined back with `eol`, prefixed with a BOM if `bom`, and followed by `eol` if `finalNewline`, reproduces `bytes`.
- **Ownership and Lifecycle:** Replaced on each index read.

**Location:** `src/core/features/git/index-text.ts` — None — proposed item

**Detailed Shape:** §7 `src/core/features/git/index-text.ts`

## `RepoStatus` — Data Model

**Purpose:** Workspace-scoped file states and branch info from one status call.

**Includes:**

- `head` and `op` (as in `RepoInfo`).
- `files: Map<string, FileStatus>` — workspace-relative.
- `FileStatus = { index: Code; worktree: Code; conflict: boolean; untracked: boolean; submodule: boolean; hI?: string }`.

**Usage:**

```text
git.status → parseStatus(z, prefix) → gitStatus → explorerMarkers / statusline / onGitStatus re-read decisions
```

**Rules:**

- **Compatibility:** Porcelain v2 (Git ≥ 2.11, below the 2.31 floor).
- **Invariants:** Only paths under `prefix` are kept, with the prefix stripped. A rename keeps the new path, and the original path counts as deleted only when it is under `prefix`.
- **Ownership and Lifecycle:** Replaced each refresh.

**Location:** `src/core/features/git/status.ts` — None — proposed item

**Detailed Shape:** §7 `src/core/features/git/status.ts`

## `GitPending` — State Model

**Purpose:** A save-gated continuation, the sibling of `terminal.quit` (`src/core/state/save.ts:165-191`).

**Includes:**

- `{ op: "tool"; waiting: BufferId[] }` or `{ op: "stage"; bufferId: BufferId; line: number; waiting: BufferId[] }`.

**Usage:**

```text
openTool / stageHunk → pending → onSaved (remove id; empty → continue) | onSaveFailed (clear + notice)
```

**Rules:**

- **Compatibility:** None.
- **Invariants:** At most one pending operation, and `waiting` holds only dirty, writable buffers. Closing a waiting buffer cancels the operation.
- **Ownership and Lifecycle:** Set by commands, cleared on continue, cancel, or `gitDetected`.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** §7 `src/core/state/types.ts`, `src/core/state/git.ts`

## git `Action`, `Effect`, `TimerId`, `Overlay` members — Message / State Model

**Purpose:** Extend the existing closed unions (`src/core/state/types.ts:59-65`, `:194-202`, `:430-516`, `:518-571`).

**Includes:**

- Actions:
  - `gitDetected`, `gitStatus`, `gitIndexRead`, `gitStaged`, `toolExited`, `gitBlamed`, `gitDirChanged`.
- Effects:
  - `gitStatus`, `gitReadIndex`, `gitStage`, `gitBlame`, `gitWatch`, `runTool`.
- Timers:
  - `` `gitDiff:${BufferId}` ``, `"gitRefresh"`.
- Overlay:
  - `{ kind: "gitHunk"; bufferId; hunk: Hunk }`.

**Usage:**

```text
core reducers ⇄ effects runner ⇄ adapters
```

**Rules:**

- **Compatibility:** Exhaustive `never` checks (`update.ts:194-195`) force handling.
- **Invariants:** Every fallible git effect answers with exactly one action.
- **Ownership and Lifecycle:** None.

**Location:** `src/core/state/types.ts:59-65`, `:194-202`, `:430-516`, `:518-571`

**Detailed Shape:** §7 `src/core/state/types.ts`

## `Git`, `GitWatcher`, `ToolHost`, `Shell` extension — Contracts

**Purpose:** The I/O boundaries.

**Includes:** See §7 for the full signatures.

**Usage:**

```text
createEffectRunner(deps.git, deps.tool, deps.gitWatcher)
```

**Rules:**

- **Compatibility:** `Shell` gains two methods. The test shell (`test/support/ui.ts`) implements them as flag setters.
- **Invariants:**
  - `Git` exposes only two mutating operations, `stage` (`add -N`, `apply --cached`).
  - `ToolHost.run` always resumes and releases in `finally`.
- **Ownership and Lifecycle:** Constructed in `main.ts`.

**Location:** None — proposed items; `Shell` at `src/ui/shell.ts:85-92`

**Detailed Shape:** §7 `src/workspace/git.ts`, `src/workspace/git-watcher.ts`, `src/app/tool-host.ts`, `src/ui/shell.ts`

## `StatusSegments.git` — Data Model

**Purpose:** Statusline fields.

**Includes:**

- `{ ref: string; op?: "rebasing" | "merging"; added: number; changed: number; removed: number }` — counts are for the active buffer, following gitsigns' summary rule (RF1).

**Usage:**

```text
statusSegments(s) → statusline view
```

**Rules:**

- **Compatibility:** Optional; absent outside a repository.
- **Invariants:** `ref` is the branch name, the unborn name, or a 7-character short SHA.
- **Ownership and Lifecycle:** Derived per paint.

**Location:** `src/core/state/status.ts:12-32`

**Detailed Shape:** §7 `src/core/state/status.ts`

## `ConfigSchema.git` — Schema

**Purpose:** The user-configurable tool argv.

**Includes:**

- `tool: string[]` — `min(1)` items, each `min(1)` characters, default `["lazygit"]`.

**Usage:**

```text
config.toml [git] tool = [...] → AppConfig.git.tool → openTool → runTool.argv
```

**Rules:**

- **Compatibility:** New optional section. Unknown keys inside it are errors.
- **Invariants:** None beyond the schema.
- **Ownership and Lifecycle:** Reloaded with `config.reload`.

**Location:** `src/core/config/schema.ts:46-105`

**Detailed Shape:** §7 `src/core/config/schema.ts`

# 7. Detailed Code Design

## `src/core/features/git/diff.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** `W261005F2A7-REQ5@R2`, `W261005F2A7-REQ4@R2`
- **Responsibilities:** Line diff to hunks with bounded cost.
- **Affected Callers/Consumers:** `src/core/state/git.ts` (`onGitDiffTimer`, `stageHunk`, `resetHunk`)
- **Construction/Wiring:** None — pure module
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Hunk`, `HunkKind` | None — new symbol | Type per §6 | git.ts, signs.ts, patch.ts, status.ts (core), hunk overlay |
| `diffLines` | None — new symbol | `(old: readonly string[], cur: readonly string[], opts?: { untracked?: boolean }) => Hunk[]` | git.ts |
| `MAX_EDIT` | None — new symbol | `2000` | diff.test.ts |

**Existing Shape:** None — new file. The existing trim-and-cap idea is at `src/ui/overlays/conflict.ts:15-35` (UI-only and LCS-based).

```ts
None
```

There is no existing core diff. `conflict.ts`'s private `lineDiff` stays as it is, because it is UI-local and uses an O(n·m) table.

**Proposed Shape:**

```ts
export type HunkKind = "add" | "change" | "delete" | "topdelete" | "changedelete" | "untracked";
export type Hunk = {
  kind: HunkKind;
  old: { start: number; count: number };
  new: { start: number; count: number };
  oldLines: readonly string[];
};
export const MAX_EDIT = 2000;

export function diffLines(old: readonly string[], cur: readonly string[], opts?: { untracked?: boolean }): Hunk[] {
  // untracked → one hunk { kind: "untracked", old: {0,0}, new: {0, cur.length} }
  // trim common prefix p and suffix q
  // middle has no line in common (Set check) → one change hunk
  // Myers O(ND) on the middle; D > MAX_EDIT → one change hunk for the middle
  // group edit script into hunks; classify kind by counts and position
}
```

`diffLines` takes the normalized index lines and the buffer lines (`TextBuffer.line(i)` for `i < lineCount`) and returns sorted hunks. The common-line `Set` check catches the "nothing matches" case (RF14) in O(n) before Myers starts. `MAX_EDIT` bounds Myers at roughly D² + N work, about 4 M steps at most, measured under 50 ms in the benchmark gate (`V51`). Classification follows gitsigns:

- `old.count = 0` gives `add`.
- `new.count = 0` gives `delete`, or `topdelete` at `new.start = 0`.
- Otherwise the hunk is `change`, or `changedelete` when `old.count > new.count`.

A final-newline difference with identical last lines produces a `change` hunk on the last line. This is decided by the caller, which passes the last line with a sentinel suffix when the flags differ.

- **Invariants:**
  - The output is sorted and non-overlapping.
  - Applying every hunk's `oldLines` back over its new range reproduces `old`.
  - Runtime never exceeds the `MAX_EDIT` bound.
- **Verification Coverage:** `S7`, `S18`, `S19`; `V1`–`V6`, `V51`

## `src/core/features/git/index-text.ts`

- **Change:** Add
- **Decisions:** DES3
- **Requirements:** `W261005F2A7-REQ5@R2`, `W261005F2A7-REQ1@R2`
- **Responsibilities:** Convert index bytes to the buffer line model and back.
- **Affected Callers/Consumers:** `src/workspace/git.ts` (`readIndex`), `patch.ts`, `git.ts`
- **Construction/Wiring:** None
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `IndexText` | None — new symbol | `{ lines: string[]; finalNewline: boolean; bom: boolean; eol: "\n" \| "\r\n" }` | git.ts, patch.ts |
| `normalizeIndexText` | None — new symbol | `(text: string, eolAttr: "lf" \| "crlf" \| "mixed" \| "none") => IndexText` | workspace/git.ts |

**Existing Shape:** `src/core/state/buffers.ts:305-312` — `splitFile`

```ts
// splitFile: f.text.replaceAll("\r\n", "\n") → lines; bom and eol kept on BufferState
```

The buffer side is already LF-only, BOM-free, and final-newline-split (`BufferState.bom`, `eol`, `finalNewline` at `src/core/state/types.ts:78-103`). The index side must match it.

**Proposed Shape:**

```ts
export type IndexText = { lines: string[]; finalNewline: boolean; bom: boolean; eol: "\n" | "\r\n" };
export function normalizeIndexText(text: string, eolAttr: "lf" | "crlf" | "mixed" | "none"): IndexText {
  // strip U+FEFF → bom; replaceAll("\r\n", "\n"); finalNewline = endsWith("\n"); split; drop trailing ""
  // eol = eolAttr === "crlf" ? "\r\n" : "\n"
}
```

`normalizeIndexText` mirrors `splitFile` exactly, so identical content compares equal whatever the line endings are on either side (RF4). `eol` records the index form for `hunkPatch`. A BOM difference is compared outside the lines: `git.ts` marks line 0 changed when `index.bom !== buffer.bom` and the first lines are otherwise equal.

- **Invariants:**
  - Round-trip: re-joining `lines` with `eol`, adding a BOM if `bom` and `eol` if `finalNewline`, gives the original text whenever `eolAttr` is `lf` or `crlf`.
- **Verification Coverage:** `S18`; `V7`, `V8`

## `src/core/features/git/patch.ts`

- **Change:** Add
- **Decisions:** DES4
- **Requirements:** `W261005F2A7-REQ1@R2`
- **Responsibilities:** One-hunk zero-context patch text.
- **Affected Callers/Consumers:** `src/core/state/git.ts` (`stageHunk`)
- **Construction/Wiring:** None
- **Dependencies:** `Hunk`, `IndexText`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `hunkPatch` | None — new symbol | `(repoPath: string, mode: string, hunk: Hunk, index: IndexText, cur: { lines: readonly string[]; finalNewline: boolean; bom: boolean }) => string` | git.ts |

**Existing Shape:** None — new file

```ts
None
```

There is no patch builder in the project today.

**Proposed Shape:**

```ts
export function hunkPatch(repoPath: string, mode: string, h: Hunk, index: IndexText, cur: Cur): string {
  // "diff --git a/<p> b/<p>\nindex 0000000..0000000 <mode>\n--- a/<p>\n+++ b/<p>\n"
  // "@@ -<oldStart>,<oldCount> +<newStart>,<newCount> @@\n"   (git-diff convention: count 0 → start = line before)
  // "-" + line + index.eol for oldLines; "+" + line + index.eol for new lines
  // last old line at EOF && !index.finalNewline → "\\ No newline at end of file\n"; same for new side with cur.finalNewline
  // line 0 carries U+FEFF on the side whose bom is true
}
```

`hunkPatch` writes both sides in the index's EOL form, which is how `git apply --cached` expects the content (RF4). The header uses git-diff numbering, and RF2 confirmed it is equivalent to gitsigns' `start+1` form. `repoPath` is `prefix + workspacePath`.

- **Invariants:**
  - Applying the patch with `git apply --cached --unidiff-zero` to an index holding `index` stages exactly one hunk.
- **Verification Coverage:** `S1`, `S2`, `S5`; `V10`, `V11`, `V22`

## `src/core/features/git/status.ts`

- **Change:** Add
- **Decisions:** DES6, DES10
- **Requirements:** `W261005F2A7-REQ4@R2`, `W261005F2A7-REQ6@R2`, `W261005F2A7-REQ7@R2`
- **Responsibilities:** Parse porcelain v2 `-z` output, and derive explorer markers.
- **Affected Callers/Consumers:** `src/workspace/git.ts` (`status`), `src/ui/views/explorer.ts`, `src/core/state/git.ts`
- **Construction/Wiring:** None
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `RepoStatus`, `FileStatus` | None — new symbol | Per §6 | git.ts, explorer.ts, status.ts (state) |
| `parseStatus` | None — new symbol | `(z: string, prefix: string) => RepoStatus` | workspace/git.ts |
| `Marker` | None — new symbol | `"modified" \| "staged" \| "untracked" \| "deleted" \| "conflict" \| "contains"` | explorer.ts |
| `explorerMarkers` | None — new symbol | `(st: RepoStatus) => Map<string, Marker>` (memoized per `st` via WeakMap) | explorer.ts |

**Existing Shape:** None — new file

```ts
None
```

No status parser exists today.

**Proposed Shape:**

```ts
export function parseStatus(z: string, prefix: string): RepoStatus {
  // split on \0; "# branch.oid", "# branch.head" → head; lines "1", "2" (consume next field = orig path), "u", "?"
  // keep paths starting with prefix; strip prefix
}
export function explorerMarkers(st: RepoStatus): Map<string, Marker> {
  // file: conflict > deleted > untracked > modified (worktree≠".") > staged (index≠".")
  // each ancestor dir of a marked file → "contains" (unless it has its own marker)
}
```

`parseStatus` is pure, so its edge cases (renames, submodule `S…`, NUL paths, detached `(detached)` head) are unit-tested without Git. `explorerMarkers` gives each workspace-relative row path one marker by a fixed precedence. Folder aggregation needs no repo walk (RF9). The `op` (rebasing/merging) is not in porcelain output. It comes from `git.status`, which checks `<gitDir>/rebase-merge`, `rebase-apply`, and `MERGE_HEAD` and sets it on the result.

- **Invariants:**
  - Every key is workspace-relative and under the workspace.
  - Precedence is total, so each path gets exactly one marker.
- **Verification Coverage:** `S9`, `S10`, `S24`; `V14`–`V17`

## `src/core/features/git/blame.ts`

- **Change:** Add
- **Decisions:** DES11
- **Requirements:** `W261005F2A7-REQ4@R2`
- **Responsibilities:** Parse a one-line porcelain blame.
- **Affected Callers/Consumers:** `src/workspace/git.ts` (`blame`), `src/core/state/git.ts` (`onGitBlamed`)
- **Construction/Wiring:** None
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `BlameLine` | None — new symbol | `{ committed: false } \| { committed: true; sha: string; author: string; time: number; summary: string }` | git.ts |
| `parseBlame` | None — new symbol | `(porcelain: string) => BlameLine` | workspace/git.ts |

**Existing Shape:** None — new file

```ts
None
```

There is no blame support today.

**Proposed Shape:**

```ts
export function parseBlame(out: string): BlameLine {
  // first line "<sha> ..."; sha all zeros, or author "Not Committed Yet", or author-mail "<external.file>" → { committed: false }
  // else read author, author-time, summary
}
```

`parseBlame` accepts both the pre-2.41 and post-2.41 not-committed markers (RF13). The reducer formats the relative date from `time` and `now`.

- **Invariants:**
  - The all-zero SHA always yields `committed: false`.
- **Verification Coverage:** `S11`; `V24`

## `src/core/features/git/signs.ts`

- **Change:** Add
- **Decisions:** DES10, DES11
- **Requirements:** `W261005F2A7-REQ4@R2`
- **Responsibilities:** The sign decoration provider and hunk navigation.
- **Affected Callers/Consumers:** `src/ui/editors/text-view.ts` (`layoutFrame`), `src/core/state/git-commands.ts`
- **Construction/Wiring:** None
- **Dependencies:** `DecorationProvider` (`src/core/kernel/view/decorations.ts:10-26`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `GIT_SIGNS` | None — new symbol | `Record<HunkKind, Sign>` with one-cell glyph + `git*` token | text-view (ui) |
| `hunkSigns` | None — new symbol | `(hunks: readonly Hunk[]) => DecorationProvider` | text-view (ui) |
| `hunkAt` | None — new symbol | `(hunks, line) => Hunk \| undefined` (delete anchors match their anchor line) | git.ts |
| `nextHunkLine`, `prevHunkLine` | None — new symbol | `(hunks, line) => number \| undefined` | git-commands.ts |

**Existing Shape:** `src/core/kernel/view/decorations.ts:10-26`

```ts
| { kind: "line"; line: number; style?: StyleToken; sign?: Sign }
export type DecorationProvider<S = unknown> = (v: TextView, analysis: S) => Decoration[];
```

A provider returns line decorations, and `layoutText` keeps the last sign per line (`src/core/kernel/view/text-view.ts:98-101`).

**Proposed Shape:**

```ts
export const GIT_SIGNS: Record<HunkKind, Sign> = {
  add: { text: "+", style: "gitAdd" }, change: { text: "~", style: "gitChange" },
  delete: { text: "_", style: "gitDelete" }, topdelete: { text: "‾", style: "gitTopDelete" },
  changedelete: { text: "≃", style: "gitChangeDelete" }, untracked: { text: "┆", style: "gitUntracked" },
};
export const hunkSigns = (hunks: readonly Hunk[]): DecorationProvider =>
  (v) => /* line decorations for hunk lines intersecting v's visible range */ [];
```

`GIT_SIGNS` gives each kind a distinct one-cell glyph as well as a token. The kinds stay distinguishable when `color = "never"`, matching the theme's no-colour rule (`src/ui/theme.ts:209-210` comment). The glyphs are presentation defaults; final look-and-feel belongs to UI design. `hunkSigns` emits decorations only for visible lines. Delete hunks mark their anchor line: `topdelete` marks line 0, and `delete` marks the line before the gap.

- **Invariants:**
  - At most one git sign per line. When a delete anchor coincides with a change line, the change sign wins.
- **Verification Coverage:** `S7`, `S8`; `V4`, `V5`, `V6`

## `src/core/kernel/view/text-view.ts`

- **Change:** Modify
- **Decisions:** DES10
- **Requirements:** `W261005F2A7-REQ4@R2`
- **Responsibilities:** Block-replace rows show a sign from their covered range.
- **Affected Callers/Consumers:** `layoutText` callers (`src/ui/editors/text-view.ts:675-681`)
- **Construction/Wiring:** None
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `layoutText` | `src/core/kernel/view/text-view.ts:19-55` — a block `replace` row carries no sign | The replace row carries the last sign among `line` decorations whose line is in `[range.start.line, range.end.line]` | Live view of every filetype with block replaces |

**Existing Shape:** `src/core/kernel/view/text-view.ts:45-55`

```ts
if (block?.kind === "replace") {
  if (block.spans !== undefined || block.widget !== undefined)
    emit(withWidget({ sourceLine: line, spans: block.spans ?? [] }, block.widget));
  line = block.range.end.line;
  continue;
}
```

The replaced row currently drops every line decoration in its range. A changed table row inside a rendered table therefore shows no sign.

**Proposed Shape:**

```ts
if (block?.kind === "replace") {
  const sign = lastSignIn(decos, line, block.range.end.line);
  if (block.spans !== undefined || block.widget !== undefined)
    emit(withWidget({ sourceLine: line, spans: block.spans ?? [], ...(sign && { sign }) }, block.widget));
  line = block.range.end.line;
  continue;
}
```

`lastSignIn` is a local helper that scans `decos` for `line` decorations inside the block range and keeps the last sign, so the "later provider wins" rule stays consistent. Snapshot output changes only where a sign exists, which today means only the markdown `⚠` error sign on a failing block's first line.

- **Invariants:**
  - Rows without signs in range are unchanged, so existing snapshots do not change.
- **Verification Coverage:** `S8`; `V9`

## `src/core/state/types.ts`

- **Change:** Modify
- **Decisions:** DES1, DES4, DES9, DES11
- **Requirements:** All current revisions
- **Responsibilities:** State and message unions.
- **Affected Callers/Consumers:** `update.ts`, `effects.ts`, every exhaustive switch, `initialState`, `test/support/state.ts`
- **Construction/Wiring:** `initialState` adds `git: initialGit`
- **Dependencies:** `Hunk`, `IndexText`, `RepoStatus`, `BlameLine` (core features)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `AppState` | `types.ts:379-428`, no git field | adds `git: GitState` | initialState, reducers, views |
| `GitState`, `RepoInfo`, `IndexEntry`, `GitPending` | None — new symbol | Per §6 | git.ts, views |
| `Action` | `types.ts:430-516` | adds the 7 git members | update.ts, effects.ts |
| `Effect` | `types.ts:518-571` | adds the 6 git members | effects.ts |
| `TimerId` | `types.ts:59-65` | adds `` `gitDiff:${BufferId}` `` and `"gitRefresh"` | update.ts `onTimerAction` |
| `Overlay` | `types.ts:194-202` | adds `{ kind: "gitHunk"; bufferId: BufferId; hunk: Hunk }` | keys.ts, mouse.ts, shell.ts |

**Existing Shape:** `src/core/state/types.ts:59-65`

```ts
| `autosave:${BufferId}` | `retry:${BufferId}` | `toast:${number}` | "whichKey" | "saveState" | "search"
```

Timer ids are a closed template-literal union, and the runner uses them as debounce keys (`src/app/effects.ts:117-134`).

**Proposed Shape:**

```ts
export type RepoInfo = { top: string; gitDir: string; commonDir: string; prefix: string;
  head: { kind: "branch" | "unborn"; name: string } | { kind: "detached"; short: string }; op?: "rebasing" | "merging" };
export type IndexEntry =
  | { kind: "tracked"; oid: string; mode: string; conflicted: boolean; text: IndexText }
  | { kind: "untracked" } | { kind: "ignored" };
export type GitPending =
  | { op: "tool"; waiting: BufferId[] }
  | { op: "stage"; bufferId: BufferId; line: number; waiting: BufferId[] };
export type GitState = { repo: RepoInfo | null; status: RepoStatus | null;
  files: Record<string, { index?: IndexEntry; hunks: Hunk[] }>; pending?: GitPending };
// Action additions
| { type: "gitDetected"; repo: RepoInfo | null; notice?: string }
| { type: "gitStatus"; result: { ok: true; status: RepoStatus } | { ok: false; reason: string } }
| { type: "gitIndexRead"; path: string; entry: IndexEntry | { kind: "failed"; reason: string } }
| { type: "gitStaged"; path: string; result: "ok" | "stale" | { failed: string } }
| { type: "toolExited"; result: ToolResult }
| { type: "gitBlamed"; path: string; line: number; result: BlameLine | { failed: string } }
| { type: "gitDirChanged" }
// Effect additions
| { kind: "gitStatus"; prefix: string }
| { kind: "gitReadIndex"; path: string; repoPath: string }
| { kind: "gitStage"; path: string; repoPath: string; expectedOid: string | null; patch: string }
| { kind: "gitBlame"; path: string; repoPath: string; line: number; contents: string }
| { kind: "gitWatch"; dirs: string[] }
| { kind: "runTool"; argv: string[]; cwd: string }
```

The unions carry only plain data, so `update` stays serializable and pure. `expectedOid: null` means "untracked, add intent-to-add first". `ToolResult` is declared here in core and imported by `src/app/tool-host.ts` (app may import core): `{ kind: "exited"; code: number; signal?: string } | { kind: "missing"; tool: string } | { kind: "failed"; reason: string }`.

- **Invariants:**
  - Exhaustive switches stay exhaustive. The compiler enforces this.
- **Verification Coverage:** `V52` (typecheck)

## `src/core/state/update.ts`

- **Change:** Modify
- **Decisions:** DES1, DES2, DES6
- **Requirements:** `W261005F2A7-REQ5@R2`, `W261005F2A7-REQ6@R2`
- **Responsibilities:** Route git actions and timers, and hook text changes to the diff debounce.
- **Affected Callers/Consumers:** `createStore` (`main.ts:328-337`, test support)
- **Construction/Wiring:** None
- **Dependencies:** `src/core/state/git.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `createUpdate` switch | `update.ts:130-195` | adds 7 cases calling `git.ts` handlers | store |
| wrapper | `update.ts:197-216` — `sessionChanged` → `saveState` timer | also `textChanged(prev, next)` → `startTimer gitDiff:<id> 100` when `next.git.repo` exists | store |
| `onTimerAction` | `update.ts:220-233` | routes `gitDiff:*` → `onGitDiffTimer`, `gitRefresh` → `onGitRefreshTimer` | timer action |

**Existing Shape:** `src/core/state/update.ts:204-211`

```ts
const r = syncEmbeds(state, followShownNote(state, syncEditorKinds(step(state, action), reg)), reg);
return action.type !== "stateLoaded" && sessionChanged(state, r.state)
  ? { state: r.state, effects: [...r.effects, { kind: "startTimer", id: "saveState", ms: SAVE_STATE_MS }] } : r;
```

The wrapper already post-processes every transition to add a debounce timer.

**Proposed Shape:**

```ts
const withSession = /* existing */;
return withGitDiffTimers(state, withSession);
function withGitDiffTimers(prev: AppState, r: Result): Result {
  if (r.state.git.repo === null) return r;
  // for each buffer id in r.state.buffers whose text.version differs from prev → startTimer gitDiff:<id> 100
}
```

One central hook covers every edit site (keys, `applyBufferEdits`, substitute, reloads) without touching them. Restarting the same timer id makes it a trailing debounce. The hook iterates buffers, typically fewer than 20, and compares one number each.

- **Invariants:**
  - No git timer is emitted outside a repository.
- **Verification Coverage:** `S19`; `V18`

## `src/core/state/git.ts`

- **Change:** Add
- **Decisions:** DES1, DES4, DES5, DES6, DES9, DES11
- **Requirements:** `W261005F2A7-REQ1@R2`, `W261005F2A7-REQ2@R2`, `W261005F2A7-REQ3@R1`, `W261005F2A7-REQ4@R2`, `W261005F2A7-REQ5@R2`, `W261005F2A7-REQ6@R2`, `W261005F2A7-REQ7@R2`, `W261005F2A7-REQ8@R1`, `W261005F2A7-REQ9@R1`
- **Responsibilities:** Every git state transition.
- **Affected Callers/Consumers:** `update.ts`, `save.ts`, `disk.ts`, `git-commands.ts`
- **Construction/Wiring:** None
- **Dependencies:** `features/git/*`, `buffers.ts` (`applyBufferEdits`, `setBuffer`, `fullText`, `saveText`), `save.ts` (`writeBuffer`, `blocked`), `result.ts` (`message`, `chain`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `initialGit` | None — new symbol | `{ repo: null, status: null, files: {} }` | initialState |
| `onGitDetected`, `onGitStatus`, `onGitIndexRead`, `onGitDiffTimer`, `onGitRefreshTimer`, `onGitStaged`, `onToolExited`, `onGitBlamed` | None — new symbol | `(s, a[, now]) => Result` | update.ts |
| `requestRefresh` | None — new symbol | `(s) => Result` — `startTimer gitRefresh 200` when repo exists | save.ts, disk.ts, git.ts |
| `stageHunk`, `resetHunk`, `openTool`, `blameLine`, `previewHunk`, `gotoHunk` | None — new symbol | `(ctx: CommandContext) => Result` | git-commands.ts |
| `advanceGitPending`, `cancelGitPending` | None — new symbol | `(s, id: BufferId[, reason]) => Result` | save.ts |
| `trackOpenBuffer`, `dropClosedBuffer` | None — new symbol | keep `files` in sync with buffers (`fileLoaded`, buffer removal) | buffers.ts callers via update wrapper |

**Existing Shape:** `src/core/state/save.ts:245-252` and `:165-191` — the quit-after-save continuation

```ts
const waiting = { ...s, terminal: { ...s.terminal, quit: { code: 0, waiting: ids } } };
return ids.reduce((r, id) => chain(r, (st) => writeBuffer(st, id, now)), none(waiting));
// onSaved → advanceQuit(st, b.id); onSaveFailed → drop terminal.quit
```

The pending git operation follows this pattern exactly.

**Proposed Shape:**

```ts
export function openTool(ctx: CommandContext): Result {
  const s = ctx.state;
  if (!s.git.repo) return message(s, "not a git repository");
  if (s.git.pending) return message(s, "git: another operation is running");
  const dirty = dirtyIds(s);
  const stuck = dirty.find((id) => blocked(s, s.buffers[id]));
  if (stuck) return message(s, `git tool not started: cannot save ${s.buffers[stuck].path}`, "error");
  if (dirty.length === 0) return runTool(s);
  const st = { ...s, git: { ...s.git, pending: { op: "tool", waiting: dirty } } };
  return dirty.reduce((r, id) => chain(r, (x) => writeBuffer(x, id, ctx.now)), none(st));
}
export function advanceGitPending(s: AppState, id: BufferId, now: number): Result {
  // remove id; still dirty again (typed during write) → writeBuffer; empty → continue(op)
  // continue: tool → runTool(s); stage → stageNow(s, bufferId, line)
}
function stageNow(s: AppState, id: BufferId, line: number): Result {
  // entry = files[path].index; conflicted → message; hunks = currentHunks(s, id); h = hunkAt(hunks, line)
  // effect gitStage { path, repoPath, expectedOid: entry.kind === "tracked" ? entry.oid : null, patch: hunkPatch(...) }
}
export function resetHunk(ctx: CommandContext): Result {
  // h = hunkAt(currentHunks(...), cursor line); span = lines [h.new.start, h.new.start + h.new.count)
  // applyBufferEdits(s, { path, edits: [{ range, expected, text: h.oldLines.join("\n") (+ "\n" when needed) }] })
  // EOF + finalNewline differs → setBuffer(st, id, { finalNewline: index.finalNewline })
}
```

`openTool` and `stageHunk` share the pending mechanism.

- **Dirty buffers:** `writeBuffer` (`src/core/state/save.ts:71-105`) already writes any writable dirty buffer immediately and cancels its autosave timer, so no new option is needed. A buffer whose write is already in flight returns `none`; its pending `saved` advances the operation.
- **Blocked buffers:** `blocked` (now exported from `save.ts:32-33`) rejects up front, because `writeBuffer` returns `none` silently for read-only, deleted, or conflicted buffers. Without the check, the pending operation would wait forever.
- **Typing during a write:** `advanceGitPending` re-writes a buffer that became dirty again, so the tool always starts on saved text.
- **`currentHunks`:** runs `diffLines` synchronously, so commands never act on a stale debounced result.
- **`onToolExited`:** emits `requestRefresh`, a `read` effect per open buffer (`src/core/state/types.ts:520`, handled by `onDiskLoaded`), and `gitReadIndex` per open buffer.

- **Invariants:**
  - `pending` is cleared on every terminal path: continue, `saveFailed`, buffer close, `gitDetected`.
  - Stage never emits `gitStage` for a conflicted entry.
  - Reset never touches Git.
- **Verification Coverage:** `S1`–`S6`, `S12`, `S16`, `S20`, `S27`–`S29`; `V10`–`V13`, `V19`–`V23`, `V25`–`V27`, `V31`–`V35`

## `src/core/state/git-commands.ts`

- **Change:** Add
- **Decisions:** DES11
- **Requirements:** `W261005F2A7-REQ1@R2`, `W261005F2A7-REQ2@R2`, `W261005F2A7-REQ4@R2`
- **Responsibilities:** Command entries, default bindings, groups.
- **Affected Callers/Consumers:** `registries()` (`src/app/main.ts:131-172`), `testRegistries()` (`test/support/state.ts:61-103`)
- **Construction/Wiring:** Merged like `noteBindings` / `noteGroups` (`src/core/state/note-commands.ts:258-269`)
- **Dependencies:** `git.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `gitCommands` | None — new symbol | `git.tool`, `git.stageHunk`, `git.resetHunk`, `git.previewHunk`, `git.nextHunk`, `git.prevHunk`, `git.blameLine` | registries |
| `gitBindings` | None — new symbol | `<leader>gg`, `<leader>ghs`, `<leader>ghr`, `<leader>ghp`, `<leader>ghb`, `]h`, `[h` (normal) | registries |
| `gitGroups` | None — new symbol | `{ "<leader>g": "git", "<leader>gh": "hunk" }` | registries |

**Existing Shape:** `src/core/kernel/commands/defaults.ts:23` and `src/core/state/note-commands.ts:258-269`

```ts
{ scope: { mode: "normal" }, seq: "<leader>ff", id: "file.find" },
export const noteGroups = { "<leader>n": "notes" } as const;
```

Each feature exports its commands, bindings, and groups, and `registries()` merges them.

**Proposed Shape:**

```ts
export const gitCommands: AppCommand[] = [
  { id: "git.tool", title: "Git: open tool", run: openTool },
  { id: "git.stageHunk", title: "Git: stage hunk", run: stageHunk },
  { id: "git.resetHunk", title: "Git: reset hunk", run: resetHunk },
  { id: "git.previewHunk", title: "Git: preview hunk", run: previewHunk },
  { id: "git.nextHunk", title: "Git: next hunk", run: (c) => gotoHunk(c, 1) },
  { id: "git.prevHunk", title: "Git: previous hunk", run: (c) => gotoHunk(c, -1) },
  { id: "git.blameLine", title: "Git: blame line", run: blameLine },
];
```

The ids are reachable as `:git.tool` and so on through the existing `:id` fallback (`src/core/state/commands.ts:120-127`). `]h`/`[h` are free (no `[`/`]` prefix bindings exist), and keymap lookup runs before the vim engine (`src/core/state/keys.ts:107-115`).

- **Invariants:**
  - Every binding id exists in `gitCommands`.
- **Verification Coverage:** `S7`; `V6`, `V44`

## `src/core/state/save.ts`

- **Change:** Modify
- **Decisions:** DES4, DES9
- **Requirements:** `W261005F2A7-REQ8@R1`, `W261005F2A7-REQ9@R1`, `W261005F2A7-REQ6@R2`
- **Responsibilities:** Advance or cancel the pending git operation; refresh after own writes.
- **Affected Callers/Consumers:** `update.ts` (`saved`, `saveFailed`)
- **Construction/Wiring:** None
- **Dependencies:** `git.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `onSaved` | `save.ts:133-166` — closes buffer, advances quit | also `chain(advanceGitPending)` and `chain(requestRefresh)` | update.ts |
| `onSaveFailed` | `save.ts:187-191` — cancels quit | also `cancelGitPending(st, id)` with notice | update.ts |
| `blocked` | `save.ts:32-33`, module-private | exported | git.ts |

**Existing Shape:** `src/core/state/save.ts:165-166`

```ts
const closed = b.closing ? chain(r, (st) => removeBuffer(st, b.id)) : r;
return chain(closed, (st) => advanceQuit(st, b.id));
```

`onSaved` already chains the quit continuation, and git chains next to it.

**Proposed Shape:**

```ts
return chain(chain(chain(closed, (st) => advanceQuit(st, b.id)), (st) => advanceGitPending(st, b.id, a.now)), requestRefresh);
```

Order: quit wins, because shutting down needs no git. The refresh is coalesced by the timer.

- **Invariants:**
  - The existing quit behavior is unchanged (`save.test.ts` still passes).
- **Verification Coverage:** `S27`, `S28`, `S29`, `S20`; `V20`, `V31`, `V32`, `V26`

## `src/core/state/disk.ts`, `status.ts`, `keys.ts`, `mouse.ts`

- **Change:** Modify
- **Decisions:** DES6, DES10, DES11
- **Requirements:** `W261005F2A7-REQ4@R2`, `W261005F2A7-REQ6@R2`
- **Responsibilities:**
  - `disk.ts`: refresh on external file change.
  - `status.ts`: git segment.
  - `keys.ts` and `mouse.ts`: `gitHunk` overlay closes on Esc, `q`, or a click outside.
- **Affected Callers/Consumers:** update.ts; statusline view; overlay host
- **Construction/Wiring:** None
- **Dependencies:** `git.ts`, `features/git/*`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `onFileChanged` | `disk.ts:37` | result chained with `requestRefresh` | update.ts |
| `StatusSegments` / `statusSegments` | `status.ts:12-32`, `:81` | adds `git?: { ref; op?; added; changed; removed }` | statusline.ts |
| `routeKey` | `keys.ts:69-84` | `gitHunk` → Esc/`q` close, other keys close then re-dispatch | keys |
| `pressStops`, `overlayGate` | `mouse.ts:80-115` | `gitHunk` click-dismissable | mouse |

**Existing Shape:** `src/core/state/status.ts:12-32`

```ts
{ mode: string; dirty: boolean; view?: string; path?: string; words?: number; ...; preview: string }
```

Segments are derived purely from state for each paint.

**Proposed Shape:**

```ts
git?: { ref: string; op?: "rebasing" | "merging"; added: number; changed: number; removed: number };
// statusSegments: s.git.repo && active buffer → ref from head; counts from files[path].hunks (gitsigns summary rule)
```

Counts follow RF1:

- A change hunk adds `min(old,new)` to `changed` and the remainder to `added` or `removed`.
- An untracked hunk counts as `added`.

- **Invariants:**
  - `git` is absent when `repo` is `null`.
- **Verification Coverage:** `S10`; `V15`, `V45`

## `src/core/config/schema.ts`

- **Change:** Modify
- **Decisions:** DES11
- **Requirements:** `W261005F2A7-REQ3@R1`
- **Responsibilities:** `git` section.
- **Affected Callers/Consumers:** `AppConfig` consumers (`openTool`)
- **Construction/Wiring:** None
- **Dependencies:** zod

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ConfigSchema` | `schema.ts:46-105` | adds `git` | `AppConfig`, `defaults` |

**Existing Shape:** `src/core/config/schema.ts:79-85`

```ts
preview: z.strictObject({ mode: z.enum([...]).default("reading"), ... }).prefault({}),
```

Each feature section is a strict object with defaults.

**Proposed Shape:**

```ts
git: z.strictObject({
  tool: z.array(z.string().min(1)).min(1).default(["lazygit"]),
}).prefault({}),
```

An empty or non-string `tool` is a schema error that `toml.ts` reports with a line number. `~` in arguments is passed literally, which is documented in `project.md`.

- **Invariants:**
  - `defaults.git.tool` equals `["lazygit"]`.
- **Verification Coverage:** `S17`; `V43`

## `src/workspace/git.ts`

- **Change:** Add
- **Decisions:** DES1, DES3, DES4, DES6, DES8, DES11
- **Requirements:** `W261005F2A7-REQ1@R2`, `W261005F2A7-REQ4@R2`, `W261005F2A7-REQ6@R2`, `W261005F2A7-REQ7@R2`
- **Responsibilities:** All Git CLI calls.
- **Affected Callers/Consumers:** `src/app/effects.ts`, `src/app/main.ts`
- **Construction/Wiring:** `createGit` in `main.ts`
- **Dependencies:** `features/git/{status,blame,index-text}`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `GitSpawn` | None — new symbol | `(argv: string[], o: { cwd: string; stdin?: string }) => Promise<{ code: number; stdout: string; stderr: string }>` | tests inject |
| `Git` | None — new symbol | `{ detect(root): Promise<{ repo: RepoInfo \| null; notice?: string }>; status(repo): Promise<RepoStatus>; readIndex(repo, repoPath): Promise<IndexEntry>; stage(repo, e: { repoPath; expectedOid; patch }): Promise<"ok" \| "stale">; blame(repo, repoPath, line, contents): Promise<BlameLine> }` | effects.ts, main.ts |
| `createGit` | None — new symbol | `(d: { spawn?: GitSpawn; which: (c: string) => string \| null; logger: Logger }) => Git` | main.ts |
| `parseVersion`, `MIN_GIT` | None — new symbol | `"git version 2.39.3 (Apple Git-146)" → [2,39,3]`; `[2,31,0]` | git.test.ts |

**Existing Shape:** `src/workspace/system.ts:85-88`

```ts
type Launch = (argv: string[], o: { stdout: "ignore"; stderr: "ignore" }) => { exited: Promise<number> };
export async function openUrl(url, platform, spawn: Launch = Bun.spawn): Promise<void>
```

The project's precedent is an injectable argv spawn with a Bun default.

**Proposed Shape:**

```ts
const BASE = ["git", "--no-optional-locks", "--literal-pathspecs", "-c", "core.quotepath=off", "-c", "color.ui=false", "-c", "gc.auto=0"];
export function createGit(d: GitDeps): Git {
  const run = (cwd: string, args: string[], stdin?: string) => spawn([...BASE, ...args], { cwd, stdin });
  return {
    detect: /* which → --version gate → rev-parse --path-format=absolute --show-toplevel --git-dir --git-common-dir --show-prefix
               → symbolic-ref -q HEAD (branch | unborn) or rev-parse --short HEAD (detached) */,
    status: /* status --porcelain=v2 -z --branch -uall -- <prefix or .> → parseStatus; op from rebase-merge/rebase-apply/MERGE_HEAD */,
    readIndex: /* ls-files -s --eol --others --exclude-standard -- <p>: none → ignored; no stage → untracked;
                  stage>0 → conflicted; cat-file blob <oid> → normalizeIndexText */,
    stage: /* expectedOid null → add --intent-to-add -- <p>; else ls-files -s -- <p> oid ≠ expected → "stale";
              apply --cached --unidiff-zero --whitespace=nowarn - (stdin patch); exit ≠ 0 → throw Error(stderr line) */,
    blame: /* blame --porcelain --contents - -L <n>,+1 -- <p> (stdin contents) → parseBlame */,
  };
}
```

Every call goes through `BASE`, so lock-free reads (RF6) and literal pathspecs hold everywhere by construction. `stage` is the only method that writes the index, and only through `add --intent-to-add` and `apply --cached`. Tests drive real Git in temp repos with `GIT_CONFIG_NOSYSTEM=1` and `HOME` pointed at the temp dir. `bunGitSpawn` reads stdout and stderr fully and returns the exit code. A non-zero exit is turned into a thrown `Error`, which the runner converts into a failed action.

- **Invariants:**
  - No method other than `stage` writes `.git/index`.
  - No argv contains file contents.
- **Verification Coverage:** `S1`–`S5`, `S21`, `S24`–`S26`, `S30`; `V10`–`V13`, `V28`, `V29`, `V36`–`V39`, `V62`

## `src/workspace/git-watcher.ts`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** `W261005F2A7-REQ6@R2`, `W261005F2A7-REQ7@R2`
- **Responsibilities:** First-level watching of git directories.
- **Affected Callers/Consumers:** `src/app/effects.ts` (`gitWatch`), `src/app/main.ts`
- **Construction/Wiring:** Created lazily on the first `gitWatch`
- **Dependencies:** `node:fs` `watch`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `GitWatcher` | None — new symbol | `{ retarget(dirs: string[]): void; stop(): void }` | effects.ts |
| `watchGitDirs` | None — new symbol | `(dirs: string[], onChange: () => void, logger: Logger, watchFn = watch) => GitWatcher` | effects.ts |
| `IGNORED_NAME` | None — new symbol | `/(^|\/)(index\.lock|.*\.lock|\.watchman-cookie.*|COMMIT_EDITMSG)$/` | git-watcher.test.ts |

**Existing Shape:** `src/workspace/watcher.ts:91-93`

```ts
const w = watch(root, { recursive: true }, (_type, name) => { if (!name || matcher.isExcludedPath(name)) return; ... });
```

The workspace watcher is recursive and drops dot paths, so it cannot see `.git`.

**Proposed Shape:**

```ts
export function watchGitDirs(dirs: string[], onChange: () => void, logger: Logger, watchFn = watch): GitWatcher {
  // for each unique dir: try watchFn(dir, { recursive: false }, (_t, name) => !IGNORED_NAME.test(name ?? "") && onChange())
  // catch → logger.warn("git.watch.fail", { dir }) and skip
  // retarget: close watchers not in the new set, open the new ones
}
```

`dirs` from core are `[gitDir, commonDir, join(commonDir, "refs/heads", dirname(branch))]`, deduplicated. That covers worktrees (RF7) and branch names with `/`. Debounce stays in core, so `onChange` just dispatches `gitDirChanged`.

- **Invariants:**
  - A failing directory never throws to the caller.
  - Lock and cookie names never call `onChange`.
- **Verification Coverage:** `S22`, `S23`, `S25`; `V37`, `V38`

## `src/app/effects.ts`

- **Change:** Modify
- **Decisions:** DES1, DES4, DES6, DES7, DES9
- **Requirements:** `W261005F2A7-REQ1@R2`, `W261005F2A7-REQ2@R2`, `W261005F2A7-REQ6@R2`
- **Responsibilities:** Execute git effects; stage on `serial`.
- **Affected Callers/Consumers:** `main.ts`, `effects.test.ts`, `test/integration/helpers.ts` (`startApp`)
- **Construction/Wiring:** New deps: `git`, `tool`, `gitWatch` factory
- **Dependencies:** `Git`, `ToolHost`, `watchGitDirs`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `RunnerDeps` | `effects.ts:38-68` | adds `git: Git`, `tool: ToolHost`, `watchGit: (dirs, onChange) => GitWatcher` | main.ts, tests, startApp |
| `createEffectRunner` | `effects.ts:104` | cases for the 6 git effects | store |

**Existing Shape:** `src/app/effects.ts:107-115`

```ts
const serial = <T>(job: () => Promise<T>): Promise<T> => { const next = tail.then(job, job); tail = next.catch(() => {}); return next; };
```

Mutating file operations already share one promise chain.

**Proposed Shape:**

```ts
case "gitStage": void serial(() => d.git.stage(repo(), e)).then(
  (r) => d.dispatch({ type: "gitStaged", path: e.path, result: r }),
  (x) => d.dispatch({ type: "gitStaged", path: e.path, result: { failed: msg(x) } })); break;
case "runTool": void d.tool.run(e.argv, e.cwd).then((result) => d.dispatch({ type: "toolExited", result })); break;
case "gitWatch": (watcher ??= d.watchGit(e.dirs, () => d.dispatch({ type: "gitDirChanged" }))).retarget(e.dirs); break;
// gitStatus, gitReadIndex, gitBlame: free-running, one action each
```

`gitStage` joins `serial`, so it runs after the write that `saved` acknowledged and before any later write. `repo()` reads the current `RepoInfo` from the effect payload. The design puts `repoPath` and the needed directories in each effect, so the runner holds no Git state.

- **Invariants:**
  - Each git effect dispatches exactly one action.
- **Verification Coverage:** `S6`; `V40`, `V41`

## `src/app/tool-host.ts`

- **Change:** Add
- **Decisions:** DES9
- **Requirements:** `W261005F2A7-REQ2@R2`, `W261005F2A7-REQ3@R1`
- **Responsibilities:** Terminal hand-off orchestration.
- **Affected Callers/Consumers:** `effects.ts` (`runTool`)
- **Construction/Wiring:** `main.ts` after `installLifecycle`
- **Dependencies:** a structural `{ suspend; resume; resetForeignModes }` type matching `Shell`, so there is no UI import; `holdInterrupts`; spawn; `which`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ToolHost`, `ToolResult` | None — new symbol | `{ run(argv: string[], cwd: string): Promise<ToolResult> }` | effects.ts |
| `createToolHost` | None — new symbol | `(d: { screen: { suspend(): void; resume(): void; resetForeignModes(): void }; holdInterrupts: () => () => void; spawn?: ToolSpawn; which: (c) => string \| null; logger }) => ToolHost` | main.ts |

**Existing Shape:** `src/app/main.ts:356`

```ts
deps.exit = lifecycle.exitNow;
```

Late binding of deps that need the lifecycle is the established pattern.

**Proposed Shape:**

```ts
export function createToolHost(d: ToolDeps): ToolHost {
  return { async run(argv, cwd) {
    if (d.which(argv[0]) === null) return { kind: "missing", tool: argv[0] };
    const release = d.holdInterrupts();
    d.screen.suspend();
    try {
      const p = spawn(argv, { cwd, stdio: ["inherit", "inherit", "inherit"] });
      const code = await p.exited;
      return { kind: "exited", code, ...(p.signalCode && { signal: p.signalCode }) };
    } catch (x) { return { kind: "failed", reason: msg(x) }; }
    finally { d.screen.resetForeignModes(); d.screen.resume(); release(); }
  } };
}
```

The `finally` block guarantees mode reset, resume, and interrupt release on every path, including a thrown spawn and a killed child (RF11, RF12). `FOREIGN_MODES_RESET` lives in `src/ui/shell.ts` and is written by `screen.resetForeignModes()`, so the escape bytes stay in the UI layer; `main.ts` passes the shell as `screen`.

- **Invariants:**
  - `resume` and `release` run exactly once per `suspend`.
- **Verification Coverage:** `S12`–`S16`; `V30`, `V33`, `V34`, `V50`

## `src/app/lifecycle.ts`

- **Change:** Modify
- **Decisions:** DES9
- **Requirements:** `W261005F2A7-REQ2@R2`
- **Responsibilities:** Ignore SIGINT while held.
- **Affected Callers/Consumers:** `main.ts`
- **Construction/Wiring:** Return value gains `holdInterrupts`
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `installLifecycle` | `lifecycle.ts:66-70` returns `{ exitNow }` | returns `{ exitNow, holdInterrupts: () => () => void }`; the SIGINT handler returns early while held > 0 | main.ts |

**Existing Shape:** `src/app/lifecycle.ts:66-70`

```ts
for (const signal of ["SIGTERM", "SIGHUP", "SIGINT"] as const)
  process.on(signal, () => void shutdown(0, true));
```

SIGINT is bound to shutdown for the whole session.

**Proposed Shape:**

```ts
let held = 0;
for (const signal of ["SIGTERM", "SIGHUP", "SIGINT"] as const)
  process.on(signal, () => { if (signal === "SIGINT" && held > 0) return; void shutdown(0, true); });
return { exitNow: (code) => void shutdown(code, false),
  holdInterrupts: () => { held++; let done = false; return () => { if (!done) { done = true; held--; } }; } };
```

The counter makes `holdInterrupts` re-entrant, and the release is idempotent. SIGTERM and SIGHUP still shut down while the tool runs.

- **Invariants:**
  - Releasing twice never makes `held` negative.
- **Verification Coverage:** `S13`; `V42`

## `src/app/main.ts`

- **Change:** Modify
- **Decisions:** DES8, DES9, DES11
- **Requirements:** `W261005F2A7-REQ2@R2`, `W261005F2A7-REQ7@R2`
- **Responsibilities:** Construction and deferred discovery.
- **Affected Callers/Consumers:** None — composition root
- **Construction/Wiring:** See §5 Construction and Wiring Flow
- **Dependencies:** `createGit`, `createToolHost`, `watchGitDirs`, git registries

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `registries` | `main.ts:131-172` | merges `gitCommands`, `gitBindings`, `gitGroups` | store |
| startup block | `main.ts:361-390` | adds `git.detect(ws.root).then(dispatch gitDetected)` | — |
| deps | `main.ts:307-325` | adds `git`, `tool`, `watchGit` | runner |

**Existing Shape:** `src/app/main.ts:370-377`

```ts
void detectTrash({...}).then((trash) => { deps.trash = trash; store.dispatch({ type: "trashAvailable", available: trash.available }); });
```

Deferred detection followed by an announcing action is the template.

**Proposed Shape:**

```ts
void git.detect(ws.root).then((r) => store.dispatch({ type: "gitDetected", ...r }));
```

Discovery stays off the first-frame path. The watcher is created by the runner on the first `gitWatch`.

- **Invariants:**
  - No git process before `setImmediate`.
- **Verification Coverage:** `S26`; `V39`, `V53` (bench gate firstFrame unchanged)

## `src/ui/shell.ts`

- **Change:** Modify
- **Decisions:** DES9, DES11
- **Requirements:** `W261005F2A7-REQ2@R2`, `W261005F2A7-REQ4@R2`
- **Responsibilities:** Suspend and resume, paint guard, foreign-mode reset, hunk overlay registration.
- **Affected Callers/Consumers:** `main.ts`, `test/support/ui.ts` (mounted shell)
- **Construction/Wiring:** `HunkView` joins the overlay list (`shell.ts:142-150`)
- **Dependencies:** OpenTUI `CliRenderer.suspend/resume` (`node_modules/@opentui/core/renderer.d.ts:590-591`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Shell` | `shell.ts:85-92` `{ attach; copyOsc52; destroy }` | adds `suspend(): void; resume(): void; resetForeignModes(): void` | main.ts, test shell |
| `paint` | `shell.ts:189-203` repaints on every dispatch, syncing `useMouse` | returns early while suspended; `resume()` calls `repaint()` | — |
| `FOREIGN_MODES_RESET` | None — new symbol | `"\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1005l\x1b[?1006l\x1b[?1015l\x1b[?1004l\x1b[?2004l\x1b[<99u\x1b[>4;0m\x1b[0m\x1b[?25h"` | resetForeignModes |

**Existing Shape:** `src/ui/shell.ts:189-193`

```ts
const paint = (s: AppState) => {
  for (const v of views) v.update(s, lc);
  if (renderer.useMouse !== s.config.mouse) renderer.useMouse = s.config.mouse;
```

Any dispatch repaints and re-enables the mouse if config wants it. That is unsafe while the tool owns the terminal.

**Proposed Shape:**

```ts
let suspended = false;
const paint = (s: AppState) => { if (suspended) return; /* existing */ };
suspend: () => { suspended = true; renderer.suspend(); },
resume: () => { renderer.resume(); suspended = false; repaint(); },
resetForeignModes: () => process.stdout.write(FOREIGN_MODES_RESET),
```

The flag closes the mouse leak. `resetForeignModes` turns off every mouse mode, focus tracking, and bracketed paste. It also pops up to 99 kitty keyboard flag entries, resets modifyOtherKeys and SGR, and shows the cursor. `resume()` then re-applies only so's own modes (RF11). It runs while still in cooked mode, before `resume`.

- **Invariants:**
  - No terminal write from `paint` while suspended.
- **Verification Coverage:** `S14`, `S15`, `S31`; `V33`, `V50`, `V60`, `V61`

## `src/ui/editors/text-view.ts`, `src/ui/views/statusline.ts`, `src/ui/views/explorer.ts`, `src/ui/overlays/hunk.ts`, `src/ui/theme.ts`

- **Change:** Modify (first four are existing except `hunk.ts`: Add)
- **Decisions:** DES10, DES11
- **Requirements:** `W261005F2A7-REQ4@R2`
- **Responsibilities:** Paint git data.
- **Affected Callers/Consumers:** Shell views
- **Construction/Wiring:** `HunkView` registered in `shell.ts`
- **Dependencies:** `hunkSigns`, `explorerMarkers`, `StatusSegments.git`, theme tokens

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `EditorView.layoutFrame` | `text-view.ts:667-672` providers `[highlight, ...spec, search, selection]` | appends `hunkSigns(s.git.files[b.path]?.hunks ?? [])` last when `s.git.repo` | — |
| statusline segments | `statusline.ts:89-140` | adds a `git` seg after `path`; first in the drop list `[git, preview, words, view]` | — |
| explorer row | `explorer.ts:299-315` | after the name (and `●`), a one-cell marker with a `git*` token | — |
| `HunkView` | None — new symbol | float via `drawFrame` (`src/ui/overlays/host.ts:14-50`), lines with `diffDel` for `oldLines` and `diffAdd` for the new lines | shell.ts |
| theme tokens | `theme.ts:206-232` | adds `gitAdd`, `gitChange`, `gitDelete`, `gitTopDelete`, `gitChangeDelete`, `gitUntracked`, `gitConflict`, `gitStaged`, `gitBranch` | views |

**Existing Shape:** `src/ui/editors/text-view.ts:667-672`

```ts
const providers = [highlightMarks(ft?.highlighter), ...(spec?.decorations ?? []), searchMarks(s.vim.search), selectionMarks(selection)];
```

State-derived providers are constructed in the UI from `s`, the same way `searchMarks` is.

**Proposed Shape:**

```ts
const git = s.git.repo ? [hunkSigns(s.git.files[b.path]?.hunks ?? [])] : [];
const providers = [highlightMarks(ft?.highlighter), ...(spec?.decorations ?? []), searchMarks(s.vim.search), selectionMarks(selection), ...git];
```

Git comes last, so its sign wins (`src/core/kernel/view/text-view.ts:98-101`). Outside a repository the provider list is unchanged, so existing snapshots are stable. The gutter width is unchanged, because the one-cell sign column already exists (`text-view.ts:50-52`, `:549-556`).

- **Invariants:**
  - Without a repository, rendering is byte-identical to today.
- **Verification Coverage:** `S7`, `S9`, `S10`; `V44`–`V47`

## Migration and Delivery

- **Database or Schema Migration:** None — no persisted data changes. The `git` config section is optional with defaults.
- **Data Backfill:** None — nothing stored.
- **Mixed-Version Compatibility:** None — single binary. Git older than 2.31 is handled at runtime by `detect` (`V29`).
- **Feature Flags:** None — the feature is inert outside a repository and costs nothing until `gitDetected`.
- **Rollout Constraints:** None — ships in one PR on `feat/w261005f2a7-git-integration`.
- **Rollback:** Revert the PR. No data compatibility concern.

# 8. Testing and Verification

## Design Success Criteria

| ID | Observable Success Condition | Traceability |
|---|---|---|
| `S1` | Staging one of two hunks leaves exactly that hunk in `git diff --cached` and the other in `git diff` | REQ1, DES4 |
| `S2` | Staging a hunk of an untracked file makes `git status` show it `AM` with only that hunk staged | REQ1, DES4 |
| `S3` | When the index entry changed after hunks were computed, stage applies nothing and reports `stale` | REQ1, DES4 |
| `S4` | Stage in a conflicted file emits no `gitStage` and shows a notice | REQ1, DES4 |
| `S5` | In a CRLF or `autocrlf=true` repo, one edited line stages as exactly one line | REQ1, REQ5, DES3, DES4 |
| `S6` | Reset replaces the hunk with index lines in one undo step and restores the EOF newline flag; no Git process runs | REQ1, DES5 |
| `S7` | Each hunk kind yields its distinct sign on the right line; navigation stops at ends | REQ4, REQ5, DES2, DES10 |
| `S8` | A changed line inside a block-replaced region shows a sign on the block row | REQ4, DES10 |
| `S9` | Explorer shows the correct marker per file and `contains` on ancestor folders, including per-file untracked inside new folders | REQ4, DES10 |
| `S10` | Statusline shows ref (branch / unborn / short SHA), `rebasing`/`merging`, counts, and drops first on narrow terminals | REQ4, DES10 |
| `S11` | Blame shows author/date/summary, or "not committed yet" for zero SHA, both sentinels, untracked, unborn | REQ4, DES11 |
| `S12` | While the tool runs, nothing is drawn and no keys reach the store | REQ2, DES9 |
| `S13` | SIGINT during the tool does not exit so; SIGTERM still does | REQ2, DES9 |
| `S14` | After exit, crash, or kill, so's modes are restored and the screen repaints; foreign modes are off | REQ2, DES9 |
| `S15` | No mouse-enable sequence is written while suspended, even if actions dispatch | REQ2, DES9 |
| `S16` | A missing tool or no repository yields a notice and no suspend | REQ3, DES9 |
| `S17` | `git.tool` accepts a non-empty string array; `[]` and non-strings are config errors | REQ3, DES11 |
| `S18` | Index text normalization makes identical content compare equal across BOM/CRLF; BOM-only difference marks only line 0 | REQ5, DES3 |
| `S19` | Typing runs no Git process; the diff runs once per 100 ms quiet period; an all-changed 5,000-line diff is bounded | REQ5, DES2 |
| `S20` | Own saves, stage, tool exit, file changes, and git-dir changes each lead to one coalesced status run | REQ6, DES6 |
| `S21` | No Git call by so modifies `.git/index` mtime | REQ6, DES6 |
| `S22` | A commit in another process updates state within 1 s; lock/cookie names never trigger refresh | REQ6, DES7 |
| `S23` | A watcher start failure is logged and other triggers still refresh | REQ6, DES7 |
| `S24` | Workspace subfolder: status paths are workspace-relative; outside-prefix changes are ignored | REQ7, DES6 |
| `S25` | Linked worktree: changes in both its git dir and common dir refresh | REQ7, DES7 |
| `S26` | No git / not a repo is silent; Git < 2.31 shows one notice; unborn repos work | REQ7, DES8 |
| `S27` | Opening the tool writes every dirty buffer first | REQ8, DES9 |
| `S28` | A failed save cancels the tool launch with a notice naming the file | REQ8, DES9 |
| `S29` | Stage in a dirty buffer saves, then stages the saved text; a failed save stages nothing | REQ9, DES4 |
| `S30` | The adapter issues only the allowed subcommands (`--version`, `rev-parse`, `symbolic-ref`, `status`, `ls-files`, `cat-file`, `blame`, `add --intent-to-add`, `apply --cached`); patch and buffer contents travel only on stdin | REQ1, DES1, DES4 |
| `S31` | After `resume()`, every image visible before suspend is drawn again | REQ2, DES9 |

## Test Suites and Cases

```text
src/core/features/git/
├── diff.test.ts [Unit]
│   Purpose: hunk computation and bounds
│   SUT: diffLines
│   Infra: None
│   Doubles: None
│   ├── V1 one changed line, one added line, one deleted line in a 10-line text
│   │   ├── Expect: hunks [change@2, add@5, delete anchored@7] with correct old/new ranges [S7]
│   │   └── Unique risk: wrong grouping or off-by-one ranges
│   ├── V2 deletion at top and change-with-extra-deletion
│   │   ├── Expect: kinds "topdelete" and "changedelete" [S7]
│   │   └── Unique risk: misclassified kinds
│   ├── V3 untracked option
│   │   ├── Expect: one "untracked" hunk covering all lines [S7]
│   │   └── Unique risk: untracked shown as added
│   └── V4 5,000 lines where no line matches; and 5,000 lines with D > MAX_EDIT
│       ├── Expect: one change hunk covering the trimmed middle; returns in < 50 ms [S19]
│       └── Unique risk: unbounded Myers stalls typing
├── signs.test.ts [Unit]
│   Purpose: sign mapping and navigation
│   SUT: hunkSigns, hunkAt, nextHunkLine, prevHunkLine
│   Infra: None
│   Doubles: None
│   ├── V5 each kind produces its GIT_SIGNS entry on its anchor line, only for visible lines
│   │   ├── Expect: decorations equal expected list [S7]
│   │   └── Unique risk: wrong anchor for delete/topdelete
│   └── V6 next/prev from inside, before, after hunks
│       ├── Expect: first line of adjacent hunk; undefined at ends [S7]
│       └── Unique risk: wrap-around or skipping
├── index-text.test.ts [Unit]
│   Purpose: normalization round-trip
│   SUT: normalizeIndexText
│   Infra: None
│   Doubles: None
│   ├── V7 CRLF with final newline, LF without final newline, BOM
│   │   ├── Expect: lines/finalNewline/bom/eol fields; rejoin equals input [S18]
│   │   └── Unique risk: every-line-changed on CRLF
│   └── V8 equal content LF index vs CRLF buffer through diffLines
│       ├── Expect: zero hunks [S18]
│       └── Unique risk: EOL mismatch not normalized on one side
├── status.test.ts [Unit]
│   Purpose: porcelain v2 parse and markers
│   SUT: parseStatus, explorerMarkers
│   Infra: None
│   Doubles: None
│   ├── V14 fixture with "1 .M", "2 R. ... \0orig", "u", "? notes/new/x.md", submodule "S.M.", paths outside prefix, "# branch.head (detached)"
│   │   ├── Expect: workspace-relative keys only; rename keeps new path; submodule single entry; head detached [S24, S9]
│   │   └── Unique risk: prefix stripping, rename field consumption
│   ├── V15 statusSegments counts from hunks (change 3→1 lines)
│   │   ├── Expect: changed 1, removed 2 [S10]
│   │   └── Unique risk: count rule drift from gitsigns
│   ├── V16 markers precedence conflict > deleted > untracked > modified > staged
│   │   ├── Expect: one marker per path [S9]
│   │   └── Unique risk: ambiguous marker
│   └── V17 ancestor folders of marked files
│       ├── Expect: "contains" on each ancestor without own marker [S9]
│       └── Unique risk: folder aggregation missing nested paths
├── patch.test.ts [Unit]
│   Purpose: exact patch text
│   SUT: hunkPatch
│   Infra: None
│   Doubles: None
│   └── V22 change hunk at EOF with no final newline on index side; CRLF index; insert hunk header numbering
│       ├── Expect: exact strings incl. "\ No newline at end of file", "\r" suffixes, "@@ -4,0 +5,1 @@" [S5]
│       └── Unique risk: malformed patch rejected by git apply
└── blame.test.ts [Unit]
    Purpose: blame parse
    SUT: parseBlame
    Infra: None
    Doubles: None
    └── V24 committed line; zero SHA "Not Committed Yet"; "External file (--contents)" / "<external.file>"
        ├── Expect: committed fields; committed:false for both sentinels [S11]
        └── Unique risk: post-2.41 sentinel shown as an author

src/core/kernel/view/text-view.test.ts [Unit]
└── V9 block replace over lines 3–6 with a line sign on 5
    ├── Expect: replace row carries that sign; rows without signs unchanged [S8]
    └── Unique risk: git signs invisible inside rendered blocks

src/core/state/git.test.ts [Unit]
│   Purpose: reducer decisions and continuations
│   SUT: update (createUpdate with testRegistries)
│   Infra: None
│   Doubles: None (effects asserted as data)
├── V10 stageHunk on clean tracked buffer
│   ├── Expect: one gitStage effect with expectedOid = index oid and patch = hunkPatch(...) [S1]
│   └── Unique risk: wrong hunk chosen at cursor
├── V11 stageHunk on untracked buffer
│   ├── Expect: gitStage with expectedOid null [S2]
│   └── Unique risk: untracked not marked for intent-to-add
├── V12 gitStaged "stale"
│   ├── Expect: notice "index changed; hunks refreshed", gitReadIndex + gitRefresh timer [S3]
│   └── Unique risk: silent stale stage outcome
├── V13 stageHunk on conflicted entry
│   ├── Expect: no gitStage; message [S4]
│   └── Unique risk: index entry rewritten on conflict
├── V18 typing in a repo buffer
│   ├── Expect: startTimer gitDiff:<id> 100 each keystroke, no git effect; timer → hunks updated [S19]
│   └── Unique risk: git process per keystroke / missing debounce
├── V19 saved, fileChanged, gitDirChanged, toolExited
│   ├── Expect: each yields startTimer gitRefresh 200; timer → one gitStatus [S20]
│   └── Unique risk: missed trigger
├── V20 stageHunk on dirty buffer then saved / saveFailed
│   ├── Expect: write effect first; after saved → gitStage; after saveFailed → message, pending cleared, no gitStage [S29]
│   └── Unique risk: staging unsaved text or hanging pending
├── V21 second stage/tool while pending
│   ├── Expect: message "another operation is running"; no effects [S27]
│   └── Unique risk: overlapping continuations
├── V23 resetHunk change at EOF with finalNewline differing
│   ├── Expect: buffer lines = index lines, finalNewline = index flag, one undo entry, no git effect; `u` restores lines [S6]
│   └── Unique risk: reset not undoable or touches Git
├── V25 BOM differs only
│   ├── Expect: single change hunk on line 0 [S18]
│   └── Unique risk: BOM ignored or every line changed
├── V26 onGitStatus with head change to branch "feature/x" and index-side change on an open file
│   ├── Expect: gitWatch with new branch dir; gitReadIndex for that file only [S20, S22]
│   └── Unique risk: stale index blob or stale watch dir
├── V27 gitStatus result after repo became null
│   ├── Expect: state unchanged [S20]
│   └── Unique risk: late result resurrects git UI
├── V31 openTool with two dirty buffers
│   ├── Expect: two write effects; after both saved → runTool { argv: config.git.tool, cwd: repo.top } [S27]
│   └── Unique risk: tool sees unsaved text
├── V32 openTool with one failing save / one blocked (read-only)
│   ├── Expect: no runTool; message names the file [S28]
│   └── Unique risk: launch with lost edits or pending hang
├── V34 openTool without repo; toolExited missing
│   ├── Expect: "not a git repository"; "<tool> not found (git.tool)" [S16]
│   └── Unique risk: silent no-op
└── V35 toolExited exited
    ├── Expect: gitRefresh timer, read effect per open buffer, gitReadIndex per open buffer [S12, S20]
    └── Unique risk: stale buffers after checkout

src/core/config/schema.test.ts [Unit]
└── V43 git.tool ["gitui"], [], [1], missing section
    ├── Expect: ok / error / error / default ["lazygit"] [S17]
    └── Unique risk: invalid argv reaches spawn

src/workspace/git.test.ts [Integration]
│   Purpose: real git CLI contract
│   Real: createGit with Bun spawn
│   Infra: filesystem, git ≥ 2.31 (temp repos via test/support/git-repo.ts, GIT_CONFIG_NOSYSTEM=1, HOME=tmp)
│   Doubles: recording GitSpawn (V62 only)
├── V28 detect from subfolder, from linked worktree, in unborn repo
│   ├── Expect: prefix "notes/", commonDir ≠ gitDir for worktree, head unborn "main" [S24, S25, S26]
│   └── Unique risk: discovery wrong for real layouts
├── V29 detect with stub spawn returning "git version 2.20.1" and with which → null
│   ├── Expect: repo null with notice naming 2.20.1; repo null silent [S26]
│   └── Unique risk: version gate parse (Apple suffix)
├── V36 stage one of two hunks; untracked stage; CRLF autocrlf stage
│   ├── Expect: git diff --cached shows exactly the hunk; status AM; one line staged [S1, S2, S5]
│   └── Unique risk: patch/flags rejected by real git
├── V37 stage after index changed externally (expectedOid stale)
│   ├── Expect: returns "stale"; index unchanged [S3]
│   └── Unique risk: misplaced zero-context apply
├── V38 status, readIndex, blame leave .git/index mtime unchanged
│   ├── Expect: mtime equal before/after [S21]
│   └── Unique risk: optional locks rewrite index → watcher loop
├── V39 readIndex ignored / untracked / conflicted; blame --contents with unsaved line
│   ├── Expect: kinds match; blame of new line committed:false [S11, S26]
│   └── Unique risk: entry classification on real output
└── V62 every Git method driven through a recording GitSpawn
    ├── Expect: each recorded argv[1..] starts with an allowed subcommand; no argv element contains "\n" or the patch/contents; patch and contents equal the recorded stdin [S30]
    └── Unique risk: a mutating or shell-interpreted command, or file contents leaking into argv

src/workspace/git-watcher.test.ts [Integration]
│   Purpose: multi-dir first-level watching
│   Real: watchGitDirs with fs.watch
│   Infra: filesystem, git
│   Doubles: watchFn throwing (V38b only)
├── V54 commit in temp repo (gitDir) and in linked worktree (gitDir + commonDir)
│   ├── Expect: onChange called ≥ 1 within 1 s; never for index.lock-only writes [S22, S25]
│   └── Unique risk: missed worktree common dir or lock noise
└── V55 watchFn throws for one dir; retarget to new set
    ├── Expect: logger.warn git.watch.fail; other dir still notifies; closed watchers silent [S23]
    └── Unique risk: start failure crashes or leaks watchers

src/app/tool-host.test.ts [Unit]
│   Purpose: hand-off ordering and finally-guarantees
│   SUT: createToolHost
│   Infra: None
│   Doubles: screen, holdInterrupts, spawn, which, write (true boundaries)
├── V30 normal exit
│   ├── Expect: order hold → suspend → spawn(cwd) → write(reset) → resume → release; result exited 0 [S12, S14]
│   └── Unique risk: resume before reset or missing release
├── V33 spawn throws; child exit with signal SIGKILL
│   ├── Expect: write/resume/release each once; result failed / exited{signal} [S14]
│   └── Unique risk: terminal left suspended after crash
└── V59 which → null
    ├── Expect: { kind: "missing" }; no suspend, no hold [S16]
    └── Unique risk: suspend with nothing to run

src/app/lifecycle.test.ts [Unit]
└── V42 hold → emit SIGINT → no shutdown; release → SIGINT → shutdown; double release; SIGTERM while held → shutdown
    ├── Expect: shutdown call counts 0,1; held never negative [S13]
    └── Unique risk: Ctrl-C in lazygit kills so

src/app/effects.test.ts [Unit]
├── V40 write then gitStage queued
│   ├── Expect: git.stage invoked only after the write promise resolves [S29, S1]
│   └── Unique risk: stage before save lands
└── V41 runTool and gitWatch dispatch
    ├── Expect: toolExited dispatched with host result; gitWatch reuses one watcher and retargets [S12, S20]
    └── Unique risk: runner wiring drops result

test/integration/git.test.ts [Integration]
│   Purpose: end-to-end refresh with real runner, store, watcher, git
│   Real: startApp + createGit + watchGitDirs
│   Infra: filesystem, git
│   Doubles: tool host (stub returning exited 0 after running a git checkout)
├── V56 external commit while app runs
│   ├── Expect: statusSegments.git ref and explorer markers update within 1 s [S22]
│   └── Unique risk: wiring between watcher, timer, status
├── V57 edit + save + stage via commands
│   ├── Expect: git diff --cached contains the typed line; buffer clean [S29]
│   └── Unique risk: continuation across real save and serial queue
└── V58 stub tool performs checkout of an open clean file
    ├── Expect: buffer shows new content, no conflict overlay, hunks recomputed [S12, S27]
    └── Unique risk: post-tool re-read path

test/ui/git.test.ts [Integration]
│   Purpose: rendering of git surfaces
│   Real: mountShell with test renderer
│   Infra: None
│   Doubles: state seeded with GitState
├── V44 gutter signs for every kind, color on and color=never
│   ├── Expect: snapshot shows distinct glyphs per kind [S7]
│   └── Unique risk: kinds indistinguishable without color
├── V45 statusline narrow (<100 cols) and wide, detached + rebasing
│   ├── Expect: git seg dropped first when narrow; "a1b2c3d (rebasing)" when wide [S10]
│   └── Unique risk: segment crowds path
├── V46 explorer markers incl. expanded new folder
│   ├── Expect: markers after names; "contains" on folder [S9]
│   └── Unique risk: marker misplaced or missing for nested
├── V47 gitHunk overlay open/close (Esc, q, click outside)
│   ├── Expect: overlay shows oldLines/newLines with diff tokens; closes [S7]
│   └── Unique risk: overlay key/mouse gates missing
└── V60 shell suspend() then resume() with an image widget visible (recording drawImage)
    ├── Expect: drawImage is called again for that image after resume; no terminal writes between suspend and resume [S31, S15]
    └── Unique risk: images stay blank after returning from the tool

test/e2e/git-tool.test.ts [E2E]
│   Purpose: real terminal hand-off
│   Real: compiled-free `bun src/app/main.ts` in runInPty (@xterm/headless)
│   Infra: PTY, filesystem, git
│   Doubles: git.tool = a script that enables ?1003h mouse, prints, then kill -9 itself
└── V50 <leader>gg → stub tool → killed
    ├── Expect: so screen restored (statusRow visible), no ?1003 mode active in xterm state, Ctrl-C sent during tool did not exit so [S13, S14, S15]
    └── Unique risk: real terminal state after abnormal exit

test/bench/git-diff.bench.ts [Bench]
└── V51 typing in a 5,000-line note whose every line differs from index
    ├── Expect: gitDiffKeystrokeP95 ≤ 24 ms target (gate fails at 2x) [S19]
    └── Unique risk: diff cost leaks into keystroke path

Non-test verification
├── V52 Type/build check — `bun run check` (biome, tsc --noEmit, knip, unit tests) passes; `bun run build` produces dist/so
│   ├── Expect: zero errors; knip zero findings [S1–S29]
│   └── Unique risk: exhaustive-switch gaps, unused exports
├── V53 Bench gate — `bun run bench` firstFrame and keystroke targets unchanged
│   ├── Expect: no regression beyond gate [S19, S26]
│   └── Unique risk: git work on first-frame path
├── V61 Manual check in Ghostty and kitty — open a note with an image, run `<leader>gg` with lazygit, quit
│   ├── Expect: the image is visible again and the mouse works [S31, S14]
│   └── Unique risk: real-terminal graphics protocol behaviour that headless xterm cannot emulate
├── Obsolete-reference: None — nothing removed
├── Migration: None — no persisted data
├── Configuration: V43 covers schema; project.md documents `[git] tool`
└── Observability: V29 / V55 assert `git.fail` / `git.watch.fail` log entries via a recording logger
```

## Coverage Balance

Unit suites prove the algorithms (diff, normalize, patch, parse, markers) and the reducer decisions without Git. Real-Git integration (`src/workspace/git.test.ts`) proves only what the CLI must accept: flags, patches, lock-freedom, and discovery on real layouts. `test/integration/git.test.ts` proves wiring once per distinct flow (refresh, stage continuation, post-tool reload). The one E2E case covers what no lower level can: real terminal modes after a killed child, and SIGINT through a PTY. UI snapshots cover only presentation surfaces. No case repeats a lower-level proof.

## Test Quality Rules

- **Unit:** One behavior per case. Reducer tests assert state and effect data, and the ToolHost tests assert call order only because the order is contractual (reset before resume, release last).
- **Integration/Contract:** Real `git` in isolated temp repos (`GIT_CONFIG_NOSYSTEM=1`, `HOME` set to the temp dir, `user.email` set, `init.defaultBranch=main`). Cleanup removes temp dirs, and processes are awaited.
- **Non-test:** `V52`, `V53`, and configuration and observability as listed. Obsolete-reference and migration are `None` with reasons.

# 9. Finalized Design Decisions

## W261005F2A7-DES1: Git state lives in core, Git processes in one workspace adapter

**Question:** Where do Git state, decisions, and processes live?

**Decision:**

- `AppState.git: GitState` is owned by `src/core/state/git.ts`.
- Pure algorithms live in `src/core/features/git/`.
- Every Git process runs through `createGit` in `src/workspace/git.ts`.
- The effect runner gains `git`, `tool`, and `watchGit` deps, and each Git effect answers with one action.

**Requirements Addressed:** All current revisions

**Research Support:** `RF1` evaluated `W261005F2A7-REQ5@R1` and informed `@R2` (gitsigns' in-process diff over adapter reads)

**Rationale:** This matches the project's one-way protocol and layer rules (`test/boundaries.test.ts:16-42`). It makes every decision unit-testable without Git, and puts the lock-free base argv in one place.

**Code Impact:**

- `src/core/state/types.ts` — `GitState`, unions — new members
- `src/core/state/git.ts` — handlers — new
- `src/workspace/git.ts` — `createGit` — new
- `src/app/effects.ts` — `RunnerDeps`, cases — new deps and cases

**Detailed Design:** §7 `src/core/state/types.ts`, `src/core/state/git.ts`, `src/workspace/git.ts`, `src/app/effects.ts`

**Tradeoffs:**

- Rejected a JS Git library: it would mean a new dependency and diverge from the CLI that lazygit uses.
- Rejected parsing in the adapter only: core-side parsers keep edge cases pure-testable.

**Success Criteria:** `S1`–`S29` (structural)

**Verification Impact:**

- `V52` typecheck/knip prove the unions and exports are consistent.

## W261005F2A7-DES2: Hunks come from an in-repo bounded Myers diff on normalized lines

**Question:** How are hunks computed within the keystroke budget?

**Decision:**

- `diffLines` trims the common prefix and suffix.
- It returns one change hunk when the middle shares no line.
- Otherwise it runs Myers capped at `MAX_EDIT = 2000`, falling back to one change hunk.
- A central wrapper hook starts `gitDiff:<id>` (100 ms) on text-version changes.
- Commands recompute hunks synchronously.

**Requirements Addressed:** `W261005F2A7-REQ5@R2`, `W261005F2A7-REQ4@R2`

**Research Support:** `RF14` evaluated `W261005F2A7-REQ5@R1` and informed `@R2` (0.02–6 ms normal, 0.3–5 s worst case without a cap); `RF1` (100 ms debounce)

**Rationale:**

- Normal edits cost under a millisecond.
- The cap and the no-common-line check bound the worst case.
- An in-repo implementation of about 100 lines avoids a new pin and the CJS interop risk RF14 found in `diff-sequences`.
- The central hook catches every edit site.

**Code Impact:**

- `src/core/features/git/diff.ts` — `diffLines` — new
- `src/core/state/update.ts` — wrapper, `onTimerAction` — diff timer

**Detailed Design:** §7 `src/core/features/git/diff.ts`, `src/core/state/update.ts`

**Tradeoffs:**

- Hunk boundaries may differ from xdiff in ambiguous spots. Staging stays correct because patches come from so's own hunks.
- No worker. The cap makes it unnecessary, and a worker costs build-entrypoint changes.

**Success Criteria:** `S7`, `S19`

**Verification Impact:**

- `V1`–`V4` exact hunks and the bound; `V18` debounce effects; `V51` keystroke P95.

## W261005F2A7-DES3: Index entries are read with ls-files and cat-file, then normalized

**Question:** How does so obtain and represent the index side?

**Decision:**

- `readIndex` runs `ls-files -s --eol --others --exclude-standard -- <p>` to classify the entry (ignored, untracked, conflicted, tracked with oid, mode, and `i/` EOL).
- For tracked entries it then runs `cat-file blob <oid>`.
- `normalizeIndexText` mirrors `splitFile`, recording `bom`, `eol`, and `finalNewline`.
- Reads happen for open buffers on load, on status changes to that path, and after the tool exits.

**Requirements Addressed:** `W261005F2A7-REQ5@R2`, `W261005F2A7-REQ1@R2`

**Research Support:** `RF1`, `RF4` evaluated `W261005F2A7-REQ5@R1` and informed `@R2`; `RF4` evaluated `W261005F2A7-REQ1@R1` and informed `@R2`

**Rationale:** This is the gitsigns read path. Normalizing the index to the buffer's model makes identical content equal, and the recorded form lets patches be written back exactly.

**Code Impact:**

- `src/core/features/git/index-text.ts` — `normalizeIndexText` — new
- `src/workspace/git.ts` — `readIndex` — new

**Detailed Design:** §7 `src/core/features/git/index-text.ts`, `src/workspace/git.ts`

**Tradeoffs:**

- `.gitattributes` filters other than EOL (LFS, `ident`) are not modelled, matching gitsigns. Such files show as changed. This is accepted.

**Success Criteria:** `S5`, `S18`

**Verification Impact:**

- `V7`, `V8`, `V25` normalization; `V39` real classification.

## W261005F2A7-DES4: Stage hunk is a save-gated, oid-guarded serial effect

**Question:** How does stage avoid unsaved text, wrong positions, and untracked failures?

**Decision:**

- `stageHunk` uses `GitPending { op: "stage" }` to save a dirty buffer first.
- It then recomputes hunks and builds `hunkPatch` in index form.
- It emits `gitStage { expectedOid }` on the runner's `serial` queue.
- The adapter runs `add --intent-to-add` for untracked files.
- For tracked files it compares the `ls-files` oid with `expectedOid` and returns `stale` on mismatch.
- Otherwise it applies with `--cached --unidiff-zero --whitespace=nowarn`.
- Conflicted entries are refused in core.

**Requirements Addressed:** `W261005F2A7-REQ1@R2`, `W261005F2A7-REQ9@R1`

**Research Support:** `RF2`, `RF3` evaluated `W261005F2A7-REQ1@R1` and informed `@R2`; `RF2`, `RF3` evaluated and retained `W261005F2A7-REQ9@R1`

**Rationale:**

- The pending gate reuses the proven quit-after-save shape.
- The oid check shrinks RF3's silent-misplacement window to milliseconds.
- `serial` orders stage after the acknowledged write.

**Code Impact:**

- `src/core/state/git.ts` — `stageHunk`, `advanceGitPending`, `onGitStaged` — new
- `src/core/features/git/patch.ts` — `hunkPatch` — new
- `src/core/state/save.ts` — `onSaved`, `onSaveFailed`, `blocked` — modified
- `src/workspace/git.ts` — `stage` — new

**Detailed Design:** §7 `src/core/state/git.ts`, `src/core/features/git/patch.ts`, `src/core/state/save.ts`, `src/workspace/git.ts`

**Tradeoffs:**

- The check-then-apply is not atomic. The remaining window is milliseconds, which is accepted (RF3).
- Rejected the `hash-object` + `update-index --cacheinfo` alternative. It writes whole blobs and needs the same guard, and it has more write paths.

**Success Criteria:** `S1`–`S5`, `S29`

**Verification Impact:**

- `V10`–`V13`, `V20`–`V22` reducer and patch; `V36`, `V37` real git; `V40` queue order; `V57` end-to-end.

## W261005F2A7-DES5: Reset hunk is one applyBufferEdits step

**Question:** How is reset applied without touching Git?

**Decision:**

- `resetHunk` builds one `SpanEdit` replacing the hunk's new-side lines with `oldLines`.
- It applies the edit through `applyBufferEdits` (`src/core/state/buffers.ts:182-237`), which gives one undo step and autosave scheduling.
- A `stale` result becomes a notice.
- When the hunk touches EOF and the newline flags differ, it sets `finalNewline` to the index flag via `setBuffer`.

**Requirements Addressed:** `W261005F2A7-REQ1@R2`

**Research Support:** `RF5` evaluated `W261005F2A7-REQ1@R1` and informed `@R2`

**Rationale:** This is the existing single-undo edit path with an `expected`-text guard. It matches gitsigns' `set_lines` reset, and saving stays in the normal path.

**Code Impact:**

- `src/core/state/git.ts` — `resetHunk` — new

**Detailed Design:** §7 `src/core/state/git.ts`

**Tradeoffs:**

- `finalNewline` is outside undo history (`BufferState`, `src/core/state/types.ts:78-103`), so `u` restores the lines but not the flag. This is accepted, because the REQ1 criteria require one `u` to restore the lines, and extending undo for one flag is out of proportion.

**Success Criteria:** `S6`

**Verification Impact:**

- `V23` lines, flag, one undo entry, no git effect.

## W261005F2A7-DES6: Refresh is one coalesced status read plus per-buffer index checks

**Question:** How is repo-wide state kept fresh and scoped?

**Decision:**

- `requestRefresh` restarts the `gitRefresh` timer (200 ms) from:
  - `saved`;
  - `fileChanged`;
  - `gitStaged`;
  - `toolExited`;
  - `gitDirChanged`;
  - `gitDetected`.
- On expiry, one `gitStatus` effect runs `status --porcelain=v2 -z --branch -uall -- <prefix>` lock-free.
- `parseStatus` keeps workspace-relative entries.
- `onGitStatus` re-reads the index only for open buffers whose index side changed, and emits `gitWatch` when the head changed.

**Requirements Addressed:** `W261005F2A7-REQ6@R2`, `W261005F2A7-REQ7@R2`, `W261005F2A7-REQ4@R2`

**Research Support:** `RF6`, `RF7` evaluated `W261005F2A7-REQ6@R1` and informed `@R2`; `RF9` supported `REQ6`, `REQ7`; `RF8` evaluated `W261005F2A7-REQ7@R1` and informed `@R2`

**Rationale:**

- A single timer id coalesces every trigger.
- Pathspec scoping costs 20–48 ms on 20,000 files (RF9).
- Hooking `saved` covers own writes that the watcher suppresses (`src/workspace/watcher.ts:29-58`).

**Code Impact:**

- `src/core/state/git.ts` — `requestRefresh`, `onGitStatus`, `onGitRefreshTimer` — new
- `src/core/state/disk.ts`, `save.ts` — triggers
- `src/core/features/git/status.ts` — `parseStatus` — new

**Detailed Design:** §7 `src/core/state/git.ts`, `src/core/features/git/status.ts`, `src/workspace/git.ts`

**Tradeoffs:**

- Stale-stat slowdown under lock-free reads is accepted (RF6). so never refreshes the index itself.
- `-uall` lists every untracked file. A huge untracked folder costs more per refresh, which is accepted by user decision.

**Success Criteria:** `S20`, `S21`, `S24`

**Verification Impact:**

- `V19`, `V26`, `V27` reducer; `V14` parse; `V38` index mtime; `V56` end-to-end.

## W261005F2A7-DES7: A separate git-dir watcher retargets on branch changes

**Question:** How are external Git changes observed?

**Decision:**

- `watchGitDirs` watches first-level entries of `[gitDir, commonDir, commonDir/refs/heads/<dirname(branch)>]`.
- It drops `*.lock`, `.watchman-cookie*`, and `COMMIT_EDITMSG`, and dispatches `gitDirChanged`.
- The runner creates it on the first `gitWatch` and retargets it on later ones.
- A start failure is logged and skipped, and refresh continues on the other triggers.

**Requirements Addressed:** `W261005F2A7-REQ6@R2`, `W261005F2A7-REQ7@R2`

**Research Support:** `RF7` evaluated `W261005F2A7-REQ6@R1` and `W261005F2A7-REQ7@R1` and informed both `@R2`

**Rationale:**

- This is gitsigns' target set and filter.
- It stays separate from the workspace watcher, which hides dot paths and may not cover a git dir outside the workspace (`src/workspace/ignore.ts:13-14`).
- Debounce stays in core.

**Code Impact:**

- `src/workspace/git-watcher.ts` — `watchGitDirs` — new
- `src/app/effects.ts` — `gitWatch` — new

**Detailed Design:** §7 `src/workspace/git-watcher.ts`, `src/app/effects.ts`

**Tradeoffs:**

- Reftable repositories (`reftable/`) are covered only through `commonDir` first-level events. That was not tested in research, so it is accepted.
- No polling fallback, by user decision.

**Success Criteria:** `S22`, `S23`, `S25`

**Verification Impact:**

- `V54`, `V55` real watcher; `V56` end-to-end.

## W261005F2A7-DES8: Discovery and the version gate run after the first frame

**Question:** When and how is the repository discovered?

**Decision:**

- In the deferred startup block, `git.detect(ws.root)` runs `which git`, then `git --version` (gate at `[2,31,0]`, tolerant of vendor suffixes).
- It then runs `rev-parse --path-format=absolute --show-toplevel --git-dir --git-common-dir --show-prefix`, then `symbolic-ref -q HEAD`, or `rev-parse --short HEAD` when detached.
- It dispatches `gitDetected`.

**Requirements Addressed:** `W261005F2A7-REQ7@R2`, `W261005F2A7-REQ3@R1`

**Research Support:** `RF8` evaluated `W261005F2A7-REQ7@R1` and informed `@R2`; `RF8` retained `REQ3@R1`

**Rationale:** Discovery follows the existing `detectTrash` pattern (`src/app/main.ts:370-377`) and keeps first frame unaffected. One `rev-parse` covers every supported layout, and `symbolic-ref` handles unborn branches, where `rev-parse HEAD` fails.

**Code Impact:**

- `src/workspace/git.ts` — `detect`, `parseVersion`, `MIN_GIT` — new
- `src/app/main.ts` — startup block — modified
- `src/core/state/git.ts` — `onGitDetected` — new

**Detailed Design:** §7 `src/workspace/git.ts`, `src/app/main.ts`

**Tradeoffs:**

- Inherited `GIT_DIR`/`GIT_WORK_TREE` are honoured as the user's explicit choice, not cleared.

**Success Criteria:** `S26`, `S24`, `S25`

**Verification Impact:**

- `V28`, `V29` real and stubbed detection; `V53` first frame.

## W261005F2A7-DES9: The tool hand-off is a save-gated effect run by a suspend-aware shell

**Question:** How does so hand the terminal to the tool and get it back safely?

**Decision:**

- `openTool` refuses without a repository, or while an operation is pending or a dirty buffer is blocked.
- Otherwise it saves dirty buffers through `GitPending { op: "tool" }`, then emits `runTool { argv: config.git.tool, cwd: repo.top }`.
- `createToolHost` checks `which`, holds interrupts, calls `shell.suspend()`, and spawns with inherited stdio.
- In `finally` it writes `FOREIGN_MODES_RESET`, calls `shell.resume()`, and releases interrupts, then reports `ToolResult`.
- `paint` returns early while suspended.
- `onToolExited` refreshes and re-reads every open buffer and index.

**Requirements Addressed:** `W261005F2A7-REQ2@R2`, `W261005F2A7-REQ3@R1`, `W261005F2A7-REQ8@R1`

**Research Support:** `RF11`, `RF12` evaluated `W261005F2A7-REQ2@R1` and informed `@R2`; `RF10` supported `REQ2`, retained `REQ8@R1`

**Rationale:**

- OpenTUI's suspend and resume already handle so's own modes (RF11).
- The paint guard closes the mouse leak found in exploration.
- `holdInterrupts` mirrors micro's Ctrl-C trap (RF12).
- Re-reading buffers reuses `onDiskLoaded`.
- A structural `screen` interface keeps `src/app` free of UI imports.

**Code Impact:**

- `src/app/tool-host.ts` — `createToolHost` — new
- `src/ui/shell.ts` — `Shell.suspend`, `resume`, `resetForeignModes`, `paint` — modified
- `src/app/lifecycle.ts` — `holdInterrupts` — modified
- `src/core/state/git.ts` — `openTool`, `onToolExited` — new
- `src/app/main.ts` — construction — modified

**Detailed Design:** §7 `src/app/tool-host.ts`, `src/ui/shell.ts`, `src/app/lifecycle.ts`, `src/core/state/git.ts`

**Tradeoffs:**

- Typeahead typed after the child exits but before resume reaches so as keys (RF11). This is accepted.
- Kitty images are deleted on suspend (RF11). `resume()` must force a full repaint that re-issues every visible image draw. `V60` proves the re-issue at the shell level, and the manual Ghostty/kitty check `V61` proves the images actually reappear.

**Success Criteria:** `S12`–`S16`, `S27`, `S28`, `S31`

**Verification Impact:**

- `V30`, `V33`, `V59` ordering; `V42` signals; `V31`, `V32`, `V34`, `V35` reducer; `V58` integration; `V50` real PTY; `V60` image re-issue; `V61` manual image check.

## W261005F2A7-DES10: Display is derived per frame from git state

**Question:** How are signs, statusline, and explorer markers produced without new layout machinery?

**Decision:**

- `hunkSigns` is appended last to `layoutFrame`'s providers, so git signs win.
- `layoutText` lets a block-replace row carry the last sign in its range.
- `statusSegments` adds `git`, and the statusline drops it first on narrow terminals.
- `explorerMarkers` gives each row one marker by precedence, with `contains` on ancestors.
- New `git*` theme tokens are added.
- `GIT_SIGNS` uses distinct one-cell glyphs, so kinds remain distinguishable with `color = "never"`.

**Requirements Addressed:** `W261005F2A7-REQ4@R2`

**Research Support:** `RF1`, `RF9` evaluated `W261005F2A7-REQ4@R1` and informed `@R2`

**Rationale:**

- It reuses the existing single sign cell (`src/ui/editors/text-view.ts:549-556`) and the `searchMarks` provider pattern.
- Without a repository, output is unchanged, so existing snapshots are unaffected.

**Code Impact:**

- `src/core/features/git/signs.ts`, `status.ts` — new
- `src/core/kernel/view/text-view.ts` — `layoutText` — modified
- `src/core/state/status.ts` — modified
- `src/ui/editors/text-view.ts`, `views/statusline.ts`, `views/explorer.ts`, `theme.ts` — modified

**Detailed Design:** §7 `src/core/features/git/signs.ts`, `src/core/kernel/view/text-view.ts`, `src/core/state/status.ts`, UI files

**Tradeoffs:**

- Git signs override the transient markdown reveal and error signs on the same line.
- Glyph and marker shapes are presentation defaults, open to UI refinement.

**Success Criteria:** `S7`–`S10`

**Verification Impact:**

- `V5`, `V6`, `V9`, `V15`–`V17` units; `V44`–`V46` UI snapshots.

## W261005F2A7-DES11: Commands, keys, preview overlay, blame, and config

**Question:** How are features exposed and configured?

**Decision:**

- `gitCommands` provides `git.tool`, `stageHunk`, `resetHunk`, `previewHunk`, `nextHunk`, `prevHunk`, and `blameLine`.
- `gitBindings` binds them to `<leader>gg`, `<leader>ghs`, `<leader>ghr`, `<leader>ghp`, `<leader>ghb`, `]h`, and `[h`.
- `gitGroups` labels `<leader>g` as git and `<leader>gh` as hunk.
- A `gitHunk` overlay shows `HunkView`, which closes on Esc, `q`, or a click outside.
- Blame emits `gitBlame` with `--contents -`, or answers "not committed yet" in core for untracked or unborn files.
- `ConfigSchema.git.tool` is a non-empty string array defaulting to `["lazygit"]`.

**Requirements Addressed:** `W261005F2A7-REQ4@R2`, `W261005F2A7-REQ3@R1`, `W261005F2A7-REQ1@R2`, `W261005F2A7-REQ2@R2`

**Research Support:** `RF13` evaluated `W261005F2A7-REQ4@R1` and informed `@R2`; `RF10` (LazyVim keys)

**Rationale:**

- It follows LazyVim's keys and the existing per-feature registry pattern (`src/core/state/note-commands.ts:258-269`).
- The overlay follows the existing overlay touch points (`keys.ts`, `mouse.ts`, `shell.ts`).

**Code Impact:**

- `src/core/state/git-commands.ts` — new
- `src/ui/overlays/hunk.ts` — `HunkView` — new
- `src/core/state/keys.ts`, `mouse.ts` — overlay gates — modified
- `src/core/config/schema.ts` — `git` — modified
- `src/app/main.ts`, `test/support/state.ts` — registries — modified

**Detailed Design:** §7 `src/core/state/git-commands.ts`, `src/core/config/schema.ts`, UI files

**Tradeoffs:**

- Blame shows as a message-line notice, not an inline virtual-text annotation, which keeps the layout unchanged.
- `.git-blame-ignore-revs` is deferred.

**Success Criteria:** `S11`, `S17`, `S7`

**Verification Impact:**

- `V24`, `V43` units; `V39` real blame; `V47` overlay.
