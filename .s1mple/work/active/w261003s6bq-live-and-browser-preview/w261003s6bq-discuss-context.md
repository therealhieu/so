# W261003S6BQ: live-and-browser-preview

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-2-obsidian-experience.md` | DI3 definition (lines 315–396), PH2 phase design (99–311), gates G2/G4 (66–72), progress (573–581), approval (587–602) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md` | DI3 assignment (Delivery Items line 133) and Work Progress row (line 144) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-requirements.md` | REQ5@R2 (149), REQ8@R2 (207), REQ9@R2 (226), REQ10@R4 (248), REQ11@R3 (273) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-design.md` | DES and S/V definitions (Success and Verification 858+, Design Decisions 1118+), Preview HTTP routes (409), AppConfig (419) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-requirements.md`, `rm261003abzp-ui-design.md`, `ui-mockups/manifest.md` | UREQ/UDES/US/UV and accepted mockups M1, M2, M7 |
| `src/core/kernel/view/{types,decorations,text-view}.ts` | Current `TextView`, `RenderLine`, `Decoration`, `DecorationProvider`, `layoutText` |
| `src/core/filetypes/registry.ts`, `src/core/lang/markdown/{file-type,doc,mdast,blocks,syntax}.ts` | `ViewSpec.input` hook, `markdownFileType`, `Doc`, `blockNode`, `syntaxExtensions` |
| `src/core/state/{types,store,status}.ts`, `src/core/config/schema.ts` | State shape, store subscription, status segments, config schema |
| `src/ui/editors/{text-view,registry}.ts`, `src/ui/views/statusline.ts`, `src/ui/shell.ts` | Current painting, layout call, editor views, statusline |
| `src/app/{main,effects,lifecycle}.ts`, `src/workspace/system.ts` | Registration, effect runner, exit path, process spawning |
| `test/boundaries.test.ts`, `scripts/bench-gate.ts`, `test/bench/*` | `src/preview` layer rule, benchmark targets and benches |
| `node_modules/@opentui/core` (0.5.14) `image.d.ts`, `buffer.d.ts`, `types.d.ts`, `renderables/Image.d.ts`, `index.bun.js` | Image and graphics API facts |

## Roadmap Binding

- **Roadmap:** RM261003ABZP — `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md`
- **Phase:** RM261003ABZP-PH2@R3 — `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Phase Definition (lines 10–38)
- **Delivery item:** RM261003ABZP-DI3@R2 — same file, Delivery Items (lines 315–396); index Delivery Items row (line 133)
- **Accepted upstream baseline:**
  - Context: `rm261003abzp-roadmap-context.md@R2`.
  - Requirements (`rm261003abzp-requirements.md`): RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2, RM261003ABZP-REQ11@R3, RM261003ABZP-REQ10@R4 (budgets kept; phase file Coverage line 557).
  - Design (`rm261003abzp-design.md`, Design Decisions): RM261003ABZP-DES5@R2 (1160), RM261003ABZP-DES6@R2 (1170), RM261003ABZP-DES9@R3 (1200), RM261003ABZP-DES10@R2 (1210), RM261003ABZP-DES13@R2 (1240), RM261003ABZP-DES14@R2 (1250), RM261003ABZP-DES16@R1 (1270), RM261003ABZP-DES17@R1 (1280); contracts Preview HTTP routes (409) and AppConfig (419).
  - Success and verification (`rm261003abzp-design.md`, Success and Verification): RM261003ABZP-S5@R1 (946) with RM261003ABZP-V7@R2 (953) and RM261003ABZP-V8@R1 (962); RM261003ABZP-S8@R1 (1006) with RM261003ABZP-V11@R3 (1013); RM261003ABZP-S9@R1 (1023) with RM261003ABZP-V12@R2 (1030); RM261003ABZP-S11@R1 (1066) with RM261003ABZP-V16@R2 (1082).
  - Accepted mockups (`ui-mockups/manifest.md` line 91): RM261003ABZP-M2@R1 (S1–S16), RM261003ABZP-M7@R1, RM261003ABZP-M1@R1 (statusline segments).
  - UI requirements (`rm261003abzp-ui-requirements.md`): RM261003ABZP-UREQ3@R2 (56), RM261003ABZP-UREQ4@R1 (74), RM261003ABZP-UREQ10@R1 (168), RM261003ABZP-UREQ6@R1 (105, unresolved-link style), RM261003ABZP-UREQ1@R2 (23, view and preview segments), RM261003ABZP-UREQ11@R1 (184).
  - UI design (`rm261003abzp-ui-design.md`): RM261003ABZP-UDES1@R2 (2271), RM261003ABZP-UDES3@R2 (2291), RM261003ABZP-UDES4@R1 (2301), RM261003ABZP-UDES10@R1 (2361), RM261003ABZP-UDES11@R1 (2371); surfaces Editor window (541) and Browser preview page (1025); RM261003ABZP-US1@R2 (2061), RM261003ABZP-US2@R2 (2070), RM261003ABZP-US8@R1 (2124), RM261003ABZP-US9@R1 (2133); RM261003ABZP-UV1@R2 (2144), RM261003ABZP-UV3@R2 (2168), RM261003ABZP-UV9@R1 (2240), RM261003ABZP-UV10@R1 (2252).
- **Assigned parent obligations:**
  - Requirements: RM261003ABZP-REQ5@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2 (live-preview and TypeScript-source keystroke/open, scrolling), RM261003ABZP-REQ11@R3 (registration-only extension incl. block renderer and `csv` file type).
  - Design: RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R2 (`preview.*` config), RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1 (`live` and `reading` views).
  - Success/verification: RM261003ABZP-S5@R1, RM261003ABZP-S8@R1, RM261003ABZP-S9@R1, RM261003ABZP-S11@R1; RM261003ABZP-V7@R2, RM261003ABZP-V8@R1, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V16@R2.
  - UI: RM261003ABZP-M2@R1, RM261003ABZP-M7@R1, RM261003ABZP-M1@R1 (segments); RM261003ABZP-UREQ3@R2, RM261003ABZP-UREQ4@R1, RM261003ABZP-UREQ10@R1, RM261003ABZP-UREQ6@R1 (unresolved-link style), RM261003ABZP-UREQ1@R2 (segments), RM261003ABZP-UREQ11@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES10@R1, RM261003ABZP-UDES11@R1; RM261003ABZP-US1@R2 via RM261003ABZP-UV1@R2 (full), RM261003ABZP-US2@R2 via RM261003ABZP-UV3@R2, RM261003ABZP-US8@R1 via RM261003ABZP-UV9@R1 (incl. recorded manual check at 1200 px and 375 px, light/dark, offline), RM261003ABZP-US9@R1 via RM261003ABZP-UV10@R1 and RM261003ABZP-UV9@R1.
  - Phase design: Components and files (DI3 rows, lines 130–135, 141), Runtime and failure flow (143–173), Code shapes `live-preview.ts` (200–222) and `preview/server.ts` (224–241), Contracts, data, and state DI3 additions (175–197).
  - Downstream work boundary (lines 390–395): confirm the OpenTUI image API at the pinned version; choose math/Mermaid approximation details within M2 and page CSS within M7; may not parse Markdown in `src/ui`, lay out rows outside the viewport, add a mutating preview route, change `RenderLine`, the `layoutText` signature, or the G4 registry signatures, or add Markdown knowledge to `core/kernel`.
- **Dependency gates:**
  - G2 (consumer; due before DI3 execution) — phase file line 70. Satisfied: DI2 merged as `9adb285` (PR #2) with V4/V5/V6/V18 passing, and the PH1 exit is recorded (phase file Progress lines 576, 580; index line 144).
  - G4 (producer; DI4's `![[file.base]]` renderer waits for it) — phase file line 72. Required output: the `blockRenderers` registry, `widget` decorations with row reservation through `layoutText`, the `widgetPainters` registry, and unlisted embed buffers; evidence is the DI3 PR merged with V7@R2 and V16@R2 passing.
- **Accepted at:** PH2@R3 and DI3@R2 approved (phase file Approval, lines 587–602): R1 and R2 under the user's delegation on 2026-10-03; post-DI1 and post-DI2 synchronizations approved by the user on 2026-10-03 and 2026-10-04 (revisions retained); R3 approved by the user on 2026-10-04 (manual releases; DI3@R2 retained). This W accepts the binding on 2026-10-04 under the user's self-drive request for this discussion run.

Use revision-qualified parent PH/DI/REQ/DES/S/V and applicable M/UREQ/UDES/US/UV references. Reference definitions instead of copying them; if paths move, resolve the same IDs and revisions. Check current index/phase assignments and existing W bindings before accepting a new assignment.

### Previous Accepted Bindings

None

### Parent Synchronization

- **Registration or discussion update:** Pending parent synchronization.
  - `rm261003abzp-roadmap-index.md`, Delivery Items, RM261003ABZP-DI3@R2 row (line 133): Work `Pending` → `W261003S6BQ`; PR stays `Pending`. Line 136 sentence: add "RM261003ABZP-DI3@R2 W261003S6BQ (PR pending)".
  - `rm261003abzp-roadmap-index.md`, Work Progress, RM261003ABZP-DI3@R2 row (line 144): Work stage `Not started` → `Discuss`; Next gate → the DI3 requirements and system design; evidence → this context file.
  - `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Progress table, RM261003ABZP-DI3@R2 row (line 580): Work `Pending` → `W261003S6BQ`; delivery status `Not started` → `In progress (discussion)`.
  - Evidence: `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-discuss-context.md`. No other W binds DI3: `.s1mple/work/done/` holds only W261003HEGE (DI1) and W261003FX70 (DI2), and `.s1mple/work/active/` holds only the roadmap and this W.

The main orchestrator owns this receipt. It does not replace parent W/PR assignments or the index's work-progress view; update the parent only with explicit authorization. Later stages record their synchronization receipts in their own artifacts.

## 1. User Input

### Original Input

> self-drive /s1mple-discuss based on the requirements/plans
> follow with this criteria:
> - choose options/designs/approaches that are stable, simple, easy to maintain and extend
> - follow industry standards and comply project standards

The topic, set earlier in the conversation, is the next roadmap item RM261003ABZP-DI3@R2 on branch `feat/rm261003abzp-di3-live-preview`.

### Consolidated Requirement or Problem

Deliver RM261003ABZP-DI3@R2. Markdown notes render in Obsidian-style live preview: the `livePreview` decoration provider for the `live` and `reading` views on `markdownFileType`, with reveal, rich blocks, folds, note embeds, images on the kitty/sixel/blocks/placeholder tiers, the `view.cycle`/`task.toggle`/`fold.toggle` commands, widget painters, and the statusline `view` and `preview` segments. `:Preview` serves a read-only local browser mirror: `renderHtml`, a `src/preview` server with a Host allowlist, realpath containment, SSE `doc`/`stopped`, and `:Preview`/`:PreviewStop`, plus the page per the UI design. The work also adds the V12 keystroke/open benchmarks and the V16 registration-only extension proof (including a test-only `csv` file type), and produces the G4 outputs DI4 consumes.

### Constraints and Assumptions

- The user delegated discussion decisions for this run (self-drive). Every choice favors stable, simple, maintainable, extensible options that follow industry and project standards.
- Parent definitions are binding: this W may refine DI3 scope but may not waive obligations or change the shared contracts listed in the downstream work boundary.
- `src/core` stays pure; only `src/ui` imports `@opentui/*`; `src/preview` imports only `src/preview` and `src/core` (`test/boundaries.test.ts:29-31`).
- Exact npm pins; any new dependency is a deliberate, exact-pinned addition (`project.md` Constraints). KaTeX and Mermaid are loaded by the page from jsDelivr, not bundled (DES13@R2).
- No work-process identifiers in code (`.s1mple/S1MPLE.md` Implementation).
- The state file stays `"version": 1`; fold state is not persisted (phase file line 287).
- Accepted mockups are M1@R1, M2@R1, M7@R1. M1@R2 and M3@R2 are awaiting review as drafts (`ui-mockups/manifest.md:92`); DI3 binds to M1@R1.

## 2. Project Structure

- `src/core/kernel/view/` — `layoutText`, `Decoration`, `DecorationProvider`, `TextView`, `RenderLine`, `Widget`, `Sign`; the provider host DI3 plugs into.
- `src/core/filetypes/registry.ts` — `FileType`, `ViewSpec` (with `input` hook), `EditorKindRegistry`, `FileTypeRegistry`; where `live` and `reading` views are registered on Markdown and where the `csv` proof registers.
- `src/core/lang/markdown/` — `Doc` and block cache (`doc.ts`), lazy per-block mdast (`mdast.ts`), `syntaxExtensions` (`syntax.ts:727`), block kinds (`blocks.ts:1`); home of the new `live-preview.ts`, `reveal.ts`, `renderers/*`, `html.ts`, `commands.ts`.
- `src/core/state/` — `AppState`, `BufferState`, `WindowState`, effects (`types.ts`), store (`store.ts`), status segments (`status.ts`); gains `view` cycling, `folds`, `listed`, `preview`, and the `PreviewCtx` builder.
- `src/core/config/schema.ts` — gains the `preview` section (DES14@R2).
- `src/ui/editors/text-view.ts` — `EditorView`, the single caller of `layoutText`; gains sign and widget painting and the view `input` hook wiring.
- `src/ui/views/statusline.ts` — gains the `preview` segment.
- `src/ui/widgets/`, `src/ui/images.ts` — new: widget painter registry, image tier selection and LRU.
- `src/workspace/images.ts` — new: reads image bytes on request.
- `src/preview/` — new: `server.ts`, `page.html`.
- `src/app/{main,effects,lifecycle}.ts` — registrations, new `startPreview`/`stopPreview`/open-browser effects, and preview stop on exit.
- `test/fixtures/`, `test/bench/`, `scripts/bench-gate.ts` — `tour.md`, images, the live-preview keystroke and open benches.

## 3. Standards and Patterns

### Applicable Standards

- `.s1mple/docs/project.md` Boundaries — layer rules and package homes, enforced by `test/boundaries.test.ts` (`LAYER_RULES` line 16, `src/preview/` rule lines 29–31, `PACKAGE_HOMES` line 45).
- `.s1mple/docs/project.md` Engineering Standards — exact pins, SHA-pinned actions (`test/repo.test.ts`).
- `.s1mple/docs/languages/typescript.md` — strict TS 7, `import type`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, Biome, knip with zero findings, colocated `bun:test` units named by behavior.
- `.s1mple/docs/languages/typescript.md` Error Handling — throwing handlers keep the previous state and toast; adapters report failures as result actions.
- `rm261003abzp-requirements.md:273` REQ11@R3 — CommonMark 0.31.2 + GFM, Obsidian Flavored Markdown, `NO_COLOR`, registration over edits, a kernel free of Markdown.
- `rm261003abzp-design.md:409-417` — preview routes: hostname `127.0.0.1`, Host ∈ {`127.0.0.1:<port>`, `localhost:<port>`} else 403, realpath containment else 404, no mutating routes.
- `rm261003abzp-design.md:1030` V12@R2 and `scripts/bench-gate.ts:8-14` — benchmark gate at 2× target, median of 5.
- `.s1mple/S1MPLE.md` Implementation — no work-process identifiers in code.

### Existing Patterns

- `src/core/filetypes/registry.ts:8-14` — a view is `{id, readOnly?, decorations, input?}`; the first view is the default (line 39).
- `src/core/kernel/view/decorations.ts:10-26` — `mark`, `replace` (inline or block, with spans or widget), `widget` (inline or block), `line` (style or sign); providers are pure functions of the view.
- `src/core/kernel/view/text-view.ts:19-68` — `layoutText` skips folded lines (`v.folds`), counts a widget-only row as `max(1, widget.rows)` rows, puts column-0 block widgets above and others below their line.
- `src/core/lang/markdown/mdast.ts:33-51` — `blockNode` parses one block on demand, cached by hash (2,048-entry LRU), positions relative to the block's first line.
- `src/core/lang/markdown/doc.ts:77-125` — `parseDoc` reuses unchanged blocks by hash; only changed blocks are rescanned.
- `src/core/kernel/commands/registry.ts:5-35` — commands carry optional `filetypes`; `list(filetype)` filters them. `src/core/kernel/commands/keymap.ts:7` — `KeyScope = {mode, filetype?}`.
- `src/core/state/status.ts:43-74` — the file-type decision for statusline segments lives in core; `view` is already a segment (line 54) and the UI hides it when narrow (`src/ui/views/statusline.ts:77`).
- `src/ui/editors/registry.ts:6-17` — `editorViews` by editor kind; later registration replaces.
- `src/app/main.ts:98-103` — file types and commands are registered in the composition root.
- `src/app/effects.ts:172-335` — effects run in a `switch` on `kind`; results come back as actions.
- `src/workspace/system.ts:25`, `src/workspace/trash.ts:18` — external processes start with `Bun.spawn`.
- `test/bench/source-keystroke.bench.ts:20-46` — benches mount the shell through `test/support/ui.ts` `mountShell`, time `keys` + `renderOnce`, and print one JSON line.

## 4. Architecture

```text
key → src/ui (normalize) → store.dispatch → core update → { state, effects }
                                                 │
         EditorView.layout ◄── state             └─► src/app effect runner ─► src/workspace (fs, images*)
           │                                                               └► src/preview server* (Bun.serve)
           └─ layoutText(view, [highlightMarks, ...viewSpec.decorations, searchMarks, selectionMarks], b.analysis)
                                       ▲
              markdownFileType.views ──┘   today: [{ id: "source", decorations: [] }]
              DI3 adds: live (default), reading → livePreview provider ← MarkdownViewInput { doc, view, ctx: PreviewCtx }

  Doc (parseDoc, block cache) ──► livePreview → blockRenderers* → Decoration[] → RenderLine[] → EditorView paints spans, signs*, widgets* (widgetPainters*)
                              └─► renderHtml* → /render fragment → SSE doc* → browser page*
  (* = new in DI3)
```

- `core/kernel/view` — language-neutral layout of visible lines; no Markdown types.
- `core/lang/markdown` — `Doc`, per-block mdast, and (new) the live-preview provider, block renderers, reveal, and `renderHtml`.
- `core/state` — reducer and state; (new) view cycling, folds, unlisted embed buffers, preview on/off, and the `PreviewCtx` builder.
- `ui/editors/text-view.ts` — paints `RenderLine[]`; (new) signs, widget rows through registered painters, and image tiers.
- `workspace/images.ts` — (new) reads image bytes; `app` injects the loader into the UI.
- `preview/server.ts` — (new) `Bun.serve` on `127.0.0.1:0`; reads state through a store subscription and renders with core `renderHtml`.

## 5. Code Flow

```text
store.dispatch(key) → update → buffer text changes → fileType.analyze (parseDoc, reuses unchanged blocks) → b.analysis = Doc
store notifies → Shell repaint → EditorView.layout(s, b, rows, cursor, width)            (src/ui/editors/text-view.ts:390-431)
   view = { buf, width, topRow, rows, cursor, folds: new Set(), visible }               (line 396-404: folds always empty)
   spec = fileType.views.find(id === b.view) ?? views[0]                                 (line 407)
   layoutText(view, [highlightMarks(ft.highlighter), ...spec.decorations, search, selection], b.analysis)   (line 410-419)
   throw → plain spans for visible lines                                                  (line 420-429)
```

1. A key dispatches an action; `update` edits the buffer and re-analyzes it, so a Markdown buffer's `analysis` is a fresh `Doc` that reuses unchanged blocks (`doc.ts:77`).
2. The shell repaints from state. `EditorView.layout` builds a `TextView` with an empty fold set and passes `b.analysis` directly as the provider input. `ViewSpec.input` exists in the registry (`registry.ts:13`) but no caller uses it yet, and there is no `core/state/view-context.ts`.
3. `layoutText` runs every provider over the visible range and emits rows. Widget-only rows count as `widget.rows` rows (`text-view.ts:30-33`). The UI paints spans with `paintLine`; signs and widgets in `RenderLine` are not painted yet.
4. `markdownFileType` has one `source` view (`file-type.ts:10`), so Markdown is painted only with lowlight highlighting today. `BufferState.view` is a free string (`types.ts:71`), persisted per buffer (`types.ts:195`).
5. There is no preview state, no `startPreview`/`stopPreview` effect, no `Bun.serve`, and no browser-open helper in `src`. The store's `subscribe` (`store.ts:26-29`) is the hook the phase design uses for SSE broadcast.

## 6. Boundaries

### In Scope

- Everything in DI3@R2 Scope (phase file lines 332–349): the `livePreview` provider and `live`/`reading` views, reveal (line, block, selection-aware), the full REQ5@R2 element list, note embeds with `embedMaxRows`, Markdown-scoped `view.cycle`/`task.toggle`/`fold.toggle`, widget painters (`image`, `embed`, `rule`) and sign painting, image tiers with lazy decode and a 64 MiB LRU, `preview.*` config, `renderHtml`, the preview server and page, the statusline `view` and `preview` segments, the V12 bench in CI, and the V16 registration test.
- G4 outputs for DI4: `registerBlockRenderer`, widget row reservation, `widgetPainters`, and unlisted embed buffers, with stable signatures.
- AppState additions: `buffers[].view` default `live` for Markdown, `buffers[].listed`, window `folds`, `preview` (phase file lines 182–186).

### Out of Scope

- The `base` block renderer and `base` widget painter (DI4 through G4).
- Persisted fold state; bundled KaTeX/Mermaid; any write route in the preview server; live views, folding, or outline for code files (phase file lines 350–355).
- Daily notes, templates, Bases (DI4).
- Publishing a release; the PH2 exit dry run happens after DI4.

### Interfaces and Dependencies

- `layoutText(v, providers, analysis)` and `RenderLine` — fixed by the downstream boundary; DI3 adds providers and supplies `folds` only.
- `DecorationProvider<S>`, `Decoration`, `Widget {type, data, rows}`, `Sign` — existing kernel types (`decorations.ts`, `types.ts`).
- `ViewSpec.input(analysis, ctx)` — existing hook; DI3 is its first user (`MarkdownViewInput`, `PreviewCtx`, phase file lines 205–216).
- `blockNode(doc, block, text)` — lazy per-block mdast for renderers and `renderHtml`.
- `NoteIndex` with `resolveLink` — feeds `PreviewCtx.isResolved` and wikilink `href`s.
- `@opentui/core` 0.5.14 image API (verified in `node_modules`):
  - `NativeImage.decode(bytes)` and `NativeImage.load(source)`, with `resize`, `info()`, and `dispose()` (`image.d.ts:81-114`); `imageInfo(bytes)` reads the size without decoding (`image.d.ts:80`).
  - `OptimizedBuffer.drawImage(image, x, y, width, height, pixelWidth?, pixelHeight?, sx?, sy?, sw?, sh?, protocol?)` returns `boolean` (`buffer.d.ts:63`).
  - `ImageRenderProtocol = "auto" | "kitty" | "sixel" | "blocks"` (`types.d.ts:57`); `TerminalCapabilities` has `kitty_graphics`, `sixel`, and `multiplexer` (`types.d.ts:63-73`); `renderer.capabilities` (`renderer.d.ts:453`).
  - `resolveImageRenderProtocol(requested, capabilities, hasResolution)` is exported (`renderables/Image.d.ts:14`). In `auto` it returns `blocks` with no capabilities or under tmux, `kitty` when `kitty_graphics`, `sixel` when `sixel` and the pixel resolution is known, and otherwise `blocks` (`index.bun.js:9253-9266`).
  - `ImageRenderable` (source, fit, protocol, `onLoad`/`onError`) also exists (`renderables/Image.d.ts:15-46`).
  - There is no text-placeholder tier; `images = "off"` is app-side.
- `Bun.serve` (Bun 1.4.2) for the server; `Bun.spawn` for opening the browser (`open` on macOS, `xdg-open` on Linux — no helper exists yet).
- `store.subscribe` for the debounced `doc` broadcast.

## 7. Unknowns

- **Provider input wiring:** `EditorView.layout` passes `b.analysis` straight to providers (`text-view.ts:410-418`) and ignores `ViewSpec.input`. Where the `PreviewCtx` builder lives (`core/state/view-context.ts` per the phase design) and how the UI gets it without knowing Markdown must be designed.
- **Folds and scroll math:** `TextView.folds` is always an empty set (`text-view.ts:402`), `WindowState.content` has no `folds` (`types.ts:90`), and scrolling is line-based (`text-view.ts:246-252`). How folds and reserved widget rows enter the core's cursor-follow and scroll logic is undecided.
- **Missing state fields:** `BufferState` has no `listed` flag and `AppState` no `preview` field. Unlisted embed buffers need load, eviction, and exclusion from the bufferline, the session snapshot, and autosave.
- **Image tier testing:** `TestRendererOptions` has no capability override (`testing/test-renderer.d.ts:6-11`). V8 may need to test tier selection through the exported pure `resolveImageRenderProtocol`, or through a painter seam that takes capabilities. Whether the test renderer captures kitty/sixel output is unverified.
- **Image placement constraints:** whether `drawImage` with kitty or sixel behaves correctly for partially scrolled widget rows and on repaint (stale placements) is unverified at 0.5.14.
- **Config defaults:** the design lists `preview.mode` (`"live"`), `preview.embedMaxRows`, and `preview.images` (`design.md:423`), but no `embedMaxRows` default is defined in the parent documents.
- **`view.cycle` vs. persisted view:** the session persists `buffers[].view` (`types.ts:195`), and Markdown's default view changes from `source` to `live`. How restored `source` views from PH1 sessions are treated is undecided.
- **Preview naming clash:** an existing `readPreview` effect serves picker previews (`types.ts:341`, `effects.ts:314`). The browser-preview effects and state need distinct names.
- **Browser-open failure:** no open helper exists; the phase design says a failure shows a toast with the URL (phase file line 157).
- **Mockup drafts:** M1@R2 and M3@R2 are awaiting review (`ui-mockups/manifest.md:92`); DI3 binds to M1@R1 for the statusline segments.
