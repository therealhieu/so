# P2-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-goal.md`
- **Plan Part:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-2-bases.md`
- **Group:** `P2-G1` — Bases engine and index facts
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/reports/p2-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

### Status

`Completed`

All five tasks are committed, every task check and every group check passes, and `bun run test:ci` passes. V30 is recorded `Pending — user fixture` by design.

**Dependencies and gate evidence.** Part 1 groups P1-G1 and P1-G2 are accepted (reports in `reports/`). Gate G3 was checked before P2-G1-T3 changed `NoteSummary`/`NoteIndex`:

- `git merge-base --is-ancestor 9adb285 HEAD` → ancestor.
- `NoteSummary` is at `src/core/features/links/summarize.ts:18-30`, as the design cites.
- `NoteIndex` is at `src/core/features/links/note-index.ts:6-18`. The design cites `7-18`; the type opens on line 6 and its shape matches.
- The worker messages are `ToWorker`/`FromWorker` in `src/workspace/index-worker.ts`.

**Starting state:** branch `feat/rm261003abzp-di4-daily-notes-and-bases` at `6906b65`, clean tree, no pre-existing changes.

**TDD record.** For T2–T5, the new tests were run before the modules existed and failed (missing module, or 5 failing T3 cases), then passed after implementation. In T1, `parser.ts` was written before `parser.test.ts`, so the parser cases never had a RED run. `expression` and `evaluator` failed RED (missing module) before their ports.

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G1-T1` | `src/core/features/bases/types.ts` (`KANBAN_TYPE = undefined`, `Base`, `BaseView` + `groupOrder`, `BaseCandidate` with epoch-ms times, `BaseCell`, `BaseGroup` with typed `value`, `BaseUi`, `BaseEvaluation`); `parser.ts:parseBase` (`{ ok, base } \| { ok: false, diagnostic }`, warnings `view_name_missing`/`group_by_invalid`, legacy `sort[].column`, `groupOrder`); `expression.ts` (single quotes, `inFolder` subfolders, `hasTag` any argument + nested + case-insensitive); `evaluator.ts:evaluateBase({ base, candidates, view?, ui? })` (all view types evaluate rows, `filter_hides_rows`, `BaseUi` overrides, diagnostics deduplicated); tests `{parser,expression,evaluator}.test.ts`; fixtures `test/fixtures/bases/alfred/*.base`; `test/boundaries.test.ts` `PACKAGE_HOMES.yaml` | `bun test src/core/features/bases/{parser,expression,evaluator}.test.ts test/boundaries.test.ts` → 91 pass, 0 fail; `bun run check` → 913 pass | `3ee3aa0` | `Completed` |
| `P2-G1-T2` | `src/core/features/bases/summaries.ts:DEFAULT_SUMMARIES, summarize`; `summaries.test.ts` | `bun test src/core/features/bases/summaries.test.ts` → 4 pass (28 expects; every one of the 15 names covered); `bun run check` → 917 pass | `0b133d0` | `Completed` |
| `P2-G1-T3` | `summarize.ts:NoteSummary.size/ctime`, `summarize(path, facts, scan, lines?)`; `note-index.ts:FileFacts`, `NoteIndex.facts`, `buildIndex`/`applySummaries`/`patch`/`movePaths` facts; `index-worker.ts:walk` (stats non-notes), `summarizeFile`, `changed`, `FromWorker.batch.facts`; `fs.ts:readTextFile` → `createdMs`; `types.ts:TextFile.createdMs`, `indexBatch.facts?`; `state/index.ts:onIndexBatch`, `summarizeSaved`, `summarizeWritten(…, stamp)`; `link-edits.ts` caller; `src/app/index-host.ts` forwards `facts`; every `summarize` test caller | `bun test src/workspace/index-worker.test.ts src/core/features/links src/workspace/fs.test.ts` → 40 pass, 0 fail; `bun test test/integration/index-host.test.ts src/app/index-host.test.ts` → 6 pass, unchanged; `bun test test/ui test/integration` → 154 pass; `bun run check` → 921 pass | `bd43e23` | `Completed` |
| `P2-G1-T4` | `src/core/features/bases/property-types.ts:PropertyType, PropertyTypes, validates, propertyType, parsePropertyTypes`; `candidates.ts:candidatesFrom`; `src/workspace/property-types.ts:readPropertyTypes(root, onInvalid?)`; `types.ts:IndexState.types`, action `propertyTypesLoaded`, effect `readPropertyTypes`; `init.ts` `types: {}`; `state/index.ts:onPropertyTypesLoaded`; `update.ts` routing; `effects.ts` case `readPropertyTypes` (logs `bases.typesInvalid`); `main.ts` dispatch after the first frame; tests `{candidates,property-types}.test.ts`, `src/workspace/property-types.test.ts`, `state/index.test.ts`, `app/effects.test.ts` | `bun test src/core/features/bases/{candidates,property-types}.test.ts src/workspace/property-types.test.ts` → 11 pass; `bun test src/core/state/index.test.ts src/app/effects.test.ts` → 25 pass; `bun run check` → 934 pass | `834a5e5` | `Completed` |
| `P2-G1-T5` | `src/core/features/bases/table.ts:tableModel, orderedGroups, cellText`; `kanban.ts:kanbanModel`; `views.ts:BaseLayout, tableLayout, boardLayout, BaseLayoutRegistry`; `evaluator.ts` exports `stringifyGroupKey` and reports the effective `sort`; tests `{table,kanban,views}.test.ts`; fixtures `test/fixtures/bases/{group-order.base,README.md}`, `test/fixtures/workspace/tasks.base`, `test/fixtures/workspace/tasks/*.md` | `bun test src/core/features/bases/{table,kanban,views}.test.ts` → 15 pass; V30: `test/fixtures/bases/README.md` has the empty provenance table, no `obsidian-kanban.base`, `KANBAN_TYPE === undefined` → `Pending — user fixture`; `bun run check` → 949 pass | `9b3e0d4` | `Completed` |

### Group Change Range

- **Starting commit:** `6906b65`
- **Final commit:** `9b3e0d4` (the report commit follows it)
- **Remaining group changes:** None

### Group Verification

- `bun test src/core/features/bases` → `Passed` — 116 tests across 9 files, 0 fail (V21–V24, V26, V26a, V28, V31–V33).
- `bun test src/core/features/links src/workspace` → `Passed` — 85 tests across 16 files, 0 fail. Existing cases are unchanged except for the mechanical `summarize` signature update.
- `bun run check` → `Passed` — 949 tests, 0 fail, real 4.35 s. The `yaml` home is declared. `rg 'core/state' src/core/features/bases` finds no import. `yaml` is imported only by `src/core/features/bases/parser.ts` and `src/core/lang/markdown/*`.
- `rg -n "KANBAN_TYPE" src` → `Passed` — only the `undefined` declaration (`types.ts:8`) and its test readers (`parser.test.ts`, `views.test.ts`). V30 recorded `Pending — user fixture`.
- `rg -n "W26100423LX|REQ[0-9]|DES[0-9]|\bV[0-9]+\b" src/core/features/bases src/workspace/property-types.ts test/fixtures/bases` → `Passed` — no match. Two comments ported from Alfred that named a work item were reworded, and Alfred test comments describing its own fixtures were removed.
- `bun run test:ci` → `Passed` — 165 tests across 24 files, 0 fail. `pgrep -fl 'bin/so|src/app/main.ts|bun test|index-worker'` found no process before or after.

### Deviations and Remaining Issues

Decisions a remediator must preserve:

1. **Port fidelity.** Alfred's evaluator is ported whole: semantic types, options, `columnSize`/`wrapText`, formula cycles, and declared-type diagnostics. This keeps its ported tests passing, as REQ7 requires. These Alfred-test changes are documented:
   - Base `path` is dropped; `parseBase(text)` takes no path.
   - ISO `mtime`/`ctime` become epoch ms, and `created_at` fallback cells hold numbers.
   - Groups gain a typed `value`.
   - String `groupBy` and malformed `groupBy` now also warn `group_by_invalid`.
   - "returns a diagnostic for unsupported view types" is replaced by "evaluates rows for view types without a layout". The design states that all types evaluate rows and that layouts produce the notice.
   - Alfred's write-side types (`FrontmatterPatch`, mutation inputs) are not ported, and `limitOverride` is dropped (no current caller).
2. **`parseBase` shape.** `parseBase` returns `{ ok: true; base } | { ok: false; diagnostic }`, as the design's `file-type.ts` sketch uses (`base.ok`). Parse warnings are in `base.diagnostics`.
3. **`BaseUi` semantics.**
   - `sort` replaces the view's sort.
   - `grouped: false` drops `groupBy`.
   - `filtered: false` ignores the view's own filters; global filters still apply.

   P2-G2's `s`/`g`/`f` commands should toggle these fields.
4. **Diagnostics.**
   - Diagnostics are deduplicated by severity, code, message, and path, because per-row evaluation repeats them.
   - `filter_hides_rows` is emitted once per failing filter expression, with the message `filter "<expr>" is not supported; rows it guards are hidden`.
   - Formula-dependency detection now also skips single-quoted strings, matching the tokenizer.
5. **Groups.** `orderedGroups` (in `table.ts`, shared with `kanban.ts`) applies `groupOrder` exactly, empty groups included. Without `groupOrder`:
   - Groups follow the direction with None last.
   - Tables show a None group only when rows lack a value.
   - Boards always show a None lane.
   - A row whose group value is a list appears in each of its groups.
6. **Contract signatures.** `tableModel(e, _ui, types)` and `kanbanModel(e, _ui)` keep the design's `ui` parameter but do not read it, because `evaluateBase` already applies the overrides. `BaseEvaluation.selectedView` gains `sort` (the effective sort) so tables can show the header arrow.
7. **Summaries.**
   - `Stddev` is the population standard deviation. Obsidian's docs do not say population or sample.
   - `DateRange` returns text such as `"10 days"`.
   - `Unique` counts distinct values with empty values included.
   - Date summaries compare written dates by their own fields through `Date.UTC`, and epoch-ms values as they are. Neither uses the process time zone, and `core/time` is not needed for this.
8. **Property types.** `validates` also checks that a date is a real calendar day, and it accepts written datetimes with or without seconds. `types.json`'s `multitext` maps to `list`.
9. **Adapter signature.** `readPropertyTypes(root, onInvalid?)` adds an optional callback so the runner can log `bases.typesInvalid`. The logger has no `warn`, so the runner logs at `error`. A missing file (`ENOENT`/`ENOTDIR`) is not reported.
10. **Files outside the T3 list.**
    - `src/app/index-host.ts` now forwards the worker's `facts` into `indexBatch` (`facts?` is optional). Without this, facts never reach state.
    - `summarizeWritten` now takes the write's `Stamp`, and `link-edits.ts` passes it.
    - Twelve test files and `test/support/notes.ts` were updated mechanically for the new `summarize` signature.
    - `summarizeSaved`/`summarizeWritten` keep the indexed `ctime` when it exists.
11. **Remaining issue (low).** A non-note file created through the explorer joins the index through `addFiles` without facts. The runner does not notify the worker about its own creates. Its candidate shows size 0 and times 0 until a watcher event or the next start, and the invariant "every indexed path has a summary or facts" does not hold for it until then. `candidatesFrom` still yields exactly one candidate for it.
12. **Scan cost.** The worker stats non-note files one at a time during the walk. Benches were not run in this group; perf gates do not block.

## Remediation

- **Verification reports:** Not yet produced.
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all tasks committed and all checks passed.
- **Final report commit:** returned to the orchestrator.
- **Final commits:** `3ee3aa0`, `0b133d0`, `bd43e23`, `834a5e5`, `9b3e0d4`
- **Final checks:**
  - `bun run check` → 949 pass, 4.35 s.
  - `bun run test:ci` → 165 pass.
  - `bun test src/core/features/bases` → 116 pass.
  - `bun test src/core/features/links src/workspace` → 85 pass.
- **Remaining issues:** V30 `Pending — user fixture`; item 11 above (low).
