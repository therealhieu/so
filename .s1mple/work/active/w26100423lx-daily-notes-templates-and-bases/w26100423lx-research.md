# W26100423LX: daily-notes-templates-and-bases — Research

**Context Source:** `w26100423lx-discuss-context.md`

**Requirements Source:** `w26100423lx-requirements.md`

**Requirements Baseline Commit:** `65cb3e4`

**Evaluated Requirement Revisions:** W26100423LX-REQ1@R1, W26100423LX-REQ2@R1, W26100423LX-REQ3@R1, W26100423LX-REQ4@R1, W26100423LX-REQ5@R1, W26100423LX-REQ6@R1, W26100423LX-REQ7@R1, W26100423LX-REQ8@R1, W26100423LX-REQ9@R1, W26100423LX-REQ10@R1, W26100423LX-REQ11@R1, W26100423LX-REQ12@R1, W26100423LX-REQ13@R1

**Research Policy:** One substantive research pass; immutable after acceptance and commit.

# Table of Contents

1. [Research Objective](#1-research-objective)
2. [Research Findings](#2-research-findings)
   - [RF1: Kanban type string is not yet confirmed by an Obsidian-saved file](#rf1-kanban-type-string-is-not-yet-confirmed-by-an-obsidian-saved-file)
   - [RF2: Column order and hidden columns live in groupOrder](#rf2-column-order-and-hidden-columns-live-in-grouporder)
   - [RF3: Obsidians Bases parser is strict where Alfreds is lenient](#rf3-obsidians-bases-parser-is-strict-where-alfreds-is-lenient)
   - [RF4: Expressions Obsidian saves today exceed Alfreds subset in ways that hide rows](#rf4-expressions-obsidian-saves-today-exceed-alfreds-subset-in-ways-that-hide-rows)
   - [RF5: Property types come from types.json or value shape and Obsidian rewrites the whole frontmatter](#rf5-property-types-come-from-typesjson-or-value-shape-and-obsidian-rewrites-the-whole-frontmatter)
   - [RF6: Template variables are case-insensitive but not whitespace-tolerant](#rf6-template-variables-are-case-insensitive-but-not-whitespace-tolerant)
   - [RF7: Daily notes use local time never overwrite and title is the full formatted date](#rf7-daily-notes-use-local-time-never-overwrite-and-title-is-the-full-formatted-date)
   - [RF8: Template insertion merges template properties and new notes default to the vault root](#rf8-template-insertion-merges-template-properties-and-new-notes-default-to-the-vault-root)
   - [RF9: Moment output for the supported tokens is confirmed but Moment tokenizes greedily](#rf9-moment-output-for-the-supported-tokens-is-confirmed-but-moment-tokenizes-greedily)
3. [Sources](#3-sources)
4. [Confidence and Open Questions](#4-confidence-and-open-questions)

# 1. Research Objective

The Kanban `type` value cannot ship until it is confirmed against a `.base` file saved by Obsidian 1.14 or later (W26100423LX-REQ9@R1; `w26100423lx-requirements.md:147-148`), and the local Obsidian cannot produce one. The rest of DI4 also assumes facts about Obsidian that the requirements state without external evidence (`**Research Source:** None`, `w26100423lx-requirements.md:7`): the Bases file syntax Obsidian writes today, how Obsidian types and writes frontmatter, how the core Templates and Daily notes plugins expand variables, and Moment.js output. This pass checks those assumptions against primary sources: official help sources, changelogs, the `obsidian.d.ts` API typings, the Obsidian app bundle, and Moment.js source. The findings can inform the requirement reconciliation: whether REQ9's gate can be met, what parse and diagnostic boundaries REQ7 needs, what REQ10's "same property type" criterion means, and whether the template and daily-note claims in REQ1, REQ3, REQ4, and REQ5 match Obsidian.

Two facts about the environment changed during this pass. The installed Obsidian app updated itself from 1.12.7 to 1.13.7 at 13:35 local time on 2026-10-04: `~/Library/Application Support/obsidian/` now holds `obsidian-1.13.7.asar`, and the 1.12.7 asar is gone. The research did not trigger this, and Obsidian was already running. Bundle evidence below comes from the 1.12.7 asar, read before the update, and from the public 1.13.7 asar, downloaded to the session scratchpad from the GitHub release. Neither bundle was extracted or committed.

**Research Questions:**

- In which Obsidian version did the Kanban (board) Bases layout ship? Is it a core layout or early access? What exact string does Obsidian write as the view `type`, and what YAML key and shape does it use for the group-by property, column order, and the empty "None" column? Is there a public `.base` file saved by Obsidian 1.14+, with identifiable provenance, that could serve as the required fixture? Does the evidence suffice as "confirmed against an Obsidian 1.14+ file", and if not, what would?
- What is the current official Bases file syntax? Which syntax or functions introduced in Obsidian 1.10–1.14+ differ from or exceed Alfred's parser, evaluator, and expression subset, and which of those cause parse failures versus diagnostics?
- How does Obsidian write frontmatter property values by type when editing through its Properties UI or Bases, and how does it decide a property's type (`.obsidian/types.json`)?
- How do the core Templates and Daily notes plugins handle variable syntax (case, whitespace, `{{title}}`, format suffixes), default formats, an existing daily note, the clock and timezone, and the default new-note location? Do REQ1, REQ3, REQ4, and REQ5 match?
- What are Moment.js 2.x `en` outputs for the supported tokens at 2026-10-03T09:05:00 local time, and for the midnight/noon, `Do`, and `d` edge cases?

# 2. Research Findings

## RF1: Kanban type string is not yet confirmed by an Obsidian-saved file

**Question:** In which version did Kanban ship, is it core or early access, what `type` string does Obsidian write, and does any public Obsidian 1.14+ `.base` file qualify as the fixture?

**Finding:** Kanban is a core Bases layout. It first shipped in Obsidian 1.14.0 Desktop on 2026-09-02 and is still early access (Catalyst only) through 1.14.4 on 2026-10-01. The public release channel is still on 1.13.x. No primary source states the YAML `type` string: not the help page, not the 1.14.x changelogs, and not the 1.14.4 `obsidian.d.ts`. The only explicit claim that native Kanban serializes as `type: kanban` comes from a third-party issue. Every public `.base` file found with `type: kanban` predates 1.14.0 and belongs to the Base Board community plugin, which used the same string first. One file dated after 1.14.0 was hand-written by another tool, not saved by Obsidian. **The evidence does not meet "confirmed against an Obsidian 1.14+ file".** `kanban` is the likely value, but it is unverified.

**Requirements Evaluated:**

- `W26100423LX-REQ9@R1` — Kanban view behind a `KANBAN_TYPE` constant confirmed against an Obsidian 1.14+ `.base` with recorded provenance; table fallback until then.
- `W26100423LX-REQ7@R1` — view types resolve through a registry; unknown types open as a table with a notice.
- `W26100423LX-REQ13@R1` — DI4 is delivered only with its verification evidence, including the Kanban fixture provenance the phase exit needs.

**Potential Requirement Impact:** This supports REQ9's gate and table fallback as written, because the value is still unconfirmed. It adds three considerations:

- **The fixture can only come from an early-access build or a later public release.** Neither is available locally: the installed Obsidian is now 1.13.7, and 1.13.7 has no Kanban layout.
- **`type: kanban` alone does not prove native semantics.** Base Board vaults use the same string with plugin-only keys (`boardColumns`, `cardTitleProperty`), so a provenance record should show the file was saved by core Obsidian with the plugin absent.
- **The phase exit may stay blocked.** REQ9 already says DI4 is not reported as delivered without the constant, so the user may need to supply the fixture before the phase exit.

**Evidence:**

- The Kanban help page says "Kanban views require Obsidian 1.14 which is currently in early access". It describes the **Group by** property, a **None** column for files without a value, and settings (hide empty columns, column width, image property, fit, aspect ratio), but gives no YAML. It was added in help commit `09510a4a7e` on 2026-09-04 — [Kanban view (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Layouts/Kanban%20view.md), [Views (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Views.md).
- The 1.14.0 Desktop early-access changelog (2026-09-02) says: "Added a new kanban layout to display files in ordered columns. Use Group by to define the columns, then drag and drop to reorder them." — [Obsidian 1.14.0 Desktop (Early access)](https://obsidian.md/changelog/2026-09-02-desktop-v1.14.0/).
- 1.14.4 Desktop (2026-10-01) is still labeled early access — [Obsidian 1.14.4 Desktop (Early access)](https://obsidian.md/changelog/2026-10-01-desktop-v1.14.4/).
- The public manifest lists `latestVersion` 1.13.7, and a separate `beta` entry lists 1.14.4 at `releases.obsidian.md`. This pass did not download the early-access build — [desktop-releases.json](https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/desktop-releases.json).
- In the 1.14.4 typings, `BasesConfigFileView.type` is documented only as a "Unique identifier for the view type". No Kanban constant appears — [obsidian.d.ts at "Update to Obsidian 1.14.4"](https://github.com/obsidianmd/obsidian-api/blob/40301c12bb/obsidian.d.ts).
- A third-party issue (2026-09-14) states that Obsidian 1.14 native Kanban and Base Board 2.5.1 "claim the same identifier", `kanban`. It warns that "a blind vault-wide replacement of `type: kanban` is unsafe after Obsidian 1.14". The issue is unanswered and open — [mderazon/obsidian-base-board#62](https://github.com/mderazon/obsidian-base-board/issues/62). A second plugin issue confirms the name collision only at the display-name level ("Kanban") — [xiwcx/obsidian-bases-kanban#114](https://github.com/xiwcx/obsidian-bases-kanban/issues/114).
- These public files contain `type: kanban`, and none qualifies:
  - [timscheuerai/content-vault `content/Content.base`](https://github.com/timscheuerai/content-vault/blob/a970acf9de389cf70c3293bb275542dc5bb906f8/content/Content.base) — last commit 2026-06-22; uses `boardColumns`.
  - [DevMandalia/Solaris `Board.core.base`](https://github.com/DevMandalia/Solaris/blob/80d5e73a3c83561aad677e8e5b442b7521f49fc0/src/solaris/data/base/Board.core.base) — 2026-08-02; uses `cardTitleProperty`.
  - [xupisco/obsidian-sample-vault `Tasks - Reloaded.base`](https://github.com/xupisco/obsidian-sample-vault/blob/4b0ccdacd01b58b920209f21c5c5295fa2ae58b5/Assorted/Bases/Tasks%20-%20Reloaded.base) — 2026-06-28; uses `cardOpenBehavior` and `columnColors`.

  All three predate 1.14.0 and use Base Board keys.
- The one post-1.14 file, [Mootikins/crucible `assets/fixtures/bases/Tasks.base`](https://github.com/Mootikins/crucible/blob/378f4b5d98e503fbc86507b393567db000e18726/assets/fixtures/bases/Tasks.base) (commit 2026-09-27), uses `type: kanban` with `groupOrder`. It is a test fixture for another tool and is written in YAML flow style (`groupBy: {property: note.status, direction: ASC}`), which Obsidian's serializer does not emit (RF5). It is not Obsidian-saved.
- In the bundles, Bases registers view types only through a factory map: 1.12.7 registers `table`, `cards`, and `list`, and 1.13.7 shows the same `table` and `list` constants. Neither bundle contains a Bases Kanban view; the only "kanban" strings belong to Mermaid and Lucide icons. Map is plugin-provided through `registerBasesView` — [Obsidian v1.13.7 release asset](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7).

**Rationale and Examples:** REQ9 requires "a test parses the recorded Obsidian 1.14+ fixture" and records "Obsidian version and where the file came from" (`w26100423lx-requirements.md:469-470`). A file that would satisfy it looks like this:

```text
Obsidian ≥ 1.14.3 (early access or later public), Base Board plugin disabled
  → Create new base → Add view → Kanban → Group by: status → drag one column
  → save → copy the .base unchanged into test/fixtures with a provenance note:
     Obsidian version (Settings → About), installer version, OS, date, steps
  → test: parse fixture, assert views[i].type === KANBAN_TYPE
```

Using ≥ 1.14.3 also captures `groupOrder` (RF2), so the same fixture covers column order.

**Tradeoffs and Limitations:**

- The `kanban` claim is consistent across two independent plugin issues, and Obsidian names the layout "kanban" in its changelog. That supports `kanban` as the probable value, but the gate requires a saved file, not inference.
- GitHub code search returns only some public files, and recent commits may not be indexed. A qualifying file may exist that this pass did not find.

**Reconciliation Considerations:**

- Should the requirement name who supplies the fixture (for example, the user with an early-access licence), or should it wait for the public 1.14 release, given that DI4 merges last in PH2?
- Should the provenance record also state that no community Kanban plugin was enabled when the file was saved?

## RF2: Column order and hidden columns live in groupOrder

**Question:** What YAML shape does Obsidian 1.14 use for the group-by property, column order, and the "None" column, and how do 1.14.x board semantics compare with REQ9?

**Finding:** Grouping uses the view-level `groupBy: {property, direction}` shared by all layouts. Since 1.14.3, each view may also carry `groupOrder`, a list of group values. When it is set, only those groups appear, in that order, and `null` stands for the "None" (no value) group. The toolbar **Group** menu can reorder, hide, and add groups "in any view type", so `groupOrder` affects table groups as well as Kanban columns. 1.14.2 also lets cards move between columns when grouped by `file.folder`, which moves the file. The help page was written before 1.14.2 and still says no card moves when grouping by a file property. Alfred's evaluator ignores `groupOrder`: it builds groups from distinct values sorted by `groupBy.direction`.

**Requirements Evaluated:**

- `W26100423LX-REQ9@R1` — columns follow the distinct values of the group-by property, plus `None`; moves are disabled for formula or `file.*` grouping.
- `W26100423LX-REQ8@R1` — table grouping and sort match the ported Alfred fixtures.
- `W26100423LX-REQ11@R1` — embeds render the named view.

**Potential Requirement Impact:** This challenges REQ9's "Columns follow the distinct values of the group-by property" (`w26100423lx-requirements.md:471`) for any base saved by Obsidian ≥ 1.14.3 with a manual column order. On such a base, `so` would show columns Obsidian hides, in a different order, and could omit empty columns Obsidian shows. The same applies to grouped tables (REQ8) and embeds (REQ11). REQ9's ban on moves when grouping by `file.*` is stricter than Obsidian ≥ 1.14.2 for `file.folder`. That is safe, because `so` writes no file moves here, but it is a known divergence.

**Evidence:**

- `groupOrder?: FrontmatterValue[]` is documented as "Ordered list of the groupBy values to show. When set, only these groups appear, in this order. `null` is the group of entries with no value", `@since 1.14.3` — [obsidian.d.ts 1.14.4](https://github.com/obsidianmd/obsidian-api/blob/40301c12bb/obsidian.d.ts).
- 1.14.3 Desktop: "Added a Group menu to the toolbar for choosing the property to group by. Use it to reorder, hide, and add groups by hand in any view type." — [Obsidian 1.14.3 Desktop](https://obsidian.md/changelog/2026-09-29-desktop-v1.14.3/).
- 1.14.4 Desktop: "Fixed a base failing to load when a view's groupOrder is not a list", and "Added 'Hide column' to the right-click menu of a kanban column" — [Obsidian 1.14.4 Desktop](https://obsidian.md/changelog/2026-10-01-desktop-v1.14.4/).
- 1.14.2 Desktop: "Kanban: Cards can now be moved between folder columns when grouped by file.folder", plus error feedback "when the note has invalid properties" — [Obsidian 1.14.2 Desktop](https://obsidian.md/changelog/2026-09-15-desktop-v1.14.2/).
- Help: "If you group by a formula or file property, you can't move cards or columns… Only Markdown notes can be moved between columns." Last changed 2026-09-04, before 1.14.2 — [Kanban view (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Layouts/Kanban%20view.md).
- `groupBy` is `{property, direction}` in the official syntax — [Bases syntax (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Bases%20syntax.md).

**Rationale and Examples:** This is an inferred shape for a 1.14.3+ board. The key names are documented, but the full file is unverified until a fixture exists (RF1):

```yaml
views:
  - type: kanban          # unverified (RF1)
    name: Board
    groupBy:
      property: status
      direction: ASC
    groupOrder:
      - todo
      - doing
      - done
      - null              # the "None" column; omit it to hide that column
```

Alfred groups without `groupOrder` (`alfred/packages/vault/src/domain/bases/evaluator.ts:298-318`), and REQ9 encodes the same rule.

**Tradeoffs and Limitations:**

- How 1.14.0–1.14.2 persisted the column order that 1.14.0 already allowed is undocumented. It may also have been `groupOrder`, typed later.
- Whether `groupOrder` lists values in their YAML type (number, boolean, string) is implied by `FrontmatterValue[]` but not shown in an example.

**Reconciliation Considerations:**

- Should REQ9 and REQ8 honor `groupOrder` read-only (order, hide, explicit empty groups, `null` = None) when present? Writing it stays out of scope, because `.base` files are never written.
- Should REQ9's move rule distinguish `file.folder` from other `file.*` properties, or keep the stricter rule with an explanation?

## RF3: Obsidians Bases parser is strict where Alfreds is lenient

**Question:** What is the current official Bases file syntax, and which constructs would make Alfred's parser fail rather than produce a diagnostic?

**Finding:** Obsidian 1.12.7 and 1.13.7 parse `.base` YAML with the same rules:

- **Top level:** `filters`, `formulas`, `properties`, `summaries`, `views`, legacy `display`, and `newItemFolder`/`newItemTemplate`. Unknown top-level keys are kept and written back.
- **View required keys:** each view needs a string `name` and a string `type`, or the whole base fails to load.
- **View known keys:** `filters`, `groupBy` (an object that must contain both `property` and `direction`), `summaries` (an object of strings), `order` (an array), `sort` (an array of `{property, direction}`, with legacy `column` accepted for `property`), and `limit` (> 0).
- **Other view keys:** any other key (`columnSize`, `rowHeight`, card and Kanban options, `groupOrder`) is stored as view data and preserved.
- **Property ids:** bare names mean `note.<name>`. Obsidian writes `order`, `sort`, `groupBy`, and per-view `summaries` with the `note.` prefix stripped. `columnSize` keys keep internal ids such as `note.status`.

Alfred's parser throws only on invalid YAML. It accepts every shape above (and more), passes unknown view keys through, and resolves both `x` and `note.x`. **At the parser level, no file Obsidian saves today makes Alfred fail.** The divergences are semantic. Alfred's evaluator ignores a legacy `sort[].column`. It has no evaluation of view `summaries`, neither the 15 default summary names nor custom `values.…` summary formulas. It renders an unknown view type as zero rows with a diagnostic, whereas Obsidian shows an "unknown view type" error.

**Requirements Evaluated:**

- `W26100423LX-REQ7@R1` — parse with Alfred's subset; unsupported syntax becomes a diagnostic; a parse failure shows the error and no rows; unknown types fall back to a table.
- `W26100423LX-REQ8@R1` — rows, column order, sort, grouping, and summaries match the ported Alfred fixtures.
- `W26100423LX-REQ12@R1` — re-parse when the `.base` file changes, keeping the selected view by name.

**Potential Requirement Impact:** This supports REQ7's parse/diagnostic split: only invalid YAML needs the "parse error, no rows" path. It adds two considerations:

- **Summaries need their own source.** REQ8's "summaries match the ported Alfred fixtures" (`w26100423lx-requirements.md:433`) has no Alfred implementation to port, so summary semantics need an explicit source, such as Obsidian's 15 default names.
- **The table fallback is `so`'s own behavior.** Obsidian rejects some files Alfred accepts (string `groupBy`, a view without `name`), and it errors on an unknown view type instead of falling back. Both are acceptable because `so` never writes `.base` files, but the fallback is a `so` choice, not Obsidian behavior.

**Evidence:**

- The official schema covers top-level `filters`, `formulas`, `properties`, `summaries`, and `views`; per-view `type`, `name`, `limit`, `groupBy {property, direction}`, `filters`, `order`, and `summaries`; the 15 default summary formulas (Average, Min, Max, Sum, Range, Median, Stddev, Earliest, Latest, date Range, Checked, Unchecked, Empty, Filled, Unique); and custom summaries using `values`. "Views can add additional data to store any information needed" — [Bases syntax (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Bases%20syntax.md).
- Typings: `BasesConfigFileView` has `type`, `name`, `filters`, `groupBy`, `groupOrder` (1.14.3), `order`, and `summaries` — [obsidian.d.ts 1.14.4](https://github.com/obsidianmd/obsidian-api/blob/40301c12bb/obsidian.d.ts).
- The 1.13.7 bundle shows the same view-key switch as 1.12.7: `filters`, `groupBy`, `summaries`, `order`, `sort`, `limit`, with `default:` storing everything else as view data. It shows the same top-level destructuring (`views`, `filters`, `display`, `properties`, `formulas`, `summaries`, `newItemFolder`, `newItemTemplate`) — [Obsidian v1.13.7 release asset](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7).
- 1.14.4 typings change `createFileForView`'s callback and add `groupOrder`, with no other Bases config changes since 1.13.2 — [obsidian-api commit 40301c12bb](https://github.com/obsidianmd/obsidian-api/commit/40301c12bb).

**Rationale and Examples:** The 1.12.7 bundle's view parser (`TY`, read before the update) shows the strict branches:

```js
if (!r || "string" != typeof r) throw new Error(msgErrorViewNameInvalid(...))
case "groupBy": if ("object" != typeof u || !Object.hasOwn(u,"property") || !Object.hasOwn(u,"direction")) throw ...
case "sort": ... k.column && (k.property = k.column) ...
default: a.data || (a.data = {}), a.data[c] = i[c]
```

Alfred is lenient by design: `parseBaseSource` catches only YAML errors (`alfred/packages/vault/src/domain/bases/parser.ts:22-61`), keeps unknown view keys through `...rest` (`parser.ts:108-125`), and accepts a string `groupBy` (`parser.ts:131-134`). Its evaluator resolves `note.x` and bare `x` the same way (`evaluator.ts:750-765`), returns no rows for types outside `table`, `board`, `gallery`, `list` (`evaluator.ts:162-197`), and stores `summaries` without evaluating them: the only `summaries` references are in `parser.ts:34` and `types.ts:28,46`.

**Tradeoffs and Limitations:**

- Bundle evidence is minified code from 1.12.7 and 1.13.7. 1.14.x may add keys beyond `groupOrder`, such as Kanban option names, that are not in the public typings.

**Reconciliation Considerations:**

- Name the source of truth for view summaries, or scope summaries to a subset with a diagnostic for the rest.
- Decide whether a view without `name`, or with a malformed `groupBy`, should produce a diagnostic, so users learn that Obsidian will reject the file.

## RF4: Expressions Obsidian saves today exceed Alfreds subset in ways that hide rows

**Question:** Which expression syntax and functions in current Obsidian Bases exceed Alfred's expression subset, and do they cause diagnostics, wrong rows, or failures?

**Finding:** Obsidian's expression language is much larger than Alfred's:

- **Strings:** single- or double-quoted.
- **Access:** `note["x"]` and `[0]` indexing.
- **Methods:** methods on every type (`status.contains("x")`, `.isEmpty()`, `.format()`).
- **Global functions:** `if`, `now`, `today`, `date`, `duration`, `link`, `list`, `file`, `image`, `icon`, `html`, `escapeHTML`, `max`, `min`, `number`, `random`.
- **Other syntax:** `this`, date ± duration strings, regex literals, and lambdas such as `.filter(value…)`.

Alfred supports literals, double-quoted strings, operators, `note.`/`file.`/`formula.` properties, and only `file.hasTag`, `file.inFolder`, and `file.hasProperty`. Anything else raises an `unsupported_expression` diagnostic, so nothing crashes. A failing filter, however, evaluates to "exclude". A base whose global filter uses unsupported syntax therefore renders zero rows. Two supported functions also have different semantics, which changes rows silently:

| Expression | Obsidian | Alfred |
|---|---|---|
| `file.inFolder("Projects")` | folder or any subfolder | exact folder only |
| `file.hasTag("a","b")` | any listed tag, including nested `#a/x` | first argument only, exact match |

**Requirements Evaluated:**

- `W26100423LX-REQ7@R1` — Alfred's expression subset; unsupported expressions become diagnostics; "a base with one bad formula still renders its other columns and rows".
- `W26100423LX-REQ8@R1` — rows match the ported Alfred fixtures.
- `W26100423LX-REQ11@R1` — embeds render the evaluated view.

**Potential Requirement Impact:** This supports REQ7's diagnostic approach for formulas. It adds two considerations:

- **Unsupported filters hide rows.** REQ7's "still renders its other columns and rows" holds for formulas, but an unsupported filter removes every row it guards. REQ7's acceptance criteria do not cover that case.
- **Exact-folder `inFolder` silently drops rows.** `inFolder` is the filter Obsidian's own docs use first, and Alfred's exact-folder behavior drops notes in subfolders without any diagnostic, so `so` would show fewer rows than Obsidian. The DI4 boundary forbids widening the subset beyond Alfred's. Correcting the semantics of a function already in the subset may still be within scope, but that is a judgment for reconciliation.

**Evidence:**

- "Text literals must be enclosed in single or double quotes"; `note["price"]`; `property[0]`; `this`; date arithmetic such as `file.mtime > now() - "1 week"` — [Bases syntax (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Bases%20syntax.md).
- The function list includes the globals above, the String/Number/List/Date/Link/File/Object/Regex methods, `file.inFolder`: "Returns true if the file is in the specified folder or one of its sub-folders", and `file.hasTag(...values)`: "any of the tags… includes any nested tags" — [Functions (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Functions.md).
- A real vault base (last commit 2026-04-25) uses single quotes inside expressions, `this.file.hasTag(...)`, `link(...)`, `.contains(...)`, `.isEmpty()`, `if(...)`, regex `/^.*\//`, `.filter(value…)`, and `html(...)` — [Selogaz/Obsidian-vault-cpp `home/databases/tasks.base`](https://github.com/Selogaz/Obsidian-vault-cpp/blob/b3fad8558daa12468a00f2bc7101d5d83bda4fc4/home/databases/tasks.base).

**Rationale and Examples:** The relevant Alfred code:

```ts
// alfred/packages/vault/src/domain/bases/expression.ts:284 — only double quotes start a string
if (character === '"') {
// expression.ts:321 — a single quote or a bracket throws
throw new Error(`Unsupported token: ${character}`);
// expression.ts:178,186-188 — only file.* methods; inFolder is an exact match
if (scope !== "file" || !isFileMethod(method)) { throw ... }
if (method === "inFolder") { return this.context.file.folder === String(firstArg); }
// evaluator.ts:392 — any diagnostic excludes the row
return result.diagnostics.length === 0 && Boolean(result.value);
```

```text
filters: file.inFolder("Projects")   note at Projects/2026/a.md
  Obsidian → row shown        Alfred → row hidden, no diagnostic
filters: status.contains('todo')
  Obsidian → matching rows    Alfred → unsupported_expression; every row hidden
```

The user's own vault has 101 `.base` files with 104 views, all of type `table`. None uses functions beyond Alfred's subset, so the local compatibility check would not exercise these gaps.

**Tradeoffs and Limitations:**

- Fixing `inFolder`/`hasTag` semantics keeps the subset's surface but changes behavior that Alfred's tests may pin. Widening the surface (single quotes, method calls) is a design change under the downstream boundary.

**Reconciliation Considerations:**

- Should REQ7 require a visible "filter unsupported — rows hidden" state, separate from formula diagnostics?
- Should `file.inFolder` (subfolders) and `file.hasTag` (any argument, nested tags) follow Obsidian, given that both are already in Alfred's subset?
- Is accepting single-quoted string literals a tokenizer fix or a subset widening?

## RF5: Property types come from types.json or value shape and Obsidian rewrites the whole frontmatter

**Question:** How does Obsidian decide a property's type and write values by type, and what does "reads back with the same property type" require?

**Finding:** Obsidian decides a property's type as follows:

1. **Assigned type.** If `.obsidian/types.json` assigns a type to the property name (matched case-insensitively) and the value validates against it, that type wins.
2. **Inferred type.** Otherwise the type is inferred from the parsed value:

   | Parsed value | Inferred type |
   |---|---|
   | string matching `^\d{4}-[01]\d-[0-3]\d$` | date |
   | string matching `^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d$` | datetime |
   | other string, null, or empty | text |
   | number | number |
   | boolean | checkbox |
   | array | multitext ("List") |

   `tags` and `aliases` have fixed types.

Values that keep their type:

| Type | Written as |
|---|---|
| date | `YYYY-MM-DD` |
| datetime | `YYYY-MM-DDTHH:mm:ss` (seconds included) |
| number | YAML number |
| checkbox | `true` or `false` |
| list | block sequence |
| text | YAML string, quoted when it would otherwise parse as another type |

Obsidian's own frontmatter writes (`processFrontMatter`) parse the block into an object, mutate it, and re-serialize the **whole** block with the `yaml` library (`nullStr: ""`, `lineWidth: 0`, `aliasDuplicateObjects: false`). Comments and original quoting are lost. An empty result removes the `---` block, and a note without frontmatter gets `---\n…---\n` prepended. Alfred's `applyFrontmatterPatch` also re-stringifies the whole object, so a direct port cannot meet REQ10's comment- and quoting-preservation criteria.

**Requirements Evaluated:**

- `W26100423LX-REQ10@R1` — patch exactly one key, preserve comments, key order, and quoting; add a block when missing; values read back with the same property type.
- `W26100423LX-REQ8@R1` — type-specific cell editors for text, number, date `YYYY-MM-DD`, list, and checkbox.

**Potential Requirement Impact:** This supports REQ10's type list and date format: unquoted `YYYY-MM-DD`, YAML numbers, booleans, and block lists read back with the same type, in both `types.json`-assigned and inferred cases. It also supports REQ10's preservation goal, which is stricter than Obsidian and therefore safe, because Obsidian reads any valid YAML. It adds three considerations:

- **Text values need quoting.** A text value that looks like a number, boolean, or date (`"42"`, `"true"`, `"2026-10-05"`) must stay quoted, or Obsidian infers another type unless `types.json` pins it.
- **Removing the last key differs.** For "removing the last key" (`w26100423lx-requirements.md:509`), Obsidian deletes the whole `---` block, while REQ10 keeps valid, possibly empty, frontmatter. Both are readable.
- **The port needs new patching code.** Alfred's patcher (`frontmatter.ts:18-44`) cannot be ported unchanged for REQ10; it needs document-level or span-level patching.

**Evidence:**

- Properties help defines the types (Text, List, Number, Checkbox, Date, Date & time, Tags), date `2020-08-21`, date-time `2020-08-21T10:30:00`, block lists, quoted `"[[Link]]"` values, and says "Once a property type is assigned to a property name, all properties with that name across your vault will use the same type" — [Properties (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Editing%20and%20formatting/Properties.md).
- Obsidian bundles eemeli `yaml` (its YAML 1.2 schema leaves `2026-10-05` a string, as `so`'s `yaml` 2.9.1 does), and the 1.13.7 bundle has the same `processFrontMatter` rewrite and stringify options as 1.12.7 — [Obsidian v1.13.7 release asset](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7).

**Rationale and Examples:** From the 1.12.7 bundle (read before the update):

```js
function NL(e){ ... "string"===t ? FL.test(e)?"datetime" : OL.test(e)?"date" : "text"
                 : "number"===t?"number" : "boolean"===t?"checkbox" : vc(e,!0)?"multitext":"unknown" }
getTypeInfo(e,t){ var i=this.getAssignedWidget(e); if(i&&(n=this.getWidget(i), null==t||n.validate(t))) return {expected:n,inferred:n}; ... }
function vI(e,t){ var n=Xx(e), i=n.exists?mA(n.frontmatter):{}; t(i);
  if(0===Object.keys(i).length) return n.exists?e.slice(n.contentStart):e;
  var r=vA(i); return n.exists ? e.slice(0,n.from)+r+e.slice(n.to) : "---\n"+r+"---\n"+e }
function vA(e){ return stringify(e,null,{nullStr:"",lineWidth:0,aliasDuplicateObjects:!1}) }
// datetime widget: format(e){ return e.format("YYYY-MM-DD[T]HH:mm:ss") }
```

```yaml
# Obsidian moving a card (processFrontMatter)  # REQ10 patch (one key)
---                                            ---
status: doing                                  status: doing   # set by me
due: 2026-10-05                                due: 2026-10-05
---                                            ---
# comment lost                                 # comment kept
```

`so` parses frontmatter with the default `yaml` options (`src/core/lang/markdown/scan.ts:1,235`), the same YAML 1.2 core behavior Obsidian uses, so dates stay strings on both sides.

**Tradeoffs and Limitations:**

- The datetime inference regex has no seconds, while the widget writes seconds. A `HH:mm:ss` value without a `types.json` assignment infers as text. REQ10 does not write datetimes, so this does not affect DI4 today.
- Bases' own cell-edit path in 1.14 was not inspected; it is assumed to use `processFrontMatter` like the other Obsidian writers.

**Reconciliation Considerations:**

- Should REQ10 state the quoting rule for text values that would otherwise parse as another type?
- Should "removing the last key" match Obsidian (drop the block) or keep an empty block? Both are Obsidian-readable.
- Should REQ8's cell editor consult `.obsidian/types.json` when present, so a `number` property is not edited as text?

## RF6: Template variables are case-insensitive but not whitespace-tolerant

**Question:** How exactly does Obsidian expand `{{title}}`, `{{date}}`, `{{time}}`, `{{date:FORMAT}}`, and `{{time:FORMAT}}`?

**Finding:** One function (`QD` in 1.12.7, `ZI` in 1.13.7, unchanged) expands templates for Templates, Daily notes, Unique note creator, and the CLI:

1. **Named variables first.** It replaces each named variable (`title`, or `fromTitle`/`newTitle`/`content` for Note composer) using `new RegExp("{{"+name+"}}","gi")`.
2. **Then date and time.** It replaces `/{{(date|time)(?::(.*?))?}}/gi`, using one `moment()` per expansion. With a format, the format is applied as given; `{{time:YYYY-MM-DD}}` formats a date. Without a format, or with an empty one, `date` uses the Templates "Date format" setting, else `YYYY-MM-DD`, and `time` uses "Time format", else `HH:mm`.

Two consequences follow. Matching is case-insensitive (`{{Title}}`, `{{DATE}}` work). There is **no whitespace trimming**: `{{ title }}` and `{{ Title }}` stay literal, and in `{{date: YYYY}}` the leading space becomes part of the output. Unknown `{{…}}` text is left untouched. Daily notes and Unique note creator pass no format options, so their `{{date}}`/`{{time}}` always use `YYYY-MM-DD`/`HH:mm`.

**Requirements Evaluated:**

- `W26100423LX-REQ3@R1` — case-insensitive names; claims Obsidian "trims spaces inside the braces"; unknown `{{…}}` untouched; defaults `YYYY-MM-DD` and `HH:mm`.
- `W26100423LX-REQ4@R1` — insertion expands variables with `{{title}}` = current note's base name.
- `W26100423LX-REQ5@R1` — new note from a template expands variables.

**Potential Requirement Impact:** This contradicts REQ3's rationale that Obsidian "trims spaces inside the braces" (`w26100423lx-requirements.md:264`). It also contradicts REQ3's example, where `{{ Title }}` expands to `Meeting` (`w26100423lx-requirements.md:269`): Obsidian leaves `{{ Title }}` unchanged. If `so` trims, a template that expands in `so` stays literal in Obsidian, the reverse of "the same text Obsidian's core plugins would" produce (`w26100423lx-requirements.md:54`). Case-insensitivity, the defaults, unknown variables untouched, and `{{time:FORMAT}}` are all confirmed.

**Evidence:**

- Help: `{{title}}` is the "Title of the active note"; `{{date}}` defaults to `YYYY-MM-DD` and `{{time}}` to `HH:mm`; a format string uses Moment.js tokens; "You can use `{{date}}` and `{{time}}` with format strings in the same way, for example `{{time:YYYY-MM-DD}}`"; Daily notes and Unique note creator also accept the variables — [Templates (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Plugins/Templates.md).
- The same expansion function, byte-for-byte except for minified names, is in the 1.13.7 bundle — [Obsidian v1.13.7 release asset](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7).

**Rationale and Examples:** From the 1.13.7 bundle:

```js
function ZI(e,t,n){
  for (var i in t) if (t.hasOwnProperty(i)) { var r=t[i], o=new RegExp("{{".concat(i,"}}"),"gi"); e=e.replace(o,r) }
  var a=null;
  return e=e.replace(/{{(date|time)(?::(.*?))?}}/gi, function(e,t,i){
    return a||(a=window.moment()), i ? a.format(i)
      : "date"===t.toLowerCase() ? a.format(n&&n.dateFormat||QI) : a.format(n&&n.timeFormat||$I) }) }
// QI = "YYYY-MM-DD", $I = "HH:mm"
```

```text
"{{Title}} {{ title }} {{DATE:YYYY}} {{date: YYYY}} {{weather}}"  (title = Meeting, 2026)
  → "Meeting {{ title }} 2026  2026 {{weather}}"
```

**Tradeoffs and Limitations:**

- Two quirks matter only for unusual titles, and REQ3 does not need to copy them. Obsidian passes the title to `String.replace` without escaping, so a `$&` in a title is interpreted. A title containing `{{date}}` is expanded by the second pass.

**Reconciliation Considerations:**

- Should REQ3 drop whitespace trimming to match Obsidian exactly, or keep trimming as a deliberate `so` extension and say so?
- Should REQ3 pin that one clock reading serves the whole expansion, and that an empty `{{date:}}` falls back to the default?

## RF7: Daily notes use local time never overwrite and title is the full formatted date

**Question:** How does the core Daily notes plugin find, create, and open a note, which clock does it use, and what does its template expansion produce?

**Finding:** `getDailyNote(date = moment())` works as follows:

1. **Format.** It formats the date in local time with the "Date format" setting (default `YYYY-MM-DD`) and trims the result.
2. **Folder.** It requires the configured folder to **exist**; otherwise it shows a "folder" error and creates nothing. With no folder set, it uses the default new-file location, which defaults to the vault root.
3. **Lookup.** It looks for `<folder>/<formatted>.md` **case-insensitively** and returns an existing note without writing.
4. **Create.** It reads the template and creates the note with `title` = **the full formatted string**, including any `/` segments. A missing template file shows an error and creates **nothing**.

Template `{{date}}`/`{{time}}` use the **current clock and default formats**, not the target day, and only `{{title}}` reflects the target date. Obsidian's previous/next commands (`daily-notes:goto-prev`, `goto-next`) only navigate to *existing* daily notes. A non-today note is created only from a date property's "open daily note" button, and in that case `{{date}}` still expands to today. Opening sets no special cursor position.

**Requirements Evaluated:**

- `W26100423LX-REQ1@R1` — local date; open if it exists; exclusive create from the expanded template; `/` creates subfolders; `{{title}}` is the note's base name; built-in `# {{date}}` fallback when the template is missing; cursor on the first unchecked task; `:Yesterday`/`:Tomorrow` open or create.
- `W26100423LX-REQ2@R1` — the calendar opens or creates any day through REQ1's path.
- `W26100423LX-REQ6@R1` — `[daily]` `folder`, `format`, `template` defaults.

**Potential Requirement Impact:** This confirms REQ1's local time, open-without-write, and subfolder-from-format behavior. It challenges REQ1 in three places:

- **`{{title}}` with `/` formats.** Obsidian expands `{{title}}` to the whole formatted string, `2026/10/2026-10-03`, not the base name REQ1 requires (`w26100423lx-requirements.md:207`). The two are equal for formats without `/`.
- **`{{date}}` in non-today notes.** For `:Yesterday`, `:Tomorrow`, and calendar-created notes, Obsidian semantics would put today's date in `{{date}}`. The requirements do not say whether `{{date}}` means the target day or now, and the Obsidian-faithful answer, now, is surprising.
- **Missing template.** Obsidian refuses to create the note, whereas REQ1 creates it from `# {{date}}` (`w26100423lx-requirements.md:210`). That is a deliberate `so` UX choice and does not affect file compatibility.

Two further divergences are `so` choices: creating notes on `:Yesterday`/`:Tomorrow` (Obsidian only navigates to existing notes), and REQ6's default folder `daily` (Obsidian's default is the vault root). Obsidian's existence check is case-insensitive. A case-sensitive check in `so` could create `2026-Oct-03.md` beside `2026-oct-03.md` on Linux, though macOS's default file system would return `EEXIST`.

**Evidence:**

- Help: Daily notes "opens a note based on today's date, or creates it if it doesn't exist"; the default name is `YYYY-MM-DD`; "if you set the date format as `YYYY/MMMM/YYYY-MMM-DD`, your notes will be created as `2023/January/2023-Jan-01`"; the template example is `# {{date:YYYY-MM-DD}}` — [Daily notes (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Plugins/Daily%20notes.md).
- The 1.13.7 bundle shows the steps below and the date-property call `a.getDailyNote(this.date)` — [Obsidian v1.13.7 release asset](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7).

**Rationale and Examples:** From the 1.13.7 bundle:

```js
null!=e||(e=window.moment()), o=this.getFormat()                 // default d8 = "YYYY-MM-DD"
r=e.format(o); r&&(r=r.trim())
if (s=i.folder) { if (!((c=getAbstractFileByPath(l)) instanceof TFolder)) return Notice(msgFailFolder), null }
else a=n.fileManager.getNewFileParent("")                        // config default newFileLocation: "root"
if (h=n.vault.getAbstractFileByPathInsensitive(a.getParentPrefix()+r+".md")) ... return existing
(f=getFileByPath(template)) instanceof TFile ? read : (Notice(msgFailTemplateFile), return)
m=ZI(v,{title:r},{}); createNewMarkdownFile(a, r, m)            // {{date}} → window.moment(), default formats
```

```text
format YYYY/MM/YYYY-MM-DD, template "# {{title}} ({{date}})", created on 2026-10-04 for 2026-10-03
  Obsidian → daily/2026/10/2026-10-03.md : "# 2026/10/2026-10-03 (2026-10-04)"
  REQ1     → same path                   : "# 2026-10-03 (?)"   ({{date}} target or now: unspecified)
```

**Tradeoffs and Limitations:**

- Matching Obsidian's `{{date}}`-is-now rule makes calendar-created notes carry the wrong date in common templates. Matching the target date makes `so` differ from Obsidian for the date-property path only. Neither is wrong for file compatibility, because the expanded text is plain Markdown.

**Reconciliation Considerations:**

- Pin `{{title}}` for daily notes: the full formatted string (Obsidian) or the base name (REQ1).
- Pin `{{date}}`/`{{time}}` for non-today daily notes: the target day or now.
- Decide whether the daily-note existence check should be case-insensitive, like Obsidian.

## RF8: Template insertion merges template properties and new notes default to the vault root

**Question:** What does Obsidian's "Insert template" do with the template's frontmatter, what does `{{title}}` resolve to, and where do new notes go by default?

**Finding:** "Insert template" expands the template with `title` = the active file's basename. When the cursor is at line 0, column 0, it inserts the whole expansion, frontmatter included. Otherwise it splits off the template's frontmatter, inserts only the body at the cursor, and **merges the template's properties into the note's properties**: arrays are unioned and existing scalar values are kept. The template picker lists `.md` files under the template folder recursively, sorted by path, and refuses the vault root as the template folder. Obsidian's default "Default location for new notes" is `root`. Obsidian has no core "new note from template" command; Unique note creator expands the template with `title` = the new note's name.

**Requirements Evaluated:**

- `W26100423LX-REQ4@R1` — insert the expansion at the cursor as one undo step; `{{title}}` = current note's base name; list `.md` files under `[templates] folder` including subfolders.
- `W26100423LX-REQ5@R1` — new notes at the workspace root, "Obsidian's default new-note location".
- `W26100423LX-REQ6@R1` — `[templates] folder` default `templates`.

**Potential Requirement Impact:** This confirms REQ4's `{{title}}`, recursive listing, and insert-at-cursor behavior, and REQ5's root default. It adds one consideration. REQ4 inserts the full expansion at the cursor, so a template with frontmatter inserted mid-note would leave a second `---` block in the body. Obsidian merges those properties into the note's frontmatter instead. Merging would also need REQ10-style frontmatter patching to keep the single undo step.

**Evidence:**

- Help: "The content of the template is inserted at your current cursor position", and "When you insert a template into the active note, all the properties from the template will be added to the note. Obsidian will also merge any properties that exist in your note with properties in the template." — [Templates (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Plugins/Templates.md), [Properties (obsidian-help source)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Editing%20and%20formatting/Properties.md).
- The 1.13.7 bundle shows the steps below — [Obsidian v1.13.7 release asset](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7).

**Rationale and Examples:** From the 1.13.7 bundle:

```js
l=ZI(text,{title: s?.basename ?? ""},{dateFormat, timeFormat})
if (0===(c=a.getCursor("from")).line && 0===c.ch) return a.replaceSelection(l)
p=splitFrontmatter(l); a.replaceSelection(p.content); p.frontmatter && r.metadataEditor.insertProperties(p.frontmatter)
// 1.12.7 defaults: newFileLocation:"root", newFileFolderPath:"/"
```

**Tradeoffs and Limitations:**

- Property merging needs a parsed frontmatter merge, which makes "one undo step" harder. Inserting the template verbatim is simpler but differs from Obsidian for templates with properties.

**Reconciliation Considerations:**

- Should REQ4 split template frontmatter and merge it into the note (Obsidian), insert it verbatim, or refuse templates with frontmatter mid-note?

## RF9: Moment output for the supported tokens is confirmed but Moment tokenizes greedily

**Question:** What are Moment.js 2.x `en` outputs for the supported tokens and edge cases, and are REQ3's examples correct?

**Finding:** Obsidian bundles Moment **2.29.4**. Running Moment 2.29.4 with the default `en` locale on 2026-10-03 09:05:00 local time gave these outputs, identical under `TZ=Asia/Ho_Chi_Minh` and `TZ=UTC`:

| Token | Output | Token | Output | Token | Output |
|---|---|---|---|---|---|
| `YYYY` | `2026` | `D` | `3` | `h` | `9` |
| `YY` | `26` | `DD` | `03` | `hh` | `09` |
| `M` | `10` | `Do` | `3rd` | `m` | `5` |
| `MM` | `10` | `d` | `6` | `mm` | `05` |
| `MMM` | `Oct` | `ddd` | `Sat` | `s` | `0` |
| `MMMM` | `October` | `dddd` | `Saturday` | `ss` | `00` |
| `H` | `9` | `A` | `AM` | `a` | `am` |
| `HH` | `09` | | | | |

Edge cases:

- **12-hour clock:** 00:00 and 00:30 → `h`=`12`, `A`=`AM`; 11:59 → `11 AM`; 12:00 and 12:30 → `12 PM`; 13:05 → `h`=`1`, `hh`=`01`; 23:59 → `11 PM`.
- **Ordinals:** `Do` gives `1st 2nd 3rd 4th 10th 11th 12th 13th 14th 20th 21st 22nd 23rd 24th 30th 31st`.
- **Day number:** `d` runs Sunday=`0` … Saturday=`6`.
- **Literals:** `[at]` → `at`.
- **Combined example:** `dddd, MMMM Do YYYY [at] h:mm A` → `Saturday, October 3rd 2026 at 9:05 AM`, matching REQ3's example.

REQ3's second example is not Moment's output: Moment renders `YYYY-[W]ww` as `2026-W40`, because `ww` is a Moment token (locale week). `2026-Www` is correct only as `so`'s documented "unsupported stays literal" behavior.

Moment also tokenizes **greedily over its full token set** and treats unbracketed letters as tokens: `dd` → `Sa`, `MMMMM` → `October10`, `DDD` → `276`, `Q` → `4`, and `l` → `10/3/2026`. A subset formatter that only knows the supported tokens will split unknown tokens unpredictably. For example, `dd` would become `66` (two `d` tokens) rather than literal `dd` or Moment's `Sa`.

**Requirements Evaluated:**

- `W26100423LX-REQ3@R1` — supported tokens equal Moment 2.x output; `[literal]` and unsupported tokens literal; examples include `YYYY-[W]ww` → `2026-Www`.
- `W26100423LX-REQ1@R1` — daily paths use the formatter.

**Potential Requirement Impact:** This supports REQ3's acceptance criterion with exact expected strings for the test. It adds two considerations:

- **The `ww` example needs a label.** Its output describes `so`'s intended divergence, not Moment, so it should be labeled as such.
- **"Unsupported tokens stay literal" needs a tokenizer rule.** Obsidian users may write `dd`, `Q`, `ww`, or `E`, so the formatter's tokenizer needs a defined rule: recognize Moment's full token set so that unsupported tokens stay whole and literal. Otherwise a daily-note path or template can differ from Obsidian in ways that are neither Moment output nor literal text.

**Evidence:**

- Moment's format documentation lists every display token: `ww` week of year, `dd` min weekday, `Q` quarter, and others — [Moment.js docs: Format](https://momentjs.com/docs/#/displaying/format/).
- The token regex (greedy alternation, bracket literals, backslash escape) is in Moment 2.29.4 source — [moment/src/lib/format/format.js#L4-L5](https://github.com/moment/moment/blob/2.29.4/src/lib/format/format.js#L4-L5).
- `en` ordinal rule: `toInt((number % 100) / 10) === 1 ? 'th' : b === 1 ? 'st' : b === 2 ? 'nd' : b === 3 ? 'rd' : 'th'` — [moment/src/lib/locale/en.js#L25-L37](https://github.com/moment/moment/blob/2.29.4/src/lib/locale/en.js#L25-L37).
- `h` is `this.hours() % 12 || 12`, and the meridiem is `hours > 11 ? 'PM' : 'AM'` — [moment/src/lib/units/hour.js#L20-L22](https://github.com/moment/moment/blob/2.29.4/src/lib/units/hour.js#L20-L22), [hour.js#L153-L159](https://github.com/moment/moment/blob/2.29.4/src/lib/units/hour.js#L153-L159).
- `d` is the day of week (`addFormatToken('d', 0, 'do', 'day')`) — [moment/src/lib/units/day-of-week.js#L20](https://github.com/moment/moment/blob/2.29.4/src/lib/units/day-of-week.js#L20).
- The bundled version is `M.version="2.29.4"` in the Obsidian bundle — [Obsidian v1.13.7 release asset](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7).

**Rationale and Examples:**

```text
format "YYYY-[W]ww"   Moment → "2026-W40"    REQ3 → "2026-Www" (documented divergence)
format "dd"           Moment → "Sa"          naive subset → "66"   full-token-aware subset → "dd"
format "[unclosed"    Moment → "[unc10/3/2026o066"  (l, s, e, d are tokens)
daily "YYYY/MMMM/YYYY-MMM-DD" → "2026/October/2026-Oct-03"
```

**Tradeoffs and Limitations:**

- Recognizing all Moment tokens only to emit them literally adds a small tokenizer table, but it makes "unsupported stays literal" well defined. It does not add a dependency, which RM261003ABZP-DES11@R1 rejects.

**Reconciliation Considerations:**

- Correct or relabel REQ3's `ww` example.
- Should REQ3 state that the tokenizer recognizes Moment's full token set and backslash escapes, so unsupported tokens stay whole?

# 3. Sources

## External Sources

1. **Kanban view (help source, `en/Bases/Layouts/Kanban view.md`)** — Obsidian (obsidianmd/obsidian-help)
   - URL: https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Layouts/Kanban%20view.md
   - Published or updated: 2026-09-04 (commit `09510a4a7e`)
   - Accessed: 2026-10-04
   - Supports: `RF1`, `RF2`
   - Authority: Official help source maintained by Obsidian.
2. **Views (help source, `en/Bases/Views.md`)** — Obsidian
   - URL: https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Views.md
   - Published or updated: 2026-09-04 (commit `09510a4a7e`)
   - Accessed: 2026-10-04
   - Supports: `RF1`
   - Authority: Official help; layout table with app versions.
3. **Bases syntax (help source)** — Obsidian
   - URL: https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Bases%20syntax.md
   - Published or updated: 2026-03-26 (commit `ed4f6f46c7`)
   - Accessed: 2026-10-04
   - Supports: `RF2`, `RF3`, `RF4`
   - Authority: Official file-format documentation.
4. **Functions (help source)** — Obsidian
   - URL: https://github.com/obsidianmd/obsidian-help/blob/master/en/Bases/Functions.md
   - Published or updated: 2026-05-14 (commit `e23f4f9263`)
   - Accessed: 2026-10-04
   - Supports: `RF4`
   - Authority: Official function reference.
5. **Properties (help source)** — Obsidian
   - URL: https://github.com/obsidianmd/obsidian-help/blob/master/en/Editing%20and%20formatting/Properties.md
   - Published or updated: 2026-08-08 (commit `852a0f277b`)
   - Accessed: 2026-10-04
   - Supports: `RF5`, `RF8`
   - Authority: Official property type and format documentation.
6. **Templates (help source)** — Obsidian
   - URL: https://github.com/obsidianmd/obsidian-help/blob/master/en/Plugins/Templates.md
   - Published or updated: 2026-05-14 (commit `ffa51a7209`)
   - Accessed: 2026-10-04
   - Supports: `RF6`, `RF8`
   - Authority: Official core-plugin documentation.
7. **Daily notes (help source)** — Obsidian
   - URL: https://github.com/obsidianmd/obsidian-help/blob/master/en/Plugins/Daily%20notes.md
   - Published or updated: 2026-03-24 (commit `2f9705d495`)
   - Accessed: 2026-10-04
   - Supports: `RF7`
   - Authority: Official core-plugin documentation.
8. **Obsidian 1.14.0 Desktop (Early access)** — Obsidian
   - URL: https://obsidian.md/changelog/2026-09-02-desktop-v1.14.0/
   - Published or updated: 2026-09-02
   - Accessed: 2026-10-04
   - Supports: `RF1`
   - Authority: Official changelog.
9. **Obsidian 1.14.2 Desktop (Early access)** — Obsidian
   - URL: https://obsidian.md/changelog/2026-09-15-desktop-v1.14.2/
   - Published or updated: 2026-09-15
   - Accessed: 2026-10-04
   - Supports: `RF2`
   - Authority: Official changelog.
10. **Obsidian 1.14.3 Desktop (Early access)** — Obsidian
    - URL: https://obsidian.md/changelog/2026-09-29-desktop-v1.14.3/
    - Published or updated: 2026-09-29
    - Accessed: 2026-10-04
    - Supports: `RF2`
    - Authority: Official changelog.
11. **Obsidian 1.14.4 Desktop (Early access)** — Obsidian
    - URL: https://obsidian.md/changelog/2026-10-01-desktop-v1.14.4/
    - Published or updated: 2026-10-01
    - Accessed: 2026-10-04
    - Supports: `RF1`, `RF2`
    - Authority: Official changelog.
12. **obsidian.d.ts at "Update to Obsidian 1.14.4"** — Obsidian (obsidianmd/obsidian-api)
    - URL: https://github.com/obsidianmd/obsidian-api/blob/40301c12bb/obsidian.d.ts (diff: https://github.com/obsidianmd/obsidian-api/commit/40301c12bb)
    - Published or updated: 2026-10-02
    - Accessed: 2026-10-04
    - Supports: `RF1`, `RF2`, `RF3`
    - Authority: Official public API typings for the same release.
13. **desktop-releases.json** — Obsidian (obsidianmd/obsidian-releases)
    - URL: https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/desktop-releases.json
    - Published or updated: Unknown (read 2026-10-04: latest 1.13.7, beta 1.14.4)
    - Accessed: 2026-10-04
    - Supports: `RF1`
    - Authority: Official update manifest used by the app's updater.
14. **Obsidian v1.13.7 release (`obsidian-1.13.7.asar.gz`)** — Obsidian (obsidianmd/obsidian-releases)
    - URL: https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7
    - Published or updated: 2026-08-12
    - Accessed: 2026-10-04 (downloaded to the session scratchpad and searched with grep; not extracted or committed)
    - Supports: `RF1`, `RF3`, `RF5`, `RF6`, `RF7`, `RF8`, `RF9`
    - Authority: The shipped app code, the ground truth for parser, template, daily-note, and frontmatter behavior in the current public release.
15. **[Bug] Rename the Bases view type to avoid Obsidian 1.14 native Kanban collision (#62)** — zxcv654, mderazon/obsidian-base-board
    - URL: https://github.com/mderazon/obsidian-base-board/issues/62
    - Published or updated: 2026-09-14 (open, no replies)
    - Accessed: 2026-10-04
    - Supports: `RF1`
    - Authority: Secondary; a user report about a community plugin. It is the only explicit claim of the native `type` string.
16. **Name collision with Obsidian 1.14 native 'Kanban' bases view (#114)** — xiwcx/obsidian-bases-kanban
    - URL: https://github.com/xiwcx/obsidian-bases-kanban/issues/114
    - Published or updated: 2026-09-17; maintainer comment 2026-09-27
    - Accessed: 2026-10-04
    - Supports: `RF1`
    - Authority: Secondary; confirms only the display-name collision.
17. **Public `.base` files containing `type: kanban`** — timscheuerai/content-vault `content/Content.base` (commit `0907578692`, 2026-06-22); DevMandalia/Solaris `src/solaris/data/base/Board.core.base` (`37d2da4c01`, 2026-08-02); xupisco/obsidian-sample-vault `Assorted/Bases/Tasks - Reloaded.base` (`22af8ad8dd`, 2026-06-28); Mootikins/crucible `assets/fixtures/bases/Tasks.base` (`6ae566dcab`, 2026-09-27)
    - URL: https://github.com/timscheuerai/content-vault/blob/a970acf9de389cf70c3293bb275542dc5bb906f8/content/Content.base ; https://github.com/DevMandalia/Solaris/blob/80d5e73a3c83561aad677e8e5b442b7521f49fc0/src/solaris/data/base/Board.core.base ; https://github.com/xupisco/obsidian-sample-vault/blob/4b0ccdacd01b58b920209f21c5c5295fa2ae58b5/Assorted/Bases/Tasks%20-%20Reloaded.base ; https://github.com/Mootikins/crucible/blob/378f4b5d98e503fbc86507b393567db000e18726/assets/fixtures/bases/Tasks.base
    - Published or updated: as listed
    - Accessed: 2026-10-04
    - Supports: `RF1`
    - Authority: Candidate fixtures; each was rejected for provenance (pre-1.14 plugin files or hand-authored).
18. **`home/databases/tasks.base`** — Selogaz/Obsidian-vault-cpp
    - URL: https://github.com/Selogaz/Obsidian-vault-cpp/blob/b3fad8558daa12468a00f2bc7101d5d83bda4fc4/home/databases/tasks.base
    - Published or updated: 2026-04-25
    - Accessed: 2026-10-04
    - Supports: `RF4`
    - Authority: Real-world vault file showing the expression syntax users write today.
19. **Moment.js documentation: Format** — Moment.js
    - URL: https://momentjs.com/docs/#/displaying/format/
    - Published or updated: Unknown
    - Accessed: 2026-10-04
    - Supports: `RF9`
    - Authority: Official library documentation.
20. **Moment.js 2.29.4 source** (`format.js`, `locale/en.js`, `units/hour.js`, `units/day-of-week.js`) — moment/moment
    - URL: https://github.com/moment/moment/tree/2.29.4/src/lib
    - Published or updated: 2022-07-06 (tag 2.29.4)
    - Accessed: 2026-10-04 (outputs reproduced by running the `moment@2.29.4` package in the session scratchpad)
    - Supports: `RF9`
    - Authority: The exact version Obsidian bundles.

## Project Evidence

- `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-requirements.md:7` — Supports `RF1`–`RF9` by establishing that the baseline had no research source.
- `w26100423lx-requirements.md:147-148` — Supports `RF1` by establishing the Kanban gate and the local 1.12.7 assumption, now stale (the app auto-updated to 1.13.7 during this pass).
- `w26100423lx-requirements.md:207,210-212` — Supports `RF7` by establishing REQ1's `{{title}}` base name, built-in fallback template, cursor rule, and `:Yesterday`/`:Tomorrow` creation.
- `w26100423lx-requirements.md:262-269,274-276` — Supports `RF6` and `RF9` by establishing REQ3's whitespace-trimming claim and its `{{ Title }}` and `YYYY-[W]ww` examples.
- `w26100423lx-requirements.md:303-306,327-329` — Supports `RF8` by establishing REQ4 insertion and REQ5's root location.
- `w26100423lx-requirements.md:433,457,469-474` — Supports `RF2` and `RF3` by establishing summaries "match the ported Alfred fixtures", distinct-value columns, and the move rules.
- `w26100423lx-requirements.md:508-513` — Supports `RF5` by establishing REQ10's preservation and type criteria.
- `w26100423lx-discuss-context.md:242` — Supports `RF1` by establishing that Alfred's `type: board` is Alfred-authored and the Kanban value is unknown.
- `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-research.md:485-500` — Supports `RF1` by establishing the parent RF9 evidence gap this pass re-checked.
- `/Users/hieunguyen/git/hieu/projects/alfred/packages/vault/src/domain/bases/parser.ts:22-61,94-143` (at `5fde89b0`) — Supports `RF3` by establishing that only YAML errors fail, unknown view keys pass through, and `groupBy` is lenient.
- `alfred/packages/vault/src/domain/bases/evaluator.ts:162-197,298-318,383-393,750-765` — Supports `RF2`, `RF3`, and `RF4` by establishing the supported view types, grouping without `groupOrder`, filter-diagnostic exclusion, and `note.`/bare property resolution.
- `alfred/packages/vault/src/domain/bases/expression.ts:177-190,273-325` — Supports `RF4` by establishing file-only methods, exact `inFolder`, first-argument `hasTag`, and double-quote-only strings.
- `alfred/packages/vault/src/domain/bases/frontmatter.ts:18-44` — Supports `RF5` by establishing that Alfred re-stringifies the whole frontmatter.
- `alfred/packages/vault/src/domain/bases/{parser.ts:34,types.ts:28,46}` — Supports `RF3` by establishing that `summaries` are parsed but never evaluated.
- `src/core/lang/markdown/scan.ts:1,235` and `package.json:31` — Supports `RF5` by establishing that `so` parses frontmatter with `yaml` 2.9.1 default (YAML 1.2 core) options.
- Local Obsidian 1.12.7 bundle, `~/Library/Application Support/obsidian/obsidian-1.12.7.asar`, read with grep before the app replaced it with 1.13.7 at 13:35 on 2026-10-04 — Supports `RF1`, `RF3`, `RF5`, `RF6`, `RF7`, and `RF9`. Its view parser (`TY`), registered types (`table`, `cards`, `list`), type inference (`NL`, `getTypeInfo`), frontmatter rewrite (`vI`, `vA`), template expansion (`QD`), daily notes (`getDailyNote`, `d8="YYYY-MM-DD"`), `newFileLocation:"root"`, and Moment `2.29.4` match the 1.13.7 bundle.
- The user's vault, aggregate only: 101 `.base` files with 104 views, all `type: table`, and no functions beyond Alfred's subset. Supports `RF4` by establishing that the local compatibility check does not exercise Kanban or the expression gaps.

# 4. Confidence and Open Questions

**Confidence:** Medium. Confidence differs by area:

| Area | Findings | Confidence | Reason |
|---|---|---|---|
| Bundle-verified behavior | RF3, RF5, RF6, RF7, RF8 | High | Read from shipped Obsidian code in two releases (1.12.7 and 1.13.7) and consistent with the official help |
| Moment output | RF9 | High | Reproduced with the exact Moment version Obsidian bundles |
| `groupOrder` meaning | RF2 | High | Documented in the official 1.14.4 typings and changelogs |
| `groupOrder` serialized form | RF2 | Medium | No 1.14 file inspected |
| Kanban `type` string | RF1 | Low | Rests on one third-party claim; no Obsidian-saved file found |

**Open Questions:**

- What exact `type` string, and which Kanban-specific option keys, does Obsidian ≥ 1.14 write? This needs a `.base` saved by 1.14+ with recorded provenance (RF1).
- How did 1.14.0–1.14.2 persist manual column order before `groupOrder` was documented in 1.14.3, and how are `groupOrder` values typed (RF2)?
- Does the 1.14 Bases cell edit or card move write through `processFrontMatter`, like the other Obsidian writers inspected here (RF5)?

**Immutability Note:** This artifact records evidence against the stated baseline commit and exact evaluated revisions. Later requirements may cite these findings as informing a new revision, but this artifact must not be changed to claim that it evaluated that later revision.
