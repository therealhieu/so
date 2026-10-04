# P1-G2 Verification Report

## Scope

- **Group:** `P1-G2`
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g2-implementation-report.md`

Verified range `f296fc5..9530f5b` (task commits `4bcea47`, `db27ea5`, `97f84ef`, `195bc95`, `9530f5b`); checks ran at `c10496f`, whose only change after `9530f5b` is the implementation report. Probe tests ran from the session scratchpad and were not committed.

## Status

`Failed`

The group's checks pass and most chains are satisfied, but one Major finding remains: an embed read that answers after its request was dropped opens the target as a listed buffer and shows it in the active window (P1-G2-VER1). Three Minor findings follow: `:s` edits text in reading view, deferred assertions are missing, and the implementation report misstates T1.

## Assigned Traceability

- **System Design:** `REQ1@R1, REQ4@R1, REQ5@R1, REQ6@R1 → DES1 (views, defaultView, EditorView input), DES4, DES5, DES6, DES8 → S1, S5, S6, S7, S9, S16 (EditorView has no Markdown), S18 (widget painter registry) → V1, V2, V11, V12, V13, V16, V25, V37, V49`; plus V10's painter-side `linkUnresolved` styling of a missing embed and the `markdownViewContext` embed and fold answers for V11, V13, and V49 that P1-G1 deferred to this group.
- **UI Design:** `None — no W UI design; parent RM261003ABZP-UV3@R2 (V16, V25) and RM261003ABZP-UV10@R1 DI3 states (NO_COLOR, light theme, 80×24) are traced directly.`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ6, REQ1 → DES1, DES13 → S1 → V1` | None | Notes open in `preview.mode` (`live` by default) and code files in `source`. A PH1 session with `view: "source"` restores notes in `live`. | `src/core/state/buffers.ts:343` `defaultView` (in `buffers.ts`, as design §7 places it; the report's "file-type.ts" is wrong); `onFileLoaded` `view: defaultView(ft, s.config)`. The persisted `view` is written by `session.ts:92` and read nowhere. `session.test.ts` "a restored note opens in live view" shows the restored window's `a.md` (saved `source`) loads `live`. | `Satisfied` (report text mismatch: P1-G2-VER4) |
| `REQ6 → DES1 → S1, S16` | parent UV3@R2 | Three Markdown views; `EditorView` builds the input through `reg.viewContexts`; `TextView.folds` stays empty; no Markdown in `EditorView` | `file-type.ts` `rendered("live")`, `source`, `rendered("reading")` (`readOnly`); `text-view.ts:523` `layoutFrame` builds `ViewHost` (`imageSize: () => undefined`, `cellAspect: 0.5`, `:549`) and `spec.input(b.analysis, viewContexts.build(...))`; `NO_FOLDS` | `Satisfied` |
| `REQ4 → DES4 → S5 → V11, V12, V49` | None | One read per path; target unlisted, never shown, evicted when no longer embedded; refused target recorded per note, not re-requested, no notice; filters in session, bufferline, `:bn`/`:bp`, picker; no new top-level key | `embeds.ts` `embedTargets`, `syncEmbeds`, `embedRequested`, `settleEmbedRead`; `update.ts:116` wrapper; `buffers.ts:362` `embedOnlyRead`, `onFileRefused`, `showBuffer` lists via `listBuffer`; `listedBuffers` used in `session.ts`, `picker.ts`, `commands.ts` `cycleBuffer`, `bufferline.ts`, `removeBuffer` | `Mismatch`: an embed read that answers after its note dropped the request is shown in the active window, and a re-request while the first read is outstanding sends a second read (P1-G2-VER1) |
| `REQ5 → DES5 → S6 → V13` | None | Folds keyed by block id: survive inserts above, reset on edit, dropped on deletion; `[!x]-` starts folded | `markdown-commands.ts` `toggleFold` (ids in `WindowState.content.folds`, stale ids pruned on each toggle); `showBuffer` drops `folds` with new content; `markdown-view.ts` passes folds to renderers | `Satisfied` |
| `REQ6, REQ1 → DES8 → S9 → V2` | None | `<leader>m` cycles live → source → reading with `mode: <view>`; `<leader>x`/Enter toggle a task in one undo step; Enter otherwise follows the link; `<CR>` moved off `link.follow` | `markdown-commands.ts` `cycleView`, `toggleTask` (`applyBufferEdits`), `noteEnter`, `markdownBindings`; `link-commands.ts` `<CR>` removed, `followLink` exported; `rg '"<CR>", id: "link.follow"' src` → no match | `Satisfied` |
| `REQ6, REQ1 → DES8 → S9 → V37` | None | Reading view refuses every key edit with `reading mode — <leader>m to edit`; motions work | `keys.ts:238` `READ_ONLY_HINT`; `:267-271` refusal on text change or Insert, through `refusedKey`; `toggleTask` refuses in read-only views | `Mismatch`: `:s` changes text in reading view (P1-G2-VER2) |
| `REQ5, REQ1, REQ4 → DES6, DES4 → S7, S5 → V16` | parent UV3@R2 | Sign column `▕`/`⚠`; widget rows painted through the registry; `─` rule across the width; embed rows with `… N more lines`; folded callout as one row; missing embed in `linkUnresolved` | `text-view.ts:40` `gutterWidth` +1; `renderSelf` `gutter(..., sign)`; `:459` `widgetPainters.get(type) ?? paintMissing`; `widgets/rule.ts` `paintRule`; `widgets/embed.ts` `paintEmbed` (`:67-68` missing → `linkUnresolved`) | `Satisfied` by code and V16; the missing-embed style is untested (P1-G2-VER3) |
| `REQ1, REQ6 → DES8, DES1 → S9, S16 → V25` | parent UV3@R2 (`sync.ts`) | Code files paint raw lines, empty sign column; note keys do nothing; Enter moves down | `markdownBindings` scoped to `markdown`; `keys.ts:220` `nextLineCommand` and `:226` `editorBindings` (`<CR>` → `j^` in Normal for all file types) | `Satisfied` |
| `REQ1 → DES6, DES2 → S18` (G4 producer) | None | `PaintTarget`, `WidgetPainter`, `widgetPainters`, `registerWidgetPainter` as in design §6; unknown type paints dim `[type]`; registered in `main.ts` and `test/support/ui.ts` | `src/ui/widgets/registry.ts` matches the §6 shape field for field; `text-view.ts:87` `paintMissing`; `main.ts` registers `embed`, `text`, `rule` | `Satisfied` (G4 stays `Pending` until merge) |
| `REQ1 → DES6 → S7` (tokens) | parent RM261003ABZP-UV10@R1 (DI3 states) | Markdown, sign, and placeholder tokens with NO_COLOR fallbacks; NO_COLOR emits no colour; states differ by attribute or glyph; light golden; 80×24 unclipped | `theme.ts` adds `mdHeading1`–`4` … `imagePlaceholder`, each with a fourth (NO_COLOR) attribute; every token named in `src/core/lang/markdown` and `src/ui/widgets` exists in `TOKENS` | `Satisfied` (prompt row not asserted, P1-G2-VER3) |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V1` | `S1` | `DES1, DES13` | `bun test src` (in `bun run check`); inspection of `session.ts`, `buffers.ts` | Both `session.test.ts` cases pass: a restored window's note and a non-window note load `live`; `sync.ts` loads `source`; `preview.mode = "reading"` gives notes `reading` and `sync.ts` `source` | `Passed` |
| `V2` | `S9, S1` | `DES8` | `markdown-commands.test.ts` | Cycle gives `source`/`reading (read-only)`/`live` messages; `<CR>` on `- [ ] x` gives `[x]`, marks dirty; `<leader>xu` restores in one undo; Enter on `[[other]]` emits `read other.md`; code file unchanged | `Passed` |
| `V11` | `S5` | `DES4` | `embeds.test.ts` "each embed target is read once and opens unlisted" | Reads `[b.md, c.md]` once (C embedded twice); `requested` on A; keystroke sends no read; B `listed: false`, not shown, leaves `requested`; `recent` unchanged | `Passed` (the race in P1-G2-VER1 is outside the case) |
| `V12` | `S5, S1` | `DES4` | `embeds.test.ts` eviction case | Snapshot buffers `[a.md]`, no `embeds` key; `:bd` evicts B; `:e b.md` lists and keeps B. The case opens B with `:e`, not Enter on the embed; a probe confirmed Enter on `![[b]]` shows `b.md` | `Passed` |
| `V49` | `S5` | `DES4` | `embeds.test.ts` refused case | One read for D recorded on A and E; after `fileRefused` both have `refused: [d.md]`, no toast or message; keystroke sends no read; `ctx.embed("d.md")` is `"missing"`; `dd` clears D from A only; top-level keys equal `fresh()` | `Passed` |
| `V13` | `S6` | `DES5` | `markdown-commands.test.ts` fold cases | `za` adds the id; `O` above keeps it; editing the title shows the body; `dap` then `za` gives `nothing to fold here` and `folds: []`; `> [!tip]-` renders `★ Hidden ▸` with no toggle | `Passed` |
| `V16` | `S7, S5` | `DES6, DES4` | `test/ui/live-preview.test.ts` | One `▕` row (`## Quotes and callouts`); folded tip one row with `▸`; embed `│ • Goal 1` and `╰ … N more lines`; `[image]` placeholder; rule spans `100 − 6` cells | `Passed` |
| `V25` | `S9, S16` | `DES8, DES1` | `test/ui/live-preview.test.ts` | Every `sync.ts` row equals its raw line; sign column blank; `<leader>m` and `gd` leave view, text, and path; Enter moves one line | `Passed` |
| `V37` | `S9` | `DES8` | `test/ui/live-preview.test.ts`; probe `:s/foo/bar/<CR>` in reading view | `x`, `i`, `p`, `dd` leave text, stay Normal, show the hint; `j` moves. Probe: `:s` changed `foo` to `bar` with no hint | `Failed` (P1-G2-VER2) |
| Parent UV10@R1 DI3 states | `S7` | `DES6, DES2` | `test/ui/theme.golden.test.ts` "live view states" | NO_COLOR: every span fg/bg intent is `default`; unresolved link attrs differ from resolved and reveal; one `▕` on `# States`; `⚠` on `![[table.broken]]`; title row and statusline unclipped; light-theme styles and frame match goldens | `Passed` (prompt row not asserted, P1-G2-VER3) |
| Embed read race (V11/V49 invariants) | `S5` | `DES4` | Probe: load A `![[b]]` → `dd` → `fileLoaded(b.md)`; and A `![[b]]` → `dd` → load E `![[b]]` | First: active window shows `b.md`, B listed. Second: a second `read b.md` while the first is outstanding | `Failed` (P1-G2-VER1) |
| Fast gate | None | None | `bun run check` | Biome, tsc, knip clean; 694 pass, 0 fail, 18 snapshots | `Passed` |
| Component suites | None | None | `CI=true bun run test:ci` | 120 pass, 0 fail, 28 snapshots, 546 expects | `Passed` |
| No Markdown in the generic editor | `S16` | `DES1` | `rg -n "markdown\|Markdown" src/ui/editors src/core/kernel`; same over `f296fc5` files; `rg "markdown\|Markdown\|livePreview" text-view.ts widgets/registry.ts` | No matches at base or HEAD | `Passed` |
| `paintPreview` unchanged | None | None | `git diff f296fc5..HEAD -- src/ui/editors/text-view.ts \| grep -c paintPreview`; function body extracted from both commits and compared with `cmp` | 0 hunks; 77-line bodies byte-identical | `Passed` |
| Frozen surfaces and boundaries | `S16` | `DES1` | `git diff --stat f296fc5..HEAD -- src/core/kernel src/core/state/types.ts`; `rg core/state src/core/lang`; `@opentui` outside `src/ui`; `bun test test/boundaries.test.ts` | Empty diffs; no matches; boundaries pass | `Passed` |
| Viewport-only layout and bounded `fitCursor` | `S7` | `DES6` | Inspection of `text-view.ts:378-395`, `:523-580`; probe counting heading-renderer calls in a 5,000-heading note at 100×40 | Loop exits on fit, `topLine >= cursor.line`, or `tries > rows`. `FILL_PASSES = 3` widens `visible` only by empty rows, so at most `top + 4·rows`. Probe: 37 calls per frame (one per visible block) after `2500G` and after `j` | `Passed` |
| Reducer identity and throwing step | `S5` | `DES4` | Inspection of `embeds.ts:37`, `:76-81`; `update.ts:116` | `syncEmbeds` returns `r` when buffers and index are unchanged or nothing changed; it runs inside the existing `try` | `Passed` |
| Snapshot review | None | `DES1, DES6` | `git show 4bcea47 195bc95 9530f5b -- test/ui/__snapshots__` | `4bcea47`: `- ` → `•`, `##` → `▊`, statusline `source` → `live`. `195bc95`: one-cell shift and `▕` on revealed cursor rows only. `9530f5b`: additions only | `Passed` |
| No work-process identifiers | None | None | Added lines in `src`, `test` scanned for `W261…`, `REQ#`, `DES#`, `UV#`, `V#@`, `P#-G#`, `G4`, `DI#`, `RM261…` | No matches | `Passed` |
| Expectation-only test edits | None | None | Diff of the seven listed tests; editor-options suite rerun on `.md` notes with the sign cell normalized | Edits only reflect `live` default, `<CR>` move, new which-key entries, sign column. All 8 editor-option cases pass on `.md` live notes (wrap, nowrap, tall line, 12,000 lines, tabs) | `Passed` |
| G2 gate baseline | None | None | `git merge-base --is-ancestor 9adb285 HEAD` | Exit 0; goal Gate Evidence records it at `0c111be` before P1-G1-T1 | `Passed` |
| G4 producer outputs | `S18` | `DES2, DES6` | Compare `widgets/registry.ts` and `BufferState.listed`/`embeds` with system design §6 and phase file `:71`, `:147`, `:205-230` | Shapes match; unlisted buffers exist. The phase invariant that unlisted targets stay invisible is broken by P1-G2-VER1. Proof (V41) belongs to P3-G1 | `Insufficient` until P1-G2-VER1 closes; gate stays `Pending` |

## Findings

### P1-G2-VER1 — Major — Correctness — A late embed read opens its target in the active window

- **System Design:** `REQ4@R1, DES4, S5, V11, V49` (invariants: an unlisted buffer is never shown; at most one outstanding `read` per path)
- **UI Design:** `None`
- **Evidence:** `syncEmbeds` drops a path from a note's `requested` as soon as the note stops embedding it (`src/core/state/embeds.ts:48-51`), even though its `read` is still outstanding. `onFileLoaded` then sees no requester (`src/core/state/buffers.ts:362`), so it opens the path as an ordinary listed buffer and shows it. Probe (scratchpad, `createUpdate(testRegistries())`):

  ```text
  load a.md "![[b]]" → effects [read b.md]
  dd                → a.md embeds {requested: [], refused: []}
  fileLoaded(b.md)  → active window shows b.md; b.md listed
  load a.md "![[b]]" → dd → load e.md "![[b]]" → second [read b.md] while the first is outstanding
  ```

  Closing the note (`:bd`) before the read answers takes the same path. The design's §7 `onFileLoaded` predicate has the same gap, so the code follows the prescribed shape but breaks the design's stated invariants.
- **Impact:** A file the user never opened replaces the note in the window and joins the session, bufferline, and `:bn` cycle. Reads go through the serial file-system queue, so a slow write ahead of them widens the window for this race (for example, `u` right after pasting an embed). Duplicate reads also break the one-read-per-path invariant that DI4's `base` embeds will rely on (G4).
- **Required resolution:** A read requested only for an embed never shows or lists its target when it answers after the request was dropped (the target is discarded or opened unlisted and then evicted), and no second `read` is emitted for a path whose first read is still outstanding. If this needs a rule beyond design §7 `onFileLoaded`, record the refinement for the orchestrator.
- **Required proof:** New `src/core/state/embeds.test.ts` cases: (1) load A embedding B, `dd`, `fileLoaded(B)` → the active window still shows A and no listed buffer has path B; (2) the same with `:bd` before `fileLoaded(B)`; (3) A embeds B, `dd`, E embeds B before `fileLoaded(B)` → no second `read b.md`. Then `bun run check` and `bun run test:ci` pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G2-VER2 — Minor — Specification — `:s` edits text in reading view

- **System Design:** `REQ6@R1, DES8, S9, V37` (`keys.ts` invariant: "A read-only view never changes buffer text through keys")
- **UI Design:** `None`
- **Evidence:** The refusal only checks the engine result in `runVim` (`src/core/state/keys.ts:264-271`). `:s` runs through `executeEx` → `substitute` (`src/core/state/commands.ts:121`, `:138`), which never checks the view. Probe: reading view on `foo`, keys `:s/foo/bar/<CR>` → line `bar`, no hint. The implementer disclosed this, but no approved scope change covers it.
- **Impact:** A deliberate `:s` in a view the design defines as read-only changes and autosaves the note.
- **Required resolution:** In a read-only view, `:s` leaves the text unchanged and shows `reading mode — <leader>m to edit`; other views behave as before.
- **Required proof:** A test in `src/core/state/markdown-commands.test.ts` or `test/ui/live-preview.test.ts`: reading view, `:s/foo/bar/<CR>` → text unchanged and the hint shown; in `live`, the same keys substitute.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G2-VER3 — Minor — Test coverage — Deferred and planned assertions are missing

- **System Design:** `REQ4@R1, DES4, S5, V10 (painter side), V11, V16`; `REQ1@R1, DES6, S7`
- **UI Design:** `parent RM261003ABZP-UV10@R1 (80×24 prompt text)`
- **Evidence:** P1-G1's verification report (`p1-g1-verification-report.md:130`, `:144`) deferred two items to this group: the `linkUnresolved` paint of a `missing` embed (to V16) and the `markdownViewContext` embed precedence (to V11/V49). In this group:
  - `rg "linkUnresolved|\"missing\"|loading" test/ui src/core/state/*.test.ts` finds only `embeds.test.ts:130` (`"missing"` for a refused target).
  - No test asserts the `"loading"` answer while a target is requested (`markdown-view.ts:42`).
  - No test asserts the missing-embed title style (`widgets/embed.ts:67-68`).
  - P1-G2-T5's outcome also requires that no prompt be clipped at 80×24, but `theme.golden.test.ts` asserts only the title row and statusline.

  Code inspection shows the behaviour is correct; only the proof is missing.
- **Impact:** A regression in the missing-embed style, the loading answer, or prompt clipping at 80×24 would pass every suite.
- **Required resolution:** Tests cover all three behaviours.
- **Required proof:** These tests pass:
  - in `embeds.test.ts`, after A requests B and before `fileLoaded(B)`, `ctx.embed("b.md")` is `"loading"`;
  - in `test/ui/live-preview.test.ts`, a note embedding an unresolved or refused target paints `↳ <title>` with the `linkUnresolved` cell style;
  - in `theme.golden.test.ts`, the 80×24 NO_COLOR case shows a prompt or message line unclipped.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G2-VER4 — Minor — Traceability — The implementation report misstates T1

- **System Design:** `REQ6@R1, DES1, S1, V1`
- **UI Design:** `None`
- **Evidence:** The report's T1 row lists `src/core/lang/markdown/file-type.ts:defaultView` and says "session restore keeps the saved view". In the code, `defaultView` is at `src/core/state/buffers.ts:343`, where design §7 places it, and no code reads the persisted `view`: restore ignores it, as design §5 Open and restore requires. `session.test.ts` "a restored note opens in live view" proves the behaviour.
- **Impact:** The traceability record contradicts both the design and the code, which can mislead the overall verification and parent synchronization.
- **Required resolution:** The report's remediation evidence states that `defaultView` lives in `buffers.ts` and that a restored note opens in `live`, ignoring the persisted view.
- **Required proof:** Read the implementation report's remediation section.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - default and restored views (V1);
  - view cycle, task toggle with one-step undo, Enter task-or-link (V2);
  - fold lifecycle and `[!x]-` default (V13);
  - single reads, unlisted opening, eviction, session filter, listing on open, shared and refused reads, per-note state, no new top-level key (V11, V12, V49);
  - opening a target whose read is in flight;
  - reading-view refusal of `x`, `i`, `p`, `dd` (V37);
  - sign column, rule, embed rows, folded callout (V16);
  - code-file isolation and Enter fallback (V25);
  - NO_COLOR, light theme, and 80×24 DI3 states (UV10);
  - snapshot updates for live rendering and the sign column.
- **Missing:**
  - late or duplicate embed reads (P1-G2-VER1);
  - `:s` in reading view (P1-G2-VER2);
  - the `"loading"` answer, the missing-embed `linkUnresolved` paint, and 80×24 prompt clipping (P1-G2-VER3).
  - `test/ui/editor-options.test.ts` now opens `.txt` files, so wrap, tall-line, and wide-gutter cursor handling is no longer exercised in `live`. A probe rerun of that suite on `.md` notes passed all 8 cases once the `▕` cell was normalized, so this is a coverage note, not a defect.
  - V12's "Enter on the embed" step is exercised with `:e`, not Enter. A probe confirmed Enter shows the target.

## Scope Changes

- `<CR>` in Normal mode for every file type: `nextLineCommand` (`j^`) with `editorBindings` in `src/core/state/keys.ts`, registered in `main.ts` and `test/support/state.ts`. V25 needs Enter to move down on code files, and the kernel has no Normal `<CR>`. It is placed in `keys.ts` to avoid an import cycle with `commands.ts`. Counts and operators are not honoured (`3<CR>` and `d<CR>` do nothing), which matches the behaviour before this group. Accepted.
- `layoutFrame` widens `visible` up to `FILL_PASSES = 3` times by the number of empty rows, so lines hidden by folds or comments do not leave blank rows. This departs from the design's `{ from: top, to: top + rows }` but stays bounded at `top + 4·rows`. Accepted.
- `syncEmbeds` keeps an unlisted buffer that is dirty or saving (`embeds.ts:69-75`); `openPath` waits for an in-flight embed read through `awaitOpen` (`buffers.ts:304`); `refusedKey` clears pending operators and Visual mode on refusal; `toggleTask` refuses in read-only views. Each is consistent with the design's invariants. Accepted.
- Disclosed limits that need no action in this group:
  - the cursor column is approximate in reading view;
  - image widgets paint the dim `[image]` fallback until P1-G3-T4;
  - the test-only `broken` renderer stays registered for the test process;
  - the 80-column statusline omits the view name under the existing narrow policy (P2-G1 owns the statusline);
  - seven out-of-plan test files changed, with expectation-only edits that were reviewed.
- Omission: `:s` in reading view (P1-G2-VER2).

## Unverified Items

- V15 (cursor fit with sized image widgets) belongs to P1-G3-T4. In this group, `fitCursor` was checked by inspection, the 5,000-line probe, and the editor-option probe on `.md` notes.
- G4 producer proof (V38, V41) belongs to P3-G1; the gate stays `Pending` until the user merges the DI3 PR.

## Blockers

None
