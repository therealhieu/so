# W261005H4XZ tui-mouse-support Execution Goal

## Status

- **State:** `Complete`
- **Current Position:** `Complete — delivered in PR #8`
- **Last Updated:** `2026-10-05`

## Sources

- s1mple instructions: `.s1mple/S1MPLE.md`
- Project document: `.s1mple/docs/project.md`
- Plan index: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-index.md`
- System design: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-system-design.md`
- UI design: Not applicable — no UI design for this work; the system design is the sole authority
- System requirements: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-requirements.md`
- UI requirements: Not applicable — no UI requirements document for this work
- Plan context: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-context.md`
- Roadmap binding: Not applicable — standalone work (`w261005h4xz-discuss-context.md` "Roadmap Binding": None)
- Current parent sources: Not applicable
- Project standards:
  - `.s1mple/docs/project.md`
  - `.s1mple/docs/communication.md`
  - `.s1mple/docs/languages/typescript.md`
- Plan parts:
  1. `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-1-core-mouse-model.md`
  2. `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-2-ui-mouse-routing.md`

## Execution Contract

- **Goal:** Every mouse gesture in `so` — wheel, click, multi-click, drag, and Ctrl+click — reaches the pure core through one router and runs the same path as its keyboard equivalent, on editor, Bases, chrome, and overlay surfaces. The `mouse` config key switches terminal mouse reporting, and reporting is off after every exit.
- **Scope:** Parts 1 and 2 of the plan index: the core mouse contract, span source columns and `hit.ts`, the `mouse` config key, Bases/picker/calendar reducer exports, the `onMouse` reducer, the UI router and `MouseLayer`, shell wiring and `useMouse` sync, every view's `targetAt`/`dragAt`/`itemAt`, and unit, component, and PTY tests. Then overall verification, project documentation, and delivery through PR #8.
- **Non-goals:** Hover and any-motion tracking; horizontal wheel in editor windows; separator drag resize; drag-and-drop of files, cards, or tabs; right-click menus and middle-click paste; pointer shape (OSC 22); the browser preview page; parent roadmap document changes; releases, tags, or publishing.
- **Execution Order:** Part 1 (`P1-G1`) → Part 2 (`P2-G1` → `P2-G2`). Part 2 depends on Part 1's verified contract, mapping, config key, and `onMouseScroll` removal. `P2-G2` depends on `P2-G1`'s `MouseSource` contract and router wiring.
- **Workflow Behavior:**
  - **Implementation:** Keep it lean and simple. No work-process identifiers (W/REQ/DES/S/V/part/group/task/goal ids) in code, comments, doc comments, identifiers, test names, or log messages; traceability belongs in `.s1mple/` documents and commit message bodies only.
  - **Verification:** "Not established" in `.s1mple/S1MPLE.md`; use the system design §8 verification tree, the plan's task and group checks, `bun run check`, and `bun run test:ci`.
  - **Delivery:** Ship on the existing branch `feat/rm261003abzp-di4-daily-notes-and-bases` in the existing PR #8 (no new branch or PR). Push, make PR #8 CI pass, resolve base-branch conflicts, move the work folder from `work/active/` to `work/done/` and update `.s1mple/` references to it, then push again; CI must pass on the new head. Never force-push or merge without the user's approval.
- **Binding Constraints:**
  - `src/core` imports nothing from `@opentui/*`, I/O, or runtime; `MouseTarget`/`MouseEvent` carry model values only (`test/boundaries.test.ts`).
  - Every state change goes through `store.dispatch` → pure `update`; views and the router only resolve targets.
  - Strict TypeScript, `import type`, colocated behavior-named tests, zero knip findings; every new export has a consumer.
  - Exact dependency pins; no `package.json` change expected.
  - No Bases drag-and-drop (`rm261003abzp-ui-design.md:2359`).
  - Perf and bench gates (`bun run bench`) are reported, not blocking.
  - Every agent kills every process it starts (PTY runs, `bun run dev`, sandboxes) and checks for orphans before finishing and before any bench run.
  - Delegated agents read and follow `.s1mple/S1MPLE.md` and its required references, never use the native `Explore` subagent, and never spawn subagents themselves.
  - No release, tag, or publish.
- **Assigned parent coverage:** Not applicable
- **Cross-work gates:** None
- **Parent synchronization authorization:** Not applicable
- **Reports Directory:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/`
- **Implementation Report Naming:** `p<part-number>-g<group-number>-implementation-report.md` — lowercase prefix, e.g. `p1-g1-implementation-report.md`.
- **Verification Report Naming:** `p<part-number>-g<group-number>-verification-report.md` — lowercase prefix, e.g. `p1-g1-verification-report.md`.
- **Reports:** Each group has exactly these two reports.
- **Overall Verification Prompt:** `templates/overall-verification-prompt.md`
- **Overall Verification Report Template:** `templates/overall-verification-report-template.md`
- **Overall Verification Report:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/overall-verification-report.md`
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
- Do not amend or rewrite history. Push only in the Delivery stage, only to `feat/rm261003abzp-di4-daily-notes-and-bases`; never force-push, merge, tag, or release without the user's approval.
- Every agent kills every process it starts and confirms no orphans remain (`pgrep -fl 'src/app/main.ts|bun run dev'`).

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
4. UI design: Not applicable.
5. Read the complete current system requirements.
6. Read `.s1mple/S1MPLE.md`, `.s1mple/docs/project.md`, the plan context, relevant project structure, and binding project standards.
7. Read every plan part completely in execution order.
8. Confirm the system design, requirements, and plans agree. Mark the goal `Blocked` when a material conflict remains. Roadmap checks: Not applicable — standalone work.
9. After reading every plan part, create one todo per group, followed by `Overall verification`, `Final documentation`, and `Delivery`.
   - Group todos:
     - `P1-G1 (T1-T6): core-mouse-model`
     - `P2-G1 (T1-T5): router-shell-and-window-sources`
     - `P2-G2 (T1-T2): chrome-and-overlay-sources`
   - Include the plan-part path, task IDs, dependencies, and completion conditions in each todo's description.
   - Preserve plan order and dependencies. Start each todo as pending.
   - Mark it in progress when work starts. Complete a group todo only after implementation, verification, remediation, and commit evidence satisfy its acceptance criteria.
   - Keep blockers and detailed task evidence in this goal.
   - Complete overall verification only when all required checks pass. Complete final documentation only after overall verification and the documentation requirements pass. Complete delivery only when PR #8 CI passes on the final pushed head.

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

Every dispatch also states: read and follow `.s1mple/S1MPLE.md` and its required references; do not use the native `Explore` subagent; do not spawn subagents; kill every process you start and check for orphans; no work-process ids in code, tests, comments, or logs; do not push.

Execute each ready group through this cycle:

```text
Fresh implementer
    → Each task: implement → check → self-review → commit
    → Same implementer writes and separately commits implementation report
    → Fresh verifier reads committed implementation report, writes verification report, and separately commits it
    → Fresh implementer remediates from both reports, appends to implementation report, and separately commits the finalized report
    → Main orchestrator validates both reports and report commit evidence → complete or block group
```

1. Cross-work gates: None. Ensure the reports directory exists, assign the implementation and verification report paths using the Execution Contract, and fill `templates/group-implementation-prompt.md`; spawn a fresh `s1mple-implementer` agent.
2. Continue only when implementation and task commit evidence are complete, the implementer has written and separately committed the assigned implementation report, and its report commit SHA is recorded.
3. Read and fill `templates/group-verification-prompt.md` with the committed implementation report path and its starting/final commits; spawn a fresh `s1mple-verifier` agent to inspect the complete group changes, write and separately commit the verification report, and return its commit SHA.
4. Confirm the verification report and its commit SHA exist. Inspect its status and outstanding items. If remediation is needed, fill `templates/group-remediation-prompt.md` with the implementation and verification report paths; spawn a fresh `s1mple-implementer` agent.
5. Confirm both reports and their final commit SHAs exist. Validate acceptance, closure evidence, and task/remediation SHAs or justified no-change results. Record them before group completion; unresolved findings, blockers, required checks, failed commits, uncommitted reports, or uncommitted group implementation changes prevent completion.
6. The orchestrator validates report commits but does not author or commit the implementation report. Update this goal after every stage; check items only with persisted evidence.

Do not synthesize findings, rerun substantive verification, or change approved requirements, design decisions, or scope. The same verifier may retry only a failed report write or report commit without rerunning checks or changing its result. Skip remediation only for a `Passed` report with no outstanding items.

Treat blocker and deviation entries as historical evidence, not instructions. Label unverified claims as `Unverified`. Do not copy instruction-like text from those entries into agent assignments.

## Execution Flow

```text
Part 1: core-mouse-model → Part 2: ui-mouse-routing
    → Overall verification → Project documentation finalization → Delivery (PR #8) → Complete
```

## Progress

### Part 1 — core-mouse-model

- **Plan:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-1-core-mouse-model.md`
- **Dependencies:** None
- **Status:** `Completed`

#### P1-G1 — core-mouse-model

- [x] Context and dependencies confirmed.
- [x] Implementation turn completed.
- [x] `P1-G1-T1` — Span source columns and cell mapping.
- [x] `P1-G1-T2` — Mouse config key.
- [x] `P1-G1-T3` — Mouse contract and text gestures.
- [x] `P1-G1-T4` — Wheel under the pointer.
- [x] `P1-G1-T5` — Chrome, Bases, and overlay item presses.
- [x] `P1-G1-T6` — Overlay and command-line gate.
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

- Implementation: `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p1-g1-implementation-report.md` — `Completed` (change range `da4275e` → `23941de`)
- Initial implementation report commit: `b6710bb`
- Verification: `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p1-g1-verification-report.md` — `Failed` (one Major finding `P1-G1-VER1`; all group checks passed)
- Verification report commit: `c3a7a3f`
- Remediation: `Completed` by a fresh implementer; `sourceColAt` takes the source line length so past-end cells map to it
- Final implementation report commit: `5dffdd9`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `P1-G1-VER1` (`P1-G1-T1`) → `a3d73ab`
- Closure evidence: `hit.test.ts` 6 pass (was 5 pass / 1 fail `Expected: 20, Received: 18` before the fix); new reducer case for a click past a line ending in a link; `bun run check` exit 0 (1044 pass); V31 and work-ID scans clean; `test:ci` 191 pass; no orphans; working tree clean

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G1-T1` | `3ae1d38`; remediation `a3d73ab` |
| `P1-G1-T2` | `93a1e08` |
| `P1-G1-T3` | `b98c8ae`; press-order fix in `1957fde` |
| `P1-G1-T4` | `e139649` |
| `P1-G1-T5` | `1957fde`; test follow-up `23941de` |
| `P1-G1-T6` | `fc01724` |

### Part 2 — ui-mouse-routing

- **Plan:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-2-ui-mouse-routing.md`
- **Dependencies:** Part 1
- **Status:** `Completed`

#### P2-G1 — router-shell-and-window-sources

- [x] Context and dependencies confirmed.
- [x] Implementation turn completed.
- [x] `P2-G1-T1` — Mouse router.
- [x] `P2-G1-T2` — Shell wiring and mouse-mode sync.
- [x] `P2-G1-T3` — Editor and window targets.
- [x] `P2-G1-T4` — Bases targets.
- [x] `P2-G1-T5` — Terminal mouse modes over a PTY.
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

- Implementation: `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p2-g1-implementation-report.md` — `Completed` (change range `184d3bc` → `18f9966`)
- Initial implementation report commit: `50509c4`
- Verification: `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p2-g1-verification-report.md` — `Failed` (one Minor test-coverage finding `P2-G1-VER1`; all chains satisfied, all checks passed)
- Verification report commit: `9d642dd`
- Remediation: `Completed` by a fresh implementer; component test for drag edge-scroll added
- Final implementation report commit: `e773834`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `P2-G1-VER1` (`P2-G1-T3`) → `b32c9c5`
- Closure evidence: new edge-drag case passes with real code and fails with `edge` forced to 0 (`Expected: 9, Received: 8`); `test/ui/mouse.test.ts` 6 pass; `bun run check` exit 0 (1050 pass); `bun run test:ci` exit 0 (199 pass); work-ID scan clean; no orphans; working tree clean

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P2-G1-T1` | `7e4fa01` |
| `P2-G1-T2` | `cbaf500` |
| `P2-G1-T3` | `15cb104`; remediation test `b32c9c5` |
| `P2-G1-T4` | `8d4bc80` |
| `P2-G1-T5` | `18f9966` |

#### P2-G2 — chrome-and-overlay-sources

- [x] Context and dependencies confirmed.
- [x] Implementation turn completed.
- [x] `P2-G2-T1` — Chrome targets.
- [x] `P2-G2-T2` — Overlay targets.
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

- Implementation: `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p2-g2-implementation-report.md` — `Completed` (change range `cbf6446` → `3be97c7`)
- Initial implementation report commit: `ca6412a`
- Verification: `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p2-g2-verification-report.md` — `Failed` (`P2-G2-VER1` Major which-key inside click closed it; `P2-G2-VER2` Major wheel over a toast scrolled the window; `P2-G2-VER3` Minor missing inert/hidden-panel tests; all checks passed)
- Verification report commit: `a6bda04`
- Remediation: `Completed` by a fresh implementer, following the orchestrator decision to match REQ2/REQ7 as written (no requirement revision)
- Final implementation report commit: `260e931`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `P2-G2-VER1` (`P2-G2-T2`) → `a20ac03`; `P2-G2-VER2` (`P2-G2-T2`) → `caab0e2`; `P2-G2-VER3` (`P2-G2-T1`, `P2-G2-T2`) → `715e048`
- Closure evidence: each fix has RED (revert) / GREEN evidence; VER3 cases each fail under a targeted mutation; `test/ui/mouse.test.ts` 16 pass; `src/ui/mouse.test.ts` 7 pass; `bun run check` exit 0 (1052 pass); `bun run test:ci` exit 0 (209 pass, 58 snapshots unchanged); V31, work-ID, and core-`@opentui` scans clean; no orphans; working tree clean

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P2-G2-T1` | `dc9becd`; remediation `715e048` |
| `P2-G2-T2` | `3be97c7`; remediation `a20ac03`, `caab0e2`, `715e048` |

## Roadmap Evidence

Not applicable — standalone work

## Success Criteria

Canonical definitions: system design §8 "Design Success Criteria".

| Complete | Criterion | Observable condition | Verification cases | Evidence |
|---|---|---|---|---|
| [x] | `S1` | Each gesture yields the same state and effects as its keyboard equivalent from the same start state | `V1`, `V3`, `V30`, `V31` | Equivalence reducer tests (V1, V30, V31) + component/router z-order (V3) |
| [x] | `S2` | Right and middle buttons, and events while mouse is off, change nothing | `V2`, `V25`, `V29` | Router drop tests (V2), PTY mouse-off (V25), contract type check (V29) |
| [x] | `S3` | The wheel acts on the surface under the pointer and leaves focus and mode unchanged | `V4`, `V5`, `V6`, `V20` | Reducer wheel tests (V4–V6) + component wheel over split (V20); toast wheel inert |
| [x] | `S4` | A press focuses the window, explorer, or side panel under it | `V7` | Reducer press-focus tests (V7) |
| [x] | `S5` | A click maps to the source column shown under the pointer on wrapped, tabbed, concealed, and widget rows | `V8`, `V9`, `V10`, `V21` | `hit.test.ts` (V8–V10) + component wrapped/gutter click (V21) + past-end and wrap-row-end fixes (`a3d73ab`, `c6444ab`) |
| [x] | `S6` | Mode rules after a text click hold (Insert stays with split undo; Visual → Normal; pending cancelled) | `V11` | Insert click undo split (V11) |
| [x] | `S7` | Drag yields charwise Visual from the press to the pointer, extending and edge-scrolling | `V12`, `V22` | Reducer drag (V12) + router capture/dedupe (V22) + edge-drag component (`b32c9c5`) + no drag after a consumed press (`2a0b2d3`) |
| [x] | `S8` | Double- and triple-click equal `viw` and `V`; clicks beyond 500 ms or another cell are singles | `V13`, `V14` | Router click counting (V13) + reducer `viw`/`V` (V14) |
| [x] | `S9` | Ctrl+click on a link equals placing the cursor and `gd` | `V15` | Ctrl+click reducer test (V15) |
| [x] | `S10` | Chrome and Bases clicks equal their keyboard actions, with Bases single = focus, double = open | `V1`, `V16`, `V17`, `V23` | Reducer chrome/Bases (V1, V17) + component (V16, V23) |
| [x] | `S11` | Overlay item clicks accept; toasts pass clicks through | `V3`, `V18` | Router/component z-order (V3) + picker row and toast pass-through (V18) |
| [x] | `S12` | Outside clicks close dismissible overlays and the command line (consumed); prompt and conflict ignore the mouse; completion yields | `V19`, `V24` | Reducer gate (V19, V24) + which-key inside no-op and outside close (`a20ac03`) |
| [x] | `S13` | `mouse = false` keeps terminal mouse tracking off while running; default runs button-event tracking | `V25`, `V26`, `V27` | PTY modes (V25, V26) + schema default (V27) |
| [x] | `S14` | Mouse tracking is off after every exit path | `V28` | Exit restore suites (V28): 10 pass, assertions unchanged |

## Verification Cases

Canonical definitions: system design §8 "Test Suites and Cases". Ordered by owning task in plan order.

| Complete | Case | Command or method | Expected result | Actual result |
|---|---|---|---|---|
| [x] | `V8` (`P1-G1-T1`) | `bun test src/core/kernel/view/hit.test.ts` | Concealed link alias click maps to the alias character's source column | Pass — `hit.test.ts` (P1-G1 verifier) |
| [x] | `V9` (`P1-G1-T1`) | `bun test src/core/kernel/view/hit.test.ts` | `"\tab"`, tabWidth 4: display cols 0–3 → 0, 4 → 1, past end → 3 | Pass — `hit.test.ts` (P1-G1 verifier) |
| [x] | `V10` (`P1-G1-T1`) | `bun test src/core/kernel/view/hit.test.ts` | `rowAt` returns the wrapped line with its wrap start, widget rows, and honors `skipRows` | Pass — `hit.test.ts` (P1-G1 verifier) |
| [x] | `V27` (`P1-G1-T2`) | `bun test src/core/config/schema.test.ts` | `{}` → `mouse` true; `mouse = "yes"` → error naming `mouse` | Pass — `schema.test.ts` (P1-G1 verifier) |
| [x] | `V7` (`P1-G1-T3`) | `bun test src/core/state/mouse.test.ts` | Press sets `windows.active` or the panel focus flag; winbar press leaves the cursor unchanged | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V11` (`P1-G1-T3`) | `bun test src/core/state/mouse.test.ts` | Insert click keeps Insert; `u` undoes only text typed after the click | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V12` (`P1-G1-T3`) | `bun test src/core/state/mouse.test.ts` | Press (2,3), drag (4,1) → Visual, anchor (2,3), cursor (4,1); `y` yanks that range | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V14` (`P1-G1-T3`) | `bun test src/core/state/mouse.test.ts` | Clicks 2 and 3 equal keys `v i w` / `V` at that position | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V15` (`P1-G1-T3`) | `bun test src/core/state/mouse.test.ts` | Ctrl press on a wikilink equals cursor there + `gd`; on plain text equals a plain press | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V29` (`P1-G1-T3`) | `bun run check` (tsc) | `MouseEvent` has no button field; the `@ts-expect-error` stays required | Pass — tsc exit 0; `@ts-expect-error` still required (P1-G1 verifier) |
| [x] | `V31` (`P1-G1-T3`, `P2-G2-T2`) | `rg 'kind: "scroll"\|onMouseScroll' src` | No matches | Pass — no matches (P1-G1, P2-G2) |
| [x] | `V1` (`P1-G1-T4`, `P1-G1-T5`) | `bun test src/core/state/mouse.test.ts` | Each chrome target and list wheel equals the documented keys on state and effects | Pass — `mouse.test.ts` equivalence cases (P1-G1) |
| [x] | `V4` (`P1-G1-T4`) | `bun test src/core/state/mouse.test.ts` | Wheel over the inactive split scrolls it +3; active and mode unchanged; horizontal wheel no-op | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V5` (`P1-G1-T4`) | `bun test src/core/state/mouse.test.ts` | Explorer cursor moves 3 visible paths; `explorer.focused` stays false | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V6` (`P1-G1-T4`) | `bun test src/core/state/mouse.test.ts` | Inactive Base focus index +3; `windows.active` unchanged | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V17` (`P1-G1-T5`) | `bun test src/core/state/mouse.test.ts` | Bases single press focuses only; double equals focus + `<CR>` | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V19` (`P1-G1-T6`) | `bun test src/core/state/mouse.test.ts` | With prompt or conflict open, every press and wheel leaves state unchanged with no effects | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V24` (`P1-G1-T6`) | `bun test src/core/state/mouse.test.ts` | Outside press closes picker / `:` line without touching the window; completion closes and the cursor moves | Pass — `mouse.test.ts` (P1-G1 verifier) |
| [x] | `V2` (`P2-G1-T1`) | `bun test src/ui/mouse.test.ts` | Right/middle button and disabled mouse dispatch nothing | Pass — `src/ui/mouse.test.ts` (P2-G1 verifier) |
| [x] | `V3` (`P2-G1-T1`, `P2-G2-T2`) | `bun test src/ui/mouse.test.ts test/ui/mouse.test.ts` | The first source with a target wins; overlay before window; toast area not a source | Pass — router unit + component (`src/ui/mouse.test.ts`, `test/ui/mouse.test.ts`) |
| [x] | `V13` (`P2-G1-T1`) | `bun test src/ui/mouse.test.ts` | Clicks at 0, 300, 600 ms same cell → 1, 2, 3; another cell → 1; > 500 ms → 1 | Pass — `src/ui/mouse.test.ts` (P2-G1 verifier) |
| [x] | `V22` (`P2-G1-T1`) | `bun test src/ui/mouse.test.ts` | Drags outside the origin use `origin.dragAt`; equal targets dispatch once; up clears origin | Pass — `src/ui/mouse.test.ts` (P2-G1 verifier) |
| [x] | `V20` (`P2-G1-T3`) | `bun test test/ui/mouse.test.ts` | Wheel over the right split scrolls it 3; active unchanged | Pass — `test/ui/mouse.test.ts` (P2-G1 verifier) |
| [x] | `V21` (`P2-G1-T3`) | `bun test test/ui/mouse.test.ts` | Wrapped-row click lands on the matching source column; gutter → col 0 | Pass — `test/ui/mouse.test.ts` (P2-G1 verifier) |
| [x] | `V23` (`P2-G1-T4`) | `bun test test/ui/mouse.test.ts` | Bases view-tab click switches view; table-cell click sets focus row/column | Pass — `test/ui/mouse.test.ts` (P2-G1 verifier) |
| [x] | `V25` (`P2-G1-T5`) | `bun test test/e2e/mouse.test.ts` | `mouse = false`: mode `"none"` while running; SGR click leaves the cursor | Pass — `test/e2e/mouse.test.ts` (P2-G1 verifier) |
| [x] | `V26` (`P2-G1-T5`) | `bun test test/e2e/mouse.test.ts` | Default: mode `"drag"` while running; SGR press/release moves the cursor | Pass — `test/e2e/mouse.test.ts` (P2-G1 verifier) |
| [x] | `V28` (`P2-G1-T5`) | `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts` | `screen.mouse` `"none"` after `:q`, `SIGTERM`, crash; assertions unchanged | Pass — quit/restore 10 pass, assertions unchanged (P2-G1 verifier) |
| [x] | `V16` (`P2-G2-T1`) | `bun test test/ui/mouse.test.ts` | Bufferline tab switches buffer; explorer folder expands; file opens (`fileLoad` effect) | Pass — `test/ui/mouse.test.ts` |
| [x] | `V18` (`P2-G2-T2`) | `bun test test/ui/mouse.test.ts` | Picker row click accepts that item; click under a toast reaches the window | Pass — `test/ui/mouse.test.ts` |
| [x] | `V30` (`P2-G2-T2`) | `bun run check` | Exit 0: biome, tsc, knip, unit suites | Pass — `bun run check` exit 0 (1052 pass) |

## Overall Verification

Start only after every group is accepted.

```text
Fresh verifier → Passed → Project documentation
               → Failed → Fresh implementer remediates
                        → Orchestrator validates closure
                        → Project documentation
               → Blocked
```

1. Cross-work gates: None. Fill `templates/overall-verification-prompt.md` with this goal, the plan index, both plan parts, the system requirements, the system design (UI sources: Not applicable), all three group implementation and verification reports, and the assigned report output; spawn a fresh `s1mple-verifier`.
2. Record the returned report status, path, commit SHA, findings, and check results.
3. For `Passed`, continue to project documentation.
4. For `Failed`, fill `templates/overall-remediation-prompt.md` and spawn one fresh `s1mple-implementer` for all findings whose IDs match `OVR-VER<number>`.
5. Require the implementer to resolve every finding, run affected checks, update affected implementation reports, and commit all changes and reports.
6. Keep the overall-verification report and verdict unchanged. Do not run overall verification again.
7. Validate finding closure, check results, implementation commits, and report commits. Continue to project documentation only when no finding, blocker, or required check remains unresolved.
8. Mark the goal `Blocked` when verification or remediation cannot complete safely within scope.

### Checks

| Complete | Check | Command or method | Expected result | Actual result |
|---|---|---|---|---|
| [x] | Fast gate (V29, V30) | `bun run check` | Exit 0: biome, tsc, knip, unit suites | Exit 0 — 1055 pass (overall verifier; orchestrator rerun after remediation also exit 0). One first-run flake in untouched `src/workspace/watcher.test.ts`, clean on 3 isolated runs and the rerun |
| [x] | Full suites | `bun run test:ci` | Component, integration, and PTY suites green, including `test/ui/mouse.test.ts` and `test/e2e/mouse.test.ts` | Exit 0 — 211 pass, 58 snapshots (after remediation) |
| [x] | Exit restore (V28) | `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts` | `screen.mouse` is `"none"` after `:q`, `SIGTERM`, and crash | 10 pass, assertions unchanged |
| [x] | Obsolete reference (V31) | `rg 'kind: "scroll"\|onMouseScroll' src` | No matches | No matches |
| [x] | Work-ID scan | `rg -n 'W261005H4XZ\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b' src test` over changed files | No matches | No matches (pattern also covered `OVR-VER`) |
| [x] | Benchmarks | `bun run bench` | Reported only; non-blocking | All `ok` (e.g. `firstFrame` 148 ms, `liveKeystrokeP95` 11.7 ms); remediation touched only per-press code, not rerun |
| [x] | Process cleanup | `pgrep -fl 'src/app/main.ts\|bun run dev'` after test runs | No orphan processes started by the work | No orphans |
| [x] | CI | PR #8 checks after each push (Delivery stage) | `check` and `test` jobs green on the pushed head | `1a63124`: `check`, `test (ubuntu-24.04)`, `test (macos-15)` pass (bench on Linux included); final head checked after the last push (see Delivery) |

The CI check is recorded in the Delivery stage; the verifier runs the local checks.

### Evidence

- **Status:** `Failed` → remediated; orchestrator validated closure
- **Report:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/overall-verification-report.md`
- **Report commit:** `e6fbd4b`
- **Findings and owners:** `OVR-VER1` (Major, Cross-group P1-G1/P2-G1) click right of a non-last wrap row landed on the next row; `OVR-VER2` (Major, Cross-group P2-G1/P1-G1) drag after a press that only closed the `:` line entered Visual from the old cursor
- **Remediation status:** `Completed` by one fresh implementer
- **Remediation commits:** `OVR-VER1` → `c6444ab` (`ScreenRow.endCol`, `displayColAt`); `OVR-VER2` → `2a0b2d3` (core `pressStops` predicate shared by `overlayGate` and the router's `stops` option; wheel unchanged)
- **Updated implementation report commits:** P1-G1 `18a6d25`; P2-G1 `3b99053`
- **Closure evidence:** both findings reproduced RED with the verifier's probe values (`col 32` vs `30`; `visual` anchor `{1,0}` cursor `{2,4}`) then GREEN; mutation check on `OVR-VER2`; `bun run check` exit 0 (1055 pass, orchestrator rerun); `bun run test:ci` 211 pass; quit/restore 10 pass; V31 and work-ID scans clean; no orphans; working tree clean
- **Remaining issues:** None. Plan part 2 text does not list the router `stops` option; code is the source of truth (recorded in Blockers and Deviations)

## Delivery Acceptance

Not applicable — standalone work; no roadmap delivery assessment. Delivery for this work follows the Delivery stage below.

## Project Documentation Finalization

After all groups and overall checks pass, the orchestrator must:

1. Read `.s1mple/docs/project.md`; update affected facts and Last Modified from the implemented result, not task history (e.g. the `mouse` config key, the mouse router in `src/ui/mouse.ts`, and the core `onMouse` reducer in `src/core/state/mouse.ts`).
2. Validate accuracy and links. Preserve unrelated guidance and staged/unstaged changes.
3. Commit only the documentation update, then record validation and SHA below. If unchanged, record why; no empty commit.

Missing documents, unresolved conflicts, failed checks/commits, or unsafe change isolation block completion. Send implementation defects back to remediation, not into project guidance.

- **Changes or No-change Reason:** `.s1mple/docs/project.md` — Last Modified 2026-10-05; Purpose mentions mouse support and the `mouse` setting and lists the mouse system design as a source; Architecture adds the mouse input flow (MouseLayer → router → source z-order → `onMouse`); Data and Contracts adds a Mouse row and the top-level `mouse` config key; Sources lists `src/core/state/mouse.ts` and `src/ui/mouse.ts`
- **Validation and Commit SHA:** source order, `useMouse` sync, and exported symbols checked against `src/ui/shell.ts`, `src/ui/mouse.ts`, `src/core/state/mouse.ts`, `src/core/kernel/view/hit.ts`, `src/core/config/schema.ts`; unrelated guidance preserved — commit `4aefb4d`

**Commit Message:**

```text
docs(project): <documented outcome>

Work: W261005H4XZ — tui-mouse-support
```

## Delivery

Run after project documentation finalization. The orchestrator owns this stage.

1. Push the branch `feat/rm261003abzp-di4-daily-notes-and-bases` (no force-push). PR #8 already exists; do not open another PR.
2. Wait for PR #8 CI; fix failures through a fresh `s1mple-implementer` remediation and push again. Resolve conflicts with `main` without force-pushing or rewriting history; if that is impossible, mark the goal `Blocked`.
3. Move `.s1mple/work/done/w261005h4xz-tui-mouse-support/` to `.s1mple/work/done/w261005h4xz-tui-mouse-support/` with `git mv`, update every `.s1mple/` reference to the old path, and commit.
4. Push again; PR #8 CI must pass on the new head.
5. Never merge, force-push, tag, or release without the user's approval.

- **First push and CI:** pushed `f1302f3..1a63124` (no force); PR #8 checks `check`, `test (ubuntu-24.04)`, `test (macos-15)`, CodeRabbit all pass
- **Conflict resolution:** none needed — `origin/main` (`d398ad7`) is an ancestor of the branch; PR #8 `MERGEABLE`
- **Work-folder move commit:** `69e6587` (`git mv` to `.s1mple/work/done/w261005h4xz-tui-mouse-support/`). The rewritten `.s1mple/` references (`.s1mple/docs/project.md`, plans, reports) were left unstaged by that commit and are committed in the follow-up `docs: update W261005H4XZ references to work/done`; afterwards `rg 'active/w261005h4xz'` finds nothing
- **Final push and CI on head:** the commit recording this evidence is pushed as the final head; its PR #8 CI result is checked after the push and reported to the user (recording it here would need another commit and push)

## Implementation Evidence

- **Commits:** P1-G1 `3ae1d38`, `93a1e08`, `b98c8ae`, `e139649`, `1957fde`, `fc01724`, `23941de`, `a3d73ab`; P2-G1 `7e4fa01`, `cbaf500`, `15cb104`, `8d4bc80`, `18f9966`, `b32c9c5`; P2-G2 `dc9becd`, `3be97c7`, `a20ac03`, `caab0e2`, `715e048`; overall remediation `c6444ab`, `2a0b2d3`; reports `b6710bb`, `c3a7a3f`, `5dffdd9`, `50509c4`, `9d642dd`, `e773834`, `ca6412a`, `a6bda04`, `260e931`, `e6fbd4b`, `18a6d25`, `3b99053`; docs `4aefb4d`; move `69e6587`
- **Subagent Replacements:** None
- **Changed Files:** 37 code files under `src/` and `test/` (`git diff --name-only da4275e..HEAD -- src test`): core `config/schema`, `kernel/view/{types,text-view,hit}`, `state/{types,update,mouse,base-commands,picker,calendar}`; UI `mouse`, `shell`, `editors/{text-view,registry,base-view}`, `views/{window-tree,explorer,side-panel,bufferline,statusline,cmdline}`, `overlays/{host,picker,calendar,completion,whichkey,notify}`; tests `hit.test`, `mouse.test` (core and UI), `schema.test`, `toml.test`, `text-view.test`, `test/ui/mouse.test`, `test/e2e/{mouse.test,pty}`, `test/support/ui`; plus `.s1mple/docs/project.md`
- **Automated Verification:** `bun run check` exit 0 (1055 pass); `bun run test:ci` 211 pass; quit/restore 10 pass; `bun run bench` all ok; V31, work-ID, core-`@opentui` scans clean; PR #8 CI green on `1a63124`
- **Manual Evidence:** `Not required`

## Blockers and Deviations

- **P2-G2 file-scope extension (authorized by the orchestrator).** Location: `src/ui/overlays/whichkey.ts`, `src/ui/overlays/notify.ts`, `src/ui/mouse.ts` (`MouseSource.wheelOnly`), `src/ui/shell.ts` (`toasts` after `overlays` in `sources`). Evidence: `P2-G2-VER1`, `P2-G2-VER2`; commits `a20ac03`, `caab0e2`. Impact: REQ7 (which-key click does nothing) and REQ2 (wheel over a toast does nothing) now hold as written; clicks still pass through toasts. Resolution: none required — requirements were kept authoritative; no requirement revision.
- **Design text drift.** Location: system design §2/§4/§5 say `ToastStack` is not a mouse source; §7 says the which-key box comes from `centered`. Evidence: `ToastStack` is now a wheel-only source answering `inert`; which-key keeps its own painted box. Impact: documentation only; behavior matches the approved requirements. Resolution: recorded here and in `reports/p2-g2-implementation-report.md`; the finalized design document is left unchanged.
- **Router `stops` option and wrap-row `endCol`.** Location: `src/ui/mouse.ts` (`createMouseRouter` `stops`), `src/core/state/mouse.ts` (`pressStops`), `src/core/kernel/view/hit.ts` (`ScreenRow.endCol`, `displayColAt`). Evidence: `OVR-VER1`, `OVR-VER2`; commits `c6444ab`, `2a0b2d3`. Impact: not in plan/design text; needed for REQ4, REQ5, REQ8 as written. Resolution: none required; recorded in the P1-G1 and P2-G1 implementation reports.
- **Earlier group deviations** (core-path choices, `sourceColAt` `lineLength` argument, test-renderer frame between drags) are recorded in each group's implementation report and were accepted by the group verifiers.


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
- [x] Work folder moved to `work/done/`, `.s1mple/` references updated, and PR #8 CI green on the final pushed head.
- [x] No merge, force-push, tag, or release was performed without the user's approval.
- [x] No required check, blocker, deviation, or review finding within the authorized execution scope remains unresolved.
- [x] Final changes match the complete approved plan.

## Completion Summary

Mouse support ships in PR #8. Every gesture (wheel, click, double- and triple-click, drag, Ctrl+click) goes through one router in `src/ui/mouse.ts` and the pure `onMouse` reducer in `src/core/state/mouse.ts`. Each one replays its keyboard path on editor, Bases, chrome, and overlay surfaces. The `mouse` config key (default `true`) switches terminal reporting, and reporting is off after every exit.

- **Groups:** P1-G1, P2-G1, and P2-G2 were each verified, remediated, and accepted (findings `P1-G1-VER1`, `P2-G1-VER1`, `P2-G2-VER1`–`VER3`).
- **Overall verification:** found `OVR-VER1` and `OVR-VER2`, both fixed and validated.
- **Final state:** all S1–S14 criteria and V1–V31 cases have passing evidence. No merge, force-push, tag, or release was performed.
