# P2-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-goal.md`
- **Plan Part:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-plan-2-ui-mouse-routing.md`
- **Group:** `P2-G2`
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`
- **Report:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/reports/p2-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G2-T1` | `src/ui/views/bufferline.ts:Bufferline.tabs,targetAt` (tab ranges recorded while `renderSelf` paints each tab); `src/ui/views/explorer.ts:ExplorerView.paths,targetAt`; `src/ui/views/side-panel.ts:SidePanelView.x0,targetAt`; `src/ui/views/statusline.ts:Statusline.targetAt`; `src/ui/views/cmdline.ts:CommandLine.list,targetAt,paintList` (completion float's lines and box moved from paint into `update`, paint output unchanged); `src/ui/shell.ts` (`sources: [cmdline, statusline, side, explorer, bufferline, windows]`); `test/ui/mouse.test.ts` (two cases) | RED: `bun test test/ui/mouse.test.ts` → new bufferline/explorer case failed (`Expected: "a.md"`, `Received: "b.md"`). GREEN: same → 8 pass, 0 fail. Mutation: with `side` removed from `sources`, the outline case fails (1 fail). `bun test test/ui` → 129 pass, 0 fail, 58 snapshots. `bun run check` → exit 0 (1050 pass) | `dc9becd79527b48f2eaaf02dc9697135a674a954` | `Completed` |
| `P2-G2-T2` | `src/ui/overlays/host.ts:OverlayView,OverlayHost.open,targetAt`; `src/ui/overlays/picker.ts:PickerView.list,itemAt` (painted item rows recorded in `paintList`, cleared when hidden and at the start of each paint); `src/ui/overlays/completion.ts:CompletionView.first,itemAt` (`first` moved from paint into `update`); `src/ui/overlays/calendar.ts:CalendarOverlay.itemAt` (inverse of `cellOf`); `src/ui/shell.ts` (`overlays` first in `sources`); `test/ui/mouse.test.ts` (three cases) | RED: `bun test test/ui/mouse.test.ts` → new picker/toast case failed at the picker-row click (`toContainEqual` of the `read` effect). GREEN: same → 11 pass, 0 fail. Mutation: `Math.floor(dx / CELL)` → `dx / 3` in `CalendarOverlay.itemAt` fails the calendar case. `bun test test/ui` → 132 pass, 0 fail. `bun run check` → exit 0. `rg 'kind: "scroll"\|onMouseScroll' src` → no matches (exit 1) | `3be97c7b57f9c3d4e209ea06c15099b6040f386e` | `Completed` |

### Group Change Range

- **Starting commit:** `cbf6446` (clean working tree, no staged or unstaged changes)
- **Final commit:** `3be97c7b57f9c3d4e209ea06c15099b6040f386e`
- **Remaining group changes:** None

### Group Verification

- `bun test test/ui/mouse.test.ts` (V16, V18, V3 integration, plus G1 cases) → `Passed` — 11 pass, 0 fail, 61 expect() calls
- `bun run check` (V29, V30) → `Passed` — exit 0; biome 313 files clean, tsc clean, knip clean, 1050 pass, 0 fail
- `bun run test:ci` → `Passed` — exit 0; 204 pass, 0 fail, 58 snapshots (shell goldens unchanged)
- `rg 'kind: "scroll"|onMouseScroll' src` (V31) → `Passed` — no matches (exit 1)
- `git diff --name-only cbf6446..HEAD | xargs rg -n 'W261005H4XZ|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P2-G2'` → `Passed` — no matches (exit 1); run before the report commit, so only code and test files are in the range
- `rg -n '@opentui' src/core` → `Passed` — no matches (exit 1)
- `pgrep -fl 'src/app/main.ts|bun run dev'` before and after → `Passed` — no processes (exit 1); this group started no long-running processes

### Deviations and Remaining Issues

1. **Prompt, conflict, and which-key are `outside` everywhere.** Design §7 says the host computes their boxes with `centered` and their constants, "or treats any cell as `outside` when the child exposes no `itemAt`". The boxes cannot be computed from constants alone. The prompt's height depends on its wrapped lines (`PromptView.box`). The which-key float is not centred: it is full width above the statusline, and its height depends on the registry's rows. `whichkey.ts`, `prompt.ts`, and `conflict.ts` are out of scope. So the host uses the design's fallback. The only behavior difference is with which-key: a click inside its float closes it, as a click outside does. The core ignores every mouse event while a prompt or conflict is open, so those two behave the same either way. No body target is produced while any overlay except completion is open.
2. **Extra component cases beyond the plan's previews.** `test/ui/mouse.test.ts` adds an outline side-panel case (a heading click jumps there, and a title click focuses only), a calendar case (a day click opens its note, and a header click keeps the float open), and a completion case (a row click accepts it, and a body click closes it with the cursor moved). Without these, three new sources would have no test.
3. **Kept geometry choices.**
   - Answered from state kept at `update`: explorer, side panel, statusline, cmdline, completion, calendar, and the host.
   - Answered from geometry recorded while painting: bufferline tabs and picker rows, as the design's "kept in `renderSelf`" and "from `paintList`" say.
   - The picker's float box comes from `boxOf(s)`, so a click inside the float is `overlay` even before the first list paint.
   - OpenTUI's `width`/`height` getters return layout values that lag a frame, so no `targetAt` reads them. `top` and `left` return the set position.
4. **Precise inert areas.**
   - `CommandLine.targetAt` answers `inert` on the last row and inside the completion float only, not across its whole renderable. A click beside the float still reaches the core, which closes the open command line.
   - In the side panel, the separator column and the title, heading, blank, and hint lines give `row: -1`.
   - In the explorer, the title row, the float border, the separator, the empty rows, the name-field row, and the rename note line give `path: ""`.
5. **The picker toast check passed before this group.** In the V18 case, the "click under a toast reaches the window" half also passed before T2: `ToastStack` was never a source, and the window answered. The RED failure came from the picker-row half. The new completion case does discriminate: the host returning `outside` for completion, or the overlays source missing, fails it.

No unresolved implementation or verification issue remains.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/reports/p2-g2-verification-report.md` (commit `a6bda04`, status `Failed`)
- **Status:** `Completed`

The orchestrator kept the approved requirements as written and authorized `src/ui/overlays/whichkey.ts`, `src/ui/overlays/notify.ts`, `src/ui/mouse.ts`, and `src/ui/shell.ts` as a file-scope extension so the code meets REQ2 and REQ7.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G2-VER1` | **Change:** `src/ui/overlays/whichkey.ts:WhichKeyView.shown,itemAt,layout`. The float's rows, box, and column layout are computed in `update` by `layout` (the formula `renderSelf` used before), and `renderSelf` paints from them. `itemAt` returns `{kind:"overlay"}` inside the box, so `OverlayHost.targetAt` answers `overlay` inside the float and `outside` beyond it. Prompt and conflict keep the every-cell `outside` fallback. No core change was needed: `overlayGate` passes an `overlay` press through to `pressChrome`, whose default returns the state unchanged, and `wheelOverlay` returns `none` for which-key. **Proof:** `src/core/state/mouse.test.ts` "which-key ignores clicks and the wheel inside it and closes on a click outside" (single and double `overlay` presses and vertical and horizontal `overlay` wheels leave the state equal and emit no effects; `outside` and a body press equal `<Esc>`). `test/ui/mouse.test.ts` "clicks and the wheel inside which-key do nothing and a click outside closes it" (a click and a wheel-down on the `e → ` entry keep the overlay, pending keys, explorer, scroll 0, and cursor; a body click closes it). RED: with `whichkey.ts` stashed, the component case fails (`Expected - 10, Received + 1` on the overlay). GREEN: passes. Shell snapshots unchanged | `a20ac036d96a6ba358cd9bba1fb0b109a149236f` | `Fixed` |
| `P2-G2-VER2` | **Change:** `src/ui/mouse.ts:MouseSource.wheelOnly,createMouseRouter` (a press skips sources marked `wheelOnly`; a scroll consults every source in order). `src/ui/overlays/notify.ts:ToastStack.wheelOnly,shown,targetAt`: the toast boxes and the `+N more` row are laid out in `update` and painted from there; `targetAt` returns `{kind:"inert"}` over them and `undefined` elsewhere or while hidden. `src/ui/shell.ts`: `toasts` sits in `sources` right after `overlays`, matching the paint order (toasts zIndex 40 under overlays at 50). The core's `wheel` on `inert` is `none`. **Proof:** `src/ui/mouse.test.ts` "a wheel-only source answers the wheel and lets presses through". `test/ui/mouse.test.ts` "the wheel over a toast does nothing and a click there reaches the window" (wheel-down on a toast cell keeps scroll 0; beside it scroll goes to 3; after `gg`, a click on the toast cell moves the cursor to the line beneath). RED: with the three source files stashed, `Expected: 0, Received: 3`. GREEN: passes. Shell snapshots unchanged | `caab0e2e314ce980ccaf4f672e3abc28832e1c98` | `Fixed` |
| `P2-G2-VER3` | **Change:** `test/ui/mouse.test.ts`, three cases. "with the command line open its row, the status row, and its completions take no click": after `:wr`, clicks on row 23 (command), row 22 (status), and the `:write` completion row keep `vim.mode === "cmdline"` and the typed line; a body click returns to `normal`. "the bufferline scroll markers take no click": eight buffers at 60 columns with the fourth active show `‹` and `›`; clicking either keeps the active buffer. "a side panel hidden on a narrow terminal does not catch clicks": outline opened at 120 columns, resized to 99 (narrow), a click at column 90 (inside the old docked area from column 83) leaves the panel unfocused and moves the window cursor. **Mutations:** `CommandLine.targetAt` without the `rows - 1` clause fails the command-line case; bufferline tabs widened by one cell to cover the markers fail the marker case; `SidePanelView.targetAt` without the `visible` check fails the side-panel case. Every other source stops above the status row, so on the command row `inert` and `undefined` dispatch differently but change nothing observable; the command-line case therefore also asserts `CommandLine.targetAt` directly (row and float `inert`, a cell beside the float `undefined`). That direct assertion is what kills the `rows - 1` mutation | `715e04809f1dc9c8db0c889216a78673e69c9dfe` | `Fixed` |

**Remediation deviations:**

1. **File scope.** `whichkey.ts`, `notify.ts`, `mouse.ts`, and `shell.ts` changed beyond the plan's file list, as the orchestrator authorized.
2. **Toast routing shape.** The design says `ToastStack` is not a mouse source. It is now a source marked `wheelOnly` in the one `sources` list, instead of a separate `wheelSources` list consulted before the others. This is smaller and keeps the z-order in one place. A separate list consulted first would let a toast beat the overlay host, which paints above it. Clicks still pass through toasts, and the router stays the single entry point.
3. **Core unchanged.** VER1 noted that an `overlay` wheel routes to `wheelOverlay`. That function already returns `none` for which-key, so no guard was added. The new core test proves it.
4. **The command-line test reads the view directly.** See the VER3 row. A purely behavioral test cannot tell `inert` from `undefined` on the command row, because no source lies beneath it.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. All three verification findings are fixed, and every group check passes
- **Final report commit:** Returned to the orchestrator; not self-referenced
- **Final commits:** `dc9becd`, `3be97c7`, `a20ac03`, `caab0e2`, `715e048`
- **Final checks:**
  - `bun test test/ui/mouse.test.ts` → 16 pass, 0 fail, 94 expect() calls
  - `bun test src/ui/mouse.test.ts` → 7 pass, 0 fail
  - `bun run check` → exit 0; biome clean, tsc clean, knip clean, 1052 pass, 0 fail, 18 snapshots
  - `bun run test:ci` → exit 0; 209 pass, 0 fail, 58 snapshots, unchanged
  - `rg 'kind: "scroll"|onMouseScroll' src` (V31) → no matches (exit 1)
  - `git diff --name-only cbf6446..HEAD -- src test | xargs rg -n 'W261005H4XZ|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P2-G2'` → no matches (exit 1). The scan is limited to `src` and `test` because the range also holds the two report commits
  - `rg -n '@opentui' src/core` → no matches (exit 1)
  - `pgrep -fl 'src/app/main.ts|bun run dev'` before and after → no processes (exit 1); remediation started no long-running processes
- **Remaining issues:** None. The design text that calls `ToastStack` "not a mouse source" and says the which-key box comes from `centered` no longer matches the code. The requirements govern, and the design text was left unrevised per the orchestrator's decision
