# W26100423LX Plan Part 1 — Daily Notes and Templates

## Status

`Ready`

## Objective

This part delivers every daily-note and template behavior of RM261003ABZP-DI4@R2:

- **Pure foundations:** a Moment 2.29.4–exact formatter over local calendar fields, daily paths and parsing, Obsidian-exact template expansion, a comment-preserving text-level frontmatter patcher, and the `[daily]`/`[templates]` config sections.
- **Notes behavior:** `:Today`/`:Yesterday`/`:Tomorrow` and `<leader>nd` open or create the daily note through a never-overwrite `createNote` effect; `<leader>np` opens the calendar; `<leader>nt` inserts a template with a source-then-expansion preview in one undo step; `<leader>nn` creates a new note from a template and refuses an existing name.
- **Surfaces:** the calendar overlay and template picker render per the accepted M5@R2 states in color, `NO_COLOR`, light, and 80×24.

Part 2 consumes the frontmatter patcher, `core/time`, and the `createNote`/`noteCreated` precedent for its own serial-queue effect.

## Coverage Summary

- **System Design:** `W26100423LX-REQ1@R2, REQ2@R1, REQ3@R2, REQ4@R2, REQ5@R1, REQ6@R2 → DES1–DES8 → S1–S10 → V1–V19, V4a`; plus `W26100423LX-REQ10@R2 → DES8 → S18 → V34, V34b` (patcher unit cases; the write-back cases V35–V37 are Part 2); plus `W26100423LX-REQ13@R1 → DES5, DES6 → S24 → V10, V16` (notes goldens)
- **UI Design:** `RM261003ABZP-UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1`; `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` (calendar and template picker states) — realized by V10 and V16

## Sources

- Plan index: `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-index.md`
- Plan context: `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-context.md`
- System design: `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-system-design.md`
- UI design: `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-design.md` (parent, `Ready for Planning`) — Surface: Daily notes and templates (line 873), Component: Picker (1350), Prompt (1515), Toast stack (1671), Calendar (1743), Theme (1978); accepted mockup RM261003ABZP-M5@R2
- System requirements: `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-requirements.md`
- UI requirements: `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-requirements.md` (parent) — UREQ8@R2 (line 135), UREQ11@R1 (line 184)

## Dependencies

- None within this work. The baseline is `main` at `d398ad7` (plan context §2, Roadmap Validation).
- Cross-work gate G3 (DI2 outputs, satisfied at `9adb285`) is consumed by P1-G2; see that group's Cross-Work Gates.

## Execution Flow

```text
P1-G1: Pure notes foundations → P1-G2: Notes state, I/O, and surfaces
```

## Groups

Every delegated agent (implementer, verifier, remediator) reads and follows `.s1mple/S1MPLE.md` and its required references: `docs/communication.md`, `docs/project.md`, and `docs/languages/typescript.md`. Delegated agents do not use the native `Explore` subagent; they inspect directly.

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command. Do not request separate permission.

- Commit each task after its checks and self-review pass, and before the next task starts.
- Commit subjects follow Conventional Commits (`feat(notes): …`, `test(notes): …`); each body carries the task ID and its exact plan title.
- Task commits are checkpoints, not group acceptance.
- If a task needs no change, record no-change evidence instead of making an empty commit.

Rules for planned code:

- No work-process identifiers (W, REQ, DES, S, V, UV, phase, goal, or task IDs) in code, comments, identifiers, test names, or log messages. Test names describe behavior, e.g. `test("a second :Today leaves the note unchanged")`.
- `src/core` stays pure; `core/time` and `core/features/notes` never import `core/state` (`test/boundaries.test.ts`).
- Shared contract files (`src/core/state/types.ts`, `update.ts`, `src/app/effects.ts`, `src/app/main.ts`, `test/support/state.ts`) gain only this part's variants and registrations; the tree type-checks after every task.
- No new dependency; `package.json` and `bun.lock` stay unchanged.
- Agents that run PTY tests or benches check for orphan `so`/`bun` processes first and kill every process they start.

### P1-G1 — Pure notes foundations

#### Goal

The pure modules every notes and Bases feature depends on exist with colocated unit tests: `core/time` formats Moment 2.29.4–exact strings and steps days across DST, `features/notes` computes daily paths and expands templates exactly as Obsidian, `frontmatter-patch` changes one key without disturbing any other byte, and the config schema accepts `[daily]` and `[templates]` with line-numbered errors.

#### Coverage Summary

- **System Design:** `REQ1@R2, REQ3@R2, REQ4@R2, REQ6@R2, REQ10@R2 → DES1, DES2, DES7, DES8 → S2, S6, S7, S8, S10, S18 → V1, V4, V4a, V11, V12, V13, V15, V19, V34, V34b`
- **UI Design:** `None`

#### Scope

- Included: `src/core/time/{local,format}.ts`; `src/core/features/notes/{daily,template}.ts`; `src/core/lang/markdown/frontmatter-patch.ts`; `src/core/config/schema.ts`; their colocated tests.
- Excluded: any `core/state`, adapter, or UI change; Bases engine use of the patcher (Part 2).
- Main files: `src/core/time/local.ts`, `src/core/time/local.test.ts`, `src/core/time/format.ts`, `src/core/time/format.test.ts`, `src/core/features/notes/daily.ts`, `src/core/features/notes/daily.test.ts`, `src/core/features/notes/template.ts`, `src/core/features/notes/template.test.ts`, `src/core/lang/markdown/frontmatter-patch.ts`, `src/core/lang/markdown/frontmatter-patch.test.ts`, `src/core/config/schema.ts`, `src/core/config/schema.test.ts`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1@R2 → DES1 → S2 → V4a` | None | `addDays` and `addMonthsClamped` never skip or repeat a day across DST; 2026-01-31 + 1 month → 2026-02-28 |
| `REQ3@R2 → DES1 → S6 → V11, V12` | None | Every supported token equals Moment 2.29.4 `en`; unsupported tokens stay whole; brackets and backslash escape |
| `REQ1@R2 → DES2 → S1, S2 → V1, V4` | None | `dailyPath` returns path and title for flat and subfolder formats; `parseDailyDate` round-trips and rejects non-daily paths |
| `REQ3@R2 → DES2 → S7 → V13` | None | Expansion matches Obsidian's two regexes, case-insensitive names, no trimming, one instant |
| `REQ4@R2 → DES8 → S8 → V15` | None | `mergeFrontmatter` unions lists, keeps scalars, appends new keys, creates a block when absent |
| `REQ10@R2 → DES8 → S18 → V34, V34b` | None | One-key patch keeps comments, order, quoting, CRLF, and body; `yamlScalar` quotes type-ambiguous text |
| `REQ6@R2 → DES7 → S10 → V19` | None | Defaults when absent; one line-numbered error per invalid path, empty format, or unknown key |

#### Cross-Work Gates

None — this group uses only pure core modules on the `d398ad7` baseline.

#### Tasks

##### P1-G1-T1 — Local calendar fields and day arithmetic

- **Outcome:** `src/core/time/local.ts` exports the local calendar types and day arithmetic, correct across month ends and DST transitions.
- **System Design:** `REQ1@R2, REQ2@R1 → DES1 → S2 → V4a`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `LocalDateTime` — Data Model; §7 `src/core/time/local.ts`
- **Files:** `src/core/time/local.ts` — `LocalDate`, `LocalDateTime`, `localDateTime`, `addDays`, `addMonthsClamped`, `withDate`, `daysInMonth`, `mondayIndex`; `src/core/time/local.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V4a`:** `src/core/time/local.test.ts` — `addDays` stepping ±1 through 2026-03-29 (EU DST) and 2026-11-01 (US DST) yields consecutive dates; `addMonthsClamped({2026,1,31}, 1)` equals `{2026,2,28}`; `localDateTime(ms)` reads the process-local fields.

   **Preview:**

   ```ts
   import { expect, test } from "bun:test";
   import { addDays, addMonthsClamped } from "./local";

   test("day steps across daylight-saving changes neither skip nor repeat a day", () => {
     // walk 2026-03-27..2026-04-01 and 2026-10-30..2026-11-03 with addDays(d, 1) and addDays(d, -1)
     // expect each consecutive pair to differ by exactly one calendar day
   });
   test("month steps clamp to the last day of a shorter month", () => {
     expect(addMonthsClamped({ year: 2026, month: 1, day: 31 }, 1)).toEqual({ year: 2026, month: 2, day: 28 });
   });
   ```

   - Run `bun test src/core/time/local.test.ts` and confirm failure because the module does not exist.

2. **GREEN:** `src/core/time/local.ts` — the symbols above, per §7.

   **Preview:**

   ```ts
   export type LocalDate = { year: number; month: number; day: number };
   export type LocalDateTime = LocalDate & { hour: number; minute: number; second: number; ms: number; weekday: number };
   export function addDays(d: LocalDate, n: number): LocalDate {
     // calendar arithmetic on Date.UTC fields, never on local epoch millis, so DST cannot shift the day
   }
   // localDateTime, addMonthsClamped, withDate, daysInMonth, mondayIndex per §7
   ```

   - Keep the module free of imports; `src/core/time` is already in `PURE_CORE`.

3. **REFACTOR:** Share one UTC-field helper between `addDays` and `addMonthsClamped` if both need it.

   **Preview:**

   ```ts
   // allowed: extract a private toUtc/fromUtc pair; prohibited: new exports beyond §7
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(time): add local calendar fields and day arithmetic

   Task: P1-G1-T1 — Local calendar fields and day arithmetic
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V4a` — `bun test src/core/time/local.test.ts` → all cases pass

##### P1-G1-T2 — Moment-subset date formatter

- **Outcome:** `formatDate(at, format)` tokenizes with Moment's full token table (longest match), honors brackets and backslash escapes, emits Moment 2.29.4 `en` output for supported tokens, and emits every other token whole.
- **System Design:** `REQ3@R2 → DES1 → S6 → V11, V12`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7 `src/core/time/format.ts`; research RF9 (greedy tokenization) and the research token table
- **Files:** `src/core/time/format.ts` — `MOMENT_TOKENS`, `formatDate`; `src/core/time/format.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V11`, `V12`:** `src/core/time/format.test.ts` — the §8 V11 matrix (2026-10-03T09:05 Saturday with every supported token; `h`/`hh`/`A`/`a` at 00:00, 00:30, 11:59, 12:00, 13:05, 23:59; `Do` for 1–31; `d` for Sun–Sat) and the V12 cases (`"YYYY-[W]ww"`, `"dd"`, `"Q"`, `"\\Y"`, `"[unclosed"`).

   **Preview:**

   ```ts
   test("formats every supported token as Moment does", () => {
     expect(formatDate(at(2026, 10, 3, 9, 5), "dddd, MMMM Do YYYY [at] h:mm A")).toBe("Saturday, October 3rd 2026 at 9:05 AM");
     // midnight: h "12", A "AM"; Do 11 → "11th", 22 → "22nd"; table-driven over the research strings
   });
   test("unsupported tokens stay whole instead of splitting into supported ones", () => {
     expect(formatDate(at(2026, 10, 3, 9, 5), "dd")).toBe("dd");
     // "YYYY-[W]ww" → "2026-Www"; "Q" → "Q"; "\\Y" → "Y"; "[unclosed" → the documented expected string
   });
   ```

   - Run `bun test src/core/time/format.test.ts` and confirm failure because `formatDate` does not exist.

2. **GREEN:** `src/core/time/format.ts` — `MOMENT_TOKENS`, `formatDate`.

   **Preview:**

   ```ts
   export const MOMENT_TOKENS: readonly string[] = [/* Moment's full token list, longest first, per §7 */];
   export function formatDate(at: LocalDateTime, format: string): string {
     // scan: "[...]" literal, "\\x" literal, else the longest MOMENT_TOKENS match;
     // supported token → its en output; unsupported token → emitted unchanged; other char → literal
   }
   ```

   - Supported set and outputs follow the research table exactly; nothing reads the process time zone.

3. **REFACTOR:** Keep the supported-token outputs in one lookup table.

   **Preview:**

   ```ts
   // allowed: a const record token → (at) => string; prohibited: locale support or new tokens beyond §7
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(time): add Moment-compatible date formatter

   Task: P1-G1-T2 — Moment-subset date formatter
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V11`, `V12` — `bun test src/core/time/format.test.ts` → all cases pass

##### P1-G1-T3 — Daily paths, date parsing, and template expansion

- **Outcome:** `dailyPath` and `parseDailyDate` compute and reverse daily-note paths for any configured format; `expandTemplate` reproduces Obsidian's `{{title}}`/`{{date}}`/`{{time}}` expansion with one instant; `BUILTIN_DAILY_TEMPLATE` is `# {{date}}`.
- **System Design:** `REQ1@R2, REQ3@R2 → DES2 → S1, S2, S7 → V1, V4, V13`
- **UI Design:** `None`
- **Canonical Shapes:** System design §7 `src/core/features/notes/daily.ts`, `src/core/features/notes/template.ts`; §6 `DailyConfig`, `TemplateVars`; research RF6, RF7
- **Files:** `src/core/features/notes/daily.ts` — `DailyConfig`, `dailyPath`, `parseDailyDate`; `src/core/features/notes/template.ts` — `TemplateVars`, `expandTemplate`, `BUILTIN_DAILY_TEMPLATE`; colocated `daily.test.ts`, `template.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V1`, `V4`, `V13`:** `daily.test.ts` covers the §8 V1 formats and folders and the V4 round-trips plus `"dddd"` and a non-daily path → `undefined`; `template.test.ts` covers the V13 string with title `"Meeting $&"`.

   **Preview:**

   ```ts
   test("daily paths follow the folder and a subfolder format", () => {
     expect(dailyPath({ folder: "daily", format: "YYYY/MM/YYYY-MM-DD", template: "" }, oct3))
       .toEqual({ path: "daily/2026/10/2026-10-03.md", title: "2026/10/2026-10-03" });
     // "YYYY-MM-DD"; "YYYY/MMMM/YYYY-MMM-DD"; folder "" has no leading "/"
   });
   test("expansion matches Obsidian including replacement patterns and one instant", () => {
     expect(expandTemplate("{{Title}} {{ title }} {{DATE:YYYY}} {{date: YYYY}} {{date:}} {{time}} {{weather}} {{date:x}}{{date:x}}",
       { title: "Meeting $&", at: at(2026, 10, 3, 9, 5) }))
       .toBe("Meeting $& {{ title }} 2026  2026 2026-10-03 09:05 {{weather}} xx");
   });
   ```

   - Run `bun test src/core/features/notes` and confirm failure because the modules do not exist.

2. **GREEN:** `daily.ts` and `template.ts` per §7.

   **Preview:**

   ```ts
   export function dailyPath(cfg: DailyConfig, d: LocalDate): { path: string; title: string } {
     // title = formatDate(withDate(midnight, d), cfg.format); path = join(folder, `${title}.md`) without a leading "/"
   }
   export function parseDailyDate(path: string, cfg: DailyConfig): LocalDate | undefined { /* §7 */ }
   export function expandTemplate(text: string, vars: TemplateVars): string {
     // Obsidian's two regexes copied exactly; replacement via a function so "$&" stays literal
   }
   ```

   - Import only `core/time`; never `core/state`.

3. **REFACTOR:** None beyond naming; keep regexes verbatim from §7.

   **Preview:**

   ```ts
   // allowed: local helpers; prohibited: trimming variable names or adding variables beyond title/date/time
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(notes): add daily paths and Obsidian template expansion

   Task: P1-G1-T3 — Daily paths, date parsing, and template expansion
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1`, `V4` — `bun test src/core/features/notes/daily.test.ts` → all cases pass
- `V13` — `bun test src/core/features/notes/template.test.ts` → all cases pass

##### P1-G1-T4 — Text-level frontmatter patcher

- **Outcome:** `frontmatter-patch.ts` reads, sets, removes, splits, and merges frontmatter by splicing `yaml` source ranges, so only edited lines change, and writes Obsidian-typed scalars.
- **System Design:** `REQ4@R2, REQ10@R2 → DES8 → S8, S18 → V15, V34, V34b`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `FrontmatterPatch` / `PatchResult` — Contract; §7 `src/core/lang/markdown/frontmatter-patch.ts`; research RF5, RF8
- **Files:** `src/core/lang/markdown/frontmatter-patch.ts` — `FrontmatterValue`, `FrontmatterPatch`, `PatchResult`, `patchFrontmatter`, `frontmatterValue`, `splitFrontmatter`, `mergeFrontmatter`, `yamlScalar`; `src/core/lang/markdown/frontmatter-patch.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V34`, `V34b`, `V15`:** the §8 cases: a fixture with comments, CRLF, quoted keys, and block lists (set existing scalar, set existing list, add key, remove middle key, remove last key, set on a note without frontmatter); `yamlScalar` typed values; `mergeFrontmatter` with and without an existing block.

   **Preview:**

   ```ts
   test("setting one key changes only that key's lines and keeps comments and CRLF", () => {
     const r = patchFrontmatter(FIXTURE_CRLF, { set: "status", value: "doing" });
     // expect r.ok; every line except the status line byte-equal to FIXTURE_CRLF; parse(r.text) equals input with status changed
   });
   test("removing the last key deletes the whole block", () => { /* "---\nk: v\n---\nbody" → "body" */ });
   test("text that would change type is quoted", () => {
     expect(yamlScalar("42", "")).toBe('"42"'); // "true", "null", "2026-10-05" quoted; 42, true, date unquoted; list → block
   });
   test("merging template properties unions lists and keeps the note's scalars", () => { /* tags [work, meeting]; status open; owner me appended */ });
   ```

   - Run `bun test src/core/lang/markdown/frontmatter-patch.test.ts` and confirm failure because the module does not exist.

2. **GREEN:** `frontmatter-patch.ts` per §7.

   **Preview:**

   ```ts
   export type FrontmatterValue = string | number | boolean | null | FrontmatterValue[];
   export type FrontmatterPatch = { set: string; value: FrontmatterValue } | { remove: string };
   export function patchFrontmatter(text: string, patch: FrontmatterPatch): PatchResult {
     // parseDocument(fm, { keepSourceTokens: true }); locate the top-level pair (exact, then case-insensitive)
     // set + pair → splice the value range (block sequences: the whole value region); set + absent → line before "---"
     // remove → delete the pair's lines; last key → delete the block; return edits, text, removed, added
   }
   // frontmatterValue, splitFrontmatter, mergeFrontmatter, yamlScalar per §7
   ```

   - `SpanEdit` comes from `src/core/features/links/rename.ts`; `yaml` stays in its existing `lang/markdown` home.

3. **REFACTOR:** Factor line-ending detection shared by insert and append paths.

   **Preview:**

   ```ts
   // allowed: private eol(text) helper; prohibited: re-stringifying the whole frontmatter object
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(markdown): add comment-preserving frontmatter patcher

   Task: P1-G1-T4 — Text-level frontmatter patcher
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V34`, `V34b`, `V15` — `bun test src/core/lang/markdown/frontmatter-patch.test.ts` → all cases pass

##### P1-G1-T5 — Daily and templates configuration

- **Outcome:** `ConfigSchema` accepts strict `[daily]` (`folder`, `format`, `template`) and `[templates]` (`folder`) with defaults and workspace-relative path validation.
- **System Design:** `REQ6@R2 → DES7 → S10 → V19`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `AppConfig.daily` / `AppConfig.templates` — Schema; §7 `src/core/config/schema.ts`
- **Files:** `src/core/config/schema.ts` — `ConfigSchema`, `workspacePath`; `src/core/config/schema.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V19`:** extend `schema.test.ts` with the §8 cases: absent sections → defaults (`daily`, `YYYY-MM-DD`, `templates/daily.md`, `templates`); `folder = "/abs"`, `template = "../x"`, `format = ""`, `templates.folder = "."` and `""`, and an unknown `[daily]` key → one line-numbered error each.

   **Preview:**

   ```ts
   test("daily and templates sections default when absent", () => {
     expect(parseConfig("").config.daily).toEqual({ folder: "daily", format: "YYYY-MM-DD", template: "templates/daily.md" });
   });
   test("paths outside the workspace are refused with their line", () => {
     // parseConfig('[daily]\nfolder = "/abs"\n').errors → [{ line: 2, … }]
   });
   ```

   - Run `bun test src/core/config/schema.test.ts` and confirm the new cases fail.

2. **GREEN:** `schema.ts` — `workspacePath` refinement and the two sections with `.prefault({})`, following the existing `preview` pattern.

   **Preview:**

   ```ts
   daily: z.strictObject({
     folder: workspacePath({ root: "allow" }).default("daily"),
     format: z.string().min(1).default("YYYY-MM-DD"),
     template: workspacePath({ root: "deny" }).default("templates/daily.md"),
   }).prefault({}),
   templates: z.strictObject({ folder: workspacePath({ root: "deny" }).default("templates") }).prefault({}),
   ```

   - Normalized paths have no trailing `/`; existing sections are untouched.

3. **REFACTOR:** None expected.

   **Preview:**

   ```ts
   // allowed: naming only; prohibited: changing existing sections or error formatting
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(config): add daily and templates sections

   Task: P1-G1-T5 — Daily and templates configuration
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V19` — `bun test src/core/config/schema.test.ts` → all cases pass

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Pure foundations unit suites (V1, V4, V4a, V11–V13, V15, V19, V34, V34b) | `bun test src/core/time src/core/features/notes src/core/lang/markdown/frontmatter-patch.test.ts src/core/config` | All pass |
| Fast gate and boundaries | `bun run check` | Passes; `core/time` and `features/notes` import no `core/state`; knip reports no unused export (new exports are used by tests or later tasks — mark only if knip flags them and record the reason) |
| Work-process identifiers | `rg -n "W26100423LX\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b" src/core/time src/core/features/notes src/core/lang/markdown/frontmatter-patch* src/core/config` | No match |

#### Review and Verification Focus

- **Specification:** Moment 2.29.4 strings exactly (RF9 greedy tokens, unsupported tokens whole); Obsidian expansion exactly (RF6: case-insensitive, whitespace-strict, `$&` literal, empty format → default, one instant); patcher touches only the edited key's lines (RF5 typing and quoting); config defaults and refusal of paths outside the workspace.
- **Technical:** Purity and layer rules; DST-safe arithmetic on calendar fields; `yaml` source-range splicing (no whole-object re-stringify); CRLF and BOM-free handling; deterministic tests with fixed instants; behavior-named tests.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P1-G2 — Notes state, I/O, and surfaces

#### Goal

Daily notes, the calendar, template insertion, and new notes work end to end through the store, the serial effect runner, and the shell: files are created only by `createExclusive`, existing files are never modified, and the calendar and template picker match the accepted M5@R2 states in color, `NO_COLOR`, light, and 80×24.

#### Coverage Summary

- **System Design:** `REQ1@R2, REQ2@R1, REQ4@R2, REQ5@R1, REQ13@R1 → DES2, DES3, DES4, DES5, DES6 → S1–S5, S8, S9, S24 → V2, V3, V5, V6, V7, V8, V9, V10, V14, V16, V17, V18`
- **UI Design:** `RM261003ABZP-UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1`; `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` — V10, V16

#### Scope

- Included:
  - state contracts for notes: `AfterOpen`, `CalendarState`, `Overlay.calendar`, `PromptState` union, `noteCreated` action, `createNote` effect, restore-pending `then`;
  - `openPath(…, opts?: { then })`, `fillRestored` applying `then`, `EX_ALIASES` additions, `createUpdate` routing of `noteCreated`, `routeKey` calendar case;
  - `note-commands.ts`, `calendar.ts`, picker `render`/`previewAlways`/`templates`/`newNoteTemplates`, `promptKey` new-note branch;
  - `createExclusive` and the `createNote` runner case (`readTextFile.createdMs` is Part 2);
  - `CalendarOverlay`, shell wiring, picker preview through `render`, prompt path preview;
  - `registries()` and `testRegistries` notes registrations; fixtures `test/fixtures/workspace/templates/{daily,meeting}.md`;
  - `test/integration/notes.test.ts`, `test/ui/notes.golden.test.ts`.
- Excluded: `subpath` on `openPath`/windows/restore (Part 2 and Part 3); `baseViews` picker source (Part 2); `patchFrontmatter`/`readPropertyTypes` effects (Part 2); any `.base` handling.
- Main files: `src/core/state/{types,buffers,session,commands,update,keys,picker,explorer,note-commands,calendar}.ts`, `src/core/state/{note-commands,calendar}.test.ts`, `src/workspace/{fs,fs.test}.ts`, `src/app/{effects,main}.ts`, `src/ui/overlays/{calendar,picker,prompt}.ts`, `src/ui/shell.ts`, `test/support/state.ts`, `test/fixtures/workspace/templates/{daily,meeting}.md`, `test/integration/notes.test.ts`, `test/ui/notes.golden.test.ts`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1@R2 → DES4 → S1, S3 → V2` | None | `:Today` with no indexed note emits one `createNote`; a case-variant indexed note is opened instead |
| `REQ1@R2 → DES4 → S4 → V8` | None | Created or existing daily note opens with the cursor on the first unchecked task; `insert` → Insert mode at EOF; unreadable template → error toast |
| `REQ1@R2, REQ5@R1 → DES3 → S1, S3 → V5, V3` | None | Real runner creates once; a second `:Today` and a racing or case-variant file leave bytes and mtime unchanged |
| `REQ1@R2 → DES3 → S3, S4 → V6` | None | Missing template → `# 2026-10-03`; binary template → empty note + error toast; read-only parent → `failed`, no temp file left |
| `REQ1@R2 → DES2, DES4 → S2 → V7` | None | `:Yesterday` from a subfolder daily note creates the previous day; log line `notes.created` carries the path only |
| `REQ2@R1 → DES5 → S5 → V9` | None | Calendar keys, month clamping, marks from the index, announcement, Enter → `openDaily` |
| `REQ2@R1, REQ13@R1 → DES5 → S5, S24 → V10` | `UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1`; `UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` | Calendar goldens at 80×24 in color, `NO_COLOR`, light; `•` and underline visible without color |
| `REQ4@R2 → DES6, DES8 → S8 → V14` | None | Template inserts whole at 1:1, else body at cursor plus merged properties, one undo entry |
| `REQ4@R2, REQ13@R1 → DES6 → S8, S24 → V16` | `UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1`; `UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` | Template picker preview shows source, `▸`, expansion at 120 cols; hidden at 90 until `Tab` |
| `REQ5@R1 → DES6, DES3 → S9 → V17, V18` | `UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1` | Title validation and path preview; `(blank note)` first; Insert mode at end; existing name → `E13` toast, nothing opened |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G3 — DI2 outputs for DI4 (plan context §2; `rm261003abzp-roadmap-phase-2-obsidian-experience.md:70`): the `Picker` with preview, the `Prompt`, NoteIndex paths and frontmatter in summaries, `FileTypeRegistry`/`editorViews`, the `search` and `write` effects | Before P1-G2 execution starts (consumed by P1-G2-T2, T4, T5) | Satisfied — DI2 merged as `9adb285` (PR #2); the implementer confirms `git merge-base HEAD main` still contains `9adb285` and that `PickerSource.preview`, `PromptState`, and `NoteIndex.summaries` exist at the plan-context-cited lines before editing | RM261003ABZP-DI4@R2 — W26100423LX |

#### Tasks

##### P1-G2-T1 — Exclusive file creation

- **Outcome:** `createExclusive(root, rel, text)` publishes a complete file through a private temp file plus `link()`, falls back to `open(target, "wx")` on file systems without hard links, never modifies an existing entry (including a case variant on a case-insensitive volume), and never leaves a temp file behind.
- **System Design:** `REQ1@R2, REQ5@R1 → DES3 → S3 → V3, V6` (primitive-level cases; the runner-level V3/V6 cases run in P1-G2-T2)
- **UI Design:** `None`
- **Canonical Shapes:** System design §5 Failure and Recovery Rules; §7 `src/workspace/fs.ts` (`createExclusive` only — `readTextFile.createdMs` is Part 2)
- **Files:** `src/workspace/fs.ts` — `createExclusive`; `src/workspace/fs.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V3`, `V6`:** extend the colocated `src/workspace/fs.test.ts` (real temp folder): creates missing parents and the full text with mode `0644`; an existing file → `{ created: false }` with bytes and mtime unchanged; a case variant on a case-insensitive volume (skip when the volume is case-sensitive) → `{ created: false }`; a read-only parent folder → throws; no `.so-new-` file remains in any case.

   **Preview:**

   ```ts
   test("exclusive create publishes the whole text and refuses an existing file", async () => {
     // createExclusive(dir, "daily/2026-10-03.md", "# x") → { created: true }; readFile === "# x"
     // second call → { created: false }; bytes and mtime unchanged; readdir shows no ".so-new-"
   });
   test("exclusive create fails cleanly in a read-only folder", async () => { /* chmod 0o555 parent → rejects; no temp file */ });
   ```

   - Run `bun test src/workspace/fs.test.ts` and confirm failure because `createExclusive` does not exist.

2. **GREEN:** `createExclusive` per §7.

   **Preview:**

   ```ts
   export async function createExclusive(root: string, rel: string, text: string): Promise<{ created: true; stamp: Stamp } | { created: false }> {
     // mkdir parents; tmp `.${base}.so-new-${pid}` "wx" 0o600 → write, sync, chmod 0o644, stat
     // link(tmp, target): EEXIST → { created: false }; EPERM|ENOTSUP|EXDEV → open(target, "wx") → write → sync → close (EEXIST → { created: false })
     // finally rm(tmp, { force: true })
   }
   ```

   - `createEntry` stays unchanged for the explorer.

3. **REFACTOR:** Reuse the module's existing stamp and error helpers.

   **Preview:**

   ```ts
   // allowed: share stamp construction with atomicWrite; prohibited: changing createEntry or atomicWrite behavior
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(workspace): add exclusive file creation with content

   Task: P1-G2-T1 — Exclusive file creation
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V3`, `V6` (primitive level) — `bun test src/workspace/fs.test.ts` → all cases pass; no temp file remains

##### P1-G2-T2 — Daily note open-or-create and placement

- **Outcome:** `note.today`/`note.yesterday`/`note.tomorrow` (`:Today`, `:Yesterday`, `:Tomorrow`, `<leader>nd`) open an indexed daily note (case-insensitively) or emit one `createNote`; the runner's `createNote` case reads and expands the template inside the serial queue, calls `createExclusive`, records the own op, notifies the index, logs `notes.created`/`notes.createFailed` with the path only, and answers `noteCreated`; `onNoteCreated` opens the note and places the cursor per `AfterOpen`; notes commands, bindings, and the `<leader>n` group are registered in `registries()` and mirrored in `testRegistries`.
- **System Design:** `REQ1@R2 → DES2, DES3, DES4 → S1, S2, S3, S4 → V2, V3, V5, V6, V7, V8`
- **UI Design:** `None`
- **Canonical Shapes:** System design §5 Daily note open or create; §6 `createNote` / `noteCreated` — Message, `AfterOpen` — State Model; §7 `src/core/state/types.ts` (`AfterOpen`, `noteCreated`, `createNote`, restore-pending `then`), `src/core/state/note-commands.ts`, `src/app/effects.ts` (`createNote` case), `src/core/state/update.ts, keys.ts, save.ts, buffers.ts, session.ts, jumps.ts` (only the `then` parts of `openPath` and `fillRestored`), `src/app/main.ts and test/support/state.ts`
- **Files:**
  - `src/core/state/types.ts` — `AfterOpen`, `Action` + `noteCreated`, `Effect` + `createNote`, restore-pending `then?`
  - `src/core/state/buffers.ts` — `openPath(s, path, now, opts?: { then?: AfterOpen })`
  - `src/core/state/session.ts` — `fillRestored` applies `then` through `placeAfterOpen`
  - `src/core/state/commands.ts` — `EX_ALIASES` + `Today`, `Yesterday`, `Tomorrow`
  - `src/core/state/update.ts` — route `noteCreated` → `onNoteCreated`
  - `src/core/state/note-commands.ts` — `noteCommands` (daily entries; `note.pickDate`, `template.insert`, `note.new` join in T3–T5), `noteBindings`, `noteGroups`, `openDaily`, `onNoteCreated`, `findPathInsensitive`, `placeAfterOpen`
  - `src/app/effects.ts` — `run` case `createNote`
  - `src/app/main.ts` — `registries()`; `test/support/state.ts` — `testRegistries` mirror
  - `src/core/state/note-commands.test.ts`; `test/integration/notes.test.ts`; `test/fixtures/workspace/templates/daily.md`, `test/fixtures/workspace/templates/meeting.md`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V2`, `V8`, `V5`, `V3`, `V6`, `V7`:** unit cases in `src/core/state/note-commands.test.ts` (`testRegistries`, fixed `now` 2026-10-03 09:05 local) and integration cases in `test/integration/notes.test.ts` (`tmpWorkspace`/`startApp` from `test/integration/helpers.ts`, `TZ=UTC`, fixed clock).

   **Preview:**

   ```ts
   // note-commands.test.ts
   test(":Today with no daily note emits one exclusive create from the daily template", () => {
     // ex "Today" → effects == [{ kind: "createNote", path: "daily/2026-10-03.md", template: "templates/daily.md",
     //   fallback: "# {{date}}", vars.title "2026-10-03", then: "firstTask", reason: "daily" }]
   });
   test(":Today opens a case-variant daily note instead of creating one", () => { /* index "Daily/2026-10-03.MD" → read of it; no createNote */ });
   test("a created daily note opens with the cursor on the first unchecked task", () => {
     // noteCreated created → fileLoaded "- [x] a\n- [ ] b" → cursor { line: 1, col: 6 }
     // then "insert" → Insert mode at EOF; template "unreadable" → error toast naming the template
   });

   // test/integration/notes.test.ts
   test("a second :Today leaves the daily note's bytes and mtime unchanged", async () => { /* V5 */ });
   test("a daily note that appears after the index check is opened, not overwritten", async () => { /* V3 */ });
   test("missing, unreadable, and unwritable templates fall back or fail cleanly", async () => {
     // missing → "# 2026-10-03"; binary → empty note + error toast; read-only parent → failed toast, no ".so-new-" left
   });
   test(":Yesterday from a subfolder daily note creates the previous day and logs the path only", async () => {
     // format YYYY/MM/YYYY-MM-DD → daily/2026/10/2026-10-02.md with {{date}} "2026-10-02"; SO_LOG=debug notes.created has no note text
   });
   ```

   - Run `bun test src/core/state/note-commands.test.ts test/integration/notes.test.ts` and confirm failure because the commands and the runner case do not exist.

2. **GREEN:** contracts, commands, runner case, routing, and registrations per §7.

   **Preview:**

   ```ts
   // types.ts
   export type AfterOpen = "firstTask" | "insert";
   // Action | { type: "noteCreated"; path; outcome: "created" | "exists" | "failed"; template: "used" | "missing" | "unreadable" | "none"; then: AfterOpen; reason: "daily" | "new"; failure? }
   // Effect | { kind: "createNote"; path; template?; fallback?; vars: TemplateVars; then: AfterOpen; reason: "daily" | "new" }

   // note-commands.ts
   export function openDaily(c: CommandContext, date: LocalDate): Result { /* §7: findPathInsensitive → openPath { then } | createNote */ }
   export function onNoteCreated(s: AppState, a: Extract<Action, { type: "noteCreated" }>, now: number): Result { /* §7 */ }

   // effects.ts
   case "createNote":
     void serial(async () => { /* §7: template outcome; expandTemplate; createExclusive; ownOps; index.notify; path-only log; dispatch noteCreated */ });
     return;

   // main.ts registries() and test/support/state.ts testRegistries()
   for (const c of noteCommands) commands.register(c);
   // bindings: [...existing, ...noteBindings]; groups: { ...existing, ...noteGroups }
   ```

   - `findPathInsensitive` memoizes a lower-case map per `NoteIndex` in a `WeakMap`.
   - `openPath` without `opts` behaves exactly as before; when the buffer is already shown, `placeAfterOpen` applies at once.
   - The runner never emits a buffer-creating `read` of the template.

3. **REFACTOR:** Keep `openDaily` as the only path decision point.

   **Preview:**

   ```ts
   // allowed: extract relativeDay(c, step) and a local templateOutcome() in the runner
   // prohibited: path decisions in the adapter or in onNoteCreated
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(notes): open or create daily notes from a template

   Task: P1-G2-T2 — Daily note open-or-create and placement
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V2`, `V8` — `bun test src/core/state/note-commands.test.ts` → all cases pass
- `V5`, `V3`, `V6`, `V7` — `bun test test/integration/notes.test.ts` → all cases pass; no `.so-new-` file remains
- `bun --bun run tsc --noEmit -p .` → no errors (exhaustive `Action` and `Effect` switches cover the new variants)

##### P1-G2-T3 — Calendar overlay state

- **Outcome:** `note.pickDate` (`<leader>np`) opens the `calendar` overlay; `calendarKey` handles `h/l/j/k/H/L/t/Esc/Enter` purely, with month clamping and the announcement line; `calendarMarks` marks days whose daily note is indexed; `routeKey` sends keys to the calendar while open.
- **System Design:** `REQ2@R1 → DES4, DES5 → S5 → V9`
- **UI Design:** `RM261003ABZP-UREQ8@R2 → UDES8@R1` (Monday-first, fixed-size calendar; announcement text)
- **Canonical Shapes:** System design §5 Calendar pick; §6 `CalendarState` — State Model; §7 `src/core/state/calendar.ts`, `src/core/state/types.ts` (`Overlay` calendar variant, `CalendarState`); parent UI design Component: Calendar (line 1743)
- **Files:** `src/core/state/types.ts` — `CalendarState`, `Overlay` + `{ kind: "calendar"; calendar }`; `src/core/state/calendar.ts` — `openCalendar`, `calendarKey`, `calendarMarks`; `src/core/state/keys.ts` — `routeKey` case `"calendar"`; `src/core/state/note-commands.ts` — `note.pickDate` entry and `<leader>np` binding; `src/core/state/calendar.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V9`:** `src/core/state/calendar.test.ts` — open on 2026-10-03; `l` → 10-04, `j` → 10-11, `H` from 2026-03-31 → 2026-02-28, `L` month follows, `t` → 10-03, `Esc` → overlay none, `Enter` → `createNote` for the selected day; marks `{1, 2}` from `daily/2026-10-01.md` and `2026-10-02.md`; message `"Sat 2026-10-03 · no note"`.

   **Preview:**

   ```ts
   test("calendar keys move the selection and Enter opens or creates that day", () => {
     // s = openCalendar(ctx(now Oct 3)); press "l" → selected 2026-10-04; … "Enter" → overlay none, effects[0].kind "createNote"
   });
   test("days with an indexed daily note are marked", () => {
     expect(calendarMarks(withIndex(["daily/2026-10-01.md", "daily/2026-10-02.md"]))).toEqual(new Set([1, 2]));
   });
   ```

   - Run `bun test src/core/state/calendar.test.ts` and confirm failure.

2. **GREEN:** `calendar.ts` and the `routeKey` case per §7.

   **Preview:**

   ```ts
   export function calendarKey(s: AppState, a: { key: Key; now: number }, reg: Registries): Result {
     // h/l ±1, j/k ±7, H/L addMonthsClamped ±1, t today, Esc close, Enter close + openDaily(selected); month follows selected
   }
   // keys.ts routeKey: case "calendar": return calendarKey(s, a, reg);
   ```

   - Keys never reach bindings while the overlay is open; marks are computed from the index only (no disk read).
   - Any other exhaustive switch over `Overlay["kind"]` gains the `calendar` case in this task so `tsc` stays clean.

3. **REFACTOR:** Keep the announcement formatter beside `calendarMarks`.

   **Preview:**

   ```ts
   // allowed: private announce(s) helper; prohibited: storing marks in state
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(notes): add calendar date picker state

   Task: P1-G2-T3 — Calendar overlay state
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V9` — `bun test src/core/state/calendar.test.ts` → all cases pass

##### P1-G2-T4 — Template picker and insertion

- **Outcome:** `template.insert` (`<leader>nt`, Markdown only) opens the `templates` picker source, which lists `.md` files under `[templates] folder`, always loads its preview, renders source lines then `▸` then the expansion through the generic `PickerSource.render` hook, and on accept inserts the expanded template in one undo step (whole at 1:1, else body at cursor plus `mergeFrontmatter`); the picker painter draws `render` output when a source provides it.
- **System Design:** `REQ4@R2 → DES2, DES6, DES8 → S8 → V14`
- **UI Design:** `RM261003ABZP-UREQ8@R2 → UDES8@R1` (preview-first template picking)
- **Canonical Shapes:** System design §5 Template insertion; §6 `PickerSource.render` — Contract; §7 `src/core/state/picker.ts` (`render`, `previewAlways`, `templates`), `src/core/state/note-commands.ts` (`insertTemplate`), `src/ui/overlays/calendar.ts, shell.ts, picker.ts` (picker preview painting only)
- **Files:** `src/core/state/picker.ts` — `PreviewLines`, `PickerSource.render?`, `previewAlways?`, `requestPreview`, `pickerSources.templates`; `src/core/state/note-commands.ts` — `insertTemplate`, `template.insert` command, `<leader>nt` binding; `src/ui/overlays/picker.ts` — preview pane paints `source.render?.(…) ?? raw lines`; `src/core/state/note-commands.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V14`:** extend `note-commands.test.ts`: `insertTemplate` at 0:0 inserts the whole expanded text; mid-note with template frontmatter inserts the body at the cursor and merges properties; one `u` restores the text exactly; accept before the preview loads shows `"loading template…"` and keeps the picker open.

   **Preview:**

   ```ts
   test("inserting a template mid-note merges its properties and undoes in one step", () => {
     // note "---\ntags: [work]\n---\nbody", cursor in body; template "---\ntags: [meeting]\n---\n# {{title}}"
     // expect frontmatter tags [work, meeting]; "# <basename>" at cursor; one "u" → original text
   });
   ```

   - Run `bun test src/core/state/note-commands.test.ts` and confirm the new cases fail.

2. **GREEN:** picker hook and source, `insertTemplate`, and the painter branch per §7.

   **Preview:**

   ```ts
   export type PreviewLines = { text: string; style?: string; ranges?: { from: number; to: number; style: string }[] }[];
   // PickerSource: render?(s, item, file): PreviewLines; previewAlways?: true
   // requestPreview: also when source.previewAlways
   templates: { id: "templates", title: "Insert template", indexed: true, previewAlways: true, /* items, preview, render, accept per §7 */ },

   export function insertTemplate(s: AppState, file: TextFile, now: number, reg: Registries): Result {
     // expandTemplate; 0:0 → one insert; else splitFrontmatter + mergeFrontmatter edits; applyBufferEdits (one undo step); close overlay
   }
   ```

   - Sources without `render` paint exactly as before.

3. **REFACTOR:** Share `templatePaths(s)` for T5's `newNoteTemplates`.

   **Preview:**

   ```ts
   // allowed: export templatePaths within picker.ts; prohibited: language-specific code in the UI painter
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(notes): insert templates with a rendered preview

   Task: P1-G2-T4 — Template picker and insertion
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V14` — `bun test src/core/state/note-commands.test.ts` → all cases pass
- Existing picker suites — `bun test src/core/state test/ui/shell.golden.test.ts` → unchanged goldens pass

##### P1-G2-T5 — New note from a template

- **Outcome:** `note.new` (`<leader>nn`) opens a `newNote` prompt that validates the title and previews `→ <path>.md`; Enter opens `newNoteTemplates` with `(blank note)` first; accept emits `createNote` with `then: "insert"`; `noteCreated` opens a created note in Insert mode and refuses an existing name with `E13: File exists (<path>)`; `Esc` at either step creates nothing.
- **System Design:** `REQ5@R1 → DES3, DES4, DES6 → S9 → V17, V18`
- **UI Design:** `RM261003ABZP-UREQ8@R2 → UDES8@R1` (Prompt with path preview)
- **Canonical Shapes:** System design §5 New note; §6 `PromptState` (newNote) — State Model; §7 `src/core/state/types.ts` (`PromptState`), `src/core/state/explorer.ts (promptKey) and src/ui/overlays/prompt.ts`, `src/core/state/picker.ts` (`newNoteTemplates`), `src/core/state/note-commands.ts` (`startNewNote`, `submitNewNote`)
- **Files:** `src/core/state/types.ts` — `PromptBase`, `PromptState` union; `src/core/state/explorer.ts` — `promptKey` new-note branch, `newNoteTitleError`; `src/core/state/note-commands.ts` — `startNewNote`, `submitNewNote`, `note.new` command, `<leader>nn` binding; `src/core/state/picker.ts` — `pickerSources.newNoteTemplates`; `src/ui/overlays/prompt.ts` — path preview; `src/core/state/note-commands.test.ts`; `test/integration/notes.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V17`, `V18`:** unit cases in `note-commands.test.ts` (values `""`, `"../x"`, `"/x"` set `invalid`; `"a/b"` previews `a/b.md`; `noteCreated exists` with reason `new` → error toast `E13: File exists (a/b.md)` and no open) and an integration case in `notes.test.ts` (`<leader>nn` `Meeting` → `(blank note)` → empty `Meeting.md` in Insert mode; again with `templates/meeting.md` → `E13` toast and the file unchanged).

   **Preview:**

   ```ts
   test("new-note titles that leave the workspace are refused inline", () => { /* "", "../x", "/x" → prompt.invalid set */ });
   test("a new note with an existing name is refused and not opened", () => { /* noteCreated exists reason "new" → toast; no window change */ });
   test("a new blank note opens empty in Insert mode", async () => { /* integration: Meeting.md "" ; mode insert */ });
   ```

   - Run `bun test src/core/state/note-commands.test.ts test/integration/notes.test.ts` and confirm the new cases fail.

2. **GREEN:** prompt union, routing, flow, source, and painter per §7.

   **Preview:**

   ```ts
   type PromptBase = { kind: "confirm" | "input" | "typed"; title: string; value: string; impact?: string; invalid?: string };
   export type PromptState = PromptBase & ({ op: FsOp; newNote?: never } | { newNote: true; op?: never });

   // explorer.ts promptKey, before the explorer branch:
   if (s.overlay.prompt.newNote) return newNotePromptKey(s, key, now);
   export function newNoteTitleError(value: string): string | undefined { /* empty, "..", leading "/", NUL, "." or ".." segment */ }
   ```

   - Every existing `{ …, op }` prompt construction compiles unchanged; explorer prompts behave as before.
   - Readers of `prompt.op` (explorer completion, `link-commands.ts`, the prompt painter) narrow on `newNote` first; no explorer logic changes.

3. **REFACTOR:** None beyond keeping new-note key handling in one function.

   **Preview:**

   ```ts
   // allowed: newNotePromptKey helper; prohibited: changing explorer FsOp handling
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(notes): create new notes from templates

   Task: P1-G2-T5 — New note from a template
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V17` — `bun test src/core/state/note-commands.test.ts` → all cases pass
- `V18` — `bun test test/integration/notes.test.ts` → all cases pass
- Explorer prompts — `bun test test/ui/file-ops.test.ts test/integration/explorer-ops.test.ts` → pass unchanged

##### P1-G2-T6 — Calendar overlay painter and notes goldens

- **Outcome:** `CalendarOverlay` paints the fixed 36×12 Monday-first month with `•` marks, the selected-day cell and hardware cursor, and the announcement; `createShell` adds it to `OverlayHost`; component goldens prove the calendar and template picker states in color, `NO_COLOR`, light, and 80×24.
- **System Design:** `REQ2@R1, REQ4@R2, REQ13@R1 → DES5, DES6 → S5, S8, S24 → V10, V16`
- **UI Design:** `RM261003ABZP-UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1`; `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1`
- **Canonical Shapes:** System design §7 `src/ui/overlays/calendar.ts, src/ui/shell.ts, src/ui/overlays/picker.ts`; parent UI design Component: Calendar (line 1743), Component: Picker (1350), Component: Theme (1978); mockup M5@R2
- **Files:** `src/ui/overlays/calendar.ts` — `CalendarOverlay`; `src/ui/shell.ts` — `createShell` overlay list; `test/ui/notes.golden.test.ts`; its `__snapshots__` entries
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V10`, `V16`:** `test/ui/notes.golden.test.ts` with `mountShell`, a fixed clock, daily notes for 10-01 and 10-02 indexed, and the template fixtures.

   **Preview:**

   ```ts
   describe("calendar", () => {
     for (const v of variants /* 80×24 color, NO_COLOR, light */)
       test(`matches the ${v.name} golden with a marked day selected`, async () => { /* <leader>np, k → 10-01 selected; frame snapshot; cursor on cell */ });
     test("marked days stay distinguishable without colour", async () => { /* NO_COLOR: "•" glyph and underline attribute present */ });
   });
   describe("template picker", () => {
     test("shows source then the expansion at 120 columns", async () => { /* "▸" line between; snapshot */ });
     test("hides the preview at 90 columns until Tab", async () => { /* snapshot before and after Tab */ });
   });
   ```

   - Run `bun test test/ui/notes.golden.test.ts` and confirm failure because no calendar view paints.

2. **GREEN:** `CalendarOverlay` and shell wiring per §7 and the parent Calendar component.

   **Preview:**

   ```ts
   export class CalendarOverlay extends Renderable implements View {
     update(s: AppState): void { /* visible = s.overlay.kind === "calendar"; marks = calendarMarks(s) */ }
     cursor(): Cursor | undefined { /* selected day cell */ }
     // renderSelf: title "‹ October 2026 ›", Mo..Su header, 6×7 grid, "•" marks, selection by reverse, today underlined, announcement line
   }
   // shell.ts: new OverlayHost(ctx, [...existing, new CalendarOverlay(ctx)])
   ```

   - Visual tokens come from the theme (`UDES11@R1`); no color-only state.

3. **REFACTOR:** Reuse existing overlay frame and title helpers.

   **Preview:**

   ```ts
   // allowed: shared box drawing; prohibited: changing other overlays' goldens
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes, including the new golden snapshots.

   **Commit message:**

   ```text
   feat(ui): paint the calendar overlay and add notes goldens

   Task: P1-G2-T6 — Calendar overlay painter and notes goldens
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V10`, `V16` — `bun test test/ui/notes.golden.test.ts` → goldens match; `NO_COLOR` output contains no truecolor or 256-color SGR codes
- Existing goldens — `bun test test/ui` → all other snapshots unchanged

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Notes unit suites (V2, V8, V9, V14, V17; primitive V3, V6) | `bun test src/core/state/note-commands.test.ts src/core/state/calendar.test.ts src/workspace/fs.test.ts` | All pass |
| Notes integration (V3, V5, V6, V7, V18) | `bun test test/integration/notes.test.ts` | All pass; no temp file left; log lines carry paths only |
| Notes goldens (V10, V16) | `bun test test/ui/notes.golden.test.ts` | Goldens match in color, `NO_COLOR`, light, 80×24 |
| Fast gate | `bun run check` | Passes in under 30 s |
| Full suites | `bun run test:ci` (check for orphan processes first; kill any started) | All pass, existing goldens unchanged |
| Registration mirror | Compare `registries()` and `testRegistries()` | Same notes commands, bindings, and groups |
| Work-process identifiers | `rg -n "W26100423LX\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P1-G" src test/integration/notes.test.ts test/ui/notes.golden.test.ts` | No match in new code |

#### Review and Verification Focus

- **Specification:** never-overwrite create (link/`wx`, EEXIST → `exists`), case-insensitive index lookup, target-day `{{date}}` with one instant, cursor placement, calendar navigation and marks, preview-first template picking with one-undo insertion and property merge, new-note title rules and refusal, M5@R2 visual states under `NO_COLOR`/light/80×24.
- **Technical:** reducers stay pure; all file I/O in the runner's serial queue with own-op tracking; no note text in logs; `PromptState` union keeps explorer prompts intact; exhaustive `Action`/`Effect` switches; deterministic clocks and `TZ` in tests; temp-file cleanup on every path; processes started by tests are killed.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ1@R2 → DES1 → S2 → V4a` | None | `P1-G1` | `P1-G1-T1` |
| `REQ3@R2 → DES1 → S6 → V11, V12` | None | `P1-G1` | `P1-G1-T2` |
| `REQ1@R2, REQ3@R2 → DES2 → S1, S2, S7 → V1, V4, V13` | None | `P1-G1` | `P1-G1-T3` |
| `REQ4@R2, REQ10@R2 → DES8 → S8, S18 → V15, V34, V34b` | None | `P1-G1` | `P1-G1-T4` |
| `REQ6@R2 → DES7 → S10 → V19` | None | `P1-G1` | `P1-G1-T5` |
| `REQ1@R2, REQ5@R1 → DES3 → S3 → V3, V6` (primitive) | None | `P1-G2` | `P1-G2-T1` |
| `REQ1@R2 → DES2, DES3, DES4 → S1–S4 → V2, V3, V5, V6, V7, V8` | None | `P1-G2` | `P1-G2-T2` |
| `REQ2@R1 → DES4, DES5 → S5 → V9` | `UREQ8@R2 → UDES8@R1` | `P1-G2` | `P1-G2-T3` |
| `REQ4@R2 → DES2, DES6, DES8 → S8 → V14` | `UREQ8@R2 → UDES8@R1` | `P1-G2` | `P1-G2-T4` |
| `REQ5@R1 → DES3, DES4, DES6 → S9 → V17, V18` | `UREQ8@R2 → UDES8@R1` | `P1-G2` | `P1-G2-T5` |
| `REQ2@R1, REQ4@R2, REQ13@R1 → DES5, DES6 → S5, S8, S24 → V10, V16` | `UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1`; `UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` | `P1-G2` | `P1-G2-T6` |
| G3 — DI2 outputs (satisfied `9adb285`) | None | `P1-G2` | `P1-G2-T2`, `P1-G2-T4`, `P1-G2-T5` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.

Outputs consumed by later parts:

- `src/core/lang/markdown/frontmatter-patch.ts` (`patchFrontmatter`, `frontmatterValue`, `FrontmatterValue`, `FrontmatterPatch`, `yamlScalar`) — Part 2 write-back and cell typing.
- `src/core/time` (`localDateTime`, `formatDate`, `addDays`) — Part 2 date cells, summaries, and cell `Ctrl-a`/`Ctrl-x`.
- `openPath(…, opts)` and `fillRestored`/`placeAfterOpen` with `then` — Part 2 adds `subpath` to the same `opts` and restore entry.
- `PickerSource.render`/`previewAlways` and `pickerSources` — Part 2 adds `baseViews`.
- `createNote` runner case pattern (serial queue, own op, index notify, path-only log) — Part 2's `patchFrontmatter` case follows it.
- `noteCommands`/`noteBindings`/`noteGroups` registrations in `registries()` and `testRegistries` — Parts 2 and 3 extend the same lists.

## Planning Gaps

None.
