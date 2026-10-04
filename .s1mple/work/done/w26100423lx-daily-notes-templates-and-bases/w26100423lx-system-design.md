# W26100423LX: daily-notes-templates-and-bases — System Design

**Design Status:** Finalized System Design

**Context Source:** `w26100423lx-discuss-context.md`

**Requirements Source:** `w26100423lx-requirements.md`

**Research Source:** `w26100423lx-research.md`

**Current Requirement Revisions:** W26100423LX-REQ1@R2, W26100423LX-REQ2@R1, W26100423LX-REQ3@R2, W26100423LX-REQ4@R2, W26100423LX-REQ5@R1, W26100423LX-REQ6@R2, W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ10@R2, W26100423LX-REQ11@R1, W26100423LX-REQ12@R1, W26100423LX-REQ13@R1

**Research Reconciliation:** `w26100423lx-requirements.md`, section 6 (Research Impact Review): every RF1–RF9 relationship to a baseline revision at `65cb3e4` has one outcome; reconciled in `ee143e9`.

**Unresolved Items:** None

**Design Boundary:** This artifact is authoritative for whole-system architecture and technical design, including UI/frontend applications, routes, modules, components, state ownership, contracts, files, symbols, boundaries, wiring, and verification when material. UI/UX look and feel, visual composition, concrete interaction treatment, responsive presentation, accessibility realization, mockups, and accepted UI-design authority belong to `s1mple-discuss-ui`.

**Finalized System Design Checklist:**

- [x] Every current qualified requirement revision has exactly one valid system-design coverage outcome: `System design required`, `No system design change`, or `No system design applicable`.
- [x] Every `System design required` outcome has the full `REQ → DES → S → V` chain.
- [x] Every `No system design change` outcome cites the existing system mechanism, exact current source, and existing verification evidence.
- [x] Every `No system design applicable` outcome explains why the requirement creates no system architecture or technical-design obligation and omits invented `DES`, `S`, and `V` records.
- [x] For roadmap-linked work, the accepted baseline has been checked against current parent definitions, every assigned parent obligation has valid child coverage, and gates due before design approval have evidence.
- [x] Historical requirement revisions are excluded from current design coverage.
- [x] When research exists, every RF-to-evaluated-revision relationship is reconciled and evaluated-versus-informed lineage is accurate; a finding that evaluated no requirement has one `None` relationship row.
- [x] When any requirement requires changed system design, the design progresses from system context and architecture to concrete files and symbols; otherwise sections 2–8 record explicit non-applicability without inventing system changes.
- [x] Every focal component, when any, has an existing target or proposed location and clear ownership.
- [x] The proposed project tree accounts for every affected source, wiring, configuration, migration, and test file as added, modified, renamed/moved, or deleted, or states why no system file changes apply.
- [x] Every changed or proposed logical contract, data model, and state item has a canonical section 7 detailed-shape reference; every unchanged item cites its exact current source and identifies affected section 7 consumers when relevant.
- [x] Every changed boundary has a contract, state rule, or signature.
- [x] Every modified symbol has an exact current source, current → final delta, and affected callers or consumers.
- [x] Detailed code design covers every important changed type, class, function, dependency, invariant, focused control flow, construction point, registration, and export; each code preview is immediately followed by an explanation of the definitions shown and how they interact.
- [x] Changed runtime flows name the participating symbols and define relevant failure policies.
- [x] Every cross-cutting, migration, and delivery concern is resolved with a concrete design location or `None — <reason>`.
- [x] Every `System design required` requirement, every design decision, and every changed invariant maps to an observable success criterion and an exact verification case and assertion.
- [x] Test suites and nested cases form one verification tree; every case names its unique risk and uses the lowest sufficient test level.
- [x] Unit and integration tests follow the section 8 quality rules without duplicating the same proof across levels.
- [x] Traceability is complete for every `System design required` outcome: `current REQ revision → DES → affected file → affected symbol → caller or wiring → runtime flow → success criterion → suite or check → exact verification case and assertion`; other outcomes have their required evidence instead of fabricated links.
- [x] UI/frontend technical design stays within the Design Boundary; UI/UX realization is deferred to `s1mple-discuss-ui`.
- [x] Every omitted structure, code preview, test level, or non-test check explains why it does not apply.

# Table of Contents

1. [Design Goals, Constraints, and Requirement Coverage](#1-design-goals-constraints-and-requirement-coverage)
2. [System Context and Architecture](#2-system-context-and-architecture)
3. [Components and Boundaries](#3-components-and-boundaries)
4. [Project Structure Changes](#4-project-structure-changes)
5. [Runtime Flows and Error Policies](#5-runtime-flows-and-error-policies)
6. [Logical Contracts, Data Models, and State](#6-logical-contracts-data-models-and-state)
7. [Detailed Code Design](#7-detailed-code-design)
8. [Testing and Verification](#8-testing-and-verification)
9. [Finalized Design Decisions](#9-finalized-design-decisions)
   - [W26100423LX-DES1: Shared Moment-subset formatter over local calendar fields](#w26100423lx-des1-shared-moment-subset-formatter-over-local-calendar-fields)
   - [W26100423LX-DES2: Daily paths, date parsing, and Obsidian-exact template expansion](#w26100423lx-des2-daily-paths-date-parsing-and-obsidian-exact-template-expansion)
   - [W26100423LX-DES3: Exclusive create-from-template effect](#w26100423lx-des3-exclusive-create-from-template-effect)
   - [W26100423LX-DES4: Note commands, bindings, and open-after-create placement](#w26100423lx-des4-note-commands-bindings-and-open-after-create-placement)
   - [W26100423LX-DES5: Calendar overlay](#w26100423lx-des5-calendar-overlay)
   - [W26100423LX-DES6: Template pickers, insertion with property merge, and the new-note prompt](#w26100423lx-des6-template-pickers-insertion-with-property-merge-and-the-new-note-prompt)
   - [W26100423LX-DES7: `[daily]` and `[templates]` configuration](#w26100423lx-des7-daily-and-templates-configuration)
   - [W26100423LX-DES8: Text-level frontmatter patcher](#w26100423lx-des8-text-level-frontmatter-patcher)
   - [W26100423LX-DES9: Ported Bases engine with Obsidian corrections, view-type registry, and the Kanban gate](#w26100423lx-des9-ported-bases-engine-with-obsidian-corrections-view-type-registry-and-the-kanban-gate)
   - [W26100423LX-DES10: Bases candidates and property types](#w26100423lx-des10-bases-candidates-and-property-types)
   - [W26100423LX-DES11: `base` file type, per-window editor-kind state, read-only buffers, and key routing](#w26100423lx-des11-base-file-type-per-window-editor-kind-state-read-only-buffers-and-key-routing)
   - [W26100423LX-DES12: Table and Kanban view models and base commands](#w26100423lx-des12-table-and-kanban-view-models-and-base-commands)
   - [W26100423LX-DES13: Frontmatter write-back through the buffer or the serial queue](#w26100423lx-des13-frontmatter-write-back-through-the-buffer-or-the-serial-queue)
   - [W26100423LX-DES14: Window views by interface and the Bases view](#w26100423lx-des14-window-views-by-interface-and-the-bases-view)
   - [W26100423LX-DES15: Base embeds through an embed-model registry](#w26100423lx-des15-base-embeds-through-an-embed-model-registry)
   - [W26100423LX-DES16: Wiring, boundaries, and integration re-checks](#w26100423lx-des16-wiring-boundaries-and-integration-re-checks)

# 1. Design Goals, Constraints, and Requirement Coverage

## Goals

- Daily notes, the calendar, template insertion, and new notes produce Obsidian's text for the supported syntax and never overwrite a file (W26100423LX-REQ1@R2 to W26100423LX-REQ6@R2).
- `.base` files open as keyboard-driven table and Kanban views over the index, edit only one frontmatter key per change without losing comments, and are never written (W26100423LX-REQ7@R2 to W26100423LX-REQ10@R2, W26100423LX-REQ12@R1).
- `![[x.base#View]]` renders inline through the G4 registries (W26100423LX-REQ11@R1).
- Everything arrives by registration on the language-neutral kernel, and the DI3 integration and performance checks still pass (W26100423LX-REQ13@R1).

## Requirement Coverage

- `W26100423LX-REQ1@R2` — Daily notes open or are created safely.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES1, W26100423LX-DES2, W26100423LX-DES3, W26100423LX-DES4
  - **How Addressed:** `note.today`/`note.yesterday`/`note.tomorrow` compute the path with `dailyPath`, look it up case-insensitively in `NoteIndex`, and open a match. Otherwise they emit one `createNote` effect. The adapter reads the template, expands it with the target-day instant and `{{title}}` = the formatted string, and publishes the file with temp-file plus `link()`, which never replaces an entry. `noteCreated` opens the path in both the `created` and `exists` outcomes and places the cursor on the first unchecked task.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/time/format.ts` — `formatDate`; `src/core/time/local.ts` — `localDateTime`, `addDays`; `src/core/features/notes/daily.ts` — `dailyPath`, `parseDailyDate`; `src/core/features/notes/template.ts` — `expandTemplate`; `src/core/state/note-commands.ts` — `openDaily`, `onNoteCreated`; `src/workspace/fs.ts` — `createExclusive`; `src/app/effects.ts` — `createNote` case
  - **Callers and Wiring:** `src/app/main.ts` `registries()` registers `noteCommands`, `noteBindings`, `noteGroups`; `EX_ALIASES` gains `Today`, `Yesterday`, `Tomorrow`; `createUpdate` routes `noteCreated`
  - **Runtime Flow:** Daily note open or create
  - **Success Criteria:** S1, S2, S3, S4
  - **Verification:** V1, V2, V3, V4, V5, V6, V7, V8
  - **Research Support:** RF7 evaluated `W26100423LX-REQ1@R1` and informed `W26100423LX-REQ1@R2`; RF9 evaluated `W26100423LX-REQ1@R1` with no impact.
- `W26100423LX-REQ2@R1` — Calendar date picker.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES4, W26100423LX-DES5
  - **How Addressed:** `note.pickDate` opens the `calendar` overlay with pure month and selection transitions in `src/core/state/calendar.ts`; marks come from `dailyPath` per day against the case-insensitive index lookup; `Enter` runs the same `openDaily` path; `src/ui/overlays/calendar.ts` paints the accepted Calendar component.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/types.ts` — `Overlay` (`calendar` variant), `CalendarState`; `src/core/state/calendar.ts` — `openCalendar`, `calendarKey`, `calendarMarks`; `src/core/state/keys.ts` — `routeKey`; `src/ui/overlays/calendar.ts` — `CalendarOverlay`
  - **Callers and Wiring:** `routeKey` sends keys to `calendarKey` while the overlay is open; the shell adds `CalendarOverlay` to `OverlayHost`
  - **Runtime Flow:** Calendar pick
  - **Success Criteria:** S5
  - **Verification:** V9, V10, V40
  - **Research Support:** RF7 evaluated and retained `W26100423LX-REQ2@R1`.
- `W26100423LX-REQ3@R2` — Obsidian-compatible date formatting and template expansion.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES1, W26100423LX-DES2
  - **How Addressed:** `formatDate(fields, format)` tokenizes with Moment's full token table, escapes, and brackets, emits Moment 2.29.4 `en` output for the supported tokens, and emits every other token whole. `expandTemplate` copies Obsidian's two regexes exactly with one instant per expansion.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/time/format.ts` — `formatDate`, `MOMENT_TOKENS`; `src/core/time/local.ts` — `LocalDateTime`; `src/core/features/notes/template.ts` — `expandTemplate`, `TemplateVars`
  - **Callers and Wiring:** `dailyPath`, `createNote` adapter, template insertion, template picker preview, Bases date cells
  - **Runtime Flow:** Daily note open or create; Template insertion
  - **Success Criteria:** S6, S7
  - **Verification:** V11, V12, V13
  - **Research Support:** RF6 and RF9 evaluated `W26100423LX-REQ3@R1` and informed `W26100423LX-REQ3@R2`.
- `W26100423LX-REQ4@R2` — Template insertion.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES6, W26100423LX-DES8, W26100423LX-DES2
  - **How Addressed:** The `templates` picker source lists `.md` files under `[templates] folder` from the index and renders its preview through the new generic `PickerSource.render` hook. On accept, `insertTemplate` expands the loaded template text and either inserts it whole at line 1, column 1, or inserts the body at the cursor and merges the template's properties through `mergeFrontmatter`, applying both spans as one undo step.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/picker.ts` — `PickerSource.render`, `pickerSources.templates`; `src/core/state/note-commands.ts` — `insertTemplate`; `src/core/lang/markdown/frontmatter-patch.ts` — `mergeFrontmatter`, `splitFrontmatter`; `src/ui/overlays/picker.ts` — preview painting through `render`
  - **Callers and Wiring:** `template.insert` command (Markdown scope) opens the picker; `pickerKey` accept calls the source's `accept`
  - **Runtime Flow:** Template insertion
  - **Success Criteria:** S8
  - **Verification:** V14, V15, V16
  - **Research Support:** RF8 evaluated `W26100423LX-REQ4@R1` and informed `W26100423LX-REQ4@R2`; RF6 evaluated `W26100423LX-REQ4@R1` and retained its variable handling.
- `W26100423LX-REQ5@R1` — New note from a template.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES6, W26100423LX-DES3, W26100423LX-DES4
  - **How Addressed:** `note.new` opens the prompt with `newNote: true` (a prompt that is not an explorer `FsOp`), validates the title and previews the path, then opens the `newNoteTemplates` source with `(blank note)` first; accept emits `createNote` with `insert` placement, and `noteCreated` refuses to open an existing file as new.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/types.ts` — `PromptState`; `src/core/state/explorer.ts` — `promptKey`; `src/core/state/note-commands.ts` — `startNewNote`, `submitNewNote`, `onNoteCreated`; `src/core/state/picker.ts` — `pickerSources.newNoteTemplates`
  - **Callers and Wiring:** `promptKey` routes Enter to `submitNewNote` when `newNote` is set
  - **Runtime Flow:** New note
  - **Success Criteria:** S9
  - **Verification:** V17, V18
  - **Research Support:** RF6 and RF8 evaluated and retained `W26100423LX-REQ5@R1`.
- `W26100423LX-REQ6@R2` — Daily-note and template configuration.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES7
  - **How Addressed:** `ConfigSchema` gains strict `daily` and `templates` objects with a shared `workspacePath` refinement; errors flow through the existing line-numbered `parseConfig` path.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/config/schema.ts` — `ConfigSchema`, `workspacePath`
  - **Callers and Wiring:** `AppConfig` consumers in `note-commands.ts`, `calendar.ts`, `picker.ts`
  - **Runtime Flow:** Daily note open or create (reads `s.config.daily`)
  - **Success Criteria:** S10
  - **Verification:** V19
  - **Research Support:** RF8 evaluated `W26100423LX-REQ6@R1` and informed `W26100423LX-REQ6@R2`; RF7 evaluated `W26100423LX-REQ6@R1` with no impact.
- `W26100423LX-REQ7@R2` — Bases engine and registered `base` editor kind.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES9, W26100423LX-DES10, W26100423LX-DES11
  - **How Addressed:** `src/core/features/bases/` holds the port of Alfred's types, parser, expression, and evaluator, with `file.inFolder` (subfolders), `file.hasTag` (any argument, nested tags), single-quoted strings, filter-hides-rows diagnostics, Obsidian-rejection warnings, and legacy `sort[].column`. `baseFileType` (`.base`, editor `base`, one read-only view, `readOnly: true`) and `baseEditorKind` register at startup. Non-text editor kinds never reach the vim engine, and `BufferState.readOnly` closes the single save gate.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/features/bases/{types,parser,expression,evaluator,candidates,file-type}.ts`; `src/core/filetypes/registry.ts` — `FileType.readOnly`, `EditorKindSpec.open`; `src/core/state/save.ts` — `writable`, `writeBuffer`; `src/core/state/keys.ts` — `bindingOrVim`; `src/workspace/index-worker.ts` — file facts
  - **Callers and Wiring:** `registries()` registers `baseFileType` and `baseEditorKind`; `syncEditorKinds` calls `EditorKindSpec.open`
  - **Runtime Flow:** Open a `.base` file; Base re-evaluation
  - **Success Criteria:** S11, S12, S13
  - **Verification:** V20, V21, V22, V23, V24, V25
  - **Research Support:** RF3 and RF4 evaluated `W26100423LX-REQ7@R1` and informed `W26100423LX-REQ7@R2`; RF1 evaluated `W26100423LX-REQ7@R1` and retained its registry and fallback rule.
- `W26100423LX-REQ8@R2` — Table view.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES9, W26100423LX-DES10, W26100423LX-DES12, W26100423LX-DES14
  - **How Addressed:** `tableModel` builds columns, groups (honoring `groupOrder`), and Obsidian's 15 default summaries from the evaluation; `propertyType` applies `types.json` assignments, else Obsidian's inference; base commands navigate, toggle sort/group/filter in window state only, and run the cell editor sub-state.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/features/bases/{table,summaries,property-types}.ts`; `src/core/state/base-commands.ts` — `baseCommands`, `baseBindings`, `cellEditKey`; `src/ui/widgets/base.ts` — `paintBaseTable`
  - **Callers and Wiring:** `baseViewContext` registered for file type `base` in `ViewContextRegistry`; `BaseView` reads it
  - **Runtime Flow:** Cell edit; Base re-evaluation
  - **Success Criteria:** S14, S15
  - **Verification:** V26, V27, V28, V29
  - **Research Support:** RF2, RF3, and RF5 evaluated `W26100423LX-REQ8@R1` and informed `W26100423LX-REQ8@R2`; RF4 evaluated `W26100423LX-REQ8@R1` with no change beyond W26100423LX-REQ7@R2.
- `W26100423LX-REQ9@R2` — Kanban view behind a verified type constant.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES9, W26100423LX-DES12, W26100423LX-DES13
  - **How Addressed:** `KANBAN_TYPE` is one `string | undefined` constant left `undefined` until the user-supplied fixture lands; `registries()` registers the board layout only when it is defined; `kanbanModel` honors `groupOrder` (`null` = `None`) and computes `movable`; `H`/`L` write through W26100423LX-DES13. Tests register a test-only type to verify the board.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/features/bases/{types,views,kanban}.ts` — `KANBAN_TYPE`, `BaseLayoutRegistry`, `kanbanModel`; `src/core/state/base-commands.ts` — `moveCard`; `test/fixtures/bases/README.md` — provenance record slot
  - **Callers and Wiring:** `registries()` conditional registration; `testRegistries` registers `kanban-test`
  - **Runtime Flow:** Kanban card move
  - **Success Criteria:** S16, S17
  - **Verification:** V30, V31, V32, V33
  - **Research Support:** RF1 and RF2 evaluated `W26100423LX-REQ9@R1` and informed `W26100423LX-REQ9@R2`.
- `W26100423LX-REQ10@R2` — Safe frontmatter write-back.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES8, W26100423LX-DES13
  - **How Addressed:** `patchFrontmatter(text, patch)` edits only the key's value span using `yaml` source ranges, adds or removes the block, quotes type-ambiguous text, and returns span edits plus diff lines. An open note gets the edits through `applyBufferEdits` (one undo step, autosave). A closed note gets a `patchFrontmatter` effect whose adapter re-reads the file inside the serial queue, checks the key still holds the value the view showed, patches, and writes with the read stamp.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/lang/markdown/frontmatter-patch.ts` — `patchFrontmatter`, `frontmatterValue`, `yamlScalar`; `src/core/state/base-write.ts` — `writeProperty`, `onFrontmatterPatched`; `src/app/effects.ts` — `patchFrontmatter` case
  - **Callers and Wiring:** `commitCellEdit`, `toggleCheckbox`, `moveCard` call `writeProperty`; `createUpdate` routes `frontmatterPatched`
  - **Runtime Flow:** Cell edit; Kanban card move
  - **Success Criteria:** S18, S19
  - **Verification:** V34, V35, V36, V37
  - **Research Support:** RF5 evaluated `W26100423LX-REQ10@R1` and informed `W26100423LX-REQ10@R2`.
- `W26100423LX-REQ11@R1` — Base embeds in notes.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES15
  - **How Addressed:** `EmbedModelRegistry` (per file type, in `core/state`) answers the new `PreviewCtx.embedModel(path, subpath)`; `syncEmbeds` loads targets whose file type has an embed model as unlisted buffers; `baseEmbedRenderer` (render key `base`) emits a `base` widget sized by `embedMaxRows`; `paintBaseEmbed` reuses the table and board painters; `followLink` passes the subpath so `Enter` opens the base at that view; `renderHtml` is unchanged (link).
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/embed-models.ts` — `EmbedModelRegistry`; `src/core/lang/markdown/live-preview.ts` — `PreviewCtx.embedModel`; `src/core/state/markdown-view.ts` — `markdownViewContext`; `src/core/state/embeds.ts` — `embedTargets`, `syncEmbeds`; `src/core/features/bases/embed.ts` — `baseEmbedRenderer`; `src/ui/widgets/base.ts` — `paintBaseEmbed`; `src/core/state/jumps.ts` — `goTo`
  - **Callers and Wiring:** `registries()` registers the `base` embed model and `registerBlockRenderer("base", baseEmbedRenderer)`; `main.ts` registers `registerWidgetPainter("base", paintBaseEmbed)`
  - **Runtime Flow:** Base embed render
  - **Success Criteria:** S20, S21
  - **Verification:** V38, V39
  - **Research Support:** RF2 and RF4 evaluated and retained `W26100423LX-REQ11@R1`.
- `W26100423LX-REQ12@R1` — Base window lifecycle.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES11, W26100423LX-DES12
  - **How Addressed:** `baseEditorKind.open(path, text, subpath)` creates `BaseWindowState` at the named or first view; the view model is derived per frame and memoized on (base text version, index, property types, dirty candidate buffers, window state), so index and `.base` changes re-evaluate while `focus.path` keeps the same note; `status: "waiting"` shows until the index is ready; the session snapshot still stores path, cursor, and scroll only.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/types.ts` — `WindowState.content.kindState`, `subpath`; `src/core/state/update.ts` — `syncEditorKinds`; `src/core/state/base-model.ts` — `baseViewModel`; `src/core/state/session.ts` — `fillRestored` (subpath carried)
  - **Callers and Wiring:** `createUpdate` → `syncEditorKinds`; `baseViewContext`
  - **Runtime Flow:** Open a `.base` file; Base re-evaluation
  - **Success Criteria:** S22
  - **Verification:** V41, V42
  - **Research Support:** RF3 evaluated and retained `W26100423LX-REQ12@R1`.
- `W26100423LX-REQ13@R1` — Integration, accessibility, and performance re-checks.
  - **Coverage Outcome:** System design required
  - **System Design:** W26100423LX-DES16, W26100423LX-DES14, W26100423LX-DES5
  - **How Addressed:** `tour.md` gains a Base embed over a fixture base; the live keystroke bench note embeds a base; the boundary test gains the `yaml` home for `src/core/features/bases/`; component goldens cover the calendar, template picker, table, and Kanban under `NO_COLOR`, light, and 80×24; `testRegistries` mirrors `registries()`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `test/fixtures/tour.md`, `test/fixtures/workspace/tasks.base`, `test/bench/live-keystroke.bench.ts`, `test/boundaries.test.ts` — `PACKAGE_HOMES`, `test/support/state.ts` — `testRegistries`, `test/ui/bases.golden.test.ts`, `test/ui/notes.golden.test.ts`
  - **Callers and Wiring:** CI `check` and `test` jobs (unchanged workflows)
  - **Runtime Flow:** None — verification only
  - **Success Criteria:** S23, S24
  - **Verification:** V40, V43, V44, V45, V46
  - **Research Support:** RF1 evaluated and retained `W26100423LX-REQ13@R1`.

## Assigned Parent Obligation Coverage

- **Parent Baseline**
  - **Binding:** `w26100423lx-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH2@R5 / RM261003ABZP-DI4@R2; Previous Accepted Bindings: None).
  - **Assessment:** Aligned. The index, phase file, design, and UI design were re-read on 2026-10-04 at `main` `d398ad7`: the index Approval still lists PH2@R5 and DI4@R2, and no newer REQ6, REQ7, REQ11, DES8–DES12, DES14, DES17, S6, S7, V9, or V10 revision exists. This design refines the phase design in six places, all additive or internal, which change no PH, DI, REQ, S, or V definition:
    1. Note and base commands live in `src/core/state/note-commands.ts` and `src/core/state/base-commands.ts`, not `src/core/features/notes/commands.ts` (phase file line 137), because commands read `AppState` and `core/features` may not import `core/state` (`test/boundaries.test.ts:9-15,33-34`), the precedent DI3 set with `markdown-commands.ts`.
    2. The phase shape `createExclusive(path, text)` (phase file lines 253–271) is realized as the `createNote` effect, whose adapter reads and expands the template and calls `createExclusive` in `src/workspace/fs.ts` (temp file, fsync, `link()`), keeping the never-overwrite rule.
    3. The phase's "`write` effect" for Bases edits (phase file line 152) becomes the open-buffer edit path or the new `patchFrontmatter` effect, which writes through the same `atomicWrite` with the read stamp (RM261003ABZP-DES8@R2 unchanged).
    4. The base window content `{editor: "base", path, view, cursor}` (phase file lines 195–198) is stored as `WindowState.content.kindState` created by `EditorKindSpec.open`, which gains an optional `subpath`; no new top-level `AppState` field is added (property types live in `IndexState.types`).
    5. `PreviewCtx` gains `embedModel(path, subpath)`, an additive member answered by a per-file-type `EmbedModelRegistry`, so the `base` block renderer needs no `NoteIndex` access.
    6. `FileType` gains `readOnly?: true` and `BufferState` gains `readOnly?: true`, closing the single save gate for files `so` must never write.
  - **Design Approval Gates:** G3 (phase file line 70) satisfied by DI2 at `9adb285` (PR #2); G4 (phase file line 71) satisfied by DI3 at `e228bb5` (PR #6). No gate is due later.
  - **Pending parent synchronization (from the requirements reconciliation, `ee143e9`):**
    1. **Kanban enablement.** The Obsidian ≥ 1.14.3 fixture can only come from the user (RF1). DI4 ships the board with `KANBAN_TYPE` unset and records Kanban enablement as an open item blocking the PH2 exit; whether the PR may merge before the fixture exists is a parent progress decision for the user at delivery.
    2. **Evaluator semantics.** `file.inFolder`/`file.hasTag` follow Obsidian and single-quoted strings are accepted — a refinement of RM261003ABZP-DES12@R2 that adds no function or operator.
    3. **Summaries source.** Summary semantics come from Obsidian's 15 documented defaults instead of an Alfred port — a refinement of RM261003ABZP-DES12@R2 for summaries only.
    Items 1–6 above join these as one synchronization proposal; no parent file is edited by this work.

- **Daily notes and templates**
  - **Parent:** RM261003ABZP-REQ6@R2; RM261003ABZP-DES11@R1; RM261003ABZP-DES14@R2 (`[daily]`, `templates.folder`); RM261003ABZP-DES8@R2 (exclusive create)
  - **Work Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ2@R1, W26100423LX-REQ3@R2, W26100423LX-REQ4@R2, W26100423LX-REQ5@R1, W26100423LX-REQ6@R2
  - **Coverage Outcome:** System design required
  - **Work Design:** W26100423LX-DES1, W26100423LX-DES2, W26100423LX-DES3, W26100423LX-DES4, W26100423LX-DES5, W26100423LX-DES6, W26100423LX-DES7, W26100423LX-DES8
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S1–S10
  - **Verification:** V1–V19
  - **Treatment:** Refined — the formatter's full-token tokenizer, Obsidian-exact expansion, the target-day `{{date}}`, and template property merge come from RF6–RF9; the command module location is refinement 1.
- **Obsidian 1.14+ verification of `S6@R1` and `V9@R1`**
  - **Parent:** RM261003ABZP-S6@R1 via RM261003ABZP-V9@R1
  - **Work Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ3@R2
  - **Coverage Outcome:** System design required
  - **Work Design:** W26100423LX-DES1, W26100423LX-DES2, W26100423LX-DES3
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S1, S2, S6, S7
  - **Verification:** V1, V3, V5, V11, V12, V13
  - **Treatment:** Inherited — "strings equal Moment.js output" uses the research's Moment 2.29.4 strings; "second `:Today` opens the existing file without changing it" is V5.
- **Bases**
  - **Parent:** RM261003ABZP-REQ7@R2; RM261003ABZP-DES12@R2; RM261003ABZP-DES9@R3 (`base` widget through `blockRenderers`); RM261003ABZP-DES10@R2 (`editorViews.base`, `base` widget painter); RM261003ABZP-DES17@R2 (`base` file type registration)
  - **Work Requirements:** W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ10@R2, W26100423LX-REQ11@R1, W26100423LX-REQ12@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W26100423LX-DES8 to W26100423LX-DES15
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S11–S22
  - **Verification:** V20–V42
  - **Treatment:** Refined — refinements 2–6 and pending items 1–3; the downstream boundary (no `.base` writes, no subset widening, no Kanban before the fixture, no `.base` special case) holds.
- **Bases verification**
  - **Parent:** RM261003ABZP-S7@R1 via RM261003ABZP-V10@R1
  - **Work Requirements:** W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ10@R2
  - **Coverage Outcome:** System design required
  - **Work Design:** W26100423LX-DES9, W26100423LX-DES12, W26100423LX-DES13
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S11, S14, S16, S17, S18
  - **Verification:** V21, V26, V30, V31, V32, V34, V36
  - **Treatment:** Refined — the "Kanban `.base` saved by Obsidian 1.14+" fixture case (V30) passes only once the user supplies the fixture; until then V30 is recorded as pending, which W26100423LX-REQ9@R2 and pending item 1 make an open DI4 item.
- **Language-neutral kernel and registration**
  - **Parent:** RM261003ABZP-REQ11@R3; RM261003ABZP-S11@R1 via RM261003ABZP-V15@R2 and RM261003ABZP-V16@R2
  - **Work Requirements:** W26100423LX-REQ7@R2, W26100423LX-REQ13@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W26100423LX-DES11, W26100423LX-DES14, W26100423LX-DES15, W26100423LX-DES16
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S11, S23
  - **Verification:** V20, V43, V44
  - **Treatment:** Inherited — the kernel gains nothing; `src/core/filetypes` gains `readOnly` and the `subpath` argument, which are file-type contracts, not kernel code.
- **UI obligations**
  - **Parent:** RM261003ABZP-M5@R2, RM261003ABZP-M6@R1; RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1, RM261003ABZP-UREQ11@R1; RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES11@R1; RM261003ABZP-US6@R1 via RM261003ABZP-UV7@R1, RM261003ABZP-US7@R1 via RM261003ABZP-UV8@R1, RM261003ABZP-US9@R1 via RM261003ABZP-UV10@R1
  - **Work Requirements:** W26100423LX-REQ2@R1, W26100423LX-REQ4@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ13@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W26100423LX-DES5, W26100423LX-DES6, W26100423LX-DES14
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S5, S8, S24
  - **Verification:** V10, V16, V40, V45
  - **Treatment:** Inherited — this design supplies the state, contracts, and painters' technical seams; visual realization follows the accepted UI baseline and stays within the Design Boundary.
- **Cross-work integration**
  - **Parent:** phase file line 553 — DI4 re-passes RM261003ABZP-V7@R2, RM261003ABZP-V12@R3, RM261003ABZP-V16@R2 with the `base` renderer, and RM261003ABZP-UV3@R2 with a Base embed in `tour.md`
  - **Work Requirements:** W26100423LX-REQ13@R1
  - **Coverage Outcome:** System design required
  - **Work Design:** W26100423LX-DES16
  - **Existing Evidence:** None — system change required
  - **Success Criteria:** S23
  - **Verification:** V43, V44, V46
  - **Treatment:** Inherited.

## Binding Constraints

- `.s1mple/S1MPLE.md:63` — no work-process identifiers in code, comments, identifiers, test names, or log messages; test names below describe behavior.
- `test/boundaries.test.ts:9-15,33-41` — `core/features` and `core/time` stay pure and may not import `core/state`; commands that read `AppState` therefore live in `core/state`.
- `test/boundaries.test.ts:45-56` — `yaml` is homed in `src/core/lang/markdown/`; DI4 adds `src/core/features/bases/` explicitly rather than routing `.base` parsing through a Markdown module.
- `src/core/state/update.ts:94-173` — `update` is pure; adapters only execute effects and report actions; a throwing handler keeps the previous state.
- `src/app/effects.ts:211-275` — file writes run on one serial queue with own-op tracking and index notification; DI4's new file effects join that queue.
- `src/workspace/fs.ts:171-186` — create never replaces an entry (E13); `createExclusive` keeps the rule with content.
- `.s1mple/docs/project.md` Constraints — exact pins; no new dependency is needed (`yaml` 2.9.1 is present).
- RM261003ABZP-REQ10@R4 — `bun run check` < 30 s, CI < 3 min; the Bases port adds unit suites only to `check`.

## Cross-Cutting Applicability

| Concern | Applicability | Design Location or Reason |
|---|---|---|
| Security and privacy | Applicable | `createExclusive` writes the temp file `0600` and publishes with `link()`, which cannot follow or replace an existing entry; all paths are workspace-relative and validated by `workspacePath` (config) and `newNotePath` checks (prompt) so nothing is created outside the workspace; logs carry paths, never note text (`notes.created`, `bases.patched`). Verified by V3, V6, V17, V19 |
| Configuration | Applicable | `[daily] folder/format/template`, `[templates] folder` in `src/core/config/schema.ts` (section 7); V19 |
| Observability | Applicable | `src/app/effects.ts` logs `notes.created` / `notes.createFailed` and `bases.patched` / `bases.patchFailed` with path and reason; V7, V37 |
| Performance and scalability | Applicable | Base view and embed models are memoized on input identity (`src/core/state/base-model.ts`); the embed renders only visible blocks through `livePreview`; non-note file facts add one `stat` per non-note file in the worker walk; V12@R3 re-run with a base embed (V44); V42 asserts the memo |
| Concurrency | Applicable | Exclusive create resolves the index-check race with `EEXIST` (V3); closed-note patches re-read and check the expected value inside the serial queue (V36); open notes are edited in memory and saved by autosave (V35) |
| Retry and idempotency | Applicable | A second `:Today` is a no-op open (V5); a stale write is refused, not retried, and the view re-evaluates from the index (V36) |
| Migration and rollout | Applicable | `PersistedState` stays `version: 1`; new `AppState` fields are optional; `KANBAN_TYPE` gates the board (section 7, Migration and Delivery); V41, V30 |

## Focused Code Surface

- **Existing:** `src/core/filetypes/registry.ts` — `EditorKindSpec`, `FileType`, `EditorKindRegistry` — the registration seam for the `base` kind; `open` has no caller yet (`registry.ts:16-19`).
- **Existing:** `src/core/state/update.ts` — `syncEditorKinds` — picks each window's editor kind (`update.ts:67-85`); becomes the one caller of `open`.
- **Existing:** `src/core/state/keys.ts` — `bindingOrVim` — falls through to `runVim` (`keys.ts:117-119`); must stop for non-text kinds.
- **Existing:** `src/core/state/save.ts` — `writable`, `writeBuffer` — the single save gate (`save.ts:25-26,67-96`).
- **Existing:** `src/core/state/buffers.ts` — `applyBufferEdits` — one-undo-step span edits on open buffers (`buffers.ts:162-218`).
- **Existing:** `src/workspace/fs.ts` — `createEntry`, `atomicWrite` (`fs.ts:99-133,172-186`).
- **Existing:** `src/app/effects.ts` — serial queue cases `write`, `applyEdits`, `create` (`effects.ts:211-275`).
- **Existing:** `src/core/state/embeds.ts` — `embedTargets`, `syncEmbeds` (`embeds.ts:13-90`); `src/core/state/markdown-view.ts` — `markdownViewContext` (`markdown-view.ts:21-52`); `src/core/lang/markdown/live-preview.ts` — `PreviewCtx`, `registerBlockRenderer` (`live-preview.ts:15-48`).
- **Existing:** `src/core/state/picker.ts` — `PickerSource`, `pickerSources` (`picker.ts:41-59,171`); `src/core/state/types.ts` — `PromptState`, `Overlay`, `WindowState`, `IndexState`, `Action`, `Effect` (`types.ts:93-104,129-138,162-168,222-231,294-377`).
- **Existing:** `src/ui/editors/registry.ts` — `editorViews` typed to the text `EditorView` class (`registry.ts:6-9`); `src/ui/views/window-tree.ts` uses only `show`, `cursor`, `destroy` (`window-tree.ts:85-111`).
- **Existing:** `src/workspace/index-worker.ts` — `walk`, `summarizeFile`, `FromWorker` (`index-worker.ts:27-38,65-107`).
- **Proposed:** `src/core/time/{format,local}.ts` — `formatDate`, `localDateTime` — Traces to `W26100423LX-DES1`
- **Proposed:** `src/core/features/notes/{daily,template}.ts` — `dailyPath`, `parseDailyDate`, `expandTemplate` — Traces to `W26100423LX-DES2`
- **Proposed:** `src/workspace/fs.ts` — `createExclusive`; `src/app/effects.ts` — `createNote` — Traces to `W26100423LX-DES3`
- **Proposed:** `src/core/state/note-commands.ts` — `noteCommands`, `openDaily`, `onNoteCreated` — Traces to `W26100423LX-DES4`
- **Proposed:** `src/core/state/calendar.ts`, `src/ui/overlays/calendar.ts` — Traces to `W26100423LX-DES5`
- **Proposed:** `src/core/state/picker.ts` — `render` hook, `templates`, `newNoteTemplates` — Traces to `W26100423LX-DES6`
- **Proposed:** `src/core/lang/markdown/frontmatter-patch.ts` — `patchFrontmatter`, `mergeFrontmatter` — Traces to `W26100423LX-DES8`
- **Proposed:** `src/core/features/bases/*` — Traces to `W26100423LX-DES9`, `W26100423LX-DES10`, `W26100423LX-DES12`
- **Proposed:** `src/core/state/base-{commands,model,write}.ts` — Traces to `W26100423LX-DES11`, `W26100423LX-DES12`, `W26100423LX-DES13`
- **Proposed:** `src/ui/editors/base-view.ts`, `src/ui/widgets/base.ts` — Traces to `W26100423LX-DES14`
- **Proposed:** `src/core/state/embed-models.ts`, `src/core/features/bases/embed.ts` — Traces to `W26100423LX-DES15`

# 2. System Context and Architecture

## System Context

```text
             ┌──────────────────────────── so (one Bun process) ────────────────────────────┐
 user keys → │ src/ui ─► store ─► core/state update ─► effects ─► src/app runner ─► workspace │ ─► notes folder (*.md, *.base,
             │   ▲                    │                                   │                │     .obsidian/types.json)
             │   └──── frames ◄───────┘                     index worker ◄┘ (scan, facts)  │
             └──────────────────────────────────────────────────────────────────────────────┘
 Obsidian (separate app) reads and writes the same folder; so must keep every file it creates or patches Obsidian-valid.
 config.toml ([daily], [templates]) is read at startup and on :ConfigReload.
```

## Proposed Architecture

```text
core/time/format.ts, local.ts ──► core/features/notes/{daily,template}.ts
                                         │                      │
core/lang/markdown/frontmatter-patch.ts ─┼──────────────────────┼──────────────┐
                                         ▼                      ▼              ▼
core/state/note-commands.ts ─► createNote effect ─► app/effects ─► workspace/fs.createExclusive
core/state/calendar.ts (overlay)        picker.ts (templates, newNoteTemplates, render hook)

core/features/bases/ (pure)                                  core/state/
  types, parser, expression, evaluator                        base-model.ts  ── baseViewModel (memo) ◄── ViewContextRegistry("base")
  candidates, property-types, summaries                       base-commands.ts (keys, cell edit, moves)
  table, kanban, views (BaseLayoutRegistry, KANBAN_TYPE)  ─►  base-write.ts ─► buffer edit | patchFrontmatter effect
  file-type (baseFileType, baseEditorKind), embed renderer    embed-models.ts (EmbedModelRegistry) ◄── markdownViewContext.embedModel
                                                              update.syncEditorKinds ─► EditorKindSpec.open
ui/editors/base-view.ts (WindowView) ─► ui/widgets/base.ts (table, board, embed painters)
workspace/index-worker.ts (+ size, ctime, file facts)  ─► IndexState.ix ; readPropertyTypes ─► IndexState.types
```

The architecture adds two pure feature modules (`features/notes`, `features/bases`), one pure utility (`time`), and one Markdown text utility (`frontmatter-patch`), with every `AppState` interaction in `core/state` and every byte of I/O in `src/app/effects.ts` and `src/workspace`. Bases plugs in through four existing registries (file types, editor kinds, view contexts, block renderers) and two new generic seams: per-window kind state created by `EditorKindSpec.open`, and the per-file-type `EmbedModelRegistry`. The major tradeoff is derivation over storage: the base view model is recomputed from the index and buffers on demand and memoized, rather than stored in state, so it can never drift from the notes, at the cost of a memo that must be keyed carefully to protect keystroke latency (V42, V44).

# 3. Components and Boundaries

## Time formatter

- **Target:** `src/core/time/format.ts`, `src/core/time/local.ts`
- **Kind:** pure function module
- **Responsibilities:**
  - Tokenize Moment format strings with Moment's full token table, `[literal]`, and `\x` escapes.
  - Emit Moment 2.29.4 `en` output for the supported tokens; emit other tokens whole.
  - Convert epoch milliseconds to local calendar fields and do day arithmetic on fields.
- **Collaborators:**

  ```text
  dailyPath, expandTemplate, calendarMarks, tableModel (date cells) → formatDate(LocalDateTime, string)
  note-commands, calendar → localDateTime(now), addDays(date, n)
  ```

- **Boundary Contract:** `LocalDateTime` (section 6)
- **Detailed Design:** section 7 `src/core/time/format.ts`, `src/core/time/local.ts`
- **Must Not Own:**
  - Locales other than `en`, parsing beyond `parseDailyDate`'s needs, or any clock read except `Date` field getters over a given instant.

## Notes feature

- **Target:** `src/core/features/notes/daily.ts`, `src/core/features/notes/template.ts`
- **Kind:** pure function module
- **Responsibilities:**
  - Compute daily paths and parse a daily note's date back from its path.
  - Expand templates exactly as Obsidian does.
- **Collaborators:**

  ```text
  note-commands.openDaily → dailyPath(cfg.daily, date) ; parseDailyDate(path, cfg.daily)
  effects.createNote adapter, insertTemplate, picker render → expandTemplate(text, vars)
  ```

- **Boundary Contract:** `TemplateVars`, `DailyConfig` (section 6)
- **Detailed Design:** section 7 `src/core/features/notes/daily.ts`, `template.ts`
- **Must Not Own:**
  - `AppState`, file I/O, or frontmatter merging (that is `frontmatter-patch`).

## Note commands and calendar

- **Target:** `src/core/state/note-commands.ts`, `src/core/state/calendar.ts`
- **Kind:** state module (commands and reducers)
- **Responsibilities:**
  - `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `template.insert`, `note.new`; Ex aliases; `<leader>n` bindings and group label.
  - Case-insensitive daily lookup, `createNote` emission, `noteCreated` handling, open-after-create placement.
  - Calendar overlay state and key handling.
- **Collaborators:**

  ```text
  keymap → runCommand → openDaily → openPath | createNote effect
  noteCreated action → onNoteCreated → openPath(path, { then }) → fillRestored / placeAfterOpen
  routeKey (overlay calendar) → calendarKey → openDaily
  ```

- **Boundary Contract:** `createNote` / `noteCreated` (section 6)
- **Detailed Design:** section 7 `src/core/state/note-commands.ts`, `src/core/state/calendar.ts`
- **Must Not Own:**
  - Reading templates or writing files; date formatting rules.

## Exclusive create adapter

- **Target:** `src/workspace/fs.ts` (`createExclusive`), `src/app/effects.ts` (`createNote` case)
- **Kind:** adapter
- **Responsibilities:**
  - Read the template (if any), expand it with the effect's variables, and publish the file without ever replacing an entry.
  - Report `created`, `exists`, or `failed`, plus whether the template was used, missing, or unreadable.
- **Collaborators:**

  ```text
  run(createNote) → serial → readTextFile(template) → expandTemplate → createExclusive → ownOps.noteWrite, index.notify → dispatch(noteCreated)
  ```

- **Boundary Contract:** `createNote` / `noteCreated` (section 6)
- **Detailed Design:** section 7 `src/workspace/fs.ts`, `src/app/effects.ts`
- **Must Not Own:**
  - Deciding which path or template to use, or opening the note.

## Frontmatter patcher

- **Target:** `src/core/lang/markdown/frontmatter-patch.ts`
- **Kind:** pure function module (the `yaml` home)
- **Responsibilities:**
  - Read one key's value, set or remove one key with a value-span edit, merge template properties, split a template's frontmatter, and render values in Obsidian-typed YAML with quoting for ambiguous text.
- **Collaborators:**

  ```text
  base-write.writeProperty, effects.patchFrontmatter adapter → patchFrontmatter(text, patch)
  effects adapter → frontmatterValue(text, key)
  note-commands.insertTemplate → splitFrontmatter, mergeFrontmatter
  ```

- **Boundary Contract:** `FrontmatterPatch`, `PatchResult` (section 6)
- **Detailed Design:** section 7 `src/core/lang/markdown/frontmatter-patch.ts`
- **Must Not Own:**
  - Deciding property types (that is `features/bases/property-types`), or I/O.

## Bases engine

- **Target:** `src/core/features/bases/`
- **Kind:** pure module
- **Responsibilities:**
  - Parse `.base` YAML, evaluate filters and formulas over candidates, select and normalize the view.
  - Build table and Kanban models, summaries, property types; resolve layouts through `BaseLayoutRegistry`; hold `KANBAN_TYPE`.
  - Define `baseFileType`, `baseEditorKind`, and `baseEmbedRenderer`.
- **Collaborators:**

  ```text
  base-model.baseViewModel → parseBase → evaluateBase(base, candidates, view) → layouts.get(type).model(result, ui)
  embed-models (base) → same path with embedMaxRows
  ```

- **Boundary Contract:** `Base`, `BaseEvaluation`, `BaseCandidate`, `TableModel`, `KanbanModel`, `BaseLayout` (section 6)
- **Detailed Design:** section 7 `src/core/features/bases/*`
- **Must Not Own:**
  - `AppState`, key handling, writes, or painting.

## Base window state, commands, and write-back

- **Target:** `src/core/state/base-model.ts`, `src/core/state/base-commands.ts`, `src/core/state/base-write.ts`
- **Kind:** state module
- **Responsibilities:**
  - Derive and memoize the window's `BaseViewModel` (view context builder for file type `base`).
  - Base-scoped commands, the cell editor sub-state, view switching, card moves.
  - Route property writes to the open buffer or the `patchFrontmatter` effect; handle `frontmatterPatched`.
- **Collaborators:**

  ```text
  keys.routeKey → cellEditKey (while editing) | bindings (filetype base) → baseCommands
  baseCommands → writeProperty → applyBufferEdits | patchFrontmatter effect
  frontmatterPatched → onFrontmatterPatched → summarizeWritten, toast
  ```

- **Boundary Contract:** `BaseWindowState`, `patchFrontmatter` / `frontmatterPatched` (section 6)
- **Detailed Design:** section 7 `src/core/state/base-*.ts`
- **Must Not Own:**
  - Evaluation rules or YAML text manipulation.

## Embed model registry

- **Target:** `src/core/state/embed-models.ts`
- **Kind:** registry
- **Responsibilities:**
  - Map a file type to a builder of an opaque, render-ready embed model for a target path and subpath.
  - Tell `syncEmbeds` which embed targets to load.
- **Collaborators:**

  ```text
  markdownViewContext.embedModel(path, subpath) → embedModels.build(fileType, s, path, subpath)
  syncEmbeds → embedModels.has(fileType)
  ```

- **Boundary Contract:** `EmbedModelBuilder` (section 6)
- **Detailed Design:** section 7 `src/core/state/embed-models.ts`
- **Must Not Own:**
  - Rendering decorations (the block renderer) or painting (the widget painter).

## Bases view (UI)

- **Target:** `src/ui/editors/base-view.ts`, `src/ui/widgets/base.ts`, `src/ui/editors/registry.ts`
- **Kind:** UI component
- **Responsibilities:**
  - Implement `WindowView` for editor kind `base`, painting toolbar, body, and hints from the view model; place the hardware cursor on the focused cell or card.
  - Paint the `base` embed widget with the same table and board painters.
- **Collaborators:**

  ```text
  WindowTree → editorViews.get("base") → BaseView.show(s, id, rect) → reg.viewContexts.build("base", s, id, host) → paintBaseTable | paintBaseBoard
  widgetPainters.get("base") → paintBaseEmbed
  ```

- **Boundary Contract:** `WindowView` (section 6)
- **Detailed Design:** section 7 `src/ui/editors/base-view.ts`, `src/ui/widgets/base.ts`
- **Must Not Own:**
  - Any evaluation or state change; it reads the view model only.

## Calendar overlay (UI)

- **Target:** `src/ui/overlays/calendar.ts`
- **Kind:** UI component
- **Responsibilities:**
  - Paint the fixed 36×12 month grid from `CalendarState` and its marks; place the hardware cursor on the selected day.
- **Collaborators:**

  ```text
  OverlayHost.update → CalendarOverlay.update(s) → calendarMarks(s) → paint
  ```

- **Boundary Contract:** `CalendarState` (section 6)
- **Detailed Design:** section 7 `src/ui/overlays/calendar.ts`
- **Must Not Own:**
  - Date arithmetic or key handling.

# 4. Project Structure Changes

**Proposed Structure — not an actual Git diff.**

**Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
so/
├── src/
│   ├── app/
│   │   ├── [M] main.ts
│   │   │       Contains: composition root
│   │   │       Symbols: registries(), main() — register note/base commands, bindings, groups, baseFileType, baseEditorKind, base view context, base embed model, base block renderer, layouts (board only when KANBAN_TYPE is set), editor view "base", widget painter "base"; dispatch readPropertyTypes after the first frame
│   │   │       Decisions: DES4, DES9, DES11, DES14, DES15, DES16
│   │   └── [M] effects.ts
│   │           Contains: effect runner
│   │           Symbols: run — cases createNote, patchFrontmatter, readPropertyTypes
│   │           Decisions: DES3, DES10, DES13
│   ├── workspace/
│   │   ├── [M] fs.ts
│   │   │       Contains: file-system adapter
│   │   │       Symbols: createExclusive (new); readTextFile (adds createdMs)
│   │   │       Decisions: DES3, DES10
│   │   ├── [A] property-types.ts
│   │   │       Contains: reads .obsidian/types.json
│   │   │       Symbols: readPropertyTypes
│   │   │       Decisions: DES10
│   │   └── [M] index-worker.ts
│   │           Contains: index worker
│   │           Symbols: walk (file facts for non-notes), summarizeFile (size, ctime), FromWorker.batch.facts
│   │           Decisions: DES10
│   ├── core/
│   │   ├── time/
│   │   │   ├── [A] format.ts
│   │   │   │       Contains: Moment-subset formatter
│   │   │   │       Symbols: formatDate, MOMENT_TOKENS
│   │   │   │       Decisions: DES1
│   │   │   ├── [A] format.test.ts
│   │   │   ├── [A] local.ts
│   │   │   │       Contains: local calendar fields and day arithmetic
│   │   │   │       Symbols: LocalDate, LocalDateTime, localDateTime, addDays, addMonthsClamped, withDate, daysInMonth, mondayIndex
│   │   │   │       Decisions: DES1
│   │   │   └── [A] local.test.ts
│   │   ├── features/
│   │   │   ├── notes/
│   │   │   │   ├── [A] daily.ts
│   │   │   │   │       Symbols: DailyConfig, dailyPath, parseDailyDate
│   │   │   │   │       Decisions: DES2
│   │   │   │   ├── [A] daily.test.ts
│   │   │   │   ├── [A] template.ts
│   │   │   │   │       Symbols: TemplateVars, expandTemplate, BUILTIN_DAILY_TEMPLATE
│   │   │   │   │       Decisions: DES2
│   │   │   │   └── [A] template.test.ts
│   │   │   ├── bases/
│   │   │   │   ├── [A] types.ts
│   │   │   │   │       Symbols: Base, BaseView, BaseFilter, BaseDiagnostic, BaseCandidate, BaseCell, BaseColumn, BaseRow, BaseEvaluation, KANBAN_TYPE
│   │   │   │   │       Decisions: DES9
│   │   │   │   ├── [A] parser.ts            Symbols: parseBase                     Decisions: DES9
│   │   │   │   ├── [A] parser.test.ts
│   │   │   │   ├── [A] expression.ts        Symbols: evaluateExpression           Decisions: DES9
│   │   │   │   ├── [A] expression.test.ts
│   │   │   │   ├── [A] evaluator.ts         Symbols: evaluateBase                 Decisions: DES9
│   │   │   │   ├── [A] evaluator.test.ts
│   │   │   │   ├── [A] summaries.ts         Symbols: DEFAULT_SUMMARIES, summarize Decisions: DES9
│   │   │   │   ├── [A] summaries.test.ts
│   │   │   │   ├── [A] property-types.ts    Symbols: PropertyType, PropertyTypes, propertyType, parsePropertyTypes  Decisions: DES10
│   │   │   │   ├── [A] property-types.test.ts
│   │   │   │   ├── [A] candidates.ts        Symbols: candidatesFrom               Decisions: DES10
│   │   │   │   ├── [A] candidates.test.ts
│   │   │   │   ├── [A] table.ts             Symbols: TableModel, tableModel       Decisions: DES12
│   │   │   │   ├── [A] table.test.ts
│   │   │   │   ├── [A] kanban.ts            Symbols: KanbanModel, kanbanModel     Decisions: DES12
│   │   │   │   ├── [A] kanban.test.ts
│   │   │   │   ├── [A] views.ts             Symbols: BaseLayout, BaseLayoutRegistry, tableLayout, boardLayout  Decisions: DES9
│   │   │   │   ├── [A] views.test.ts
│   │   │   │   ├── [A] file-type.ts         Symbols: baseFileType, baseEditorKind, BaseWindowState  Decisions: DES11
│   │   │   │   ├── [A] embed.ts             Symbols: BaseEmbedModel, isBaseEmbedModel, baseEmbedRenderer  Decisions: DES15
│   │   │   │   └── [A] embed.test.ts
│   │   │   └── links/
│   │   │       ├── [M] summarize.ts
│   │   │       │       Symbols: NoteSummary (+ size, ctime), summarize (signature takes facts)
│   │   │       │       Decisions: DES10
│   │   │       └── [M] note-index.ts
│   │   │               Symbols: NoteIndex (+ facts), buildIndex, applySummaries (facts argument)
│   │   │               Decisions: DES10
│   │   ├── lang/markdown/
│   │   │   ├── [A] frontmatter-patch.ts
│   │   │   │       Symbols: FrontmatterPatch, PatchResult, patchFrontmatter, frontmatterValue, splitFrontmatter, mergeFrontmatter, yamlScalar
│   │   │   │       Decisions: DES8
│   │   │   ├── [A] frontmatter-patch.test.ts
│   │   │   └── [M] live-preview.ts
│   │   │           Symbols: PreviewCtx (+ embedModel)
│   │   │           Decisions: DES15
│   │   ├── filetypes/
│   │   │   └── [M] registry.ts
│   │   │           Symbols: FileType (+ readOnly), EditorKindSpec.open (+ subpath)
│   │   │           Decisions: DES11
│   │   ├── config/
│   │   │   ├── [M] schema.ts
│   │   │   │       Symbols: ConfigSchema (+ daily, templates), workspacePath
│   │   │   │       Decisions: DES7
│   │   │   └── [M] schema.test.ts
│   │   └── state/
│   │       ├── [M] types.ts
│   │       │       Symbols: BufferState (+ readOnly), WindowState.content (+ kindState, subpath), PromptState (+ newNote, op optional), Overlay (+ calendar), CalendarState, IndexState (+ types), AppState.windows.restore.pending (+ then, subpath), Action (+ noteCreated, frontmatterPatched, propertyTypesLoaded), Effect (+ createNote, patchFrontmatter, readPropertyTypes), AfterOpen
│   │       │       Decisions: DES3, DES4, DES5, DES6, DES10, DES11, DES13
│   │       ├── [M] update.ts
│   │       │       Symbols: Registries (+ embedModels), syncEditorKinds (calls open), createUpdate (routes new actions; passes reg to syncEmbeds)
│   │       │       Decisions: DES4, DES10, DES11, DES13, DES15
│   │       ├── [M] keys.ts
│   │       │       Symbols: routeKey (calendar, cell edit), bindingOrVim (no vim for non-text kinds)
│   │       │       Decisions: DES5, DES11, DES12
│   │       ├── [M] save.ts
│   │       │       Symbols: writable, writeBuffer (readOnly gate)
│   │       │       Decisions: DES11
│   │       ├── [M] buffers.ts
│   │       │       Symbols: onFileLoaded (readOnly from file type), openPath (opts: subpath, then), showBuffer
│   │       │       Decisions: DES4, DES11
│   │       ├── [M] session.ts
│   │       │       Symbols: fillRestored (subpath, then)
│   │       │       Decisions: DES4, DES11
│   │       ├── [M] jumps.ts
│   │       │       Symbols: goTo, awaitLoad (subpath)
│   │       │       Decisions: DES15
│   │       ├── [M] link-commands.ts
│   │       │       Symbols: followLink (passes the link subpath for non-Markdown targets)
│   │       │       Decisions: DES15
│   │       ├── [M] commands.ts
│   │       │       Symbols: EX_ALIASES (+ Today, Yesterday, Tomorrow)
│   │       │       Decisions: DES4
│   │       ├── [M] explorer.ts
│   │       │       Symbols: promptKey (routes newNote prompts)
│   │       │       Decisions: DES6
│   │       ├── [M] picker.ts
│   │       │       Symbols: PickerSource (+ render, previewAlways), pickerSources (+ templates, newNoteTemplates, baseViews), requestPreview
│   │       │       Decisions: DES6, DES12
│   │       ├── [M] embeds.ts
│   │       │       Symbols: embedTargets, syncEmbeds (reg argument)
│   │       │       Decisions: DES15
│   │       ├── [M] markdown-view.ts
│   │       │       Symbols: markdownViewContext (+ embedModel)
│   │       │       Decisions: DES15
│   │       ├── [M] index.ts
│   │       │       Symbols: onIndexBatch (facts), onPropertyTypesLoaded
│   │       │       Decisions: DES10
│   │       ├── [A] note-commands.ts
│   │       │       Symbols: noteCommands, noteBindings, noteGroups, openDaily, onNoteCreated, insertTemplate, startNewNote, submitNewNote, findPathInsensitive
│   │       │       Decisions: DES4, DES6
│   │       ├── [A] note-commands.test.ts
│   │       ├── [A] calendar.ts
│   │       │       Symbols: openCalendar, calendarKey, calendarMarks
│   │       │       Decisions: DES5
│   │       ├── [A] calendar.test.ts
│   │       ├── [A] base-model.ts
│   │       │       Symbols: BaseViewModel, baseViewModel, baseViewContext, baseEmbedModel
│   │       │       Decisions: DES11, DES12, DES15
│   │       ├── [A] base-model.test.ts
│   │       ├── [A] base-commands.ts
│   │       │       Symbols: baseCommands, baseBindings, cellEditKey, moveCard, commitCellEdit, toggleCheckbox
│   │       │       Decisions: DES12
│   │       ├── [A] base-commands.test.ts
│   │       ├── [A] base-write.ts
│   │       │       Symbols: writeProperty, onFrontmatterPatched
│   │       │       Decisions: DES13
│   │       ├── [A] base-write.test.ts
│   │       ├── [A] embed-models.ts
│   │       │       Symbols: EmbedModelBuilder, EmbedModelRegistry
│   │       │       Decisions: DES15
│   │       └── [A] embed-models.test.ts
│   └── ui/
│       ├── editors/
│       │   ├── [M] registry.ts
│       │   │       Symbols: WindowView (new interface), editorViews, registerEditorView
│       │   │       Decisions: DES14
│       │   ├── [M] text-view.ts
│       │   │       Symbols: EditorView implements WindowView (no behavior change)
│       │   │       Decisions: DES14
│       │   └── [A] base-view.ts
│       │           Symbols: BaseView
│       │           Decisions: DES14
│       ├── views/
│       │   └── [M] window-tree.ts
│       │           Symbols: WindowTree views typed as WindowView
│       │           Decisions: DES14
│       ├── widgets/
│       │   └── [A] base.ts
│       │           Symbols: paintBaseTable, paintBaseBoard, paintBaseEmbed
│       │           Decisions: DES14, DES15
│       ├── overlays/
│       │   ├── [A] calendar.ts
│       │   │       Symbols: CalendarOverlay
│       │   │       Decisions: DES5
│       │   ├── [M] picker.ts
│       │   │       Symbols: preview pane paints source.render output when present
│       │   │       Decisions: DES6
│       │   └── [M] prompt.ts
│       │           Symbols: shows the path preview for newNote prompts
│       │           Decisions: DES6
│       └── [M] shell.ts
│               Symbols: createShell adds CalendarOverlay to OverlayHost
│               Decisions: DES5
└── test/
    ├── [M] boundaries.test.ts
    │       Symbols: PACKAGE_HOMES.yaml (+ "src/core/features/bases/")
    │       Decisions: DES16
    ├── support/
    │   └── [M] state.ts
    │           Symbols: testRegistries mirrors registries(), plus the kanban-test layout
    │           Decisions: DES16
    ├── fixtures/
    │   ├── [M] tour.md
    │   │       Contains: adds ![[tasks.base#All tasks]]
    │   │       Decisions: DES16
    │   ├── workspace/
    │   │   ├── [A] tasks.base
    │   │   ├── [A] tasks/*.md (status, due, done properties with comments)
    │   │   └── [A] templates/daily.md, templates/meeting.md
    │   ├── bases/
    │   │   ├── [A] alfred/*.base (ported Alfred parser and evaluator fixtures)
    │   │   ├── [A] group-order.base
    │   │   └── [A] README.md
    │   │           Contains: provenance slot for the user-supplied Obsidian ≥ 1.14.3 Kanban fixture (empty until it lands)
    │   │           Decisions: DES9
    │   └── [M] generate.ts
    │           Symbols: make5000LineNote (appends a base embed and writes tasks.base beside it)
    │           Decisions: DES16
    ├── integration/
    │   ├── [A] notes.test.ts
    │   │       Purpose: :Today, :Yesterday, new note, template file reading through the real runner
    │   │       Decisions: DES3, DES4
    │   └── [A] bases-write.test.ts
    │           Purpose: patchFrontmatter through the real runner, conflict, open buffer
    │           Decisions: DES13
    ├── ui/
    │   ├── [A] notes.golden.test.ts
    │   ├── [A] bases.golden.test.ts
    │   └── [M] live-preview.test.ts (tour.md goldens with the base embed)
    └── bench/
        └── [M] live-keystroke.bench.ts (note contains a base embed)
```

`src/core/kernel/` is untouched. `.github/workflows/*`, `package.json`, and `bun.lock` are unchanged: no dependency, script, or workflow change is needed.

# 5. Runtime Flows and Error Policies

## Daily note open or create

**Participating Symbols:** `openDaily`, `dailyPath`, `findPathInsensitive`, `openPath`, `createNote` effect, `createExclusive`, `expandTemplate`, `noteCreated`, `onNoteCreated`, `AfterOpen`

**Illustrative Flow:**

```text
:Today | <leader>nd → note.today → openDaily(c, localDateTime(c.now) date)
  → path = dailyPath(cfg.daily, date) → findPathInsensitive(ix, path)
      found  → openPath(s, found, now, { then: "firstTask" })
      absent → effect createNote{ path, template: cfg.daily.template, fallback: "# {{date}}",
                                  vars: { title: formatted, at: date + wall time }, then: "firstTask" }
runner(serial) → readTextFile(template)? → expandTemplate → createExclusive(root, path, text)
      ok      → noteCreated{ outcome: "created", template: "used" | "missing" | "unreadable" }
      EEXIST  → noteCreated{ outcome: "exists" }
      error   → noteCreated{ outcome: "failed", reason }
onNoteCreated → created: toast "Created <path> from <template>" (+ error toast when unreadable) → openPath(path, { then })
              → exists : openPath(path, { then })   (nothing written)
              → failed : error toast
fileLoaded → fillRestored applies then: cursor on first "- [ ]" line, else end of file
```

1. `openDaily` derives the date: today from `localDateTime(c.now)`; for `:Yesterday`/`:Tomorrow`, `parseDailyDate(activePath, cfg.daily)` when the active buffer is a daily note, else today, then `addDays(±1)`.
2. `findPathInsensitive` compares lower-cased paths through a per-`NoteIndex` memo.
3. The adapter uses one instant for the expansion: the target day's date with the current wall-clock time.
4. `onNoteCreated` calls `openPath` with `then`; when the buffer is already open, `placeAfterOpen` sets the cursor immediately.

**Detailed Control Flow:** section 7 `src/core/state/note-commands.ts` (`openDaily`, `onNoteCreated`), `src/app/effects.ts` (`createNote`), `src/workspace/fs.ts` (`createExclusive`)

## Calendar pick

**Participating Symbols:** `openCalendar`, `calendarKey`, `calendarMarks`, `openDaily`, `CalendarOverlay`

**Illustrative Flow:**

```text
<leader>np → note.pickDate → overlay { kind: "calendar", calendar: { today, selected: today, month } }
key → routeKey → calendarKey: h/l ±1 day, j/k ±7, H/L ±1 month (day clamped), t today, Esc close, Enter → close + openDaily(selected)
paint → CalendarOverlay → calendarMarks(s, month) → dailyPath per day ∈ index ? "•"
```

1. Keys never reach bindings while the overlay is open.
2. Marks are recomputed per paint from the index (31 lookups); no disk read.

**Detailed Control Flow:** section 7 `src/core/state/calendar.ts`

## Template insertion

**Participating Symbols:** `template.insert`, `pickerSources.templates`, `PickerSource.render`, `insertTemplate`, `expandTemplate`, `splitFrontmatter`, `mergeFrontmatter`, `applyBufferEdits`

**Illustrative Flow:**

```text
<leader>nt (markdown) → openPicker("templates") → items: .md under cfg.templates.folder (index, sorted)
selection → readPreview (always, even when narrow) → previewLoaded → render(item, file) = source lines (vars styled) ▸ expansion
Enter → accept → preview loaded for this item?
   no  → message "loading template…" (picker stays open)
   yes → text = expandTemplate(file.text, { title: basename, at: now })
         cursor at 0:0 → one SpanEdit inserting text
         else          → { fm, body } = splitFrontmatter(text); edits = [insert body at cursor, ...mergeFrontmatter(note, fm).edits]
         → applyBufferEdits(one undo step) → cursor after body → close picker
```

**Detailed Control Flow:** section 7 `src/core/state/note-commands.ts` (`insertTemplate`), `src/core/state/picker.ts`

## New note

**Participating Symbols:** `startNewNote`, `promptKey`, `submitNewNote`, `pickerSources.newNoteTemplates`, `createNote`, `onNoteCreated`

**Illustrative Flow:**

```text
<leader>nn → overlay prompt { kind: "input", title: "New note", newNote: true } → typing: value → invalid? / path preview
Enter → submitNewNote → path = `${normalize(value)}.md` → openPicker("newNoteTemplates", path)
accept (blank) → createNote{ path, vars: { title, at: now }, then: "insert" }
accept (tpl)   → createNote{ path, template: tpl, vars, then: "insert" }
noteCreated created → openPath(path, { then: "insert" }) → Insert mode, cursor at end
noteCreated exists  → error toast "E13: File exists (<path>)", nothing opened
```

**Detailed Control Flow:** section 7 `src/core/state/note-commands.ts`

## Open a `.base` file

**Participating Symbols:** `openPath`, `onFileLoaded`, `baseFileType`, `syncEditorKinds`, `baseEditorKind.open`, `BaseWindowState`, `readPropertyTypes`, `BaseView`

**Illustrative Flow:**

```text
open tasks.base → read → fileLoaded → buffer { fileType: "base", view: "base", readOnly: true }
syncEditorKinds: editor "base" registered → content { editor: "base", kindState: open(path, text, subpath) }
  + effect readPropertyTypes (first base window since the last read)
WindowTree: kind changed → BaseView → baseViewContext → baseViewModel(s, windowId)
keys: cell edit active → cellEditKey ; else bindings (normal, filetype base) ; unbound → dropped (never vim)
```

**Detailed Control Flow:** section 7 `src/core/state/update.ts` (`syncEditorKinds`), `src/core/features/bases/file-type.ts`

## Base re-evaluation

**Participating Symbols:** `baseViewModel`, `candidatesFrom`, `parseBase`, `evaluateBase`, `BaseLayoutRegistry`, `tableModel`, `kanbanModel`

**Illustrative Flow:**

```text
any state change → frame → baseViewModel(s, id)
  key = (base text version, ix identity, types identity, dirty-candidate signature, kindState identity)
  same key → memo hit
  else → index status not ready → { status: "waiting" }
       → parseBase(text) (invalid YAML → { status: "parseError", message })
       → evaluateBase(base, candidatesFrom(ix, buffers), view, ui overrides)
       → layouts.get(view.type) ?? table + notice → model ; focus row = index of focus.path (else nearest)
```

**Detailed Control Flow:** section 7 `src/core/state/base-model.ts`

## Cell edit

**Participating Symbols:** `base.edit`, `cellEditKey`, `commitCellEdit`, `propertyType`, `writeProperty`, `patchFrontmatter`, `applyBufferEdits`, `frontmatterPatched`, `onFrontmatterPatched`

**Illustrative Flow:**

```text
i on a note-property cell → kindState.edit = { path, property, type, value: shown text, original }
cellEditKey: chars/BS/←/→ edit value; Ctrl-a/Ctrl-x on number/date; Esc → drop edit (value restored)
Enter → validate(type, value) → invalid → edit.error (inline), no write
                                → valid → writeProperty(s, path, { set: property, value: typed })
writeProperty → note open → patchFrontmatter(buffer text) → applyBufferEdits (one undo step, autosave) → diff toast
              → closed    → effect patchFrontmatter{ path, patch, expected: shown value }
runner(serial) → read → frontmatterValue ≠ expected → frontmatterPatched{ ok: false, reason: "changed on disk" }
              → patch → atomicWrite(stamp) → frontmatterPatched{ ok: true, text, stamp, removed, added }
onFrontmatterPatched → ok: summarizeWritten (index updates → view re-evaluates) + diff toast ; failed: error toast
x on a checkbox cell → writeProperty(set !value) directly
```

**Detailed Control Flow:** section 7 `src/core/state/base-commands.ts`, `src/core/state/base-write.ts`, `src/app/effects.ts`

## Kanban card move

**Participating Symbols:** `moveCard`, `kanbanModel`, `writeProperty`

**Illustrative Flow:**

```text
H/L on a card → board.movable? no → toast "Moves are off: this board groups by a formula|file property", no write
             → target column = lanes[i ± 1] (none at the edge → no-op)
             → key null (None) → writeProperty({ remove: property }) ; else writeProperty({ set: property, value: lane.value })
             → focus.path kept → card stays focused after re-evaluation
```

**Detailed Control Flow:** section 7 `src/core/state/base-commands.ts` (`moveCard`)

## Base embed render

**Participating Symbols:** `syncEmbeds`, `embedTargets`, `EmbedModelRegistry`, `markdownViewContext.embedModel`, `baseEmbedModel`, `baseEmbedRenderer`, `paintBaseEmbed`

**Illustrative Flow:**

```text
note with ![[tasks.base#Board]] → syncEmbeds: target file type "base" has an embed model → read{ embed: true } → unlisted buffer
livePreview → renderKey "base" → baseEmbedRenderer(block) → ctx.embedModel(path, "#Board")
   "loading" → widget { type: "base", rows: min(embedMaxRows, 3) } ; "missing" → title + notice
   model     → widget { type: "base", data: model, rows: model rows + header }
paint → paintBaseEmbed → paintBaseTable | paintBaseBoard (read-only, capped, "↓ N more")
Enter on the embed line → note.enter → followLink → goTo(path, { subpath: "#Board" }) → base window opens at Board
```

**Detailed Control Flow:** section 7 `src/core/state/embed-models.ts`, `src/core/features/bases/embed.ts`

## Failure and Recovery Rules

- **Daily or new note already exists at creation** — Detected by `createExclusive` (`link()` → `EEXIST`); represented as `noteCreated { outcome: "exists" }`; daily: open without writing; new note: error toast, nothing opened.
- **Template missing** — Detected by the `createNote` adapter (`readTextFile` → `refused: "io"` with `ENOENT`, checked by `stat`); represented as `template: "missing"`; daily uses `fallback` (`# {{date}}`); a picked template that disappeared creates an empty note with an error toast.
- **Template unreadable** (binary, too large, permission) — Detected by the adapter; `template: "unreadable"`; the note is created empty and an error toast names the template.
- **File system without hard links** (`link()` → `EPERM`/`ENOTSUP`/`EXDEV`) — Detected by `createExclusive`; falls back to `open(target, "wx")`, write, fsync, close — still exclusive, not atomic against a crash mid-write; logged as `notes.createFallback`.
- **Create failure** (permission, disk full) — `noteCreated { outcome: "failed", reason }`; error toast; temp file removed.
- **Unsupported filter** — Detected by `evaluateBase` (diagnostic on a filter expression); represented as a `filter_hides_rows` diagnostic naming the filter; rows it guards stay excluded.
- **Invalid `.base` YAML** — Detected by `parseBase`; `status: "parseError"`; view shows the message and no rows.
- **Stale closed-note write** — Detected by the `patchFrontmatter` adapter (`frontmatterValue` ≠ `expected`, or `atomicWrite` → `conflict`); `frontmatterPatched { ok: false }`; error toast; the index is unchanged, so the displayed value stays the disk value.
- **Stale open-buffer edit** — Detected by `applyBufferEdits` (`stale: true`); error toast "changed in the editor"; nothing applied.
- **Invalid cell value** — Detected by `validateCell`; `edit.error`; no write; `Esc` restores.
- **Move disabled** — Detected by `kanbanModel.movable === false`; explanation toast; no write.
- **`.base` write attempt** (`:w`, autosave, recreate) — Prevented by `BufferState.readOnly` in `writable` and `writeBuffer`; `:w` shows "read-only file".
- **`types.json` missing or malformed** — Detected by `readPropertyTypes`/`parsePropertyTypes`; `types: {}`; inference applies; malformed logs `bases.typesInvalid`.
- **Base embed renderer throws** — Caught by `livePreview` (`live-preview.ts:121-130`); block shows source with `⚠`.

## Construction and Wiring Flow

```text
src/app/main.ts registries()
  ├→ fileTypes.register(baseFileType)
  ├→ editorKinds.register(baseEditorKind)
  ├→ commands.register(noteCommands…, baseCommands…)
  ├→ bindings += noteBindings, baseBindings ; groups += noteGroups
  ├→ viewContexts.register("base", baseViewContext)
  ├→ embedModels.register("base", baseEmbedModel)
  ├→ registerBlockRenderer("base", baseEmbedRenderer)
  └→ layouts: tableLayout ; KANBAN_TYPE !== undefined → layouts.register(KANBAN_TYPE, boardLayout)
src/app/main.ts main()
  ├→ registerEditorView("base", (ctx, deps) => new BaseView(ctx, deps))
  ├→ registerWidgetPainter("base", paintBaseEmbed)
  └→ after the first frame (setImmediate, beside the watcher and worker) → runner.run({ kind: "readPropertyTypes" })
```

- **Construction:** `src/app/main.ts` — `registries()` — builds the registries above; `BaseLayoutRegistry` is constructed there and passed into `baseViewContext`/`baseEmbedModel` through `Registries.layouts`.
- **Registration:** `src/app/main.ts` — `registries()`, `main()` — file type, editor kind, commands, bindings, groups, view context, embed model, block renderer, editor view, widget painter; `test/support/state.ts` — `testRegistries` mirrors them and adds `layouts.register("kanban-test", boardLayout)`.
- **Exports:** new modules export the symbols listed in section 4; `src/ui/editors/registry.ts` exports `WindowView`.
- **Configuration:** `src/core/config/schema.ts` — `daily`, `templates` — read at startup and on `:ConfigReload` through `onConfigLoaded` (unchanged).

# 6. Logical Contracts, Data Models, and State

| Item | Kind | Purpose | Used By |
|---|---|---|---|
| `LocalDateTime` / `LocalDate` | Data Model | Calendar fields independent of the process timezone in formatting | `formatDate`, notes, calendar, Bases date cells |
| `DailyConfig`, `TemplateVars` | Data Model | Inputs to path computation and expansion | `note-commands`, `createNote` adapter |
| `createNote` / `noteCreated` | Message (Effect / Action) | Exclusive create from a template and its outcome | `note-commands` → runner → `onNoteCreated` |
| `AfterOpen` | State Model | Cursor placement once a created or found note is shown | `openPath`, `fillRestored`, `placeAfterOpen` |
| `CalendarState` | State Model | The open calendar overlay | `calendar.ts`, `CalendarOverlay` |
| `PromptState` (newNote) | State Model | A title prompt that is not an explorer operation | `note-commands`, `promptKey`, prompt painter |
| `PickerSource.render` | Contract | Turn a loaded preview file into display lines | `picker.ts` sources, `ui/overlays/picker.ts` |
| `AppConfig.daily` / `templates` | Schema | User configuration | notes, calendar, pickers |
| `FrontmatterPatch` / `PatchResult` | Contract | One-key text-level frontmatter change and its diff | `base-write`, runner, `insertTemplate` |
| `Base`, `BaseEvaluation`, `BaseCandidate` | Data Model | Ported Bases engine types | `features/bases`, `base-model` |
| `BaseLayout` / `BaseLayoutRegistry` | Contract | View type → model builder, table fallback | `base-model`, `registries()` |
| `TableModel`, `KanbanModel` | Data Model | Render-ready view models | `BaseView`, embed painter, base commands |
| `BaseWindowState` | State Model | Per-window base UI state | `syncEditorKinds`, base commands, `base-model` |
| `WindowState.content.kindState` / `subpath` | State Model | Generic per-kind window state | editor kinds |
| `FileType.readOnly` / `BufferState.readOnly` | Contract / State | Files `so` never writes | `save.ts` |
| `NoteSummary.size/ctime`, `NoteIndex.facts` | Data Model | Bases `file.*` fields | worker, `candidatesFrom` |
| `PropertyTypes` / `IndexState.types` | Data Model / State | `types.json` assignments | `propertyType`, `base-model` |
| `patchFrontmatter` / `frontmatterPatched` | Message | Closed-note property write and its result | `base-write` → runner → `onFrontmatterPatched` |
| `readPropertyTypes` / `propertyTypesLoaded` | Message | Load `types.json` | `main`, `syncEditorKinds` → runner → `onPropertyTypesLoaded` |
| `EmbedModelBuilder` / `PreviewCtx.embedModel` | Contract | Render-ready model for a non-note embed | `markdownViewContext`, `baseEmbedRenderer` |
| `WindowView` | Contract | What `WindowTree` needs from a window view | `EditorView`, `BaseView` |

## `LocalDateTime` — Data Model

**Purpose:** The calendar fields of one instant in local time, so formatting and day arithmetic are pure functions that tests drive without a timezone.

**Includes:**

- `year`, `month` (1–12), `day` (1–31), `hour`, `minute`, `second`, `weekday` (0 = Sunday, Moment's `d`)
- `LocalDate` — the date part only

**Usage:**

```text
CommandContext.now → localDateTime(now) → { date part → dailyPath / addDays } ; { full → expandTemplate.at }
```

**Rules:**

- **Compatibility:** None — new type.
- **Invariants:** fields are normalized (valid day for the month); `addDays` preserves the wall-clock time fields.
- **Ownership and Lifecycle:** created per command; never stored except inside `CalendarState` and `createNote.vars`.

**Location:** `src/core/time/local.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/time/local.ts`

## `createNote` / `noteCreated` — Message

**Purpose:** One serial-queue operation that reads an optional template, expands it, and creates a file that never replaces an entry, then reports what happened.

**Includes:**

- Effect: `path`, `template?` (workspace-relative), `fallback?` (template text when the template file is missing), `vars: TemplateVars`, `then: AfterOpen`, `reason: "daily" | "new"`
- Action: `path`, `outcome: "created" | "exists" | "failed"`, `template: "used" | "missing" | "unreadable" | "none"`, `then`, `reason`, `failure?`

**Usage:**

```text
openDaily / submitNewNote → createNote → runner → noteCreated → onNoteCreated
```

**Rules:**

- **Compatibility:** additive variants of `Effect` and `Action`.
- **Invariants:** an existing entry is never modified; `outcome: "exists"` writes nothing; the reducer opens the path for daily notes in both `created` and `exists`.
- **Ownership and Lifecycle:** transient.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/state/types.ts`, `src/app/effects.ts`

## `AfterOpen` — State Model

**Purpose:** Where the cursor goes when a note opened by a notes command is shown.

**Includes:**

- `"firstTask"` — the first `- [ ]` line (column after `] `), else the end of the file
- `"insert"` — the end of the file in Insert mode

**Usage:**

```text
openPath(s, path, now, { then }) → already open: placeAfterOpen ; else restore.pending[w].then → fillRestored → placeAfterOpen
```

**Rules:**

- **Compatibility:** optional field on the restore entry; persisted state never contains it (`snapshotSession` reads only path, cursor, scroll at `session.ts:68-83`).
- **Invariants:** applied once, then dropped with the pending entry.
- **Ownership and Lifecycle:** `windows.restore.pending` owns it until the read answers.

**Location:** `src/core/state/types.ts:267-273` (restore pending entry) — extended

**Detailed Shape:** section 7 `src/core/state/types.ts`, `src/core/state/note-commands.ts`

## `CalendarState` — State Model

**Purpose:** The open calendar: the month shown, today, and the selected day.

**Includes:**

- `month: { year, month }`, `today: LocalDate`, `selected: LocalDate`

**Usage:**

```text
note.pickDate → overlay { kind: "calendar", calendar } → calendarKey transitions → CalendarOverlay paints
```

**Rules:**

- **Compatibility:** new `Overlay` variant.
- **Invariants:** `selected` is always inside `month`; `H`/`L` clamp the day to the month length.
- **Ownership and Lifecycle:** lives while the overlay is open; never persisted.

**Location:** `src/core/state/types.ts:162-168` (`Overlay`) — extended

**Detailed Shape:** section 7 `src/core/state/types.ts`, `src/core/state/calendar.ts`

## `PromptState` (newNote) — State Model

**Purpose:** Let the existing prompt overlay ask for a new note's title without pretending to be an explorer file operation.

**Includes:**

- existing `kind`, `title`, `value`, `impact?`, `invalid?`
- `op?: FsOp` (explorer prompts) or `newNote: true` (exactly one is set)

**Usage:**

```text
startNewNote → overlay prompt { newNote: true } → promptKey → submitNewNote
```

**Rules:**

- **Compatibility:** every existing prompt keeps `op`; the type becomes a union of the two shapes, so every existing construction still type-checks.
- **Invariants:** exactly one of `op` and `newNote` is set.
- **Ownership and Lifecycle:** overlay-owned.

**Location:** `src/core/state/types.ts:129-138`

**Detailed Shape:** section 7 `src/core/state/types.ts`

## `PickerSource.render` — Contract

**Purpose:** A generic way for a picker source to show a computed preview (template source then expansion) instead of the file's raw lines.

**Includes:**

- `render?(s, item, file: TextFile): PreviewLines` where `PreviewLines = { text: string; style?: string; ranges?: { from: number; to: number; style: string }[] }[]`
- `previewAlways?: true` — request the preview file even below `PREVIEW_MIN_COLS`, because accept needs the text

**Usage:**

```text
previewLoaded → picker painter → source.render?.(s, item, file) ?? raw lines
```

**Rules:**

- **Compatibility:** optional members; existing sources unchanged.
- **Invariants:** `render` is pure and cheap (runs at paint).
- **Ownership and Lifecycle:** source-owned.

**Location:** `src/core/state/picker.ts:41-59`

**Detailed Shape:** section 7 `src/core/state/picker.ts`

## `AppConfig.daily` / `AppConfig.templates` — Schema

**Purpose:** User-configurable daily folder, format, template, and templates folder.

**Includes:**

- `daily.folder` (default `daily`, may be `""` for the root), `daily.format` (default `YYYY-MM-DD`, non-empty), `daily.template` (default `templates/daily.md`)
- `templates.folder` (default `templates`, not the root)

**Usage:**

```text
config.toml → parseConfig → ConfigSchema → AppConfig → openDaily / calendarMarks / pickers
```

**Rules:**

- **Compatibility:** new optional sections; existing files parse unchanged (`prefault({})`).
- **Invariants:** every path is workspace-relative, has no `..` that leaves the workspace, and no leading `/`.
- **Ownership and Lifecycle:** `AppState.config`.

**Location:** `src/core/config/schema.ts:10-47`

**Detailed Shape:** section 7 `src/core/config/schema.ts`

## `FrontmatterPatch` / `PatchResult` — Contract

**Purpose:** Describe one key change and return the minimal span edits plus diff lines, so the same patch applies to a buffer or a file.

**Includes:**

- `FrontmatterPatch = { set: string; value: FrontmatterValue } | { remove: string }`
- `PatchResult = { ok: true; edits: SpanEdit[]; text: string; removed: string[]; added: string[] } | { ok: false; reason: string }`

**Usage:**

```text
writeProperty → patchFrontmatter(buffer text) → applyBufferEdits(edits)
runner → patchFrontmatter(disk text) → atomicWrite(text)
```

**Rules:**

- **Compatibility:** `SpanEdit` is the existing link-edit shape (`src/core/features/links/rename.ts:8`).
- **Invariants:** text outside the edited key's span is byte-identical; the result parses to the input object with only that key changed.
- **Ownership and Lifecycle:** transient.

**Location:** `src/core/lang/markdown/frontmatter-patch.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/lang/markdown/frontmatter-patch.ts`

## `Base`, `BaseEvaluation`, `BaseCandidate` — Data Model

**Purpose:** The parsed `.base` file, the candidate files, and one view's evaluated rows, ported from Alfred's types.

**Includes:**

- `Base` — `filters`, `formulas`, `properties`, `summaries`, `views`, `diagnostics` (from `alfred/packages/vault/src/domain/bases/types.ts:36-49`)
- `BaseView` — `type`, `name`, `limit`, `order`, `filters`, `sort`, `groupBy`, `groupOrder`, `summaries`, other keys preserved
- `BaseCandidate` — `path`, `name`, `basename`, `folder`, `ext`, `size`, `mtime`, `ctime`, `properties`, `tags`, `links`, `embeds`
- `BaseEvaluation` — selected view, available views, columns, rows, groups, diagnostics

**Usage:**

```text
candidatesFrom(ix, buffers) → evaluateBase({ base, candidates, view, ui }) → BaseLayout.model
```

**Rules:**

- **Compatibility:** `mtime`/`ctime` are epoch ms in `so` (Alfred used ISO strings); date comparisons use the same values.
- **Invariants:** evaluation never throws; every unsupported construct becomes a diagnostic.
- **Ownership and Lifecycle:** derived per frame (memoized).

**Location:** `src/core/features/bases/types.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/features/bases/types.ts`

## `BaseLayout` / `BaseLayoutRegistry` — Contract

**Purpose:** Resolve a view's `type` to the model builder that renders it, with the table fallback and notice for anything else.

**Includes:**

- `BaseLayout = { id: "table" | "board"; model(e: BaseEvaluation, ui: BaseUi): TableModel | KanbanModel }`
- `BaseLayoutRegistry.register(type, layout)`, `resolve(type) → { layout, notice? }`

**Usage:**

```text
registries() → layouts.register("table", tableLayout) ; KANBAN_TYPE → register(KANBAN_TYPE, boardLayout)
baseViewModel → layouts.resolve(view.type)
```

**Rules:**

- **Compatibility:** `table` is always registered.
- **Invariants:** an unregistered type resolves to `tableLayout` with notice `"<type> view is not supported yet; showing a table"`; the file is untouched.
- **Ownership and Lifecycle:** constructed once at startup.

**Location:** `src/core/features/bases/views.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/features/bases/views.ts`

## `TableModel` / `KanbanModel` — Data Model

**Purpose:** Render-ready models shared by the window view and the embed painter.

**Includes:**

- `TableModel` — `columns` (id, label, editable, type, sort arrow), `rows` (path, cells as display text and typed value), `groups` (label, row range), `summaries` (per column), `total`
- `KanbanModel` — `property`, `lanes` (`key` value or `null`, `label`, `cards`: path, title, fields), `movable: false | true`, `why?` (`"formula"` | `"file"`)

**Usage:**

```text
BaseLayout.model → BaseViewModel.table|board → BaseView / paintBaseEmbed / base commands
```

**Rules:**

- **Compatibility:** None — new.
- **Invariants:** with `groupOrder`, lanes/groups are exactly its values in order (`null` = `None`); otherwise distinct values in `groupBy.direction` order plus `None` last.
- **Ownership and Lifecycle:** derived.

**Location:** `src/core/features/bases/{table,kanban}.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/features/bases/table.ts`, `kanban.ts`

## `BaseWindowState` — State Model

**Purpose:** What one base window remembers beyond the file: the selected view, in-memory overrides, focus, scroll, and an open cell edit.

**Includes:**

- `view: string` (view name), `sort?: { property; direction }`, `grouped?: boolean`, `filtered?: boolean`
- `focus: { path?: string; column: number }`, `scroll: { row: number; col: number }`
- `edit?: CellEdit` — `{ path, property, type, value, caret, original, error? }`

**Usage:**

```text
baseEditorKind.open(path, text, subpath) → WindowState.content.kindState → base commands update it → baseViewModel reads it
```

**Rules:**

- **Compatibility:** not persisted; a restored base window starts at its first view (W26100423LX-REQ12@R1).
- **Invariants:** `view` names an existing view or the first; overrides never reach the `.base` file.
- **Ownership and Lifecycle:** created when the window's kind becomes `base`; dropped when it changes.

**Location:** `src/core/features/bases/file-type.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/features/bases/file-type.ts`

## `WindowState.content.kindState` / `subpath` — State Model

**Purpose:** A generic slot for per-editor-kind window state, created by the kind's `open`, so a non-text kind needs no kernel or `AppState` field of its own.

**Includes:**

- `kindState?: unknown` — set only when `editor !== "text"`
- `subpath?: string` — the `#…` part the window was opened at (consumed by `open`)

**Usage:**

```text
syncEditorKinds → spec.open(path, text, subpath) → kindState ; base-model/commands narrow with isBaseWindowState
```

**Rules:**

- **Compatibility:** optional; text windows unchanged.
- **Invariants:** `kindState` belongs to `content.editor`; changing the kind drops it.
- **Ownership and Lifecycle:** window-owned; never persisted.

**Location:** `src/core/state/types.ts:93-104`

**Detailed Shape:** section 7 `src/core/state/types.ts`, `src/core/state/update.ts`

## `FileType.readOnly` / `BufferState.readOnly` — Contract / State

**Purpose:** Mark files `so` must never write, enforced at the single save gate.

**Includes:**

- `FileType.readOnly?: true`; `BufferState.readOnly?: true` copied at load

**Usage:**

```text
onFileLoaded(ft.readOnly) → BufferState.readOnly → writable() false ; writeBuffer recreate refused
```

**Rules:**

- **Compatibility:** optional; existing types unchanged.
- **Invariants:** a read-only buffer is never written, even when deleted on disk and `:w` is typed.
- **Ownership and Lifecycle:** buffer lifetime.

**Location:** `src/core/filetypes/registry.ts:35-43`, `src/core/state/types.ts:68-91`

**Detailed Shape:** section 7 `src/core/filetypes/registry.ts`, `src/core/state/save.ts`

## `NoteSummary.size/ctime`, `NoteIndex.facts` — Data Model

**Purpose:** Give every Bases candidate `file.size`, `file.ctime`, and `file.mtime`.

**Includes:**

- `NoteSummary.size`, `NoteSummary.ctime` (birth time, else mtime)
- `FileFacts = { path; size; mtime; ctime }` for non-Markdown files; `NoteIndex.facts: ReadonlyMap<string, FileFacts>`

**Usage:**

```text
worker walk → stat non-notes → batch.facts ; summarizeFile → size, ctime → applySummaries → ix.facts / ix.summaries → candidatesFrom
```

**Rules:**

- **Compatibility:** index is in-memory only; no migration.
- **Invariants:** every path in `ix.files` has either a summary or facts once indexed.
- **Ownership and Lifecycle:** rebuilt at every start; updated on `changed`/`removed`.

**Location:** `src/core/features/links/summarize.ts:18-30`, `src/core/features/links/note-index.ts:7-18`

**Detailed Shape:** section 7 `src/core/features/links/summarize.ts`, `note-index.ts`, `src/workspace/index-worker.ts`

## `PropertyTypes` / `IndexState.types` — Data Model / State

**Purpose:** Obsidian's per-name property type assignments.

**Includes:**

- `PropertyTypes = Readonly<Record<string, PropertyType>>` keyed by lower-cased name; `PropertyType = "text" | "number" | "date" | "datetime" | "checkbox" | "list" | "tags" | "aliases"`

**Usage:**

```text
readPropertyTypes → propertyTypesLoaded → IndexState.types → propertyType(name, value, types)
```

**Rules:**

- **Compatibility:** absent or malformed file → `{}`.
- **Invariants:** an assignment wins only when the value validates against it.
- **Ownership and Lifecycle:** loaded after the first frame and again when a base window opens.

**Location:** `src/core/state/types.ts:222-231` (`IndexState`) — extended

**Detailed Shape:** section 7 `src/core/features/bases/property-types.ts`, `src/workspace/property-types.ts`

## `patchFrontmatter` / `frontmatterPatched` — Message

**Purpose:** Write one property of a closed note against its current disk text, refusing when the value changed since the view showed it.

**Includes:**

- Effect: `path`, `patch: FrontmatterPatch`, `expected: FrontmatterValue | undefined`
- Action: `path`, `ok`, `text?`, `stamp?`, `removed`, `added`, `reason?`

**Usage:**

```text
writeProperty → patchFrontmatter → runner (serial) → frontmatterPatched → onFrontmatterPatched
```

**Rules:**

- **Compatibility:** additive variants.
- **Invariants:** written only when the key's current value deep-equals `expected`; the write uses the read stamp.
- **Ownership and Lifecycle:** transient.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 `src/app/effects.ts`, `src/core/state/base-write.ts`

## `readPropertyTypes` / `propertyTypesLoaded` — Message

**Purpose:** Load `.obsidian/types.json`, which the walker and watcher skip because dot entries are always hidden (`src/workspace/ignore.ts:12-14`).

**Includes:**

- Effect: `{ kind: "readPropertyTypes" }`; Action: `{ type: "propertyTypesLoaded"; types: PropertyTypes }`

**Usage:**

```text
main (after first frame) | syncEditorKinds (new base window) → runner → readPropertyTypes(root) → propertyTypesLoaded
```

**Rules:**

- **Compatibility:** additive.
- **Invariants:** never fails the app; errors produce `{}`.
- **Ownership and Lifecycle:** `IndexState.types` replaced on each load.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 `src/workspace/property-types.ts`, `src/app/effects.ts`

## `EmbedModelBuilder` / `PreviewCtx.embedModel` — Contract

**Purpose:** Let a Markdown note's embed of a non-note file render from a model built by that file type, without the Markdown layer knowing the type.

**Includes:**

- `EmbedModelBuilder = (s: AppState, path: string, subpath: string | undefined, reg: Registries) => unknown | "loading" | "missing"`
- `PreviewCtx.embedModel(path: string, subpath?: string): unknown | "loading" | "missing"`

**Usage:**

```text
markdownViewContext → embedModel → reg.embedModels.build(fileType, s, path, subpath) → baseEmbedRenderer (isBaseEmbedModel)
```

**Rules:**

- **Compatibility:** additive member; existing renderers ignore it.
- **Invariants:** builders are pure and memoized; a file type with a builder has its embed targets loaded by `syncEmbeds`.
- **Ownership and Lifecycle:** registry built once at startup.

**Location:** `src/core/lang/markdown/live-preview.ts:15-27`; `src/core/state/embed-models.ts` — proposed

**Detailed Shape:** section 7 `src/core/state/embed-models.ts`, `src/core/lang/markdown/live-preview.ts`

## `WindowView` — Contract

**Purpose:** The members `WindowTree` uses, so a window view need not be the text `EditorView` class.

**Includes:**

- `Renderable` plus `show(s, id, rect, split): void`, `cursor(): Cursor | undefined`, `destroy(): void`

**Usage:**

```text
registerEditorView(kind, create → WindowView) → WindowTree.update → view.show / cursor
```

**Rules:**

- **Compatibility:** `EditorView` already has these members (`window-tree.ts:88,103,111`).
- **Invariants:** a view paints only inside its rect.
- **Ownership and Lifecycle:** `WindowTree` creates and destroys views when the kind changes (`window-tree.ts:84-104`).

**Location:** `src/ui/editors/registry.ts:6-17`

**Detailed Shape:** section 7 `src/ui/editors/registry.ts`

# 7. Detailed Code Design

## `src/core/time/local.ts`

- **Change:** Add
- **Decisions:** DES1
- **Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ2@R1, W26100423LX-REQ3@R2
- **Responsibilities:** local calendar fields and day arithmetic
- **Affected Callers/Consumers:** `note-commands.ts`, `calendar.ts`, `features/notes/*`, `features/bases/table.ts`
- **Construction/Wiring:** None — pure functions imported directly
- **Dependencies:** none

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `LocalDate`, `LocalDateTime` | None — new symbol | field records | notes, calendar, formatter |
| `localDateTime` | None — new symbol | `(ms: number) => LocalDateTime` via `Date` getters | `note-commands`, `calendar` |
| `addDays`, `addMonthsClamped`, `withDate`, `daysInMonth`, `mondayIndex` | None — new symbol | pure arithmetic on fields (UTC math) | `openDaily`, `calendarKey` |

**Existing Shape:** None — new file or symbol

```ts
None
```

There is no existing time module; `src/core/time/` is already listed in `PURE_CORE` (`test/boundaries.test.ts:14`), so it may be imported by features and state.

**Proposed Shape:**

```ts
export type LocalDate = { year: number; month: number; day: number };
export type LocalDateTime = LocalDate & {
  hour: number; minute: number; second: number;
  /** 0 = Sunday, as Moment's `d`. */
  weekday: number;
};

export function localDateTime(ms: number): LocalDateTime;
/** Calendar arithmetic through Date.UTC, so DST never shifts the day. */
export function addDays(d: LocalDate, n: number): LocalDate;
export function addMonthsClamped(d: LocalDate, n: number): LocalDate;
export function withDate(at: LocalDateTime, d: LocalDate): LocalDateTime;
export function daysInMonth(year: number, month: number): number;
/** Monday-first column: Monday = 0 … Sunday = 6. */
export function mondayIndex(d: LocalDate): number;
```

`localDateTime` reads the process timezone once through `new Date(ms)` getters; everything else works on fields with `Date.UTC`, so day steps never drift across DST. `withDate` builds the target-day instant (target date, current wall time) used by daily templates.

- **Invariants:**
  - `addDays(d, 0)` equals `d`; `addMonthsClamped({2026,1,31}, 1)` is `{2026,2,28}`.
- **Verification Coverage:** S2, S5; V4, V9, V11

## `src/core/time/format.ts`

- **Change:** Add
- **Decisions:** DES1
- **Requirements:** W26100423LX-REQ3@R2
- **Responsibilities:** Moment-subset formatting with the full token table
- **Affected Callers/Consumers:** `dailyPath`, `expandTemplate`, `tableModel` date cells, `calendarMarks` (through `dailyPath`)
- **Construction/Wiring:** None — pure
- **Dependencies:** `src/core/time/local.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `formatDate` | None — new symbol | `(at: LocalDateTime, format: string) => string` | notes, Bases |
| `MOMENT_TOKENS` | None — new symbol | Moment 2.29.4's display tokens, longest first | `formatDate` |

**Existing Shape:** None — new file or symbol

```ts
None
```

No formatter exists; RM261003ABZP-DES11@R1 rejects a Moment or Day.js dependency.

**Proposed Shape:**

```ts
/** Moment 2.29.4 display tokens, longest first, so the scan is greedy like Moment's. */
export const MOMENT_TOKENS: readonly string[] = [
  "YYYYYY", "YYYYY", "YYYY", "YY", "Y", "gggg", "gg", "GGGG", "GG",
  "MMMM", "MMM", "MM", "Mo", "M", "Qo", "Q", "DDDD", "DDDo", "DDD", "DD", "Do", "D",
  "dddd", "ddd", "dd", "do", "d", "e", "E", "wo", "ww", "w", "Wo", "WW", "W",
  "HH", "H", "hh", "h", "kk", "k", "mm", "m", "ss", "s", "SSS…", "A", "a",
  "ZZ", "Z", "X", "x", "LTS", "LT", "LLLL", "LLL", "LL", "L", "llll", "lll", "ll", "l",
];
const SUPPORTED: Readonly<Record<string, (t: LocalDateTime) => string>> = {
  YYYY, YY, M, MM, MMM, MMMM, D, DD, Do, d, ddd, dddd, H, HH, h, hh, m, mm, s, ss, A, a,
};

export function formatDate(at: LocalDateTime, format: string): string {
  // scan: "[...]" → literal without brackets; "\x" → x; longest MOMENT_TOKENS match →
  // SUPPORTED[token]?.(at) ?? token ; any other character → itself
}
```

`formatDate` walks the format once. A bracket group is emitted without brackets; a backslash emits the next character; otherwise the longest matching entry of `MOMENT_TOKENS` is taken and rendered by `SUPPORTED` when listed, or emitted unchanged when not (so `dd` stays `dd`, `ww` stays `ww`). `SUPPORTED` encodes the research's verified rules: `h` = `hour % 12 || 12`, meridiem `hour > 11`, `Do` = the `en` ordinal rule, `d` Sunday = 0 (RF9). The `SSS…` entry stands for Moment's fractional-second tokens `S` through `SSSSSSSSS`, listed explicitly in the implementation.

- **Invariants:**
  - Supported tokens equal Moment 2.29.4 `en` output; every other Moment token is emitted whole; unbracketed non-token characters pass through.
- **Verification Coverage:** S6; V11, V12

## `src/core/features/notes/daily.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ2@R1
- **Responsibilities:** daily paths and date parsing from a path
- **Affected Callers/Consumers:** `openDaily`, `calendarMarks`
- **Construction/Wiring:** None — pure
- **Dependencies:** `core/time`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `DailyConfig` | None — new symbol | `{ folder: string; format: string; template: string }` | notes |
| `dailyPath` | None — new symbol | `(cfg, d: LocalDate) => { path: string; title: string }` | `openDaily`, `calendarMarks` |
| `parseDailyDate` | None — new symbol | `(path, cfg) => LocalDate \| undefined` | `openDaily` |

**Existing Shape:** None — new file or symbol

```ts
None
```

No daily-note code exists in `so` or Alfred (context, section 6).

**Proposed Shape:**

```ts
export type DailyConfig = { folder: string; format: string; template: string };

/** `title` is the trimmed formatted string, including any "/" segments, as Obsidian's {{title}}. */
export function dailyPath(cfg: DailyConfig, d: LocalDate): { path: string; title: string } {
  const title = formatDate({ ...d, hour: 0, minute: 0, second: 0, weekday: (mondayIndex(d) + 1) % 7 }, cfg.format).trim();
  return { path: join(cfg.folder, `${title}.md`), title };
}

/** Parses the date tokens of `cfg.format` (YYYY YY M MM MMM MMMM D DD Do) back out of `path`; other tokens match loosely. */
export function parseDailyDate(path: string, cfg: DailyConfig): LocalDate | undefined;
```

`dailyPath` formats midnight of the day and joins the folder (`""` means the root) with POSIX separators. `parseDailyDate` strips the folder prefix and `.md`, builds a regular expression from the same tokenizer (numeric groups for date tokens, month-name alternations for `MMM`/`MMMM`, `\S+?` for other tokens, escaped literals), and returns the date only when `dailyPath` of the parsed date reproduces the path case-insensitively — so ambiguous formats never return a wrong day.

- **Invariants:**
  - `parseDailyDate(dailyPath(cfg, d).path, cfg)` equals `d` for every format containing year, month, and day tokens; otherwise `undefined`.
- **Verification Coverage:** S2, S3; V1, V4

## `src/core/features/notes/template.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ3@R2, W26100423LX-REQ4@R2, W26100423LX-REQ5@R1
- **Responsibilities:** Obsidian-exact template expansion
- **Affected Callers/Consumers:** `createNote` adapter (`src/app/effects.ts`), `insertTemplate`, `pickerSources.templates.render`
- **Construction/Wiring:** None — pure
- **Dependencies:** `core/time`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `TemplateVars` | None — new symbol | `{ title: string; at: LocalDateTime }` | adapter, insertion |
| `expandTemplate` | None — new symbol | `(text: string, vars: TemplateVars) => string` | adapter, insertion, preview |
| `BUILTIN_DAILY_TEMPLATE` | None — new symbol | `"# {{date}}"` | `openDaily` (`fallback`) |

**Existing Shape:** None — new file or symbol

```ts
None
```

Obsidian's expansion function, read from its 1.13.7 bundle (RF6), replaces `{{title}}` with flag `gi`, then `/{{(date|time)(?::(.*?))?}}/gi` with one `moment()`.

**Proposed Shape:**

```ts
export type TemplateVars = { title: string; at: LocalDateTime };
export const BUILTIN_DAILY_TEMPLATE = "# {{date}}";

export function expandTemplate(text: string, vars: TemplateVars): string {
  return text
    .replace(/\{\{title\}\}/gi, () => vars.title)
    .replace(/\{\{(date|time)(?::(.*?))?\}\}/gi, (_, kind: string, fmt?: string) =>
      formatDate(vars.at, fmt ? fmt : kind.toLowerCase() === "date" ? "YYYY-MM-DD" : "HH:mm"),
    );
}
```

The two passes copy Obsidian's regexes and order exactly: names match case-insensitively, there is no whitespace trimming, an empty format uses the default, and unknown `{{…}}` text is untouched. One `vars.at` serves every occurrence. The title is inserted through a replacer function so `$&` in a title is not interpreted — a deliberate departure from Obsidian's quirk that RF6 says need not be copied.

- **Invariants:**
  - `{{ title }}` stays literal; `{{Title}}` expands; all date/time occurrences use `vars.at`.
- **Verification Coverage:** S7; V13

## `src/workspace/fs.ts`

- **Change:** Modify
- **Decisions:** DES3, DES10
- **Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ5@R1, W26100423LX-REQ7@R2
- **Responsibilities:** exclusive create with content; created time on reads
- **Affected Callers/Consumers:** `src/app/effects.ts` (`createNote`), `src/workspace/index-worker.ts` (`summarizeFile`)
- **Construction/Wiring:** None — functions imported by the runner and worker
- **Dependencies:** `node:fs/promises` `link`, `open`, `rm`, `mkdir`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `createExclusive` | None — new symbol | `(root, rel, text) => Promise<{ created: true; stamp: Stamp } \| { created: false }>` | `effects.ts` |
| `readTextFile` | `fs.ts:54-88` returns `{ text, bom, eol, stamp }` | also `createdMs` (birth time when > 0, else mtime) | worker `summarizeFile`; other callers ignore it |
| `TextFile` (`core/state/types.ts:22-27`) | four fields | `createdMs?: number` | none required |

**Existing Shape:** `src/workspace/fs.ts:171-186`

```ts
/** Create an empty file or a folder, with missing parents; never replaces an entry (E13). */
export async function createEntry(root: string, rel: string, dir: boolean): Promise<void> {
  const p = join(root, rel);
  await mkdir(dirname(p), { recursive: true });
  try {
    if (dir) await mkdir(p);
    else await (await open(p, "wx")).close();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") throw e13(rel);
    throw FsError.from(e);
  }
}
```

`createEntry` makes an empty file with `wx` and maps `EEXIST` to E13; the explorer's `create` effect runs it (`effects.ts:147-148`). It has no content and no stamp, so it cannot publish a template atomically.

**Proposed Shape:**

```ts
/**
 * Create `rel` with `text`, never replacing an entry: write a private temp file,
 * fsync, then publish it with link(), which fails with EEXIST when anything exists
 * at the target (on a case-insensitive file system, also a case variant).
 */
export async function createExclusive(
  root: string, rel: string, text: string,
): Promise<{ created: true; stamp: Stamp } | { created: false }> {
  // mkdir parents; tmp = `.${base}.so-new-${pid}` in the same folder, "wx", 0o600 → write, sync, chmod 0o644, stat
  // try link(tmp, target): EEXIST → { created: false }
  //   EPERM | ENOTSUP | EXDEV → fallback: open(target, "wx") → write → sync → close (EEXIST → { created: false })
  // finally rm(tmp, { force: true })
}
```

`createExclusive` keeps `createEntry`'s never-replace rule but publishes complete content in one step: the file appears with its full text or not at all, and `link()` refuses any existing entry, closing the race between the index check and the write. File systems without hard links fall back to `wx`, which is still exclusive. `createEntry` stays as is for the explorer.

- **Invariants:**
  - An existing entry is never modified; no temp file remains after return.
- **Verification Coverage:** S3; V3, V6

## `src/workspace/property-types.ts`

- **Change:** Add
- **Decisions:** DES10
- **Requirements:** W26100423LX-REQ8@R2
- **Responsibilities:** read and parse `.obsidian/types.json`
- **Affected Callers/Consumers:** `src/app/effects.ts` (`readPropertyTypes`)
- **Construction/Wiring:** None — imported by the runner
- **Dependencies:** `parsePropertyTypes` (`core/features/bases/property-types.ts`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `readPropertyTypes` | None — new symbol | `(root: string) => Promise<PropertyTypes>` | runner |

**Existing Shape:** None — new file or symbol

```ts
None
```

Dot folders are always hidden from the walker and watcher (`src/workspace/ignore.ts:12-14,37`), so the index never sees `types.json`.

**Proposed Shape:**

```ts
export async function readPropertyTypes(root: string): Promise<PropertyTypes> {
  // readFile(join(root, ".obsidian/types.json"), "utf8") → JSON.parse → parsePropertyTypes(json)
  // any error → {}
}
```

The adapter does only I/O and JSON parsing; validation of the `{ types: { name: type } }` shape lives in pure core.

- **Invariants:**
  - Never throws.
- **Verification Coverage:** S15; V28

## `src/app/effects.ts`

- **Change:** Modify
- **Decisions:** DES3, DES10, DES13
- **Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ5@R1, W26100423LX-REQ8@R2, W26100423LX-REQ10@R2
- **Responsibilities:** execute `createNote`, `patchFrontmatter`, `readPropertyTypes`
- **Affected Callers/Consumers:** `createUpdate` handlers `onNoteCreated`, `onFrontmatterPatched`, `onPropertyTypesLoaded`
- **Construction/Wiring:** `createEffectRunner` (existing) gains the cases; no new dependency injection
- **Dependencies:** `createExclusive`, `readTextFile`, `atomicWrite` (via `write`), `expandTemplate`, `patchFrontmatter`, `frontmatterValue`, `readPropertyTypes`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `run` (switch) | `effects.ts:175-…` handles read, write, applyEdits, create, … | adds `createNote`, `patchFrontmatter`, `readPropertyTypes` | store dispatch |

**Existing Shape:** `src/app/effects.ts:231-275`

```ts
case "applyEdits": {
  const before = [...unreported];
  void serial(async () => {
    const { batch, edit } = e;
    const followed = follow(edit.path, before);
    const path = followed ?? edit.path;
    …
    const cur = await readTextFile(abs(path)).catch(() => ({ refused: "io" as const }));
    if ("refused" in cur) return fail(`not readable (${cur.refused})`);
    const text = applySpanEdits(cur.text, edit.edits);
    if (text === null) return fail("changed on disk");
    const stamp = await write(path, restoreFile(cur, text), cur.stamp);
    d.ownOps.noteWrite(path, stamp);
    d.index?.notify({ kind: "changed", path, isDir: false });
    …
case "create":
  void serial(async () => d.dispatch(await runFsOp(e.op)));
```

`applyEdits` shows the established pattern: serial queue, path following past pending moves, read-check-write with the read stamp, own-op recording, and index notification.

**Proposed Shape:**

```ts
case "createNote":
  void serial(async () => {
    const tpl = e.template === undefined ? undefined : await readTextFile(abs(e.template)).catch(() => ({ refused: "io" as const }));
    const missing = tpl !== undefined && "refused" in tpl && !(await exists(abs(e.template!)));
    const template = e.template === undefined ? "none" : missing ? "missing" : "refused" in tpl! ? "unreadable" : "used";
    const source = template === "used" ? (tpl as TextFile).text : template === "missing" ? (e.fallback ?? "") : "";
    try {
      const r = await createExclusive(d.root, e.path, expandTemplate(source, e.vars));
      if (r.created) { d.ownOps.noteWrite(e.path, r.stamp); d.index?.notify({ kind: "changed", path: e.path, isDir: false }); }
      d.logger.info("notes.created", { path: e.path, created: r.created });
      d.dispatch({ type: "noteCreated", path: e.path, outcome: r.created ? "created" : "exists", template, then: e.then, reason: e.reason });
    } catch (x) {
      d.logger.error("notes.createFailed", { path: e.path, reason: msg(x) });
      d.dispatch({ type: "noteCreated", path: e.path, outcome: "failed", failure: msg(x), template, then: e.then, reason: e.reason });
    }
  });
  return;
case "patchFrontmatter":
  void serial(async () => {
    // read (refused → fail "not readable"); frontmatterValue(cur.text, key) deep-equals e.expected? else fail "changed on disk"
    // r = patchFrontmatter(cur.text, e.patch); !r.ok → fail(r.reason)
    // stamp = await write(path, restoreFile(cur, r.text), cur.stamp); ownOps.noteWrite; index.notify
    // logger.info("bases.patched", { path }); dispatch frontmatterPatched { ok: true, text: r.text, stamp, removed, added }
  });
  return;
case "readPropertyTypes":
  void readPropertyTypes(d.root).then((types) => d.dispatch({ type: "propertyTypesLoaded", types }));
  return;
```

`createNote` reads and expands the template inside the serial queue so the create and the template read are one ordered operation; it never emits a buffer-creating `read`, which would show the template in a window (`buffers.ts:410-411`). `patchFrontmatter` mirrors `applyEdits` but computes the patch against the current disk text and checks the expected value instead of span text, because the main thread holds no text for closed notes. Logs carry paths and outcomes only.

- **Invariants:**
  - Every write uses `write` (own-op tracking, read stamp); no note text is logged.
- **Verification Coverage:** S3, S4, S19; V5, V6, V7, V36, V37

## `src/core/state/types.ts`

- **Change:** Modify
- **Decisions:** DES3, DES4, DES5, DES6, DES10, DES11, DES13
- **Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ2@R1, W26100423LX-REQ5@R1, W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ10@R2, W26100423LX-REQ12@R1
- **Responsibilities:** state, action, and effect contracts
- **Affected Callers/Consumers:** every reducer that constructs `PromptState`, `WindowState`, `IndexState`; `createUpdate` exhaustive switch; effect runner switch
- **Construction/Wiring:** None — types
- **Dependencies:** `LocalDate`, `TemplateVars`, `FrontmatterPatch`, `PropertyTypes`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `TextFile` | `types.ts:22-27` | `+ createdMs?: number` | worker |
| `BufferState` | `types.ts:68-91` | `+ readOnly?: true` | `save.ts`, `onFileLoaded` |
| `WindowState.content` | `types.ts:95-103` | `+ kindState?: unknown; subpath?: string` | `syncEditorKinds`, base modules, `fillRestored` |
| `PromptState` | `types.ts:129-138` (`op: FsOp` required) | `PromptBase & ({ op: FsOp } \| { newNote: true })` | `explorer.ts`, `link-commands.ts`, prompt painter |
| `Overlay` | `types.ts:162-168` | `+ { kind: "calendar"; calendar: CalendarState }` | `routeKey`, overlay host |
| `IndexState` | `types.ts:222-231` | `+ types: PropertyTypes` (initial `{}`) | `base-model` |
| restore pending entry | `types.ts:267-273` | `+ then?: AfterOpen; subpath?: string` | `openPath`, `goTo`, `fillRestored` |
| `Action` | `types.ts:294-349` | `+ noteCreated, frontmatterPatched, propertyTypesLoaded` | `createUpdate` |
| `Effect` | `types.ts:351-377` | `+ createNote, patchFrontmatter, readPropertyTypes` | runner |

**Existing Shape:** `src/core/state/types.ts:93-104,129-138`

```ts
export type WindowState = {
  id: WindowId;
  content: {
    /** The editor kind showing the buffer: its file type's kind when registered, else "text". */
    editor: EditorKind;
    bufferId: BufferId;
    cursor: Pos;
    scroll: number;
    folds?: number[];
  };
};
export type PromptState = {
  kind: "confirm" | "input" | "typed";
  title: string;
  value: string;
  op: FsOp;
  impact?: string;
  invalid?: string;
};
```

The window content is text-shaped with an `editor` kind but no place for a non-text kind's state; the prompt is tied to an explorer `FsOp`.

**Proposed Shape:**

```ts
export type AfterOpen = "firstTask" | "insert";
export type CalendarState = { month: { year: number; month: number }; today: LocalDate; selected: LocalDate };

export type WindowState = {
  id: WindowId;
  content: {
    editor: EditorKind; bufferId: BufferId; cursor: Pos; scroll: number; folds?: number[];
    /** The editor kind's own window state, created by its `open`; absent for "text". Never persisted. */
    kindState?: unknown;
    /** The "#…" part the window was opened at, consumed by the kind's `open`. */
    subpath?: string;
  };
};

type PromptBase = { kind: "confirm" | "input" | "typed"; title: string; value: string; impact?: string; invalid?: string };
export type PromptState = PromptBase & ({ op: FsOp; newNote?: never } | { newNote: true; op?: never });

// Action additions
| { type: "noteCreated"; path: string; outcome: "created" | "exists" | "failed"; template: "used" | "missing" | "unreadable" | "none"; then: AfterOpen; reason: "daily" | "new"; failure?: string }
| { type: "frontmatterPatched"; path: string; ok: boolean; text?: string; stamp?: Stamp; removed: string[]; added: string[]; reason?: string }
| { type: "propertyTypesLoaded"; types: PropertyTypes }
// Effect additions
| { kind: "createNote"; path: string; template?: string; fallback?: string; vars: TemplateVars; then: AfterOpen; reason: "daily" | "new" }
| { kind: "patchFrontmatter"; path: string; patch: FrontmatterPatch; expected: FrontmatterValue | undefined }
| { kind: "readPropertyTypes" }
```

`kindState` is `unknown` in `core/state` so the type layer stays independent of Bases; base modules narrow it with `isBaseWindowState`. The `PromptState` union keeps every existing `{ …, op }` construction valid while forbidding a prompt with both or neither. All additions are optional or new variants, so persisted state and existing reducers are unaffected.

- **Invariants:**
  - `kindState` is present only when `editor !== "text"`; exactly one of `op`/`newNote`.
- **Verification Coverage:** S4, S9, S22; V8, V17, V41

## `src/core/state/note-commands.ts`

- **Change:** Add
- **Decisions:** DES4, DES6
- **Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ2@R1, W26100423LX-REQ4@R2, W26100423LX-REQ5@R1
- **Responsibilities:** note commands, bindings, group label, daily open, created-note handling, template insertion, new-note flow
- **Affected Callers/Consumers:** `createUpdate` (`noteCreated`), `promptKey` (`submitNewNote`), `calendarKey` (`openDaily`)
- **Construction/Wiring:** `registries()` registers `noteCommands`, `noteBindings`, `noteGroups`; `EX_ALIASES` (`commands.ts:52-79`) gains `Today: "note.today"`, `Yesterday: "note.yesterday"`, `Tomorrow: "note.tomorrow"`
- **Dependencies:** `dailyPath`, `parseDailyDate`, `expandTemplate`, `localDateTime`, `addDays`, `splitFrontmatter`, `mergeFrontmatter`, `openPath`, `applyBufferEdits`, `openPicker`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `noteCommands` | None — new symbol | `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `note.new`; `template.insert` (`filetypes: ["markdown"]`) | `registries()` |
| `noteBindings` | None — new symbol | `<leader>nd`, `<leader>np`, `<leader>nn` (normal); `<leader>nt` (normal, markdown) | keymap |
| `noteGroups` | None — new symbol | `{ "<leader>n": "notes" }` | which-key |
| `openDaily`, `onNoteCreated`, `insertTemplate`, `startNewNote`, `submitNewNote`, `findPathInsensitive`, `placeAfterOpen` | None — new symbol | see below | update, picker, prompt, calendar |

**Existing Shape:** `src/core/state/markdown-commands.ts:110-150`

```ts
{ id: "preview.start", title: "Preview in browser", filetypes: ["markdown"], run: startPreview },
…
const md = (mode: Mode) => ({ mode, filetype: "markdown" }) as const;
export const markdownBindings: readonly Binding[] = [
  { scope: md("normal"), seq: "<leader>m", id: "view.cycle" }, …
];
```

DI3's Markdown commands show the registration pattern: command records with optional `filetypes`, and bindings scoped by mode and file type.

**Proposed Shape:**

```ts
export function openDaily(c: CommandContext, date: LocalDate): Result {
  const { daily } = c.state.config;
  const { path, title } = dailyPath(daily, date);
  const found = findPathInsensitive(c.state.index.ix, path);
  if (found !== undefined) return openPath(c.state, found, c.now, { then: "firstTask" });
  const at = withDate(localDateTime(c.now), date);
  return { state: c.state, effects: [{ kind: "createNote", path, template: daily.template,
    fallback: BUILTIN_DAILY_TEMPLATE, vars: { title, at }, then: "firstTask", reason: "daily" }] };
}

/** Today, or ±1 day from the active daily note. */
const relativeDay = (c: CommandContext, step: -1 | 0 | 1): LocalDate => { /* parseDailyDate(active path) ?? today; addDays */ };

export function onNoteCreated(s: AppState, a: Extract<Action, { type: "noteCreated" }>, now: number): Result {
  // failed → toast error ; exists && reason "new" → toast error E13, nothing opened
  // created → toast "Created <path> from <template>" (+ error toast when template "unreadable"; "missing" for a picked template)
  // created | (exists && reason "daily") → openPath(s, a.path, now, { then: a.then })
}

export function insertTemplate(s: AppState, file: TextFile, now: number, reg: Registries): Result {
  // b = activeBuffer, readOnlyView → message READ_ONLY_HINT
  // text = expandTemplate(file.text, { title: basename(b.path, ".md"), at: localDateTime(now) })
  // cursor 0:0 → [insert text] ; else { fm, body } = splitFrontmatter(text) → [insert body at cursor, ...mergeFrontmatter(noteText, fm).edits]
  // applyBufferEdits(s, { path: b.path, edits }, now, reg) → place cursor after body → close overlay
}

export function findPathInsensitive(ix: NoteIndex, path: string): string | undefined; // WeakMap<NoteIndex, Map<lower, path>>
export function placeAfterOpen(s: AppState, then: AfterOpen): AppState; // first "- [ ]" else EOF ; insert → vim mode insert at EOF
```

`openDaily` owns the decision between open and create; the adapter never decides paths. `onNoteCreated` distinguishes daily notes (open whatever exists) from new notes (an existing name is an error, per W26100423LX-REQ5@R1). `insertTemplate` builds all spans first, then applies them through `applyBufferEdits`, which already makes them one undo step (`buffers.ts:198-207`). `findPathInsensitive` memoizes a lower-case map per immutable `NoteIndex`, so lookups cost one map read.

- **Invariants:**
  - Daily creation never happens when a case-insensitive match is indexed; insertion plus merge is one undo entry.
- **Verification Coverage:** S1, S2, S4, S8, S9; V1, V2, V4, V8, V14, V15, V17, V18

## `src/core/state/calendar.ts`

- **Change:** Add
- **Decisions:** DES5
- **Requirements:** W26100423LX-REQ2@R1
- **Responsibilities:** calendar overlay open, keys, marks
- **Affected Callers/Consumers:** `routeKey` (`keys.ts:66-80`), `CalendarOverlay`
- **Construction/Wiring:** `note.pickDate` calls `openCalendar`
- **Dependencies:** `core/time`, `dailyPath`, `findPathInsensitive`, `openDaily`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `openCalendar` | None — new symbol | `(c: CommandContext) => Result` | `note.pickDate` |
| `calendarKey` | None — new symbol | `(s, a, reg) => Result` | `routeKey` |
| `calendarMarks` | None — new symbol | `(s: AppState) => ReadonlySet<number>` (days of the shown month with a note) | `CalendarOverlay` |

**Existing Shape:** `src/core/state/keys.ts:61-80`

```ts
function routeKey(s: AppState, a: { key: Key; now: number }, reg: Registries): Result {
  switch (s.overlay.kind) {
    case "conflict": return conflictKey(s, a, reg);
    case "prompt": return promptKey(s, a.key, a.now);
    …
    case "picker": case "palette": case "help": return pickerKey(s, a, reg);
  }
```

Overlays take keys before bindings; the calendar joins this switch.

**Proposed Shape:**

```ts
export function calendarKey(s: AppState, a: { key: Key; now: number }, reg: Registries): Result {
  // h/l ±1 day, j/k ±7 days, H/L addMonthsClamped ±1, t → today, Esc → overlay none,
  // Enter → overlay none, then openDaily({ state, now, reg }, selected) ; month follows selected
  // message line: "<ddd> YYYY-MM-DD · note exists|no note"
}
```

`calendarKey` is a pure transition over `CalendarState`; the message line implements the accepted announcement (RM261003ABZP-UDES8@R1) from `calendarMarks`.

- **Invariants:**
  - `selected` stays in `month`; keys never reach bindings while open.
- **Verification Coverage:** S5; V9, V10

## `src/core/state/picker.ts`

- **Change:** Modify
- **Decisions:** DES6, DES12
- **Requirements:** W26100423LX-REQ4@R2, W26100423LX-REQ5@R1, W26100423LX-REQ8@R2
- **Responsibilities:** template sources, render hook, base view list
- **Affected Callers/Consumers:** `src/ui/overlays/picker.ts` (preview painting), `requestPreview`
- **Construction/Wiring:** sources are entries of the fixed `pickerSources` record (`picker.ts:171`)
- **Dependencies:** `expandTemplate`, `insertTemplate`, `submitNewNote` continuation

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PickerSource` | `picker.ts:41-59` | `+ render?(s, item, file): PreviewLines; previewAlways?: true` | UI picker |
| `pickerSources` | `picker.ts:171-…` | `+ templates, newNoteTemplates, baseViews` | `openPicker` |
| `requestPreview` | requests only at ≥ `PREVIEW_MIN_COLS` | also when `source.previewAlways` | picker |

**Existing Shape:** `src/core/state/picker.ts:56-58`

```ts
  accept(s: AppState, item: PickerItem, now: number, reg: Registries): Result;
  /** File-based sources: the path and line to preview. */
  preview?(item: PickerItem): { path: string; line: number } | undefined;
```

Previews are path-and-line based and the painter shows raw file lines.

**Proposed Shape:**

```ts
export type PreviewLines = { text: string; style?: string; ranges?: { from: number; to: number; style: string }[] }[];
export type PickerSource = {
  /* existing members */
  /** Display lines computed from the loaded preview file, instead of its raw lines. */
  render?(s: AppState, item: PickerItem, file: TextFile): PreviewLines;
  /** Load the preview even when the pane is hidden, because `accept` needs the file. */
  previewAlways?: true;
};

templates: {
  id: "templates", title: "Insert template", indexed: true, previewAlways: true,
  items: (s, _r, q) => ranked(templatePaths(s).map(fileItem), q),   // .md under config.templates.folder, sorted
  preview: previewFile,
  render: (s, item, file) => [...sourceLines(file.text /* {{…}} ranges styled */), { text: "▸", style: "muted" }, ...expanded(file.text, s)],
  accept: (s, item, now, reg) => loadedFile(s, item) ? insertTemplate(s, loadedFile(s, item)!, now, reg) : message(s, "loading template…"),
},
newNoteTemplates: { /* "(blank note)" first, then templatePaths; accept emits createNote with arg = path */ },
baseViews: { /* the active base's views; accept sets kindState.view */ },
```

The generic `render` hook keeps the picker painter language-neutral: the template source turns the loaded file into source-then-expansion lines, and the painter draws whatever lines it gets. `previewAlways` covers narrow terminals, where the preview pane is hidden but `Tab` toggles it and accept still needs the text.

- **Invariants:**
  - Sources without `render` paint exactly as before.
- **Verification Coverage:** S8, S9; V14, V16, V18

## `src/core/state/explorer.ts` (`promptKey`) and `src/ui/overlays/prompt.ts`

- **Change:** Modify
- **Decisions:** DES6
- **Requirements:** W26100423LX-REQ5@R1
- **Responsibilities:** route `newNote` prompts; show their path preview
- **Affected Callers/Consumers:** `routeKey` (`keys.ts:69-70`)
- **Construction/Wiring:** None
- **Dependencies:** `submitNewNote`, `newNoteTitleError`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `promptKey` | explorer prompt keys; Enter completes `prompt.op` | when `prompt.newNote`, typing sets `invalid` from `newNoteTitleError` and Enter calls `submitNewNote` | `routeKey` |
| prompt painter | shows `title`, `value`, `impact` | shows `→ <path>.md` preview for `newNote` prompts | UI |

**Existing Shape:** `src/core/state/types.ts:124-138` (the prompt's contract)

```ts
 * An explorer prompt. `op` is the operation it completes: …
export type PromptState = { kind: …; title: string; value: string; op: FsOp; impact?: string; invalid?: string };
```

**Proposed Shape:**

```ts
// in promptKey, before the explorer branch:
if (s.overlay.prompt.newNote) return newNotePromptKey(s, key, now); // edits value, sets invalid, Enter → submitNewNote
export function newNoteTitleError(value: string): string | undefined; // empty, ".." escape, leading "/", NUL, or a path segment that is "." / ".."
```

Routing on the discriminant keeps all explorer logic untouched; the title rules reject anything that would resolve outside the workspace.

- **Invariants:**
  - Explorer prompts behave exactly as before.
- **Verification Coverage:** S9; V17

## `src/core/config/schema.ts`

- **Change:** Modify
- **Decisions:** DES7
- **Requirements:** W26100423LX-REQ6@R2
- **Responsibilities:** `[daily]`, `[templates]` with path validation
- **Affected Callers/Consumers:** `AppConfig` users; `defaults`
- **Construction/Wiring:** None — `parseConfig` already maps zod issues to lines
- **Dependencies:** zod 4.6.5

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ConfigSchema` | `schema.ts:10-47` | `+ daily`, `+ templates` | config |
| `workspacePath` | None — new symbol | zod refinement | schema |

**Existing Shape:** `src/core/config/schema.ts:33-39`

```ts
  preview: z
    .strictObject({
      mode: z.enum(["live", "source", "reading"]).default("live"),
      embedMaxRows: z.number().int().min(1).max(200).default(10),
      images: z.enum(["auto", "blocks", "off"]).default("auto"),
    })
    .prefault({}),
```

**Proposed Shape:**

```ts
/** Workspace-relative: no leading "/", no "\\", and no ".." segment that leaves the root. */
const workspacePath = (opts: { root: "allow" | "deny" }) => z.string().refine(…).transform(normalizePosix);

  daily: z.strictObject({
    folder: workspacePath({ root: "allow" }).default("daily"),
    format: z.string().min(1).default("YYYY-MM-DD"),
    template: workspacePath({ root: "deny" }).default("templates/daily.md"),
  }).prefault({}),
  templates: z.strictObject({
    folder: workspacePath({ root: "deny" }).default("templates"),
  }).prefault({}),
```

The same strict-object and `prefault` pattern as `preview` gives defaults when the sections are absent and line-numbered errors for unknown keys and bad paths; `root: "deny"` rejects `""`, `.`, and `/` for the templates folder.

- **Invariants:**
  - Normalized paths have no trailing `/`.
- **Verification Coverage:** S10; V19

## `src/core/lang/markdown/frontmatter-patch.ts`

- **Change:** Add
- **Decisions:** DES8
- **Requirements:** W26100423LX-REQ4@R2, W26100423LX-REQ10@R2
- **Responsibilities:** text-level frontmatter read, set, remove, merge, split; Obsidian-typed YAML values
- **Affected Callers/Consumers:** `base-write.ts`, `src/app/effects.ts`, `note-commands.ts`
- **Construction/Wiring:** None — pure
- **Dependencies:** `yaml` 2.9.1 (`parseDocument`, node `range`, `stringify`); `SpanEdit` (`features/links/rename.ts:8`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `FrontmatterValue` | None — new symbol | `string \| number \| boolean \| null \| FrontmatterValue[]` | Bases, notes |
| `patchFrontmatter` | None — new symbol | `(text, patch) => PatchResult` | write-back |
| `frontmatterValue` | None — new symbol | `(text, key) => FrontmatterValue \| undefined` | runner |
| `splitFrontmatter` | None — new symbol | `(text) => { fm: Record<string, FrontmatterValue> \| undefined; body: string }` | `insertTemplate` |
| `mergeFrontmatter` | None — new symbol | `(noteText, props) => PatchResult` (lists unioned, scalars kept) | `insertTemplate` |
| `yamlScalar` | None — new symbol | `(value) => string` | `patchFrontmatter` |

**Existing Shape:** `src/core/lang/markdown/scan.ts:224-263` (frontmatter is parsed, never written)

```ts
// scan.ts parses the frontmatter block with yaml's parse() into DocScan.frontmatter.data
```

Today `so` reads frontmatter only; Alfred's `applyFrontmatterPatch` re-stringifies the whole object and loses comments (RF5).

**Proposed Shape:**

```ts
export type FrontmatterPatch = { set: string; value: FrontmatterValue } | { remove: string };
export type PatchResult =
  | { ok: true; edits: SpanEdit[]; text: string; removed: string[]; added: string[] }
  | { ok: false; reason: string };

export function patchFrontmatter(text: string, patch: FrontmatterPatch): PatchResult {
  // no block: set → insert "---\n<key>: <yamlScalar>\n---\n" at 0:0 ; remove → no-op ok with no edits
  // block: doc = parseDocument(fm, { keepSourceTokens: true }); errors → { ok: false, reason: "invalid frontmatter" }
  //   pair = top-level pair whose key equals patch key (exact, then case-insensitive)
  //   set + pair   → replace the value node's source range only (comments after it on the line stay)
  //                  block-sequence values replace the whole value region (lines up to the next top-level key)
  //   set + absent → append "<key>: <value>" as a new line before the closing "---"
  //   remove       → delete the pair's full lines; last key → delete the whole block ("---…---\n")
  // removed/added = the old and new "key: value" lines for the toast
}

/** Obsidian-typed YAML: date "YYYY-MM-DD" unquoted, numbers, true/false, block lists;
 *  text is double-quoted when its plain form would parse as number, boolean, null, or a date. */
export function yamlScalar(value: FrontmatterValue, indent: string): string;
```

`patchFrontmatter` uses `yaml`'s source ranges to locate one key and splices only that span, so comments, key order, quoting of other keys, line endings, and the body stay byte-identical; it returns both the new text (for files) and the span edits (for buffers), plus the diff lines. `yamlScalar` encodes RF5's write rules, including quoting `"42"`, `"true"`, and `"2026-10-05"` text. The module lives in `lang/markdown` because that is `yaml`'s existing home and frontmatter is a Markdown construct.

- **Invariants:**
  - Re-parsing the result equals the input object with only the patched key changed; text outside the edited lines is unchanged.
- **Verification Coverage:** S8, S18; V15, V34

## `src/core/features/bases/types.ts`, `parser.ts`, `expression.ts`, `evaluator.ts`, `summaries.ts`

- **Change:** Add (port of `alfred/packages/vault/src/domain/bases/{types,parser,expression,evaluator}.ts` at `5fde89b0`)
- **Decisions:** DES9
- **Requirements:** W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2
- **Responsibilities:** parse, evaluate, summarize; `KANBAN_TYPE`
- **Affected Callers/Consumers:** `base-model.ts`, `features/bases/{table,kanban,embed}.ts`
- **Construction/Wiring:** None — pure
- **Dependencies:** `yaml` (parser only; new package home), `core/time`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `parseBase` | Alfred `parseBaseSource` (`parser.ts:19-61`): throws only on invalid YAML | same, plus warnings `view_name_missing`, `group_by_invalid`; legacy `sort[].column` → `property` | `base-model` |
| `evaluateExpression` | Alfred `expression.ts`: double quotes only; `inFolder` exact; `hasTag` first arg (`expression.ts:178-190,284,321`) | single quotes accepted; `inFolder` = folder or below; `hasTag` = any argument, nested tags | evaluator |
| `evaluateBase` | Alfred `evaluator.ts:164-…`; unknown types → no rows | types resolved by layouts (all types evaluate rows); unsupported filter → `filter_hides_rows` diagnostic; `groupOrder` passed through | `base-model` |
| `summarize` / `DEFAULT_SUMMARIES` | None — new symbol (Alfred evaluates no summaries) | Obsidian's 15 defaults; custom → `summary_unsupported` diagnostic | `tableModel` |
| `KANBAN_TYPE` | None — new symbol | `export const KANBAN_TYPE: string \| undefined = undefined;` | `registries()` |

**Existing Shape:** `alfred/packages/vault/src/domain/bases/expression.ts:186-188` (port source)

```ts
if (method === "inFolder") {
  return this.context.file.folder === String(firstArg);
}
```

Alfred's subset is the parent-approved surface (RM261003ABZP-DES12@R2); RF4 shows its `inFolder` and `hasTag` semantics differ from Obsidian's documented ones.

**Proposed Shape:**

```ts
// expression.ts
case "inFolder": { const f = String(arg0).replace(/\/+$/, ""); return folder === f || folder.startsWith(`${f}/`); }
case "hasTag":   return args.some((t) => tags.some((x) => x === norm(t) || x.startsWith(`${norm(t)}/`)));
// tokenizer: a "'" opens a string like '"'

// evaluator.ts
export function evaluateBase(input: { base: Base; candidates: readonly BaseCandidate[]; view?: string; ui?: BaseUi }): BaseEvaluation;
// filter evaluation: a diagnostic on a filter expression → row excluded + one diagnostic
//   { severity: "warning", code: "filter_hides_rows", message: `filter "${expr}" is not supported; rows it guards are hidden` }

// summaries.ts
export const DEFAULT_SUMMARIES = ["Average","Min","Max","Sum","Range","Median","Stddev","Earliest","Latest","DateRange","Checked","Unchecked","Empty","Filled","Unique"] as const;
export function summarize(name: string, values: readonly BaseCell[]): BaseCell | { diagnostic: BaseDiagnostic };

// types.ts
/** The view type Obsidian writes for its Kanban layout; set only from a .base saved by Obsidian ≥ 1.14.3 (see test/fixtures/bases/README.md). */
export const KANBAN_TYPE: string | undefined = undefined;
```

The port keeps Alfred's structure and tests; the three corrections change behavior of functions already in the subset and the tokenizer's quote handling, adding no function or operator, so the parent boundary against widening the subset holds. `BaseUi` carries the window's in-memory sort, grouping, and filter overrides so evaluation never needs a modified `Base`. `KANBAN_TYPE` is typed `string | undefined` so `registries()` can test it; until the fixture lands, no type selects the board.

- **Invariants:**
  - Evaluation never throws; parse fails only for invalid YAML.
- **Verification Coverage:** S11, S12, S13, S14, S16; V21, V22, V23, V24, V26, V27, V30

## `src/core/features/bases/property-types.ts`, `candidates.ts`

- **Change:** Add
- **Decisions:** DES10
- **Requirements:** W26100423LX-REQ7@R2, W26100423LX-REQ8@R2
- **Responsibilities:** Obsidian property typing; candidates from the index and open buffers
- **Affected Callers/Consumers:** `base-model.ts`, `base-commands.ts`, `workspace/property-types.ts`
- **Construction/Wiring:** None — pure
- **Dependencies:** `NoteIndex`, `NoteSummary`, `FileFacts`, `Doc` (open buffers' scan)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `propertyType` | None — new symbol | `(name, value, types) => PropertyType` | table, cell editor |
| `parsePropertyTypes` | None — new symbol | `(json: unknown) => PropertyTypes` | adapter |
| `candidatesFrom` | None — new symbol | `(ix: NoteIndex, overlay: ReadonlyMap<string, DocScan>) => BaseCandidate[]` | `base-model` |

**Existing Shape:** `src/core/features/links/summarize.ts:18-30`

```ts
export type NoteSummary = {
  path: string; mtime: number; title: string; aliases: string[]; tags: string[];
  headings: …; blocks: …; links: LinkRef[]; frontmatter: Record<string, unknown>;
};
```

Summaries already carry tags, links, and frontmatter; `size` and `ctime` are missing, and non-note files have no record.

**Proposed Shape:**

```ts
export function propertyType(name: string, value: unknown, types: PropertyTypes): PropertyType {
  const assigned = types[name.toLowerCase()];
  if (assigned !== undefined && validates(assigned, value)) return assigned;
  if (name === "tags") return "tags"; if (name === "aliases") return "aliases";
  if (typeof value === "string") return /^\d{4}-[01]\d-[0-3]\d$/.test(value) ? "date"
    : /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d$/.test(value) ? "datetime" : "text";
  return typeof value === "number" ? "number" : typeof value === "boolean" ? "checkbox" : Array.isArray(value) ? "list" : "text";
}

/** One candidate per indexed file; an open Markdown buffer's current scan overrides its summary's properties, tags, and links. */
export function candidatesFrom(ix: NoteIndex, overlay: ReadonlyMap<string, DocScan>): BaseCandidate[];
```

`propertyType` reproduces Obsidian's rule from RF5 exactly. `candidatesFrom` yields notes from `ix.summaries` (with `size`, `ctime`) and other files from `ix.facts`; the overlay makes a property edited in an open, unsaved note visible in the view at once, before autosave updates the index.

- **Invariants:**
  - Every indexed file yields exactly one candidate.
- **Verification Coverage:** S12, S15; V22, V28

## `src/core/features/links/summarize.ts`, `note-index.ts`; `src/workspace/index-worker.ts`; `src/core/state/index.ts`

- **Change:** Modify
- **Decisions:** DES10
- **Requirements:** W26100423LX-REQ7@R2
- **Responsibilities:** carry file facts through the index
- **Affected Callers/Consumers:** `onIndexBatch` (`src/core/state/index.ts:27-37`), `summarizeSaved`/`summarizeWritten` (`index.ts:63,107`), worker tests
- **Construction/Wiring:** worker message `FromWorker.batch` (`index-worker.ts:28-35`)
- **Dependencies:** `stat` in the worker

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `NoteSummary` | `summarize.ts:18-30` | `+ size: number; ctime: number` | index, Bases |
| `summarize` | `(path, mtime, scan, lines?)` (`summarize.ts:38-43`) | `(path, facts: { mtime; size; ctime }, scan, lines?)` | worker, `summarizeSaved`, `summarizeWritten` |
| `NoteIndex` | `note-index.ts:7-18` | `+ facts: ReadonlyMap<string, FileFacts>` | Bases |
| `buildIndex`, `applySummaries` | `(summaries, files)` | `(summaries, files, facts)` | `onIndexBatch` |
| `FromWorker.batch` | `{ summaries, done, total, files? }` | `+ facts?: FileFacts[]` | index host |
| `walk` | returns paths (`index-worker.ts:65-87`) | also stats non-note files into facts | worker |

**Existing Shape:** `src/workspace/index-worker.ts:97-107`

```ts
async function summarizeFile(path: string): Promise<NoteSummary | undefined> {
  const r = await readTextFile(join(root, path));
  …
  return summarize(path, r.stamp.mtimeMs, scanDoc(r.text), linesOf(r.text));
}
```

**Proposed Shape:**

```ts
return summarize(path, { mtime: r.stamp.mtimeMs, size: r.stamp.size, ctime: r.createdMs ?? r.stamp.mtimeMs }, scanDoc(r.text), linesOf(r.text));
// walk(): for a non-note file, stat → { path, size, mtime: mtimeMs, ctime: birthtimeMs || mtimeMs }
// changed(): non-note paths are stat-ed and sent as facts in an update batch
```

The size comes free from the stamp and the created time from the `fstat` `readTextFile` already does; only non-note files need an extra `stat`, which keeps the 10,000-note `indexReady` target unaffected (non-notes are a small share and are stat-ed in the same walk).

- **Invariants:**
  - `ix.facts` never holds a Markdown path.
- **Verification Coverage:** S12; V22

## `src/core/features/bases/table.ts`, `kanban.ts`, `views.ts`

- **Change:** Add (board rules ported from `alfred/packages/view-model/src/base/board.ts:29-129`)
- **Decisions:** DES9, DES12
- **Requirements:** W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2
- **Responsibilities:** view models and the layout registry
- **Affected Callers/Consumers:** `base-model.ts`, `BaseView`, `paintBaseEmbed`, `base-commands.ts`
- **Construction/Wiring:** `registries()` builds `BaseLayoutRegistry`
- **Dependencies:** `BaseEvaluation`, `formatDate`, `propertyType`, `summarize`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `tableModel` | None — new symbol | `(e: BaseEvaluation, ui: BaseUi, types) => TableModel` | layouts |
| `kanbanModel` | Alfred `toBaseBoard` (`board.ts:29-71`): option order then first-seen | `groupOrder` exact when present, else distinct values sorted by `groupBy.direction` plus `None` last; `movable` false for formula or `file.*` group property | layouts |
| `BaseLayoutRegistry` | None — new symbol | `register(type, layout)`, `resolve(type)` | `registries()`, `base-model` |

**Existing Shape:** `alfred/packages/view-model/src/base/board.ts:73-83`

```ts
/** Whether board cards can move between lanes: the group column is an editable note property. */
export function canMoveBaseBoardCards(column: BaseColumn | undefined): boolean { … }
```

**Proposed Shape:**

```ts
export type KanbanModel = {
  property: string;
  lanes: { key: FrontmatterValue | null; label: string; cards: { path: string; title: string; fields: string[] }[] }[];
  movable: boolean;
  why?: "formula" | "file";
};
export function kanbanModel(e: BaseEvaluation, ui: BaseUi): KanbanModel;

export type BaseLayout = { id: "table" | "board"; model(e: BaseEvaluation, ui: BaseUi, types: PropertyTypes): TableModel | KanbanModel };
export class BaseLayoutRegistry {
  register(type: string, layout: BaseLayout): void;
  resolve(type: string): { layout: BaseLayout; notice?: string };   // fallback: tableLayout + notice
}
export const tableLayout: BaseLayout; export const boardLayout: BaseLayout;
```

`kanbanModel` keeps lane keys as typed YAML values so a move writes `status: 3` as a number when the lane is numeric. `BaseLayoutRegistry.resolve` is the single place the table fallback and its notice are produced, used by both windows and embeds.

- **Invariants:**
  - With `groupOrder`, lanes equal it exactly (including empty lanes); `movable` is false whenever the group property is a formula or `file.*`.
- **Verification Coverage:** S14, S16, S17; V26, V29, V31, V32, V33

## `src/core/filetypes/registry.ts` and `src/core/features/bases/file-type.ts`

- **Change:** Modify / Add
- **Decisions:** DES11
- **Requirements:** W26100423LX-REQ7@R2, W26100423LX-REQ12@R1
- **Responsibilities:** read-only file types; `open` with subpath; the `base` file type and editor kind
- **Affected Callers/Consumers:** `syncEditorKinds`, `onFileLoaded`, `registries()`
- **Construction/Wiring:** `fileTypes.register(baseFileType)`, `editorKinds.register(baseEditorKind)`
- **Dependencies:** `parseBase` (to resolve the subpath to a view name)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `EditorKindSpec.open` | `open(path, text): St` (`registry.ts:16-19`), never called | `open(path, text, subpath?: string): St`, called by `syncEditorKinds` | base kind |
| `FileType` | `registry.ts:35-43` | `+ readOnly?: true` | `onFileLoaded` |
| `baseFileType` | None — new symbol | `{ id: "base", match: { extensions: [".base"] }, editor: "base", readOnly: true, views: [{ id: "base", readOnly: true, decorations: [] }] }` | registries |
| `baseEditorKind` | None — new symbol | `{ id: "base", open: (path, text, subpath) => BaseWindowState }` | registries |
| `isBaseWindowState` | None — new symbol | type guard | base modules |

**Existing Shape:** `src/core/filetypes/registry.ts:16-19`

```ts
export type EditorKindSpec<St = unknown> = {
  id: EditorKind;
  open(path: string, text: string): St;
};
```

**Proposed Shape:**

```ts
export type EditorKindSpec<St = unknown> = {
  id: EditorKind;
  /** The kind's window state for `path`; `subpath` is the "#…" the window was opened at. */
  open(path: string, text: string, subpath?: string): St;
};
export type FileType<S = unknown> = { /* existing */ readOnly?: true };

// features/bases/file-type.ts
export const baseEditorKind: EditorKindSpec<BaseWindowState> = {
  id: "base",
  open: (_path, text, subpath) => {
    const base = parseBase(text);
    const named = subpath?.replace(/^#/, "");
    const view = base.ok ? (base.base.views.find((v) => v.name === named) ?? base.base.views[0])?.name : undefined;
    return { view: view ?? "", focus: { column: 0 }, scroll: { row: 0, col: 0 } };
  },
};
```

The one view is read-only, so even if a key reached `runVim` it would be refused (`keys.ts:259-263`); the file type's `readOnly` additionally closes the save path. The subpath argument is generic: a future notebook kind can open at a cell.

- **Invariants:**
  - `.base` matches only through the registry (`forPath`, `registry.ts:84-93`); no other module tests the extension.
- **Verification Coverage:** S11, S13, S22; V20, V25, V41

## `src/core/state/update.ts`, `keys.ts`, `save.ts`, `buffers.ts`, `session.ts`, `jumps.ts`

- **Change:** Modify
- **Decisions:** DES4, DES11, DES12, DES15
- **Requirements:** W26100423LX-REQ1@R2, W26100423LX-REQ7@R2, W26100423LX-REQ11@R1, W26100423LX-REQ12@R1
- **Responsibilities:** create kind state, route keys, gate saves, carry placement and subpath
- **Affected Callers/Consumers:** every action through `createUpdate`
- **Construction/Wiring:** `Registries` gains `embedModels: EmbedModelRegistry` and `layouts: BaseLayoutRegistry`
- **Dependencies:** `EditorKindSpec.open`, `fullText`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Registries` | `update.ts:50-60` | `+ embedModels`, `+ layouts` | `registries()`, `testRegistries` |
| `syncEditorKinds` | sets `editor` only (`update.ts:67-85`) | when the kind becomes non-text: `kindState = spec.open(path, fullText(b.text), w.content.subpath)`, drop `subpath`; emit `readPropertyTypes` once per newly created base window; when it becomes text: drop `kindState` | all reducers |
| `createUpdate` | routes actions (`update.ts:94-173`) | + `noteCreated`, `frontmatterPatched`, `propertyTypesLoaded`; `syncEmbeds(state, r, reg)` | store |
| `routeKey` | `keys.ts:61-84` | + `case "calendar": return calendarKey(…)`; active base window with `kindState.edit` → `cellEditKey` | key flow |
| `bindingOrVim` | falls to `runVim` (`keys.ts:117-119`) | when the active window's `content.editor !== "text"` → drop the key (`pending: []`) instead of `runVim` | key flow |
| `writable` / `writeBuffer` | `save.ts:25-26,67-96` | `b.readOnly !== true` in `writable`; `writeBuffer` returns a "read-only file" message for read-only buffers before the recreate branch | saves |
| `onFileLoaded` | `buffers.ts:356-418` | sets `readOnly: true` when `ft.readOnly` | buffers |
| `openPath` | `(s, path, now)` (`buffers.ts:329-347`) | `(s, path, now, opts?: { then?: AfterOpen; subpath?: string })` | notes, `goTo` |
| `fillRestored` | `session.ts:184-218` builds text content | copies `subpath` into content and applies `then` through `placeAfterOpen` | restore |
| `goTo`, `awaitLoad` | `jumps.ts:67-86` | accept `subpath` and pass it to `openPath`/pending | `followLink` |

**Existing Shape:** `src/core/state/update.ts:67-85`

```ts
function syncEditorKinds(r: Result, reg: Registries): Result {
  const s = r.state;
  let byId: AppState["windows"]["byId"] | undefined;
  for (const w of Object.values(s.windows.byId)) {
    const b = s.buffers[w.content.bufferId];
    if (b === undefined) continue;
    const kind = reg.fileTypes.get(b.fileType)?.editor;
    const editor = kind !== undefined && reg.editorKinds.get(kind) !== undefined ? kind : "text";
    if (editor === w.content.editor) continue;
    byId ??= { ...s.windows.byId };
    byId[w.id] = { ...w, content: { ...w.content, editor } };
  }
  …
```

**Proposed Shape:**

```ts
    if (editor === w.content.editor) continue;
    const spec = reg.editorKinds.get(editor);
    const { kindState: _k, subpath, ...rest } = w.content;
    const content = spec === undefined
      ? { ...rest, editor }
      : { ...rest, editor, kindState: spec.open(b.path, fullText(b.text), subpath) };
    byId[w.id] = { ...w, content };
    if (editor === "base") effects.push({ kind: "readPropertyTypes" });

// keys.ts bindingOrVim, replacing the last line:
  if (activeWindow(s)?.content.editor !== "text") return none(setVim(s, { pending: [] }));
  return runVim(s, a.key, a.now, reg);
```

`syncEditorKinds` becomes the single creator of kind state, so every way a `.base` reaches a window (open, restore, buffer switch, link follow) gets the same state. The key-routing rule is generic: any non-text editor kind handles keys only through its bindings and its own sub-state, never through the text engine.

- **Invariants:**
  - A read-only buffer is never written; a non-text window never runs `handleKey`.
- **Verification Coverage:** S4, S13, S22; V8, V25, V41

## `src/core/state/base-model.ts`

- **Change:** Add
- **Decisions:** DES11, DES12, DES15
- **Requirements:** W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ11@R1, W26100423LX-REQ12@R1
- **Responsibilities:** derive and memoize base view models for windows and embeds
- **Affected Callers/Consumers:** `BaseView` (via `viewContexts.build("base", …)`), `base-commands.ts`, `embedModels` (`base`)
- **Construction/Wiring:** `viewContexts.register("base", baseViewContext)`; `embedModels.register("base", baseEmbedModel)`
- **Dependencies:** `candidatesFrom`, `parseBase`, `evaluateBase`, `reg.layouts`, `IndexState.types`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `BaseViewModel` | None — new symbol | `{ status: "waiting" \| "parseError" \| "ok"; title; views: { name; type }[]; selected; table?; board?; notice?; diagnostics; focus: { row; column; lane? } }` | view, commands |
| `baseViewModel` | None — new symbol | `(s, windowId, reg) => BaseViewModel \| undefined` | view, commands |
| `baseViewContext` | None — new symbol | `ViewContextBuilder` returning `baseViewModel` | registry |
| `baseEmbedModel` | None — new symbol | `EmbedModelBuilder` (view by subpath, capped at `embedMaxRows`) | registry |

**Existing Shape:** `src/core/state/view-context.ts:14-19`

```ts
/** Builds a view's input context for one window; a pure function of its arguments. */
export type ViewContextBuilder = (s: AppState, windowId: WindowId, host: ViewHost) => unknown;
```

**Proposed Shape:**

```ts
type Key = { text: TextBuffer; version: number; ix: NoteIndex; types: PropertyTypes; dirty: string; ui: BaseWindowState | string };
const memo = new Map<string /* window or embed key */, { key: Key; model: BaseViewModel }>();

export function baseViewModel(s: AppState, windowId: WindowId, reg: Registries): BaseViewModel | undefined {
  // ws = isBaseWindowState(content.kindState) ; b = buffer
  // key = { text: b.text, version: b.text.version, ix: s.index.ix, types: s.index.types, dirty: dirtyNoteSignature(s), ui: ws }
  // hit → model ; s.index.status !== "ready" && s.index.ix.files.size === 0 → { status: "waiting" }
  // parseBase → error → { status: "parseError" } ; evaluateBase({ base, candidates: candidatesFrom(ix, overlayOf(s)), view: ws.view, ui })
  // layouts.resolve(view.type) → model ; focus row = index of ws.focus.path (else min(previous row, last))
}
```

The memo keys on identities that change only when an input changes (the immutable `NoteIndex`, the `TextBuffer` version, the window state object, and a signature of dirty Markdown buffers' versions), so frames without relevant changes reuse the model. `status: "waiting"` shows `◌ waiting for index` until the first batch arrives.

- **Invariants:**
  - The model is a pure function of its key; focus follows `focus.path`.
- **Verification Coverage:** S12, S14, S22; V22, V26, V41, V42

## `src/core/state/base-commands.ts`

- **Change:** Add
- **Decisions:** DES12
- **Requirements:** W26100423LX-REQ8@R2, W26100423LX-REQ9@R2
- **Responsibilities:** base-scoped commands and bindings, the cell editor, card moves, view switching
- **Affected Callers/Consumers:** keymap, `routeKey` (`cellEditKey`)
- **Construction/Wiring:** `registries()` registers `baseCommands` and `baseBindings` (`{ mode: "normal", filetype: "base" }`)
- **Dependencies:** `baseViewModel`, `writeProperty`, `propertyType`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `baseCommands` | None — new symbol | `base.left/right/up/down`, `base.edit`, `base.toggle`, `base.sort`, `base.group`, `base.filter`, `base.views`, `base.nextView`, `base.view1`–`base.view4`, `base.moveLeft`, `base.moveRight`, `base.open` (all `filetypes: ["base"]`) | registries |
| `baseBindings` | None — new symbol | `h j k l i x s g f v <Tab> 1 2 3 4 H L <CR>` in normal mode, file type `base` | keymap |
| `cellEditKey` | None — new symbol | edits `kindState.edit`; `Ctrl-a`/`Ctrl-x` step numbers and dates; `Esc` drops; `Enter` → `commitCellEdit` | `routeKey` |
| `moveCard`, `commitCellEdit`, `toggleCheckbox` | None — new symbol | call `writeProperty` | commands |

**Existing Shape:** `src/core/state/markdown-commands.ts:143-150` (scoped binding pattern)

```ts
const md = (mode: Mode) => ({ mode, filetype: "markdown" }) as const;
export const markdownBindings: readonly Binding[] = [ … ];
```

**Proposed Shape:**

```ts
const base = (mode: Mode) => ({ mode, filetype: "base" }) as const;
export const baseBindings: readonly Binding[] = [
  { scope: base("normal"), seq: "j", id: "base.down" }, /* … */ { scope: base("normal"), seq: "L", id: "base.moveRight" },
];

function moveCard(c: CommandContext, step: -1 | 1): Result {
  // m = baseViewModel ; !m.board → table: H/L scroll columns ; board && !movable → toast(explanation(m.board.why))
  // lane = m.board.lanes[i + step] ; undefined → none
  // writeProperty(s, card.path, lane.key === null ? { remove: property } : { set: property, value: lane.key }, expected)
}

function validateCell(type: PropertyType, value: string): { ok: true; value: FrontmatterValue } | { ok: false; error: string };
```

Commands read the derived model and change only `kindState` or emit writes; the cell editor is a sub-state routed before bindings, like the prompt overlay, so typed characters never trigger base commands.

- **Invariants:**
  - `s`, `g`, `f` change only `kindState`; no command writes the `.base` buffer.
- **Verification Coverage:** S14, S16, S17; V27, V29, V31, V32, V33

## `src/core/state/base-write.ts`

- **Change:** Add
- **Decisions:** DES13
- **Requirements:** W26100423LX-REQ9@R2, W26100423LX-REQ10@R2
- **Responsibilities:** route property writes; handle results
- **Affected Callers/Consumers:** `base-commands.ts`; `createUpdate` (`frontmatterPatched`)
- **Construction/Wiring:** none beyond `createUpdate` routing
- **Dependencies:** `patchFrontmatter`, `applyBufferEdits`, `bufferForPath`, `summarizeWritten`, `toast`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `writeProperty` | None — new symbol | `(s, path, patch, expected, now, reg) => Result` | commands |
| `onFrontmatterPatched` | None — new symbol | `(s, a) => Result` | update |

**Existing Shape:** `src/core/state/link-edits.ts:199-230`

```ts
/** The file operation succeeded: edit open buffers in memory (one undo step each, saved by autosave) and send one `applyEdits` per closed file. */
export function beginRewrite(s: AppState, reg: Registries): Result { … bufferForPath … applyBufferEdits … effects.push({ kind: "applyEdits", … }) }
```

**Proposed Shape:**

```ts
export function writeProperty(s: AppState, path: string, patch: FrontmatterPatch, expected: FrontmatterValue | undefined, now: number, reg: Registries): Result {
  const b = bufferForPath(s, path);
  if (b !== undefined && b.listed !== false) {
    const r = patchFrontmatter(fullText(b.text), patch);
    if (!r.ok) return toast(s, "error", r.reason);
    const applied = applyBufferEdits(s, { path, edits: r.edits }, now, reg);
    return applied.stale ? toast(s, "error", "changed in the editor") : chain(applied, (st) => diffToast(st, r.removed, r.added));
  }
  return { state: s, effects: [{ kind: "patchFrontmatter", path, patch, expected }] };
}
export function onFrontmatterPatched(s: AppState, a: Extract<Action, { type: "frontmatterPatched" }>): Result {
  return a.ok && a.text !== undefined
    ? diffToast(summarizeWritten(s, a.path, a.text, a.stamp?.mtimeMs ?? 0), a.removed, a.added)
    : toast(s, "error", `not written: ${a.path} (${a.reason ?? "unknown error"})`);
}
```

The open-buffer branch is the same mechanism link rewrites use; the closed branch delegates the read-check-write to the serial queue. Updating the index with `summarizeWritten` makes the view show the new value immediately; a failure leaves the index, and therefore the displayed value, as on disk.

- **Invariants:**
  - An unsaved buffer is never overwritten; a closed file is written only when its value still equals what the view showed.
- **Verification Coverage:** S18, S19; V35, V36, V37

## `src/core/state/embed-models.ts`, `src/core/lang/markdown/live-preview.ts`, `src/core/state/markdown-view.ts`, `src/core/state/embeds.ts`, `src/core/features/bases/embed.ts`, `src/core/state/link-commands.ts`

- **Change:** Add / Modify
- **Decisions:** DES15
- **Requirements:** W26100423LX-REQ11@R1
- **Responsibilities:** generic non-note embed models; base embed rendering; loading base embed targets; opening at the embedded view
- **Affected Callers/Consumers:** `livePreview` renderers, `syncEmbeds`, `followLink`
- **Construction/Wiring:** `registries()` → `embedModels.register("base", baseEmbedModel)`, `registerBlockRenderer("base", baseEmbedRenderer)`
- **Dependencies:** `baseViewModel` machinery, `resolveLink`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `EmbedModelRegistry` | None — new symbol | `register(fileTypeId, builder)`, `has(fileTypeId)`, `build(fileTypeId, s, path, subpath, reg)` | update, view context |
| `PreviewCtx` | `live-preview.ts:15-27` | `+ embedModel(path: string, subpath?: string): unknown \| "loading" \| "missing"` | renderers |
| `markdownViewContext` | `markdown-view.ts:21-52` | implements `embedModel` from `reg.embedModels` and the note's embed requests | live preview |
| `embedTargets` | notes only (`embeds.ts:13-22`) | also targets whose file type `reg.embedModels.has` | `syncEmbeds` |
| `syncEmbeds` | `(prev, r)` | `(prev, r, reg)` | `createUpdate` |
| `baseEmbedRenderer` | None — new symbol | `BlockRenderer` for render key `base` | registry |
| `followLink` | opens at a heading line (`link-commands.ts:101-102`) | for a non-Markdown target passes `subpath` to `goTo` | `note.enter` |

**Existing Shape:** `src/core/state/markdown-view.ts:37-43`

```ts
    embed: (path) => {
      const b = bufferForPath(s, path);
      if (b?.analysis !== undefined) return { doc: b.analysis as Doc, text: b.text };
      if (own?.embeds?.refused.includes(path)) return "missing";
      return own?.embeds?.requested.includes(path) ? "loading" : "missing";
    },
```

The context already answers note embeds from open buffers and the note's embed requests; render key `base` already reaches a registry lookup for `![[tasks.base]]` (`render-key.ts:16-22`).

**Proposed Shape:**

```ts
// embed-models.ts
export type EmbedModelBuilder = (s: AppState, path: string, subpath: string | undefined, reg: Registries) => unknown | "loading" | "missing";
export class EmbedModelRegistry { register(fileTypeId: string, b: EmbedModelBuilder): void; has(id: string): boolean; build(id: string, s: AppState, path: string, subpath: string | undefined, reg: Registries): unknown | "loading" | "missing"; }

// markdown-view.ts (builder now needs reg: ViewContextBuilder gains reg via closure in registries())
    embedModel: (path, subpath) => {
      if (own?.embeds?.refused.includes(path)) return "missing";
      const b = bufferForPath(s, path);
      if (b === undefined) return own?.embeds?.requested.includes(path) ? "loading" : "missing";
      return reg.embedModels.build(b.fileType, s, path, subpath, reg);
    },

// features/bases/embed.ts
export const baseEmbedRenderer: BlockRenderer = (block, v, { doc, ctx }) => {
  const { target, section } = embedLink(doc, block, v.buf);
  const path = ctx.resolve(target);
  const got = path === undefined ? "missing" : ctx.embedModel(path, section);
  // "loading" → widget base rows min(embedMaxRows, 3) ; "missing" or !isBaseEmbedModel(got) → title + notice
  // model → { kind: "replace", range: wholeBlock, block: true, widget: { type: "base", data: got, rows: got.rows } }
};
```

`markdownViewContext` is built in `registries()` as a closure over `reg` so it can reach `embedModels` (the `ViewContextBuilder` signature is unchanged). The base renderer is registered from `features/bases`, so `lang/markdown` never imports Bases. Embeds use the memo in `base-model.ts` keyed by path and subpath.

- **Invariants:**
  - The embed is read-only; at most `embedMaxRows` rows plus a header and `↓ N more`.
- **Verification Coverage:** S20, S21; V38, V39

## `src/ui/editors/registry.ts`, `src/ui/editors/text-view.ts`, `src/ui/views/window-tree.ts`, `src/ui/editors/base-view.ts`, `src/ui/widgets/base.ts`

- **Change:** Modify / Add
- **Decisions:** DES14, DES15
- **Requirements:** W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ11@R1, W26100423LX-REQ12@R1, W26100423LX-REQ13@R1
- **Responsibilities:** window views by interface; the Bases view; table, board, and embed painters
- **Affected Callers/Consumers:** `WindowTree.update` (`window-tree.ts:82-104`)
- **Construction/Wiring:** `registerEditorView("base", …)`, `registerWidgetPainter("base", paintBaseEmbed)` in `main()`
- **Dependencies:** `@opentui/core` `Renderable`; `reg.viewContexts`; theme styles

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `editorViews` / `registerEditorView` | factory returns `EditorView` class (`registry.ts:6-17`) | factory returns `WindowView` | `main.ts`, `window-tree.ts` |
| `WindowView` | None — new symbol | `Renderable & { show(s, id, rect, split): void; cursor(): Cursor \| undefined }` | UI |
| `EditorView` | `class EditorView extends Renderable` (`text-view.ts:266`) | `… implements WindowView` (no behavior change) | — |
| `BaseView` | None — new symbol | `WindowView` painting toolbar, body, hints from `BaseViewModel` | registry |
| `paintBaseTable`, `paintBaseBoard`, `paintBaseEmbed` | None — new symbol | painters | `BaseView`, widget registry |

**Existing Shape:** `src/ui/editors/registry.ts:5-9`

```ts
/** Window content views by editor kind (`WindowState.content.editor`). */
export const editorViews = new Map<string, (ctx: RenderContext, deps: ViewDeps) => EditorView>();
```

**Proposed Shape:**

```ts
export type WindowView = Renderable & {
  show(s: AppState, id: WindowId, r: Rect, split: boolean): void;
  cursor(): Cursor | undefined;
};
export const editorViews = new Map<string, (ctx: RenderContext, deps: ViewDeps) => WindowView>();

export class BaseView extends Renderable implements WindowView {
  show(s: AppState, id: WindowId, r: Rect, split: boolean): void { /* model = deps.reg.viewContexts.build("base", s, id, host) */ }
  cursor(): Cursor | undefined { /* focused cell or card */ }
  protected renderSelf(buf: OptimizedBuffer): void { /* toolbar · paintBaseTable | paintBaseBoard · hints */ }
}
```

`WindowTree` already uses only these members, so widening the type changes no behavior. Visual composition follows RM261003ABZP-UDES9@R1; the painters take a model and a rect and draw nothing outside it, so the embed painter reuses them at embed size.

- **Invariants:**
  - Painters read models only; no state change in the UI.
- **Verification Coverage:** S24; V40, V45

## `src/ui/overlays/calendar.ts`, `src/ui/shell.ts`, `src/ui/overlays/picker.ts`

- **Change:** Add / Modify
- **Decisions:** DES5, DES6
- **Requirements:** W26100423LX-REQ2@R1, W26100423LX-REQ4@R2
- **Responsibilities:** paint the calendar; paint computed picker previews
- **Affected Callers/Consumers:** `OverlayHost` (`host.ts:72-91`)
- **Construction/Wiring:** `createShell` passes `new CalendarOverlay(ctx)` in the `OverlayHost` view list
- **Dependencies:** `calendarMarks`, `PickerSource.render`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `CalendarOverlay` | None — new symbol | overlay view visible while `overlay.kind === "calendar"` | `OverlayHost` |
| picker preview painting | raw file lines (`src/ui/overlays/picker.ts:233-290`) | `source.render?.(s, item, file) ?? raw lines` | picker |

**Existing Shape:** `src/ui/overlays/host.ts:68-75`

```ts
/** Paints the one open overlay above the body. It holds one view per overlay kind; each shows itself only while its kind is open. */
export class OverlayHost extends Renderable { constructor(ctx: RenderContext, views: View[] = []) { … } }
```

**Proposed Shape:**

```ts
export class CalendarOverlay extends Renderable implements View {
  update(s: AppState): void { /* visible = s.overlay.kind === "calendar"; marks = calendarMarks(s) */ }
  cursor(): Cursor | undefined { /* selected day cell */ }
}
```

The overlay follows the existing one-view-per-kind host pattern.

- **Invariants:**
  - Fixed 36×12 size; fits 80×24.
- **Verification Coverage:** S5, S8, S24; V10, V16, V40

## `src/app/main.ts` and `test/support/state.ts`

- **Change:** Modify
- **Decisions:** DES16
- **Requirements:** W26100423LX-REQ13@R1
- **Responsibilities:** composition and its test mirror
- **Affected Callers/Consumers:** all suites using `testRegistries`
- **Construction/Wiring:** see section 5, Construction and Wiring Flow
- **Dependencies:** all new registrations

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `registries()` | `main.ts:111-136` | + base file type, editor kind, note/base commands, bindings, groups, view context, embed model, block renderer, layouts | `main()` |
| `main()` | `main.ts:241-246` registers views and painters | + `registerEditorView("base")`, `registerWidgetPainter("base")`, `readPropertyTypes` after first frame | — |
| `testRegistries` | `test/support/state.ts:41-66` | mirrors `registries()`; `layouts.register("kanban-test", boardLayout)` | tests |

**Existing Shape:** `src/app/main.ts:111-136`

```ts
function registries(): Registries {
  const fileTypes = new FileTypeRegistry(textFileType);
  for (const ft of codeFileTypes) fileTypes.register(ft);
  fileTypes.register(markdownFileType);
  …
  return { fileTypes, editorKinds: new EditorKindRegistry(), commands, bindings: [...], groups: {...}, viewContexts };
}
```

**Proposed Shape:**

```ts
  fileTypes.register(baseFileType);
  const editorKinds = new EditorKindRegistry();
  editorKinds.register(baseEditorKind);
  for (const c of [...noteCommands, ...baseCommands]) commands.register(c);
  const layouts = new BaseLayoutRegistry(tableLayout);
  if (KANBAN_TYPE !== undefined) layouts.register(KANBAN_TYPE, boardLayout);
  const embedModels = new EmbedModelRegistry();
  const reg: Registries = { fileTypes, editorKinds, commands, bindings: [..., ...noteBindings, ...baseBindings],
    groups: { ...defaultGroups, ...linkGroups, ...noteGroups }, viewContexts, embedModels, layouts };
  viewContexts.register("markdown", markdownViewContextFor(reg));
  viewContexts.register("base", (s, id) => baseViewModel(s, id, reg));
  embedModels.register("base", baseEmbedModel);
  registerBlockRenderer("base", baseEmbedRenderer);
  return reg;
```

One composition point registers everything; `testRegistries` mirrors it and adds the test-only board type so UV8 and the board cases run before the fixture exists.

- **Invariants:**
  - `KANBAN_TYPE === undefined` → no type selects the board in the app.
- **Verification Coverage:** S16, S23; V30, V43

## `test/boundaries.test.ts`

- **Change:** Modify
- **Decisions:** DES16
- **Requirements:** W26100423LX-REQ13@R1
- **Responsibilities:** declare the new `yaml` home
- **Affected Callers/Consumers:** `bun run check`
- **Construction/Wiring:** None
- **Dependencies:** None

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PACKAGE_HOMES.yaml` | `["src/core/lang/markdown/"]` (`boundaries.test.ts:51`) | `["src/core/lang/markdown/", "src/core/features/bases/"]` | boundary test |

**Existing Shape:** `test/boundaries.test.ts:51`

```ts
  yaml: ["src/core/lang/markdown/"],
```

**Proposed Shape:**

```ts
  yaml: ["src/core/lang/markdown/", "src/core/features/bases/"],
```

The `.base` file is YAML, not Markdown frontmatter, so the parser owns a direct, declared dependency.

- **Invariants:**
  - No other package home changes.
- **Verification Coverage:** S23; V43

## Migration and Delivery

- **Database or Schema Migration:** None — no database; `PersistedState` stays `version: 1` and gains no field (`session.ts:52-53`, `snapshotSession` at `session.ts:68-83`).
- **Data Backfill:** None — the index is rebuilt at every start.
- **Mixed-Version Compatibility:** Files `so` creates or patches are plain Markdown with valid frontmatter Obsidian reads (RF5); `.base` files are never written; a state file from before DI4 loads unchanged (V41).
- **Feature Flags:** `KANBAN_TYPE` in `src/core/features/bases/types.ts`, default `undefined`. Removal condition: never removed — it becomes the verified string when the user supplies the Obsidian ≥ 1.14.3 fixture, recorded in `test/fixtures/bases/README.md`, and V30 then asserts it. Verified by V30 and V33.
- **Rollout Constraints:** Kanban enablement is an open DI4 item blocking the PH2 exit until the fixture lands (pending parent synchronization item 1); everything else ships together.
- **Rollback:** Reverting the PR removes the features; no file format or state migration needs undoing, and notes created or patched stay valid.

# 8. Testing and Verification

## Design Success Criteria

| ID | Observable Success Condition | Traceability |
|---|---|---|
| `S1` | `:Today` creates `daily/<date>.md` from the expanded template with `{{title}}` = the formatted string and `{{date}}` = the note's day, and toasts the path and template | REQ1@R2; DES2, DES3, DES4 |
| `S2` | `:Yesterday`/`:Tomorrow` step from the open daily note's parsed date, else from today; a `/` format creates subfolders | REQ1@R2; DES1, DES2, DES4 |
| `S3` | An existing file (including a case variant or one appearing after the index check) is never modified; a second `:Today` leaves bytes and mtime unchanged | REQ1@R2, REQ5@R1; DES3, DES4 |
| `S4` | After open, the cursor is on the first unchecked task else at the end; missing template → `# {{date}}`; unreadable → empty note + error toast | REQ1@R2; DES3, DES4 |
| `S5` | The calendar navigates, marks existing notes from the index, announces the selection, and Enter opens or creates the day | REQ2@R1; DES5 |
| `S6` | Every supported token equals Moment 2.29.4 output; unsupported tokens stay whole; brackets and backslash escape | REQ3@R2; DES1 |
| `S7` | Expansion matches Obsidian: case-insensitive names, no trimming, empty format → default, unknown untouched, one instant | REQ3@R2; DES2 |
| `S8` | Template insertion inserts whole at 1:1, else body at cursor plus property merge, in one undo step; preview shows source then expansion | REQ4@R2; DES6, DES8 |
| `S9` | `note.new` validates the title, offers `(blank note)` first, creates at the root, opens in Insert mode, and refuses an existing name | REQ5@R1; DES6, DES3 |
| `S10` | `[daily]`/`[templates]` defaults and validation hold, including the templates-root error | REQ6@R2; DES7 |
| `S11` | `.base` resolves to file type and editor kind `base` by registration only; Alfred's ported tests pass with the corrected semantics | REQ7@R2; DES9, DES11 |
| `S12` | Candidates expose every `file.*` field including size and ctime for notes and other files; open buffers override properties | REQ7@R2; DES10 |
| `S13` | Unsupported expressions, unsupported filters, Obsidian-rejected views, and invalid YAML each produce their defined state; no key reaches vim and no `.base` write occurs | REQ7@R2; DES9, DES11 |
| `S14` | Table rows, order, sort, grouping with `groupOrder`, and the 15 default summaries match fixtures; overrides never write the file | REQ8@R2; DES9, DES12 |
| `S15` | Editor type follows `types.json` when valid, else Obsidian inference; invalid values show an inline error and `Esc` restores | REQ8@R2; DES10, DES12 |
| `S16` | With `KANBAN_TYPE` unset, a Kanban view opens as a table with the notice; with a registered type, lanes follow `groupOrder` or distinct values plus `None` | REQ9@R2; DES9, DES12 |
| `S17` | `H`/`L` write the group property (None removes it) and keep focus; formula or `file.*` grouping shows `⊘ moves off` and writes nothing | REQ9@R2; DES12, DES13 |
| `S18` | Patching preserves comments, order, quoting, line endings, and the body; adds and removes the block; writes Obsidian-typed values with quoting for ambiguous text | REQ10@R2; DES8 |
| `S19` | Open notes change in one undo step and autosave; closed notes are written only when unchanged; results toast the diff or the failure | REQ10@R2; DES13 |
| `S20` | `![[x.base]]`/`![[x.base#View]]` render read-only in live and reading views, capped with `↓ N more`, with loading and missing states | REQ11@R1; DES15 |
| `S21` | `Enter` on a base embed opens the base at that view; the browser preview still shows a link | REQ11@R1; DES15 |
| `S22` | A base window waits for the index, re-evaluates on index and `.base` changes keeping focus, and restores at its first view from a version-1 state file | REQ12@R1; DES11, DES12 |
| `S23` | V7@R2, V12@R3, V16@R2, UV3@R2 re-pass with the `base` renderer and a Base embed; the boundary test passes with the declared home | REQ13@R1; DES16 |
| `S24` | Calendar, template picker, table, and Kanban surfaces render in goldens under `NO_COLOR`, light, and 80×24 | REQ13@R1; DES5, DES14 |

## Test Suites and Cases

```text
src/ + test/
├── src/core/time/format.test.ts [Unit]
│   Purpose: Moment-subset output and tokenizer rules
│   SUT: formatDate
│   Infra: None
│   Doubles: None
│   ├── V11 2026-10-03T09:05 (Saturday) with every supported token; midnight, 00:30, 11:59, 12:00, 13:05, 23:59 for h/hh/A/a; Do for 1–31; d for Sun–Sat
│   │   ├── Expect: strings equal the research table (e.g. "dddd, MMMM Do YYYY [at] h:mm A" → "Saturday, October 3rd 2026 at 9:05 AM"; 00:00 → h "12", A "AM"; Do 11 → "11th", 22 → "22nd") [S6]
│   │   └── Unique risk: a token or edge case diverges from Moment
│   └── V12 "YYYY-[W]ww", "dd", "Q", "\\Y", "[unclosed"
│       ├── Expect: "2026-Www", "dd", "Q", "Y", and the unclosed bracket's characters emitted as tokens or literals per the tokenizer (documented expected string) [S6]
│       └── Unique risk: unsupported tokens split into supported ones ("dd" → "66")
├── src/core/time/local.test.ts [Unit]
│   Purpose: day arithmetic across month ends and DST
│   SUT: addDays, addMonthsClamped, localDateTime
│   Infra: None
│   Doubles: None
│   └── V4a addDays over 2026-03-29 (EU DST) and 2026-11-01 (US DST); addMonthsClamped 2026-01-31 +1
│       ├── Expect: consecutive dates with no skipped or repeated day; 2026-02-28 [S2]
│       └── Unique risk: DST shifts the day for :Yesterday/:Tomorrow
├── src/core/features/notes/daily.test.ts [Unit]
│   Purpose: daily paths and parsing
│   SUT: dailyPath, parseDailyDate
│   Infra: None
│   Doubles: None
│   ├── V1 YYYY-MM-DD, YYYY/MM/YYYY-MM-DD, YYYY/MMMM/YYYY-MMM-DD, folder "" and "daily"
│   │   ├── Expect: "daily/2026-10-03.md" title "2026-10-03"; "daily/2026/10/2026-10-03.md" title "2026/10/2026-10-03"; "2026/October/2026-Oct-03"; root folder has no leading "/" [S1, S2]
│   │   └── Unique risk: wrong path or title for subfolder formats
│   └── V4 parseDailyDate round-trips for the formats above; "dddd" (no date tokens) and a non-daily path
│       ├── Expect: the original date; undefined for both [S2]
│       └── Unique risk: :Yesterday steps from a wrong parsed date
├── src/core/features/notes/template.test.ts [Unit]
│   Purpose: Obsidian-exact expansion
│   SUT: expandTemplate
│   Infra: None
│   Doubles: None
│   └── V13 "{{Title}} {{ title }} {{DATE:YYYY}} {{date: YYYY}} {{date:}} {{time}} {{weather}} {{date:x}}{{date:x}}" with title "Meeting $&"
│       ├── Expect: "Meeting $& {{ title }} 2026  2026 2026-10-03 09:05 {{weather}} xx"; both {{date:x}} from the same instant [S7]
│       └── Unique risk: trimming, case, default, or replacement-pattern divergence
├── src/core/lang/markdown/frontmatter-patch.test.ts [Unit]
│   Purpose: text-level patching and typed values
│   SUT: patchFrontmatter, frontmatterValue, mergeFrontmatter, splitFrontmatter, yamlScalar
│   Infra: None
│   Doubles: None
│   ├── V34 fixture with comments, CRLF, quoted keys, block lists; set existing scalar, set existing list, add new key, remove middle key, remove last key, set on a note without frontmatter
│   │   ├── Expect: only the edited lines differ (byte comparison of the rest); last-key removal deletes the "---" block; no-frontmatter gets "---\nkey: v\n---\n"; re-parse equals input with one key changed; removed/added lines match [S18]
│   │   └── Unique risk: comment, order, or line-ending loss; YAML Obsidian rejects
│   ├── V34b yamlScalar for "42", "true", "null", "2026-10-05" as text; 42; true; date "2026-10-05"; ["a","b"]
│   │   ├── Expect: "\"42\"", "\"true\"", "\"null\"", "\"2026-10-05\"", "42", "true", "2026-10-05", block list [S18]
│   │   └── Unique risk: a text value changes type in Obsidian
│   └── V15 mergeFrontmatter note {tags:[work], status: open} with template {tags:[meeting], status: draft, owner: me}; note without frontmatter
│       ├── Expect: tags [work, meeting], status open, owner me appended; a new block created; only the frontmatter lines change [S8]
│       └── Unique risk: merge overwrites scalars or duplicates list items
├── src/core/features/bases/parser.test.ts, expression.test.ts, evaluator.test.ts [Unit]
│   Purpose: ported Alfred engine with corrections
│   SUT: parseBase, evaluateExpression, evaluateBase
│   Infra: None
│   Doubles: None
│   ├── V21 Alfred's parser, expression, and evaluator cases on test/fixtures/bases/alfred/*
│   │   ├── Expect: rows and order equal the ported expectations, with inFolder/hasTag cases updated to Obsidian semantics [S11]
│   │   └── Unique risk: port regressions
│   ├── V23 file.inFolder("Projects") on Projects/2026/a.md; file.hasTag("a","b") on #b and #a/x; status == 'todo' vs "todo"
│   │   ├── Expect: matched; matched both; same rows [S11]
│   │   └── Unique risk: silently fewer rows than Obsidian
│   └── V24 base with formula using if(); global filter status.contains('x'); view without name; groupBy "status" (string); sort with column; invalid YAML
│       ├── Expect: formula diagnostic and other columns intact; filter_hides_rows diagnostic naming the filter and zero rows; two Obsidian-rejection warnings while rendering; column sort equals property sort; parse error and no rows [S13]
│       └── Unique risk: crash, silent empty view, or unflagged incompatibility
├── src/core/features/bases/summaries.test.ts [Unit]
│   Purpose: Obsidian default summaries
│   SUT: summarize
│   Infra: None
│   Doubles: None
│   └── V26a each of the 15 names over a fixture column; "values.filter(…)" custom
│       ├── Expect: documented results (Average 2.5, Range of dates in days, Unique count, …); summary_unsupported diagnostic and empty cell [S14]
│       └── Unique risk: wrong summary values
├── src/core/features/bases/candidates.test.ts, property-types.test.ts [Unit]
│   Purpose: candidates and typing
│   SUT: candidatesFrom, propertyType, parsePropertyTypes
│   Infra: None
│   Doubles: None
│   ├── V22 index with notes and an image fact; overlay with a dirty note's scan
│   │   ├── Expect: every file.* field present for both kinds; the overlay's property value wins [S12]
│   │   └── Unique risk: missing file.* fields or stale properties
│   └── V28 types {Status: "number"} with value "x" and 3; inference cases; malformed JSON shapes
│       ├── Expect: "text" (fails validation), "number"; date/datetime/number/checkbox/list/text; {} [S15]
│       └── Unique risk: editing a number property as text
├── src/core/features/bases/table.test.ts, kanban.test.ts, views.test.ts [Unit]
│   Purpose: view models and layout resolution
│   SUT: tableModel, kanbanModel, BaseLayoutRegistry
│   Infra: None
│   Doubles: None
│   ├── V26 tasks fixture: order, sort, grouped; group-order.base with [todo, doing, done, null] and a hidden value
│   │   ├── Expect: columns in order; groups exactly the groupOrder list with None last and the hidden value absent [S14]
│   │   └── Unique risk: groups Obsidian hides appear
│   ├── V31 kanbanModel without groupOrder (DESC), with groupOrder, numeric lane values
│   │   ├── Expect: distinct values DESC plus None; groupOrder lanes including empty ones; lane keys typed numbers [S16]
│   │   └── Unique risk: wrong lanes or a string written for a numeric value
│   ├── V32 group by formula.late and by file.folder
│   │   ├── Expect: movable false with why "formula" / "file" [S17]
│   │   └── Unique risk: a move writes a derived property
│   └── V33 resolve("cards"), resolve("kanban") with KANBAN_TYPE unset, resolve("kanban-test") after register
│       ├── Expect: table + notice "cards view is not supported yet; showing a table"; table + notice; board [S16]
│       └── Unique risk: Kanban reachable before the fixture
├── src/core/features/bases/embed.test.ts [Unit]
│   Purpose: base embed renderer through livePreview
│   SUT: baseEmbedRenderer
│   Infra: None
│   Doubles: PreviewCtx stub (embedModel returns a model, "loading", "missing", or a non-model)
│   └── V38 note "![[tasks.base#Board]]" at width 80 with each stub answer; model with 30 rows and embedMaxRows 10
│       ├── Expect: widget {type:"base", rows: header+10+1} with "↓ 20 more"; loading rows min(10,3); missing → title + notice; non-model → missing; source view shows raw text [S20]
│       └── Unique risk: embed floods the note or crashes on bad data
├── src/core/state/note-commands.test.ts [Unit]
│   Purpose: daily, insertion, and new-note reducers
│   SUT: noteCommands, onNoteCreated, insertTemplate, submitNewNote
│   Infra: None
│   Doubles: None (pure reducers with testRegistries)
│   ├── V2 index without the note → :Today effects; index with "Daily/2026-10-03.MD" → open that path
│   │   ├── Expect: one createNote {path "daily/2026-10-03.md", template "templates/daily.md", fallback "# {{date}}", vars.title "2026-10-03", then "firstTask"}; a read of the case variant, no createNote [S1, S3]
│   │   └── Unique risk: case variants duplicated on Linux
│   ├── V8 noteCreated created/exists (daily) → buffer loaded with "- [x] a\n- [ ] b" → cursor; then "insert" → mode insert at EOF; template "unreadable" → error toast
│   │   ├── Expect: cursor line 1 col 6; insert mode at end; error toast names the template [S4]
│   │   └── Unique risk: wrong placement or silent template failure
│   ├── V14 insertTemplate at 0:0 and mid-note with template frontmatter; then u
│   │   ├── Expect: whole text at 0:0; body at cursor and merged properties otherwise; one undo entry restores the text exactly [S8]
│   │   └── Unique risk: second frontmatter block in the body; multi-step undo
│   └── V17 newNote prompt values "", "../x", "/x", "a/b"; noteCreated exists (reason new)
│       ├── Expect: invalid set for the first three; "a/b.md" preview; error toast "E13: File exists (a/b.md)" and no open [S9]
│       └── Unique risk: creating outside the workspace or opening an existing note as new
├── src/core/state/calendar.test.ts [Unit]
│   Purpose: calendar transitions and marks
│   SUT: openCalendar, calendarKey, calendarMarks
│   Infra: None
│   Doubles: None
│   └── V9 open on 2026-10-03; l, j, H from 2026-03-31, L, t, Esc, Enter; index with daily/2026-10-01.md and 2026-10-02.md
│       ├── Expect: 10-04, 10-11, 2026-02-28, month follows, back to 10-03, overlay none, createNote for the selected day; marks {1,2}; message "Sat 2026-10-03 · no note" [S5]
│       └── Unique risk: wrong navigation or marks
├── src/core/state/base-model.test.ts [Unit]
│   Purpose: derivation, focus, waiting, memo
│   SUT: baseViewModel
│   Infra: None
│   Doubles: None
│   ├── V41 index idle and empty → waiting; batch arrives → rows; candidate note changes → same focus path; .base text changes (view renamed) → first view; state file from before DI4 with a base window
│   │   ├── Expect: status "waiting"; status "ok"; focus row follows the path; selected view name falls back; window restored at first view [S22]
│   │   └── Unique risk: stale or jumping focus; restore failure
│   └── V42 two frames with no relevant change; a keystroke in an unrelated non-candidate buffer
│       ├── Expect: identical model object (memo hit) both times [S22]
│       └── Unique risk: re-evaluation per keystroke
├── src/core/state/base-commands.test.ts [Unit]
│   Purpose: base keys, cell editor, moves, overrides
│   SUT: baseCommands, cellEditKey, moveCard
│   Infra: None
│   Doubles: None
│   ├── V27 s, g, f on the tasks base; i on file.name and formula cells
│   │   ├── Expect: kindState changes only; no effect touches tasks.base; read-only explanation message [S14]
│   │   └── Unique risk: overrides written to the file
│   ├── V29 i on a number cell: Ctrl-a ×2, Enter; date cell Ctrl-x; "abc" in number + Enter; Esc
│   │   ├── Expect: writeProperty value 5 (from 3); previous day; edit.error set, no effect; edit dropped [S15]
│   │   └── Unique risk: invalid values written
│   └── V25 every printable key in a base window outside bindings; :w on the base buffer; deleted-on-disk base + :w
│       ├── Expect: no text change, no write effect, "read-only file" message [S13]
│       └── Unique risk: .base YAML edited or recreated
├── src/core/state/base-write.test.ts [Unit]
│   Purpose: write routing and result handling
│   SUT: writeProperty, onFrontmatterPatched
│   Infra: None
│   Doubles: None
│   ├── V35 note open and dirty elsewhere in the body; note closed
│   │   ├── Expect: buffer edited with one undo entry, autosave scheduled, diff toast; one patchFrontmatter effect with expected value [S19]
│   │   └── Unique risk: unsaved edits overwritten or the wrong path chosen
│   └── V37 frontmatterPatched ok / failed
│       ├── Expect: index summary updated and toast "- status: todo / + status: doing"; error toast, index unchanged [S19]
│       └── Unique risk: view shows a value not on disk
├── src/core/state/embed-models.test.ts [Unit]
│   Purpose: registry and embed loading
│   SUT: EmbedModelRegistry, syncEmbeds, markdownViewContext.embedModel
│   Infra: None
│   Doubles: None
│   └── V39 note embedding tasks.base and a .csv with no builder; followLink on the embed line
│       ├── Expect: one read{embed:true} for tasks.base only; embedModel "loading" then a model; goTo with subpath "#Board" and the window's kindState.view "Board" after load [S20, S21]
│       └── Unique risk: base targets never load; Enter opens the wrong view
├── src/core/config/schema.test.ts [Unit]
│   Purpose: new config sections
│   SUT: parseConfig, ConfigSchema
│   Infra: None
│   Doubles: None
│   └── V19 absent sections; folder "/abs"; template "../x"; format ""; templates.folder "." and ""; [daily] unknown key
│       ├── Expect: defaults; one line-numbered error each [S10]
│       └── Unique risk: paths outside the workspace accepted
├── test/integration/notes.test.ts [Integration]
│   Purpose: create-from-template through the real runner and file system
│   Real: createUpdate, createEffectRunner, createExclusive, readTextFile
│   Infra: tmp workspace on the real file system; TZ=UTC; fixed now
│   Doubles: None
│   ├── V5 :Today twice
│   │   ├── Expect: file created with the expanded template; second run: same bytes and mtime, no write [S1, S3]
│   │   └── Unique risk: daily note overwritten
│   ├── V3 file created by the test between the index check and createNote; case-variant file on a case-insensitive volume when available
│   │   ├── Expect: noteCreated exists; original bytes unchanged; buffer opened [S3]
│   │   └── Unique risk: race clobbers a note
│   ├── V6 template missing; template is a binary file; parent folder read-only
│   │   ├── Expect: "# 2026-10-03"; empty note + error toast; noteCreated failed with no temp file left [S4, S3]
│   │   └── Unique risk: fallback, refusal, or temp leak
│   ├── V7 :Yesterday from daily/2026/10/2026-10-03.md with format YYYY/MM/YYYY-MM-DD; log file content
│   │   ├── Expect: daily/2026/10/2026-10-02.md with {{date}} "2026-10-02"; notes.created line with path only [S2]
│   │   └── Unique risk: wrong day or note text in logs
│   └── V18 <leader>nn "Meeting" → (blank note); again with templates/meeting.md
│       ├── Expect: Meeting.md empty in Insert mode; second attempt → E13 toast and file unchanged [S9]
│       └── Unique risk: new-note flow overwrites
├── test/integration/bases-write.test.ts [Integration]
│   Purpose: closed-note write-back through the serial queue
│   Real: createUpdate, createEffectRunner, atomicWrite, patchFrontmatter
│   Infra: tmp workspace
│   Doubles: None
│   └── V36 move a card on a closed note; change the note's status on disk first, then move
│       ├── Expect: file has only the status line changed and its comment kept; second: frontmatterPatched ok:false "changed on disk", file unchanged, view shows the disk value [S19]
│       └── Unique risk: clobbering an external edit
├── test/ui/notes.golden.test.ts [Component]
│   Purpose: DI4 notes surfaces
│   Real: shell with OpenTUI test renderer
│   Infra: None
│   Doubles: None
│   ├── V10 calendar at 80×24, color, NO_COLOR, light; selection on a marked day
│   │   ├── Expect: goldens match; • glyph and underline present without colour [S5, S24]
│   │   └── Unique risk: calendar illegible or overflowing
│   └── V16 template picker at 120 and 90 columns; Tab at 90
│       ├── Expect: preview with source then "▸" and expansion at 120; hidden at 90 and shown after Tab [S8, S24]
│       └── Unique risk: preview missing or wrong
├── test/ui/bases.golden.test.ts [Component]
│   Purpose: table and Kanban surfaces
│   Real: shell, BaseView, painters; testRegistries with kanban-test
│   Infra: None
│   Doubles: None
│   ├── V40 tasks.base table (focused cell), kanban-test board (focused card), at 80×24, NO_COLOR, light; waiting and empty states
│   │   ├── Expect: goldens match the accepted states; hardware cursor on the focused cell/card [S24]
│   │   └── Unique risk: UV8/UV10 regressions
│   └── V45 ⊘ moves off board and a cards view fallback notice
│       ├── Expect: toolbar notices present in goldens [S16, S17, S24]
│       └── Unique risk: notices not shown
├── test/ui/live-preview.test.ts [Component] (existing suite)
│   └── V46 tour.md goldens with ![[tasks.base#All tasks]] at widths 60 and 100
│       ├── Expect: updated goldens include the base embed; other elements unchanged [S23]
│       └── Unique risk: the base renderer disturbs V7@R2 layouts
└── Non-test verification
    ├── V43 Type/build check and boundaries: bun run check (biome, tsc, knip, unit suites, test/boundaries.test.ts) and bun run test:ci
    │   ├── Expect: zero findings; boundary test passes with the yaml home declared; V16@R2 extension suite (test/ui/extension.test.ts) passes unchanged; check < 30 s, CI < 3 min [S23]
    │   └── Unique risk: contract or layering mismatch; registration-only regression
    ├── V44 Benchmark: bun run bench with the base embed in the live note
    │   ├── Expect: liveKeystrokeP95 median within the 2× gate of 24 ms; other targets unchanged [S23]
    │   └── Unique risk: embed evaluation regresses typing
    ├── V30 Kanban fixture: test/fixtures/bases/obsidian-kanban.base + README provenance (pending until the user supplies it)
    │   ├── Expect: when present, parseBase(fixture).views[0].type === KANBAN_TYPE and the README records version, installer, OS, date, steps, and no community Kanban plugin; until then the case is recorded as pending and KANBAN_TYPE stays undefined [S16]
    │   └── Unique risk: Kanban ships with an unverified type
    ├── V20 Obsolete-reference check: rg "\.base" src/core/kernel src/core/state src/ui src/app
    │   ├── Expect: no match outside src/core/features/bases and test fixtures [S11]
    │   └── Unique risk: a .base special case outside its registration
    ├── Migration: None — no schema or state migration (V41 covers the version-1 state file)
    ├── Configuration: covered by V19
    └── Observability: covered by V7 (notes.created) and V37/V36 (bases.patched via the runner log assertion in V36)
```

## Coverage Balance

Pure logic (formatter, expansion, paths, patching, evaluation, models, reducers) is proven at the unit level, where every edge case is cheap and deterministic. Integration tests exist only where the real file system adds a distinct risk: exclusive creation races and template reads (V3, V5, V6, V7, V18) and the closed-note read-check-write (V36). Component goldens prove the surfaces the UI baseline requires (V10, V16, V40, V45, V46) without repeating model logic. The benchmark and the boundary and type checks are non-test verification. V30 is the one case that cannot pass until the user supplies the Obsidian fixture; it is explicit rather than hidden.

## Test Quality Rules

- **Unit:** Verify one public behavior or invariant per case; keep it deterministic and isolated; use doubles only at true boundaries; assert outputs or meaningful side effects. Do not test private methods, mock every collaborator, duplicate implementation logic, or assert internal call order unless order is contractual.
- **Integration/Contract:** Verify real collaboration, wiring, or boundary behavior; keep the components under examination real and list any actual database, queue, cache, filesystem, or external service under `Infra`. Replace only slow or external dependencies when necessary and list them under `Doubles`. Verify serialization, persistence, registration, transactions, and error translation only when applicable; assert observable results or durable side effects; keep setup and cleanup deterministic.
- **Non-test:** Type/build and boundary checks (V43), benchmark (V44), Kanban fixture provenance (V30), and the obsolete-reference search (V20). Migration: None — no migration exists. Configuration and observability are proven by test cases V19, V7, and V36.

# 9. Finalized Design Decisions

## W26100423LX-DES1: Shared Moment-subset formatter over local calendar fields

**Question:** How are dates formatted identically to Obsidian without a Moment dependency, and how do tests stay timezone-independent?

**Decision:** `src/core/time/format.ts` `formatDate(LocalDateTime, format)` tokenizes with Moment 2.29.4's full display-token table (longest match), handles `[literal]` and backslash escapes, renders the supported tokens with Moment's `en` rules, and emits every other token whole. `src/core/time/local.ts` converts an instant to local fields once and does day and month arithmetic on fields with `Date.UTC`.

**Requirements Addressed:** W26100423LX-REQ3@R2, W26100423LX-REQ1@R2, W26100423LX-REQ2@R1

**Research Support:** RF9 evaluated `W26100423LX-REQ3@R1` and informed `W26100423LX-REQ3@R2` (greedy full-token tokenization, verified outputs).

**Rationale:** One small pure formatter serves daily paths, templates, and Bases date cells (RM261003ABZP-DES11@R1); knowing every Moment token is what makes "unsupported stays literal" well defined; taking fields keeps unit tests free of `TZ`.

**Code Impact:**

- `src/core/time/format.ts` — `formatDate`, `MOMENT_TOKENS` — new
- `src/core/time/local.ts` — `LocalDateTime`, `localDateTime`, `addDays`, `addMonthsClamped`, `withDate` — new

**Detailed Design:** section 7 `src/core/time/local.ts`, `src/core/time/format.ts`

**Tradeoffs:**

- `en` only; rejected Moment/Day.js (maintenance mode, weight, RM261003ABZP-DES11@R1).
- The token table must track Moment's list; it is fixed because Obsidian pins Moment 2.29.4.

**Success Criteria:** S2, S5, S6

**Verification Impact:**

- V11, V12 (`format.test.ts`): exact strings from the research; unsupported tokens whole. V4a (`local.test.ts`): no skipped day across DST.

## W26100423LX-DES2: Daily paths, date parsing, and Obsidian-exact template expansion

**Question:** How are daily paths computed and parsed, and how is a template expanded so the text matches Obsidian?

**Decision:** `dailyPath` formats the day with `[daily] format`, trims it, and joins it to the folder; `{{title}}` is the formatted string. `parseDailyDate` parses the format's date tokens back and accepts the result only if `dailyPath` reproduces the path. `expandTemplate` copies Obsidian's `{{title}}` (`gi`) then `/{{(date|time)(?::(.*?))?}}/gi` passes with one instant; daily notes for another day pass the target date with the current wall time.

**Requirements Addressed:** W26100423LX-REQ1@R2, W26100423LX-REQ3@R2, W26100423LX-REQ4@R2, W26100423LX-REQ5@R1

**Research Support:** RF6 evaluated `W26100423LX-REQ3@R1` and informed `W26100423LX-REQ3@R2`; RF7 evaluated `W26100423LX-REQ1@R1` and informed `W26100423LX-REQ1@R2`.

**Rationale:** Copying the shipped regexes is the only way to guarantee identical text; the round-trip check makes date parsing safe for any format.

**Code Impact:**

- `src/core/features/notes/daily.ts` — `DailyConfig`, `dailyPath`, `parseDailyDate` — new
- `src/core/features/notes/template.ts` — `TemplateVars`, `expandTemplate`, `BUILTIN_DAILY_TEMPLATE` — new

**Detailed Design:** section 7 `src/core/features/notes/daily.ts`, `template.ts`

**Tradeoffs:**

- Formats without year, month, and day tokens cannot be parsed, so `:Yesterday` falls back to today for them.
- `$&` in a title is inserted literally, unlike Obsidian's quirk (RF6 says it need not be copied).

**Success Criteria:** S1, S2, S7

**Verification Impact:**

- V1, V4 (`daily.test.ts`); V13 (`template.test.ts`): Obsidian's no-trim and case rules.

## W26100423LX-DES3: Exclusive create-from-template effect

**Question:** How is a note created from a template so it never overwrites an existing entry and the reducer learns whether it was created?

**Decision:** A `createNote` effect carries the path, optional template path, fallback text, variables, placement, and reason. The runner, inside the serial queue, reads the template (`used`/`missing`/`unreadable`), expands it, and calls `createExclusive`, which writes a private temp file, fsyncs, and publishes it with `link()` (EEXIST → `exists`; no hard links → `wx` fallback). It answers `noteCreated`.

**Requirements Addressed:** W26100423LX-REQ1@R2, W26100423LX-REQ5@R1

**Research Support:** None

**Rationale:** Reading the template inside the adapter avoids the buffer-creating `read` effect (which would show the template, `buffers.ts:410-411`) and makes read-expand-create one ordered operation; `link()` is the standard atomic exclusive publish; this realizes the phase's `createExclusive` shape without changing its never-overwrite rule.

**Code Impact:**

- `src/workspace/fs.ts` — `createExclusive` — new
- `src/app/effects.ts` — `createNote` case — new
- `src/core/state/types.ts` — `Effect.createNote`, `Action.noteCreated` — new

**Detailed Design:** section 7 `src/workspace/fs.ts`, `src/app/effects.ts`, `src/core/state/types.ts`

**Tradeoffs:**

- The `wx` fallback is exclusive but not crash-atomic on file systems without hard links.
- Rejected extending the explorer `create` FsOp: its result path relists explorer folders and cannot carry template outcome or placement.

**Success Criteria:** S1, S3, S4, S9

**Verification Impact:**

- V3, V5, V6, V18 (`test/integration/notes.test.ts`): no overwrite, fallback, refusal, no temp leak.

## W26100423LX-DES4: Note commands, bindings, and open-after-create placement

**Question:** Where do the notes commands live, how do they decide between open and create, and how is the cursor placed afterwards?

**Decision:** `src/core/state/note-commands.ts` registers `note.today`, `note.yesterday`, `note.tomorrow`, `note.pickDate`, `note.new`, and Markdown-scoped `template.insert`, with `<leader>nd/np/nn/nt`, the `<leader>n` "notes" group, and Ex aliases `Today`, `Yesterday`, `Tomorrow`. `openDaily` opens a case-insensitive index match or emits `createNote`; `onNoteCreated` opens daily notes on `created` or `exists`, refuses existing new notes, and passes `AfterOpen` through `openPath` to `placeAfterOpen`.

**Requirements Addressed:** W26100423LX-REQ1@R2, W26100423LX-REQ2@R1, W26100423LX-REQ5@R1

**Research Support:** RF7 evaluated `W26100423LX-REQ1@R1` and informed `W26100423LX-REQ1@R2` (case-insensitive existence check).

**Rationale:** Commands read `AppState`, so they belong in `core/state` (DI3 precedent); `AfterOpen` reuses the restore-pending path that already places cursors after reads.

**Code Impact:**

- `src/core/state/note-commands.ts` — `noteCommands`, `noteBindings`, `noteGroups`, `openDaily`, `onNoteCreated`, `findPathInsensitive`, `placeAfterOpen` — new
- `src/core/state/commands.ts` — `EX_ALIASES` — three entries
- `src/core/state/buffers.ts` — `openPath` options; `src/core/state/session.ts` — `fillRestored` applies `then`

**Detailed Design:** section 7 `src/core/state/note-commands.ts`, `src/core/state/types.ts`, `src/core/state/update.ts` (group)

**Tradeoffs:**

- Command module location differs from the phase design's `features/notes/commands.ts` (refinement 1).

**Success Criteria:** S1, S2, S3, S4

**Verification Impact:**

- V2, V8 (`note-commands.test.ts`); V5, V7 (integration).

## W26100423LX-DES5: Calendar overlay

**Question:** How is the calendar picker modeled and painted?

**Decision:** A new `Overlay` variant `calendar` holds `CalendarState`; `calendarKey` (pure) handles `h/j/k/l/H/L/t/Esc/Enter` and the message-line announcement; `calendarMarks` derives marks from `dailyPath` and the index; `CalendarOverlay` in `src/ui/overlays/` paints the accepted 36×12 component.

**Requirements Addressed:** W26100423LX-REQ2@R1, W26100423LX-REQ13@R1

**Research Support:** None

**Rationale:** Overlays already take keys first (`keys.ts:66-80`) and the host holds one view per kind (`host.ts:68-94`), so the calendar fits both patterns without new infrastructure.

**Code Impact:**

- `src/core/state/calendar.ts` — new; `src/core/state/keys.ts` — `routeKey` case; `src/ui/overlays/calendar.ts` — new; `src/ui/shell.ts` — host view list

**Detailed Design:** section 7 `src/core/state/calendar.ts`, `src/ui/overlays/calendar.ts`

**Tradeoffs:**

- Monday-first only (configurable week start excluded by DI4).

**Success Criteria:** S5, S24

**Verification Impact:**

- V9 (`calendar.test.ts`); V10 (`notes.golden.test.ts`).

## W26100423LX-DES6: Template pickers, insertion with property merge, and the new-note prompt

**Question:** How are templates picked, previewed, and inserted, and how does the new-note prompt work without an explorer operation?

**Decision:** `PickerSource` gains a generic `render(s, item, file)` hook and `previewAlways`; sources `templates` and `newNoteTemplates` list `.md` files under `[templates] folder` from the index. `insertTemplate` inserts the whole expansion at 1:1, else the body at the cursor plus `mergeFrontmatter` edits, applied together by `applyBufferEdits` (one undo step). `PromptState` becomes a union with `newNote: true`; `promptKey` routes such prompts to `submitNewNote`, which opens `newNoteTemplates` with `(blank note)` first.

**Requirements Addressed:** W26100423LX-REQ4@R2, W26100423LX-REQ5@R1, W26100423LX-REQ13@R1

**Research Support:** RF8 evaluated `W26100423LX-REQ4@R1` and informed `W26100423LX-REQ4@R2` (property merge).

**Rationale:** A render hook keeps the picker painter language-neutral; reusing `applyBufferEdits` gives the single undo step for free; the prompt union keeps every explorer prompt untouched.

**Code Impact:**

- `src/core/state/picker.ts` — `PickerSource`, `pickerSources` — modified
- `src/core/state/note-commands.ts` — `insertTemplate`, `startNewNote`, `submitNewNote` — new
- `src/core/state/types.ts` — `PromptState`; `src/core/state/explorer.ts` — `promptKey`; `src/ui/overlays/{picker,prompt}.ts`

**Detailed Design:** section 7 `src/core/state/picker.ts`, `src/core/state/note-commands.ts`, `src/core/state/explorer.ts`

**Tradeoffs:**

- Accepting before the preview file loads shows "loading template…" instead of waiting automatically (the load takes milliseconds).

**Success Criteria:** S8, S9, S24

**Verification Impact:**

- V14, V17 (`note-commands.test.ts`); V16 (`notes.golden.test.ts`); V18 (integration).

## W26100423LX-DES7: `[daily]` and `[templates]` configuration

**Question:** How are the new settings declared and validated?

**Decision:** `ConfigSchema` gains strict `daily` (`folder` default `daily`, may be root; `format` non-empty default `YYYY-MM-DD`; `template` default `templates/daily.md`) and `templates` (`folder` default `templates`, not root) using a shared `workspacePath` refinement with `prefault({})`.

**Requirements Addressed:** W26100423LX-REQ6@R2

**Research Support:** RF8 evaluated `W26100423LX-REQ6@R1` and informed `W26100423LX-REQ6@R2` (templates root refused).

**Rationale:** Same pattern as `preview` (`schema.ts:33-39`); errors reuse `parseConfig`'s line mapping.

**Code Impact:**

- `src/core/config/schema.ts` — `ConfigSchema`, `workspacePath`

**Detailed Design:** section 7 `src/core/config/schema.ts`

**Tradeoffs:**

- Paths are validated syntactically; existence is checked at use (missing template → fallback).

**Success Criteria:** S10

**Verification Impact:**

- V19 (`schema.test.ts`).

## W26100423LX-DES8: Text-level frontmatter patcher

**Question:** How is one frontmatter key changed without losing comments, order, or quoting, for both buffers and files?

**Decision:** `src/core/lang/markdown/frontmatter-patch.ts` locates a key with `yaml`'s source ranges and splices only its value region (or appends or deletes its lines), adds a block when missing, removes the block when the last key goes, renders values with `yamlScalar` (Obsidian-typed, quoting ambiguous text), and returns span edits, new text, and diff lines. `mergeFrontmatter` and `splitFrontmatter` serve template insertion.

**Requirements Addressed:** W26100423LX-REQ10@R2, W26100423LX-REQ4@R2

**Research Support:** RF5 evaluated `W26100423LX-REQ10@R1` and informed `W26100423LX-REQ10@R2` (type inference, write forms, block removal, Alfred's patcher unsuitable).

**Rationale:** Both Obsidian's writer and Alfred's re-serialize the whole block; span splicing is the only way to keep user text byte-identical. Returning span edits lets buffers reuse `applyBufferEdits`.

**Code Impact:**

- `src/core/lang/markdown/frontmatter-patch.ts` — new

**Detailed Design:** section 7 `src/core/lang/markdown/frontmatter-patch.ts`

**Tradeoffs:**

- Flow-style values are replaced as a whole value region (their internal formatting is not preserved beyond the edited key).

**Success Criteria:** S8, S18

**Verification Impact:**

- V34, V34b, V15 (`frontmatter-patch.test.ts`).

## W26100423LX-DES9: Ported Bases engine with Obsidian corrections, view-type registry, and the Kanban gate

**Question:** How is the Bases engine brought into `so`, corrected where Obsidian differs, and how is Kanban gated?

**Decision:** Port Alfred's types, parser, expression, and evaluator into `src/core/features/bases/` with: `file.inFolder` including subfolders, `file.hasTag` matching any argument and nested tags, single-quoted strings, a `filter_hides_rows` diagnostic, Obsidian-rejection warnings, legacy `sort[].column`, `groupOrder` pass-through, and Obsidian's 15 default summaries. `BaseLayoutRegistry` resolves view types with the table fallback and notice. `KANBAN_TYPE: string | undefined = undefined`; `registries()` registers the board only when defined. `yaml` gains `src/core/features/bases/` as a declared home.

**Requirements Addressed:** W26100423LX-REQ7@R2, W26100423LX-REQ8@R2, W26100423LX-REQ9@R2

**Research Support:** RF3 and RF4 evaluated `W26100423LX-REQ7@R1` and informed `W26100423LX-REQ7@R2`; RF3 evaluated `W26100423LX-REQ8@R1` and informed `W26100423LX-REQ8@R2` (summaries); RF1 and RF2 evaluated `W26100423LX-REQ9@R1` and informed `W26100423LX-REQ9@R2`.

**Rationale:** The port gives tested semantics (RM261003ABZP-DES12@R2); the corrections add no syntax, so the subset boundary holds; a typed-optional constant and a registry make the gate one line in the composition root with no dead code.

**Code Impact:**

- `src/core/features/bases/{types,parser,expression,evaluator,summaries,views}.ts` — new
- `test/boundaries.test.ts` — `PACKAGE_HOMES.yaml`

**Detailed Design:** section 7 `src/core/features/bases/types.ts …`, `table.ts, kanban.ts, views.ts`, `test/boundaries.test.ts`

**Tradeoffs:**

- Expressions Obsidian supports beyond the subset (methods, `if`, `today`) stay diagnostics; widening needs a return to design.
- Kanban stays unreachable in the app until the user supplies the fixture (pending parent synchronization item 1).

**Success Criteria:** S11, S13, S14, S16

**Verification Impact:**

- V21, V23, V24 (engine tests); V26a (summaries); V33 (layouts); V30 (fixture, pending).

## W26100423LX-DES10: Bases candidates and property types

**Question:** Where do candidates' `file.*` fields and property types come from?

**Decision:** `NoteSummary` gains `size` and `ctime` (from the stamp and `readTextFile`'s new `createdMs`); the worker stats non-note files into `FileFacts` stored in `NoteIndex.facts`; `candidatesFrom` builds one candidate per indexed file, overriding properties from dirty open Markdown buffers. `.obsidian/types.json` is read by a `readPropertyTypes` effect after the first frame and whenever a base window is created, stored in `IndexState.types`, and applied by `propertyType` with Obsidian's inference fallback.

**Requirements Addressed:** W26100423LX-REQ7@R2, W26100423LX-REQ8@R2

**Research Support:** RF5 evaluated `W26100423LX-REQ8@R1` and informed `W26100423LX-REQ8@R2` (types.json and inference).

**Rationale:** The index already holds everything else Bases needs; dot folders are hidden from the walker and watcher (`ignore.ts:12-14`), so a dedicated read is the simplest correct source for `types.json`; no new top-level state field is needed.

**Code Impact:**

- `src/core/features/links/{summarize,note-index}.ts`, `src/workspace/{index-worker,fs,property-types}.ts`, `src/core/features/bases/{candidates,property-types}.ts`, `src/core/state/{types,index}.ts`, `src/app/effects.ts`

**Detailed Design:** section 7 `src/core/features/bases/property-types.ts, candidates.ts`, `src/core/features/links/…`, `src/workspace/property-types.ts`

**Tradeoffs:**

- `types.json` edits made in Obsidian while a base window stays open are seen when the next base window opens, not live.
- One extra `stat` per non-note file during the scan.

**Success Criteria:** S12, S15

**Verification Impact:**

- V22, V28 (unit).

## W26100423LX-DES11: `base` file type, per-window editor-kind state, read-only buffers, and key routing

**Question:** How does a `.base` file become a Bases window with its own state, and how is it guaranteed never to be edited or written?

**Decision:** Register `baseFileType` (`.base`, editor `base`, one read-only view, `readOnly: true`) and `baseEditorKind`. `EditorKindSpec.open` gains `subpath`, and `syncEditorKinds` calls it when a window's kind becomes non-text, storing the result in `WindowState.content.kindState`. `BufferState.readOnly` (from the file type) closes `writable` and the recreate branch of `writeBuffer`. `bindingOrVim` drops unbound keys for any non-text editor kind instead of calling `runVim`.

**Requirements Addressed:** W26100423LX-REQ7@R2, W26100423LX-REQ12@R1

**Research Support:** None

**Rationale:** Uses the existing registry seams (`registry.ts:16-43`, `update.ts:67-85`) with generic additions a future notebook kind can reuse; one save gate and one key rule make the never-write guarantee structural.

**Code Impact:**

- `src/core/filetypes/registry.ts`, `src/core/features/bases/file-type.ts`, `src/core/state/{update,keys,save,buffers,session,types}.ts`

**Detailed Design:** section 7 `src/core/filetypes/registry.ts and …file-type.ts`, `src/core/state/update.ts, keys.ts, save.ts, …`

**Tradeoffs:**

- Users cannot edit `.base` YAML in `so` (DI4 exclusion); viewing its source would need a later source view.

**Success Criteria:** S11, S13, S22

**Verification Impact:**

- V20 (search), V25 (`base-commands.test.ts`), V41 (`base-model.test.ts`).

## W26100423LX-DES12: Table and Kanban view models and base commands

**Question:** How are table and Kanban views modeled, navigated, and edited from the keyboard?

**Decision:** `tableModel` and `kanbanModel` (ported board rules, `groupOrder` exact, typed lane keys, `movable`) are built by `BaseLayout`s from the evaluation and the window's in-memory overrides. `baseViewModel` derives the model per window and memoizes it on input identities, keeping focus by note path. `base-commands.ts` binds base-scoped keys, runs the cell-editor sub-state (validation, `Ctrl-a`/`Ctrl-x`, `Esc`), switches views, and moves cards.

**Requirements Addressed:** W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ12@R1

**Research Support:** RF2 evaluated `W26100423LX-REQ8@R1` and `W26100423LX-REQ9@R1` and informed `W26100423LX-REQ8@R2` and `W26100423LX-REQ9@R2` (`groupOrder`).

**Rationale:** Deriving instead of storing keeps views truthful after any edit; the memo protects frame time; the sub-state mirrors the prompt overlay pattern.

**Code Impact:**

- `src/core/features/bases/{table,kanban}.ts`, `src/core/state/{base-model,base-commands}.ts`, `src/core/state/picker.ts` (`baseViews`)

**Detailed Design:** section 7 `table.ts, kanban.ts, views.ts`, `src/core/state/base-model.ts`, `src/core/state/base-commands.ts`

**Tradeoffs:**

- `file.folder` grouping stays non-movable even though Obsidian ≥ 1.14.2 moves files (RF2).

**Success Criteria:** S14, S15, S16, S17, S22

**Verification Impact:**

- V26, V27, V29, V31, V32, V41, V42.

## W26100423LX-DES13: Frontmatter write-back through the buffer or the serial queue

**Question:** How does a property edit reach an open or closed note safely?

**Decision:** `writeProperty` patches an open listed buffer's text and applies the span edits with `applyBufferEdits` (one undo step, autosave); for a closed note it emits `patchFrontmatter { path, patch, expected }`, whose runner case re-reads the file in the serial queue, refuses when `frontmatterValue` differs from `expected`, patches, and writes with the read stamp. `onFrontmatterPatched` updates the index with `summarizeWritten` and toasts the diff, or toasts the failure.

**Requirements Addressed:** W26100423LX-REQ10@R2, W26100423LX-REQ9@R2

**Research Support:** RF5 evaluated `W26100423LX-REQ10@R1` and informed `W26100423LX-REQ10@R2`.

**Rationale:** The main thread has no text for closed notes, so the patch must be computed against current disk text where the write happens; the expected-value check is the semantic equivalent of `applyEdits`' span check and reuses the same queue, own-op tracking, and stamp.

**Code Impact:**

- `src/core/state/base-write.ts` — new; `src/app/effects.ts` — `patchFrontmatter` case; `src/core/state/types.ts` — messages

**Detailed Design:** section 7 `src/core/state/base-write.ts`, `src/app/effects.ts`

**Tradeoffs:**

- Rejected reusing `applyEdits` with precomputed spans: spans need the closed note's text, which only the worker caches.

**Success Criteria:** S17, S19

**Verification Impact:**

- V35, V37 (unit); V36 (integration).

## W26100423LX-DES14: Window views by interface and the Bases view

**Question:** How does a non-text window get its own UI view?

**Decision:** `src/ui/editors/registry.ts` types factories as returning `WindowView` (`Renderable` plus `show` and `cursor`); `EditorView` implements it unchanged; `BaseView` implements it by reading `reg.viewContexts.build("base", …)` and painting with `paintBaseTable`/`paintBaseBoard` from `src/ui/widgets/base.ts`.

**Requirements Addressed:** W26100423LX-REQ8@R2, W26100423LX-REQ9@R2, W26100423LX-REQ12@R1, W26100423LX-REQ13@R1

**Research Support:** None

**Rationale:** `WindowTree` already uses only these members (`window-tree.ts:84-111`); widening the type is the minimal change that lets a second kind register (RM261003ABZP-DES10@R2 `editorViews.base`).

**Code Impact:**

- `src/ui/editors/{registry,text-view,base-view}.ts`, `src/ui/views/window-tree.ts`, `src/ui/widgets/base.ts`

**Detailed Design:** section 7 `src/ui/editors/registry.ts, …`

**Tradeoffs:**

- Visual details follow the accepted UI baseline; no new UI discussion is needed for the technical seam.

**Success Criteria:** S24

**Verification Impact:**

- V40, V45 (`bases.golden.test.ts`).

## W26100423LX-DES15: Base embeds through an embed-model registry

**Question:** How does `![[x.base#View]]` get the base's evaluated rows into the Markdown renderer without the Markdown layer knowing Bases?

**Decision:** A per-file-type `EmbedModelRegistry` in `core/state` answers a new `PreviewCtx.embedModel(path, subpath)`; `syncEmbeds` loads targets whose file type has a builder as unlisted buffers; `baseEmbedRenderer` (registered for render key `base` from `features/bases`) emits a `base` widget capped by `embedMaxRows`; `paintBaseEmbed` reuses the table and board painters; `followLink` passes the subpath so `Enter` opens the base at that view. `renderHtml` keeps the link.

**Requirements Addressed:** W26100423LX-REQ11@R1

**Research Support:** None

**Rationale:** Mirrors `ViewContextRegistry`; keeps `lang/markdown` free of Bases imports; reuses the unlisted-buffer lifecycle DI3 built (`embeds.ts:27-90`).

**Code Impact:**

- `src/core/state/{embed-models,embeds,markdown-view,jumps,link-commands}.ts`, `src/core/lang/markdown/live-preview.ts`, `src/core/features/bases/embed.ts`, `src/ui/widgets/base.ts`

**Detailed Design:** section 7 `src/core/state/embed-models.ts, …`

**Tradeoffs:**

- Embeds are read-only; no editing from an embed in v1.

**Success Criteria:** S20, S21

**Verification Impact:**

- V38, V39.

## W26100423LX-DES16: Wiring, boundaries, and integration re-checks

**Question:** How is everything composed, and how are the DI3 integration obligations re-proven?

**Decision:** `registries()` and `main()` register all DI4 pieces (section 5); `testRegistries` mirrors them plus a test-only board type; `PACKAGE_HOMES.yaml` adds `src/core/features/bases/`; `tour.md` gains a base embed over `test/fixtures/workspace/tasks.base`; `make5000LineNote` adds a base embed for the live keystroke bench; CI re-runs V7@R2 goldens, V16@R2, UV3@R2, and V12@R3.

**Requirements Addressed:** W26100423LX-REQ13@R1

**Research Support:** None

**Rationale:** One composition point and a mirrored test registry are the existing pattern (`main.ts:111-136`, `test/support/state.ts:41-66`); the phase assigns integration to the DI that merges last (phase file line 553).

**Code Impact:**

- `src/app/main.ts`, `test/support/state.ts`, `test/boundaries.test.ts`, `test/fixtures/{tour.md,generate.ts,workspace/tasks.base,bases/*}`, `test/bench/live-keystroke.bench.ts`

**Detailed Design:** section 7 `src/app/main.ts and test/support/state.ts`, `test/boundaries.test.ts`

**Tradeoffs:**

- `testRegistries` duplicates `registries()`; kept because tests need the test-only layout and DI1–DI3 kept the same split.

**Success Criteria:** S23

**Verification Impact:**

- V43, V44, V46.
