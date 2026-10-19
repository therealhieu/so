# W26101928X8 G2 Verification Report

## Scope

- **Scope:** `G2`
- **Tasks:** `G2-T1`, `G2-T2`, `G2-T3`
- **Change range:** `d0a4da4..e5bc07c`
- **Report:** `.s1mple/work/active/w26101928x8-kitty-text-sizing/reports/g2-verification-report.md`

## Status

`Failed`

G2 meets `REQ1`, `REQ2`, and `REQ5`, and `V4`–`V6` pass. `REQ3` is not met: when OpenTUI forces a full repaint for a reason other than a resize event or a resume, it rewrites every sized block's cells (so kitty erases the sized text), but `SizedText` does not send the blocks again (`G2-VER1`). `bun run test:ci` also fails, but only on timing-sensitive `test/integration` suites that do not touch G2 code and fail the same way on the base commit.

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1` | `DES5`, `DES6` | `V4` | `src/ui/sized-text.ts:chunkBytes`, `blockBytes`, `frameBytes`, `SizedText`; `src/ui/widgets/sized-text.ts:paintSizedText` (reserves `2 × rows`, registers the block only when given all rows); registered in `src/app/main.ts:427` and `test/support/ui.ts:103` | `Met` |
| `REQ2` | `DES1` (UI capability wiring) | `V6` | `src/ui/editors/text-view.ts:851` and `src/ui/editors/base-view.ts:93` set `sizedText` from `capabilities().caps?.scaled_text === true`; `src/ui/shell.ts:367` repaints on `capabilities`; writers only run for `sizedText` widgets and `script` spans, which G1 emits only when `ctx.sizedText` | `Met` |
| `REQ3` | `DES5`, `DES6` | `V5` | `src/ui/sized-text.ts:planFrame`, `SizedText.step` (covered check, alpha-flip rewrite marking), `invalidate()` from `src/ui/shell.ts:363` (resize) and `:396` (resume). Forced full repaints without a resize event are not covered — `G2-VER1` | `Not met` |
| `REQ5` | `DES5`, `DES6` | `V4`, `V5` | `src/ui/sized-text.ts:scriptBytes` (`n=1:d=2:v=0\|1:w=1`); `src/ui/editors/text-view.ts:paintLine` registers each drawn `script` span cell; `src/ui/widgets/embed.ts:drawSpans` passes the writer too | `Met` |

## Checks

All runs recorded with `uptime` load averages (1-minute value shown).

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| `V4` | `bun test src/ui/sized-text.test.ts` | 4 pass, 0 fail. Exact bytes match the plan: H1 `\x1b[?2026h\x1b7` + CUP + SGR + `\x1b]66;s=2;█ Raft\x1b\\` … `\x1b8\x1b[?2026l`; H2 `\x1b]66;s=2:w=3:n=3:d=4:v=2;Guar\x1b\\`; sub pair `\x1b]66;n=1:d=2:v=1:w=1;ti\x1b\\`; control characters in note text become spaces (load 3.1) | `Passed` |
| `V5` | `bun test --timeout=20000 test/ui/sized-text.test.ts` | 6 pass: drawn once then silent; resent after a move, a cell change (12 cells rewritten), resize, and resume; float over row 2 → not sent and 12 cells rewritten; cut at the bottom → normal-size `█ Raft`, nothing sent; `terminalWriter` finds `writeOut` (load 3.1) | `Passed` |
| `V6` | `bun test --timeout=20000 test/e2e/sized-text.test.ts` | 1 pass: xterm headless PTY shows `█ Raft`, `▊ Guarantees` two rows below, the math source label; no `]66;s=` or `]66;n=` after removing OpenTUI's own startup probe (load 3.1) | `Passed` |
| Group check | `bun run check` | Run 1: 1988 pass, 1 fail in `src/workspace/git-watcher.test.ts` (commit notification timing; not in the change range), load 2.8. That file alone: 4 pass. Run 2: 1989 pass, 0 fail, biome/tsc/knip clean (load 3.0) | `Passed` |
| Group check | `bun test --timeout=20000 test/ui/sized-text.test.ts test/e2e/sized-text.test.ts` | 7 pass, 0 fail (load 3.1) | `Passed` |
| Group check | `bun run test:ci` | Run 1: 421 pass, 4 fail (`rename`, `git`, `index-host`, `bases-write` integration suites, each ~5–6 s timeouts), load 4.0–4.7. Those 4 files alone: 15 pass. Run 2: 424 pass, 1 fail (`bases-write` card move), load 4.0–4.8. Base commit `d0a4da4` in a temporary worktree: 3 fail (`linking a mention…`, `an external commit refreshes…`, plus the settings-picker snapshot that `fb4c4a8` updates), load 5.1–7.4. None of the failing integration files import `src/ui` or mount the shell | `Failed` — pre-existing timing flakes, not attributed to G2 |
| Probe | Scratch test (deleted): render a `SizedText` block, set OpenTUI's `forceFullRepaintRequested = true`, render again | `cells rewritten: 120  raft rewritten: true  osc66 resent: false` | Evidence for `G2-VER1` |

## Integration

Not applicable — group scope.

## Findings

### G2-VER1 — Major — Correctness — Sized text is lost after OpenTUI's forced full repaints

- **Builds:** `REQ3`, `DES5`, `V5`, `G2-T1`, `G2-T2`
- **Evidence:** `SizedText` resends a draw only when it is new, its cells changed, or after `invalidate()`:

  ```ts
  // src/ui/sized-text.ts:155-156
  const send = visible.filter(
    (d) => fresh || !last.has(d.bytes) || touched(d.rects),
  );
  ```

  The shell calls `invalidate()` only on the `resize` event and on resume (`src/ui/shell.ts:363`, `:396`); the `capabilities` handler only repaints (`src/ui/shell.ts:367-368`). OpenTUI 0.5.14 also forces a full repaint without either event:

  ```js
  // node_modules/@opentui/core/chunk-bun-j2z63cdy.js:9108-9112 (processCapabilitySequence)
  if (hasStandardCapabilitySignature) {
    this.forceFullRepaintRequested = true;
    this.requestRender();
  }
  this.emit("capabilities", this._capabilities);
  // :9538-9543 (processResize): a resize that ends at the old size
  if (width === this._terminalWidth && height === this._terminalHeight) {
    if (repaintIfUnchanged) { this.forceFullRepaintRequested = true; this.requestRender(); }
    return;   // no "resize" event
  }
  ```

  Probe result: after a forced repaint OpenTUI rewrote all 120 cells, including the block's top-left `Raft` cell, and no OSC 66 was sent.
- **Impact:** Writing a block's top-left cell erases kitty's sized text, so the heading falls back to normal size and the scripts to their first character, until something else changes those cells. Triggers: a capability reply in a later stdin read than the one that set `scaled_text` (CPR `ESC[1;nR`, DA1 `ESC[?…c`, DECRQM, kitty graphics replies all match `isCapabilityResponse`), which is plausible at startup over slower links or inside herdr; and a window resize that returns to its starting size within OpenTUI's debounce. The screen then does not match the layout, which `REQ3` forbids.
- **Resolution:** Send every draw again on any frame where OpenTUI repaints in full. For example, treat the frame as `fresh` when the renderer's `forceFullRepaintRequested` is set at post-process time (read through one accessor, like `writeOut`, with a test that fails if it disappears), or at least call `invalidate()` in the `capabilities` handler and cover the same-size resize path.
- **Proof to close:** A component test in `test/ui/sized-text.test.ts`: after a block is shown, a frame with a forced full repaint (a capability response fed to the renderer, or the flag set through the accessor) sends the block's OSC 66 again; the next unchanged frame sends nothing. `bun run check` and `bun test --timeout=20000 test/ui/sized-text.test.ts test/e2e/sized-text.test.ts` pass.

## Test Coverage

- **Covered:** exact OSC 66 bytes for 2×, 1.5×, scripts, multi-code-point graphemes, and escape cleaning (unit); draw-once, move, cell change, resize, resume, float cover with a 12-cell rewrite, and cut-at-bottom decisions against OpenTUI's real native diff (component); the `writeOut` accessor; no sizing bytes in a PTY without OSC 66 support (end to end). This matches the Test Strategy's "bytes in a UI unit test; frame decisions in one component suite; no-support in one PTY test".
- **Missing:** forced full repaints without a resize event (`G2-VER1`); the `capabilities` repaint path (the implementer's stated deviation). Theme-change resend has no test, but it follows directly from the SGR being part of the draw key, so a separate test is not needed.
- **Low-value:** None.

## Scope Changes

Each implementer deviation was judged against the Decisions:

| Deviation | Judgment |
|---|---|
| Control characters in note text become spaces, with a unit test | Accepted — closes escape injection (ESC, BEL, C1 `ST`) into OSC 66; the test is high-value |
| No separate `planFrame` unit tests | Accepted — the Test Strategy proves frame decisions once in the component suite, which runs OpenTUI's real diff; `planFrame` is still a pure function as `G2-T1` asked |
| Normal-size fallback text on the first row of each wrapped row's pair | Accepted — matches `DES6` |
| Multi-code-point graphemes in a 2× chunk get their own escape with `w=<cells>` | Accepted — keeps kitty's and so's widths equal; `w` stays ≤ 2, under kitty's limit of 7 |
| Heading background = first chunk's `under`, else its `style` | Accepted — `SizedBlock` has no heading style field; no Decision conflicts |
| Injected `ShellDeps.write` in tests, `terminalWriter(renderer)` otherwise | Accepted — `src/app/main.ts` passes no `write`, so production uses `writeOut` as `A4` requires |
| PTY test strips OpenTUI's own `ESC]66;s=2; ESC\` probe | Accepted — the regex only matches the one-space probe, never note text, so `V6` still proves no sizing bytes from so |
| Capability-event repaint has no automated test | Not accepted alone — folded into `G2-VER1` |

Technical assessment beyond the findings:

- **kitty overwrite rules:** every area OpenTUI writes into, and every area whose draw disappears, is marked whole through the `fg` alpha flip, so OpenTUI's top-to-bottom diff writes the top-left cell first and kitty erases the block before any lower-row write. A float over row 2 rewrites all 12 cells (test), so no lower-row cursor skip can push text right.
- **Ordering:** on macOS `writeOut` queues on the render thread after the frame (`chunk-bun-j2z63cdy.js:7725-7731`) and the `frame` event fires only after `renderNative` returns `"rendered"` (`:10088-10106`). On Linux (no thread) the native write finishes synchronously before the `frame` event, so the stdout write follows it; this was reasoned from the code, not run on Linux. When a frame is skipped or backpressured, the plan is dropped and `last` keeps its old value, so the next frame decides again and errs toward resending.
- **Sync output:** the bytes go out in their own `CSI ?2026h … CSI ?2026l` pair with `ESC 7`/`ESC 8`, after OpenTUI's frame, so nesting is not an issue.
- **Theme change:** the SGR is part of the draw's bytes, so a new theme makes every draw new; old areas are rewritten and the new bytes sent.
- **Cost per frame:** `draw()` and `step` allocate one small array per covered cell and walk each area up to twice; a 60-column view with 20 visible headings is about 2,400 cells per frame. Frames with no draws and nothing shown return at once. Acceptable for now; no finding.

## Blockers and Unverified Items

- `V7` (manual kitty check) is run later by the orchestrator, not here.
- Linux ordering (no render thread) was checked by reading OpenTUI's code only.
- `bun run test:ci` failures are timing flakes in `test/integration` suites outside this group's change range; they reproduce on base `d0a4da4` and pass when run alone. They need their own fix but do not block G2 on their own.
- Two `src/app/main.ts` processes under the scratchpad `v7/` folder were running during verification; they belong to the orchestrator's `V7` run and were left alone. This verifier started no long-lived processes; its temporary base worktree and probe file were removed.
