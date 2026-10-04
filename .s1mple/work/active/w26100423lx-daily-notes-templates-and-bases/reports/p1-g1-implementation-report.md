# P1-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-goal.md`
- **Plan Part:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-1-daily-notes-and-templates.md`
- **Group:** `P1-G1` — Pure notes foundations
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`
- **Report:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/reports/p1-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

The five pure foundations exist with colocated unit tests, and every task and group check passes. Each task was done test-first: RED was confirmed as a missing module or failing cases, then GREEN, then a refactor. There were no cross-work gates or dependencies. The tree was clean at the start.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G1-T1` | `src/core/time/local.ts` — `LocalDate`, `LocalDateTime`, `localDateTime`, `addDays`, `addMonthsClamped`, `withDate`, `daysInMonth`, `mondayIndex` (private `toUtc`/`fromUtc`); `src/core/time/local.test.ts` | V4a: `bun test src/core/time/local.test.ts` → 6 pass, 0 fail; also passes with `TZ=Europe/Berlin` and `TZ=America/New_York`. `bun run check` → passed (745 tests) | `66081ed` | `Completed` |
| `P1-G1-T2` | `src/core/time/format.ts` — `MOMENT_TOKENS`, `formatDate`, `SUPPORTED` table; `src/core/time/format.test.ts` | V11, V12: `bun test src/core/time/format.test.ts` → 7 pass, 0 fail. `bun run check` → passed (752 tests) | `ce29b1e` | `Completed` |
| `P1-G1-T3` | `src/core/features/notes/daily.ts` — `DailyConfig`, `dailyPath`, `parseDailyDate`; `src/core/features/notes/template.ts` — `TemplateVars`, `expandTemplate`, `BUILTIN_DAILY_TEMPLATE`; `src/core/time/format.ts` — tokenizer extracted as `formatParts`/`FormatPart` (used by `formatDate` and `parseDailyDate`); colocated `daily.test.ts`, `template.test.ts` | V1, V4: `bun test src/core/features/notes/daily.test.ts` → 6 pass. V13: `bun test src/core/features/notes/template.test.ts` → 4 pass. `bun run check` → passed (762 tests) | `71863fb` | `Completed` |
| `P1-G1-T4` | `src/core/lang/markdown/frontmatter-patch.ts` — `FrontmatterValue`, `FrontmatterPatch`, `PatchResult`, `patchFrontmatter`, `frontmatterValue`, `splitFrontmatter`, `mergeFrontmatter`, `yamlScalar`; `src/core/lang/markdown/frontmatter-patch.test.ts` | V34, V34b, V15: `bun test src/core/lang/markdown/frontmatter-patch.test.ts` → 19 pass, 0 fail. `bun run check` → passed (781 tests; the boundary test accepts the type-only `SpanEdit` import) | `10963a8` | `Completed` |
| `P1-G1-T5` | `src/core/config/schema.ts` — `ConfigSchema` gains `daily` and `templates`; private `workspacePath`, `normalizePath`; `src/core/config/schema.test.ts` (new); `src/core/config/toml.test.ts` (two existing cases updated) | V19: `bun test src/core/config` → 13 pass, 0 fail (7 new). `bun run check` → passed (788 tests) | `b912315` | `Completed` |

### Group Change Range

- **Starting commit:** `fb86f9cc8f01fb3ba1bb18394bb57642e8045b0f` (`fb86f9c`)
- **Final commit:** `b912315`
- **Remaining group changes:** None. `git status` is clean apart from this report, which goes in its own commit.

### Group Verification

- `bun test src/core/time src/core/features/notes src/core/lang/markdown/frontmatter-patch.test.ts src/core/config` → `Passed` — 55 pass, 0 fail, 337 expect() calls across 7 files.
- `bun run check` → `Passed` — Biome found no issues; `tsc` was clean; knip reported zero findings, with no ignore added; 788 pass, 0 fail across 74 files, including `test/boundaries.test.ts`.
- `rg -n "W26100423LX|REQ[0-9]|DES[0-9]|\bV[0-9]+\b" src/core/time src/core/features/notes src/core/lang/markdown/frontmatter-patch* src/core/config` → `Passed` — no match (exit 1).
- `rg -n "core/state|\.\./\.\./state|\.\./state" src/core/time src/core/features/notes` → `Passed` — no match. `core/time` and `features/notes` import no `core/state`.
- `yaml` importers → `Passed` — only `src/core/lang/markdown/` files (`frontmatter-patch.ts`, its test, and the existing `scan.ts`).
- `git diff --stat fb86f9c HEAD -- package.json bun.lock .github/workflows` → `Passed` — empty, so there is no new dependency.
- Orphan processes → none were started. No PTY tests, `test:ci`, or benches ran in this group.

### Deviations and Remaining Issues

1. **Date flag on the set patch (contract addition, T4).** V34b requires text `"2026-10-05"` → `"\"2026-10-05\""` but a date `"2026-10-05"` → `2026-10-05`. `FrontmatterValue` (§6) cannot tell those apart. The design names no way to do it. I added an optional field and parameter. Both are additive, so the declared shapes are still valid:

   ```ts
   export type FrontmatterPatch =
     | { set: string; value: FrontmatterValue; date?: boolean }
     | { remove: string };
   export function yamlScalar(value: FrontmatterValue, indent: string, date = false): string;
   ```

   Without the flag, a date-shaped string is quoted as text. With it, the string is written plain. **Part 2 impact:** `writeProperty`/`validateCell` must set `date: true` when the property type is `date`. Otherwise dates are written quoted. They still read back as the same string in YAML 1.2, but the source form differs from Obsidian's. `mergeFrontmatter` always writes with `date: true`, which matches Obsidian's `stringify` (it writes date-shaped strings plain).
2. **Backslash escapes the whole next token (T2).** §7 and REQ3 describe "a backslash emits the next character". Moment 2.29.4's regex `(\\)?(token)` escapes the whole following token, so `"\\YYYY"` → `YYYY` in Moment. Next-character escaping would give `Y262026`. I followed Moment because the requirement is Moment-exact output. For one-character tokens such as V12's `"\\Y"` → `Y`, the two readings agree. A trailing lone backslash emits nothing, as in Moment.
3. **Compound `Hmm`/`hmm`/`Hmmss`/`hmmss` left out of `MOMENT_TOKENS` (T2).** Moment renders these exactly as their parts (`hmm` → `905`), so scanning them as `h`+`mm` gives Moment's output. Listing them as unsupported would emit `hmm` literally. This is documented in a comment above `MOMENT_TOKENS`.
4. **`[unclosed` expected string (T2, V12).** The design leaves this case open ("documented expected string"). The test records `"[unclo0e6"` at 09:05:00 Saturday: `[` is literal with no closing bracket, `l` and `e` are unsupported tokens, `s` → `0`, and `d` → `6`. Moment gives `[unc10/3/2026o066`, because it expands `l` and `e`.
5. **`formatParts` export (T3).** §7 says `parseDailyDate` builds its regex "from the same tokenizer". I extracted the tokenizer as `formatParts`/`FormatPart` in `format.ts`, so the scan is not duplicated. `formatDate` uses it too.
6. **`LocalDateTime` has no `ms` field.** The plan's T1 preview showed `ms`, but §7 (authoritative) does not, so I followed §7.
7. **Patcher semantics a remediator must preserve (T4):**
   - `edits` are in LF-normalized line/column space (a buffer); `text` keeps the input's line endings (a file). Inserted lines in a CRLF file use `"\r\n"`. The eol is `"\r\n"` when any CRLF exists, the same rule as `TextFile.eol`.
   - A patch returns at most one `SpanEdit`: the common-prefix/suffix difference of the old and new LF text. A no-op returns `edits: []` and the input text unchanged.
   - A block list is replaced up to its last item, so a comment on the last item line is kept. An empty value (`key:` or `key: # c`) is filled right after the colon. A list keeps its existing item indent; new lists use two spaces, as Obsidian writes them.
   - Flow-map frontmatter, non-map frontmatter, invalid YAML, and duplicate keys return `{ ok: false }`.
   - `frontmatterValue` and `splitFrontmatter` leave out map values, which `FrontmatterValue` cannot hold.
   - `mergeFrontmatter` matches keys like `patchFrontmatter`: exactly first, then without regard to case. A list re-renders whole when it gains items.
8. **Existing tests updated (T5).** `src/core/config/toml.test.ts` used `daily.folder` as its example of an unknown key, and it compares a whole parsed config. It now uses `calendar.week` and includes the `daily`/`templates` defaults. The plan named `schema.test.ts` as "extend"; that file did not exist, so it is new.

No blockers remain.

## Remediation

- **Verification reports:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/reports/p1-g1-verification-report.md` (commit `8f2629b`, status `Failed`; unchanged)
- **Status:** `Completed`

All three findings are fixed test-first. Each regression test failed before its fix: `ReferenceError: Unresolved alias` for VER1, `undefined` instead of the date for VER2, and `"b: 2"` at column 0 for VER3. Each fix is its own commit, and `bun run check` passed on each commit's tree before it was made. The verifier's note that the design and REQ3 wording on backslash escapes should be aligned is a document-owner item; no code or design change was made for it.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P1-G1-VER1` | `src/core/lang/markdown/frontmatter-patch.ts`: new private `resolves(doc)` returns `false` when `doc.toJS()` throws. `parseBlock` treats an unresolvable block as `invalid frontmatter`, so `frontmatterValue` returns `undefined`, `splitFrontmatter` keeps the text as body, and `patchFrontmatter`/`mergeFrontmatter` return `{ ok: false }`. `yamlString` writes text plain only when it resolves and reads back as the same text, so alias-shaped text is double-quoted. Tests `text that YAML would read as an alias is quoted` (`yamlScalar("*urgent*", "")` → `"\"*urgent*\""` and re-parses to `*urgent*`, likewise `*a` and `**bold**`; `patchFrontmatter` with `**bold**` → `ok: true`, `a: "**bold**" # c`) and `frontmatter with an unresolved alias is unreadable, not a crash` (all four functions on `"---\na: *x\n---\nbody\n"` return without throwing). Probe: 33 YAML-indicator text values (`*a`, `&x`, `!tag`, `%x`, `` `x ``, `? x`, `~`, `0x1F`, `1_000`, …) through `patchFrontmatter` all re-parse to the same text; a valid anchor `b: *x` still reads as `1`. `bun run check` → passed, 790 pass | `bd99610` | `Fixed` |
| `P1-G1-VER2` | `src/core/features/notes/daily.ts`: new private `literalRuns` joins adjacent literal parts before `parseDailyDate` trims the first and last parts, so every space that `dailyPath`'s `trim()` removes is left out of the pattern. Test `whitespace the title trims is not required in the path` round-trips `"  YYYY-MM-DD"`, `"[ ] YYYY-MM-DD"`, and `"YYYY-MM-DD  "` for 2026-10-03, 2025-12-25, and 2028-02-29. Probe: 12 formats (including those three, `" [ ]YYYY-MM-DD [ ] "`, and the existing round-trip formats) × 800 consecutive days from 2025-01-01 → 0 failures. `bun run check` → passed, 791 pass | `d07ecd0` | `Fixed` |
| `P1-G1-VER3` | `src/core/lang/markdown/frontmatter-patch.ts`: new private `mapIndent` takes the spaces before the map's first key; a new key and its list lines are written with that indent. Test `a new key in an indented block keeps the block's indent`: `"---\n  a: 1\n---\n"` + `b: 2` → `"---\n  a: 1\n  b: 2\n---\n"`, re-parsing to `{ a: 1, b: 2 }`; a new list re-parses to `{ a: 1, tags: ["x"] }`; `applySpanEdits` equality holds. Probes: a leading comment before an indented map, a CRLF indented block with a list, and `mergeFrontmatter` into an indented block all re-parse to the expected object; an empty block still gets a column-0 key. `bun run check` → passed, 792 pass | `83da566` | `Fixed` |

**Completion checklists:**

- `P1-G1-VER1`: [x] resolution implemented; [x] required proof passes; [x] change evidence recorded; [x] verification evidence recorded.
- `P1-G1-VER2`: [x] resolution implemented; [x] required proof passes; [x] change evidence recorded; [x] verification evidence recorded.
- `P1-G1-VER3`: [x] resolution implemented (the "use the map's own indentation" option); [x] required proof passes; [x] change evidence recorded; [x] verification evidence recorded.

### Remediation Group Verification

- `bun run check` → `Passed` — Biome checked 260 files with no issues; `tsc` clean; knip zero findings; 792 pass, 0 fail across 74 files, including `test/boundaries.test.ts`.
- `bun test src/core/time src/core/features/notes src/core/lang/markdown/frontmatter-patch.test.ts src/core/config` → `Passed` — 59 pass, 0 fail, 362 `expect()` calls across 7 files.
- `TZ` set to Europe/Berlin, America/New_York, and Australia/Lord_Howe: `bun test src/core/time src/core/features/notes` → `Passed` — 24 pass, 0 fail in each.
- `rg -n "W26100423LX|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P1-G1|\bS[0-9]+\b|RF[0-9]" src/core/time src/core/features/notes src/core/lang/markdown/frontmatter-patch* src/core/config` → `Passed` — no match (exit 1).
- `yaml` importers → `Passed` — `scan.ts`, `frontmatter-patch.ts`, its test, and the existing boundary-violation fixture.
- `git diff --stat fb86f9c HEAD -- package.json bun.lock .github knip.json biome.json` → `Passed` — empty.
- Remediation changed only `src/core/features/notes/daily.ts`, `daily.test.ts`, `src/core/lang/markdown/frontmatter-patch.ts`, and its test.
- Orphan processes → `Passed` — every test and probe process exited. One `bun run tui --kernel-url …` process belongs to another project and was left alone. No PTY tests, `test:ci`, or benches ran.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all three verifier findings are fixed with regression tests, and every check passes.
- **Final report commit:** Returned to the orchestrator; not written here, as stated in Scope.
- **Final commits:** `66081ed`, `ce29b1e`, `71863fb`, `10963a8`, `b912315` (initial); `bd99610`, `d07ecd0`, `83da566` (remediation)
- **Final checks:** `bun run check` → passed (792 pass, 0 fail); group unit suites → 59 pass, 0 fail
- **Remaining issues:** None in code. The design and REQ3 wording on backslash escapes is left for the document owner, as the verification report records.
