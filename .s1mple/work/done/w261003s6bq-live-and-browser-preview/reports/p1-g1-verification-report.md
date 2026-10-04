# P1-G1 Verification Report

## Scope

- **Group:** `P1-G1`
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`, `P1-G1-T6`, `P1-G1-T7`
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g1-implementation-report.md` (report commit `c85739c`; group change range `e7f259f..d3c1776`; task commits `8d0cb51`, `2af5239`, `470720b`, `1150aa3`, `b5f906c`, `6e74e72`, `d3c1776`)

## Status

`Failed`

## Assigned Traceability

- **System Design:** `REQ1@R1, REQ2@R2 (renderer side), REQ3@R1, REQ4@R1 (renderer side), REQ5@R1 (fold input), REQ6@R1 (registry) → DES1 (registry and builder), DES2, DES3, DES4 (renderer), DES5 (fold input), DES7 (renderer and rows), DES13 → S2, S3, S4, S5 (rows), S14, S16 (registry), S18 (provider side) → V1r, V4, V5, V6, V7, V8, V9, V10, V14, V17, V39, V47 (boundary part)`
- **UI Design:** `None — no W UI design; parent RM261003ABZP-UV3@R2 element output is asserted by the V4 goldens (style tokens per parent UDES3@R2/UDES11@R1 through design §7), reviewed here against RM261003ABZP-M2@R1.`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ3 → DES3 → S4 → V47 (boundary part)` | None | Subpath imports checked by package name; `beautiful-mermaid` allowed only under `src/core/lang/markdown/`; exact pin | `test/boundaries.test.ts:packageName`, `checkImports` (`PACKAGE_HOMES[packageName(specifier)]`), `PACKAGE_HOMES["beautiful-mermaid"]`; fixture `test/fixtures/boundary-violation/state-imports-yaml-subpath.ts`; `package.json:20` `"beautiful-mermaid": "1.1.3"`; only `renderers/mermaid.ts` and its test import the package | `Satisfied` |
| `REQ1, REQ4 → DES13 → S14 → V39` | None | `preview` defaults `{live, 10, auto}`; strict section; line-numbered errors | `src/core/config/schema.ts:ConfigSchema.preview` (same shape as design §7, `prefault({})`); `src/core/state/config.test.ts` three cases; `toml.test.ts` example moved to `[export]` | `Satisfied` |
| `REQ1 → DES2 → S2 → V1r` | None | Reveal covers the selection and its multi-line blocks; empty in `reading` | `src/core/lang/markdown/reveal.ts:reveal`, `MULTILINE_KEYS`; `reveal.test.ts` | `Satisfied` (cost outside the viewport: P1-G1-VER2) |
| `REQ1 → DES2 → S3, S18 → V5` | None | Throwing renderer leaves source with `⚠` on the first line; a new key's renderer is used without provider edits; last registration wins | `live-preview.ts:livePreview` (`try` around `renderKey` + renderer + `inlineDecorations`, `catch` → `signError` sign), `registerBlockRenderer` (`Map.set`); `render-key.ts:embedOnly` (`xbase` → extension key) | `Satisfied` |
| `REQ5, REQ1 → DES2 → S7 → V14` | None | Renderers run only for blocks intersecting the visible range; provider reads only visible lines plus intersecting blocks | `live-preview.ts:blocksIn` binary search and per-block loop; but `reveal.ts` walks every selected line and block, and `renderers/embed.ts:embedRows` lays out the whole target section | `Mismatch` — P1-G1-VER1, P1-G1-VER2 |
| `REQ3 → DES3 → S4 → V6, V7, V8` | None | Unicode math; ASCII Mermaid; labelled source fallback; one library call per block hash and width | `renderers/math.ts:mathText`, `mathRenderer`; `renderers/mermaid.ts:mermaidText` (`TEXT_LAYOUT`, `SOURCE_ONLY`, `INVALID`, two spacings), `mermaidRenderer` (`RenderCache` key `${block.hash}|${v.width}`); inline `$…$` in `inline.ts` | `Satisfied` |
| `REQ4 → DES4, DES5 → S5 → V9, V10` | None | Cap with `… N more lines`; expand through `folds`; `loading` reserves `min(embedMaxRows, 3)`; `missing`; one level | `renderers/embed.ts:embedRenderer`, `embedRows`, `sectionLines`, module `WeakSet` of nested contexts | `Satisfied` (row behaviour); cost is P1-G1-VER1 |
| `REQ2 → DES7 → S8` (renderer side) | None | Image widget with `ctx.image` rows, one row while unknown, `[image: name]` when off or unresolved, web URL passthrough, no decoding | `renderers/image.ts:isWebUrl`, `imageRenderer`; `renderers/image.test.ts` | `Satisfied` |
| `REQ1 → DES2 → S2 → V4` | parent `UV3@R2` element output / `M2@R1` | `tour.md` goldens at widths 60 and 100 for 7 cursor states, `reading`, `source`; H1–H4 glyphs; comment hidden; `▕` only on revealed rows | `renderers/index.ts:builtinRenderers` (the design's 14 keys verbatim); `live-preview.test.ts` goldens and assertions; `__snapshots__/live-preview.test.ts.snap` (18 entries); `test/fixtures/tour.md` | `Mismatch` — P1-G1-VER3 (multi-line comment reveal sign), P1-G1-VER4 (M2 fidelity) |
| `REQ6, REQ2 → DES1, DES7 → S8, S16 → V17` | None | Builder registry rejects duplicates, `undefined` for unknown file types; image rows scale with width and cell aspect, capped at 80% of rows | `src/core/state/view-context.ts:ViewContextRegistry`, `ViewHost`, `ViewContextBuilder`; `markdown-view.ts:markdownViewContext`, `imageRows`; `update.ts:Registries.viewContexts`; `src/app/main.ts:registries` and `test/support/state.ts:testRegistries` register the same builder and call `builtinRenderers()` | `Satisfied` |
| `REQ4, REQ5 → DES4, DES5` (state fields) | None | `BufferState.listed?: false`, `BufferState.embeds?`, `WindowState.content.folds?` added, optional | `src/core/state/types.ts` diff (additions only) | `Satisfied` |
| `REQ1 → DES2, DES6 → S18` (G4 provider side) | None | `PreviewCtx`, `MarkdownViewInput`, `livePreview`, `BlockRenderer`, `registerBlockRenderer` equal the phase design | `live-preview.ts` exports vs `rm261003abzp-roadmap-phase-2-obsidian-experience.md:205-216` | `Satisfied` |
| `REQ1` (inherited constraints) | None | Kernel, `RenderLine`, `layoutText`, `FileType`, `ViewSpec`, `src/ui` unchanged; no Markdown in kernel; `core/lang` pure | Empty diffs for `src/core/kernel`, `src/core/filetypes/registry.ts`, `src/ui`, `file-type.ts`; no `state`/`ui`/`@opentui`/I/O import under `src/core/lang/markdown` | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| Gate G2 precondition | None (gate) | Plan context §2; phase file `:69` | `git merge-base --is-ancestor 9adb285 e7f259f`; `git show e7f259f:<goal>` Gate Evidence; `git log -1 --format='%h %p' 8d0cb51` | Exit 0 (ancestor of `e7f259f` and of `0c111be`). Goal Gate Evidence committed in `e7f259f` records exit 0 at `0c111be`; `8d0cb51` (T1) has parent `e7f259f`, so the evidence preceded P1-G1-T1 | `Passed` |
| `V47` (boundary part) | `S4`, `S16` | `DES3` | `bun test test/boundaries.test.ts` (inside `bun run check`); source grep for `beautiful-mermaid` | Passes; subpath fixture reports one violation; only `renderers/mermaid.ts` (and its colocated test) import the package; `package.json` pins `1.1.3` | `Passed` |
| `V39` | `S14` | `DES13` | `src/core/state/config.test.ts` (in `bun run check`) | Defaults equal `{ mode: "live", embedMaxRows: 10, images: "auto" }` and `defaults.preview`; `[editor]`/`[preview]`/`embedMaxRows = 0` toast starts `config.toml:3: `; `zoom` gives `{ line: 2, message: 'unknown key "preview.zoom"' }` | `Passed` |
| `V1r` | `S2` | `DES2` | `src/core/lang/markdown/reveal.test.ts` | Selection over lines 3–4 reveals `[3, 4]` and the table id; cursor on line 6 reveals `[6]` and no block; `reading` gives empty sets | `Passed` |
| `V5` | `S3`, `S18` | `DES2` | `live-preview.test.ts` (two cases) | Throwing `callout` renderer → rows `"> [!note] Title"`, `"> Body line"`, `⚠`/`signError` on the first only, other rows equal the healthy layout; `xbase` stub output replaces `![[t.xbase]]` | `Passed` |
| `V14` | `S7` | `DES2` | `live-preview.test.ts` "only blocks in the visible range are rendered"; added probes run once from a temporary test file (deleted) | Test passes: 15 renderer calls for 30 visible lines of a 5,000-line `Doc`. Probes: an embed of a 5,000-line note costs 504 ms per frame with 2,501 paragraph-renderer calls (2,000 lines: 15.8 ms); a select-all over a 5,000-line note costs 625 ms per frame vs 2.05 ms with only a cursor | `Failed` — P1-G1-VER1, P1-G1-VER2 |
| `V6` | `S4` | `DES3` | `renderers/math.test.ts` | `E = mc²`; `∑ᵢ₌₁ⁿ xᵢ ≤ a/b`; `\unknowncmd x` → `{ kind: "source", tex }`; block renderer one row and labelled source cases pass | `Passed` |
| `V7` | `S4` | `DES3` | `renderers/mermaid.test.ts` | Flowchart → box-drawing lines; `gantt` → `mermaid: gantt shown as source`; `flowchart SIDEWAYS` → `mermaid: invalid diagram shown as source` | `Passed` |
| `V8` | `S4` | `DES3` | `renderers/mermaid.test.ts` spy on `renderMermaidASCII` over 50 edits outside the fence | Called once; cache key includes width (`${block.hash}|${v.width}`) | `Passed` |
| `V9` | `S5` | `DES4`, `DES5` | `renderers/embed.test.ts` | 25-line section, cap 10 → 10 rows, `more` 15, widget rows `1 + 10 + 1`; id in `folds` → 25 rows, `more` 0, `1 + 25` | `Passed` |
| `V10` | `S5` | `DES4` | `renderers/embed.test.ts` | `loading` → state `loading`, rows 3; `missing` → title-only data, rows 1; unresolved target → `missing`; self-embed renders inner `![[self]]` as an `mdLink` span | `Passed` (the `linkUnresolved` paint of a missing embed is painter-side, see Unverified Items) |
| `V4` | `S2` | `DES2`, `DES5` | `live-preview.test.ts` goldens; manual review of all 18 snapshots against `ui-mockups/m2-live-preview.html` (`md.live`, states S1–S16) and UV3@R2 assertions; probe of a multi-line `%%` comment | 18 snapshots match; heading glyph, hidden comment, and reveal-sign assertions pass. Review: glyphs, styled inline text, link text and `linkUnresolved`, superscript footnotes, bullets and `☐`/`☑`, quote bar, callout title and folded `▸`, box-drawn table, hidden fences with lowlight marks, embed cap, image rows, Unicode math, Mermaid art, rule widget, and whole-block reveal with `▕` all match. Gaps: P1-G1-VER3, P1-G1-VER4 | `Failed` |
| `V17` | `S8`, `S16` | `DES1`, `DES7` | `src/core/state/view-context.test.ts` | Duplicate throws; unknown file type → `undefined`; 1600×900 at width 80, rows 40, aspect 0.5 → `{ rows: 23 }`; unknown → `"unknown"`; 100×1000 → capped 32 | `Passed` |
| Fast gate | None | All | `bun run check` | Biome clean (218 files), tsc clean, knip clean, `677 pass, 0 fail, 18 snapshots`, exit 0 | `Passed` |
| Component suites unchanged | None | All | `bun run test:ci`; `git status --short` | `115 pass, 0 fail, 25 snapshots`, exit 0; no snapshot or source file changed (the only modified path is the orchestrator's pre-existing `w261003s6bq-goal.md` edit, present before the checks ran) | `Passed` |
| Kernel untouched | None | `REQ1` constraint | `git diff --stat e7f259f..d3c1776 -- src/core/kernel src/core/filetypes/registry.ts` | Empty; `src/ui` and `src/core/lang/markdown/file-type.ts` also empty | `Passed` |
| G4 signatures | `S18` | `DES2` | Compare `src/core/lang/markdown/live-preview.ts` with `rm261003abzp-roadmap-phase-2-obsidian-experience.md:205-216` | `PreviewCtx` has the same seven members and types (`isResolved`, `resolve`, `embed` with `{ doc; text }`, `folds: ReadonlySet<number>`, `image`, `embedMaxRows`, `images`; order differs only); `MarkdownViewInput`, `livePreview: DecorationProvider<MarkdownViewInput>`, `BlockRenderer`, `registerBlockRenderer(kind: BlockKind \| string, r)` equal. Gate G4 stays `Pending` until merge | `Passed` |
| Work-process identifier scan | None | `.s1mple/S1MPLE.md` Implementation | `grep -nE` for REQ/DES/UDES/UREQ/UV/US/RM261/W261/G4/P-G/V<n>/S<n>/T<n>/phase/goal over every changed file under `src` and `test` (snapshots included) | No match | `Passed` |
| Purity and layer rules | `S16` | `DES2` | grep under `src/core/lang/markdown` for `state`, `ui`, `@opentui`, `node:fs`, `Bun.`, `fetch(` | No match outside tests | `Passed` |

## Findings

### P1-G1-VER1 — Major — Performance — Embed layout processes the whole target section on every frame

- **System Design:** `REQ4@R1, REQ5@R1 → DES2, DES4 → S5, S7 → V9, V14`
- **UI Design:** `None`
- **Evidence:** `src/core/lang/markdown/renderers/embed.ts:embedRows` builds the nested view with `visible: lines`, the whole section (the whole note after its frontmatter for `![[note]]`), and only caps output through `rows: max`. `layoutText` computes `providers.flatMap((p) => p(v, analysis))` for the full `visible` range before applying the row cap (`src/core/kernel/view/text-view.ts:24-36`), and embed rows are not cached (implementation report). A probe embedding a target of blank-separated paragraphs measured 15.8 ms per frame for a 2,000-line target and 504 ms per frame for a 5,000-line target, with 2,501 paragraph-renderer calls per frame while only 10 rows are shown. Above 2,048 blocks the per-block mdast cache (`src/core/lang/markdown/mdast.ts:11`, `CACHE_LIMIT = 2048`) thrashes, so every frame re-parses the target.
- **Impact:** Any note that embeds a long note runs layout far outside the viewport on every keystroke, which breaks the REQ5@R1 "Layout never runs outside the viewport" rule, the DES2 invariant that the provider reads only visible lines plus intersecting blocks, and the parent keystroke budget (p95 < 16 ms, RM261003ABZP-REQ9@R2).
- **Required resolution:** The nested layout of a capped embed does work proportional to `embedMaxRows`, not to the target size (for example, bound the nested `visible` range to the lines needed to fill the cap and compute `more` from the section bounds); V9 and V10 behaviour stays unchanged.
- **Required proof:** A unit test that embeds a target with far more blocks than `embedMaxRows` and asserts that renderers run only for blocks inside the capped range (call count), plus `bun test src/core/lang/markdown/renderers/embed.test.ts` and `bun run check` passing.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G1-VER2 — Major — Performance — Reveal walks every selected line and block, outside the viewport

- **System Design:** `REQ1@R1, REQ5@R1 → DES2 → S2, S7 → V1r, V14`
- **UI Design:** `None`
- **Evidence:** `src/core/lang/markdown/reveal.ts:reveal` adds every line from the selection start to end and calls `renderKey` (which parses the block's mdast for paragraph-kind blocks) for every block in `blocksIn(doc, { from, to: to + 1 })`; `live-preview.ts:livePreview` then iterates all of `revealedRows`. Only blocks intersecting `v.visible` affect output. A probe over a 5,000-line note (the V14 size) with 30 visible lines measured 625 ms per frame with a select-all selection vs 2.05 ms with only a cursor; the 2,048-entry mdast cache thrashes once the selection covers more blocks than that.
- **Impact:** Visual selection over a large range (for example `ggVG` before a yank) stalls every frame for hundreds of milliseconds, against the DES2 invariant "the provider reads lines only inside `v.visible` plus the text of blocks that intersect it" and the viewport-only rule V14 protects.
- **Required resolution:** Reveal is computed only for the intersection of the cursor or selection with `v.visible` (lines and blocks), so the cost is bounded by the visible range while the output for visible rows is unchanged.
- **Required proof:** A test with a selection spanning a 5,000-line `Doc` and 30 visible lines that asserts render-key or mdast work happens only for visible blocks (call count), plus V1r and the V4 goldens passing unchanged.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G1-VER3 — Minor — Correctness — A multi-line `%%` comment shows raw source without `▕` on all its rows

- **System Design:** `REQ1@R1 → DES2 → S2 → V4`
- **UI Design:** `Parent RM261003ABZP-UDES3@R2 / RM261003ABZP-UV3@R2 ("sign column shows ▕ only on revealed rows"); RM261003ABZP-M2@R1 note "The ▕ mark in the sign column shows rows currently displaying raw source"`
- **Evidence:** `MULTILINE_KEYS` in `src/core/lang/markdown/reveal.ts` omits `comment`, while the comment renderer (`renderers/index.ts`) hides the whole block with one block `replace`. With the cursor on line 3 of `"Intro\n\n%%\nhidden one\nhidden two\n%%\n\nAfter"`, `livePreview`'s reveal filter drops that replace, so lines 2–5 all show raw source but only line 3 carries `▕` (probe output: `2 "%%"`, `3 ▕ "hidden one"`, `4 "hidden two"`, `5 "%%"`).
- **Impact:** Rows that display raw source lack the reveal marker, so the sign column misreports which rows are source; the V4 fixture has only a one-line comment, so the goldens do not catch it.
- **Required resolution:** A multi-line comment block is revealed as a whole block while the cursor or selection is inside it, with `▕` on each of its non-blank rows, and hidden otherwise.
- **Required proof:** A unit test with the cursor inside a multi-line `%%` comment that asserts `▕` on every comment row, plus the existing V4 goldens and reveal-sign assertion passing.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G1-VER4 — Minor — Specification — Golden element output departs from the accepted M2 mockup without recorded rationale

- **System Design:** `REQ1@R1 → DES2 → S2 → V4`
- **UI Design:** `Parent RM261003ABZP-M2@R1 (S5, S6), RM261003ABZP-UV3@R2 via the V4 goldens`
- **Evidence:** Design §7 renders elements "per M2". Compared with `ui-mockups/m2-live-preview.html` and `shared/term.js:md.live`, the committed goldens (`__snapshots__/live-preview.test.ts.snap`, e.g. lines 835-841) differ in three ways the implementation report does not explain. (1) Frontmatter: M2 S6 says "tags as chips, aliases as a list" and draws `▾ Properties`, `#reference  #so` in tag style, and a closing rule row; the golden shows `Properties`, `tags     reference · so` with no `mdTag` style, `aliases  tour · syntax`, and the closing fence hidden. (2) Fenced code: M2 draws a language header row (`  ts`) on the opening fence; `renderers/code.ts` hides both fence lines. (3) Callout icons: M2 uses `●` note, `★` tip, `▲` warning, `✗` danger; `renderers/callout.ts:GROUPS` uses `ℹ`, `✦`, `⚠`, `✘`. The warning icon reuses `⚠`, the render-error sign glyph. Table borders, the one-row math block, and Mermaid's detached `├` junction (beautiful-mermaid's own output, confirmed by calling `renderMermaidASCII` directly) are design-justified or library output and are not part of this finding.
- **Impact:** The goldens lock in element appearance that differs from the accepted mockup, so UV3@R2 element review cannot rely on them, and frontmatter tags lose their tag styling.
- **Required resolution:** Frontmatter `tags` values render tag-styled (`mdTag`, `#` prefix) as M2 S6 shows. The fenced-code language row and the callout icons either match M2 or are recorded, with rationale, as deviations in the implementation report's remediation section. Goldens are regenerated and reviewed.
- **Required proof:** `bun test src/core/lang/markdown/live-preview.test.ts` with updated, reviewed goldens showing `mdTag` on the frontmatter tag values, and the remediation entry recording each item's resolution.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:** package-name boundary lookup (V47); `preview` defaults, range error line, unknown key (V39); selection, cursor-out, and reading reveal (V1r); renderer failure isolation and registration-only extension (V5); visible-only renderer calls without a selection (V14); math Unicode and source results, math block rows (V6); Mermaid text, unsupported and invalid labels, single library call over 50 edits (V7, V8); embed cap, expansion, loading, missing, unresolved, one level (V9, V10); image widget, rows, placeholder, web URL (`image.test.ts`); `RenderCache` LRU (`render-cache.test.ts`); 18 `tour.md` goldens plus heading-glyph, hidden-comment, and reveal-sign assertions (V4); builder registry and image rows (V17).
- **Missing:** a call-count test bounding embed layout by `embedMaxRows` (P1-G1-VER1); a test bounding reveal work by the visible range under a large selection (P1-G1-VER2); reveal of a multi-line comment block (P1-G1-VER3). `markdownViewContext`'s `embed` precedence (open buffer → refused → requested → missing) and its `folds` set have no test in this group; the plan places them under V11, V13, and V49 in P1-G2, which must assert them.

## Scope Changes

- `reveal` takes a fifth `text: TextBuffer` argument (design §7 shows four). This is not a G4 signature, and the render key of `paragraph`-kind tables and callouts needs block text. Accepted.
- `livePreview` drops renderer and inline decorations that touch revealed lines and puts `▕` on every non-blank revealed line, not only on revealed blocks. This matches parent UDES3@R2 ("markers hidden except on the cursor line") and M2 S1/S2 (the cursor line shows raw source and is marked). Accepted, except for the multi-line comment edge case in P1-G1-VER3.
- `MULTILINE_KEYS` is checked against both `block.kind` and the render key, because `fence` is a block kind and fenced code renders under `code` or `mermaid`. Accepted.
- Extra files: `block-text.ts` (shared block helpers; plan T3 step 3 allows this), `renderers/rows.ts`, `render-cache.test.ts`, `renderers/image.test.ts`, `test/support/markdown.ts`, and the `toml.test.ts` edit (`[preview]` had been its example of an unknown table). Each is justified by reuse, knip reachability, or a changed expectation. Accepted.
- Additional renderer decisions: Mermaid labels for `invalid diagram` and `wider than <N> columns`; a compact-spacing retry; `EmbedData.more` counting source lines; nested embeds with `images: "off"` and window width − 2; inline decorations limited to `paragraph`, `heading`, and `list` blocks; setext headings. These stay within DES2, DES3, and DES4 and are recorded in the implementation report. Accepted.
- Process: P1-G1-T6 wrote the renderers before the golden test, so no RED run was observed for V4. The goldens were reviewed here independently (see V4 and P1-G1-VER4).
- `builtinRenderers()` is called inside `registries()` rather than separately in `main()`. Production and test wiring stay in parity. Accepted.

## Unverified Items

- The `linkUnresolved` styling of a `missing` embed widget is applied by the embed painter, not the renderer: `EmbedData` carries only `state`. It is proven by V16 in P1-G2.
- Gate G4 is `Pending` by design. The signatures match now; proof by V38 and V41 belongs to P3-G1, and closing the gate depends on the user merging the DI3 PR.
- The P1-G1-VER1 and P1-G1-VER2 timings come from probes on this machine (Bun 1.4.2) using the repository's test helpers. Absolute numbers vary by machine; the call counts and the unbounded scope do not.

## Blockers

None
