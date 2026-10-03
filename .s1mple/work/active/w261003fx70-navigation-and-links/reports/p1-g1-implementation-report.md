# P1-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-plan-1-core-models-and-config.md`
- **Group:** `P1-G1` — Markdown model and links core
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`, `P1-G1-T6`, `P1-G1-T7`, `P1-G1-T8`, `P1-G1-T9`
- **Report:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p1-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G1-T1` | `test/boundaries.test.ts:PACKAGE_HOMES`, `VIOLATION_FIXTURES`; fixture `state-imports-yaml.ts` | `bun test test/boundaries.test.ts` passed, and the fixture importing `yaml` from `src/core/state` was reported as a violation. `bun run check` exited 0 | `053554d` | `Completed` |
| `P1-G1-T2` | `src/core/lang/markdown/blocks.ts:splitBlocks`, `openFence`, `closesFence`, `LineSource`; `syntax.ts` scanners; `blocks.test.ts`, `syntax.test.ts` | `bun test src/core/lang/markdown` passed. `bun run check` exited 0 | `f187c97` | `Completed` |
| `P1-G1-T3` | `src/core/lang/markdown/scan.ts:scanBlock`, `scanFrontmatter`, `mergeScans`, `scanDoc`, `linesOf`; `scan.test.ts`; `yaml@2.9.1` pinned | `bun test src/core/lang/markdown` passed. `bun test test/repo.test.ts` passed. `bun install --frozen-lockfile` exited 0. `bun run check` exited 0 | `954d000` | `Completed` |
| `P1-G1-T4` | `src/core/lang/markdown/doc.ts:parseDoc`; `file-type.ts` analyze; `src/core/state/buffers.ts:withAnalysis`, `setBuffer` overloads; registry passed through disk, keys and commands; `text-view.ts` WeakMap removed | `bun test src/core/lang src/core/state` passed. `bun run check` exited 0. `bun run test:ci` passed (65 tests) | `fd5160e` | `Completed` |
| `P1-G1-T5` | `src/core/lang/markdown/mdast.ts:blockNode` (LRU 2048); mdast transforms in `syntax.ts`; `test/fixtures/markdown-corpus/*` (5 files); `conformance.test.ts`; five mdast/micromark packages pinned | `bun test src/core/lang/markdown/conformance.test.ts` passed. `bun run check` exited 0 | `b88247e` | `Completed` |
| `P1-G1-T6` | `src/core/features/links/summarize.ts`; `note-index.ts:buildIndex`, `applySummaries`, `removePaths`, `movePaths`, `addFiles`, `backlinksOf`, `tagCounts`, `notesWithTag`, `linkSources`; `resolve.ts:resolveLink`, `resolvePath`, `nameKey` | `bun test src/core/features/links/note-index.test.ts` passed: 10 seeds × 120 steps, each step equal to a rebuild. `bun run check` **failed** at knip (`resolveLink` unused) at this commit. Fixed by `8f42a33` | `9030b30` (knip fixed in `8f42a33`) | `Completed` |
| `P1-G1-T7` | `src/core/features/links/resolve.ts:linkText`, resolution order; `resolve.test.ts` | `bun test src/core/features/links/resolve.test.ts` passed: documented order, ties, and the round-trip/shortest property over 5 seeds. `bun run check` exited 0 | `8f42a33` | `Completed` |
| `P1-G1-T8` | `src/core/features/links/rename.ts:PathMove`, `SpanEdit`, `FileEdit`, `planRename`, `renameImpact`; `mentions.ts:MentionHit`, `linkMentionEdit`; `src/core/lang/markdown/syntax.ts:parseMarkdownLink` exported with the destination span | `bun test src/core/features/links` → 14 pass, 0 fail (property: 200 seeds of file and folder moves). `bun run check` exited 0 (475 pass) | `bcb22e2` | `Completed` |
| `P1-G1-T9` | `src/core/kernel/text/fuzzy.ts:SCORE`, `FuzzyMatch`, `fuzzyScore`, `rankBy`; `fuzzy.test.ts` | RED: `Cannot find module './fuzzy'`. GREEN: `bun test src/core/kernel/text/fuzzy.test.ts` → 6 pass. `bun run check` exited 0 (481 pass) | `98ece8d` | `Completed` |

### Group Change Range

- **Starting commit:** `6986404`
- **Final commit:** `98ece8d`
- **Remaining group changes:** None. `git status --short` is empty after the T9 commit.

### Group Verification

- `bun run check` → `Passed` — exit 0 in about 2.6 s (well under 30 s); biome, tsc and knip clean (zero knip findings); 481 pass, 0 fail.
- `bun test src/core/lang src/core/features src/core/kernel/text src/core/state` → `Passed` — 110 pass, 0 fail across 20 files.
- `bun test test/boundaries.test.ts test/repo.test.ts` → `Passed` — 5 pass, 0 fail.
- `bun install --frozen-lockfile` → `Passed` — "110 installs across 186 packages (no changes)".
- `bun run test:ci` (DI1 regression smoke) → `Passed` — 65 pass, 0 fail across 9 files.
- Group diff self-review (`git diff 6986404..HEAD`) → `Passed`:
  - no work-process identifiers in code, tests or fixtures;
  - no `@opentui/*` import under `src/core`, and `src/core/kernel` imports no packages;
  - every new dependency is exactly pinned in `package.json`, and `bun.lock` is committed.

### Deviations and Remaining Issues

1. **T6 commit failed knip.** `9030b30` was committed while `bun run check` failed:
   ```
   Unused exports (1)
   resolveLink  function  src/core/features/links/resolve.ts:82:17
   ```
   - Cause: a piped `| tail` hid the failing exit code.
   - Fix: `8f42a33` (T7) added the consumer, and check exited 0.
   - History was not rewritten, as the commit rules require.
2. **`NoteIndex.linkSources` was added (not in the design).**
   - It maps a link name (`nameKey(target)`) to the notes holding such a link.
   - Incremental updates and `planRename` need it to find unresolved or captured links without scanning the whole workspace.
   - The rebuild-equality property covers it.
3. **`planRename` collects a superset of the design's candidate links.**
   - Added: every open note, and links naming any alias of a moved note.
   - The rename property found that a note moved into a folder captures same-folder links through its alias (seed 68: `x.md` with alias `plan` moved to `a/new.md` captured `[[plan]]` in `a/plan.md`).
   - Preserve this when remediating.
4. **Resolution order interpretation** (`resolve.ts:bestCandidate`):
   - an exact vault-root path wins;
   - otherwise alias and basename candidates are pooled and ranked: same folder, then alias before basename, then fewest folders, then alphabetical.
   - This is required to satisfy V8.
5. **Markdown links are rewritten to the full vault-root path.** For example, `[x](projects/roadmap.md)`, per V11.
   - The destination is URL-encoded per segment when the source was encoded.
   - It is written raw inside `<…>`.
   - Wikilinks use the shortest `linkText`.
6. **Scanner order in `syntax.ts` is code → math → comment.** The design comment says "comment, math, code". This order is needed so `%%` inside code spans is not taken as a comment.
7. **Failing file-type analysis is caught.** `withAnalysis` catches an `analyze` failure and drops `analysis`, so a file still opens. This is required by `test/ui/shell.golden.test.ts:168`.
8. **Extra file `syntax.test.ts` (T2).** It was added so knip has a consumer for the scanners that are exported before T3 uses them.
9. **Argument order follows the design.** Where the plan previews differ, the design's order is used: `linkMentionEdit(ix, target, hit)` and `fuzzyScore(text, query)`.
10. **Risk for the palette / UV4 group: "back" ties.** The query "back" scores `jump.back` (bound to `<C-o>`) the same as `link.backlinks`. Under the documented tie-break (shorter text first), `jump.back` ranks first.
    - The V16 kernel test ranks command ids without `jump.back`.
    - To meet UV4's "`back` → `link.backlinks` first", the palette group must rank on different text, for example titles, or the expectation must be revisited.
    - The scoring constants and tie order were not changed.

## Remediation

Two of the three findings are fixed and committed. VER2 is `Blocked`: the in-scope resolution (the palette ranks titles) cannot make `link.backlinks` rank first without changing an approved design decision.

- **Verification reports:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p1-g1-verification-report.md` (status `Failed`; findings P1-G1-VER1, P1-G1-VER2, P1-G1-VER3). The report is unchanged.
- **Status:** `Blocked`

### Baseline and Gate Evidence

- Remediation started at `51218a5` on `feat/rm261003abzp-di2-navigation-and-links`. The group range under review was `6986404..98ece8d`, and the implementation report diff matched it: the nine task commits plus `71ab312` (report) and `51218a5` (verification report).
- Gate G1 still holds. `c98aa19` is an ancestor of `6986404` and of `HEAD`, as the verification report records. No parent source under `.s1mple/work/active/rm261003abzp-so-v1/` was edited, and the accepted baseline was not changed.
- The orchestrator's uncommitted edit to `w261003fx70-goal.md` was left untouched and never staged.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P1-G1-VER1` | See "VER1 — linear scan" below. Baseline at `51218a5`: 80 KB of `[` took 5375 ms. After the fix it takes 2.5 ms, and every probed pattern grows about linearly. `bun test src/core/lang/markdown/scan.test.ts` → 8 pass. The new test "scanning a long line takes time linear in its length" fails on the `51218a5` code (timed out after 5000 ms, 20.7 s run). `bun run check` → exit 0, 483 pass, zero knip findings | `c5f9f15` (Tasks `P1-G1-T2`, `P1-G1-T3`) | `Fixed` |
| `P1-G1-VER2` | No code change. Over the designed command set, ranking "back" on titles gives `search.backlinks "Backlinks" 104 \| link.backlinks "Toggle backlinks panel" 104`. Ranking on ids gives `jump.back 104 \| link.backlinks 104 \| search.backlinks 104`. Both tie at 104, and the fixed "shorter text first" tie-break never puts `link.backlinks` first. See "VER2 — blocker" below | No change — every in-scope option fails; evidence below | `Blocked` |
| `P1-G1-VER3` | See "VER3 — wrapped spans" below. The verifier's probes now give scan 0 / mdast 0 for both ``a `code\n[[x]] still` b`` and `a $x\n[[m]] y$ b`. `bun test src/core/lang/markdown` passes: the new scan test and the corpus note `wrapped.md`, with `ALLOWED_DIFFERENCES` still empty. On the `51218a5` code, conformance fails with `wrapped.md: links` and `wrapped.md: tags`, and the scan test fails | `b6f7e1e` (Tasks `P1-G1-T3`, `P1-G1-T5`) | `Fixed` |

#### VER1 — linear scan

Each source of quadratic work now uses a forward-only lookup or a precomputed table (`src/core/lang/markdown/syntax.ts`):

| Former cost | Fix |
|---|---|
| `parseMarkdownLink` scanned to `]` or the line end at every `[` | `linkIndex` matches brackets with one stack pass. It also builds bare-destination ends (unescaped blank or unbalanced `)`, through a backward pass keyed by paren depth), next-non-blank, and next-character tables. `parseMarkdownLink(text, i, ix = linkIndex(text))` keeps its result shape for `rename.ts` |
| `WIKILINK_RE` / `EMBED_RE` retried from every `[[` | `wikiMatches` implements the same grammar with forward-only `finder` lookups for `]` and `\|`. The scan and the mdast transform share it through `replaceText(tree, find)`, so the grammar is still defined once |
| `taken` walked every range on the line for each candidate | `Claims` holds the line's sorted, merged claimed columns. Each scanner queries with non-decreasing starts and one cursor. Claims are rebuilt only after a scanner adds a range |
| `scanComments` re-ran `indexOf("<!--")` and the close search for every opener | Four monotonic `finder`s keep the original matching rules |

Measured on 160 KB lines in the test, each pattern scans in a few milliseconds. The bound is 400 ms, which leaves at least 25x margin over linear and still catches quadratic growth.

- **Probe** (scratchpad `lin.ts`, 20 KB → 80 KB):
  - `[` 2.4 → 2.5 ms
  - `[[` 0.6 → 2.3 ms
  - `![[a|` 0.3 → 0.9 ms
  - `[a](` 3.1 → 2.9 ms
  - `%%` 5.6 → 4.7 ms
  - `` `a` `` 4.1 → 7.2 ms
  - `[[a]] ` 1.5 → 3.2 ms
- **Typical-note cost.** A 0.83 MB mixed note takes a median 26 ms vs 22 ms at `51218a5`, about 1.17x, from the tables and per-line claims. This is measured against the `indexReady` 3000 ms target; benchmarks (V49, V51) belong to `P3-G1`.

#### VER3 — wrapped spans

`inlineSpans(lines)` pairs `` ` `` and `$` runs across a paragraph's lines, and math cannot open inside code. `scanBlock` collects a paragraph's lines and scans them through `scanParagraph`. That function passes each line the spans that touch it, and `scanLine(text, line, out, spans)` records each span once, at its start line, as a multi-line `excluded` range.

A run of inline content ends at:

- a blank line, a fence, an ATX heading, or a setext underline;
- a quote-only line, a deeper quote, or a new list item;
- a GFM table header or row.

`excluded` already held multi-line ranges for fenced blocks, and `doc.ts` only shifts them.

- **Tests:**
  - `scan.test.ts` "code and math that wrap across a paragraph's lines hide syntax" covers a paragraph, a quote, and two list items, with exact multi-line ranges.
  - `test/fixtures/markdown-corpus/wrapped.md` covers code, math, a double-backtick run, a quote, list items, and a table.

#### VER2 — blocker

The orchestrator's constraint keeps `SCORE`, the tie-break (score desc → shorter text → alphabetical), the ids, and the `back` → `link.backlinks` expectation. The resolution it proposed has the palette rank titles, with `jump.back` and `jump.forward` titled "Jump to older position" and "Jump to newer position".

- **Why it fails.** The jump titles do drop out of `back`. But the design fixes `search.backlinks` with the title "Backlinks" (system design section 7, `features/links/commands.ts`). That title scores the same 104 as "Toggle backlinks panel", because `b` gets the boundary bonus at the string start and after a space, and it wins as the shorter text.
- **Other texts.** Ranking on `id title` or `title id` puts `search.backlinks` first too. Ranking on ids puts `jump.back` first.
- **Conclusion.** No ranked text holds under the fixed constants, tie-break, ids, and titles. The V16 test was not changed, because a test asserting the expectation would fail.

Each way out changes an approved decision, so the choice belongs to the orchestrator and the user:

| Option | Example | Effect |
|---|---|---|
| Rename the `search.backlinks` title so it is longer than 22 characters, and rank on titles | "Search backlinks of this note" | `link.backlinks` wins the tie on length. Also give the `jump.*` titles that do not match `back`. Changes the designed title |
| Amend V16 / UV4 `back` → `link.backlinks` | Expect `back` to list `link.backlinks` among the tied top results | Changes the requirement and parent UV4 wording (parent sync) |
| Add a palette-specific tie-break | Rank on titles, then on a command priority | Changes the documented tie-break for the palette |

If the first option is chosen, P2-G2 must preserve one rule: the palette ranks command titles, and no command title other than "Toggle backlinks panel" may tie it on `back` at equal or shorter length.

### Group Verification After Remediation

- `bun run check` → `Passed` — exit 0 in 2.70 s; Biome, `tsc`, and knip clean (zero findings); 483 pass, 0 fail.
- `bun test src/core/lang src/core/features src/core/kernel/text src/core/state` → `Passed` — 112 pass, 0 fail across 20 files.
- `bun test test/boundaries.test.ts test/repo.test.ts` → `Passed` — 5 pass, 0 fail.
- `bun install --frozen-lockfile` → `Passed` — exit 0, "Checked 110 installs across 186 packages (no changes)".
- `bun run test:ci` → `Passed` — exit 0; 65 pass, 0 fail across 9 files; 15 snapshots.
- Group diff self-review (`git diff 6986404..HEAD`) → `Passed`:
  - no work-process identifiers in added code, tests, or fixtures;
  - no `@opentui/*` import under `src/core`;
  - no new dependency;
  - each remediation commit passed `bun run check` before it was made. The intermediate `c5f9f15` state passed with 482 tests.

## Final Status

`Blocked`

### Final Evidence

- **Final report status:** `Blocked`. P1-G1-VER1 and P1-G1-VER3 are fixed. P1-G1-VER2 needs a decision that changes an approved design item.
- **Final report commit:** Returned to the orchestrator.
- **Final commits:**
  - Initial: `053554d`, `f187c97`, `954d000`, `fd5160e`, `b88247e`, `9030b30`, `8f42a33`, `bcb22e2`, `98ece8d`.
  - Remediation: `c5f9f15` (VER1), `b6f7e1e` (VER3).
- **Final checks:**
  - `bun run check` exit 0 (483 pass, 2.70 s);
  - unit suites 112 pass;
  - boundaries and pins 5 pass;
  - frozen install no changes;
  - `bun run test:ci` 65 pass.
- **Remaining issues:**
  - P1-G1-VER2. Choose one option from "VER2 — blocker".
  - Outside the findings: the mdast-only footnote transform (`/\^\[([^\]\n]+)\]/g`) and `pointAt` stay quadratic on pathological text nodes. They run lazily per block, not in `scanBlock` or `scanDoc`, so they were left unchanged.
