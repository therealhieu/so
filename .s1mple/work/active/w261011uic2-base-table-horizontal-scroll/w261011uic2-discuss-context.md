# W261011UIC2: base-table-horizontal-scroll

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `.s1mple/docs/communication.md`, `.s1mple/docs/languages/typescript.md` | Writing rules; TypeScript and test conventions |
| `src/ui/widgets/base.ts` | Table layout (`layoutBaseTable`), painter (`paintBaseTable`), embed painter |
| `src/ui/editors/base-view.ts` | Window view: layout per frame, hit-testing (`edgeAt`, `cellAt`, `dragAt`), table hint (`hintOf`) |
| `src/core/features/bases/file-type.ts` | `BaseWindowState.scroll` |
| `src/core/state/base-commands.ts` | `moveFocus`, `moveCard` (`H`/`L`), key bindings |
| `src/core/state/base-model.ts` | Window and embed default state |
| `src/core/state/mouse.ts`, `src/ui/mouse.ts` | Wheel routing in the core and the OpenTUI adapter |
| `node_modules/@opentui/core/lib/parse.mouse.d.ts`, `node_modules/@opentui/core/chunk-bun-sjw2d9bq.js:5935` | Scroll events and their modifiers |
| `src/core/state/mouse.test.ts`, `src/ui/mouse.test.ts`, `src/core/state/base-commands.test.ts`, `test/ui/bases.golden.test.ts` | Existing coverage of wheel, `H`/`L`, and table goldens |

## Roadmap Binding

None — standalone work

### Previous Accepted Bindings

None

### Parent Synchronization

- **Registration or discussion update:** None

## 1. User Input

### Original Input

"base table should support somethting like horizontal scroll for this case", with a screenshot of a base table about 100 cells wide. It shows only `Title` (≈29 cells, long names cut with `…`) and `Tags` (≈44 cells), the marker `› +4 cols`, and about 18 empty cells to the right. The user asked to "inspect and propose". After the inspection, they chose column steps with a pinned first column over smooth cell scrolling and over a fill-only fix.

### Consolidated Requirement or Problem

The base table scrolls sideways only by whole columns, starting at `BaseWindowState.scroll.col`. This causes four problems:

1. **Dead space:** a column that does not fit whole is not drawn, so the room right of the last shown column stays empty.
2. **Lost row identity:** once `scroll.col` is past 0, the first column (usually the note name) scrolls away.
3. **Marker without direction:** `› +N cols` counts hidden columns on both sides together, and nothing marks columns hidden on the left.
4. **Undiscoverable scrolling:** `H`/`L` and a sideways wheel scroll the columns, but the table hint omits them, and Shift + vertical wheel does nothing.

The chosen direction keeps column-step scrolling and adds the following. Discussion refines it.

- Pin column 0 unless it is too wide.
- Clip a partial right-edge column to use leftover room.
- Split the hidden count into left and right markers.
- Map Shift + wheel to a sideways step.
- Mention `H`/`L` in the hint.

### Constraints and Assumptions

- `src/core` stays pure: the OpenTUI shift modifier must be translated in `src/ui/mouse.ts` before it reaches `onMouse` (`.s1mple/docs/languages/typescript.md:6`, `project.md:141`).
- Every mouse gesture runs its keyboard path (`project.md:64`, `src/core/state/mouse.ts:50-54`), so a sideways wheel step must stay equal to `H`/`L`.
- Assumption: the terminal forwards Shift + wheel to the app. OpenTUI reports the shift bit on scroll events (`chunk-bun-sjw2d9bq.js:5940-5944`), but some terminals keep Shift + wheel for their own scrollback.
- Column widths follow the existing rule (`project.md:119`): a resized width, else `columnSize`, else content up to 24 cells. The screenshot's 29- and 44-cell widths exceed the content cap, so they come from `columnSize` or a resize.
- No work-process identifiers in code, comments, or test names (`S1MPLE.md` Implementation; `typescript.md:38`).

## 2. Project Structure

- `src/ui/widgets/base.ts` — `layoutBaseTable` (`:74-160`) chooses the shown columns and the cursor cell; `paintBaseTable` (`:218-`) draws the header, `› +N cols`, the separators, the body, and the summaries from `TableLayout.cols`; `paintBaseEmbed` (`:553-602`) calls `paintBaseTable` with the default scroll (`:597`).
- `src/ui/editors/base-view.ts` — `show` lays out the table with `scroll.col` (`:127-133`); `renderSelf` paints it (`:234-236`); `edgeAt`/`cellAt` (`:328-356`) and `dragAt` (`:191-207`) hit-test from `TableLayout.cols`; `hintOf` (`:447-460`) builds the hint row.
- `src/core/features/bases/file-type.ts:43-44` — `scroll: { col: number }`, "the first table column shown".
- `src/core/state/base-commands.ts` — `moveFocus` (`:131-147`), `moveCard` (`:359-372`, table branch scrolls), bindings `h`/`l`/`H`/`L` (`:501-520`).
- `src/core/state/base-model.ts:268-271` — embeds use `focus.column 0` and `scroll.col 0`.
- `src/core/state/mouse.ts:212-237` — `wheelBase`: vertical notches run `base.down`/`base.up` 3 times; a sideways notch runs `base.moveRight`/`base.moveLeft` on a table.
- `src/ui/mouse.ts:41-46, 113-120` — `WHEEL` maps scroll directions to `dx`/`dy`; modifiers are ignored for scrolls.
- `src/core/state/types.ts:553` — `MouseEvent` wheel: `{ dx, dy }` only.
- Tests: `src/core/state/mouse.test.ts:359-376` (a sideways notch equals `L`), `src/ui/mouse.test.ts:142-170` (scroll directions), `src/core/state/base-commands.test.ts:304, 484` (`L`), `test/ui/bases.golden.test.ts` (table, resize, and embed goldens with snapshots in `test/ui/__snapshots__/bases.golden.test.ts.snap`).

## 3. Standards and Patterns

### Applicable Standards

- `.s1mple/docs/project.md:64-70` — the mouse layer only maps cells to model targets; `onMouse` replays the keyboard path.
- `.s1mple/docs/project.md:119` — column widths, `>`/`<`/`=` resizing, `baseEdge` drags, and window-only state that is dropped when the view changes.
- `.s1mple/docs/project.md:141` — layer import rules enforced by `test/boundaries.test.ts`.
- `.s1mple/docs/languages/typescript.md:37-38` — lean code, domain names, and no work IDs.
- `.s1mple/docs/languages/typescript.md:52-55` — `bun test`, colocated `*.test.ts`, tests named by behavior, and `bun run check` before committing.

### Existing Patterns

- `src/ui/widgets/base.ts:93-117` — fit columns greedily from an offset; reserve `MORE_COLS` (11) cells for the marker unless every column fits from 0.
- `src/ui/widgets/base.ts:56-62` — `fit` cuts text to a width with a trailing `…`; it is used for headers and cells.
- `src/ui/widgets/base.ts:104-111` — the offset moves left or right until the focused column shows.
- `src/ui/widgets/base.ts:451, 548` — the board layout already paints `‹ ›` when lanes are scrolled off.
- `src/core/state/mouse.ts:228-236` — a sideways wheel step on a table reuses `base.moveLeft`/`base.moveRight`.
- `src/ui/editors/base-view.ts:62` — the view keeps `rowTop` so vertical scrolling moves only as needed; horizontal scroll lives in core state (`scroll.col`).

## 4. Architecture

```text
core (pure)                                      ui (OpenTUI)
──────────────────────────────────────────       ─────────────────────────────────────────
BaseWindowState { focus.column, scroll.col }     src/ui/mouse.ts  WHEEL{dir→dx,dy}
  ▲  moveFocus (h/l)                               │ (modifiers ignored for scroll)
  │  moveCard  (H/L on table: scroll.col ± 1)      ▼
  │                                             onMouse → wheelBase (dx → base.move*)
baseViewModel → TableModel (columns[].width)
                         │
                         ▼
               BaseView.show → layoutBaseTable(body, table, focus, {top, col})
                         │            → TableLayout { cols[{index,x,w}], hidden, … }
                         ├──► paintBaseTable (header, › +N cols, body, summaries)
                         ├──► edgeAt / cellAt / dragAt (mouse targets)
                         └──► hintOf (hint row)
paintBaseEmbed → paintBaseTable (scroll {0,0}, no focus)
```

- `layoutBaseTable` — the single source of which columns show and where; the painter and the hit-testing both read its `cols`.
- `BaseWindowState.scroll.col` — the preferred first column index; the layout may move it so the focused column shows, but the core value is not written back.
- `moveCard` (table branch) — the `H`/`L` scroll command; it also pulls `focus.column` to at least the new `scroll.col`.
- `wheelBase` — turns wheel notches into base commands.
- `paintBaseEmbed` — read-only embeds share the same layout and painter.

## 5. Code Flow

```text
L / sideways wheel → base.moveRight → moveCard(table): scroll.col = clamp(col+1, n-1),
                                       focus.column = max(focus.column, scroll.col)
h / l              → base.left/right → moveFocus → focusCell(row, column ± 1)
render             → BaseView.show → layoutBaseTable:
                       off = clamp(scroll.col); off = min(off, focus.column)
                       vis = fitFrom(off, w - LEAD [- MORE_COLS]); off++ until focus shows
                       hidden = n - vis.length
                   → paintBaseTable: header labels, " › +N cols" after last shown column
Shift + wheel      → OpenTUI scroll {direction: up/down, modifiers.shift: true}
                   → WHEEL → dy ±1 → base.down/up × 3 (vertical, not sideways)
```

1. `moveCard` sets `scroll.col` and may move the focus right (`base-commands.ts:363-371`).
2. `layoutBaseTable` clamps the offset, moves it left to a focused column before it, and right until the focused column fits (`base.ts:104-111`).
3. `visibleFrom` fits whole columns only; when not every column fits from 0, it reserves 11 cells for the marker (`base.ts:98-103`). A column wider than the remaining room is skipped, which leaves the dead space.
4. `hidden = n - cols.length` mixes left and right (`base.ts:153`); the painter writes ` › +N cols` one cell after the last shown column (`base.ts:256-266`).
5. `edgeAt` treats the cell right of each shown column as its resize edge, and `cellAt` maps x to a shown column (`base-view.ts:328-356`); a clipped column would report its clipped width to `baseEdge` and `dragAt`.
6. The cursor is placed at `col.x + min(caret, col.w - 1)` (`base.ts:142-150`); while editing, the focused column widens to fit its text (`base.ts:81-84`).
7. A scroll event's shift bit reaches `src/ui/mouse.ts`, which ignores it (`:113-120`); `MouseEvent` has no modifier field (`types.ts:553`).

## 6. Boundaries

### In Scope

- Base table horizontal layout in windows: which columns show, the pinned first column, a clipped right-edge column, and left/right hidden markers.
- `H`/`L` and sideways-wheel scroll semantics with a pinned column, including how `scroll.col` and the focus interact.
- Shift + vertical wheel as a sideways step over a base table.
- The table hint row mentioning `H`/`L`.
- Hit-testing (`cellAt`, `edgeAt`, `dragAt`) and the cursor for pinned and clipped columns.
- Effects on read-only embeds that share `paintBaseTable`.
- Unit, golden, and mouse tests covering the above; `project.md` updates for the new layout rules.

### Out of Scope

- Smooth cell-granular scrolling (rejected by the user).
- Board (Kanban) lane scrolling.
- Column width rules, `columnSize`, and resizing semantics beyond what pinning and clipping require.
- Writing scroll or pin state to the `.base` file or the session file.
- Vertical scrolling and row grouping.

### Interfaces and Dependencies

- `TableLayout` (`base.ts:33-44`) — consumed by `paintBaseTable`, `BaseView` (`show`, `edgeAt`, `cellAt`, `dragAt`), and `paintBaseEmbed`.
- `TableScroll` (`base.ts:27`) and `BaseWindowState.scroll` (`file-type.ts:44`).
- `MouseEvent` wheel shape (`types.ts:553`) and the `WHEEL` map (`src/ui/mouse.ts:41`).
- OpenTUI `RawMouseEvent.modifiers.shift` on `scroll` events (`parse.mouse.d.ts:7-16`).
- `base.moveLeft`/`base.moveRight` commands and the `H`/`L` bindings (`base-commands.ts:483-520`).
- Goldens in `test/ui/__snapshots__/bases.golden.test.ts.snap` change when the header marker or clipping changes.
- Sibling work `w261010o23a-base-ui-filters` (committed in `781c265`) touched the same base files for filters; its plan remains in `.s1mple/work/active/` and has no overlap in horizontal layout.

## 7. Unknowns

- When should column 0 not be pinned? The proposal is "wider than half the body"; the exact threshold and behavior when the window is very narrow are open.
- What minimum room justifies drawing a clipped right-edge column (proposed ≈6 cells)? Should it use `…` like `fit`?
- Marker format and placement: `‹ N` after the pinned column and `N ›` at the right edge. Do they reserve fixed cells (like `MORE_COLS`) or overlay the clipped column?
- With column 0 pinned, what does `scroll.col` mean? Is it the first scrolled column (≥ 1), and should `H` at the leftmost position clamp to 1?
- `moveCard` pulls `focus.column` to `max(focus.column, scroll.col)`. Should focus on the pinned column stay put when scrolling with `L`?
- Can a clipped column be focused, edited, or resized from its visible part? Focusing it would scroll it fully into view; its `baseEdge` would sit at the clip.
- Should embeds (read-only, no scrolling) show the clipped column and the right marker, or keep the current behavior?
- Does the user's terminal (Ghostty, per earlier demos) forward Shift + wheel to the app, or does it scroll the terminal's own scrollback? A horizontal tilt or trackpad already works.
- Should Shift + wheel step one column per notch, like the sideways wheel, or several?
