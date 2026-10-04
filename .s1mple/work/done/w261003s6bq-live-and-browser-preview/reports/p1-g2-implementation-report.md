# P1-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-goal.md`
- **Plan Part:** `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-1-terminal-live-preview.md`
- **Group:** `P1-G2`
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`
- **Report:** `.s1mple/work/done/w261003s6bq-live-and-browser-preview/reports/p1-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G2-T1` | `src/core/lang/markdown/file-type.ts:defaultView`, the `live`/`reading` view specs with their `input` hook; `src/core/state/buffers.ts` (a new buffer opens in `defaultView`, and session restore keeps the saved view); `src/ui/editors/text-view.ts:EditorView` (builds `TextView` and the view input through the view-context registry with a `ViewHost`); `src/core/state/session.test.ts` (2 cases); `src/core/filetypes/registry.test.ts`, `src/core/state/status.test.ts`, `test/ui/shell.golden.test.ts` expectations; both golden snapshot files | RED: `bun test src/core/state/session.test.ts` → 2 fail. GREEN: `bun run check` → 684 pass, 0 fail; `bun run test:ci` → 115 pass, 0 fail, with snapshots updated | `4bcea47` | `Completed` |
| `P1-G2-T2` | `src/core/state/embeds.ts:embedTargets`, `syncEmbeds`, `settleEmbedRead`; `src/core/state/buffers.ts:awaitOpen`, `listBuffer`, `removeBuffer` (windows move only to listed buffers), `listedBuffers`; `session.ts`, `picker.ts`, `commands.ts`, `ui/views/bufferline.ts` (list only listed buffers); `update.ts` (runs `syncEmbeds`); `src/core/state/embeds.test.ts` (4 cases) | RED: `bun test src/core/state/embeds.test.ts` → 3 fail. GREEN: `bun run check` → 688 pass, 0 fail; `bun run test:ci` → 115 pass, 0 fail | `db27ea5` | `Completed` |
| `P1-G2-T3` | `src/core/state/markdown-commands.ts:markdownCommands` (`view.cycle`, `task.toggle`, `fold.toggle`, `note.enter`), `markdownBindings`; `src/core/state/keys.ts:READ_ONLY_HINT`, `readOnlyView`, `refusedKey`, `nextLineCommand`, `editorBindings`; `link-commands.ts` (`<CR>` binding moved to `note.enter`); `src/app/main.ts:registries` and `test/support/state.ts:testRegistries` wired together; `src/core/state/markdown-commands.test.ts` (6 cases); `test/ui/live-preview.test.ts` (reading view refusal); `keymap.test.ts`, `whichkey.test.ts` expectations | RED: `bun test src/core/state/markdown-commands.test.ts` → 4 fail. GREEN: `bun run check` → 694 pass, 0 fail; `bun run test:ci` → 116 pass, 0 fail; `rg '"<CR>", id: "link.follow"' src` → no match | `97f84ef` | `Completed` |
| `P1-G2-T4` | `src/ui/widgets/registry.ts:PaintTarget`, `WidgetPainter`, `widgetPainters`, `registerWidgetPainter`; `src/ui/widgets/embed.ts:paintEmbed` (`embed` and `text`); `src/ui/widgets/rule.ts:paintRule`; `src/ui/editors/text-view.ts:EditorView.show` (lays out once, advancing the top line until the cursor row fits), `layoutFrame` (`FILL_PASSES = 3`), `renderSelf` (sign cell, widget rows through `widgetPainters.get(type) ?? paintMissing`), `gutterWidth` (+1 sign cell); `src/ui/theme.ts:TOKENS` (`mdHeading1`–`4`, md tokens, `mdRule`, `signReveal`, `signError`, `imagePlaceholder`, each with a NO_COLOR fallback); `src/app/main.ts` and `test/support/ui.ts` register `embed`, `text`, `rule`; `test/ui/live-preview.test.ts` (2 cases); `editor-options.test.ts`, `links.test.ts`, `shell.golden.test.ts` expectations; both golden snapshot files | RED (reproduced on `97f84ef` with the T4 test file): `bun test test/ui/live-preview.test.ts` → 2 fail (`toHaveLength` on the `▕` row count; `toBe` on the sign-column text offset). GREEN: `bun run check` → 694 pass, 0 fail; `bun run test:ci` → 118 pass, 0 fail, 25 snapshots; `grep -n "markdown\|Markdown\|livePreview"` over `text-view.ts` and `widgets/registry.ts` → no match | `195bc95` | `Completed` |
| `P1-G2-T5` | `test/ui/theme.golden.test.ts` (`live view states` suite: NO_COLOR 80×24 case and light-theme golden; a throwing renderer registered for the `broken` render key); `test/ui/__snapshots__/theme.golden.test.ts.snap` (3 added entries). `src/ui/theme.ts` unchanged: every token used already had a NO_COLOR fallback | RED: `CI=true bun test --ci test/ui/theme.golden.test.ts` without the new snapshots → 2 fail ("Snapshot creation is disabled in CI environments"). GREEN: `bun test test/ui/theme.golden.test.ts` → 5 pass, 0 fail, 7 snapshots; `bun run check` → 694 pass; `bun run test:ci` → 120 pass, 28 snapshots | `9530f5b` | `Completed` |

### Group Change Range

- **Starting commit:** `f296fc5` (clean tree; no pre-existing staged or unstaged changes)
- **Final commit:** `9530f5b`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed` — 694 pass, 0 fail at `9530f5b`.
- `bun run test:ci` → `Passed` — 120 pass, 0 fail, 28 snapshots, 546 expect calls at `9530f5b`.
- `rg -n "markdown|Markdown" src/ui/editors src/core/kernel` → `Passed` — 0 matches at `f296fc5` and 0 at `9530f5b`; `src/ui/widgets/registry.ts` also has none.
- `paintPreview` unchanged → `Passed` — `git diff f296fc5..HEAD -- src/ui/editors/text-view.ts | grep paintPreview` → no hunk; the 77-line function body extracted from both commits is byte-identical.
- Frozen surfaces → `Passed` — `git diff --stat f296fc5..HEAD -- src/core/kernel` is empty; `src/core/state/types.ts` is untouched (no new top-level `AppState` key); `session.ts` still writes `version: 1`; `src/core/lang` has no `core/state` import; `@opentui` is imported only under `src/ui`.
- No work-process identifiers → `Passed` — added lines in `src` and `test` contain no `W…`, `REQ`, `DES`, `UV`, `V…@`, `P#-G#`, `G4`, or `DI3` tokens.
- Viewport bound through `EditorView` → `Passed` — temporary probe (not committed): a 5,000-line note in live view at 100×40, cursor at line 2500, one `j` plus frame. `TextBuffer.line` read 237 distinct lines (2265–2501) and took 0.4 ms. Of these, 175 reads come from the pre-existing code highlighter's `LOOK_BACK = 200` (`src/core/lang/code/highlight.ts:8`, last changed in DI1); the rest are the visible rows. No full-document work happens per frame.

**Snapshot review:**

| Commit | File | Change | Justification |
|---|---|---|---|
| `4bcea47` | `shell.golden.test.ts.snap`, `theme.golden.test.ts.snap` | `.md` notes render live: heading glyphs, `•` bullets, hidden link syntax; statusline shows `live` at wide layouts | Notes now open in `live` by default |
| `195bc95` | `shell.golden.test.ts.snap`, `theme.golden.test.ts.snap` | Text shifted one cell right for the sign column; `▕` on the cursor's revealed row | The sign column; a filter excluding gutter-only lines left no other changed lines |
| `9530f5b` | `theme.golden.test.ts.snap` | Additions only: NO_COLOR frame, light-theme frame, light-theme styles of the four states | New cases; existing picker entries unchanged |

### Deviations and Remaining Issues

- **Tests outside the plan's file lists changed.** These are `src/core/filetypes/registry.test.ts`, `src/core/state/status.test.ts`, `keymap.test.ts`, `whichkey.test.ts`, `test/ui/links.test.ts`, `test/ui/shell.golden.test.ts`, and `test/ui/editor-options.test.ts`. Each one changed only to update expectations for behaviour that the plan already specifies: the default `live` view, the `<CR>` binding moving to `note.enter`, the new which-key entries, and the one-cell sign column. `editor-options.test.ts` now uses `.txt` files, so its gutter assertions stay independent of the note view.
- **Normal-mode `<CR>` fallback lives in `src/core/state/keys.ts`.** The kernel has no `<CR>` motion and must stay unchanged, so `nextLineCommand` (`cursor.nextLine`, which runs `j^`) and `editorBindings` provide it. Both are registered in `main.ts` and `test/support/state.ts`. It cannot live in `commands.ts`: importing `keys` there causes a circular-initialisation `ReferenceError` (`EX_ALIASES`).
- **Reading view does not refuse everything.** It refuses edits and entry into Insert mode, but `:s` is not refused.
- **The cursor column is approximate in reading view.**
- **Embeds:** `syncEmbeds` never evicts an unlisted buffer that is dirty or whose save is not idle. `openPath` reuses an embed read that is already in flight (`awaitOpen`) instead of issuing a second read.
- **`toggleFold` prunes stale fold ids on every press**, including the `nothing to fold here` case. **`toggleTask` refuses in a read-only view.**
- **`image` widgets have no painter yet.** They fall back to the dim `[image]` row until P1-G3 registers the image painter.
- **The test-only `broken` renderer stays registered.** The T5 throwing renderer is registered under the render key `broken` (from `![[table.broken]]`) and remains registered for the rest of the test process. No other test uses that key.
- **The statusline omits `live` at 80 columns.** The pre-existing narrow layout policy (`src/ui/views/statusline.ts:77`) hides the view name there; the 80×24 case asserts that the full path and position are not clipped.
- **G4 outputs (`WidgetPainter`, `registerWidgetPainter`, unlisted embed buffers) match system design §`WidgetPainter`.** G4 stays Pending until merge, and the parent roadmap was not edited.

## Remediation

- **Verification reports:** `.s1mple/work/done/w261003s6bq-live-and-browser-preview/reports/p1-g2-verification-report.md` (commit `183db2a`, status `Failed`; left unchanged)
- **Status:** `Completed`

All four findings are fixed in follow-up commits `7f491e8`..`324e886` on top of `183db2a`. Baseline recheck before the fixes: the tree was clean apart from the orchestrator's uncommitted edit to `w261003s6bq-goal.md`, which was never staged; `git merge-base --is-ancestor 9adb285 HEAD` → exit 0 (G2 gate baseline still holds); no parent sources were edited.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P1-G2-VER1` | **Cause:** a note's `requested` was the only record of an outstanding embed read, and `syncEmbeds` dropped it when the note stopped embedding the target. `:bd` dropped it with the note. `onFileLoaded` then treated the answer as a user open. **Change:** `src/core/state/embeds.ts:syncEmbeds` keeps a request until its read answers and drops only stale refusals. It also tags its reads `{ kind: "read", path, embed: true }`. `src/core/state/types.ts` adds an optional `embed?: true` to the `read` effect and to `fileLoaded`/`fileRefused`. `src/app/effects.ts` returns the tag with the answer. `src/core/state/buffers.ts:onFileLoaded` opens a tagged answer unlisted and unshown unless a window waits (`awaitsRestore`), and `onFileRefused` settles it with no notice. `syncEmbeds` then evicts an unwanted target in the same step. **RED** (tests run against the old sources via `git stash` of the source files): `bun test src/core/state/embeds.test.ts` → 4 fail. The delete and `:bd` cases showed `b.md` (`Received: "b.md"`), the refused case showed `cannot read file — not opened (d.md)`, and the re-embed case emitted a second `read b.md`. **GREEN:** `bun test src/core/state/embeds.test.ts` → 9 pass. New cases: "a read that answers after its embed was deleted opens nothing", "a read that answers after its note was closed opens nothing", "a refused read of a closed note's embed shows no error", and "re-embedding a target whose read is outstanding sends no second read" (`Gdd`, a second note E embeds B, `:bp`, `u` → no read; one answer settles A and E). `src/app/effects.test.ts` "an embed read's answer says it was for an embed" passes. The staged snapshot of `7f491e8`, checked out alone, passes `bun run check` → 699 pass. | `7f491e8` (`P1-G2-T2`) | `Fixed` |
| `P1-G2-VER2` | **Change:** `src/core/state/commands.ts:substitute` returns `READ_ONLY_HINT` without editing when `readOnlyView(reg, b)`. `READ_ONLY_HINT` and `readOnlyView` moved from `keys.ts` to `buffers.ts` so `commands.ts` can import them without the `keys.ts` cycle; `keys.ts` and `markdown-commands.ts` import them from there. **RED:** `src/core/state/markdown-commands.test.ts` "substitution is refused in reading view and works in live view" → fail (`Received: "bar"`). **GREEN:** it passes: in reading view, `:s/foo/bar/<CR>` leaves `foo`, the buffer clean, and the message `reading mode — <leader>m to edit`; in live view the same keys give `bar` and dirty. The staged snapshot of `a1c9e50` passes `bun run check` → 700 pass. | `a1c9e50` (`P1-G2-T3`) | `Fixed` |
| `P1-G2-VER3` | The three missing assertions are added; the code needed no change. (1) `src/core/state/embeds.test.ts` "an embed target reads as loading until its read answers": after A requests B, `ctx.embed("b.md")` is `"loading"`. (2) `test/ui/live-preview.test.ts` "a missing embed paints its title in the unresolved link style": `![[gone]]` is refused, so `↳ gone` has the same cell style as the unresolved `[[nowhere]]` and a different style from the loaded `↳ present` title, with no error notice. (3) `test/ui/theme.golden.test.ts` "keep the command line and its message unclipped at 80×24" (NO_COLOR): a 76-character `:s/…/r/` command line shows in full, and the reading-mode refusal shows `reading mode — <leader>m to edit` in full. All pass: `bun test src/core/state/embeds.test.ts` → 9 pass; `CI=true bun test --ci test/ui/live-preview.test.ts test/ui/theme.golden.test.ts` → 10 pass, 7 snapshots. Snapshot files are unchanged. | `ebf4d95` (`P1-G2-T2`), `c1edc70` (`P1-G2-T4`), `324e886` (`P1-G2-T5`) | `Fixed` |
| `P1-G2-VER4` | **Correction to the Initial Implementation's `P1-G2-T1` row:** `defaultView` is defined in `src/core/state/buffers.ts` (`defaultView`, where design §7 places it), not in `src/core/lang/markdown/file-type.ts`. `file-type.ts` holds only the `live`, `source`, and `reading` view specs. Session restore does **not** keep the saved view. `snapshotSession` still writes `view` (`src/core/state/session.ts:92`), but no code reads it, so a restored note opens in `defaultView` (`live` by default) as design §5 Open and restore requires. `src/core/state/session.test.ts` "a restored note opens in live view" proves it. Evidence: `rg -n "defaultView" src` → defined only in `buffers.ts`. The Initial Implementation section is left unchanged. | No change to code — the report text was wrong, the code was correct; corrected here in the report commit | `Fixed` |

### Design Refinement for Orchestrator Follow-up

The design's §6 and §7 embed rules had the gap the verifier found. The fix adds two internal, additive refinements. Neither adds a top-level `AppState` key or a persisted field, and `state.json` stays version 1.

| Refinement | Design text it refines | Why |
|---|---|---|
| `requested` keeps a target until its read answers, even after the note stops embedding it; only `refused` is trimmed to current embeds | §6 invariant "a buffer's `requested` and `refused` hold only targets that buffer currently embeds"; §7 `syncEmbeds` `keep(requested)` | `requested` is the only record of an outstanding read. Trimming it lets a re-embed or another note send a second read |
| Embed reads carry `embed?: true` on the `read` effect, and the runner returns it on `fileLoaded`/`fileRefused`. A tagged answer is shown only when a window waits for the path | §7 `onFileLoaded`/`onFileRefused` predicate "a listed buffer's `embeds.requested` has the path" | `:bd` removes the note and its record. Without the tag, the answer looks like a user open and is shown and listed |

**Remaining edge (recorded, not fixed):** when the last note that requested a target is closed with `:bd` before the read answers, nothing records the read any more. If the user then opens the same path, or another open note embeds it, before the answer arrives, a second `read` is sent. The tag keeps the outcome correct: the embed answer never shows or lists the target, and the user's answer shows it. Closing this edge would need a record that outlives the note. That conflicts with S5 ("request state lives on the embedding note, never top-level"), so it is left for a design decision.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all four verification findings are fixed and the group checks pass at `324e886`.
- **Final report commit:** Returned to the orchestrator after this report is committed.
- **Final commits:** `4bcea47`, `db27ea5`, `97f84ef`, `195bc95`, `9530f5b` (initial); `7f491e8`, `a1c9e50`, `ebf4d95`, `c1edc70`, `324e886` (remediation)
- **Final checks:** at `324e886`:
  - `bun run check` → exit 0; Biome clean, tsc and knip pass; 701 pass, 0 fail, 18 snapshots.
  - `CI=true bun run test:ci` → 122 pass, 0 fail, 28 snapshots.
  - `rg -n "markdown|Markdown" src/ui/editors src/core/kernel` → no match.
  - `rg "markdown|Markdown|livePreview" src/ui/editors/text-view.ts src/ui/widgets/registry.ts` → no match.
  - `git diff f296fc5..HEAD -- src/ui/editors/text-view.ts | grep -c paintPreview` → 0 (`paintPreview` unchanged).
  - `git diff 9530f5b..HEAD --stat -- src/ui src/core/kernel src/core/lang` → empty.
  - Added lines in `src` and `test` contain no work-process identifiers.
  - `bun test test/boundaries.test.ts` → pass.
- **Remaining issues:** The duplicate-read edge after `:bd` of the last requesting note, described above. It needs a design decision; behaviour stays correct.

## Overall Remediation

### Status

`Completed` — OVR-VER1 is closed by documentation only. The W system design and PR #6's pending parent-synchronization list now record the two P1-G2 refinements above, which the orchestrator accepted on 2026-10-04. No code changed.

### Finding Closure

| Finding | Change evidence | Verification evidence | Commit evidence | Result |
|---|---|---|---|---|
| `OVR-VER1` — The P1-G2 embed refinements are not in the W design or the PR's parent-sync list | `w261003s6bq-system-design.md`: §5 Embed load flow tags reads `read{embed:true}` and lets an embed-tagged answer open unlisted. §6 `BufferState.listed` and `BufferState.embeds` gains an `embed?: true` entry for `read`/`fileLoaded`/`fileRefused` (runner echoes it; a tagged answer opens unlisted and unshown unless `awaitsRestore`; a tagged refusal has no notice). The invariant now says `requested` keeps a target until its read answers and only `refused` is trimmed, and it names the `:bd` exception to one outstanding read (duplicate answer is a no-op through `onDiskLoaded`'s stamp check, `src/core/state/disk.ts:69`). §7 `embeds.ts`: the `syncEmbeds` sketch drops `keep(b.embeds?.requested)` for `b.embeds?.requested ?? []`, emits `{ kind: "read", path, embed: true }`, lists `embedRequested`, and its prose and invariants match `src/core/state/embeds.ts:27-96`. §7 `types.ts`: `Action` and `Effect` rows and the proposed shape add the tag. §7 `buffers.ts`: `onFileLoaded`/`onFileRefused` predicates read `a.embed === true \|\| embedRequested(s, a.path)`, as in `src/core/state/buffers.ts:370-372`, `:442`. §7 `effects.ts`: `case "read"` copies the tag (`src/app/effects.ts:184-193`). PR #6 body: two new items under "Pending parent synchronization", for the `embed?: true` tag and the `requested` refinement; every other line is unchanged (`diff` of the fetched and edited bodies shows only the two added lines). | `grep -n 'embed?: true' w261003s6bq-system-design.md` → hits at §6 `:1170` and §7 `:2025`, `:2026`, `:2052`, `:2054`. `grep -n 'keep(b.embeds\|hold only targets that buffer currently embeds\|Requests and refusals for targets'` → no match. `gh pr view 6 --json body -q .body \| grep -n 'embed?: true'` → line 122 under "Pending parent synchronization". `bun run check` → exit 0, 739 pass, 0 fail. `git diff --stat -- src test scripts` → empty. | `7c0b6a2` (design); PR #6 body edited with `gh pr edit 6 --body-file` | `Fixed` |

### Checks

- `bun run check` → exit 0; Biome 249 files clean; tsc and knip pass; 739 pass, 0 fail, 18 snapshots.
- No code change: `git diff --stat -- src test scripts` → empty; `7c0b6a2` touches only `w261003s6bq-system-design.md`.
- §1 item 6 and the `da4739d` applied-sync table are unchanged, because they record what the parent already has; the pending parent change is listed in the PR body instead.

### Remaining Issues

None in scope. Parent synchronization of the tag and the `requested` rule stays pending until the user authorizes it.
