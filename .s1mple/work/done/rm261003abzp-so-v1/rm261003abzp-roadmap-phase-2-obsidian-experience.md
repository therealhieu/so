# RM261003ABZP: Obsidian experience — Roadmap Phase

- **Phase:** RM261003ABZP-PH2@R6
- **Approval status:** Approved
- **Index:** `rm261003abzp-roadmap-index.md`
- **History:** `rm261003abzp-roadmap-phase-2-obsidian-experience-revisions.md`

Phase Design separates inherited decisions from phase-specific refinements. Progress records describe delivery, not definition changes. DI3 is delivered by W261003S6BQ in PR #6 and DI4 by W26100423LX in PR #8, and PH2 is complete.

## Phase Definition

- **Outcome:** On top of the PH1 editor, the user gets four capabilities. Together they complete the v1 scope, release-ready as `v1.0.0` (published only when the user asks):
  - Notes render in Obsidian-style live preview (reveal at the cursor, rich blocks, folds, embeds, and inline images), with source and reading modes.
  - `:Preview` mirrors the note read-only in the browser.
  - `:Today` and template insertion work in one or two keystrokes.
  - `.base` files open as editable table views and embed in notes. Kanban views open as a table with a notice until their Obsidian `type` is verified.

  Live preview is one decoration provider on the PH1 kernel, and Bases is one registered editor kind, so code files keep the PH1 source view unchanged.
- **Rationale:** Both DIs build only on PH1's Doc, index, registry, pickers, and write path. They do not depend on each other, except that Base embeds use DI3's block-renderer registry. That makes two parallel, independently valuable PRs:
  - **Rendering (DI3):** the terminal and browser share one Doc → layout/HTML pipeline.
  - **Structured notes (DI4):** daily notes, templates, and Bases share date formatting and frontmatter writes.

  A third phase would add only process.
- **In scope:**
  - RM261003ABZP-REQ5@R2 - live preview.
  - RM261003ABZP-REQ8@R2 - browser preview.
  - RM261003ABZP-REQ6@R2 - daily notes and templates.
  - RM261003ABZP-REQ7@R2 - Bases table and Kanban, with embeds.
  - RM261003ABZP-REQ9@R3 - keystroke and open targets in live preview and in a large code file (RM261003ABZP-V12@R3).
  - RM261003ABZP-REQ11@R3 - registration-only extension proof, including a test-only `csv` file type (RM261003ABZP-V16@R2).
  - The non-publishing release dry run at phase exit; the `v1.0.0` release only when the user asks.
- **Out of scope:**
  - Bases layouts beyond table and Kanban (they open as a table with a notice).
  - Configurable calendar week start (Monday is fixed, per RM261003ABZP-UDES8@R1).
  - Everything in the index's Deferred Scope.
- **Delivery items:** RM261003ABZP-DI3@R4, RM261003ABZP-DI4@R2
- **Predecessors:** RM261003ABZP-PH2@R1, RM261003ABZP-PH2@R2, RM261003ABZP-PH2@R3, RM261003ABZP-PH2@R4

## Baseline and Dependencies

- **Context:** `rm261003abzp-roadmap-context.md@R2` - v1 stays Markdown-first on a language-neutral core. Alfred is the porting reference for the layout and reveal units, terminal graphics, the math and Mermaid text renderers, and the Bases engine (`alfred/packages/vault/src/domain/bases/*`, `alfred/packages/view-model/src/base/*`).
- **Requirements:** `rm261003abzp-requirements.md`:
  - RM261003ABZP-REQ5@R2, RM261003ABZP-REQ6@R2, RM261003ABZP-REQ7@R2, RM261003ABZP-REQ8@R2.
  - RM261003ABZP-REQ9@R3 (keystroke, open, scrolling).
  - RM261003ABZP-REQ11@R3 (registries for block renderers, decoration providers, file types and editor kinds, and Bases view types).
  - RM261003ABZP-REQ10@R4 (release re-check).
- **Design:** `rm261003abzp-design.md` - RM261003ABZP-DES5@R2 (Markdown-scoped view, task, and fold commands), RM261003ABZP-DES6@R2, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES14@R2, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R2 (Markdown views and the `base` file type)
- **Research:** `rm261003abzp-research.md`
- **UI baseline:**
  - Accepted mockups (`ui-mockups/manifest.md`): RM261003ABZP-M2@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1, and RM261003ABZP-M1@R1 for the statusline segments; manifest AD4.
  - UI requirements (`rm261003abzp-ui-requirements.md`): RM261003ABZP-UREQ3@R2 (Markdown views; non-Markdown painting assertions), RM261003ABZP-UREQ1@R2 (view and preview segments), RM261003ABZP-UREQ4@R1, RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1, RM261003ABZP-UREQ10@R1, RM261003ABZP-UREQ11@R1 (PH2 surfaces).
  - UI design and verification (`rm261003abzp-ui-design.md`): RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R2, RM261003ABZP-UDES11@R1; RM261003ABZP-US1@R2, RM261003ABZP-US2@R2, RM261003ABZP-US6@R1, RM261003ABZP-US7@R1, RM261003ABZP-US8@R1, RM261003ABZP-US9@R1; RM261003ABZP-UV1@R2, RM261003ABZP-UV3@R2, RM261003ABZP-UV7@R1, RM261003ABZP-UV8@R1, RM261003ABZP-UV9@R2, RM261003ABZP-UV10@R1.
- **Research lineage:**
  - RM261003ABZP-RF4: evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2.
  - RM261003ABZP-RF7: evaluated RM261003ABZP-REQ5@R1, RM261003ABZP-REQ8@R1, RM261003ABZP-REQ9@R1 → informed their R2 revisions.
  - RM261003ABZP-RF9: evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2.
  - RM261003ABZP-RF10: evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2.
  - RM261003ABZP-RF12: evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2.
  - RM261003ABZP-RF2: evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2.
- **Prerequisite phases:** RM261003ABZP-PH1@R3 - the merged editor, store, registry and keymap with `KeyScope`, the kernel `layoutText`, `FileTypeRegistry` with `markdownFileType` and the highlighter, `parseDoc` with `syntaxExtensions`, NoteIndex and the worker, the Picker and Prompt components, the `atomicWrite` path, and the bench harness.
- **Entry conditions:**
  - PH1 exit evidence, including the release dry run, is recorded. A `v0.1.0` release is not required. DI3 and DI4 discussion and planning may start earlier against the PH1 plans.
  - The user's pending mockup review has either produced no change to the PH2 mockups (M2, M5, M6, M7) or has been reconciled through mockup edit cycles and the UREQ/UDES and PH/DI revision rules.

### Cross-Work Dependency Gates

| Producer DI | Consumer DI | Required output | Required before | Required evidence | Integration owner |
|---|---|---|---|---|---|
| RM261003ABZP-DI2@R2 | RM261003ABZP-DI3@R4 | **G2:** `parseDoc` with the block cache and `syntaxExtensions` (scan level, plus lazy per-block mdast through `blockNode`); `markdownFileType` with `analyze` and the Markdown key scope; `layoutText` and `lowlightHighlighter` (from DI1); NoteIndex with `resolveLink`; the statusline segment framework; the `Picker` | DI3 execution | DI2 PR merged with RM261003ABZP-V4@R2, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2, RM261003ABZP-V18@R1 passing; PH1 exit evidence recorded | RM261003ABZP-DI3@R4 |
| RM261003ABZP-DI2@R2 | RM261003ABZP-DI4@R2 | **G3:** the `Picker` with preview, the `Prompt`, NoteIndex paths and frontmatter in summaries, `FileTypeRegistry` and `editorViews` (for the `base` editor kind), and the `search` and `write` effects | DI4 execution | as G2 | RM261003ABZP-DI4@R2 |
| RM261003ABZP-DI3@R4 | RM261003ABZP-DI4@R2 | **G4:** the `blockRenderers` registry, `widget` decorations with row reservation through `layoutText`, the `widgetPainters` registry, and unlisted embed buffers (Contracts, data, and state below) | DI4 execution of the `![[file.base]]` embed renderer only; the rest of DI4 proceeds earlier; the DI4 PR merges after DI3 | DI3 PR merged with RM261003ABZP-V7@R2 and RM261003ABZP-V16@R2 passing | RM261003ABZP-DI4@R2 |

G1 is defined in `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Cross-Work Dependency Gates.

## Delivery Flow

```text
RM261003ABZP-PH2@R6 — Obsidian experience            (requires the RM261003ABZP-PH1@R3 exit)
├── RM261003ABZP-DI3@R4 — Live preview + browser preview      ◄─ G2 (DI2)
│     Doc → livePreview provider (reveal, folds, widgets) → layoutText → EditorView + widgetPainters
│     Doc → renderHtml → Bun.serve /render + SSE doc/stopped → read-only page
│            │ G4 (merged DI3: blockRenderers, widget rows, widget painters, embed buffers)
│            ▼
└── RM261003ABZP-DI4@R2 — Daily notes, templates + Bases      ◄─ G3 (DI2)
      formatDate → dailyPath → createExclusive → :Today/:Yesterday/:Tomorrow/calendar
      expandTemplate → template.insert / note.new
      .base → base file type (editor kind "base") → editorViews.base
      parseBase → evaluateBase(index) → TableModel | KanbanModel → patch frontmatter → write
      [after G4] base block renderer + base widget painter → ![[file.base]] inline
                         │
                         ▼
          PH2 exit evidence (incl. release dry run, no publish) → v1.0.0 tag only when the user asks
```

- **Parallel opportunities:** DI3 and DI4 run in parallel from PH1 exit. Only DI4's embed renderer waits for G4. Inside DI4, the daily-notes and templates work and the Bases engine port are independent until the shared `formatDate`.
- **Usable result:** DI3 makes notes look like Obsidian, in the terminal and in the browser. DI4 adds the structured-note workflows. Only both together complete v1 and the `v1.0.0` release.

## Phase Design

- **Architecture and boundaries**
  - **Design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES17@R2; Design, System Architecture and Components and Boundaries.
  - **Inherited:**
    - `core/lang/markdown` (live-preview provider and `renderHtml`) is pure and fed by the same `Doc`.
    - `core/kernel` stays language-neutral: live preview is a decoration provider, and Bases is a registered file type with its own editor kind.
    - `src/preview` imports only `core`, and is started and stopped by effects.
    - Bases evaluation is pure, and writes go through `write` effects.
  - **Phase refinement:**
    - DI3 adds `src/preview/`, which the boundary test already covers from DI1.
    - Image bytes are loaded by `src/workspace/images.ts`: `readImage(path)` for workspace files and `fetchImage(url)` for `http:` and `https:` targets. `src/app` injects the loader into the UI as a function, so `src/ui` never imports file-system or network modules.
    - `src/app/preview-host.ts` owns the running preview server, as `src/app/index-host.ts` owns the index worker.
    - DI3 registers the `live` and `reading` views on `markdownFileType`; `live` becomes the Markdown default view.
    - DI4 registers `baseFileType` (`.base`, editor kind `base`), the `base` `EditorKindSpec` (its `open` creates `{path, view, cursor}`), and `editorViews.base`, and adds the Bases view-type registry (`core/features/bases/views.ts`), one of the registries in the design's Known extension needs.
  - **View:**

    ```text
    Proposed PH2 components (DI3 = 3, DI4 = 4)

    lang/markdown doc (PH1) ──► 3 lang/markdown/live-preview ──► kernel/view layoutText (PH1)
           │                     ▲ blockRenderers ◄── 4 features/bases/embed-renderer
           │                     └──► 3 ui/editors/text-view + 3 ui/widgets ◄── app-injected loadImage ── 3 workspace/images
           ├──► 3 lang/markdown/html ──► 3 preview/server (Bun.serve, SSE) ──► browser page.html
           └──► 4 features/bases (parse, evaluate, views registry, yaml patch, base file type) ──► 4 ui/editors/base-view
    4 core/time ──► 4 features/notes (dailyPath, expandTemplate) ──► create/write effects ──► workspace/fs
    ```

- **Components and files**

  | Location | Change and responsibility | Phase-specific detail | Upstream design |
  |---|---|---|---|
  | `src/core/lang/markdown/{live-preview,reveal,file-type}.ts`, `src/core/lang/markdown/renderers/{heading,list,table,callout,code,embed,image,math,mermaid,frontmatter,rule}.ts` | Add / Modify (DI3). The `livePreview` decoration provider for the `live` and `reading` views; reveal; `blockRenderers` registry | Code shapes below. Fenced code uses the PH1 `lowlightHighlighter`. Math and Mermaid text renderers ported from Alfred. | RM261003ABZP-DES9@R3, RM261003ABZP-DES17@R2; Design, `src/core/kernel/view/text-view.ts` (live-preview provider) |
  | `src/core/state/markdown-commands.ts` (view, task, fold, Enter, preview commands) | Add (DI3) | `view.cycle` (`<leader>m`), `task.toggle` (`<leader>x`), `fold.toggle` (`za`), `note.enter` (`Enter`: toggles a task, else follows the link; replaces the `<CR>` `link.follow` binding), `preview.start`, `preview.stop`, registered with `filetypes: ["markdown"]` and bound in the `markdown` key scope. Commands read `AppState`, and `core/lang` may not import `core/state`, so they live in `core/state`. | RM261003ABZP-DES5@R2, RM261003ABZP-UDES4@R1 |
  | `src/ui/editors/text-view.ts`, `src/ui/widgets/{registry,image,embed,rule}.ts`, `src/ui/images.ts` | Modify / Add (DI3) | Gutter `sign` painting (`▕` reveal, `⚠` render error); `widgetPainters` by widget type; image tier selection and LRU (64 MiB) | RM261003ABZP-DES10@R2, RM261003ABZP-DES16@R1; UI design Surface: Editor window |
  | `src/workspace/images.ts` | Add (DI3) | `readImage(path)` reads a workspace image; `fetchImage(url)` downloads an `http:`/`https:` image with `fetch` (10 s timeout, 16 MiB response cap, at most 4 downloads at once, no cookies, no Referer; disabled by `preview.images = "off"`). Bytes are decoded on request and kept only in the in-memory image cache, never on disk; a failure shows `[image: <name>]` and is retried after 60 s. App-injected | RM261003ABZP-DES16@R1 |
  | `src/core/lang/markdown/html.ts` | Add (DI3) | `renderHtml(doc, ctx)`. `ctx.href(target)` maps wikilinks to `/<path>`, and assets to `/file/<path>`. | RM261003ABZP-DES13@R3 |
  | `src/preview/{server,assets,page.html,page.js,page.css}` | Add (DI3) | Routes (including `/assets/*`), Host check, containment, the Content Security Policy, SSE broadcast and stop sequence (Code shapes below); `assets.ts` embeds the page files and the exact-pinned KaTeX and Mermaid builds into the binary; page script per UI design `follow()` | RM261003ABZP-DES13@R3; UI design Surface: Browser preview page |
  | `src/app/preview-host.ts` | Add (DI3) | Owns the running server; runs the `startPreview`, `stopPreview`, and `openUrl` effects; the exit path stops the preview before terminal restore | RM261003ABZP-DES13@R3 |
  | `src/core/time/format.ts`, `src/core/features/notes/{daily,templates,commands}.ts` | Add (DI4) | Commands `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new` | RM261003ABZP-DES11@R1 |
  | `src/workspace/fs.ts` `createExclusive` | Modify (DI4) | Exclusive create used by daily notes and new notes (Code shapes below) | RM261003ABZP-DES8@R2 |
  | `src/ui/overlays/calendar.ts` | Add (DI4) | `monthGrid` per UI design; marks from 42 `dailyPath` lookups in the NoteIndex | RM261003ABZP-UDES8@R1 |
  | `src/core/features/bases/{parser,evaluator,expression,yaml-patcher,types,views,table,kanban,embed-renderer,file-type}.ts` | Add (DI4). Port, view models, and the `base` file type | `KANBAN_TYPE` in `types.ts`, verified against an Obsidian 1.14+ fixture; `views.ts` registry (Code shapes below); `file-type.ts` registers `.base` with editor kind `base` | RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R2 |
  | `src/ui/editors/{base-view,base-toolbar,base-table,base-kanban}.ts`, `src/ui/widgets/base.ts` | Add (DI4) | `editorViews.base`; keymap mode `base`; write toasts show the frontmatter diff; the `base` widget painter for embeds (after G4) | RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-UDES9@R1 |
  | `test/fixtures/{tour.md,images/,bases/,templates/,generate.ts}`, `test/bench/{live-keystroke,source-keystroke,source-open,scroll}.bench.ts`, `scripts/bench-gate.ts` | Add / Modify | `tour.md` holds every element; Bases fixtures are ported from Alfred, plus an Obsidian-saved Kanban `.base`; `generate.ts` generates the 5,000-line note and TypeScript fixtures; the bench gate `TARGETS` hold the RM261003ABZP-REQ9@R3 targets | RM261003ABZP-V7@R2, RM261003ABZP-V10@R2, RM261003ABZP-V12@R3, RM261003ABZP-V16@R2 |

- **Runtime and failure flow**
  - **Design:** RM261003ABZP-DES9@R3, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R2; Design, Runtime Flows (Keystroke to frame, Open a file, Preview).
  - **Phase refinement:**
    - Embed and Base-embed targets load as unlisted buffers through `read` effects. Until a target loads, its widget reserves the configured rows and shows `loading…`. A missing target shows the unresolved-link style.
    - An embed's `read` carries `embed: true`, and the effect runner copies it onto the `fileLoaded` or `fileRefused` answer. A tagged answer opens the target unlisted and unshown unless a window waits for the path; a tagged refusal raises no notice (W261003S6BQ, PR #6).
    - A block renderer that throws renders its block as source with a diagnostic marker (Design, Keystroke to frame failure branch).
    - Daily-note creation uses an exclusive create, so it never overwrites. If the file already exists, `so` opens the existing file.
    - A Base cell edit validates by property type before emitting `write`. An invalid value keeps the editor open with an inline error.
  - **Flow:**

    ```text
    key → update → markdown analyze (reparse dirty blocks) → layoutText(view, [highlight, livePreview]) → visible rows only
          ├─ embed/base widget target not loaded → read{embed} → fileLoaded{embed} (unlisted unless a window waits) → re-layout
          │                                                    └─ fileRefused{embed} → missing, no notice
          └─ renderer throws → block as source + ⚠ marker
    :Preview → preview = starting → startPreview → 127.0.0.1:<port> → previewStarted → openUrl (fail → toast with URL)
       edit/switch → debounce 100 ms → SSE "doc" {path, version, line} → page GET /render → swap, scroll to the block containing line
    image target http(s): → fetchImage (10 s, 16 MiB, at most 4 at once, no cookies or Referer) → memory cache → paint
                          └─ fails → [image: <name>], retried after 60 s
       :PreviewStop | exit → SSE "stopped" to all clients → server.stop(true) → AppState.preview = off
    open .base → forPath → base file type → editorKinds.get("base").open(path, text) → window content {editor: "base", state} → editorViews.base
    :Today → dailyPath(cfg, today) → index has path? open : expandTemplate → createExclusive
                                                         └─ EEXIST (race) → read + open, no write
    Base: i on cell → edit → validate(type) → invalid → inline error
                                          → valid → yamlPatch(frontmatter) → write effect → toast diff
    Kanban L → group by formula/file? → toast explanation, no write : patch property (None → remove)
    ```

  - **Verification:**
    - RM261003ABZP-V7@R2 - layout goldens.
    - RM261003ABZP-V8@R1 - image tiers.
    - RM261003ABZP-V9@R1 - second `:Today` opens without change.
    - RM261003ABZP-V10@R2 - YAML preserved, moves disabled, `cards` fallback.
    - RM261003ABZP-V11@R3 - Host, containment, latency, and `stopped`.
    - RM261003ABZP-V12@R3 - keystroke p95 < 24 ms in live preview and < 16 ms in a 5,000-line TypeScript file.

- **Contracts, data, and state**
  - **Design:** RM261003ABZP-DES2@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES17@R2; Design, AppState, RenderLine model, FileType and Decoration model, Preview HTTP routes.
  - **Inherited:**
    - `folds` in text window content, buffer `view` (one of the file type's views: `live | source | reading` for Markdown, `source` otherwise), base window content `{editor: "base", path, view, cursor}`, `preview`, and the `calendar` overlay come from RM261003ABZP-DES2@R2.
    - `TextView` and `layoutText` keep their PH1 shapes; DI3 supplies `folds` and adds providers only.
    - SSE carries `doc` and `stopped` events; the `doc` payload is `{path, version, line}`, where `line` is the cursor line (RM261003ABZP-DES13@R3).
  - **Phase refinement:**
    - **DI3** adds these fields:
      - `buffers[].view`: default `live` for Markdown; other file types keep `source`.
      - `buffers[].listed`: `false` for embed targets, which are hidden from the bufferline and evicted when no visible widget references them.
      - `buffers[].embeds`: `{requested, refused}` embed reads per buffer, so embed tracking adds no top-level field. A target stays in `requested` until its read answers, even after the note stops embedding it; only `refused` is trimmed to the note's current embeds. Closing the last embedding note with `:bd` before the answer allows one more `read`, and its duplicate answer is a no-op (W261003S6BQ, PR #6).
      - `folds` in text window content: `number[]` of folded callout and expanded embed `Block.id` values. It reaches the provider through `PreviewCtx.folds`; the kernel `TextView.folds` keeps its generic hidden-line meaning and is empty for Markdown.
      - `editor` in window content: `EditorKind`, derived after each reducer step from the buffer's file-type kind when that kind is registered, else `"text"`; not persisted (RM261003ABZP-DES17@R2; W261003S6BQ, PR #6). `EditorKindSpec.open` and per-kind content state are left to DI4's `base` editor kind.
      - `preview`: `off | starting | on(port)`, the one top-level field the phase allows.
      - Actions `previewStarted`, `previewStopped`, `previewFailed`, `openUrlFailed`; effects `startPreview`, `stopPreview`, `openUrl`. An optional `embed?: true` on the PH1 `read` effect and on the `fileLoaded` and `fileRefused` actions marks a read that only a note's embed sent (W261003S6BQ, PR #6).
    - **DI4** adds these fields:
      - the `overlay` variant `calendar`;
      - base window content `{editor: "base", path, view: { index, sort?: {prop, dir}, grouped: boolean }, cursor: {row, col}}`.
    - No new top-level AppState field is introduced: Base view state belongs to its window content.
    - `PreviewCtx` gives the live-preview provider a pure `isResolved(target)` and `resolve(target)` that read NoteIndex. Unresolved links get the `linkUnresolved` token, which is the DI3 part of RM261003ABZP-UREQ6@R1.
  - **Shape:** Code shapes and wiring, `src/core/lang/markdown/live-preview.ts` and `src/core/features/bases/views.ts` below.
  - **Verification:**
    - RM261003ABZP-V7@R2 - reveal and fold rows.
    - RM261003ABZP-V16@R2 - block renderer registration.
    - RM261003ABZP-V10@R2 - Base edits.
    - RM261003ABZP-UV3@R2 - fold and embed rows.

- **Code shapes and wiring**
  - **`src/core/lang/markdown/live-preview.ts` — provider input and renderer registry (DI3)**
    - **Design:** RM261003ABZP-DES9@R3; Design, `src/core/kernel/view/text-view.ts` (live-preview provider).
    - **Phase refinement:** This fixes what the live-preview provider and block renderers may read. DI3 makes the design's `MarkdownViewInput` and `PreviewCtx` concrete. The Markdown views' `input` hook builds them, so neither the kernel nor `src/ui/editors/text-view.ts` knows about Markdown.
    - **Shape:**

      ```ts
      export type PreviewCtx = {
        isResolved(target: string): boolean;                 // pure read of NoteIndex
        resolve(target: string): string | undefined;         // resolved path, pure read of NoteIndex
        embed(path: string): { doc: Doc; text: TextBuffer } | "loading" | "missing";   // unlisted buffers
        folds: ReadonlySet<number>;                          // folded or expanded Block.id values of the window
        image(ref: string): { rows: number } | "unknown";    // size known after decode; rows reserved meanwhile
        embedMaxRows: number; images: "auto" | "blocks" | "off";
      };
      export type MarkdownViewInput = { doc: Doc; view: "live" | "reading"; ctx: PreviewCtx };
      export const livePreview: DecorationProvider<MarkdownViewInput>;
      export type BlockRenderer = (block: Block, v: TextView, input: MarkdownViewInput) => Decoration[];
      export function registerBlockRenderer(kind: BlockKind | string, r: BlockRenderer): void;
      ```

      Renderers read only `TextView` and `MarkdownViewInput`, so the provider stays pure and is golden-testable through `layoutText`. `embed` and `image` answer from state: a `"loading"` answer reserves rows through a `widget` decoration, and `update` requests the missing data through effects. `registerBlockRenderer` is the G4 output that DI4 uses for `base` embeds.

    - **Callers and wiring:** `src/ui/editors/text-view.ts` builds `TextViewInput` from the active window and buffer: `highlightMarks` plus the active view's providers, with the analysis input from the view's `input(analysis, ctx)` hook (Markdown: `MarkdownViewInput` from the buffer's `Doc` and the `PreviewCtx` that `core/state/view-context.ts` builds from AppState and config through the builder registered for `markdown`). `core/features/bases/embed-renderer.ts` registers `base` (DI4).
    - **Invariants:** viewport-only (rows outside the view are never laid out); `source` view never runs `livePreview`; reading view never reveals; reserved widget rows count in scroll math; no Markdown type enters `core/kernel`.
    - **Verification:** RM261003ABZP-V7@R2, RM261003ABZP-V12@R3, RM261003ABZP-V16@R2, RM261003ABZP-UV3@R2.

  - **`src/preview/server.ts` — broadcast and stop (DI3)**
    - **Design:** RM261003ABZP-DES13@R3; Design, `src/preview/server.ts`.
    - **Phase refinement:** This adds the SSE client set, the debounced `doc` broadcast, and the stop order that guarantees `stopped` reaches clients.
    - **Shape:**

      ```ts
      const clients = new Set<ReadableStreamDefaultController<string>>();
      const send = (event: "doc" | "stopped", data: unknown) =>
        clients.forEach((c) => c.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      const unsubscribe = store.subscribe(debounce(100, (s) => { const t = followTarget(s); if (changed(t)) send("doc", t); })); // t = {path, version, line}
      function stop() { unsubscribe(); send("stopped", {}); clients.forEach((c) => c.close()); server.stop(true); }
      ```

      `stop` unsubscribes first, then sends `stopped`, then closes each stream before stopping the server. A connected page therefore always sees `Stopped`, not `Reconnecting…`, after `:PreviewStop` or a clean exit.

    - **Callers and wiring:** the `startPreview` and `stopPreview` effects, run by `src/app/preview-host.ts`. The app's exit path calls `stop()` before terminal restore.
    - **Invariants:** hostname `127.0.0.1`; Host allowlist; realpath containment; no mutating route; a Content Security Policy that allows code, styles, fonts and connections only from the server's own origin, and images also from the web.
    - **Verification:** RM261003ABZP-V11@R3, RM261003ABZP-UV9@R2.

  - **`src/workspace/fs.ts` `createExclusive` (DI4)**
    - **Design:** RM261003ABZP-DES8@R2, RM261003ABZP-DES11@R1.
    - **Phase refinement:** Creating a note never replaces an existing file.
    - **Shape:**

      ```ts
      export async function createExclusive(path: string, text: string): Promise<{ created: true; stamp: Stamp } | { created: false }> {
        await mkdir(dirname(path), { recursive: true });            // YYYY/MM subfolders
        try { const fd = await open(path, "wx"); try { await fd.writeFile(text); await fd.sync(); } finally { await fd.close(); } }
        catch (e) { if ((e as NodeJS.ErrnoException).code === "EEXIST") return { created: false }; throw e; }
        return { created: true, stamp: await stampOf(path, text) };
      }
      ```

      `wx` fails when the file exists, so a race with another editor or a second `:Today` cannot overwrite a note. A new file holds only the expanded template, so it needs no temp-rename step. Later saves use `atomicWrite`.

    - **Callers and wiring:** the `create` effect for `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, and `note.new`. When it returns `created: false`, the command opens the existing file.
    - **Invariants:** existing notes are never modified by creation commands.
    - **Verification:** RM261003ABZP-V9@R1 - second `:Today` opens the existing file unchanged.

  - **`src/core/features/bases/views.ts` — view-type registry (DI4)**
    - **Design:** RM261003ABZP-DES12@R2; Design, Cross-cutting and Evolution (Bases view types registry).
    - **Phase refinement:** This makes the design's "Bases view types" extension point concrete.
    - **Shape:**

      ```ts
      export type BaseViewBuilder = (view: BaseView, rows: EvaluatedRow[], ctx: BaseCtx) => BaseViewModel;
      const builders = new Map<string, BaseViewBuilder>([["table", buildTable], [KANBAN_TYPE, buildKanban]]);
      export const registerBaseView = (type: string, b: BaseViewBuilder) => builders.set(type, b);
      export function buildView(view: BaseView, rows: EvaluatedRow[], ctx: BaseCtx): BaseViewModel {
        const b = builders.get(view.type);
        return b ? b(view, rows, ctx) : { ...buildTable(view, rows, ctx), notice: `${view.type} view shown as table` };
      }
      ```

      Unknown or deferred layouts (`cards`, `list`, `map`, plugin types) fall back to a read-safe table with a notice. Adding a layout later is one registration.

    - **Callers and wiring:** base windows (`editorViews.base`) and the `base` embed renderer call `buildView`. `ui/editors/base-*` paint `TableModel` and `KanbanModel`.
    - **Invariants:** the `KANBAN_TYPE` constant is the only place the Obsidian type string lives. A fallback view never writes.
    - **Verification:** RM261003ABZP-V10@R2 - `cards` opens as a table with a notice; RM261003ABZP-UV8@R1 - a fallback view produces no write.

- **Migration and compatibility**
  - **Design:** RM261003ABZP-DES12@R2, RM261003ABZP-DES15@R4; Design, Cross-cutting and Evolution (Obsidian file compatibility, rollout).
  - **Phase refinement:**
    - There is no data migration. The PH1 state file (`"version": 1`) is unchanged, and fold state is not persisted (RM261003ABZP-UDES4@R1).
    - Bases writes patch only the edited frontmatter keys and preserve comments and key order. `.base` files themselves are never written in v1.
    - Kanban ships only after `KANBAN_TYPE` matches an Obsidian 1.14.3 or later saved file; until then a Kanban view opens as a table with a notice.
  - **Transition:** PH1 exit → DI3 merged → DI4 merged (after G4) → PH2 exit with the release dry run → `v1.0.0` when the user asks. Rollback: revert the PR before release. After release, reinstall `v0.1.0` or a later binary. Notes stay valid Obsidian files throughout.
  - **Verification:** RM261003ABZP-V10@R2 - YAML preservation and the Kanban table fallback. RM261003ABZP-V14@R2 - dry run re-run at the PH2 exit.

- **UI realization:**
  - **DI3:**
    - RM261003ABZP-UDES3@R2 - glyph headings `█ ▊ ▌ ▏`, hidden markers, `▕` reveal marker, block reveal, modes; note keys stay out of code files (UV3 `sync.ts` assertions).
    - RM261003ABZP-UDES4@R1 - task toggle, `za` folds and embeds, `embedMaxRows`, image tiers.
    - RM261003ABZP-UDES10@R2 - page badges `Live`, `Reconnecting…`, `Stopped`, `Offline`; paused-follow; 375 px; KaTeX and Mermaid served locally, with a render error showing that block's source.
    - Statusline `view` and `preview` segments, completing RM261003ABZP-UDES1@R2's segment order.
    - The unresolved-link style.
    - Accepted mockups: RM261003ABZP-M2@R1, RM261003ABZP-M7@R1, RM261003ABZP-M1@R1.
  - **DI4:**
    - RM261003ABZP-UDES8@R1 - Monday-first 36-column calendar, `H/L`/`t`, template preview of source above the expansion, `(blank note)` first.
    - RM261003ABZP-UDES9@R1 - toolbar, table editors, Kanban `H/L`, diff toasts, `⊘ moves off`, fallback notice.
    - Accepted mockups: RM261003ABZP-M5@R2, RM261003ABZP-M6@R1.
  - **Both DIs:** RM261003ABZP-UDES11@R1 - NO_COLOR, light theme, and 80×24 for their surfaces.
- **Consistency:**
  - These refinements implement the pinned DES and UDES revisions without changing any requirement.
  - Unlisted embed buffers reuse the RM261003ABZP-DES2@R2 `buffers` map, and Base view state lives in the base window content, rather than adding top-level state.
  - `PreviewCtx` keeps the RM261003ABZP-DES9@R3 live-preview provider pure, and the kernel view gains no Markdown types.
  - `createExclusive` strengthens the "never overwrite" rule of RM261003ABZP-REQ1@R3 and RM261003ABZP-REQ6@R2.
  - The stop order implements the RM261003ABZP-DES13@R3 `stopped` event.

## Delivery Items

- **RM261003ABZP-DI3@R4 — Live preview and browser preview**
  - **Requirements:**
    - RM261003ABZP-REQ5@R2 - Obsidian-style live preview with reveal, rich blocks, embeds, images, and modes.
    - RM261003ABZP-REQ8@R2 - Read-only local browser preview.
    - RM261003ABZP-REQ9@R3 - Keystroke p95 < 24 ms and open < 80 ms on the 5,000-line note in live preview; keystroke p95 < 16 ms and open < 50 ms on the 5,000-line TypeScript file in source view; 60 fps scrolling in both.
    - RM261003ABZP-REQ11@R3 - Registration-only extension (command, keymap, syntax extension, block renderer, and a `csv` file type with highlighter, decoration provider, and scoped keymap).
  - **Outcome:** Notes look like Obsidian while you type. Syntax hides except where the cursor is, tables align, callouts fold, embeds and images show inline on every terminal tier, and `<leader>m` cycles live → source → reading. `:Preview` opens a browser tab that follows edits within 300 ms and can never edit.
  - **Explanation:**

    ```text
    cursor off "**bold**" line → bold text      cursor on it → "**bold**" + ▕ in sign column
    cursor enters a table → every row shows pipes; leaves → aligned grid
    ![[plan#Goals]] → embedded section, "… 12 more lines" beyond embedMaxRows; za expands
    kitty/Ghostty → real image; Terminal.app/tmux → Unicode blocks; images="off" → [image: diagram.png]
    :Preview → browser "Live"; edit heading → page updates < 300 ms; :PreviewStop → "Stopped"
    ```

  - **Scope:**
    - The `livePreview` decoration provider for the `live` and `reading` views, registered on `markdownFileType` (`source` stays the PH1 highlighter path):
      - line and block reveal, with selection-aware reveal;
      - the full RM261003ABZP-REQ5@R2 element list, with `%%comments%%` hidden;
      - frontmatter as a properties block;
      - callout icons and folds; tables aligned to columns; fenced code through the PH1 `lowlightHighlighter`;
      - math and Mermaid text approximations;
      - footnotes; horizontal rules; resolved and unresolved link styles.
    - Note embeds (`![[note]]`, `![[note#Heading]]`) with `embedMaxRows`.
    - Commands `view.cycle`, `task.toggle`, `fold.toggle`, `note.enter`, limited to Markdown and bound in the `markdown` key scope.
    - Widget painters (`image`, `embed`, `rule`) in `src/ui/widgets/`; sign-column painting.
    - Images: kitty → sixel → blocks → placeholder via the OpenTUI auto protocol; workspace files and web (`http:`/`https:`) images; lazy decode with a 64 MiB LRU; `preview.images` config.
    - `renderHtml` covering the same syntax, with real images, and KaTeX and Mermaid served from the binary, with the source shown on a render error.
    - Preview server (`:Preview` limited to Markdown; non-Markdown buffers leave the page on the last note): routes, Host allowlist, realpath and hidden-folder containment, SSE `doc` (100 ms debounce) and `stopped`, and `:Preview`/`:PreviewStop`.
    - Page: badges, changed-block highlight, wikilink navigation with a paused-follow banner, theme toggle, 375 px layout, no editing controls.
    - Statusline `view` and `preview` segments.
    - RM261003ABZP-V12@R3 bench in CI.
    - RM261003ABZP-V16@R2 registration test.
  - **Exclusions:**
    - The `base` block renderer (DI4, through G4).
    - Persisted fold state.
    - Any write route in the preview server.
    - Live views, folding, or outline for code files (index Deferred Scope).
  - **Design:**
    - RM261003ABZP-DES6@R2 - one Doc feeds layout and HTML; live preview and HTML read mdast per block through `blockNode`; Design, Doc model.
    - RM261003ABZP-DES5@R2 - Markdown-scoped view, task, and fold commands.
    - RM261003ABZP-DES9@R3 - the live-preview provider, reveal, folds, renderer registry on the kernel view; Design, `src/core/kernel/view/text-view.ts`.
    - RM261003ABZP-DES10@R2 - `EditorView` sign and widget painting, `widgetPainters`, image tiers; Design, `src/ui/editors/text-view.ts`.
    - RM261003ABZP-DES17@R2 - `live` and `reading` views on `markdownFileType`.
    - RM261003ABZP-DES13@R3 - preview server, SSE `doc` and `stopped`, `renderHtml`, KaTeX and Mermaid from `/assets/*`; Design, Preview HTTP routes.
    - RM261003ABZP-DES14@R2 - `preview.*` config.
    - RM261003ABZP-DES16@R1 - block cache, viewport-only layout, image LRU, benchmarks.
  - **UI scope:**
    - RM261003ABZP-M2@R1 (S1–S16), RM261003ABZP-M7@R1, RM261003ABZP-M1@R1 (statusline segments).
    - RM261003ABZP-UREQ3@R2 (Markdown views; non-Markdown painting assertions), RM261003ABZP-UREQ4@R1, RM261003ABZP-UREQ10@R1, RM261003ABZP-UREQ6@R1 (unresolved-link style), RM261003ABZP-UREQ1@R2 (segments), RM261003ABZP-UREQ11@R1.
    - RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES10@R2, RM261003ABZP-UDES1@R2, RM261003ABZP-UDES11@R1.
    - UI design surfaces: Editor window, Browser preview page.
  - **Phase design:** Components and files (DI3 rows); Runtime and failure flow (keystroke, embed, preview, web image branches); Code shapes `src/core/lang/markdown/live-preview.ts` and `src/preview/server.ts`; Contracts, data, and state (DI3 additions).
  - **Dependencies:** RM261003ABZP-DI2@R2 - Doc, `markdownFileType` with `analyze`, Markdown key scope, index, statusline framework, Picker (and, through DI2, the DI1 kernel view and highlighter).
  - **Cross-work gates:** Consumer of G2; producer of G4 (this phase, Cross-Work Dependency Gates).
  - **Success:**
    - RM261003ABZP-S5@R1 - live preview renders and reveals.
    - RM261003ABZP-S8@R1 - preview is live, read-only, and local-only.
    - RM261003ABZP-S9@R1 - keystroke and open targets.
    - RM261003ABZP-S11@R1 - registration-only extension.
  - **Verification:**
    - RM261003ABZP-V7@R2 - layout goldens at widths 60 and 100.
    - RM261003ABZP-V8@R1 - image protocol selection.
    - RM261003ABZP-V11@R3 - Host 403, traversal and symlink 404, SSE < 300 ms, Markdown-only following, `stopped` before close.
    - RM261003ABZP-V12@R3 - 200 keystrokes p95 < 24 ms and open < 80 ms for the note in live preview, p95 < 16 ms and open < 50 ms for the TypeScript file in source view, CI gate at 2×.
    - RM261003ABZP-V16@R2 - registration-only extension, including the `csv` file type.
    - All definitions are owned by `rm261003abzp-design.md`.
  - **UI success and verification:**
    - RM261003ABZP-US2@R2 via RM261003ABZP-UV3@R2 (including the `sync.ts` source-view and note-key assertions).
    - RM261003ABZP-US8@R1 via RM261003ABZP-UV9@R2, including a recorded manual check at 1200 px and 375 px in light and dark themes and offline, where math and diagrams still render.
    - RM261003ABZP-US1@R2 via RM261003ABZP-UV1@R2 (full statusline segment order).
    - RM261003ABZP-US9@R1 via RM261003ABZP-UV10@R1 (unresolved link state; editor surfaces under NO_COLOR, light, and 80×24) and RM261003ABZP-UV9@R2 (page semantics and contrast).
  - **Downstream work boundary:** The DI3 discussion confirms the OpenTUI image API at the pinned version. It also chooses the math and Mermaid approximation details within M2 and the page's CSS within M7. It may not:
    - parse Markdown in `src/ui`;
    - lay out rows outside the viewport;
    - add a mutating preview route;
    - change the `RenderLine` contract, the `layoutText` signature, or the G4 registry signatures consumed by DI4;
    - add Markdown knowledge to `core/kernel`.
  - **Predecessors:** RM261003ABZP-DI3@R1, RM261003ABZP-DI3@R2, RM261003ABZP-DI3@R3

- **RM261003ABZP-DI4@R2 — Daily notes, templates, and Bases**
  - **Requirements:**
    - RM261003ABZP-REQ6@R2 - Daily notes and templates.
    - RM261003ABZP-REQ7@R2 - Obsidian Bases table and Kanban views, with embeds.
    - RM261003ABZP-REQ11@R3 - Bases as a registered file type and editor kind; the Bases view-type registry.
  - **Outcome:** Daily notes and templates take one or two keystrokes. `Space n d` opens today's note, created from the template if missing. `Space n p` picks a date on a calendar. `Space n t` inserts a template with a preview. `.base` files become keyboard-fast tables and Kanban boards whose edits write valid, comment-preserving frontmatter, and `![[tasks.base#Board]]` renders inline.
  - **Explanation:**

    ```text
    2026-10-03  :Today → daily/2026-10-03.md from templates/daily.md → "# Saturday, October 3"
    :Today again → same file opened, unchanged
    <leader>np → calendar (Mon-first, • on 10-01, 10-02) → L → 3 Nov → t → 3 Oct → Enter
    tasks.base (Kanban by status) → card "Write spec" L → toast "− status: todo / + status: doing"
    group by formula → "⊘ moves off" → L → explanation toast, no write
    ```

  - **Scope:**
    - `formatDate`: the RM261003ABZP-REQ6@R2 token subset and `[literal]`, with unsupported tokens kept literal.
    - `dailyPath`: folder, `[daily] format`, `/` subfolders.
    - `expandTemplate`: `{{title}}`, `{{date}}`, `{{time}}`, `{{date:F}}`, `{{time:F}}`.
    - Commands and pickers:
      - `note.today`/`:Today`, `:Yesterday`, `:Tomorrow`;
      - the calendar picker with existing-note marks;
      - `template.insert` (one undo block);
      - `note.new` (title prompt → template picker with `(blank note)` first → opens in Insert mode);
      - `createExclusive`.
    - Bases:
      - the `base` file type (`.base`, editor kind `base`), its `EditorKindSpec`, and `editorViews.base`;
      - port of the parser, evaluator, expression subset, and YAML patcher, with diagnostics for unsupported syntax;
      - `TableModel` (order, sort, group, summaries, type-specific cell editors: text, number with `Ctrl-a`/`Ctrl-x`, date, list, checkbox `x`);
      - `KanbanModel` (single group-by property, `H/L` moves, `None` column removes the property, moves disabled for formula or file grouping);
      - view switcher; opening a row's note;
      - the view-type registry with table fallback and notice;
      - `KANBAN_TYPE` verified against an Obsidian 1.14+ fixture;
      - the `base` block renderer and `base` widget painter for `![[file.base]]` and `![[file.base#View]]`, after G4.
    - Write toasts show the frontmatter diff.
  - **Exclusions:**
    - Writing `.base` files.
    - The Cards, List, and Map layouts (deferred).
    - Configurable week start.
    - Template scripting beyond the listed variables.
  - **Design:**
    - RM261003ABZP-DES11@R1 - formatter, template expansion, daily commands; Design, `src/core/time/format.ts`.
    - RM261003ABZP-DES12@R2 - Bases port, view models, YAML-preserving write-back, Kanban constant, `base` renderer; Design, Core — Bases and notes.
    - RM261003ABZP-DES8@R2 - writes through `atomicWrite`; exclusive create.
    - RM261003ABZP-DES9@R3 - the `base` widget through `blockRenderers`.
    - RM261003ABZP-DES10@R2 - `editorViews.base` and the `base` widget painter.
    - RM261003ABZP-DES17@R2 - the `base` file type registration.
    - RM261003ABZP-DES14@R2 - `[daily]` and `templates.folder` config.
  - **UI scope:**
    - RM261003ABZP-M5@R2 (S1–S14; feedback cycle 1, AD2 `[daily] format`), RM261003ABZP-M6@R1 (S1–S16).
    - RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1, RM261003ABZP-UREQ11@R1.
    - RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES11@R1.
    - UI design surfaces: Daily notes and templates, Bases views. Components: Calendar, Picker, Prompt, Base table, Kanban board, Toast stack.
  - **Phase design:** Components and files (DI4 rows); Runtime and failure flow (`:Today`, Base edit, Kanban branches); Code shapes `src/workspace/fs.ts` `createExclusive` and `src/core/features/bases/views.ts`; Contracts, data, and state (DI4 additions); Migration and compatibility.
  - **Dependencies:**
    - RM261003ABZP-DI2@R2 - Picker, Prompt, NoteIndex, write and search effects (and, through DI2, the DI1 `FileTypeRegistry` and `editorViews`).
    - RM261003ABZP-DI3@R4 - `blockRenderers` and `widgetPainters` registries for embeds only (G4).
  - **Cross-work gates:** Consumer of G3 and G4 (this phase, Cross-Work Dependency Gates).
  - **Success:**
    - RM261003ABZP-S6@R1 - daily notes and templates match Obsidian output.
    - RM261003ABZP-S7@R2 - Bases evaluate and edit `.base` files.
  - **Verification:**
    - RM261003ABZP-V9@R1 - date formatting equals Moment.js, template expansion, daily paths, and a second `:Today` leaves the file unchanged.
    - RM261003ABZP-V10@R2 - Alfred fixtures; cell edit; card move on a test board; Kanban table fallback; `cards` fallback; formula grouping.
    - All definitions are owned by `rm261003abzp-design.md`.
  - **UI success and verification:**
    - RM261003ABZP-US6@R1 via RM261003ABZP-UV7@R1.
    - RM261003ABZP-US7@R1 via RM261003ABZP-UV8@R1.
    - RM261003ABZP-US9@R1 via RM261003ABZP-UV10@R1 (focused Base cell, focused Kanban card, calendar selection; NO_COLOR, light, 80×24).
  - **Downstream work boundary:** The DI4 discussion ports the Alfred Bases sources and decides the module split. It may not:
    - write `.base` files;
    - widen the expression subset beyond Alfred's without returning to design;
    - change the `createExclusive` never-overwrite rule;
    - ship Kanban before `KANBAN_TYPE` is confirmed against an Obsidian 1.14+ file;
    - special-case `.base` outside its file-type registration.
  - **Predecessors:** RM261003ABZP-DI4@R1

## Success and Verification

All records are reused. System records are owned by `rm261003abzp-design.md`, Success and Verification; UI records by `rm261003abzp-ui-design.md`, UI Success Criteria and Implementation Verifications. No definition is copied or revised here.

- **RM261003ABZP-S5@R1 — Live preview renders Obsidian syntax and reveals source where the cursor is**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V7@R2 — Layout golden tests** — **Definition:** `rm261003abzp-design.md`
    - **RM261003ABZP-V8@R1 — Image protocol selection** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S6@R1 — Daily notes and templates match Obsidian output**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V9@R1 — Date formatting and template expansion** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S7@R2 — Bases views evaluate and edit Obsidian `.base` files**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V10@R2 — Bases evaluation, edit, and compatibility** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S8@R1 — Preview is live, read-only, and local-only**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V11@R3 — Preview server behavior and safety** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S9@R1 — Performance targets hold** (completed in PH2)
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V12@R3 — Keystroke and open-file benchmarks** — **Definition:** `rm261003abzp-design.md`
    - **RM261003ABZP-V13@R2 — Startup and index benchmarks** (re-run) — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S10@R2 — Development and CI are fast; releases are manual and proven by a dry run** (re-check)
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V14@R2 — Check timing, CI timing, and non-publishing release dry run** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored** (completed in PH2)
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V15@R2 — Import boundary test** — **Definition:** `rm261003abzp-design.md`
    - **RM261003ABZP-V16@R2 — Registration-only extension** — **Definition:** `rm261003abzp-design.md`
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path** — **Definition:** `rm261003abzp-design.md`
- **UI:**
  - RM261003ABZP-US1@R2 (RM261003ABZP-UV1@R2 full)
  - RM261003ABZP-US2@R2 (RM261003ABZP-UV3@R2)
  - RM261003ABZP-US6@R1 (RM261003ABZP-UV7@R1)
  - RM261003ABZP-US7@R1 (RM261003ABZP-UV8@R1)
  - RM261003ABZP-US8@R1 (RM261003ABZP-UV9@R2)
  - RM261003ABZP-US9@R1 (RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R2)
  - All definitions are owned by `rm261003abzp-ui-design.md`.

## Release and Exit Criteria

- **Release approach:** RM261003ABZP-DES15@R4:
  - Nothing is released automatically, and the PH2 exit does not publish a release.
  - The PH2 exit re-runs the release workflow manually as a dry run: four binaries with `SHA256SUMS`, smoke jobs on four native runners, nothing published.
  - `v1.0.0` is released only when the user asks: the pushed `v1.0.0` tag runs the same workflow and publishes the GitHub Release.
- **Compatibility:** Notes and frontmatter stay valid for Obsidian. `.base` files are read-only in v1. The state file format is unchanged from PH1.
- **Rollback:** Before release, revert the offending PR. After release, reinstall a previous release binary, if one was published (RM261003ABZP-DES15@R4). No data rollback is needed.
- **Exit criteria:**
  - RM261003ABZP-S5@R1 - every RM261003ABZP-REQ5@R2 element renders, and reveal follows the cursor; verified by RM261003ABZP-V7@R2, RM261003ABZP-V8@R1
  - RM261003ABZP-S6@R1 - Moment-equal dates, correct expansion, no overwritten daily note; verified by RM261003ABZP-V9@R1
  - RM261003ABZP-S7@R2 - correct rows, comment-preserving writes, safe fallbacks including an unverified Kanban type; verified by RM261003ABZP-V10@R2
  - RM261003ABZP-S8@R1 - < 300 ms updates, 403/404 safety, `stopped` before close; verified by RM261003ABZP-V11@R3
  - RM261003ABZP-S9@R1 - all REQ9 targets, for notes in live preview and code in source view, gated at 2× in CI; verified by RM261003ABZP-V12@R3, RM261003ABZP-V13@R2
  - RM261003ABZP-S10@R2 - check < 30 s and CI < 3 min at full scope; the release dry-run binaries start; verified by RM261003ABZP-V14@R2
  - RM261003ABZP-S11@R1 - boundary including the kernel rule, registration-only extension including a file type, restore; verified by RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1
  - RM261003ABZP-US1@R2, RM261003ABZP-US2@R2, RM261003ABZP-US6@R1, RM261003ABZP-US7@R1, RM261003ABZP-US8@R1, RM261003ABZP-US9@R1 - as in M1, M2, M5@R2, M6, M7; verified by RM261003ABZP-UV1@R2, RM261003ABZP-UV3@R2, RM261003ABZP-UV7@R1, RM261003ABZP-UV8@R1, RM261003ABZP-UV9@R2, RM261003ABZP-UV10@R1
- **Completion evidence required:**
  - Passing CI results for every listed V and UV record on merged DI3 and DI4.
  - RM261003ABZP-V12@R3 and RM261003ABZP-V13@R2 readings on the reference machine.
  - The RM261003ABZP-UV9@R2 manual checklist.
  - A manual release dry run on `main` with the `dist` artifact (four binaries, `SHA256SUMS`), green smoke jobs, a skipped publish job, and no tag or GitHub Release.
- **Cross-work integration verification:** RM261003ABZP-DI4@R2 owns integration because it merges last. Its CI on top of merged DI3 must re-pass RM261003ABZP-V7@R2, RM261003ABZP-V12@R3, and RM261003ABZP-V16@R2 with the `base` renderer registered, and RM261003ABZP-UV3@R2 with a Base embed in `tour.md`.

Completed child works do not establish phase completion without the required integration, release, and exit evidence. The checks listed here are obligations, not passing results.

## Coverage

| Requirement | Design | Delivery item | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R2 | RM261003ABZP-DI3@R4 | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-DES11@R1 | RM261003ABZP-DI4@R2 | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R2 | RM261003ABZP-DI4@R2 | RM261003ABZP-S7@R2 | RM261003ABZP-V10@R2 |
| RM261003ABZP-REQ8@R2 - browser preview | RM261003ABZP-DES13@R3, RM261003ABZP-DES6@R2 | RM261003ABZP-DI3@R4 | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R3 - performance (keystroke, open, scroll) | RM261003ABZP-DES16@R1 | RM261003ABZP-DI3@R4 | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R3, RM261003ABZP-V13@R2 |
| RM261003ABZP-REQ10@R4 - release re-check | RM261003ABZP-DES15@R4 | RM261003ABZP-DI3@R4, RM261003ABZP-DI4@R2 (keep budgets) | RM261003ABZP-S10@R2 | RM261003ABZP-V14@R2 |
| RM261003ABZP-REQ11@R3 - registries, language-neutral kernel | RM261003ABZP-DES1@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R2 | RM261003ABZP-DI3@R4, RM261003ABZP-DI4@R2 (`base` file type and editor kind, Bases view registry) | RM261003ABZP-S11@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1 |

### UI Coverage

| Accepted mockup / feedback | UI requirement | UI design | Delivery item | UI success | UI verification |
|---|---|---|---|---|---|
| RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ1@R2 (view and preview segments) | RM261003ABZP-UDES1@R2 - Statusline | RM261003ABZP-DI3@R4 | RM261003ABZP-US1@R2 | RM261003ABZP-UV1@R2 (full) |
| RM261003ABZP-M2@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ3@R2 (Markdown views; non-Markdown painting assertions) | RM261003ABZP-UDES3@R2 - Surface: Editor window | RM261003ABZP-DI3@R4 | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M2@R1; Acceptance; AD3 | RM261003ABZP-UREQ4@R1 | RM261003ABZP-UDES4@R1 - Surface: Editor window | RM261003ABZP-DI3@R4 | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M3@R1, RM261003ABZP-M4@R1; Acceptance; AD3 | RM261003ABZP-UREQ6@R1 (unresolved-link style) | RM261003ABZP-UDES6@R1 - Surface: Links and backlinks | RM261003ABZP-DI3@R4 | RM261003ABZP-US9@R1 | RM261003ABZP-UV10@R1 (unresolved link) |
| RM261003ABZP-M5@R2; Acceptance; feedback cycle 1; AD2; AD3 | RM261003ABZP-UREQ8@R2 | RM261003ABZP-UDES8@R1 - Surface: Daily notes and templates; Calendar; Picker | RM261003ABZP-DI4@R2 | RM261003ABZP-US6@R1 | RM261003ABZP-UV7@R1 |
| RM261003ABZP-M6@R1; Acceptance; AD3 | RM261003ABZP-UREQ9@R1 | RM261003ABZP-UDES9@R1 - Surface: Bases views; Base table; Kanban board | RM261003ABZP-DI4@R2 | RM261003ABZP-US7@R1 | RM261003ABZP-UV8@R1 |
| RM261003ABZP-M7@R1; Acceptance; AD3 | RM261003ABZP-UREQ10@R1 | RM261003ABZP-UDES10@R2 - Surface: Browser preview page | RM261003ABZP-DI3@R4 | RM261003ABZP-US8@R1 | RM261003ABZP-UV9@R2 |
| RM261003ABZP-M2@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1; Acceptance; AD3 | RM261003ABZP-UREQ11@R1 (PH2 surfaces) | RM261003ABZP-UDES11@R1 - Section 5 policies; Theme | RM261003ABZP-DI3@R4, RM261003ABZP-DI4@R2 | RM261003ABZP-US9@R1 | RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R2 |

## Progress

- **Phase delivery status:** Completed
- **Phase evidence:** DI3 merged to `main` (`e228bb5`, PR #6) and DI4 merged (`6862761`, PR #8), both with CI green. The exit record below covers each item under Completion evidence required. `v1.0.0` is released only when the user asks.

**PH2 exit record** (2026-10-05, `main` at `6862761`)

| Required evidence | Result |
|---|---|
| V and UV records pass in CI on merged DI3 and DI4 | PR #6 and PR #8 merged with `check` and `test` (ubuntu-24.04, macos-15) green; PR #8 head `bbd5290`. `.s1mple/work/done/w261003s6bq-live-and-browser-preview/reports/overall-verification-report.md` and `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/overall-verification-report.md` accepted every group. DI4 integration re-checks (V7, V12, V16 with the `base` renderer registered; UV3 with a Base embed in `tour.md`) pass in the DI4 overall verification |
| RM261003ABZP-V12@R3 and RM261003ABZP-V13@R2 on the reference machine (Apple M1 Max, macOS) | `bun run bench` at PR #8 head `bbd5290`, median of 5: sourceKeystrokeP95 15.10 ms (< 16), liveKeystrokeP95 22.87 ms (< 24), openFile 41.20 ms (< 80), sourceOpenFile 16.06 ms (< 50), liveScrollFrameP95 6.60 ms (< 16.7), sourceScrollFrameP95 5.26 ms (< 16.7), firstFrame 201.25 ms (< 250), indexReady 1225.31 ms (< 3000), indexingKeystrokeP95 18.96 ms (< 30) |
| RM261003ABZP-V14@R2 timings | `bun run check` 7.5 s on the reference machine (< 30 s); PR #8 CI jobs finished within 3 min |
| RM261003ABZP-UV9@R2 manual checklist | Passed in the DI3 overall verification (V42 re-run with every non-loopback request aborted) |
| Manual release dry run on `main` | Run 37297315148 at `6862761`: `build` and the four smoke jobs succeeded, `publish` skipped. The `dist` artifact holds four binaries and `SHA256SUMS`, every checksum verifies, and `so-darwin-arm64 --version` prints `so 0.0.0-dev+6862761`. No tag and no GitHub Release exist |

Kanban lanes are follow-up work (RM261003ABZP-S7@R2): `KANBAN_TYPE` stays `undefined` until a `.base` file saved by core Obsidian 1.14.3 or later is added as `test/fixtures/bases/obsidian-kanban.base` (`test/fixtures/bases/README.md`). The reference machine runs Obsidian 1.13.7.

| DI | Delivery status | Work | PR | Evidence / blocker |
|---|---|---|---|---|
| RM261003ABZP-DI3@R4 | Completed | W261003S6BQ | PR #6 | Merged 2026-10-04T05:41:17Z as `e228bb5` with CI green (`check`, `test` on ubuntu-24.04 and macos-15, head `fba33fe`); `.s1mple/work/done/w261003s6bq-live-and-browser-preview/reports/overall-verification-report.md` (all five groups accepted; finding OVR-VER1 fixed). G4 outputs merged. Open, not blocking: the V43 terminal-image evidence is byte-level, not visual |
| RM261003ABZP-DI4@R2 | Completed | W26100423LX | PR #8 | Merged 2026-10-05T10:33:07Z as `6862761` with CI green (`check`, `test` on ubuntu-24.04 and macos-15, head `bbd5290`); `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/overall-verification-report.md` (Passed). PR #8 also carries mouse support (W261005H4XZ) and the image and diagram zoom float. Open, not blocking: Kanban lanes wait for the Obsidian fixture (W26100423LX V30) |

## Approval

- **Approved phase:** RM261003ABZP-PH2@R6
- **Approved delivery items:** RM261003ABZP-DI3@R4, RM261003ABZP-DI4@R2
- **Approved phase design:** This document's Phase Design, from Architecture and boundaries through UI realization. Pinned upstream:
  - RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R4, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R2;
  - RM261003ABZP-UDES1@R2, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R2, RM261003ABZP-UDES11@R1.
- **Success and verification baseline:**
  - Design-owned: RM261003ABZP-S5@R1, RM261003ABZP-S6@R1, RM261003ABZP-S7@R2, RM261003ABZP-S8@R1, RM261003ABZP-S9@R1, RM261003ABZP-S10@R2, RM261003ABZP-S11@R1; RM261003ABZP-V7@R2, RM261003ABZP-V8@R1, RM261003ABZP-V9@R1, RM261003ABZP-V10@R2, RM261003ABZP-V11@R3, RM261003ABZP-V12@R3, RM261003ABZP-V13@R2, RM261003ABZP-V14@R2, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1.
  - UI-design-owned: RM261003ABZP-US1@R2, RM261003ABZP-US2@R2, RM261003ABZP-US6@R1 … RM261003ABZP-US9@R1; RM261003ABZP-UV1@R2, RM261003ABZP-UV3@R2, RM261003ABZP-UV7@R1, RM261003ABZP-UV8@R1, RM261003ABZP-UV9@R2, RM261003ABZP-UV10@R1.
- **Approval evidence:**
  - R1: the user delegated all decisions on 2026-10-03 ("you self-drive and decide all … don't raise any question to me"; "prevent many DIs and phases split"). Under that delegation the agent approved this phase and its two parallel DIs with gates G2–G4, the widened layout context, unlisted embed buffers and per-buffer Base state, the preview stop order, `createExclusive`, the Bases view-type registry, and the `v1.0.0` release at phase exit.
  - R2: on 2026-10-03 the user asked to leave room for a code editor and notebooks and selected "Apply all six (Recommended)" (`rm261003abzp-roadmap-context.md@R2`). Under the standing delegation the agent approved the PH2@R2 refinements: live preview as a decoration provider with `MarkdownViewInput`/`PreviewCtx`, Markdown-scoped view commands, widget painters, Bases as a registered file type and editor kind with view state in the base window content, the TypeScript bench and `csv` registration proof, and the unchanged phase split and `v1.0.0` release.
  - Post-DI1 synchronization (revisions retained): approved by the user on 2026-10-03. Upstream moved to RM261003ABZP-REQ10@R3, RM261003ABZP-DES8@R2, and RM261003ABZP-DES15@R2. PH2, DI3, and DI4 use `atomicWrite`, exclusive create, and the release workflow unchanged in contract, so no PH or DI outcome, scope, gate, or verification changed.
  - Post-DI2 synchronization (revisions retained): approved by the user on 2026-10-04. Upstream moved to RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, and RM261003ABZP-DES15@R3. DI3 reads mdast per block through `blockNode` instead of a precomputed `Block.node`; the G2 output and every PH2 outcome, scope, gate, and verification are otherwise unchanged.
  - R3: on 2026-10-04 the user decided that releases are manual (a `v*` tag pushed only on request) and that phase exits run a non-publishing release dry run. PH2@R3 changes the outcome (release-ready instead of shipping `v1.0.0`), the PH1 entry condition (no `v0.1.0` release required), the release approach, the S10 exit criterion (RM261003ABZP-S10@R2, RM261003ABZP-V14@R2), and the completion evidence. DI3@R2 and DI4@R2 are retained.
  - R4: on 2026-10-04 the user decided that the browser preview serves KaTeX and Mermaid from the binary and loads web images, and that the terminal editor downloads web images (RM261003ABZP-DES13@R3). PH2@R4 drops the "no bundled KaTeX or Mermaid" exclusion; DI3@R3 changes the `renderHtml` scope to locally served KaTeX and Mermaid, adds web images and `note.enter`, and drops the bundling exclusion. The phase design records the DI3 system-design refinements: `PreviewCtx.folds`, `resolve`, and `embed().text`; folds through `PreviewCtx`; the `line` payload; `src/core/state/markdown-commands.ts`; `note.enter` replacing the `<CR>` binding; `buffers[].embeds`, the `starting` preview state, and the new actions and effects; `src/app/preview-host.ts`; `readImage` and `fetchImage`. DI4@R2 is retained. Approved by the user on 2026-10-04.
  - R5: DI3 delivery synchronization (W261003S6BQ, PR #6), approved by the user on 2026-10-04. RM261003ABZP-REQ9@R3 relaxes the live-view and startup targets (live keystroke p95 < 24 ms, live note open < 80 ms, first frame < 250 ms, keystroke p95 while indexing < 30 ms; source-view targets unchanged). PH2@R5 cites RM261003ABZP-V12@R3 and RM261003ABZP-V13@R2 in its phase design, exit criteria, and completion evidence; DI3@R4 states the new keystroke and open targets. The phase design records the delivered DI3 refinements: the `embed?: true` tag on `read`, `fileLoaded`, and `fileRefused`; `requested` kept until its read answers; window `editor: EditorKind` (RM261003ABZP-DES17@R2); and the generated bench fixtures and split benches. DI4@R2 is retained.
  - R6: On 2026-10-05 the user decided to close v1 with Kanban lanes moved to follow-up work. PH2@R6 changes the outcome (Kanban views open as a table until their `type` is verified), the S7 exit criterion (RM261003ABZP-S7@R2, RM261003ABZP-V10@R2), and the completion evidence (no Kanban fixture). DI3@R4 and DI4@R2 are retained. Approved by the user on 2026-10-05.
