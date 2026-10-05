# P3-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-goal.md`
- **Plan Part:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-3-base-embeds-and-delivery.md`
- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`
- **Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p3-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

Base embeds render read-only in notes and open the base at the embedded view. The DI3 re-checks pass with the `base` renderer and a Base embed. PR #8 is open and mergeable, with CI green before and after the work-folder move. One CI bench failure on the first PR head was fixed in a new commit (see Deviations, item 1).

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P3-G1-T1` | `src/core/state/embed-models.ts`: `EmbedModelBuilder`, `EmbedModelRegistry`; `src/core/state/update.ts`: `Registries.embedModels`, `syncEmbeds(…, reg)`; `src/core/lang/markdown/live-preview.ts`: `PreviewCtx.embedModel`; `src/core/state/markdown-view.ts`: `markdownViewContextFor(reg)` (replaces `markdownViewContext`); `src/core/state/embeds.ts`: `embedTargets`/`syncEmbeds` load targets whose file type has an embed model; `src/core/state/base-model.ts`: `baseEmbedModel` over a shared `memoized` slot keyed by path and view; `src/core/features/bases/embed.ts`: `BaseEmbedModel`, `isBaseEmbedModel`, `baseEmbedOf`; `src/core/state/jumps.ts`: `goTo`/`awaitLoad` carry `subpath`; `src/core/state/link-commands.ts`: `followLink` passes the link's subpath when the target has its own editor kind; `src/app/main.ts`, `test/support/state.ts`: registrations; `test/support/markdown.ts`: `stubCtx.embedModel`; `src/core/state/embed-models.test.ts` (6 tests) | RED: `bun test src/core/state/embed-models.test.ts` failed (module missing). GREEN: 6 pass. `bun run check` 1001 pass (4.6 s). `bun test test/ui/live-preview.test.ts src/core/state` 260 pass. V20 search empty | `181d749` | `Completed` |
| `P3-G1-T2` | `src/core/features/bases/embed.ts`: `BaseEmbedData`, `baseEmbedRenderer`; `src/core/lang/markdown/renderers/embed.ts`: `embedAsLink` shared by both embed renderers (Bases-free); `src/ui/widgets/base.ts`: `paintBaseEmbed` reusing `paintBaseTable`/`paintBaseBoard`; `registerBlockRenderer("base")` in `registries()`/`testRegistries`, `registerWidgetPainter("base")` in `main()`/`mountShell`; `src/core/features/bases/embed.test.ts` (5 tests); painter component test in `test/ui/bases.golden.test.ts` | RED: `bun test src/core/features/bases/embed.test.ts` failed (exports missing). GREEN: 5 pass (widget rows `1 + 2 + 10 + 1 = 14`, `more: 20`; loading 3 rows; missing and non-model 2 rows; nested embed stays a link; source view raw). `bun test test/ui/bases.golden.test.ts` 20 pass (frame shows `╭ ↳ tasks.base`, `│ loading…`, `base not found`, `╰ ↓ 4 more`, no focus marker). `bun run check` 1001 pass, boundary test passes | `840c6c2`; follow-up `10fa7c8` (comment reflow) | `Completed` |
| `P3-G1-T3` | `test/fixtures/tour.md`: `![[tasks.base#All tasks]]` appended at the end; `src/core/lang/markdown/live-preview.test.ts`: tour goldens register `baseEmbedRenderer`, `tourCtx` resolves `tasks.base`; `test/ui/live-preview.test.ts`: `openTour` seeds task summaries, `tasks.base`, and its embed load; new tour frame goldens at widths 60 and 100; `test/fixtures/generate.ts`: `make5000LineNote` embeds `tasks.base#All tasks` at line 2540 and copies `tasks.base` and `tasks/` beside the note; `test/bench/live-keystroke.bench.ts`: seeds index and embed, asserts a table model before timing, requires ≥ 100 frames showing the embed | RED: 18 tour goldens failed only on the new embed. Snapshot diff after `--update-snapshots`: 18 removed lines, each a golden's former last row `78 │` whose closing quote moved; additions only rows 78–80 (`↳ base ×3` widget in 16 live/reading goldens, raw `![[tasks.base#All tasks]]` in 2 source goldens). `bun test test/ui/live-preview.test.ts` 10 pass (×3 runs stable), 2 snapshots added. Bench: `liveKeystrokeP95` median 20.50 ms locally; embed painted in 153 of 200 timed frames | `d0d65d6` | `Completed` |
| `P3-G1-T4` | Final checks on `d0d65d6`; CI then found `liveKeystrokeP95` 48.79 ms > 48 ms on ubuntu-24.04. Fix: `src/core/lang/code/highlight.ts` `lowlightHighlighter` highlights one more window below a missed range and keeps the last answer; test `a range shifted within the last highlight matches a fresh highlight` | See Group Verification. After the fix: `bun run check` 1002 pass (4.98 s); `bun run test:ci` 190 pass (33.1 s); bench `liveKeystrokeP95` 11.50 ms locally, 33.22 ms on CI | No change needed at `d0d65d6`; CI fix `d820be7` | `Completed` |
| `P3-G1-T5` | PR #8 opened; `git mv` of the work folder to `.s1mple/work/done/`; 47 path references updated in 15 files inside the moved folder | Baseline check (below); CI green on `d820be7` and `fde80b6`; `gh pr view 8` → `OPEN`, `MERGEABLE`; `git ls-remote --tags origin` empty before and after | `fde80b6` | `Completed` |

### Group Change Range

- **Starting commit:** `1d6b191`
- **Final commit:** `10fa7c8`
- **Remaining group changes:** None

### Group Verification

- `bun run check` (timed) → `Passed` — 1002 tests, biome/tsc/knip zero findings, boundary test with the `yaml` home passes; 4.98 s wall on `d820be7`, 4.56 s on `d0d65d6`.
- `bun run test:ci` (orphan check before and after: none) → `Passed` — 190 tests across 26 files, 33.1 s.
- `bun test test/ui/extension.test.ts` → `Passed` — 5 tests; `git diff main -- test/ui/extension.test.ts` empty (RM261003ABZP-V16@R2).
- `bun test src/core/features/bases/embed.test.ts src/core/state/embed-models.test.ts` (V38, V39) → `Passed` — 11 tests.
- Tour goldens (V46; RM261003ABZP-V7@R2, RM261003ABZP-UV3@R2) → `Passed` — 18 `lang/markdown` tour goldens with the `base` renderer (additive diff only) and 2 component frame goldens at widths 60 and 100 showing `tasks.base#All tasks` as an evaluated table.
- `bun run bench` (V44; RM261003ABZP-V12@R3; orphan check before and after: none) → `Passed`. Medians on `d820be7` locally: `sourceKeystrokeP95` 4.17, `liveKeystrokeP95` 11.50, `openFile` 35.43, `sourceOpenFile` 13.94, `liveScrollFrameP95` 5.49, `sourceScrollFrameP95` 4.43, `firstFrame` 148.87, `indexReady` 921.65, `indexingKeystrokeP95` 9.04 ms. CI (ubuntu-24.04) on `fde80b6`: 12.84, 31.38, 114.74, 42.87, 17.38, 12.38, 287.58, 3688.17, 37.61 ms, all within their 2× limits.
- V20 `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` → `Passed` — no match.
- `git diff main -- package.json bun.lock .github/workflows` → `Passed` — empty.
- Work-process identifier search over `git diff 1d6b191..HEAD -- src test scripts` added lines (`W2610|RM2610|REQn|DESn|UVn|Vn|Pn-Gn|Snn`) → `Passed` — no match.
- V30 → `Pending — user fixture` — `KANBAN_TYPE: string | undefined = undefined` (`src/core/features/bases/types.ts:8`); `test/fixtures/bases/` has no `obsidian-kanban.base` and the README provenance table is empty.

### Gate and Delivery Evidence

- **G4 (before T1):** `e228bb5` is an ancestor of `HEAD`; `registerBlockRenderer` at `src/core/lang/markdown/live-preview.ts:43` (`BlockRenderer` at `:33`); `registerWidgetPainter` at `src/ui/widgets/registry.ts:25`; unlisted embed buffers via `embedTargets` at `src/core/state/embeds.ts:13`. `Satisfied`.
- **Phase line 553 re-checks (T3/T4):** RM261003ABZP-V7@R2 and RM261003ABZP-UV3@R2 via V46, RM261003ABZP-V12@R3 via V44, RM261003ABZP-V16@R2 via V43 — all pass with the `base` renderer and a Base embed, locally and in CI.
- **Delivery-boundary baseline (before T5, 2026-10-04):** `git fetch origin`; `origin/main` = `d398ad73781531100fe799894363a3d69ac50985`; `git merge-base HEAD origin/main` = `d398ad7…` (no merge needed). Parent index line 134: DI4 Work `Pending`, PR `Pending`. Phase Progress line 590: DI4 `Not started`, Work `Pending`. No other W is bound to DI4. No remote branch or PR existed.
- **PR:** https://github.com/therealhieu/so/pull/8, base `main`, state `OPEN`, `MERGEABLE`.
- **CI runs:**

  | Head | Run | Result | Wall time |
  |---|---|---|---|
  | `d0d65d6` (first push) | https://github.com/therealhieu/so/actions/runs/37198561239 | `check` and `test (macos-15)` pass; `test (ubuntu-24.04)` failed the bench (`liveKeystrokeP95` 48.79 ms > 48) | 2 m 22 s |
  | `d820be7` (fix) | https://github.com/therealhieu/so/actions/runs/37198934170 | All pass (`liveKeystrokeP95` 33.22 ms) | 2 m 18 s |
  | `fde80b6` (after the move) | https://github.com/therealhieu/so/actions/runs/37199133718 | All pass (`liveKeystrokeP95` 31.38 ms) | 2 m 12 s |

- **Delivery limits:** no merge, force-push, amend, history rewrite, tag, or release. `git ls-remote --tags origin` was empty before T5 and is unchanged.

### Deviations and Remaining Issues

1. **Highlighter cache fix outside the plan's file list.** The first CI bench failed (`liveKeystrokeP95` 48.79 ms vs 48; earlier CI runs measured 18–20 ms). A CPU profile located the cost: with a 14-row widget on screen, `fitCursor` (`src/ui/editors/text-view.ts:378`) advances the top line one row per pass, and each pass asked `lowlightHighlighter` for a shifted range. Its single-range cache missed every time and re-highlighted about 240 lines. The embed builder itself took 0.37 ms per key. The fix (`d820be7`, `src/core/lang/code/highlight.ts`) highlights one more window below a missed range and keeps the last answer, so identical requests still return the identical array (the existing cache test). Local p95 fell from 22.6 to 11.9 ms with the embed and from 6.9 to 5.5 ms without it. CI now measures 31–33 ms; a further cut would compute the top line directly in `fitCursor`, which was not needed to pass the gate.
2. **Bench embed position.** The plan's preview appends the embed to the 5,000-line note. At the end it is never on screen while the bench types at lines 2500–2550, so it would not be evaluated. It sits at line 2540, between blank lines, and is painted in 153 of 200 timed frames. The bench asserts a table model before timing and fails if fewer than 100 frames show the embed. The other benches never scroll to line 2540; their workloads and targets are unchanged.
3. **Tour embed position.** `![[tasks.base#All tasks]]` is appended after the footnote definition instead of under `## Embeds and images`. This keeps every existing golden row and line number byte-identical and the cursor positions in the goldens unchanged, so the snapshot diff is purely additive.
4. **Tour goldens import the base renderer in a test.** `src/core/lang/markdown/live-preview.test.ts` imports `baseEmbedRenderer` from `features/bases` (test-only; the boundary test skips tests, and production `lang/markdown` imports nothing from Bases). The renderer registry is process-global and `testRegistries()` now registers `base`. Registering it explicitly makes these RM261003ABZP-V7@R2 goldens independent of test order and re-passes them with the `base` renderer, as phase line 553 requires. Their `tourCtx` answers `"loading"` for the base; the evaluated table is proven by the component goldens in `test/ui/live-preview.test.ts`.
5. **V46 goldens are new component snapshots.** `test/ui/live-preview.test.ts` had no snapshot goldens before. The two new frame goldens (widths 60 and 100, 140 rows) seed the index and the embed through `indexBatch` and `fileLoaded`.
6. **Shapes that refine the design's illustrative previews:** the widget data is `BaseEmbedData` (`{ title, state, model }`) rather than the bare model, so the painter draws the title for every state. Embedded tables leave summaries out, and boards use one-line cards (`wide: false`), so `embedMaxRows` bounds the rows. `followLink` passes the subpath when the target's file type has its own editor kind, which covers `.base` and not Markdown. `markdownViewContext` was removed and every caller uses `markdownViewContextFor(reg)`.
7. **Unfiltered fixture base lists every indexed file.** `tasks.base` has no filters, so the embed (and the base view) lists `diagram.png`, `tour.md`, and the other indexed files as rows with empty `due`, sorted first. This matches the engine's Obsidian semantics; the goldens record it.
8. **PR body evidence predates the CI fix.** The body quotes local medians from `d0d65d6` (`liveKeystrokeP95` 20.92 ms) and does not mention `d820be7`. `gh pr edit` was outside this task's authorization, so the body was not updated. Current numbers: 11.50 ms locally, 31.38 ms on CI at `fde80b6`.
9. **Open items (unchanged):** V30 `Pending — user fixture`; Kanban enablement blocks the PH2 exit, and whether to merge before the fixture exists is the user's decision. The parent synchronization proposal (DI4 Work and PR records, design refinements 1–6, reconciliation items 1–3) is pending and was not applied. No file under `.s1mple/work/active/rm261003abzp-so-v1/` references the moved folder, so the move adds no parent path updates. The goal's line 11 still names the active path because it describes the move; the goal is orchestrator-owned and was moved unchanged.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p3-g1-verification-report.md` (`Failed`; `P3-G1-VER1`, `P3-G1-VER2`, both Minor)
- **Status:** `Completed`

Both findings are fixed. VER2 adds a committed board-embed golden. VER1 corrects the delivery evidence below and prepares the corrected PR body; the orchestrator applies it, because Delivery Finalization step 4 assigns `gh pr edit` to the orchestrator.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P3-G1-VER2` | `test/ui/bases.golden.test.ts` "base embed" → "a note paints an embedded board read-only, with one-line cards capped per lane", plus its snapshot. A note embeds `board.base#By late` (the existing `BOARD` fixture, `kanban-test` view, lanes `false` 1, `true` 3, `None` 0) with `embedMaxRows = 1`, under `NO_COLOR`. Row checks: title `╭ ↳ board.base#By late`; lane headers `│ ● false 1 ─… ● true 3 ─… ● None 0`; one-line cards `ship-release`, `inbox`, `(empty)`; `│ … ↓ 2 more` for the overflowing lane; frame ends after that row; `review-pr` and `write-report` hidden; no `INVERSE` cell in the embed rows (no focus marker). `bun test test/ui/bases.golden.test.ts` → 21 pass, 1 snapshot added; stable over 3 runs | `f545ea0` | `Fixed` |
| `P3-G1-VER1` | Delivery evidence corrected in "Corrected Delivery Evidence" below. Corrected PR body written to `/private/tmp/claude-501/-Users-hieunguyen-git-hieu-projects-so/5db7240e-67fb-4438-976f-b23ffe9f70b8/scratchpad/pr-8-body.md`. It starts from the current body and keeps its structure. It adds CI evidence from the PR head `06e27cf` (run 37199361200) for V43, V44, and V46, local results, the `d820be7` highlighter change and its `sourceOpenFile` cost, a CI history that shows the `d0d65d6` bench failure and the macOS `esc.test.ts` re-run, the G4 re-checks, V30 `Pending — user fixture`, and pending parent synchronization (not applied). `gh pr edit` was not run | No code change; report commit only | `Fixed` (PR-body item prepared; applied by orchestrator) |

**Completion checklists:**

| Finding | Required resolution implemented | Required proof passes | Change evidence recorded | Verification evidence recorded |
|---|---|---|---|---|
| `P3-G1-VER2` | Yes — board-embed component golden with row checks | Yes — `bun test test/ui/bases.golden.test.ts` 21 pass | Yes — table above | Yes — Remediation Checks |
| `P3-G1-VER1` | Prepared; applied by orchestrator — PR body file written; report evidence corrected | Pending the orchestrator's `gh pr edit 8 --body-file …`, then `gh pr view 8 --json body` showing PR-head CI evidence, `d820be7`, and the re-run | Yes — body file and corrected evidence below | Yes — CI logs quoted below |

### Board Embed Observation

A lane holding exactly `embedMaxRows + 1` cards shows all of them and no `↓ 1 more`. The embed reserves the marker row (`baseEmbedOf` adds a row when a lane exceeds the cap), and `layoutBaseBoard` (`src/ui/widgets/base.ts:427-430`) keeps a marker row only for a lane that does not fit its height:

```ts
const all = Math.floor(body / cardRows);
// A lane that does not fit keeps one row for `↓ N more`.
const fits =
  total > all ? Math.floor(Math.max(0, body - 1) / cardRows) : all;
```

So the last card takes the reserved row. No card is hidden, the widget height is unchanged, and the board view behaves the same way. This is not a defect, so the production code is unchanged. The new golden uses a lane with `cap + 2` cards so that it exercises the marker.

### Corrected Delivery Evidence

This corrects the CI table under "Gate and Delivery Evidence" and Deviations item 8. The PR head is `06e27cf`. `b4b8c3c` (verification report), `f545ea0`, and the report commit of this remediation are local and have not been pushed.

| Head | Run | Result |
|---|---|---|
| `d0d65d6` (first push) | https://github.com/therealhieu/so/actions/runs/37198561239 | `Failed` — `test (ubuntu-24.04)` bench `liveKeystrokeP95 median=48.79ms limit=48ms FAIL`; the local median had been 20.92 ms. `check` (1001 tests) and `test (macos-15)` (190) passed. CI `sourceOpenFile` 35.72 ms |
| `d820be7` (highlighter fix) | https://github.com/therealhieu/so/actions/runs/37198934170 | Passed — `liveKeystrokeP95` 33.22, `sourceOpenFile` 42.36 ms |
| `fde80b6` (move to `done/`) | https://github.com/therealhieu/so/actions/runs/37199133718 | Passed — `liveKeystrokeP95` 31.38, `sourceOpenFile` 42.87 ms |
| `06e27cf` (implementation report) | https://github.com/therealhieu/so/actions/runs/37199361200 | Attempt 1: `test (macos-15)` (job 111427671669) failed `test/ui/esc.test.ts:46` "a legacy Esc byte leaves Insert after the 50 ms timeout", `expect(median(times)).toBeLessThanOrEqual(60)`, received 60.633 ms; 189 pass, 1 fail. `check` and `test (ubuntu-24.04)` passed. Re-run with `gh run rerun --failed`; attempt 2 `test (macos-15)` passed 190 tests. `test/ui/esc.test.ts` is unchanged since `c98aa19` (DI1), so this is a pre-existing wall-clock flake |

CI bench medians on `06e27cf`, all `ok` (limit in brackets): `sourceKeystrokeP95` 11.52 (32), `liveKeystrokeP95` 30.79 (48), `openFile` 106.41 (160), `sourceOpenFile` 39.04 (100), `liveScrollFrameP95` 16.73 (33.4), `sourceScrollFrameP95` 10.99 (33.4), `firstFrame` 264.96 (500), `indexReady` 3350.09 (6000), `indexingKeystrokeP95` 31.48 (60) ms. CI `check` 1002 tests; `test:ci` 190 on both runners.

The cost of the highlighter change is visible in `sourceOpenFile`: 35.72 ms on `d0d65d6`, then 39.04–42.87 ms on later heads. That stays within the 100 ms limit, so the perf-gate policy requires no action.

### Remediation Checks

- Orphan check before `test:ci` (`pgrep -fl "src/app/main.ts|dist/so|bun test"`) → none; after → none.
- `bun test test/ui/bases.golden.test.ts` ×3 → `Passed` — 21 pass each run; 1 snapshot added on the first run.
- `bun run check` → `Passed` — 1002 tests, biome/tsc/knip zero findings, 4.38 s.
- `bun run test:ci` → `Passed` — 191 tests across 26 files, 34.22 s.
- The bench was not re-run: the remediation adds a test only. V44 evidence is the CI run on `06e27cf`.
- V20 `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` → no match. `KANBAN_TYPE: string | undefined = undefined`. `kanban-test` has no match in non-test `src`. `git diff main -- package.json bun.lock .github/workflows` → empty. Work-process identifier search over added lines in `git diff 1d6b191..HEAD -- src test scripts` → no match.
- Self-review of `1d6b191..f545ea0`: the only change since the verified range is the test file and its snapshot. The test reuses the existing `BOARD` fixture, `indexed`, `textFile`, `mountShell`, and `cellStyle`, and follows the table-embed test's pattern.
- No push, `gh pr edit`, amend, merge, tag, or release. No parent file edited.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all five tasks are implemented and delivered to an open PR. `P3-G1-VER2` is fixed with a committed board-embed golden. `P3-G1-VER1` is fixed: the delivery evidence is corrected here, and the corrected PR body is prepared for the orchestrator to apply.
- **Final report commit:** Returned to the orchestrator after this report is committed.
- **Final commits:** `181d749`, `840c6c2`, `d0d65d6`, `d820be7`, `fde80b6`, `10fa7c8`; remediation `f545ea0`
- **Final checks:** `bun run check` 1002 pass (4.38 s); `bun run test:ci` 191 pass (34.22 s); CI on PR head `06e27cf` green after the macOS re-run (`liveKeystrokeP95` 30.79 ms of 48); V20 empty; dependency and workflow diff empty.
- **Remaining issues:** The orchestrator applies the PR body from `pr-8-body.md` and re-checks CI on the final head. V30 is pending the user's Kanban fixture. Parent synchronization is pending and was not applied.
