# P2-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-goal.md`
- **Plan Part:** `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-plan-2-core-state-and-workspace.md`
- **Group:** `P2-G2` — Workspace Adapters, Effect Runner, and Integration
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`, `P2-G2-T3`, `P2-G2-T4`, `P2-G2-T5`, `P2-G2-T6`, `P2-G2-T7`
- **Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p2-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`. Every task is implemented and committed, and every group check passes. knip reports only interim findings. One residual risk (DEV4, second timing path) reproduces under a forced timing and is reported for an orchestrator decision; see Deviations and Remaining Issues, item 1.

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G2-T1` | `src/workspace/ignore.ts`: `createExclusionMatcher`, `ExclusionMatcher`, `ALWAYS_HIDDEN` (made module-private in `34f4946`). Each folder's `.gitignore` is loaded once (memoized, including "none"). Scopes apply root first, and the deeper `unignored` result wins. `isExcludedPath` checks every ancestor as a folder and the path itself as a file. | RED: `bun test src/workspace/ignore.test.ts` → 1 fail, 1 error (module missing). GREEN: 5 pass. Biome and tsc pass. | `91373ac`; follow-up `34f4946` | `Completed` |
| `P2-G2-T2` | `src/workspace/fs.ts`: `readTextFile`, `atomicWrite`, `listDir`, `createEntry`, `moveEntry`, `removeEntry`, `stampOfFile`, `sameStamp`, `FsError`, and a private `stampOfBytes`. `test/fixtures/workspace/**` holds 18 files (notes, `scripts/sync.ts`, `config.yaml`, `notes.txt`, `Makefile`, `photo.png`, `nul-at-100.bin`, `invalid-utf8.txt`, `crlf-bom.md`, root and `pkg/` `.gitignore`, `.env`, `node_modules/`, `build/`, `pkg/dist/`, `keep.log`). Paths the repo ignores were force-added. `test/fixtures/generate.ts`: `makeLargeFile` (17 MiB) and `make5000LineNote`. | RED: `bun test src/workspace/fs.test.ts` → 1 fail, 1 error (module missing). GREEN: 9 pass. Biome, tsc, and knip (no new findings) pass. | `14c09fe` | `Completed` |
| `P2-G2-T3` | `src/workspace/watcher.ts`: `watchWorkspace`, `OwnOps`, `createOwnOps`. The debounce is 50 ms per path, and only `lstat` classifies an event. `stop()` closes the watcher, clears the timers, and drops classifications still in flight. | RED: `bun test src/workspace/watcher.test.ts` → 1 fail, 1 error (module missing). GREEN: 5 pass, 3 runs in a row; `bun test src/workspace` passed 5 runs in a row. | `9ed5898`; T7 fix `d4de279` | `Completed` |
| `P2-G2-T4` | `src/workspace/trash.ts`: `Trash`, `detectTrash`, `freedesktopTrash`, `macTrash(hasTrashCli, spawn = Bun.spawn)`, `trashInfo`. Commands are fixed argv and never a shell. The tests use only temp folders, an `fs.rename` spy, and spawn stubs, so nothing moves to the real Trash. | RED: `bun test src/workspace/trash.test.ts` → 1 fail, 1 error (module missing). GREEN: 6 pass. | `2abd7ba` | `Completed` |
| `P2-G2-T5` | `src/workspace/system.ts`: `ClipboardProvider`, `SysDeps`, `detectClipboard`, `commandProvider`, `osc52Provider` (made module-private in `34f4946`). | RED: `bun test src/workspace/system.test.ts` → 1 fail, 1 error (module missing). GREEN: 8 pass. | `5772a45`; follow-up `34f4946` | `Completed` |
| `P2-G2-T6` | `src/app/effects.ts`: `createEffectRunner` (`run`, `flush`), `EffectRunner`, `RunnerDeps`. One serial promise chain carries `write`, `create`, `rename`, `move`, and `trash` (`permanent` → `removeEntry`). Each records its own operation (`noteWrite`, `noteMove`, `noteRemove`) and dispatches exactly one result. Reads and listings run in parallel. `msg(x)` (via `FsError.from`) is the single place errors become text. Timers re-arm until `now() ≥ due`, and restarting a timer replaces the previous one. `exit` is read when called, so it can be bound late. | RED: `bun test src/app/effects.test.ts` → 1 fail, 1 error (module missing). GREEN: 10 pass, 5 runs in a row. Mutation check: removing the re-arm guard fails `a timer fires once, never before its delay on the runner's clock`. `bun test test/boundaries.test.ts` → 2 pass. | `5147858` | `Completed` |
| `P2-G2-T7` | `test/integration/helpers.ts` (shared by 3 suites): `startApp` wires the real store, `createUpdate`, runner, `atomicWrite`, and watcher on a temp folder. `tmpWorkspace`, `gatedTrash`, `clock`, `waitFor`, and `settle` support it. Three suites: `save-safety`, `open-save`, and `explorer-ops`. GREEN fix: `src/workspace/watcher.ts` `noteMove` now also covers the folders above the target, by exact path. | RED: `bun test test/integration` → save-safety 6/6 and open-save 6/6 passed on the first run, because T1–T6 already provided the wiring. explorer-ops had 2 failures. One was a test bug (expected `"ta"`; `delta` minus two characters is `"lta"`). The other was a **real defect** in the folder-move case: the `archive/` parent created by `mkdir -p` was reported as `fileChanged{changed, archive, isDir}`. The `gatedTrash` helper also had a bug (its gate reset on release), fixed before commit. GREEN: 4/4. All suites: `bun test test/integration src/workspace src/app` → 60 pass, 5 runs in a row on macOS 14.4. In Docker `oven/bun:1.4.2` (Linux): 60 pass, 3 runs in a row. Mutation checks, each restored afterwards, prove the suites are not vacuous. Removing the expected-stamp check fails the queued-save conflict test. Removing temp cleanup fails the fsync-failure test. Removing `chmod` fails the own-save permissions test. Removing `noteWrite` fails 3 tests. Removing `noteMove` fails 3 tests. Removing the serial queue fails 2 tests. | `d4de279` (fix plus OwnOps unit test), `ef110d6` (suites) | `Completed` |

Each verification case maps to a test file, test name, and command below. Tests are named by behavior. Each command was run as written and selects more than 0 tests; all pass.

| Case | Test file → test name(s) | Command → result |
|---|---|---|
| V12.1 | `src/workspace/ignore.test.ts` → `hidden entries, node_modules, and gitignored folders are excluded` | `bun test src/workspace/ignore.test.ts -t "gitignored folders are excluded"` → 1 pass |
| V12.2 | same file → `a deeper negation re-includes what a shallower pattern excludes` | `bun test src/workspace/ignore.test.ts -t "deeper negation"` → 1 pass |
| V12.3 | same file → `a directory-only pattern excludes the folder but not a file of that name` | `bun test src/workspace/ignore.test.ts -t "directory-only pattern"` → 1 pass |
| V12.4 | `src/workspace/fs.test.ts` → `listing shows symlinks with their target kind and skips excluded entries`, `a linked folder lists only when it is expanded`, `a folder containing a symlink loop lists without recursion`, `a hidden file opens by path` | `bun test src/workspace/fs.test.ts -t "target kind\|only when it is expanded\|symlink loop lists\|hidden file opens by path"` (bare pipes; see block below) → 4 pass |
| V5.1 | `src/workspace/watcher.test.ts` → `own writes match by exact stamp; own moves and removals by path for one second` (clock double), `a move also covers the folders it creates above its target, but not their other entries`, `watching a folder with a symlink loop starts at once`, `an own write is silent and a later external write is reported`, `writes under excluded paths are never reported`, `a removal and a new folder are classified by stat` | see block → 6 pass |
| V11.1 | `src/workspace/trash.test.ts` → `a trashed file has a spec info file with its escaped path and local deletion time` | `bun test src/workspace/trash.test.ts -t "spec info file"` → 1 pass |
| V11.2 | same file → `two trashed files with the same name never overwrite each other` | `bun test src/workspace/trash.test.ts -t "same name never overwrite"` → 1 pass |
| V11.3 | same file → `a failed move leaves no orphan info file and the source intact`, `macOS trash trusts the system API's output, not its exit code`, `a path that looks like script reaches the system API as one argument` | see block → 3 pass |
| V10.1 | `src/workspace/system.test.ts` → `clipboard provider for <macOS with pbcopy \| Wayland \| X11 with a working xsel \| X11 with a failing xsel \| tmux only \| nothing available>` | `bun test src/workspace/system.test.ts -t "clipboard provider for"` → 6 pass |
| V10.2 | same file → `the OSC 52 fallback copies through the terminal and cannot paste` | `bun test src/workspace/system.test.ts -t "OSC 52 fallback"` → 1 pass |
| V10.4 | `src/app/effects.test.ts` → `a clipboard copy failure is reported exactly once` | `bun test src/app/effects.test.ts -t "copy failure is reported exactly once"` → 1 pass |
| V3.1 | `test/integration/save-safety.test.ts` → `a save that fails after fsync keeps the original bytes and leaves no temp file` | `bun test test/integration/save-safety.test.ts -t "fails after fsync"` → 1 pass |
| V3.2 (b), (c), (d) | same file → `an external edit reloads a clean open file and u restores it`; `an external edit of a dirty open file opens a conflict and writes nothing`; `an own save is silent and keeps the file's permissions` (mode 0640; no `fileChanged` within 500 ms) | see block → 3 pass |
| V3.4 | same file → `a queued save over an unseen external edit fails as a conflict and keeps the external text` | `bun test test/integration/save-safety.test.ts -t "queued save over an unseen external edit"` → 1 pass |
| V6.4 | `test/integration/open-save.test.ts` → `opening <photo.png \| nul-at-100.bin \| invalid-utf8.txt \| large.md> is refused without a buffer or a write` | `bun test test/integration/open-save.test.ts -t "is refused without a buffer"` → 4 pass |
| V6.5 | same file → `a saved CRLF file with a BOM keeps its BOM, line endings, and final newline`, `a saved CRLF file with a BOM and no final newline still has none` | `bun test test/integration/open-save.test.ts -t "CRLF file with a BOM"` → 2 pass |
| V13.1 | `test/integration/explorer-ops.test.ts` → `rename onto an existing file and create of an existing name refuse with E13` | `bun test test/integration/explorer-ops.test.ts -t "refuse with E13"` → 1 pass |
| V13.4 | same file → `renaming a dirty open file moves it, then autosave writes only the new path` (disk ops exactly `write a.md`, `rename`, `write c.md`; `a.md` absent; no `fileChanged`, conflict, or deleted state for 1 s after the save) | `bun test test/integration/explorer-ops.test.ts -t "autosave writes only the new path"` → 1 pass |
| V5.5 | same file → `moving a folder with open files re-paths them and reports no own changes` | `bun test test/integration/explorer-ops.test.ts -t "moving a folder with open files"` → 1 pass |
| DEV4 required sequence | same file → `typing during a queued write, then renaming, never writes to the old path` | `bun test test/integration/explorer-ops.test.ts -t "never writes to the old path"` → 1 pass |
| DEV3 carry-over: `now` and timers | `src/app/effects.test.ts` → `a timer fires once, never before its delay on the runner's clock` (half-speed clock double); `test/integration/save-safety.test.ts` → `autosave writes once after its delay on the runner's clock` (real clock: timer `now` ≥ typing time + `delayMs`; exactly one write) | see block → 2 + 1 pass |
| DEV3 carry-over: `"conflict"` string | `src/app/effects.test.ts` → `a write over an unseen disk version fails with the conflict reason` (real `atomicWrite` → `saveFailed{reason:"conflict"}`); end to end in the V3.4 test, where the reducer opens the conflict overlay from that action | see block → 1 pass |

The commands with alternation, exactly as run (`-t` is a JS regex; bare `|`):

```sh
bun test src/workspace/fs.test.ts -t "target kind|only when it is expanded|symlink loop lists|hidden file opens by path"   # V12.4 → 4 pass
bun test src/workspace/watcher.test.ts -t "own writes match|folders it creates|symlink loop starts|own write is silent|excluded paths|classified by stat"   # V5.1 → 6 pass
bun test src/workspace/trash.test.ts -t "no orphan info|output, not its exit code|one argument"   # V11.3 → 3 pass
bun test test/integration/save-safety.test.ts -t "reloads a clean open file|dirty open file opens a conflict|own save is silent"   # V3.2 → 3 pass
bun test src/app/effects.test.ts -t "never before its delay|conflict reason"   # DEV3 → 2 pass
bun test test/integration/save-safety.test.ts -t "autosave writes once after its delay"   # DEV3 → 1 pass
```

### Group Change Range

- **Starting commit:** `3a87bde` (clean tree)
- **Final commit:** `34f4946`
- **Remaining group changes:** None

### Group Verification

- `bun test src/workspace src/app test/integration` (plan Group Verification, adapter units and integration) → `Passed`: 60 pass, 0 fail (9 files). Stable over 5 runs on macOS 14.4. Linux spot check in Docker `oven/bun:1.4.2`, overlayfs, as root: 60 pass, 3 runs in a row. Both CI platforms remain P3-G1-T7's proof.
- `bun test test/integration src/workspace` → `Passed`: 50 pass, 0 fail (8 files).
- `bun test src/core test/vim` (reducers unchanged) → `Passed`: 371 pass, 0 fail (13 files), the same count as P2-G1's final.
- `bun test src test/vim` → `Passed`: 415 pass, 0 fail (19 files).
- `bun test test/boundaries.test.ts` → `Passed`: 2 pass. `src/app` imports workspace and core; workspace imports only core, `node:*`, `ignore`, and Bun; core stays pure.
- `bunx biome check .` → `Passed`: 81 files, no findings.
- `bun --bun run tsc --noEmit -p .` → `Passed`: exit 0.
- `bun run check` → `Failed` (expected under the interim knip rule). Biome and tsc pass. knip exits 1 with only the interim findings below. The unit stage, run directly as `bun test src test/boundaries.test.ts test/repo.test.ts test/vim`, gives 420 pass, 0 fail (21 files).
- Process-ID scan: `grep -rnE '\b(REQ|DES|RF|UREQ|UDES|US|UV)[0-9]+|\b[SV][0-9]+(\.[0-9]+)?\b|\bP[0-9]+-G[0-9]+|W26[0-9]|RM26|\bDI[0-9]|\bPH[0-9]\b|\bG1\b|VER[0-9]|\b(task|goal|roadmap)\b' src test scripts .github` → `Passed` (no match, exit 1).
- Self-review of `git diff 3a87bde..34f4946` (35 files, +2124/−0) → no issue needs a further commit. Two hardening notes are in Deviations and Remaining Issues, item 5.

Interim knip findings at the final commit:

| Finding | Kind | Interim status | Later consumer |
|---|---|---|---|
| `pendingWrites` (`src/core/state/save.ts`) | unused export | Plan-listed output | `src/app/lifecycle.ts` shutdown flush (P3-G1) |
| `WindowId`, `Overlay` (`src/core/state/types.ts`) | unused exported types | G1 protocol | UI views and overlays (P3-G1) |
| `ViewSpec`, `WhichKeyItem` | unused exported types | Carried over from P1-G2 | Markdown views; which-key UI |
| `@opentui/core`, `@xterm/headless` | unused dependencies | Accepted in P1-G1 | UI, UI tests (P3-G1) |
| `src/app/main.ts` | configuration hint (entry has no match) | Accepted since P1-G1 | P3-G1 |

This group cleared these earlier findings: `DirEntry`, `TimerId`, and the `ignore` dependency, now used by `src/workspace` and `src/app`. The runner, watcher, and adapter exports (`createEffectRunner`, `watchWorkspace`, `createOwnOps`, `detectTrash`, `detectClipboard`, `readTextFile`, `atomicWrite`) are not reported, because the test entries import them. `ALWAYS_HIDDEN` and `osc52Provider` were un-exported in `34f4946` because no consumer exists anywhere in this goal. This follows the P2-G1 `ConfigSchema` precedent.

### Deviations and Remaining Issues

1. **DEV4 residual: the second timing path reproduces when forced (orchestrator decision needed).** The required sequence holds against the real serial queue: in-flight write, typing during it, rename, then autosave. Disk ops are exactly `write d.md`, `rename`, `write e.md`. `d.md` is absent afterwards, and the buffer is clean at `e.md`. The test is `typing during a queued write, then renaming, never writes to the old path`. A throwaway probe (not committed) then forced DEV4's second path. It issued `:w` synchronously after `saved(d.md)` was dispatched, before the rename's `fsResult`. Result:
   - effects `[write d.md, rename, write d.md]`;
   - **`d.md` is recreated** with the newer text, and `e.md` keeps the older text;
   - the buffer at `e.md` stays `save.kind === "writing"` forever, because the trailing `saved{path:"d.md"}` matches no buffer. Autosave for that buffer stops, and a later `:q` would wait on it forever.

   The window is a key arriving during the rename's own I/O (a few ms after the flush write). A real user is unlikely to hit it but can. The first DEV4 path (autosave timer before `fsResult`, which needs a rename slower than the autosave delay) was not exercised: slowing `moveEntry` would need a production hook. I made no change, because DEV4 reserves reopening to verification and the orchestrator. **Candidate fix (not implemented):** inside `src/app/effects.ts` only, a write enqueued while a move of its path is still queued is retargeted, at execution time, to the move's destination if that move succeeded. Its `saved`/`saveFailed` then carries the new path. This covers both DEV4 paths without new AppState fields or protocol members. It does change §7's runner semantics, so it needs a decision.
2. **A real defect, found and fixed in T7 (`d4de279`).** `moveEntry` creates missing parents (`mkdir -p`). The watcher then reported the new parent (e.g. `archive`) as an external `changed` folder, which broke "zero fileChanged for own paths" in the folder-move case. `OwnOps.noteMove(from, to)` now also suppresses each folder above `to` for 1 s, by exact path only. Siblings such as `archive/other.md` are still reported, as the unit test `a move also covers the folders it creates above its target, but not their other entries` proves. The signature is unchanged. This is a §7 `createOwnOps` refinement.
3. **Fault injection and queue holding without production hooks:**
   - **Throw after fsync:** the test spies on `node:fs/promises` `rename`, failing only the temp → target rename. That throw comes after write, `fsync`, and `chmod` inside the real `atomicWrite`. The plan suggested "wrapping atomicWrite in the runner deps", but `RunnerDeps` has no write seam, and a wrapper cannot throw inside `atomicWrite`. The spy keeps production code free of fault paths.
   - **Holding the queue:** the queued-save conflict case and the DEV4 sequence hold the serial queue with `gatedTrash()`. This is a `Trash` double passed through the existing `RunnerDeps.trash`, whose `move` resolves only on `release()`.
4. **Refinements to §7 shapes that a remediator must preserve:**
   - **`RunnerDeps`** is `{ root, matcher, ownOps, trash, clipboard, dispatch, exit, now? }`. `exit` is read when called (late binding). `now` defaults to `performance.timeOrigin + performance.now()`, the single clock. There is no `shell` field, because OSC 52 reaches the runner through the provider that `detectClipboard` builds from a callback.
   - **Timers.** The runner records `due = now() + ms` and re-arms until `now() ≥ due`. Without this, a JS timer firing early (or a skewed clock) would make `onTimer`'s `at ≤ now` check drop the autosave for good. Restarting a timer with the same id clears the previous one. The §7 snippet did neither.
   - **`fs.ts` exports.** `stampOfFile` and `sameStamp` are exported, because the watcher uses them; `stampOfBytes` stays private. §4 names `stampOf`, while §7's own code calls `stampOfFile` and `sameStamp`. `FsError.from` keeps `CODE: description` and drops the paths node appends (e.g. `EIO: i/o error`). `msg(x)` in the runner uses it, so `saveFailed`/`fsResult` reasons stay short.
   - **Stamps.** `readTextFile` stats and reads through one file descriptor, so the stamp matches the bytes. A folder or a missing file is refused as `io`. `atomicWrite` takes its stamp from `fstat` of the temp file after `chmod`; rename keeps mtime, so the stamp equals what the watcher computes after the rename.
   - **`listDir`.** A dangling symlink is listed as `file`. Folders come first, then names in code-point order.
   - **`freedesktopTrash`.** It also skips a name whose `files/<name>` already exists with no info file. That avoids overwriting an orphaned trashed item. `macTrash(hasTrashCli, spawn = bunSpawn)` takes the optional spawn the plan allows; the `Spawn` type is private.
   - **`isExcludedPath`.** It tests the path itself as a file. An event for a folder whose own name matches a directory-only pattern (e.g. creating `build/`) is therefore emitted, which costs one harmless relist. Events below it are dropped.
   - **`ignore()` defaults.** The default options are used, so matching is case-insensitive (`ignoreCase: true`), as the design's `ignore()` call implies.
5. **Hardening not done (minor, self-review):**
   - `atomicWrite` opens the temp with `"w", 0o600`. If a stale temp file from a crashed process with the same pid already exists, it keeps that file's mode until `chmod`.
   - `fs.watch` has no `error` listener. A watcher error, such as the root being deleted, would surface as an uncaught exception, which the P3-G1 lifecycle handles as `shutdown(1)`.
6. **Fixtures.**
   - Some fixture paths fall under the repo's `.gitignore` (`.env`, `build/`, `node_modules/`, `pkg/dist/`), so they were added with `git add -f`.
   - The fixture's own `.gitignore` files also apply to the repository for that subtree. That is intended, since they are the exclusion fixture.
   - The no-final-newline CRLF/BOM variant and the 17 MiB file are generated in the suite's temp folder, not committed.
7. **Test timing.** The no-event assertions wait `50 + 300` ms (debounce plus macOS replay), as the test quality rules allow. Positive assertions poll with `waitFor`. `waitFor`'s timeout is 5 s, the same as Bun's default per-test timeout.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p2-g2-verification-report.md` (commit `8868bff`, `Failed`; kept unchanged)
- **Status:** `Completed`. All three findings are fixed and committed, and every group check passes. knip still fails, but only on the interim items.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G2-VER1` | `src/app/effects.ts`: when a rename, move, or trash is queued, the runner records it in `unreported` until it dispatches that operation's `fsResult`. A `write` (and each `flush` write) takes a snapshot of `unreported` when it is enqueued. At execution, `follow(path, before)` applies the snapshot in order: each successful move of the path or a folder above it re-paths the write by prefix, so moves chain; a successful trash or permanent removal cancels it; failed operations change nothing. The re-pathed write calls `atomicWrite`, `noteWrite`, and `saved`/`saveFailed` with the new path. A cancelled write answers once with `saveFailed{path: old, reason: "deleted on disk — :w to recreate"}`. The trash `fsResult` has already marked the dirty buffer `deleted`, so autosave stays blocked, `:q` reports E37, and `:w` recreates explicitly. No protocol member or AppState field was added. Tests: five in `test/integration/explorer-ops.test.ts`, each on its own app with no production hook; a `fs.promises.rename` spy or a held `Trash` double holds the path operation. They cover `:w` during a rename, autosave during a rename slower than the autosave delay, a folder move, two chained moves (`notes → box/notes`, then `box → shelf/box`), and trash. One runner test in `src/app/effects.test.ts` covers a removal, a failed rename, and `flush`. **RED** (before the fix): all 6 fail. The rename cases answer `saved` at `d.md`; the folder cases answer `saveFailed` at `notes/one.md`; trash recreates `d.md`. **GREEN:** 6 pass. Each case asserts that the old path is absent, the new path holds the newest text, the buffer is at the new path, `idle`, and clean, and `:q` emits `exit 0`. The trash case instead asserts that `d.md` is absent, the bin holds the trashed text, the buffer is `deleted`, dirty, and not `writing`, `:q` gives `E37: No write since last change (d.md)`, and `:w` then recreates `d.md` with the newest text. | `a9a5943` | `Fixed` |
| `P2-G2-VER2` | `bunx biome check --write src/workspace/system.ts` joins the `osc52Provider` signature (lines 48–50) onto one line. `bunx biome check .` → exit 0 (81 files, no fixes). `bun run check` → biome and tsc pass, and it stops at knip with exactly the interim items the verification report lists. The initial report's `bunx biome check . → Passed` claim was inaccurate at `34f4946`. It is corrected here, and the original section is kept unchanged. | `7624634` | `Fixed` |
| `P2-G2-VER3` | `src/workspace/fs.ts:atomicWrite`: the temp is removed first (`rm(tmp, {force: true})`, which unlinks a symlink and never touches its target), then opened with `"wx"` and `0o600` (`O_CREAT\|O_EXCL`). An entry that reappears in between makes the open fail, the `catch` removes the temp, and the target keeps its old bytes. Tests in `src/workspace/fs.test.ts`: `a save over a stale temp file writes into a new private temp` checks a stale `0644` temp; an `open` spy sees mode `0600` when the temp opens, the target keeps `0640`, and no temp remains. `a symlink planted at the temp path is never written through` checks that the link target keeps `keep\n` and the saved file is regular. **RED:** 2 fail (mode `0644`; victim overwritten). **GREEN:** 11/11 in `fs.test.ts`. | `0054294` | `Fixed` |

**P2-G2-VER1 completion checklist:**

- [x] Required resolution is implemented. Writes follow moves by prefix and chain in order. A trash or removal cancels the write, which answers once, so the buffer ends `deleted`, not `writing`. Failed operations leave the write unchanged, and `flush` applies the same rule.
- [x] Required proof passes. Proofs (a)–(d), plus chained moves, fail before the fix and pass after it. `bun test test/integration src/workspace src/app` passed 5 consecutive runs (68/68 each) and 3 concurrent runs (68/68 each).
- [x] Change evidence is recorded (table above).
- [x] Verification evidence is recorded (table above, Final Evidence).

**P2-G2-VER2 completion checklist:**

- [x] Required resolution is implemented. `src/workspace/system.ts` is formatted.
- [x] Required proof passes. `bunx biome check .` exits 0, and `bun run check` fails only at knip with the interim items.
- [x] Change evidence is recorded.
- [x] Verification evidence is recorded.

**P2-G2-VER3 completion checklist:**

- [x] Required resolution is implemented. Every save writes into a newly created `0600` temp, and the no-temp-left and old-or-new invariants hold (the existing V3.1 test and the new tests pass).
- [x] Required proof passes. The stale-temp test and the planted-symlink test pass.
- [x] Change evidence is recorded.
- [x] Verification evidence is recorded.

**Remediation notes:**

- **DEV4 residual closed.** Remaining Issues item 1 of the initial section is resolved by `a9a5943`, on both timing paths and for the trash variant.
- **Parent-synchronization candidates (not applied; parent files stay read-only):**
  - **§7 runner semantics:** a write enqueued before an earlier rename, move, or trash reported back follows that operation's outcome. Successful moves re-path it by prefix and chain. A successful trash or removal turns it into `saveFailed{reason: "deleted on disk — :w to recreate"}`. Failed operations change nothing.
  - **§7 `atomicWrite` temp creation:** `rm` the temp, then `open(tmp, "wx", 0o600)`.
- **Commit body deviation.** `7624634` names its task `P2-G2-T5 — Clipboard provider detection`; the plan's exact title is `Implement clipboard provider detection`. No amend is allowed, so the deviation is recorded here. The `Resolves:` and `Work:` lines are exact.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. Every finding is fixed. Group checks pass, and knip reports only interim items.
- **Final report commit:** returned to the orchestrator.
- **Final commits:**
  - Initial: `91373ac`, `14c09fe`, `9ed5898`, `2abd7ba`, `5772a45`, `5147858`, `d4de279`, `ef110d6`, `34f4946`.
  - Remediation: `7624634` (VER2), `0054294` (VER3), `a9a5943` (VER1).
- **Final checks:**
  - **Adapters and integration:** `bun test test/integration src/workspace src/app` → 68 pass, 0 fail (9 files); 5 consecutive runs and 3 concurrent runs.
  - **Unit suites:** `bun test src test/vim` → 418 pass. `bun test src/core test/vim` → 371 pass (unchanged). `bun test test/boundaries.test.ts` → 2 pass.
  - **Lint and types:** `bunx biome check .` → exit 0. `bun --bun run tsc --noEmit -p .` → exit 0.
  - **Fast gate:** `bun run check` → biome and tsc pass, then knip exits 1 with only `@opentui/core`, `@xterm/headless`, `pendingWrites`, `ViewSpec`, `WhichKeyItem`, `WindowId`, `Overlay`, and the `src/app/main.ts` hint. Its unit stage, run directly, gives 423 pass, 0 fail (21 files).
  - **Process-ID scan:** the verifier's `grep -rnE` over `src test scripts .github bin` and the `w261003|hege|rm261003|abzp|dev[1-4]` scan over the remediation diff find no match.
- **Remaining issues:**
  - The watcher has no `error` listener (initial item 5; owned by the P3-G1 lifecycle).
  - The two §7 parent-synchronization candidates above.
