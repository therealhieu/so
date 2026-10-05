# P2-G1 Verification Report

## Scope

- **Group:** `P2-G1` — Bases engine and index facts
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p2-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p2-g1-implementation-report.md` (commit `9cc9e5a`)

Verified range: `6906b65..9b3e0d4` (task commits `3ee3aa0`, `0b133d0`, `bd43e23`, `834a5e5`, `9b3e0d4`), inspected and run at `HEAD` `9cc9e5a` on `feat/rm261003abzp-di4-daily-notes-and-bases` with a clean tree. Baseline: `git merge-base HEAD main` = `main` = `d398ad7`. Port source: Alfred `5fde89b0`.

## Status

`Failed`

All five tasks are implemented, every assigned check passes, and every binding constraint holds. One Major finding remains: groups and Kanban lanes with numeric values sort as text, so lanes `2, 9, 10` show as `10, 2, 9`, which breaks the "distinct values in `groupBy.direction` order" invariant (S16, V31). Three Minor findings also need resolution. V30 is `Pending — user fixture` by design and is not a failure.

## Assigned Traceability

- **System Design:** `W26100423LX-REQ7@R2, REQ8@R2, REQ9@R2 → DES9, DES10, DES12 → S11, S12, S13, S14, S15, S16, S17 → V21, V22, V23, V24, V26, V26a, V28, V31, V32, V33; V30 recorded Pending — user fixture` (plan part 2, P2-G1 Coverage Summary and Traceability, lines 200 and 216–225)
- **UI Design:** `None`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ7@R2 → DES9 → S11 → V21` | None | Alfred's parser, expression, and evaluator tests pass on the port; only `inFolder`/`hasTag` and documented shape changes differ | `src/core/features/bases/{parser,expression,evaluator}.ts`. All 58 Alfred evaluator cases are ported by name. One case is replaced as documented ("evaluates rows for view types without a layout"). All 6 expression cases are ported. Of 9 parser cases, the 2 path-only cases are dropped because `Base.path` is removed. `diff -w` against Alfred `expression.ts` shows only the `hasTag`, `inFolder`, quote, and `normalizeTag` changes | `Satisfied` |
| `REQ7@R2 → DES9 → S11 → V23` | None | `inFolder` includes subfolders; `hasTag` any argument and nested; `'todo'` equals `"todo"` | `expression.ts:184-193` (`hasTag`, `inFolder`), `expression.ts:290-291,333-344` (quote-closed strings). `evaluator.ts` formula-dependency scan accepts `'` (lines 947, 959) | `Satisfied` |
| `REQ7@R2 → DES9 → S13 → V24` | None | Formula diagnostic keeps other columns; `filter_hides_rows` names the filter with zero rows; two rejection warnings; legacy `column` sort; parse error | `evaluator.ts:252-257` (`filter_hides_rows`), `parser.ts:88-100` (`view_name_missing`, `group_by_invalid`), `parser.ts:156-170` (legacy `column`), `parser.ts:26-39` (`{ ok: false, diagnostic }`). A failing child of a `not` filter shows rows while the diagnostic says they are hidden (VER2) | `Satisfied` |
| `REQ8@R2 → DES9 → S14 → V26a` | None | 15 default summaries; a custom formula gives `summary_unsupported` and an empty cell | `summaries.ts:4-20,105-144`; `table.ts:168-185` (empty cell plus diagnostic) | `Satisfied` |
| `REQ7@R2 → DES10 → S12 → V22` | None | Every `file.*` field for notes and other files; an open buffer's scan overrides properties | `summarize.ts` `size`/`ctime`; `note-index.ts` `FileFacts`, `NoteIndex.facts`, `patch`/`movePaths` facts; `index-worker.ts` `factsOf`, `walk`, `changed`; `fs.ts:88` `createdMs`; `index-host.ts:84` forwards `facts`; `candidates.ts:36-53`. A non-note file created in the explorer gets no facts (VER4) | `Satisfied` |
| `REQ8@R2 → DES10 → S15 → V28` | None | A `types.json` assignment wins when the value validates; otherwise Obsidian inference; malformed shapes give `{}` | `property-types.ts:48-107` (`validates(null)` = true, matching Obsidian's `null==t` rule in RF5); `workspace/property-types.ts:17-42`; `effects.ts:297-301`; `main.ts:336` inside the after-first-frame `setImmediate`; `state/index.ts` `onPropertyTypesLoaded`; `init.ts` `types: {}` | `Satisfied` |
| `REQ8@R2 → DES9, DES12 → S14 → V26` | None | Columns in order, sort, grouping exactly per `groupOrder` with None last and hidden values absent | `table.ts:66-94` (`orderedGroups`), `table.ts:118-195`. `total` and summaries still count rows in groups that `groupOrder` hides (VER3). Without `groupOrder`, numeric groups sort as text (VER1) | `Mismatch` |
| `REQ9@R2 → DES12 → S16, S17 → V31, V32` | None | Lanes follow `groupOrder` or distinct values in direction order plus None; typed numeric keys; formula/`file.*` grouping → `movable: false` with `why` | `kanban.ts:20-68`; `evaluator.ts:369-376` (`groupValue` keeps types). Lane order comes from `evaluator.ts:351`, which compares string keys, so numbers sort as text (VER1). `movable`/`why` are correct | `Mismatch` |
| `REQ9@R2 → DES9 → S16 → V33, V30` | None | `cards`/`kanban` resolve to the table with a notice while `KANBAN_TYPE` is unset; `kanban-test` resolves to the board after `register`; V30 pending with a README slot | `views.ts:27-47`; `types.ts:8` `KANBAN_TYPE = undefined`; `test/fixtures/bases/README.md` provenance table, no `obsidian-kanban.base` | `Satisfied` (V30 `Pending — user fixture`) |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| Orphan check (before and after) | None | None | `pgrep -fl 'bin/so\|src/app/main.ts\|bun test\|index-worker\|bench'` | No process before or after the runs | `Passed` |
| `V21`, `V23`, `V24` | `S11`, `S13` | `DES9` | `bun test src/core/features/bases` | 116 pass, 0 fail, 9 files | `Passed` |
| `V26a` | `S14` | `DES9` | same suite (`summaries.test.ts`) | Every name in `DEFAULT_SUMMARIES` is asserted; custom formula → `summary_unsupported` | `Passed` |
| `V22`, `V28` | `S12`, `S15` | `DES10` | same suite plus `bun test src/core/features/links src/workspace` | 85 pass, 0 fail, 16 files | `Passed` |
| `V26`, `V31`, `V32`, `V33` | `S14`, `S16`, `S17` | `DES9`, `DES12` | same suite (`table`, `kanban`, `views`) | Pass. V31's numeric case uses only one-digit keys (`1`, `3`), so it does not catch VER1 | `Insufficient` |
| `V30` | `S16` | `DES9` | Inspect `test/fixtures/bases/`, `types.ts:8`, `rg -n KANBAN_TYPE src` | README slot present; no `obsidian-kanban.base`; `KANBAN_TYPE` is only the `undefined` declaration plus readers in `parser.test.ts` and `views.test.ts` | `Passed` (recorded `Pending — user fixture`) |
| Index host and wiring | None | `DES10` | `bun test test/integration/index-host.test.ts src/app/index-host.test.ts src/app/effects.test.ts src/core/state/index.test.ts test/boundaries.test.ts` | 33 pass, 0 fail | `Passed` |
| Fast gate | None | `DES9`, `DES16` | `bun run check` | Biome clean on 288 files, `tsc` and `knip` clean, 949 pass, 0 fail, 4.3 s wall | `Passed` |
| Full suite | None | None | `bun run test:ci` | 165 pass, 0 fail, 24 files, 32 s | `Passed` |
| Edge probes | `S14`, `S16`, `S13` | `DES9`, `DES12` | Scratch script over `parseBase`/`evaluateBase`/`kanbanModel`/`tableModel` | Lanes for `p: 10, 9, 2` ASC → `[10, 2, 9, null]`; table DESC → `[9, 2, 10]`. `not: ["status.contains('t')"]` → 2 of 2 rows shown, but the message says rows are hidden. `groupOrder: [todo]` → 1 row shown, `total` 2, `Sum` 101 (counts the hidden row) | `Failed` |
| Package home and purity | None | `DES9` | `rg 'from "yaml"' src`; search `src/core/features/bases` for `core/state` imports | `yaml` is imported only by `features/bases/parser.ts` and `lang/markdown/*`; `PACKAGE_HOMES.yaml` declares both; bases imports no `core/state` | `Passed` |
| No work-process identifiers | None | None | `rg` for `W26100423LX\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P[0-9]-G[0-9]\|RF[0-9]` over the group's added lines and bases files and fixtures | No match | `Passed` |
| No subset widening | None | `DES9` | `diff -w` of Alfred `expression.ts` against the port | Only quote handling and the `hasTag`/`inFolder` semantics change; no function or operator added | `Passed` |
| `.base` isolation and no write | None | `DES9`, `DES11` | `rg '\.base\b' src/core/kernel src/core/state src/ui src/app` (non-test); search bases for writes | No match; bases performs no I/O | `Passed` |
| Dependencies | None | None | `git diff main -- package.json bun.lock` | Empty | `Passed` |
| `kanban-test` scope | None | `DES9` | `rg kanban-test src test` | Only in `features/bases/{kanban,views}.test.ts`; `testRegistries` is not touched yet (P2-G2) | `Passed` |
| G3 ordering and DI2 contracts | None | `DES10` | `git merge-base --is-ancestor`; `git show 6906b65:` of `note-index.ts`, `summarize.ts` | `fb86f9c` (goal records G3 `Satisfied`) precedes `bd43e23`; `9adb285` is an ancestor of `6906b65`. `NoteIndex` (`note-index.ts:5-18` at start) gains `facts`. `NoteSummary` gains `size`/`ctime`. `FromWorker.batch.facts` and `indexBatch.facts` are optional. `summarize`'s signature change is the design's own, and every caller is updated (`tsc` clean). No parent roadmap file changed in `6906b65..HEAD` | `Passed` |

## Findings

### P2-G1-VER1 — Major — Correctness — Numeric groups and lanes sort as text

- **System Design:** `W26100423LX-REQ8@R2, REQ9@R2 → DES9, DES12 → S14, S16 → V26, V31`
- **UI Design:** `None`
- **Evidence:** `buildGroups` orders groups by their string keys (`src/core/features/bases/evaluator.ts:351`):

  ```ts
  const comparison = compareValues(left.key, right.key);
  ```

  `orderedGroups` (`table.ts:80-93`) keeps that order when the view has no `groupOrder`. Probe: candidates with `p: 10, 9, 2` grouped `ASC` give lanes `[10, 2, 9, null]`, and `DESC` table groups give `[9, 2, 10]`. `kanban.test.ts` "numeric lanes keep typed keys" uses only `1` and `3`, so it passes.
- **Impact:** A board or grouped table by priority, estimate, or year shows columns out of numeric order. This breaks the design invariant "otherwise distinct values in `groupBy.direction` order plus `None` last" (§6 `TableModel` / `KanbanModel`) and REQ9's column rule.
- **Required resolution:** Order groups by their typed `value` with the existing typed comparison: numbers numerically, then booleans and strings as today. The None group stays last, and `groupOrder` behavior is unchanged.
- **Required proof:** A `kanban.test.ts` case with lanes `2, 9, 10` in `ASC` and `DESC`, and a `table.test.ts` grouped case with multi-digit numbers. `bun test src/core/features/bases` and `bun run check` pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G1-VER2 — Minor — Correctness — An unsupported filter under `not` shows rows while its diagnostic says they are hidden

- **System Design:** `W26100423LX-REQ7@R2 → DES9 → S13 → V24`
- **UI Design:** `None`
- **Evidence:** `matchesFilter` records any failing expression in `hiding` (`evaluator.ts:449`) and returns `false`. Under `not`, that `false` is inverted (`evaluator.ts:464-468`, `return !matches.some(Boolean)`), so the row is kept. Probe: `filters: { not: ["status.contains('t')"] }` over 2 notes → 2 rows shown, with the diagnostic `filter "status.contains('t')" is not supported; rows it guards are hidden`. §7 states "a diagnostic on a filter expression → row excluded + one diagnostic".
- **Impact:** The user is told rows are hidden when the opposite happened. The view shows rows Obsidian would filter out, with a misleading explanation. This is the "unflagged incompatibility" risk V24 names.
- **Required resolution:** Make the behavior match the message. Either a filter subtree with an unsupported expression excludes the row regardless of negation (the design's rule), or the diagnostic states what actually happened. Choose one and keep Alfred's ported NOT case passing.
- **Required proof:** An `evaluator.test.ts` case for `not: [<unsupported>]` that asserts the rows and the diagnostic text agree. `bun test src/core/features/bases` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G1-VER3 — Minor — Correctness — Table total and summaries count rows in groups `groupOrder` hides

- **System Design:** `W26100423LX-REQ8@R2 → DES9, DES12 → S14 → V26, V26a`
- **UI Design:** `None`
- **Evidence:** With `groupOrder`, `tableModel` emits only the listed groups' rows, but `total` is `e.rows.length` (`table.ts:192`) and summaries read every evaluated row (`table.ts:178`). Probe: `groupOrder: [todo]` with one `todo` row (`n: 1`) and one `done` row (`n: 100`) → `rows` 1, `total` 2, `Sum` `101`.
- **Impact:** The footer count and summary row disagree with the visible table. RF2 states "only those groups appear". Obsidian's exact summary scope for hidden groups is not documented, but the model contradicts itself either way.
- **Required resolution:** Compute `total` (distinct rows) and summaries over the rows the table shows. Alternatively, if hidden rows should count, document that choice and expose it in the model so painters do not show a mismatched count.
- **Required proof:** A `table.test.ts` case with a hidden group that asserts `total` and one summary. `bun test src/core/features/bases` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G1-VER4 — Minor — Data integrity — A non-note file created in the explorer never gets file facts

- **System Design:** `W26100423LX-REQ7@R2 → DES10 → S12 → V22`
- **UI Design:** `None`
- **Evidence:** `indexAfterFsOp` adds an explorer-created non-note path with `addFiles(ix, [op.from])` and no facts (`src/core/state/index.ts:96-104`). The runner's `create` case (`src/app/effects.ts:294-296`) does not notify the index worker, unlike `write`, `applyEdits`, and `createNote`. The watcher also ignores own operations, so `file.size`, `file.mtime`, and `file.ctime` stay `0` (shown as 1970) until another program touches the file or `so` restarts. The implementation report records this as remaining issue 11.
- **Impact:** This breaks the §6 invariant "every path in `ix.files` has either a summary or facts once indexed", and Bases shows wrong file fields and sorts by them.
- **Required resolution:** After a successful `create` of a file, the index learns its facts, for example through `d.index?.notify({ kind: "changed", path, isDir: false })` as the other write cases do.
- **Required proof:** An `effects.test.ts` (or index-host) case: after a file `create`, the index receives facts with the real size and times. `bun run check` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:** the ported Alfred engine cases and corrected semantics (V21, V23); diagnostics for formulas, unsupported filters, rejected views, legacy sort, and invalid YAML (V24); all 15 summaries plus empty and epoch-ms cases (V26a); candidates with every `file.*` field, the overlay override, and one candidate per file (V22); worker facts on scan and change, `createdMs`, and `facts` never holding Markdown paths across moves and removals (V22 index side); `types.json` validation, inference, malformed shapes, the adapter's missing/malformed reporting, the reducer, and the runner case (V28); table order, sort arrow, `groupOrder` with hidden and empty groups, summaries, and local time text (V26); lanes, typed keys, and `movable`/`why` (V31, V32); layout fallback and test-only board registration (V33).
- **Missing:**
  - Multi-digit numeric group order in `ASC` and `DESC` (VER1).
  - A `not` filter over an unsupported expression (VER2).
  - `total` and summaries with a hidden group (VER3).
  - Facts for an explorer-created non-note file (VER4).
  - `src/app/index-host.ts:84` forwarding `facts` into `indexBatch`. It is one line with no test. An index-host test should assert that a worker batch with `facts` reaches `indexBatch.facts`.

## Scope Changes

Each recorded deviation was checked against the governing sources:

- **Accepted.** These match the design or are needed for it:
  - The whole evaluator is ported, with five Alfred tests adapted. REQ7 requires the ported tests to pass; the test-name diff confirms every case is ported or replaced as documented.
  - The `parseBase` `{ ok, base } | { ok: false, diagnostic }` shape matches the design's `base.ok` usage.
  - `BaseUi` override semantics fit REQ8's in-memory `s`/`g`/`f`.
  - Diagnostics are deduplicated.
  - `tableModel` and `kanbanModel` keep `ui` but do not read it; `evaluateBase` applies the overrides once.
  - `selectedView.sort` is added so the table can show the header arrow.
  - Stddev is the population value, and DateRange is text. Obsidian's docs do not specify either; both are documented.
  - `readPropertyTypes(root, onInvalid?)` logs at `error` because the logger has no `warn`. This satisfies §7 "malformed logs `bases.typesInvalid` in the runner".
  - The `index-host.ts` forward, the `summarizeWritten` `Stamp`, and the mechanical caller updates in 12 test files and `test/support/notes.ts` are required for facts to reach state.
- **Process gap.** In T1, `parser.ts` was written before its tests, so the parser cases had no RED run. The tests now exist and pass; no code impact.
- **Open.** The explorer-created non-note facts gap (report item 11) is not accepted as-is; see VER4.

## Unverified Items

- Obsidian's real behavior for summaries over groups hidden by `groupOrder`, Stddev (population or sample), and the summary key Obsidian writes for the date range (`DateRange` follows the design). No Obsidian ≥ 1.14.3 file is available.
- V30 stays `Pending — user fixture` until the user supplies `obsidian-kanban.base` with provenance.
- Scan cost of the extra `stat` per non-note file: benches were not run in this group (perf gates do not block).

## Blockers

None
