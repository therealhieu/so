# P1-G1 Verification Report

## Scope

- **Group:** `P1-G1`
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`, `P1-G1-T6`
- **Report:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p1-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p1-g1-implementation-report.md` (report commit `b6710bb`)

Verified change range: `da4275e` → `23941de` (task commits `3ae1d38`, `93a1e08`, `b98c8ae`, `e139649`, `1957fde`, `fc01724`, `23941de`).

## Status

`Failed`

Every group check passes and nearly every chain is satisfied. One Major finding remains: `sourceColAt` returns the start of a trailing hidden range instead of the line length for a cell past the end of a line. Part 2's `EditorView.targetAt` uses `sourceColAt` directly and does not clamp. A click past the end of a line that ends in concealed text, such as `[[link]]`, would therefore put an Insert cursor inside the link (P1-G1-VER1).

## Assigned Traceability

- **System Design:** `REQ1@R1 → DES1, DES5 → S1, S2 → V1, V29, V31`; `REQ2@R2 → DES5 → S3 → V1, V4, V5, V6`; `REQ3@R1 → DES5 → S4 → V7`; `REQ4@R1 → DES4, DES5 → S5, S6 → V8, V9, V10, V11`; `REQ5@R1 → DES5 → S7, S8 → V12, V14`; `REQ6@R1 → DES5 → S9 → V15`; `REQ7@R1 → DES5 → S10, S11 → V1, V17`; `REQ8@R1 → DES5 → S12 → V19, V24`; `REQ9@R1 → DES6 → S13 → V27`; plan-context gaps 2, 3, 4
- **UI Design:** None

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1@R1 → DES1, DES5 → S1, S2 → V1, V29, V31` | None | Gestures run their key paths; `MouseEvent` has no button; old scroll path gone | `src/core/state/types.ts:WindowSpot,MouseTarget,MouseEvent` (no coordinates, no button); `src/core/state/mouse.ts:feedKeys` folds `handleKeyAction`; `src/core/state/update.ts` `case "mouse": return onMouse(state, action, reg)`; `src/ui/editors/text-view.ts` `onMouseScroll`/`SCROLL_LINES` removed | `Satisfied` |
| `REQ2@R2 → DES5 → S3 → V1, V4, V5, V6` | None | Wheel acts on the targeted window, explorer, side panel, Base, or list; focus and mode unchanged; clamps | `src/core/state/mouse.ts:wheel,scrollWindow` (clamped to `0..lineCount-1`, dx ignored on text), `wheelBase` (`base.down/up` ×3; `base.moveRight/Left` on a table, `base.right/left` on a board), `wheelOverlay` (completion `min(3, room)`), `withFocus` restores `windows.active`, panel focus, and `vim.pending`; explorer uses `moveCursor` | `Satisfied` |
| `REQ3@R1 → DES5 → S4 → V7` | None | Press focuses window, explorer, or side panel before acting | `src/core/state/mouse.ts:focusTarget,press` (same `windows.active` write as keyboard `focus` in `src/core/state/commands.ts:291-302`) | `Satisfied` |
| `REQ4@R1 → DES4, DES5 → S5, S6 → V8, V9, V10, V11` | None | Display column maps to source column, including past the end; Insert click splits undo; Visual/pending reset | `src/core/kernel/view/text-view.ts:spansOf` sets `col`/`inserted`; `src/core/kernel/view/hit.ts:rowAt,sourceColAt`; `src/core/state/mouse.ts:press,pressText,placeAt`. Past-end cells on a line ending in hidden text map to the hidden range's start, not the line length | `Mismatch` (P1-G1-VER1) |
| `REQ5@R1 → DES5 → S7, S8 → V12, V14` | None | Drag yields charwise Visual anchored at the press; 2/3 clicks equal `viw`/`V` | `src/core/state/mouse.ts:dragText` (enters `v` once, re-anchors after `<Esc>` from Insert, `line + edge`), `pressText` clicks 2/3 | `Satisfied` |
| `REQ6@R1 → DES5 → S9 → V15` | None | Ctrl press on a link equals cursor there + `gd` | `src/core/state/mouse.ts:pressText` → `runCommand("link.follow")` gated by `followsLinks` | `Satisfied` |
| `REQ7@R1 → DES5 → S10, S11 → V1, V17` | None | Chrome, Bases, picker, completion, and calendar presses equal their keys; Bases single = focus, double = open | `src/core/state/mouse.ts:pressChrome,pressBase,pressItem`; thin wrappers `src/core/state/base-commands.ts:focusBaseCell,focusBaseCard,showBaseView,openBaseFocused`, `src/core/state/picker.ts:selectPickerItem`, `src/core/state/calendar.ts:selectCalendarDay` | `Satisfied` |
| `REQ8@R1 → DES5 → S12 → V19, V24` | None | Prompt/conflict ignore the mouse; outside press closes dismissible overlays and the command line (consumed); completion yields | `src/core/state/mouse.ts:overlayGate,onOverlay,inBody` (runs first for every event) | `Satisfied` |
| `REQ9@R1 → DES6 → S13 → V27` | None | `mouse` defaults to `true`; wrong type is a config error naming `mouse` | `src/core/config/schema.ts:ConfigSchema` `mouse: z.boolean().default(true)` | `Satisfied` |
| Plan-context gap 2 (calendar day wrapper) | None | Exported wrapper over private `show`, then `<CR>` | `src/core/state/calendar.ts:selectCalendarDay`; `mouse.ts:pressChrome` `calendarDay` branch | `Satisfied` |
| Plan-context gap 3 (completion wheel clamps) | None | Feed at most the steps left toward the list end | `src/core/state/mouse.ts:wheelOverlay` completion branch | `Satisfied` |
| Plan-context gap 4 (completion click, body-press close) | None | `selected = index` + `<CR>`; body press closes with `overlay: {kind:"none"}`, Insert stays | `src/core/state/mouse.ts:pressItem` completion branch; `overlayGate` completion branch | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V8`, `V9`, `V10` mapping units | `S5` | `DES4` | `bun test src/core/kernel/view/hit.test.ts` | 4 pass, 0 fail, 29 expect() calls. Alias, replacement, tab, wrap, widget, and skip cases covered; no case for a line ending in hidden text | `Insufficient` (P1-G1-VER1) |
| Past-end mapping probe | `S5` | `DES4` | Scratch script: `layoutText` on `See [[Project Plan]]` with `[[`/`]]` hidden, then `sourceColAt(spans, 99, 4)` | Returns `18`; the line length is `20` | `Failed` (P1-G1-VER1) |
| `V1`, `V4`–`V7`, `V11`, `V12`, `V14`, `V15`, `V17`, `V19`, `V24` reducer units | `S1`, `S3`, `S4`, `S6`–`S12` | `DES1`, `DES5` | `bun test src/core/state/mouse.test.ts` | 34 pass, 0 fail, 374 expect() calls | `Passed` |
| `V27` config unit | `S13` | `DES6` | `bun test src/core/config/schema.test.ts` | 8 pass, 0 fail | `Passed` |
| `V29` type contract | `S2` | `DES1` | `bun --bun run tsc --noEmit -p .` (inside `bun run check`) | Exit 0. The `@ts-expect-error` on `button` in `src/core/state/mouse.test.ts` is still required, because an unused directive would fail `tsc` | `Passed` |
| `V31` obsolete reference | `S1` | `DES1` | `rg 'kind: "scroll"\|onMouseScroll' src` | No matches (exit 1) | `Passed` |
| Fast gate | `S1` | `DES1`, `DES4`, `DES5`, `DES6` | `bun run check` | Exit 0: biome clean (309 files), tsc clean, knip clean, 1041 pass, 0 fail | `Passed` |
| Work-ID scan | None | None | `git diff --name-only da4275e..23941de \| xargs rg -n 'W261005H4XZ\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P1-G1'` | No matches (exit 1) | `Passed` |
| Core purity | None | Binding constraints | `rg -n '@opentui' src/core`; inspect `hit.ts` imports (`./types`, `./wrap` only) | No matches; `test/boundaries.test.ts` passes inside `bun run check` | `Passed` |
| Regression (extra) | None | None | `bun run test:ci` | 191 pass, 0 fail; removing `onMouseScroll` breaks no component or PTY suite | `Passed` |
| Process cleanup | None | None | `pgrep -fl 'src/app/main.ts\|bun run dev'` after all runs | No processes (exit 1) | `Passed` |
| Code inspection: stale targets, scope, exports | `S1` | `DES5` | Read `src/core/state/mouse.ts` and the diffs `da4275e..23941de` | Stale window ids, picker/completion indexes, explorer paths, side rows, base cells/lanes/views return without change; no router or view geometry added; every new export has a consumer in `mouse.ts` or `hit.test.ts` | `Passed` |

## Findings

### P1-G1-VER1 — Major — Correctness — Past-end click on a line ending in hidden text does not map to the line length

- **System Design:** `REQ4@R1`, `DES4`, `S5`, `V9` (design §7 `src/core/kernel/view/hit.ts`: "past the end → line length")
- **UI Design:** None
- **Evidence:** `src/core/kernel/view/hit.ts:64-66` returns `end`, which is the source column after the last *shown* character:

  ```ts
      end = span.inserted ? col : col + span.text.length;
    }
    return end;
  ```

  A probe on `See [[Project Plan]]` with `[[` and `]]` concealed returns `18` for `dc = 99`, but the line length is `20`. The implementation report records this as Deviation 2 and hands the clamp to Part 2. However, `w261005h4xz-plan-2-ui-mouse-routing.md:267,307` plans `EditorView.targetAt` as `rowAt` + `sourceColAt(...)` with no clamp to the line length, so no part owns the correction. `src/core/kernel/view/hit.test.ts` has no case for a line that ends in hidden text.
- **Impact:** REQ4 requires a click past the end of a line to land after the line in Insert mode and on its last character in Normal mode. Consider a click past the end of a concealed `[[Project Plan]]` line. `pressText` receives col 18 < 20, so it feeds `i` rather than `a`, and the Insert cursor lands before `]]`. The next typed text goes inside the link. In Normal mode the cursor lands on the first `]` rather than the last character.
- **Required resolution:** A display column past the last cell maps to the source line's length even when the line ends in hidden text. Either `sourceColAt` takes the source line length (or the source text) and returns it past the end, or the clamp gets an explicit owner and a test in this group's output contract. The design's `invariant` for undecorated lines must still hold.
- **Required proof:** A `src/core/kernel/view/hit.test.ts` case that lays out a line ending in a concealed range (for example `See [[Project Plan]]` with `[[`/`]]` hidden) and asserts that a past-end display column maps to the full line length. The existing hit, mouse, and fast-gate checks must still pass (`bun test src/core/kernel/view/hit.test.ts`, `bun run check`).

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - Span source columns for verbatim, concealed-alias, replacement, and tab text, plus `rowAt` over wrapped, widget, skipped, and unwrapped rows (V8–V10).
  - Press focus for an inactive split, the winbar, the explorer, the side panel, and the return to a window (V7). Stale window ids.
  - Normal, Visual, and pending resets, plus `wantCol`.
  - An Insert click: kept Insert, split undo, past-end append, and a click in another window ending Insert where it was typed (V11).
  - Drag anchor, extension, yank range, edge line, and a drag starting from Insert (V12).
  - `viw`/`V` equivalence (V14) and Ctrl+click equivalence with `gd`, plus plain-text Ctrl equal to a plain press (V15).
  - Wheel over an inactive split, including clamp, Insert mode, and a sideways no-op (V4). Wheel over the explorer, with clamp (V5).
  - Wheel over an inactive Base (V6), Base table columns (`L`), board lanes (`l`), the side panel (`jjj`), picker up/down, calendar `j`/`k`, and the completion clamp.
  - Click equivalence for a buffer tab, explorer file and folder, side-panel row, Bases view tab, picker row, completion row, calendar day, and board card (V1, V17). Bases single vs double click.
  - Panel chrome focus-only presses. Inert, overlay, outside, and stale-item presses.
  - Prompt and conflict blocking every target × press, drag, and wheel (V19). Outside clicks closing the picker, `:`, and `/` with the press consumed. Completion yielding to a text press (V24).
  - The `mouse` default, `false`, and the type error (V27). The `button` type contract (V29).
- **Missing:** No test asserts that a past-end display column on a line ending in hidden text maps to the line length (P1-G1-VER1). Every other assigned behavior has an assertion.

## Scope Changes

The implementer recorded these deviations (implementation report "Deviations and Remaining Issues"). Each was checked against the design and requirements:

1. Existing `text-view.test.ts` span expectations gained `col`/`inserted`, and `toml.test.ts` gained `mouse: true`. These changes are needed once `spansOf` sets the design's fields. No span text, style, or row changed (verified in the diff). Accepted.
2. Two `sourceColAt` details:
   - A span without `col` continues from the previous span's end, where the design maps it to 0. This improves the raw-line fallback in `layoutFrame` without contradicting any requirement. Accepted.
   - The past-end result for lines ending in hidden text contradicts design §7 and REQ4, and no part owns the fix. Not accepted (P1-G1-VER1).
3. `rowAt` applies `skipRows` to rows of `lines[0].sourceLine`, while the painter uses `this.topLine`. The two are equal whenever `skipRows > 0`, because the cursor line is then the first laid-out row. `startCol` is 0 for unwrapped rows, and the view adds `leftCol` as the design says. Accepted.
4. A press ends Insert, Visual, and pending keys before `focusTarget`. This keeps the end of Insert in the window where the typing happened, and it is tested. It matches REQ3/REQ4 ordering. Accepted.
5. A click resets `wantCol`, matching a horizontal motion, and this is tested. Accepted.
6. An Insert click past the end feeds `a` rather than setting the column after `i`. It reaches the same column through the key path. Accepted.
7. Ctrl+click runs `link.follow` only for file types the command declares; elsewhere it equals a plain press. This is consistent with REQ6 ("plain text behaves as a plain click"). Accepted.
8. The Base wheel runs `base.*` commands rather than keys, so it works in Insert and Visual mode. Equivalence with the Normal-mode keys is tested. Accepted.
9. A Bases double click clears the message before `openBaseFocused`, matching `<CR>`, and stale indexes are guarded. Accepted.
10. A buffer-tab press reuses `cycleBuffer`'s path (`autosaveNow` + `showBuffer`, `src/core/state/commands.ts:258-271`) because no `:b <id>` command exists. It is tested equal to `:bn<CR>`. Accepted.
11. `expectSame` treats two effects as noise: the `whichKey` timer armed by the `g` prefix, and repeated `saveState` debounce restarts. Neither changes user-visible state. State and all other effects are still compared. Accepted.

No unplanned files or behaviors were added. No router, `MouseLayer`, or view geometry was introduced in this group.

## Unverified Items

None

## Blockers

None
