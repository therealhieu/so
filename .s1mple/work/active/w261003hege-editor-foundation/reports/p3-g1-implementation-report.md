# P3-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-3-ui-shell-app-and-delivery.md`
- **Group:** `P3-G1`: UI Shell, Composition Root, Lifecycle, and Delivery Verification
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`, `P3-G1-T6`, `P3-G1-T7`
- **Report:** `.s1mple/work/active/w261003hege-editor-foundation/reports/p3-g1-implementation-report.md`

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

- **Verification reports:** None yet.
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. T1–T6 are implemented and verified. T7 ran within the authorized scope (push + PR, no tag). PR #1 has green CI on both OS.
- **Final report commit:** returned to the orchestrator after this report is committed.
- **Final commits:**

  | Task | Commits |
  |---|---|
  | T1 | `8898bd9` |
  | T2 | `eb4253a`, `1ba0f67` |
  | T3 | `55d12a7` |
  | T4 | `16d7a7a`, `989b725` |
  | T5 | `a0b1a58` |
  | T6 | `37b9e73` |
  | T7 | No commit (delivery only) |

- **Final checks:**
  - `bun run check` → exit 0.
  - `bun run test:ci` → 59 pass.
  - `bun run bench` → exit 0.
  - PR CI run https://github.com/therealhieu/so/actions/runs/37118234988 → success, 40 s.
- **Remaining issues:**
  - V11.4: `~/.Trash` presence and Put Back are `Pending manual check`.
  - V16.1: `Not authorized — tag out of scope (user decision)`.
  - G1: `Pending — awaiting DI1 PR merge with CI green`.
  - Parent synchronization: items 1–7 pending.
