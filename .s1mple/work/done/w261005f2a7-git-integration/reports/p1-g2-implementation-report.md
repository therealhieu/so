# P1-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-goal.md`
- **Plan Part:** `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-1-core.md`
- **Group:** `P1-G2` — git state, reducers, and commands
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`, `P1-G2-T6`
- **Report:** `.s1mple/work/done/w261005f2a7-git-integration/reports/p1-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G2-T1` | `src/core/config/schema.ts:ConfigSchema.git` (`tool`, default `["lazygit"]`); `src/core/state/result.ts:MessageLevel`, `message`; `src/core/state/types.ts:RepoInfo`, `IndexEntry`, `GitPending`, `StageReport`, `GitState`, `ToolResult`, `AppState.git`, `notifications.message.level`, the 7 `Action`, 6 `Effect`, 2 `TimerId`, and 1 `Overlay` members; `src/core/state/git.ts:initialGit`; `src/core/state/init.ts:initialState`; `src/core/state/update.ts` (temporary `none` cases); `src/app/effects.ts` (one no-op group for the six git effect kinds); `src/core/config/schema.test.ts` (1 case); `src/core/config/toml.test.ts` (expected config gains the `git` default) | RED: `bun test src/core/config/schema.test.ts` → 10 pass, 1 fail. GREEN: 11 pass. `bun run check` → biome clean, tsc clean, knip zero, 1132 pass | `78cbd38` | `Completed` |
| `P1-G2-T2` | `src/core/state/git.ts:requestRefresh`, `onGitDetected`, `onGitRefreshTimer`, `onGitStatus`, `onGitIndexRead`, `onGitDiffTimer`, `syncGitFiles`, `onToolExited` (refresh only, completed in T4), private `watchDirs`, `readIndex`, `indexChanged`, `hunksFor`; `src/core/state/update.ts:withGitDiffTimers`, `onTimerAction` (`gitRefresh`, `gitDiff:*`), routing; `src/core/state/save.ts:onSaved` (chains `requestRefresh`); `src/core/state/disk.ts:onFileChanged` (chains `requestRefresh`); `src/core/state/git.test.ts` (13 cases) | RED: `bun test src/core/state/git.test.ts` → 3 pass, 10 fail. GREEN: 13 pass. `bun test src/core/state` → existing suites pass (`save.test.ts` 11, `disk.test.ts` 9, `update.test.ts`). `bun run check` → 1145 pass | `9950bdc`; follow-up `a75e377` (removes needless casts in the update wrapper; no behaviour change; `bun run check` → 1174 pass) | `Completed` |
| `P1-G2-T3` | `src/core/state/git.ts`: catalogue block (`NOT_A_REPO`, `BUSY`, `NO_HUNK`, `STALE_INDEX`, `hasConflicts`, `cannotSave`, `notStaged`, `stagedHunk`, `resetDone`, `firstLine`), `stageHunk`, `stageNow`, `onGitStaged`, `resetHunk`, `resetEdit`, `advanceGitPending`, `cancelGitPending`, `currentHunks`, `hunkIndexAt`, `dropClosed`; `src/core/state/save.ts:blocked` (exported), `onSaved` (chains `advanceGitPending`), `onSaveFailed` (chains `cancelGitPending`); `src/core/state/git-commands.ts:gitCommands`, `gitBindings` (stage, reset); `test/support/state.ts:testRegistries`; `src/core/state/whichkey.test.ts` (leader rows gain the `g` group row); `src/core/state/git.test.ts` (+13 cases) | RED: the new cases run against the T2 sources with empty command lists → 12 fail, 1 vacuous pass (close-cancels, no pending op exists). GREEN: `bun test src/core/state/git.test.ts` → 26 pass. `bun test src/core/state/save.test.ts` → 11 pass, unchanged. `bun test test/ui` → 157 pass, 63 snapshots unchanged. `bun run check` → 1158 pass | `19729b3` | `Completed` |
| `P1-G2-T4` | `src/core/state/git.ts:openTool`, `runTool`, `onToolExited` (missing notice; clear, refresh, `read` and `gitReadIndex` per open buffer), tool branch of `advanceGitPending` and `cancelGitPending`, catalogue `toolNotStarted`, `openingTool`, `toolMissing`; `src/core/state/git-commands.ts` (`git.tool` "Lazygit (full screen)", `<leader>gg`); `src/core/state/git.test.ts` (+7 cases) | RED: 26 pass, 7 fail. GREEN: `bun test src/core/state/git.test.ts` → 33 pass. `bun run check` → 1165 pass | `d34e0ed` | `Completed` |
| `P1-G2-T5` | `src/core/state/git.ts:gotoHunk`, `previewHunk`, `blameLine`, `onGitBlamed`, `gitSegment`, private `ago`, `startOf`, catalogue `hunkOf`, `NO_NEXT`, `NO_PREVIOUS`, `NOT_COMMITTED`, `blameText`; `syncGitFiles` also closes a `gitHunk` float whose buffer closed; `src/core/state/status.ts:StatusSegments.git`, `statusSegments`; `src/core/state/keys.ts:routeKey` (`gitHunk` gate); `src/core/state/update.ts` (`gitBlamed` route); `src/core/state/git-commands.ts` (`git.previewHunk`, `git.nextHunk`, `git.prevHunk`, `git.blameLine`; `<leader>ghp`, `<leader>ghb`, `]h`, `[h`); `src/core/state/status.test.ts` (+2 cases); `src/core/state/git.test.ts` (+5 cases). `src/core/state/mouse.ts` unchanged: the generic gate already closes the float on an outside press (asserted) | RED: `bun test src/core/state/git.test.ts src/core/state/status.test.ts` → 43 pass, 6 fail. GREEN: 49 pass (after the float-close case was rewritten to a real `:bd` path, see Deviations 11). `bun test src/core/state/keys.test.ts` → 22 pass; `mouse.test.ts` → 41 pass; `status.test.ts` → 11 pass. Probe: `f]` and Insert-mode `]` still reach vim. `bun run check` → 1172 pass. `bun test test/ui` → 157 pass, 63 snapshots unchanged | `cfed4d6` | `Completed` |
| `P1-G2-T6` | `src/core/state/git-commands.ts:gitGroups`; `test/support/state.ts:testRegistries` (groups merge); `src/core/state/whichkey.test.ts` (leader row label `+git`); `src/core/state/git-commands.test.ts` (2 cases) | RED: `bun test src/core/state/git-commands.test.ts` → 1 pass, 1 fail (`g +…`). GREEN: 2 pass. `bun run check` → 1174 pass | `f24ece6` | `Completed` |

### Group Change Range

- **Starting commit:** `41dad6b`
- **Final commit:** `a75e377`
- **Remaining group changes:** None. `.gitignore` has an unstaged `.worktrees/` entry. It existed before this group, is not from this group, and was left unstaged and uncommitted.

### Group Verification

- `bun test src/core/state src/core/config` → `Passed` — 370 pass, 0 fail, 33 files. Covers V10–V13, V15, V18–V21, V23, V25–V27, V31, V32, V34, V35, V43, V66, V68, V69, UV5, UV10 (core gate), UV11, UV12, UV13 (reducer part).
- `bun run check` → `Passed` — biome clean (340 files), tsc clean, knip zero findings, 1174 pass, 0 fail.
- `bun test test/ui test/integration` → `Passed` — 216 pass, 0 fail, 63 snapshots. `git diff --stat 41dad6b..HEAD -- test/ui` is empty, so no snapshot changed. Git state is inert with `repo: null`.
- `grep -n 'case "gitStatus"' src/app/effects.ts` → `Passed` — one match (line 500), the single no-op group from T1.
- `grep -rnE "W261005F2A7|\b(REQ|DES|UDES|UV|UREQ|US)[0-9]|\bV[0-9]+\b|\bS[0-9]+\b|P[0-9]-G[0-9]" src test` → `Passed` — no matches.
- `bun test test/boundaries.test.ts` → `Passed` — 2 pass. `src/core/state/git.ts` and `git-commands.ts` import only core modules.
- Process hygiene → `Passed` — this group started only `bun test` and `bun run check` runs, which exited, and one scratch probe file, which was removed. The running `bun run sandbox` and `bun run tui` processes existed before this group and do not belong to it.

### Deviations and Remaining Issues

Contracts and decisions a fresh remediator must keep:

1. **`repo: RepoInfo` on four effects.** `gitStatus`, `gitReadIndex`, `gitStage`, and `gitBlame` carry `repo`, as the plan directs (T1 step 2). The runner holds no git state. `gitStatus` also keeps `prefix` from the §7 shape.
2. **`gitBlamed` carries `now`, and blame lines are 0-based.** The relative date needs a clock, and `update` is pure. Actions that come from the runner already carry time this way (`timer`, `key`, `mouse`), so the runner in Part 2 must set `now: Date.now()` on `gitBlamed`. `line` on the `gitBlame` effect and the `gitBlamed` action is the 0-based buffer line. The adapter must pass `-L <line+1>,+1`. Both rules are in the type doc comments in `src/core/state/types.ts`.
3. **Final-newline and BOM marks (`hunksFor`).** When the final-newline flags differ, the last line of the side that has the newline gets a NUL mark. When the BOM flags differ, line 0 of the side that has the BOM gets a mark. That side always has the line, which also covers a zero-byte index entry: an empty buffer saved as `"\n"` diffs as one `add` hunk, as the P1-G1 note asked. After the diff, each hunk's `oldLines` is re-sliced from the real index lines, so patches, reset, and preview never see a mark. V25 (BOM-only → one change on line 0) and the final-newline cases assert this.
4. **Reset also restores the BOM.** The design restores only `finalNewline` (EOF hunk). The same rule is applied to `bom` when the hunk reaches line 0. Otherwise resetting a BOM-only hunk would change nothing and leave the hunk in place.
5. **Reset refuses an untracked file with `no hunk at cursor`.** The index has nothing to reset to. Resetting the `untracked` hunk would empty the note, and autosave would then write the empty file to disk.
6. **File tracking is one wrapper hook.** `syncGitFiles` in `git.ts` runs in the `createUpdate` wrapper, in place of the separate `trackOpenBuffer`/`dropClosedBuffer` the design names. It keeps `files` equal to the listed buffers' paths, and it emits `gitReadIndex` for new ones. Session-restored buffers that open before detection are read once `gitDetected` arrives. Unlisted embed targets are not tracked. The same hook cancels a pending operation whose buffer closed (silently, because the catalogue has no text for it) and closes a `gitHunk` float whose buffer closed.
7. **`blocked` is exported unchanged.** git uses `unwritable = blocked || (dirty && readOnly)`, because `writeBuffer` silently skips a read-only buffer, so the pending operation would wait forever. `:q`/`:bd` behaviour is unchanged.
8. **`cannot save <path>` (stage on a blocked buffer) is at `error` level.** DES13 keeps this wording but names no level. The tool's counterpart is `error`.
9. **`onSaved` chains git on both branches.** The existing dirty-after-write branch returns before `advanceQuit`. `advanceGitPending` and `requestRefresh` are therefore chained after either branch, and `advanceGitPending` writes a buffer that changed during its write again. Quit stays first, as the design specifies, so a quit in a repository emits `[exit, startTimer gitRefresh]`.
10. **Untracked stage patch.** The patch uses an empty `IndexText` with the buffer's `eol`, and mode `100644`, against the intent-to-add entry. P2's real-Git V36 must confirm this against `git apply --cached`.
11. **Blame without git.** `blameLine` answers `not committed yet` without git for an unborn head, an untracked or ignored entry, and a status index code `A`. The `A` case covers a staged new file, which is not in HEAD and would make `git blame` fail. A `gitBlamed` failure shows its first stderr line at `error`; the catalogue has no failure row. The float-close test was rewritten to use a real path (`:bd` on a dirty buffer keeps it shown until `saved` removes it), because the first version bypassed the transition.
12. **`previewHunk` stores the fresh hunks.** It writes them to `files[path].hunks`, so the Part 3 `HunkView` can find `n/m` by `new.start` in the stored list.
13. **`toolExited`.** A `failed` result is handled like `exited`, with no notice, as §5 states. It emits a `read` for every open buffer, unlisted embeds included, and a `gitReadIndex` for every tracked (listed) file.
14. **Existing tests changed additively.** `src/core/config/toml.test.ts` enumerates the whole parsed config, so it gains `git: { tool: ["lazygit"] }`. `src/core/state/whichkey.test.ts` enumerates every leader row, so it gains `g +git`. No snapshot changed.
15. **Statusline data.** The counting lives in `git.ts:gitSegment`, typed as `StatusSegments["git"]`, and `status.ts` only wires it in. The segment is present only with an active buffer inside a repository, as §7 states. `untracked` hunks and an unborn head count 0.
16. **`]`/`[` are keymap prefixes now.** No vim command starts with a bare `]` or `[` in this engine; the bracket tables serve `%`. A probe confirmed that `f]` and Insert-mode `]` still behave as before. After a pause on `]`, which-key shows `h Git: next hunk`.
17. **Navigation.** `]h`/`[h` move to column 0 of the hunk's first line and record no jump.

Remaining issues: None.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `.s1mple/work/done/w261005f2a7-git-integration/reports/p1-g2-verification-report.md` (commit `1f8de61`, status `Failed`, one finding)
- **Status:** `Completed`

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P1-G2-VER1` | **Change:** `src/core/state/git.ts:onGitDirChanged` (158) sets `git.dirChanged` and restarts `gitRefresh`; nothing outside a repository. `onGitStatus` (186–194) re-reads every tracked file's index once when the mark is set, then clears it; otherwise the per-entry rule is unchanged. A failed status read returns before the mark is consumed, so the next read still re-reads. `gitDetected` resets the git state, which drops the mark. `src/core/state/types.ts:GitState.dirChanged` (385, doc comment 376); `src/core/state/update.ts:214` routes `gitDirChanged` to `onGitDirChanged`. **Proof:** `src/core/state/git.test.ts` "a git-dir change re-reads every open file's index once" (217): clean tracked `a.md` with no status entry, two `gitDirChanged`, the `gitRefresh` timer (exactly one `gitStatus`), then a `gitStatus` with head `feature` and no entry → exactly one `gitReadIndex` for `a.md` with the new head; a further status with no git-dir change → none. "a failed status read keeps a git-dir change for the next one" (241). RED before the fix: `bun test src/core/state/git.test.ts` → 38 pass, 2 fail. GREEN: 40 pass. `bun test src/core/state src/core/config` → 372 pass, 0 fail, 33 files; V26 ("a head change retargets the watch and an index change re-reads only that file") still passes. | `0c6946b` | `Fixed` |

**`P1-G2-VER1` Completion Checklist:**

- [x] Required resolution is implemented — every tracked open file's index entry is read again after a `gitDirChanged`, once per refresh burst, when its `gitStatus` result arrives (system design §5 Refresh step 1). No git runs per keystroke and no polling path was added.
- [x] Required proof passes — the new reducer case above, `bun test src/core/state src/core/config` (372 pass), and `bun run check` (1176 pass).
- [x] Change evidence is recorded — this table, commit `0c6946b`.
- [x] Verification evidence is recorded — Remediation Group Verification below.

**Remediation decision a later remediator must keep:** the mark is consumed on the status result rather than on the timer, because the reads are emitted only after the git-dir event already happened on disk, and the result carries the new head for `readIndex`. The app's own index writes (stage) also raise `gitDirChanged`, so a stage re-reads every open file once; that costs one `ls-files` per open file per burst and is bounded by the 200 ms coalescing.

### Remediation Group Verification

- `bun test src/core/state src/core/config` → `Passed` — 372 pass, 0 fail, 33 files.
- `bun run check` → `Passed` — biome clean (341 files), tsc clean, knip zero findings, 1176 pass, 0 fail.
- `bun test test/ui test/integration` → `Passed` — 216 pass, 0 fail, 63 snapshots; no snapshot file changed.
- `bun test test/boundaries.test.ts` → `Passed` — 2 pass.
- `grep -n 'case "gitStatus"' src/app/effects.ts` → `Passed` — one match (line 500).
- `grep -rnE "W261005F2A7|\b(REQ|DES|UDES|UV|UREQ|US)[0-9]|\bV[0-9]+\b|\bS[0-9]+\b|P[0-9]-G[0-9]" src test` → `Passed` — no matches.
- Self-review of `41dad6b..0c6946b` (`src`, `test`) → `Passed` — no `TODO`, `FIXME`, `console.`, `debugger`, or `.only(` added; the fix touches only `git.ts`, `git.test.ts`, `types.ts`, and `update.ts`.
- Process hygiene → `Passed` — only `bun test` and `bun run check` runs were started, and all exited; no temp directories were created.

### Unverified Items Owned Elsewhere

These were recorded by the verifier and stay with their owners:

- Real Git behaviour of the untracked intent-to-add patch (`V36`), the 0-based blame line mapped to `-L line+1,+1`, and `gitBlamed.now` set by the runner — Part 2.
- Production `registries()` merge of `gitCommands`, `gitBindings`, and `gitGroups` (`UV11` beyond `testRegistries()`) — `P3-G1`.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — every group task is implemented, committed, and verified, and `P1-G2-VER1` is fixed.
- **Final report commit:** Returned to the orchestrator after this report is committed.
- **Final commits:** `78cbd38`, `9950bdc`, `19729b3`, `d34e0ed`, `cfed4d6`, `f24ece6`; follow-up `a75e377` (`P1-G2-T2`); remediation `0c6946b` (`P1-G2-T2`, `P1-G2-VER1`).
- **Final checks:** `bun run check` → 1176 pass, knip zero; `bun test src/core/state src/core/config` → 372 pass; `bun test test/ui test/integration` → 216 pass, 63 snapshots unchanged; `bun test test/boundaries.test.ts` → 2 pass; effects no-op group grep → 1 match; process-id grep → no matches.
- **Remaining issues:** None. The unstaged `.gitignore` change (`.worktrees/`) does not belong to this group and was left untouched.
