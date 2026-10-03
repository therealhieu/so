# W261003FX70 Plan Part 2 — Runtime Index, Navigation, and UI

## Status

`Ready`

## Objective

Run the Part 1 core inside the live editor.

- **Index:** a compiled worker indexes the workspace after the first frame and restarts once on a crash. Saves, explorer operations, link edits and external changes keep the index fresh without a rescan.
- **Link-safe edits:** rename and move keep every resolved link. Closed files are written only when their spans validate, and the operation is refused while indexing.
- **Navigation:** Neovim-equivalent jumps, MRU recents and session restore, backed by a `0600` state file outside the workspace.
- **Discovery:** which-key, pickers with grep and preview, the palette and help, `[[` completion, the backlinks and outline side panel, and statusline segments, rendered to the accepted DI2 UI states.

## Coverage Summary

- **System Design:** `REQ1, REQ4, REQ5, REQ6, REQ7@R2 (log content), REQ8, REQ9 → DES1 (remaining additions), DES3 (link-at, commands), DES4, DES5, DES6, DES7 (discovery bindings), DES8, DES9 → S1, S8–S12, S14 (log content), S15–S18 → V20 (",ff" case), V21–V30, V32, V34, V36–V38, V40–V47, V56, V59 (picker-preview case)`
- **UI Design:** `None — no Work UI design. Parent RM261003ABZP-US3@R2/UV4@R2, US4@R1/UV5@R1, US1/UV1, US5/UV6 and US9/UV10 are realized through V42–V46`

## Sources

- Plan index: `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-plan-index.md`
- Plan context: `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-plan-context.md`
- System design: `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md`
- UI design: `Not applicable — no Work UI design; look and feel follows the accepted parent UI design and mockups (M1@R1, M3@R1, M4@R1, AD4) bound in the discussion context`
- System requirements: `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-requirements.md`
- UI requirements: `Not applicable — parent UREQ5@R2, UREQ6@R1, UREQ1@R2, UREQ7@R2 and UREQ11@R1 are bound through W261003FX70-REQ1@R1`

## Dependencies

- Part 1 verified (P1-G1, P1-G2). This part consumes:
  - `scanDoc`, `parseDoc` and `withAnalysis`;
  - `summarize`, the `NoteIndex` operations, `resolveLink`, `linkText`, `planRename`, `renameImpact` and `linkMentionEdit`;
  - `rankBy`;
  - `Binding`, `defaultGroups`, `keymapFor`, `Registries.bindings`/`groups` and `file.save`;
  - `createLogger` and `RunnerDeps.logger`;
  - `wrapLine` and `paintLine` with `tabWidth`, and `VimEnv.tabWidth`.

## Execution Flow

```text
P2-G1: Index worker, freshness, and link-safe edits → P2-G2: Navigation, session, discovery, and link UI
```

## Groups

Every delegated agent (implementer, verifier, remediator) reads and follows `.s1mple/S1MPLE.md` and its required references: `docs/communication.md`, `docs/project.md` and `docs/languages/typescript.md`. Delegated agents do not use the native `Explore` subagent.

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command; do not request separate permission. Commit each task after its checks and self-review pass, and before starting the next task. Commit subjects follow Conventional Commits (`feat(scope): …`). Each body carries the task ID and its exact plan title. Task commits are checkpoints, not group acceptance. Record no-change evidence instead of an empty commit.

Rules for planned code:

- Use no work-process identifiers in code, comments, identifiers, test names or log messages.
- `src/core` stays pure.
- Only `src/ui` imports `@opentui/*`.
- The worker follows the `src/workspace` rule and never writes.
- `update` stays pure and synchronous, and every new fallible effect answers with exactly one action.
- Add each `AppState`, `Action`, `Effect`, `Overlay` and `TimerId` addition in the task that handles it, with its reducer case and runner case, so every commit compiles with the exhaustive `update` switch. The final shapes equal design section 7, `src/core/state/types.ts`.
- Each group ends with `bun run check` passing in under 30 s, plus its `test:ci` suites.

### P2-G1 — Index worker, freshness, and link-safe edits

#### Goal

The index worker scans, summarizes and searches off the main thread, is compiled into the binary as a second entrypoint, and restarts once.

On the main thread:

- index state follows batches, readiness and failure;
- `so`'s own saves, explorer operations and link-edit writes update the index without a rescan;
- explorer rename and move show the link impact, are refused while indexing, and apply link edits after the file operation succeeds. Open buffers change in one undo step; closed files are written atomically only when every span still matches.

#### Coverage Summary

- **System Design:** `REQ1, REQ4, REQ5, REQ6, REQ7 → DES1, DES4, DES5, DES6, DES7 (log) → S1, S7, S8, S10, S11, S12, S14, S18 (statusline index segment, impact prompt) → V24, V25 (except the outline case), V30 (index and backlinks cases), V34, V36, V37, V38 (rename cases), V41, V45, V47, V52 (build), V56`
- **UI Design:** `None — impact prompt and index segment states are asserted by V45 and V36`

#### Scope

- Included:
  - `index-worker.ts` (scan, summarize, `text` and `mentions` search);
  - the knip entry, build, release and the repo worker check;
  - `IndexState` and the index actions;
  - `state/index.ts`, with hooks in save, disk and explorer;
  - status index and backlinks segments, and statusline painting for them;
  - `index-host.ts` (scan, batch, ready, error, notify, restart-once) and its `main` wiring after the first frame;
  - `LinkRewrite`, `PromptState.impact`/`invalid`, `link-edits.ts` (rename and move) and the explorer routing;
  - `applyBufferEdits`;
  - the `editsApplied` action and `applyEdits` runner case;
  - `PromptView` impact and invalid lines;
  - the binary e2e test and the debug-log content integration test.
- Excluded:
  - `search`/`searchResults` dispatch through the host and runner (P2-G2-T4, where the picker consumes them);
  - the mention edit flow (`startMentionEdit`, P2-G2-T6);
  - the outline case of V25 (P2-G2-T6);
  - the editor-driven `file.rename`/`file.move` commands (P2-G2-T5);
  - benches (P3-G1).
- Main files:
  - `src/workspace/index-worker.ts`
  - `src/app/{index-host,effects,main}.ts`
  - `src/core/state/{types,update,init,index,link-edits,explorer,save,disk,buffers,status}.ts`
  - `src/ui/overlays/prompt.ts`
  - `src/ui/views/statusline.ts`
  - `package.json`, `knip.json`, `.github/workflows/release.yml`
  - `test/repo.test.ts`
  - `test/integration/{index-host,rename,log}.test.ts`
  - `test/ui/file-ops.test.ts`
  - `test/e2e/binary-index.test.ts`
  - the colocated tests

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ4, REQ9 → DES4 → S9, S11, S17 → V34` | None | Worker scan honours exclusions; literal smart-case search with limit; mentions only in prose; no writes |
| `REQ4 → DES4 → S11 → V52, V56, V47` | None | Every compile lists the worker; the binary reaches index ready |
| `REQ4 → DES4 → S11 → V36` | None | One restart; second crash → unavailable while editing works |
| `REQ5 → DES5 → S12 → V25, V37` | None | Saves, FsOps, edits and external changes update the index without a rescan |
| `REQ1 → DES5, DES9 → S18 → V30 (index, backlinks)` | None | Index segment values; backlinks only for notes and not while indexing |
| `REQ6 → DES6 → S7, S8, S10 → V24, V38 (rename)` | None | Refusal while indexing; impact; edits only after the FsOp; validated closed-file writes; one summary toast |
| `REQ1 → DES6, DES9 → S18 → V45` | None | Explorer `m` shows "3 links in 2 files will be updated" before Enter |
| `REQ7 → DES7 → S14 → V41` | None | `so.log` holds no note text |

#### Cross-Work Gates

None due in this group. G2/G3 outputs produced here (NoteIndex paths and frontmatter in summaries, `Prompt`, the `write`/`applyEdits` effects and the worker) are verified in P3-G1.

#### Tasks

##### P2-G1-T1 — Index worker scan and search

- **Outcome:**
  - The worker walks the workspace with `createExclusionMatcher`, summarizes notes through `scanDoc` and `summarize`, and posts batches of up to 500 with `files`, then `ready`.
  - `search` in `text` mode is literal, smart-case and capped at `limit`. `mentions` mode returns whole-word, case-insensitive prose hits only.
  - The worker never writes.
  - It is a knip entry.
- **System Design:** `REQ4, REQ9 → DES4 → S9, S11, S17 → V34`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/workspace/index-worker.ts`; section 6, `ToWorker` / `FromWorker`; section 7, `types.ts` (`SearchHit` as a core type)
- **Files:** `src/workspace/index-worker.ts:ToWorker, FromWorker, walk, summarizeFile, searchFile`, `src/core/state/types.ts:SearchHit`, `knip.json:entry`, `src/workspace/index-worker.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V34`:** `index-worker.test.ts` with a real Bun `Worker`. The tmp workspace contains `.hidden/`, `node_modules/`, `.gitignore`, `photo.png`, `big.log` (17 MiB) and notes.

   **Preview:**

   ```ts
   test("scan lists visible files and summarizes notes only", async () => { /* no hidden/node_modules/ignored; summaries only .md */ });
   test("text search is literal and skips binary and large files", async () => { /* "TODO" hits a .ts file, never photo.png or big.log */ });
   test("search stops at the limit and reports capped", async () => { /* limit 2 → 2 hits, capped true */ });
   test("mentions ignore links, code, and frontmatter", async () => { /* only plain-prose "Plan" */ });
   test("the worker never changes the workspace", async () => { /* listing and mtimes unchanged */ });
   ```

   - Run `bun test src/workspace/index-worker.test.ts`. It must fail because the worker is missing.

2. **GREEN:** `index-worker.ts`, `SearchHit`, `knip.json`

   **Preview:**

   ```ts
   export type ToWorker =
     | { type: "scan"; root: string; ignore: string[] } | { type: "changed"; paths: string[] } | { type: "removed"; paths: string[] }
     | { type: "search"; id: number; query: string; limit: number; mode?: "text" | "mentions"; names?: string[]; exclude?: string };
   export type FromWorker =
     | { type: "batch"; summaries: NoteSummary[]; files?: string[]; done: number; total: number } | { type: "ready" }
     | { type: "results"; id: number; hits: SearchHit[]; capped?: boolean } | { type: "error"; reason: string };
   self.onmessage = (e: MessageEvent<ToWorker>) => { /* try { … } catch (x) { post({ type: "error", reason }) } */ };
   ```

   - Read through `readTextFile`, which skips binary files and files over 16 MiB.
   - Each `search` posts exactly one `results` carrying its id.
   - Add `src/workspace/index-worker.ts` to `knip.json` `entry`.

3. **REFACTOR:** keep `walk`, `summarizeFile` and `searchFile` small and internal.

   **Preview:**

   ```ts
   // Allowed: local helpers. Not allowed: any fs write API or importing src/app.
   ```

   - Keep V34, V35 and knip clean.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(index): scan, summarize, and search in an index worker

   Task: P2-G1-T1 — Index worker scan and search
   ```

**Verification:**

- `V34`: `bun test src/workspace/index-worker.test.ts` → every case passes.
- `bun --bun run knip` → zero findings.

##### P2-G1-T2 — Worker compile entrypoint

- **Outcome:** `bun run build` and both release compile loops list `src/workspace/index-worker.ts`, and a repo test enforces this for every `bun build --compile`.
- **System Design:** `REQ4 → DES4 → S11 → V52 (build), V56`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `test/boundaries.test.ts, test/repo.test.ts, knip.json, package.json, .github/workflows/release.yml`
- **Files:** `package.json:scripts.build`, `.github/workflows/release.yml` (build job), `test/repo.test.ts` ("compile includes the worker")
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V56`:**

   **Preview:**

   ```ts
   test("compile includes the worker", () => {
     // every "bun build --compile" in package.json and .github/workflows/*.yml contains src/workspace/index-worker.ts
   });
   ```

   - Run `bun test test/repo.test.ts`. It must fail.

2. **GREEN:**

   **Preview:**

   ```text
   package.json  "build": "bun build --compile src/app/main.ts src/workspace/index-worker.ts --outfile dist/so"
   release.yml   both compile loops: … src/app/main.ts src/workspace/index-worker.ts …
   ```

   - Leave `ci.yml` unchanged (pull-request only).

3. **REFACTOR:** none expected beyond test readability.

   **Preview:**

   ```ts
   // Allowed: share the YAML/JSON scan with the existing repo checks. Not allowed: changing CI triggers.
   ```

   - Keep every repo test passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   build: compile the index worker as a second entrypoint

   Task: P2-G1-T2 — Worker compile entrypoint
   ```

**Verification:**

- `V56`: `bun test test/repo.test.ts` → passes.
- `V52` (build): `bun run build` → compiles both entrypoints into `dist/so`.

##### P2-G1-T3 — Index state and freshness reducers

- **Outcome:**
  - `AppState.index` (`IndexState`) and the `indexBatch`, `indexReady` and `indexFailed` actions update status, progress and the NoteIndex.
  - `summarizeSaved`, `indexAfterFsOp` and `indexAfterFileEvent` keep the index fresh for saves, FsOps and file events.
  - `statusSegments` exposes the index and backlinks segments, and `Statusline` paints `◌ indexing n/total`, `◆ index ready`, `✗ index unavailable` and `← N backlinks`.
- **System Design:** `REQ1, REQ5 → DES1, DES5, DES9 → S1, S12, S18 → V25 (except outline), V30 (index and backlinks cases)`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `types.ts` (`IndexState`, `Action` additions), `src/core/state/index.ts`, `status.ts and statusline.ts`, `save.ts`/`disk.ts`/`explorer.ts` hooks; section 5, "Index freshness"
- **Files:**
  - `src/core/state/types.ts:IndexState, AppState.index, Action`
  - `src/core/state/init.ts:initialState`
  - `src/core/state/update.ts`
  - `src/core/state/index.ts:onIndexBatch, onIndexReady, onIndexFailed, summarizeSaved, indexAfterFsOp, indexAfterFileEvent`
  - `src/core/state/{save,disk,explorer}.ts`
  - `src/core/state/status.ts:StatusSegments, statusSegments`
  - `src/ui/views/statusline.ts:Statusline`
  - `src/core/state/index.test.ts`
  - `src/core/state/status.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V25`, `V30`:**

   **Preview:**

   ```ts
   test("a saved link reaches backlinks without the worker", () => { /* save a.md with [[b]] → backlinksOf(b.md) has a.md */ });
   test("file operations move, add, and remove index entries", () => { /* create/rename/move/trash fsResult */ });
   test("a removed file leaves the index", () => { /* fileChanged removed */ });
   test("status moves from indexing to ready to unavailable", () => { /* batches, ready, failed final */ });
   // status.test.ts
   test("backlinks show only for notes and not while indexing", () => { /* note vs scripts/sync.ts */ });
   test("index segment reflects status", () => { /* idle → none, indexing n/total, ready, unavailable */ });
   ```

   - Run the tests. They must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   // types.ts: IndexState { status, done, total, ix } (searchSeq and rewrite are added by their tasks)
   | { type: "indexBatch"; summaries: NoteSummary[]; files: string[]; done: number; total: number }
   | { type: "indexReady" } | { type: "indexFailed"; final: boolean; reason: string }
   // init.ts: index: { status: "idle", done: 0, total: 0, ix: emptyIndex() }
   // index.ts
   export function summarizeSaved(s: AppState, path: string): AppState { /* from the buffer's analysis.scan */ }
   export function indexAfterFsOp(s: AppState, op: FsOp): AppState { /* movePaths/addFiles/removePaths */ }
   ```

   - A summary in the index describes the file's content on disk.
   - `indexReady` shows the toast "index ready".

3. **REFACTOR:** keep the index hooks one call per site in save, disk and explorer.

   **Preview:**

   ```ts
   // Allowed: tiny wrappers. Not allowed: sending own changes to the worker.
   ```

   - Keep DI1 state tests passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(index): track index state and keep it fresh on the main thread

   Task: P2-G1-T3 — Index state and freshness reducers
   ```

**Verification:**

- `V25` (except outline), `V30` (index and backlinks): `bun test src/core/state/index.test.ts src/core/state/status.test.ts` → pass.

##### P2-G1-T4 — Index host with restart-once and startup wiring

- **Outcome:**
  - `createIndexHost` spawns the worker, translates `batch`/`ready`/`error` into actions, restarts once on a crash, and reports `indexFailed {final}`.
  - `notify` forwards watcher events for notes.
  - `main` constructs the host before the runner, and after the first frame it starts the host and forwards watcher events.
- **System Design:** `REQ4, REQ5 → DES4, DES5 → S11, S12 → V36, V37`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/app/index-host.ts` and `src/app/main.ts`; section 5, "Startup and indexing", "Failure and Recovery Rules" and "Construction and Wiring Flow"
- **Files:** `src/app/index-host.ts:IndexHost, createIndexHost`, `src/app/main.ts:main`, `test/integration/index-host.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V36`, `V37`:** `test/integration/index-host.test.ts` with a real host, worker, store, runner and `watchWorkspace`. A spawn wrapper injects crashes by terminating the worker.

   **Preview:**

   ```ts
   test("one crash rescans to ready", async () => { /* … */ });
   test("a second crash marks the index unavailable while editing works", async () => { /* segment "unavailable"; edit + save succeed */ });
   test("external edits and own saves reach backlinks", async () => { /* other process appends [[a]] to b.md; so saves [[a]] in c.md */ });
   ```

   - Run the tests. They must fail because the host is missing.

2. **GREEN:**

   **Preview:**

   ```ts
   export function createIndexHost(d: { dispatch: (a: Action) => void; logger: Logger; spawn?: () => Worker }): IndexHost {
     // start(root, ignore): spawn + post scan; batch → indexBatch(files ?? []); ready → indexReady
     // error message | error event | close before stop → crash: first → indexFailed{final:false} + respawn + scan; second → {final:true}, stop forwarding
     // notify(e): note paths → changed/removed
   }
   // main.ts: const indexHost = createIndexHost({ dispatch, logger }); … setImmediate(() => { watchWorkspace(…, e => { dispatch(fileChanged); indexHost.notify(e) }); indexHost.start(root, ignore) })
   ```

   - Message order is preserved per worker, with at most one restart.
   - The `search` method is added in P2-G2-T4.

3. **REFACTOR:** isolate crash accounting in one place.

   **Preview:**

   ```ts
   // Allowed: a local `crashed(reason)`. Not allowed: workspace-wide work before the first frame.
   ```

   - Keep `bun run test:ci` passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(index): host the index worker with one restart after the first frame

   Task: P2-G1-T4 — Index host with restart-once and startup wiring
   ```

**Verification:**

- `V36`, `V37`: `bun test test/integration/index-host.test.ts` → pass.

##### P2-G1-T5 — Link-safe rename and move

- **Outcome:**
  - Explorer rename and move go through `requireIndex` → `startRename` (impact prompt; Enter is disabled on an existing name) → `submitRename` → FsOp → `beginRewrite`. Open buffers are edited through `applyBufferEdits` in one undo step; closed files get one `applyEdits` each.
  - The runner validates the spans and writes through `atomicWrite` with `noteWrite`, then dispatches `editsApplied`.
  - The batch ends with one toast ("N files updated", plus skipped paths).
  - The operation is refused while indexing; with the index unavailable, the prompt warns and only the file changes.
  - `PromptView` paints the impact and invalid lines.
- **System Design:** `REQ1, REQ6 → DES1, DES6 → S7, S8, S10, S18 → V24, V38 (rename cases), V45`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `src/core/state/link-edits.ts`, `explorer.ts`, `buffers.ts` (`applyBufferEdits`), `effects.ts` (`applyEdits`), `types.ts` (`LinkRewrite`, `PromptState`, `editsApplied`, `applyEdits`), and the `src/ui/overlays/prompt.ts` row; section 5, the rename/move flow; section 6, `FileEdit`
- **Files:**
  - `src/core/state/types.ts:LinkRewrite, IndexState.rewrite, PromptState, Action, Effect`
  - `src/core/state/link-edits.ts:requireIndex, startRename, promptImpact, submitRename, beginRewrite, onEditsApplied`
  - `src/core/state/explorer.ts:startOp, promptKey, submit, onFsResult`
  - `src/core/state/buffers.ts:applyBufferEdits`
  - `src/core/state/index.ts` (the `editsApplied` text → summary)
  - `src/app/effects.ts:run`
  - `src/ui/overlays/prompt.ts:PromptView`
  - `src/core/state/link-edits.test.ts`
  - `test/integration/rename.test.ts`
  - `test/ui/file-ops.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V24`, `V38`, `V45`:**

   **Preview:**

   ```ts
   // link-edits.test.ts
   test("rename while ready shows the impact and blocks an existing name", () => { /* "31 links in 12 files" */ });
   test("rename while indexing is refused", () => { /* "index not ready — try again when indexing finishes", no prompt */ });
   test("rename with the index unavailable warns and only moves the file", () => { /* … */ });
   test("a failed file operation applies no edit", () => { /* rewrite cleared */ });
   test("edits apply after the operation and report one toast", () => { /* open dirty buffer one undo step; applyEdits per closed file; "12 files updated"; skipped listed */ });
   // test/integration/rename.test.ts
   test("closed files are rewritten atomically and stale files are skipped", async () => { /* parent rename scenarios (a),(b); modified file byte-identical */ });
   // test/ui/file-ops.test.ts
   test("explorer move shows the link impact before Enter", async () => { /* "3 links in 2 files will be updated" */ });
   ```

   - Run the tests. They must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   | { type: "editsApplied"; batch: number; path: string; ok: boolean; text?: string; stamp?: Stamp; reason?: string } // Action
   | { kind: "applyEdits"; batch: number; edit: FileEdit }                                                           // Effect
   // effects.ts
   case "applyEdits": serial(async () => { /* read; every span.expected matches? → own.noteWrite + atomicWrite; dispatch editsApplied */ });
   // explorer.ts: rename/move → startRename / submitRename; onFsResult: indexAfterFsOp, then rewrite.op match → beginRewrite or drop
   ```

   - No link edit is emitted before the FsOp succeeds.
   - `applyEdits` joins the serial file-system queue, and never writes a file whose spans changed.

3. **REFACTOR:** keep impact text formatting in one helper used by state and tests.

   **Preview:**

   ```ts
   // Allowed: `impactText({links, files})`. Not allowed: reverting already-written files.
   ```

   - Keep explorer create and trash behaviour identical to DI1, and keep `test/ui/file-ops.test.ts` refused cases passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(links): rename and move files with validated link updates

   Task: P2-G1-T5 — Link-safe rename and move
   ```

**Verification:**

- `V24`: `bun test src/core/state/link-edits.test.ts` → pass.
- `V38` (rename), `V45`: `bun test test/integration/rename.test.ts test/ui/file-ops.test.ts` → pass.

##### P2-G1-T6 — Binary index end-to-end

- **Outcome:** a compiled `dist/so`, started on a 50-note workspace in a PTY, shows `index ready` within 10 s. The test builds the binary in its own setup, so CI's `test` job needs no build step.
- **System Design:** `REQ4 → DES4 → S11 → V47`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 8, `test/e2e/binary-index.test.ts`; plan context section 7 (V47 builds in setup)
- **Files:** `test/e2e/binary-index.test.ts`, `test/e2e/pty.ts` (reuse)
- **Execution Approach:** `Direct verification — the behaviour already exists after T1–T4; this task adds the guarding e2e test, which passes on first run unless the binary drops the worker`

**Steps:**

1. `test/e2e/binary-index.test.ts`

   **Preview:**

   ```ts
   beforeAll(async () => { /* Bun.spawnSync(["bun", "run", "build"]) must exit 0; generate 50 notes in tmp */ });
   test("the compiled binary reaches index ready", async () => {
     // spawn dist/so <ws> through pty.ts; wait up to 10 s for "index ready" in the statusline
   });
   ```

   - Clean up tmp directories. The test runs in `test:ci` on `ubuntu-24.04` and `macos-15`.

2. **VERIFY — `V47`:**

   **Preview:**

   ```text
   bun test test/e2e/binary-index.test.ts
   └── Expect: pass; temporarily dropping the worker from scripts.build makes it fail (manual check, then restore)
   ```

   - Run the test and confirm both the pass and the negative check.

3. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   test(e2e): compiled binary reaches index ready

   Task: P2-G1-T6 — Binary index end-to-end
   ```

**Verification:**

- `V47`: `bun test test/e2e/binary-index.test.ts` → "index ready" within 10 s.

##### P2-G1-T7 — Debug log without note text

- **Outcome:** with `SO_LOG=debug`, a run with the worker, a rename and a config error writes `so.log` that contains no line of any note's text.
- **System Design:** `REQ7 → DES7 → S14 → V41`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/workspace/log.ts`; section 8, `test/integration/log.test.ts` (the file is missing from section 4 and is added per plan context section 7)
- **Files:** `test/integration/log.test.ts`, logging call sites in `src/app/{main,effects,index-host}.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V41`:**

   **Preview:**

   ```ts
   test("the debug log never contains note text", async () => {
     // tmp XDG dirs; notes contain a unique sentinel line; main-equivalent wiring with SO_LOG=debug;
     // index to ready, rename a note, load an invalid config; expect so.log exists and no note line appears in it
   });
   ```

   - Run it. It fails if `so.log` is missing (startup, index and rename events are not logged yet) or contains note text.

2. **GREEN:** add `logger.debug`/`info`/`error` events (startup, index status, effect failures, rename counts) with paths and counts only.

   **Preview:**

   ```ts
   logger.info("index.ready", { files: n });
   logger.error("effect.failed", { kind: e.kind, path, reason });
   ```

   - Never pass buffer text, summaries or search hit text to the logger.

3. **REFACTOR:** keep event names consistent (`area.event`).

   **Preview:**

   ```ts
   // Allowed: rename events. Not allowed: logging hit `text` fields.
   ```

   - Keep V33 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(log): log startup, index, and edit events without note text

   Task: P2-G1-T7 — Debug log without note text
   ```

**Verification:**

- `V41`: `bun test test/integration/log.test.ts` → pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Passes in < 30 s; knip clean with the worker entry |
| Units | `bun test src/workspace src/core/state` | V24, V25 (except outline), V30 (index and backlinks), V34 pass |
| Integration, component, e2e | `bun test test/integration test/ui test/e2e` | V36–V38 (rename), V41, V45, V47 and the DI1 suites pass |
| Build | `bun run build` | Compiles main and worker (V52 build part) |
| Repo checks | `bun test test/repo.test.ts` | V56 passes |

#### Review and Verification Focus

- **Specification:**
  - S8, S10, S11, S12 and S14 hold, and S7 holds through the effect pipeline.
  - The worker never writes.
  - The refusal and warning texts are exact.
  - One toast is shown per batch.
  - Protocol additions are optional fields only.
- **Technical:**
  - Ordering: FsOp, then edits, then `editsApplied`.
  - `applyEdits` uses the serial queue, `OwnOps` echo suppression and `atomicWrite`.
  - The restart count is bounded.
  - No workspace-wide work happens before the first frame.
  - Integration tests use isolated tmp directories and clean up.
  - The exhaustive switch is intact.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P2-G2 — Navigation, session, discovery, and link UI

#### Goal

Navigation:

- jump motions and cross-file navigation record Neovim-equivalent jumps (`<C-o>`/`<C-i>`, `jump i/n`);
- recents are MRU;
- the session restores on folder start from a `0600` state file outside the workspace, and is saved on every shutdown path.

Discovery:

- which-key appears after 300 ms;
- the pickers (files, recent, grep, headings, tags, backlinks, commands, help) rank with `rankBy`, debounce grep and cap it at 1,000, and preview at ≥ 100 columns;
- link commands and `[[` completion work only in notes;
- the backlinks and outline side panel links mentions;
- the accepted DI2 UI states render at 80×24, under NO_COLOR and in the light theme.

#### Coverage Summary

- **System Design:** `REQ1, REQ7, REQ8, REQ9 → DES1, DES3 (link-at, commands), DES7 (discovery bindings, groups), DES8, DES9 → S1, S9 (panel), S15, S16, S17, S18 → V20 (",ff"), V21, V22 (except `:w`), V23, V25 (outline), V26, V27, V28, V29, V30 (jump), V32, V38 (mention cases), V40, V42, V43, V44, V46, V59 (picker preview)`
- **UI Design:** `None — parent UV4@R2, UV5@R1 and the panel, indexing, theme and 80×24 states are asserted by V42–V44 and V46`

#### Scope

- Included:
  - **Jumps and recents:** `jumped` VimEffect and `JUMP_MOTIONS`; `jumps.ts` and `recent.ts`; jump builtins and bindings; recorded vim cases.
  - **Session:** `session.ts`, `state-file.ts`, the `stateLoaded` action, the `saveState` effect and timer, the `sessionChanged` debounce in `update`, `windows.restore`, and the `lifecycle` save.
  - **Which-key:** `whichkey.ts`, `WhichKeyView`, the `whichKey` timer and DI2 `defaultGroups`.
  - **Pickers:** `picker.ts`, with the `picker`/`palette`/`help` overlays, `search`/`searchResults`, `readPreview`/`previewLoaded` and the `search` timer; host `search` and the runner `search` case; discovery builtins and DI2 `defaultBindings`; `PickerView` and `paintPreview`.
  - **Link UI:** `link-at.ts`, `links/commands.ts` and `completion.ts`, with `CompletionView`.
  - **Side panel:** `side-panel.ts` with `startMentionEdit`, `SidePanelView` and `window-tree.ts` narrowing.
  - **Statusline:** the jump segment.
  - **Acceptance suites:** UI fixtures, and the discovery, links, shell-golden and theme-golden suites.
- Excluded: benches, final docs and delivery (P3-G1); DI3/DI4 features (link styling, embeds, live and reading views, daily notes, templates).
- Main files:
  - `src/core/kernel/vim/{types,engine}.ts`
  - `src/core/kernel/commands/defaults.ts`
  - `src/core/state/{types,update,init,keys,commands,buffers,jumps,recent,session,whichkey,picker,completion,side-panel,status,link-edits}.ts`
  - `src/core/features/links/{link-at,commands}.ts`
  - `src/workspace/state-file.ts`
  - `src/app/{main,effects,index-host,lifecycle}.ts`
  - `src/ui/overlays/{whichkey,picker,completion}.ts`
  - `src/ui/views/{side-panel,statusline,window-tree}.ts`
  - `src/ui/{shell,theme}.ts`
  - `src/ui/editors/text-view.ts:paintPreview`
  - `test/vim/{cases.ts,expected.json}`
  - `test/support/{state,ui}.ts`
  - `test/fixtures/workspace/notes/*`
  - `test/ui/{discovery,links,shell.golden,theme.golden,editor-options}.test.ts`
  - `test/integration/{session,rename}.test.ts`
  - the colocated tests

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ8 → DES8 → S16 → V26, V27` | None | Jump list limits, Neovim parity for recorded motions, MRU recents |
| `REQ8 → DES8 → S16 → V28, V32, V40` | None | Snapshot without text, restore on folder start only, debounce, `0600` state outside the workspace, corrupt → empty |
| `REQ1 → DES9 → S15 → V21` | None | Which-key only after 300 ms; direct actions before groups; `<BS>`; unmapped notice |
| `REQ9 → DES9 → S17 → V29, V59 (preview)` | None | One search per settled query; stale ids dropped; `1000+`; preview only at ≥ 100 cols; preview wraps |
| `REQ7 → DES7 → S13 → V20 (",ff")` | None | Leader `,` maps `,ff` to `file.find` |
| `REQ1 → DES3, DES7, DES9 → S15 → V22 (except `:w`)` | None | Note keys only in Markdown scope; `:link.follow` notice in `sync.ts`; overrides per scope |
| `REQ1 → DES3, DES9 → S18 → V23` | None | Follow with heading, create prompt, completion insertion in one undo block |
| `REQ5, REQ6 → DES5, DES6, DES9 → S9, S12, S18 → V25 (outline), V38 (mentions)` | None | Outline updates before save; mention linked in an open dirty buffer and a closed file |
| `REQ1 → DES8, DES9 → S16, S18 → V30 (jump)` | None | `jump 2/2` segment |
| `REQ1 → DES9 → S15, S17, S18 → V42, V43, V44, V46` | Parent UV4@R2, UV5@R1, M1/M3/M4 states | All UI verification assertions and goldens hold |

#### Cross-Work Gates

None due in this group. G2/G3 outputs produced here (Markdown key scope, statusline segment framework, `Picker` with preview, `search` effect) are verified in P3-G1.

#### Tasks

##### P2-G2-T1 — Jump list and recents

- **Outcome:**
  - Jump motions (`G gg n N * # % { }` and search commit) emit `jumped`, and `applyVimEffects` pushes a jump.
  - `editFile`, picker accept and link follow push before `openPath`.
  - `jump.back`/`jump.forward`/`jump.list` work with `<C-o>`, `<C-i>` and `<Tab>`.
  - Recents are MRU, deduplicated and capped at 100, and `touchRecent` runs on load.
  - Neovim 0.11 recordings match.
- **System Design:** `REQ8 → DES1, DES8 → S1, S16 → V26, V27`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `vim/types.ts and engine.ts` (`VimEffect.jumped`, `JUMP_MOTIONS`), `jumps.ts and recent.ts`, `commands.ts` (`jump.*`, `EX_ALIASES.jumps`, `editFile`), `keys.ts` (`applyVimEffects`), `defaults.ts` (jump bindings) and `types.ts` (`JumpList`, `AppState.jumps`/`recent`); section 5, "Jump navigation"
- **Files:**
  - `src/core/kernel/vim/{types,engine}.ts`
  - `src/core/state/{types,init,jumps,recent,keys,commands,buffers}.ts`
  - `src/core/kernel/commands/defaults.ts`
  - `src/core/state/jumps.test.ts`
  - `test/vim/cases.ts`
  - `test/vim/expected.json`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V26`, `V27`:**

   **Preview:**

   ```ts
   // jumps.test.ts
   test("the jump list keeps 100 entries and replaces same-line jumps", () => { /* 105 pushes; same line; push from middle truncates; back at end records current; "jump i/n" */ });
   test("recents are most-recent-first, unique, and capped", () => { /* duplicates; 101 paths → 100 */ });
   // test/vim/cases.ts
   { id: "jump-G-back", before: at(PROSE, 0, 0), keys: "G<C-o>" }, /* gg<C-o><C-i>, /two<CR><C-o>, nN<C-o><C-o>, }<C-o>, dG<C-o> */
   ```

   - Record the expectations with Neovim 0.11.x. The local `nvim` is 0.12.4, so download an official 0.11.x release into a temp directory outside the repository and run `NVIM=<path>/bin/nvim bun run record:vim`. Only the new cases may change in `expected.json`.
   - Run `bun test src/core/state/jumps.test.ts test/vim`. It must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   | { kind: "jumped"; from: Pos }                                   // VimEffect
   export const JUMP_MOTIONS = new Set(["G", "gg", "n", "N", "*", "#", "%", "{", "}"]);
   export function pushJump(j: JumpList, e: JumpEntry): JumpList { /* limit 100, same-line replace, truncate forward */ }
   export function jumpBack(s: AppState): Result { /* records current at end; openPath when path differs */ }
   export function touchRecent(recent: readonly string[], path: string): string[] { /* MRU, dedupe, 100 */ }
   // defaults.ts: <C-o> jump.back, <C-i>/<Tab> jump.forward; commands.ts: jump.back/forward/list, alias jumps → jump.list
   ```

   - Existing recorded vim cases stay unchanged; the effect is ignored by the text, cursor and register comparisons.

3. **REFACTOR:** keep the jump-list invariants in `jumps.ts` only.

   **Preview:**

   ```ts
   // Allowed: small helpers. Not allowed: storing note text in entries.
   ```

   - Keep `test/vim` and V58 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(nav): record jumps and recent files

   Task: P2-G2-T1 — Jump list and recents
   ```

**Verification:**

- `V26`: `bun test src/core/state/jumps.test.ts` → pass.
- `V27`: `bun test test/vim` → the new cases equal the Neovim 0.11 recordings, and old cases are unchanged.

##### P2-G2-T2 — Session persistence and restore

- **Outcome:**
  - The `stateLoaded` action restores recents and jumps, and on folder start it also restores the windows: one `read` per path, filled on `fileLoaded`, with a toast for missing files.
  - `sessionChanged` appends `startTimer saveState 2000` for persisted-state changes only.
  - The runner `saveState` case writes the `0600` state file and logs failures without a toast.
  - `main` loads state before the first frame.
  - The lifecycle saves on every shutdown path within the flush bound.
- **System Design:** `REQ8 → DES1, DES8 → S1, S16 → V28, V32, V40`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `session.ts and state-file.ts`, `lifecycle.ts`, `update.ts` (`sessionChanged` wrapper, `onTimerAction`), `types.ts` (`PersistedState`, `windows.restore`, `stateLoaded`, `saveState`, `TimerId "saveState"`), `buffers.ts` (`onFileLoaded` restore) and `main.ts`; section 6, `PersistedState`; section 5, "Session save and restore"
- **Files:**
  - `src/core/state/{types,update,session,buffers}.ts`
  - `src/workspace/state-file.ts:statePath, readStateFile, saveStateFile, saveStateFileSync`
  - `src/app/{effects,lifecycle,main}.ts`
  - `src/core/state/session.test.ts`
  - `src/workspace/state-file.test.ts`
  - `test/integration/session.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V28`, `V32`, `V40`:**

   **Preview:**

   ```ts
   test("the snapshot holds layout and positions but no text", () => { /* … */ });
   test("restore fills windows on load and reports missing files once", () => { /* "1 files from the last session were not found" */ });
   test("unknown versions and garbage load as empty", () => { /* version 2, bad JSON → undefined */ });
   test("opening a file schedules a save but a cursor move does not", () => { /* startTimer saveState 2000 */ });
   // state-file.test.ts
   test("the state file lives outside the workspace with mode 0600", () => { /* <state>/so/<16 hex>/state.json */ });
   // test/integration/session.test.ts
   test("a folder start restores the last session and a file start does not", async () => { /* run 1–3 */ });
   ```

   - Run the tests. They must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   | { type: "stateLoaded"; state: PersistedState | undefined; restore: boolean }   // Action
   | { kind: "saveState"; state: PersistedState }                                 // Effect (no answer action)
   // update.ts: wrap step(); sessionChanged(prev, next) → append { kind: "startTimer", id: "saveState", ms: 2000 }
   // onTimerAction: "saveState" → [{ kind: "saveState", state: snapshotSession(s) }]
   export function statePath(env: NodeJS.ProcessEnv, home: string, realRoot: string): string { /* sha256 → 16 hex */ }
   // lifecycle.ts: try { saveSession(store.get()) } catch (e) { logger.error(…) } before shell.destroy()
   ```

   - The terminal restore still happens if the save throws, and no note text is persisted.

3. **REFACTOR:** share the XDG state-directory rule with `log.ts`.

   **Preview:**

   ```ts
   // Allowed: reuse the helper from P1-G2-T4. Not allowed: writing inside the workspace.
   ```

   - Keep the DI1 `test/e2e/restore.test.ts` and `quit.test.ts` passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(session): persist and restore the session outside the workspace

   Task: P2-G2-T2 — Session persistence and restore
   ```

**Verification:**

- `V28`, `V32`: `bun test src/core/state/session.test.ts src/workspace/state-file.test.ts` → pass.
- `V40`: `bun test test/integration/session.test.ts` → pass.

##### P2-G2-T3 — Which-key

- **Outcome:**
  - A pending prefix arms a 300 ms `whichKey` timer, and the overlay opens only if the prefix is still pending. Rows list direct actions before `+groups`.
  - `<BS>` pops a key, `<Esc>` closes the overlay, and an unmapped key shows "no mapping for …".
  - DI2 groups are registered.
- **System Design:** `REQ1 → DES1, DES7, DES9 → S15 → V21`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `src/core/state/whichkey.ts`, `keys.ts` (`prefix` → `armWhichKey`), `defaults.ts` (`defaultGroups`), `types.ts` (`WhichKeyState`, `Overlay.whichKey`, `TimerId "whichKey"`), and the `src/ui/overlays/whichkey.ts` row
- **Files:** `src/core/state/{types,update,keys,whichkey}.ts`, `src/core/kernel/commands/defaults.ts:defaultGroups`, `src/ui/overlays/whichkey.ts:WhichKeyView`, `src/ui/shell.ts`, `src/core/state/whichkey.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V21`:**

   **Preview:**

   ```ts
   test("which-key opens only after the prefix idles 300 ms", () => { /* Space, timer → overlay; Space f before timer → no overlay */ });
   test("direct actions list before groups and backspace pops a key", () => { /* … */ });
   test("an unmapped key closes with a notice", () => { /* "no mapping for <leader>q" */ });
   ```

   - Run the tests. They must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   export const WHICH_KEY_MS = 300;
   export function armWhichKey(s: AppState, prefix: Key[], scope: KeyScope): Result { /* startTimer whichKey 300 */ }
   export function whichKeyRows(reg: Registries, s: AppState): { key: string; label: string; group: boolean }[] { /* … */ }
   // defaultGroups: { "<leader>f": "find", "<leader>s": "search", "<leader>b": "buffer", "<leader>w": "window", "<leader>u": "ui" }
   ```

   - Register `WhichKeyView` in `OverlayHost`.

3. **REFACTOR:** derive rows only from `keymapFor` and `Registries.groups`.

   **Preview:**

   ```ts
   // Allowed: sort helper. Not allowed: a second binding list.
   ```

   - Keep key routing tests passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(discovery): show which-key after an idle prefix

   Task: P2-G2-T3 — Which-key
   ```

**Verification:**

- `V21`: `bun test src/core/state/whichkey.test.ts` → pass.

##### P2-G2-T4 — Pickers, grep, and preview

- **Outcome:**
  - `pickerSources` (files, recent, grep, headings, tags, tagNotes, backlinks, commands, help) open as `picker`, `palette` or `help` overlays, rank with `rankBy`, and accept through `openPath` with a jump push.
  - Grep is debounced 100 ms with a fresh `searchSeq` id and capped at 1,000 (`1000+`). Stale ids are dropped, and an unavailable index shows the error row.
  - Preview reads at ≥ 100 columns through `readPreview`/`previewLoaded`.
  - The host `search` method and runner case answer `searchResults`.
  - Discovery builtins and DI2 `defaultBindings` are registered.
  - `PickerView` paints rows, and `paintPreview` reuses the editor layout with wrap.
- **System Design:** `REQ1, REQ7, REQ9 → DES1, DES4, DES7, DES9 → S1, S13, S15, S17 → V20 (",ff"), V29, V59 (preview)`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7:
  - `src/core/state/picker.ts`
  - `types.ts` (`PickerState`, `PickerItem`, `IndexState.searchSeq`, `searchResults`, `previewLoaded`, `search`, `readPreview`, `TimerId "search"`)
  - `index-host.ts` (`search`)
  - `effects.ts` (`search`, `readPreview`)
  - `commands.ts` (`file.find`, `file.recent`, `search.grep`, `command.palette`, `help.keymap`, alias `help`)
  - `defaults.ts` (DI2 bindings)
  - `text-view.ts` (`paintPreview`)
  - the `src/ui/overlays/picker.ts` row

  Section 6, `PickerState` / `PickerSource`.
- **Files:**
  - `src/core/state/{types,update,init,picker,commands,keys}.ts`
  - `src/core/kernel/commands/defaults.ts:defaultBindings`
  - `src/app/{index-host,effects}.ts`
  - `src/ui/overlays/picker.ts:PickerView`
  - `src/ui/editors/text-view.ts:paintPreview`
  - `src/ui/shell.ts`
  - `src/core/state/picker.test.ts`
  - `src/core/state/config.test.ts` (",ff" case)
  - `test/ui/editor-options.test.ts` (preview case)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V29`, `V20` (",ff"), `V59` (preview):**

   **Preview:**

   ```ts
   test("grep searches once per settled query with the newest id", () => { /* "a","ab" then timers */ });
   test("results for an old search are dropped and large results are capped", () => { /* "1000+" */ });
   test("an empty query searches nothing", () => { /* … */ });
   test("preview loads only at 100 columns or wider", () => { /* cols 99 vs 120 */ });
   test("recent hides removed files", () => { /* … */ });
   // config.test.ts
   test("leader comma maps ,ff to find files", () => { /* keymapFor lookup → "file.find" */ });
   // editor-options.test.ts
   test("a picker preview wraps the long paragraph", async () => { /* at 120 cols */ });
   ```

   - Run the tests. They must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   export const GREP_LIMIT = 1000, SEARCH_DEBOUNCE_MS = 100, PREVIEW_MIN_COLS = 100;
   export type PickerSource = { id: string; title: string; items(s: AppState, reg: Registries, arg?: string): PickerItem[]; accept(...): Result /* … per design */ };
   export const pickerSources: Readonly<Record<string, PickerSource>> = { /* files, recent, grep, headings, tags, tagNotes, backlinks, commands, help */ };
   // index-host.ts: search(e) → post search; results → searchResults(capped ?? false); unavailable → immediate empty results
   // effects.ts: case "search": deps.index.search(e); case "readPreview": readTextFile → previewLoaded
   export function paintPreview(/* TextFile | TextBuffer, line, rect, options */): void { /* source view centred on line, match mark */ }
   ```

   - The `commands` and `help` sources list only commands available for the active file type.
   - Ranking uses `rankBy` only.

3. **REFACTOR:** keep source definitions declarative in one record.

   **Preview:**

   ```ts
   // Allowed: shared item builders. Not allowed: UI-side filtering or ranking.
   ```

   - Keep V16 and V22 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(discovery): pickers with ranked sources, grep, and preview

   Task: P2-G2-T4 — Pickers, grep, and preview
   ```

**Verification:**

- `V29`, `V20`: `bun test src/core/state/picker.test.ts src/core/state/config.test.ts` → pass.
- `V59` (preview): `bun test test/ui/editor-options.test.ts` → pass.

##### P2-G2-T5 — Link commands and completion

- **Outcome:**
  - `linkAt` finds the link under the cursor outside code, math and comments.
  - `linkCommands` (follow, backlinks, linkMention, outline, headings, backlinks picker, tags, rename, move) carry `filetypes: ["markdown"]` where the design says so. `linkBindings` use the Markdown scope, and `linkGroups` adds `+links`.
  - Follow pushes a jump, positions at a heading, or offers "Create <path>? [y/N]".
  - `[[` completion offers notes, then headings or blocks, and Enter inserts in one undo block.
  - `main` registers the link commands, bindings and groups.
- **System Design:** `REQ1, REQ6 → DES1, DES3, DES9 → S15, S18 → V22 (except `:w`), V23`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `src/core/features/links/link-at.ts`, `src/core/features/links/commands.ts`, `src/core/state/completion.ts`, `types.ts` (`CompletionState`, `Overlay.completion`), `keys.ts` (`maybeOpenCompletion`), the `src/ui/overlays/completion.ts` row and `main.ts` (`registries`)
- **Files:** `src/core/features/links/{link-at,commands}.ts`, `src/core/state/{types,completion,keys,link-edits}.ts`, `src/ui/overlays/completion.ts:CompletionView`, `src/app/main.ts:registries`, `test/support/state.ts:testRegistries`, `src/core/state/links.test.ts`, `src/core/state/keys.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V22`, `V23`:**

   **Preview:**

   ```ts
   // keys.test.ts
   test("note keys work in notes and do nothing in code files", () => { /* gd on [[plan]] vs sync.ts identifier */ });
   test("note commands show the file-type notice elsewhere", () => { /* ":link.follow" in sync.ts → "not available for typescript files" */ });
   test("palette and : completion hide note commands outside notes", () => { /* … */ });
   test("leader overrides apply per scope", () => { /* <leader>w → link.backlinks in note, file.save in sync.ts */ });
   test("every note binding is scoped to markdown", () => { /* linkBindings */ });
   // links.test.ts
   test("follow opens the heading and records a jump", () => { /* [[plan#Goals]] */ });
   test("following a missing note offers to create it", () => { /* "Create projects/plan.md? [y/N]" */ });
   test("completion moves from notes to headings and inserts once", () => { /* "[[pl", "#", Enter → "plan#Goals]]" one undo block */ });
   ```

   - Run the tests. They must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   export function linkAt(scan: DocScan, at: Pos): LinkSpan | undefined { /* … */ }
   export const linkCommands: readonly AppCommand[] = [/* per design section 7 */];
   export const linkBindings: readonly Binding[] = [/* gd, <CR>, <leader>lb, <leader>lr, <leader>o, <leader>sh, <leader>sb — markdown scope */];
   export const linkGroups = { "<leader>l": "links" } as const;
   export function maybeOpenCompletion(s: AppState, reg: Registries): AppState { /* Insert after "[[" */ }
   // main.ts registries: commands.register(...linkCommands); bindings [...defaultBindings, ...linkBindings]; groups {...defaultGroups, ...linkGroups}
   ```

   - The completion popup closes when the cursor leaves the `[[…` span or Insert mode ends.

3. **REFACTOR:** keep `testRegistries` identical to `main.registries`.

   **Preview:**

   ```ts
   // Allowed: a shared `buildRegistries()` if both diverge. Not allowed: note commands in defaults.ts.
   ```

   - Keep V21 and V29 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(links): follow links, link commands, and [[ completion

   Task: P2-G2-T5 — Link commands and completion
   ```

**Verification:**

- `V22`, `V23`: `bun test src/core/state/keys.test.ts src/core/state/links.test.ts` → pass.

##### P2-G2-T6 — Side panel, mentions, and jump segment

- **Outcome:**
  - The backlinks and outline panel toggles, takes focus and is docked at ≥ 100 columns (`WindowTree` narrows the editor area); below that it falls back to the narrow layout.
  - Linked rows come before Unlinked rows. Unlinked rows come from a `mentions` search.
  - `l` runs `startMentionEdit`: an open buffer is edited in memory (a stale mention shows "mention changed — not linked"), and a closed file goes through `applyEdits`. The mention then moves to Linked.
  - The outline updates before saving.
  - The statusline shows `jump i/n`.
- **System Design:** `REQ1, REQ5, REQ6, REQ8 → DES5, DES6, DES8, DES9 → S9, S12, S16, S18 → V25 (outline), V30 (jump), V38 (mention cases)`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `src/core/state/side-panel.ts`, `link-edits.ts` (`startMentionEdit`), `types.ts` (`SidePanelState`, `panels.side`), `status.ts and statusline.ts` (`jump`), and the `src/ui/views/side-panel.ts` and `window-tree.ts` rows; section 5, "Link a mention"
- **Files:**
  - `src/core/state/{types,init,side-panel,link-edits,status,keys}.ts`
  - `src/ui/views/{side-panel,statusline,window-tree}.ts`
  - `src/ui/shell.ts`
  - `src/core/state/index.test.ts` (outline case)
  - `src/core/state/status.test.ts` (jump case)
  - `src/core/state/side-panel.test.ts`
  - `test/integration/rename.test.ts` (mention cases)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V25` (outline), `V30` (jump), `V38` (mentions):**

   **Preview:**

   ```ts
   test("the outline shows a new heading before saving", () => { /* add "## New" → sidePanelRows includes "New" */ });
   test("the statusline shows the jump position", () => { /* after a jump → "2/2" */ });
   test("linking a mention edits an open dirty buffer in memory and a closed file atomically", async () => { /* moves to Linked */ });
   ```

   - Run the tests. They must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   export function toggleSidePanel(c: CommandContext, kind: "backlinks" | "outline"): CommandResult { /* open/focus; requestMentions */ }
   export function sidePanelRows(s: AppState, reg: Registries): Row[] { /* Linked before Unlinked; outline from analysis.scan.headings */ }
   export function startMentionEdit(s: AppState, hit: SearchHit): Result { /* linkMentionEdit → applyBufferEdits | applyEdits */ }
   // status.ts: jump?: string via jumpSegment; WindowTree reserves the panel column when open and cols ≥ 100
   ```

   - Unlinked rows never include links, code, math, comments or frontmatter.

3. **REFACTOR:** share the `editsApplied` aggregation with rename.

   **Preview:**

   ```ts
   // Allowed: reuse onEditsApplied. Not allowed: a second toast path.
   ```

   - Keep V24 and V38 (rename) passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(links): backlinks and outline panel with mention linking

   Task: P2-G2-T6 — Side panel, mentions, and jump segment
   ```

**Verification:**

- `V25`, `V30`: `bun test src/core/state` → pass.
- `V38` (mentions): `bun test test/integration/rename.test.ts` → pass.

##### P2-G2-T7 — DI2 UI acceptance suites

- **Outcome:** the component suites prove every accepted DI2 UI state:
  - parent UV4@R2 discovery, including the preview at 120 columns versus 99 and `●`-marked overrides;
  - parent UV5@R1 links: completion placement, follow, jump `2/2 → 1/2`, create prompt, Linked/Unlinked, impact and "12 files updated";
  - the indexing, index-ready and panel goldens, and the `sync.ts` statusline;
  - the picker under NO_COLOR, in the light theme and at 80×24.
- **System Design:** `REQ1, REQ9 → DES9 → S15, S17, S18 → V42, V43, V44, V46`
- **UI Design:** `None — parent UV4@R2 and UV5@R1 assertions and M1/M3/M4 states are realized here`
- **Canonical Shapes:** System design section 8, the `test/ui/{discovery,links,shell.golden,theme.golden}.test.ts` entries; section 4, `test/fixtures/workspace/notes/*` and `test/support/ui.ts` (`mountShell` with index status and config). `test/ui/theme.golden.test.ts` is missing from section 4 and is added per plan context section 7.
- **Files:** `test/fixtures/workspace/notes/{plan,…}.md` (31 links in 12 files), `test/support/ui.ts:mountShell`, `test/ui/discovery.test.ts`, `test/ui/links.test.ts`, `test/ui/shell.golden.test.ts` and `__snapshots__`, `test/ui/theme.golden.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V42`, `V43`, `V44`, `V46`:** write one test per parent UV4@R2/UV5@R1 action and assertion. Name tests by behaviour, without parent IDs.

   **Preview:**

   ```ts
   // discovery.test.ts
   test("which-key, palette, and help show scoped commands with marked overrides", async () => { /* … */ });
   test("grep previews the hit at 120 columns and not at 99", async () => { /* … */ });
   // links.test.ts
   test("completion never covers the cursor row and inserts the heading link", async () => { /* … */ });
   test("rename shows impact before Enter and the update count after", async () => { /* "12 files updated" */ });
   // shell.golden.test.ts
   test("indexing progress, ready toast, panels, and code-file statusline", async () => { /* "MODE │ source │ scripts/sync.ts │ index │ Ln:Col" */ });
   // theme.golden.test.ts
   test("picker selection stays visible without colour and in the light theme", async () => { /* ▸ + reverse; no SGR colour; 80×24 unclipped */ });
   ```

   - Run `bun test test/ui`. Fix only behaviour gaps the suites reveal, inside P2-G2 scope; parent UI states are the reference.

2. **GREEN:** extend `mountShell` with index status and config injection, add the fixtures, and record the goldens after a visual review against the parent mockups M1@R1, M3@R1 and M4@R1.

   **Preview:**

   ```ts
   export async function mountShell(o: { cols?: number; rows?: number; index?: Partial<IndexState>; config?: string }): Promise<Mounted> { /* … */ }
   ```

   - The harness answers effects with fixture index batches and search results.

3. **REFACTOR:** remove any duplicated fixture setup across the suites.

   **Preview:**

   ```ts
   // Allowed: shared fixture helpers in test/support. Not allowed: re-testing unit-proven rules.
   ```

   - Keep every UI suite passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   test(ui): cover discovery, links, panels, and theme states

   Task: P2-G2-T7 — DI2 UI acceptance suites
   ```

**Verification:**

- `V42`–`V44`, `V46`: `bun test test/ui` → all assertions and goldens pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Passes in < 30 s; knip clean |
| Units and vim | `bun test src test/vim` | V20–V23, V25, V26–V30, V32 pass; recorded vim cases match |
| Integration and component | `bun run test:ci` | V38, V40, V42–V44, V46, V59 and every DI1 suite pass |
| Build | `bun run build`; `bun test test/e2e/binary-index.test.ts` | Binary still reaches index ready |

#### Review and Verification Focus

- **Specification:**
  - S15–S18 hold, and S16 matches Neovim exactly.
  - Restore runs on folder start only.
  - The state file is outside the workspace with `0600`.
  - Which-key waits 300 ms.
  - Grep is debounced 100 ms, capped at 1,000 and literal smart-case.
  - Preview appears only at ≥ 100 columns.
  - Note keys work only in notes.
  - UI states match the parent mockups at 80×24, under NO_COLOR and in the light theme.
- **Technical:**
  - Exactly one router handles each key.
  - The picker ranks only through `rankBy`.
  - Stale search ids are dropped.
  - The session debounce lives in one place.
  - The lifecycle restores the terminal even if the save fails.
  - Component tests do not duplicate unit-proven rules.
  - No DI3/DI4 fields or features appear.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ4, REQ9 → DES4 → S9, S11, S17 → V34` | None | `P2-G1` | `P2-G1-T1` |
| `REQ4 → DES4 → S11 → V52 (build), V56, V47` | None | `P2-G1` | `P2-G1-T2`, `P2-G1-T6` |
| `REQ4, REQ5 → DES4, DES5 → S11, S12 → V25, V36, V37` | None | `P2-G1`, `P2-G2` | `P2-G1-T3`, `P2-G1-T4`, `P2-G2-T6` |
| `REQ1 → DES9 → S18 → V30` | None | `P2-G1`, `P2-G2` | `P2-G1-T3`, `P2-G2-T6` |
| `REQ6 → DES6 → S7, S8, S10 → V24, V38` | None | `P2-G1`, `P2-G2` | `P2-G1-T5`, `P2-G2-T6` |
| `REQ1 → DES6, DES9 → S18 → V45` | None | `P2-G1` | `P2-G1-T5` |
| `REQ7 → DES7 → S14 → V41` | None | `P2-G1` | `P2-G1-T7` |
| `REQ8 → DES8 → S16 → V26, V27, V28, V32, V40` | None | `P2-G2` | `P2-G2-T1`, `P2-G2-T2` |
| `REQ1 → DES9 → S15 → V21, V22 (except `:w`)` | None | `P2-G2` | `P2-G2-T3`, `P2-G2-T5` |
| `REQ7 → DES7 → S13 → V20 (",ff")` | None | `P2-G2` | `P2-G2-T4` |
| `REQ9 → DES9 → S17 → V29, V59 (preview)` | None | `P2-G2` | `P2-G2-T4` |
| `REQ1 → DES3, DES9 → S18 → V23` | None | `P2-G2` | `P2-G2-T5` |
| `REQ6 → DES3, DES6 → S9 → V38 (mentions)` | None | `P2-G2` | `P2-G2-T6` |
| `REQ1 → DES9 → S15, S17, S18 → V42, V43, V44, V46` | Parent UV4@R2, UV5@R1, M1/M3/M4 | `P2-G2` | `P2-G2-T7` |
| `REQ1 → DES1 → S1 → V52 (type check)` | None | `P2-G1`, `P2-G2` | every task (exhaustive switch compiles) |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- No cross-work gate is due in this part. The G2/G3 outputs produced here are handed to P3-G1 for evidence: the Markdown key scope, the statusline segment framework, `Picker` with preview, `Prompt`, NoteIndex paths and frontmatter in summaries, and the `search` and `write`/`applyEdits` effects.
- Every source obligation assigned to this part is covered.

Outputs consumed by Part 3:

- `createIndexHost` and the `search` path;
- `main.ts` wiring (config, state, logger, index host, link registrations);
- the UI fixtures and `mountShell` options;
- the worker compile entrypoint.

## Planning Gaps

None
