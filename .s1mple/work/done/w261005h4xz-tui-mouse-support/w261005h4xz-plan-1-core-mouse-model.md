# W261005H4XZ Plan Part 1 — core-mouse-model

## Status

`Ready`

## Objective

The pure core accepts the model-level mouse contract and turns every gesture into its keyboard path. After this part, `update({type:"mouse", event, now})` places the cursor, selects, follows links, focuses, scrolls the surface named by the target, activates chrome, Bases, and overlay items, and applies the overlay gate, all proven by reducer unit tests. Span source columns and `rowAt`/`sourceColAt` map display cells to source columns, and the `mouse` config key validates with default `true`.

The UI does not dispatch the new events yet. The old `EditorView.onMouseScroll` producer is removed here so `tsc` stays green; Part 2 restores wheel scrolling through the router. Both parts ship together in PR #8.

## Coverage Summary

- **System Design:** `W261005H4XZ-REQ1@R1`, `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ3@R1`–`W261005H4XZ-REQ9@R1`; `W261005H4XZ-DES1`, `W261005H4XZ-DES4`, `W261005H4XZ-DES5`, `W261005H4XZ-DES6` (schema); `S1`–`S12`, `S13` (config); `V1`, `V4`–`V12`, `V14`, `V15`, `V17`, `V19`, `V24`, `V27`, `V29`, `V31`
- **UI Design:** None

## Sources

- Plan index: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-index.md`
- Plan context: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-context.md`
- System design: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-system-design.md`
- UI design: Not applicable — no UI design for this work; the system design is the sole authority
- System requirements: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-requirements.md`
- UI requirements: Not applicable — no UI requirements document for this work

## Dependencies

- None

## Execution Flow

```text
P1-G1: core mouse model
```

## Groups

### P1-G1 — core-mouse-model

#### Goal

Every gesture in the `MouseEvent` contract yields the same state and effects as its keyboard equivalent from the same start state, the overlay gate and focus rules hold, cells map to exact source columns, and `mouse` is a validated config key. `bun run check` passes with zero knip findings and no remaining `kind: "scroll"` or `onMouseScroll` in `src`.

#### Coverage Summary

- **System Design:** `REQ1@R1`–`REQ9@R1` (REQ2@R2); `DES1`, `DES4`, `DES5`, `DES6` (schema); `S1`–`S13`; `V1`, `V4`–`V12`, `V14`, `V15`, `V17`, `V19`, `V24`, `V27`, `V29`, `V31`
- **UI Design:** None

#### Scope

- Included:
  - The mouse contract types and `Action` `now`.
  - Span `col`/`inserted` and `hit.ts`.
  - The `mouse` config key.
  - `src/core/state/mouse.ts` with `onMouse` and its helpers, wired into `update`.
  - Thin exported reducers for Bases, picker, and calendar.
  - Removal of `EditorView.onMouseScroll` and its now-unused `SCROLL_LINES` constant.
  - Plan-context gaps 2 (calendar day wrapper), 3 (completion wheel clamps), and 4 (completion click and body-press close).
- Excluded:
  - Router, `MouseLayer`, shell wiring, `renderer.useMouse` sync, and every view `targetAt`/`dragAt`/`itemAt` (Part 2).
  - Component and PTY tests (Part 2).
  - Hover and any-motion tracking, horizontal editor scroll, separator drag, drag-and-drop, right/middle-click behavior.
- Main files: `src/core/state/{types,update,mouse,mouse.test,base-commands,picker,calendar}.ts`, `src/core/kernel/view/{types,text-view,hit,hit.test}.ts`, `src/core/config/{schema,schema.test}.ts`, `src/ui/editors/text-view.ts` (handler removal only)

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1@R1 → DES1, DES5 → S1, S2 → V1, V29, V31` | None | Gestures equal their keys; `MouseEvent` has no button field; the old scroll path is gone |
| `REQ2@R2 → DES5 → S3 → V1, V4, V5, V6` | None | Wheel acts on the targeted window, explorer, side panel, Base, or list; focus and mode unchanged; completion clamps |
| `REQ3@R1 → DES5 → S4 → V7` | None | Press focuses the targeted window, explorer, or side panel |
| `REQ4@R1 → DES4, DES5 → S5, S6 → V8, V9, V10, V11` | None | Display column → source column; Insert click splits undo; Visual and pending reset |
| `REQ5@R1 → DES5 → S7, S8 → V12, V14` | None | Drag yields charwise Visual anchored at the press; 2/3 clicks equal `viw`/`V` |
| `REQ6@R1 → DES5 → S9 → V15` | None | Ctrl press on a link equals cursor there + `gd` |
| `REQ7@R1 → DES5 → S10, S11 → V1, V17` | None | Chrome, Bases, picker, completion, and calendar presses equal their keys; Bases single = focus, double = open |
| `REQ8@R1 → DES5 → S12 → V19, V24` | None | Prompt/conflict ignore the mouse; outside press closes dismissible overlays and the command line; completion yields |
| `REQ9@R1 → DES6 → S13 → V27` | None | `mouse` defaults to `true`; a wrong type is a config error naming `mouse` |

#### Cross-Work Gates

None

#### Tasks

##### P1-G1-T1 — Span source columns and cell mapping

- **Outcome:** `spansOf` records `col` on verbatim runs and `col` + `inserted` on replacement spans; `rowAt` finds the rendered line and wrap start under a text row; `sourceColAt` returns the source column shown at a display column.
- **System Design:** `REQ4@R1`, `DES4`, `S5`, `V8`, `V9`, `V10`
- **UI Design:** None
- **Canonical Shapes:** System design §6 "`Span.col` / `Span.inserted`"; §7 `src/core/kernel/view/types.ts`, `src/core/kernel/view/text-view.ts`, `src/core/kernel/view/hit.ts`
- **Files:** `src/core/kernel/view/types.ts` — `Span`; `src/core/kernel/view/text-view.ts` — `spansOf`; `src/core/kernel/view/hit.ts` — `ScreenRow`, `rowAt`, `sourceColAt` (new); `src/core/kernel/view/hit.test.ts` (new)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V8`, `V9`, `V10`:** `src/core/kernel/view/hit.test.ts` — three behavior-named cases.

   **Preview:**

   ```ts
   import { expect, test } from "bun:test";
   import { rowAt, sourceColAt } from "./hit";
   // build RenderLines with layoutLine from ./text-view, as existing text-view tests do

   test("a click on a concealed link alias maps to the alias character in the source", () => {
     // layout "See [[Project Plan|plan]] now" with the alias-conceal decoration
     // dc = display column of the "l" in "plan"
     expect(sourceColAt(line.spans, dc, 4)).toBe("See [[Project Plan|".length + 1);
   });

   test("tabs map every covered cell to the tab and past-end cells to the line length", () => {
     // "\tab", tabWidth 4: dc 0..3 → 0, dc 4 → 1, dc 99 → 3
   });

   test("rowAt follows wrapped lines, widget rows, and skipped rows like the painter", () => {
     // second wrap row → same RenderLine, startCol = wrapLine(...)[1] start
     // widget row → its RenderLine; skipRows drops the first rows of a tall line
   });
   ```

   - Run `bun test src/core/kernel/view/hit.test.ts` and confirm failure because `./hit` does not exist.

2. **GREEN:** `src/core/kernel/view/types.ts`, `src/core/kernel/view/text-view.ts`, `src/core/kernel/view/hit.ts` — `Span.col`, `Span.inserted`, `spansOf`, `ScreenRow`, `rowAt`, `sourceColAt`

   **Preview:**

   ```ts
   // types.ts: add the two optional Span fields exactly as in system design §7.
   // text-view.ts spansOf: a new verbatim run at source column c starts as { text: "", style, col: c };
   //   inserted spans at column c are pushed as { ...sp, col: c, inserted: true }.
   //   Break the run at every hidden range or insert so col + i stays exact.

   // hit.ts (kernel-only imports: ./types, cellWidth, wrapLine)
   export type ScreenRow = { line: RenderLine; startCol: number };
   export function rowAt(lines, y, o): ScreenRow | undefined {
     // walk rows like the painter: widget → widget.rows; text → wrapLine(...).length when o.wrap;
     // drop o.skipRows first; past the end → last row
   }
   export function sourceColAt(spans, dc, tabWidth): number {
     // walk spans by cell width; verbatim → col + i, inserted → col, after the last cell → line length;
     // spans without col (highlighter or widget) → 0
   }
   ```

   - Keep `Span.col`/`inserted` optional so highlighters and painters are unaffected.
   - Keep `hit.ts` free of `@opentui/*` and `src/core/state` imports (`test/boundaries.test.ts`).

3. **REFACTOR:** Share the painter's row walk only if an existing helper already expresses it; do not restructure `layoutLine` or the painter.

   **Preview:**

   ```ts
   // allowed: extract a local helper inside hit.ts for "rows of one RenderLine"
   // prohibited: changing span text, styles, or layout output used by painting
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(view): map display cells to source columns

   Task: P1-G1-T1 — Span source columns and cell mapping
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V8`, `V9`, `V10` — `bun test src/core/kernel/view/hit.test.ts` → all pass
- Regression — `bun test src/core/kernel` → existing layout and paint tests pass unchanged
- knip — `bun run knip` → no findings (`hit.test.ts` consumes the new exports; knip's Bun plugin, enabled in this repo, treats colocated tests as entries; Part 2 adds the production consumer `EditorView`)

##### P1-G1-T2 — Mouse config key

- **Outcome:** `ConfigSchema` accepts `mouse` with default `true`; old config files parse unchanged; `mouse = "yes"` is a config error naming `mouse`.
- **System Design:** `REQ9@R1`, `DES6`, `S13`, `V27`
- **UI Design:** None
- **Canonical Shapes:** System design §6 "`AppConfig.mouse`"; §7 `src/core/config/schema.ts`
- **Files:** `src/core/config/schema.ts` — `ConfigSchema`; `src/core/config/schema.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V27`:** `src/core/config/schema.test.ts` — default and type cases.

   **Preview:**

   ```ts
   test("mouse defaults to on and rejects a non-boolean", () => {
     const r = parseConfig("");
     if (!r.ok) throw new Error("expected a parsed config");
     expect(r.config.mouse).toBe(true);
     expect(defaults.mouse).toBe(true);
     expect(errors('mouse = "yes"').some((e) => e.path?.includes("mouse") || e.message.includes("mouse"))).toBe(true);
     // match the ConfigError field the file's other error cases assert on
   });
   ```

   - Run `bun test src/core/config/schema.test.ts` and confirm failure on `mouse` being undefined or an unknown key.

2. **GREEN:** `src/core/config/schema.ts` — `ConfigSchema`

   **Preview:**

   ```ts
   // beside the other top-level fields
     mouse: z.boolean().default(true),
   ```

   - Keep the schema strict; `defaults` picks up the new default through the existing derivation.

3. **REFACTOR:** None expected.

   **Preview:**

   ```ts
   // no cleanup; do not reorder unrelated fields
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(config): add the mouse setting

   Task: P1-G1-T2 — Mouse config key
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V27` — `bun test src/core/config` → all pass, including the new case

##### P1-G1-T3 — Mouse contract and text gestures

- **Outcome:** `MouseTarget`, `WindowSpot`, and the press/drag/wheel `MouseEvent` replace the scroll-only event; `Action` `mouse` carries `now`; `update` calls `onMouse(state, action, reg)` from the new `src/core/state/mouse.ts`; presses focus their window, explorer, or side panel and place the cursor with the mode rules; drags, double and triple clicks, and Ctrl+click on links run their key paths. `EditorView.onMouseScroll` and `SCROLL_LINES` are gone.
- **System Design:** `REQ1@R1`, `REQ3@R1`, `REQ4@R1`, `REQ5@R1`, `REQ6@R1`; `DES1`, `DES5`; `S1`, `S2`, `S4`, `S6`, `S7`, `S8`, `S9`; `V7`, `V11`, `V12`, `V14`, `V15`, `V29`, `V31`
- **UI Design:** None
- **Canonical Shapes:** System design §5 "Press", "Drag"; §6 "`MouseTarget`", "`MouseEvent`"; §7 `src/core/state/types.ts`, `src/core/state/mouse.ts` (`onMouse`, `feedKeys`, `focusTarget`, `pressText`, `dragText`), `src/core/state/update.ts`, `src/ui/editors/text-view.ts` (`onMouseScroll` removal)
- **Files:** `src/core/state/types.ts` — `WindowSpot`, `MouseTarget`, `MouseEvent`, `Action`; `src/core/state/mouse.ts` (new) — `onMouse`, `feedKeys`, `focusTarget`, `pressText`, `dragText`; `src/core/state/mouse.test.ts` (new); `src/core/state/update.ts` — `update` mouse case, local `onMouse` removed; `src/ui/editors/text-view.ts` — constructor `onMouseScroll` assignment and `SCROLL_LINES` removed
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V7`, `V11`, `V12`, `V14`, `V15`, `V29`:** `src/core/state/mouse.test.ts` — reducer cases through `createUpdate(testRegistries())`.

   **Preview:**

   ```ts
   import { expect, test } from "bun:test";
   import { fresh, openBuffer, testRegistries } from "../../../test/support/state";
   import type { MouseEvent, MouseTarget } from "./types";
   import { createUpdate } from "./update";

   const reg = testRegistries();
   const update = createUpdate(reg);
   const NOW = 1_000;
   const mouse = (s: AppState, event: MouseEvent) => update(s, { type: "mouse", event, now: NOW });
   const keys = (s: AppState, ks: string[]) => /* fold update({type:"key", key, now: NOW}) */;
   const text = (window: WindowId, line: number, col: number): MouseTarget =>
     ({ kind: "window", window, spot: { kind: "text", pos: { line, col }, edge: 0 } });

   test("a press focuses the window, explorer, or side panel under it", () => {
     // inactive split → windows.active = that id; explorer press → panels.explorer.focused;
     // side-panel press → panels.side.focused; winbar press → active set, cursor unchanged
   });
   test("an Insert-mode click keeps Insert and starts a new undo step", () => {
     // i, type "ab", click elsewhere → mode insert; type "cd"; <Esc> u → only "cd" undone
   });
   test("dragging selects charwise from the press to the pointer", () => {
     // press (2,3), drag (4,1) → mode visual, visualAnchor (2,3), cursor (4,1); then "y" yanks that range
   });
   test("double and triple clicks equal viw and V", () => {
     // state after clicks: 2 equals keys "v","i","w" from the cursor placed there; clicks: 3 equals "V"
   });
   test("ctrl+click on a link follows it like gd", () => {
     // wikilink: result equals placing the cursor there then keys "g","d" (state and effects);
     // ctrl press on plain text equals a plain press
   });
   // type-level contract: MouseEvent has no button field
   // @ts-expect-error button is not part of the core mouse contract
   const _noButton: MouseEvent = { kind: "press", target: text(1, 0, 0), clicks: 1, ctrl: false, button: 2 };
   ```

   - Run `bun test src/core/state/mouse.test.ts` and confirm failure on the missing contract and reducer.

2. **GREEN:** `src/core/state/types.ts`, `src/core/state/mouse.ts`, `src/core/state/update.ts`, `src/ui/editors/text-view.ts` — contract, `onMouse` press/drag paths, wiring, producer removal

   **Preview:**

   ```ts
   // types.ts: replace MouseEvent and the Action mouse member; add WindowSpot and MouseTarget
   //   exactly as in system design §7 src/core/state/types.ts.

   // mouse.ts
   export function onMouse(s: AppState, a: { event: MouseEvent; now: number }, reg: Registries): Result {
     const e = a.event;
     // press: focusTarget, then by target: window text → pressText; other kinds → none for now
     // drag: window text target → dragText; else none
     // wheel: none for now (P1-G1-T4)
   }
   function feedKeys(r: Result, keys: readonly Key[], now: number, reg: Registries): Result {
     // fold handleKeyAction over keys, concatenating effects
   }
   function focusTarget(s: AppState, t: MouseTarget): AppState { /* windows.active / explorer.focused / side.focused */ }
   function pressText(r, pos, clicks, ctrl, now, reg): Result { /* control flow in system design §7 */ }
   function dragText(s, pos, edge, now, reg): Result { /* v when not in a Visual mode, then placeCursor(line + edge, col) */ }

   // update.ts
         case "mouse":
           return onMouse(state, action, reg);
   // delete the local onMouse and any import it alone used

   // text-view.ts: delete the this.onMouseScroll assignment and SCROLL_LINES
   ```

   - Stale targets (missing window id) return `none(s)` (system design §5 "Failure and Recovery Rules").
   - Insert click past the line end sets the cursor column to the line length after `i` (system design §7 `pressText`).
   - Keep the `ViewDeps.dispatch` member; other code may still use it.

3. **REFACTOR:** Tidy helper ordering and doc comments in `mouse.ts`.

   **Preview:**

   ```ts
   // allowed: short doc comments in domain terms on onMouse and helpers
   // prohibited: work-process ids in names, comments, or test names; new state fields
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(mouse): route text clicks and drags through keyboard actions

   Task: P1-G1-T3 — Mouse contract and text gestures
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V7`, `V11`, `V12`, `V14`, `V15` — `bun test src/core/state/mouse.test.ts` → all pass
- `V29` — `bun --bun run tsc --noEmit -p .` → exit 0, and the `@ts-expect-error` line stays required
- `V31` — `rg 'kind: "scroll"|onMouseScroll' src` → no matches
- Regression — `bun run check` → exit 0

##### P1-G1-T4 — Wheel under the pointer

- **Outcome:** `wheel` scrolls the targeted editor window by 3 lines (clamped) without moving the cursor, focus, or mode; ignores horizontal steps on editor text; moves the explorer cursor 3 visible paths; runs `j`/`k` ×3 on an inactive Base or side panel inside `withFocus`; applies `H`/`L` (table) or `h`/`l` (board) once for a horizontal step on a Base; moves overlay lists 3 items (`<Down>`/`<Up>`) and the calendar one step; completion moves at most to the list end.
- **System Design:** `REQ1@R1`, `REQ2@R2`; `DES5`; `S1`, `S3`; `V1` (wheel rows), `V4`, `V5`, `V6`
- **UI Design:** None
- **Canonical Shapes:** System design §5 "Wheel"; §7 `src/core/state/mouse.ts` (`wheel`, `withFocus`, `WHEEL_LINES`); plan context §7 gap 3
- **Files:** `src/core/state/mouse.ts` — `wheel`, `withFocus`, `WHEEL_LINES`; `src/core/state/mouse.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V1` (wheel rows), `V4`, `V5`, `V6`:** `src/core/state/mouse.test.ts`

   **Preview:**

   ```ts
   test("the wheel scrolls the window under the pointer, not the active one", () => {
     // vertical split; wheel dy +1 over the inactive window → its content.scroll +3;
     // windows.active and vim.mode unchanged; a dx-only wheel over it → state unchanged
   });
   test("the wheel moves the explorer list without focusing it", () => {
     // explorer.cursor moves 3 visible paths; explorer.focused stays false
   });
   test("the wheel moves the focus of an inactive Base without activating it", () => {
     // base focus index +3; windows.active unchanged
   });
   test.each([
     // [label, setup, mouse event, equivalent keys under the same focus]
     // side panel j×3, picker <Down>×3, calendar j, Base table H/L for dx
   ])("the wheel over %s equals its list keys", () => { /* compare state and effects */ });
   test("the wheel stops at the last completion item instead of wrapping", () => {
     // 4 items, selected 2 → wheel down → selected 3 (equals one <Down>), not wrapped
   });
   ```

   - Run `bun test src/core/state/mouse.test.ts` and confirm the new cases fail.

2. **GREEN:** `src/core/state/mouse.ts` — `wheel`, `withFocus`

   **Preview:**

   ```ts
   const WHEEL_LINES = 3;

   function withFocus(s: AppState, target: MouseTarget, run: (s: AppState) => Result): Result {
     // set windows.active / explorer.focused / side.focused for target, run, then restore the three fields
   }
   function wheel(s, t, dx, dy, now, reg): Result {
     // window text: dy → clamp(scroll + dy*WHEEL_LINES, 0, lineCount-1); dx → none
     // window base: withFocus → feedKeys(j|k ×3); dx → once H/L (table) or h/l (board)
     // explorer: moveCursor(±3); sidePanel: withFocus → feedKeys(j|k ×3)
     // overlayItem/overlay: completion → min(3, remaining) <Down>/<Up>; others → <Down>/<Up> ×3
     // calendarDay: feedKeys(j|k); else none
   }
   // onMouse: wheel events call wheel(...)
   ```

   - Reuse `moveCursor` from `src/core/state/explorer.ts`; do not duplicate list movement.

3. **REFACTOR:** Collapse duplicated `j`/`k` key arrays into one local helper if it shortens the code.

   **Preview:**

   ```ts
   // allowed: const repeat = (k: Key, n: number) => Array<Key>(n).fill(k);
   // prohibited: changing key reducers in other modules
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(mouse): scroll the surface under the pointer

   Task: P1-G1-T4 — Wheel under the pointer
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1` (wheel rows), `V4`, `V5`, `V6` — `bun test src/core/state/mouse.test.ts` → all pass
- Regression — `bun run check` → exit 0

##### P1-G1-T5 — Chrome, Bases, and overlay item presses

- **Outcome:** Presses on a buffer tab, explorer row, side-panel row, Bases tab, cell, or card, picker/palette/help row, completion row, and calendar day produce the same state and effects as their keys; Bases single press focuses only and double press opens; explorer `path: ""` and side-panel `row: -1` focus only; `inert` and `overlay` change nothing. Exported wrappers reuse the existing private reducers.
- **System Design:** `REQ1@R1`, `REQ7@R1`; `DES5`; `S1`, `S10`, `S11`; `V1` (chrome rows), `V17`
- **UI Design:** None
- **Canonical Shapes:** System design §5 "Press" chrome branch; §7 `src/core/state/mouse.ts` (`pressChrome`), `src/core/state/base-commands.ts`, `src/core/state/picker.ts`; plan context §7 gaps 2 and 4
- **Files:** `src/core/state/mouse.ts` — `pressChrome`; `src/core/state/base-commands.ts` — `focusBaseCell`, `focusBaseCard`, `showBaseView`, `openBaseFocused`; `src/core/state/picker.ts` — `selectPickerItem`; `src/core/state/calendar.ts` — exported day-select wrapper over `show` (e.g. `selectCalendarDay`); `src/core/state/mouse.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V1` (chrome rows), `V17`:** `src/core/state/mouse.test.ts`

   **Preview:**

   ```ts
   test.each([
     // ["a buffer tab", press bufferTab → equals ":b <id>" / showBuffer],
     // ["an explorer file", press explorer path → equals moving the explorer cursor there + <CR>],
     // ["an explorer folder", → folder expanded like <CR>],
     // ["a side-panel row", → equals cursor to row + <CR>],
     // ["a Bases view tab", → equals the view-switch key],
     // ["a picker row", → equals moving to the row + <CR>],
     // ["a completion row", → equals moving to the row + <CR>],
     // ["a calendar day", → equals moving to the day + <CR>],
   ])("a click on %s equals its keyboard action", (_label, setup, target, keys) => {
     // expect(mouse(start, press(target))) toEqual keys(start, keys) on state and effects
   });
   test("a single click on a Bases cell focuses it and a double click opens it", () => {
     // clicks 1 → focus row/column set, windows unchanged otherwise
     // clicks 2 → equals focus + <CR>
   });
   test("a click on panel chrome only focuses the panel", () => {
     // explorer path "" and sidePanel row -1 → focus flag set, cursor unchanged
   });
   ```

   - Run `bun test src/core/state/mouse.test.ts` and confirm the new cases fail.

2. **GREEN:** `src/core/state/mouse.ts`, `base-commands.ts`, `picker.ts`, `calendar.ts` — `pressChrome` and the exports

   **Preview:**

   ```ts
   // base-commands.ts — thin exports over private functions (system design §7)
   export const focusBaseCell = (c: CommandContext, row: number, column: number) => /* focusCell(active(c), …) */;
   export const focusBaseCard = (c: CommandContext, lane: number, card: number) => /* focusCard(active(c), …) */;
   export const showBaseView = (c: CommandContext, index: number) => switchView(c, () => index);
   export const openBaseFocused = openFocused;

   // picker.ts
   export function selectPickerItem(s: AppState, index: number): AppState { /* find open picker; select(s, p, index) */ }

   // calendar.ts
   export function selectCalendarDay(s: AppState, date: LocalDate): Result { /* show(s, cal, date) when the calendar is open */ }

   // mouse.ts
   function pressChrome(s, t, clicks, now, reg): Result {
     // bufferTab → showBuffer; explorer → cursor = path then openSelected (path "" → focus only)
     // sidePanel → cursor = row then <CR> (row -1 → focus only)
     // window baseTab → showBaseView; baseCell/baseCard → focus, clicks ≥ 2 → openBaseFocused
     // overlayItem: picker/palette/help → selectPickerItem + <CR>; completion → selected = index + <CR>
     // calendarDay → selectCalendarDay + <CR>; inert / overlay / stale index → none
   }
   ```

   - Keyboard behavior of every reused reducer stays unchanged; wrappers add no logic.
   - Each new export is consumed by `mouse.ts` in this task (knip).

3. **REFACTOR:** Keep each wrapper a one-liner; remove any wrapper the reducer does not end up calling.

   **Preview:**

   ```ts
   // allowed: inline a wrapper that only one branch uses if it stays readable
   // prohibited: changing private reducer signatures used by key bindings
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(mouse): activate chrome, Bases, and overlay items on click

   Task: P1-G1-T5 — Chrome, Bases, and overlay item presses
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1` (chrome rows), `V17` — `bun test src/core/state/mouse.test.ts` → all pass
- Regression — `bun test src/core/state` → existing Bases, picker, and calendar tests pass unchanged
- knip — `bun run knip` → no findings

##### P1-G1-T6 — Overlay and command-line gate

- **Outcome:** While a prompt or conflict dialog is open, every press, drag, and wheel leaves state unchanged with no effects. A press outside a dismissible overlay, or outside an open `:`/`/`/`?` line, closes it like `<Esc>` and is consumed. With completion open, a body press closes completion with `overlay: {kind:"none"}` (Insert stays) and then proceeds.
- **System Design:** `REQ8@R1`; `DES5`; `S12`; `V19`, `V24`
- **UI Design:** None
- **Canonical Shapes:** System design §5 "Press", "Overlay gate"; §7 `src/core/state/mouse.ts` (`overlayGate`); plan context §7 gap 4
- **Files:** `src/core/state/mouse.ts` — `overlayGate`; `src/core/state/mouse.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V19`, `V24`:** `src/core/state/mouse.test.ts`

   **Preview:**

   ```ts
   test("prompt and conflict dialogs ignore every mouse gesture", () => {
     // for each open dialog and each target kind × {press, drag, wheel}:
     // expect(r.state).toBe(start); expect(r.effects).toEqual([])
   });
   test("a click outside an overlay or the command line closes it and goes no further", () => {
     // picker + press {outside} → overlay none, window cursor unchanged
     // ":" line + press on window text → mode normal, cursor unchanged
   });
   test("a click on the text closes completion and still moves the cursor", () => {
     // completion open in Insert + text press → overlay none, mode insert, cursor moved
   });
   ```

   - Run `bun test src/core/state/mouse.test.ts` and confirm the new cases fail.

2. **GREEN:** `src/core/state/mouse.ts` — `overlayGate`

   **Preview:**

   ```ts
   function overlayGate(s, e, now, reg): { stop: Result } | { go: AppState } {
     // prompt / conflict → { stop: none(s) }
     // completion + body target on press → { go: { ...s, overlay: { kind: "none" } } }
     // other open overlay + press with target outside/body → { stop: feedKeys(none(s), ["<Esc>"], now, reg) }
     // open ":"/"/"/"?" line + press anywhere but the line (inert) → same <Esc> stop
     // otherwise → { go: s }
   }
   // onMouse runs overlayGate first for every event
   ```

   - Wheel over an open overlay still reaches `wheel`; only prompt and conflict stop it.

3. **REFACTOR:** None beyond ordering `onMouse` as gate → focus → action.

   **Preview:**

   ```ts
   // allowed: early-return shape in onMouse
   // prohibited: special cases outside overlayGate
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(mouse): close overlays on outside clicks and shield dialogs

   Task: P1-G1-T6 — Overlay and command-line gate
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V19`, `V24` — `bun test src/core/state/mouse.test.ts` → all pass
- Regression — `bun run check` → exit 0

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Mapping units (V8–V10) | `bun test src/core/kernel/view/hit.test.ts` | All pass |
| Reducer units (V1, V4–V7, V11, V12, V14, V15, V17, V19, V24) | `bun test src/core/state/mouse.test.ts` | All pass |
| Config unit (V27) | `bun test src/core/config/schema.test.ts` | All pass |
| Type contract (V29) | `bun --bun run tsc --noEmit -p .` | Exit 0; the `@ts-expect-error` on `button` is still needed |
| Obsolete reference (V31) | `rg 'kind: "scroll"\|onMouseScroll' src` | No matches |
| Fast gate | `bun run check` | Exit 0: biome, tsc, knip, unit suites, boundary test |
| Work-ID scan | `git diff --name-only <group-base>..HEAD \| xargs rg -n 'W261005H4XZ\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P1-G1'` | No matches |
| Process cleanup | `pgrep -fl 'src/app/main.ts\|bun run dev'` | No processes started by this group remain |

#### Review and Verification Focus

- **Specification:**
  - Every gesture runs an existing key, command, or exported reducer path (REQ1).
  - Wheel never moves focus or mode (REQ2).
  - Press focus precedes the action (REQ3).
  - Insert click splits undo; Visual and pending keys reset (REQ4).
  - Drag anchors at the press (REQ5).
  - Ctrl+click uses `link.follow` (REQ6).
  - Bases single = focus, double = open (REQ7).
  - Prompt and conflict are untouchable, and an outside press is consumed (REQ8).
  - `mouse` defaults to `true` (REQ9).
  - No UI router or view geometry is added in this group.
- **Technical:**
  - `src/core` imports nothing from `@opentui`.
  - `MouseEvent` carries no screen coordinates or button.
  - Stale targets return `none(s)`.
  - Completion wheel clamps.
  - Every new export has a consumer.
  - Test names describe behavior and contain no work ids.
  - Equivalence assertions compare both state and effects.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ1@R1 → DES1, DES5 → S1, S2 → V1, V29, V31` | None | `P1-G1` | `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5` |
| `REQ2@R2 → DES5 → S3 → V1, V4, V5, V6` | None | `P1-G1` | `P1-G1-T4` |
| `REQ3@R1 → DES5 → S4 → V7` | None | `P1-G1` | `P1-G1-T3` |
| `REQ4@R1 → DES4, DES5 → S5, S6 → V8, V9, V10, V11` | None | `P1-G1` | `P1-G1-T1`, `P1-G1-T3` |
| `REQ5@R1 → DES5 → S7, S8 → V12, V14` | None | `P1-G1` | `P1-G1-T3` |
| `REQ6@R1 → DES5 → S9 → V15` | None | `P1-G1` | `P1-G1-T3` |
| `REQ7@R1 → DES5 → S10, S11 → V1, V17` | None | `P1-G1` | `P1-G1-T5` |
| `REQ8@R1 → DES5 → S12 → V19, V24` | None | `P1-G1` | `P1-G1-T6` |
| `REQ9@R1 → DES6 → S13 → V27` | None | `P1-G1` | `P1-G1-T2` |
| Plan-context gaps 2, 3, 4 | None | `P1-G1` | `P1-G1-T4`, `P1-G1-T5`, `P1-G1-T6` |

Outputs consumed by Part 2:

- `MouseTarget`, `WindowSpot`, and `MouseEvent`, plus the `Action` `mouse` member with `now`.
- `rowAt`, `sourceColAt`, `ScreenRow`, and `Span.col`/`Span.inserted`.
- `AppConfig.mouse`.
- `EditorView` without `onMouseScroll`.

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.

## Planning Gaps

None
