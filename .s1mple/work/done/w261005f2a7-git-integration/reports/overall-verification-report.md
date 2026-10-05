# Overall Verification Report

## Scope

- **Goal:** `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-goal.md`
- **Plan Index:** `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-index.md`
- **Plan Parts:** `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-1-core.md`, `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-2-adapters-and-handoff.md`, `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-3-ui-and-delivery.md`
- **Report:** `.s1mple/work/done/w261005f2a7-git-integration/reports/overall-verification-report.md`

Verified at local HEAD `3caacd9` (branch `feat/w261005f2a7-git-integration`; the pushed PR head is `d5378b8`, and `3caacd9` adds only a goal-document commit). Change range `6e3eba5..3caacd9`.

## Status

`Failed`

Every group is accepted, every overall check passes, and the cross-part contracts hold. One Major defect remains that no group caught: the Git adapter decodes `git cat-file blob` output with `Response.text()`, which strips a leading UTF-8 BOM. A clean, committed note that starts with a BOM therefore shows a phantom changed line 0, the statusline counts `~1`, and `<leader>ghs` on it fails with `error: patch failed` (`OVR-VER1`). This breaks `S18` end to end, so the work cannot pass.

## Group Acceptance

| Group | Implementation report | Verification report | Closure and commit evidence | Result |
|---|---|---|---|---|
| `P1-G1` | `reports/p1-g1-implementation-report.md` (initial `1445ceb`, final `a649348`) | `reports/p1-g1-verification-report.md` (`f38b422`, `Failed`, `P1-G1-VER1`) | `P1-G1-VER1` fixed in `a4d613c` (zero-byte index entry gives an `add` hunk and a `-0,0` patch; real `git apply` proof recorded). Task commits `9d0c701`, `2e8e0d0`, `568ec51`, `d40c9ea`, `7f4a5da`, `1cce9a3`, `0c4d9f9` are all ancestors of HEAD | `Accepted` |
| `P1-G2` | `reports/p1-g2-implementation-report.md` (initial `7638c2a`, final `2bccc03`) | `reports/p1-g2-verification-report.md` (`1f8de61`, `Failed`, `P1-G2-VER1`) | `P1-G2-VER1` fixed in `0c6946b` (`GitState.dirChanged` re-reads every tracked open file once per burst). Task commits `78cbd38`, `9950bdc`, `a75e377`, `19729b3`, `d34e0ed`, `cfed4d6`, `f24ece6` in history | `Accepted` |
| `P2-G1` | `reports/p2-g1-implementation-report.md` (initial `c3467b4`, final `52e0e87`) | `reports/p2-g1-verification-report.md` (`8400e88`, `Failed`, `P2-G1-VER1`) | `P2-G1-VER1` fixed in `4a69978` (untracked stage returns `stale` when an entry exists); coverage gaps closed in `48c4adb`, `1f47793`. Task commits `8b58699`, `6e83114`, `46c6d85`, `c7968a0`, `300d620`, `c2f2247` in history | `Accepted` |
| `P2-G2` | `reports/p2-g2-implementation-report.md` (initial `8e90b6a`, final `95c5f6c`) | `reports/p2-g2-verification-report.md` (`1695ded`, `Failed`, `P2-G2-VER1`) | `P2-G2-VER1` fixed in `1858b88` (nested `try/finally` restore; inspected at `src/app/tool-host.ts:73-90`). Task commits `20d68f2`, `5f94619`, `a56003b`, `03f421d` in history | `Accepted` |
| `P3-G1` | `reports/p3-g1-implementation-report.md` (initial `8dc0816`/`0020d5d`, final `e685c15`) | `reports/p3-g1-verification-report.md` (`9c65aa0`, `Failed`, `P3-G1-VER1`) | `P3-G1-VER1` fixed in `f024d72` (`.s1mple/docs/project.md:220` now indented inside the Benchmarks table). Task commits `6f16712`, `10f7a65`, `0e189b4`, `af03592`, `2fd53a7`, `cc9e58e`, `e1d4b23` in history. `P3-G1-T8` is owned by Delivery stages A (done: PR #10, CI run `37338716926` green on `d5378b8`) and B (pending, not due now) | `Accepted` (T1–T7; T8 stage B not yet due) |

Every SHA cited in the goal's Progress section was checked with `git merge-base --is-ancestor <sha> HEAD`; none is missing. The working tree holds only the pre-existing unstaged `.gitignore` change.

## Plan Coverage

| Source item | Planned owner | Implementation evidence | Verification evidence | Result |
|---|---|---|---|---|
| `REQ1@R2` (stage/reset writes, oid guard, intent-to-add, EOL/EOF) | P1-G1, P1-G2, P2-G1 | `src/core/features/git/patch.ts:hunkPatch`; `src/core/state/git.ts:stageHunk`, `resetHunk`; `src/workspace/git.ts:stage` | `V10`–`V13`, `V22`, `V23`, `V36`, `V37`, `V40`, `V57` pass in this run's `check` and `test:ci` | `Mismatch` for a BOM-carrying note (`OVR-VER1`); `Satisfied` otherwise |
| `REQ2@R2` (tool hand-off) | P1-G2, P2-G2, P3-G1 | `src/app/tool-host.ts`, `src/app/lifecycle.ts:holdInterrupts`, `src/ui/shell.ts` flush/suspend/resume/`FOREIGN_MODES_RESET` | `V30`, `V33`, `V42`, `V50`, `V58`–`V60`, `V67` pass; manual `V61` (Ghostty) recorded | `Satisfied` |
| `REQ3@R1` (configurable tool, missing tool, no repo) | P1-G2, P2-G2 | `src/core/config/schema.ts` `git.tool`; `git.ts:openTool`; `tool-host.ts` `which` gate | `V34`, `V43`, `V59` pass | `Satisfied` |
| `REQ4@R3` (surfaces) | P1-G1, P1-G2, P3-G1 | Change column, statusline segment, explorer markers, `HunkView`, blame, which-key | `V5`, `V6`, `V14`–`V17`, `V24`, `V44`–`V47`, `V64`–`V66`, `V69` pass | `Satisfied` |
| `REQ5@R2` (live diff vs normalized index) | P1-G1, P1-G2, P3-G1 | `diff.ts:diffLines`, `index-text.ts:normalizeIndexText`, `git.ts:hunksFor`, `gitDiff` timer | `V1`–`V4`, `V7`, `V8`, `V18`, `V25`, `V51` pass; real-Git BOM probe fails | `Mismatch` (`OVR-VER1`) |
| `REQ6@R2` (coalesced lock-free refresh, git-dir watch) | P1-G2, P2-G1 | `git.ts:requestRefresh`, `onGitDirChanged`; `git-watcher.ts:watchGitDirs`; `BASE` `--no-optional-locks` | `V19`, `V26`, `V27`, `V38`, `V54`–`V56` pass | `Satisfied` |
| `REQ7@R2` (subfolder, worktree, unborn, version gate, after first frame) | P1-G2, P2-G1 | `src/workspace/git.ts:detect`, `MIN_GIT`; `src/app/main.ts:385-416` detection inside `setImmediate` | `V28`, `V29`, `V39`, `V53` pass; inspection of `main.ts` | `Satisfied` |
| `REQ8@R1` (save before tool) | P1-G2 | `git.ts:openTool`, `advanceGitPending` | `V21`, `V31`, `V32`, `V68` pass | `Satisfied` |
| `REQ9@R1` (stage saves first) | P1-G2, P2-G1 | `git.ts:stageHunk` pending gate; `effects.ts` `gitStage` on `serial` | `V20`, `V40`, `V57` pass | `Satisfied` |
| `DES1`, `DES2`, `DES4`–`DES13` | P1–P3 | As cited in the five group verification reports' Specification Verification tables; re-inspected `src/workspace/git.ts`, `src/app/effects.ts:510-586`, `src/app/tool-host.ts`, `src/app/main.ts` | Every assigned `V` case passes in this run | `Satisfied` |
| `DES3` (index text normalization) | P1-G1, P2-G1 | `normalizeIndexText` is correct for its input, but `src/workspace/git.ts:readIndex` feeds it text already stripped of the BOM by `bunGitSpawn` (`new Response(p.stdout).text()`) | `V7`, `V8`, `V25` pass on pure inputs; the §6 invariant (`normalizeIndexText(bytes)` reproduces `bytes`, system design line 922) fails on real Git for a BOM blob | `Mismatch` (`OVR-VER1`) |
| `S1` | P1-G1, P1-G2, P2-G1 | `hunkPatch`, `stageNow`, adapter `stage` | `V10`, `V36`, `V40`, `V52` pass | `Satisfied` (BOM note stage failure attributed to `S18`/`OVR-VER1`) |
| `S2` | P1-G2, P2-G1 | `expectedOid: null` path with intent-to-add and index guard | `V11`, `V36` pass | `Satisfied` |
| `S3` | P1-G2, P2-G1 | `ls-files -s` guard for both paths (`git.ts:260-266`) | `V12`, `V37` and the untracked-stale case pass | `Satisfied` |
| `S4` | P1-G2 | `conflicted()` refusal | `V13` passes | `Satisfied` |
| `S5` | P1-G1, P2-G1 | CRLF `eol` in `hunkPatch`; `ls-files --eol` | `V22`, `V36` (autocrlf) pass | `Satisfied` |
| `S6` | P1-G2 | `resetEdit` one undo step, EOF flag | `V23` passes | `Satisfied` |
| `S7` | P1-G1, P3-G1 | `diffLines`, `GIT_SIGNS`, `nextHunkLine`/`prevHunkLine`, `HunkView` | `V1`–`V3`, `V5`, `V6`, `V44`, `V47` pass | `Satisfied` |
| `S8` | P1-G1 | `layoutText` replace branch `lastChangeSignIn` | `V9`, `UV4` pass | `Satisfied` |
| `S9` | P1-G1, P3-G1 | `explorerMarkers`, `GIT_MARKERS` | `V14`, `V16`, `V17`, `V46` pass | `Satisfied` |
| `S10` | P1-G2, P3-G1 | `gitSegment`, statusline drop order | `V15`, `V45` pass | `Satisfied` |
| `S11` | P1-G1, P1-G2, P2-G1 | `parseBlame`, `blameLine`, adapter `blame` `-L line+1,+1` | `V24`, `V39` pass | `Satisfied` |
| `S12` | P2-G2, P3-G1 | Shell paint guard; OpenTUI `suspend()` | `V30`, `V35`, `V41`, `V58` pass; `V50` PTY | `Satisfied` |
| `S13` | P2-G2 | `holdInterrupts` | `V42`, `V50` pass | `Satisfied` |
| `S14` | P2-G2 | Nested restore in `tool-host.ts` | `V30`, `V33`, `V50` pass; `V61` manual | `Satisfied` |
| `S15` | P2-G2 | `suspended` guard, `useMouse` sync | `V50`, `V60` pass | `Satisfied` |
| `S16` | P1-G2, P2-G2 | `toolMissing`, `NOT_A_REPO` | `V34`, `V59` pass | `Satisfied` |
| `S17` | P1-G2 | `ConfigSchema.git.tool` | `V43` passes | `Satisfied` |
| `S18` | P1-G1, P1-G2, P2-G1 | `normalizeIndexText` + `hunksFor` BOM mark; adapter `readIndex` | `V7`, `V8`, `V25` pass on pure inputs; real-Git probe of a clean committed BOM note gives `index bom false`, `buffer bom true`, a `change` hunk on line 0 | `Mismatch` (`OVR-VER1`) |
| `S19` | P1-G1, P1-G2, P3-G1 | Bounded Myers, `gitDiff` 100 ms timer | `V4`, `V18`, `V51` (7.50 ms), `V53` pass | `Satisfied` |
| `S20` | P1-G2, P2-G1 | `requestRefresh`, `gitRefresh` 200 ms | `V19`, `V26`, `V27`, `V35`, `V41` pass | `Satisfied` |
| `S21` | P2-G1 | `--no-optional-locks` in `BASE` | `V38` passes | `Satisfied` |
| `S22` | P2-G1 | `watchGitDirs`, ignored lock names | `V26`, `V54`, `V56` pass (macOS here; Linux in CI run `37338716926`) | `Satisfied` |
| `S23` | P2-G1 | `git.watch.fail` log, per-dir close | `V55` passes | `Satisfied` |
| `S24` | P1-G1, P2-G1 | Prefix filter in `parseStatus`; `--show-prefix` | `V14`, `V28` pass | `Satisfied` |
| `S25` | P2-G1 | Git dir and common dir watched | `V28`, `V54` pass | `Satisfied` |
| `S26` | P1-G2, P2-G1 | Silent without Git, one version notice, unborn | `V28`, `V29`, `V39`, `V53` pass | `Satisfied` |
| `S27` | P1-G2 | Tool gate saves dirty buffers | `V21`, `V31`, `V58` pass | `Satisfied` |
| `S28` | P1-G2 | `toolNotStarted` notice | `V32` passes | `Satisfied` |
| `S29` | P1-G2, P2-G1 | Save-then-stage | `V20`, `V40`, `V57` pass | `Satisfied` |
| `S30` | P2-G1 | `BASE` + allowed subcommands; contents on stdin | `V62` passes; re-inspected `src/workspace/git.ts` | `Satisfied` |
| `S31` | P2-G2 | `resume()` repaint + image re-issue | `V60` passes; `V61` Ghostty observation (real graphics path unverified) | `Satisfied` (see Unverified Items) |
| `S32` | P1-G1, P3-G1 | `changeSign` channel, `gutterWidth(lineCount, change)` | `V63`, `V64` pass | `Satisfied` |
| `S33` | P3-G1 | One `change` flag for paint, hit-test, cursor | `V65` passes | `Satisfied` |
| `S34` | P1-G2, P3-G1 | Catalogue in `src/core/state/git.ts`; `MESSAGE_TOKEN` | `V66`, `UV13` pass | `Satisfied` |
| `S35` | P1-G2, P2-G2 | `openingTool` message, flush before suspend | `V30`, `V67`, `V68` pass | `Satisfied` |
| `S36` | P1-G2, P3-G1 | `gitCommands`/`gitBindings`/`gitGroups` merged in `src/app/main.ts:152-172` | `V69` passes; production registration exercised by `V50` | `Satisfied` |
| `V1`–`V47`, `V50`–`V69` (no `V48`/`V49`) | Per goal Verification Cases | Test files named in the goal | All automated cases pass in this run: `bun run check` 1204 pass, `bun run test:ci` 255 pass, bench exit 0; `V61` manual (Ghostty) recorded by P3-G1 | `Satisfied` — except that `V39`'s real-Git index read has no BOM case, which is why `OVR-VER1` went unseen |
| `UREQ1@R1`–`UREQ12@R1` → `UDES1@R1`–`UDES12@R1` | P1, P2, P3 | Glyphs, wording, and tokens from the UI design (`src/core/features/git/signs.ts:GIT_SIGNS`, `src/ui/theme.ts:TOKENS`, `src/ui/views/explorer.ts:GIT_MARKERS`, `src/ui/overlays/hunk.ts:KIND_LABEL`) | P1-G1, P1-G2, P3-G1 verification reports | `Satisfied` (UREQ1/UREQ2 data side inherits `OVR-VER1` for BOM notes) |
| `US1@R1` | P3-G1 | Change column at x = 0 | `UV1`, `UV2` pass | `Satisfied` |
| `US2@R1` | P1-G1, P3-G1 | Six glyphs, three views, three themes | `UV3`, `UV4` pass; `UV16` widths measured | `Satisfied` |
| `US3@R1` | P1-G2, P3-G1 | Navigation and stage/reset messages; cross-surface frame | `UV5`, `UV6` pass | `Satisfied` |
| `US4@R1` | P3-G1 | Statusline segment | `UV7` passes; `UV16` | `Satisfied` |
| `US5@R1` | P3-G1 | Explorer markers | `UV8` passes | `Satisfied` |
| `US6@R1` | P3-G1 | Hunk float | `UV9`, `UV10` pass | `Satisfied` |
| `US7@R1` | P1-G2, P3-G1 | Which-key rows | `UV11` passes | `Satisfied` |
| `US8@R1` | P1-G2 | Blame text and buckets | `UV12` passes | `Satisfied` |
| `US9@R1` | P1-G2, P3-G1 | Notice text and levels, `messageWarn` | `UV13` passes | `Satisfied` |
| `US10@R1` | P2-G2, P3-G1 | Pre-suspend message, restore | `UV14` passes; `UV15` Ghostty observation | `Satisfied` |
| `US11@R1` | P3-G1 | v1 frames outside a repository | `UV17` passes; `git diff --name-status 6e3eba5..HEAD -- '*.snap'` shows only two added files | `Satisfied` |
| `US12@R1` | P3-G1 | 17 Git tokens | `UV18` passes | `Satisfied` |
| `UV1@R1`–`UV14@R1`, `UV17@R1`, `UV18@R1` | P1-G2, P2-G2, P3-G1 | `test/ui/git.test.ts`, `src/core/state/git.test.ts`, `src/core/state/git-commands.test.ts`, `src/ui/theme.test.ts` | Pass in this run (`check` and `test:ci`) | `Satisfied` |
| `UV15@R1`, `UV16@R1` (manual) | P3-G1 | Written observations in `reports/p3-g1-implementation-report.md` §Manual checks | Ghostty hand-off observed; kitty hand-off `Skipped`; glyph widths 1 cell by DSR in Ghostty, kitty, iTerm2, Terminal.app (width only) | `Satisfied` for checked terminals; skipped items listed under Unverified Items |

## Roadmap Contract Evidence

Not applicable — standalone work

## Cross-Part Integration

| Boundary or handoff | Producing part | Consuming part | Evidence | Result |
|---|---|---|---|---|
| Git members of `Action`/`Effect`/`TimerId`/`Overlay`, `GitState`, `RepoInfo`, `IndexEntry`, `ToolResult` in `src/core/state/types.ts` | 1 | 2, 3 | Runner, adapter, tool host, and UI import these types; `tsc` clean in `bun run check` | `Passed` |
| `repo: RepoInfo` on `gitStatus`/`gitReadIndex`/`gitStage`/`gitBlame` effects | 1 | 2 | `src/app/effects.ts:510-569` passes `e.repo` to every `Git` method and holds no Git state | `Passed` |
| Temporary no-op Git effect cases removed | 1 | 2 | `src/app/effects.ts` cases at lines 510, 521, 533, 551, 571, 577 all dispatch; no "no-op"/"not wired" text remains (`grep`) | `Passed` |
| `parseStatus`, `parseBlame`, `normalizeIndexText`, `hunkPatch` used by the adapter | 1 | 2 | Adapter parses raw output with core functions; patch text built only in core and sent on stdin. The text handed to `normalizeIndexText` has already lost its BOM (`OVR-VER1`) | `Failed` (BOM only) |
| `MessageLevel` `warn` → `messageWarn` | 1 | 3 | `src/ui/views/cmdline.ts:MESSAGE_TOKEN`; `UV13` | `Passed` |
| `hunkSigns`, `GIT_SIGNS`, `RenderLine.changeSign`, `explorerMarkers`, `StatusSegments.git` | 1 | 3 | UI paints derived state only; `UV1`–`UV8` | `Passed` |
| `gitCommands`, `gitBindings`, `gitGroups` in production `registries()` | 1 | 3 | `src/app/main.ts:152-172`; `V50` drives `<leader>gg` through the production entry | `Passed` |
| `ConfigSchema.git.tool` read by the tool gate and runner | 1 | 2, 3 | `runTool { argv: s.config.git.tool, cwd: repo.top }`; `V31`, `V50` | `Passed` |
| `createGit`, `watchGitDirs`, deferred `detect` in `main.ts` | 2 | 3 | `src/app/main.ts:316`, `:338`, `:413-416` (inside `setImmediate`, after the first frame); UI, e2e, and bench suites use this wiring | `Passed` |
| `ToolHost`, `holdInterrupts`, `Shell.flush/suspend/resume/resetForeignModes`; `HunkView` behind the paint guard | 2 | 3 | `src/app/main.ts:374-379` late-binds `deps.tool`; `V50`, `UV14` pass | `Passed` |
| Test helpers `test/support/ui.ts`, `test/support/git-repo.ts`, `startApp` deps | 2 | 3 | Reused unchanged by `test/ui/git.test.ts`, `test/e2e/git-tool.test.ts`, `test/bench/git-diff.bench.ts` | `Passed` |

Final-scope checks:

- **Non-goals not implemented:** the adapter's subcommands are only `--version`, `rev-parse`, `symbolic-ref`, `status`, `ls-files`, `cat-file`, `add --intent-to-add`, `apply --cached`, and `blame` (`src/workspace/git.ts`; `V62` asserts the set). No commit, push, pull, unstage, branch, inline blame, `D` marker, or polling path exists.
- **No new dependency:** `git diff --stat 6e3eba5..HEAD -- package.json bun.lock bunfig.toml knip.json biome.json tsconfig.json .github` is empty.
- **Layer rules:** `bun test test/boundaries.test.ts` → 2 pass; `grep -rln "@opentui" src | grep -v ^src/ui/` → none.
- **`update` pure:** `grep -rnE "Date\.now|performance\.now|Math\.random|setTimeout|process\.|new Date\(\)" src/core` (non-test) → no code match; time reaches core through `key`/`mouse`/`timer`/`gitBlamed.now` actions.
- **No Git before the first frame:** `git.detect(ws.root)` runs only inside the `setImmediate` block (`src/app/main.ts:385-416`); `createGit` construction spawns nothing.
- **argv-only spawn, contents on stdin:** `bunGitSpawn` and `bunToolSpawn` call `Bun.spawn(argv, …)` with no shell; no `"sh"`, `/bin/sh`, or `shell: true` in non-test `src`; patch and blame contents go on stdin (`V62`).

## Overall Checks

| Check | Command or method | Expected result | Actual result | Result |
|---|---|---|---|---|
| Static and unit gate | `bun run check` | biome, tsc, knip zero, all unit suites pass | Exit 0 in 9.6 s. Biome checked 355 files, no fixes; tsc clean; knip printed no findings; 1204 pass, 0 fail, 19 snapshots across 112 files | `Passed` |
| CI suites | `bun run test:ci`; `git diff --name-status 6e3eba5..HEAD -- '*.snap'` | component, integration, UI, e2e pass; existing v1 snapshots byte-identical | Exit 0 in 41.2 s: 255 pass, 0 fail, 65 snapshots across 31 files. Snapshot diff lists only `A src/ui/__snapshots__/theme.test.ts.snap` and `A test/ui/__snapshots__/git.test.ts.snap` | `Passed` |
| Bench gate | Orphan check (`ps`: only pre-existing 43089/43090 and 49528–49530), then `bun run bench` | `gitDiffKeystrokeP95` ≤ 24 ms target (gate 2×); existing targets hold | Exit 0. `gitDiffKeystrokeP95` median 7.50 ms (limit 48). Others: sourceKeystroke 4.79, liveKeystroke 12.09, openFile 38.33, sourceOpenFile 14.82, liveScroll 5.73, sourceScroll 4.66, firstFrame 150.30, indexReady 1008.17, indexingKeystroke 10.56 — all within their limits. Two ~1 s verifier probes overlapped part of the run, which can only have raised the numbers. CI run `37338716926` (Linux): `gitDiffKeystrokeP95` 19.39 ms, all `ok` | `Passed` |
| Build | `bun run build`; `./dist/so --version` | `dist/so` produced | Exit 0 (659 modules); `dist/so` 86,879,346 bytes; `--version` prints `so 0.0.0` | `Passed` |
| Manual terminal checks | Assessment of `reports/p3-g1-implementation-report.md` §Manual checks and `reports/p3-g1-verification-report.md` | `V61`, `UV15`, `UV16` observations written; unavailable terminals reported as skipped | Written: Ghostty hand-off via the tui-test monitor sized to the window (no so text during lazygit; same note, cursor 3:18, image blocks, staged sign gone, mouse works). kitty hand-off reported `Skipped` with its reason. `UV16`: nine glyphs measured 1 cell by DSR in Ghostty, kitty, iTerm2, and Terminal.app (width only). No recording | `Passed` |
| Boundary and process hygiene | `bun test test/boundaries.test.ts`; `grep -rnE "W261005F2A7\|\b(REQ\|DES\|UDES\|UV)[0-9]" src test scripts`; extra `grep -rnE "\b(UREQ\|US)[0-9]\|\bP[0-9]-G[0-9]" src test scripts` | No violations; no work-process ids in code | Boundaries 2 pass, 0 fail. Both greps exit 1 (no matches) | `Passed` |
| CI on PR | `gh pr checks 10`; `gh run view 37338716926`; `gh pr view 10` | Green on the pre-move head | `check` pass, `test (macos-15)` pass, `test (ubuntu-24.04)` pass (incl. bench), run conclusion `success` on `d5378b8`, which equals `origin/feat/w261005f2a7-git-integration`. PR `OPEN`, `MERGEABLE`, not draft. A third-party `CodeRabbit` status was `pending` ("Review in progress"), so `mergeStateStatus` read `UNSTABLE` at this check, not `CLEAN`; it is not part of `ci.yml`. The post-move head is checked in Delivery stage B | `Passed` |
| No temporary runner stubs | Inspect `src/app/effects.ts` | No temporary no-op Git effect case remains | Six Git cases (510–586), each dispatching a result action; no no-op group | `Passed` |
| Extra: BOM note through the real adapter | Scratch probes (removed): `createGit(...).readIndex` on a repo with a committed `﻿hello\nworld\n`; then `startApp` + open + `<leader>ghs` | Clean note has no hunks | `git cat-file blob :a.md` starts `357 273 277` (BOM present), `git status --porcelain` empty, but `readIndex` returns `bom: false`; buffer `bom: true`; hunks `[{kind:"change", old {0,1}, new {0,1}}]`; statusline `changed: 1`; stage → `gitStaged {failed: "error: patch failed: a.md:1"}` | `Failed` (`OVR-VER1`) |

## Findings

### OVR-VER1 — Major — Correctness — A committed note with a UTF-8 BOM shows a phantom change and cannot be staged

- **Owner:** `P2-G1`
- **Source items:** `REQ5@R2`, `REQ1@R2`; `DES3`, `DES4`; `S18` (also `S1`, `S6` for such notes); `V39` (missing case), `V25`
- **Evidence:** `src/workspace/git.ts` decodes every Git stdout with the WHATWG decoder, which strips a leading BOM:

  ```ts
  // src/workspace/git.ts, bunGitSpawn
  const [stdout, stderr, code] = await Promise.all([
    new Response(p.stdout).text(),
  ```

  `readIndex` then passes that text to `normalizeIndexText(text, …)`, so `bom` is always `false`. The file adapter knows about this and opts out (`src/workspace/fs.ts:76`: `new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })`). `bun -e` confirms `await new Response(new Uint8Array([0xEF,0xBB,0xBF,0x61])).text()` has length 1. Real-Git probe (Git 2.51, `test/support/git-repo.ts` isolation) with a committed, unmodified `a.md` = `﻿hello\nworld\n`:

  ```text
  git status --porcelain        → ""                (clean)
  readIndex(...).text.bom       → false             (blob starts EF BB BF)
  buffer.bom                    → true
  git.files["a.md"].hunks       → [{kind:"change", old:{start:0,count:1}, new:{start:0,count:1}, oldLines:["hello"]}]
  statusSegments(...).git       → {ref:"main", added:0, changed:1, removed:0}
  <leader>ghs → gitStaged       → {failed: "error: patch failed: a.md:1"}
  ```

- **Impact:** Every clean committed note that starts with a BOM (common for files saved by Windows editors) shows `~` on line 0 and `~1` in the statusline, while the explorer (from `git status`) shows no marker. Stage hunk on any hunk at line 0 fails with a Git error. Reset hunk on line 0 sets the buffer's `bom` to the index's `false` (`src/core/state/git.ts:476`), so autosave strips the BOM from a clean file. The system design §6 invariant "`normalizeIndexText(bytes)` … reproduces `bytes`" fails for every BOM blob, and `S18` ("identical content compare equal across BOM") fails end to end. `V7`, `V8`, and `V25` pass only because they feed pure strings, and `V39`'s real-Git index read has no BOM case.
- **Required resolution:** The adapter must keep a leading BOM in the blob text it hands to `normalizeIndexText` (for example, decode `cat-file blob` output, or all spawn output, with `new TextDecoder("utf-8", { ignoreBOM: true })`). A clean committed BOM note then has no hunks and no statusline count; editing one of its lines stages exactly that line with the BOM kept in the index; reset keeps the BOM. No other contract changes, and the allowed subcommand set stays the same.
- **Required proof:** A new real-Git case in `src/workspace/git.test.ts`, named by behaviour (e.g. "an index entry that starts with a BOM keeps it"), asserting `readIndex` returns `bom: true` with BOM-free `lines`. A new case in `test/integration/git.test.ts` (e.g. "a clean note with a BOM has no hunks and stages an edit") asserting zero hunks after open, and after editing line 1 and `<leader>ghs` that `git show :a.md` starts with the BOM and contains the edit. Then `bun run check` and `bun run test:ci` pass, and PR CI is green on the remediation head.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change and commit evidence are recorded.
- [ ] The orchestrator validates closure evidence.

## Unverified Items

- **`V61`/`UV15@R1` in kitty:** Reported `Skipped` by P3-G1 (no Screen Recording permission; tui-test mirrors only into its monitor). Not counted as passed.
- **`V61` real graphics protocol:** In the Ghostty check so ran inside the tui-test emulator mirrored into Ghostty, so images drew as cell blocks; the kitty-graphics re-issue after `resume()` was not seen on a real terminal. Automated coverage: `V60`, `UV14@R1`.
- **`UV16@R1` visual alignment:** Glyph widths were measured (1 cell by DSR in four terminals); alignment was inferred, not seen.
- **Git 2.31 itself:** Only Git 2.51 (local) and Ubuntu 24.04's Git (CI) ran; the 2.31 threshold is covered by the stubbed gate (`V29`).
- **Real `EAGAIN`/`EIO` on the foreign-mode write:** Simulated with a throwing double only (`P2-G2-VER1` remediation).
- **Manual checks were not repeated** by this verifier; they were judged from the written observations, as assigned.
- **Delivery stage B** (folder move, CI on the post-move head, `.s1mple/docs/project.md` `work/active/` path at line 9) is not due in this verification.

## Blockers

None

## Completion Assessment

- **All groups accepted:** `Yes`
- **Plan coverage complete:** `No` — `S18` (with `REQ5@R2`, `DES3`) is a `Mismatch` (`OVR-VER1`)
- **Cross-part integration passed:** `No` — the adapter → `normalizeIndexText` handoff loses the BOM (`OVR-VER1`)
- **Assigned parent coverage and cross-work checks passed:** `Not applicable`
- **All overall checks passed:** `Yes` — every assigned overall check passed; the extra BOM probe failed
- **No unresolved finding or blocker remains:** `No` — `OVR-VER1` is open
