# W261005H4XZ Plan Context

## Status

`Ready`

## 1. Sources

| Source | Path | Use |
|---|---|---|
| s1mple instructions | `.s1mple/S1MPLE.md` | Workflow behavior and required context |
| Project document | `.s1mple/docs/project.md` | Reusable project baseline |
| System design | `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-system-design.md` | Technical authority (`Finalized System Design`) |
| UI design | Not applicable — no UI design for this work; the system design is the sole authority | UI/UX authority when present |
| System requirements | `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-requirements.md` | Required system behavior (`Ready for System Design`) |
| UI requirements | Not applicable — no UI requirements document for this work | Required UI behavior when present |
| Research | Not needed — research was skipped in requirements and design | Relevant research findings |
| Discussion context | `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-discuss-context.md` | Work-specific findings and constraints |
| UI context | Not applicable — no UI discussion | Existing UI code and pattern evidence |
| Roadmap sources | Not applicable | Standalone work; `rm261003abzp-*` sources are related context only, not a binding |
| Additional project files | `.s1mple/docs/communication.md`, `.s1mple/docs/languages/typescript.md`, `src/ui/shell.ts`, `src/core/state/{types,update,completion,picker,calendar,explorer,side-panel,commands,base-commands,buffers}.ts`, `src/ui/editors/{text-view,registry,base-view}.ts`, `src/ui/views/{window-tree,bufferline}.ts`, `src/ui/overlays/{host,picker,calendar,completion}.ts`, `src/core/config/schema.ts`, `test/support/{ui,state}.ts`, `test/e2e/{pty,quit.test,restore.test}.ts` | Confirm design anchors and resolve mechanical gaps (Section 6) |

## 2. Governing Design Handoff

### Source Authority

- **System design:** `w261005h4xz-system-design.md` — authoritative for the mouse contract, router, view targets, source-column mapping, core reducer, config switch, files, symbols, flows, and verification `S1–S14`, `V1–V31`.
- **UI design:** Not applicable — no UI design.
- **Alignment:** Single governing design

### Approved Direction

Every mouse gesture enters one full-screen, paint-free `MouseLayer` and one `MouseRouter` in `src/ui/mouse.ts` (DES2). The router drops right/middle buttons and everything while `config.mouse` is off, resolves the target by asking views' `targetAt` in z-order, counts clicks, captures drags to the press source, and dispatches a model-level `MouseEvent` (`press` / `drag` / `wheel`) with `now` (DES1). Views map cells to targets from geometry kept at their last layout (DES3); editor text uses new span source columns and pure `rowAt` / `sourceColAt` in `src/core/kernel/view/hit.ts` (DES4). A new pure `src/core/state/mouse.ts` `onMouse` applies the overlay gate, focus, and then the keyboard-equivalent path via `feedKeys`, `runCommand`, and existing or newly exported reducers (DES5). A `mouse` config boolean drives `renderer.useMouse` on each paint (DES6). Canonical detail: system design sections 2, 5, 7.

### Design Coverage

| Source | Chain | Planning meaning | Canonical detail |
|---|---|---|---|
| System design | `REQ1@R1 → DES1, DES5 → S1, S2 → V1, V2, V3, V29, V30, V31` | Every gesture equals its keyboard path; no button field reaches the core | §1 Coverage; §7 `types.ts`, `mouse.ts` |
| System design | `REQ2@R2 → DES2, DES3, DES5 → S3 → V4, V5, V6, V20` | Wheel acts under the pointer; focus and mode unchanged; no horizontal editor scroll | §5 "Wheel"; §7 `mouse.ts` `wheel`, `withFocus` |
| System design | `REQ3@R1 → DES5 → S4 → V7` | Press focuses window / explorer / side panel first | §7 `mouse.ts` `focusTarget` |
| System design | `REQ4@R1 → DES3, DES4, DES5 → S5, S6 → V8, V9, V10, V11, V21` | Click maps to the displayed source column; mode rules incl. Insert undo split | §7 `hit.ts`, `text-view.ts`, `mouse.ts` `pressText` |
| System design | `REQ5@R1 → DES2, DES3, DES5 → S7, S8 → V12, V13, V14, V22` | Drag = charwise Visual with edge scroll; 2×/3× = `viw` / `V` | §5 "Drag"; §7 `src/ui/mouse.ts`, `dragText` |
| System design | `REQ6@R1 → DES5 → S9 → V15` | Ctrl+click = place cursor + `link.follow` | §7 `mouse.ts` `pressText` |
| System design | `REQ7@R1 → DES3, DES5 → S10, S11 → V1, V16, V17, V18, V23` | Chrome, overlay item, calendar, and Bases clicks reuse keyboard reducers; toasts pass clicks through | §5 "Press"; §7 views and `base-commands.ts`, `picker.ts` |
| System design | `REQ8@R1 → DES3, DES5 → S12 → V19, V24` | Outside press closes dismissible overlays and the `:`/`/`/`?` line (consumed); prompt/conflict ignore mouse; completion yields | §5 "Overlay gate"; §7 `host.ts`, `overlayGate` |
| System design | `REQ9@R1 → DES6 → S13, S14 → V25, V26, V27, V28` | `mouse` config default `true`; button-event tracking; off after every exit | §5 "Config"; §7 `schema.ts`, `shell.ts` |
| UI design | Not applicable | No UI design | None |

### Applicable Code Shapes

| Source shape | Target | Planning use |
|---|---|---|
| §7 `src/core/state/types.ts` | `WindowSpot`, `MouseTarget`, `MouseEvent`, `Action` `mouse` member (+ `now`) | First task; every later task compiles against it |
| §7 `src/core/state/mouse.ts` | `onMouse`, `feedKeys`, `withFocus`, `overlayGate`, `focusTarget`, `pressText`, `dragText`, `wheel`, `pressChrome`, `WHEEL_LINES` | Core reducer tasks and `mouse.test.ts` |
| §7 `src/core/state/update.ts` | `update` mouse case → `onMouse(state, action, reg)`; local `onMouse` removed | Wiring task with the reducer |
| §7 `src/core/kernel/view/types.ts` | `Span.col?`, `Span.inserted?` | Source-column task |
| §7 `src/core/kernel/view/text-view.ts` | `spansOf` sets `col` / `inserted` | Source-column task |
| §7 `src/core/kernel/view/hit.ts` | `ScreenRow`, `rowAt`, `sourceColAt` | Source-column task and `hit.test.ts` |
| §7 `src/ui/mouse.ts` | `CLICK_MS`, `MouseSource`, `createMouseRouter`, `MouseLayer` | Router task and `src/ui/mouse.test.ts` |
| §7 `src/ui/shell.ts` | `RENDERER_OPTIONS.useMouse: false`; `View` (+ `targetAt?`, `dragAt?`); router/layer construction; `paint` syncs `renderer.useMouse` and `layer.update` | Shell wiring task |
| §7 `src/ui/editors/text-view.ts` | `EditorView.targetAt`, `EditorView.dragAt`; `onMouseScroll` removed | Editor target task |
| §7 `window-tree.ts`, `registry.ts`, `base-view.ts` | `WindowTree.targetAt`/`dragAt` (kept `rects`); `WindowView` (+ `targetAt`, `dragAt?`); `BaseView.targetAt` (kept tab ranges) | Window/Bases target task |
| §7 `src/ui/views/{explorer,side-panel,bufferline,statusline,cmdline}.ts` | `targetAt` per view | Chrome target task |
| §7 `src/ui/overlays/{host,picker,calendar,completion}.ts` | `OverlayHost.targetAt`; `PickerView.itemAt`, `CalendarOverlay.itemAt`, `CompletionView.itemAt` | Overlay target task |
| §7 `base-commands.ts`, `picker.ts` | exported `focusBaseCell`, `focusBaseCard`, `showBaseView`, `openBaseFocused`, `selectPickerItem` | Reducer-export task |
| §7 `src/core/config/schema.ts` | `mouse: z.boolean().default(true)` | Config task |
| §7 `test/support/ui.ts` | `mountShell` returns `mouse: t.mockMouse` | Component-test support |

Reference shapes only; the code previews stay in the system design.

### Runtime Flow

```text
terminal SGR (1002+1006) → OpenTUI CliRenderer → MouseLayer (zIndex 1000, hidden when mouse off)
  → MouseRouter.handle: off / right / middle → drop
       scroll → first source.targetAt(x,y) → {wheel, target, dx, dy}
       down(left) → first source.targetAt(x,y) → clicks (same cell ≤ 500 ms, 1→2→3→1) → origin → {press, target, clicks, ctrl}
       drag → origin is window text → origin.source.dragAt (clamped, edge) → dedupe → {drag, target}
       up / drag-end → clear origin
  sources (z-order): OverlayHost → CommandLine → Statusline → SidePanelView → ExplorerView → Bufferline → WindowTree (→ EditorView | BaseView)
  → store.dispatch({type:"mouse", event, now}) → update → onMouse
       overlayGate → focusTarget (press) → pressText | dragText | wheel | pressChrome
       → feedKeys(handleKeyAction) | runCommand | placeCursor | showBuffer | openSelected | sidePanelKey | Bases/picker exports | completionKey | calendarKey
  → AppState → paint → views repaint; renderer.useMouse = config.mouse
exit → renderer.destroy() → mouse tracking off
```

### Roadmap Validation

None — standalone work

### Cross-Work Dependency Gates

None

## 3. Binding Constraints

| Constraint | Source | Planning implication |
|---|---|---|
| Plan behavior is "Not established" | `.s1mple/S1MPLE.md` §3 Plan | Follow the s1mple-plan skill defaults |
| Read communication rules, project context, and TypeScript rules before work; every delegated agent reads and follows `.s1mple/S1MPLE.md` | `.s1mple/S1MPLE.md` §2 | Each execution prompt names `.s1mple/S1MPLE.md` and its required references |
| Exploration: no native `Explore` subagent; prefer `s1mple-explore` when delegation is needed | `.s1mple/S1MPLE.md` §3 Exploration | Execution artifacts must not use `Explore` |
| Keep it lean and simple; no abstractions beyond current needs | `.s1mple/S1MPLE.md` §3 Implementation; `typescript.md` | Implement only the designed symbols; thin wrappers for exports |
| No work-process identifiers (W/REQ/DES/S/V/phase/goal/task IDs) in comments, doc comments, identifiers, test names, SQL comments, or log messages | `.s1mple/S1MPLE.md` §3 Implementation; `typescript.md` | Test names describe behavior (e.g. `test("wheel scrolls the window under the pointer")`); V-ids stay in plan documents only |
| Verification behavior is "Not established" | `.s1mple/S1MPLE.md` §3 Verification | Use the design's §8 verification tree and project checks |
| Delivery: open a PR, make CI pass, resolve base-branch conflicts; move the work folder `work/active/` → `work/done/` and update `.s1mple/` references; push again and CI must pass on the new head | `.s1mple/S1MPLE.md` §3 Delivery | Final delivery tasks; the PR already exists (below) |
| Never force-push or merge without the user's approval | `.s1mple/S1MPLE.md` §3 Delivery | Execution stops before any merge or force-push |
| This work ships on branch `feat/rm261003abzp-di4-daily-notes-and-bases` in PR #8 (currently OPEN) with W26100423LX; no separate branch or PR | System design §7 Migration and Delivery; user memory | Commit and push to the current branch; "open a PR" is satisfied by PR #8 |
| CI runs only on `pull_request` to `main` | `.s1mple/docs/project.md` CI Checks | CI evidence comes from PR #8 checks after each push |
| No release, tag, or publish unless the user asks | `.s1mple/docs/project.md` Release; user memory | No `v*` tag; no `release.yml` run is required for this work |
| Perf gates do not block development | User memory | `bun run bench` regressions are reported, not blocking; prefer relaxing thresholds plus quick speedups |
| Subagents kill every process they start (PTY runs, `bun run dev`, sandboxes) and check for orphans before benches | User memory | Every execution prompt includes the cleanup rule |
| `src/core` imports no `@opentui/*`, I/O, or runtime; only `src/ui` imports `@opentui/*` | `.s1mple/docs/project.md` Boundaries; `test/boundaries.test.ts` | `MouseTarget`/`MouseEvent` carry model values only; `hit.ts` stays in `core/kernel/view` (kernel-only imports) |
| Every state change goes through `store.dispatch` → pure `update` | `.s1mple/docs/project.md` Architecture | Views and router never mutate state |
| Strict TS, `import type`, colocated behavior-named `*.test.ts`, `bun run check` before commit; zero knip findings | `.s1mple/docs/languages/typescript.md` | New exports must have consumers (knip); `ignoreExportsUsedInFile` only covers same-file use |
| Exact pins; no new dependency expected | `.s1mple/docs/project.md` Constraints | No `package.json` change |
| Bases: no drag-and-drop | `rm261003abzp-ui-design.md:2359`; requirements §3 | No card/tab drag behavior |

## 4. Supporting Evidence

### Requirements

| Requirement | Design coverage | Required outcome |
|---|---|---|
| `W261005H4XZ-REQ1@R1` | `DES1`, `DES5` (router drop in `DES2`) | Gesture state equals keyboard-equivalent state; right/middle change nothing |
| `W261005H4XZ-REQ2@R2` | `DES2`, `DES3`, `DES5` | Wheel under pointer, 3 lines/items per notch, clamped; focus and mode unchanged; Bases table `H`/`L`, board `h`/`l` horizontally; no horizontal editor scroll |
| `W261005H4XZ-REQ3@R1` | `DES5` | Press focuses window (incl. winbar, gutter), explorer, or side panel; bufferline/statusline/cmdline do not move focus |
| `W261005H4XZ-REQ4@R1` | `DES3`, `DES4`, `DES5` | Cursor on the displayed source character (wrap, tabs, conceal, widgets, gutter, past-end, below-end); Insert stays with undo split; Visual → Normal; pending cancelled |
| `W261005H4XZ-REQ5@R1` | `DES2`, `DES3`, `DES5` | Drag → charwise Visual anchored at press, edge-scroll one line per drag event; release keeps Visual; 2× = `viw`, 3× = `V`, 500 ms same cell |
| `W261005H4XZ-REQ6@R1` | `DES5` | Ctrl+click on a link = cursor there + `gd` (`link.follow`); on plain text = plain click |
| `W261005H4XZ-REQ7@R1` | `DES3`, `DES5` | Bufferline `:b`; explorer/side panel select + `Enter`; Bases tab switch, cell/card focus, double = open; picker/completion accept; calendar open; inert surfaces; toasts pass through |
| `W261005H4XZ-REQ8@R1` | `DES3`, `DES5` | Outside press closes dismissible overlays and the open command line like `Esc` (consumed); completion closes and the press proceeds; prompt/conflict ignore all mouse input |
| `W261005H4XZ-REQ9@R1` | `DES6` | `mouse` boolean default `true`; mode `"drag"` while on, `"none"` while off; `"none"` after every exit; invalid type is a config error |

### Research Findings

Not needed — research was skipped in both requirements and design (`Research Source: None`).

## 5. Project Implementation Context

### Relevant Structure

```text
src/
├── core/
│   ├── config/schema.ts, schema.test.ts           ConfigSchema (+ mouse)
│   ├── kernel/view/types.ts, text-view.ts, [A] hit.ts, [A] hit.test.ts
│   └── state/types.ts, update.ts, [A] mouse.ts, [A] mouse.test.ts,
│             base-commands.ts, picker.ts, calendar.ts (see gap 2),
│             completion.ts, explorer.ts, side-panel.ts, buffers.ts, commands.ts, keys.ts (reused)
├── ui/
│   ├── [A] mouse.ts, [A] mouse.test.ts, shell.ts
│   ├── editors/text-view.ts, base-view.ts, registry.ts
│   ├── views/window-tree.ts, explorer.ts, side-panel.ts, bufferline.ts, statusline.ts, cmdline.ts
│   └── overlays/host.ts, picker.ts, calendar.ts, completion.ts (prompt/conflict/whichkey/notify unchanged)
test/
├── support/ui.ts (mountShell + mouse), state.ts (testRegistries, fresh, openBuffer)
├── ui/[A] mouse.test.ts
└── e2e/pty.ts, quit.test.ts, restore.test.ts, [A] mouse.test.ts
```

### Established Patterns

| Pattern | Evidence | Planning use |
|---|---|---|
| Views dispatch core actions; they never change state | `src/ui/editors/text-view.ts:287-294` | Router dispatches; views only answer `targetAt` |
| Views keep last-layout geometry because layout getters lag a frame | `src/ui/editors/text-view.ts:271-280` | `targetAt` reads kept `rect`, `topLine`, `leftCol`, `skipRows`, `lines` |
| Key normalizer built in `attach`, fed from renderer input | `src/ui/shell.ts:166-173` | Router built beside it with `now: deps.now`, `dispatch: store.dispatch` |
| Paint loop updates every view then sets the cursor | `src/ui/shell.ts:153-164` | Add `renderer.useMouse` sync and `layer.update(s)` here |
| Exported thin reducer reused by keys and other callers | `src/core/state/explorer.ts:267,292` (`moveCursor`, `openSelected`) | Same style for new Bases/picker/calendar exports |
| Picker selection clamps | `src/core/state/picker.ts:639-647` | `selectPickerItem` wraps `select` |
| Completion list moves wrap modulo `n` | `src/core/state/completion.ts:239-256` | See gap 3 |
| Close completion without leaving Insert: `overlay: {kind:"none"}` | `src/core/state/completion.ts:188` | `overlayGate` completion branch |
| Side panel `j`/`k` clamp; `<CR>` goes to the row | `src/core/state/side-panel.ts:214-246` | Wheel and click reuse via `feedKeys` / `sidePanelKey` |
| Window focus is `windows.active`; side focus `panels.side.focused`; explorer focus `panels.explorer.focused` | `src/core/state/commands.ts:291-302`; `src/core/state/types.ts:134-168` | `focusTarget` / `withFocus` set these fields |
| Reducer tests over `fresh()` / `openBuffer` with `testRegistries()` | `test/support/state.ts:61,126,132` | `src/core/state/mouse.test.ts` |
| Component tests over `mountShell` (OpenTUI test renderer, recorded effects, fixed clock) | `test/support/ui.ts:63-170` | `test/ui/mouse.test.ts` with `mouse: t.mockMouse` |
| PTY tests run source via Bun with `[process.execPath, MAIN, path]`; `screen.mouse` mode | `test/e2e/quit.test.ts:16,26`; `test/e2e/pty.ts:83,179` | `test/e2e/mouse.test.ts` |

### Code Surfaces

| Path | Current symbol or wiring | Intended change | Evidence |
|---|---|---|---|
| `src/core/state/types.ts` | `MouseEvent = {kind:"scroll"; delta}`; `{type:"mouse"; event}` | Press/drag/wheel union, `MouseTarget`, `WindowSpot`, `now` on action | `src/core/state/types.ts:288,365` |
| `src/core/state/update.ts` | `case "mouse": return onMouse(state, action.event)`; local `onMouse` | Call imported `onMouse(state, action, reg)`; delete local | `src/core/state/update.ts:154-155,238-258` |
| `src/core/state/mouse.ts` | New | Gesture reducer | design §7 |
| `src/core/state/base-commands.ts` | private `focusCell`, `focusCard`, `switchView`, `openFocused`, `active` | Exported wrappers taking `CommandContext` | `src/core/state/base-commands.ts:38,70,90,250,315` |
| `src/core/state/picker.ts` | private `select` | Export `selectPickerItem(s, index)` | `src/core/state/picker.ts:639` |
| `src/core/state/calendar.ts` | private `show(s, cal, selected)` | Export a thin day-select wrapper (gap 2) | `src/core/state/calendar.ts:43,79-114` |
| `src/core/kernel/view/types.ts` | `Span = {text; style; link?}` | `+ col?`, `inserted?` | `src/core/kernel/view/types.ts:7` |
| `src/core/kernel/view/text-view.ts` | `spansOf` | Set `col` / `inserted` | `src/core/kernel/view/text-view.ts:88,126` |
| `src/core/kernel/view/hit.ts` | New | `rowAt`, `sourceColAt`, `ScreenRow` | design §7 |
| `src/core/config/schema.ts` | `ConfigSchema` strict object | `mouse: z.boolean().default(true)` | `src/core/config/schema.ts:46-65` |
| `src/ui/mouse.ts` | New | `MouseLayer`, `createMouseRouter`, `MouseSource`, `CLICK_MS` | design §7 |
| `src/ui/shell.ts` | `RENDERER_OPTIONS.useMouse: true`; `View`; `createShell().attach(store)` builds views inline | `useMouse: false`; `View` + `targetAt?`/`dragAt?`; hoist `Statusline` and `Bufferline` to variables; build router + layer; `paint` syncs `useMouse` | `src/ui/shell.ts:32-40,94-97,116-178` |
| `src/ui/editors/text-view.ts` | `onMouseScroll` in constructor; `show` keeps geometry; `gutterWidth`, `wrapLine` | Remove handler; add `targetAt`, `dragAt` | `src/ui/editors/text-view.ts:37-41,267-301,332-354` |
| `src/ui/editors/registry.ts` | `WindowView = Renderable & {show; cursor}` | `+ targetAt`, `dragAt?` | `src/ui/editors/registry.ts:11-14` |
| `src/ui/editors/base-view.ts` | `frame` from `show`; header painted in `renderSelf` | Keep tab ranges; `targetAt` | `src/ui/editors/base-view.ts:44-49,137,183` |
| `src/ui/views/window-tree.ts` | `rects` local to `update`; full-screen renderable | Keep `rects`; `targetAt` / `dragAt` delegate | `src/ui/views/window-tree.ts:50-90` |
| `src/ui/views/bufferline.ts` | tab ranges and `‹ ›` computed in `renderSelf` | Keep ranges; `targetAt` | `src/ui/views/bufferline.ts:33-66` |
| `src/ui/views/{explorer,side-panel,statusline,cmdline}.ts` | no mouse | `targetAt` | context §4 table |
| `src/ui/overlays/host.ts` | full screen `zIndex: 50`, child views | `targetAt` with outside rule | `src/ui/overlays/host.ts:72-99` |
| `src/ui/overlays/picker.ts` | list `first` derived in `paintList` | Keep `first`/box; `itemAt` | `src/ui/overlays/picker.ts:202-215` |
| `src/ui/overlays/calendar.ts` | `centered` + `cellOf` | `itemAt` (inverse of `cellOf`) | `src/ui/overlays/calendar.ts:50-66` |
| `src/ui/overlays/completion.ts` | `first` computed in paint | Keep `first`/box; `itemAt` | `src/ui/overlays/completion.ts:33,95-102` |
| `test/support/ui.ts` | `mountShell` returns `t`, no mouse helper | `+ mouse: t.mockMouse` | `test/support/ui.ts:71-75,121-170` |

### Verification Surfaces

| Suite or check | Location or command | Required verification |
|---|---|---|
| Kernel hit unit | `bun test src/core/kernel/view/hit.test.ts` | V8, V9, V10 |
| Core mouse reducer unit | `bun test src/core/state/mouse.test.ts` | V1, V4–V7, V11, V12, V14, V15, V17, V19, V24 |
| Config schema unit | `bun test src/core/config/schema.test.ts` | V27 |
| Router unit | `bun test src/ui/mouse.test.ts` | V2, V3, V13, V22 |
| Component (OpenTUI mock mouse) | `bun test test/ui/mouse.test.ts` | V16, V18, V20, V21, V23 |
| PTY e2e | `bun test test/e2e/mouse.test.ts` | V25, V26 |
| Exit restore | `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts` | V28: `screen.mouse` `"none"` after `:q`, `SIGTERM`, crash |
| Fast gate | `bun run check` | V30 exit 0 (biome, tsc, knip, unit suites); V29 type contract |
| Full suites | `bun run test:ci` | Component, integration, PTY green |
| Obsolete reference | `rg 'kind: "scroll"|onMouseScroll' src` | V31 no matches |
| Work-ID scan | `rg -n 'W261005H4XZ|REQ[0-9]|DES[0-9]|\bV[0-9]+\b' src test` on changed files | No work-process IDs in code |
| Benchmarks | `bun run bench` (Linux CI) | Report only; non-blocking |
| CI | PR #8 checks | `check` and `test` jobs green on the pushed head |

## 6. Additional Inspections

| Planning question | Files inspected | Finding |
|---|---|---|
| Where does shell wiring go? Design says `createShell.start` | `src/ui/shell.ts:100-178` | The method is `attach(store)`; views are built there and `Statusline`/`Bufferline` are constructed inline in the `views` array. Router and layer go in `attach` after `views`; hoist both to variables to pass as sources |
| Does `paint` have the state and renderer needed for `useMouse` sync? | `src/ui/shell.ts:153-164` | Yes: `paint(s)` runs on every store change and once at attach |
| Can calendar-day clicks reuse `calendarKey`? | `src/core/state/calendar.ts:43,79-114` | `<CR>` opens `cal.selected`, but setting the day uses private `show`; the design tree lists no `calendar.ts` change |
| Do list keys clamp as REQ2 requires? | `src/core/state/{picker,side-panel,explorer,completion}.ts` | Picker `select`, side panel, and explorer `moveCursor` clamp; completion `<Down>`/`<Up>` wrap modulo `n` |
| How does completion close without leaving Insert? | `src/core/state/completion.ts:182-188` | Existing pattern sets `overlay: {kind:"none"}`; `<Esc>` would also leave Insert |
| How do PTY tests start `so` and set config? | `test/e2e/pty.ts:56-125`; `test/e2e/quit.test.ts:16,26` | They run `[process.execPath, src/app/main.ts, path]` (not a built binary); `PtyOptions.env` can set `XDG_CONFIG_HOME` to a temp folder holding `so/config.toml` |
| Do the reused symbols exist at cited lines? | `buffers.ts:127,301`; `explorer.ts:267,292`; `keys.ts:48`; `commands.ts:86`; `link-commands.ts:167`; `picker.ts:639,655`; `base-commands.ts:70,90,250,315`; `completion.ts:230` | Yes, all present |
| Is the delivery PR open? | `gh pr view 8` | PR #8 is `OPEN` on `feat/rm261003abzp-di4-daily-notes-and-bases`; working tree clean at `515139c` |

## 7. Planning Gaps

| Gap | Classification | Evidence or blocker |
|---|---|---|
| Design names the shell entry `createShell.start`; actual is `attach(store)`, with `Statusline` and `Bufferline` built inline | `Resolved from project evidence` | `src/ui/shell.ts:116-149`. Wire router and `MouseLayer` in `attach`; hoist the two views to variables; source order per design §7 |
| Calendar day click needs private `show`; `src/core/state/calendar.ts` is missing from the design tree | `Resolved from project evidence` | `src/core/state/calendar.ts:43`. Add `src/core/state/calendar.ts` [M] with one thin exported wrapper (e.g. `selectCalendarDay(s, date)` calling `show`), the same pattern as `selectPickerItem`; then `calendarKey(<CR>)`. No behavior change for keys |
| Completion `<Down>`/`<Up>` wrap, but REQ2@R2 requires clamping at the first and last item | `Resolved from project evidence` | `src/core/state/completion.ts:239-256`. For completion, `wheel` feeds at most the steps remaining toward the list end (`min(3, n − 1 − selected)` down, `min(3, selected)` up). The result is still the state of that many `<Down>`/`<Up>` keys, so REQ1 holds and REQ2 clamps. Cover with a V1 table row |
| Completion click: no exported index setter; body-press close must keep Insert | `Resolved from project evidence` | `CompletionState.selected` is plain state; `pressChrome` sets `selected = index` then `completionKey(<CR>)`. `overlayGate` closes with `overlay: {kind:"none"}` (`completion.ts:188`), not `<Esc>` |
| Design V25/V26 say "built `so`"; existing PTY suites run source | `Resolved from project evidence` | `test/e2e/quit.test.ts:16,26`. Use `[process.execPath, MAIN, path]` and `env.XDG_CONFIG_HOME` for `mouse = false` |
| New exports must have consumers for knip | `Resolved from project evidence` | `knip.json` / `typescript.md`. Each new export is consumed by `src/core/state/mouse.ts`; `hit.ts` exports by `text-view.ts` |

## 8. Planning Handoff

- **Scope:** Implement DES1–DES6 for REQ1@R1, REQ2@R2, REQ3@R1–REQ9@R1 with verification V1–V31, plus the resolved gaps in Section 7; then deliver through PR #8 per `.s1mple/S1MPLE.md` Delivery.
- **Primary boundaries:** `src/core/state` (contract, reducer, exports), `src/core/kernel/view` (span columns, hit mapping), `src/core/config` (schema), `src/ui` (router, layer, shell wiring, every view's `targetAt`), `test/support`, `test/ui`, `test/e2e`.
- **Likely sequence:**
  ```text
  contract types + config schema
    → kernel span columns + hit.ts
    → core exports (Bases, picker, calendar) → core mouse reducer + update wiring
    → UI router + MouseLayer + shell wiring (remove onMouseScroll)
    → editor/window/Bases targets → chrome targets → overlay targets
    → component tests (mountShell mouse) → PTY tests → full checks → delivery
  ```
  Old `onMouseScroll` / `{kind:"scroll"}` must be removed in the same group that changes the contract or `tsc` fails.
- **Verification focus:** Keyboard equivalence (V1); wheel-under-pointer without focus leaks (V4–V6, V20); concealed/wrapped column mapping (V8–V10, V21); Insert undo split (V11); drag anchor and dedupe (V12, V22); prompt/conflict immunity (V19); overlay outside rule (V24); terminal modes and restore (V25, V26, V28); `bun run check` and `bun run test:ci` green; PR #8 CI green.
- **Excluded scope:** Hover and any-motion tracking; horizontal wheel in editor windows; separator drag resize; drag-and-drop of files, cards, or tabs; right-click menus and middle-click paste; pointer shape (OSC 22); the browser preview page; parent roadmap document changes; releases or tags.
- **Blocking items:** None
