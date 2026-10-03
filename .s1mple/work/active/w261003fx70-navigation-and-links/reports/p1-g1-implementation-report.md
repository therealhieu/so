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

- **Verification reports:** None yet.
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all nine tasks are committed and every group check passed.
- **Final report commit:** Returned to the orchestrator.
- **Final commits:** `053554d`, `f187c97`, `954d000`, `fd5160e`, `b88247e`, `9030b30`, `8f42a33`, `bcb22e2`, `98ece8d`
- **Final checks:**
  - `bun run check` exit 0 (481 pass);
  - unit suites 110 pass;
  - boundaries and pins 5 pass;
  - frozen install no changes;
  - `bun run test:ci` 65 pass.
- **Remaining issues:** Deviation 10, the palette "back" tie risk for a later group.
