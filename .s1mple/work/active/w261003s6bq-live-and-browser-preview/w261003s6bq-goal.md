# W261003S6BQ Live and Browser Preview Execution Goal

## Status

- **State:** `Ready`
- **Current Position:** `Not started`
- **Last Updated:** `Not started`

## Sources

- s1mple instructions: `.s1mple/S1MPLE.md`
- Project document: `.s1mple/docs/project.md`
- Plan index: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-index.md`
- System design: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md`
- UI design: Not applicable — this W has no UI design; parent UI obligations (RM261003ABZP-UDES10@R2, RM261003ABZP-UV9@R2, RM261003ABZP-UV10@R1, and the other assigned UREQ/UDES/US/UV) are carried by the system design's §1 Assigned Parent Obligation Coverage, "UI obligations" row
- System requirements: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-requirements.md`
- UI requirements: Not applicable — no W UI requirements artifact; parent UREQs are bound through the discussion context
- Plan context: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-context.md`
- Roadmap binding: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3)
- Current parent sources:
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md` (Delivery Items `:133`, Work Progress `:144`)
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-2-obsidian-experience.md` (header `:3`, gates G2 `:69` and G4 `:71`, phase design contracts `:205-230`, DI3@R3 `:322-403`, Progress `:579-588`, Approval `:593-609`)
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-design.md` (RM261003ABZP-DES13@R3)
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-design.md` (RM261003ABZP-UDES10@R2, RM261003ABZP-UV9@R2, RM261003ABZP-UV10@R1 `:2252-2262`)
- Project standards:
  - `.s1mple/docs/communication.md`
  - `.s1mple/docs/project.md`
  - `.s1mple/docs/languages/typescript.md`
- Plan parts:
  1. `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-1-terminal-live-preview.md`
  2. `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-2-browser-preview.md`
  3. `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-3-extension-performance-delivery.md`

## Execution Contract

- **Goal:** Markdown notes render in `live` (default), `source`, and `reading` views through one pure `livePreview` provider with reveal, rich blocks, folds, embeds, terminal images, math, and Mermaid; `:Preview` serves a read-only, loopback-only browser mirror with the page, KaTeX, and Mermaid embedded in the binary; the G4 extension points, bench targets, and registration-only proof ship in the DI3 PR with CI green.
- **Scope:** Everything in RM261003ABZP-DI3@R3 through W261003S6BQ-REQ1@R1, REQ2@R2, REQ3@R1, REQ4@R1, REQ5@R1, REQ6@R1, REQ7@R3, REQ8@R1, as planned in Parts 1–3 (plan index Plan Parts and Coverage); the parent UV10@R1 DI3 states (P1-G2-T5); Delivery per `.s1mple/S1MPLE.md`.
- **Non-goals:** DI4's `base` block renderer and painter; persisted fold state; any mutating preview route; live views, folding, or outline for code files; changes to `paintPreview` (picker preview stays `source`); daily notes, templates, Bases; tagging, publishing, or any release; parent roadmap edits without explicit user authorization; merging the PR.
- **Execution Order:** Part 1 (P1-G1 → P1-G2 → P1-G3) → Part 2 (P2-G1; depends on Part 1) → Part 3 (P3-G1; depends on Parts 1 and 2) → Overall verification → Project documentation finalization → Delivery completion (P3-G1-T4 steps 2–4, see Delivery sequencing).
- **Workflow Behavior:**
  - **Implementation** (`.s1mple/S1MPLE.md` §3): keep it lean and simple; no work-process identifiers (W, REQ, DES, S, V, UV, phase, goal, or task IDs) in code comments, doc comments, identifiers, test names, SQL comments, or log messages. Tests are named by behavior. Traceability lives only in `.s1mple/` documents and commit message bodies.
  - **Verification** (`.s1mple/S1MPLE.md` §3): not established; the evidence set is the system design's V cases (§8) with `bun run check`, `bun run test:ci`, `bun run bench`, and `bun run build` as the plan parts assign them.
  - **Delivery** (`.s1mple/S1MPLE.md` §3): (1) open a PR; make CI pass and resolve conflicts with `main`; (2) move the work folder from `work/active/` to `work/done/` and update `.s1mple/` references to it; (3) push again; CI must pass on the new head. Never force-push or merge without the user's approval.
  - **Exploration:** delegated agents do not use the native `Explore` subagent; they inspect directly (or the orchestrator uses `s1mple-explore` when delegated exploration is genuinely necessary).
  - Every delegated agent (implementer, verifier, remediator, consultant) reads and follows `.s1mple/S1MPLE.md` and its required context (`docs/communication.md`, `docs/project.md`, `docs/languages/typescript.md`). Include this in every assignment.
- **Delivery sequencing:** The plan places Delivery in P3-G1-T4. Execute it in two stages so that overall verification and project documentation precede the folder move:
  - Within the P3-G1 group cycle, P3-G1-T4 performs step 1 only (push the branch, open the PR, resolve conflicts with `main` without force-pushing, CI green; capture V44 CI medians and V46 timings).
  - After Project Documentation Finalization, the orchestrator performs P3-G1-T4 steps 2–4 (move the folder, update `.s1mple/` references, commit, push, CI green on the new head) as the Delivery Completion stage, and records the evidence there. Paths in this goal then resolve under `.s1mple/work/done/w261003s6bq-live-and-browser-preview/`.
- **Binding Constraints:**
  - Layer rules (`.s1mple/docs/project.md` Boundaries; `test/boundaries.test.ts:16-41`): `core` has no I/O or `@opentui`; `core/lang` may not import `core/state`; only `src/ui` imports `@opentui/*`; `src/preview` imports only `src/preview` and `src/core`.
  - Package homes by package name (`test/boundaries.test.ts:45-53,90`): `beautiful-mermaid` → `src/core/lang/markdown/`; `katex`, `mermaid` → `src/preview/`.
  - Exact npm pins with `bun.lock` committed and `--frozen-lockfile`; `katex@0.16.47`, `beautiful-mermaid@1.1.3`, `mermaid` exact version confirmed at install (npm current `12.1.0` on 2026-10-02) and recorded in the PR.
  - Kernel files, `RenderLine`, `layoutText`, and the G4 signatures (phase file `:205-230`) unchanged, except the additive `PreviewCtx` members recorded in the system design; no Markdown in `src/ui/editors` or `src/core/kernel`; viewport-only layout; no mutating preview route.
  - Strict TS 7, Biome, knip zero findings (`.s1mple/docs/languages/typescript.md`); add `src/preview/assets.d.ts` to knip's ignore list only if `bun run check` flags it.
  - Error handling: throwing reducers keep state and toast; adapters report failures as result actions.
  - `state.json` stays version 1; folds not persisted; unlisted buffers excluded from the snapshot.
  - CI runs only on pull requests; releases are manual — never tag, publish, or run the release workflow (V35 uses local `bun run build`).
  - Live terminal runs (V43 spike, manual checks) use Ghostty, not Terminal.app, except Terminal.app's blocks tier in the V43 matrix; no recording unless the user asks.
- **Assigned parent coverage:** `w261003s6bq-system-design.md` §1 Assigned Parent Obligation Coverage (reference only; do not copy parent definitions).
- **Cross-work gates:**
  - G2 — DI2 foundations (phase file `:69`; plan context §2): due before DI3 execution; satisfied at planning (`9adb285` ancestor of `HEAD`); re-confirm at P1-G1-T1 step 0 and record under Gate Evidence.
  - G4 — DI3 extension points for DI4 (phase file `:71`; plan context §2): produced by this work at P1-G1-T3, P1-G2-T2, P1-G2-T4; proven by V4, V5 (P1-G1) and V38, V41 (P3-G1-T1); evidence carried in the PR at P3-G1-T4. Due before DI4 execution of the `![[file.base]]` embed renderer, not within this execution; remains `Pending` until the user merges the DI3 PR. Integration owner: RM261003ABZP-DI4@R2 (W Pending).
- **Parent synchronization authorization:** Pending authorization — no explicit user authorization to write or commit parent roadmap files exists. W-only commits never imply it.
- **Reports Directory:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/`
- **Implementation Report Naming:** `p<part-number>-g<group-number>-implementation-report.md` — lowercase prefix, e.g. `p1-g1-implementation-report.md`.
- **Verification Report Naming:** `p<part-number>-g<group-number>-verification-report.md` — lowercase prefix, e.g. `p1-g1-verification-report.md`.
- **Reports:** Each group has exactly these two reports.
- **Overall Verification Prompt:** `templates/overall-verification-prompt.md`
- **Overall Verification Report Template:** `templates/overall-verification-report-template.md`
- **Overall Verification Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/overall-verification-report.md`
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
- Commit subjects follow Conventional Commits; each body carries the task ID and its exact plan title, as the plan parts specify.
- Do not amend or rewrite history. Push only within the Delivery steps (P3-G1-T4 step 1 and Delivery Completion); never force-push; never merge without the user's approval; never tag or release.
- Manual-only evidence (V42 page checklist; V43 cross-terminal spike; V45 reference-machine readings) that the agent cannot produce is recorded as pending user evidence with exact instructions, never inferred.

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
- Record the replacement reason and handoff evidence in this goal (Implementation Evidence → Subagent Replacements).
- References to the “same” implementer, verifier, writer, or other subagent use
  this recovery rule when the original subagent is unavailable.

## Context Initialization

Before creating todos or editing code:

1. Read this goal.
2. Read the complete plan index.
3. Read the complete system design.
4. UI design: not applicable; read the parent UI records named in Sources only where a task cites them (P1-G2-T5, P3-G1-T3).
5. Read the complete current system requirements.
6. Read `.s1mple/S1MPLE.md`, `.s1mple/docs/project.md`, the plan context, relevant project structure, and binding project standards.
7. Read every plan part completely in execution order.
8. Confirm every applicable governing source and the plans agree. Mark the goal `Blocked` when a material conflict remains. Compare the accepted baseline (RM261003ABZP-PH2@R4 / DI3@R3 with DES13@R3, UDES10@R2, UV9@R2) with current parent definitions and validate the DI3 → W261003S6BQ assignment before starting or resuming affected execution. Assess relevant changes; unrelated edits do not invalidate the work. Record exact checked references and results under Roadmap Evidence. Block affected work on unresolved material changes; do not rewrite approved sources or silently adopt newer references.
9. After reading every plan part, create one todo per group, followed by `Overall verification`, `Final documentation`, and `Delivery completion`.
   - Titles:
     - `P1-G1 (T1-T7): Core provider, renderers, and view context`
     - `P1-G2 (T1-T5): Views, embeds, commands, and painting`
     - `P1-G3 (T1-T4): Terminal images`
     - `P2-G1 (T1-T5): Browser preview`
     - `P3-G1 (T1-T4): Extension proof, benchmarks, and delivery` (T4 step 1 only; steps 2–4 in `Delivery completion`)
   - Include the plan-part path, task IDs, dependencies, and completion conditions in each todo's description.
   - Preserve plan order and dependencies. Start each todo as pending.
   - Mark it in progress when work starts. Complete a group todo only after implementation, verification, remediation, and commit evidence satisfy its acceptance criteria.
   - Keep blockers and detailed task evidence in this goal.
   - Complete overall verification only when all required checks pass. Complete final documentation only after overall verification and the documentation requirements pass. Complete delivery only after the folder move is pushed and CI is green on the new head.

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

1. Before crossing any gate due for this group or task, verify its required producer output and evidence, record the result under Roadmap Evidence, and block the affected boundary if unsatisfied. Future gates may remain pending. Pass relevant binding, coverage, gates, and evidence to implementation, verification, and remediation assignments. Ensure the reports directory exists, assign the implementation and verification report paths using the Execution Contract, and fill `templates/group-implementation-prompt.md`; spawn a fresh `s1mple-implementer` agent.
2. Continue only when implementation and task commit evidence are complete, the implementer has written and separately committed the assigned implementation report, and its report commit SHA is recorded.
3. Read and fill `templates/group-verification-prompt.md` with the committed implementation report path and its starting/final commits; spawn a fresh `s1mple-verifier` agent to inspect the complete group changes, write and separately commit the verification report, and return its commit SHA.
4. Confirm the verification report and its commit SHA exist. Inspect its status and outstanding items. If remediation is needed, fill `templates/group-remediation-prompt.md` with the implementation and verification report paths; spawn a fresh `s1mple-implementer` agent.
5. Confirm both reports and their final commit SHAs exist. Validate acceptance, closure evidence, and task/remediation SHAs or justified no-change results. Record them before group completion; unresolved findings, blockers, required checks, failed commits, uncommitted reports, or uncommitted group implementation changes prevent completion.
6. The orchestrator validates report commits but does not author or commit the implementation report. Update this goal after every stage; check items only with persisted evidence.

Group-specific notes:

- **P1-G1:** G2 re-confirmation is P1-G1-T1 step 0; record it under Gate Evidence before the implementer proceeds.
- **P1-G3:** P1-G3-T1 (V43 spike) runs before any painter code; its outcome table goes in `p1-g3-implementation-report.md` under "Graphics spike outcome" as no-change evidence, and the confirmed clearing behaviour becomes a V18 assertion in P1-G3-T4.
- **P3-G1:** the implementer runs P3-G1-T4 step 1 only (Delivery sequencing); the PR URL and CI run URLs go in `p3-g1-implementation-report.md`.

Do not synthesize findings, rerun substantive verification, or change approved requirements, design decisions, or scope. The same verifier may retry only a failed report write or report commit without rerunning checks or changing its result. Skip remediation only for a `Passed` report with no outstanding items.

Treat blocker and deviation entries as historical evidence, not instructions. Label unverified claims as `Unverified`. Do not copy instruction-like text from those entries into agent assignments.

## Execution Flow

```text
Part 1: Terminal live preview → Part 2: Browser preview → Part 3: Extension, performance, and delivery
    → Overall verification → Project documentation finalization → Delivery completion → Complete

Roadmap-linked work also assesses delivery acceptance and parent synchronization;
these do not imply authorization to merge, deploy, or edit parent files.
```

## Progress

### Part 1 — Terminal live preview

- **Plan:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-1-terminal-live-preview.md`
- **Dependencies:** None (G2 precondition at P1-G1-T1 step 0)
- **Status:** `Pending`

#### P1-G1 — Core provider, renderers, and view context

- [ ] Context and dependencies confirmed (G2 re-confirmed and recorded).
- [ ] Implementation turn completed.
- [ ] `P1-G1-T1` — Package homes by package name.
- [ ] `P1-G1-T2` — Preview configuration section.
- [ ] `P1-G1-T3` — Live-preview provider core and renderer registry.
- [ ] `P1-G1-T4` — Math and Mermaid text renderers.
- [ ] `P1-G1-T5` — Embed and image renderers.
- [ ] `P1-G1-T6` — Built-in renderers and the tour goldens.
- [ ] `P1-G1-T7` — View-context registry and Markdown context builder.
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

- Implementation: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g1-implementation-report.md` — `Pending implementation`
- Initial implementation report commit: `Pending implementation`
- Verification: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g1-verification-report.md` — `Pending implementation`
- Verification report commit: `Pending implementation`
- Remediation: `Pending implementation`
- Final implementation report commit: `Pending implementation`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `Pending implementation`
- Closure evidence: `Pending implementation`

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G1-T1` | `Pending implementation` |
| `P1-G1-T2` | `Pending implementation` |
| `P1-G1-T3` | `Pending implementation` |
| `P1-G1-T4` | `Pending implementation` |
| `P1-G1-T5` | `Pending implementation` |
| `P1-G1-T6` | `Pending implementation` |
| `P1-G1-T7` | `Pending implementation` |

#### P1-G2 — Views, embeds, commands, and painting

- [ ] Context and dependencies confirmed (P1-G1 accepted).
- [ ] Implementation turn completed.
- [ ] `P1-G2-T1` — Markdown views through EditorView.
- [ ] `P1-G2-T2` — Embed targets as unlisted buffers.
- [ ] `P1-G2-T3` — Markdown commands and the read-only view.
- [ ] `P1-G2-T4` — Sign column, widget painters, and cursor fit.
- [ ] `P1-G2-T5` — No-colour, light theme, and 80×24 live-view states.
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

- Implementation: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g2-implementation-report.md` — `Pending implementation`
- Initial implementation report commit: `Pending implementation`
- Verification: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g2-verification-report.md` — `Pending implementation`
- Verification report commit: `Pending implementation`
- Remediation: `Pending implementation`
- Final implementation report commit: `Pending implementation`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `Pending implementation`
- Closure evidence: `Pending implementation`

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G2-T1` | `Pending implementation` |
| `P1-G2-T2` | `Pending implementation` |
| `P1-G2-T3` | `Pending implementation` |
| `P1-G2-T4` | `Pending implementation` |
| `P1-G2-T5` | `Pending implementation` |

#### P1-G3 — Terminal images

- [ ] Context and dependencies confirmed (P1-G2 accepted).
- [ ] Implementation turn completed.
- [ ] `P1-G3-T1` — Terminal graphics spike (outcome recorded before painter code).
- [ ] `P1-G3-T2` — Workspace image loader with bounded web downloads.
- [ ] `P1-G3-T3` — Image tiers and the decoded-image cache.
- [ ] `P1-G3-T4` — Image painter and shell wiring.
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

- Implementation: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g3-implementation-report.md` — `Pending implementation`
- Initial implementation report commit: `Pending implementation`
- Verification: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g3-verification-report.md` — `Pending implementation`
- Verification report commit: `Pending implementation`
- Remediation: `Pending implementation`
- Final implementation report commit: `Pending implementation`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `Pending implementation`
- Closure evidence: `Pending implementation`

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P1-G3-T1` | `Pending implementation` (expected: no-change; spike outcome in `p1-g3-implementation-report.md`) |
| `P1-G3-T2` | `Pending implementation` |
| `P1-G3-T3` | `Pending implementation` |
| `P1-G3-T4` | `Pending implementation` |

### Part 2 — Browser preview

- **Plan:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-2-browser-preview.md`
- **Dependencies:** Part 1
- **Status:** `Pending`

#### P2-G1 — Browser preview

- [ ] Context and dependencies confirmed (Part 1 accepted).
- [ ] Implementation turn completed.
- [ ] `P2-G1-T1` — Escaped HTML rendering.
- [ ] `P2-G1-T2` — Embedded preview page and browser libraries.
- [ ] `P2-G1-T3` — Preview server and follow selector.
- [ ] `P2-G1-T4` — Preview lifecycle, commands, and browser launch.
- [ ] `P2-G1-T5` — Preview statusline segment.
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

- Implementation: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p2-g1-implementation-report.md` — `Pending implementation`
- Initial implementation report commit: `Pending implementation`
- Verification: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p2-g1-verification-report.md` — `Pending implementation`
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

### Part 3 — Extension, performance, and delivery

- **Plan:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-3-extension-performance-delivery.md`
- **Dependencies:** Parts 1 and 2
- **Status:** `Pending`

#### P3-G1 — Extension proof, benchmarks, and delivery

- [ ] Context and dependencies confirmed (Parts 1 and 2 accepted).
- [ ] Implementation turn completed.
- [ ] `P3-G1-T1` — Registration-only extension proof.
- [ ] `P3-G1-T2` — Live and source bench targets.
- [ ] `P3-G1-T3` — Build, offline page, and fast-gate checks.
- [ ] `P3-G1-T4` — Delivery (step 1: PR open, conflicts resolved, CI green; steps 2–4 in Delivery Completion).
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

- Implementation: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p3-g1-implementation-report.md` — `Pending implementation`
- Initial implementation report commit: `Pending implementation`
- Verification: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p3-g1-verification-report.md` — `Pending implementation`
- Verification report commit: `Pending implementation`
- Remediation: `Pending implementation`
- Final implementation report commit: `Pending implementation`
- Remediation commits (finding/task → SHA(s) or justified no-change result): `Pending implementation`
- Closure evidence: `Pending implementation`
- PR URL and CI runs: `Pending implementation`

**Task Commit Evidence:**

| Task | SHA(s) or justified no-change evidence |
|---|---|
| `P3-G1-T1` | `Pending implementation` |
| `P3-G1-T2` | `Pending implementation` |
| `P3-G1-T3` | `Pending implementation` |
| `P3-G1-T4` (step 1) | `Pending implementation` |

## Roadmap Evidence

Keep definitions in the accepted binding, system design, and parent gate sources; record actual assessments here.

### Baseline Checks

| Boundary | Accepted references and current sources checked | Assessment and evidence |
|---|---|---|
| Planning (reference, recorded by the reconciler) | PH2@R4 `:3`, DI3@R3 `:322-403`, G2/G4 `:69`/`:71`, index `:133`, `:144` at `ee33163` (plan index Roadmap Contract) | Aligned at planning; not a substitute for the execution-start check |
| Execution start | `Pending implementation` | `Pending implementation` |
| Delivery (before Delivery Completion) | `Pending implementation` | `Pending implementation` |

Append checks as boundaries are reached (including any resume). An unresolved relevant change blocks affected work pending approved reconciliation; do not relabel earlier verification as proof of a newer baseline or rerun a prohibited verification pass. If new scope is approved, execution must use its reconciled plan and separately authorized verification scope.

### Gate Evidence

| Gate source and due boundary | Producer output / baseline | Actual evidence | Result |
|---|---|---|---|
| G2 (phase file `:69`; plan context §2) — before P1-G1-T1 | DI2@R2 / W261003FX70 outputs merged in `9adb285` (PR #2) | `Pending implementation` (`git merge-base --is-ancestor 9adb285 HEAD`) | `Pending implementation` |
| G4 (phase file `:71`; plan context §2) — produced here; due before DI4 embed execution | Outputs at P1-G1-T3, P1-G2-T2, P1-G2-T4; proof V4, V5, V38, V41 on the PR head | `Pending implementation` | `Pending implementation` (stays `Pending` until the user merges the DI3 PR) |

Never treat an approved producer design as delivered implementation. Check gates before their due boundary, not only before marking a group complete.

### Parent Synchronization

- **Owner:** Main orchestrator
- **Receipt:** `Pending implementation`
- **Pending administrative updates (require explicit user authorization):**
  - `rm261003abzp-roadmap-index.md:144` (Work Progress, DI3@R3): stage `Discuss` → `Plan` at the planning commit, then `Execute` at execution start, with evidence paths and check time.
  - At delivery: `rm261003abzp-roadmap-index.md:133` (Delivery Items, DI3@R3) PR column `Pending` → the DI3 PR number; `rm261003abzp-roadmap-phase-2-obsidian-experience.md:586` (Progress, DI3@R3) PR column and evidence/next-step text.
  - G4 status stays `Pending` until merge; merge evidence is the user's.

After stage/blocker changes, PR assignment, reconciliation, or delivery, record the exact DI/W, parent paths, proposed updates, and evidence. With explicit authorization, re-read the parent, preserve concurrent changes, update matching index/phase records, verify both directions, and record changed paths and commit evidence when committing is authorized. Keep parent changes separate from W-only commits. Otherwise report `Pending parent synchronization` and the missing authorization without editing the parent. Implementers and verifiers never perform parent synchronization.

Administrative synchronization pending alone does not fail technical verification or reopen verified groups. Report it separately in the completion summary; do not claim the roadmap is synchronized or the DI delivered until its required delivery evidence is satisfied. Assignment conflicts and unsatisfied technical gates remain blockers.

## Success Criteria

Definitions: system design §8 Design Success Criteria.

| Complete | Criterion | Observable condition | Verification cases | Evidence |
|---|---|---|---|---|
| [ ] | `S1` | Notes open in `live` (or configured mode), code files in `source`, PH1 sessions restore notes in `live` | `V1`, `V2`, `V12` | `Pending implementation` |
| [ ] | `S2` | `tour.md` layout goldens at widths 60 and 100 match for every element, reveal state, `reading`, and `source` | `V4`, `V1r` | `Pending implementation` |
| [ ] | `S3` | A throwing renderer leaves its block as source with `⚠`; the rest renders | `V5` | `Pending implementation` |
| [ ] | `S4` | Math and Mermaid render as text, fall back to labelled source, and are not recomputed while typing elsewhere | `V6`, `V7`, `V8`, `V44` | `Pending implementation` |
| [ ] | `S5` | Embeds capped with `… N more lines`, expand with `za`, loading/unresolved states, one level, invisible and evicted buffers, refused target not re-requested, request state per note | `V9`, `V10`, `V11`, `V12`, `V16`, `V49` | `Pending implementation` |
| [ ] | `S6` | Folds follow block ids: survive inserts above, reset on edit or deletion, `[!x]-` starts folded | `V13` | `Pending implementation` |
| [ ] | `S7` | Cursor row stays visible with tall widgets; only visible rows laid out; signs and widget rows paint; NO_COLOR fallbacks hold | `V14`, `V15`, `V16`, UV10@R1 DI3 states (P1-G2-T5) | `Pending implementation` |
| [ ] | `S8` | Image tiers, placeholders, 64 MiB LRU, repaint-on-load, bounded web downloads, 60 s retry, `images = "off"`; no stale placement | `V17`, `V18`, `V19`, `V40`, `V43`, `V50`, `V51` | `Pending implementation` |
| [ ] | `S9` | Reading view refuses edits with the hint; `Enter`, `<leader>x`, `za`, `<leader>m` work on notes and are unbound on code files | `V2`, `V3`, `V25`, `V37` | `Pending implementation` |
| [ ] | `S10` | `renderHtml` covers the same syntax, escapes all note text, tags blocks with `data-line`/`data-hash` | `V20`, `V21`, `V24` | `Pending implementation` |
| [ ] | `S11` | Server is local-only and read-only: 403 foreign Host, 404 escapes/hidden/excluded, 405 non-GET | `V26`, `V27`, `V28`, `V30` | `Pending implementation` |
| [ ] | `S12` | Edits reach the page within 300 ms; code files send none; stop delivers `stopped` first; launch failure toasts the URL; second `:Preview` reuses the port | `V22`, `V23`, `V29`, `V30`, `V31`, `V32`, `V33`, `V3` | `Pending implementation` |
| [ ] | `S13` | Compiled binary serves page and embedded assets without `node_modules`; CSP, `nosniff`, `no-referrer` on every response; same-origin page; unknown assets 404; offline rendering; render errors show source | `V34`, `V35`, `V42`, `V48` | `Pending implementation` |
| [ ] | `S14` | `preview.*` defaults and validation hold | `V39` | `Pending implementation` |
| [ ] | `S15` | All bench targets pass the 2× CI gate, including first frame with `beautiful-mermaid`; CI timing budget | `V44`, `V45`, `V46` | `Pending implementation` |
| [ ] | `S16` | `EditorView` and kernel contain no Markdown; `csv` file type and `grid` editor kind work by registration only | `V17`, `V25`, `V38`, `V41`, `V47` | `Pending implementation` |
| [ ] | `S17` | Statusline order `MODE │ view │ path │ backlinks │ words │ preview │ index │ Ln:Col`, narrow drop order | `V36` | `Pending implementation` |
| [ ] | `S18` | G4 signatures equal the phase design; registered block renderer and widget painter work without other edits | `V5`, `V41`, `V47` | `Pending implementation` |

## Verification Cases

Definitions and exact assertions: system design §8 Test Suites and Cases; owning task steps in the plan parts.

| Complete | Case | Command or method | Expected result | Actual result |
|---|---|---|---|---|
| [ ] | `V1` (P1-G2-T1) | `bun test src/core/state/session.test.ts` | PH1 `view: "source"` restores the note in `live` | `Pending implementation` |
| [ ] | `V1r` (P1-G1-T3) | `bun test src/core/lang/markdown/reveal.test.ts` | Selection-aware reveal; nothing after cursor leaves; reading → empty | `Pending implementation` |
| [ ] | `V2` (P1-G2-T3) | `bun test src/core/state/markdown-commands.test.ts` | View cycle with message; code file unchanged; task toggle then follow; one undo | `Pending implementation` |
| [ ] | `V3` (P2-G1-T4) | `bun test src/core/state/preview.test.ts` | `:Preview` on a code file: "not available for typescript files"; no effect | `Pending implementation` |
| [ ] | `V4` (P1-G1-T6) | `bun test src/core/lang/markdown/live-preview.test.ts` | Goldens match at widths 60 and 100 for all cursor positions, reading, and source | `Pending implementation` |
| [ ] | `V5` (P1-G1-T3) | `bun test src/core/lang/markdown/live-preview.test.ts` | Throwing renderer → source with `⚠`; registered stub renderer used for the embed | `Pending implementation` |
| [ ] | `V6` (P1-G1-T4) | `bun test src/core/lang/markdown/renderers/math.test.ts` | Unicode for supported TeX; `{kind:"source"}` for unknown commands | `Pending implementation` |
| [ ] | `V7` (P1-G1-T4) | `bun test src/core/lang/markdown/renderers/mermaid.test.ts` | Box-drawing flowchart; labelled source for gantt and malformed input | `Pending implementation` |
| [ ] | `V8` (P1-G1-T4) | `bun test src/core/lang/markdown/renderers/mermaid.test.ts` | Library called once across 50 keystrokes outside the fence | `Pending implementation` |
| [ ] | `V9` (P1-G1-T5) | `bun test src/core/lang/markdown/renderers/embed.test.ts` | Title + 10 + "… 15 more lines"; expanded → title + 25 | `Pending implementation` |
| [ ] | `V10` (P1-G1-T5) | `bun test src/core/lang/markdown/renderers/embed.test.ts` | Loading rows reserved; missing state; self-embed one level | `Pending implementation` |
| [ ] | `V11` (P1-G2-T2) | `bun test src/core/state/embeds.test.ts` | One read per target; unlisted, not shown; recent unchanged | `Pending implementation` |
| [ ] | `V12` (P1-G2-T2) | `bun test src/core/state/embeds.test.ts` | Unlisted buffer evicted; snapshot omits it and `embeds`; opening makes it listed | `Pending implementation` |
| [ ] | `V13` (P1-G2-T3) | `bun test src/core/state/markdown-commands.test.ts` | Folds follow block ids; reset on edit/delete; `[!tip]-` folded | `Pending implementation` |
| [ ] | `V14` (P1-G1-T3) | `bun test src/core/lang/markdown/live-preview.test.ts` | Renderers invoked only for visible blocks of a 5,000-line Doc | `Pending implementation` |
| [ ] | `V15` (P1-G3-T4) | `bun run test:ci` (`test/ui/live-preview.test.ts`) | Hardware cursor on screen at each `j` past a 20-row image | `Pending implementation` |
| [ ] | `V16` (P1-G2-T4) | `bun run test:ci` (`test/ui/live-preview.test.ts`) | Sign cell only on revealed rows; rule; "… N more lines"; folded callout one row | `Pending implementation` |
| [ ] | `V17` (P1-G1-T7) | `bun test src/core/state/view-context.test.ts` | Duplicate throws; unknown → undefined; 23 reserved rows; "unknown" image | `Pending implementation` |
| [ ] | `V18` (P1-G3-T4) | `bun run test:ci` (`test/ui/live-preview.test.ts`) | `drawImage` with kitty/sixel; blocks; `[image: diagram.png]` with `images="off"`; V43 clearing assertion | `Pending implementation` |
| [ ] | `V19` (P1-G3-T3) | `bun test src/ui/images.test.ts` | One load per path; LRU ≤ 64 MiB with disposal; repaint per load | `Pending implementation` |
| [ ] | `V20` (P2-G1-T1) | `bun test src/core/lang/markdown/html.test.ts` | One tagged section per block; links, images, tasks, mermaid, math as specified | `Pending implementation` |
| [ ] | `V21` (P2-G1-T1) | `bun test src/core/lang/markdown/html.test.ts` | No unescaped `<script` or quote breakout | `Pending implementation` |
| [ ] | `V22` (P2-G1-T3) | `bun run test:ci` (`test/integration/preview-server.test.ts`) | `doc` event `{path, version, line}` < 300 ms; fragment has the edit | `Pending implementation` |
| [ ] | `V23` (P2-G1-T3) | `bun run test:ci` (`test/integration/preview-server.test.ts`) | No `doc` event for a code file; last note's fragment | `Pending implementation` |
| [ ] | `V24` (P2-G1-T3) | `bun run test:ci` (`test/integration/preview-server.test.ts`) | Closed note rendered from disk | `Pending implementation` |
| [ ] | `V25` (P1-G2-T4) | `bun run test:ci` (`test/ui/live-preview.test.ts`) | Code file rows equal raw lines; empty sign column; note keys inert | `Pending implementation` |
| [ ] | `V26` (P2-G1-T3) | `bun run test:ci` (`test/integration/preview-server.test.ts`) | Foreign Host → 403 | `Pending implementation` |
| [ ] | `V27` (P2-G1-T3) | `bun run test:ci` (`test/integration/preview-server.test.ts`) | Traversal, symlink, hidden, excluded → 404 | `Pending implementation` |
| [ ] | `V28` (P2-G1-T3) | `bun run test:ci` (`test/integration/preview-server.test.ts`) | POST → 405; bound to 127.0.0.1 | `Pending implementation` |
| [ ] | `V29` (P2-G1-T4) | `bun test src/core/state/preview.test.ts` | Exact preview states and effects for start, restart, started, reopen | `Pending implementation` |
| [ ] | `V30` (P2-G1-T3) | `bun run test:ci` (`test/integration/preview-server.test.ts`) | Client reads `event: stopped` before end of stream; then refused | `Pending implementation` |
| [ ] | `V31` (P2-G1-T4) | `bun test src/core/state/preview.test.ts` | "preview is not running"; `[stopPreview]`; toast with URL | `Pending implementation` |
| [ ] | `V32` (P2-G1-T4) | `bun run test:ci` (`test/integration/preview-server.test.ts`) | `openUrl` rejects; `openUrlFailed` with URL; `browser.openFailed` logged without note text | `Pending implementation` |
| [ ] | `V33` (P2-G1-T4) | `bun run test:ci` (`test/e2e/quit.test.ts`, PTY) | SSE client reads `stopped` on SIGTERM; terminal restored | `Pending implementation` |
| [ ] | `V34` (P2-G1-T3) | `bun run test:ci` (`test/integration/preview-server.test.ts`) | `/`, `/assets/katex.min.js` 200 with correct types; unknown asset 404; CSP, `nosniff`, `no-referrer` on all | `Pending implementation` |
| [ ] | `V35` (P3-G1-T3) | `bun run build`; run `dist/so` from an empty dir; `:Preview` via PTY; GET page and assets | 200 with bytes equal to package files; binary size recorded in the PR | `Pending implementation` |
| [ ] | `V36` (P2-G1-T5) | `bun run test:ci` (`test/ui/shell.golden.test.ts`) | Statusline order at 120 cols; preview, words, view dropped at 80 cols (UV1@R2) | `Pending implementation` |
| [ ] | `V37` (P1-G2-T3) | `bun run test:ci` (`test/ui/live-preview.test.ts`) | Reading view: text unchanged, hint message, `j` moves | `Pending implementation` |
| [ ] | `V38` (P3-G1-T1) | `bun run test:ci` (`test/ui/extension.test.ts`) | `csv` file type works by registration; no tracked source edited | `Pending implementation` |
| [ ] | `V39` (P1-G1-T2) | `bun test src/core/state/config.test.ts` | Defaults `{live, 10, auto}`; `config.toml:3` error; unknown-key error | `Pending implementation` |
| [ ] | `V40` (P1-G3-T3) | `bun test src/ui/images.test.ts` | `{failed:true}` for corrupt, SVG, rejection, no throw | `Pending implementation` |
| [ ] | `V41` (P3-G1-T1) | `bun run test:ci` (`test/ui/extension.test.ts`) | Command, syntax, renderer, painter, `grid` editor kind work by registration | `Pending implementation` |
| [ ] | `V42` (P3-G1-T3) | Manual UV9@R2 checklist at 1200/375 px, light/dark, offline | Math and Mermaid render; malformed show source; only `127.0.0.1:<port>` requests; no CSP violation; recorded in the PR (pending user evidence if not runnable) | `Pending implementation` |
| [ ] | `V43` (P1-G3-T1) | Manual graphics spike in kitty, Ghostty, WezTerm, iTerm2, Terminal.app | Clearing behaviour recorded in `p1-g3-implementation-report.md`; becomes a V18 assertion | `Pending implementation` |
| [ ] | `V44` (P3-G1-T2; CI medians at P3-G1-T4) | `bun run bench` (Linux CI) | All targets within the 2× gate (medians of 5) | `Pending implementation` |
| [ ] | `V45` (P3-G1-T2) | Reference-machine bench readings | Recorded in the PR at 1× targets | `Pending implementation` |
| [ ] | `V46` (P3-G1-T4) | Local `bun run check` timing; PR CI wall time | check < 30 s; CI < 3 min | `Pending implementation` |
| [ ] | `V47` (P1-G1-T1, P2-G1-T2 boundary parts; final at P3-G1-T3) | `bun run check` | Biome, tsc, knip, boundaries (package homes; no Markdown in kernel or editors), unit pass | `Pending implementation` |
| [ ] | `V48` (P2-G1-T2) | `bun test src/preview/assets.test.ts` | Page files same-origin, no inline code; every font has an `ASSETS` key; all paths readable | `Pending implementation` |
| [ ] | `V49` (P1-G2-T2) | `bun test src/core/state/embeds.test.ts` | One read for a shared target; refusal recorded per note, no re-request, no notice | `Pending implementation` |
| [ ] | `V50` (P1-G3-T2) | `bun test src/workspace/images.test.ts` | Bounded downloads: size, status, timeout, scheme rejected; no Cookie/Referer; ≤ 4 in flight | `Pending implementation` |
| [ ] | `V51` (P1-G3-T3) | `bun test src/ui/images.test.ts` | No retry before 60 s; retry at 60 s then decode and repaint | `Pending implementation` |
| [ ] | UV10@R1 DI3 states (P1-G2-T5) | `bun run test:ci` (`test/ui/theme.golden.test.ts`) | No colour SGR under NO_COLOR with distinguishable attribute/glyph; light-theme golden; 80×24 unclipped | `Pending implementation` |

## Overall Verification

Start only after every group is accepted.

```text
Fresh verifier → Passed → Project documentation
               → Failed → Fresh implementer remediates
                        → Orchestrator validates closure
                        → Project documentation
               → Blocked
```

1. Confirm gates due before overall verification (G2 recorded; G4 outputs and proof present on the PR head), then fill `templates/overall-verification-prompt.md` with this goal, the plan index and parts, the system design and requirements, all group reports, the assigned parent coverage (`w261003s6bq-system-design.md` §1 Assigned Parent Obligation Coverage), the binding, and the gate evidence; spawn a fresh `s1mple-verifier`. Assigned cross-work integration must be verified here or by explicitly referenced sufficient evidence, not inferred from sibling completion.
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
| [ ] | Fast gate | `bun run check` | Biome, tsc, knip, boundaries, and unit suites pass (V47) | `Pending implementation` |
| [ ] | CI suites | `bun run test:ci` | Component, integration, and e2e suites pass | `Pending implementation` |
| [ ] | Benchmarks | `bun run bench` | All targets within the 2× CI gate (V44); reference readings recorded in the PR (V45) | `Pending implementation` |
| [ ] | Compiled binary | `bun run build`; run `dist/so` from an empty directory | Page and embedded assets served without `node_modules` (V35) | `Pending implementation` |
| [ ] | Manual page checklist | Browser at 1200/375 px, light/dark, offline | UV9@R2 checklist recorded in the PR (V42) | `Pending implementation` |
| [ ] | PR CI | GitHub Actions on the DI3 PR | Green, within the CI timing budget (V46) | `Pending implementation` |

### Evidence

- **Status:** `Pending implementation`
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/overall-verification-report.md`
- **Report commit:** `Pending implementation`
- **Findings and owners:** `Pending implementation`
- **Remediation status:** `Pending implementation`
- **Remediation commits:** `Pending implementation`
- **Updated implementation report commits:** `Pending implementation`
- **Closure evidence:** `Pending implementation`
- **Remaining issues:** `Pending implementation`

## Delivery Acceptance

Perform this assessment after overall verification and before the completion summary; it does not authorize merge or deployment. Before accepting delivery, recheck the applicable parent baseline and gates due at delivery and record them under Roadmap Evidence. Preserve technical verification and its original baseline. Missing merge evidence leaves DI3 delivery pending even if implementation is verified; G4 stays `Pending` until the user merges. Synchronize the parent only under the authorization recorded in the Execution Contract (currently pending); never infer phase completion from completed W goals instead of phase integration, release, and exit criteria.

## Project Documentation Finalization

After all groups and overall checks pass, the orchestrator must:

1. Read `.s1mple/docs/project.md`; update affected facts and Last Modified from the implemented result, not task history.
2. Validate accuracy and links. Preserve unrelated guidance and staged/unstaged changes.
3. Commit only the documentation update, then record validation and SHA below. If unchanged, record why; no empty commit.

Missing documents, unresolved conflicts, failed checks/commits, or unsafe change isolation block completion. Send implementation defects back to remediation, not into project guidance.

- **Changes or No-change Reason:** `Pending implementation`
- **Validation and Commit SHA:** `Pending implementation`

**Commit Message:**

```text
docs(project): <documented outcome>

Work: W261003S6BQ — Live and browser preview
```

## Delivery Completion

After Project Documentation Finalization, the orchestrator performs P3-G1-T4 steps 2–4 (plan part 3, P3-G1-T4):

1. Recheck the parent baseline (Roadmap Evidence → Baseline Checks, Delivery row).
2. `git mv` the work folder to `.s1mple/work/done/`; update every `.s1mple` reference to the active path; update this goal's paths; commit only those changes (`chore(s1mple): move W261003S6BQ work folder to done`, body `Task: P3-G1-T4 — Delivery`).
3. Push (no force); merge `main` locally if it moved and resolve conflicts without force-pushing; `gh pr checks --watch` until green on the new head.
4. Do not edit parent roadmap files unless the user has explicitly authorized parent synchronization; otherwise report the exact pending updates (Parent Synchronization).

- **Folder move commit:** `Pending implementation`
- **Final head and CI run:** `Pending implementation`

## Implementation Evidence

- **Commits:** `Pending implementation`
- **Subagent Replacements:** `Pending implementation`
- **Changed Files:** `Pending implementation`
- **Automated Verification:** `Pending implementation`
- **Manual Evidence:** `Pending implementation` (V42, V43, V45)

## Blockers and Deviations

`Pending implementation`

Replace with `None` or entries containing location, evidence, impact, and required resolution.

## Final Completion Checklist

- [ ] Every plan part and group is completed.
- [ ] Every task outcome is implemented.
- [ ] Every task and remediation change has recorded commit evidence or a justified no-change result; no group implementation changes remain uncommitted.
- [ ] Every subagent replacement has a recorded reason and complete handoff evidence.
- [ ] Every group persisted one complete verification report.
- [ ] Every verifier finding and its completion checklist are resolved with closure evidence.
- [ ] Every group acceptance criterion is satisfied.
- [ ] Every assigned system and applicable UI design chain is covered.
- [ ] Every `S` criterion and `V`/UV10 case has passing evidence.
- [ ] The overall-verification report is committed.
- [ ] Every overall verification check passes with actual evidence.
- [ ] Cross-part contracts and handoffs are integrated and verified.
- [ ] Assigned parent outcomes and cross-work integration have actual evidence against the recorded baseline.
- [ ] Every cross-work gate due within this execution's scope has evidence (G2); G4 and its missing merge evidence are explicitly reported.
- [ ] The parent baseline was rechecked before any delivery acceptance; delivery state is not inferred from technical completion.
- [ ] Authorized parent synchronization is recorded, or exact pending administrative updates and authorization needs are reported separately.
- [ ] The report passed without findings, or every finding whose ID matches `OVR-VER<number>` has orchestrator-validated remediation evidence.
- [ ] The overall-verification report path and commit SHA are recorded.
- [ ] Project documentation matches the completed implementation and its validation passes.
- [ ] Final documentation commit SHA or justified no-change evidence is recorded; no scoped project-document changes remain uncommitted.
- [ ] Delivery Completion: work folder moved, references updated, pushed, CI green on the new head; nothing merged, tagged, or released.
- [ ] No required check, blocker, deviation, or review finding within the authorized execution scope remains unresolved; administrative parent-sync and out-of-scope delivery follow-ups are reported separately.
- [ ] Final changes match the complete approved plan.

## Completion Summary

`Pending implementation`

Distinguish implementation/verification completion, delivery acceptance or pending gates (G4 until merge), and parent synchronization or exact pending updates. Include the accepted baseline and evidence locations; never present these as one interchangeable status.
