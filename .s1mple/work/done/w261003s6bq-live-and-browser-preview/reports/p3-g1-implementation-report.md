# P3-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-3-extension-performance-delivery.md`
- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4` (step 1 only)
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p3-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Blocked`

The group is blocked by two open items:

1. **The Linux CI bench gate fails** on the PR head. `openFile` is 127.08 ms (limit 100) and `indexingKeystrokeP95` is 38.43 ms (limit 32).
2. **The `grid` editor-kind part of V41 cannot pass without a design decision.** The editor-kind seam it needs does not exist in `AppState` or in the open path.

Every other task outcome is implemented and verified. The PR is open: https://github.com/therealhieu/so/pull/6.

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P3-G1-T1` | `test/ui/extension.test.ts` (new: `csv` file type, view-context builder, scoped keymap and command; `grid.hello` command and keymap; `gridRef` syntax extension, `xgrid` block renderer and widget painter). `test/support/ui.ts:MountOptions.reg` (registry override, test support only). Defect fix: `src/core/lang/markdown/syntax.ts:syntaxExtensions` changed from `readonly SyntaxExtension[]` to `SyntaxExtension[]` | RED: `bun test test/ui/extension.test.ts` ran, but `tsc` failed with `TS2339: Property 'push' does not exist on type 'readonly SyntaxExtension[]'`, so a module could not register a syntax. GREEN: 3 pass, 13 expects; `bun run check` passes. `git diff --stat ee55fa9..352cf50 -- src` is empty. The `grid` editor kind is not covered (see Deviations) | `ee55fa9` (`fix(markdown)`), `352cf50` (`test(extension)`) | `Blocked` (V38 passes; V41 passes except the `grid` editor kind) |
| `P3-G1-T2` | `test/fixtures/generate.ts:make5000LineTs` (moved unchanged from `source-keystroke.bench.ts`). `test/bench/{live-keystroke,source-open,scroll}.bench.ts` (new). `test/bench/source-keystroke.bench.ts` (uses `make5000LineTs`). `scripts/bench-gate.ts:TARGETS, BENCHES` (+4 targets). Defect fix: `src/core/state/status.ts:countWords` counts per block, cached by block hash (`RenderCache`), plus a status test | `bun run bench` locally → exit 0, all 9 within 2×. `bun test src/core/state/status.test.ts` → 9 pass. Linux CI bench → **fails** (see Group Verification) | `2348fa4` (`fix(status)`), `5ca1945` (`test(bench)`) | `Blocked` (V44 fails on CI) |
| `P3-G1-T3` | Defect fix: `src/preview/page.js:renderBlocks` and `src/preview/page.css` (`div.math.render-error`). An unparsable formula now falls back to its source with the `render error` label | V35, V42, and V47 all pass on the rebuilt binary (evidence below) | `a11c8a9` (`fix(preview)`). The build, page, and gate evidence needs no file change | `Completed` |
| `P3-G1-T4` step 1 | No repository change. `git fetch origin`: `origin/main` has 0 commits ahead of `HEAD`, so no merge was needed. Pushed `feat/rm261003abzp-di3-live-preview` and opened PR #6; body updated with `gh pr edit --body-file` | `gh pr checks 6 --watch`: `check` ✓, `test (macos-15)` ✓, `test (ubuntu-24.04)` ✗ (bench gate) | No change — delivery step only; PR https://github.com/therealhieu/so/pull/6 | `Blocked` (CI not green) |

#### P3-G1-T1 evidence (V38, V41)

`test/ui/extension.test.ts` uses the real registries, store, reducer, and shell on the OpenTUI test renderer. Its registrations go into a `testRegistries()` instance passed through `MountOptions.reg`, and into the module-level `registerBlockRenderer`, `registerWidgetPainter`, and `syntaxExtensions`. Each test removes its syntax extension and painter afterwards.

- **V38 — "a csv file type works by registration alone":** `data.csv` opens with `fileType: "csv"` and `view: "table"`. The header row paints `▸3 columns at <width>`, where `<width>` is the `ViewHost.width` the registered builder received; this proves builder → `ViewSpec.input` → provider. The highlighter's two styles differ for adjacent cells and match for same-class cells. `gC` runs `csv.count` (`2 data rows`).
- **V38 — "a csv key stays unbound outside csv files":** `gC` does nothing in `notes/plan.md`.
- **V41 — "a command, syntax, block renderer, and widget painter extend the editor by registration alone":** `@grid(sales)` disappears from the frame. `GRID sales.xgrid` and `└─┴─┘` paint through the chain: registered syntax transform → embed-only render key `xgrid` (the designed G4 key route, as for `![[x.base]]`) → registered block renderer → `xgrid` widget → registered painter. `gH` and the palette (`<leader>:Grid: say<CR>`) both run `grid.hello`.
- The `grid` editor kind is **not** in the test. See Deviations 1.

#### P3-G1-T2 evidence (V44, V45)

The benches mirror the existing pattern: fresh process, `mountShell`, and time from key to the end of `renderOnce`.

| Bench | Setup |
|---|---|
| `live-keystroke` | `make5000LineNote` at 120×40, same 200-key mix as `source-keystroke`; asserts the note opened in `live` |
| `source-open` | `make5000LineTs` at 120×36 |
| `scroll` | `--file note` (live) or `--file ts` (source) at 120×40: 60 `j` (2 s at 30 Hz key repeat), then 40 `<C-d>` and 40 `<C-u>`; each frame timed from key to render end |

`openFile` is unchanged and now opens the note in `live`.

Profiling while measuring `liveKeystrokeP95` showed an O(n) statusline word count on every edit (`countWords` re-scanned all 5,000 lines, about 2 ms per key). It is fixed in `2348fa4`. In the same scratch profile run the reading went from about 20.5 to about 17.6 ms.

**V45 reference readings** (local final code `a11c8a9`, Apple Silicon macOS, `bun run bench`, median of 5, ms):

| Target | 1× | Local | 2× limit | Linux CI (run 37173732484) |
|---|---|---|---|---|
| `sourceKeystrokeP95` | 16 | 9.30 | 32 | 12.56 |
| `liveKeystrokeP95` | 16 | **18.23** (over 1×) | 32 | 20.94 |
| `openFile` | 50 | **51.87** (over 1×) | 100 | **127.08 FAIL** |
| `sourceOpenFile` | 50 | 17.87 | 100 | 37.30 |
| `liveScrollFrameP95` | 16.7 | 9.52 | 33.4 | 16.22 |
| `sourceScrollFrameP95` | 16.7 | 9.67 | 33.4 | 9.32 |
| `firstFrame` | 200 | 199.03 | 400 | 334.36 |
| `indexReady` | 3000 | 1719.79 | 6000 | 3682.88 |
| `indexingKeystrokeP95` | 16 | 11.13 | 32 | **38.43 FAIL** |

An earlier local gate run on `5ca1945` read `liveKeystrokeP95` 16.73 and `openFile` 57.63; all other targets were within 1×.

#### P3-G1-T3 evidence (V35, V42, V47)

**V35.** `bun run build` produces `dist/so` of 83,940,210 bytes (80.1 MiB). It was copied alone into a fresh `mktemp` directory and run from there under a PTY (`test/e2e/pty.ts` `runInPty`), on a temp workspace (`tour.md`, `so-roadmap.md`, `diagram.png`, `broken.md`), with PATH-stubbed `open`/`xdg-open` and `:Preview`. Results on the rebuilt binary:

| Route | Response | Bytes equal to |
|---|---|---|
| `/` | 200 `text/html; charset=utf-8` | `src/preview/page.html` |
| `/assets/katex.min.js` | 200 `text/javascript; charset=utf-8`, 272,537 B | `node_modules/katex/dist/katex.min.js` |
| `/assets/mermaid.min.js` | 200 `text/javascript; charset=utf-8`, 5,493,176 B | `node_modules/mermaid/dist/mermaid.min.js` |
| `/assets/fonts/KaTeX_Main-Regular.woff2` | 200 `font/woff2`, 26,272 B | `node_modules/katex/dist/fonts/KaTeX_Main-Regular.woff2` |

`katex.min.css`, `page.js`, and `page.css` are also byte-equal. The binary directory held only `so` before and after the run. Versions are exact pins: `katex@0.16.47`, `mermaid@12.1.0`, `beautiful-mermaid@1.1.3`.

**V42 (parent UV9@R2), agent-run with Playwright MCP (Chromium) on the compiled binary.**

- **Network method:** `context.setOffline(true)` also blocked `127.0.0.1` (`net::ERR_INTERNET_DISCONNECTED`). Instead, every request whose host was not `127.0.0.1` was route-aborted, and every request was logged.
- **First run, defect found:** the malformed formula showed red source (KaTeX `katex-error`) without the `render error` label the design (§5 "KaTeX or Mermaid render error in the page") and the parent M7 Error row require. Fixed in `a11c8a9`, rebuilt, and re-run in full.
- **Results after the fix:**

| Check | 1200 light | 1200 dark | 375 light | 375 dark |
|---|---|---|---|---|
| Math renders (tour: 2 KaTeX) | ✓ | ✓ | ✓ | ✓ |
| Mermaid renders (tour: 1 SVG) | ✓ | ✓ | ✓ | ✓ |
| Malformed `\frac{1}{` → source + `render error` | ✓ | ✓ | ✓ | ✓ |
| Malformed flowchart → source + `render error` | ✓ | ✓ | ✓ | ✓ |
| `scrollWidth <= clientWidth` | 1185≤1185 / 1200≤1200 | same | 360≤360 / 375≤375 | same |
| Body bg / fg | `#FBFBFA` / `#1F2328` | `#16181C` / `#E6E8EB` | light | dark |

- **Network:** 88 requests, one origin `http://127.0.0.1:<port>`. 0 aborted (no other host was requested). Paths seen: `/tour.md`, `/broken.md`, `/render`, `/events`, `/file/diagram.png`, `/assets/{katex.min.css,page.css,katex.min.js,mermaid.min.js,page.js}`, and `/assets/fonts/KaTeX_{Math-Italic,Main-Regular,Size2-Regular}.woff2`.
- **Console:** no messages during the checklist run. Across the session the only console errors are `/events` `ERR_INCOMPLETE_CHUNKED_ENCODING`/`ERR_CONNECTION_REFUSED` after a deliberate stop or kill. No CSP violation.
- **Badge states:** `Live` → `:PreviewStop` → `Stopped` with banner "Preview stopped in so — updates have ended.". Then `:Preview` (new port) → `Live` → SIGKILL of the app → `Reconnecting…` at once → `Offline` 10 s after the loss, with banner "so is not reachable — showing the last copy.". Math and the diagram stay rendered.
- **Screenshots:** 15 PNGs in the session scratchpad `…/scratchpad/v42/` (`tour-*`, `broken-*`, `badge-{stopped,reconnecting,offline}`). Not committed.
- **Cleanup:** the browser is closed, and no `so` or harness process remains (`pgrep` → none). Temp directories were removed by the harness.

**V47.** `bun run check` → 737 pass, 18 snapshots (biome, tsc, knip, boundaries, unit), 5.43 s real. `CI=true bun run test:ci` → 142 pass, 0 fail, 31.7 s.

#### P3-G1-T4 step 1 evidence

- `git fetch origin`: `git rev-list --count HEAD..origin/main` → 0. No remote branch or PR existed before.
- `git push -u origin feat/rm261003abzp-di3-live-preview` → new branch. `gh pr create --base main --title "feat: DI3 live and browser preview (W261003S6BQ)" --body-file …` → https://github.com/therealhieu/so/pull/6.
- **CI run 37173732484** (https://github.com/therealhieu/so/actions/runs/37173732484) on `a11c8a9`:
  - `check` success, 23 s;
  - `test (macos-15)` success, 39 s;
  - `test (ubuntu-24.04)` failure: `test:ci` passed, then `bun run bench` failed with `openFile median=127.08ms limit=100ms FAIL` and `indexingKeystrokeP95 median=38.43ms limit=32ms FAIL`.
  - CodeRabbit review completed.
- **V46:** CI wall time 2 min 11 s (03:19:17 → 03:21:28 UTC), under 3 min. Local `bun run check` 5.43 s, under 30 s.
- **PR body** carries: the summary and V results; the G4 outputs with paths and symbols; V4/V5 (`live-preview.test.ts` 27 pass, 18 snapshots) and V38/V41 results on the head; local and CI bench medians; binary size; versions; the V42 checklist; both open blockers; pending parent synchronization (index `:133` PR column, index `:144` Work Progress stage, phase `:586` Progress row); G4 status `Pending`.
- Steps 2–4 (work-folder move) were not performed, as assigned.

### Group Change Range

- **Starting commit:** `607b12b` (tree clean at start; no staged or unstaged changes)
- **Final commit:** `a11c8a9` (before this report's commit)
- **Remaining group changes:** None. `dist/` and `.so-bench/` are git-ignored build outputs, and `.playwright-mcp/` is git-ignored. Scratch scripts, bench profiles, and screenshots are in the session scratchpad only.

### Group Verification

- `bun run check` (timed) → `Passed` — 737 pass, 5.43 s.
- `CI=true bun run test:ci` → `Passed` — 142 pass, 0 fail.
- `bun run build` → `Passed` — `dist/so` 83,940,210 B; the worker is compiled in (V35 run served the page and the index ran from the copied binary).
- `bun run bench` (local) → `Passed` — exit 0, medians in the V45 table.
- `bun install --frozen-lockfile` → `Passed` — "no changes".
- `gh pr checks 6` on `a11c8a9` → `Failed` — Linux bench gate (`openFile`, `indexingKeystrokeP95`).
- Self-review of the full group diff (`git diff 607b12b..a11c8a9`, 15 files): no work-process identifiers in code, test names, or comments. Kernel, `RenderLine`, `layoutText`, `src/ui/editors`, `live-preview.ts`, and `widgets/registry.ts` are unchanged, so the G4 signatures are unchanged. No new product behaviour beyond the three defect fixes.

### Deviations and Remaining Issues

1. **Blocker — `grid` editor kind (V41 part, S16).** The `.grid` file type cannot open as `{ editor: "grid" }` by registration alone:
   - `WindowState.content.editor` is the literal type `"text"` (`src/core/state/types.ts:95`).
   - `showBuffer`/`removeBuffer` in `src/core/state/buffers.ts` always write `editor: "text"`.
   - `session.ts` restores `editor: "text"`.
   - Nothing calls `EditorKindRegistry.get(...).open`.
   - The UI side (`registerEditorView`, `window-tree.ts:89`) already picks a view by `content.editor`.

   The parent design (`rm261003abzp-design.md:274`) describes `editorKinds.get(fileType.editor).open(path, text) → content {editor, state}`. Neither the W design nor this plan defines the non-text window-content shape, its session handling, or its open path, and DI4's `base` editor kind will be its first user. Implementing it here would change the `AppState` contract and add product behaviour, so it was not done. **Decision needed:** (a) implement the generic non-text editor-kind open path in DI3 (design amendment), or (b) move the `grid` editor-kind proof to DI4 with the `base` kind (re-scope V41/S16).
2. **Blocker — Linux CI bench gate (V44).** Last green `main` CI (run 37159035834) read `openFile` 71.50 and `indexingKeystrokeP95` 21.96. DI3 reads 127.08 and 38.43. Both benches now run in `live`, the new default. Measured causes:
   - **`openFile`:** a scratch phase timer on a cold open shows `livePreview` at 16–21 ms locally. That is the first, cold mdast parse of the visible 49-line paragraph and the renderers' first run. Source-view open of the same note on DI3 is about 33 ms; on `main` it is about 32 ms. The CI ratio (about 2.3× local) accounts for the +55 ms.
   - **`indexingKeystrokeP95`:** with the full 10,000-note index, live typing costs a median of 1.15 ms per key against 0.62 ms in source. The difference is the fresh mdast parse of the edited paragraph through `reveal` → `renderKey` → `blockNode`. The bench's p95 also includes index batches applied during typing, so a slower typing window collects more batches.
   - **Tried and reverted (no measurable gain):** building the micromark extensions once in `mdast.ts`; marking a fully revealed block as revealed without computing its render key. The bench's typed line joins the paragraph above it, so the shortcut never applied.
   - **Remaining options (design decisions):** warm the Markdown parser at startup (with a matching harness, so the bench is not gamed); avoid re-parsing the edited block per key; make `parseDoc` incremental (DI2 code). No target was loosened.
3. **V45 1× readings over target** (2× passes locally): `liveKeystrokeP95` 18.23 and `openFile` 51.87. Causes as in item 2, plus `parseDoc` re-hashing the whole note per edit (about 3 ms per key on 5,000 lines, DI2 code).
4. **Fixes outside P1 modules, kept within their owning decisions:**
   - `syntax.ts` (DI2 module): a type-only change matching the parent design's `syntaxExtensions: SyntaxExtension[]` registry.
   - `status.ts` (P2-G1): a performance fix with identical output.
   - `page.js`/`page.css` (P2-G1): the render-error label for formulas.

   A remediator must keep `throwOnError: false` (design §7 shape). The label comes from detecting `.katex-error` after rendering.
5. **The V41 syntax route is designed this way:** the test's syntax extension rewrites `@grid(x)` into an `embed` node targeting `x.xgrid`, so the embed-only render key gives `xgrid`. This is the designed G4 route for a new block type (`render-key.ts` `embedOnly`, as `![[file.base]]` → `base`). `renderKey` has no other way to reach a new key from a new mdast node type.
6. **Commit subject wording:** the plan-mandated subject of `352cf50` says "prove csv and grid extension"; the `grid` editor-kind part is blocked as described in item 1. History was not amended.
7. **Process note:** during profiling, `git stash` and a detached checkout of `607b12b` happened by mistake. They were reverted at once (`git checkout` of the branch, then `git stash pop --index`), and the staged bench changes were restored intact before `5ca1945`.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `Pending verification`
- **Status:** `Pending verification`

### Finding Closure

None yet.

## Blocker Resolution

Written by the same implementer after the orchestrator decisions of 2026-10-04 on the two blockers. The sections above are unchanged.

### B1 — `grid` editor kind (V41)

**Closed** by `c58e8eb` `feat(state): open files in their file type's registered editor kind` (`Task: P3-G1-T1 — Registration-only extension proof`).

| File | Change |
|---|---|
| `src/core/state/types.ts` | `WindowState.content.editor` widened from the literal `"text"` to `EditorKind` |
| `src/core/state/update.ts` | `syncEditorKinds`, one post-step pass in `createUpdate`: each window takes the `editor` its buffer's file type names when that kind is registered in `EditorKindRegistry`, and `"text"` otherwise. Unchanged windows keep their identity |
| `src/ui/views/window-tree.ts` | `WindowTree` records the kind each view was made for and makes a new view when a window's kind changes |
| `test/ui/extension.test.ts` | Two cases: a `.grid` file opens with `content.editor === "grid"` and paints through the registered `grid` view; an unregistered kind falls back to `"text"` |

**Design refinement to sync into the W system design (§6 window state, within approved S16):** `content.editor` is `EditorKind`, derived after every reducer step from the registered file-type kind, with `"text"` as the fallback. No new state and no persisted field: the session snapshot is unchanged, and writers such as `showBuffer` still write `"text"` and the pass corrects it. The pass was chosen over threading the registries through `showBuffer`, `removeBuffer`, and `fillRestored`, because the `save.ts` callers have no registry.

Evidence on `c58e8eb`: `bun test test/ui/extension.test.ts` 5 pass (V38 and every V41 part, including `grid`); `bun run check` 737 pass.

### B2 — Linux CI bench gate (V44)

**Gate green on `c58e8eb`; no code fix found or committed.** The two failing medians are now under their limits, but by small margins, and the earlier failures came from the same code. Treat the gate as at risk of failing again on a slower runner.

| Target (Linux CI) | Limit | Run 37173732484 (`a11c8a9`) | Run 37174620974 (`8521c98`) | Run [37175517956](https://github.com/therealhieu/so/actions/runs/37175517956) (`c58e8eb`) |
|---|---|---|---|---|
| `openFile` | 100 | 127.08 ✗ | 134.04 ✗ | **96.54** ✓ |
| `indexingKeystrokeP95` | 32 | 38.43 ✗ | 38.60 ✗ | **30.50** ✓ |

`c58e8eb` changes only window-kind state and does not touch the open or keystroke paths, so the drop comes from runner variance, not from a fix.

**Profile evidence** (local, Apple Silicon; scratch scripts and `.cpuprofile` files kept in the session scratchpad):

- **`openFile`, live vs source**, 3 fresh processes each, timing wrappers around each phase:

  | Mode | dispatch | `show` | `livePreview` (1 call) | `parseDoc` |
  |---|---|---|---|---|
  | source | 28–44 ms | 5–9 ms | — | 14–25 ms |
  | live | 43–59 ms | 22–30 ms | 16–24 ms | 17–29 ms |

  Timing `blockNode` directly puts the live extra on two mdast parses of the first screen: the `## Section 1` heading (3.1–4.9 ms, the first parse of the process) and the 49-line paragraph below it (9.4–11.4 ms, against 3.2 ms when the parser is warm). The rest of `livePreview` (reveal, inline decorations) is about 3 ms. `parseDoc` (existing DI2 code) is the largest single cost in both modes and the main source of run-to-run noise.
- **`indexingKeystrokeP95`, live vs source**, 5 runs each: p95 3.3–6.3 ms (source) vs 9.9–16.0 ms (live). The p95 is the 10th-slowest of 200 keys. In live view the typing loop takes about 0.9 ms more per key, of which the edited block's mdast re-parse is about 0.47 ms (204 parses, 95 ms per run). That lengthens the typing window from about 0.95 s to 1.25 s, so 6–8 index batches land inside it instead of 2–4. The slowest keys are those batch applications (`patch`, existing DI2 code, cost grows with index size) and link-completion pool rebuilds over the larger index (`poolFor` → `linkText` → `bestCandidate`, existing DI2 code). So the p95 is set by batch and completion keys, and live view moves it mainly by giving the index time to grow.

**Fixes attempted and measured (none kept):**

| Attempt | Effect | Kept |
|---|---|---|
| Build the micromark and mdast extensions once in `mdast.ts` | Fixed per-parse overhead is about 0.06 ms; no measurable change in either median | No |
| Treat a block as revealed when all its lines are revealed, skipping `renderKey` | No gain: the indexing bench's edited block spans 2 lines; it also changes the `reveal.test.ts` expectation | No |
| Force GC per key (`Bun.gc`) | Distorts the bench (indexing finished before the keys did) | No |
| Upper bound: parse with no GFM or math extensions (measurement only) | `livePreview` on open drops to about 10–14 ms; open stays about 40–50 ms because of `parseDoc` | Not a candidate: it changes rendering |

**Why no in-scope fix reaches the targets the orchestrator set** (local `openFile` ≲ 35 ms, `indexingKeystrokeP95` ≲ 8.5 ms): a live open must parse the visible blocks, and the edited block must be re-parsed on every key. Both are the per-block parse that the live-preview design requires, and both are already cached by block content. Parsing only the visible lines of a block would change how inline syntax that spans lines is read. Deferring the parse would show source first, which is new product behaviour. Warming the parser at startup moves cost into `firstFrame` (local 225 ms, target 200). An idle warm-up does not reach the bench, which opens the note on the first frame. The remaining large costs (`parseDoc`, index `patch`, completion `poolFor`) are DI2 code outside this group's scope. Options that would give a real margin, each needing a decision outside this group: an incremental `parseDoc`, a completion pool that is not rebuilt in full on every index batch, or a GFM extension set picked per block from cheap textual preconditions (for example, no `|` means no table attempt). Measured on the paragraph used here, GFM is about 45% of parse time.

### New readings

| Target | 1× target | Local `bun run bench` on `c58e8eb` | Linux CI run 37175517956 | 2× limit |
|---|---|---|---|---|
| `sourceKeystrokeP95` | 16 | 9.63 | 8.75 | 32 |
| `liveKeystrokeP95` | 16 | **18.19** | 15.93 | 32 |
| `openFile` | 50 | **54.51** | 96.54 | 100 |
| `sourceOpenFile` | 50 | 23.19 | 29.43 | 100 |
| `liveScrollFrameP95` | 16.7 | 11.26 | 12.18 | 33.4 |
| `sourceScrollFrameP95` | 16.7 | 9.20 | 7.14 | 33.4 |
| `firstFrame` | 200 | **225.35** | 249.19 | 400 |
| `indexReady` | 3000 | 1679.83 | 2725.51 | 6000 |
| `indexingKeystrokeP95` | 16 | 13.54 | 30.50 | 32 |

Bold local values exceed 1×. Every value passes the 2× gate. No target or bench method changed.

### Checks on `c58e8eb`

- `bun run check`: pass, 737 tests, 5.17 s wall (V46 < 30 s).
- `CI=true bun run test:ci`: 144 pass in 4 of 5 local runs. The first run, made right after `bun run bench`, had 1 failure whose name was not captured; the 4 runs after it passed, and CI passed.
- `bun run bench`: pass (table above).
- PR #6 CI run [37175517956](https://github.com/therealhieu/so/actions/runs/37175517956): `check` ✓ (20 s), `test (macos-15)` ✓ (37 s), `test (ubuntu-24.04)` ✓ (1 min 49 s). Wall time 1 min 52 s (V46 < 3 min).

## Final Status

`Implemented with risk`

### Final Evidence

- **Final report status:** `Implemented with risk`. B1 is closed by `c58e8eb`. For B2, the Linux CI bench gate is green on `c58e8eb` without a code fix, with thin margins (`openFile` 96.54/100, `indexingKeystrokeP95` 30.50/32), and two earlier runs on equivalent code failed. See Blocker Resolution, B2.
- **Final report commit:** returned to the orchestrator.
- **Final commits:** `ee55fa9`, `352cf50`, `2348fa4`, `5ca1945`, `a11c8a9`, `c58e8eb`.
- **Final checks:** `bun run check` pass (5.17 s); `CI=true bun run test:ci` 144 pass (one unexplained failure in 1 of 5 local runs); local `bun run bench` pass; PR #6 CI run 37175517956 all green.
- **Remaining issues:** the bench gate risk in B2, which supersedes Deviation 2, and Deviations 3–7 above. Deviation 1 (the `grid` editor kind) is closed.

## Remediation After Verification

Written by a fresh implementer after the verification report (`06886c7`, `Failed`, findings P3-G1-VER1 to VER4) and the orchestrator decisions in `2495edd`. The sections above are unchanged; this section supersedes the placeholder under "Remediation".

- **Verification reports:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p3-g1-verification-report.md`
- **Status:** `Completed`
- **Remediation range:** `2495edd`..`00011bd`

### Binding decisions applied

The user approved relaxed live and startup targets on 2026-10-04. `scripts/bench-gate.ts` `TARGETS` now matches the W requirements Constraints and system design §7: `liveKeystrokeP95` 16 → 24, `openFile` 50 → 80, `firstFrame` 200 → 250, `indexingKeystrokeP95` 16 → 30. The source targets, the gate rule (median of 5 above 2× fails), and every bench method are unchanged. The orchestrator also asked for four output-preserving speedups, applied in order and each kept only when measured to help. Per-block GFM extension selection and an incremental completion pool were not attempted, as instructed.

### Load on the machine during this remediation

Ten orphaned `yes` processes (one per core), started at 09:53:42 from the `so` repository by an earlier agent of this session, held the load average at 35–40. On the coordinator's instruction they were killed at about 12:09, and the load fell below 8 within two minutes. Consequences:

- The first "before" bench and every A/B measurement ran under that load. A/B runs alternated the two trees, so both sides shared it, and only the A/B differences are used as evidence for each speedup.
- The clean "before" and both clean "after" runs below were taken after the cleanup.
- The verifier's local readings (taken after 09:53) were most likely inflated by the same load. The clean "before" on `e5602b4` already reads `liveKeystrokeP95` 9.28 and `openFile` 40.42, against the verifier's 20.02 and 52.08.

### Speedups

Effects are medians of alternating A/B runs: A is the commit before the speedup and B the working tree with it.

| Speedup | Change | Output equality evidence | Measured effect | Commit | Kept |
|---|---|---|---|---|---|
| Lazy `beautiful-mermaid` | `src/core/lang/markdown/renderers/mermaid.ts`: `import type`, memoized `require` on the first diagram | `bun test src/core/lang/markdown` and `test/boundaries.test.ts` pass; `bun run build` bundles it, and the compiled binary copied alone into a temp dir draws a `graph TD` diagram as box-drawing lines in a PTY | `firstFrame` 474.5 → 289.9 ms (7 rounds) | `77ce68c` | Yes |
| Scanner trigger skip | `src/core/lang/markdown/syntax.ts`: optional `SyntaxExtension.triggers`; `scanLine` skips the scanner and its claims build on a line containing none. Built-ins: comment `%%`/`<!--`, embed `![[`, wikiLink `[[`, markdownLink `](`, tag `#`, blockId `^`. Extensions without `triggers` run on every line | Per-scanner reading: `scanComments` returns early without `%%`/`<!--`; `wikiMatches` returns when `indexOf(open)` is -1; `scanMarkdownLinks` returns early without `](`; `TAG_RE` needs `#`; `BLOCK_ID_RE` needs `^`. New test "skipping scanners by trigger leaves every scan unchanged" compares `scanDoc` with and without the skip over `tour.md`, the markdown corpus, and 200 seeded random documents; it fails under three mutated triggers | cold `parseDoc` 25.5 → 14.6 ms (11 rounds); `openFile` 136.9 → 101.5 ms (9 rounds) | `50f9222` | Yes |
| Block-hash reuse | `src/core/lang/markdown/doc.ts`: `WeakMap<Doc, TextBuffer>`; `unchangedHashes` finds the equal head and tail lines and reuses a previous block's hash at the matching start line with the same kind and line count; ids computed as before | Existing "incremental parse equals a fresh parse" plus new "incremental parse of a long note equals a fresh parse" (6 seeds × 120 random edits on a 4× note, with a `prev` up to 3 edits old); fails under three mutated reuse conditions | `parseDoc` per edit 1.52 → 0.38 ms (9 rounds); `liveKeystrokeP95` 92.1 → 61.6 ms; `indexingKeystrokeP95` 42.5 → 40.6 ms (loaded) | `4603fdb` | Yes |
| Paragraph fast path | `src/core/lang/markdown/blocks.ts`: `LETTER_LINE = /^ {0,3}[A-Za-z]/` continues the paragraph before the blank, `SETEXT`, `interrupts`, and `LIST_INTERRUPT` checks | By reading: `SETEXT` needs `=`/`-`; `ATX` `#`; `openFence` a backtick, `~`, or `$`; `THEMATIC` `-`/`*`/`_`; `opensComment` `%%`; `HTML_COMMENT`, `HTML_RAW`, `HTML_BLOCK` `<`; `LIST_INTERRUPT` `-`/`+`/`*`/`1`; a letter line is not blank. All Markdown suites, goldens, and the conformance test pass unchanged | `splitBlocks` 2.06 → 1.17 ms cold (15 rounds), 0.22 → 0.09 ms warm; whole cold `parseDoc` and `openFile` showed no difference above the noise | `00011bd` | Yes |

### Bench medians

`bun run bench`, median of 5 fresh-process runs, ms.

| Target | 1× (new) | Loaded before (`8a79835`, old targets) | Loaded after (`00011bd`) | Clean before (`e5602b4`) | Clean after, run 1 (`00011bd`) | Clean after, run 2 (`00011bd`) | Linux CI (`00011bd`, run 37178733100) | 2× limit |
|---|---|---|---|---|---|---|---|---|
| `sourceKeystrokeP95` | 16 | 43.34 | 16.91 | 3.99 | 4.41 | 4.11 | 12.87 | 32 |
| `liveKeystrokeP95` | 24 | 30.76 | 28.19 | 9.28 | 8.80 | 7.18 | 19.57 | 48 |
| `openFile` | 80 | 91.42 | 52.17 | 40.42 | 41.29 | 35.47 | 114.39 | 160 |
| `sourceOpenFile` | 50 | 22.56 | 24.97 | 14.80 | 17.91 | 13.52 | 39.35 | 100 |
| `liveScrollFrameP95` | 16.7 | 37.38 | 28.47 | 5.36 | 5.59 | 5.17 | 17.30 | 33.4 |
| `sourceScrollFrameP95` | 16.7 | 33.99 | 11.86 | 4.11 | 4.03 | 4.08 | 10.04 | 33.4 |
| `firstFrame` | 250 | 400.84 | 210.38 | 184.12 | 146.76 | 150.69 | 288.68 | 500 |
| `indexReady` | 3000 | 4176.47 | 2085.96 | 999.41 | 987.00 | 1090.76 | 3803.09 | 6000 |
| `indexingKeystrokeP95` | 30 | 50.02 | 17.88 | 9.55 | 10.17 | 10.24 | 37.09 | 60 |

The loaded "before" ran with the old targets (exit 1 on four metrics under load average about 36). The loaded "after" passed (exit 0, load about 30). Load varied between the two loaded runs, so only the clean runs and the A/B differences compare like with like. On the clean runs the speedups move `firstFrame` most (184 → 147–151); the other metrics were already well inside their targets on an idle machine.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P3-G1-VER1` — Linux CI bench gate passes only on fast runners | New targets in `scripts/bench-gate.ts` plus the four speedups above. Run 37178733100 on `00011bd` landed on a slow-class runner (`sourceKeystrokeP95` 12.87 ≥ 10, `indexReady` 3803 ≥ 3000) and passed every median: `openFile` 114.39/160, `indexingKeystrokeP95` 37.09/60. `bun test src/core/lang/markdown` and `CI=true bun run test:ci` pass with unchanged snapshots. Local `openFile` and `liveKeystrokeP95` medians are lower than the verifier's readings (clean 35.47–41.29 vs 52.08; 7.18–8.80 vs 20.02) | `e5602b4`, `77ce68c`, `50f9222`, `4603fdb`, `00011bd` | `Fixed` |
| `P3-G1-VER2` — Reference-machine readings miss the inherited 1× targets | Same changes. Two consecutive clean local runs on `00011bd` (Apple M1 Max) are within 1× of every new target, and also of the old ones: `liveKeystrokeP95` 8.80, 7.18; `openFile` 41.29, 35.47; `firstFrame` 146.76, 150.69; `indexingKeystrokeP95` 10.17, 10.24. Recorded in the PR body's Performance table | `e5602b4`, `77ce68c`, `50f9222`, `4603fdb`, `00011bd` | `Fixed` |
| `P3-G1-VER3` — The editor-kind refinement is not recorded in the design or the parent-sync list | Design part: done by the orchestrator in `2495edd` (§6 `WindowState` shows `editor: EditorKind`, derived, `"text"` fallback, not persisted, `EditorKindSpec.open` left to DI4 `base`). `rg -n 'editor: "text"'` in the W system design now hits only `markdownFileType.editor` (`:1763`, `:1777`) and the "Existing Shape"/"Current" cells (`:2018`, `:2028`). PR part: `gh pr edit 6 --body-file` added three pending parent-sync rows (the `content.editor: EditorKind` refinement, `EditorKindSpec.open` not yet called and left to DI4 `base`, the RM261003ABZP-REQ9@R2 live and startup relaxation approved on 2026-10-04) and replaced the bench section with the new targets and readings; `gh pr view 6 --json body` shows them | No repository change by this remediation: the design commit is the orchestrator's `2495edd`; the PR body is not versioned | `Fixed` |
| `P3-G1-VER4` — `createUpdate` lost its doc comment | `src/core/state/update.ts`: `syncEditorKinds` and its comment moved above the reducer comment, which now sits directly on `export function createUpdate` and adds "each window's editor kind follows its file type". Exactly one doc block precedes each function. `bun run check` passes | `8a79835` | `Fixed` |

### Checklist mapping to the approved targets

Two required proofs were written against the old targets. They map as follows; nothing was dropped.

| Finding | Original proof item | Mapped to | Result |
|---|---|---|---|
| VER1 | slow-class CI run with `openFile` ≤ 85 ms and `indexingKeystrokeP95` ≤ 28 ms | gate passes on a slow-class run under the new 2× limits (`openFile` ≤ 160, `indexingKeystrokeP95` ≤ 60) | 114.39 and 37.09: pass |
| VER1 | across DI3 runs after the fix, `openFile / sourceKeystrokeP95` ≤ 7.0 and `indexingKeystrokeP95 / sourceKeystrokeP95` ≤ 2.2 | superseded: these ratios encoded "fit under the old 2× limits on a slow runner", which the new targets replace. Recorded value: 8.9 and 2.9 on run 37178733100 (before the speedups the `openFile` ratio was 10.1–11.0) | not a gate under the new targets |
| VER2 | two consecutive local runs: live ≤ 16, open ≤ 50, first frame ≤ 200, indexing ≤ 16 | the same with the new 1× targets: ≤ 24, ≤ 80, ≤ 250, ≤ 30 | pass; the clean runs also meet the old values |

### Checks

- `bun run check` → `Passed` — 739 pass, 0 fail, 18 snapshots (after each commit; 4.4–6.7 s).
- `CI=true bun run test:ci` → `Passed` — 144 pass, 0 fail, 28 snapshots (30.1 s).
- `bun run build` → `Passed` — `dist/so` 84,105,330 bytes; Mermaid renders from the binary copied alone.
- `bun run bench` (local) → `Passed` — exit 0 on `00011bd`, loaded and twice clean (table above).
- `bun install --frozen-lockfile` → `Passed` — "no changes".
- PR #6 CI run [37178733100](https://github.com/therealhieu/so/actions/runs/37178733100) on `00011bd` → `Passed` — `check` 20 s, `test (macos-15)` 38 s, `test (ubuntu-24.04)` 2 min 8 s; wall time 2 min 11 s (V46 < 3 min).
- Self-review of `2495edd..00011bd` (8 files): only the targets, the four speedups with their tests, and the VER4 comment move. No work-process identifiers in code, tests, or comments (the only `REQ` match is `require(`). Kernel, `RenderLine`, `layoutText`, `live-preview.ts`, `widgets/registry.ts`, goldens, and snapshots are unchanged.

### Remaining issues

- A load failure of `beautiful-mermaid` inside `draw` would show the diagram as "invalid diagram shown as source", as any render exception already does. The package is a pinned dependency bundled into the binary.
- `.s1mple/docs/project.md`'s Benchmarks table still lists the old `openFile`, `firstFrame`, and `indexingKeystrokeP95` targets. Project documentation is not in this remediation's scope; Project Documentation Finalization should update it.
- An orphaned `bun test/bench/indexing-keystroke.bench.ts` (pid 50753, started 02:41, before this session, 0% CPU) was left running because this session did not clearly start it.

## Final Status After Remediation

`Completed`

- **Final report status:** `Completed` — all four findings are `Fixed`; all checks pass; CI is green on the code head `00011bd`.
- **Final report commit:** returned to the orchestrator.
- **Final commits:** `8a79835`, `e5602b4`, `77ce68c`, `50f9222`, `4603fdb`, `00011bd`, plus the earlier group commits `ee55fa9`, `352cf50`, `2348fa4`, `5ca1945`, `a11c8a9`, `c58e8eb`.
- **Remaining issues:** the three items above, none blocking.
