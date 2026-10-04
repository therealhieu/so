# W26100423LX: daily-notes-templates-and-bases

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-2-obsidian-experience.md` | DI4 definition (lines 407–484), PH2 phase design (98–321), gates G3/G4 (65–73), Delivery Flow (75–96), success and exit (485–559), progress (582–590), approval (596–613) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md` | DI4 assignment (Delivery Items line 134) and Work Progress row (line 145) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-requirements.md` | REQ6@R2 (169), REQ7@R2 (187), REQ11@R3 (274) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-design.md` | AppConfig (420), S6/V9 (974–989), S7/V10 (991–1006), DES8@R2 (1192), DES9@R3 (1202), DES10@R2 (1212), DES11@R1 (1222), DES12@R2 (1232), DES14@R2 (1252), DES17@R2 (1282) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-research.md` | RF9 (485, Bases layouts, Kanban `type` unverified), RF10 (503, Moment tokens, `{{time:F}}`, subfolders) |
| `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-requirements.md`, `rm261003abzp-ui-design.md`, `ui-mockups/manifest.md` | UREQ8/9/11, UDES8/9/11, US6/7/9, UV7/8/10, surfaces and components; accepted M5@R2 and M6@R1 |
| `src/core/filetypes/registry.ts`, `src/ui/editors/registry.ts`, `src/ui/views/window-tree.ts`, `src/ui/editors/text-view.ts` | `EditorKindSpec`, `EditorKindRegistry`, `FileType`, `editorViews`, `EditorView` |
| `src/core/state/{types,update,commands,keys,keymap,picker,embeds,view-context}.ts`, `src/core/state/markdown-commands.ts` | State shape, registries, command context and Ex aliases, key routing, picker sources, embed loading |
| `src/core/config/schema.ts` | Current config keys (no `[daily]` or `[templates]`) |
| `src/core/lang/markdown/{live-preview,render-key,scan}.ts`, `src/core/lang/markdown/renderers/{embed,index}.ts`, `src/ui/widgets/registry.ts` | G4 outputs: block renderer registry, embed render key, embed widget pattern, widget painters |
| `src/core/features/links/{summarize,rename}.ts` | `NoteSummary` fields; `FileEdit`/`SpanEdit` used by the `applyEdits` effect |
| `src/workspace/fs.ts`, `src/app/{effects,main}.ts` | `createEntry`, the `create` and `applyEdits` effects, startup registration |
| `test/boundaries.test.ts` | `PURE_CORE`, `LAYER_RULES`, `PACKAGE_HOMES` |
| `/Users/hieunguyen/git/hieu/projects/alfred` at `5fde89b0` — `packages/vault/src/domain/bases/*`, `packages/view-model/src/base/*`, `tests/e2e/tui/support/fixtures/vault/projects/tasks.base` | Porting sources for the Bases engine and view models |

## Roadmap Binding

- **Roadmap:** RM261003ABZP — `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md`
- **Phase:** RM261003ABZP-PH2@R5 — `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Phase Definition (lines 10–37)
- **Delivery item:** RM261003ABZP-DI4@R2 — same file, Delivery Items (lines 407–484); index Delivery Items row (line 134)
- **Accepted upstream baseline:**
  - Context: `rm261003abzp-roadmap-context.md@R2`.
  - Requirements (`rm261003abzp-requirements.md`): RM261003ABZP-REQ6@R2 (169), RM261003ABZP-REQ7@R2 (187), RM261003ABZP-REQ11@R3 (274); RM261003ABZP-REQ10@R4 budgets kept (phase file Coverage, line 566).
  - Design (`rm261003abzp-design.md`, Design Decisions): RM261003ABZP-DES8@R2 (1192), RM261003ABZP-DES9@R3 (1202), RM261003ABZP-DES10@R2 (1212), RM261003ABZP-DES11@R1 (1222), RM261003ABZP-DES12@R2 (1232), RM261003ABZP-DES14@R2 (1252), RM261003ABZP-DES17@R2 (1282); AppConfig data model (420: `daily` (`folder`, `format`, `template`), `templates.folder`).
  - Success and verification (`rm261003abzp-design.md`, Success and Verification): RM261003ABZP-S6@R1 (974) with RM261003ABZP-V9@R1 (981); RM261003ABZP-S7@R1 (991) with RM261003ABZP-V10@R1 (998); RM261003ABZP-S11@R1 with RM261003ABZP-V15@R2 and RM261003ABZP-V16@R2 (registration-only `base` file type and editor kind).
  - Research: RM261003ABZP-RF9 (evaluated REQ7@R1 → informed REQ7@R2), RM261003ABZP-RF10 (evaluated REQ6@R1 → informed REQ6@R2 and the shared formatter in REQ7@R2).
  - Accepted mockups (`ui-mockups/manifest.md` lines 24–25, 91): RM261003ABZP-M5@R2 (S1–S14; feedback cycle 1 `[daily] format`, AD2), RM261003ABZP-M6@R1 (S1–S16).
  - UI requirements (`rm261003abzp-ui-requirements.md`): RM261003ABZP-UREQ8@R2 (135), RM261003ABZP-UREQ9@R1 (151), RM261003ABZP-UREQ11@R1 (184).
  - UI design (`rm261003abzp-ui-design.md`): RM261003ABZP-UDES8@R1 (2341), RM261003ABZP-UDES9@R1 (2351), RM261003ABZP-UDES11@R1 (2371); surfaces Daily notes and templates (873) and Bases views (948); components Picker (1350), Prompt (1515), Toast stack (1671), Calendar (1743), Base table (1828), Kanban board (1904), Theme (1978); RM261003ABZP-US6@R1 (2106), RM261003ABZP-US7@R1 (2115), RM261003ABZP-US9@R1 (2133); RM261003ABZP-UV7@R1 (2216), RM261003ABZP-UV8@R1 (2228), RM261003ABZP-UV10@R1 (2252).
- **Assigned parent obligations:**
  - Requirements: RM261003ABZP-REQ6@R2 (daily notes and templates), RM261003ABZP-REQ7@R2 (Bases table and Kanban with embeds), RM261003ABZP-REQ11@R3 (`base` as a registered file type and editor kind; the Bases view-type registry).
  - Design: RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES8@R2 (writes through `atomicWrite`; exclusive create), RM261003ABZP-DES9@R3 (`base` widget through `blockRenderers`), RM261003ABZP-DES10@R2 (`editorViews.base`, `base` widget painter), RM261003ABZP-DES17@R2 (`base` file type registration), RM261003ABZP-DES14@R2 (`[daily]` and `templates.folder` config).
  - Success/verification: RM261003ABZP-S6@R1 via RM261003ABZP-V9@R1; RM261003ABZP-S7@R1 via RM261003ABZP-V10@R1.
  - UI: RM261003ABZP-M5@R2, RM261003ABZP-M6@R1; RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1, RM261003ABZP-UREQ11@R1 (DI4 surfaces); RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES11@R1; RM261003ABZP-US6@R1 via RM261003ABZP-UV7@R1, RM261003ABZP-US7@R1 via RM261003ABZP-UV8@R1, RM261003ABZP-US9@R1 via RM261003ABZP-UV10@R1 (focused Base cell, focused Kanban card, calendar selection; NO_COLOR, light, 80×24).
  - Phase design (DI4 parts): Components and files (rows at lines 137–142), Runtime and failure flow (`:Today`, Base edit, Kanban branches, lines 144–178), Code shapes `src/workspace/fs.ts` `createExclusive` (253–271) and `src/core/features/bases/views.ts` (273–292), Contracts, data, and state DI4 additions (195–198: `overlay` variant `calendar`; base window content `{editor: "base", path, view: {index, sort?, grouped}, cursor: {row, col}}`; no new top-level field), Migration and compatibility (294–302), UI realization DI4 (311–313).
  - Cross-work integration (phase file line 553): DI4 merges last and owns integration. Its CI on top of merged DI3 must re-pass RM261003ABZP-V7@R2, RM261003ABZP-V12@R3, and RM261003ABZP-V16@R2 with the `base` renderer registered, and RM261003ABZP-UV3@R2 with a Base embed in `tour.md`.
  - PH2 completion evidence DI4 must supply (phase file lines 547–551): passing CI for V9, V10, UV7, UV8, UV10 on merged DI4; the Obsidian 1.14+ Kanban fixture provenance.
  - Downstream work boundary (lines 477–482): the DI4 discussion ports the Alfred Bases sources and decides the module split. It may not write `.base` files, widen the expression subset beyond Alfred's without returning to design, change the `createExclusive` never-overwrite rule, ship Kanban before `KANBAN_TYPE` is confirmed against an Obsidian 1.14+ file, or special-case `.base` outside its file-type registration.
  - Exclusions (lines 443–447): writing `.base` files; Cards, List, and Map layouts; configurable week start; template scripting beyond the listed variables.
- **Dependency gates:**
  - G3 (consumer; due before DI4 execution) — phase file line 70. Satisfied: DI2 merged as `9adb285` (PR #2) with the Picker with preview, Prompt, NoteIndex paths and frontmatter in summaries, `FileTypeRegistry` and `editorViews`, and the `search` and `write` effects; the PH1 exit is recorded (phase file Progress line 590; index line 145).
  - G4 (consumer; due before executing the `![[file.base]]` embed renderer only; the DI4 PR merges after DI3) — phase file line 71. Satisfied: DI3 merged as `e228bb5` (PR #6) with `PreviewCtx`, `MarkdownViewInput`, `livePreview`, `BlockRenderer`, and `registerBlockRenderer` in `src/core/lang/markdown/live-preview.ts`, `registerWidgetPainter` in `src/ui/widgets/registry.ts`, and unlisted embed buffers in `src/core/state/embeds.ts`; W261003S6BQ V4 (RM261003ABZP-V7@R2), V5, V38, and V41 (RM261003ABZP-V16@R2) passed (phase file line 590).
  - No gate is due later than DI4 execution; both are satisfied now.
- **Accepted at:** PH2@R5 and DI4@R2 approved (phase file Approval, lines 596–613; index Approval). DI4@R2 has been retained since the post-DI1 synchronization through R5, which the user approved on 2026-10-04. No W was assigned to DI4 before this work: the index Delivery Items row (line 134) and the PH2 Progress row (line 590) show Work `Pending`, and no folder in `.s1mple/work/active/` or `.s1mple/work/done/` binds DI4 (DI4 appears in W261003S6BQ and W261003FX70 only as a downstream consumer). Self-drive delegated by the user on 2026-10-04 for this discussion run; this W accepts the binding on 2026-10-04.

Use revision-qualified parent PH/DI/REQ/DES/S/V and applicable M/UREQ/UDES/US/UV references. Reference definitions instead of copying them; if paths move, resolve the same IDs and revisions. Check current index/phase assignments and existing W bindings before accepting a new assignment.

### Previous Accepted Bindings

None

### Parent Synchronization

- **Registration or discussion update:** Pending parent synchronization. Proposed changes, evidence: this context document and the absence of any prior DI4 binding (see Accepted at):
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md`, Delivery Items, RM261003ABZP-DI4@R2 row (line 134): Work `Pending` → `W26100423LX`; PR stays `Pending`.
  - Same file, Work Progress, RM261003ABZP-DI4@R2 row (line 145): Work stage `Not started` → `Discuss`; Next gate `None — G3 and G4 satisfied; next: W26100423LX requirements and system design, which confirm the Kanban type value`; Evidence `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-discuss-context.md`; Checked at 2026-10-04.
  - Same file, introductory paragraph (line 7): add that DI4 is in discussion as W26100423LX.
  - `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Progress, RM261003ABZP-DI4@R2 row (line 590): Delivery status `Not started` → `In progress`; Work `Pending` → `W26100423LX`; PR stays `Pending`; Next `W26100423LX discussion`.
  - Same file, introductory paragraph (line 8): replace "DI4 has no work, PR, or verification result yet" with "DI4 is in discussion as W26100423LX; it has no PR or verification result yet".

The main orchestrator owns this receipt. It does not replace parent W/PR assignments or the index's work-progress view; update the parent only with explicit authorization. Later stages record their synchronization receipts in their own artifacts.

## 1. User Input

### Original Input

Self-drive `/s1mple-discuss` for the next roadmap delivery item, RM261003ABZP-DI4@R2 (Daily notes, templates, and Bases), on branch `feat/rm261003abzp-di4-daily-notes-and-bases`: select options that are stable, simple, easy to maintain and extend, and follow industry standards and project compliance.

### Consolidated Requirement or Problem

Deliver RM261003ABZP-DI4@R2 on the language-neutral kernel without kernel changes:

- Daily notes: `:Today`/`<leader>nd`, `:Yesterday`, `:Tomorrow`, and the calendar picker `<leader>np`, created from the daily template through an exclusive create that never overwrites.
- Templates: `template.insert` (`<leader>nt`, one undo block, preview of source above expansion) and `note.new` (`<leader>nn`, title prompt → template picker with `(blank note)` first).
- An Obsidian-compatible Moment-subset `formatDate`, `dailyPath`, and `expandTemplate`, with `[daily]` and `templates.folder` config.
- Obsidian Bases: the `.base` file type and `base` editor kind; the ported parser, evaluator, expression subset, and YAML patcher; table and Kanban view models with comment-preserving frontmatter edits and diff toasts; the view-type registry with a table fallback and notice; `KANBAN_TYPE` verified against an Obsidian 1.14+ file; and `![[x.base]]`/`![[x.base#View]]` embeds through the G4 registries.

The work must meet the assigned REQ/DES/S/V and UI obligations above and own the cross-work integration re-checks.

### Constraints and Assumptions

- Self-drive was delegated by the user on 2026-10-04 for this run: decisions are made by the agent and recorded with rationale, without per-stage questions.
- The kernel (`src/core/kernel/`) gains no Bases, note, or date code; DI4 extends through registration (file types, editor kinds, commands, bindings, block renderers, widget painters, editor views, view-context builders) (RM261003ABZP-REQ11@R3; `test/boundaries.test.ts:41`).
- `.base` files are never written in v1; Bases writes patch only edited frontmatter keys, preserving comments and key order (phase file line 298).
- Creation commands never modify an existing note (phase file lines 253–271).
- Kanban ships only after `KANBAN_TYPE` matches a `.base` file saved by Obsidian 1.14 or later (phase file lines 299, 481).
- No work-process identifiers in code, comments, test names, or logs (`.s1mple/S1MPLE.md` Implementation).
- Exact npm pins; `src/core` stays free of I/O, runtime, and UI imports (`.s1mple/docs/project.md` Constraints).
- REQ10@R4 budgets hold: `bun run check` < 30 s and CI < 3 min (phase file Coverage line 566). CI runs on pull requests only; no release is tagged or published.
- Assumption: Alfred at `/Users/hieunguyen/git/hieu/projects/alfred` (`5fde89b0`) is the porting reference named by RM261003ABZP-DES12@R2; it is read, not copied verbatim.

## 2. Project Structure

- `src/core/filetypes/registry.ts` — `FileType` (`editor` kind, `views`, `analyze`), `EditorKindRegistry`, and `EditorKindSpec.open(path, text)`, which nothing calls yet; `base` registers here.
- `src/core/state/` — commands that read `AppState` (`commands.ts`, `markdown-commands.ts`, `link-commands.ts`), key routing (`keys.ts`, `keymap.ts`), pickers (`picker.ts`), embeds (`embeds.ts`), view contexts (`view-context.ts`), and the `Registries` bundle (`update.ts`).
- `src/core/time/` — does not exist; already listed in `PURE_CORE` (`test/boundaries.test.ts:14`), so `format.ts` can land without a rule change.
- `src/core/features/` — only `links/` exists; `bases/` and `notes/` are new. Features may import kernel, filetypes, lang, features, and time, never `core/state`.
- `src/core/lang/markdown/` — the G4 registry (`live-preview.ts`), the embed render key (`render-key.ts`), the note-embed renderer (`renderers/embed.ts`), and the only home of the `yaml` package (`scan.ts`).
- `src/core/config/schema.ts` — config schema; `[daily]` and `[templates]` are not defined yet.
- `src/ui/editors/`, `src/ui/overlays/`, `src/ui/widgets/` — editor views by kind, overlays (picker, prompt, which-key, conflict), and widget painters; the Bases views, calendar overlay, and `base` widget painter are new.
- `src/workspace/fs.ts`, `src/app/effects.ts` — file operations and the serial effect runner; `createEntry` and the `create`/`applyEdits` effects live here.
- `src/app/main.ts` — composition root where file types, commands, view contexts, editor views, and widget painters are registered.
- `test/fixtures/` — `tour.md`, `generate.ts`, `workspace/`, `images/`; Bases and template fixtures are new.

## 3. Standards and Patterns

### Applicable Standards

- `.s1mple/S1MPLE.md:63` — no work-process identifiers in code, comments, identifiers, test names, SQL comments, or log messages.
- `.s1mple/docs/project.md` Boundaries and Dependencies — layer import rules and package homes enforced by `test/boundaries.test.ts`.
- `test/boundaries.test.ts:9-15` — `PURE_CORE` (`kernel`, `filetypes`, `lang`, `features`, `time`) is what plain `src/core/` modules may import.
- `test/boundaries.test.ts:33-41` — `core/state` and `core/config` may import any core module; `core/filetypes` imports only kernel and filetypes; `core/kernel` imports only kernel and no packages.
- `test/boundaries.test.ts:45-56` — `PACKAGE_HOMES`: `yaml` may be imported only from `src/core/lang/markdown/`.
- `.s1mple/docs/languages/typescript.md` — strict TypeScript, `import type`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, colocated `*.test.ts`, behavior-named tests, zero knip findings.
- `rm261003abzp-requirements.md:180` (REQ6@R2) — the Moment.js token subset `YYYY YY M MM MMM MMMM D DD Do d ddd dddd H HH h hh m mm s ss A a` plus `[literal]`; unsupported tokens stay literal.
- RM261003ABZP-REQ11@R3 — XDG Base Directory 0.8, `NO_COLOR`, Obsidian Flavored Markdown, Conventional Commits 1.0.0, SemVer 2.0.0.

### Existing Patterns

- `src/core/filetypes/registry.ts:16-19` — `EditorKindSpec<St> = { id; open(path, text): St }`, the seam for per-kind window state.
- `src/core/state/update.ts:67-88` — `syncEditorKinds` sets `WindowState.content.editor` from the buffer's file-type kind after each reducer step when that kind is registered, else `"text"`.
- `src/app/main.ts:113-134` — file types, commands, and view contexts registered at startup; `main.ts:242-246` registers editor views and widget painters.
- `src/ui/views/window-tree.ts:96` — a window's view comes from `editorViews.get(kind) ?? editorViews.get("text")`.
- `src/core/state/markdown-commands.ts:146-149` — bindings scoped to a file type (`{ mode: "normal", filetype: "markdown" }`), the pattern for `base`-scoped keys.
- `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-2-obsidian-experience.md:131` — commands that read `AppState` live in `core/state` because lower core layers may not import it (DI3 put `markdown-commands.ts` there).
- `src/core/state/commands.ts:41-47` — `CommandContext` carries `now`, the only clock a pure command sees; `commands.ts:52-79` — `EX_ALIASES` maps Ex names to command ids (DI3 added `Preview`, `PreviewStop`).
- `src/core/kernel/commands/defaults.ts:46-51` — which-key group labels (`<leader>f` find, `<leader>s` search, …); `<leader>n` is unbound and unlabelled.
- `src/core/lang/markdown/render-key.ts:15-22` — `embedOnly` returns the file extension for non-note, non-image embeds, so `![[tasks.base]]` already gets render key `"base"`.
- `src/core/lang/markdown/live-preview.ts:43-48` — `registerBlockRenderer(kind, r)`; `:121-130` — a throwing renderer leaves its block as source with a `⚠` sign.
- `src/core/lang/markdown/renderers/embed.ts:146-179` — an embed renders as a `replace` decoration with a `widget` (`type`, `data`, `rows`), reserving three rows while loading and showing the title when missing.
- `src/core/state/embeds.ts:13-23` — `embedTargets` loads only note embeds (`embedOnly(...) === "embed"`) as unlisted buffers.
- `src/core/state/types.ts:374` and `src/app/effects.ts:231-262` — `applyEdits` reads a closed file, applies `SpanEdit`s whose `expected` text must still match, writes through `atomicWrite` with the read stamp, and answers `editsApplied`.
- `src/workspace/fs.ts:171-185` — `createEntry` creates an empty file with `open(p, "wx")` and refuses an existing entry; the `create` effect runs it through the serial queue (`effects.ts:143-148`, `273-275`).
- `src/core/state/picker.ts:41-59` — `PickerSource` (`items`, `accept`, optional path-based `preview`); `picker.ts:171` — sources are a fixed record in `core/state`.
- `src/core/lang/markdown/scan.ts:1,224-235` — frontmatter is parsed with `yaml`; `src/core/features/links/summarize.ts:18-30` — `NoteSummary` carries `path`, `mtime`, `title`, `aliases`, `tags`, `links`, and `frontmatter`.

## 4. Architecture

```text
key → src/ui (normalize) → store.dispatch → core/state update → { state, effects } → src/app effect runner → src/workspace
                                    │
            Registries (app/main): fileTypes · editorKinds · commands · bindings · groups · viewContexts
                                    │
   Today: no core/time, no core/features/{notes,bases}, no `base` file type or editor kind, no [daily]/[templates] config

DI4 attach points (proposed by the phase design, lines 120–142):
  core/time/format.ts ──► core/features/notes (dailyPath, expandTemplate) ──► commands in core/state ──► create effect ──► workspace/fs
  core/features/bases (parse, evaluate, views registry, table, kanban, yaml patch, file type)
        ├──► FileTypeRegistry.register(baseFileType: ".base", editor "base") + EditorKindRegistry.register(base spec)
        ├──► registerBlockRenderer("base", …)  [G4]  ──► registerWidgetPainter("base", …)  [G4]
        └──► ui/editors/base-view (registerEditorView("base")) ──► frontmatter patch ──► write / applyEdits effects
  ui/overlays/calendar.ts ◄── overlay { kind: "calendar" }
```

- `core/time` — pure Moment-subset formatter shared by daily notes, templates, and Bases (RM261003ABZP-DES11@R1).
- `core/features/notes` — daily paths and template expansion; pure, no `AppState`.
- `core/features/bases` — ported engine, view models, view-type registry, `KANBAN_TYPE`, and the `base` file type.
- `core/state` — commands, key routing, pickers, overlays, and embed loading that read or change `AppState`.
- `src/ui` — Bases editor view, calendar overlay, `base` widget painter, template-picker preview.
- `src/workspace` + `src/app` — exclusive create and frontmatter writes through the serial queue.

## 5. Code Flow

```text
open .base (today) → FileTypeRegistry.forPath → textFileType (no match) → editor "text" → vim source view
![[tasks.base]] (today) → renderKey "base" → no renderer for "base" → paragraph renderer (inline text)
<leader>n… (today) → no binding → which-key shows nothing under n

Phase design target:
:Today → dailyPath(cfg, today) → index has path? open : expandTemplate → createExclusive(path, text)
                                                     └─ EEXIST (race) → read + open, no write
open .base → forPath → base file type → editorKinds.get("base").open(path, text) → window content {editor:"base", state} → editorViews.base
Base: i on cell → edit → validate(type) → invalid → inline error
                                       → valid → yamlPatch(frontmatter) → write effect → toast diff
Kanban L → group by formula/file? → toast explanation, no write : patch property (None → remove)
![[x.base#View]] → renderKey "base" → base block renderer → widget{type:"base"} (rows reserved while loading) → base widget painter
```

1. A key reaches `handleKeyAction` (`src/core/state/keys.ts:46`). Overlays take it first (`routeKey`, `:61-85`); otherwise `bindingOrVim` (`:87-121`) looks it up in the keymap for `keyScope(s)` (`keymap.ts:66-73`: vim mode plus the active buffer's file type).
2. A binding runs a command with `CommandContext { state, now, args, reg }` (`commands.ts:41-47`); an unbound key in a window falls through to `runVim` on the buffer text (`keys.ts:120`). For a `.base` buffer this would edit its YAML source.
3. Opening a path resolves its file type with `forPath` (`registry.ts:84-93`); `syncEditorKinds` (`update.ts:67`) picks the window's editor kind; the UI builds that kind's view (`window-tree.ts:96`).
4. In `live`/`reading` views, `livePreview` renders each visible block with the renderer registered for its render key (`live-preview.ts:94-137`); `embedRenderer` resolves the target through `PreviewCtx.resolve`/`embed` and emits an `embed` widget (`renderers/embed.ts:146-179`).
5. `syncEmbeds` (`embeds.ts:36`) requests unlisted buffers for note embeds only; `.base` embed targets are not loaded today.
6. File operations run serially in the effect runner: `create` makes an empty file with `wx` (`fs.ts:171-185`); `write` uses `atomicWrite` with an expected stamp; `applyEdits` patches closed files with checked span edits (`effects.ts:231-262`).

## 6. Boundaries

### In Scope

- Everything in RM261003ABZP-DI4@R2 Scope (phase file lines 423–442), including `[daily]` (`folder`, `format`, `template`) and `templates.folder` config keys (AppConfig, design line 425), which the current schema lacks.
- `<leader>n` bindings and a which-key group label for them; `:Today`, `:Yesterday`, `:Tomorrow` Ex aliases.
- The `calendar` overlay variant and base window content in `WindowState` (phase file lines 195–198).
- The `base` widget painter and block renderer (G4 consumer), and DI4's cross-work integration re-checks (V7@R2, V12@R3, V16@R2, UV3@R2 with a Base embed in `tour.md`).
- DI4's UI states for NO_COLOR, light theme, and 80×24 (RM261003ABZP-UV10@R1).
- Fixtures: Bases fixtures ported from Alfred tests, an Obsidian-saved Kanban `.base`, templates fixtures.

### Out of Scope

- Writing `.base` files; Cards, List, and Map layouts (they open as a table with a notice); configurable week start; template scripting beyond `{{title}} {{date}} {{time}} {{date:F}} {{time:F}}` (phase file lines 443–447).
- Widening the Bases expression subset beyond Alfred's without returning to design (line 479).
- Kernel changes; any `.base` special case outside its file-type registration.
- The PH2 exit record, the release dry run, and any release (the phase owns them after DI4 merges).
- Everything in the index's Deferred Scope.

### Interfaces and Dependencies

- `FileTypeRegistry.register`, `EditorKindRegistry.register`, `EditorKindSpec.open` (`src/core/filetypes/registry.ts`).
- `registerEditorView` (`src/ui/editors/registry.ts`); `editorViews` factories return the text `EditorView` class type (`src/ui/editors/text-view.ts:266`).
- `registerBlockRenderer`, `PreviewCtx`, `MarkdownViewInput` (`src/core/lang/markdown/live-preview.ts`); `registerWidgetPainter` (`src/ui/widgets/registry.ts`).
- `CommandRegistry`, `Binding` scopes with `filetype`, `groups`, `EX_ALIASES` (`src/core/state/commands.ts`).
- `PickerSource`/`pickerSources` and `PromptState` (`src/core/state/picker.ts`, `src/core/state/types.ts:129-138`, where `PromptState` requires an explorer `FsOp`).
- `NoteIndex` (`ix.files`, summaries with `frontmatter` and `mtime`) for daily-note existence, calendar marks, and Bases candidates.
- Effects `create`, `write`, `applyEdits`, `read`; actions `fsResult`, `fileLoaded`, `saved`, `editsApplied` (`src/core/state/types.ts:294-377`).
- `ConfigSchema` (`src/core/config/schema.ts:10-47`).
- Package `yaml` 2.9.1 (already a dependency; home restricted to `src/core/lang/markdown/`).
- Alfred porting sources (no imports; code is ported):

  | Alfred file | Lines | Imports | Tests (lines) |
  |---|---|---|---|
  | `packages/vault/src/domain/bases/parser.ts` (`parseBaseSource`) | 179 | `yaml` | `parser.unit.test.ts` (123) |
  | `packages/vault/src/domain/bases/evaluator.ts` (`evaluateBase`) | 956 | `./expression`, types | `evaluator.unit.test.ts` (1625) |
  | `packages/vault/src/domain/bases/expression.ts` (`evaluateExpression`) | 404 | types | `expression.unit.test.ts` (64) |
  | `packages/vault/src/domain/bases/yaml-patcher.ts` (column/view mutations of `.base`) | 305 | `yaml` | `yaml-patcher.unit.test.ts` (605) |
  | `packages/vault/src/domain/bases/frontmatter.ts` (`applyFrontmatterPatch`) | 72 | `yaml` (`parse`, `stringify`) | `frontmatter.unit.test.ts` (61) |
  | `packages/vault/src/domain/bases/types.ts` | 270 | none | — |
  | `packages/view-model/src/base/rows.ts` | 538 | `node:path` (`posix`), `yaml`, `@alfred/protocol` types | `rows.unit.test.ts` (238) |
  | `packages/view-model/src/base/board.ts` | 129 | `@alfred/protocol` types, `./column-types`, `./format` | `board.unit.test.ts` (134) |
  | `packages/view-model/src/base/{column-types,column-editor,cell-edit,format,summary,diagnostics,tags,column-width}.ts` | 104, 297, 25, 62, 89, 50, 45, 19 | `@alfred/protocol` types | 117, 138, 24, 73+86, 106, 92, 29, 16 |

  `tests/e2e/tui/support/fixtures/vault/projects/tasks.base` is an Alfred-authored fixture (views `table`, `board`, `gallery`, `list`, `timeline`; formula `if(!done && due < today(), "late", "")`). Alfred has no daily-note, template, or Moment-style formatter code; `view-model/src/base/format.ts:19` formats date cells only as ISO dates.

## 7. Unknowns

- **`KANBAN_TYPE` value.** Alfred's evaluator accepts `table`, `board`, `gallery`, `list` (`evaluator.ts:162`) and its fixture uses `type: board`, but that file was authored for Alfred, not saved by Obsidian. RF9 (research line 485) names the Obsidian 1.14 layout "Kanban" and records the YAML string as unverified. Shipping Kanban needs a `.base` saved by Obsidian 1.14+ with recorded provenance (phase file line 551); the agent cannot produce one by running Obsidian here.
- **`yaml` package home.** The Bases parser and frontmatter patcher need `yaml`, but `PACKAGE_HOMES` allows it only in `src/core/lang/markdown/` (`test/boundaries.test.ts:51`). Either the home widens to `src/core/features/bases/` or Bases reaches YAML through a `lang/markdown` module.
- **Command module location.** The phase design names `src/core/features/notes/commands.ts` (line 137), but commands read `AppState`, and `core/features` may not import `core/state`; the DI3 precedent put such commands in `core/state` (phase file line 131).
- **Exclusive create with content.** The phase shape is `createExclusive(path, text)` returning `{created, stamp}` (lines 253–271), while the current `create` effect makes an empty file and answers only `fsResult` (`fs.ts:171-185`, `types.ts:314`). How the reducer learns `created: false` and then opens the existing note is not defined.
- **Clock and timezone.** Commands see `now` as epoch milliseconds (`commands.ts:44`); "today" and template times need local calendar fields, which a pure core can only get from `Date` with the process timezone. Tests need a fixed clock and timezone (V9 environment: "fixed clock").
- **Base window state and persistence.** `WindowState.content` is text-shaped (`bufferId`, `cursor: Pos`, `scroll`, `folds`; `types.ts:93-104`); the phase design adds base content `{view: {index, sort?, grouped}, cursor: {row, col}}` created by `EditorKindSpec.open`, which nothing calls yet. Whether base windows persist in `PersistedState` (`types.ts:204-214`, `version: 1`, unchanged per phase line 297) is undecided.
- **Key routing in base windows.** Unbound keys fall through to `runVim` on the buffer text (`keys.ts:120`), which would edit the `.base` YAML and could autosave it, against the never-write rule. Cell editing (text input, `Ctrl-a`/`Ctrl-x`, inline errors, `Esc` restore) needs a non-vim input path; the phase design names a keymap mode `base` (line 141).
- **Editor view type.** `editorViews` factories must return the text `EditorView` class (`src/ui/editors/registry.ts:6-9`), so a Bases view either subclasses it or the factory type widens to a shared interface.
- **Base embeds.** `embedTargets` loads only note embeds (`embeds.ts:17`), and `PreviewCtx` exposes no index rows; a `base` block renderer needs the `.base` text and evaluated rows from `NoteIndex`. How those reach the renderer (new `PreviewCtx` member, the Markdown view-context builder, or an unlisted `.base` buffer) is undecided.
- **Bases candidate fields.** Alfred's `BaseCandidateFile` needs `size`, `ctime`, `mtime`, `links`, `embeds`, `tags`, and `properties` (`types.ts:108-121`); `NoteSummary` has `mtime`, `tags`, `links`, and `frontmatter` but no `size` or `ctime` (`summarize.ts:18-30`), and `ix.files` lists non-Markdown files without summaries.
- **Frontmatter writes to closed notes.** Bases edits target notes that are usually not open. The existing `applyEdits` effect patches closed files with checked span edits and the read stamp (`effects.ts:231-262`), while the phase design says "`write` effect". Which path carries Bases writes, and how an open dirty buffer of the same note is handled, is undecided.
- **Expression subset gaps.** Alfred's expressions support literals, operators, `note.*`/`file.*`/`formula.*` properties, and only `file.hasTag`, `file.inFolder` (exact folder), and `file.hasProperty` (`expression.ts:158-190`); there is no `if()`, `today()`, or `date.format()`. DES11@R1 lists "Bases date formatting" as a consumer of `formatDate`, but the downstream boundary forbids widening the subset beyond Alfred's without returning to design (phase file line 479).
- **Pure-core port adjustments.** Alfred `view-model/src/base/rows.ts` imports `node:path` and `@alfred/protocol` types, which `src/core` cannot import; the port needs local path helpers and local types.
- **Template preview and new-note prompt.** Picker previews are path-and-line based and paint raw file text (`picker.ts:57-58`, `src/ui/overlays/picker.ts:234-279`), but UDES8@R1 shows template source above its expansion; `PromptState` requires an explorer `FsOp` (`types.ts:129-138`), so the `note.new` title prompt needs a new prompt purpose or kind.
- **UI-design system references.** The UI surfaces cite RM261003ABZP-DES7@R3 and RM261003ABZP-DES14@R1 (`rm261003abzp-ui-design.md:880`, `1752`), while DI4 binds DES7@R4 and DES14@R2. The changes between those revisions concern indexing and editor options, so they appear not to affect DI4 surfaces; this needs confirmation during requirements.
- **Bench impact.** The `base` block renderer joins the live-preview path, and V12@R3 (live keystroke p95 < 24 ms) must re-pass with it registered (phase file line 553); the cost of evaluating a base inside a note embed is unmeasured.
