# W261005H4XZ: tui-mouse-support — System Design

**Design Status:** Finalized System Design

**Context Source:** `w261005h4xz-discuss-context.md`

**Requirements Source:** `w261005h4xz-requirements.md`

**Research Source:** None

**Current Requirement Revisions:** `W261005H4XZ-REQ1@R1`, `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ3@R1`, `W261005H4XZ-REQ4@R1`, `W261005H4XZ-REQ5@R1`, `W261005H4XZ-REQ6@R1`, `W261005H4XZ-REQ7@R1`, `W261005H4XZ-REQ8@R1`, `W261005H4XZ-REQ9@R1`

**Research Reconciliation:** None — research skipped

**Unresolved Items:** None

**Design Boundary:** This artifact is authoritative for whole-system architecture and technical design, including UI/frontend applications, routes, modules, components, state ownership, contracts, files, symbols, boundaries, wiring, and verification when material. UI/UX look and feel, visual composition, concrete interaction treatment, responsive presentation, accessibility realization, mockups, and accepted UI-design authority belong to `s1mple-discuss-ui`.

Approved by the user on 2026-10-05: the user delegated every decision of this discussion run, asking for stable, simple, maintainable, extensible choices that follow industry standards.

**Finalized System Design Checklist:**

- [x] Every current qualified requirement revision has exactly one valid system-design coverage outcome: `System design required`, `No system design change`, or `No system design applicable`.
- [x] Every `System design required` outcome has the full `REQ → DES → S → V` chain.
- [x] Every `No system design change` outcome cites the existing system mechanism, exact current source, and existing verification evidence.
- [x] Every `No system design applicable` outcome explains why the requirement creates no system architecture or technical-design obligation and omits invented `DES`, `S`, and `V` records.
- [x] For roadmap-linked work, the accepted baseline has been checked against current parent definitions, every assigned parent obligation has valid child coverage, and gates due before design approval have evidence.
- [x] Historical requirement revisions are excluded from current design coverage.
- [x] When research exists, every RF-to-evaluated-revision relationship is reconciled and evaluated-versus-informed lineage is accurate; a finding that evaluated no requirement has one `None` relationship row.
- [x] When any requirement requires changed system design, the design progresses from system context and architecture to concrete files and symbols; otherwise sections 2–8 record explicit non-applicability without inventing system changes.
- [x] Every focal component, when any, has an existing target or proposed location and clear ownership.
- [x] The proposed project tree accounts for every affected source, wiring, configuration, migration, and test file as added, modified, renamed/moved, or deleted, or states why no system file changes apply.
- [x] Every changed or proposed logical contract, data model, and state item has a canonical section 7 detailed-shape reference; every unchanged item cites its exact current source and identifies affected section 7 consumers when relevant.
- [x] Every changed boundary has a contract, state rule, or signature.
- [x] Every modified symbol has an exact current source, current → final delta, and affected callers or consumers.
- [x] Detailed code design covers every important changed type, class, function, dependency, invariant, focused control flow, construction point, registration, and export; each code preview is immediately followed by an explanation of the definitions shown and how they interact.
- [x] Changed runtime flows name the participating symbols and define relevant failure policies.
- [x] Every cross-cutting, migration, and delivery concern is resolved with a concrete design location or `None — <reason>`.
- [x] Every `System design required` requirement, every design decision, and every changed invariant maps to an observable success criterion and an exact verification case and assertion.
- [x] Test suites and nested cases form one verification tree; every case names its unique risk and uses the lowest sufficient test level.
- [x] Unit and integration tests follow the section 8 quality rules without duplicating the same proof across levels.
- [x] Traceability is complete for every `System design required` outcome: `current REQ revision → DES → affected file → affected symbol → caller or wiring → runtime flow → success criterion → suite or check → exact verification case and assertion`; other outcomes have their required evidence instead of fabricated links.
- [x] UI/frontend technical design stays within the Design Boundary; UI/UX realization is deferred to `s1mple-discuss-ui`.
- [x] Every omitted structure, code preview, test level, or non-test check explains why it does not apply.

# Table of Contents

1. [Design Goals, Constraints, and Requirement Coverage](#1-design-goals-constraints-and-requirement-coverage)
2. [System Context and Architecture](#2-system-context-and-architecture)
3. [Components and Boundaries](#3-components-and-boundaries)
4. [Project Structure Changes](#4-project-structure-changes)
5. [Runtime Flows and Error Policies](#5-runtime-flows-and-error-policies)
6. [Logical Contracts, Data Models, and State](#6-logical-contracts-data-models-and-state)
7. [Detailed Code Design](#7-detailed-code-design)
8. [Testing and Verification](#8-testing-and-verification)
9. [Finalized Design Decisions](#9-finalized-design-decisions)
   - [W261005H4XZ-DES1: Model-level mouse contract](#w261005h4xz-des1-model-level-mouse-contract)
   - [W261005H4XZ-DES2: One mouse router on a top layer](#w261005h4xz-des2-one-mouse-router-on-a-top-layer)
   - [W261005H4XZ-DES3: Views resolve cells to targets](#w261005h4xz-des3-views-resolve-cells-to-targets)
   - [W261005H4XZ-DES4: Source columns on rendered spans](#w261005h4xz-des4-source-columns-on-rendered-spans)
   - [W261005H4XZ-DES5: Core mouse reducer maps gestures to keyboard actions](#w261005h4xz-des5-core-mouse-reducer-maps-gestures-to-keyboard-actions)
   - [W261005H4XZ-DES6: Mouse config toggles terminal reporting](#w261005h4xz-des6-mouse-config-toggles-terminal-reporting)

# 1. Design Goals, Constraints, and Requirement Coverage

## Goals

- Keep one source of behavior: every gesture runs an existing keyboard path in the pure core (W261005H4XZ-REQ1@R1).
- Keep geometry in `src/ui` and behavior in `src/core`: the UI turns a cell into a model target; the core never sees screen coordinates.
- Route every mouse event through one place, so click counting, drag capture, the on/off switch, and z-order live in one module instead of in each view.
- Map a click on concealed, wrapped, or tabbed text to the exact source column.

## Requirement Coverage

- `W261005H4XZ-REQ1@R1` — Mouse maps to keyboard actions.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005H4XZ-DES1`, `W261005H4XZ-DES5`
  - **How Addressed:** The core contract carries only model targets (DES1); `onMouse` runs each gesture through `feedKeys`, `runCommand`, or the exported reducer that the matching key uses (DES5). The router drops right and middle buttons (DES2).
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/types.ts` — `MouseEvent`, `MouseTarget`, `Action`; `src/core/state/mouse.ts` — `onMouse`, `feedKeys`; `src/ui/mouse.ts` — `createMouseRouter`
  - **Callers and Wiring:** `update` → `onMouse`; `MouseLayer` → router → `store.dispatch`
  - **Runtime Flow:** Section 5 "Press", "Wheel"
  - **Success Criteria:** S1, S2
  - **Verification:** V1, V2, V3
  - **Research Support:** None
- `W261005H4XZ-REQ2@R2` — Wheel scrolls the surface under the pointer.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005H4XZ-DES2`, `W261005H4XZ-DES3`, `W261005H4XZ-DES5`
  - **How Addressed:** The router resolves the wheel's target by pointer (DES2, DES3); `onMouse` scrolls an editor window by id and runs list moves inside `withFocus`, which restores focus afterward (DES5).
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/mouse.ts` — `wheel`, `withFocus`; views' `targetAt`
  - **Callers and Wiring:** router `scroll` events → `{kind:"wheel"}`
  - **Runtime Flow:** Section 5 "Wheel"
  - **Success Criteria:** S3
  - **Verification:** V4, V5, V6, V20
  - **Research Support:** None
- `W261005H4XZ-REQ3@R1` — Click focuses the surface under the pointer.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005H4XZ-DES5`
  - **How Addressed:** `onMouse` sets `windows.active`, `panels.explorer.focused`, and `panels.side.focused` from the target before the surface action (`focusTarget`).
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/mouse.ts` — `focusTarget`
  - **Callers and Wiring:** `press` handler
  - **Runtime Flow:** Section 5 "Press"
  - **Success Criteria:** S4
  - **Verification:** V7
  - **Research Support:** None
- `W261005H4XZ-REQ4@R1` — Click places the editor cursor.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005H4XZ-DES3`, `W261005H4XZ-DES4`, `W261005H4XZ-DES5`
  - **How Addressed:** `EditorView.targetAt` finds the screen row's `RenderLine` and wrap start, and `sourceColAt` maps the display column to a source column using span source columns (DES3, DES4). `onMouse` applies the mode rules with `feedKeys(["<Esc>"])`, `placeCursor`, and `feedKeys(["i"])` (DES5).
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/kernel/view/types.ts` — `Span`; `src/core/kernel/view/text-view.ts` — `spansOf`; `src/core/kernel/view/hit.ts` — `sourceColAt`; `src/ui/editors/text-view.ts` — `EditorView.targetAt`; `src/core/state/mouse.ts` — `pressText`
  - **Callers and Wiring:** `WindowTree.targetAt` → `EditorView.targetAt`
  - **Runtime Flow:** Section 5 "Press"
  - **Success Criteria:** S5, S6
  - **Verification:** V8, V9, V10, V11, V21
  - **Research Support:** None
- `W261005H4XZ-REQ5@R1` — Drag and multi-click select in Visual mode.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005H4XZ-DES2`, `W261005H4XZ-DES3`, `W261005H4XZ-DES5`
  - **How Addressed:** The router counts clicks and captures the press source for drags (DES2); `EditorView.dragAt` clamps to the window and reports an edge (DES3); `onMouse` enters Visual with `v`, places the cursor, and turns 2 and 3 clicks into `viw` and `V` (DES5).
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/ui/mouse.ts` — `clickCount`, drag capture; `src/core/state/mouse.ts` — `dragText`, `pressText`
  - **Callers and Wiring:** router `drag` → `{kind:"drag"}`
  - **Runtime Flow:** Section 5 "Drag"
  - **Success Criteria:** S7, S8
  - **Verification:** V12, V13, V14, V22
  - **Research Support:** None
- `W261005H4XZ-REQ6@R1` — Ctrl+click follows links.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005H4XZ-DES5`
  - **How Addressed:** A `press` with `ctrl` on a text target places the cursor, then runs the `link.follow` command, the command `gd` is bound to (`src/core/state/link-commands.ts:167`).
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/mouse.ts` — `pressText`
  - **Callers and Wiring:** `runCommand` (`src/core/state/commands.ts`)
  - **Runtime Flow:** Section 5 "Press"
  - **Success Criteria:** S9
  - **Verification:** V15
  - **Research Support:** None
- `W261005H4XZ-REQ7@R1` — Clicks on chrome and Bases surfaces.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005H4XZ-DES3`, `W261005H4XZ-DES5`
  - **How Addressed:** Bufferline, explorer, side panel, Bases, picker, completion, and calendar views report targets (DES3). `onMouse` reuses `showBuffer`, `openSelected`, `sidePanelKey`, exported Bases focus functions, the picker's `select`, `completionKey`, and `calendarKey` (DES5). `ToastStack` is not a mouse source, so clicks pass through it.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** see section 4
  - **Callers and Wiring:** `press` handler by target kind
  - **Runtime Flow:** Section 5 "Press"
  - **Success Criteria:** S10, S11
  - **Verification:** V16, V17, V18, V23
  - **Research Support:** None
- `W261005H4XZ-REQ8@R1` — Overlay and command-line mouse rules.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005H4XZ-DES3`, `W261005H4XZ-DES5`
  - **How Addressed:** `OverlayHost.targetAt` returns `{kind:"outside"}` for a cell outside the open overlay, except for completion, where it returns `undefined` so the body resolves the cell (DES3). `onMouse` closes dismissible overlays and the command line with `<Esc>`, ignores prompt and conflict, and closes completion before a body press (DES5).
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/ui/overlays/host.ts` — `OverlayHost.targetAt`; `src/core/state/mouse.ts` — `overlayGate`
  - **Callers and Wiring:** router source order puts `OverlayHost` first
  - **Runtime Flow:** Section 5 "Overlay gate"
  - **Success Criteria:** S12
  - **Verification:** V19, V24
  - **Research Support:** None
- `W261005H4XZ-REQ9@R1` — Mouse configuration and terminal modes.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005H4XZ-DES6`
  - **How Addressed:** `ConfigSchema` gains `mouse: boolean` (default `true`); the shell sets `renderer.useMouse` from state on each paint when it differs; the router drops events while it is off. Exit restore stays in `renderer.destroy()`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/config/schema.ts` — `ConfigSchema`; `src/ui/shell.ts` — `RENDERER_OPTIONS`, `paint`
  - **Callers and Wiring:** `createShell` paint subscription
  - **Runtime Flow:** Section 5 "Config"
  - **Success Criteria:** S13, S14
  - **Verification:** V25, V26, V27, V28
  - **Research Support:** None

## Assigned Parent Obligation Coverage

None — standalone work

## Binding Constraints

- `.s1mple/docs/project.md` Boundaries — `src/core` imports nothing from `@opentui`; `MouseTarget` and `MouseEvent` therefore carry window ids, positions, paths, and indexes, never rects or OpenTUI objects.
- `.s1mple/docs/project.md` Architecture — every state change goes through `store.dispatch` → `update`; views only resolve targets.
- `.s1mple/docs/languages/typescript.md` — strict types, `import type`, colocated behavior-named tests, `bun run check`.
- `.s1mple/S1MPLE.md` Implementation — no work-process identifiers in code, tests, or logs.
- `rm261003abzp-ui-design.md:2359` — no drag-and-drop in Bases; the design adds none.

## Cross-Cutting Applicability

| Concern | Applicability | Design Location or Reason |
|---|---|---|
| Security and privacy | None | None — mouse input stays local; nothing new is read or written. Clicks never answer the prompt or conflict dialogs (S12, V19). |
| Configuration | Applicable | `mouse` in `ConfigSchema` (`src/core/config/schema.ts`), applied by `paint` in `src/ui/shell.ts`; V25, V27, V28 |
| Observability | None | None — mouse handling adds no logs or metrics; existing toasts and messages report the reused actions' outcomes. |
| Performance and scalability | Applicable | Button-event tracking only (no any-motion); one dispatch per gesture; `targetAt` is O(visible rows) per event. A drag dispatches only when its target changes (router dedupe, section 7 `src/ui/mouse.ts`); V22 |
| Concurrency | None | None — the store runs one action at a time; the router keeps only UI-local press and drag state. |
| Retry and idempotency | None | None — no I/O; a repeated wheel event is a new gesture by definition. |
| Migration and rollout | Applicable | New config key with a default; old config files stay valid (section 7 Migration and Delivery); V27 |

## Focused Code Surface

- **Existing:** `src/core/state/types.ts` — `MouseEvent`, `Action` — the scroll-only mouse contract.
- **Existing:** `src/core/state/update.ts` — `onMouse` — scrolls the active window; replaced.
- **Existing:** `src/ui/editors/text-view.ts` — `EditorView` — owns the laid-out rows; its `onMouseScroll` is removed.
- **Existing:** `src/core/kernel/view/text-view.ts` — `layoutLine`, `spansOf` — builds spans, the only place that knows hidden and inserted columns.
- **Existing:** `src/ui/shell.ts` — `RENDERER_OPTIONS`, `View`, `createShell` — renderer options, view stack, wiring.
- **Proposed:** `src/ui/mouse.ts` — `MouseLayer`, `createMouseRouter` — one entry for every mouse event — Traces to `W261005H4XZ-DES2`
- **Proposed:** `src/core/state/mouse.ts` — `onMouse` — gesture → keyboard-equivalent reducer — Traces to `W261005H4XZ-DES5`
- **Proposed:** `src/core/kernel/view/hit.ts` — `sourceColAt`, `rowAt` — cell → source position — Traces to `W261005H4XZ-DES4`

# 2. System Context and Architecture

## System Context

```text
User ── mouse ──► terminal emulator ── SGR mouse bytes (1002 + 1006) ──► so process
                         ▲                                                  │
                         └──── mouse tracking on/off (config `mouse`) ──────┘
Shift+drag stays with the terminal (native selection), never reported.
```

## Proposed Architecture

```text
OpenTUI CliRenderer ── hit grid: MouseLayer covers the whole screen at the top z-index
        │ MouseEvent {type, button, x, y, modifiers, scroll}
        ▼
src/ui/mouse.ts  MouseLayer.onMouse ─► MouseRouter.handle(e)
        │  drop if off / right / middle button
        │  resolve: sources in z-order → first targetAt(x, y) ≠ undefined
        │     OverlayHost → CommandLine → Statusline → SidePanelView → ExplorerView
        │     → Bufferline → WindowTree (→ EditorView | BaseView)
        │     (ToastStack is not a source: clicks pass through)
        │  count clicks (same cell, ≤ 500 ms, 1→2→3→1)
        │  drag: ask the press source's dragAt(x, y, origin)
        ▼
store.dispatch({ type: "mouse", event: MouseEvent(model targets), now })
        ▼
src/core/state/mouse.ts  onMouse
        │  overlayGate → focusTarget → surface action
        │  surface actions reuse: feedKeys (handleKeyAction), runCommand,
        │  placeCursor, showBuffer, openSelected, sidePanelKey, base focus
        │  functions, picker select, completionKey, calendarKey
        ▼
AppState → views repaint
```

The router is one module because click counting, drag capture, z-order, and the on/off switch are shared by every surface; spreading them across views would duplicate state and make toast and overlay hit areas leak clicks (context Unknowns). The tradeoff is that every view exposes a small `targetAt` method, and the router's source order must match the paint order in `createShell`.

# 3. Components and Boundaries

## MouseRouter and MouseLayer

- **Target:** `src/ui/mouse.ts` (new)
- **Kind:** UI module: a `Renderable` subclass and a factory function
- **Responsibilities:**
  - Receive every OpenTUI mouse event through a full-screen, paint-free `MouseLayer` at the top z-index.
  - Drop events while `config.mouse` is off and for buttons other than left and the wheel.
  - Resolve the target through `MouseSource.targetAt` in z-order; count clicks; keep the press origin for drags; dedupe drag targets.
  - Dispatch `{type:"mouse", event, now}`.
- **Collaborators:**

  ```text
  MouseLayer.onMouse → MouseRouter.handle → MouseSource.targetAt / dragAt → store.dispatch
  ```

- **Boundary Contract:** `MouseSource` (section 6), `MouseEvent` (section 6)
- **Detailed Design:** section 7 `src/ui/mouse.ts`
- **Must Not Own:**
  - State changes, mode rules, or any behavior beyond target resolution and click counting.

## Mouse sources (views)

- **Target:** `src/ui/editors/text-view.ts`, `src/ui/editors/base-view.ts`, `src/ui/views/{window-tree,explorer,side-panel,bufferline,statusline,cmdline}.ts`, `src/ui/overlays/{host,picker,calendar,completion,prompt,conflict,whichkey}.ts`
- **Kind:** existing `Renderable` views
- **Responsibilities:**
  - Keep the geometry of the last layout and map a cell to a `MouseTarget`, or `undefined` when the cell is not theirs.
- **Collaborators:**

  ```text
  WindowTree.targetAt → EditorView.targetAt → rowAt, sourceColAt
  OverlayHost.targetAt → PickerView | CalendarOverlay | CompletionView .itemAt
  ```

- **Boundary Contract:** `MouseSource`
- **Detailed Design:** section 7 per file
- **Must Not Own:**
  - Dispatching; deciding what a click does.

## Source-column mapping

- **Target:** `src/core/kernel/view/hit.ts` (new); `Span` in `src/core/kernel/view/types.ts`; `spansOf` in `src/core/kernel/view/text-view.ts`
- **Kind:** pure functions and a type field
- **Responsibilities:**
  - Record each span's source column during layout; map a display column back to a source column; find the `RenderLine` and wrap row under a screen row.
- **Collaborators:**

  ```text
  layoutLine → spansOf (sets Span.col / Span.inserted) → EditorView.lines → rowAt → sourceColAt
  ```

- **Boundary Contract:** `Span` (section 6)
- **Detailed Design:** section 7 `src/core/kernel/view/hit.ts`
- **Must Not Own:**
  - Screen offsets (gutter, winbar, rect); the view subtracts them first.

## Core mouse reducer

- **Target:** `src/core/state/mouse.ts` (new)
- **Kind:** pure reducer module
- **Responsibilities:**
  - Apply the overlay and command-line gate, focus, and per-target actions by reusing keyboard paths.
- **Collaborators:**

  ```text
  update → onMouse → overlayGate → focusTarget → pressText | dragText | wheel | pressChrome
         → feedKeys → handleKeyAction ; runCommand ; placeCursor ; showBuffer ; …
  ```

- **Boundary Contract:** `MouseEvent`, `Result`
- **Detailed Design:** section 7 `src/core/state/mouse.ts`
- **Must Not Own:**
  - Geometry, timing, or click counting.

## Mouse configuration

- **Target:** `src/core/config/schema.ts`, `src/ui/shell.ts`
- **Kind:** config schema field and shell wiring
- **Responsibilities:**
  - Validate `mouse`; turn terminal mouse reporting on or off to match state.
- **Collaborators:**

  ```text
  configLoaded → state.config.mouse → paint → renderer.useMouse
  ```

- **Boundary Contract:** `AppConfig.mouse`
- **Detailed Design:** section 7 `src/core/config/schema.ts`, `src/ui/shell.ts`
- **Must Not Own:**
  - Terminal restore on exit (stays in `renderer.destroy()`).

# 4. Project Structure Changes

**Proposed Structure — not an actual Git diff.**

**Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
src/
├── core/
│   ├── config/
│   │   ├── [M] schema.ts
│   │   │       Contains: config schema
│   │   │       Symbols: ConfigSchema (+ mouse)
│   │   │       Decisions: DES6
│   │   └── [M] schema.test.ts
│   │           Contains: config validation tests
│   │           Symbols: mouse default and type cases
│   │           Decisions: DES6
│   ├── kernel/view/
│   │   ├── [M] types.ts
│   │   │       Contains: render types
│   │   │       Symbols: Span (+ col, inserted)
│   │   │       Decisions: DES4
│   │   ├── [M] text-view.ts
│   │   │       Contains: layout
│   │   │       Symbols: spansOf (sets Span.col / inserted)
│   │   │       Decisions: DES4
│   │   ├── [A] hit.ts
│   │   │       Contains: cell → source position
│   │   │       Symbols: sourceColAt, rowAt, ScreenRow
│   │   │       Decisions: DES4
│   │   └── [A] hit.test.ts
│   │           Contains: mapping tests
│   │           Decisions: DES4
│   └── state/
│       ├── [M] types.ts
│       │       Contains: state and action types
│       │       Symbols: MouseEvent, MouseTarget, WindowSpot, Action (mouse + now)
│       │       Decisions: DES1
│       ├── [M] update.ts
│       │       Contains: reducer switch
│       │       Symbols: update (mouse case → onMouse from mouse.ts); onMouse removed
│       │       Decisions: DES5
│       ├── [A] mouse.ts
│       │       Contains: gesture reducer
│       │       Symbols: onMouse, feedKeys, withFocus, overlayGate, focusTarget, pressText, dragText, wheel, pressChrome
│       │       Decisions: DES5
│       ├── [A] mouse.test.ts
│       │       Contains: reducer equivalence tests
│       │       Decisions: DES5
│       ├── [M] base-commands.ts
│       │       Symbols: export focusBaseCell, focusBaseCard, showBaseView, openBaseFocused
│       │       Decisions: DES5
│       └── [M] picker.ts
│               Symbols: export selectPickerItem (wraps select)
│               Decisions: DES5
├── ui/
│   ├── [A] mouse.ts
│   │       Contains: top layer and router
│   │       Symbols: MouseLayer, createMouseRouter, MouseSource, CLICK_MS
│   │       Decisions: DES2
│   ├── [A] mouse.test.ts
│   │       Contains: router unit tests (click count, drop rules, dedupe)
│   │       Decisions: DES2
│   ├── [M] shell.ts
│   │       Symbols: RENDERER_OPTIONS (useMouse false), View (+ targetAt, dragAt), createShell (router wiring, useMouse sync)
│   │       Decisions: DES2, DES6
│   ├── editors/
│   │   ├── [M] text-view.ts
│   │   │       Symbols: EditorView.targetAt, EditorView.dragAt; onMouseScroll removed
│   │   │       Decisions: DES3
│   │   ├── [M] base-view.ts
│   │   │       Symbols: BaseView.targetAt (keeps tab ranges)
│   │   │       Decisions: DES3
│   │   └── [M] registry.ts
│   │           Symbols: WindowView (+ targetAt, dragAt)
│   │           Decisions: DES3
│   ├── views/
│   │   ├── [M] window-tree.ts     Symbols: WindowTree.targetAt, dragAt   Decisions: DES3
│   │   ├── [M] explorer.ts        Symbols: ExplorerView.targetAt         Decisions: DES3
│   │   ├── [M] side-panel.ts      Symbols: SidePanelView.targetAt        Decisions: DES3
│   │   ├── [M] bufferline.ts      Symbols: Bufferline.targetAt (keeps tab ranges)  Decisions: DES3
│   │   ├── [M] statusline.ts      Symbols: Statusline.targetAt → inert   Decisions: DES3
│   │   └── [M] cmdline.ts         Symbols: CommandLine.targetAt → inert  Decisions: DES3
│   └── overlays/
│       ├── [M] host.ts            Symbols: OverlayHost.targetAt          Decisions: DES3
│       ├── [M] picker.ts          Symbols: PickerView.itemAt (keeps list first and box)  Decisions: DES3
│       ├── [M] calendar.ts        Symbols: CalendarOverlay.itemAt        Decisions: DES3
│       └── [M] completion.ts      Symbols: CompletionView.itemAt (keeps first)  Decisions: DES3
test/
├── support/
│   └── [M] ui.ts
│           Symbols: mountShell (exposes t.mockMouse as mouse)
│           Decisions: DES2
├── ui/
│   └── [A] mouse.test.ts
│           Contains: component tests through OpenTUI's mock mouse
│           Decisions: DES2, DES3, DES4
└── e2e/
    └── [A] mouse.test.ts
            Contains: PTY tests of terminal mouse modes and the config switch
            Decisions: DES6
```

`prompt.ts`, `conflict.ts`, and `whichkey.ts` need no change: `OverlayHost.targetAt` returns `{kind:"overlay"}` or `{kind:"outside"}` from their boxes, which the host already computes with `centered`; the core ignores both while prompt or conflict is open. `ToastStack` (`src/ui/overlays/notify.ts`) is unchanged and is deliberately not a mouse source.

# 5. Runtime Flows and Error Policies

## Press

**Participating Symbols:** `MouseLayer`, `MouseRouter.handle`, `MouseSource.targetAt`, `onMouse`, `overlayGate`, `focusTarget`, `pressText`, `pressChrome`, `feedKeys`, `runCommand`

**Illustrative Flow:**

```text
down(left, x, y, ctrl)
  → router: off? right/middle? → drop
  → target = first source.targetAt(x, y)        (undefined everywhere → drop)
  → clicks = same cell && now − last ≤ 500 ms ? next(1→2→3→1) : 1
  → origin = { source, target }
  → dispatch {mouse, press{target, clicks, ctrl}, now}
core onMouse(press):
  → overlayGate: prompt/conflict → none ; dismissible overlay or ":"/"/"/"?" line + target outside → feedKeys(<Esc>) and stop
                 completion + body target → close completion, continue
  → focusTarget (window / explorer / side panel)
  → text: Insert → <Esc>, placeCursor, i ; Visual → <Esc>, placeCursor ; pending → <Esc>, placeCursor
          clicks 2 → placeCursor, v i w ; clicks 3 → placeCursor, V ; ctrl → placeCursor, runCommand(link.follow)
  → chrome: bufferTab → showBuffer ; explorer → cursor = path, openSelected ; side → cursor = row, <CR>
            baseTab → showBaseView ; baseCell/baseCard → focus, clicks ≥ 2 → openBaseFocused
            overlayItem → selectPickerItem + <CR> | completion select + <CR> ; calendarDay → show + <CR>
            inert/overlay → none
```

1. `MouseLayer` forwards every event to `MouseRouter.handle`.
2. The router resolves, counts, records the origin, and dispatches.
3. `onMouse` gates, focuses, and runs the keyboard-equivalent path.

**Detailed Control Flow:** section 7 `src/ui/mouse.ts` `handle`; `src/core/state/mouse.ts` `onMouse`

## Drag

**Participating Symbols:** `MouseRouter.handle`, `MouseSource.dragAt`, `WindowTree.dragAt`, `EditorView.dragAt`, `dragText`

```text
drag(left, x, y)
  → router: no origin, or origin target not a window text target → drop
  → target = origin.source.dragAt(x, y, origin.target)   (clamped to the origin window; edge −1/0/+1)
  → same as last drag target → drop (dedupe)
  → dispatch {mouse, drag{target}, now}
core onMouse(drag):
  → mode ≠ visual/visualLine → feedKeys(<Esc> if insert), feedKeys(v)
  → placeCursor(pos.line + edge, pos.col)      (edge scrolls one line through placeCursor and the view's follow)
up / drag-end → router clears origin and last drag target
```

**Detailed Control Flow:** section 7 `src/core/state/mouse.ts` `dragText`

## Wheel

**Participating Symbols:** `MouseRouter.handle`, `onMouse`, `wheel`, `withFocus`

```text
scroll(direction, x, y) → target = first source.targetAt(x, y) → dispatch {mouse, wheel{target, dx, dy}, now}
core wheel:
  prompt/conflict open → none
  window text  → scroll that window by dy×3 (clamped), cursor unchanged; dx → none (no horizontal view scroll exists)
  window base  → withFocus(window) feedKeys(j|k ×3) ; dx once: table H/L, board h/l
  explorer     → moveCursor(±3)
  side panel   → withFocus(side) feedKeys(j|k ×3)
  overlayItem / overlay (picker, palette, help, completion) → feedKeys(<Down>|<Up> ×3)
  calendar     → feedKeys(j|k)
  else         → none
```

`withFocus(s, focus, run)` sets `windows.active`, `explorer.focused`, and `side.focused` to the target, runs `run`, then restores the three fields, so the wheel never moves focus (REQ2).

**Detailed Control Flow:** section 7 `src/core/state/mouse.ts` `wheel`, `withFocus`

## Overlay gate

Covered inside "Press" and "Wheel". Prompt and conflict ignore every mouse event; completion yields to the body; other overlays and the open command line close on an outside press, which is consumed.

## Config

```text
configLoaded → state.config.mouse → paint(s) → renderer.useMouse !== s.config.mouse → renderer.useMouse = s.config.mouse
exit → renderer.destroy() → mouse tracking off (unchanged)
```

## Failure and Recovery Rules

- **Target resolves to nothing** — Detected by `MouseRouter.handle` when every source returns `undefined`; the event is dropped.
- **Stale target** (state changed between paint and press, e.g. a closed window or a vanished picker item) — Detected by `onMouse` lookups (`windows.byId[id]`, item index range) returning `undefined`; handled by returning `none(s)`.
- **Drag without press** (press dropped, or the press started on a non-text target) — Detected by the router (no text origin); the drag is dropped.
- **Reducer error inside reused paths** — unchanged: the reused reducers already return messages or toasts.

## Construction and Wiring Flow

```text
createShell.start
  → views = [Bufferline, WindowTree, ExplorerView, SidePanelView, Statusline, CommandLine, ToastStack, OverlayHost]
  ├→ router = createMouseRouter({ sources: [overlays, cmdline, statusline, side, explorer, bufferline, windows],
  │                               enabled: () => store.get().config.mouse,
  │                               dispatch: store.dispatch, now: deps.now })
  ├→ renderer.root.add(new MouseLayer(renderer, router))   (added last, zIndex 1000)
  └→ paint: … ; renderer.useMouse sync
```

- **Construction:** `src/ui/shell.ts` — `createShell` — creates the router and layer after the views.
- **Registration:** `src/ui/shell.ts` — `renderer.root.add(layer)`.
- **Exports:** `src/ui/mouse.ts` — `MouseLayer`, `createMouseRouter`, type `MouseSource`; `src/core/state/mouse.ts` — `onMouse`; `src/core/kernel/view/hit.ts` — `sourceColAt`, `rowAt`; `src/core/state/base-commands.ts` — `focusBaseCell`, `focusBaseCard`, `showBaseView`, `openBaseFocused`; `src/core/state/picker.ts` — `selectPickerItem`.
- **Configuration:** `src/core/config/schema.ts` — `mouse` — read at paint.

# 6. Logical Contracts, Data Models, and State

| Item | Kind | Purpose | Used By |
|---|---|---|---|
| `MouseTarget` | Contract | Model-level description of what is under the pointer | Produced by views' `targetAt`; consumed by `onMouse` |
| `MouseEvent` | Message | One gesture: press, drag, or wheel | Router → `update` → `onMouse` |
| `MouseSource` | Contract | A view that can resolve cells | `createMouseRouter` |
| `Span.col` / `Span.inserted` | Data Model | Source column of a span's first character; whether the span replaces hidden text | `spansOf` → `sourceColAt` |
| `AppConfig.mouse` | State Model | Whether mouse reporting is on | `paint`, router |
| Router press state | State Model (UI-local) | Last press cell and time, click count, drag origin, last drag target | `createMouseRouter` only |

## `MouseTarget` — Contract

**Purpose:** Say what the pointer is over in model terms so the core can act without geometry.

**Includes:**

- `{ kind: "window"; window: WindowId; spot: WindowSpot }` — an editor or Base window.
- `WindowSpot`: `{ kind: "text"; pos: Pos; edge: -1 | 0 | 1 }`, `{ kind: "winbar" }`, `{ kind: "baseTab"; view: number }`, `{ kind: "baseCell"; row: number; column: number }`, `{ kind: "baseCard"; lane: number; card: number }`, `{ kind: "base" }`.
- `{ kind: "explorer"; path: string }`, `{ kind: "sidePanel"; row: number }`, `{ kind: "bufferTab"; bufferId: BufferId }`.
- `{ kind: "overlayItem"; index: number }` (picker, palette, help, completion rows), `{ kind: "calendarDay"; date: LocalDate }`, `{ kind: "overlay" }` (inside, no item), `{ kind: "outside" }` (outside an overlay), `{ kind: "inert" }` (statusline, command line, bufferline markers).

**Usage:**

```text
EditorView.targetAt → {window, spot:text} → onMouse.pressText
```

**Rules:**

- **Compatibility:** internal type; no persistence.
- **Invariants:** a `text` `pos` is within the buffer (line < lineCount, col ≤ line length); `edge` is non-zero only from `dragAt`.
- **Ownership and Lifecycle:** created per event by `src/ui`; never stored in `AppState`.

**Location:** `src/core/state/types.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/state/types.ts`

## `MouseEvent` — Message

**Purpose:** Carry one gesture from the UI to the core.

**Includes:**

- `{ kind: "press"; target: MouseTarget; clicks: 1 | 2 | 3; ctrl: boolean }`
- `{ kind: "drag"; target: MouseTarget }`
- `{ kind: "wheel"; target: MouseTarget; dx: -1 | 0 | 1; dy: -1 | 0 | 1 }` — one notch; the core repeats a vertical step 3 times and applies a horizontal step once.

**Usage:**

```text
MouseRouter.handle → store.dispatch({type:"mouse", event, now}) → update → onMouse
```

**Rules:**

- **Compatibility:** replaces `{ kind: "scroll"; delta }` (`src/core/state/types.ts:288`); its only producer, `EditorView.onMouseScroll`, is removed.
- **Invariants:** only left-button gestures and the wheel exist; release is UI-only.
- **Ownership and Lifecycle:** transient.

**Location:** `src/core/state/types.ts:288,365` — current `MouseEvent` and `Action` member

**Detailed Shape:** section 7 `src/core/state/types.ts`

## `MouseSource` — Contract

**Purpose:** Let the router ask any view what is under a cell.

**Includes:**

- `targetAt(x: number, y: number): MouseTarget | undefined` — `undefined` when the cell is not the view's or the view is hidden.
- `dragAt?(x: number, y: number, from: MouseTarget): MouseTarget | undefined` — clamped resolution for a drag that started on this source.

**Usage:**

```text
createMouseRouter({sources}) → sources[i].targetAt(x, y)
```

**Rules:**

- **Compatibility:** optional members on the existing `View` type; views without them are not sources.
- **Invariants:** a view answers only from geometry kept at its last `update`/`show`, never from OpenTUI layout getters (they lag a frame, `src/ui/editors/text-view.ts:272`).
- **Ownership and Lifecycle:** each view owns its geometry.

**Location:** `src/ui/mouse.ts`, `src/ui/shell.ts` `View` — None — proposed item

**Detailed Shape:** section 7 `src/ui/mouse.ts`

## `Span.col` / `Span.inserted` — Data Model

**Purpose:** Let a display column map back to a source column on lines with hidden or inserted text.

**Includes:**

- `col?: number` — source column of the span's first character.
- `inserted?: true` — the span is replacement text; all its cells map to `col`.

**Usage:**

```text
spansOf → RenderLine.spans → sourceColAt(spans, displayCol, tabWidth)
```

**Rules:**

- **Compatibility:** optional fields; highlighter spans and widget rows without `col` map to column 0 of their source line.
- **Invariants:** for a span without `inserted`, character `i` is source column `col + i`.
- **Ownership and Lifecycle:** set only by `spansOf`.

**Location:** `src/core/kernel/view/types.ts:7`

**Detailed Shape:** section 7 `src/core/kernel/view/types.ts`, `src/core/kernel/view/hit.ts`

## `AppConfig.mouse` — State Model

**Purpose:** Turn mouse reporting on or off.

**Includes:**

- `mouse: boolean` — default `true`.

**Usage:**

```text
config file → ConfigSchema → state.config.mouse → paint → renderer.useMouse ; router.enabled
```

**Rules:**

- **Compatibility:** new optional key; existing config files parse unchanged.
- **Invariants:** `renderer.useMouse === state.config.mouse` after every paint.
- **Ownership and Lifecycle:** loaded and reloaded with the config.

**Location:** `src/core/config/schema.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/config/schema.ts`

## Router press state — State Model (UI-local)

**Purpose:** Count clicks and capture drags without core state.

**Includes:** `last: { x; y; at; clicks } | undefined`, `origin: { source; target } | undefined`, `lastDrag: string | undefined` (serialized target).

**Usage:** read and written only inside `MouseRouter.handle`.

**Rules:**

- **Compatibility:** None — UI-local.
- **Invariants:** `origin` is cleared on `up` and `drag-end`; `clicks` resets to 1 when the cell differs or more than `CLICK_MS` elapsed.
- **Ownership and Lifecycle:** lives as long as the shell.

**Location:** `src/ui/mouse.ts` — None — proposed item

**Detailed Shape:** section 7 `src/ui/mouse.ts`

# 7. Detailed Code Design

## `src/core/state/types.ts`

- **Change:** Modify
- **Decisions:** DES1
- **Requirements:** `W261005H4XZ-REQ1@R1`
- **Responsibilities:** the UI-to-core mouse contract.
- **Affected Callers/Consumers:** `src/core/state/update.ts` `update`; `src/core/state/mouse.ts`; `src/ui/mouse.ts`; every `targetAt`.
- **Construction/Wiring:** None — types only.
- **Dependencies:** `Pos`, `WindowId`, `BufferId`, `LocalDate`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `MouseEvent` | `src/core/state/types.ts:288` `{ kind: "scroll"; delta: number }` | press / drag / wheel union | `onMouse`, router |
| `MouseTarget`, `WindowSpot` | None — new symbol | target union | views, `onMouse` |
| `Action` `mouse` member | `src/core/state/types.ts:365` `{ type: "mouse"; event: MouseEvent }` | `{ type: "mouse"; event: MouseEvent; now: number }` | `update`, router |

**Existing Shape:** `src/core/state/types.ts:288,365`

```ts
export type MouseEvent = { kind: "scroll"; delta: number };
// …
  | { type: "mouse"; event: MouseEvent }
```

The core knows one mouse gesture, a vertical scroll of the active window, and the action carries no clock.

**Proposed Shape:**

```ts
export type WindowSpot =
  | { kind: "text"; pos: Pos; edge: -1 | 0 | 1 }
  | { kind: "winbar" }
  | { kind: "baseTab"; view: number }
  | { kind: "baseCell"; row: number; column: number }
  | { kind: "baseCard"; lane: number; card: number }
  | { kind: "base" };

export type MouseTarget =
  | { kind: "window"; window: WindowId; spot: WindowSpot }
  | { kind: "explorer"; path: string }
  | { kind: "sidePanel"; row: number }
  | { kind: "bufferTab"; bufferId: BufferId }
  | { kind: "overlayItem"; index: number }
  | { kind: "calendarDay"; date: LocalDate }
  | { kind: "overlay" }
  | { kind: "outside" }
  | { kind: "inert" };

export type MouseEvent =
  | { kind: "press"; target: MouseTarget; clicks: 1 | 2 | 3; ctrl: boolean }
  | { kind: "drag"; target: MouseTarget }
  | { kind: "wheel"; target: MouseTarget; dx: -1 | 0 | 1; dy: -1 | 0 | 1 };

  | { type: "mouse"; event: MouseEvent; now: number }
```

`MouseTarget` names the thing under the pointer; `WindowSpot` narrows a window target to text, its winbar, or a Bases element. `MouseEvent` adds the gesture. `now` lets reused key reducers that need a clock (opening files, the calendar) run unchanged.

- **Invariants:**
  - No screen coordinate appears in any of these types.
- **Verification Coverage:** S1, S2; V1, V29

## `src/core/state/mouse.ts`

- **Change:** Add
- **Decisions:** DES5
- **Requirements:** `W261005H4XZ-REQ1@R1` … `W261005H4XZ-REQ8@R1`
- **Responsibilities:** turn each gesture into the matching keyboard path.
- **Affected Callers/Consumers:** `update` (`src/core/state/update.ts:154-155`).
- **Construction/Wiring:** imported by `update.ts`.
- **Dependencies:** `handleKeyAction` (`src/core/state/keys.ts:48`), `runCommand`, `placeCursor` and `showBuffer` (`src/core/state/buffers.ts:127,301`), `openSelected` and `moveCursor` (`src/core/state/explorer.ts`), `focusBaseCell`, `focusBaseCard`, `showBaseView`, `openBaseFocused`, `selectPickerItem`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `onMouse` | `src/core/state/update.ts:239-257` scrolls the active window | moved here; full gesture reducer | `update` |
| `feedKeys`, `withFocus`, `overlayGate`, `focusTarget`, `pressText`, `dragText`, `wheel`, `pressChrome` | None — new symbol | helpers (module-private except `onMouse`) | `onMouse` |

**Existing Shape:** `src/core/state/update.ts:239-257`

```ts
function onMouse(s: AppState, e: MouseEvent): Result {
  const w = s.windows.byId[s.windows.active];
  const b = w && s.buffers[w.content.bufferId];
  if (w === undefined || b === undefined) return none(s);
  const scroll = Math.max(0, Math.min(w.content.scroll + e.delta, b.text.lineCount - 1));
  return none({ ...s, windows: { …, [w.id]: { ...w, content: { ...w.content, scroll } } } });
}
```

It reads only the active window, so the pointer position never matters.

**Proposed Shape:**

```ts
const WHEEL_LINES = 3;

export function onMouse(s: AppState, a: { event: MouseEvent; now: number }, reg: Registries): Result;

/** Run keys through the same path as typed keys, concatenating effects. */
function feedKeys(r: Result, keys: readonly Key[], now: number, reg: Registries): Result;

/** Run `run` with focus on `target`, then put the previous focus back. */
function withFocus(s: AppState, target: MouseTarget, run: (s: AppState) => Result): Result;

/** Prompt/conflict: stop. Dismissible overlay or open search/command line + press outside: <Esc>, stop.
 *  Completion + body press: close completion and continue. */
function overlayGate(s: AppState, e: MouseEvent, now: number, reg: Registries):
  { stop: Result } | { go: AppState };

function focusTarget(s: AppState, t: MouseTarget): AppState;
function pressText(r: Result, pos: Pos, clicks: 1 | 2 | 3, ctrl: boolean, now: number, reg: Registries): Result;
function dragText(s: AppState, pos: Pos, edge: -1 | 0 | 1, now: number, reg: Registries): Result;
function wheel(s: AppState, t: MouseTarget, dx: number, dy: number, now: number, reg: Registries): Result;
function pressChrome(s: AppState, t: MouseTarget, clicks: number, now: number, reg: Registries): Result;
```

`onMouse` runs `overlayGate`, then `focusTarget` for presses, then dispatches on the target to `pressText`, `pressChrome`, `dragText`, or `wheel`. `feedKeys` folds `handleKeyAction` over the keys, so every gesture that has a key equivalent produces the same state and effects as those keys. `withFocus` lets the wheel reuse focus-scoped key reducers on an unfocused window or panel and then restores `windows.active`, `explorer.focused`, and `side.focused`.

`pressText` control flow:

```text
mode insert && clicks = 1 && !ctrl → feedKeys(<Esc>) → placeCursor(pos) → feedKeys(i) → past the line end: Insert cursor col = line length
otherwise: mode visual/visualLine or pending keys → feedKeys(<Esc>)
           placeCursor(pos)
           clicks 2 → feedKeys(v, i, w) ; clicks 3 → feedKeys(V)
           ctrl → runCommand("link.follow")
```

`placeCursor` (`src/core/state/buffers.ts:127`) clamps the column to `length − 1`; for Insert the click past the end must reach `length`, so `pressText` sets the cursor column after `i` re-enters Insert (the `i` key keeps the column, and Insert allows `length`). `dragText` enters Visual with `v` (after `<Esc>` from Insert) only when not already in a Visual mode, then calls `placeCursor({ line: pos.line + edge, col: pos.col })`; the view follows the cursor, which scrolls one line per edge drag.

- **Invariants:**
  - Every state change in this module comes from a reused reducer or `placeCursor`; the module never edits buffer text.
  - Prompt and conflict overlays receive no mouse effect.
- **Verification Coverage:** S1–S12; V1–V19, V29

## `src/core/state/update.ts`

- **Change:** Modify
- **Decisions:** DES5
- **Requirements:** `W261005H4XZ-REQ1@R1`
- **Responsibilities:** dispatch the `mouse` action to the new module.
- **Affected Callers/Consumers:** `store.dispatch`.
- **Construction/Wiring:** None — switch case only.
- **Dependencies:** `onMouse` from `./mouse`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `update` mouse case | `src/core/state/update.ts:154-155` `return onMouse(state, action.event);` | `return onMouse(state, action, reg);` (imported) | `store.dispatch` |
| `onMouse` (local) | `src/core/state/update.ts:239-257` | removed | — |

**Existing Shape:** `src/core/state/update.ts:154-155`

```ts
      case "mouse":
        return onMouse(state, action.event);
```

**Proposed Shape:**

```ts
      case "mouse":
        return onMouse(state, action, reg);
```

The case now passes the whole action (for `now`) and the registries (for key and command reuse).

- **Invariants:** None beyond the reducer's.
- **Verification Coverage:** V1 (through `update`)

## `src/core/kernel/view/types.ts`

- **Change:** Modify
- **Decisions:** DES4
- **Requirements:** `W261005H4XZ-REQ4@R1`
- **Responsibilities:** span shape.
- **Affected Callers/Consumers:** `spansOf`, `sourceColAt`; highlighters and painters ignore the new optional fields.
- **Construction/Wiring:** None.
- **Dependencies:** None.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Span` | `src/core/kernel/view/types.ts:7` `{ text; style; link? }` | adds `col?: number; inserted?: true` | `spansOf`, `sourceColAt` |

**Existing Shape:** `src/core/kernel/view/types.ts:7`

```ts
export type Span = { text: string; style: StyleToken; link?: string };
```

**Proposed Shape:**

```ts
export type Span = {
  text: string;
  style: StyleToken;
  link?: string;
  /** Source column of the first character. */
  col?: number;
  /** Replacement text: every cell maps to `col`. */
  inserted?: true;
};
```

`col` records where a verbatim run starts in the source line; `inserted` marks replacement text shown for a hidden range, whose cells all map to the hidden range's start.

- **Invariants:** see section 6.
- **Verification Coverage:** S5; V8, V9

## `src/core/kernel/view/text-view.ts`

- **Change:** Modify
- **Decisions:** DES4
- **Requirements:** `W261005H4XZ-REQ4@R1`
- **Responsibilities:** set span source columns.
- **Affected Callers/Consumers:** `layoutLine` → `spansOf`.
- **Construction/Wiring:** None.
- **Dependencies:** None.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `spansOf` | `src/core/kernel/view/text-view.ts:126-140+` builds runs from visible characters and inserts | each verbatim run gets `col` = its first source column; each inserted span gets `col` = the insert column and `inserted: true` | `EditorView`, `sourceColAt` |

**Existing Shape:** `src/core/kernel/view/text-view.ts:126-140`

```ts
function spansOf(text, styles, hidden, inserts): Span[] {
  …
  for (let c = 0; c <= text.length; c++) {
    const inserted = inserts.get(c);
    if (inserted !== undefined) {
```

`spansOf` already walks source columns `c`, so it knows the column of every run it starts.

**Proposed Shape:**

```ts
// When starting a verbatim run at column c: run = { text: "", style, col: c }
// When pushing inserted spans at column c: spans.push(...inserted.map((sp) => ({ ...sp, col: c, inserted: true })))
```

A run breaks wherever a hidden range or insert interrupts it, so `col + i` stays exact within each verbatim run.

- **Invariants:** a verbatim run never spans a hidden column.
- **Verification Coverage:** S5; V8

## `src/core/kernel/view/hit.ts`

- **Change:** Add
- **Decisions:** DES4
- **Requirements:** `W261005H4XZ-REQ4@R1`
- **Responsibilities:** map screen rows and display columns to source positions.
- **Affected Callers/Consumers:** `EditorView.targetAt`, `EditorView.dragAt`.
- **Construction/Wiring:** None.
- **Dependencies:** `cellWidth`, `wrapLine`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `sourceColAt`, `rowAt`, `ScreenRow` | None — new symbol | see below | `EditorView` |

**Existing Shape:** None — new file or symbol

**Proposed Shape:**

```ts
export type ScreenRow = { line: RenderLine; startCol: number };

/** The rendered line and wrap-row start shown on text row `y` (0-based), or the last row past the end. */
export function rowAt(
  lines: readonly RenderLine[], y: number,
  o: { width: number; tabWidth: number; wrap: boolean; skipRows: number },
): ScreenRow | undefined;

/** Source column shown at display column `dc` (counted from the line start); past the end → line length. */
export function sourceColAt(spans: readonly Span[], dc: number, tabWidth: number): number;
```

`rowAt` walks the frame the same way the painter does (widget rows count `widget.rows`, wrapped lines count `wrapLine(...).length`, `skipRows` drops the first rows of a too-tall line) and returns the `RenderLine` and the display column where that screen row begins. `sourceColAt` walks spans by cell width and returns `col + i` for verbatim text, `col` for inserted text, and the line length after the last cell. The view adds `startCol + leftCol + (x − textX)` to get `dc`; for a widget row it uses column 0.

- **Invariants:** for a line with no decorations, `sourceColAt(spans, displayWidth(text.slice(0, c)), tw) === c`.
- **Verification Coverage:** S5; V8, V9, V10

## `src/ui/mouse.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** `W261005H4XZ-REQ1@R1`, `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ5@R1`, `W261005H4XZ-REQ7@R1`, `W261005H4XZ-REQ9@R1`
- **Responsibilities:** receive, filter, resolve, count, capture, dispatch.
- **Affected Callers/Consumers:** `createShell`.
- **Construction/Wiring:** constructed in `createShell`; layer added last to `renderer.root`.
- **Dependencies:** `@opentui/core` `Renderable`, `MouseEvent`; `MouseTarget`, `Action`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `MouseLayer`, `createMouseRouter`, `MouseSource`, `CLICK_MS` | None — new symbol | see below | `createShell` |

**Existing Shape:** None — new file or symbol

**Proposed Shape:**

```ts
export const CLICK_MS = 500;

export type MouseSource = {
  targetAt(x: number, y: number): MouseTarget | undefined;
  dragAt?(x: number, y: number, from: MouseTarget): MouseTarget | undefined;
};

export function createMouseRouter(o: {
  sources: readonly MouseSource[];          // top of z-order first
  enabled: () => boolean;
  dispatch: (a: Action) => void;
  now: () => number;
}): { handle(e: OpenTuiMouseEvent): void };

/** Full screen, paints nothing, above every view; sends every mouse event to the router. */
export class MouseLayer extends Renderable {
  constructor(ctx: RenderContext, router: { handle(e: OpenTuiMouseEvent): void });
  update(s: AppState): void;               // size = terminal; visible = s.config.mouse
  protected renderSelf(): void {}
}
```

`handle` drops the event when `enabled()` is false. For `scroll` it maps `direction` to `dx`/`dy` and dispatches `wheel`. For `down` with `button` 0 it resolves the target, computes `clicks` from the last press (same cell, `now − at ≤ CLICK_MS`, cycling 1→2→3→1), stores `origin`, and dispatches `press` with `ctrl` from `modifiers`; other buttons are dropped. For `drag` with an `origin` whose target is a window text spot, it calls `origin.source.dragAt`, skips a target equal to the previous drag target, and dispatches `drag`. `up` and `drag-end` clear `origin`. `MouseLayer` is hidden when mouse is off so it leaves the hit grid.

- **Invariants:**
  - At most one dispatch per OpenTUI event.
  - No dispatch while `enabled()` is false.
- **Verification Coverage:** S2, S7, S13; V2, V3, V13, V22, V25

## `src/ui/shell.ts`

- **Change:** Modify
- **Decisions:** DES2, DES6
- **Requirements:** `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ9@R1`
- **Responsibilities:** wiring and renderer mouse mode.
- **Affected Callers/Consumers:** `src/app/main.ts` (unchanged call); tests through `mountShell`.
- **Construction/Wiring:** see section 5.
- **Dependencies:** `createMouseRouter`, `MouseLayer`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `RENDERER_OPTIONS` | `src/ui/shell.ts:32-40` `useMouse: true` | `useMouse: false`; the first paint turns it on from state | `createRenderer` |
| `View` | `src/ui/shell.ts:94-97` `update`, `cursor?` | adds `targetAt?`, `dragAt?` (`MouseSource` members) | every view |
| `createShell` `start` | `src/ui/shell.ts:140-181` builds views, paint, key normalizer | also builds router and layer; `paint` syncs `renderer.useMouse` | — |

**Existing Shape:** `src/ui/shell.ts:32-40`

```ts
export const RENDERER_OPTIONS = {
  exitOnCtrlC: false,
  exitSignals: [],
  openConsoleOnError: false,
  useMouse: true,
  enableMouseMovement: false,
  screenMode: "alternate-screen",
  useKittyKeyboard: {},
} as const satisfies CliRendererConfig;
```

**Proposed Shape:**

```ts
  useMouse: false,              // state decides on the first paint
  enableMouseMovement: false,

// in start():
const router = createMouseRouter({
  sources: [overlays, cmdline, statusline, side, explorer, bufferline, windows],
  enabled: () => store.get().config.mouse,
  dispatch: (a) => store.dispatch(a),
  now: deps.now,
});
const layer = new MouseLayer(renderer, router);
renderer.root.add(layer);
// in paint(s):
if (renderer.useMouse !== s.config.mouse) renderer.useMouse = s.config.mouse;
layer.update(s);
```

The source list is the paint order reversed, without `ToastStack`. Turning `useMouse` on only from state avoids enabling mouse tracking for one frame when the config turns it off. `renderer.useMouse` is OpenTUI's runtime switch (`set useMouse` calls `enableMouse`/`disableMouse`, `chunk-bun-j2z63cdy.js:7922-7930`).

- **Invariants:** `renderer.useMouse === s.config.mouse` after each paint.
- **Verification Coverage:** S13, S14; V25, V26, V28

## `src/ui/editors/text-view.ts`

- **Change:** Modify
- **Decisions:** DES3
- **Requirements:** `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ4@R1`, `W261005H4XZ-REQ5@R1`
- **Responsibilities:** map a cell in the window to a target.
- **Affected Callers/Consumers:** `WindowTree.targetAt`, `WindowTree.dragAt`.
- **Construction/Wiring:** None.
- **Dependencies:** `rowAt`, `sourceColAt`, `gutterWidth`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `onMouseScroll` assignment | `src/ui/editors/text-view.ts:287-294` dispatches scroll | removed (the router handles the wheel) | — |
| `EditorView.targetAt` | None — new symbol | winbar row → `{spot: winbar}`; gutter → col 0; text → `rowAt` + `sourceColAt`; below text → last line | `WindowTree` |
| `EditorView.dragAt` | None — new symbol | clamps `y` into the text rows and `x` into the text columns, sets `edge` −1/+1 when `y` is above/below | `WindowTree` |

**Existing Shape:** `src/ui/editors/text-view.ts:287-294` (see context Section 3 snippet).

**Proposed Shape:**

```ts
targetAt(x: number, y: number): MouseTarget | undefined;   // undefined outside this.rect
dragAt(x: number, y: number): MouseTarget;                 // always resolves, clamped
```

Both use the geometry `show` already keeps (`rect`, `winbar`, `leftCol`, `skipRows`, `lines`) plus `gutterWidth(lineCount)` and `s.config.editor`.

- **Invariants:** the returned `pos` is inside the buffer.
- **Verification Coverage:** S5, S6, S7; V20, V21, V22

## `src/ui/views/window-tree.ts`, `src/ui/editors/registry.ts`, `src/ui/editors/base-view.ts`

- **Change:** Modify
- **Decisions:** DES3
- **Requirements:** `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ3@R1`, `W261005H4XZ-REQ7@R1`
- **Responsibilities:** delegate to the window under the pointer; Bases geometry.
- **Affected Callers/Consumers:** router.
- **Construction/Wiring:** None.
- **Dependencies:** `TableLayout`, `BoardLayout` (`src/ui/widgets/base.ts:29-40,380-395`).

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `WindowView` | `src/ui/editors/registry.ts` view type | adds `targetAt(x, y)` and optional `dragAt` | `WindowTree` |
| `WindowTree.targetAt` / `dragAt` | None — new symbol | keeps the `rects` map from `update`; delegates to the view whose rect holds the cell; `dragAt` delegates to `from.window`'s view; separators → `undefined` | router |
| `BaseView.targetAt` | None — new symbol | header row → `baseTab` from tab ranges kept in `renderSelf`; table body → `baseCell` from `cols` and `top`; board → `baseCard` from `lanes`, `laneW`, `cardRows`, `shown`; else `base` | `WindowTree` |

**Existing Shape:** `src/ui/views/window-tree.ts:66-81` (rects are local to `update`).

**Proposed Shape:** `private rects = new Map<WindowId, Rect>()` kept from `update`; `targetAt` = first view whose rect contains the cell.

The tree already computes every rect; keeping it is the only state change.

- **Invariants:** a target's `window` is a current window id.
- **Verification Coverage:** S3, S4, S10; V20, V23

## `src/ui/views/{explorer,side-panel,bufferline,statusline,cmdline}.ts`

- **Change:** Modify
- **Decisions:** DES3
- **Requirements:** `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ3@R1`, `W261005H4XZ-REQ7@R1`
- **Responsibilities:** chrome targets.
- **Affected Callers/Consumers:** router.
- **Construction/Wiring:** None.
- **Dependencies:** `visiblePaths`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ExplorerView.targetAt` | None — new symbol | inside its box: list row → `{explorer, path: rows[first + i].path}`; frame, empty, or hint cells → `{explorer, path: ""}` (focus only); outside or hidden → `undefined` | router |
| `SidePanelView.targetAt` | None — new symbol | list line → `{sidePanel, row: lines[first + i].row}`; other panel cells → `{sidePanel, row: -1}` (focus only); hidden → `undefined` | router |
| `Bufferline.targetAt` | None — new symbol | tab x-ranges kept in `renderSelf` → `{bufferTab}`; other cells on row 0 → `inert` | router |
| `Statusline.targetAt`, `CommandLine.targetAt` | None — new symbol | their rows → `inert` (the command line's completion list included) | router |

**Existing Shape:** `src/ui/views/explorer.ts:77-111`, `src/ui/views/side-panel.ts:58-91`, `src/ui/views/bufferline.ts:51-61` — geometry fields listed in context Section 4.

**Proposed Shape:**

```ts
targetAt(x: number, y: number): MouseTarget | undefined;
```

A click on a panel's frame, empty area, or hints only focuses the panel: those cells return `{kind:"explorer", path: ""}` or `{kind:"sidePanel", row: -1}`, which `pressChrome` treats as focus only. Every other row target selects that row and activates it.

- **Invariants:** hidden views return `undefined`.
- **Verification Coverage:** S4, S10; V7, V16, V23

## `src/ui/overlays/{host,picker,calendar,completion}.ts`

- **Change:** Modify
- **Decisions:** DES3
- **Requirements:** `W261005H4XZ-REQ7@R1`, `W261005H4XZ-REQ8@R1`
- **Responsibilities:** overlay targets and the outside rule.
- **Affected Callers/Consumers:** router.
- **Construction/Wiring:** None.
- **Dependencies:** `centered`, `cellOf`.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `OverlayHost.targetAt` | None — new symbol | hidden → `undefined`; asks child views' `itemAt`; inside the open overlay's box with no item → `overlay`; outside → `outside`, except completion → `undefined` | router |
| `PickerView.itemAt` | None — new symbol | keeps list box and `first` from `paintList` (`src/ui/overlays/picker.ts:202-210`); row → `{overlayItem, index}`; elsewhere in box → `overlay` | host |
| `CalendarOverlay.itemAt` | None — new symbol | inverse of `cellOf` → `{calendarDay, date}`; elsewhere in box → `overlay` | host |
| `CompletionView.itemAt` | None — new symbol | keeps `first` (`src/ui/overlays/completion.ts:95`) and `box` → `{overlayItem, index}` | host |

**Existing Shape:** `src/ui/overlays/host.ts:72-95` (`OverlayHost` holds child views, full screen, `zIndex: 50`).

**Proposed Shape:**

```ts
targetAt(x: number, y: number): MouseTarget | undefined;   // OverlayHost
itemAt(x: number, y: number): MouseTarget | undefined;     // child overlays; undefined outside their box
```

Prompt, conflict, and which-key boxes need no new method: the host computes their box with `centered` and the same width and height constants they use, or treats any cell as `outside` when the child exposes no `itemAt`; the core ignores prompt and conflict anyway and treats which-key like other dismissible overlays.

- **Invariants:** while any overlay except completion is open, no body target is produced.
- **Verification Coverage:** S11, S12; V18, V19, V24

## `src/core/state/base-commands.ts`, `src/core/state/picker.ts`

- **Change:** Modify
- **Decisions:** DES5
- **Requirements:** `W261005H4XZ-REQ7@R1`
- **Responsibilities:** expose the selection functions the keys already use.
- **Affected Callers/Consumers:** `src/core/state/mouse.ts`.
- **Construction/Wiring:** exports only.
- **Dependencies:** existing private functions.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `focusBaseCell`, `focusBaseCard` | private `focusCell`/`focusCard(a: Active, …)` (`src/core/state/base-commands.ts:70,90`) | exported wrappers taking `(c: CommandContext, …)` and resolving `active(c)` | `mouse.ts` |
| `showBaseView` | private `switchView(c, pick)` (`:250`) | exported `showBaseView(c, index)` = `switchView(c, () => index)` | `mouse.ts` |
| `openBaseFocused` | private `openFocused` (`:315`) | exported alias | `mouse.ts` |
| `selectPickerItem` | private `select(s, p, to)` (`src/core/state/picker.ts:639`) | exported `selectPickerItem(s, index)` that finds the open picker and calls `select` | `mouse.ts` |

**Existing Shape:** as cited.

**Proposed Shape:** thin exported wrappers; no behavior change.

Exporting the existing functions keeps a single implementation for keyboard and mouse.

- **Invariants:** keyboard behavior unchanged.
- **Verification Coverage:** S10, S11; V16, V17, V18

## `src/core/config/schema.ts`

- **Change:** Modify
- **Decisions:** DES6
- **Requirements:** `W261005H4XZ-REQ9@R1`
- **Responsibilities:** validate `mouse`.
- **Affected Callers/Consumers:** `AppConfig` consumers: `paint`, router.
- **Construction/Wiring:** None.
- **Dependencies:** zod.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ConfigSchema` | `src/core/config/schema.ts:47-60` top-level fields `leader`, `escTimeoutMs`, `autosave`, `theme`, `color`, `editor`, … | adds `mouse: z.boolean().default(true)` | `AppConfig` |

**Existing Shape:** `src/core/config/schema.ts:47-60` (shown in context; top-level `theme`, `color` entries).

**Proposed Shape:**

```ts
  mouse: z.boolean().default(true),
```

A strict object already rejects unknown keys; a wrong type is a config error like any other field.

- **Invariants:** default `true`.
- **Verification Coverage:** S13; V27

## `test/support/ui.ts`

- **Change:** Modify
- **Decisions:** DES2
- **Requirements:** verification support
- **Responsibilities:** expose OpenTUI's mock mouse to component tests.
- **Affected Callers/Consumers:** `test/ui/mouse.test.ts`.
- **Construction/Wiring:** returns `mouse: t.mockMouse` from `mountShell`.
- **Dependencies:** `createTestRenderer` (`testing/test-renderer.d.ts:13`).

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `mountShell` return | `test/support/ui.ts:121-170` (no mouse) | adds `mouse` | mouse component tests |

**Existing Shape:** `test/support/ui.ts:72-76`

**Proposed Shape:** `return { …, mouse: t.mockMouse };`

The mock mouse drives the real renderer path, including the hit grid and the `MouseLayer`.

- **Invariants:** None.
- **Verification Coverage:** V20–V24

## Migration and Delivery

- **Database or Schema Migration:** None — no persisted data changes.
- **Data Backfill:** None — none needed.
- **Mixed-Version Compatibility:** Old config files without `mouse` default to `true`; the session file is unchanged.
- **Feature Flags:** The `mouse` config key is the user-facing switch; no internal flag.
- **Rollout Constraints:** None — one binary; ships in the DI4 pull request (#8, branch `feat/rm261003abzp-di4-daily-notes-and-bases`) together with W26100423LX.
- **Rollback:** Revert the PR; a config file that sets `mouse` would then fail strict validation, so the release notes must mention the key.

# 8. Testing and Verification

## Design Success Criteria

| ID | Observable Success Condition | Traceability |
|---|---|---|
| `S1` | Each gesture yields the same state and effects as its keyboard equivalent from the same start state | REQ1–REQ8; DES1, DES5 |
| `S2` | Right and middle buttons, and events while mouse is off, change nothing | REQ1, REQ9; DES2 |
| `S3` | The wheel acts on the surface under the pointer and leaves focus and mode unchanged | REQ2; DES2, DES3, DES5 |
| `S4` | A press focuses the window, explorer, or side panel under it | REQ3; DES5 |
| `S5` | A click maps to the source column shown under the pointer on wrapped, tabbed, concealed, and widget rows | REQ4; DES3, DES4 |
| `S6` | Mode rules after a text click hold (Insert stays with split undo; Visual → Normal; pending cancelled) | REQ4; DES5 |
| `S7` | Drag yields charwise Visual from the press to the pointer, extending and edge-scrolling | REQ5; DES2, DES3, DES5 |
| `S8` | Double- and triple-click equal `viw` and `V`; clicks beyond 500 ms or another cell are singles | REQ5; DES2, DES5 |
| `S9` | Ctrl+click on a link equals placing the cursor and `gd` | REQ6; DES5 |
| `S10` | Chrome and Bases clicks equal their keyboard actions, with Bases single = focus, double = open | REQ7; DES3, DES5 |
| `S11` | Overlay item clicks accept; toasts pass clicks through | REQ7; DES3, DES5 |
| `S12` | Outside clicks close dismissible overlays and the command line (consumed); prompt and conflict ignore the mouse; completion yields | REQ8; DES3, DES5 |
| `S13` | `mouse = false` keeps terminal mouse tracking off while running; default runs button-event tracking | REQ9; DES6 |
| `S14` | Mouse tracking is off after every exit path | REQ9; DES6 |

## Test Suites and Cases

```text
src/
├── core/kernel/view/hit.test.ts [Unit]
│   Purpose: cell → source column mapping
│   SUT: sourceColAt, rowAt
│   Infra: None
│   Doubles: None
│   ├── V8 concealed link alias: spans from layoutLine for "See [[Project Plan|plan]] now" with the alias decoration
│   │   ├── Expect: sourceColAt at the display column of "l" in "plan" = source column of that "l" [S5]
│   │   └── Unique risk: inserted/hidden spans shift columns
│   ├── V9 tabs and plain text: "\tab" with tabWidth 4
│   │   ├── Expect: display cols 0–3 → 0, 4 → 1, past end → 3 [S5]
│   │   └── Unique risk: tab width miscounted
│   └── V10 rowAt over a wrapped line, a widget row, and skipRows
│       ├── Expect: second wrap row returns the same line with startCol = its wrap start; a widget row returns its RenderLine [S5]
│       └── Unique risk: row walk differs from paint
├── core/state/mouse.test.ts [Unit]
│   Purpose: gesture ≡ keyboard equivalence and mode rules
│   SUT: update with {type:"mouse"}
│   Infra: None
│   Doubles: None (testRegistries from test/support/state.ts)
│   ├── V1 equivalence table: for each REQ7 chrome target and REQ2 list wheel, compare update(mouse) with the documented keys
│   │   ├── Expect: equal state and effects [S1, S10]
│   │   └── Unique risk: a mouse path diverges from its key path
│   ├── V4 wheel over the inactive split, then a horizontal wheel over it
│   │   ├── Expect: that window's scroll +3; windows.active and vim.mode unchanged; the horizontal wheel leaves the state unchanged [S3]
│   │   └── Unique risk: wheel still targets the active window
│   ├── V5 wheel over the explorer while a window is focused
│   │   ├── Expect: explorer.cursor moved 3 visible paths; explorer.focused false [S3]
│   │   └── Unique risk: withFocus leaks focus
│   ├── V6 wheel over an inactive Base window
│   │   ├── Expect: its focus index +3; windows.active unchanged [S3]
│   │   └── Unique risk: Base commands run on the wrong window
│   ├── V7 press in inactive split / explorer / side panel / winbar
│   │   ├── Expect: windows.active or the panel focus flag set; winbar press leaves the cursor unchanged [S4]
│   │   └── Unique risk: focus flags inconsistent with keyboard focus
│   ├── V11 Insert click then type then u
│   │   ├── Expect: mode insert after the click; u undoes only text typed after it [S6]
│   │   └── Unique risk: one undo spans two places
│   ├── V12 press (2,3), drag (4,1)
│   │   ├── Expect: mode visual, visualAnchor (2,3), cursor (4,1); then y yanks that range [S7]
│   │   └── Unique risk: anchor taken from the drag, not the press
│   ├── V14 clicks 2 and 3
│   │   ├── Expect: state equals keys v i w / V at that position [S8]
│   │   └── Unique risk: multi-click selection differs from text objects
│   ├── V15 ctrl press on a wikilink
│   │   ├── Expect: state and effects equal cursor there + gd; ctrl press on plain text equals a plain press [S9]
│   │   └── Unique risk: link follow bypasses the command
│   ├── V17 Bases cell single and double press
│   │   ├── Expect: single → focus only, windows unchanged otherwise; double → equals focus + <CR> [S10]
│   │   └── Unique risk: single click opens a note
│   ├── V19 prompt and conflict open: press and wheel on every target kind
│   │   ├── Expect: state unchanged, no effects [S12]
│   │   └── Unique risk: a stray click answers a destructive dialog
│   ├── V24 picker open + press outside; ":" line open + press outside; completion open + text press
│   │   ├── Expect: picker closed and the window untouched; cmdline closed (mode normal) and the cursor untouched; completion closed and the cursor moved [S12]
│   │   └── Unique risk: outside click leaks to the body or completion blocks editing
│   └── V29 right and middle never reach the core (contract)
│       ├── Expect: MouseEvent has no button field; type check passes [S2]
│       └── Unique risk: future button cases sneak into the core
├── core/config/schema.test.ts [Unit]
│   └── V27 mouse default and type
│       ├── Expect: {} → mouse true; {mouse:"yes"} → error naming mouse [S13]
│       └── Unique risk: missing default breaks old config files
└── ui/mouse.test.ts [Unit]
    Purpose: router filtering, counting, dedupe
    SUT: createMouseRouter
    Infra: None
    Doubles: fake sources and a recording dispatch (true boundary: the store)
    ├── V2 right/middle button and enabled() false
    │   ├── Expect: no dispatch [S2]
    │   └── Unique risk: unsupported input reaches the core
    ├── V3 z-order: overlay source answers before the window source; toast area not a source
    │   ├── Expect: the first non-undefined source wins [S1, S11]
    │   └── Unique risk: lower view steals clicks
    ├── V13 click counting at 0, 300, 600 ms on the same cell, and on another cell
    │   ├── Expect: clicks 1, 2, 3, then 1 on the other cell; 1 after > 500 ms [S8]
    │   └── Unique risk: wrong multi-click detection
    └── V22 drag dedupe and capture: drags outside the origin window use origin.dragAt; repeated equal targets dispatch once; up clears origin
        ├── Expect: dispatch count and targets as listed [S7]
        └── Unique risk: drag floods the store or leaks to another window
test/
├── ui/mouse.test.ts [Integration]
│   Purpose: real views + router + store through OpenTUI's mock mouse
│   Real: createShell views, MouseLayer, router, store, update
│   Infra: OpenTUI test renderer
│   Doubles: effects recorded (mountShell)
│   ├── V20 wheel over the right split of a vertical split
│   │   ├── Expect: right window scroll 3, active unchanged [S3]
│   │   └── Unique risk: geometry → window resolution wrong
│   ├── V21 click on a wrapped continuation row and on the gutter in live preview
│   │   ├── Expect: cursor at the matching source column; gutter → col 0 [S5]
│   │   └── Unique risk: view offsets (gutter, winbar, leftCol) mis-added
│   ├── V16 click a bufferline tab, an explorer folder then a file
│   │   ├── Expect: active buffer switched; folder expanded; file opened (fileLoad effect recorded) [S10]
│   │   └── Unique risk: kept tab ranges or rows stale
│   ├── V18 picker item click and a click on a cell under a toast
│   │   ├── Expect: picker accepted that item; the window under the toast got the click [S11]
│   │   └── Unique risk: overlay row math or toast hit area
│   └── V23 Bases view tab click and table cell click
│       ├── Expect: selected view switched; focus row/column set [S10]
│       └── Unique risk: Base header/table geometry mapping
├── e2e/mouse.test.ts [Integration]
│   Purpose: real terminal modes
│   Real: built `so` over a PTY with @xterm/headless
│   Infra: PTY, temp workspace and config
│   Doubles: None
│   ├── V25 config mouse = false
│   │   ├── Expect: screen.mouse "none" while running; an SGR click leaves the cursor where it was [S2, S13]
│   │   └── Unique risk: renderer still enables tracking
│   └── V26 default config, then send SGR press/release at a text cell
│       ├── Expect: screen.mouse "drag" while running; cursor moved to the clicked cell [S13]
│       └── Unique risk: real SGR decoding → dispatch path broken
└── Non-test verification
    ├── V28 existing exit-restore suites (test/e2e/quit.test.ts, test/e2e/restore.test.ts)
    │   ├── Expect: screen.mouse "none" after :q, SIGTERM, crash, unchanged assertions pass [S14]
    │   └── Unique risk: runtime useMouse toggling breaks restore
    ├── V30 Type/build check: bun run check (biome, tsc, knip, tests)
    │   ├── Expect: exit 0 [S1]
    │   └── Unique risk: contract or export mismatch; unused exports flagged by knip
    ├── V31 Obsolete-reference check: rg 'kind: "scroll"|onMouseScroll' src
    │   ├── Expect: no matches [S1]
    │   └── Unique risk: the old scroll path remains reachable
    ├── Migration: None — no persisted data
    ├── Configuration: V27
    └── Observability: None — no logs or metrics added
```

## Coverage Balance

Mapping math and router logic are proven by unit tests (V8–V10, V2, V3, V13, V22); gesture semantics by reducer unit tests (V1, V4–V7, V11–V19, V24) because the core is pure. Component tests (V16, V18, V20, V21, V23) cover only what units cannot: real view geometry wired to the router. The PTY tests (V25, V26) cover the terminal mode and real SGR decoding once.

## Test Quality Rules

- **Unit:** Verify one public behavior or invariant per case; keep it deterministic and isolated; use doubles only at true boundaries; assert outputs or meaningful side effects. Do not test private methods, mock every collaborator, duplicate implementation logic, or assert internal call order unless order is contractual.
- **Integration/Contract:** Verify real collaboration, wiring, or boundary behavior; keep the components under examination real and list any actual database, queue, cache, filesystem, or external service under `Infra`. Replace only slow or external dependencies when necessary and list them under `Doubles`. Verify serialization, persistence, registration, transactions, and error translation only when applicable; assert observable results or durable side effects; keep setup and cleanup deterministic.
- **Non-test:** V28, V30, V31 as listed; migration and observability are `None` with reasons.

**Verification Evidence:** all cases above are proposed; none has run.

# 9. Finalized Design Decisions

## W261005H4XZ-DES1: Model-level mouse contract

**Question:** What does the core receive for a mouse gesture?

**Decision:** A `MouseEvent` of `press`, `drag`, or `wheel` carrying a `MouseTarget` in model terms (window id + position or Bases element, explorer path, panel row, buffer id, overlay item, calendar day, outside, inert), plus `now` on the action.

**Requirements Addressed:** `W261005H4XZ-REQ1@R1`

**Research Support:** None

**Rationale:** The project's boundary forbids OpenTUI types and screen geometry in `src/core`; model targets keep the core testable without a renderer and let it reuse reducers that already think in paths, rows, and positions. Rejected alternative: raw cell coordinates plus window rects in state — puts layout into the core and duplicates view geometry.

**Code Impact:**

- `src/core/state/types.ts` — `MouseEvent`, `MouseTarget`, `WindowSpot`, `Action` — contract change.

**Detailed Design:** section 7 `src/core/state/types.ts`

**Tradeoffs:**

- Every view must translate cells, so geometry knowledge is spread across views (accepted: each view already owns its layout).

**Success Criteria:** S1, S2

**Verification Impact:**

- V1 equivalence table; V29 contract type check.

## W261005H4XZ-DES2: One mouse router on a top layer

**Question:** Where do OpenTUI mouse events enter, and who resolves z-order, click counts, and drags?

**Decision:** A full-screen, paint-free `MouseLayer` at the top z-index sends every event to one `MouseRouter`, which asks `MouseSource`s in z-order, counts clicks (same cell, ≤ 500 ms, 1→2→3→1), captures drags to the press source, dedupes drag targets, and drops right and middle buttons and everything while mouse is off.

**Requirements Addressed:** `W261005H4XZ-REQ1@R1`, `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ5@R1`, `W261005H4XZ-REQ7@R1`, `W261005H4XZ-REQ9@R1`

**Research Support:** None

**Rationale:** OpenTUI's hit grid uses each renderable's full rect (`addToHitGrid(screenX, screenY, width, height)`, `chunk-bun-j2z63cdy.js:1393`), so the full-screen `OverlayHost` and the toast column would capture clicks they do not paint; its double-click detection works only for `selectable` renderables (context Section 5 step 5). One router fixes both and keeps press state in one place, mirroring the existing key normalizer. Rejected alternatives: per-view OpenTUI handlers (duplicated counting and capture, toast leaks); OpenTUI built-in selection (a second selection model beside Visual mode).

**Code Impact:**

- `src/ui/mouse.ts` — `MouseLayer`, `createMouseRouter`, `MouseSource`, `CLICK_MS` — new.
- `src/ui/shell.ts` — `View`, `createShell` — wiring.

**Detailed Design:** section 7 `src/ui/mouse.ts`, `src/ui/shell.ts`

**Tradeoffs:**

- The router's source order must mirror the paint order; a new view must be added to both lists.

**Success Criteria:** S2, S3, S7, S8, S11

**Verification Impact:**

- V2, V3, V13, V22 router units; V18, V20 component cases.

## W261005H4XZ-DES3: Views resolve cells to targets

**Question:** How does a screen cell become a model target?

**Decision:** Each view implements `targetAt(x, y)` from the geometry of its last layout; `WindowTree` delegates by kept rects; `EditorView` uses `rowAt` and `sourceColAt` and adds `dragAt` with clamping and an edge; `OverlayHost` returns `outside` for cells outside the open overlay except completion; bufferline, picker, and completion keep the ranges they currently compute only while painting.

**Requirements Addressed:** `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ3@R1`, `W261005H4XZ-REQ4@R1`, `W261005H4XZ-REQ5@R1`, `W261005H4XZ-REQ7@R1`, `W261005H4XZ-REQ8@R1`

**Research Support:** None

**Rationale:** Views already keep their geometry because OpenTUI layout getters lag a frame (`src/ui/editors/text-view.ts:272`); answering from that geometry matches exactly what the user sees.

**Code Impact:**

- `src/ui/editors/text-view.ts`, `base-view.ts`, `registry.ts`; `src/ui/views/*`; `src/ui/overlays/{host,picker,calendar,completion}.ts` — `targetAt`, `dragAt`, `itemAt`.

**Detailed Design:** section 7 per file

**Tradeoffs:**

- Small extra state per view (tab ranges, list `first`, rects).

**Success Criteria:** S3, S4, S5, S7, S10, S11, S12

**Verification Impact:**

- V16, V18, V20, V21, V23 component cases.

## W261005H4XZ-DES4: Source columns on rendered spans

**Question:** How does a display column on a concealed or wrapped line map back to a source column?

**Decision:** `spansOf` records `col` (source column of the first character) on every span and marks replacement spans `inserted`; the pure `sourceColAt` and `rowAt` in `src/core/kernel/view/hit.ts` invert the layout.

**Requirements Addressed:** `W261005H4XZ-REQ4@R1`

**Research Support:** None

**Rationale:** `layoutLine` is the only code that knows which columns were hidden or inserted (`src/core/kernel/view/text-view.ts:104-118`); recording the column there is exact and cheap. Rejected alternative: re-running decorations at click time — duplicates layout and can disagree with the painted frame.

**Code Impact:**

- `src/core/kernel/view/types.ts` — `Span`.
- `src/core/kernel/view/text-view.ts` — `spansOf`.
- `src/core/kernel/view/hit.ts` — `sourceColAt`, `rowAt`.

**Detailed Design:** section 7 `src/core/kernel/view/*`

**Tradeoffs:**

- Two optional fields on every span (memory per visible span only).

**Success Criteria:** S5

**Verification Impact:**

- V8, V9, V10 units; V21 component.

## W261005H4XZ-DES5: Core mouse reducer maps gestures to keyboard actions

**Question:** How does the core apply a gesture?

**Decision:** A new `src/core/state/mouse.ts` `onMouse` applies the overlay gate, focus, and then the target's keyboard path: `feedKeys` (folding `handleKeyAction`) for key sequences such as `<Esc>`, `i`, `v`, `viw`, `V`, `<CR>`, `j`/`k`; `runCommand("link.follow")` for Ctrl+click; `placeCursor`, `showBuffer`, explorer `openSelected`/`moveCursor`, exported Bases focus and view functions, and `selectPickerItem` where a key sequence cannot express "this item". `withFocus` runs focus-scoped reducers for the wheel and restores focus.

**Requirements Addressed:** `W261005H4XZ-REQ1@R1`, `W261005H4XZ-REQ2@R2`, `W261005H4XZ-REQ3@R1`, `W261005H4XZ-REQ4@R1`, `W261005H4XZ-REQ5@R1`, `W261005H4XZ-REQ6@R1`, `W261005H4XZ-REQ7@R1`, `W261005H4XZ-REQ8@R1`

**Research Support:** None

**Rationale:** Feeding the same keys makes equivalence true by construction, so mode, undo, `.` repeat, which-key, and keymap rules stay correct without new logic; a new key feature is reachable by mouse with one mapping.

**Code Impact:**

- `src/core/state/mouse.ts` — new.
- `src/core/state/update.ts` — mouse case.
- `src/core/state/base-commands.ts`, `src/core/state/picker.ts` — exports.

**Detailed Design:** section 7 `src/core/state/mouse.ts`

**Tradeoffs:**

- A user keymap that rebinds `v`, `i`, or `V` changes mouse selection too; this matches Neovim, where mouse selection follows Visual mode semantics. Ctrl+click uses the command id, not the `gd` keys, so rebinding `gd` does not change it.

**Success Criteria:** S1, S3, S4, S6, S7, S8, S9, S10, S11, S12

**Verification Impact:**

- V1, V4–V7, V11, V12, V14, V15, V17, V19, V24 reducer units.

## W261005H4XZ-DES6: Mouse config toggles terminal reporting

**Question:** How is mouse reporting switched on and off?

**Decision:** `ConfigSchema.mouse` (boolean, default `true`); `RENDERER_OPTIONS.useMouse` starts `false`; each paint sets `renderer.useMouse` to `state.config.mouse` when they differ; `MouseLayer` hides and the router drops events while off; exit restore stays in `renderer.destroy()`.

**Requirements Addressed:** `W261005H4XZ-REQ9@R1`

**Research Support:** None

**Rationale:** Matches Vim `mouse` and Helix `editor.mouse`; OpenTUI's `useMouse` setter toggles tracking at runtime (`chunk-bun-j2z63cdy.js:7922-7930`), so config reload needs no restart.

**Code Impact:**

- `src/core/config/schema.ts` — `ConfigSchema`.
- `src/ui/shell.ts` — `RENDERER_OPTIONS`, `paint`.

**Detailed Design:** section 7 `src/core/config/schema.ts`, `src/ui/shell.ts`

**Tradeoffs:**

- The default config turns tracking on at the first paint rather than at renderer creation (one frame later; invisible to the user).

**Success Criteria:** S13, S14

**Verification Impact:**

- V25, V26 PTY; V27 schema; V28 restore suites.
