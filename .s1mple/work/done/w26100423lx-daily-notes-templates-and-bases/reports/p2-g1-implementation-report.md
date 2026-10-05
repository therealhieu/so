# P2-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-goal.md`
- **Plan Part:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-2-bases.md`
- **Group:** `P2-G1` — Bases engine and index facts
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p2-g1-implementation-report.md`

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

- **Verification reports:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p2-g1-verification-report.md` (commit `228dd1b`, `Failed`: VER1 Major, VER2–VER4 Minor)
- **Status:** `Completed`

All four findings are fixed with regression tests that failed before each fix, one commit per finding. The remediation range is `228dd1b..0f636be`. Each fix was checked with the tests it touched and `bun run check` before its commit.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G1-VER1` | `evaluator.ts` `buildGroups` now compares groups by their typed `value`, falling back to the text key on a tie. So `2, 9, 10` sort as numbers, while booleans and strings sort as before. `orderedGroups` still puts None last, and `groupOrder` is unchanged. New tests: `kanban.test.ts` "numeric lanes sort by number, not by text" (`ASC` → `[2, 9, 10, null]`, `DESC` → `[10, 9, 2, null]`) and `table.test.ts` "numeric groups sort by number, not by text" (`DESC` over `10, 9, 2, 100` → `[100, 10, 9, 2]`). RED: both failed (2 fail, 12 pass). GREEN: `bun test src/core/features/bases` → 118 pass, 0 fail. `bun run check` → 951 pass, 0 fail | `c5ea0d2` | `Fixed` |
| `P2-G1-VER2` | Following the design rule, a filter subtree with an unsupported expression now excludes the row, even under negation. `matchesFilter` returns `true`, `false`, or `undefined` for an expression it cannot evaluate. `and` is false on any false child, `or` is true on any true child, `not` is false on any true child, and otherwise an `undefined` child propagates. Only `true` keeps a row. The ported Alfred `and`/`or`/`not` cases still pass, because a decided `or` branch still shows its row. New test: `evaluator.test.ts` "an unsupported filter under not hides its rows as its diagnostic says". With `not: ["status.contains('x')"]` it expects 0 rows and exactly the `filter_hides_rows` message. RED: 1 fail, 67 pass. GREEN: `bun test src/core/features/bases` → 119 pass, 0 fail. `bun run check` → 952 pass, 0 fail | `f3eaf30` | `Fixed` |
| `P2-G1-VER3` | `table.ts` `tableModel` collects the distinct evaluation rows it shows (all rows when ungrouped, otherwise the rows of the ordered groups). `total` and every summary now use that set, so rows in groups hidden by `groupOrder` are left out of both, and a row shown in several groups counts once. The `TableModel.total` doc comment states this. New test: `table.test.ts` "total and summaries count only the rows the groups show". With `groupOrder: [todo]`, one `todo` row (`n: 1`), and one `done` row (`n: 100`), it expects 1 row, `total` 1, and `Sum` `"1"`. RED: `total` was 2 (1 fail, 9 pass). GREEN: `bun test src/core/features/bases` → 120 pass, 0 fail. `bun run check` → 953 pass, 0 fail | `ce27d62` | `Fixed` |
| `P2-G1-VER4` | After a successful non-folder `create`, the runner's `create` case in `src/app/effects.ts` now calls `d.index?.notify({ kind: "changed", path, isDir: false })`. It does this after dispatching `fsResult`, as the `write`, `applyEdits`, and `createNote` cases notify after their writes. `update` stays pure, and the worker computes the facts. New tests: (1) `src/app/effects.test.ts` "a created file is sent to the index; a failed create or a folder is not". RED: 1 fail, 16 pass. GREEN: 17 pass. (2) `test/integration/index-host.test.ts` "a file created in the explorer gets its size and times in the index". It runs the real worker and host and checks that `ix.facts` for `data.csv` equals `stat` (size, `mtimeMs`, birth time) and that an `indexBatch` action carried those facts. This also covers the `index-host.ts` `facts` forwarding that the verifier listed as untested. The integration case passed before the fix as well. `runFsOp` does not mark a create as an own operation, so on macOS the watcher already reported the file. The verification report's claim that the watcher ignores this own operation does not hold for `create`. The runner notification removes the dependence on the watcher's timing and its coverage, and the unit test is the failing-first proof. `bun run check` → 954 pass, 0 fail. `bun run test:ci` → 166 pass, 0 fail | `0f636be` | `Fixed` |

**Completion checklists:**

- `P2-G1-VER1`:
  - [x] Required resolution is implemented.
  - [x] Required proof passes.
  - [x] Change evidence is recorded.
  - [x] Verification evidence is recorded.
- `P2-G1-VER2`:
  - [x] Required resolution is implemented.
  - [x] Required proof passes.
  - [x] Change evidence is recorded.
  - [x] Verification evidence is recorded.
- `P2-G1-VER3`:
  - [x] Required resolution is implemented.
  - [x] Required proof passes.
  - [x] Change evidence is recorded.
  - [x] Verification evidence is recorded.
- `P2-G1-VER4`:
  - [x] Required resolution is implemented.
  - [x] Required proof passes.
  - [x] Change evidence is recorded.
  - [x] Verification evidence is recorded.

**Group checks after remediation (at `0f636be`):**

- `bun test src/core/features/bases` → 120 pass, 0 fail, 9 files.
- `bun run check` → Biome, `tsc`, and `knip` clean. 954 pass, 0 fail, 3.7 s.
- `bun run test:ci` → 166 pass, 0 fail, 24 files, 32.4 s. `pgrep -fl 'bin/so|src/app/main.ts|bun test|index-worker|bench'` found no process before or after.
- Constraints:
  - `git diff main -- package.json bun.lock .github/workflows` is empty.
  - The added lines contain no work-process identifiers.
  - `KANBAN_TYPE` is still `undefined`.
  - `src/core/features/bases` imports no `core/state`.
  - No `.base` write was added.

**Self-review of the remediation diff (`228dd1b..0f636be`, 8 files, +151/−26):**

- The changes are limited to the four findings, and each commit maps to one finding.
- Alfred's ported evaluator cases are unchanged and pass.
- Initial deviation 11 is now resolved by `0f636be`.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all tasks committed, all four verification findings `Fixed`, and every check passes.
- **Final report commit:** returned to the orchestrator.
- **Final commits:**
  - Initial: `3ee3aa0`, `0b133d0`, `bd43e23`, `834a5e5`, `9b3e0d4`.
  - Remediation: `c5ea0d2` (VER1), `f3eaf30` (VER2), `ce27d62` (VER3), `0f636be` (VER4).
- **Final checks:**
  - `bun run check` → 954 pass.
  - `bun run test:ci` → 166 pass.
  - `bun test src/core/features/bases` → 120 pass.
- **Remaining issues:** V30 `Pending — user fixture`.
