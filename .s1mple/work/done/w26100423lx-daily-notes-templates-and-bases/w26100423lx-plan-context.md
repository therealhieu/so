# W26100423LX Plan Context

## Status

`Ready`

## 1. Sources

| Source | Path | Use |
|---|---|---|
| s1mple instructions | `.s1mple/S1MPLE.md` | Workflow behavior and required context |
| Project document | `.s1mple/docs/project.md` | Reusable project baseline |
| System design | `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-system-design.md` (`Finalized System Design`, `c1e095a`) | Technical authority |
| UI design | Not applicable — no work-local UI design; the parent UI design `rm261003abzp-ui-design.md` (`Ready for Planning`) governs the assigned UREQ/UDES/US/UV, recorded under Roadmap sources | UI/UX authority for the assigned parent UI scope |
| System requirements | `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-requirements.md` (`Ready for System Design`; REQ1–REQ13 current revisions) | Required system behavior |
| UI requirements | Not applicable — no work-local UI requirements; parent RM261003ABZP-UREQ8@R2, UREQ9@R1, UREQ11@R1 apply through the roadmap binding | — |
| Research | `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-research.md` (RF1–RF9) | Relevant research findings |
| Discussion context | `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-discuss-context.md` | Work-specific findings, roadmap binding, constraints |
| UI context | Not applicable — no work-local UI context; the discussion context section 2–3 and the system design Focused Code Surface carry the UI code evidence | — |
| Roadmap sources | `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md`; `rm261003abzp-roadmap-phase-2-obsidian-experience.md`; `rm261003abzp-design.md`; `rm261003abzp-requirements.md`; `rm261003abzp-ui-requirements.md`; `rm261003abzp-ui-design.md`; `ui-mockups/manifest.md` | Validate the accepted binding, assigned scope, and dependency gates |
| Additional project files | `src/core/filetypes/registry.ts`, `src/core/state/{update,keys,save,embeds,markdown-view,picker}.ts`, `src/workspace/fs.ts`, `src/app/{main,effects}.ts`, `src/ui/editors/registry.ts`, `test/boundaries.test.ts`, `test/support/{state,ui}.ts`, `test/ui/live-preview.test.ts`, `test/bench/live-keystroke.bench.ts`, `test/fixtures/{tour.md,generate.ts}`; Alfred at `/Users/hieunguyen/git/hieu/projects/alfred` `5fde89b0` | Re-check of design-cited current shapes and test-harness seeding |

## 2. Governing Design Handoff

### Source Authority

- **System design:** `w26100423lx-system-design.md` — authoritative for all architecture, files, symbols, contracts, flows, success criteria S1–S24, and verification V1–V46 (including V4a, V26a, V34b).
- **UI design:** Parent `rm261003abzp-ui-design.md` — authoritative for the look of the Daily notes and templates surface (line 873), Bases views surface (948), and components Picker (1350), Prompt (1515), Toast stack (1671), Calendar (1743), Base table (1828), Kanban board (1904), Theme (1978); accepted mockups RM261003ABZP-M5@R2 and M6@R1. The system design supplies the technical seams only (its Design Boundary, line 17).
- **Alignment:** Aligned — the system design's UI obligations block (section 1, Assigned Parent Obligation Coverage, "UI obligations") maps UREQ8/9/11, UDES8/9/11, US6/7/9 via UV7/8/10 to DES5, DES6, DES14 and V10, V16, V40, V45.

### Approved Direction

Deliver RM261003ABZP-DI4@R2 by registration on the unchanged kernel (system design section 2, Proposed Architecture):

- **Notes:** a pure Moment-subset formatter (`src/core/time`), pure daily paths and Obsidian-exact template expansion (`src/core/features/notes`), and `core/state` commands (`note-commands.ts`, `calendar.ts`, picker sources). They create files only through a new `createNote` effect whose adapter calls `createExclusive` (temp file + `link()`, never overwrite).
- **Bases:** a pure ported engine and view models in `src/core/features/bases` with `KANBAN_TYPE` left `undefined`, a `base` file type and editor kind whose window state is created by `EditorKindSpec.open`, a derived and memoized `baseViewModel`, base commands and a cell editor, and frontmatter write-back through `applyBufferEdits` (open note) or a `patchFrontmatter` effect (closed note). `BufferState.readOnly` closes the save gate for `.base` files.
- **Embeds:** `![[x.base#View]]` renders through a new per-file-type `EmbedModelRegistry` answering `PreviewCtx.embedModel`, the `base` block renderer, and the `base` widget painter.
- **Integration:** `main.ts` `registries()`/`main()` and `testRegistries` register everything; `PACKAGE_HOMES.yaml` gains `src/core/features/bases/`; `tour.md` and the live-keystroke bench note gain a base embed.

Canonical detail: section 5 (flows), section 6 (contracts), section 7 (per-file shapes), section 8 (S/V tree).

### Design Coverage

| Source | Chain | Planning meaning | Canonical detail |
|---|---|---|---|
| System design | W26100423LX-REQ1@R2 → DES1–DES4 → S1–S4 → V1–V8, V4a | Daily open-or-create, never overwrite, cursor placement | §1 REQ1; §5 Daily note open or create; §7 `note-commands.ts`, `effects.ts`, `fs.ts` |
| System design | W26100423LX-REQ2@R1 → DES4, DES5 → S5 → V9, V10, V40 | Calendar overlay state and painter | §5 Calendar pick; §7 `calendar.ts`, `ui/overlays/calendar.ts` |
| System design | W26100423LX-REQ3@R2 → DES1, DES2 → S6, S7 → V11, V12, V13 | Moment 2.29.4-exact formatting; Obsidian-exact expansion | §7 `core/time/format.ts`, `notes/template.ts` |
| System design | W26100423LX-REQ4@R2 → DES6, DES8, DES2 → S8 → V14, V15, V16 | Template insert with property merge, one undo step; picker `render` preview | §5 Template insertion; §7 `picker.ts`, `frontmatter-patch.ts` |
| System design | W26100423LX-REQ5@R1 → DES6, DES3, DES4 → S9 → V17, V18 | New-note prompt → template picker → exclusive create | §5 New note; §7 `explorer.ts`/`prompt.ts` |
| System design | W26100423LX-REQ6@R2 → DES7 → S10 → V19 | `[daily]`, `[templates]` config | §7 `config/schema.ts` |
| System design | W26100423LX-REQ7@R2 → DES9, DES10, DES11 → S11–S13 → V20–V25 | Engine port, candidates, `base` file type/kind, read-only, no vim | §7 `features/bases/*`, `filetypes/registry.ts`, `update.ts`/`keys.ts`/`save.ts` |
| System design | W26100423LX-REQ8@R2 → DES9, DES10, DES12, DES14 → S14, S15 → V26–V29, V26a | Table model, summaries, property types, cell edit | §7 `table.ts`, `summaries.ts`, `base-commands.ts` |
| System design | W26100423LX-REQ9@R2 → DES9, DES12, DES13 → S16, S17 → V30–V33 | Kanban behind `KANBAN_TYPE`; V30 pending fixture | §7 `views.ts`, `kanban.ts`, Migration and Delivery |
| System design | W26100423LX-REQ10@R2 → DES8, DES13 → S18, S19 → V34–V37, V34b | Text-level patch, buffer or serial-queue write-back | §5 Cell edit; §7 `frontmatter-patch.ts`, `base-write.ts`, `effects.ts` |
| System design | W26100423LX-REQ11@R1 → DES15 → S20, S21 → V38, V39 | Base embeds via embed-model registry | §5 Base embed render; §7 `embed-models.ts` group |
| System design | W26100423LX-REQ12@R1 → DES11, DES12 → S22 → V41, V42 | Window lifecycle, waiting state, memo | §5 Open a `.base` file, Base re-evaluation; §7 `base-model.ts` |
| System design | W26100423LX-REQ13@R1 → DES16, DES14, DES5 → S23, S24 → V40, V43–V46 | Wiring, boundaries, goldens, bench, integration re-checks | §5 Construction and Wiring Flow; §7 `main.ts`, `boundaries.test.ts` |
| UI design (parent) | RM261003ABZP-UREQ8@R2, UREQ9@R1, UREQ11@R1 → UDES8@R1, UDES9@R1, UDES11@R1 → US6@R1, US7@R1, US9@R1 → UV7@R1, UV8@R1, UV10@R1 | Calendar, template picker, Base table, Kanban board in NO_COLOR, light, 80×24; focused cell/card/selection | System design §1 UI obligations; V10, V16, V40, V45 |

### Applicable Code Shapes

| Source shape | Target | Planning use |
|---|---|---|
| §7 `src/core/time/local.ts`, `format.ts` | `LocalDateTime`, `localDateTime`, `addDays`, `addMonthsClamped`, `formatDate`, `MOMENT_TOKENS` | First pure foundation; every date consumer depends on it |
| §7 `src/core/features/notes/daily.ts`, `template.ts` | `dailyPath`, `parseDailyDate`, `expandTemplate`, `TemplateVars`, `BUILTIN_DAILY_TEMPLATE` | Notes commands and the `createNote` adapter |
| §7 `src/workspace/fs.ts` | `createExclusive` (new), `readTextFile` (+ `createdMs`) | Exclusive create with `link()` and `wx` fallback |
| §7 `src/app/effects.ts` | `run` cases `createNote`, `patchFrontmatter`, `readPropertyTypes` | Serial-queue adapters with own-op tracking and logs |
| §7 `src/core/state/types.ts` | `BufferState.readOnly`, `WindowState.content.kindState/subpath`, `PromptState`, `Overlay.calendar`, `IndexState.types`, restore `then/subpath`, new actions/effects, `AfterOpen` | Shared contract file touched by several groups; land each group's additions with that group |
| §7 `src/core/state/note-commands.ts`, `calendar.ts`, `picker.ts`, `explorer.ts` | `noteCommands`, `openDaily`, `onNoteCreated`, `insertTemplate`, `startNewNote`, `submitNewNote`, `calendarKey`, `PickerSource.render`, sources `templates`/`newNoteTemplates`/`baseViews` | Notes and template features |
| §7 `src/core/config/schema.ts` | `ConfigSchema` (+ `daily`, `templates`), `workspacePath` | Config consumed by notes and pickers |
| §7 `src/core/lang/markdown/frontmatter-patch.ts` | `patchFrontmatter`, `frontmatterValue`, `splitFrontmatter`, `mergeFrontmatter`, `yamlScalar` | Template merge and Bases write-back |
| §7 `src/core/features/bases/*` | `parseBase`, `evaluateExpression`, `evaluateBase`, `summarize`, `propertyType`, `candidatesFrom`, `tableModel`, `kanbanModel`, `BaseLayoutRegistry`, `KANBAN_TYPE`, `baseFileType`, `baseEditorKind`, `baseEmbedRenderer` | Engine and view models ported from Alfred `5fde89b0` |
| §7 links `summarize.ts`, `note-index.ts`, `index-worker.ts`, `state/index.ts` | `NoteSummary` (+ size, ctime), `NoteIndex.facts`, `FromWorker.batch.facts`, `onIndexBatch`, `onPropertyTypesLoaded` | Bases `file.*` fields; `summarize` signature change touches the worker (`index-worker.ts:106`) |
| §7 `src/core/filetypes/registry.ts` | `FileType.readOnly`, `EditorKindSpec.open(path, text, subpath?)` | Generic seams for the `base` kind |
| §7 `update.ts`, `keys.ts`, `save.ts`, `buffers.ts`, `session.ts`, `jumps.ts`, `link-commands.ts`, `commands.ts` | `syncEditorKinds` (calls `open`), `Registries` (+ `embedModels`, `layouts`), `routeKey`, `bindingOrVim`, `writable`/`writeBuffer`, `openPath` opts, `fillRestored`, `goTo`, `followLink`, `EX_ALIASES` | State wiring |
| §7 `base-model.ts`, `base-commands.ts`, `base-write.ts` | `baseViewModel`, `baseViewContext`, `baseEmbedModel`, `baseCommands`, `baseBindings`, `cellEditKey`, `moveCard`, `writeProperty`, `onFrontmatterPatched` | Base window behavior |
| §7 `embed-models.ts`, `live-preview.ts`, `markdown-view.ts`, `embeds.ts` | `EmbedModelRegistry`, `PreviewCtx.embedModel`, `markdownViewContext` (→ `markdownViewContextFor(reg)` per §7 `main.ts`), `embedTargets`, `syncEmbeds(reg)` | Base embeds |
| §7 `ui/editors/registry.ts`, `text-view.ts`, `window-tree.ts`, `base-view.ts`, `widgets/base.ts` | `WindowView`, `BaseView`, `paintBaseTable`, `paintBaseBoard`, `paintBaseEmbed` | Bases UI |
| §7 `ui/overlays/calendar.ts`, `shell.ts`, `overlays/picker.ts`, `overlays/prompt.ts` | `CalendarOverlay`, preview via `render`, newNote path preview | Notes UI |
| §7 `src/app/main.ts`, `test/support/state.ts` | `registries()`, `main()`, `testRegistries` (+ `kanban-test`) | Composition; both must stay mirrored |
| §7 `test/boundaries.test.ts` | `PACKAGE_HOMES.yaml` | Declares the new `yaml` home |

### Runtime Flow

```text
Notes:  key/Ex → note-commands → (index hit) openPath{then} | createNote effect
        → runner(serial): read template → expandTemplate → createExclusive → noteCreated
        → onNoteCreated → openPath{then} → fillRestored/placeAfterOpen
Calendar: <leader>np → overlay calendar → calendarKey → Enter → openDaily
Template: <leader>nt → picker templates (render preview) → insertTemplate → applyBufferEdits (1 undo)
Bases:  open .base → fileLoaded{readOnly} → syncEditorKinds → open(path,text,subpath) → kindState
        → BaseView → viewContexts("base") → baseViewModel (memo) → table | board
        keys → cellEditKey | base bindings (never vim) → writeProperty
        → open note: applyBufferEdits | closed: patchFrontmatter effect → read-check-patch-atomicWrite → frontmatterPatched
Embed:  ![[x.base#V]] → syncEmbeds (embedModels.has) → read{embed} → livePreview → baseEmbedRenderer
        → ctx.embedModel → widget "base" → paintBaseEmbed ; Enter → followLink → goTo{subpath}
```

### Roadmap Validation

- **Accepted binding:** `w26100423lx-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH2@R5, RM261003ABZP-DI4@R2; Previous Accepted Bindings: None).
- **Parent-to-child coverage:** `w26100423lx-system-design.md` section 1, Assigned Parent Obligation Coverage (lines 227–307): Daily notes and templates, S6/V9, Bases, S7/V10, Language-neutral kernel, UI obligations (M5@R2, M6@R1, UREQ8/9/11, UDES8/9/11, US6/7/9 via UV7/8/10), Cross-work integration (V7@R2, V12@R3, V16@R2, UV3@R2).
- **Baseline assessment:** Aligned. Re-checked 2026-10-04: the branch merge base is `main` `d398ad7` (the commit the design checked), and `git diff main..HEAD` shows no change under `rm261003abzp-so-v1/`, `src/`, or `test/`. The index Approval still lists PH2@R5 and DI4@R2 (`rm261003abzp-roadmap-index.md:134`); the phase Approval still lists them (`rm261003abzp-roadmap-phase-2-obsidian-experience.md:596–613`); the parent UI design is `Ready for Planning` (`rm261003abzp-ui-design.md:5`). DI4 has no other W binding (index line 134 and phase Progress line 590 show Work `Pending`).
- **Unresolved impacts:** None blocking. Pending parent synchronization proposals remain for the orchestrator and are not technical blockers: the discussion-stage W assignment (discuss-context Parent Synchronization), and the design's refinements 1–6 plus items 1–3 (Kanban enablement, evaluator semantics, summaries source; system design lines 239–243).

### Cross-Work Dependency Gates

- **G3 — DI2 outputs for DI4**
  - **Parent Gate:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md:70`
  - **Producer:** RM261003ABZP-DI2@R2 — W261003FX70 (PR #2)
  - **Required Output:** the `Picker` with preview, the `Prompt`, NoteIndex paths and frontmatter in summaries, `FileTypeRegistry` and `editorViews`, and the `search` and `write` effects
  - **Required Before:** DI4 execution
  - **Evidence / Pending Condition:** Satisfied — merged as `9adb285`; PH1 exit recorded (phase Progress line 590; index line 145)
  - **Integration Owner:** RM261003ABZP-DI4@R2 — W26100423LX
- **G4 — DI3 embed registries for the base embed**
  - **Parent Gate:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md:71`
  - **Producer:** RM261003ABZP-DI3@R4 — W261003S6BQ (PR #6)
  - **Required Output:** the `blockRenderers` registry, `widget` decorations with row reservation, the `widgetPainters` registry, and unlisted embed buffers
  - **Required Before:** DI4 execution of the `![[file.base]]` embed renderer; the DI4 PR merges after DI3
  - **Evidence / Pending Condition:** Satisfied — DI3 merged as `e228bb5` with RM261003ABZP-V7@R2 and V16@R2 passing (phase Progress line 590); `registerBlockRenderer` in `src/core/lang/markdown/live-preview.ts`, `registerWidgetPainter` in `src/ui/widgets/registry.ts`, unlisted embeds in `src/core/state/embeds.ts`
  - **Integration Owner:** RM261003ABZP-DI4@R2 — W26100423LX (owns re-passing V7@R2, V12@R3, V16@R2, UV3@R2; phase line 553)

## 3. Binding Constraints

| Constraint | Source | Planning implication |
|---|---|---|
| Plan behavior: Not established | `.s1mple/S1MPLE.md` §3 Plan | Follow the s1mple-plan skill defaults |
| Implementation: keep it lean and simple | `.s1mple/S1MPLE.md` §3 Implementation | No abstractions beyond the design's registries and seams |
| No work-process identifiers (W/REQ/DES/S/V/phase/goal IDs) in code, comments, identifiers, test names, log messages | `.s1mple/S1MPLE.md:63`; `docs/languages/typescript.md` Coding Conventions | Test names describe behavior; V-IDs live only in plan/goal documents |
| Verification: Not established | `.s1mple/S1MPLE.md` §3 Verification | Use the design's §8 tree, `bun run check`, `bun run test:ci`, `bun run bench` |
| Delivery: open a PR; CI must pass; resolve base conflicts; move the work folder to `work/done/` and update `.s1mple/` references; push again with CI green; never force-push or merge without user approval | `.s1mple/S1MPLE.md` §3 Delivery | Final delivery group; no merge or release without approval |
| Every delegated agent reads and follows `.s1mple/S1MPLE.md` | s1mple-plan Principle 1 | Put the requirement in every execution prompt |
| `src/core` pure; layer rules and package homes | `docs/project.md` Boundaries; `test/boundaries.test.ts:9-15,33-56` | `features/*`, `time` never import `core/state`; `yaml` only in `lang/markdown` and (after change) `features/bases` |
| `update` pure; adapters only run effects and answer actions | `src/core/state/update.ts`; `docs/languages/typescript.md` Error Handling | New file I/O only in `src/app/effects.ts` and `src/workspace` |
| All file writes on the serial queue with own-op tracking | `src/app/effects.ts:211-275` | `createNote`, `patchFrontmatter` join the queue |
| Create never replaces an entry | `src/workspace/fs.ts:171-186`; phase file 253–271 | `createExclusive` keeps E13 semantics |
| Exact pins; no new dependency; `yaml` 2.9.1 present | `docs/project.md` Constraints | `package.json`, `bun.lock` unchanged |
| `bun run check` < 30 s, CI < 3 min | RM261003ABZP-REQ10@R4 | Bases unit suites in `check`; integration/golden in `test:ci` only |
| `.base` never written; no Kanban before the fixture; no expression widening; no `.base` special case outside its registration | phase file 477–482; system design §7 Migration and Delivery | `KANBAN_TYPE` stays `undefined`; V20 search |
| CI on PRs only; no tag or release unless asked | memory `ci-pull-request-only`, `manual-releases-only`; `docs/project.md` Release | No workflow change, no tag |
| Subagents kill processes they start; check orphans before benches | memory `subagent-process-cleanup` | Include in execution prompts that run `bench` or PTY tests |
| Perf gates do not block development | memory `perf-gates-dont-block` | If V44 regresses, apply quick speedups or propose relaxing the threshold rather than stall |

## 4. Supporting Evidence

### Requirements

| Requirement | Design coverage | Required outcome |
|---|---|---|
| `W26100423LX-REQ1@R2` | DES1–DES4 | `:Today`/`:Yesterday`/`:Tomorrow` open or create from template; never overwrite; cursor on first unchecked task |
| `W26100423LX-REQ2@R1` | DES4, DES5 | Calendar picker with marks; Enter opens or creates |
| `W26100423LX-REQ3@R2` | DES1, DES2 | Moment 2.29.4 strings; Obsidian-exact expansion |
| `W26100423LX-REQ4@R2` | DES6, DES8, DES2 | Template insert in one undo step with property merge |
| `W26100423LX-REQ5@R1` | DES6, DES3, DES4 | New note from template; refuses existing |
| `W26100423LX-REQ6@R2` | DES7 | `[daily]`/`[templates]` defaults and validation |
| `W26100423LX-REQ7@R2` | DES9–DES11 | Ported engine; `base` file type/kind by registration; no vim, no `.base` write |
| `W26100423LX-REQ8@R2` | DES9, DES10, DES12, DES14 | Table, summaries, typed cell edit |
| `W26100423LX-REQ9@R2` | DES9, DES12, DES13 | Kanban behind `KANBAN_TYPE`; moves write the group property |
| `W26100423LX-REQ10@R2` | DES8, DES13 | Comment-preserving one-key patches; stale writes refused |
| `W26100423LX-REQ11@R1` | DES15 | Base embeds render and `Enter` opens the view |
| `W26100423LX-REQ12@R1` | DES11, DES12 | Waiting, re-evaluation keeping focus, restore |
| `W26100423LX-REQ13@R1` | DES16, DES14, DES5 | Integration re-checks, goldens, bench, boundaries |
| `RM261003ABZP-UREQ8@R2`, `UREQ9@R1`, `UREQ11@R1` (parent) | DES5, DES6, DES14 | DI4 surfaces per M5@R2/M6@R1 in NO_COLOR, light, 80×24 |

### Research Findings

| Finding | Relevance | Planning implication |
|---|---|---|
| `RF1` | Kanban `type` unconfirmed | `KANBAN_TYPE` undefined; test-only `kanban-test`; V30 recorded as pending |
| `RF2` | `groupOrder` drives columns and hiding | `tableModel`/`kanbanModel` honor `groupOrder` (V26, V31) |
| `RF3` | Obsidian parser strictness | Rejection warnings in parser/evaluator (V24) |
| `RF4` | Obsidian expressions beyond Alfred's subset | `filter_hides_rows` diagnostics; `inFolder`/`hasTag` semantics (V23, V24) |
| `RF5` | `types.json` and value-shape inference; whole-frontmatter rewrite by Obsidian | `propertyType`; `yamlScalar` quoting (V28, V34b) |
| `RF6` | Case-insensitive, whitespace-strict variables | `expandTemplate` regexes (V13) |
| `RF7` | Local time, never overwrite, title = formatted date | `openDaily`, `createExclusive` (V2, V5, V7) |
| `RF8` | Template property merge; new notes at root | `mergeFrontmatter`, `note.new` path (V15, V17) |
| `RF9` | Moment greedy tokenization | Full token table, longest match (V11, V12) |

## 5. Project Implementation Context

### Relevant Structure

```text
src/
├── app/{main,effects}.ts                    composition, serial effect runner
├── workspace/{fs,index-worker}.ts (+ property-types.ts)
├── core/
│   ├── time/ (new; already in PURE_CORE)    features/{links, notes (new), bases (new)}
│   ├── lang/markdown/{live-preview,render-key,scan}.ts (+ frontmatter-patch.ts)
│   ├── filetypes/registry.ts    config/schema.ts
│   └── state/{types,update,keys,save,buffers,session,jumps,link-commands,commands,explorer,picker,embeds,markdown-view,index}.ts (+ note-commands, calendar, base-model, base-commands, base-write, embed-models)
└── ui/{editors/{registry,text-view}.ts, views/window-tree.ts, widgets/, overlays/{picker,prompt}.ts, shell.ts} (+ base-view, widgets/base, overlays/calendar)
test/{boundaries.test.ts, support/{state,ui}.ts, fixtures/{tour.md,generate.ts,workspace/,bases/ (new)}, integration/, ui/, bench/}
```

### Established Patterns

| Pattern | Evidence | Planning use |
|---|---|---|
| Composition root registers file types, commands, bindings, view contexts | `src/app/main.ts:111-136` | Add DI4 registrations here |
| Test registries mirror `registries()` | `test/support/state.ts:41-66` | Mirror every registration plus `kanban-test` |
| Editor views and widget painters registered in `main()` | `src/app/main.ts:241-246` | `registerEditorView("base")`, `registerWidgetPainter("base")` |
| `EditorKindSpec.open` exists with no caller | `src/core/filetypes/registry.ts:16-19` | Add `subpath`; `syncEditorKinds` becomes the caller |
| Editor kind chosen after each reducer step | `src/core/state/update.ts:67-88` | Create `kindState` when the kind changes |
| Unbound keys fall to vim | `src/core/state/keys.ts:117-119` | Drop keys for non-text kinds |
| Single save gate | `src/core/state/save.ts:25-26` | Add `readOnly` check |
| Exclusive empty create with `wx` and E13 | `src/workspace/fs.ts:171-186` | `createExclusive` with content, `link()`, `wx` fallback |
| Serial queue with `follow` and own-op tracking | `src/app/effects.ts:209-262` | New `createNote`, `patchFrontmatter` cases |
| Note-only embed targets | `src/core/state/embeds.ts:13-23` | Extend via `embedModels.has(fileType)` |
| `PickerSource` without a render hook | `src/core/state/picker.ts:41-59` | Add `render`, `previewAlways` |
| `editorViews` typed to the text `EditorView` | `src/ui/editors/registry.ts:1-12` | Introduce `WindowView` |
| File-type-scoped bindings in a `core/state` command module | `src/core/state/markdown-commands.ts:146-149` | `noteBindings`, `baseBindings` |
| Component tests seed the index and embed buffers by dispatching `indexBatch` and `fileLoaded` | `test/ui/live-preview.test.ts:73-86`; `test/support/ui.ts:23-40` | V40/V45/V46 and the bench must seed `tasks.base` and task notes |

### Code Surfaces

| Path | Current symbol or wiring | Intended change | Evidence |
|---|---|---|---|
| `src/app/main.ts` | `registries()`, `main()` | Register all DI4 pieces; `readPropertyTypes` after first frame | `main.ts:111-136,238-246` |
| `src/app/effects.ts` | `run` | `createNote`, `patchFrontmatter`, `readPropertyTypes` | `effects.ts:209-262` |
| `src/workspace/fs.ts` | `createEntry`, `readTextFile` | `createExclusive`; `createdMs` | `fs.ts:171-186` |
| `src/workspace/property-types.ts` | New | `readPropertyTypes` | §7 |
| `src/workspace/index-worker.ts` | `walk`, `summarizeFile` | size, ctime, file facts | `index-worker.ts:106` |
| `src/core/time/*`, `features/notes/*`, `features/bases/*` | New | Pure modules | §4 tree |
| `src/core/features/links/{summarize,note-index}.ts` | `summarize`, `NoteIndex` | facts, size, ctime | `summarize.ts:38` |
| `src/core/lang/markdown/frontmatter-patch.ts` | New | Patcher | §7 |
| `src/core/lang/markdown/live-preview.ts` | `PreviewCtx` | + `embedModel` | §7 |
| `src/core/filetypes/registry.ts` | `FileType`, `EditorKindSpec` | `readOnly`, `open(…, subpath?)` | `registry.ts:16-19` |
| `src/core/config/schema.ts` | `ConfigSchema` | `daily`, `templates` | §7 |
| `src/core/state/*` (modified) | see §4 tree | contracts, routing, gates, embeds | §4, §7 |
| `src/core/state/*` (new) | `note-commands`, `calendar`, `base-model`, `base-commands`, `base-write`, `embed-models` | New | §4 |
| `src/ui/*` | `editorViews`, `WindowTree`, picker/prompt overlays, shell | `WindowView`, `BaseView`, base widgets, `CalendarOverlay` | `ui/editors/registry.ts:1-12` |
| `test/boundaries.test.ts` | `PACKAGE_HOMES.yaml` | + `src/core/features/bases/` | `boundaries.test.ts:51` |
| `test/support/state.ts` | `testRegistries` | Mirror + `kanban-test` | `state.ts:41-66` |
| `test/fixtures/{tour.md,generate.ts}` | tour, `make5000LineNote` | Base embed; `tasks.base` beside the note | `generate.ts:13` |
| `test/bench/live-keystroke.bench.ts` | Opens the note text via `mountShell` | Seed index/embed so the base embed evaluates | `live-keystroke.bench.ts:1-20` |

### Verification Surfaces

| Suite or check | Location or command | Required verification |
|---|---|---|
| Unit suites | colocated `src/**/*.test.ts` via `bun run check` | V1, V2, V4, V4a, V8, V9, V11–V15, V17, V19, V21–V29, V26a, V31–V35, V34b, V37–V39, V41, V42 |
| Integration | `test/integration/{notes,bases-write}.test.ts` via `bun run test:ci` | V3, V5, V6, V7, V18, V36 |
| Component goldens | `test/ui/{notes,bases}.golden.test.ts`, `test/ui/live-preview.test.ts` | V10, V16, V40, V45, V46 |
| Type/build/boundaries | `bun run check`, `bun run test:ci` (incl. `test/ui/extension.test.ts`) | V43; check < 30 s |
| Benchmark | `bun run bench` | V44: `liveKeystrokeP95` within 2× of 24 ms |
| Reference search | `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` | V20: no match |
| Kanban fixture | `test/fixtures/bases/obsidian-kanban.base` + README | V30: pending until the user supplies the fixture |
| CI | `.github/workflows/ci.yml` on the PR | `check` and `test` (ubuntu-24.04, macos-15) green |

## 6. Additional Inspections

| Planning question | Files inspected | Finding |
|---|---|---|
| Has `main` or the parent moved since the design? | `git merge-base HEAD main`; `git diff main..HEAD -- rm261003abzp-so-v1 src test` | Merge base `d398ad7`, the same commit the design checked; no source or parent change on the branch |
| Do design-cited current shapes match? | `registry.ts:16-19`, `update.ts:67-88`, `keys.ts:117-119`, `save.ts:25-26`, `fs.ts:171-186`, `effects.ts:209-262`, `boundaries.test.ts:45-56`, `main.ts:111-136,238-246`, `test/support/state.ts:41-66`, `ui/editors/registry.ts`, `embeds.ts:13-23`, `picker.ts:41-59` | All match the design's "current shape" citations |
| How do component tests and the bench get a loaded index and embed buffer? | `test/ui/live-preview.test.ts:73-86`, `test/support/ui.ts:23-61`, `test/bench/live-keystroke.bench.ts` | Tests dispatch `indexBatch` and `fileLoaded` directly; the bench currently only opens the note text, so it must also seed `tasks.base`, its notes, and the embed load, or the embed stays `loading`/`missing` and V44 would not measure evaluation |
| Is the Alfred porting source available at the pinned commit? | `/Users/hieunguyen/git/hieu/projects/alfred` | HEAD `5fde89b0`; `packages/vault/src/domain/bases/{parser,expression,evaluator,types,frontmatter,yaml-patcher}.ts` present |
| Is the parent UI design ready? | `rm261003abzp-ui-design.md:3-5` | `Ready for Planning` |

## 7. Planning Gaps

| Gap | Classification | Evidence or blocker |
|---|---|---|
| V30 cannot pass until the user supplies an Obsidian ≥ 1.14.3 Kanban `.base` | Resolved from project evidence | Design §7 Migration and Delivery and §8 V30: ship with `KANBAN_TYPE` undefined, README provenance slot, record V30 as pending; whether the PR may merge before the fixture is a parent progress decision for the user at delivery |
| The live-keystroke bench and V46 need the base embed's target and candidates loaded | Resolved from project evidence | Seed via `indexBatch` + `fileLoaded` as `test/ui/live-preview.test.ts:73-86` does |
| `src/core/state/types.ts`, `update.ts`, `effects.ts`, `main.ts`, `test/support/state.ts` are touched by several groups | Resolved from project evidence | Each group adds only its own variants and registrations; sequence groups so the file compiles after each |
| Parent synchronization (W assignment; design refinements 1–6 and items 1–3) is pending | Resolved from project evidence | Orchestrator-owned; parent writes need explicit authorization; not a technical blocker |

## 8. Planning Handoff

- **Scope:** Every file in system design §4 (added and modified, source and test), all S1–S24 and V1–V46 (including V4a, V26a, V34b), the DI4 cross-work integration re-checks (V7@R2, V12@R3, V16@R2, UV3@R2 via V43, V44, V46), and the s1mple Delivery steps.
- **Primary boundaries:** `src/core/time`, `src/core/features/notes`, `src/core/features/bases`, `src/core/lang/markdown/frontmatter-patch.ts`, `src/core/config`, `src/core/filetypes`, `src/core/state`, `src/workspace`, `src/app`, `src/ui`, `test/`.
- **Likely sequence:**
  1. Pure foundations: `core/time`, `features/notes`, `frontmatter-patch`, config schema (V1, V4, V4a, V11–V13, V15, V19, V34, V34b).
  2. Notes state and I/O: types additions, `createExclusive`, `createNote` effect, note commands, calendar, picker `render`, templates and new-note flow, notes UI overlays, wiring, notes integration and goldens (V2, V3, V5–V10, V14, V16–V18).
  3. Bases engine and index facts: ported engine, summaries, property types, candidates, table/kanban/views, `NoteSummary` facts, worker, `readPropertyTypes`, `PACKAGE_HOMES` (V21–V24, V26, V26a, V28, V31–V33).
  4. Base editor kind and write-back: `readOnly`, `kindState`/`open`, key routing, save gate, base model/commands/write, `patchFrontmatter` effect, `WindowView`/`BaseView`/painters, wiring, bases integration and goldens (V20, V25, V27, V29, V35–V37, V40–V42, V45).
  5. Base embeds and integration: embed-model registry, `PreviewCtx.embedModel`, `syncEmbeds`, `followLink`/`goTo` subpath, embed renderer and painter, `tour.md`, bench fixture, full check, CI, bench (V38, V39, V43, V44, V46; V30 pending).
  6. Delivery: PR, CI, work folder move, push.
- **Verification focus:** never-overwrite create (V3, V5, V6), stale-write refusal (V36), comment-preserving patch (V34), Moment fidelity (V11, V12), no vim / no `.base` write (V25), memo (V42), bench (V44), boundary and type checks (V43).
- **Excluded scope:** Writing `.base` files; Cards/List/Map layouts (table fallback with notice); configurable week start; template scripting beyond the listed variables; widening the expression subset; kernel changes; PH2 exit record, release dry run, and any release; parent file edits without authorization.
- **Blocking items:** None.
