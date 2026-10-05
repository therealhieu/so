# P2-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-goal.md`
- **Plan Part:** `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-plan-2-adapters-and-handoff.md`
- **Group:** `P2-G1`
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p2-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G1-T1` | `src/workspace/git.ts`: `GitSpawn`, `Git`, `createGit` (`detect`, `status`, `readIndex`, `blame`), `parseVersion`, `MIN_GIT`, `BASE`, `bunGitSpawn`; `test/support/git-repo.ts`: `gitRepo`, `GitRepo`; `src/workspace/git.test.ts` (V28, V29, V38, V39, plus prefix-scoped status and `op`) | RED: `bun test src/workspace/git.test.ts` with `git.ts` moved aside → 0 pass, 1 fail (module not found). GREEN → 5 pass, 0 fail. V38 sensitivity: with `--no-optional-locks` replaced by a dummy `-c`, the mtime case failed (`1791211234936` → `1791211234988`), then passed again once the flag was restored. `bun run check` → exit 0, 1181 pass. | `8b58699` | `Completed` |
| `P2-G1-T2` | `src/workspace/git.ts`: `Git.stage`, `createGit().stage` (intent-to-add for `expectedOid: null`; `ls-files -s` oid guard → `"stale"`; `apply --cached --unidiff-zero --whitespace=nowarn -` with the patch on stdin); `listed(…, others)` shared with `readIndex`; `src/workspace/git.test.ts` (V36, V37, V62) | RED: 5 pass, 4 fail (the four new cases). GREEN: 9 pass, 0 fail. `bun run check` failed with TS2345 in the test (`eol: string` passed as `IndexText`) after commit `6e83114` was made. The follow-up typed the literal; `bun run check` → exit 0, 1185 pass. | `6e83114`, `46c6d85` (follow-up) | `Completed` |
| `P2-G1-T3` | `src/workspace/git-watcher.ts`: `GitWatcher`, `watchGitDirs`, `IGNORED_NAME`; `src/workspace/git-watcher.test.ts` (V54, V55, plus the ignored-name table) | RED: module not found → 0 pass, 1 fail. GREEN: 3 pass. The first version failed 1 of 15 runs on macOS: FSEvents delivered the repository's creation events up to 300 ms after the watch started. Counts now reset after a 300 ms quiet period → 15 runs, then 10 more after the same reset was added to the other cases, 0 fail. `bun run check` → exit 0, 1188 pass. | `c7968a0` | `Completed` |
| `P2-G1-T4` | `src/app/effects.ts`: `RunnerDeps.git`, `RunnerDeps.watchGit`; `gitStatus`, `gitReadIndex`, `gitBlame` (free-running, one action each, failures as failed results, `gitBlamed.now` from the runner clock); `gitStage` on `serial`, echoing `report`; `gitWatch` (one lazily created watcher, retargeted). Only `runTool` is still a no-op. `src/app/main.ts`: `createGit` and `watchGit` in `deps`; `git.detect(ws.root)` → `gitDetected` inside the deferred `setImmediate` block. `test/integration/helpers.ts`: `startApp` builds real `createGit` and `watchGitDirs`, adds an opt-in `git: { env }` that runs `detect` once started, stops every watcher in `stop()`, and exports `gitOff()`. `test/integration/{config,preview-server}.test.ts`: `...gitOff()`. `src/app/effects.test.ts` (V40, V41 gitWatch part, plus one-action status/index/blame reads) | RED: 18 pass, 3 fail (the new cases). GREEN: 21 pass. `bun run check` → exit 0, 1191 pass. `bun test test/integration test/ui` → 216 pass, 0 fail, 63 snapshots. `grep -n 'case "gitStatus"' src/app/effects.ts` → line 507, a real case. | `300d620` | `Completed` |
| `P2-G1-T5` | `test/integration/git.test.ts` (V56, V57) | `bun test test/integration/git.test.ts` → 2 pass, 0 fail in each of 3 runs. No wiring defect found. `bun run check` → exit 0, 1191 pass. | `c2f2247` | `Completed` |

### Group Change Range

- **Starting commit:** `0497871`
- **Final commit:** `c2f2247`
- **Remaining group changes:** None. The unstaged `.gitignore` change (`.worktrees/`) was already there before this group started. It is not part of this group and was left untouched.

### Group Verification

- `bun test src/workspace/git.test.ts src/workspace/git-watcher.test.ts` → `Passed`: 12 pass, 0 fail (V28, V29, V36–V39, V54, V55, V62).
- `bun test src/app/effects.test.ts` → `Passed`: 21 pass, 0 fail (V40, V41 gitWatch part).
- `bun test test/integration` → `Passed`: 61 pass, 0 fail across 12 files (V56, V57; the existing suites pass).
- `bun run check` → `Passed`: exit 0. Biome clean, tsc clean, knip zero findings, 1191 pass, 0 fail. This includes `test/boundaries.test.ts`, which shows that `src/workspace/git*` imports only workspace and core.
- `bun test test/ui` → `Passed`: 157 pass, 0 fail, 63 snapshots. No snapshot file changed (`git status` shows only the pre-existing `.gitignore` change).
- `bun test test/e2e` → `Passed`: 13 pass, 0 fail. The real binary now runs detection after the first frame.
- `grep -rnE "W261005F2A7|\b(REQ|DES|UDES|UV|UREQ|US)[0-9]|\bV[0-9]+\b|\bS[0-9]+\b|P[0-9]-G[0-9]" src test` → `Passed`: no matches.
- Self-review of `0497871..c2f2247`, 12 files → `Passed`: no `TODO`, `FIXME`, `console.`, `debugger`, or `.only(` added. Every Git argv starts with `BASE`. Contents and patches go only on stdin (V62 asserts this). No Git process is constructed or run before `setImmediate` in `main.ts`.
- Process hygiene (`pgrep -fl "bun .*so|git "`) → `Passed`: no orphans from this group. The one match is PID 49530, a `bun src/app/main.ts .sandbox/vault` started at 17:15, hours before this group, so it is not this group's process and was left running.
- Temp dirs → `Passed`: no `so-git-*` or `so-gitwatch-*` dirs left in `os.tmpdir()`. One `so-git-*` dir from a throwaway probe script of mine (not a committed test) timed out before cleanup; it was removed. The 1444 `so-it-*` dirs come from the existing `tmpWorkspace` helper, which never cleans up. They are not from this group.

### Deviations and Remaining Issues

Decisions a fresh remediator must keep:

1. **Log level.** `git.fail` and `git.watch.fail` are logged with `logger.error`. The `Logger` type (`src/workspace/log.ts`) has only `info` and `error`. The plan's `logger.warn` would need a new level across every logger implementation, which is out of this group's scope. `git.fail` carries `command` (the first two arguments after `BASE`, e.g. `"blame --porcelain"`), `code`, and `reason` (the first non-empty stderr line). It never carries contents.
2. **`bunGitSpawn(env)`.** The Bun spawn is an exported factory that takes the environment, `process.env` by default. Production uses the default, so an inherited `GIT_DIR`/`GIT_WORK_TREE` is honoured (DES8). Tests and `startApp` pass the isolated env from `gitRepo`: `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL` set to an empty file, `HOME` set to the temp dir, a fixed author and committer, `LANG`/`LC_ALL=C`. Changing `process.env` instead would leak into other test files, because `bun test` runs every file in one process.
3. **Head discovery.** `detect` always runs `symbolic-ref -q HEAD` and `rev-parse --short -q --verify HEAD`. A failed `symbolic-ref` means detached. A failed `rev-parse` with a ref means unborn. `detect` never rejects: a missing `git` is silent, an old version returns the notice, and a failed `rev-parse` (not a repository) is silent and not logged (the `probe` helper). Any other failure returns `{ repo: null }`.
4. **Index classification.** No `ls-files` record (ignored, or no file on disk yet) → `ignored`. A record without an index stage → `untracked`. Any stage greater than 0 → `tracked` with `conflicted: true`, using the stage-2 ("ours") blob, or the first stage when there is no stage 2. The `i/` EOL attribute maps to `normalizeIndexText`. Anything other than `lf`, `crlf`, or `mixed` maps to `none`.
5. **Untracked stage, confirmed on real Git.** `add --intent-to-add` followed by the empty-entry patch (mode `100644`, `eol` from the buffer) applies, and `git show :new.md` equals the buffer text. `AM` shows once the worktree differs from the staged text. The test makes it differ with a later edit, because the whole-file untracked hunk otherwise leaves `A `. With `core.autocrlf=true`, one edited CRLF line stages as exactly one line (`1\t1\tc.md`), and `git diff` is then empty.
6. **Watcher robustness.** An `FSWatcher` `error` event (for example, a removed dir) is logged as `git.watch.fail` and closes that watcher. A listener ignores events from a watcher that is no longer the open one for its dir, so closed watchers never notify. A dir whose watch threw is tried again on the next `retarget` that still lists it.
7. **`gitBlamed.now`.** The runner sets `now` from its own clock (`now()`, the same epoch-millisecond clock its timers use, and injectable in tests), not `Date.now()`.
8. **`startApp` detection is opt-in** (`git: { env }`). Existing integration suites run no Git process and keep their exact action logs. `RunnerDeps.git` and `watchGit` are required, so the two suites that build their own runner spread `gitOff()`.
9. **T2 has a follow-up commit.** Commit `6e83114` was made while `tsc` failed: `bun run check | tail` hid the exit code. No history was rewritten. `46c6d85` fixes the test typing, and every later check ran with its exit code recorded.

Remaining issues: None. `runTool` stays a no-op until `P2-G2-T4`, as the plan says.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** Not yet verified.
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`: all five tasks are implemented, and the task-level and group-level checks pass.
- **Final report commit:** Returned to the orchestrator.
- **Final commits:** `8b58699`, `6e83114`, `46c6d85`, `c7968a0`, `300d620`, `c2f2247`
- **Final checks:** `bun run check` (exit 0, 1191 pass), `bun test test/integration` (61 pass), `bun test test/ui` (157 pass, 63 snapshots), `bun test test/e2e` (13 pass)
- **Remaining issues:** None
