# Base table horizontal scroll: pinned first column, clipped edge column, directional markers

## Context

A wide `.base` table only scrolls whole columns from `BaseWindowState.scroll.col`
(`layoutBaseTable`, `src/ui/widgets/base.ts:74-160`). In the user's screenshot (≈100 cells,
Title 29 + Tags 44, `› +4 cols`) this causes:

1. **Dead space** — a column that doesn't fit whole is skipped (`visibleFrom`, `base.ts:98-103`), so ~18 cells stay empty.
2. **Lost row identity** — after `L`, column 0 (the note name) scrolls away.
3. **Marker without direction** — `hidden: n - cols.length` (`base.ts:153`) mixes left and right; nothing marks the left.
4. **Hard to discover** — `H`/`L` and the sideways wheel work, but the hint (`base-view.ts:459`) omits them and Shift+wheel is ignored (`src/ui/mouse.ts:113-120`).

The user chose: column-step scrolling + pinned first column. Work on the current branch
`fix/review-and-fix` (work ID W261011UIC2; its discuss context is already committed in `89cb80a`).

Target:

```text
scroll.col = 0                                     scroll.col = 1 (after L)
   Title (29)  │ Tags (44)    │ Col3 (cli…   +4 cols ›     Title  │ ‹ +1 │ Col3 │ Col4 │ Col5…  +2 cols ›
   └ pinned                     └ clipped edge column          └ pinned └ left marker
```

## Behavior rules

| Rule | Detail |
|---|---|
| No overflow | When every column fits from 0, the layout is unchanged (no pin, no markers), and `scroll.col` is ignored. |
| Pin | When columns overflow and the table has ≥ 2 columns, column 0 is always drawn first at `LEAD`. Its width is capped at `floor((rect.w − LEAD) / 2)` (cut with `…`), so the other columns always get room. |
| `scroll.col` meaning | It becomes **how many columns after the pinned one are scrolled off**. The first scrolled column is `1 + scroll.col`. Pinning doesn't depend on the window width, so the core can clamp exactly and the stored value never drifts. |
| Scrolled widths | Each scrolled column's width is capped to the room left after the pin, the gutter, and the right reserve. This way a focused column always fits whole. |
| Clipped edge column | After the whole columns, if the next column exists and ≥ `MIN_CLIP` (6) cells remain, it is drawn clipped to that room with `…` (header, cells, summaries). It counts as hidden on the right. |
| Left marker | When `scroll.col > 0`, a `LEFT_MORE`-cell gutter (6) follows the pinned column. The header shows `‹ +N` there (dim); body rows leave it blank. |
| Right marker | Reserve `MORE_COLS` (11) at the right edge only when columns remain hidden there (two-pass fit, like `visibleFrom` today). The header shows `+N col(s) ›` right-aligned in it. |
| Focus | Focus on column 0 never moves the offset. For focus ≥ 1, the offset moves left to it or right until it is a *whole* (not clipped) column, as `base.ts:104-111` does now. |
| `H`/`L` (table) | `scroll.col = clamp(scroll.col ± 1, max(0, n − 2))`. Focus stays on column 0. Otherwise `focus.column = max(focus.column, scroll.col + 1)`. |
| Mouse | Clicking a clipped cell focuses it, so it scrolls into full view. A clipped column has no resize edge (`edgeAt` skips it). Shift + vertical wheel = sideways wheel = `H`/`L`. |
| Hint | When the layout hides columns on either side, the table hint reads `h/j/k/l cell · H/L scroll · i edit · …`. |
| Embeds | `paintBaseEmbed` shares the painter. Embeds never scroll, so they get the clipped edge column and the right marker but never the left gutter. |

## Changes

### 1. Layout and painter — `src/ui/widgets/base.ts`
- `TableLayout`: replace `hidden` with `left: number` and `right: number`. Add `clipped?: true` on a `cols` entry. Update the `TableScroll.col` doc comment.
- Add constants `LEFT_MORE = 6` and `MIN_CLIP = 6`. Keep `LEAD`, `SEP`, `MORE_COLS`, and `fit`.
- Rewrite the column part of `layoutBaseTable` with the rules above. Keep the existing `fitFrom` greedy helper, called with the scrolled-room budget. Keep the edit-widening of the focused column (`base.ts:81-84`), then apply the pin or scrolled-room cap. The row/`top`/`cursor` code is unchanged. The cursor is only placed on whole columns.
- `paintBaseTable` header: draw `‹ +N` in the gutter when `left > 0`, and `+N cols ›` right-aligned at `rect.w − MORE_COLS` when `right > 0`. Remove the old ` › +N cols` after the last column. `sepRow`, the body, and the summaries already iterate `l.cols`. A clipped entry's `w` is its clipped width, so `fit` adds the `…`. Make sure the gutter x-offset is applied when computing each column's `x` (the separator is drawn at `c.x − SEP.length`, so the gutter goes into `x` before the first scrolled column).
- Update the `paintBaseTable` doc comment (`base.ts:212-217`) to describe the new markers.

### 2. Base view — `src/ui/editors/base-view.ts`
- `edgeAt` (`:328-339`): ignore `clipped` columns.
- `cellAt`/`dragAt`: no change (a clipped cell is a normal `baseCell` target).
- `hintOf(m, ws, scrolls)`: add `· H/L scroll` after `h/j/k/l cell` when `scrolls`. `paintHint` passes `(f.table?.left ?? 0) + (f.table?.right ?? 0) > 0`.

### 3. Core scroll command — `src/core/state/base-commands.ts`, `src/core/features/bases/file-type.ts`
- `moveCard` table branch (`base-commands.ts:363-371`): new clamp `max(0, cols − 2)` and the focus rule above. Update its doc comment ("On a table, scroll the columns after the pinned first one").
- `file-type.ts:43`: change the doc to `/** Table columns scrolled off after the pinned first column. */`. Not persisted in the session, so no migration is needed.

### 4. Shift + wheel — `src/ui/mouse.ts`
- In the `scroll` case (`:113-120`), when `e.modifiers?.shift` and the direction is `up`/`down`, send `{ dx: dy, dy: 0 }`. This follows the usual convention (browsers, editors) for every surface. Text windows ignore `dx`, so Shift+wheel there stops scrolling vertically. Accepted, and noted in `project.md`.
- Doc comment on the adapter: mention the Shift mapping.

### 5. Docs — `.s1mple/docs/project.md:119` (Bases paragraph) and the mouse paragraph (`:64`)
- State the pin, clip, and marker rules, the meaning of `scroll.col`, `H`/`L` as "scroll the columns after the pinned first one", and Shift+wheel = sideways.

## Tests

| File | Cases |
|---|---|
| `src/ui/widgets/base.test.ts` (new, colocated; build a small `TableModel` from `src/core/features/bases` types) | all columns fit → same layout as before, `left = right = 0`; overflow → column 0 at `LEAD`, next whole columns, a clipped column filling the room, `right` counts the clipped one; leftover < 6 → no clipped column; `scroll.col = 1` → pinned 0, gutter, first scrolled = 2, `left = 1`; focus on column 0 keeps the offset; focus on the clipped column moves the offset until it is whole; a very wide column 0 is capped at half; a too-wide scrolled column is capped to the room |
| `src/core/state/base-commands.test.ts` | table `L`/`H` clamp at `0` and `n − 2`; focus on column 0 stays; focus on column 1 is pulled to `scroll.col + 1` |
| `src/ui/mouse.test.ts` | Shift + `up`/`down` sends `dx −1/+1, dy 0`; plain up/down unchanged (extend the test at `:146`) |
| `src/core/state/mouse.test.ts:359` | still holds (sideways notch = `L`); no change expected |
| `test/ui/bases.golden.test.ts` | new "base table" case: a base with ≥ 6 wide columns in an 80×24 window shows the pinned column, a clipped column, `+N cols ›`, and the `H/L scroll` hint; after `L`, `‹ +1` and the pinned title still show. Snapshot plus `toContain` asserts. Update existing snapshots only where the marker changed (review the diff). |

Test names describe behavior. No work IDs in code, tests, or comments.

## Verification

1. `bun test src/ui/widgets/base.test.ts src/core/state/base-commands.test.ts src/ui/mouse.test.ts src/core/state/mouse.test.ts`
2. `bun run check` (biome, tsc, knip, unit suites) — required before committing.
3. `bun run test:ci` filtered to `test/ui/bases.golden.test.ts`; inspect each snapshot diff before `-u`.
4. Manual: run `so` on a vault with a wide `.base` in Ghostty (tui-test monitor sized to the window). Check the screenshot case: Title pinned, clipped third column, `+4 cols ›`. Then check `L`/`H`, `l` into the clipped column, a click on the clipped cell, the sideways wheel, Shift+wheel, and an embedded wide base in a note. Kill any `so`/tui-test processes this session started.
5. Commit on `fix/review-and-fix`. Proposed message: `feat: pin the first base column and scroll the rest`, with W261011UIC2 in the body. Save this plan as `.s1mple/work/active/w261011uic2-base-table-horizontal-scroll/w261011uic2-plan.md` in the same commit. Don't push or open a PR unless asked.
