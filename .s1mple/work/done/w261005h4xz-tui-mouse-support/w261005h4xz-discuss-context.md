# W261005H4XZ: tui-mouse-support

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `.s1mple/docs/communication.md`, `.s1mple/docs/languages/typescript.md` | Writing rules; TypeScript and test conventions |
| `node_modules/@opentui/core/{Renderable,renderer}.d.ts`, `lib/parse.mouse.d.ts`, `testing/{mock-mouse,test-renderer}.d.ts`, `chunk-bun-j2z63cdy.js` | The renderer's mouse event model, dispatch, hit testing, built-in selection, and test mouse |
| `src/ui/shell.ts`, `src/ui/views/*.ts`, `src/ui/editors/{text-view,base-view}.ts`, `src/ui/overlays/*.ts`, `src/ui/widgets/base.ts` | Every UI surface, its geometry, and its current mouse handling |
| `src/core/state/{types,update,keys,commands,explorer,picker,calendar,side-panel,link-commands}.ts`, `src/core/kernel/vim/{types,engine}.ts`, `src/core/kernel/view/types.ts` | The `mouse` action, key routing, focus, Visual mode, yank and clipboard effects, and render-line data |
| `test/support/ui.ts`, `test/e2e/{pty,quit.test,restore.test}.ts` | How component and PTY tests drive input and check mouse modes |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-ui-requirements.md` (RM261003ABZP-UREQ11@R1), `rm261003abzp-ui-design.md` (lines 483, 2359), `rm261003abzp-design.md` (RM261003ABZP-DES10@R2), `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:621` | Related parent context: the roadmap's optional mouse obligations; not a binding |
| `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-system-design.md:2344,2377` | Why any-motion tracking was turned off |

## Roadmap Binding

None — standalone work.

### Previous Accepted Bindings

None

### Parent Synchronization

- **Registration or discussion update:** None

## 1. User Input

### Original Input

The user asked whether the TUI has mouse support, then asked for a plan to make the TUI fully support mouse and mouse events.

### Consolidated Requirement or Problem

The `so` TUI handles only the wheel, and only in text editor windows, where it always scrolls the active window rather than the one under the pointer. Clicks, drags, selection, and the wheel do nothing on every other surface: splits, explorer, bufferline, Bases table, board, and view tabs, pickers and other overlays, side panel, statusline, and command line. The work is to add full mouse support across the TUI, integrated with the pure core's one-way state flow and the vim modal model.

### Constraints and Assumptions

- The user delegated the decisions of this run and asked for approaches that are stable, simple, and easy to maintain and extend, and that follow industry standards.
- `src/core` stays pure: no `@opentui/*`, I/O, or runtime imports (`.s1mple/docs/project.md` Boundaries). The core therefore cannot receive OpenTUI `MouseEvent` objects or screen rects; the UI must translate them.
- Every action keeps a keyboard path; the mouse is an addition (RM261003ABZP-UREQ11@R1: "fully keyboard-operable with optional mouse support").
- The parent UI design says Bases have "no drag-and-drop; mouse limited to view tabs" (`rm261003abzp-ui-design.md:2359`). Mouse use in Bases beyond view tabs goes past that parent decision; this standalone work records the difference rather than changing the parent.
- The terminal must still be restored with mouse tracking off on every exit path; `test/e2e/quit.test.ts:130` and `test/e2e/restore.test.ts:33` assert `mouse` is `"none"`.
- Assumption: the terminals in scope report SGR mouse (1006); OpenTUI's `MouseParser` decodes both SGR and basic sequences (`lib/parse.mouse.d.ts:18-29`).

## 2. Project Structure

- `src/ui/shell.ts` — `RENDERER_OPTIONS` (mouse flags), view stack and z-order, the store subscription, and the key normalizer; the place where any shared mouse wiring would attach.
- `src/ui/editors/text-view.ts` — `EditorView`, the only view with a mouse handler today; it lays out each frame and keeps `rect`, `topLine`, `leftCol`, `skipRows`, and `lines`.
- `src/ui/editors/base-view.ts`, `src/ui/widgets/base.ts` — Bases window view and the table and board layouts it computes.
- `src/ui/views/{window-tree,explorer,bufferline,side-panel,statusline,cmdline}.ts` — body splits and docked chrome.
- `src/ui/overlays/{host,picker,calendar,prompt,conflict,whichkey,completion,notify}.ts` — floats above the body.
- `src/core/state/types.ts` — `MouseEvent` and the `mouse` action; `src/core/state/update.ts` — `onMouse`.
- `src/core/state/{keys,commands,explorer,picker,calendar,side-panel,base-commands,link-commands}.ts` — the reducers that clicks would reuse.
- `test/support/ui.ts`, `test/ui/*` — component tests over the OpenTUI test renderer; `test/e2e/pty.ts` — PTY tests.

## 3. Standards and Patterns

### Applicable Standards

- `.s1mple/docs/project.md` Boundaries — `src/core` imports nothing from `@opentui`; only `src/ui` imports `@opentui/*` (`test/boundaries.test.ts`).
- `.s1mple/docs/project.md` Architecture — input → `src/ui` (normalize) → `store.dispatch(action)` → pure `update` → `{state, effects}`; views repaint from state.
- `.s1mple/docs/languages/typescript.md` — strict TypeScript, `import type`, colocated `*.test.ts` unit tests named by behavior, `bun run check` before commit, no work-process IDs in code.
- `.s1mple/S1MPLE.md` Implementation — keep it lean and simple.
- `rm261003abzp-design.md` RM261003ABZP-DES10@R2 — `src/ui/input.ts` is the home of key and mouse normalization.

### Existing Patterns

- `src/ui/editors/text-view.ts:287-294` — a view sets an OpenTUI handler and dispatches a core action; it does not change state itself:

  ```ts
  this.onMouseScroll = (e) => {
    const up = e.scroll?.direction === "up";
    deps.dispatch({
      type: "mouse",
      event: { kind: "scroll", delta: up ? -SCROLL_LINES : SCROLL_LINES },
    });
  };
  ```

- `src/ui/shell.ts:151-158` — the key normalizer turns OpenTUI key events into core `key` actions; resize becomes a `resize` action.
- Views keep the geometry they laid out because "layout getters lag until the next frame" (`src/ui/editors/text-view.ts:272`, `src/ui/views/explorer.ts:97`).
- Keys reach surfaces by state, not by OpenTUI focus: `routeKey` checks `overlay.kind`, then cell edit, then the `:` line, then the side panel, the explorer, and the active window (`src/core/state/keys.ts:63-128`).
- Window focus is `windows.active`; `focus` in `src/core/state/commands.ts:291-302` moves it and toggles `panels.side.focused`.
- Selection is vim Visual mode: `vim.mode` `"visual"`/`"visualLine"` with `vim.visualAnchor` (`src/core/kernel/vim/types.ts:33-45`); the text view paints it with `selectionMarks` (`src/ui/editors/text-view.ts:244,569`).
- Yank to `+` emits a `clipboardWrite` effect (`src/core/state/keys.ts:337`, `src/core/state/types.ts:435`); the shell provides OSC 52 copy (`src/ui/shell.ts:175-177`).

## 4. Architecture

```text
terminal ──SGR mouse bytes──► OpenTUI CliRenderer
                                 │ MouseParser → RawMouseEvent {type, button, x, y, modifiers, scroll}
                                 │ hitTest(x, y) → renderable under pointer (z-order)
                                 ▼
             Renderable.processMouseEvent (bubbles to parent unless stopped)
                                 │
   src/ui views ── today only EditorView.onMouseScroll ──► store.dispatch({type:"mouse", event})
                                 │
   src/core update ── onMouse: scroll active window ──► state ──► views repaint
```

- OpenTUI `CliRenderer` — parses mouse input, hit-tests, dispatches to renderables, tracks drag capture, hover, and a built-in text selection (`renderer.d.ts:296-311,532,608-622`).
- `src/ui` views — custom `Renderable` subclasses that paint in `renderSelf`; none is `selectable` or `focusable`, so OpenTUI's built-in selection and auto-focus do not engage.
- `src/core` — owns all state changes; it knows windows as a tree and ids, not screen rects (rects are computed in `src/ui/views/window-tree.ts:20-47,66-81`).

| Surface | Renderable (file) | Mouse handler now | Geometry kept to map a cell back to the model |
|---|---|---|---|
| Editor window (text, gutter, wrap, conceal) | `EditorView` (`src/ui/editors/text-view.ts:267`) | `onMouseScroll` only | `rect`, `winbar`, `topLine`, `leftCol`, `skipRows`, `lines: RenderLine[]` (`:272-280`); gutter width from `gutterWidth` (`:40-41`); wrap via `wrapLine`/`rowOf`. `RenderLine` has `sourceLine` and styled `spans` but no display-to-source column map (`src/core/kernel/view/types.ts:33-38`), so concealed live-preview text cannot be mapped to an exact source column. `Span.link` carries a link target (`types.ts:7`; set in `src/core/lang/markdown/inline.ts:122`). Widgets (images, embeds, Mermaid, base embeds) occupy `widget.rows` rows |
| Winbar | painted by `EditorView.paintWinbar` | none | first row of `rect` when `winbar` |
| Split separators | `WindowTree` (`src/ui/views/window-tree.ts:53`) | none | `seps: Rect[]`; window rects are local to `update` and passed to each view's `show` |
| Explorer | `ExplorerView` (`src/ui/views/explorer.ts:77`) | none | `first`, `w`, `h`, `inner()` box, rows from `this.rows(s)` with `depth`; floats at `zIndex: 20` on narrow terminals |
| Bufferline | `Bufferline` (`src/ui/views/bufferline.ts:19`) | none | none kept: tab x-ranges and the `‹ ›` scroll offset are computed inside `renderSelf` |
| Side panel (backlinks, outline) | `SidePanelView` (`src/ui/views/side-panel.ts:58`) | none | `first`, `lines` with `row` indexes (`:61,79-86`) |
| Statusline | `Statusline` (`src/ui/views/statusline.ts:50`) | none | row `rows − 2`; segments computed in `renderSelf` |
| Command line | `CommandLine` (`src/ui/views/cmdline.ts:20`) | none | last row, plus a completion list above it while typing (`:41-45`) |
| Base window (table, board, view tabs) | `BaseView` (`src/ui/editors/base-view.ts:44`) | none | `frame` with `TableLayout` (`cols {index,x,w}`, `lines`, `top`, `bodyRows`; `src/ui/widgets/base.ts:29-40`) or `BoardLayout` (`lanes {index,x}`, `laneW`, `cardRows`, `shown`; `:380-395`); header row ` ▦ name  tabs` (`base-view.ts:183`) |
| Picker, palette, help | `PickerView` (`src/ui/overlays/picker.ts:58`) | none | list `first` is derived in `paintList` (`:202-210`), not kept |
| Calendar | `CalendarOverlay` (`src/ui/overlays/calendar.ts:40`) | none | `centered(s, WIDTH, HEIGHT)` box and `cellOf` give day cells (`:55-63`) |
| Prompt, conflict, which-key, completion | `src/ui/overlays/{prompt,conflict,whichkey,completion}.ts` | none | each paints a float; geometry derived from `centered` or the cursor |
| Overlay host | `OverlayHost` (`src/ui/overlays/host.ts:72`) | none | full screen at `zIndex: 50`, visible while any overlay is open |
| Toasts | `ToastStack` (`src/ui/overlays/notify.ts:18`) | none | right-hand column up to 40 cells wide, full body height, `zIndex: 40`, visible while toasts exist |

## 5. Code Flow

```text
wheel over an editor window
  → OpenTUI processSingleMouseEvent: type "scroll" → hitTest(x, y) → EditorView (or focused fallback)
  → EditorView.onMouseScroll → dispatch {type:"mouse", event:{kind:"scroll", delta:±3}}
  → update → onMouse(s, e): active window's content.scroll += delta, clamped to [0, lineCount−1]
  → EditorView.show: keeps a scroll that left the cursor off screen (followsCursor = false)

click / drag anywhere
  → OpenTUI dispatches "down"/"up"/"drag"/"drag-end"/"drop" to the hit renderable → no handler → nothing
```

1. `RENDERER_OPTIONS` sets `useMouse: true` and `enableMouseMovement: false` (`src/ui/shell.ts:32-40`), so the terminal reports button presses, releases, drags, and wheel, but not plain motion; `over`/`out` fire only during drags.
2. OpenTUI's `processSingleMouseEvent` (`chunk-bun-j2z63cdy.js:9288-9418`) sends `scroll` to the hit renderable; for other types it starts built-in selection only on a `selectable` renderable, captures the renderable on a left-button drag, sends `drag` to the captured renderable, and on release sends `drag-end`, `up`, and `drop`.
3. `Renderable.processMouseEvent` calls `onMouse`, the per-type handler, and `onMouseEvent`, then bubbles to the parent unless `stopPropagation()` was called (`chunk-bun-j2z63cdy.js:1455-1463`).
4. `dispatchMouseEvent` focuses the nearest `focusable` ancestor on a left `down` when `autoFocus` is on (`:9264-9277`); no `so` view is focusable, so this does nothing today.
5. OpenTUI's double- and triple-click detection (`nextClickBehavior`, 500 ms, ≤ 1 cell; `:7182,10277-10284`) runs only for `selectable` renderables.
6. `onMouse` (`src/core/state/update.ts:239-257`) changes only `windows.byId[active].content.scroll`; it ignores which window was under the pointer, and it does not move the cursor.
7. Keys go through `handleKeyAction` → `routeKey` (`src/core/state/keys.ts:48-90`); reducers for clicks to reuse already exist: `focus` (window focus), `moveCursor`/`expandOrOpen` (explorer, `src/core/state/explorer.ts:267,284`), `pickerKey` (`src/core/state/picker.ts:655`), `calendarKey` (`src/core/state/calendar.ts:79`), `sidePanelKey` (`src/core/state/side-panel.ts:214`), `followLink` (`src/core/state/link-commands.ts:78`), and the Bases commands in `src/core/state/base-commands.ts`.

## 6. Boundaries

### In Scope

- The mouse event contract between `src/ui` and `src/core` (`MouseEvent`, the `mouse` action) and its reducer.
- Left click, drag, release, multi-click, and wheel on every TUI surface listed in Section 4, and modifier and right/middle-button behavior where it is defined.
- Mapping screen cells to model positions in each view, including the editor's gutter, wrap, horizontal scroll, winbar, and widget rows.
- Mouse selection in editor windows and how it relates to vim Visual mode, yank, and the clipboard.
- Renderer mouse options (`useMouse`, `enableMouseMovement`) and terminal restore of mouse modes.
- Component tests through OpenTUI's test mouse and PTY coverage of mouse modes.

### Out of Scope

- The browser preview page (`src/preview`); clicks there already work in the browser.
- Changing parent roadmap documents.
- Terminal emulators that cannot report mouse events; keyboard paths remain the fallback.

### Interfaces and Dependencies

- `@opentui/core@0.5.14` `MouseEvent` (`renderer.d.ts:154-177`): `type: "down" | "up" | "move" | "drag" | "drag-end" | "drop" | "over" | "out" | "scroll"` (`lib/parse.mouse.d.ts:1`), `button` (`MouseButton` `LEFT 0`, `MIDDLE 1`, `RIGHT 2`, `WHEEL_UP 4`, `WHEEL_DOWN 5`; `renderer.d.ts:183-190`), `x`, `y` (screen cells), `modifiers {shift, alt, ctrl}`, `scroll {direction: "up"|"down"|"left"|"right", delta}`, `target`, `currentTarget`, `isDragging`, `stopPropagation()`, `preventDefault()`.
- Renderable handlers (`Renderable.d.ts:74-83,286-297`): `onMouse`, `onMouseDown`, `onMouseUp`, `onMouseMove`, `onMouseDrag`, `onMouseDragEnd`, `onMouseDrop`, `onMouseOver`, `onMouseOut`, `onMouseScroll`, and the overridable `onMouseEvent`; `selectable`, `shouldStartSelection`, `onSelectionChanged` (`:131,172-175`).
- Renderer: `hitTest(x, y)` (`renderer.d.ts:532`), `setMousePointer(style)` (`:531`), `copyToClipboardOSC52` (`:565`), `getSelection`/`startSelection`/`updateSelection`/`clearSelection` (`:608-622`), config `useMouse`, `enableMouseMovement` (`:45-46`), `autoFocus` (JS `:7268,7519`).
- Tests: `createTestRenderer` also returns `mockMouse` (`testing/test-renderer.d.ts:13`), whose `click`, `doubleClick`, `pressDown`, `release`, `drag`, `scroll`, `moveTo`, and `emitMouseEvent` (`testing/mock-mouse.d.ts:28-39`) drive the real renderer path. `mountShell` keeps `t` but exposes no mouse helper (`test/support/ui.ts:72-76,121-170`). `PtyProcess.type(s)` writes raw bytes, so a PTY test can send SGR sequences; `PtyRun.screen.mouse` reports `"none" | "x10" | "vt200" | "drag" | "any"` (`test/e2e/pty.ts:63-75,83,179`).
- Terminal restore: `installLifecycle` restores through `shell.destroy()` → `renderer.destroy()` (`src/app/lifecycle.ts:55`); the PTY tests assert mouse mode `"none"` after every exit path.

## 7. Unknowns

- No test covers the `mouse` action or `onMouse` today (`rg 'type: "mouse"'` finds only `text-view.ts:290` and `types.ts:365`).
- RM261003ABZP-UREQ11@R1 (clicks on explorer rows, buffers, Bases view tabs, preview links; wheel scrolls) is assigned to RM261003ABZP-DI1@R2 and RM261003ABZP-DI2@R2 for PH1 surfaces (`rm261003abzp-roadmap-phase-1-daily-usable-editor.md:621`) and listed for PH2 (`rm261003abzp-roadmap-phase-2-obsidian-experience.md:458`). The delivered editor foundation kept a scroll-only `MouseEvent` (`w261003hege-editor-foundation/reports/overall-verification-report.md:181`), so the optional click criteria appear undelivered. Whether to report that back to the roadmap is a parent-synchronization question for the user.
- How OpenTUI's `hitTest` treats a visible renderable's transparent cells: `OverlayHost` (full screen, `zIndex: 50`) and `ToastStack` (right column, `zIndex: 40`) may capture clicks and wheel over areas they do not paint.
- Whether live-preview concealment needs a display-to-source column map for exact click placement, or whether placing the cursor and revealing the source line is acceptable.
- Whether turning on `enableMouseMovement` (any-motion tracking, mode 1003) is needed for hover; the editor foundation turned it off because the editor did not use it (`w261003hege-system-design.md:2377`), and it raises input volume.
- Whether mouse drag selection should use vim Visual mode (core state) or OpenTUI's built-in selection, and how it interacts with the terminal's own Shift+drag selection.
- Whether the core needs window rects (it has none today) or the UI resolves a click to a window id and model position before dispatching.
