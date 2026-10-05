# P1-G2 Verification Report

## Scope

- **Group:** `P1-G2` — git state, reducers, and commands
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`, `P1-G2-T6`
- **Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p1-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p1-g2-implementation-report.md` (report commit `7638c2a`; change range `41dad6b..a75e377`)

## Status

`Failed`

All six tasks are implemented, every assigned `V`/`UV` case passes, and every group check is green. One Major finding remains. An external checkout, pull, or merge leaves a clean open file diffed against its old index blob, because nothing re-reads the index for a file whose status entry is absent both before and after (`P1-G2-VER1`). The other 16 recorded deviations are acceptable.

## Assigned Traceability

- **System Design:**
  - `REQ3@R1 → DES11 → S17 → V43`
  - `REQ5@R2, REQ6@R2, REQ7@R2 → DES1, DES2, DES6, DES8 (core), DES13 → S18–S20 → V18, V19, V25–V27; V66 (version row)`
  - `REQ1@R2, REQ9@R1 → DES4, DES5, DES13 → S1–S4, S6, S29, S34 → V10–V13, V20, V21, V23; V66 (stage/reset rows)`
  - `REQ2@R2, REQ3@R1, REQ8@R1 → DES9, DES13 → S12, S16, S27, S28, S35 → V31, V32, V34, V35, V68; V66 (tool rows)`
  - `REQ4@R3 → DES10, DES11, DES13 → S10, S11, S34 → V15; V66 (nav/preview rows)`
  - `REQ4@R3 → DES11 → S36 → V69`
- **UI Design:**
  - `UREQ9@R1 → UDES9@R1 → US9@R1 → UV13@R1` (version notice; reducer part)
  - `UREQ3@R1 → UDES3@R1 → US3@R1 → UV5@R1` (stage/reset/navigation)
  - `UREQ10@R1 → UDES10@R1 → US10@R1` (pre-suspend message)
  - `UREQ3@R1, UREQ4@R1, UREQ6@R1, UREQ8@R1 → UDES3@R1, UDES4@R1, UDES6@R1, UDES8@R1 → US3@R1, US4@R1, US6@R1, US8@R1 → UV5@R1, UV10@R1 (core gate), UV12@R1`
  - `UREQ7@R1 → UDES7@R1 → US7@R1 → UV11@R1`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ3@R1 → DES11 → S17 → V43` | None | `git.tool` is a non-empty array of non-empty strings, default `["lazygit"]`, strict section | `src/core/config/schema.ts:98` (`git: z.strictObject({ tool: z.array(z.string().min(1)).min(1).default(["lazygit"]) }).prefault({})`) | `Satisfied` |
| `REQ5@R2, REQ6@R2, REQ7@R2 → DES1, DES2, DES8 (core), DES13 → S18, S19, S26 → V18, V25, V66 (version)` | `UREQ9@R1 → UDES9@R1 → US9@R1 → UV13@R1` | Discovery stores the repo, watches its dirs, starts a refresh, and shows the version notice at `warn`. Edits restart `gitDiff:<id>` (100 ms) and never run git. A BOM-only difference is one change on line 0 | `src/core/state/git.ts:onGitDetected` (130), `watchDirs` (81), `hunksFor` (591); `src/core/state/update.ts:withGitDiffTimers`, `onTimerAction`; `src/core/state/result.ts:MessageLevel` | `Satisfied` |
| `REQ6@R2 → DES6 → S20 → V19, V26, V27` | None | Every trigger restarts `gitRefresh` (200 ms); the timer emits one `gitStatus`; a head change emits `gitWatch`; changed open paths are re-read; late results are dropped; the index is re-read where `ls-files` may differ (system design §5 Refresh step 1) | `src/core/state/git.ts:requestRefresh` (117), `onGitRefreshTimer` (147), `onGitStatus` (159–181); `src/core/state/save.ts:171`; `src/core/state/disk.ts:40`; `src/core/state/update.ts:213` (`gitDirChanged` → `requestRefresh` only) | `Mismatch` — see `P1-G2-VER1` |
| `REQ1@R2, REQ9@R1 → DES4, DES5, DES13 → S1–S4, S6, S29, S34 → V10–V13, V20, V21, V23; V66` | `UREQ3@R1 → UDES3@R1 → US3@R1 → UV5@R1`; `UREQ9@R1 → UV13@R1` | Refusal order: no repo → busy → no hunk → conflict → blocked. Dirty buffer saved first through `pending`. Fresh hunks give `gitStage` with oid (null for untracked), patch, and report. `onGitStaged` sets catalogue text and always re-reads and refreshes. Reset is one undoable edit with no git and restores the EOF flag | `src/core/state/git.ts:stageHunk` (343), `stageNow` (362), `onGitStaged` (409), `resetHunk` (435), `resetEdit` (471), `advanceGitPending` (513), `cancelGitPending` (531), `dropClosed` (285); `src/core/state/save.ts:33` (`blocked` exported), `:171`, `:211` | `Satisfied` |
| `REQ2@R2, REQ3@R1, REQ8@R1 → DES9, DES13 → S12, S16, S27, S28, S35 → V31, V32, V34, V35, V68; V66` | `UREQ10@R1 → UDES10@R1 → US10@R1`; `UREQ9@R1 → UV13@R1` | Tool gate refuses without a repo, while busy, or with a blocked dirty buffer. It saves every dirty buffer, then sets the pre-suspend message (one path or `N files`) with `runTool { argv, cwd: top }`; with nothing dirty it runs with no message. `exited`/`failed` clears the message, refreshes, and re-reads every buffer and index; `missing` gives the error notice | `src/core/state/git.ts:openTool` (544), `runTool` (567), `onToolExited` (184), `openingTool`, `toolNotStarted`, `toolMissing` | `Satisfied` |
| `REQ4@R3 → DES10, DES11, DES13 → S10, S11, S34 → V15; V66` | `UREQ3, UREQ4, UREQ6, UREQ8 → UDES3, UDES4, UDES6, UDES8 → US3, US4, US6, US8 → UV5, UV10 (core), UV12` | `hunk n/m` and end messages, cursor unchanged at the ends. Preview opens `gitHunk` or answers `no hunk at cursor`. Float closes on Esc/`q`, closes and runs any other key, and closes on an outside press. Blame text with the accepted buckets, or `not committed yet`. Statusline counts follow gitsigns (0 for untracked or unborn; absent without a repo) | `src/core/state/git.ts:gotoHunk` (622), `previewHunk` (639), `blameLine` (658), `onGitBlamed` (687), `ago` (700), `gitSegment` (717); `src/core/state/keys.ts:87`; `src/core/state/status.ts:37`, `:118`; `src/core/state/mouse.ts` unchanged (generic gate) | `Satisfied` |
| `REQ4@R3 → DES11 → S36 → V69` | `UREQ7@R1 → UDES7@R1 → US7@R1 → UV11@R1` | `+git`: `g Lazygit (full screen)`, `h +hunk`; `+hunk`: `b Blame line`, `p Preview hunk`, `r Reset hunk`, `s Stage hunk`; no `]`/`[` rows; every binding id registered | `src/core/state/git-commands.ts:gitCommands`, `gitBindings`, `gitGroups`; `test/support/state.ts:testRegistries` | `Satisfied` |

**Notice catalogue check (S34, UV13).** I compared every string and level in `src/core/state/git.ts:35–61` and every `message()` call site with the DES13 table and the UI design §7 Component: Git message catalogue. All 16 catalogue rows match exactly. They include ` · ` as U+00B7 and the straight double quotes around paths. Four notices have no catalogue level, and the levels chosen for them are defensible:

- `cannot save <path>` → `error`
- `not staged: <path> could not be saved` → `error` (the design gives the wording)
- `buffer changed; try again` → `info`
- blame failure → first stderr line at `error`

**Recorded deviations (implementation report §Deviations 1–17).**

| # | Deviation | Judgement |
|---|---|---|
| 1 | `repo: RepoInfo` on `gitStatus`, `gitReadIndex`, `gitStage`, `gitBlame` | Accepted — the plan directs it (T1 step 2) |
| 2 | `gitBlamed` carries `now`; blame `line` is 0-based | Accepted — `update` must stay pure, and `key`, `mouse`, and `timer` already carry time. This is a Part 2 contract (runner sets `now`, adapter passes `-L line+1,+1`), documented in `src/core/state/types.ts` doc comments |
| 3 | NUL/SOH marks for final-newline and BOM differences; `oldLines` re-sliced from real lines | Accepted — gives the S18 line-0 rule and the P1-G1 zero-byte case. Marks never reach patches or reset |
| 4 | Reset also restores `bom` at line 0 | Accepted — the same rule DES5 applies to `finalNewline`. Without it a BOM-only hunk could not be reset |
| 5 | Reset refuses an untracked file with `no hunk at cursor` | Accepted — there is no index text to restore. Emptying the note and then autosaving would destroy data |
| 6 | `syncGitFiles` replaces `trackOpenBuffer`/`dropClosedBuffer` | Accepted — same §6 invariant (`files` ⊆ listed open buffers, dropped in the same transition) in one wrapper hook. It also clears `pending` on close (§7 invariant) and closes an orphaned float |
| 7 | `unwritable = blocked \|\| (dirty && readOnly)` | Accepted — `writeBuffer` skips read-only buffers silently, so §7 "Blocked buffers" needs exactly this check |
| 8 | `cannot save <path>` at `error` | Accepted — DES13 keeps the wording and gives no level; `error` matches the tool counterpart |
| 9 | `onSaved` chains git after both branches | Accepted — quit still runs first (DES9 order). The re-write of a buffer edited during its write is required by §7 "Typing during a write" |
| 10 | Untracked patch against an empty `IndexText`, mode `100644` | Accepted for core. Real `git apply --cached` behaviour is owed by Part 2 `V36` |
| 11 | Blame answers `not committed yet` for index code `A`; failure at `error` | Accepted — a staged new file is not in HEAD, so `git blame` would fail. §5 Failure rules require a notice for blame failure |
| 12 | `previewHunk` stores the fresh hunks | Accepted — keeps the stored hunks in step with the float, so Part 3 can compute `n/m` |
| 13 | `failed` handled like `exited`; `read` for every buffer | Accepted — matches §5 Failure rules and §7 `onToolExited` |
| 14 | `toml.test.ts`, `whichkey.test.ts` changed additively | Accepted — both tests list everything, and no snapshot changed |
| 15 | Counting in `git.ts:gitSegment`; `status.ts` only wires it | Accepted — honours the T5 refactor rule (no UI formatting in core) |
| 16 | `]`/`[` become keymap prefixes | Accepted — a probe confirmed `f]`, `r[`, and `di[` still reach vim, and `]x` does nothing, as in Neovim |
| 17 | `]h`/`[h` go to column 0 and record no jump | Accepted — the design does not specify jumplist behaviour |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V43` | `S17` | `DES11` | `bun test src/core/state src/core/config`; read `schema.test.ts:117` | `["gitui"]` ok; `[]`, `[1]`, `[""]`, unknown key → 1 error each; missing section and `defaults` → `["lazygit"]` | `Passed` |
| `V18` | `S19` | `DES2`, `DES1` | `git.test.ts` "typing debounces the diff…", "outside a repository typing…" | `startTimer gitDiff:1 100` on each key, no git effect; timer → change hunk; no git timer outside a repo | `Passed` |
| `V19` | `S20` | `DES6` | `git.test.ts` "saves, file changes, git-dir changes, and tool exits coalesce…" | Each of `saved`, `fileChanged`, `gitDirChanged`, `toolExited` → `startTimer gitRefresh 200`; timer → one `gitStatus { repo, prefix: "ws/" }` | `Passed` |
| `V25` | `S18` | `DES3` | `git.test.ts` "a BOM-only difference…" (+ final-newline and zero-byte cases) | One `change` hunk at line 0, `oldLines` unmarked | `Passed` |
| `V26` | `S20`, `S22` | `DES6`, `DES7` | `git.test.ts` "a head change retargets the watch…" | `gitWatch` with `refs/heads/feature`; `gitReadIndex` only for `a.md` | `Passed` |
| `V27` | `S20` | `DES6` | `git.test.ts` "a status result after the repository is gone…" | `state` is the same object; no effects; a late `gitIndexRead` is dropped too | `Passed` |
| `V10` | `S1` | `DES4` | `git.test.ts` "staging a clean tracked hunk…" | Exact `gitStage` with `expectedOid: "oid1"`, exact patch text, `report {2,2,false}`, no pending | `Passed` |
| `V11` | `S2` | `DES4` | `git.test.ts` "staging an untracked file…" | `expectedOid: null`, patch ends `@@ -0,0 +1,2 @@` | `Passed` |
| `V12` | `S3` | `DES4`, `DES13` | `git.test.ts` "a stale index warns and refreshes" | `index changed; hunks refreshed` at `warn`; `gitReadIndex` and `gitRefresh` | `Passed` |
| `V13` | `S4` | `DES4`, `DES13` | `git.test.ts` "a conflicted file is never staged" | No git effect; `notes/a.md has conflicts; resolve them in lazygit` at `error` | `Passed` |
| `V20` | `S29` | `DES4` | `git.test.ts` "a dirty buffer is saved before staging…", "text typed while…" | Write first with pending stage; `saved` → `gitStage` with `saved: true`; `saveFailed` → error notice, pending cleared; re-typed text is written again before stage | `Passed` |
| `V21` | `S27` | `DES4`, `DES9` | `git.test.ts` "a second git operation…", "the tool is refused while a stage waits…" | `git: another operation is running` at info; no write, no git effect; pending unchanged | `Passed` |
| `V23` | `S6` | `DES5` | `git.test.ts` "reset restores index lines in one undo step…", "reset puts deleted lines back…" | Lines equal index, `finalNewline` set to the index flag, no git effect, `u` restores lines; delete, topdelete, EOF delete, add, and tail-add resets correct | `Passed` |
| `V31` | `S27` | `DES9` | `git.test.ts` "opening the tool writes every dirty buffer first…" | Two writes; no `runTool` until both `saved`; then one `runTool { argv: ["lazygit"], cwd: "/repo" }` | `Passed` |
| `V32` | `S28` | `DES9` | `git.test.ts` "a failed or blocked save cancels the tool" | `saveFailed`, deleted-dirty, and read-only-dirty → no `runTool`, `git tool not started: notes/a.md could not be saved` at error | `Passed` |
| `V34` | `S16` | `DES9` | `git.test.ts` "without a repository or tool the user is told why" | `not a git repository` info; `lazygit not found (git.tool)` error, no effects | `Passed` |
| `V35` | `S12`, `S20` | `DES9` | `git.test.ts` "after the tool exits…" | `gitRefresh` timer, one `read` and one `gitReadIndex` per open buffer, message cleared | `Passed` |
| `V68` | `S35` | `DES9`, `DES13` | `git.test.ts` tool tests | `2 files written · opening lazygit` in the same result as `runTool`; `"notes/a.md" written · opening lazygit`; none dirty → no message; after `toolExited` → no message | `Passed` |
| `V66` | `S34` | `DES13` | `git.test.ts` catalogue, navigation, preview, tool, and discovery tests | Every listed row asserted with text and level: goto inside and both ends; stage no-hunk, conflicted, busy; staged ok (saved false/true), stale, failed (first stderr line); reset ok and no-hunk; preview no-hunk; tool blocked and saveFailed; tool missing; version notice | `Passed` |
| `V15` | `S10` | `DES10` | `status.test.ts` "git segment counts…", "git segment shows a detached head…" | `3→1` → `changed 1, removed 2`; mixed → `added 2, changed 2`; untracked and unborn → zeros; no repo → undefined; detached `a1b2c3d` + `rebasing` | `Passed` |
| `V69` | `S36` | `DES11` | `git-commands.test.ts` | Rows as specified, `g +git` at leader, every binding id registered, exactly seven sequences | `Passed` |
| `UV5@R1` | `US3@R1` | `UDES3@R1` | `git.test.ts` navigation, catalogue, reset, no-hunk tests | `hunk 1/4`, `hunk 2/4`, `hunk 3/4`, `no next hunk`, `no previous hunk` with cursor unchanged; `staged hunk 2/4`; `"projects/so-roadmap.md" written · staged hunk 2/4`; `reset hunk 1/1 · buffer changed, autosave pending`; `no hunk at cursor` for stage, reset, and preview; all info | `Passed` |
| `UV10@R1` (core gate) | `US6@R1` | `UDES6@R1` | `git.test.ts` "preview opens the hunk float and closes…", "the hunk float closes with its buffer" | Esc and `q` close with the cursor unchanged; `j` closes and moves; outside press closes; inside press keeps it; clean line opens nothing | `Passed` |
| `UV11@R1` | `US7@R1` | `UDES7@R1` | `git-commands.test.ts` with `testRegistries()` | As `V69`. Production `registries()` merge belongs to `P3-G1` | `Passed` |
| `UV12@R1` | `US8@R1` | `UDES8@R1` | `git.test.ts` blame tests | 11 bucket rows from `just now` to `2 years ago`, singular and plural, `hieu, … · Add notes (a1b2c3d)` at info; uncommitted, untracked, unborn, and staged-new → `not committed yet` info without git | `Passed` |
| `UV13@R1` (reducer part) | `US9@R1` | `UDES9@R1` | `git.test.ts` | Tool missing, not a repo, conflicted, stale, save failed, blocked, version, and busy rows match the catalogue text and level; `missing` emits no effect | `Passed` |
| Reducer, status, commands, config units | `S1`–`S4`, `S6`, `S10`, `S11`, `S16`–`S20`, `S27`–`S29`, `S34`–`S36` | `DES1`–`DES11`, `DES13` | `bun test src/core/state src/core/config` | 370 pass, 0 fail, 33 files | `Passed` |
| Static and unit gate | None | None | `bun run check` | biome clean (341 files), tsc clean, knip zero, 1174 pass, 0 fail | `Passed` |
| Existing rendering unchanged (`repo: null`) | None | `DES12` | `bun test test/ui test/integration`; `git diff --stat 41dad6b..a75e377 -- test/ui test/integration test/e2e` | 216 pass, 0 fail, 63 snapshots; no test or snapshot file changed in the range | `Passed` |
| Temporary runner cases | None | `DES1` | `grep -n 'case "gitStatus"' src/app/effects.ts` | One match, line 500 (the six-kind no-op group) | `Passed` |
| No process ids in code | None | None | `grep -rcE "W261005F2A7\|\b(REQ\|DES\|UDES\|UV\|UREQ\|US)[0-9]\|\bV[0-9]+\b\|\bS[0-9]+\b\|P[0-9]-G[0-9]" src test` | Zero files with matches | `Passed` |
| Layer boundaries | None | `DES1` | `bun test test/boundaries.test.ts` | 2 pass; `git.ts` and `git-commands.ts` import core only | `Passed` |
| External checkout of a clean open file | `S20`, `S22` | `DES6` | Scratch probe (deleted afterwards): open `a.md` clean, then `gitDirChanged`, then `gitStatus` with new head and `a.md` absent before and after | `gitDirChanged` → `[startTimer]`; `gitStatus` → `[gitWatch]` only; no `gitReadIndex` for `a.md` | `Failed` — `P1-G2-VER1` |
| Bracket prefixes do not break vim | None | `DES11` | Scratch probe (deleted afterwards): `f]`, `r[`, `di[`, `]x` on `a[b]c` | Cursor at col 3; `[[b]c`; `a[]c`; `]x` clears pending, text unchanged | `Passed` |
| Process hygiene | None | None | `ps aux` | Only the pre-existing `bun run tui` and `bun run sandbox` processes remain; probe directory removed; working tree back to the pre-existing `.gitignore` change | `Passed` |

## Findings

### P1-G2-VER1 — Major — Specification / correctness — External checkout leaves open files diffed against a stale index blob

- **System Design:** `REQ6@R2`, `REQ5@R2`; `DES6`; `S20`, `S22`; `V19`, `V26` (system design §5 Refresh step 1: "On `toolExited` and on `gitDirChanged` with an `index` change, every open buffer is re-read, because `ls-files` is the source of truth for the oid.")
- **UI Design:** `UREQ1@R1`–`UREQ4@R1` data (signs, counts); `US3@R1`
- **Evidence:** `src/core/state/update.ts:213`:

  ```ts
  case "gitDirChanged":
    return requestRefresh(state);
  ```

  `src/core/state/git.ts:175–179` re-reads only paths whose status entry changed:

  ```ts
  if (prev !== null)
    for (const path of Object.keys(s.git.files))
      if (indexChanged(prev.files.get(path), status.files.get(path)))
        effects.push(readIndex(next, path));
  ```

  A file that is clean on both branches has no status entry before or after, so a `git checkout`, `pull`, `merge`, or `reset --hard` in another terminal never re-reads its index. A probe confirmed this. With `a.md` clean, `gitDirChanged` produced only `[startTimer]`, and the following `gitStatus` with a new head produced only `[gitWatch]`. The workspace watcher then reloads the buffer with the new branch text, and `gitDiff` diffs it against the old blob. `toolExited` does re-read everything, so checkouts done inside lazygit are not affected. The implementation report does not record this departure from §5.
- **Impact:** After an external branch switch, the gutter signs, statusline counts, and preview show the whole branch difference as unstaged hunks, and they stay until something else re-reads that file. `<leader>ghr` on such a "hunk" writes the old branch's lines into the buffer, and autosave then writes them to disk. `<leader>ghs` fails with `stale` instead of working. The design is partly at fault: DES6 and §7 describe only the per-entry rule, and `gitDirChanged` has no payload that says whether `index` changed.
- **Required resolution:** After a `gitDirChanged`, every tracked open file's index entry is read again, as §5 Refresh step 1 requires. Keep one read per file per burst. One option: record in core that the git dir changed, and emit one `gitReadIndex` per tracked file when the coalesced refresh runs or its status arrives. Another is to re-read on each `gitDirChanged`, if the cost is acceptable. `V26` (head change re-reads only the changed file when no `gitDirChanged` preceded it) keeps passing. If the orchestrator prefers a different contract, record the decision in the system design (§5, DES6) first.
- **Required proof:** A new reducer case in `src/core/state/git.test.ts`, named by behaviour (e.g. "a git-dir change re-reads every open file's index"). The setup is a clean open tracked file with no status entry, followed by `gitDirChanged`, the `gitRefresh` timer, and a `gitStatus` with a new head and no entry for the file. The test asserts exactly one `gitReadIndex` for that file. Then `bun test src/core/state src/core/config` and `bun run check` pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - Every assigned `V` and `UV` case (`V10`–`V13`, `V15`, `V18`–`V21`, `V23`, `V25`–`V27`, `V31`, `V32`, `V34`, `V35`, `V43`, `V66`, `V68`, `V69`, `UV5`, `UV10` core, `UV11`, `UV12`, `UV13` reducer), asserted on exact effects and exact message text and level.
  - Additional cases:
    - final-newline, zero-byte, untracked, and ignored hunks
    - buffer close dropping its entry, cancelling pending, and closing the float
    - text typed during the stage write
    - read-only and deleted-dirty refusals
    - custom `git.tool` argv passed literally
    - delete, top-delete, add, and tail-add resets
    - an index entry appearing or disappearing
    - detached head with `rebasing`
- **Missing:** A reducer case showing that a `gitDirChanged` re-reads the index of a clean open file whose status entry is absent before and after (`P1-G2-VER1`). Minor gaps:
  - Conflict detected only through `status.files[path].conflict`, with the index entry not yet marked conflicted, is not asserted.
  - `reset hunk n/m` is asserted only as `1/1`. The UV5 example `reset hunk 3/4` is untested, although the `n/m` helper is shared with stage and is proven at `2/4`.

## Scope Changes

The 17 deviations recorded in the implementation report are judged in the Specification Verification table above; all are accepted. One further departure was not recorded: `gitDirChanged` does not re-read open files' index entries, contrary to system design §5 Refresh step 1 (`P1-G2-VER1`). No unplanned files were changed. `src/core/state/mouse.ts` is unchanged, as T5 allowed, because the generic gate already closes the float on an outside press (asserted).

## Unverified Items

- Real Git behaviour of the core contracts is owed by Part 2, so it was not verified here: the untracked intent-to-add patch (deviation 10, `V36`), the 0-based blame line mapped to `-L line+1,+1`, and `gitBlamed.now` set by the runner (deviation 2).
- Production `registries()` merge of `gitCommands`, `gitBindings`, and `gitGroups` belongs to `P3-G1`. `UV11` was verified only with `testRegistries()`.

## Blockers

None
