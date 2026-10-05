# W261005F2A7 Plan Part 2 — adapters-and-handoff

## Status

`Ready`

## Objective

The core decisions from Part 1 reach real Git and the real terminal: one argv adapter runs every Git command lock-free with contents on stdin, a first-level watcher reports git-dir changes, the effect runner executes every Git effect (stage on the serial queue), and the save-gated tool hand-off flushes the pre-suspend frame, holds SIGINT, suspends a paint-guarded shell, and always resets modes, resumes, and releases. `main.ts` and `startApp` construct these dependencies and run discovery after the first frame. Proven with real Git in temp repos, real `fs.watch`, app-level units, and the integration suite.

## Coverage Summary

- **System Design:** `W261005F2A7-REQ1@R2`, `REQ2@R2`, `REQ3@R1`, `REQ4@R3` (adapter side), `REQ6@R2`, `REQ7@R2`, `REQ9@R1` (runner side); `DES1`, `DES3`, `DES4`, `DES6`–`DES9`, `DES11` (adapter side); `S1`–`S3`, `S5`, `S11`–`S16`, `S20`–`S27`, `S29`–`S31`, `S35`; `V28`–`V30`, `V33`, `V36`–`V42`, `V54`–`V60`, `V62`, `V67`
- **UI Design:** `W261005F2A7-UREQ10@R1`; `UDES10@R1` (shell side: paint once before suspend, nothing while suspended, images re-issued); `US10@R1` (mechanics)

## Sources

- Plan index: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-plan-index.md`
- Plan context: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-plan-context.md`
- System design: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-system-design.md`
- UI design: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-ui-design.md`
- System requirements: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-requirements.md`
- UI requirements: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-ui-requirements.md`

## Dependencies

- Part 1 complete and verified (`P1-G1`, `P1-G2`). Consumed outputs: git `Action`/`Effect`/`TimerId` members, `RepoInfo`, `IndexEntry`, `StageReport`, `ToolResult` (`src/core/state/types.ts`); `parseStatus`, `RepoStatus`, `parseBlame`, `BlameLine`, `normalizeIndexText`; `gitCommands`/`gitBindings`/`gitGroups` in `testRegistries()`; `ConfigSchema.git.tool`; the temporary no-op group for the six Git effect kinds in `src/app/effects.ts`, which this part replaces.

**Execution rules for every task and every delegated agent:**

- Read and follow `.s1mple/S1MPLE.md` and its required references (`docs/communication.md`, `docs/project.md`, `docs/languages/typescript.md`) before editing.
- No work-process identifiers in code, comments, identifiers, test names, or log messages.
- Canonical verification ids follow system design §8 "Test Suites and Cases" (plan context §7).
- Real-Git tests use isolated temp repos (`GIT_CONFIG_NOSYSTEM=1`, `HOME` = temp dir, `user.email`/`user.name` set, `init.defaultBranch=main`), remove temp dirs, and await every spawned process.
- Kill every process you start (test apps, watchers, PTYs, child processes) and close every watcher before finishing; check for orphans before running benches.
- `bun run check` passes before each commit.

## Execution Flow

```text
P2-G1: git adapter, watcher, and runner → P2-G2: tool hand-off and suspend-aware shell
```

## Groups

### P2-G1 — git adapter, watcher, and runner

#### Goal

`createGit` runs discovery, status, index reads, stage, and blame through one lock-free base argv with contents on stdin; `watchGitDirs` reports first-level changes, ignores lock and cookie names, retargets, and survives start failures; the runner executes `gitStatus`, `gitReadIndex`, `gitStage` (serial), `gitBlame`, and `gitWatch`; `main.ts` and `startApp` provide `git` and `watchGit`, and `main.ts` runs `git.detect` after the first frame.

#### Coverage Summary

- **System Design:** `REQ1@R2`, `REQ4@R3` (adapter side), `REQ6@R2`, `REQ7@R2`, `REQ9@R1`; `DES1`, `DES3`, `DES4`, `DES6`, `DES7`, `DES8`, `DES11` (blame adapter); `S1`–`S3`, `S5`, `S11`, `S20`–`S26`, `S29`, `S30`; `V28`, `V29`, `V36`–`V40`, `V41` (gitWatch part), `V54`–`V57`, `V62`
- **UI Design:** None — no painted surface; markers and statusline data are asserted as state in `V56`.

#### Scope

- Included: `src/workspace/git.ts` + tests; `test/support/git-repo.ts`; `src/workspace/git-watcher.ts` + tests; runner cases for five Git effects and `RunnerDeps.git`/`watchGit`; `src/app/main.ts` construction of `git` and `watchGit` and the deferred `detect`; `test/integration/helpers.ts` `startApp` deps; `test/integration/git.test.ts` (`V56`, `V57`).
- Excluded: `runTool`, `ToolHost`, lifecycle, shell (P2-G2); production `registries()` merge and every UI surface (Part 3).
- Main files: `src/workspace/{git,git-watcher}.ts`, `src/workspace/{git,git-watcher}.test.ts`, `test/support/git-repo.ts`, `src/app/effects.ts`, `src/app/effects.test.ts`, `src/app/main.ts`, `test/integration/{helpers,git.test}.ts`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ7@R2 → DES8 → S24–S26 → V28, V29` | None | Discovery from subfolder, worktree, unborn; version gate; silent without Git |
| `REQ1@R2 → DES4 → S1–S3, S5, S30 → V36, V37, V62` | None | Real-Git stage of one hunk, untracked, CRLF; stale oid applies nothing; only allowed subcommands; contents on stdin |
| `REQ6@R2 → DES6 → S21 → V38` | None | No `.git/index` mtime change |
| `REQ4@R3, REQ7@R2 → DES3, DES11 → S11, S26 → V39` | None | Index entry kinds; blame of an unsaved line uncommitted; `git.fail` logged |
| `REQ6@R2, REQ7@R2 → DES7 → S22, S23, S25 → V54, V55` | None | Worktree-aware first-level watching; lock noise ignored; start failure logged |
| `REQ1@R2, REQ9@R1, REQ6@R2 → DES1, DES4, DES6 → S20, S29 → V40, V41 (gitWatch)` | None | Stage after the acknowledged write; one watcher retargeted |
| `REQ6@R2, REQ9@R1 → DES6, DES7, DES4 → S22, S29 → V56, V57` | None | External commit refreshes state within 1 s; edit + save + stage stages the typed line |

#### Cross-Work Gates

None

#### Tasks

##### P2-G1-T1 — Git adapter discovery and reads

- **Outcome:** `test/support/git-repo.ts` builds isolated temp repos; `createGit` implements `detect` (which → `--version` gate at 2.31 → one `rev-parse` → `symbolic-ref`/short HEAD), `status` (porcelain v2 scoped to the prefix, `op` from `rebase-merge`/`rebase-apply`/`MERGE_HEAD`), `readIndex` (ignored/untracked/conflicted/tracked with normalized text), and `blame` (`--contents -` on stdin); every call uses `BASE`; failures log `git.fail` and throw.
- **System Design:** `REQ4@R3`, `REQ6@R2`, `REQ7@R2`; `DES1`, `DES3`, `DES6`, `DES8`, `DES11`; `S11`, `S21`, `S24`, `S25`, `S26`; `V28`, `V29`, `V38`, `V39`
- **UI Design:** None
- **Canonical Shapes:** System design §5 Discovery; §6 `Git`; §7 `src/workspace/git.ts`
- **Files:** `src/workspace/git.ts` — `GitSpawn`, `Git`, `createGit`, `parseVersion`, `MIN_GIT`, `BASE`, default Bun spawn; `test/support/git-repo.ts` — `gitRepo(files, opts)`; `src/workspace/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V28`, `V29`, `V38`, `V39`:** `src/workspace/git.test.ts` with real `git`.

   **Preview:**

   ```ts
   test("detect resolves a subfolder prefix, a linked worktree, and an unborn branch", async () => {
     // repo with notes/ → prefix "notes/"; `git worktree add` → commonDir !== gitDir; fresh init → head { kind: "unborn", name: "main" }
   });
   test("detect gates old git and stays silent without git", async () => {
     // stub spawn "git version 2.20.1" → { repo: null, notice: "git 2.20.1 is older than 2.31; git features off" }
     // which → null → { repo: null } with no notice; parseVersion("git version 2.39.3 (Apple Git-146)") → [2, 39, 3]
   });
   test("reads never touch the index file", async () => { /* mtime of .git/index equal before/after status, readIndex, blame */ });
   test("index reads classify ignored, untracked, and conflicted files, and blame of an unsaved line is uncommitted", async () => {
     // recording logger: a failing call records git.fail with argv[1..2], exit code, first stderr line
   });
   ```

   - Run `bun test src/workspace/git.test.ts` and confirm failure.

2. **GREEN:** `src/workspace/git.ts`, `test/support/git-repo.ts`

   **Preview:**

   ```ts
   const BASE = ["git", "--no-optional-locks", "--literal-pathspecs", "-c", "core.quotepath=off", "-c", "color.ui=false", "-c", "gc.auto=0"];
   export function createGit(d: { spawn?: GitSpawn; which: (c: string) => string | null; logger: Logger }): Git {
     // detect / status / readIndex / blame per system design §7; stage added in T2
   }
   // git-repo.ts: export async function gitRepo(files: Record<string, string>, opts?: { commit?: boolean; worktree?: boolean }): Promise<{ root; env; run(args); cleanup() }>
   ```

   - Paths go after `--`; contents only on stdin; no shell.
   - `head` and `op` use the `RepoInfo` shapes from Part 1.

3. **REFACTOR:** One private `run(cwd, args, stdin?)` helper and one failure path.

   **Preview:**

   ```text
   allowed: private helpers in git.ts and git-repo.ts
   prohibited: any mutating subcommand other than those added in T2
   ```

   - Keep all affected checks passing; remove temp dirs.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): add the git adapter for discovery, status, index, and blame

   Task: P2-G1-T1 — Git adapter discovery and reads
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V28`, `V29`, `V38`, `V39` — `bun test src/workspace/git.test.ts` → pass; no temp dirs left.

##### P2-G1-T2 — Git adapter stage

- **Outcome:** `stage` adds intent-to-add for `expectedOid: null`, otherwise compares `ls-files -s` oid and returns `"stale"` on mismatch, then runs `apply --cached --unidiff-zero --whitespace=nowarn -` with the patch on stdin; a recording `GitSpawn` proves every method uses only allowed subcommands and never puts contents or newlines in argv.
- **System Design:** `REQ1@R2`; `DES1`, `DES4`; `S1`, `S2`, `S3`, `S5`, `S30`; `V36`, `V37`, `V62`
- **UI Design:** None
- **Canonical Shapes:** System design §5 Stage Hunk (adapter lines); §7 `src/workspace/git.ts` `stage`
- **Files:** `src/workspace/git.ts` — `stage`; `src/workspace/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V36`, `V37`, `V62`:** `src/workspace/git.test.ts`.

   **Preview:**

   ```ts
   test("staging one of two hunks stages exactly that hunk", async () => {
     // patch = hunkPatch(...) from core for hunk 1; git diff --cached shows hunk 1 only; git diff shows hunk 2
   });
   test("staging an untracked file and a CRLF line stage only the hunk", async () => { /* status "AM"; core.autocrlf=true → one line staged */ });
   test("a changed index entry stages nothing", async () => { /* external `git add`; stage(expectedOid old) → "stale"; index unchanged */ });
   test("every git call uses an allowed subcommand and keeps contents on stdin", async () => {
     // recording spawn: argv[BASE.length] ∈ {--version, rev-parse, symbolic-ref, status, ls-files, cat-file, blame, add, apply}
     // add only with --intent-to-add; apply only with --cached; no argv element includes "\n" or patch/contents; stdin equals them
   });
   ```

   - Run `bun test src/workspace/git.test.ts` and confirm the new cases fail.

2. **GREEN:** `src/workspace/git.ts` — `stage`

   **Preview:**

   ```ts
   stage: async (repo, e) => {
     // e.expectedOid === null → add --intent-to-add -- <repoPath>
     // else ls-files -s -- <repoPath> → oid !== e.expectedOid → return "stale"
     // apply --cached --unidiff-zero --whitespace=nowarn -   (stdin e.patch); non-zero → throw Error(first stderr line)
     return "ok";
   },
   ```

   - `stage` is the only method that writes the index.

3. **REFACTOR:** None beyond sharing the oid lookup with `readIndex`.

   **Preview:**

   ```text
   allowed: shared ls-files parsing helper
   prohibited: retries or extra subcommands
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): stage one hunk through git apply with an oid guard

   Task: P2-G1-T2 — Git adapter stage
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V36`, `V37`, `V62` — `bun test src/workspace/git.test.ts` → pass.

##### P2-G1-T3 — Git-dir watcher

- **Outcome:** `watchGitDirs` watches the first-level entries of each unique dir, ignores names matching `IGNORED_NAME`, logs `git.watch.fail` and skips a dir whose watch throws, and `retarget` closes removed watchers and opens new ones; closed watchers never notify.
- **System Design:** `REQ6@R2`, `REQ7@R2`; `DES7`; `S22`, `S23`, `S25`; `V54`, `V55`
- **UI Design:** None
- **Canonical Shapes:** System design §6 `GitWatcher`; §7 `src/workspace/git-watcher.ts`
- **Files:** `src/workspace/git-watcher.ts` — `GitWatcher`, `watchGitDirs`, `IGNORED_NAME`; `src/workspace/git-watcher.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V54`, `V55`:** `src/workspace/git-watcher.test.ts` with real `fs.watch` and temp repos.

   **Preview:**

   ```ts
   test("a commit notifies within a second, including a linked worktree, and lock files never do", async () => {
     // watchGitDirs([gitDir, commonDir, refsHeads], onChange, logger); commit → onChange ≥ 1 within 1000 ms
     // write only index.lock → no call; worktree commit → notified via both dirs
   });
   test("a failing directory is logged and the others keep notifying after retarget", async () => {
     // watchFn throws for dir A → logger.warn("git.watch.fail", { dir: A }); dir B still notifies; retarget([C]) → B closed and silent
   });
   ```

   - Run `bun test src/workspace/git-watcher.test.ts` and confirm failure.

2. **GREEN:** `src/workspace/git-watcher.ts`

   **Preview:**

   ```ts
   export function watchGitDirs(dirs: string[], onChange: () => void, logger: Logger, watchFn = watch): GitWatcher {
     // Map<dir, FSWatcher>; open(dir) in try/catch → logger.warn("git.watch.fail", { dir })
     // listener: (_t, name) => !IGNORED_NAME.test(name ?? "") && onChange()
     // retarget(next): close missing, open new; stop(): close all
   }
   ```

   - No debounce here; coalescing is the core `gitRefresh` timer.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   allowed: naming
   prohibited: recursive watching, polling
   ```

   - Keep all affected checks passing; every watcher is closed at test end.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): watch git directories for branch and index changes

   Task: P2-G1-T3 — Git-dir watcher
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V54`, `V55` — `bun test src/workspace/git-watcher.test.ts` → pass; no open handles left.

##### P2-G1-T4 — Runner git cases and wiring

- **Outcome:** `RunnerDeps` gains `git` and `watchGit`; the runner runs `gitStage` on `serial` and echoes `report`, runs `gitStatus`/`gitReadIndex`/`gitBlame` free-running with exactly one action each (failures as failed results), and keeps one lazily created watcher that `gitWatch` retargets; `main.ts` builds `createGit` and `watchGit`, and calls `git.detect(ws.root)` inside the deferred `setImmediate` block dispatching `gitDetected`; `startApp` supplies real `createGit` and `watchGitDirs`; five of the six temporary no-op cases are gone (`runTool` remains until P2-G2).
- **System Design:** `REQ1@R2`, `REQ6@R2`, `REQ7@R2`, `REQ9@R1`; `DES1`, `DES4`, `DES6`, `DES7`, `DES8`; `S20`, `S26`, `S29`; `V40`, `V41` (gitWatch part)
- **UI Design:** None
- **Canonical Shapes:** System design §5 Construction and Wiring Flow; §7 `src/app/effects.ts`, `src/app/main.ts`
- **Files:** `src/app/effects.ts` — `RunnerDeps`, `createEffectRunner` git cases; `src/app/effects.test.ts`; `src/app/main.ts` — deps, deferred detect; `test/integration/helpers.ts` — `startApp` deps
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V40`, `V41` (gitWatch):** `src/app/effects.test.ts` with fake `git` and `watchGit`.

   **Preview:**

   ```ts
   test("a stage waits for the write queued before it", async () => {
     // run write (gated promise) then gitStage; git.stage not called until the write resolves; gitStaged carries the same report
   });
   test("git-dir watching reuses one watcher and retargets it", () => {
     // two gitWatch effects → watchGit called once; retarget called with each dirs list; onChange dispatches gitDirChanged
   });
   ```

   - Run `bun test src/app/effects.test.ts` and confirm failure.

2. **GREEN:** runner, main, startApp

   **Preview:**

   ```ts
   // effects.ts RunnerDeps: git: Git; watchGit: (dirs: string[], onChange: () => void) => GitWatcher;
   case "gitStage": void serial(() => d.git.stage(repoOf(e), e)).then(
     (r) => d.dispatch({ type: "gitStaged", path: e.path, result: r, report: e.report }),
     (x) => d.dispatch({ type: "gitStaged", path: e.path, result: { failed: msg(x) }, report: e.report })); return;
   case "gitWatch": (watcher ??= d.watchGit(e.dirs, () => d.dispatch({ type: "gitDirChanged" }))).retarget(e.dirs); return;
   // gitStatus / gitReadIndex / gitBlame: one action each, { ok: false } / { kind: "failed" } / { failed } on rejection
   // main.ts: const git = createGit({ which: Bun.which, logger }); deps.git = git; deps.watchGit = (dirs, on) => watchGitDirs(dirs, on, logger)
   //          inside setImmediate: void git.detect(ws.root).then((r) => store.dispatch({ type: "gitDetected", ...r }));
   ```

   - `repoOf(e)` is `e.repo`: the `gitStatus`, `gitReadIndex`, `gitStage`, and `gitBlame` effects carry `repo: RepoInfo` from `P1-G2-T1`, so the runner holds no Git state.
   - No Git process before the first frame.

3. **REFACTOR:** None beyond shared failure-message helpers already in `effects.ts`.

   **Preview:**

   ```text
   allowed: reuse existing msg(x)
   prohibited: holding git state in the runner
   ```

   - Keep all affected checks passing (`effects.test.ts`, integration suites).

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): run git effects and detect the repository after the first frame

   Task: P2-G1-T4 — Runner git cases and wiring
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V40`, `V41` (gitWatch) — `bun test src/app/effects.test.ts` → pass.
- `bun run check` → passes; `grep -n "case \"gitStatus\"" src/app/effects.ts` shows a real case.

##### P2-G1-T5 — Refresh and stage integration

- **Outcome:** With the real runner, store, watcher, and Git, an external commit updates `statusSegments(state).git` and `explorerMarkers(state.git.status)` within 1 s, and edit + save + stage via commands leaves the typed line in `git diff --cached` with a clean buffer.
- **System Design:** `REQ6@R2`, `REQ9@R1`; `DES4`, `DES6`, `DES7`; `S22`, `S29`; `V56`, `V57`
- **UI Design:** None
- **Canonical Shapes:** System design §8 `test/integration/git.test.ts`
- **Files:** `test/integration/git.test.ts`
- **Execution Approach:** Direct verification — the behavior is already implemented by T1–T4; this task adds the integration proof and fixes only wiring defects it exposes.

**Steps:**

1. `test/integration/git.test.ts` — `V56`, `V57` cases

   **Preview:**

   ```ts
   test("an external commit refreshes the ref and markers", async () => {
     // gitRepo + startApp(root); waitFor(gitDetected); external commit on a new branch via checkout -b
     // await waitFor(() => statusSegments(app.store.get()).git?.ref === "feature", 1000)
   });
   test("editing, saving, and staging puts the typed line in the index", async () => {
     // open, type, <leader>ghs → waitFor gitStaged; git diff --cached contains the line; buffer clean
   });
   // afterEach: app.stop(); cleanup temp repo
   ```

   - Fix only wiring defects found; any reducer change goes back through its Part 1 test.

2. **VERIFY — `V56`, `V57`:**

   **Preview:**

   ```text
   bun test test/integration/git.test.ts
   └── Expect: both cases pass; no leftover processes or temp dirs
   ```

   - Run the command and inspect the exact expected result.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(git): cover refresh and stage through the real runner

   Task: P2-G1-T5 — Refresh and stage integration
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V56`, `V57` — `bun test test/integration/git.test.ts` → pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Adapter and watcher | `bun test src/workspace/git.test.ts src/workspace/git-watcher.test.ts` | `V28`, `V29`, `V36`–`V39`, `V54`, `V55`, `V62` pass |
| Runner | `bun test src/app/effects.test.ts` | `V40`, `V41` (gitWatch) pass |
| Integration | `bun test test/integration` | `V56`, `V57` pass; existing integration suites unchanged |
| Static and unit gate | `bun run check` | biome, tsc, knip zero, unit suites, boundaries (`src/workspace/git*` → workspace + core only) |
| Existing UI | `bun test test/ui` | Unchanged snapshots |
| Process hygiene | `pgrep -fl "bun .*so\|git "` after tests | No orphans |

#### Review and Verification Focus

- **Specification:** Only allowed subcommands; `--no-optional-locks` everywhere; prefix scoping and workspace-relative paths; stale oid applies nothing; watcher targets cover worktrees and branch dirs with `/`; detection after the first frame.
- **Technical:** Each Git effect dispatches exactly one action; stage on `serial`; failures logged without file contents; watchers closed on retarget/stop; temp repos isolated from user config.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P2-G2 — tool hand-off and suspend-aware shell

#### Goal

`<leader>gg` hands the terminal to the configured tool and gets it back intact: the shell flushes the pre-suspend frame, paints nothing while suspended, re-issues images on resume, and writes the foreign-mode reset; SIGINT is held during the tool; `ToolHost` resolves the tool first and always resets, resumes, and releases; the runner dispatches `toolExited`; `main.ts` and `startApp` provide `tool`.

#### Coverage Summary

- **System Design:** `REQ2@R2`, `REQ3@R1`; `DES9`; `S12`–`S16`, `S27`, `S31`, `S35`; `V30`, `V33`, `V41` (runTool part), `V42`, `V58`, `V59`, `V60`, `V67`
- **UI Design:** `UREQ10@R1`; `UDES10@R1` (shell side); `US10@R1` (mechanics)

#### Scope

- Included: `holdInterrupts` in `lifecycle.ts`; `Shell.flush/suspend/resume/resetForeignModes`, paint guard, `FOREIGN_MODES_RESET` in `shell.ts`; observable suspend/resume/frames in `test/support/ui.ts`; `test/ui/git.test.ts` with `V60`, `V67`; `src/app/tool-host.ts` + tests; the `runTool` runner case and `RunnerDeps.tool`; `deps.tool` late-bound in `main.ts`; stub tool in `startApp`; `V58` in `test/integration/git.test.ts`.
- Excluded: `HunkView` registration in `shell.ts` and all Git painting (Part 3); PTY e2e (`V50`, Part 3).
- Main files: `src/app/{lifecycle,tool-host,effects,main}.ts`, `src/app/{lifecycle,tool-host,effects}.test.ts`, `src/ui/shell.ts`, `test/support/ui.ts`, `test/ui/git.test.ts`, `test/integration/{helpers,git.test}.ts`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ2@R2 → DES9 → S13 → V42` | None | SIGINT ignored while held; SIGTERM still shuts down; release idempotent |
| `REQ2@R2 → DES9 → S14, S15, S31, S35 → V60, V67` | `UREQ10@R1 → UDES10@R1 → US10@R1` (mechanics) | Pre-suspend frame rendered before `suspend`; no writes while suspended; images drawn again after `resume` |
| `REQ2@R2, REQ3@R1 → DES9 → S12, S14, S16, S35 → V30, V33, V59` | None | Order flush → hold → suspend → spawn → reset → resume → release; finally on throw/kill; missing tool never suspends |
| `REQ2@R2 → DES9 → S12, S27 → V41 (runTool), V58` | None | `toolExited` carries the host result; post-tool re-read shows new content without a conflict dialog |

#### Cross-Work Gates

None

#### Tasks

##### P2-G2-T1 — Interrupt hold

- **Outcome:** `installLifecycle` returns `holdInterrupts`, a re-entrant counter whose release is idempotent; the SIGINT handler returns early while held; SIGTERM and SIGHUP still shut down.
- **System Design:** `REQ2@R2`; `DES9`; `S13`; `V42`
- **UI Design:** None
- **Canonical Shapes:** System design §7 `src/app/lifecycle.ts`
- **Files:** `src/app/lifecycle.ts` — `installLifecycle`; `src/app/lifecycle.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V42`:** `src/app/lifecycle.test.ts`.

   **Preview:**

   ```ts
   test("interrupts are ignored while held and shut down after release", () => {
     // hold → emit SIGINT → shutdown count 0; release → SIGINT → 1; release twice → held never negative; SIGTERM while held → shutdown
   }); // use the existing lifecycle test seams for signals and shutdown
   ```

   - Run `bun test src/app/lifecycle.test.ts` and confirm failure.

2. **GREEN:** `src/app/lifecycle.ts`

   **Preview:**

   ```ts
   let held = 0;
   // SIGINT handler: if (signal === "SIGINT" && held > 0) return;
   // return { exitNow, holdInterrupts: () => { held++; let done = false; return () => { if (!done) { done = true; held--; } }; } };
   ```

   - Existing shutdown paths unchanged.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   allowed: none
   prohibited: changing shutdown order or exit codes
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(app): hold interrupts while another program owns the terminal

   Task: P2-G2-T1 — Interrupt hold
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V42` — `bun test src/app/lifecycle.test.ts` → pass.

##### P2-G2-T2 — Suspend-aware shell

- **Outcome:** `Shell` gains `flush` (repaint, then `renderer.idle()`), `suspend` (paint guard on, `renderer.suspend()`), `resume` (`renderer.resume()`, guard off, repaint), and `resetForeignModes` (writes `FOREIGN_MODES_RESET`); `paint` returns early while suspended so no mouse mode is re-enabled; images visible before suspend are drawn again after resume; `test/support/ui.ts` exposes what the mounted shell renders and writes so tests can assert frames around suspend.
- **System Design:** `REQ2@R2`; `DES9`; `S14`, `S15`, `S31`, `S35`; `V60`, `V67`
- **UI Design:** `UREQ10@R1`; `UDES10@R1` (paint once before suspend, nothing while suspended); `US10@R1` (mechanics)
- **Canonical Shapes:** System design §6 `Shell` extension; §7 `src/ui/shell.ts`; UI design §7 Surface: Tool hand-off
- **Files:** `src/ui/shell.ts` — `Shell`, `createShell`, `paint`, `FOREIGN_MODES_RESET`; `test/support/ui.ts` — mounted shell observability; `test/ui/git.test.ts` (new)
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V60`, `V67`:** `test/ui/git.test.ts` with `mountShell`.

   **Preview:**

   ```ts
   test("the frame with the message is rendered before suspend and nothing after", async () => {
     const m = await mountShell({ cols: 120, rows: 36 });
     m.store.dispatch(/* an action that sets a message */);
     await m.shell.flush();
     // the last rendered frame contains the message text
     m.shell.suspend();
     m.store.dispatch(/* any action */);
     // no frame rendered and no terminal write after suspend
     m.shell.resume();
     m.destroy();
   });
   test("images visible before suspend are drawn again after resume", async () => {
     // recording drawImage (via the image test seams in test/support/ui.ts); suspend → resume → drawImage called again for that image
   });
   ```

   - Run `bun test test/ui/git.test.ts` and confirm failure.

2. **GREEN:** `src/ui/shell.ts`, `test/support/ui.ts`

   **Preview:**

   ```ts
   export const FOREIGN_MODES_RESET = "\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1005l\x1b[?1006l\x1b[?1015l\x1b[?1004l\x1b[?2004l\x1b[<99u\x1b[>4;0m\x1b[0m\x1b[?25h";
   let suspended = false;
   const paint = (s: AppState) => { if (suspended) return; /* existing body */ };
   // Shell additions:
   flush: async () => { repaint(); await renderer.idle(); },
   suspend: () => { suspended = true; renderer.suspend(); },
   resume: () => { renderer.resume(); suspended = false; /* force image re-issue */ repaint(); },
   resetForeignModes: () => process.stdout.write(FOREIGN_MODES_RESET),
   ```

   - `resume` must make the image layer re-draw visible images (RF11: kitty images are deleted on suspend); use the existing `ImageCache`/image painter mechanics, not a new cache.
   - `destroy()` stays safe while suspended.

3. **REFACTOR:** Keep the guard and escape bytes inside `src/ui/shell.ts`.

   **Preview:**

   ```text
   allowed: local helpers in shell.ts
   prohibited: exporting renderer internals; escape bytes outside src/ui
   ```

   - Keep all affected checks passing (`test/ui/shell.golden.test.ts`, `mouse.test.ts`).

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): flush, suspend, and resume the shell around external programs

   Task: P2-G2-T2 — Suspend-aware shell
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V60`, `V67` — `bun test test/ui/git.test.ts` → pass.
- `bun test test/ui` → existing snapshots unchanged.

##### P2-G2-T3 — Tool host

- **Outcome:** `createToolHost` returns `missing` without suspending when `which(argv[0])` is null; otherwise awaits `screen.flush()`, holds interrupts, suspends, spawns with inherited stdio at `cwd`, and in `finally` resets foreign modes, resumes, and releases exactly once; spawn throws → `failed`; a signal → `exited { signal }`; logs `git.tool.exit`.
- **System Design:** `REQ2@R2`, `REQ3@R1`; `DES9`; `S12`, `S14`, `S16`, `S35`; `V30`, `V33`, `V59`
- **UI Design:** None
- **Canonical Shapes:** System design §5 Tool Hand-off; §6 `ToolHost`; §7 `src/app/tool-host.ts`
- **Files:** `src/app/tool-host.ts` — `ToolHost`, `createToolHost`; `src/app/tool-host.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V30`, `V33`, `V59`:** `src/app/tool-host.test.ts` with recording doubles for screen, holdInterrupts, spawn, which.

   **Preview:**

   ```ts
   test("the hand-off runs in order and always restores the terminal", async () => {
     // flush resolves on next tick; expect calls: flush-resolved, hold, suspend, spawn(cwd), resetForeignModes, resume, release
     // result { kind: "exited", code: 0 }
   });
   test("a crashing or killed tool still restores the terminal once", async () => { /* throw → failed; signal SIGKILL → exited { signal } */ });
   test("a missing tool never suspends", async () => { /* which → null → { kind: "missing", tool }; no hold, no suspend */ });
   ```

   - Run `bun test src/app/tool-host.test.ts` and confirm failure.

2. **GREEN:** `src/app/tool-host.ts`

   **Preview:**

   ```ts
   export type ToolHost = { run(argv: string[], cwd: string): Promise<ToolResult> };
   export function createToolHost(d: ToolDeps): ToolHost { /* exactly the system design §7 shape */ }
   ```

   - `screen` is a structural type; no `@opentui` import.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   allowed: naming
   prohibited: saving buffers or refreshing here
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(app): hand the terminal to the git tool and restore it

   Task: P2-G2-T3 — Tool host
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V30`, `V33`, `V59` — `bun test src/app/tool-host.test.ts` → pass.

##### P2-G2-T4 — Runner tool case and wiring

- **Outcome:** `RunnerDeps.tool` is required; `runTool` calls `d.tool.run(argv, cwd)` and dispatches `toolExited` with the result; `main.ts` sets `deps.tool = createToolHost({ screen: shell, holdInterrupts: lifecycle.holdInterrupts, which: Bun.which, logger })` after `installLifecycle`, late-bound like `deps.exit`; `startApp` accepts a tool double; the last temporary no-op case is gone; with a stub tool that checks out new content of an open clean file, the buffer shows it without a conflict dialog and hunks are recomputed.
- **System Design:** `REQ2@R2`; `DES9`; `S12`, `S27`; `V41` (runTool part), `V58`
- **UI Design:** None
- **Canonical Shapes:** System design §5 Construction and Wiring Flow; §7 `src/app/effects.ts`, `src/app/main.ts`
- **Files:** `src/app/effects.ts` — `RunnerDeps.tool`, `runTool` case; `src/app/effects.test.ts`; `src/app/main.ts`; `test/integration/helpers.ts`; `test/integration/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V41` (runTool), `V58`:** `src/app/effects.test.ts`, `test/integration/git.test.ts`.

   **Preview:**

   ```ts
   test("running the tool dispatches its result", async () => {
     // tool double resolves { kind: "exited", code: 0 } → dispatched { type: "toolExited", result }
   });
   // integration
   test("a tool that checks out a file reloads the open buffer", async () => {
     // startApp(root, { tool: stub that runs `git checkout other -- a.md` then returns exited 0 })
     // <leader>gg → waitFor(text("a.md") === new content); overlay.kind !== "conflict"; files["a.md"].hunks recomputed
   });
   ```

   - Run both and confirm failure.

2. **GREEN:** runner, main, startApp

   **Preview:**

   ```ts
   case "runTool": void d.tool.run(e.argv, e.cwd).then((result) => d.dispatch({ type: "toolExited", result })); return;
   // main.ts after installLifecycle: deps.tool = createToolHost({ screen: shell, holdInterrupts: lifecycle.holdInterrupts, which: Bun.which, logger });
   // deps initial value: a tool that resolves { kind: "failed", reason: "not ready" } until bound
   ```

   - `src/app/tool-host.ts` receives `shell` structurally; no UI import added to `tool-host.ts`.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   allowed: none
   prohibited: leaving any no-op git effect case
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): run the git tool from the effect runner

   Task: P2-G2-T4 — Runner tool case and wiring
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V41` (runTool) — `bun test src/app/effects.test.ts` → pass.
- `V58` — `bun test test/integration/git.test.ts` → pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| App units | `bun test src/app` | `V30`, `V33`, `V41`, `V42`, `V59` pass; existing suites unchanged |
| Shell | `bun test test/ui` | `V60`, `V67` pass; existing snapshots unchanged |
| Integration | `bun test test/integration` | `V56`–`V58` pass |
| Static and unit gate | `bun run check` | biome, tsc, knip zero, unit suites, boundaries (`tool-host.ts` imports no UI package) |
| No temporary runner cases | `grep -nE "case \"(gitStatus\|gitReadIndex\|gitStage\|gitBlame\|gitWatch\|runTool)\"" src/app/effects.ts` | Each case has a real body |
| Process hygiene | `pgrep -fl "bun .*so\|git \|lazygit"` | No orphans |

#### Review and Verification Focus

- **Specification:** Hand-off order is contractual (flush → hold → suspend → spawn → reset → resume → release); no suspend for a missing tool; nothing painted while suspended; images re-issued; SIGTERM still shuts down during the tool.
- **Technical:** `finally` guarantees on every path; release idempotent; escape bytes only in `src/ui`; `deps.tool` late binding mirrors `deps.exit`; no change to existing shell paint behavior outside the guard.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ4@R3, REQ6@R2, REQ7@R2 → DES1, DES3, DES6, DES8, DES11 → S11, S21, S24–S26 → V28, V29, V38, V39` | None | `P2-G1` | `P2-G1-T1` |
| `REQ1@R2 → DES1, DES4 → S1–S3, S5, S30 → V36, V37, V62` | None | `P2-G1` | `P2-G1-T2` |
| `REQ6@R2, REQ7@R2 → DES7 → S22, S23, S25 → V54, V55` | None | `P2-G1` | `P2-G1-T3` |
| `REQ1@R2, REQ6@R2, REQ7@R2, REQ9@R1 → DES1, DES4, DES6–DES8 → S20, S26, S29 → V40, V41` | None | `P2-G1` | `P2-G1-T4` |
| `REQ6@R2, REQ9@R1 → DES4, DES6, DES7 → S22, S29 → V56, V57` | None | `P2-G1` | `P2-G1-T5` |
| `REQ2@R2 → DES9 → S13 → V42` | None | `P2-G2` | `P2-G2-T1` |
| `REQ2@R2 → DES9 → S14, S15, S31, S35 → V60, V67` | `UREQ10@R1 → UDES10@R1 → US10@R1` | `P2-G2` | `P2-G2-T2` |
| `REQ2@R2, REQ3@R1 → DES9 → S12, S14, S16, S35 → V30, V33, V59` | None | `P2-G2` | `P2-G2-T3` |
| `REQ2@R2 → DES9 → S12, S27 → V41, V58` | None | `P2-G2` | `P2-G2-T4` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.
- Outputs handed to Part 3: `Git`, `createGit`, `GitWatcher`, `watchGitDirs`; `RunnerDeps.git/watchGit/tool` wired in `main.ts` and `startApp`; `ToolHost`, `createToolHost`, `holdInterrupts`; `Shell.flush/suspend/resume/resetForeignModes` with the paint guard; `test/support/git-repo.ts`; mounted-shell observability in `test/support/ui.ts`; `test/ui/git.test.ts` (extended in Part 3).

## Planning Gaps

None
