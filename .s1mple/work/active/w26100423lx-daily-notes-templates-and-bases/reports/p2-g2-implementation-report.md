# P2-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-goal.md`
- **Plan Part:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-2-bases.md`
- **Group:** `P2-G2` — Base editor kind, write-back, and view
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`, `P2-G2-T3`, `P2-G2-T4`, `P2-G2-T5`
- **Report:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/reports/p2-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

### Status

`Completed`

All five tasks are committed. Every task check and every group check passes, including `bun run test:ci`.

**Dependencies and gate evidence.** Part 1 (`P1-G1`, `P1-G2`) and `P2-G1` were accepted on 2026-10-04. Their reports are in `reports/`. Gate G3 (DI2 outputs) was re-checked twice:

| When | Check | Result |
|---|---|---|
| Before T1 | `git merge-base --is-ancestor 9adb285 HEAD` | ancestor |
| Before T1 | `FileTypeRegistry`/`EditorKindSpec` in `src/core/filetypes/registry.ts`, the `write` effect in `src/core/state/types.ts` | shapes match the design |
| Before T5 | `git merge-base --is-ancestor 9adb285 HEAD` | ancestor |
| Before T5 | `git diff 9adb285 HEAD -- src/ui/editors/registry.ts` | empty, so `editorViews`/`registerEditorView` were unchanged before T5 widened them |

**Starting state:** branch `feat/rm261003abzp-di4-daily-notes-and-bases` at `cb4593d`. The tree was clean, with no pre-existing changes.

**TDD record.**

- Each task's new tests failed before the implementation, then passed.
- T5 RED: `bun test test/ui/bases.golden.test.ts` gave 12 failures because no `base` editor view was registered.
- Two T5 test expectations written during RED did not match the accepted command contract, and were corrected before GREEN:
  - `i` on a checkbox cell toggles it (`startEdit` → `toggleCheckbox`). The inline-error case now edits the `due` date cell (`llix` → `✗ use YYYY-MM-DD`).
  - Card titles are note base names (`write-report`). The long toast wraps across two lines, so the test matches `Moves are off: this board groups`.

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G2-T1` | `src/core/features/bases/file-type.ts`: `baseFileType` (`readOnly`, editor `base`), `baseEditorKind`, `BaseWindowState`, `CellEdit`, `isBaseWindowState`<br>`src/core/filetypes/registry.ts`: read-only file types<br>`src/core/state/buffers.ts`: open with subpath, `awaitOpen`<br>`src/core/state/save.ts`: the save gate refuses `readOnly` buffers<br>`src/core/state/commands.ts`: `:w` says "read-only file"<br>`src/core/state/keys.ts`: no vim in base windows<br>`session.ts`, `types.ts`, `update.ts`: registration and routing<br>`src/app/main.ts` and `test/support/state.ts`: mirrored registration | `bun test src/core/state/base-commands.test.ts` → 5 pass<br>`bun run check` → 959 pass<br>V20 search → no match | `122ee39` | `Completed` |
| `P2-G2-T2` | `src/core/state/base-model.ts`: `BaseViewModel`, `baseViewModel` (memo keyed `window:<id>` on input identities), `baseWindow`, `setBaseWindow`, `selectBaseView`, `overlayOf`, `dirtyNoteSignature`, waiting state<br>`viewContexts.register("base", …)` in `main.ts` and `test/support/state.ts`<br>`test/support/bases.ts` | `bun test src/core/state/base-model.test.ts` → 8 pass<br>`bun run check` → 967 pass<br>V20 → no match | `d5fee20`; follow-up `b6ae4a8` (see Deviations) | `Completed` |
| `P2-G2-T3` | `src/core/state/base-write.ts`: `writeProperty` (an open buffer is edited in one undo step; a closed note gets a `patchFrontmatter` effect with the expected value; `date: true` for date-typed properties), `onFrontmatterPatched`, `diffToast`<br>`types.ts`: `patchFrontmatter` effect and `frontmatterPatched` action<br>`update.ts`: routing<br>`src/app/effects.ts`: `patchFrontmatter` runner on the serial queue, with read stamp and own-op tracking; logs `bases.patched` with the path only | `bun test src/core/state/base-write.test.ts` → 6 pass<br>`bun test src/app/effects.test.ts` → the new runner case passes<br>`bun run check` → 974 pass | `b59ad85` | `Completed` |
| `P2-G2-T4` | `src/core/state/base-commands.ts`: `baseCommands` (`base.left/right/up/down/edit/toggle/sort/group/filter/views/nextView/view1-4/moveLeft/moveRight/open`), `baseBindings` (normal mode, filetype `base`), `editingCell`, the cell editor (`validateCell`, `<C-a>`/`<C-x>` steps), `moveCard` with `EXPLAIN_FIXED`<br>`base-model.ts`: focus by path<br>`keys.ts`: routes cell-edit keys<br>`picker.ts`: `baseViews` picker<br>`test/integration/bases-write.test.ts` | `bun test src/core/state/base-commands.test.ts` → 14 pass<br>`bun test test/integration/bases-write.test.ts` → 2 pass (3 runs)<br>`bun run check` → 983 pass<br>V20 → no match<br>no orphan processes | `16d6d2b`; follow-up `80ea2c8` (lint) | `Completed` |
| `P2-G2-T5` | `src/ui/editors/registry.ts`: `WindowView`; `editorViews`/`registerEditorView` produce it<br>`text-view.ts`: `EditorView implements WindowView` (no behavior change)<br>`window-tree.ts`: views typed `WindowView`<br>`src/ui/editors/base-view.ts`: `BaseView` (toolbar, notices, table or board, hint row; the cursor is computed in `show`)<br>`src/ui/widgets/base.ts`: `layoutBaseTable`, `paintBaseTable`, `layoutBaseBoard`, `paintBaseBoard`, with shared private `fit`/`put` helpers<br>`src/ui/theme.ts`: `base*` tokens<br>`registerEditorView("base", …)` in `main.ts` and `test/support/ui.ts`<br>`test/ui/bases.golden.test.ts` and 12 snapshots | `bun test test/ui/bases.golden.test.ts` → 12 pass, 12 snapshots<br>`bun test test/ui` → 110 pass; existing snapshots unchanged<br>`bun run check` → 984 pass<br>V20 → no match | `fbb838c` | `Completed` |

### Group Change Range

- **Starting commit:** `cb4593d`
- **Final commit:** `80ea2c8`. The commits in order:
  - `122ee39` (T1)
  - `d5fee20` (T2)
  - `b59ad85` (T3)
  - `16d6d2b` (T4)
  - `b6ae4a8` (T2 follow-up fix)
  - `fbb838c` (T5)
  - `80ea2c8` (T4 lint follow-up)
- **Remaining group changes:** None. The tree is clean.

### Group Verification

| Check | Result | Actual result |
|---|---|---|
| `bun test src/core/state/base-model.test.ts src/core/state/base-commands.test.ts src/core/state/base-write.test.ts` | `Passed` | 29 pass, 0 fail |
| `bun test test/integration/bases-write.test.ts` | `Passed` | 2 pass, 0 fail. The comment is kept, and a stale write is refused with the file unchanged |
| `bun test test/ui/bases.golden.test.ts` | `Passed` | 12 pass, 12 snapshots. Covers colour, `NO_COLOR` (single `default` colour intent, focused cell and card `INVERSE`, row `▌`), light, 80×24, and 120×30 |
| V20: `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` | `Passed` | No match |
| Kanban gate: `rg -n 'kanban-test' src -g '!*.test.ts'` | `Passed` | No match |
| `bun run check` | `Passed` | 984 pass, 0 fail; 4.4 s wall |
| `bun run test:ci` (orphan check before and after: none) | `Passed` | 180 pass, 0 fail, 49 snapshots; 33 s. The only snapshot change since `cb4593d` is the new `bases.golden.test.ts.snap` |
| Registration mirror: `registries()` (`src/app/main.ts`) vs `testRegistries()` (`test/support/state.ts`) | `Passed` | Both register `baseFileType`, `baseEditorKind`, `baseCommands`, `baseBindings`, `viewContexts "base"`, and `KANBAN_TYPE`-guarded `boardLayout`. Only `testRegistries` adds `layouts.register("kanban-test", boardLayout)`. `registerEditorView("base")` is in `main()` and `mountShell` |
| Protected scope | `Passed` | `KANBAN_TYPE` is still `undefined`. `git diff cb4593d HEAD` shows no changes to `package.json`, `bun.lock`, `.github`, `src/core/kernel`, or parent roadmap files |
| Work-process identifiers | `Passed` | No REQ/DES/V/task identifiers in the new code, tests, or log events |

The plan's unfiltered kanban gate is `rg -n 'kanban-test' src`. It matches only test files: `src/core/features/bases/kanban.test.ts` and `views.test.ts` (from P2-G1), and `src/core/state/base-commands.test.ts` (this group). The non-test filter above is the meaningful check.

### Deviations and Remaining Issues

1. **`writeProperty` edits any open buffer of the note, unlisted embed buffers included.** The design says `listed !== false`. This mirrors `beginRewrite`, so an embed buffer can never go stale against the disk. Preserve this.
2. **`:w` on a base buffer:**
   - `writeActive` (`commands.ts`) shows "read-only file".
   - `writeBuffer`/`writable` refuse silently, so autosave-on-leave does not show the message.
3. **Table column scroll and card moves share keys.** On a table, `H`/`L` scroll the columns (`scroll.col`). On a board they move the card. The view keeps table row scrolling (`BaseView.rowTop`) locally, never in state.
4. **A refused patch leaves the index unchanged.** The watcher's next batch brings the disk value into the view.
5. **Painter signatures take `theme`.** The plan's preview showed `paintBaseTable(buf, rect, m, focus?)`. The implemented form is `paintBaseTable(buf, theme, rect, m, { focus?, scroll?, empty? })` and `paintBaseBoard(buf, theme, rect, m, { focus?, wide? })`, because painters do not read the app state.
   - Each painter has a pure layout function (`layoutBaseTable`, `layoutBaseBoard`). `BaseView.show` uses them to place the hardware cursor before painting, because `WindowTree.cursor()` is read before render.
   - Painters draw only inside their rect, for reuse by Part 3's embed painter.
6. **T2 follow-up `b6ae4a8`.** The near-focus fallback reused a memoized model for the same window id even when the window had not focused a note yet. A fresh window, such as one in a new test app with the same window id, could open on a stale row. The fallback now applies only once the window has a focused path. A regression test was added in `base-model.test.ts`.
7. **Board layout.**
   - At 100 or more columns, cards are boxed with a meta line of up to two fields, as in the Kanban anatomy.
   - Below 100 columns, cards take one line, with `▌` and a reversed title on the focused card.
   - Lanes are at least 18 cells wide. `‹ ›` marks lanes scrolled off.
8. **Toolbar.** The toolbar shows a short filter state (`⧩ filters on|off`), not the filter expression, because the view model exposes only `filters: "on" | "off" | "none"`. When the right side does not fit, only the count or state is kept.
9. **Inline cell error.** It is painted on the line under the edited cell, to the window's right edge. While the error is shown, it covers that line's later cells.
10. **Mode label.** The status line still shows `NORMAL` while a cell is being edited. The shell's mode label comes from vim mode, and this group did not change the shell. The base hint row shows `editing — ⏎ write to frontmatter · esc cancel`.

No unresolved implementation or verification issue remains.

## Remediation

- **Verification reports:** None yet
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. All tasks and group checks pass.
- **Final report commit:** returned to the orchestrator
- **Final commits:** `122ee39`, `d5fee20`, `b59ad85`, `16d6d2b`, `b6ae4a8`, `fbb838c`, `80ea2c8`
- **Final checks:**
  - `bun run check` → 984 pass
  - `bun run test:ci` → 180 pass
  - Bases goldens → 12 pass
  - V20 → no match
  - Kanban gate → no match
- **Remaining issues:** None
