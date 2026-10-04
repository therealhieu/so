# P1-G2 Verification Report

## Scope

- **Group:** `P1-G2`
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`, `P1-G2-T6`
- **Report:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/reports/p1-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/reports/p1-g2-implementation-report.md`

Verified range: `f5c6a1b..2652dc9` (task commits `d899132`, `d0c5fe4`, `bb494b6`, `5846289`, `24274cc`, `2652dc9`), inspected at `HEAD` `ca5a8e5` with a clean tree. `ca5a8e5` adds only the implementation report, so the code under test equals `2652dc9`. Baseline `main` is `d398ad7` (`git merge-base HEAD main`), an ancestor of `HEAD`.

Gate G3 (DI2 outputs) was recorded `Satisfied` in the goal's Gate Evidence by `fb86f9c`, which is an ancestor of the group's first task commit `d899132` (`git merge-base --is-ancestor fb86f9c d899132` → true). `9adb285` (DI2, PR #2) is an ancestor of `HEAD`. The consumed DI2 contracts are intact: `PickerSource.preview` keeps its signature and only gains optional members; existing `PromptState` constructions compile through the new `ExplorerPrompt` arm; `NoteIndex.files` is read unchanged; the `read`/`readPreview` effects are reused unchanged. `git diff f5c6a1b..2652dc9 -- .s1mple package.json bun.lock .github biome.json knip.json tsconfig.json` is empty, so no parent or planning file and no dependency changed.

## Status

`Failed`

All six task outcomes are implemented and every assigned V case, `bun run check`, and `bun run test:ci` pass. The never-overwrite create, serial-queue execution with own-op tracking, `update` purity, layer rules, and the registries mirror all hold. The group fails on three Minor findings: the empty template picker omits the required "create one" hint (`P1-G2-VER1`), two changed behaviors have no test (`P1-G2-VER2`), and the colour and light calendar goldens are text-only, so they carry no style evidence (`P1-G2-VER3`).

## Assigned Traceability

- **System Design:** `W26100423LX-REQ1@R2, REQ2@R1, REQ4@R2, REQ5@R1, REQ13@R1 → DES2, DES3, DES4, DES5, DES6 → S1, S2, S3, S4, S5, S8, S9, S24 → V2, V3, V5, V6, V7, V8, V9, V10, V14, V16, V17, V18` (plan part 1, P1-G2 Coverage Summary; the orchestrator's chain listed DES3–DES6, and the plan adds DES2 through T2 and T4)
- **UI Design:** `RM261003ABZP-UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1`; `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` (calendar and template picker, through V10 and V16)

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1@R2, REQ5@R1 → DES3 → S3 → V3, V6` (primitive) | `None` | `createExclusive` publishes the full text through a private temp file and `link()`, falls back to `open(wx)` without hard links, never modifies an existing entry or case variant, and leaves no temp file | `src/workspace/fs.ts:204-243` (`createExclusive`: temp `wx 0600` → write → sync → `chmod 0644` → `link`; `EEXIST` → `{ created: false }`; `EPERM/ENOTSUP/EXDEV/EOPNOTSUPP` → `createByOpen`; `finally rm(tmp)`), `:246-269` (`createByOpen`); `createEntry` unchanged | `Satisfied` |
| `REQ1@R2 → DES2, DES3, DES4 → S1, S2, S3, S4 → V2, V3, V5, V6, V7, V8` | `None` | `:Today`/`:Yesterday`/`:Tomorrow`/`<leader>nd` open a case-insensitive index match or emit one `createNote`; the runner reads and expands the template inside the serial queue, records the own op, notifies the index, logs paths only, and answers `noteCreated`; the note opens with the cursor on the first open task or at the end | `src/core/state/note-commands.ts:46-61` (`findPathInsensitive`, `WeakMap` per `NoteIndex`), `:67-87` (`openDaily`), `:90-97` (`relativeDay`), `:103-139` (`onNoteCreated`, toasts); `src/app/effects.ts:147-161` (`templateText`), `:296-340` (`createNote` in `serial`, `ownOps.noteWrite`, `index.notify`, `notes.created`/`notes.createFailed`/`notes.createFallback` with path fields only); `src/core/state/buffers.ts:336-368` (`openPath` with `opts`), `:378-417` (`placeAfterOpen`); `src/core/state/session.ts:219-228` (`fillRestored` applies `after`); `src/core/state/commands.ts:79-81` (Ex aliases); `src/core/state/update.ts:151` | `Satisfied` |
| `REQ2@R1 → DES4, DES5 → S5 → V9` | `UREQ8@R2 → UDES8@R1` | `<leader>np` opens the calendar on today; `h/l/j/k/H/L/t/Esc/Enter` handled purely with month clamping; marks from the index only; announcement on the message line; Enter → `openDaily` | `src/core/state/calendar.ts:32-40` (`calendarMarks`, index lookups only), `:43-59` (announcement `"<ddd> YYYY-MM-DD · note exists\|no note"`), `:62-70` (`openCalendar`), `:79-108` (`calendarKey`); `src/core/state/keys.ts:81` (`routeKey` case before bindings); `types.ts` `CalendarState`, `Overlay.calendar` | `Satisfied` |
| `REQ4@R2 → DES2, DES6, DES8 → S8 → V14` | `UREQ8@R2 → UDES8@R1` | `templates` source lists `.md` files under `[templates] folder`, always loads the preview, renders source `▸` expansion, and inserts whole at 1:1 or body plus merged properties in one undo step; empty list says `No templates in <folder>/` with a hint to create one | `src/core/state/picker.ts:196-202` (`templatePaths`), `:248-266` (`templatePreview`), `:370-388` (`templates` source), `:507-508` (`previewAlways` in `requestPreview`), `:660-663` (`Tab` toggle); `note-commands.ts:167-209` (`insertTemplate` → one `applyBufferEdits`); `src/ui/overlays/picker.ts` (`paintLines`, narrow toggle). The empty state lacks the create hint (`P1-G2-VER1`) | `Mismatch` |
| `REQ5@R1 → DES3, DES4, DES6 → S9 → V17, V18` | `UREQ8@R2 → UDES8@R1` | `<leader>nn` prompt validates the title and previews `→ <path>.md`; `(blank note)` first; accept emits `createNote` with `after: "insert"`; `exists` → `E13` toast, nothing opened; `Esc` at either step creates nothing | `src/core/state/explorer.ts:359` (routes `newNote` before explorer branches), `:406-416` (`newNoteTitleError`), `:418-419` (`newNotePath`), `:422-452` (`newNotePromptKey`); `note-commands.ts:212-230` (`startNewNote`, `submitNewNote`), `:115-116` (E13); `picker.ts:389-425` (`newNoteTemplates`); `src/ui/overlays/prompt.ts:32-48` (path preview and inline reason, probed: `→ a/b.md`, `✗ title is empty`) | `Satisfied` |
| `REQ2@R1, REQ4@R2, REQ13@R1 → DES5, DES6 → S5, S8, S24 → V10, V16` | `UREQ8@R2 → UDES8@R1 → US6@R1 via UV7@R1`; `UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1` | Fixed 36×12 Monday-first calendar with `•`, today underlined, selection reversed and bracketed, hardware cursor on the day; template picker preview at 120 columns, hidden at 90 until `Tab`; legible in colour, `NO_COLOR`, light at 80×24 | `src/ui/overlays/calendar.ts:15-143` (`CalendarOverlay`, `indexing` hint when the index is not ready); `src/ui/shell.ts:138`; `src/ui/theme.ts` `calendarMark` (`tag` token per the parent Calendar component); `test/ui/notes.golden.test.ts`. Colour and light calendar goldens carry no style evidence (`P1-G2-VER3`) | `Satisfied` |
| G3 — DI2 outputs (satisfied `9adb285`) | `None` | Recorded before P1-G2 and consumed unchanged | `fb86f9c` ancestor of `d899132`; `9adb285` ancestor of `HEAD`; DI2 contracts extended only additively | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V3`, `V6` (primitive) | `S3` | `DES3` | `bun test src/workspace/fs.test.ts` | Full text and mode `0644`; second call `{ created: false }` with bytes and mtime unchanged; case variant refused (the temp volume is case-insensitive, so the case ran); `EPERM` from a spied `link` takes the `wx` fallback and refuses the second call; read-only folder rejects; no `.so-new-` file in any case | `Passed` |
| `V2` | `S1`, `S3` | `DES4` | `bun test src/core/state/note-commands.test.ts` | One `createNote { path "daily/2026-10-03.md", template "templates/daily.md", fallback "# {{date}}", vars.title "2026-10-03", after "firstTask", reason "daily" }`; indexed `Daily/2026-10-03.MD` → `read` of that path, no `createNote` | `Passed` |
| `V8` | `S4` | `DES3`, `DES4` | same suite | Created note → cursor `{ line: 2, col: 6 }` on `- [ ] b`; no task → end of file; open buffer placed at once; `insert` → Insert mode at EOF and typing appends; `unreadable` → error toast naming the template; `failed` → error toast, no `read` | `Passed` |
| `V5` | `S1`, `S3` | `DES3` | `bun test test/integration/notes.test.ts` | First `:Today` writes the expanded fixture and places the cursor on the empty task; second `:Today` answers `exists`, bytes and `mtimeMs` unchanged, zero `write` effects | `Passed` |
| `V3` | `S3` | `DES3` | same suite | A file written before the unindexed `:Today` → `exists`, bytes unchanged, opened at its open task, no temp file; case variant `daily/2026-10-03.MD` → `exists`, unchanged | `Passed` |
| `V6` | `S3`, `S4` | `DES3` | same suite | Missing template → `# 2026-10-03`; NUL-byte template → empty note plus error toast; `0555` folder → `failed`, folder empty, error toast, nothing opened | `Passed` |
| `V7` | `S2` | `DES2`, `DES4` | same suite | `:Yesterday` from `daily/2026/10/2026-10-03.md` with format `YYYY/MM/YYYY-MM-DD` → `daily/2026/10/2026-10-02.md` with `date: 2026-10-02`; `so.log` has one `notes.created` line with path and flag and no note text | `Passed` |
| `V18` | `S9` | `DES3`, `DES6` | same suite | `<leader>nn Meeting` → `(blank note)` → empty `Meeting.md` in Insert mode; again with `templates/meeting.md` → `exists`, `E13: File exists (Meeting.md)`, file still empty, no temp file | `Passed` |
| `V9` | `S5` | `DES5` | `bun test src/core/state/calendar.test.ts` | Opens on 2026-10-03 with `Sat 2026-10-03 · no note`; `l` → 10-04, `lj` → 10-11, `kh` → 09-25 with the month following, `L` → 11-03, `t` → 10-03; `H` from 03-31 → 02-28; `Esc` closes; unbound `x` keeps the calendar; `Enter` → `createNote` for 10-04; marks `{1, 2}` (one case variant); an indexed day opens with `read` | `Passed` |
| `V14` | `S8` | `DES6`, `DES8` | `bun test src/core/state/note-commands.test.ts` | At 0:0 the whole expansion goes in and one `u` restores `hello`; mid-note body at cursor, `tags` `[work, meeting]`, `status` kept, one frontmatter block, cursor after the body, one `u` restores exactly; accept before load → `loading template…`, picker stays open; non-Markdown → `not available for typescript files` | `Passed` |
| `V17` | `S9` | `DES6` | same suite | `../x`, `/x`, `a/./b`, `a//b`, and empty set `invalid` and block Enter; `newNotePath("a/b")` → `a/b.md`; `(blank note)` first; blank and templated accepts emit the expected `createNote`; `Esc` at both steps emits nothing; `exists`/`new` → E13 toast, active buffer unchanged | `Passed` |
| `V10` | `S5`, `S24` | `DES5` | `bun test test/ui/notes.golden.test.ts` | Snapshots at 80×24 for colour, `NO_COLOR`, light; `[ 1•]` selected with the hardware cursor on its digits; Oct 1 in the Thursday column; `NO_COLOR` spans use only `default` colours, today has `UNDERLINE`, the selection has `INVERSE`, marks show `•`. Colour and light snapshots are identical text (`P1-G2-VER3`) | `Passed` |
| `V16` | `S8`, `S24` | `DES6` | same suite | At 120 columns the preview shows source, `▸`, and `## standup · Sat, Oct 3rd`; at 90 columns the preview is hidden with `Tab preview` in the footer and shown after `Tab` | `Passed` |
| `UV7@R1` (via V9, V10, V14, V16, V18) | `US6@R1` | `UDES8@R1` | inspection of the suites above | Monday-first grid with Oct 1 in column 4, `•` on 10-01/10-02, `L` 3 Oct → 3 Nov, `t` back, preview source above expansion, one-`u` undo, new note in Insert mode. The parent's `garden-plan.md` example differs from approved REQ5@R1 (`Garden plan.md`), already listed for parent synchronization in the plan index | `Passed` |
| `UV10@R1` (via V10, V16) | `US9@R1` | `UDES11@R1` | inspection of `notes.golden.test.ts` | Calendar selection and today distinguishable by attributes and glyphs under `NO_COLOR`; fits 80×24; light goldens match but hold text only (`P1-G2-VER3`) | `Passed` |
| Notes unit suites | — | — | `bun test src/core/state/note-commands.test.ts src/core/state/calendar.test.ts src/workspace/fs.test.ts` | 41 pass, 0 fail | `Passed` |
| Notes suites across time zones | — | — | the unit, golden, and integration notes suites with `TZ` `UTC`, `America/New_York`, `Pacific/Kiritimati` | 40 pass, 0 fail in each | `Passed` |
| Fast gate | — | — | `bun run check` | Biome clean, `tsc` clean, knip clean, 822 pass, 0 fail; 4.3 s | `Passed` |
| Full suites | — | — | orphan check (`pgrep -fl 'bin/so\|src/app/main.ts\|bun test\|index-worker'` → none), `bun run test:ci`, orphan check again → none | 158 pass, 0 fail, 34 snapshots, 24 files, 31.9 s | `Passed` |
| Existing goldens | — | — | `git diff --stat f5c6a1b..2652dc9 -- test/ui/__snapshots__` | Only the new `notes.golden.test.ts.snap` | `Passed` |
| Registration mirror | — | `DES16` wiring | inspection | `src/app/main.ts:124,138,140` and `test/support/state.ts:54,68,70` register the same `noteCommands`, `noteBindings`, `noteGroups` | `Passed` |
| Work-process identifiers | — | S1MPLE Implementation rule | `rg -n "W26100423LX\|RM261003\|REQ[0-9]\|DES[0-9]\|UDES\|\bUV?[0-9]+\b\|P[0-9]-G[0-9]"` over every changed non-snapshot file | No match | `Passed` |
| `update` purity and layers | — | `DES3`, `DES4` | `rg` for clocks and runtime imports in `src/core`; `test/boundaries.test.ts` in `check` | No new clock or I/O in `src/core`; `noteCreated` routes with `now = 0` (`update.ts:151`); boundary test passes | `Passed` |
| `.base` isolation | — | — | `rg -n '\.base\b' src/core/kernel src/core/state src/ui src/app -g '!*.test.ts'` | No match | `Passed` |
| Dependencies | — | — | `git diff f5c6a1b..2652dc9 -- package.json bun.lock .github` | Empty | `Passed` |

## Findings

### P1-G2-VER1 — Minor — Correctness — The empty template picker omits the hint to create a template

- **System Design:** `W26100423LX-REQ4@R2 → DES6 → S8 → V14`
- **UI Design:** `RM261003ABZP-UREQ8@R2 → UDES8@R1` (Surface: Daily notes and templates, State Matrix "Empty")
- **Evidence:** REQ4@R2 acceptance: "With no templates, the picker shows `No templates in <folder>/` with a hint to create one." The parent State Matrix says the same. `src/core/state/picker.ts:378` returns only the first part:

  ```ts
  empty: (s) => `No templates in ${s.config.templates.folder}/`,
  ```

  A probe with no templates indexed rendered `No templates in templates/` and nothing else. No test covers the empty state.
- **Impact:** A first-time user who presses `<leader>nt` sees that the picker is empty but is not told how to fill it.
- **Required resolution:** The empty `templates` picker shows `No templates in <folder>/` plus a short hint to create a template there. Applying the same hint to `newNoteTemplates` is optional, because `(blank note)` is always listed.
- **Required proof:** A unit or component test that opens `<leader>nt` with no templates indexed and asserts both the message and the hint.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G2-VER2 — Minor — Test Coverage — Read-only template refusal and the new-note prompt painter are untested

- **System Design:** `W26100423LX-REQ4@R2, REQ5@R1 → DES6 → S8, S9 → V14, V17`
- **UI Design:** `RM261003ABZP-UREQ8@R2 → UDES8@R1` (Component: Prompt, "input" and "invalid" variants)
- **Evidence:** Two changed behaviors have no test:
  - `src/core/state/note-commands.ts:177` refuses insertion in a read-only view (`readOnlyView(reg, b)` → `READ_ONLY_HINT`), which REQ4@R2 requires ("In a read-only buffer the command is refused … and nothing is inserted"). No case exercises it.
  - `src/ui/overlays/prompt.ts:32-48` paints the new-note path preview (`→ <path>.md`), the inline reason (`✗ …`), and the footer. REQ5@R1 requires the path preview. `rg "choose a template|New note" test src -g '*.test.ts'` finds no test, and no golden shows the prompt. A manual probe rendered it correctly.
- **Impact:** A regression that inserts into a read-only view, or that drops the path preview or inline reason, would pass the suites.
- **Required resolution:** Add a reducer case that runs `template.insert` and accepts a loaded template in a read-only view (for example, `reading` view), then asserts the hint and an unchanged buffer. Add a component assertion or golden for the new-note prompt with a valid title (`→ a/b.md`) and an invalid one (`✗ …`).
- **Required proof:** `bun test src/core/state/note-commands.test.ts test/ui` passes with the new cases.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G2-VER3 — Minor — Test Coverage — Colour and light calendar goldens hold no style evidence

- **System Design:** `W26100423LX-REQ2@R1, REQ13@R1 → DES5 → S5, S24 → V10`
- **UI Design:** `RM261003ABZP-UREQ11@R1 → UDES11@R1 → US9@R1 via UV10@R1`
- **Evidence:** `test/ui/notes.golden.test.ts:56-74` snapshots only `m.frame()` text for the colour, `NO_COLOR`, and light variants. The three stored snapshots in `test/ui/__snapshots__/notes.golden.test.ts.snap` are identical text. UV10@R1 asks for "golden attribute maps" and "light theme goldens match". The project's existing theme goldens snapshot per-theme style maps (`test/ui/shell.golden.test.ts:259-305`, `cellStyle(...)` → `toMatchSnapshot()`). Only the `NO_COLOR` case checks attributes (`:76-96`).
- **Impact:** A light or colour theme regression on the calendar's selection, today, or `•` mark (for example, a missing `calendarMark` token in one palette) would still match the goldens.
- **Required resolution:** For each theme variant, snapshot or assert the style of the selected day, today, and a marked day (fg, bg, attrs), following the existing `themes` pattern.
- **Required proof:** `bun test test/ui/notes.golden.test.ts` passes with per-theme style snapshots that differ between dark and light.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - Exclusive create at the primitive level (success, existing, case variant, hard-link fallback, read-only folder, temp cleanup) and through the real runner (V3, V5, V6, V7, V18).
  - Daily open-or-create decisions, cursor placement, and template-outcome toasts (V2, V8).
  - Calendar keys, clamping, marks, and announcement (V9).
  - Template listing, preview lines, accept-before-load, one-undo insertion with merge, and Markdown scoping (V14).
  - New-note title validation, blank-first chooser, `Esc` at both steps, and E13 refusal (V17, V18).
  - Calendar goldens at 80×24 with `NO_COLOR` attributes, and template picker goldens at 120 and 90 columns with `Tab` (V10, V16).
  - The whole notes slice passes under three `TZ` values.
- **Missing:**
  - The empty template picker (`P1-G2-VER1`).
  - Read-only refusal of template insertion, and the new-note prompt painter (`P1-G2-VER2`).
  - Per-theme style evidence for the calendar in colour and light (`P1-G2-VER3`).

## Scope Changes

Each recorded deviation was checked against the governing sources:

| Deviation | Evidence | Assessment |
|---|---|---|
| `after` replaces the design's `then` field | Biome `lint/suspicious/noThenProperty` forbids `then` keys; the rename is applied consistently on `noteCreated`, `createNote`, `openPath` options, and the restore entry | Accepted; naming only |
| `placeAfterOpen` in `buffers.ts` instead of `note-commands.ts` | `openPath` and `fillRestored` both call it; `session.ts` already imports `buffers.ts` | Accepted; behavior matches §7 |
| `noteCreated` routed with `now = 0` | `update.ts:151`; precedent in `keys.ts` (`paste`, "now = 0") | Accepted, with a residual risk. If the buffer left on open fails to save, `writing.at = 0`, so the statusline countdown reads `retry in 0s`. The retry timer itself is unaffected. Carrying the runner's time on the action would remove this, but the design gives the action no time field |
| `noteCreated.templatePath?` | Needed for the REQ1@R2 toast "Created <path> from <template>" | Accepted; additive |
| `createExclusive(...).fallback?: true`, `notes.createFallback` log | Design §5 asks to log the fallback | Accepted; additive |
| `exists` exported; `PickerState.time?`/`showPreview?`; `PickerSource.action?`/`empty?`; `PreviewLines` and helper exports; `promptKey(..., reg)`; `ExplorerPrompt`; `newNoteTitleError`/`newNotePath` | Each supports a §7 behavior (preview clock, narrow `Tab` toggle, footer verb, empty message, routing to `submitNewNote`) | Accepted; optional members, existing sources and prompts unchanged |
| `openPath` options carry `reg` | `placeAfterOpen` needs `readOnlyView(reg, b)` to skip Insert in read-only views | Accepted |
| Calendar line reads `· no note` instead of the parent Calendar component's `· will be created` | System design §7 `calendar.ts` and V9 specify `"note exists\|no note"`; REQ2@R1 asks only that the line say whether the note exists | Accepted, because the implementation follows the authoritative system design. The design's UI-obligation treatment says it inherits the accepted UI baseline, so this wording difference should join the pending parent synchronization (alongside UV7's `garden-plan.md` example). No parent file was edited |
| `whichkey.test.ts` expects `+notes` | The new `<leader>n` group is listed in sorted order | Accepted; required by the registration |
| TDD order not strict in T2 integration, T5 refusal case, and T6 picker goldens | Implementation report caveats | Process deviation only; every planned case exists and passes |

## Unverified Items

- The `link()` fallback runs only against a spied `link` that throws `EPERM`. No file system without hard links was available, so `ENOTSUP`/`EXDEV` from a real volume is unverified.
- The case-variant cases ran on a case-insensitive volume (APFS temp folder). Their skip branch for case-sensitive volumes was not exercised here; CI on `ubuntu-24.04` exercises it.
- The read-only-folder cases skip under root (`getuid() === 0`). They ran here as uid 501.

## Blockers

None
