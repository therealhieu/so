# W261003S6BQ Plan Part 1 — Terminal Live Preview

## Status

`Ready`

## Objective

Markdown notes render in the terminal:

- `live` (the default), `source`, and `reading` views, all driven by one pure `livePreview` provider over the existing `Doc`;
- built-in block renderers, including math and Mermaid as text, note embeds, and images;
- reveal on the cursor line or selection, and folds keyed by block id;
- embed targets loaded as unlisted buffers;
- Markdown commands, and a read-only `reading` view;
- `EditorView` lays out once per frame through the view-context registry, keeps the cursor visible with tall widgets, and paints signs and widget rows through the `widgetPainters` registry;
- terminal images use the kitty, sixel, block, and placeholder tiers, with bounded web downloads.

The kernel, `RenderLine`, and `layoutText` stay unchanged. The G4 extension points ship with the phase-design signatures.

## Coverage Summary

- **System Design:** `REQ1@R1, REQ2@R2, REQ3@R1, REQ4@R1, REQ5@R1, REQ6@R1 → DES1, DES2, DES3, DES4, DES5, DES6, DES7, DES8, DES13 → S1, S2, S3, S4, S5, S6, S7, S8, S9, S14, S16 (EditorView part), S18 (producer side) → V1, V1r, V2, V4–V19, V25, V37, V39, V40, V43, V49, V50, V51`
- **UI Design:** `Not applicable — no W UI design. The parent RM261003ABZP-US1@R2/UV1@R2 (view segment through P2), US2@R2/UV3@R2 (V4, V16, V25), and US9@R1/UV10@R1 (DI3 states) are carried through the system design's "UI obligations" row and plan context §7.`

## Sources

- Plan index: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-index.md`
- Plan context: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-context.md`
- System design: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md`
- UI design: Not applicable — no W UI design. The parent UI/UX authority is `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-ui-design.md` (M1@R1, M2@R1, UDES1@R2, UDES3@R2, UDES4@R1, UDES11@R1, UV3@R2, UV10@R1), which the system design references.
- System requirements: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-requirements.md`
- UI requirements: Not applicable — no W UI requirements. The parent UREQs are bound through the discussion context.

## Dependencies

- Cross-work gate G2 (DI2 foundations) must be satisfied. It is confirmed in P1-G1-T1 step 0, before any execution.
- No earlier part.

## Execution Flow

```text
P1-G1: Core provider, renderers, and view context → P1-G2: Views, embeds, commands, and painting → P1-G3: Terminal images
```

## Groups

Every delegated agent (implementer, verifier, remediator) reads and follows `.s1mple/S1MPLE.md` and its required references: `docs/communication.md`, `docs/project.md`, and `docs/languages/typescript.md`. Delegated agents do not use the native `Explore` subagent; they inspect directly.

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command. Do not request separate permission. Commit each task after its checks and self-review pass, and before the next task starts. Commit subjects follow the repository's Conventional Commits style (`feat(scope): …`, `test(scope): …`). Each body carries the task ID and its exact plan title. Task commits are checkpoints, not group acceptance. If a task needs no change, record no-change evidence instead of making an empty commit.

Rules for planned code:

- Do not use work-process identifiers (`REQ`, `DES`, `S`, `V`, `UV`, `W…`, `RM…`, `G4`, phase, task, or goal IDs) in code, comments, identifiers, test names, snapshot names, or log messages. Name tests after the behaviour they check, for example `test("a throwing renderer leaves its block as source")`.
- `src/core` stays pure. `src/core/lang` does not import `src/core/state`. Only `src/ui` imports `@opentui/*`. No Markdown identifier or import is added to `src/core/kernel/**` or `src/ui/editors/text-view.ts`.
- Kernel files, `RenderLine`, `Decoration`, the `layoutText` signature, `FileType`, and `ViewSpec` stay unchanged.
- `paintPreview` in `src/ui/editors/text-view.ts`, the picker preview, keeps using the `source` view. No task changes it.
- Add each package with `bun add <pkg>@<exact>` in the task that first imports it, and commit `bun.lock`.
- Every group ends with `bun run check` passing. Groups that touch `test/ui` or `test/integration` also pass `bun run test:ci`.
- Production wiring in `src/app/main.ts` and test wiring in `test/support/state.ts` and `test/support/ui.ts` change together (design §5 Construction and Wiring Flow).

### P1-G1 — Core provider, renderers, and view context

#### Goal

The pure Markdown provider, every built-in block renderer, the preview configuration, the buffer and window state fields, and the view-context registry with the Markdown context builder all exist in `src/core`. Golden and unit tests prove them in `bun run check`. Terminal behaviour is unchanged until P1-G2 switches the views on.

#### Coverage Summary

- **System Design:** `REQ1@R1, REQ2@R2 (renderer side), REQ3@R1, REQ4@R1 (renderer side), REQ5@R1 (fold input), REQ6@R1 (registry) → DES1 (registry and builder), DES2, DES3, DES4 (renderer), DES5 (fold input), DES7 (renderer and rows), DES13 → S2, S3, S4, S5 (rows), S14, S16 (registry), S18 (provider side) → V1r, V4, V5, V6, V7, V8, V9, V10, V14, V17, V39, V47 (boundary part)`
- **UI Design:** `Not applicable — the style token names that renderers emit follow the parent UDES3@R2 and UDES11@R1 through design §7. UV3@R2 element output is asserted by the V4 goldens.`

#### Scope

- Included:
  - `test/boundaries.test.ts`: lookup by package name, and the `beautiful-mermaid` home;
  - the `preview` configuration section;
  - the provider core: `live-preview.ts`, `reveal.ts`, `render-key.ts`, `inline.ts`, `render-cache.ts`;
  - the math and Mermaid renderers, with the `beautiful-mermaid@1.1.3` pin;
  - the embed and image renderers;
  - the remaining built-in renderers and `builtinRenderers`;
  - the `tour.md` fixture and the V4 goldens;
  - the `BufferState.listed`, `BufferState.embeds`, and `WindowState.content.folds` types;
  - `ViewContextRegistry`, `markdownViewContext`, and `Registries.viewContexts`, wired in `registries()` and `testRegistries()`.
- Excluded:
  - `markdownFileType.views` and `defaultView` (P1-G2-T1, which switches the terminal to live view);
  - `EditorView` (P1-G2);
  - embed loading state logic (P1-G2-T2);
  - the theme tokens (P1-G2-T4);
  - images in the UI (P1-G3);
  - `html.ts` (P2);
  - the `katex` and `mermaid` homes (P2-G1-T2).
- Main files:
  - `test/boundaries.test.ts`, `test/fixtures/boundary-violation/*`;
  - `src/core/config/schema.ts`, `src/core/state/config.test.ts`;
  - `src/core/lang/markdown/{live-preview,reveal,render-key,inline,render-cache}.ts`;
  - `src/core/lang/markdown/renderers/{index,heading,list,table,callout,code,frontmatter,rule,footnote,math,mermaid,embed,image}.ts`;
  - the colocated tests: `live-preview.test.ts` and its `__snapshots__`, `reveal.test.ts`, `renderers/{math,mermaid,embed}.test.ts`;
  - `test/fixtures/tour.md`;
  - `src/core/state/{types,update,view-context,markdown-view}.ts`, `src/core/state/view-context.test.ts`;
  - `src/app/main.ts`, `test/support/state.ts`;
  - `package.json`, `bun.lock`.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ3 → DES3 → S4 → V47 (boundary part)` | None | Subpath imports are checked by package name, and `beautiful-mermaid` is allowed only under `src/core/lang/markdown/` |
| `REQ1, REQ4 → DES13 → S14 → V39` | None | `preview` defaults are `{live, 10, auto}`, and invalid values give line-numbered errors |
| `REQ1 → DES2 → S2 → V1r` | None | Reveal covers the selection and is empty in reading view |
| `REQ1 → DES2 → S3, S18 → V5` | None | A throwing renderer leaves source with `⚠`; a registered renderer for a new key is used without provider edits |
| `REQ5, REQ1 → DES2 → S7 → V14` | None | Renderers run only for visible blocks |
| `REQ3 → DES3 → S4 → V6, V7, V8` | None | Unicode math, ASCII Mermaid, labelled source fallback, and one library call per block hash and width |
| `REQ4 → DES4, DES5 → S5 → V9, V10` | None | Embed cap, `… N more lines`, expansion through folds, loading and missing states, and one level |
| `REQ1 → DES2 → S2 → V4` | parent UV3@R2 element output | `tour.md` goldens at widths 60 and 100 for every reveal state, `reading`, and `source` |
| `REQ6, REQ2 → DES1, DES7 → S8, S16 → V17` | None | The builder registry rejects duplicates, answers `undefined` for unknown file types, and computes image rows |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G2 — DI2 foundations (plan context §2, Cross-Work Dependency Gates; `rm261003abzp-roadmap-phase-2-obsidian-experience.md:69`) | Before P1-G1-T1 execution (step 0) | `git merge-base --is-ancestor 9adb285 HEAD` succeeds. DI2 PR #2 already passed V4@R2, V5@R1, V6@R2, and V18@R1 (recorded as satisfied in plan context §2). | RM261003ABZP-DI3@R3 — W261003S6BQ |
| G4 — DI3 extension points for DI4 (plan context §2; phase file `:71`) | The producer outputs land in P1-G1-T3 (`registerBlockRenderer`, `BlockRenderer`, `PreviewCtx`, `MarkdownViewInput`, `livePreview`). The gate is due before DI4 execution, not within this part. | Signatures equal the phase design at `rm261003abzp-roadmap-phase-2-obsidian-experience.md:205-230`. Proven in P3-G1 by V5, V38, and V41, and by V4 as the V7@R2 goldens. | RM261003ABZP-DI4@R2 — W Pending |

#### Tasks

##### P1-G1-T1 — Package homes by package name

- **Outcome:** The boundary test checks subpath imports by package name, and `beautiful-mermaid` has its home under `src/core/lang/markdown/`.
- **System Design:** `REQ3@R1 → DES3 → S4 → V47 (boundary part)`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7, `test/boundaries.test.ts`, `package.json`, `test/support/*`, fixtures (`PACKAGE_HOMES`, `checkImports` package-name lookup)
- **Files:** `test/boundaries.test.ts` (`PACKAGE_HOMES`, `checkImports`, `VIOLATION_FIXTURES`), `test/fixtures/boundary-violation/state-imports-yaml-subpath.ts`
- **Execution Approach:** `TDD`

**Steps:**

0. **Gate G2:** run `git merge-base --is-ancestor 9adb285 HEAD && echo ok`. It must print `ok`; stop and report if it does not.

1. **RED — `V47`:** `test/boundaries.test.ts`. Add a fixture that imports a `yaml` subpath from `src/core/state/`. It must report exactly one violation.

   **Preview:**

   ```ts
   // test/fixtures/boundary-violation/state-imports-yaml-subpath.ts
   // Checked as if at src/core/state/x.ts; a subpath import must not bypass yaml's home.
   import { parse } from "yaml/dist/index.js";
   export const value = parse("a: 1");

   // test/boundaries.test.ts — VIOLATION_FIXTURES
   { file: "state-imports-yaml-subpath.ts", as: "src/core/state/x.ts" },
   ```

   - Run `bun test test/boundaries.test.ts`. It must fail because today the home lookup uses the whole specifier.

2. **GREEN:** `test/boundaries.test.ts`: `checkImports`, `PACKAGE_HOMES`.

   **Preview:**

   ```ts
   const packageName = (specifier: string) =>
     specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/");
   // in checkImports:
   const homes = PACKAGE_HOMES[packageName(specifier)];
   // PACKAGE_HOMES += "beautiful-mermaid": ["src/core/lang/markdown/"]
   // katex and mermaid homes are added in P2-G1-T2 with their pins.
   ```

   - Keep the error message format. Keep the existing fixtures reporting one violation each and `src` reporting none.

3. **REFACTOR:** None beyond naming. Do not change `LAYER_RULES`.

   **Preview:**

   ```text
   // Allowed: inline the helper if biome prefers it. Prohibited: loosening any layer rule.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(boundaries): check package homes by package name

   Task: P1-G1-T1 — Package homes by package name
   ```

   - Record the commit SHA.

**Verification:**

- `V47` (boundary part): `bun test test/boundaries.test.ts` → all fixtures report one violation each, and `src` reports none.

##### P1-G1-T2 — Preview configuration section

- **Outcome:** `config.toml` accepts `[preview]` with `mode`, `embedMaxRows`, and `images`, using the documented defaults and line-numbered errors.
- **System Design:** `REQ1@R1, REQ4@R1 → DES13 → S14 → V39`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `AppConfig.preview` — Schema; §7 `src/core/config/schema.ts`
- **Files:** `src/core/config/schema.ts` (`ConfigSchema`, `AppConfig`), `src/core/state/config.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V39`:** `src/core/state/config.test.ts`. Three cases:
   - an empty config gives `defaults.preview` equal to `{ mode: "live", embedMaxRows: 10, images: "auto" }`;
   - `[preview]` with `embedMaxRows = 0` on line 3 gives an error naming `config.toml:3`;
   - `preview.zoom = 1` gives an unknown-key error.

   **Preview:**

   ```ts
   test("preview options default to live view, ten embed rows, and automatic images", () => {
     expect(parseConfig("").config.preview).toEqual({ mode: "live", embedMaxRows: 10, images: "auto" });
   });
   test("an out-of-range embed row limit names its line", () => { /* "[editor]\n\n[preview]\nembedMaxRows = 0" → error contains "config.toml:3" */ });
   test("an unknown preview key is rejected", () => { /* "[preview]\nzoom = 1" → unknown-key error */ });
   ```

   - Run `bun test src/core/state/config.test.ts`. It must fail with no `preview` section.

2. **GREEN:** `src/core/config/schema.ts`: `ConfigSchema.preview`.

   **Preview:**

   ```ts
   preview: z
     .strictObject({
       mode: z.enum(["live", "source", "reading"]).default("live"),
       embedMaxRows: z.number().int().min(1).max(200).default(10),
       images: z.enum(["auto", "blocks", "off"]).default("auto"),
     })
     .prefault({}),
   ```

   - Follow the `editor` section pattern exactly; `parseConfig` is unchanged.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: changing other sections or parseConfig.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(config): add preview options

   Task: P1-G1-T2 — Preview configuration section
   ```

   - Record the commit SHA.

**Verification:**

- `V39`: `bun test src/core/state/config.test.ts` → defaults, line-3 error, and unknown-key error.

##### P1-G1-T3 — Live-preview provider core and renderer registry

- **Outcome:** `livePreview` walks only the visible blocks, applies reveal, picks a renderer by render key, falls back to the paragraph renderer, and isolates a throwing renderer with a `⚠` sign. The G4 registry `registerBlockRenderer` exists with the phase-design signatures.
- **System Design:** `REQ1@R1, REQ5@R1 → DES2 → S2, S3, S7, S18 → V1r, V5, V14`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `PreviewCtx` — Contract; §6 `MarkdownViewInput` and `BlockRenderer` — Contract (G4); §7 `src/core/lang/markdown/live-preview.ts`, `reveal.ts`, `render-key.ts`, `inline.ts`, `render-cache.ts`; phase design `rm261003abzp-roadmap-phase-2-obsidian-experience.md:205-230`
- **Files:**
  - `src/core/lang/markdown/live-preview.ts` (`PreviewCtx`, `MarkdownViewInput`, `BlockRenderer`, `registerBlockRenderer`, `livePreview`, `blocksIn`);
  - `reveal.ts` (`RevealSet`, `reveal`, `MULTILINE_KEYS`);
  - `render-key.ts` (`renderKey`, `embedOnly`, `IMAGE_EXTENSIONS`);
  - `inline.ts` (`inlineDecorations`);
  - `render-cache.ts` (`RenderCache`);
  - `reveal.test.ts` and `live-preview.test.ts` (V5 and V14 cases).
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V1r`, `V5`, `V14`:**

   - `src/core/lang/markdown/reveal.test.ts`:
     - a selection over two lines spanning a table reveals both lines and the table's block id;
     - after the cursor moves out, both sets are empty;
     - the `reading` view gives empty sets.
   - `src/core/lang/markdown/live-preview.test.ts`, run through `layoutText` with a `PreviewCtx` stub:
     - a throwing `callout` renderer gives raw source lines with `⚠` on the first line only, and other blocks are unchanged;
     - a stub renderer registered for `xbase` decorates `![[t.xbase]]`;
     - over a 5,000-line `Doc` with 30 visible lines, renderers are called only for blocks that intersect the visible range.

   **Preview:**

   ```ts
   const ctx: PreviewCtx = { resolve: (t) => t, isResolved: () => true, embed: () => "missing",
     image: () => "unknown", folds: new Set(), embedMaxRows: 10, images: "auto" };
   test("a throwing renderer leaves its block as source with a warning sign", () => {
     registerBlockRenderer("callout", () => { throw new Error("boom"); });
     // layoutText(view, [livePreview], { doc, view: "live", ctx }) → callout rows equal raw lines; first has sign ⚠
   });
   test("a renderer registered for a new embed extension is used without provider changes", () => { /* xbase stub */ });
   test("only blocks in the visible range are rendered", () => { /* spy count === blocks intersecting visible */ });
   ```

   - Run `bun test src/core/lang/markdown`. It must fail because the modules do not exist.

2. **GREEN:**
   - `src/core/lang/markdown/live-preview.ts`, `reveal.ts`, `render-key.ts`, `inline.ts`, `render-cache.ts`.
   - A minimal `paragraph` renderer: inline decorations only. It lets the fallback path run before P1-G1-T6 registers the built-ins.

   **Preview:**

   ```ts
   // live-preview.ts — exact shapes from design §7 live-preview.ts (PreviewCtx with resolve, folds, embed().text)
   export function blocksIn(doc: Doc, r: { from: number; to: number }): Block[] { /* binary search over doc.blocks by line */ }
   // livePreview: reveal → blocksIn(v.visible) → revealed ? revealSigns (▕, signReveal) : renderer(renderKey) + inlineDecorations
   //              catch → { kind: "line", line: block.startLine, sign: { text: "⚠", style: "signError" } }
   // render-key.ts — refine only paragraph-kind blocks through blockNode (design §7 render-key.ts)
   // render-cache.ts — LRU of 512 entries keyed `${hash}|${width}|${variant}`
   ```

   - No `@opentui`, `core/state`, or I/O import.
   - A later `registerBlockRenderer` call for the same key replaces the earlier one.
   - The provider reads only the visible lines plus the text of the blocks that intersect them.

3. **REFACTOR:** Share `wholeBlock(block)` and `embedLink(block)` helpers inside `src/core/lang/markdown/` if both later renderers need them.

   **Preview:**

   ```text
   // Allowed: small private helpers. Prohibited: changing kernel Decoration or layoutText.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(markdown): add live-preview provider and block renderer registry

   Task: P1-G1-T3 — Live-preview provider core and renderer registry
   ```

   - Record the commit SHA.

**Verification:**

- `V1r`: `bun test src/core/lang/markdown/reveal.test.ts` → selection, cursor-out, and reading cases pass.
- `V5`, `V14`: `bun test src/core/lang/markdown/live-preview.test.ts` → isolation, extension, and visible-only cases pass.

##### P1-G1-T4 — Math and Mermaid text renderers

- **Outcome:** Math renders as Unicode and Mermaid as ASCII. Both fall back to labelled source, and the Mermaid result is computed once per block hash and width.
- **System Design:** `REQ3@R1 → DES3 → S4 → V6, V7, V8`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7 `src/core/lang/markdown/renderers/math.ts` and `renderers/mermaid.ts`
- **Files:**
  - `src/core/lang/markdown/renderers/math.ts` (`MathResult`, `mathText`, `mathRenderer`);
  - `renderers/mermaid.ts` (`MermaidResult`, `mermaidText`, `mermaidRenderer`);
  - `renderers/math.test.ts`, `renderers/mermaid.test.ts`;
  - `package.json`, `bun.lock`.
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V6`, `V7`, `V8`:**

   - `math.test.ts`: `"E = mc^2"` and `"\sum_{i=1}^{n} x_i \le \frac{a}{b}"` give `kind: "unicode"`; `"\unknowncmd x"` gives `{ kind: "source", tex }`.
   - `mermaid.test.ts`:
     - the `tour.md` flowchart gives box-drawing lines;
     - a `gantt` diagram gives `{ kind: "source", label: "mermaid: gantt shown as source" }`;
     - a malformed flowchart gives a source label;
     - 50 re-layouts of keys typed outside the fence call the library once.

   **Preview:**

   ```ts
   test("unsupported mermaid diagrams fall back to labelled source", () => {
     expect(mermaidText("gantt\n  title x", 80)).toEqual({ kind: "source", label: "mermaid: gantt shown as source" });
   });
   test("typing outside a diagram does not lay it out again", () => {
     // wrap the library call through a registered spy renderer; re-run livePreview 50× with edits outside the fence → 1 call
   });
   ```

   - Run `bun test src/core/lang/markdown/renderers`. It must fail because the modules are missing.

2. **GREEN:**
   - Run `bun add beautiful-mermaid@1.1.3`.
   - Port `mathText` from `../alfred/apps/tui/src/view/markdown/math.ts` and `mermaidText` from `../alfred/apps/tui/src/view/markdown/mermaid.ts`.

   **Preview:**

   ```ts
   export function mathText(tex: string): MathResult;               // unicode only when every token maps
   export function mermaidText(source: string, width: number): MermaidResult; // parseMermaid + renderMermaidASCII
   const cache = new RenderCache<MermaidResult>();
   export const mermaidRenderer: BlockRenderer = (block, v, input) => {
     const r = cache.get(`${block.hash}|${v.width}`, () => mermaidText(fenceBody(block, v.buf), v.width));
     // text → one block widget { type: "text", data: Span[][], rows: lines.length }; source → label row + source kept
   };
   ```

   - Import `beautiful-mermaid` only in `renderers/mermaid.ts`.

3. **REFACTOR:** Remove Alfred-specific types that the port does not need.

   **Preview:**

   ```text
   // Allowed: trimming port leftovers. Prohibited: registering renderers here (P1-G1-T6 owns builtinRenderers).
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes, including `package.json` and `bun.lock`.

   **Commit message:**

   ```text
   feat(markdown): render math and mermaid as terminal text

   Task: P1-G1-T4 — Math and Mermaid text renderers
   ```

   - Record the commit SHA.

**Verification:**

- `V6`: `bun test src/core/lang/markdown/renderers/math.test.ts` → Unicode results for the two formulas and a source result for the unknown command.
- `V7`, `V8`: `bun test src/core/lang/markdown/renderers/mermaid.test.ts` → box-drawing output, source labels, and a single library call.
- `V47` (boundary part): `bun test test/boundaries.test.ts` → no violation.

##### P1-G1-T5 — Embed and image renderers

- **Outcome:**
  - Note embeds become a capped `embed` widget of span rows. The widget expands through folds, shows the loading and missing states, and renders nested embeds as links, so embedding stops at one level.
  - Images become an `image` widget, or the `[image: name]` text when images are off or the target does not resolve.
- **System Design:** `REQ4@R1, REQ2@R2 → DES4, DES5, DES7 → S5, S8 → V9, V10`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7 `src/core/lang/markdown/renderers/embed.ts` (`EmbedData`, `embedRenderer`, `embedRows`, `sectionLines`) and §7 `renderers/image.ts` (`isWebUrl`, `imageRenderer`)
- **Files:** `src/core/lang/markdown/renderers/embed.ts`, `renderers/image.ts`, `renderers/embed.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V9`, `V10`:** `renderers/embed.test.ts`, with a `PreviewCtx` stub.
   - `![[so-roadmap#Goals]]` has a 25-line section and `embedMaxRows` is 10. The widget rows are the title, 10 rows, and `… 15 more lines`.
   - With the block id in `folds`, the rows are the title and 25 rows.
   - In the `"loading"` state, `min(10, 3)` rows are reserved.
   - In the `"missing"` state, the widget uses the `linkUnresolved` state.
   - A target that embeds itself renders its inner embed as a link.

   **Preview:**

   ```ts
   test("an embedded section is capped with a more-lines row", () => { /* rows === 1 + 10 + 1; data.more === 15 */ });
   test("a toggled embed expands fully", () => { /* folds has block.id → rows === 1 + 25 */ });
   test("a loading embed reserves its rows", () => { /* rows === 3, data.state === "loading" */ });
   test("embeds stop at one level", () => { /* inner ![[self]] appears as link spans */ });
   ```

   - Run `bun test src/core/lang/markdown/renderers/embed.test.ts`. It must fail.

2. **GREEN:** `renderers/embed.ts`, `renderers/image.ts`.

   **Preview:**

   ```ts
   // embed.ts — design §7: resolve → ctx.embed → nested layoutText over target text with livePreview in
   // "reading" and a ctx whose embed() is always "missing"; cap by embedMaxRows unless folds.has(block.id)
   // image.ts — design §7: isWebUrl passthrough, ctx.resolve, placeholder spans when images "off" or unresolved,
   // else widget { type: "image", data: { path, name }, rows: ctx.image(path) === "unknown" ? 1 : rows }
   ```

   - Renderers never perform I/O and never decode images.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: reading state; everything comes through PreviewCtx.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(markdown): render note embeds and image widgets

   Task: P1-G1-T5 — Embed and image renderers
   ```

   - Record the commit SHA.

**Verification:**

- `V9`, `V10`: `bun test src/core/lang/markdown/renderers/embed.test.ts` → the cap, expansion, loading, missing, and one-level cases pass.

##### P1-G1-T6 — Built-in renderers and the tour goldens

- **Outcome:** Headings, lists, tables, callouts and quotes, code, frontmatter, rules, footnotes, comments, math, Mermaid, embeds, and images are registered by `builtinRenderers`. The `tour.md` goldens are committed for widths 60 and 100, for every cursor state, and for `reading` and `source`.
- **System Design:** `REQ1@R1, REQ5@R1 → DES2, DES5 → S2 → V4`
- **UI Design:** `Not applicable — parent UV3@R2 element appearance is asserted through these goldens (H1–H4 prefixes █ ▊ ▌ ▏, hidden comments, reveal signs).`
- **Canonical Shapes:** System design §7 `inline.ts`, `render-cache.ts`, `renderers/*` (`builtinRenderers` registration list); §5 Keystroke to frame in live view
- **Files:**
  - `src/core/lang/markdown/renderers/{index,heading,list,table,callout,code,frontmatter,rule,footnote}.ts`;
  - `src/core/lang/markdown/live-preview.test.ts` (V4 cases), `src/core/lang/markdown/__snapshots__/live-preview.test.ts.snap`;
  - `test/fixtures/tour.md`.
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V4`:** Add `test/fixtures/tour.md`, which contains every REQ5 element, a Mermaid flowchart, embeds, and images. In `live-preview.test.ts`, serialize the `RenderLine[]` from `layoutText(view, [livePreview], input)` as text plus style tokens, and snapshot it:
   - at widths 60 and 100;
   - with the cursor on a blank line, a bold line, and inside the table, callout, fence, frontmatter, and Mermaid block;
   - in `reading`;
   - in `source` (no provider).

   The cases assert that:
   - H1–H4 start with █ ▊ ▌ ▏;
   - the `%%comment%%` line is absent;
   - `▕` appears only on revealed rows.

   **Preview:**

   ```ts
   for (const width of [60, 100])
     for (const cursor of CURSORS) // blank, bold, table, callout, fence, frontmatter, mermaid
       test(`tour note at width ${width} with the cursor ${cursor.name}`, () => {
         builtinRenderers();
         expect(serialize(layoutText(view(width, cursor.pos), [livePreview], input("live")))).toMatchSnapshot();
       });
   ```

   - Run `bun test src/core/lang/markdown/live-preview.test.ts`. It must fail because `builtinRenderers` does not exist.

2. **GREEN:** `renderers/index.ts` (`builtinRenderers`) and the per-key renderers.

   **Preview:**

   ```ts
   // design §7 builtinRenderers list, verbatim registration keys:
   // heading list table callout quote(→ calloutRenderer) code math mermaid frontmatter rule footnote comment embed image
   // callout: icon + title; ▸ and body hidden by block replace when folded ([!x]- default folded, PreviewCtx.folds toggles)
   // rule: widget { type: "rule", rows: 1 }; table: box-drawn, cached by hash|width
   ```

   - Each renderer returns kernel decorations only.
   - Rendered text that is taller than its source uses a `text` widget.
   - Review every snapshot by eye against the parent M2@R1 element list before committing it.

3. **REFACTOR:** Deduplicate span-building helpers across renderers inside `renderers/`.

   **Preview:**

   ```text
   // Allowed: shared helpers in renderers/. Prohibited: changing PreviewCtx or registry signatures.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(markdown): register built-in block renderers with tour goldens

   Task: P1-G1-T6 — Built-in renderers and the tour goldens
   ```

   - Record the commit SHA.

**Verification:**

- `V4`: `bun test src/core/lang/markdown/live-preview.test.ts` → the committed goldens match, and the heading-prefix, comment, and reveal-sign assertions pass.

##### P1-G1-T7 — View-context registry and Markdown context builder

- **Outcome:**
  - `Registries.viewContexts` holds a `ViewContextRegistry` with `markdownViewContext` registered for `markdown`, in both production and test wiring.
  - Buffer and window state carry the optional `listed`, `embeds`, and `folds` fields.
  - `builtinRenderers()` runs at startup.
- **System Design:** `REQ6@R1, REQ2@R2, REQ4@R1, REQ5@R1 → DES1, DES4, DES5, DES7 → S8, S16 → V17`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `ViewHost` and `ViewContextBuilder` — Contract; §6 `BufferState.listed` and `BufferState.embeds` — State; §6 `WindowState.content.folds` — State; §7 `src/core/state/view-context.ts`, `markdown-view.ts`, `types.ts`, `update.ts` (`Registries`)
- **Files:**
  - `src/core/state/view-context.ts` (`ViewHost`, `ViewContextBuilder`, `ViewContextRegistry`);
  - `src/core/state/markdown-view.ts` (`markdownViewContext`, `imageRows`);
  - `src/core/state/types.ts` (`BufferState.listed`, `BufferState.embeds`, `WindowState.content.folds`);
  - `src/core/state/update.ts` (`Registries.viewContexts`);
  - `src/app/main.ts` (`registries`, `builtinRenderers()` call);
  - `test/support/state.ts` (`testRegistries`);
  - `src/core/state/view-context.test.ts`.
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V17`:** `src/core/state/view-context.test.ts`, with a `ViewHost` stub:
   - a duplicate registration throws;
   - an unknown file type gives `undefined`;
   - a 1600×900 px image at width 80, rows 40, and aspect 0.5 gives `rows = min(ceil(900/1600·80·0.5), 32) = 23`;
   - an image with no known size gives `"unknown"`.

   **Preview:**

   ```ts
   test("a second builder for one file type is rejected", () => { /* expect(() => r.register("markdown", b)).toThrow() */ });
   test("image rows follow the window width and cell aspect", () => {
     const ctx = markdownViewContext(s, winId, { width: 80, rows: 40, cellAspect: 0.5,
       imageSize: (p) => (p === "img/a.png" ? { width: 1600, height: 900 } : undefined) }) as PreviewCtx;
     expect(ctx.image("img/a.png")).toEqual({ rows: 23 });
     expect(ctx.image("img/b.png")).toBe("unknown");
   });
   ```

   - Run `bun test src/core/state/view-context.test.ts`. It must fail.

2. **GREEN:** the files listed above.

   **Preview:**

   ```ts
   // types.ts — additions only (design §7 types.ts):
   //   BufferState: listed?: false; embeds?: { requested: string[]; refused: string[] }
   //   WindowState.content: folds?: number[]
   // update.ts: export type Registries = { /* … */ viewContexts: ViewContextRegistry };
   // main.ts registries(): const viewContexts = new ViewContextRegistry();
   //   viewContexts.register("markdown", markdownViewContext); builtinRenderers();
   // test/support/state.ts testRegistries(): same two lines, so test registries equal production in content
   ```

   - `markdownViewContext` is pure, uses `resolveLink`, and reads the laid-out buffer's own `embeds`. It caps image rows at 80% of the window rows.
   - Fix any typed `Registries` literal elsewhere in tests by adding `viewContexts`.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: preview state (P2-G1-T4) and EditorView use (P1-G2-T1).
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): add view-context registry and markdown context builder

   Task: P1-G1-T7 — View-context registry and Markdown context builder
   ```

   - Record the commit SHA.

**Verification:**

- `V17`: `bun test src/core/state/view-context.test.ts` → duplicate, unknown, rows 23, and unknown-image cases pass.
- `V47`: `bun run check` → passes with zero knip findings. `builtinRenderers` and `markdownViewContext` are reachable from `src/app/main.ts`.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Biome, tsc, knip, boundaries, and unit suites pass |
| Component suites unchanged | `bun run test:ci` | Passes with no snapshot change, because no view or `EditorView` behaviour changed |
| Kernel untouched | `git diff --stat <group-base>..HEAD -- src/core/kernel src/core/filetypes/registry.ts` | Empty |
| G4 signatures | Compare `live-preview.ts` exports with `rm261003abzp-roadmap-phase-2-obsidian-experience.md:205-230` | Equal, with only the additive `PreviewCtx` members `resolve`, `folds`, and `embed().text` |

#### Review and Verification Focus

- **Specification:**
  - DES2 provider rules: visible-only, reveal, fallback, failure isolation, and last registration wins.
  - DES3 fallback labels.
  - DES4 one level and the cap.
  - DES13 defaults.
  - The DES1 registry contract.
  - The G4 phase signatures.
- **Technical:**
  - Purity and layer rules: no `core/state` import from `core/lang`, and no I/O.
  - Cache keys include the width.
  - Goldens were reviewed, not blindly accepted.
  - No work-process identifiers in test names.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P1-G2 — Views, embeds, commands, and painting

#### Goal

- Markdown notes open in `live`, through `EditorView` and the view-context registry.
- Embed targets load once as unlisted buffers and are evicted when no longer embedded.
- Folds, tasks, view cycling, `Enter`, and the read-only `reading` view work on notes, and code files are unaffected.
- `EditorView` lays out once per frame, fits the cursor, and paints the sign column and widget rows through the `widgetPainters` registry.
- The Markdown style tokens keep their NO_COLOR fallbacks.

#### Coverage Summary

- **System Design:** `REQ1@R1, REQ4@R1, REQ5@R1, REQ6@R1 → DES1 (views, defaultView, EditorView input), DES4, DES5, DES6, DES8 → S1, S5, S6, S7, S9, S16 (EditorView has no Markdown), S18 (widget painter registry) → V1, V2, V11, V12, V13, V16, V25, V37, V49`
- **UI Design:** `Not applicable — parent UV3@R2 (V16, V25) and RM261003ABZP-UV10@R1 DI3 states (a theme golden case traced directly, per plan context §7) are carried through the system design's "UI obligations" row.`

#### Scope

- Included:
  - `markdownFileType.views` (live, source, reading);
  - `defaultView`;
  - `EditorView.layoutFrame` with the view input, `fitCursor`, the sign column, and widget-row painting;
  - the widget painter registry with the `rule`, `embed`, and `text` painters;
  - `syncEmbeds` and embed read settlement;
  - `listed` filtering in the session snapshot, bufferline, `:bn`/`:bp`, and picker open paths;
  - the Markdown commands `view.cycle`, `task.toggle`, `fold.toggle`, and `note.enter`;
  - removing `<CR>` from `linkBindings` and exporting `followLink`;
  - the read-only refusal in `runVim`;
  - the Markdown, sign, and placeholder theme tokens;
  - the UV10 DI3 states golden case.
- Excluded:
  - the image cache, image painter, and image sizes in `ViewHost` (P1-G3; until then `ViewHost.imageSize` answers `undefined` and `cellAspect` is `0.5`, the `ImageCache` default);
  - V15, which needs sized image widgets (P1-G3-T4);
  - the `preview.start`/`preview.stop` commands, `EX_ALIASES`, and the statusline (P2-G1);
  - `paintPreview` (unchanged).
- Main files:
  - `src/core/lang/markdown/file-type.ts`;
  - `src/core/state/{buffers,embeds,update,session,picker,commands,markdown-commands,link-commands,keys}.ts` and their tests `embeds.test.ts`, `markdown-commands.test.ts`, `session.test.ts`;
  - `src/ui/editors/text-view.ts`, `src/ui/widgets/{registry,rule,embed}.ts`, `src/ui/theme.ts`, `src/ui/views/bufferline.ts`;
  - `src/app/main.ts`, `test/support/{state,ui}.ts`;
  - `test/ui/live-preview.test.ts`, `test/ui/theme.golden.test.ts`, and the snapshots under `test/ui/__snapshots__/`.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ6 → DES1, DES13 → S1 → V1` | None | A PH1 `state.json` with `view: "source"` restores the note in `live`; a code file opens in `source` |
| `REQ4 → DES4 → S5 → V11, V12, V49` | None | One read per path; unlisted, not shown, and evicted; a refused target is not re-requested and no notice is shown; per-note request state; no new top-level key |
| `REQ5 → DES5 → S6 → V13` | None | Folds follow block ids, and `[!x]-` starts folded |
| `REQ6, REQ1 → DES8 → S9 → V2, V37` | None | View cycle with message; task toggle in one undo step; `Enter` toggles or follows; reading refuses edits with the hint |
| `REQ5, REQ1 → DES6, DES4 → S7, S5 → V16` | parent UV3@R2 | Sign column, rule widget, embed rows with `… N more lines`, folded callout as one row |
| `REQ1, REQ6 → DES8, DES1 → S9, S16 → V25` | parent UV3@R2 (`sync.ts`) | Code files paint raw lines with an empty sign column, and Markdown keys do nothing there |
| `REQ1 → DES6 → S7 (tokens)` | parent RM261003ABZP-UV10@R1 (DI3 states) | NO_COLOR emits no colour SGR, live-view states stay distinguishable by attribute or glyph, the light-theme golden matches, and 80×24 does not clip |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G4 — DI3 extension points for DI4 (plan context §2; phase file `:71`) | The producer outputs land in P1-G2-T4 (`registerWidgetPainter`, `WidgetPainter`, widget row painting) and P1-G2-T2 (unlisted embed buffers). Due before DI4 execution, not within this part. | `WidgetPainter` and `registerWidgetPainter` match the phase design (`:205-230`). Proven in P3-G1 by V41. | RM261003ABZP-DI4@R2 — W Pending |

#### Tasks

##### P1-G2-T1 — Markdown views through EditorView

- **Outcome:**
  - Notes open in the configured mode (`live` by default) and code files in `source`.
  - `EditorView` passes `spec.input(analysis, ctx)` built through `reg.viewContexts`, so live and reading notes render through `livePreview`.
  - A PH1 session restores notes in `live`.
- **System Design:** `REQ6@R1, REQ1@R1 → DES1, DES13 → S1, S16 → V1`
- **UI Design:** `Not applicable — the existing shell goldens that open notes now show the live view (parent UV3@R2).`
- **Canonical Shapes:** System design §7 `src/core/lang/markdown/file-type.ts`; §7 `src/core/state/buffers.ts` (`defaultView`, `onFileLoaded` view); §7 `src/ui/editors/text-view.ts` (`layoutFrame`); §5 Open and restore
- **Files:**
  - `src/core/lang/markdown/file-type.ts` (`markdownFileType.views`);
  - `src/core/state/buffers.ts` (`defaultView`, `onFileLoaded`);
  - `src/ui/editors/text-view.ts` (`layoutFrame`, replacing `layout`);
  - `src/core/state/session.test.ts`;
  - `test/ui/__snapshots__/*.snap`, for the reviewed updates only.
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V1`:** `src/core/state/session.test.ts`. Restoring `{ buffers: [{ path: "notes/plan.md", view: "source" }] }` and then loading the file yields `view: "live"`. A `.ts` file yields `"source"`. With `preview.mode = "reading"`, a note yields `"reading"`.

   **Preview:**

   ```ts
   test("a restored note opens in live view", () => { /* stateLoaded → fileLoaded("notes/plan.md") → buffer.view === "live" */ });
   test("the configured mode applies only to file types that have that view", () => { /* sync.ts → "source" */ });
   ```

   - Run `bun test src/core/state/session.test.ts`. It must fail, because the only view today is `source`.

2. **GREEN:**

   **Preview:**

   ```ts
   // file-type.ts — design §7: views [live (livePreview, input asInput("live")), source, reading (readOnly, livePreview)]
   // buffers.ts
   export const defaultView = (ft: FileType, cfg: AppConfig): string =>
     ft.views.some((v) => v.id === cfg.preview.mode) ? cfg.preview.mode : (ft.views[0]?.id ?? "source");
   // onFileLoaded: view: defaultView(ft, s.config)
   // text-view.ts layoutFrame — design §7: host = { width, rows, imageSize: () => undefined, cellAspect: 0.5 }
   //   (P1-G3-T4 replaces both with deps.images); ctx = reg.viewContexts.build(b.fileType, s, windowId, host);
   //   input = spec?.input ? spec.input(b.analysis, ctx) : b.analysis; TextView.folds stays EMPTY
   ```

   - Keep the existing layout `catch`.
   - Leave `paintPreview` untouched.
   - Run `bun run test:ci`. Review every snapshot diff in `test/ui/__snapshots__/`: accept only diffs where a `.md` note now renders in live view according to parent M2@R1, then update them with `bun test test/ui -u`.

3. **REFACTOR:** Rename `layout` to `layoutFrame` and update its callers inside `text-view.ts` only.

   **Preview:**

   ```text
   // Prohibited: any Markdown import or identifier in text-view.ts; changing paintPreview.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(editor): open notes in live view through the view-context registry

   Task: P1-G2-T1 — Markdown views through EditorView
   ```

   - Record the commit SHA.

**Verification:**

- `V1`: `bun test src/core/state/session.test.ts` → notes restore in `live` and code files in `source`.
- `bun run test:ci` → passes. Each updated snapshot shows only live rendering of notes.

##### P1-G2-T2 — Embed targets as unlisted buffers

- **Outcome:**
  - A listed note's embed targets are read once each.
  - A target opens unlisted and is not shown, and is evicted when no listed note embeds it.
  - A refused target is recorded on each embedding note and is never re-requested, with no error notice.
  - Unlisted buffers never appear in the session, the bufferline, `:bn`/`:bp`, or picker open paths.
- **System Design:** `REQ4@R1 → DES4 → S5 → V11, V12, V49`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `BufferState.listed` and `BufferState.embeds` — State; §7 `src/core/state/embeds.ts`; §7 `update.ts` (wrapper); §7 `buffers.ts` (`onFileLoaded`, `onFileRefused`, `showBuffer`); §7 `{status,session,picker,commands,link-commands,init}.ts` (`snapshotSession`, `openPaths`, `cycleBuffer`); §5 Embed load
- **Files:**
  - `src/core/state/embeds.ts` (`embedTargets`, `syncEmbeds`, `settleEmbedRead`);
  - `src/core/state/update.ts` (`createUpdate` wrapper);
  - `src/core/state/buffers.ts` (`onFileLoaded`, `onFileRefused`, `showBuffer`);
  - `src/core/state/session.ts` (`snapshotSession`);
  - `src/core/state/picker.ts` (`openPaths`);
  - `src/core/state/commands.ts` (`cycleBuffer`);
  - `src/ui/views/bufferline.ts` (`Bufferline`);
  - `src/core/state/embeds.test.ts`.
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V11`, `V12`, `V49`:** `src/core/state/embeds.test.ts`, run through `createUpdate`:
   - Note A embeds B, and embeds C twice; then a keystroke; then `fileLoaded(B)`. There is exactly one read each for B and C, both recorded in A's `embeds.requested`. B opens with `listed: false`, is not shown, and leaves A's `requested`. Recent files are unchanged.
   - Close A, then call `snapshotSession`. Unlisted B is removed, and `buffers` omits B. No buffer carries `embeds` in the snapshot.
   - Second run: `Enter` on the embed (open B through `showBuffer`) before closing A. B becomes listed and is kept.
   - Note A and note E both embed D. There is one read for D, recorded in both A and E. After `fileRefused(D)`, D is in both buffers' `refused` and no error notice appears. A keystroke in A emits no read. A's `PreviewCtx.embed(D)` is `"missing"`. Removing the embed from A drops D from A only. `AppState` gains no top-level key.

   **Preview:**

   ```ts
   test("each embed target is read once and opens unlisted", () => { /* effects filter kind "read" → [B, C] */ });
   test("closing the embedding note evicts its unlisted targets and keeps them out of the session", () => {});
   test("a refused embed is not requested again and shows no error", () => {});
   ```

   - Run `bun test src/core/state/embeds.test.ts`. It must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   // embeds.ts — design §7 syncEmbeds/settleEmbedRead (inFlight dedup across buffers; identity kept when unchanged)
   // update.ts wrapper: const r = syncEmbeds(state, followShownNote(state, step(state, action)));
   // buffers.ts — design §7: embedOnlyRead → { listed: false }, not shown, recent untouched, settleEmbedRead(…, false);
   //   onFileRefused with an embed request and no waiting restore → settleEmbedRead(…, true), no notice;
   //   showBuffer removes listed
   // session.ts / picker.ts openPaths / commands.ts cycleBuffer / bufferline.ts: .filter((b) => b.listed !== false)
   ```

   - A throwing step still keeps the previous state.
   - `syncEmbeds` returns `r` unchanged when neither the buffers nor the index changed.

3. **REFACTOR:** Extract one `listedBuffers(s)` helper if the filter repeats in more than two `core/state` modules.

   **Preview:**

   ```text
   // Allowed: one shared helper in core/state. Prohibited: persisting embeds or adding top-level AppState keys.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): load note embeds as unlisted buffers

   Task: P1-G2-T2 — Embed targets as unlisted buffers
   ```

   - Record the commit SHA.

**Verification:**

- `V11`, `V12`, `V49`: `bun test src/core/state/embeds.test.ts` → all cases pass.
- `bun test src/core/state` → the existing session, picker, and buffer tests still pass.

##### P1-G2-T3 — Markdown commands and the read-only view

- **Outcome:**
  - `<leader>m` cycles `live → source → reading` with a message.
  - `<leader>x` toggles a task as one undo step.
  - `za` folds or expands the callout or embed at the cursor, keyed by block id.
  - `Enter` toggles a task, or else follows the link.
  - In `reading`, edits are refused with the hint while motions work.
  - Code files get none of these.
- **System Design:** `REQ1@R1, REQ5@R1, REQ6@R1 → DES5, DES8 → S6, S9 → V2, V13, V37`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7 `src/core/state/markdown-commands.ts`; §7 `keys.ts` (`READ_ONLY_HINT`, `runVim`); §7 `{…,link-commands,…}.ts` (`linkBindings`, `followLink`); §7 `buffers.ts` (`showBuffer` resets `folds`); §6 `WindowState.content.folds` — State
- **Files:**
  - `src/core/state/markdown-commands.ts` (`markdownCommands`, `markdownBindings`, `cycleView`, `toggleTask`, `toggleFold`, `noteEnter`);
  - `src/core/state/link-commands.ts` (`linkBindings`, `followLink`);
  - `src/core/state/keys.ts` (`READ_ONLY_HINT`, `runVim`);
  - `src/core/state/buffers.ts` (`showBuffer` folds reset);
  - `src/app/main.ts` and `test/support/state.ts` (registration);
  - `src/core/state/markdown-commands.test.ts`, `test/ui/live-preview.test.ts` (V37).
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V13`, `V2`, `V37`:**

   - `markdown-commands.test.ts`, V13 sequence:
     - `za` on a callout title puts its id in `folds`;
     - inserting a line above keeps it folded;
     - editing the callout title resets the fold;
     - deleting the callout removes the fold;
     - a note with `> [!tip]-` starts folded with no toggle, which is checked through `markdownViewContext` folds plus the callout renderer.
   - `markdown-commands.test.ts`, V2:
     - `<leader>m` three times goes live → source → reading → live, with the message `mode: <view>`;
     - on `sync.ts` it changes nothing;
     - `Enter` on `- [ ] x` gives `[x]`;
     - `Enter` on a link follows it;
     - one `u` after a toggle restores `[ ]`.
   - `test/ui/live-preview.test.ts`, V37: in reading view, `x`, `i`, `p`, and `dd` leave the text unchanged and show `reading mode — <leader>m to edit`, and `j` moves.

   **Preview:**

   ```ts
   test("a fold follows its callout when lines are inserted above", () => {});
   test("enter toggles a task and one undo restores it", () => {});
   test("reading view refuses edits with a hint and still moves", async () => { /* mountShell, open note, <leader>m twice */ });
   ```

   - Run `bun test src/core/state/markdown-commands.test.ts && bun test test/ui/live-preview.test.ts`. Both must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   // markdown-commands.ts — design §7, without the preview.start / preview.stop entries (added in P2-G1-T4)
   export const markdownCommands: readonly AppCommand[] = [ /* view.cycle, task.toggle, fold.toggle, note.enter */ ];
   export const markdownBindings: readonly Binding[] = [ /* <leader>m, <leader>x, za, <CR> → note.enter */ ];
   // link-commands.ts: remove { seq: "<CR>", id: "link.follow" }; export followLink
   // keys.ts runVim — design §7: readOnly view && (text changed || insert) → none(setMessage(s, READ_ONLY_HINT))
   // buffers.ts showBuffer: drop window content.folds when the buffer changes
   // main.ts registries() and test/support/state.ts: register markdownCommands; bindings += markdownBindings
   ```

   - `toggleTask` uses `applyBufferEdits`, so it is one undo step and schedules autosave.
   - A non-task line shows `no checkbox on this line`, and a non-foldable block shows `nothing to fold here`.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: Markdown checks in keys.ts beyond ViewSpec.readOnly.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(markdown): add view, task, fold, and enter commands with read-only view

   Task: P1-G2-T3 — Markdown commands and the read-only view
   ```

   - Record the commit SHA.

**Verification:**

- `V13`, `V2`: `bun test src/core/state/markdown-commands.test.ts` → pass.
- `V37`: `bun test test/ui/live-preview.test.ts` → the reading-refusal case passes.
- The obsolete `<CR>` binding is gone: `rg -n '"<CR>", id: "link.follow"' src` returns nothing.

##### P1-G2-T4 — Sign column, widget painters, and cursor fit

- **Outcome:**
  - `EditorView` lays out once per frame, advances the top line until the cursor row fits, and paints a one-cell sign column (`▕`, `⚠`).
  - It hands widget rows to painters registered by type. `rule`, `embed`, and `text` are registered; unknown types paint a dim `[<type>]`.
  - The Markdown, sign, and placeholder theme tokens exist with NO_COLOR fallbacks.
- **System Design:** `REQ5@R1, REQ1@R1, REQ4@R1 → DES6, DES4, DES2 → S7, S5, S9, S16, S18 → V16, V25`
- **UI Design:** `Not applicable — parent UV3@R2 frame states (V16) and the sync.ts state (V25).`
- **Canonical Shapes:** System design §6 `WidgetPainter` — Contract (G4); §7 `src/ui/widgets/registry.ts`, `embed.ts`, `rule.ts`; §7 `src/ui/editors/text-view.ts` (`fitCursor`, `renderSelf`, `gutterWidth`); §7 `src/ui/{shell,theme}.ts` (theme tokens)
- **Files:**
  - `src/ui/widgets/registry.ts` (`PaintTarget`, `WidgetPainter`, `widgetPainters`, `registerWidgetPainter`);
  - `src/ui/widgets/embed.ts` (`paintEmbed`);
  - `src/ui/widgets/rule.ts` (`paintRule`);
  - `src/ui/editors/text-view.ts` (`show`, `fitCursor`, `renderSelf`, `gutterWidth`, `paintSign`);
  - `src/ui/theme.ts` (`TOKENS`);
  - `src/app/main.ts` and `test/support/ui.ts` (painter registration);
  - `test/ui/live-preview.test.ts` (V16, V25).
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V16`, `V25`:** `test/ui/live-preview.test.ts`.

   - V16, a `tour.md` frame:
     - `▕` appears in the sign cell only on revealed rows;
     - a `─` rule runs across the width;
     - embed rows show `… N more lines`;
     - a folded callout takes one row with `▸`.
   - V25, `sync.ts` open:
     - every text row equals its raw line;
     - the sign column is empty;
     - `<leader>m` and `gd` change nothing, and `Enter` moves down.

   **Preview:**

   ```ts
   test("a note frame paints signs, rules, embed rows, and folded callouts", async () => {
     const m = await mountShell({ cols: 100, rows: 40 }); openNote(m, "tour.md", TOUR_MD); openNote(m, "so-roadmap.md", ROADMAP_MD);
     // frame text assertions per V16
   });
   test("code files paint raw lines and ignore note keys", async () => { /* V25 */ });
   ```

   - Run `bun test test/ui/live-preview.test.ts`. It must fail because nothing paints widgets or signs.

2. **GREEN:**

   **Preview:**

   ```ts
   // widgets/registry.ts — design §7 shapes; module-level map like editorViews
   // text-view.ts
   private fitCursor(s: AppState, b: BufferState, line: number, rows: number, width: number): RenderLine[] {
     for (let tries = 0; ; tries++) {
       const lines = this.layoutFrame(s, b, this.topLine, rows, width);
       if (rowOfLine(lines, line, width) < rows || this.topLine >= line || tries > rows) return lines;
       this.topLine++;
     }
   }
   // show(): lines = fitCursor(…) cached; renderSelf(): gutter + sign cell | widgetPainters.get(type) ?? paintMissing | paintLine
   // main.ts + test/support/ui.ts: registerWidgetPainter("embed", paintEmbed); ("text", paintEmbed); ("rule", paintRule)
   // theme.ts: + mdHeading1–4 … signReveal, signError, imagePlaceholder (design §7 theme tokens), each with a NO_COLOR attribute
   ```

   - `layoutText` is called only with `visible` inside the window.
   - Painters write only inside their target.
   - Re-run `bun run test:ci`. Review any snapshot that changed because of the new sign column, and update it only when the diff is the one-cell gutter or live-view painting.

3. **REFACTOR:** Remove the old height arithmetic from `show` that `fitCursor` replaces.

   **Preview:**

   ```text
   // Allowed: deleting dead height code. Prohibited: Markdown identifiers in text-view.ts or widgets/registry.ts.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(editor): paint signs and widget rows and keep the cursor in view

   Task: P1-G2-T4 — Sign column, widget painters, and cursor fit
   ```

   - Record the commit SHA.

**Verification:**

- `V16`, `V25`: `bun test test/ui/live-preview.test.ts` → pass.
- `rg -n "markdown|Markdown|livePreview" src/ui/editors/text-view.ts src/ui/widgets/registry.ts` → no matches.

##### P1-G2-T5 — No-colour, light theme, and 80×24 live-view states

- **Outcome:** The DI3 terminal states of parent RM261003ABZP-UV10@R1 pass. These are an unresolved link and the reveal and error signs in `live`.
  - Under `NO_COLOR` they emit no colour SGR and differ from their neighbours by an attribute or a glyph.
  - The light-theme golden matches.
  - At 80×24, no title row, statusline, or prompt is clipped.
- **System Design:** `REQ1@R1 → DES6, DES2 → S7 (theme invariant "tokens keep NO_COLOR fallbacks")`
- **UI Design:** `Not applicable — traces parent RM261003ABZP-UV10@R1 (DI3 states) directly, as plan context §7 requires.`
- **Canonical Shapes:** System design §7 `src/ui/{shell,theme}.ts` (theme invariant); parent `rm261003abzp-ui-design.md:2252-2262` (UV10@R1)
- **Files:** `test/ui/theme.golden.test.ts`, `test/ui/__snapshots__/theme.golden.test.ts.snap`, and `src/ui/theme.ts` only if a token lacks a fallback
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — parent UV10@R1 (DI3 states):** In `test/ui/theme.golden.test.ts`, mount with `color: "nocolor"` at 80×24 and open a note that has an unresolved link, a revealed line, and a block whose renderer throws (register a throwing renderer). Assert:
   - no `38;2`, `48;2`, `38;5`, or `48;5` SGR appears;
   - the unresolved-link span differs from a resolved link by underline, dim, or a glyph;
   - the `▕` and `⚠` signs are present;
   - the title row and statusline are not clipped.

   Add a light-theme golden of the same frame.

   **Preview:**

   ```ts
   test("live view states stay distinguishable without colour at 80 by 24", async () => {
     const m = await mountShell({ cols: 80, rows: 24, color: "nocolor" });
     // open note; expect(sgr(m)).not.toMatch(/[34]8;[25];/); attribute map differs for unresolved vs resolved link
   });
   test("live view light theme", async () => { /* theme: "light" → toMatchSnapshot() */ });
   ```

   - Run `bun test test/ui/theme.golden.test.ts`. Confirm it fails for the intended reason: no snapshot yet, or a token without a fallback.

2. **GREEN:** `src/ui/theme.ts`. Add any missing NO_COLOR attribute fallback, then write the snapshot after reviewing it.

   **Preview:**

   ```ts
   // TOKENS.linkUnresolved: { fg: …, nocolor: { underline: true, dim: true } } — pattern of the existing table
   ```

   - Change token values only where a fallback is missing.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: changing existing DI2 picker cases in this suite.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(theme): cover live view states without colour and in light theme

   Task: P1-G2-T5 — No-colour, light theme, and 80×24 live-view states
   ```

   - Record the commit SHA.

**Verification:**

- Parent UV10@R1 (DI3 states): `bun test test/ui/theme.golden.test.ts` → pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Passes |
| Component suites | `bun run test:ci` | Pass; every snapshot update was reviewed as live rendering or the sign column |
| No Markdown in the generic editor | `rg -n "markdown\|Markdown" src/ui/editors src/core/kernel` | No new matches compared with the group base |
| Picker preview unchanged | `git diff <group-base>..HEAD -- src/ui/editors/text-view.ts` around `paintPreview` | No change to `paintPreview` |

#### Review and Verification Focus

- **Specification:**
  - The DES1 default view and restore.
  - The DES4 invariants: at most one outstanding read per path, unlisted buffers never shown or persisted, request state per note.
  - DES5 fold identity.
  - DES8 key semantics and the `<CR>` move.
  - DES6 cursor fit and painters.
  - UV3 and UV10 states.
- **Technical:**
  - Reducer identity is kept when nothing changed.
  - A throwing step keeps state.
  - Snapshot updates are justified.
  - The `fitCursor` loop is bounded.
  - No layout outside the viewport.
  - The interim `ViewHost` image answers are replaced in P1-G3-T4.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P1-G3 — Terminal images

#### Goal

- Images draw through OpenTUI as kitty, sixel, blocks, or a placeholder, chosen by one pure tier function.
- Decoded images live only in a 64 MiB UI-side LRU that repaints on load and retries failures after 60 s.
- Workspace images are read with containment.
- Web images download with a 10 s timeout and a 16 MiB cap, at most 4 at once, with no Cookie or Referer.
- `images = "off"` loads nothing.
- The cursor stays visible past tall images.

#### Coverage Summary

- **System Design:** `REQ2@R2, REQ5@R1 → DES7, DES6 → S7, S8 → V15, V18, V19, V40, V43, V50, V51`
- **UI Design:** `Not applicable — image placeholders and rows follow the parent UDES through design DES7.`

#### Scope

- Included:
  - the V43 graphics spike;
  - `src/workspace/images.ts`;
  - `src/ui/images.ts` (`ImageTier`, `imageTier`, `ImageCache`);
  - `src/ui/widgets/image.ts`;
  - `ShellDeps.loadImage` and `capabilities`, and `ViewDeps.images`;
  - the `EditorView` host `imageSize` and `cellAspect` from `deps.images`;
  - the `loadImage` injection and `image` painter registration in `main.ts`, and the `mountShell` `capabilities` and `files` options;
  - the image fixtures.
- Excluded:
  - browser images (P2);
  - any change to the image renderer in core (done in P1-G1-T5) other than fixes that verification finds.
- Main files:
  - `src/workspace/images.ts`, `src/workspace/images.test.ts`;
  - `src/ui/images.ts`, `src/ui/images.test.ts`;
  - `src/ui/widgets/image.ts`, `src/ui/shell.ts`, `src/ui/editors/text-view.ts`;
  - `src/app/main.ts`, `test/support/ui.ts`;
  - `test/fixtures/images/{diagram.png,broken.png,logo.svg}`;
  - `test/ui/live-preview.test.ts`.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ2 → DES7 → S8 → V43` | None | The kitty and sixel clearing behaviour on scroll, view switch, and buffer switch is confirmed and recorded |
| `REQ2 → DES7 → S8 → V50` | None | Bounded downloads with no leaked headers and at most 4 in flight; workspace paths read without a request |
| `REQ2 → DES7 → S8 → V19, V40, V51` | None | One load per reference, a 64 MiB bound, failures without throwing, and a 60 s retry |
| `REQ2 → DES7 → S8 → V18` | None | Tier per capability, block characters, and the placeholder when off, with no stale placement |
| `REQ5 → DES6 → S7 → V15` | None | The hardware cursor stays on screen past a 20-row image |

#### Cross-Work Gates

None. G2 was confirmed in P1-G1, and G4 needs no image output.

#### Tasks

##### P1-G3-T1 — Terminal graphics spike

- **Outcome:** A recorded result of how OpenTUI's `drawImage` placements behave when an image scrolls half off screen, when the view switches, and when the buffer switches. It covers kitty, Ghostty, WezTerm, and iTerm2 (kitty or sixel), and Terminal.app (blocks). The result names the clearing behaviour that V18 will assert.
- **System Design:** `REQ2@R2 → DES7 → S8 → V43`
- **UI Design:** `None`
- **Canonical Shapes:** System design §8 V43; §7 `src/ui/images.ts` and `src/ui/widgets/image.ts`; discussion context §6 (OpenTUI 0.5.14 image API)
- **Files:** a scratch spike script in the session scratchpad (not committed), and this plan part's P1-G3 group report
- **Execution Approach:** `Direct verification — a manual, cross-terminal investigation with no production code. TDD does not apply.`

**Steps:**

1. Scratch script: a minimal OpenTUI renderer that draws `test/fixtures/images/diagram.png` with `drawImage` on each protocol, scrolls it half off screen, then replaces the frame, which simulates a view switch and a buffer switch.

   **Preview:**

   ```ts
   // scratch/spike-images.ts (not committed)
   // const img = NativeImage.decode(await Bun.file("test/fixtures/images/diagram.png").bytes());
   // buf.drawImage(img, 0, y, 40, 12, w, h, 0, 0, w, h, protocol)  // y from 0 to -6; then clear frame
   ```

   - Run it in each listed terminal. Use Ghostty for live runs, not Terminal.app, except for the blocks tier.

2. **VERIFY — `V43`:**

   **Preview:**

   ```text
   per terminal × {scroll half off, switch view, switch buffer}
   └── Expect: record "cleared" / "stale placement" and the OpenTUI call that clears it (if any)
   ```

   - Record the table in the P1-G3 group report under "Graphics spike outcome". If a stale placement appears, record the clearing call that `paintImage` must make. That call becomes a V18 assertion in P1-G3-T4.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - No repository change is expected. Record the spike outcome in the group report as no-change evidence instead of making an empty commit.

   **Commit message:**

   ```text
   None — spike outcome recorded in the P1-G3 group report

   Task: P1-G3-T1 — Terminal graphics spike
   ```

   - Record the evidence location.

**Verification:**

- `V43`: the manual spike table is recorded and names the clearing behaviour to assert in V18.

##### P1-G3-T2 — Workspace image loader with bounded web downloads

- **Outcome:**
  - `readImage` reads contained workspace image bytes and rejects anything outside the workspace realpath or over 32 MiB.
  - `fetchImage` downloads only `http(s)` images: 10 s, 16 MiB, no Cookie or Referer, non-2xx rejected.
  - `createImageLoader` sends web refs to `fetchImage` with at most 4 in flight, and other refs to `readImage`.
- **System Design:** `REQ2@R2 → DES7 → S8 → V50`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7 `src/workspace/images.ts` and `src/workspace/system.ts` (`readImage`, `WEB_IMAGE`, `fetchImage`, `createImageLoader`)
- **Files:** `src/workspace/images.ts`, `src/workspace/images.test.ts`, `test/fixtures/images/{diagram.png,broken.png,logo.svg}`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V50`:** `src/workspace/images.test.ts`, against a local `Bun.serve` on `127.0.0.1:0`:
   - a 1 KiB PNG returns its bytes;
   - a 17 MiB body, a 404, a handler that never responds (`timeoutMs` 200), and `ftp://x/a.png` each reject;
   - the server sees no `Cookie` or `Referer` header;
   - 6 concurrent slow images through `createImageLoader` keep at most 4 requests in flight;
   - a workspace path is read from disk with no request.

   **Preview:**

   ```ts
   test("web image downloads are capped, time out, and send no cookie or referrer", async () => {});
   test("at most four web images download at once", async () => { /* track max concurrent in handler */ });
   ```

   - Run `bun test src/workspace/images.test.ts`. It must fail.

2. **GREEN:** `src/workspace/images.ts`.

   **Preview:**

   ```ts
   export const WEB_IMAGE = { timeoutMs: 10_000, maxBytes: 16 * 2 ** 20, maxInFlight: 4 } as const;
   // fetchImage — design §7 (credentials "omit", referrerPolicy "no-referrer", AbortSignal.timeout, readCapped stream)
   // readImage(root, rel) — realpath containment like the preview server; reject > 32 MiB
   // createImageLoader(root, o) — isWebUrl(ref) ? queued fetchImage (≤ 4) : readImage(root, ref)
   ```

   - Import `isWebUrl` from `src/core/lang/markdown/renderers/image.ts`. This is allowed because `src/workspace` may import from `src/core`.
   - This is the only outbound network call in `so`.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: disk caching of downloaded bytes.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(workspace): read workspace images and download web images with limits

   Task: P1-G3-T2 — Workspace image loader with bounded web downloads
   ```

   - Record the commit SHA.

**Verification:**

- `V50`: `bun test src/workspace/images.test.ts` → all cases pass.

##### P1-G3-T3 — Image tiers and the decoded-image cache

- **Outcome:**
  - `imageTier` maps `off` to placeholder and `blocks` to blocks; `auto` resolves through OpenTUI.
  - `ImageCache` loads each reference once, keeps at most 64 MiB of decoded pixels with LRU disposal, repaints on each load, records failures without throwing, and reloads a failure on the first `get` 60 s or more later.
- **System Design:** `REQ2@R2 → DES7 → S8 → V19, V40, V51`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `ImageTier` — Contract; §7 `src/ui/images.ts` and `src/ui/widgets/image.ts` (`imageTier`, `ImageCache`)
- **Files:** `src/ui/images.ts` (`ImageTier`, `imageTier`, `ImageCache`), `src/ui/images.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V19`, `V40`, `V51`:** `src/ui/images.test.ts`, with a load stub and a repaint spy:
   - with three images of 30 MiB decoded size, the first is disposed after the third loads and the total stays at or below 64 MiB;
   - two `get` calls on the same path before the load resolves make one load call;
   - repaint is called once per load;
   - corrupt PNG bytes, SVG bytes, and a loader rejection each give `{ failed: true }` without throwing;
   - a loader rejection at t=0 still gives `{ failed: true }` at t=59 s with no new load call;
   - at t=60 s with the loader resolving PNG bytes, a second load call happens, then the decoded image and a repaint.

   **Preview:**

   ```ts
   test("decoded images stay within the memory limit", async () => {});
   test("a failed image loads again after a minute", async () => { /* now() stub 0 → 59_000 → 60_000 */ });
   ```

   - Run `bun test src/ui/images.test.ts`. It must fail.

2. **GREEN:** `src/ui/images.ts`.

   **Preview:**

   ```ts
   // design §7 shapes: imageTier(images, caps, hasResolution); ImageCache({ load, repaint, now, limitBytes = 64 MiB, retryMs = 60_000 })
   // get(path) → { image } | { failed: true } | undefined (starts load); size(path); cellAspect() (resolution or 0.5)
   // decode with imageInfo + NativeImage.decode; ImageError / rejection → { failed: true, at: now() }; evict LRU with dispose()
   ```

   - Bytes and decoded images never enter `AppState`.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: dispatching actions from the cache; repaint is renderer.requestRender only.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): add image tier policy and bounded decoded-image cache

   Task: P1-G3-T3 — Image tiers and the decoded-image cache
   ```

   - Record the commit SHA.

**Verification:**

- `V19`, `V40`, `V51`: `bun test src/ui/images.test.ts` → pass.

##### P1-G3-T4 — Image painter and shell wiring

- **Outcome:**
  - The shell builds one `ImageCache` from the injected `loadImage`. `EditorView` reports real image sizes and the cell aspect to the view context, so image widgets reserve their rows.
  - `paintImage` shows `◌ name` while loading, `[image: name]` on failure, and otherwise draws with the selected tier. It applies the clearing behaviour confirmed by the spike.
  - The cursor stays visible past tall images.
- **System Design:** `REQ2@R2, REQ5@R1 → DES7, DES6 → S7, S8 → V15, V18`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7 `src/ui/images.ts` and `src/ui/widgets/image.ts` (`paintImage`); §7 `src/ui/{shell,theme}.ts` (`ShellDeps`, `ViewDeps`); §7 `src/ui/editors/text-view.ts` (`layoutFrame` host); §7 `test/boundaries.test.ts`, `package.json`, `test/support/*` (`MountOptions.capabilities`, `files`); §5 Image load and repaint
- **Files:**
  - `src/ui/widgets/image.ts` (`paintImage`);
  - `src/ui/shell.ts` (`ShellDeps.loadImage`, `ShellDeps.capabilities`, `ViewDeps.images`, `createShell`);
  - `src/ui/editors/text-view.ts` (`layoutFrame` host);
  - `src/app/main.ts` (`createImageLoader(root)` injection, `registerWidgetPainter("image", paintImage)`);
  - `test/support/ui.ts` (`MountOptions.capabilities`, `MountOptions.files`, painter registration);
  - `test/ui/live-preview.test.ts` (V15, V18).
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V18`, `V15`:** `test/ui/live-preview.test.ts`.

   - V18: the note with `diagram.png`, mounted four ways.

     | Mount | Expected |
     |---|---|
     | `capabilities` kitty | `drawImage` called with `"kitty"` |
     | `capabilities` sixel with a resolution | `drawImage` called with `"sixel"` |
     | `capabilities` none | block characters in the image rows |
     | config `images = "off"` | `[image: diagram.png]` and no load call |

     Add the P1-G3-T1 clearing assertion after scrolling the image off screen, switching view, and switching buffer.
   - V15: a note with a 20-row image at the top, at 120×24. Pressing `j` down to line 30 keeps the hardware cursor on screen at the cursor line's row at every step.

   **Preview:**

   ```ts
   test("images draw with the terminal's best protocol and fall back to blocks or a placeholder", async () => {
     for (const caps of CAPS) { const m = await mountShell({ cols: 100, rows: 40, capabilities: caps, files: { "images/diagram.png": PNG } }); /* … */ }
   });
   test("the cursor stays on screen below a tall image", async () => {});
   ```

   - Run `bun test test/ui/live-preview.test.ts`. It must fail because there is no image painter and no sizes.

2. **GREEN:**

   **Preview:**

   ```ts
   // shell.ts — design §7: ShellDeps + loadImage, capabilities?; ViewDeps + images: ImageCache;
   //   createShell builds new ImageCache({ load: deps.loadImage, repaint: () => renderer.requestRender(), now: deps.now })
   // text-view.ts layoutFrame host: imageSize: (p) => this.deps.images.size(p), cellAspect: this.deps.images.cellAspect()
   // widgets/image.ts paintImage — design §7: tier → placeholder | cache.get → "◌ name" | failed → "[image: name]" | drawImage(…, tier)
   // main.ts: createShell(renderer, { reg, now, loadImage: createImageLoader(root) }); registerWidgetPainter("image", paintImage)
   // test/support/ui.ts: MountOptions.capabilities?, files?: Record<string, Uint8Array> → loadImage
   ```

   - Replace the interim P1-G2-T1 host values.
   - Only `src/ui` imports `@opentui/core`.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: image bytes or sizes in AppState.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): paint terminal images and reserve their rows

   Task: P1-G3-T4 — Image painter and shell wiring
   ```

   - Record the commit SHA.

**Verification:**

- `V18`, `V15`: `bun test test/ui/live-preview.test.ts` → pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Passes |
| Component suites | `bun run test:ci` | Pass |
| Spike recorded | P1-G3 group report | The V43 table exists and the V18 clearing assertion names it |
| Single network call | `rg -n "fetch\(" src --glob '!**/*.test.ts'` | Only `src/workspace/images.ts`, plus the browser `page.js` once P2 exists |

#### Review and Verification Focus

- **Specification:**
  - DES7 limits: 10 s, 16 MiB, 4 in flight, no Cookie or Referer, 64 MiB, 60 s, `off` loads nothing.
  - The tier policy.
  - Placeholder text.
  - The DES6 cursor fit with image rows.
- **Technical:**
  - No duplicate loads.
  - `dispose()` on eviction.
  - Containment in `readImage`.
  - No `@opentui` import outside `src/ui`.
  - No stale placements after scroll, view, or buffer change.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ3 → DES3 → S4 → V47 (boundary part)` | None | P1-G1 | P1-G1-T1, P1-G1-T4 |
| `REQ1, REQ4 → DES13 → S14 → V39` | None | P1-G1 | P1-G1-T2 |
| `REQ1, REQ5 → DES2 → S2, S3, S7, S18 → V1r, V5, V14` | None | P1-G1 | P1-G1-T3 |
| `REQ3 → DES3 → S4 → V6, V7, V8` | None | P1-G1 | P1-G1-T4 |
| `REQ4, REQ2 → DES4, DES5, DES7 → S5 → V9, V10` | None | P1-G1 | P1-G1-T5 |
| `REQ1 → DES2 → S2 → V4` | parent UV3@R2 | P1-G1 | P1-G1-T6 |
| `REQ6, REQ2 → DES1, DES7 → S8, S16 → V17` | None | P1-G1 | P1-G1-T7 |
| `REQ6 → DES1, DES13 → S1 → V1` | None | P1-G2 | P1-G2-T1 |
| `REQ4 → DES4 → S5 → V11, V12, V49` | None | P1-G2 | P1-G2-T2 |
| `REQ5, REQ6, REQ1 → DES5, DES8 → S6, S9 → V2, V13, V37` | None | P1-G2 | P1-G2-T3 |
| `REQ5, REQ1, REQ4 → DES6, DES4 → S7, S5, S9, S16 → V16, V25` | parent UV3@R2 | P1-G2 | P1-G2-T4 |
| `REQ1 → DES6 → S7 (token fallbacks)` | parent RM261003ABZP-UV10@R1 (DI3 states) | P1-G2 | P1-G2-T5 |
| `REQ2 → DES7 → S8 → V43` | None | P1-G3 | P1-G3-T1 |
| `REQ2 → DES7 → S8 → V50` | None | P1-G3 | P1-G3-T2 |
| `REQ2 → DES7 → S8 → V19, V40, V51` | None | P1-G3 | P1-G3-T3 |
| `REQ2, REQ5 → DES7, DES6 → S7, S8 → V15, V18` | None | P1-G3 | P1-G3-T4 |
| G2 precondition | None | P1-G1 | P1-G1-T1 (step 0) |
| G4 producer outputs (block renderer registry, widget painter registry, widget rows, unlisted embed buffers) | None | P1-G1, P1-G2 | P1-G1-T3, P1-G2-T2, P1-G2-T4 |

### Outputs consumed by later parts

| Output | Producing task | Consumer |
|---|---|---|
| `renderKey`, `IMAGE_EXTENSIONS`, `isWebUrl`, `blockNode`-based renderers | P1-G1-T3, P1-G1-T5 | P2-G1-T1 `renderHtml` |
| `markdownCommands`, `markdownBindings` (without preview entries) | P1-G2-T3 | P2-G1-T4 adds `preview.start` and `preview.stop` |
| `Registries.viewContexts`, `testRegistries`, `mountShell` options (`capabilities`, `files`) | P1-G1-T7, P1-G3-T4 | P2-G1, P3-G1 extension tests and benches |
| `registerBlockRenderer`, `registerWidgetPainter`, `ViewContextRegistry` | P1-G1-T3, P1-G2-T4, P1-G1-T7 | P3-G1-T1 (V38, V41) |
| `test/fixtures/tour.md`, `test/fixtures/images/*` | P1-G1-T6, P1-G3-T2 | P2-G1-T1 (V20), P2-G1-T3 (V34) |
| `BufferState.listed`, `listed !== false` filters | P1-G1-T7, P1-G2-T2 | P2-G1-T3 `followTarget` (active listed Markdown buffer) |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary. G2 is confirmed before P1-G1-T1. The G4 outputs are handed off to P3-G1 for proof, and to DI4 after the DI3 PR merges.
- Every source obligation is covered.

## Planning Gaps

None.
