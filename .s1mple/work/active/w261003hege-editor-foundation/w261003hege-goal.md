# W261003HEGE editor-foundation Execution Goal

## Status

- **State:** `In Progress`
- **Current Position:** `P3-G1 — implementation (T1–T6)`
- **Last Updated:** `2026-10-03`

## Sources

- s1mple instructions: `.s1mple/S1MPLE.md`
- Project document: `.s1mple/docs/project.md`
- Plan index: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-index.md`
- System design: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-system-design.md`
- UI design: `Not applicable at work level — parent .s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-design.md (Ready for Planning) supplies visuals consumed through W261003HEGE-DES9 and verified by S14 → V14.1–V14.4`
- System requirements: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-requirements.md`
- UI requirements: `Not applicable — parent RM261003ABZP-UREQ1@R2, UREQ2@R1, UREQ3@R2 (non-Markdown), UREQ7@R2, UREQ11@R1 stay bound through W261003HEGE-REQ1@R3`
- Plan context: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-context.md`
- Roadmap binding: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-discuss-context.md`, section Roadmap Binding (RM261003ABZP, PH1@R2, DI1@R2)
- Current parent sources (read-only):
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md` (DI1 rows `:131`, `:142`)
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-1-daily-usable-editor.md` (G1 `:73`, DI1 `:323-424`)
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-requirements.md`
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-design.md`
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-requirements.md`
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-design.md`
  - `.s1mple/work/active/rm261003abzp-so-v1/ui-mockups/manifest.md` (accepted M1@R1, M4@R1, AD4)
- Project standards:
  - `.s1mple/docs/communication.md`
  - `.s1mple/docs/project.md`
  - `.s1mple/docs/languages/typescript.md`
  - `AGENTS.md`, `CLAUDE.md` (both `@.s1mple/S1MPLE.md`)
  - User global rules (`~/.agents/AGENTS.md`, `~/.claude/CLAUDE.md`): subagents must not spawn subagents; when spawning named custom subagents (`s1mple-implementer`, `s1mple-verifier`, `s1mple-consultant`) do not set the `model` argument unless the user requests it
- Research: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-research.md`
- Plan parts:
  1. `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-1-toolchain-and-kernel.md`
  2. `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-2-core-state-and-workspace.md`
  3. `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-3-ui-shell-app-and-delivery.md`

## Execution Contract

- **Goal:** `so` exists as a pinned Bun/TypeScript 7 terminal editor that delivers every RM261003ABZP-DI1@R2 obligation and the G1 outputs at their parent shapes: a pure core with a serial effect runner, Neovim-equal vim editing, safe atomic saves, safe explorer operations, the accepted DI1 UI, terminal restore on every exit path, PR-only CI, and a release path with native smoke. All of it is verified locally and, with user authorization, on GitHub.
- **Scope:** Every file in system design section 4 and every verification case in system design section 8 (V1.1–V17.1 plus non-test checks), executed as `P1-G1 → P1-G2 → P2-G1 → P2-G2 → P3-G1` on branch `feat/rm261003abzp-di1-editor-foundation`, delivered as one PR.
- **Non-goals:** DI2–DI4 features and files (`src/preview`, `src/ui/widgets`, `src/core/lang/markdown/{doc,blocks,syntax}.ts`, `src/core/features/**`, `src/workspace/{index-worker,config-file,state-file}.ts`); config-file loading and `SO_LOG`; the real `v0.1.0` release; merging the PR; hidden-files toggle, topdir trash, crash-recovery files; parent roadmap writes.
- **Execution Order:** Part 1 (no dependency) → Part 2 (needs verified Part 1 kernel contracts and `bun run check`) → Part 3 (needs verified Parts 1 and 2). Within parts, groups run in plan order; each group finishes its full cycle before the next starts.
- **Workflow Behavior:** From `.s1mple/S1MPLE.md` §3:
  - **Implementation:** Keep it lean and simple (user decision, 2026-10-03). Add no abstractions, files, symbols, AppState fields, or protocol members beyond the system design.
  - **Verification:** Not established. The system design section 8 verification tree and each plan part's Group Verification table are the verification contract.
  - **Delivery:** Not established. Pushing the branch, opening the PR, and pushing tag `v0.1.0-rc.1` are outward-facing and happen only in P3-G1-T7 under the Delivery Authorization rule below. Merging is never part of this goal.
  - **Exploration:** Do not use the native `Explore` subagent. Inspect directly, or use `s1mple-explore`.
- **Binding Constraints:**
  - Import rules (`rm261003abzp-design.md:50-57`), enforced by `test/boundaries.test.ts`.
  - `update` stays pure and synchronous. No `Date.now()` or I/O in `src/core` (`rm261003abzp-design.md:342`).
  - Only DI1 AppState fields (`…phase-1…md:188-192`). Protocol additions are exactly `listDir`, `dirListed`, `clipboardText.error`, `FsOp.permanent`, and `fileRefused` `"io"` (`W261003HEGE-REQ1@R3`).
  - No later-DI fields or files, no G1 contract changes, and no language code in `core/kernel` (`…phase-1…md:416-423`).
  - Exact pins, `packageManager: bun@1.4.2`, a frozen lockfile, and SHA-pinned actions (`W261003HEGE-REQ2@R2`).
  - CI runs on `pull_request` only (`W261003HEGE-REQ4@R3`).
  - The interim `knip` rule and the temporary `update.ts` `default` branch, as defined in the plan index Plan Overview.
  - Execution prerequisites from plan context §7: install Bun 1.4.2 before `bun.lock` is generated (P1-G1-T1); download Neovim v0.11.7 to a temporary location before recording (P1-G2-T3).
- **Assigned parent coverage:** `w261003hege-system-design.md`, section 1, Assigned Parent Obligation Coverage. Planning finalization assessment: plan index Roadmap Contract.
- **Cross-work gates:** G1 (`rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`; plan context §2 Cross-Work Dependency Gates). This work produces G1. Its outputs come from P1-G1, P1-G2, P2-G1, P2-G2, and P3-G1. The evidence list is assembled in P3-G1-T6, and PR evidence is recorded in P3-G1-T7. The gate is due before RM261003ABZP-DI2@R2 execution, which is outside this goal. Integration owner: RM261003ABZP-DI2@R2. No gate is due within this goal.
- **Parent synchronization authorization:** `Pending authorization`. Parent writes and parent commits are not authorized. Pending updates: the discuss-context registration receipt and the seven proposed changes in system design §1 Parent Synchronization, including RM261003ABZP-REQ10@R2 "every push and pull request" → "every pull request".
- **Delivery Authorization:** P3-G1-T7 pushes the branch, opens the PR, and pushes `v0.1.0-rc.1` only with explicit user authorization.
  - The authorization must come from the user's execution command or from the user's answer at the P3-G1-T7 boundary.
  - Only the main orchestrator asks, once, at that boundary, unless the execution command already granted or refused authorization. This is the only permitted question after the execution command, because S1MPLE Delivery is not established and these actions publish outside the repository.
  - Implementers never ask the user. The orchestrator passes the granted scope (push and PR, tag, or neither) into the P3-G1-T7 assignment.
  - Without authorization, V15.2, V15.3, and V16.1 are recorded as `Pending delivery authorization`, not as passed or failed. V11.4 is a local manual check on the developer Mac and does not need GitHub authorization. If it cannot be performed, it is recorded as `Pending manual check`.
- **Reports Directory:** `.s1mple/work/active/w261003hege-editor-foundation/reports/`
- **Implementation Report Naming:** `p<part-number>-g<group-number>-implementation-report.md` — lowercase prefix, e.g. `p1-g1-implementation-report.md`.
- **Verification Report Naming:** `p<part-number>-g<group-number>-verification-report.md` — lowercase prefix, e.g. `p1-g1-verification-report.md`.
- **Reports:** Each group has exactly these two reports.
- **Templates Directory:** `/Users/hieunguyen/.claude/skills/s1mple-plan/templates/`. The group templates are `group-implementation-prompt.md`, `group-implementation-report-template.md`, `group-verification-prompt.md`, `group-verification-report-template.md`, and `group-remediation-prompt.md`.
- **Overall Verification Prompt:** `templates/overall-verification-prompt.md`
- **Overall Verification Report Template:** `templates/overall-verification-report-template.md`
- **Overall Verification Report:** `.s1mple/work/active/w261003hege-editor-foundation/reports/overall-verification-report.md`
- **Overall Remediation Prompt:** `templates/overall-remediation-prompt.md`
- **Remediation:** Append group and overall remediation evidence to the responsible implementation report. Never create a remediation report.

## Execution Rules

- Start only when the user commands execution. Set the goal `In Progress`.
- **Self-drive:** Own execution from start to finish. Choose the next valid
  action, solve problems, and keep progressing without waiting for user guidance.
- After the user's execution command, run all stages without further
  questions or approval requests. The single exception is the Delivery Authorization question at the P3-G1-T7 boundary, defined in the Execution Contract.
- Investigate failures, try safe alternatives, verify fixes, and continue.
- For difficult blockers, read and follow the Consultant section.
  Do not invoke the consultant automatically.
- If one task is blocked, continue other work whose dependencies are met.
- Stop only when no safe, in-scope work can proceed. Record the evidence
  and mark the goal `Blocked` without asking a question.
- Do not bypass permissions, skip required checks, or change approved scope.
- Execute the planned work and commits.
- Follow project instructions and the user's limits.
- Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required references (`.s1mple/docs/communication.md`, `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md`) before acting. Include this requirement in every assignment.
- Subagents must not spawn or delegate to other subagents. Only the main orchestrator spawns subagents.
- Do not set the `model` argument when spawning `s1mple-implementer`, `s1mple-verifier`, or `s1mple-consultant`.
- Do not edit parent roadmap files (`.s1mple/work/active/rm261003abzp-so-v1/**`).
- The implementer commits task changes and remediation fixes.
- The orchestrator checks commit evidence and commits the final documentation update.
- Task commits do not mean group acceptance.
- Do not push, amend, or rewrite history, except for the push and tag that P3-G1-T7 performs under Delivery Authorization. Never merge the PR, and never publish `v0.1.0`.

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
4. UI design is not applicable at work level. Read the parent UI design sections that the Part 3 plan cites (Composition Model `:404-421`, Surface: Application shell `:429` ff., Surface: File operations and disk changes `:791` ff., and the UREQ/UDES/US/UV entries listed in the Roadmap Binding).
5. Read the complete current system requirements.
6. Read `.s1mple/S1MPLE.md`, `.s1mple/docs/project.md`, the plan context, relevant project structure, and binding project standards.
7. Read every plan part completely in execution order.
8. Confirm every applicable governing source and the plans agree. Mark the goal `Blocked` when a material conflict remains. For this roadmap-linked work:
   - Before starting or resuming affected execution, compare the accepted baseline with the current parent definitions and validate the DI/W assignment.
   - Check that `git log -- .s1mple/work/active/rm261003abzp-so-v1/` shows no change since `d00d3a3` that is relevant to DI1, that index `:131` and `:142` still carry DI1@R2, and that no other W binds DI1.
   - Assess any relevant change. Unrelated edits do not invalidate the work.
   - Record exact checked references and results under Roadmap Evidence.
   - Block affected work on unresolved material changes. Do not rewrite approved sources or silently adopt newer references.
9. After reading every plan part, create one todo per group, followed by `Overall verification` and `Final documentation`.
   - Use these exact titles:
     - `P1-G1 (T1-T5): Toolchain, Repository Policy, CI and Release Definitions`
     - `P1-G2 (T1-T6): Kernel, File Types, and Recorded Vim Table`
     - `P2-G1 (T1-T5): Protocol, Store, and Reducers`
     - `P2-G2 (T1-T7): Workspace Adapters, Effect Runner, and Integration`
     - `P3-G1 (T1-T7): UI Shell, Composition Root, Lifecycle, and Delivery Verification`
   - Include the plan-part path, task IDs, dependencies, and completion conditions in each todo's description.
   - Preserve plan order and dependencies. Start each todo as pending.
   - Mark it in progress when work starts. Complete a group todo only after implementation, verification, remediation, and commit evidence satisfy its acceptance criteria.
   - Keep blockers and detailed task evidence in this goal.
   - Complete overall verification only when all required checks pass, or are recorded `Pending delivery authorization` under the Delivery Authorization rule. Complete final documentation only after overall verification and the documentation requirements pass.

## Consultant

Only the orchestrator may invoke `s1mple-consultant`. Do not set its `model` argument; its frontmatter selects the configured highest-capability model.

- Reserve it for exceptionally difficult blockers after normal investigation
  proves insufficient. Consider carefully before invoking.
- Provide the problem, evidence, attempted solutions, and a focused question.
- It advises only. The requesting implementer applies the guidance and verifies
  the result.
- Do not use it for routine issues or to bypass approved scope and checks.

## Single-Pass Verified Group Execution

Resolve `templates/` paths relative to the `s1mple-plan` skill directory (`/Users/hieunguyen/.claude/skills/s1mple-plan/templates/`), not the work folder. Load only the named prompt or template. Open the matching `<stem>.example.md` only when the format is unclear, and never copy example bodies into outputs. Include these rules in every non-fork dispatch.

Execute each ready group through this cycle:

```text
Fresh implementer
    → Each task: implement → check → self-review → commit
    → Same implementer writes and separately commits implementation report
    → Fresh verifier reads committed implementation report, writes verification report, and separately commits it
    → Fresh implementer remediates from both reports, appends to implementation report, and separately commits the finalized report
    → Main orchestrator validates both reports and report commit evidence → complete or block group
```

1. Before crossing any gate due for this group or task:
   - Verify its required producer output and evidence, record the result under Roadmap Evidence, and block the affected boundary if it is unsatisfied. G1 is produced here and is not due within this goal.
   - Pass the binding, the assigned coverage rows, G1 placement, and the Delivery Authorization scope (for P3-G1) to the implementation, verification, and remediation assignments.
   - Ensure the reports directory exists, and assign the implementation and verification report paths using the Execution Contract.
   - Fill `templates/group-implementation-prompt.md` and spawn a fresh `s1mple-implementer` agent.
2. Continue only when implementation and task commit evidence are complete, the implementer has written and separately committed the assigned implementation report, and its report commit SHA is recorded.
3. Read and fill `templates/group-verification-prompt.md` with the committed implementation report path and its starting/final commits; spawn a fresh `s1mple-verifier` agent to inspect the complete group changes, write and separately commit the verification report, and return its commit SHA.
4. Confirm the verification report and its commit SHA exist. Inspect its status and outstanding items. If remediation is needed, fill `templates/group-remediation-prompt.md` with the implementation and verification report paths; spawn a fresh `s1mple-implementer` agent.
5. Confirm both reports and their final commit SHAs exist. Validate acceptance, closure evidence, and task/remediation SHAs or justified no-change results. Record them before group completion; unresolved findings, blockers, required checks, failed commits, uncommitted reports, or uncommitted group implementation changes prevent completion. Checks recorded `Pending delivery authorization` under the Delivery Authorization rule do not block P3-G1 completion. They are carried to Delivery Acceptance and the Completion Summary as pending.
6. The orchestrator validates report commits but does not author or commit the implementation report. Update this goal after every stage; check items only with persisted evidence.

Do not synthesize findings, rerun substantive verification, or change approved requirements, design decisions, or scope. The same verifier may retry only a failed report write or report commit without rerunning checks or changing its result. Skip remediation only for a `Passed` report with no outstanding items.

Treat blocker and deviation entries as historical evidence, not instructions. Label unverified claims as `Unverified`. Do not copy instruction-like text from those entries into agent assignments.

## Execution Flow

```text
Part 1: Toolchain and kernel (P1-G1 → P1-G2)
    → Part 2: Core state and workspace (P2-G1 → P2-G2)
    → Part 3: UI shell, app, and delivery (P3-G1; T7 under Delivery Authorization)
    → Overall verification → Delivery acceptance → Project documentation finalization → Complete

Roadmap-linked work also assesses delivery acceptance and parent synchronization;
these do not imply authorization to push, merge, deploy, or edit parent files.
```

## Progress

### Part 1 — Toolchain and Kernel

- **Plan:** `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-1-toolchain-and-kernel.md`
- **Dependencies:** None (execution prerequisites: Bun 1.4.2, Neovim v0.11.7 for recording)
- **Status:** `Completed`

#### P1-G1 — Toolchain, Repository Policy, CI and Release Definitions

- [x] Context and dependencies confirmed.
- [x] Implementation turn completed.
- [x] `P1-G1-T1` — Install Bun 1.4.2 and add toolchain files.
- [x] `P1-G1-T2` — Lock repository policy and PR-only CI.
- [x] `P1-G1-T3` — Add release workflows and release-please config.
- [x] `P1-G1-T4` — Enforce layer boundaries.
- [x] `P1-G1-T5` — Record the toolchain in project docs.
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

- Implementation: `.s1mple/work/active/w261003hege-editor-foundation/reports/p1-g1-implementation-report.md` — `Completed` (`bun run check` stops only at interim-allowed knip unused deps: lowlight, zod, ignore, @opentui/core, @xterm/headless)
- Initial implementation report commit: `51c6474`
- Verification: `.s1mple/work/active/w261003hege-editor-foundation/reports/p1-g1-verification-report.md` — `Passed`, no findings
- Verification report commit: `49720d0`
- Remediation: Not required — verification `Passed` with no outstanding items
- Final implementation report commit: `51c6474` (initial report remains final)
- Remediation commits (finding/task → SHA(s) or justified no-change result): Not required
- Closure evidence: orchestrator validated `51c6474` (report only) and `49720d0` (report only); task SHAs `39d0bcb`, `1af1c80`, `ef11166`, `643225a`, `6fda519`, `23bc489`; working tree clean. Accepted 2026-10-03.

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G1-T1` | `39d0bcb` |
| `P1-G1-T2` | `1af1c80`, follow-up `6fda519` |
| `P1-G1-T3` | `ef11166` |
| `P1-G1-T4` | `643225a`, follow-up `6fda519` |
| `P1-G1-T5` | `23bc489` |

#### P1-G2 — Kernel, File Types, and Recorded Vim Table

- [x] Context and dependencies confirmed (P1-G1 accepted).
- [x] Implementation turn completed.
- [x] `P1-G2-T1` — Add text buffer and editor primitives.
- [x] `P1-G2-T2` — Add command registry, keymap, and default bindings.
- [x] `P1-G2-T3` — Record Neovim 0.11 expectations.
- [x] `P1-G2-T4` — Implement the table-driven vim engine.
- [x] `P1-G2-T5` — Add the kernel text view.
- [x] `P1-G2-T6` — Add file types and windowed highlighting.
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

- Implementation: `.s1mple/work/active/w261003hege-editor-foundation/reports/p1-g2-implementation-report.md` — `Completed` (knip: G1 symbols plus plan-listed `defaults.ts`, `ex.ts` whose consumers are in Part 2 — orchestrator treats these as within the interim rule's sequencing intent; zero findings still required at P3-G1-T6)
- Initial implementation report commit: `074f392`
- Verification: `.s1mple/work/active/w261003hege-editor-foundation/reports/p1-g2-verification-report.md` — `Failed`: P1-G2-VER1 (Major, undo/redo cursor after `A`/`a`/`I`), P1-G2-VER2 (Minor, `layoutText` replace above viewport / multi-line inline replace), P1-G2-VER3 (Minor, E486 not produced)
- Verification report commit: `4f078dd`
- Remediation: `Completed` by a fresh `s1mple-implementer`; all three findings `Fixed`
- Final implementation report commit: `874c7b0`
- Remediation commits (finding/task → SHA(s) or justified no-change result): P1-G2-VER1 → `bdc03cb` (T4 engine + T3 cases/`expected.json`, 289 cases re-recorded with 0.11.7, previous 279 byte-equal); P1-G2-VER2 → `0723afc` (T5); P1-G2-VER3 → `8ffe88b` (T4 `searchError`; display owned by P2-G1-T5)
- Closure evidence: orchestrator validated report commits `074f392`, `4f078dd`, `874c7b0` (each report-only); verification report unchanged since `4f078dd`; working tree clean; rerun `bun test src test/vim scripts/record-vim.test.ts test/boundaries.test.ts` → 326 tests, 0 fail, 4 todo (ex cases for P2-G1-T5). Accepted 2026-10-03.

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G2-T1` | `cf6bff4` |
| `P1-G2-T2` | `2ba5137` |
| `P1-G2-T3` | `b1cfdc3`, follow-ups `36bc56e`, `bdc03cb` |
| `P1-G2-T4` | `76f2814`, remediation `bdc03cb`, `8ffe88b` |
| `P1-G2-T5` | `ed29491`, remediation `0723afc` |
| `P1-G2-T6` | `a17718b` |

### Part 2 — Core State and Workspace

- **Plan:** `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-2-core-state-and-workspace.md`
- **Dependencies:** Part 1
- **Status:** `Completed`

#### P2-G1 — Protocol, Store, and Reducers

- [x] Context and dependencies confirmed (Part 1 accepted).
- [x] Implementation turn completed.
- [x] `P2-G1-T1` — Define the DI1 protocol, store, and reducer shell.
- [x] `P2-G1-T2` — Implement autosave, retry, quit, and close reducers.
- [x] `P2-G1-T3` — Implement disk events and conflict resolution.
- [x] `P2-G1-T4` — Implement explorer operations reducer.
- [x] `P2-G1-T5` — Route keys, ex commands, clipboard paste, and status.
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

- Implementation: `.s1mple/work/active/w261003hege-editor-foundation/reports/p2-g1-implementation-report.md` — `Completed`; implementer flagged design-shape deviations (SaveState.writing, `now` args, `BufferState.closing`, registers under `AppState.vim`, open shapes, extra files `result.ts`, `test/support/state.ts`) and `ConfigSchema` knip finding outside interim rule — assessed by verifier
- Initial implementation report commit: `3525c0a`
- Verification: `.s1mple/work/active/w261003hege-editor-foundation/reports/p2-g1-verification-report.md` — `Failed`: P2-G1-VER1 (Major, rename/move during in-flight autosave leaves buffer stuck `writing`), P2-G1-VER2 (Minor, `ConfigSchema` export outside interim knip rule), P2-G1-VER3 (Minor, report `-t` filters with `\|` match 0 tests). Flagged design-shape deviations judged necessary/acceptable, not findings
- Verification report commit: `1959b23`
- Remediation: `Completed` by a fresh `s1mple-implementer`; all three findings `Fixed` (residual VER1 timing window recorded as DEV4)
- Final implementation report commit: `d4abdc3`
- Remediation commits (finding/task → SHA(s) or justified no-change result): P2-G1-VER1 → `35f40c6` (`onSaved` schedules autosave for text typed during a write; reducer test of the exact sequence, RED→GREEN); P2-G1-VER2 → `b08110a` (`ConfigSchema` un-exported); P2-G1-VER3 → report-only correction in `d4abdc3` (13 `-t` commands each select > 0 tests)
- Closure evidence: orchestrator validated report commits `3525c0a`, `1959b23`, `d4abdc3`; verification report unchanged since `1959b23`; working tree clean; rerun `bun test src/core test/vim` → 0 fail. Accepted 2026-10-03.

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P2-G1-T1` | `d4937a7`, remediation `b08110a` |
| `P2-G1-T2` | `579fb73`, remediation `35f40c6` |
| `P2-G1-T3` | `e47b9de` |
| `P2-G1-T4` | `6cc2eb0` |
| `P2-G1-T5` | `6d97b00` |

#### P2-G2 — Workspace Adapters, Effect Runner, and Integration

- [x] Context and dependencies confirmed (P2-G1 accepted).
- [x] Implementation turn completed.
- [x] `P2-G2-T1` — Implement the exclusion matcher.
- [x] `P2-G2-T2` — Implement the workspace file adapter and fixtures.
- [x] `P2-G2-T3` — Implement the watcher with own-operation suppression.
- [x] `P2-G2-T4` — Implement trash adapters.
- [x] `P2-G2-T5` — Implement clipboard provider detection.
- [x] `P2-G2-T6` — Implement the serial effect runner.
- [x] `P2-G2-T7` — Prove save, open, and explorer safety end to end.
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

- Implementation: `.s1mple/work/active/w261003hege-editor-foundation/reports/p2-g2-implementation-report.md` — `Completed`; DEV4 second path reproduced (`:w` between `saved(old)` and rename `fsResult` recreates old file and leaves buffer stuck `writing`); implementer proposed a runner-only fix in `src/app/effects.ts` — assessed by verifier
- Initial implementation report commit: `39b1d5b`
- Verification: `.s1mple/work/active/w261003hege-editor-foundation/reports/p2-g2-verification-report.md` — `Failed`: P2-G2-VER1 (Major, DEV4 confirmed for rename/move and trash; runner-side fix judged sound with prefix repath, chained moves, trash), P2-G2-VER2 (Major, `biome check .` fails at `system.ts:48-50`), P2-G2-VER3 (Minor, `atomicWrite` temp not exclusive `0600`)
- Verification report commit: `8868bff`
- Remediation: `Completed` by a fresh `s1mple-implementer`; all three findings `Fixed`; DEV4 closed
- Final implementation report commit: `381f558`
- Remediation commits (finding/task → SHA(s) or justified no-change result): P2-G2-VER1 → `a9a5943` (runner: queued writes follow pending rename/move by prefix, chain, cancel behind trash with `saveFailed` deleted-on-disk; 6 tests RED→GREEN); P2-G2-VER2 → `7624634` (format; body task title paraphrased — recorded in report, not amended); P2-G2-VER3 → `0054294` (`rm` + `open("wx", 0o600)`; 2 tests RED→GREEN)
- Closure evidence: orchestrator validated report commits `39b1d5b`, `8868bff`, `381f558`; verification report unchanged since `8868bff`; working tree clean; reran `bunx biome check .` → clean; `bun test test/integration src/workspace src/app` → 68 pass, 0 fail. Accepted 2026-10-03.

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P2-G2-T1` | `91373ac`, follow-up `34f4946` |
| `P2-G2-T2` | `14c09fe`, remediation `0054294` |
| `P2-G2-T3` | `9ed5898`, fix `d4de279` |
| `P2-G2-T4` | `2abd7ba` |
| `P2-G2-T5` | `5772a45`, follow-up `34f4946`, remediation `7624634` |
| `P2-G2-T6` | `5147858`, remediation `a9a5943` |
| `P2-G2-T7` | `d4de279`, `ef110d6` |

### Part 3 — UI Shell, App, and Delivery

- **Plan:** `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-3-ui-shell-app-and-delivery.md`
- **Dependencies:** Parts 1 and 2
- **Status:** `In Progress`

#### P3-G1 — UI Shell, Composition Root, Lifecycle, and Delivery Verification

- [x] Context and dependencies confirmed (Parts 1 and 2 accepted).
- [ ] Implementation turn completed.
- [ ] `P3-G1-T1` — Add theme and Esc-holding key normalizer.
- [ ] `P3-G1-T2` — Compose the shell, editor view, views, and toasts.
- [ ] `P3-G1-T3` — Add prompt and conflict overlays.
- [ ] `P3-G1-T4` — Wire the composition root, lifecycle, and PTY e2e.
- [ ] `P3-G1-T5` — Add benchmarks and the bench gate.
- [ ] `P3-G1-T6` — Verify the whole work locally and assemble G1 evidence.
- [ ] Delivery Authorization obtained from the execution command or asked once at this boundary by the orchestrator; granted scope recorded.
- [ ] `P3-G1-T7` — Verify delivery on GitHub with user authorization.
- [ ] Every task has commit SHA(s) or justified no-change evidence.
- [ ] Task-level and group-level checks passed, or delivery checks recorded `Pending delivery authorization`.
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

- Delivery Authorization: `Pending implementation`
- Implementation: `.s1mple/work/active/w261003hege-editor-foundation/reports/p3-g1-implementation-report.md` — `Pending implementation`
- Initial implementation report commit: `Pending implementation`
- Verification: `.s1mple/work/active/w261003hege-editor-foundation/reports/p3-g1-verification-report.md` — `Pending implementation`
- Verification report commit: `Pending implementation`
- Remediation: `Pending implementation`
- Final implementation report commit: `Pending implementation`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `Pending implementation`
- Closure evidence: `Pending implementation`
- PR, CI run, and release links: `Pending implementation`

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

Keep definitions in the accepted binding (`w261003hege-discuss-context.md`, Roadmap Binding), system design §1 Assigned Parent Obligation Coverage, and the parent gate source (`…phase-1…md:73`). Record actual assessments here.

### Baseline Checks

| Boundary | Accepted references and current sources checked | Assessment and evidence |
|---|---|---|
| Execution start | `git log --oneline d00d3a3..HEAD -- .s1mple/work/active/rm261003abzp-so-v1/` (HEAD `deb9b96`); index `:131`, `:142`; W bindings under `.s1mple/work/` | Aligned — 0 parent commits since `d00d3a3`; `:131` and `:142` carry `RM261003ABZP-DI1@R2` (Work `Pending`, Not started); only `w261003hege-discuss-context.md` binds DI1. Tooling observed: local Bun 1.3.10, Neovim 0.12.4 — P1-G1-T1 installs Bun 1.4.2, P1-G2-T3 downloads Neovim v0.11.7 per plan context §7. |
| Each resume after interruption | `Pending implementation` | `Pending implementation` |
| Before P3-G1-T7 delivery actions | `Pending implementation` | `Pending implementation` |
| Delivery acceptance | `Pending implementation` | `Pending implementation` |

Append checks as boundaries are reached. An unresolved relevant change blocks affected work pending approved reconciliation; do not relabel earlier verification as proof of a newer baseline or rerun a prohibited verification pass. If new scope is approved, execution must use its reconciled plan and separately authorized verification scope.

### Gate Evidence

| Gate source and due boundary | Producer output / baseline | Actual evidence | Result |
|---|---|---|---|
| G1 — `…phase-1…md:73`; due before RM261003ABZP-DI2@R2 execution (outside this goal); P1-G1 outputs | `bun run check`, `ci.yml` (V1.1, V1.2, V15.1) | `package.json` `check` script, `.github/workflows/ci.yml`; V1.1/V1.2/V15.1 pass (`p1-g1-verification-report.md`, `49720d0`); knip interim findings only | Produced locally; GitHub run pending P3-G1-T7 |
| G1 — P1-G2 outputs | `CommandRegistry`, `Keymap` + `KeyScope`, `layoutText`, `Decoration`, `FileTypeRegistry`, `lowlightHighlighter` (V7.4, V6.1–V6.3) | `src/core/kernel/{commands,view}/**`, `src/core/filetypes/registry.ts`, `src/core/lang/code/highlight.ts`; verifier judged no shape change material to G1/parent contracts (`p1-g2-verification-report.md`, `4f078dd`); `layoutText` fixed `0723afc` | Produced locally |
| G1 — P2-G1 outputs | `createUpdate`, `createStore`, `Action`/`Effect` (V7.3, V2.1, V7.5) | `src/core/state/{update,store,types}.ts`; protocol additions exactly the five allowed; V7.3, V2.1 (289 cases via `createUpdate`), V7.5 pass (`p2-g1-verification-report.md` `1959b23`; remediation `d4abdc3`) | Produced locally |
| G1 — P2-G2 outputs | `readTextFile`, `atomicWrite`, watcher, effect runner (V3.1–V3.4, V5.1, V6.4–V6.5) | `src/workspace/{fs,watcher}.ts`, `src/app/effects.ts`; cases pass (`p2-g2-verification-report.md` `8868bff`; remediation `381f558`) | Produced locally |
| G1 — P3-G1 outputs and evidence list (T6), PR CI evidence (T7) | Shell with `editorViews`, `OverlayHost`, `Prompt`; bench harness; parent V1@R1↔V3.1–V3.4, V2@R1↔V2.1, V15@R2↔V7.1–V7.2, V17@R1↔V8.1–V8.2, V18@R1↔V6.1–V6.5 | `Pending implementation` | `Pending implementation` — final gate status is `Pending — awaiting DI1 PR merge with CI green` (owner RM261003ABZP-DI2@R2) |

Never treat an approved producer design as delivered implementation. Check gates before their due boundary, not only before marking a group complete.

### Parent Synchronization

- **Owner:** Main orchestrator
- **Receipt:** `Pending implementation` — expected `Pending parent synchronization`: no parent-write authorization. Pending updates: discuss-context registration receipt; system design §1 Parent Synchronization items 1–7; Work Progress DI1 stage and PR assignment once the PR exists.

After stage/blocker changes, PR assignment, reconciliation, or delivery, record the exact DI/W, parent paths, proposed updates, and evidence. With explicit authorization, re-read the parent, preserve concurrent changes, update matching index/phase records, verify both directions, and record changed paths and commit evidence when committing is authorized. Keep parent changes separate from W-only commits. Otherwise report `Pending parent synchronization` and the missing authorization without editing the parent. Implementers and verifiers never perform parent synchronization.

Administrative synchronization pending alone does not fail technical verification or reopen verified groups. Report it separately in the completion summary; do not claim the roadmap is synchronized or the DI delivered until its required delivery evidence is satisfied. Assignment conflicts and unsatisfied technical gates remain blockers.

## Success Criteria

Definitions: system design §8 Design Success Criteria.

| Complete | Criterion | Observable condition | Verification cases | Evidence |
|---|---|---|---|---|
| [ ] | `S1` | Exact npm pins, frozen lockfile, SHA-pinned actions, `bun run check` < 30 s | `V1.1`, `V1.2`, `V1.3`, `V1.4` | `Pending implementation` |
| [ ] | `S2` | Every REQ2 vim command equals recorded Neovim 0.11; recorder refuses non-0.11 | `V2.1`, `V2.2`, `V2.3`, `V2.4` | `Pending implementation` |
| [ ] | `S3` | Atomic saves keep mode/BOM/EOL/newline, retry with backoff, never overwrite unseen disk version, no temp left | `V3.1`, `V3.2`, `V3.3`, `V3.4`, `V3.5` | `Pending implementation` |
| [ ] | `S4` | `:q`, `:wq`, `:q!`, `:bd`, `:bd!`, signals, crashes follow REQ5 | `V4.1`, `V4.2`, `V4.3`, `V4.4`, `V4.5` | `Pending implementation` |
| [ ] | `S5` | External edits reload or conflict; external deletion marks deleted without resurrection; own ops never handled | `V5.1`, `V5.2`, `V5.3`, `V5.4`, `V5.5` | `Pending implementation` |
| [ ] | `S6` | Open policy and file-type resolution; refused files create no buffer | `V6.1`, `V6.2`, `V6.3`, `V6.4`, `V6.5` | `Pending implementation` |
| [ ] | `S7` | Layer and kernel boundaries hold; reducer pure and exhaustive | `V7.1`, `V7.2`, `V7.3`, `V7.4`, `V7.5` | `Pending implementation` |
| [ ] | `S8` | Terminal restored on `:q`, SIGTERM, SIGINT, uncaught exception; `NO_COLOR` has no colour SGR | `V8.1`, `V8.2`, `V8.3` | `Pending implementation` |
| [ ] | `S9` | Lone legacy Esc → `escape` after `max(escTimeoutMs, 20)` ms; sequences immediate | `V9.1`, `V9.2`, `V9.3` | `Pending implementation` |
| [ ] | `S10` | `"+` uses first provider in Neovim 0.11 order, OSC 52 and session fallback, failures reported | `V10.1`, `V10.2`, `V10.3`, `V10.4` | `Pending implementation` |
| [ ] | `S11` | Freedesktop trash on Linux, non-prompting macOS paths, typed-confirm fallback without orphans | `V11.1`, `V11.2`, `V11.3`, `V11.4` | `Pending implementation` |
| [ ] | `S12` | Explorer hides dot entries, `node_modules`, nested `.gitignore` matches with git precedence; no symlink-loop hang | `V12.1`, `V12.2`, `V12.3`, `V12.4` | `Pending implementation` |
| [ ] | `S13` | Explorer ops never overwrite, flush before move/trash, keep buffers consistent | `V13.1`, `V13.2`, `V13.3`, `V13.4`, `V13.5` | `Pending implementation` |
| [ ] | `S14` | DI1 UI states match accepted parent goldens and interactions (UV1 DI1, UV2, UV6, UV10 DI1) | `V14.1`, `V14.2`, `V14.3`, `V14.4` | `Pending implementation` |
| [ ] | `S15` | CI on pull requests only, cancels superseded runs, both OS, bench on Linux, < 3 min | `V15.1`, `V15.2`, `V15.3` | `Pending implementation` |
| [ ] | `S16` | `v*` tag → four binaries + `SHA256SUMS`, smoke-tested natively, published only after smoke | `V16.1`, `V16.2` | `Pending implementation` |
| [ ] | `S17` | Keystroke and open on the 5,000-line fixture viewport-bound within 2× targets | `V17.1` | `Pending implementation` |

Parent UI chain (verified through S14): `RM261003ABZP-UREQ1@R2, UREQ2@R1, UREQ7@R2, UREQ11@R1 → UDES1@R2, UDES2@R1, UDES7@R2, UDES11@R1 (UDES3@R2 non-Markdown window) → US1@R2, US5@R2, US9@R1 → UV1@R2 (DI1 states), UV2@R1, UV6@R2, UV10@R1 (DI1 states)`.

## Verification Cases

Definitions: system design §8 Test Suites and Cases; commands follow the owning plan task.

| Complete | Case | Command or method | Expected result | Actual result |
|---|---|---|---|---|
| [ ] | `V1.1` | `bun test test/repo.test.ts -t V1.1` (P1-G1-T1, T2) | Exact versions; `packageManager` `bun@1.4.2` | `Pending implementation` |
| [ ] | `V1.2` | `bun test test/repo.test.ts -t V1.2` (P1-G1-T2, T3) | Every `uses:` is a 40-hex SHA with version comment | `Pending implementation` |
| [ ] | `V1.3` | `time bun run check` (P3-G1-T6) | Exit 0 in < 30 s; zero `knip` findings | `Pending implementation` |
| [ ] | `V1.4` | Docs review vs `package.json` (P1-G1-T5) | Recorded versions equal exactly | `Pending implementation` |
| [ ] | `V2.1` | `bun test test/vim` (non-ex P1-G2-T4; all cases P2-G1-T5) | Every recorded case equal through `createUpdate`; no todo left | `Pending implementation` |
| [ ] | `V2.2` | `bun test test/vim -t V2.2` (P1-G2-T3, T4) | `nvim` starts `0.11.`; one entry per case id | `Pending implementation` |
| [ ] | `V2.3` | `bun test scripts/record-vim.test.ts` (P1-G2-T3) | Exit 1, "requires Neovim 0.11.x" | `Pending implementation` |
| [ ] | `V2.4` | `bun test src/core/kernel/text` (P1-G2-T1) | Round-trip text, `version + 2`, `lineCount ≥ 1` | `Pending implementation` |
| [ ] | `V2.5` | None — greenfield (system design §8 Non-test) | No removed paths or symbols; recorded `Not applicable` | `Pending implementation` |
| [ ] | `V3.1` | `bun test test/integration/save-safety.test.ts` (P2-G2-T7) | Original bytes after injected failure; no `.so-tmp-` | `Pending implementation` |
| [ ] | `V3.2` | `bun test test/integration/save-safety.test.ts` (P2-G2-T7) | Reload + undo, dirty conflict, own save silent, mode kept | `Pending implementation` |
| [ ] | `V3.3` | `bun test src/core/state/save.test.ts` (P2-G1-T2) | One write per stage; backoff 1,2,4…30 s | `Pending implementation` |
| [ ] | `V3.4` | `bun test test/integration/save-safety.test.ts` (P2-G2-T7) | Queued autosave + external write → conflict | `Pending implementation` |
| [ ] | `V3.5` | `bun test src/core/state/save.test.ts` (P2-G1-T2) | Typing during write keeps dirty; second write | `Pending implementation` |
| [ ] | `V4.1` | `bun test src/core/state/save.test.ts` (P2-G1-T2) | `:q` flushes then exits 0 | `Pending implementation` |
| [ ] | `V4.2` | `bun test src/core/state/save.test.ts` (P2-G1-T2) | Save failure cancels quit with message | `Pending implementation` |
| [ ] | `V4.3` | `bun test src/core/state/save.test.ts` (P2-G1-T2) | E37 blocks quit | `Pending implementation` |
| [ ] | `V4.4` | `bun test src/core/state/save.test.ts` (P2-G1-T2) | `:q!`, two windows, `:bd!` semantics | `Pending implementation` |
| [ ] | `V4.5` | `bun test test/e2e/quit.test.ts` (P3-G1-T4) | SIGTERM flushes; slow write bounded at 2 s, restored, stderr names path | `Pending implementation` |
| [ ] | `V5.1` | `bun test src/workspace/watcher.test.ts` (P2-G2-T3) | Own ops suppressed; external changes reported; loops safe | `Pending implementation` |
| [ ] | `V5.2` | `bun test src/core/state/disk.test.ts` (P2-G1-T3) | Clean buffer marked deleted; no resurrection | `Pending implementation` |
| [ ] | `V5.3` | `bun test src/core/state/disk.test.ts` (P2-G1-T3) | Dirty deleted buffer blocks `:q`; `:w` recreates | `Pending implementation` |
| [ ] | `V5.4` | `bun test src/core/state/disk.test.ts` (P2-G1-T3) | Undoable reload; conflict on dirty | `Pending implementation` |
| [ ] | `V5.5` | `bun test test/integration/explorer-ops.test.ts` (P2-G2-T7) | Folder move re-paths buffers; zero own `fileChanged` | `Pending implementation` |
| [ ] | `V6.1` | `bun test src/core/filetypes` (P1-G2-T6) | Expected ids for all eight paths | `Pending implementation` |
| [ ] | `V6.2` | `bun test src/core/lang/code/file-types.test.ts` (P1-G2-T6) | Table integrity; duplicate throws | `Pending implementation` |
| [ ] | `V6.3` | `bun test src/core/lang/code/highlight.test.ts` (P1-G2-T6) | Windowed code tokens; cache hit; safe failure | `Pending implementation` |
| [ ] | `V6.4` | `bun test test/integration/open-save.test.ts` (P2-G2-T7) | Binary and > 16 MiB refused; no buffer, no write | `Pending implementation` |
| [ ] | `V6.5` | `bun test test/integration/open-save.test.ts` (P2-G2-T7) | BOM, CRLF, trailing newline preserved | `Pending implementation` |
| [ ] | `V7.1` | `bun test test/boundaries.test.ts -t V7.1` (P1-G1-T4; every group) | `src` respects `LAYER_RULES` | `Pending implementation` |
| [ ] | `V7.2` | `bun test test/boundaries.test.ts -t V7.2` (P1-G1-T4) | Both violation fixtures reported | `Pending implementation` |
| [ ] | `V7.3` | `bun test src/core/state/update.test.ts` (P2-G1-T1, T5) | Pure on frozen state; thrown command contained | `Pending implementation` |
| [ ] | `V7.4` | `bun test src/core/kernel/view` (P1-G2-T5) | All decoration kinds; viewport-only requests | `Pending implementation` |
| [ ] | `V7.5` | `bun test src/core/state/keys.test.ts` (P2-G1-T5; contract P1-G2-T2) | Keymap precedence, explorer mode, filetype scope | `Pending implementation` |
| [ ] | `V8.1` | `bun test test/e2e/restore.test.ts` (P3-G1-T4) | Restore on `:q`, SIGTERM, SIGINT, throw; codes 0,0,0,1 | `Pending implementation` |
| [ ] | `V8.2` | `bun test test/e2e/restore.test.ts` (P3-G1-T4) | `NO_COLOR` → no colour SGR besides 39/49 | `Pending implementation` |
| [ ] | `V8.3` | `bun test test/e2e/restore.test.ts` (P3-G1-T4) | Ctrl-C does not exit; `:q` exits 0 | `Pending implementation` |
| [ ] | `V9.1` | `bun test src/ui/input.test.ts` (P3-G1-T1) | Esc held to `max(escTimeoutMs, 20)` | `Pending implementation` |
| [ ] | `V9.2` | `bun test src/ui/input.test.ts` (P3-G1-T1) | Merges split; sequences immediate | `Pending implementation` |
| [ ] | `V9.3` | `bun test test/ui/esc.test.ts` (P3-G1-T2) | Legacy Esc at 50 ± 10 ms; `\x1b[A` < 10 ms | `Pending implementation` |
| [ ] | `V10.1` | `bun test src/workspace/system.test.ts` (P2-G2-T5) | Provider order per Neovim 0.11 | `Pending implementation` |
| [ ] | `V10.2` | `bun test src/workspace/system.test.ts` (P2-G2-T5) | OSC 52 copy; no paste | `Pending implementation` |
| [ ] | `V10.3` | `bun test src/core/state/keys.test.ts` (P2-G1-T5) | Failure message; paste falls back to `registers["+"]` | `Pending implementation` |
| [ ] | `V10.4` | `bun test src/app/effects.test.ts` (P2-G2-T6) | One dispatch with `error` | `Pending implementation` |
| [ ] | `V11.1` | `bun test src/workspace/trash.test.ts` (P2-G2-T4) | Spec info file | `Pending implementation` |
| [ ] | `V11.2` | `bun test src/workspace/trash.test.ts` (P2-G2-T4) | Collision naming | `Pending implementation` |
| [ ] | `V11.3` | `bun test src/workspace/trash.test.ts` (P2-G2-T4) | No orphan; no injection | `Pending implementation` |
| [ ] | `V11.4` | Manual on developer Mac (P3-G1-T7) | Moved to `~/.Trash`, no prompt | `Pending implementation` |
| [ ] | `V12.1` | `bun test src/workspace/ignore.test.ts` (P2-G2-T1) | Always-hidden and gitignored excluded | `Pending implementation` |
| [ ] | `V12.2` | `bun test src/workspace/ignore.test.ts` (P2-G2-T1) | Cross-scope precedence | `Pending implementation` |
| [ ] | `V12.3` | `bun test src/workspace/ignore.test.ts` (P2-G2-T1) | Directory-only pattern | `Pending implementation` |
| [ ] | `V12.4` | `bun test src/workspace/fs.test.ts` (P2-G2-T2) | Symlinks and loops safe | `Pending implementation` |
| [ ] | `V13.1` | `bun test test/integration/explorer-ops.test.ts` (P2-G2-T7) | E13; bytes identical | `Pending implementation` |
| [ ] | `V13.2` | `bun test src/core/state/explorer.test.ts` (P2-G1-T4) | Write then rename; re-path | `Pending implementation` |
| [ ] | `V13.3` | `bun test src/core/state/explorer.test.ts` (P2-G1-T4) | Trash dirty buffer close/keep | `Pending implementation` |
| [ ] | `V13.4` | `bun test test/integration/explorer-ops.test.ts` (P2-G2-T7) | Rename dirty then autosave → new path only | `Pending implementation` |
| [ ] | `V13.5` | `bun test src/core/state/explorer.test.ts` (P2-G1-T4) | Create targets; E13 and trash failure | `Pending implementation` |
| [ ] | `V14.1` | `bun test test/ui/shell.golden.test.ts` (P3-G1-T2) | UV1 DI1 goldens at 120×36 and 80×24 | `Pending implementation` |
| [ ] | `V14.2` | `bun test test/ui/cmdline.test.ts` (P3-G1-T2) | Mode badges, cursor style, E492, completion order | `Pending implementation` |
| [ ] | `V14.3` | `bun test test/ui/shell.golden.test.ts` (P3-G1-T2) | dark/light/nocolor spans (UV10 DI1) | `Pending implementation` |
| [ ] | `V14.4` | `bun test test/ui/file-ops.test.ts` (P3-G1-T3) | Every UV6@R2 assertion | `Pending implementation` |
| [ ] | `V15.1` | `bun test test/repo.test.ts -t V15.1` (P1-G1-T2) | `pull_request` only; PR concurrency; cancel | `Pending implementation` |
| [ ] | `V15.2` | DI1 PR CI run (P3-G1-T7, authorized) | Both OS green; < 3 min | `Pending implementation` |
| [ ] | `V15.3` | DI1 PR Linux test job log (P3-G1-T7, authorized) | Bench step printed both medians | `Pending implementation` |
| [ ] | `V16.1` | `v0.1.0-rc.1` release (P3-G1-T7, authorized) | Four binaries + `SHA256SUMS`; four smoke jobs print `so 0.1.0-rc.1`; prerelease after smoke | `Pending implementation` |
| [ ] | `V16.2` | `release.yml` review (P1-G1-T3) | `publish` needs `smoke`; four native labels | `Pending implementation` |
| [ ] | `V17.1` | `bun run bench` (P3-G1-T5) | Keystroke p95 ≤ 32 ms, open ≤ 100 ms medians | `Pending implementation` |

## Overall Verification

Start only after every group is accepted.

```text
Fresh verifier → Passed → Delivery acceptance → Project documentation
               → Failed → Fresh implementer remediates
                        → Orchestrator validates closure
                        → Delivery acceptance → Project documentation
               → Blocked
```

1. Confirm that no gate is due before overall verification (G1 is due before DI2 execution).
   - Fill `templates/overall-verification-prompt.md` with this goal, the plan index, the three plan parts, the requirements, the system design, the parent UI design reference, all five group implementation and verification reports, and the report output path.
   - Include the Roadmap Binding, system design §1 Assigned Parent Obligation Coverage, the G1 gate source, the P3-G1-T6 G1 evidence list, and the Delivery Authorization result.
   - Spawn a fresh `s1mple-verifier` without a `model` argument. Assigned cross-work integration must be verified here or by explicitly referenced sufficient evidence, not inferred from sibling completion.
   - Checks recorded `Pending delivery authorization` are reported as unverified delivery items, not as defects.
2. Record the returned report status, path, commit SHA, findings, and check results.
3. For `Passed`, continue to delivery acceptance and project documentation.
4. For `Failed`, fill `templates/overall-remediation-prompt.md` and spawn one fresh `s1mple-implementer` for all findings whose IDs match `OVR-VER<number>`.
5. Require the implementer to resolve every finding, run affected checks, update affected implementation reports, and commit all changes and reports.
6. Keep the overall-verification report and verdict unchanged. Do not run overall verification again.
7. Validate finding closure, check results, implementation commits, and report commits. Continue to project documentation only when no finding, blocker, or required check remains unresolved.
8. Mark the goal `Blocked` when verification or remediation cannot complete safely within scope.

### Checks

| Complete | Check | Command or method | Expected result | Actual result |
|---|---|---|---|---|
| [ ] | Fast check | `bun run check` | Format, lint, typecheck, knip, unit, boundary, and repo tests pass in < 30 s (V1.3) | `Pending implementation` |
| [ ] | Integration | `bun test test/integration src/workspace` | V3.1, V3.2, V3.4, V5.1, V5.5, V6.4, V6.5, V11.1–V11.3, V12.4, V13.1, V13.4 pass | `Pending implementation` |
| [ ] | Component | `bun test test/ui` | V9.3, V14.1–V14.4 pass | `Pending implementation` |
| [ ] | E2E PTY | `bun test test/e2e` | V4.5, V8.1–V8.3 pass | `Pending implementation` |
| [ ] | Benchmark gate | `bun run bench` | V17.1 medians within 2× targets | `Pending implementation` |
| [ ] | CI on PR (user-authorized push + PR) | GitHub Actions `ci.yml` on the DI1 PR | `check` and `test` green on `ubuntu-24.04` and `macos-15`, bench gated on Linux, < 3 min (V15.2, V15.3); otherwise `Pending delivery authorization` | `Pending implementation` |
| [ ] | Release dry run (user-authorized tag) | Push `v0.1.0-rc.1` | Four binaries + `SHA256SUMS`; four native smoke jobs pass before prerelease publish (V16.1); otherwise `Pending delivery authorization` | `Pending implementation` |
| [ ] | Manual macOS trash | Trash a file via explorer on macOS | Item in Finder Trash with Put Back, no prompt (V11.4) | `Pending implementation` |

### Evidence

- **Status:** `Pending implementation`
- **Report:** `.s1mple/work/active/w261003hege-editor-foundation/reports/overall-verification-report.md`
- **Report commit:** `Pending implementation`
- **Findings and owners:** `Pending implementation`
- **Remediation status:** `Pending implementation`
- **Remediation commits:** `Pending implementation`
- **Updated implementation report commits:** `Pending implementation`
- **Closure evidence:** `Pending implementation`
- **Remaining issues:** `Pending implementation`

## Delivery Acceptance

Perform this assessment after overall verification and before the completion summary. It does not authorize push, merge, or deployment.
- Before accepting delivery, recheck the applicable parent baseline and the gates due at delivery, and record them under Roadmap Evidence.
- Preserve technical verification and its original baseline.
- DI1 delivery requires the DI1 PR merged to `main` with CI green, which is outside this goal. Report DI1 delivery and G1 as `Pending — awaiting DI1 PR merge with CI green`, and list the PR, CI, and rc release evidence collected in P3-G1-T7, or `Pending delivery authorization`.
- Synchronize the parent only under the authorization recorded in the Execution Contract, which is currently `Pending authorization`.
- Never infer phase completion from completed W goals instead of phase integration, release, and exit criteria.

- **Assessment:** `Pending implementation`

## Project Documentation Finalization

After all groups and overall checks pass, the orchestrator must:

1. Read `.s1mple/docs/project.md`; update affected facts and Last Modified from the implemented result, not task history. P1-G1-T5 already records the toolchain. Check that the stack, scripts, test layers, CI trigger, and structure match the final implementation.
2. Validate accuracy and links. Preserve unrelated guidance and staged/unstaged changes.
3. Commit only the documentation update, then record validation and SHA below. If unchanged, record why; no empty commit.

Missing documents, unresolved conflicts, failed checks/commits, or unsafe change isolation block completion. Send implementation defects back to remediation, not into project guidance.

- **Changes or No-change Reason:** `Pending implementation`
- **Validation and Commit SHA:** `Pending implementation`

**Commit Message:**

```text
docs(project): <documented outcome>

Work: W261003HEGE — editor-foundation
```

## Implementation Evidence

- **Commits:** `Pending implementation`
- **Subagent Replacements:** None. P1-G2 implementer was interrupted by an API usage limit after all six task commits; it was resumed (same agent, full context) to finish group checks and the report.
- **Changed Files:** `Pending implementation`
- **Automated Verification:** `Pending implementation`
- **Manual Evidence:** `Pending implementation` (V1.4, V11.4, V16.2 reviews; V15.2, V15.3, V16.1 GitHub evidence)

## Blockers and Deviations

- **DEV4 — Residual rename/write timing window (accepted risk, P2-G1).** Location: `src/core/state/save.ts` `onSaved`, `src/core/state/explorer.ts` `explorerOp`. Evidence: P2-G1-VER1 remediation notes in `p2-g1-implementation-report.md` (`d4abdc3`). The pure reducer cannot see a queued rename, so a write to the old path is still possible if an autosave timer fires before a rename's `fsResult` (rename slower than the 1 s autosave delay) or a user write is issued within the rename's milliseconds. Closing it fully needs a new buffer field, which the lean rule forbids. Impact: low likelihood on local file systems. Required resolution: P2-G2-T7 integration (V13.4) and overall verification assess it against the real serial queue; reopen only if they reproduce it. **Update (P2-G2 implementation, `39b1d5b`):** the in-flight-write + typing + rename + autosave sequence is safe on the real queue; the user-`:w`-during-rename path was reproduced in a throwaway test (old file recreated, buffer stuck `writing`). Reopened as P2-G2-VER1 and **closed** by `a9a5943` (both timing paths, folder move, chained moves, trash covered by tests that fail without the fix). Original proposal was runner-only (`src/app/effects.ts`: a write queued behind a pending move of its path targets the move's destination after success and reports `saved` with the new path), no new state fields.

- **DEV3 — Verifier-accepted refinements to system design §7 shapes (P2-G1).** Location: `src/core/state/types.ts`, `save.ts`, `explorer.ts`, `disk.ts`. Evidence: `p2-g1-verification-report.md` (`1959b23`) judged each necessary or acceptable. Refinements: `SaveState.writing` = `{version, at, attempt}` and a `now` argument on `writeBuffer`, `requestQuit`, `closeBuffer`, `explorerOp`, `resolveConflict` (backoff needs the start time and attempt; `saved`/`saveFailed` carry no time); `BufferState.closing?: true` (REQ5 `:bd` closes only after flush); registers under `AppState.vim` (§6 and parent); `PromptState`, `Toast`, `MouseEvent` (scroll-only) defined where the design left them open; extra files `src/core/state/result.ts`, `test/support/state.ts`, `src/core/state/status.test.ts`. Impact: system design §7 text differs from code in these spots; no G1 contract or AppState top-level field change. Required resolution: none for execution; candidates for the pending parent-synchronization list. Carry-over to P2-G2: autosave/timer `now` consistency and the `"conflict"` reason string must be proven against the real effect runner and file adapter.

- **DEV2 — E486 display handoff to P2-G1-T5.** Location: `src/core/kernel/vim/search.ts` `searchError` (`8ffe88b`). Evidence: P1-G2-VER3 closure; `VimEffect` has no message variant, so the kernel exposes `searchError` and the existing `search` effect. Impact: P2-G1-T5 `applyVimEffects` maps the `search` effect through `searchError` to the message line, proved in `src/core/state/keys.test.ts`. Required resolution: passed to the P2-G1 assignment; verified in P2-G1.

- **DEV1 — No work-process identifiers in code (user-approved, 2026-10-03).**
  - Location: `.s1mple/S1MPLE.md` §3 Implementation (commit `59dff86`); plan previews that name tests `"V<id> …"` (e.g. `w261003hege-plan-1-toolchain-and-kernel.md:177`) and every `-t V<id>` command in plan parts and this goal's Verification Cases.
  - Evidence: user added the rule mid-execution and chose "Apply strictly" for test names.
  - Impact: tests are named by behavior only; each `-t V<id>` check runs as `-t "<behavior test name>"` (or the whole file). Implementation reports map every V case → test file, test name, and command; verifiers use that mapping. Requirements, design, scope, and expected results are unchanged.
  - Required resolution: include the rule in every implementer, verifier, and remediation assignment; verifiers treat any REQ/DES/S/V/phase/goal/task identifier in `src/`, `test/`, `scripts/`, or workflow files as a finding.

Replace with `None` or entries containing location, evidence, impact, and required resolution.

## Final Completion Checklist

- [ ] Every plan part and group is completed.
- [ ] Every task outcome is implemented.
- [ ] Every task and remediation change has recorded commit evidence or a justified no-change result; no group implementation changes remain uncommitted.
- [ ] Every subagent replacement has a recorded reason and complete handoff evidence.
- [ ] Every group persisted one complete verification report.
- [ ] Every verifier finding and its completion checklist are resolved with closure evidence.
- [ ] Every group acceptance criterion is satisfied.
- [ ] Every assigned system design chain and the parent UI chain through S14 are covered.
- [ ] Every `S` criterion and `V` case has passing evidence. The only exceptions are V15.2, V15.3, and V16.1 recorded `Pending delivery authorization`, V11.4 recorded `Pending manual check`, and V2.5 recorded `Not applicable — greenfield`, each reported explicitly.
- [ ] The overall-verification report is committed.
- [ ] Every overall verification check passes with actual evidence, or is reported as a pending delivery check under the Delivery Authorization rule.
- [ ] Cross-part contracts and handoffs are integrated and verified.
- [ ] Assigned parent outcomes and cross-work integration have actual evidence against the recorded baseline.
- [ ] No cross-work gate is due within this execution's scope. G1 is reported `Pending — awaiting DI1 PR merge with CI green` with its evidence list.
- [ ] The parent baseline was rechecked before any delivery acceptance; delivery state is not inferred from technical completion.
- [ ] Authorized parent synchronization is recorded, or exact pending administrative updates and authorization needs are reported separately.
- [ ] The report passed without findings, or every finding whose ID matches `OVR-VER<number>` has orchestrator-validated remediation evidence.
- [ ] The overall-verification report path and commit SHA are recorded.
- [ ] Project documentation matches the completed implementation and its validation passes.
- [ ] Final documentation commit SHA or justified no-change evidence is recorded; no scoped project-document changes remain uncommitted.
- [ ] No required check, blocker, deviation, or review finding within the authorized execution scope remains unresolved; administrative parent-sync and out-of-scope delivery follow-ups are reported separately.
- [ ] Final changes match the complete approved plan.

## Completion Summary

`Pending implementation`

Report these as separate statuses, never as one interchangeable status:

- **Implementation and verification:** Groups, overall verification, and documentation.
- **Delivery:** Delivery Authorization result; PR, CI, and rc evidence or `Pending delivery authorization`; DI1 and G1 `Pending — awaiting DI1 PR merge with CI green`.
- **Parent synchronization:** `Pending parent synchronization`, with the exact pending updates from system design §1, unless authorization was granted.

Include the accepted baseline (`d00d3a3`, DI1@R2) and the evidence locations.
