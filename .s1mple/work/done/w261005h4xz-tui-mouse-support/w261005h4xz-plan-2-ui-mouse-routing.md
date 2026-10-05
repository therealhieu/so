# W261005H4XZ Plan Part 2 — ui-mouse-routing

## Status

`Ready`

## Objective

Real terminal mouse input reaches the Part 1 core. One `MouseLayer` and `MouseRouter` receive every OpenTUI mouse event, drop what the core must not see, resolve the target through each view's `targetAt` in z-order, count clicks, capture drags, and dispatch `{type:"mouse", event, now}`. Every editor, Bases, chrome, and overlay surface answers with model targets from its last-layout geometry. The terminal runs button-event tracking while `mouse` is on, none while it is off, and none after every exit.

## Coverage Summary

- **System Design:** `W261005H4XZ-REQ1@R1`, `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ4@R1`, `W261005H4XZ-REQ5@R1`, `W261005H4XZ-REQ7@R1`, `W261005H4XZ-REQ8@R1`, `W261005H4XZ-REQ9@R1`; `W261005H4XZ-DES2`, `W261005H4XZ-DES3`, `W261005H4XZ-DES6` (runtime); `S1`–`S3`, `S5`, `S7`, `S8`, `S10`–`S14`; `V2`, `V3`, `V13`, `V16`, `V18`, `V20`–`V23`, `V25`, `V26`, `V28`, `V30`
- **UI Design:** None

## Sources

- Plan index: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-index.md`
- Plan context: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-plan-context.md`
- System design: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-system-design.md`
- UI design: Not applicable — no UI design for this work; the system design is the sole authority
- System requirements: `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-requirements.md`
- UI requirements: Not applicable — no UI requirements document for this work

## Dependencies

- Part 1 (`P1-G1`) verified. This part consumes:
  - `MouseTarget`, `WindowSpot`, and `MouseEvent`, plus the `Action` `mouse` member with `now`.
  - `rowAt`, `sourceColAt`, `ScreenRow`, and `Span.col`/`Span.inserted`.
  - `AppConfig.mouse`.
  - `EditorView` without `onMouseScroll`.

## Execution Flow

```text
P2-G1: router, shell, and window sources → P2-G2: chrome and overlay sources
```

## Groups

### P2-G1 — router-shell-and-window-sources

#### Goal

Mouse events from the renderer reach the core through one router. The wheel, clicks, multi-clicks, and drags work on editor and Bases windows at their real geometry. `renderer.useMouse` follows `config.mouse`, and the terminal mouse mode is `"drag"` while on, `"none"` while off, and `"none"` after every exit.

#### Coverage Summary

- **System Design:** `REQ1@R1`, `REQ2@R2`, `REQ4@R1`, `REQ5@R1`, `REQ7@R1` (Bases), `REQ9@R1`; `DES2`, `DES3` (window sources), `DES6` (runtime); `S1`, `S2`, `S3`, `S5`, `S7`, `S8`, `S10`, `S13`, `S14`; `V2`, `V3`, `V13`, `V20`, `V21`, `V22`, `V23`, `V25`, `V26`, `V28`
- **UI Design:** None

#### Scope

- Included:
  - `createMouseRouter`, `MouseSource`, `CLICK_MS`, and `MouseLayer`.
  - `View` `targetAt?`/`dragAt?`, and router and layer wiring in `createShell().attach`.
  - `RENDERER_OPTIONS.useMouse: false` with the `paint` sync.
  - `WindowTree`, `EditorView`, `WindowView`, and `BaseView` sources.
  - `mountShell` `mouse`, the component cases for windows and Bases, the PTY mode cases, and exit-restore regression.
  - Plan-context gaps 1 (wiring in `attach`) and 5 (PTY via Bun source and `XDG_CONFIG_HOME`).
- Excluded:
  - Explorer, side panel, bufferline, statusline, command line, and overlay sources (`P2-G2`).
  - Core reducer changes (Part 1).
  - Delivery: push, PR #8 CI, and the work-folder move run after overall verification in the execution goal.
- Main files: `src/ui/{mouse,mouse.test,shell}.ts`, `src/ui/editors/{text-view,registry,base-view}.ts`, `src/ui/views/window-tree.ts`, `test/support/ui.ts`, `test/ui/mouse.test.ts`, `test/e2e/mouse.test.ts`, `test/e2e/pty.ts` (live mouse-mode accessor)

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1@R1, REQ9@R1 → DES2 → S1, S2 → V2, V3` | None | Right/middle buttons and mouse-off events never dispatch; the first source with a target wins |
| `REQ5@R1 → DES2 → S7, S8 → V13, V22` | None | Click count cycles within 500 ms on the same cell; drags stay with the origin window and dedupe |
| `REQ2@R2 → DES2, DES3 → S3 → V20` | None | Wheel over the right split scrolls it; active window unchanged |
| `REQ4@R1 → DES3 → S5 → V21` | None | Clicks on wrapped continuation rows and the gutter land on the right source column |
| `REQ7@R1 → DES3 → S10 → V23` | None | Bases view-tab click switches the view; table-cell click focuses that cell |
| `REQ9@R1 → DES6 → S2, S13, S14 → V25, V26, V28` | None | Terminal mode `"none"` with `mouse = false`, `"drag"` by default with SGR clicks moving the cursor, `"none"` after every exit |

#### Cross-Work Gates

None

#### Tasks

##### P2-G1-T1 — Mouse router

- **Outcome:** `createMouseRouter` filters, resolves, counts, captures, dedupes, and dispatches exactly as system design §7 `src/ui/mouse.ts` describes, proven against fake sources and a recording dispatch.
- **System Design:** `REQ1@R1`, `REQ5@R1`, `REQ9@R1`; `DES2`; `S1`, `S2`, `S7`, `S8`; `V2`, `V3`, `V13`, `V22`
- **UI Design:** None
- **Canonical Shapes:** System design §5 "Press", "Drag", "Wheel"; §6 "`MouseSource`", "Router press state"; §7 `src/ui/mouse.ts`
- **Files:** `src/ui/mouse.ts` (new) — `CLICK_MS`, `MouseSource`, `createMouseRouter`; `src/ui/mouse.test.ts` (new)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V2`, `V3`, `V13`, `V22`:** `src/ui/mouse.test.ts`

   **Preview:**

   ```ts
   import { expect, test } from "bun:test";
   import type { Action, MouseTarget } from "../core/state/types";
   import { createMouseRouter, type MouseSource } from "./mouse";

   // fake sources answer fixed targets by cell; dispatch records actions; now() is a settable clock
   // events are plain objects shaped like OpenTUI's MouseEvent (type, button, x, y, modifiers, scroll)

   test("right and middle buttons and a disabled mouse never dispatch", () => {});
   test("the topmost source with a target answers the click", () => {
     // overlay source returns a target → window source never asked; a source returning undefined is skipped
   });
   test("clicks on the same cell within the click window count up and wrap", () => {
     // t=0,300,600 same cell → clicks 1,2,3; another cell → 1; same cell after > CLICK_MS → 1
   });
   test("a drag stays with the window it started in and dispatches once per new target", () => {
     // press on window text, drags outside → origin.dragAt used; equal targets dispatch once;
     // up clears origin → following drag dropped; drag after a non-text press dropped
   });
   ```

   - Run `bun test src/ui/mouse.test.ts` and confirm failure because `./mouse` does not exist.

2. **GREEN:** `src/ui/mouse.ts` — `CLICK_MS`, `MouseSource`, `createMouseRouter`

   **Preview:**

   ```ts
   export const CLICK_MS = 500;
   export type MouseSource = { targetAt(x: number, y: number): MouseTarget | undefined;
                               dragAt?(x: number, y: number, from: MouseTarget): MouseTarget | undefined };

   export function createMouseRouter(o: { sources: readonly MouseSource[]; enabled: () => boolean;
                                          dispatch: (a: Action) => void; now: () => number }) {
     // UI-local: last press {x, y, at, clicks}, origin {source, target}, lastDrag (serialized target)
     return { handle(e: OpenTuiMouseEvent): void {
       // !enabled() → return
       // scroll → dx/dy from direction → dispatch wheel
       // down: button 0 only → resolve → clicks → origin → dispatch press (ctrl from modifiers)
       // drag: origin is window text → origin.source.dragAt → dedupe → dispatch drag
       // up / drag-end → clear origin and lastDrag
     } };
   }
   ```

   - At most one dispatch per event; no dispatch while disabled.
   - Import OpenTUI's mouse event type with `import type`.

3. **REFACTOR:** Keep router state in the closure; no class unless the file already needs one.

   **Preview:**

   ```ts
   // allowed: a local resolve(x, y) helper returning { source, target } | undefined
   // prohibited: behavior decisions (mode rules, overlay rules) in the router
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): add the mouse router

   Task: P2-G1-T1 — Mouse router
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V2`, `V3`, `V13`, `V22` — `bun test src/ui/mouse.test.ts` → all pass
- knip — `bun run knip` → no findings (`mouse.test.ts` consumes the exports until `P2-G1-T2` wires them)

##### P2-G1-T2 — Shell wiring and mouse-mode sync

- **Outcome:** `MouseLayer` is added last to `renderer.root`, sized to the terminal, and hidden while `mouse` is off. `attach(store)` builds the router with an empty source list (no view resolves targets yet; `P2-G1-T3` adds `windows`), `enabled: () => store.get().config.mouse`, `store.dispatch`, and `deps.now`. `Statusline` and `Bufferline` are hoisted to variables for `P2-G2`. `RENDERER_OPTIONS.useMouse` is `false`, and `paint` sets `renderer.useMouse` from state when it differs. `mountShell` returns `mouse: t.mockMouse`.
- **System Design:** `REQ9@R1`; `DES2`, `DES6`; `S2`, `S13`
- **UI Design:** None
- **Canonical Shapes:** System design §5 "Config", "Construction and Wiring Flow"; §7 `src/ui/mouse.ts` (`MouseLayer`), `src/ui/shell.ts`, `test/support/ui.ts`; plan context §7 gap 1
- **Files:** `src/ui/mouse.ts` — `MouseLayer`; `src/ui/shell.ts` — `RENDERER_OPTIONS`, `View`, `createShell().attach`, `paint`; `test/support/ui.ts` — `mountShell`; `test/ui/mouse.test.ts` (new)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — supports `S2`, `S13` (terminal-level proof in `P2-G1-T5`):** `test/ui/mouse.test.ts`

   **Preview:**

   ```ts
   import { expect, test } from "bun:test";
   import { mountShell } from "../support/ui";

   test("mouse reporting follows the mouse setting", async () => {
     // mount with default config → renderer.useMouse true after the first paint
     // mount with config mouse: false → renderer.useMouse false; a mouse.click on text changes nothing
   });
   ```

   - Run `bun test test/ui/mouse.test.ts` and confirm failure (`mouse` missing from `mountShell`, `useMouse` not synced).

2. **GREEN:** `src/ui/mouse.ts`, `src/ui/shell.ts`, `test/support/ui.ts` — layer, wiring, sync, test helper

   **Preview:**

   ```ts
   // mouse.ts
   export class MouseLayer extends Renderable {
     constructor(ctx: RenderContext, router: { handle(e: OpenTuiMouseEvent): void }) {
       // position absolute, zIndex 1000, onMouse = (e) => router.handle(e)
     }
     update(s: AppState): void { /* size = terminal; visible = s.config.mouse */ }
     protected renderSelf(): void {}
   }

   // shell.ts
     useMouse: false,            // state decides on the first paint
   export type View = { update(s: AppState): void; cursor?: …; targetAt?: MouseSource["targetAt"]; dragAt?: MouseSource["dragAt"] };
   // in attach(store), after views: hoist statusline/bufferline to consts; build router with sources [];
   // const layer = new MouseLayer(renderer, router); renderer.root.add(layer);
   // in paint(s): if (renderer.useMouse !== s.config.mouse) renderer.useMouse = s.config.mouse; layer.update(s);

   // test/support/ui.ts
   return { …, mouse: t.mockMouse };
   ```

   - Exit restore stays in `renderer.destroy()`; do not add mouse-off code to exit paths.
   - The source list grows to the full design order in `P2-G2`.

3. **REFACTOR:** Keep `attach` readable; group router and layer construction in one block.

   **Preview:**

   ```ts
   // allowed: a short local function in shell.ts that builds the router
   // prohibited: changing key-normalizer wiring or paint order of existing views
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): wire the mouse layer and follow the mouse setting

   Task: P2-G1-T2 — Shell wiring and mouse-mode sync
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `S13` support — `bun test test/ui/mouse.test.ts` → passes
- Regression — `bun test test/ui` → existing component suites pass unchanged

##### P2-G1-T3 — Editor and window targets

- **Outcome:**
  - `WindowTree` keeps its `rects` from `update`; `targetAt` delegates to the view under the cell, `dragAt` delegates to `from.window`'s view, and separators return `undefined`.
  - `WindowView` gains `targetAt` and optional `dragAt`.
  - `EditorView.targetAt` maps cells to a target: winbar → `winbar`; gutter → column 0; text → `rowAt` + `sourceColAt`; below the text → last line.
  - `EditorView.dragAt` clamps into the text area and sets `edge` −1/+1 above or below it.
- **System Design:** `REQ2@R2`, `REQ4@R1`, `REQ5@R1`; `DES3`; `S3`, `S5`, `S7`; `V20`, `V21`
- **UI Design:** None
- **Canonical Shapes:** System design §7 `src/ui/editors/text-view.ts`, "`src/ui/views/window-tree.ts`, `src/ui/editors/registry.ts`, `src/ui/editors/base-view.ts`"
- **Files:** `src/ui/editors/text-view.ts` — `EditorView.targetAt`, `EditorView.dragAt`; `src/ui/editors/registry.ts` — `WindowView`; `src/ui/views/window-tree.ts` — `rects`, `targetAt`, `dragAt`; `src/ui/shell.ts` — `windows` added to router `sources`; `test/ui/mouse.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V20`, `V21`:** `test/ui/mouse.test.ts`

   **Preview:**

   ```ts
   test("the wheel scrolls the split under the pointer", async () => {
     // vertical split, long buffer; mouse.scroll over the right window → right content.scroll 3; active unchanged
   });
   test("a click on a wrapped row or the gutter lands on the shown source column", async () => {
     // live preview, wrap on: click the second wrap row at a known glyph → cursor col = that source col
     // click the gutter → cursor col 0 on that line
   });
   ```

   - Run `bun test test/ui/mouse.test.ts` and confirm the new cases fail (no window source yet).

2. **GREEN:** `text-view.ts`, `registry.ts`, `window-tree.ts`

   **Preview:**

   ```ts
   // registry.ts
   export type WindowView = Renderable & { show…; cursor…; targetAt(x: number, y: number): MouseTarget | undefined;
                                           dragAt?(x: number, y: number): MouseTarget };
   // window-tree.ts
   private rects = new Map<WindowId, Rect>();   // kept from update
   targetAt(x, y) { /* view whose rect contains the cell → view.targetAt; else undefined */ }
   dragAt(x, y, from) { /* from.kind === "window" → that window's view.dragAt?.(x, y) */ }
   // text-view.ts
   targetAt(x, y) { /* outside rect → undefined; winbar row → winbar; gutter → col 0;
                       text → rowAt(lines, y - textTop, …) + sourceColAt(spans, startCol + leftCol + x - textX, tabWidth) */ }
   dragAt(x, y) { /* clamp to text rows/cols; edge = y above → -1, below → +1, else 0 */ }
   // shell.ts: sources: [windows]
   ```

   - Use only geometry kept by `show` (`rect`, `winbar`, `leftCol`, `skipRows`, `lines`), never OpenTUI layout getters.
   - Returned positions stay inside the buffer.

3. **REFACTOR:** Share the text-origin calculation between `targetAt` and `dragAt` in a private helper.

   **Preview:**

   ```ts
   // allowed: private textCell(x, y) used by both methods
   // prohibited: changing show/paint layout
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): resolve editor windows under the pointer

   Task: P2-G1-T3 — Editor and window targets
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V20`, `V21` — `bun test test/ui/mouse.test.ts` → all pass
- Regression — `bun test test/ui` → existing suites pass

##### P2-G1-T4 — Bases targets

- **Outcome:** `BaseView.targetAt` maps cells to targets:
  - Header row → `baseTab`, from tab ranges kept in `renderSelf`.
  - Table body → `baseCell`, from `cols` and `top`.
  - Board → `baseCard`, from `lanes`, `laneW`, `cardRows`, and `shown`.
  - Any other cell → `base`.
- **System Design:** `REQ7@R1`; `DES3`; `S10`; `V23`
- **UI Design:** None
- **Canonical Shapes:** System design §7 "`src/ui/views/window-tree.ts`, `src/ui/editors/registry.ts`, `src/ui/editors/base-view.ts`" (`BaseView.targetAt` row)
- **Files:** `src/ui/editors/base-view.ts` — kept tab ranges, `targetAt`; `test/ui/mouse.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V23`:** `test/ui/mouse.test.ts`

   **Preview:**

   ```ts
   test("clicks on a Base switch views and focus table cells", async () => {
     // open a .base with two views; click the second tab → selected view switched
     // click a table cell → focus row/column set to that cell
   });
   ```

   - Run `bun test test/ui/mouse.test.ts` and confirm the case fails.

2. **GREEN:** `src/ui/editors/base-view.ts` — `targetAt`

   **Preview:**

   ```ts
   private tabs: { x0: number; x1: number; view: number }[] = [];   // filled in renderSelf
   targetAt(x, y): MouseTarget | undefined {
     // outside rect → undefined; header row → baseTab; table → baseCell; board → baseCard; else base
   }
   ```

   - No drag behavior on Bases (`rm261003abzp-ui-design.md:2359`); `dragAt` stays absent.

3. **REFACTOR:** None beyond naming the kept geometry clearly.

   **Preview:**

   ```ts
   // prohibited: changing Bases paint output
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): resolve Bases tabs, cells, and cards under the pointer

   Task: P2-G1-T4 — Bases targets
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V23` — `bun test test/ui/mouse.test.ts` → passes
- Regression — `bun test test/ui` → existing Bases component tests pass

##### P2-G1-T5 — Terminal mouse modes over a PTY

- **Outcome:** Real `so` over a PTY reports mouse mode `"none"` while running with `mouse = false`, where an SGR click leaves the cursor in place. With the default config it reports `"drag"` while running, and an SGR press/release at a text cell moves the cursor there. Existing exit-restore suites still report `"none"` after `:q`, `SIGTERM`, and crash.
- **System Design:** `REQ9@R1`; `DES6`; `S2`, `S13`, `S14`; `V25`, `V26`, `V28`
- **UI Design:** None
- **Canonical Shapes:** System design §5 "Config"; §8 `test/e2e/mouse.test.ts`; plan context §7 gap 5
- **Files:** `test/e2e/mouse.test.ts` (new); `test/e2e/pty.ts` — `PtyProcess.mouse()` live accessor over `term.modes.mouseTrackingMode`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V25`, `V26`:** `test/e2e/mouse.test.ts`

   **Preview:**

   ```ts
   import { ready, runInPty } from "./pty";
   const MAIN = join(import.meta.dir, "../../src/app/main.ts");

   test("with mouse off the terminal reports no mouse and clicks do nothing", async () => {
     // temp XDG_CONFIG_HOME with so/config.toml "mouse = false"; env: { XDG_CONFIG_HOME }
     // script: ready → expect(p.mouse()).toBe("none") → send "\x1b[<0;5;3M\x1b[<0;5;3m" → cursor unchanged
   });
   test("by default the terminal reports button drags and a click moves the cursor", async () => {
     // ready → expect(p.mouse()).toBe("drag") → SGR press/release at a text cell → status/cursor shows the new position
   });
   ```

   - Run `bun test test/e2e/mouse.test.ts` and confirm failure (`p.mouse` missing).

2. **GREEN:** `test/e2e/pty.ts` — `PtyProcess.mouse()`

   **Preview:**

   ```ts
   // PtyProcess
   /** The terminal's current mouse tracking mode. */
   mouse(): PtyRun["screen"]["mouse"];
   // implementation: () => term.modes.mouseTrackingMode
   ```

   - Production code needs no change if `P2-G1-T2` and `P2-G1-T3` are correct; fix any defect the PTY run exposes in those files.
   - Every test kills its PTY child; no orphan `src/app/main.ts` process remains.

3. **REFACTOR:** Reuse the existing temp-workspace helpers style from `quit.test.ts`.

   **Preview:**

   ```ts
   // allowed: a local helper writing config.toml into a temp XDG_CONFIG_HOME
   // prohibited: changing quit.test.ts or restore.test.ts assertions
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(e2e): check terminal mouse modes and real clicks

   Task: P2-G1-T5 — Terminal mouse modes over a PTY
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V25`, `V26` — `bun test test/e2e/mouse.test.ts` → all pass
- `V28` — `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts` → all pass with unchanged assertions (`screen.mouse` `"none"` after exit)
- Process cleanup — `pgrep -fl 'src/app/main.ts'` → no orphans

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Router units (V2, V3, V13, V22) | `bun test src/ui/mouse.test.ts` | All pass |
| Component (V20, V21, V23) | `bun test test/ui/mouse.test.ts` | All pass |
| PTY (V25, V26) | `bun test test/e2e/mouse.test.ts` | All pass |
| Exit restore (V28) | `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts` | All pass |
| Fast gate | `bun run check` | Exit 0 |
| Full suites | `bun run test:ci` | Exit 0 |
| Work-ID scan | `git diff --name-only <group-base>..HEAD \| xargs rg -n 'W261005H4XZ\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P2-G1'` | No matches |
| Process cleanup | `pgrep -fl 'src/app/main.ts\|bun run dev'` | No processes started by this group remain |

#### Review and Verification Focus

- **Specification:**
  - One entry point handles every mouse event.
  - Right/middle buttons and mouse-off events are dropped.
  - Clicks count only on the same cell within 500 ms.
  - Drags are captured by the press window and deduped.
  - The wheel targets the window under the pointer.
  - Wrapped and gutter clicks land on the correct column.
  - Bases clicks switch views and focus cells, with no drag-and-drop.
  - `useMouse` matches config after every paint.
  - Exit restore is unchanged.
- **Technical:**
  - Views read kept geometry, never lagging layout getters.
  - At most one dispatch per event.
  - No core imports of `@opentui`.
  - `MouseLayer` paints nothing and is hidden when off.
  - The PTY tests kill their children.
  - Test names contain no work ids.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P2-G2 — chrome-and-overlay-sources

#### Goal

Clicks and the wheel work on the explorer, side panel, bufferline, statusline, command line, and overlays at their real geometry. The router's source list is complete and in design order. Toasts pass clicks through to the view beneath. `bun run check` and `bun run test:ci` pass with no obsolete references.

#### Coverage Summary

- **System Design:** `REQ1@R1`, `REQ2@R2`, `REQ7@R1`, `REQ8@R1`; `DES2` (source order), `DES3`; `S1`, `S3`, `S10`, `S11`, `S12`; `V3` (integration), `V16`, `V18`, `V30`
- **UI Design:** None

#### Scope

- Included:
  - `targetAt` on `ExplorerView`, `SidePanelView`, `Bufferline`, `Statusline`, and `CommandLine`.
  - `OverlayHost.targetAt`, plus `PickerView.itemAt`, `CalendarOverlay.itemAt`, and `CompletionView.itemAt`.
  - The full router source order: `[overlays, cmdline, statusline, side, explorer, bufferline, windows]`.
  - Component cases for chrome and overlays.
- Excluded:
  - `prompt.ts`, `conflict.ts`, `whichkey.ts`, and `notify.ts` (unchanged by design).
  - Core changes.
  - Delivery: push, PR #8 CI, and the work-folder move run in the execution goal after overall verification.
- Main files: `src/ui/views/{explorer,side-panel,bufferline,statusline,cmdline}.ts`, `src/ui/overlays/{host,picker,calendar,completion}.ts`, `src/ui/shell.ts` (source list), `test/ui/mouse.test.ts`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ7@R1 → DES3 → S10 → V16` | None | Bufferline tab click switches buffers; explorer folder click expands; file click opens (`fileLoad` effect) |
| `REQ7@R1, REQ8@R1 → DES2, DES3 → S1, S11, S12 → V3, V18` | None | Picker row click accepts that item; a click under a toast reaches the window; overlays answer before the body |
| `REQ1@R1 → DES2, DES3 → S1 → V30` | None | `bun run check` exit 0 with the complete wiring |

#### Cross-Work Gates

None

#### Tasks

##### P2-G2-T1 — Chrome targets

- **Outcome:** Each chrome view resolves cells to targets:
  - `ExplorerView`: list rows → `{explorer, path}`; frame, empty, or hint cells → `{explorer, path: ""}`.
  - `SidePanelView`: list lines → `{sidePanel, row}`; other panel cells → `{sidePanel, row: -1}`.
  - `Bufferline`: tab ranges kept in `renderSelf` → `bufferTab`; other cells on row 0 → `inert`.
  - `Statusline` and `CommandLine` rows → `inert`.
  - Hidden views → `undefined`.

  The router source list adds `cmdline`, `statusline`, `side`, `explorer`, and `bufferline` above `windows`.
- **System Design:** `REQ2@R2`, `REQ7@R1`; `DES2`, `DES3`; `S3`, `S10`; `V16`
- **UI Design:** None
- **Canonical Shapes:** System design §7 "`src/ui/views/{explorer,side-panel,bufferline,statusline,cmdline}.ts`", §5 "Construction and Wiring Flow"
- **Files:** `src/ui/views/explorer.ts`, `src/ui/views/side-panel.ts`, `src/ui/views/bufferline.ts`, `src/ui/views/statusline.ts`, `src/ui/views/cmdline.ts` — `targetAt`; `src/ui/shell.ts` — router `sources`; `test/ui/mouse.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V16`:** `test/ui/mouse.test.ts`

   **Preview:**

   ```ts
   test("clicks on the bufferline and explorer switch, expand, and open", async () => {
     // two buffers: click the other tab → active buffer switched
     // explorer open: click a folder → expanded; click a file → fileLoad effect recorded
   });
   ```

   - Run `bun test test/ui/mouse.test.ts` and confirm the case fails.

2. **GREEN:** the five views and `shell.ts`

   **Preview:**

   ```ts
   // explorer.ts / side-panel.ts: keep first and box from update; targetAt per system design §7 table
   // bufferline.ts: private tabs: { x0; x1; bufferId }[] filled in renderSelf; targetAt → bufferTab | inert
   // statusline.ts / cmdline.ts: targetAt(x, y) → y within own rows ? { kind: "inert" } : undefined
   // shell.ts: sources: [cmdline, statusline, side, explorer, bufferline, windows]
   ```

   - Views never dispatch; they only answer targets.

3. **REFACTOR:** Share nothing across views unless an existing helper already fits.

   **Preview:**

   ```ts
   // prohibited: a shared base class for sources
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): resolve panels, tabs, and status rows under the pointer

   Task: P2-G2-T1 — Chrome targets
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V16` — `bun test test/ui/mouse.test.ts` → passes
- Regression — `bun test test/ui` → existing suites pass

##### P2-G2-T2 — Overlay targets

- **Outcome:** `OverlayHost.targetAt` resolves the open overlay:
  - Hidden → `undefined`.
  - Otherwise it asks the open child's `itemAt`.
  - Inside the open overlay's box with no item → `overlay`.
  - Outside the box → `outside`, except completion → `undefined`, so the body resolves the cell.
  - Prompt, conflict, and which-key boxes come from `centered` with their constants.

  `PickerView`, `CalendarOverlay`, and `CompletionView` keep their list box and `first` and answer `itemAt`. `overlays` becomes the first router source. `ToastStack` is not a source.
- **System Design:** `REQ7@R1`, `REQ8@R1`; `DES2`, `DES3`; `S1`, `S11`, `S12`; `V3` (integration), `V18`
- **UI Design:** None
- **Canonical Shapes:** System design §7 "`src/ui/overlays/{host,picker,calendar,completion}.ts`"
- **Files:** `src/ui/overlays/host.ts` — `targetAt`; `src/ui/overlays/picker.ts` — `itemAt`; `src/ui/overlays/calendar.ts` — `itemAt`; `src/ui/overlays/completion.ts` — `itemAt`; `src/ui/shell.ts` — `overlays` first in `sources`; `test/ui/mouse.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V18`, `V3` (integration):** `test/ui/mouse.test.ts`

   **Preview:**

   ```ts
   test("a click on a picker row accepts it and clicks under a toast reach the window", async () => {
     // open the file picker; click the third row → that item accepted (fileLoad effect)
     // show a toast; click a text cell under it → cursor moved in that window
   });
   ```

   - Run `bun test test/ui/mouse.test.ts` and confirm the case fails.

2. **GREEN:** the four overlay files and `shell.ts`

   **Preview:**

   ```ts
   // picker.ts / completion.ts: keep box and first from paint; itemAt → overlayItem {index: first + row} | overlay | undefined
   // calendar.ts: itemAt = inverse of cellOf → calendarDay {date} | overlay | undefined
   // host.ts: targetAt(x, y) {
   //   hidden → undefined; child.itemAt(x, y) ?? (inside open box ? overlay : completion ? undefined : outside)
   // }
   // shell.ts: sources: [overlays, cmdline, statusline, side, explorer, bufferline, windows]
   ```

   - While any overlay except completion is open, no body target is produced.

3. **REFACTOR:** Keep box bookkeeping next to the paint code that computes it.

   **Preview:**

   ```ts
   // prohibited: changing overlay paint output or sizes
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): resolve overlay items and outside clicks

   Task: P2-G2-T2 — Overlay targets
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V18`, `V3` (integration) — `bun test test/ui/mouse.test.ts` → all pass
- `V30` — `bun run check` → exit 0
- `V31` — `rg 'kind: "scroll"|onMouseScroll' src` → no matches

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Component (V16, V18, V3 integration, plus G1 cases) | `bun test test/ui/mouse.test.ts` | All pass |
| Fast gate (V29, V30) | `bun run check` | Exit 0: biome, tsc, knip, unit suites |
| Full suites | `bun run test:ci` | Exit 0 |
| Obsolete reference (V31) | `rg 'kind: "scroll"\|onMouseScroll' src` | No matches |
| Work-ID scan | `git diff --name-only <group-base>..HEAD \| xargs rg -n 'W261005H4XZ\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P2-G2'` | No matches |
| Process cleanup | `pgrep -fl 'src/app/main.ts\|bun run dev'` | No processes started by this group remain |

#### Review and Verification Focus

- **Specification:**
  - The router source order matches system design §5.
  - Toasts are not sources.
  - Completion yields to the body.
  - Prompt and conflict produce no body targets.
  - Panel chrome cells focus only.
  - Bufferline markers and the status and command rows are inert.
- **Technical:**
  - Kept geometry matches what was painted in the same frame.
  - Hidden views return `undefined`.
  - No paint output changes.
  - Every new method is used, with no knip findings.
  - Test names contain no work ids.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ1@R1, REQ9@R1 → DES2 → S1, S2 → V2, V3` | None | `P2-G1`, `P2-G2` | `P2-G1-T1`, `P2-G2-T2` |
| `REQ5@R1 → DES2 → S7, S8 → V13, V22` | None | `P2-G1` | `P2-G1-T1` |
| `REQ2@R2 → DES2, DES3 → S3 → V20` | None | `P2-G1` | `P2-G1-T3` |
| `REQ4@R1 → DES3 → S5 → V21` | None | `P2-G1` | `P2-G1-T3` |
| `REQ7@R1 → DES3 → S10 → V16, V23` | None | `P2-G1`, `P2-G2` | `P2-G1-T4`, `P2-G2-T1` |
| `REQ7@R1, REQ8@R1 → DES3 → S11, S12 → V18` | None | `P2-G2` | `P2-G2-T2` |
| `REQ9@R1 → DES6 → S13, S14 → V25, V26, V28` | None | `P2-G1` | `P2-G1-T2`, `P2-G1-T5` |
| `REQ1@R1 → DES2, DES3 → S1 → V30` | None | `P2-G2` | `P2-G2-T2` |
| Plan-context gaps 1, 5, 6 | None | `P2-G1`, `P2-G2` | `P2-G1-T2`, `P2-G1-T5`, all tasks (knip) |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.

## Planning Gaps

None
