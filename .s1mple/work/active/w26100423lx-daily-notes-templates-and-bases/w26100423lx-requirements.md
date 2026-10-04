# W26100423LX: daily-notes-templates-and-bases — Requirements

**Document Status:** Ready for System Design

**Context Source:** `w26100423lx-discuss-context.md`

**Research Source:** `w26100423lx-research.md` (baseline `65cb3e4`; reconciled in section 6)

**Unresolved Items:** None

**Ready for System Design Checklist:**

- [x] Every active topic is covered.
- [x] Every current requirement has a stable, unique ID and exact current revision.
- [x] Every current requirement includes its question, answer, rationale, acceptance criteria, and dependencies.
- [x] Scope, constraints, assumptions, risks, and compatibility boundaries are explicit.
- [x] For roadmap-linked work, the accepted parent baseline has been checked, assigned scope is covered by current requirements, and gates due before requirements approval have evidence; unresolved parent impacts prevent readiness.
- [x] Revised and replaced requirements preserve append-only lineage and complete prior revisions.
- [x] When research exists, every RF-to-evaluated-revision relationship has one reconciliation outcome; a finding that evaluated no requirement has one `None` relationship row.
- [x] Deferred decisions are outside the current-requirements ledger.
- [x] `Unresolved Items` is `None`.

# Table of Contents

1. [Problem and Desired Outcome](#1-problem-and-desired-outcome)
2. [Current and Expected State](#2-current-and-expected-state)
3. [Scope](#3-scope)
4. [Standards and Constraints](#4-standards-and-constraints)
5. [Current Requirements](#5-current-requirements)
   - [W26100423LX-REQ1@R2: Daily notes open or are created safely](#w26100423lx-req1r2-daily-notes-open-or-are-created-safely)
   - [W26100423LX-REQ2@R1: Calendar date picker](#w26100423lx-req2r1-calendar-date-picker)
   - [W26100423LX-REQ3@R2: Obsidian-compatible date formatting and template expansion](#w26100423lx-req3r2-obsidian-compatible-date-formatting-and-template-expansion)
   - [W26100423LX-REQ4@R2: Template insertion](#w26100423lx-req4r2-template-insertion)
   - [W26100423LX-REQ5@R1: New note from a template](#w26100423lx-req5r1-new-note-from-a-template)
   - [W26100423LX-REQ6@R2: Daily-note and template configuration](#w26100423lx-req6r2-daily-note-and-template-configuration)
   - [W26100423LX-REQ7@R2: Bases engine and registered `base` editor kind](#w26100423lx-req7r2-bases-engine-and-registered-base-editor-kind)
   - [W26100423LX-REQ8@R2: Table view](#w26100423lx-req8r2-table-view)
   - [W26100423LX-REQ9@R2: Kanban view behind a verified type constant](#w26100423lx-req9r2-kanban-view-behind-a-verified-type-constant)
   - [W26100423LX-REQ10@R2: Safe frontmatter write-back](#w26100423lx-req10r2-safe-frontmatter-write-back)
   - [W26100423LX-REQ11@R1: Base embeds in notes](#w26100423lx-req11r1-base-embeds-in-notes)
   - [W26100423LX-REQ12@R1: Base window lifecycle](#w26100423lx-req12r1-base-window-lifecycle)
   - [W26100423LX-REQ13@R1: Integration, accessibility, and performance re-checks](#w26100423lx-req13r1-integration-accessibility-and-performance-re-checks)
6. [Research Impact Review](#6-research-impact-review)
7. [Historical Requirement Revisions](#7-historical-requirement-revisions)

# 1. Problem and Desired Outcome

## Problem Statement

`so` edits and links Markdown notes but has none of the structured Obsidian workflows the roadmap assigns to RM261003ABZP-DI4@R2. There is no daily note, no template, and no date formatter. A `.base` file opens as plain YAML in the text editor, and `![[tasks.base]]` renders as a plain paragraph.

## Desired Outcome

Daily notes and templates take one or two keystrokes and produce the same text Obsidian's core plugins would. `.base` files open as keyboard-driven tables and Kanban boards over the indexed notes. Edits in those views write valid, comment-preserving frontmatter to the affected notes and never touch the `.base` file, and `![[x.base#View]]` renders the view inline. All of it arrives through registrations on the language-neutral kernel, with the DI3 integration checks still passing.

# 2. Current and Expected State

## Current State

```text
<leader>n…        → no binding; which-key shows nothing under n
:Today            → unknown command
open tasks.base   → FileTypeRegistry.forPath → text file type → vim source view of the YAML
![[tasks.base]]   → renderKey "base" → no renderer → paragraph text
config.toml       → [daily] / [templates] are unknown keys (strict schema → error)
```

The kernel already has the seams DI4 needs: `EditorKindRegistry` and `EditorKindSpec.open` (`src/core/filetypes/registry.ts:16-19`), editor views by kind (`src/ui/editors/registry.ts`), the G4 block-renderer and widget-painter registries (`src/core/lang/markdown/live-preview.ts:43-48`, `src/ui/widgets/registry.ts`), file-type-scoped bindings (`src/core/state/markdown-commands.ts:146-149`), exclusive create (`src/workspace/fs.ts:171-185`), and the checked edit path for open and closed notes (`src/core/state/link-edits.ts:201-214`). Nothing uses them for notes, dates, or Bases.

## Expected State

```text
<leader>nd | :Today → dailyPath(config, local today) → exists? open : create exclusively from the expanded template → open
<leader>np          → calendar (Mon-first, • marks existing notes) → Enter → open or create that day
<leader>nt          → template picker (source ▸ expansion preview) → insert at cursor, one undo step
<leader>nn          → title prompt → template picker with "(blank note)" first → create → Insert mode
open tasks.base     → base file type → editor kind "base" → table or Kanban view over NoteIndex
edit cell / move    → validate → patch one frontmatter key → open buffer edit or checked file edit → diff toast
![[tasks.base#Board]] → base block renderer → read-only inline view (live and reading views)
```

The expected state adds `core/time`, note and Bases features, a calendar overlay, a Bases editor view, and a `base` widget painter, all registered from `src/app/main.ts`. The kernel gains no note, date, or Bases code.

# 3. Scope

## In Scope

- Daily notes, the calendar picker, template insertion, and new notes from templates (W26100423LX-REQ1@R2 to W26100423LX-REQ5@R1).
- The Moment-subset date formatter and template expansion shared by notes, templates, and Bases date cells (W26100423LX-REQ3@R2).
- `[daily]` and `[templates]` configuration (W26100423LX-REQ6@R2).
- The ported Bases engine, the `base` file type and editor kind, the view-type registry with a table fallback, the table and Kanban views, and safe frontmatter write-back (W26100423LX-REQ7@R2 to W26100423LX-REQ10@R2).
- Read-only `![[x.base]]` and `![[x.base#View]]` embeds in the live and reading views (W26100423LX-REQ11@R1).
- Base window lifecycle and session behavior (W26100423LX-REQ12@R1).
- DI4's UI states, the DI3 cross-work integration re-checks, and the performance re-check (W26100423LX-REQ13@R1).

## Out of Scope

- Writing `.base` files, including from the view's sort, group, and filter toggles (RM261003ABZP-DI4@R2 Exclusions).
- The Cards, List, and Map layouts and plugin view types; they open as a table with a notice (RM261003ABZP-DI4@R2 Exclusions; index Deferred Scope).
- A configurable week start; the calendar is Monday-first (RM261003ABZP-DI4@R2 Exclusions).
- Template scripting beyond `{{title}}`, `{{date}}`, `{{time}}`, `{{date:FORMAT}}`, and `{{time:FORMAT}}` (RM261003ABZP-DI4@R2 Exclusions).
- Widening the Bases expression subset beyond Alfred's, such as `if()`, `today()`, or `date.format()` (RM261003ABZP-DI4@R2 Downstream work boundary).
- Rendering Bases views in the browser preview. A `![[x.base]]` embed keeps DI3's behavior there: it shows as a link to the `.base` file, as non-note embeds already do (`src/core/lang/markdown/html.ts:80`). RM261003ABZP-REQ7@R2 requires the inline view only in live preview, and DI4 is not assigned RM261003ABZP-REQ8@R2. Trigger to revisit: user demand for Bases in the browser preview after `v1.0.0`.
- Moving files from a Kanban board grouped by `file.folder`, which Obsidian ≥ 1.14.2 allows (RF2); the move stays disabled with an explanation. Trigger to revisit: user demand after `v1.0.0`.
- Writing `groupOrder` or any other view setting; it is read only (RF2).
- Custom `values` summary formulas; they show a diagnostic because they need expressions outside Alfred's subset (RF3).
- Non-English date names; the formatter uses Moment's default `en` locale, as Obsidian does without a locale override.
- The PH2 exit record, the release dry run, and any release; the phase owns them after DI4 merges.

## Roadmap Assignment

- **Binding and parent scope:** `w26100423lx-discuss-context.md`, Roadmap Binding — RM261003ABZP-PH2@R5, RM261003ABZP-DI4@R2 (`rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Delivery Items, lines 407–484).
- **Assigned requirement coverage:**
  - RM261003ABZP-REQ6@R2 → W26100423LX-REQ1@R2, W26100423LX-REQ2@R1, W26100423LX-REQ3@R2, W26100423LX-REQ4@R2, W26100423LX-REQ5@R1, W26100423LX-REQ6@R2.
  - RM261003ABZP-REQ7@R2 → W26100423LX-REQ3@R2 (shared formatter), W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ10@R2, W26100423LX-REQ11@R1, W26100423LX-REQ12@R1.
  - RM261003ABZP-REQ11@R3 → W26100423LX-REQ7@R2 (registered file type, editor kind, and view-type registry), W26100423LX-REQ13@R1 (registration-only extension re-check).
  - Assigned UI obligations (RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1, RM261003ABZP-UREQ11@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES11@R1, RM261003ABZP-US6@R1, RM261003ABZP-US7@R1, RM261003ABZP-US9@R1, RM261003ABZP-UV7@R1, RM261003ABZP-UV8@R1, RM261003ABZP-UV10@R1) stay bound to the accepted UI baseline. The requirements here reference them for interaction detail and do not redefine them.
  - Cross-work integration (phase file line 553) → W26100423LX-REQ13@R1.
- **Baseline and due-gate assessment:** The parent references in the context binding were re-read on 2026-10-04 and are unchanged: the index Approval lists PH2@R5 and DI4@R2, and no newer REQ6, REQ7, or REQ11 revision exists. G3 (DI2 merged as `9adb285`) and G4 (DI3 merged as `e228bb5`) are satisfied, so no gate blocks requirements or later execution. The UI surfaces cite RM261003ABZP-DES7@R3 and RM261003ABZP-DES14@R1 (`rm261003abzp-ui-design.md:880`), while DI4 binds DES7@R4 and DES14@R2. The DES7 change concerns indexing and link resolution, and the DES14 change adds editor options. Neither changes daily-note paths, template folders, or the `[daily]` keys, so DI4's UI obligations are unaffected. The only open delivery confirmation is the Kanban `type` value, which W26100423LX-REQ9@R2 gates as the parent requires.

  Research reconciliation produced three items for parent synchronization. None waives an obligation, and none blocks system design:
  - **Kanban enablement.** The Obsidian 1.14+ fixture can only come from the user, through an early-access build or a later public release (RF1). DI4 builds and verifies the board with the constant unmatched, and records Kanban enablement as an open item that blocks the PH2 exit. Whether DI4's PR may merge before the fixture exists, with Kanban views opening as a table, is a parent progress decision for the user at delivery time.
  - **Evaluator semantics.** W26100423LX-REQ7@R2 corrects `file.inFolder` and `file.hasTag` to Obsidian's semantics and accepts single-quoted strings. It adds no function or operator, so it stays within RM261003ABZP-DI4@R2's ban on widening the subset, and it is reported as a refinement of RM261003ABZP-DES12@R2.
  - **Summaries source.** W26100423LX-REQ8@R2 takes summary semantics from Obsidian's documented defaults, because Alfred has none to port. This refines RM261003ABZP-DES12@R2's "port Alfred" decision for summaries only.

## Affected Interfaces and Actors

- **User** — gains `<leader>nd`, `<leader>np`, `<leader>nt`, `<leader>nn`, `:Today`, `:Yesterday`, `:Tomorrow`, and Bases views with their keys (RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1).
- `config.toml` — gains `[daily] folder`, `format`, `template` and `[templates] folder`.
- **Notes in the workspace** — daily notes and new notes are created; frontmatter of notes edited through Bases is patched.
- **`.base` files** — read and evaluated, never written.
- **Obsidian** — must keep reading every file `so` creates or patches.
- `FileTypeRegistry`, `EditorKindRegistry`, `CommandRegistry`, keymaps, block-renderer and widget-painter registries, editor views — gain registrations only.
- `NoteIndex` summaries — supply Bases candidates and calendar marks.
- `AppState` — gains the calendar overlay and base window content.

# 4. Standards and Constraints

## Binding Standards

- `.s1mple/S1MPLE.md:63` — no work-process identifiers in code, comments, identifiers, test names, or log messages.
- `.s1mple/docs/project.md` Boundaries and Dependencies; `test/boundaries.test.ts:9-56` — layer rules and package homes. `src/core` stays pure, and any new package home must be added to `PACKAGE_HOMES` explicitly rather than bypassed.
- `.s1mple/docs/project.md` Constraints — exact npm pins; no TypeScript compiler API.
- `.s1mple/docs/languages/typescript.md` — strict TypeScript, colocated behavior-named tests, zero knip findings, `bun run check` before committing.
- RM261003ABZP-REQ11@R3 — file types, editor kinds, and view types extend by registration only; Obsidian Flavored Markdown and `NO_COLOR` compatibility.
- RM261003ABZP-REQ10@R4 — `bun run check` < 30 s and CI < 3 min; CI on pull requests only; no release is tagged or published.
- RM261003ABZP-REQ6@R2 — Moment.js token subset and `[literal]`; unsupported tokens stay literal.
- RM261003ABZP-REQ7@R2 — Alfred's expression subset; Obsidian-valid edits; Kanban `type` confirmed against an Obsidian 1.14+ file before release.

## Constraints

- The kernel (`src/core/kernel/`) gains no note, date, or Bases code; `.base` has no special case outside its file-type registration (RM261003ABZP-DI4@R2 Downstream work boundary).
- Creation commands never overwrite or modify an existing file (`createExclusive` never-overwrite rule, phase file lines 253–271).
- `.base` files are never written (RM261003ABZP-DI4@R2 Exclusions).
- Kanban does not ship before the `KANBAN_TYPE` constant is confirmed against a `.base` file saved by Obsidian 1.14 or later (phase file line 481).
- The installed Obsidian on this machine is 1.13.7, the latest public release on 2026-10-04; it updated itself from 1.12.7 during research. Neither version contains a Kanban layout, which exists only in 1.14.x early access (RF1), so the agent cannot produce the required fixture.

## Accepted Assumptions

- Self-drive was delegated by the user on 2026-10-04 for this discussion run. The agent made every decision below and recorded its rationale.
- Alfred at `/Users/hieunguyen/git/hieu/projects/alfred` (`5fde89b0`) is the porting reference for the Bases engine and view rules; code is ported into `so`, not imported.
- "Today" and template times use the local timezone of the `so` process, as Obsidian uses the device's local time.
- The Kanban fixture is supplied by the user from core Obsidian 1.14.3 or later (early access or a later public release), because no other source can produce it (RF1).
- The `.base` files in the user's own vault are personal data. They may be used for a local compatibility check, but they are not copied into the repository as fixtures.

## Dependencies

- `NoteIndex` (`src/core/features/links/note-index.ts`) — daily-note existence, calendar marks, Bases candidates, and frontmatter values.
- Checked edit path (`src/core/state/link-edits.ts:201-214`, `src/app/effects.ts:231-262`) — open buffers get one undo step and autosave; closed files get span edits verified against their current text.
- Exclusive create (`src/workspace/fs.ts:171-185`) — the base for create-with-content.
- G4 registries (`src/core/lang/markdown/live-preview.ts`, `src/ui/widgets/registry.ts`) — `base` embeds.
- Picker and Prompt (`src/core/state/picker.ts`, `src/core/state/types.ts:129-138`) — template picker and title prompt.
- `yaml` 2.9.1 — already pinned; Bases parsing and frontmatter patching need it.

## Risks and Compatibility

- **Overwriting a daily note** — a race between the index check and creation could clobber a note. Protection: exclusive create; on `EEXIST`, open the existing file and write nothing (W26100423LX-REQ1@R2).
- **Frontmatter corruption** — a patch could drop comments, reorder keys, or produce YAML Obsidian rejects. Protection: patch only the edited key, verify against the current text, and test with comment and ordering fixtures (W26100423LX-REQ10@R2).
- **Kanban type mismatch** — a wrong `type` string makes Obsidian show our board as a table, or the reverse. Protection: one constant, verified against a recorded Obsidian 1.14+ file, with the table fallback for unknown types (W26100423LX-REQ9@R2).
- **Editing `.base` source by accident** — unbound keys in a base window would otherwise reach vim and autosave the YAML. Protection: a base window never routes keys to vim or the text buffer (W26100423LX-REQ7@R2).
- **Live keystroke latency** — evaluating a base inside a note embed adds work to the live-preview path. Protection: V12@R3 re-run with the `base` renderer registered (W26100423LX-REQ13@R1).
- **Mixed versions** — `PersistedState` stays `version: 1`; older state files still load (W26100423LX-REQ12@R1).

# 5. Current Requirements

## W26100423LX-REQ1@R2: Daily notes open or are created safely

**Requirement ID:** `W26100423LX-REQ1`

**Revision:** `R2`

**Previous Revision:** `W26100423LX-REQ1@R1`

**Replaces:** None

**Research Relationship:** `RF7` evaluated `W26100423LX-REQ1@R1` and informed this revision

**Revision Summary:** `{{title}}` in a daily note is now the full formatted date string, as Obsidian expands it, instead of the base name. `{{date}}` in a note created for another day is pinned to that day. The existence check is now case-insensitive, like Obsidian's (RF7).

**Question:** How do `:Today`, `:Yesterday`, and `:Tomorrow` find, create, and open a daily note?

**Answer:** `<leader>nd` and `:Today` open `<[daily] folder>/<today formatted with [daily] format>.md`, using the local date. When no note matches that path (compared case-insensitively), `so` creates it exclusively with the expanded daily template and opens it. When one exists, `so` opens it unchanged. `:Yesterday` and `:Tomorrow` open the day before or after the open daily note, or relative to today when the active buffer is not a daily note. A `/` in the format creates subfolders.

**Rationale:** This matches RM261003ABZP-REQ6@R2 and Obsidian's Daily notes plugin, which uses local time, finds an existing note case-insensitively, and opens rather than recreates it (RF7). Exclusive create is the only safe way to rule out the race between the index check and the write, so the parent's never-overwrite rule holds even when the index is stale or another program created the file. The case-insensitive check keeps Linux from creating `2026-Oct-03.md` beside `2026-oct-03.md`.

`{{title}}` follows Obsidian exactly (the whole formatted string, including `/` segments), so a template expands to the same heading in both tools. For a note created for another day, `{{date}}` and `{{date:FORMAT}}` use that day and `{{time}}` uses the current time. This is a deliberate `so` choice: Obsidian has no command that creates another day's note from a template, and putting today's date in yesterday's note would be wrong in common templates. Three accepted UI behaviors are also `so` choices with no file-compatibility impact: the built-in fallback template, creating the daily folder when missing, and the cursor rule (RM261003ABZP-UDES8@R1).

```text
2026-10-03, format YYYY/MM/YYYY-MM-DD, template "# {{title}} ({{date}})"
:Today (missing)  → daily/2026/10/2026-10-03.md : "# 2026/10/2026-10-03 (2026-10-03)"
                    toast "Created daily/2026/10/2026-10-03.md from templates/daily.md"
:Today (again)    → open the same file, bytes unchanged
:Yesterday        → daily/2026/10/2026-10-02.md : "# 2026/10/2026-10-02 (2026-10-02)"
create hits EEXIST → read and open the existing file, no write
```

**Acceptance Criteria:**

- [ ] `:Today` and `<leader>nd` open the path from `[daily] folder` and `[daily] format` for the local date; a format containing `/` creates the missing parent folders.
- [ ] A missing note is created with the daily template expanded per W26100423LX-REQ3@R2, then opened. `{{title}}` is the full formatted date string; `{{date}}` and `{{date:FORMAT}}` use the note's day; `{{time}}` uses the current time. A success toast names the created path and the template.
- [ ] A second `:Today` opens the existing file and leaves its bytes and mtime unchanged.
- [ ] An indexed note whose path differs from the computed path only by letter case is opened instead of creating a new file.
- [ ] If the file appears between the index check and creation, creation fails with `EEXIST`, and `so` opens the existing file without writing to it.
- [ ] When the configured template file does not exist, the note is created from the built-in template `# {{date}}`. When the template exists but cannot be read, the note is created empty and an error toast names the template.
- [ ] After opening, the cursor is on the first unchecked task (`- [ ]`) if there is one, else at the end of the file.
- [ ] `:Yesterday` and `:Tomorrow` step one day from the open daily note's date (parsed with `[daily] format`), else from today, and open or create that day the same way.
- [ ] Tests run with a fixed clock and a fixed `TZ`.

**Depends On:** W26100423LX-REQ3@R2, W26100423LX-REQ6@R2

## W26100423LX-REQ2@R1: Calendar date picker

**Requirement ID:** `W26100423LX-REQ2`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF7` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** How does the user pick another day's note?

**Answer:** `<leader>np` opens the calendar overlay defined by RM261003ABZP-UDES8@R1 and the Calendar component: a fixed 36×12 Monday-first month grid with today underlined, days that have a daily note marked `•`, and the selection reversed. `Enter` opens or creates the selected day's note through the same path as W26100423LX-REQ1@R2.

**Rationale:** The accepted mockup RM261003ABZP-M5@R2 already fixes the layout and keys, so the requirement binds to it instead of redefining it. Marks come from the in-memory index, so the calendar opens instantly and never reads the disk.

**Acceptance Criteria:**

- [ ] The calendar opens on the current month with today selected; `h/j/k/l` move by day and week, `H/L` page the month keeping the day number (clamped to the month's length), `t` returns to today, `Enter` opens or creates the selected day, and `Esc` closes without side effects.
- [ ] A day shows `•` exactly when its daily-note path (from the current `[daily]` settings) exists in `NoteIndex`.
- [ ] The message line names the selected day and whether its note exists, for example `Sat 2026-10-03 · note exists`.
- [ ] The calendar fits 80×24 and remains legible under `NO_COLOR` and the light theme (RM261003ABZP-UV10@R1).

**Depends On:** W26100423LX-REQ1@R2

## W26100423LX-REQ3@R2: Obsidian-compatible date formatting and template expansion

**Requirement ID:** `W26100423LX-REQ3`

**Revision:** `R2`

**Previous Revision:** `W26100423LX-REQ3@R1`

**Replaces:** None

**Research Relationship:** `RF6` and `RF9` evaluated `W26100423LX-REQ3@R1` and informed this revision

**Revision Summary:** Expansion no longer trims spaces inside the braces, because Obsidian does not (RF6). One clock reading serves a whole expansion, and an empty `{{date:}}` uses the default format. The formatter's tokenizer recognizes Moment's full token set and backslash escapes, so an unsupported token stays whole and literal. The `ww` example is labeled as a `so` divergence (RF9).

**Question:** Which date tokens and template variables are supported, and how must their output compare with Obsidian?

**Answer:** One pure formatter emits Moment 2.29.4 `en` output for the tokens `YYYY YY M MM MMM MMMM D DD Do d ddd dddd H HH h hh m mm s ss A a`. It also handles `[literal]` and backslash escapes. Its tokenizer recognizes Moment's full token set, so any other Moment token (such as `dd`, `ww`, or `Q`) is emitted whole and unchanged. Template expansion replaces `{{title}}`, `{{date}}` (`YYYY-MM-DD`), `{{time}}` (`HH:mm`), `{{date:FORMAT}}`, and `{{time:FORMAT}}` exactly as Obsidian's Templates plugin does. Names match case-insensitively with no spaces allowed inside the braces, one clock reading serves the whole expansion, an empty format uses the default, and any other `{{…}}` stays untouched. Bases date cells use the same formatter.

**Rationale:** RM261003ABZP-REQ6@R2 fixes the token list, and RM261003ABZP-DES11@R1 rejects a Moment or Day.js dependency. Obsidian bundles Moment 2.29.4, and its expansion regexes are `{{title}}` with flag `gi` and `/{{(date|time)(?::(.*?))?}}/gi` (RF6), so copying those rules exactly is what makes a template expand to the same text in both tools. Moment tokenizes greedily over its full token set (RF9). A subset formatter that knows only the supported tokens would turn `dd` into `66`, which is neither Moment's `Sa` nor literal text. Recognizing every token keeps the "unsupported stays literal" rule well defined. One shared formatter keeps daily paths, templates, and Bases date cells consistent.

```text
format(2026-10-03T09:05, "dddd, MMMM Do YYYY [at] h:mm A") → "Saturday, October 3rd 2026 at 9:05 AM"   (= Moment)
format(2026-10-03T09:05, "YYYY-[W]ww")                     → "2026-Www"   (so divergence: Moment gives "2026-W40")
format(2026-10-03T09:05, "dd")                             → "dd"         (so divergence: Moment gives "Sa")
"# {{date:dddd, MMMM D}} {{Title}} {{ title }} {{weather}}" (title Meeting)
                                                            → "# Saturday, October 3 Meeting {{ title }} {{weather}}"
```

**Acceptance Criteria:**

- [ ] Formatting 2026-10-03T09:05 local time with every supported token equals Moment 2.29.4 output, including the midnight and noon cases for `h` and `A`, `Do` for 1 to 31, and `d` (Sunday `0`). The expected strings from the research are recorded in the test.
- [ ] `[literal]` text is emitted without brackets, and a backslash escapes the next character. Unsupported Moment tokens are emitted whole (`dd` → `dd`), and other characters are emitted unchanged.
- [ ] Expanding a template containing every variable produces the expected text. `{{Title}}` and `{{DATE:YYYY}}` expand; `{{ title }}` stays literal; `{{date:}}` uses `YYYY-MM-DD`; unknown `{{…}}` stays unchanged.
- [ ] All `{{date}}` and `{{time}}` occurrences in one expansion use the same instant.
- [ ] The formatter lives in pure core (no I/O or runtime imports) and is the only date formatter used by daily notes, templates, and Bases.

**Depends On:** None

## W26100423LX-REQ4@R2: Template insertion

**Requirement ID:** `W26100423LX-REQ4`

**Revision:** `R2`

**Previous Revision:** `W26100423LX-REQ4@R1`

**Replaces:** None

**Research Relationship:** `RF8` evaluated `W26100423LX-REQ4@R1` and informed this revision

**Revision Summary:** A template's frontmatter is no longer pasted into the body. Away from the top of the note, the body goes in at the cursor and the template's properties merge into the note's frontmatter, as Obsidian does. At line 1, column 1 the whole expansion goes in unchanged (RF8).

**Question:** How does the user insert a template into a note?

**Answer:** In a Markdown note, `<leader>nt` opens a picker over the Markdown files in `[templates] folder` with the preview from RM261003ABZP-UDES8@R1 (template source with variables highlighted, then the expanded result). On `Enter`, the template is expanded with `{{title}}` set to the note's base name. With the cursor at line 1, column 1, the whole expansion is inserted there. Elsewhere, only the template body is inserted at the cursor, and the template's properties merge into the note's frontmatter: list values are unioned, and existing scalar values are kept. Either way the change is one undo step, and the cursor ends after the inserted body.

**Rationale:** RM261003ABZP-REQ6@R2 asks for insertion "into any note", and notes are Markdown files, so the binding is scoped to the `markdown` file type like the DI3 note keys. Obsidian's Insert template splits off the template's frontmatter and merges it into the note's properties (RF8). Inserting it verbatim mid-note would leave a second `---` block in the body that Obsidian would not create. The merge reuses the frontmatter patching from W26100423LX-REQ10@R2, so properties keep their comments and order. One undo step makes a wrong template a single `u` away.

```text
note:     ---\ntags: [work]\nstatus: open\n---\n# Meeting\n▌
template: ---\ntags: [meeting]\nstatus: draft\n---\n## Notes\n- 
result:   ---\ntags: [work, meeting]\nstatus: open\n---\n# Meeting\n## Notes\n- ▌
```

**Acceptance Criteria:**

- [ ] `<leader>nt` is bound only in Markdown buffers and lists the `.md` files under `[templates] folder`, including subfolders, sorted by relative path.
- [ ] With no templates, the picker shows `No templates in <folder>/` with a hint to create one.
- [ ] The preview shows the source with variables highlighted and the expansion; below 100 columns the preview is hidden and `Tab` toggles it.
- [ ] At line 1, column 1, the whole expansion, frontmatter included, is inserted unchanged.
- [ ] Elsewhere, the body is inserted at the cursor and the template's properties merge into the note's frontmatter (lists unioned, existing scalars kept, a block created when the note has none) without changing other frontmatter text.
- [ ] The insertion and merge form one undo step; `u` restores the note exactly.
- [ ] In a read-only buffer the command is refused with a toast and nothing is inserted.

**Depends On:** W26100423LX-REQ3@R2, W26100423LX-REQ6@R2, W26100423LX-REQ10@R2

## W26100423LX-REQ5@R1: New note from a template

**Requirement ID:** `W26100423LX-REQ5`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF6` and `RF8` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** How does the user create a new note that starts from a template?

**Answer:** `<leader>nn` prompts for a title with a file-name preview, then opens the template picker with `(blank note)` first. `so` creates `<title>.md` at the workspace root exclusively, with the chosen template expanded or empty, and opens it in Insert mode. A title containing `/` creates the note in that subfolder.

**Rationale:** The workspace root matches Obsidian's default new-note location and needs no new setting. Exclusive create keeps the never-overwrite rule: an existing name is refused instead of replaced. `(blank note)` first keeps the common case at one extra `Enter`, as the accepted UI specifies.

**Acceptance Criteria:**

- [ ] The prompt previews the resulting relative path as the title is typed; an empty title, a title that resolves outside the workspace, or a name with characters the file system rejects is refused inline.
- [ ] The template picker lists `(blank note)` first, then the templates from W26100423LX-REQ4@R2.
- [ ] The note is created exclusively; if the path exists, nothing is written, an error toast names the path, and the existing note is not opened as if new.
- [ ] The new note opens in Insert mode with the cursor at the end of the expanded text.
- [ ] `Esc` at either step cancels without creating anything.

**Depends On:** W26100423LX-REQ3@R2, W26100423LX-REQ4@R2, W26100423LX-REQ6@R2

## W26100423LX-REQ6@R2: Daily-note and template configuration

**Requirement ID:** `W26100423LX-REQ6`

**Revision:** `R2`

**Previous Revision:** `W26100423LX-REQ6@R1`

**Replaces:** None

**Research Relationship:** `RF8` evaluated `W26100423LX-REQ6@R1` and informed this revision

**Revision Summary:** `[templates] folder` may not be the workspace root, matching Obsidian's refusal of the vault root as the template folder (RF8).

**Question:** Which settings control daily notes and templates, and how are they validated?

**Answer:** `config.toml` accepts `[daily] folder` (default `daily`), `format` (default `YYYY-MM-DD`), `template` (default `templates/daily.md`), and `[templates] folder` (default `templates`). Paths are workspace-relative and must stay inside the workspace. The keys follow the existing strict schema, line-numbered errors, and `:ConfigReload` behavior.

**Rationale:** These are the keys and defaults in the parent AppConfig (`rm261003abzp-design.md:420`) and RM261003ABZP-REQ6@R2, accepted in RM261003ABZP-M5@R2 feedback cycle 1 (AD2). Reusing the existing config pipeline keeps one validation and reporting path. Obsidian refuses the vault root as the template folder (RF8), because the template picker would then list every note.

```toml
[daily]
folder = "journal"
format = "YYYY/MM/YYYY-MM-DD"
template = "templates/daily.md"

[templates]
folder = "templates"
```

**Acceptance Criteria:**

- [ ] Without the sections, the defaults apply.
- [ ] An absolute path, a path with a `..` segment that leaves the workspace, an empty `format`, a `[templates] folder` that names the workspace root (`""`, `.`, or `/`), or an unknown key is a config error naming its line; at startup the defaults apply, and `:ConfigReload` keeps the current config.
- [ ] After a valid `:ConfigReload`, the next `:Today`, calendar, and template picker use the new values.

**Depends On:** None

## W26100423LX-REQ7@R2: Bases engine and registered `base` editor kind

**Requirement ID:** `W26100423LX-REQ7`

**Revision:** `R2`

**Previous Revision:** `W26100423LX-REQ7@R1`

**Replaces:** None

**Research Relationship:** `RF3` and `RF4` evaluated `W26100423LX-REQ7@R1` and informed this revision; `RF1` evaluated `W26100423LX-REQ7@R1` and retained its registry and fallback rule

**Revision Summary:** Four changes. An unsupported filter is now a distinct, visible state, because it hides every row it guards (RF4). `file.inFolder` and `file.hasTag` follow Obsidian's semantics instead of Alfred's narrower ones. Single-quoted string literals are accepted. Constructs that Obsidian rejects but Alfred accepts produce a warning diagnostic, and legacy `sort[].column` is honored (RF3).

**Question:** How are `.base` files parsed, evaluated, and opened?

**Answer:** `.base` is registered as file type `base` with editor kind `base`. Opening one shows the Bases view instead of the YAML text. The ported Alfred parser and evaluator read `filters` (`and`/`or`/`not`), `formulas`, `properties`, `summaries`, and `views` with Alfred's expression subset over every file in `NoteIndex`. Within that subset, `file.inFolder` includes subfolders, `file.hasTag` matches any listed tag including nested tags, and strings may use single or double quotes, all as in Obsidian. Unsupported syntax produces a diagnostic while the rest renders. An unsupported filter names itself as hiding rows. View types resolve through a registry: `table` and the verified Kanban type have views, and any other type opens as a table with a notice.

**Rationale:** This is RM261003ABZP-REQ7@R2 and RM261003ABZP-DES12@R2. Registration keeps the kernel language-neutral (RM261003ABZP-REQ11@R3), and porting Alfred's engine gives tested Bases semantics instead of new ones. Bases candidates include non-Markdown files because Obsidian Bases list every vault file; those files expose `file.*` properties but no note properties. A base window must never pass keys to vim, because an unbound key would otherwise edit and autosave the YAML that `so` must never write.

The research changed four details (RF3, RF4):

- **Folder and tag semantics.** Alfred's exact-folder `inFolder` and first-argument `hasTag` silently show fewer rows than Obsidian for filters that Obsidian's own docs lead with. Correcting functions already in the subset adds no syntax, so it stays inside the parent boundary against widening the subset.
- **Quoting.** Single quotes are a lexical form of the string literal Alfred already supports, not a new construct, and Obsidian documents both quote styles.
- **Unsupported filters.** A filter that cannot be evaluated excludes its rows, as in Alfred. Without a distinct notice, the user would see an empty or short view with no explanation.
- **Lenient parsing.** Obsidian refuses a view without a string `name` or with a `groupBy` lacking `property` or `direction`, while Alfred accepts both. `so` keeps rendering but warns, so the user learns the file will not load in Obsidian.

**Acceptance Criteria:**

- [ ] `FileTypeRegistry.forPath("x.base")` returns the `base` file type, and its window uses editor kind `base`; the kernel has no `.base` special case.
- [ ] Alfred's ported parser, evaluator, and expression tests pass against the port, except cases that pin the corrected `inFolder` and `hasTag` semantics, which are updated to Obsidian's.
- [ ] `file.inFolder("Projects")` matches `Projects/2026/a.md`; `file.hasTag("a", "b")` matches a note tagged `#b` or `#a/x`; `status == 'todo'` and `status == "todo"` evaluate the same.
- [ ] Every Bases candidate exposes `file.name`, `file.basename`, `file.path`, `file.folder`, `file.ext`, `file.size`, `file.ctime`, `file.mtime`, `file.tags`, and `file.links` as Alfred defines them; note properties come from indexed frontmatter.
- [ ] Unsupported expressions or keys appear as diagnostics; a base with one bad formula still renders its other columns and rows.
- [ ] A global or view filter that uses unsupported syntax shows a diagnostic stating that the filter hides rows, naming the filter text.
- [ ] A view without a string `name`, or with a `groupBy` missing `property` or `direction`, renders and shows a warning that Obsidian will not load it; `sort` entries using legacy `column` sort like `property`.
- [ ] A view of type `cards`, `list`, `map`, or an unknown type opens as a table with the notice from RM261003ABZP-UDES9@R1, and the file is untouched.
- [ ] No key in a base window reaches the vim engine or changes the `.base` buffer, and `so` never writes a `.base` file.
- [ ] A `.base` file that is not valid YAML shows the parse error and no rows, without crashing.

**Depends On:** W26100423LX-REQ3@R2

## W26100423LX-REQ8@R2: Table view

**Requirement ID:** `W26100423LX-REQ8`

**Revision:** `R2`

**Previous Revision:** `W26100423LX-REQ8@R1`

**Replaces:** None

**Research Relationship:** `RF2`, `RF3`, and `RF5` evaluated `W26100423LX-REQ8@R1` and informed this revision; `RF4` evaluated `W26100423LX-REQ8@R1` with no change beyond W26100423LX-REQ7@R2

**Revision Summary:** Three changes. Grouped tables honor a view's `groupOrder` read-only (RF2). Summaries follow Obsidian's 15 default summary names, because Alfred evaluates none, and custom `values` summaries produce a diagnostic (RF3). A property's editor type comes from `.obsidian/types.json` when it assigns one, else from the value's shape, using Obsidian's inference rules (RF5).

**Question:** What does the table view show, and how is it navigated and edited?

**Answer:** The table shows the view's rows with columns in the view's `order` and the view's sort and grouping, as RM261003ABZP-UDES9@R1 and the Base table component specify. Groups follow `groupOrder` when the view has one. Summaries come from Obsidian's default summary names. The keyboard moves between cells; `i` opens an editor for a note property, typed as Obsidian would type it; `x` toggles a checkbox; `s`, `g`, and `f` cycle sort, toggle grouping, and toggle the filter in memory; `Enter` opens the row's note.

**Rationale:** The accepted mockup RM261003ABZP-M6@R1 fixes the table's look and keys. Sort, group, and filter changes stay in memory because `.base` files are never written. Only note properties are editable, because `file.*` and formula values are derived.

The research filled three gaps:

- **Group order.** Obsidian ≥ 1.14.3 stores manual group order and hidden groups in `groupOrder` for every view type, so ignoring it would show groups Obsidian hides (RF2).
- **Summaries.** Alfred parses `summaries` but evaluates none, so the summary row needs Obsidian's documented defaults as its source (RF3): Average, Min, Max, Sum, Range, Median, Stddev, Earliest, Latest, date Range, Checked, Unchecked, Empty, Filled, and Unique. Custom `values` formulas need expression features outside the subset.
- **Property types.** Obsidian types a property by its `types.json` assignment, else by the value's shape (RF5). Using the same rule means a number property that is empty in one note is still edited as a number.

**Acceptance Criteria:**

- [ ] Rows, column order, sort, and grouping match the ported Alfred fixtures. A view with `groupOrder` shows only the listed groups, in that order, with `null` as the `None` group.
- [ ] Each of Obsidian's 15 default summary names computes its documented result on a fixture; a custom `values` summary shows a diagnostic and an empty cell.
- [ ] A property's editor type is the type assigned in `.obsidian/types.json` (name matched case-insensitively) when present and the value validates against it. Otherwise it is inferred: `YYYY-MM-DD` string → date, number → number, boolean → checkbox, array → list, anything else → text.
- [ ] Cell editors follow that type: text, number with `Ctrl-a`/`Ctrl-x`, date `YYYY-MM-DD` with `Ctrl-a`/`Ctrl-x`, list, and checkbox (`x`). An invalid value shows an inline error and is not written; `Esc` restores the previous value.
- [ ] `file.*` and formula cells are read-only; `i` on them explains why.
- [ ] `s`, `g`, and `f` re-evaluate the view model, keep focus on the same note, and never write the `.base` file.
- [ ] Wide tables scroll horizontally with `› +N cols`; `Enter` opens the focused row's note.

**Depends On:** W26100423LX-REQ7@R2, W26100423LX-REQ10@R2

## W26100423LX-REQ9@R2: Kanban view behind a verified type constant

**Requirement ID:** `W26100423LX-REQ9`

**Revision:** `R2`

**Previous Revision:** `W26100423LX-REQ9@R1`

**Replaces:** None

**Research Relationship:** `RF1` and `RF2` evaluated `W26100423LX-REQ9@R1` and informed this revision

**Revision Summary:** Three changes. Columns honor `groupOrder` read-only (RF2). The fixture must be saved by core Obsidian 1.14.3 or later with no community Kanban plugin enabled, and the user supplies it, because only an early-access build or a later public release can produce it (RF1). Until it arrives, the Kanban view is built and tested but no `type` string maps to it, and the missing fixture is an open DI4 item that blocks the PH2 exit.

**Question:** How does the Kanban view behave, and when may it ship?

**Answer:** A view whose `type` equals the one `KANBAN_TYPE` constant renders as a board grouped by the view's single `groupBy` property. Its columns are the `groupOrder` values in order when the view has them, else each distinct value plus a `None` column for notes without the property. `H`/`L` move the focused card to the adjacent column and write that property (moving to `None` removes it). Moves are disabled with an explanation when grouping by a formula or a `file.*` property. `KANBAN_TYPE` gets its value only from a `.base` file that the user saves with core Obsidian 1.14.3 or later, with no community Kanban plugin enabled, and whose provenance is recorded. Until then, the board is implemented and tested through its view model and view, no `type` string selects it, and a Kanban view opens as a table with the fallback notice.

**Rationale:** The board semantics are RM261003ABZP-REQ7@R2 and Alfred's board rules, and the verification gate is a parent obligation (phase file line 481) that DI4 cannot waive. Research found no file that meets it (RF1). Kanban exists only in Obsidian 1.14.x early access (1.14.4 on 2026-10-01), the public release is 1.13.7, and no primary source names the `type` string. The only evidence for `kanban` is a third-party issue, and that string is also used by the Base Board community plugin with different keys, so provenance must rule the plugin out. Requiring 1.14.3 or later means the fixture also shows how `groupOrder` is serialized (RF2).

Building the board now and leaving the constant unmatched lets everything except the type string be verified in DI4. When the fixture arrives, enabling Kanban becomes one value and one fixture test, not new design. Grouping by `file.folder` stays non-movable even though Obsidian ≥ 1.14.2 moves the file, because moving files from a board is outside DI4's write scope. The explanation toast says so.

```text
tasks.base view type = KANBAN_TYPE, groupBy status, groupOrder [todo, doing, done, null]
card "Write spec" in todo → L → doing column; note frontmatter: "- status: todo" / "+ status: doing"
group by formula.late → L → toast "Moves are off: this board groups by a formula", no write
before the fixture: type kanban → table + notice "kanban view is not supported yet; showing a table"
```

**Acceptance Criteria:**

- [ ] `KANBAN_TYPE` is defined once. Once the fixture exists, a test parses it and asserts its view type equals the constant. Before then, no `type` string selects the board, and a Kanban view opens as a table with the fallback notice.
- [ ] The fixture's provenance (Obsidian version from Settings → About, installer version, OS, date, the steps used, and confirmation that no community Kanban plugin was enabled) is recorded beside it.
- [ ] With `groupOrder`, columns are exactly its values in order (`null` = `None`); without it, columns follow the distinct values of the group-by property, plus `None` for notes without it.
- [ ] `H`/`L` move the card, write the property per W26100423LX-REQ10@R2, and keep the card focused; moving to `None` removes the property.
- [ ] Grouping by a formula or `file.*` property, including `file.folder`, shows `⊘ moves off`, and `H`/`L` show the explanation toast without writing.
- [ ] The board's view model and view are verified with a test-only type registration, so every criterion above except the fixture assertion passes before the fixture exists.
- [ ] Until the fixture lands, DI4 progress records Kanban enablement as open and blocking the PH2 exit; DI4 is not reported as fully delivered.

**Depends On:** W26100423LX-REQ7@R2, W26100423LX-REQ10@R2

## W26100423LX-REQ10@R2: Safe frontmatter write-back

**Requirement ID:** `W26100423LX-REQ10`

**Revision:** `R2`

**Previous Revision:** `W26100423LX-REQ10@R1`

**Replaces:** None

**Research Relationship:** `RF5` evaluated `W26100423LX-REQ10@R1` and informed this revision

**Revision Summary:** Three changes. A text value that would parse as another type is written quoted. Removing the last key removes the whole `---` block, as Obsidian does. The patch is text-level new code rather than a port of Alfred's whole-object re-stringify, which loses comments (RF5).

**Question:** How do Bases edits reach the notes without corrupting them or losing other edits?

**Answer:** A cell edit or card move changes exactly one frontmatter key of one note through a text-level patch. The patch keeps comments, key order, and all other text byte-for-byte. It adds a frontmatter block when the note has none and removes the block when the last key is removed. Values are written in the YAML form Obsidian reads back as the same type, and text that would otherwise read as a number, boolean, or date is quoted. If the note is open, the patch is applied to its buffer as one undo step and saved by autosave. If it is closed, the patch is written through the checked edit path, which rejects the write when the file's text no longer matches. A toast shows the frontmatter diff.

**Rationale:** Reusing the open-buffer and closed-file path from link-safe rename (`src/core/state/link-edits.ts:201-214`) gives Bases the same conflict safety without a second write path: unsaved buffer edits are never overwritten, and a file changed by another program is never clobbered. Patching only the edited key is what keeps Obsidian, Git diffs, and the user's comments intact.

The write rules come from the research (RF5):

- **Why new code.** Obsidian's own writer and Alfred's patcher both re-serialize the whole block and lose comments and quoting. Preservation therefore needs text-level patching, and it is stricter than Obsidian, which reads any valid YAML.
- **Quoting.** Obsidian infers a type from an unquoted value's shape. A text value like `42`, `true`, or `2026-10-05` must stay quoted, or it changes type unless `types.json` pins it.
- **Empty block.** Dropping the empty block matches what Obsidian itself writes.

```yaml
# before                         # after moving the card to "doing"
---                              ---
status: todo   # set by me       status: doing   # set by me
due: 2026-10-05                  due: 2026-10-05
---                              ---
```

**Acceptance Criteria:**

- [ ] Fixture tests show that patching one key preserves comments, key order, quoting of other keys, line endings, and the body byte-for-byte.
- [ ] Setting a key on a note without frontmatter adds a `---` block at the top; removing the last key removes the whole block and leaves the body unchanged.
- [ ] An edit to an open note changes its buffer in one undo step, and the buffer is saved by autosave.
- [ ] An edit to a closed note whose text changed since it was indexed is not written; an error toast says so, and the view re-evaluates from the new text.
- [ ] Every successful edit shows a toast with the removed and added frontmatter lines; a failed write restores the displayed value.
- [ ] Values are written as YAML that Obsidian reads back with the same property type: date as unquoted `YYYY-MM-DD`, number as a YAML number, checkbox as `true`/`false`, list as a block sequence, and text quoted whenever its unquoted form would parse as a number, boolean, date, or null.

**Depends On:** W26100423LX-REQ7@R2

## W26100423LX-REQ11@R1: Base embeds in notes

**Requirement ID:** `W26100423LX-REQ11`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF2` and `RF4` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** How do `![[x.base]]` and `![[x.base#View]]` render inside notes?

**Answer:** In the live and reading views, a `base` block renderer replaces the embed with a read-only rendering of the named view, or the first view when no view is named, through the G4 block-renderer and widget-painter registries. It is limited to `[preview] embedMaxRows` rows. `Enter` on the embed opens the `.base` file at that view. A missing file or view shows the embed's title with a notice instead of failing.

**Rationale:** This is RM261003ABZP-REQ7@R2's embed criterion, built on the DI3 extension points the parent names (RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2). Read-only embeds keep a second editing surface out of v1, and the row limit reuses the existing embed budget, so a large base cannot flood a note. A throwing renderer already falls back to source with a `⚠` sign (`live-preview.ts:121-130`).

**Acceptance Criteria:**

- [ ] `![[tasks.base]]` renders the first view and `![[tasks.base#Board]]` the view named `Board`, in live and reading views; the source view shows the raw text.
- [ ] The embed shows at most `embedMaxRows` rows, with a `↓ N more` line when truncated.
- [ ] The embed updates when the base's candidate notes change in the index.
- [ ] A missing `.base` file or view name shows the title and a notice; a renderer error leaves the source with `⚠`.
- [ ] `Enter` on the embed opens the `.base` file with that view selected.
- [ ] In the browser preview the embed still renders as a link to the `.base` file.

**Depends On:** W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2

## W26100423LX-REQ12@R1: Base window lifecycle

**Requirement ID:** `W26100423LX-REQ12`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF3` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** How does a base window start, stay current, and survive a restart?

**Answer:** A base window opens on its first view, or on the view an embed named, with the cursor on the first row or card. It re-evaluates when the index or the `.base` file changes, keeping focus on the same note when it is still visible. While the index is still building, it shows `◌ waiting for index`. A restart restores the base window by path at its first view; view, sort, and cursor are not persisted, and `PersistedState` stays `version: 1`.

**Rationale:** Re-evaluating on index changes keeps the view truthful after edits elsewhere, including the view's own write-back. Restoring by path reuses the existing session format, so older state files still load and no migration is needed; per-view state is cheap to rebuild and not worth a format change in v1.

**Acceptance Criteria:**

- [ ] A base opened before the index is ready shows `◌ waiting for index`, then the rows once it is ready.
- [ ] After an external edit to a candidate note, the view updates and focus stays on the same note if it still matches.
- [ ] After the `.base` file changes on disk, the view re-parses it and keeps the selected view by name when it still exists, else the first view.
- [ ] A session with a base window restores it at its first view; a state file written before DI4 still loads.

**Depends On:** W26100423LX-REQ7@R2

## W26100423LX-REQ13@R1: Integration, accessibility, and performance re-checks

**Requirement ID:** `W26100423LX-REQ13`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF1` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** What must still hold after DI4 lands, given that it merges last in PH2?

**Answer:** DI4's CI on top of merged DI3 re-passes RM261003ABZP-V7@R2, RM261003ABZP-V12@R3, and RM261003ABZP-V16@R2 with the `base` renderer registered, and RM261003ABZP-UV3@R2 with a Base embed added to `tour.md`. DI4's surfaces meet RM261003ABZP-UV7@R1, RM261003ABZP-UV8@R1, and RM261003ABZP-UV10@R1 (focused Base cell, focused Kanban card, calendar selection under `NO_COLOR`, the light theme, and 80×24). The boundary test passes without exceptions, and the `bun run check` and CI budgets hold.

**Rationale:** The phase assigns cross-work integration to the DI that merges last (phase file line 553), and the PH2 exit needs passing CI evidence for V9, V10, UV7, UV8, and UV10 on merged DI4 (lines 547–551). Re-running the live keystroke benchmark with the `base` renderer is the only way to know the embed path does not regress typing.

**Acceptance Criteria:**

- [ ] V7@R2 layout goldens, V16@R2 registration-only extension, and UV3@R2 (with a Base embed in `tour.md`) pass in CI.
- [ ] V12@R3 live keystroke p95 stays within its gate with the `base` renderer registered and a base embed in the bench note.
- [ ] UV7@R1, UV8@R1, and UV10@R1 pass for the calendar, template picker, table, and Kanban surfaces.
- [ ] `test/boundaries.test.ts` passes; any new package home is declared in `PACKAGE_HOMES`.
- [ ] `bun run check` stays under 30 s and CI under 3 min.

**Depends On:** W26100423LX-REQ2@R1, W26100423LX-REQ4@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ11@R1

# 6. Research Impact Review

| Finding | Evaluated Revision | Assessment | Outcome | Current Requirement(s) | Rationale |
|---|---|---|---|---|---|
| `RF1` | `W26100423LX-REQ9@R1` | Supports the gate and table fallback; adds that only an early-access 1.14.x build or a later public release can produce the fixture, that `type: kanban` is shared with the Base Board plugin, and that the phase exit may stay blocked | Revised | `W26100423LX-REQ9@R2` | The fixture's supplier (the user), its minimum version (1.14.3), and the plugin-absent provenance are now explicit. The board is built but unmatched until the fixture lands, and the missing fixture is recorded as an open DI4 item blocking the PH2 exit, not waived |
| `RF1` | `W26100423LX-REQ7@R1` | Supports the registry with a table fallback for unknown types | Retained | `W26100423LX-REQ7@R2` | The registry rule needed no change for RF1; REQ7 was revised for RF3 and RF4 only |
| `RF1` | `W26100423LX-REQ13@R1` | Supports reporting DI4 delivery only with its verification evidence | Retained | `W26100423LX-REQ13@R1` | UV8's Kanban surface checks run through the test-only type registration in W26100423LX-REQ9@R2, so REQ13's criteria stay achievable as written |
| `RF2` | `W26100423LX-REQ9@R1` | Challenges "columns follow the distinct values" for bases with `groupOrder`; notes Obsidian ≥ 1.14.2 moves files when grouped by `file.folder` | Revised | `W26100423LX-REQ9@R2` | Columns honor `groupOrder` read-only. The stricter no-move rule for `file.folder` is kept with an explanation, because moving files from a board is outside DI4's write scope |
| `RF2` | `W26100423LX-REQ8@R1` | Challenges table grouping that ignores `groupOrder`, which applies to every view type | Revised | `W26100423LX-REQ8@R2` | Grouped tables honor `groupOrder` read-only, so `so` shows the same groups as Obsidian |
| `RF2` | `W26100423LX-REQ11@R1` | Adds that embeds would inherit the grouping rule | Retained | `W26100423LX-REQ11@R1` | Embeds render through the same view models as W26100423LX-REQ8@R2 and W26100423LX-REQ9@R2, so they honor `groupOrder` without a separate rule |
| `RF3` | `W26100423LX-REQ7@R1` | Supports the parse/diagnostic split (only invalid YAML fails); adds that Obsidian rejects constructs Alfred accepts and that legacy `sort[].column` is ignored by Alfred | Revised | `W26100423LX-REQ7@R2` | Warn on views that Obsidian would refuse, honor `column`, and limit the parse-error path to invalid YAML |
| `RF3` | `W26100423LX-REQ8@R1` | Challenges "summaries match the ported Alfred fixtures": Alfred evaluates no summaries | Revised | `W26100423LX-REQ8@R2` | Obsidian's 15 documented default summary names become the source; custom `values` summaries produce a diagnostic because they need expressions outside the subset |
| `RF3` | `W26100423LX-REQ12@R1` | Supports re-parsing on change and keeping the selected view by name | Retained | `W26100423LX-REQ12@R1` | View names are required by Obsidian, so keeping the view by name is reliable |
| `RF4` | `W26100423LX-REQ7@R1` | Supports formula diagnostics; challenges silent row loss from unsupported filters and from Alfred's narrower `inFolder` and `hasTag`; raises single-quoted strings | Revised | `W26100423LX-REQ7@R2` | An unsupported filter gets its own notice. `inFolder` and `hasTag` follow Obsidian. Single quotes are accepted as a lexical form of the existing string literal. No new function or operator is added, so the parent boundary against widening the subset holds |
| `RF4` | `W26100423LX-REQ8@R1` | Adds that table rows depend on the corrected evaluator | No impact | `W26100423LX-REQ8@R2` | Row selection is owned by W26100423LX-REQ7@R2; REQ8's revision comes from RF2, RF3, and RF5 |
| `RF4` | `W26100423LX-REQ11@R1` | Adds that embeds render the evaluated view | Retained | `W26100423LX-REQ11@R1` | Embeds inherit the evaluator fixes through W26100423LX-REQ7@R2 |
| `RF5` | `W26100423LX-REQ10@R1` | Supports the type list and date format; adds quoting for type-ambiguous text, Obsidian's empty-block removal, and that Alfred's patcher cannot be ported for preservation | Revised | `W26100423LX-REQ10@R2` | Quote ambiguous text, drop the block when the last key goes, and patch at the text level |
| `RF5` | `W26100423LX-REQ8@R1` | Adds that Obsidian types properties by `types.json`, then by value shape | Revised | `W26100423LX-REQ8@R2` | Cell editors use the same typing rule, so an empty number property is still edited as a number |
| `RF6` | `W26100423LX-REQ3@R1` | Contradicts the whitespace-trimming claim and the `{{ Title }}` example; confirms case-insensitivity, defaults, and unknown variables | Revised | `W26100423LX-REQ3@R2` | Expansion copies Obsidian's regexes exactly: no trimming, one clock reading, and an empty format means the default |
| `RF6` | `W26100423LX-REQ4@R1` | Confirms `{{title}}` and variable handling for insertion | Retained | `W26100423LX-REQ4@R2` | No change from RF6; REQ4 was revised for RF8 only |
| `RF6` | `W26100423LX-REQ5@R1` | Confirms variable handling for new notes | Retained | `W26100423LX-REQ5@R1` | Expansion behavior is owned by W26100423LX-REQ3@R2 |
| `RF7` | `W26100423LX-REQ1@R1` | Confirms local time, open-without-write, and subfolders; challenges `{{title}}` as base name; leaves `{{date}}` for other days unspecified; notes a case-insensitive existence check | Revised | `W26100423LX-REQ1@R2` | `{{title}}` follows Obsidian, `{{date}}` is pinned to the note's day as a stated `so` choice, and the existence check is case-insensitive. The fallback template, folder creation, and adjacent-day creation stay as accepted UI choices with no file-compatibility impact |
| `RF7` | `W26100423LX-REQ2@R1` | Adds that the calendar creates notes through REQ1's path | Retained | `W26100423LX-REQ2@R1` | It inherits W26100423LX-REQ1@R2's rules through its dependency |
| `RF7` | `W26100423LX-REQ6@R1` | Notes Obsidian's default folder is the vault root, not `daily` | No impact | `W26100423LX-REQ6@R2` | The `daily` default is fixed by the parent AppConfig and RM261003ABZP-REQ6@R2 |
| `RF8` | `W26100423LX-REQ4@R1` | Confirms `{{title}}`, recursive listing, and insert-at-cursor; adds that Obsidian merges template properties instead of pasting frontmatter mid-note | Revised | `W26100423LX-REQ4@R2` | Template frontmatter merges into the note's frontmatter away from the top of the note, in one undo step, using W26100423LX-REQ10@R2's patching |
| `RF8` | `W26100423LX-REQ5@R1` | Confirms the workspace-root default | Retained | `W26100423LX-REQ5@R1` | Matches Obsidian's `newFileLocation: root` |
| `RF8` | `W26100423LX-REQ6@R1` | Adds that Obsidian refuses the vault root as the template folder | Revised | `W26100423LX-REQ6@R2` | The root is now a config error for `[templates] folder` |
| `RF9` | `W26100423LX-REQ3@R1` | Confirms the supported-token outputs; challenges the `ww` example and the undefined tokenizer rule for unsupported tokens | Revised | `W26100423LX-REQ3@R2` | The tokenizer recognizes Moment's full token set so unsupported tokens stay whole; the `ww` and `dd` examples are labeled `so` divergences |
| `RF9` | `W26100423LX-REQ1@R1` | Daily paths use the formatter | No impact | `W26100423LX-REQ1@R2` | Daily paths inherit the formatter rules through W26100423LX-REQ3@R2 |

# 7. Historical Requirement Revisions

## W26100423LX-REQ1@R1: Daily notes open or are created safely

**Requirement ID:** `W26100423LX-REQ1`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W26100423LX-REQ1@R2`

**Research Relationship:** `RF7` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** How do `:Today`, `:Yesterday`, and `:Tomorrow` find, create, and open a daily note?

**Answer:** `<leader>nd` and `:Today` open `<[daily] folder>/<today formatted with [daily] format>.md`, using the local date. When the file is missing, `so` creates it exclusively with the expanded daily template and opens it. When it exists, `so` opens it unchanged. `:Yesterday` and `:Tomorrow` open the day before or after the open daily note, or relative to today when the active buffer is not a daily note. A `/` in the format creates subfolders.

**Rationale:** This matches RM261003ABZP-REQ6@R2 and Obsidian's Daily notes plugin, which uses local time and opens rather than recreates an existing note. Exclusive create is the only safe way to rule out the race between the index check and the write, so the parent's never-overwrite rule holds even when the index is stale or another program created the file. The template fallbacks follow the accepted UI states in RM261003ABZP-UDES8@R1.

```text
2026-10-03, format YYYY/MM/YYYY-MM-DD → daily/2026/10/2026-10-03.md
:Today (missing)  → create from templates/daily.md → toast "Created daily/2026/10/2026-10-03.md from templates/daily.md"
:Today (again)    → open the same file, bytes unchanged
create hits EEXIST → read and open the existing file, no write
```

**Acceptance Criteria:**

- [ ] `:Today` and `<leader>nd` open the path from `[daily] folder` and `[daily] format` for the local date; a format containing `/` creates the missing parent folders.
- [ ] A missing note is created with the daily template expanded per W26100423LX-REQ3@R1 (`{{title}}` is the note's base name), then opened. A success toast names the created path and the template.
- [ ] A second `:Today` opens the existing file and leaves its bytes and mtime unchanged.
- [ ] If the file appears between the index check and creation, creation fails with `EEXIST`, and `so` opens the existing file without writing to it.
- [ ] When the configured template file does not exist, the note is created from the built-in template `# {{date}}`. When the template exists but cannot be read, the note is created empty and an error toast names the template.
- [ ] After opening, the cursor is on the first unchecked task (`- [ ]`) if there is one, else at the end of the file.
- [ ] `:Yesterday` and `:Tomorrow` step one day from the open daily note's date (parsed with `[daily] format`), else from today, and open or create that day the same way.
- [ ] Tests run with a fixed clock and a fixed `TZ`.

**Depends On:** W26100423LX-REQ3@R1, W26100423LX-REQ6@R1

## W26100423LX-REQ3@R1: Obsidian-compatible date formatting and template expansion

**Requirement ID:** `W26100423LX-REQ3`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W26100423LX-REQ3@R2`

**Research Relationship:** `RF6`, `RF9` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** Which date tokens and template variables are supported, and how must their output compare with Obsidian?

**Answer:** One pure formatter supports the Moment.js tokens `YYYY YY M MM MMM MMMM D DD Do d ddd dddd H HH h hh m mm s ss A a` and `[literal]` escapes with Moment's `en` output, and keeps any other text literal. Template expansion replaces `{{title}}`, `{{date}}` (`YYYY-MM-DD`), `{{time}}` (`HH:mm`), `{{date:FORMAT}}`, and `{{time:FORMAT}}`, matching variable names case-insensitively and leaving any other `{{…}}` untouched. Bases date cells use the same formatter.

**Rationale:** RM261003ABZP-REQ6@R2 fixes the token list, and RM261003ABZP-DES11@R1 rejects a Moment or Day.js dependency. One shared formatter keeps daily paths, templates, and Bases date cells consistent. Obsidian's Templates plugin matches variable names case-insensitively and trims spaces inside the braces, so `so` does the same; leaving unknown variables untouched keeps templates authored for Templater or other plugins intact.

```text
format(2026-10-03T09:05, "dddd, MMMM Do YYYY [at] h:mm A") → "Saturday, October 3rd 2026 at 9:05 AM"
format(2026-10-03T09:05, "YYYY-[W]ww")                     → "2026-Www"   (ww unsupported → literal)
"# {{date:dddd, MMMM D}} {{ Title }} {{weather}}"          → "# Saturday, October 3 Meeting {{weather}}"
```

**Acceptance Criteria:**

- [ ] Formatting 2026-10-03T09:05 local time with every supported token equals Moment.js 2.x output for the same format; the expected strings are recorded in the test.
- [ ] `[literal]` text is emitted without brackets; unsupported tokens and other characters are emitted unchanged.
- [ ] Expanding a template containing every variable produces the expected text; `{{date:FORMAT}}` and `{{time:FORMAT}}` use the formatter; unknown `{{…}}` stays unchanged.
- [ ] The formatter lives in pure core (no I/O or runtime imports) and is the only date formatter used by daily notes, templates, and Bases.

**Depends On:** None

## W26100423LX-REQ4@R1: Template insertion

**Requirement ID:** `W26100423LX-REQ4`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W26100423LX-REQ4@R2`

**Research Relationship:** `RF8` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** How does the user insert a template into a note?

**Answer:** In a Markdown note, `<leader>nt` opens a picker over the Markdown files in `[templates] folder` with the preview from RM261003ABZP-UDES8@R1 (template source with variables highlighted, then the expanded result). `Enter` inserts the expanded template at the cursor as one undo step and leaves the cursor after the insertion.

**Rationale:** RM261003ABZP-REQ6@R2 asks for insertion "into any note", and notes are Markdown files, so the binding is scoped to the `markdown` file type like the DI3 note keys. One undo step makes a wrong template a single `u` away. Reusing the existing Picker keeps the overlay behavior consistent.

**Acceptance Criteria:**

- [ ] `<leader>nt` is bound only in Markdown buffers and lists the `.md` files under `[templates] folder`, including subfolders, by relative path.
- [ ] With no templates, the picker shows `No templates in <folder>/` with a hint to create one.
- [ ] The preview shows the source with variables highlighted and the expansion; below 100 columns the preview is hidden and `Tab` toggles it.
- [ ] `Enter` inserts the expansion at the cursor in one undo step, with `{{title}}` set to the current note's base name; `u` removes it completely.
- [ ] In a read-only buffer the command is refused with a toast and nothing is inserted.

**Depends On:** W26100423LX-REQ3@R1, W26100423LX-REQ6@R1

## W26100423LX-REQ6@R1: Daily-note and template configuration

**Requirement ID:** `W26100423LX-REQ6`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W26100423LX-REQ6@R2`

**Research Relationship:** `RF8` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** Which settings control daily notes and templates, and how are they validated?

**Answer:** `config.toml` accepts `[daily] folder` (default `daily`), `format` (default `YYYY-MM-DD`), `template` (default `templates/daily.md`), and `[templates] folder` (default `templates`). Paths are workspace-relative and must stay inside the workspace. The keys follow the existing strict schema, line-numbered errors, and `:ConfigReload` behavior.

**Rationale:** These are the keys and defaults in the parent AppConfig (`rm261003abzp-design.md:420`) and RM261003ABZP-REQ6@R2, accepted in RM261003ABZP-M5@R2 feedback cycle 1 (AD2). Reusing the existing config pipeline keeps one validation and reporting path.

```toml
[daily]
folder = "journal"
format = "YYYY/MM/YYYY-MM-DD"
template = "templates/daily.md"

[templates]
folder = "templates"
```

**Acceptance Criteria:**

- [ ] Without the sections, the defaults apply.
- [ ] An absolute path, a path with a `..` segment that leaves the workspace, an empty `format`, or an unknown key is a config error naming its line; at startup the defaults apply, and `:ConfigReload` keeps the current config.
- [ ] After a valid `:ConfigReload`, the next `:Today`, calendar, and template picker use the new values.

**Depends On:** None

## W26100423LX-REQ7@R1: Bases engine and registered `base` editor kind

**Requirement ID:** `W26100423LX-REQ7`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W26100423LX-REQ7@R2`

**Research Relationship:** `RF1`, `RF3`, `RF4` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** How are `.base` files parsed, evaluated, and opened?

**Answer:** `.base` is registered as file type `base` with editor kind `base`. Opening one shows the Bases view instead of the YAML text. The ported Alfred parser and evaluator read `filters` (`and`/`or`/`not`), `formulas`, `properties`, `summaries`, and `views` with Alfred's expression subset over every file in `NoteIndex`. Unsupported syntax produces a diagnostic in the toolbar while the rest renders. View types resolve through a registry: `table` and the verified Kanban type have views, and any other type opens as a table with a notice.

**Rationale:** This is RM261003ABZP-REQ7@R2 and RM261003ABZP-DES12@R2. Registration keeps the kernel language-neutral (RM261003ABZP-REQ11@R3), and porting Alfred's engine gives tested Bases semantics instead of new ones. Bases candidates include non-Markdown files because Obsidian Bases list every vault file; those files expose `file.*` properties but no note properties. A base window must never pass keys to vim, because an unbound key would otherwise edit and autosave the YAML that `so` must never write.

**Acceptance Criteria:**

- [ ] `FileTypeRegistry.forPath("x.base")` returns the `base` file type, and its window uses editor kind `base`; the kernel has no `.base` special case.
- [ ] Alfred's ported parser, evaluator, and expression tests pass against the port.
- [ ] Every Bases candidate exposes `file.name`, `file.basename`, `file.path`, `file.folder`, `file.ext`, `file.size`, `file.ctime`, `file.mtime`, `file.tags`, and `file.links` as Alfred defines them; note properties come from indexed frontmatter.
- [ ] Unsupported expressions or keys appear as diagnostics; a base with one bad formula still renders its other columns and rows.
- [ ] A view of type `cards`, `list`, `map`, or an unknown type opens as a table with the notice from RM261003ABZP-UDES9@R1, and the file is untouched.
- [ ] No key in a base window reaches the vim engine or changes the `.base` buffer, and `so` never writes a `.base` file.
- [ ] A `.base` file that fails to parse shows the parse error and no rows, without crashing.

**Depends On:** W26100423LX-REQ3@R1

## W26100423LX-REQ8@R1: Table view

**Requirement ID:** `W26100423LX-REQ8`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W26100423LX-REQ8@R2`

**Research Relationship:** `RF2`, `RF3`, `RF4`, `RF5` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** What does the table view show, and how is it navigated and edited?

**Answer:** The table shows the view's rows with columns in the view's `order`, the view's sort and grouping, and its summaries, as RM261003ABZP-UDES9@R1 and the Base table component specify. The keyboard moves between cells; `i` opens a type-specific editor for a note property; `x` toggles a checkbox; `s`, `g`, and `f` cycle sort, toggle grouping, and toggle the filter in memory; `Enter` opens the row's note.

**Rationale:** The accepted mockup RM261003ABZP-M6@R1 fixes the table's look and keys. Sort, group, and filter changes stay in memory because `.base` files are never written. Only note properties are editable, because `file.*` and formula values are derived.

**Acceptance Criteria:**

- [ ] Rows, column order, sort, grouping, and summaries match the ported Alfred fixtures.
- [ ] Cell editors follow the property type: text, number with `Ctrl-a`/`Ctrl-x`, date `YYYY-MM-DD` with `Ctrl-a`/`Ctrl-x`, list, and checkbox (`x`). An invalid value shows an inline error and is not written; `Esc` restores the previous value.
- [ ] `file.*` and formula cells are read-only; `i` on them explains why.
- [ ] `s`, `g`, and `f` re-evaluate the view model, keep focus on the same note, and never write the `.base` file.
- [ ] Wide tables scroll horizontally with `› +N cols`; `Enter` opens the focused row's note.

**Depends On:** W26100423LX-REQ7@R1, W26100423LX-REQ10@R1

## W26100423LX-REQ9@R1: Kanban view behind a verified type constant

**Requirement ID:** `W26100423LX-REQ9`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W26100423LX-REQ9@R2`

**Research Relationship:** `RF1`, `RF2` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** How does the Kanban view behave, and when may it ship?

**Answer:** A view whose `type` equals one `KANBAN_TYPE` constant renders as a board with one column per value of the view's single group-by property, plus a `None` column for notes without it. `H`/`L` move the focused card to the adjacent column and write that property (moving to `None` removes it). Moves are disabled with an explanation when grouping by a formula or a `file.*` property. The constant's value is enabled only after it is confirmed against a `.base` file saved by Obsidian 1.14 or later, with recorded provenance. Until then, Kanban views open as a table with the fallback notice.

**Rationale:** The board semantics are RM261003ABZP-REQ7@R2 and Alfred's board rules. The verification gate is a parent obligation (phase file line 481) that DI4 cannot waive. The local Obsidian is 1.12.7 and has no Kanban layout, so the evidence must come from another source; the table fallback means a missing confirmation degrades the view instead of guessing a value Obsidian might reject.

```text
tasks.base view type = KANBAN_TYPE, groupBy status
card "Write spec" in todo → L → doing column; note frontmatter: "- status: todo" / "+ status: doing"
group by formula.late → L → toast "Moves are off: this board groups by a formula", no write
```

**Acceptance Criteria:**

- [ ] `KANBAN_TYPE` is defined once; a test parses the recorded Obsidian 1.14+ fixture and asserts its view type equals the constant.
- [ ] The fixture's provenance (Obsidian version and where the file came from) is recorded beside it.
- [ ] Columns follow the distinct values of the group-by property; notes without the property are in `None`.
- [ ] `H`/`L` move the card, write the property per W26100423LX-REQ10@R1, and keep the card focused; moving to `None` removes the property.
- [ ] Grouping by a formula or `file.*` property shows `⊘ moves off`, and `H`/`L` show the explanation toast without writing.
- [ ] Without a confirmed constant, a Kanban view opens as a table with the fallback notice, and DI4 is not reported as delivered.

**Depends On:** W26100423LX-REQ7@R1, W26100423LX-REQ10@R1

## W26100423LX-REQ10@R1: Safe frontmatter write-back

**Requirement ID:** `W26100423LX-REQ10`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W26100423LX-REQ10@R2`

**Research Relationship:** `RF5` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** How do Bases edits reach the notes without corrupting them or losing other edits?

**Answer:** A cell edit or card move changes exactly one frontmatter key of one note. The patch keeps comments, key order, and all other text byte-for-byte, and adds a frontmatter block when the note has none. If the note is open, the patch is applied to its buffer as one undo step and saved by autosave. If it is closed, the patch is written through the checked edit path, which rejects the write when the file's text no longer matches. A toast shows the frontmatter diff.

**Rationale:** Reusing the open-buffer and closed-file path from link-safe rename (`src/core/state/link-edits.ts:201-214`) gives Bases the same conflict safety without a second write path: unsaved buffer edits are never overwritten, and a file changed by another program is never clobbered. Patching only the edited key is what keeps Obsidian, Git diffs, and the user's comments intact.

```yaml
# before                         # after moving the card to "doing"
---                              ---
status: todo   # set by me       status: doing   # set by me
due: 2026-10-05                  due: 2026-10-05
---                              ---
```

**Acceptance Criteria:**

- [ ] Fixture tests show that patching one key preserves comments, key order, quoting of other keys, line endings, and the body byte-for-byte.
- [ ] Setting a key on a note without frontmatter adds a `---` block at the top; removing the last key leaves valid frontmatter.
- [ ] An edit to an open note changes its buffer in one undo step, and the buffer is saved by autosave.
- [ ] An edit to a closed note whose text changed since it was indexed is not written; an error toast says so, and the view re-evaluates from the new text.
- [ ] Every successful edit shows a toast with the removed and added frontmatter lines; a failed write restores the displayed value.
- [ ] Values are written as YAML that Obsidian reads back with the same property type (text, number, date, list, checkbox).

**Depends On:** W26100423LX-REQ7@R1
