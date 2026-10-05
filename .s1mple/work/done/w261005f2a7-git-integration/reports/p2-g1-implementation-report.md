# P2-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-goal.md`
- **Plan Part:** `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-2-adapters-and-handoff.md`
- **Group:** `P2-G1`
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/done/w261005f2a7-git-integration/reports/p2-g1-implementation-report.md`

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

- **Verification reports:** `.s1mple/work/done/w261005f2a7-git-integration/reports/p2-g1-verification-report.md` (commit `8400e88`, status `Failed`, one finding)
- **Status:** `Completed`

The one finding is fixed. `stage` now reads the index entry before either path and returns `"stale"` when an untracked file has gained an entry. Both non-blocking coverage gaps are closed with tests in the existing suites. Remediation range: `8400e88..1f47793`.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G1-VER1` | **Change:** `src/workspace/git.ts` `stage` runs `ls-files -z -s --eol -- <path>` first, for both paths. `expectedOid: null` with a staged record → `"stale"`, and neither `add` nor `apply` runs. A tracked mismatch stays `"stale"` as before. The `Git.stage` doc comment now says `null` means the file has no entry. No new subcommand: `ls-files` was already allowed. Core already maps `"stale"` to "index changed; hunks refreshed" (`src/core/state/git.ts:432`). **Proof:** new case "an untracked file added elsewhere stages nothing" in `src/workspace/git.test.ts`: write `new.md`, run an external `git add`, then call `stage(expectedOid: null)` with the untracked patch. It asserts `"stale"`, `ls-files -s` unchanged, and `git show :new.md` equal to the file text once. RED before the fix: 9 pass, 1 fail (`Expected: "stale"`, `Received: "ok"`). GREEN: `bun test src/workspace/git.test.ts` → 10 pass, 0 fail, 650 expects. This includes `V36` (untracked intent-to-add still stages), `V37`, and `V62` (subcommand set unchanged). `bun run check` → exit 0, 1192 pass, 0 fail. **Completion checklist:** required resolution implemented; required proof passes; change evidence recorded; verification evidence recorded. | `4a69978` | `Fixed` |

### Coverage Gaps and Unverified Items

| Item | Action | Evidence | Commit |
|---|---|---|---|
| `status` reporting `op: "rebasing"` (non-blocking) | Extended "status is scoped to the workspace prefix and reads the operation": `merge --abort`, `checkout side`, then an interrupted `rebase main` → `op === "rebasing"`. The assertion fails if the rebase does not stop, because `op` would then be `undefined` | `bun test src/workspace/git.test.ts` → pass | `48c4adb` |
| Watcher `error` event path (non-blocking) | New case "a watcher error is logged, silences that folder, and the next retarget watches it again" in `src/workspace/git-watcher.test.ts`, using the existing `watchFn` injection with an `EventEmitter` fake. It asserts one `git.watch.fail` for the dir, the watcher closed, no `onChange` from the closed watcher, and a fresh watch that notifies after `retarget` | Pass. Mutation check: with the `close(dir)` call in the `error` handler removed, the case fails (`Expected: true`, `Received: false` on `closed`). The source was restored with `git checkout` | `1f47793` |
| Linux inotify for `V54`–`V56` | Owned by PR CI (`check` job on `ubuntu-24.04`; integration on `ubuntu-24.04` and `macos-15`). No Linux environment is available locally | Not run locally | None |
| Git 2.31 itself | Unverifiable locally: only Git 2.51 is installed. The stubbed version gate (`V29`) covers the threshold logic | Not run | None |

### Overall Remediation

- **Verification report:** `.s1mple/work/done/w261005f2a7-git-integration/reports/overall-verification-report.md` (commit `f9c5b9b`, status `Failed`, one finding `OVR-VER1`, owner `P2-G1`)
- **Status:** `Completed`

`OVR-VER1` is fixed. `bunGitSpawn` decoded Git output with `Response.text()`, which drops a leading UTF-8 BOM, so `readIndex` handed BOM-free blob text to `normalizeIndexText` and `bom` was always `false`. Git stdout and stderr are now decoded with `new TextDecoder("utf-8", { ignoreBOM: true })`, the same choice as the file adapter (`src/workspace/fs.ts:76`). Remediation range: `f9c5b9b..ddfff98`.

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `OVR-VER1` | **Change:** `src/workspace/git.ts` adds a private `decode` (a shared BOM-keeping UTF-8 decoder over `Response.arrayBuffer()`) and uses it for stdout and stderr in `bunGitSpawn`. That covers every Git output path, including `cat-file blob` for `readIndex`. The input side was already symmetric: patch and blame contents go on stdin through `Buffer.from(string)`, which encodes U+FEFF as `EF BB BF`, and blame contents come from `saveText`, which puts the BOM back. `test/support/git-repo.ts` decodes stdout the same way, so `git show :a.md` returns the exact blob text. No contract, design, or subcommand change. **Proof:** new real-Git case "an index entry that starts with a BOM keeps it" in `src/workspace/git.test.ts`: a committed `﻿hello\nworld\n` reads as `{ lines: ["hello", "world"], finalNewline: true, bom: true, eol: "\n" }`, and blame of line 0 with BOM contents is committed. New case "a clean note with a BOM has no hunks and stages an edit" in `test/integration/git.test.ts`: after open there are zero hunks and the statusline counts are `0/0/0`; after `ggA there` and `<leader>ghs`, `gitStaged` is `ok` and `git show :a.md` is `﻿hello there\nworld\n`; after another line-0 edit, `<leader>ghr` restores the text and the buffer keeps `bom: true`. RED before the fix: the adapter case got `bom: false`, and the integration case got one `change` hunk on line 0. GREEN: `bun test src/workspace/git.test.ts test/integration/git.test.ts` → 15 pass, 0 fail. | `ddfff98` | `Fixed` |

**Checks at `ddfff98`:**

- `bun run check` → exit 0: Biome no fixes, tsc clean, knip zero, 1205 pass, 0 fail.
- `bun run test:ci` → exit 0: 256 pass, 0 fail across 31 files; no `*.snap` file changed.
- `bun test src/workspace/git.test.ts src/workspace/git-watcher.test.ts` → 15 pass, 0 fail.
- `bun test src/app/effects.test.ts` → 22 pass, 0 fail.
- `bun test test/integration` → 63 pass, 0 fail.
- `bun test test/ui` → 179 pass, 0 fail; snapshots unchanged.
- `bun test test/boundaries.test.ts` → 2 pass, 0 fail.
- `grep -rnE "W261005F2A7|\b(REQ|DES|UDES|UV)[0-9]" src test scripts` → exit 1, no matches.
- Orphan check before the bench showed only pre-existing PIDs 43089, 43090, and 49528–49530. `bun run bench` → exit 0; `gitDiffKeystrokeP95` median 7.27 ms (limit 48), every other target `ok`.
- `bun run build` → exit 0; `./dist/so --version` prints `so 0.0.0`.
- Process hygiene after the run: only the same pre-existing processes; no `so-git-*` temp dirs remain.
- PR CI on the remediation head is not run here: nothing was pushed.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`: `P2-G1-VER1` is fixed and proven on real Git, both coverage gaps have tests, and every group check passes.
- **Final report commit:** Returned to the orchestrator.
- **Final commits:** `8b58699`, `6e83114`, `46c6d85`, `c7968a0`, `300d620`, `c2f2247`; remediation `4a69978`, `48c4adb`, `1f47793`
- **Final checks:**
  - `bun test src/workspace/git.test.ts src/workspace/git-watcher.test.ts` → exit 0, 14 pass, 0 fail, 671 expects (`V28`, `V29`, `V36`–`V39`, `V54`, `V55`, `V62`).
  - `bun test src/app/effects.test.ts` → exit 0, 21 pass (`V40`, `V41` gitWatch part).
  - `bun test test/integration` → exit 0, 61 pass across 12 files (`V56`, `V57`).
  - `bun run check` → exit 0, Biome 347 files with no fixes, tsc clean, knip zero, 1193 pass, 0 fail.
  - `bun test test/ui` → exit 0, 157 pass, 63 snapshots, no snapshot file changed.
  - `bun test test/e2e` → exit 0, 13 pass.
  - The work-process id, `TODO`, `FIXME`, `console.`, `debugger`, and `.only(` grep over the added lines in `0497871..HEAD` (`src`, `test`) → no matches.
  - Process hygiene → only pre-existing processes remain: sandbox PID 49530, plus three `ugrep` processes started on Sep 28 and Oct 4 whose command lines contain "git". No `so-git-*` or `so-gitwatch-*` temp dirs remain.
- **Remaining issues:** One `bun run check` run failed in Part 1's `src/core/features/git/diff.test.ts:135` timing bound (82.9 ms against < 50 ms), with load average 24. The test passed 5 of 5 runs alone, and the next `bun run check` exited 0. This group did not change that file. It is recorded here and not changed.
