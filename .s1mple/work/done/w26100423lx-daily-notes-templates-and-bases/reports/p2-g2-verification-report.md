# P2-G2 Verification Report

## Scope

- **Group:** `P2-G2` — Base editor kind, write-back, and view
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`, `P2-G2-T3`, `P2-G2-T4`, `P2-G2-T5`
- **Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p2-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p2-g2-implementation-report.md` (commit `de008ce`)

Verified range: `cb4593d..80ea2c8` (commits `122ee39` T1, `d5fee20` T2, `b59ad85` T3, `16d6d2b` T4, `b6ae4a8` T2 fix, `fbb838c` T5, `80ea2c8` T4 lint). Inspected and run at `HEAD` `de008ce` on `feat/rm261003abzp-di4-daily-notes-and-bases`, with a clean tree. `git diff 80ea2c8 de008ce` changes only the implementation report. Baseline: `main` `d398ad7`, as recorded in the goal's execution-start row.

**Gate G3 and the DI2 contracts:**

- **Ordering.** The goal recorded G3 `Satisfied` in `fb86f9c`, which is an ancestor of the group's start `cb4593d`. `9adb285` (DI2, PR #2) is also an ancestor of `cb4593d`.
- **Contracts before T1.** At `cb4593d`, `EditorKindSpec` was `open(path, text): St`, and `FileType` had no `readOnly`. Both match the design's "Existing Shape".
- **Contracts before T5.** `git diff 9adb285 b6ae4a8 -- src/ui/editors/registry.ts` is empty, so `editorViews`/`registerEditorView` were unchanged until T5 widened them.
- **Extended, not broken.** T1 added the optional `subpath` argument and `readOnly?: true`. T5 widened the factory return type from `EditorView` to `WindowView`, and `EditorView` now `implements WindowView` with no behavior change. The `write` effect is unchanged.
- **Protected scope.** `git diff cb4593d 80ea2c8 -- package.json bun.lock .github src/core/kernel .s1mple` is empty, so there is no new dependency, no kernel change, and no planning or parent-file edit.

## Status

`Failed`

All five task outcomes are implemented. Every assigned V case passes, as do `bun run check` and `bun run test:ci`. Every binding constraint holds:

- `.base` is never written. The save gate refuses `readOnly` buffers, and `:w`, recreate, `:wq`, `:w other.md`, and autosave on leave all produce no write effect.
- No key reaches vim in a base window.
- V20 finds no match, and `KANBAN_TYPE` is `undefined`.
- `kanban-test` appears only in test registries and tests.
- `registries()` and `testRegistries` are mirrored.
- Closed-note writes go through the serial queue with the read stamp and own-op tracking, and stale writes are refused.
- No existing golden changed.

The group fails on five Minor findings:

| Finding | Problem |
|---|---|
| `P2-G2-VER1` | The status line says `NORMAL` in base windows and during a cell edit; M6@R1 shows `BASE` and `INSERT` |
| `P2-G2-VER2` | UREQ9@R1 text suggestions, list chips, and the filter-expression summary are neither built nor deferred |
| `P2-G2-VER3` | The colour and light goldens hold no style evidence |
| `P2-G2-VER4` | Refusals in a base window point to `<leader>m`, which does nothing there |
| `P2-G2-VER5` | Base focus fallback depends on the module memo's history, so the reducer is not a pure function of its inputs |

## Assigned Traceability

- **System Design:** `W26100423LX-REQ7@R2, REQ8@R2, REQ9@R2, REQ10@R2, REQ12@R1, REQ13@R1 → DES11, DES12, DES13, DES14 → S11, S13, S14, S15, S16, S17, S19, S22, S24 → V20, V25, V27, V29, V35, V36, V37, V40, V41, V42, V45` (plan part 2, P2-G2 Coverage Summary and Traceability, lines 82 and 100–107). V30 is not assigned to P2-G2: the plan maps it to P2-G1-T5 (`Coverage` line 495). It remains `Pending — user fixture`, and `KANBAN_TYPE` stays `undefined` (`src/core/features/bases/types.ts:8`).
- **UI Design:** `RM261003ABZP-UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`; `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` (table and board, via V27, V29, V36, V40, V45).

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ7@R2, REQ12@R1 → DES11 → S11, S13 → V20, V25` | None | `.base` reaches file type and kind `base` by registration only. The buffer is `readOnly`. No key reaches vim. `:w` and recreate are refused with "read-only file". `syncEditorKinds` is the only creator of `kindState` and emits `readPropertyTypes` for a new base window | `src/core/features/bases/file-type.ts:51-73` (`baseFileType`, `baseEditorKind`); `src/core/filetypes/registry.ts` (`open(…, subpath?)`, `readOnly?: true`); `src/core/state/buffers.ts` `onFileLoaded` (`readOnly`); `src/core/state/save.ts:25-30,79-84`; `src/core/state/commands.ts:243`; `src/core/state/keys.ts:122-129`; `src/core/state/update.ts:79-114`. `kindState` is set only in `syncEditorKinds` and through `setBaseWindow` updates (`base-model.ts:98-107`). A probe confirmed that `:s`, `:wq`, `:w other.md`, `:q`, and template insertion leave the buffer unchanged with no write effect. The refusal text points to the wrong key (VER4) | `Satisfied` |
| `REQ12@R1 → DES11, DES12 → S22 → V41, V42` | None | Waiting state; re-evaluation keeps the focus path; fallback to the first view; a version-1 state file restores at the first view; a memo hit when nothing relevant changed | `src/core/state/base-model.ts:142-260`. The memo is keyed on the text, index, types, status, dirty-note signature, window state, and layouts. `waiting` when the index is not ready and empty. `parseError`. Focus by `focus.path`. `src/core/state/session.ts:215` carries `subpath`; `buffers.ts:316-393` (`awaitOpen`, `openPath` options, `withSubpath`). The "near" fallback reads the previous memoized model (VER5) | `Satisfied` |
| `REQ10@R2 → DES13 → S19 → V35, V37` | `UREQ9@R1 → UDES9@R1` (diff toast) | Open note: one undo step, autosave, and a diff toast. Closed note: one `patchFrontmatter` with the expected value. The result updates the index and toasts the diff, or toasts the failure | `src/core/state/base-write.ts:33-75`; `src/core/state/types.ts` (`frontmatterPatched` action, `patchFrontmatter` effect); `update.ts:184`; `src/app/effects.ts:298-348`. The runner follows pending moves, re-reads, compares `frontmatterValue` with `expected`, patches, writes with `cur.stamp`, calls `ownOps.noteWrite` and `index.notify`, and logs `bases.patched`/`bases.patchFailed` with the path only. A probe confirmed that index frontmatter and `frontmatterValue` agree for strings, numbers, dates, booleans, lists, nulls, and case-variant keys, so the stale check does not misfire | `Satisfied` |
| `REQ8@R2 → DES12 → S14, S15 → V27, V29` | `UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1` | `s`/`g`/`f` change only `kindState`. Derived cells explain that they are read-only. Typed editing with `Ctrl-a`/`Ctrl-x`, an inline error, and `Esc` restore | `src/core/state/base-commands.ts:140-247` (`startEdit`, `toggleCheckbox`, `cycleSort`, `toggleGrouping`, `toggleFilter`, `switchView`), `:382-523` (`stepped`, `validateCell`, `commitCellEdit`, `cellEditKey`); `keys.ts:85` routes cell edits before bindings; `picker.ts:401` `baseViews`. UREQ9's text suggestions, list chips, and filter-expression summary are absent (VER2) | `Satisfied` |
| `REQ9@R2, REQ10@R2 → DES12, DES13 → S17, S19 → V36` | `UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1` | A card move on a closed note changes only the status line and keeps its comment. After an external change, the move is refused and the file is unchanged | `base-commands.ts:249-299` (`moveCard`: `None` → `{ remove }`; formula/`file.*` → explanation toast; focus path kept); `test/integration/bases-write.test.ts:72-141` | `Satisfied` |
| `REQ13@R1 → DES14 → S16, S17, S24 → V40, V45` | `UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`; `UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` | Table and board goldens at 80×24 in colour, `NO_COLOR`, and light. Waiting and empty states. `⊘ moves off` and the cards fallback notice. The hardware cursor on the focused cell or card | `src/ui/editors/registry.ts` (`WindowView`); `text-view.ts` (`implements WindowView`); `window-tree.ts` (views typed `WindowView`); `src/ui/editors/base-view.ts:44-293`; `src/ui/widgets/base.ts:71,190,365,426` (layout and painters confined to their rect); `src/ui/theme.ts` `base*` tokens; `main.ts:270`, `test/support/ui.ts:64`. The status line mode label differs from M6 (VER1). The light and colour goldens carry no style evidence (VER3) | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V25` | `S13` | `DES11` | `bun test src/core/state/base-commands.test.ts`; scratch probe of ex commands in a base window | 14 pass. Every unbound printable key gives no text change, no effect, `pending: []`, and mode normal. `:w` → "read-only file", no write. A deleted base plus `:w` gives no recreate. Probe: `:%d`, `:s/…/`, `:wq`, `:w other.md`, `:q` → no text change, no write effect | `Passed` |
| `V27` | `S14` | `DES12` | same file | `s`→ASC→DESC→off, `g`, and `f` change `kindState` only. The `.base` text is unchanged and not dirty, and there are no write effects. `i` on `file.name` → "name — file property, read only"; on a formula → "late — formula, read only" | `Passed` |
| `V29` | `S15` | `DES12` | same file | `Ctrl-a` ×2 → `patchFrontmatter` `est: 5` expecting `3`. Date `Ctrl-x` → `2026-10-04` with `date: true`. `abc` → `edit.error` "not a number" and no write. `Esc` drops the edit | `Passed` |
| `V35` | `S19` | `DES13` | `bun test src/core/state/base-write.test.ts` | 6 pass. Open dirty note: one undo entry, autosave `startTimer`, diff toast, and `u` reverts only the property. Closed note: exactly one `patchFrontmatter` with `expected: "todo"`, and the state is unchanged | `Passed` |
| `V37` | `S19` | `DES13` | same file; `bun test src/app/effects.test.ts` | ok → the index summary has `status: doing` and the toast reads `- status: todo / + status: doing`. Failed → error toast, and the index object is identical. Runner: written only while the value matches; a mismatch → `changed on disk` and the file is unchanged (18 pass) | `Passed` |
| `V36` | `S17`, `S19` | `DES12`, `DES13` | `bun test test/integration/bases-write.test.ts` | 2 pass. The file differs only in `status: todo # next up` → `status: doing # next up`. The card keeps focus. The `bases.patched` log line is `{event, level, path, time}` only. An external edit first → `ok: false "changed on disk"`, the file is unchanged, and the watcher brings the board to the disk value | `Passed` |
| `V41` | `S22` | `DES11`, `DES12` | `bun test src/core/state/base-model.test.ts` | 9 pass: waiting → ok; the focus row follows `tasks/inbox.md` from row 3 to row 0 after a reorder; a renamed view → `All tasks`; a version-1 state file → base window at the first view; parse error; cards → table with a notice | `Passed` |
| `V42` | `S22` | `DES12` | same file | `model({...s}) === a`; a keystroke in an unrelated `.ts` buffer in a split → the same model object | `Passed` |
| `V40` | `S24` | `DES14` | `bun test test/ui/bases.golden.test.ts` | 12 pass, 12 snapshots. The table and board at 80×24 match in colour, `NO_COLOR`, and light. The hardware cursor equals the focused cell's and card's screen cell. Under `NO_COLOR` the table's spans have only `default` colour intents, the focused cell is `INVERSE`, and its row starts with `▌`. The focused card is `INVERSE`. The colour and light snapshots are identical text, with no style assertion (VER3) | `Passed` |
| `V45` | `S16`, `S17`, `S24` | `DES14` | same file | The formula board toolbar shows `⊘ moves off · group: late · 4 cards`, and `L` toasts "Moves are off: this board groups…". The cards view shows `ⓘ cards view is not supported yet; showing a table` | `Passed` |
| `V20` | `S11` | `DES11` | `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` | No match (exit 1). The design's unbounded form `rg '\.base'` matches only `...baseBindings` (`main.ts:155`), a spread, not an extension test | `Passed` |
| Kanban gate | `S16` | `DES9` | `rg -n 'kanban-test' src` and `rg -n 'kanban-test' src -g '!*.test.ts'` | The unfiltered form matches only colocated tests (`base-commands.test.ts`, and P2-G1's `kanban.test.ts`, `views.test.ts`). The non-test form has no match. `test/support/state.ts:77` is the only registration | `Passed` |
| `KANBAN_TYPE` | `S16` | `DES9` | inspect `src/core/features/bases/types.ts:8` | `KANBAN_TYPE: string \| undefined = undefined`. `registries()` registers the board only when it is defined | `Passed` |
| Registration mirror | `S23` | `DES16` | compare `src/app/main.ts:127-163,270` and `test/support/state.ts:59-96`, `test/support/ui.ts:64` | Both register `baseFileType`, `baseEditorKind`, `baseCommands`, `baseBindings`, `layouts` (with the `KANBAN_TYPE` guard), and `viewContexts "base"`. Only `testRegistries` adds `kanban-test`. `registerEditorView("base")` is in `main()` and `mountShell` | `Passed` |
| `update` purity and serial queue | `S19`, `S22` | `DES11`, `DES13` | inspect `base-*.ts`, `effects.ts:298-348` | Reducers emit effects only. `patchFrontmatter` runs inside `serial`, follows pending moves, uses `write(…, cur.stamp)`, `ownOps.noteWrite`, and `index.notify`. One impurity: the focus fallback reads the module memo's previous model (VER5) | `Passed` |
| Work-process identifiers | None | None | `git diff cb4593d 80ea2c8 -- src test` added lines searched for W/REQ/DES/S/V/UV/phase/task IDs | No match | `Passed` |
| Fast gate | `S23` | `DES16` | `bun run check` | Biome, tsc, and knip are clean. 984 pass, 0 fail; 4.46 s wall | `Passed` |
| Full suites | `S23`, `S24` | `DES16` | orphan check → `bun run test:ci` → orphan check | No `so`/`bun` process before or after. 180 pass, 0 fail, 49 snapshots, 33.0 s. The only snapshot file added in the range is `test/ui/__snapshots__/bases.golden.test.ts.snap`. No existing golden changed | `Passed` |

## Findings

### P2-G2-VER1 — Minor — UI Conformance — The status line says `NORMAL` in base windows and during a cell edit

- **System Design:** `W26100423LX-REQ13@R1 → DES14 → S24 → V40`
- **UI Design:** `RM261003ABZP-UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`; `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1`
- **Evidence:**
  - Every base golden shows ` NORMAL  │ tasks.base … 1:1` (`test/ui/__snapshots__/bases.golden.test.ts.snap:26,54,82,138,…`).
  - This includes the cell-edit frame, where line 110 shows `NORMAL` while line 109 shows `editing — ⏎ write to frontmatter · esc cancel`.
  - The accepted mockup sets the mode from the edit: `mode: app.edit ? "INSERT" : "BASE"` (`ui-mockups/m6-bases.html:258`).
  - UREQ11@R1 requires every state, mode included, to stay distinguishable.
  - The implementer recorded this as deviation 10.
- **Impact:**
  - While a cell is edited, typed characters go into the cell, but the mode badge says `NORMAL`.
  - A user relying on the badge, especially under `NO_COLOR`, sees no mode change between navigating and editing.
- **Required resolution:** The status line shows a base mode label (`BASE`) in a base window and an editing label (`INSERT`) while `kindState.edit` is set. Alternatively, record a user-approved deviation from M6@R1 in the goal.
- **Required proof:** The bases goldens show the base label in the table frame and the editing label in the edited-cell frame (`bun test test/ui/bases.golden.test.ts`). Otherwise, the deviation and its approval are recorded in the goal.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER2 — Minor — Specification Omission — UREQ9 cell-editor suggestions, list chips, and the filter-expression summary are neither built nor deferred

- **System Design:** `W26100423LX-REQ8@R2 → DES12, DES14 → S15, S24 → V29, V40`
- **UI Design:** `RM261003ABZP-UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`
- **Evidence:**
  - UREQ9@R1's acceptance criteria require:
    - "text with suggestions … lists as chips" (`rm261003abzp-ui-requirements.md:155-158`);
    - a toolbar "filter and sort summary".
  - M6@R1 S2 is captioned "existing values are suggested" (`m6-bases.html:407`). The mockup draws an "existing values" popup and a `list · tags` chip editor (`:188-191`), and its toolbar shows the filter expression `⧩ status ≠ done` (`:123`).
  - The implementation has none of these:
    - `cellEditKey` edits only plain text (`src/core/state/base-commands.ts:476-523`);
    - lists are typed comma-separated (`validateCell` default branch, `:430-437`);
    - the toolbar shows `⧩ filters on|off` (`base-view.ts` `statusOf`).
  - No plan part assigns or defers these items: `rg -i 'suggest|chip'` finds nothing in the system design, plan context, or plan parts 2 and 3. The implementer recorded the toolbar reduction as deviation 8.
- **Impact:**
  - US7@R1 ("behave as in M6") is only partly realized for text and list cells, and for the toolbar summary.
  - These obligations would leave DI4 unowned and silently undelivered.
- **Required resolution:** Either implement suggestions for text cells, chip editing for list cells, and the filter-expression summary, or record an explicit, user-approved deferral with an owner in the goal and plan. Never leave them unowned.
- **Required proof:**
  - If implemented, component or unit tests show:
    - a text cell edit listing existing values;
    - a list cell adding and removing a chip and writing the list;
    - the toolbar showing the active filter expression.
  - If deferred, the goal and plan record the deferral, its approval, and its owner.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER3 — Minor — Test Coverage — Colour and light base goldens hold no style evidence

- **System Design:** `W26100423LX-REQ13@R1 → DES14 → S24 → V40, V45`
- **UI Design:** `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1`
- **Evidence:**
  - `test/ui/bases.golden.test.ts:72-85,120-132` snapshot only `m.frame()` text for the colour, `NO_COLOR`, and light variants.
  - The colour and light table snapshots are byte-identical (`diff` of snap lines 4–30 and 60–86 is empty).
  - Only the `NO_COLOR` table checks colour intents (`:87-104`). The `NO_COLOR` board checks the focused card's `INVERSE` but not that the frame has no colour (`:134-147`).
  - The project pattern for theme goldens snapshots per-theme cell styles (`test/ui/shell.golden.test.ts:272`, `cellStyle(…)`). The same gap was raised for the calendar in `P1-G2-VER3`.
  - The command-level `file.*` grouping refusal ("Moves are off: this board groups by a file property") has no test. Only the formula case is covered (`base-commands.test.ts:318-324`).
- **Impact:**
  - A missing or wrong `base*` token in the light or dark palette would still pass, for example `baseFocus`, `baseMarker`, `baseWarn`, or the lane dots.
  - A colour leak on the board under `NO_COLOR` would also pass.
  - A wrong `file.*` explanation would also go unnoticed.
- **Required resolution:**
  - For each theme variant, assert or snapshot the style (fg, bg, attrs) of the focused cell, the focused card, the `⊘ moves off` notice, and a lane dot.
  - Assert that the `NO_COLOR` board frame has only `default` colour intents.
  - Add a command test for a board grouped by a `file.*` property.
- **Required proof:**
  - `bun test test/ui/bases.golden.test.ts` passes with per-theme style evidence that differs between dark and light.
  - `bun test src/core/state/base-commands.test.ts` passes with the `file.*` refusal case.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER4 — Minor — Usability — Refusals in a base window point to `<leader>m`, which does nothing there

- **System Design:** `W26100423LX-REQ7@R2 → DES11 → S13 → V25`
- **UI Design:** `RM261003ABZP-UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`
- **Evidence:**
  - The base file type's single view is `readOnly` (`src/core/features/bases/file-type.ts:51-57`). As a result, `:s/a/b/` and template insertion in a base window are refused with `READ_ONLY_HINT` = "reading mode — <leader>m to edit". The sources are `src/core/state/buffers.ts:48`, `commands.ts:160`, and `note-commands.ts:177`.
  - A scratch probe showed `:s/a/b/` in `tasks.base` → "reading mode — <leader>m to edit".
  - `<leader>m` in the same window → "no mapping for <leader>m".
  - `:w` in the same window correctly says "read-only file".
- **Impact:** The user is told to press a key that does nothing, in a file `so` must never edit. This is the opposite of UDES9's "explained restrictions".
- **Required resolution:** Refusals of text edits in a base window name the real restriction, for example "read-only file", consistent with `:w`. They must not mention the Markdown reading-mode toggle.
- **Required proof:** A unit test in `src/core/state/base-commands.test.ts` runs `:s/a/b/` in a base window and asserts the read-only message, no text change, and no effect.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER5 — Minor — Maintainability — The base focus fallback depends on the memo's history, so reducer results are not a pure function of their inputs

- **System Design:** `W26100423LX-REQ12@R1 → DES11, DES12 → S22 → V41, V42`
- **UI Design:** `None`
- **Evidence:**
  - When `ws.focus.path` is no longer in the view, `derive` takes the row or card from the previously memoized model of the same window id (`src/core/state/base-model.ts:211-214`, `prev.focus`).
  - The memo is a module-level `Map` (`:56`). Commands read `a.m.focus` from this model (`base-commands.ts:103-120,259-299`), so the result of `update(s, a)` can depend on which states were evaluated earlier for that window id.
  - This hazard already produced the bug fixed in `b6ae4a8`. The fix narrowed the fallback to windows with a focused path but did not remove the dependency.
  - `BaseWindowState.scroll.row` is never read (`rg 'scroll\.row'` matches only its initialisers). The view keeps the row scroll privately in `BaseView.rowTop`.
- **Impact:**
  - Project rules state that `update` is pure. Here, two equal states can give different focus after a note leaves the view, depending on cache history, for example across test apps or after the memo slot is reused.
  - The dead `scroll.row` field suggests window state that does not exist.
- **Required resolution:**
  - Keep the last focused row and card index in `BaseWindowState`. Commands already write focus there.
  - Use that index for the near fallback, so the model is a pure function of its key.
  - Either use or remove `scroll.row`.
- **Required proof:** A unit test derives the model for the same state with an empty memo and with a memo primed by a different state of the same window id, and gets the same focus. Existing `base-model.test.ts` cases still pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - **Read-only base window:** registration and the read-only buffer; `readPropertyTypes` on a new base window; opening at a subpath through the restore-pending path; every unbound printable key dropped; `:w` refused; recreate refused; leaving a base buffer silent.
  - **Overrides and commands:** sort, group, and filter in window state only; read-only explanations for `file.*` and formula cells; number and date stepping; invalid text; `Esc`; text replacement with no command leakage; checkbox toggle and its refusal; card moves including `None` removal and edge no-op; formula move refusal; view switching by number, `Tab`, and the picker; `Enter` opening the note.
  - **Write-back:** the open-note write (one undo step, autosave, diff toast, `u` restore); the closed-note effect; an invalid frontmatter refusal; `frontmatterPatched` ok and failed; reducer routing; the runner's write-only-while-unchanged check.
  - **Integration:** closed-note move and stale refusal through the real runner, watcher, and log.
  - **View model and UI:** waiting state, focus follow, view fallback, version-1 restore, parse error, cards fallback, memo hits, dirty overlay, and the fresh-window first row; text goldens for the table, edit error, board, waiting, empty, moves-off, cards notice, and wide tabs; the hardware cursor on the cell and card; `NO_COLOR` attributes for the table and card.
- **Missing:**
  - Per-theme style evidence for the colour and light base goldens, and a no-colour intent check for the board (VER3).
  - A command test for `file.*` grouping refusal (VER3).
  - A test that base-window text-edit refusals show a base-appropriate message (VER4).
  - A purity test for the focus fallback (VER5).
  - A test that `writeProperty` edits an unlisted embed buffer in memory, the behavior kept by Scope Changes item 1.

## Scope Changes

The implementer's recorded deviations, judged against the governing sources:

1. **`writeProperty` also edits unlisted embed buffers.** The design's `b.listed !== false` would send a closed-note `patchFrontmatter` for a note that is loaded only as an embed. The runner's own-op suppression would then keep the watcher from refreshing that unlisted buffer, so the embed would go stale. Unlisted buffers are autosaved and are not evicted while dirty (`src/core/state/embeds.ts:69-75`), so the in-memory edit is saved. Accepted as justified. It is untested (see Test Coverage).
2. **`:w` message versus silent autosave refusal.** `writeActive` returns "read-only file" (`commands.ts:243`), and `writeBuffer`/`writable` refuse silently. The design puts the message in `writeBuffer`, but the observable result is the same for `:w`, and autosave on leave stays silent. Accepted.
3. **`H`/`L` scroll table columns.** This follows the design's own `moveCard` sketch ("table: H/L scroll columns", system design §7 `base-commands.ts`). It is not a deviation. Table row scrolling lives in `BaseView.rowTop`, which leaves `scroll.row` dead (VER5).
4. **A refused patch leaves the index until the watcher reports.** This matches the design's Failure and Recovery Rules ("the index is unchanged"), and V36 proves the board then shows the disk value. Accepted.
5. **Painter signatures take `theme` and an options object, and layout functions are split out.** This is needed because painters must not read app state, and because `WindowTree.cursor()` is read before render. Painters draw only inside their rect. Part 3's `paintBaseEmbed` must call the implemented signature. Accepted.
6. **`b6ae4a8` fix.** It is a correct narrowing of the stale-row bug, with a regression test. The underlying dependency remains (VER5).
7. **Board layout.** Boxed cards are used at 100 or more columns, one-line cards below 100, lanes are at least 18 cells, and `‹ ›` marks lanes scrolled off. This matches the Kanban board component's responsive rules. Accepted.
8. **Toolbar shows `⧩ filters on|off`, not the expression.** This falls short of UREQ9's "filter … summary" and M6's `⧩ status ≠ done` (VER2).
9. **Inline error covers the rest of the next line.** The error sits under the cell, as the Base table "invalid" state requires, but hides that line's later cells while shown (snapshot line 94). Accepted as a presentation choice.
10. **Status line shows `NORMAL` during a cell edit.** Not accepted (VER1).
11. **`i` on a checkbox cell toggles it.** This matches M6's `startEdit` (`m6-bases.html`, checkbox branch). The golden's inline-error case was moved to a date cell, which is what UV8@R1 asks for ("invalid date shows inline error"). This test change happened before GREEN, inside the group's own new test file, so no existing golden changed. Accepted.
12. **Card titles are file base names.** This matches M6's `r.file` card titles. Accepted.
13. **The moves-off explanation is an `info` toast.** M6 uses a `warn` toast ("Can't move cards in this view"). The explanation is present and no write occurs. Recorded as an observation, not a finding.

## Unverified Items

- **V30 (Kanban fixture provenance):** `Pending — user fixture`. It is assigned to P2-G1-T5, not this group, and `KANBAN_TYPE` stays `undefined`.
- **Real-terminal rendering:** Not exercised. The goldens use the OpenTUI test renderer, and no PTY session with a base file was run, because the plan assigns no e2e case for base windows. M6 visual conformance was judged from text goldens and `NO_COLOR` attribute checks.
- **Benchmarks:** Not run. The plan assigns no bench to P2-G2 (V44 belongs to Part 3).

## Blockers

None.
