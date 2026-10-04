# P2-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-2-browser-preview.md`
- **Group:** `P2-G1` — Browser preview
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p2-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

`:Preview` now serves a read-only, loopback-only browser mirror of the active note. The page, KaTeX, and Mermaid are embedded in the binary, the page follows edits over SSE, and the statusline shows the preview segment. Every task is committed on its own, and `bun run check` and `CI=true bun run test:ci` pass.

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G1-T1` | `src/core/lang/markdown/html.ts`: `HtmlCtx`, `escapeHtml`, `renderHtml` (one `section[data-line][data-hash]` per block; mdast handlers for CommonMark, GFM, math, Mermaid, and the Obsidian nodes; raw HTML as escaped text; web images kept, other schemes get no `src`; embeds one level deep through `sectionLines`). `src/core/lang/markdown/html.test.ts` | RED: the suite failed (module missing). GREEN: `bun test src/core/lang/markdown/html.test.ts` → 10 pass, 94 expects (V20, V21). `bun run check` → 724 pass | `c486398` | `Completed` |
| `P2-G1-T2` | `src/preview/assets.ts` (`PreviewAsset`, `PAGE`, `ASSETS`: page files, `katex.min.{js,css}`, all 20 `fonts/KaTeX_*.woff2` faces, `mermaid.min.js`); `src/preview/assets.d.ts`; `src/preview/page.html`, `page.js` (`follow`, `swapArticle`, `renderBlocks`, `setBadge`, `scrollToLine`, `flashNew`, paused-follow banner, theme toggle), `page.css`; `src/preview/assets.test.ts`; `test/boundaries.test.ts` `PACKAGE_HOMES` += `katex`, `mermaid`; `package.json` and `bun.lock` (`katex` `0.16.47`, `mermaid` `12.1.0`) | RED: the suite failed (module missing). GREEN: `bun test src/preview/assets.test.ts test/boundaries.test.ts` → 6 pass, 104 expects (V48, V47 boundary part). `bun run check` → 728 pass with zero knip findings, so `knip.json` is unchanged | `7dabcdc` | `Completed` |
| `P2-G1-T3` | `src/preview/server.ts` (`SECURITY_HEADERS`, `FILE_CSP`, `PreviewServerOptions`, `PreviewServer`, `startPreviewServer`); `src/core/state/preview.ts` (`previewUrl`, `openNote`, `FollowTarget`, `followTarget`, `htmlCtx`); `src/core/state/preview.test.ts` (`previewUrl`); `test/integration/preview-server.test.ts` | RED: the suite failed (module missing). GREEN: `bun test test/integration/preview-server.test.ts` → 8 pass, stable over 3 runs (V22, V23, V24, V26, V27, V28, V30, V34). `bun run check` → 729 pass | `b3258a8` | `Completed` |
| `P2-G1-T4` | `src/core/state/types.ts` (`PreviewState`, `AppState.preview`, 4 actions, 3 effects); `init.ts`; `update.ts` (4 cases); `preview.ts` (`startPreview`, `stopPreview`, `onPreviewStarted`, `onPreviewStopped`, `onPreviewFailed`, `onOpenUrlFailed`); `markdown-commands.ts` (`preview.start`, `preview.stop`); `commands.ts` `EX_ALIASES`; `src/workspace/system.ts` `openUrl`; `src/app/preview-host.ts` (`PreviewHost`, `createPreviewHost`); `src/app/effects.ts` (`RunnerDeps.preview`, `RunnerDeps.openUrl`, 3 cases, a `never` check); `src/app/lifecycle.ts` (`stopPreview`, bounded); `src/app/main.ts`; `src/preview/server.ts` (`stop` returns a promise); runner stubs in `src/app/effects.test.ts`, `test/integration/helpers.ts`, `test/integration/config.test.ts`; tests in `src/core/state/preview.test.ts`, `test/integration/preview-server.test.ts`, `test/e2e/quit.test.ts` | RED: 6 of 7 reducer tests failed, the integration suite failed to load (`openUrl` missing), and the quit case timed out. GREEN: `bun test src/core/state/preview.test.ts` → 7 pass (V29, V31, V3). `bun test test/integration/preview-server.test.ts test/e2e/quit.test.ts` → 14 pass, stable over 3 runs (V32, V33). `bun run check` → 735 pass. `CI=true bun run test:ci` → 137 pass | `c28abe0` | `Completed` |
| `P2-G1-T5` | `src/core/state/status.ts` (`StatusSegments.preview`, `statusSegments`); `src/ui/views/statusline.ts` (`Statusline`: preview after words; dropped in order preview → words → view when the full path does not fit, all three when narrow); `src/core/state/status.test.ts`; `test/ui/shell.golden.test.ts` and its snapshot; `test/ui/__snapshots__/theme.golden.test.ts.snap` | RED: 5 golden tests failed. GREEN: `bun test test/ui/shell.golden.test.ts` → 27 pass (V36). The snapshot diffs change only statusline rows, plus one renamed snapshot key (see Deviations). `bun run check` → 736 pass. `CI=true bun run test:ci` → 139 pass | `8d6e7d4` | `Completed` |

### Group Change Range

- **Starting commit:** `8d20862` (`8d20862916bf4e6af398113a39f0b06fafbaf599`). Pre-existing working-tree change: the orchestrator's unstaged edit to `w261003s6bq-goal.md`. It was never staged or modified.
- **Final commit:** `8d6e7d4`
- **Remaining group changes:** None. `git status --short` shows only the pre-existing goal edit.

### Group Verification

- `bun run check` → `Passed` — Biome, tsc, and knip are clean; 736 pass, 0 fail, 18 snapshots.
- `CI=true bun run test:ci` → `Passed` — 139 pass, 0 fail across 21 files, 30.1 s.
- `bun test test/boundaries.test.ts` → `Passed` — 2 pass. `src/preview` imports only `src/preview`, `src/core`, `node:fs`, and `node:path`, plus `katex` and `mermaid` files through `assets.ts`. It has no `@opentui` import.
- No mutating route, by inspecting `src/preview/server.ts` → `Passed` — `fetch` returns 405 for any method other than `GET` (`server.ts:190`), before routing. No route writes. `Bun.serve` binds `hostname: "127.0.0.1"`. V28 asserts 405 for `POST` and `PUT`, and that connections to the machine's non-loopback IPv4 addresses and to `[::1]` are refused.
- `rg -n "https?://" src/preview --glob '!*.test.ts'` → `Passed` — no match at all (exit 1). The policy string writes `http: https:` without slashes.
- Extra smoke, not a group check: `bun run build` → `Passed` — `dist/so` builds from 609 modules and is 83,940,210 bytes. V35 (serving from the binary with no `node_modules`) stays in P3-G1.

### Pinned Versions

- `mermaid` `12.1.0` — exact. `npm view mermaid version` and the `latest` dist-tag both returned `12.1.0` on 2026-10-04. The browser bundle is `node_modules/mermaid/dist/mermaid.min.js` (5,493,176 bytes); it ends with `globalThis["mermaid"] = …`, so it sets `window.mermaid`.
- `katex` `0.16.47` — exact. This is the same version `bun.lock` already held through `micromark-extension-math`. The dist files are `dist/katex.min.js`, `dist/katex.min.css`, and 20 `dist/fonts/KaTeX_*.woff2` faces, one for each `url(fonts/….woff2)` in the stylesheet.
- Record `mermaid` `12.1.0` in the PR description (P3-G1-T4).

### Deviations and Remaining Issues

A fresh remediator must preserve these decisions:

1. **`PreviewServer.stop()` and `PreviewHost.stop()` return `Promise<void>`.** The design shows `void`. The design's `server.stop(true)` aborted connections before the `stopped` bytes were written (V30 failed). On exit, `process.exit` ran before the socket flushed (V33 failed with `ECONNRESET`). The fix:
   - `stop()` closes every stream, then calls Bun's graceful `server.stop()` and returns its promise. New connections are still refused at once (V30).
   - `installLifecycle` awaits `stopPreview()` for at most `PREVIEW_STOP_BOUND_MS` (250 ms) before `shell.destroy()`, so a failure still cannot block the terminal restore.
   - The runner's `stopPreview` case ignores the promise and dispatches `previewStopped` at once, as designed.
2. **`HtmlCtx.embed` takes a link target, not a resolved path.** `HtmlCtx` exposes no resolver: `href` returns an encoded page address. So `htmlCtx` resolves the target through `resolveLink` itself, then uses the open buffer (`openNote`) or the server's contained loader. `renderHtml` behaves as designed.
3. **`assets.d.ts` is referenced from `assets.ts`** with `/// <reference path="./assets.d.ts" />`. tsc ignores a `.d.ts` that has a same-named `.ts` sibling, and the design fixes both names. Without the reference, every `with { type: "file" }` import fails TS2307/TS7016.
4. **`openNote(s, path)` was added to `src/core/state/preview.ts`.** It is the one "open Markdown buffer → current `Doc`" lookup, shared by `/render` and `htmlCtx.embed`. It reuses the stored analysis when its version matches and parses otherwise.
5. **The follow loop throttles; it does not debounce.** The first store notification schedules one check 100 ms later. Later notifications do not push it back, so continuous typing still yields a `doc` event within 300 ms (V22 measured below 300 ms). Events are sent only when the path, version, or line changed, and nothing is sent on SSE connect.
6. **The statusline always shows the `preview` segment** (`preview off`, `preview …`, or `preview :<port>`) at wide and medium widths, for notes, code files, and an empty window. This follows parent UV1@R2. In consequence:
   - existing segment assertions and the 120-column goldens gained `preview off`;
   - the theme golden's statusline row changed the same way;
   - the `status.test.ts` expectations were updated, and one case was added for the starting and running segment text;
   - the golden test "a code file shows source, path, index, and position only" was renamed to "… source, path, preview, index, and position only", which renamed its snapshot key. The other snapshot diffs change statusline rows only, and the 80-column rows are unchanged.
7. **The drop order is applied progressively.** At wide or medium width, when the full path does not fit, preview is dropped first, then words, then view, before the path is cut in the middle. Narrow width (< 100 columns) drops all three. The "narrow statuslines drop preview, words, then view" test asserts each step.
8. **`RunnerDeps.preview` and `RunnerDeps.openUrl` are required, as designed.** Every runner construction therefore gained no-op stubs, including `test/integration/config.test.ts`, which the plan did not list. `createEffectRunner` gained an exhaustive `never` check that throws on an unknown effect.
9. **`onPreviewStopped` sets the message `preview stopped`.** This text is not specified in the design.
10. **Page behaviour not specified in detail:**
    - After `Reconnecting…`, the page shows `Offline` when the connection has not returned within 10 s, or at once when `EventSource` reports `CLOSED`.
    - The banner (`role="status"`) also carries the `Stopped` and `Offline` notices.
    - Offline disables link navigation.
11. **Remaining issue — one unexplained transient.** One `bun run check` run during T5 reported `2 fail` in the unit suites. The output was truncated by `tail`, so the failing tests are unknown. It did not reproduce in 10 consecutive reruns (4 full `bun run check` runs and 6 runs of the unit suites), and every later run passed.
12. **Remaining issue — the page has not run in a browser.** `page.js` was linted by Biome and its file set is asserted by V48, but it was not run in a real browser in this group, because tests must not open one. The manual UV9@R2 checklist (V42, P3-G1) is the first in-browser check of KaTeX and Mermaid rendering, badges, the banner, and the theme toggle.

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
- **Final commits:** `c486398`, `7dabcdc`, `b3258a8`, `c28abe0`, `8d6e7d4`
- **Final checks:** `bun run check` → 736 pass; `CI=true bun run test:ci` → 139 pass; `bun test test/boundaries.test.ts` → 2 pass; `rg` page-origin check → no match.
- **Remaining issues:** The transient check failure (item 11) and the page not yet run in a browser (item 12), both described above.
