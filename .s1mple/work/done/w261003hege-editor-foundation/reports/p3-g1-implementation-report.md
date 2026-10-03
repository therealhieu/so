# P3-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-goal.md`
- **Plan Part:** `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-plan-3-ui-shell-app-and-delivery.md`
- **Group:** `P3-G1`: UI Shell, Composition Root, Lifecycle, and Delivery Verification
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`, `P3-G1-T6`, `P3-G1-T7`
- **Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p3-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal. They are not written into this file, because that would need a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`. Tasks T1–T6 are implemented and committed, and every local group check passes.

T7 ran within the user's Delivery Authorization (push + PR):

- The branch is pushed.
- PR #1 is open.
- PR CI is green on both operating systems.
- V11.4 is partially verified (see T7).
- No tag was created or pushed, per the user's decision.

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P3-G1-T1` | **`src/ui/theme.ts`:** `Theme`, `themes` (dark, light, nocolor), `resolveTheme`, `drawCells` (no `fillRect` anywhere). **`src/ui/input.ts`:** `OPENTUI_ESC_MS`, `toKey`, `createKeyNormalizer`. A raw Esc is held for `escTimeoutMs − 20` ms. A legacy meta+key is split into Esc followed by the key. | `bun test src/ui/input.test.ts` → 6 pass. Biome, tsc, and the boundaries test pass. | `8898bd9` | `Completed` |
| `P3-G1-T2` | **`src/ui/shell.ts`:** `RENDERER_OPTIONS`, `createRenderer`, `LayoutClass`/`layoutClass`, `ShellDeps`, `ViewDeps`, `Cursor`, `View`, `Shell`/`createShell` (`attach`, `copyOsc52`, `destroy` once). Focus order for the hardware cursor: overlay → cmdline → explorer → active window.<br>**`src/ui/editors/registry.ts`:** `editorViews`, `registerEditorView`.<br>**`src/ui/editors/text-view.ts`:** `EditorView`, `paintLine`, `Rect`.<br>**`src/ui/views/`:** `bufferline.ts` `Bufferline`; `explorer.ts` `ExplorerView`, `EXPLORER_WIDTH`, `explorerDocked`; `statusline.ts` `Statusline`; `cmdline.ts` `CommandLine`; `window-tree.ts` `WindowTree`.<br>**`src/ui/overlays/`:** `host.ts` `OverlayHost`, `drawFrame`, `wrap`; `notify.ts` `ToastStack`.<br>**`src/ui/theme.ts`:** `themeOf`.<br>**Core:** `src/core/state/keys.ts` `cmdlineCompletions` (exported; Tab fills in the full ex name, listed first); `src/core/state/explorer.ts` `visiblePaths` (exported).<br>**Tests:** `test/support/ui.ts` `mountShell`, `TREE`; `test/ui/{shell.golden,cmdline,esc}.test.ts` with snapshots. | `bun test test/ui/shell.golden.test.ts` → 17 pass, 15 snapshots (reviewed against M1/AD4 DI1 states). `bun test test/ui/cmdline.test.ts` → 3 pass. `bun test test/ui/esc.test.ts` → 2 pass in more than 20 runs. `bun test src/core/state` → pass. | `eb4253a`; follow-up `1ba0f67` (the Esc test times the store update instead of polling, after one 62 ms polling measurement) | `Completed` |
| `P3-G1-T3` | **`src/ui/overlays/prompt.ts`:** `PromptView` (Trash confirm, name field, typed confirmation).<br>**`src/ui/overlays/conflict.ts`:** `ConflictView` with an LCS line diff (side by side at ≥ 100 columns, stacked below) and the `autosave paused` footer.<br>**`host.ts`:** `centered`. **Statusline:** `CONFLICT` badge.<br>**Core:** `keys.ts` `conflictKey`, where `q` returns from the diff (plus a test).<br>**Tests:** `test/ui/file-ops.test.ts`. | RED: 5 failing. GREEN: `bun test test/ui/file-ops.test.ts` → 8 pass. | `55d12a7` | `Completed` |
| `P3-G1-T4` | **`src/app/main.ts`:** `VERSION`, `parseCli`, `resolveWorkspace`, `registries`, `slowWrites` and `injectThrow` (active only when `SO_TEST=1`), and `main`, a linear construction. Watcher, Trash detection, and clipboard detection start in `setImmediate` after the first frame.<br>**`src/app/lifecycle.ts`:** `FLUSH_BOUND_MS`, `installLifecycle`. It flushes each write separately within the bound, restores the terminal once, then writes stderr synchronously.<br>**Tests:** `test/e2e/pty.ts` (`runInPty`, `TerminalProbe`, `ready`), `test/e2e/{restore,quit}.test.ts`. | RED: 8/8 failing. GREEN: `bun test test/e2e` → 8 pass in 7 runs in a row. `bun run build && ./dist/so --version` → `so 0.0.0`. The compiled binary exits cleanly on `:q` in a PTY. | `16d7a7a`; follow-up `989b725` (the colour mode comes only from `NO_COLOR`) | `Completed` |
| `P3-G1-T5` | `test/bench/source-keystroke.bench.ts` (200 keystrokes in a 5,000-line TypeScript file, source view), `test/bench/open-file.bench.ts` (5,000-line note), `scripts/bench-gate.ts` (`TARGETS`, `main`; 5 fresh processes per bench; raw results go to `.so-bench/results.json`). | `bun run bench` → exit 0. Local Mac medians: keystroke p95 3.6–3.7 ms (limit 32 ms), open 7.2–7.3 ms (limit 100 ms). | `a0b1a58` | `Completed` |
| `P3-G1-T6` | `knip.json`: `ignoreExportsUsedInFile: true`; the redundant `src/app/main.ts` entry is removed. The G1 evidence list and PR description draft are below and in PR #1. | `time bun run check` → exit 0 in 2.2 s with 0 knip findings. `bun run test:ci` → 59 pass. `bun test src test/vim` → 425 pass. `bun run bench` → exit 0. `bun install --frozen-lockfile` → no changes. | `37b9e73` | `Completed` |
| `P3-G1-T7` | Delivery within the user's authorization: push + PR, no tag. No repository files changed. | **Push:** `git push -u origin feat/rm261003abzp-di1-editor-foundation` → new branch, plain push. It includes orchestrator commit `3b7714a`.<br>**PR:** `gh pr create --base main` → https://github.com/therealhieu/so/pull/1.<br>**V15.2:** run https://github.com/therealhieu/so/actions/runs/37118234988 → success, 40 s in total. `check` 15 s, `test (macos-15)` 25 s, `test (ubuntu-24.04)` 37 s; 59 tests and 0 fail on both OS.<br>**V15.3:** the Linux log prints `sourceKeystrokeP95 median=12.88ms limit=32ms ok` and `openFile median=20.33ms limit=100ms ok`.<br>**V11.4:** partially verified (details below the table).<br>**V16.1:** `Not authorized — tag out of scope (user decision)`. | No change — delivery verification only. The PR description is updated with the results. | `Completed` |

**V11.4 details** (scratch workspace in the session scratchpad, file `so-v114-scratch-<timestamp>.md`, run in a PTY with `d` then `y`):

| Check | Observed |
|---|---|
| Prompt | Only so's own `Move to Trash? [y/N]` appeared; I saw no other prompt. |
| Trash path used | `/usr/bin/trash` is absent on Darwin 23.4.0, so `detectTrash` chose NSFileManager `trashItemAtURL` through JXA. That call needs no Apple Events. |
| Move result | The move succeeded: the file left the workspace and no error toast appeared. |
| File in `~/.Trash` | Not observable. `ls ~/.Trash` fails with "Operation not permitted" (no Full Disk Access). A Finder AppleScript query fails with "Not authorized to send Apple events to Finder (-1743)". |
| Put Back | Needs Finder. This item and the `~/.Trash` presence are `Pending manual check`. |

**V case → test → command.** Every command was run as written and selects more than 0 tests; all pass. Bun `-t` filters are regexes, so `|` is a bare alternation.

| Case | Test file → test name(s) | Command → result |
|---|---|---|
| V9.3 | `test/ui/esc.test.ts` → `a legacy Esc byte leaves Insert after the 50 ms timeout`, `an arrow key's escape sequence reaches the store at once` | `bun test test/ui/esc.test.ts` → 2 pass |
| V14.1 (goldens) | `test/ui/shell.golden.test.ts` → `shell at 120×36` / `shell at 80×24`: startup, explorer hidden, vertical split, failed save, toasts, code file statusline | `bun test test/ui/shell.golden.test.ts -t "shell at"` → 12 pass |
| V14.1 (segments, expiry) | same file → `a note shows its word count on wide terminals only`, `an info toast expires after 3 s and an error toast stays` | `bun test test/ui/shell.golden.test.ts -t "expires\|word count"` (bare `\|`) → 4 pass |
| V14.3 | same file → `themes` (dark, light, nocolor) | `bun test test/ui/shell.golden.test.ts -t "themes"` → 3 pass |
| V14.2 | `test/ui/cmdline.test.ts` → mode badges, E492, Tab completion | `bun test test/ui/cmdline.test.ts` → 3 pass |
| V14.4 | `test/ui/file-ops.test.ts` → explorer prompts, disk changes, refused files | `bun test test/ui/file-ops.test.ts` → 8 pass |
| V8.1 | `test/e2e/restore.test.ts` → `the terminal is restored on every exit path` (`:q`, SIGTERM, SIGINT, uncaught exception) | `bun test test/e2e/restore.test.ts -t "restored on every exit path"` → 4 pass |
| V8.2 | same file → `NO_COLOR output has no colour escape sequences` | `bun test test/e2e/restore.test.ts -t "NO_COLOR"` → 1 pass |
| V8.3 | same file → `Ctrl-C does not quit; :q does` | `bun test test/e2e/restore.test.ts -t "Ctrl-C"` → 1 pass |
| V4.5 | `test/e2e/quit.test.ts` → `SIGTERM right after typing writes the text and exits 0`, `a hung write delays exit by the flush bound and reports the unsaved file` | `bun test test/e2e/quit.test.ts` → 2 pass |
| V17.1 | `scripts/bench-gate.ts` | `bun run bench` → exit 0 (local and Linux CI) |
| V7.1 | `test/boundaries.test.ts` | `bun test test/boundaries.test.ts` → 2 pass |
| V1.3 | `bun run check` | `time bun run check` → exit 0, 2.2 s |
| V15.2, V15.3 | PR CI | run 37118234988 → success |
| V16.1 | — | `Not authorized — tag out of scope (user decision)` |
| V11.4 | manual | Partially verified; `~/.Trash` presence and Put Back are `Pending manual check` |

**G1 evidence list.** Gate status: `Pending — awaiting DI1 PR merge with CI green`.

| G1 output | Files | Evidence |
|---|---|---|
| Store: `createUpdate`, `createStore`, `Action`/`Effect` | `src/core/state/{update,store,types}.ts` | V7.3, V2.1 |
| `CommandRegistry`, `Keymap` + `KeyScope` | `src/core/kernel/commands/*` | V7.5 |
| `layoutText`, `Decoration` | `src/core/kernel/view/*` | V7.4 |
| `FileTypeRegistry` (text, code, Markdown source) | `src/core/filetypes`, `src/core/lang` | V6.1–V6.3 |
| `lowlightHighlighter` | `src/core/lang/code/highlight.ts` | V6.3 |
| Shell, `editorViews`, `OverlayHost`, `PromptView` | `src/ui/shell.ts`, `src/ui/editors/registry.ts`, `src/ui/overlays/{host,prompt}.ts` | V14.1–V14.4, V9.3 |
| `readTextFile`, `atomicWrite`, watcher, effect runner | `src/workspace/*`, `src/app/effects.ts` | V3.1–V3.4, V5.1, V6.4–V6.5 |
| Composition root, lifecycle | `src/app/{main,lifecycle}.ts` | V8.1–V8.3, V4.5 |
| `bun run check`, CI, bench harness | `package.json`, `.github/workflows/ci.yml`, `scripts/bench-gate.ts` | V1.3, V15.1, V15.2, V15.3, V17.1 |

**Parent map:**

| Parent | Work |
|---|---|
| V1@R1 | V3.1–V3.4 |
| V2@R1 | V2.1 |
| V15@R2 | V7.1–V7.2 |
| V17@R1 | V8.1–V8.2 |
| V18@R1 | V6.1–V6.5 |

Part 1–2 V IDs were not re-run one by one. They passed inside the full `check` and `test:ci` runs and PR CI. PR #1 lists the pending parent synchronization items 1–7 as "pending", not done. V1.4 and V16.2 are recorded in PR #1 from the P1-G1 reviews.

### Group Change Range

- **Starting commit:** `563ef56`
- **Final commit:** `3b7714a` (orchestrator goal-file commit on top of `37b9e73`); the report commit follows.
- **Remaining group changes:** None. In code, `563ef56..HEAD` excluding `.s1mple` is 33 files changed, +4002 / −12. Orchestrator commits `eac91dd` and `3b7714a` touch only `.s1mple` work files.

### Group Verification

- `time bun run check` → `Passed`. Exit 0 in 2.2 s; biome, tsc, and knip are clean with 0 findings; 430 tests pass. Re-run at `3b7714a`: exit 0.
- `bun test test/ui` → `Passed`. 30 tests, 15 snapshots, more than 20 runs.
- `bun test test/e2e` → `Passed`. 8 tests, 7 runs in a row.
- `bun run test:ci` → `Passed`. 59 tests.
- `bun test src test/vim` → `Passed`. 425 tests.
- Full `bun test` → `Passed`. 490 tests, 3 runs.
- `bun run bench` → `Passed`. Local medians 3.7 ms / 7.2 ms; Linux CI 12.88 ms / 20.33 ms.
- `bun install --frozen-lockfile` → `Passed`, no changes.
- `bun test test/boundaries.test.ts` → `Passed`.
- Process-ID scan (`grep` for work, requirement, design, verification, phase, and task IDs over `src test scripts bin .github knip.json package.json`) → `Passed`, no matches.
- PR CI run 37118234988 → `Passed`, 40 s in total.
- Self-review of the group diff from `563ef56` → no defects open.

### Deviations and Remaining Issues

A fresh remediator must keep these decisions:

1. **Core changes, all small and in scope for UV2/UV6:**
   - `cmdlineCompletions` is exported and takes `Pick<Registries, "commands">`; Tab now fills in the full ex name.
   - `visiblePaths` is exported, so the explorer view uses the core's row order.
   - `conflictKey` gains `q` to go back from the diff. The core previously had only `k`, `t`, `d`.
2. **Render errors:** a failing layout paints the raw lines. There is no error notification, because the protocol has no notify action. This differs from the design note "an error notification is dispatched once per buffer version".
3. **Mouse:** `MouseEvent` stays scroll-only (±3 lines on the active window). Explorer clicks are not built.
4. **Watcher error (carry-over from P2-G2):** it is handled by the existing `uncaughtException` path, which flushes, restores, prints `so: <error>` after the restore, and exits 1. I did not add a handler in `watcher.ts`. The path is proven with the injected exception (`SO_TEST_THROW`), not with a real watcher error.
5. **Lifecycle:**
   - stderr is written with `writeSync` after the restore; async writes were lost to `process.exit`.
   - Each write is flushed separately, so the unsaved paths are exact.
   - `so: unsaved:` is printed only on the flush path (signals and exceptions), not for `:q`/`:q!`.
6. **Test hooks:**
   - `SO_TEST_SLOW_WRITE` delays every write, not only the flush. Delaying only the flush let autosave save the file, so the unsaved case could not occur.
   - `SO_TEST_THROW` fires when the active buffer's first line contains "THROW".
   - Both hooks are read only when `SO_TEST=1`.
7. **TDD order:** the T2 tests were written after the views, so the RED step is not shown for T2. T3 and T4 did show RED first.
8. **knip:** `ignoreExportsUsedInFile: true` keeps the design-named exports (`RENDERER_OPTIONS`, `layoutClass`, `paintLine`, `FLUSH_BOUND_MS`, `Overlay`, `ViewSpec`, and others) instead of un-exporting them.
9. **Editor view:**
   - Lines scroll sideways instead of wrapping, matching the core's one row per line.
   - The window shifts its top line when it is shorter than the core's `rows − 2` assumption.
   - A mouse scroll that leaves the cursor off screen hides the hardware cursor.
10. **Statusline and explorer details:** the statusline shows `CONFLICT` while the conflict overlay is open (from M4), and `EXPLORER` while the explorer has focus. Explorer icons are `.md` → `◇` and other files → `≡`.
11. **Arrow keys:** they reach the store, but the core ignores them (outside DI1's key set). The arrow timing test measures dispatch, not cursor movement.
12. **e2e harness:** tests wait for the kitty keyboard push and the first frame (`ready`) before typing. Text is checked on the emulator screen, because the raw output draws characters one cell at a time.
13. **Remaining open items:**
    - V11.4: `~/.Trash` presence and Put Back are `Pending manual check`.
    - V16.1 is not authorized.
    - Gate G1 is pending the PR merge.
    - Parent synchronization items 1–7 are pending (parent writes are not authorized).

## Remediation

Every finding in the P3-G1 verification report is fixed in follow-up commits on top of `56b3826`. The original verification report is unchanged.

- **Verification reports:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p3-g1-verification-report.md` (commit `2a3fc8d`, `Failed`)
- **Status:** `Completed`
- **Remediation range:** `56b3826..383f232` (6 commits; 13 files, +346 / −55)

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P3-G1-VER1` | **Change:** `a` and `r` edit the name in the explorer tree, as in M4 S10/S11 and the parent surface contract (`rm261003abzp-ui-design.md:807, 837-838`). `src/ui/views/explorer.ts:treeField` selects the open create/rename prompt; `rows` inserts a new `◇` row after the selection at the target folder's depth for create, or puts the field on the selected row for rename. The field row is highlighted, its text uses the new `treeField` token (underline; nocolor inverse + underline), and the hardware cursor (`line`) sits after the typed text. `PromptView` hides itself for these prompts and keeps the float for move, trash confirm, and typed confirm; the unused create hint is removed. The prompt state, `AppState`, and the protocol are unchanged. If the explorer were closed, the float is used, so a prompt is never invisible.<br>**Verification:** `bun test test/ui/file-ops.test.ts` → 11 pass. New `a opens a name field in the tree under the target folder` asserts the tree rows `▸ notes`, `▸ scripts`, `≡ config.yaml`, `◇`, `◇ todo.md` (field directly under `config.yaml` at the root), the cursor at (6, 5) after typing `ide`, and `  ◇ draft` indented under `notes`; no float text. `r edits the name in place; m asks for the new path` asserts the `todo.md` row becomes `◇ todo.txt` in place with the cursor at (10, 5), and move still shows `Move to` / `❯ todo.md`. The 8 earlier file-ops tests pass (the create and rename tests were rewritten to the inline placement). A scratch render at 120×36 and 80×24 (floating tree) showed the same rows. | `def2c80` | `Fixed` |
| `P3-G1-VER2` | **Change:** `src/app/effects.ts:createEffectRunner` keeps, per path, the stamp its last write checked against and the stamp it left (`own`). A write whose `expected` is the stamp so's own earlier write replaced (its `saved` not yet seen by `update`, e.g. the shutdown flush behind an autosave) expects the stamp that write left. Any other disk change still fails with `conflict`. The flush stays on the serial queue, so it runs after the in-flight write and within `FLUSH_BOUND_MS`.<br>**Verification:** RED before the fix: `bun test src/app/effects.test.ts -t "flush"` → `a flush behind an in-flight autosave of the same file writes the newest text` failed with `error: conflict` (the verifier's sequence `run(write v1, s0)` → `flush([write v2, s0])`). GREEN: 13 pass; the disk ends `v2`, the flush resolves (so lifecycle adds the path to `saved` and prints no `so: unsaved:`), and the only action is the autosave's `saved`. The companion `a flush still refuses a file changed on disk after so's own write` rejects with `conflict` and keeps the external text. `bun test test/integration test/e2e/quit.test.ts` → 23 pass. | `236362d` | `Fixed` |
| `P3-G1-VER3` | **Change:** `src/ui/views/statusline.ts` pushes the save-error segment right after the path, before `words` (M1 `shared/term.js:294-310`). `middle` moves to `src/ui/theme.ts` and `EditorView.paintWinbar` (`src/ui/editors/text-view.ts`) cuts the winbar path in the middle, leaving room for ` ●`.<br>**Verification:** goldens regenerated on purpose with `bun test test/ui/shell.golden.test.ts -u` (whole file; a `-t` filter with `-u` drops unmatched snapshots). `git diff` of the snapshot file shows exactly one changed line, in `shell at 120×36 > a failed save…`: `NORMAL │ source │ notes/ideas.md ● │ ✗ save failed: EACCES · retry in 1s │ 11 words … 1:8`. The other 14 snapshots are byte-identical. New test `a split window's long title is cut in the middle and keeps the file name` (80×24, `projects/archive/2026/quarterly-planning/ideas.md`, `:vs`): both titles start `projects/archive/20`, contain `…`, and end `-planning/ideas.md`. It fails with the old `paintWinbar` (checked by stashing the fix) and passes with it. | `b8401db` | `Fixed` |
| `P3-G1-VER4` | **Change:** `src/core/state/explorer.ts:isNote(fileTypes, path)` asks the file-type registry (`forPath`, case-insensitive) whether the path is Markdown, the same rule `statusSegments` uses. `ExplorerView` takes `Pick<ViewDeps, "fileTypes">` and uses it; the `.md` branch is gone.<br>**Verification:** `grep -rn '\.md' src/ui` → no matches. New test `the explorer marks notes by their registered file type, in any case` shows `◇ NOTE.MD` and `≡ config.yaml`. It fails before the fix (stash check) and passes after. | `5124916` | `Fixed` |
| `P3-G1-VER5` | **Change:** tests only. `test/support/ui.ts` exposes the mount's registries (`reg`). `test/ui/shell.golden.test.ts`: `a window whose layout throws still shows the file's raw lines` registers a file type whose `analyze` throws, opens `notes/data.broken`, and asserts `   1 first line`, `second line`, then `~`. A mutation that rethrows in the `catch` of `EditorView.layout` makes it fail. `test/ui/file-ops.test.ts` `at 80×24`: the trash confirm (`Move to Trash? [y/N]`, `todo.md`, `y move to Trash   N cancel`), the typed confirm (`✗ Trash is not available`, `This cannot be undone. Type the file name to confirm:`, `⏎ disabled until the name matches · esc cancel`), and the conflict dialog (`▲ todo.md changed on disk`, `while you have unsaved edits. Nothing was overwritten.`, `k keep mine    t take disk    d view diff`) each appear whole on a row that ends with the float's `│`; the footer `autosave paused until you choose` is present. The diff shows the stacked header ` yours − · disk +`, then `− BETA`, `+ alpha`, `  beta`, `  gamma`, `+ delta` in one column, and no `│` in body rows 1–21.<br>**Verification:** `bun test test/ui` → 36 pass, 15 snapshots, 5 runs in a row. | `13fa5e1` (raw lines), `383f232` (80×24) | `Fixed` |

**Completion checklists** (all four items per finding: resolution implemented, proof passes, change evidence recorded, verification evidence recorded):

| Finding | Resolution | Proof | Change evidence | Verification evidence |
|---|---|---|---|---|
| `P3-G1-VER1` | [x] | [x] | [x] | [x] |
| `P3-G1-VER2` | [x] | [x] | [x] | [x] |
| `P3-G1-VER3` | [x] | [x] | [x] | [x] |
| `P3-G1-VER4` | [x] | [x] | [x] | [x] |
| `P3-G1-VER5` | [x] | [x] | [x] | [x] |

### Remediation Deviations

1. **Move keeps the text-field float (deviation, orchestrator decision).**
   - **Location:** `src/ui/overlays/prompt.ts:PromptView` (`Move to`, `❯ <path>`).
   - **Design:** the parent surface contract specifies `m` → "folder picker with destination preview" (`rm261003abzp-ui-design.md:808, 839`; M4 S12).
   - **Reason:** the picker files are outside DI1 (plan Execution Rules exclude picker overlays), so DI1 keeps a path field.
   - **Impact:** the move UI differs from M4 S12 until the picker lands; the core `FsOp` and the move behaviour do not change.
   - **Parent sync:** pending with the other parent items; the later DI that adds the picker replaces this float.
2. **Inline field details not drawn by M4.** The inline `a`/`r` field has no "name exists → inline error" or rename impact line. The core reports errors through toasts and links are outside DI1, as before.
3. **Earlier deviations stand.** Items 1–13 of the Initial Implementation still apply, except item 10's icon rule (now from the file-type registry, VER4).

### Remediation Verification

- `time bun run check` → `Passed` — exit 0 in 2.19 s (real); biome clean (109 files), tsc clean, `bun --bun run knip` exit 0 with no output, 432 pass.
- `bun test test/ui` ×5 → `Passed` — 5/5 runs: 36 pass, 0 fail, 15 snapshots.
- `bun test test/e2e` ×5 → `Passed` — 5/5 runs: 8 pass, 0 fail (4.32–4.44 s).
- `bun test src test/vim` → `Passed` — 427 pass.
- Full `bun test` → `Passed` — 498 pass, 15 snapshots, 0 fail.
- `bun run test:ci` → `Passed` — 65 pass.
- `bun run bench` → `Passed` — exit 0; `sourceKeystrokeP95 median=3.97ms limit=32ms ok`, `openFile median=7.67ms limit=100ms ok`.
- `bun test test/boundaries.test.ts` → `Passed` — 2 pass.
- `bun install --frozen-lockfile` → `Passed` — no changes.
- Process-ID scan (`grep -rnE` for W/RM ids, `REQ|DES|UREQ|UDES|UV|US<n>`, `V<n>.<n>`, `P<n>-G<n>`, `PH/DI<n>`, `M<n>@`, `AD<n>`, `DEV<n>`, `RF<n>`, `-VER<n>` over `src test scripts bin .github knip.json package.json biome.json tsconfig.json`; plus `S<n>`/`M<n>`/`mockup` over the added lines) → `Passed` — 0 matches.
- Self-review of `56b3826..383f232` → no open defects.
- **PR CI (plain `git push` of `d4f19de..383f232`):** run https://github.com/therealhieu/so/actions/runs/37119637536 on head `383f232` → `success`, event `pull_request`, 11:26:03Z → 11:26:36Z (33 s). `check` 10 s (432 pass); `test (ubuntu-24.04)` 29 s and `test (macos-15)` 26 s (65 pass, 0 fail on each). Linux bench: `sourceKeystrokeP95 median=7.65ms limit=32ms ok`, `openFile median=21.46ms limit=100ms ok`.
- The CI run for the report commit that follows is recorded by the orchestrator with the report SHA, because writing it here would need a self-referential commit.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. T1–T6 are implemented and verified, T7 ran within the authorized scope (push + PR, no tag), and every P3-G1 verification finding (VER1–VER5) is fixed with passing local checks and green PR CI on both OS.
- **Final report commit:** returned to the orchestrator after this report is committed.
- **Final commits:**

  | Task or finding | Commits |
  |---|---|
  | T1 | `8898bd9` |
  | T2 | `eb4253a`, `1ba0f67` |
  | T3 | `55d12a7` |
  | T4 | `16d7a7a`, `989b725` |
  | T5 | `a0b1a58` |
  | T6 | `37b9e73` |
  | T7 | No commit (delivery only) |
  | VER1 | `def2c80` |
  | VER2 | `236362d` |
  | VER3 | `b8401db` |
  | VER4 | `5124916` |
  | VER5 | `13fa5e1`, `383f232` |

- **Final checks:**
  - `bun run check` → exit 0 in 2.19 s, 0 knip findings.
  - `bun run test:ci` → 65 pass.
  - Full `bun test` → 498 pass.
  - `bun run bench` → exit 0.
  - PR CI run https://github.com/therealhieu/so/actions/runs/37119637536 → success, 33 s.
- **Remaining issues:**
  - V11.4: `~/.Trash` presence and Put Back are `Pending manual check`.
  - V16.1: `Not authorized — tag out of scope (user decision)`.
  - G1: `Pending — awaiting DI1 PR merge with CI green`.
  - Parent synchronization: items 1–7 pending, plus the move-picker deviation above.
