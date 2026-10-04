# W261003S6BQ Plan Context

## Status

`Ready`

The finalized system design is the single governing design, the roadmap baseline (RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3) still matches the current parent files, and the only gate due before execution (G2) is satisfied. Two verification gaps and one deferred version pin are resolved from project evidence (section 7); none blocks planning.

## 1. Sources

| Source | Path | Use |
|---|---|---|
| s1mple instructions | `.s1mple/S1MPLE.md` | Workflow behavior and required context |
| Project document | `.s1mple/docs/project.md` | Reusable project baseline |
| System design | `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md` (`Finalized System Design`) | Technical authority, including UI/frontend technical surfaces |
| UI design | Not applicable — this W has no UI design; parent UI obligations (RM261003ABZP-UDES10@R2, RM261003ABZP-UV9@R2, and the other assigned UREQ/UDES/US/UV) are covered through the system design's Assigned Parent Obligation Coverage, with `rm261003abzp-ui-design.md` as the parent UI/UX authority | Parent UI authority only through the system design |
| System requirements | `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-requirements.md` | Required system behavior (REQ1–REQ8, acceptance checklist) |
| UI requirements | Not applicable — no W UI requirements artifact; parent UREQs are bound through the discussion context | — |
| Research | Not needed — the design records `Research Source: None` | — |
| Discussion context | `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-discuss-context.md` | Roadmap binding, constraints, existing patterns |
| UI context | Not applicable — no W UI context artifact; current UI code evidence is in the discussion context sections 2–5 | — |
| Roadmap sources | `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md`, `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, `rm261003abzp-design.md`, `rm261003abzp-ui-design.md` | Validate the accepted binding, assigned scope, and gates |
| Additional project files | `.s1mple/docs/languages/typescript.md`, `.s1mple/docs/communication.md`, `src/ui/editors/text-view.ts`, `src/core/state/link-commands.ts`, `test/boundaries.test.ts`, `test/ui/theme.golden.test.ts`, `src/core/state/{session,config}.test.ts`, `package.json`; `../alfred/apps/tui/src/view/markdown/{math,mermaid}.ts`, `../alfred/apps/tui/src/view/editor/reveal-units.ts`; npm registry (`mermaid`, `katex`) | Anchor checks, port references, version pin |

## 2. Governing Design Handoff

### Source Authority

- **System design:** `w261003s6bq-system-design.md` — authoritative for architecture, modules, state, contracts, files and symbols, wiring, runtime flows, and verification (S1–S18, V1–V51), including the terminal UI and browser page technical surfaces.
- **UI design:** Not applicable — look and interaction come from the accepted parent UDES records and mockups RM261003ABZP-M1@R1, M2@R1, M7@R1, which the system design references rather than redefines.
- **Alignment:** Single governing design.

### Approved Direction

Deliver RM261003ABZP-DI3@R3 in one PR. Markdown gets `live` (default), `source`, and `reading` views whose decorations come from one pure `livePreview` provider over the existing `Doc`; the kernel, `RenderLine`, and `layoutText` stay unchanged (design §2 Proposed Architecture, DES1, DES2). Per-frame context reaches the provider through a new `ViewContextRegistry` in `core/state`, called by `EditorView` with language-neutral `ViewHost` facts (DES1). Folds are block ids in window state (DES5); embeds load as unlisted buffers tracked per embedding note (DES4); `EditorView` lays out once per frame, fits the cursor, and paints signs and widget rows through a `widgetPainters` registry (DES6). Images decode through OpenTUI with a pure tier function and a 64 MiB UI-side LRU; web images download through a bounded `fetchImage` (DES7). Math and Mermaid render as Unicode/ASCII text with per-hash caches (DES3).

`:Preview` starts a loopback-only, GET-only `Bun.serve` owned by `src/app/preview-host.ts`; it renders with the pure `renderHtml` and pushes `{path, version, line}` over SSE after a 100 ms debounce (DES9–DES11). The page, KaTeX, and Mermaid are embedded in the binary through `type: "file"` imports and served same-origin under a strict CSP (DES12). `preview.*` config (DES13), four new bench targets, and the `csv`/`grid` registration proof (DES14) complete the item. The G4 outputs DI4 consumes keep the phase-design signatures.

### Design Coverage

| Source | Chain | Planning meaning | Canonical detail |
|---|---|---|---|
| System design | `W261003S6BQ-REQ1@R1 → DES1, DES2, DES6, DES8, DES9, DES10, DES11, DES13, DES14 → S1–S3, S9–S12, S14–S18 → V1–V5, V20–V24, V26–V34, V36–V45` | Inherited DI3 obligations, G4 outputs, benches, extension proof | §1 Requirement Coverage; §1 Assigned Parent Obligation Coverage |
| System design | `W261003S6BQ-REQ2@R2 → DES7 → S8 → V17, V18, V19, V40, V50, V51` | Terminal images, tiers, LRU, web downloads | §7 `src/ui/images.ts`, `src/workspace/images.ts` |
| System design | `W261003S6BQ-REQ3@R1 → DES3 → S4 → V6, V7, V8, V44` | Math and Mermaid text renderers | §7 `renderers/math.ts` and `renderers/mermaid.ts` |
| System design | `W261003S6BQ-REQ4@R1 → DES4, DES13 → S5 → V9, V10, V11, V12, V25, V49` | Note embeds through unlisted buffers | §7 `src/core/state/embeds.ts`, `renderers/embed.ts` |
| System design | `W261003S6BQ-REQ5@R1 → DES5, DES6 → S6, S7 → V13, V14, V15, V16` | Folds, widget rows, cursor-fit scrolling | §7 `src/ui/editors/text-view.ts`, `markdown-commands.ts` |
| System design | `W261003S6BQ-REQ6@R1 → DES1, DES8, DES13 → S1, S16 → V1, V2, V3, V38` | View input wiring, restored views | §7 `view-context.ts`, `markdown-view.ts`, `buffers.ts` |
| System design | `W261003S6BQ-REQ7@R3 → DES12 → S13 → V34, V35, V42, V47, V48` | Embedded page and browser libraries, CSP | §7 `src/preview/assets.ts` … `page.css` |
| System design | `W261003S6BQ-REQ8@R1 → DES9, DES10, DES11 → S10, S11, S12, S17 → V20–V24, V26–V33` | HTML, server, SSE follow, browser launch | §7 `html.ts`, `src/preview/server.ts`, `preview.ts`, `preview-host.ts` |
| UI design | Not applicable — parent `UREQ → UDES → US → UV` chains are carried through the system design's "UI obligations" row: US1@R2/UV1@R2 → V36; US2@R2/UV3@R2 → V4, V16, V25; US8@R1/UV9@R2 → V42 (+ V34, V48 automated part); US9@R1/UV10@R1 → see Planning Gaps (DI3 states) | Terminal and page states realized per accepted mockups | §1 Assigned Parent Obligation Coverage, "UI obligations" |

### Applicable Code Shapes

| Source shape | Target | Planning use |
|---|---|---|
| §7 `src/core/lang/markdown/live-preview.ts` | `livePreview`, `PreviewCtx`, `MarkdownViewInput`, `BlockRenderer`, `registerBlockRenderer`, `blocksIn` | G4 signatures must match phase design `:205-230`; tasks for provider, registry, failure isolation |
| §7 `reveal.ts`, `render-key.ts`, `inline.ts`, `render-cache.ts`, `renderers/*` | `reveal`, `renderKey`, `inlineDecorations`, `RenderCache`, `builtinRenderers`, per-key renderers | Renderer tasks; goldens V4 |
| §7 `renderers/math.ts`, `renderers/mermaid.ts` | `mathText`, `mermaidText` | Port from `../alfred/apps/tui/src/view/markdown/{math,mermaid}.ts`; `beautiful-mermaid@1.1.3` |
| §7 `renderers/embed.ts`, `renderers/image.ts` | `embedRenderer`, `sectionLines`, `imageRenderer`, `isWebUrl` | Embed and image widgets |
| §7 `file-type.ts`, `html.ts` | `markdownFileType` (live, source, reading), `renderHtml`, `escapeHtml`, `HtmlCtx` | View registration; HTML |
| §7 `src/core/state/view-context.ts`, `markdown-view.ts` | `ViewContextRegistry`, `ViewHost`, `ViewContextBuilder`, `markdownViewContext` | Context wiring before provider tests can run end to end |
| §7 `embeds.ts`, `types.ts`, `update.ts`, `buffers.ts` | `syncEmbeds`, `embedTargets`, `settleEmbedRead`; `BufferState.listed/embeds`, `WindowState.content.folds`, `AppState.preview`, actions/effects; `Registries`, `createUpdate`; `defaultView`, `onFileLoaded`, `onFileRefused`, `showBuffer` | State foundation tasks |
| §7 `markdown-commands.ts`, `keys.ts`, `preview.ts`, `{status,session,picker,commands,link-commands,init}.ts` | `markdownCommands`, `markdownBindings`, `toggleTask/Fold`, `cycleView`, `note.enter`; `runVim` read-only refusal; preview reducers, `followTarget`, `htmlCtx`; `<CR>` binding removal | Commands and preview lifecycle |
| §7 `src/core/config/schema.ts` | `ConfigSchema.preview` | Config task (V39) |
| §7 `src/ui/editors/text-view.ts` | `EditorView`, `layoutFrame`, `fitCursor`, `paintSign` | UI layout and painting; must not import Markdown |
| §7 `src/ui/widgets/registry.ts`, `embed.ts`, `rule.ts`, `src/ui/images.ts`, `widgets/image.ts` | `WidgetPainter`, `registerWidgetPainter`, `paintEmbed`, `paintRule`, `ImageTier`, `imageTier`, `ImageCache`, `paintImage` | G4 painter registry; image tier |
| §7 `src/ui/{shell,theme}.ts`, `views/{statusline,bufferline}.ts` | `ShellDeps.loadImage/capabilities`, `ViewDeps.images`, theme tokens, `Statusline` preview segment, `Bufferline` listed only | UI wiring and UV1/UV3 states |
| §7 `src/workspace/images.ts` and `system.ts` | `readImage`, `fetchImage`, `createImageLoader`, `openUrl` | Adapters (V50, V32) |
| §7 `src/preview/server.ts`, `assets.ts`, `page.*` | `startPreviewServer`, `SECURITY_HEADERS`, `FILE_CSP`, `PAGE`, `ASSETS`, page script | Server and page |
| §7 `src/app/preview-host.ts`, `effects.ts`, `lifecycle.ts`, `main.ts` | `createPreviewHost`, effect cases, `installLifecycle` stop order, `registries()` | Composition |
| §7 `scripts/bench-gate.ts` and `test/bench/*`; `test/boundaries.test.ts`, `package.json`, `test/support/*`, fixtures | `TARGETS`, `BENCHES`, `make5000LineTs`; `PACKAGE_HOMES`, `checkImports` package-name lookup; `testRegistries`, `mountShell` options | Tooling, deps, test wiring parity |

### Runtime Flow

```text
key → handleKeyAction → runVim (reading view? refuse + hint) → setBuffer → markdown analyze (parseDoc reuses blocks)
    → createUpdate wrapper → followShownNote → syncEmbeds (read effects / evictions) → store notifies
Shell.paint → EditorView.show → host {width, rows, imageSize, cellAspect}
    → ctx = reg.viewContexts.build(ft.id, s, win, host) → input = spec.input(b.analysis, ctx)
    → fitCursor: layoutText(view, providers, input) until cursor row fits
         livePreview: blocksIn(visible) → reveal → renderer(renderKey) | throw → ⚠ sign, source kept
EditorView.renderSelf → gutter + sign | widgetPainters.get(type) (image → ImageCache → drawImage) | paintLine

:Preview → startPreview (off → starting + [startPreview]) → preview-host → startPreviewServer
        → previewStarted{port} → on(port) + [openUrl] → openUrl fails → openUrlFailed → toast URL
store.subscribe → debounce 100 ms → followTarget → SSE doc {path, version, line} → page GET /render → renderHtml
:PreviewStop / exit → previewHost.stop → "stopped" → close → shell.destroy
```

Canonical: design §5 Runtime Flows and Error Policies; §5 Failure and Recovery Rules; §5 Construction and Wiring Flow.

### Roadmap Validation

- **Accepted binding:** `w261003s6bq-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3; earlier PH2@R3 / DI3@R2 archived under Previous Accepted Bindings).
- **Parent-to-child coverage:** system design §1 Assigned Parent Obligation Coverage (Live preview, Terminal images, Markdown-scoped commands, Browser preview, Browser library delivery, Configuration, Performance, Development/CI/release budgets, Foundations and registration-only extension, UI obligations, G4 outputs, Downstream work boundary). No W UI design; assigned UI scope is covered there.
- **Baseline assessment:** Aligned. Re-read on 2026-10-04 at `HEAD` `ee33163`: phase file header `RM261003ABZP-PH2@R4` (`:3`), DI3@R3 definition `:322-403` with scope, exclusions, UI scope, and downstream work boundary matching the binding; gates G2/G4 at `:69`/`:71`; Approval `:593-609` lists DES13@R3, UDES10@R2, UV9@R2 and the R4 evidence. Index Delivery Items row (`rm261003abzp-roadmap-index.md:133`) assigns DI3@R3 → W261003S6BQ, PR Pending; Work Progress row (`:144`) shows stage Discuss, health Aligned, next Plan. No parent commit after `ee33163` touches `rm261003abzp-so-v1/`.
- **Unresolved impacts:** None.

### Cross-Work Dependency Gates

- **G2 — DI2 foundations**
  - **Parent Gate:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md:69`
  - **Producer:** RM261003ABZP-DI2@R2 — W261003FX70
  - **Required Output:** `parseDoc` with block cache and `syntaxExtensions`, `blockNode`; `markdownFileType` with `analyze` and the Markdown key scope; `layoutText` and `lowlightHighlighter`; NoteIndex with `resolveLink`; statusline segment framework; `Picker`
  - **Required Before:** DI3 execution
  - **Evidence / Pending Condition:** Satisfied — `9adb285` (PR #2) is an ancestor of `HEAD`; RM261003ABZP-V4@R2, V5@R1, V6@R2, V18@R1 passed (W261003FX70 overall verification); PH1 exit recorded (phase file Progress `:582`, `:586`; index `:144`).
  - **Integration Owner:** RM261003ABZP-DI3@R3 — W261003S6BQ
- **G4 — DI3 extension points for DI4**
  - **Parent Gate:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md:71`
  - **Producer:** RM261003ABZP-DI3@R3 — W261003S6BQ (this work)
  - **Required Output:** `blockRenderers` registry (`registerBlockRenderer`), `widget` decorations with row reservation through `layoutText`, `widgetPainters` registry (`registerWidgetPainter`), unlisted embed buffers — signatures per phase design Contracts, data, and state
  - **Required Before:** DI4 execution of the `![[file.base]]` embed renderer only; the DI4 PR merges after DI3
  - **Evidence / Pending Condition:** Pending — DI3 PR merged with RM261003ABZP-V7@R2 (W V4) and RM261003ABZP-V16@R2 (W V38, V41) passing. Not due for this plan.
  - **Integration Owner:** RM261003ABZP-DI4@R2 — W Pending

## 3. Binding Constraints

| Constraint | Source | Planning implication |
|---|---|---|
| Follow the `discuss → plan → execute` workflow; Plan behavior "Not established" | `.s1mple/S1MPLE.md` §3 | Use the s1mple-plan templates as-is; no extra project plan rules |
| Do not use the native `Explore` subagent; prefer direct inspection or `s1mple-explore` | `.s1mple/S1MPLE.md` §3 Exploration | Execution agents inspect directly |
| Implementation: keep it lean and simple; no work-process identifiers (W/REQ/DES/S/V/phase/goal ids) in comments, identifiers, test names, SQL comments, or log messages | `.s1mple/S1MPLE.md` §3 Implementation; `typescript.md` Coding Conventions | Tests named by behavior (e.g., `"a throwing renderer leaves its block as source"`), never `V5`; traceability only in `.s1mple/` and commit bodies |
| Verification: "Not established" | `.s1mple/S1MPLE.md` §3 | Use the design's V tree and `bun run check` / `bun run test:ci` / `bun run bench` as the evidence set |
| Delivery: open a PR; make CI pass and resolve conflicts with base; move the work folder `work/active/` → `work/done/` and update `.s1mple/` references; push again; CI must pass on the new head; never force-push or merge without the user's approval | `.s1mple/S1MPLE.md` §3 Delivery | Final plan part ends with these steps; merge only on user approval |
| Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required context | s1mple-plan Principle 1 | Put this in every execution prompt |
| Layer rules: `core` has no I/O, runtime, or `@opentui`; `core/lang` may not import `core/state`; only `src/ui` imports `@opentui/*`; `src/preview` imports only `src/preview` and `src/core` | `.s1mple/docs/project.md` Boundaries; `test/boundaries.test.ts:16-41` | Commands and `PreviewCtx` builder in `core/state`; exclusion rule injected from `src/app` |
| Package homes; new: `beautiful-mermaid` → `src/core/lang/markdown/`; `katex`, `mermaid` → `src/preview/`; lookup by package name | design §7 `test/boundaries.test.ts`…; `test/boundaries.test.ts:45-53,90` | Change `checkImports` before adding subpath imports |
| Exact npm pins, `bun.lock` committed, `--frozen-lockfile` | `.s1mple/docs/project.md` Constraints; `test/repo.test.ts` | `bun add <pkg>@<exact>`; commit lockfile |
| Kernel files, `RenderLine`, `layoutText` signature, G4 signatures unchanged; no Markdown in `src/ui` or `core/kernel`; no rows laid out outside the viewport; no mutating preview route | phase file `:396-401`; design §1 Binding Constraints | Each relevant task carries a "must not change" check; V47 boundary assertions |
| Strict TS 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), Biome, knip zero findings | `.s1mple/docs/languages/typescript.md` | Every group ends with `bun run check` |
| Error handling: throwing reducers keep state and toast; adapters report failures as result actions | `typescript.md` Error Handling | Preview, image, embed failures arrive as actions |
| `state.json` stays version 1; folds not persisted; unlisted buffers excluded from snapshot | design §7 Migration and Delivery | V1, V12 |
| CI runs only on PRs; releases are manual; no tag or publish | `.s1mple/docs/project.md` CI/Release; memory | No release step; V35 uses local `bun run build`, not the release workflow |
| Roadmap: parent writes require explicit authorization; planning readiness is not delivery | s1mple-plan Roadmap-Linked Work | Plan-stage parent sync recorded as a receipt or pending update |

## 4. Supporting Evidence

### Requirements

| Requirement | Design coverage | Required outcome |
|---|---|---|
| `W261003S6BQ-REQ1@R1` | DES1, DES2, DES6, DES8, DES9, DES10, DES11, DES13, DES14 | All inherited DI3 scope, G4 outputs, bench targets in CI, registration-only extension |
| `W261003S6BQ-REQ2@R2` | DES7 | Images on kitty/sixel/blocks/placeholder; workspace and bounded web downloads; 64 MiB LRU; `images = "off"` loads nothing |
| `W261003S6BQ-REQ3@R1` | DES3 | Math → Unicode, Mermaid → ASCII, labelled source fallback, cached per hash |
| `W261003S6BQ-REQ4@R1` | DES4, DES13 | Embeds capped at `embedMaxRows`, `loading…`/unresolved states, one level, unlisted and evicted buffers |
| `W261003S6BQ-REQ5@R1` | DES5, DES6 | Folds by block id; cursor stays visible with tall widgets; viewport-only layout |
| `W261003S6BQ-REQ6@R1` | DES1, DES8, DES13 | View input through registry; notes open in `live` (or configured mode), PH1 sessions restore in `live` |
| `W261003S6BQ-REQ7@R3` | DES12 | Page, KaTeX, Mermaid embedded in the binary; same-origin CSP, `nosniff`, `no-referrer`; render errors show source; works offline |
| `W261003S6BQ-REQ8@R1` | DES9, DES10, DES11 | `data-line`/`data-hash` blocks; `{path, version, line}` within 300 ms; `openUrl` failure toasts URL |
| Parent: RM261003ABZP-REQ5@R2, REQ8@R2, REQ9@R2, REQ10@R4, REQ11@R3 | via W REQ1–REQ8 (design §1) | Accepted baseline; REQ10@R4 is "No system design change" (budgets re-read on the DI3 PR, V46) |
| Requirements acceptance checklist | `w261003s6bq-requirements.md:212` | V7@R2, V8@R1, V11@R3, V12@R2, V16@R2, UV1@R2 (full), UV3@R2, UV10@R1 (DI3 states), automated UV9@R2 pass in CI; UV9@R2 manual checklist recorded |

### Research Findings

Not needed — the design records `Research Source: None`; the OpenTUI 0.5.14 image API facts are verified in the discussion context §6 from `node_modules`.

## 5. Project Implementation Context

### Relevant Structure

```text
so/
├── package.json, bun.lock, scripts/bench-gate.ts
├── src/
│   ├── app/          main.ts, effects.ts, lifecycle.ts, index-host.ts (pattern), [A] preview-host.ts
│   ├── core/
│   │   ├── kernel/view/        (unchanged) types.ts, decorations.ts, text-view.ts
│   │   ├── filetypes/registry.ts (unchanged) ViewSpec.input, readOnly
│   │   ├── lang/markdown/      file-type.ts, doc.ts, mdast.ts, blocks.ts, syntax.ts, [A] live-preview, reveal, render-key, inline, render-cache, renderers/*, html
│   │   ├── state/              types, update, init, buffers, keys, commands, link-commands, session, picker, status, [A] view-context, markdown-view, embeds, markdown-commands, preview
│   │   └── config/schema.ts
│   ├── ui/           shell.ts, theme.ts, editors/text-view.ts, views/{statusline,bufferline}.ts, [A] images.ts, widgets/*
│   ├── workspace/    system.ts, [A] images.ts
│   └── preview/      [A] server.ts, assets.ts, assets.d.ts, page.html, page.js, page.css
└── test/
    ├── boundaries.test.ts, repo.test.ts
    ├── support/{state,ui,notes}.ts, fixtures/{generate.ts, [A] tour.md, [A] images/*}
    ├── ui/{shell.golden,theme.golden}.test.ts, [A] live-preview.test.ts, [A] extension.test.ts
    ├── integration/ [A] preview-server.test.ts
    ├── e2e/quit.test.ts, pty.ts
    └── bench/ source-keystroke, open-file, startup, indexing-keystroke, [A] live-keystroke, source-open, scroll
```

### Established Patterns

| Pattern | Evidence | Planning use |
|---|---|---|
| View spec `{id, readOnly?, decorations, input?}`; first view is default | `src/core/filetypes/registry.ts:8-14` | `markdownFileType.views` = live, source, reading; DI3 is the first `input` caller |
| Decoration kinds `mark`, `replace`, `widget`, `line` (style or sign); providers pure | `src/core/kernel/view/decorations.ts:10-26` | Renderers emit only these |
| `layoutText` skips folded lines, reserves `max(1, widget.rows)` rows | `src/core/kernel/view/text-view.ts:19-68` | Widget row reservation is already kernel behavior |
| Lazy per-block mdast, 2,048-entry LRU by hash | `src/core/lang/markdown/mdast.ts:33-51` | Renderers and `renderHtml` call `blockNode` |
| Update wrapper runs `followShownNote` after each step | `src/core/state/update.ts:111` | `syncEmbeds` joins this wrapper |
| Commands carry `filetypes`; `KeyScope = {mode, filetype?}` | `src/core/kernel/commands/registry.ts:5-35`, `keymap.ts:7` | Markdown-scoped commands and bindings |
| `<CR>` → `link.follow` in Markdown scope | `src/core/state/link-commands.ts:165` | Removed; `note.enter` replaces it |
| Long-lived app resource owned by a host, driven by effects, results as actions | `src/app/index-host.ts` | `preview-host.ts` mirrors it |
| External processes via `Bun.spawn` | `src/workspace/system.ts:25,39` | `openUrl` |
| Benches mount the shell via `mountShell`, time `keys` + `renderOnce`, print one JSON line | `test/bench/source-keystroke.bench.ts`; `scripts/bench-gate.ts:8-23` | New benches and targets |
| UV10 golden suite with `color: "nocolor"` mount option | `test/ui/theme.golden.test.ts:12-40` | Home for the DI3 UV10 states (Planning Gaps) |
| Statusline segment decision in core; UI hides `view` when narrow | `src/core/state/status.ts:43-74`, `src/ui/views/statusline.ts:77` | Add `preview` segment, drop order |

### Code Surfaces

| Path | Current symbol or wiring | Intended change | Evidence |
|---|---|---|---|
| `src/ui/editors/text-view.ts` | `EditorView.layout` — empty `folds`, `views.find(id === b.view) ?? views[0]`, `layoutText(…, b.analysis)` | View input via registry, one layout per frame, `fitCursor`, sign column, widget rows | `src/ui/editors/text-view.ts:390-431` (`:402`, `:407`, `:410`) |
| `src/ui/editors/text-view.ts` | `paintPreview` — picker preview, always the `source` view | Unchanged; picker previews stay source | `src/ui/editors/text-view.ts:93-160` (`:141`) |
| `src/core/lang/markdown/file-type.ts` | `views: [{ id: "source", decorations: [] }]` | live, source, reading | `file-type.ts:10` |
| `src/core/state/types.ts` | `BufferState.view: string`; `WindowState.content` without `folds`; `readPreview` effect (picker) | `listed`, `embeds`, `folds`, `AppState.preview`, new actions/effects with names distinct from `readPreview` | `types.ts:71`, `:90`, `:195`, `:341` |
| `src/core/state/store.ts` | `subscribe(f)` | Used by server for debounced SSE | `store.ts:7`, `:26` |
| `src/core/state/link-commands.ts` | `<CR>` → `link.follow`; `followLink` | Binding removed; `followLink` exported | `link-commands.ts:165` |
| `src/app/lifecycle.ts` | `shutdown` → `d.shell.destroy()` | `stopPreview` before `shell.destroy()` | `lifecycle.ts:28-45` |
| `test/boundaries.test.ts` | `PACKAGE_HOMES[specifier]` | Lookup by package name; three new homes | `boundaries.test.ts:45-53`, `:90` |
| `scripts/bench-gate.ts` | `TARGETS` (5), `BENCHES` | +4 targets and benches | `bench-gate.ts:8-23` |
| `package.json` | 11 dependencies, no katex/mermaid/beautiful-mermaid | + `beautiful-mermaid` 1.1.3, `katex` 0.16.47, `mermaid` exact current | `package.json:18-30` |

### Verification Surfaces

| Suite or check | Location or command | Required verification |
|---|---|---|
| Colocated unit suites | `src/core/lang/markdown/{live-preview,reveal,html}.test.ts`, `renderers/{math,mermaid,embed}.test.ts`; `src/core/state/{embeds,markdown-commands,preview,view-context}.test.ts`; `src/ui/images.test.ts`; `src/preview/assets.test.ts`; modified `src/core/state/{config,session}.test.ts` | V4, V5, V14, V1r, V6–V13, V2, V3, V17, V19, V29, V31, V39, V40, V48, V49, V51, V1 |
| Workspace integration | `src/workspace/images.test.ts` (local `Bun.serve`) | V50 |
| Component | `test/ui/live-preview.test.ts`, `test/ui/extension.test.ts`, modified `test/ui/shell.golden.test.ts`, `test/ui/theme.golden.test.ts` | V15, V16, V18, V25, V37, V38, V41, V36; UV10 DI3 states |
| Integration | `test/integration/preview-server.test.ts` | V22–V24, V26–V28, V30, V32, V34 |
| E2E (PTY) | modified `test/e2e/quit.test.ts` | V33 |
| Fast gate | `bun run check` | V47 (biome, tsc, knip, boundaries, unit) |
| CI suites | `bun run test:ci` | Component, integration, e2e |
| Build | `bun run build`; run `dist/so` from an empty dir | V35 |
| Bench | `bun run bench` (Linux CI); reference-machine readings in PR | V44, V45 |
| CI timing | PR CI | V46 |
| Manual | Browser at 1200/375 px, light/dark, offline | V42 (UV9@R2), recorded in PR |
| Spike | kitty, Ghostty, WezTerm, iTerm2, Terminal.app | V43, before painter implementation; outcome recorded, becomes a V18 assertion |

## 6. Additional Inspections

| Planning question | Files inspected | Finding |
|---|---|---|
| Are parent records still at the bound revisions? | phase file `:1-75`, `:322-403`, `:575-609`; index `:125-150`; `git log -- rm261003abzp-so-v1/` | Yes; last parent commit is `ee33163` (this W's alignment) |
| Is G2 evidence real? | `git merge-base --is-ancestor 9adb285 HEAD` | `9adb285` "feat: DI2 navigation and links (W261003FX70) (#2)" is an ancestor |
| Which `mermaid` version is "current"? | `npm view mermaid` | `12.1.0` (published 2026-10-02); its `exports` include `"./*"`, so `mermaid/dist/<file>` subpaths resolve; exact dist names confirmed at install (design §7 assets) |
| Is `katex@0.16.47` available? | `npm view katex@0.16.47`; design §7 notes `bun.lock:256,310` | Yes |
| Do port sources exist? | `../alfred/apps/tui/src/view/markdown/{math,mermaid}.ts`, `../alfred/apps/tui/src/view/editor/reveal-units.ts` | Present |
| Is `EditorView` the only `layoutText` caller? | `src/ui/editors/text-view.ts` | No — `paintPreview` (picker preview) also calls it with the `source` view; it is outside the design's change set and must stay source-only |
| Where do V1 and V39 live? | `src/core/state/session.test.ts`, `src/core/state/config.test.ts` | Both exist; the design's "`schema.test.ts` or `config.test.ts`" resolves to `src/core/state/config.test.ts` |
| Where is the UV10 suite? | `test/ui/theme.golden.test.ts` | Exists (DI2 picker selection, `color: "nocolor"`) |

## 7. Planning Gaps

| Gap | Classification | Evidence or blocker |
|---|---|---|
| `mermaid` exact version is `<exact current release>` in the design | `Resolved from project evidence` | Design §7 assets defers the pin to implementation; npm current is `12.1.0`. Install with `bun add mermaid@<exact>` (bunfig `exact = true`), confirm `dist/mermaid.min.js` (or the bundle that sets `window.mermaid`), and record the version in the PR |
| UV10@R1 DI3 states (unresolved link in live view under `NO_COLOR`, light theme, 80×24) have no named V case; the design's UI obligations row lists V4, V16, V33, V36, V42, V43, and the theme invariant "tokens keep NO_COLOR fallbacks" (§7 `src/ui/{shell,theme}.ts`) has no case | `Resolved from project evidence` | Parent RM261003ABZP-UV10@R1 (`rm261003abzp-ui-design.md:2252-2262`) defines setup, action, and assertions; the requirements checklist (`w261003s6bq-requirements.md:212`) requires "UV10@R1 (DI3 states)". Plan a case in `test/ui/theme.golden.test.ts` tracing RM261003ABZP-UV10@R1 directly: an unresolved link and the reveal/error signs in `live` under `color: "nocolor"` emit no colour SGR and stay distinguishable by attribute or glyph; light theme golden; 80×24 without clipping. No new definition is created |
| V43 graphics spike must happen before painter work and its outcome must be "recorded in the plan" | `Resolved from project evidence` | Design §8 V43; phase Progress names it as the OpenTUI image API confirmation. Plan it as the first task of the image-painter group with its outcome recorded in that group's report and in the plan part; the confirmed clearing behaviour becomes a V18 assertion |
| `knip` may flag `src/preview/assets.d.ts` | `Resolved from project evidence` | Design §4 note: add it to `knip.json` `ignore` only if `bun run check` reports it, settled in the first task that adds `assets.ts` |
| `paintPreview` also calls `layoutText` | `Resolved from project evidence` | Keep it on the `source` view; no task changes it (Additional Inspections) |

## 8. Planning Handoff

- **Scope:** Everything in RM261003ABZP-DI3@R3 Scope through W261003S6BQ-REQ1@R1–REQ8: live/source/reading views and the `livePreview` provider with renderers, reveal, folds, embeds, images (terminal and web), math and Mermaid; Markdown commands and read-only view; `EditorView` signs, widgets, cursor fit; `preview.*` config; `renderHtml`, preview server, host, page, and embedded assets; statusline/bufferline changes; benches; registration-only extension; G4 outputs; Delivery per `.s1mple/S1MPLE.md`.
- **Primary boundaries:** `src/core/lang/markdown` (provider, renderers, HTML), `src/core/state` (registry, state, embeds, commands, preview), `src/core/config`, `src/ui` (EditorView, widgets, images, shell, theme, statusline, bufferline), `src/workspace` (images, openUrl), `src/preview` (server, assets, page), `src/app` (host, effects, lifecycle, main), `test/*`, `scripts/bench-gate.ts`, `package.json`/`bun.lock`.
- **Likely sequence:**

  ```text
  deps + boundaries + config + state types/registry foundation
    → provider core (live-preview, reveal, render-key, inline, cache) + basic renderers + file-type views
    → EditorView (view input, layoutFrame, fitCursor, signs) + widget registry + rule/embed painters + theme tokens
    → embeds (syncEmbeds, unlisted buffers, embed renderer) + folds + Markdown commands + read-only view
    → math/Mermaid renderers → images (V43 spike → workspace loader, ImageCache, tier, painter)
    → renderHtml → preview server + assets/page + preview reducers/host/effects/lifecycle + statusline
    → extension proof + benches + build/manual checks → Delivery (PR, CI, move to done, push)
  ```

- **Verification focus:** V4 layout goldens (RM261003ABZP-V7@R2); V5/V41 G4 extension (V16@R2); V18 tiers (V8@R1); V26–V31 server safety and follow (V11@R3); V21 XSS escaping; V34/V35/V48 CSP and embedded assets; V44 benches (V12@R2); V47 boundaries; V42 manual page checklist; UV10 DI3 states.
- **Excluded scope:** `base` block renderer and painter (DI4); persisted fold state; any write route; live views, folding, or outline for code files; daily notes, templates, Bases; publishing a release or tagging; parent roadmap edits without authorization.
- **Blocking items:** None.
