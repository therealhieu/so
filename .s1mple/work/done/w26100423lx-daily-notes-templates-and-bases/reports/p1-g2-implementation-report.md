# P1-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-goal.md`
- **Plan Part:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-1-daily-notes-and-templates.md`
- **Group:** `P1-G2` — Notes state, I/O, and surfaces
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`, `P1-G2-T6`
- **Report:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p1-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

**Gate G3 (DI2 outputs):** `git merge-base --is-ancestor 9adb285 HEAD` → ancestor. `PickerSource.preview?` is present at `src/core/state/picker.ts:58`. The merge-base with `main` is `d398ad7`. The orchestrator recorded this gate as Satisfied before the group started.

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G2-T1` | `src/workspace/fs.ts:createExclusive` (temp file → fsync → `link()`; EEXIST → `{ created: false }`; a file system without hard links falls back to `open(wx)` with `fallback: true`; the temp file is removed on every path), `exists` exported; `src/workspace/fs.test.ts` | `bun test src/workspace/fs.test.ts` → 15 pass; `bun run check` → pass | `d899132` | `Completed` |
| `P1-G2-T2` | `src/core/state/note-commands.ts:openDaily`, `findPathInsensitive`, `onNoteCreated`, the `note.today/yesterday/tomorrow` commands; `src/core/state/buffers.ts:openPath(…, opts?: { after, reg })`, `placeAfterOpen`, `fillRestored`; `src/core/state/types.ts` (`AfterOpen`, `noteCreated`, `createNote`); `src/app/effects.ts` `createNote` case; `update.ts` routing; `main.ts` and `test/support/state.ts` registrations; fixtures `test/fixtures/workspace/templates/{daily,meeting}.md`; `test/integration/notes.test.ts` | `bun test src/core/state/note-commands.test.ts` → 10 pass; `bun test test/integration/notes.test.ts` → 7 pass; `bun test test/ui test/integration` → 140 pass; `bun run check` → pass | `d0c5fe4` | `Completed` |
| `P1-G2-T3` | `src/core/state/calendar.ts` (`openCalendar`, `calendarKey`, `calendarMarks`); `CalendarState` and `Overlay.calendar` in `types.ts`; calendar case in `keys.ts:routeKey`; `note.pickDate` | `bun test src/core/state/calendar.test.ts` → 5 pass; `bun run check` → pass | `bb494b6` | `Completed` |
| `P1-G2-T4` | `src/core/state/note-commands.ts:insertTemplate`; `src/core/state/picker.ts` (`templates` source, `render`, `previewAlways`, `templatePreview`, `PreviewLines`); `src/ui/overlays/picker.ts` (source and expansion preview, Tab toggle below 100 columns); `template.insert` | `bun test src/core/state test/ui` → 288 pass; existing goldens unchanged; `bun run check` → pass | `5846289` | `Completed` |
| `P1-G2-T5` | `startNewNote`/`submitNewNote` in `note-commands.ts`; `src/core/state/explorer.ts` (`newNoteTitleError`, `newNotePath`, `ExplorerPrompt`, `promptKey` new-note branch); `newNoteTemplates` picker source; `src/ui/overlays/prompt.ts` path preview; `src/ui/views/explorer.ts`, `link-edits.ts` updated for the `PromptState` union | `bun test src/core/state/note-commands.test.ts` → 21 pass; `bun test test/integration/notes.test.ts` → 8 pass; file-ops/explorer-ops/rename suites → 24 pass; `bun run check` → pass | `24274cc` | `Completed` |
| `P1-G2-T6` | `src/ui/overlays/calendar.ts:CalendarOverlay` (36×12 float, Monday-first grid, `•` mark, today underlined, selection in brackets and reverse video with the cursor on it, an indexing hint); theme token `calendarMark`; shell wiring; `test/ui/notes.golden.test.ts` and its snapshot (calendar in colour/NO_COLOR/light at 80×24, a NO_COLOR attribute check, the template picker at 120 and 90 columns) | `bun test test/ui/notes.golden.test.ts` → 6 pass; `bun test test/ui` → 91 pass, existing snapshots unchanged; `bun run check` → pass | `2652dc9` | `Completed` |

### Group Change Range

- **Starting commit:** `f5c6a1b` (clean tree)
- **Final commit:** `2652dc9`
- **Remaining group changes:** None

### Group Verification

- `bun test src/core/state/note-commands.test.ts src/core/state/calendar.test.ts src/workspace/fs.test.ts` → `Passed` — 41 pass, 0 fail
- `bun test test/integration/notes.test.ts` → `Passed` — 8 pass, 0 fail. The tests assert that no temp file is left behind and that log fields hold paths only.
- `bun test test/ui/notes.golden.test.ts` → `Passed` — 6 pass, 6 snapshots (colour, NO_COLOR, light, 80×24; template picker at 120 and 90 columns)
- `bun run check` → `Passed` — 822 pass, 0 fail; real 4.22 s
- Orphan check (`pgrep -fl 'bin/so|src/app/main.ts|bun test'`) → none before the run; `bun run test:ci` → `Passed` — 158 pass, 0 fail, 24 files; none left after the run
- Registration mirror → `Passed` — `src/app/main.ts:40-43,124,138,140` and `test/support/state.ts:30-33,54,68,70` register the same `noteCommands`, `noteBindings`, and `noteGroups`
- `rg -n "W26100423LX|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P1-G" src test/integration/notes.test.ts test/ui/notes.golden.test.ts` → `Passed` — no match
- `git diff main -- package.json bun.lock .github` → `Passed` — empty
- Existing goldens → `Passed` — `git diff --stat f5c6a1b..HEAD -- test/ui/__snapshots__` shows only the new `notes.golden.test.ts.snap`

### Deviations and Remaining Issues

- **`after` instead of `then`.** The design names the open-continuation field `then`. Biome's `lint/suspicious/noThenProperty` forbids `then` keys in object literals. The field is named `after` on the `noteCreated` action, the `createNote` effect, the `openPath` options, and the pending-restore entry. The type name `AfterOpen` is unchanged.
- **`placeAfterOpen` lives in `buffers.ts`** rather than `note-commands.ts`. This avoids a module cycle, since `openPath` and `fillRestored` both apply it. It enters Insert by running the engine's `A` key, and it skips Insert in read-only views.
- **`noteCreated` is routed with `now = 0`.** This keeps `update` pure, following the clipboard-paste precedent. Calling `Date.now()` inside `update` was rejected.
- **Additive contract changes** (beyond the design's listed shapes):
  - `noteCreated.templatePath?`
  - `createExclusive(...).fallback?: true`, logged as `notes.createFallback`
  - `exists` exported from `src/workspace/fs.ts`
  - `PickerState.time?` and `showPreview?`
  - `PickerSource.action?`, `empty?`, `render?`, `previewAlways?`
  - `PreviewLines`, `templatePaths`, `loadedPreview`, `noteTitle`, `templatePreview` exported from `picker.ts`
  - `promptKey(s, key, now, reg)`
  - the `ExplorerPrompt` type
  - `newNoteTitleError` and `newNotePath` (which strips a trailing `.md`)
- **Calendar message line.** It reads `"<ddd> YYYY-MM-DD · note exists|no note"`, following the system design. The parent UI design wording is "will be created". The system design is authoritative for this work.
- **Tab preview toggle.** Tab toggles the preview only for `previewAlways` sources. Below 100 columns the preview replaces the list, the query cursor is hidden, and the footer shows `Tab preview`.
- **Which-key expectation updated.** `src/core/state/whichkey.test.ts` now expects the `{ key: "n", label: "+notes", group: true }` entry that the new group adds.
- **TDD caveats:**
  - T2's integration tests were written after the runner case. RED was shown by restoring `HEAD:src/app/effects.ts`, which failed with `unknown effect: {"kind":"createNote"...`.
  - The integration case for the new-note refusal was written after GREEN.
  - The T6 template-picker goldens passed on their first run because the T4 painter already existed.
- **Remaining issues:** None.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/reports/p1-g2-verification-report.md` (status `Failed`; findings `P1-G2-VER1`, `P1-G2-VER2`, `P1-G2-VER3`, all Minor)
- **Status:** `Completed`

All three findings are fixed in separate commits on top of `50c7831`. Only `P1-G2-VER1` changes product code; `P1-G2-VER2` and `P1-G2-VER3` add tests and new snapshot entries. The verifier's note that the calendar's `· no note` wording should join the pending parent synchronization is an orchestrator item and needs no code change.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P1-G2-VER1` | **Change:** `src/core/state/picker.ts` `templates.empty` returns `No templates in <folder>/` and, on a second line, `Create a .md file there to add one`; `src/ui/overlays/picker.ts` paints each line of a source's empty message as its own dim row, bounded by the rows left. One line did not fit: the single-line hint was clipped at 80 columns (probe frame showed only `No templates in templates/`). `newNoteTemplates` is unchanged, since `(blank note)` is always listed. **Verification:** RED first: `bun test src/core/state/note-commands.test.ts` → 1 fail (`Received: "No templates in templates/"`). GREEN: the unit case `the template picker without templates says how to add one` (opens `<leader>nt` with no templates indexed, asserts empty items and both lines) and the component case `empty template picker > names the folder and says how to add a template` (80×24 frame: the hint row sits directly under the message row) pass. **Checklist:** [x] resolution implemented · [x] required proof passes · [x] change evidence recorded · [x] verification evidence recorded | `29a7f0d` | `Fixed` |
| `P1-G2-VER2` | **Change:** `src/core/state/note-commands.test.ts` case `a template is not inserted into a note in reading view` (`<leader>m` twice → `reading`, `<leader>nt`, select, load, Enter → picker closed, message `reading mode — <leader>m to edit`, text still `hello`, `dirty` false). `test/ui/notes.golden.test.ts` `new note prompt`: `a/b` shows `❯ a/b`, `→ a/b.md`, and the `⏎ choose a template · esc cancel` footer; `../x` shows `✗ outside the workspace`, no `→`, and the reason's fg differs from the field's. **Verification:** `bun test src/core/state/note-commands.test.ts test/ui/notes.golden.test.ts` → 32 pass. Mutation check: removing the `readOnlyView` refusal in `insertTemplate` and the `→` preview in `src/ui/overlays/prompt.ts` → both new cases fail (2 fail); sources restored with `git checkout`. **Checklist:** [x] resolution implemented · [x] required proof passes · [x] change evidence recorded · [x] verification evidence recorded | `61b4359` | `Fixed` |
| `P1-G2-VER3` | **Change:** `test/ui/notes.golden.test.ts` `calendar styles` follows the `themes` pattern in `test/ui/shell.golden.test.ts` (`cellStyle(...)` → `toMatchSnapshot()`): for colour, `NO_COLOR`, and light it snapshots fg, bg, and attrs of the selected day and its `•`, today, a marked day and its `•`, and a plain day. A second case asserts that dark and light differ on the selected day and the mark. `test/ui/__snapshots__/notes.golden.test.ts.snap` gains 3 entries (+105 lines, 0 removed); the existing calendar and picker snapshots are unchanged. Stored values: colour mark fg `255,158,100` vs light `177,92,0`; selection bg `45,63,118` vs `183,197,240`; today attrs `8` (underline) in all three; `NO_COLOR` selection attrs `32` (inverse) with `default` colours. **Verification:** `bun test test/ui/notes.golden.test.ts` → 13 pass, 9 snapshots. Mutation check: `calendarMark` token `tag` → `fg` in `src/ui/theme.ts` → colour and light style snapshots fail (2 fail); restored. **Checklist:** [x] resolution implemented · [x] required proof passes · [x] change evidence recorded · [x] verification evidence recorded | `9056f28` | `Fixed` |

**Commit caveat:** `29a7f0d` leaves one trailing blank line in `test/ui/notes.golden.test.ts`, so `biome check .` fails at that single commit. The next commit, `61b4359`, appends after that line and `biome check .` passes from there on. History was not rewritten.

**Group verification after remediation (at `9056f28`):**

- Orphan check (`pgrep -fl 'bin/so|src/app/main.ts|bun test|index-worker'`) → none before and after the runs
- `bun run check` → `Passed` — Biome, `tsc`, knip clean; 824 pass, 0 fail
- `bun run test:ci` → `Passed` — 165 pass, 0 fail, 37 snapshots, 24 files
- Notes slice (`note-commands`, `calendar`, `fs`, `test/integration/notes.test.ts`, `test/ui/notes.golden.test.ts`) → `Passed` — 64 pass, 0 fail
- `git diff --stat 50c7831..HEAD -- test/ui/__snapshots__ package.json bun.lock .github` → only `notes.golden.test.ts.snap`, +105 / −0
- Work-process identifier scan over the changed files → no match

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — the six tasks are committed, and the three verification findings are fixed and verified.
- **Final report commit:** returned to the orchestrator
- **Final commits:** `d899132`, `d0c5fe4`, `bb494b6`, `5846289`, `24274cc`, `2652dc9`; remediation `29a7f0d`, `61b4359`, `9056f28`
- **Final checks:** `bun run check` → 824 pass; `bun run test:ci` → 165 pass; notes slice 64 pass
- **Remaining issues:** None in group code. The calendar's `· no note` wording versus the parent's `will be created` remains an orchestrator item for parent synchronization.
