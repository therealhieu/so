# P1-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-1-terminal-live-preview.md`
- **Group:** `P1-G1`
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`, `P1-G1-T6`, `P1-G1-T7`
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G1-T1` | `test/boundaries.test.ts:packageName`, `checkImports` (lookup by package name), `PACKAGE_HOMES["beautiful-mermaid"]`, `VIOLATION_FIXTURES`; `test/fixtures/boundary-violation/state-imports-yaml-subpath.ts` | Gate G2 step 0: `git merge-base --is-ancestor 9adb285 HEAD && echo ok` → `ok` at `e7f259f`. RED: `bun test test/boundaries.test.ts` → 1 fail (subpath fixture reported 0 violations). GREEN: → 2 pass, 0 fail (4 fixtures one violation each, `src` none) | `8d0cb51` | `Completed` |
| `P1-G1-T2` | `src/core/config/schema.ts:ConfigSchema.preview`; `src/core/state/config.test.ts` (3 cases); `src/core/config/toml.test.ts` (unknown-table example and full-parse expectation) | RED: `bun test src/core/state/config.test.ts` → 3 fail. GREEN: → 10 pass; `bun run check` → 628 pass, 0 fail | `2af5239` | `Completed` |
| `P1-G1-T3` | `src/core/lang/markdown/live-preview.ts:PreviewCtx`, `MarkdownViewInput`, `BlockRenderer`, `registerBlockRenderer`, `blocksIn`, `livePreview`; `reveal.ts:RevealSet`, `MULTILINE_KEYS`, `reveal`; `render-key.ts:renderKey`, `embedOnly`, `IMAGE_EXTENSIONS`; `inline.ts:inlineDecorations`; `render-cache.ts:RenderCache`; `block-text.ts` helpers; tests `reveal.test.ts`, `live-preview.test.ts`, `render-cache.test.ts`; `test/support/markdown.ts` | RED: `bun test src/core/lang/markdown/reveal.test.ts src/core/lang/markdown/live-preview.test.ts` → 2 fail (modules missing). GREEN: → 6 pass (V1r selection, cursor-out, reading; V5 throwing callout and `xbase`; V14 15 of 15 visible blocks only); `bun run check` → 635 pass | `470720b` | `Completed` |
| `P1-G1-T4` | `renderers/math.ts:MathResult`, `mathText`, `mathRenderer`; `renderers/mermaid.ts:MermaidResult`, `mermaidText`, `mermaidRenderer`; `inline.ts` inline `$…$` through `mathText`; `block-text.ts:wholeBlock`, `fenceBody`; `package.json`/`bun.lock` (`beautiful-mermaid` `1.1.3`) | `bun add beautiful-mermaid@1.1.3` → installed. RED: `bun test src/core/lang/markdown/renderers` → 2 fail. GREEN: math 4 pass (V6 plus block renderer cases), mermaid 4 pass (V7 flowchart, gantt label, malformed label; V8 one library call over 50 re-layouts). Mutation check: cache key randomized → V8 fails with 50 calls. `bun test test/boundaries.test.ts` → pass; `bun run check` → 643 pass | `1150aa3` | `Completed` |
| `P1-G1-T5` | `renderers/embed.ts:EmbedData`, `sectionLines`, `embedRows`, `embedRenderer`; `renderers/image.ts:isWebUrl`, `imageRenderer`; `block-text.ts:embedLink`; tests `renderers/embed.test.ts`, `renderers/image.test.ts` | RED: `bun test …/embed.test.ts …/image.test.ts` → 2 fail. GREEN: 10 pass (V9 cap 1+10+1 with `more` 15, expanded 1+25; V10 loading reserves 3, missing title-only, unresolved missing, one level renders inner embed as a link; image widget, rows, placeholder, web URL); `bun run check` → 653 pass | `b5f906c` | `Completed` |
| `P1-G1-T6` | `renderers/{index,heading,list,table,callout,code,frontmatter,rule,footnote,rows}.ts` (`builtinRenderers` with the design's 14 registrations); `inline.ts` footnote references in text; `live-preview.test.ts` goldens and assertions; `__snapshots__/live-preview.test.ts.snap` (18 goldens); `test/fixtures/tour.md` | `bun test src/core/lang/markdown/live-preview.test.ts` → 23 pass, 18 snapshots (widths 60 and 100 × 7 cursor states, reading, source); H1–H4 glyph, hidden comment, and `▕`-only-on-revealed-rows assertions pass. Goldens reviewed by eye against the M2 element list; `bun run check` → 673 pass | `6e74e72` | `Completed` |
| `P1-G1-T7` | `src/core/state/view-context.ts:ViewHost`, `ViewContextBuilder`, `ViewContextRegistry`; `src/core/state/markdown-view.ts:markdownViewContext`, `imageRows`; `src/core/state/types.ts:BufferState.listed`, `BufferState.embeds`, `WindowState.content.folds`; `src/core/state/update.ts:Registries.viewContexts`; `src/app/main.ts:registries` and `test/support/state.ts:testRegistries` (registry plus `builtinRenderers()`); `src/core/state/view-context.test.ts` | RED: `bun test src/core/state/view-context.test.ts` → 1 fail (modules missing). GREEN: 4 pass (V17 duplicate throws, unknown file type `undefined`, 1600×900 at width 80 rows 40 aspect 0.5 → 23 rows, unknown image; plus 80% cap → 32). `bun run check` → 677 pass, knip zero findings | `d3c1776` | `Completed` |

### Group Change Range

- **Starting commit:** `e7f259f` (clean tree; no pre-existing staged or unstaged changes)
- **Final commit:** `d3c1776`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed` — Biome clean, tsc clean, knip zero findings, 677 pass, 0 fail, 18 snapshots.
- `bun run test:ci` → `Passed` — 115 pass, 0 fail, 25 snapshots; `git status --short` empty afterwards, so no component snapshot changed.
- `git diff --stat e7f259f..HEAD -- src/core/kernel src/core/filetypes/registry.ts` → `Passed` — empty.
- `git diff --stat e7f259f..HEAD -- src/ui` → `Passed` — empty (`paintPreview` and `EditorView` untouched).
- G4 signatures vs `rm261003abzp-roadmap-phase-2-obsidian-experience.md:205-216` → `Passed` — `PreviewCtx` has the same seven members and types (declaration order differs), `MarkdownViewInput = { doc; view: "live" | "reading"; ctx }`, `livePreview: DecorationProvider<MarkdownViewInput>`, `BlockRenderer = (block, v, input) => Decoration[]`, `registerBlockRenderer(kind: BlockKind | string, r: BlockRenderer): void`.
- Work-process identifier scan over every changed file under `src` and `test` (`REQ|DES|UDES|UV|US|RM261|W261|G4` ids, `V<n>`, `P<n>-G<n>`, `T<n>`) → `Passed` — no match.
- Gate G2 → `Satisfied` — `git merge-base --is-ancestor 9adb285 HEAD && echo ok` printed `ok` at `e7f259f` before P1-G1-T1.
- Gate G4 → `Pending` — producer outputs landed in `470720b`; proof by V38/V41 belongs to P3-G1, and the gate stays pending until the user merges the DI3 PR.

### Deviations and Remaining Issues

Shape refinements (not G4 signatures):

- `reveal(doc, view, cursor, selection, text)` takes a fifth `text: TextBuffer`. Tables and callouts are `paragraph`-kind blocks, and their render key needs the block's mdast, which needs the block text.
- `MULTILINE_KEYS` is checked against both `block.kind` and the render key. `"fence"` is a block kind; fenced code renders under `"code"` or `"mermaid"`.
- `livePreview` drops any renderer or inline decoration that touches a revealed line. It also puts `▕` on every revealed non-blank line, not only on revealed blocks. This follows the "markers hidden except on the cursor line" and "cursor on `**bold**` → `▕`" rules (parent UDES3@R2, phase explanation). A revealed embed or image line therefore shows its source.
- `markdownViewContext` resolves through `resolveLink` from the window note's path.
- `ViewContextRegistry.build` returns `undefined` for a file type without a builder.

Files beyond the plan's list:

- `src/core/lang/markdown/block-text.ts`: shared block helpers (`contentStart`, `contentEnd`, `wholeBlock`, `fenceBody`, `embedLink`, `nodeRange`, `rootOf`).
- `src/core/lang/markdown/renderers/rows.ts`: shared decoration helpers. It replaced `renderers/label.ts`, which T4 created; the rename happened in the T6 refactor step.
- `src/core/lang/markdown/render-cache.test.ts` (T3) and `renderers/image.test.ts` (T5), plus two math-renderer cases in `math.test.ts` (T4). These keep knip at zero findings at every task commit, because the code they cover is registered only by `builtinRenderers` in T6/T7.
- `test/support/markdown.ts`: `stubCtx`, `noteView`, `layoutNote`, `rowText`.
- `src/core/config/toml.test.ts`: it used `[preview]` as an example of an unknown table. It now uses `[export]`, and the full-parse expectation includes the preview defaults.

Test adjustments:

- The V39 line case uses `[editor]` / `[preview]` / `embedMaxRows = 0`, so the error is on line 3 as V39 states. The plan's preview text puts the key on line 4.
- The unknown-key case asserts the exact error `{ line: 2, message: 'unknown key "preview.zoom"' }`.

Renderer decisions a remediator must preserve:

- Fallback labels are `mermaid: <type> shown as source` (known types without a text layout), `mermaid: invalid diagram shown as source` (parse failure or a flowchart with no nodes), `mermaid: wider than <N> columns, shown as source`, and `math: unsupported TeX shown as source`. Each label is one `text` widget row above the kept source.
- Mermaid is drawn with the library's default spacing first, then with compact spacing (`1/1/0`) when the drawing is wider than the window.
- Nested embeds stop at one level. The nested layout uses a context kept in a module `WeakSet`, with `embed()` always `"missing"` and `images: "off"`; the embed renderer turns an embed in that context into a link span. Nested content width is the window width − 2.
- `EmbedData.more` counts source lines beyond the cap.
- Embed rows are not cached in `RenderCache`, because link resolution inside them depends on index state. The nested layout is bounded by `embedMaxRows` rows.
- Callouts: `[!x]-` starts folded, and a block id in `folds` flips any callout. `▸` and `▾` show only for foldable or folded callouts. Callout types map to the four tokens `mdCalloutNote`, `mdCalloutTip`, `mdCalloutWarning`, and `mdCalloutDanger`; plain quotes use `mdQuote`.
- Inline decorations apply to `paragraph`, `heading`, and `list` blocks only. A `[^n]` reference whose definition is in another block is found by a text scan, guarded by an exact source match, because mdast leaves it as text.
- Setext headings are supported: the glyph is inserted and the underline line is hidden.
- Fenced code: the fence lines are hidden and the body is highlighted with lowlight's grammar for the info-string language. An unknown language gives no marks.

For P1-G2:

- Widget types emitted are `text` (`data: Span[][]`, used by Mermaid drawings and fallback labels), `embed` (`EmbedData`), `image` (`{ path, name }`), and `rule` (`data: null`). P1-G2 needs a `text` painter, as design §7 already states.
- Style tokens emitted are `mdHeading1`–`mdHeading4`, `mdBold`, `mdItalic`, `mdStrike`, `mdHighlight`, `mdCode`, `mdLink`, `linkUnresolved`, `mdTag`, `mdQuote`, `mdCalloutNote`, `mdCalloutTip`, `mdCalloutWarning`, `mdCalloutDanger`, `mdMarker`, `mdFootnote`, `mdProperty`, `signReveal`, `signError`, and `imagePlaceholder`, plus the existing `dim` and `code*` tokens. `mdRule` is not emitted, because rules are a widget. Until P1-G2-T4 adds theme entries, unknown tokens fall back to `text`; no view uses the provider yet.

Process note:

- P1-G1-T6 did not follow strict RED-first order. The per-key renderers were written before the golden test file, so no failing run was observed for V4 before GREEN. The goldens were generated from that implementation and then reviewed by eye. The first golden run did fail on the heading-glyph assertion, because of a wrong line index in the test; the test was fixed before the commit.

Remaining issues: None.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** Pending — `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g1-verification-report.md`
- **Status:** `Not required` (no verifier findings yet)

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all seven tasks are committed, and every task and group check passed.
- **Final report commit:** Returned to the orchestrator after this report is committed.
- **Final commits:** `8d0cb51`, `2af5239`, `470720b`, `1150aa3`, `b5f906c`, `6e74e72`, `d3c1776`
- **Final checks:** `bun run check` → 677 pass, 0 fail, knip clean; `bun run test:ci` → 115 pass, 0 fail, no snapshot change; kernel and `src/ui` diffs empty; G4 signatures equal.
- **Remaining issues:** None
