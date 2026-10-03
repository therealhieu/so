# W261003FX70 Plan Part 1 — Core Models and Config

## Status

`Ready`

## Objective

Deliver the pure foundations that the runtime builds on:

- the two-level Markdown model, with `parseDoc`, the block cache and `syntaxExtensions`, attached to buffers as analysis;
- the links core: summaries, the incremental NoteIndex, resolution, rename planning and mention edits;
- fzf v1 fuzzy ranking;
- the strict TOML config with line-numbered errors, a configurable leader, a keymap derived per config, `:ConfigReload` and `file.save`;
- the config-file and debug-log adapters;
- the `editor.*` display options: tab width, soft wrap and relative numbers.

Every package is exactly pinned and imported only from its home.

## Coverage Summary

- **System Design:** `REQ1, REQ2, REQ3, REQ6 (pure planning), REQ7@R2, REQ9 (ranking), REQ10 → DES2, DES3, DES7, DES11 (+ DES1 BufferState.analysis, configLoaded/loadConfig) → S1 (partial), S2, S3, S4, S6, S7, S9 (span edit), S13, S14, S17 (ranking), S19, S21 → V1–V20 (V20 except the ",ff → file.find" case), V22 (`:w` → file.save case), V31, V33, V35, V39, V55, V57, V58, V59 (except the picker-preview case)`
- **UI Design:** `None — no Work UI design; display options follow design DES11`

## Sources

- Plan index: `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-plan-index.md`
- Plan context: `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-plan-context.md`
- System design: `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-system-design.md`
- UI design: `Not applicable — no Work UI design; parent UI obligations are realized by DES9 in Part 2`
- System requirements: `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-requirements.md`
- UI requirements: `Not applicable — parent UREQs bound through W261003FX70-REQ1@R1`

## Dependencies

- Cross-work gate G1 (DI1 foundation), which is met: DI1 merged to `main` as `c98aa19` with CI green. This must be confirmed before P1-G1 starts (see Cross-Work Gates).
- No earlier part.

## Execution Flow

```text
P1-G1: Markdown model and links core → P1-G2: Configuration, keymap, and display options
```

## Groups

Every delegated agent (implementer, verifier, remediator) reads and follows `.s1mple/S1MPLE.md` and its required references: `docs/communication.md`, `docs/project.md` and `docs/languages/typescript.md`. Delegated agents do not use the native `Explore` subagent.

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command; do not request separate permission. Commit each task after its checks and self-review pass, and before starting the next task. Commit subjects follow the repository's Conventional Commits style (`feat(scope): …`). Each body carries the task ID and its exact plan title. Task commits are checkpoints, not group acceptance. Record no-change evidence instead of an empty commit.

Rules for planned code:

- Use no work-process identifiers (`REQ`, `DES`, `S`, `V`, `W…`, `RM…`, phase or task IDs) in code, comments, identifiers, test names or log messages. Test names describe behaviour.
- `src/core` stays pure, and `src/core/kernel` imports no packages.
- Add packages with `bun add <pkg>@<exact>`; `bunfig.toml` writes exact versions. Add each package in the task that first imports it, so knip never reports an unused dependency.
- Each group ends with `bun run check` passing in under 30 s.

### P1-G1 — Markdown model and links core

#### Goal

Markdown buffers carry an incrementally computed `Doc` (scan level plus lazy mdast). The pure links core resolves, indexes, plans renames and mention edits, and ranks fuzzy matches. Every behaviour is proven by unit and property tests in `bun run check`.

#### Coverage Summary

- **System Design:** `REQ1, REQ2, REQ3, REQ6, REQ9 → DES2, DES3 → S2, S3, S4, S6, S7, S9, S17, S19 → V1–V16, V35, V55`
- **UI Design:** `None`

#### Scope

- Included:
  - `PACKAGE_HOMES`;
  - pins for `yaml` and the five Markdown packages;
  - blocks, syntax, scan, doc, mdast and `markdownFileType.analyze`;
  - `BufferState.analysis` with `withAnalysis`, and the editor view reading analysis from state;
  - the Markdown conformance corpus;
  - `summarize`, `note-index`, `resolve`, `rename` and `mentions`;
  - `kernel/text/fuzzy.ts`.
- Excluded:
  - `link-at.ts` and `links/commands.ts` (P2-G2, because they need the reducers and the overlays);
  - the worker and index state (P2-G1);
  - display options (P1-G2);
  - the obsolete-reference check (P3-G1).
- Main files: `package.json`, `bun.lock`, `test/boundaries.test.ts`, `test/fixtures/boundary-violation/*`, `src/core/lang/markdown/{blocks,syntax,scan,doc,mdast,file-type}.ts`, `src/core/state/{types,buffers}.ts`, `src/ui/editors/text-view.ts` (analysis read only), `test/fixtures/markdown-corpus/*.md`, `src/core/features/links/{summarize,note-index,resolve,rename,mentions}.ts`, `src/core/kernel/text/fuzzy.ts`, and the colocated `*.test.ts` files

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ2 → DES2 → S19 → V35, V55` | None | Markdown packages exactly pinned and imported only from `src/core/lang/markdown/` |
| `REQ3 → DES2 → S2 → V1–V4` | None | Blocks kept whole; scan facts with exact ranges; exclusions; frontmatter |
| `REQ3 → DES2 → S3 → V5, V6, V6a` | None | `parseDoc(buf, prev)` equals `parseDoc(buf)`; only changed blocks re-scanned; stable ids |
| `REQ3 → DES2 → S4 → V7` | None | Scan and mdast agree over the corpus |
| `REQ1 → DES3 → S6 → V8–V10` | None | Documented resolution order; `linkText` round-trips; derived maps equal a rebuild |
| `REQ6 → DES3 → S7 → V11–V14` | None | Rename and move keep every resolved link with kind, alias and subpath preserved |
| `REQ6 → DES3 → S9 → V15` | None | Mention span edit in the basename-equality form |
| `REQ9 → DES3 → S17 → V16` | None | fzf constants, smart-case and tie-breaks |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G1 — plan context section 2; `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73` (DI1 → DI2: store, unions, registries, `layoutText`, shell, `atomicWrite`, watcher, runner, check, CI, bench harness) | Before P1-G1-T1 execution | `git merge-base --is-ancestor c98aa19 HEAD` succeeds, and DI1 PR #1 CI is green (already recorded as met) | RM261003ABZP-DI2@R2 / W261003FX70 |

#### Tasks

##### P1-G1-T1 — Package import homes

- **Outcome:** The boundary test enforces per-package import homes before any package is added.
- **System Design:** `REQ2 → DES2, DES7 → S19 → V35`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `test/boundaries.test.ts …` (`PACKAGE_HOMES`, `checkImports`)
- **Files:** `test/boundaries.test.ts:PACKAGE_HOMES, checkImports`, `test/fixtures/boundary-violation/state-imports-yaml.ts`
- **Execution Approach:** `TDD`

**Steps:**

0. **Gate G1:** run `git merge-base --is-ancestor c98aa19 HEAD && echo ok`, which must print `ok`. Stop if it fails.

1. **RED — `V35`:** `test/boundaries.test.ts`. The existing "violation fixtures are reported" case gains the new fixture, which imports `yaml` from a file declared under `src/core/state/`. The fixture must report exactly one violation, the existing fixtures still report one each, and `src` reports none.

   **Preview:**

   ```ts
   // test/fixtures/boundary-violation/state-imports-yaml.ts
   // Scanned as if located at src/core/state/; yaml's home is src/core/lang/markdown/.
   import { parse } from "yaml";
   export const value = parse("a: 1");

   // test/boundaries.test.ts — fixture table entry
   // { file: "state-imports-yaml.ts", as: "src/core/state/x.ts", expect: 1 }
   ```

   - Run `bun test test/boundaries.test.ts`. It must fail because nothing reports a package used outside its home.

2. **GREEN:** `test/boundaries.test.ts`, `PACKAGE_HOMES`, `checkImports`

   **Preview:**

   ```ts
   const PACKAGE_HOMES: Record<string, string[]> = {
     "mdast-util-from-markdown": ["src/core/lang/markdown/"],
     "micromark-extension-gfm": ["src/core/lang/markdown/"],
     "mdast-util-gfm": ["src/core/lang/markdown/"],
     "micromark-extension-math": ["src/core/lang/markdown/"],
     "mdast-util-math": ["src/core/lang/markdown/"],
     yaml: ["src/core/lang/markdown/"],
     "toml-eslint-parser": ["src/core/config/"],
   };
   // In checkImports: a bare specifier listed in PACKAGE_HOMES whose importer path
   // starts with none of its homes is a violation ("<pkg> is imported only from <homes>").
   ```

   - Keep `LAYER_RULES` and the type-import scan unchanged. Note that `src/core/lang/` and `src/core/config/` are "pure", which still allows these packages.

3. **REFACTOR:** if the fixture runner now repeats itself, fold the per-fixture expectations into one table.

   **Preview:**

   ```ts
   // Allowed: one table of fixtures and expected counts.
   // Not allowed: changing layer policies.
   ```

   - Keep every boundary case passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   test(boundaries): enforce package import homes

   Task: P1-G1-T1 — Package import homes
   ```

**Verification:**

- `V35`: `bun test test/boundaries.test.ts` → no violations in `src`; the new fixture reports exactly one; existing fixtures report one each.

##### P1-G1-T2 — Block splitting and syntax registry

- **Outcome:** `splitBlocks` splits a buffer into classified blocks in one linear pass, and `syntaxExtensions` defines each Obsidian syntax once for both levels.
- **System Design:** `REQ3 → DES2 → S2 → V1`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/core/lang/markdown/blocks.ts` and `syntax.ts`; section 6, `SyntaxExtension`
- **Files:** `src/core/lang/markdown/blocks.ts:BlockKind, BlockSpan, splitBlocks`, `src/core/lang/markdown/syntax.ts:SyntaxExtension, syntaxExtensions`, `src/core/lang/markdown/blocks.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V1`:** `src/core/lang/markdown/blocks.test.ts`. Cover frontmatter, closed and unclosed ``` and `~~~` fences, `$$` math, a `%%` comment, a nested list and indented code. Spans cover every line exactly once; each construct is one span of its kind; an unclosed fence ends at EOF.

   **Preview:**

   ```ts
   test("structural blocks stay whole", () => {
     const spans = splitBlocks(lines(FIXTURE));
     // expect contiguous coverage of 0..lineCount-1 with no overlap
     // expect one "fence" span per fence, one "math", one "comment", one "list", one "frontmatter"
   });
   test("an unclosed fence runs to the end", () => { /* last span kind "fence", endLine = lineCount-1 */ });
   ```

   - Run `bun test src/core/lang/markdown/blocks.test.ts`. It must fail because the module is missing.

2. **GREEN:** `blocks.ts` (`splitBlocks`) and `syntax.ts` (`syntaxExtensions`)

   **Preview:**

   ```ts
   export function splitBlocks(lines: { line(i: number): string; lineCount: number }): BlockSpan[] {
     // single pass; open-state machine for frontmatter (line 0 "---"), fence (``` / ~~~ matching close),
     // $$ math, %% comment, list continuation; blank lines bound paragraphs; see design section 7
   }
   export const syntaxExtensions: readonly SyntaxExtension[] = [/* wikilink, embed, tag, blockId, comment, highlight per design */];
   ```

   - Use only the minimal `TextBuffer`-compatible line interface, so the worker can pass an array view.

3. **REFACTOR:** name the fence and close predicates clearly. Do not add kinds beyond `BlockKind`.

   **Preview:**

   ```ts
   // Allowed: extract `isFenceOpen`/`closesFence` helpers. Not allowed: regex backtracking across lines.
   ```

   - Keep V1 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(markdown): split blocks and register Obsidian syntax

   Task: P1-G1-T2 — Block splitting and syntax registry
   ```

**Verification:**

- `V1`: `bun test src/core/lang/markdown/blocks.test.ts` → full coverage, constructs whole, unclosed fence to EOF.

##### P1-G1-T3 — Scan level with frontmatter

- **Outcome:** `scanBlock`, `scanFrontmatter` and `scanDoc` extract links, tags, headings and block ids with exact ranges, and record excluded ranges. Frontmatter tags, aliases and links come through `yaml`.
- **System Design:** `REQ2, REQ3 → DES2 → S2, S19 → V2, V3, V4, V55`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/core/lang/markdown/scan.ts`; section 6, `Doc` / `DocScan`
- **Files:** `package.json`, `bun.lock` (`yaml` 2.9.1), `src/core/lang/markdown/scan.ts:BlockScan, DocScan, LinkSpan, scanBlock, scanFrontmatter, scanDoc, mergeScans`, `src/core/lang/markdown/scan.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V2`, `V3`, `V4`:** `src/core/lang/markdown/scan.test.ts`

   **Preview:**

   ```ts
   test("every Obsidian link, tag, heading, and block id is found with exact ranges", () => {
     // note with [[note]], [[note|alias]], [[note#H]], [[note#H1#H2]], [[note#^id]], ![[embed]],
     // [x](a%20b.md), #tag, #tag/sub, ## heading, ^block-id
     // expect each range to slice to raw; md target decoded to "a b.md"
   });
   test("code, math, comments, and html hide syntax", () => { /* no links/tags; each in `excluded`; "#123", "a#tag" not tags */ });
   test("frontmatter tags, aliases, and links", () => { /* tags ["a","b/c"], aliases ["Plan"], related link inFrontmatter with exact range */ });
   ```

   - Run `bun test src/core/lang/markdown/scan.test.ts`. It must fail because the module is missing.

2. **GREEN:** `bun add yaml@2.9.1`, then `scan.ts`

   **Preview:**

   ```ts
   export function scanBlock(text: string, span: BlockSpan, offsetLine: number): BlockScan { /* linear; syntaxExtensions */ }
   export function scanFrontmatter(text: string, startLine: number): BlockScan { /* yaml values + source ranges */ }
   export function scanDoc(lines: { line(i: number): string; lineCount: number }): DocScan { /* splitBlocks → scan each → mergeScans */ }
   ```

   - The scan is linear in text length, and every `range` slices to `raw` exactly.

3. **REFACTOR:** share the range helpers between blocks and frontmatter. Do not import `yaml` anywhere else.

   **Preview:**

   ```ts
   // Allowed: a local `rangeOf(line, start, end)` helper. Not allowed: exporting yaml types.
   ```

   - Keep V2–V4 and V35 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(markdown): scan links, tags, headings, and frontmatter

   Task: P1-G1-T3 — Scan level with frontmatter
   ```

**Verification:**

- `V2`, `V3`, `V4`: `bun test src/core/lang/markdown/scan.test.ts` → expected facts and exclusions.
- `V55`: `bun test test/repo.test.ts` passes ("exact npm pins") and `bun install --frozen-lockfile` passes.

##### P1-G1-T4 — Incremental parseDoc and buffer analysis

- **Outcome:**
  - `parseDoc(buf, prev)` reuses unchanged blocks and assigns stable ids.
  - `markdownFileType.analyze = parseDoc`.
  - `update` keeps `BufferState.analysis` current through `withAnalysis`.
  - The editor view reads `b.analysis` instead of a UI-side cache.
- **System Design:** `REQ1, REQ3 → DES1, DES2 → S1 (BufferState.analysis), S3 → V5, V6, V6a`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `doc.ts`, `file-type.ts`, `src/core/state/buffers.ts` (`withAnalysis`), `src/core/state/types.ts` (`BufferState.analysis`), and `src/ui/editors/text-view.ts` (`analyses` removed, `EditorView.rows`)
- **Files:**
  - `src/core/lang/markdown/doc.ts:Block, Doc, parseDoc`
  - `src/core/lang/markdown/file-type.ts:markdownFileType`
  - `src/core/state/types.ts:BufferState`
  - `src/core/state/buffers.ts:withAnalysis, onFileLoaded`, and every text replacement site
  - `src/ui/editors/text-view.ts:EditorView.rows`
  - `src/core/lang/markdown/doc.test.ts`
  - `src/core/state/buffers.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V5`, `V6`, `V6a`:** `doc.test.ts` (seeded random edits over corpus-like notes; one paragraph edited in a 200-block note; an insert above block k; a forced FNV collision). Add a `buffers.test.ts` case: after an edit through `update`, `analysis.version === text.version`.

   **Preview:**

   ```ts
   test("incremental parse equals a fresh parse", () => {
     // seed printed on failure; after each random edit: expect(parseDoc(buf, prev)).toEqual(parseDoc(buf))
   });
   test("one edited paragraph re-scans one block", () => { /* 199 Block objects toBe previous */ });
   test("block ids survive edits elsewhere and colliding hashes get ordered ids", () => { /* … */ });
   ```

   - Run `bun test src/core/lang/markdown/doc.test.ts src/core/state/buffers.test.ts`. It must fail because `parseDoc` and `withAnalysis` are missing.

2. **GREEN:** `doc.ts`, `file-type.ts`, `types.ts`, `buffers.ts` and `text-view.ts`

   **Preview:**

   ```ts
   export function parseDoc(buf: TextBuffer, prev?: Doc): Doc { /* splitBlocks → reuse prev blocks by hash → scan new → ids by hash order */ }
   // file-type.ts
   export const markdownFileType: FileType<Doc> = { /* DI1 fields */, analyze: parseDoc };
   // types.ts BufferState: analysis?: unknown
   // buffers.ts
   export function withAnalysis(b: BufferState, ft: FileType | undefined): BufferState { /* re-analyze when text.version changed */ }
   // text-view.ts EditorView.rows: pass b.analysis to layoutText; remove the `analyses` WeakMap and ft.analyze call
   ```

   - Call `withAnalysis` at every site that replaces buffer text (load, edit, reload from disk), so `analysis.version === text.version` holds.

3. **REFACTOR:** make sure no `analyze` call or `analyses` map remains under `src/ui`.

   **Preview:**

   ```ts
   // Allowed: one helper for "replace text then withAnalysis". Not allowed: caching analysis outside state.
   ```

   - Keep the DI1 suites run by `check` passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(markdown): parse documents incrementally into buffer analysis

   Task: P1-G1-T4 — Incremental parseDoc and buffer analysis
   ```

**Verification:**

- `V5`, `V6`, `V6a`: `bun test src/core/lang/markdown/doc.test.ts` → equality, reuse and stable ids.
- `bun test src/core/state` → the analysis version tracks the text version, and DI1 state tests still pass.

##### P1-G1-T5 — Lazy mdast and conformance corpus

- **Outcome:** `blockNode` parses one block to mdast with GFM, math and the Obsidian transforms, cached by hash. The scan level and the mdast level agree on the corpus.
- **System Design:** `REQ2, REQ3 → DES2 → S4, S19 → V7, V55`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/core/lang/markdown/mdast.ts`
- **Files:** `package.json`, `bun.lock` (`mdast-util-from-markdown` 2.0.3, `micromark-extension-gfm` 3.0.0, `mdast-util-gfm` 3.1.0, `micromark-extension-math` 3.1.0, `mdast-util-math` 3.0.0), `src/core/lang/markdown/mdast.ts:MdNode, blockNode`, `src/core/lang/markdown/conformance.test.ts`, `test/fixtures/markdown-corpus/*.md`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V7`:** `conformance.test.ts` iterates over `test/fixtures/markdown-corpus/`. Link targets, tags, headings and block ids from the mdast nodes must equal the scan's. The allowed-differences list starts empty.

   **Preview:**

   ```ts
   test("scan and mdast agree on every corpus note", () => {
     for (const file of corpus()) {
       // collect facts from blockNode(...) for each block; expect equal to scanDoc facts
     }
   });
   ```

   - Add corpus notes that cover every syntax from the scan tests, plus GFM tables, task lists and math. Run the test. It must fail because `blockNode` is missing.

2. **GREEN:** `bun add` the five exact pins, then `mdast.ts`

   **Preview:**

   ```ts
   export function blockNode(doc: Doc, block: Block): MdNode { /* fromMarkdown(text, {extensions:[gfm(), math()], mdastExtensions:[gfmFromMarkdown(), mathFromMarkdown()]}) + syntaxExtensions transforms; bounded cache by block hash */ }
   ```

   - Keep the cache transparent: cached and uncached calls return structurally equal trees.

3. **REFACTOR:** keep the cache bound and the eviction simple.

   **Preview:**

   ```ts
   // Allowed: a small LRU by hash. Not allowed: parsing whole documents eagerly.
   ```

   - Keep V7 and V35 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(markdown): parse blocks lazily to mdast with conformance corpus

   Task: P1-G1-T5 — Lazy mdast and conformance corpus
   ```

**Verification:**

- `V7`: `bun test src/core/lang/markdown/conformance.test.ts` → facts are equal for every corpus file.
- `V55`: `bun test test/repo.test.ts` and `bun install --frozen-lockfile` both pass.

##### P1-G1-T6 — Note summaries and incremental index

- **Outcome:** `summarize` turns a `DocScan` into a `NoteSummary`. The immutable `NoteIndex` updates incrementally (`applySummaries`, `removePaths`, `movePaths`, `addFiles`) and answers `backlinksOf`, `tagCounts` and `notesWithTag`.
- **System Design:** `REQ1, REQ5 → DES3 → S6 → V10`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `summarize.ts` and `note-index.ts`; section 6, `NoteSummary` / `NoteIndex`
- **Files:** `src/core/features/links/summarize.ts`, `src/core/features/links/note-index.ts`, `src/core/features/links/note-index.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V10`:** `note-index.test.ts`

   **Preview:**

   ```ts
   test("incremental updates equal a full rebuild", () => {
     // seeded random apply/remove/move/add over generated summaries;
     // after every step expect derived maps toEqual rebuild(summaries, files)
   });
   ```

   - Run the test. It must fail because the modules are missing.

2. **GREEN:** `summarize.ts`, `note-index.ts`

   **Preview:**

   ```ts
   export function summarize(path: string, scan: DocScan, mtime: number): NoteSummary { /* pure */ }
   export function applySummaries(ix: NoteIndex, s: readonly NoteSummary[]): NoteIndex { /* replace and patch derived maps */ }
   // removePaths, movePaths, addFiles, backlinksOf, tagCounts, notesWithTag, emptyIndex — per design
   ```

   - Only `.md` paths have summaries.

3. **REFACTOR:** share the derived-map patch between apply and remove.

   **Preview:**

   ```ts
   // Allowed: one `unlinkSummary`/`linkSummary` pair. Not allowed: mutable shared state.
   ```

   - Keep V10 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(links): summarize notes into an incremental note index

   Task: P1-G1-T6 — Note summaries and incremental index
   ```

**Verification:**

- `V10`: `bun test src/core/features/links/note-index.test.ts` → equals a rebuild at every step.

##### P1-G1-T7 — Link resolution and shortest link text

- **Outcome:** `resolveLink` follows the documented order exactly, and `linkText` produces the shortest unique form, which round-trips.
- **System Design:** `REQ1 → DES3 → S6 → V8, V9`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/core/features/links/resolve.ts`
- **Files:** `src/core/features/links/resolve.ts:LinkTarget, resolveLink, linkText`, `src/core/features/links/resolve.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V8`, `V9`:** `resolve.test.ts`

   **Preview:**

   ```ts
   test("resolution follows the documented order", () => {
     // a/plan.md, b/plan.md, plan-x.md (alias plan), c/deep/plan.md; [[plan]] from a/x.md → a/plan.md;
     // from root.md → plan-x.md; [[b/plan]] → b/plan.md; [[plan.md]]; [[note#H1#H2]]; [text](a/plan%20x.md)
   });
   test("link text round-trips and is shortest", () => { /* every file from every note of a generated workspace */ });
   ```

   - Run the test. It must fail because the module is missing.

2. **GREEN:** `resolve.ts`

   **Preview:**

   ```ts
   export function resolveLink(ix: NoteIndex, from: string, target: LinkTarget): string | undefined { /* design order */ }
   export function linkText(ix: NoteIndex, from: string, to: string): string { /* shortest suffix that resolves to `to` */ }
   ```

   - Results are deterministic.

3. **REFACTOR:** name each resolution step once.

   **Preview:**

   ```ts
   // Allowed: small step helpers in file order. Not allowed: changing the documented order.
   ```

   - Keep V8 and V9 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(links): resolve links and compute shortest link text

   Task: P1-G1-T7 — Link resolution and shortest link text
   ```

**Verification:**

- `V8`, `V9`: `bun test src/core/features/links/resolve.test.ts` → documented order; round-trip holds.

##### P1-G1-T8 — Rename planning and mention edits

- **Outcome:**
  - `planRename(ix, moves, open)` returns span edits that keep every resolved link on its file, covering captured links, outgoing links and folder moves. Kind, alias and subpath are preserved.
  - `renameImpact` counts the affected links and files.
  - `linkMentionEdit` edits only the mention span.
- **System Design:** `REQ6 → DES3 → S7, S9 → V11, V12, V13, V14, V15`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `rename.ts` and `mentions.ts`; section 6, `FileEdit`
- **Files:** `src/core/features/links/rename.ts:PathMove, SpanEdit, FileEdit, planRename, renameImpact`, `src/core/features/links/mentions.ts:MentionHit, linkMentionEdit`, `rename.test.ts`, `mentions.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V11`–`V15`:**

   **Preview:**

   ```ts
   test("rename preserves kind, alias, subpath, and frontmatter links", () => { /* plan.md → projects/roadmap.md expected forms; expected === old raw; open scan wins */ });
   test("every resolved link keeps its file after random moves", () => { /* 200 seeded workspaces × file/folder moves */ });
   test("a moved note does not capture other notes' links", () => { /* root.md → [[a/plan]] */ });
   test("folder moves rewrite outgoing ambiguous links", () => { /* notes/ → archive/notes/; impact counts */ });
   test("linking a mention edits only its span", () => { /* "Plan" → [[plan|Plan]], "plan" → [[plan]] */ });
   ```

   - Run the tests. They must fail because the modules are missing.

2. **GREEN:** `rename.ts`, `mentions.ts`

   **Preview:**

   ```ts
   export function planRename(ix: NoteIndex, moves: readonly PathMove[], open: ReadonlyMap<string, DocScan>): FileEdit[] { /* design section 7 */ }
   export function renameImpact(edits: readonly FileEdit[]): { links: number; files: number } { /* … */ }
   export function linkMentionEdit(ix: NoteIndex, hit: MentionHit, target: string): FileEdit { /* … */ }
   ```

   - Only link spans change, and each `SpanEdit.expected` equals the old raw text.

3. **REFACTOR:** reuse `linkText` for every rewritten target.

   **Preview:**

   ```ts
   // Allowed: shared span-format helper. Not allowed: reading files (no I/O in core).
   ```

   - Keep V11–V15 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(links): plan link-safe renames and mention edits

   Task: P1-G1-T8 — Rename planning and mention edits
   ```

**Verification:**

- `V11`–`V14`: `bun test src/core/features/links/rename.test.ts` → expected forms; the property holds; no capture; folder moves are handled.
- `V15`: `bun test src/core/features/links/mentions.test.ts` → a single span edit in the correct alias form.

##### P1-G1-T9 — Fuzzy ranking

- **Outcome:** `fuzzyScore` and `rankBy` implement fzf v1 scoring with smart-case and the documented tie-breaks, in the package-free kernel.
- **System Design:** `REQ9 → DES3 → S17 → V16`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/core/kernel/text/fuzzy.ts`
- **Files:** `src/core/kernel/text/fuzzy.ts:FuzzyMatch, fuzzyScore, rankBy, SCORE`, `src/core/kernel/text/fuzzy.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V16`:**

   **Preview:**

   ```ts
   test("fzf ranking with smart-case and tie-breaks", () => {
     // "srd" → projects/so-roadmap.md before areas/side-projects.md; "back" → link.backlinks first;
     // "Plan" case-sensitive; equal scores → shorter, then alphabetical; SCORE equals fzf constants
   });
   ```

   - Run the test. It must fail because the module is missing.

2. **GREEN:** `fuzzy.ts`

   **Preview:**

   ```ts
   export const SCORE = { /* fzf v1 constants per design */ } as const;
   export function fuzzyScore(query: string, text: string): FuzzyMatch | undefined { /* … */ }
   export function rankBy<T>(items: readonly T[], query: string, key: (t: T) => string): (T & { matches: number[] })[] { /* … */ }
   ```

   - Import nothing from outside `src/core/kernel`.

3. **REFACTOR:** keep the scoring loop readable.

   **Preview:**

   ```ts
   // Allowed: named bonus helpers. Not allowed: changing constants or tie-break order.
   ```

   - Keep V16 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(kernel): rank fuzzy matches with fzf scoring

   Task: P1-G1-T9 — Fuzzy ranking
   ```

**Verification:**

- `V16`: `bun test src/core/kernel/text/fuzzy.test.ts` → expected order and constants.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Passes in < 30 s with zero knip findings |
| Unit suites | `bun test src/core/lang src/core/features src/core/kernel/text src/core/state` | V1–V16 pass; DI1 state tests unchanged |
| Boundaries and pins | `bun test test/boundaries.test.ts test/repo.test.ts`; `bun install --frozen-lockfile` | V35, V55 pass |
| DI1 regression smoke | `bun run test:ci` | Existing DI1 component, integration and e2e suites pass with analysis read from state |

#### Review and Verification Focus

- **Specification:**
  - S2–S4, S6, S7, S9, S17 and S19 hold.
  - Resolution order and format preservation match the parent unchanged.
  - Only the six packages added here are imported, each from its home.
  - No link commands or worker code leak into this group.
- **Technical:**
  - The scan is linear, and every range slices to `raw`.
  - Property tests use fixed seeds and print the seed on failure.
  - `withAnalysis` is applied at every text replacement.
  - No `analyze` call remains in `src/ui`.
  - `src/core/kernel` stays package-free.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P1-G2 — Configuration, keymap, and display options

#### Goal

`config.toml` loads from the XDG path with strict validation and `config.toml:<line>` errors. Defaults apply at startup on error, and `:ConfigReload` keeps the current config on error.

On top of the loaded config:

- the leader, overrides, `escTimeoutMs`, theme and the `editor.*` options all apply, including after a reload;
- `:w` runs `file.save`;
- `SO_LOG=debug` writes a log that contains no note text;
- tab width, soft wrap and relative or absolute numbers render correctly.

#### Coverage Summary

- **System Design:** `REQ1, REQ2, REQ7@R2, REQ10 → DES1 (configLoaded, loadConfig), DES7, DES11 → S13, S14, S19, S21 → V17–V20 (except ",ff"), V22 (`:w` case), V31, V33, V39, V55, V57, V58, V59 (except picker preview)`
- **UI Design:** `None`

#### Scope

- Included:
  - the schema and TOML parser (`toml-eslint-parser` pin);
  - the leader in `splitKeys` and `Keymap`;
  - `state/keymap.ts` and `keymapFor`, with `Registries` → `bindings`/`groups`;
  - the `Binding` export;
  - `state/config.ts`;
  - the `configLoaded` action and `loadConfig` effect;
  - `buffer.write` → `file.save`, `:ConfigReload` → `config.reload`, and `executeEx` running registered ids;
  - `config-file.ts` and `log.ts`;
  - per-key `escTimeoutMs`, and `themeOf` honouring `color = "never"`;
  - `VimEnv.tabWidth`, `Run.tab`, `shift`, `wrap.ts` and the `text-view.ts` display options;
  - config and logger wiring in `main.ts`.
- Excluded:
  - DI2 discovery and jump builtins and bindings (`file.find`, pickers, `help`, `jumps`, `<C-o>`);
  - `defaultGroups` content beyond existing groups;
  - `paintPreview` (P2-G2);
  - the debug-log content integration test with worker and rename (V41, in P2-G1).
- Main files:
  - `src/core/config/{schema,toml}.ts`
  - `src/core/kernel/vim/{keys,types,engine,motions,operators}.ts`
  - `src/core/kernel/commands/{keymap,defaults}.ts`
  - `src/core/kernel/view/wrap.ts`
  - `src/core/state/{types,update,keymap,config,keys,commands}.ts`
  - `src/workspace/{config-file,log}.ts`
  - `src/app/{main,effects}.ts`
  - `src/ui/{shell,input,theme}.ts`
  - `src/ui/editors/text-view.ts`
  - `test/support/{state,ui}.ts`
  - `test/vim/vim.test.ts`
  - `test/integration/config.test.ts`
  - `test/ui/editor-options.test.ts`
  - the colocated tests

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ2, REQ7 → DES7 → S13, S19 → V17, V18, V19, V55` | None | TOML errors with lines; strict keys; `toml-eslint-parser` pinned in its home |
| `REQ7 → DES7 → S13 → V20, V31` | None | Binding validation; startup defaults vs reload keep; leader; XDG path rules |
| `REQ7 → DES7 → S14 → V33` | None | Log only with `SO_LOG=debug` |
| `REQ7 → DES7 → S13, S21 → V39` | None | File plus reload applies bindings, `escTimeoutMs`, theme and wrap; invalid reload keeps the previous config |
| `REQ1 → DES7 → S15 → V22 (`:w`)` | None | `:w` runs `file.save` |
| `REQ10 → DES11 → S21 → V57, V58, V59` | None | Wrap starts, tab-width cursor and shifts, painted frames |

#### Cross-Work Gates

None. G1 was confirmed before P1-G1, and G2/G3 are handled in P3-G1.

#### Tasks

##### P1-G2-T1 — Strict schema and TOML parsing with lines

- **Outcome:** `parseConfig(text)` returns `{ ok: true, config, bindings }` or `{ ok: false, errors }`, with errors in source order and every line ≥ 1. The schema is strict and includes `leader`, `editor`, `keys` and `filetypes`.
- **System Design:** `REQ2, REQ7, REQ10 → DES7, DES11 → S13, S19, S21 → V17, V18, V19, V55`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/core/config/schema.ts` and `toml.ts`; section 6, `AppConfig` / `ConfigResult`
- **Files:** `package.json`, `bun.lock` (`toml-eslint-parser` 1.0.3), `src/core/config/schema.ts:ConfigSchema, AppConfig, defaults, KeyBindingsSchema`, `src/core/config/toml.ts:parseConfig, ConfigResult, ConfigError, BindingSource`, `src/core/config/toml.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V17`, `V18`, `V19`:**

   **Preview:**

   ```ts
   test("a syntax error names its line", () => { /* "e = = 5" on line 7 → errors[0].line 7 */ });
   test("unknown keys and bad values name their lines in order", () => { /* lines 3, 4, 6, leader line */ });
   test("a valid file parses with binding lines and an empty file gives defaults", () => {
     // editor { tabWidth: 8, wrap: true, relativeNumbers: true } for ""
   });
   ```

   - Run `bun test src/core/config/toml.test.ts`. It must fail because the module is missing.

2. **GREEN:** `bun add toml-eslint-parser@1.0.3`, then `schema.ts` and `toml.ts`

   **Preview:**

   ```ts
   export const ConfigSchema = z.strictObject({ /* DI1 options + leader (one key), editor { tabWidth 1–16, wrap, relativeNumbers }, keys, filetypes */ });
   export function parseConfig(text: string): ConfigResult {
     // parseTOML → syntax error line; getStaticTOMLValue → ConfigSchema.safeParse;
     // map each zod issue path to the AST node's loc.start.line; collect BindingSource lines
   }
   ```

   - `defaults` must parse `{}`.

3. **REFACTOR:** keep the issue-to-line mapping in one function.

   **Preview:**

   ```ts
   // Allowed: `lineOf(ast, path)`. Not allowed: Bun.TOML anywhere.
   ```

   - Keep V17–V19 and V35 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(config): parse config.toml strictly with line-numbered errors

   Task: P1-G2-T1 — Strict schema and TOML parsing with lines
   ```

**Verification:**

- `V17`–`V19`: `bun test src/core/config/toml.test.ts` → the expected errors and config.
- `V55`: `bun test test/repo.test.ts` and `bun install --frozen-lockfile` both pass.

##### P1-G2-T2 — Configurable leader and per-config keymap

- **Outcome:**
  - `splitKeys(seq, leader)` and `new Keymap({ leader })` support any one-key leader.
  - `Registries` carries `bindings` and `groups`.
  - `keymapFor(reg, config)` derives and memoizes the effective trie per config object, merging config overrides by scope.
  - Key lookup goes through `keymapFor`.
- **System Design:** `REQ7 → DES7 → S13 → V20 (leader and memo cases, using existing bindings)`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `kernel/commands/keymap.ts and kernel/vim/keys.ts`, `src/core/state/keymap.ts`, `src/core/state/update.ts` (`Registries`), and `kernel/commands/defaults.ts` (`Binding`); section 6, `Binding`
- **Files:**
  - `src/core/kernel/vim/keys.ts:NAMED, splitKeys`
  - `src/core/kernel/commands/keymap.ts:Keymap`
  - `src/core/kernel/commands/defaults.ts:Binding, defaultBindings, defaultGroups`
  - `src/core/state/keymap.ts:effectiveBindings, keymapFor`
  - `src/core/state/update.ts:Registries`
  - `src/core/state/keys.ts:handleKeyAction`
  - `src/app/main.ts:registries`
  - `test/support/state.ts:testRegistries`
  - `src/core/state/keymap.test.ts`
  - `src/core/kernel/commands/keymap.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V20` (keymap cases):**

   **Preview:**

   ```ts
   test("leader comma maps <leader> sequences", () => { /* config leader "," → keymapFor(...).lookup(",e") is the explorer toggle id */ });
   test("the keymap is memoized per config object", () => { /* same object → toBe; new object → rebuilt */ });
   test("config overrides replace defaults per scope and are marked", () => { /* overridden: true */ });
   test("no leader option keeps DI1 behaviour", () => { /* new Keymap() trie equal to DI1 for defaultBindings */ });
   ```

   - Run the tests. They must fail because `keymapFor` and the leader parameter are missing.

2. **GREEN:**

   **Preview:**

   ```ts
   export function splitKeys(seq: string, leader = " "): Key[] { /* "<leader>" → leader; NAMED no longer has "<leader>" */ }
   export class Keymap { constructor({ leader = " " }: { leader?: string } = {}) { /* bind passes leader */ } }
   export type Binding = { scope: KeyScope; seq: string; id: string; overridden?: true };
   export const defaultGroups: Readonly<Record<string, string>> = { /* existing groups only; DI2 groups are added with their commands */ };
   // state/keymap.ts
   const memo = new WeakMap<AppConfig, Keymap>();
   export function keymapFor(reg: Registries, config: AppConfig): Keymap { /* effectiveBindings → new Keymap({leader}) */ }
   // update.ts Registries: { fileTypes, editorKinds, commands, bindings, groups }
   ```

   - Update `testRegistries` and `main.registries` to return `bindings`/`groups`.
   - `handleKeyAction` looks up through `keymapFor(reg, s.config)`.

3. **REFACTOR:** remove every remaining reader of `reg.keymap`.

   **Preview:**

   ```ts
   // Allowed: delete the old Keymap construction in main/testRegistries. Not allowed: a second keymap source.
   ```

   - Keep all key routing tests passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(keys): derive the keymap per config with a configurable leader

   Task: P1-G2-T2 — Configurable leader and per-config keymap
   ```

**Verification:**

- `V20` (keymap cases): `bun test src/core/state/keymap.test.ts src/core/kernel/commands` → leader, memo and overrides behave as specified.
- `bun test src/core/state/keys.test.ts test/vim` → DI1 routing unchanged.

##### P1-G2-T3 — Config apply, reload, and file.save

- **Outcome:**
  - The `configLoaded` action applies a valid result or reports errors: at startup defaults apply, and on reload the current config is kept. One toast names the first error and adds `(+N more)`.
  - `validateBindings` checks command ids, file types and modes.
  - `:ConfigReload` emits `loadConfig`.
  - `:w`/`:write` run `file.save`.
  - A typed registered command id runs that command, with the file-type check.
- **System Design:** `REQ1, REQ7 → DES1, DES7 → S13, S15 → V20 (error and reload cases), V22 (`:w` case)`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `src/core/state/config.ts`, `src/core/state/commands.ts` (`EX_ALIASES`, `executeEx`, `builtins`), `src/core/state/types.ts` (`configLoaded`, `loadConfig`), and `src/core/state/update.ts`
- **Files:** `src/core/state/types.ts:Action, Effect`, `src/core/state/update.ts:createUpdate`, `src/core/state/config.ts:onConfigLoaded, validateBindings, reloadConfig`, `src/core/state/commands.ts:EX_ALIASES, executeEx, builtins`, `src/core/state/config.test.ts`, `src/core/state/keys.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V20`, `V22` (`:w`):**

   **Preview:**

   ```ts
   test("invalid bindings toast the first line and keep a valid config", () => {
     // unknown id line 4, unknown filetype line 6, unknown mode line 8 →
     // toast "config.toml:4: unknown command id … (+2 more)"; startup → defaults; reload → previous config
   });
   test(":w saves through file.save", () => { /* keys.test.ts:198 updated: command id "file.save" */ });
   test(":ConfigReload requests a reload", () => { /* effects contain { kind: "loadConfig" } */ });
   ```

   - Run the tests. They must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   // types.ts
   | { type: "configLoaded"; result: ConfigResult; reload: boolean }   // Action
   | { kind: "loadConfig" }                                           // Effect
   // update.ts
   case "configLoaded": return onConfigLoaded(s, a, reg);
   // commands.ts
   w: "file.save", write: "file.save", ConfigReload: "config.reload"
   // builtins: rename "buffer.write" → "file.save" (title "Save file"); add "config.reload" → effects [{ kind: "loadConfig" }]
   // executeEx: a word equal to a registered id runs it through the file-type check; otherwise E492
   ```

   - Keep `E492` for unknown words.
   - The runner's `loadConfig` case lands in P1-G2-T7. `run` in `src/app/effects.ts` has no `never` check, so this task compiles without it; T7 must add the case before the group ends.

3. **REFACTOR:** replace every remaining `"buffer.write"` reference in `src` and `test`.

   **Preview:**

   ```ts
   // Allowed: rename in tests and help text. Not allowed: keeping an alias for the old id.
   ```

   - Keep all state tests passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(config): apply and reload config; rename save command to file.save

   Task: P1-G2-T3 — Config apply, reload, and file.save
   ```

**Verification:**

- `V20`: `bun test src/core/state/config.test.ts` → the toast text, startup defaults and reload keep.
- `V22` (`:w`): `bun test src/core/state/keys.test.ts` → `file.save` runs.
- `rg -n '"buffer.write"' src test` → no matches.

##### P1-G2-T4 — Config file and debug log adapters

- **Outcome:**
  - `configPath(env, home)` follows the XDG rules: a relative or empty value is ignored.
  - `readConfigText`/`readConfigTextSync` return `undefined` for a missing file.
  - `createLogger(env, home)` writes JSON lines to `$XDG_STATE_HOME/so/so.log` only with `SO_LOG=debug`.
- **System Design:** `REQ7 → DES7 → S13, S14 → V31, V33`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/workspace/config-file.ts` and `src/workspace/log.ts`
- **Files:** `src/workspace/config-file.ts:configPath, readConfigText, readConfigTextSync`, `src/workspace/log.ts:Logger, createLogger`, `src/workspace/config-file.test.ts`, `src/workspace/log.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V31`, `V33`:**

   **Preview:**

   ```ts
   test("config path follows XDG and ignores relative values", () => {
     // unset, "", "relative/path" → ~/.config/so/config.toml; "/abs" → /abs/so/config.toml; missing file → undefined
   });
   test("the debug log exists only with SO_LOG=debug", () => { /* tmp XDG_STATE_HOME; unset → no file; debug → JSON lines */ });
   ```

   - Run the tests. They must fail because the modules are missing.

2. **GREEN:**

   **Preview:**

   ```ts
   export function configPath(env: NodeJS.ProcessEnv, home: string): string { /* … */ }
   export function readConfigTextSync(path: string): string | undefined { /* ENOENT → undefined */ }
   export async function readConfigText(path: string): Promise<string | undefined> { /* … */ }
   export type Logger = { debug(event: string, data?: object): void; info(...): void; error(...): void };
   export function createLogger(env: NodeJS.ProcessEnv, home: string): Logger { /* no-op unless SO_LOG=debug */ }
   ```

   - The state-directory rule matches the one `state-file.ts` will use (`$XDG_STATE_HOME` absolute, else `~/.local/state`).
   - Log events carry only paths, counts and reasons, never note text.

3. **REFACTOR:** share the XDG absolute-path check between the two adapters.

   **Preview:**

   ```ts
   // Allowed: one `xdgDir(env, name, fallback)` helper in src/workspace. Not allowed: logging buffer contents.
   ```

   - Keep V31 and V33 passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(workspace): add config file and debug log adapters

   Task: P1-G2-T4 — Config file and debug log adapters
   ```

**Verification:**

- `V31`, `V33`: `bun test src/workspace/config-file.test.ts src/workspace/log.test.ts` → paths and log presence as specified.

##### P1-G2-T5 — Tab width in the vim engine

- **Outcome:** `VimEnv.tabWidth` drives display columns (`cursorDisplayCol`, `colForDisplay`) and shifts (`Run.tab`). `envOf` reads `s.config.editor.tabWidth`, and `TABSTOP` is removed.
- **System Design:** `REQ10 → DES11 → S21 → V58`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `motions.ts, operators.ts, and VimEnv`
- **Files:** `src/core/kernel/vim/{types,engine,motions,operators}.ts`, `src/core/state/keys.ts:envOf`, `test/vim/vim.test.ts` (env passes `tabWidth: 8`), `src/core/kernel/vim/tab-width.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V58`:** `tab-width.test.ts`

   **Preview:**

   ```ts
   test("tab width 4 moves j by display column and shifts by 4", () => {
     // "\tx" cursor on x, j onto "abcdef" → on "e"; ">>" on "a" → "\ta"; "<<" on "\t\ta" → "\ta"
   });
   test("tab width 8 keeps the recorded behaviour", () => { /* last column of "abcdef"; "\ta"; "\ta" */ });
   ```

   - Run the test. It must fail because `VimEnv` has no `tabWidth`.

2. **GREEN:**

   **Preview:**

   ```ts
   export type VimEnv = { topLine: number; rows: number; tabWidth: number };
   // Run gains `tab`, set from env.tabWidth in handleKey
   export function cursorDisplayCol(line: string, col: number, tabWidth: number): number { /* … */ }
   export function colForDisplay(line: string, want: number, tabWidth: number): number { /* … */ }
   // shift: steps and tab stops of run.tab; envOf: tabWidth: s.config.editor.tabWidth
   ```

   - Update every caller listed in the design (`engine.ts:87`, `:646`, `motions.ts:256`, `operators.ts:127`, `text-view.ts:152-153`).

3. **REFACTOR:** delete `TABSTOP` and any leftover literal `8` used for tabs.

   **Preview:**

   ```ts
   // Allowed: removing the constant. Not allowed: changing recorded Neovim expectations.
   ```

   - Keep `test/vim` fully passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(vim): use the configured tab width for columns and shifts

   Task: P1-G2-T5 — Tab width in the vim engine
   ```

**Verification:**

- `V58`: `bun test src/core/kernel/vim/tab-width.test.ts` → the expected cursors and text.
- `bun test test/vim` → all recorded cases unchanged.

##### P1-G2-T6 — Soft wrap, gutter, and numbers in the editor view

- **Outcome:**
  - `wrap.ts` computes row starts at whitespace and maps columns to rows.
  - The editor view paints wrapped rows, with the number on the first row only and a dynamic gutter width.
  - Relative or absolute numbers follow `relativeNumbers`.
  - With wrap off, the view scrolls horizontally and shows `›`.
  - Tabs use the configured width.
  - With default options and short lines, frames equal DI1's.
- **System Design:** `REQ10 → DES11 → S21 → V57, V59 (except the picker-preview case)`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7, `src/core/kernel/view/wrap.ts` and `src/ui/editors/text-view.ts` (`paintLine`, `EditorView.show`, `EditorView.renderSelf`, `gutterWidth`); section 5, "Editor paint with display options"
- **Files:** `src/core/kernel/view/wrap.ts:cellWidth, displayWidth, wrapLine, rowOf`, `src/core/kernel/view/wrap.test.ts`, `src/ui/editors/text-view.ts:paintLine, EditorView`, `test/ui/editor-options.test.ts`, `test/support/ui.ts` (config injection via `configLoaded`)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V57`, `V59`:**

   **Preview:**

   ```ts
   // wrap.test.ts
   test("rows break after whitespace and rejoin to the line", () => { /* 30 chars → [0]; 300-char paragraph rows ≤ 80 ending after a space; 200-char word at 80,160; tab not straddling; rowOf */ });
   // test/ui/editor-options.test.ts at 80×24
   test("a long paragraph wraps with a blank continuation gutter", () => { /* 4+ rows; $ cursor on last row; j lands on "next" */ });
   test("wrap off scrolls with an overflow marker", () => { /* one row, › in last column, scrolled to cursor */ });
   test("absolute numbers and a wide gutter", () => { /* relativeNumbers=false; 12,000-line buffer G → "12000" unclipped */ });
   test("tab width 4 paints at column 4", () => { /* "\tx" → x at text column 4 */ });
   // The picker-preview case is added in P2-G2 with paintPreview.
   ```

   - Run the tests. They must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   export function wrapLine(line: string, width: number, tabWidth: number): number[] { /* display-column starts */ }
   export function rowOf(starts: readonly number[], displayCol: number): number { /* … */ }
   // text-view.ts: paintLine options { leftCol, endCol?, tabWidth, cursorline };
   // gutterWidth(lineCount) = max(4, digits(lineCount)) + 1; remove TABSTOP and GUTTER
   ```

   - Read options from `s.config.editor`, so a reload repaints on the next frame.

3. **REFACTOR:** keep row computation in `wrap.ts` only.

   **Preview:**

   ```ts
   // Allowed: small paint helpers. Not allowed: duplicating wrap arithmetic in the UI.
   ```

   - Keep `test/ui/shell.golden.test.ts` and the other DI1 UI suites passing unchanged.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(editor): soft wrap, dynamic gutter, and configurable numbers

   Task: P1-G2-T6 — Soft wrap, gutter, and numbers in the editor view
   ```

**Verification:**

- `V57`: `bun test src/core/kernel/view/wrap.test.ts` → row-start invariants hold.
- `V59` (except preview): `bun test test/ui/editor-options.test.ts` → the expected frames.
- `bun test test/ui` → DI1 goldens unchanged.

##### P1-G2-T7 — Config wiring and live reload

- **Outcome:**
  - `main` reads `config.toml` synchronously and dispatches `configLoaded` before the first frame.
  - The runner's `loadConfig` case re-reads the file and dispatches `configLoaded { reload: true }`.
  - The logger is created in `main` and passed to the runner.
  - The key normalizer reads `escTimeoutMs` per Esc.
  - `themeOf` forces `nocolor` when `color = "never"`.
  - Reload applies bindings, `escTimeoutMs`, theme and wrap.
- **System Design:** `REQ7, REQ10 → DES7, DES11 → S13, S21 → V39`
- **UI Design:** `None`
- **Canonical Shapes:** System design section 7: `src/app/effects.ts` (`RunnerDeps.logger`, `configPath`, `run`), `src/app/main.ts`, the `src/ui/…` row for `createShell`, `createKeyNormalizer` and `themeOf`; section 5, "Config load and reload" and "Construction and Wiring Flow"
- **Files:** `src/app/effects.ts:RunnerDeps, run`, `src/app/main.ts:main`, `src/ui/shell.ts:createShell`, `src/ui/input.ts:createKeyNormalizer`, `src/ui/theme.ts:themeOf`, `test/integration/config.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V39`:** `test/integration/config.test.ts`, with tmp XDG directories and real `configPath`, `readConfigText`, `parseConfig`, store, runner and shell normalizer.

   **Preview:**

   ```ts
   test("leader binding from config saves the file", () => { /* parent scenario (b): <leader>w → file.save */ });
   test("an invalid startup config applies defaults with its line", () => { /* toast names config.toml:7 */ });
   test("per-scope overrides apply", () => { /* parent scenario (f) */ });
   test("reload applies bindings, escape timeout, theme, and wrap", () => { /* next frame: long line on one row with › */ });
   test("an invalid reload keeps the previous config", () => { /* previous binding still works; error toast */ });
   ```

   - Run `bun test test/integration/config.test.ts`. It must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   // effects.ts
   case "loadConfig": { const text = await readConfigText(deps.configPath); dispatch({ type: "configLoaded", result: parseConfig(text ?? ""), reload: true }); return; }
   // main.ts (before shell.attach)
   const logger = createLogger(process.env, homedir());
   store.dispatch({ type: "configLoaded", result: parseConfig(readConfigTextSync(cfgPath) ?? ""), reload: false });
   // shell.ts
   createKeyNormalizer({ escTimeoutMs: () => store.get().config.escTimeoutMs, … });
   // theme.ts
   color: s.config.color === "never" ? "nocolor" : s.terminal.color
   ```

   - The runner logs effect failures through `deps.logger`.
   - `createKeyNormalizer` accepts `number | (() => number)`, and the existing `test/ui/esc.test.ts` keeps passing.

3. **REFACTOR:** keep the `main` construction order as in design section 5.

   **Preview:**

   ```ts
   // Allowed: extract a `loadStartupConfig()` local. Not allowed: any workspace-wide work before the first frame.
   ```

   - Keep `bun run test:ci` passing.

4. **COMMIT:** run the task verification and self-review, then commit.

   **Commit message:**

   ```text
   feat(config): load config at startup and apply live reloads

   Task: P1-G2-T7 — Config wiring and live reload
   ```

**Verification:**

- `V39`: `bun test test/integration/config.test.ts` → all scenarios pass.
- `bun run test:ci` → DI1 suites still pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Passes in < 30 s; zero knip findings (`toml-eslint-parser` used) |
| Config and keys units | `bun test src/core/config src/core/state src/workspace src/core/kernel` | V17–V20 (except ",ff"), V22 (`:w`), V31, V33, V57, V58 pass |
| Integration and component | `bun test test/integration/config.test.ts test/ui/editor-options.test.ts` | V39 and V59 (except preview) pass |
| DI1 regression | `bun run test:ci`; `bun test test/vim` | DI1 suites and recorded vim cases unchanged |
| Pins | `bun test test/repo.test.ts`; `bun install --frozen-lockfile` | V55 passes |

#### Review and Verification Focus

- **Specification:**
  - S13, S14, S19 and S21 hold.
  - Config errors always name `config.toml:<line>`.
  - At startup, defaults apply on error; on reload, the current config is kept.
  - The `editor` defaults are 8 / true / true.
  - The leader is one key.
  - No discovery or jump commands are added early.
- **Technical:**
  - `state.config` is always valid.
  - `keymapFor` memoizes by config object.
  - No `reg.keymap` or `Bun.TOML` remains, and no `"<leader>": " "` entry remains.
  - The logger never writes note text.
  - Tab width 8 keeps recorded vim cases identical.
  - The wrap invariants hold.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ2 → DES2, DES7 → S19 → V35, V55` | None | `P1-G1`, `P1-G2` | `P1-G1-T1`, `P1-G1-T3`, `P1-G1-T5`, `P1-G2-T1` |
| `REQ3 → DES2 → S2 → V1–V4` | None | `P1-G1` | `P1-G1-T2`, `P1-G1-T3` |
| `REQ1, REQ3 → DES1, DES2 → S1 (analysis), S3 → V5, V6, V6a` | None | `P1-G1` | `P1-G1-T4` |
| `REQ3 → DES2 → S4 → V7` | None | `P1-G1` | `P1-G1-T5` |
| `REQ1 → DES3 → S6 → V8–V10` | None | `P1-G1` | `P1-G1-T6`, `P1-G1-T7` |
| `REQ6 → DES3 → S7, S9 → V11–V15` | None | `P1-G1` | `P1-G1-T8` |
| `REQ9 → DES3 → S17 → V16` | None | `P1-G1` | `P1-G1-T9` |
| `REQ7 → DES7 → S13 → V17–V19, V20 (except `,ff`), V31` | None | `P1-G2` | `P1-G2-T1`–`T4` |
| `REQ7 → DES7 → S14 → V33` | None | `P1-G2` | `P1-G2-T4` |
| `REQ1 → DES7 → S15 → V22 (`:w`)` | None | `P1-G2` | `P1-G2-T3` |
| `REQ7, REQ10 → DES7, DES11 → S13, S21 → V39` | None | `P1-G2` | `P1-G2-T7` |
| `REQ10 → DES11 → S21 → V57, V58, V59 (except preview)` | None | `P1-G2` | `P1-G2-T5`, `P1-G2-T6` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- G1 is confirmed before P1-G1-T1. G2/G3 outputs produced here (`parseDoc`, `syntaxExtensions`, `markdownFileType.analyze`, and NoteIndex with `resolveLink`) are handed to Part 2 and Part 3.
- Every source obligation assigned to this part is covered. The remaining V20 (",ff") and V59 (preview) cases are handed off to P2-G2.

Outputs consumed by later parts:

- `Doc`, `DocScan`, `scanDoc`, `parseDoc` and `withAnalysis`;
- `summarize`, `NoteIndex` and its operations, `resolveLink`, `linkText`, `planRename`, `renameImpact` and `linkMentionEdit`;
- `fuzzyScore` and `rankBy`;
- `Binding`, `defaultGroups`, `keymapFor`, `Registries.bindings`/`groups`, `onConfigLoaded` and `file.save`;
- `createLogger` and `RunnerDeps.logger`;
- `wrapLine`/`rowOf`, `paintLine` with `tabWidth`, and `VimEnv.tabWidth`.

## Planning Gaps

None
