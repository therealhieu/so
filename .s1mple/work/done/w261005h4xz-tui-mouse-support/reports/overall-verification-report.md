# Overall Verification Report

## Scope

- **Goal:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-goal.md`
- **Plan Index:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-index.md`
- **Plan Parts:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-1-core-mouse-model.md`, `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-2-ui-mouse-routing.md`
- **Report:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/overall-verification-report.md`

Verified range: `da4275e` → `5355398` (37 changed files under `src` and `test`; no `package.json`, `bun.lock`, workflow, or `src/preview` change).

## Status

`Failed`

All three groups are accepted, and every assigned overall check passes. Two Major requirement mismatches remain. Neither group verifier caught them, because each one sits on the boundary between the core and the UI.

- A click to the right of a word-wrapped row puts the cursor on the next screen row (OVR-VER1, REQ4).
- A press that closes the open command line still lets the following drag start a Visual selection, and that selection is anchored at the old cursor, not at the press (OVR-VER2, REQ8 and REQ5).

## Group Acceptance

| Group | Implementation report | Verification report | Closure and commit evidence | Result |
|---|---|---|---|---|
| `P1-G1` | `reports/p1-g1-implementation-report.md` (initial `b6710bb`, final `5dffdd9`) | `reports/p1-g1-verification-report.md` (`c3a7a3f`, `Failed`, one Major) | `P1-G1-VER1` fixed in `a3d73ab`: `sourceColAt` takes `lineLength`, with a RED/GREEN `hit.test.ts` case. Task commits `3ae1d38`, `93a1e08`, `b98c8ae`, `e139649`, `1957fde`, `fc01724`, `23941de`. Every commit is present in `git log da4275e..HEAD` | `Accepted` |
| `P2-G1` | `reports/p2-g1-implementation-report.md` (initial `50509c4`, final `e773834`) | `reports/p2-g1-verification-report.md` (`9d642dd`, `Failed`, one Minor) | `P2-G1-VER1` fixed in `b32c9c5`: an edge-drag component case that fails when `edge` is forced to 0. Task commits `7e4fa01`, `cbaf500`, `15cb104`, `8d4bc80`, `18f9966` | `Accepted` |
| `P2-G2` | `reports/p2-g2-implementation-report.md` (initial `ca6412a`, final `260e931`) | `reports/p2-g2-verification-report.md` (`a6bda04`, `Failed`, two Major and one Minor) | `P2-G2-VER1` → `a20ac03` (which-key float is `overlay`). `P2-G2-VER2` → `caab0e2` (`ToastStack` is a `wheelOnly` source). `P2-G2-VER3` → `715e048` (inert rows, markers, hidden panel). Each has RED/GREEN or mutation evidence. Task commits `dc9becd`, `3be97c7`. Acceptance recorded in `5355398` | `Accepted` |

## Plan Coverage

| Source item | Planned owner | Implementation evidence | Verification evidence | Result |
|---|---|---|---|---|
| `REQ1@R1` / `DES1`, `DES5` / `S1`, `S2` / `V1`, `V2`, `V3`, `V29`, `V30`, `V31` | Part 1, Part 2 | `src/core/state/types.ts` defines `WindowSpot`, `MouseTarget`, and `MouseEvent` with no coordinates and no button. `src/core/state/mouse.ts:feedKeys` folds `handleKeyAction`. `src/ui/mouse.ts:createMouseRouter` drops non-left buttons and all events while `enabled()` is false | `bun run check`: the `src/core/state/mouse.test.ts` equivalence cases, and the `@ts-expect-error` at `mouse.test.ts:255` is still required. `src/ui/mouse.test.ts`: right/middle buttons and the top-source order. V31 `rg` finds no matches | `Satisfied` |
| `REQ2@R2` / `DES2`, `DES3`, `DES5` / `S3` / `V4`, `V5`, `V6`, `V20` | Part 1, Part 2 | `mouse.ts:wheel,scrollWindow,wheelBase,wheelOverlay,withFocus`. Toast wheel → `inert` → `none` (`src/ui/overlays/notify.ts:ToastStack.targetAt`). Which-key wheel → `overlay` → `wheelOverlay` default `none` | Reducer units V4–V6. Component V20, plus the which-key and toast wheel cases in `test/ui/mouse.test.ts` | `Satisfied` |
| `REQ3@R1` / `DES5` / `S4` / `V7` | Part 1 | `mouse.ts:press,focusTarget` (Insert, Visual, and pending end in their own window before focus moves) | V7 reducer unit; component split-focus and winbar cases | `Satisfied` |
| `REQ4@R1` / `DES3`, `DES4`, `DES5` / `S5`, `S6` / `V8`, `V9`, `V10`, `V11`, `V21` | Part 1, Part 2 | `text-view.ts:spansOf` sets `col`/`inserted`. `src/core/kernel/view/hit.ts:rowAt,sourceColAt`. `src/ui/editors/text-view.ts:EditorView.textAt`. `mouse.ts:pressText` | V8–V11 units and V21 component pass. A click to the right of a word-wrapped (non-final) row maps to a character on the next screen row | `Mismatch` (OVR-VER1) |
| `REQ5@R1` / `DES2`, `DES3`, `DES5` / `S7`, `S8` / `V12`, `V13`, `V14`, `V22` | Part 1, Part 2 | Router click counting and drag capture. `EditorView.dragAt` (clamp + `edge`). `mouse.ts:dragText` | V12–V14 and V22 pass, and the edge-drag component case passes. A drag that follows a press consumed by the command-line gate is anchored at the old cursor, not at the press | `Mismatch` (OVR-VER2) |
| `REQ6@R1` / `DES5` / `S9` / `V15` | Part 1 | `mouse.ts:pressText` → `runCommand("link.follow")`, gated by `followsLinks` | V15 reducer unit | `Satisfied` |
| `REQ7@R1` / `DES3`, `DES5` / `S10`, `S11` / `V1`, `V16`, `V17`, `V18`, `V23` | Part 1, Part 2 | `mouse.ts:pressChrome,pressBase,pressItem`. Exported wrappers in `base-commands.ts`, `picker.ts`, `calendar.ts`. Every view has its `targetAt`/`itemAt`. A which-key inside click is `overlay` (no-op). Toasts are skipped for presses | V1 and V17 units. V16, V18, and V23 component cases, plus the which-key, toast, inert-row, and marker cases | `Satisfied` |
| `REQ8@R1` / `DES3`, `DES5` / `S12` / `V19`, `V24` | Part 1, Part 2 | `mouse.ts:overlayGate`. `src/ui/overlays/host.ts:OverlayHost.targetAt` returns `outside` everywhere except completion | V19 and V24 units; component picker-outside, completion-body, and command-line cases. The router keeps the drag origin of a press the gate consumed, so the next drag selects text | `Mismatch` (OVR-VER2) |
| `REQ9@R1` / `DES6` / `S13`, `S14` / `V25`, `V26`, `V27`, `V28` | Part 1, Part 2 | `schema.ts` `mouse: z.boolean().default(true)`. `shell.ts` `RENDERER_OPTIONS.useMouse: false`; `paint` syncs `renderer.useMouse`, then `layer.update(s)` | V27 unit. Component mode-sync and reload case. PTY V25 and V26. V28 quit/restore: 10 pass, assertions unchanged | `Satisfied` |
| Plan-context gaps 1–6 | Part 1, Part 2 | `attach` hoists `bufferline`/`statusline`; `selectCalendarDay`; completion wheel clamp; completion select + `<CR>`; PTY via `XDG_CONFIG_HOME`; knip clean | Group reports and `bun run check` (knip clean) | `Satisfied` |
| Binding constraints (core purity, dispatch-only state changes, exact pins, no Bases drag-and-drop, no work-process ids) | Part 1, Part 2 | `rg '@opentui' src/core` finds no matches. `BaseView` has no `dragAt`, and the router drags only window text. No `package.json` change. Every view only resolves targets | `test/boundaries.test.ts` in `bun run check`; the work-ID scan finds no matches | `Satisfied` |
| Non-goals (hover, horizontal editor wheel, separator drag, file/card/tab drag, right/middle click, OSC 22, preview page) | Part 1, Part 2 | `enableMouseMovement: false`. `scrollWindow` ignores `dx`. `WindowTree.targetAt` returns `undefined` on separators. The router drops non-left buttons. No OSC 22 code. `src/preview` is unchanged | Inspection of `src/ui/mouse.ts`, `src/core/state/mouse.ts`, `src/ui/views/window-tree.ts`; `git diff --name-only da4275e..HEAD -- src/preview` is empty | `Satisfied` |

## Roadmap Contract Evidence

Not applicable — standalone work

## Cross-Part Integration

| Boundary or handoff | Producing part | Consuming part | Evidence | Result |
|---|---|---|---|---|
| `MouseEvent`, `MouseTarget`, `WindowSpot`, `Action` `mouse` + `now` | `Part 1` | `Part 2` | The router and every `targetAt`/`itemAt` build only these shapes (tsc clean). `MouseLayer` → `createMouseRouter` → `store.dispatch({type:"mouse", event, now})` → `update` → `onMouse` | `Passed` |
| `rowAt`, `sourceColAt` (`lineLength`), `Span.col`/`inserted` | `Part 1` | `Part 2` | `EditorView.textAt` passes `b.text.line(line).length` as the fourth argument and uses the painter's width (`rect.w − gutterWidth`). Neither side bounds a column to the end of its wrap row (OVR-VER1) | `Failed` |
| `AppConfig.mouse` ↔ `renderer.useMouse` / router `enabled()` / `MouseLayer.visible` | `Part 1` | `Part 2` | `src/ui/shell.ts` `paint`: `if (renderer.useMouse !== s.config.mouse) renderer.useMouse = s.config.mouse; layer.update(s)`; router `enabled: () => store.get().config.mouse`. The component case covers mount and `configLoaded` reload; the PTY case shows `"none"`/`"drag"` | `Passed` |
| Removal of `EditorView.onMouseScroll` → router wheel | `Part 1` | `Part 2` | V31 finds no matches; V20 wheel over the right split | `Passed` |
| Press gate (core) ↔ drag origin (router) | `Part 1` | `Part 2` | `overlayGate` consumes a press while `:` is open, but `createMouseRouter` still stores `origin` for that press, and `dragText` then enters Visual (OVR-VER2) | `Failed` |
| `View`/`MouseSource` contract and source order | `Part 2` (`P2-G1`) | `Part 2` (`P2-G2`) | `sources = [overlays, toasts(wheelOnly), cmdline, statusline, side, explorer, bufferline, windows]`, which is the paint order reversed (`bufferline` and `windows` never overlap). The design order is extended only by the authorized wheel-only `toasts` entry | `Passed` |

**Recorded scope extension and design drift.** The authorized P2-G2 file-scope extension (`whichkey.ts`, `notify.ts`, `MouseSource.wheelOnly`, `toasts` in `sources`) makes REQ7 (which-key click: nothing) and REQ2 (toast wheel: nothing) hold as written, and toast clicks still pass through. The change is minimal and stays inside the router-and-sources architecture of DES2 and DES3. The resulting drift is that design §2, §4, and §5 call `ToastStack` "not a mouse source" and §7 derives the which-key box from `centered`. That drift is documentation only, and the goal's "Blockers and Deviations" records it. The requirements govern, so it is not a finding.

## Overall Checks

| Check | Command or method | Expected result | Actual result | Result |
|---|---|---|---|---|
| Fast gate (V29, V30) | `bun run check` | Exit 0: biome, tsc, knip, unit suites | First run: exit 1. Two `src/workspace/watcher.test.ts` cases received a stray `notes/loop` `changed` event. This file is not in the work's diff. In isolation the same file ran 3 times with 7 pass each time. Rerun of the full gate: exit 0, biome clean, tsc clean, knip clean, 1052 pass, 0 fail | `Passed` |
| Full suites | `bun run test:ci` | Component, integration, and PTY suites green, including `test/ui/mouse.test.ts` and `test/e2e/mouse.test.ts` | Exit 0: 209 pass, 0 fail, 58 snapshots, 28 files | `Passed` |
| Exit restore (V28) | `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts` | `screen.mouse` is `"none"` after `:q`, `SIGTERM`, and crash | 10 pass, 0 fail, 48 expect() calls; `git diff --stat da4275e..HEAD` on both files is empty | `Passed` |
| Obsolete reference (V31) | `rg 'kind: "scroll"\|onMouseScroll' src` | No matches | No matches (exit 1) | `Passed` |
| Work-ID scan | `git diff --name-only da4275e..HEAD -- src test \| xargs rg -n 'W261005H4XZ\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P[12]-G[12]'` | No matches | No matches (exit 1) | `Passed` |
| Benchmarks | `bun run bench` | Reported only; non-blocking | Exit 0, all `ok`. Medians: `sourceKeystrokeP95` 4.57 ms, `liveKeystrokeP95` 11.70 ms, `openFile` 37.50 ms, `sourceOpenFile` 16.74 ms, `liveScrollFrameP95` 7.50 ms, `sourceScrollFrameP95` 5.24 ms, `firstFrame` 148.08 ms, `indexReady` 997.99 ms, `indexingKeystrokeP95` 9.39 ms | `Passed` |
| Process cleanup | `pgrep -fl 'src/app/main.ts\|bun run dev'` | No orphan processes | No processes (exit 1) before the bench, after every suite, and at the end | `Passed` |
| CI | PR #8 checks | Recorded in the Delivery stage | Deferred to Delivery (orchestrator); not run here and not a failure | `Passed` |

## Findings

### OVR-VER1 — Major — A click right of a word-wrapped row lands on the next screen row

- **Owner:** `Cross-group` (`P1-G1` `rowAt`/`sourceColAt`; `P2-G1` `EditorView.textAt`)
- **Source items:** `REQ4@R1`, `DES3`, `DES4`, `S5`, `V21`
- **Evidence:** `wrapLine` breaks at word boundaries (`src/core/kernel/view/wrap.ts:30-33`), so a non-final wrap row often ends before the window width. `rowAt` returns only `startCol` (`src/core/kernel/view/hit.ts:35`). `EditorView.textAt` computes `dc = startCol + leftCol + x − textX`, and `sourceColAt` resolves it against the whole line's spans. As a result, a cell in the blank tail of a wrap row resolves to a character on the next row. A pure probe on `"alpha bravo charlie"` at width 8 gives wrap starts `[0, 6, 12]`. On row 0, x = 6 and x = 7 map to columns 6 and 7 (the `br` of `bravo`), which are drawn on row 1. A temporary component probe (deleted afterwards, working tree clean) used a 40×12 shell. It clicked x = 38 on the row `the quick brown fox jumps over`. The cursor went to `{line: 1, col: 32}` (`h` of `the`), one row below the click. V21 clicks only on a character, so no test covers this.
- **Impact:** `wrap` defaults to `true` (`src/core/config/schema.ts:67`), and clicking to the right of prose is common. The cursor moves to a character the user did not click, on a different screen row, and the next edit lands there. REQ4 requires the source column displayed at the cell, and a click past the shown text must land on the last character of what is shown.
- **Required resolution:** A click right of the last shown cell of a non-final wrap row maps to the last source character on that screen row (Normal mode), or to its row-end position in Insert mode, consistent with REQ4's past-end rule. Clicks on shown characters and on final rows keep their current mapping.
- **Required proof:** A `src/core/kernel/view/hit.test.ts` case or a `test/ui/mouse.test.ts` case. It clicks right of a word-wrapped non-final row and asserts that the cursor stays on that screen row's last character. It must fail against the current `5355398` code. `bun run check` and `bun run test:ci` must stay green.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change and commit evidence are recorded.
- [ ] The orchestrator validates closure evidence.

### OVR-VER2 — Major — A press that closes the command line still starts a drag selection from the old cursor

- **Owner:** `Cross-group` (`P2-G1` router drag origin; `P1-G1` `overlayGate`/`dragText`)
- **Source items:** `REQ8@R1`, `REQ5@R1`, `DES2`, `DES5`, `S12`, `S7`, `V22`, `V24`
- **Evidence:** While `:` is open, `CommandLine.targetAt` returns `undefined` over the body, so the window answers with a text target. `overlayGate` consumes the press with `<Esc>` (`src/core/state/mouse.ts:89`). The router, however, sets `origin = hit` for every resolved press (`src/ui/mouse.ts:100`). The next drag event is a window-text drag, and `dragText` enters `v` at the cursor that was in place before the press. A temporary component probe (deleted afterwards) put the cursor on line 1, typed `:`, then dragged from (line 2, col 6) to (line 2, col 4). The result was mode `visual`, anchor `{line: 1, col: 0}`, cursor `{line: 2, col: 4}`. The picker and which-key do not show this, because the host returns `outside` there, and `outside` is never a drag origin.
- **Impact:** REQ8 says a click outside the open command line closes it like `Esc` "and that click does nothing else". REQ5 anchors a drag at the press position. Here, any pointer movement during the dismissing click selects text from an unrelated anchor, and a following `d` or `c` would act on that range. The trigger is limited: the pointer must move to another cell while the button is held.
- **Required resolution:** A drag that follows a press consumed by the command-line gate (or by any dismissing overlay gate) changes nothing. Drags that follow normal body presses, including the completion-yield case, keep their current behavior.
- **Required proof:** A `test/ui/mouse.test.ts` case. With `:` open, it presses on body text and drags to another cell, then asserts that the mode is `normal` and that the cursor and the absence of a Visual anchor are unchanged from the plain-click result. It must fail against `5355398`. The existing drag, completion, and V24 cases must still pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change and commit evidence are recorded.
- [ ] The orchestrator validates closure evidence.

## Unverified Items

- PR #8 CI is not run here; the orchestrator records it in the Delivery stage.
- The first `bun run check` hit a `src/workspace/watcher.test.ts` failure. That file is outside this work's diff, and the failure did not recur in 3 isolated runs or in the full rerun. Its cause (an fs-watcher event leaking from another case) was not investigated, because it is out of scope.

## Blockers

None

## Completion Assessment

- **All groups accepted:** `Yes`
- **Plan coverage complete:** `No`
- **Cross-part integration passed:** `No`
- **Assigned parent coverage and cross-work checks passed:** `Not applicable`
- **All overall checks passed:** `Yes`
- **No unresolved finding or blocker remains:** `No`
