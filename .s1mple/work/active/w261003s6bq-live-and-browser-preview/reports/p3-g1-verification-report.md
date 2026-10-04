# P3-G1 Verification Report

## Scope

- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4` (step 1 only, per the goal's Delivery sequencing)
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p3-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p3-g1-implementation-report.md`

Baseline: group range `607b12b`..`f6c98ee` on `feat/rm261003abzp-di3-live-preview`, verified at `HEAD` `f6c98ee`. Task commits: T1 `ee55fa9`, `352cf50`, `c58e8eb`; T2 `2348fa4`, `5ca1945`; T3 `a11c8a9`; T4 step 1 no change (PR #6). The working tree held only the orchestrator's uncommitted edit to `w261003s6bq-goal.md`, which this verification did not touch. Local machine: Apple M1 Max, 64 GB, macOS, which meets the parent reference-machine definition (RM261003ABZP-REQ9@R2: Apple M1 or newer, 8 GB, macOS).

## Status

`Failed`

The extension proof, the compiled binary, the fast gate, the CI suites, and the PR content all pass. The group fails on performance. The Linux CI bench gate (V44, S15) passes only on the faster class of GitHub runner, and a cross-run analysis shows it fails on the slower class, which was 7 of the 11 PH1/DI2-era runs. The local reference-machine readings also miss the inherited 1× targets (V45, parent V12@R2). Two Minor findings cover a design-record gap and an orphaned doc comment.

## Assigned Traceability

- **System Design:** `REQ1@R1, REQ3@R1, REQ6@R1, REQ7@R3 → DES1, DES2, DES3, DES6, DES12, DES14 → S13, S15, S16, S18 → V35, V38, V41, V42, V44, V45, V46, V47`. G4 cross-work gate evidence: V4, V38, and V41 on the PR head, and the signatures equal to the phase design (`rm261003abzp-roadmap-phase-2-obsidian-experience.md:205-230`); the gate stays `Pending` until the merge.
- **UI Design:** `Not applicable — parent UV9@R2 manual checklist (V42).`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1, REQ6 → DES1, DES14 → S16 → V38` | None | `csv` with highlighter, view-input provider, view-context builder, and scoped keymap works with no other source edited | `test/ui/extension.test.ts` "a csv file type works by registration alone" and "a csv key stays unbound outside csv files"; `git diff --stat 607b12b..f6c98ee -- src` shows no csv-specific code | `Satisfied` |
| `REQ1 → DES2, DES6, DES14 → S16, S18 → V41` | None | Command and keymap, syntax extension, block renderer and widget painter, and `grid` editor kind work by registration only | `test/ui/extension.test.ts` (three V41 cases plus the unregistered-kind fallback). Two `src` changes made the seams exist: `syntax.ts:syntaxExtensions` drops `readonly` (`ee55fa9`), and `update.ts:syncEditorKinds` with `types.ts:WindowState.content.editor: EditorKind` and `window-tree.ts` rebuild on kind change (`c58e8eb`, orchestrator refinement within S16) | `Satisfied` (refinement not yet in the W design: P3-G1-VER3) |
| `REQ1, REQ3 → DES14, DES2, DES3, DES6 → S15 → V44` | None | All bench medians within 2× on Linux CI, including first frame with `beautiful-mermaid` | `scripts/bench-gate.ts:TARGETS, BENCHES` (+4 targets, rule unchanged). CI on DI3 code: 2 of 4 runs failed (`openFile`, `indexingKeystrokeP95`); passes only on fast-class runners | `Mismatch` (P3-G1-VER1) |
| `REQ1, REQ3 → DES14 → S15 → V45` | None | Reference readings recorded at 1×; inherited RM261003ABZP-V12@R2/S9@R1 expect p95 < 16 ms and open < 50 ms on the reference machine | PR #6 body "Performance" table records readings; `liveKeystrokeP95` and `openFile` exceed 1× in all 4 local readings | `Mismatch` (P3-G1-VER2) |
| `REQ1 → DES14 → S15 → V46` | None | `check` < 30 s locally; CI < 3 min on the DI3 PR | Local `check` 5.02–5.69 s (5 runs); CI run 37175881079 wall time 1 min 38 s | `Satisfied` |
| `REQ7 → DES12 → S13 → V35` | None | Compiled binary serves page, KaTeX, Mermaid, and fonts with bytes equal to the package files, without `node_modules` | Fresh `bun run build`; binary run from an empty directory with an empty working directory; four routes byte-equal; 404 for an unknown asset | `Satisfied` |
| `REQ7 → DES12 → S13 → V42` | parent UV9@R2 (manual) | Math and Mermaid render offline; malformed blocks show source; only `127.0.0.1:<port>` requests; no CSP violation; recorded in the PR | Implementer's Playwright run on the compiled binary after the `a11c8a9` render-error fix; full checklist in the PR body. Fix inspected at `src/preview/page.js:104-106`, `page.css:312-321` | `Satisfied` |
| `REQ1, REQ3, REQ7 → DES1, DES3, DES12 → S16, S18 → V47` | None | `bun run check` passes with package homes and no Markdown in kernel or generic editor | 5 local runs, 737 pass each; `src/core/kernel`, `src/ui/editors`, `src/core/filetypes` unchanged in the group range | `Satisfied` |
| G4 hand-off (V4, V38, V41; signatures) | None | Signatures equal the phase design; V4/V38/V41 pass on the PR head; gate `Pending` | `live-preview.ts:15-47` `PreviewCtx`, `MarkdownViewInput`, `BlockRenderer`, `registerBlockRenderer`, `livePreview` unchanged in the range; `widgets/registry.ts` unchanged; PR body states `Pending` | `Satisfied` (gate `Pending` until merge) |
| `.s1mple/S1MPLE.md` Delivery step 1 | None | PR open, conflicts with `main` resolved, CI green, required PR content present | PR #6 `OPEN`, `MERGEABLE`, head `f6c98ee`; body carries G4 outputs, bench medians, binary size, pins, V42 checklist, pending parent sync, G4 `Pending` | `Satisfied` for step 1 (CI green on head, but see P3-G1-VER1) |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V38` | `S16` | `DES1, DES14` | `bun test src/core/lang/markdown/live-preview.test.ts test/ui/extension.test.ts`; inspection of `test/ui/extension.test.ts` | 32 pass, 0 fail, 18 snapshots (5 extension cases). The csv case paints `▸3 columns at <width>` from the registered builder, distinct highlighter styles, and `gC` → `2 data rows`; `gC` is inert in `.md` | `Passed` |
| `V41` | `S16, S18` | `DES2, DES6, DES14` | Same run; scratch probe outside the repo | `@grid(sales)` paints `GRID sales.xgrid` and `└─┴─┘`; `gH` and the palette run `grid.hello`; `t.grid` opens with `editor: "grid"` and paints `GRID VIEW 3 rows`; switching the window to a `.md` file rebuilds a text view. Probe: a restored session puts `t.grid` in `grid` and `a.md` in `text`, and the snapshot contains no `editor` field (`state.json` stays version 1) | `Passed` |
| `syncEditorKinds` cost per key | `S15` | `DES14` | Scratch probe: 200 `j`/`k` actions through `createUpdate` on a 5,000-line note | 4.59 ms for 200 full reducer steps (about 0.02 ms per key, including the reducer). The pass is O(windows) map lookups and returns the same `Result` object when no kind changes | `Passed` |
| `V44` | `S15` | `DES14, DES2, DES3, DES6` | `gh run view <id> --log` filtered for `median=` across 15 Linux CI runs (DI2, PH1, DI3) | DI3 runs: 37173732484 `openFile` 127.08 ✗, `indexingKeystrokeP95` 38.43 ✗; 37174620974 134.04 ✗, 38.60 ✗; 37175517956 96.54, 30.50; 37175881079 74.73, 25.00. All metrics move together with runner speed; the failures fall exactly on the slow runner class (analysis in P3-G1-VER1) | `Failed` |
| `V45` | `S15` | `DES14` | `bun run bench` once locally at `f6c98ee` | `sourceKeystrokeP95` 9.72, `liveKeystrokeP95` **20.02**, `openFile` **52.08**, `sourceOpenFile` 17.50, `liveScrollFrameP95` 10.80, `sourceScrollFrameP95` 8.31, `firstFrame` 189.16, `indexReady` 1846.91, `indexingKeystrokeP95` **22.10**; exit 0 (2×). Bold values exceed 1× | `Failed` |
| `V46` | `S15` | `DES14` | `/usr/bin/time -p bun run check` ×5; `gh run view 37175881079` timestamps | `check` 5.19, 5.21, 5.02, 5.63, 5.69 s; CI 04:03:37 → 04:05:15 UTC = 1 min 38 s | `Passed` |
| `V35` | `S13` | `DES12` | `bun run build`; scratch script copies `dist/so` alone into a `mktemp` dir and runs it under `test/e2e/pty.ts` `runInPty` from an empty working directory, PATH-stubbed `open`, `:Preview`, `fetch` + `Buffer.compare` | `dist/so` 83,940,210 B. `/` 200 `text/html; charset=utf-8` = `page.html`; `katex.min.js` 200 272,537 B equal; `mermaid.min.js` 200 5,493,176 B equal; `KaTeX_Main-Regular.woff2` 200 `font/woff2` 26,272 B equal; `/assets/nope.js` 404; CSP header on all five. Binary dir held only `so` before and after; no process left | `Passed` |
| `V42` | `S13` | `DES12` | Implementer's Playwright evidence (report §P3-G1-T3, PR body); code inspection of the fix. Not re-run by this verifier | 1200/375 px, light/dark: math and Mermaid render; malformed formula and diagram show source with `render error`; 88 requests, one origin `127.0.0.1:<port>`; no CSP violation; no page-level horizontal scroll | `Passed` |
| `V47` | `S16, S18` | `DES1, DES3, DES12` | `bun run check` ×5 | 737 pass, 0 fail each run; boundary test included | `Passed` |
| `test:ci` flake check | None | None | `CI=true bun run test:ci` ×5, then once more immediately after `bun run bench` (the reported failure condition) | 144 pass, 0 fail in all 6 runs (31.0–32.2 s). The unnamed failure did not recur in 6 runs; no flake reproduced | `Passed` |
| G4 signatures and kernel | `S18` | `DES2, DES6` | `git diff --stat 607b12b..f6c98ee -- src/core/kernel src/core/lang/markdown/live-preview.ts src/ui/widgets src/ui/editors src/core/filetypes` | Empty; current shapes at `live-preview.ts:15-47` match the phase design `:205-230` | `Passed` |
| Lockfile | None | None | `bun install --frozen-lockfile` | "no changes" | `Passed` |
| Work-process identifiers | None | None | `git diff 607b12b..f6c98ee -- src test scripts` added lines grepped for REQ/DES/S/V/UV/phase/goal/W/RM/G4/DI ids | None found | `Passed` |
| Bench validity | `S15` | `DES14` | Inspection of `test/bench/{live-keystroke,source-open,scroll}.bench.ts`, `source-keystroke.bench.ts`, `test/fixtures/generate.ts` | Same 200-key mix as `source-keystroke`; fresh process per run; median of 5 via the unchanged gate; `make5000LineTs` body moved unchanged; benches assert the expected view | `Passed` |
| PR #6 content and CI on head | `S15` | `DES14` | `gh pr view 6`; `gh run view 37175881079` | `OPEN`, `MERGEABLE`, head `f6c98ee`; `check`, `test (macos-15)`, `test (ubuntu-24.04)` green. Body has G4 outputs and `Pending` status, V4/V38/V41 results, CI and local medians, binary size, `katex@0.16.47`, `mermaid@12.1.0`, `beautiful-mermaid@1.1.3`, the V42 checklist, and the three pending parent-sync rows | `Passed` |

## Findings

### P3-G1-VER1 — Major — performance — Linux CI bench gate passes only on fast runners

- **System Design:** `REQ1@R1, REQ3@R1, DES14, DES2, DES3, DES6, S15, V44`
- **UI Design:** `None`
- **Evidence:** Every bench median co-varies with runner speed, and the CI history splits into two runner classes. Using `indexReady` and `sourceKeystrokeP95` (code paths DI3 barely touches) as the speed marker:

  | Runner class | Runs | `sourceKeystrokeP95` | `indexReady` | `openFile` | `indexingKeystrokeP95` |
  |---|---|---|---|---|---|
  | Fast, PH1/DI2 code | 4 (37158003638, 37152911833, 37152310027, 37151223129) | 6.1–6.9 | 2106–2212 | 44.3–47.2 | 5.9–13.5 |
  | Slow, PH1/DI2 code | 7 (37159035834, 37157114158, 37156313011, 37153013937, 37151048366, 37150892248, 37150055331) | 10.1–12.9 | 3106–3748 | 71.1–81.2 | 8.5–21.96 (one 43.73 ✗) |
  | Fast, DI3 code | 37175881079 (`f6c98ee`) | 7.22 | 2123 | 74.73 | 25.00 |
  | Middle, DI3 code | 37175517956 (`c58e8eb`) | 8.75 | 2726 | 96.54 | 30.50 |
  | Slow, DI3 code | 37173732484 (`a11c8a9`), 37174620974 (`8521c98`) | 12.2–12.6 | 3653–3683 | **127.08, 134.04 ✗** | **38.43, 38.60 ✗** |

  At the same runner class, DI3 `openFile` is about 1.65–1.7× DI2 (fast 74.7 vs 44–47; slow 127–134 vs 71–81). The ratio `openFile / sourceKeystrokeP95` is stable on DI3 (10.1, 10.9, 11.0, 10.4) against 6.1–7.1 on DI2. With the slowest observed `sourceKeystrokeP95` of 12.9 ms, DI3 projects to about 135 ms `openFile`. The implementer's "runner variance" reading is correct about the cause of the swing, but it means the green head is a fast-runner outcome: 7 of the 11 earlier runs landed on slow runners, where DI3 fails both metrics. No code change between `8521c98` and `f6c98ee` touches the open or keystroke paths.
- **Impact:** S15 is satisfied by chance. The DI3 PR, the work-folder-move push, and every later PR (DI4 included) are likely to fail CI on most runs, which pushes towards re-running CI until green and erodes the gate.
- **Required resolution:** Reduce the live-view open and per-key costs in code until the gate passes on slow-class runners with margin, without changing targets, the bench method, or rendering output. Concrete in-scope directions, from the implementer's own profiles (report "Blocker Resolution", B2):
  1. In `src/core/lang/markdown/mdast.ts`, select the GFM and math micromark extensions per block from cheap textual preconditions (for example, no `|` → no table extension, no `~` → no strikethrough, no `$` → no math, no `[^` → no footnote), keeping the mdast output identical. The implementer measured GFM at about 45% of the paragraph parse, and the no-extension upper bound cut `livePreview` on open from 16–24 ms to 10–14 ms. V4 goldens and `live-preview.test.ts` prove the output is unchanged.
  2. Cache that per-block selection with the parse by block hash so the edited block's per-key re-parse (about 0.47 ms per key, 204 parses per run) also gets cheaper, which shortens the indexing bench's typing window and the number of index batches landing inside it.
  3. If items 1–2 do not reach the proof below, the remaining costs are `parseDoc` (whole-note re-hash per edit), index `patch`, and the completion `poolFor` rebuild, which are DI2 modules. Changing them needs an orchestrator scope decision, which must be recorded rather than assumed.
- **Required proof:** On Linux CI, the bench gate passes on at least one slow-class run (same-run `indexReady` ≥ 3000 ms or `sourceKeystrokeP95` ≥ 10 ms) with `openFile` ≤ 85 ms and `indexingKeystrokeP95` ≤ 28 ms. Across every DI3 CI run after the fix, `openFile / sourceKeystrokeP95` ≤ 7.0 and `indexingKeystrokeP95 / sourceKeystrokeP95` ≤ 2.2. Also: `bun test src/core/lang/markdown` and `CI=true bun run test:ci` pass with unchanged snapshots, and the local `bun run bench` shows lower `openFile` and `liveKeystrokeP95` medians than this report's readings.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P3-G1-VER2 — Major — performance — Reference-machine readings miss the inherited 1× targets

- **System Design:** `REQ1@R1 (inherits RM261003ABZP-S9@R1, RM261003ABZP-V12@R2, RM261003ABZP-REQ9@R2), REQ3@R1, DES14, S15, V45`
- **UI Design:** `None`
- **Evidence:** W V45 says "reference-machine readings … recorded in the PR (targets 1×)". Read alone, that wording asks only for recording, and the PR records them. But REQ1@R1 inherits RM261003ABZP-S9@R1 ("targets … met on the reference machine") and V12@R2 ("p95 < 16 ms and open < 50 ms on the reference machine") and states "None waives one". The plan (P3-G1-T2 step 3) also says a missed target must be profiled and fixed, never loosened. The local Apple M1 Max qualifies as the reference machine. Four local readings across the group:

  | Target (1×) | `5ca1945` | `a11c8a9` | `c58e8eb` | `f6c98ee` (this run) |
  |---|---|---|---|---|
  | `liveKeystrokeP95` (16) | 16.73 | 18.23 | 18.19 | 20.02 |
  | `openFile` (50) | 57.63 | 51.87 | 54.51 | 52.08 |
  | `firstFrame` (200) | ≤ 200 | 199.03 | 225.35 | 189.16 |
  | `indexingKeystrokeP95` (16) | ≤ 16 | 11.13 | 13.54 | 22.10 |

  `liveKeystrokeP95` and `openFile` exceed 1× in every reading; `firstFrame` and `indexingKeystrokeP95` exceed it intermittently.
- **Impact:** The live-preview keystroke and open targets that the parent requirement defines as "fast and smooth" are not met on the reference machine, and the miss shares its cause with P3-G1-VER1.
- **Required resolution:** Bring the local medians of `liveKeystrokeP95` and `openFile` to ≤ 1× through the P3-G1-VER1 code changes, and re-check `firstFrame` and `indexingKeystrokeP95`. If a 1× target cannot be met within the group's scope, report it as a blocker for an orchestrator or user decision. Do not record it as satisfied, and do not loosen the target.
- **Required proof:** Two consecutive local `bun run bench` runs on the Apple Silicon reference machine with `liveKeystrokeP95` ≤ 16, `openFile` ≤ 50, `firstFrame` ≤ 200, `indexingKeystrokeP95` ≤ 16, recorded in the PR body's Performance table.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P3-G1-VER3 — Minor — documentation — The editor-kind refinement is not recorded in the design or the parent-sync list

- **System Design:** `REQ1@R1, DES1, DES14, S16, V41`
- **UI Design:** `None`
- **Evidence:** `c58e8eb` changes `WindowState.content.editor` from `"text"` to `EditorKind` (`src/core/state/types.ts:96-97`) and derives it in `src/core/state/update.ts:73-91`. The authoritative W system design still shows `content: { editor: "text"; … }` at `w261003s6bq-system-design.md:2018`, `:2028`, and `:2039`. The parent design describes non-text editors as `editorKinds.get(fileType.editor).open(path, text) → content {editor, state}` (`rm261003abzp-design-revisions.md:4947`). The refinement deliberately never calls `EditorKindSpec.open` and adds no editor state, so a non-text kind such as DI4's `base` still shows a text buffer and receives vim keys. REQ1@R1 requires "every `AppState` field … DI3 adds is reported for parent synchronization". The PR's "Pending parent synchronization" list names only the three progress rows. The implementation report says the refinement should be synced into the W design, but no W design update exists.
- **Impact:** DI4 planning would read a design that says `editor: "text"` and a parent design that promises `open` and editor state, while the code provides neither. That raises the risk of a wrong assumption at the G4 hand-off.
- **Required resolution:** Record the refinement in the W system design §6 window-state shape: `editor: EditorKind`, derived after each reducer step, `"text"` as fallback, not persisted, and `EditorKindSpec.open` and non-text content state left to DI4. Add the `WindowState.content.editor` type change and the unused `open` path to the PR's pending parent-synchronization list. Planning artifacts are orchestrator-owned, so the orchestrator decides which stage does this; Project Documentation Finalization is the natural place.
- **Required proof:** `rg -n 'editor: "text"' .s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md` shows no stale `WindowState` shape (or each hit is annotated with the refinement), and `gh pr view 6 --json body` lists the `content.editor` change under pending parent synchronization.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P3-G1-VER4 — Minor — maintainability — `createUpdate` lost its doc comment

- **System Design:** `DES14`
- **UI Design:** `None`
- **Evidence:** `c58e8eb` inserted `syncEditorKinds` and its doc comment between `createUpdate`'s existing doc comment and `createUpdate`, so two doc blocks are now adjacent at `src/core/state/update.ts:62-72`:

  ```ts
  /**
   * A pure reducer over the given registries; a thrown error keeps the
   * … targets stay loaded while they are embedded.
   */
  /**
   * Each window shows its buffer in the editor kind the buffer's file type
   …
  function syncEditorKinds(r: Result, reg: Registries): Result {
  ```

  Editors and TypeScript attach only the second block to `syncEditorKinds`, so `createUpdate` (the exported reducer factory) has no documentation, and the first block now describes the wrong symbol. It also does not mention that the reducer now derives editor kinds.
- **Impact:** The public reducer contract loses its hover documentation, and the stray block misleads readers.
- **Required resolution:** Move `syncEditorKinds` with its own comment above the orphaned block (or below `createUpdate`), so that the reducer comment sits directly on `export function createUpdate`. Add "each window's editor kind follows its file type" to that comment.
- **Required proof:** Inspection of `src/core/state/update.ts`: exactly one doc block directly precedes each of `syncEditorKinds` and `createUpdate`. `bun run check` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - registration-only `csv` (highlighter, view-input decoration via a registered builder, scoped key, key inert elsewhere);
  - registration-only command, keymap, palette, syntax extension, block renderer, and widget painter;
  - `grid` editor kind open, its registered view, and switching back to text in the same window;
  - unregistered kind falls back to `text`;
  - the per-block word count, including frontmatter, code, lists, and edits (`src/core/state/status.test.ts`);
  - bench coverage for live and source keystroke, open, and scroll.
- **Missing:**
  - No committed test restores a session whose window shows a registered non-text kind. The verifier's scratch probe shows it works: `t.grid` restores as `grid`, and the snapshot has no `editor` field. A `src/core/state/session.test.ts` case asserting `content.editor === "grid"` after `stateLoaded` and `fileLoaded`, and that `snapshotSession` emits no `editor`, would lock in "no persisted field". Minor; not raised as a finding.
  - No automated check covers the KaTeX `render error` label added in `a11c8a9` (`src/preview/page.js` is browser code, verified only through V42). Acceptable under the design's manual V42.

## Scope Changes

- `c58e8eb` adds the generic editor-kind seam (`WindowState.content.editor: EditorKind`, `syncEditorKinds`, `WindowTree` rebuild on kind change). The plan expected no `src` change for T1. The orchestrator decided on this refinement within approved S16 on 2026-10-04. It is judged correct, with negligible per-key cost (about 0.02 ms per reducer step for the whole reducer) and correct session restore. Its design-record gap is P3-G1-VER3.
- `ee55fa9` removes `readonly` from `syntaxExtensions` (`src/core/lang/markdown/syntax.ts:729`). This matches the parent design's `SyntaxExtension[]` registry. The new doc line notes that a syntax must be appended before the first parse because trees are cached by block content.
- `2348fa4` changes the statusline word count to per-block counting cached by block hash (`src/core/state/status.ts:39-66`). Output is unchanged (test compares against a naive whole-text count, including after edits).
- `a11c8a9` labels an unparsable KaTeX formula as a render error (`src/preview/page.js:104-106`, `page.css:312-325`). It keeps `throwOnError: false` and matches the design's §5 render-error policy.
- `test/support/ui.ts:MountOptions.reg` is a test-support-only registry override.
- No other unplanned changes. T4 steps 2–4 (folder move) are correctly not performed, per the goal's Delivery sequencing.

## Unverified Items

- V42 was not re-run by this verifier. The result rests on the implementer's recorded Playwright run against the rebuilt binary and on inspection of the `a11c8a9` fix.
- The cause attribution inside the live-open and live-keystroke costs (cold mdast parse, GFM share, index batches landing inside the typing window) comes from the implementer's local profiles. This verifier did not re-profile. The cross-run CI analysis in P3-G1-VER1 is this verifier's own.

## Blockers

None. Every assigned case ran or its evidence was inspected. The failures are findings, not environment blockers.
