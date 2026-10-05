# W261005H4XZ: tui-mouse-support — Requirements

**Document Status:** Ready for System Design

**Context Source:** `w261005h4xz-discuss-context.md`

**Research Source:** None

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

Approved by the user on 2026-10-05: the user delegated every decision of this discussion run and asked for stable, simple, maintainable, extensible choices that follow industry standards. The decisions below follow Neovim's `mouse=a` behavior for the editor, common picker and file-tree behavior for chrome, and spreadsheet behavior for Bases tables.

# Table of Contents

1. [Problem and Desired Outcome](#1-problem-and-desired-outcome)
2. [Current and Expected State](#2-current-and-expected-state)
3. [Scope](#3-scope)
4. [Standards and Constraints](#4-standards-and-constraints)
5. [Current Requirements](#5-current-requirements)
   - [W261005H4XZ-REQ1@R1: Mouse maps to keyboard actions](#w261005h4xz-req1r1-mouse-maps-to-keyboard-actions)
   - [W261005H4XZ-REQ2@R2: Wheel scrolls the surface under the pointer](#w261005h4xz-req2r2-wheel-scrolls-the-surface-under-the-pointer)
   - [W261005H4XZ-REQ3@R1: Click focuses the surface under the pointer](#w261005h4xz-req3r1-click-focuses-the-surface-under-the-pointer)
   - [W261005H4XZ-REQ4@R1: Click places the editor cursor](#w261005h4xz-req4r1-click-places-the-editor-cursor)
   - [W261005H4XZ-REQ5@R1: Drag and multi-click select in Visual mode](#w261005h4xz-req5r1-drag-and-multi-click-select-in-visual-mode)
   - [W261005H4XZ-REQ6@R1: Ctrl+click follows links](#w261005h4xz-req6r1-ctrlclick-follows-links)
   - [W261005H4XZ-REQ7@R1: Clicks on chrome and Bases surfaces](#w261005h4xz-req7r1-clicks-on-chrome-and-bases-surfaces)
   - [W261005H4XZ-REQ8@R1: Overlay and command-line mouse rules](#w261005h4xz-req8r1-overlay-and-command-line-mouse-rules)
   - [W261005H4XZ-REQ9@R1: Mouse configuration and terminal modes](#w261005h4xz-req9r1-mouse-configuration-and-terminal-modes)
6. [Research Impact Review](#6-research-impact-review)
7. [Historical Requirement Revisions](#7-historical-requirement-revisions)

# 1. Problem and Desired Outcome

## Problem Statement

The `so` TUI reports mouse events but handles only the wheel, only in editor windows, and always scrolls the active window instead of the one under the pointer. Clicks, drags, and multi-clicks do nothing on any surface (context Section 4 table, Section 5 flow).

## Desired Outcome

Every TUI surface responds to the mouse the way users of Neovim, file trees, pickers, and spreadsheets expect: click focuses and places the cursor, drag selects, wheel scrolls what is under the pointer, and clicks activate rows, tabs, items, and links. Every mouse gesture reuses an existing keyboard action, so behavior stays consistent and the keyboard remains complete.

# 2. Current and Expected State

## Current State

```text
wheel over any editor window ──► scroll the ACTIVE window by ±3
wheel elsewhere               ──► nothing
click / drag / double-click   ──► nothing (no handler on any view)
```

Only `EditorView.onMouseScroll` (`src/ui/editors/text-view.ts:287-294`) dispatches a mouse action, and its reducer `onMouse` (`src/core/state/update.ts:239-257`) ignores the window under the pointer. Full-screen `OverlayHost` and the toast column occupy hit-grid cells they do not paint (context Unknowns), so naive per-view handlers would also misroute clicks.

## Expected State

```text
terminal mouse ─► src/ui resolves the cell to a model target ─► core action
   wheel        → scroll / move selection of the surface under the pointer (focus unchanged)
   click        → focus surface + surface action (cursor, row, tab, item, day, cell)
   drag         → Visual selection in the editor
   2× / 3×      → word / line Visual (editor); open (Bases cell or card)
   Ctrl+click   → follow link
   outside an open overlay → close it like Esc
```

The UI keeps owning geometry; the core keeps owning behavior and receives only model-level targets.

# 3. Scope

## In Scope

- Wheel, left click, left drag, double- and triple-click, and Ctrl+left click on: editor windows (text, gutter, winbar, wrapped, horizontally scrolled, concealed, and widget rows), explorer, bufferline, side panel, Bases table, board, and view tabs, pickers (picker, palette, help), calendar, completion, which-key, prompt, conflict, statusline, command line, and toasts.
- A `mouse` configuration setting that turns mouse handling on or off at runtime.
- Terminal mouse modes and their restore on every exit path.

## Out of Scope

- Hover effects and any-motion tracking (mode 1003) — no surface needs hover; it raises input volume. Future trigger: a hover-only feature such as link previews.
- Horizontal wheel scrolling in editor windows — `so` has no horizontal view scroll or `zh`/`zl` command. Future trigger: a keyboard horizontal-scroll command.
- Window resizing by dragging separators — `so` has no keyboard resize command, and REQ1 forbids mouse-only actions. Future trigger: a keyboard window-resize command.
- Drag-and-drop of files, cards, or tabs — the parent UI design excludes it (`rm261003abzp-ui-design.md:2359`).
- Right-click context menus and middle-click paste — no context-menu surface exists, and primary-selection paste is not portable to macOS.
- Mouse pointer shape changes (OSC 22) — limited terminal support.
- The browser preview page (`src/preview`), which already handles clicks in the browser.

## Roadmap Assignment

None — standalone work.

## Affected Interfaces and Actors

- Terminal user — gains mouse input on every TUI surface; keyboard behavior is unchanged.
- `src/core/state/types.ts` `MouseEvent` and the `mouse` action — the UI-to-core mouse contract grows beyond `scroll`.
- `src/ui` views and overlays — translate pointer cells into model targets.
- `src/core/config/schema.ts` `ConfigSchema` — gains the `mouse` setting.

# 4. Standards and Constraints

## Binding Standards

- `.s1mple/docs/project.md` Boundaries — `src/core` imports nothing from `@opentui`; the core receives model targets, never OpenTUI events or screen rects.
- `.s1mple/docs/project.md` Architecture — input → `src/ui` normalize → `store.dispatch(action)` → pure `update`; every mouse effect on state goes through the reducer.
- `.s1mple/docs/languages/typescript.md` — strict TypeScript, colocated behavior-named tests, `bun run check` before commit.
- `rm261003abzp-ui-requirements.md` RM261003ABZP-UREQ11@R1 — every action keeps a keyboard path; the mouse is optional.

## Constraints

- OpenTUI `@opentui/core@0.5.14` delivers `down`, `up`, `drag`, `drag-end`, `drop`, and `scroll` with `button`, `x`, `y`, and `modifiers` (context Section 6 Interfaces); with `enableMouseMovement: false` no plain motion is reported.
- OpenTUI's double-click detection runs only for `selectable` renderables, and no `so` view is selectable (context Section 5 step 5); click counting must not depend on it.

## Accepted Assumptions

- Terminals in scope report SGR mouse (1006); OpenTUI decodes it.
- Most terminals reserve Shift+drag for their own text selection and do not report it; that native selection remains the way to copy rendered text such as concealed markup or images.

## Dependencies

- Existing reducers reused by clicks: `focus` (`src/core/state/commands.ts:291-302`), explorer `moveCursor`/`expandOrOpen` (`src/core/state/explorer.ts:267,284`), `pickerKey` (`src/core/state/picker.ts:655`), `calendarKey` (`src/core/state/calendar.ts:79`), `sidePanelKey` (`src/core/state/side-panel.ts:214`), `followLink` (`src/core/state/link-commands.ts:78`), and Bases commands (`src/core/state/base-commands.ts`).
- Vim Visual state `vim.mode` and `vim.visualAnchor` (`src/core/kernel/vim/types.ts:33-45`).

## Risks and Compatibility

- **Concealed and wrapped text** — a click must land on the source character shown under the pointer; `RenderLine` has no display-to-source column map today (context Section 4 table), so the design must add one or an equivalent.
- **Full-screen overlay and toast hit areas** — they capture clicks over cells they do not paint; the design must route those clicks correctly.
- **Accidental destructive choices** — clicks must never answer the prompt or conflict dialogs.
- **Terminal restore** — mouse tracking must stay off after every exit path (`test/e2e/quit.test.ts:130`, `test/e2e/restore.test.ts:33`).
- **Insert-mode undo** — moving the cursor by click in Insert mode must split undo and `.` repeat (as `<Esc>`, move, `i`), so one undo never spans two places.

# 5. Current Requirements

## W261005H4XZ-REQ1@R1: Mouse maps to keyboard actions

**Requirement ID:** `W261005H4XZ-REQ1`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** What may a mouse gesture do?

**Answer:** Every mouse gesture performs the same state change as an existing keyboard action or key sequence on the targeted surface. The mouse adds no capability that has no keyboard path. Right and middle buttons, and any gesture not listed in REQ2–REQ8, do nothing.

**Rationale:** This keeps one source of behavior per action, keeps the keyboard complete as RM261003ABZP-UREQ11@R1 requires, and makes the mouse cheap to maintain: a new keyboard feature gains mouse support by mapping, not by new logic. Drag selection maps to `v` plus motions; double-click maps to `viw`.

**Acceptance Criteria:**

- [ ] For every gesture in REQ2–REQ8, a test shows the resulting state equals the state produced by its documented keyboard equivalent from the same starting state.
- [ ] Right-button and middle-button presses leave the state unchanged.

**Depends On:** None

## W261005H4XZ-REQ2@R2: Wheel scrolls the surface under the pointer

**Requirement ID:** `W261005H4XZ-REQ2`

**Revision:** `R2`

**Previous Revision:** `W261005H4XZ-REQ2@R1`

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** The horizontal wheel no longer scrolls editor windows. `so` has no horizontal view scroll or `zh`/`zl` command (the view derives its left column from the cursor), so that gesture would have no keyboard equivalent, which REQ1 forbids. Found in the system-design review.

**Question:** What does the wheel do, and on which surface?

**Answer:** The wheel acts on the surface under the pointer, not the focused one, and never changes focus or mode. Each notch moves 3 lines or items:

| Surface under pointer | Vertical wheel | Horizontal wheel |
|---|---|---|
| Editor window (any, active or not) | Scrolls the view; the cursor stays where it is (current behavior) | Nothing |
| Explorer, side panel, picker list, completion list | Moves the selection by 3 items (as `j`/`k` ×3) | None |
| Bases table | Moves the focused row by 3 (as `j`/`k` ×3) | Scrolls columns by 1 (as `H`/`L` on a table) |
| Bases board | Moves the focused card by 3 within its lane (as `j`/`k` ×3) | Moves lane focus by 1 (as `h`/`l`; never `H`/`L`, which move cards) |
| Calendar | Moves the selected day by one week per notch (as `j`/`k`) | None |
| Statusline, command line, bufferline, prompt, conflict, which-key, toast | Nothing | Nothing |

**Rationale:** Scrolling under the pointer is the standard in Neovim, VS Code, and every GUI. Moving the selection in list surfaces matches fzf and Telescope and reuses existing key reducers without adding per-list scroll state. Keeping the editor cursor in place on wheel preserves the existing scroll behavior (`src/ui/editors/text-view.ts:319-323`).

**Acceptance Criteria:**

- [ ] With two split windows and the left one active, a wheel-down over the right window advances the right window's scroll by 3 and leaves the left window, `windows.active`, and the mode unchanged.
- [ ] A wheel-down over the explorer moves its selection by 3 rows while an editor window stays focused.
- [ ] A wheel over a Bases table in an inactive window moves that window's focused row without activating the window.
- [ ] Scrolling clamps at the first and last line or item.

**Depends On:** `W261005H4XZ-REQ1@R1`

## W261005H4XZ-REQ3@R1: Click focuses the surface under the pointer

**Requirement ID:** `W261005H4XZ-REQ3`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which surface receives focus on a left click?

**Answer:** A left press on an editor window (including its winbar and gutter), the explorer, or the side panel gives that surface keyboard focus, exactly as the keyboard focus commands do, before the surface's own click action (REQ4–REQ7) runs. Clicks on the bufferline, statusline, and command line do not move focus between windows.

**Rationale:** Click-to-focus is universal and the precondition for every other click behavior; reusing the `focus` reducer keeps `windows.active` and `panels.side.focused` consistent with keyboard focus moves.

**Acceptance Criteria:**

- [ ] A click in an inactive split makes it `windows.active`.
- [ ] A click in the explorer or side panel focuses it; a later click in a window returns focus to that window.
- [ ] A click on the winbar focuses that window without moving its cursor.

**Depends On:** `W261005H4XZ-REQ1@R1`

## W261005H4XZ-REQ4@R1: Click places the editor cursor

**Requirement ID:** `W261005H4XZ-REQ4`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Where does a left click put the cursor, and what happens to the mode?

**Answer:** A left click in an editor window's text area puts the cursor on the source character displayed under the pointer, following Neovim `mouse=a`:

- Wrapped rows, horizontal scroll, tabs, and wide characters map to the source column displayed at that cell.
- Concealed live-preview text maps to the source column of the visible character under the pointer; a click on a widget row (image, embed, Mermaid, Base embed) lands at the start of the widget's source line.
- A click in the gutter lands at column 0 of that row's source line; a click past the end of a line lands on its last character (Normal) or after it (Insert); a click below the last line lands on the last line.
- Mode: Normal stays Normal; Insert stays Insert with the cursor moved, as `<Esc>`, the move, then `i`, so undo and `.` split at the click; Visual and VisualLine return to Normal; a pending operator, count, or register is cancelled.

**Rationale:** This is the behavior Vim and Neovim users expect, and clicking concealed text must not misplace the cursor, because the next edit would land in the wrong place.

```text
source:  See [[Project Plan|plan]] now        (cursor not on this line)
display: See plan now
click on "l" of "plan" → cursor at source column of "l" in the alias "plan"
```

**Acceptance Criteria:**

- [ ] A click on a wrapped continuation row lands on the matching source column.
- [ ] A click on a concealed link alias lands on the alias character's source column, not on the hidden `[[`.
- [ ] A click on a widget row lands at the widget source line's column 0.
- [ ] A click in Insert mode keeps Insert mode, moves the cursor, and `u` afterward undoes only the text typed after the click.
- [ ] A click in Visual mode returns to Normal mode at the clicked position.

**Depends On:** `W261005H4XZ-REQ3@R1`

## W261005H4XZ-REQ5@R1: Drag and multi-click select in Visual mode

**Requirement ID:** `W261005H4XZ-REQ5`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does the mouse select text in an editor window?

**Answer:** Mouse selection is vim Visual mode, not a separate selection:

- Left drag enters charwise Visual with the anchor at the press position and the cursor following the pointer; it extends on each drag event. A drag event above or below the text area scrolls one line in that direction and extends the selection.
- Release keeps Visual mode so `y`, `d`, `c`, `"+y`, and other Visual commands apply. Nothing is copied automatically.
- Double-click selects the word under the pointer (as `viw`); triple-click selects the line (as `V`). Clicks count as one sequence when they hit the same cell within 500 ms.
- Drag starting in Insert mode leaves Insert mode first.

**Rationale:** Reusing Visual mode means one selection model, one paint path (`selectionMarks`), and every existing Visual command works on mouse selections with no new code. No auto-copy matches Neovim and avoids clobbering the clipboard; Shift+drag remains the terminal's native copy.

**Acceptance Criteria:**

- [ ] Press at (line 2, col 3), drag to (line 4, col 1), release: mode `visual`, anchor (2,3), cursor (4,1); `y` yanks exactly that range.
- [ ] Dragging past the bottom row scrolls the window by one line per drag event.
- [ ] A double-click on a word equals the state after `viw` there; a triple-click equals `V`.
- [ ] Two clicks more than 500 ms apart or on different cells are two single clicks.

**Depends On:** `W261005H4XZ-REQ4@R1`

## W261005H4XZ-REQ6@R1: Ctrl+click follows links

**Requirement ID:** `W261005H4XZ-REQ6`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does the mouse follow a link in an editor window?

**Answer:** Ctrl+left click on a link (wikilink, Markdown link, or URL) places the cursor there and follows it exactly as `gd` does. A plain click only places the cursor (REQ4).

**Rationale:** A plain click must stay a cursor move in an editor, as in VS Code and Neovim; Ctrl+click is the editor standard for following links. `gd` already resolves every link kind, so the click only targets it.

**Acceptance Criteria:**

- [ ] Ctrl+click on a wikilink produces the same state and effects as placing the cursor there and pressing `gd`.
- [ ] Ctrl+click on plain text behaves as a plain click.

**Depends On:** `W261005H4XZ-REQ4@R1`

## W261005H4XZ-REQ7@R1: Clicks on chrome and Bases surfaces

**Requirement ID:** `W261005H4XZ-REQ7`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** What does a left click do on each non-editor surface?

**Answer:**

| Surface | Single click | Double-click |
|---|---|---|
| Bufferline tab | Shows that buffer in the active window (as `:b`) | Same as single |
| Explorer row | Selects the row and activates it (as `Enter`: open file, toggle folder) | Same as single |
| Side panel entry | Selects the entry and activates it (as `Enter`) | Same as single |
| Bases view tab | Switches to that view | Same as single |
| Bases table cell | Focuses that row and column | Focuses it and opens its note (as `Enter`) |
| Bases board card | Focuses that card | Focuses it and opens its note (as `Enter`) |
| Picker, palette, help item | Selects and accepts it (as `Enter`) | Same as single |
| Completion item | Accepts it | Same as single |
| Calendar day | Selects that day and opens it (as `Enter`) | Same as single |
| Statusline, command line, which-key, bufferline `‹ ›` markers | Nothing | Nothing |
| Toast | Click passes through to the surface beneath | — |

**Rationale:** File trees, pickers, and tab bars activate on a single click (VS Code, neo-tree, fzf); spreadsheets focus on click and act on double-click, so a single click in a Base only moves focus and never leaves the Base by accident. Toasts are transient and have no keyboard dismissal, so they must not block clicks.

**Acceptance Criteria:**

- [ ] A click on a bufferline tab equals `:b <that buffer>`.
- [ ] A click on a closed explorer folder expands it; a click on a file opens it.
- [ ] A click on a Bases view tab switches the view; a single click on a cell only moves focus; a double-click equals focusing the cell and pressing `Enter`.
- [ ] A click on a picker item equals selecting it and pressing `Enter`.
- [ ] A click on a cell covered by a toast acts on the surface beneath it.

**Depends On:** `W261005H4XZ-REQ3@R1`

## W261005H4XZ-REQ8@R1: Overlay and command-line mouse rules

**Requirement ID:** `W261005H4XZ-REQ8`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** What happens to mouse input while an overlay or the command line is open?

**Answer:**

- **Dismissible overlays** (picker, palette, help, calendar, which-key) and the open command line (`:`, `/`, `?`): a click outside them closes them exactly as `Esc` does, and that click does nothing else. Clicks and wheel inside them follow REQ2 and REQ7.
- **Completion popup**: a click outside closes it and is then handled normally, because completion does not block editing.
- **Blocking dialogs** (prompt, conflict): clicks and wheel anywhere do nothing. They are answered by keyboard only.

**Rationale:** Click-outside-to-dismiss is the standard for popovers and pickers, and consuming the click avoids surprising side effects under the overlay. Prompts and conflict choices can delete, rename, or overwrite data, so they must not be answered by a stray click.

**Acceptance Criteria:**

- [ ] With the file picker open, a click on an editor window closes the picker and leaves the window's cursor and focus unchanged.
- [ ] With the prompt or conflict dialog open, clicks and wheel anywhere leave the state unchanged.
- [ ] With completion open in Insert mode, a click elsewhere in the text closes completion and moves the cursor.

**Depends On:** `W261005H4XZ-REQ7@R1`

## W261005H4XZ-REQ9@R1: Mouse configuration and terminal modes

**Requirement ID:** `W261005H4XZ-REQ9`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How is mouse reporting configured and kept safe for the terminal?

**Answer:** A top-level `mouse` boolean config setting (default `true`) turns mouse reporting on or off, applied at startup and on config reload. When on, `so` requests button-event tracking with SGR encoding and never any-motion tracking. When off, the terminal receives no mouse-reporting request, so its native selection works without Shift. Mouse modes are off after every exit path.

**Rationale:** An on/off switch is standard (Vim `mouse`, Helix `editor.mouse`) and helps users who prefer native terminal selection. Button-event tracking reports drags without the input volume of any-motion tracking, matching the editor foundation's earlier decision (`w261003hege-system-design.md:2377`).

**Acceptance Criteria:**

- [ ] With `mouse = false`, a PTY run reports mouse mode `"none"` while running, and mouse input changes nothing.
- [ ] With the default config, a PTY run reports mouse mode `"drag"` (button-event) while running.
- [ ] After `:q`, `SIGTERM`, and a crash, mouse mode is `"none"` (existing restore tests stay green).
- [ ] Setting `mouse` to an invalid type is a config error, as for other settings.

**Depends On:** None

# 6. Research Impact Review

None — research was skipped

# 7. Historical Requirement Revisions

## W261005H4XZ-REQ2@R1: Wheel scrolls the surface under the pointer

**Requirement ID:** `W261005H4XZ-REQ2`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005H4XZ-REQ2@R2`

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** What does the wheel do, and on which surface?

**Answer:** The wheel acts on the surface under the pointer, not the focused one, and never changes focus or mode. Each notch moves 3 lines or items:

| Surface under pointer | Vertical wheel | Horizontal wheel |
|---|---|---|
| Editor window (any, active or not) | Scrolls the view; the cursor stays where it is (current behavior) | Scrolls columns when the window does not wrap |
| Explorer, side panel, picker list, completion list | Moves the selection by 3 items (as `j`/`k` ×3) | None |
| Bases table | Moves the focused row by 3 (as `j`/`k` ×3) | Scrolls columns by 1 (as `H`/`L` on a table) |
| Bases board | Moves the focused card by 3 within its lane (as `j`/`k` ×3) | Moves lane focus by 1 (as `h`/`l`; never `H`/`L`, which move cards) |
| Calendar | Moves the selected day by one week per notch (as `j`/`k`) | None |
| Statusline, command line, bufferline, prompt, conflict, which-key, toast | Nothing | Nothing |

**Rationale:** Scrolling under the pointer is the standard in Neovim, VS Code, and every GUI. Moving the selection in list surfaces matches fzf and Telescope and reuses existing key reducers without adding per-list scroll state. Keeping the editor cursor in place on wheel preserves the existing scroll behavior (`src/ui/editors/text-view.ts:319-323`).

**Acceptance Criteria:**

- [ ] With two split windows and the left one active, a wheel-down over the right window advances the right window's scroll by 3 and leaves the left window, `windows.active`, and the mode unchanged.
- [ ] A wheel-down over the explorer moves its selection by 3 rows while an editor window stays focused.
- [ ] A wheel over a Bases table in an inactive window moves that window's focused row without activating the window.
- [ ] Scrolling clamps at the first and last line or item.

**Depends On:** `W261005H4XZ-REQ1@R1`
