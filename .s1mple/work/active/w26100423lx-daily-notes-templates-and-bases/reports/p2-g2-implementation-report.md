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

- **Verification reports:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/reports/p2-g2-verification-report.md` (commit `eb6e489`, `Failed`, five Minor findings)
- **Status:** `Completed`

All five findings are fixed in separate commits on top of `eb6e489`: `9bfcc4b` (VER5), `9760ead` (VER4), `0f18201` (VER1), `f4d216d` (VER2), `9295198` (VER3). The orchestrator ruled that UREQ9@R1's suggestions, list chips, and filter summary are owned by this work, so VER2 was implemented, not deferred. The verification report is unchanged.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G2-VER1` | `src/core/state/status.ts` `modeOf`: in a base window in normal mode the mode is `base`, and `insert` while `kindState.edit` is set. Explorer, command line, and visual modes keep their badges. `src/ui/views/statusline.ts` adds the `BASE` badge (`modeNormal` token); `INSERT` reuses `modeInsert`.<br>RED: three new assertions in `test/ui/bases.golden.test.ts` failed on ` NORMAL  │ tasks.base …`.<br>GREEN: `bun test test/ui/bases.golden.test.ts` passes. The table and board frames start the status line with ` BASE `, and the edited-cell frame with ` INSERT `. The snapshot diff changes only the badge line of each base golden (12 lines) | `0f18201` | `Fixed` |
| `P2-G2-VER2` | **Text suggestions:** `base-model.ts` `suggestionsFor` lists the distinct non-empty string values of the edited property across the base's candidates (the evaluator's input, unsaved notes included). Property names match in any letter case, values match the typed prefix ignoring case, and the list is sorted and capped at 5. They are exposed as `BaseViewModel.suggestions` while a text cell is edited. In `cellEditKey`, `<Tab>` completes the first suggestion.<br>**List chips:** `CellEdit.items` holds the chips of a `list`/`tags`/`aliases` cell. `Enter` with typed text adds a chip (a leading `#` is stripped for tags). `Backspace` on an empty input removes the last chip. `Enter` on an empty input writes the list through the same `writeProperty`; an empty list writes `null`.<br>**Filter summary:** `BaseViewModel.filter` is the base's and, unless toggled off, the view's filters as one expression (`and`/`or` joined, nested groups parenthesized, `not` as "none of"). The toolbar shows `⧩ <expression>`, cut at 32 cells, and `view filters off` when toggled off. A toolbar that does not fit drops the expression first, then everything but the count.<br>**Painter:** `src/ui/widgets/base.ts` paints the error, the chips (`baseChip`), and the suggestions (the first in `baseFocus`, the rest in `baseSuggest`) under the edited cell. `base-view.ts` passes them on and shows matching hint rows. There are two new theme tokens.<br>RED: three unit tests and three golden assertions failed before the change.<br>GREEN: `bun test src/core/state/base-commands.test.ts` passes, covering:<br>• suggestions `["doing","todo"]` → `["doing"]` after `d`, `Tab` → `doing`, and `Enter` → `patchFrontmatter status: doing`;<br>• chips: `api, docs` + `ui` → `Backspace` → `x` → write `["api","x"]` expecting `["api","docs"]`;<br>• the filter `file.inFolder("tasks") and (status == "todo" or done == false)`, which drops the view part after `f`, and `not (status == "todo" or done == true)`.<br>`bun test test/ui/bases.golden.test.ts` passes. The suggestion list sits under the cell, chips show `#api × #docs × #ui ×`, and the empty view's toolbar shows `⧩ status == "archived" · 0 rows`. There is no new dependency, no kernel change, and no expression-evaluation change | `f4d216d` | `Fixed` |
| `P2-G2-VER3` | `test/ui/bases.golden.test.ts` `describe("base styles")`:<br>• For colour, `NO_COLOR`, and light, snapshots the fg, bg, and attrs of the focused cell, the focused card, the `doing` lane dot, and the `⊘ moves off` notice.<br>• Asserts that dark and light differ for each of the four.<br>• Asserts that the `NO_COLOR` board frame has only `default` colour intents.<br>`src/core/state/base-commands.test.ts` adds a board grouped by `file.folder`: `movable` is false, `L` writes nothing, and the toast reads "Moves are off: this board groups by a file property".<br>These tests cover existing behavior, so there was no natural RED. They passed on first run.<br>Snapshots (dark): focused cell bg `45,63,118`; light: `183,197,240`; `NO_COLOR`: `INVERSE` (32) on default colours | `9295198` | `Fixed` |
| `P2-G2-VER4` | `src/core/state/buffers.ts`: `READ_ONLY_HINT` is replaced by `readOnlyHint(b)`. It returns `READ_ONLY_FILE` ("read-only file") for a `readOnly` buffer, else the reading-view hint. All four refusal sites use it: `commands.ts` `:s`, `markdown-commands.ts` checkbox toggle, `keys.ts` vim edits, and `note-commands.ts` template insertion. `writeActive` uses the same constant.<br>RED: the new test received "reading mode — <leader>m to edit".<br>GREEN: `bun test src/core/state/base-commands.test.ts` passes. `:s/a/b/` in `tasks.base` → "read-only file", the text is unchanged, and there are no effects. The existing reading-view messages in Markdown tests are unchanged | `9760ead` | `Fixed` |
| `P2-G2-VER5` | `BaseWindowState.focus.index` holds the row (table) or card in its lane (board) last focused. `focusCell`, `focusCard`, and `moveCard` write it. `derive` no longer takes the memoized previous model: when the focused path is gone, focus stays at `ws.focus.index`. It starts at 0 when the window has not focused a note, or when its view name no longer exists in the file. `scroll.row` is removed (`scroll: { col }`), and `isBaseWindowState` checks `scroll.col`. The memo now only returns a model equal to a fresh derivation of its key.<br>RED: the new test returned row 0 after a memo primed by a state focused on row 0, but row 1 before.<br>GREEN: `bun test src/core/state/base-model.test.ts` → 10 pass. The new test derives the same focus (row 1, `tasks/write-report.md`) whichever state primed the memo. The existing focus-follow, fresh-window, and memo-hit cases still pass | `9bfcc4b` | `Fixed` |

**Completion checklists.** Every finding's four items are satisfied:

- the required resolution is implemented;
- the required proof passes;
- the change evidence is recorded in the table above;
- the verification evidence is recorded there too.

**Group verification after remediation:**

| Check | Result | Actual result |
|---|---|---|
| `bun run check` | `Passed` | Biome, tsc, and knip are clean. 990 pass, 0 fail; 3.6 s |
| Orphan check → `bun run test:ci` → orphan check | `Passed` | No `so`/`bun test` process before or after. 187 pass, 0 fail, 54 snapshots; 33 s |
| `bun test test/ui/bases.golden.test.ts` | `Passed` | 19 pass. Only `test/ui/__snapshots__/bases.golden.test.ts.snap` changed among snapshot files since `80ea2c8` |
| Base state suites | `Passed` | `base-model.test.ts` 10 pass, `base-commands.test.ts` 19 pass, `base-write.test.ts` 6 pass |
| V20: `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` | `Passed` | No match (exit 1) |
| Kanban gate: `rg -n 'kanban-test' src -g '!*.test.ts'` | `Passed` | No match. `KANBAN_TYPE` is still `undefined` |
| Protected scope: `git diff 80ea2c8 HEAD -- package.json bun.lock .github src/core/kernel` | `Passed` | Empty. Registrations are unchanged, so `registries()` and `testRegistries` stay mirrored |
| Work-process identifiers in added `src`/`test` lines | `Passed` | No match |

**Decisions a later reader must preserve:**

1. **Suggestions** come from every candidate the base evaluates, not only the shown rows. Only string values count. `Tab` completes the first one; there is no up/down selection.
2. **Chips** are painted on the line under the edited cell, the way the inline error is, not in a titled float. Only `tags` chips carry `#`.
3. **The filter summary** shows the expression text as written, for example `!=`, not `≠`. On a narrow toolbar it is dropped before the group and count, so the 80-column board golden keeps `group: status · 4 cards`.
4. **An empty chip list** writes `null`, matching `validateCell` for empty text.
5. **Read-only refusals.** Only buffers whose file type is `readOnly` say "read-only file". The Markdown reading view keeps its `<leader>m` hint.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. All tasks are implemented, all five verification findings are fixed, and every group check passes.
- **Final report commit:** returned to the orchestrator
- **Final commits:**
  - Initial: `122ee39`, `d5fee20`, `b59ad85`, `16d6d2b`, `b6ae4a8`, `fbb838c`, `80ea2c8`
  - Remediation: `9bfcc4b`, `9760ead`, `0f18201`, `f4d216d`, `9295198`
- **Final checks:**
  - `bun run check` → 990 pass
  - `bun run test:ci` → 187 pass, 54 snapshots
  - Bases goldens → 19 pass
  - V20 → no match
  - Kanban gate → no match
- **Remaining issues:** None
