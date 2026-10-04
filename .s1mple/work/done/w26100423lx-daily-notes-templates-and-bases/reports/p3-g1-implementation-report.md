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

- **Verification reports:** `Not yet produced`
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all five tasks implemented, verified, committed, and delivered to an open PR with CI green after the move.
- **Final report commit:** Returned to the orchestrator after this report is committed.
- **Final commits:** `181d749`, `840c6c2`, `d0d65d6`, `d820be7`, `fde80b6`, `10fa7c8`
- **Final checks:** `bun run check` 1002 pass (4.98 s); `bun run test:ci` 190 pass (33.1 s); `bun run bench` all medians within limits (`liveKeystrokeP95` 11.50 ms local, 31.38 ms CI); V20 empty; dependency and workflow diff empty; CI green on `fde80b6` (2 m 12 s).
- **Remaining issues:** V30 pending the user's Kanban fixture; parent synchronization pending; PR body evidence predates `d820be7` (item 8).
