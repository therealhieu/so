# W261022JQU1 G2 Verification Report

## Scope

- **Scope:** `G2`
- **Tasks:** `G2-T1`, `G2-T2`
- **Change range:** `a8100d1..5cc5e6e`
- **Report:** `.s1mple/work/active/w261022jqu1-opentui-0-6/reports/g2-verification-report.md`

## Status

`Failed`

Every assigned row is met and both group checks pass apart from the expected G3 resume case and the A10 watcher tests. One Minor finding remains: the refused-write fallback that `DES2` and `A6` define has no test.

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ2` | `DES2` | `V2` | `src/ui/sized-text.ts:245` `sessionWriter` writes UTF-8 through the private `nativeSession.write` and throws an error naming the member if it is missing. `fullRepaintFlag` is unchanged. The constructor keeps the injected `ShellDeps.write` override. A `false` from the erase in `step` (`:372`) or the frame write in `flush` (`:392`) calls `refused()` (`:342`), which sets `fresh`, sets `forceFullRepaintRequested`, and calls `requestRender` | `Met` |
| `REQ2` | `DES3` | `V2`, `V3` | `SizedText.draw(rects, bytes, paint)` (`:310`). `replay` (`:327`) clears one scratch buffer owned by `renderer.nativeScene`, re-creates it on a size change, and replays every paint into it. A draw is covered when any rect cell differs (`:365`). `destroy()` releases the scratch (`:322`). Painters: `src/ui/widgets/sized-text.ts:65,73`, `src/ui/zoom-row.ts:100`, `src/ui/editors/text-view.ts:233` | `Met` |
| `REQ2` | `DES4` | `V2` | `src/ui/sized-text.ts:357-378`: reads `currentRenderBuffer` and the scratch inside `withBuffers`. `planFrame` is unchanged. Rewrite cells get their fg alpha flipped in the current buffer inside the same scope | `Met` |

The paint functions draw the same cells as the frame inside each draw's rects:

- `paintSizedText` paints the frame to the window edge (`toEdge = true`) and the replay to `cellsAt(i)`, which equals the rect width. With `whole`, a top row's chunks end exactly at `sizedOf(row)`, so the two paints differ only outside the rects.
- `paintZoomRow` replays `paintChunks` for `r < step`. That is the frame's loop, because `whole` implies `step <= rows`. The gutter and fill are outside the rect.
- The math-script replay draws the span's whole `n`-cell run with the frame's own `drawCells` call, and only the one rect cell is compared.

## Checks

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| `V2` | `bun test --timeout=20000 test/ui/sized-text.test.ts` | 15 pass, 1 fail. The failure is "a resize or a resume from a tool hand-off sends the sized text again": `renderer.suspend()` throws "Native scene suspension requires completed terminal setup and no pending transition" at `src/ui/shell.ts:389`. This is the expected G3 case. Every other existing case passes | `Passed` |
| `V3` | New case "a heading of wide characters and graphemes is sent once and not again while nothing changes" (`test/ui/sized-text.test.ts:234`) | Passes. It asserts the OSC 66 draws for `中` and `👍🏽` on the first frame and nothing on the next unchanged frame | `Passed` |
| `bun run check` | `bun run check` | Biome clean (1 warning and 2 infos in untouched files such as `src/ui/catppuccin.test.ts`), tsc clean, knip clean. 2017 pass, 2 fail: both in `src/workspace/git-watcher.test.ts`, the expected A10 watcher tests | `Passed` |
| `V2` assertions unchanged | `git diff a8100d1..5cc5e6e -- test/ui/sized-text.test.ts` | Changed lines: `Heading.renderSelf` now passes a paint function, the `mount()` harness changed (`setupTerminal`, `ManualClock`, a 5 ms wait before clearing output), `terminalWriter` was renamed `sessionWriter` in one `typeof` check, and the new V3 case was added. No byte or cell-count expectation changed | `Passed` |

The harness changes do not hide a behaviour change:

- `setupTerminal` matches production, where the renderer's terminal is always set up.
- `ManualClock` only stops renders the test did not ask for.
- The 5 ms wait lets OpenTUI's own reply-triggered mode bytes (`ESC[?2027h ESC[?2004h`) land before output is cleared, so they don't count toward the next frame's output.

None of them touches the erase, frame, and draw order that the assertions check.

## Integration

Not applicable — group scope

## Findings

### G2-VER1 — Minor — Test coverage — The refused-write fallback has no test

- **Builds:** `REQ2`, `DES2`, `G2-T1`
- **Evidence:** `src/ui/sized-text.ts:372` `if (erase !== "" && !this.write(erase)) { this.refused(); return; }` and `:392` `!this.write(frameBytes(...))) this.refused();`. No case in `test/ui/sized-text.test.ts` makes `nativeSession.write` return `false`, and the implementer says so too. An injected `write` cannot reach these branches, because the constructor wraps it to always return `true`.
  - The timing also needs pinning. A refusal in `step` sets `forceFullRepaintRequested` during post-process, and OpenTUI 0.6.6 reads that flag in this same frame's `presentNativeScene` commit and resets it after (`node_modules/@opentui/core/chunk-bun-6qjat6qa.js:24426,24455`). So the full repaint lands on the current frame, which has no erase. The next frame is only `fresh`, not the "next frame fresh after a full repaint" that `A6` describes.
  - A refusal in `flush` happens after the reset, so there the next frame is both repainted and fresh, as designed.
- **Impact:** A regression in the one failure path `DES2` adds would go unnoticed, for example dropping `fresh` or skipping `requestRender`. A stale or displaced sized glyph could then stay on screen under output-queue pressure.
- **Resolution:** Add a component case that stubs the renderer's `nativeSession.write` to return `false` once. Assert that the next frame sends every draw again (and erases the old areas) after a full repaint. Either confirm that the current-frame repaint in the `step` refusal is acceptable, or move the flag so it applies to the next frame.
- **Proof to close:** The new refused-write case passes in `bun test --timeout=20000 test/ui/sized-text.test.ts`.

## Test Coverage

- **Covered:**
  - Erase before the frame and draws after it.
  - A covered draw is not sent, and its 12 cells are rewritten.
  - Resend after a move, a cell change, a resize, and a forced full repaint.
  - Nothing is sent on an unchanged frame.
  - Note headings and math scripts through the shell.
  - Grapheme and wide cells compared across the scratch and frame buffers (V3, whose RED was shown with a temporary mismatch edit).
- **Missing:**
  - The refused-write fallback (G2-VER1).
  - The scratch buffer being re-created after a resize. This is exercised only indirectly, by the resize half of the resume case.
- **Low-value:** The `typeof sessionWriter(...)` check only proves an export exists. It predates this change and was only renamed.

## Scope Changes

- `terminalWriter` was renamed `sessionWriter`, as the plan describes.
- The `test/ui/sized-text.test.ts` harness gained `setupTerminal`, `ManualClock`, and a 5 ms pre-frame wait. The implementer reported all three, and no assertion changed.
- `src/ui/widgets/zoom-text.ts` is listed in `G2-T1` but needed no change, because the `paintZoomRow` signature did not change.

## Blockers and Unverified Items

- The resume half of `V2` is unverified until G3 makes `Shell.suspend`/`resume` work on the 0.6 transitions.
- `SizedText.destroy()` is never called in production: `Shell.destroy` (`src/ui/shell.ts:402`) only destroys the renderer, both before and after this change. So the scratch buffer is released by its owner, `renderer.nativeScene`, not by `SizedText.destroy`. This matches the code before this change and is not a finding.
- Behaviour in a real terminal is covered by `V7`, which is outside G2.
