# P3-G1 Verification Report

## Scope

- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`, `P3-G1-T6`, `P3-G1-T7`
- **Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p3-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p3-g1-implementation-report.md`

## Status

`Passed`

Every assigned chain is implemented and proven, every group check passes on `d4b894a`, and CI is green on that head. The eight recorded deviations are justified, and none of them breaks a requirement or a protected contract. Verification inspected `git diff -M f318321..4f8f849` (13 source files, 5 test files, 1 script) and the delivery commits `ae081ea`, `5b859df`, `129e62b`, and `d4b894a`.

## Assigned Traceability

- **System Design:** `REQ6@R2 → DES7 → S10 → V47`; `REQ13@R1 → DES14 → S28 → V38`; `REQ3@R2 → DES15 → S5 → V6`; `REQ6@R2, REQ7@R2 → DES7, DES9, DES14 → S10, S11, S13 → V12, V17`; `REQ15@R1 → DES17 → S32 → V43`; `REQ14@R2 → DES6, DES17 → S31 → V42`; `REQ6@R2, REQ13@R1 → DES7, DES8, DES11, DES15 → S12, S28` (painting); `REQ3@R2, REQ6@R2, REQ8@R1 → DES7, DES10, DES15 → S5, S12` (painting); `REQ15@R1 → DES17 → S32 → V46` (CI) and `.s1mple/S1MPLE.md` Delivery
- **UI Design:** `None`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ6@R2 → DES7 → S10 → V47` | `None` | The window path paints sign `E` in the gutter sign cell and underlines the range; embed providers are unchanged | `src/ui/editors/text-view.ts:675` `diagnosticMarks(s.lsp.shown[b.path] ?? NO_DIAGNOSTICS)` sits between the file type's decorations and `searchMarks`, matching design §7; `NO_DIAGNOSTICS` at `:53`; embed providers untouched. `src/ui/theme.ts` adds `diagnosticError/Warn/Info/Hint` (colour + underline) and `floatActive` (`float` already existed at `:193`). `test/ui/lsp.test.ts` "a window paints an error sign…" and "…underlines its range and nothing else" | `Satisfied` |
| `REQ6@R2, REQ13@R1 → DES8, DES11 → S28` (float painting) | `None` | Float next to the window cursor, below or else above, clamped, at most 80 × 12, above windows and below modal overlays, no keys, mouse-inert | `src/ui/overlays/lsp-float.ts`: `MAX_WIDTH = 80`, `MAX_HEIGHT = 12`; `below = rows - 2 - (at.y + 1)` and `above = at.y - 1` keep it between the bufferline and the statusline; `x = Math.max(0, Math.min(cols - w, at.x))`; hidden when `h < 3`; `targetAt` → `{kind: "inert"}`; no key handler. `src/ui/overlays/host.ts` adds the float first, so modal views paint over it. Tests: hover below the cursor with an unchanged store after a click, 80 × 12 bounds for a long hover, `floatActive` over the signature's active range | `Satisfied` |
| `REQ3@R2, REQ6@R2, REQ8@R1 → DES7, DES10, DES15 → S5, S12` (painting) | `None` | `◌`/`◆`/`✗` per server, dropped first with preview; cmdline cursor diagnostic only in Normal mode with no message; code rows `kind label · detail` | `src/ui/views/statusline.ts` `lspSegment` matches the design's proposed shape exactly and uses `indexSegment`'s glyphs and tokens (`statusDim`, `statusError`); the drop loop changed from `[preview, words, view]` to `[...servers, preview, words, view]`, so servers drop first and the existing order is kept. `src/ui/views/cmdline.ts:101-104` uses `cursorDiagnostic(s)` only when `m === undefined && s.vim.mode === "normal"`. `src/ui/overlays/completion.ts` renders `${kind} ${label}` with the existing right-aligned detail, as link rows do. Tests in `src/core/state/status.test.ts` (2) and `test/ui/lsp.test.ts` (4) | `Satisfied` |
| `REQ13@R1 → DES14 → S28 → V38` | `None` | ctrl+space → `<C-Space>` (kitty and legacy NUL); space → `" "` | `src/ui/input.ts:43` `if (e.ctrl && e.name === "space") return "<C-Space>";` before the named-key table; `src/ui/input.test.ts` "ctrl+space is its own key and space stays a space" covers all three forms; `test/vim` 297 pass unchanged | `Satisfied` |
| `REQ3@R2 → DES15 → S5 → V6` | `None` | Statusline shows `◌ fake`, then `◆ fake` within 5 s | `test/e2e/lsp.test.ts` "the statusline shows the server starting and then ready": `◆ fake` on the status row through `waitFor` (default 5000 ms, `test/e2e/pty.ts:159`); `◌ fake` asserted in the raw output stream | `Satisfied` |
| `REQ6@R2, REQ7@R2 → DES7, DES9, DES14 → S10, S11, S13 → V12, V17` | `None` | Gutter `E`, `]d` moves to the diagnostic, `:Diagnostics` lists it, and an unopened file's diagnostic opens with `Enter` | `test/e2e/lsp.test.ts`: sign `E` before `let y = z;` and blank before `let x = 1;`; `]d` → status `3:13`; picker row `E main.rs:3:13 …`; `W lib.rs:1:8 …` followed by `Enter` → `lib.rs` at `1:8` | `Satisfied` |
| `REQ15@R1 → DES17 → S32 → V43` | `None` | No fake server remains after quitting | `test/e2e/lsp.test.ts` "quitting leaves no language server running": `pgrep -f fake-lsp-<log>` true before `:q`, false after exit; `afterEach` also runs `killServers(logs)` | `Satisfied` |
| `REQ14@R2 → DES6, DES17 → S31 → V42` | `None` | `lspKeystrokeP95` target 16 ms, gate 2×, with existing targets unchanged | `scripts/bench-gate.ts` adds only `TARGETS.lspKeystrokeP95: 16` and its `BENCHES` entry. `test/bench/lsp-keystroke.bench.ts` uses the real `createLspHost` on a mounted shell, with the fake server publishing 200 diagnostics per open or change, the source key mix at line 2500, and a `finally` that stops the host, kills logged servers, and removes the temp folder | `Satisfied` |
| `REQ15@R1 → DES17 → S32 → V46` and `.s1mple/S1MPLE.md` Delivery | `None` | `project.md` describes the LSP contracts; PR open with CI green; work folder in `work/done/` with references updated; CI green on the new head; no merge or force-push | PR #11 open, `MERGEABLE`, not merged. Push order: `ae081ea` (PR opened, CI red) → `5b859df` (green) → `129e62b` (move; macOS red) → `4f8f849` (green) → `d4b894a` (green). Each pushed head descends from the previous one (`git merge-base --is-ancestor`), and there are no merge commits. `129e62b` is 18 renames with path-only edits (69/69 lines). `.s1mple/work/active/` is empty. `project.md` claims checked against code (see Technical Verification) | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V47` | `S10` | `DES7` | `bun test test/ui/lsp.test.ts` | 9 pass across the file (gutter sign and underline cases included) | `Passed` |
| `S28` (float painting, mouse inertness) | `S28` | `DES8`, `DES11` | `bun test test/ui/lsp.test.ts`; code inspection of `lsp-float.ts` and `host.ts` | The hover, 80 × 12 bounds, and active-parameter cases pass. A click on the float leaves the store object identical (`toBe(before)`). `OverlayHost.targetAt` returns the float's `inert` only with no overlay open or outside the completion popup; it still returns `outside` under a picker or prompt (`6f00675`) | `Passed` |
| `S5`, `S12` (status, cmdline, completion rows) | `S5`, `S12` | `DES7`, `DES10`, `DES15` | `bun test src/core/state/status.test.ts test/ui/lsp.test.ts` | Pass: attached starting with progress, attached ready, `unavailable` silent, `✗` for a failed server under its root only, narrow drop, Normal-only cursor diagnostic, and the `Method len … fn(&self) -> usize` row | `Passed` |
| `V38` | `S28` | `DES14` | `bun test src/ui/input.test.ts`; `bun test test/vim` | 28 pass across the three targeted unit files; `test/vim` 297 pass | `Passed` |
| `V6`, `V12`, `V17`, `V43` | `S5`, `S10`, `S11`, `S13`, `S32` | `DES7`, `DES9`, `DES14`, `DES15`, `DES17` | `bun test test/e2e/lsp.test.ts` ×5 serial, then two rounds of 6 concurrent runs | 17/17 runs, 4 pass each, 0 fail; `pgrep -f fake-lsp` empty afterwards | `Passed` |
| `V42` | `S31` | `DES6`, `DES17` | `pgrep -f fake-lsp` (empty) → `bun run bench` → `pgrep -f fake-lsp` | `lspKeystrokeP95` median 5.08 ms (limit 32). All other targets ok (`sourceKeystrokeP95` 4.44, `liveKeystrokeP95` 11.55, `openFile` 32.66, `sourceOpenFile` 14.28, `liveScrollFrameP95` 5.30, `sourceScrollFrameP95` 4.31, `firstFrame` 165.49, `indexReady` 949.40, `indexingKeystrokeP95` 9.06). No fake server afterwards | `Passed` |
| `V46` / Fast gate | `S32` | `DES17` | `bun run check` on `d4b894a` | Biome clean, tsc clean, knip zero findings; 1206 pass, 0 fail | `Passed` |
| CI suites | `S32` | `DES17` | `bun run test:ci` on `d4b894a` | 262 pass, 0 fail, 63 snapshots across 33 files; `pgrep -f fake-lsp` empty afterwards | `Passed` |
| Golden snapshots | None | `DES7` | `git diff --stat f318321..4f8f849 -- '*.snap' test/ui/__snapshots__` | No snapshot file changed; the 63 snapshots pass unchanged | `Passed` |
| Work-process ids | None | None | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]" src test scripts` | No matches | `Passed` |
| Stale active-path references | None | None | `rg "work/active/w261005gwly" .s1mple` | One match, in `reports/p3-g1-implementation-report.md`, where the text quotes this same `rg` command. No path points at the old folder | `Passed` |
| UI reads state only | None | `DES7`, `DES8`, `DES15` | Inspection of `lsp-float.ts`, `statusline.ts`, `cmdline.ts`, `completion.ts`, `text-view.ts`, and `status.ts` | No view dispatches or mutates state. `lspSegments` is a pure derivation in `src/core/state`, which may import `core/config` (`LAYER_RULES`) | `Passed` |
| No allocation for buffers without diagnostics | None | `DES7` | Inspection of `text-view.ts` and `src/core/kernel/view/diagnostics.ts` | `NO_DIAGNOSTICS` is shared, as the design's proposed shape specifies. The provider still allocates a closure and an empty `Map` and arrays per frame, like `searchMarks` and `selectionMarks`. The keystroke benches show no cost | `Passed` |
| Process hygiene | `S32` | `DES17` | `pgrep -fl fake-lsp`; `pgrep -fl "src/app/main.ts\|bin/so"`; temp-folder glob | No fake server, and no `so`, PTY, or bench process from this run. Only the pre-existing `.sandbox/vault` process remains. No `so-lsp-e2e-*`, `so-lsp-config-*`, or `so-bench-lsp-*` temp folders | `Passed` |
| `project.md` accuracy | None | `DES17` | Cross-check against `src/app/lsp-host.ts:33-42`, `src/core/config/lsp.ts`, `package.json:33-34`, `test/boundaries.test.ts:57-58`, `src/core/state/lsp-commands.ts:318-332`, `scripts/bench-gate.ts` | Constants (500, 150, 2000, 5, 180000, 100 ms throttle), the seven built-ins, pins `9.0.3`/`3.18.4`, `PACKAGE_HOMES`, the key list including Insert `<C-s>`/`<C-Space>`, and the `lspKeystrokeP95` row all match. The `lsp-real` note ("runs only where `rust-analyzer` is installed") matches the `--version` guard | `Passed` |
| Delivery / CI on the final head | `S32` | `DES17` | `gh pr view 11`; `gh pr checks 11`; `gh run list` | Head `d4b894a` run 37359755482: `check`, `test (ubuntu-24.04)` (with bench), and `test (macos-15)` pass. Earlier heads: `4f8f849` green, `129e62b` red (macOS e2e race, fixed by `4f8f849`), `5b859df` green, `ae081ea` red (fixed by `5b859df`). PR open, not merged | `Passed` |
| e2e flakiness on macOS/Linux CI | `S32` | `DES17` | Code review of the waits plus 17 local runs (12 of them under 6-way concurrency) | All waits poll the screen with bounded timeouts. The known picker race is handled by reopening for up to 15 s. Residual risk, judged low: the `◌ fake` check depends on the starting state reaching one painted frame before `initialize` completes. That needs a child Bun process to start and answer, so it has held in every run | `Passed` |

## Findings

None

## Test Coverage

- **Covered:**
  - The gutter sign and underline range (`V47`).
  - Float placement below the cursor, 80 × 12 bounds, the active-parameter highlight, and click inertness.
  - Statusline segments for starting with progress, ready, unavailable (silent), and failed under its root, plus the narrow-terminal drop.
  - The Normal-only cursor diagnostic and the code completion row format and title.
  - `<C-Space>` in kitty, legacy NUL, and plain-space forms (`V38`).
  - PTY statusline, gutter, `]d`, `:Diagnostics` for open and unopened files, and no orphan after quit (`V6`, `V12`, `V17`, `V43`).
  - `lspKeystrokeP95` through the gate (`V42`).
  - The fast gate and CI suites (`V46`, `S32`).
- **Missing:** These are not required by any assigned `V` case. The code was verified by inspection.
  - No assertion that a set command-line message wins over the cursor diagnostic (`cmdline.ts:102` `m === undefined`). Assertion: with a message set, the last row shows the message, not `E …`.
  - No float case for above-cursor placement when there is no room below. Assertion: with the cursor on the last body rows, the float's bottom border sits above the cursor row.
  - The `✗` glyph and `statusError` token are proven in `status.test.ts` and by inspection of `lspSegment`, but no component case paints them.

## Scope Changes

Each deviation recorded in the implementation report was judged on its merits:

1. **Statusline `✗` beyond `attached`:**
   - **Why it was needed:** Part 1's `onLspServer` detaches failed servers, so REQ3@R2's `✗ <name>` could not appear otherwise. Part 1 contracts are unchanged.
   - **How it works:** `lspSegments` adds failed servers whose resolved spec serves the buffer's file type and whose root holds the file. Reload, disable, and `:LspRestart` remove failed views through `reconcile`, `forgetAll`, and `restart` (`src/app/lsp-host.ts:294-330, 718-727`), so the segment cannot outlive its config.
   - **Verdict:** Justified.
2. **`src/ui/shell.ts` edit:** constructing `LspFloatView` in `host.ts` would create an import cycle, because `lsp-float.ts` imports `drawFrame` from `host.ts`. Passing the float into the `OverlayHost` constructor keeps the design's paint order. Justified.
3. **Float click handling (`6f00675`):** this keeps the pre-existing click-outside-closes behaviour for modal overlays and leaves the float inert where the body would answer. It is correct. No component case covers a float cell outside a picker, because the shell layout covers that cell with the picker. Acceptable.
4. **Fake-server `otherDiagnostics`:**
   - **Why:** this is the smallest additive script option that can drive `V17`.
   - **Effect:** the fake server's existing behaviour is unchanged.
   - **Scope:** it touches a test fixture only.
   - **Verdict:** Justified.
5. **`lsp-real.test.ts` guard:** `rust-analyzer --version` exiting 0 identifies a runnable binary more accurately than `Bun.which`, which also finds rustup's proxy. REQ15 says the test is skipped "otherwise". This follows that intent. Justified.
6. **e2e reopen-until-row:** an open `:Diagnostics` picker does not refresh, because items are computed when it opens, and only some sources request `refreshPicker`. This is existing picker behaviour, and no REQ7/S13 clause requires live refresh, so the test-side retry is the right fix. Product code is unchanged. Justified. Live refresh would be a separate change.
7. **Underlined cmdline message and gutter letter:** Part 1's `SIGN` styles share the design's severity tokens, which carry an underline. The command line uses those same tokens, as design §7 specifies ("in its severity token"). The visual result differs from the REQ6 mock-up, which shows no underline on the letter. The plan routes visual treatment beyond existing tokens to `s1mple-discuss-ui`. Accepted as a follow-up candidate, not a defect.
8. **Code completion title (server name):** this is a small, sensible addition. Before it, code mode fell through to the `blocks · ` title. Accepted.

Observation, not a finding: the mechanical path rewrite in `129e62b` turned three historical lines in `w261005gwly-plan-3-ui-and-delivery.md` (T7 **Files**, the `git mv` preview, and the step 2 `rg` instruction) into a no-op move from `work/done/` to `work/done/` and an unsatisfiable "`rg "work/done/w261005gwly"` → no matches" check. The plan is a completed, read-only record, and the governing stale-reference check passes, so this affects no behaviour or delivery outcome.

## Unverified Items

- Visual appearance in a real terminal emulator (colours, underline rendering) was checked only through captured span attributes and screen text, not by eye.
- The e2e suite was repeated locally on macOS only. Linux behaviour rests on the green `test (ubuntu-24.04)` jobs of runs 37359352791 and 37359755482.

## Blockers

None
