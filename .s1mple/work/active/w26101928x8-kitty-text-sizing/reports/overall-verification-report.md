# W26101928X8 Overall Verification Report

## Scope

- **Scope:** `overall`
- **Tasks:** `G1-T1`, `G1-T2`, `G1-T3`, `G1-T4`, `G2-T1`, `G2-T2`, `G2-T3` — all tasks
- **Change range:** `53fadeb..b4b3b22`
- **Report:** `.s1mple/work/active/w26101928x8-kitty-text-sizing/reports/overall-verification-report.md`

## Status

`Failed`

The change works as designed and every automated check passes (failures were load-dependent timing tests outside the change that pass when rerun alone). One Minor gap remains: with `editor.wrap` off, revealing a long sized heading in `live` view moves the lines below it, which `REQ4` forbids. The ship file records this as a known limitation, but no Decision approves it, and the fix is small (`OVR-VER1`).

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1` | `DES2`, `DES5`, `DES6` | `V1`, `V4`, `V7` | `src/core/lang/markdown/renderers/heading.ts:sizedBlock` (ATX and setext H1/H2 → one `sizedText` block widget, `rows: 2 × wrapped rows`); `src/core/kernel/view/sized.ts:wrapSized`/`chunksOf` (2× runs, 1.5× chunks ≤ 4 cells at `2·ceil(1.5w/2)`); `src/ui/widgets/sized-text.ts:paintSizedText`; `src/ui/sized-text.ts:blockBytes`/`chunkBytes`/`frameBytes`; V7 dump `s0-start.ansi` shows `[s2:█ Raft]` and 1.5× H2 rows | `Met` |
| `REQ2` | `DES1`, `DES2`, `DES4` | `V1`, `V3`, `V6` | `src/core/state/markdown-view.ts:65` `sizedText: host.sizedText && sizedText`; `src/ui/editors/text-view.ts:851` host from `capabilities().caps?.scaled_text === true`; renderers branch only on `ctx.sizedText`; `SizedText.step` returns at once with no draws and nothing shown (`src/ui/sized-text.ts:297`); PTY test finds no `]66;s=`/`]66;n=` besides OpenTUI's one-space probe; herdr dumps `h0`/`h1.ansi` show today's output | `Met` |
| `REQ3` | `DES5`, `DES6` | `V5`, `V7` | `src/ui/sized-text.ts:planFrame` (covered → not sent; old and touched areas erased with `eraseBytes` before the frame and marked for rewrite; resend when new, moved, touched, `fresh`, or `forceFullRepaintRequested`); `src/ui/shell.ts` `invalidate()` on `resize` and `resume`, repaint on `capabilities`; painter registers only whole blocks; V7 grid check aligned after scroll, picker, live reveal, resize | `Met` |
| `REQ4` | `DES3` | `V2`, `V7` | `src/core/lang/markdown/live-preview.ts:109` `keepSizedRows` spacer = widget rows − source rows wrapped at `v.width`; correct with `editor.wrap` on (V2 incl. a wrapped source and setext), wrong with `editor.wrap` off | `Not met` (`OVR-VER1`) |
| `REQ5` | `DES4`, `DES5`, `DES6` | `V3`, `V4`, `V7` | `src/core/kernel/view/sized.ts:scriptSpans` (pairs of any narrow character, `undefined` on a wide one); `src/core/lang/markdown/renderers/math.ts:mathRuns`/`mathTextSpans` (block and inline math, nested scripts flattened, cache key `hash|sizedText`); `inline.ts:footnoteRef`, `footnote.ts` definition labels; `src/ui/editors/text-view.ts:paintLine` registers each `script` cell with `scriptBytes` | `Met` |
| `REQ6` | `DES1` | `V8` | `src/core/config/schema.ts:117` `sizedText: z.boolean().default(true)`; `src/core/state/settings.ts:152` `SETTINGS` choice entry | `Met` |

## Checks

Load at the start of the runs: `uptime` load averages 6.21 / 7.72 / 8.55 (`bun run check`), 4.52 / 7.10 / 8.28 (`test:ci`), 5.07–5.54 for the reruns.

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| `V1` | `bun test src/core/lang/markdown/renderers/heading.test.ts src/core/kernel/view/sized.test.ts` | 9 pass, 0 fail | `Passed` |
| `V2` | `bun test src/core/lang/markdown/live-preview.test.ts` | 34 pass, 0 fail | `Passed` |
| `V3` | `bun test src/core/lang/markdown/renderers/math.test.ts src/core/lang/markdown/live-preview.test.ts` | 40 pass, 0 fail | `Passed` |
| `V4` | `bun test src/ui/sized-text.test.ts` | 4 pass, 0 fail | `Passed` |
| `V5` | `bun test test/ui/sized-text.test.ts` | 8 pass, 0 fail (draw once, move, cell change, resize, resume, forced full repaint, float over row 2 with a 12-cell rewrite, cut at the bottom, pre-frame erase, `writeOut` accessor) | `Passed` |
| `V6` | `bun test --timeout=20000 test/e2e/sized-text.test.ts` | 1 pass, 0 fail | `Passed` |
| `V7` | Manual, run by the orchestrator; judged from `scratchpad/v7/*.ansi` with its `grid.ts` checker | `s0`–`s2`, `s4`–`s7`, `h0`, `h1`: `OK: every border at column …`. `s3-picker` reports rows at column 137 against the picker's column 17; the dump shows these are the rows outside the open picker, not shifted rows, and the H2s under the picker fell back to normal size. herdr dumps hold no OSC 66 and show Unicode scripts and normal headings. Not run live: `<leader>gg` and a forced full repaint; both are covered by `V5` | `Passed` |
| `V8` | `bun test src/core/state/settings.test.ts` | 16 pass, 0 fail | `Passed` |
| `bun run check` | `bun run check` | Biome (581 files, no fixes), `tsc`, and knip clean; tests 1985 pass, 4 fail, all in `src/workspace/watcher.test.ts` (3) and `src/workspace/git-watcher.test.ts` (1). Rerun alone: 13 pass, 0 fail. Neither file touches the changed code | `Passed` |
| `bun run test:ci` | `bun run test:ci` | 424 pass, 3 fail: `test/ui/esc.test.ts` (arrow key dispatched in 10.28 ms against a 10 ms bound), `test/integration/dotfiles.test.ts` and `index-host.test.ts` (5 s `waitFor` timeouts). Rerun alone: 10 pass, 0 fail. The esc test measures key-to-store dispatch, which the change does not touch; the integration files are the known flakes | `Passed` |
| Per-frame cost | Scratch probe: `layoutNote` in `reading` view, 240 lines with 60 H1/H2 headings, inline math, and footnotes, width 100, 50 runs | 1.60 ms per layout with sizing off, 3.49 ms with it on. A real window shows far fewer headings | `Passed` |
| Work-process IDs and core purity | Diff scan for `W26101928X8`, `REQ`, `DES`, `V<n>`, `G<n>-T`, `LIVE1`; import scan of new core files; `test/boundaries.test.ts` in `bun run check` | No IDs in code, tests, or logs; no `@opentui`, `node:`, or `bun` import in `src/core`; boundaries test passes | `Passed` |

## Integration

The groups meet at three contracts. Each producer in `src/core` matches the way `src/ui` consumes it:

```text
config.preview.sizedText ─┐
renderer.capabilities ────┴→ ViewHost.sizedText (text-view.ts:851) → PreviewCtx.sizedText (markdown-view.ts:65)
  → heading.ts  → Widget{type:"sizedText", data: SizedBlock} → paintSizedText → SizedText.draw(blockBytes)
  → math/inline/footnote → Span.script → paintLine → SizedText.draw(scriptBytes)
  → SizedText.step (post-process) → erase + rewrite marks → frame event → one writeOut
```

- **`SizedBlock`:** `heading.ts` sets `rows: 2 × data.rows.length`; `paintSizedText` reads `block.rows[floor(i / 2)]`, paints two screen rows per chunk row, and registers rects of `h: 2`. Rows reserved equal rows drawn. The painter registers the block only when it gets every row and no row is wider than the window (`whole`).
- **`Span.script`:** `scriptSpans` gives each pair one narrow cell (`text` = first character). `paintLine` draws that cell and registers it at `w: 1, h: 1` with the span's final style, so selection, cursorline, and theme changes change the bytes and cause a resend.
- **`ViewHost.sizedText`:** set from the live `renderer.capabilities` on every build, and the shell repaints on OpenTUI's `capabilities` event (`shell.ts`), so sizing starts after the probe answers. V7's kitty dumps show sized text, which needs this path. `BaseView` also sets the field, so the type stays complete; bases draw no sized text.
- **Setting:** the `SETTINGS` entry writes `["preview","sizedText"]` (V8). `markdownViewContextFor` reads it for every frame. Turning it off leaves no draws, so `planFrame` erases and rewrites every area shown last frame.
- **Final scope:** H3 and deeper, the `source` view, tables (own `inlineMath` handling in `table.ts`), note embeds (`sizedText: false` in `embedRows`), the browser preview (`src/preview` and `html.ts` unchanged), and other file types do not change.

## Findings

### OVR-VER1 — Minor — Correctness — With `editor.wrap` off, a revealed sized heading moves the lines below it

- **Builds:** `REQ4`, `DES3`, `V2`, `G1-T3`
- **Evidence:** The spacer subtracts the source's rows *wrapped* at the window width:

  ```ts
  // src/core/lang/markdown/live-preview.ts:112-115
  for (let l = start.line; l <= end.line; l++)
    source += wrapLine(v.buf.line(l), v.width, 1).length;
  const blank = d.widget.rows - source;
  ```

  With `editor.wrap` off the UI draws every source line on one row:

  ```ts
  // src/ui/editors/text-view.ts:766-768
  const starts = wrap
    ? wrapLine(text, textW, tabWidth, prefix)
    : [this.leftCol];
  ```

  The `V2` case at width 30 shows the effect. `# Consensus guarantees for distributed leaders` is an 8-row sized block, and the spacer is 6 rows because the source wraps to 2. With wrap off, the revealed source takes 1 row, so the total is 7 rows and every line below moves up one row when the cursor enters the heading. The same mismatch occurs with wrap on when a heading contains a tab, because the spacer counts a tab as one cell and the UI uses `editor.tabWidth`. The ship file lists the wrap case under "Known limitation" and says the core does not know the wrap setting. No Decision approves it.
- **Impact:** `REQ4` and `DES3` say the lines below never move when the cursor enters or leaves a heading. With `editor.wrap = false`, any H1/H2 whose source is wider than the text width (a narrow split or a long title) makes the screen jump by `wrapped rows − 1` on each cursor entry and exit.
- **Resolution:** Give the preview context the two settings it needs to measure the source like the UI: `editor.wrap` and `editor.tabWidth`, which `markdownViewContextFor` already reads from `s.config`. Count one row per source line when wrap is off, and wrap with the real tab width when it is on. Alternatively, get the user's approval to exclude `editor.wrap` off from `REQ4` and record it in the ship file's Decisions.
- **Proof to close:** One more `V2` case in `src/core/lang/markdown/live-preview.test.ts`: with wrap off, a heading whose source is wider than the window takes the same total screen rows with the cursor on and off it. Then `bun test src/core/lang/markdown/live-preview.test.ts` and `bun run check` pass.

## Test Coverage

- **Covered:**
  - Sized layout at both scales: chunking, wrapping, mid-word breaks, styled runs, setext, H3, and the off path (`V1`).
  - Reveal rows with wrap on, including a wrapped source and setext (`V2`).
  - `mathRuns` with nested flattening, math block and inline pairs, footnote reference and definition pairs, and the off path (`V3`).
  - Exact OSC 66, SGR, and synchronized-update bytes, plus control-character cleaning (`V4`).
  - Frame decisions against OpenTUI's real diff, including forced full repaints and the pre-frame erase (`V5`).
  - No sizing bytes on a terminal without support (`V6`).
  - The setting default and picker (`V8`).
- **Missing:**
  - Reveal rows with `editor.wrap` off (`OVR-VER1`).
  - `PreviewCtx.sizedText` with `host.sizedText` true and `preview.sizedText` false. This is one `&&` at `markdown-view.ts:65`, and V6 covers only the host-off side.
  - The `capabilities` event repaint. V7 covers it live, and no automated test does.
  - The fallback when a math script or footnote label holds a wide character. This is a `DES4` rule; `scriptSpans` returns `undefined`, and no test pins the result.
- **Low-value:** None.

## Scope Changes

| Deviation | Judgment |
|---|---|
| Setext H1/H2 are sized (`a57382e`) | Accepted. `REQ1` covers every H1/H2. Tests cover the block range over the text lines and underline, and the reveal of both lines |
| Scripts inside a sized heading keep their Unicode form (`heading.ts`, the `unsized` input) | Accepted. `SizedChunk` draws one scale per chunk and has no script field, so a formula in a heading never mixes Unicode and half-size scripts (`A9`). TeX without a Unicode mapping (`# Quorum $Q_{w}$`) shows its source as it does today |
| Note embeds never size text (`renderers/embed.ts:104`) | Accepted. Embeds are a stated non-goal |
| `LIVE1` pre-frame erase (`eraseBytes`, `2b3ded8`) | Accepted. It extends `DES5` to match kitty's observed behaviour (lower-row OSC 66 writes are displaced after a top-row erase). The probe and replay evidence support it. `V5` checks that the erase comes before OpenTUI's frame and is not repeated on unchanged frames. The erase bytes go out before OpenTUI's synchronized update and not inside it. This is a possible one-frame flicker; V7 showed no visible defect |
| Forced full repaint detection (`fullRepaintFlag`, private `forceFullRepaintRequested`) | Accepted. It closes `G2-VER1`. Like `writeOut`, it is read through one accessor that throws if OpenTUI removes the field, and `V5` exercises it |
| `editor.wrap` off spacer, listed as a known limitation | Not accepted; see `OVR-VER1` |

## Blockers and Unverified Items

- `V7` was run by the orchestrator, not rerun here. It was judged from the screen dumps and the grid checker. The `<leader>gg` hand-off and an OpenTUI-forced full repaint were not exercised live. They rest on `V5`'s resume and forced-repaint cases.
- Output ordering on Linux, where OpenTUI has no render thread, was checked only by reading OpenTUI's code (`chunk-bun-j2z63cdy.js:10083-10106`: post-process, native render, then the `frame` event). CI's Linux `test:ci` job will run the component and PTY suites there.
- This verifier started no long-lived processes. Its probe file was removed, and no test process remained.
