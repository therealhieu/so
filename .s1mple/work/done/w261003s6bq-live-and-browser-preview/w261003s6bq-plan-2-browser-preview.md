# W261003S6BQ Plan Part 2 — Browser Preview

## Status

`Ready`

## Objective

`:Preview` runs a read-only, local-only browser mirror of the active note:

- **Rendering:** pure, escaped HTML from the same `Doc`.
- **Server:** a loopback, GET-only `Bun.serve` with a Host allowlist and realpath containment. It follows edits over SSE within 300 ms.
- **Embedded files:** the page, KaTeX, and Mermaid are embedded in the binary and served same-origin under a strict Content Security Policy, so math and diagrams render offline.
- **Lifecycle:** preview state lives in the reducer; the app owns the server; a browser launch failure toasts the URL; the preview stops before the terminal is restored on exit.
- **Statusline:** a `preview` segment with the full segment and drop order.

## Coverage Summary

- **System Design:** `REQ1@R1, REQ6@R1, REQ7@R3, REQ8@R1 → DES9, DES10, DES11, DES12 → S10, S11, S12, S13, S17 → V3, V20, V21, V22, V23, V24, V26, V27, V28, V29, V30, V31, V32, V33, V34, V36, V48`
- **UI Design:** `Not applicable — no W UI design. The parent RM261003ABZP-US1@R2/UV1@R2 (full statusline, V36) and US8@R1/UV9@R2 (automated part: V34, V48) are carried through the system design's "UI obligations" row. The manual UV9@R2 checklist (V42) is in P3-G1.`

## Sources

- Plan index: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-index.md`
- Plan context: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-plan-context.md`
- System design: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md`
- UI design: Not applicable — no W UI design. The parent UI/UX authority for the page is `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-ui-design.md` (M7@R1, UDES10@R2, UV9@R2) and for segments M1@R1 and UV1@R2, which the system design references.
- System requirements: `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-requirements.md`
- UI requirements: Not applicable — no W UI requirements. The parent UREQs are bound through the discussion context.

## Dependencies

- Part 1, completed and verified. Part 2 consumes:
  - `renderKey`, `IMAGE_EXTENSIONS`, and `isWebUrl` (P1-G1-T3, P1-G1-T5);
  - `test/fixtures/tour.md` (P1-G1-T6) and `test/fixtures/images/*` (P1-G3-T2);
  - `BufferState.listed` and the listed filters (P1-G1-T7, P1-G2-T2);
  - `markdownCommands` and `markdownBindings` (P1-G2-T3);
  - `Registries.viewContexts`, `testRegistries`, and `mountShell` (P1-G1-T7, P1-G3-T4);
  - the `checkImports` package-name lookup (P1-G1-T1).

## Execution Flow

```text
P2-G1: Browser preview
```

## Groups

Every delegated agent (implementer, verifier, remediator) reads and follows `.s1mple/S1MPLE.md` and its required references: `docs/communication.md`, `docs/project.md`, and `docs/languages/typescript.md`. Delegated agents do not use the native `Explore` subagent; they inspect directly.

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command. Do not request separate permission. Commit each task after its checks and self-review pass, and before the next task starts.

- Commit subjects follow Conventional Commits.
- Each body carries the task ID and its exact plan title.
- Task commits are checkpoints, not group acceptance.
- If a task needs no change, record no-change evidence instead of making an empty commit.

Rules for planned code:

- Use no work-process identifiers in code, comments, identifiers, test names, or log messages.
- `src/preview` imports only `src/preview` and `src/core`, plus the `katex` and `mermaid` browser files through `assets.ts`. The exclusion rule is injected from `src/app`.
- No route writes, and no inline `<script>`, inline event handler, form, or `contenteditable` in the page.
- Every response carries `SECURITY_HEADERS`, and `/file/*` uses `FILE_CSP`.
- Add `katex@0.16.47` and `mermaid@<exact current release>` with `bun add`. npm's current release was `12.1.0` on 2026-10-02. Confirm the version and the dist file names at install, and record the version in the PR.
- Add `src/preview/assets.d.ts` to `knip.json` `ignore` only if `bun run check` flags it.
- The group ends with `bun run check` and `bun run test:ci` passing.

### P2-G1 — Browser preview

#### Goal

- `renderHtml` turns a `Doc` into an escaped HTML fragment whose blocks carry `data-line` and `data-hash`.
- The preview server serves the embedded page and assets, `/render`, `/file/*`, and SSE `/events` safely on `127.0.0.1`.
- `:Preview` and `:PreviewStop` drive one server through reducer state, effects, and the app-owned host. The browser opens at the current note.
- The statusline shows the preview segment.

#### Coverage Summary

- **System Design:** `REQ8@R1, REQ7@R3, REQ1@R1, REQ6@R1 → DES9, DES10, DES11, DES12 → S10, S11, S12, S13, S17 → V3, V20–V24, V26–V34, V36, V48`
- **UI Design:** `Not applicable — parent UV1@R2 (V36) and the automated part of UV9@R2 (V34, V48) are realized through the design's technical surfaces.`

#### Scope

- Included:
  - `src/core/lang/markdown/html.ts`;
  - the `katex` and `mermaid` pins and `PACKAGE_HOMES` entries;
  - `src/preview/{assets.ts,assets.d.ts,page.html,page.js,page.css,server.ts}`;
  - `src/core/state/preview.ts`;
  - `AppState.preview`, the preview actions and effects, and `initialState`;
  - the `update.ts` cases;
  - the `preview.start` and `preview.stop` commands and the `EX_ALIASES` entries;
  - `openUrl`, `src/app/preview-host.ts`, the effect-runner cases, the lifecycle stop, and the `main.ts` composition;
  - `status.ts` and `statusline.ts`;
  - the integration, e2e, and statusline golden cases.
- Excluded:
  - the bench targets, extension proof, build check, and manual checklist (P3-G1);
  - any terminal rendering change.
- Main files:
  - `src/core/lang/markdown/html.ts`, `html.test.ts`;
  - `package.json`, `bun.lock`, `test/boundaries.test.ts`;
  - `src/preview/*`, `src/preview/assets.test.ts`;
  - `src/core/state/{types,init,update,preview,markdown-commands,commands,status}.ts`, `src/core/state/preview.test.ts`;
  - `src/workspace/system.ts`;
  - `src/app/{preview-host,effects,lifecycle,main}.ts`;
  - `src/ui/views/statusline.ts`;
  - `test/support/state.ts`;
  - `test/integration/preview-server.test.ts`, `test/e2e/quit.test.ts`, `test/ui/shell.golden.test.ts`.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ8 → DES9 → S10 → V20, V21` | None | One `section[data-line][data-hash]` per block; correct links, images, tasks, Mermaid, and math markup; no unescaped note text |
| `REQ7 → DES12 → S13 → V48` | parent UV9@R2 (automated) | A closed, same-origin file set: no external URL and no inline code, every page reference is an `ASSETS` key, and every KaTeX font is served |
| `REQ8, REQ1 → DES10 → S11 → V26, V27, V28` | None | 403 for a foreign Host; 404 for escapes and hidden or excluded files; 405 for non-GET; bound to `127.0.0.1` |
| `REQ8 → DES10, DES11 → S12, S10 → V22, V23, V24, V30` | None | `doc` within 300 ms; no event for code files; closed notes rendered from disk; `stopped` before end-of-stream |
| `REQ7 → DES10, DES12 → S13, S11 → V34` | parent UV9@R2 (automated) | The page, assets, unknown assets, and `/file/*` responses carry the exact policies and content types |
| `REQ8 → DES11 → S12 → V29, V31, V3` | None | Idempotent start, stop messaging, the open-URL failure toast, and refusal on code files |
| `REQ8 → DES11 → S12 → V32, V33` | None | Launch failure becomes an action and a log entry; exit sends `stopped` and restores the terminal |
| `REQ1, REQ8 → DES11 → S17 → V36` | parent UV1@R2 (full) | Full segment order with `preview :<port>`, and the narrow-width drop order |

#### Cross-Work Gates

None. G2 was confirmed in P1-G1. G4 is not produced in this group.

#### Tasks

##### P2-G1-T1 — Escaped HTML rendering

- **Outcome:**
  - `renderHtml(doc, text, ctx)` wraps every block in `<section data-line data-hash>` and serializes CommonMark, GFM, math, Mermaid, and Obsidian nodes. Every text node and attribute is escaped.
  - Web image targets are kept as they are; local targets map through `ctx.asset`; other schemes produce no `src`.
  - Embeds recurse one level.
- **System Design:** `REQ8@R1, REQ1@R1 → DES9 → S10 → V20, V21`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `HtmlCtx` — Contract; §7 `src/core/lang/markdown/html.ts` (`HtmlCtx`, `escapeHtml`, `renderHtml`)
- **Files:** `src/core/lang/markdown/html.ts`, `src/core/lang/markdown/html.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V20`, `V21`:** `html.test.ts`, with an `HtmlCtx` stub.
   - V20, on `tour.md`:
     - one `<section data-line data-hash>` per block;
     - wikilinks have `href="/<path>"`, and unresolved links have the unresolved class;
     - local images have `src="/file/<path>"`, a web image keeps `src="https://example.com/chart.png"`, and a `javascript:` target yields no `src`;
     - task inputs are `disabled`;
     - Mermaid becomes `<pre class="mermaid">`, and math spans carry `data-tex`.
   - V21: a note with `<script>alert(1)</script>`, a link title that tries to break out of its attribute, and a raw HTML block. The output contains no unescaped `<script` and no quote breakout.

   **Preview:**

   ```ts
   test("every block becomes a section tagged with its line and hash", () => {});
   test("note text cannot inject markup into the page", () => {
     const html = renderHtml(doc, text, ctx);
     expect(html).not.toContain("<script");
     expect(html).not.toMatch(/title="[^"]*"[^>]*onerror/);
   });
   ```

   - Run `bun test src/core/lang/markdown/html.test.ts`. It must fail.

2. **GREEN:** `src/core/lang/markdown/html.ts`.

   **Preview:**

   ```ts
   // design §7 html.ts shapes: HtmlCtx { href, asset, embed }, escapeHtml, renderHtml(doc, text, ctx, depth = 0)
   // blockHtml: blockNode(b) → mdast handlers; renderKey for callout/rule/embed/image dispatch;
   //   raw html → escaped text; image src: isWebUrl(t) ? t : ctx.asset(t); tasks <input type="checkbox" disabled>;
   //   math <span|div class="math" data-tex="…">escaped tex</…>; mermaid <pre class="mermaid">escaped</pre>; depth > 0 → embeds as links
   ```

   - The module is pure and has no `core/state` import.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: emitting any unescaped text or attribute.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(markdown): render notes as escaped html

   Task: P2-G1-T1 — Escaped HTML rendering
   ```

   - Record the commit SHA.

**Verification:**

- `V20`, `V21`: `bun test src/core/lang/markdown/html.test.ts` → pass.

##### P2-G1-T2 — Embedded preview page and browser libraries

- **Outcome:**
  - `PAGE` and `ASSETS` name the closed set of files the browser may load: the page HTML, JS, and CSS; KaTeX JS, CSS, and every woff2 face its CSS references; and the Mermaid browser bundle.
  - Each file is imported `with { type: "file" }`, so `bun build --compile` embeds it.
  - The page runs the follow loop and renders KaTeX and Mermaid. A render error keeps the block's source with a `render-error` label.
- **System Design:** `REQ7@R3, REQ8@R1 → DES12 → S13 → V48`
- **UI Design:** `Not applicable — the page structure, badges, banner, and themes follow parent M7@R1, UDES10@R2, and UV9@R2 through design §7.`
- **Canonical Shapes:** System design §6 Preview assets — Data model; §7 `src/preview/assets.ts`, `assets.d.ts`, `page.html`, `page.js`, `page.css`; §7 `test/boundaries.test.ts` (`katex`, `mermaid` homes)
- **Files:**
  - `src/preview/assets.ts` (`PreviewAsset`, `PAGE`, `ASSETS`);
  - `src/preview/assets.d.ts`;
  - `src/preview/page.html`;
  - `src/preview/page.js` (`follow`, `swapArticle`, `renderBlocks`, `setBadge`, `scrollToLine`, `flashNew`);
  - `src/preview/page.css`;
  - `src/preview/assets.test.ts`;
  - `test/boundaries.test.ts` (`PACKAGE_HOMES`);
  - `package.json`, `bun.lock`, and `knip.json` only if flagged.
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V48`:** `src/preview/assets.test.ts`. Read `page.html`, `page.js`, `page.css`, and `katex.min.css` from their `ASSETS` paths, then assert:
   - the three page files contain no `http://` or `https://`, no inline `<script>` body, and no `on*` attribute;
   - every `src` and `href` in `page.html` starts with `/assets/` and names an `ASSETS` key;
   - every `url(fonts/….woff2)` in `katex.min.css` has an `ASSETS` key;
   - every `PAGE` and `ASSETS` path is a readable file.

   **Preview:**

   ```ts
   test("the page loads only its own embedded files", async () => {});
   test("every KaTeX font the stylesheet references is served", async () => {
     const css = await Bun.file(ASSETS.get("katex.min.css")!.path).text();
     for (const [, f] of css.matchAll(/url\((fonts\/[^)]+\.woff2)\)/g)) expect(ASSETS.has(f!)).toBe(true);
   });
   ```

   - Run `bun test src/preview/assets.test.ts`. It must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   // bun add katex@0.16.47 mermaid@<exact>; confirm dist/katex.min.js, dist/katex.min.css, dist/fonts/*.woff2,
   //   and the mermaid bundle that sets window.mermaid (dist/mermaid.min.js) in node_modules
   // test/boundaries.test.ts PACKAGE_HOMES += katex: ["src/preview/"], mermaid: ["src/preview/"]
   // assets.ts / assets.d.ts / page.html / page.js / page.css — design §7 shapes; one import per woff2 face
   // page.js: mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true });
   //   doc event {path, version, line} → fetch /render → swapArticle → renderBlocks → flashNew → scrollToLine;
   //   "stopped" → setBadge("Stopped"); EventSource error states → Reconnecting… / Offline per UV9@R2
   ```

   - `page.html` has `<header>`, `<main>`, and `<article>`, and a badge with `aria-live="polite"`. It has no form, no editable control, and no inline script or style.
   - Tables and `pre` blocks are wrapped with `overflow-x: auto`.
   - Biome lints `page.js` and `page.css`.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: any external origin, CDN URL, or inline handler in page files.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes, including `package.json`, `bun.lock`, and `knip.json` if it changed.

   **Commit message:**

   ```text
   feat(preview): embed the preview page with katex and mermaid

   Task: P2-G1-T2 — Embedded preview page and browser libraries
   ```

   - Record the commit SHA and the installed `mermaid` version.

**Verification:**

- `V48`: `bun test src/preview/assets.test.ts` → pass.
- `V47` (boundary part): `bun test test/boundaries.test.ts` → `katex` and `mermaid` are imported only under `src/preview/`.
- `bun run check` → zero knip findings.

##### P2-G1-T3 — Preview server and follow selector

- **Outcome:**
  - **Server:** `startPreviewServer` binds `127.0.0.1` on port 0, enforces the Host allowlist, GET-only methods, and realpath containment, and adds the security headers to every response.
  - **Routes:** it serves `/`, `/assets/<name>`, `/render`, and `/file/*`.
  - **Follow:** it pushes `doc {path, version, line}` over SSE after a 100 ms debounce, only when the follow target changed.
  - **Stop:** `stop()` sends `stopped` before closing.
  - **Selectors:** `followTarget`, `htmlCtx`, and `previewUrl` are the pure selectors it uses.
- **System Design:** `REQ8@R1, REQ7@R3, REQ1@R1 → DES9, DES10, DES12 → S10, S11, S12, S13 → V22, V23, V24, V26, V27, V28, V30, V34`
- **UI Design:** `Not applicable — the automated part of parent UV9@R2 (V34).`
- **Canonical Shapes:** System design §6 Preview HTTP routes and `PreviewEvent` — API; §7 `src/preview/server.ts` (`SECURITY_HEADERS`, `FILE_CSP`, `PreviewServerOptions`, `PreviewServer`, `startPreviewServer`); §7 `src/core/state/preview.ts` (`previewUrl`, `FollowTarget`, `followTarget`, `htmlCtx`); §5 Preview start, follow, and stop
- **Files:**
  - `src/preview/server.ts`;
  - `src/core/state/preview.ts` (`previewUrl`, `FollowTarget`, `followTarget`, `htmlCtx`);
  - `test/integration/preview-server.test.ts`.
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V26`, `V27`, `V28`, `V22`, `V23`, `V24`, `V30`, `V34`:** `test/integration/preview-server.test.ts`. Use a real `Bun.serve` on `127.0.0.1:0` with the real store and reducer. The temporary workspace has a symlink to `/etc`, a `.git` folder, a `.gitignore`'d file, and `diagram.svg`.

   | Case | Request or action | Expected |
   |---|---|---|
   | V26 | Host `evil.test:<port>` | 403 |
   | V27 | `/file/..%2f..%2fetc/passwd`, the symlink, `/file/.git/config`, `/file/ignored.md`, `/render?path=../x.md` | 404 for each |
   | V28 | `POST /render`; the server address | 405; hostname `127.0.0.1` |
   | V22 | Connect `/events`, dispatch an edit, then `GET /render` | `doc {path, version, line}` within 300 ms; the fragment contains the edit |
   | V23 | Switch to `scripts/sync.ts` and wait 300 ms | No `doc` event; `/render` without `path` returns the last note |
   | V24 | `/render?path=<closed note>` | A fragment rendered from disk |
   | V30 | `stop()` with a connected client | `event: stopped` arrives before end-of-stream; the next connect is refused |

   V34:
   - `/` is 200 `text/html; charset=utf-8`, with no `<form>` or `contenteditable`.
   - `/assets/katex.min.js` is 200 `text/javascript; charset=utf-8`, with the package file's bytes.
   - `/assets/nope.js` is 404.
   - All three carry the exact `SECURITY_HEADERS` policy, `nosniff`, and `no-referrer`.
   - `/file/diagram.svg` carries `FILE_CSP` with `sandbox`.

   **Preview:**

   ```ts
   test("requests with a foreign host are refused", async () => {});
   test("paths outside the workspace or hidden or ignored are not found", async () => {});
   test("an edit reaches the page within 300 ms", async () => {});
   test("stopping tells connected pages before closing", async () => {});
   test("every response carries the same-origin security policy", async () => {});
   ```

   - Run `bun run test:ci`, or `bun test test/integration/preview-server.test.ts`. It must fail.

2. **GREEN:** `src/core/state/preview.ts` selectors and `src/preview/server.ts`.

   **Preview:**

   ```ts
   // preview.ts — design §7: previewUrl(port, path?); followTarget(s) → active listed markdown buffer or undefined;
   //   htmlCtx(s, from, load) → HtmlCtx (href via resolveLink → "/<path>"; asset → "/file/<path>"; embed via open buffer or load)
   // server.ts — design §7 startPreviewServer: allowedHost, GET-only, /events, /render, /assets/<name> map lookup,
   //   /file/<rel> with FILE_CSP, PAGE fallback; contained(rel): decode once → realpath under rootReal, no dot segment,
   //   !isExcluded; subscribe debounce 100 ms → t = followTarget(s) ?? last → changed → send("doc", {path, version, line});
   //   stop(): unsubscribe → send("stopped") → close streams → server.stop(true)
   ```

   - Every response merges `SECURITY_HEADERS`. Page and asset responses add `Cache-Control: no-cache`.
   - No imports outside `src/preview` and `src/core`.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: any non-GET route or a path-based /assets lookup.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(preview): serve the local read-only preview with live follow

   Task: P2-G1-T3 — Preview server and follow selector
   ```

   - Record the commit SHA.

**Verification:**

- `V22`, `V23`, `V24`, `V26`, `V27`, `V28`, `V30`, `V34`: `bun test test/integration/preview-server.test.ts` → pass.

##### P2-G1-T4 — Preview lifecycle, commands, and browser launch

- **Outcome:**
  - **Start:** `:Preview` on a note goes from off to starting, starts one server through the app-owned host, records `on(port)`, and opens the browser at the note. Running it again reopens the browser only, and it does nothing while starting.
  - **Stop:** `:PreviewStop` stops the server, and says so when nothing runs.
  - **Failures:** a server start failure toasts an error; a browser launch failure toasts the URL and logs `browser.openFailed`.
  - **Code files:** `:Preview` on a code file is refused.
  - **Exit:** stops the preview before restoring the terminal.
- **System Design:** `REQ8@R1, REQ1@R1, REQ6@R1 → DES11, DES8 → S9, S12 → V3, V29, V31, V32, V33`
- **UI Design:** `None`
- **Canonical Shapes:** System design §6 `AppState.preview` — State; §6 Preview actions and effects — Message; §7 `src/core/state/types.ts`, `update.ts`, `preview.ts` (reducers), `markdown-commands.ts` (`preview.start`, `preview.stop`), `{…,commands,init}.ts` (`EX_ALIASES`, `initialState`); §7 `src/workspace/images.ts` and `src/workspace/system.ts` (`openUrl`); §7 `src/app/preview-host.ts`, `effects.ts`, `lifecycle.ts`, `main.ts`; §5 Failure and Recovery Rules
- **Files:**
  - `src/core/state/types.ts` (`PreviewState`, `AppState.preview`, `Action`, `Effect`);
  - `src/core/state/init.ts` (`initialState`);
  - `src/core/state/update.ts` (four cases);
  - `src/core/state/preview.ts` (`startPreview`, `stopPreview`, `onPreviewStarted`, `onPreviewStopped`, `onPreviewFailed`, `onOpenUrlFailed`);
  - `src/core/state/markdown-commands.ts` (`preview.start`, `preview.stop`);
  - `src/core/state/commands.ts` (`EX_ALIASES`);
  - `src/workspace/system.ts` (`openUrl`);
  - `src/app/preview-host.ts` (`PreviewHost`, `createPreviewHost`);
  - `src/app/effects.ts` (`RunnerDeps.preview`, `RunnerDeps.openUrl`, the `run` cases);
  - `src/app/lifecycle.ts` (`installLifecycle` `stopPreview`);
  - `src/app/main.ts` (composition);
  - `src/core/state/preview.test.ts`;
  - `test/integration/preview-server.test.ts` (V32);
  - `test/e2e/quit.test.ts` (V33).
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V29`, `V31`, `V3`, `V32`, `V33`:**

   - `src/core/state/preview.test.ts`:

     | Case | Action | Expected |
     |---|---|---|
     | V29 | `:Preview` while off | `starting` and `[startPreview]` |
     | V29 | `:Preview` again while starting | Nothing |
     | V29 | `previewStarted(8731)` | `on`, with `[openUrl("http://127.0.0.1:8731/notes/plan.md")]` |
     | V29 | `:Preview` while on | `[openUrl]` only |
     | V31 | `:PreviewStop` while off | Message `preview is not running` |
     | V31 | `:PreviewStop` while on | `[stopPreview]` |
     | V31 | `openUrlFailed` | An info toast containing the URL |
     | V3 | `:Preview` with `sync.ts` active | Message `not available for typescript files`; no effect |

   - V32, in `test/integration/preview-server.test.ts`:
     - `openUrl` with a spawn stub that exits 1 rejects;
     - the effect runner with a failing `openUrl` dispatches `openUrlFailed` with the URL;
     - the logger records `browser.openFailed` without note text.
   - V33, in `test/e2e/quit.test.ts`: run `:Preview` with the launcher stubbed through `PATH`, connect to SSE, then send SIGTERM. The client reads `stopped`, and the existing terminal-restore assertions pass.

   **Preview:**

   ```ts
   test("starting the preview twice starts one server", () => {});
   test("a failed browser launch shows the address", () => {});
   test("the preview is not offered for code files", () => {});
   // quit.test.ts
   test("exit tells a connected preview page before restoring the terminal", async () => {});
   ```

   - Run `bun test src/core/state/preview.test.ts` and `bun run test:ci`. Both must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   // types.ts — design §7: PreviewState; AppState.preview; Action + previewStarted/previewStopped/previewFailed/openUrlFailed;
   //   Effect + startPreview/stopPreview/openUrl   (names distinct from readPreview/previewLoaded)
   // init.ts: preview: { status: "off" }; update.ts: four cases → preview.ts handlers
   // preview.ts reducers — design §7 startPreview/stopPreview/onPreviewStarted/onOpenUrlFailed
   // markdown-commands.ts: + { id: "preview.start", filetypes: ["markdown"], run: startPreview },
   //                       + { id: "preview.stop", run: stopPreview }      // no filetype limit
   // commands.ts EX_ALIASES: + Preview: "preview.start", PreviewStop: "preview.stop"
   // system.ts openUrl(url, platform, spawn = Bun.spawn) — design §7
   // preview-host.ts createPreviewHost — design §7 (mirrors index-host.ts; logs preview.started/stopped/failed)
   // effects.ts run: startPreview → d.preview.start(); stopPreview → d.preview.stop() + previewStopped;
   //   openUrl → d.openUrl(url).catch → log browser.openFailed + openUrlFailed
   // lifecycle.ts: try { d.stopPreview?.(); } catch {} before d.shell.destroy()
   // main.ts: previewHost = createPreviewHost({ root, store: () => store, isExcluded: matcher.isExcludedPath, logger, dispatch });
   //   deps.preview = previewHost; deps.openUrl = (url) => openUrl(url, process.platform); installLifecycle({ …, stopPreview: previewHost.stop })
   ```

   - Mirror the registration in `test/support/state.ts`.
   - The exhaustive `never` checks in `createUpdate` and `createEffectRunner` must cover the new variants.
   - Each effect yields at most one result action.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: a second server object; logging note text.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(preview): start and stop the browser preview from the editor

   Task: P2-G1-T4 — Preview lifecycle, commands, and browser launch
   ```

   - Record the commit SHA.

**Verification:**

- `V29`, `V31`, `V3`: `bun test src/core/state/preview.test.ts` → pass.
- `V32`, `V33`: `bun run test:ci` → the preview-server and quit suites pass.

##### P2-G1-T5 — Preview statusline segment

- **Outcome:**
  - **Wide:** the statusline shows `MODE │ view │ path │ backlinks │ words │ preview │ index │ Ln:Col`, with `preview :<port>`, `preview off`, or `preview …`.
  - **Narrow:** preview, then words, then view are dropped first.
- **System Design:** `REQ1@R1, REQ8@R1 → DES11 → S17 → V36`
- **UI Design:** `Not applicable — parent UV1@R2 (full) through design §7.`
- **Canonical Shapes:** System design §7 `src/core/state/{status,…}.ts` (`StatusSegments`, `statusSegments`); §7 `src/ui/{shell,theme}.ts`, `src/ui/views/{statusline,bufferline}.ts` (`Statusline`)
- **Files:** `src/core/state/status.ts` (`StatusSegments.preview`, `statusSegments`), `src/ui/views/statusline.ts` (`Statusline` drop order), `test/ui/shell.golden.test.ts` and its snapshot
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V36`:** `test/ui/shell.golden.test.ts`.
   - At 120 columns with a note open and preview `on(8731)`, the statusline is `NORMAL │ live │ notes/plan.md │ ← N backlinks │ W words │ preview :8731 │ ◆ index ready │ Ln:Col`.
   - At 120 columns with `sync.ts`: `… │ source │ scripts/sync.ts │ preview :8731 │ …`.
   - At 80 columns, preview, words, and view are dropped.

   **Preview:**

   ```ts
   test("the statusline shows the preview port after the word count", async () => {});
   test("narrow statuslines drop preview, words, then view", async () => {});
   ```

   - Run `bun test test/ui/shell.golden.test.ts`. It must fail.

2. **GREEN:**

   **Preview:**

   ```ts
   // status.ts: StatusSegments + preview: string — "preview :<port>" | "preview off" | "preview …" (starting)
   // statusline.ts: place preview after words; drop order preview → words → view
   ```

   - Review the snapshot diff, and update only the statusline rows.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   // Prohibited: changing other segment texts.
   ```

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(statusline): show the browser preview segment

   Task: P2-G1-T5 — Preview statusline segment
   ```

   - Record the commit SHA.

**Verification:**

- `V36`: `bun test test/ui/shell.golden.test.ts` → pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Biome, tsc, knip, boundaries, and unit suites pass |
| CI suites | `bun run test:ci` | Component, integration, and e2e suites pass |
| Preview imports | `bun test test/boundaries.test.ts` | `src/preview` imports only `src/preview`, `src/core`, and the `katex`/`mermaid` files through `assets.ts`; no `@opentui` |
| No mutating route | Inspect `server.ts` routes | GET only, with 405 otherwise |
| Page origin | `rg -n "https?://" src/preview --glob '!*.test.ts'` | No match outside the `img-src` policy string |

#### Review and Verification Focus

- **Specification:**
  - The DES10 route contract, headers, and stop order.
  - The DES9 escaping and image `src` rules.
  - The DES12 closed asset set and CSP: `'self'` for scripts, fonts, and connections; inline styles only; web images allowed.
  - The DES11 state machine (`off`, `starting`, `on`), idempotence, and failure toasts.
  - The S17 segment order.
- **Technical:**
  - Host allowlist and containment against `%2f` and symlinks.
  - SSE cleanup on cancel.
  - Debounce timing within 300 ms.
  - Exhaustive switches.
  - Logs carry paths and ports only.
  - Lifecycle ordering never blocks terminal restore.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ8, REQ1 → DES9 → S10 → V20, V21` | None | P2-G1 | P2-G1-T1 |
| `REQ7, REQ8 → DES12 → S13 → V48, V47 (boundary part)` | parent UV9@R2 (automated) | P2-G1 | P2-G1-T2 |
| `REQ8, REQ7, REQ1 → DES9, DES10, DES12 → S10, S11, S12, S13 → V22, V23, V24, V26, V27, V28, V30, V34` | parent UV9@R2 (automated) | P2-G1 | P2-G1-T3 |
| `REQ8, REQ1, REQ6 → DES11, DES8 → S9, S12 → V3, V29, V31, V32, V33` | None | P2-G1 | P2-G1-T4 |
| `REQ1, REQ8 → DES11 → S17 → V36` | parent UV1@R2 (full) | P2-G1 | P2-G1-T5 |

### Outputs consumed by later parts

| Output | Producing task | Consumer |
|---|---|---|
| `PAGE` and `ASSETS` (embedded files) | P2-G1-T2 | P3-G1-T3 (V35 compiled-binary check) |
| `:Preview` end to end, with the launcher stubbable through `PATH` | P2-G1-T4 | P3-G1-T3 (V35 via PTY), V42 manual checklist |
| The installed `mermaid` version | P2-G1-T2 | P3-G1-T4 PR description |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary. No gate is due here, and later delivery gates are handed off to P3-G1.
- Every source obligation is covered.

## Planning Gaps

None.
