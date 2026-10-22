# W261022JQU1 Overall Verification Report

## Scope

- **Scope:** `overall`
- **Tasks:** `G1-T1`, `G1-T2`, `G2-T1`, `G2-T2`, `G3-T1`, `G3-T2`, `G4-T1`
- **Change range:** `80103fb..c81b73f`
- **Report:** `.s1mple/work/active/w261022jqu1-opentui-0-6/reports/overall-verification-report.md`

## Status

`Passed`

Every row is met, every check passes apart from watcher and external-change cases that also fail on master, and no finding remains. Three items stay open:

- The CI run on the PR belongs to Deliver: no PR or remote branch exists yet. Every CI job's commands passed locally except `zizmor`, which is not installed here; no workflow file changed in the range.
- Whether kitty images and sized glyphs look right needs human eyes. Screen text, the debug logs, and the raw terminal bytes were checked instead.
- herdr reports no scaled-text support, so the herdr run did not exercise sized glyphs (OSC 66).

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1` | `DES1` | `V1`, `V6` | `package.json` `"@opentui/core": "0.6.6"`; `bun install --frozen-lockfile` reports no changes. Owned test buffers: `src/ui/cell-width.test.ts` and `src/ui/widgets/sized-text.test.ts` create a `ResourceContext`, pass it as `owner`, and read cells through `withBuffers`. `test/ui/editor-options.test.ts` also reads through `withBuffers`. `bun run check`, `bun run test:ci`, `bun run build`, `bun run bench`, and `bun audit` all pass locally, apart from the master-shared watcher cases (`A10`) | `Met` |
| `REQ2` | `DES2` | `V2`, `V7` | `src/ui/sized-text.ts:245` `sessionWriter` writes UTF-8 bytes through the private `nativeSession.write` and throws an error naming the member when it is missing. `:261` `fullRepaintFlag` checks the flag at construction. `:343` `refused()` marks the next frame fresh, sets `repaintNext`, and calls `requestRender`. `step` sets `forceFullRepaintRequested` on the next frame (`:349`) | `Met` |
| `REQ2` | `DES3` | `V2`, `V3`, `V7` | `src/ui/sized-text.ts:311` `draw(rects, bytes, paint)`. `:328` `replay` uses one scratch buffer owned by `renderer.nativeScene`, re-created on a size change and destroyed in `destroy()` (`:323`). Painters: `src/ui/widgets/sized-text.ts:46` `paint(buf, toEdge)` (the frame paints to the edge; the replay at `:73` paints to the rect width), `src/ui/zoom-row.ts:68` `paintChunks` (used for the frame at `:91` and the replay at `:100`), and `src/ui/editors/text-view.ts:230` (the script draw replays the same `drawCells`) | `Met` |
| `REQ2` | `DES4` | `V2` | `src/ui/sized-text.ts:364` reads the current buffer and the scratch inside nested `withBuffers` and calls `planFrame` unchanged. `:385` flips the fg alpha bits of rewrite cells in the current buffer. `next.buffers` (`:363`) is read only in the post-process step, which 0.6 allows | `Met` |
| `REQ3` | `DES5` | `V4`, `V7` | `src/ui/shell.ts:449` `async suspend` sets `suspended`, awaits `renderer.suspend()`, clears `suspended` again if it throws, and clears the image slots once the hand-over succeeded. `:462` `async resume` awaits `renderer.resume()`, then clears `suspended`, invalidates sized text, and repaints. `src/app/tool-host.ts:55` awaits the suspend and releases interrupts on its failure; `:75`/`:87` await `restore` and `resume` | `Met` |
| `REQ3` | `DES6` | `V5`, `V7` | `src/ui/shell.ts:480` `closed()` resolves when `renderer.closed` settles and logs a rejection as `terminal.closeFailed`. `src/app/lifecycle.ts:82` awaits it after `destroy()` on the single `shutdown` path that every exit uses, before stderr and `exit`. `createRenderer` (`src/ui/shell.ts:111`) guards `destroy()` and awaits `closed` on a setup failure, as OpenTUI's `createCliRenderer` does (`node_modules/@opentui/core/chunk-bun-6qjat6qa.js:21172`) | `Met` |
| `REQ3` | `DES7` | `V4` | `test/support/ui.ts:112` `await t.renderer.setupTerminal()`. `test/ui/git.test.ts` and `test/ui/sized-text.test.ts` await `shell.suspend()`/`resume()`, and `test/ui/sized-text.test.ts` sets its own harness up with `setupTerminal` | `Met` |
| `REQ4` | `DES8` | `V1`, `V6`, `V7` | `src/core/lang/markdown/renderers/mermaid.ts` calls `mermaid().renderMermaidSVG` directly; `withoutWindow` is gone from `src` and `test`. Every `test/ui` and `test/e2e` case passes; live runs covered the note, PDF, picture, mouse, picker, Git hand-off, and exit in kitty and herdr | `Met` |

## Checks

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| `V1` | `bun run check` | Biome clean (1 warning and 2 infos in files the range does not touch), tsc clean, knip clean. Units: 2019 pass, 1 fail (`src/workspace/git-watcher.test.ts` "a failing directory is logged…"). Two more runs of the unit set on HEAD: 2017/3 fail (all in `src/workspace/watcher.test.ts`), then 2020/0 fail. Master `.tmp/base` passed 2019/0 twice. The watcher files pass 13/13 alone, three times on HEAD and once on master. `src/workspace` imports no OpenTUI and is unchanged in the range, so this is the intermittent `A10` watcher flake | `Passed` |
| `V2` | `bun test --timeout=20000 test/ui/sized-text.test.ts` | 17 pass, 0 fail. The range diff changes only the harness: the `Heading` paint function, `setupTerminal`, `ManualClock`, a 5 ms pre-frame wait, the `sessionWriter` rename, and awaited suspend/resume. It adds the refused-write case (`:159`) and the grapheme case (`:274`). No byte or cell-count assertion changed | `Passed` |
| `V3` | Same file, "a heading of wide characters and graphemes is sent once and not again while nothing changes" (`test/ui/sized-text.test.ts:274`) | Passes as part of the 17 | `Passed` |
| `V4` | `bun test --timeout=20000 test/ui/git.test.ts` | 23 pass, 0 fail, including "the shell keeps painting when the terminal cannot be suspended" | `Passed` |
| `V5` | `bun test --timeout=20000 test/e2e` | 34 pass, 0 fail in 69.7 s. Includes "the terminal is restored on every exit path" (`:q`, SIGTERM, SIGINT, an uncaught exception, a failure before the first frame), "the editor returns intact after the git tool is killed", "Ctrl-C does not quit; :q does", and NO_COLOR | `Passed` |
| `V6` local | `bun run test:ci` (twice on HEAD and twice on `.tmp/base`) | HEAD 431/7 fail, then 432/6 fail. Master 427/8 fail, then 427/8 fail. Every HEAD failure is a watcher, external-change, or LSP-timing case, and each also fails on master by name in these runs or in G4's report ("a card move after an external edit"). "a closed file written by a rename is reported to watching servers" fails alone on both trees (`--rerun-each 10`: HEAD 1/10, master 2/10). Every `test/ui` and `test/e2e` case passed | `Passed` |
| `V6` build | `bun run build && dist/so --version` | `so 0.0.0` | `Passed` |
| `V6` CI-job mirrors | `bun run bench`; `bun audit --audit-level=moderate` | Every bench metric is within its limit (for example `firstFrame` median 278.7 ms against a 600 ms limit, `liveKeystrokeP95` 12.0 ms against 48 ms). The audit found no vulnerabilities at moderate or above. `zizmor` is not installed locally; no `.github` file changed in the range | `Passed` |
| `V6` CI on PR | `gh pr list --head feat/opentui-0.6` | No PR and no remote branch yet. Deliver step 2 opens the PR and requires CI to pass | Not run at this stage (Deliver owns it) |
| `V7` kitty | My own kitty window (`--listen-on unix:.tmp/ovr/k.sock`, later `k2`/`k3` with `--dump-bytes`), `live.sh` running `bun run sandbox --profile <p>` with `SO_LOG=debug`, driven by `kitten @ send-text` and read with `get-text` | Run as journey steps below | `Passed` |
| `V7` kitty: note | `tour` profile, `:e tour.md`, scroll through H1–H3, math, and `diagram.png` | Headings and math scripts read back as multicell text: shorter rows with a blank second row. The raw bytes contain OSC 66 draws for H1 (`s=2:w=7:n=7:d=8`), H2/H3 (`n=4:d=5`), and script/footnote cells (`n=1:d=2`). Each draw sits in its own `ESC[?2026h ESC7 …` block after the frame's `ESC[?2026l`. Kitty graphics bytes: `a=q` 1, `a=t` 2, `a=p` 1, `a=d` 2 | `Passed` |
| `V7` kitty: zoom | `<leader>u=` then `<leader>u-` | The toast reads "text zoom 1.1×" and body rows become two-row sized text. After `u-` the toast reads "text zoom 1×" and the screen text equals the first capture, with no stale zoomed rows | `Passed` |
| `V7` kitty: mouse | SGR press, drag, and release sent as input (`ESC[<0;10;10M`, `ESC[<32;…M`, `ESC[<0;22;10m`) | so enters `VISUAL` with the cursor at the drag end | `Passed` |
| `V7` kitty: picker | `<leader>ff`, then Esc | The picker covers the H1 (the covered-draw path): the heading shows as plain text cut at the picker edge. After Esc the H1 reads back as multicell again | `Passed` |
| `V7` kitty: PDF | `intro` `consensus.pdf` (1 page) with `j`/`k`; `pdf` profile `docs/book.pdf` with `J J K` | `book.pdf` pages 1/5 → 3/5 → 2/5. The raw bytes show each page transmitted and placed (`a=t` 6, `a=p` 9, `a=d` 10 in that kitty) | `Passed` |
| `V7` kitty: hand-off | `intro` profile, `<leader>gg` from `consensus.pdf` and again from `Raft.md`; lazygit `q` | lazygit runs (status panel `vault → main`); after `q` the editor screen comes back whole. On `Raft.md` the H1 and math scripts read back as multicell after resume. The log holds two `git.tool.exit` lines at `info` | `Passed` |
| `V7` kitty: exit | `:q!` after each run | Each run printed `SO_EXIT=0` and returned to the `LIVE-PROMPT>` prompt | `Passed` |
| `V7` herdr | Separate session `so-ovr-w261022` in its own Ghostty (`open -na Ghostty --args "--command=/opt/homebrew/bin/herdr --session so-ovr-w261022"`, `HERDR_*`/`TERM_PROGRAM*` unset), driven by `herdr --session … pane send-text/send-keys/read` | `tour`: zoom `u=` shows the "text zoom 1.1×" toast and `u-` shows "1×". herdr reports no scaled text, so headings use the normal-size fallback. The mouse drag enters `VISUAL`, the picker opens and closes, and `:q!` gives `SO_EXIT=0` and the prompt. `intro`: `consensus.pdf` opens, `<leader>gg` runs lazygit, and after `q` the screen is intact, then `:q!` gives `SO_EXIT=0` | `Passed` |
| `V7` logs | `.sandbox/{tour,intro,pdf}/xdg/state/so/so.log` | Only `info` lines: `app.startup`, `app.firstFrame`, `index.start`/`ready`, and `git.tool.exit` (3). No `error` or `warn` lines, so no render or native error. No error toast on screen in any run | `Passed` |
| Removed-API sweep | `rg` over `src` and `test` | `.buffers` on an `OptimizedBuffer` appears only at `src/ui/sized-text.ts:363` (post-process). `OptimizedBuffer.create` always passes an `owner`. No unawaited `suspend`/`resume`: every call site awaits, apart from `child.stderr?.resume()`, a stream. No `getLayoutNode`, `useThread`, renderer `render(`, `requestAnimationFrame` global (only in the browser-site fixture), `on("resized")`, `writeOut`, or `createCliRenderer`. No draw call has unrounded division in its coordinates | `Passed` |
| Orphans | `pgrep -fl` for my kitty sockets, my Ghostty `--command`, `lazygit`, `fake-lsp`, `fake-chrome`, and anything under the worktree | None left. The user's kitty (10736, 64216), Ghostty (63311), herdr server (30710), and herdr client (43932) are still running and untouched | `Passed` |

## Integration

The four groups meet at the shell's terminal lifecycle, and they integrate as follows:

```text
createRenderer (G4) ─ setupTerminal; backdrop only when colourless ─► createShell
  └─ SizedText (G2) ─ sessionWriter + post-process step + "frame" flush
attach ─ removes the backdrop ─ views paint, sized draws replay into the scratch
tool hand-off (G3) ─ flush → hold → await suspend → tool → reset → await resume
  └─ resume ─ sizedText.invalidate() + repaint ─► sized text resent (V2 resume case; live on Raft.md)
exit (G3) ─ destroy → await closed() ─ stderr → exit (V5; live SO_EXIT=0 to a clean prompt)
```

- **Sized text with async transitions:** `Shell.resume` invalidates sized text only after `renderer.resume()` resolves. The sized-text resume case and the live hand-off on `Raft.md` both show the draws sent again. Nothing paints while suspended (`paint` returns on `suspended || destroyed`).
- **Sized text with the backdrop:** the backdrop draws no sized text, and `attach` destroys it before the views are added (`src/ui/shell.ts:366`). Colour starts add no backdrop (`src/app/main.ts:332`, `startsColourless`), so their startup bytes match before G4.
- **Scratch replay scope:** every paint replays into one scratch buffer, so a sized draw painted over by a later *sized* draw would not count as covered. That case cannot happen today: the only sized drawers are tiled text-view rows and their widgets, and the picker and other overlays draw no sized text (`rg sizedText src/ui/overlays` finds nothing). This is a constraint for future overlays, not a defect.
- **Main-screen artefact, not a regression:** after exit, the first two cells of the first two main-screen rows are blank. The byte dump shows a startup probe writing `ESC[H OSC 66 w=1; ESC[6n` at the home position. The same artefact appears on master (`.tmp/base`, OpenTUI 0.5.14) under the same conditions. OpenTUI's explicit-width `OSC 66 w=1` glyph writes also appear on master (204 in a shorter run).

## Findings

None

## Test Coverage

- **Covered:**
  - Sized-text byte order, covered draws and their rewrites, and resends after a move, a change, a resize, a resume, or a forced repaint (`V2`).
  - Grapheme and wide-cell comparison across the scratch and frame buffers (`V3`).
  - The refused-write fallback (G2-VER1 closure).
  - Real 0.6 suspend/resume on a set-up renderer, a failed suspend that keeps painting, and destroy while suspended (`V4`).
  - The tool host's failed-suspend release (`src/app/tool-host.test.ts`).
  - Every exit path restoring the terminal in a PTY (`V5`).
  - NO_COLOR startup.
  - The live kitty and herdr journeys (`V7`).
- **Missing:**
  - No test asserts the restore happens exactly once; the e2e cases assert the final terminal state. The Test Strategy keeps those suites unchanged, and G3 recorded the gap.
  - No test pins the single-scratch replay against overlapping sized draws, which cannot occur today (see Integration).
- **Low-value:** `typeof sessionWriter(...)` in `test/ui/sized-text.test.ts` only proves the export exists. It predates this work.

## Scope Changes

All of these are recorded in the ship file or the group reports, and each is in scope:

- **`createRenderer`:** it now builds `CliRenderer` itself and adds a `Backdrop` only for a colourless start (G4, NO_COLOR fix and G4-VER1/VER2 closure). OpenTUI's unused `--delay-start` is dropped.
- **Shell after `destroy`:** it no longer paints after `destroy` (G3).
- **`Shell.suspend` order:** it clears image slots after `renderer.suspend()` succeeds, not before as `DES5` lists. This is the G3-VER1 remediation: nothing paints in between because `suspended` is set first, and a failed suspend keeps the slots the terminal still shows.
- **`ShellDeps.logger`:** added for `closed()` failures.
- **`src/ui/widgets/zoom-text.ts`:** listed in `G2-T1` but needed no change.

## Blockers and Unverified Items

- **CI on the PR (`V6`, `REQ1`):** not run, because no PR exists before Deliver; the ship file's Deliver step 2 requires it to pass. Locally, `check`, `test:ci`, `build`, `bench`, and `audit` pass, apart from the master-shared watcher flakes. `zizmor` is not installed here, and no workflow file changed.
- **Visual appearance (`V7`):** whether kitty images (the PDF pages, `diagram.png`) look right on screen, and whether sized glyphs are drawn at the right scale, is `Unverified`. Script screenshots capture only the wallpaper. Checked instead: kitty's text extraction showed multicell rows, the raw bytes showed OSC 66 and kitty graphics commands in the right order, and the logs held no errors.
- **Sized text under herdr:** not exercised. This herdr build reports no scaled-text support, so so draws normal-size headings there, as designed.
- **PDF paging:** `consensus.pdf` in the `intro` profile has one page. Paging was exercised on the `pdf` profile's 5-page `docs/book.pdf` in kitty only. `J`/`K` turn pages there; `j`/`k` scroll within a page.
