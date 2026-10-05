# P2-G1 Verification Report

## Scope

- **Group:** `P2-G1`
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p2-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261005h4xz-tui-mouse-support/reports/p2-g1-implementation-report.md`

## Status

`Failed`

All assigned chains are implemented, and every assigned `V` case and group check passes. One finding stays open: nothing tests the `edge` value that `EditorView.dragAt` sets (P2-G1-VER1). Without it, the S7 edge-scroll through real view geometry is not proven. The verifier rules allow `Passed` only when no finding is open, so the status is `Failed`. The behavior itself works: a one-off probe (below) showed the correct result.

## Assigned Traceability

- **System Design:** `REQ1@R1, REQ9@R1 → DES2 → S1, S2 → V2, V3`; `REQ5@R1 → DES2 → S7, S8 → V13, V22`; `REQ2@R2 → DES2, DES3 → S3 → V20`; `REQ4@R1 → DES3 → S5 → V21`; `REQ7@R1 → DES3 → S10 → V23`; `REQ9@R1 → DES6 → S2, S13, S14 → V25, V26, V28`; plan-context gaps 1 and 5
- **UI Design:** None

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1@R1, REQ9@R1 → DES2 → S1, S2 → V2, V3` | None | Right/middle buttons and mouse-off events never dispatch; the first source with a target wins | `src/ui/mouse.ts:createMouseRouter` — `if (!o.enabled()) return`; `down`/`drag` return on `e.button !== LEFT`; `resolve` returns the first non-`undefined` `targetAt` in `sources` order; `MouseLayer.update` hides the layer while `config.mouse` is off | `Satisfied` |
| `REQ5@R1 → DES2 → S7, S8 → V13, V22` | None | Click count cycles 1→2→3→1 within 500 ms on the same cell; drags stay with the origin source and dedupe | `src/ui/mouse.ts` — `CLICK_MS = 500`, `now - last.at <= CLICK_MS` on equal `x`/`y`, `(last.clicks % 3) + 1`; `drag` only with a window-text `origin`, `origin.source.dragAt`, `JSON.stringify` dedupe against `lastDrag`; `up`/`drag-end`/`down` clear `origin` and `lastDrag`. `src/ui/views/window-tree.ts:WindowTree.dragAt` delegates to `from.window`'s view; `src/ui/editors/text-view.ts:EditorView.dragAt` clamps into the text rows and columns and sets `edge` | `Satisfied` (edge test gap: P2-G1-VER1) |
| `REQ2@R2 → DES2, DES3 → S3 → V20` | None | Wheel over the right split scrolls it; active window unchanged | `src/ui/mouse.ts` `scroll` → `WHEEL[direction]` → `wheel` dispatch for the target under the pointer; `WindowTree.targetAt` reads `rects` kept from `update` | `Satisfied` |
| `REQ4@R1 → DES3 → S5 → V21` | None | Clicks on wrapped continuation rows and the gutter land on the right source column | `EditorView.textAt` — `rowAt(this.lines, row, {width: rect.w − gw, tabWidth, wrap, skipRows})` + `sourceColAt(spans, startCol + leftCol + x − textX, tabWidth, b.text.line(line).length)`; gutter (`x < textX`) and widget rows → col 0; rows below the text → last laid-out line; line clamped to `lineCount − 1`, col clamped to line length. Width and gutter match `renderSelf` (`textW = width − gutterWidth`) | `Satisfied` |
| `REQ7@R1 → DES3 → S10 → V23` | None | Bases view-tab click switches the view; table-cell click focuses that cell | `src/ui/editors/base-view.ts:BaseView.targetAt` — toolbar row → `baseTab` from `tabs` recorded in `paintToolbar` (called from `renderSelf`, as design §7 specifies); `cellAt` uses the `TableLayout` kept in `show` (`body.y + 2` and `cols[].x` match `paintBaseTable`); `cardAt` uses `BoardLayout` `lanes`, `laneW`, `cardRows`, `shown` (`body.y + 1 + k × cardRows` matches `paintBaseBoard`); other cells → `base`; no `dragAt` | `Satisfied` |
| `REQ9@R1 → DES6 → S2, S13, S14 → V25, V26, V28` | None | Terminal mode `"none"` with `mouse = false`, `"drag"` by default with SGR clicks moving the cursor, `"none"` after every exit | `src/ui/shell.ts` — `RENDERER_OPTIONS.useMouse: false`; `paint` sets `renderer.useMouse` when it differs from `s.config.mouse`, then `layer.update(s)`; exit restore stays in `renderer.destroy()`. `src/app/main.ts:335-344` dispatches the startup config before `shell.attach`, so `mouse = false` never enables tracking for a frame | `Satisfied` |
| Plan-context gap 1 | None | Router and layer wired in `attach(store)`; `Statusline` and `Bufferline` hoisted | `src/ui/shell.ts:createShell().attach` — `bufferline`/`statusline` consts; `createMouseRouter({sources: [windows], enabled: () => store.get().config.mouse, dispatch, now: deps.now})`; `renderer.root.add(layer)` after the views, `zIndex: 1000`. Full source order is `P2-G2` scope | `Satisfied` |
| Plan-context gap 5 | None | PTY runs source via Bun with `XDG_CONFIG_HOME` | `test/e2e/mouse.test.ts` — `[process.execPath, MAIN, path]`, `env: { XDG_CONFIG_HOME }` with `so/config.toml` | `Satisfied` |

Every recorded deviation is acceptable against the design and requirements:

1. **T3 stub of `BaseView.targetAt`.** `WindowView.targetAt` is required, so the stub kept `tsc` green until T4 replaced it.
2. **Narrowed `PointerEvent` type, and `button === 0` on drag.** OpenTUI's SGR decoder reports a left drag as `button & 3 = 0` (`node_modules/@opentui/core/chunk-bun-sjw2d9bq.js:decodeSgrEvent`), so a real left drag is not dropped.
3. **The condensed narrow toolbar label is not a tab.** Individual tabs are not painted in that layout. REQ7 covers clicks on painted view tabs, so a click on the label only focuses.
4. **Hit-grid repaint between drags in component tests.** This is a test-renderer artifact; the live renderer repaints after `up`.
5. **Trailing-newline line count.** A file's trailing newline is a flag, not an extra line.
6. **Mouse-off PTY bytes are dropped.** A stray `M` key would have moved the cursor away from `1:2`, so the passing assertion proves no keys leaked.

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V2`, `V3`, `V13`, `V22` | `S1`, `S2`, `S7`, `S8` | `DES2` | `bun test src/ui/mouse.test.ts` | 6 pass, 0 fail, 18 expect() calls | `Passed` |
| `V20`, `V21`, `V23` (plus mode sync and drag) | `S3`, `S5`, `S10`, `S13` | `DES2`, `DES3`, `DES6` | `bun test test/ui/mouse.test.ts` | 5 pass, 0 fail, 30 expect() calls | `Passed` |
| `V25`, `V26` | `S2`, `S13` | `DES6` | `bun test test/e2e/mouse.test.ts` | 2 pass, 0 fail, 7 expect() calls | `Passed` |
| `V28` | `S14` | `DES6` | `bun test test/e2e/quit.test.ts test/e2e/restore.test.ts`; `git diff --stat 184d3bc..HEAD -- test/e2e/quit.test.ts test/e2e/restore.test.ts` | 10 pass, 0 fail, 48 expect() calls; diff empty (assertions unchanged) | `Passed` |
| Fast gate (`V30`) | `S1` | None | `bun run check` | exit 0; biome 313 files clean, tsc clean, knip clean, 1050 pass, 0 fail | `Passed` |
| Full suites | None | None | `bun run test:ci` | exit 0; 198 pass, 0 fail, 58 snapshots | `Passed` |
| Work-ID scan | None | None | `git diff --name-only 184d3bc..18f9966 \| xargs rg -n 'W261005H4XZ\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P2-G1'` | no matches (exit 1) | `Passed` |
| Core boundary | None | `DES1` | `rg -n '@opentui' src/core` | no matches (exit 1) | `Passed` |
| Obsolete reference (`V31`) | `S1` | None | `rg 'kind: "scroll"\|onMouseScroll' src` | no matches (exit 1) | `Passed` |
| Process cleanup | None | None | `pgrep -fl 'src/app/main.ts\|bun run dev'` before and after every run | no processes (exit 1) each time | `Passed` |
| Geometry from kept layout | `S5`, `S10` | `DES3` | Inspection of `EditorView.targetAt`/`dragAt`/`textAt`, `WindowTree.targetAt`, `BaseView.targetAt` | All read `rect`, `winbar`, `leftCol`, `skipRows`, `lines`, `topLine`, `rects`, `frame.table`/`frame.board`, `tabs`; none read OpenTUI layout getters | `Passed` |
| `EditorView.dragAt` edge through real geometry | `S7` | `DES3` | One-off probe in `test/ui` (deleted afterwards): 60-line buffer, drag from line 2 to the cmdline row | `visual`, anchor `{1,0}`, cursor `{9,2}`: one line past the last visible line (index 8), so `edge = 1` reaches the core. No committed test asserts this | `Insufficient` (P2-G1-VER1) |
| At most one dispatch per event | `S7` | `DES2` | Inspection of `handle` | each `switch` branch calls `send` at most once, then returns | `Passed` |

## Findings

### P2-G1-VER1 — Minor — Test Coverage — `EditorView.dragAt` edge is not asserted by any test

- **System Design:** `REQ5@R1`, `DES3`, `S7`, `V22`
- **UI Design:** None
- **Evidence:** P2-G1-T3 requires `EditorView.dragAt` to set `edge` −1/+1 when the pointer is above or below the text rows (`src/ui/editors/text-view.ts:EditorView.dragAt`, `const edge = y < top ? -1 : y > bottom ? 1 : 0`). `V22` in `src/ui/mouse.test.ts` checks the router against a fake `dragAt`. The only real-geometry drag in `test/ui/mouse.test.ts` ("a drag from the text selects to the pointer and clamps at the window edge") drags upward to line 0, where `placeCursor(0 + edge)` with `edge = -1` clamps to line 0. The result `{ line: 0, col: 1 }` would be identical if `edge` were always 0. No test drags below the window. The probe described above confirms the behavior is correct today.
- **Impact:** A regression that drops or inverts the view's `edge` (for example, `edge` always 0) would pass every suite. Edge-scrolling while dragging (S7: "extending and edge-scrolling") would then break without a failing test.
- **Required resolution:** Add a component case in `test/ui/mouse.test.ts`. Drag in a buffer longer than the window, starting on a text row and ending below the text rows (statusline or cmdline row). Assert Visual mode and a cursor line one past the last visible line. Optionally, assert the upward case where the top visible line is not line 0.
- **Required proof:** `bun test test/ui/mouse.test.ts` passes with the new case. Temporarily forcing `edge` to 0 in `EditorView.dragAt` makes the new case fail.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - Router filtering: right and middle buttons, `enabled()` false, hover/move/over ignored.
  - Router behavior: z-order resolution, wheel directions, click counting (inclusive 500 ms boundary, wrap after 3, another cell resets), drag capture outside the origin, dedupe, `up`/`drag-end` clearing, no drag after a non-text or unresolved press.
  - Component, over the real renderer and store: `useMouse` sync at mount and on config reload, mouse-off clicks inert, wheel over the right split, click-to-focus and cursor in a split, winbar press, wrapped continuation row with a concealed link, gutter, below the text, drag to Visual with an upward clamp, Bases tab switch both ways, table cell focus plus hardware cursor, separator inert, board card focus.
  - PTY: `"none"` with `mouse = false` (bytes dropped, no stray keys), `"drag"` by default with an SGR click moving the cursor, `"none"` after `:q`, SIGTERM, and crash.
- **Missing:** The `EditorView.dragAt` `edge` value through real view geometry (P2-G1-VER1). Required assertion: a drag ending below the text rows puts the cursor one line past the last visible line.

## Scope Changes

None. The six recorded deviations are implementation detail within the design and are evaluated under Specification Verification. Chrome and overlay sources and the full source order are `P2-G2` scope, as planned.

## Unverified Items

None

## Blockers

None
