# W26100423LX Plan Part 2 — Bases

## Status

`Ready`

## Objective

This part delivers `.base` files as keyboard-driven table and Kanban views over the index:

- **Engine:** a port of Alfred's Bases parser, expression evaluator, and evaluator at `5fde89b0`, with Obsidian's `inFolder`/`hasTag` semantics, single-quoted strings, `filter_hides_rows` diagnostics, Obsidian-rejection warnings, and the 15 default summaries.
- **Index facts:** candidates expose every `file.*` field (including `size` and `ctime`) for notes and other files; `.obsidian/types.json` drives property types.
- **Views:** table and Kanban view models; a `BaseLayoutRegistry` that falls back to a table with a notice; `KANBAN_TYPE` stays `undefined`, so only the test-only `kanban-test` type reaches the board.
- **Editor kind:** `.base` opens as file type and editor kind `base` by registration only, in a read-only buffer that is never written, with keys that never reach vim.
- **Write-back:** cell edits and card moves change exactly one frontmatter key, through `applyBufferEdits` for open notes or a stale-checked `patchFrontmatter` effect for closed notes.
- **Surfaces:** `BaseView` paints the table and board per the accepted M6@R1 states in color, `NO_COLOR`, light, and 80×24.

Part 3 consumes the view model, layouts, and painters for base embeds.

## Coverage Summary

- **System Design:** `W26100423LX-REQ7@R2, REQ8@R2, REQ9@R2, REQ10@R2, REQ12@R1, REQ13@R1 → DES9–DES14 → S11–S17, S19, S22, S24 → V20–V33, V26a, V35–V37, V40–V42, V45` (V30 recorded `Pending — user fixture`; V34 and V34b were delivered in P1-G1-T4)
- **UI Design:** `RM261003ABZP-UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`; `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` (focused Base cell, focused Kanban card) — realized by V27, V29, V40, V45

## Sources

- Plan index: `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-index.md`
- Plan context: `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-context.md`
- System design: `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-system-design.md`
- UI design: `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-design.md` (parent, `Ready for Planning`) — Surface: Bases views (line 948), Component: Toast stack (1671), Base table (1828), Kanban board (1904), Theme (1978); accepted mockup RM261003ABZP-M6@R1
- System requirements: `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-requirements.md`
- UI requirements: `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-requirements.md` (parent) — UREQ9@R1 (line 151), UREQ11@R1 (line 184)
- Port source: Alfred at `/Users/hieunguyen/git/hieu/projects/alfred`, commit `5fde89b0` — `packages/vault/src/domain/bases/{types,parser,expression,evaluator}.ts` and `__tests__/`, `packages/view-model/src/base/board.ts`

## Dependencies

- Part 1, completed and verified. Part 2 consumes:
  - `patchFrontmatter`, `frontmatterValue`, `FrontmatterValue`, `FrontmatterPatch` (P1-G1-T4);
  - `localDateTime`, `formatDate`, `addDays` (P1-G1-T1, T2);
  - `openPath(…, opts)` and `fillRestored` with `then` (P1-G2-T2), which gain `subpath` here;
  - `PickerSource` and `pickerSources` (P1-G2-T4), which gain `baseViews` here;
  - the `createNote` runner-case pattern (P1-G2-T2) for `patchFrontmatter`;
  - the notes registrations in `registries()`/`testRegistries` (P1-G2-T2), which this part extends.
- Cross-work gate G3 (satisfied at `9adb285`); see each group's Cross-Work Gates.

## Execution Flow

```text
P2-G1: Bases engine and index facts → P2-G2: Base editor kind, write-back, and view
```

## Groups

Every delegated agent (implementer, verifier, remediator) reads and follows `.s1mple/S1MPLE.md` and its required references: `docs/communication.md`, `docs/project.md`, and `docs/languages/typescript.md`. Delegated agents do not use the native `Explore` subagent; they inspect directly.

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command. Do not request separate permission.

- Commit each task after its checks and self-review pass, and before the next task starts.
- Commit subjects follow Conventional Commits (`feat(bases): …`); each body carries the task ID and its exact plan title.
- Task commits are checkpoints, not group acceptance.
- If a task needs no change, record no-change evidence instead of making an empty commit.

Rules for planned code:

- No work-process identifiers (W, REQ, DES, S, V, UV, phase, goal, or task IDs) in code, comments, identifiers, test names, or log messages.
- `src/core/features/bases` is pure and never imports `core/state`; only `features/bases` and `lang/markdown` import `yaml`.
- No `.base` special case outside `src/core/features/bases` and test fixtures (V20); `.base` files are never written.
- `KANBAN_TYPE` stays `undefined`; the board is reachable only through `kanban-test` in `testRegistries`.
- The expression subset gains no function or operator; only the documented `inFolder`, `hasTag`, and quote corrections.
- Shared contract files gain only this part's variants and registrations; the tree type-checks after every task (`Action`, `Effect`, and overlay switches are exhaustive).
- No new dependency; `package.json` and `bun.lock` stay unchanged.
- Agents that run PTY tests or benches check for orphan `so`/`bun` processes first and kill every process they start.

### P2-G1 — Bases engine and index facts

#### Goal

Pure Bases logic is complete and proven at the unit level: the ported engine evaluates Alfred's fixtures with Obsidian's corrected semantics and diagnostics, summaries match Obsidian's 15 defaults, candidates carry every `file.*` field from the index (now with `size`, `ctime`, and non-note file facts), property types follow `types.json` then Obsidian inference, and table and Kanban models honor `groupOrder` with a layout registry that keeps Kanban unreachable until the fixture exists.

#### Coverage Summary

- **System Design:** `REQ7@R2, REQ8@R2, REQ9@R2 → DES9, DES10, DES12 → S11–S16 → V21, V22, V23, V24, V26, V26a, V28, V30 (pending), V31, V32, V33`
- **UI Design:** `None`

#### Scope

- Included:
  - `src/core/features/bases/{types,parser,expression,evaluator,summaries,property-types,candidates,table,kanban,views}.ts` and their tests;
  - `NoteSummary` `size`/`ctime`, `summarize(path, facts, scan, lines?)`, `NoteIndex.facts`, `buildIndex`/`applySummaries` facts, `FromWorker.batch.facts`, worker `walk`/`summarizeFile`/`changed`, `readTextFile.createdMs`, `TextFile.createdMs`, `onIndexBatch` facts;
  - `src/workspace/property-types.ts`, `IndexState.types`, `readPropertyTypes` effect and runner case, `propertyTypesLoaded` action and `onPropertyTypesLoaded`, the after-first-frame dispatch in `main()`;
  - `test/boundaries.test.ts` `PACKAGE_HOMES.yaml`;
  - fixtures `test/fixtures/bases/{alfred/*.base,group-order.base,README.md}`, `test/fixtures/workspace/tasks.base`, `test/fixtures/workspace/tasks/*.md`.
- Excluded: editor kind, window state, commands, write-back, UI (P2-G2); embeds (Part 3); setting `KANBAN_TYPE`.
- Main files: `src/core/features/bases/*`, `src/core/features/links/{summarize,note-index}.ts`, `src/core/state/{index,types,update}.ts`, `src/workspace/{fs,index-worker,property-types}.ts`, `src/app/{effects,main}.ts`, `test/boundaries.test.ts`, `test/fixtures/bases/*`, `test/fixtures/workspace/{tasks.base,tasks/*.md}`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ7@R2 → DES9 → S11 → V21, V23` | None | Ported cases pass; `inFolder` includes subfolders; `hasTag` any argument and nested tags; `'todo'` equals `"todo"` |
| `REQ7@R2 → DES9 → S13 → V24` | None | Formula diagnostic keeps other columns; `filter_hides_rows` names the filter with zero rows; two rejection warnings; legacy column sort; parse error and no rows |
| `REQ8@R2 → DES9 → S14 → V26a` | None | 15 default summaries match the documented results; custom → `summary_unsupported` and an empty cell |
| `REQ7@R2 → DES10 → S12 → V22` | None | Every `file.*` field for notes and an image fact; an open buffer's scan overrides properties |
| `REQ8@R2 → DES10 → S15 → V28` | None | `types.json` assignment wins when the value validates; Obsidian inference otherwise; malformed shapes → `{}` |
| `REQ8@R2 → DES9, DES12 → S14 → V26` | None | Table columns in order, sort, grouping exactly per `groupOrder` with `None` last and hidden values absent |
| `REQ9@R2 → DES12 → S16, S17 → V31, V32` | None | Lanes per `groupOrder` or distinct values DESC plus `None`; typed numeric keys; formula/`file.*` grouping → `movable: false` with `why` |
| `REQ9@R2 → DES9 → S16 → V33, V30` | None | `cards` and `kanban` resolve to the table with notices while `KANBAN_TYPE` is unset; `kanban-test` resolves to the board after registration; V30 recorded pending with the README provenance slot |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G3 — DI2 outputs for DI4 (plan context §2; `rm261003abzp-roadmap-phase-2-obsidian-experience.md:70`): NoteIndex paths and frontmatter in summaries | Before P2-G1-T3 changes `NoteSummary`/`NoteIndex` | Satisfied — `9adb285` (PR #2); `NoteSummary` and `NoteIndex` match `summarize.ts:18-30` and `note-index.ts:7-18` as cited by the design before editing | RM261003ABZP-DI4@R2 — W26100423LX |

#### Tasks

##### P2-G1-T1 — Ported Bases engine with Obsidian corrections

- **Outcome:** `parseBase`, `evaluateExpression`, and `evaluateBase` are ported from Alfred with the three corrections, the two parser warnings, legacy `sort[].column`, and `filter_hides_rows`; `KANBAN_TYPE` is exported as `undefined`; `yaml` is declared home in `src/core/features/bases/`.
- **System Design:** `REQ7@R2 → DES9 → S11, S13 → V21, V23, V24`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `Base`, `BaseEvaluation`, `BaseCandidate` — Data Model; §7 `src/core/features/bases/types.ts, parser.ts, expression.ts, evaluator.ts, summaries.ts` (all but `summaries.ts`), `test/boundaries.test.ts`; research RF3, RF4
- **Files:** `src/core/features/bases/{types,parser,expression,evaluator}.ts` and `{parser,expression,evaluator}.test.ts`; `test/fixtures/bases/alfred/*.base`; `test/boundaries.test.ts` — `PACKAGE_HOMES.yaml`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V21`, `V23`, `V24`:** port Alfred's `parser`, `expression`, and `evaluator` unit tests to `bun:test` (behavior names, no IDs) over `test/fixtures/bases/alfred/*`, updating `inFolder`/`hasTag` expectations to Obsidian semantics; add the V23 and V24 cases.

   **Preview:**

   ```ts
   test("inFolder matches the folder and its subfolders", () => { /* file.inFolder("Projects") on Projects/2026/a.md → true */ });
   test("hasTag matches any argument and nested tags", () => { /* hasTag("a","b") on #b and on #a/x → both rows */ });
   test("single- and double-quoted strings compare equal", () => { /* status == 'todo' rows === status == "todo" rows */ });
   test("an unsupported filter hides its rows with a diagnostic", () => {
     // global filter status.contains('x') → rows [] and one { code: "filter_hides_rows", message names the filter }
   });
   test("views Obsidian rejects still render with warnings", () => { /* view without name; groupBy "status" string → 2 warnings */ });
   ```

   - Run `bun test src/core/features/bases` and confirm failure because the modules do not exist.

2. **GREEN:** the port per §7, plus the boundary declaration.

   **Preview:**

   ```ts
   // types.ts
   export const KANBAN_TYPE: string | undefined = undefined; // doc comment per §7 points to test/fixtures/bases/README.md
   // expression.ts
   case "inFolder": { const f = String(arg0).replace(/\/+$/, ""); return folder === f || folder.startsWith(`${f}/`); }
   case "hasTag": return args.some((t) => tags.some((x) => x === norm(t) || x.startsWith(`${norm(t)}/`)));
   // evaluator.ts
   export function evaluateBase(input: { base: Base; candidates: readonly BaseCandidate[]; view?: string; ui?: BaseUi }): BaseEvaluation;

   // test/boundaries.test.ts
   yaml: ["src/core/lang/markdown/", "src/core/features/bases/"],
   ```

   - Evaluation never throws; parsing fails only for invalid YAML. No function or operator is added.

3. **REFACTOR:** Align ported names with `so` conventions (e.g. `parseBaseSource` → `parseBase`) without behavior change.

   **Preview:**

   ```ts
   // allowed: renames and import paths; prohibited: widening the expression subset or keeping Alfred-only exports knip flags
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): port the Bases engine with Obsidian semantics

   Task: P2-G1-T1 — Ported Bases engine with Obsidian corrections
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V21`, `V23`, `V24` — `bun test src/core/features/bases/{parser,expression,evaluator}.test.ts` → all pass
- Boundaries — `bun test test/boundaries.test.ts` → passes with the new `yaml` home

##### P2-G1-T2 — Obsidian default summaries

- **Outcome:** `summarize(name, values)` returns Obsidian's documented result for each of the 15 `DEFAULT_SUMMARIES` and a `summary_unsupported` diagnostic for custom formulas.
- **System Design:** `REQ8@R2 → DES9 → S14 → V26a`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7 `src/core/features/bases/types.ts, parser.ts, expression.ts, evaluator.ts, summaries.ts` (`summaries.ts`)
- **Files:** `src/core/features/bases/summaries.ts` — `DEFAULT_SUMMARIES`, `summarize`; `summaries.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V26a`:** one table-driven case per summary name over a fixture column (numbers, dates, checkboxes, blanks), and `"values.filter(…)"`.

   **Preview:**

   ```ts
   test("default summaries match Obsidian's documented results", () => {
     // Average [1,2,3,4] → 2.5; DateRange → days between earliest and latest; Unique → count; Empty/Filled; Checked/Unchecked …
   });
   test("custom summary formulas are reported as unsupported", () => { /* → { diagnostic: { code: "summary_unsupported" } } */ });
   ```

   - Run `bun test src/core/features/bases/summaries.test.ts` and confirm failure.

2. **GREEN:** `summaries.ts` per §7.

   **Preview:**

   ```ts
   export const DEFAULT_SUMMARIES = ["Average","Min","Max","Sum","Range","Median","Stddev","Earliest","Latest","DateRange","Checked","Unchecked","Empty","Filled","Unique"] as const;
   export function summarize(name: string, values: readonly BaseCell[]): BaseCell | { diagnostic: BaseDiagnostic } { /* one case per name */ }
   ```

   - Date arithmetic uses `core/time`; no process time zone dependence.

3. **REFACTOR:** Group numeric and date reducers.

   **Preview:**

   ```ts
   // allowed: private numbers(values)/dates(values) helpers; prohibited: new summary names
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): add Obsidian default summaries

   Task: P2-G1-T2 — Obsidian default summaries
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V26a` — `bun test src/core/features/bases/summaries.test.ts` → all pass

##### P2-G1-T3 — File facts in the index

- **Outcome:** note summaries carry `size` and `ctime`; the worker stats non-note files into `facts` during the walk and on change; `NoteIndex.facts` holds non-Markdown files only; `readTextFile` reports `createdMs`.
- **System Design:** `REQ7@R2 → DES10 → S12 → V22` (index side; the candidate assertions run in P2-G1-T4)
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `NoteSummary.size/ctime`, `NoteIndex.facts` — Data Model; §7 `src/core/features/links/summarize.ts, note-index.ts; src/workspace/index-worker.ts; src/core/state/index.ts`, `src/workspace/fs.ts` (`readTextFile.createdMs`), `src/core/state/types.ts` (`TextFile.createdMs`)
- **Files:** `src/core/features/links/summarize.ts` — `NoteSummary`, `summarize`; `src/core/features/links/note-index.ts` — `NoteIndex.facts`, `FileFacts`, `buildIndex`, `applySummaries`; `src/workspace/index-worker.ts` — `walk`, `summarizeFile`, `changed`, `FromWorker.batch.facts`; `src/workspace/fs.ts` — `readTextFile`; `src/core/state/types.ts` — `TextFile.createdMs`; `src/core/state/index.ts` — `onIndexBatch`, `summarizeSaved`, `summarizeWritten`; tests `src/core/features/links/note-index.test.ts`, `src/workspace/index-worker.test.ts`, `src/workspace/fs.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V22` (index side):** worker test: a workspace with `a.md` and `img.png` yields a summary with `size`/`ctime` and a fact for `img.png` only; a changed non-note path produces an updated fact; `note-index.test.ts`: `facts` never holds a Markdown path; `fs.test.ts`: `readTextFile` returns `createdMs`.

   **Preview:**

   ```ts
   test("the index carries size and created time for notes and facts for other files", async () => {
     // batch.summaries[0] has size and ctime; batch.facts == [{ path: "img.png", size, mtime, ctime }]
   });
   test("file facts never include Markdown notes", () => { /* buildIndex(summaries, files, facts).facts has no ".md" key */ });
   ```

   - Run `bun test src/workspace/index-worker.test.ts src/core/features/links src/workspace/fs.test.ts` and confirm the new cases fail.

2. **GREEN:** the signature and message changes per §7, updating every `summarize` caller.

   **Preview:**

   ```ts
   export type NoteSummary = { /* existing */ size: number; ctime: number };
   export function summarize(path: string, facts: { mtime: number; size: number; ctime: number }, scan: DocScan, lines?: …): NoteSummary;
   // worker: summarize(path, { mtime: r.stamp.mtimeMs, size: r.stamp.size, ctime: r.createdMs ?? r.stamp.mtimeMs }, …)
   // walk(): non-note → stat → { path, size, mtime, ctime: birthtimeMs || mtimeMs }
   ```

   - `summarizeSaved`/`summarizeWritten` pass the same facts shape; existing link-index behavior and tests stay green.

3. **REFACTOR:** None beyond keeping the facts type in `note-index.ts`.

   **Preview:**

   ```ts
   // allowed: export type FileFacts from note-index.ts; prohibited: extra stat calls for notes
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(index): carry file size, created time, and non-note facts

   Task: P2-G1-T3 — File facts in the index
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V22` (index side) — `bun test src/workspace/index-worker.test.ts src/core/features/links src/workspace/fs.test.ts` → all pass
- Index host — `bun test test/integration/index-host.test.ts src/app/index-host.test.ts` → passes unchanged

##### P2-G1-T4 — Candidates and property types

- **Outcome:** `candidatesFrom(ix, overlay)` yields one candidate per indexed file with every `file.*` field and open-buffer property overrides; `propertyType` applies `types.json` then Obsidian inference; `readPropertyTypes` reads `.obsidian/types.json` into `IndexState.types` through a `readPropertyTypes` effect dispatched after the first frame and a `propertyTypesLoaded` action.
- **System Design:** `REQ7@R2, REQ8@R2 → DES10 → S12, S15 → V22, V28`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `PropertyTypes` / `IndexState.types`, `readPropertyTypes` / `propertyTypesLoaded` — Message; §7 `src/core/features/bases/property-types.ts, candidates.ts`, `src/workspace/property-types.ts`, `src/app/effects.ts` (`readPropertyTypes` case), `src/core/state/types.ts` (`IndexState.types`, action and effect), `src/app/main.ts and test/support/state.ts` (after-first-frame dispatch); research RF5
- **Files:** `src/core/features/bases/{candidates,property-types}.ts` and tests; `src/workspace/property-types.ts`; `src/core/state/types.ts`; `src/core/state/index.ts` — `onPropertyTypesLoaded`; `src/core/state/update.ts` — route `propertyTypesLoaded`; `src/app/effects.ts`; `src/app/main.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V22`, `V28`:** `candidates.test.ts` (an index with notes and an image fact; an overlay with a dirty note's scan) and `property-types.test.ts` (`{ Status: "number" }` with `"x"` and `3`; inference for date, datetime, number, checkbox, list, text, tags, aliases; malformed JSON shapes → `{}`).

   **Preview:**

   ```ts
   test("candidates expose every file field for notes and other files", () => { /* file.name, path, folder, ext, size, ctime, mtime, tags, links … */ });
   test("an open buffer's properties override the indexed summary", () => { /* overlay scan status "doing" wins */ });
   test("an assigned type applies only when the value validates", () => {
     expect(propertyType("Status", "x", { status: "number" })).toBe("text");
     expect(propertyType("Status", 3, { status: "number" })).toBe("number");
   });
   ```

   - Run `bun test src/core/features/bases/{candidates,property-types}.test.ts` and confirm failure.

2. **GREEN:** pure modules, adapter, state wiring per §7.

   **Preview:**

   ```ts
   export function candidatesFrom(ix: NoteIndex, overlay: ReadonlyMap<string, DocScan>): BaseCandidate[];
   export function propertyType(name: string, value: unknown, types: PropertyTypes): PropertyType { /* §7 */ }
   export function parsePropertyTypes(json: unknown): PropertyTypes;

   // workspace/property-types.ts — never throws; any error → {}; malformed logs bases.typesInvalid in the runner
   export async function readPropertyTypes(root: string): Promise<PropertyTypes>;
   // effects.ts
   case "readPropertyTypes":
     void readPropertyTypes(d.root).then((types) => d.dispatch({ type: "propertyTypesLoaded", types }));
     return;
   // main(): after the first frame, beside the watcher and worker → runner.run({ kind: "readPropertyTypes" })
   ```

   - `IndexState.types` starts as `{}`; `PersistedState` is unchanged.

3. **REFACTOR:** Keep `validates(type, value)` shared for P2-G2's `validateCell`.

   **Preview:**

   ```ts
   // allowed: export validates from property-types.ts; prohibited: reading types.json in core
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): build candidates and Obsidian property types

   Task: P2-G1-T4 — Candidates and property types
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V22`, `V28` — `bun test src/core/features/bases/{candidates,property-types}.test.ts` → all pass

##### P2-G1-T5 — Table and Kanban models and the layout registry

- **Outcome:** `tableModel` and `kanbanModel` build render-ready models honoring `groupOrder` (RF2); `BaseLayoutRegistry.resolve` returns the table with a notice for unsupported types; the fixtures for table, board, and group order exist; `test/fixtures/bases/README.md` holds the empty provenance slot for the Obsidian ≥ 1.14.3 Kanban fixture, and V30 is recorded pending.
- **System Design:** `REQ8@R2, REQ9@R2 → DES9, DES12 → S14, S16, S17 → V26, V31, V32, V33, V30 (pending)`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `BaseLayout` / `BaseLayoutRegistry` — Contract, `TableModel` / `KanbanModel` — Data Model; §7 `src/core/features/bases/table.ts, kanban.ts, views.ts`; Migration and Delivery (Feature Flags); research RF1, RF2
- **Files:** `src/core/features/bases/{table,kanban,views}.ts` and tests; `test/fixtures/bases/group-order.base`; `test/fixtures/bases/README.md`; `test/fixtures/workspace/tasks.base` (table view `All tasks`, a status-grouped view, a formula-grouped view, a `cards` view); `test/fixtures/workspace/tasks/*.md` (status, due, done properties with comments)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V26`, `V31`, `V32`, `V33`:** `table.test.ts` (tasks fixture order, sort, grouping; `group-order.base` with `[todo, doing, done, null]` and a hidden value), `kanban.test.ts` (no `groupOrder` → distinct DESC plus `None`; with `groupOrder` incl. empty lanes; numeric lane keys; group by `formula.late` and `file.folder` → `movable: false`, `why`), `views.test.ts` (`resolve("cards")`, `resolve("kanban")` with `KANBAN_TYPE` unset → table + notice; `resolve("kanban-test")` after `register` → board).

   **Preview:**

   ```ts
   test("groups follow groupOrder exactly with None last and hidden values absent", () => { /* V26 */ });
   test("numeric lanes keep typed keys so moves write numbers", () => { /* lane.key === 3, not "3" */ });
   test("boards grouped by a formula or file field cannot move cards", () => { /* movable false, why "formula" | "file" */ });
   test("unsupported view types fall back to a table with a notice", () => {
     expect(reg.resolve("cards").notice).toBe("cards view is not supported yet; showing a table");
   });
   ```

   - Run `bun test src/core/features/bases/{table,kanban,views}.test.ts` and confirm failure.

2. **GREEN:** models, registry, and fixtures per §7.

   **Preview:**

   ```ts
   export function tableModel(e: BaseEvaluation, ui: BaseUi, types: PropertyTypes): TableModel;
   export function kanbanModel(e: BaseEvaluation, ui: BaseUi): KanbanModel; // rules ported from Alfred board.ts:29-129
   export class BaseLayoutRegistry {
     constructor(fallback: BaseLayout);
     register(type: string, layout: BaseLayout): void;
     resolve(type: string): { layout: BaseLayout; notice?: string };
   }
   export const tableLayout: BaseLayout; export const boardLayout: BaseLayout;
   ```

   ```text
   test/fixtures/bases/README.md
   └── Provenance slot: Obsidian version, installer, OS, date, steps, no community Kanban plugin — empty until the user supplies obsidian-kanban.base
   ```

   - `KANBAN_TYPE` stays `undefined`; date cells format through `formatDate`.

3. **REFACTOR:** Keep fallback-notice text in `views.ts` only.

   **Preview:**

   ```ts
   // allowed: shared group-key helper between table and kanban; prohibited: any second place producing the fallback notice
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): add table and board models with a layout registry

   Task: P2-G1-T5 — Table and Kanban models and the layout registry
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V26`, `V31`, `V32`, `V33` — `bun test src/core/features/bases/{table,kanban,views}.test.ts` → all pass
- `V30` — inspect `test/fixtures/bases/README.md` and `KANBAN_TYPE` → slot present, no fixture, `KANBAN_TYPE === undefined`; record `Pending — user fixture`

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Bases unit suites (V21–V24, V26, V26a, V28, V31–V33) | `bun test src/core/features/bases` | All pass |
| Index and worker suites | `bun test src/core/features/links src/workspace` | All pass, existing cases unchanged |
| Fast gate and boundaries | `bun run check` | Passes in under 30 s; `yaml` home declared; `features/bases` imports no `core/state` |
| Kanban gate (V30) | `rg -n "KANBAN_TYPE" src` | Only the `undefined` declaration and its readers; V30 recorded `Pending — user fixture` |
| Work-process identifiers | `rg -n "W26100423LX\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b" src/core/features/bases src/workspace/property-types.ts test/fixtures/bases` | No match |

#### Review and Verification Focus

- **Specification:** Obsidian semantics for `inFolder`, `hasTag`, quotes, summaries, `groupOrder`, and property typing (RF1–RF5); diagnostics instead of silent empty views; no subset widening; Kanban unreachable while `KANBAN_TYPE` is unset.
- **Technical:** Port fidelity (Alfred tests pass with documented changes only); purity and package homes; `summarize` signature change applied to every caller; worker stats only non-notes; `ix.facts` never holds a Markdown path; typed lane keys; `readPropertyTypes` never throws.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P2-G2 — Base editor kind, write-back, and view

#### Goal

Opening a `.base` file shows a keyboard-driven, read-only table or board in its own window view: the file is never written, keys never reach vim, the view waits for the index and re-evaluates without losing focus, sort/group/filter overrides stay in memory, and cell edits and card moves change exactly one frontmatter key on open or closed notes with stale writes refused — all matching the accepted M6@R1 states.

#### Coverage Summary

- **System Design:** `REQ7@R2, REQ8@R2, REQ9@R2, REQ10@R2, REQ12@R1, REQ13@R1 → DES11, DES12, DES13, DES14 → S11, S13–S17, S19, S22, S24 → V20, V25, V27, V29, V35, V36, V37, V40, V41, V42, V45`
- **UI Design:** `RM261003ABZP-UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`; `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1`

#### Scope

- Included:
  - `FileType.readOnly`, `EditorKindSpec.open(path, text, subpath?)`, `features/bases/file-type.ts`;
  - `BufferState.readOnly`, `WindowState.content.kindState`/`subpath`, restore-pending `subpath`, `onFileLoaded`, `writable`/`writeBuffer`, `syncEditorKinds`, `bindingOrVim`, `openPath` `subpath` option, `fillRestored` `subpath`;
  - `Registries.layouts`, `base-model.ts`, `base-commands.ts`, `base-write.ts`, `routeKey` cell edit, `pickerSources.baseViews`;
  - `patchFrontmatter` effect, `frontmatterPatched` action, runner case, routing;
  - `WindowView`, `EditorView implements WindowView`, `WindowTree` typing, `BaseView`, `paintBaseTable`, `paintBaseBoard`;
  - `registries()`/`main()`/`testRegistries` base registrations (`kanban-test` in tests only);
  - `test/integration/bases-write.test.ts`, `test/ui/bases.golden.test.ts`.
- Excluded: `Registries.embedModels`, `baseEmbedModel`, `paintBaseEmbed`, `baseEmbedRenderer`, `goTo`/`followLink` subpath (Part 3); setting `KANBAN_TYPE`.
- Main files: `src/core/filetypes/registry.ts`, `src/core/features/bases/file-type.ts`, `src/core/state/{types,update,keys,save,buffers,session,picker,base-model,base-commands,base-write}.ts`, `src/core/state/{base-model,base-commands,base-write}.test.ts`, `src/app/{effects,main}.ts`, `src/ui/editors/{registry,text-view,base-view}.ts`, `src/ui/views/window-tree.ts`, `src/ui/widgets/base.ts`, `test/support/state.ts`, `test/integration/bases-write.test.ts`, `test/ui/bases.golden.test.ts`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ7@R2 → DES11 → S11, S13 → V20, V25` | None | `.base` reaches kind `base` only by registration; no key reaches vim; `:w` and recreate refused with "read-only file" |
| `REQ12@R1 → DES11, DES12 → S22 → V41, V42` | None | Waiting state, re-evaluation keeping focus path, view fallback, version-1 state restore at the first view; memo hit with no relevant change |
| `REQ10@R2 → DES13 → S19 → V35, V37` | None | Open note: one undo step, autosave, diff toast; closed note: one `patchFrontmatter`; result updates index or toasts the failure |
| `REQ8@R2 → DES12 → S14, S15 → V27, V29` | `UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1` | `s`/`g`/`f` change only `kindState`; read-only explanation on derived cells; typed editing with `Ctrl-a`/`Ctrl-x`, inline error, `Esc` restore |
| `REQ9@R2, REQ10@R2 → DES12, DES13 → S17, S19 → V36` | `UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1` | Card move on a closed note changes only the status line and keeps its comment; an external change first → refused, file unchanged |
| `REQ13@R1 → DES14 → S16, S17, S24 → V40, V45` | `UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`; `UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` | Table and board goldens at 80×24 in color, `NO_COLOR`, light; waiting and empty states; `⊘ moves off` and the cards fallback notice; hardware cursor on the focused cell/card |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G3 — DI2 outputs for DI4 (plan context §2; `rm261003abzp-roadmap-phase-2-obsidian-experience.md:70`): `FileTypeRegistry` and `editorViews`, the `write` effect | Before P2-G2-T1 (file type and kind registration) and P2-G2-T5 (`editorViews`) | Satisfied — `9adb285` (PR #2); `registry.ts:16-19,35-43` and `ui/editors/registry.ts:5-9` match the design's current shapes before editing | RM261003ABZP-DI4@R2 — W26100423LX |

#### Tasks

##### P2-G2-T1 — Read-only base file type and editor-kind state

- **Outcome:** `.base` resolves to file type and editor kind `base` by registration; its buffer is `readOnly` and never written; `syncEditorKinds` creates `kindState` through `EditorKindSpec.open(path, text, subpath)` and emits `readPropertyTypes` for a newly created base window; non-text windows drop unbound keys instead of running vim; `openPath` and restore carry `subpath`.
- **System Design:** `REQ7@R2, REQ12@R1 → DES11 → S11, S13, S22 → V20, V25`
- **UI Design:** `None`
- **Canonical Shapes:** System design §5 Open a `.base` file; §6 `BaseWindowState`, `WindowState.content.kindState` / `subpath`, `FileType.readOnly` / `BufferState.readOnly`; §7 `src/core/filetypes/registry.ts and src/core/features/bases/file-type.ts`, `src/core/state/update.ts, keys.ts, save.ts, buffers.ts, session.ts, jumps.ts` (all but `jumps.ts`), `src/core/state/types.ts`
- **Files:** `src/core/filetypes/registry.ts`; `src/core/features/bases/file-type.ts` — `baseFileType`, `baseEditorKind`, `BaseWindowState`, `isBaseWindowState`; `src/core/state/types.ts` — `BufferState.readOnly`, `WindowState.content.kindState`/`subpath`, restore-pending `subpath`; `src/core/state/{update,keys,save,buffers,session}.ts`; `src/app/main.ts`, `test/support/state.ts` — register `baseFileType`, `baseEditorKind`; `src/core/state/base-commands.test.ts` (V25 cases)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V25`:** `src/core/state/base-commands.test.ts`: open `tasks.base` → window `editor: "base"` with `kindState.view` set; every printable key outside bindings → no text change and no effect; `:w` → "read-only file", no write effect; a deleted-on-disk base plus `:w` → no recreate.

   **Preview:**

   ```ts
   test("printable keys in a base window never edit the file or reach vim", () => { /* for each printable key: buffer text unchanged, effects [] */ });
   test(":w on a base file is refused as read-only and never recreates it", () => { /* message "read-only file"; no write effect */ });
   ```

   - Run `bun test src/core/state/base-commands.test.ts` and confirm failure.

2. **GREEN:** contracts, file type, kind, and state wiring per §7.

   **Preview:**

   ```ts
   // registry.ts
   open(path: string, text: string, subpath?: string): St;   // FileType: readOnly?: true
   // update.ts syncEditorKinds
   const content = spec === undefined ? { ...rest, editor } : { ...rest, editor, kindState: spec.open(b.path, fullText(b.text), subpath) };
   if (editor === "base") effects.push({ kind: "readPropertyTypes" });
   // keys.ts bindingOrVim
   if (activeWindow(s)?.content.editor !== "text") return none(setVim(s, { pending: [] }));
   // save.ts: writable → b.readOnly !== true; writeBuffer → "read-only file" before the recreate branch
   ```

   - Text windows are unchanged; `kindState` exists only when `editor !== "text"`; nothing outside `features/bases` tests the `.base` extension.

3. **REFACTOR:** None beyond keeping `syncEditorKinds` the single creator of kind state.

   **Preview:**

   ```ts
   // allowed: tidy destructuring; prohibited: creating kindState anywhere else
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): open base files read-only in their own editor kind

   Task: P2-G2-T1 — Read-only base file type and editor-kind state
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V25` — `bun test src/core/state/base-commands.test.ts` → all pass
- `V20` — `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` → no match
- Existing suites — `bun test src/core/state test/vim` → pass unchanged

##### P2-G2-T2 — Base view model with waiting state and memo

- **Outcome:** `baseViewModel(s, windowId, reg)` derives the window's model from the `.base` text, index, property types, dirty candidate buffers, and window state; memoizes on their identities; shows `waiting` until the first batch; keeps focus on `focus.path`; falls back to the first view; `Registries.layouts` and `viewContexts.register("base", …)` are wired, with `kanban-test` registered in `testRegistries` only.
- **System Design:** `REQ12@R1 → DES11, DES12 → S22 → V41, V42`
- **UI Design:** `None`
- **Canonical Shapes:** System design §5 Base re-evaluation; §7 `src/core/state/base-model.ts` (`BaseViewModel`, `baseViewModel`, `baseViewContext`), `src/app/main.ts and test/support/state.ts` (layouts part)
- **Files:** `src/core/state/base-model.ts`; `src/core/state/update.ts` — `Registries.layouts`; `src/app/main.ts` — `BaseLayoutRegistry(tableLayout)`, conditional `KANBAN_TYPE` registration, `viewContexts.register("base", …)`; `test/support/state.ts` — mirror plus `layouts.register("kanban-test", boardLayout)`; `src/core/state/base-model.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V41`, `V42`:** idle empty index → `status: "waiting"`; batch arrives → `"ok"` with rows; a candidate note changes → focus row follows the same path; `.base` text renames the selected view → first view; a version-1 state file with a base window restores at the first view; two frames with no relevant change and a keystroke in an unrelated non-candidate buffer → the identical model object.

   **Preview:**

   ```ts
   test("a base window waits for the index, then keeps focus on the same note", () => { /* V41 */ });
   test("frames without a relevant change reuse the same model", () => {
     const a = baseViewModel(s, id, reg); const b = baseViewModel(afterUnrelatedKey(s), id, reg);
     expect(b).toBe(a);
   });
   ```

   - Run `bun test src/core/state/base-model.test.ts` and confirm failure.

2. **GREEN:** `base-model.ts` and wiring per §7.

   **Preview:**

   ```ts
   export function baseViewModel(s: AppState, windowId: WindowId, reg: Registries): BaseViewModel | undefined {
     // key { text, version, ix, types, dirty signature, ui }; hit → model; waiting; parseError; evaluateBase; reg.layouts.resolve; focus by path
   }
   // registries(): const layouts = new BaseLayoutRegistry(tableLayout); if (KANBAN_TYPE !== undefined) layouts.register(KANBAN_TYPE, boardLayout);
   ```

   - The memo map is keyed by window (and later by embed key in Part 3); no model is stored in `AppState`.

3. **REFACTOR:** Isolate `dirtyNoteSignature(s)` and `overlayOf(s)` helpers.

   **Preview:**

   ```ts
   // allowed: private helpers reused by Part 3's embed model; prohibited: storing the model in state
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): derive and memoize base view models

   Task: P2-G2-T2 — Base view model with waiting state and memo
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V41`, `V42` — `bun test src/core/state/base-model.test.ts` → all pass

##### P2-G2-T3 — Frontmatter write-back

- **Outcome:** `writeProperty` edits an open note through `applyBufferEdits` (one undo step, autosave, diff toast) or emits a `patchFrontmatter` effect for a closed note; the runner re-reads inside the serial queue, refuses when the key no longer holds the shown value, patches, writes with the read stamp, logs `bases.patched`/`bases.patchFailed` with the path only, and answers `frontmatterPatched`; `onFrontmatterPatched` updates the index and toasts the diff, or toasts the failure.
- **System Design:** `REQ10@R2 → DES13 → S19 → V35, V37`
- **UI Design:** `RM261003ABZP-UREQ9@R1 → UDES9@R1` (visible write-back: `− status: todo` / `+ status: doing` toast)
- **Canonical Shapes:** System design §5 Cell edit (write part), Failure and Recovery Rules; §6 `patchFrontmatter` / `frontmatterPatched` — Message; §7 `src/core/state/base-write.ts`, `src/app/effects.ts` (`patchFrontmatter` case), `src/core/state/types.ts` (action and effect)
- **Files:** `src/core/state/base-write.ts` — `writeProperty`, `onFrontmatterPatched`; `src/core/state/types.ts` — `frontmatterPatched` action, `patchFrontmatter` effect; `src/core/state/update.ts` — route `frontmatterPatched`; `src/app/effects.ts` — `run` case `patchFrontmatter`; `src/core/state/base-write.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V35`, `V37`:** a note open and dirty elsewhere in its body → buffer edited with one undo entry, autosave scheduled, diff toast; the same note closed → one `patchFrontmatter` effect with the expected value; `frontmatterPatched` ok → index summary updated and toast `"- status: todo / + status: doing"`; failed → error toast, index unchanged.

   **Preview:**

   ```ts
   test("a property change on an open note is one undo step and keeps unsaved edits", () => { /* V35 open */ });
   test("a property change on a closed note is sent to the write queue with the shown value", () => {
     // effects == [{ kind: "patchFrontmatter", path, patch: { set: "status", value: "doing" }, expected: "todo" }]
   });
   test("a refused patch leaves the index at the disk value", () => { /* V37 failed */ });
   ```

   - Run `bun test src/core/state/base-write.test.ts` and confirm failure.

2. **GREEN:** `base-write.ts`, contracts, routing, and the runner case per §7.

   **Preview:**

   ```ts
   export function writeProperty(s: AppState, path: string, patch: FrontmatterPatch, expected: FrontmatterValue | undefined, now: number, reg: Registries): Result { /* §7 */ }
   export function onFrontmatterPatched(s: AppState, a: Extract<Action, { type: "frontmatterPatched" }>): Result { /* §7 */ }

   case "patchFrontmatter":
     void serial(async () => {
       // read (refused → fail "not readable"); frontmatterValue ≠ expected → fail "changed on disk"
       // patchFrontmatter → write(path, restoreFile(cur, r.text), cur.stamp); ownOps; index.notify; log path; dispatch ok
     });
     return;
   ```

   - Mirrors the existing `applyEdits` case (path following, read stamp, own-op tracking); no note text in logs.

3. **REFACTOR:** Share the diff-toast formatter with P2-G2-T4's move feedback.

   **Preview:**

   ```ts
   // allowed: export diffToast from base-write.ts; prohibited: a second write path that bypasses the serial queue
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): write one property back to open or closed notes

   Task: P2-G2-T3 — Frontmatter write-back
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V35`, `V37` — `bun test src/core/state/base-write.test.ts` → all pass

##### P2-G2-T4 — Base commands, cell editor, and card moves

- **Outcome:** base-scoped commands and bindings (`h j k l i x s g f v <Tab> 1–4 H L <CR>`) navigate, toggle sort/group/filter in `kindState` only, switch views (incl. the `baseViews` picker), run the typed cell editor routed before bindings, toggle checkboxes, and move cards by writing the group property (removing it for `None`); boards with formula or `file.*` grouping refuse moves with an explanation toast.
- **System Design:** `REQ8@R2, REQ9@R2, REQ10@R2 → DES12, DES13 → S14, S15, S17, S19 → V27, V29, V36`
- **UI Design:** `RM261003ABZP-UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`
- **Canonical Shapes:** System design §5 Cell edit, Kanban card move; §7 `src/core/state/base-commands.ts`, `src/core/state/picker.ts` (`baseViews`), `src/core/state/update.ts, keys.ts, …` (`routeKey` cell-edit branch)
- **Files:** `src/core/state/base-commands.ts` — `baseCommands`, `baseBindings`, `cellEditKey`, `moveCard`, `commitCellEdit`, `toggleCheckbox`, `validateCell`; `src/core/state/keys.ts` — `routeKey` sends keys to `cellEditKey` while `kindState.edit` is set; `src/core/state/picker.ts` — `pickerSources.baseViews`; `src/app/main.ts`, `test/support/state.ts` — register `baseCommands`, `baseBindings`; `src/core/state/base-commands.test.ts`; `test/integration/bases-write.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V27`, `V29`, `V36`:** unit cases (`s`, `g`, `f` → `kindState` changes only, no effect touches `tasks.base`; `i` on `file.name` and formula cells → read-only explanation; number cell `Ctrl-a` ×2 + `Enter` → `writeProperty` value 5 from 3; date `Ctrl-x` → previous day; `"abc"` in a number → `edit.error`, no effect; `Esc` → edit dropped; board `H`/`L` into `None` → remove patch; formula board `L` → explanation toast, no write) and integration (`bases-write.test.ts`: move a card on a closed note → only the status line changes and its comment stays, `bases.patched` logged; change the note on disk first → `frontmatterPatched ok:false "changed on disk"`, file unchanged, view shows the disk value).

   **Preview:**

   ```ts
   test("sort, group, and filter toggles never touch the base file", () => { /* V27 */ });
   test("number and date cells step with Ctrl-a and Ctrl-x and reject invalid text", () => { /* V29 */ });
   test("moving a card on a closed note changes only its status line", async () => { /* V36 first case */ });
   test("a card move after an external edit is refused and the file is unchanged", async () => { /* V36 second case */ });
   ```

   - Run `bun test src/core/state/base-commands.test.ts test/integration/bases-write.test.ts` and confirm the new cases fail.

2. **GREEN:** commands, bindings, cell editor, moves, routing, and the picker source per §7.

   **Preview:**

   ```ts
   const base = (mode: Mode) => ({ mode, filetype: "base" }) as const;
   export const baseBindings: readonly Binding[] = [{ scope: base("normal"), seq: "j", id: "base.down" }, /* … */ { scope: base("normal"), seq: "L", id: "base.moveRight" }];
   function moveCard(c: CommandContext, step: -1 | 1): Result { /* §7: movable? lane ± step; null → remove; else set typed key */ }
   function validateCell(type: PropertyType, value: string): { ok: true; value: FrontmatterValue } | { ok: false; error: string };
   // keys.ts routeKey: active base window with kindState.edit → cellEditKey(s, a, reg)
   ```

   - Commands read the derived model and change only `kindState` or call `writeProperty`; no command writes the `.base` buffer; V25 stays green.

3. **REFACTOR:** Table-drive the binding list; keep explanation strings beside `moveCard`.

   **Preview:**

   ```ts
   // allowed: binding table helper; prohibited: base-specific branches in generic key routing beyond the cell-edit check
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(bases): add base commands, cell editing, and card moves

   Task: P2-G2-T4 — Base commands, cell editor, and card moves
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V27`, `V29`, `V25` — `bun test src/core/state/base-commands.test.ts` → all pass
- `V36` — `bun test test/integration/bases-write.test.ts` → all pass; log line `bases.patched` carries the path only

##### P2-G2-T5 — Window views by interface and the Bases view

- **Outcome:** `editorViews` produce `WindowView`s; `EditorView` implements it unchanged; `BaseView` paints the toolbar, table or board, and hints from the view model, placing the hardware cursor on the focused cell or card; `paintBaseTable` and `paintBaseBoard` draw only inside their rect; `main()` registers the `base` editor view; goldens prove the table, board, waiting, empty, `⊘ moves off`, and cards-fallback states.
- **System Design:** `REQ8@R2, REQ9@R2, REQ13@R1 → DES14 → S16, S17, S24 → V40, V45`
- **UI Design:** `RM261003ABZP-UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`; `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1`
- **Canonical Shapes:** System design §6 `WindowView` — Contract; §7 `src/ui/editors/registry.ts, text-view.ts, window-tree.ts, base-view.ts, src/ui/widgets/base.ts` (all but `paintBaseEmbed`), `src/app/main.ts` (`registerEditorView("base")`); parent UI design Component: Base table (line 1828), Kanban board (1904), Toast stack (1671), Theme (1978); mockup M6@R1
- **Files:** `src/ui/editors/registry.ts` — `WindowView`, `editorViews`; `src/ui/editors/text-view.ts` — `implements WindowView`; `src/ui/views/window-tree.ts` — views typed `WindowView`; `src/ui/editors/base-view.ts` — `BaseView`; `src/ui/widgets/base.ts` — `paintBaseTable`, `paintBaseBoard`; `src/app/main.ts` — `registerEditorView("base", …)`; `test/ui/bases.golden.test.ts` and snapshots
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V40`, `V45`:** `test/ui/bases.golden.test.ts` with `mountShell`, `testRegistries` (incl. `kanban-test`), and `tasks.base` plus its notes seeded through `indexBatch` and `fileLoaded`.

   **Preview:**

   ```ts
   for (const v of variants /* 80×24 color, NO_COLOR, light */) {
     test(`table with a focused cell matches the ${v.name} golden`, async () => { /* snapshot; cursor on the focused cell */ });
     test(`board with a focused card matches the ${v.name} golden`, async () => { /* kanban-test view; cursor on the card */ });
   }
   test("waiting and empty states match their goldens", async () => { /* before indexBatch; a filter with no rows */ });
   test("toolbar notices explain disabled moves and the cards fallback", async () => { /* "⊘ moves off"; "cards view is not supported yet; showing a table" */ });
   ```

   - Run `bun test test/ui/bases.golden.test.ts` and confirm failure because no `base` editor view is registered.

2. **GREEN:** the interface, view, painters, and registration per §7 and the parent components.

   **Preview:**

   ```ts
   export type WindowView = Renderable & { show(s: AppState, id: WindowId, r: Rect, split: boolean): void; cursor(): Cursor | undefined };
   export const editorViews = new Map<string, (ctx: RenderContext, deps: ViewDeps) => WindowView>();
   export class BaseView extends Renderable implements WindowView { /* show → deps.reg.viewContexts.build("base", s, id, host); renderSelf → toolbar · table | board · hints */ }
   export function paintBaseTable(buf: OptimizedBuffer, rect: Rect, m: TableModel, focus?: …): void;
   export function paintBaseBoard(buf: OptimizedBuffer, rect: Rect, m: KanbanModel, focus?: …): void;
   // main(): registerEditorView("base", (ctx, deps) => new BaseView(ctx, deps));
   ```

   - Painters read models only and draw nothing outside the rect, so Part 3's embed painter can reuse them; text-view behavior and goldens are unchanged.

3. **REFACTOR:** Share column-width and truncation helpers between the two painters.

   **Preview:**

   ```ts
   // allowed: private layout helpers in widgets/base.ts; prohibited: state changes in UI code
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes, including the new golden snapshots.

   **Commit message:**

   ```text
   feat(ui): paint base tables and boards in their own window view

   Task: P2-G2-T5 — Window views by interface and the Bases view
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V40`, `V45` — `bun test test/ui/bases.golden.test.ts` → goldens match; `NO_COLOR` output has no truecolor or 256-color SGR codes; focused cell/card distinguishable by attribute or glyph
- Existing goldens — `bun test test/ui` → unchanged

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Base state suites (V25, V27, V29, V35, V37, V41, V42) | `bun test src/core/state/base-model.test.ts src/core/state/base-commands.test.ts src/core/state/base-write.test.ts` | All pass |
| Write-back integration (V36) | `bun test test/integration/bases-write.test.ts` | All pass; comment kept; stale write refused |
| Bases goldens (V40, V45) | `bun test test/ui/bases.golden.test.ts` | Goldens match in color, `NO_COLOR`, light, 80×24 |
| `.base` isolation (V20) | `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` | No match |
| Kanban gate | `rg -n "kanban-test" src` | No match (test registries only) |
| Fast gate | `bun run check` | Passes in under 30 s |
| Full suites | `bun run test:ci` (check for orphan processes first; kill any started) | All pass; existing goldens unchanged |
| Registration mirror | Compare `registries()` and `testRegistries()` | Same base registrations; `testRegistries` adds only `kanban-test` |

#### Review and Verification Focus

- **Specification:** `.base` never written (save gate, recreate path); no vim in non-text windows; overrides in memory only; one-key writes with comments preserved; stale closed-note writes refused and open-buffer edits applied in one undo step; moves refused for derived grouping; M6@R1 states with visible write feedback and explained restrictions under `NO_COLOR`/light/80×24.
- **Technical:** `syncEditorKinds` as the single creator of kind state; memo keyed on identities (no per-keystroke re-evaluation); exhaustive switches; serial-queue writes with read stamps and own-op tracking; `WindowView` widening changes no text-view behavior; painters confined to their rect; no `.base` special case outside `features/bases`.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ7@R2 → DES9 → S11, S13 → V21, V23, V24` | None | `P2-G1` | `P2-G1-T1` |
| `REQ8@R2 → DES9 → S14 → V26a` | None | `P2-G1` | `P2-G1-T2` |
| `REQ7@R2 → DES10 → S12 → V22` | None | `P2-G1` | `P2-G1-T3`, `P2-G1-T4` |
| `REQ8@R2 → DES10 → S15 → V28` | None | `P2-G1` | `P2-G1-T4` |
| `REQ8@R2, REQ9@R2 → DES9, DES12 → S14, S16, S17 → V26, V31, V32, V33` | None | `P2-G1` | `P2-G1-T5` |
| `REQ9@R2 → DES9 → S16 → V30` (pending user fixture) | None | `P2-G1` | `P2-G1-T5` |
| `REQ7@R2, REQ12@R1 → DES11 → S11, S13, S22 → V20, V25` | None | `P2-G2` | `P2-G2-T1` |
| `REQ12@R1 → DES11, DES12 → S22 → V41, V42` | None | `P2-G2` | `P2-G2-T2` |
| `REQ10@R2 → DES13 → S19 → V35, V37` | `UREQ9@R1 → UDES9@R1` | `P2-G2` | `P2-G2-T3` |
| `REQ8@R2, REQ9@R2, REQ10@R2 → DES12, DES13 → S14, S15, S17, S19 → V27, V29, V36` | `UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1` | `P2-G2` | `P2-G2-T4` |
| `REQ8@R2, REQ9@R2, REQ13@R1 → DES14 → S16, S17, S24 → V40, V45` | `UREQ9@R1 → UDES9@R1 → US7@R1 via UV8@R1`; `UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` | `P2-G2` | `P2-G2-T5` |
| G3 — DI2 outputs (satisfied `9adb285`) | None | `P2-G1`, `P2-G2` | `P2-G1-T3`, `P2-G2-T1`, `P2-G2-T5` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.

Outputs consumed by later parts:

- `baseViewModel` memo and helpers (`dirtyNoteSignature`, `overlayOf`) — Part 3's `baseEmbedModel` keys the same memo by path and subpath.
- `Registries.layouts`, `BaseLayoutRegistry.resolve` — embed models resolve layouts the same way.
- `paintBaseTable`, `paintBaseBoard` — Part 3's `paintBaseEmbed` reuses them at embed size.
- `EditorKindSpec.open(…, subpath)`, `WindowState.content.subpath`, `openPath` `subpath` option, restore-pending `subpath` — Part 3's `goTo`/`followLink` pass the embed subpath.
- `test/fixtures/workspace/tasks.base` and `tasks/*.md` — Part 3's `tour.md` embed, V46 goldens, and bench seeding.
- `KANBAN_TYPE` and the README slot — V30 remains pending for delivery reporting.

## Planning Gaps

None.
