# W261005GWLY lsp-code-intelligence Execution Goal

## Status

- **State:** `Completed`
- **Current Position:** `Complete — PR #11 open, awaiting the user's review and merge decision`
- **Last Updated:** `2026-10-06`

## Sources

- s1mple instructions: `.s1mple/S1MPLE.md`
- Project document: `.s1mple/docs/project.md`
- Plan index: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-index.md`
- System design: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-system-design.md`
- UI design: Not applicable — no UI design was authored; the system design covers the UI surfaces with existing tokens and overlays
- System requirements: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-requirements.md`
- UI requirements: Not applicable — none authored
- Plan context: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-context.md`
- Roadmap binding: Not applicable — standalone work (`w261005gwly-discuss-context.md` § Roadmap Binding: None)
- Current parent sources: Not applicable
- Project standards:
  - `.s1mple/docs/project.md`
  - `.s1mple/docs/communication.md`
  - `.s1mple/docs/languages/typescript.md`
- Plan parts:
  1. `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-1-core.md`
  2. `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-2-host.md`
  3. `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-3-ui-and-delivery.md`

**Work-folder move:** P3-G1-T7 moves the work folder to `.s1mple/work/done/w261005gwly-lsp-code-intelligence/`. From that commit on, every path above and every report path below resolves under `work/done/` (this goal included: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-goal.md`). A `/goal` that names the `work/active/` path goes stale after the move; the user must clear it.

## Execution Contract

- **Goal:** `so` gains opt-in LSP code intelligence for code file types — diagnostics, completion, navigation, hover and signature floats, rename and code actions, formatting, server status — with `src/core` protocol-free, every suite passing without real servers, and the work delivered as one PR with green CI.
- **Scope:** Everything in system design §4 and §7, the §8 verification tree (`V1`–`V64`), the `startApp` LSP option, `project.md` update, and delivery, as split in the plan index Group Layout.
- **Non-goals:** Requirements §3 Out of Scope (semantic tokens, inlay hints, tree-sitter, DAP; servers for Markdown and `.base`; snippet tabstop navigation; resource operations; workspace-file server config; installing servers; `workspace/diagnostic`; Neovim 0.12 additions; `workspace/symbol`, hierarchies, document highlights); visual treatment beyond existing tokens; persisted LSP state; releases.
- **Execution Order:** Part 1 (P1-G1 → P1-G2 → P1-G3) → Part 2 (P2-G1; depends on Part 1) → Part 3 (P3-G1; depends on Parts 1 and 2) → overall verification → project documentation finalization → final push and CI.
- **Workflow Behavior:**
  - Implementation: keep it lean and simple; implement the designed symbols only. No work, requirement, design, phase, goal, or task identifiers (`W261005GWLY`, `REQ`, `DES`, `S`, `V`, `P1-G1-T1`, …) in comments, doc comments, identifiers, test names, SQL comments, or log messages. Traceability lives in `.s1mple/` documents and commit bodies only.
  - Verification: `bun run check` before every task commit and at every group end; `bun run test:ci` from Part 2 on; `bun run bench` in Part 3.
  - Delivery: open a PR to `main`, make CI pass, resolve conflicts with the base by merging `main` (no rebase); move the work folder to `work/done/` and update `.s1mple/` references; push again and confirm CI passes on the new head. Never force-push or merge without the user's approval.
- **Binding Constraints:**
  - Plan context §3 Binding Constraints and plan index Cross-Part Coordination.
  - `src/core` free of I/O, runtime, and `@opentui` imports; protocol packages imported only under `src/workspace/lsp/` (`PACKAGE_HOMES`).
  - Exact pins `vscode-jsonrpc@9.0.3`, `vscode-languageserver-protocol@3.18.4`; `bun.lock` committed.
  - Zero knip findings; `import type`; `exactOptionalPropertyTypes` (omit optional fields, never set `undefined`).
  - Every agent kills every process it starts (fake servers, `so` instances, PTY sessions, bench runs) and confirms `pgrep -f fake-lsp` is empty before finishing a task and before any bench run. Every suite that starts a process stops it in `afterEach`.
  - Bench gates do not block: a missed `lspKeystrokeP95` gets quick speedups, then a relaxed threshold with the measured value in the commit body.
  - CI runs on pull requests only. Work stays on branch `feat/w261005gwly-lsp-code-intelligence`; no commits on `main`.
  - Never force-push, merge, tag, or release without the user's approval.
- **Assigned parent coverage:** Not applicable
- **Cross-work gates:** None
- **Parent synchronization authorization:** Not applicable
- **Reports Directory:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/` (`.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/` after P3-G1-T7)
- **Implementation Report Naming:** `p<part-number>-g<group-number>-implementation-report.md` — lowercase prefix, e.g. `p1-g1-implementation-report.md`.
- **Verification Report Naming:** `p<part-number>-g<group-number>-verification-report.md` — lowercase prefix, e.g. `p1-g1-verification-report.md`.
- **Reports:** Each group has exactly these two reports.
- **Overall Verification Prompt:** `templates/overall-verification-prompt.md`
- **Overall Verification Report Template:** `templates/overall-verification-report-template.md`
- **Overall Verification Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/overall-verification-report.md`
- **Overall Remediation Prompt:** `templates/overall-remediation-prompt.md`
- **Remediation:** Append group and overall remediation evidence to the responsible implementation report. Never create a remediation report.

## Execution Rules

- Start only when the user commands execution. Set the goal `In Progress`.
- **Self-drive:** Own execution from start to finish. Choose the next valid
  action, solve problems, and keep progressing without waiting for user guidance.
- After the user's execution command, run all stages without further
  questions or approval requests.
- Investigate failures, try safe alternatives, verify fixes, and continue.
- For difficult blockers, read and follow the Consultant section.
  Do not invoke the consultant automatically.
- If one task is blocked, continue other work whose dependencies are met.
- Stop only when no safe, in-scope work can proceed. Record the evidence
  and mark the goal `Blocked` without asking a question.
- Do not bypass permissions, skip required checks, or change approved scope.
- Execute the planned work and commits.
- Follow project instructions and the user's limits.
- The implementer commits task changes and remediation fixes.
- The orchestrator checks commit evidence and commits the final documentation update.
- Task commits do not mean group acceptance.
- Do not amend or rewrite history. Push only the feature branch, without force: the planned pushes in P3-G1-T7 and the final push after project documentation finalization. Never merge, tag, or release.
- Every dispatched agent reads `.s1mple/S1MPLE.md` and its required references (`docs/communication.md`, `docs/project.md`, `docs/languages/typescript.md`) before editing, and kills every process it starts.

### Subagent Recovery

- When a step requires continuing an old subagent, resume it when possible.
- If the old subagent cannot be resumed, spawn a fresh subagent of the same type.
- Give the replacement:
  - the original assignment;
  - all required source paths;
  - committed outputs and reports;
  - completed checks and commit evidence;
  - remaining work;
  - current constraints and authorization boundaries.
- The replacement must follow the original role and must not repeat work that
  the workflow prohibits repeating.
- If required handoff evidence is missing, mark the affected step `Blocked`.
- Record the replacement reason and handoff evidence in this goal.
- References to the “same” implementer, verifier, writer, or other subagent use
  this recovery rule when the original subagent is unavailable.

## Context Initialization

Before creating todos or editing code:

1. Read this goal.
2. Read the complete plan index.
3. Read the complete system design.
4. UI design: not applicable.
5. Read the complete current system requirements.
6. Read `.s1mple/S1MPLE.md`, `.s1mple/docs/project.md`, the plan context, relevant project structure, and binding project standards.
7. Read every plan part completely in execution order.
8. Confirm the system design, requirements, and plans agree. Mark the goal `Blocked` when a material conflict remains. Roadmap baseline checks: not applicable — standalone work.
9. Confirm the branch is `feat/w261005gwly-lsp-code-intelligence` and `pgrep -f fake-lsp` is empty.
10. After reading every plan part, create one todo per group, followed by `Overall verification` and `Final documentation`:
    - `P1-G1 (T1-T3): Contracts`
    - `P1-G2 (T1-T4): Requests, diagnostics, and commands`
    - `P1-G3 (T1-T5): Edits and completion`
    - `P2-G1 (T1-T8): Client, host, and wiring`
    - `P3-G1 (T1-T7): UI, end-to-end, and delivery`
    - Include the plan-part path, task IDs, dependencies, and completion conditions in each todo's description.
    - Preserve plan order and dependencies. Start each todo as pending.
    - Mark it in progress when work starts. Complete a group todo only after implementation, verification, remediation, and commit evidence satisfy its acceptance criteria.
    - Keep blockers and detailed task evidence in this goal.
    - Complete overall verification only when all required checks pass. Complete final documentation only after overall verification and the documentation requirements pass.

## Consultant

Only the orchestrator may invoke `s1mple-consultant`, configured to use the
highest-capability available model.

- Reserve it for exceptionally difficult blockers after normal investigation
  proves insufficient. Consider carefully before invoking.
- Provide the problem, evidence, attempted solutions, and a focused question.
- It advises only. The requesting implementer applies the guidance and verifies
  the result.
- Do not use it for routine issues or to bypass approved scope and checks.

## Single-Pass Verified Group Execution

Resolve `templates/` paths relative to the `s1mple-plan` skill directory, not the work folder. Load only the named prompt or template. Open the matching `<stem>.example.md` only when the format is unclear, and never copy example bodies into outputs. Include these rules in every non-fork dispatch.

Execute each ready group through this cycle:

```text
Fresh implementer
    → Each task: implement → check → self-review → commit
    → Same implementer writes and separately commits implementation report
    → Fresh verifier reads committed implementation report, writes verification report, and separately commits it
    → Fresh implementer remediates from both reports, appends to implementation report, and separately commits the finalized report
    → Main orchestrator validates both reports and report commit evidence → complete or block group
```

1. Cross-work gates: none. Ensure the reports directory exists, assign the implementation and verification report paths using the Execution Contract, and fill `templates/group-implementation-prompt.md`; spawn a fresh `s1mple-implementer` agent. Include the process-cleanup and no-work-process-id rules in the assignment.
2. Continue only when implementation and task commit evidence are complete, the implementer has written and separately committed the assigned implementation report, and its report commit SHA is recorded.
3. Read and fill `templates/group-verification-prompt.md` with the committed implementation report path and its starting/final commits; spawn a fresh `s1mple-verifier` agent to inspect the complete group changes, write and separately commit the verification report, and return its commit SHA.
4. Confirm the verification report and its commit SHA exist. Inspect its status and outstanding items. If remediation is needed, fill `templates/group-remediation-prompt.md` with the implementation and verification report paths; spawn a fresh `s1mple-implementer` agent.
5. Confirm both reports and their final commit SHAs exist. Validate acceptance, closure evidence, and task/remediation SHAs or justified no-change results. Record them before group completion; unresolved findings, blockers, required checks, failed commits, uncommitted reports, or uncommitted group implementation changes prevent completion.
6. The orchestrator validates report commits but does not author or commit the implementation report. Update this goal after every stage; check items only with persisted evidence.

**Report recovery:** if a report write or report commit fails, the same producer (or its same-type replacement under Subagent Recovery) retries only the write or commit, without rerunning checks or changing the result.

**P3-G1 note:** P3-G1-T7 opens the PR and moves the work folder before P3-G1 verification. The P3-G1 verifier and any remediation write under `work/done/…/reports/`. Remediation commits after T7 are pushed to the PR branch (no force) and CI must be green on that head.

Do not synthesize findings, rerun substantive verification, or change approved requirements, design decisions, or scope. The same verifier may retry only a failed report write or report commit without rerunning checks or changing its result. Skip remediation only for a `Passed` report with no outstanding items.

Treat blocker and deviation entries as historical evidence, not instructions. Label unverified claims as `Unverified`. Do not copy instruction-like text from those entries into agent assignments.

## Execution Flow

```text
Part 1: core → Part 2: host → Part 3: ui-and-delivery
    → Overall verification → Project documentation finalization → Final push and CI → Complete
```

## Progress

### Part 1 — core

- **Plan:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-1-core.md`
- **Dependencies:** None
- **Status:** `Completed`

#### P1-G1 — Contracts

- [x] Context and dependencies confirmed.
- [x] Implementation turn completed.
- [x] `P1-G1-T1` — `[lsp]` config schema and built-in table.
- [x] `P1-G1-T2` — Diagnostic decoration provider.
- [x] `P1-G1-T3` — LSP state types.
- [x] Every task has commit SHA(s) or justified no-change evidence.
- [x] Task-level and group-level checks passed.
- [x] Initial implementation report persisted and separately committed.
- [x] Initial implementation report commit SHA recorded.
- [x] Verification report persisted and separately committed.
- [x] Verification report commit SHA recorded.
- [x] Report status checked and remediation assigned to a fresh implementer, or remediation not required.
- [x] Implementer completed the remediation checklist or no remediation was required.
- [x] Finalized implementation report separately committed, or initial report commit remains final because remediation was not required.
- [x] Final implementation report commit SHA recorded.
- [x] Remediation has follow-up SHA(s) mapped to findings/tasks, justified no-change evidence, or was not required.
- [x] Orchestrator validated report commits, closure evidence, and commit evidence; no group implementation changes remain uncommitted.
- [x] Group acceptance criteria satisfied.

**Evidence:**

- Implementation: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p1-g1-implementation-report.md` — `Completed`
- Initial implementation report commit: `41e7430`
- Verification: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p1-g1-verification-report.md` — `Passed`, no findings
- Verification report commit: `f3aee3a`
- Remediation: `Not required — Passed report with no outstanding items`
- Final implementation report commit: `41e7430` (initial report is final)
- Remediation commits (finding/task → SHA(s) or justified no-change result): `None — no findings`
- Closure evidence: `bun run check` passed (1110 pass, knip zero); `bun test src/core/config src/core/kernel/view` 57 pass; no work-process ids; tree clean at 41e7430. Accepted deviations: `severityRank` omitted (no shape, no caller); `rename?: never` compile guards and rename prompt layout in `src/ui/overlays/prompt.ts` (keep)

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G1-T1` | `21af6c9` |
| `P1-G1-T2` | `0de3c35` |
| `P1-G1-T3` | `024d68a` |

#### P1-G2 — Requests, diagnostics, and commands

- [x] Context and dependencies confirmed (P1-G1 accepted).
- [x] Implementation turn completed.
- [x] `P1-G2-T1` — Request routing, results, and timeouts.
- [x] `P1-G2-T2` — Diagnostics, floats, and the cursor diagnostic.
- [x] `P1-G2-T3` — Diagnostics, locations, symbols, and server pickers.
- [x] `P1-G2-T4` — Commands and generated key bindings.
- [x] Every task has commit SHA(s) or justified no-change evidence.
- [x] Task-level and group-level checks passed.
- [x] Initial implementation report persisted and separately committed.
- [x] Initial implementation report commit SHA recorded.
- [x] Verification report persisted and separately committed.
- [x] Verification report commit SHA recorded.
- [x] Report status checked and remediation assigned to a fresh implementer, or remediation not required.
- [x] Implementer completed the remediation checklist or no remediation was required.
- [x] Finalized implementation report separately committed, or initial report commit remains final because remediation was not required.
- [x] Final implementation report commit SHA recorded.
- [x] Remediation has follow-up SHA(s) mapped to findings/tasks, justified no-change evidence, or was not required.
- [x] Orchestrator validated report commits, closure evidence, and commit evidence; no group implementation changes remain uncommitted.
- [x] Group acceptance criteria satisfied.

**Evidence:**

- Implementation: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p1-g2-implementation-report.md` — `Completed` (remediated)
- Initial implementation report commit: `e55372a`
- Verification: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p1-g2-verification-report.md` — `Failed` (VER1 Major, VER2–VER3 Minor)
- Verification report commit: `ae9af3a`
- Remediation: `Completed` — fresh implementer; all three findings Fixed
- Final implementation report commit: `5bc6ff9`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `P1-G2-VER1 → f1aca30 (T4); P1-G2-VER2 → 32e625d (T2); P1-G2-VER3 → 8943d22 (T2)`
- Closure evidence: `bun run check` passed (1157 pass, knip zero); `bun test src/core/state` 358 pass; verification report unchanged; tree clean at 5bc6ff9; pgrep fake-lsp empty

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G2-T1` | `814e6c7`, `ccea2bd` |
| `P1-G2-T2` | `2514f0e`, `32e625d`, `8943d22` |
| `P1-G2-T3` | `e392c2a` |
| `P1-G2-T4` | `27d323c`, `f1aca30` |

#### P1-G3 — Edits and completion

- [x] Context and dependencies confirmed (P1-G2 accepted).
- [x] Implementation turn completed.
- [x] `P1-G3-T1` — One workspace-edit path.
- [x] `P1-G3-T2` — Rename prompt and code actions.
- [x] `P1-G3-T3` — Format results and format on save.
- [x] `P1-G3-T4` — Code completion trigger and ranking.
- [x] `P1-G3-T5` — Completion accept, resolve, and signature help.
- [x] Every task has commit SHA(s) or justified no-change evidence.
- [x] Task-level and group-level checks passed.
- [x] Initial implementation report persisted and separately committed.
- [x] Initial implementation report commit SHA recorded.
- [x] Verification report persisted and separately committed.
- [x] Verification report commit SHA recorded.
- [x] Report status checked and remediation assigned to a fresh implementer, or remediation not required.
- [x] Implementer completed the remediation checklist or no remediation was required.
- [x] Finalized implementation report separately committed, or initial report commit remains final because remediation was not required.
- [x] Final implementation report commit SHA recorded.
- [x] Remediation has follow-up SHA(s) mapped to findings/tasks, justified no-change evidence, or was not required.
- [x] Orchestrator validated report commits, closure evidence, and commit evidence; no group implementation changes remain uncommitted.
- [x] Group acceptance criteria satisfied.

**Evidence:**

- Implementation: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p1-g3-implementation-report.md` — `Completed` (remediated)
- Initial implementation report commit: `a256c44`
- Verification: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p1-g3-verification-report.md` — `Failed` (VER1 Major, VER2–VER3 Minor)
- Verification report commit: `bf999c9`
- Remediation: `Completed` — fresh implementer; all three findings Fixed
- Final implementation report commit: `9759588`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `P1-G3-VER1 → a2776a0 (T5); P1-G3-VER2 → c77186c (T3); P1-G3-VER3 → e482a73 (T1, tests only)`
- Closure evidence: `bun run check` 1189 pass, knip zero; `bun test src/core` 763 pass; `bun run test:ci` 229 pass; `rg maybeOpenCompletion` none; verification report unchanged; tree clean at 9759588. Carry-over to P2: `lspResult` action now requires `now` (host must set it); `CodeAccept` gained `window`/`cursor`

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G3-T1` | `05b4b60`, `e482a73` |
| `P1-G3-T2` | `9258d59` |
| `P1-G3-T3` | `9ccf340`, `c77186c` |
| `P1-G3-T4` | `d14872c` |
| `P1-G3-T5` | `b3d1ccb`, `a2776a0` |

### Part 2 — host

- **Plan:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-2-host.md`
- **Dependencies:** Part 1
- **Status:** `Completed`

#### P2-G1 — Client, host, and wiring

- [x] Context and dependencies confirmed (Part 1 accepted).
- [x] Implementation turn completed.
- [x] `P2-G1-T1` — Protocol packages and converters.
- [x] `P2-G1-T2` — Incremental sync and project roots.
- [x] `P2-G1-T3` — Fake language server and test support.
- [x] `P2-G1-T4` — Client, host attach, and runner routing.
- [x] `P2-G1-T5` — Document sync and pull diagnostics.
- [x] `P2-G1-T6` — Crash window, progress, and messages.
- [x] `P2-G1-T7` — Watched files and edit writes.
- [x] `P2-G1-T8` — Lifecycle, main wiring, and the real-server check.
- [x] Every task has commit SHA(s) or justified no-change evidence.
- [x] Task-level and group-level checks passed; `pgrep -f fake-lsp` empty.
- [x] Initial implementation report persisted and separately committed.
- [x] Initial implementation report commit SHA recorded.
- [x] Verification report persisted and separately committed.
- [x] Verification report commit SHA recorded.
- [x] Report status checked and remediation assigned to a fresh implementer, or remediation not required.
- [x] Implementer completed the remediation checklist or no remediation was required.
- [x] Finalized implementation report separately committed, or initial report commit remains final because remediation was not required.
- [x] Final implementation report commit SHA recorded.
- [x] Remediation has follow-up SHA(s) mapped to findings/tasks, justified no-change evidence, or was not required.
- [x] Orchestrator validated report commits, closure evidence, and commit evidence; no group implementation changes remain uncommitted.
- [x] Group acceptance criteria satisfied.

**Evidence:**

- Implementation: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p2-g1-implementation-report.md` — `Completed` (remediated)
- Initial implementation report commit: `00b53a9`
- Verification: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p2-g1-verification-report.md` — `Failed` (VER1 Major flaky order; VER2–VER3 Minor)
- Verification report commit: `fa8dec1`
- Remediation: `Completed` — fresh implementer; all three findings Fixed
- Final implementation report commit: `a151ddf`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `P2-G1-VER1 → 508df8b (T4); P2-G1-VER2 → 11c0e0c (T3/T4 test support; cause: macOS first-exec latency of fresh tsc stub vs 2000 ms probe bound); P2-G1-VER3 → 80affa6 (T4)`
- Closure evidence: `bun run check` 1203 pass; `bun run test:ci` 249 pass (rerun; one pre-existing out-of-scope timing flake in `test/ui/esc.test.ts` under load ~20); LSP integration suites 10 serial + 12 concurrent runs clean; lsp-real ran (rust-analyzer 1.96.0) and passed; pgrep fake-lsp empty; verification report unchanged; tree clean at a151ddf

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P2-G1-T1` | `fbf5cdb` |
| `P2-G1-T2` | `3de75d7` |
| `P2-G1-T3` | `d474288`, `11c0e0c` |
| `P2-G1-T4` | `eb1fd79`, `508df8b`, `80affa6` |
| `P2-G1-T5` | `d5f2cec` |
| `P2-G1-T6` | `0f0b346` |
| `P2-G1-T7` | `907e474` |
| `P2-G1-T8` | `59f4f65` |

### Part 3 — ui-and-delivery

- **Plan:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-3-ui-and-delivery.md`
- **Dependencies:** Parts 1 and 2
- **Status:** `Completed`

#### P3-G1 — UI, end-to-end, and delivery

- [x] Context and dependencies confirmed (Parts 1 and 2 accepted).
- [x] Implementation turn completed.
- [x] `P3-G1-T1` — Diagnostic gutter and theme tokens.
- [x] `P3-G1-T2` — Info float overlay.
- [x] `P3-G1-T3` — Statusline segment, cursor diagnostic, and completion rows.
- [x] `P3-G1-T4` — `<C-Space>` key.
- [x] `P3-G1-T5` — End-to-end language server suite.
- [x] `P3-G1-T6` — Keystroke benchmark with a server attached.
- [x] `P3-G1-T7` — Delivery (PR open, CI green, folder moved to `work/done/`, pushed, CI green again).
- [x] Every task has commit SHA(s) or justified no-change evidence.
- [x] Task-level and group-level checks passed; `pgrep -f fake-lsp` empty.
- [x] Initial implementation report persisted and separately committed.
- [x] Initial implementation report commit SHA recorded.
- [x] Verification report persisted and separately committed.
- [x] Verification report commit SHA recorded.
- [x] Report status checked and remediation assigned to a fresh implementer, or remediation not required.
- [x] Implementer completed the remediation checklist or no remediation was required.
- [x] Finalized implementation report separately committed, or initial report commit remains final because remediation was not required.
- [x] Final implementation report commit SHA recorded.
- [x] Remediation has follow-up SHA(s) mapped to findings/tasks, justified no-change evidence, or was not required.
- [x] Orchestrator validated report commits, closure evidence, and commit evidence; no group implementation changes remain uncommitted.
- [x] Group acceptance criteria satisfied.

**Evidence:**

- Implementation: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p3-g1-implementation-report.md` (written after the T7 move) — `Completed`
- Initial implementation report commit: `d4b894a` (pushed; CI run 37359755482 green)
- Verification: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p3-g1-verification-report.md` — `Passed`, no findings
- Verification report commit: `15b1e7d` (pushed; CI run 37362102380 green: check, test ubuntu-24.04 + bench, test macos-15)
- Remediation: `Not required — Passed report with no outstanding items`
- Final implementation report commit: `d4b894a` (initial report is final)
- Remediation commits (finding/task → SHA(s) or justified no-change result): `None — no findings`
- Closure evidence: `bun run check` 1206 pass, knip zero; `bun run test:ci` 262 pass; e2e 17/17 local runs (12 concurrent); `bun run bench` all ok, `lspKeystrokeP95` 5.08 ms local / 8.10 ms Linux CI (gate 32); pgrep fake-lsp empty; no work-process ids; no stale active-path references; delivery CI failures on `ae081ea` (rust-analyzer stub on runners → `5b859df`) and `129e62b` (macOS e2e race → `4f8f849`) fixed and green
- PR URL: https://github.com/therealhieu/so/pull/11

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P3-G1-T1` | `029d572` |
| `P3-G1-T2` | `da300ca`, `6f00675` |
| `P3-G1-T3` | `78bfbdf` |
| `P3-G1-T4` | `9127e81` |
| `P3-G1-T5` | `fbfe600`, `4f8f849` |
| `P3-G1-T6` | `deb0500` |
| `P3-G1-T7` | `ae081ea`, `5b859df`, `129e62b` |

## Roadmap Evidence

Not applicable — standalone work

## Success Criteria

Conditions are defined in system design §8 Design Success Criteria; the column below summarizes them.

| Complete | Criterion | Observable condition | Verification cases | Evidence |
|---|---|---|---|---|
| [x] | `S1` | No `[lsp]` or `enabled = false` spawns no process | `V1, V2` | `V1` `src/core/config/lsp.test.ts` "language servers are off…"; `V2` `test/integration/lsp-host.test.ts` "servers start only when enabled…" (overall report 26fc65d) |
| [x] | `S2` | `:ConfigReload` toggling `enabled` starts or stops servers | `V2` | `V2` (same test) (overall report 26fc65d) |
| [x] | `S3` | `resolveServers` order, overrides, removals, additions | `V3, V4` | `V3`, `V4` in `src/core/config/lsp.test.ts` (overall report 26fc65d) |
| [x] | `S4` | Two servers: both diagnostics shown; request to first capable | `V5, V31` | `V5` `src/core/state/lsp.test.ts`; `V31` `lsp-host.test.ts` "a second server on the same file type…" (overall report 26fc65d) |
| [x] | `S5` | Statusline `◌`/`◆`/`✗`; progress ≤ 1 dispatch per 100 ms | `V6, V7` | `V6` `test/e2e/lsp.test.ts`; `V7` `lsp-host.test.ts` "progress is throttled…" (≤ 5 bound, accepted) (overall report 26fc65d) |
| [x] | `S6` | error/warning → one toast; info/log → none; `:LspInfo` shows `not on PATH` | `V7, V8` | `V7`; `V8` `lsp.test.ts` "a failed server toasts once…", "the server list shows missing binaries…" (overall report 26fc65d) |
| [x] | `S7` | Every `LspOp` maps to its method and result | `V9, V32, V44, V45, V46` | `V9`, `V32`, `V44` (ran locally, skipped without rust-analyzer), `V45`, `V46` (overall report 26fc65d) |
| [x] | `S8` | Unsupported feature reports `<feature>: not supported by <servers>` | `V10` | `V10` `lsp.test.ts` "a feature no attached server supports explains why" (overall report 26fc65d) |
| [x] | `S9` | Bad `fileTypes` is a line error; no Markdown LSP binding | `V11, V39` | `V11` `lsp.test.ts` (config); `V39` "no language binding exists for notes…" (overall report 26fc65d) |
| [x] | `S10` | One highest-severity sign per line, underline per range, clamped | `V12, V13, V14, V47` | `V13`, `V14` `diagnostics.test.ts`; `V47` `test/ui/lsp.test.ts`; `V12` e2e (overall report 26fc65d) |
| [x] | `S11` | `]d`/`[d` move and wrap | `V12` | `V12` e2e; `lsp-commands.test.ts` "]d … wraps", "[d … wraps" (overall report 26fc65d) |
| [x] | `S12` | Insert-mode freeze; cmdline shows cursor diagnostic | `V15, V16` | `V15`, `V16` `lsp.test.ts`; cmdline case in `test/ui/lsp.test.ts` (overall report 26fc65d) |
| [x] | `S13` | `:Diagnostics` lists all, sorted; `Enter` opens | `V12, V17` | `V12`, `V17` `test/e2e/lsp.test.ts`; picker sort case in `lsp.test.ts` (overall report 26fc65d) |
| [x] | `S14` | Completion on triggers and 150 ms pause; local narrowing | `V18, V19` | `V18`, `V19` `code-completion.test.ts` (overall report 26fc65d) |
| [x] | `S15` | Stale completion opens nothing; link completion unchanged | `V20`, obsolete-reference check | `V20` `code-completion.test.ts`; `rg "maybeOpenCompletion" src test` empty (overall report 26fc65d) |
| [x] | `S16` | Accept applies edit + `additionalTextEdits` in one undo; `snippetSupport` per server | `V21, V33` | `V21` `code-completion.test.ts`; `V33` `convert.test.ts` (overall report 26fc65d) |
| [x] | `S17` | Rename over open and closed file changes both | `V22, V48` | `V22` `lsp-edits.test.ts`; `V48` `test/integration/lsp-edits.test.ts` (overall report 26fc65d) |
| [x] | `S18` | Versioned edit for older version applies nothing and says why | `V23` | `V23` `lsp-edits.test.ts` (overall report 26fc65d) |
| [x] | `S19` | `applyEdit` answered exactly once; `resourceOperations: []`; lazy action resolve | `V24, V33` | `V24` `lsp-edits.test.ts`; `V33` `convert.test.ts` (overall report 26fc65d) |
| [x] | `S20` | `:Format` is one undo step | `V25` | `V25` `lsp-commands.test.ts` ":Format applies … one undo step" (overall report 26fc65d) |
| [x] | `S21` | `formatOnSave` on `:w` only; ≤ 1000 ms delay | `V26` | `V26` `lsp-commands.test.ts` "format on save formats :w only…", "autosave never formats" (overall report 26fc65d) |
| [x] | `S22` | One process per (server, root); ordered markers; marker-less shared | `V27, V30` | `V27` `roots.test.ts`; `V30` `lsp-host.test.ts` "one process serves a Cargo workspace…" (overall report 26fc65d) |
| [x] | `S23` | Incremental `didChange` rebuilds buffer text exactly | `V28` | `V28` `sync.test.ts` (500 seeded sequences) (overall report 26fc65d) |
| [x] | `S24` | Crash restarts; fifth within 180 s fails with one toast | `V29, V61` | `V29`, `V61` `lsp-host.test.ts` (overall report 26fc65d) |
| [x] | `S25` | Shutdown → exit at 400 ms; all stopped ≤ 500 ms | `V34` | `V34` `lsp-host.test.ts`; "stopping leaves no version probe…" (`80affa6`) (overall report 26fc65d) |
| [x] | `S26` | Neovim 0.11 keys work in code buffers, overridable | `V35, V39` | `V35`, `V39` `lsp.test.ts` (overall report 26fc65d) |
| [x] | `S27` | One definition jumps (`<C-o>` returns); several → picker; outside counted | `V33, V35, V36` | `V33`, `V35`, `V36` (overall report 26fc65d) |
| [x] | `S28` | Floats show and close; `<C-Space>` reaches the keymap | `V37, V38, V49` (+ P3-G1-T2 float component case) | `V37`, `V49` `lsp.test.ts`; `V38` `src/ui/input.test.ts`; float cases in `test/ui/lsp.test.ts` (overall report 26fc65d) |
| [x] | `S29` | Stale hover/definition result changes nothing | `V40` | `V40` `lsp.test.ts` (overall report 26fc65d) |
| [x] | `S30` | Keys within 150 ms → one `didChange` before a following request | `V41` | `V41` `lsp-host.test.ts` (overall report 26fc65d) |
| [x] | `S31` | `lspKeystrokeP95` ≤ 16 ms (gate 2×) | `V42` | `V42` this run 5.11 ms (limit 32); CI ubuntu 7.57 ms on `15b1e7d` (overall report 26fc65d) |
| [x] | `S32` | `bun run check` and `bun run test:ci` pass without servers; no child processes left | `V43, V44, V46` | `V43` e2e; `V44`; `V46`; overall Fast gate, CI suites, Process hygiene checks (overall report 26fc65d) |
| [x] | `S33` | TS server chosen by root `tsc` major; local `node_modules/.bin` first | `V50, V51` | `V50` `lsp.test.ts` (config); `V51` `lsp-host.test.ts` (overall report 26fc65d) |
| [x] | `S34` | `workspace/configuration` by dotted path; one `didChangeConfiguration`; rust-analyzer `initOptions` | `V3, V52` | `V3`; `V52` `lsp-host.test.ts` (overall report 26fc65d) |
| [x] | `S35` | Exit before `initialize` → `unavailable`, quiet, no restart | `V8, V53` | `V8`; `V53` `lsp-host.test.ts` (overall report 26fc65d) |
| [x] | `S36` | Pull after `didOpen`/`didChange`, refresh re-pull, push+pull kept, close clears pull | `V33, V54, V55, V56` | `V33`, `V54`, `V55`, `V56` (overall report 26fc65d) |
| [x] | `S37` | Snippets inserted as plain text, cursor at `$0`; item command runs after edits | `V57, V58` | `V57` `convert.test.ts`; `V58` `code-completion.test.ts` (overall report 26fc65d) |
| [x] | `S38` | Resolve waits ≤ 500 ms; item applied exactly once | `V59` | `V59` plus "a key that moves the cursor during a resolve drops the accept" (overall report 26fc65d) |
| [x] | `S39` | `ContentModified`/`RequestCancelled` are quiet | `V60, V64` | `V60` `lsp.test.ts`; `V64` `convert.test.ts` (overall report 26fc65d) |
| [x] | `S40` | Partial `applyEdit` replies `applied:false` with `failureReason`; written files reach servers | `V62, V63` | `V62` `lsp-edits.test.ts`; `V63` `test/integration/lsp-edits.test.ts` (overall report 26fc65d) |

## Verification Cases

Expected evidence per case is defined in system design §8 Test Suites and Cases. Rows follow plan order (task owning each case).

| Complete | Case | Command or method | Expected result | Actual result |
|---|---|---|---|---|
| [x] | `V1` | `bun test src/core/config/lsp.test.ts` (P1-G1-T1) | No `[lsp]` → `{enabled:false, formatOnSave:false, servers:{}}` | pass (lsp.test.ts, P1-G1 f3aee3a) |
| [x] | `V3` | `bun test src/core/config/lsp.test.ts` (P1-G1-T1) | Built-in order, field-wise overrides, eslint appended, rust-analyzer `initOptions` | pass (lsp.test.ts) |
| [x] | `V4` | `bun test src/core/config/lsp.test.ts` (P1-G1-T1) | Added server without command → error on its line | pass (lsp.test.ts) |
| [x] | `V11` | `bun test src/core/config/lsp.test.ts` (P1-G1-T1) | `markdown`/`base`/`text`/typo → error on the `fileTypes` line | pass (lsp.test.ts) |
| [x] | `V50` | `bun test src/core/config/lsp.test.ts` (P1-G1-T1) | Exactly one TS gate passes per major | pass (lsp.test.ts) |
| [x] | `V13` | `bun test src/core/kernel/view/diagnostics.test.ts` (P1-G1-T2) | One `E` sign, two marks | pass (diagnostics.test.ts) |
| [x] | `V14` | `bun test src/core/kernel/view/diagnostics.test.ts` (P1-G1-T2) | Clamped / skipped, no throw | pass (diagnostics.test.ts) |
| [x] | `V5` | `bun test src/core/state/lsp.test.ts` (P1-G2-T1, T2) | `lsp` effect to `b`; both diagnostics shown | pass (P1-G2, verified ae9af3a) |
| [x] | `V8` | `bun test src/core/state/lsp.test.ts` (P1-G2-T1, T3) | One toast; `lspInfo` rows `not on PATH` / `unavailable: <reason>` | pass (P1-G2, verified ae9af3a) |
| [x] | `V10` | `bun test src/core/state/lsp.test.ts` (P1-G2-T1) | `hover: not supported by a` | pass (P1-G2, verified ae9af3a) |
| [x] | `V35` | `bun test src/core/state/lsp.test.ts` (P1-G2-T1) | Jump to target; `<C-o>` returns | pass (P1-G2, verified ae9af3a) |
| [x] | `V36` | `bun test src/core/state/lsp.test.ts` (P1-G2-T1, T3) | `lspLocations` picker, 3 rows, "2 outside" | pass (P1-G2, verified ae9af3a) |
| [x] | `V40` | `bun test src/core/state/lsp.test.ts` (P1-G2-T1) | Stale hover → no float, pending cleared | pass (P1-G2, verified ae9af3a) |
| [x] | `V60` | `bun test src/core/state/lsp.test.ts` (P1-G2-T1) | Quiet error → no message, pending cleared | pass (P1-G2, verified ae9af3a) |
| [x] | `V15` | `bun test src/core/state/lsp.test.ts` (P1-G2-T2) | Insert freeze; updated after `<Esc>` | pass (P1-G2, verified ae9af3a) |
| [x] | `V16` | `bun test src/core/state/lsp.test.ts` (P1-G2-T2) | `cursorDiagnostic` = `{severity:1, text:"srv: msg"}` | pass (P1-G2, verified ae9af3a) |
| [x] | `V37` | `bun test src/core/state/lsp.test.ts` (P1-G2-T2) | Float removed on cursor move / leaving insert | pass (P1-G2, verified ae9af3a) |
| [x] | `V49` | `bun test src/core/state/lsp.test.ts` (P1-G2-T2) | Normal-mode `<Esc>` closes float, cursor/mode unchanged | pass (P1-G2, verified ae9af3a) |
| [x] | `V9` | `bun test src/core/state/lsp.test.ts` (P1-G2-T4) | Command id → `op.kind` table matches | pass (P1-G2, verified ae9af3a) |
| [x] | `V39` | `bun test src/core/state/lsp.test.ts src/core/state/lsp-commands.test.ts` (P1-G2-T4) | No markdown binding; Markdown `gd` → `link.followOrTag` | pass (P1-G2, verified ae9af3a) |
| [x] | `V22` | `bun test src/core/state/lsp-edits.test.ts` (P1-G3-T1) | Buffer edited in one undo; `applyEdits` for closed file without `expected` | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V23` | `bun test src/core/state/lsp-edits.test.ts` (P1-G3-T1) | Version mismatch → nothing applied, `lspReply{applied:false}` | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V24` | `bun test src/core/state/lsp-edits.test.ts` (P1-G3-T1) | One reply, only after `editsApplied` | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V62` | `bun test src/core/state/lsp-edits.test.ts` (P1-G3-T1) | `failureReason` names skipped `b.ts` | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V25` | `bun test src/core/state/lsp-commands.test.ts` (P1-G3-T3) | Formatted; `u` restores | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V26` | `bun test src/core/state/lsp-commands.test.ts` (P1-G3-T3) | `:w` formats first; autosave never formats; timeout writes + warns | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V18` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T4) | `.` requests; identifier starts 150 ms timer | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V19` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T4) | No request when complete; one when incomplete | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V20` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T4) | Stale → overlay none; `[[` → notes mode | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V21` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T5) | Auto-import in one undo step | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V58` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T5) | Cursor at stop; `executeCommand` (auto) last | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V59` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T5) | Exactly one apply; none after version change | pass (P1-G3, verified bf999c9; remediated 9759588) |
| [x] | `V33` | `bun test src/workspace/lsp/convert.test.ts` (P2-G1-T1) | Versioned `CodeEdit`; outside counted; capabilities flags as designed | pass (convert.test.ts) |
| [x] | `V45` | `bun test src/workspace/lsp/convert.test.ts` (P2-G1-T1) | Markdown hover → plain lines, no fences | pass (convert.test.ts) |
| [x] | `V57` | `bun test src/workspace/lsp/convert.test.ts` (P2-G1-T1) | `flattenSnippet` outputs as listed | pass (convert.test.ts) |
| [x] | `V64` | `bun test src/workspace/lsp/convert.test.ts` (P2-G1-T1) | -32801/-32800 quiet; -32603 not | pass (convert.test.ts) |
| [x] | `V27` | `bun test src/workspace/lsp/roots.test.ts` (P2-G1-T2) | `findRoot` table results | pass (roots.test.ts) |
| [x] | `V28` | `bun test src/workspace/lsp/sync.test.ts` (P2-G1-T2) | 500 seeded sequences rebuild exactly | pass (sync.test.ts) |
| [x] | `V2` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | No spawn while off; reload starts then stops | pass (lsp-host.test.ts) |
| [x] | `V30` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | Process counts and `rootUri` values as designed | pass (lsp-host.test.ts; order-independent after 508df8b) |
| [x] | `V31` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | Both servers get `didOpen`; diagnostics merged | pass (lsp-host.test.ts) |
| [x] | `V34` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | `stop()` ≤ 700 ms; pid gone; exit logged first | pass (lsp-host.test.ts; stop waits for all children after 80affa6) |
| [x] | `V51` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | Local `tsc` spawned; gate picks one TS server | pass (lsp-host.test.ts; stub warmed after 11c0e0c) |
| [x] | `V52` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | `[{x:1}, null]`; `didChangeConfiguration` after `initialized`; rust-analyzer `initOptions` | pass (lsp-host.test.ts) |
| [x] | `V53` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | `unavailable` with stderr reason; no toast; spawn count 1; `lsp.unavailable` logged | pass (lsp-host.test.ts) |
| [x] | `V41` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T5) | One `didChange` before `hover` | pass (lsp-host.test.ts) |
| [x] | `V54` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T5) | Pull after open and each change; `previousResultId` echoed | pass |
| [x] | `V55` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T5) | Refresh → one more pull per open file | pass |
| [x] | `V56` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T5) | Both kept; close leaves `{push:[…]}` | pass |
| [x] | `V7` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T6) | ≤ 3 dispatches; 0 toasts; `lsp.message` logged | pass (≤ 5 dispatches bound; accepted deviation) |
| [x] | `V29` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T6) | Five `initialize`; `failed`; one toast; `lsp.crashed` logged without note text | pass |
| [x] | `V61` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T6) | Spaced crashes keep restarting; close ones fail | pass |
| [x] | `V32` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T7) | One `didChangeWatchedFiles` for matching glob only | pass |
| [x] | `V48` | `bun test test/integration/lsp-edits.test.ts` (P2-G1-T7) | Disk `b.ts` updated; `a.ts` buffer dirty; "2 files changed" | pass (lsp-edits.test.ts) |
| [x] | `V63` | `bun test test/integration/lsp-edits.test.ts` (P2-G1-T7) | `didChangeWatchedFiles {b.ts, Changed}` after write | pass (lsp-edits.test.ts) |
| [x] | `V44` | `bun test test/integration/lsp-real.test.ts` (P2-G1-T8) | Ready + non-empty hover; skipped without rust-analyzer (record which) | ran locally with rust-analyzer 1.96.0 → pass; skipped on CI without the binary |
| [x] | `V46` | `bun run check` (every task; P2-G1-T1 boundary homes; P3-G1-T7 CI) | biome, tsc, knip zero findings, unit suites, boundaries pass | pass — `bun run check` every group; CI green on PR #11 heads 5b859df, 4f8f849, d4b894a, 15b1e7d |
| [x] | `V47` | `bun test test/ui/lsp.test.ts` (P3-G1-T1) | Gutter sign cell `E` | pass (test/ui/lsp.test.ts) |
| [x] | `V38` | `bun test src/ui/input.test.ts` (P3-G1-T4) | ctrl+space → `<C-Space>`; space → `" "` | pass (src/ui/input.test.ts) |
| [x] | `V6` | `bun test test/e2e/lsp.test.ts` (P3-G1-T5) | Screen shows `◆ fake` within 5 s | pass (test/e2e/lsp.test.ts) |
| [x] | `V12` | `bun test test/e2e/lsp.test.ts` (P3-G1-T5) | Gutter `E`; `]d` moves; `:Diagnostics` row | pass (test/e2e/lsp.test.ts) |
| [x] | `V17` | `bun test test/e2e/lsp.test.ts` (P3-G1-T5) | `Enter` opens the unopened file | pass (test/e2e/lsp.test.ts; reopen-until-row after 4f8f849) |
| [x] | `V43` | `bun test test/e2e/lsp.test.ts` (P3-G1-T5) | No fake-lsp process after quit | pass (test/e2e/lsp.test.ts) |
| [x] | `V42` | `bun run bench` (P3-G1-T6) | `lspKeystrokeP95` ≤ 32 ms gate (non-blocking: speedups, then relaxed threshold recorded) | lspKeystrokeP95 median 5.08 ms local, 8.10 ms Linux CI ≤ 32 ms gate |

## Overall Verification

Start only after every group is accepted.

```text
Fresh verifier → Passed → Project documentation
               → Failed → Fresh implementer remediates
                        → Orchestrator validates closure
                        → Project documentation
               → Blocked
```

1. Cross-work gates: none. Fill `templates/overall-verification-prompt.md` with this goal, the plan index, the three plan parts, requirements, system design, all five group implementation and verification reports (under `work/done/…/reports/`), and the report output path; spawn a fresh `s1mple-verifier`. It writes and separately commits `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/overall-verification-report.md` and returns the commit SHA. A failed report write or commit is retried by the same verifier without rerunning checks.
2. Record the returned report status, path, commit SHA, findings, and check results.
3. For `Passed`, continue to project documentation.
4. For `Failed`, fill `templates/overall-remediation-prompt.md` and spawn one fresh `s1mple-implementer` for all findings whose IDs match `OVR-VER<number>`.
5. Require the implementer to resolve every finding, run affected checks, update affected implementation reports, commit all changes and reports, push the branch without force, and kill every process it starts.
6. Keep the overall-verification report and verdict unchanged. Do not run overall verification again.
7. Validate finding closure, check results, implementation commits, and report commits. Continue to project documentation only when no finding, blocker, or required check remains unresolved.
8. Mark the goal `Blocked` when verification or remediation cannot complete safely within scope.

### Checks

| Complete | Check | Command or method | Expected result | Actual result |
|---|---|---|---|---|
| [x] | Fast gate | `bun run check` | biome, tsc, knip (zero findings), unit suites, boundaries, repo pins pass | `bun run check` 1206 pass, knip zero (overall 26fc65d); 1207 pass after OVR-VER1 fix (6591b03) |
| [x] | CI suites | `bun run test:ci` | Component, integration, and e2e suites pass without language servers installed | `bun run test:ci` 262 pass (overall run and after 6591b03); lsp-real skips without a working rust-analyzer |
| [x] | Bench | `bun run bench` (after `pgrep -f fake-lsp` is empty) | `lspKeystrokeP95` ≤ gate (2× the 16 ms target); a miss is recorded, not blocking | `lspKeystrokeP95` 5.11 ms local, 7.57 ms CI ubuntu (gate 32 ms); all targets ok |
| [x] | Obsolete reference | `rg "maybeOpenCompletion" src test` | No matches | No matches |
| [x] | Process hygiene | `pgrep -f fake-lsp` after suites | No processes | `pgrep -f fake-lsp` empty after every suite and bench |
| [x] | Work-process ids | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]" src test scripts` | No matches | No matches |
| [x] | Delivery | `gh pr checks <pr>` on the PR head and after the work-folder move | All CI jobs green on both heads | Green on pre-move head `5b859df`; post-move heads `4f8f849`, `d4b894a`, `15b1e7d`, `16ff305` (red `ae081ea`, `129e62b` fixed by the next commit) |

### Evidence

- **Status:** `Failed` (one Minor finding, OVR-VER1); remediated
- **Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/overall-verification-report.md`
- **Report commit:** `26fc65d`
- **Findings and owners:** `OVR-VER1` (Minor, Cross-group P1-G2/P2-G1) — `:LspInfo` showed the configured command instead of the resolved binary path
- **Remediation status:** `Completed` — fresh implementer; Fixed
- **Remediation commits:** `OVR-VER1 → 6591b03` (`ServerView.binary`, host sets it, `lspInfo` row shows it; unit + local-tsc integration assertions)
- **Updated implementation report commits:** P1-G2 `5041e26`; P2-G1 `16ff305`
- **Closure evidence:** RED then GREEN for the new unit and integration assertions; `bun run check` 1207 pass; `bun run test:ci` 262 pass; overall report unchanged; pushed `16ff305`, CI green (check, test ubuntu-24.04 + bench, test macos-15; `check` once not acquired by a hosted runner and re-run with zero code change)
- **Remaining issues:** None

## Delivery Acceptance

Not applicable — standalone work. Delivery mechanics (PR, CI, folder move, push) are P3-G1-T7 and the final push below; none of it authorizes merge, tag, or release.

## Project Documentation Finalization

After all groups and overall checks pass, the orchestrator must:

1. Read `.s1mple/docs/project.md`; P3-G1-T7 already updated it for the LSP contracts. Update any fact the implemented result (including overall remediation) changed, and Last Modified.
2. Validate accuracy and links. Preserve unrelated guidance and staged/unstaged changes.
3. Commit only the documentation update, then record validation and SHA below. If unchanged, record why; no empty commit.
4. Push the feature branch without force and confirm every CI job is green on the final head (`gh pr checks <pr> --watch`). Record the head SHA and result. Do not merge.

Missing documents, unresolved conflicts, failed checks/commits, or unsafe change isolation block completion. Send implementation defects back to remediation, not into project guidance.

- **Changes or No-change Reason:** `project.md` updated for facts changed after P3-G1-T7: `stop()` resolves only after every server and version probe exits (P2-G1-VER3 fix), `:LspInfo` shows each started server's resolved binary (`ServerView.binary`, OVR-VER1), and the real rust-analyzer test runs only where `rust-analyzer --version` succeeds (`5b859df`). Last Modified already 2026-10-06
- **Validation and Commit SHA:** each claim checked against `src/app/lsp-host.ts` (`probesExited`, `LSP_STOP_BOUND_MS`), `src/core/state/lsp-pickers.ts` (`serverDetail`), `test/integration/lsp-real.test.ts` (`--version` guard); commit `66e1986` (`docs(project): describe LSP code intelligence`)
- **Final head and CI result:** `8f9ff64` (run 37373088773, after one rerun of its failed jobs): `check`, `test (ubuntu-24.04)` + bench, and `test (macos-15)` all green. Earlier heads `66e1986`/`0cc814e` had `check` unacquired by a hosted runner (zero steps) and passed their test jobs; `8f9ff64`'s first attempt also had `test (macos-15)` miss the unchanged `test/ui/esc.test.ts` 60 ms Esc-timeout median by ~4 ms (63.9 ms), green on rerun. This record commit's own CI is confirmed by the orchestrator in chat. Not merged.

**Commit Message:**

```text
docs(project): describe LSP code intelligence

Work: W261005GWLY — lsp-code-intelligence
```

## Implementation Evidence

- **Commits:** `git log --oneline main..HEAD` on `feat/w261005gwly-lsp-code-intelligence`; task and remediation SHAs per group above
- **Subagent Replacements:** None (each stage used a fresh agent as planned; the P3-G1 implementer was resumed twice by message after its CI monitor went idle)
- **Changed Files:** `git diff --stat main...HEAD` — `src/core/{config,kernel/view,state,features/links}`, `src/workspace/lsp/*`, `src/app/{lsp-host,effects,lifecycle,main}.ts`, `src/ui/*`, `test/{fixtures,support,integration,e2e,ui,bench}`, `scripts/bench-gate.ts`, `package.json`, `bun.lock`, `.s1mple/`
- **Automated Verification:** `bun run check`, `bun run test:ci`, `bun run bench` locally and on CI for PR #11; see Overall Verification Checks
- **Manual Evidence:** P2-G1-T8: `bun bin/so` in a PTY with no `[lsp]` — first frame at 229 ms, exit 0, no child processes (p2-g1-implementation-report.md); P2-G1 verifier drove `bin/so` with the fake server — `shutdown`/`exit` on `:q`, server gone

## Blockers and Deviations

- **Resolved blocker (external, 2026-10-06):** cleared on `8f9ff64`, where `check` was acquired on rerun and passed. Original entry: PR #11 `check` job not acquired by a GitHub-hosted runner on `66e1986` and `0cc814e` (4 attempts, zero steps run); the `test` jobs on the same heads ran and passed. Evidence: run 37366497877, run 37369858446, annotation "The job was not acquired by Runner of type hosted even after multiple attempts". Impact: the final-head CI is not fully green. Required resolution: re-run `check` on PR #11 when runners are available (`gh run rerun <run> --failed`), or the user checks Actions billing/limits (needs `gh auth refresh -s user`). Code-level evidence: `bun run check` passes locally at `0cc814e`; `check` was green on `16ff305`, and only `.s1mple` documents changed since.
- **Deviation (accepted, P1-G2):** `src/core/state/lsp.ts` outside-only definition message is `definition is outside the workspace` without `: <path>`. DES18 text asks for the path, but the design's `LspResult.locations`/`CodeEdit.outside` contract carries only a count; no S/V case asserts the path. Impact: message lacks the path. Resolution: none required in this scope; changing the contract would change approved design.
- **Deviation (accepted, P1-G3):** design-shape additions recorded in `p1-g3-implementation-report.md` (`startCodeEdit` without `then`, `RenamePrompt.rename.name`, `CodeAccept.key/window/cursor`, `lspResult.now` required, shared `applyBufferEdits` Insert-change merge/cursor shift/overlap refusal); verifier accepted them except those fixed by VER1.
- **Deviation (accepted, P2-G1):** `LspClient.request(id, path, op)`, `createLspClient` `AbortSignal`, extra log events `lsp.stderr`/`lsp.dropped` (no document text), progress test bound ≤ 5 (design: ≤ 1 dispatch per 100 ms; implementation throttles at 100 ms), watcher Created reported as `Changed`.
- **Observation (out of scope):** also missed on macOS CI once (`8f9ff64` first attempt, 63.9 ms vs 60 ms median for the legacy-Esc case), green on rerun; candidate for a separate timing-tolerance fix. `test/ui/esc.test.ts` "an arrow key's escape sequence reaches the store at once" (< 10 ms assertion, unchanged since c98aa19) failed once under load average ~20; passes in isolation. Watch on CI.
- **Deviation (accepted, P3-G1):** statusline `✗` also lists failed servers covering the buffer (core detaches failed servers); `src/ui/shell.ts` builds the float (import cycle); fake-server `otherDiagnostics`; real-server test guarded by `rust-analyzer --version`; e2e reopens `:Diagnostics` because an open picker does not refresh (existing behaviour). Logged: shared severity tokens underline cmdline/gutter text (UI discussion); `129e62b` mechanically rewrote three historical lines in plan-3 to `work/done/`.
- **Deviation (accepted, P1-G1):** `severityRank` omitted (listed in the design tree only, no shape, no caller; knip forbids unused exports).

Replace with `None` or entries containing location, evidence, impact, and required resolution.

## Final Completion Checklist

- [x] Every plan part and group is completed.
- [x] Every task outcome is implemented.
- [x] Every task and remediation change has recorded commit evidence or a justified no-change result; no group implementation changes remain uncommitted.
- [x] Every subagent replacement has a recorded reason and complete handoff evidence.
- [x] Every group persisted one complete verification report.
- [x] Every verifier finding and its completion checklist are resolved with closure evidence.
- [x] Every group acceptance criterion is satisfied.
- [x] Every assigned system design chain is covered.
- [x] Every `S` criterion and `V` case has passing evidence.
- [x] The overall-verification report is committed.
- [x] Every overall verification check passes with actual evidence.
- [x] Cross-part contracts and handoffs are integrated and verified.
- [x] The report passed without findings, or every finding whose ID matches `OVR-VER<number>` has orchestrator-validated remediation evidence.
- [x] The overall-verification report path and commit SHA are recorded.
- [x] Project documentation matches the completed implementation and its validation passes.
- [x] Final documentation commit SHA or justified no-change evidence is recorded; no scoped project-document changes remain uncommitted.
- [x] The PR is open and every CI job is green on the final pushed head; nothing was merged, force-pushed, tagged, or released.
- [x] No fake-lsp or other started process remains (`pgrep -f fake-lsp` empty).
- [x] No required check, blocker, deviation, or review finding within the authorized execution scope remains unresolved.
- [x] Final changes match the complete approved plan.

## Completion Summary

`so` has opt-in LSP code intelligence for code file types, delivered as PR https://github.com/therealhieu/so/pull/11 (open, not merged). It covers diagnostics (gutter signs, underlines, insert freeze, `]d`/`[d`, `:Diagnostics`, push and pull), completion (triggers, 150 ms pause, bounded resolve, one-undo auto-imports), navigation (jumps and pickers), hover and signature floats, rename and code actions through one workspace-edit path, formatting and format-on-save, and server status (statusline, `:LspInfo`, toasts). `src/core` stays protocol-free. Every suite passes without real servers.

- Groups: P1-G1 (passed first time), P1-G2 (3 findings fixed), P1-G3 (3 fixed), P2-G1 (3 fixed), P3-G1 (passed first time); overall verification found 1 Minor finding (OVR-VER1), fixed in `6591b03`.
- Checks: `bun run check` 1207 pass, knip zero; `bun run test:ci` 262 pass; `lspKeystrokeP95` 5.11 ms local / 7.57 ms CI against a 32 ms gate; `pgrep -f fake-lsp` empty.
- Accepted deviations are listed under Blockers and Deviations (notably: outside-only definition message has no path; `applyBufferEdits` now merges into a running Insert change and moves cursors for every caller).
- Follow-ups for the user: review and merge PR #11; clear the stale `/goal` that names the `work/active/` path; consider a UI discussion for the underlined severity text in the command line and gutter.
