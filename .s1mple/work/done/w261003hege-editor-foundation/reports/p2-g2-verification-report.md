# P2-G2 Verification Report

## Scope

- **Group:** `P2-G2` — Workspace Adapters, Effect Runner, and Integration
- **Tasks:** `P2-G2-T1, P2-G2-T2, P2-G2-T3, P2-G2-T4, P2-G2-T5, P2-G2-T6, P2-G2-T7`
- **Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p2-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p2-g2-implementation-report.md` (report commit `39b1d5b`)
- **Change range verified:** `3a87bde..34f4946` (35 files, +2124/−0; task commits `91373ac`, `14c09fe`, `9ed5898`, `2abd7ba`, `5772a45`, `5147858`, `d4de279`, `ef110d6`, `34f4946`). `39b1d5b` and `9aa5776` change only work documents.
- **Baseline:** branch `feat/rm261003abzp-di1-editor-foundation`, HEAD `9aa5776`, clean tree; Bun 1.4.2; macOS 14.4 (Darwin 23.4.0); Linux spot checks in Docker `oven/bun:1.4.2`.

## Status

`Failed`

The adapters, runner, and integration suites meet most assigned cases, and every V case passes. Three findings remain open:

- The reopened DEV4 race reproduces on both timing paths. It also has a trash variant that the proposed fix does not cover (P2-G2-VER1, Major).
- `biome check .` fails at the final commit, although the implementation report says it passed (P2-G2-VER2, Major).
- `atomicWrite` does not guarantee a newly created `0600` temp file (P2-G2-VER3, Minor).

## Assigned Traceability

- **System Design:** `REQ3, REQ6, REQ7, REQ8, REQ9, REQ10, REQ11 (with REQ1@R3) → DES4, DES5, DES8, DES10, DES11, DES12 (with DES13) → S3, S5, S6, S10, S11, S12, S13 → V3.1, V3.2, V3.4, V5.1, V5.5, V6.4, V6.5, V10.1, V10.2, V10.4, V11.1, V11.2, V11.3, V12.1, V12.2, V12.3, V12.4, V13.1, V13.4, V7.1`. Plan part rows: `REQ9@R1 → DES12 → S12 → V12.1–V12.4`; `REQ1@R3 → DES8 → S3, S6 → V3.1, V3.2, V6.4, V6.5`; `REQ1@R3, REQ6@R1, REQ10@R2 → DES5 → S5 → V5.1, V5.5, V3.2 (d)`; `REQ8@R2 → DES11 → S11 → V11.1–V11.3`; `REQ7@R2 → DES10 → S10 → V10.1, V10.2, V10.4`; `REQ1@R3, REQ10@R2 → DES4, DES13 → S3, S13 → V3.4, V13.1, V13.4`.
- **UI Design:** `None`
- **Roadmap binding:** `w261003hege-discuss-context.md` (RM261003ABZP, PH1@R2, DI1@R2). `git log d00d3a3..HEAD -- .s1mple/work/active/rm261003abzp-so-v1/` is empty. Index `:131` and `:142` still carry DI1@R2. The parent files were not modified.
- **Gate G1** (`rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`): this group produces `readTextFile`, `atomicWrite`, the watcher, and the effect runner. They match the §7 shapes: `readTextFile(path) → TextFile | {refused: "binary" | "tooLarge" | "io"}`, `atomicWrite(path, text, expected?) → Stamp`, `watchWorkspace(root, ownOps, matcher, emit) → stop`, and `createEffectRunner(deps) → {run, flush}`. G1 is not due within this goal. Its evidence belongs to P3-G1-T6/T7.

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ9@R1 → DES12 → S12 → V12.1–V12.3` | None | Hidden and `node_modules` entries always excluded; nested `.gitignore` scopes tested relative to their folder; deeper negation wins; directory-only patterns; each `.gitignore` read once | `src/workspace/ignore.ts:createExclusionMatcher` (`scope` memoizes `null` too; root-first loop, `unignored` resets) | `Satisfied` |
| `REQ9@R1 → DES12, DES8 → S12 → V12.4` | None | Symlinks listed with target kind; a linked folder lists only when expanded; loops never recurse; hidden file opens by path | `src/workspace/fs.ts:listDir` (one `readdir`, `stat` only for symlinks), `readTextFile` | `Satisfied` |
| `REQ1@R3 → DES8 → S3 → V3.1, V3.2` | None | Atomic write with fsync, temp removed on failure, original mode kept, temp private until chmod | `src/workspace/fs.ts:atomicWrite`. Mode kept and no temp leak are proven. The "temp created `0600`" invariant is not guaranteed when the temp path already exists (P2-G2-VER3) | `Mismatch` |
| `REQ1@R3, REQ11@R2 → DES8, DES6 → S6, S3 → V6.4, V6.5` | None | Binary, NUL-in-8 KiB, invalid UTF-8, and > 16 MiB files are refused with no buffer and no write; BOM, CRLF, and final-newline state kept | `readTextFile` policy; `test/integration/open-save.test.ts` | `Satisfied` |
| `REQ1@R3, REQ6@R1, REQ10@R2 → DES5 → S5 → V5.1, V3.2 (d)` | None | 50 ms per-path debounce; classification by `lstat` only; own writes matched by exact stamp; own moves and removals matched by path for 1 s; excluded paths silent | `src/workspace/watcher.ts:watchWorkspace`, `createOwnOps` | `Satisfied` |
| `REQ10@R2 → DES13, DES5 → S13, S5 → V5.5` | None | A folder move re-paths buffers; zero own `fileChanged` | `createOwnOps.noteMove` (exact-path cover of created parents, `d4de279`); `explorer-ops` suite | `Satisfied` |
| `REQ8@R2 → DES11 → S11 → V11.1–V11.3` | None | Spec info file first (`wx`), unique names, no orphan on failure, macOS stdout check, argv only | `src/workspace/trash.ts:freedesktopTrash`, `macTrash`, `trashInfo`, `detectTrash` | `Satisfied` |
| `REQ7@R2 → DES10 → S10 → V10.1, V10.2` | None | Neovim 0.11 provider order; OSC 52 copy-only through a callback | `src/workspace/system.ts:detectClipboard`, `commandProvider` | `Satisfied` |
| `REQ7@R2 → DES10 → S10 → V10.4` | None | A clipboard failure is reported exactly once | `src/app/effects.ts` `clipboardWrite` and `clipboardRead` branches | `Satisfied` |
| `REQ1@R3 → DES4, DES8 → S3 → V3.4` | None | Expected-stamp conflict; `saveFailed{reason:"conflict"}` opens the conflict; external text kept | `atomicWrite` stamp check → `FsError("conflict")` → `msg` keeps `"conflict"` → `onSaveFailed` | `Satisfied` |
| `REQ10@R2 → DES13, DES8 → S13 → V13.1` | None | `E13: File exists (b.md)`; bytes unchanged | `moveEntry`, `createEntry` (`wx`, `EEXIST` → E13) | `Satisfied` |
| `REQ10@R2, REQ5@R1 → DES13, DES4 → S13, S3, S4 → V13.4` | None | Rename of a dirty open file, then autosave, writes only the new path; open buffers stay consistent | The V13.4 sequence passes. A write issued between `saved(old)` and the rename's `fsResult` (`:w`, or autosave during a rename slower than 1 s) still writes the old path. The same race lets a write recreate a just-trashed file (P2-G2-VER1) | `Mismatch` |
| `REQ1@R3, REQ5@R1, REQ10@R2 → DES4 → S3, S13` (runner) | None | Every mutating effect runs on one serial chain; every fallible effect answers once; `flush` uses the same queue; `exit` is late-bound | `src/app/effects.ts:createEffectRunner` (`serial`, `runFsOp`, `flush`) | `Satisfied` |
| `REQ1@R3 → DES2, DES14 → S7 → V7.1` | None | `src/app` imports workspace and core; workspace imports only core; core stays pure | `test/boundaries.test.ts` | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V12.1` | `S12` | `DES12` | `bun test src/workspace/ignore.test.ts -t "gitignored folders are excluded"` | 1 pass. Asserts `.git`, `.obsidian`, `.env`, `node_modules`, `pkg/node_modules`, `build`, and `pkg/dist` are excluded | `Passed` |
| `V12.2` | `S12` | `DES12` | `… -t "deeper negation"` | 1 pass. `keep.log` and `pkg/x.tmp` are shown; `pkg/y.tmp` is excluded | `Passed` |
| `V12.3` | `S12` | `DES12` | `… -t "directory-only pattern"` | 1 pass | `Passed` |
| `V12.4` | `S12` | `DES12, DES8` | `bun test src/workspace/fs.test.ts -t "target kind\|only when it is expanded\|symlink loop lists\|hidden file opens by path"` (bare pipes) | 4 pass | `Passed` |
| `V5.1` | `S5, S12` | `DES5` | `bun test src/workspace/watcher.test.ts -t "own writes match\|folders it creates\|symlink loop starts\|own write is silent\|excluded paths\|classified by stat"` | 6 pass. Watcher start < 100 ms with a loop present | `Passed` |
| `V11.1` | `S11` | `DES11` | `bun test src/workspace/trash.test.ts -t "spec info file"` | 1 pass | `Passed` |
| `V11.2` | `S11` | `DES11` | `… -t "same name never overwrite"` | 1 pass | `Passed` |
| `V11.3` | `S11` | `DES11` | `… -t "no orphan info\|output, not its exit code\|one argument"` | 3 pass | `Passed` |
| Real Trash isolation | `S11` | `DES11` | Inspection of `trash.test.ts`, `effects.test.ts`, `test/integration/*` | Freedesktop cases use a temp `XDG_DATA_HOME`. macOS cases use a `spawn` stub. The runner and integration suites use a rejecting or gated `Trash` double. `detectTrash` is called only with `linux` plus a temp `XDG_DATA_HOME`, or with `win32`. Nothing reaches `/usr/bin/trash`, `osascript`, or `~/.Trash` | `Passed` |
| `V10.1` | `S10` | `DES10` | `bun test src/workspace/system.test.ts -t "clipboard provider for"` | 6 pass | `Passed` |
| `V10.2` | `S10` | `DES10` | `… -t "OSC 52 fallback"` | 1 pass | `Passed` |
| `V10.4` | `S10` | `DES10` | `bun test src/app/effects.test.ts -t "copy failure is reported exactly once"` | 1 pass (exactly one `clipboardText{text:"", error}`) | `Passed` |
| `V3.1` | `S3` | `DES8, DES4` | `bun test test/integration/save-safety.test.ts -t "fails after fsync"` | 1 pass. The `fs.promises.rename` spy fails only the temp→target rename (`reason: "EIO: i/o error"` proves the spy took effect). Original bytes are kept and no `.so-tmp-` file remains | `Passed` |
| `V3.2` (b)(c)(d) | `S3, S5` | `DES5, DES8` | `… -t "reloads a clean open file\|dirty open file opens a conflict\|own save is silent"` | 3 pass. Mode `0640` is kept, with no `fileChanged` in 500 ms | `Passed` |
| `V3.4` | `S3` | `DES4, DES8` | `… -t "queued save over an unseen external edit"` | 1 pass (`saveFailed{reason:"conflict"}` → conflict overlay; disk keeps the external text) | `Passed` |
| `V6.4` | `S6` | `DES8` | `bun test test/integration/open-save.test.ts -t "is refused without a buffer"` | 4 pass | `Passed` |
| `V6.5` | `S3, S6` | `DES8` | `… -t "CRLF file with a BOM"` | 2 pass | `Passed` |
| `V13.1` | `S13` | `DES13, DES8` | `bun test test/integration/explorer-ops.test.ts -t "refuse with E13"` | 1 pass | `Passed` |
| `V13.4` | `S13, S5` | `DES13, DES4` | `… -t "autosave writes only the new path"`; `… -t "never writes to the old path"` | 1 + 1 pass. The planned sequences hold, but the remaining timing paths fail (next row) | `Passed` |
| DEV4 reassessment | `S13, S3, S4` | `DES4, DES13` | Throwaway probes (not committed, removed before the suite runs) on `startApp` with a real runner, `atomicWrite`, and watcher | (A) `:w` dispatched synchronously after `saved{d.md}`, before the rename's `fsResult`. (B) Rename slowed to 1.6 s by an `fs.promises.rename` spy, then typing after `saved{d.md}`, so the 1 s autosave fires during the rename. Both give effects `[write d.md, rename, write d.md]`: `d.md` recreated with the newer text, `e.md` left with the older text, and the buffer at `e.md` stuck in `save.kind: "writing"`. (D) `:q` in that state emits no effect and leaves `terminal.quit = {code:0, waiting:[1]}` forever. (C) Trash variant: `:w` after `saved{d.md}`, before the trash's `fsResult`, recreates the trashed `d.md`; the buffer ends `disk: "present"` while the message still says `deleted on disk — :w to recreate` | `Failed` (P2-G2-VER1) |
| `V5.5` | `S5, S13` | `DES5, DES13` | `… -t "moving a folder with open files"` | 1 pass | `Passed` |
| `V7.1` | `S7` | `DES2, DES14` | `bun test test/boundaries.test.ts` | 2 pass | `Passed` |
| DEV3: `now` and timers | `S3` | `DES4` | `bun test src/app/effects.test.ts -t "never before its delay\|conflict reason"`; `bun test test/integration/save-safety.test.ts -t "autosave writes once after its delay"`; code inspection | 2 + 1 pass. The runner records `due = now() + ms` and re-arms until `now() ≥ due`, so a timer never fires early on the runner's clock. The integration helper's key clock uses the runner's formula (`performance.timeOrigin + performance.now()`); P3 wiring must keep the UI key clock identical | `Passed` |
| DEV3: `"conflict"` string | `S3` | `DES4, DES8` | Same `effects.test.ts` case; V3.4; inspection | The real `atomicWrite` throws `FsError("conflict")`. `msg` = `FsError.from(x).message` returns the same instance, so the runner sends `"conflict"`, and `onSaveFailed` compares `a.reason === "conflict"` | `Passed` |
| Group: adapter units + integration | `S3, S5, S6, S10–S13` | `DES4, DES5, DES8, DES10–DES13` | `bun test test/integration src/workspace src/app` | 60 pass, 0 fail (9 files). 5 consecutive runs: 60/60 each. 3 concurrent runs of `bun test test/integration src/workspace`: 50/50 each. Docker Linux (`oven/bun:1.4.2`), 3 runs: 60/60 each | `Passed` |
| Group: reducers unchanged | None | None | `bun test src/core test/vim` | 371 pass, 0 fail (13 files) | `Passed` |
| Group: unit suites | None | None | `bun test src test/vim` | 415 pass, 0 fail (19 files) | `Passed` |
| Group: `biome check .` | `S1` | `DES1` | `bunx biome check .` | **Exit 1.** `src/workspace/system.ts format`: lines 48–50 must be one line after `export` was removed in `34f4946` ("Found 1 error") | `Failed` (P2-G2-VER2) |
| Group: `tsc` | `S1` | `DES1` | `bun --bun run tsc --noEmit -p .` | Exit 0 | `Passed` |
| Group: fast check (interim knip rule) | `S1` | `DES1` | `bun run check`; then `bun --bun run knip` and `bun test src test/boundaries.test.ts test/repo.test.ts test/vim` separately | `bun run check` exits 1 at its **biome** stage, before knip runs. Run directly, knip reports only the listed interim items: `@opentui/core`, `@xterm/headless`, `pendingWrites`, `ViewSpec`, `WhichKeyItem`, `WindowId`, `Overlay`, and the `src/app/main.ts` hint. Unit stage: 420 pass, 0 fail | `Failed` (P2-G2-VER2) |
| Report `-t` commands select > 0 tests | None | None | Every command in the implementation report's case table, run as written | Every command selects ≥ 1 test, and its count equals the report's | `Passed` |
| DEV1 identifier scan | None | None | `grep -rnE '\b(REQ\|DES\|RF\|UREQ\|UDES\|US\|UV)[0-9]+\|\b[SV][0-9]+(\.[0-9]+)?\b\|\bP[0-9]+-G[0-9]+\|W26[0-9]\|RM26\|\bDI[0-9]\|\bPH[0-9]\b\|\bG1\b\|VER[0-9]\|\b(task\|goal\|roadmap\|work item)\b' src test scripts .github bin`; plus `w261003\|hege\|rm261003\|abzp\|dev[1-4]` over the changed files | No match (exit 1 for both). Test names, fixture names, comments, and log text are free of process IDs | `Passed` |
| Watcher hardening: no `error` listener | `S5` | `DES5` | Throwaway script: watch a temp root, then delete the root (macOS, and Linux in Docker) | Neither platform emits `error`. Linux emits one event with an `undefined` name, which `watchWorkspace` drops (`if (!name …) return`). Other `FSWatcher` errors were not reproduced (see Unverified Items). No requirement or design rule covers watcher failure; the P3 lifecycle owns uncaught errors | `Passed` (residual noted) |
| Own create through the watcher | `S5` | `DES5, DES13` | Throwaway probe: explorer `a new<CR>` with the watcher running | `fsResult` → `read new.md`, then a watcher `fileChanged{changed, new.md}` → a second `read` → `onDiskLoaded` returns early on the same stamp. No reload, conflict, or deleted notice occurs, so REQ10@R2 (requirements `:544`) holds. The `OwnOps` contract has no create note, and §7 does not require one | `Passed` (observation) |

**Implementer deviations assessed:**

| Deviation | Judgment | Reason |
|---|---|---|
| `RunnerDeps = {root, matcher, ownOps, trash, clipboard, dispatch, exit, now?}` without `shell` | Acceptable open detail | OSC 52 reaches the runner through the provider that `detectClipboard` builds from a callback (DES10), and `destroy` goes through the late-bound `exit` (§5 wiring). `root` and `matcher` are needed by `abs` and `listDir`. `now?` defaults to the design's single clock and adds no symbol |
| Timer re-arm guard and restart replacement | Necessary | Without it, an early JS timer or clock skew makes `onTimer`'s `at ≤ now` drop the autosave for good. This closes the DEV3 carry-over, and the implementer's mutation check proves the test depends on it |
| `stampOfFile` and `sameStamp` exported instead of `stampOf` | Acceptable | §7's own code uses these names, and DES8 lists `stampOf*`. `stampOfBytes` stays private |
| `ALWAYS_HIDDEN` and `osc52Provider` un-exported (`34f4946`) | Acceptable | Neither is a G1 export (G1 lists `src/workspace/{fs,watcher}.ts`), and DI2 reuses `ExclusionMatcher`, not `ALWAYS_HIDDEN`. Un-exporting follows the interim knip rule and the P2-G1 `ConfigSchema` precedent. The edit introduced the formatting failure in P2-G2-VER2 |
| Dangling symlinks listed as `file` | Acceptable open detail | Opening one yields the `io` refusal. No recursion and no crash |
| Freedesktop trash also skips a name whose `files/<name>` already exists | Acceptable | It keeps the spec's "never overwrite" property for orphaned trash items. It costs one `lstat` |
| `OwnOps.noteMove` also covers the folders above `to`, by exact path (`d4de279`) | Necessary | It fixed the real V5.5 defect: the `mkdir -p` parent was reported as an external change. The signature is unchanged, and siblings are still reported (unit test) |
| Fault injection through a `node:fs/promises.rename` spy; queue held by a gated `Trash` double | Acceptable | No production hook (plan T7 forbids new ones). Both use existing seams and are confined to tests |
| `FsError.from` drops node-appended paths | Acceptable | One normalization point (`msg`), as plan T6 REFACTOR requires |

## Findings

### P2-G2-VER1 — Major — Correctness — A write queued behind a rename, move, or trash of its path still targets the old path

- **System Design:** `REQ10@R2, REQ5@R1, REQ1@R3 → DES4, DES13 → S13, S3, S4 → V13.4` (goal DEV4, reopened)
- **UI Design:** `None`
- **Evidence:**
  - The reducer emits a `write{path: old}` whenever the buffer's path is still `old`. That holds from `saved(old)` until the rename's or trash's `fsResult`. The runner queues the write behind the path operation, and at execution `atomicWrite` skips the stamp check because the target is missing (`src/workspace/fs.ts:105-107`, `if (expected && cur && …)`). The write therefore recreates `old`. Its `saved{path: old}` then matches no buffer (`src/core/state/save.ts:127-128`, `bufferForPath` → `none`), so the re-pathed buffer stays `writing`.
  - Independent probes on the real store, runner, `atomicWrite`, and watcher (throwaway file, not committed):
    - (A) `:w` right after `saved{d.md}` and (B) a 1.6 s rename (spy on `fs.promises.rename`) with typing after `saved{d.md}` both produce `[write d.md, rename, write d.md]`. `d.md` is recreated with `lta\n`, `e.md` keeps `elta\n`, and the buffer at `e.md` has `save: {kind: "writing", version: 2}` and `dirty: true` permanently.
    - (D) A later `:q` emits no effect, and `terminal.quit` stays `{code:0, waiting:[1]}`.
    - (C) Trash variant: `:w` after `saved{d.md}`, before the trash's `fsResult`, gives `[…, write d.md, trash, …, write d.md]`. The trashed `d.md` exists again, and the buffer ends `disk: "present"` under the stale message `deleted on disk — :w to recreate`.
  - Path B needs only a rename slower than the 1 s autosave delay. Path C is more likely in practice, because the macOS JXA/`/usr/bin/trash` call is a process spawn whose duration was not measured, and a user may keep typing in the still-open buffer after `d y`.
- **Impact:**
  - **Rename and move:** the old path is recreated, the new path holds older text, and autosave stops for that buffer. `:q` hangs until `:q!`. This breaks S13 (never recreate a moved file, keep open buffers consistent), S3 (autosave keeps working), and S4/REQ5 (`:q` flushes then exits).
  - **Trash:** a file the user just trashed silently reappears. This contradicts DES13 ("after a trash … marks still-dirty ones deleted").
- **Required resolution:**
  - A write that was enqueued before a path operation's result was applied must follow that operation's outcome.
  - After a successful rename or move whose `from` is the write's path or an ancestor of it, the write targets the re-pathed destination. Its single `saved` or `saveFailed` carries the path the buffer now has. Several queued moves must chain in enqueue order.
  - After a successful trash or permanent removal of the path or an ancestor, the queued write must not recreate it. It still answers exactly once, and the buffer must end non-`writing` and blocked from autosave. For example, `saveFailed` leaves it `deleted`, so `:q` reports E37 and `:w` recreates explicitly.
  - Writes queued after a failed operation, or not behind any path operation, are unchanged. `flush` applies the same rule.
- **Assessment of the proposed fix:** The implementer's runner-only change is sound and stays within the design for the rename and move cases. It retargets the queued write in `src/app/effects.ts` at execution time and reports `saved` with the new path, with no new AppState field or protocol member. It keeps DES4's serial ordering, and the expected stamp still matches after `rename` because rename preserves mtime and bytes. Three gaps must be closed:
  - it must repath by prefix, not only by exact path, so folder moves are covered;
  - it must chain several pending moves;
  - it does not cover the trash variant, which must be added.

  Record the §7 runner-semantics refinement in the implementation report as a parent-synchronization candidate.
- **Required proof:**
  - Integration tests in `test/integration/explorer-ops.test.ts`, named by behavior and using no production hook, for:
    - (a) `:w` between `saved(old)` and the rename's `fsResult`;
    - (b) autosave during a rename slower than the autosave delay (a `fs.promises.rename` spy is acceptable);
    - (c) the same race for a folder move with an open file under it;
    - (d) `:w` between `saved(old)` and a successful trash's `fsResult`.
  - Each test asserts:
    - the old path is absent;
    - the new path holds the newest text (a–c);
    - the buffer has the new path and is not `writing`;
    - a following `:q` exits 0 (a–c) or reports E37 (d).
  - Failure before the fix, pass after it. `bun test test/integration src/workspace src/app` passes 5 consecutive runs.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER2 — Major — Standards — `biome check .` fails at the final commit, contrary to the report

- **System Design:** `REQ2@R2 → DES1 → S1` (group check `bun run check`)
- **UI Design:** `None`
- **Evidence:** `bunx biome check .` at `34f4946`/HEAD prints `src/workspace/system.ts format … Found 1 error` and exits 1. Commit `34f4946` removed `export` from `export const osc52Provider = (` at `src/workspace/system.ts:48`, and Biome now wants lines 48–50 on one line. `bun run check` therefore stops at the biome stage, so it does not fail "only on the interim knip items". The implementation report says `bunx biome check . → Passed: 81 files, no findings` and repeats it in Final Evidence.
- **Impact:** A required group check fails, the CI `check` job would fail on this commit, and the report's check evidence is inaccurate.
- **Required resolution:** Format `src/workspace/system.ts` (`bunx biome check --write src/workspace/system.ts` or an equivalent manual edit), and correct the check evidence when the report is appended.
- **Required proof:** `bunx biome check .` exits 0. `bun run check` fails only at knip with exactly the interim items listed in this report.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER3 — Minor — Correctness — `atomicWrite` can reuse an existing temp path instead of creating a private `0600` file

- **System Design:** `REQ1@R3 → DES8 → S3 → V3.1` (§7 `fs.ts`: "Temp file: created `0600`, then `chmod` to the original mode, so other users can never read a half-written note in a shared folder")
- **UI Design:** `None`
- **Evidence:** `src/workspace/fs.ts:114` uses `open(tmp, "w", 0o600)`. The mode applies only when the file is created, and `"w"` follows a symlink. A throwaway check left a stale `.n.md.so-tmp-<pid>` file at mode `0644`, then opened it as `atomicWrite` does; the new text was written while the file was still `0644`. A crash between `chmod` and `rename` leaves such a file (temp names are per pid, and pids are reused). A symlink planted at the temp name in a shared folder would also be followed. The implementation report lists the stale-mode case as unaddressed hardening (item 5).
- **Impact:** In a shared folder, the half-written note can be readable by other users, or written through a planted link. The likelihood is low, but this is the exact property DES8 added the `0600` temp to guarantee.
- **Required resolution:** `atomicWrite` always writes into a newly created private temp. For example, remove any existing temp (`rm(tmp, {force: true})`) and open it with `"wx"` and `0o600`, which neither follows nor reuses an existing entry. Keep the "no temp left on failure" and "old-or-new file" invariants.
- **Required proof:** Unit tests in `src/workspace/fs.test.ts`:
  - a stale `0644` temp at the computed path → the save succeeds, the target keeps its original mode, and the temp's mode was `0600` before the chmod (for example, assert through a `fs.promises.rename` spy that sees the temp at rename time, or by inspecting the mode under a fault);
  - a symlink at the temp path → its target is not modified.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - **Exclusion rules:** hidden and `node_modules` entries, nested scopes, deeper negation, directory-only patterns, ancestor exclusion, and one read per `.gitignore`.
  - **Listing:** symlink kind, linked folders, and loops.
  - **Open policy:** refusals, including the `io` refusal.
  - **Write integrity:** stamp equality between read and write, stale-stamp conflict, and E13 for create and move.
  - **Watcher:** OwnOps windows and covering parent folders, own-write silence, external changes reported, excluded paths, and stat classification.
  - **Trash:** spec info file, collisions, no orphan, JXA stdout check, and argv injection.
  - **Clipboard:** provider order, OSC 52, and command-provider failures.
  - **Runner:** serial order, one answer per operation, reads and listings, timers (early-fire guard, restart, cancel), late-bound exit, and the flush queue.
  - **End to end:** V3.1, V3.2 (b)(c)(d), V3.4, V6.4, V6.5, V13.1, V13.4, V5.5, and the DEV4 in-flight-write sequence. These run on a real store, runner, file adapter, and watcher, and passed on macOS and in Linux Docker.
- **Missing:**
  - **The DEV4 timing paths and the trash variant** (P2-G2-VER1 proof a–d).
  - **Temp creation over a pre-existing temp path** (P2-G2-VER3 proof).

## Scope Changes

No unplanned files. `test/integration/helpers.ts` is allowed by plan T7 REFACTOR (shared by three suites). The fixture paths that the repository's `.gitignore` covers were force-added on purpose, and the fixture `.gitignore` files are the exclusion fixture.

The refinements to §7 shapes are listed under Technical Verification (Implementer deviations assessed): `RunnerDeps` fields, the timer guard, the `noteMove` parent cover, and the export trims. Each is judged necessary or acceptable, and none changes a G1 export shape. P2-G2-VER1's fix will further refine the §7 runner semantics. It must be recorded for parent synchronization.

## Unverified Items

- **`FSWatcher` `error` events other than root deletion** (for example `EMFILE`, inotify limits at runtime) were not reproduced. Without a listener such an error would surface as an uncaught exception. That is P3-G1 lifecycle territory (`shutdown(1)`), and no assigned requirement covers it. This item is not a finding.
- **Both-platform CI evidence for V5.1, V5.5, and V3.2** remains P3-G1-T7's proof. Local evidence here is macOS 14.4, plus Linux Docker (overlayfs, root) spot runs.
- **The implementer's mutation checks** (removing the stamp check, temp cleanup, chmod, `noteWrite`, `noteMove`, or the serial queue) were not re-run. Non-vacuity was confirmed independently for V3.1 (the spy's `EIO` reason appears in the asserted action) and for the serial-queue and DEV4 behavior (probes).

## Blockers

None
