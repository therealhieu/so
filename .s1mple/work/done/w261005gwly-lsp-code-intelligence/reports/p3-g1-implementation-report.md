# P3-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-goal.md`
- **Plan Part:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-3-ui-and-delivery.md`
- **Group:** `P3-G1`
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`, `P3-G1-T6`, `P3-G1-T7`
- **Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p3-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

PR: https://github.com/therealhieu/so/pull/11 — open, mergeable, not merged.

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P3-G1-T1` — Diagnostic gutter and theme tokens | `src/ui/editors/text-view.ts`: `NO_DIAGNOSTICS`, `diagnosticMarks(s.lsp.shown[b.path] ?? NO_DIAGNOSTICS)` between the file type's decorations and `searchMarks` (embed providers unchanged). `src/ui/theme.ts`: `diagnosticError`/`Warn`/`Info`/`Hint` (severity colour + underline; hint dim under NO_COLOR), `floatActive` (`float` already existed). `test/ui/lsp.test.ts`: gutter sign case and underline case | RED: `bun test test/ui/lsp.test.ts` → failed (`Expected "E", Received " "`). GREEN: 2 pass. `bun run check` → 1203 pass. `bun run test:ci` → 251 pass. No golden snapshot changed (63 snapshots pass unchanged; `theme.golden.test.ts` does not enumerate tokens) | `029d5723782b7120e517663d2e1ae1a39439af39` | `Completed` |
| `P3-G1-T2` — Info float overlay | `src/ui/overlays/lsp-float.ts`: `LspFloatView` (private `wrapRows`; wraps to ≤ 80 columns, ≤ 12 rows with border, below the window cursor or above it, clamped; `floatActive` over the signature's active range; `targetAt` → `{kind: "inert"}`; no `cursor`). `src/ui/overlays/host.ts`: `OverlayHost` takes the float as a third constructor argument, adds it first (paints below the modal overlays), is visible when an overlay is open or the float is, and keeps `cursor()` tied to an open overlay. `src/ui/shell.ts`: constructs `LspFloatView` with the windows' cursor. Tests: hover float below the cursor and an unchanged state after a click on it, size bounds for a long hover, signature active-parameter highlight | Direct verification: `bun test test/ui/lsp.test.ts` → 5 pass. Mutation check: with `targetAt` returning `undefined`, the click case fails. `bun run check` → 1203 pass. `bun run test:ci` → first run 252 pass, 2 fail, 1 error (not captured); then 254 pass three times in a row with logs | `da300ca4d37cda17790ffa19ed3751fb3dc347ee`; follow-up `6f00675dd1dcbd69c0d8ed731242812b774ff8f6` | `Completed` |
| `P3-G1-T3` — Statusline segment, cursor diagnostic, and completion rows | `src/core/state/status.ts`: `StatusSegments.lsp`, private `lspSegments` (attached starting/ready servers with progress, then failed servers; see Deviations 1). `src/ui/views/statusline.ts`: `lspSegment` (`◌`/`◆` `statusDim`, `✗` `statusError`), segments after the index segment, dropped first with preview on narrow or crowded rows. `src/ui/views/cmdline.ts`: Normal mode with no message → `cursorDiagnostic(s)` as `<E\|W\|I\|H> <text>` in the severity's diagnostic token. `src/ui/overlays/completion.ts`: code rows `kind label` + right-aligned detail; code popup titled with the server name. Tests: 2 in `src/core/state/status.test.ts`, 4 in `test/ui/lsp.test.ts` | RED: `bun test src/core/state/status.test.ts` → 1 fail. GREEN: 11 pass. `bun test test/ui/lsp.test.ts` → 9 pass. `bun run check` → 1205 pass. `bun run test:ci` → 258 pass | `78bfbdf924b192980ebcf1b09bcc53e15cc8c0d8` | `Completed` |
| `P3-G1-T4` — `<C-Space>` key | `src/ui/input.ts:toKey`: `e.ctrl && e.name === "space"` → `"<C-Space>"` before the named-key table. `src/ui/input.test.ts`: kitty, legacy NUL, and plain space | OpenTUI probe: `\x00` and `\x1b[32;5u` both parse to `{name: "space", ctrl: true}`. RED: 1 fail. GREEN: `bun test src/ui/input.test.ts test/vim` → 305 pass. `bun run check` → 1206 pass. `bun run test:ci` → 258 pass | `9127e814a32327256ab6847241724d1f5d94f6f9` | `Completed` |
| `P3-G1-T5` — End-to-end language server suite | `test/e2e/lsp.test.ts` (4 cases: `◌ fake` in the output then `◆ fake` on the statusline; gutter `E`, `]d` → `3:13`, `:Diagnostics` row; an unopened file's diagnostic opens with Enter at `1:8`; no tagged server after `:q`). Suite-local `setup`, `until` (timeout message includes the screen), `signBefore`, `quit`; `afterEach` kills logged servers and removes temp folders. `test/fixtures/fake-lsp.ts`: `otherDiagnostics` script option (see Deviations 4) | First runs failed on test setup only (Esc typed as raw `\x1b` before `:`; workspace rooted at `src/` when started on `src/main.rs`; picker rows cut at 100 columns). No wiring gap found. `bun test test/e2e/lsp.test.ts` → 4 pass; 5 serial + 4 concurrent runs → 9/9 pass. `pgrep -f fake-lsp` → empty. `bun run check` → 1206 pass. `bun run test:ci` → 262 pass | `fbfe60076ae209d7b829e7fe53fda9f54c33e0d7`; follow-up `4f8f849015c255a6f3366bc916733880c54df352` (see Deviations 12) | `Completed` |
| `P3-G1-T6` — Keystroke benchmark with a server attached | `test/bench/lsp-keystroke.bench.ts`: mounted shell, real `createLspHost` subscribed to the store, the reducer's `lsp*` effects forwarded to `host.run`, the fake server publishing 200 diagnostics on each open and change; the source key mix from line 2500, keys 10 ms apart, each timed through `setImmediate` settle + key + render; `finally` stops the host, kills logged servers, removes the temp folder. `scripts/bench-gate.ts`: `TARGETS.lspKeystrokeP95: 16`, `BENCHES` entry | `pgrep -f fake-lsp` empty before. Direct runs: p95 5.20, 4.89, 5.25 ms. `bun run bench` → every target ok; `lspKeystrokeP95` median 4.93 ms (limit 32). No speedup or threshold change needed. `pgrep -f fake-lsp` empty after. `bun run check` → 1206 pass. `bun run test:ci` → 262 pass | `deb0500c56b42578d323e88ee714e758f013ec33` | `Completed` |
| `P3-G1-T7` — Delivery | `.s1mple/docs/project.md` (Last Modified 2026-10-06; Purpose and Scope; Technology Stack pins; Repository map; LSP flow; `PACKAGE_HOMES`; Data and Contracts rows `[lsp]` config, LSP state, LSP host and client; Test Layers note; `lspKeystrokeP95` row). PR #11 opened. CI fix in `test/integration/lsp-real.test.ts` (Deviations 5). `git mv` of the work folder to `work/done/`; 69 path references rewritten across 15 files | `bun run check` + `bun run test:ci` green and `pgrep -f fake-lsp` empty before the push. CI on `ae081ea`: `check` pass, both `test` jobs fail (`lsp-real.test.ts` timed out). Local repro of the runner's proxy (a `rust-analyzer` that exits 1) → skip; real install → 1 pass. CI on `5b859df`: all green, Linux bench `lspKeystrokeP95` median 8.55 ms. Move check: every moved file equals its old content with `work/active/w261005gwly` → `work/done/w261005gwly`; `rg "work/active/w261005gwly" .s1mple` → no matches. CI on `129e62b`: see Group Verification | `ae081eac728d36943a7aa178a6ef725eaafb0b60` (project.md); `5b859dfa2f164cf5f8f198c3f16e2eff30c71b9f` (CI fix); `129e62b09684367259e0d7024d383ef88f8db3ab` (move) | `Completed` |

### Group Change Range

- **Starting commit:** `f3183213e5616259af81d86a84261b660459cd13`
- **Final commit:** `4f8f849015c255a6f3366bc916733880c54df352`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed` — Biome, tsc, knip clean (zero findings); 1206 pass, 0 fail.
- `bun run test:ci` → `Passed` — 262 pass, 0 fail across 33 files on the final head. This includes `lsp-real.test.ts`, which runs on this machine (rust-analyzer 1.96.0).
- `bun run bench` → `Passed` — final head, macOS (indicative): `sourceKeystrokeP95` 4.48, `liveKeystrokeP95` 11.57, `openFile` 32.30, `sourceOpenFile` 14.39, `liveScrollFrameP95` 5.27, `sourceScrollFrameP95` 4.26, `firstFrame` 167.24, `indexReady` 962.97, `indexingKeystrokeP95` 9.28, `lspKeystrokeP95` 4.93 ms. All are within their limits, and existing targets are unchanged.
- Linux CI bench (run 37358092574 on `5b859df`) → `Passed` — `lspKeystrokeP95` median 8.55 ms (limit 32); every other target ok.
- `pgrep -f fake-lsp` → `Passed` — empty after every suite and bench run.
- `rg "W261005GWLY|REQ[0-9]|DES[0-9]" src test scripts` → `Passed` — no matches.
- CI per head:
  - `ae081ea` (run 37356312352) → `check` pass; `test (ubuntu-24.04)` and `test (macos-15)` fail. Fixed by `5b859df`.
  - `5b859df` (run 37358092574) → `check`, `test (ubuntu-24.04)` (with bench), and `test (macos-15)` all pass.
  - `129e62b` (run 37358593548) → `check` and `test (ubuntu-24.04)` pass; `test (macos-15)` fails on the e2e "a diagnostic for an unopened file opens from :Diagnostics" (`no diagnostics` in the picker). Fixed by `4f8f849` (Deviations 12).
  - `4f8f849` (run 37359352791) → `check`, `test (ubuntu-24.04)` (bench `lspKeystrokeP95` median 8.10 ms), and `test (macos-15)` all pass.
- Self-review of `f318321..4f8f849` → `Passed` after one follow-up. `6f00675` restores modal click-outside behaviour over a float.
- Process hygiene → `Passed` — no `so`, fake-server, or bench process from this work remains. The pre-existing `bun src/app/main.ts …/.sandbox/vault` process and rust-analyzer processes for other projects were left alone.

### Deviations and Remaining Issues

These are decisions a remediator must keep:

1. **Failed servers on the statusline.** `onLspServer` (Part 1) detaches a server from every path once it fails, so `s.lsp.attached` can never yield the required `✗ <name>`. `statusSegments` first lists the attached `starting`/`ready` servers. It then adds each `failed` server whose resolved spec covers the buffer's file type and whose root holds the buffer (`${s.workspace.root}/${path}` under `root/`; no root matches any path). `resolveServers` runs only when a failed server exists. Part 1 contracts are unchanged.
2. **`OverlayHost` takes the float as a constructor argument.** `src/ui/shell.ts` (outside the T2 file list) constructs `LspFloatView(renderer, () => windows.cursor())` and passes it in. Constructing it inside `host.ts` would create an import cycle, because `lsp-float.ts` imports `drawFrame` from `host.ts`. The float is added first, so it paints under every modal overlay.
3. **Float mouse targets (follow-up `6f00675`).** The float answers `inert` only with no overlay open or outside the completion popup. With a picker or prompt open, a cell outside it stays `outside`, as before. No component test covers this: the float stays in state under a picker, but in the shell layout the picker covers it, so no cell lies on the float and outside the picker.
4. **Fake server option `otherDiagnostics`** (`test/fixtures/fake-lsp.ts`, a Part 2 file). The fake server published only for the document it was sent, so V17 could not be driven. The new option publishes for listed absolute paths whenever a document opens; other behaviour is unchanged.
5. **`lsp-real.test.ts` guard** (a Part 2 file, fixed during T7). GitHub runners have rustup's `rust-analyzer` proxy on `PATH` without the component. `Bun.which` found it, the server stayed `unavailable`, and both test jobs timed out after 30 s. The test now runs only when `rust-analyzer --version` exits 0.
6. **Tokens.** The cursor diagnostic in the command line uses the design's severity tokens. Because P1's `SIGN` styles share these tokens with the range underline, the message line and the gutter letter are underlined too. Changing that is visual treatment for `s1mple-discuss-ui`.
7. **Float layout.** The float is a rounded frame with one cell of padding. It sits at the cursor's column, below the cursor row when it fits, else above. It hides when fewer than 3 rows fit. Wrapping breaks after a space and keeps UTF-16 offsets, so the signature's active range survives wrapping.
8. **Code completion title.** The code popup is titled with the server's name. Before this change it fell through to the `blocks · ` title, which the design did not cover.
9. **e2e suite.** Files sit at the workspace root, because starting on a nested file roots the workspace at that folder. The PTY is 160 columns wide, so picker rows are not cut. Esc is sent as kitty `\x1b[27u`. `◌ fake` is checked in the raw output stream, because the starting state may last less than one screen poll.
10. **Bench.** Keys arrive 10 ms apart. The 150 ms sync debounce coalesces the typed burst, so one diagnostic batch is applied while typing (after `<Esc>`). The fake server starts with `process.execPath`, so `pgrep -f fake-lsp` matches its script path.
11. **Flakes seen.**
    - `test/ui/esc.test.ts` "an arrow key's escape sequence reaches the store at once" failed once locally: 11.3 ms against < 10 ms, at load average ~17. It passed 5/5 in isolation and on the rerun. It is outside this group and unchanged.
    - One early `test:ci` run during T2 reported 2 failures and 1 error that were not captured. The next three logged runs passed 254/254.
    - Neither appeared on CI.

12. **e2e race on macOS CI (follow-up `4f8f849`).** Picker items are computed when the picker opens; `refreshPicker` runs only for sources that ask for it, so an open `:Diagnostics` picker does not pick up later diagnostics. `◆ fake` is dispatched when `initialize` completes. `didOpen`, and the fake server's publish for the unopened file, come after it. On `129e62b` the macOS runner opened the picker first, and it stayed empty.
    - Reproduction: the fake server's publish for other files delayed by 500 ms fails 1/1 with `no diagnostics`. The delay was temporary and has been reverted.
    - Fix: the case reopens `:Diagnostics` until the row is listed, within 15 s. With 500 ms and 2 s delays it passes.
    - Repeat runs: 5 serial and 8 concurrent full-suite runs pass 13/13. Ten concurrent runs of the old version passed locally, so local load did not reproduce the race.
    - Product code is unchanged. Live refresh of open pickers is outside this work's scope.

Remaining issues: None.

## Remediation

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — every task is implemented, committed, and verified, and the PR is green on the final implementation head.
- **Final report commit:** returned to the orchestrator
- **Final commits:** `029d5723782b7120e517663d2e1ae1a39439af39`, `da300ca4d37cda17790ffa19ed3751fb3dc347ee`, `78bfbdf924b192980ebcf1b09bcc53e15cc8c0d8`, `9127e814a32327256ab6847241724d1f5d94f6f9`, `fbfe60076ae209d7b829e7fe53fda9f54c33e0d7`, `deb0500c56b42578d323e88ee714e758f013ec33`, `6f00675dd1dcbd69c0d8ed731242812b774ff8f6`, `ae081eac728d36943a7aa178a6ef725eaafb0b60`, `5b859dfa2f164cf5f8f198c3f16e2eff30c71b9f`, `129e62b09684367259e0d7024d383ef88f8db3ab`, `4f8f849015c255a6f3366bc916733880c54df352`
- **Final checks:**
  - `bun run check` → 1206 pass.
  - `bun run test:ci` → 262 pass.
  - `bun run bench` → all targets ok (`lspKeystrokeP95` 4.93 ms local, 8.55 ms Linux CI).
  - `pgrep -f fake-lsp` → empty.
  - Work-process id scan → no matches.
  - CI → green on `5b859df` and `4f8f849`; `129e62b` failed on macOS and was fixed by `4f8f849`.
- **Remaining issues:** None.
