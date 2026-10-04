# P2-G1 Verification Report

## Scope

- **Group:** `P2-G1` — Browser preview
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p2-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p2-g1-implementation-report.md` (commit `59892a7`)

Verified range: `8d20862`..`8d6e7d4` (task commits T1 `c486398`, T2 `7dabcdc`, T3 `b3258a8`, T4 `c28abe0`, T5 `8d6e7d4`) on branch `feat/rm261003abzp-di3-live-preview`, with `HEAD` at `59892a7`. The orchestrator's uncommitted edit to `w261003s6bq-goal.md` was left untouched.

## Status

`Failed`

Every assigned `REQ/DES/S/V` chain is satisfied and every group check passes. This includes 5 runs each of `bun run check` and `CI=true bun run test:ci`, 8 runs of the timing-sensitive suites under full CPU load, and a real-browser smoke check. The group fails only on one Minor test-reliability finding, P2-G1-VER1: the V33 end-to-end test can read the launcher's output file before the file is written.

## Assigned Traceability

- **System Design:** `REQ8@R1, REQ7@R3, REQ1@R1, REQ6@R1 → DES9, DES10, DES11, DES12 → S10, S11, S12, S13, S17 → V3, V20–V24, V26–V34, V36, V48`
- **UI Design:** `Not applicable — parent UV1@R2 (V36) and the automated part of UV9@R2 (V34, V48) are realised through the design's technical surfaces.`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ8, REQ1 → DES9 → S10 → V20` | None | One `section[data-line][data-hash]` per block; wikilinks `href="/<path>"`, unresolved class; local images `/file/<path>`, web image kept, `javascript:` gives no `src`; tasks `disabled`; `pre.mermaid`; math `data-tex` | `src/core/lang/markdown/html.ts:renderHtml`, `imageSrc`, `wikiHtml`, `listItemHtml`, `blockHtml` (mermaid key); `html.test.ts` | `Satisfied` |
| `REQ8, REQ1 → DES9 → S10 → V21` | None | Every text node and attribute escaped; raw HTML shown as text | `html.ts:escapeHtml`, `attr`, `case "html"`; links limited to `https?`/`mailto` (`SAFE_EXTERNAL`); browser check: `<script>` and `<img onerror>` in a note produce no element and no execution (`window.pwned` undefined) | `Satisfied` |
| `REQ7, REQ8 → DES12 → S13 → V48` | parent UV9@R2 (automated) | Closed, same-origin file set; no inline code; every page reference is an `ASSETS` key; every KaTeX woff2 face served | `src/preview/assets.ts:PAGE`, `ASSETS` (page files, KaTeX JS/CSS, 20 woff2 faces, `mermaid.min.js`); `page.html` with deferred `/assets/*` scripts only; `assets.test.ts` | `Satisfied` |
| `REQ8, REQ1 → DES10 → S11 → V26, V27, V28` | None | 403 for a foreign Host; 404 for escapes, symlinks, hidden or excluded files; 405 for non-GET; bound to `127.0.0.1` | `src/preview/server.ts:183-200` (Host allowlist, then GET-only, then routes), `visible`/`contained` (decode once, realpath under `rootReal + sep`, hidden and excluded checks before and after realpath), `hostname: "127.0.0.1"` | `Satisfied` |
| `REQ8 → DES10, DES11 → S12, S10 → V22, V23, V24, V30` | None | `doc {path, version, line}` within 300 ms; no event for code files; closed notes from disk; `stopped` before end-of-stream | `server.ts:check`/`subscribe` (100 ms, sent only on a change of path, version, or line; `followTarget(s) ?? last`), `render` (open buffer first, then `readNote`), `stop()` (unsubscribe → `stopped` → close streams → graceful `server.stop()`) | `Satisfied` |
| `REQ7 → DES10, DES12 → S13, S11 → V34` | parent UV9@R2 (automated) | Exact `SECURITY_HEADERS` on the page, assets, 404s, and errors; exact content types; `FILE_CSP` with `sandbox` on `/file/*`; `no-cache` on the page and assets | `server.ts:respond` (merges `SECURITY_HEADERS` into every response), `serveAsset`, `file`; policy string identical to design §6 | `Satisfied` |
| `REQ8 → DES11 → S12 → V29, V31, V3` | None | Idempotent start (`off → starting`, nothing while starting, reopen while on); stop messaging; URL toast; refusal on code files | `src/core/state/preview.ts:startPreview`, `stopPreview`, `onPreviewStarted`, `onOpenUrlFailed`; `markdown-commands.ts` (`preview.start` limited to `markdown`, `preview.stop` unlimited); `commands.ts:EX_ALIASES` | `Satisfied` |
| `REQ8 → DES11 → S12 → V32, V33` | None | Launch failure → `openUrlFailed` and a `browser.openFailed` log with no note text; exit sends `stopped` and restores the terminal | `src/workspace/system.ts:openUrl`; `src/app/effects.ts` `openUrl` case; `src/app/lifecycle.ts` stops the preview (bounded by 250 ms) before `shell.destroy()`; `main.ts` wiring | `Satisfied` (VER1 concerns only the reliability of the V33 test) |
| `REQ1, REQ8 → DES11 → S17 → V36` | parent UV1@R2 (full) | `MODE │ view │ path │ backlinks │ words │ preview │ index │ Ln:Col`; drop order preview → words → view | `src/core/state/status.ts:previewSegment`; `src/ui/views/statusline.ts` (preview after words; drop loop `[preview, words, view]`; all three dropped below 100 columns) | `Satisfied` |
| `REQ8 → DES11` (state contract) | None | `AppState.preview` is the only new top-level key; never persisted; `state.json` stays version 1 | `types.ts` adds only `preview: PreviewState` to `AppState`; `session.ts` has no `preview` reference and still writes `version: 1` | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V20`, `V21` | `S10` | `DES9` | `bun test src/core/lang/markdown/html.test.ts` (part of `bun run check`) | Included in 736 pass ×5; code read confirms escaping of every emitted text and attribute | `Passed` |
| `V48`; `V47` (boundary part) | `S13` | `DES12` | `src/preview/assets.test.ts`, `test/boundaries.test.ts` (in `bun run check`) | Pass ×5; `PACKAGE_HOMES` has `katex` and `mermaid` → `src/preview/`, looked up by `packageName(specifier)` | `Passed` |
| `V26`, `V27`, `V28`, `V22`, `V23`, `V24`, `V30`, `V34`, `V32` | `S10`–`S13` | `DES9`, `DES10`, `DES11`, `DES12` | `test/integration/preview-server.test.ts` (in `test:ci`); plus 8 runs of it with `quit.test.ts` while 10 `yes` processes saturated all 10 cores | 139 pass ×5 in `test:ci`; 14 pass, 0 fail ×8 under load | `Passed` |
| `V29`, `V31`, `V3` | `S12`, `S9` | `DES11`, `DES8` | `src/core/state/preview.test.ts` | Pass ×5 (7 tests, including stop from a code file and the start failure) | `Passed` |
| `V33` | `S12` | `DES11` | `test/e2e/quit.test.ts` | Pass in 5 `test:ci` runs and 8 loaded runs; the test has a read-before-write race (P2-G1-VER1) | `Passed` |
| `V36` | `S17` | `DES11` | `test/ui/shell.golden.test.ts` and snapshots | Pass ×5; snapshot diffs touch only statusline rows plus one renamed key | `Passed` |
| Fast gate | — | — | `bun run check` ×5 | Exit 0 each time; Biome, tsc, and knip clean; 736 pass, 0 fail (3.32–3.40 s) | `Passed` |
| Unit suites under load | — | — | `bun test src test/boundaries.test.ts test/repo.test.ts test/vim` ×3 at full CPU load | 736 pass, 0 fail each time; the T5 transient did not reproduce | `Passed` |
| CI suites | — | — | `CI=true bun run test:ci` ×5 | Exit 0 each time; 139 pass, 0 fail, 21 files (29.7–30.0 s) | `Passed` |
| Build | — | `DES12` | `bun run build` | Exit 0; 609 modules compiled to `dist/so` | `Passed` |
| Preview imports | — | `DES10` | `test/boundaries.test.ts`; `rg` of imports in `src/preview` | `server.ts` imports `node:fs`, `node:path`, `../core/*`, `./assets`; `assets.ts` imports only `./page.*`, `katex/dist/*`, `mermaid/dist/*`; no `@opentui` outside `src/ui`; `src/core` has no `node:`/`bun` import outside tests | `Passed` |
| Pins | — | `DES12` | `package.json`, `bun.lock`, `node_modules/*/package.json` | `katex` `0.16.47` and `mermaid` `12.1.0` exact in all three | `Passed` |
| No mutating route | — | `DES10` | Inspect `server.ts:183-200` | Host is checked first (403), then any method other than GET gets 405 before routing; no route writes | `Passed` |
| Page origin | — | `DES12` | `rg -n "https?://" src/preview --glob '!*.test.ts'` | No match (exit 1) | `Passed` |
| Work-process identifiers | — | — | grep of the added lines in `src`, `test`, and `scripts` for `REQ/DES/V/S/UV/P#-G#/W…/RM…/phase` | No match | `Passed` |
| Real-browser smoke (V42 precursor, optional) | `S12`, `S13` | `DES10`, `DES12` | Scratch server from `startApp` + `startPreviewServer` on a copy of `tour.md` (with the index, and without it), driven by Playwright Chromium | `tour.md`: 2 `.katex` (1 display), 1 Mermaid SVG, KaTeX fonts loaded from `/assets/fonts/*`, `diagram.png` loaded through `/file/`, wikilinks resolved, task inputs disabled, badge `Live`. Network: only `127.0.0.1:<port>` requests (page, 5 assets, `/render`, `/events`, 3 fonts). Console: 0 messages. SSE: an edit in the app updated the article (one `section.changed`), with math and diagram re-rendered. Stop: badge `Stopped`, banner shown, content kept, new connections refused. Link click: page paused with the "Follow so" banner. `errors.md`: 2 `.katex-error`, the broken Mermaid kept as `pre.render-error`, later text rendered, no stray Mermaid error element, raw `<script>` and `<img onerror>` shown as text and not executed | `Passed` |

Security review summary:

- **Host check:** an exact match on `127.0.0.1:<port>` or `localhost:<port>` runs before every other check.
- **Path containment:**
  - WHATWG URL parsing normalises `..` and `%2e%2e` before routing.
  - `file()` decodes once, so `%2f` escapes become `..` segments, which `visible` rejects.
  - The realpath must start with `rootReal + sep`, and the real path is checked again for hidden and excluded segments, so a symlink into `.git` is also refused.
  - `\` and NUL are rejected.
  - Directories return 404.
- **Hidden and excluded files:** `/render` checks `visible(rel)` before it consults open buffers.
- **CSP and headers:** set on every response, including 403, 404, 405, SSE, and `/render`. `/file/*` uses `FILE_CSP` with `sandbox`.
- **HTML escaping:**
  - Every text and attribute goes through `escapeHtml`.
  - Table alignment values come from mdast's fixed set.
  - Links outside `http(s)`/`mailto` render as text.
- **Page script:**
  - No inline script.
  - Mermaid `securityLevel: "strict"`.
  - KaTeX `throwOnError: false` with default `trust: false`.

## Findings

### P2-G1-VER1 — Minor — Test Reliability — The V33 exit test can read the launcher file before it is written

- **System Design:** `REQ8@R1 → DES11 → S12 → V33`
- **UI Design:** `None`
- **Evidence:** In `test/e2e/quit.test.ts`, the fake launcher writes the URL with a shell redirect, and the test reads the file as soon as it exists:

  ```ts
  `#!/bin/sh\nprintf '%s' "$1" > '${opened}'\n`,
  …
  await p.waitFor(() => existsSync(opened));
  const url = new URL(await readFile(opened, "utf8"));
  ```

  The shell creates or truncates `opened.txt` before `printf` writes to it. A poll that lands between those two steps reads `""`, and `new URL("")` throws `Invalid URL`, which fails the test. The race did not occur in 13 runs (5 normal `test:ci` runs and 8 runs under full CPU load). It is still a real ordering gap, and it is most likely to show up on preempted CI runners. It is not the cause of the T5 transient, which was in the `bun run check` unit suites, not in `test:ci`.
- **Impact:** The V33 exit test can fail intermittently in CI for reasons unrelated to the product, which hides real regressions behind reruns.
- **Required resolution:** The test reads the launcher's URL only once it is complete. For example, the launcher writes to a temporary name and then `mv`s it into place, or the test waits until the file content parses as a URL.
- **Required proof:** `bun test test/e2e/quit.test.ts` passes, and inspection shows the read cannot see a partly written file.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - HTML structure and escaping (V20, V21).
  - The closed asset set and font coverage (V48).
  - Host, containment, method, and loopback refusals (V26–V28), including PUT, `[::1]`, and non-loopback IPv4 addresses.
  - Follow latency, the code-file hold, and closed-note render (V22–V24).
  - Stop ordering (V30).
  - Headers and content types on the page, assets, a 404 asset, `/file/*`, and a refused `/file/.git/config` (V34).
  - Reducer state machine, stop messaging, URL toast, start failure, and code-file refusal (V29, V31, V3).
  - Launcher failure and its log (V32).
  - Exit delivering `stopped` with terminal restore (V33).
  - Segment order and progressive drop order (V36).
- **Missing:**
  - The page script's connection states (`Reconnecting…` → `Offline`) have no automated assertion. Parent UV9@R2 lists "stubbed events drive badge text `Live` → `Reconnecting…` → `Offline`, and `Stopped`" under its integration method. The W design maps the automated part of UV9@R2 to V34 and V48 only and leaves page behaviour to the manual V42 (P3-G1), so this is not a group defect. The browser smoke in this verification confirmed `Live` and `Stopped` only.
  - A test for a symlink that points to a hidden or excluded path inside the workspace. The code handles it (`visible(inside)` after realpath), but no test asserts it.

## Scope Changes

The implementer's deviations were judged on merit, and all are accepted:

1. **`PreviewServer.stop()` and `PreviewHost.stop()` return `Promise<void>`; shutdown waits at most 250 ms.** Justified. The design's `server.stop(true)` aborts sockets before the `stopped` bytes flush, which breaks the design's own V30 and V33 guarantees. Graceful `server.stop()` still refuses new connections at once (V30 and the browser smoke confirmed this). The 250 ms bound in `lifecycle.ts` keeps the "never block terminal restore" invariant, and the runner still dispatches `previewStopped` at once. The runner's `void d.preview.stop()` has no `.catch`, but the only async work is Bun's `server.stop()` and the logger, whose writes are wrapped in `try/catch` (`src/workspace/log.ts:31-36`). No practical rejection path exists.
2. **`HtmlCtx.embed` takes a link target.** Justified. `renderHtml` has no resolver, so resolution must happen in `htmlCtx`, and the signature type (`string`) is unchanged. Embeds of closed notes go through the server's contained `readNote`.
3. **`/// <reference path="./assets.d.ts" />` in `assets.ts`.** Justified. tsc skips a `.d.ts` whose same-named `.ts` sibling exists, and the design fixes both names. `bun run check` (tsc and knip) is clean.
4. **`preview off` always shows at 100 or more columns, and a golden test was renamed.** Consistent with parent `rm261003abzp-ui-design.md` (Statusline content contract: preview displays `preview :8731` / `preview off`; UV1@R2: the `sync.ts` statusline at 120 columns includes `preview`). The rename describes the new content accurately. The 80-column goldens are unchanged.
5. **`test/integration/config.test.ts` stubs.** Required because `RunnerDeps.preview` and `RunnerDeps.openUrl` are mandatory, as designed. These are test-only no-ops.

Other differences:

- The follow loop throttles (first notification + 100 ms) instead of debouncing. This keeps the 300 ms bound under continuous typing, preserves the send-only-on-change rule, and was measured below 300 ms under load.
- `openNote` was added to `src/core/state/preview.ts`.
- `onPreviewStopped` sets the message `preview stopped`.
- `test/support/state.ts` was listed in the plan but needed no edit: `testRegistries` already registers `markdownCommands`, and `:Preview` resolves in `preview.test.ts`.
- Page details beyond the design (a 10 s `Offline` timer, the banner for `Stopped`/`Offline`, links disabled offline) stay within parent UV9@R2.

None of these changes a contract that other code consumes.

## Unverified Items

- **The T5 transient (`2 fail` in one `bun run check` run, output truncated).** It did not reproduce in 5 `bun run check` runs or in 3 unit-suite runs under full CPU load (736 pass each). Its cause is unknown. The changed unit suites added in this group (`html.test.ts`, `assets.test.ts`, `preview.test.ts`, `status.test.ts`) are pure, with no timers or I/O other than reading embedded files.
- **The manual V42 checklist.** It is owned by P3-G1, which covers 375 px layout, contrast in both themes, and a network-disabled run. The browser smoke here covered a subset: rendering, console, same-origin requests, SSE update, stop, and render errors.

## Blockers

None
