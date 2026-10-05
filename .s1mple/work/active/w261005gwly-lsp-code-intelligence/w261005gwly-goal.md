# W261005GWLY lsp-code-intelligence Execution Goal

## Status

- **State:** `In Progress`
- **Current Position:** `P1-G3 — implementation`
- **Last Updated:** `2026-10-05`

## Sources

- s1mple instructions: `.s1mple/S1MPLE.md`
- Project document: `.s1mple/docs/project.md`
- Plan index: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-index.md`
- System design: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-system-design.md`
- UI design: Not applicable — no UI design was authored; the system design covers the UI surfaces with existing tokens and overlays
- System requirements: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-requirements.md`
- UI requirements: Not applicable — none authored
- Plan context: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-context.md`
- Roadmap binding: Not applicable — standalone work (`w261005gwly-discuss-context.md` § Roadmap Binding: None)
- Current parent sources: Not applicable
- Project standards:
  - `.s1mple/docs/project.md`
  - `.s1mple/docs/communication.md`
  - `.s1mple/docs/languages/typescript.md`
- Plan parts:
  1. `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-1-core.md`
  2. `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-2-host.md`
  3. `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-3-ui-and-delivery.md`

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
- **Reports Directory:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/` (`.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/` after P3-G1-T7)
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

- **Plan:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-1-core.md`
- **Dependencies:** None
- **Status:** `In Progress`

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

- Implementation: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g1-implementation-report.md` — `Completed`
- Initial implementation report commit: `41e7430`
- Verification: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g1-verification-report.md` — `Passed`, no findings
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

- Implementation: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g2-implementation-report.md` — `Completed` (remediated)
- Initial implementation report commit: `e55372a`
- Verification: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g2-verification-report.md` — `Failed` (VER1 Major, VER2–VER3 Minor)
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

- [ ] Context and dependencies confirmed (P1-G2 accepted).
- [ ] Implementation turn completed.
- [ ] `P1-G3-T1` — One workspace-edit path.
- [ ] `P1-G3-T2` — Rename prompt and code actions.
- [ ] `P1-G3-T3` — Format results and format on save.
- [ ] `P1-G3-T4` — Code completion trigger and ranking.
- [ ] `P1-G3-T5` — Completion accept, resolve, and signature help.
- [ ] Every task has commit SHA(s) or justified no-change evidence.
- [ ] Task-level and group-level checks passed.
- [ ] Initial implementation report persisted and separately committed.
- [ ] Initial implementation report commit SHA recorded.
- [ ] Verification report persisted and separately committed.
- [ ] Verification report commit SHA recorded.
- [ ] Report status checked and remediation assigned to a fresh implementer, or remediation not required.
- [ ] Implementer completed the remediation checklist or no remediation was required.
- [ ] Finalized implementation report separately committed, or initial report commit remains final because remediation was not required.
- [ ] Final implementation report commit SHA recorded.
- [ ] Remediation has follow-up SHA(s) mapped to findings/tasks, justified no-change evidence, or was not required.
- [ ] Orchestrator validated report commits, closure evidence, and commit evidence; no group implementation changes remain uncommitted.
- [ ] Group acceptance criteria satisfied.

**Evidence:**

- Implementation: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g3-implementation-report.md` — `Pending implementation`
- Initial implementation report commit: `Pending implementation`
- Verification: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g3-verification-report.md` — `Pending implementation`
- Verification report commit: `Pending implementation`
- Remediation: `Pending implementation`
- Final implementation report commit: `Pending implementation`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `Pending implementation`
- Closure evidence: `Pending implementation`

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G3-T1` | `Pending implementation` |
| `P1-G3-T2` | `Pending implementation` |
| `P1-G3-T3` | `Pending implementation` |
| `P1-G3-T4` | `Pending implementation` |
| `P1-G3-T5` | `Pending implementation` |

### Part 2 — host

- **Plan:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-2-host.md`
- **Dependencies:** Part 1
- **Status:** `Pending`

#### P2-G1 — Client, host, and wiring

- [ ] Context and dependencies confirmed (Part 1 accepted).
- [ ] Implementation turn completed.
- [ ] `P2-G1-T1` — Protocol packages and converters.
- [ ] `P2-G1-T2` — Incremental sync and project roots.
- [ ] `P2-G1-T3` — Fake language server and test support.
- [ ] `P2-G1-T4` — Client, host attach, and runner routing.
- [ ] `P2-G1-T5` — Document sync and pull diagnostics.
- [ ] `P2-G1-T6` — Crash window, progress, and messages.
- [ ] `P2-G1-T7` — Watched files and edit writes.
- [ ] `P2-G1-T8` — Lifecycle, main wiring, and the real-server check.
- [ ] Every task has commit SHA(s) or justified no-change evidence.
- [ ] Task-level and group-level checks passed; `pgrep -f fake-lsp` empty.
- [ ] Initial implementation report persisted and separately committed.
- [ ] Initial implementation report commit SHA recorded.
- [ ] Verification report persisted and separately committed.
- [ ] Verification report commit SHA recorded.
- [ ] Report status checked and remediation assigned to a fresh implementer, or remediation not required.
- [ ] Implementer completed the remediation checklist or no remediation was required.
- [ ] Finalized implementation report separately committed, or initial report commit remains final because remediation was not required.
- [ ] Final implementation report commit SHA recorded.
- [ ] Remediation has follow-up SHA(s) mapped to findings/tasks, justified no-change evidence, or was not required.
- [ ] Orchestrator validated report commits, closure evidence, and commit evidence; no group implementation changes remain uncommitted.
- [ ] Group acceptance criteria satisfied.

**Evidence:**

- Implementation: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p2-g1-implementation-report.md` — `Pending implementation`
- Initial implementation report commit: `Pending implementation`
- Verification: `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p2-g1-verification-report.md` — `Pending implementation`
- Verification report commit: `Pending implementation`
- Remediation: `Pending implementation`
- Final implementation report commit: `Pending implementation`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `Pending implementation`
- Closure evidence: `Pending implementation`

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P2-G1-T1` | `Pending implementation` |
| `P2-G1-T2` | `Pending implementation` |
| `P2-G1-T3` | `Pending implementation` |
| `P2-G1-T4` | `Pending implementation` |
| `P2-G1-T5` | `Pending implementation` |
| `P2-G1-T6` | `Pending implementation` |
| `P2-G1-T7` | `Pending implementation` |
| `P2-G1-T8` | `Pending implementation` |

### Part 3 — ui-and-delivery

- **Plan:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-3-ui-and-delivery.md`
- **Dependencies:** Parts 1 and 2
- **Status:** `Pending`

#### P3-G1 — UI, end-to-end, and delivery

- [ ] Context and dependencies confirmed (Parts 1 and 2 accepted).
- [ ] Implementation turn completed.
- [ ] `P3-G1-T1` — Diagnostic gutter and theme tokens.
- [ ] `P3-G1-T2` — Info float overlay.
- [ ] `P3-G1-T3` — Statusline segment, cursor diagnostic, and completion rows.
- [ ] `P3-G1-T4` — `<C-Space>` key.
- [ ] `P3-G1-T5` — End-to-end language server suite.
- [ ] `P3-G1-T6` — Keystroke benchmark with a server attached.
- [ ] `P3-G1-T7` — Delivery (PR open, CI green, folder moved to `work/done/`, pushed, CI green again).
- [ ] Every task has commit SHA(s) or justified no-change evidence.
- [ ] Task-level and group-level checks passed; `pgrep -f fake-lsp` empty.
- [ ] Initial implementation report persisted and separately committed.
- [ ] Initial implementation report commit SHA recorded.
- [ ] Verification report persisted and separately committed.
- [ ] Verification report commit SHA recorded.
- [ ] Report status checked and remediation assigned to a fresh implementer, or remediation not required.
- [ ] Implementer completed the remediation checklist or no remediation was required.
- [ ] Finalized implementation report separately committed, or initial report commit remains final because remediation was not required.
- [ ] Final implementation report commit SHA recorded.
- [ ] Remediation has follow-up SHA(s) mapped to findings/tasks, justified no-change evidence, or was not required.
- [ ] Orchestrator validated report commits, closure evidence, and commit evidence; no group implementation changes remain uncommitted.
- [ ] Group acceptance criteria satisfied.

**Evidence:**

- Implementation: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p3-g1-implementation-report.md` (written after the T7 move) — `Pending implementation`
- Initial implementation report commit: `Pending implementation`
- Verification: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p3-g1-verification-report.md` — `Pending implementation`
- Verification report commit: `Pending implementation`
- Remediation: `Pending implementation`
- Final implementation report commit: `Pending implementation`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `Pending implementation`
- Closure evidence: `Pending implementation`
- PR URL: `Pending implementation`

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P3-G1-T1` | `Pending implementation` |
| `P3-G1-T2` | `Pending implementation` |
| `P3-G1-T3` | `Pending implementation` |
| `P3-G1-T4` | `Pending implementation` |
| `P3-G1-T5` | `Pending implementation` |
| `P3-G1-T6` | `Pending implementation` |
| `P3-G1-T7` | `Pending implementation` |

## Roadmap Evidence

Not applicable — standalone work

## Success Criteria

Conditions are defined in system design §8 Design Success Criteria; the column below summarizes them.

| Complete | Criterion | Observable condition | Verification cases | Evidence |
|---|---|---|---|---|
| [ ] | `S1` | No `[lsp]` or `enabled = false` spawns no process | `V1, V2` | `Pending implementation` |
| [ ] | `S2` | `:ConfigReload` toggling `enabled` starts or stops servers | `V2` | `Pending implementation` |
| [ ] | `S3` | `resolveServers` order, overrides, removals, additions | `V3, V4` | `Pending implementation` |
| [ ] | `S4` | Two servers: both diagnostics shown; request to first capable | `V5, V31` | `Pending implementation` |
| [ ] | `S5` | Statusline `◌`/`◆`/`✗`; progress ≤ 1 dispatch per 100 ms | `V6, V7` | `Pending implementation` |
| [ ] | `S6` | error/warning → one toast; info/log → none; `:LspInfo` shows `not on PATH` | `V7, V8` | `Pending implementation` |
| [ ] | `S7` | Every `LspOp` maps to its method and result | `V9, V32, V44, V45, V46` | `Pending implementation` |
| [ ] | `S8` | Unsupported feature reports `<feature>: not supported by <servers>` | `V10` | `Pending implementation` |
| [ ] | `S9` | Bad `fileTypes` is a line error; no Markdown LSP binding | `V11, V39` | `Pending implementation` |
| [ ] | `S10` | One highest-severity sign per line, underline per range, clamped | `V12, V13, V14, V47` | `Pending implementation` |
| [ ] | `S11` | `]d`/`[d` move and wrap | `V12` | `Pending implementation` |
| [ ] | `S12` | Insert-mode freeze; cmdline shows cursor diagnostic | `V15, V16` | `Pending implementation` |
| [ ] | `S13` | `:Diagnostics` lists all, sorted; `Enter` opens | `V12, V17` | `Pending implementation` |
| [ ] | `S14` | Completion on triggers and 150 ms pause; local narrowing | `V18, V19` | `Pending implementation` |
| [ ] | `S15` | Stale completion opens nothing; link completion unchanged | `V20`, obsolete-reference check | `Pending implementation` |
| [ ] | `S16` | Accept applies edit + `additionalTextEdits` in one undo; `snippetSupport` per server | `V21, V33` | `Pending implementation` |
| [ ] | `S17` | Rename over open and closed file changes both | `V22, V48` | `Pending implementation` |
| [ ] | `S18` | Versioned edit for older version applies nothing and says why | `V23` | `Pending implementation` |
| [ ] | `S19` | `applyEdit` answered exactly once; `resourceOperations: []`; lazy action resolve | `V24, V33` | `Pending implementation` |
| [ ] | `S20` | `:Format` is one undo step | `V25` | `Pending implementation` |
| [ ] | `S21` | `formatOnSave` on `:w` only; ≤ 1000 ms delay | `V26` | `Pending implementation` |
| [ ] | `S22` | One process per (server, root); ordered markers; marker-less shared | `V27, V30` | `Pending implementation` |
| [ ] | `S23` | Incremental `didChange` rebuilds buffer text exactly | `V28` | `Pending implementation` |
| [ ] | `S24` | Crash restarts; fifth within 180 s fails with one toast | `V29, V61` | `Pending implementation` |
| [ ] | `S25` | Shutdown → exit at 400 ms; all stopped ≤ 500 ms | `V34` | `Pending implementation` |
| [ ] | `S26` | Neovim 0.11 keys work in code buffers, overridable | `V35, V39` | `Pending implementation` |
| [ ] | `S27` | One definition jumps (`<C-o>` returns); several → picker; outside counted | `V33, V35, V36` | `Pending implementation` |
| [ ] | `S28` | Floats show and close; `<C-Space>` reaches the keymap | `V37, V38, V49` (+ P3-G1-T2 float component case) | `Pending implementation` |
| [ ] | `S29` | Stale hover/definition result changes nothing | `V40` | `Pending implementation` |
| [ ] | `S30` | Keys within 150 ms → one `didChange` before a following request | `V41` | `Pending implementation` |
| [ ] | `S31` | `lspKeystrokeP95` ≤ 16 ms (gate 2×) | `V42` | `Pending implementation` |
| [ ] | `S32` | `bun run check` and `bun run test:ci` pass without servers; no child processes left | `V43, V44, V46` | `Pending implementation` |
| [ ] | `S33` | TS server chosen by root `tsc` major; local `node_modules/.bin` first | `V50, V51` | `Pending implementation` |
| [ ] | `S34` | `workspace/configuration` by dotted path; one `didChangeConfiguration`; rust-analyzer `initOptions` | `V3, V52` | `Pending implementation` |
| [ ] | `S35` | Exit before `initialize` → `unavailable`, quiet, no restart | `V8, V53` | `Pending implementation` |
| [ ] | `S36` | Pull after `didOpen`/`didChange`, refresh re-pull, push+pull kept, close clears pull | `V33, V54, V55, V56` | `Pending implementation` |
| [ ] | `S37` | Snippets inserted as plain text, cursor at `$0`; item command runs after edits | `V57, V58` | `Pending implementation` |
| [ ] | `S38` | Resolve waits ≤ 500 ms; item applied exactly once | `V59` | `Pending implementation` |
| [ ] | `S39` | `ContentModified`/`RequestCancelled` are quiet | `V60, V64` | `Pending implementation` |
| [ ] | `S40` | Partial `applyEdit` replies `applied:false` with `failureReason`; written files reach servers | `V62, V63` | `Pending implementation` |

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
| [ ] | `V22` | `bun test src/core/state/lsp-edits.test.ts` (P1-G3-T1) | Buffer edited in one undo; `applyEdits` for closed file without `expected` | `Pending implementation` |
| [ ] | `V23` | `bun test src/core/state/lsp-edits.test.ts` (P1-G3-T1) | Version mismatch → nothing applied, `lspReply{applied:false}` | `Pending implementation` |
| [ ] | `V24` | `bun test src/core/state/lsp-edits.test.ts` (P1-G3-T1) | One reply, only after `editsApplied` | `Pending implementation` |
| [ ] | `V62` | `bun test src/core/state/lsp-edits.test.ts` (P1-G3-T1) | `failureReason` names skipped `b.ts` | `Pending implementation` |
| [ ] | `V25` | `bun test src/core/state/lsp-commands.test.ts` (P1-G3-T3) | Formatted; `u` restores | `Pending implementation` |
| [ ] | `V26` | `bun test src/core/state/lsp-commands.test.ts` (P1-G3-T3) | `:w` formats first; autosave never formats; timeout writes + warns | `Pending implementation` |
| [ ] | `V18` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T4) | `.` requests; identifier starts 150 ms timer | `Pending implementation` |
| [ ] | `V19` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T4) | No request when complete; one when incomplete | `Pending implementation` |
| [ ] | `V20` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T4) | Stale → overlay none; `[[` → notes mode | `Pending implementation` |
| [ ] | `V21` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T5) | Auto-import in one undo step | `Pending implementation` |
| [ ] | `V58` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T5) | Cursor at stop; `executeCommand` (auto) last | `Pending implementation` |
| [ ] | `V59` | `bun test src/core/state/code-completion.test.ts` (P1-G3-T5) | Exactly one apply; none after version change | `Pending implementation` |
| [ ] | `V33` | `bun test src/workspace/lsp/convert.test.ts` (P2-G1-T1) | Versioned `CodeEdit`; outside counted; capabilities flags as designed | `Pending implementation` |
| [ ] | `V45` | `bun test src/workspace/lsp/convert.test.ts` (P2-G1-T1) | Markdown hover → plain lines, no fences | `Pending implementation` |
| [ ] | `V57` | `bun test src/workspace/lsp/convert.test.ts` (P2-G1-T1) | `flattenSnippet` outputs as listed | `Pending implementation` |
| [ ] | `V64` | `bun test src/workspace/lsp/convert.test.ts` (P2-G1-T1) | -32801/-32800 quiet; -32603 not | `Pending implementation` |
| [ ] | `V27` | `bun test src/workspace/lsp/roots.test.ts` (P2-G1-T2) | `findRoot` table results | `Pending implementation` |
| [ ] | `V28` | `bun test src/workspace/lsp/sync.test.ts` (P2-G1-T2) | 500 seeded sequences rebuild exactly | `Pending implementation` |
| [ ] | `V2` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | No spawn while off; reload starts then stops | `Pending implementation` |
| [ ] | `V30` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | Process counts and `rootUri` values as designed | `Pending implementation` |
| [ ] | `V31` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | Both servers get `didOpen`; diagnostics merged | `Pending implementation` |
| [ ] | `V34` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | `stop()` ≤ 700 ms; pid gone; exit logged first | `Pending implementation` |
| [ ] | `V51` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | Local `tsc` spawned; gate picks one TS server | `Pending implementation` |
| [ ] | `V52` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | `[{x:1}, null]`; `didChangeConfiguration` after `initialized`; rust-analyzer `initOptions` | `Pending implementation` |
| [ ] | `V53` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T4) | `unavailable` with stderr reason; no toast; spawn count 1; `lsp.unavailable` logged | `Pending implementation` |
| [ ] | `V41` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T5) | One `didChange` before `hover` | `Pending implementation` |
| [ ] | `V54` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T5) | Pull after open and each change; `previousResultId` echoed | `Pending implementation` |
| [ ] | `V55` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T5) | Refresh → one more pull per open file | `Pending implementation` |
| [ ] | `V56` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T5) | Both kept; close leaves `{push:[…]}` | `Pending implementation` |
| [ ] | `V7` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T6) | ≤ 3 dispatches; 0 toasts; `lsp.message` logged | `Pending implementation` |
| [ ] | `V29` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T6) | Five `initialize`; `failed`; one toast; `lsp.crashed` logged without note text | `Pending implementation` |
| [ ] | `V61` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T6) | Spaced crashes keep restarting; close ones fail | `Pending implementation` |
| [ ] | `V32` | `bun test test/integration/lsp-host.test.ts` (P2-G1-T7) | One `didChangeWatchedFiles` for matching glob only | `Pending implementation` |
| [ ] | `V48` | `bun test test/integration/lsp-edits.test.ts` (P2-G1-T7) | Disk `b.ts` updated; `a.ts` buffer dirty; "2 files changed" | `Pending implementation` |
| [ ] | `V63` | `bun test test/integration/lsp-edits.test.ts` (P2-G1-T7) | `didChangeWatchedFiles {b.ts, Changed}` after write | `Pending implementation` |
| [ ] | `V44` | `bun test test/integration/lsp-real.test.ts` (P2-G1-T8) | Ready + non-empty hover; skipped without rust-analyzer (record which) | `Pending implementation` |
| [ ] | `V46` | `bun run check` (every task; P2-G1-T1 boundary homes; P3-G1-T7 CI) | biome, tsc, knip zero findings, unit suites, boundaries pass | `Pending implementation` |
| [ ] | `V47` | `bun test test/ui/lsp.test.ts` (P3-G1-T1) | Gutter sign cell `E` | `Pending implementation` |
| [ ] | `V38` | `bun test src/ui/input.test.ts` (P3-G1-T4) | ctrl+space → `<C-Space>`; space → `" "` | `Pending implementation` |
| [ ] | `V6` | `bun test test/e2e/lsp.test.ts` (P3-G1-T5) | Screen shows `◆ fake` within 5 s | `Pending implementation` |
| [ ] | `V12` | `bun test test/e2e/lsp.test.ts` (P3-G1-T5) | Gutter `E`; `]d` moves; `:Diagnostics` row | `Pending implementation` |
| [ ] | `V17` | `bun test test/e2e/lsp.test.ts` (P3-G1-T5) | `Enter` opens the unopened file | `Pending implementation` |
| [ ] | `V43` | `bun test test/e2e/lsp.test.ts` (P3-G1-T5) | No fake-lsp process after quit | `Pending implementation` |
| [ ] | `V42` | `bun run bench` (P3-G1-T6) | `lspKeystrokeP95` ≤ 32 ms gate (non-blocking: speedups, then relaxed threshold recorded) | `Pending implementation` |

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
| [ ] | Fast gate | `bun run check` | biome, tsc, knip (zero findings), unit suites, boundaries, repo pins pass | `Pending implementation` |
| [ ] | CI suites | `bun run test:ci` | Component, integration, and e2e suites pass without language servers installed | `Pending implementation` |
| [ ] | Bench | `bun run bench` (after `pgrep -f fake-lsp` is empty) | `lspKeystrokeP95` ≤ gate (2× the 16 ms target); a miss is recorded, not blocking | `Pending implementation` |
| [ ] | Obsolete reference | `rg "maybeOpenCompletion" src test` | No matches | `Pending implementation` |
| [ ] | Process hygiene | `pgrep -f fake-lsp` after suites | No processes | `Pending implementation` |
| [ ] | Work-process ids | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]" src test scripts` | No matches | `Pending implementation` |
| [ ] | Delivery | `gh pr checks <pr>` on the PR head and after the work-folder move | All CI jobs green on both heads | `Pending implementation` |

### Evidence

- **Status:** `Pending implementation`
- **Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/overall-verification-report.md`
- **Report commit:** `Pending implementation`
- **Findings and owners:** `Pending implementation`
- **Remediation status:** `Pending implementation`
- **Remediation commits:** `Pending implementation`
- **Updated implementation report commits:** `Pending implementation`
- **Closure evidence:** `Pending implementation`
- **Remaining issues:** `Pending implementation`

## Delivery Acceptance

Not applicable — standalone work. Delivery mechanics (PR, CI, folder move, push) are P3-G1-T7 and the final push below; none of it authorizes merge, tag, or release.

## Project Documentation Finalization

After all groups and overall checks pass, the orchestrator must:

1. Read `.s1mple/docs/project.md`; P3-G1-T7 already updated it for the LSP contracts. Update any fact the implemented result (including overall remediation) changed, and Last Modified.
2. Validate accuracy and links. Preserve unrelated guidance and staged/unstaged changes.
3. Commit only the documentation update, then record validation and SHA below. If unchanged, record why; no empty commit.
4. Push the feature branch without force and confirm every CI job is green on the final head (`gh pr checks <pr> --watch`). Record the head SHA and result. Do not merge.

Missing documents, unresolved conflicts, failed checks/commits, or unsafe change isolation block completion. Send implementation defects back to remediation, not into project guidance.

- **Changes or No-change Reason:** `Pending implementation`
- **Validation and Commit SHA:** `Pending implementation`
- **Final head and CI result:** `Pending implementation`

**Commit Message:**

```text
docs(project): describe LSP code intelligence

Work: W261005GWLY — lsp-code-intelligence
```

## Implementation Evidence

- **Commits:** `Pending implementation`
- **Subagent Replacements:** `Pending implementation`
- **Changed Files:** `Pending implementation`
- **Automated Verification:** `Pending implementation`
- **Manual Evidence:** `Pending implementation` (P2-G1-T8 one-off `bun bin/so` start with no `[lsp]` and clean quit)

## Blockers and Deviations

- **Deviation (accepted, P1-G2):** `src/core/state/lsp.ts` outside-only definition message is `definition is outside the workspace` without `: <path>`. DES18 text asks for the path, but the design's `LspResult.locations`/`CodeEdit.outside` contract carries only a count; no S/V case asserts the path. Impact: message lacks the path. Resolution: none required in this scope; changing the contract would change approved design.
- **Deviation (accepted, P1-G1):** `severityRank` omitted (listed in the design tree only, no shape, no caller; knip forbids unused exports).

Replace with `None` or entries containing location, evidence, impact, and required resolution.

## Final Completion Checklist

- [ ] Every plan part and group is completed.
- [ ] Every task outcome is implemented.
- [ ] Every task and remediation change has recorded commit evidence or a justified no-change result; no group implementation changes remain uncommitted.
- [ ] Every subagent replacement has a recorded reason and complete handoff evidence.
- [ ] Every group persisted one complete verification report.
- [ ] Every verifier finding and its completion checklist are resolved with closure evidence.
- [ ] Every group acceptance criterion is satisfied.
- [ ] Every assigned system design chain is covered.
- [ ] Every `S` criterion and `V` case has passing evidence.
- [ ] The overall-verification report is committed.
- [ ] Every overall verification check passes with actual evidence.
- [ ] Cross-part contracts and handoffs are integrated and verified.
- [ ] The report passed without findings, or every finding whose ID matches `OVR-VER<number>` has orchestrator-validated remediation evidence.
- [ ] The overall-verification report path and commit SHA are recorded.
- [ ] Project documentation matches the completed implementation and its validation passes.
- [ ] Final documentation commit SHA or justified no-change evidence is recorded; no scoped project-document changes remain uncommitted.
- [ ] The PR is open and every CI job is green on the final pushed head; nothing was merged, force-pushed, tagged, or released.
- [ ] No fake-lsp or other started process remains (`pgrep -f fake-lsp` empty).
- [ ] No required check, blocker, deviation, or review finding within the authorized execution scope remains unresolved.
- [ ] Final changes match the complete approved plan.

## Completion Summary

`Pending implementation`
