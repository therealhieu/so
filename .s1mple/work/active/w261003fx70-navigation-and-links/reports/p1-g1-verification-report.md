# P1-G1 Verification Report

## Scope

- **Group:** `P1-G1` — Markdown model and links core
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`, `P1-G1-T6`, `P1-G1-T7`, `P1-G1-T8`, `P1-G1-T9`
- **Report:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p1-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p1-g1-implementation-report.md`

Verified range `6986404..98ece8d` (task commits `053554d`, `f187c97`, `954d000`, `fd5160e`, `b88247e`, `9030b30`, `8f42a33`, `bcb22e2`, `98ece8d`). Checks ran once at `HEAD` `71ab312` (the implementation report commit; no code change after `98ece8d`).

## Status

`Failed`

Every group check passes, and most of the `REQ → DES → S → V` chains hold. Three findings remain:

- The scan is quadratic on long lines, which breaks the linear-scan rule (Major).
- V16's `back` → `link.backlinks` expectation does not hold over the designed command ids (Major).
- Code and math spans that wrap across lines leak links, so the scan and mdast levels disagree (Minor).

## Assigned Traceability

- **System Design:** `REQ1, REQ2, REQ3, REQ6, REQ9 → DES2, DES3 → S2, S3, S4, S6, S7, S9, S17, S19 → V1–V16 (including V6a), V35, V55` (W261003FX70-prefixed; plan part 1, P1-G1 Traceability). V55 is shared with P1-G2-T1; this report covers only this group's pins (`yaml` and the five Markdown packages).
- **UI Design:** `None`
- **Roadmap binding:** RM261003ABZP-PH1@R2, DI2@R2 (discuss context, Roadmap Binding). Gate G1 (DI1 foundation `c98aa19`) must be met before `P1-G1-T1`.
  - Baseline: `6986404` "docs: start W261003FX70 execution" (2026-10-03 21:15:21 +0700) records "G1 met".
  - Actual evidence: `git merge-base --is-ancestor c98aa19 6986404` succeeds, and so does `… c98aa19 HEAD`.
  - The first task commit `053554d` (21:17:14) follows the gate record, so the gate evidence came before the required boundary.
  - Shared DI1 contracts are intact: `LAYER_RULES` is unchanged, and `FileType.analyze` keeps its signature. DI1 suites `bun run test:ci` pass (65 tests).
  - Parent sources were read only.

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ2 → DES2, DES7 → S19 → V35` | None | Each Markdown and TOML package is imported only from its home; a violating fixture is reported | `test/boundaries.test.ts:PACKAGE_HOMES`, `checkImports`, `VIOLATION_FIXTURES`; `test/fixtures/boundary-violation/state-imports-yaml.ts`. Only `src/core/lang/markdown/{scan,mdast}.ts` import these packages | `Satisfied` |
| `REQ2 → DES2 → S19 → V55` | None | `yaml` 2.9.1 and the five mdast/micromark packages are exactly pinned, with a frozen lockfile, and knip is clean | `package.json` exact pins (`mdast-util-from-markdown` 2.0.3, `mdast-util-gfm` 3.1.0, `mdast-util-math` 3.0.0, `micromark-extension-gfm` 3.0.0, `micromark-extension-math` 3.1.0, `yaml` 2.9.1); `bun.lock` committed | `Satisfied` |
| `REQ3 → DES2 → S2 → V1` | None | Blocks cover every line once; structural blocks stay whole; an unclosed fence runs to EOF | `src/core/lang/markdown/blocks.ts:splitBlocks`, `openFence`, `closesFence` | `Satisfied` |
| `REQ3 → DES2 → S2 → V2, V3, V4` | None | Every Obsidian syntax is found with exact ranges; code, math, and comments hide syntax; frontmatter tags, aliases, and links are found | `src/core/lang/markdown/syntax.ts` scanners; `scan.ts:scanBlock`, `scanFrontmatter`, `mergeScans`, `scanDoc`. Exclusions apply only within one line, so a code or math span that wraps across lines leaks links (VER3). The linear-scan invariant fails (VER1) | `Mismatch` |
| `REQ3 → DES2 → S3 → V5, V6, V6a` | None | `parseDoc(buf, prev)` equals `parseDoc(buf)` with ids; only changed blocks are re-scanned; ids are stable, and colliding hashes get ordered ids | `src/core/lang/markdown/doc.ts:parseDoc` (FNV-1a ids with probing in document order) | `Satisfied` |
| `REQ1, REQ3 → DES1, DES2 → S1 (analysis), S3` | None | `BufferState.analysis` tracks `text.version` at every text replacement; the UI no longer analyzes | `src/core/state/types.ts:BufferState.analysis`; `buffers.ts:withAnalysis`, `setBuffer` overload (a `text` patch requires `reg`, which the compiler enforces); call sites in `keys.ts` (runVim), `commands.ts` (substitute), `disk.ts` (reload, conflict take), and `onFileLoaded`. `src/ui/editors/text-view.ts` passes `b.analysis`. `grep analyze\|analyses src/ui` finds nothing | `Satisfied` |
| `REQ3 → DES2 → S4 → V7` | None | Scan and mdast agree over the corpus; the block cache is transparent | `src/core/lang/markdown/mdast.ts:blockNode` (LRU 2048 by hash); `conformance.test.ts`; `test/fixtures/markdown-corpus/*.md` (5 files). The corpus passes but omits wrapped inline code and math, where the two levels disagree (VER3) | `Mismatch` |
| `REQ1 → DES3 → S6 → V8, V9` | None | The documented resolution order holds; `linkText` round-trips and is shortest | `src/core/features/links/resolve.ts:resolveLink`, `resolvePath`, `bestCandidate`, `linkText`. The order is read as: root path first, then alias and basename candidates pooled and ranked same folder → alias → fewest folders → alphabetical (see Scope Changes) | `Satisfied` |
| `REQ1 → DES3 → S6 → V10` | None | Incremental index updates equal a full rebuild | `src/core/features/links/note-index.ts:patch`, `applySummaries`, `removePaths`, `movePaths`, `addFiles`, `buildIndex`; `summarize.ts:summarize` | `Satisfied` |
| `REQ6 → DES3 → S7 → V11–V14` | None | Rename and move keep every resolved link on its file, preserving kind, alias, and subpath, including captured links, outgoing links, and folder moves | `src/core/features/links/rename.ts:planRename`, `rewriteWiki`, `rewriteMarkdown`, `renameImpact`, `imageOf` | `Satisfied` |
| `REQ6 → DES3 → S9 → V15` | None | A mention edit touches only its span, in the basename-equality form | `src/core/features/links/mentions.ts:linkMentionEdit(ix, target, hit)` | `Satisfied` |
| `REQ9 → DES3 → S17 → V16` | None | fzf constants, smart case, and tie-breaks hold; `srd` → so-roadmap first; `back` over command ids → `link.backlinks` first | `src/core/kernel/text/fuzzy.ts:SCORE`, `fuzzyScore`, `rankBy`. Over the designed DI2 ids, `jump.back` ties `link.backlinks` at 104 and ranks first (VER2) | `Mismatch` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V1` | `S2` | `DES2` | `bun test src/core/lang` (blocks.test.ts "structural blocks stay whole", "an unclosed fence runs to the end", plus 6 edge cases) | Passed | `Passed` |
| `V2` | `S2` | `DES2` | scan.test.ts "every Obsidian link, tag, heading, and block id is found with exact ranges" | Passed. Every range slices to `raw`, and `a%20b.md` decodes to `a b.md` | `Passed` |
| `V3` | `S2` | `DES2` | scan.test.ts "code, math, comments, and html hide syntax"; ad hoc probes | The test passes. Probes show ``a `code\n[[x]] still` b`` and `a $x\n[[m]] y$ b` each yield one link that should be excluded (VER3) | `Insufficient` |
| `V4` | `S2` | `DES2` | scan.test.ts "frontmatter tags, aliases, and links" | Passed | `Passed` |
| `V5` | `S3` | `DES2` | doc.test.ts "incremental parse equals a fresh parse" (8 seeds × 150 edits, seed reported on failure) | Passed. The notes are corpus-like inline fixtures, not the corpus files | `Passed` |
| `V6` | `S3` | `DES2` | doc.test.ts "one edited paragraph re-scans one block" | Passed: 199 of 200 blocks are reference-equal | `Passed` |
| `V6a` | `S3` | `DES2` | doc.test.ts "block ids survive inserts above them", "colliding block hashes get distinct ids in document order" | Passed. A real FNV-1a collision pair is used | `Passed` |
| `V7` | `S4` | `DES2` | conformance.test.ts "scan and mdast agree on every corpus note", "a cached block tree equals a freshly parsed one"; ad hoc `blockNode` probe | The tests pass with an empty allowed-differences list. The probe finds scan 1 link vs mdast 0 for wrapped inline code and for wrapped math (VER3) | `Insufficient` |
| `V8` | `S6` | `DES3` | resolve.test.ts "resolution follows the documented order", "among equal candidates the fewest folders win, then alphabetical order" | Passed. From `a/x.md`, `[[plan]]` resolves to `a/plan.md`; from `root.md`, to `plan-x.md`; `[[b/plan]]`, `[[plan.md]]`, `#H1#H2`, `#^id`, and `a/plan%20x.md` all resolve as expected | `Passed` |
| `V9` | `S6` | `DES3` | resolve.test.ts "link text round-trips and is shortest" (5 seeds) | Passed | `Passed` |
| `V10` | `S6` | `DES3` | note-index.test.ts "incremental updates equal a full rebuild" (10 seeds × 120 steps) | Passed | `Passed` |
| `V11` | `S7` | `DES3` | rename.test.ts "rename preserves kind, alias, subpath, and frontmatter links" | Passed. The forms match, `expected === raw`, the open scan supplies `notes/open.md`, and impact is 6 links in 3 files | `Passed` |
| `V12` | `S7` | `DES3` | rename.test.ts "every resolved link keeps its file after random moves" (200 seeds, file and folder moves) | Passed | `Passed` |
| `V13` | `S7` | `DES3` | rename.test.ts "a moved note does not capture other notes' links" | Passed: `root.md` gets `[[a/plan]]` | `Passed` |
| `V14` | `S7` | `DES3` | rename.test.ts "folder moves map every contained file and rewrite links whose ranking changes", "edits to a moved note use its new path" | Passed | `Passed` |
| `V15` | `S9` | `DES3` | mentions.test.ts "linking a mention edits only its span", plus an ambiguous-name case | Passed | `Passed` |
| `V16` | `S17` | `DES3` | fuzzy.test.ts (6 tests); probe of `rankBy` over the ids including `jump.back`, `jump.forward`, `jump.list` | The tests pass, but the "back" test omits the designed `jump.back` (system design section 7, `defaults.ts` builtins and binding `<C-o>` → `jump.back`). Probe result: `jump.back:104 link.backlinks:104 search.backlinks:104` (VER2) | `Failed` |
| `V35` | `S19, S20` | `DES2, DES7` | `bun test test/boundaries.test.ts test/repo.test.ts` | 5 pass, 0 fail. `src` has no violations, and each of the 3 fixtures reports exactly one | `Passed` |
| `V55` (this group's pins) | `S19` | `DES2` | `bun test test/repo.test.ts`; `bun install --frozen-lockfile` | Exact pins pass. "Checked 110 installs across 186 packages (no changes)", exit 0 | `Passed` |
| Fast gate | `S19` | `DES2, DES3` | `bun run check` | Exit 0. biome, tsc, and knip are clean (zero findings); 481 pass, 0 fail; wall time 2.85 s (< 30 s) | `Passed` |
| Unit suites | `S2–S4, S6, S7, S9, S17` | `DES2, DES3` | `bun test src/core/lang src/core/features src/core/kernel/text src/core/state` | 110 pass, 0 fail across 20 files | `Passed` |
| DI1 regression smoke | `S20` | `DES2` | `bun run test:ci` | 65 pass, 0 fail across 9 files, 15 snapshots | `Passed` |
| Scan linearity (DES2 / `scan.ts` invariant "Linear in text length") | `S2, S5` | `DES2` | Ad hoc timing of `scanDoc` on a single line of a repeated pattern | `"["` × 20k/40k/80k chars: 323/1291/5204 ms. `"[["`: 327/1289/5219 ms. `"![[a|"`: 112/434/1742 ms. `"[a]("`: 96/376/1547 ms. `"%%"`: 149/596 ms at 40k/80k. Doubling the input quadruples the time (VER1) | `Failed` |
| Group self-review | None | `S1–S4` | `git diff 6986404..98ece8d`; grep for work-process ids; `grep analyze src/ui` | No process ids in code, tests, or fixtures. `src/core/kernel` imports no packages. No `analyze` call in `src/ui`. Every text replacement goes through the `setBuffer` overload, which requires `reg` | `Passed` |

## Findings

### P1-G1-VER1 — Major — Technical (performance and correctness) — Scan is quadratic on long lines

- **System Design:** `REQ3 → DES2 → S2, S5 → V2, V3` (`scan.ts` invariant "Linear in text length. No regex backtracking across lines."; plan Review Focus "The scan is linear")
- **UI Design:** `None`
- **Evidence:** Timing a single line through `scanDoc` shows quadratic growth: 80 KB of `[` takes 5204 ms, 40 KB takes 1291 ms, and 20 KB takes 323 ms. `[[`, `![[a|`, `[a](` and `%%` grow the same way. There are three sources:
  - `src/core/lang/markdown/syntax.ts:307`: `scanMarkdownLinks` calls `parseMarkdownLink` at every `[`, and each call scans forward to the matching `]` or the end of the line.
  - `syntax.ts:170-171`: `WIKILINK_RE` and `EMBED_RE` (`[^\]|]+?` lazy) retry from every `[[` on an unclosed run.
  - `syntax.ts:77` `taken` walks every exclusion and link already on the line, once per candidate.
- **Impact:** `parseDoc` runs in `update` on every keystroke for the edited block, and the worker scans whole files. One long line can freeze the main thread or the index worker for seconds, for example a pasted minified JSON or data blob. This breaks DES2's budget rationale (S5) and the stated invariant.
- **Required resolution:** `scanBlock` and `scanDoc` run in time linear in line length for unclosed-bracket, unclosed-embed, unclosed-link, and many-span inputs, and V2–V4 and V7 results stay unchanged.
- **Required proof:** Add a unit test in `src/core/lang/markdown/scan.test.ts` that scans single lines of at least 80 KB of `[`, `[[`, `![[a|`, `[a](`, `%%`, and `` `a` `` repeated. It must assert that each finishes within a bound that rules out quadratic growth (for example, a 4× input takes less than 8× the time, or an absolute bound with margin). Then rerun `bun run check`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G1-VER2 — Major — Specification — V16 "back" ranking does not hold over the designed command ids

- **System Design:** `REQ9 → DES3 → S17 → V16` (expectation "\"back\" over command ids … link.backlinks first"); requirements acceptance "RM261003ABZP-UV4@R2 passes, including … `back` → `link.backlinks` first"
- **UI Design:** `None`
- **Evidence:**
  - The test at `src/core/kernel/text/fuzzy.test.ts:33-46` ranks a hand-picked list that omits `jump.back`. The system design (section 7, `src/core/kernel/commands/defaults.ts`) adds `jump.back`, `jump.forward`, and `jump.list` to the DI2 builtins and binds `<C-o>` to `jump.back`.
  - `rankBy` over the designed ids returns `jump.back:104 link.backlinks:104 search.backlinks:104`. The scores tie, and the documented "shorter text first" tie-break puts `jump.back` first.
  - The implementation report records this as deviation 10, but leaves it unresolved.
- **Impact:** V16 passes only because its input omits a designed command id. The palette group (UV4) will fail, or will be forced to change constants or tie-breaks that V16 fixes. The conflict between the fzf constants and tie-breaks and the `back` expectation needs a decision, not a curated test list.
- **Required resolution:** The orchestrator decides one of these, and the code and test then follow it:
  - the ranked text changes (for example, the palette ranks on titles or `id + title`), and the governing design records it;
  - or the V16 and UV4 `back` expectation is amended in the governing sources.

  Either way, the fzf constants and the documented tie-break order stay unchanged unless the design changes them.
- **Required proof:** The V16 "back" test in `src/core/kernel/text/fuzzy.test.ts`, or the palette-level test that the design names, ranks over the full designed DI2 command set including `jump.back`, and asserts the amended or original expectation. `bun test src/core/kernel/text/fuzzy.test.ts` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G1-VER3 — Minor — Specification — Inline code and math that wrap across lines leak links, and the two levels disagree

- **System Design:** `REQ3 → DES2 → S2, S4 → V3, V7`
- **UI Design:** `None`
- **Evidence:**
  - `scanDoc` reports a link in both ``a `code\n[[x]] still` b`` and `a $x\n[[m]] y$ b`, while `blockNode` yields no wikilink node for either (probe result: scan 1 vs mdast 0).
  - The cause is that scanners run per line: `syntax.ts` exclusions are "closed on the same line".
  - The corpus (`test/fixtures/markdown-corpus/*.md`) has no wrapped inline code or math, so V7 does not catch the difference, and its allowed-differences list is empty.
- **Impact:**
  - Text inside a wrapped code or math span counts as a link for the index, backlinks, and mentions.
  - `planRename` would rewrite it, changing code-example text in a rename.
  - DES2's "one grammar at two levels" guarantee is broken for valid CommonMark.
- **Required resolution:** Do one of the following:
  - exclude inline code and math spans that cross line breaks within a paragraph block at the scan level;
  - or list these cases explicitly as allowed differences in `conformance.test.ts`, with the governing design acknowledging the per-line limit.
- **Required proof:** Add corpus notes with wrapped inline code and wrapped inline math containing `[[…]]` and `#tag`, and add a `scan.test.ts` V3 case for them. `bun test src/core/lang/markdown` passes under the chosen resolution.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - Block splitting, including fences, frontmatter, setext, lists, and HTML.
  - Scan facts with exact ranges, plus exclusions on one line.
  - Frontmatter tags, aliases, and links, plus invalid frontmatter.
  - Incremental `parseDoc` equality, reuse, and id stability, including a real FNV collision.
  - Buffer analysis after load, edit, reload, and substitute, plus a throwing analyzer.
  - Scan and mdast conformance over 5 corpus files, plus cache transparency.
  - Index rebuild-equality property (10 × 120).
  - Resolution order and the `linkText` round-trip property.
  - Rename forms, the 200-seed rename property, capture, folder moves, and a moved source.
  - Mention edits.
  - fzf constants, scores, smart case, and ties.
  - Package homes and pins.
- **Missing:**
  - A scan-linearity test on long lines (VER1).
  - A V16 "back" ranking over the full designed command id set (VER2).
  - Wrapped inline code and math in the scan tests and the corpus (VER3).
  - The rename property (V12) always passes an empty `open` map, so live-scan precedence is covered only by V11's single case.
  - `PACKAGE_HOMES` matches bare specifiers exactly, so a subpath import such as `yaml/util` from outside the home is not reported, and no fixture covers it.

## Scope Changes

Each implementation-report deviation was assessed against the governing design:

1. **T6 commit `9030b30` failed knip** (`resolveLink` unused). This is a process deviation: the plan says to commit after checks pass. It was fixed by `8f42a33`, and the final range is knip-clean. History was correctly not rewritten. No finding, because the final state is correct.
2. **`NoteIndex.linkSources`** is an additive field not in the design's `NoteIndex` contract. It is justified: incremental re-resolution and `planRename` capture detection need name-keyed sources, and V10 covers it. Report it for design and parent synchronization.
3. **`planRename` collects more candidates than designed**: every open note, and links naming a moved note's alias. Seed 68 shows alias capture is a real case that the design's step 2 misses. This is accepted and should be reflected in the design.
4. **Resolution order.** The parent comment reads "exact root path → alias → basename ranked by same folder, shortest path, alphabetical". A strictly sequential alias step would resolve `[[plan]]` from `a/x.md` to `plan-x.md`, which contradicts V8's explicit expectation (`a/plan.md`). The implementation instead pools alias and basename candidates and ranks them same folder → alias → fewest folders → alphabetical, and reads "shortest path" as fewest path segments. This is the minimal reading that satisfies V8. It differs from a literal reading, so record it for parent synchronization (RM261003ABZP-V5@R1 wording).
5. **Markdown links are rewritten to the full vault-root path**, not `linkText`. This matches V11's expected `[x](projects/roadmap.md)`. Design section 7 step 3 says `linkText` applies to all rewritten links, so the design text should name the Markdown exception.
6. **Scanner order code → math → comment** instead of the design comment's "comment, math, code". This is correct in CommonMark terms (code spans take precedence) and is tested by "a comment opener inside a code span does not start a comment". Accepted.
7. **`withAnalysis` catches analyzer failures** silently, without a toast. This is needed so a file still opens (`test/ui/shell.golden.test.ts`) and is acceptable. Note the difference from the "throwing handler → error toast" rule.
8. **Extra file `syntax.test.ts`.** Accepted; it adds real coverage.
9. **Argument order follows the design**: `linkMentionEdit(ix, target, hit)` and `fuzzyScore(text, query)`. Correct.
10. **"back" tie risk.** Raised as VER2.

## Unverified Items

- **S5 budgets (V49, V51)** belong to other groups and were not measured here. VER1 shows a worst-case violation, but typical-note throughput was not benchmarked.
- **The knip failure at `9030b30`** was taken from the implementation report and not re-run, because checks are run once at the final state.

## Blockers

None
