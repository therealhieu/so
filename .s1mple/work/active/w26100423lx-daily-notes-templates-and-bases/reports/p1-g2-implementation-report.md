# P1-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-goal.md`
- **Plan Part:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/w26100423lx-plan-1-daily-notes-and-templates.md`
- **Group:** `P1-G2` — Notes state, I/O, and surfaces
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`, `P1-G2-T6`
- **Report:** `.s1mple/work/active/w26100423lx-daily-notes-templates-and-bases/reports/p1-g2-implementation-report.md`

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

- **Verification reports:** —
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all six tasks are committed, and every group check passed.
- **Final report commit:** returned to the orchestrator
- **Final commits:** `d899132`, `d0c5fe4`, `bb494b6`, `5846289`, `24274cc`, `2652dc9`
- **Final checks:** `bun run check` → 822 pass; `bun run test:ci` → 158 pass; notes unit 41, integration 8, goldens 6 pass
- **Remaining issues:** None
