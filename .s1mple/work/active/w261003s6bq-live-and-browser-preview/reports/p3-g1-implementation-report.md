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

## Final Status

`Blocked`

### Final Evidence

- **Final report status:** `Blocked` — Linux CI bench gate fails (`openFile`, `indexingKeystrokeP95`), and the `grid` editor-kind part of V41 needs a design decision.
- **Final report commit:** returned to the orchestrator.
- **Final commits:** `ee55fa9`, `352cf50`, `2348fa4`, `5ca1945`, `a11c8a9`.
- **Final checks:** `bun run check` pass (5.43 s); `CI=true bun run test:ci` 142 pass; `bun run build` pass (83,940,210 B); local `bun run bench` pass; `bun install --frozen-lockfile` pass; PR #6 CI run 37173732484: `check` ✓, `test (macos-15)` ✓, `test (ubuntu-24.04)` ✗ (bench).
- **Remaining issues:** Deviations 1–3.
