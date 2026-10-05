# P1-G1 Verification Report

## Scope

- **Group:** `P1-G1`
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`
- **Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p1-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p1-g1-implementation-report.md`

Verified range: `fb86f9c..b912315` (task commits `66081ed`, `ce29b1e`, `71863fb`, `10963a8`, `b912315`), inspected at `HEAD` `93ca0fc` with a clean tree. Baseline `main` is `d398ad7`, an ancestor of `HEAD`; no cross-work gate is due for this group.

## Status

`Failed`

The five foundations exist, every assigned V case passes, and `bun run check` passes. The group still fails on one Major defect: `yamlScalar` and the patcher's value readers throw `ReferenceError` on input that `yaml` reads as an alias. A text value such as `*urgent*` therefore crashes `patchFrontmatter` instead of being written quoted. Two Minor round-trip and invariant defects are also open.

## Assigned Traceability

- **System Design:** `W26100423LX-REQ1@R2, REQ3@R2, REQ4@R2, REQ6@R2, REQ10@R2 → DES1, DES2, DES7, DES8 → S2, S6, S7, S8, S10, S18 → V1, V4, V4a, V11, V12, V13, V15, V19, V34, V34b`
- **UI Design:** `None`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1@R2 → DES1 → S2 → V4a` | `None` | `addDays`/`addMonthsClamped` never skip or repeat a day across DST; 2026-01-31 + 1 month → 2026-02-28 | `src/core/time/local.ts:35-46` (`addDays`, `addMonthsClamped` on `Date.UTC` fields); `local.test.ts` passes under `TZ` UTC, Europe/Berlin, America/New_York, Australia/Lord_Howe | `Satisfied` |
| `REQ3@R2 → DES1 → S6 → V11, V12` | `None` | Supported tokens equal Moment 2.29.4 `en`; unsupported tokens stay whole; brackets and backslash escape | `src/core/time/format.ts:8-93` (`MOMENT_TOKENS`, longest first), `:135-158` (`SUPPORTED`), `:182-203` (`formatParts`); differential run against Moment 2.29.4: 44,913 random formats of supported tokens, brackets, and backslashes, 0 mismatches | `Satisfied` |
| `REQ1@R2 → DES2 → S1, S2 → V1, V4` | `None` | `dailyPath` returns path and title for flat and subfolder formats; `parseDailyDate` round-trips and rejects non-daily paths | `src/core/features/notes/daily.ts:23-29` (`dailyPath`), `:62-117` (`parseDailyDate` with the `dailyPath` round-trip check); V1/V4 cases pass. The §7 round-trip invariant fails for formats with more than one leading or trailing whitespace part (`P1-G1-VER2`) | `Mismatch` |
| `REQ3@R2 → DES2 → S7 → V13` | `None` | Obsidian's two regexes, case-insensitive names, no trimming, one instant, `$&` literal | `src/core/features/notes/template.ts:15-26` matches the §7 shape verbatim; V13 string passes | `Satisfied` |
| `REQ4@R2 → DES8 → S8 → V15` | `None` | `mergeFrontmatter` unions lists, keeps scalars, appends new keys, creates a block when absent | `src/core/lang/markdown/frontmatter-patch.ts:350-379`; V15 cases pass; the exact §8 flow-list note (`tags: [work]`) was probed and yields `tags` `[work, meeting]`, `status: open`, `owner: me` | `Satisfied` |
| `REQ10@R2 → DES8 → S18 → V34, V34b` | `None` | A one-key patch keeps comments, order, quoting, CRLF, and body; adds and removes the block; `yamlScalar` quotes type-ambiguous text | `frontmatter-patch.ts:158-215` (`patchLf`), `:229-270` (`result`, one `SpanEdit`, CRLF restored), `:385-422` (`yamlScalar`); V34/V34b pass. `yamlScalar` throws on alias-shaped text (`P1-G1-VER1`), and appending to an indented top-level map writes invalid YAML (`P1-G1-VER3`) | `Mismatch` |
| `REQ6@R2 → DES7 → S10 → V19` | `None` | Defaults when absent; one line-numbered error per invalid path, empty format, root templates folder, or unknown key | `src/core/config/schema.ts:9-45` (`normalizePath`, `workspacePath`), `:83-94` (`daily`, `templates` with `prefault({})`); V19 passes; probe: `[templates] folder = "/"` → `line 2: templates.folder: must be a path inside the workspace` | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V4a` | `S2` | `DES1` | `bun test src/core/time/local.test.ts`, also with `TZ` set to Europe/Berlin, America/New_York, Australia/Lord_Howe | DST walks over 2026-03-29 and 2026-11-01 in both directions are consecutive; `addMonthsClamped({2026,1,31},1)` → `{2026,2,28}`; 23 pass in each `TZ` (time and notes suites) | `Passed` |
| `V11` | `S6` | `DES1` | `bun test src/core/time/format.test.ts`; differential script against Moment 2.29.4 (Bun cache copy, `version: "2.29.4"`) | Every supported token at 2026-10-03T09:05; `h hh A a` at 00:00, 00:30, 11:59, 12:00, 12:30, 13:05, 23:59; `Do` 1–31; `d` Sun–Sat. Moment comparison: 44,913 formats, 0 mismatches | `Passed` |
| `V12` | `S6` | `DES1` | Same test file; Moment comparison of the escape cases | `"YYYY-[W]ww"` → `2026-Www`, `"dd"` → `dd`, `"Q"` → `Q`, `"\\Y"` → `Y`, `"[unclosed"` → `[unclo0e6` (documented). Moment gives the same as `so` for `\\YYYY` (`YYYY`), a trailing `\` (nothing), `[a]b]` (`a]b`), and `[a[b]` | `Passed` |
| `V1` | `S1`, `S2` | `DES2` | `bun test src/core/features/notes/daily.test.ts` | `daily/2026-10-03.md`, `daily/2026/10/2026-10-03.md`, `daily/2026/October/2026-Oct-03.md`; root folder has no leading `/` | `Passed` |
| `V4` | `S2` | `DES2` | Same file; extra round-trip probe of 21 formats × 800 consecutive days | Test cases pass (`"dddd"` and non-daily paths → `undefined`). Probe: 18 formats round-trip with 0 failures; `"  YYYY-MM-DD"`, `"[ ] YYYY-MM-DD"`, and `"YYYY-MM-DD  "` fail 800/800 (`P1-G1-VER2`) | `Insufficient` |
| `V13` | `S7` | `DES2` | `bun test src/core/features/notes/template.test.ts` | Exact §8 string `"Meeting $& {{ title }} 2026  2026 2026-10-03 09:05 {{weather}} xx"` | `Passed` |
| `V15` | `S8` | `DES8` | `bun test src/core/lang/markdown/frontmatter-patch.test.ts`; probe with the §8 flow-list note | Lists unioned, scalars kept, `owner` appended, block created when absent, one `SpanEdit` | `Passed` |
| `V34` | `S18` | `DES8` | Same file; probes for CRLF removal, mixed endings, block scalars, comments between list items, indented maps | Fixture cases pass with byte comparison and `applySpanEdits` equality. Probe: appending to `"  a: 1"` frontmatter yields `"  a: 1\nb: 2"`, which `yaml` rejects with 3 errors (`P1-G1-VER3`) | `Insufficient` |
| `V34b` | `S18` | `DES8` | Same file; probe of 33 text values through `patchFrontmatter` and re-parse | The eight §8 values render as specified. `"*a"`, `"*urgent*"`, `"**bold**"` throw `ReferenceError: Unresolved alias` from `yamlString` (`P1-G1-VER1`); every other probed value re-parses to the same text | `Failed` |
| `V19` | `S10` | `DES7` | `bun test src/core/config/schema.test.ts`; config probes | Defaults; `/abs`, `../x`, `a/../../x`, `a\\b`, empty `format`, templates `.` and `""`, unknown `[daily]` key each give one line-numbered error; probe: templates `"/"` and daily `template = ""` also refused | `Passed` |
| Group unit suites | `S2`, `S6`, `S7`, `S8`, `S10`, `S18` | `DES1`, `DES2`, `DES7`, `DES8` | `bun test src/core/time src/core/features/notes src/core/lang/markdown/frontmatter-patch.test.ts src/core/config` | 55 pass, 0 fail, 337 `expect()` calls across 7 files | `Passed` |
| Fast gate and boundaries | `None` | `DES1`, `DES2`, `DES8` | `bun run check` | Biome: 260 files, no issues; `tsc` clean; knip zero findings; 788 pass, 0 fail across 74 files including `test/boundaries.test.ts` | `Passed` |
| Work-process identifiers | `None` | `None` | `rg -n "W26100423LX\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P1-G1\|\bS[0-9]+\b\|RF[0-9]" src/core/time src/core/features/notes src/core/lang/markdown/frontmatter-patch* src/core/config` | No match (exit 1) | `Passed` |
| Purity, layers, and `yaml` home | `None` | `DES1`, `DES8` | Import inspection; `rg -ln 'from "yaml"' src test` | `core/time` imports only `./local`; `features/notes` imports only `core/time`; the patcher imports `yaml` and type-only `SpanEdit`/`Pos`; `yaml` importers are `scan.ts`, `frontmatter-patch.ts`, its test, and the existing boundary-violation fixture | `Passed` |
| Dependencies and shared contracts | `None` | `None` | `git diff --stat fb86f9c b912315 -- package.json bun.lock .github test knip.json biome.json`; `git diff --name-only fb86f9c b912315` | Empty; only the 13 planned files changed (`toml.test.ts` edit explained). No shared contract file (`types.ts`, `update.ts`, `effects.ts`, `main.ts`, `test/support/state.ts`) touched | `Passed` |
| Commit conventions | `None` | `None` | `git log fb86f9c..b912315` | Five Conventional Commit subjects matching the plan, each body with `Task:` and `Work:` lines | `Passed` |
| Orphan processes | `None` | `None` | `pgrep` before checks | No `so` processes. Two `bun` processes (`apps/tui/src/main.ts`) belong to another project and were left alone. No PTY tests, `test:ci`, or benches ran; every verification process exited | `Passed` |

## Findings

### P1-G1-VER1 — Major — Correctness — Alias-shaped text crashes `yamlScalar` and the frontmatter readers

- **System Design:** `W26100423LX-REQ10@R2, REQ4@R2 → DES8 → S18, S8 → V34b, V15`
- **UI Design:** `None`
- **Evidence:** `src/core/lang/markdown/frontmatter-patch.ts:389-390` calls `doc.toJS()` after checking only `doc.errors`:

  ```ts
  const doc = parseDocument(text);
  return doc.errors.length === 0 && doc.toJS() === text
  ```

  `parseDocument("*urgent*")` reports no errors but holds an unresolved alias, so `toJS()` throws. Probe: `patchFrontmatter("---\na: 1 # c\nb: 2\n---\n", { set: "a", value: "*urgent*" })` → `ReferenceError: Unresolved alias (the anchor must be set before the alias): urge`; the same for `"*a"` and `"**bold**"`. The same root cause exists at `:301-302` (`pairValue` → `toJS`): with frontmatter `a: *x`, `frontmatterValue`, `splitFrontmatter`, and `mergeFrontmatter` all throw instead of returning `undefined` or `{ ok: false }`.
- **Impact:** A Bases text cell edited to Markdown emphasis such as `*urgent*` cannot be written. Part 2 calls the patcher both from `update` (the throw becomes an error toast) and from the runner's closed-note adapter, where an uncaught throw takes the lifecycle failure path. Template insertion into a note with an unresolved alias also throws. REQ10@R2 requires such text to be written quoted, and the `PatchResult` contract promises `{ ok: false, reason }` for unreadable frontmatter.
- **Required resolution:** `yamlScalar` returns a double-quoted string for any text whose plain form is not read back as the same string, including alias-shaped text, without throwing. `frontmatterValue` returns `undefined`, `splitFrontmatter` keeps the text as body, and `patchFrontmatter`/`mergeFrontmatter` return `{ ok: false }` when the block holds an unresolvable alias. One way: treat a `toJS` failure as "not the same text" or "invalid frontmatter".
- **Required proof:** Unit cases with behavior names in `frontmatter-patch.test.ts`: `yamlScalar("*urgent*", "")` → `"\"*urgent*\""` and it re-parses to the same text; `patchFrontmatter` with value `"**bold**"` returns `ok: true` with a quoted value; `frontmatterValue`, `splitFrontmatter`, and `mergeFrontmatter` on `"---\na: *x\n---\n"` return without throwing. `bun run check` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G1-VER2 — Minor — Correctness — `parseDailyDate` trims only the first and last format parts

- **System Design:** `W26100423LX-REQ1@R2 → DES2 → S2 → V4`
- **UI Design:** `None`
- **Evidence:** `src/core/features/notes/daily.ts:72-74` trims only part `0` and the last part:

  ```ts
  let text = part.literal;
  if (i === 0) text = text.trimStart();
  if (i === parts.length - 1) text = text.trimEnd();
  ```

  `formatParts` emits each unbracketed non-token character as its own part, so `"  YYYY-MM-DD"` gives two leading `" "` parts and only the first is trimmed, while `dailyPath` trims the whole title. Probe over 800 consecutive days: `"  YYYY-MM-DD"`, `"[ ] YYYY-MM-DD"`, and `"YYYY-MM-DD  "` return `undefined` for every path `dailyPath` produced (e.g. `j/2025-12-25.md`). The §7 invariant says `parseDailyDate(dailyPath(cfg, d).path, cfg)` equals `d` for every format with year, month, and day tokens.
- **Impact:** With such a format, `:Yesterday`/`:Tomorrow` on a daily note step from today instead of the note's date (S2), which opens the wrong day.
- **Required resolution:** The pattern drops all whitespace that `dailyPath`'s `trim()` removes: leading whitespace across consecutive leading literal parts and trailing whitespace across consecutive trailing literal parts. One way: merge adjacent literal parts before trimming.
- **Required proof:** A `daily.test.ts` case that round-trips `"  YYYY-MM-DD"`, `"[ ] YYYY-MM-DD"`, and `"YYYY-MM-DD  "` for several dates. `bun run check` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G1-VER3 — Minor — Correctness — A new key appended to an indented property map makes the frontmatter invalid

- **System Design:** `W26100423LX-REQ10@R2 → DES8 → S18 → V34`
- **UI Design:** `None`
- **Evidence:** `src/core/lang/markdown/frontmatter-patch.ts:175-182` always inserts the new `key: value` line at column 0 before the closing `---`. Probe: `patchFrontmatter("---\n  a: 1\n---\n", { set: "b", value: 2 })` → `ok: true`, text `"---\n  a: 1\nb: 2\n---\n"`. `parseDocument("  a: 1\nb: 2")` reports 3 errors (`Unexpected scalar at node end`, …). The §6/§7 invariant says the result re-parses to the input object with only the patched key changed.
- **Impact:** A valid but indented frontmatter block becomes unreadable after a Bases edit or template merge, so every property of that note disappears from the index and from Obsidian. The input shape is uncommon, so the risk is limited.
- **Required resolution:** Either append the new line with the map's own indentation or return `{ ok: false, reason }` when the patched block does not re-parse to the expected object. Text is never written as invalid frontmatter.
- **Required proof:** A `frontmatter-patch.test.ts` case on `"---\n  a: 1\n---\n"` that either keeps `{ a: 1, b: 2 }` on re-parse or returns `ok: false`. `bun run check` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:** DST-safe day and month arithmetic and process-local field reading (`local.test.ts`); every supported token, midnight and noon meridiem, all ordinals, weekday numbers, unsupported tokens kept whole, bracket and backslash escapes (`format.test.ts`); daily paths for flat, subfolder, month-name, and root formats, round-trips over 5 formats × 3 folders × 4 dates, case-insensitive parsing, and rejection of non-daily paths (`daily.test.ts`); Obsidian expansion rules including `$&`, defaults, case, and unknown braces (`template.test.ts`); set, add, remove, and remove-last on a CRLF fixture with comments, quoted keys, and block lists, with `applySpanEdits` equality for every patch; scalar↔list changes, empty values, no-op patches, refused flow, duplicate, and non-map blocks, typed scalars, `frontmatterValue`, `splitFrontmatter`, and merge with and without a block (`frontmatter-patch.test.ts`); defaults, normalization, root rules, outside-workspace paths, empty format, and unknown keys with lines (`schema.test.ts`).
- **Missing:** Alias-shaped text values and frontmatter with an unresolved alias (assert no throw; see `P1-G1-VER1`). Multi-part leading or trailing whitespace in the daily format round-trip (`P1-G1-VER2`). Appending to an indented top-level map (`P1-G1-VER3`). The exact V15 flow-list note `tags: [work]` with a template list is checked only by this verification's probe, not by a test.

## Scope Changes

Each deviation was checked against the governing design and, where it applies, Moment 2.29.4 or Obsidian behavior.

| Deviation | Evidence | Judgment |
|---|---|---|
| Optional `date` flag on the set patch and a third `yamlScalar` parameter | `frontmatter-patch.ts:22-24`, `:400-404` | Accepted. V34b needs text `"2026-10-05"` quoted and a date written plain, and §6 `FrontmatterValue` cannot tell them apart. The addition is optional, so the declared §6 shapes still type-check. Part 2 must pass `date: true` for `date` properties. |
| `mergeFrontmatter` always writes date-shaped strings plain | `frontmatter-patch.ts:370` | Accepted. Research RF5 records that Obsidian stringifies with eemeli `yaml` (YAML 1.2), which writes a `2026-10-05` string plain, so Obsidian's own merge drops the quotes too. |
| A backslash escapes the whole next Moment token, not one character | `format.ts:192-196` | Accepted as conforming. This contradicts the literal wording of §7 and the REQ3@R2 acceptance criterion ("escapes the next character"). It does match Moment 2.29.4 (`\\YYYY` → `YYYY` in both), which REQ3@R2 and the §7 invariant require, and the differential run found 0 mismatches. The design and requirement wording should be aligned by their owner; no code change is required. |
| `Hmm`/`hmm`/`Hmmss`/`hmmss` absent from `MOMENT_TOKENS` | `format.ts:3-7` | Accepted. Moment renders them exactly as their parts; verified: `hmm` → `905`, `Hmmss`/`hmmss` → `90500` in both. |
| `MOMENT_TOKENS` adds `yyyy`/`yyy`/`yy`/`yo`/`y`, `N`–`NNNNN`, `ggggg`/`GGGGG`, `zz`/`z` beyond the §7 sketch | `format.ts:14-78` | Accepted. These are Moment 2.29.4 tokens, and listing them only keeps unsupported tokens whole. |
| `"[unclosed"` → `"[unclo0e6"` | `format.test.ts`, brackets test | Accepted. The design left this string to be documented. Moment gives `[unc10/3/2026o066` because it expands `l` and `e`, which are unsupported in `so` by design. |
| `formatParts`/`FormatPart` exported from `format.ts` | `format.ts:176-203`; used by `daily.ts:67` | Accepted. §7 asks `parseDailyDate` to use "the same tokenizer"; the export avoids a second scan. |
| `LocalDateTime` has no `ms` field | `local.ts:2-8` | Accepted. §7 (authoritative) has no `ms`; only the plan preview showed it. |
| New `schema.test.ts`; `toml.test.ts` edited | `git diff fb86f9c b912315 -- src/core/config/toml.test.ts` | Accepted. The planned file did not exist. The `toml.test.ts` edits swap the example unknown key (`daily` → `calendar`) and add the new defaults to a whole-config comparison; no assertion was weakened. |
| `parseBlock` calls `parseDocument` without `keepSourceTokens` | `frontmatter-patch.ts:76` | Accepted. Node `range` values, which the splice uses, are present without it. |

## Unverified Items

- Obsidian 1.13.7 template expansion was not executed. `expandTemplate` matches the §7 regexes and order verbatim, and V13 passes.
- Obsidian's type inference for `"2026-10-05 10:30"` (space separator) and `"1_000"` was not checked. `yamlScalar` writes both plain, and `yaml` reads both back as the same text. Neither value is in an assigned V case.

## Blockers

None
