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

- **Verification reports:** Not yet verified
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — both tasks are implemented and every group check passes
- **Final report commit:** Returned to the orchestrator; not self-referenced
- **Final commits:** `dc9becd`, `3be97c7`
- **Final checks:** `bun test test/ui/mouse.test.ts` → 11 pass, 0 fail. `bun run check` → exit 0 (1050 pass). `bun run test:ci` → exit 0 (204 pass, 0 fail, 58 snapshots). V31 scan → no matches. Work-ID scan from `cbf6446` → no matches. `pgrep` → no processes
- **Remaining issues:** None
