# W261003HEGE: editor-foundation — Research

**Context Source:** `w261003hege-discuss-context.md`

**Requirements Source:** `w261003hege-requirements.md`

**Requirements Baseline Commit:** `5a90bd8`

**Evaluated Requirement Revisions:** `W261003HEGE-REQ1@R1`, `W261003HEGE-REQ2@R1`, `W261003HEGE-REQ3@R1`, `W261003HEGE-REQ4@R1`, `W261003HEGE-REQ5@R1`, `W261003HEGE-REQ6@R1`, `W261003HEGE-REQ7@R1`, `W261003HEGE-REQ8@R1`, `W261003HEGE-REQ9@R1`, `W261003HEGE-REQ10@R1`, `W261003HEGE-REQ11@R1`

**Research Policy:** One substantive research pass; immutable after acceptance and commit.

# Table of Contents

1. [Research Objective](#1-research-objective)
2. [Research Findings](#2-research-findings)
   - [RF1: Latest stable pins are mutually compatible](#rf1-latest-stable-pins-are-mutually-compatible)
   - [RF2: OpenTUI paint API matches the parent shape](#rf2-opentui-paint-api-matches-the-parent-shape)
   - [RF3: OpenTUI installs its own exit and error handlers](#rf3-opentui-installs-its-own-exit-and-error-handlers)
   - [RF4: OpenTUI fixes a 20 ms Esc timeout and enables kitty only on reply](#rf4-opentui-fixes-a-20-ms-esc-timeout-and-enables-kitty-only-on-reply)
   - [RF5: OpenTUI test renderer and stats support component tests and benchmarks](#rf5-opentui-test-renderer-and-stats-support-component-tests-and-benchmarks)
   - [RF6: Bun has a built-in PTY that drives V17 on both platforms](#rf6-bun-has-a-built-in-pty-that-drives-v17-on-both-platforms)
   - [RF7: One runner cross-compiles all four targets](#rf7-one-runner-cross-compiles-all-four-targets)
   - [RF8: Recursive fs.watch works on macOS and Linux with platform quirks](#rf8-recursive-fswatch-works-on-macos-and-linux-with-platform-quirks)
   - [RF9: release-please needs the build job wired to its outputs](#rf9-release-please-needs-the-build-job-wired-to-its-outputs)
   - [RF10: lowlight common has 37 grammars and no incremental API](#rf10-lowlight-common-has-37-grammars-and-no-incremental-api)
   - [RF11: macOS trash has a non-prompting path on every supported version](#rf11-macos-trash-has-a-non-prompting-path-on-every-supported-version)
   - [RF12: Neovim checks xsel before xclip and OSC 52 copy is uneven](#rf12-neovim-checks-xsel-before-xclip-and-osc-52-copy-is-uneven)
   - [RF13: Neovim 0.11.7 headless recording needs RPC for mode capture](#rf13-neovim-0117-headless-recording-needs-rpc-for-mode-capture)
   - [RF14: The ignore package fits nested .gitignore with caller-side rules](#rf14-the-ignore-package-fits-nested-gitignore-with-caller-side-rules)
3. [Sources](#3-sources)
4. [Confidence and Open Questions](#4-confidence-and-open-questions)

# 1. Research Objective

The baseline requirements are feasible as written, with four corrections for reconciliation: Neovim checks `xsel` before `xclip` (REQ7), the V17 kitty assertion needs the PTY harness to answer OpenTUI's capability query (REQ4), OpenTUI's fixed 20 ms Esc timeout affects parent V3, and macOS before 15 has a non-prompting trash path that is better than Finder (REQ8). No OpenTUI or `fs.watch` result is a material mismatch that returns DI1 to roadmap design.

The roadmap gives DI1's discussion the job of pinning Bun and `@opentui/core` and confirming external APIs and platform behaviour before design (`rm261003abzp-roadmap-phase-1-daily-usable-editor.md:416-423`, `:626-635`). The W261003HEGE requirements at baseline `5a90bd8` already chose pins, test tooling, clipboard, trash, exclusion, and language rules, with "Research Source: None" (`w261003hege-requirements.md:7`). This research checks whether those choices hold and gives system design the concrete APIs. Where the requirements leave a choice to research, it supplies the answer: the exact lowlight language list (REQ11), PTY support (REQ4), and compatible versions (REQ2).

Method: published packages were inspected directly and small experiments were run in the session scratchpad (`…/scratchpad/research`) with Bun 1.4.2, installed through `npm i bun@1.4.2`. Linux was tested with Docker image `oven/bun:1.4.2` (arm64 natively and amd64 under emulation). Neovim 0.11.7 came from the official release tarball. Each finding names the commands used.

**Research Questions:**

- Q1 Versions and compatibility: latest stable Bun, `@opentui/core` 0.5.14 requirements, TypeScript 7.0.2 native `tsc` with `@types/bun`, Biome 2.x, knip 6.x without the TS compiler API, zod 4.x, and how `oven-sh/setup-bun` reads `packageManager`.
- Q2 OpenTUI 0.5.14 APIs: renderer options, custom renderables, frame buffer, colours and attributes, cursor, key events and Esc, mouse, `destroy()`, process handlers, test renderer, stats, OSC 52, and render scheduling.
- Q3 `bun build --compile` cross-compiling an OpenTUI app for four targets from one runner.
- Q4 Bun PTY support and `@xterm/headless` terminal-mode reporting.
- Q5 Bun recursive `fs.watch` on macOS and Linux, tested empirically.
- Q6 release-please action version, manifest keys, outputs, and tag-triggered builds.
- Q7 lowlight 3.3.0 `common` grammars, API, windowed highlighting, and cost.
- Q8 macOS and freedesktop trash mechanics.
- Q9 Neovim clipboard provider order and OSC 52 terminal support.
- Q10 Neovim 0.11 headless recording and obtaining a 0.11.x binary.
- Q11 The `ignore` npm package for `.gitignore` matching.

# 2. Research Findings

## RF1: Latest stable pins are mutually compatible

**Question:** Q1 — Which versions are latest stable on 2026-10-03, and do they work together under Bun with TS 7?

**Finding:** Every version named in REQ2 is the npm `latest` tag on 2026-10-03, and they install, typecheck, lint, and run together under Bun 1.4.2.

| Package | Latest stable | Compatibility evidence |
|---|---|---|
| `bun` | 1.4.2 | GitHub release `bun-v1.4.2`, 2026-09-05 |
| `@opentui/core` | 0.5.14 | `engines.bun >=1.3.0`; installs and runs on Bun 1.4.2 |
| `typescript` | 7.0.2 | Native `tsc` binary; `tsc --noEmit` passes with `@types/bun` 1.4.2 when `skipLibCheck: true` |
| `@biomejs/biome` | 2.5.15 | Native binary; `biome check` runs |
| `knip` | 6.39.0 | Uses `oxc-parser`, does not depend on `typescript` |
| `zod` | 4.6.5 | Schema with defaults parses under Bun 1.4.2 |
| `lowlight` | 3.3.0 | Resolves `highlight.js` 11.11.2 (`~11.11.0`) |
| `@types/bun` | 1.4.2 | Includes the `Bun.Terminal` types |

Two caveats apply. Without `skipLibCheck`, TS 7 reports one error inside OpenTUI's `lib/KeyHandler.d.ts`. The `tsc` launcher is `#!/usr/bin/env node`, so it needs `node` on `PATH` or `bun --bun run tsc`. With no `bun-version` input, `oven-sh/setup-bun@v2` (latest v2.2.0) reads `package.json` `packageManager` (`bun@1.4.2`) by default.

**Requirements Evaluated:**

- `W261003HEGE-REQ2@R1` — exact pins (Bun 1.4.2, `@opentui/core` 0.5.14, TS 7.0.2, lowlight 3.3.0, current Biome, knip, zod), committed `bun.lock`, `--frozen-lockfile`, Bun version from `packageManager`.

**Potential Requirement Impact:** Supports REQ2 as written: no fallback version is needed. It adds two configuration constraints for design, `skipLibCheck: true` and the way `tsc` is invoked. It also names the concrete current versions (Biome 2.5.15, knip 6.39.0, zod 4.6.5) to replace "current stable".

**Evidence:**

- npm `latest` dist-tags on 2026-10-03: `bun` 1.4.2, `@opentui/core` 0.5.14, `typescript` 7.0.2 (`next` is 7.1.0-dev), `@biomejs/biome` 2.5.15, `knip` 6.39.0, `zod` 4.6.5, `lowlight` 3.3.0, `@types/bun` 1.4.2 — [npm bun](https://www.npmjs.com/package/bun), [npm @opentui/core](https://www.npmjs.com/package/@opentui/core), [npm typescript](https://www.npmjs.com/package/typescript), [npm knip](https://www.npmjs.com/package/knip), [npm @biomejs/biome](https://www.npmjs.com/package/@biomejs/biome), [npm zod](https://www.npmjs.com/package/zod)
- Bun 1.4.2 is the latest GitHub release (2026-09-05); OpenTUI v0.5.14 was released 2026-09-30 — [oven-sh/bun releases](https://github.com/oven-sh/bun/releases), [anomalyco/opentui releases](https://github.com/anomalyco/opentui/releases)
- `@opentui/core@0.5.14` declares `engines: { bun: ">=1.3.0" }`, eight optional native packages `@opentui/core-<os>-<arch>[-musl]`, and peer dependency `web-tree-sitter` 0.25.10 — [unpkg @opentui/core@0.5.14/package.json](https://unpkg.com/@opentui/core@0.5.14/package.json)
- TypeScript 7 is a native Go port installed with `npm install -D typescript` and about 10× faster than 6.0 — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [InfoQ](https://www.infoq.com/news/2026/08/typescript-7-released/)
- `typescript@7.0.2` ships `bin/tsc` as a `#!/usr/bin/env node` launcher that `execve`s the native binary from `@typescript/typescript-<platform>`. Its root export is `lib/version.cjs` (no compiler API; only `./unstable/*`) — [unpkg typescript@7.0.2/package.json](https://unpkg.com/typescript@7.0.2/package.json), [unpkg typescript@7.0.2/lib/tsc.js](https://unpkg.com/typescript@7.0.2/lib/tsc.js)
- knip 6.39.0 dependencies are `oxc-parser`, `oxc-resolver`, `get-tsconfig`, and others, with no `typescript` — [unpkg knip@6.39.0/package.json](https://unpkg.com/knip@6.39.0/package.json)
- Without inputs, setup-bun resolves the version from `bun-version`, then `bun-version-file`, then `package.json` (`packageManager.split("bun@")[1] ?? engines.bun`) — [setup-bun src/index.ts](https://github.com/oven-sh/setup-bun/blob/main/src/index.ts), [setup-bun src/utils.ts](https://github.com/oven-sh/setup-bun/blob/main/src/utils.ts), [setup-bun action.yml](https://github.com/oven-sh/setup-bun/blob/main/action.yml)
- Empirical: `bun add` of every pin succeeded on Bun 1.4.2. `bun --bun run tsc --noEmit -p .` printed `Version 7.0.2` and exited 0 with `skipLibCheck: true`; without it, it reported TS2416 in `@opentui/core/lib/KeyHandler.d.ts`. `bun --bun run knip` and `biome check` ran — [npm typescript](https://www.npmjs.com/package/typescript), [npm knip](https://www.npmjs.com/package/knip)

**Rationale and Examples:** REQ2's single version source works without extra workflow inputs:

```yaml
- uses: oven-sh/setup-bun@v2          # reads "packageManager": "bun@1.4.2"
- run: bun install --frozen-lockfile
- run: bun run check                    # check script calls: bun --bun run tsc --noEmit
```

```jsonc
// tsconfig.json (relevant part)
{ "compilerOptions": { "strict": true, "noEmit": true, "types": ["bun"], "skipLibCheck": true,
                       "module": "Preserve", "moduleResolution": "bundler", "verbatimModuleSyntax": true } }
```

**Tradeoffs and Limitations:**

- `skipLibCheck: true` hides type errors in all `.d.ts` files, including third-party ones. It does not affect checking of project sources.
- Local Bun is 1.3.10 (`w261003hege-discuss-context.md:20`). Developers must upgrade, because `packageManager` alone does not switch the local Bun.
- The npm `time.modified` of 2026-10-02 for `bun` and `typescript` reflects canary or dev publishes, not new stable versions.

**Reconciliation Considerations:**

- Record the concrete Biome, knip, and zod versions and the `skipLibCheck` constraint in `.s1mple/docs/languages/typescript.md`, as REQ2's acceptance criterion requires.
- Decide whether scripts call `bun --bun run tsc` (no Node needed) or rely on `node` from the runner image.

## RF2: OpenTUI paint API matches the parent shape

**Question:** Q2 — Do OpenTUI 0.5.14's renderer, custom-renderable, buffer, colour, attribute, and cursor APIs match `rm261003abzp-design.md:778-791`?

**Finding:** Yes. The illustrative `EditorView extends Renderable` with `renderSelf(buffer)` matches the published API. Only option names and the cursor-style vocabulary differ.

- **Renderable:** `abstract class Renderable`, `constructor(ctx: RenderContext, options)`, `protected renderSelf(buffer: OptimizedBuffer, deltaTime: number)`, `requestRender()`, `protected onResize(w, h)`.
- **Buffer:** `OptimizedBuffer` has `drawText(text, x, y, fg, bg?, attributes?)`, `setCell(x, y, char, fg, bg, attributes?)`, `fillRect(x, y, w, h, bg)`, `clear(bg?)`, and scissor and opacity stacks.
- **Colours and attributes:** `RGBA.fromHex/fromInts/defaultForeground/defaultBackground`; `TextAttributes.{BOLD, DIM, ITALIC, UNDERLINE, BLINK, INVERSE, HIDDEN, STRIKETHROUGH}`.
- **Cursor:** `ctx.setCursorPosition(x, y, visible)` and `ctx.setCursorStyle({ style: "block" | "line" | "underline" | "default", blinking })`. Vim's "bar" is `"line"`. `renderer.getCursorState()` returns `{x, y, visible, style, blinking}`.
- **Renderer config:** `createCliRenderer(config)` takes `screenMode: "alternate-screen" | "main-screen" | "split-footer"` (default alternate), `useMouse` (default true), `enableMouseMovement` (default true, emits `?1003h`), `useKittyKeyboard` (default `{}` = disambiguate + alternate keys), `exitOnCtrlC`, `exitSignals`, `consoleMode`, `openConsoleOnError`, `targetFps` (30), `maxFps` (60), `gatherStats`, and `onDestroy`. There is no `useAlternateScreen` or `useConsole` option.
- **Clipboard and raw I/O:** `renderer.copyToClipboardOSC52(text, target?)`, `isOsc52Supported()`, `addInputHandler`, `prependInputHandler`, `subscribeOsc`. A native `createHostClipboard()` also exists (RF12).

**Requirements Evaluated:**

- `W261003HEGE-REQ1@R1` — inherits RM261003ABZP-DES10@R2 (custom `EditorView`, cursor shape, `NO_COLOR` theme) and the G1 shell outputs.
- `W261003HEGE-REQ4@R1` — V17 asserts no colour SGR codes when `NO_COLOR=1`.

**Potential Requirement Impact:** Supports REQ1: the parent's OpenTUI shape is confirmed, so no roadmap design clarification is triggered. It constrains REQ4's `NO_COLOR` assertion: `fillRect` paints white truecolour foreground on blank cells, so the theme must paint every cell with default-intent colours to emit no colour SGR.

**Evidence:**

- `Renderable` declares `constructor(ctx: RenderContext, options: RenderableOptions<any>)`, `protected renderSelf(buffer: OptimizedBuffer, deltaTime: number): void`, and `requestRender(): void` — [unpkg @opentui/core@0.5.14/Renderable.d.ts](https://unpkg.com/@opentui/core@0.5.14/Renderable.d.ts)
- `OptimizedBuffer` declares `drawText`, `setCell`, `fillRect(x, y, width, height, bg: RGBA)`, and `clear(bg?)` — [unpkg @opentui/core@0.5.14/buffer.d.ts](https://unpkg.com/@opentui/core@0.5.14/buffer.d.ts)
- `CursorStyle = "block" | "line" | "underline" | "default"`; `RenderContext` exposes `setCursorPosition`, `setCursorStyle`, `requestRender`, `requestLive`, and `dropLive`; `TextAttributes` lists eight attributes — [unpkg @opentui/core@0.5.14/types.d.ts](https://unpkg.com/@opentui/core@0.5.14/types.d.ts)
- `CliRendererConfig` fields and the `ScreenMode` union; `copyToClipboardOSC52`, `setCursorStyle`, `getStats`, `requestLive`/`dropLive`, `start`/`auto`/`stop`/`destroy` — [unpkg @opentui/core@0.5.14/renderer.d.ts](https://unpkg.com/@opentui/core@0.5.14/renderer.d.ts)
- Defaults in the renderer implementation: `screenMode ?? "alternate-screen"`, `useMouse ?? true`, `enableMouseMovement ?? true`, `targetFps || 30`, `maxFps || 60`, `useKittyKeyboard ?? {}` — [unpkg @opentui/core@0.5.14/chunk-bun-j2z63cdy.js](https://unpkg.com/@opentui/core@0.5.14/chunk-bun-j2z63cdy.js)
- Empirical (`bun smoke-test-renderer.ts`): a `Renderable` subclass painting with `fillRect`, `drawText` (BOLD), `setCell` (INVERSE), and `ctx.setCursorPosition/setCursorStyle` rendered the expected frame. `getCursorState()` returned `{"x":3,"y":1,"visible":true,"style":"block"}` — [OpenTUI repository](https://github.com/anomalyco/opentui)
- Empirical (`bun nocolor-run.ts`, `NO_COLOR=1`, PTY): drawing with `RGBA.defaultForeground()/defaultBackground()` emitted only `39m`/`49m`. `fillRect(…, defaultBackground)` cells were emitted with `\x1b[38;2;255;255;255m` (truecolour white foreground) — [unpkg @opentui/core@0.5.14/buffer.d.ts](https://unpkg.com/@opentui/core@0.5.14/buffer.d.ts)

**Rationale and Examples:** The parent's illustrative class compiles against the real API with only a prop-type adjustment:

```ts
class EditorView extends Renderable {
  constructor(ctx: RenderContext, private getView: () => TextViewInput) { super(ctx, { flexGrow: 1 }); }
  protected renderSelf(buf: OptimizedBuffer): void {
    // paint RenderLine[] with buf.drawText(text, x, y, fg, bg, attrs); never fillRect under NO_COLOR
    this.ctx.setCursorPosition(cx, cy, true);
    this.ctx.setCursorStyle({ style: mode === "insert" ? "line" : "block", blinking: false });
  }
}
```

**Tradeoffs and Limitations:**

- The cursor is renderer-global. With splits, only the focused window's view should call `setCursorPosition`.
- The `NO_COLOR` caveat applies to `fillRect`. Whether `clear(bg)` behaves the same was not tested.
- OpenTUI's default `enableMouseMovement: true` turns on any-motion tracking (`?1003h`). The editor may not need motion events.

**Reconciliation Considerations:**

- Record for parent reconciliation that DES10's illustrative OpenTUI shape is confirmed at 0.5.14, so phase file line 423's return condition is not met.
- Design should map vim cursor shapes to `"block"` and `"line"`, and decide `enableMouseMovement`.

## RF3: OpenTUI installs its own exit and error handlers

**Question:** Q2 — What do `createCliRenderer` and `renderer.destroy()` do to process handlers and terminal state?

**Finding:** OpenTUI's defaults conflict with REQ5, so `so` must override them.

- `exitOnCtrlC` defaults to `true`, so typed `Ctrl-C` destroys the renderer.
- `exitSignals` defaults to `SIGINT, SIGTERM, SIGQUIT, SIGABRT, SIGHUP, SIGPIPE, SIGBREAK, SIGBUS`. The handler only calls `destroy()` and never flushes or exits explicitly.
- The constructor always adds `uncaughtException` and `unhandledRejection` listeners. They log the error and, with `openConsoleOnError` (default `true`), open the in-app console. An uncaught exception therefore leaves the process running in the alternate screen.

`destroy()` removes those listeners, disables mouse, leaves raw mode, pauses stdin, and calls the native `destroyRenderer`. The native call resets the terminal: cursor shown, mouse modes off, bracketed paste off, alternate screen left, kitty keyboard popped, and `modifyOtherKeys` reset.

**Requirements Evaluated:**

- `W261003HEGE-REQ5@R1` — signals and uncaught exceptions: bounded flush, restore, exit codes 0 and 1; typed `Ctrl-C` is a key.
- `W261003HEGE-REQ4@R1` — V17 restore assertions after `:q`, `SIGTERM`, `SIGINT`, and an injected exception.

**Potential Requirement Impact:** Supports REQ5's behaviour but constrains its implementation. The renderer must be created with `exitOnCtrlC: false`, `exitSignals: []`, and `openConsoleOnError: false`, and `so` must install its own signal and exception handlers that flush, then `destroy()`, then `process.exit(code)`. With OpenTUI's defaults, REQ5 fails in two ways: SIGTERM exits without the bounded flush, and an uncaught exception does not exit.

**Evidence:**

- The constructor JSDoc says it "Adds `process.on(...)` listeners for SIGWINCH…, 'warning', 'uncaughtException', 'unhandledRejection', plus the configured `exitSignals`" — [unpkg @opentui/core@0.5.14/renderer.d.ts](https://unpkg.com/@opentui/core@0.5.14/renderer.d.ts)
- In the implementation, `exitOnCtrlC === undefined ? true`, the default `exitSignals` list, `exitHandler = () => this.destroy()`, and `handleError` calls `console.error(error)` and then `this.console.show()` when `_openConsoleOnError` is set. `cleanupBeforeDestroy` removes the listeners, disables mouse, calls `setRawMode(false)` and `stdin.pause()`, and `finalizeDestroy` calls `lib.destroyRenderer` — [unpkg @opentui/core@0.5.14/chunk-bun-j2z63cdy.js](https://unpkg.com/@opentui/core@0.5.14/chunk-bun-j2z63cdy.js)
- Empirical (`bun pty-harness.ts`, real PTY, Bun 1.4.2, macOS):

  | Config | Exit trigger | Result |
  |---|---|---|
  | Overridden handlers | `q` | Exit 0, restored |
  | Overridden handlers | `SIGTERM` | Exit 0, restored |
  | Overridden handlers | `SIGINT` | Exit 0, restored |
  | Overridden handlers | Thrown error | Exit 1, restored |
  | OpenTUI defaults | `SIGTERM` | Exit 0, restored |
  | OpenTUI defaults | `Ctrl-C` | Exit 0, restored |
  | OpenTUI defaults | Thrown error | Still running after 3 s, alternate screen and any-motion mouse active, console overlay showing the stack trace |

  Restored means the last sequences were `?1049l`, `?25h`, and `?1003l`. The restore tail was `…\x1b[>4;0m\x1b[?1003l\x1b[?1002l\x1b[?1000l\x1b[?1006l\x1b[?2004l\x1b[?1049l\x1b[?2031l` — [Bun.spawn terminal option](https://bun.sh/reference/bun/spawn)

**Rationale and Examples:**

```ts
const r = await createCliRenderer({ exitOnCtrlC: false, exitSignals: [], openConsoleOnError: false });
for (const s of ["SIGTERM", "SIGHUP", "SIGINT"] as const)
  process.on(s, () => shutdown(0));                    // flush ≤ 2 s → r.destroy() → process.exit(0)
process.on("uncaughtException", () => shutdown(1));
```

This is the coordinator that the parent names Alfred's `shutdown.ts` for (`w261003hege-discuss-context.md:120`).

**Tradeoffs and Limitations:**

- OpenTUI still registers its own `uncaughtException` listener even when `openConsoleOnError` is false. It logs to its captured console, which is harmless once `so`'s handler exits.
- Behaviour after `kill -9` is out of scope. No handler runs, which matches the parent's restore scope.

**Reconciliation Considerations:**

- Name the required renderer options and handler ownership in system design for RM261003ABZP-DES10@R2 restore and REQ5's 2 s bound.

## RF4: OpenTUI fixes a 20 ms Esc timeout and enables kitty only on reply

**Question:** Q2 — What is the `KeyEvent` shape? How is a lone Esc handled, and when is the kitty keyboard protocol active?

**Finding:** `KeyEvent` carries `name`, `ctrl`, `meta`, `shift`, `option`, `sequence`, `raw`, `eventType` (`press | repeat | release`), `source` (`"raw" | "kitty"`), `code`, `super`, `hyper`, and `repeated`, plus `preventDefault` and `stopPropagation`.

The renderer's stdin parser uses a fixed `timeoutMs: 20`, which is not a `CliRendererConfig` option. In legacy mode, Esc followed by a key within 20 ms becomes one `meta+key` event (Alt), and a lone Esc is delivered as `escape` after about 20 ms. With the kitty protocol active, Esc is unambiguous. OpenTUI sends the kitty push (`CSI > 5 u`, disambiguate + alternate keys) only after the terminal answers the `CSI ? u` query, and pops it with `CSI < u` on destroy.

**Requirements Evaluated:**

- `W261003HEGE-REQ1@R1` — inherits RM261003ABZP-V3@R1 (lone Esc yields `escape` after 50 ms ± 10 ms via `normalizeKey` with `escTimeoutMs=50`) and DES10@R2's kitty input.
- `W261003HEGE-REQ4@R1` — V17 asserts kitty keyboard mode off after exit.

**Potential Requirement Impact:**

- **REQ4:** constrained. A PTY harness that does not answer `CSI ? u` never sees kitty enabled, so "kitty off" passes without testing anything. The harness must reply `CSI ? 0 u` to make the assertion meaningful.
- **REQ1/V3, a parent-reconciliation consideration:** OpenTUI resolves legacy Esc at 20 ms before `normalizeKey` sees a `KeyEvent`. The 50 ms `escTimeoutMs` contract (`rm261003abzp-design.md:425`, `:893-894`) cannot be met by `normalizeKey(e: KeyEvent)` alone. Options are a raw-sequence handler via `prependInputHandler`, re-splitting legacy `meta+key` into Esc + key, or accepting OpenTUI's 20 ms. This is a behavioural difference inside an illustrative signature, not an API mismatch.

**Evidence:**

- `KeyEvent` fields and `ParsedKey.source: "raw" | "kitty"` — [unpkg @opentui/core@0.5.14/lib/KeyHandler.d.ts](https://unpkg.com/@opentui/core@0.5.14/lib/KeyHandler.d.ts), [unpkg @opentui/core@0.5.14/lib/parse.keypress.d.ts](https://unpkg.com/@opentui/core@0.5.14/lib/parse.keypress.d.ts)
- `new StdinParser({ timeoutMs: 20, … })` in the renderer, and `DEFAULT_TIMEOUT_MS = 20` in the parser — [unpkg @opentui/core@0.5.14/chunk-bun-j2z63cdy.js](https://unpkg.com/@opentui/core@0.5.14/chunk-bun-j2z63cdy.js), [unpkg @opentui/core@0.5.14/chunk-bun-sjw2d9bq.js](https://unpkg.com/@opentui/core@0.5.14/chunk-bun-sjw2d9bq.js)
- `KittyKeyboardOptions` defaults are disambiguate true and alternateKeys true, with a link to kitty's progressive enhancement — [unpkg @opentui/core@0.5.14/renderer.d.ts](https://unpkg.com/@opentui/core@0.5.14/renderer.d.ts), [kitty keyboard protocol](https://sw.kovidgoyal.net/kitty/keyboard-protocol/#progressive-enhancement)
- Empirical (`bun smoke-esc.ts`, test renderer):

  | Mode | Input | Events |
  |---|---|---|
  | Legacy | Esc, then `j` with 0 ms gap | `j+meta` |
  | Legacy | Esc, then `j` with 30 ms gap | `escape`, `j` |
  | Kitty | Either gap | `escape(kitty)`, `j(kitty)` |

  [OpenTUI testing API](https://unpkg.com/@opentui/core@0.5.14/testing/mock-keys.d.ts)
- Empirical (`bun pty-kitty.ts`, real PTY): startup sends `\x1b[?u` among capability queries. Without a reply, no kitty push appears. Replying `\x1b[?0u` produced `\x1b[>5u` at start and `\x1b[<u` at exit — [Bun.Terminal types](https://unpkg.com/bun-types@1.4.2/bun.d.ts)

**Rationale and Examples:**

```text
legacy:  ESC ─(<20 ms)─ j  ─► KeyEvent{name:"j", meta:true}     (vim would expect <Esc>j)
         ESC ─(>20 ms)─     ─► KeyEvent{name:"escape"}
kitty:   CSI 27 u, j        ─► escape, j                           (no timeout involved)
```

**Tradeoffs and Limitations:**

- `prependInputHandler` receives sequences before key parsing. Whether it sees a lone `\x1b` before the 20 ms flush was not tested.
- In normal typing, legacy-mode merges need Esc followed by another key within 20 ms. That happens with fast typists and in pasted macros.

**Reconciliation Considerations:**

- Parent reconciliation: RM261003ABZP-V3@R1 and the `escTimeoutMs` default of 50 ms assume the app owns the Esc timeout. Decide in design whether `src/ui/input.ts` intercepts raw input or V3 is restated against OpenTUI's 20 ms.
- REQ4's V17 harness should answer `CSI ? u` (and optionally other queries) so the kitty assertions are exercised.

## RF5: OpenTUI test renderer and stats support component tests and benchmarks

**Question:** Q2 — What does `@opentui/core/testing` provide, and which timing hooks exist?

**Finding:** `createTestRenderer({ width, height, kittyKeyboard?, …CliRendererConfig })` returns a renderer and helpers. It needs no TTY:

- `mockInput` with `pressKey(key, modifiers)`, `pressKeys`, `typeText`, `pressEscape`, and `KeyCodes`;
- `mockMouse`, `renderOnce()`, `flush()`, `waitFor()`, `waitForFrame()`;
- `captureCharFrame()` (a string grid) and `captureSpans()` (`{cols, rows, cursor, lines[{spans[{text, fg, bg, attributes, width}]}]}`);
- `resize()` and `getNativeStats()`.

For benchmarks, `renderer.getStats()` returns `fps`, `frameTimes`, and min, max, and average frame time when `gatherStats` is on. `getNativeStats()` returns native frame and render times. `ManualClock` and `TestRecorder` are also exported.

**Requirements Evaluated:**

- `W261003HEGE-REQ4@R1` — component tests in the CI `test` job; bench harness on one Linux runner.
- `W261003HEGE-REQ1@R1` — inherits UV1, UV2, UV6, and UV10 golden checks and the DI1 bench harness (G1).

**Potential Requirement Impact:** Supports REQ4 and REQ1 as written. Component goldens can use `captureCharFrame`/`captureSpans` (text plus colours and attributes), and the bench harness can measure `update + layoutText + renderOnce` directly.

**Evidence:**

- `TestRendererSetup` members and `createTestRenderer(options: TestRendererOptions)` — [unpkg @opentui/core@0.5.14/testing/test-renderer.d.ts](https://unpkg.com/@opentui/core@0.5.14/testing/test-renderer.d.ts)
- `createMockKeys` API and `KeyCodes` — [unpkg @opentui/core@0.5.14/testing/mock-keys.d.ts](https://unpkg.com/@opentui/core@0.5.14/testing/mock-keys.d.ts)
- `CliRendererStats` and `NativeRenderStats` fields — [unpkg @opentui/core@0.5.14/renderer.d.ts](https://unpkg.com/@opentui/core@0.5.14/renderer.d.ts), [unpkg @opentui/core@0.5.14/zig-structs.d.ts](https://unpkg.com/@opentui/core@0.5.14/zig-structs.d.ts)
- Empirical (`bun smoke-test-renderer.ts`, Bun 1.4.2, M-series Mac): test renderer setup took 72 ms; 100 × (`requestRender` + `renderOnce`) on a 30×6 custom renderable took 3.1 ms. `captureSpans().lines[0]` carried `attributes: 1` (bold) and the fg and bg RGBA — [OpenTUI repository](https://github.com/anomalyco/opentui)

**Rationale and Examples:**

```ts
const { renderer, mockInput, renderOnce, captureCharFrame } = await createTestRenderer({ width: 80, height: 24 });
renderer.root.add(shell);
await mockInput.typeText(":vs"); mockInput.pressEnter(); await renderOnce();
expect(captureCharFrame()).toMatchSnapshot();
```

**Tradeoffs and Limitations:**

- The 72 ms setup per renderer suggests sharing a renderer per test file to protect the `bun run check` < 30 s budget. Component tests are not in `check` per REQ4, but the CI budget still applies.
- Test-renderer timing excludes terminal write cost. `nativeStdoutWriteTime` was 0 in the test renderer.

**Reconciliation Considerations:**

- None beyond confirming the test layering in design.

## RF6: Bun has a built-in PTY that drives V17 on both platforms

**Question:** Q4 — Does Bun 1.4.x spawn processes on a PTY natively? What can `@xterm/headless` report?

**Finding:** Yes. `Bun.spawn(cmd, { terminal: { cols, rows, name, data(term, bytes), exit } })` and `new Bun.Terminal(...)` provide a PTY on POSIX (macOS and Linux) since Bun 1.3.5. They include `write`, `resize`, `setRawMode`, `close`, and termios flags. No `node-pty` or `bun-pty` is needed.

`@xterm/headless` 6.0.0 reports two of the four V17 states:

| State | How `@xterm/headless` 6.0.0 exposes it |
|---|---|
| Alternate screen | `term.buffer.active.type` (`"normal"` or `"alternate"`) |
| Mouse | `term.modes.mouseTrackingMode` |
| Cursor visibility | Not in the public API |
| Kitty keyboard flags | Not in the public API |

Cursor visibility and kitty flags can be observed with `term.parser.registerCsiHandler` hooks (`{prefix:"?", final:"h"|"l"}` for `?25`; `{prefix:">"|"<", final:"u"}` for kitty), or from the last matching sequence in the raw stream.

**Requirements Evaluated:**

- `W261003HEGE-REQ4@R1` — V17 uses Bun's built-in PTY and a headless emulator, with raw-stream assertions for unreported modes; a native PTY add-on only if Bun lacks PTY support; V1 and V17 on `ubuntu` and `macos`.

**Potential Requirement Impact:** Supports REQ4 as written. Bun has PTY support at the pinned version, so the native add-on clause does not apply. The raw-stream rule is needed for cursor visibility and kitty flags.

**Evidence:**

- Bun 1.3.5 added `Bun.Terminal` and the `terminal` option of `Bun.spawn`, POSIX only — [Bun v1.3.5 blog](https://bun.com/blog/bun-v1.3.5), [oven-sh/bun PR #25415](https://github.com/oven-sh/bun/pull/25415)
- Bun 1.4 release notes: "Bun.Terminal is a built-in pseudo-terminal… without node-pty" — [Bun v1.4.0 blog](https://bun.com/blog/bun-v1.4.0)
- `TerminalOptions` (`cols`, `rows`, `name` default `"xterm-256color"`, `data`, `exit`, `drain`) and `class Terminal` (`write`, `resize`, `setRawMode`, `close`, `inputFlags`/`localFlags`), documented "Only available on POSIX systems (Linux, macOS)" — [unpkg bun-types@1.4.2/bun.d.ts](https://unpkg.com/bun-types@1.4.2/bun.d.ts), [Bun.spawn reference](https://bun.sh/reference/bun/spawn)
- `IModes` exposes `mouseTrackingMode: 'none' | 'x10' | 'vt200' | 'drag' | 'any'` and `bracketedPasteMode`, with no cursor-visibility or kitty fields; `registerCsiHandler` exists — [xterm.js typings/xterm-headless.d.ts](https://github.com/xtermjs/xterm.js/blob/master/typings/xterm-headless.d.ts), [npm @xterm/headless](https://www.npmjs.com/package/@xterm/headless)
- Empirical (`bun pty-harness.ts`): after each exit, xterm reported `buffer=normal mouse=none`. The `?25` hook logged a final `show`, and kitty push and pop were seen only with the query reply (RF4). The same harness ran on Linux in `oven/bun:1.4.2` (`bun pty-run.ts`) with exit 0 and restore sequences — [Bun.spawn reference](https://bun.sh/reference/bun/spawn), [xterm.js](https://github.com/xtermjs/xterm.js)

**Rationale and Examples:**

```ts
const proc = Bun.spawn(["./so", fixtureDir], { env: { ...env, NO_COLOR: "1" },
  terminal: { cols: 80, rows: 24, data: (t, d) => { out.push(d); if (has(d, "\x1b[?u")) t.write("\x1b[?0u"); } } });
// after exit: xterm.buffer.active.type === "normal"; xterm.modes.mouseTrackingMode === "none";
// last(/\x1b\[\?25[hl]/) === "\x1b[?25h"; last(/\x1b\[[<>]\d*u/) === "\x1b[<u"
```

**Tradeoffs and Limitations:**

- PTY behaviour on GitHub's hosted macOS runners was not tested here, only on a local Mac and in Linux containers.
- An open-source alternative exists: OpenTUI's own `EmbeddedTerminalRenderable` (ghostty-vt) exposes `screen()` with `cursor.visible` but no mode flags.

**Reconciliation Considerations:**

- REQ4's conditional "native PTY add-on" clause can be marked not triggered.

## RF7: One runner cross-compiles all four targets

**Question:** Q3 — Can one runner `bun build --compile` an `@opentui/core` app for darwin-arm64, darwin-x64, linux-x64, and linux-arm64, and how are native libraries embedded?

**Finding:** Yes, from a macOS arm64 machine after `bun install --os="*" --cpu="*"`. Without that step the build fails with `Could not resolve: "@opentui/core-linux-x64"`. `process.platform` and `process.arch` are inlined per `--target`, and `--define process.env.OPENTUI_LIBC='"glibc"'` removes the musl branch for Linux.

| Target | Binary size | Smoke run in a PTY |
|---|---|---|
| darwin-arm64 | 73 MB | Passed natively |
| darwin-x64 | 80 MB | SIGILL (exit 132) under Rosetta on macOS 14.4 |
| linux-x64 | 99 MB | Passed under amd64 emulation |
| linux-arm64 | 98 MB | Passed in Docker |

At runtime the binary extracts the embedded native library once to `$TMPDIR/.bun-<uid>-<hash>.{dylib,so}`. The file is reused across runs and not deleted.

**Requirements Evaluated:**

- `W261003HEGE-REQ2@R1` — exact `@opentui/core` pin with its native packages and the frozen lockfile.
- `W261003HEGE-REQ4@R1` — CI wall time under 3 min, which includes the release path exercised on `v0.1.0-rc.1` (inherited via REQ1).
- `W261003HEGE-REQ1@R1` — inherits RM261003ABZP-DES15@R1 (single-runner cross-compile, `OPENTUI_LIBC=glibc`, smoke on `macos-latest` and `ubuntu-latest`).

**Potential Requirement Impact:**

- Supports DES15's single-runner design as inherited by REQ1.
- Adds a consideration: the darwin-x64 artifact could not be proven on this machine, and the inherited smoke matrix (`macos-latest` is arm64, `ubuntu-latest` is x64) never runs the darwin-x64 or linux-arm64 binaries.
- REQ2's frozen-lockfile install is compatible: `bun install --frozen-lockfile --os="*" --cpu="*"` only adds optional platform packages already in `bun.lock`.

**Evidence:**

- OpenTUI docs: "Make sure every target native package is installed before compiling… `bun install --os="*" --cpu="*" @opentui/core@<version>`" and "Define `process.env.OPENTUI_LIBC` at build time… embed only the target libc" — [OpenTUI standalone executables](https://opentui.com/docs/reference/standalone-executables/)
- Bun targets `bun-darwin-arm64|x64` and `bun-linux-x64|arm64[-musl]`. On x64, "a single binary that targets Nehalem (SSE4.2) and selects AVX2/AVX-512 code paths at runtime; `-baseline`… resolve to the same binary" — [Bun single-file executables](https://bun.com/docs/bundler/executables)
- `bun install --cpu/--os` overrides the target platform for package selection — [Bun install docs](https://bun.com/docs/pm/cli/install)
- `resolveNativeLibraryPath()` branches on `process.platform`, `process.arch`, and `process.env.OPENTUI_LIBC` and imports `@opentui/core-<os>-<arch>[-musl]`. Each platform package imports `./libopentui.dylib|so` `with { type: "file" }` — [unpkg @opentui/core@0.5.14/chunk-bun-sjw2d9bq.js](https://unpkg.com/@opentui/core@0.5.14/chunk-bun-sjw2d9bq.js), [unpkg @opentui/core-darwin-arm64@0.5.14/index.bun.js](https://unpkg.com/@opentui/core-darwin-arm64@0.5.14/index.bun.js)
- A downstream report found earlier Bun builds extracted the embedded `libopentui.so` to a random `/tmp` path on every launch and leaked it when exit handlers did not run — [ranxianglei/opencode-stable PR #1](https://github.com/ranxianglei/opencode-stable/pull/1)
- Rosetta 2 does not run some AVX code, producing "illegal hardware instruction" — [Apple Developer Forums thread 667213](https://developer.apple.com/forums/thread/667213)
- Empirical (`xc/`):
  - `bun build --compile --target=bun-<t> [--define process.env.OPENTUI_LIBC='"glibc"'] main.ts` produced four binaries with correct `file` types.
  - `bun pty-run.ts` smoke runs passed on darwin-arm64 natively, linux-arm64 in Docker arm64, and linux-x64 in Docker amd64 (emulated).
  - `arch -x86_64` on the darwin-x64 and darwin-x64-baseline OpenTUI binaries gave exit 132. A plain Bun darwin-x64 hello-world ran under Rosetta, which points at the x64 `libopentui.dylib` rather than Bun.
  - Two runs with the same `TMPDIR` left one `.bun-501-33eea43aef98a673.dylib` file.

  [Bun single-file executables](https://bun.com/docs/bundler/executables)

**Rationale and Examples:**

```bash
bun install --frozen-lockfile --os="*" --cpu="*"
for t in darwin-arm64 darwin-x64; do bun build --compile --target=bun-$t src/app/main.ts --outfile dist/so-$t; done
for t in linux-x64 linux-arm64; do bun build --compile --target=bun-$t --define 'process.env.OPENTUI_LIBC="glibc"' src/app/main.ts --outfile dist/so-$t; done
```

**Tradeoffs and Limitations:**

- The SIGILL result is Rosetta-specific evidence from a macOS 14.4 machine (Rosetta added AVX2 only in macOS 15, per Apple's notes, which were not fetched here). Behaviour on a real Intel Mac is unknown.
- The binary leaves one native-library file per user and content hash in `$TMPDIR`. This is bounded, but the requirement that `so` writes nothing into the workspace is unaffected, because `$TMPDIR` is outside the workspace.
- `--os="*" --cpu="*"` also downloads every TypeScript and Biome platform binary unless the release job installs production dependencies only.
- Sizes (73–99 MB) are for a minimal app. lowlight and the app code will add a little.

**Reconciliation Considerations:**

- Parent reconciliation (DES15, `rm261003abzp-design.md:1259`): consider adding smoke runs of `so --version` on an Intel macOS runner (if available) and an arm64 Linux runner. Without them two of four artifacts ship unexecuted.
- Note the extracted native-library file for user-facing documentation, if desired.

## RF8: Recursive fs.watch works on macOS and Linux with platform quirks

**Question:** Q5 — Does Bun's `fs.watch(dir, { recursive: true })` report atomic rename-over saves, new subdirectories, deletions, and directory moves on macOS and Linux?

**Finding:** Yes on both platforms with Bun 1.4.2, empirically. Atomic saves, deletes, new nested folders and the files in them, directory renames, and recursive removals were all reported, and symlinks were not followed.

| Scenario | macOS (FSEvents) | Linux (inotify) |
|---|---|---|
| Atomic save (temp write + rename over) | `rename tmp`, `rename note.md` | `rename tmp`, `change tmp`, `rename tmp`, `rename note.md` |
| Delete | `rename gone.md` | `rename gone.md` |
| New folder, then file inside | `rename new`, `rename new/inner.md` | Same, plus `change` |
| Nested `mkdir -p` + file | All three paths reported | All three paths reported, plus `change` |
| Directory rename | `rename new`, `rename moved` | Same, plus a `rename` for every child under the new name |
| `rm -r` | Each child, then the folder | Same |
| Entries created just before `watch()` | Spurious `rename` events for them | None |
| Symlink loop and symlink to outside folder | No hang; outside writes not reported | Same |

Event type is almost always `rename`, so the watcher must `stat` each path rather than trust the event type. Open upstream issues remain, for example silent skipping of unreadable directories on Linux.

**Requirements Evaluated:**

- `W261003HEGE-REQ4@R1` — V1 recursive `fs.watch` proven on `ubuntu` and `macos` runners.
- `W261003HEGE-REQ6@R1` — deleted-on-disk and file-reappears handling driven by watcher events.
- `W261003HEGE-REQ9@R1` — symlinked folders never followed during watching.
- `W261003HEGE-REQ10@R1` — explorer rename and move of open files and folders.

**Potential Requirement Impact:**

- Supports REQ4's two-platform V1. No failure triggers the phase file's return to design.
- Supports REQ6: deletes arrive as `rename` and require an existence `stat`.
- Supports REQ9: Bun does not follow symlinks.
- Constrains REQ10 and own-write handling: `so`'s own renames, moves, and directory moves also produce events (Linux re-reports every child of a moved folder), so own-operation stamps must cover renames, not just writes.

**Evidence:**

- Bun 1.3.14 fixed recursive watching of directories created after the watch started (Linux). Bun 1.4 uses FSEvents on macOS. Open caveats: watched-root events differ from Node (#43066) and symlink-target changes are not reported (#43065) — [talkasab/peruse issue #37](https://github.com/talkasab/peruse/issues/37), [oven-sh/bun #43066](https://github.com/oven-sh/bun/issues/43066), [oven-sh/bun #43065](https://github.com/oven-sh/bun/issues/43065)
- Open: recursive watch on Linux skips unreadable directories with no `error` event (reported against 1.4.3, fix unmerged) — [oven-sh/bun #44246](https://github.com/oven-sh/bun/issues/44246)
- Linux duplicate subdirectory change reports and directory attribute-change mapping are being refined upstream — [oven-sh/bun PR #44007](https://github.com/oven-sh/bun/pull/44007), [oven-sh/bun PR #43083](https://github.com/oven-sh/bun/pull/43083)
- Empirical (`bun watch-test.ts` on macOS 14.4; `docker run oven/bun:1.4.2 bun watch-test.ts` on Linux arm64 and amd64; Docker was available, so Linux was tested empirically on overlayfs in-container paths): the event sequences in the table above. `bun watch-symlink.ts` returned `watch()` in 0.7–1.4 ms despite an `a/loop -> ..` symlink, and no event for `outside/x.md` behind `ext -> outside` — [Bun fs.watch guide](https://bun.sh/guides/read-file/watch)

**Rationale and Examples:** The parent watcher shape (`rm261003abzp-design.md:752-753`, debounce 50 ms per path, ignore own stamps) fits. Events are hints, and the reducer acts on a `stat` and stamp comparison:

```text
event(path) → debounce 50 ms → stat(path)
   ├─ ENOENT              → deleted on disk (REQ6) │ or folder removed → explorer refresh
   ├─ stamp ∈ ownWrites   → ignore
   └─ stamp ≠ buffer stamp → reload (clean) │ conflict (dirty)
```

**Tradeoffs and Limitations:**

- Docker Desktop's Linux VM is not a GitHub `ubuntu` runner. REQ4's CI V1 remains the authoritative proof.
- The macOS spurious-event behaviour comes from FSEvents latency replay. It was reproduced twice but not characterised beyond about 300 ms.
- Unreadable subdirectories on Linux are silently unwatched (#44246).

**Reconciliation Considerations:**

- Parent reconciliation: no material mismatch; record the result against phase file line 630.
- Design should treat event type as advisory and include renames and moves in own-operation suppression for REQ10.

## RF9: release-please needs the build job wired to its outputs

**Question:** Q6 — Which release-please action version, manifest keys, and outputs apply? How do a release-please release and a manually pushed `v0.1.0-rc.1` tag both trigger the four-target build?

**Finding:** The current major is `googleapis/release-please-action@v5` (v5.0.0, 2026-04-22; the breaking change is node24). The README still shows `@v4` in places.

- **Inputs:** `token`, `release-type`, `config-file` (default `release-please-config.json`), `manifest-file` (default `.release-please-manifest.json`), `target-branch`, `skip-github-release`, `skip-github-pull-request`, `include-component-in-tag`, `versioning-strategy`, `release-as`.
- **Outputs:** `release_created`, `tag_name`, `version`, `releases_created`, `paths_released`, and path-prefixed variants.
- **Manifest config** (`packages: { ".": {...} }`): `release-type` (`node` updates `package.json`; `simple` uses a version file), `bump-minor-pre-major`, `bump-patch-for-minor-pre-major`, `initial-version`, `include-v-in-tag` (default true), `include-component-in-tag` (default true), `prerelease`, and `draft`.

Releases and tags that release-please creates with `GITHUB_TOKEN` do not trigger other workflows (only `workflow_dispatch` and `repository_dispatch` are exempt). A `push: tags: ['v*']` workflow therefore runs for a tag the user pushes, but not for one release-please creates.

**Requirements Evaluated:**

- `W261003HEGE-REQ1@R1` — inherits RM261003ABZP-DES15@R1 (release-please on `main`, release job on tag, `v0.1.0-rc.1` exercise) and RM261003ABZP-REQ10@R2.
- `W261003HEGE-REQ2@R1` — exact versions pinned and upgraded deliberately (action major included by analogy).

**Potential Requirement Impact:** Constrains DES15's inherited "release job on tag". To serve both triggers with one definition, the build must either run as a reusable workflow called from the release-please job when `release_created` is true, or release-please must use a PAT. Supports exercising the path on a manually pushed `v0.1.0-rc.1`.

**Evidence:**

- v5.0.0 release notes: "BREAKING CHANGES: upgrade to node24", 2026-04-22 — [release-please-action v5.0.0](https://github.com/googleapis/release-please-action/releases/tag/v5.0.0)
- `action.yml` inputs list and `using: 'node24'` — [release-please-action action.yml](https://github.com/googleapis/release-please-action/blob/main/action.yml)
- README outputs (`release_created`, `tag_name`, `version`, `releases_created`, `paths_released`) and the conditional publish example — [release-please-action README](https://github.com/googleapis/release-please-action)
- Config schema descriptions for `bump-minor-pre-major`, `initial-version`, `include-v-in-tag` ("Defaults to `true`"), and `prerelease`, and the special `"."` path — [release-please config schema](https://github.com/googleapis/release-please/blob/main/schemas/config.json), [manifest-releaser docs](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)
- "events triggered by the `GITHUB_TOKEN` will not create a new workflow run, with the following exceptions: `workflow_dispatch` and `repository_dispatch`" — [GitHub Docs: GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token)

**Rationale and Examples:**

```yaml
# .github/workflows/release-please.yml
jobs:
  rp:
    runs-on: ubuntu-latest
    outputs: { created: ${{ steps.rp.outputs.release_created }}, tag: ${{ steps.rp.outputs.tag_name }} }
    steps: [{ id: rp, uses: googleapis/release-please-action@v5 }]
  build:
    needs: rp
    if: ${{ needs.rp.outputs.created == 'true' }}
    uses: ./.github/workflows/release.yml          # on: [workflow_call, push: { tags: ['v*'] }]
    with: { tag: ${{ needs.rp.outputs.tag }} }
```

```json
// release-please-config.json
{ "packages": { ".": { "release-type": "node", "bump-minor-pre-major": true, "include-component-in-tag": false } } }
// .release-please-manifest.json → { ".": "0.0.0" }   (first feat → 0.1.0)
```

**Tradeoffs and Limitations:**

- `include-component-in-tag` defaults to true. With `"."` and `release-type: node`, set it false to get plain `v0.1.0` tags. This inference from the schema default was not run.
- A PAT avoids the reusable-workflow split but adds a secret to rotate.
- How `initial-version` interacts with an existing manifest entry was not tested.

**Reconciliation Considerations:**

- Pin `release-please-action@v5` and decide reusable workflow versus PAT in design. The `-rc.1` tag build should create a GitHub prerelease.

## RF10: lowlight common has 37 grammars and no incremental API

**Question:** Q7 — Exactly which grammars are in lowlight 3.3.0 `common`, what does the API return, can highlighting be per-line with state, and what does it cost?

**Finding:** `common` has exactly 37 grammars:

`arduino bash c cpp csharp css diff go graphql ini java javascript json kotlin less lua makefile markdown objectivec perl php php-template plaintext python python-repl r ruby rust scss shell sql swift typescript vbnet wasm xml yaml`

- **Included:** `makefile` (alias `mk`), `ini` (named "TOML, also INI", alias `toml`), `yaml` (alias `yml`), `bash` (aliases include `sh`, `zsh`), `typescript` (alias `ts`), `xml` (alias `html`), `markdown` (alias `md`), JSON, Go, Rust, Python, and CSS.
- **Not included:** `dockerfile`. It is available as `highlight.js/lib/languages/dockerfile` via `lowlight.register`.
- **Naming trap:** `shell` is "Shell Session" (console transcripts), not shell scripts. Shell scripts map to `bash`.

`createLowlight(common).highlight(lang, value, { prefix? })` returns a hast `Root` with `data: { language, relevance }`, with `span.hljs-*` elements whose text can contain newlines. There is no continuation or state API: lowlight calls `hljs.highlight(value, { ignoreIllegals: true, language })`. Windowed highlighting must therefore highlight look-back plus visible lines as one string, then split the hast into per-line marks.

Measured on Bun 1.4.2 (M-series): 1.74 ms per highlight of 260 TypeScript lines (9.2 KB), and 35.5 ms for 5,000 lines.

**Requirements Evaluated:**

- `W261003HEGE-REQ11@R1` — one code file type per `common` language; static extension and file-name table; `Makefile` → `makefile`; `Dockerfile` → `dockerfile` "when that grammar is in the set"; unit test that every registered id exists in the bundle.
- `W261003HEGE-REQ1@R1` — inherits `lowlightHighlighter` with 200-line look-back cached per buffer version (`rm261003abzp-design.md:679`) and the source-view keystroke benchmark.

**Potential Requirement Impact:**

- Supports REQ11 and supplies its "exact list confirmed by research": 37 ids.
- Constrains the table: `.sh`/`.bash`/`.zsh` → `bash`; `.toml` → `ini`; `.html`/`.xml`/`.svg` → `xml`. `shell` and `python-repl` are session grammars with no natural extension, and `plaintext` duplicates the `text` file type.
- `Dockerfile` is not in the set, so under REQ11 it stays `text` unless one extra registration is added.
- For REQ1, windowed highlighting of about 260 lines costs about 1.7 ms, within a 16 ms keystroke budget.

**Evidence:**

- `common.js` lists the bundled grammars; `lowlight` 3.3.0 depends on `highlight.js ~11.11.0` — [unpkg lowlight@3.3.0/lib/common.js](https://unpkg.com/lowlight@3.3.0/lib/common.js), [unpkg lowlight@3.3.0/package.json](https://unpkg.com/lowlight@3.3.0/package.json)
- `highlight(language, value, options?)` calls `high.highlight(value, {ignoreIllegals: true, language})` and sets `data.language` and `data.relevance`; `Options` has only `prefix` — [unpkg lowlight@3.3.0/lib/index.js](https://unpkg.com/lowlight@3.3.0/lib/index.js), [lowlight README](https://github.com/wooorm/lowlight)
- highlight.js 11 public `highlight(code, {language, ignoreIllegals})`; the old `(lang, code, ignoreIllegals, continuation)` form is deprecated since 10.7.0, and continuations are internal (`_highlight`) — [highlight.js core.js](https://github.com/highlightjs/highlight.js/blob/main/src/highlight.js)
- Grammar names: `shell.js` `name: 'Shell Session'`; `ini.js` `name: 'TOML, also INI', aliases: ['toml']`; `xml.js` `name: 'HTML, XML'` — [highlight.js languages](https://github.com/highlightjs/highlight.js/tree/main/src/languages)
- Empirical (`bun ll.ts`): `Object.keys(common).length === 37`; `registered()` true for makefile, ini, toml, yaml, bash, sh, zsh, typescript, ts, xml, html, markdown, md, json, go, rust, python, and css; false for dockerfile and docker; timings as above — [npm lowlight](https://www.npmjs.com/package/lowlight)

**Rationale and Examples:**

```text
visible rows 400..440, look-back 200 → highlight(lang, lines[200..440].join("\n")) → hast
→ walk text nodes, split on "\n" → marks per line → keep rows 400..440 → cache by (bufferVersion, range)
```

**Tradeoffs and Limitations:**

- Highlighting from 200 lines above can start inside a multi-line construct (a block comment or template literal) and mis-colour the top of the window. That is inherent to the parent's look-back design.
- Timings are from one Apple-silicon machine. CI runners will be slower.

**Reconciliation Considerations:**

- REQ11 reconciliation: fix the language list at the 37 ids. Decide whether session grammars (`shell`, `python-repl`) and `plaintext` get file types, and whether `dockerfile` is added (one registration plus a direct `highlight.js` dependency).

## RF11: macOS trash has a non-prompting path on every supported version

**Question:** Q8 — How do `/usr/bin/trash`, Finder via `osascript`, and the freedesktop Trash 1.0 spec work?

**Finding:** On macOS, `/usr/bin/trash` exists from macOS 15 (syntax `trash [-h] [-v] [-i] [--empty] <path>…`). It is absent on this macOS 14.4 machine.

`osascript -e 'tell application "Finder" to delete POSIX file "…"'` sends Apple Events to Finder. It requires an Automation (TCC) grant for the calling terminal app and fails with error −1743 when denied. That is the prompt REQ8 wants to avoid.

A third path works on macOS 14 without Finder and without a prompt: `NSFileManager.trashItemAtURL` called through JXA (`osascript -l JavaScript`). It is the system API that Finder and `/usr/bin/trash` build on. It returned `ok`, removed the file, and showed no prompt. On a nonexistent path it printed `failed` and still exited 0, so callers must read stdout, not the exit code.

Freedesktop Trash 1.0 (2014-01-02) requires these steps:

- Create `$trash/info/<name>.trashinfo` first, atomically with `O_EXCL`, and pick another name on collision. Then move the item into `$trash/files/<name>`.
- The file starts with `[Trash Info]`. `Path=` holds the original path, absolute for the home trash, with bytes escaped per RFC 2396 §2. `DeletionDate=YYYY-MM-DDThh:mm:ss` is in local time.
- `directorysizes` is a SHOULD cache for trashed directories, not a MUST.
- When the item is on another device and the topdir trash is unavailable, the implementation "MUST either trash the file into the user's home trash or refuse to trash it", and if it refuses it "MUST clearly warn".

**Requirements Evaluated:**

- `W261003HEGE-REQ8@R1` — Linux freedesktop home trash implemented in-process; macOS `/usr/bin/trash` when present, else Finder via `osascript`; typed-confirm fallback.
- `W261003HEGE-REQ10@R1` — delete flushes pending saves first, then trashes.

**Potential Requirement Impact:**

- Supports REQ8's Linux design and its fallback; the fallback satisfies the spec's "refuse + clearly warn" branch.
- Supports `/usr/bin/trash` on macOS 15 and later.
- Challenges the Finder branch: a non-prompting `NSFileManager` call via JXA covers macOS before 15 without the Automation prompt that REQ8's rationale rejects. It also needs no `/usr/bin/trash`.
- REQ8 may want to state that `directorysizes` is not written (allowed by SHOULD) or is updated.

**Evidence:**

- "Since macOS 15, there is now a built-in `trash` command" — [sindresorhus/macos-trash](https://github.com/sindresorhus/macos-trash)
- `trash` usage: `trash [--help | -h] [--version | -v] [--interactive | -i] [--empty] <path> […]` — [sindresorhus/macos-trash](https://github.com/sindresorhus/macos-trash)
- Finder Apple Events from `osascript` fail with "Not authorized to send Apple events to Finder. (error -1743)" without an Automation or PPPC grant — [Apple Developer Forums thread 709877](https://developer.apple.com/forums/thread/709877), [Apple Developer Forums thread 703664](https://developer.apple.com/forums/thread/703664)
- `NSFileManager trashItemAtURL:resultingItemURL:error:` moves an item to the Trash — [Apple Developer: trashItem(at:resultingItemURL:)](https://developer.apple.com/documentation/foundation/filemanager/trashitem(at:resultingitemurl:))
- Trash spec 1.0 (Release 1.0, 2014-01-02): `.trashinfo` format, RFC 2396 escaping, local-time `DeletionDate`, info-first `O_EXCL` creation, `directorysizes` SHOULD, and the topdir fallback with "MUST either trash the file into the user's 'home trash' or refuse… MUST clearly warn" — [freedesktop Trash Specification 1.0](https://specifications.freedesktop.org/trash/1.0/)
- Empirical (macOS 14.4): `ls /usr/bin/trash` → no such file. `osascript -l JavaScript -e "ObjC.import('Foundation'); $.NSFileManager.defaultManager.trashItemAtURLResultingItemURLError($.NSURL.fileURLWithPath('<tmp file>'), null, null) ? 'ok' : 'failed'"` printed `ok`, removed the file, and showed no prompt. On `/nonexistent/x` it printed `failed` with exit 0. Passing `Ref()` out-parameters crashed `osascript` (exit 139). The Finder variant was not run, to avoid triggering a TCC prompt on the user's machine — [Apple Developer: trashItem(at:resultingItemURL:)](https://developer.apple.com/documentation/foundation/filemanager/trashitem(at:resultingitemurl:))

**Rationale and Examples:**

```text
[Trash Info]
Path=/home/u/notes/My%20draft.md
DeletionDate=2026-10-03T14:05:09
```

```text
Linux:  open(info/draft.md.trashinfo, O_CREAT|O_EXCL) → EEXIST? try "draft.md.1" …
        → rename(src, files/<name>) → EXDEV? unlink info, fall back to typed confirm
macOS:  /usr/bin/trash <path> (15+) │ osascript -l JavaScript (NSFileManager) │ typed confirm on failure
```

**Tradeoffs and Limitations:**

- The JXA path depends on `osascript`'s ObjC bridge, a long-standing but niche API. It reports errors only through its output, and its exit code stayed 0 on failure.
- `/usr/bin/trash` exit codes and permission behaviour were not verified, because macOS 15 was not available.
- One probe file was moved to the user's Trash during the experiment.

**Reconciliation Considerations:**

- Consider revising REQ8's macOS chain to `/usr/bin/trash` → JXA `NSFileManager` → typed confirm, dropping or demoting Finder. Check the result by output text, not exit code.
- State the `.trashinfo` naming and `directorysizes` decision explicitly.

## RF12: Neovim checks xsel before xclip and OSC 52 copy is uneven

**Question:** Q9 — In what order does Neovim detect clipboard providers, and which terminals support OSC 52 copy and paste?

**Finding:** Neovim 0.11.7 detects providers in this order: `g:clipboard` → pbcopy (`has('mac')`) → wl-copy (`$WAYLAND_DISPLAY` and both commands) → waycopy → **xsel** (`$DISPLAY` and `xsel -o -b` succeeds) → **xclip** → lemonade → doitclient → Windows tools → termux → tmux (`$TMUX`) → OSC 52 (only when the TUI detects support and `'clipboard'` is empty). REQ7's "xclip, then xsel" therefore reverses Neovim's order.

OSC 52 support varies by terminal:

| Terminal | OSC 52 copy | OSC 52 paste (read) |
|---|---|---|
| kitty | Yes (default `write-clipboard`) | Asks permission (`read-clipboard-ask`) |
| Ghostty | Yes (`clipboard-write` allows) | Prompts (`clipboard-read` asks) |
| WezTerm | Yes | "Requests to query the clipboard are ignored" |
| iTerm2 | Only when "Applications in terminal may access clipboard" is enabled | Not supported |
| Terminal.app | Not supported (macOS 26 included) | Not supported |
| GNOME Terminal and other VTE terminals | Not supported | Not supported |
| tmux | Forwards only with `set-clipboard on`; the default `external` ignores apps' OSC 52 | Not supported |

OpenTUI also offers `renderer.copyToClipboardOSC52` and a native host clipboard (`createHostClipboard`, implemented in the Zig library, with a Wayland seat option). These are alternatives to shelling out, but they are only usable from `src/ui`.

**Requirements Evaluated:**

- `W261003HEGE-REQ7@R1` — provider chain "in Neovim's order": pbcopy → wl-copy → xclip → xsel → OSC 52 copy-only; session fallback for paste; `clipboard unavailable` on failure.

**Potential Requirement Impact:**

- Challenges REQ7's X11 order: to follow Neovim, check `xsel`, gated on `xsel -o -b` succeeding, before `xclip`.
- Supports OSC 52 as copy-only, because read support is rare or prompts.
- Adds two considerations:
  - Inside tmux with default settings, OSC 52 from `so` does not reach the system clipboard. Neovim puts a tmux provider (`tmux load-buffer`/`save-buffer`) before OSC 52.
  - Terminal.app users without pbcopy are impossible on macOS, so the OSC 52 gap there does not matter locally.

**Evidence:**

- Neovim 0.11.7 `provider.txt` `*clipboard-tool*` priority list and the `*clipboard-osc52*` notes ("not all terminal emulators support reading from the system clipboard") — [neovim v0.11.7 runtime/doc/provider.txt](https://github.com/neovim/neovim/blob/v0.11.7/runtime/doc/provider.txt)
- Detection code: `elseif !empty($DISPLAY) && executable('xsel') && s:cmd_ok('xsel -o -b')` precedes `elseif !empty($DISPLAY) && executable('xclip')`, and `tmux` precedes `osc52` — [neovim v0.11.7 runtime/autoload/provider/clipboard.vim](https://github.com/neovim/neovim/blob/v0.11.7/runtime/autoload/provider/clipboard.vim)
- kitty `clipboard_control` default `write-clipboard write-primary read-clipboard-ask read-primary-ask` — [kitty options definition](https://github.com/kovidgoyal/kitty/blob/master/kitty/options/definition.py), [kitty.conf docs](https://sw.kovidgoyal.net/kitty/conf/)
- Ghostty `clipboard-read` default asks, `clipboard-write` default allows — [Ghostty config reference](https://ghostty.org/docs/config/reference)
- WezTerm: "Requests to query the clipboard are ignored. Allows setting or clearing the clipboard" — [WezTerm escape sequences](https://wezterm.org/escape-sequences.html)
- iTerm2: "clipboard access will be granted via escape code… They will be able to set the contents of the system pasteboard" — [iTerm2 General preferences](https://iterm2.com/documentation-preferences-general.html)
- OSC 52 copy support table (Terminal.app and VTE unsupported; tmux since 2.5) — [can-i-use-terminal OSC 52 copy](https://can-i-use-terminal.github.io/features/osc52copy.html), [hermes-agent issue #15664](https://github.com/NousResearch/hermes-agent/issues/15664)
- tmux `set-clipboard` default `external`: "tmux sets the clipboard only; applications inside cannot modify it"; `on` lets applications set it — [tmux wiki: Clipboard](https://github.com/tmux/tmux/wiki/Clipboard)
- OpenTUI `copyToClipboardOSC52`, `isOsc52Supported`, `createHostClipboard`, and `ClipboardWriteDestination` (`terminal-only | host-only | best-available | all-available`) — [unpkg @opentui/core@0.5.14/lib/clipboard.d.ts](https://unpkg.com/@opentui/core@0.5.14/lib/clipboard.d.ts), [unpkg @opentui/core@0.5.14/renderer.d.ts](https://unpkg.com/@opentui/core@0.5.14/renderer.d.ts)

**Rationale and Examples:**

```text
startup: mac → pbcopy │ WAYLAND_DISPLAY ∧ wl-copy ∧ wl-paste │ DISPLAY ∧ xsel ∧ `xsel -o -b` ok │ DISPLAY ∧ xclip
         │ (optional) TMUX ∧ tmux │ OSC 52 copy-only
```

**Tradeoffs and Limitations:**

- The OSC 52 matrix mixes vendor docs and a community table. Terminal.app's status comes from secondary sources.
- OpenTUI's native host clipboard was not tested. Using it would move clipboard I/O into `src/ui`, against the parent's placement in `src/workspace/system.ts`.

**Reconciliation Considerations:**

- Revise REQ7's X11 order to xsel before xclip, or drop the "Neovim's order" claim.
- Decide whether to add the tmux provider before OSC 52, or document that tmux needs `set-clipboard on`.

## RF13: Neovim 0.11.7 headless recording needs RPC for mode capture

**Question:** Q10 — How can headless Neovim 0.11 record text, cursor, mode, and registers per case? What are the pitfalls, and how is an exact 0.11.x binary obtained?

**Finding:** The latest 0.11 patch is **v0.11.7** (2026-03-28). It ships official tarballs `nvim-macos-arm64.tar.gz`, `nvim-macos-x86_64.tar.gz`, `nvim-linux-x86_64.tar.gz`, and `nvim-linux-arm64.tar.gz`; stable is 0.12.5. Three behaviours shape the recorder:

- **`nvim_feedkeys(keys, "xt", false)` records ended states only.** It works for cases that end in Normal or Visual mode, after which `getline`, `nvim_win_get_cursor`/`getcurpos`, `nvim_get_mode`, and `getreg`/`getregtype` read the state. But `x` ends Insert mode "as if <Esc> is typed" and moves the cursor left, and it aborts pending operators. Adding `!` (`xt!`) keeps Insert mode but blocks forever in headless mode.
- **Use `--listen` for cases ending in Insert or operator-pending mode.** Start `nvim --clean --headless --listen <sock>`, send keys with `nvim --server <sock> --remote-send` (or `--remote-expr "nvim_input(…)"`), then query with `--remote-expr 'json_encode({…mode(1)…})'`. This returned `mode: "i"` and `"no"` correctly.
- **Defaults and setup.** Built-in default mappings are active under both `--clean` and `--clean -u NONE` (`Y` → `y$`, `&` → `:&&<CR>`; `timeoutlen` 1000). Buffer setup with `nvim_buf_set_lines` is undoable, so a case ending in `u` undoes the fixture unless setup clears undo history.

**Requirements Evaluated:**

- `W261003HEGE-REQ3@R1` — committed recorder runs Neovim 0.11.x `--clean --headless`, records text, cursor, mode, and register values, refuses non-0.11.x, and is not run in CI.

**Potential Requirement Impact:**

- Supports REQ3. The binary is obtainable as a release tarball on both developer platforms, and `nvim --version` gives `NVIM v0.11.7` for the version guard.
- Constrains the recorder design: recording "mode" after keys that leave Insert or operator-pending mode needs the `--listen`/`--remote-*` (or `--embed` msgpack-RPC) path, not `feedkeys(…, 'x')`.

**Evidence:**

- v0.11.7 release assets (macOS arm64/x86_64, Linux x86_64/arm64 tarballs and AppImages), 2026-03-28; v0.12.5 is the current stable — [neovim releases v0.11.7](https://github.com/neovim/neovim/releases/tag/v0.11.7), [neovim releases](https://github.com/neovim/neovim/releases)
- `feedkeys` flags: `'x'` "when Vim ends in Insert mode it will behave as if <Esc> is typed, to avoid getting stuck"; `'!'` "When used with 'x' will not end Insert mode" — [neovim v0.11.7 runtime/doc/vimfn.txt](https://github.com/neovim/neovim/blob/v0.11.7/runtime/doc/vimfn.txt)
- `--clean` "Loads builtin plugins, unlike '-u NONE -i NONE'"; `--remote-send` and `--remote-expr` semantics — [neovim v0.11.7 runtime/doc/starting.txt](https://github.com/neovim/neovim/blob/v0.11.7/runtime/doc/starting.txt), [neovim v0.11.7 runtime/doc/remote.txt](https://github.com/neovim/neovim/blob/v0.11.7/runtime/doc/remote.txt)
- Empirical (`nvim-macos-arm64` v0.11.7 from the tarball; `nvim --clean --headless -c "luafile rec.lua"`):
  - `dw` → `bar baz`, unnamed `foo ` (`v`); `ciwqux<Esc>` at `bar` → `foo qux baz`, cursor `[1,6]`.
  - `"ayyj"Ap` → reg `a` = `one\n` (`V`).
  - `Ahello` with `xt` → mode `n`, cursor `[1,7]`; with `xt!` → hung until killed by `timeout 20` (exit 124).
  - `d` with `xt` → mode `n`.
  - A `--listen` server with `--remote-send 'Ahello'` reported `{"mode":"i","pos":[0,1,9,0,9]}`, and `--remote-send '<Esc>d'` reported `"no"`.
  - `remote-send` and `nvim_input` both applied the `Y` → `y$` default mapping, although `remote.txt` says `--remote-send` keys "are not mapped".

  [neovim v0.11.7 runtime/doc/remote.txt](https://github.com/neovim/neovim/blob/v0.11.7/runtime/doc/remote.txt)

**Rationale and Examples:**

```text
scripts/record-vim.ts
  assert `nvim --version` starts "NVIM v0.11."
  per case: spawn nvim --clean --headless --listen $sock
            --remote-expr: setline + cursor + clear undo (undolevels trick) + clear registers
            --remote-send: keys
            --remote-expr: json_encode({lines: getline(1,'$'), pos: getcurpos(), mode: mode(1), regs: {...}})
  write test/vim/expected.json { nvim: "0.11.7", cases: [...] }
```

**Tradeoffs and Limitations:**

- Spawning `nvim --server` per query costs about 10–30 ms. That is acceptable for an offline recorder.
- The `--remote-send` mapping behaviour contradicts its doc line. Prefer `nvim_input` via `--remote-expr` for clarity.
- macOS Gatekeeper did not block the curl-downloaded tarball (no quarantine attribute). A browser download may be quarantined.

**Reconciliation Considerations:**

- REQ3 could name v0.11.7 as the recording version and state that the recorder uses RPC (`--listen`) so mode capture is exact.

## RF14: The ignore package fits nested .gitignore with caller-side rules

**Question:** Q11 — Is the `ignore` npm package current and spec-compliant for REQ9's nested `.gitignore`, negation, and directory patterns?

**Finding:** `ignore` 7.0.12 (published 2026-10-02, maintained since 2013, used by ESLint and Prettier) implements gitignore matching per git's spec at version 2.22.1. It covers negation, anchored `/x`, `**`, and the rule that a file cannot be re-included when its parent directory is excluded.

Three behaviours fall to the caller:

- Paths must be `path.relative()` strings; `/abs` and `./x` throw.
- Directories must be tested with a trailing `/` to match directory-only patterns (`build/`).
- Nested `.gitignore` files are not discovered. The caller builds one `ignore()` per `.gitignore` and tests paths relative to that file's directory, which matches REQ9's lazy explorer.

**Requirements Evaluated:**

- `W261003HEGE-REQ9@R1` — always-hidden dot entries and `node_modules`; `.gitignore` at the root and visited subfolders with git semantics (nested scope, negation); one exclusion module reused by DI2.

**Potential Requirement Impact:** Supports REQ9 as written. It adds design constraints: append `/` for directories, use relative paths per `.gitignore` scope, and evaluate scopes from the root down so a parent's exclusion stops descent. No alternative library is needed.

**Evidence:**

- README: "the .gitignore spec 2.22.1"; pathnames must be `path.relative()`d; `foo/` for directories; users include ESLint and Prettier; a file cannot be re-included if a parent directory is excluded; nested files are not discovered — [kaelzhang/node-ignore](https://github.com/kaelzhang/node-ignore)
- npm: latest 7.0.12, first published 2013-09-02 — [npm ignore](https://www.npmjs.com/package/ignore)
- gitignore pattern format: patterns in lower-level files are relative to that file's directory and override higher-level ones; trailing `/` matches directories only — [git-scm gitignore](https://git-scm.com/docs/gitignore)
- Empirical (`bun ig.ts`): with `build/\n*.log\n!keep.log\n/only-root.txt`, `build/` → true, `build` → false, `x/build/` → true, `keep.log` → false, `sub/keep.log` → false, `only-root.txt` → true, `sub/only-root.txt` → false. `ignores("/abs/path")` threw "path should be a `path.relative()`d string" — [kaelzhang/node-ignore](https://github.com/kaelzhang/node-ignore)

**Rationale and Examples:**

```text
explorer expands pkg/ → scopes = [root .gitignore, pkg/.gitignore]
isIgnored("pkg/dist", dir=true): root.ignores("pkg/dist/") || pkgScope.ignores("dist/")   (+ name starts "." or == node_modules)
```

**Tradeoffs and Limitations:**

- A negation in a deeper `.gitignore` overriding a parent scope's match needs the caller to apply git's "last match wins across levels" order. Two independent `ignores()` OR-ed together will not handle that. Use `ignore().test()`, which returns `{ignored, unignored}`, to combine scopes.
- `core.excludesFile` and `.git/info/exclude` are out of scope, consistent with "no Git".

**Reconciliation Considerations:**

- Design should specify cross-scope precedence with `test()`'s `unignored` and the trailing-slash convention, and add a REQ9 fixture case where a nested `!pattern` re-includes a file matched by the root `.gitignore`.

# 3. Sources

## External Sources

1. **npm registry package pages (bun, @opentui/core, typescript, @biomejs/biome, knip, zod, lowlight, ignore, @xterm/headless, @types/bun)** — npm, Inc.
   - URL: https://www.npmjs.com/package/@opentui/core (and the sibling package pages)
   - Published or updated: dist-tags as of 2026-10-03
   - Accessed: 2026-10-03
   - Supports: `RF1`, `RF10`, `RF14`
   - Authority: Canonical registry metadata (`npm view`)
2. **@opentui/core 0.5.14 published package (renderer.d.ts, Renderable.d.ts, buffer.d.ts, types.d.ts, lib/*.d.ts, testing/*.d.ts, chunk-bun-*.js)** — anomalyco/OpenTUI
   - URL: https://unpkg.com/@opentui/core@0.5.14/
   - Published or updated: 2026-09-30
   - Accessed: 2026-10-03
   - Supports: `RF2`, `RF3`, `RF4`, `RF5`, `RF7`, `RF12`
   - Authority: The exact pinned artifact, inspected directly
3. **OpenTUI repository and releases** — anomalyco
   - URL: https://github.com/anomalyco/opentui
   - Published or updated: v0.5.14, 2026-09-30
   - Accessed: 2026-10-03
   - Supports: `RF1`, `RF2`, `RF5`
   - Authority: Maintainer repository
4. **OpenTUI docs: Standalone executables** — OpenTUI
   - URL: https://opentui.com/docs/reference/standalone-executables/
   - Published or updated: Unknown
   - Accessed: 2026-10-03
   - Supports: `RF7`
   - Authority: Official documentation
5. **Bun releases; Bun v1.3.5 and v1.4.0 blogs** — Oven
   - URL: https://github.com/oven-sh/bun/releases ; https://bun.com/blog/bun-v1.3.5 ; https://bun.com/blog/bun-v1.4.0
   - Published or updated: 1.4.2 on 2026-09-05
   - Accessed: 2026-10-03
   - Supports: `RF1`, `RF6`
   - Authority: Vendor release notes
6. **oven-sh/bun PR #25415 (Bun.Terminal)** — Oven
   - URL: https://github.com/oven-sh/bun/pull/25415
   - Published or updated: Unknown (merged for 1.3.5)
   - Accessed: 2026-10-03
   - Supports: `RF6`
   - Authority: Upstream source change
7. **bun-types 1.4.2 (bun.d.ts) and Bun.spawn reference** — Oven
   - URL: https://unpkg.com/bun-types@1.4.2/bun.d.ts ; https://bun.sh/reference/bun/spawn
   - Published or updated: 2026-09-08
   - Accessed: 2026-10-03
   - Supports: `RF3`, `RF6`
   - Authority: Official type definitions and reference
8. **Bun docs: single-file executables; bun install** — Oven
   - URL: https://bun.com/docs/bundler/executables ; https://bun.com/docs/pm/cli/install
   - Published or updated: Unknown
   - Accessed: 2026-10-03
   - Supports: `RF7`
   - Authority: Official documentation
9. **oven-sh/bun fs.watch issues and PRs (#43065, #43066, #44246, PR #43083, PR #44007) and Bun fs.watch guide** — Oven
   - URL: https://github.com/oven-sh/bun/issues/44246 (and siblings) ; https://bun.sh/guides/read-file/watch
   - Published or updated: 2026 (open issues at access time)
   - Accessed: 2026-10-03
   - Supports: `RF8`
   - Authority: Upstream issue tracker
10. **talkasab/peruse issue #37 (Bun fs.watch adoption notes)** — talkasab
    - URL: https://github.com/talkasab/peruse/issues/37
    - Published or updated: 2026
    - Accessed: 2026-10-03
    - Supports: `RF8`
    - Authority: Secondary; quotes Bun 1.3.14 release notes; used only for version history
11. **ranxianglei/opencode-stable PR #1 (libopentui extraction leak)** — ranxianglei
    - URL: https://github.com/ranxianglei/opencode-stable/pull/1
    - Published or updated: Unknown
    - Accessed: 2026-10-03
    - Supports: `RF7`
    - Authority: Secondary downstream report; contradicted for Bun 1.4.2 by the empirical reuse result
12. **Apple Developer Forums threads 667213, 709877, 703664; FileManager.trashItem docs** — Apple
    - URL: https://developer.apple.com/forums/thread/667213 ; https://developer.apple.com/forums/thread/709877 ; https://developer.apple.com/forums/thread/703664 ; https://developer.apple.com/documentation/foundation/filemanager/trashitem(at:resultingitemurl:)
    - Published or updated: Various
    - Accessed: 2026-10-03
    - Supports: `RF7`, `RF11`
    - Authority: Vendor documentation and developer forums
13. **TypeScript 7.0 announcement; InfoQ coverage** — Microsoft; InfoQ
    - URL: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ ; https://www.infoq.com/news/2026/08/typescript-7-released/
    - Published or updated: 2026-08
    - Accessed: 2026-10-03
    - Supports: `RF1`
    - Authority: Vendor announcement plus industry press
14. **typescript 7.0.2 and knip 6.39.0 published packages** — Microsoft; knip maintainers
    - URL: https://unpkg.com/typescript@7.0.2/package.json ; https://unpkg.com/knip@6.39.0/package.json
    - Published or updated: 2026-10-02; 2026-09-30
    - Accessed: 2026-10-03
    - Supports: `RF1`
    - Authority: The exact pinned artifacts
15. **oven-sh/setup-bun (action.yml, src/index.ts, src/utils.ts)** — Oven
    - URL: https://github.com/oven-sh/setup-bun
    - Published or updated: v2.2.0, 2026-03-14
    - Accessed: 2026-10-03
    - Supports: `RF1`
    - Authority: Official action source
16. **googleapis/release-please-action (README, action.yml, v5.0.0 release)** — Google
    - URL: https://github.com/googleapis/release-please-action
    - Published or updated: v5.0.0, 2026-04-22
    - Accessed: 2026-10-03
    - Supports: `RF9`
    - Authority: Official action source
17. **release-please config schema and manifest-releaser docs** — Google
    - URL: https://github.com/googleapis/release-please/blob/main/schemas/config.json ; https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md
    - Published or updated: main branch at access
    - Accessed: 2026-10-03
    - Supports: `RF9`
    - Authority: Official schema
18. **GitHub Docs: GITHUB_TOKEN** — GitHub
    - URL: https://docs.github.com/en/actions/concepts/security/github_token
    - Published or updated: Unknown
    - Accessed: 2026-10-03
    - Supports: `RF9`
    - Authority: Official documentation
19. **lowlight 3.3.0 package and README; highlight.js source** — wooorm; highlight.js team
    - URL: https://unpkg.com/lowlight@3.3.0/ ; https://github.com/wooorm/lowlight ; https://github.com/highlightjs/highlight.js
    - Published or updated: lowlight 3.3.0, 2024-12-14; highlight.js 11.11.2
    - Accessed: 2026-10-03
    - Supports: `RF10`
    - Authority: Maintainer packages and source
20. **sindresorhus/macos-trash README** — Sindre Sorhus
    - URL: https://github.com/sindresorhus/macos-trash
    - Published or updated: Unknown
    - Accessed: 2026-10-03
    - Supports: `RF11`
    - Authority: Well-known maintainer; secondary for the built-in `trash`
21. **freedesktop.org Trash Specification 1.0** — freedesktop.org (Ramendik, Faure, Larsson, Lortie)
    - URL: https://specifications.freedesktop.org/trash/1.0/
    - Published or updated: 2014-01-02
    - Accessed: 2026-10-03
    - Supports: `RF11`
    - Authority: The binding standard named by REQ8
22. **Neovim v0.11.7 runtime docs and clipboard provider (provider.txt, clipboard.vim, vimfn.txt, starting.txt, remote.txt) and releases** — Neovim
    - URL: https://github.com/neovim/neovim/tree/v0.11.7/runtime ; https://github.com/neovim/neovim/releases/tag/v0.11.7
    - Published or updated: 2026-03-28
    - Accessed: 2026-10-03
    - Supports: `RF12`, `RF13`
    - Authority: Primary source at the exact recording version (also read from the downloaded tarball)
23. **kitty options definition and kitty.conf docs; kitty keyboard protocol** — Kovid Goyal
    - URL: https://github.com/kovidgoyal/kitty/blob/master/kitty/options/definition.py ; https://sw.kovidgoyal.net/kitty/conf/ ; https://sw.kovidgoyal.net/kitty/keyboard-protocol/
    - Published or updated: master at access
    - Accessed: 2026-10-03
    - Supports: `RF4`, `RF12`
    - Authority: Terminal vendor source
24. **Ghostty config reference** — Ghostty
    - URL: https://ghostty.org/docs/config/reference
    - Published or updated: Unknown
    - Accessed: 2026-10-03
    - Supports: `RF12`
    - Authority: Vendor documentation
25. **WezTerm escape sequences** — WezTerm
    - URL: https://wezterm.org/escape-sequences.html
    - Published or updated: Unknown
    - Accessed: 2026-10-03
    - Supports: `RF12`
    - Authority: Vendor documentation
26. **iTerm2 General preferences** — iTerm2
    - URL: https://iterm2.com/documentation-preferences-general.html
    - Published or updated: Unknown
    - Accessed: 2026-10-03
    - Supports: `RF12`
    - Authority: Vendor documentation
27. **tmux wiki: Clipboard** — tmux
    - URL: https://github.com/tmux/tmux/wiki/Clipboard
    - Published or updated: Unknown
    - Accessed: 2026-10-03
    - Supports: `RF12`
    - Authority: Maintainer wiki
28. **can-i-use-terminal: OSC 52 copy; hermes-agent issue #15664** — community
    - URL: https://can-i-use-terminal.github.io/features/osc52copy.html ; https://github.com/NousResearch/hermes-agent/issues/15664
    - Published or updated: Unknown
    - Accessed: 2026-10-03
    - Supports: `RF12`
    - Authority: Secondary; used only for Terminal.app and VTE status
29. **xterm.js headless typings; @xterm/headless 6.0.0** — xterm.js
    - URL: https://github.com/xtermjs/xterm.js/blob/master/typings/xterm-headless.d.ts ; https://www.npmjs.com/package/@xterm/headless
    - Published or updated: 6.0.0, 2026-08-30
    - Accessed: 2026-10-03
    - Supports: `RF6`
    - Authority: Maintainer typings
30. **kaelzhang/node-ignore README; git-scm gitignore** — Kael Zhang; Git project
    - URL: https://github.com/kaelzhang/node-ignore ; https://git-scm.com/docs/gitignore
    - Published or updated: ignore 7.0.12, 2026-10-02
    - Accessed: 2026-10-03
    - Supports: `RF14`
    - Authority: Maintainer docs and the git specification

## Project Evidence

- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:189-219` — Supports `RF1`, `RF7` by establishing REQ2's pins, frozen lockfile, and `packageManager` single source
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:221-252` — Supports `RF13` by establishing REQ3's recorder, 0.11.x guard, and offline fixture
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:254-291` — Supports `RF2`, `RF3`, `RF4`, `RF5`, `RF6`, `RF8` by establishing REQ4's test layers, built-in PTY, raw-stream assertions, and V17 criteria
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:293-339` — Supports `RF3` by establishing REQ5's signal and exception flush, restore, and exit codes, with `Ctrl-C` as a key
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:341-372` — Supports `RF8` by establishing REQ6's deleted-on-disk handling
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:374-407` — Supports `RF12` by establishing REQ7's provider order (xclip, then xsel) and OSC 52 copy-only
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:409-440` — Supports `RF11` by establishing REQ8's Linux, macOS, and fallback mechanics
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:442-475` — Supports `RF8`, `RF14` by establishing REQ9's nested `.gitignore` and symlink rules
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:477-514` — Supports `RF8`, `RF11` by establishing REQ10's rename, move, and delete behaviour
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md:516-548` — Supports `RF10` by establishing REQ11's `common` set and static mapping
- `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-discuss-context.md:20` — Supports `RF1`, `RF13` by establishing local Bun 1.3.10 and Neovim 0.12.4
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-1-daily-usable-editor.md:416-423` — Supports `RF2`, `RF8` by establishing the DI1 confirmation duty and the material-mismatch return rule
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-1-daily-usable-editor.md:626-635` — Supports `RF2`, `RF8`, `RF10`, `RF11` by listing the four confirmations (fs.watch, OpenTUI APIs, Finder trash, lowlight set)
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md:778-794` — Supports `RF2`, `RF4` by establishing the illustrative `EditorView`, `normalizeKey`, and `requestRender` shapes
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md:425` — Supports `RF4` by establishing the `escTimeoutMs` (50) default
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md:890-896` — Supports `RF4` by establishing V3's 50 ms ± 10 ms Esc expectation via `normalizeKey`
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md:1088-1097` — Supports `RF3`, `RF6` by establishing V17's PTY restore scenario and `NO_COLOR` assertion
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md:1257-1266` — Supports `RF7`, `RF9` by establishing DES15's cross-compile, `OPENTUI_LIBC`, smoke matrix, and release-please decisions
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md:745-756` — Supports `RF8` by establishing the watcher shape (debounce 50 ms, own-write stamps)
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md:674-680` — Supports `RF10` by establishing `lowlightHighlighter` with 200-line look-back

# 4. Confidence and Open Questions

**Confidence:** High — Most conclusions rest on direct inspection of the exact pinned packages and on experiments with Bun 1.4.2 on macOS and Linux (Docker), cross-checked against vendor docs. Confidence is Medium for three items: darwin-x64 runtime behaviour (only Rosetta on macOS 14.4 was available), `/usr/bin/trash` behaviour (macOS 15 was unavailable), and the OSC 52 terminal matrix (part community-sourced).

**Open Questions:**

- Does the OpenTUI darwin-x64 binary run on a real Intel Mac, and is a GitHub Intel macOS runner available to smoke it (RF7)?
- Can `prependInputHandler` see a lone `\x1b` before OpenTUI's 20 ms flush, which would let `so` honour a 50 ms `escTimeoutMs` (RF4)?
- What are `/usr/bin/trash`'s exit codes and failure output on macOS 15 and later (RF11)?
- Do hosted GitHub `macos` and `ubuntu` runners reproduce the local `fs.watch` and `Bun.Terminal` results (RF6, RF8)? REQ4's CI run answers this.
- Does `buffer.clear(defaultBackground)` avoid truecolour foreground output under `NO_COLOR`, as `drawText` does (RF2)?

**Immutability Note:** This artifact records evidence against the stated baseline commit and exact evaluated revisions. Later requirements may cite these findings as informing a new revision, but this artifact must not be changed to claim that it evaluated that later revision.
