# P2-G1 Verification Report

## Scope

- **Group:** `P2-G1` — Index worker, freshness, and link-safe edits
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`, `P2-G1-T6`, `P2-G1-T7`
- **Report:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p2-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p2-g1-implementation-report.md` (report commit `038729a`)
- **Change range inspected:** `3b70f7f..7a79f41` (`3314e5d`, `b6d889c`, `27b8c68`, `7eac2b1`, `31b12b6`, `f768344`, `808bc7e`, `7a79f41`; 37 files)

## Status

`Failed`

Every assigned V case and group check passes, and the V47 negative check holds. One Minor correctness defect remains open (P2-G1-VER1). A rename or move submitted while an earlier one still waits for its file operation replaces the earlier link plan, so that plan's links are never rewritten and no message reports it.

## Assigned Traceability

- **System Design:** `W261003FX70-REQ1, REQ4, REQ5, REQ6, REQ7 → DES1, DES4, DES5, DES6, DES7 (log) → S1, S7, S8, S10, S11, S12, S14, S18 (statusline index segment, impact prompt) → V24, V25 (except outline), V30 (index and backlinks), V34, V36, V37, V38 (rename cases), V41, V45, V47, V52 (build), V56`
- **UI Design:** `None — V45 and V36 assert the impact prompt and index segment states; parent M1@R1/M4@R1 are bound through the discussion context`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ4, REQ9 → DES4 → S9, S11, S17 → V34` | None | Worker walks with the explorer's exclusion rule, summarizes notes in batches of 500 with `files`, then `ready`. Text search is literal, smart-case, and capped. Mentions are whole-word prose only. The worker never writes and is a knip entry. | `src/workspace/index-worker.ts:walk, scan, searchText, searchMentions, searchFile` (only `readFileSync`, `readdir`, `stat`, `readTextFile` used; `BATCH = 500`, `READ_CONCURRENCY = 32`, 1 MiB text cache); `knip.json` entry | `Satisfied` |
| `REQ4 → DES4 → S11 → V52 (build), V56` | None | `bun run build` and both release compile loops list the worker; a repo test enforces it | `package.json:scripts.build`; `.github/workflows/release.yml` both loops; `test/repo.test.ts` "compile includes the worker" (≥ 3 compile lines, each contains both entrypoints) | `Satisfied` |
| `REQ4 → DES4 → S11 → V47` | None | Compiled `dist/so` reaches index ready | `src/app/index-host.ts:workerUrl` resolves `./workspace/index-worker.ts` under `/$bunfs/` (fix `f768344`); `src/app/index-host.test.ts`; `test/e2e/binary-index.test.ts` | `Satisfied` |
| `REQ4 → DES4 → S11 → V36` | None | First crash → `indexFailed{final:false}` and rescan; second → `{final:true}`, status `unavailable`, forwarding stops, editing works | `src/app/index-host.ts:createIndexHost` (`crashed` counts `error` message, `error` event, `close`; `worker !== w` guard; restart only when `crashes ≤ 1`); `src/core/state/index.ts:onIndexFailed` | `Satisfied` |
| `REQ4, REQ5 → DES4, DES5 → S11, S12 → V37` | None | Host starts after the first frame; watcher events reach the worker; own saves reach the index on the main thread | `src/app/main.ts` (`indexHost` built before the runner; `watchWorkspace` → `fileChanged` + `indexHost.notify`; `indexHost.start` inside `setImmediate` after `shell.attach`); `src/core/state/save.ts:onSaved` → `summarizeSaved` | `Satisfied` |
| `REQ5 → DES5 → S12 → V25 (except outline)` | None | Saves, FsOps, `editsApplied` text, and file events update the index without a rescan; status `idle → indexing → ready → unavailable` | `src/core/state/index.ts:onIndexBatch, onIndexReady, onIndexFailed, summarizeSaved, indexAfterFsOp, indexAfterFileEvent, summarizeWritten`; one call each in `save.ts:onSaved`, `explorer.ts:fsResultTree`, `disk.ts:onFileChanged`, `link-edits.ts:onEditsApplied` | `Satisfied` |
| `REQ1 → DES1, DES5, DES9 → S1, S18 → V30 (index, backlinks)` | None | Index segment values; backlinks only for notes and not while indexing; new state, actions, and effects compile with the exhaustive switch | `src/core/state/status.ts:statusSegments`; `src/ui/views/statusline.ts:indexSegment`; `src/core/state/types.ts:IndexState, LinkRewrite, PromptState.impact/invalid`, actions `indexBatch/indexReady/indexFailed/editsApplied`, effect `applyEdits`; `src/core/state/update.ts` cases | `Satisfied` (backlinks also hidden while `idle`; see Scope Changes) |
| `REQ6 → DES6 → S10 → V24` | None | Refusal text while idle or indexing; with the index unavailable the prompt warns and only the FsOp runs | `src/core/state/link-edits.ts:requireIndex` (`NOT_READY` exact), `promptImpact` (`UNAVAILABLE` exact), `submitRename` (no plan unless `ready`) | `Satisfied` |
| `REQ6 → DES3, DES6 → S7, S8 → V24, V38 (rename)` | None | Impact prompt; Enter blocked while invalid; plan stored, FsOp emitted; edits only after a successful FsOp; open buffers in one undo step; closed files validated and written atomically; one summary toast plus skipped paths | `link-edits.ts:startRename, promptImpact, submitRename, beginRewrite, onEditsApplied, finish`; `explorer.ts:onFsResult, promptKey, submit`; `buffers.ts:applyBufferEdits, restoreFile`; `rename.ts:applySpanEdits`; `src/app/effects.ts` case `applyEdits` (serial queue, `follow`, `readTextFile`, `write(path, …, cur.stamp)`, `ownOps.noteWrite`, one `editsApplied` per path) | `Mismatch` — P2-G1-VER1: a second rename or move submitted before the first `fsResult` discards the first plan |
| `REQ1 → DES6, DES9 → S18 → V45` | None | Explorer `m` shows "3 links in 2 files will be updated" before Enter; prompt paints impact and invalid lines | `src/ui/overlays/prompt.ts:impactLines`; `src/ui/views/explorer.ts:impactLine` (inline rename row); `src/ui/theme.ts` `explorerWarn`, `explorerError` | `Satisfied` |
| `REQ7 → DES7 → S14 → V41` | None | `SO_LOG=debug` log holds events with paths and counts only, never note text | `src/app/effects.ts` (`fs.op`, `links.edited`, `links.skipped`, `fs.*Failed`, `config.*`); `src/app/index-host.ts` (`index.start`, `index.ready`, `index.crashed`); `src/app/main.ts` (`app.startup`, `app.firstFrame`, `config.*`) | `Satisfied` |

Roadmap binding: `RM261003ABZP-PH1@R2` and `DI2@R2` (discussion context) assign no cross-work gate to this group. The G2/G3 outputs produced here (summaries with paths and frontmatter, `Prompt`, the `write`/`applyEdits` effects, the worker) are due in P3-G1. Parent sources were read only.

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| Fast gate | S1, S19 | DES1, DES4 | `bun run check` | exit 0, 546 pass across 45 files; biome, `tsc --noEmit`, knip clean with the worker entry; wall time 6.07 s (< 30 s) | `Passed` |
| Units | S8, S10, S12, S18, S9, S17 | DES4, DES5, DES6, DES9 | `bun test src/workspace src/core/state` | exit 0, 130 pass, 0 fail across 19 files | `Passed` |
| `V24` | S7, S8, S10 | DES6 | `src/core/state/link-edits.test.ts` (in the unit run) | Ready → `31 links in 12 files will be updated`; existing name → `invalid`, Enter emits nothing; idle and indexing → exact refusal, no prompt; unavailable → warning and only `move`; failed FsOp → no `applyEdits`, rewrite cleared; ok → open dirty buffer edited with undo depth +1 and autosave timer, 11 `applyEdits` in one batch, toasts `11 files updated` and `skipped: refs/r9.md (changed on disk)` only after the last result; stale open span → `stale`, state unchanged | `Passed` |
| `V25` (except outline) | S12 | DES5 | `src/core/state/index.test.ts` (in the unit run) | Saved link reaches backlinks without a worker; create/rename/move/trash follow `fsResult`; removed path leaves; a buffer typed during its write is not summarized; derived maps equal a rebuild | `Passed` |
| `V30` (index, backlinks) | S18 | DES9 | `src/core/state/status.test.ts` (in the unit run) | Index segment `undefined` → `indexing 4210/10000` → `ready` → `unavailable`; backlinks hidden while indexing, `2` when ready, absent for `scripts/sync.ts` | `Passed` |
| `V34` | S9, S17 | DES4 | `src/workspace/index-worker.test.ts` (real `Worker`, in the unit run) | Six cases pass: scan exclusions and note-only summaries; literal text search skips `photo.png` and 17 MiB `big.log`; limit 2 → `capped`; mentions skip links, code, tags, comments, frontmatter; changed/removed; listing and mtimes unchanged | `Passed` |
| Integration, component, e2e | S7, S8, S11, S12, S14, S18 | DES4, DES5, DES6, DES7 | `bun test test/integration test/ui test/e2e` | First run: exit 1, 85 pass, 2 fail. `binary-index.test.ts` timed out in `ready(p)` (first frame, 5 s default) before the index wait, and the unchanged DI1 `restore.test.ts` "an uncaught exception flushes typed text and exits 1" timed out at 5 s in the same run. Each file then passed twice in isolation, and an identical rerun of the combined command passed: exit 0, 87 pass, 21.4 s | `Passed` (intermittent first-run failure; see Unverified Items) |
| `V36` | S11 | DES4 | `test/integration/index-host.test.ts` (in the run above) | Terminating worker 1 → one `indexFailed{final:false, reason:"worker exited"}`, a second worker, ready again with backlinks intact; second termination → `unavailable`, still 2 workers after 200 ms, `statusSegments().index === "unavailable"`, then `xi1<Esc>:w` writes `1lpha` | `Passed` |
| `V37` | S12 | DES5 | `test/integration/index-host.test.ts` | External append of `[[a]]` to `b.md` → backlinks include `b.md`; own save of `c.md` → backlinks `["b.md", "c.md"]` | `Passed` |
| `V38` (rename cases) | S7, S8 | DES3, DES6 | `test/integration/rename.test.ts` | Parent V6@R2 (a): `[[plan]]`, `[[plan\|Plan]]`, `![[plan#Goals]]`, `[x](plan.md)` and frontmatter `related` rewritten on disk with kind, alias and subpath kept; BOM + CRLF file byte-preserved; `e.md` changed after indexing is byte-identical and skipped; open dirty `d.md` edited in memory, disk unchanged until `:w`; toasts `5 files updated` and `skipped: e.md (changed on disk)` | `Passed` |
| `V41` | S14 | DES7 | `test/integration/log.test.ts` | With `SO_LOG=debug`, a real worker, a rename and an invalid config: `so.log` holds `index.ready`, `fs.op`, `links.edited` and `config.invalid`, and none of the notes' lines or sentinel words | `Passed` |
| `V45` | S18 | DES6, DES9 | `test/ui/file-ops.test.ts` | Frame shows `❯ archive/roadmap.md` and `3 links in 2 files will be updated`; existing target shows `✗ notes/ideas.md already exists` and Enter emits no `move`; `r` before the index is ready shows the refusal | `Passed` |
| `V47` | S11 | DES4 | `bun test test/e2e/binary-index.test.ts`; negative check (manual) | Passes in isolation (1.5 s, 1.2 s). Negative check: removing `src/workspace/index-worker.ts` from `scripts.build` → `timed out waiting` at the 10 s index wait, 0 pass 1 fail; `package.json` restored (`git diff --quiet` clean), rebuilt, test passes again | `Passed` |
| `V52` (build) | S1, S11 | DES1, DES4 | `bun run build` | exit 0; `bun build --compile src/app/main.ts src/workspace/index-worker.ts --outfile dist/so`, 308 modules; `tsc --noEmit` passes inside `bun run check` | `Passed` |
| `V56` | S11 | DES4 | `bun test test/repo.test.ts` | exit 0, 4 pass | `Passed` |
| Ordering and pipeline rules | S7, S8 | DES6 | Code inspection | No `applyEdits` before `fsResult ok` (`onFsResult` → `beginRewrite` only on `awaitsOp` + `ok`); `applyEdits` uses `serial`, `follow`, `noteWrite`, and `write` with the read stamp; each path dispatches exactly one `editsApplied`; restart count bounded by `crashes > 1` | `Passed` |
| Concurrent rename probe | S7, S8 | DES6 | Scratch reducer test (not committed): rename `plan.md → roadmap.md`, then rename `other.md → misc.md` before the first `fsResult`, then both `fsResult ok` | First `fsResult` emits 0 `applyEdits`; only `b.md` is edited; `a.md`'s `[[plan]]` is never rewritten; no toast or message | `Failed` (P2-G1-VER1) |
| Code rules | None | DES1 | `git diff 3b70f7f 7a79f41` grep for work-process IDs; `test/boundaries.test.ts` in `check` | No REQ/DES/V/S/phase/goal identifiers in added lines; no `@opentui` outside `src/ui`; `src/core` stays pure | `Passed` |

## Findings

### P2-G1-VER1 — Minor — Technical (correctness) — A second rename or move discards the pending link plan

- **System Design:** `W261003FX70-REQ6 → DES6 → S7, S8 → V24, V38`
- **UI Design:** `None`
- **Evidence:** `src/core/state/link-edits.ts:submitRename` keeps one rewrite slot and replaces it on every submit:

  ```ts
  const { rewrite: _, ...index } = s.index;
  …
  return explorerOp(
    { ...s, index: edits.length === 0 ? index : { ...index, rewrite } },
  ```

  `src/core/state/explorer.ts:onFsResult` then starts edits only when `awaitsOp(prev, op)` matches the stored op. A reducer probe proved the loss. It renamed `plan.md → roadmap.md` (plan: `a.md`), then renamed `other.md → misc.md` before the first `fsResult`. The first `fsResult ok` produced 0 `applyEdits`, and only `b.md` was edited after the second. The same replacement drops the first batch's summary toast when its closed-file results are still pending. The first `fsResult` can arrive late, because `explorerOp` first flushes pending writes on the serial queue (for example a slow or retrying save).
- **Impact:** `plan.md` moves but `a.md` keeps `[[plan]]`, a broken link, with no toast or message. This breaks S7 ("keep every resolved link on its file") and S8 ("one toast reports the count and skipped paths"). The second plan is also computed against an index that does not yet reflect the first move. The race window is narrow, so severity is Minor, but the failure is silent.
- **Required resolution:** Do not replace an in-flight rewrite. For example, refuse a rename or move (and keep the prompt closed) with a message while `index.rewrite` is set, as `requireIndex` does while indexing. Alternatively, keep the earlier rewrite until it reports. Either way, every submitted rename either applies its plan or tells the user why not.
- **Required proof:** A unit test in `src/core/state/link-edits.test.ts` that submits a second rename or move before the first `fsResult`. It asserts that the first plan's `applyEdits` are emitted after its `fsResult ok`, or that the second submit is refused with a visible message and emits no FsOp. Also run `bun run check` and `bun test test/integration/rename.test.ts`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - The worker's scan exclusions, batching, text and mention search, limits, and no-write rule (V34).
  - The compile entry in every build line (V56), and the compiled binary reaching index ready, with a confirmed negative check (V47).
  - Restart once, then unavailable while editing works (V36).
  - External and own changes reaching backlinks (V37).
  - Main-thread freshness for saves, FsOps, written edits, and removals (V25).
  - Index and backlinks segment data (V30).
  - The whole rename pipeline at reducer level: refusal, unavailable, failed FsOp, open buffer in one undo step, per-file results, and one toast (V24).
  - Disk results, including BOM/CRLF preservation and stale-file skipping (V38 rename).
  - The impact and invalid rows in the frame (V45).
  - Log content without note text (V41).
  - `workerUrl` for source and bunfs paths.
- **Missing:**
  - A second rename or move submitted while a rewrite is in flight (P2-G1-VER1).
  - No test asserts the painted statusline strings `◌ indexing n/total`, `◆ index ready`, `✗ index unavailable` and `← N backlinks`; the goldens are owned by V44 in P2-G2.
  - V47 matches `index ready` anywhere on screen, so the `index ready` toast alone would satisfy it. Both come from `indexReady`, so S11 is still proven.
  - Crash detection through an `error` message or an `error` event is not exercised; only `close` (terminate) is.

## Scope Changes

- **Backlinks hidden while `idle`.** The design shape shows backlinks for any status except `indexing`; the implementation shows them only for `ready` and `unavailable` (`src/core/state/status.ts:statusSegments`). This keeps the DI1 goldens unchanged. V30 does not constrain `idle`. Recorded in implementation report item 9.
- **Rewrite op matched by value, not identity.** The design compares `index.rewrite.op` by identity; `awaitsOp` compares `kind`, `from` and `to` (`src/core/state/link-edits.ts:sameOp`). This is equivalent on the runner path (implementation report item 3).
- **Inline rename impact row.** Rename edits the name inside the tree, so its impact and invalid line paints in `ExplorerView` with new theme tokens `explorerWarn` and `explorerError`; move uses `PromptView` (implementation report item 6).
- **Readiness gate changed existing tests.** Rename and move are refused while the index is idle, so `startApp` without a worker dispatches `indexReady`, and `keys.test.ts`, `explorer.test.ts` and the `r`/`m` UI test start from a ready index (implementation report item 7).
- **Log event renames.** Existing events were renamed to the `area.event` form (implementation report item 8).
- **Unused `ignore` argument.** `IndexHost.start(root, ignore)` and the `scan` message carry `ignore`, but `main` passes `[]` and the worker does not read it. This is harmless today.

## Unverified Items

- **Intermittent e2e timeouts.** The first combined `bun test test/integration test/ui test/e2e` run failed twice: `binary-index.test.ts` timed out waiting for the first frame (5 s default in `ready(p)`), and the unchanged DI1 `restore.test.ts` timed out at 5 s. Both files passed in isolation, and an identical combined rerun passed (87/87). The cause is not established. Two unrelated PTY tests timing out together points to host load, but a slow first exec of the freshly compiled 70 MB binary was not ruled out. CI stability on `ubuntu-24.04` and `macos-15` is unverified here.
- **Release builds.** The release workflow compile loops were verified by inspection and V56 only; cross-target binaries were not built.

## Blockers

None
