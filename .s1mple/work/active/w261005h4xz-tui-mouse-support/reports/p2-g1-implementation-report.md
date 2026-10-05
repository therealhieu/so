# P2-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-goal.md`
- **Plan Part:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-plan-2-ui-mouse-routing.md`
- **Group:** `P2-G1`
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/reports/p2-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G1-T1` | `src/ui/mouse.ts:CLICK_MS,MouseSource,MouseRouter,createMouseRouter` (new); `src/ui/mouse.test.ts` (new) | RED: `bun test src/ui/mouse.test.ts` → `Cannot find module './mouse'`. GREEN: same → 6 pass, 0 fail. `bun --bun run tsc --noEmit -p .` → exit 0. `bun run knip` → exit 0, no findings | `7e4fa015bbd59c397c861bac708833f586cd0562` | `Completed` |
| `P2-G1-T2` | `src/ui/mouse.ts:MouseLayer`; `src/ui/shell.ts:RENDERER_OPTIONS` (`useMouse: false`), `View` (`targetAt?`, `dragAt?`), `createShell().attach` (hoisted `bufferline`/`statusline`, router + layer, `paint` syncs `renderer.useMouse` and updates the layer); `test/support/ui.ts:mountShell` (`mouse: t.mockMouse`); `test/ui/mouse.test.ts` (new) | RED: `bun test test/ui/mouse.test.ts` → `useMouse` expected `false`, received `true`. GREEN: same → 1 pass. `bun test test/ui` → 122 pass, 0 fail. knip → no findings | `cbaf50033e42ecd5b35d20d20ac275fb51775600` | `Completed` |
| `P2-G1-T3` | `src/ui/editors/text-view.ts:EditorView.targetAt,dragAt,textAt`; `src/ui/editors/registry.ts:WindowView` (`targetAt`, `dragAt?`); `src/ui/views/window-tree.ts:WindowTree.rects,targetAt,dragAt`; `src/ui/editors/base-view.ts:BaseView.windowId,targetAt` (plain `base` spot, refined in T4); `src/ui/shell.ts` (`sources: [windows]`); `test/ui/mouse.test.ts` | RED: 3 new cases failed for the expected reason (scroll 0 instead of 3; cursor stayed at 0:0; mode stayed `normal`). GREEN: `bun test test/ui/mouse.test.ts` → 4 pass. `bun test test/ui` → 125 pass, 0 fail. tsc, knip clean | `15cb10477057e8261d88bd92098653b9b2295371` | `Completed` |
| `P2-G1-T4` | `src/ui/editors/base-view.ts:Frame.table,Frame.board,BaseView.tabs,targetAt,paintToolbar` (records painted tab ranges), `cellAt`, `cardAt`; `test/ui/mouse.test.ts` | RED: new case failed (`view` expected `By status`, received `All tasks`). GREEN: `bun test test/ui/mouse.test.ts` → 5 pass. `bun test test/ui` → 126 pass, 0 fail, 58 snapshots (Bases goldens unchanged). knip clean | `8d4bc80a6d71059d458b7d000316550cd2af6f56` | `Completed` |
| `P2-G1-T5` | `test/e2e/pty.ts:PtyProcess.mouse`; `test/e2e/mouse.test.ts` (new) | RED: `bun test test/e2e/mouse.test.ts` → `p.mouse is not a function`, 2 fail. GREEN: same → 2 pass, 3 repeated runs all 2 pass. `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts` → 10 pass, 0 fail, assertions unchanged. `pgrep -fl 'src/app/main.ts'` → no processes. No production change was needed | `18f996668e8e752dc9a205ae65df79f6440c5439` | `Completed` |

### Group Change Range

- **Starting commit:** `184d3bc` (clean working tree, no staged or unstaged changes)
- **Final commit:** `18f996668e8e752dc9a205ae65df79f6440c5439`
- **Remaining group changes:** None

### Group Verification

- `bun test src/ui/mouse.test.ts` (V2, V3, V13, V22) → `Passed` — 6 pass, 0 fail
- `bun test test/ui/mouse.test.ts` (V20, V21, V23, plus mode sync and drag) → `Passed` — 5 pass, 0 fail
- `bun test test/e2e/mouse.test.ts` (V25, V26) → `Passed` — 2 pass, 0 fail
- `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts` (V28) → `Passed` — 10 pass, 0 fail; `git diff 184d3bc -- test/e2e/quit.test.ts test/e2e/restore.test.ts` is empty
- `bun run check` → `Passed` — exit 0; biome 313 files clean, tsc clean, knip clean, 1050 pass, 0 fail
- `bun run test:ci` → `Passed` — exit 0; 198 pass, 0 fail, 58 snapshots
- `git diff --name-only 184d3bc..HEAD | xargs rg -n 'W261005H4XZ|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P2-G1'` → `Passed` — no matches (exit 1)
- `rg -n '@opentui' src/core` → `Passed` — no matches (exit 1)
- `rg 'kind: "scroll"|onMouseScroll' src` → `Passed` — no matches (exit 1)
- `pgrep -fl 'src/app/main.ts|bun run dev'` → `Passed` — no processes; every PTY run exits through `:q`, and `runInPty` kills the child on a script error

### Deviations and Remaining Issues

1. **`BaseView.targetAt` lands in T3 as a stub.** `WindowView.targetAt` is required (design §7), and `BaseView` implements `WindowView`, so T3 had to give `BaseView` a `targetAt` to keep `tsc` green. T3's version returns the plain `base` spot for any cell in the rect; T4 replaced it with tabs, cells, and cards. No behavior shipped between the two commits that T4 then changed beyond the refinement.
2. **The router reads a narrowed event type.** `createMouseRouter().handle` takes `Pick<OpenTuiMouseEvent, "type" | "button" | "x" | "y" | "modifiers" | "scroll">` (local type `PointerEvent`), so unit tests pass plain objects. `MouseLayer` passes the real OpenTUI event. A `drag` also requires `button === 0`; `over`, `out`, `move`, and `drop` are ignored. A press that resolves to no target clears the drag origin, so a following drag is dropped.
3. **Kept geometry.** `EditorView` reads only what `show` keeps (`rect`, `winbar`, `leftCol`, `skipRows`, `lines`, `topLine`) and passes `b.text.line(line).length` as `sourceColAt`'s fourth argument (the P1-G1 handoff). The gutter and widget rows give column 0, the rows below the text give the last laid-out line (the buffer's last line when it ends inside the window), and the column is clamped to the line length. `BaseView` keeps the `TableLayout`/`BoardLayout` computed in `show` (`Frame.table`/`Frame.board`, the same layouts `renderSelf` paints from) and the tab ranges recorded while `paintToolbar` paints. Table separators, the row lead, group headers, and the toolbar outside tabs are the plain `base` spot. The condensed narrow toolbar label (`1/4 All tasks`) is not a tab, so a click on it focuses only.
4. **Drag hit-grid detail in component tests.** While a drag is in progress OpenTUI captures the mouse layer and leaves the captured renderable out of the hit grid on any render (`addToHitGrid` skips `capturedRenderable`). After `up` it calls `requestRender()`, which restores the grid within a frame in the live app. The test renderer renders only on `renderOnce`, so the drag test calls `m.frame()` between two drags. Not a production defect.
5. **Buffer line count.** A file's trailing newline is a flag in the text buffer, not an empty line, so "below the text" in the component test lands on line 2 of a three-line file.
6. **PTY mouse-off click.** With `mouse = false`, the SGR bytes written to the PTY are read and dropped (no stray keys reach vim); the test proves this by typing `l` afterwards and waiting for `1:2`.

No unresolved implementation or verification issue remains. Chrome and overlay sources, and the full source order, belong to `P2-G2`.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/reports/p2-g1-verification-report.md` (commit `9d642dd`, status `Failed`, one Minor finding)
- **Status:** `Completed`

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G1-VER1` | `test/ui/mouse.test.ts` adds "a drag past the text rows of a long buffer moves one line beyond the window". The shell is 40×12 with a 60-line buffer. Case 1: press on line 2, drag through the text, then drag to the cmdline row (y 11). It asserts `visual`, anchor `{1,0}`, and a cursor line one past the last visible line. Case 2: from line 40 (`40G`), drag up to the bufferline (y 0). It asserts a top visible line above 0 and a cursor line one before it. The test sends events with `pressDown` + `emitMouseEvent("drag")` + `release` and reads the visible lines just before the edge event. The mock `drag` sends five in-between events, and those move the view's `topLine` (a cursor that moves back inside the rows from `40G` lets the top return to the stored scroll), so a frame read before the drag starts would be stale. Proof: `bun test test/ui/mouse.test.ts` → 6 pass, 0 fail, 36 expect() calls. With `edge` temporarily forced to `0` in `EditorView.dragAt` → 1 fail (`Expected: 9, Received: 8`). With only the upward edge forced to `0` → 1 fail (`Expected: 29, Received: 30`). `git checkout -- src/ui/editors/text-view.ts` restored the file both times, and `git status` showed only the test file changed | `b32c9c5` | `Fixed` |

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. All five tasks are implemented and verified, and `P2-G1-VER1` is fixed
- **Final report commit:** Returned to the orchestrator; not self-referenced
- **Final commits:** `7e4fa01`, `cbaf500`, `15cb104`, `8d4bc80`, `18f9966`, `b32c9c5`
- **Final checks:** `bun test test/ui/mouse.test.ts` → 6 pass, 0 fail. `bun run check` → exit 0 (biome 313 files clean, tsc clean, knip clean, 1050 pass, 0 fail). `bun run test:ci` → exit 0 (199 pass, 0 fail, 58 snapshots). Work-ID scan over code files changed since `184d3bc` (`.s1mple/` excluded) → no matches (exit 1). `pgrep -fl 'src/app/main.ts|bun run dev'` before and after → no processes (exit 1)
- **Remaining issues:** None
