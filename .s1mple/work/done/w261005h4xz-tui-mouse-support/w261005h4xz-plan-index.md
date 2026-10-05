# W261005H4XZ Implementation Plan Index

## Status

`Ready`

## Sources

- Plan context: `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-plan-context.md`
- System design: `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-system-design.md`
- UI design: Not applicable — no UI design for this work; the system design is the sole authority
- System requirements: `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-requirements.md`
- UI requirements: Not applicable — no UI requirements document for this work
- Research: Not needed
- Discussion context: `.s1mple/work/active/w261005h4xz-tui-mouse-support/w261005h4xz-discuss-context.md`
- UI context: Not applicable — no UI discussion

## Roadmap Contract

None — standalone work

## Plan Overview

Build the pure core first, then the UI that feeds it.

Part 1 replaces the scroll-only mouse contract with the model-level `MouseEvent`/`MouseTarget` contract (DES1), adds span source columns and the pure `rowAt`/`sourceColAt` mapping (DES4), the `mouse` config key (DES6 schema half), the thin reducer exports for Bases, picker, and calendar, and the `onMouse` gesture reducer wired into `update` (DES5). The old `onMouseScroll` handler in `EditorView` is removed in the same group so `tsc` stays green; editor wheel scrolling is absent only until Part 2 lands, and both parts ship together in PR #8.

Part 2 adds the one `MouseRouter` and full-screen `MouseLayer` (DES2), shell wiring and the `renderer.useMouse` sync (DES6 runtime half), and every view's `targetAt`/`dragAt`/`itemAt` (DES3): editor, window tree, and Bases surfaces first, then chrome and overlay surfaces.

Plan behavior is "Not established" in `.s1mple/S1MPLE.md`, so this plan follows the s1mple-plan defaults. Implementation carries the "keep it lean" rule and the ban on work-process identifiers (W/REQ/DES/S/V/phase/group/task ids) in code, test names, comments, and logs. Verification follows the design's §8 tree plus `bun run check` and `bun run test:ci`. Delivery commits and pushes to the existing branch `feat/rm261003abzp-di4-daily-notes-and-bases` (PR #8, no new branch or PR), makes PR #8 CI green, moves the work folder to `work/done/` with `.s1mple/` reference updates, and pushes again; never force-push, merge, tag, or release without the user's approval. Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required references, never uses the native `Explore` subagent, and kills every process it starts (PTY runs, `bun run dev`, sandboxes).

## Execution Flow

```text
Plan 1: core mouse model → Plan 2: ui mouse routing
```

## Plan Parts

| Part | File | Scope | Dependencies | System design | UI design | Verification focus |
|---|---|---|---|---|---|---|
| 1 | `w261005h4xz-plan-1-core-mouse-model.md` | `src/core` contract types, span source columns and `hit.ts`, `mouse` config key, Bases/picker/calendar reducer exports, `src/core/state/mouse.ts` reducer and `update` wiring; removal of `EditorView.onMouseScroll` | None | `REQ1@R1–REQ9@R1` (REQ2@R2); `DES1`, `DES4`, `DES5`, `DES6` (schema); `S1–S12`, `S13` (config); `V1`, `V4–V12`, `V14`, `V15`, `V17`, `V19`, `V24`, `V27`, `V29`, `V31` | None | Keyboard equivalence, focus/mode rules, column mapping, config default, prompt/conflict immunity |
| 2 | `w261005h4xz-plan-2-ui-mouse-routing.md` | `src/ui/mouse.ts` router and layer, `shell.ts` wiring and `useMouse` sync, every view's `targetAt`/`dragAt`/`itemAt`, `mountShell` mouse helper, component and PTY tests | 1 | `REQ1@R1`, `REQ2@R2`, `REQ4@R1`, `REQ5@R1`, `REQ7@R1–REQ9@R1`; `DES2`, `DES3`, `DES6` (runtime); `S1–S3`, `S5`, `S7`, `S8`, `S10–S14`; `V2`, `V3`, `V13`, `V16`, `V18`, `V20–V23`, `V25`, `V26`, `V28`, `V30` | None | Router drop/count/dedupe, overlay-first z-order (V3), real geometry → target, terminal modes and exit restore, full checks |

## Group Layout

| Group | Shared context | Split rule |
|---|---|---|
| `P1-G1` | `src/core/state/{types,update,mouse,mouse.test,base-commands,picker,calendar}.ts`, `src/core/kernel/view/{types,text-view,hit,hit.test}.ts`, `src/core/config/{schema,schema.test}.ts`, `src/ui/editors/text-view.ts` (handler removal only); the `MouseEvent`/`MouseTarget` contract; reducer unit tests | `First group` |
| `P2-G1` | `src/ui/{mouse,mouse.test,shell}.ts`, `src/ui/editors/{text-view,registry,base-view}.ts`, `src/ui/views/window-tree.ts`, `test/support/ui.ts`, `test/ui/mouse.test.ts`, `test/e2e/{mouse.test,pty}.ts`; the `MouseSource` contract and window geometry | `Ordered phase` — the UI dispatches the Part 1 contract and needs the core reducer verified first |
| `P2-G2` | `src/ui/views/{explorer,side-panel,bufferline,statusline,cmdline}.ts`, `src/ui/overlays/{host,picker,calendar,completion}.ts`, `src/ui/shell.ts` (router `sources` list), `test/ui/mouse.test.ts` (chrome and overlay cases); kept-geometry `targetAt`/`itemAt` per surface | `Too large` — Part 2 spans about 21 changed files; chrome and overlay sources share only the `MouseSource` contract with the router and window sources |

## Cross-Part Coordination

| Boundary | Producing part | Consuming part | Coordination requirement |
|---|---|---|---|
| `MouseEvent`, `MouseTarget`, `WindowSpot`, `Action` `mouse` member with `now` (`src/core/state/types.ts`) | 1 | 2 | Router and every `targetAt` return exactly these shapes; no rects or OpenTUI objects in the core |
| `rowAt`, `sourceColAt`, `ScreenRow`, `Span.col`/`Span.inserted` (`src/core/kernel/view/hit.ts`, `types.ts`) | 1 | 2 | `EditorView.targetAt`/`dragAt` use them with the same row walk as paint |
| `AppConfig.mouse` (`src/core/config/schema.ts`) | 1 | 2 | Router `enabled()` and `paint`'s `renderer.useMouse` sync read this key |
| Removal of `EditorView.onMouseScroll` (`src/ui/editors/text-view.ts`) | 1 | 2 | Part 2 adds `targetAt`/`dragAt` to the same class; editor wheel is restored by the router |
| `View` (+ `targetAt?`, `dragAt?`) and `MouseSource` (`src/ui/shell.ts`, `src/ui/mouse.ts`) | 2 (`P2-G1`) | 2 (`P2-G2`) | Chrome and overlay sources implement the same contract; router source order per design §7 |

## Coverage

| Source item | Covered by parts | Expected outcome |
|---|---|---|
| `W261005H4XZ-REQ1@R1` / `DES1`, `DES5` / `S1`, `S2` / `V1`, `V2`, `V3`, `V29`, `V30`, `V31` | 1, 2 | Every gesture equals its keyboard path; right/middle and mouse-off events change nothing |
| `W261005H4XZ-REQ2@R2` / `DES2`, `DES3`, `DES5` / `S3` / `V4`, `V5`, `V6`, `V20` | 1, 2 | Wheel acts on the surface under the pointer, clamped (completion included), focus and mode unchanged |
| `W261005H4XZ-REQ3@R1` / `DES5` / `S4` / `V7` | 1 | Press focuses the window, explorer, or side panel under it |
| `W261005H4XZ-REQ4@R1` / `DES3`, `DES4`, `DES5` / `S5`, `S6` / `V8–V11`, `V21` | 1, 2 | Click places the cursor on the displayed source column; mode rules hold |
| `W261005H4XZ-REQ5@R1` / `DES2`, `DES3`, `DES5` / `S7`, `S8` / `V12`, `V13`, `V14`, `V22` | 1, 2 | Drag = charwise Visual with edge scroll; 2×/3× = `viw`/`V` |
| `W261005H4XZ-REQ6@R1` / `DES5` / `S9` / `V15` | 1 | Ctrl+click on a link = cursor there + `link.follow` |
| `W261005H4XZ-REQ7@R1` / `DES3`, `DES5` / `S10`, `S11` / `V1`, `V16`, `V17`, `V18`, `V23` | 1, 2 | Chrome, Bases, picker, completion, and calendar clicks reuse keyboard reducers; toasts pass clicks through |
| `W261005H4XZ-REQ8@R1` / `DES3`, `DES5` / `S12` / `V19`, `V24` | 1, 2 | Outside press closes dismissible overlays and the command line; prompt/conflict ignore the mouse; completion yields |
| `W261005H4XZ-REQ9@R1` / `DES6` / `S13`, `S14` / `V25–V28` | 1, 2 | `mouse` default `true`; `"drag"` tracking while on, `"none"` while off and after every exit |
| Plan-context gap 1: shell wiring lives in `attach(store)`; hoist `Statusline` and `Bufferline` | 2 | Router and layer built in `attach`; both views passed as sources |
| Plan-context gap 2: calendar day select needs an exported wrapper in `src/core/state/calendar.ts` | 1 | Thin exported day-select wrapper over `show`, consumed by `onMouse` |
| Plan-context gap 3: completion wheel clamps instead of wrapping | 1 | `wheel` feeds at most the remaining `<Down>`/`<Up>` steps |
| Plan-context gap 4: completion click sets `selected` then `<CR>`; body-press close uses `overlay: {kind:"none"}` | 1, 2 | Insert mode stays on when a body press closes completion |
| Plan-context gap 5: PTY tests run source via Bun; `mouse = false` via `XDG_CONFIG_HOME` | 2 | `test/e2e/mouse.test.ts` follows the existing PTY pattern |
| Plan-context gap 6: every new export has a consumer (knip) | 1, 2 | `bun run check` reports zero knip findings |
| Binding: `src/core` imports no `@opentui/*`; state changes only through `store.dispatch` → `update` | 1, 2 | `test/boundaries.test.ts` passes; views only resolve targets |
| Binding: no work-process identifiers in code, tests, or logs | 1, 2 | Work-ID scan finds no matches in changed files |
| Binding: no Bases drag-and-drop | 2 | No card or tab drag behavior |
| Binding: Delivery through PR #8 on `feat/rm261003abzp-di4-daily-notes-and-bases`; no force-push, merge, tag, or release without approval | None — the execution goal's delivery stage owns it after overall verification | PR #8 CI green on the final head; work folder moved to `work/done/` |

## Overall Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate (V29, V30) | `bun run check` | Exit 0: biome, tsc, knip, unit suites |
| Full suites | `bun run test:ci` | Component, integration, and PTY suites green, including `test/ui/mouse.test.ts` and `test/e2e/mouse.test.ts` |
| Exit restore (V28) | `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts` | `screen.mouse` is `"none"` after `:q`, `SIGTERM`, and crash |
| Obsolete reference (V31) | `rg 'kind: "scroll"\|onMouseScroll' src` | No matches |
| Work-ID scan | `rg -n 'W261005H4XZ\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b' src test` over changed files | No matches |
| Benchmarks | `bun run bench` | Reported only; non-blocking |
| Process cleanup | `pgrep -fl 'src/app/main.ts\|bun run dev'` after test runs | No orphan processes started by the work |
| CI | PR #8 checks after each push | `check` and `test` jobs green on the pushed head |

## Completion Criteria

- Every listed plan part is implemented and verified.
- Every system and applicable UI design chain and binding constraint has complete coverage.
- Cross-part coordination is integrated and verified.
- For roadmap-linked work, assigned parent obligations and cross-work checks have actual evidence, and all gates due within this execution scope are satisfied. Report later delivery gates separately; do not infer roadmap delivery from work completion.
- All overall verification checks pass.

## Planning Gaps

None
