# P3-G1 Verification Report

## Scope

- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`
- **Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p3-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p3-g1-implementation-report.md` (committed `06e27cf`)

Inspected range: `1d6b191..10fa7c8` (commits `181d749`, `840c6c2`, `d0d65d6`, `d820be7`, `fde80b6`, `10fa7c8`), plus the PR head `06e27cf`. Baseline: `main` = `origin/main` = `git merge-base HEAD origin/main` = `d398ad73781531100fe799894363a3d69ac50985` (after `git fetch origin`, 2026-10-04).

## Status

`Failed`

All five task outcomes are implemented, and every assigned V case passes locally and in CI on the PR head:

- base embeds render capped and read-only, with loading and missing states (V38);
- only file types with an embed model load as embeds, and `Enter` opens the base at the embedded view (V39);
- the tour goldens re-pass with the `base` renderer and a Base embed (V46);
- the fast gate, full suites, and unchanged extension suite pass (V43);
- the bench stays within its gates (V44);
- the V20 search is empty, and V30 is correctly `Pending — user fixture`.

Every binding constraint holds, and the delivery limits are respected: PR #8 is open and not merged, there is no tag, no release, and no force-push, and no parent file was edited.

The group fails on two Minor findings:

- **`P3-G1-VER1`:** the PR body quotes V44 as "All within the 2× gate" for `d0d65d6`, but CI on that head failed the bench. The body does not mention the `d820be7` fix or the CI evidence from the PR head, which the phase line 553 gate says the body must quote.
- **`P3-G1-VER2`:** the board path of the embed painter has no test.

## Assigned Traceability

- **System Design:** `W26100423LX-REQ11@R1 → DES15 → S20, S21 → V38, V39`; `W26100423LX-REQ13@R1 → DES16 → S23 → V43, V44, V46`; final search `REQ7@R2 → DES11 → S11 → V20`; reported pending `REQ9@R2 → DES9 → S16 → V30`; G4 (phase line 71) and phase line 553 re-checks (RM261003ABZP-V7@R2, V12@R3, V16@R2 via V43, V44, V46)
- **UI Design:** `None assigned — parent RM261003ABZP-UV3@R2 (tour.md with a Base embed) re-checked through V46`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ11@R1 → DES15 → S20, S21 → V39` | None | Only `tasks.base` (not a `.csv` with no builder) is read as an embed; `embedModel` answers `loading`, then a memoized model; `followLink` → `goTo` with `#Board`, window `kindState.view === "Board"`, also when the base is still loading | `src/core/state/embed-models.ts:20` `EmbedModelRegistry`; `src/core/state/embeds.ts:17` `embedTargets` (`reg.embedModels.has(reg.fileTypes.forPath(r.path).id)`); `src/core/state/markdown-view.ts:44` `embedModel`; `src/core/state/base-model.ts:239` `baseEmbedModel` over the shared `memoized` slot `embed:<path>#<view>`; `src/core/state/link-commands.ts:103` `ownKind` → subpath; `src/core/state/jumps.ts:68` `goTo`/`awaitLoad` carry `subpath`; `src/core/state/embed-models.test.ts` (6 tests) | `Satisfied` |
| `REQ11@R1 → DES15 → S20 → V38` | None | Widget `{ type: "base" }` = title + header + `embedMaxRows` + 1 with `↓ 20 more`; loading `min(10, 3)`; missing and non-model → title + notice; source view raw; nested embed stays a link | `src/core/features/bases/embed.ts:45` `baseEmbedOf`, `:93` `baseEmbedRenderer`; `src/ui/widgets/base.ts:570` `paintBaseEmbed` reusing `paintBaseTable`/`paintBaseBoard`; `src/core/features/bases/embed.test.ts` (5 tests: rows `1 + 2 + 10 + 1 = 14`, `more: 20`); `test/ui/bases.golden.test.ts` "a note paints an embedded base read-only, capped with a more marker" | `Satisfied` (board painting untested — `P3-G1-VER2`) |
| `REQ11@R1 → DES15 → S21` (browser preview) | None | The browser preview still shows a link | `src/core/lang/markdown/html.ts:80` `if (kind !== "embed" \|\| o.depth > 0) return wikiHtml(node, o);`; `git diff 1d6b191..10fa7c8 -- src/core/lang/markdown/html.ts src/preview` empty | `Satisfied` (by inspection) |
| `REQ13@R1 → DES16 → S23 → V46` | parent `UV3@R2` | `tour.md` goldens at widths 60 and 100 include the Base embed; other elements unchanged (RM261003ABZP-V7@R2) | `test/fixtures/tour.md` ends with `![[tasks.base#All tasks]]`. In the 18 `lang/markdown` tour goldens, the only removal per golden is the old closing line `78 │"`. Their additions are rows 78–80 only: the `↳ base ×3` loading widget in 16 goldens and the raw embed in 2 source goldens. `test/ui/__snapshots__/live-preview.test.ts.snap` adds frame goldens at widths 60 and 100 that show the evaluated table | `Satisfied` |
| `REQ13@R1 → DES16 → S23 → V44` | None | `liveKeystrokeP95` within 2× of 24 ms with the embed evaluated; other targets unchanged (RM261003ABZP-V12@R3) | `test/bench/live-keystroke.bench.ts` asserts a table model before timing and requires ≥ 100 frames with the embed; `test/fixtures/generate.ts` `EMBED_AT = 2540`; `TARGETS` unchanged | `Satisfied` |
| `REQ13@R1 → DES16 → S23 → V43` | None | `check` and `test:ci` pass; boundary test with the `yaml` home; `test/ui/extension.test.ts` unchanged; check < 30 s, CI < 3 min (RM261003ABZP-V16@R2) | `test/boundaries.test.ts:51` `yaml: ["src/core/lang/markdown/", "src/core/features/bases/"]`; `git diff main -- test/ui/extension.test.ts` empty; `registries()` (`src/app/main.ts:163-169`) and `testRegistries` (`test/support/state.ts`) mirror the markdown view context, the `base` embed model, and the block renderer; `registerWidgetPainter("base")` in `main()` (`:283`) and `mountShell` | `Satisfied` |
| `REQ7@R2 → DES11 → S11 → V20` | None | No `.base` special case outside its registration | `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` → no match | `Satisfied` |
| `REQ9@R2 → DES9 → S16 → V30` | None | Reported `Pending — user fixture`; `KANBAN_TYPE === undefined` | `src/core/features/bases/types.ts:8` `KANBAN_TYPE: string \| undefined = undefined`; `test/fixtures/bases/` holds no `obsidian-kanban.base`; PR body "Open items" | `Satisfied` (pending by design) |
| G4 — DI3 embed registries, before T1/T2 | None | Evidence recorded before `181d749` | Goal "Before P3-G1" baseline row ("G4 re-confirmed before P3-G1-T1") was added in `1d6b191` (18:05:48 +0700), before `181d749` (18:13:39 +0700); `e228bb5` is an ancestor of `1d6b191` | `Satisfied` |
| Delivery baseline, before T5 | None | `origin/main` = merge-base; parent DI4 records `Pending` | Re-checked now: `origin/main` = merge-base = `d398ad7`; index line 134 DI4 Work `Pending`, PR `Pending`; phase line 590 DI4 `Not started`, Work `Pending` | `Satisfied` |
| S1MPLE Delivery (PR, CI, folder move, push) | None | PR open with green CI before and after the move; folder in `work/done/`; references updated; no merge, force-push, tag, release, or parent edit | See Technical Verification; PR body evidence is stale (`P3-G1-VER1`) | `Mismatch` — `P3-G1-VER1` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V38`, `V39` | `S20`, `S21` | `DES15` | `bun test src/core/features/bases/embed.test.ts src/core/state/embed-models.test.ts` (with the other targeted suites) | 52 pass across 6 files, 20 snapshots (embed, embed-models, highlight, extension, live-preview component, bases golden) | `Passed` |
| `V46` | `S23` | `DES16` | `bun test test/ui/live-preview.test.ts`; snapshot diff inspection | Passes; the diff is purely additive (see Specification Verification) | `Passed` |
| `V43` fast gate | `S23` | `DES16` | `/usr/bin/time -p bun run check` | biome 304 files clean, tsc and knip clean, 1002 pass / 0 fail, 18 snapshots; wall time 9.21 s (< 30 s) | `Passed` |
| `V43` full suites | `S23` | `DES16` | Orphan check (none) → `/usr/bin/time -p bun run test:ci` → orphan check (none) | 190 pass / 0 fail across 26 files, 57 snapshots; 33.97 s | `Passed` |
| `V43` extension suite (RM261003ABZP-V16@R2) | `S23` | `DES16` | `bun test test/ui/extension.test.ts`; `git diff main -- test/ui/extension.test.ts` | Passes; diff empty | `Passed` |
| `V44` bench (RM261003ABZP-V12@R3) | `S23` | `DES16` | Orphan check (none) → `bun run bench` → orphan check (none) | Local medians (ms, limit): `sourceKeystrokeP95` 9.29 (32), `liveKeystrokeP95` 25.56 (48), `openFile` 73.16 (160), `sourceOpenFile` 24.01 (100), `liveScrollFrameP95` 19.22 (33.4), `sourceScrollFrameP95` 8.27 (33.4), `firstFrame` 181.31 (500), `indexReady` 1005.20 (6000), `indexingKeystrokeP95` 17.32 (60) — all `ok`. CI ubuntu-24.04 on `06e27cf`: 11.52, 30.79, 106.41, —, 16.73, 10.99, 264.96, 3350.09, 31.48 | `Passed` |
| `V20` | `S11` | `DES11` | `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` | No match (exit 1) | `Passed` |
| `V30` | `S16` | `DES9` | Inspect `KANBAN_TYPE`, `test/fixtures/bases/` | `undefined`; no fixture; README slot empty; reported in PR body | `Passed` (`Pending — user fixture`) |
| Dependencies and workflows | None | `DES16` | `git diff main -- package.json bun.lock .github/workflows \| wc -l` | 0 | `Passed` |
| Kernel unchanged | `S11` | `DES11` | `git diff main --stat -- src/core/kernel` | Empty | `Passed` |
| `lang/markdown` Bases-free | `S23` | `DES15` | `rg -n 'features/bases' src/core/lang` | Only `src/core/lang/markdown/live-preview.test.ts:9` (test); production imports none; boundary test passes | `Passed` |
| `kanban-test` test-only | `S16` | `DES9`, `DES16` | `rg -n 'kanban-test' src test scripts` | Only `*.test.ts` files and `test/support/state.ts:80` | `Passed` |
| Registries mirrored | `S23` | `DES16` | Compare `registries()` with `testRegistries`, and `main()` with `mountShell` | Same markdown context, `embedModels.register("base")`, `registerBlockRenderer("base")`, `registerWidgetPainter("base")`; the test adds only `kanban-test` | `Passed` |
| No work-process identifiers | None | S1MPLE Implementation | Added lines of `git diff 1d6b191..10fa7c8 -- src test scripts` against `W2610\|RM2610\|REQn\|DESn\|UVn\|Vn\|Pn-Gn\|Snn\|G4\|DIn` | No match | `Passed` |
| Existing goldens changed only by added rows | `S23` | `DES16` | Diffs of the three snapshot files | `lang/markdown` tour goldens: additive except the moved closing line; `test/ui` live-preview and bases goldens: 313 insertions, 0 deletions | `Passed` |
| Work-folder move and references | None | S1MPLE Delivery | `git diff -M 1d6b191..10fa7c8 --name-status -- .s1mple`; `rg -n 'work/active/w26100423lx' .s1mple`; `git diff --stat 1d6b191..10fa7c8 -- .s1mple/work/done/rm261003abzp-so-v1` | Every file is renamed into `work/done/`, with only path edits (R095–R100). Remaining `work/active/w26100423lx` mentions describe the move (plan 3 lines 406, 432–433; goal lines 11, 464). Nothing under `rm261003abzp-so-v1/` changed or references the work folder | `Passed` |
| CI | `S23` | `DES16` | `gh pr checks 8`; `gh run list`; `gh run view --json jobs` | 4/4 checks pass on `06e27cf`. Runs: `d0d65d6` 37198561239 failed the bench (`liveKeystrokeP95` 48.79 > 48); `d820be7` 37198934170 green (2 m 18 s); `fde80b6` 37199133718 green (2 m 12 s); `06e27cf` 37199361200 attempt 1 failed `test (macos-15)` at `test/ui/esc.test.ts:46` (60.63 ms vs 60 ms, test unchanged since `c98aa19`), attempt 2 green; wall time < 3 min per attempt. `10fa7c8` had no separate run and is covered by `06e27cf` | `Passed` |
| Delivery limits | None | S1MPLE Delivery | `gh pr view 8 --json state,mergeable,headRefOid,isDraft,mergedAt`; `git ls-remote --tags origin`; `gh release list`; PR timeline events; `git log origin/<branch>..HEAD` | `OPEN`, `MERGEABLE`, not a draft, `mergedAt: null`, head `06e27cf` = local `HEAD`. 0 tags, no releases. Timeline: 70 `committed` and 1 bot comment, no `head_ref_force_pushed`. No local commit is missing from the remote | `Passed` |
| PR body evidence | `S23` | `DES16` | `gh pr view 8 --json body` | Quotes local `d0d65d6` evidence, including V44 "All within the 2× gate" with `liveKeystrokeP95` 20.92 ms; does not mention `d820be7` or CI medians | `Failed` — `P3-G1-VER1` |
| Out-of-plan highlighter change (`d820be7`) | `S23` | `DES16` (perf), project perf-gate policy | Code review of `src/core/lang/code/highlight.ts:95`; `bun test src/core/lang/code/highlight.test.ts`; CI medians before and after | Acceptable (see Scope Changes) | `Passed` |
| Board embed painting | `S20` | `DES15` | Ad hoc probe (scratch script, deleted; tree clean): note embedding a `kanban-test` view at `embedMaxRows = 1` | Paints lane headers and one-line cards inside the frame. No committed test asserts this path | `Insufficient` — `P3-G1-VER2` |

## Findings

### P3-G1-VER1 — Minor — Delivery Evidence — PR body quotes stale V44 evidence that CI contradicts

- **System Design:** `W26100423LX-REQ13@R1, DES16, S23, V43, V44, V46`; phase line 553 cross-work gate ("pass on the PR head and are quoted in the PR body")
- **UI Design:** `None`
- **Evidence:** The PR #8 body section "Verification evidence (local, on `d0d65d6`)" states V44 "All within the 2× gate; `liveKeystrokeP95` 20.92 ms (limit 48)". CI on that same head (run 37198561239) failed the bench with `liveKeystrokeP95 median=48.79ms limit=48ms FAIL`. The body does not mention the follow-up highlighter fix `d820be7` or any CI medians from the PR head. On `06e27cf` those medians are `liveKeystrokeP95` 30.79 ms, 64% of the limit. The implementation report admits the stale body (Deviations item 8). It does not record that run 37199361200 needed `gh run rerun --failed` for `test (macos-15)` (`test/ui/esc.test.ts:46`, 60.63 ms against a 60 ms bound).
- **Impact:** The reviewer-facing record of the phase line 553 re-checks claims a bench pass on a head where CI failed. It also hides an out-of-plan production change (`src/core/lang/code/highlight.ts`) from the merge decision. The flaky wall-clock bound on macOS is unrecorded, so the next red run will look new.
- **Required resolution:** Update the PR body with the V43, V44, and V46 evidence from the current PR head: CI run, check and test results, bench medians, and the local results. The body names `d820be7` and why it was made, notes the `d0d65d6` bench failure, and notes the macOS `esc.test.ts` rerun on `06e27cf` as a pre-existing timing flake. `gh pr edit` needs the orchestrator's or the user's authorization.
- **Required proof:** `gh pr view 8 --json body` shows PR-head CI evidence and mentions `d820be7` and the rerun; the remediation section of the implementation report records the edit.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P3-G1-VER2 — Minor — Test Coverage — The board path of the base embed painter is untested

- **System Design:** `W26100423LX-REQ11@R1, DES15, S20, V38`
- **UI Design:** `None`
- **Evidence:** `paintBaseEmbed` (`src/ui/widgets/base.ts:570`) has a board branch, `paintBaseBoard(t.buf, t.theme, inner, m.board, { wide: false })`. Tests cover only the board's row arithmetic, through `baseEmbedOf` in `src/core/features/bases/embed.test.ts` ("a short table and a board take only the rows they need"). The only painted embed test, in `test/ui/bases.golden.test.ts` "base embed", uses a table view. An ad hoc probe painted the board correctly:

  ```text
  ╭ ↳ b.base#Board
  │ ● doing 1 ──────── ● done 1 ───────── ● todo 1 ─────────               ›
  │  review-pr          ship-release       write-report
  ```

  Nothing committed protects this path. The probe also showed one blank reserved row: an off-screen lane overflows, so the row for its `↓ N more` is reserved but off-screen.
- **Impact:** DES15 says `paintBaseEmbed` reuses the board painter read-only and capped. Nothing in the suite would catch a regression in one-line cards, in the per-lane `↓ N more` inside the reserved rows, or in the frame. The path becomes production-reachable as soon as `KANBAN_TYPE` is set.
- **Required resolution:** Add a component assertion, either a golden or row checks, for a note that embeds a `kanban-test` board with `embedMaxRows` below a lane's card count. The assertion covers lane headers, one-line cards, the per-lane `↓ N more`, the frame, and no focus marker.
- **Required proof:** `bun test test/ui/bases.golden.test.ts` passes with the new board-embed assertion.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - Embed loading only for file types that have a builder.
  - The loading → model sequence with memo identity.
  - Refused → missing.
  - `Enter` on a loaded or still-loading embed opens the base at `Board`.
  - The registry's duplicate refusal.
  - Renderer rows for a capped table (14 rows, `more: 20`), short tables, grouped tables, the board row count, a notice-only model, loading, missing, non-model, unresolved, nested-as-link, and the source view.
  - The painted table embed with `↓ 4 more`, `loading…`, `base not found`, and no focus marker.
  - Tour goldens in `lang/markdown` (18) and component frame goldens at widths 60 and 100.
  - The bench asserts that the embed is evaluated and on screen in at least 100 frames.
  - The highlighter's shifted-range reuse matches a fresh highlight.
- **Missing:**
  - Painting of a board embed (`P3-G1-VER2`).
  - The embed memo invalidating when the index or `.base` text changes is not asserted directly. It shares `memoized` and `sameKey` with the window model that V42 covers, so the risk is low.
  - `renderHtml` on `![[x.base]]` has no test; it is verified by inspection of `html.ts:80` and the unchanged file.

## Scope Changes

The implementer made four changes outside the plan's file list:

- **`d820be7` highlighter change (`src/core/lang/code/highlight.ts`).** This change is outside the plan's file list. It was made because CI failed the V44 gate (48.79 ms against 48 ms). It is acceptable:
  - It sits in `core/lang/code`, not the kernel, and keeps the `Highlighter` contract.
  - It needs no new dependency.
  - Repeated identical requests still return the same array.
  - Reused slices come from a highlight with at least as much look-back as a fresh one, so the result is the same or more accurate.
  - A colocated test covers it.

  The trade-off is that each cache miss now highlights about twice the window. CI source medians moved from `d0d65d6` to `fde80b6`/`06e27cf`: `sourceOpenFile` 35.72 → 42.87 ms, `sourceScrollFrameP95` 9.41 → 12.38/10.99 ms, `sourceKeystrokeP95` 11.98 → 12.84/11.52 ms. Local medians did not move this way, and all stay well within their gates. Under the perf-gate policy this needs no action. `P3-G1-VER1` covers disclosing it in the PR.
- **`src/core/lang/markdown/renderers/embed.ts` `embedAsLink`.** This is a Bases-free helper shared by both embed renderers, so the nested-embed rule has one owner. It is in scope.
- **Fixture placement.** The tour embed sits at the end of `tour.md`, and the bench embed sits at line 2540 rather than being appended. Both are justified: the golden diff stays additive, and the embed is on screen while the bench types. Other users of `make5000LineNote` (`open-file`, `scroll`) never reach line 2540 and do not index `tasks.base`.
- **`10fa7c8`.** This T2 comment reflow was committed after the T5 move. It is covered by CI on `06e27cf`.

## Unverified Items

- The delivery-boundary baseline check before T5 is time-ordered only by the implementer's report. The current state matches it (`origin/main` = merge-base = `d398ad7`; parent lines 134 and 590 `Pending`), and the PR was created at 2026-10-04T11:23:05Z, before the move commit `fde80b6`.
- The Linux CI bench is the authoritative V44 environment. Local medians on this machine (`liveKeystrokeP95` 25.56 ms) differ from the implementer's (11.50 ms) because of machine load. Both are within the gate.

## Blockers

None.
