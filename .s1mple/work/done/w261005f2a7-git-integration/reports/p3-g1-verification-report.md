# P3-G1 Verification Report

## Scope

- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`, `P3-G1-T6`, `P3-G1-T7` (`P3-G1-T8` is not part of this verification; see Unverified Items)
- **Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p3-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p3-g1-implementation-report.md` (commits `8dc0816`, `0020d5d`); change range `4b8834f..e1d4b23`

## Status

`Failed`

The code, tests, and checks all hold. One Minor documentation defect blocks a pass: the new `gitDiffKeystrokeP95` row in `.s1mple/docs/project.md` renders outside the Benchmarks table (`P3-G1-VER1`). Every task outcome, `V`/`UV` case, and group check passes. No code finding was raised.

## Assigned Traceability

- **System Design:** `REQ4@R3 → DES10, DES13 → S34`; `REQ4@R3, REQ5@R2 → DES10, DES12 → S7, S8, S32, S33 → V44, V64, V65`; `REQ4@R3 → DES10, DES13 → S9, S10, S34 → V45, V46`; `REQ4@R3 → DES11 → S7 → V47`; `REQ4@R3, REQ2@R2 → DES11, DES9, DES13 → S35, S36`; `REQ2@R2, REQ5@R2, REQ7@R2 → DES2, DES8, DES9 → S13–S15, S19, S26 → V50, V51, V53`; `REQ1@R2–REQ9@R1 → DES1–DES13 → S1–S36 → V52, V61`
- **UI Design:** `UREQ12@R1 → UDES12@R1 → US12@R1 → UV18@R1`; `UREQ1@R1, UREQ2@R1, UREQ11@R1 → UDES1@R1, UDES2@R1, UDES11@R1 → US1@R1, US2@R1, US11@R1 → UV1@R1–UV4@R1, UV17@R1`; `UREQ4@R1, UREQ5@R1, UREQ9@R1 → UDES4@R1, UDES5@R1, UDES9@R1 → US4@R1, US5@R1, US9@R1 → UV7@R1, UV8@R1, UV13@R1`; `UREQ6@R1 → UDES6@R1 → US6@R1 → UV9@R1, UV10@R1`; `UREQ3@R1, UREQ7@R1, UREQ10@R1 → UDES3@R1, UDES7@R1, UDES10@R1 → US3@R1, US7@R1, US10@R1 → UV6@R1, UV14@R1`; `UREQ2@R1, UREQ4@R1, UREQ10@R1 → US2@R1, US4@R1, US10@R1 → UV15@R1, UV16@R1`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ4@R3 → DES10, DES13 → S34` | `UREQ12@R1 → UDES12@R1 → US12@R1 → UV18@R1` | 17 Git tokens with the UI design values in dark, light, and NO_COLOR; no existing token or palette value changes | `src/ui/theme.ts:TOKENS` adds exactly the 17 rows of UI design §7 Component: Git theme tokens, with the same fg, bg, attrs, and NO_COLOR attrs. The diff of `theme.ts` only adds entries and exports `TOKENS`, and no palette line changes. `src/ui/theme.test.ts` checks every token against the palette hex, and its snapshot freezes every pre-existing token | `Satisfied` |
| `REQ4@R3, REQ5@R2 → DES10, DES12 → S7, S8, S32, S33 → V44, V64, V65` | `UREQ1@R1, UREQ2@R1, UREQ11@R1 → UDES1@R1, UDES2@R1, UDES11@R1 → US1@R1, US2@R1, US11@R1 → UV1@R1–UV4@R1, UV17@R1` | Change column at x = 0 inside a repository only; `hunkSigns` appended last; one `change` flag for paint, hit-test, and cursor; continuation, widget, and `~` filler rows blank; v1-identical outside a repository | `src/ui/editors/text-view.ts:gutterWidth(lineCount, change)`. `EditorView.change` is set once per `show()` from `s.git.repo !== null` and read by all four width callers (`:342` cursor, `:418` `textArea`, `:480` hit-test, `:544` paint). `layoutFrame` appends `...git` last, and `[]` outside a repository leaves the provider list as in v1. `gutter(text, at, sign?, changeSign?)` paints the change cell first and shifts the number and sign cells right by one only when `change` is set. Block rows take `row.changeSign` from core (`DES12`) | `Satisfied` |
| `REQ4@R3 → DES10, DES13 → S9, S10, S34 → V45, V46` | `UREQ4@R1, UREQ5@R1, UREQ9@R1 → UDES4@R1, UDES5@R1, UDES9@R1 → US4@R1, US5@R1, US9@R1 → UV7@R1, UV8@R1, UV13@R1` | Segment `⎇ <ref> [op] [+a] [~c] [-r]` right after the path with per-part tokens, zero counts hidden, dropped first; markers ` M S ? U •` after the name and `●` through `put`; `warn` → `messageWarn` | `src/ui/views/statusline.ts:gitSegment` matches the UI design code shape. The segment is pushed right after `path`, and the drop list is `[git, preview, words, view]`. Painting uses `g.parts`, while `text` drives `fixedWidth`. `src/ui/views/explorer.ts:GIT_MARKERS` lists exactly the five accepted markers with no `deleted` entry, read from `explorerMarkers(s.git.status)`. They are painted with the existing `put`, after `●`, so a selected row keeps its base token. `src/ui/views/cmdline.ts:MESSAGE_TOKEN` maps all three levels | `Satisfied` |
| `REQ4@R3 → DES11 → S7 → V47` | `UREQ6@R1 → UDES6@R1 → US6@R1 → UV9@R1, UV10@R1` | Framed float ` hunk preview ` with footer `esc / q close`; header `<glyph> <label> · <range> · hunk n/m`; `- ` rows in `diffDel` then `+ ` rows in `diffAdd`; cap 12 (8 when narrow) with the overflow row; below the cursor row, else above, inside the editor area; x = text start, width min(72, area) or the full area when narrow; `itemAt` answers only inside the float | `src/ui/overlays/hunk.ts:HunkView`. `KIND_LABEL` matches the six UI design labels. `rangeOf` gives `line N`, `lines N–M`, `after line N` (1-based anchor = `new.start`, per `signs.ts:linesOf`), and `at top`. `layout()` caps at `lc === "narrow" ? 8 : 12` and places the float below when it fits, else on the side with more room. The box height is ≤ the chosen side's room, so the float never covers the cursor row. Added lines are read from the buffer and removed lines from `hunk.oldLines`, so the view computes no diff. `shell.ts` registers it in the `OverlayHost`, which `paint` updates after the window tree, behind the `suspended` guard | `Satisfied` |
| `REQ4@R3, REQ2@R2 → DES11, DES9, DES13 → S35, S36` | `UREQ3@R1, UREQ7@R1, UREQ10@R1 → UDES3@R1, UDES7@R1, UDES10@R1 → US3@R1, US7@R1, US10@R1 → UV6@R1, UV14@R1` | Production `registries()` merges `gitCommands`, `gitBindings`, `gitGroups`; a stage updates the gutter, statusline, and explorer in one frame; the hand-off paints the saved message last before `suspend()`, paints nothing while suspended, and restores the screen with the message cleared and the image re-drawn | `src/app/main.ts:registries` now registers the same commands, bindings, and groups as `test/support/state.ts:testRegistries`. The only remaining difference is the test-only `kanban-test` layout, so the which-key rows proven by `src/core/state/git-commands.test.ts` on `testRegistries()` hold in production. `registries()` stays unexported. Frame behaviour is proven by `test/ui/git.test.ts` (UV6, UV14) | `Satisfied` |
| `REQ2@R2, REQ5@R2, REQ7@R2 → DES2, DES8, DES9 → S13–S15, S19, S26 → V50, V51, V53` | None | Real PTY hand-off restores so after a SIGKILLed tool and survives Ctrl-C; keystroke P95 in an all-changed 5,000-line note within the gate; `firstFrame` unchanged | `test/e2e/git-tool.test.ts` uses a stub that traps INT, enables `?1003h`, and runs `kill -9 $$`, inside a real `gitRepo`, with `[git] tool` set. `test/bench/git-diff.bench.ts` sends 200 keys, the index blob prefixes every line with `~ `, and the bench fails if no hunks exist. `scripts/bench-gate.ts:TARGETS.gitDiffKeystrokeP95 = 24` and its `BENCHES` entry | `Satisfied` |
| `REQ1@R2–REQ9@R1 → DES1–DES13 → S1–S36 → V52, V61` | `UREQ2@R1, UREQ4@R1, UREQ10@R1 → US2@R1, US4@R1, US10@R1 → UV15@R1, UV16@R1` | Full checks and build; `project.md` documents `[git] tool`, the Git module map, Git ≥ 2.31, the Git flow, and the bench row; manual hand-off and glyph-width observations written | Checks and build pass (Technical Verification). The `project.md` facts match the code: `tool: z.array(z.string().min(1)).min(1).default(["lazygit"])`, `runTool` cwd `repo.top`, `MIN_GIT = [2, 31, 0]`, `--no-optional-locks` / `--literal-pathspecs`, `REFRESH_MS = 200`, `src/workspace/git-watcher.ts`, and the `tool-host.ts` order flush → hold → suspend → reset foreign modes → resume → release. The new Benchmarks row is not indented like the rest of the nested table, so it renders as a paragraph (`P3-G1-VER1`). Manual observations are recorded in the implementation report | `Mismatch` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `UV18@R1` | `US12@R1`, `S34` | `UDES12@R1`, `DES10`, `DES13` | `bun test src/ui/theme.test.ts test/ui/theme.golden.test.ts` | 8 pass, 0 fail, 8 snapshots; the git-token case asserts the palette hex per theme and the NO_COLOR attrs; the pre-existing-token snapshot is unchanged | `Passed` |
| `V44`, `UV3@R1` | `S7`, `US2@R1` | `DES10`, `UDES2@R1` | `bun test test/ui` — "every sign kind shows its glyph in every view (dark / light / no colour)" | Cell 0 reads `‾ + ~ _ ~ ≃` and `┆ ┆` in live, source, and reading for each theme. The style of each cell equals its `git*` token, and the NO_COLOR frame has only default colours | `Passed` |
| `UV1@R1` | `US1@R1` | `UDES1@R1` | "changed lines show their git sign left of the line number" | Row starts `+  18 ▕line 18`. The wrapped continuation row has 7 blank leading cells, and text sits one cell right of the no-repo mount | `Passed` |
| `UV4@R1` | `S8`, `US2@R1` | `DES12`, `UDES2@R1` | "a rendered block shows the git sign of a changed hidden line" | Exactly one `~` row, on the rendered mermaid block, and v1 sign cells equal those of the no-repo mount | `Passed` |
| `V64`, `UV17@R1` | `S32`, `US11@R1` | `DES12`, `UDES11@R1` | "a reveal sign and a git sign share a line…" plus `git diff --name-status 4b8834f..e1d4b23 -- '*.snap'` | Repo row `~   5 ▕line 5`; no-repo row `   5 ▕line 5`. The Git-missing frame equals the no-repo frame, and Git too old differs only in the notice row. The snapshot diff shows only two added files (`A src/ui/__snapshots__/theme.test.ts.snap`, `A test/ui/__snapshots__/git.test.ts.snap`), and `bun test test/ui` passes all 65 snapshots | `Passed` |
| `V65`, `UV2@R1` | `S33`, `US1@R1` | `DES12`, `UDES1@R1` | "clicks and the cursor land on the painted text with the change column" | A click at x = 7 + 5 gives cursor `{2, 5}`, and the drawn cursor is at x = 12. A click on `c` of `abcdef` gives col 2, and the drawn cursor x equals the `c` cell | `Passed` |
| `V45`, `UV7@R1` | `S10`, `US4@R1` | `DES10`, `UDES4@R1` | "the statusline git segment reads its variants and drops first", "…colours each part" | Shows `⎇ main +2 ~2 -3`, `⎇ main`, `⎇ a1b2c3d rebasing +2 ~2 -3`, `⎇ main merging`, and unborn and untracked `⎇ main`, each right after `path │`. A dirty buffer gives `plan.md ● │ ⎇ main`. At 80 columns there is no `⎇`. At 100 columns with a long path `⎇` is dropped while `preview off` stays. Each part has its token in dark and NO_COLOR, and `statusGitOp` is BOLD \| UNDERLINE in NO_COLOR | `Passed` |
| `V46`, `UV8@R1` | `S9`, `US5@R1` | `DES10`, `UDES5@R1` | "explorer rows show git markers after the name", "the floating explorer shows the same markers…", "outside a repository…" | Rows end with `2026-10-02.md S`, `so-roadmap.md ● M`, `ideas.md ?`, `linh.md U`, and `daily •`. There is no `2026-10-03.md` row and no ` D`. The selected `U` cell uses `treeSelFocus`, and a collapsed `ideas •` hides its children. The 80×24 floating explorer and the NO_COLOR view show the same markers. Outside a repository there is no `⎇` and no marker | `Passed` |
| `UV13@R1` (snapshot part) | `S34`, `US9@R1` | `DES13`, `UDES9@R1` | "warnings and errors use their own message styles" | `index changed; hunks refreshed` uses `messageWarn`, and `notes/plan.md has conflicts; resolve them in lazygit` uses `messageError`, in dark and NO_COLOR (error bold). The snapshot was recorded | `Passed` |
| `V47`, `UV9@R1` | `S7`, `US6@R1` | `DES11`, `UDES6@R1` | "the hunk float lays out header…", "a long hunk shows 12 / 8 lines…" | Header `≃ changed + deleted · line 31 · hunk 3/4`, then three `- ` rows in `diffDel` and `+ b31` in `diffAdd`. The header uses `floatDim` and the footer reads `esc / q close`. Near the bottom the float sits right above the cursor row. At line 10 it sits below, at x = 7, 72 wide. The delete case reads `after line 35 · hunk 4/4`. The 22-line add gives 12 rows and `… 10 more lines (0 removed, 22 added)`, or 8 rows and `… 14 more lines …` at 80×24, where the float reaches x = 79. The float stays inside the editor area and never covers the cursor row | `Passed` |
| `V47`, `UV10@R1` | `S7`, `US6@R1` | `DES11`, `UDES6@R1` | "the hunk float closes on escape, q, outside clicks, and other keys" | Esc, `q`, and an outside click close it with the cursor unchanged. An inside click keeps it open. `j` closes it and moves the cursor to line 10. On a clean line nothing opens and the message reads `no hunk at cursor`. I also checked a wheel notch outside the float with a scratch probe, which I then removed. It did not scroll the editor, because `OverlayHost` maps every cell outside the float to `outside`. So the float cannot lose its anchor that way | `Passed` |
| `UV6@R1` | `S7`, `US3@R1` | `DES4`, `DES10`, `UDES3@R1` | "staging updates gutter, statusline, and explorer together" | Before: signs ` ~ ++ ~_ `, `⎇ main +2 ~2 -3`, `M`. After staging hunk 2, one frame shows signs ` ~    ~_ `, `⎇ main ~2 -3`, `M`, and `staged hunk 2/4`. After staging all: no signs, `⎇ main`, `S` | `Passed` |
| `UV14@R1` | `S35`, `US10@R1` | `DES9`, `UDES10@R1` | "the hand-off paints the saved message once and restores the screen" | The last frame before the tool shows `"projects/so-roadmap.md" written · opening lazygit`. While the tool runs: 0 frames and 0 image draws. The first frame after: message row empty and rows 0–38 equal to the pre-hand-off frame. `drawImage` is called again | `Passed` |
| `S36` (production which-key) | `S36`, `US7@R1` | `DES11`, `UDES7@R1` | Inspection of `src/app/main.ts:registries` vs `test/support/state.ts:testRegistries`; `src/core/state/git-commands.test.ts` | Commands, bindings, and groups are identical apart from the test-only `kanban-test` layout, and the which-key test shows `g Lazygit (full screen)`, `h +hunk`, `b/p/r/s` rows. Production wiring was also exercised end to end by `V50` (`<leader>gg` in the real binary path) | `Passed` |
| `V50` | `S13`, `S14`, `S15` | `DES9` | `bun test test/e2e/git-tool.test.ts` | 1 pass (0.92 s). Mouse mode reads `any` while the stub runs. so survives Ctrl-C. After the SIGKILL the mode is not `any`, the statusline shows `NORMAL`, `:q` exits 0, and the screen buffer ends `normal` with mouse `none`. The test's temp repo and dir were removed | `Passed` |
| `V51`, `V53` | `S19`, `S26` | `DES2`, `DES8` | Orphan check (only the pre-existing 43089/43090 and 49528–49530), then `bun run bench` | Exit 0. `gitDiffKeystrokeP95` median 7.15 ms (limit 48), `firstFrame` 146.98 ms (limit 500). Every other median is within 2× target (sourceKeystroke 4.45, liveKeystroke 11.69, openFile 37.60, sourceOpenFile 14.87, liveScroll 5.70, sourceScroll 4.50, indexReady 976.88, indexingKeystroke 9.15) | `Passed` |
| `V52` | `S1`–`S36` | `DES1`–`DES13` | `bun run check`; `bun run test:ci`; `bun run build` | `check` exit 0: biome clean, tsc clean, knip zero, 1204 pass / 0 fail. `test:ci` exit 0: 255 pass / 0 fail, 65 snapshots. `build` exit 0, `dist/so` 82.9 MB | `Passed` |
| Boundaries | None | Layer rules (`project.md` Boundaries) | `bun test test/boundaries.test.ts` | 2 pass. The new UI-internal imports (`hunk.ts` → `editors/text-view` type, `window-tree.ts` → `overlays/hunk` type) and the UI → core imports are allowed, and no dependency was added (`package.json` and `bun.lock` are unchanged in the range) | `Passed` |
| UI suite | `V44`–`V47`, `V64`, `V65`, `UV1`–`UV4`, `UV6`–`UV10`, `UV13`, `UV14`, `UV17` | `DES9`–`DES12` | `bun test test/ui` | 179 pass, 0 fail, 65 snapshots; `git status --porcelain` afterwards shows only the pre-existing `.gitignore` change | `Passed` |
| Work-id grep | None | `.s1mple/S1MPLE.md` Implementation | `grep -rnE "W261005F2A7\|\b(REQ\|DES\|UDES\|UV)[0-9]" src test scripts` | No matches (exit 1). Commit bodies carry `Task:` / `Work:` trailers, which belong in commit messages | `Passed` |
| `V61`, `UV15@R1` (manual) | `S31`, `S14`, `US10@R1` | `DES9`, `UDES10@R1` | Assessment of the implementer's written observation against the manual-check rule | Ghostty run used the tui-test monitor in a Ghostty window, sized to it (186×48), with no recording. It records no so text while lazygit ran, the same note and cursor (3:18) on return, image blocks redrawn, the staged hunk's `~` gone, the statusline and explorer refreshed, and the mouse working. kitty is reported `Skipped` with a reason, not passed. This follows the rule. The graphics-protocol path was not exercised by hand (see Unverified Items) | `Passed` |
| `UV16@R1` (manual) | `US2@R1`, `US4@R1` | `UDES2@R1`, `UDES4@R1` | Assessment of the implementer's written observation | All nine glyphs `+ ~ _ ‾ ≃ ┆ • ⎇ ●` measure 1 cell via DSR in Ghostty, kitty, iTerm2, and Terminal.app. Terminal.app was used only for this width check. Alignment was inferred from width rather than seen (stated in the report) | `Passed` |
| `project.md` rendering | None | `.s1mple/docs/project.md` structure | `marked.parse(project.md)` around `gitDiffKeystrokeP95` | The table closes after `indexingKeystrokeP95` and the list ends. The new row renders as `<p>\| <code>gitDiffKeystrokeP95</code> \| 24 \| …</p>` | `Failed` |
| Process cleanup | None | Plan execution rules | `ps` before and after; temp-dir sweep | No so, PTY, stub, or tool process remained beyond the pre-existing PIDs. I removed the temp dirs that pre-existing v1 suites and benches (`so-bench-*`, `so-e2e-*`, `so-it-*`, `so-quit-*`) left during my runs, and the scratch probe. The new git suites (`so-git-*`, `so-git-tool-*`) left nothing in my runs | `Passed` |
| Delivery (`gh pr checks`, `gh pr view`) | — | `.s1mple/S1MPLE.md` Delivery | Not run | Owned by the orchestrator's Delivery stages A and B, per the goal's Delivery Sequencing; not a finding | `Insufficient` |

## Findings

### P3-G1-VER1 — Minor — Documentation — Benchmarks row for `gitDiffKeystrokeP95` renders outside the table

- **System Design:** `REQ5@R2`, `DES2`, `S19`, `V51`; system design §8 Non-test verification (`project.md` documentation)
- **UI Design:** None
- **Evidence:** `.s1mple/docs/project.md:219-220`. The Benchmarks table is nested in the `- **Benchmarks:**` list item, and every row is indented two spaces. The new row is not:

  ```text
  219:  | `indexingKeystrokeP95` | 30 | `indexing-keystroke.bench.ts` — 200 keys, …
  220:| `gitDiffKeystrokeP95` | 24 | `git-diff.bench.ts` — 200 keys in a 5,000-line note …
  ```

  Rendering the file with `marked` closes the table and the list after `indexingKeystrokeP95`, then emits the new row as a paragraph: `</tbody></table></li></ul><p>| <code>gitDiffKeystrokeP95</code> | 24 | …`.
- **Impact:** The project baseline, which future discussion and planning read, shows the Git bench target as stray pipe text instead of a table row. The T7 outcome ("the `gitDiffKeystrokeP95` bench row") is only partly met.
- **Required resolution:** Indent the `gitDiffKeystrokeP95` row by two spaces to match the other rows, so it renders as the last row of the Benchmarks table.
- **Required proof:** Render `.s1mple/docs/project.md` (e.g. `bun -e 'import {marked} from "marked"; …'`) and show `gitDiffKeystrokeP95` inside a `<td>` of the Benchmarks table; `bun run check` still exits 0.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - Every Git token value per theme, plus a snapshot of every pre-existing token (`src/ui/theme.test.ts`).
  - The change column: position, each sign kind in three views and three themes, cell styles, wrapped rows, block inheritance, and the shared reveal-sign line. Also click and cursor agreement, and v1 equality without a repository, with Git missing, and with Git too old (`test/ui/git.test.ts`).
  - Statusline variants, part tokens, the dirty dot order, the narrow drop, and the long-path drop order.
  - Explorer markers in docked, floating, and NO_COLOR layouts, the selected-row style, collapsed and expanded new folders, and no deleted row.
  - `warn`/`error` message tokens.
  - Hunk float header, ranges, tokens, caps at both sizes, overflow text, placement above and below, width at 120 and 80 columns, and every dismissal path.
  - Cross-surface stage frames and hand-off frames with image re-issue.
  - Real PTY hand-off with a SIGKILLed tool and Ctrl-C (`test/e2e/git-tool.test.ts`).
  - Keystroke P95 under the gate (`test/bench/git-diff.bench.ts`).
- **Missing:** None. Which-key rows are asserted on `testRegistries()` by design (the plan prohibits exporting `registries()`). Inspection shows production `registries()` merges the same commands, bindings, and groups, and `V50` exercises `<leader>gg` through the production entry point.

## Scope Changes

The recorded deviations are acceptable:

| Deviation | Evidence | Judgment |
|---|---|---|
| `TOKENS` exported from `src/ui/theme.ts` | Used by `src/ui/theme.test.ts` to enumerate tokens; knip reports zero findings | Acceptable — the smallest change that lets UV18 check every pre-existing token without a hand-kept list |
| T4 touched `src/ui/editors/registry.ts` (`WindowView.textArea?`), `src/ui/editors/text-view.ts` (`textArea()`), `src/ui/views/window-tree.ts` (`anchor()`) | The UI design requires a shell-supplied anchor giving "the active editor's text rectangle and cursor screen row". `textArea` uses the same `gutterWidth(…, this.change)` as paint. `paint` updates `windows` before `overlays`, so the anchor is current in each frame | Acceptable — the minimal wiring the design's `anchor` callback needs; optional method, no behavior change for other views |
| `V64` "equals the existing v1 snapshot" proven by equivalence to a never-detected mount plus unchanged v1 snapshot files | The no-repo, Git-missing, and Git-too-old scenes equal a mount that never saw `gitDetected` (except the notice row). No existing `.snap` changed, and all 65 UI snapshots pass, and those scenes all render with `git.repo === null` | Acceptable — together these prove byte-identity outside a repository |
| Hunk `n/m` matched by `new.start` | This is the exact rule in the plan and the UI design Input contract ("matched by `new.start`"); the header omits ` · hunk n/m` when not found | Not a deviation |
| `project.md` cites the system design at its `work/active/` path | `.s1mple/docs/project.md:9` | Acceptable — Delivery stage B moves the folder and updates every `.s1mple/` reference |
| T2 implementation written before its tests | RED was shown by running the 7 new cases against the original `text-view.ts` (7 fail) | Acceptable process deviation — the failing-first evidence exists; no effect on the result |

Beyond these, none.

## Unverified Items

- **`P3-G1-T8` / Delivery checks** (`gh pr checks`, `gh pr view`, the folder move): not verified here. The orchestrator's Delivery stages A and B own them per the goal's Delivery Sequencing.
- **`V61` kitty observation:** Skipped by the implementer (no way to observe a kitty window: no Screen Recording permission, and tui-test mirrors only into its monitor). It is reported as skipped, not passed, as the rule requires.
- **`V61` real graphics protocol by hand:** In the Ghostty check, so ran inside the tui-test emulator mirrored to Ghostty, so images drew as cell blocks. The kitty-graphics re-issue path was therefore not seen in a real terminal. It is covered automatically by `V60` (`drawImage` re-issued with `kitty` after `resume()`) and by `UV14@R1`.
- **`UV16@R1` alignment:** Measured as a 1-cell width per glyph via DSR, not seen visually. Alignment follows from the width, but no screenshot was possible.
- I did not repeat the manual checks, as the assignment allows. The manual results above are judged from the implementer's written observations.

## Blockers

None
