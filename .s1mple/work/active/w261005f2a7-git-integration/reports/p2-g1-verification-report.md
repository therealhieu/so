# P2-G1 Verification Report

## Scope

- **Group:** `P2-G1`
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p2-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p2-g1-implementation-report.md` (report commit `c3467b4`; change range `0497871..c2f2247`, 12 files)

## Status

`Failed`

All five tasks are implemented, and every assigned `V` case and group check passes. One Major defect remains: staging an untracked file has no index guard. If another writer adds the file to the index before the stage runs, `git apply` inserts the buffer's lines a second time. This was reproduced on real Git 2.51 (`P2-G1-VER1`). It violates REQ1@R2's stale-index rule and `S3`, so the group cannot pass.

## Assigned Traceability

- **System Design:**
  - `REQ7@R2 → DES8 → S24–S26 → V28, V29`
  - `REQ1@R2 → DES4 → S1–S3, S5, S30 → V36, V37, V62`
  - `REQ6@R2 → DES6 → S21 → V38`
  - `REQ4@R3, REQ7@R2 → DES3, DES11 → S11, S26 → V39`
  - `REQ6@R2, REQ7@R2 → DES7 → S22, S23, S25 → V54, V55`
  - `REQ1@R2, REQ9@R1, REQ6@R2 → DES1, DES4, DES6 → S20, S29 → V40, V41 (gitWatch)`
  - `REQ6@R2, REQ9@R1 → DES6, DES7, DES4 → S22, S29 → V56, V57`
- **UI Design:** None

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ7@R2 → DES8 → S24–S26 → V28, V29` | None | Discovery from a subfolder, a linked worktree, and an unborn branch. Version gate at 2.31 tolerates vendor suffixes. Silent without Git or outside a repository. Detection runs after the first frame | `src/workspace/git.ts:193` `detect` (`which` → `--version` → `older(v, MIN_GIT)` → one `rev-parse --path-format=absolute --show-toplevel --git-dir --git-common-dir --show-prefix` → `headOf` at `:178`); `parseVersion` `:62`; `MIN_GIT` `:46`; `src/app/main.ts:308` construction runs no Git, and `git.detect(ws.root)` sits inside the `setImmediate` block after `app.firstFrame` | `Satisfied` |
| `REQ1@R2 → DES4 → S1–S3, S5, S30 → V36, V37, V62` | None | One hunk staged exactly. Untracked file staged through intent-to-add. CRLF/autocrlf stages one line. A changed index entry applies nothing and reports `stale`. Only allowed subcommands; contents only on stdin | `src/workspace/git.ts:260` `stage` (`add --intent-to-add` for `expectedOid: null`; `ls-files -s` oid guard → `"stale"` at `:265`; `apply --cached --unidiff-zero --whitespace=nowarn -` with the patch on stdin); `BASE` `:49` prefixes every argv through `run` `:139` and `probe` `:159` | `Mismatch` — the tracked path matches. The untracked path skips the guard, so an index entry added after the hunks were computed still gets the patch (`P2-G1-VER1`) |
| `REQ6@R2 → DES6 → S21 → V38` | None | No read changes `.git/index` mtime | `BASE` includes `--no-optional-locks` (`src/workspace/git.ts:51`). `status`, `readIndex`, and `blame` all go through `run` | `Satisfied` |
| `REQ4@R3, REQ7@R2 → DES3, DES11 → S11, S26 → V39` | None | Entry kinds ignored / untracked / conflicted / tracked with normalized text. Blame of an unsaved line is uncommitted. `git.fail` is logged with argv[1..2], the exit code, and the first stderr line, never contents | `readIndex` `src/workspace/git.ts:242` (no record → `ignored`, no stage → `untracked`, stage > 0 → `conflicted` with the stage-2 text, `cat-file blob` → `normalizeIndexText`); `blame` `:275` (`--contents -`, `-L line+1,+1`, contents on stdin); `run` logs `git.fail { command, code, reason }` | `Satisfied` |
| `REQ6@R2, REQ7@R2 → DES7 → S22, S23, S25 → V54, V55` | None | First-level watching of unique dirs. Lock, cookie, and `COMMIT_EDITMSG` names never notify. A start failure is logged and skipped. `retarget` closes removed watchers; closed watchers are silent | `src/workspace/git-watcher.ts:20` `watchGitDirs` (`recursive: false`; listener drops `IGNORED_NAME` and events from a watcher that is no longer current, `:36`; `try/catch` → `git.watch.fail`; `error` event closes that watcher, `:39`; `retarget` `:49` deduplicates through a `Set`) | `Satisfied` |
| `REQ1@R2, REQ9@R1, REQ6@R2 → DES1, DES4, DES6 → S20, S29 → V40, V41 (gitWatch)` | None | `gitStage` on `serial` after the acknowledged write, echoing `report`. Status, index, and blame reads dispatch one action each, failures included. One lazily created watcher is retargeted. The runner holds no Git state | `src/app/effects.ts:507–573` (`gitStatus`, `gitReadIndex`, `gitBlame` free-running; `gitStage` via `serial(() => d.git.stage(e.repo, e))`; `gitWatch` → `gitWatcher ??= d.watchGit(...)`, then `.retarget(e.dirs)`); `RunnerDeps.git`, `watchGit` `:64–67`; `runTool` is the only remaining no-op | `Satisfied` |
| `REQ6@R2, REQ9@R1 → DES6, DES7, DES4 → S22, S29 → V56, V57` | None | An external commit updates the ref and explorer markers within 1 s. Edit + save + stage puts the typed line in the index with a clean buffer | `test/integration/helpers.ts:126` real `createGit`, `:149` real `watchGitDirs`, `:216` opt-in detection, `stop()` closes every git watcher; `test/integration/git.test.ts:30`, `:51` | `Satisfied` |

**Recorded deviations, judged:**

| # | Deviation | Judgment |
|---|---|---|
| 1 | `git.fail` and `git.watch.fail` use `logger.error` instead of `logger.warn` | Accepted. `Logger` has only `info` and `error` (`src/workspace/log.ts:11-14`). Adding a level would change every logger and is outside this group. The event names and fields match the design, and both entries carry no file contents |
| 2 | `bunGitSpawn(env)` is a factory, not a value | Accepted. Production calls it with no argument, so `process.env` (and an inherited `GIT_DIR`/`GIT_WORK_TREE`, per DES8) is used. Tests pass an isolated env without changing `process.env`, which all test files share in one `bun test` process |
| 3 | `detect` always runs `symbolic-ref -q HEAD` and `rev-parse --short -q --verify HEAD` | Accepted. `symbolic-ref` succeeds for both a born and an unborn branch, so DES8's "symbolic-ref, or rev-parse when detached" cannot tell them apart without the second probe. It costs one extra process, after the first frame |
| 4 | A missing `ls-files` record means `ignored`, and conflicted entries use the stage-2 text | Accepted. §7 says "none → ignored". Core refuses to stage a conflicted file (`S4`), so the text only drives signs, and "ours" is the side the user edits |
| 5 | Untracked stage confirmed on real Git; `AM` asserted after a later edit | Accepted. An untracked file has one whole-file hunk, so staging it leaves `A ` until the worktree differs. `git show :new.md` equals the buffer text, which closes Part 1 deviation 10 |
| 6 | A watcher `error` event closes that watcher, and the next `retarget` that lists the dir retries it | Accepted. It satisfies "a failing directory never throws to the caller" and keeps the other dirs watched |
| 7 | `gitBlamed.now` comes from the runner clock | Accepted. `wallClock` (`src/app/effects.ts:76`) is epoch milliseconds, which is what Part 1 deviation 2 requires. The clock is injectable, and `V41`'s neighbour test asserts `now: 1234` |
| 8 | `startApp` detection is opt-in; two suites spread `gitOff()` | Accepted. Existing integration action logs stay unchanged, and `RunnerDeps.git`/`watchGit` stay required |
| 9 | Commit `6e83114` was made while `tsc` failed, fixed by `46c6d85` | Accepted as a process lapse with no remaining effect. `46c6d85` changes only a test literal's type annotation (`const empty: IndexText`), so runtime behaviour at `6e83114` was the same. Rewriting history would break the no-amend rule. Every later commit passes `bun run check` |

Part 1 obligations owed to this group are met: the untracked intent-to-add patch applies on real Git (`V36`), blame passes `-L line+1,+1` (`src/workspace/git.ts:283`, asserted by line 1 → uncommitted for the inserted line in `V39`), and the runner sets `gitBlamed.now`.

Binding constraints hold: argv-only spawn with no shell (`Bun.spawn(argv)`), injectable `GitSpawn`, contents and patches only on stdin (`V62`), `--no-optional-locks` on every call through `BASE`, no Git before the first frame, `src/workspace/git*` importing only workspace and core (`test/boundaries.test.ts` passes inside `bun run check`), and no new dependency (`package.json` and `bun.lock` unchanged in the range).

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V28` | `S24`, `S25`, `S26` | `DES8` | `bun test src/workspace/git.test.ts` — "detect resolves a subfolder prefix…" | Subfolder prefix `notes/`. Worktree `commonDir` = main `.git`, `gitDir` = `.git/worktrees/wt`. Unborn `{ kind: "unborn", name: "main" }`. Detached short SHA. Passed | `Passed` |
| `V29` | `S26` | `DES8` | Same file — "detect gates old git…" | `2.20.1` → notice `git 2.20.1 is older than 2.31; git features off`, one spawn only. `which → null` → `{ repo: null }` with no spawn. Outside a repo → `{ repo: null }`, nothing logged. Apple and Windows suffixes parse | `Passed` |
| `V36` | `S1`, `S2`, `S5` | `DES4` | Same file — two staging cases | `diff --cached -U0` holds only hunk 1, and `diff -U0` only hunk 2. Untracked: `show :new.md` = buffer, `AM` after a later edit. `autocrlf=true`: `--numstat` `1\t1\tc.md`, worktree diff empty | `Passed` |
| `V37` | `S3` | `DES4` | Same file — "a changed index entry stages nothing"; plus a real-Git probe of the untracked path (temp test, removed) | Tracked: `"stale"`, `ls-files -s` unchanged. Untracked probe: the file was `git add`ed externally, then `stage(expectedOid: null)` → `"ok"` and `show :new.md` = `"first\nsecond\nfirst\nsecond\n"` | `Failed` (untracked path, `P2-G1-VER1`) |
| `V38` | `S21` | `DES6` | Same file — "reads never touch the index file" | `.git/index` mtime equal after `status`, `readIndex`, `blame`, with a future worktree mtime that forces a locking refresh. The implementer showed the case fails without `--no-optional-locks` | `Passed` |
| `V39` | `S11`, `S26` | `DES3`, `DES11` | Same file — "index reads classify…" | `ignored` (gitignored and missing), `untracked`, CRLF tracked text normalized, conflicted with `["ours"]`. Committed blame shows `Ada`/`init`, and the unsaved line is `{ committed: false }`. One `git.fail` with `command: "blame --porcelain"`, `code: 128`, reason starting `fatal:` | `Passed` |
| `V62` | `S30` | `DES1`, `DES4` | Same file — "every git call uses an allowed subcommand…" | Every argv starts with `BASE`. The subcommand set equals the allowed set exactly. `add` only with `--intent-to-add`, `apply` only with `--cached`. No argv element contains `\n` or content. Apply stdin = patch, blame stdin = contents, other stdin undefined | `Passed` |
| `V54` | `S22`, `S25` | `DES7` | `bun test src/workspace/git-watcher.test.ts` — "a commit notifies within a second…" | `index.lock` write/remove → 0 calls. Commit → ≥ 1 within 1000 ms. Worktree commit notifies both the worktree git dir and the common dir + `refs/heads` | `Passed` |
| `V55` | `S23` | `DES7` | Same file — "a failing directory is logged…" | `git.watch.fail` logged once for dir `a`. `b` notifies. After `retarget([c])`, `b` is silent and `c` notifies. After `stop()`, `c` is silent | `Passed` |
| `V40` | `S29`, `S1` | `DES4` | `bun test src/app/effects.test.ts` — "a stage waits for the write queued before it" | `git.stage` is not called while the gated write is pending. Order is `fsResult`, `saved`, `stage /repo notes/staged.md abc`, `gitStaged`. A rejection becomes `{ failed: "patch failed" }` with the same `report` | `Passed` |
| `V41` (gitWatch) | `S20` | `DES7` | Same file — "git-dir watching reuses one watcher…" | `watchGit` called once. `retarget` called with both dir lists. `onChange` dispatches `gitDirChanged` | `Passed` |
| `V56` | `S22` | `DES6`, `DES7` | `bun test test/integration/git.test.ts` — "an external commit refreshes the ref and markers" | Worktree edit → `notes/b.md` `modified`, `notes` `contains`. External `checkout -b feature` + commit → ref `feature` and no markers within 1000 ms | `Passed` |
| `V57` | `S29` | `DES4` | Same file — "editing, saving, and staging…" | `gitStaged` with `result: "ok"`. `diff --cached` contains `+typed line`. `show :a.md` = `first\ntyped line\nsecond\n`. Buffer clean | `Passed` |
| Reads answer once | `S20` | `DES6` | `src/app/effects.test.ts` — "status, index, and blame reads answer once each…" | Three actions on success and three on failure (`ok: false`, `kind: "failed"`, `{ failed }`), each with the stderr reason; `now` taken from the runner clock | `Passed` |
| Group: adapter and watcher | `S1`–`S3`, `S5`, `S11`, `S21`–`S26`, `S30` | `DES1`, `DES3`, `DES4`, `DES6`–`DES8`, `DES11` | `bun test src/workspace/git.test.ts src/workspace/git-watcher.test.ts` | 12 pass, 0 fail, 613 expects | `Passed` (green suite; the gap in `P2-G1-VER1` is untested) |
| Group: runner | `S20`, `S29` | `DES4`, `DES7` | `bun test src/app/effects.test.ts` | 21 pass, 0 fail | `Passed` |
| Group: integration | `S22`, `S29` | `DES4`, `DES6`, `DES7` | `bun test test/integration` | 61 pass, 0 fail across 12 files | `Passed` |
| Group: static and unit gate | Boundaries, knip zero | Binding constraints | `bun run check` | Exit 0. Biome checked 347 files with no fixes. tsc clean. knip clean. 1191 pass, 0 fail | `Passed` |
| Group: existing UI | None | None | `bun test test/ui`; `git status --short` | 157 pass, 63 snapshots. Only the pre-existing ` M .gitignore` | `Passed` |
| Extra: e2e | No Git before first frame | `DES8` | `bun test test/e2e` | 13 pass, 0 fail | `Passed` |
| Flakiness: watcher and integration timing | `S22` | `DES7` | 15 sequential runs of `git-watcher.test.ts` + `test/integration/git.test.ts`; then 3 rounds of 4 parallel runs of both plus `git.test.ts` | 0/15 sequential failures; 12/12 parallel passes under load | `Passed` |
| CI determinism | None | None | Inspect `test/support/git-repo.ts:10` | Full replacement env: `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL` empty file, `HOME` = temp, fixed identity, `LANG`/`LC_ALL=C`. Inherited `GIT_*` variables are dropped. Temp paths go through `realpath` (macOS `/private/var`). Requires Git ≥ 2.31 for `--path-format`; `ubuntu-24.04` ships 2.43. Linux was not run locally | `Passed` (Linux `Insufficient`, see Unverified Items) |
| Process hygiene | None | None | `pgrep -fl "bun .*so\|git "`; `ls $TMPDIR/so-git-* $TMPDIR/so-gitwatch-*` | Only the pre-existing sandbox PID 49530. No leftover git temp dirs | `Passed` |
| No work-process ids, no stray code | None | `S1MPLE.md` Implementation | `git diff 0497871..c2f2247` added lines grepped for ids, `TODO`, `FIXME`, `console.`, `.only(` | No matches | `Passed` |

## Findings

### P2-G1-VER1 — Major — Specification / correctness — Untracked stage applies the patch over an index entry it never checked

- **System Design:** `REQ1@R2` (stale index: "if the file's index entry changed since its hunks were computed, stage re-reads and re-diffs instead of applying"), `DES4`, `S3`, `V37`
- **UI Design:** None
- **Evidence:** `src/workspace/git.ts:260-266` guards only the tracked path:

  ```ts
  stage: async (repo, e) => {
    if (e.expectedOid === null)
      await run(repo.top, ["add", "--intent-to-add", "--", e.repoPath]);
    else {
      const [entry] = await listed(repo, e.repoPath, false);
      if (!entry?.staged || entry.oid !== e.expectedOid) return "stale";
    }
  ```

  Real-Git probe (Git 2.51, isolated `gitRepo`): write `new.md` = `first\nsecond\n`, then run `git add new.md` externally. Calling `stage(repo, { repoPath: "new.md", expectedOid: null, patch })` with the untracked `@@ -0,0 +1,2 @@` patch returns `"ok"`. `git show :new.md` is then `"first\nsecond\nfirst\nsecond\n"`. `add --intent-to-add` is a no-op on an existing entry, and the zero-context patch inserts at line 0 of the full entry. DES4 and §5 limit the oid check to tracked files. That leaves the untracked path open to the exact silent misplacement (RF3) that REQ1@R2 was revised to prevent.
- **Impact:** The index gets wrong content (duplicated lines) and so reports success. Two triggers: the file is added by another terminal or tool before so's refresh re-reads it, or a second stage of a new file runs before the first stage's `gitReadIndex` result arrives. The damage is recoverable with `git reset`, but nothing tells the user, so a commit can include it.
- **Required resolution:** For `expectedOid: null`, `stage` first confirms the path has no index entry (`ls-files -s -- <path>` returns no staged record). If an entry exists, it returns `"stale"` and runs neither `add` nor `apply`. The tracked path stays as it is, and `V62`'s allowed subcommands stay the same.
- **Required proof:** A new case in `src/workspace/git.test.ts`, named by behaviour (e.g. "an untracked file added elsewhere stages nothing"): write a new file, `git add` it externally, call `stage` with `expectedOid: null` and the untracked patch, then assert `"stale"` and that `git show :<path>` equals the file text once. Then run `bun test src/workspace/git.test.ts` (including `V36` and `V62`) and `bun run check`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:** Discovery for subfolder, worktree, unborn, and detached heads; the version gate, missing Git, and non-repository cases (`V28`, `V29`). Prefix-scoped status and the `merging` op. Lock-free reads with a forced stale stat (`V38`). Every index entry kind, including CRLF normalization and conflict stage 2; committed and unsaved-line blame; `git.fail` fields (`V39`). One-of-two-hunk, untracked, and autocrlf staging (`V36`). The tracked stale oid (`V37`). The argv/stdin contract across every method (`V62`). Real first-level watching for repos and worktrees, lock noise, start failure, retarget, and stop (`V54`, `V55`). Runner ordering, one action per read, failure mapping, and watcher reuse (`V40`, `V41`). End-to-end refresh and save-then-stage (`V56`, `V57`).
- **Missing:**
  - Untracked stage over an existing index entry. It must return `"stale"` and leave the index unchanged (`P2-G1-VER1`).
  - `status` reporting `op: "rebasing"` from `rebase-merge`/`rebase-apply`. Only `merging` is asserted. Assert `op === "rebasing"` during an interrupted `git rebase` (non-blocking).
  - The watcher `error` event path (close, then retry on the next `retarget`) is not exercised. A test could emit `error` on a fake watcher and assert `git.watch.fail`, no further `onChange`, and a fresh watch on `retarget` (non-blocking).

## Scope Changes

No unplanned files: the 12 changed files match the group's declared main files plus the two integration suites that spread `gitOff()`, which deviation 8 explains. The nine recorded deviations are judged in Specification Verification, and all are accepted. One departure was not recorded: the untracked stage path has no index guard (`P2-G1-VER1`). It follows DES4's literal wording but breaks REQ1@R2 and `S3`.

## Unverified Items

- Linux: the watcher and real-Git suites ran only on macOS (Darwin 23.4, Git 2.51). No Linux environment was available. CI runs `src` tests on `ubuntu-24.04` (check job) and integration on `ubuntu-24.04` and `macos-15`, so inotify behaviour for `V54`–`V56` is proven only once a PR CI run completes.
- Git 2.31 itself (the minimum) was not run. Only the stubbed gate (`V29`) and Git 2.51 were exercised.

## Blockers

None
