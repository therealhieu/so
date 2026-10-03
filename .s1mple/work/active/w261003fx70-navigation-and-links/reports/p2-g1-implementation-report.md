# P2-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-plan-2-runtime-index-navigation-ui.md`
- **Group:** `P2-G1` — Index worker, freshness, and link-safe edits
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`, `P2-G1-T6`, `P2-G1-T7`
- **Report:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p2-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G1-T1` | `src/workspace/index-worker.ts:ToWorker, FromWorker, scan, changed, removed, searchFile, searchText, searchMentions`; `src/core/state/types.ts:SearchHit`; `knip.json` (worker entry); `src/workspace/index-worker.test.ts` | `bun test src/workspace/index-worker.test.ts` → 6 pass; `bun run check` → exit 0, 528 pass | `3314e5d` | `Completed` |
| `P2-G1-T2` | `package.json:scripts.build` (second entrypoint); `.github/workflows/release.yml` (both build loops); `test/repo.test.ts` "compile includes the worker" | repo test RED, then pass; `bun run build` → `dist/so` 70.6 MB; `bun run check` → exit 0, 529 pass | `b6d889c` | `Completed` |
| `P2-G1-T3` | `src/core/state/index.ts:onIndexBatch, onIndexReady, onIndexFailed, summarizeSaved, indexAfterFsOp, indexAfterFileEvent`; hooks in `save.ts`, `disk.ts`, `explorer.ts`; `src/core/state/status.ts` and `src/ui/views/statusline.ts` index and backlinks segments; `src/core/state/index.test.ts` | `bun test src/core/state/index.test.ts` → pass; `bun run check` → exit 0, 538 pass | `27b8c68` | `Completed` |
| `P2-G1-T4` | `src/app/index-host.ts:createIndexHost, workerUrl`; `src/app/main.ts` wiring; `test/integration/index-host.test.ts`; `test/integration/helpers.ts:startApp({index})`; `src/app/index-host.test.ts` | `bun test test/integration/index-host.test.ts` → 3 pass (3 consecutive runs); `bun run test:ci` → 82 pass; follow-up: `bun test src/app/index-host.test.ts` → 1 pass, `bun test test/e2e/binary-index.test.ts` → pass | `7eac2b1`; follow-up fix `f768344` | `Completed` |
| `P2-G1-T5` | `src/core/state/types.ts:LinkRewrite, IndexState.rewrite, PromptState.impact/invalid, Action editsApplied, Effect applyEdits`; `src/core/state/link-edits.ts:impactText, requireIndex, startRename, promptImpact, submitRename, awaitsOp, dropRewrite, followMove, beginRewrite, onEditsApplied`; `src/core/state/explorer.ts:startOp, promptKey, submit, onFsResult`; `src/core/state/buffers.ts:applyBufferEdits, restoreFile`; `src/core/features/links/rename.ts:applySpanEdits`; `src/core/state/index.ts:summarizeWritten`; `src/core/state/update.ts`; `src/core/state/commands.ts` (explorer commands pass the context); `src/app/effects.ts:run applyEdits`; `src/ui/overlays/prompt.ts:layout`; `src/ui/views/explorer.ts:impactLine, rows, renderSelf`; `src/ui/theme.ts` (`explorerWarn`, `explorerError`); tests `src/core/state/link-edits.test.ts`, `test/integration/rename.test.ts`, `test/ui/file-ops.test.ts` | RED: with the source reverted, `link-edits.test.ts` → 0 pass 1 fail (missing exports) and `rename.test.ts` + `file-ops.test.ts` → 4 fail. GREEN: `bun test src/core/state/link-edits.test.ts test/integration/rename.test.ts test/ui/file-ops.test.ts` → 21 pass; `rename.test.ts` 3 consecutive runs pass; `bun run check` → exit 0, 545 pass; `bun test test/integration test/ui` → 77 pass | `31b12b6` | `Completed` |
| `P2-G1-T6` | `test/e2e/binary-index.test.ts` (builds `dist/so` in `beforeAll`, 50 notes, PTY) | First run failed: the compiled binary could not load the worker (`ModuleNotFound resolving "/$bunfs/workspace/index-worker.ts"`); fixed under T4 (`f768344`). Then `bun test test/e2e/binary-index.test.ts` → pass twice (1.6 s, 1.2 s). Negative check: dropping the worker from `scripts.build` → 0 pass 1 fail; `package.json` restored (`git diff --quiet` clean) | `808bc7e` | `Completed` |
| `P2-G1-T7` | `src/app/effects.ts` (`fs.op`, `links.edited`, `links.skipped`, `fs.*Failed`, `config.*` events); `src/app/main.ts` (`app.startup`, `app.firstFrame`, `config.*`); `test/integration/helpers.ts:startApp({env})`; `test/integration/log.test.ts` | RED: `bun test test/integration/log.test.ts` → fail (no `fs.op` event; events were `index.start`, `index.ready`, `config invalid`). GREEN: → 1 pass; `bun run check` → exit 0, 546 pass; `bun test test/integration` → 33 pass | `7a79f41` | `Completed` |

### Group Change Range

- **Starting commit:** `3b70f7f`
- **Final commit:** `7a79f41`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed` — exit 0 in 4.0 s wall time; biome, `tsc --noEmit`, knip clean (worker entry included), 546 tests pass across 45 files.
- `bun --bun run knip` → `Passed` — exit 0, no findings.
- `bun test src/workspace src/core/state` → `Passed` — 130 pass, 0 fail.
- `bun test test/integration test/ui test/e2e` → `Passed` — exit 0, 87 pass, 0 fail across 15 files (21.0 s).
- `bun run build` → `Passed` — bundles 308 modules and compiles `dist/so` with both entrypoints.
- `bun test test/repo.test.ts` → `Passed` — 4 pass.
- Group diff self-review (`git diff 3b70f7f..HEAD`, 37 files) → `Passed` — no work-process identifiers in added lines; no new `@opentui` import outside `src/ui`; no `node:`, `Bun.`, or `@opentui` use in changed `src/core` files.

### Deviations and Remaining Issues

1. **Worker URL in the compiled binary (defect from T4, fixed in `f768344`).** `bun build --compile` places the main entry at the bunfs root (`/$bunfs/root/so`), so `new URL("../workspace/index-worker.ts", import.meta.url)` missed the worker, and every release binary would have reported `index unavailable`. `workerUrl(here)` in `src/app/index-host.ts` resolves `./workspace/index-worker.ts` when `here` is a `/$bunfs/` URL and `../workspace/index-worker.ts` from source. The T2 repo test only checks that the build lists the entry; V47 (T6) is the guard that caught this.
2. **Prompt impact for an unchanged value.** The impact is computed for the value currently in the field, as the UI design states ("`planRename` count; 0 → `No links to update`"). When `r`/`m` opens, the value is the current name, so the first line reads `No links to update` until the user types a new name. The plan preview's "31 links in 12 files" is asserted after typing `roadmap.md`.
3. **Rewrite op matching is structural.** `awaitsOp` compares `kind`, `from`, and `to` instead of object identity (design section 7, `explorer.ts`). UI and integration tests dispatch new `FsOp` objects, and the comparison is equivalent for the runner path.
4. **Path validation.** `promptImpact` sets `invalid` for an empty value (`name is empty` / `path is empty`), for a target outside the workspace after resolving `.`/`..` (`outside the workspace`), and for a target already in `index.ix.files` (`<path> already exists`), as the design specifies. Existing folders are not in `ix.files`, so a move onto a folder still fails at the file system with the DI1 E13 message (`test/integration/explorer-ops.test.ts` keeps that case). The submitted `to` is the normalized path.
5. **Rewrite bookkeeping.** `rewrite.batch` is `max(now, previous batch + 1)` and is also the clock passed to `scheduleAutosave` for open-buffer edits, because `fsResult` carries no time. No rewrite is stored when the plan is empty or the index is unavailable. A rename or move that reports back while closed-file edits are pending moves those pending paths too (`followMove`), so `editsApplied` from the runner (which reports the followed path) still matches. An open buffer whose text no longer matches is reported as skipped with the reason `changed in the editor`. The skipped toast groups paths by reason: `skipped: a.md, b.md (changed on disk); c.md (removed)`. The info toast is always emitted (`N files updated`, singular for 1).
6. **Inline rename impact row.** Rename edits the name inside the tree (DI1), which hides `PromptView`. The impact or invalid line is therefore painted as a row under the renamed entry in `ExplorerView`, using new tokens `explorerWarn` (warn on bg-dark) and `explorerError` (error, bold). Move uses the float prompt with `floatWarn`/`floatError`.
7. **Test setup changes for readiness.** Rename and move are now refused while the index is idle or indexing. `startApp` without a worker dispatches `indexReady` over the empty index. `src/core/state/keys.test.ts`, `src/core/state/explorer.test.ts`, and the `r`/`m` test in `test/ui/file-ops.test.ts` start from a ready index. The `r`/`m` UI test now also expects the `No links to update` row.
8. **Log event names.** Existing events were renamed to the `area.event` form (`app.startup`, `app.firstFrame`, `config.invalid`, `config.readFailed`, `fs.opFailed`, `fs.readFailed`, `fs.listFailed`, `fs.writeFailed`). New events: `fs.op` (`op`, `path`, `to`) and `links.edited` (`path`, `links`). The `Logger` keeps the design's `info`/`error` levels; the plan preview's `logger.debug` is not added.
9. **Carried from earlier tasks (already recorded during T3/T4).** The backlinks status segment shows only when the index status is `ready` or `unavailable`, so it is hidden while idle and the DI1 goldens are unchanged. `StatusSegments.index` is an optional field. The host's `notify` forwards every changed non-directory path, not only notes, so worker text search sees new files.
10. **Not in this group.** `IndexState.searchSeq`, `startMentionEdit`, the mention cases of V38, and the jump and outline parts of V25/V30 belong to P2-G2, which adds them in the tasks that handle them.

## Remediation

- **Verification reports:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p2-g1-verification-report.md` (commit `360acf4`, status `Failed`)
- **Status:** `Completed`

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G1-VER1` | `src/core/state/link-edits.ts:refuseWhileRewriting` (new) — while `index.rewrite` is set, `startRename` refuses with the message `links still updating — try again when the update finishes` and opens no prompt; `submitRename` checks the same first, so a prompt open when a rewrite starts closes on Enter with that message and emits no FsOp. The stored plan is never replaced. Test `src/core/state/link-edits.test.ts` "a rename while links are still updating is refused and keeps the first plan": move `notes/plan.md` (12-file plan), then `r` on `notes/other.md` → no overlay, the message, no effects, rewrite unchanged; Enter on an already open rename prompt with a rewrite in flight → overlay closed, the message, no effects; first `fsResult ok` → 12 `applyEdits` (`refs/r1.md`…`refs/r12.md`); all reported → one toast `12 files updated`, rewrite cleared; `r` works again. RED: with only `link-edits.ts` reverted, `bun test src/core/state/link-edits.test.ts` → 7 pass, 1 fail (the new test). GREEN: → 8 pass, 0 fail. `bun run check` → exit 0, 547 pass, 3.17 s real. `bun test test/integration/rename.test.ts src/core/state/link-edits.test.ts` → 9 pass, 0 fail. | `6160105` (`P2-G1-T5`) | `Fixed` |

**P2-G1-VER1 completion checklist:**

- [x] Required resolution is implemented — a second rename or move is refused with a visible message while a rewrite is in flight, so every submitted rename either applies its plan or tells the user why not.
- [x] Required proof passes — the unit test above, `bun run check`, and `bun test test/integration/rename.test.ts`.
- [x] Change evidence is recorded.
- [x] Verification evidence is recorded.

### Unverified Item — intermittent e2e timeouts

Cause found and fixed for the binary test; no cause found in this group for the `restore.test.ts` timeout.

- **Binary first launch (group-attributable, fixed in `7e92e84`, `P2-G1-T6`).** Every `bun run build` writes a new `dist/so`, and its first launch waits for macOS to assess the binary. Measured: two identical rebuilds then `dist/so --version` → 0.74 s and 0.76 s real (0.07 s user); a second launch → 0.06 s. A fresh build timed in a PTY: first frame 789–798 ms on first launch, 104–121 ms afterwards. That wait counted against `ready(p)`'s 5 s first-frame budget and grows on a busy host. `test/e2e/binary-index.test.ts` now launches `dist/so --version` once inside the 120 s `beforeAll` (which already holds the build). The test body dropped from 0.88–0.98 s to 0.21–0.24 s (3 isolated runs). The in-setup build already had its own 120 s budget, so it was not the cause.
- **`restore.test.ts` (unchanged DI1 test).** Not reproduced. Suite time at the group base `3b70f7f` (temporary worktree, 3 runs): 2.25, 2.04, 2.06 s; at HEAD: 1.96, 1.97, 1.97 s, so the index worker added no startup cost there. The slowest test in that file runs 0.23–0.26 s against Bun's 5 s per-test limit. The verifier's failure needed a ~20× host slowdown, which points to transient host load.
- **Reproduction attempts, all passing (87/87 each):** combined command 4 runs before the fix (20.7–21.0 s); 3 runs under 20 busy `yes` processes on 10 cores; 2 rounds of the combined command in parallel with `bun run check` and `bun test test/integration test/ui`; 2 rounds of two combined commands in parallel (both rebuilding `dist/so`). After the fix: combined 3 runs (20.7–20.9 s) and `bun run test:ci` 2 runs (21.1–21.4 s), all 87 pass; slowest test 2.27 s (the flush-bound quit test, by design).
- **CI:** stability on `ubuntu-24.04` and `macos-15` is not observable locally; it is checked when the PR runs.

### Remediation Verification

- `bun run check` → `Passed` — exit 0, 547 pass across 45 files, 3.17 s real.
- `bun test src/workspace src/core/state` → `Passed` — 131 pass, 0 fail.
- `bun test test/integration test/ui test/e2e` → `Passed` — 3 consecutive runs, 87 pass, 0 fail each (20.72–20.86 s).
- `bun run test:ci` → `Passed` — 2 consecutive runs, 87 pass each.
- `bun run build` → `Passed` — 308 modules, `dist/so` compiled with both entrypoints.
- `bun test test/repo.test.ts` → `Passed` — 4 pass.
- Group diff self-review (`git diff 3b70f7f..HEAD`, 39 files including this report and the verification report) → `Passed` — no work-process identifiers in added code, test, or config lines; no `node:`, `bun`, or `@opentui` import in changed non-test `src/core` files; no `@opentui` import outside `src/ui`.

### Remediation Notes

- With the refusal in place, `followMove` and the `previous batch + 1` term in `submitRename` (Deviations and Remaining Issues, item 5) are no longer reached from explorer rename or move, because no rename or move can start while a rewrite is stored. Both are kept unchanged as harmless guards; removing them is outside the finding.
- A create or trash during an in-flight rewrite is still allowed. A trashed pending file is reported by the runner as skipped (`removed`) in the batch toast, so it is not silent.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — P2-G1-VER1 is fixed and the binary-test timeout cause is fixed; every group check passes.
- **Final report commit:** returned to the orchestrator.
- **Final commits:** `3314e5d`, `b6d889c`, `27b8c68`, `7eac2b1`, `31b12b6`, `f768344`, `808bc7e`, `7a79f41`, `6160105`, `7e92e84`
- **Final checks:** `bun run check` exit 0 (547 pass, 3.17 s); `bun test src/workspace src/core/state` 131 pass; `bun test test/integration test/ui test/e2e` 87 pass ×3; `bun run test:ci` 87 pass ×2; `bun run build` compiled; `bun test test/repo.test.ts` 4 pass.
- **Remaining issues:** None. CI stability on `ubuntu-24.04` and `macos-15` is confirmed only when the PR runs.
