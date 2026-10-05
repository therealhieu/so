# P2-G2 Verification Report

## Scope

- **Group:** `P2-G2`
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`
- **Report:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/reports/p2-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/reports/p2-g2-implementation-report.md`

## Status

`Failed`

Both tasks are implemented. Every assigned `V` case and group check passes. The source order matches design §5, and no paint output changed. Two requirement mismatches stay open:

- A click inside the which-key float closes it. REQ7 says that click does nothing (P2-G2-VER1).
- A wheel notch over a toast scrolls the window under it. REQ2 says it does nothing (P2-G2-VER2).

Both follow from wording in the approved design and plan, so closing them needs either a code change or an approved requirement revision. One minor test-coverage gap is also open (P2-G2-VER3).

## Assigned Traceability

- **System Design:** `REQ7@R1 → DES3 → S10 → V16`; `REQ7@R1, REQ8@R1 → DES2, DES3 → S1, S11, S12 → V3 (integration), V18`; `REQ1@R1 → DES2, DES3 → S1 → V30`; `REQ2@R2 → DES2, DES3 → S3` (chrome wheel targets); `V31` obsolete-reference check
- **UI Design:** None

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ7@R1 → DES3 → S10 → V16` | None | A bufferline tab click switches the buffer. An explorer folder click expands it, and a file click opens it. The `‹ ›` markers and other row-0 cells are inert | `src/ui/views/bufferline.ts:Bufferline.targetAt`: `tabs` is reset at the start of `renderSelf`, and each painted tab pushes `{x0, x1, bufferId}`. Other row-0 cells (the markers and the workspace root) → `inert`. `src/ui/views/explorer.ts:ExplorerView.targetAt`: `paths` and `first` are kept in `update`. List row `y - (1 + box.y + 1)` matches the paint row `y0 + 1 + i`. The title, separator, float border, empty rows, and name-field or note rows → `path: ""`. Hidden → `undefined` | `Satisfied` |
| `REQ7@R1 → DES3 → S10` (side panel) | None | A list line click selects and activates it. Other panel cells only focus. Hidden → `undefined` | `src/ui/views/side-panel.ts:SidePanelView.targetAt`: `x0`, `h`, `lines`, and `first` are kept in `update`. Row `y - 2` matches the paint row `this.y + 1 + i` (top 1). The separator, title, heading, blank, and hint lines → `row: -1`. `visible` is false when not docked (narrow), so it returns `undefined` | `Satisfied` |
| `REQ7@R1 → DES3 → S10` (statusline, command line) | None | The status and command rows, including the command-line completion float, are inert | `src/ui/views/statusline.ts:Statusline.targetAt` → `inert` on row `rows - 2`. `src/ui/views/cmdline.ts:CommandLine.targetAt` → `inert` on row `rows - 1` and inside `list` (`top`, `w`, `h` computed in `update` with the formula `paintList` used before). A cell beside the float returns `undefined`, so a click there reaches the core and closes the open line (REQ8). A one-off probe confirmed this: clicks on the command row, the status row, and the float kept `cmdline` mode, and a body click returned to `normal` | `Satisfied` |
| `REQ7@R1, REQ8@R1 → DES2, DES3 → S1, S11, S12 → V3, V18` (picker, calendar, completion) | None | A picker row click accepts that item, a calendar day click opens it, and a completion row click accepts it. A cell inside a float with no item → `overlay`. Outside → `outside`, except completion → `undefined` | `src/ui/overlays/host.ts:OverlayHost.targetAt`: `open === "none"` → `undefined`. Otherwise the first visible child's `itemAt`, then `completion ? undefined : {kind:"outside"}`. `src/ui/overlays/picker.ts:PickerView.itemAt`: `boxOf(s)` box, and the item rows recorded in `paintList` (`list` is cleared at paint start and when the picker closes). `src/ui/overlays/calendar.ts:CalendarOverlay.itemAt`: the inverse of `cellOf` (`box.x + 2 + col × CELL`, `box.y + 2 + row`), so header and spare cells → `overlay`. `src/ui/overlays/completion.ts:CompletionView.itemAt`: `box` and `first` from `update` (same formula as paint), rows `box.y + 1 … + room` | `Satisfied` |
| `REQ7@R1, REQ8@R1 → DES3 → S11, S12` (which-key) | None | A click inside which-key does nothing (REQ7). A click outside closes it (REQ8). The plan's T2 outcome gives the which-key box from `centered` | `OverlayHost.targetAt` returns `outside` for every cell while which-key is open (`WhichKeyView` has no `itemAt`), so the core's `overlayGate` feeds `<Esc>`. A one-off probe clicked the `e → Toggle explorer` entry inside the float, and the overlay went from `whichKey` to `none` | `Mismatch` (P2-G2-VER1) |
| `REQ8@R1 → DES3 → S12` (prompt, conflict) | None | No body target while a prompt or conflict is open. Every mouse event does nothing | The host returns `outside` everywhere for both. `src/core/state/mouse.ts:overlayGate` returns `none(s)` for any event while a prompt or conflict is open. The invariant "no body target while any overlay except completion is open" holds | `Satisfied` |
| `REQ7@R1 → DES2, DES3 → S11` (toast click) | None | A click under a toast reaches the window. `ToastStack` is not a source | `src/ui/shell.ts`: `ToastStack` is absent from `sources`. The V18 component case clicks a toast cell, and the window cursor moves | `Satisfied` |
| `REQ2@R2 → DES2, DES3 → S3` (chrome wheel targets) | None | Wheel does nothing over the statusline, command line, bufferline, prompt, conflict, which-key, and toast | Statusline, command line, and bufferline → `inert` → `wheel` `default: none`. Prompt and conflict → gate `none`. Which-key → `outside` → `none`. Toast → not a source, so the window beneath answers. A one-off probe sent a wheel-down over a toast cell, and the window scroll went from 0 to 3 | `Mismatch` (toast only: P2-G2-VER2) |
| `DES2` source order | None | `[overlays, cmdline, statusline, side, explorer, bufferline, windows]` | `src/ui/shell.ts:createShell().attach`: `sources` matches design §5 exactly | `Satisfied` |
| `REQ1@R1 → DES2, DES3 → S1 → V30` | None | `bun run check` exits 0 with the complete wiring | See Technical Verification | `Satisfied` |

Each recorded deviation in the implementation report, checked against the requirements and design as written:

1. **Prompt, conflict, and which-key are `outside` everywhere.** The implementer's facts are correct. `WhichKeyView` paints a full-width float above the statusline, sized from `whichKeyRows(s, reg)` (`src/ui/overlays/whichkey.ts:40-48`). `PromptView.box` sizes itself from wrapped lines. So the plan's "boxes come from `centered` with their constants" cannot be done, and system design line 445 ("which the host already computes with `centered`") is wrong. For prompt and conflict the fallback has no visible effect, because the core ignores both. For which-key it breaks REQ7's "which-key: Nothing" row. The design's "or treats any cell as `outside`" fallback does not override the requirement. See P2-G2-VER1.
2. **Extra component cases.** These add outline, calendar, and completion coverage, all within the group's scope. Accepted.
3. **Kept geometry choices.** Every `targetAt`/`itemAt` reads state kept at `update`, or geometry recorded in `renderSelf`/`paintList`, as design §7 names for bufferline and picker. No method reads OpenTUI's `width`/`height` getters. Explorer and calendar read `top` constants set in the constructor, which is consistent with the `MouseSource` invariant. Accepted.
4. **Precise inert areas.** `CommandLine` marks only its painted cells inert, so a click beside its completion float still closes the open line, as REQ8 requires. The side panel and explorer focus-only cells match design §7. Accepted.
5. **The toast half of V18 passed before T2.** This is accurate: `ToastStack` has never been a source. The completion case discriminates the host's completion rule. Accepted.

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V16`, `V18`, `V3` (integration), plus the G1 cases | `S1`, `S3`, `S10`, `S11`, `S12` | `DES2`, `DES3` | `bun test test/ui/mouse.test.ts` | 11 pass, 0 fail, 61 expect() calls | `Passed` |
| Fast gate (`V29`, `V30`) | `S1`, `S2` | None | `bun run check` | exit 0. Biome checked 313 files with no fixes. tsc and knip clean. 1050 pass, 0 fail, 18 snapshots | `Passed` |
| Full suites | None | None | `bun run test:ci` | exit 0. 204 pass, 0 fail, 58 snapshots | `Passed` |
| Obsolete reference (`V31`) | `S1` | None | `rg 'kind: "scroll"\|onMouseScroll' src` | no matches (exit 1) | `Passed` |
| Work-ID scan | None | None | `git diff --name-only cbf6446..3be97c7 \| xargs rg -n 'W261005H4XZ\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P2-G2'` | no matches (exit 1). Test names are in domain terms | `Passed` |
| Core boundary | None | `DES1` | `rg -n '@opentui' src/core` | no matches (exit 1) | `Passed` |
| Process cleanup | None | None | `pgrep -fl 'src/app/main.ts\|bun run dev'` before and after all runs | no processes (exit 1) each time | `Passed` |
| No paint output changes | None | `DES3` | `git diff --stat cbf6446..3be97c7` plus inspection of the `cmdline.ts` and `completion.ts` refactors | No snapshot file changed, and the 58 snapshots pass. The `CommandLine.list` `w`/`h` and `CompletionView.first` use the same formulas they used in paint | `Passed` |
| Hidden views → `undefined` | `S10`, `S11` | `DES3` | Inspection | Explorer and side panel check `visible`. Picker and completion check `visible`. Calendar checks `calendarOf(s)`. The host checks `open === "none"`. Bufferline, statusline, and command line are never hidden | `Passed` |
| Kept geometry matches what is painted | `S10`, `S11` | `DES3` | Inspection of each `targetAt`/`itemAt` against its `renderSelf` | Row and column origins match the paint code in all eight views (see Specification Verification) | `Passed` |
| Which-key inside click | `S12` | `DES3` | One-off probe in `test/ui` (deleted afterwards; working tree clean): open `<leader>` which-key, click an entry inside the float | overlay `whichKey` → `none` | `Failed` (P2-G2-VER1) |
| Wheel over a toast | `S3` | `DES2`, `DES3` | Same probe file: show a trash-failure toast over a 60-line buffer, wheel down on a toast cell | window scroll 0 → 3 | `Failed` (P2-G2-VER2) |
| Command and status rows inert while `:` is open | `S10`, `S12` | `DES3` | Same probe file: `:wr`, then click the command row, the status row, the completion float, and the body | mode `cmdline`, `cmdline`, `cmdline`, then `normal` | `Passed` (not covered by a committed test: P2-G2-VER3) |
| Every new method used | None | None | `knip` within `bun run check` | clean | `Passed` |

## Findings

### P2-G2-VER1 — Major — Specification — A click inside which-key closes it

- **System Design:** `REQ7@R1`, `REQ8@R1`, `REQ2@R2`; `DES3`; `S12`, `S3`; `V18`
- **UI Design:** None
- **Evidence:** REQ7's table says "Statusline, command line, which-key, bufferline `‹ ›` markers: Nothing". REQ8 says which-key closes only on a click outside it. The plan's P2-G2-T2 outcome says the which-key box comes from `centered`. `src/ui/overlays/host.ts:OverlayHost.targetAt` instead returns `{kind:"outside"}` for every cell while which-key is open, because `WhichKeyView` has no `itemAt`. `overlayGate` then feeds `<Esc>`. A probe clicked inside the float on the `e → Toggle explorer` entry, and the overlay changed from `whichKey` to `none`. The planned approach cannot work as written: the which-key float is full width above the statusline, and its height comes from `whichKeyRows(s, reg)` (`src/ui/overlays/whichkey.ts:40-48`), not from `centered`.
- **Impact:** Clicking inside the which-key popup, for example on an entry the user is reading, dismisses it and clears the pending prefix. REQ7 requires that click to do nothing.
- **Required resolution:** A press inside the painted which-key float leaves the state unchanged, and a press outside it still closes it. The wheel inside the float must stay a no-op (REQ2). Note that an `overlay` target currently routes the wheel to `wheelOverlay`, which feeds `<Down>`/`<Up>`, so that path needs a guard. This needs `whichkey.ts` (scoped out by the plan) to expose its painted box, for example an `itemAt` that returns `{kind:"overlay"}` from the box recorded in `renderSelf`. Alternatively, an approved REQ7/design revision can make an inside click close which-key. Either path needs the user's approval, because it changes the plan's scope or the requirement.
- **Required proof:** A component case in `test/ui/mouse.test.ts`: with which-key open, a click and a wheel notch on an entry inside the float leave `overlay.kind === "whichKey"` and the state unchanged, and a click on the body closes it. Alternatively, the approved revision recorded in the requirements and design.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER2 — Major — Specification — A wheel notch over a toast scrolls the window beneath

- **System Design:** `REQ2@R2`, `REQ7@R1`; `DES2`, `DES3`; `S3`, `S11`; `V3`
- **UI Design:** None
- **Evidence:** REQ2's table lists "toast" under "Nothing | Nothing" for the vertical and horizontal wheel. The design (§2 architecture, §5 wiring, line 445, `V3`) and the plan's T2 outcome make `ToastStack` "not a mouse source" for every event. `src/ui/shell.ts` follows that, so the window beneath answers. A probe sent a wheel-down on a toast cell, and the window scroll went from 0 to 3. The implementation matches the design and plan. The mismatch is between the design and REQ2 as written. REQ7's "click passes through" covers only clicks.
- **Impact:** The wheel over a toast scrolls the editor under it, which REQ2 forbids. The risk is low (toasts are transient), but the delivered behavior does not match the approved requirement.
- **Required resolution:** Either a wheel notch over a visible toast's painted cells changes nothing while clicks still pass through, or the user approves a REQ2 revision (and the matching design text) that says the wheel also passes through toasts.
- **Required proof:** A component case: with a toast shown, a wheel-down over a toast cell leaves the window scroll unchanged, and a click on the same cell still reaches the window. Alternatively, the approved REQ2 revision recorded in the requirements and design.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER3 — Minor — Test Coverage — Inert command and status rows and hidden side panel are unproven

- **System Design:** `REQ7@R1`, `REQ8@R1`; `DES3`; `S10`, `S12`; `V16`
- **UI Design:** None
- **Evidence:** The group's review focus lists "Bufferline markers and the status and command rows are inert" and "Hidden views return `undefined`". `test/ui/mouse.test.ts` covers only the bufferline's workspace-root cell. No committed case clicks the status row, the command row, or the command-line completion float while `:` is open. None clicks the `‹`/`›` markers or the area of a side panel hidden on a narrow terminal. If `CommandLine.targetAt` returned `undefined` on its row, a click there would close the open command line, and no test would fail. A probe showed the current behavior is correct.
- **Impact:** A regression in these targets, such as a click on the command row dismissing `:`, would pass every suite.
- **Required resolution:** Component cases assert that, while `:` is open, clicks on the command row, the status row, and the completion float keep `vim.mode === "cmdline"`. A click on a bufferline marker leaves the active buffer unchanged. On a narrow terminal with the side panel open, a click where the docked panel would sit reaches the window.
- **Required proof:** `bun test test/ui/mouse.test.ts` passes with those assertions. A mutation that makes `CommandLine.targetAt` return `undefined` on `rows - 1` fails it.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - Bufferline tab switch, and the inert workspace-root cell.
  - Explorer folder expand and file open (`read` effect).
  - Outline heading jump, and a title click that only focuses.
  - Picker outside press closes the picker and leaves the cursor in place. A picker row click accepts that row (`read` effect).
  - Click under a toast reaches the window.
  - Calendar day click opens its note. A header click keeps the float open.
  - Completion row click accepts the row. A body click closes completion and moves the cursor.
  - G1 router, window, and Bases cases still pass. The core gate (V19, V24) is covered by `src/core/state/mouse.test.ts` in `bun run check`.
- **Missing:**
  - A which-key inside click and wheel (P2-G2-VER1).
  - A toast wheel no-op (P2-G2-VER2).
  - Command and status rows and the completion float inert while `:` is open, bufferline `‹ ›` markers, and the hidden narrow side panel (P2-G2-VER3).

## Scope Changes

None. The extra outline, calendar, and completion component cases are within the group's declared scope (component cases for chrome and overlays). The which-key fallback is a recorded deviation, assessed in P2-G2-VER1.

## Unverified Items

None

## Blockers

None
