# W261022JQU1 OpenTUI 0.6 — Ship

## Table of Contents

- [1. Decisions](#1-decisions)
  - [Q&A Log](#qa-log)
  - [Requirements](#requirements)
  - [UI Mockups](#ui-mockups)
  - [UI Design](#ui-design)
  - [System Design](#system-design)
  - [Verification](#verification)
    - [Test Strategy](#test-strategy)
  - [Traceability](#traceability)
- [2. Goal](#2-goal)
  - [Status](#status)
  - [Sources](#sources)
  - [Reports](#reports)
  - [Todos](#todos)
  - [Execution Rules](#execution-rules)
  - [Group Cycle](#group-cycle)
  - [Group Scheduling](#group-scheduling)
- [3. Plan](#3-plan)
  - [G1 — OpenTUI 0.6.6 pin and resource owners](#g1--opentui-066-pin-and-resource-owners)
  - [G2 — Sized text on the native scene](#g2--sized-text-on-the-native-scene)
  - [G3 — Async terminal transitions](#g3--async-terminal-transitions)
  - [G4 — Whole-app behaviour](#g4--whole-app-behaviour)
- [4. Overall Verification and Harden](#4-overall-verification-and-harden)
- [5. Deliver](#5-deliver)
- [6. Evidence](#6-evidence)
  - [Groups](#groups)
  - [Verification Cases](#verification-cases)
  - [Overall Verification](#overall-verification)
  - [Harden](#harden)
  - [Deliver Evidence](#deliver-evidence)
  - [Blockers, Deviations, and Replacements](#blockers-deviations-and-replacements)
  - [Completion Summary](#completion-summary)
- [Ship File Check](#ship-file-check)

## 1. Decisions

The user asked for this run to be self-driven, approved by the user on 2026-10-22: no question turns, and the ship runs through delivery (PR, CI, work-folder move) without stage gates. Every decision below is an assumption logged in the Q&A Log.

- **Prompt:** Upgrade `@opentui/core` from 0.5.14 to 0.6.6 and keep every feature, behaviour, and interaction working.
- **Goal:** `so` runs on OpenTUI 0.6.6 with the same screens, bytes, and interactions as on 0.5.14; `bun run check`, `bun run test:ci`, `bun run build`, and every CI job pass.
- **Scope:** the dependency pin; sized text (OSC 66) on the native scene; async suspend, resume, and destroy; tests that create buffers without a renderer; whatever else the full suites or a live run show broken. · **Non-goals:** adopting new OpenTUI features (program status, `measureEditText`, native hit testing for the mouse router); changing any look or behaviour.
- **UI:** `not needed — the change keeps every screen as it is`

What 0.6 breaks, measured on this branch with 0.6.6 installed (`.tmp/` logs, 2026-10-22):

| Break | Where it hits | Count |
|---|---|---|
| `OptimizedBuffer.create` needs an `owner` | `src/ui/cell-width.test.ts`, `src/ui/widgets/sized-text.test.ts` | 3 tsc errors, 3 unit failures |
| The renderer has no `writeOut` | `terminalWriter` in `src/ui/sized-text.ts:238`, called by `SizedText`'s constructor on every shell start | every e2e case (34) and the config suites |
| Paint hooks get a recording buffer that cannot read cells | `SizedText.draw` reads `buf.buffers` (`src/ui/sized-text.ts:290`) inside `renderSelf` | 14 |
| `suspend()`/`resume()` are async and throw on a renderer whose terminal is not set up | `src/ui/shell.ts:389`, `src/app/tool-host.ts:53` | 4 hand-off tests |
| `destroy()` restores the terminal asynchronously | `src/app/lifecycle.ts:80` exits right after it | e2e exit paths (hidden behind the crash) |

What still works, checked with spikes on 0.6.6 (`.tmp/spike.test.ts`, `.tmp/spike2.test.ts`):

```text
post-process fn ─ nativeSession.write("<PRE>") ─► lands before the frame's bytes
"frame" event   ─ nativeSession.write("<POST>") ─► lands after them
post-process fn ─ next.buffers ─► readable
post-process fn ─ currentRenderBuffer.withBuffers: flip fg alpha bits on 6 cells ─► next frame rewrites exactly those 6 cells
forceFullRepaintRequested ─► still a private boolean, reset only after the commit (after post-process)
owned scratch buffer (owner: renderer.nativeScene), same draw calls as the frame
   ─► identical char, attributes, fg, bg for ASCII, CJK, 👍🏽 (grapheme), and default colours
```

### Q&A Log

| Q | Question | Answer | Decides |
|---|---|---|---|
| `A1` | Does the run ask questions or stop at gates? | No — the user asked for a self-driven ship through delivery, approved by the user on 2026-10-22 | All |
| `A2` | Which version? | 0.6.6, the latest release (2026-10-14), exact pin like every npm version — `.s1mple/docs/project.md` Constraints | `REQ1`, `DES1` |
| `A3` | How does sized text write bytes now that `writeOut` is gone? | Through the renderer's private `nativeSession.write`, which joins the same ordered output queue as frames; the spike shows a post-process write lands before the frame and a `frame`-event write after it, as `writeOut` did. The project already relies on private members here (`src/ui/sized-text.ts:234`) | `DES2` |
| `A4` | How is a draw that something painted over detected, now that hooks cannot read cells? | Each draw carries the paint function that drew its cells; the post-process step replays them into one scratch buffer the renderer's scene owns and compares it with the frame. The spike shows the scratch cells equal the frame's, graphemes and default colours included | `DES3` |
| `A5` | How are touched areas forced to be rewritten? | As today: flip the fg alpha bits of those cells in `currentRenderBuffer`, now inside `withBuffers` in the post-process step; the spike shows the next frame rewrites exactly those cells | `DES4` |
| `A6` | What if `nativeSession.write` refuses bytes (output queue full)? | The next frame is fresh: every draw goes again after a full repaint, so no stale sized glyph stays | `DES2` |
| `A7` | How do suspend, resume, and destroy follow the async transitions? | `Shell.suspend`/`resume` return promises the tool host awaits; `Shell.destroy` stays safe to repeat and to call while suspended, and exit awaits `renderer.closed` (OpenTUI bounds it at 1 s) before the process exits | `DES5`, `DES6` |
| `A8` | How do component tests reach suspend and resume, which throw on a renderer whose terminal is not set up? | The shared test mount sets the terminal up on test streams, so the real transitions run | `DES7` |
| `A9` | The Mermaid renderer's `withoutWindow` shim exists because OpenTUI installed a global `window`; 0.6 no longer does. Keep it? | Remove it and its comment: the cause is gone and the shim's only path left is the no-op one (`src/core/lang/markdown/renderers/mermaid.ts:78`) | `DES8` |
| `A10` | Five watcher unit tests and nine CI watcher tests fail on this machine. Fix them here? | No — they fail the same way on unchanged master here and pass on CI; CI is the oracle for them | `V1`, `V6` |
| `A11` | Must benchmarks hold? | They run as CI does; a regression is fixed with quick wins or a relaxed target, never by stalling the ship (memory: perf gates don't block) | `V6` |
| `A12` | How is the real-terminal behaviour checked? | A live smoke run in kitty and in a separate herdr session in its own Ghostty window, on the `tour` sandbox profile, never in the user's session; what cannot be seen by eye is reported as unverified | `V7` |

### Requirements

| ID | Requirement | Source |
|---|---|---|
| `REQ1` | `@opentui/core` is pinned at exactly `0.6.6`, and `bun run check`, `bun run test:ci`, `bun run build`, and every CI job (`check`, `test (ubuntu-24.04)`, `test (macos-15)` with build and bench, `audit`, `zizmor`) pass | Prompt, `A2` |
| `REQ2` | Sized text (H1–H3, math scripts, footnote labels, text zoom) sends the same bytes in the same order as on 0.5.14: old areas erased before the frame, draws after it, a draw something painted over is not sent and its area is rewritten whole, and every draw goes again after a move, a change under it, a resize, a resume, or a full repaint | Prompt, `A3`–`A6` |
| `REQ3` | The tool hand-off and every exit path behave as on 0.5.14: the frame is written before the terminal is handed over, nothing paints while suspended, the screen, images, and sized text come back on resume, and the terminal is restored exactly once before the process exits | Prompt, `A7`, `A8` |
| `REQ4` | Every other feature and interaction keeps working: note, PDF, image, video, and browser windows with their kitty images, the mouse, overlays, language servers, Git, databases, Mermaid, and the browser preview | Prompt, `A9`, `A12` |

### UI Mockups

Not applicable — no screen changes.

### UI Design

Not applicable — no UI.

### System Design

| ID | Decision | Builds | Why |
|---|---|---|---|
| `DES1` | `package.json` pins `"@opentui/core": "0.6.6"` with `bun.lock` updated by `bun add --exact`. Tests that make a buffer without a renderer create one `ResourceContext` (`new ResourceContext({ objectCapacity, renderCellsMax })`), pass it as `owner`, read cells through `buffer.withBuffers`, and destroy the context after the test | `REQ1` | 0.6 requires an owner for every buffer and allows `buffer.buffers` only in post-process |
| `DES2` | `src/ui/sized-text.ts` writes through the renderer's private `nativeSession.write` (bytes UTF-8 encoded), keeping `ShellDeps.write` as the injected override; it reads the private `forceFullRepaintRequested` as today. Both are looked up once at construction and throw a clear error naming the member when OpenTUI lacks it. A write that returns `false` marks the next frame fresh and requests a full repaint | `REQ2` | The spike shows the session queue keeps `writeOut`'s ordering; a refused erase must never leave a displaced glyph |
| `DES3` | `SizedText.draw(rects, bytes, paint)` takes `paint: (buf: OptimizedBuffer) => void`, which draws exactly the cells of `rects`. `paintSizedText` (`src/ui/widgets/sized-text.ts`) and `paintZoomRow` (`src/ui/zoom-row.ts`) draw their sized rows through one such function, called with the frame's buffer while painting and handed to `draw`. The post-process step clears one scratch `OptimizedBuffer` owned by `renderer.nativeScene` (screen-sized, re-created when the size changes, destroyed by `SizedText.destroy`), replays each draw's `paint` into it, and marks a draw covered when any cell of its rects differs between scratch and frame | `REQ2` | Hooks can no longer read cells; replaying the same draw calls into an owned buffer gives the cells the painter left, which the spike shows equal the frame's |
| `DES4` | The post-process step reads `next.buffers` and `currentRenderBuffer` cells inside `currentRenderBuffer.withBuffers`, computes `planFrame` unchanged, and marks rewrite cells changed by flipping their fg alpha bits in the current buffer there | `REQ2` | Keeps `planFrame` and the kitty overwrite rules as they are; the spike shows the next frame rewrites exactly the marked cells |
| `DES5` | `Shell.suspend(): Promise<void>` sets `suspended`, clears the image slots, and awaits `renderer.suspend()`; `Shell.resume(): Promise<void>` awaits `renderer.resume()`, then clears `suspended`, invalidates sized text, and repaints. `createToolHost` awaits both in the same order as today (flush → hold interrupts → suspend → tool → reset foreign modes → resume), and a failed restore step is still logged and rejects the run | `REQ3` | 0.6 transitions are async and throw while another is pending, so each must finish before the next starts |
| `DES6` | `Shell.destroy()` stays idempotent and safe while suspended; `Shell` gains `closed(): Promise<void>` resolving when `renderer.closed` settles (a rejection is logged, not thrown). `src/app/lifecycle.ts` awaits it after `destroy()` on every exit path before writing `so: <error>` or exiting | `REQ3` | 0.6 restores the terminal after `destroy()` returns; exiting first can leave the terminal in the alternate screen with modes on |
| `DES7` | The shared component-test mount (`test/support/ui.ts`) and any suite that suspends set the test renderer's terminal up on test streams (`createTestStdin`/`createTestStdout`, or `setupTerminal`) so `suspend`/`resume` run for real; tests await the shell's promises | `REQ3` | `suspend()` throws on a renderer whose terminal is not set up; a fake would hide the transition order |
| `DES8` | Remove `withoutWindow` from `src/core/lang/markdown/renderers/mermaid.ts` and call the layout directly | `REQ4` | 0.6 no longer installs a global `window`, so the shim and its comment describe a cause that is gone |

### Verification

| ID | Proves | Checks | Layer | Command or method | Expected |
|---|---|---|---|---|---|
| `V1` | `REQ1` | `DES1`, `DES8` | Unit | `bun run check` | Biome, tsc, and knip clean; every unit test passes except the five watcher tests that fail identically on master on this machine (`A10`); `src/ui/cell-width.test.ts` and `src/ui/widgets/sized-text.test.ts` pass on owned buffers; Mermaid renderer tests pass |
| `V2` | `REQ2` | `DES2`, `DES3`, `DES4` | Component | `bun test --timeout=20000 test/ui/sized-text.test.ts` | Every existing case passes with its byte and cell-count assertions unchanged (only harness calls may change): erase (`ESC 7 … ECH … ESC 8`) before `ESC[?2026h ESC[?25l`, OSC 66 after the frame; covered draw not sent with 12 cells rewritten; resend on move, change, resize, resume, and a forced full repaint; nothing sent on an unchanged frame |
| `V3` | `REQ2` | `DES3` | Component | New case in `test/ui/sized-text.test.ts` | A sized heading holding `中` and `👍🏽` is sent on its first frame and not again on the next unchanged frame, so the scratch comparison never reports a grapheme cell as painted over |
| `V4` | `REQ3` | `DES5`, `DES7` | Component | `bun test --timeout=20000 test/ui/git.test.ts` | The hand-off cases pass on a set-up test renderer: the pre-suspend frame is written and nothing after it until resume; images visible before suspend are drawn again after resume; destroying while suspended restores the terminal once |
| `V5` | `REQ3` | `DES5`, `DES6` | End-to-end | `bun test --timeout=20000 test/e2e` (cases "the terminal is restored on every exit path", "the editor returns intact after the git tool is killed", "Ctrl-C does not quit; :q does") | Each exit path exits with its code and the PTY trace ends with the alternate screen left and modes reset, once; the editor redraws intact after the tool is killed |
| `V6` | `REQ1`, `REQ4` | `DES1`–`DES8` | Integration, end-to-end, release | `bun run test:ci`, `bun run build && dist/so --version`, then CI on the PR | All suites pass locally except watcher cases that fail identically on master here (`A10`); the build prints the version; every CI job on the PR head passes |
| `V7` | `REQ2`, `REQ3`, `REQ4` | `DES2`, `DES3`, `DES5`, `DES6` | Manual | Live smoke on `bun run sandbox` (`tour` profile) in kitty and in a separate `herdr --session` in its own Ghostty window, with `SO_LOG=debug`: open a note with H1–H3, math, and a picture; `<leader>u=` then `<leader>u-`; open a PDF and page; click and drag; open a picker; `<leader>gg` to lazygit and back; `:q!` | No crash or error toast, the debug log has no render error, the hand-off returns to an intact screen, and the shell exits to a clean prompt; anything that needs eyes and could not be seen is reported as unverified |

#### Test Strategy

The existing suites already pin the behaviour this upgrade must keep (sized-text bytes and cell counts, hand-off order, PTY exit paths), so they are the oracle and stay unchanged except where a harness call must follow the new API. One new case (`V3`) covers the one new risk the spikes could not settle for every input: grapheme cells compared across two buffers. The live smoke (`V7`) covers what no headless suite reaches: a real terminal's capability replies and a real tool owning the terminal.

### Traceability

| REQ | Mockup | UDES | DES | V | Tasks |
|---|---|---|---|---|---|
| `REQ1` | — | — | `DES1` | `V1`, `V6` | `G1-T1`, `G4-T1` |
| `REQ2` | — | — | `DES2`, `DES3`, `DES4` | `V2`, `V3`, `V7` | `G2-T1`, `G2-T2` |
| `REQ3` | — | — | `DES5`, `DES6`, `DES7` | `V4`, `V5`, `V7` | `G3-T1`, `G3-T2` |
| `REQ4` | — | — | `DES8` | `V1`, `V6`, `V7` | `G1-T2`, `G4-T1` |

## 2. Goal

### Status

- **State:** `In Progress`
- **Position:** `G3`
- **Work branch:** `feat/opentui-0.6`
- **Base commit:** `80103fb` — the diff base for overall verification and harden

### Sources

- `.s1mple/S1MPLE.md` and its required references
- `.s1mple/docs/project.md`
- `.s1mple/docs/principles.md`
- Accepted mockups: `Not applicable — no UI`
- Prompts and template: `implementation-prompt.md`, `verification-prompt.md`, `remediation-prompt.md`, `verification-report-template.md` in the `s1mple-ship` skill's `templates/` directory
- OpenTUI release notes v0.5.15–v0.6.6 (`gh release view v<version> -R anomalyco/opentui`); the 0.6.0 notes list every breaking change

### Reports

Verifiers and harden write reports here; each report is committed by its writer and never edited afterwards.

```text
.s1mple/work/active/w261022jqu1-opentui-0-6/reports/
├── g<n>-verification-report.md       one per group
├── overall-verification-report.md
└── harden-report.md                  written by s1mple-harden
```

### Todos

At execution start, create one todo per line with the coding agent's todo tool, in this order:

```text
G1 (T1–T2) ← None: OpenTUI 0.6.6 pin and resource owners
G2 (T1–T2) ← G1: Sized text on the native scene
G3 (T1–T2) ← G2: Async terminal transitions
G4 (T1) ← G3: Whole-app behaviour
Overall verification
Harden
Deliver
```

Update the todos throughout execution: mark one in progress when it starts, and complete it only when its completion conditions hold with evidence. Mark a group done only after it is accepted and merged. Keep a blocked todo open with the blocker in its description.

### Execution Rules

- Start on the user's execution command. Record the work branch and base commit, create `reports/`, then set the state to `In Progress`.
- Self-drive to the end. Ask no questions after the execution command.
- Investigate failures and try safe alternatives. If one group is blocked, continue the groups whose dependencies are met. When no safe, in-scope work remains, record the evidence and set `Blocked`.
- Do not change the decisions in Section 1, skip checks, or bypass permissions.
- Implementers commit their own changes. Do not push, amend, or rewrite history.
- Only the orchestrator writes this file. Commit only this file after each accepted group and after each later stage: `docs: update W261022JQU1 ship evidence`.
- Every subagent prompt says: use `/usr/bin/git`, one plain command per Bash call, `bun install --frozen-lockfile` before tests; stop every process it starts (servers, terminals, herdr sessions, Ghostty windows it opened, `so` instances) and check for orphans it left before returning, never touching the user's own sessions.
- **Consultant:** For an exceptional blocker that normal investigation cannot solve, the orchestrator may invoke `s1mple-consultant` with the problem, evidence, and attempts. It advises only.
- **Subagent recovery:** If an agent that must continue is unavailable, spawn a fresh one of the same type with the original assignment, committed outputs, completed checks, and remaining work. Record the replacement under Evidence.

### Group Cycle

```text
fresh s1mple-implementer   implement → check → commit, per task
  → fresh s1mple-verifier  group scope, runs once → commits reports/g<n>-verification-report.md
  → Passed with no findings → accept
  → otherwise fresh s1mple-implementer remediates every finding in the report, once
  → orchestrator checks closure evidence → accept or block
```

1. Fill `implementation-prompt.md` and spawn a fresh `s1mple-implementer`.
2. Fill `verification-prompt.md` with scope `G<n>`, the implementer's change range and return, and report output `reports/g<n>-verification-report.md`. Spawn a fresh `s1mple-verifier`. Confirm the report and its commit exist.
3. When the result is not `Passed` with no findings, fill `remediation-prompt.md` in `group` mode with the report path and spawn a fresh `s1mple-implementer`.
4. Accept the group only when every task has a commit SHA or a justified no-change reason, every finding in the report is `Fixed`, and all group checks pass. Record the evidence under [Groups](#groups).

Do not rerun verification or remediation. An unresolved finding blocks the group.

### Group Scheduling

The groups form one chain, so each runs alone in the main tree (`.worktrees/opentui-0.6`) once the one before it is accepted.

```text
G1 → G2 → G3 → G4
```

## 3. Plan

```text
G1 pin + owners ─► G2 sized text ─► G3 transitions ─► G4 whole app
```

G2 and G3 both edit `test/ui/sized-text.test.ts` (its resume case), and G4 only finds what is left once both land, so the chain is sequential.

### G1 — OpenTUI 0.6.6 pin and resource owners

- **Depends on:** `None`
- **Context:** `package.json`, `bun.lock`, buffers made without a renderer in unit tests, the Mermaid renderer
- **Checks:** `bun --bun run tsc --noEmit -p .`, `bun run check`
- **Accept when:** OpenTUI is pinned at 0.6.6, tsc is clean, and `bun run check` fails only on the five local watcher tests (`A10`)

| Task | Title | Builds | Files | Approach | Steps | Checks |
|---|---|---|---|---|---|---|
| `G1-T1` | Pin OpenTUI 0.6.6 and give test buffers an owner | `REQ1`, `DES1` | `package.json`, `bun.lock`, `src/ui/cell-width.test.ts`, `src/ui/widgets/sized-text.test.ts` | `Direct — the existing unit tests prove it once they compile` | `bun add --exact @opentui/core@0.6.6`; in both tests create a `ResourceContext`, pass it as `owner`, read `char` through `withBuffers`, destroy the context in `finally`/`afterEach` → run tsc and both files | `bun --bun run tsc --noEmit -p .`, `bun test src/ui/cell-width.test.ts src/ui/widgets/sized-text.test.ts` |
| `G1-T2` | Drop the Mermaid window shim | `REQ4`, `DES8` | `src/core/lang/markdown/renderers/mermaid.ts` | `Direct — existing Mermaid tests prove it` | Remove `withoutWindow` and its comment; call the layout directly → run the Mermaid renderer tests and `bun run check` | `bun test src/core/lang/markdown`, `bun run check` |

### G2 — Sized text on the native scene

- **Depends on:** `G1`
- **Context:** `SizedText` and its two painters: `src/ui/sized-text.ts`, `src/ui/widgets/sized-text.ts`, `src/ui/zoom-row.ts`, their callers in `src/ui/widgets/zoom-text.ts` and `src/ui/editors/text-view.ts`, `test/ui/sized-text.test.ts`
- **Checks:** `bun test --timeout=20000 test/ui/sized-text.test.ts`, `bun run check`
- **Accept when:** every sized-text case passes with unchanged byte and cell-count assertions, and the new grapheme case passes

| Task | Title | Builds | Files | Approach | Steps | Checks |
|---|---|---|---|---|---|---|
| `G2-T1` | Write sized text through the native session and replay paints to find covered draws | `REQ2`, `DES2`, `DES3`, `DES4` | `src/ui/sized-text.ts`, `src/ui/widgets/sized-text.ts`, `src/ui/zoom-row.ts`, `src/ui/widgets/zoom-text.ts`, `src/ui/editors/text-view.ts`, `test/ui/sized-text.test.ts` | `Direct — the existing sized-text suite (V2) is the oracle` | Replace `terminalWriter` with a session writer (`nativeSession.write`, refused write → fresh + full repaint); `draw(rects, bytes, paint)`; painters draw sized rows through one `paint(buf)` used for the frame and passed to `draw`; post-process replays paints into an owned scratch buffer and compares, reads and marks `currentRenderBuffer` inside `withBuffers`; destroy the scratch in `destroy()`; update the suite's direct `SizedText` harness (`Heading.renderSelf`, the exported helpers it checks) without changing its assertions → run `V2` | `bun test --timeout=20000 test/ui/sized-text.test.ts` |
| `G2-T2` | Prove grapheme cells are not taken as painted over | `REQ2`, `DES3` | `test/ui/sized-text.test.ts` | `TDD` | RED: `V3` — mount a note whose H1 holds `中` and `👍🏽`, expect its OSC 66 draw on the first frame and none on the next unchanged frame (fails if the comparison treats grapheme ids as different) → GREEN: adjust the comparison in `src/ui/sized-text.ts` only if it fails → REFACTOR: none | `bun test --timeout=20000 test/ui/sized-text.test.ts` |

### G3 — Async terminal transitions

- **Depends on:** `G2`
- **Context:** the shell's terminal lifecycle and its callers: `src/ui/shell.ts`, `src/app/tool-host.ts`, `src/app/lifecycle.ts`, `src/app/main.ts`, `test/support/ui.ts`, `test/ui/git.test.ts`, `test/ui/sized-text.test.ts`, `test/integration/config.test.ts`, the tool-host and lifecycle unit tests
- **Checks:** `bun test --timeout=20000 test/ui/git.test.ts test/ui/sized-text.test.ts test/integration`, `bun run check`
- **Accept when:** the hand-off and lifecycle tests pass on real transitions and no caller leaves a suspend, resume, or close promise unawaited

| Task | Title | Builds | Files | Approach | Steps | Checks |
|---|---|---|---|---|---|---|
| `G3-T1` | Await suspend and resume through the shell and tool host | `REQ3`, `DES5`, `DES7` | `src/ui/shell.ts`, `src/app/tool-host.ts`, `test/support/ui.ts`, `test/ui/git.test.ts`, `test/ui/sized-text.test.ts`, the tool-host unit tests | `Direct — the existing hand-off suite (V4) is the oracle` | Make `Shell.suspend`/`resume` async per `DES5`; await them in `createToolHost`; set the test mount's terminal up so transitions run; await the shell's promises in tests → run `V4` and the sized-text resume case | `bun test --timeout=20000 test/ui/git.test.ts test/ui/sized-text.test.ts`, `bun test src/app` |
| `G3-T2` | Wait for the terminal to be restored before exit | `REQ3`, `DES6` | `src/ui/shell.ts`, `src/app/lifecycle.ts`, `src/app/main.ts`, `test/integration/config.test.ts`, the lifecycle unit tests | `Direct — the lifecycle unit tests and the e2e exit paths (V5) prove it` | Add `Shell.closed()` per `DES6`; await it after `destroy()` on every exit path in `lifecycle.ts` before writing the error or exiting → run the lifecycle tests, then `V5` | `bun test src/app`, `bun test --timeout=20000 test/e2e` |

### G4 — Whole-app behaviour

- **Depends on:** `G3`
- **Context:** whatever the full suites, the build, and the e2e PTY runs still show broken on 0.6.6, plus the TypeScript language document's tool table
- **Checks:** `bun run check`, `bun run test:ci`, `bun run build && dist/so --version`
- **Accept when:** `V1` and `V6` hold locally (watcher cases aside, `A10`) and no failure remains that also passes on master

| Task | Title | Builds | Files | Approach | Steps | Checks |
|---|---|---|---|---|---|---|
| `G4-T1` | Fix what the full suites still show broken on 0.6.6 | `REQ1`, `REQ4`, `DES1` | Found by the run; `.s1mple/docs/languages/typescript.md` (tool versions now `@types/bun` 1.4.3, knip 6.41.0) | `Direct — the full suites (V6) are the oracle` | Run `bun run test:ci` and the build; for each failure that passes on master (compare with a run on base), find the 0.6 cause in the release notes and fix it with the smallest change; update the language document's tool table → rerun until clean | `bun run check`, `bun run test:ci`, `bun run build && dist/so --version` |

## 4. Overall Verification and Harden

Start after every group is accepted and merged.

```text
fresh verifier (overall, runs once) → Passed → harden
                                    → Failed → fresh implementer remediates all OVR findings, once → harden
                                    → Blocked → set Blocked
harden → Deliver
```

1. Fill `verification-prompt.md` with scope `overall`, change range `<base-commit>..HEAD`, all `V` cases (`V7` included, following the live-test rules in the Execution Rules), and report output `reports/overall-verification-report.md`. Spawn a fresh `s1mple-verifier` in the main tree. Confirm the report and its commit exist.
2. When it fails, fill `remediation-prompt.md` in `overall` mode with the report path and spawn one fresh `s1mple-implementer` for every `OVR-VER<n>` finding.
3. Run `s1mple-harden` in workflow mode. Use this file as the goal and **Base commit** as the base.

## 5. Deliver

1. Read `.s1mple/docs/project.md`. Update facts the change affected and its Last Modified date: the stack table (`@opentui/core` 0.6.6, and the versions #47 and #49 moved: `@types/bun` 1.4.3, knip 6.41.0, highlight.js 11.12.0, zod 4.6.7, `mdast-util-from-markdown` 2.1.0, katex 0.19.0, mermaid 12.2.0) and the sized-text paragraph (session writer, paint replay into a scratch buffer, `withBuffers`). Commit only that file:

   ```text
   docs(project): describe so on OpenTUI 0.6.6

   Work: W261022JQU1 — OpenTUI 0.6
   ```

2. Apply the Delivery behavior in `.s1mple/S1MPLE.md`, which the user authorized for this run: push `feat/opentui-0.6`, open a PR to `master`, make CI pass and resolve conflicts with the base branch, move the work folder to `work/done/` and update `.s1mple/` references to it, push again, and confirm CI passes on the new head. Never force-push or merge.
3. Fill [Completion Summary](#completion-summary), set the state to `Completed`, and commit this file.

## 6. Evidence

### Groups

| Group | Directory | Task commits | Verification report → status, SHA | Findings → fix SHAs | Merge SHA | Result |
|---|---|---|---|---|---|---|
| `G1` | Main tree | `G1-T1` `7a62f59`, `G1-T2` `6509b76` | `reports/g1-verification-report.md` — `Passed`, `57a69d5` | None | Not applicable — main tree | `Accepted`; the verifier flagged `test/ui/editor-options.test.ts:100` reading `currentRenderBuffer.buffers` for the G4 sweep |
| `G2` | Main tree | `G2-T1` `d5f504c`, `G2-T2` `5cc5e6e` | `reports/g2-verification-report.md` — `Failed` (1 Minor), `d618b06` | `G2-VER1` (refused write untested; repaint landed on the refused frame) → `1bd9227`, closure rerun by the orchestrator: sized-text suite 16 pass, 1 fail (the resume case, which needs G3's async suspend) | Not applicable — main tree | `Accepted` |
| `G3` | `Pending` | `Pending` | `reports/g3-verification-report.md` — `Pending` | `Pending` | `Pending` | `Pending` |
| `G4` | `Pending` | `Pending` | `reports/g4-verification-report.md` — `Pending` | `Pending` | `Pending` | `Pending` |

### Verification Cases

| Case | Actual result |
|---|---|
| `V1` | `Pending` |
| `V2` | `Pending` |
| `V3` | `Pending` |
| `V4` | `Pending` |
| `V5` | `Pending` |
| `V6` | `Pending` |
| `V7` | `Pending` |

### Overall Verification

- **Report:** `reports/overall-verification-report.md` — `Pending`
- **Result and report SHA:** `Pending`
- **Findings → fix SHAs:** `Pending`

### Harden

- **Report:** `reports/harden-report.md` — `Pending`
- **Result:** `Pending`

### Deliver Evidence

- **Project document:** `Pending`
- **Delivery actions:** `Pending`

### Blockers, Deviations, and Replacements

`Pending`

### Completion Summary

`Pending`

## Ship File Check

- [x] Every `REQ` has at least one `UDES` or `DES`, one `V`, and one task.
- [x] Every UI `REQ` has a `UDES` derived from an explicitly accepted mockup revision. (No UI `REQ`.)
- [x] No `DES` describes the UI, and no `UDES` has a `pending` `Uses`.
- [x] Every `UDES` and `DES` has a `V` and a task.
- [x] The Q&A Log has a row for every answered question and assumption.
- [x] When UI is needed, the mockup manifest is `Accepted`, and its accepted revisions match the UI Mockups section. (UI not needed.)
- [x] Every task cites the `REQ`/`UDES`/`DES` it builds, and every `V` cites the `REQ` it proves and the `UDES` or `DES` it checks.
- [x] There are at most 4 groups, and no dependency cycles.
- [x] Each group's tasks share one context.
- [x] Parallel groups do not edit the same files, or a dependency orders them.
- [x] Every `V` has a runnable command or a concrete manual method.
- [x] Every `V` covers a unique, important risk at the lowest layer that catches it; no trivial or redundant case.
- [x] Every task has an approach, and every `V` that needs a new test is owned by a `TDD` task.
- [x] No placeholder remains.
