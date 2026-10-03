# W261003S6BQ: Live and browser preview — System Design

**Design Status:** Finalized System Design

**Context Source:** `w261003s6bq-discuss-context.md`

**Requirements Source:** `w261003s6bq-requirements.md`

**Research Source:** None

**Current Requirement Revisions:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ2@R1, W261003S6BQ-REQ3@R1, W261003S6BQ-REQ4@R1, W261003S6BQ-REQ5@R1, W261003S6BQ-REQ6@R1, W261003S6BQ-REQ7@R2, W261003S6BQ-REQ8@R1

**Research Reconciliation:** None — research skipped

**Unresolved Items:** None — the parent text changes for W261003S6BQ-REQ7@R2 follow a user decision and are recorded as a pending parent synchronization (Assigned Parent Obligation Coverage); they await the user's authorization to edit the roadmap and are not an open design decision.

**Approval evidence:** Self-drive of this discussion approved by the user on 2026-10-04, with the criteria "stable, simple, easy to maintain and extend" and "follow industry standards and comply project standards". Under that delegation the agent decided the system-design topics (folds, view input, render keys and G4, embed and image data flow, reading mode and commands, preview server and lifecycle, configuration, verification) by choosing the option that best meets those criteria. Serving KaTeX and Mermaid from the repository instead of jsDelivr (W261003S6BQ-REQ7@R2) was decided by the user on 2026-10-04; the delivery mechanism (embedded files, same-origin Content Security Policy) and the inline-style allowance for Mermaid were chosen under the same delegation.

**Design Boundary:** This artifact is authoritative for whole-system architecture and technical design, including UI/frontend applications, routes, modules, components, state ownership, contracts, files, symbols, boundaries, wiring, and verification when material. UI/UX look and feel, visual composition, concrete interaction treatment, responsive presentation, accessibility realization, mockups, and accepted UI-design authority belong to `s1mple-discuss-ui`.

**Finalized System Design Checklist:**

- [x] Every current qualified requirement revision has exactly one valid system-design coverage outcome: `System design required`, `No system design change`, or `No system design applicable`.
- [x] Every `System design required` outcome has the full `REQ → DES → S → V` chain.
- [x] Every `No system design change` outcome cites the existing system mechanism, exact current source, and existing verification evidence.
- [x] Every `No system design applicable` outcome explains why the requirement creates no system architecture or technical-design obligation and omits invented `DES`, `S`, and `V` records.
- [x] For roadmap-linked work, the accepted baseline has been checked against current parent definitions, every assigned parent obligation has valid child coverage, and gates due before design approval have evidence.
- [x] Historical requirement revisions are excluded from current design coverage.
- [x] When research exists, every RF-to-evaluated-revision relationship is reconciled and evaluated-versus-informed lineage is accurate; a finding that evaluated no requirement has one `None` relationship row.
- [x] When any requirement requires changed system design, the design progresses from system context and architecture to concrete files and symbols; otherwise sections 2–8 record explicit non-applicability without inventing system changes.
- [x] Every focal component, when any, has an existing target or proposed location and clear ownership.
- [x] The proposed project tree accounts for every affected source, wiring, configuration, migration, and test file as added, modified, renamed/moved, or deleted, or states why no system file changes apply.
- [x] Every changed or proposed logical contract, data model, and state item has a canonical section 7 detailed-shape reference; every unchanged item cites its exact current source and identifies affected section 7 consumers when relevant.
- [x] Every changed boundary has a contract, state rule, or signature.
- [x] Every modified symbol has an exact current source, current → final delta, and affected callers or consumers.
- [x] Detailed code design covers every important changed type, class, function, dependency, invariant, focused control flow, construction point, registration, and export; each code preview is immediately followed by an explanation of the definitions shown and how they interact.
- [x] Changed runtime flows name the participating symbols and define relevant failure policies.
- [x] Every cross-cutting, migration, and delivery concern is resolved with a concrete design location or `None — <reason>`.
- [x] Every `System design required` requirement, every design decision, and every changed invariant maps to an observable success criterion and an exact verification case and assertion.
- [x] Test suites and nested cases form one verification tree; every case names its unique risk and uses the lowest sufficient test level.
- [x] Unit and integration tests follow the section 8 quality rules without duplicating the same proof across levels.
- [x] Traceability is complete for every `System design required` outcome: `current REQ revision → DES → affected file → affected symbol → caller or wiring → runtime flow → success criterion → suite or check → exact verification case and assertion`; other outcomes have their required evidence instead of fabricated links.
- [x] UI/frontend technical design stays within the Design Boundary; UI/UX realization is deferred to `s1mple-discuss-ui`.
- [x] Every omitted structure, code preview, test level, or non-test check explains why it does not apply.

# Table of Contents

1. [Design Goals, Constraints, and Requirement Coverage](#1-design-goals-constraints-and-requirement-coverage)
2. [System Context and Architecture](#2-system-context-and-architecture)
3. [Components and Boundaries](#3-components-and-boundaries)
4. [Project Structure Changes](#4-project-structure-changes)
5. [Runtime Flows and Error Policies](#5-runtime-flows-and-error-policies)
6. [Logical Contracts, Data Models, and State](#6-logical-contracts-data-models-and-state)
7. [Detailed Code Design](#7-detailed-code-design)
8. [Testing and Verification](#8-testing-and-verification)
9. [Finalized Design Decisions](#9-finalized-design-decisions)
   - [W261003S6BQ-DES1: Markdown views and the view-context registry](#w261003s6bq-des1-markdown-views-and-the-view-context-registry)
   - [W261003S6BQ-DES2: Live-preview provider, render keys, reveal, and the block-renderer registry](#w261003s6bq-des2-live-preview-provider-render-keys-reveal-and-the-block-renderer-registry)
   - [W261003S6BQ-DES3: Math and Mermaid text renderers](#w261003s6bq-des3-math-and-mermaid-text-renderers)
   - [W261003S6BQ-DES4: Note embeds through unlisted buffers](#w261003s6bq-des4-note-embeds-through-unlisted-buffers)
   - [W261003S6BQ-DES5: Folds keyed by block id](#w261003s6bq-des5-folds-keyed-by-block-id)
   - [W261003S6BQ-DES6: EditorView signs, widget rows, and cursor-fit scrolling](#w261003s6bq-des6-editorview-signs-widget-rows-and-cursor-fit-scrolling)
   - [W261003S6BQ-DES7: Terminal images through OpenTUI](#w261003s6bq-des7-terminal-images-through-opentui)
   - [W261003S6BQ-DES8: Markdown commands and read-only views](#w261003s6bq-des8-markdown-commands-and-read-only-views)
   - [W261003S6BQ-DES9: Pure HTML rendering](#w261003s6bq-des9-pure-html-rendering)
   - [W261003S6BQ-DES10: Preview server](#w261003s6bq-des10-preview-server)
   - [W261003S6BQ-DES11: Preview lifecycle in state, effects, and the statusline](#w261003s6bq-des11-preview-lifecycle-in-state-effects-and-the-statusline)
   - [W261003S6BQ-DES12: Preview page delivery](#w261003s6bq-des12-preview-page-delivery)
   - [W261003S6BQ-DES13: Preview configuration](#w261003s6bq-des13-preview-configuration)
   - [W261003S6BQ-DES14: Benchmarks and registration proof](#w261003s6bq-des14-benchmarks-and-registration-proof)

# 1. Design Goals, Constraints, and Requirement Coverage

## Goals

- Render Markdown in `live` and `reading` views as one pure decoration provider over the existing `Doc`, with no change to `core/kernel` and no Markdown in `src/ui` (W261003S6BQ-REQ1@R1, W261003S6BQ-REQ6@R1).
- Show images, embeds, math, and Mermaid inside the 16 ms keystroke budget, with heavy work cached by block hash and kept out of `AppState` where it is presentation-only (W261003S6BQ-REQ2@R1, W261003S6BQ-REQ3@R1, W261003S6BQ-REQ4@R1).
- Keep folds and reserved rows correct under edits and scrolling without layout in the reducer (W261003S6BQ-REQ5@R1).
- Serve a read-only, local-only browser mirror from the same `Doc`, with the page, KaTeX, and Mermaid embedded in the single binary and loaded only from the server's own origin (W261003S6BQ-REQ7@R2, W261003S6BQ-REQ8@R1).
- Ship the G4 outputs DI4 consumes with the phase-design signatures, and prove registration-only extension with a `csv` file type (W261003S6BQ-REQ1@R1).

## Requirement Coverage

- `W261003S6BQ-REQ1@R1` — Inherited DI3 obligations.
  - **Coverage Outcome:** System design required
  - **System Design:** W261003S6BQ-DES1, W261003S6BQ-DES2, W261003S6BQ-DES6, W261003S6BQ-DES8, W261003S6BQ-DES9, W261003S6BQ-DES10, W261003S6BQ-DES11, W261003S6BQ-DES13, W261003S6BQ-DES14
  - **How Addressed:** Each parent obligation maps to one or more decisions (Assigned Parent Obligation Coverage below). The kernel view, `RenderLine`, `layoutText`, and the G4 signatures stay as the phase design defines them.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** see section 4; principal: `src/core/lang/markdown/live-preview.ts` — `livePreview`, `registerBlockRenderer`; `src/ui/editors/text-view.ts` — `EditorView`; `src/preview/server.ts` — `startPreviewServer`; `scripts/bench-gate.ts` — `TARGETS`
  - **Callers and Wiring:** `src/app/main.ts` `registries()` and composition; `test/support/state.ts` `testRegistries`
  - **Runtime Flow:** Keystroke to frame in live view; Preview start, follow, and stop
  - **Success Criteria:** S1, S2, S3, S9, S10, S11, S12, S14, S15, S16, S17, S18
  - **Verification:** V1–V5, V20–V24, V26–V34, V36–V45
  - **Research Support:** None
- `W261003S6BQ-REQ2@R1` — Images through OpenTUI's native decoder and `drawImage`.
  - **Coverage Outcome:** System design required
  - **System Design:** W261003S6BQ-DES7
  - **How Addressed:** `src/workspace/images.ts` reads bytes; `src/ui/images.ts` decodes, caches (64 MiB LRU), and selects the tier with the pure `imageTier`; the `image` widget painter draws with `drawImage`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/workspace/images.ts` — `readImage`; `src/ui/images.ts` — `imageTier`, `ImageCache`; `src/ui/widgets/image.ts` — `paintImage`; `src/ui/shell.ts` — `ShellDeps.loadImage`
  - **Callers and Wiring:** `src/app/main.ts` injects `loadImage`; `registerWidgetPainter("image", …)`
  - **Runtime Flow:** Image load and repaint
  - **Success Criteria:** S8
  - **Verification:** V17, V18, V19, V40
  - **Research Support:** None
- `W261003S6BQ-REQ3@R1` — Math and Mermaid text renderers.
  - **Coverage Outcome:** System design required
  - **System Design:** W261003S6BQ-DES3
  - **How Addressed:** Ported `mathText` and a `beautiful-mermaid`-backed `mermaidText`, both behind block renderers with a per-hash cache.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/lang/markdown/renderers/math.ts` — `mathText`, `mathRenderer`; `src/core/lang/markdown/renderers/mermaid.ts` — `mermaidText`, `mermaidRenderer`; `package.json`; `test/boundaries.test.ts` — `PACKAGE_HOMES`
  - **Callers and Wiring:** registered by `src/core/lang/markdown/renderers/index.ts` `builtinRenderers`
  - **Runtime Flow:** Keystroke to frame in live view
  - **Success Criteria:** S4
  - **Verification:** V6, V7, V8, V44
  - **Research Support:** None
- `W261003S6BQ-REQ4@R1` — Note embeds through unlisted buffers.
  - **Coverage Outcome:** System design required
  - **System Design:** W261003S6BQ-DES4, W261003S6BQ-DES13
  - **How Addressed:** `syncEmbeds` in the update wrapper requests missing targets once, records requests and refusals on the embedding note's `BufferState.embeds`, and evicts unused unlisted buffers; the embed renderer lays out the target section through `layoutText` in core and hands rows to a span-only painter.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/embeds.ts` — `syncEmbeds`, `embedTargets`, `settleEmbedRead`; `src/core/lang/markdown/renderers/embed.ts` — `embedRenderer`; `src/core/state/types.ts` — `BufferState.listed`, `BufferState.embeds`; `src/core/state/buffers.ts` — `onFileLoaded`, `onFileRefused`; `src/ui/widgets/embed.ts` — `paintEmbed`
  - **Callers and Wiring:** `createUpdate` wrapper; `onFileLoaded`; `onFileRefused`; `showBuffer`; `markdownViewContext`
  - **Runtime Flow:** Embed load
  - **Success Criteria:** S5
  - **Verification:** V9, V10, V11, V12, V25, V49
  - **Research Support:** None
- `W261003S6BQ-REQ5@R1` — Folds, widget rows, and scrolling.
  - **Coverage Outcome:** System design required
  - **System Design:** W261003S6BQ-DES5, W261003S6BQ-DES6
  - **How Addressed:** Window content `folds` holds block ids toggled from their default; the provider hides folded callout bodies with block `replace`; `EditorView` lays out once per frame and advances its top line until the cursor's row fits.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/types.ts` — `WindowState.content.folds`; `src/core/state/markdown-commands.ts` — `toggleFold`; `src/ui/editors/text-view.ts` — `EditorView.show`, `fitCursor`
  - **Callers and Wiring:** `fold.toggle` command; `markdownViewContext`
  - **Runtime Flow:** Keystroke to frame in live view
  - **Success Criteria:** S6, S7
  - **Verification:** V13, V14, V15, V16
  - **Research Support:** None
- `W261003S6BQ-REQ6@R1` — View input wiring and restored views.
  - **Coverage Outcome:** System design required
  - **System Design:** W261003S6BQ-DES1, W261003S6BQ-DES8, W261003S6BQ-DES13
  - **How Addressed:** `ViewContextRegistry` in `Registries`; `EditorView` calls `ViewSpec.input`; `markdownFileType.views` becomes live, source, reading; a new buffer's view is `preview.mode` when its file type has that view.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/view-context.ts` — `ViewContextRegistry`, `ViewHost`; `src/core/state/markdown-view.ts` — `markdownViewContext`; `src/core/lang/markdown/file-type.ts` — `markdownFileType`; `src/core/state/buffers.ts` — `defaultView`
  - **Callers and Wiring:** `src/app/main.ts` `registries()`; `src/ui/editors/text-view.ts` `EditorView.layout`
  - **Runtime Flow:** Keystroke to frame in live view; Open and restore
  - **Success Criteria:** S1, S16
  - **Verification:** V1, V2, V3, V38
  - **Research Support:** None
- `W261003S6BQ-REQ7@R2` — Preview page delivery and locally served browser libraries.
  - **Coverage Outcome:** System design required
  - **System Design:** W261003S6BQ-DES12
  - **How Addressed:** exact-pinned `katex` and `mermaid` browser builds and the page's own files are embedded through `type: "file"` imports in `assets.ts` and served at `/` and `/assets/<name>` under a same-origin CSP, `nosniff`, and `no-referrer`; render errors show source.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/preview/assets.ts` — `PAGE`, `ASSETS`; `src/preview/assets.d.ts`; `src/preview/{page.html,page.js,page.css}`; `src/preview/server.ts` — `SECURITY_HEADERS`; `package.json`, `bun.lock`; `test/boundaries.test.ts` — `PACKAGE_HOMES`
  - **Callers and Wiring:** `startPreviewServer` routes `/` and `/assets/<name>`
  - **Runtime Flow:** Preview start, follow, and stop
  - **Success Criteria:** S13
  - **Verification:** V34, V35, V42, V47, V48
  - **Research Support:** None
- `W261003S6BQ-REQ8@R1` — Preview follow protocol and browser launch.
  - **Coverage Outcome:** System design required
  - **System Design:** W261003S6BQ-DES9, W261003S6BQ-DES10, W261003S6BQ-DES11
  - **How Addressed:** `renderHtml` tags blocks with `data-line`/`data-hash`; the server broadcasts `{path, version, line}` after a 100 ms debounce; `openUrl` effect runs `open`/`xdg-open`, and a failure toasts the URL.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/lang/markdown/html.ts` — `renderHtml`; `src/preview/server.ts` — `startPreviewServer`; `src/core/state/preview.ts` — `startPreview`, `followTarget`; `src/workspace/system.ts` — `openUrl`; `src/app/preview-host.ts` — `createPreviewHost`
  - **Callers and Wiring:** `src/app/effects.ts` `startPreview`/`stopPreview`/`openUrl` cases; `src/app/lifecycle.ts` shutdown
  - **Runtime Flow:** Preview start, follow, and stop
  - **Success Criteria:** S10, S11, S12, S17
  - **Verification:** V20–V24, V26–V33
  - **Research Support:** None

## Assigned Parent Obligation Coverage

- **Parent Baseline**
  - **Binding:** `w261003s6bq-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2).
  - **Assessment:** Aligned, with one user-approved change pending parent reconciliation. The phase file, index, design, and UI design were re-read on 2026-10-04 at `main` `6a04729` and match the binding. This design refines the phase design in seven places, all additive or internal, which change no PH, DI, REQ, S, or V definition (items 1–7 below). Separately, on 2026-10-04 the user decided that KaTeX and Mermaid are served from the binary instead of jsDelivr (W261003S6BQ-REQ7@R2); that reverses a parent design tradeoff and a phase exclusion, so it needs parent text changes (item 8). All eight items are listed under `Pending parent synchronization` below; parent files are not edited by this work without explicit authorization.
    1. `PreviewCtx` gains `folds: ReadonlySet<number>` and `resolve(target): string | undefined`, and `embed()` returns `{ doc, text }` instead of `{ doc }` (all additive for DI4's `BlockRenderer`).
    2. The window fold set reaches the provider through `PreviewCtx.folds`; kernel `TextView.folds` keeps its generic hidden-line meaning and is empty for Markdown in v1 (the UI design's Editor window note said `TextView.folds` would carry it).
    3. The SSE `doc` payload carries `line` (the cursor line) instead of `anchor`; the page scrolls to the block containing it.
    4. The Markdown view, task, and fold commands live in `src/core/state/markdown-commands.ts`, not `src/core/lang/markdown/commands.ts`, because commands read `AppState` and `core/lang` may not import `core/state` (`test/boundaries.test.ts:9-15`).
    5. `Enter` in the Markdown scope runs `note.enter` (toggle a task, else follow the link), replacing the `link.follow` `<CR>` binding (`src/core/state/link-commands.ts:165`).
    6. New state, actions, and effects: buffer fields `BufferState.listed` and `BufferState.embeds` (additive within the RM261003ABZP-DES2@R2 buffers map), `WindowState.content.folds`, `AppState.preview` (the one top-level field the phase allows, with a `starting` variant added to the parent's `off | on(port)`); actions `previewStarted`, `previewStopped`, `previewFailed`, `openUrlFailed`; effects `startPreview`, `stopPreview`, `openUrl`.
    7. `src/app/preview-host.ts` owns the running server, mirroring `index-host.ts`.
    8. KaTeX and Mermaid are exact-pinned dependencies embedded in the binary and served from the preview's own origin under a same-origin Content Security Policy (user decision 2026-10-04; W261003S6BQ-DES12).
  - **Pending parent synchronization:** Approved direction, not an unresolved item: the user requested item 8 directly, and items 1–7 are additive refinements. Proposed parent changes:

    | Parent location | Current text | Proposed change |
    |---|---|---|
    | `rm261003abzp-design.md` RM261003ABZP-DES13@R2 → R3, Decision | "the page loads KaTeX and Mermaid from jsDelivr and falls back to showing source when offline" | "the page loads KaTeX and Mermaid from the server's own `/assets/*`, embedded in the binary from exact-pinned npm packages, under a `'self'`-only Content Security Policy with `nosniff` and `no-referrer`; a render error shows the source"; also add `/assets/*` to the routes and use the `doc` payload `{path, version, line}` (item 3) |
    | same, Tradeoffs | "math and diagrams need network in the browser (fallback to source); rejected bundling KaTeX/Mermaid into the binary (multi-MB size) and WebSocket (bidirectional not needed)" | "binary grows by several MB for the embedded KaTeX and Mermaid builds (no size budget); rejected loading them from a CDN (third-party code in a page showing private notes; no offline rendering) and WebSocket (bidirectional not needed)"; Predecessors: RM261003ABZP-DES13@R2 |
    | `rm261003abzp-roadmap-phase-2-obsidian-experience.md:35` (PH2 Out of scope) | "Bundling KaTeX or Mermaid into the binary (RM261003ABZP-DES13@R2 tradeoff)." | Remove the line |
    | same, `:344` (DI3 scope) | "…with real images, KaTeX, and Mermaid from jsDelivr and a source fallback when offline." | "…with real images, and KaTeX and Mermaid served from the binary, with the source shown on a render error." |
    | same, `:353` (DI3 Exclusions) | "Bundled KaTeX and Mermaid." | Remove the line |
    | same, `:387` and `rm261003abzp-ui-design.md` RM261003ABZP-UV9@R1 Action (`:2246`) | manual check "…and offline" / "toggle offline" | Keep the offline toggle; the expected result becomes "math and diagrams render offline; only same-origin requests" |
    | `rm261003abzp-ui-design.md` RM261003ABZP-UDES10@R1 (`:108`) and the M7 state table Error row (`:1060`) | "KaTeX/Mermaid with source fallback"; "KaTeX/Mermaid unavailable (offline CDN): source shown … `Math rendering unavailable offline`" | "KaTeX/Mermaid served locally"; Error row: "KaTeX/Mermaid render error: that block's source shown with a render-error label" |
    | `rm261003abzp-ui-design.md:62`, `rm261003abzp-ui-requirements.md:202` | cite RM261003ABZP-DES13@R2 | cite RM261003ABZP-DES13@R3 |
    | Phase design shapes and state (items 1–7) | as listed above | Record `PreviewCtx.folds`, `resolve`, and `embed().text`; folds through `PreviewCtx`; `line` payload; `markdown-commands.ts` home; `note.enter`; the buffer fields `listed` and `embeds`, `WindowState.content.folds`, `AppState.preview` with its `starting` variant, and the new actions and effects; `preview-host.ts` |
  - **Design Approval Gates:** G2 (due before DI3 execution) is met: DI2 merged as `9adb285` (PR #2) with V4/V5/V6/V18 passing and the PH1 exit recorded (`rm261003abzp-roadmap-phase-2-obsidian-experience.md:576`, `:580`). No gate is due at design approval. G4 is produced here (W261003S6BQ-DES2, W261003S6BQ-DES4, W261003S6BQ-DES6).

- **Live preview**
  - **Parent:** RM261003ABZP-REQ5@R2; RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES17@R1; RM261003ABZP-S5@R1 with RM261003ABZP-V7@R2
  - **Work Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ3@R1, W261003S6BQ-REQ4@R1, W261003S6BQ-REQ5@R1, W261003S6BQ-REQ6@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES1, W261003S6BQ-DES2, W261003S6BQ-DES3, W261003S6BQ-DES4, W261003S6BQ-DES5, W261003S6BQ-DES6
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S1, S2, S3, S4, S5, S6, S7
  - **Verification:** V1–V16, V49 (V4 is the V7@R2 golden suite)
  - **Treatment:** Refined — view input through a registry, folds by block id, embeds through unlisted buffers.

- **Terminal images**
  - **Parent:** RM261003ABZP-DES10@R2 (image tiers, `widgetPainters`), RM261003ABZP-DES16@R1 (64 MiB LRU); RM261003ABZP-V8@R1
  - **Work Requirements:** W261003S6BQ-REQ2@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES6, W261003S6BQ-DES7
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S8
  - **Verification:** V17, V18, V19, V40 (V18 is the V8@R1 case)
  - **Treatment:** Refined — OpenTUI's native decoder, a pure tier function, capabilities injected into the painter.

- **Markdown-scoped commands**
  - **Parent:** RM261003ABZP-DES5@R2
  - **Work Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ6@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES8
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S9
  - **Verification:** V2, V3, V13, V37
  - **Treatment:** Refined — module home in `core/state`; `note.enter` combines task toggle and link follow on `Enter`.

- **Browser preview**
  - **Parent:** RM261003ABZP-REQ8@R2; RM261003ABZP-DES13@R2; RM261003ABZP-S8@R1 with RM261003ABZP-V11@R3
  - **Work Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ7@R2, W261003S6BQ-REQ8@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES9, W261003S6BQ-DES10, W261003S6BQ-DES11, W261003S6BQ-DES12
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S10, S11, S12, S13
  - **Verification:** V20–V35, V48 (V26–V31 are the V11@R3 scenarios)
  - **Treatment:** Refined — `{path, version, line}` payload, injected exclusion rule, preview host.

- **Browser library delivery**
  - **Parent:** RM261003ABZP-DES13@R2 (Decision "from jsDelivr" and the tradeoff rejecting bundling); `rm261003abzp-roadmap-phase-2-obsidian-experience.md:35` (PH2 Out of scope), `:344` (DI3 scope "from jsDelivr"), `:353` (DI3 Exclusions "Bundled KaTeX and Mermaid"); RM261003ABZP-UDES10@R1 and RM261003ABZP-UV9@R1 offline wording
  - **Work Requirements:** W261003S6BQ-REQ7@R2
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES10, W261003S6BQ-DES12
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S13
  - **Verification:** V34, V35, V42, V47, V48
  - **Treatment:** Refined — pending parent reconciliation (user decision 2026-10-04). The exact parent changes are in `Pending parent synchronization` above.

- **Configuration**
  - **Parent:** RM261003ABZP-DES14@R2 (`preview.*`)
  - **Work Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ4@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES13
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S14
  - **Verification:** V39
  - **Treatment:** Refined — `embedMaxRows` default 10, range 1–200.

- **Performance**
  - **Parent:** RM261003ABZP-REQ9@R2; RM261003ABZP-DES16@R1; RM261003ABZP-S9@R1 with RM261003ABZP-V12@R2 (and the V13@R1 re-run)
  - **Work Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ3@R1, W261003S6BQ-REQ5@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES2, W261003S6BQ-DES6, W261003S6BQ-DES14
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S15
  - **Verification:** V44, V45
  - **Treatment:** Inherited — targets unchanged; four bench targets added.

- **Development, CI, and release budgets**
  - **Parent:** RM261003ABZP-REQ10@R4; RM261003ABZP-DES15@R4 (keep budgets)
  - **Work Requirements:** W261003S6BQ-REQ1@R1
  - **Coverage Outcome:** No system design change
  - **Work Design:** None — existing design already satisfies requirement
  - **Existing Evidence:** `package.json` `check` and `test:ci` scripts, `.github/workflows/ci.yml` (PR-only, concurrency), `release.yml` (manual dry run); every `bun build --compile` already lists both entrypoints (`test/repo.test.ts`). DI3 adds no entrypoint and no workflow change; the check and CI timings are re-read on the DI3 PR (V46).
  - **Success Criteria:** None — no new system-design obligation
  - **Verification:** None — no new system-design obligation
  - **Treatment:** Inherited — budgets re-checked by the existing CI on the DI3 PR.

- **Foundations and registration-only extension**
  - **Parent:** RM261003ABZP-REQ11@R3; RM261003ABZP-DES1@R2, RM261003ABZP-DES17@R1; RM261003ABZP-S11@R1 with RM261003ABZP-V16@R2 (V15@R2, V17@R1 unchanged)
  - **Work Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ6@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES1, W261003S6BQ-DES2, W261003S6BQ-DES14
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S16, S18
  - **Verification:** V38, V41
  - **Treatment:** Refined — a `ViewContextRegistry` joins the registries; the `csv` proof registers a view context too.

- **UI obligations**
  - **Parent:** RM261003ABZP-M2@R1, M7@R1, M1@R1 (segments); UREQ3@R2, UREQ4@R1, UREQ10@R1, UREQ6@R1, UREQ1@R2, UREQ11@R1; UDES1@R2, UDES3@R2, UDES4@R1, UDES10@R1, UDES11@R1; US1@R2/UV1@R2 (full), US2@R2/UV3@R2, US8@R1/UV9@R1, US9@R1/UV10@R1 and UV9@R1
  - **Work Requirements:** W261003S6BQ-REQ1@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES2, W261003S6BQ-DES6, W261003S6BQ-DES11, W261003S6BQ-DES12
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S2, S7, S13, S17
  - **Verification:** V4, V16, V33, V36, V42, V43
  - **Treatment:** Inherited — the accepted UDES records own look and interaction; this design supplies the technical surfaces (style tokens, signs, widget painters, segments, page structure) and the checks that run them.

- **G4 outputs**
  - **Parent:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md:72` (`blockRenderers`, widget row reservation, `widgetPainters`, unlisted embed buffers)
  - **Work Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ4@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES2, W261003S6BQ-DES4, W261003S6BQ-DES6
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S18, S5
  - **Verification:** V5, V41, V9
  - **Treatment:** Inherited signatures; `PreviewCtx` grows additively.

- **Downstream work boundary**
  - **Parent:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md:390-395`
  - **Work Requirements:** W261003S6BQ-REQ1@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W261003S6BQ-DES2, W261003S6BQ-DES6, W261003S6BQ-DES10
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S16, S18, S11
  - **Verification:** V38, V41, V30, V47
  - **Treatment:** Inherited — the kernel files and `layoutText` are unchanged; no Markdown import in `src/ui`; no mutating route.

## Binding Constraints

- `test/boundaries.test.ts:16-41` — layer rules: `core/lang` may not import `core/state`, so state-reading commands and the `PreviewCtx` builder live in `core/state`; `src/preview` may import only `src/preview` and `src/core` and no `@opentui`, so the exclusion rule is injected by `src/app`.
- `test/boundaries.test.ts:45-53` — `PACKAGE_HOMES`: `beautiful-mermaid` joins with home `src/core/lang/markdown/`.
- `src/core/kernel/view/types.ts:17-38`, `src/core/kernel/view/text-view.ts:19-68` — `TextView`, `RenderLine`, and `layoutText` stay unchanged; DI3 adds providers only.
- `rm261003abzp-roadmap-phase-2-obsidian-experience.md:205-216` — the `PreviewCtx`, `MarkdownViewInput`, `livePreview`, `BlockRenderer`, and `registerBlockRenderer` shapes.
- `rm261003abzp-design.md:409-417` — preview routes, Host allowlist, containment, no mutating route.
- `.s1mple/docs/project.md` Constraints — exact pins; `src/core` stays free of I/O.
- `.s1mple/docs/languages/typescript.md` Error Handling — throwing reducers keep the state; adapters report failures as actions.
- `.s1mple/S1MPLE.md` Implementation — no work-process identifiers in code.

## Cross-Cutting Applicability

| Concern | Applicability | Design Location or Reason |
|---|---|---|
| Security and privacy | Applicable | `src/preview/server.ts` `startPreviewServer`: `127.0.0.1` bind, Host allowlist, realpath + hidden + excluded containment, GET-only routes; `html.ts` escapes every text and attribute and never passes raw HTML; every response carries `SECURITY_HEADERS` (same-origin-only CSP with inline styles for Mermaid, `nosniff`, `no-referrer`; section 6 routes), `/file/*` is sandboxed by `FILE_CSP`, and `/assets/*` serves only the embedded, exact-pinned `ASSETS` (W261003S6BQ-DES9, DES10, DES12); V26–V31, V34, V48 |
| Configuration | Applicable | `src/core/config/schema.ts` `preview` section (W261003S6BQ-DES13); V39 |
| Observability | Applicable | `src/app/preview-host.ts` logs `preview.started`, `preview.stopped`, `preview.failed` and `src/app/effects.ts` logs `browser.openFailed` through the existing debug logger, paths and ports only (W261003S6BQ-DES11); V32 |
| Performance and scalability | Applicable | Viewport-only provider and render caches (W261003S6BQ-DES2, DES3), one layout per frame (DES6), image LRU (DES7); bench targets (DES14); V44, V45. The binary grows by several MB of embedded browser files (no size budget); startup is unaffected because `type: "file"` imports are paths, read only when the browser asks (DES12); V35, V44 |
| Concurrency | Applicable | One server per process held by `createPreviewHost`; a second `:Preview` reuses it; the SSE client set is touched only on the event loop; image loads resolve asynchronously and only request a repaint (W261003S6BQ-DES7, DES10, DES11); V19, V31 |
| Retry and idempotency | Applicable | `:Preview` is idempotent (reopen same port); `:PreviewStop` when off is a no-op; embed `read` requests are deduplicated by path in `syncEmbeds`; the page's `EventSource` retries by itself (W261003S6BQ-DES4, DES11); V11, V31 |
| Migration and rollout | Applicable | `state.json` stays version 1; unlisted buffers are filtered from the snapshot; the persisted `view` is ignored on restore as before (W261003S6BQ-DES1, DES4); V1, V12 |

## Focused Code Surface

- **Existing:** `src/core/kernel/view/text-view.ts` — `layoutText` — lays out visible lines from decorations; unchanged host for the provider.
- **Existing:** `src/core/filetypes/registry.ts` — `ViewSpec.input`, `readOnly` — declared but unused; DI3 is the first caller.
- **Existing:** `src/core/lang/markdown/{doc,mdast}.ts` — `Doc`, `Block.id`, `Block.hash`, `blockNode` — per-block cache the provider and HTML read.
- **Existing:** `src/ui/editors/text-view.ts` — `EditorView.show`, `renderSelf`, `layout` — the only `layoutText` caller.
- **Existing:** `src/core/state/update.ts` — `createUpdate` wrapper — where `syncEmbeds` joins `followShownNote`.
- **Proposed:** `src/core/lang/markdown/live-preview.ts` — `livePreview`, `registerBlockRenderer` — Traces to `W261003S6BQ-DES2`
- **Proposed:** `src/core/state/view-context.ts` — `ViewContextRegistry` — Traces to `W261003S6BQ-DES1`
- **Proposed:** `src/core/state/embeds.ts` — `syncEmbeds` — Traces to `W261003S6BQ-DES4`
- **Proposed:** `src/ui/images.ts` — `ImageCache`, `imageTier` — Traces to `W261003S6BQ-DES7`
- **Proposed:** `src/preview/server.ts` — `startPreviewServer` — Traces to `W261003S6BQ-DES10`

# 2. System Context and Architecture

## System Context

```text
 ┌──────────┐ keys   ┌───────────────────────── so (one Bun process) ─────────────────────────┐
 │ terminal │──────► │ src/ui ─► store ─► core update ─► effects ─► src/app runner            │
 │ (kitty / │◄────── │   ▲ paint RenderLine[] + widgets      │                │                │
 │ sixel /  │ frames │   └──── state ◄───────────────────────┘                ├─► src/workspace│──► notes, images (fs)
 │ blocks)  │        │                                                       ├─► preview host │
 └──────────┘        │                       src/preview server ◄────────────┘   (Bun.serve)  │
                     └──────────────────────────────▲──────────────────────────────────────────┘
 ┌──────────┐  GET /, /assets/*, /render, /file/*,  │ 127.0.0.1:<port> only
 │ browser  │  SSE /events  (CSP: 'self' only)      │
 │  page    │───────────────────────────────────────┘
 └──────────┘
 open / xdg-open ◄── src/workspace/system.openUrl
```

The note author drives `so` from the terminal. The browser is a second, read-only reader that only talks to `127.0.0.1:<port>`: the page, KaTeX, Mermaid, and KaTeX's fonts are served from the binary, and the Content Security Policy forbids every other origin, so the page works offline.

## Proposed Architecture

```text
core/lang/markdown                                   core/state                                   src/ui
 Doc ─► livePreview(v, MarkdownViewInput) ◄── input ◄── markdownViewContext(s, win, host) ◄──── EditorView.layout
         │ blocksIn(v.visible) → renderKey(block)        (ViewContextRegistry, "markdown")        │ ViewHost{width,rows,
         │ reveal(doc, view, cursor, selection)          PreviewCtx{resolve,isResolved,embed,       │   imageSize,cellAspect}
         │ blockRenderers.get(key) ─► Decoration[]        image,folds,embedMaxRows,images}         ▼
         │   heading list table callout code math mermaid frontmatter rule embed image   layoutText (kernel, unchanged)
         │   (DI4: base)                                                                    │
         └─ throw → line sign ⚠                                                             ▼
 Doc ─► renderHtml(doc, HtmlCtx) ─► fragment                                     RenderLine[] ─► paintLine / sign column
                       ▲                                                                       └► widgetPainters(image, embed, rule)
 src/preview/server ───┘  ◄── store.subscribe (debounce 100 ms) ── followTarget(s)                    image ─► ImageCache ─► drawImage
                                                                                                       ▲ loadImage (app-injected)
 core/state: embeds.syncEmbeds (update wrapper) ─► per-buffer reads ─► fileLoaded(listed:false)        └── src/workspace/images.readImage
 core/state: preview.ts (:Preview/:PreviewStop) ─► startPreview/stopPreview/openUrl effects ─► src/app/preview-host
```

Live preview and HTML are pure functions of one `Doc`, so the terminal and the browser cannot disagree about structure. Presentation-only data stays out of `AppState`: decoded images live in a UI cache, and embed rows are computed during layout. State keeps only what must survive a frame — which buffers exist (including unlisted embed targets), which blocks a window toggled, and whether the preview runs. The major tradeoff is that the reducer cannot know how many screen rows a line takes, so cursor-fit scrolling moves from core to `EditorView`, which already reconciles core scroll with its real height.

# 3. Components and Boundaries

## Live-preview provider

- **Target:** `src/core/lang/markdown/live-preview.ts`, `reveal.ts`, `render-key.ts`, `inline.ts`, `renderers/*`
- **Kind:** pure module (decoration provider and renderer registry)
- **Responsibilities:**
  - Turn the visible blocks of a `Doc` into decorations for the `live` and `reading` views.
  - Decide reveal (cursor line, cursor block, selection) and mark revealed rows with `▕`.
  - Dispatch blocks to registered renderers by render key; isolate renderer failures.
  - Own the G4 `registerBlockRenderer` registry.
- **Collaborators:**

  ```text
  livePreview → blocksIn(doc, v.visible) → renderKey(block, blockNode) → blockRenderers → Decoration[]
  livePreview → reveal(doc, input.view, v.cursor, v.selection) → RevealSet
  ```

- **Boundary Contract:** `MarkdownViewInput`, `PreviewCtx`, `BlockRenderer` (section 6)
- **Detailed Design:** section 7, `src/core/lang/markdown/live-preview.ts`, `reveal.ts`, `render-key.ts`, `inline.ts`, `renderers/*`
- **Must Not Own:**
  - State access (it reads only `TextView` and `MarkdownViewInput`).
  - Painting, terminal capabilities, or file I/O.

## View-context registry and Markdown context builder

- **Target:** `src/core/state/view-context.ts`, `src/core/state/markdown-view.ts`
- **Kind:** registry and pure builder
- **Responsibilities:**
  - Map a file-type id to a builder that turns `AppState`, a window, and a `ViewHost` into the view's input context.
  - Build `PreviewCtx` for Markdown from NoteIndex, buffers, window folds, and config.
- **Collaborators:**

  ```text
  EditorView.layout → reg.viewContexts.build(ft.id, s, windowId, host) → markdownViewContext → PreviewCtx
  ```

- **Boundary Contract:** `ViewContextBuilder`, `ViewHost` (section 6)
- **Detailed Design:** section 7, `src/core/state/view-context.ts`, `src/core/state/markdown-view.ts`
- **Must Not Own:**
  - Layout or decorations.

## Embed buffers

- **Target:** `src/core/state/embeds.ts`
- **Kind:** reducer helper
- **Responsibilities:**
  - After every step, compare each listed Markdown buffer's embed targets with the open buffers and that buffer's `embeds`; request missing targets once and record them on that buffer; evict unlisted buffers no listed buffer embeds.
- **Collaborators:**

  ```text
  createUpdate wrapper → syncEmbeds(prev, result) → { read effects, requesting buffers' embeds.requested, buffers without evicted }
  onFileLoaded / onFileRefused → every listed buffer that requested the path: requested −= path (refused += path on refusal)
  ```

- **Boundary Contract:** `BufferState.listed` and `BufferState.embeds` (section 6)
- **Detailed Design:** section 7, `src/core/state/embeds.ts`
- **Must Not Own:**
  - Rendering of the embed (owned by the embed renderer).

## Markdown commands

- **Target:** `src/core/state/markdown-commands.ts`
- **Kind:** command and binding table
- **Responsibilities:**
  - `view.cycle`, `task.toggle`, `fold.toggle`, `note.enter`, `preview.start`, `preview.stop`, all limited to `markdown`, and their bindings in the `markdown` key scope.
- **Collaborators:**

  ```text
  keymap / ex → runCommand → markdownCommands[i].run(ctx) → Result
  ```

- **Boundary Contract:** `Command<CommandContext, CommandResult>` (`src/core/kernel/commands/registry.ts:5-12`)
- **Detailed Design:** section 7, `src/core/state/markdown-commands.ts`
- **Must Not Own:**
  - Server start (it emits effects only).

## EditorView

- **Target:** `src/ui/editors/text-view.ts`
- **Kind:** OpenTUI renderable
- **Responsibilities:**
  - Build `TextView` and the view input; lay out once per frame; fit the cursor; paint spans, the sign column, and widget rows through `widgetPainters`.
- **Collaborators:**

  ```text
  EditorView.show → layoutFrame → fitCursor → layoutText ; renderSelf → paintLine | paintSign | widgetPainters.get(type)
  ```

- **Boundary Contract:** `RenderLine` (unchanged), `WidgetPainter` (section 6)
- **Detailed Design:** section 7, `src/ui/editors/text-view.ts`, `src/ui/widgets/*`
- **Must Not Own:**
  - Markdown knowledge or parsing.

## Image pipeline

- **Target:** `src/workspace/images.ts`, `src/ui/images.ts`, `src/ui/widgets/image.ts`
- **Kind:** adapter, UI cache, painter
- **Responsibilities:**
  - Read image bytes inside the workspace; decode with OpenTUI; keep at most 64 MiB of decoded images; choose the protocol tier; draw or paint a placeholder.
- **Collaborators:**

  ```text
  paintImage → ImageCache.get(path) ─(miss)→ loadImage(path) → NativeImage.decode → requestRender
  paintImage → imageTier(config.preview.images, caps, hasResolution) → drawImage(…, protocol) | placeholder
  ```

- **Boundary Contract:** `ImageTier`, `ShellDeps.loadImage` (section 6)
- **Detailed Design:** section 7, `src/workspace/images.ts`, `src/ui/images.ts`, `src/ui/widgets/image.ts`
- **Must Not Own:**
  - Image references in `AppState`.

## HTML renderer

- **Target:** `src/core/lang/markdown/html.ts`
- **Kind:** pure function
- **Responsibilities:**
  - Serialize a `Doc` to an escaped HTML fragment with `data-line` and `data-hash` per top-level block, using the same render keys as the terminal.
- **Collaborators:**

  ```text
  renderHtml(doc, text, ctx) → blockNode → htmlOf(node) → string
  ```

- **Boundary Contract:** `HtmlCtx` (section 6)
- **Detailed Design:** section 7, `src/core/lang/markdown/html.ts`
- **Must Not Own:**
  - Script loading or page layout.

## Preview server and host

- **Target:** `src/preview/server.ts`, `src/preview/assets.ts` (with `page.html`, `page.js`, `page.css`), `src/app/preview-host.ts`
- **Kind:** HTTP adapter and its owner
- **Responsibilities:**
  - Serve the page, `/assets/*`, `/render`, `/file/*`, and SSE on `127.0.0.1:0` with the security headers; enforce Host and containment; broadcast `doc` and `stopped`; stop in the guaranteed order.
  - `assets.ts` names the closed set of embedded files the browser may load.
  - The host owns at most one server, starts and stops it for effects and on exit.
- **Collaborators:**

  ```text
  effects.startPreview → previewHost.start() → startPreviewServer({root, store, isExcluded}) → { port, stop }
  store.subscribe → debounce(100) → followTarget(s) → SSE "doc"
  ```

- **Boundary Contract:** Preview HTTP routes, `PreviewEvent` (section 6)
- **Detailed Design:** section 7, `src/preview/server.ts`, `src/preview/assets.ts`, `src/app/preview-host.ts`
- **Must Not Own:**
  - Any write to the workspace or to `AppState` other than through dispatched actions.

# 4. Project Structure Changes

**Proposed Structure — not an actual Git diff.**

**Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── [M] package.json
│       Contains: exact pins "beautiful-mermaid": "1.1.3", "katex": "0.16.47", "mermaid": "<exact current release>"
│       Symbols: dependencies
│       Decisions: DES3, DES12
├── [M] bun.lock
│       Contains: lockfile entries for beautiful-mermaid, elkjs, entities, mermaid and its dependencies; katex moves to a direct dependency
│       Symbols: None — generated
│       Decisions: DES3, DES12
├── scripts/
│   └── [M] bench-gate.ts
│           Contains: four added targets and benches
│           Symbols: TARGETS, BENCHES
│           Decisions: DES14
├── src/
│   ├── app/
│   │   ├── [M] main.ts
│   │   │       Contains: registers Markdown views' context, Markdown commands and bindings, widget painters; injects loadImage; builds the preview host
│   │   │       Symbols: registries, main
│   │   │       Decisions: DES1, DES7, DES8, DES11
│   │   ├── [M] effects.ts
│   │   │       Contains: startPreview, stopPreview, openUrl cases
│   │   │       Symbols: RunnerDeps.preview, RunnerDeps.openUrl, createEffectRunner
│   │   │       Decisions: DES11
│   │   ├── [A] preview-host.ts
│   │   │       Contains: owner of the one preview server
│   │   │       Symbols: PreviewHost, createPreviewHost
│   │   │       Decisions: DES11
│   │   └── [M] lifecycle.ts
│   │           Contains: stops the preview before terminal restore
│   │           Symbols: installLifecycle
│   │           Decisions: DES11
│   ├── core/
│   │   ├── config/
│   │   │   └── [M] schema.ts
│   │   │           Contains: preview section
│   │   │           Symbols: ConfigSchema, AppConfig
│   │   │           Decisions: DES13
│   │   ├── lang/markdown/
│   │   │   ├── [M] file-type.ts
│   │   │   │       Contains: live, source, reading views
│   │   │   │       Symbols: markdownFileType
│   │   │   │       Decisions: DES1
│   │   │   ├── [A] live-preview.ts
│   │   │   │       Contains: provider, input and context types, renderer registry
│   │   │   │       Symbols: PreviewCtx, MarkdownViewInput, livePreview, BlockRenderer, registerBlockRenderer, blocksIn
│   │   │   │       Decisions: DES2, DES4, DES5
│   │   │   ├── [A] reveal.ts
│   │   │   │       Contains: reveal decision
│   │   │   │       Symbols: RevealSet, reveal, MULTILINE_KEYS
│   │   │   │       Decisions: DES2
│   │   │   ├── [A] render-key.ts
│   │   │   │       Contains: block → render key
│   │   │   │       Symbols: renderKey, embedOnly, IMAGE_EXTENSIONS
│   │   │   │       Decisions: DES2
│   │   │   ├── [A] inline.ts
│   │   │   │       Contains: inline marker hiding and styles for one line
│   │   │   │       Symbols: inlineDecorations
│   │   │   │       Decisions: DES2
│   │   │   ├── [A] render-cache.ts
│   │   │   │       Contains: bounded cache keyed by block hash and width
│   │   │   │       Symbols: RenderCache
│   │   │   │       Decisions: DES2, DES3
│   │   │   ├── [A] renderers/index.ts
│   │   │   │       Contains: built-in registrations
│   │   │   │       Symbols: builtinRenderers
│   │   │   │       Decisions: DES2
│   │   │   ├── [A] renderers/{heading,list,table,callout,code,frontmatter,rule,footnote}.ts
│   │   │   │       Contains: one renderer per render key
│   │   │   │       Symbols: headingRenderer, listRenderer, tableRenderer, calloutRenderer, codeRenderer, frontmatterRenderer, ruleRenderer, footnoteRenderer
│   │   │   │       Decisions: DES2, DES5
│   │   │   ├── [A] renderers/math.ts
│   │   │   │       Contains: TeX → Unicode port and renderer
│   │   │   │       Symbols: mathText, mathRenderer
│   │   │   │       Decisions: DES3
│   │   │   ├── [A] renderers/mermaid.ts
│   │   │   │       Contains: beautiful-mermaid ASCII and renderer
│   │   │   │       Symbols: mermaidText, mermaidRenderer
│   │   │   │       Decisions: DES3
│   │   │   ├── [A] renderers/embed.ts
│   │   │   │       Contains: note embed rows
│   │   │   │       Symbols: embedRenderer, embedRows, sectionLines
│   │   │   │       Decisions: DES4
│   │   │   ├── [A] renderers/image.ts
│   │   │   │       Contains: image widget or placeholder
│   │   │   │       Symbols: imageRenderer
│   │   │   │       Decisions: DES7
│   │   │   └── [A] html.ts
│   │   │           Contains: Doc → escaped HTML fragment
│   │   │           Symbols: HtmlCtx, renderHtml, escapeHtml
│   │   │           Decisions: DES9
│   │   └── state/
│   │       ├── [M] types.ts
│   │       │       Contains: buffer listed and embeds, window folds, preview; actions and effects
│   │       │       Symbols: BufferState, WindowState, AppState, Action, Effect, PreviewState
│   │       │       Decisions: DES4, DES5, DES11
│   │       ├── [M] update.ts
│   │       │       Contains: viewContexts registry; new action cases; syncEmbeds in the wrapper
│   │       │       Symbols: Registries, createUpdate
│   │       │       Decisions: DES1, DES4, DES11
│   │       ├── [M] init.ts
│   │       │       Contains: preview off
│   │       │       Symbols: initialState
│   │       │       Decisions: DES11
│   │       ├── [M] buffers.ts
│   │       │       Contains: default view from config; listed on show; embed reads open unlisted; refused embed reads settle silently
│   │       │       Symbols: onFileLoaded, onFileRefused, showBuffer, defaultView
│   │       │       Decisions: DES1, DES4
│   │       ├── [M] keys.ts
│   │       │       Contains: read-only view refusal
│   │       │       Symbols: runVim, READ_ONLY_HINT
│   │       │       Decisions: DES8
│   │       ├── [M] commands.ts
│   │       │       Contains: ex aliases Preview, PreviewStop; :bn/:bp over listed buffers
│   │       │       Symbols: EX_ALIASES, cycleBuffer
│   │       │       Decisions: DES4, DES11
│   │       ├── [M] link-commands.ts
│   │       │       Contains: <CR> binding removed (now note.enter); followLink exported
│   │       │       Symbols: linkBindings, followLink
│   │       │       Decisions: DES8
│   │       ├── [M] session.ts
│   │       │       Contains: snapshot skips unlisted buffers
│   │       │       Symbols: snapshotSession
│   │       │       Decisions: DES4
│   │       ├── [M] picker.ts
│   │       │       Contains: open paths over listed buffers
│   │       │       Symbols: openPaths
│   │       │       Decisions: DES4
│   │       ├── [M] status.ts
│   │       │       Contains: preview segment
│   │       │       Symbols: StatusSegments, statusSegments
│   │       │       Decisions: DES11
│   │       ├── [A] view-context.ts
│   │       │       Contains: view-context registry
│   │       │       Symbols: ViewHost, ViewContextBuilder, ViewContextRegistry
│   │       │       Decisions: DES1
│   │       ├── [A] markdown-view.ts
│   │       │       Contains: PreviewCtx builder
│   │       │       Symbols: markdownViewContext
│   │       │       Decisions: DES1, DES4, DES5, DES7
│   │       ├── [A] embeds.ts
│   │       │       Contains: per-note embed requests, refusals, and eviction
│   │       │       Symbols: embedTargets, syncEmbeds, settleEmbedRead
│   │       │       Decisions: DES4
│   │       ├── [A] markdown-commands.ts
│   │       │       Contains: Markdown commands and bindings
│   │       │       Symbols: markdownCommands, markdownBindings, toggleTask, toggleFold, cycleView
│   │       │       Decisions: DES5, DES8, DES11
│   │       └── [A] preview.ts
│   │               Contains: preview commands' reducers and the follow selector
│   │               Symbols: startPreview, stopPreview, onPreviewStarted, onPreviewStopped, onPreviewFailed, onOpenUrlFailed, followTarget, htmlCtx
│   │               Decisions: DES9, DES11
│   ├── preview/
│   │   ├── [A] server.ts
│   │   │       Contains: Bun.serve routes, Host check, containment, SSE, stop order
│   │   │       Symbols: PreviewServer, PreviewServerOptions, startPreviewServer, SECURITY_HEADERS, FILE_CSP
│   │   │       Decisions: DES10, DES12
│   │   ├── [A] assets.ts
│   │   │       Contains: embedded page, KaTeX, and Mermaid files with content types
│   │   │       Symbols: PreviewAsset, PAGE, ASSETS
│   │   │       Decisions: DES12
│   │   ├── [A] assets.d.ts
│   │   │       Contains: string types for files imported with type "file"
│   │   │       Symbols: None — module declarations
│   │   │       Decisions: DES12
│   │   ├── [A] page.html
│   │   │       Contains: page shell; same-origin /assets/* script and stylesheet tags only
│   │   │       Symbols: None — static asset
│   │   │       Decisions: DES12
│   │   ├── [A] page.js
│   │   │       Contains: follow loop, theme toggle, badges, banner, KaTeX and Mermaid rendering
│   │   │       Symbols: follow, swapArticle, renderBlocks, setBadge (browser script)
│   │   │       Decisions: DES12
│   │   └── [A] page.css
│   │           Contains: M7 themes, badges, banner, 375 px layout, render-error label
│   │           Symbols: None — static asset
│   │           Decisions: DES12
│   ├── ui/
│   │   ├── [M] shell.ts
│   │   │       Contains: loadImage dependency; ImageCache construction
│   │   │       Symbols: ShellDeps, ViewDeps, createShell
│   │   │       Decisions: DES7
│   │   ├── [M] theme.ts
│   │   │       Contains: Markdown, sign, and placeholder style tokens
│   │   │       Symbols: TOKENS
│   │   │       Decisions: DES2, DES6
│   │   ├── [A] images.ts
│   │   │       Contains: tier selection and decoded-image LRU
│   │   │       Symbols: ImageTier, imageTier, ImageCache
│   │   │       Decisions: DES7
│   │   ├── editors/
│   │   │   └── [M] text-view.ts
│   │   │           Contains: view input, one layout per frame, cursor fit, sign column, widget rows
│   │   │           Symbols: EditorView, layoutFrame, fitCursor, paintSign
│   │   │           Decisions: DES1, DES6
│   │   ├── widgets/
│   │   │   ├── [A] registry.ts
│   │   │   │       Contains: widget painters by type
│   │   │   │       Symbols: WidgetPainter, PaintTarget, widgetPainters, registerWidgetPainter
│   │   │   │       Decisions: DES6
│   │   │   ├── [A] image.ts
│   │   │   │       Contains: image painter
│   │   │   │       Symbols: paintImage
│   │   │   │       Decisions: DES7
│   │   │   ├── [A] embed.ts
│   │   │   │       Contains: embed rows painter
│   │   │   │       Symbols: paintEmbed
│   │   │   │       Decisions: DES4, DES6
│   │   │   └── [A] rule.ts
│   │   │           Contains: horizontal rule painter
│   │   │           Symbols: paintRule
│   │   │           Decisions: DES6
│   │   └── views/
│   │       ├── [M] statusline.ts
│   │       │       Contains: preview segment and drop order
│   │       │       Symbols: Statusline
│   │       │       Decisions: DES11
│   │       └── [M] bufferline.ts
│   │               Contains: listed buffers only
│   │               Symbols: Bufferline
│   │               Decisions: DES4
│   └── workspace/
│       ├── [A] images.ts
│       │       Contains: contained image byte reads
│       │       Symbols: readImage
│       │       Decisions: DES7
│       └── [M] system.ts
│               Contains: browser launcher
│               Symbols: openUrl
│               Decisions: DES11
└── test/
    ├── [M] boundaries.test.ts
    │       Contains: beautiful-mermaid package home; katex and mermaid homes src/preview/; package-name lookup for subpath imports
    │       Symbols: PACKAGE_HOMES, checkImports
    │       Decisions: DES3, DES12
    ├── support/
    │   ├── [M] state.ts
    │   │       Contains: Markdown commands, bindings, and view context in test registries
    │   │       Symbols: testRegistries
    │   │       Decisions: DES1, DES8
    │   └── [M] ui.ts
    │           Contains: widget painters, injected capabilities and loadImage
    │           Symbols: MountOptions.capabilities, MountOptions.images, mountShell
    │           Decisions: DES6, DES7
    ├── fixtures/
    │   ├── [A] tour.md
    │   │       Contains: every REQ5 element, a Mermaid flowchart, embeds, images
    │   │       Symbols: None — fixture
    │   │       Decisions: DES2, DES14
    │   ├── [A] images/diagram.png, images/broken.png, images/logo.svg
    │   │       Contains: decodable, corrupt, and SVG images
    │   │       Symbols: None — fixture
    │   │       Decisions: DES7
    │   └── [M] generate.ts
    │           Contains: shared 5,000-line TypeScript generator
    │           Symbols: make5000LineTs
    │           Decisions: DES14
    ├── bench/
    │   ├── [M] source-keystroke.bench.ts
    │   │       Contains: uses make5000LineTs
    │   │       Symbols: None — script
    │   │       Decisions: DES14
    │   ├── [A] live-keystroke.bench.ts
    │   │       Contains: 200 keys on the 5,000-line note in live view
    │   │       Symbols: None — script
    │   │       Decisions: DES14
    │   ├── [A] source-open.bench.ts
    │   │       Contains: open the 5,000-line TypeScript file
    │   │       Symbols: None — script
    │   │       Decisions: DES14
    │   └── [A] scroll.bench.ts
    │           Contains: held j and Ctrl-d/Ctrl-u frame times; --file note|ts
    │           Symbols: None — script
    │           Decisions: DES14
    ├── ui/
    │   ├── [A] live-preview.test.ts
    │   │       Contains: UV3 assertions, signs, widget rows, cursor fit, reading refusal, tiers
    │   │       Symbols: None — test
    │   │       Decisions: DES2, DES5, DES6, DES7, DES8
    │   ├── [A] extension.test.ts
    │   │       Contains: registration-only extension proof
    │   │       Symbols: None — test
    │   │       Decisions: DES1, DES14
    │   └── [M] shell.golden.test.ts
    │           Contains: full statusline segment order with preview
    │           Symbols: None — test
    │           Decisions: DES11
    ├── integration/
    │   └── [A] preview-server.test.ts
    │           Contains: V11 scenarios on real Bun.serve
    │           Symbols: None — test
    │           Decisions: DES10, DES11, DES12
    └── colocated unit suites (src/**)
            [A] src/core/lang/markdown/live-preview.test.ts (+ __snapshots__), reveal.test.ts, render-key.test.ts,
                renderers/math.test.ts, renderers/mermaid.test.ts, renderers/embed.test.ts, html.test.ts
            [A] src/core/state/embeds.test.ts, markdown-commands.test.ts, preview.test.ts, view-context.test.ts
            [A] src/ui/images.test.ts
            [A] src/preview/assets.test.ts
            [M] src/core/config/schema.test.ts or src/core/state/config.test.ts (preview section cases)
            Decisions: DES1–DES13
```

`src/core/kernel/**`, `src/core/filetypes/registry.ts`, `knip.json`, and the workflows are unchanged: the kernel and registry types already carry everything DI3 needs, every new module is reachable from `src/app/main.ts` or a test, and no entrypoint is added. `page.html`, `page.js`, `page.css`, and the KaTeX and Mermaid files are reached through the `type: "file"` imports in `assets.ts`, which also count as uses of the `katex` and `mermaid` dependencies for knip. `page.js` and `page.css` are outside knip's `src/**/*.ts` project and are linted by Biome. If knip reports the declaration-only `assets.d.ts` as unused, `knip.json` adds it to `ignore`; `bun run check` (V47) settles this in the first implementation task.

# 5. Runtime Flows and Error Policies

## Keystroke to frame in live view

**Participating Symbols:** `handleKeyAction`, `runVim`, `createUpdate`, `syncEmbeds`, `EditorView.show`, `layoutFrame`, `fitCursor`, `ViewContextRegistry.build`, `markdownViewContext`, `livePreview`, `reveal`, `renderKey`, `BlockRenderer`, `layoutText`, `widgetPainters`

**Illustrative Flow:**

```text
key → handleKeyAction → runVim (read-only view? refuse + hint) → setBuffer → markdown analyze (parseDoc reuses blocks)
    → createUpdate wrapper → followShownNote → syncEmbeds (read effects / evictions) → store notifies
Shell.paint → EditorView.show(s, id, rect)
    → spec = ft.views[b.view]; host = {width, rows, imageSize, cellAspect}
    → ctx = reg.viewContexts.build(ft.id, s, id, host)           (markdownViewContext → PreviewCtx)
    → input = spec.input ? spec.input(b.analysis, ctx) : b.analysis
    → fitCursor: lines = layoutText(view(top), providers, input); while cursor row ∉ rows → top++ ; repeat
         livePreview: blocksIn(visible) → reveal → per block: revealed ? sign ▕ : renderer(key)(block, v, input)
                      renderer throws → line sign ⚠ for the block (source stays)
    → cache lines and cursor cell
EditorView.renderSelf → per RenderLine: gutter + sign | widget ? widgetPainters.get(type)(target, widget) : paintLine
```

1. `runVim` refuses an edit in a read-only view by discarding the engine result and setting the `reading mode — <leader>m to edit` message.
2. The update wrapper runs `syncEmbeds` after `followShownNote`, so every step that changes buffers keeps embed targets consistent.
3. `EditorView.show` lays out once; `renderSelf` paints the cached rows.
4. `livePreview` touches only blocks intersecting `v.visible`; each renderer's expensive output is cached by block hash and width.

**Detailed Control Flow:** section 7, `src/ui/editors/text-view.ts` (`layoutFrame`, `fitCursor`), `src/core/lang/markdown/live-preview.ts` (`livePreview`)

## Embed load

**Participating Symbols:** `embedTargets`, `syncEmbeds`, `onFileLoaded`, `onFileRefused`, `markdownViewContext`, `embedRenderer`, `paintEmbed`

**Illustrative Flow:**

```text
listed note N analyzed → syncEmbeds: for N, embedTargets(N) − open paths − N.embeds.requested − N.embeds.refused → read effects
                        (a path already requested by another buffer is recorded on N without a second read); N.embeds.requested += …
read → fileLoaded(path) → onFileLoaded: some listed buffer requested path and no window waits → buffer {listed: false};
                          every requesting buffer: requested −= path
read → fileRefused(path) → onFileRefused: every requesting buffer: requested −= path, refused += path; no error notice
frame → ctx.embed(path) → {doc, text} | "loading" | "missing" → embedRenderer → widget{type:"embed", rows}
open embed (Enter) → openPath → showBuffer → listed: true
listed note closed / embed removed → syncEmbeds → unlisted buffers no listed note embeds are removed
```

1. A target is resolved with the same `resolveLink` as links; an unresolved target renders as an unresolved link and is never read.
2. `fileRefused` for a requested embed moves the path from `requested` to `refused` on every buffer that requested it, so the widget shows `missing`, the next keystroke sends no new `read`, and no error notice interrupts typing.

**Detailed Control Flow:** section 7, `src/core/state/embeds.ts`, `src/core/lang/markdown/renderers/embed.ts`

## Image load and repaint

**Participating Symbols:** `imageRenderer`, `PreviewCtx.image`, `ViewHost.imageSize`, `paintImage`, `ImageCache`, `loadImage`, `readImage`, `imageTier`

**Illustrative Flow:**

```text
imageRenderer → ctx.images === "off" → replace with "[image: name]" spans (no widget)
             → ctx.image(ref) → "unknown" → widget{type:"image", data:{path,name}, rows:1} ("◌ name")
                              → {rows}     → widget{type:"image", data:{path,name}, rows}
paintImage → imageTier(...) → cache.get(path):
     miss → cache.load(path) → loadImage(path) → bytes → imageInfo + NativeImage.decode → store → renderer.requestRender()
     decoded → drawImage(image, x, y, cols, rows, …, protocol)
     failed (svg / corrupt / missing) → placeholder "[image: name]"
next frame → host.imageSize(path) known → ctx.image → rows → layout reserves them
```

1. Bytes and decoded images never enter `AppState`; the repaint is a render request, not an action.

**Detailed Control Flow:** section 7, `src/ui/images.ts`, `src/ui/widgets/image.ts`, `src/core/lang/markdown/renderers/image.ts`

## Open and restore

**Participating Symbols:** `onFileLoaded`, `defaultView`, `onStateLoaded`

**Illustrative Flow:**

```text
fileLoaded(path) → ft = forPath(path) → view = defaultView(ft, config) → "live" for .md, "source" otherwise
stateLoaded(persisted) → windows wait for paths → fileLoaded → defaultView (persisted view ignored, as today)
```

**Detailed Control Flow:** section 7, `src/core/state/buffers.ts`

## Preview start, follow, and stop

**Participating Symbols:** `startPreview`, `PreviewHost.start`, `startPreviewServer`, `PAGE`, `ASSETS`, `followTarget`, `renderHtml`, `htmlCtx`, `openUrl`, `onPreviewStarted`, `onOpenUrlFailed`, `PreviewHost.stop`, `installLifecycle`

**Illustrative Flow:**

```text
:Preview (markdown) → startPreview: preview off → effects [startPreview]
                                     preview on(port) → effects [openUrl(url)]
runner startPreview → previewHost.start() → startPreviewServer → ok → previewStarted{port} → state on(port) → [openUrl(url)]
                                                                → throws → previewFailed{reason} → error toast
runner openUrl → openUrl(url, platform) → exit ≠ 0 / ENOENT → openUrlFailed{url} → toast "could not open a browser — <url>"
edit / switch → store notifies → server debounce 100 ms → followTarget(s) = active listed markdown buffer | last
             → changed (path, version, line)? → SSE "doc" {path, version, line}
browser → GET / → PAGE → GET /assets/{katex.min.css,page.css,katex.min.js,mermaid.min.js,page.js,fonts/*} → ASSETS → Bun.file (embedded)
browser → GET /render?path=p → open buffer p ? its Doc : read contained file → parseDoc → renderHtml → fragment → renderBlocks (KaTeX, Mermaid)
:PreviewStop → stopPreview → runner → previewHost.stop() → server.stop() → previewStopped → state off
exit → lifecycle.shutdown → previewHost.stop() → shell.destroy()
server.stop: unsubscribe → send "stopped" → close streams → Bun server.stop(true)
```

1. Non-Markdown files never start a server (`runCommand` refuses with `not available for <type> files`).
2. Switching to a non-Markdown buffer leaves `followTarget` on the last note, so no `doc` event is sent and `/render` without `path` still returns it.

**Detailed Control Flow:** section 7, `src/core/state/preview.ts`, `src/preview/server.ts`, `src/app/preview-host.ts`

## Failure and Recovery Rules

- **Block renderer throws** — Detected by the `try` around each renderer call in `livePreview`; represented as a `line` decoration with sign `{ text: "⚠", style: "signError" }` on the block's first line and no other decorations for that block; the block shows as source.
- **Whole layout throws** — Detected by `EditorView.layoutFrame`'s existing `catch` (`src/ui/editors/text-view.ts:420-429`); raw lines are painted.
- **Embed target missing or refused** — Detected by `ctx.embed` returning `"missing"` (the target is in the laid-out buffer's `embeds.refused`, or neither open nor requested); the embed renders in the `linkUnresolved` style; a refused path is not requested again while it stays in `refused`, which is cleared when the embed leaves the note or the buffer is reopened.
- **Image unreadable, SVG, or undecodable** — Detected by `ImageCache.load` (`readImage` rejection or `ImageError`); represented as `{ failed: true }` in the cache; painted as `[image: <name>]`; retried only after eviction or a resize clears the entry.
- **Mermaid unsupported or parse error** — Detected by `mermaidText`; represented as `{ kind: "source", label }`; rendered as the fenced source with the label row.
- **Read-only edit** — Detected in `runVim` (engine text version changed or mode became insert); handled by discarding the result and setting the hint message.
- **Server start fails** (port bind error) — Detected by `PreviewHost.start` catching `Bun.serve`; represented as `previewFailed{reason}`; error toast `preview failed: <reason>`; state stays off.
- **Browser launch fails** — Detected by `openUrl` (non-zero exit or spawn error); represented as `openUrlFailed{url, reason}`; info toast with the URL; the server keeps serving.
- **Disallowed Host / escaped path / unknown asset / non-GET** — Detected by `startPreviewServer`'s `fetch`; 403, 404, 404, and 405 respectively, each with the security headers; no state change.
- **KaTeX or Mermaid render error in the page** — Detected by KaTeX (`throwOnError: false` renders the source in the error colour) and by the `catch` around `mermaid.render`; the block keeps its escaped source with a `render-error` label; the rest of the note renders.
- **SSE client disconnects** — Detected by the stream's `cancel`; the controller leaves the client set.
- **Concurrency** — `:Preview` during a pending start is covered because `startPreview` emits the effect only when `preview.status === "off"` and the reducer sets `status: "starting"`; a second request in `starting` emits nothing.

## Construction and Wiring Flow

```text
src/app/main.ts
  registries() → FileTypeRegistry(+ markdownFileType with live/source/reading)
               → CommandRegistry(+ markdownCommands) ; bindings += markdownBindings ; groups unchanged
               → viewContexts = new ViewContextRegistry() ; viewContexts.register("markdown", markdownViewContext)
  builtinRenderers()                                  (registers heading … image renderers once)
  registerEditorView("text", …) ; registerWidgetPainter("image" | "embed" | "text" | "rule", …)
  createShell(renderer, { reg, now, loadImage: (p) => readImage(root, p) })
  previewHost = createPreviewHost({ root, store: () => store, isExcluded: matcher.isExcludedPath, logger, dispatch })
  deps.preview = previewHost ; deps.openUrl = (url) => openUrl(url, process.platform)
  installLifecycle({ …, stopPreview: previewHost.stop })
```

- **Construction:** `src/app/main.ts` — `registries`, `main` — builds the view-context registry, the preview host, and injects `loadImage` and `openUrl`.
- **Registration:** `src/core/lang/markdown/renderers/index.ts` — `builtinRenderers` — registers the built-in block renderers; `src/app/main.ts` — `registerWidgetPainter` — registers `image`, `embed`, `text`, `rule`; `src/core/state/markdown-commands.ts` — `markdownCommands`, `markdownBindings` — registered in `registries()`; `test/support/state.ts` mirrors all of these.
- **Exports:** `live-preview.ts` exports `PreviewCtx`, `MarkdownViewInput`, `livePreview`, `BlockRenderer`, `registerBlockRenderer` (G4); `src/ui/widgets/registry.ts` exports `registerWidgetPainter`, `WidgetPainter` (G4); `view-context.ts` exports `ViewContextRegistry`, `ViewHost`.
- **Configuration:** `src/core/config/schema.ts` — `preview.mode`, `preview.embedMaxRows`, `preview.images` — read at layout time from `AppState.config` and at open time by `defaultView`.

# 6. Logical Contracts, Data Models, and State

| Item | Kind | Purpose | Used By |
|---|---|---|---|
| `PreviewCtx` | Contract | What the provider and renderers may know beyond the view | `markdownViewContext` → `livePreview`, renderers, DI4 base renderer |
| `MarkdownViewInput` | Contract | The provider's per-frame input | `markdownFileType` `input` hook → `livePreview` |
| `BlockRenderer` / `registerBlockRenderer` | Contract (G4) | Extension point per render key | built-ins, DI4 |
| `ViewHost` / `ViewContextBuilder` | Contract | Language-neutral UI facts and per-file-type context building | `EditorView` → `ViewContextRegistry` |
| `WidgetPainter` | Contract (G4) | UI painting per widget type | `EditorView` → painters |
| `RenderLine`, `Widget`, `Sign`, `Decoration` | Data model (unchanged) | Layout output | kernel → `EditorView` |
| `BufferState.listed` | State | Hide embed targets from user-facing buffer lists | `syncEmbeds`, bufferline, session, pickers |
| `WindowState.content.folds` | State | Block ids toggled from their default fold | `toggleFold` → `markdownViewContext` |
| `BufferState.embeds` | State | Per embedding note: embed targets it requested and those refused | `syncEmbeds`, `onFileLoaded`, `onFileRefused`, `markdownViewContext` |
| `AppState.preview` | State | Whether the preview server runs and on which port | preview reducers, statusline, `:Preview` |
| Preview actions and effects | Message | Start, stop, launch, and their results | reducers ↔ runner |
| Preview HTTP routes and `PreviewEvent` | API | Browser contract | server ↔ page |
| Preview assets | Data model | Embedded page and browser-library files served at `/assets/<name>` | `assets.ts` → server → page |
| `HtmlCtx` | Contract | Link and asset hrefs and embed loading for HTML | `htmlCtx`/server → `renderHtml` |
| `AppConfig.preview` | Schema | User options | schema → state → builders |
| `ImageTier` | Contract | Protocol decision | `imageTier` → `paintImage` |

## `PreviewCtx` — Contract

**Purpose:** The only window into application state that the Markdown provider and block renderers get, so they stay pure and golden-testable.

**Includes:**

- `resolve(target)` — the workspace path a link target resolves to, or `undefined`.
- `isResolved(target)` — `resolve(target) !== undefined`.
- `embed(path)` — `{ doc, text }` of an open buffer (listed or not), `"missing"` when the laid-out buffer's `embeds.refused` has the path, `"loading"` when its `embeds.requested` has it, `"missing"` otherwise.
- `image(ref)` — `{ rows }` for this window once the image size is known, else `"unknown"`.
- `folds` — block ids whose fold state is toggled from the default in this window.
- `embedMaxRows`, `images` — configuration.

**Usage:**

```text
markdownViewContext(s, windowId, host) → PreviewCtx → MarkdownViewInput.ctx → livePreview / BlockRenderer
```

**Rules:**

- **Compatibility:** Fields beyond the phase-design shape (`resolve`, `folds`, `embed().text`) are additive; DI4's `base` renderer may use them.
- **Invariants:** Pure reads; the same state, window, and host give the same answers; no I/O.
- **Ownership and Lifecycle:** Built per window per frame by `markdownViewContext`; never stored.

**Location:** `src/core/lang/markdown/live-preview.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/lang/markdown/live-preview.ts` — `PreviewCtx`

## `MarkdownViewInput` and `BlockRenderer` — Contract (G4)

**Purpose:** Fix what the provider and every renderer read, so DI4 can register `base` without touching the provider.

**Includes:**

- `MarkdownViewInput { doc, view: "live" | "reading", ctx }`.
- `BlockRenderer(block, v, input) → Decoration[]` and `registerBlockRenderer(kind, r)`.

**Usage:**

```text
registerBlockRenderer("table", tableRenderer) … ; livePreview → renderKey(block) → renderer(block, v, input)
```

**Rules:**

- **Compatibility:** Signatures equal the phase design (`…phase-2…md:205-216`).
- **Invariants:** A renderer returns decorations only for lines of its block; it never reads lines outside `v.visible` except its own block's text; a later registration for the same key replaces the earlier one.
- **Ownership and Lifecycle:** Module-level registry filled at startup by `builtinRenderers` and DI4.

**Location:** `src/core/lang/markdown/live-preview.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/lang/markdown/live-preview.ts`

## `ViewHost` and `ViewContextBuilder` — Contract

**Purpose:** Let `EditorView` request a view's input context without knowing the language.

**Includes:**

- `ViewHost { width, rows, imageSize(path), cellAspect }` — text width and rows of the window; decoded image pixel size if cached; cell width ÷ height.
- `ViewContextBuilder = (s, windowId, host) => unknown`.
- `ViewContextRegistry.register(fileTypeId, builder)`, `build(fileTypeId, s, windowId, host)`.

**Usage:**

```text
EditorView.layoutFrame → reg.viewContexts.build(b.fileType, s, windowId, host) → ctx → spec.input(analysis, ctx)
```

**Rules:**

- **Compatibility:** A file type without a builder gets `undefined` as `ctx`; a view without `input` gets the analysis as today.
- **Invariants:** `ViewHost` carries no language types.
- **Ownership and Lifecycle:** One registry in `Registries`, filled in `registries()`.

**Location:** `src/core/state/view-context.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/state/view-context.ts`

## `WidgetPainter` — Contract (G4)

**Purpose:** Paint a widget's reserved rows by widget type.

**Includes:**

- `PaintTarget { buf, theme, x, y, width, rows, state, deps }`.
- `WidgetPainter = (t: PaintTarget, w: Widget) => void`; `registerWidgetPainter(type, p)`.

**Usage:**

```text
EditorView.renderSelf → widgetPainters.get(row.widget.type) ?? paintMissing → painter(target, widget)
```

**Rules:**

- **Compatibility:** Unknown types paint a dim `[<type>]` row, so a missing registration never throws.
- **Invariants:** A painter writes only inside `x … x+width`, `y … y+rows`.
- **Ownership and Lifecycle:** Module-level map like `editorViews`; registered in `src/app/main.ts` and `test/support/ui.ts`.

**Location:** `src/ui/widgets/registry.ts` — None — proposed item

**Detailed Shape:** section 7, `src/ui/widgets/registry.ts`

## `RenderLine`, `Widget`, `Sign`, `Decoration` — Data model (unchanged)

**Purpose:** Kernel layout output and input.

**Includes:**

- `RenderLine { sourceLine, spans, widget?, sign? }`, `Widget { type, data, rows }`, `Sign { text, style }` (`src/core/kernel/view/types.ts:12-38`).
- `Decoration` variants `mark`, `replace`, `widget`, `line` (`src/core/kernel/view/decorations.ts:10-21`).

**Usage:**

```text
livePreview → Decoration[] → layoutText → RenderLine[] → EditorView
```

**Rules:**

- **Compatibility:** Unchanged; DI3 adds producers and consumers only.
- **Invariants:** Text outside `replace` is copied verbatim.
- **Ownership and Lifecycle:** Per frame.

**Location:** `src/core/kernel/view/types.ts:12-38`, `src/core/kernel/view/decorations.ts:10-26`

**Detailed Shape:** None — unchanged item; consumers in section 7 are `live-preview.ts`, renderers, and `text-view.ts`.

## `BufferState.listed` and `BufferState.embeds` — State

**Purpose:** Keep embed targets in the one buffers map without showing them as open files.

**Includes:**

- `BufferState.listed?: false` — absent means listed.
- `BufferState.embeds?: { requested: string[]; refused: string[] }` — on a listed Markdown buffer: the embed targets it requested whose `read` is still outstanding, and the targets whose read was refused. It is optional, never persisted, and not in the session snapshot. It lives inside the RM261003ABZP-DES2@R2 buffers map, so DI3 adds no top-level `AppState` field besides `preview`.

**Usage:**

```text
syncEmbeds → per listed buffer N: N.embeds.requested += missing → read effects (one per path across buffers)
fileLoaded(p) → buffer{listed:false}; requesters: requested −= p ; fileRefused(p) → requesters: requested −= p, refused += p
showBuffer → listed removed ; syncEmbeds → evict unlisted not embedded by any listed Markdown buffer
```

**Rules:**

- **Compatibility:** Absent `listed` keeps every PH1 buffer listed; absent `embeds` means nothing requested; `state.json` unchanged (`snapshotSession` writes only `path` and `view`, `src/core/state/session.ts:92`).
- **Invariants:** An unlisted buffer is never shown in a window, never dirty, never in `snapshotSession`, the bufferline, `:bn`/`:bp`, or picker open paths; at most one `read` is outstanding per path across all buffers; a buffer's `requested` and `refused` hold only targets that buffer currently embeds; an unlisted buffer has no `embeds` (one level).
- **Ownership and Lifecycle:** `listed` is set by `onFileLoaded`, removed by `showBuffer`, and the buffer evicted by `syncEmbeds`; `embeds` is owned by its listed buffer, written by `syncEmbeds`, `onFileLoaded`, and `onFileRefused`, and dropped with the buffer.

**Location:** `src/core/state/types.ts:67-86` (`BufferState`)

**Detailed Shape:** section 7, `src/core/state/types.ts`, `src/core/state/embeds.ts`

## `WindowState.content.folds` — State

**Purpose:** Per-window fold and expand overrides.

**Includes:**

- `folds?: number[]` — `Block.id`s whose state differs from the default (callout `[!x]-` folded by default, others open; embeds collapsed by default).

**Usage:**

```text
fold.toggle → toggleFold(window, block.id) → markdownViewContext → PreviewCtx.folds → calloutRenderer / embedRenderer
```

**Rules:**

- **Compatibility:** Optional; not persisted.
- **Invariants:** Ids not present in the current `Doc` have no effect and are dropped on the next toggle; editing a block's text changes its id and so resets its fold.
- **Ownership and Lifecycle:** Owned by the window; dropped when the window shows another buffer.

**Location:** `src/core/state/types.ts:88-91`

**Detailed Shape:** section 7, `src/core/state/types.ts`, `src/core/state/markdown-commands.ts`

## `AppState.preview` — State

**Purpose:** The preview server's lifecycle as seen by the reducer and the statusline.

**Includes:**

- `{ status: "off" } | { status: "starting" } | { status: "on"; port: number }`.

**Usage:**

```text
startPreview → starting → previewStarted → on(port) ; stopPreview/previewStopped → off ; previewFailed → off
```

**Rules:**

- **Compatibility:** New field with default `off`; never persisted.
- **Invariants:** At most one server; `on` only after the host reports a bound port.
- **Ownership and Lifecycle:** Reducer-owned; the host owns the server object.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/state/types.ts`, `src/core/state/preview.ts`

## Preview actions and effects — Message

**Purpose:** Connect the reducer to the preview host and the browser launcher.

**Includes:**

- Effects `{kind:"startPreview"}`, `{kind:"stopPreview"}`, `{kind:"openUrl"; url}`.
- Actions `{type:"previewStarted"; port}`, `{type:"previewStopped"}`, `{type:"previewFailed"; reason}`, `{type:"openUrlFailed"; url; reason}`.

**Usage:**

```text
reducer → effect → src/app/effects.ts → previewHost / openUrl → action → reducer
```

**Rules:**

- **Compatibility:** Names differ from the picker's `readPreview` and `previewLoaded`.
- **Invariants:** Every effect yields at most one result action.
- **Ownership and Lifecycle:** Per command.

**Location:** `src/core/state/types.ts:274-345` — None — proposed variants

**Detailed Shape:** section 7, `src/core/state/types.ts`, `src/app/effects.ts`

## Preview HTTP routes and `PreviewEvent` — API

**Purpose:** The browser contract.

**Includes:**

- `GET /` and `GET /<path>` → page shell (`text/html; charset=utf-8`).
- `GET /assets/<name>` → an embedded page or browser-library file with its exact content type; 404 for a name not in `ASSETS`.
- `GET /events` → SSE: `event: doc` with `{ path, version, line }`; `event: stopped` with `{}`.
- `GET /render?path=<rel>` → HTML fragment of that note (current note when omitted); 404 when not a contained Markdown file.
- `GET /file/<rel>` → contained workspace file bytes with a type from the extension.
- Any other method → 405; Host not allowlisted → 403.
- Every response carries `SECURITY_HEADERS`: `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`; page and asset responses add `Cache-Control: no-cache`.

**Usage:**

```text
page → <script src="/assets/katex.min.js">, /assets/mermaid.min.js, /assets/page.js; <link href="/assets/katex.min.css">, /assets/page.css
page → EventSource("/events") → doc → fetch("/render?path=") → swap article → katex.render / mermaid.render per block
```

**Rules:**

- **Compatibility:** Parent routes kept; `/assets/*` is new (W261003S6BQ-REQ7@R2); the `doc` payload field `line` replaces `anchor` (parent sync item 3).
- **Invariants:** Bound to `127.0.0.1`; Host ∈ {`127.0.0.1:<port>`, `localhost:<port>`}; every served workspace path's realpath is inside the workspace realpath and not hidden or excluded; `/assets/*` reads only the files `ASSETS` names (embedded in the compiled binary; package files under `node_modules` when run from source); the page and assets reference no origin other than the server's own; no route writes.
- **Ownership and Lifecycle:** Exists between `previewStarted` and `previewStopped` or exit.

**Location:** `src/preview/server.ts` — None — proposed item

**Detailed Shape:** section 7, `src/preview/server.ts`

## Preview assets — Data model

**Purpose:** Name every file the page may load, so the server serves a closed set from the binary.

**Includes:**

- `PreviewAsset = { path: string; type: string }` — `path` is the value of a `with { type: "file" }` import; `type` is the exact `Content-Type`.
- `PAGE: PreviewAsset` — `page.html`, served at `/` and `/<path>`.
- `ASSETS: ReadonlyMap<string, PreviewAsset>` keyed by the name after `/assets/`: `page.js`, `page.css`, `katex.min.js`, `katex.min.css`, `fonts/KaTeX_<face>.woff2` (one entry per woff2 face `katex.min.css` references), `mermaid.min.js`.

**Usage:**

```text
import katexJs from "katex/dist/katex.min.js" with { type: "file" }  →  ASSETS["katex.min.js"] = { path: katexJs, type: "text/javascript; charset=utf-8" }
GET /assets/katex.min.js → ASSETS.get → new Response(Bun.file(path), { headers: { "Content-Type": type, …SECURITY_HEADERS } })
```

**Rules:**

- **Compatibility:** New. `katex` and `mermaid` are exact-pinned dependencies imported only from `src/preview/` (`PACKAGE_HOMES`).
- **Invariants:** Names are flat and fixed at build time; a request name is a map key, never a path, so traversal is impossible. Font names match the `url(fonts/….woff2)` references in `katex.min.css`, which resolve to `/assets/fonts/…` because the stylesheet is served from `/assets/`. No asset references an external origin.
- **Ownership and Lifecycle:** Module constant; the files are embedded by `bun build --compile` and live as long as the binary.

**Location:** `src/preview/assets.ts` — None — proposed item

**Detailed Shape:** section 7, `src/preview/assets.ts`

## `HtmlCtx` — Contract

**Purpose:** Give the pure HTML renderer link targets and embed contents.

**Includes:**

- `href(target)` → `/<path>` or `undefined` (unresolved).
- `asset(target)` → `/file/<path>` or `undefined`.
- `embed(path)` → `{ doc, text }` or `undefined`.

**Usage:**

```text
server /render → htmlCtx(s, loadFile) → renderHtml(doc, text, ctx)
```

**Rules:**

- **Compatibility:** New.
- **Invariants:** Pure apart from `embed`, whose loader is the server's contained file reader.
- **Ownership and Lifecycle:** Per request.

**Location:** `src/core/lang/markdown/html.ts` — None — proposed item

**Detailed Shape:** section 7, `src/core/lang/markdown/html.ts`, `src/core/state/preview.ts`

## `AppConfig.preview` — Schema

**Purpose:** User options for views and embeds.

**Includes:**

- `mode: "live" | "source" | "reading"` (default `"live"`), `embedMaxRows: int 1–200` (default 10), `images: "auto" | "blocks" | "off"` (default `"auto"`).

**Usage:**

```text
config.toml → parseConfig → AppState.config.preview → defaultView, markdownViewContext
```

**Rules:**

- **Compatibility:** New optional section; existing files stay valid.
- **Invariants:** Strict object; errors name their line (existing `parseConfig`).
- **Ownership and Lifecycle:** Startup and `:ConfigReload`.

**Location:** `src/core/config/schema.ts:10-40`

**Detailed Shape:** section 7, `src/core/config/schema.ts`

## `ImageTier` — Contract

**Purpose:** One pure decision for how an image is drawn.

**Includes:**

- `ImageTier = "kitty" | "sixel" | "blocks" | "placeholder"`.

**Usage:**

```text
paintImage → imageTier(config.preview.images, renderer.capabilities, renderer.resolution !== null) → tier
```

**Rules:**

- **Compatibility:** New.
- **Invariants:** `"off"` → placeholder; `"blocks"` → blocks; `"auto"` → OpenTUI's `resolveImageRenderProtocol("auto", caps, hasResolution)`.
- **Ownership and Lifecycle:** Pure.

**Location:** `src/ui/images.ts` — None — proposed item

**Detailed Shape:** section 7, `src/ui/images.ts`

# 7. Detailed Code Design

## `src/core/lang/markdown/live-preview.ts`

- **Change:** Add
- **Decisions:** DES2, DES4, DES5
- **Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ4@R1, W261003S6BQ-REQ5@R1
- **Responsibilities:** Provider entry, input types, renderer registry, visible-block lookup, failure isolation.
- **Affected Callers/Consumers:** `src/core/lang/markdown/file-type.ts` (views), `renderers/*`, DI4 `embed-renderer.ts`
- **Construction/Wiring:** `builtinRenderers()` fills the registry at startup.
- **Dependencies:** `Doc`, `Block` (`doc.ts`), `blockNode` (`mdast.ts`), `reveal.ts`, `render-key.ts`, `inline.ts`, kernel `Decoration`, `TextView`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PreviewCtx` | None — new symbol | phase shape + `resolve`, `folds`, `embed().text` | `markdown-view.ts`, renderers |
| `MarkdownViewInput` | None — new symbol | `{ doc, view, ctx }` | `file-type.ts`, renderers |
| `livePreview` | None — new symbol | `DecorationProvider<MarkdownViewInput>` | `markdownFileType.views` |
| `BlockRenderer`, `registerBlockRenderer` | None — new symbol | phase shapes | built-ins, DI4 |
| `blocksIn` | None — new symbol | binary search of blocks intersecting a line range | `livePreview`, `renderHtml` (all blocks) |

**Existing Shape:** None — new file or symbol

```ts
None
```

There is no current provider; `markdownFileType.views` holds one `source` view with no decorations (`src/core/lang/markdown/file-type.ts:10`).

**Proposed Shape:**

```ts
export type PreviewCtx = {
  resolve(target: string): string | undefined;
  isResolved(target: string): boolean;
  embed(path: string): { doc: Doc; text: TextBuffer } | "loading" | "missing";
  image(ref: string): { rows: number } | "unknown";
  folds: ReadonlySet<number>;
  embedMaxRows: number;
  images: "auto" | "blocks" | "off";
};
export type MarkdownViewInput = { doc: Doc; view: "live" | "reading"; ctx: PreviewCtx };
export type BlockRenderer = (block: Block, v: TextView, input: MarkdownViewInput) => Decoration[];

const renderers = new Map<string, BlockRenderer>();
export function registerBlockRenderer(kind: BlockKind | string, r: BlockRenderer): void { renderers.set(kind, r); }

export const livePreview: DecorationProvider<MarkdownViewInput> = (v, input) => {
  const shown = reveal(input.doc, input.view, v.cursor, v.selection);
  const out: Decoration[] = [];
  for (const block of blocksIn(input.doc, v.visible)) {
    if (shown.blocks.has(block.id)) { out.push(...revealSigns(block, v)); continue; }
    const key = renderKey(block, input.doc, v.buf);
    const r = renderers.get(key) ?? renderers.get("paragraph");
    try { out.push(...(r?.(block, v, input) ?? []), ...inlineDecorations(block, v, input, shown.lines)); }
    catch { out.push({ kind: "line", line: block.startLine, sign: { text: "⚠", style: "signError" } }); }
  }
  return out;
};
```

`PreviewCtx` is the phase-design shape with three additive members: `resolve` lets renderers turn a link target into a path before asking `embed` or `image`, `folds` carries the window's toggles, and `embed` returns the target's `TextBuffer` because a `Doc` does not hold text. `livePreview` first asks `reveal` which lines and blocks show source, then walks only the blocks intersecting `v.visible`. A revealed block gets `▕` signs and nothing else, so the highlighter marks already in the provider list show it as source. Other blocks go to the renderer registered for their render key, falling back to the paragraph renderer, and then to `inlineDecorations`, which hides inline markers on lines that are not revealed. A throwing renderer contributes only a `⚠` sign on the block's first line, so the block stays readable as source. `registerBlockRenderer` replaces any earlier registration for the key, which is how DI4 adds `base` and how tests swap a renderer.

- **Invariants:**
  - The provider reads lines only inside `v.visible` plus the text of blocks that intersect it.
  - `reading` never reveals; the `source` view does not list this provider.
  - No `@opentui`, `core/state`, or I/O import.
- **Verification Coverage:** S2, S3, S18 — V4, V5, V41

## `src/core/lang/markdown/reveal.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** W261003S6BQ-REQ1@R1
- **Responsibilities:** Decide which lines show inline source and which blocks show full source.
- **Affected Callers/Consumers:** `livePreview`
- **Construction/Wiring:** None — pure helper
- **Dependencies:** `Doc`, `Pos`, `Range`, `render-key.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `RevealSet`, `reveal`, `MULTILINE_KEYS` | None — new symbol | below | `livePreview` |

**Existing Shape:** None — new file or symbol

```ts
None
```

Reveal is new; Alfred's `reveal-units.ts` is the reference.

**Proposed Shape:**

```ts
export type RevealSet = { lines: ReadonlySet<number>; blocks: ReadonlySet<number> };
export const MULTILINE_KEYS = new Set(["table", "callout", "fence", "math", "mermaid", "frontmatter", "html"]);
export function reveal(doc: Doc, view: "live" | "reading", cursor: Pos, selection?: Range): RevealSet;
```

`reveal` returns nothing for `reading`. In `live` it adds the cursor line, or every line of the selection, to `lines`, and adds the id of each block intersecting those lines whose render key is in `MULTILINE_KEYS` to `blocks`. A whole revealed block shows source on every row; a revealed line shows its own inline syntax only.

- **Invariants:**
  - Moving the cursor off a block un-reveals it on the next frame.
- **Verification Coverage:** S2 — V1, V4

## `src/core/lang/markdown/render-key.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ4@R1
- **Responsibilities:** Map a block to the key its renderer is registered under.
- **Affected Callers/Consumers:** `livePreview`, `reveal`, `renderHtml`
- **Construction/Wiring:** None — pure helper
- **Dependencies:** `Block.kind` (`blocks.ts:1-10`), `blockNode`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `renderKey`, `embedOnly`, `IMAGE_EXTENSIONS` | None — new symbol | below | provider, HTML |

**Existing Shape:** `src/core/lang/markdown/blocks.ts:1-10`

```ts
export type BlockKind =
  | "frontmatter" | "fence" | "math" | "indentedCode" | "heading"
  | "list" | "html" | "comment" | "paragraph";
```

The block splitter knows only these coarse kinds; tables, callouts, quotes, rules, and embed-only paragraphs are all `paragraph` or `list` at this level.

**Proposed Shape:**

```ts
export const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);
export function renderKey(block: Block, doc: Doc, text: TextBuffer): string;
// frontmatter | fence → "mermaid" when info is mermaid, else "code" | math | heading | list | comment
// paragraph → mdast root child: table | blockquote → "callout" when [!type], else "quote" | thematicBreak → "rule"
//           | footnoteDefinition → "footnote" | single embed node → embedOnly(target) | otherwise "paragraph"
export function embedOnly(target: string): string; // "embed" for notes, "image" for IMAGE_EXTENSIONS, else the extension
```

`renderKey` refines the cheap block kind with the block's cached mdast root only for `paragraph`-kind blocks, so most blocks never parse. An embed-only paragraph maps to `embed`, `image`, or the bare extension, which is how `![[tasks.base]]` reaches a DI4 `base` renderer without the provider knowing Bases. An unregistered key falls back to the paragraph renderer, which shows the embed as a link.

- **Invariants:**
  - The key depends only on the block's text, so it is stable across frames.
- **Verification Coverage:** S2, S18 — V5

## `src/core/lang/markdown/inline.ts`, `render-cache.ts`, `renderers/*`

- **Change:** Add
- **Decisions:** DES2, DES3, DES4, DES5, DES7
- **Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ3@R1, W261003S6BQ-REQ4@R1, W261003S6BQ-REQ5@R1
- **Responsibilities:** Element rendering per M2 and UDES3/UDES4.
- **Affected Callers/Consumers:** `livePreview` via the registry
- **Construction/Wiring:** `renderers/index.ts` `builtinRenderers()` called once from `src/app/main.ts` and `test/support/state.ts`.
- **Dependencies:** `blockNode`, `lowlightHighlighter` (fenced code), `beautiful-mermaid` (Mermaid only)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `inlineDecorations` | None — new symbol | hides `** * ~~ == \` [[ ]] %% %%` markers, link URLs, styles spans, `linkUnresolved` via `ctx.isResolved` | `livePreview` |
| `RenderCache` | None — new symbol | LRU of 512 entries keyed `hash|width|variant` | table, math, mermaid, embed |
| `headingRenderer` … `footnoteRenderer`, `imageRenderer`, `embedRenderer` | None — new symbol | one per key | registry |
| `builtinRenderers` | None — new symbol | registers all built-ins | `main.ts`, tests |

**Existing Shape:** None — new file or symbol

```ts
None
```

No renderer exists; `lowlightHighlighter` (`src/core/lang/code`) already highlights fenced code in source view.

**Proposed Shape:**

```ts
export class RenderCache<T> { constructor(limit = 512); get(key: string, make: () => T): T; }
export function inlineDecorations(block: Block, v: TextView, input: MarkdownViewInput, revealed: ReadonlySet<number>): Decoration[];
export function builtinRenderers(): void {
  registerBlockRenderer("heading", headingRenderer);   // █ ▊ ▌ ▏ prefix, hidden #s, mdHeadingN
  registerBlockRenderer("list", listRenderer);         // bullets, ☐/☑ task boxes
  registerBlockRenderer("table", tableRenderer);       // box-drawn, column-aligned, cached
  registerBlockRenderer("callout", calloutRenderer);   // icon + title, ▸ when folded, body hidden by block replace
  registerBlockRenderer("quote", calloutRenderer);
  registerBlockRenderer("code", codeRenderer);         // fences hidden, lowlight marks kept
  registerBlockRenderer("math", mathRenderer);
  registerBlockRenderer("mermaid", mermaidRenderer);
  registerBlockRenderer("frontmatter", frontmatterRenderer); // properties block
  registerBlockRenderer("rule", ruleRenderer);         // widget{type:"rule", rows:1}
  registerBlockRenderer("footnote", footnoteRenderer);
  registerBlockRenderer("comment", (b) => [{ kind: "replace", range: wholeBlock(b), block: true }]);
  registerBlockRenderer("embed", embedRenderer);
  registerBlockRenderer("image", imageRenderer);
}
```

Each renderer returns kernel decorations only. Multi-row replacements (tables, callouts, frontmatter, math blocks, Mermaid) use a block `replace` over the block's lines with replacement `spans` on the first line plus `widget`-free extra rows produced as consecutive `replace` decorations per line, so row counts stay one per source line where possible; content taller than the source (a Mermaid drawing) uses one block `widget` of type `text` whose `data` is `Span[][]` and whose `rows` is the drawing height. The `text` widget painter is the embed painter's span-row routine registered under `"text"` too. `RenderCache` keeps the computed spans by block hash and width, so typing elsewhere reuses them.

- **Invariants:**
  - `%%comments%%` are hidden in `live` and `reading`.
  - Renderers never call I/O; images and embeds come from `ctx`.
- **Verification Coverage:** S2, S4, S5, S6 — V4, V6–V12, V13

## `src/core/lang/markdown/renderers/math.ts` and `renderers/mermaid.ts`

- **Change:** Add
- **Decisions:** DES3
- **Requirements:** W261003S6BQ-REQ3@R1
- **Responsibilities:** TeX → Unicode (ported from `alfred/apps/tui/src/view/markdown/math.ts`), Mermaid → ASCII (`beautiful-mermaid`).
- **Affected Callers/Consumers:** registry; `inlineDecorations` (inline `$…$`)
- **Construction/Wiring:** `builtinRenderers`
- **Dependencies:** `beautiful-mermaid@1.1.3` (`parseMermaid`, `renderMermaidASCII`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `mathText` | None — new symbol (Alfred `MathText` at `math.ts:1-4`) | `(tex) => { kind: "unicode"; text } \| { kind: "source"; tex }` | math renderer, inline |
| `mermaidText` | None — new symbol (Alfred `MermaidBlock` at `mermaid.ts:3-11`) | `(source, width) => { kind: "text"; lines } \| { kind: "source"; label }` | mermaid renderer |

**Existing Shape:** `alfred/apps/tui/src/view/markdown/mermaid.ts:1-11`

```ts
import { parseMermaid, renderMermaidASCII } from "beautiful-mermaid";
export type MermaidBlock =
  | { readonly kind: "text"; readonly lines: readonly string[]; readonly source: string }
  | { readonly kind: "no-text-layout"; readonly source: string }
  | { readonly kind: "parse-error"; readonly source: string };
```

Alfred distinguishes laid-out text, types the library cannot lay out, and parse errors; `so` keeps that split but collapses the two failures into one `source` result with a label.

**Proposed Shape:**

```ts
export type MathResult = { kind: "unicode"; text: string } | { kind: "source"; tex: string };
export function mathText(tex: string): MathResult;
export type MermaidResult = { kind: "text"; lines: string[] } | { kind: "source"; label: string };
export function mermaidText(source: string, width: number): MermaidResult;
export const mermaidRenderer: BlockRenderer; // cache.get(`${block.hash}|${v.width}`, () => mermaidText(...))
```

`mathText` returns Unicode only when every token maps, else the TeX unchanged, exactly as Alfred. `mermaidText` returns ASCII lines for the diagram types `beautiful-mermaid` lays out and a `mermaid: <type> shown as source` label otherwise; the renderer caches by block hash and width so typing outside the fence never calls the library again.

- **Invariants:**
  - `beautiful-mermaid` is imported only here.
- **Verification Coverage:** S4 — V6, V7, V8

## `src/core/lang/markdown/renderers/embed.ts`

- **Change:** Add
- **Decisions:** DES4, DES5
- **Requirements:** W261003S6BQ-REQ4@R1
- **Responsibilities:** Lay out an embedded note or section as span rows in core.
- **Affected Callers/Consumers:** registry; `paintEmbed`
- **Construction/Wiring:** `builtinRenderers`
- **Dependencies:** `ctx.resolve`, `ctx.embed`, `ctx.folds`, `layoutText`, `livePreview` (nested, `reading`, embeds as links)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `embedRenderer`, `embedRows`, `sectionLines` | None — new symbol | below | registry |

**Existing Shape:** None — new file or symbol

```ts
None
```

Embeds are scanned today as links of kind `embed` (`syntax.ts:752-756`) but never rendered.

**Proposed Shape:**

```ts
export type EmbedData = { title: string; rows: Span[][]; more: number; state: "ok" | "loading" | "missing" };
export const embedRenderer: BlockRenderer = (block, v, { ctx }) => {
  const { target, section } = embedLink(block);
  const path = ctx.resolve(target);
  const got = path === undefined ? "missing" : ctx.embed(path);
  const expanded = ctx.folds.has(block.id);
  const data = typeof got === "string"
    ? { title: target, rows: [], more: 0, state: got }
    : embedRows(got, section, v.width, expanded ? Infinity : ctx.embedMaxRows);
  const rows = data.state === "loading" ? Math.min(ctx.embedMaxRows, 3) : 1 + data.rows.length + (data.more > 0 ? 1 : 0);
  return [{ kind: "replace", range: wholeBlock(block), block: true, widget: { type: "embed", data, rows } }];
};
```

`embedRenderer` resolves the target, asks `ctx.embed` for the open buffer, and lays out the section with a nested `layoutText` over the target text using `livePreview` in `reading` mode with a context whose `embed` always answers `"missing"`, so nested embeds render as links and recursion stops at one level. The result is plain span rows, so the UI painter needs no Markdown. `more` counts the rows beyond `embedMaxRows`; a toggled block id expands it fully.

- **Invariants:**
  - At most one embed level.
  - `loading` reserves `min(embedMaxRows, 3)` rows.
- **Verification Coverage:** S5 — V9, V10, V11

## `src/core/lang/markdown/renderers/image.ts`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** W261003S6BQ-REQ2@R1
- **Responsibilities:** Image widget or text placeholder.
- **Affected Callers/Consumers:** registry; `paintImage`
- **Construction/Wiring:** `builtinRenderers`
- **Dependencies:** `ctx.resolve`, `ctx.image`, `ctx.images`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `imageRenderer` | None — new symbol | below | registry |

**Existing Shape:** None — new file or symbol

```ts
None
```

No image rendering exists.

**Proposed Shape:**

```ts
export const imageRenderer: BlockRenderer = (block, _v, { ctx }) => {
  const { target, alt } = embedLink(block);
  const path = ctx.resolve(target);
  const name = alt ?? basename(target);
  if (ctx.images === "off" || path === undefined)
    return [{ kind: "replace", range: wholeBlock(block), block: true, spans: [{ text: `[image: ${name}]`, style: "imagePlaceholder" }] }];
  const size = ctx.image(path);
  return [{ kind: "replace", range: wholeBlock(block), block: true,
            widget: { type: "image", data: { path, name }, rows: size === "unknown" ? 1 : size.rows } }];
};
```

With images off or an unresolved target the renderer emits the placeholder text directly, so that tier needs no painter. Otherwise it reserves one row until the size is known, then the rows that `ctx.image` computed for this window's width.

- **Invariants:**
  - The renderer never decodes.
- **Verification Coverage:** S8 — V17, V18

## `src/core/lang/markdown/file-type.ts`

- **Change:** Modify
- **Decisions:** DES1
- **Requirements:** W261003S6BQ-REQ6@R1
- **Responsibilities:** Declare the three Markdown views.
- **Affected Callers/Consumers:** `EditorView.layoutFrame`, `cycleView`, `defaultView`
- **Construction/Wiring:** registered in `registries()` as before
- **Dependencies:** `livePreview`, `PreviewCtx`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `markdownFileType.views` | `[{ id: "source", decorations: [] }]` (`file-type.ts:10`) | `[live, source, reading]` | `EditorView`, commands |

**Existing Shape:** `src/core/lang/markdown/file-type.ts:6-13`

```ts
export const markdownFileType: FileType<Doc> = {
  id: "markdown",
  match: { extensions: [".md"] },
  editor: "text",
  views: [{ id: "source", decorations: [] }],
  highlighter: lowlightHighlighter("markdown"),
  analyze: parseDoc,
};
```

Markdown has one `source` view, so every note paints as highlighted source.

**Proposed Shape:**

```ts
const asInput = (view: "live" | "reading") => (doc: Doc, ctx: PreviewCtx): MarkdownViewInput => ({ doc, view, ctx });
export const markdownFileType: FileType<Doc> = {
  id: "markdown", match: { extensions: [".md"] }, editor: "text",
  views: [
    { id: "live", decorations: [livePreview], input: asInput("live") },
    { id: "source", decorations: [] },
    { id: "reading", readOnly: true, decorations: [livePreview], input: asInput("reading") },
  ],
  highlighter: lowlightHighlighter("markdown"),
  analyze: parseDoc,
};
```

`live` is first, so it is the default. Both rendered views use the same provider and differ only in the `view` field of the input; `reading` is `readOnly`. `source` keeps the PH1 path. The `FileType` and `ViewSpec` types are unchanged (`registry.ts:9-14`).

- **Invariants:**
  - `source` never lists `livePreview`.
- **Verification Coverage:** S1, S2 — V1, V2, V4

## `src/core/lang/markdown/html.ts`

- **Change:** Add
- **Decisions:** DES9
- **Requirements:** W261003S6BQ-REQ8@R1, W261003S6BQ-REQ1@R1
- **Responsibilities:** Pure, escaped HTML for the preview.
- **Affected Callers/Consumers:** `src/preview/server.ts` `/render`
- **Construction/Wiring:** None — called per request
- **Dependencies:** `blockNode`, `renderKey`, `HtmlCtx`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `HtmlCtx`, `renderHtml`, `escapeHtml` | None — new symbol | below | server |

**Existing Shape:** None — new file or symbol

```ts
None
```

No HTML output exists.

**Proposed Shape:**

```ts
export type HtmlCtx = {
  href(target: string): string | undefined;
  asset(target: string): string | undefined;
  embed(path: string): { doc: Doc; text: TextBuffer } | undefined;
};
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITY[c] ?? c);
export function renderHtml(doc: Doc, text: TextBuffer, ctx: HtmlCtx, depth = 0): string {
  return doc.blocks.map((b) =>
    `<section data-line="${b.startLine}" data-hash="${escapeHtml(b.hash)}">${blockHtml(b, doc, text, ctx, depth)}</section>`).join("");
}
```

`renderHtml` walks every block (the browser shows the whole note), wraps each in a `section` carrying its first line and hash, and serializes the block's mdast with handlers for CommonMark, GFM, math (inline `<span class="math" data-tex>` and display `<div class="math" data-tex>`, with the escaped TeX also as text content), and the Obsidian nodes (`wikiLink`, `embed`, `highlight`, `tag`, `comment` dropped, `inlineFootnote`, callouts as `<aside class="callout" data-type>`). Every text node and attribute goes through `escapeHtml`, and raw HTML nodes are emitted as escaped text, so note content can never inject script into a page that can read `/file/*`. Mermaid fences become `<pre class="mermaid">` with escaped source; task checkboxes are `disabled`. Embeds recurse one level through `ctx.embed`. The page's script turns math and Mermaid elements into KaTeX and SVG after each swap; because the fragment already carries the escaped source, a render error simply leaves it in place.

- **Invariants:**
  - No unescaped note text in the output.
  - `depth > 0` renders embeds as links.
- **Verification Coverage:** S10 — V20, V21

## `src/core/state/view-context.ts`

- **Change:** Add
- **Decisions:** DES1
- **Requirements:** W261003S6BQ-REQ6@R1
- **Responsibilities:** Registry of per-file-type context builders.
- **Affected Callers/Consumers:** `EditorView.layoutFrame`; `registries()`; `testRegistries`
- **Construction/Wiring:** `Registries.viewContexts`
- **Dependencies:** `AppState`, `WindowId`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ViewHost`, `ViewContextBuilder`, `ViewContextRegistry` | None — new symbol | below | `EditorView`, `markdown-view.ts` |

**Existing Shape:** None — new file or symbol

```ts
None
```

`ViewSpec.input` takes `(analysis, ctx)` but no code builds a `ctx` (`registry.ts:13`).

**Proposed Shape:**

```ts
export type ViewHost = {
  width: number;
  rows: number;
  imageSize(path: string): { width: number; height: number } | undefined;
  cellAspect: number;
};
export type ViewContextBuilder = (s: AppState, windowId: WindowId, host: ViewHost) => unknown;
export class ViewContextRegistry {
  private readonly builders = new Map<string, ViewContextBuilder>();
  register(fileTypeId: string, b: ViewContextBuilder): void;   // throws on a duplicate id
  build(fileTypeId: string, s: AppState, windowId: WindowId, host: ViewHost): unknown; // undefined without a builder
}
```

The registry mirrors `FileTypeRegistry`: one builder per file type, duplicates rejected at startup. `ViewHost` holds only language-neutral facts the UI owns — the window's text width and rows, image sizes from the UI cache, and the cell aspect ratio — so `EditorView` stays generic.

- **Invariants:**
  - Builders are pure functions of their arguments.
- **Verification Coverage:** S16 — V38, V41

## `src/core/state/markdown-view.ts`

- **Change:** Add
- **Decisions:** DES1, DES4, DES5, DES7
- **Requirements:** W261003S6BQ-REQ6@R1, W261003S6BQ-REQ4@R1, W261003S6BQ-REQ5@R1, W261003S6BQ-REQ2@R1
- **Responsibilities:** Build `PreviewCtx` from state.
- **Affected Callers/Consumers:** `ViewContextRegistry` (registered for `markdown`)
- **Construction/Wiring:** `registries()` and `testRegistries()`
- **Dependencies:** `resolveLink` (`src/core/features/links/resolve.ts`), `bufferForPath`, the laid-out buffer's `embeds`, `s.config.preview`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `markdownViewContext` | None — new symbol | `ViewContextBuilder` returning `PreviewCtx` | registry |

**Existing Shape:** None — new file or symbol

```ts
None
```

Link resolution for navigation already lives in `src/core/state/link-commands.ts` through `resolveLink`; this builder reuses it.

**Proposed Shape:**

```ts
export const markdownViewContext: ViewContextBuilder = (s, windowId, host): PreviewCtx => {
  const own = s.buffers[s.windows.byId[windowId]?.content.bufferId ?? -1];
  const from = own?.path ?? "";
  const resolve = (t: string) => resolveLink(s.index.ix, from, t)?.path;
  const { embedMaxRows, images } = s.config.preview;
  return {
    resolve, isResolved: (t) => resolve(t) !== undefined,
    embed: (p) => { const b = bufferForPath(s, p);
      return b?.analysis ? { doc: b.analysis as Doc, text: b.text }
           : own?.embeds?.refused.includes(p) ? "missing"
           : own?.embeds?.requested.includes(p) ? "loading" : "missing"; },
    image: (p) => { const px = host.imageSize(p); return px ? { rows: imageRows(px, host) } : "unknown"; },
    folds: new Set(s.windows.byId[windowId]?.content.folds ?? []),
    embedMaxRows, images,
  };
};
```

The builder answers every `PreviewCtx` question from state plus the host; embed states come from the laid-out buffer's own `embeds`, so two notes embedding the same target each see their own request. `imageRows` scales the image to the window width with `cellAspect`, caps it at 80% of the window rows (UI design, Editor window responsive rule), and never returns less than one.

- **Invariants:**
  - No mutation of state.
- **Verification Coverage:** S5, S6, S8 — V9, V13, V17

## `src/core/state/embeds.ts`

- **Change:** Add
- **Decisions:** DES4
- **Requirements:** W261003S6BQ-REQ4@R1
- **Responsibilities:** Keep embed targets loaded exactly while a listed note embeds them.
- **Affected Callers/Consumers:** `createUpdate` wrapper; `onFileLoaded`, `onFileRefused` (through `settleEmbedRead`)
- **Construction/Wiring:** called in `createUpdate`
- **Dependencies:** `Doc.scan.links` (kind `embed`), `resolveLink`, `IMAGE_EXTENSIONS`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `embedTargets`, `syncEmbeds`, `settleEmbedRead` | None — new symbol | below | `update.ts`, `buffers.ts` |

**Existing Shape:** `src/core/state/update.ts:104-120`

```ts
return (state, action) => {
  try {
    const r = followShownNote(state, step(state, action));
    return action.type !== "stateLoaded" && sessionChanged(state, r.state)
      ? { state: r.state, effects: [...r.effects, { kind: "startTimer", id: "saveState", ms: SAVE_STATE_MS }] }
      : r;
  } catch (e) { return { state: notifyError(state, e), effects: [] }; }
};
```

The wrapper already post-processes every step (`followShownNote`, the session-save debounce), which makes it the one place to keep derived embed state consistent.

**Proposed Shape:**

```ts
/** Note paths one listed Markdown buffer embeds (images and other extensions excluded). */
export function embedTargets(s: AppState, b: BufferState): Set<string>;
export function syncEmbeds(prev: AppState, r: Result): Result {
  if (prev.buffers === r.state.buffers && prev.index.ix === r.state.index.ix) return r;
  const inFlight = new Set(listedBuffers(r.state).flatMap((b) => b.embeds?.requested ?? []));
  const reads = new Set<string>();
  const wanted = new Set<string>();
  const buffers = mapListedMarkdown(r.state.buffers, (b) => {
    const targets = embedTargets(r.state, b);
    targets.forEach((p) => wanted.add(p));
    const keep = (ps: string[] = []) => ps.filter((p) => targets.has(p));
    const requested = keep(b.embeds?.requested), refused = keep(b.embeds?.refused);
    const fresh = [...targets].filter((p) => !bufferForPath(r.state, p) && !requested.includes(p) && !refused.includes(p));
    fresh.filter((p) => !inFlight.has(p)).forEach((p) => reads.add(p));
    return sameEmbeds(b, requested, refused, fresh) ? b : { ...b, embeds: { requested: [...requested, ...fresh], refused } };
  });
  return { state: { ...r.state, buffers: dropUnlisted(buffers, (u) => !wanted.has(u.path)) },
           effects: [...r.effects, ...[...reads].map((path) => ({ kind: "read", path }) as const)] };
}
/** fileLoaded / fileRefused: clear the request on every listed buffer that made it; refusal records it. */
export function settleEmbedRead(s: AppState, path: string, refused: boolean): AppState;
```

`syncEmbeds` does nothing unless buffers or the index changed. Otherwise it walks each listed Markdown buffer: targets that are not open and not yet in that buffer's `requested` or `refused` are added to its `requested`, and a `read` is emitted only for paths no buffer already has in flight, so two notes embedding one target share one read. Requests and refusals for targets the note no longer embeds are dropped, and unlisted buffers no listed note embeds are removed. A buffer object is replaced only when its `embeds` changed, so unchanged buffers keep their identity. `settleEmbedRead` runs in `onFileLoaded` (removing the path from every requester's `requested`) and in `onFileRefused` (moving it to `refused`); because a refused target stays in `refused`, the next keystroke's `syncEmbeds` does not request it again.

- **Invariants:**
  - At most one outstanding `read` per path across all buffers.
  - A refused target is not requested again while its embedding note keeps it.
  - An unlisted buffer exists only while wanted.
- **Verification Coverage:** S5 — V9, V11, V12, V49

## `src/core/state/types.ts`

- **Change:** Modify
- **Decisions:** DES4, DES5, DES11
- **Requirements:** W261003S6BQ-REQ4@R1, W261003S6BQ-REQ5@R1, W261003S6BQ-REQ8@R1
- **Responsibilities:** State, action, and effect shapes.
- **Affected Callers/Consumers:** `update.ts` exhaustive switch; `effects.ts` exhaustive switch; `init.ts`
- **Construction/Wiring:** None — types
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `BufferState` | `:67-86`, no `listed` | `+ listed?: false; + embeds?: { requested: string[]; refused: string[] }` | buffers, embeds, markdown-view, session, bufferline, picker, commands |
| `WindowState` | `:88-91` `content: { editor: "text"; bufferId; cursor; scroll }` | `+ folds?: number[]` | markdown-commands, markdown-view |
| `AppState` | `:233-272` | `+ preview: PreviewState` | preview, status, init |
| `Action` | `:274-319` | `+ previewStarted, previewStopped, previewFailed, openUrlFailed` | `update.ts` |
| `Effect` | `:321-345` | `+ startPreview, stopPreview, openUrl` | `effects.ts` |

**Existing Shape:** `src/core/state/types.ts:88-91`

```ts
export type WindowState = {
  id: WindowId;
  content: { editor: "text"; bufferId: BufferId; cursor: Pos; scroll: number };
};
```

Window content carries only the buffer, cursor, and top line.

**Proposed Shape:**

```ts
export type WindowState = {
  id: WindowId;
  content: { editor: "text"; bufferId: BufferId; cursor: Pos; scroll: number; folds?: number[] };
};
export type PreviewState = { status: "off" } | { status: "starting" } | { status: "on"; port: number };
// AppState: preview: PreviewState;
// BufferState: listed?: false; embeds?: { requested: string[]; refused: string[] };
// Action: | { type: "previewStarted"; port: number } | { type: "previewStopped" }
//         | { type: "previewFailed"; reason: string } | { type: "openUrlFailed"; url: string; reason: string }
// Effect: | { kind: "startPreview" } | { kind: "stopPreview" } | { kind: "openUrl"; url: string }
```

All additions are optional or default-initialized, so existing reducers and tests keep compiling; the exhaustive `never` checks in `createUpdate` and `createEffectRunner` force the new cases to be handled. `preview` is the only new top-level field; `listed` and `embeds` are buffer fields.

- **Invariants:**
  - `listed` is never `true`; absence means listed.
- **Verification Coverage:** S5, S6, S12 — V12, V13, V31, V47

## `src/core/state/update.ts`

- **Change:** Modify
- **Decisions:** DES1, DES4, DES11
- **Requirements:** W261003S6BQ-REQ6@R1, W261003S6BQ-REQ4@R1, W261003S6BQ-REQ8@R1
- **Responsibilities:** Registries and dispatch.
- **Affected Callers/Consumers:** `src/app/main.ts` `registries()`, `test/support/state.ts`, `EditorView`
- **Construction/Wiring:** `Registries.viewContexts`
- **Dependencies:** `view-context.ts`, `embeds.ts`, `preview.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Registries` | `:44-52` | `+ viewContexts: ViewContextRegistry` | main, tests, `EditorView` |
| `createUpdate` | `:59-120` | four new cases; wrapper `syncEmbeds(state, followShownNote(...))` | store |

**Existing Shape:** `src/core/state/update.ts:44-52`

```ts
export type Registries = {
  fileTypes: FileTypeRegistry;
  editorKinds: EditorKindRegistry;
  commands: CommandRegistry<CommandContext, CommandResult>;
  bindings: readonly Binding[];
  groups: Readonly<Record<string, string>>;
};
```

The registries the reducer and views share.

**Proposed Shape:**

```ts
export type Registries = { /* … as before … */ viewContexts: ViewContextRegistry };
// step: case "previewStarted": return onPreviewStarted(state, action);
//       case "previewStopped": return onPreviewStopped(state);
//       case "previewFailed":  return onPreviewFailed(state, action);
//       case "openUrlFailed":  return onOpenUrlFailed(state, action);
// wrapper: const r = syncEmbeds(state, followShownNote(state, step(state, action)));
```

The view-context registry travels with the others to every view through `ViewDeps.reg`. The wrapper runs `syncEmbeds` after `followShownNote` and before the session check, so evictions count as session changes only through listed buffers (unlisted ones are not in the snapshot).

- **Invariants:**
  - A throwing step still keeps the previous state.
- **Verification Coverage:** S5, S12 — V11, V31

## `src/core/state/buffers.ts`

- **Change:** Modify
- **Decisions:** DES1, DES4
- **Requirements:** W261003S6BQ-REQ6@R1, W261003S6BQ-REQ4@R1
- **Responsibilities:** Default view; unlisted opening; listing on show.
- **Affected Callers/Consumers:** `onFileLoaded` callers (`update.ts`), `showBuffer` callers (open, `:bn`, jumps, links)
- **Construction/Wiring:** None
- **Dependencies:** `AppConfig.preview`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `onFileLoaded` | `:318-375`, `view: ft.views[0]?.id ?? "source"` (`:337`), always shows | `view: defaultView(ft, s.config)`; when a listed buffer's `embeds.requested` has the path and no window waits, add `listed: false`, do not show, and `settleEmbedRead` | update |
| `onFileRefused` | `:376-385`, error notice unless a restore waits | when a listed buffer requested the path and no restore or navigation waits, `settleEmbedRead(s, path, true)` with no notice; otherwise unchanged | update |
| `showBuffer` | `:282-298` | removes `listed` from the shown buffer; resets the window's `folds` when the buffer changes | open paths |
| `defaultView` | None — new symbol | `ft.views.some(v => v.id === cfg.preview.mode) ? cfg.preview.mode : ft.views[0]?.id ?? "source"` | `onFileLoaded` |

**Existing Shape:** `src/core/state/buffers.ts:333-338`

```ts
  const b: BufferState = withAnalysis(
    {
      id,
      path: a.path,
      fileType: ft.id,
      view: ft.views[0]?.id ?? "source",
```

A new buffer always starts in its file type's first view.

**Proposed Shape:**

```ts
export const defaultView = (ft: FileType, cfg: AppConfig): string =>
  ft.views.some((v) => v.id === cfg.preview.mode) ? cfg.preview.mode : (ft.views[0]?.id ?? "source");
// embedRequested(s, p) = some listed buffer's embeds.requested has p
// onFileLoaded:  const embedOnlyRead = embedRequested(s, a.path) && !awaitsRestore(s, a.path);
//                b = { …, view: defaultView(ft, s.config), ...(embedOnlyRead ? { listed: false } : {}) };
//                embedOnlyRead → none(settleEmbedRead(added, a.path, false))   (not shown, recent untouched)
// onFileRefused: embedRequested(s, a.path) && !awaitsRestore(s, a.path) → none(settleEmbedRead(s, a.path, true))
```

The configured mode applies to any file type that has a view with that id, so code files stay in `source` without a Markdown special case. An embed read neither shows the buffer nor touches recent files, and a refused embed read shows no error notice because the widget already shows the unresolved state. Restored windows keep using `onFileLoaded`, so they get the default view as before.

- **Invariants:**
  - A buffer shown in any window is listed.
- **Verification Coverage:** S1, S5 — V1, V12

## `src/core/state/markdown-commands.ts`

- **Change:** Add
- **Decisions:** DES5, DES8, DES11
- **Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ5@R1, W261003S6BQ-REQ6@R1, W261003S6BQ-REQ8@R1
- **Responsibilities:** Markdown-only commands and their bindings.
- **Affected Callers/Consumers:** `registries()`, `testRegistries()`; `EX_ALIASES`
- **Construction/Wiring:** `for (const c of markdownCommands) commands.register(c)`; `bindings: [...defaultBindings, ...linkBindings, ...markdownBindings]`
- **Dependencies:** `followLink` (exported from `link-commands.ts`), `applyBufferEdits`, `startPreview`, `stopPreview`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `markdownCommands`, `markdownBindings`, `cycleView`, `toggleTask`, `toggleFold`, `noteEnter` | None — new symbol | below | registries |

**Existing Shape:** `src/core/state/link-commands.ts:161-171`

```ts
const md = (mode: Mode) => ({ mode, filetype: "markdown" }) as const;
export const linkBindings: readonly Binding[] = [
  { scope: md("normal"), seq: "gd", id: "link.follow" },
  { scope: md("normal"), seq: "<CR>", id: "link.follow" },
  …
];
```

Link commands already show the pattern: a command table limited to `markdown` and bindings in the `markdown` scope.

**Proposed Shape:**

```ts
export const markdownCommands: readonly AppCommand[] = [
  { id: "view.cycle", title: "Cycle live / source / reading", filetypes: ["markdown"], run: cycleView },
  { id: "task.toggle", title: "Toggle task", filetypes: ["markdown"], run: toggleTask },
  { id: "fold.toggle", title: "Fold or expand", filetypes: ["markdown"], run: toggleFold },
  { id: "note.enter", title: "Toggle task or follow link", filetypes: ["markdown"], run: noteEnter },
  { id: "preview.start", title: "Preview in browser", filetypes: ["markdown"], run: startPreview },
  { id: "preview.stop", title: "Stop browser preview", run: stopPreview },
];
export const markdownBindings: readonly Binding[] = [
  { scope: md("normal"), seq: "<leader>m", id: "view.cycle" },
  { scope: md("normal"), seq: "<leader>x", id: "task.toggle" },
  { scope: md("normal"), seq: "za", id: "fold.toggle" },
  { scope: md("normal"), seq: "<CR>", id: "note.enter" },
];
```

`cycleView` steps the active buffer through `live → source → reading` and sets the message `mode: <view>` (`(read-only)` for reading). `toggleTask` flips `[ ]`/`[x]` on the cursor line as one `applyBufferEdits` change, so it is one undo step and schedules autosave like any edit; a non-task line shows `no checkbox on this line`. `toggleFold` finds the block at the cursor; on a callout or embed it adds or removes the block id in the active window's `folds`, else shows `nothing to fold here`. `noteEnter` toggles a task when the cursor line is one and otherwise calls `followLink`. `preview.stop` has no file-type limit, so `:PreviewStop` works from a code file. The `<CR>` entry moves out of `linkBindings`.

- **Invariants:**
  - Code files get none of these bindings; running a Markdown command there shows `not available for <type> files` through `runCommand`.
- **Verification Coverage:** S6, S9 — V2, V3, V13, V37

## `src/core/state/keys.ts`

- **Change:** Modify
- **Decisions:** DES8
- **Requirements:** W261003S6BQ-REQ6@R1
- **Responsibilities:** Refuse edits in read-only views.
- **Affected Callers/Consumers:** `handleKeyAction`, `typeKeys`
- **Construction/Wiring:** None
- **Dependencies:** `reg.fileTypes`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `runVim` | `:205-243` applies every engine result | discards a result that changes text or enters insert mode when the buffer's view is `readOnly` | key handling |

**Existing Shape:** `src/core/state/keys.ts:216-226`

```ts
  const r = handleKey(
    { text: b.text, cursor: w.content.cursor, undo: b.undo, registers, vim },
    key,
    env,
  );
  const { line } = r.s.cursor;
  const top = w.content.scroll;
  const scroll =
    line < top ? line : line >= top + env.rows ? line - env.rows + 1 : top;
  const edited = setBuffer(s, b.id, { text: r.s.text, undo: r.s.undo }, reg);
```

The engine result is applied unconditionally.

**Proposed Shape:**

```ts
export const READ_ONLY_HINT = "reading mode — <leader>m to edit";
const ro = reg.fileTypes.get(b.fileType)?.views.find((v) => v.id === b.view)?.readOnly === true;
if (ro && (r.s.text !== b.text || r.s.vim.mode === "insert"))
  return none(setMessage(s, READ_ONLY_HINT));
```

Motions change neither text nor mode, so they pass; any edit, paste, or entry into Insert is dropped whole, including its register changes. The check uses the existing but unused `ViewSpec.readOnly`, so a future read-only view of any file type gets the same behaviour.

- **Invariants:**
  - A read-only view never changes buffer text through keys.
- **Verification Coverage:** S9 — V37

## `src/core/state/preview.ts`

- **Change:** Add
- **Decisions:** DES9, DES11
- **Requirements:** W261003S6BQ-REQ8@R1
- **Responsibilities:** Preview command reducers, result handlers, follow selector, HTML context.
- **Affected Callers/Consumers:** `markdown-commands.ts`, `update.ts`, `src/preview/server.ts`
- **Construction/Wiring:** None
- **Dependencies:** `resolveLink`, `bufferForPath`, `Doc`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `startPreview`, `stopPreview`, `onPreviewStarted`, `onPreviewStopped`, `onPreviewFailed`, `onOpenUrlFailed`, `followTarget`, `htmlCtx`, `previewUrl` | None — new symbol | below | commands, update, server |

**Existing Shape:** None — new file or symbol

```ts
None
```

No preview state exists.

**Proposed Shape:**

```ts
export const previewUrl = (port: number, path?: string) =>
  `http://127.0.0.1:${port}/${path === undefined ? "" : path.split("/").map(encodeURIComponent).join("/")}`;
export function startPreview(c: CommandContext): Result {
  const p = c.state.preview;
  if (p.status === "on") return { state: c.state, effects: [{ kind: "openUrl", url: previewUrl(p.port, activeBuffer(c.state)?.path) }] };
  if (p.status === "starting") return none(c.state);
  return { state: { ...c.state, preview: { status: "starting" } }, effects: [{ kind: "startPreview" }] };
}
export function stopPreview(c: CommandContext): Result; // off → message "preview is not running"; else [stopPreview]
export function onPreviewStarted(s: AppState, a: { port: number }): Result; // on(port) + [openUrl(previewUrl)]
export function onOpenUrlFailed(s: AppState, a: { url: string }): Result;   // info toast "could not open a browser — <url>"
export type FollowTarget = { path: string; version: number; line: number; doc: Doc; text: TextBuffer };
export function followTarget(s: AppState): FollowTarget | undefined; // active listed markdown buffer, else undefined
export function htmlCtx(s: AppState, from: string, load: (path: string) => { doc: Doc; text: TextBuffer } | undefined): HtmlCtx;
```

`startPreview` is idempotent: running it while on only reopens the browser, and while starting does nothing. `onPreviewStarted` records the port and launches the browser at the current note. `followTarget` is the single definition of "the note the page follows"; the server keeps the last non-`undefined` answer, which is what leaves the page on the last note while a code file is active. `htmlCtx` builds `HtmlCtx` from the index and a loader the server supplies.

- **Invariants:**
  - One server per process; the reducer never starts a second.
- **Verification Coverage:** S12 — V29, V31, V32

## `src/core/state/{status,session,picker,commands,link-commands,init}.ts`

- **Change:** Modify
- **Decisions:** DES4, DES8, DES11
- **Requirements:** W261003S6BQ-REQ4@R1, W261003S6BQ-REQ8@R1, W261003S6BQ-REQ1@R1
- **Responsibilities:** Filter unlisted buffers; preview segment; ex aliases; initial preview state.
- **Affected Callers/Consumers:** statusline, session save, pickers, `:bn`/`:bp`, ex line
- **Construction/Wiring:** None
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `StatusSegments`, `statusSegments` | `status.ts:9-74`, no preview | `+ preview: string` = `preview :<port>` / `preview off` (`preview …` while starting) | `Statusline` |
| `snapshotSession` | `session.ts:68-95` maps every buffer | filters `listed === false` | session save |
| `openPaths` | `picker.ts:76` every buffer | listed only | pickers |
| `cycleBuffer` | `commands.ts:248-260` every buffer | listed only | `:bn`, `:bp` |
| `EX_ALIASES` | `commands.ts:49-74` | `+ Preview: "preview.start", PreviewStop: "preview.stop"` | ex line |
| `linkBindings`, `followLink` | `link-commands.ts:163-171`; `followLink` module-private | `<CR>` entry removed; `followLink` exported | `markdown-commands.ts` |
| `initialState` | `init.ts` | `+ preview: { status: "off" }` | store |

**Existing Shape:** `src/core/state/session.ts:88-93`

```ts
    buffers: Object.values(s.buffers)
      .sort((a, b) => a.id - b.id)
      .map((b) => ({ path: b.path, view: b.view })),
```

Every buffer is written to the session today.

**Proposed Shape:**

```ts
    buffers: Object.values(s.buffers)
      .filter((b) => b.listed !== false)
      .sort((a, b) => a.id - b.id)
      .map((b) => ({ path: b.path, view: b.view })),
```

The same `listed !== false` filter applies in the bufferline, `openPaths`, and `cycleBuffer`, so an embed target is invisible everywhere a user sees "open buffers". The persisted `view` keeps being written and ignored, so `state.json` stays version 1.

- **Invariants:**
  - `state.json` never names an unlisted buffer.
- **Verification Coverage:** S5, S17 — V12, V36

## `src/core/config/schema.ts`

- **Change:** Modify
- **Decisions:** DES13
- **Requirements:** W261003S6BQ-REQ4@R1, W261003S6BQ-REQ1@R1
- **Responsibilities:** `preview` options.
- **Affected Callers/Consumers:** `defaultView`, `markdownViewContext`, `paintImage`
- **Construction/Wiring:** `parseConfig` unchanged
- **Dependencies:** zod

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ConfigSchema` | `:10-40`, no `preview` | `+ preview` strict object | config consumers |

**Existing Shape:** `src/core/config/schema.ts:27-33`

```ts
  editor: z
    .strictObject({
      tabWidth: z.number().int().min(1).max(16).default(8),
      wrap: z.boolean().default(true),
      relativeNumbers: z.boolean().default(true),
    })
    .prefault({}),
```

Sections are strict objects with defaults and `prefault({})`, so an absent section gets its defaults.

**Proposed Shape:**

```ts
  preview: z
    .strictObject({
      mode: z.enum(["live", "source", "reading"]).default("live"),
      embedMaxRows: z.number().int().min(1).max(200).default(10),
      images: z.enum(["auto", "blocks", "off"]).default("auto"),
    })
    .prefault({}),
```

The section follows the `editor` pattern exactly, so unknown keys and out-of-range values become line-numbered errors through the existing `parseConfig`.

- **Invariants:**
  - `defaults.preview` equals `{ mode: "live", embedMaxRows: 10, images: "auto" }`.
- **Verification Coverage:** S14 — V39

## `src/ui/editors/text-view.ts`

- **Change:** Modify
- **Decisions:** DES1, DES6
- **Requirements:** W261003S6BQ-REQ5@R1, W261003S6BQ-REQ6@R1, W261003S6BQ-REQ1@R1
- **Responsibilities:** One layout per frame with view input; cursor fit; sign column; widget rows.
- **Affected Callers/Consumers:** `WindowTree` (shows views), base view (DI4 extends `EditorView`)
- **Construction/Wiring:** `registerEditorView("text", …)` unchanged
- **Dependencies:** `ViewContextRegistry`, `widgetPainters`, `ImageCache` (via `deps.images`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `EditorView.show` | `:229-299` computes top line from wrapped heights; no layout | calls `layoutFrame`, which lays out and fits the cursor; caches `lines` | `renderSelf` |
| `EditorView.layout` → `layoutFrame` | `:389-431` lays out with `b.analysis` and empty folds | builds `ViewHost`, ctx, input; returns `RenderLine[]` | `show` |
| `fitCursor` | None — new symbol | advances `topLine` until the cursor row fits | `show` |
| `renderSelf` | `:311-387` paints spans, 1 row per wrapped row | paints sign column, widget rows via painters, spans | renderer |
| `gutterWidth` | `:31-32` numbers only | `+1` sign column | `show`, `renderSelf` |

**Existing Shape:** `src/ui/editors/text-view.ts:405-419`

```ts
      const ft = this.deps.reg.fileTypes.get(b.fileType);
      const spec = ft?.views.find((v) => v.id === b.view) ?? ft?.views[0];
      const selection =
        this.windowId === s.windows.active ? selectionOf(s, b.text) : undefined;
      return layoutText(
        view,
        [
          highlightMarks(ft?.highlighter),
          ...(spec?.decorations ?? []),
          searchMarks(s.vim.search),
          selectionMarks(selection),
        ],
        b.analysis,
      );
```

The view's providers receive the raw analysis, and layout happens in `renderSelf` after `show` has already chosen the top line from line heights alone.

**Proposed Shape:**

```ts
private layoutFrame(s: AppState, b: BufferState, top: number, rows: number, width: number): RenderLine[] {
  const ft = this.deps.reg.fileTypes.get(b.fileType);
  const spec = ft?.views.find((v) => v.id === b.view) ?? ft?.views[0];
  const host: ViewHost = { width, rows, imageSize: (p) => this.deps.images.size(p), cellAspect: this.deps.images.cellAspect() };
  const ctx = this.deps.reg.viewContexts.build(b.fileType, s, this.windowId, host);
  const input = spec?.input ? spec.input(b.analysis, ctx) : b.analysis;
  const view: TextView = { buf: b.text, width, topRow: top, rows, cursor, folds: EMPTY, visible: { from: top, to: top + rows }, … };
  return layoutText(view, [highlightMarks(ft?.highlighter), ...(spec?.decorations ?? []), searchMarks(…), selectionMarks(…)], input);
}
private fitCursor(s: AppState, b: BufferState, line: number, rows: number, width: number): RenderLine[] {
  for (let tries = 0; ; tries++) {
    const lines = this.layoutFrame(s, b, this.topLine, rows, width);
    if (rowOfLine(lines, line, width) < rows || this.topLine >= line || tries > rows) return lines;
    this.topLine++;
  }
}
```

`layoutFrame` is the old `layout` plus the view input: it builds a language-neutral `ViewHost`, asks the registry for the file type's context, and passes `spec.input(analysis, ctx)` when the view has an input hook. `TextView.folds` stays an empty set because Markdown hides folded lines with block `replace` decorations. `fitCursor` replaces the height arithmetic in `show`: starting from the core's top line, it lays out and, while the cursor's row (counting widget rows and wrapped rows) falls outside the window, advances the top line by one and lays out again. The loop is bounded by the window height and usually runs once. `renderSelf` paints the cached lines: the gutter gains one sign cell (`▕`, `⚠`), a widget row hands `widget.rows` rows to `widgetPainters.get(type)`, and other rows paint spans as before. The layout `catch` stays.

- **Invariants:**
  - `layoutText` is called only with `visible` inside the window.
  - No Markdown import or identifier in this file.
- **Verification Coverage:** S7, S16 — V14, V15, V16, V38

## `src/ui/widgets/registry.ts`, `embed.ts`, `rule.ts`

- **Change:** Add
- **Decisions:** DES6, DES4
- **Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ4@R1
- **Responsibilities:** Painter registry (G4) and the span-row and rule painters.
- **Affected Callers/Consumers:** `EditorView.renderSelf`; DI4 `base` painter
- **Construction/Wiring:** `registerWidgetPainter` in `src/app/main.ts` and `test/support/ui.ts`
- **Dependencies:** `paintLine`, `Theme`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PaintTarget`, `WidgetPainter`, `widgetPainters`, `registerWidgetPainter`, `paintEmbed`, `paintRule` | None — new symbol | below | `EditorView` |

**Existing Shape:** `src/ui/editors/registry.ts:6-17`

```ts
export const editorViews = new Map<string, (ctx: RenderContext, deps: ViewDeps) => EditorView>();
export function registerEditorView(kind: string, create: (ctx: RenderContext, deps: ViewDeps) => EditorView): void {
  editorViews.set(kind, create);
}
```

UI registries are module-level maps where a later registration replaces an earlier one.

**Proposed Shape:**

```ts
export type PaintTarget = { buf: OptimizedBuffer; theme: Theme; x: number; y: number; width: number; rows: number; deps: ViewDeps; state: AppState };
export type WidgetPainter = (t: PaintTarget, w: Widget) => void;
export const widgetPainters = new Map<string, WidgetPainter>();
export function registerWidgetPainter(type: string, p: WidgetPainter): void { widgetPainters.set(type, p); }
export const paintEmbed: WidgetPainter;  // title row, Span[][] rows via paintLine, "… N more lines", loading…, unresolved style
export const paintRule: WidgetPainter;   // ─ across the width in the rule token
```

The registry follows `editorViews`. `paintEmbed` is registered for both `embed` and `text` widgets because both carry span rows computed in core. A widget type without a painter gets a dim `[<type>]` row from `EditorView`, so a missing DI4 painter cannot crash a frame.

- **Invariants:**
  - Painters write only inside their target.
- **Verification Coverage:** S5, S7, S18 — V10, V16, V41

## `src/ui/images.ts` and `src/ui/widgets/image.ts`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** W261003S6BQ-REQ2@R1
- **Responsibilities:** Tier decision, decoded-image LRU, image painting.
- **Affected Callers/Consumers:** `EditorView` (via `deps.images`), `paintImage`, `createShell`
- **Construction/Wiring:** `createShell` builds one `ImageCache` with `deps.loadImage` and `renderer.requestRender`
- **Dependencies:** `@opentui/core` `NativeImage`, `imageInfo`, `ImageError`, `resolveImageRenderProtocol`, `OptimizedBuffer.drawImage`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ImageTier`, `imageTier`, `ImageCache`, `paintImage` | None — new symbol | below | shell, painters |

**Existing Shape:** `node_modules/@opentui/core/renderables/Image.d.ts:14`, `buffer.d.ts:63`

```ts
export declare function resolveImageRenderProtocol(requested: ImageRenderProtocol, capabilities: TerminalCapabilities | null, hasResolution: boolean): Exclude<ImageRenderProtocol, "auto">;
drawImage(image: NativeImage, x: number, y: number, width: number, height: number, pixelWidth?: number, pixelHeight?: number, sourceX?: number, sourceY?: number, sourceWidth?: number, sourceHeight?: number, protocol?: ImageRenderProtocol): boolean;
```

OpenTUI exposes a pure protocol resolver and a buffer-level draw call that encodes kitty, sixel, or block output.

**Proposed Shape:**

```ts
export type ImageTier = "kitty" | "sixel" | "blocks" | "placeholder";
export function imageTier(images: "auto" | "blocks" | "off", caps: TerminalCapabilities | null, hasResolution: boolean): ImageTier {
  if (images === "off") return "placeholder";
  if (images === "blocks") return "blocks";
  return resolveImageRenderProtocol("auto", caps, hasResolution);
}
export class ImageCache {
  constructor(o: { load: (path: string) => Promise<Uint8Array>; repaint: () => void; limitBytes?: number /* 64 MiB */ });
  get(path: string): { image: NativeImage } | { failed: true } | undefined; // undefined starts a load
  size(path: string): { width: number; height: number } | undefined;
  cellAspect(): number;  // from renderer.resolution when known, else 0.5
}
export const paintImage: WidgetPainter = (t, w) => { /* tier → placeholder | cache.get → "◌ name" | drawImage(…, tier) */ };
```

`imageTier` is the whole tier policy in one pure function. `ImageCache.get` starts at most one load per path; when it finishes, it stores the decoded image (counting `width × height × 4` bytes), evicts least-recently-used images past 64 MiB with `dispose()`, and calls `repaint`, which is `renderer.requestRender`. `paintImage` reads capabilities from `t.deps` (injectable in tests through `MountOptions.capabilities`), paints `◌ name` while loading, `[image: name]` for a failed load (SVG has no decoder and fails as `unsupported-format`), and otherwise calls `drawImage` with the tier as `protocol`.

- **Invariants:**
  - At most 64 MiB of decoded pixels retained.
  - Only `src/ui` imports `@opentui/core`.
- **Verification Coverage:** S8 — V17, V18, V19, V40

## `src/ui/{shell,theme}.ts`, `src/ui/views/{statusline,bufferline}.ts`

- **Change:** Modify
- **Decisions:** DES2, DES4, DES6, DES7, DES11
- **Requirements:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ2@R1, W261003S6BQ-REQ4@R1, W261003S6BQ-REQ8@R1
- **Responsibilities:** Image dependency injection, style tokens, preview segment, listed tabs.
- **Affected Callers/Consumers:** `src/app/main.ts`, `test/support/ui.ts`
- **Construction/Wiring:** `createShell(renderer, { reg, now, loadImage })`
- **Dependencies:** `ImageCache`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ShellDeps` | `shell.ts:49-53` `{ reg, now }` | `+ loadImage: (path) => Promise<Uint8Array>; capabilities?: () => { caps; hasResolution }` | main, tests |
| `ViewDeps` | `shell.ts:56` | `+ images: ImageCache` | views |
| theme tokens | `theme.ts` table | `+ mdHeading1–4, mdBold, mdItalic, mdStrike, mdHighlight, mdCode, mdLink, linkUnresolved, mdTag, mdQuote, mdCallout<Type>, mdRule, mdMarker, mdFootnote, mdProperty, signReveal, signError, imagePlaceholder` per UDES3/UDES11 | renderers, painters |
| `Statusline` | `statusline.ts:77-78` view segment | `+ preview` segment after words, dropped first when narrow | shell |
| `Bufferline` | `bufferline.ts:41` every buffer | listed only | shell |

**Existing Shape:** `src/ui/shell.ts:49-56`

```ts
export type ShellDeps = {
  reg: Registries;
  now: () => number;
};
export type ViewDeps = ShellDeps & { dispatch: Store["dispatch"] };
```

Views get registries, a clock, and dispatch.

**Proposed Shape:**

```ts
export type ShellDeps = {
  reg: Registries;
  now: () => number;
  loadImage: (path: string) => Promise<Uint8Array>;
  /** Tests inject terminal graphics support; the renderer's own detection otherwise. */
  capabilities?: () => { caps: TerminalCapabilities | null; hasResolution: boolean };
};
export type ViewDeps = ShellDeps & { dispatch: Store["dispatch"]; images: ImageCache };
```

`createShell` builds one `ImageCache` with `loadImage` and `renderer.requestRender` and passes it to every view. `capabilities` defaults to `{ caps: renderer.capabilities, hasResolution: renderer.resolution !== null }`; tests override it, which is how V18 selects each tier in the test renderer.

- **Invariants:**
  - Theme tokens keep NO_COLOR attribute fallbacks like the existing table.
- **Verification Coverage:** S7, S8, S17 — V16, V18, V36

## `src/workspace/images.ts` and `src/workspace/system.ts`

- **Change:** Add / Modify
- **Decisions:** DES7, DES11
- **Requirements:** W261003S6BQ-REQ2@R1, W261003S6BQ-REQ8@R1
- **Responsibilities:** Contained image reads; browser launch.
- **Affected Callers/Consumers:** `src/app/main.ts` (injection), `src/app/effects.ts` (`openUrl`)
- **Construction/Wiring:** injected closures
- **Dependencies:** `node:fs/promises` `realpath`, `readFile`; `Bun.spawn`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `readImage` | None — new symbol | `(root, rel) => Promise<Uint8Array>`; rejects outside the workspace realpath or over 32 MiB | main |
| `openUrl` | None — new symbol (`system.ts` has `commandProvider` at `:17`) | `(url, platform, spawn?) => Promise<void>`; `open` on darwin, `xdg-open` otherwise; rejects on non-zero exit | effects |

**Existing Shape:** `src/workspace/system.ts:17-33`

```ts
export function commandProvider(name: string, copyArgv: string[], pasteArgv?: string[]): ClipboardProvider {
  const provider: ClipboardProvider = {
    name,
    async copy(text) {
      const p = Bun.spawn(copyArgv, { stdin: "pipe", stdout: "ignore", stderr: "ignore" });
      …
      if ((await p.exited) !== 0) throw new Error(`${name} failed`);
```

External commands run through `Bun.spawn` with argv arrays and no shell, and a non-zero exit is an error.

**Proposed Shape:**

```ts
export async function openUrl(url: string, platform: string, spawn = Bun.spawn): Promise<void> {
  const argv = [platform === "darwin" ? "open" : "xdg-open", url];
  const p = spawn(argv, { stdout: "ignore", stderr: "ignore" });
  if ((await p.exited) !== 0) throw new Error(`${argv[0]} failed`);
}
export async function readImage(root: string, rel: string): Promise<Uint8Array>;
```

`openUrl` follows `commandProvider`: argv, no shell, non-zero exit throws, and a missing launcher surfaces as a spawn error. `readImage` resolves the realpath and refuses anything outside the workspace realpath, mirroring the server's containment.

- **Invariants:**
  - The URL is always `http://127.0.0.1:<port>/…` built by `previewUrl`.
- **Verification Coverage:** S8, S12 — V32, V40

## `src/preview/server.ts`

- **Change:** Add
- **Decisions:** DES10, DES12
- **Requirements:** W261003S6BQ-REQ8@R1, W261003S6BQ-REQ7@R2, W261003S6BQ-REQ1@R1
- **Responsibilities:** Routes, security headers, Host check, containment, SSE, debounced follow, stop order.
- **Affected Callers/Consumers:** `src/app/preview-host.ts`
- **Construction/Wiring:** `createPreviewHost` calls `startPreviewServer`
- **Dependencies:** `Bun.serve`, `Bun.file`, `node:fs` (`realpath`, `readFile`), `./assets` (`PAGE`, `ASSETS`), core `parseDoc`, `createTextBuffer`, `renderHtml`, `followTarget`, `htmlCtx`, `Store`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PreviewServerOptions`, `PreviewServer`, `startPreviewServer`, `SECURITY_HEADERS`, `FILE_CSP` | None — new symbol | below | preview host |

**Existing Shape:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md:229-235` (phase code shape)

```ts
const clients = new Set<ReadableStreamDefaultController<string>>();
const send = (event: "doc" | "stopped", data: unknown) =>
  clients.forEach((c) => c.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
const unsubscribe = store.subscribe(debounce(100, (s) => { const d = activeDoc(s); if (changed(d)) send("doc", d); }));
function stop() { unsubscribe(); send("stopped", {}); clients.forEach((c) => c.close()); server.stop(true); }
```

The phase fixes the client set, the debounced subscription, and the stop order.

**Proposed Shape:**

```ts
import { ASSETS, PAGE, type PreviewAsset } from "./assets";
export const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; " +
    "img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;
const FILE_CSP = "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox";
export type PreviewServerOptions = { root: string; store: Store; isExcluded(rel: string): boolean; port?: number };
export type PreviewServer = { port: number; stop(): void };
export function startPreviewServer(o: PreviewServerOptions): PreviewServer {
  const rootReal = realpathSync(o.root);
  let last: FollowTarget | undefined = followTarget(o.store.get());
  const server = Bun.serve({ hostname: "127.0.0.1", port: o.port ?? 0, idleTimeout: 0, fetch: (req) => {
    const url = new URL(req.url);
    if (!allowedHost(req.headers.get("host"), server.port)) return new Response("forbidden", { status: 403 });
    if (req.method !== "GET") return new Response("method not allowed", { status: 405 });
    if (url.pathname === "/events") return events();
    if (url.pathname === "/render") return render(url.searchParams.get("path"));
    if (url.pathname.startsWith("/assets/")) return serveAsset(ASSETS.get(url.pathname.slice(8)));
    if (url.pathname.startsWith("/file/")) return file(decodeURIComponent(url.pathname.slice(6)));
    return serveAsset(PAGE);
  }});
  // respond(body, init): every response, including 403/404/405, SSE, and /render, merges SECURITY_HEADERS
  // serveAsset(a): a ? new Response(Bun.file(a.path), { headers: { "Content-Type": a.type, "Cache-Control": "no-cache", ...SECURITY_HEADERS } }) : 404
  // file(rel): contained bytes, type from the extension, Content-Security-Policy overridden by FILE_CSP
  // contained(rel): realpath under rootReal, no hidden segment, !o.isExcluded(rel) → absolute path | undefined (→ 404)
  // render(path): open buffer → its Doc; else contained .md → parseDoc(createTextBuffer(read)); renderHtml(doc, text, htmlCtx(...))
  // subscribe: debounce 100 ms → t = followTarget(s) ?? last; changed (path, version, line) → last = t; send("doc", {path, version, line})
  return { port: server.port, stop };
}
```

The server binds only `127.0.0.1` on port 0 and rejects any request whose `Host` is not `127.0.0.1:<port>` or `localhost:<port>`, which blocks DNS rebinding. It answers only `GET`. `contained` decodes the path once (so `%2f` escapes are seen), resolves its realpath (so symlink escapes are seen), and requires it under the workspace realpath with no dot segment and not excluded by the injected `.gitignore` rule; anything else is 404. `/render` prefers the open buffer so unsaved edits show, and otherwise parses the contained file. The subscription is debounced 100 ms and sends `doc` only when the follow target's path, version, or line changed; a non-Markdown active buffer gives `undefined`, so `last` stays and nothing is sent. `stop` keeps the phase order: unsubscribe, send `stopped`, close every stream, then `server.stop(true)`.

Every response carries `SECURITY_HEADERS`, so the page loads script, fonts, and connections only from its own origin, cannot be framed, and sends no referrer; `nosniff` stops a workspace file from being sniffed into a script or stylesheet. `/assets/<name>` is a map lookup in `ASSETS`, so an unknown name is 404 and no request path reaches the disk; `Bun.file` streams the embedded file. `Cache-Control: no-cache` makes the browser check again on each page load, so an upgraded binary on a reused port never serves a stale `page.js`; loopback transfer is negligible next to script parsing. `/file/*` uses `FILE_CSP`, whose `sandbox` gives a workspace HTML or SVG file opened directly an opaque origin with no script, so a same-origin attachment can never act as page code.

- **Invariants:**
  - Hostname `127.0.0.1`; Host allowlist; realpath containment; GET only.
  - Every response carries `SECURITY_HEADERS`; `/file/*` responses use `FILE_CSP`.
  - `/assets/*` serves only `ASSETS` entries.
  - `src/preview` imports only `src/preview` and `src/core`, plus the `katex` and `mermaid` files through `assets.ts`.
- **Verification Coverage:** S11, S12, S13 — V26–V31, V34

## `src/preview/assets.ts`, `assets.d.ts`, `page.html`, `page.js`, `page.css`

- **Change:** Add
- **Decisions:** DES12
- **Requirements:** W261003S6BQ-REQ7@R2, W261003S6BQ-REQ8@R1
- **Responsibilities:** Name every file the browser may load and embed it in the binary; the page shell, its follow script, and its stylesheet; KaTeX and Mermaid rendering in the page.
- **Affected Callers/Consumers:** `startPreviewServer` (`PAGE`, `ASSETS`); the browser
- **Construction/Wiring:** `with { type: "file" }` imports; `bun build --compile` embeds every imported file, and `Bun.file` reads it back from the binary
- **Dependencies:** npm `katex` (exact pin, the `0.16.47` already in `bun.lock` through `micromark-extension-math`) — `dist/katex.min.js`, `dist/katex.min.css`, `dist/fonts/*.woff2`; npm `mermaid` (exact pin of the current release at implementation) — its self-contained minified browser bundle (`dist/mermaid.min.js`, which sets `window.mermaid`). Exact dist file names are confirmed against the installed versions at implementation; the mechanism does not depend on them.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PreviewAsset`, `PAGE`, `ASSETS` | None — new symbol | below | server |
| page script `follow`, `swapArticle`, `renderBlocks`, `setBadge` | None — new symbol | below | browser |

**Existing Shape:** `rm261003abzp-ui-design.md` Browser preview page, Applicable Code Shape (`follow()`)

```js
const es = new EventSource("/events");
es.addEventListener("doc", async (e) => {
  const { path, anchor } = JSON.parse(e.data);
  if (!following) return;
  const html = await fetch(`/render?path=${encodeURIComponent(path)}`).then((r) => r.text());
  swapArticle(html, anchor); history.replaceState(null, "", `/${path}`); setBadge("Live");
```

The UI design fixes the follow loop, badge, and URL behaviour.

**Proposed Shape:**

```ts
// src/preview/assets.ts
import pageHtml from "./page.html" with { type: "file" };
import pageJs from "./page.js" with { type: "file" };
import pageCss from "./page.css" with { type: "file" };
import katexJs from "katex/dist/katex.min.js" with { type: "file" };
import katexCss from "katex/dist/katex.min.css" with { type: "file" };
import mainRegular from "katex/dist/fonts/KaTeX_Main-Regular.woff2" with { type: "file" };
// … one import per woff2 face that katex.min.css references
import mermaidJs from "mermaid/dist/mermaid.min.js" with { type: "file" };

export type PreviewAsset = { path: string; type: string };
const JS = "text/javascript; charset=utf-8";
const CSS = "text/css; charset=utf-8";
const WOFF2 = "font/woff2";

export const PAGE: PreviewAsset = { path: String(pageHtml), type: "text/html; charset=utf-8" };
export const ASSETS: ReadonlyMap<string, PreviewAsset> = new Map([
  ["page.js", { path: pageJs, type: JS }],
  ["page.css", { path: pageCss, type: CSS }],
  ["katex.min.js", { path: katexJs, type: JS }],
  ["katex.min.css", { path: katexCss, type: CSS }],
  ["fonts/KaTeX_Main-Regular.woff2", { path: mainRegular, type: WOFF2 }],
  // …
  ["mermaid.min.js", { path: mermaidJs, type: JS }],
]);
```

```ts
// src/preview/assets.d.ts — a file imported `with { type: "file" }` evaluates to its path
declare module "*.css" { const path: string; export default path; }
declare module "*.woff2" { const path: string; export default path; }
declare module "*.min.js" { const path: string; export default path; }
declare module "*/page.js" { const path: string; export default path; }
```

```html
<!-- src/preview/page.html -->
<link rel="stylesheet" href="/assets/katex.min.css">
<link rel="stylesheet" href="/assets/page.css">
<script defer src="/assets/katex.min.js"></script>
<script defer src="/assets/mermaid.min.js"></script>
<script defer src="/assets/page.js"></script>
```

```js
// src/preview/page.js
window.mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true, theme: currentTheme() });
es.addEventListener("doc", async (e) => {
  const { path, line } = JSON.parse(e.data);
  if (!following) return;
  const html = await fetch(`/render?path=${encodeURIComponent(path)}`).then((r) => r.text());
  const old = new Set([...document.querySelectorAll("section[data-hash]")].map((s) => s.dataset.hash));
  swapArticle(html); await renderBlocks(); flashNew(old); scrollToLine(line);
  history.replaceState(null, "", `/${path}`); setBadge("Live");
});
es.addEventListener("stopped", () => { es.close(); setBadge("Stopped"); });
async function renderBlocks() {
  for (const el of article.querySelectorAll(".math[data-tex]"))
    window.katex.render(el.dataset.tex, el, { throwOnError: false, displayMode: el.tagName === "DIV" });
  for (const pre of article.querySelectorAll("pre.mermaid")) {
    try { pre.outerHTML = `<figure class="mermaid">${(await window.mermaid.render(nextId(), pre.textContent)).svg}</figure>`; }
    catch { pre.classList.add("render-error"); }
  }
}
```

`assets.ts` is the closed list of files the browser may load. A `with { type: "file" }` import evaluates to a path — the source or `node_modules` file under `bun run`, the embedded copy in a compiled binary — so `Bun.file(path)` works in both and the binary needs no `node_modules`. `assets.d.ts` types those imports as `string`; `page.html` keeps the `HTMLBundle` type `bun-types` declares for `*.html`, hence `String(pageHtml)`. KaTeX's stylesheet loads `url(fonts/KaTeX_….woff2)`, which resolves to the `fonts/…` entries because the stylesheet is served from `/assets/`; only woff2, the first source in each `@font-face`, is embedded.

`page.html` has no inline script or style, so the page's own code needs no nonce or hash. `page.js` is a deferred classic script that runs after KaTeX and Mermaid (deferred scripts run in document order) and owns the theme toggle, badges, paused-follow banner, and follow loop. It differs from the UI-design sketch only in using `line`: `scrollToLine` scrolls to the last `section` whose `data-line` is at most `line`, and `flashNew` highlights sections with a new hash. After every swap, `renderBlocks` runs KaTeX with `throwOnError: false`, which renders a malformed formula as its source in the error colour, and keeps a failing Mermaid block's escaped `<pre>` with a `render-error` class that `page.css` labels. `securityLevel: "strict"` sanitizes Mermaid labels and disables click handlers; `suppressErrorRendering` stops Mermaid from inserting its own error diagram.

Mermaid styles each diagram with a per-diagram `<style>` element and `style` attributes inside the SVG, which no hash or nonce can cover, so under `style-src 'self'` every diagram would be unstyled. The policy therefore allows `'unsafe-inline'` for styles only. Inline CSS cannot run code, and it cannot send note text out, because `default-src 'none'`, `img-src 'self' data:`, `font-src 'self'`, and `connect-src 'self'` block every external URL. Scripts stay `'self'`-only.

- **Invariants:**
  - The page and every asset reference no origin other than the server's own.
  - No inline `<script>`, inline event handler, form, `contenteditable`, or mutating request.
  - Every `url(fonts/….woff2)` in `katex.min.css` has an `ASSETS` entry.
- **Verification Coverage:** S13 — V34, V35, V42, V47, V48

## `src/app/preview-host.ts`, `src/app/effects.ts`, `src/app/lifecycle.ts`, `src/app/main.ts`

- **Change:** Add / Modify
- **Decisions:** DES1, DES7, DES8, DES11
- **Requirements:** W261003S6BQ-REQ8@R1, W261003S6BQ-REQ1@R1
- **Responsibilities:** Own the server; run preview effects; stop on exit; register everything.
- **Affected Callers/Consumers:** store (effects), lifecycle
- **Construction/Wiring:** composition root
- **Dependencies:** `startPreviewServer`, `openUrl`, `readImage`, `ExclusionMatcher.isExcludedPath`, `Logger`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PreviewHost`, `createPreviewHost` | None — new symbol | `{ start(): void; stop(): void }` dispatching results | effects, lifecycle |
| `RunnerDeps` | `effects.ts:29-49` | `+ preview: Pick<PreviewHost, "start" \| "stop">; openUrl: (url: string) => Promise<void>` | main |
| `createEffectRunner` `run` | `effects.ts:170-340` | `+ case "startPreview"`, `"stopPreview"`, `"openUrl"` | store |
| `installLifecycle` | `lifecycle.ts:20-63` | `+ stopPreview?: () => void` called before `shell.destroy()` | main |
| `registries`, `main` | `main.ts:97-111`, `:186-310` | `+ viewContexts`, markdown commands and bindings, `builtinRenderers()`, painters, `loadImage`, preview host | — |

**Existing Shape:** `src/app/lifecycle.ts:44-48`

```ts
    await Promise.race([all, Bun.sleep(FLUSH_BOUND_MS)]);
    try {
      d.saveSession?.(d.store.get());
    } catch {}
    d.shell.destroy();
```

Shutdown flushes writes, saves the session, then restores the terminal.

**Proposed Shape:**

```ts
export function createPreviewHost(d: { root: string; store: () => Store; isExcluded: (rel: string) => boolean; dispatch: (a: Action) => void; logger: Logger }): PreviewHost {
  let server: PreviewServer | undefined;
  return {
    start() {
      if (server) return d.dispatch({ type: "previewStarted", port: server.port });
      try { server = startPreviewServer({ root: d.root, store: d.store(), isExcluded: d.isExcluded });
            d.logger.info("preview.started", { port: server.port }); d.dispatch({ type: "previewStarted", port: server.port }); }
      catch (e) { d.logger.error("preview.failed", { reason: String(e) }); d.dispatch({ type: "previewFailed", reason: String(e) }); }
    },
    stop() { server?.stop(); server = undefined; d.logger.info("preview.stopped", {}); },
  };
}
// effects: case "startPreview": d.preview.start(); return;
//          case "stopPreview":  d.preview.stop(); d.dispatch({ type: "previewStopped" }); return;
//          case "openUrl": void d.openUrl(e.url).catch((x) => { d.logger.error("browser.openFailed", { reason: msg(x) });
//                                                             d.dispatch({ type: "openUrlFailed", url: e.url, reason: msg(x) }); });
// lifecycle: try { d.stopPreview?.(); } catch {} ; d.shell.destroy();
```

The host mirrors `index-host.ts`: the app owns the long-lived resource, effects drive it, and results come back as actions. `stopPreview` runs before `shell.destroy()`, so a connected page receives `stopped` on every exit path that reaches shutdown, and a failure there never blocks the terminal restore.

- **Invariants:**
  - At most one server object.
  - The preview stops before terminal restore.
- **Verification Coverage:** S12 — V29, V31, V32, V33

## `scripts/bench-gate.ts` and `test/bench/*`

- **Change:** Modify / Add
- **Decisions:** DES14
- **Requirements:** W261003S6BQ-REQ1@R1
- **Responsibilities:** V12 targets in CI.
- **Affected Callers/Consumers:** `bun run bench` in CI (Linux)
- **Construction/Wiring:** `TARGETS`, `BENCHES`
- **Dependencies:** `mountShell`, `make5000LineNote`, `make5000LineTs`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `TARGETS` | `bench-gate.ts:8-14` five targets | `+ liveKeystrokeP95: 16, sourceOpenFile: 50, liveScrollFrameP95: 16.7, sourceScrollFrameP95: 16.7` | gate |
| `BENCHES` | `:17-23` | `+ live-keystroke.bench.ts, source-open.bench.ts, scroll.bench.ts --file note, scroll.bench.ts --file ts` | gate |
| `make5000LineTs` | None — inline `tsSource` in `source-keystroke.bench.ts:7-17` | moved to `test/fixtures/generate.ts` | both TS benches |

**Existing Shape:** `scripts/bench-gate.ts:8-14`

```ts
export const TARGETS = {
  sourceKeystrokeP95: 16,
  openFile: 50,
  firstFrame: 200,
  indexReady: 3000,
  indexingKeystrokeP95: 16,
} as const;
```

`openFile` already opens the 5,000-line note; once `live` is the default view it measures the live-preview open with no code change.

**Proposed Shape:**

```ts
export const TARGETS = {
  sourceKeystrokeP95: 16, liveKeystrokeP95: 16,
  openFile: 50, sourceOpenFile: 50,
  liveScrollFrameP95: 16.7, sourceScrollFrameP95: 16.7,
  firstFrame: 200, indexReady: 3000, indexingKeystrokeP95: 16,
} as const;
```

The live keystroke bench mirrors `source-keystroke.bench.ts` on the 5,000-line note (120×40, the V12 key mix). The scroll bench holds `j` for 2 s of simulated keys and repeats `Ctrl-d`/`Ctrl-u`, timing each `renderOnce`, and prints the p95 frame time. The gate's rule (median of 5 above 2× fails) is unchanged.

- **Invariants:**
  - Existing metric names and meanings stay.
- **Verification Coverage:** S15 — V44, V45

## `test/boundaries.test.ts`, `package.json`, `test/support/*`, fixtures

- **Change:** Modify / Add
- **Decisions:** DES1, DES3, DES6, DES7, DES8, DES12, DES14
- **Requirements:** W261003S6BQ-REQ3@R1, W261003S6BQ-REQ7@R2, W261003S6BQ-REQ1@R1
- **Responsibilities:** Dependency homes; test wiring parity with `main.ts`; fixtures.
- **Affected Callers/Consumers:** every UI and state test
- **Construction/Wiring:** `testRegistries()` adds `viewContexts`, markdown commands and bindings, and calls `builtinRenderers()`; `mountShell` registers painters and accepts `capabilities`, `images` loader overrides
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PACKAGE_HOMES` | `boundaries.test.ts:45-53` | `+ "beautiful-mermaid": ["src/core/lang/markdown/"]`, `+ katex: ["src/preview/"]`, `+ mermaid: ["src/preview/"]` | boundary test |
| `checkImports` | `boundaries.test.ts:73-100` looks up `PACKAGE_HOMES[specifier]` | looks up `PACKAGE_HOMES[packageName(specifier)]`, so `katex/dist/katex.min.js` is checked as `katex` | boundary test |
| `dependencies` | `package.json:18-30` | `+ "beautiful-mermaid": "1.1.3"`, `+ "katex": "0.16.47"`, `+ "mermaid": "<exact>"` | build |
| `testRegistries` | `test/support/state.ts:33-47` | mirrors `registries()` | tests |
| `MountOptions`, `mountShell` | `test/support/ui.ts:19-131` | `+ capabilities?`, `+ files?: Record<string, Uint8Array>` for `loadImage` | UI tests, benches |

**Existing Shape:** `test/boundaries.test.ts:45-53`

```ts
const PACKAGE_HOMES: Readonly<Record<string, readonly string[]>> = {
  "mdast-util-from-markdown": ["src/core/lang/markdown/"],
  …
  yaml: ["src/core/lang/markdown/"],
  "toml-eslint-parser": ["src/core/config/"],
};
```

Every Markdown package has one home.

**Proposed Shape:**

```ts
  "beautiful-mermaid": ["src/core/lang/markdown/"],
  katex: ["src/preview/"],
  mermaid: ["src/preview/"],
// checkImports
const packageName = (specifier: string) =>
  specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/");
const homes = PACKAGE_HOMES[packageName(specifier)];
```

`beautiful-mermaid` joins the Markdown home; `katex` and `mermaid` may be imported only by `src/preview/`, where `assets.ts` imports their browser files. Today the home lookup uses the whole specifier, which would let a subpath import such as `katex/dist/katex.min.js` bypass it, so the lookup moves to the package name. `test/repo.test.ts` already enforces exact pins for every dependency. `katex` is already in `bun.lock` at `0.16.47` through `micromark-extension-math` (`bun.lock:256`, `:310`); the direct exact pin keeps the same version.

- **Invariants:**
  - Test registries equal production registries in content.
- **Verification Coverage:** S4, S13, S16 — V8, V47

## Migration and Delivery

- **Database or Schema Migration:** None — no database; `state.json` stays version 1 (unlisted buffers are filtered from the snapshot; V12).
- **Data Backfill:** None — fold state and preview state are not persisted.
- **Mixed-Version Compatibility:** A PH1 `state.json` restores unchanged; its `view: "source"` entries are ignored as before and notes open in `live` (V1). A PH1 `config.toml` stays valid; the `preview` section is optional.
- **Feature Flags:** None — `preview.mode = "source"` restores the PH1 look for users who want it; no flag is needed.
- **Rollout Constraints:** One PR (DI3); DI4 builds its `base` renderer and painter on the merged G4 signatures.
- **Rollback:** Revert the DI3 PR; notes are never rewritten by rendering, so no data rollback.

# 8. Testing and Verification

## Design Success Criteria

| ID | Observable Success Condition | Traceability |
|---|---|---|
| `S1` | A Markdown note opens in `live` (or the configured mode), a code file in `source`, and a PH1 session restores notes in `live` | REQ6; DES1, DES13 |
| `S2` | Layout goldens for `tour.md` at widths 60 and 100 match for every REQ5 element, reveal state, `reading`, and `source` | REQ1; DES2 |
| `S3` | A throwing renderer leaves its block as source with `⚠` and the rest of the note rendered | REQ1; DES2 |
| `S4` | Math and Mermaid render as Unicode or ASCII art, fall back to labelled source, and are not recomputed while typing elsewhere | REQ3; DES3 |
| `S5` | Embeds render capped with `… N more lines`, expand with `za`, show `loading…` and unresolved states, stop at one level, and their buffers stay invisible and are evicted; a refused target is not requested again, and request state lives on the embedding note, never top-level or persisted | REQ4; DES4 |
| `S6` | Folds follow block ids: survive inserts above, reset on edit or deletion, `[!x]-` starts folded | REQ5; DES5 |
| `S7` | The cursor row stays visible with tall widgets; only visible rows are laid out; signs and widget rows paint | REQ5, REQ1; DES6 |
| `S8` | Image tiers, placeholders, the 64 MiB LRU, and repaint-on-load behave as specified, with no stale placement after scroll, view, or buffer change | REQ2; DES7 |
| `S9` | Reading view refuses edits with the hint; `Enter`, `<leader>x`, `za`, `<leader>m` work on notes and are unbound on code files | REQ1, REQ6; DES8 |
| `S10` | `renderHtml` covers the same syntax, escapes all note text, and tags blocks with `data-line` and `data-hash` | REQ8; DES9 |
| `S11` | The server is local-only and read-only: 403 for foreign Host, 404 for escapes and hidden or excluded files, 405 for non-GET | REQ1, REQ8; DES10 |
| `S12` | Edits reach the page as `doc` within 300 ms; code files send none; stop delivers `stopped` first; launch failure toasts the URL; a second `:Preview` reuses the port | REQ8; DES10, DES11 |
| `S13` | The compiled binary serves the page and every embedded asset without `node_modules`; every response carries the same-origin Content Security Policy, `nosniff`, and `no-referrer`; the page references only its own origin; unknown assets are 404; math and diagrams render offline and render errors show source | REQ7; DES10, DES12 |
| `S14` | `preview.*` defaults and validation hold | REQ1, REQ4; DES13 |
| `S15` | All bench targets pass the 2× CI gate, including first frame with `beautiful-mermaid` | REQ1, REQ3; DES14 |
| `S16` | `EditorView` and the kernel contain no Markdown; a `csv` file type and a `grid` editor kind work by registration only | REQ1, REQ6; DES1, DES14 |
| `S17` | The statusline shows `MODE │ view │ path │ backlinks │ words │ preview │ index │ Ln:Col` and drops preview, words, view when narrow | REQ1, REQ8; DES11 |
| `S18` | G4 signatures equal the phase design and a registered block renderer and widget painter are used without other edits | REQ1; DES2, DES6 |

## Test Suites and Cases

```text
src/ + test/
├── src/core/lang/markdown/live-preview.test.ts [Unit]
│   Purpose: provider output through layoutText (V7@R2 goldens) and registry behaviour
│   SUT: livePreview, registerBlockRenderer, layoutText
│   Infra: None
│   Doubles: PreviewCtx stub (resolve, embed, image, folds)
│   ├── V4 tour.md at widths 60 and 100 × cursor {blank line, bold line, in table, in callout, in fence, in frontmatter, in Mermaid}, plus reading and source
│   │   ├── Expect: RenderLine[] serialized to text + style tokens equals committed goldens; H1–H4 start with █ ▊ ▌ ▏; %%comment%% line absent; ▕ only on revealed rows [S2]
│   │   └── Unique risk: reveal, hiding, alignment, or element regressions
│   ├── V5 registerBlockRenderer("callout", throwing) then layout; registerBlockRenderer("xbase", stub) with ![[t.xbase]]
│   │   ├── Expect: callout lines appear as raw source with ⚠ sign on the first; other blocks unchanged; the stub's decorations appear for the embed [S3, S18]
│   │   └── Unique risk: one bad renderer blanks the note; extension needs provider edits
│   └── V14 call-count: provider over a 5,000-line Doc with visible 30 lines
│       ├── Expect: renderers invoked only for blocks intersecting the visible range [S7]
│       └── Unique risk: full-document work in the keystroke path
├── src/core/lang/markdown/reveal.test.ts [Unit]
│   Purpose: reveal decision
│   SUT: reveal
│   Infra: None
│   Doubles: None
│   └── V1r selection over two lines spanning a table; cursor moved out; reading view
│       ├── Expect: both lines and the table id revealed; then nothing; reading → empty sets [S2]
│       └── Unique risk: selection-aware reveal or reading-mode leak
├── src/core/lang/markdown/renderers/math.test.ts [Unit]
│   Purpose: TeX approximation
│   SUT: mathText
│   Infra: None
│   Doubles: None
│   └── V6 "E = mc^2", "\sum_{i=1}^{n} x_i \le \frac{a}{b}", "\unknowncmd x"
│       ├── Expect: Unicode strings for the first two; {kind:"source"} with the TeX for the third [S4]
│       └── Unique risk: lossy or wrong math text
├── src/core/lang/markdown/renderers/mermaid.test.ts [Unit]
│   Purpose: Mermaid text and caching
│   SUT: mermaidText, mermaidRenderer
│   Infra: None
│   Doubles: spy on the library call through a registered wrapper
│   ├── V7 flowchart from tour.md; "gantt" diagram; malformed flowchart
│   │   ├── Expect: box-drawing lines; {kind:"source", label:"mermaid: gantt shown as source"}; source label for parse error [S4]
│   │   └── Unique risk: crash or garbage on unsupported input
│   └── V8 type 50 keys outside the fence, re-layout each time
│       ├── Expect: the library is called once [S4]
│       └── Unique risk: Mermaid layout on every keystroke
├── src/core/lang/markdown/renderers/embed.test.ts [Unit]
│   Purpose: embed rows
│   SUT: embedRenderer, sectionLines
│   Infra: None
│   Doubles: PreviewCtx stub
│   ├── V9 ![[so-roadmap#Goals]] with a 25-line section, embedMaxRows 10; then id in folds
│   │   ├── Expect: widget rows = title + 10 + "… 15 more lines"; expanded → title + 25 [S5]
│   │   └── Unique risk: cap or section boundaries wrong
│   └── V10 target "loading"; "missing"; target that embeds itself
│       ├── Expect: min(10,3) reserved rows with loading state; missing state with linkUnresolved; self-embed renders inner embed as a link (one level) [S5]
│       └── Unique risk: recursion or layout jump on load
├── src/core/lang/markdown/html.test.ts [Unit]
│   Purpose: HTML output
│   SUT: renderHtml
│   Infra: None
│   Doubles: HtmlCtx stub
│   ├── V20 tour.md
│   │   ├── Expect: one <section data-line data-hash> per block; wikilinks href "/<path>"; unresolved link class; images src "/file/<path>"; task inputs disabled; mermaid <pre class="mermaid">; math spans with data-tex [S10]
│   │   └── Unique risk: HTML and terminal disagree on structure
│   └── V21 note with <script>alert(1)</script>, an attribute-breaking link title, and a raw HTML block
│       ├── Expect: no unescaped "<script" or quote breakout in output [S10]
│       └── Unique risk: XSS from note content
├── src/core/state/embeds.test.ts [Unit]
│   Purpose: embed request and eviction
│   SUT: syncEmbeds via createUpdate
│   Infra: None
│   Doubles: None
│   ├── V11 open note A embedding B and C twice; keystroke; fileLoaded(B)
│   │   ├── Expect: exactly one read each for B and C, both in A's embeds.requested; B opens with listed:false and is not shown, and leaves A's requested; recent unchanged [S5]
│   │   └── Unique risk: duplicate reads or embed target stealing the window
│   ├── V12 close A; snapshotSession; Enter on the embed before closing (second run)
│   │   ├── Expect: unlisted B removed; state.json buffers omit B and every buffer omits embeds; opening B makes it listed and kept [S5, S1]
│   │   └── Unique risk: leaked buffers or session pollution
│   └── V49 open note A embedding D and note E embedding D; fileRefused(D); keystroke in A; build A's PreviewCtx; remove the embed from A
│       ├── Expect: one read for D, recorded in both A's and E's embeds.requested; after the refusal D is in both buffers' embeds.refused with no error notice; the keystroke emits no read; ctx.embed(D) is "missing" (painted in linkUnresolved by V10); removing the embed drops D from A's embeds only; AppState has no new top-level key besides preview [S5]
│       └── Unique risk: a refused embed re-requested on every keystroke, error notices while typing, or embed state leaking between notes
├── src/core/state/markdown-commands.test.ts [Unit]
│   Purpose: fold, task, view commands
│   SUT: toggleFold, toggleTask, cycleView, noteEnter via runCommand
│   Infra: None
│   Doubles: None
│   ├── V13 za on a callout title; insert a line above; edit the callout title; delete the callout; open a note with > [!tip]-
│   │   ├── Expect: id in folds; still folded (id unchanged); fold reset; fold gone; tip callout folded with no toggle [S6]
│   │   └── Unique risk: folds drifting to the wrong block
│   └── V2 <leader>m ×3 on a note; on sync.ts; Enter on "- [ ] x"; Enter on a link; u after toggle
│       ├── Expect: live→source→reading→live with message; code file unchanged; [x] then follow; one undo restores [ ] [S9, S1]
│       └── Unique risk: wrong key semantics or multi-step undo
├── src/core/state/preview.test.ts [Unit]
│   Purpose: preview reducers and follow selector
│   SUT: startPreview, onPreviewStarted, stopPreview, onOpenUrlFailed, followTarget
│   Infra: None
│   Doubles: None
│   ├── V29 :Preview off → starting + [startPreview]; again while starting → nothing; previewStarted(8731) → on + [openUrl(http://127.0.0.1:8731/notes/plan.md)]; :Preview on → [openUrl] only
│   │   ├── Expect: exactly those states and effects [S12]
│   │   └── Unique risk: double servers or missing launch
│   ├── V31 :PreviewStop when off; when on; openUrlFailed
│   │   ├── Expect: message "preview is not running"; [stopPreview]; info toast containing the URL [S12]
│   │   └── Unique risk: wrong recovery messaging
│   └── V3 :Preview with sync.ts active
│       ├── Expect: message "not available for typescript files"; no effect [S9, S12]
│       └── Unique risk: preview starting for code files
├── src/core/state/view-context.test.ts [Unit]
│   Purpose: builder registry and Markdown context
│   SUT: ViewContextRegistry, markdownViewContext
│   Infra: None
│   Doubles: ViewHost stub
│   └── V17 duplicate registration; unknown file type; image 1600×900 px at width 80, rows 40, aspect 0.5; unknown image
│       ├── Expect: throws; undefined; rows = min(ceil(900/1600·80·0.5), 32) = 23; "unknown" [S8, S16]
│       └── Unique risk: wrong reserved rows or silent duplicate builders
├── src/core/state/config.test.ts [Unit] (modified)
│   └── V39 empty config; preview.embedMaxRows = 0 at line 3; preview.zoom = 1
│       ├── Expect: defaults {live, 10, auto}; error "config.toml:3"; unknown-key error [S14]
│       └── Unique risk: invalid config silently accepted
├── src/ui/images.test.ts [Unit]
│   Purpose: tier policy and cache bounds
│   SUT: imageTier, ImageCache
│   Infra: None
│   Doubles: load stub, repaint spy
│   ├── V19 three images of 30 MiB decoded size; get same path twice before load resolves
│   │   ├── Expect: one load call; after the third, the first is disposed and total ≤ 64 MiB; repaint called per load [S8]
│   │   └── Unique risk: unbounded memory or duplicate loads
│   └── V40 corrupt PNG bytes; SVG bytes; loader rejection
│       ├── Expect: {failed:true} for each without throwing [S8]
│       └── Unique risk: crash on bad images
├── test/ui/live-preview.test.ts [Integration] (component, OpenTUI test renderer)
│   Purpose: painting, cursor fit, tiers, read-only, UV3
│   Real: store, reducer, registries, EditorView, painters
│   Infra: OpenTUI test renderer
│   Doubles: capabilities override; in-memory image files
│   ├── V15 note with a 20-row image at the top; j to line 30 in 120×24
│   │   ├── Expect: the hardware cursor is on screen at the cursor line's row each step [S7]
│   │   └── Unique risk: cursor scrolled under a widget
│   ├── V16 tour.md frame: sign column, rule widget, embed rows, folded callout ▸
│   │   ├── Expect: ▕ in the sign cell only on revealed rows; ─ rule across width; "… N more lines"; one row for the folded callout (UV3@R2) [S7, S5]
│   │   └── Unique risk: widget rows mis-sized or unpainted
│   ├── V18 same note with capabilities kitty / sixel+resolution / none / config images="off"
│   │   ├── Expect: drawImage called with "kitty" / "sixel"; block characters in the image rows; "[image: diagram.png]" (V8@R1) [S8]
│   │   └── Unique risk: wrong tier selection or layout break on unsupported terminals
│   ├── V37 reading view: x, i, p, dd; then j
│   │   ├── Expect: text unchanged, message "reading mode — <leader>m to edit"; j moves [S9]
│   │   └── Unique risk: edits leaking in reading mode
│   └── V25 open sync.ts: frame rows; <leader>m; gd; Enter
│       ├── Expect: every text row equals the raw line; sign column empty; buffer, view, cursor unchanged except Enter moving down (UV3 sync.ts) [S9, S16]
│       └── Unique risk: note behaviour leaking into code files
├── test/ui/extension.test.ts [Integration] (component)
│   Purpose: registration-only extension (V16@R2)
│   Real: registries, store, shell
│   Infra: OpenTUI test renderer
│   Doubles: None
│   ├── V38 register csv: file type with highlighter, a decoration provider using a view input, a view-context builder, a csv-scoped keymap; open data.csv
│   │   ├── Expect: highlighter marks and decorations painted; key runs the csv command; no file outside the test module edited (git-tracked sources unchanged) [S16]
│   │   └── Unique risk: hidden switch statements requiring edits
│   └── V41 register a command + keymap, a syntax extension, a block renderer and widget painter; an editor kind "grid" with a .grid file type and UI view
│       ├── Expect: palette and key run the command; the syntax renders through the renderer and painter; t.grid opens {editor:"grid"} and the registered view paints [S16, S18]
│       └── Unique risk: G4 or editor-kind extension needing core edits
├── test/ui/shell.golden.test.ts [Integration] (modified)
│   └── V36 120 cols with a note, preview on(8731); 120 cols with sync.ts; 80 cols
│       ├── Expect: "NORMAL │ live │ notes/plan.md │ ← N backlinks │ W words │ preview :8731 │ ◆ index ready │ Ln:Col"; "… │ source │ scripts/sync.ts │ preview :8731 │ …"; 80 cols drops preview, words, view (UV1@R2 full) [S17]
│       └── Unique risk: segment order regression
├── src/preview/assets.test.ts [Unit]
│   Purpose: The page's closed, same-origin file set
│   Real: PAGE, ASSETS, the files they point to
│   Doubles: None
│   └── V48 read page.html, page.js, page.css, and katex.min.css from their ASSETS paths
│       ├── Expect: page.html, page.js, and page.css contain no "http://" or "https://" and no inline <script> body or on* attribute; every src and href in page.html starts with /assets/ and names an ASSETS key; every url(fonts/….woff2) in katex.min.css has an ASSETS key; every PAGE and ASSETS path is a readable file [S13]
│       └── Unique risk: a third-party origin or inline code creeping into the page, or a KaTeX upgrade adding a font the server does not serve
├── test/integration/preview-server.test.ts [Integration]
│   Purpose: V11@R3 on a real server
│   Real: startPreviewServer, store, reducer, renderHtml
│   Infra: Bun.serve on 127.0.0.1:0; tmp workspace with a symlink to /etc, a .git folder, a .gitignore'd file, and diagram.svg
│   Doubles: None
│   ├── V26 Host evil.test:<port>
│   │   ├── Expect: 403 [S11]
│   │   └── Unique risk: DNS rebinding
│   ├── V27 /file/..%2f..%2fetc/passwd; /file/link-out/passwd (symlink); /file/.git/config; /file/ignored.md; /render?path=../x.md
│   │   ├── Expect: 404 for each [S11]
│   │   └── Unique risk: traversal or hidden-file exposure
│   ├── V28 POST /render; server address
│   │   ├── Expect: 405; listening hostname is 127.0.0.1 [S11]
│   │   └── Unique risk: network exposure or mutating route
│   ├── V22 connect /events; dispatch an edit; measure to the doc event; GET /render
│   │   ├── Expect: doc event {path, version, line} < 300 ms; fragment contains the edit [S12]
│   │   └── Unique risk: follow latency or stale render
│   ├── V23 switch the active buffer to scripts/sync.ts; wait 300 ms; GET /render (no path)
│   │   ├── Expect: no doc event; fragment of the last note [S12]
│   │   └── Unique risk: following non-Markdown files
│   ├── V24 GET /render?path=<closed note>
│   │   ├── Expect: fragment rendered from disk [S10]
│   │   └── Unique risk: wikilink navigation to closed notes broken
│   ├── V30 stop() with a connected client
│   │   ├── Expect: client reads "event: stopped" before end-of-stream; then connect refused [S12, S11]
│   │   └── Unique risk: page shows Reconnecting… instead of Stopped
│   └── V34 GET /, /assets/katex.min.js, /assets/nope.js, /file/diagram.svg
│       ├── Expect: / is 200 text/html; charset=utf-8 with no <form> or contenteditable; /assets/katex.min.js is 200 text/javascript; charset=utf-8 with the package file's bytes; /assets/nope.js is 404; all three carry Content-Security-Policy equal to SECURITY_HEADERS' policy, X-Content-Type-Options: nosniff, Referrer-Policy: no-referrer; /file/diagram.svg carries FILE_CSP (with sandbox) [S13, S11]
│       └── Unique risk: missing or loosened policy, wrong asset type that nosniff would block, or an asset route that serves unknown names
├── test/integration/preview-server.test.ts → V32 (same suite) openUrl with a spawn stub exiting 1; effect runner with failing openUrl
│   ├── Expect: openUrl rejects; runner dispatches openUrlFailed with the URL; logger records browser.openFailed without note text [S12]
│   └── Unique risk: launch failure swallowed
├── test/e2e/quit.test.ts [Integration] (modified, PTY)
│   └── V33 :Preview (launcher stubbed by PATH), connect SSE, then SIGTERM
│       ├── Expect: client reads "stopped"; terminal restored (existing V17@R1 assertions) [S12]
│       └── Unique risk: exit path skipping the preview stop or the restore
└── Non-test verification
    ├── V47 Type/build check: bun run check (biome, tsc, knip, boundaries, unit) passes; boundary test passes with the beautiful-mermaid, katex, and mermaid homes (subpath imports checked by package name) and no Markdown import in src/core/kernel or src/ui/editors [S16, S18]
    │   └── Unique risk: layer or export mismatch
    ├── V35 Build check: bun run build; copy dist/so to an empty temp directory with no node_modules; run it in a tmp workspace, :Preview via PTY; GET /, /assets/katex.min.js, /assets/mermaid.min.js, /assets/fonts/KaTeX_Main-Regular.woff2 → 200 with bytes equal to the package files; record the binary size in the PR [S13]
    │   └── Unique risk: page, browser libraries, or worker not embedded in the binary
    ├── V44 Bench: bun run bench on Linux CI — liveKeystrokeP95, sourceKeystrokeP95 < 32; openFile, sourceOpenFile < 100; live/sourceScrollFrameP95 < 33.4; firstFrame < 400; indexReady < 6000; indexingKeystrokeP95 < 32 (medians of 5) [S15, S4]
    │   └── Unique risk: performance regression, including Mermaid at startup
    ├── V45 Reference-machine readings of the same benches recorded in the PR (targets 1×) [S15]
    │   └── Unique risk: CI headroom hiding a real-machine miss
    ├── V46 CI timing: check < 30 s locally, CI < 3 min on the DI3 PR [S15]
    │   └── Unique risk: budget erosion from added benches
    ├── V42 Manual UV9@R1 checklist at 1200 px and 375 px, light and dark, with the network disabled, recorded in the PR: math and Mermaid render; a malformed formula and a malformed diagram show their source; the developer-tools network panel lists only 127.0.0.1:<port> requests and the console shows no CSP violation [S13]
    │   └── Unique risk: visual, offline, or policy-blocked rendering not covered by automation
    ├── V43 Graphics spike before painter implementation: in kitty, Ghostty, WezTerm, iTerm2 (kitty or sixel), and Terminal.app (blocks), scroll an image half off screen, switch view, switch buffer; outcome recorded in the plan; the confirmed clearing behaviour becomes a component assertion in V18 [S8]
    │   └── Unique risk: stale kitty/sixel placements OpenTUI does not clear
    ├── Obsolete-reference check: None — nothing is removed except the `<CR>` link.follow binding, covered by V2
    ├── Migration: V1 PH1 state.json with view "source" restores the note in live; V12 covers the snapshot filter
    ├── Configuration: V39
    └── Observability: V32 (browser.openFailed log); preview.started/stopped logs asserted in V29's runner variant are not needed — the logger is the existing adapter and the events carry ports only
```

The open-and-restore case V1 belongs to `src/core/state/session.test.ts` (modified): restoring `{buffers:[{path:"notes/plan.md", view:"source"}]}` yields a buffer with `view: "live"` [S1]; unique risk: PH1 sessions locking notes in source view.

## Coverage Balance

Each risk is tested at the lowest level that can see it. Layout and rendering are pure, so the V7@R2 goldens, reveal, math, Mermaid, embed rows, and HTML are unit tests over `layoutText` and `renderHtml`; the component suite only adds what needs a renderer — painting, cursor fit, tiers, read-only keys, and code-file isolation. The page's file set is static, so its same-origin and font-coverage rules are a unit test over `ASSETS`; the server's safety, headers, and timing need a real `Bun.serve`, so they are integration tests on one suite; embedding needs a real compiled binary, so it is the V35 build check, and the exit path needs a PTY only for the one signal case. Benchmarks and the manual page checklist are non-test checks because they measure or look rather than assert logic. No case repeats another: for example, the embed cap is asserted once in V9 and only its painting in V16.

## Test Quality Rules

- **Unit:** Verify one public behavior or invariant per case; keep it deterministic and isolated; use doubles only at true boundaries; assert outputs or meaningful side effects. Do not test private methods, mock every collaborator, duplicate implementation logic, or assert internal call order unless order is contractual.
- **Integration/Contract:** Verify real collaboration, wiring, or boundary behavior; keep the components under examination real and list any actual database, queue, cache, filesystem, or external service under `Infra`. Replace only slow or external dependencies when necessary and list them under `Doubles`. Verify serialization, persistence, registration, transactions, and error translation only when applicable; assert observable results or durable side effects; keep setup and cleanup deterministic.
- **Non-test:** Type/build (V47), compiled-binary assets (V35), benchmarks (V44, V45), CI timing (V46), manual checklist (V42), and the graphics spike (V43) are listed above; obsolete-reference and observability checks are `None` with reasons in the tree.

# 9. Finalized Design Decisions

## W261003S6BQ-DES1: Markdown views and the view-context registry

**Question:** How does the live-preview provider get `MarkdownViewInput` without the kernel or UI knowing Markdown, and which view does a buffer start in?

**Decision:** `markdownFileType.views` becomes `live` (default), `source`, `reading` (read-only); `EditorView` calls `ViewSpec.input(analysis, ctx)` with `ctx` from a `ViewContextRegistry` held in `Registries`, where Markdown registers `markdownViewContext`; a new buffer's view is `preview.mode` when its file type has it, else the first view.

**Requirements Addressed:** W261003S6BQ-REQ6@R1, W261003S6BQ-REQ1@R1

**Research Support:** None

**Rationale:** The registry keeps `EditorView` generic and lets the `csv` proof register its own input; using the existing `ViewSpec.input` and `readOnly` needs no kernel or registry change. Restore keeps its PH1 behaviour, so no migration exists.

**Code Impact:**

- `src/core/state/view-context.ts` — `ViewHost`, `ViewContextBuilder`, `ViewContextRegistry` — new registry
- `src/core/state/markdown-view.ts` — `markdownViewContext` — `PreviewCtx` builder
- `src/core/lang/markdown/file-type.ts` — `markdownFileType` — three views
- `src/core/state/buffers.ts` — `defaultView`, `onFileLoaded` — configured default
- `src/ui/editors/text-view.ts` — `layoutFrame` — view input
- `src/core/state/update.ts` — `Registries.viewContexts`

**Detailed Design:** section 7, `view-context.ts`, `markdown-view.ts`, `file-type.ts`, `buffers.ts`, `text-view.ts`

**Tradeoffs:**

- Rejected passing `PreviewCtx` from the UI: the UI would know Markdown.
- Rejected restoring the persisted view: it would keep PH1 sessions in `source` and needs no new behaviour now.

**Success Criteria:** S1, S16

**Verification Impact:**

- V1 — PH1 session restores in `live`; V2 — view cycling; V17 — registry and image rows; V38 — `csv` registers a view context.

## W261003S6BQ-DES2: Live-preview provider, render keys, reveal, and the block-renderer registry

**Question:** How is a `Doc` turned into decorations, revealed at the cursor, and extended per block kind?

**Decision:** `livePreview` walks blocks intersecting the visible range, asks `reveal` for revealed lines and blocks, maps each block to a render key (`Block.kind` refined by its cached mdast root; embed-only paragraphs map to `embed`, `image`, or their extension), and calls the renderer registered for that key; revealed blocks get `▕` signs only; a throwing renderer yields a `⚠` sign and leaves source; expensive outputs are cached by block hash and width.

**Requirements Addressed:** W261003S6BQ-REQ1@R1

**Research Support:** None

**Rationale:** It implements RM261003ABZP-DES9@R3 with the phase-design G4 signatures, keeps the provider pure and golden-testable, and lets DI4 add `base` with one registration.

**Code Impact:**

- `src/core/lang/markdown/live-preview.ts` — `livePreview`, `registerBlockRenderer`, `PreviewCtx`, `MarkdownViewInput`
- `src/core/lang/markdown/{reveal,render-key,inline,render-cache}.ts` — helpers
- `src/core/lang/markdown/renderers/*` — built-in renderers
- `src/ui/theme.ts` — Markdown and sign tokens

**Detailed Design:** section 7, `live-preview.ts`, `reveal.ts`, `render-key.ts`, `inline.ts`, `render-cache.ts`, `renderers/*`

**Tradeoffs:**

- Block reveal shifts more text than Obsidian's per-span reveal (accepted in RM261003ABZP-DES9@R3).
- `PreviewCtx` grows three additive members; reported for parent synchronization.

**Success Criteria:** S2, S3, S18

**Verification Impact:**

- V4 — goldens; V5 — failure isolation and registry extension; V14 — viewport-only call count.

## W261003S6BQ-DES3: Math and Mermaid text renderers

**Question:** How do math and Mermaid render in the terminal?

**Decision:** Port Alfred's `mathText`; render Mermaid with `beautiful-mermaid@1.1.3` (exact pin, home `src/core/lang/markdown/`), falling back to labelled source; cache both by block hash and width.

**Requirements Addressed:** W261003S6BQ-REQ3@R1

**Research Support:** None

**Rationale:** Matches accepted M2 S15 with a library Alfred already uses; the cache keeps the library off the keystroke path.

**Code Impact:**

- `src/core/lang/markdown/renderers/math.ts` — `mathText`, `mathRenderer`
- `src/core/lang/markdown/renderers/mermaid.ts` — `mermaidText`, `mermaidRenderer`
- `package.json`, `bun.lock` — dependency
- `test/boundaries.test.ts` — `PACKAGE_HOMES`

**Detailed Design:** section 7, `renderers/math.ts` and `renderers/mermaid.ts`; `test/boundaries.test.ts`

**Tradeoffs:**

- `elkjs` enlarges the binary; no size budget exists, and V44 guards first-frame time.
- Rejected a self-written flowchart renderer (fewer types, more code).

**Success Criteria:** S4, S15

**Verification Impact:**

- V6, V7, V8 — outputs, fallback, caching; V44 — first frame.

## W261003S6BQ-DES4: Note embeds through unlisted buffers

**Question:** How are embed targets loaded, rendered, and kept bounded?

**Decision:** `syncEmbeds` in the update wrapper requests note targets embedded by listed Markdown buffers once each, opens their reads as `listed: false` buffers, and evicts them when no listed note embeds them; each embedding note's `BufferState.embeds` tracks the targets it requested and those refused, so a refused target is not requested again; the embed renderer lays out the target section in core (one level, nested embeds as links) into span rows painted by `paintEmbed`; `showBuffer` lists a buffer.

**Requirements Addressed:** W261003S6BQ-REQ4@R1

**Research Support:** None

**Rationale:** Reuses the one buffers map as the phase design requires, keeps embeds live when the target is open, and keeps Markdown out of the UI painter.

**Code Impact:**

- `src/core/state/embeds.ts` — `embedTargets`, `syncEmbeds`, `settleEmbedRead`
- `src/core/state/{types,buffers,update,session,picker,commands}.ts` — `BufferState.listed`, `BufferState.embeds`, `onFileLoaded`, `onFileRefused`, filters
- `src/core/state/markdown-view.ts` — `markdownViewContext` reads the laid-out buffer's `embeds`
- `src/core/lang/markdown/renderers/embed.ts` — `embedRenderer`
- `src/ui/widgets/embed.ts`, `src/ui/views/bufferline.ts` — painter, filter

**Detailed Design:** section 7, `embeds.ts`, `types.ts`, `buffers.ts`, `renderers/embed.ts`, `widgets/*`, `{status,session,picker,commands,…}.ts`

**Tradeoffs:**

- Request state is per embedding note rather than one global set, which honours the phase rule of no new top-level `AppState` field besides `preview`; the cost is that `onFileLoaded`/`onFileRefused` update every requesting buffer, a scan of the listed buffers.
- Rejected recursive embeds with cycle detection.

**Success Criteria:** S5

**Verification Impact:**

- V9, V10 — rows and states; V11, V12 — requests, eviction, session; V49 — refused embeds, shared reads, per-note state; V16 — painting.

## W261003S6BQ-DES5: Folds keyed by block id

**Question:** How are callout folds and embed expansion stored and applied?

**Decision:** `WindowState.content.folds?: number[]` holds `Block.id`s toggled from their default; `PreviewCtx.folds` carries them to renderers; folded callout bodies are hidden by block `replace` with no content; kernel `TextView.folds` stays empty for Markdown.

**Requirements Addressed:** W261003S6BQ-REQ5@R1

**Research Support:** None

**Rationale:** Content-derived ids survive inserts above without edit-delta plumbing and vanish with the block; `layoutText` already hides lines under a content-less block replace.

**Code Impact:**

- `src/core/state/types.ts` — `WindowState.content.folds`
- `src/core/state/markdown-commands.ts` — `toggleFold`
- `src/core/lang/markdown/renderers/callout.ts`, `embed.ts` — read `ctx.folds`

**Detailed Design:** section 7, `types.ts`, `markdown-commands.ts`, `renderers/*`, `markdown-view.ts`

**Tradeoffs:**

- Editing a block resets its fold (its id changes); accepted as predictable.
- Departs from the UI-design note that `TextView.folds` carries the set; recorded for parent synchronization.

**Success Criteria:** S6

**Verification Impact:**

- V13 — fold lifecycle; V16 — folded row painting.

## W261003S6BQ-DES6: EditorView signs, widget rows, and cursor-fit scrolling

**Question:** How does the UI paint signs and reserved rows and keep the cursor visible?

**Decision:** `EditorView` lays out once per frame in `show` through `layoutFrame`; `fitCursor` advances the top line until the cursor's laid-out row fits (bounded by the window height); `renderSelf` paints a one-cell sign column and hands widget rows to `widgetPainters` (G4), with a dim fallback for unknown types.

**Requirements Addressed:** W261003S6BQ-REQ5@R1, W261003S6BQ-REQ1@R1

**Research Support:** None

**Rationale:** Keeps the core's line-based scroll and the viewport-only rule; extends the reconciliation `EditorView` already does for short windows.

**Code Impact:**

- `src/ui/editors/text-view.ts` — `show`, `layoutFrame`, `fitCursor`, `renderSelf`, `gutterWidth`
- `src/ui/widgets/registry.ts`, `rule.ts`, `embed.ts` — painters

**Detailed Design:** section 7, `text-view.ts`, `widgets/registry.ts`

**Tradeoffs:**

- Up to `rows` extra layouts on a large jump; normally one.
- Rejected computing visual rows in the reducer.

**Success Criteria:** S7, S18

**Verification Impact:**

- V15 — cursor fit; V16 — signs and widgets; V14 — viewport-only.

## W261003S6BQ-DES7: Terminal images through OpenTUI

**Question:** How are images decoded, sized, drawn, and tested?

**Decision:** `readImage` (workspace) supplies bytes through an app-injected `loadImage`; `ImageCache` (UI) decodes with `NativeImage.decode`, keeps 64 MiB LRU, and requests a repaint on load; `imageTier` wraps `resolveImageRenderProtocol`; `paintImage` draws with `drawImage(…, protocol)` or a placeholder; sizes reach core only through `ViewHost.imageSize`.

**Requirements Addressed:** W261003S6BQ-REQ2@R1

**Research Support:** None

**Rationale:** Uses OpenTUI's maintained encoders, adds no native dependency, keeps image bytes out of state, and makes tier selection testable by injecting capabilities.

**Code Impact:**

- `src/workspace/images.ts` — `readImage`
- `src/ui/images.ts` — `imageTier`, `ImageCache`
- `src/ui/widgets/image.ts` — `paintImage`
- `src/core/lang/markdown/renderers/image.ts` — `imageRenderer`
- `src/ui/shell.ts` — `ShellDeps.loadImage`, `capabilities`

**Detailed Design:** section 7, `images.ts` (both), `widgets/image.ts`, `renderers/image.ts`, `shell.ts`

**Tradeoffs:**

- Placement clearing is OpenTUI's; the V43 spike confirms it before painters are built.
- SVG shows a placeholder in the terminal.

**Success Criteria:** S8

**Verification Impact:**

- V17 — rows; V18 — tiers (V8@R1); V19, V40 — cache; V43 — spike.

## W261003S6BQ-DES8: Markdown commands and read-only views

**Question:** Where do the view, task, and fold commands live, how does `Enter` behave, and how is reading mode enforced?

**Decision:** `src/core/state/markdown-commands.ts` registers `view.cycle`, `task.toggle`, `fold.toggle`, `note.enter`, `preview.start`, `preview.stop` with Markdown bindings (`<leader>m`, `<leader>x`, `za`, `<CR>`); `<CR>` moves from `link.follow` to `note.enter`; `runVim` discards edit results in a `readOnly` view and shows the hint.

**Requirements Addressed:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ6@R1

**Research Support:** None

**Rationale:** Commands read `AppState`, which `core/lang` may not import; the link-commands pattern already exists. One `Enter` command satisfies both UI-design rows (task and link).

**Code Impact:**

- `src/core/state/markdown-commands.ts` — commands and bindings
- `src/core/state/link-commands.ts` — `<CR>` removed, `followLink` exported
- `src/core/state/keys.ts` — `runVim`, `READ_ONLY_HINT`
- `src/app/main.ts`, `test/support/state.ts` — registration

**Detailed Design:** section 7, `markdown-commands.ts`, `keys.ts`, `{status,session,picker,commands,link-commands,init}.ts`

**Tradeoffs:**

- Module home differs from the phase file's `lang/markdown/commands.ts`; reported for parent synchronization.

**Success Criteria:** S9

**Verification Impact:**

- V2, V3 — commands and file-type limits; V37 — reading refusal; V25 — code files.

## W261003S6BQ-DES9: Pure HTML rendering

**Question:** How is a note rendered for the browser?

**Decision:** `renderHtml(doc, text, ctx)` serializes each block's cached mdast with a small hand-written serializer covering CommonMark, GFM, math, and the Obsidian nodes; every text and attribute is escaped and raw HTML is emitted as text; math and Mermaid are emitted as escaped source in `.math[data-tex]` and `pre.mermaid` for the page to render; blocks are wrapped in `<section data-line data-hash>`; embeds recurse one level.

**Requirements Addressed:** W261003S6BQ-REQ8@R1, W261003S6BQ-REQ1@R1

**Research Support:** None

**Rationale:** The Obsidian node types need custom handlers in any serializer, so a small one avoids two more dependencies; escaping everything removes XSS from a page that can read workspace files; emitting source keeps the server free of browser libraries and makes the source the natural render-error fallback.

**Code Impact:**

- `src/core/lang/markdown/html.ts` — `HtmlCtx`, `renderHtml`, `escapeHtml`
- `src/core/state/preview.ts` — `htmlCtx`

**Detailed Design:** section 7, `html.ts`, `preview.ts`

**Tradeoffs:**

- Raw HTML in notes is not rendered in the preview; rejected `mdast-util-to-hast` + `hast-util-to-html` (two dependencies, custom handlers still needed).

**Success Criteria:** S10

**Verification Impact:**

- V20 — structure; V21 — escaping; V24 — closed-note render.

## W261003S6BQ-DES10: Preview server

**Question:** How is the preview served safely and kept in sync?

**Decision:** `startPreviewServer({root, store, isExcluded})` binds `127.0.0.1:0`, enforces the Host allowlist (403), GET only (405), realpath + hidden + injected-exclusion containment (404); serves the page at `/` and `/<path>`, the embedded files at `/assets/<name>` (only `ASSETS` keys, else 404), `/render`, `/file/*`, `/events`; every response carries `SECURITY_HEADERS` (same-origin Content Security Policy, `nosniff`, `no-referrer`) and `/file/*` uses the sandboxing `FILE_CSP`; broadcasts `doc {path, version, line}` after a 100 ms debounce from `followTarget`; stops in the order unsubscribe → `stopped` → close → `server.stop(true)`.

**Requirements Addressed:** W261003S6BQ-REQ8@R1, W261003S6BQ-REQ7@R2, W261003S6BQ-REQ1@R1

**Research Support:** None

**Rationale:** Implements RM261003ABZP-DES13@R2 with the parent invariants; injecting `isExcluded` keeps `src/preview` free of `src/workspace` imports. One header set on every response is the simplest way to make the policy impossible to forget on a new route, and a map lookup for assets keeps request paths away from the disk.

**Code Impact:**

- `src/preview/server.ts` — `startPreviewServer`, `SECURITY_HEADERS`, `FILE_CSP`

**Detailed Design:** section 7, `src/preview/server.ts`

**Tradeoffs:**

- The `doc` payload uses `line` instead of `anchor`; reported for parent synchronization.
- `Cache-Control: no-cache` on the page and assets makes the browser revalidate on each page load; immutable caching was rejected because asset names carry no version and a later binary may reuse the port. Loopback transfer cost is negligible.

**Success Criteria:** S11, S12, S13

**Verification Impact:**

- V26–V28 — safety; V34 — headers and asset routes; V22, V23 — follow; V30 — stop order.

## W261003S6BQ-DES11: Preview lifecycle in state, effects, and the statusline

**Question:** How do `:Preview` and `:PreviewStop` reach the server, the browser, and the statusline?

**Decision:** `AppState.preview` (`off | starting | on(port)`); effects `startPreview`, `stopPreview`, `openUrl`; actions `previewStarted`, `previewStopped`, `previewFailed`, `openUrlFailed`; `src/app/preview-host.ts` owns one server; `openUrl` uses `open`/`xdg-open`; `installLifecycle` stops the preview before terminal restore; the statusline gains `preview :<port>` / `preview off`.

**Requirements Addressed:** W261003S6BQ-REQ8@R1

**Research Support:** None

**Rationale:** Same effect-and-host pattern as indexing; idempotent commands; the exit order guarantees `stopped`.

**Code Impact:**

- `src/core/state/{types,preview,update,init,status,commands}.ts`
- `src/app/{preview-host,effects,lifecycle,main}.ts`
- `src/workspace/system.ts` — `openUrl`
- `src/ui/views/statusline.ts`

**Detailed Design:** section 7, `preview.ts`, `types.ts`, `src/app/*`, `system.ts`, `{status,…}.ts`, `ui/{shell,…}.ts`

**Tradeoffs:**

- A `starting` state is added to the parent's `off | on(port)` to make a double `:Preview` harmless.

**Success Criteria:** S12, S17

**Verification Impact:**

- V29, V31, V3 — reducers; V32 — launch failure; V33 — exit; V36 — segments.

## W261003S6BQ-DES12: Preview page delivery

**Question:** How does the page ship in the binary, and where do KaTeX and Mermaid come from?

**Decision:** `katex` and `mermaid` are exact-pinned npm dependencies imported only from `src/preview/`. `assets.ts` imports the page's `page.html`, `page.js`, and `page.css`, KaTeX's script, stylesheet, and woff2 fonts, and Mermaid's minified browser bundle `with { type: "file" }`, so `bun build --compile` embeds them; the server serves them at `/` and `/assets/<name>` with exact content types and `SECURITY_HEADERS`. `page.html` has no inline script or style. `page.js` follows `doc` events, renders math with KaTeX (`throwOnError: false`) and diagrams with Mermaid (`securityLevel: "strict"`), and keeps a block's source on a render error. Styles allow `'unsafe-inline'` for Mermaid; scripts, fonts, images, and connections are `'self'` only.

**Requirements Addressed:** W261003S6BQ-REQ7@R2, W261003S6BQ-REQ8@R1

**Research Support:** None

**Rationale:** The user decided on 2026-10-04 that no third-party origin may run code in a page that shows private notes. Embedding pinned packages uses Bun's single-binary mechanism with no front-end build step, and exact pins plus the lockfile give the tamper protection SRI gave. Page code in files keeps the policy free of nonces. Mermaid writes per-diagram `<style>` elements and `style` attributes that no hash or nonce can cover; inline CSS cannot run code, and the other directives block every URL it could use to send data out.

**Code Impact:**

- `src/preview/assets.ts` — `PreviewAsset`, `PAGE`, `ASSETS`; `src/preview/assets.d.ts`
- `src/preview/page.html`, `src/preview/page.js`, `src/preview/page.css`
- `src/preview/server.ts` — `/assets/<name>` route, `SECURITY_HEADERS`
- `package.json`, `bun.lock` — `katex`, `mermaid`; `test/boundaries.test.ts` — `PACKAGE_HOMES`, `checkImports`

**Detailed Design:** section 7, `src/preview/assets.ts`, `assets.d.ts`, `page.html`, `page.js`, `page.css`; `src/preview/server.ts`; `test/boundaries.test.ts`

**Tradeoffs:**

- The binary grows by several MB (Mermaid about 3 MB, KaTeX under 1 MB); accepted, no size budget; startup unaffected.
- Only woff2 fonts are embedded; every targeted browser picks woff2 first.
- Inline styles allowed for Mermaid; rejected unstyled diagrams (`style-src 'self'`) and moving Mermaid's CSS into constructed stylesheets (depends on Mermaid internals).
- Reverses the parent DES13@R2 tradeoff and the PH2/DI3 exclusion; pending parent synchronization.

**Success Criteria:** S13

**Verification Impact:**

- V34 — headers, asset type, unknown asset, no editing controls; V48 — same-origin file set and font coverage; V35 — compiled binary without `node_modules`; V47 — package homes; V42 — manual UV9 checklist offline.

## W261003S6BQ-DES13: Preview configuration

**Question:** Which options configure views, embeds, and images?

**Decision:** `preview` strict section: `mode` (`live|source|reading`, default `live`), `embedMaxRows` (1–200, default 10), `images` (`auto|blocks|off`, default `auto`).

**Requirements Addressed:** W261003S6BQ-REQ4@R1, W261003S6BQ-REQ1@R1, W261003S6BQ-REQ6@R1

**Research Support:** None

**Rationale:** Implements RM261003ABZP-DES14@R2's `preview.*` with the existing schema pattern.

**Code Impact:**

- `src/core/config/schema.ts` — `ConfigSchema.preview`

**Detailed Design:** section 7, `src/core/config/schema.ts`

**Tradeoffs:**

- `mode` applies to any file type with that view id, not only Markdown; code files have only `source`, so the effect is the same in v1.

**Success Criteria:** S14, S1

**Verification Impact:**

- V39 — defaults and errors.

## W261003S6BQ-DES14: Benchmarks and registration proof

**Question:** How are V12 and V16 proved?

**Decision:** Add `liveKeystrokeP95`, `sourceOpenFile`, `liveScrollFrameP95`, `sourceScrollFrameP95` to `TARGETS` with three bench scripts and a shared TypeScript generator; prove registration-only extension in `test/ui/extension.test.ts` with `csv` and `grid`.

**Requirements Addressed:** W261003S6BQ-REQ1@R1

**Research Support:** None

**Rationale:** Reuses the existing gate and bench pattern; `openFile` becomes the live-note open automatically.

**Code Impact:**

- `scripts/bench-gate.ts` — `TARGETS`, `BENCHES`
- `test/bench/{live-keystroke,source-open,scroll}.bench.ts`, `source-keystroke.bench.ts`
- `test/fixtures/generate.ts` — `make5000LineTs`
- `test/ui/extension.test.ts`

**Detailed Design:** section 7, `scripts/bench-gate.ts` and `test/bench/*`; `test/boundaries.test.ts`, `package.json`, `test/support/*`, fixtures

**Tradeoffs:**

- Four more benches add CI time; V46 re-checks the 3 min budget.

**Success Criteria:** S15, S16

**Verification Impact:**

- V44, V45 — benches; V38, V41 — registration; V46 — CI timing.
