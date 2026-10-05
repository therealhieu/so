# P1-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-goal.md`
- **Plan Part:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-plan-1-core-mouse-model.md`
- **Group:** `P1-G1`
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`, `P1-G1-T6`
- **Report:** `.s1mple/work/active/w261005h4xz-tui-mouse-support/reports/p1-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G1-T1` | `src/core/kernel/view/types.ts:Span` (`col`, `inserted`); `src/core/kernel/view/text-view.ts:spansOf`; `src/core/kernel/view/hit.ts:ScreenRow,rowAt,sourceColAt` (new); `src/core/kernel/view/hit.test.ts` (new); `src/core/kernel/view/text-view.test.ts` (expectations gain `col`/`inserted`) | RED: `bun test src/core/kernel/view/hit.test.ts` → module `./hit` not found. GREEN: same → 4 pass, 0 fail. `bun test src` → 702 pass, 0 fail. `bun test test/ui test/integration` → 180 pass, 0 fail. `bun run knip` → no findings | `3ae1d383184e5ce23e88e533f4f132a0d7754ba7` | `Completed` |
| `P1-G1-T2` | `src/core/config/schema.ts:ConfigSchema` (`mouse: z.boolean().default(true)`); `src/core/config/schema.test.ts`; `src/core/config/toml.test.ts` (full-config literal gains `mouse: true`) | RED: `bun test src/core/config/schema.test.ts` → new case failed (`mouse` undefined). GREEN: `bun test src/core/config` → 14 pass, 0 fail. `bun --bun run tsc --noEmit -p .` → exit 0. `bun test test/integration/config.test.ts` → 7 pass | `93a1e0801dfb7fe3baf2fa566e2b01139ced5bcb` | `Completed` |
| `P1-G1-T3` | `src/core/state/types.ts:WindowSpot,MouseTarget,MouseEvent,Action` (`mouse` + `now`); `src/core/state/mouse.ts:onMouse,feedKeys,focusTarget,placeAt,pressText,dragText` (new); `src/core/state/update.ts` (mouse case → imported `onMouse`, local `onMouse` removed); `src/ui/editors/text-view.ts` (`onMouseScroll` assignment and `SCROLL_LINES` removed); `src/core/state/mouse.test.ts` (new) | RED: `bun test src/core/state/mouse.test.ts` → module not found. GREEN: same → 8 pass, 0 fail. `bun --bun run tsc --noEmit -p .` → exit 0 with the `@ts-expect-error` on `button` still required. `rg 'kind: "scroll"\|onMouseScroll' src` → no matches. `bun run check` → exit 0, 1015 pass | `b98c8ae68bf2a32ffb281e141c4ec9c69148d413`; press-order fix in `1957fde4e10497214efe6ebf82bb864c004b3aee` (see Deviations 4) | `Completed` |
| `P1-G1-T4` | `src/core/state/mouse.ts:wheel,scrollWindow,wheelBase,wheelOverlay,withFocus,WHEEL_LINES,repeat`; `src/core/state/mouse.test.ts` | RED: 10 new cases failed. GREEN: `bun test src/core/state/mouse.test.ts` → 18 pass, 0 fail. `bun run check` → exit 0, 1025 pass | `e139649668897d6a6d590a8548ec16dfd6478209` | `Completed` |
| `P1-G1-T5` | `src/core/state/mouse.ts:press,inBody,pressChrome,pressBase,pressItem`; `src/core/state/base-commands.ts:focusBaseCell,focusBaseCard,showBaseView,openBaseFocused`; `src/core/state/picker.ts:selectPickerItem`; `src/core/state/calendar.ts:selectCalendarDay`; `src/core/state/mouse.test.ts` | RED: 9 new cases failed. GREEN: `bun test src/core/state/mouse.test.ts` → 30 pass, 0 fail (with the cross-window Insert case). `bun test src/core/state` (inside `bun run check`) → existing Bases, picker, calendar tests unchanged and passing. `bun run check` → exit 0 (knip clean), 1037 pass. Follow-up board-card test → 34 pass | `1957fde4e10497214efe6ebf82bb864c004b3aee`; follow-up test `23941de54964a26f3e3a6eb30b894e28e121d383` | `Completed` |
| `P1-G1-T6` | `src/core/state/mouse.ts:overlayGate,onOverlay` (`onMouse` runs the gate first); `src/core/state/mouse.test.ts` | RED: 2 new cases failed (the completion case already held through `<Esc>` closing completion). GREEN: `bun test src/core/state/mouse.test.ts` → 33 pass, 0 fail. `bun run check` → exit 0, 1040 pass | `fc01724a3161461e9d0a83aedf12d086ea0ea2b3` | `Completed` |

### Group Change Range

- **Starting commit:** `da4275ea2bdb74aaec28ae5a9209bf584f349990` (clean working tree, no staged or unstaged changes)
- **Final commit:** `23941de54964a26f3e3a6eb30b894e28e121d383`
- **Remaining group changes:** None

### Group Verification

- `bun test src/core/kernel/view/hit.test.ts src/core/state/mouse.test.ts src/core/config/schema.test.ts` → `Passed` — 46 pass, 0 fail
- `bun --bun run tsc --noEmit -p .` → `Passed` — exit 0; the `@ts-expect-error` on `button` in `src/core/state/mouse.test.ts` is still required (an unused one would fail `tsc`)
- `rg 'kind: "scroll"|onMouseScroll' src` → `Passed` — no matches (exit 1)
- `bun run check` → `Passed` — biome, tsc, knip clean; 1041 pass, 0 fail
- `git diff --name-only da4275e..HEAD | xargs rg -n 'W261005H4XZ|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P1-G1'` → `Passed` — no matches (exit 1)
- `bun run test:ci` (extra, not required by the group) → `Passed` — 191 pass, 0 fail
- `pgrep -fl 'src/app/main.ts|bun run dev'` → `Passed` — no processes (exit 1); this group started no app processes

### Deviations and Remaining Issues

1. **Existing layout tests updated, not unchanged.** `src/core/kernel/view/text-view.test.ts` compares spans with exact `toEqual`, so every verbatim span now carries `col` and every replacement span `col` + `inserted: true`. Ten expectations gained those fields; no span text, style, or row changed. The plan's "pass unchanged" could not hold once `spansOf` sets the new fields the design requires. Likewise `src/core/config/toml.test.ts` gained `mouse: true` in its full-config literal.
2. **`sourceColAt` details.** A span without `col` continues from the previous span's end (instead of mapping to 0), so the raw-line fallback in `EditorView.layoutFrame` still maps cell by cell; widget rows (no spans) still give 0. Past the last cell it returns the source column after the last shown character; for a line ending in hidden text (for example a concealed `[[link]]`) that is the hidden range's start, not the full line length. Part 2's `EditorView.targetAt` should clamp with the buffer line length when `dc` is past the row's display width if it needs the true end.
3. **`rowAt` skip rule.** `skipRows` applies to the text rows of the first rendered line's source line, matching the painter's `row.sourceLine === this.topLine` in practice. `rowAt` returns `startCol` 0 for unwrapped rows; the view adds `leftCol` (design §7).
4. **Press order.** `press` ends Insert, Visual, and pending keys (`<Esc>`) in the window they belong to before `focusTarget` moves focus, then acts. The first T3 commit fed `<Esc>` after focus, which ended an Insert session against the clicked window. The fix landed in the T5 commit (body lists both tasks) and is covered by "an Insert-mode click in another window ends Insert where it was typed". Chrome presses in the body (buffer tab, explorer, side panel, Bases) also leave Insert/Visual first; overlay presses do not, so completion rows still accept in Insert.
5. **Click resets `wantCol`.** `placeAt` drops `vim.wantCol` before `placeCursor`, as any horizontal key does, so `j`/`k` after a click keep the clicked column (tested).
6. **Insert click past the line end uses `a`.** Instead of poking the column after `i`, a click at or past the end of a non-empty line feeds `a`, which reaches column `length` through the key path; an empty line uses `i`.
7. **Ctrl+click only where links exist.** `link.follow` runs only when the active file type is in the command's `filetypes`; elsewhere a Ctrl press equals a plain press (no "not available" message).
8. **Base wheel runs commands, not keys.** `wheelBase` runs `base.down`/`base.up` ×3 and `base.moveRight`/`base.moveLeft` (table) or `base.right`/`base.left` (board) through `runCommand` inside `withFocus`, so the wheel works in Insert or Visual mode, where the normal-mode `j`/`k` bindings would not resolve. The resulting state equals the keys from Normal mode (tested). `withFocus` also clears and restores `vim.pending` so a pending prefix never combines with the fed keys.
9. **Bases double click.** The focus message is cleared before `openBaseFocused`, matching `<CR>` (a key clears the message line). Stale cell indexes (row or column out of the table) and missing lanes return without change.
10. **Bufferline tab.** No `:b <id>` command exists; a tab press runs `cycleBuffer`'s path for an arbitrary id (`autosaveNow` of the current buffer, then `showBuffer`), equal to `:bn<CR>` when the tab is the next buffer (tested).
11. **Test comparison helper.** `expectSame` compares buffer texts as strings (separately edited `TextBuffer`s are distinct closure objects), restarts of the `saveState` debounce once, and ignores the `whichKey` timer a prefix key such as the `g` of `gd` arms.

No unresolved implementation or verification issue remains.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `Pending verification`
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — initial implementation; awaiting verification
- **Final report commit:** `Pending report commit`
- **Final commits:** `3ae1d38`, `93a1e08`, `b98c8ae`, `e139649`, `1957fde`, `fc01724`, `23941de`
- **Final checks:** `bun run check` → exit 0 (1041 pass); `bun run test:ci` → 191 pass; V31 `rg` and work-ID scan → no matches
- **Remaining issues:** None
