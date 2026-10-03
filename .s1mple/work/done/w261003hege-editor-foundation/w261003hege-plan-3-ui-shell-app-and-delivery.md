# W261003HEGE Plan Part 3 — UI Shell, App, and Delivery

## Status

`Ready`

## Objective

Make `so` a running editor: the OpenTUI shell renders the accepted parent UI for DI1 states, the key normalizer gives Neovim-equal Esc timing, `main` wires every registry, adapter, store, and shell, and the lifecycle coordinator flushes then restores the terminal on every exit path. Then prove the whole work locally (PTY e2e, bench gate, `check` < 30 s, zero `knip` findings) and, with explicit user authorization, on GitHub (PR CI on both platforms, `v0.1.0-rc.1` native smoke), and hand the G1 evidence to DI2.

## Coverage Summary

- **System Design:** `W261003HEGE-REQ1@R3, REQ2@R2, REQ4@R3, REQ5@R1, REQ7@R2, REQ8@R2, REQ10@R2, REQ11@R2, REQ12@R1 → DES1 (V1.3), DES2 (main wiring), DES4 (lifecycle flush), DES6 (bench), DES7 (paint), DES9, DES10 (OSC 52 wiring), DES11 (V11.4), DES13 (explorer view), DES14 (PTY, bench), DES15 (VERSION, rc) → S1, S4, S8, S9, S10, S11, S14, S15, S16, S17 → V1.3, V4.5, V8.1, V8.2, V8.3, V9.1, V9.2, V9.3, V11.4, V14.1, V14.2, V14.3, V14.4, V15.2, V15.3, V16.1, V17.1`
- **UI Design:** `RM261003ABZP-UREQ1@R2, UREQ2@R1, UREQ7@R2, UREQ11@R1 → RM261003ABZP-UDES1@R2, UDES2@R1, UDES7@R2, UDES11@R1 (UDES3@R2 non-Markdown editor window as composition source) → RM261003ABZP-US1@R2, US5@R2, US9@R1 → RM261003ABZP-UV1@R2 (DI1 states), UV2@R1, UV6@R2, UV10@R1 (DI1 states), verified through W S14 → V14.1–V14.4`

## Sources

- Plan index: `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-plan-index.md`
- Plan context: `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-plan-context.md`
- System design: `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-system-design.md`
- UI design: `Not applicable at work level — parent .s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-ui-design.md (Ready for Planning): Composition Model (lines 404–421), Surface: Application shell (line 429), Surface: File operations and disk changes (line 791); accepted mockups M1@R1, M4@R1, AD4 only (draft M1@R2/M3@R2 are not in the binding)`
- System requirements: `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md`
- UI requirements: `Not applicable — parent UREQs bound through W261003HEGE-REQ1@R3`
- Research: `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-research.md`
- Roadmap binding: `w261003hege-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH1@R2, RM261003ABZP-DI1@R2)

## Dependencies

- Part 1: toolchain, `ci.yml`, release workflows (smoke expects `so --version` = `so <version>`), kernel contracts, `layoutText`, `highlightMarks`, file types.
- Part 2: protocol and store, `statusSegments`, `pendingWrites`, `registerBuiltins`, `createEffectRunner` (`run`, `flush`, late-bound `exit`), `createOwnOps`, `watchWorkspace`, `createExclusionMatcher`, `detectTrash`, `detectClipboard`, fixtures and `generate.ts`.

## Execution Rules for Every Group

- Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required references (`.s1mple/docs/communication.md`, `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md`) before acting.
- Subagents do not spawn subagents. Do not use the native `Explore` subagent; inspect directly or use `s1mple-explore`.
- Implementation is lean and simple; only `src/ui/**` imports `@opentui/*`; no later-DI UI files (`src/ui/widgets/`, `base-view.ts`, `side-panel.ts`, picker, which-key, calendar, completion overlays).
- Visuals come from the parent UI design and its accepted mockups; do not restate or redesign them. If a golden cannot match the accepted design, stop and report.
- **Delivery is not established in S1MPLE:** pushing the branch, opening the PR, pushing `v0.1.0-rc.1`, and any action that publishes to GitHub require explicit user authorization in this execution, asked at P3-G1-T7. Never claim parent roadmap updates; parent synchronization stays pending.

## Execution Flow

```text
P3-G1: UI shell, composition root, lifecycle, and delivery verification
```

## Groups

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command; do not request separate permission. Commit each task after its checks and self-review pass and before starting the next task. Follow the repository's Conventional Commits convention with task IDs and exact plan titles in the body. Task commits are checkpoints, not group acceptance. Record no-change evidence instead of an empty commit. Pushing, PR creation, and tagging are not covered by planned commits and need the authorization in P3-G1-T7.

### P3-G1 — UI Shell, Composition Root, Lifecycle, and Delivery Verification

#### Goal

`bun src/app/main.ts [path]` opens the workspace with the accepted DI1 UI, edits with Neovim-equal keys and Esc timing, and restores the terminal on `:q`, SIGTERM, SIGINT, and uncaught exceptions after a bounded flush. Component goldens, PTY e2e, and the bench gate pass locally; `bun run check` passes in < 30 s with zero `knip` findings; and, once authorized, the DI1 PR's CI and the `v0.1.0-rc.1` release dry run pass with evidence recorded in the PR.

#### Coverage Summary

- **System Design:** `REQ1@R3, REQ2@R2, REQ4@R3, REQ5@R1, REQ7@R2, REQ8@R2, REQ10@R2, REQ11@R2, REQ12@R1 → DES1, DES2, DES4, DES6, DES7, DES9, DES10, DES11, DES13, DES14, DES15 → S1, S4, S8, S9, S10, S11, S14, S15, S16, S17 → V1.3, V4.5, V8.1–V8.3, V9.1–V9.3, V11.4, V14.1–V14.4, V15.2, V15.3, V16.1, V17.1`
- **UI Design:** `UREQ1@R2, UREQ2@R1, UREQ7@R2, UREQ11@R1 → UDES1@R2, UDES2@R1, UDES7@R2, UDES11@R1 → US1@R2, US5@R2, US9@R1 → UV1@R2 (DI1 states), UV2@R1, UV6@R2, UV10@R1 (DI1 states)`

#### Scope

- Included: `src/ui/{shell,input,theme}.ts`, `src/ui/editors/{registry,text-view}.ts`, `src/ui/views/{bufferline,explorer,statusline,cmdline,window-tree}.ts`, `src/ui/overlays/{host,prompt,conflict,notify}.ts`, `src/app/{main,lifecycle}.ts`, `src/ui/input.test.ts`, `test/ui/{shell.golden,cmdline,file-ops,esc}.test.ts` + `__snapshots__/`, `test/e2e/{pty.ts,restore.test.ts,quit.test.ts}`, `test/bench/{source-keystroke,open-file}.bench.ts`, `scripts/bench-gate.ts`, delivery verification.
- Excluded: DI2+ features and files; config-file loading; `SO_LOG`; real `v0.1.0` release; merging the PR (user decision after review); parent roadmap writes.
- Main files: system design §4 lines 284–303 and 379–424.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1@R3 → DES9 → S9 → V9.1, V9.2, V9.3` | `UREQ2@R1 → UDES2@R1 → US1@R2 → UV2@R1` (mode feedback timing) | Effective Esc timeout `max(escTimeoutMs, 20)`; sequences immediate |
| `REQ1@R3 → DES9, DES7 → S14 → V14.1, V14.3` | `UREQ1@R2, UREQ11@R1 → UDES1@R2, UDES11@R1 → US1@R2, US9@R1 → UV1@R2, UV10@R1` (DI1 states) | Shell regions, statusline, toasts, themes, nocolor goldens |
| `REQ1@R3 → DES9, DES2 → S14 → V14.2` | `UREQ2@R1 → UDES2@R1 → US1@R2 → UV2@R1` | Mode badges, cursor style, E492, completion order |
| `REQ1@R3, REQ10@R2 → DES9, DES13 → S14, S13 → V14.4` | `UREQ7@R2 → UDES7@R2 → US5@R2 → UV6@R2` | Prompts, typed confirm, conflict and diff, reload notice, refusals |
| `REQ1@R3, REQ4@R3, REQ5@R1 → DES9, DES14 → S8, S4 → V8.1, V8.2, V8.3, V4.5` | `UREQ11@R1 → UDES11@R1 → US9@R1 → UV10@R1` (NO_COLOR) | Restore on every exit path; no colour SGR under NO_COLOR; Ctrl-C does not exit; bounded signal flush |
| `REQ1@R3, REQ4@R3 → DES14, DES7 → S17, S15 → V17.1, V15.3` | None | Bench medians within 2× targets; gate wired on Linux CI |
| `REQ2@R2, REQ4@R3 → DES1, DES14 → S1, S15 → V1.3, V15.2` | None | `check` < 30 s; PR CI green on both OS < 3 min |
| `REQ12@R1 → DES15 → S16 → V16.1` | None | rc tag yields four smoked binaries + `SHA256SUMS`, prerelease |
| `REQ8@R2 → DES11 → S11 → V11.4` | None | macOS trash without prompt via the detected path |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G1 — `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73` (plan context section 2); producer RM261003ABZP-DI1@R2 (W261003HEGE), consumer RM261003ABZP-DI2@R2; required before DI2 execution | P3-G1-T6 assembles the G1 output and evidence list; P3-G1-T7 records CI evidence on the PR; the gate itself is satisfied only after the DI1 PR is merged to `main` with CI green, which is outside this plan's execution scope | DI1 PR merged to `main` with CI green; parent V1@R1 ↔ W V3.1–V3.4, V2@R1 ↔ V2.1, V15@R2 ↔ V7.1–V7.2, V17@R1 ↔ V8.1–V8.2, V18@R1 ↔ V6.1–V6.5 passing; G1 outputs present at parent shapes (shell with `editorViews`, `OverlayHost`, `Prompt`; bench harness) | RM261003ABZP-DI2@R2 |

The G1 gate is not due within this plan. Report it as `Pending — awaiting DI1 PR merge` with the evidence list; do not infer roadmap delivery from work completion.

#### Tasks

##### P3-G1-T1 — Add theme and Esc-holding key normalizer

- **Outcome:** `theme.ts` (`Theme`, `themes` dark/light/nocolor, `resolveTheme`) and `input.ts` (`createKeyNormalizer`, `KeyNormalizer`, `toKey`, `OPENTUI_ESC_MS = 20`) hold a raw Esc for `escTimeoutMs − 20` ms, pass kitty Esc and sequences immediately, flush the held Esc before the next key, and split legacy `meta+printable` into Esc + key.
- **System Design:** `W261003HEGE-REQ1@R3` → `W261003HEGE-DES9` → `S9` → `V9.1, V9.2`
- **UI Design:** `RM261003ABZP-UREQ2@R1, UREQ11@R1` → `RM261003ABZP-UDES2@R1, UDES11@R1` → `RM261003ABZP-US1@R2, US9@R1` → `RM261003ABZP-UV2@R1, UV10@R1` (theme tokens used by goldens in T2)
- **Canonical Shapes:** System design §7 `src/ui/shell.ts`, `input.ts`, … (lines 2327–2385; normalizer at 2356–2369); parent UI design Component: Theme
- **Files:** `src/ui/input.ts`, `src/ui/input.test.ts`, `src/ui/theme.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V9.1`, `V9.2`:** `src/ui/input.test.ts` with fake timer and clock

   **Preview:**

   ```ts
   test("V9.1 Esc hold", () => {
     // raw escape at t=20, escTimeoutMs 50 → emit escape at t=50; escTimeoutMs 10 → immediate; kitty escape → immediate
   });
   test("V9.2 merges and sequences", () => {
     // raw escape then "j" at t+5 → [escape, j]; raw meta+"j" → [escape, j]; "up" → [up] immediately
   });
   ```

   - Confirm failure.

2. **GREEN:** `input.ts`, `theme.ts`

   **Preview:**

   ```ts
   // createKeyNormalizer: §7 lines 2357–2368 (timer/clear injected for tests)
   // theme.ts: dark, light, nocolor; nocolor uses only RGBA.defaultForeground()/defaultBackground() plus attributes
   ```

   - Only `src/ui` imports `@opentui/*`.

3. **REFACTOR:** Keep `toKey` a pure mapping table.

   **Preview:**

   ```ts
   // allowed: lookup table for names; prohibited: Alt bindings (DI1 has none)
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): add themes and Esc-holding key normalizer

   Task: P3-G1-T1 — Add theme and Esc-holding key normalizer
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V9.1`, `V9.2` — `bun test src/ui/input.test.ts` → pass.

##### P3-G1-T2 — Compose the shell, editor view, views, and toasts

- **Outcome:** `createRenderer` with `RENDERER_OPTIONS`, `createShell(renderer, deps)` (`attach(store)`, `copyOsc52`, `destroy`, `layoutClass`), `editorViews`/`registerEditorView`/`EditorView` (paints `layoutText` rows, focused window sets cursor, block/line style, nocolor never `fillRect`, render errors paint raw lines), `Bufferline`, `ExplorerView`, `Statusline` (from `statusSegments`), `CommandLine`, `WindowTree`, `OverlayHost`, `ToastStack` render the DI1 states of the accepted UI.
- **System Design:** `W261003HEGE-REQ1@R3` → `W261003HEGE-DES9, DES7, DES13` → `S9, S14` → `V9.3, V14.1, V14.2, V14.3`
- **UI Design:** `RM261003ABZP-UREQ1@R2, UREQ2@R1, UREQ11@R1` → `RM261003ABZP-UDES1@R2, UDES2@R1, UDES11@R1` (+ `UDES3@R2` non-Markdown editor window) → `RM261003ABZP-US1@R2, US9@R1` → `RM261003ABZP-UV1@R2` (DI1 states), `UV2@R1`, `UV10@R1` (DI1 states)
- **Canonical Shapes:** System design §7 `src/ui/**` (lines 2327–2385); parent `rm261003abzp-design.md:776-789` (`EditorView`); parent UI design Composition Model (lines 404–421), Surface: Application shell (line 429 ff.), components Statusline, Command line, Toast stack, Theme
- **Files:** `src/ui/shell.ts`, `src/ui/editors/{registry,text-view}.ts`, `src/ui/views/{bufferline,explorer,statusline,cmdline,window-tree}.ts`, `src/ui/overlays/{host,notify}.ts`, `test/ui/{shell.golden,cmdline,esc}.test.ts`, `test/ui/__snapshots__/`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V9.3`, `V14.1`, `V14.2`, `V14.3`:** component tests on the OpenTUI test renderer (shared per file, fixed clock, runner stub)

   **Preview:**

   ```ts
   // test/ui/esc.test.ts V9.3: write "\x1b" raw (legacy) → escape dispatched at 50 ± 10 ms; "\x1b[A" → up < 10 ms
   // test/ui/shell.golden.test.ts V14.1 (120×36 and 80×24): startup; explorer hidden; :vs; save-failed; info and error toasts;
   //   scripts/sync.ts active → statusline "MODE │ source │ scripts/sync.ts │ Ln:Col"; info toast gone after 3 s, error present after 10 s
   //   V14.3: dark/light/nocolor spans for Normal/Insert badge, visual selection, cursorline, dirty buffer, error toast;
   //   nocolor → only default fg/bg plus attributes
   // test/ui/cmdline.test.ts V14.2: i, type, Esc; v j; V; :foo Enter; : vs Tab →
   //   INSERT→NORMAL→VISUAL→V-LINE→COMMAND; cursor "line" in Insert then "block"; "E492: Not an editor command: foo"; vsplit first
   ```

   - Goldens are generated once from the accepted mockups' DI1 states, reviewed against M1@R1/AD4, and committed; confirm failure before implementation.

2. **GREEN:** shell, editor view, views, host, toasts

   **Preview:**

   ```ts
   export const RENDERER_OPTIONS = { exitOnCtrlC: false, exitSignals: [], openConsoleOnError: false, useMouse: true,
     enableMouseMovement: false, screenMode: "alternate-screen", useKittyKeyboard: {} } as const;   // §7 line 2342 (RF3)
   // createShell: composition per parent UI design 404–421 restricted to DI1 regions; attach(store) subscribes and
   //   calls requestRender (coalesced); copyOsc52 → renderer.copyToClipboardOSC52; destroy restores the terminal once
   // EditorView.renderSelf: layoutText(view, [highlightMarks(ft.highlighter), searchMarks, selectionMarks]) → paintLine
   ```

   - UI never mutates `AppState`; UI never branches on file type (status `words` comes from `statusSegments`).

3. **REFACTOR:** Share painter helpers between views without new abstractions.

   **Preview:**

   ```ts
   // allowed: small paint helpers in the same files; prohibited: widget painters, side panel, picker (later DIs)
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): add OpenTUI shell, editor view, views, and toasts

   Task: P3-G1-T2 — Compose the shell, editor view, views, and toasts
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V9.3` — `bun test test/ui/esc.test.ts` → timings within bounds.
- `V14.1`, `V14.3` — `bun test test/ui/shell.golden.test.ts` → goldens equal.
- `V14.2` — `bun test test/ui/cmdline.test.ts` → pass.
- `V7.1` — `bun test test/boundaries.test.ts` → `@opentui/*` only in `src/ui`.

##### P3-G1-T3 — Add prompt and conflict overlays

- **Outcome:** `PromptView` (create, rename, move, delete with trash, typed-confirm permanent delete) and `ConflictView` (keep/take/diff with +/− diff, "autosave paused") render the UV6 flows; destructive paths require the exact typed name.
- **System Design:** `W261003HEGE-REQ1@R3, REQ10@R2, REQ8@R2` → `W261003HEGE-DES9, DES13` → `S14, S13` → `V14.4`
- **UI Design:** `RM261003ABZP-UREQ7@R2` → `RM261003ABZP-UDES7@R2` → `RM261003ABZP-US5@R2` → `RM261003ABZP-UV6@R2`
- **Canonical Shapes:** Parent UI design Surface: File operations and disk changes (line 791 ff.), Component: Prompt, Component: Conflict dialog and diff; accepted mockup M4@R1; system design §7 `src/ui/**`
- **Files:** `src/ui/overlays/{prompt,conflict}.ts`, `test/ui/file-ops.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V14.4`:** `test/ui/file-ops.test.ts` (runner stub answering `fsResult`/`fileRefused`/`trashAvailable`)

   **Preview:**

   ```ts
   // UV6 action list: a ideas/, a draft, a sync.ts, r, m, d with and without trash, conflict d q k, reload u,
   //   photo.png, :e big.log → every UV6@R2 assertion: prompt texts, typed-confirm Enter ignored until exact name,
   //   "autosave paused", +/− diff, "Kept your version — saved", reload notice, refusal texts, no write effect
   ```

   - Confirm failure.

2. **GREEN:** `prompt.ts`, `conflict.ts`

   **Preview:**

   ```ts
   // PromptView renders overlay.prompt (PromptState) and dispatches key actions only; ConflictView renders overlay.conflict
   // texts and layout from parent UI design (do not restate here); keys resolve in core/state overlayKey (P2-G1)
   ```

   - If a needed state field is missing, stop and report (no AppState additions here).

3. **REFACTOR:** Align prompt/confirm painting with `OverlayHost` conventions from T2.

   **Preview:**

   ```ts
   // allowed: shared overlay frame helper; prohibited: changing reducer behavior to fit a golden
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): add file-operation prompts and conflict overlay

   Task: P3-G1-T3 — Add prompt and conflict overlays
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V14.4` — `bun test test/ui/file-ops.test.ts` → every UV6@R2 assertion passes.

##### P3-G1-T4 — Wire the composition root, lifecycle, and PTY e2e

- **Outcome:** `main.ts` (`main`, `parseCli`, `resolveWorkspace`, `VERSION`, test-only `SO_TEST_THROW`/`SO_TEST_SLOW_WRITE` hooks gated by `SO_TEST=1`) constructs registries, renderer, shell, runner, store, lifecycle, and the post-first-frame watcher and detectors; `lifecycle.ts` (`installLifecycle`, `shutdown`, `FLUSH_BOUND_MS = 2000`) flushes then restores on every exit path; `test/e2e/pty.ts` (`runInPty`, `TerminalProbe`) proves restore and quit safety.
- **System Design:** `W261003HEGE-REQ1@R3, REQ4@R3, REQ5@R1, REQ7@R2, REQ12@R1` → `W261003HEGE-DES2, DES4, DES9, DES10, DES14, DES15` → `S4, S8` → `V8.1, V8.2, V8.3, V4.5`
- **UI Design:** `RM261003ABZP-UREQ11@R1` → `RM261003ABZP-UDES11@R1` → `RM261003ABZP-US9@R1` → `RM261003ABZP-UV10@R1` (NO_COLOR)
- **Canonical Shapes:** System design §5 Startup and first frame (lines 666–685), Signal and crash shutdown (line 760 ff.), Construction and Wiring Flow (lines 899–918); §7 `src/app/lifecycle.ts` (lines 2272–2325); §7 `test/e2e/pty.ts` (lines 2442–2452); §7 `VERSION` (line 2481); §8 Coverage Balance env hooks (line 2950)
- **Files:** `src/app/main.ts`, `src/app/lifecycle.ts`, `bin/so` (now resolves), `test/e2e/{pty.ts,restore.test.ts,quit.test.ts}`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V8.1`, `V8.2`, `V8.3`, `V4.5`:** e2e suites driving `bun src/app/main.ts` in a PTY (100×30)

   **Preview:**

   ```ts
   // restore.test.ts
   //   V8.1 exit by :q, SIGTERM, SIGINT, SO_TEST=1 SO_TEST_THROW=1 → kitty push seen; after exit buffer "normal",
   //        mouse "none", last ?25 = h, last kitty = CSI < u; exit codes 0, 0, 0, 1
   //   V8.2 NO_COLOR=1 to :q → no SGR 3x/4x/38/48 other than 39/49
   //   V8.3 "\x03" in Normal → still running after 500 ms; exits only after :q with 0
   // quit.test.ts
   //   V4.5 type then SIGTERM within 1 s → new text on disk, exit 0;
   //        SO_TEST_SLOW_WRITE=3000 then SIGTERM → exits within 2.5 s, terminal restored, stderr "so: unsaved: <path>"
   ```

   - Confirm failure (no `main.ts`).

2. **GREEN:** `main.ts`, `lifecycle.ts`, `pty.ts`

   **Preview:**

   ```ts
   // main: wiring exactly as §5 lines 902–912 (runner.exit late-bound to lifecycle.exitNow); NO_COLOR → terminal.color;
   //   parseCli via node:util parseArgs (--version prints `so ${VERSION}` and exits 0; --help; one positional);
   //   resolveWorkspace missing → stderr "so: no such file or directory: <path>", exit 2 before the renderer starts;
   //   after first render: watchWorkspace, detectTrash → trashAvailable, detectClipboard(osc52 = shell.copyOsc52)
   export const VERSION = process.env.SO_VERSION ?? pkg.version;   // define-inlined at build (§7 line 2481)
   // lifecycle: §7 lines 2297–2313; pty.ts: §7 lines 2442–2452 (answers "\x1b[?u" with "\x1b[?0u")
   ```

   - Test hooks are read only in `main.ts` and only when `SO_TEST === "1"`.

3. **REFACTOR:** Keep `main` a linear construction function.

   **Preview:**

   ```ts
   // allowed: small local helpers (registries(), bootEffects()); prohibited: DI containers or service locators
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(app): wire composition root, lifecycle, and PTY e2e

   Task: P3-G1-T4 — Wire the composition root, lifecycle, and PTY e2e
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V8.1`–`V8.3` — `bun test test/e2e/restore.test.ts` → pass.
- `V4.5` — `bun test test/e2e/quit.test.ts` → pass.
- Version — `bun run build && ./dist/so --version` → `so 0.0.0` (local); `SO_VERSION` define path proved in V16.1.

##### P3-G1-T5 — Add benchmarks and the bench gate

- **Outcome:** `test/bench/source-keystroke.bench.ts` (200 keystrokes in a 5,000-line TS file, source view) and `test/bench/open-file.bench.ts` (open the 5,000-line note) run through store, `createUpdate`, `layoutText`, and `EditorView` on the test renderer; `scripts/bench-gate.ts` (`main`, `TARGETS = {sourceKeystrokeP95: 16, openFile: 50}`) runs each 5×, prints medians, and exits non-zero above 2× targets.
- **System Design:** `W261003HEGE-REQ1@R3, REQ4@R3, REQ11@R2` → `W261003HEGE-DES14, DES7, DES6` → `S17, S15` → `V17.1`
- **UI Design:** `None — performance guard`
- **Canonical Shapes:** System design §7 `scripts/bench-gate.ts` row (line 2410); §8 Benchmark case V17.1; §4 `.gitignore` `.so-bench/`
- **Files:** `test/bench/{source-keystroke,open-file}.bench.ts`, `scripts/bench-gate.ts`
- **Execution Approach:** `Direct verification — a benchmark gate is verified by running it against the targets, not by a failing unit test`

**Steps:**

1. `test/bench/*.bench.ts`, `scripts/bench-gate.ts`

   **Preview:**

   ```ts
   const TARGETS = { sourceKeystrokeP95: 16, openFile: 50 } as const;   // ms; gate at 2×
   // main: run each bench 5× (fresh process), collect metric, median, print "<name> median=<ms> limit=<2×target>",
   //   write raw results under .so-bench/, exit 1 if any median > 2× target
   // fixtures via test/fixtures/generate.ts make5000LineNote and a generated 5,000-line TS file; runner stub
   ```

   - Benchmarks never run inside `check`.

2. **VERIFY — `V17.1`:**

   **Preview:**

   ```text
   bun run bench
   └── Expect: medians printed for both; keystroke p95 ≤ 32 ms, open ≤ 100 ms; exit 0
   ```

   - Record medians in the task report (Linux CI is the gate of record; local Mac numbers are informational).

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(bench): add keystroke and open benchmarks with gate

   Task: P3-G1-T5 — Add benchmarks and the bench gate
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V17.1` — `bun run bench` → exit 0 with both medians within 2× targets.

##### P3-G1-T6 — Verify the whole work locally and assemble G1 evidence

- **Outcome:** every local suite passes; `bun run check` exits 0 in < 30 s with zero `knip` findings (interim rule ends); a G1 evidence list maps each G1 output to its file and passing V IDs; a PR description draft records V1.3, V1.4, V16.2, and the pending parent synchronization.
- **System Design:** `W261003HEGE-REQ1@R3, REQ2@R2, REQ4@R3` → `W261003HEGE-DES1, DES14` → `S1, S7` → `V1.3` (plus re-run of all V IDs)
- **UI Design:** `RM261003ABZP-UV1@R2, UV2@R1, UV6@R2, UV10@R1` re-run through V14.1–V14.4
- **Canonical Shapes:** Plan index Overall Verification; system design §8 Non-test verification; §5 Construction and Wiring, Exports (G1 public surface, line 916)
- **Files:** No source changes expected; evidence goes in the group report and the PR description draft (not committed to the repo)
- **Execution Approach:** `Direct verification — aggregate verification of completed tasks`

**Steps:**

1. Local verification run

   **Preview:**

   ```text
   time bun run check            # V1.3: exit 0, < 30 s on the reference Mac; knip reports nothing
   bun run test:ci               # component, integration, e2e
   bun run bench                 # V17.1
   bun install --frozen-lockfile # still clean
   ```

   - Fix only defects inside this work's files; report any contract change need instead.

2. **VERIFY — `V1.3`, G1 evidence:**

   **Preview:**

   ```text
   G1 output → file → evidence
   store (createUpdate, createStore, Action/Effect)   → src/core/state/{update,store,types}.ts → V7.3, V2.1
   CommandRegistry, Keymap + KeyScope                 → src/core/kernel/commands/*            → V7.5
   layoutText, Decoration                             → src/core/kernel/view/*                 → V7.4
   FileTypeRegistry (text, code, markdown source)     → src/core/filetypes, src/core/lang     → V6.1–V6.3
   lowlightHighlighter                                → src/core/lang/code/highlight.ts       → V6.3
   shell, editorViews, OverlayHost, Prompt            → src/ui/{shell,editors,overlays}        → V14.1–V14.4
   readTextFile, atomicWrite, watcher, effect runner  → src/workspace, src/app/effects.ts     → V3.1–V3.4, V5.1, V6.4–V6.5
   bun run check, CI, bench harness                   → package.json, ci.yml, scripts/bench-gate.ts → V1.3, V15.1, V17.1
   Parent map: V1@R1↔V3.1–V3.4, V2@R1↔V2.1, V15@R2↔V7.1–V7.2, V17@R1↔V8.1–V8.2, V18@R1↔V6.1–V6.5
   └── Expect: every row has a passing local result; gate status "Pending — awaiting DI1 PR merge with CI green"
   ```

   - Include the pending parent synchronization (system design §1 Parent Synchronization items 1–7) in the PR description draft as "pending", never as done.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes; if no file changed, record "no changes — verification only" with the command outputs instead of an empty commit.

   **Commit message:**

   ```text
   chore: verify DI1 locally and assemble G1 evidence

   Task: P3-G1-T6 — Verify the whole work locally and assemble G1 evidence
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1.3` — `time bun run check` → exit 0 in < 30 s; `knip` reports nothing.
- All V IDs — `bun run check && bun run test:ci && bun run bench` → pass.

##### P3-G1-T7 — Verify delivery on GitHub with user authorization

- **Outcome:** with explicit user authorization, the branch is pushed, the DI1 PR is open with the evidence description, PR CI is green on both OS within 3 min with the Linux bench step printing medians, the macOS trash check is recorded, and the `v0.1.0-rc.1` tag produces a prerelease with four smoked binaries and `SHA256SUMS`. Without authorization, the task stops and reports these checks as pending.
- **System Design:** `W261003HEGE-REQ4@R3, REQ8@R2, REQ12@R1` → `W261003HEGE-DES11, DES14, DES15` → `S11, S15, S16` → `V11.4, V15.2, V15.3, V16.1`
- **UI Design:** `None — delivery`
- **Canonical Shapes:** System design §8 Non-test verification (V11.4, V15.2, V15.3, V16.1); §7 Migration and Delivery, Rollout Constraints (line 2558); plan context section 3 Delivery constraint
- **Files:** No repository files; GitHub branch, PR, and tag
- **Execution Approach:** `Direct verification — outward-facing delivery checks that run only on GitHub or on the developer Mac`

**Steps:**

1. Authorization and delivery actions

   **Preview:**

   ```text
   ASK the user (AskUserQuestion): push feat/rm261003abzp-di1-editor-foundation, open the DI1 PR, and push tag v0.1.0-rc.1?
   on approval only:
     git push -u origin feat/rm261003abzp-di1-editor-foundation
     gh pr create --base main --title "feat: DI1 editor foundation (W261003HEGE)" --body-file <T6 description draft>
     gh pr checks --watch                                     # V15.2, V15.3
     git tag v0.1.0-rc.1 && git push origin v0.1.0-rc.1      # V16.1 (separate approval if the user splits them)
     gh run watch <release run>; gh release view v0.1.0-rc.1
   V11.4 on the developer Mac: run so on a tmp workspace, d → y on a tmp file → file in ~/.Trash, no prompt
   ```

   - Never merge the PR, publish `v0.1.0`, or edit parent roadmap files. An unavailable runner label is recorded as a release blocker in the PR (V16.2 rule), not worked around.

2. **VERIFY — `V15.2`, `V15.3`, `V16.1`, `V11.4`:**

   **Preview:**

   ```text
   PR CI run            └── Expect: check + test (ubuntu-24.04, macos-15) green; wall clock < 3 min
   Linux test job log   └── Expect: bench step ran and printed medians for both benchmarks
   v0.1.0-rc.1 release  └── Expect: prerelease with so-darwin-arm64, so-darwin-x64, so-linux-x64, so-linux-arm64, SHA256SUMS;
                                     four smoke jobs printed "so 0.1.0-rc.1"; publish ran after all smoke jobs
   macOS trash          └── Expect: file in ~/.Trash via the path detectTrash picked; no permission prompt
   ```

   - Update the PR description with each result (V1.3, V1.4, V11.4, V15.2, V15.3, V16.1, V16.2) and the G1 evidence list.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - No repository change is expected; record "no changes — delivery verification" with links to the PR, CI run, and release instead of an empty commit. If CI exposes a defect, fix it in a new commit referencing this task and re-run.

   **Commit message:**

   ```text
   fix: <defect found by PR CI or release smoke>

   Task: P3-G1-T7 — Verify delivery on GitHub with user authorization
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V15.2` — PR CI run → green on both OS in < 3 min.
- `V15.3` — Linux test job log → bench medians printed.
- `V16.1` — `gh release view v0.1.0-rc.1` → four binaries + `SHA256SUMS`, prerelease, smoke output `so 0.1.0-rc.1`.
- `V11.4` — manual macOS check → moved to Trash without prompt.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast check | `time bun run check` | Exit 0 in < 30 s; zero `knip` findings (V1.3) |
| Component | `bun test test/ui` | V9.3, V14.1–V14.4 pass |
| E2E PTY | `bun test test/e2e` | V4.5, V8.1–V8.3 pass |
| Integration and units | `bun run test:ci && bun test src test/vim` | All Part 1–2 V IDs still pass |
| Bench gate | `bun run bench` | V17.1 within 2× targets |
| PR CI (authorized) | GitHub Actions on the DI1 PR | V15.2, V15.3 |
| Release dry run (authorized) | `v0.1.0-rc.1` | V16.1 |
| macOS trash | Manual on developer Mac | V11.4 |
| G1 evidence | T6 list | Every G1 output mapped to passing evidence; gate reported `Pending — awaiting DI1 PR merge` |

#### Review and Verification Focus

- **Specification:** UI matches accepted parent mockups (M1@R1, M4@R1, AD4) for DI1 states only; `RENDERER_OPTIONS` disables every OpenTUI process handler; flush-then-restore order; exit codes 0/1; NO_COLOR emits no colour SGR; Esc effective timeout `max(escTimeoutMs, 20)`; delivery actions only after explicit authorization; no parent roadmap writes.
- **Technical:** `shell.destroy()` exactly once on every path; bounded 2 s flush; stderr after restore; render coalescing; viewport-only painting; test hooks gated by `SO_TEST=1`; PTY harness answers the kitty query; bench gate fails closed.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ1@R3 → DES9 → S9 → V9.1, V9.2, V9.3` | `UREQ2@R1 → UDES2@R1 → US1@R2 → UV2@R1` | `P3-G1` | `P3-G1-T1, P3-G1-T2` |
| `REQ1@R3 → DES9, DES7 → S14 → V14.1, V14.3` | `UREQ1@R2, UREQ11@R1 → UDES1@R2, UDES11@R1 → US1@R2, US9@R1 → UV1@R2, UV10@R1` | `P3-G1` | `P3-G1-T2` |
| `REQ1@R3 → DES9, DES2 → S14 → V14.2` | `UREQ2@R1 → UDES2@R1 → US1@R2 → UV2@R1` | `P3-G1` | `P3-G1-T2` |
| `REQ1@R3, REQ10@R2 → DES9, DES13 → S14, S13 → V14.4` | `UREQ7@R2 → UDES7@R2 → US5@R2 → UV6@R2` | `P3-G1` | `P3-G1-T3` |
| `REQ1@R3, REQ4@R3, REQ5@R1 → DES9, DES14, DES4 → S8, S4 → V8.1–V8.3, V4.5` | `UREQ11@R1 → UDES11@R1 → US9@R1 → UV10@R1` | `P3-G1` | `P3-G1-T4` |
| `REQ7@R2 → DES10 → S10` (OSC 52 wiring in `main`) | None | `P3-G1` | `P3-G1-T2, P3-G1-T4` |
| `REQ12@R1 → DES15 → S16 → V16.1` | None | `P3-G1` | `P3-G1-T4` (`VERSION`), `P3-G1-T7` |
| `REQ1@R3, REQ4@R3 → DES14, DES7 → S17, S15 → V17.1, V15.3` | None | `P3-G1` | `P3-G1-T5, P3-G1-T7` |
| `REQ2@R2, REQ4@R3 → DES1, DES14 → S1, S15 → V1.3, V15.2` | None | `P3-G1` | `P3-G1-T6, P3-G1-T7` |
| `REQ8@R2 → DES11 → S11 → V11.4` | None | `P3-G1` | `P3-G1-T7` |
| G1 gate evidence (handoff to RM261003ABZP-DI2@R2) | None | `P3-G1` | `P3-G1-T6, P3-G1-T7` |
| `V2.5` obsolete-reference check | None | None | None — greenfield; no removed paths or symbols (system design §8 Non-test) |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly. G1 is reported `Pending — awaiting DI1 PR merge with CI green` with its evidence list for RM261003ABZP-DI2@R2.
- Every source obligation is covered.
- If the user withholds delivery authorization, V11.4, V15.2, V15.3, and V16.1 are reported as pending, not passed.

## Planning Gaps

`None`
