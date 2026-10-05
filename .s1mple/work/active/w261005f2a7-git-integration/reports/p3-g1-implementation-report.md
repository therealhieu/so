# P3-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-goal.md`
- **Plan Part:** `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-plan-3-ui-and-delivery.md`
- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`, `P3-G1-T6`, `P3-G1-T7` (`P3-G1-T8` not assigned)
- **Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p3-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P3-G1-T1` — Git theme tokens | `src/ui/theme.ts:TOKENS` (now exported) gains the 17 git tokens with UI design values; `src/ui/theme.test.ts` checks every git token per theme (dark, light, NO_COLOR) against palette hex; new `src/ui/__snapshots__/theme.test.ts.snap` freezes every pre-existing token | RED: 1 fail (tokens missing). The pre-existing-token snapshot was recorded before the tokens were added. GREEN: `bun test src/ui/theme.test.ts` 2 pass; theme golden 6 pass; `bun run check` exit 0 | `6f16712` | `Completed` |
| `P3-G1-T2` — Gutter change column | `src/ui/editors/text-view.ts`: `gutterWidth(lineCount, change)`, `EditorView.change` set once per `show()` from `s.git.repo !== null`, `hunkSigns` decoration provider, change cell painted in `gutter` on a line's first screen row (widget rows included) | 7 new cases in `test/ui/git.test.ts`. RED: 7 fail with the original `text-view.ts`. GREEN: `bun test test/ui` 167 pass, all 63 existing snapshots unchanged | `10f7a65` | `Completed` |
| `P3-G1-T3` — Statusline, explorer, and message-line surfaces | `src/ui/views/statusline.ts:gitSegment`, `Seg.parts`, drop order `[git, preview, words, view]`; `src/ui/views/explorer.ts:GIT_MARKERS`; `src/ui/views/cmdline.ts:MESSAGE_TOKEN` (`warn` → `messageWarn`); new `test/ui/__snapshots__/git.test.ts.snap` (2 snapshots) | RED: 5 fail. GREEN: `bun test test/ui` pass; no existing snapshot modified | `0e189b4` | `Completed` |
| `P3-G1-T4` — Hunk preview float | New `src/ui/overlays/hunk.ts:HunkView`; `src/ui/editors/registry.ts:WindowView.textArea?`; `src/ui/editors/text-view.ts:EditorView.textArea`; `src/ui/views/window-tree.ts:WindowTree.anchor`; `src/ui/shell.ts` registers `new HunkView(renderer, () => windows.anchor())` in the overlay host | RED: 4 fail. GREEN: `bun test test/ui` 177 pass; the hand-off paint-guard cases in `test/ui/git.test.ts` stay green | `af03592` | `Completed` |
| `P3-G1-T5` — Production registries and cross-surface frames | `src/app/main.ts:registries` registers `gitCommands`, `...gitBindings`, `gitGroups`; cross-surface frame cases (which-key `+git`/`+hunk`, stage updates gutter, statusline, and explorer together, hand-off frames) in `test/ui/git.test.ts` | The new UI cases passed at once because they mount `testRegistries()`, which Part 1 already merged. The production-wiring RED comes from T6: the PTY e2e run against the pre-T5 `main.ts` timed out after 5000 ms (`<leader>gg` unbound). `bun run check` exit 0. Production `registries()` now equals `testRegistries()` except for the test-only `kanban-test` layout | `2fd53a7` | `Completed` |
| `P3-G1-T6` — PTY hand-off and keystroke bench | New `test/e2e/git-tool.test.ts` (stub tool: ignores INT, enables `?1003h`, prints, waits, then `kill -9` itself; Ctrl-C during the tool leaves so running; afterwards no `?1003` mode, NORMAL, `:q` exits 0 on the normal buffer with mouse mode `none`; 30 s test timeout); new `test/bench/git-diff.bench.ts` (temp repo whose staged blob prefixes every line of the 5,000-line note, so every line differs; 200 keys, `advance(100)` per key so the diff runs; fails if no hunks are present); `scripts/bench-gate.ts:TARGETS.gitDiffKeystrokeP95 = 24` and its `BENCHES` entry | `bun test test/e2e/git-tool.test.ts` → 1 pass (~1.1 s); RED against pre-T5 `main.ts` → timed out after 5000 ms. `bun test/bench/git-diff.bench.ts` → p95 7.52 ms; a probe confirmed the diff recomputes while typing (hunk `change` with `new.count` 5001 after `o`). `bun run bench` → `gitDiffKeystrokeP95` median 7.81 ms (limit 48). `bun run check` exit 0 | `cc9e58e` | `Completed` |
| `P3-G1-T7` — Project document, full checks, and manual terminal checks | `.s1mple/docs/project.md`: git summary in Purpose plus the system-design source; `git` in the `src/core` features list; Git module map paragraph (with `MIN_GIT` 2.31.0); Git flow block in Architecture; `[git] tool` in the Config file contract row (non-empty argv, default `["lazygit"]`, run at the repository top, `~` passed literally); `gitDiffKeystrokeP95` row in the Benchmarks table; Sources extended. Last Modified already read 2026-10-05 | `bun run check` exit 0 (1204 pass); `bun run test:ci` exit 0 (255 pass); `bun run build` exit 0, `dist/so` 82.9 MB; id grep → no matches; manual checks below | `e1d4b23` | `Completed` |
| `P3-G1-T8` — Pull request and delivery | — | — | Not assigned — executed by the orchestrator in Delivery stages A and B | Not assigned |

### Group Change Range

- **Starting commit:** `4b8834f`
- **Final commit:** `e1d4b23`
- **Remaining group changes:** None. The unstaged `.gitignore` change (`.worktrees/`) predates this group, so it was not staged or committed.

### Group Verification

- `bun test test/ui` → `Passed` — 179 pass, 0 fail, 65 snapshots. `git diff --name-status 4b8834f..HEAD -- '*.snap'` lists only two added files (`src/ui/__snapshots__/theme.test.ts.snap`, `test/ui/__snapshots__/git.test.ts.snap`); no existing snapshot changed.
- `bun test src/ui/theme.test.ts` → `Passed` — 2 pass, 1 snapshot.
- `bun run test:ci` → `Passed` — exit 0, 255 pass across 31 files (component, integration, e2e including `git-tool.test.ts`).
- `bun run check` → `Passed` — exit 0; biome, tsc, knip zero findings, 1204 pass across 112 files including `test/boundaries.test.ts`.
- `bun run bench` (orphan check first: only the pre-existing 43089/43090 and 49528–49530 were running) → `Passed` — exit 0; medians: sourceKeystrokeP95 5.24, liveKeystrokeP95 13.24, openFile 39.06, sourceOpenFile 15.06, liveScrollFrameP95 5.73, sourceScrollFrameP95 4.66, firstFrame 158.92, indexReady 1031.27, indexingKeystrokeP95 11.51, gitDiffKeystrokeP95 7.81 ms; all ≤ 2× target.
- `bun run build` → `Passed` — `dist/so` produced (82.9 MB).
- `grep -rnE "W261005F2A7|\b(REQ|DES|UDES|UV|UREQ|US)[0-9]" src test scripts` → `Passed` — no matches (exit 1).
- Manual `V61`, `UV15@R1`, `UV16@R1` → `Passed` for the checked terminals; see below.
- Delivery (`gh pr checks`, `gh pr view`) → not run; owned by the orchestrator's Delivery stages.

#### Manual checks

All checks used a throwaway repo in the session scratchpad (`note.md` with an embedded `pic.png`, `other.md`, one commit), with isolated `XDG_CONFIG_HOME` (`[preview] mode = "live"`) and `XDG_STATE_HOME`. Nothing was recorded.

- **`V61`, `UV15@R1` hand-off in Ghostty: Passed.** so ran in a `tui-test` session. The monitor ran in a new Ghostty window (`open -na Ghostty --args -e tui-test monitor`), and the session was resized to the window (52×188 tty → 186×48 session). Note: so's PTY was the tui-test emulator, mirrored in Ghostty; Ghostty did not host so directly. Observations:
  - Before: after the unsaved edit `3GA edited`, the change column showed `~`, the statusline `⎇ main ~1`, and the explorer `note.md M`. The image drew as cell blocks.
  - `Space g g` saved the note first (lazygit's unstaged diff showed `+First line. edited`). lazygit filled the screen, and no so text (`NORMAL`, note lines) remained on it.
  - In lazygit, `2`, Enter, Space staged the hunk (`git diff --cached --stat`: `note.md | 2 +-`). Escape, then `q`.
  - After: the same note, cursor still at 3:18, and image blocks drawn again (36 block rows). The `~` sign was gone, the statusline showed plain `⎇ main`, and the explorer showed `note.md S`.
  - The mouse worked: a click on `Fifth line.` moved the cursor to 10:6.
  - Then `‾` (top delete), `+` (added line), and `≃` (change then delete) painted in the change column with numbers aligned, and the statusline read `⎇ main +1 ~1 -2`.
- **`UV15@R1` hand-off in kitty: Skipped.** I could not drive or observe a kitty window: screen capture has no Screen Recording permission (it returned only the wallpaper), and tui-test mirrors only into its monitor.
- **`UV16@R1` glyph width: Passed in Ghostty, kitty, iTerm2, and Terminal.app.** A script printed each glyph alone on a line and read the cursor column back with DSR (`ESC[6n`) inside the terminal. Results:
  - Glyphs measured: `+ ~ _ ‾ ≃ ┆ • ⎇ ●`.
  - Ghostty (`TERM=xterm-ghostty`), kitty (`TERM=xterm-kitty`), iTerm2 (`TERM_PROGRAM=iTerm.app`), and Terminal.app (`TERM_PROGRAM=Apple_Terminal`): every glyph is 1 cell.
  - This is a measured width, not a visual check of alignment. A visual check was impossible without Screen Recording permission.
  - Terminal.app was used only for this width measurement.
- **Cleanup:** I stopped every process I started: the so session, the tui-test session and monitor, the measurement windows, and kitty, iTerm2 (including its `iTermServer`), and Terminal.app, all of which I had launched at 22:54. I also removed the temp repo and probe files. Still running, as before: Ghostty 29823 (since Sep 7), sandbox 49528–49530, and 43089/43090.

### Deviations and Remaining Issues

- `TOKENS` in `src/ui/theme.ts` is now exported so `theme.test.ts` can list every token. Knip stays clean.
- T4 also touched `src/ui/editors/registry.ts` (`WindowView.textArea?`), `src/ui/editors/text-view.ts` (`textArea`), and `src/ui/views/window-tree.ts` (`anchor`). These carry the float's anchor: the active text area and the cursor row.
- In T2 the implementation was written before the tests. RED was then shown by running the new tests against the original `text-view.ts` (7 fail).
- `V64` ("frames equal the existing v1 snapshot outside a repository") is shown two ways: no-repo, git-missing, and git-too-old scenes have frames equal to a mount where git was never detected, and the v1 snapshot files are unchanged.
- The hunk float finds `hunk n/m` by matching `new.start` only.
- T5's UI cases could not fail first because they mount `testRegistries()`. Production wiring was proven RED by the T6 PTY e2e.
- `gitDiffKeystrokeP95` keeps its 24 ms target (measured median 7.81 ms), so no relaxation was needed.
- The `src/core/features/git/diff.test.ts` 50 ms timing case did not flake in any of this group's `bun run check` or `bun run test:ci` runs.
- Observed during manual checks but outside this group: `:qa!` is not a so command (`E492`), which is pre-existing v1 behaviour.
- `.s1mple/docs/project.md` cites the system design at its `work/active/` path. The T8 folder move must update it with the other `.s1mple/` references.

## Remediation

- **Verification reports:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p3-g1-verification-report.md` (commit `9c65aa0`, status `Failed`, one Minor finding)
- **Status:** `Completed`

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P3-G1-VER1` — Benchmarks row for `gitDiffKeystrokeP95` renders outside the table | See the closure detail below | `f024d72` | `Fixed` |

#### P3-G1-VER1 — Benchmarks row for `gitDiffKeystrokeP95` renders outside the table

**Change evidence.** The Benchmarks table sits inside the `- **Benchmarks:**` list item, so every row needs the item's two-space indent. The new row had none, which ended the list and the table before it. The fix indents that one row; nothing else in `.s1mple/docs/project.md` changed.

```diff
   | `indexingKeystrokeP95` | 30 | `indexing-keystroke.bench.ts` — 200 keys, …
-| `gitDiffKeystrokeP95` | 24 | `git-diff.bench.ts` — 200 keys in a 5,000-line note …
+  | `gitDiffKeystrokeP95` | 24 | `git-diff.bench.ts` — 200 keys in a 5,000-line note …
```

**Verification evidence.** A scratch script rendered the file with two parsers already in `node_modules`, and was then removed:

- `marked.parse` → the row is the last `<tr>` of the table: `<tr><td><code>gitDiffKeystrokeP95</code></td><td>24</td><td><code>git-diff.bench.ts</code> — 200 keys …</td></tr></tbody></table>`. The stray `<p>| <code>gitDiffKeystrokeP95` paragraph is gone.
- `mdast-util-from-markdown` with `micromark-extension-gfm` and `mdast-util-gfm` → the `Metric` table's parents are `root > list > listItem`, it has 11 rows (header plus the 10 `TARGETS` in `scripts/bench-gate.ts`), and its last two rows are `indexingKeystrokeP95 | 30` and `gitDiffKeystrokeP95 | 24`.
- `bun run check` → exit 0: biome clean (355 files), tsc clean, knip zero findings, 1204 pass, 0 fail.

**Completion Checklist:**

- [x] Required resolution is implemented — the `gitDiffKeystrokeP95` row is indented two spaces like the other rows.
- [x] Required proof passes — `marked` and mdast both show `gitDiffKeystrokeP95` inside a `<td>` of the Benchmarks table; `bun run check` exits 0.
- [x] Change evidence is recorded.
- [x] Verification evidence is recorded.

### Remediation Group Verification

- `bun run check` → `Passed` — exit 0, 1204 pass, 0 fail, knip zero findings.
- `grep -rnE "W261005F2A7|\b(REQ|DES|UDES|UV|UREQ|US)[0-9]" src test scripts` → `Passed` — no matches (exit 1).
- Self-review of `4b8834f..f024d72` → no new issue. The fix changes only one Markdown line. The source diff still passes `this.change` to every `gutterWidth` caller (cursor, `textArea`, hit-test, paint), and the statusline measures `text` while painting `parts`.
- `bun run test:ci`, `bun run bench`, and `bun run build` were not re-run: the fix touches no code, test, or bench input, so the Initial Implementation results still apply.
- Housekeeping → `Passed`. The temp dirs `so-git-LtZtAZ` and `so-git-tool-J06wS8` in `$TMPDIR` were created at 22:46 on 2026-10-05, during this group's test runs, and match the prefixes in `test/support/git-repo.ts:47` (`so-git-`) and `test/e2e/git-tool.test.ts:25` (`so-git-tool-`). No process held them open (`lsof +D`), so both were removed. `ps` shows no so, lazygit, tui-test, kitty, iTerm2, or Terminal.app process from this work; only the pre-existing 43089/43090 and 49528–49530 remain.

### Unverified Items

These stay unverified; none is claimed as passed:

- **`UV15@R1` hand-off in kitty:** Skipped. No kitty window could be observed: screen capture lacks Screen Recording permission, and tui-test mirrors only into its monitor.
- **`V61` real graphics protocol by hand:** so ran in the tui-test emulator mirrored to Ghostty, so images drew as cell blocks and the kitty-graphics re-issue was not seen in a real terminal. Automated coverage exists (`V60`, `UV14@R1`).
- **`UV16@R1` visual alignment:** Each glyph measured 1 cell via DSR in four terminals, but alignment was not seen, for the same Screen Recording reason.
- **`P3-G1-T8` delivery:** Not assigned; the orchestrator's Delivery stages own it.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — T1–T7 are implemented and committed, and `P3-G1-VER1` is `Fixed`. T8 is not assigned.
- **Final report commit:** Returned to the orchestrator after this report is committed.
- **Final commits:** `6f16712`, `10f7a65`, `0e189b4`, `af03592`, `2fd53a7`, `cc9e58e`, `e1d4b23`; remediation `f024d72`.
- **Final checks:** `bun run check` → exit 0, 1204 pass. `marked` and mdast renders → `gitDiffKeystrokeP95` inside the Benchmarks table. Id grep → no matches. From the Initial Implementation: `bun run test:ci` → exit 0, 255 pass; `bun run bench` → exit 0; `bun run build` → exit 0.
- **Remaining issues:** The kitty hand-off, the real graphics path, and `UV16@R1` visual alignment are unverified (see Unverified Items). The unstaged `.gitignore` change (`.worktrees/`) does not belong to this group and was left untouched.
