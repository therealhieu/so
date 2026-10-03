# W261003S6BQ: Live and browser preview — Requirements

**Document Status:** Ready for System Design

**Context Source:** `w261003s6bq-discuss-context.md`

**Research Source:** None

**Unresolved Items:** None

**Ready for System Design Checklist:**

- [x] Every active topic is covered.
- [x] Every current requirement has a stable, unique ID and exact current revision.
- [x] Every current requirement includes its question, answer, rationale, acceptance criteria, and dependencies.
- [x] Scope, constraints, assumptions, risks, and compatibility boundaries are explicit.
- [x] For roadmap-linked work, the accepted parent baseline has been checked, assigned scope is covered by current requirements, and gates due before requirements approval have evidence; unresolved parent impacts prevent readiness.
- [x] Revised and replaced requirements preserve append-only lineage and complete prior revisions.
- [x] When research exists, every RF-to-evaluated-revision relationship has one reconciliation outcome; a finding that evaluated no requirement has one `None` relationship row.
- [x] Deferred decisions are outside the current-requirements ledger.
- [x] `Unresolved Items` is `None`.

**Approval evidence:** Self-drive of this discussion approved by the user on 2026-10-04, with the criteria "stable, simple, easy to maintain and extend" and "follow industry standards and comply project standards". Under that delegation the agent aligned the overview (topics T1–T4), decided each requirement below by choosing the option that best meets those criteria, and skipped external research because the open questions are local behaviour that installed packages and a planning spike settle (Discussion Evidence below).

Serving KaTeX and Mermaid from the repository instead of jsDelivr (W261003S6BQ-REQ7@R2) was decided by the user on 2026-10-04; the mechanism (embedded files, same-origin Content Security Policy) was chosen under the same self-drive delegation. Loading web images in the terminal (W261003S6BQ-REQ2@R2) and in the page (W261003S6BQ-REQ7@R3) was decided by the user on 2026-10-04.

# Table of Contents

1. [Problem and Desired Outcome](#1-problem-and-desired-outcome)
2. [Current and Expected State](#2-current-and-expected-state)
3. [Scope](#3-scope)
4. [Standards and Constraints](#4-standards-and-constraints)
5. [Current Requirements](#5-current-requirements)
   - [W261003S6BQ-REQ1@R1: Inherited DI3 obligations](#w261003s6bq-req1r1-inherited-di3-obligations)
   - [W261003S6BQ-REQ2@R2: Images through OpenTUI's native decoder and drawImage](#w261003s6bq-req2r2-images-through-opentuis-native-decoder-and-drawimage)
   - [W261003S6BQ-REQ3@R1: Math and Mermaid text renderers](#w261003s6bq-req3r1-math-and-mermaid-text-renderers)
   - [W261003S6BQ-REQ4@R1: Note embeds through unlisted buffers](#w261003s6bq-req4r1-note-embeds-through-unlisted-buffers)
   - [W261003S6BQ-REQ5@R1: Folds, widget rows, and scrolling](#w261003s6bq-req5r1-folds-widget-rows-and-scrolling)
   - [W261003S6BQ-REQ6@R1: View input wiring and restored views](#w261003s6bq-req6r1-view-input-wiring-and-restored-views)
   - [W261003S6BQ-REQ7@R3: Preview page delivery and locally served browser libraries](#w261003s6bq-req7r3-preview-page-delivery-and-locally-served-browser-libraries)
   - [W261003S6BQ-REQ8@R1: Preview follow protocol and browser launch](#w261003s6bq-req8r1-preview-follow-protocol-and-browser-launch)
6. [Research Impact Review](#6-research-impact-review)
7. [Historical Requirement Revisions](#7-historical-requirement-revisions)

# 1. Problem and Desired Outcome

## Problem Statement

Markdown notes still render as highlighted source. PH1 registered only a `source` view on `markdownFileType` (`src/core/lang/markdown/file-type.ts:10`), the text view paints neither signs nor widgets and always passes an empty fold set (`src/ui/editors/text-view.ts:396-419`), and no preview server exists. RM261003ABZP-DI3@R2 must add Obsidian-style live preview and a read-only browser mirror on top of the PH1 kernel without putting Markdown into the kernel or the UI, without laying out rows outside the viewport, and within the 16 ms keystroke budget.

## Desired Outcome

Markdown notes open in `live` view: syntax hides except on the cursor line or inside the cursor's block, and rich blocks, callout folds, note embeds, and images render on every terminal tier. `<leader>m` cycles live → source → reading. `:Preview` opens a read-only browser page that follows edits within 300 ms. The G4 outputs (`registerBlockRenderer`, widget row reservation, `widgetPainters`, unlisted embed buffers) ship with stable signatures for DI4, and code files keep the unchanged PH1 source view.

# 2. Current and Expected State

## Current State

```text
key → update → markdown analyze → b.analysis = Doc
        → EditorView.layout: layoutText(view{folds: ∅}, [highlightMarks, ...source.decorations(=[]), search, selection], b.analysis)
        → paint spans only (RenderLine signs and widgets ignored)
no preview state, no Bun.serve, no browser launch
```

`ViewSpec.input` exists in the registry (`src/core/filetypes/registry.ts:13`) but no caller uses it. `WindowState.content` has no `folds` (`src/core/state/types.ts:90`), `BufferState` has no `listed` flag, and the config schema has no `preview` section.

## Expected State

```text
key → update → markdown analyze → Doc
        → EditorView.layout: spec.input(Doc, viewContext(markdown, state)) → MarkdownViewInput{doc, view, ctx: PreviewCtx}
        → layoutText(view{folds}, [highlightMarks, livePreview → blockRenderers, search, selection], input)
        → paint spans + signs (▕, ⚠) + widget rows via widgetPainters (image, embed, rule)
        embed/image not loaded → reserve rows + "loading…" → read effect → fileLoaded(unlisted) / image bytes → re-layout

:Preview → startPreview → Bun.serve(127.0.0.1:0) → open/xdg-open (fail → toast with URL)
   edit / note switch → debounce 100 ms → SSE "doc" {path, version, line} → page GET /render → swap, flash changed blocks
   :PreviewStop | exit → SSE "stopped" → close streams → server.stop(true) → preview = off
```

# 3. Scope

## In Scope

- Everything in RM261003ABZP-DI3@R2 Scope (`rm261003abzp-roadmap-phase-2-obsidian-experience.md:332-349`), as refined by W261003S6BQ-REQ2@R2 … W261003S6BQ-REQ8@R1.
- The G4 outputs DI4 consumes, with the signatures in the phase design (`…phase-2…md:205-216`, `:72`).
- The `beautiful-mermaid` dependency (exact pin) for Mermaid text art, and the `katex` and `mermaid` dependencies (exact pins) served to the browser page.

## Out of Scope

- The `base` block renderer and `base` widget painter (DI4 through G4).
- Persisted fold state; any mutating preview route; live views, folding, or outline for code files (`…phase-2…md:350-355`).
- Nested embed expansion: an embed inside an embedded note renders as a link (W261003S6BQ-REQ4@R1).
- SVG images in the terminal: they show the text placeholder; the browser preview shows them (W261003S6BQ-REQ2@R2).
- Restoring a buffer's persisted `view` from the session file (W261003S6BQ-REQ6@R1). Future trigger: a user request to remember the view per note.
- Daily notes, templates, Bases (RM261003ABZP-DI4@R2); the PH2 exit dry run and any release.

## Roadmap Assignment

- **Binding and parent scope:** `w261003s6bq-discuss-context.md`, Roadmap Binding — RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2 (`rm261003abzp-roadmap-phase-2-obsidian-experience.md:315-396`).
- **Assigned requirement coverage:**

  | Parent requirement | Current W requirements |
  |---|---|
  | RM261003ABZP-REQ5@R2 - live preview | W261003S6BQ-REQ1@R1, W261003S6BQ-REQ2@R2, W261003S6BQ-REQ3@R1, W261003S6BQ-REQ4@R1, W261003S6BQ-REQ5@R1, W261003S6BQ-REQ6@R1 |
  | RM261003ABZP-REQ8@R2 - browser preview | W261003S6BQ-REQ1@R1, W261003S6BQ-REQ7@R3, W261003S6BQ-REQ8@R1 |
  | RM261003ABZP-REQ9@R2 - keystroke, open, scrolling | W261003S6BQ-REQ1@R1, W261003S6BQ-REQ3@R1 (first frame), W261003S6BQ-REQ5@R1 (viewport-only scrolling) |
  | RM261003ABZP-REQ11@R3 - registration-only extension, language-neutral kernel | W261003S6BQ-REQ1@R1, W261003S6BQ-REQ6@R1 |
  | RM261003ABZP-REQ10@R4 - budgets kept | W261003S6BQ-REQ1@R1 |

- **Baseline and due-gate assessment:** The parent references in the context binding were re-read on 2026-10-04 and match the phase file and index at `main` `6a04729`. Gate G2 (due before DI3 execution) is met: DI2 merged as `9adb285` (PR #2) with V4/V5/V6/V18 passing, and the PH1 exit is recorded (`…phase-2…md:576`, `:580`). No gate is due before requirements approval. G4 is produced by this Work.

  One parent impact is pending reconciliation. On 2026-10-04 the user decided that KaTeX and Mermaid are managed in this repository instead of loaded from jsDelivr (W261003S6BQ-REQ7@R2), and later that web images load in the page (W261003S6BQ-REQ7@R3) and in the terminal (W261003S6BQ-REQ2@R2); the latter changes the RM261003ABZP-design Security and privacy row "No network except loopback preview". That reverses the RM261003ABZP-DES13@R2 tradeoff "rejected bundling KaTeX/Mermaid into the binary", removes the PH2 out-of-scope line and the DI3 exclusion "Bundled KaTeX and Mermaid" (`…phase-2…md:35`, `:353`), changes DI3 scope "from jsDelivr" (`…phase-2…md:344`), and changes the offline expectation of RM261003ABZP-UDES10@R1 and RM261003ABZP-UV9@R1. The exact parent changes are recorded as `Pending parent synchronization` in the system design; parent files are not edited without explicit authorization.

## Affected Interfaces and Actors

- Note author in the terminal — sees live preview by default, cycles views, toggles tasks, folds callouts, expands embeds.
- Browser reader — sees a read-only mirror that follows edits.
- DI4 (RM261003ABZP-DI4@R2) — consumes `registerBlockRenderer`, `widget` row reservation, `widgetPainters`, and unlisted embed buffers.
- `core/kernel/view` — unchanged signatures; receives `folds` and new providers only.
- `core/filetypes` `ViewSpec.input` — first caller.
- `core/state` — adds `buffers[].listed`, window `folds`, `preview`, the view-context builder registry, and preview effects.
- `core/config` — adds the `preview` section.
- `src/ui/editors/text-view.ts`, `src/ui/widgets/*`, `src/ui/images.ts`, `src/ui/views/statusline.ts` — painting.
- `src/workspace/images.ts`, `src/workspace/system.ts` — image bytes and browser launch.
- `src/preview/*` — new server and page.

# 4. Standards and Constraints

## Binding Standards

- `.s1mple/docs/project.md` Boundaries — `core` pure; only `src/ui` imports `@opentui/*`; `src/preview` imports only `core`; package homes enforced by `test/boundaries.test.ts`. A new Markdown-rendering package belongs to `src/core/lang/markdown/`.
- `.s1mple/docs/project.md` Engineering Standards — exact npm pins; `knip` zero findings.
- `.s1mple/docs/languages/typescript.md` — strict TS 7, `import type`, colocated `bun:test` units named by behaviour; adapters report failures as result actions.
- `rm261003abzp-requirements.md:273` RM261003ABZP-REQ11@R3 — CommonMark 0.31.2 + GFM, Obsidian Flavored Markdown, `NO_COLOR`, registration over edits, a kernel free of Markdown.
- `rm261003abzp-design.md:409-417` — preview routes: `127.0.0.1`, Host allowlist (403), realpath and hidden-folder containment (404), no mutating route.
- W3C Content Security Policy Level 3 and the WHATWG HTML server-sent events model — the page runs only same-origin scripts and styles and uses `EventSource`.
- `.s1mple/S1MPLE.md` Implementation — no work-process identifiers in code.

## Constraints

- The downstream work boundary (`…phase-2…md:390-395`) forbids Markdown parsing in `src/ui`, layout outside the viewport, mutating preview routes, changes to `RenderLine`, the `layoutText` signature, or the G4 registry signatures, and Markdown knowledge in `core/kernel`.
- No new top-level `AppState` field beyond `preview` (`…phase-2…md:182-190`).
- State file stays `"version": 1`; fold state is not persisted.
- The single compiled binary (`bun build --compile`) must contain everything the app and the browser page need, including KaTeX and Mermaid.
- RM261003ABZP-REQ9@R2 targets hold: keystroke p95 < 16 ms, open < 50 ms, first frame < 200 ms, 60 fps scrolling.

## Accepted Assumptions

- OpenTUI 0.5.14 decodes png, jpeg, webp, and gif (`node_modules/@opentui/core/image.d.ts:2`, `ImageFormat`) and draws through `OptimizedBuffer.drawImage(…, protocol)` (`buffer.d.ts:63`); its `auto` protocol picks kitty, sixel (when the pixel resolution is known), or blocks (`index.bun.js:9253-9266`). A planning spike confirms placement and clearing in a partly scrolled view.
- `beautiful-mermaid@1.1.3` is MIT-licensed pure JavaScript with dependencies `elkjs` and `entities` (Alfred `node_modules/.bun/beautiful-mermaid@1.1.3/.../package.json`), and Alfred renders Mermaid text with it (`alfred/apps/tui/src/view/markdown/mermaid.ts:1`).
- Session restore opens buffers through the file type's default view and never reads the persisted `view` (`src/core/state/buffers.ts:337`; `src/core/state/session.ts:92` writes it only).
- Bun embeds a module imported `with { type: "text" }` in a compiled binary.

## Dependencies

- `parseDoc`, `blockNode`, `syntaxExtensions` (`src/core/lang/markdown/{doc,mdast,syntax}.ts`) — the single Doc that layout and HTML read (G2).
- `layoutText`, `Decoration`, `Widget`, `Sign` (`src/core/kernel/view/*`) — the provider host.
- `NoteIndex` / `resolveLink` — resolved-link style and wikilink `href`s.
- `@opentui/core` 0.5.14 image API — terminal images.
- `beautiful-mermaid` 1.1.3 (new, exact pin) — Mermaid text art.
- `katex` and `mermaid` (new, exact pins, imported only from `src/preview/`) — math and diagrams in the page, served from the binary.

## Risks and Compatibility

- **Keystroke budget** — live preview runs on every keystroke. Protection: viewport-only providers, block-hash caches for renderer output, and the V12 live-preview bench gated in CI.
- **First frame** — evaluating `beautiful-mermaid` and `elkjs` at startup could push the first frame past 200 ms. Protection: the V13 first-frame bench re-runs on the DI3 PR; W261003S6BQ-REQ3@R1 requires the target to hold.
- **Stale terminal images** — kitty and sixel placements outlive the cells that drew them. Protection: W261003S6BQ-REQ2@R2 requires clearing on scroll, view change, and buffer switch, verified by the planning spike and V8.
- **Binary size** — `elkjs` (terminal Mermaid) and the embedded `mermaid` and `katex` browser builds add several megabytes to the binary. Accepted: the release smoke test and V14 dry run still pass; no size budget exists.
- **Private notes in the browser** — the page shows note text, so any script it runs can read it. Protection: W261003S6BQ-REQ7@R3 serves only same-origin, exact-pinned code under a Content Security Policy that allows only same-origin scripts, styles, fonts, and connections; web images may load, and no Referer is sent.
- **Web image privacy and hangs** — viewing a note with web images tells each image host the viewer's IP address, and a slow host could stall rendering. Protection: W261003S6BQ-REQ2@R2 downloads only visible images, off the render path, with a 10 s timeout and a 16 MiB cap, sends no Cookie or Referer, and `preview.images = "off"` stops all downloads.
- **Obsidian compatibility** — notes are never rewritten by rendering; only `task.toggle` edits text, as a normal undoable edit.
- **DI4 contract** — G4 signatures are fixed by the phase design and must not change.

# 5. Current Requirements

## W261003S6BQ-REQ1@R1: Inherited DI3 obligations

**Requirement ID:** `W261003S6BQ-REQ1`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which parent obligations must this Work deliver unchanged?

**Answer:** All of RM261003ABZP-DI3@R2 as defined in the phase file:

- its Scope, Exclusions, and the DI3 rows, flows, and code shapes of the Phase Design (`…phase-2…md:130-135`, `:141`, `:143-241`);
- Design RM261003ABZP-DES5@R2, DES6@R2, DES9@R3, DES10@R2, DES13@R2, DES14@R2 (`preview.*`), DES16@R1, and DES17@R1 (`live` and `reading` views);
- Success RM261003ABZP-S5@R1, S8@R1, S9@R1, and S11@R1, with Verification RM261003ABZP-V7@R2, V8@R1, V11@R3, V12@R2, and V16@R2;
- the UI scope: M2@R1 (S1–S16), M7@R1, M1@R1 (segments); UREQ3@R2, UREQ4@R1, UREQ10@R1, UREQ6@R1 (unresolved-link style), UREQ1@R2 (segments), UREQ11@R1; UDES1@R2, UDES3@R2, UDES4@R1, UDES10@R1, UDES11@R1; US2@R2 via UV3@R2, US8@R1 via UV9@R1 (with the recorded manual check), US1@R2 via UV1@R2 (full), US9@R1 via UV10@R1 and UV9@R1;
- the G4 outputs with the phase-design signatures;
- the downstream work boundary (`…phase-2…md:390-395`).

The requirements below refine these. None waives one.

**Rationale:** The roadmap already fixes the architecture and contracts, so restating them would only create drift. One inheritance requirement gives planning a single traceable anchor, the pattern W261003HEGE-REQ1 and W261003FX70-REQ1 used.

**Acceptance Criteria:**

- [ ] Every parent REQ, DES, S, V, and UI record listed above maps to at least one decision in the W261003S6BQ system design.
- [ ] V7@R2, V8@R1, V11@R3, V12@R2, V16@R2, UV1@R2 (full), UV3@R2, UV10@R1 (DI3 states), and the automated part of UV9@R1 pass in CI on the DI3 PR; the UV9@R1 manual checklist is recorded.
- [ ] `bun run check` stays < 30 s and CI < 3 min (RM261003ABZP-REQ10@R4), and the V13@R1 startup benches still pass on the DI3 PR.
- [ ] `layoutText`'s signature, `RenderLine`, and the G4 signatures equal the phase design; the boundary test passes with no Markdown import in `core/kernel` and no Markdown parsing in `src/ui`.
- [ ] Every `AppState` field and `Action` or `Effect` variant DI3 adds is reported for parent synchronization; no DI4 variant is added.

**Depends On:** None

## W261003S6BQ-REQ2@R2: Images through OpenTUI's native decoder and drawImage

**Requirement ID:** `W261003S6BQ-REQ2`

**Revision:** `R2`

**Previous Revision:** `W261003S6BQ-REQ2@R1`

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** Web images (`http:` and `https:` targets) now load in the terminal too: `so` downloads them with a timeout and a size cap and keeps them only in the in-memory image cache. The user decided this on 2026-10-04.

**Question:** How are terminal images loaded, decoded, drawn on each tier, and tested?

**Answer:** `src/workspace/images.ts` loads image bytes on request: `readImage` reads a workspace file, and `fetchImage` downloads an `http:` or `https:` target with `fetch` (10 s timeout, 16 MiB response cap, no cookies, no Referer, at most 4 downloads at once). `src/app` injects that loader into the UI, which calls it only for images it is about to paint, so a note's web images download when they scroll into view. `src/ui/images.ts` decodes them with OpenTUI's `NativeImage.decode` (png, jpeg, webp, gif), keeps decoded images in a 64 MiB LRU, and the `image` widget painter draws with `OptimizedBuffer.drawImage(…, protocol)`. The protocol comes from a pure `imageTier(images, capabilities)`: `"off"` → text placeholder, `"blocks"` → `blocks`, `"auto"` → OpenTUI's `resolveImageRenderProtocol`. The painter receives the capabilities as an input, so tests inject each tier. SVG files, undecodable bytes, missing files, and failed downloads show `[image: <name>]` in the placeholder style; a web image shows `◌ <name>` while it downloads, like any image that is still loading. A failed download is retried after 60 s, so images appear once the internet is back. Downloaded bytes live only in memory; nothing is written to disk. `preview.images = "off"` paints placeholders and downloads nothing. No image package is added.

**Rationale:** OpenTUI already ships a native decoder and kitty, sixel, and block encoders, so porting Alfred's `sharp` and `sixel` path would add a native addon that complicates the four-target single-binary build and duplicate code OpenTUI maintains. A pure tier function makes V8 testable without patching the renderer's private capabilities, which the test renderer cannot override (`testing/test-renderer.d.ts:6-11`).

Web images matter because notes often reference them, and Bun's built-in `fetch` needs no package. Downloading only visible images keeps a long note from starting dozens of downloads, and the memory-only cache avoids a disk cache with its own eviction and staleness rules. The privacy cost is that viewing a note tells each image host the viewer's IP address; `preview.images = "off"` avoids it.

```text
widget{type:"image", data:{ref}} → painter(caps, images cfg) → imageTier → "off" → "[image: diagram.png]"
                                                               → kitty|sixel|blocks → LRU.get(ref) ?? decode(load(ref)) → drawImage(…, protocol)
load(ref) → http(s) URL ? fetchImage(url) (10 s, 16 MiB, failure → placeholder, retry after 60 s) : readImage(path)
```

**Acceptance Criteria:**

- [ ] With capabilities kitty, sixel (resolution known), none, and `preview.images = "off"`, the painter selects kitty, sixel, blocks, and the placeholder respectively (V8@R1), and the blocks tier writes block characters into the test renderer's cells.
- [ ] An SVG, a corrupt PNG, and a missing file each paint `[image: <name>]` without throwing and without changing the reserved row count.
- [ ] Decoded images stay within a 64 MiB LRU; evicted images are disposed.
- [ ] Scrolling an image partly off screen, switching view, and switching buffer leave no stale kitty or sixel placement (planning spike, then a component check).
- [ ] Only `src/ui` imports `@opentui/core`; `src/workspace/images.ts` reads bytes only and refuses paths outside the workspace.
- [ ] Against a local test server, `fetchImage` returns a PNG's bytes; a response over 16 MiB, a non-2xx status, a timeout, and a non-`http(s)` URL each fail without throwing into the UI and paint `[image: <name>]`; requests carry no Cookie or Referer header.
- [ ] A failed web image is fetched again only after 60 s; with `preview.images = "off"` no request is made.

**Depends On:** W261003S6BQ-REQ1@R1

## W261003S6BQ-REQ3@R1: Math and Mermaid text renderers

**Requirement ID:** `W261003S6BQ-REQ3`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How do math and Mermaid render in the terminal?

**Answer:** Math ports Alfred's `math.ts` as a pure renderer: inline and block TeX become Unicode text when every token maps, otherwise the TeX source shows unchanged in the math style. Mermaid uses `beautiful-mermaid` 1.1.3 (exact pin, imported only from `src/core/lang/markdown/`) to render ASCII box art for the diagram types it lays out. Other types and parse errors show the fenced source with a one-line `mermaid: <type> shown as source` label. Rendered output is cached by block hash. Inside the block the source is revealed as for any multi-line block.

**Rationale:** The accepted mockup RM261003ABZP-M2@R1 S15 shows a flowchart as box art, and Alfred proves the library in this role. A self-written flowchart renderer would cover fewer types and add code to maintain. Caching by block hash keeps the keystroke path from re-running the layout engine on unchanged diagrams.

**Acceptance Criteria:**

- [ ] `tour.md`'s `$E = mc^2$`, its `$$\sum … \frac{a}{b}$$` block, and its flowchart match the V7@R2 goldens at widths 60 and 100.
- [ ] An unsupported diagram type and a malformed flowchart render as source with the label; a throwing renderer falls back to source with the `⚠` sign (phase failure flow).
- [ ] Typing outside a Mermaid block does not call the Mermaid renderer again (call-count unit test).
- [ ] The V13@R1 first-frame bench still passes with the dependency included.
- [ ] `test/boundaries.test.ts` `PACKAGE_HOMES` lists `beautiful-mermaid` under `src/core/lang/markdown/`, and `package.json` pins it exactly.

**Depends On:** W261003S6BQ-REQ1@R1

## W261003S6BQ-REQ4@R1: Note embeds through unlisted buffers

**Requirement ID:** `W261003S6BQ-REQ4`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How do `![[note]]` and `![[note#Heading]]` load, render, and stay bounded?

**Answer:** The embed renderer resolves the target through NoteIndex. When the target is already an open buffer, it reads that buffer's `Doc`, so unsaved edits show. Otherwise `update` requests a `read` effect and stores the result as a buffer with `listed: false`, which is hidden from the bufferline, picker of open buffers, session snapshot, and autosave, and is evicted when no listed buffer's Doc embeds it. Until it loads, the widget reserves `min(embedMaxRows, 3)` rows showing `loading…`; an unresolved target shows the unresolved-link style. An embed shows at most `preview.embedMaxRows` rows (default 10, range 1–200) followed by `… N more lines`; `za` expands it fully; `Enter` opens the target. Embeds inside an embedded note render as links, not as further embeds.

**Rationale:** Reusing the `buffers` map follows the phase design and keeps one text model; reusing an open buffer keeps embeds live. One level of embedding removes cycle handling and unbounded work in the keystroke path, at the cost of Obsidian's deeper nesting. Ten rows keep an embed and its context visible at 80×24.

**Acceptance Criteria:**

- [ ] `![[so-roadmap#Goals]]` renders the Goals section, capped at 10 rows with `… N more lines`; `za` expands and collapses it (UV3@R2).
- [ ] A missing target shows the unresolved-link style; a loading target shows `loading…` in its reserved rows, then re-lays out.
- [ ] A note that embeds itself, or two notes that embed each other, render one level and terminate.
- [ ] Unlisted buffers never appear in the bufferline, the buffer picker, `state.json`, or an autosave write, and are evicted after the last embedding buffer closes.
- [ ] `preview.embedMaxRows` outside 1–200 is a config error naming its line.

**Depends On:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ5@R1

## W261003S6BQ-REQ5@R1: Folds, widget rows, and scrolling

**Requirement ID:** `W261003S6BQ-REQ5`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How do folds and reserved widget rows interact with the cursor and scrolling?

**Answer:** Window content gains `folds`, the set of folded or expanded blocks for that window, passed to `layoutText` as `TextView.folds`. A fold follows its block when lines are inserted or deleted above it and disappears when its block is deleted. Callouts written `[!type]-` start folded. Fold state is not persisted. The core's `scroll` stays a source line. `EditorView` lays out from `scroll` and, when the cursor's line falls below the painted rows because widgets or wrapping took space, advances its top line until the cursor row fits, as it already does for short windows (`src/ui/editors/text-view.ts:246-252`). Layout never runs outside the viewport.

**Rationale:** Computing visual rows in the reducer would duplicate layout in core and break the viewport-only rule. The UI already reconciles core scroll with its real height, so extending that reconciliation to reserved rows is the smallest change. Mapping folds through edits is the standard fold behaviour of Neovim and CodeMirror.

**Acceptance Criteria:**

- [ ] With a 20-row image above the cursor, `j` through the note keeps the cursor row visible in a 24-row terminal.
- [ ] `za` on a callout title folds it to one row with `▸`; inserting a line above keeps it folded; deleting the callout removes the fold.
- [ ] Opening a note with `> [!tip]-` shows that callout folded.
- [ ] Each frame lays out only the visible rows (provider call-count test).
- [ ] The state file format is unchanged.

**Depends On:** W261003S6BQ-REQ1@R1

## W261003S6BQ-REQ6@R1: View input wiring and restored views

**Requirement ID:** `W261003S6BQ-REQ6`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does the live-preview provider get its input without the kernel or UI knowing Markdown, and which view does a restored note use?

**Answer:** `core/state/view-context.ts` holds a registry of view-context builders keyed by file type; Markdown registers the builder that produces `PreviewCtx` from state and config. `EditorView` calls the active `ViewSpec.input(analysis, ctx)` when present, with `ctx` from that registry, and passes the result to `layoutText`; without an `input` hook it passes `analysis` as today. `markdownFileType.views` becomes `live` (default), `source`, `reading`. A restored or newly opened note opens in its file type's default view; the persisted `view` field stays in `state.json` unchanged and is not read.

**Rationale:** A builder registry keeps the UI generic, so the `csv` proof (V16@R2) can register its own input the same way. Not restoring the view needs no state-format change and gives PH1 sessions the new default without migration.

**Acceptance Criteria:**

- [ ] `src/ui/editors/text-view.ts` contains no Markdown import or identifier; the `csv` test file type supplies its own view input through registration (V16@R2).
- [ ] A Markdown buffer opens in `live`; `<leader>m` cycles live → source → reading; the statusline `view` segment shows the mode; reading mode refuses edits with the hint.
- [ ] A session saved by PH1 with `view: "source"` restores the note in `live`.
- [ ] Code files keep the `source` view, and `<leader>m` leaves them unchanged (UV3@R2 `sync.ts` assertions).

**Depends On:** W261003S6BQ-REQ1@R1

## W261003S6BQ-REQ7@R3: Preview page delivery and locally served browser libraries

**Requirement ID:** `W261003S6BQ-REQ7`

**Revision:** `R3`

**Previous Revision:** `W261003S6BQ-REQ7@R2`

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** Images in the page may also load from the web (`http:` and `https:`), so a note's web images show whenever the internet is available. Scripts, styles, fonts, and connections stay same-origin, and KaTeX and Mermaid stay embedded. The user decided this on 2026-10-04.

**Question:** How is the page delivered from a single binary, and where do KaTeX and Mermaid come from?

**Answer:** `katex` and `mermaid` are exact-pinned npm dependencies, imported only from `src/preview/`. Their browser builds (KaTeX script, stylesheet, and the woff2 fonts it references; Mermaid's minified bundle), together with the page's own `page.html`, `page.js`, and `page.css`, are imported as embedded files so `bun build --compile` includes them. The server serves the page at `/` and the files at `/assets/<name>` with exact content types. Every response that serves the page or an asset carries a `Content-Security-Policy` that allows scripts, styles, fonts, and connections only from `'self'` and images from `'self'`, `data:`, `http:`, and `https:` (no inline script, no form action, no framing; inline styles are allowed because Mermaid writes per-diagram `<style>` into its SVG, and CSS alone cannot run code or reach another origin), `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer`. `renderHtml` keeps an `http:` or `https:` image URL as the image `src`; every other image target resolves to `/file/<path>` or is dropped. Offline, a web image shows the browser's broken-image icon and its alt text. A KaTeX or Mermaid render error shows that block's source. The page follows M7@R1: light and dark themes with a toggle, the four badges, the paused-follow banner, and a 375 px layout, with no forms and no editing controls.

**Rationale:** Notes are private, and a script from a third-party origin runs with full access to the page. Serving pinned packages from the app's own origin removes that trust in jsDelivr, makes the page work offline, and lets a same-origin Content Security Policy prove that nothing leaves the machine. Exact npm pins and the lockfile give the same tamper protection SRI gave, through the project's existing dependency rules. The cost is a larger binary (Mermaid's bundle is several megabytes), which the project accepts: it has no size budget.

Web images are allowed because notes often reference them. An image cannot run code, and because no Referer is sent, the image host learns the viewer's IP address and the image URL but nothing from the note.

```text
browser → GET / → page.html (CSP: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: http: https:; connect-src 'self'; …)
        → GET /assets/page.js, /assets/katex.min.js, /assets/mermaid.min.js, /assets/katex.min.css, /assets/fonts/*.woff2   (embedded in the binary)
        → EventSource /events, fetch /render?path=…                                                               (same origin only)
```

**Acceptance Criteria:**

- [ ] `package.json` pins `katex` and `mermaid` exactly, and `test/boundaries.test.ts` `PACKAGE_HOMES` allows them only in `src/preview/`.
- [ ] A compiled binary serves `/` and every `/assets/*` file with no `node_modules` and no other file on disk besides the workspace; an unknown asset returns 404.
- [ ] The page and every served file reference no origin other than the server's own; `/` responds with the Content Security Policy, `nosniff`, and `no-referrer` headers.
- [ ] A note containing `![chart](https://example.com/chart.png)` renders `<img src="https://example.com/chart.png" alt="chart">`; a `javascript:` image target never reaches the output; the policy's `img-src` allows `http:` and `https:` while `script-src`, `font-src`, and `connect-src` stay `'self'`.
- [ ] Offline, math and Mermaid render in the page; a malformed formula or diagram shows its source (UV9@R1 manual checklist).
- [ ] The page passes UV9@R1 semantics and contrast at 1200 px and 375 px in both themes.

**Depends On:** W261003S6BQ-REQ1@R1

## W261003S6BQ-REQ8@R1: Preview follow protocol and browser launch

**Requirement ID:** `W261003S6BQ-REQ8`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does the page follow edits and note switches, and how is the browser opened?

**Answer:** `renderHtml` emits each top-level block with `data-line` (first source line) and `data-hash` (the Doc block hash). The SSE `doc` event carries only `{path, version, line}`, where `line` is the cursor line; the page then requests `/render?path=…`, swaps the content, flashes blocks whose hash is new, and scrolls the block containing `line` into view. Following a wikilink in the page loads that note and pauses follow with a banner until the user resumes. `:Preview` starts the server, then opens the URL with `open` on macOS or `xdg-open` on Linux through `src/workspace/system.ts`; a launch failure shows a toast with the URL and keeps the server running. A second `:Preview` while running reopens the browser on the same port.

**Rationale:** Sending a small event and fetching HTML keeps the parent flow (`SSE doc → GET /render → swap`), lets the browser cache nothing stale, and makes the changed-block highlight a hash comparison instead of a DOM-diff library. `open` and `xdg-open` are the platform-standard launchers.

**Acceptance Criteria:**

- [ ] An edit produces an SSE `doc` event < 300 ms later, and `/render` reflects it (V11@R3).
- [ ] Editing one paragraph flashes only that block; the page scrolls to the cursor's block.
- [ ] Switching to `scripts/sync.ts` sends no `doc` event, and `/render` still returns the last note (V11@R3).
- [ ] With the launcher missing, `:Preview` shows a toast containing `http://127.0.0.1:<port>/` and the server keeps serving.
- [ ] `:PreviewStop` and a clean exit deliver `stopped` before the stream closes (V11@R3), and the statusline `preview` segment disappears.

**Depends On:** W261003S6BQ-REQ1@R1, W261003S6BQ-REQ7@R3

# 6. Research Impact Review

None — research was skipped.

**Discussion Evidence:** The open questions were local and were settled from installed packages and the codebase:

- OpenTUI 0.5.14 image formats, `drawImage`, and protocol resolution: `node_modules/@opentui/core/image.d.ts:2,80-114`, `buffer.d.ts:63`, `renderables/Image.d.ts:14`, `index.bun.js:9253-9266`.
- No capability override in the test renderer: `node_modules/@opentui/core/testing/test-renderer.d.ts:6-11`.
- `beautiful-mermaid` 1.1.3 license, dependencies, and Alfred usage: Alfred `node_modules/.bun/beautiful-mermaid@1.1.3/node_modules/beautiful-mermaid/package.json`, `apps/tui/src/view/markdown/mermaid.ts:1`.
- Persisted `view` written but not restored: `src/core/state/session.ts:92`, `src/core/state/buffers.ts:337`.
- M2 S15 box art and the demo embed cap: `ui-mockups/m2-live-preview.html` states S11, S15, S16.

Placement and clearing of kitty and sixel images in a partly scrolled view remain to be confirmed by a planning spike (W261003S6BQ-REQ2@R2).

# 7. Historical Requirement Revisions

## W261003S6BQ-REQ7@R1: Preview page delivery and browser assets

**Requirement ID:** `W261003S6BQ-REQ7`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261003S6BQ-REQ7@R2`

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How is the page delivered from a single binary, and how are KaTeX and Mermaid loaded?

**Answer:** `src/preview/page.html` is one file with inline CSS and script, imported `with { type: "text" }` so `bun build --compile` embeds it, and served at `/`. It loads KaTeX and Mermaid from jsDelivr at exact versions with Subresource Integrity hashes and `crossorigin="anonymous"`. When they fail to load, math and diagrams show their source. The CSS follows M7@R1: light and dark themes with a toggle, the four badges, the paused-follow banner, and a 375 px layout. The page has no forms and no editing controls.

**Rationale:** A single embedded file keeps the binary self-contained without a front-end build step. Exact CDN versions with SRI follow the W3C standard for third-party scripts and keep the page reproducible.

**Acceptance Criteria:**

- [ ] A compiled binary serves the page with no file on disk besides the workspace.
- [ ] Every CDN `<script>` and `<link>` has an exact version, an `integrity` hash, and `crossorigin`.
- [ ] Offline, the page renders math and Mermaid as source and still follows edits (UV9@R1 manual checklist).
- [ ] The page passes UV9@R1 semantics and contrast at 1200 px and 375 px in both themes.

**Depends On:** W261003S6BQ-REQ1@R1

## W261003S6BQ-REQ7@R2: Preview page delivery and locally served browser libraries

**Requirement ID:** `W261003S6BQ-REQ7`

**Revision:** `R2`

**Previous Revision:** `W261003S6BQ-REQ7@R1`

**Replaces:** None

**Status:** Revised by `W261003S6BQ-REQ7@R3`

**Research Relationship:** None — not research-informed

**Revision Summary:** The page no longer loads KaTeX and Mermaid from jsDelivr. Both become exact-pinned npm dependencies whose browser builds are embedded in the binary and served by the preview server from its own origin, under a Content Security Policy that allows only that origin. Math and diagrams now work offline. The user decided this on 2026-10-04 so that third-party code never runs in a page that shows private notes.

**Question:** How is the page delivered from a single binary, and where do KaTeX and Mermaid come from?

**Answer:** `katex` and `mermaid` are exact-pinned npm dependencies, imported only from `src/preview/`. Their browser builds (KaTeX script, stylesheet, and the woff2 fonts it references; Mermaid's minified bundle), together with the page's own `page.html`, `page.js`, and `page.css`, are imported as embedded files so `bun build --compile` includes them. The server serves the page at `/` and the files at `/assets/<name>` with exact content types. Every response that serves the page or an asset carries `Content-Security-Policy` restricted to `'self'` (no inline script, no third-party origin, no form action, no framing; inline styles are allowed because Mermaid writes per-diagram `<style>` into its SVG, and CSS alone cannot run code or reach another origin), `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer`. A KaTeX or Mermaid render error shows that block's source. The page follows M7@R1: light and dark themes with a toggle, the four badges, the paused-follow banner, and a 375 px layout, with no forms and no editing controls.

**Rationale:** Notes are private, and a script from a third-party origin runs with full access to the page. Serving pinned packages from the app's own origin removes that trust in jsDelivr, makes the page work offline, and lets a same-origin Content Security Policy prove that nothing leaves the machine. Exact npm pins and the lockfile give the same tamper protection SRI gave, through the project's existing dependency rules. The cost is a larger binary (Mermaid's bundle is several megabytes), which the project accepts: it has no size budget.

```text
browser → GET / → page.html (CSP: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; …)
        → GET /assets/page.js, /assets/katex.min.js, /assets/mermaid.min.js, /assets/katex.min.css, /assets/fonts/*.woff2   (embedded in the binary)
        → EventSource /events, fetch /render?path=…                                                               (same origin only)
```

**Acceptance Criteria:**

- [ ] `package.json` pins `katex` and `mermaid` exactly, and `test/boundaries.test.ts` `PACKAGE_HOMES` allows them only in `src/preview/`.
- [ ] A compiled binary serves `/` and every `/assets/*` file with no `node_modules` and no other file on disk besides the workspace; an unknown asset returns 404.
- [ ] The page and every served file reference no origin other than the server's own; `/` responds with the Content Security Policy, `nosniff`, and `no-referrer` headers.
- [ ] Offline, math and Mermaid render in the page; a malformed formula or diagram shows its source (UV9@R1 manual checklist).
- [ ] The page passes UV9@R1 semantics and contrast at 1200 px and 375 px in both themes.

**Depends On:** W261003S6BQ-REQ1@R1

## W261003S6BQ-REQ2@R1: Images through OpenTUI's native decoder and drawImage

**Requirement ID:** `W261003S6BQ-REQ2`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261003S6BQ-REQ2@R2`

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How are terminal images decoded, drawn on each tier, and tested?

**Answer:** `src/workspace/images.ts` reads image bytes on request; `src/app` injects that loader into the UI. `src/ui/images.ts` decodes them with OpenTUI's `NativeImage.decode` (png, jpeg, webp, gif), keeps decoded images in a 64 MiB LRU, and the `image` widget painter draws with `OptimizedBuffer.drawImage(…, protocol)`. The protocol comes from a pure `imageTier(images, capabilities)`: `"off"` → text placeholder, `"blocks"` → `blocks`, `"auto"` → OpenTUI's `resolveImageRenderProtocol`. The painter receives the capabilities as an input, so tests inject each tier. SVG files, undecodable bytes, and missing files show `[image: <name>]` in the placeholder style. No image package is added.

**Rationale:** OpenTUI already ships a native decoder and kitty, sixel, and block encoders, so porting Alfred's `sharp` and `sixel` path would add a native addon that complicates the four-target single-binary build and duplicate code OpenTUI maintains. A pure tier function makes V8 testable without patching the renderer's private capabilities, which the test renderer cannot override (`testing/test-renderer.d.ts:6-11`).

```text
widget{type:"image", data:{ref}} → painter(caps, images cfg) → imageTier → "off" → "[image: diagram.png]"
                                                               → kitty|sixel|blocks → LRU.get(ref) ?? decode(load(ref)) → drawImage(…, protocol)
```

**Acceptance Criteria:**

- [ ] With capabilities kitty, sixel (resolution known), none, and `preview.images = "off"`, the painter selects kitty, sixel, blocks, and the placeholder respectively (V8@R1), and the blocks tier writes block characters into the test renderer's cells.
- [ ] An SVG, a corrupt PNG, and a missing file each paint `[image: <name>]` without throwing and without changing the reserved row count.
- [ ] Decoded images stay within a 64 MiB LRU; evicted images are disposed.
- [ ] Scrolling an image partly off screen, switching view, and switching buffer leave no stale kitty or sixel placement (planning spike, then a component check).
- [ ] Only `src/ui` imports `@opentui/core`; `src/workspace/images.ts` reads bytes only and refuses paths outside the workspace.

**Depends On:** W261003S6BQ-REQ1@R1
