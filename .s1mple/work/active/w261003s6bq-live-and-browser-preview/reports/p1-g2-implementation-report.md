# P1-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-1-terminal-live-preview.md`
- **Group:** `P1-G2`
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g2-implementation-report.md`

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

- **Verification reports:** Not yet issued
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all five tasks are committed and the group checks pass.
- **Final report commit:** Returned to the orchestrator after this report is committed.
- **Final commits:** `4bcea47`, `db27ea5`, `97f84ef`, `195bc95`, `9530f5b`
- **Final checks:** `bun run check` → 694 pass; `bun run test:ci` → 120 pass, 28 snapshots
- **Remaining issues:** None
