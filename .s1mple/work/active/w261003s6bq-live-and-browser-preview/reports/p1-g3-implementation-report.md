# P1-G3 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-1-terminal-live-preview.md`
- **Group:** `P1-G3`
- **Tasks:** `P1-G3-T1`, `P1-G3-T2`, `P1-G3-T3`, `P1-G3-T4`
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g3-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G3-T1` | Scratch spike only (not committed): `spike-images.ts`, `launch.sh`, `analyze.ts`, `make-fixtures.ts` in the session scratchpad. The script created `test/fixtures/images/{diagram.png,broken.png,logo.svg}`, which were committed with T2 as the plan places them | The spike ran in Ghostty, kitty, WezTerm, iTerm2, and Terminal.app, plus WezTerm and iTerm2 with sixel forced. Every cell is `cleared` (see "Graphics spike outcome") | No change — the outcome is recorded below; fixtures are in `119d9c9` | `Completed` |
| `P1-G3-T2` | `src/workspace/images.ts`: `WEB_IMAGE`, `readImage`, `readCapped`, `fetchImage`, `createImageLoader`. `src/workspace/images.test.ts`: 5 cases against `Bun.serve` on `127.0.0.1:0`. The fixtures `diagram.png` (240×120), `broken.png` (`malformed-data`), and `logo.svg` (`unsupported-format`) | RED: `bun test src/workspace/images.test.ts` → module not found, 0 pass. GREEN: 5 pass, 0 fail, 23 expects. `bun run check` → 706 pass | `119d9c9` | `Completed` |
| `P1-G3-T3` | `src/ui/images.ts`: `ImageTier`, `imageTier`, `ImageCache` (`get`, `size`, `cellAspect`, `bytes`, `clear`; LRU with `dispose()`, 64 MiB, 60 s retry, an over-limit image refused from its `imageInfo` header). `src/ui/images.test.ts`: 7 cases | RED: `bun test src/ui/images.test.ts` → module not found, 0 pass. GREEN: 7 pass, 0 fail, 43 expects. `bun run check` → 713 pass | `3bc3959` | `Completed` |
| `P1-G3-T4` | `src/ui/widgets/image.ts:paintImage`. `src/ui/shell.ts`: `ShellDeps.loadImage`, `ShellDeps.capabilities`, `GraphicsSupport`, `ViewDeps.images`, `ViewDeps.capabilities`; `createShell` builds one `ImageCache`, re-runs the views on a finished load, and clears the cache on `destroy`. `src/ui/editors/text-view.ts:layoutFrame` host (`imageSize`, `cellAspect` from `deps.images`). `src/ui/images.ts`: the `cell` pixel source and `cellPixels()` replace the T3 `cellAspect` option. `src/app/main.ts`: `createImageLoader(ws.root)` and `registerWidgetPainter("image", paintImage)`. `test/support/ui.ts`: `MountOptions.capabilities`, `files`, `loads`, the `image` painter. `test/integration/config.test.ts`: `loadImage`. `test/ui/live-preview.test.ts`: 3 new cases; the tour case now expects `[image: diagram.png]` | RED: `bun test test/ui/live-preview.test.ts` → `Cannot find module '../../src/ui/widgets/image'`, 0 pass. GREEN: 7 pass, 0 fail. `bun run check` → 713 pass; `CI=true bun run test:ci` → 125 pass | `3d9c36a` | `Completed` |

### Graphics spike outcome

OpenTUI 0.5.14 clears every image placement itself. The painter must call `drawImage` once per frame for each image on screen and never for an image that is off screen. No clearing call exists or is needed. The V18 assertion is therefore that `drawImage` is not called in the frames after the image scrolls off, the view switches, or the buffer switches, and that a widget cut by the window bottom draws only its visible rows with a cropped source.

**Method.** `spike-images.ts` draws `diagram.png` (40 × 10 cells) through `OptimizedBuffer.drawImage` and changes phase every 2.5 s:

```text
1 draw at row 3 → 2 half off the top (y = −5) → 3 half off the bottom → 4 the same, cropped by the caller
→ 5 redraw → 6 view switch (text only) → 7 redraw → 8 buffer switch (other text)
```

Each terminal ran the script under `/usr/bin/script -q`, so the exact bytes OpenTUI sent were recorded. At each phase the script logged the detected capabilities and emitted an OSC 2 title marker. `analyze.ts` splits each recording at those markers and lists the kitty graphics commands, sixel images, block glyphs, and the screen rows written in each phase.

**Results** (`cleared` in every cell):

| Terminal (protocol) | Scroll half off | Switch view | Switch buffer |
|---|---|---|---|
| Ghostty (kitty, auto) | cleared — `a=d,d=i` deletes the old placement, then `a=p … r=5,y=60,h=60` places the visible half | cleared — `a=d,d=I` | cleared — `a=d,d=I` |
| kitty (kitty, auto) | cleared — same commands as Ghostty | cleared — `a=d,d=I` | cleared — `a=d,d=I` |
| WezTerm (kitty, auto; reports kitty and sixel) | cleared — same commands as Ghostty | cleared — `a=d,d=I` | cleared — `a=d,d=I` |
| WezTerm (sixel, forced) | cleared — the cells under the old image are rewritten (rows 1–5 in phase 3 with unchanged text), and a 27-band half image is drawn | cleared — no sixel; every row rewritten | cleared — no sixel; every row rewritten |
| iTerm2 3.6.11 (kitty, auto; reports kitty and sixel) | cleared — same commands as Ghostty | cleared — `a=d,d=I` | cleared — `a=d,d=I` |
| iTerm2 3.6.11 (sixel, forced) | cleared — the old image's rows are rewritten; a 20-band half image is drawn | cleared — no sixel; every row rewritten | cleared — no sixel; every row rewritten |
| Terminal.app (blocks, auto) | cleared — block glyphs are ordinary cells: 400 at full size, 160 half off the top, 200 half off the bottom | cleared — 0 glyphs | cleared — 0 glyphs |

**Findings that shape `paintImage`:**

- **Placements are tracked per frame.**
  - kitty: one placement per image (`p=1`). OpenTUI deletes it (`a=d,d=i`) before placing it elsewhere, and deletes the image (`a=d,d=I`) on the first frame that does not draw it.
  - sixel: OpenTUI rewrites the cells the image covered.
  - blocks: ordinary cells, cleared by the cell diff.
- **OpenTUI clips at the buffer edge.** Phase 4, where the caller cropped the image, sent no new command after phase 3, so caller-side cropping matches OpenTUI's own clip. The window bottom is not the buffer edge, because the statusline sits below it. `paintImage` therefore crops the source to the visible rows, and the test asserts this.
- **`drawImage` blanks its own cells.** For kitty and sixel it blanks the cells under the image; for blocks it writes block glyphs (checked in the test renderer). Placements use `z=-1073741823`, under text. `paintImage` blanks the whole target first, so no stale text shows beside a narrower image.

**Evidence** (session scratchpad, not committed): `/private/tmp/claude-501/-Users-hieunguyen-git-hieu-projects-so/f4fdb1c6-615d-4aaa-a44e-105096aa170a/scratchpad/`

- `evidence/{ghostty,kitty,wezterm,wezterm-sixel,iterm,iterm-sixel,terminal}.analysis.txt`: per-phase analysis.
- `evidence/spike-<terminal>.log`: detected size, pixel resolution, `kitty_graphics`, `sixel`, terminal name, chosen protocol, and each `drawImage` call.
- `tty-<terminal>.raw`: raw byte recordings.
- `spike-images.ts`, `launch.sh`, `analyze.ts`: the spike, the launcher, and the analyzer.

**Screenshots:** Not run, because macOS Screen Recording permission is missing. The system TCC database lists `com.mitchellh.ghostty|0` (denied), and Ghostty is the app responsible for this session. kitty, WezTerm, iTerm2, and Terminal.app have no grant. `screencapture -x` of both displays returned only the wallpaper and menu bar, and `CGWindowListCopyWindowInfo` returned no windows. The agent did not open macOS permission prompts on the user's screen. Each cell above is judged from the recorded protocol bytes, which are what the terminal draws; it has not been confirmed visually. The terminals were launched with `open -na Ghostty`, `kitty`, `wezterm start --always-new-process`, and `open -a iTerm|Terminal <script>.command`, then quit. Only the user's pre-existing Ghostty process (29823) is still running.

### Group Change Range

- **Starting commit:** `0876a21` (clean tree; no pre-existing staged or unstaged changes)
- **Final commit:** `3d9c36a`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed` — 713 pass, 0 fail, 18 snapshots at `3d9c36a`.
- `CI=true bun run test:ci` → `Passed` — 125 pass, 0 fail, 28 snapshots at `3d9c36a`.
- **Spike recorded** → `Passed`: the table above names the V18 clearing assertion. It is implemented as `test/ui/live-preview.test.ts` "an image is drawn only while it is on screen, so no placement outlives it".
- **Single network call** → `Passed`:
  - `rg -n "fetch\(" src --glob '!**/*.test.ts'` → no match, because the call is written `(o.fetch ?? fetch)(url, …)`.
  - The wider `rg -n "\bfetch\b" src --glob '!**/*.test.ts'` → only `src/workspace/images.ts` (lines 69, 72, 91, 114).
- **Layer rules** → `Passed`:
  - `@opentui/core` is imported only in `src/ui` (`images.ts`, `shell.ts`), and `test/boundaries.test.ts` passes inside `check`.
  - `git diff 0876a21..HEAD --stat` touches nothing in `src/core`: the kernel, `RenderLine`, `layoutText`, the image renderer, and `AppState` are unchanged.
- **No work-process identifiers** → `Passed`: `rg -n "W261|REQ[0-9]|DES[0-9]|\bV[0-9]{1,2}\b|P1-G|G4\b|UV[0-9]"` over every added source and test file returns no match.

### Deviations and Remaining Issues

- **A finished image load re-runs the views from the current state; it is not a bare `renderer.requestRender()`.**
  - Why: `EditorView` lays out only in `show()`, which runs on a store change. A bare render request would leave a loaded image squeezed into its one placeholder row until the next keystroke.
  - What it does: `createShell` sets `repaint = () => paint(store.get())`, and `paint` ends with `renderer.requestRender()`.
  - What it does not do: no action is dispatched, and no bytes, sizes, or decoded images enter `AppState`.
  - Preserve this. The V15 and V18 tests depend on the reserved rows appearing after the load settles.
- **`ImageCache` surface beyond the design sketch:**
  - The constructor takes `cell?: () => {width, height} | undefined`, the cell size in pixels, instead of an aspect. `paintImage` needs the pixel size for sixel (`pixelWidth` and `pixelHeight`, as OpenTUI's `ImageRenderable` passes them), and `cellAspect()` derives from it, defaulting to 0.5.
  - `cellPixels()` is the accessor `paintImage` uses for those sizes.
  - `bytes()` exposes the 64 MiB bound to tests.
  - `clear()` disposes images on shell destroy and between tests.
- **`ViewDeps.capabilities` is required.** `createShell` defaults it to `{ caps: renderer.capabilities, hasResolution: renderer.resolution !== null }`, so painters never handle a missing value. `GraphicsSupport` names the shape and is shared with `MountOptions.capabilities`.
- **V15 uses a 16-row image, not 20.** At 120×24 the window has 21 text rows. P1-G1's `imageRows` caps an image at `floor(21 × 0.8) = 16` rows, so 20 rows cannot occur. The test asserts exactly that reserved height, then steps `j` from line 0 to 29 and checks the hardware cursor row against the cursor line's gutter number at each step.
- **V50 serves the 464-byte `diagram.png`, not a 1 KiB PNG.** Byte equality is the assertion, so the size does not matter.
- **Files changed outside the plan's lists:**
  - `test/integration/config.test.ts`: `ShellDeps.loadImage` is now required, and this harness mirrors `main.ts`, so it passes `createImageLoader(root)`.
  - The P1-G2 tour case in `test/ui/live-preview.test.ts`: it now expects `[image: diagram.png]` instead of the `[image]` fallback, because the `image` painter is registered and the mount has no image files.
- **The V18 clearing assertion uses a `drawImage` spy.** The OpenTUI test renderer exposes no terminal output, and kitty or sixel `drawImage` leaves blank cells in `captureCharFrame`. The test also checks that the old rows show the new view's text, and that a cut widget draws `37 − (y − 1)` rows with `sourceHeight = round(120 × rows / 24)`.
- **Spike launch methods:**
  - The first iTerm2 attempt used `osascript`, which stalled, most likely on a macOS Automation consent prompt. It was stopped, and iTerm2 and Terminal.app were launched with `.command` files instead.
  - WezTerm and iTerm2 report kitty graphics, so OpenTUI's `auto` picks kitty in both. Sixel was covered by forcing it.
- **No manual run of the real `so` binary with an image.** Without screen capture there was no visual check. The component tests and the spike's protocol recordings are the evidence.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `Pending verification`
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — every task is implemented and committed, and every group check passes.
- **Final report commit:** returned to the orchestrator.
- **Final commits:** `119d9c9`, `3bc3959`, `3d9c36a`
- **Final checks:** `bun run check` → 713 pass; `CI=true bun run test:ci` → 125 pass.
- **Remaining issues:** None. The spike was verified at the protocol level, not visually, as described above.
