# so

- **Last Modified:** 2026-10-04

Use this as the reusable baseline for discussion and plan inspection. Keep change-specific details in work documents. Cite important claims, distinguish rules from observations, and link authoritative sources instead of duplicating them.

## Purpose and Scope

`so` is a terminal editor for a folder of Markdown notes, run as `so [path]`. It is one Bun process with a pure TypeScript core: a language-neutral editor kernel (text, vim, commands, view) plus registered file types, driven by one-way state flow, thin I/O adapters, and an OpenTUI shell that draws only visible lines. A worker thread scans the workspace into a link index (NoteIndex), so links, backlinks, link-safe renames, pickers, and search work without blocking typing. Markdown notes open in an Obsidian-style `live` view by default (rendered blocks, with source shown on the cursor's lines), with `source` and read-only `reading` views; images, note embeds, math, and Mermaid draw in the terminal. `:Preview` mirrors the active note in a read-only browser page served on `127.0.0.1`. Daily notes (`:Today`, `:Yesterday`, `:Tomorrow`, a calendar picker) and templates are created from Obsidian-compatible templates and never overwrite a file; Obsidian `.base` files open as read-only table and Kanban views whose cell edits and card moves write one frontmatter key back to the note, and `![[x.base#View]]` embeds render inline. Sources: `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-design.md` (initiative design), `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-system-design.md` (editor foundation), `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md` (navigation and links), `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md` (live and browser preview), `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-system-design.md` (daily notes, templates, and Bases).

## Technology Stack

Versions are exact pins from `package.json`; `bunfig.toml` sets `[install] exact = true`, and `bun.lock` is committed and installed with `--frozen-lockfile`.

| Technology | Role | Version or configuration source |
|---|---|---|
| Bun | Runtime, package manager, test runner, bundler (`--compile`) | `1.4.2` — `package.json` `packageManager: "bun@1.4.2"` (the only Bun version source; CI's `oven-sh/setup-bun` reads it) |
| TypeScript | Primary language and type checker | `typescript` `7.0.2` — `tsconfig.json` |
| `@opentui/core` | Terminal renderer (only `src/ui` imports it) | `0.5.14` |
| `lowlight` | Syntax highlighting (`src/core/lang/code`) | `3.3.0` |
| `zod` | Config schema (`src/core/config`) | `4.6.5` |
| `toml-eslint-parser` | `config.toml` parsing with line numbers (`src/core/config`) | `1.0.3` |
| `mdast-util-from-markdown` | Markdown syntax tree, built on demand (`src/core/lang/markdown`) | `2.0.3` |
| `micromark-extension-gfm`, `mdast-util-gfm` | GFM syntax for the tree (`src/core/lang/markdown`) | `3.0.0`, `3.1.0` |
| `micromark-extension-math`, `mdast-util-math` | Math syntax for the tree (`src/core/lang/markdown`) | `3.1.0`, `3.0.0` |
| `yaml` | Frontmatter (`src/core/lang/markdown`) and `.base` files (`src/core/features/bases`) | `2.9.1` |
| `beautiful-mermaid` | Mermaid diagrams as terminal text, loaded on the first diagram (`src/core/lang/markdown`) | `1.1.3` |
| `katex`, `mermaid` | Math and diagrams in the browser preview, embedded into the binary (`src/preview`) | `0.16.47`, `12.1.0` |
| `ignore` | `.gitignore`-style exclusion (`src/workspace`) | `7.0.12` |
| `@types/bun` | Bun type definitions | `1.4.2` (dev) |
| `@biomejs/biome` | Formatter and linter | `2.5.15` (dev) — `biome.json` |
| `knip` | Unused files, exports, and dependencies | `6.39.0` (dev) — `knip.json` |
| `@xterm/headless` | Terminal emulator for PTY end-to-end tests | `6.0.0` (dev) |

## Repository and Component Map

Default branch: `main`. One package, no monorepo.

| Path | Role |
|---|---|
| `bin/so` | Executable entry: `#!/usr/bin/env bun` → `src/app/main.ts` |
| `src/app` | Composition root: wiring, effect runner, index host, process lifecycle |
| `src/ui` | OpenTUI shell, input normalization, views, overlays, widget painters (`widgets/`), terminal image tiers and cache (`images.ts`) |
| `src/workspace` | File-system, watcher, trash, clipboard, config-file, state-file, log, and image-loading (`images.ts`) adapters; the index worker (`index-worker.ts`) |
| `src/preview` | Browser preview server (`server.ts`) and the page, KaTeX, and Mermaid files embedded into the binary (`assets.ts`) |
| `src/core` | Pure product logic: `kernel`, `filetypes`, `lang`, `features` (`links`, `notes`, `bases`), `time` (local calendar fields and a Moment-compatible formatter), `state`, `config` |
| `scripts` | Developer tools (`record-vim.ts`, `bench-gate.ts`) |
| `test` | Policy, boundary, vim, component, integration, e2e, and benchmark suites |
| `.github/workflows` | `ci.yml`, `release.yml` |

## Architecture and Key Flows

```text
key → src/ui (normalize) → store.dispatch(action) → core update(state, action) → { state, effects }
                                                                                    │
                     src/ui repaints visible lines ◄── state        effects ──► src/app effect runner
                                                                                    │
                                              result actions ◄── src/workspace (fs, trash, clipboard)
```

`update` is pure and synchronous; adapters only execute effects and report results as actions. Saves are atomic (private `0600` temp file, fsync, rename) and keep mode, BOM, line endings, and the trailing newline; the watcher ignores the app's own operations.

Startup reads `config.toml` and the state file synchronously, paints the first frame, and only then starts the watcher and the index worker (`setImmediate` in `src/app/main.ts`), so the first frame does not depend on the workspace size:

```text
src/workspace/index-worker.ts ──batch{summaries, done, total}*──► src/app/index-host.ts ──indexBatch──► store
          ▲ scan / changed / removed / search                       one crash restarts; a second → "index unavailable"
          └──────────── watcher events and the app's own saves ──────┘
```

The worker reads notes and never writes; only the runner's serial queue writes files. The index lives in memory and is rebuilt at every start.

Live preview is a decoration provider over the kernel's `layoutText`: the Markdown view's `input` hook builds `MarkdownViewInput` (the `Doc`, the view, and a `PreviewCtx` from `src/core/state/view-context.ts`), and `livePreview` renders only blocks in the viewport through the `registerBlockRenderer` registry. Embed targets load as unlisted buffers (never shown, listed, or persisted); decoded images live only in the UI's 64 MiB cache.

```text
:Preview → preview = starting → startPreview effect → src/app/preview-host.ts → src/preview/server.ts (127.0.0.1:<port>)
   → previewStarted → openUrl     edit or switch → SSE "doc" → page GET /render → swap and scroll
:PreviewStop | exit → SSE "stopped" → server stops → preview = off
```

The server answers GET only, rejects a foreign `Host`, serves workspace files under `/file/*` with containment and a sandboxing policy, and the page loads nothing outside its own origin.

Notes are created only through the `createNote` effect, whose adapter expands the template and calls `createExclusive` (temp file + `link()`, `wx` fallback), so an existing path is never replaced:

```text
:Today | calendar Enter | <leader>nn → note-commands → (index hit) openPath{after} | createNote effect
   → runner (serial): read template → expandTemplate → createExclusive → noteCreated → open, cursor on first unchecked task
```

`.base` files are file type and editor kind `base` by registration only (`src/core/features/bases/file-type.ts`): the buffer is `readOnly` (the save gate refuses it), keys never reach vim, and `EditorKindSpec.open` creates the window's `kindState`. `baseViewModel` (`src/core/state/base-model.ts`) derives the table or board from the index's candidates and memoizes it. A cell edit or card move writes one frontmatter key:

```text
open note   → applyBufferEdits (one undo step)
closed note → patchFrontmatter effect (serial queue) → read → refuse if stale → patch → atomic write → frontmatterPatched
```

`![[x.base#View]]` loads the base as an unlisted embed buffer because its file type has an embed model (`EmbedModelRegistry`), and the `base` block renderer reads `PreviewCtx.embedModel`. Kanban stays behind `KANBAN_TYPE` (`src/core/features/bases/types.ts`), which is `undefined` until an Obsidian-saved Kanban `.base` fixture confirms the layout's `type`; until then, `kanban` views fall back to a table with a notice.

## Boundaries and Dependencies

Import rules, enforced by `test/boundaries.test.ts` (`LAYER_RULES`):

```text
app → ui, workspace, preview, core        ui → core        workspace → core        preview → preview, core
core → core only; no I/O, runtime (node:*, bun), or @opentui imports
core/kernel → kernel only, no packages    core/filetypes → kernel
core/lang, core/features → kernel, filetypes, lang, features, time
core/state, core/config → any core module; nothing else in core imports them
only src/ui imports @opentui/*
```

Package homes, enforced by the same test (`PACKAGE_HOMES`, keyed by package name): the five Markdown tree packages and `beautiful-mermaid` are imported only from `src/core/lang/markdown/`; `yaml` only from `src/core/lang/markdown/` and `src/core/features/bases/`; `katex` and `mermaid` only from `src/preview/`; and `toml-eslint-parser` only from `src/core/config/`.

## Data and Contracts

- **Data Ownership and Storage:** Notes are plain files in the user's workspace folder, read and written as-is. No database.

| Contract | Source of truth |
|---|---|
| App state, actions, effects (one-way protocol) | `src/core/state/types.ts` — `AppState`, `Action`, `Effect`, `FsOp`; `createUpdate` in `src/core/state/update.ts`, `createStore` in `src/core/state/store.ts` |
| Editor kernel | `src/core/kernel/{text,editor,vim,commands,view}` — text buffer, vim engine (`handleKey`), `CommandRegistry`, `Keymap`, `layoutText` and decorations |
| File types and highlighting | `src/core/filetypes/registry.ts` (`FileTypeRegistry`), `src/core/lang/code` (language table, `lowlightHighlighter`), `src/core/lang/markdown/file-type.ts` |
| Effect execution | `src/app/effects.ts` — one serial file-system queue; writes queued behind a rename, move, or trash of their path follow it; `createNote` and `patchFrontmatter` run on it; `createExclusive` in `src/workspace/fs.ts` never replaces an entry |
| Markdown model | `src/core/lang/markdown/{blocks,scan,doc,mdast}.ts` — block split and fast scan (links, tags, headings, block ids, frontmatter) with a per-block cache; the mdast tree only on demand |
| Live preview (extension points used by later work) | `src/core/lang/markdown/live-preview.ts` — `PreviewCtx`, `MarkdownViewInput`, `livePreview`, `BlockRenderer`, `registerBlockRenderer`; `src/ui/widgets/registry.ts` — `registerWidgetPainter` (painters by widget type); `src/core/state/view-context.ts` — `ViewContextRegistry` (view-context builders by file type) |
| Editor kinds | `src/core/filetypes/registry.ts` (`EditorKindRegistry`, `EditorKindSpec.open`, `FileType.readOnly`); `WindowState.content.editor` follows the file type's registered kind, else `"text"`, and `kindState` holds the kind's window state; `src/ui/editors/registry.ts` (`registerEditorView`, `WindowView`) — `text` (`EditorView`) and `base` (`BaseView`) |
| Browser preview | `src/preview/server.ts` (routes `/`, `/assets/*`, `/render`, `/file/*`, SSE `/events`); `PreviewState` in `src/core/state/types.ts`; `renderHtml` in `src/core/lang/markdown/html.ts` (escaped HTML) |
| Link index | `src/core/features/links/{note-index,resolve,rename,mentions}.ts` — `NoteIndex`, `resolveLink`, `planRename`; worker messages `ToWorker`/`FromWorker` in `src/workspace/index-worker.ts` |
| Config file | `src/core/config/{schema,toml}.ts` — `ConfigSchema` (strict: unknown keys are errors; `[preview]` sets `mode` `live`/`source`/`reading`, `embedMaxRows`, `images` `auto`/`blocks`/`off`; `[daily]` sets `folder` (default `daily`), `format` (Moment tokens, default `YYYY-MM-DD`), `template` (default `templates/daily.md`); `[templates]` sets `folder` (default `templates`)), `parseConfig` |
| Daily notes and templates | `src/core/time/{local,format}.ts` (`localDateTime`, `addDays`, `formatDate` — Moment 2.29.4 output); `src/core/features/notes/{daily,template}.ts` (`dailyPath`, `parseDailyDate`, `expandTemplate` — Obsidian's `{{date}}`/`{{time}}`/`{{title}}` rules); `src/core/state/{note-commands,calendar}.ts` |
| Frontmatter patch | `src/core/lang/markdown/frontmatter-patch.ts` — `patchFrontmatter` changes one key and keeps comments, order, quoting, line endings, and the body; `mergeFrontmatter` (template insert); `yamlScalar` |
| Bases | `src/core/features/bases/*` — `parseBase`, `evaluateBase` (Obsidian `inFolder`/`hasTag`, `filter_hides_rows` diagnostics), `summarize` (15 default summaries), `propertyType` (`.obsidian/types.json`, else inference), `candidatesFrom` (every `file.*` field from index facts), `tableModel`, `kanbanModel`, `BaseLayoutRegistry`, `KANBAN_TYPE`; `src/core/state/base-{model,commands,write}.ts`; painters in `src/ui/widgets/base.ts` |
| Embed models | `src/core/state/embed-models.ts` (`EmbedModelRegistry` by file type; `PreviewCtx.embedModel`); `base` registers `baseEmbedModel` |
| Session state | `PersistedState` in `src/core/state/types.ts` (`"version": 1`); `snapshotSession`/`parsePersisted` in `src/core/state/session.ts` |
| Vim behaviour | `test/vim/expected.json`, recorded from Neovim 0.11.x over RPC by `bun run record:vim` |

## Engineering Standards and Patterns

Keep it lean and simple. Code carries no work-process identifiers (`.s1mple/S1MPLE.md` Implementation).

- **Language Rules:** [TypeScript](languages/typescript.md)
- **Pins:** every npm version is exact; GitHub Actions are pinned to a 40-character commit SHA with a `# <tag>` comment. `test/repo.test.ts` enforces both.

## Constraints

- No version range (`^`, `~`) in `package.json`; upgrades are deliberate PRs.
- No tool may depend on the TypeScript compiler API (TypeScript 7 ships none).
- `src/core` stays free of I/O, runtime, and UI imports.

## Development and Verification

- **Local Setup:** install Bun `1.4.2`, then `bun install --frozen-lockfile`. Run with `bun run dev` (no build step), or `bun run sandbox` for a demo vault with isolated config and state. `NO_COLOR` disables colour. `so --version` prints `package.json` `version`, or `SO_VERSION` when set at build time (release builds). PTY tests set `SO_TEST=1`, which alone enables the test-only hooks `SO_TEST_SLOW_WRITE` and `SO_TEST_THROW` in `src/app/main.ts`.
- **Files outside the workspace** (`src/workspace/config-file.ts`, `state-file.ts`, `log.ts`). An XDG variable counts only when it is an absolute path.

  | File | Path | Behaviour |
  |---|---|---|
  | Config | `$XDG_CONFIG_HOME/so/config.toml`, else `~/.config/so/config.toml` | Optional. Every error names its line; one toast shows the first: `config.toml:<line>: <message> (+N more)`. At startup an invalid file applies the defaults; `:ConfigReload` keeps the current config |
  | Session state | `$XDG_STATE_HOME/so/<first 16 hex of sha256(real workspace path)>/state.json`, else under `~/.local/state/so/` | Mode `0600`, folder `0700`, written atomically. If both locations are inside the workspace there is no state file. Corrupt or unknown-version files load empty |
  | Debug log | `$XDG_STATE_HOME/so/so.log`, else `~/.local/state/so/so.log` | Only with `SO_LOG=debug`: JSON lines, mode `0600`, never note text. Without it no file is created |
- **Scripts:**

  | Script | Command | Purpose |
  |---|---|---|
  | `dev` | `bun src/app/main.ts` | Run from source |
  | `check` | `biome check . && bun --bun run tsc --noEmit -p . && bun --bun run knip && bun test src test/boundaries.test.ts test/repo.test.ts test/vim` | Fast local gate: format, lint, types, unused code, unit suites (< 30 s) |
  | `test:ci` | `bun test test/ui test/integration test/e2e` | Component, integration, and PTY e2e suites |
  | `bench` | `bun scripts/bench-gate.ts` | Benchmark gate (median of 5 runs, 2× target) |
  | `build` | `bun build --compile src/app/main.ts src/workspace/index-worker.ts --outfile dist/so` | Single binary; the worker is a second compile entrypoint; the preview page, KaTeX (with fonts), and Mermaid are embedded, so the binary needs no `node_modules` |
  | `record:vim` | `bun scripts/record-vim.ts` | Record vim expectations from Neovim 0.11.x (local only) |
  | `sandbox` | `bun scripts/sandbox.ts` | Launch so on a demo vault staged from fixtures, with config and state isolated under `.sandbox/` (`--reset` restages; other args go to so) |

- **Test Layers:**

  | Layer | Location | Runs in |
  |---|---|---|
  | Unit | colocated `src/**/*.test.ts`, `test/vim`, `test/boundaries.test.ts`, `test/repo.test.ts` | `check` |
  | Component | `test/ui` | `test:ci` |
  | Integration | `test/integration` | `test:ci` |
  | End-to-end (PTY) | `test/e2e` | `test:ci` |
  | Benchmark | `test/bench` | `bench` (Linux CI only) |

- **Worker entrypoint:** every `bun build --compile` (the `build` script and both loops in `release.yml`) lists `src/workspace/index-worker.ts` after `src/app/main.ts`, which `test/repo.test.ts` enforces; `knip.json` lists the worker as an entry.
- **Benchmarks:** `TARGETS` in `scripts/bench-gate.ts`, in milliseconds. The gate fails when a median exceeds twice its target and writes the runs to `.so-bench/results.json`. `makeNoteWorkspace`, `make5000LineNote`, and `make5000LineTs` in `test/fixtures/generate.ts` generate the fixtures. The live and startup targets are relaxed from the initiative's REQ9 values (16 ms keystroke, 50 ms open, 200 ms first frame) by user decision on 2026-10-04; source targets keep them.

  | Metric | Target | Bench |
  |---|---|---|
  | `sourceKeystrokeP95` | 16 | `source-keystroke.bench.ts` — 200 keys in a 5,000-line TypeScript file |
  | `liveKeystrokeP95` | 24 | `live-keystroke.bench.ts` — the same key mix in a 5,000-line note in `live` view |
  | `openFile` | 80 | `open-file.bench.ts` — a 5,000-line note (`live` view) to its first frame |
  | `sourceOpenFile` | 50 | `source-open.bench.ts` — a 5,000-line TypeScript file to its first frame |
  | `liveScrollFrameP95` | 16.7 | `scroll.bench.ts --file note` — held `j` and `Ctrl-d`/`Ctrl-u` frames in a note |
  | `sourceScrollFrameP95` | 16.7 | `scroll.bench.ts --file ts` — the same in a TypeScript file |
  | `firstFrame` | 250 | `startup.bench.ts --metric firstFrame` — spawn to the first statusline, 10,000 notes, in a PTY |
  | `indexReady` | 3000 | `startup.bench.ts --metric indexReady` — spawn to `◆ index ready` |
  | `indexingKeystrokeP95` | 30 | `indexing-keystroke.bench.ts` — 200 keys, including a `[[` link that opens completion, while the real worker scans 10,000 notes |

- **CI Checks:** `.github/workflows/ci.yml` runs on `pull_request` to `main` only (no `push` trigger), with per-PR concurrency and `cancel-in-progress`. Job `check` (`ubuntu-24.04`) runs `bun run check`; job `test` (matrix `ubuntu-24.04`, `macos-15`) runs `bun run test:ci`, plus `bun run bench` on Linux.
- **Release:** Nothing is released automatically; a release happens only when the user asks. A pushed `v*` tag runs `release.yml`, which builds four binaries on one runner, smoke-tests each on its native runner (`macos-15`, `macos-15-intel`, `ubuntu-24.04`, `ubuntu-24.04-arm`), and publishes a GitHub Release with generated notes only after every smoke job passes. Tags containing `-` publish as prereleases. A manual run (`gh workflow run release.yml`) is a dry run: the same build and smoke tests with version `0.0.0-dev+<short sha>`, publish skipped. Phase exits use the dry run.

## Sources and Open Questions

- **Sources:** `package.json`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `.github/workflows/*`, `test/repo.test.ts`, `test/boundaries.test.ts`, `src/core/state/types.ts`, `src/app/{main,effects,index-host}.ts`, `src/workspace/{config-file,state-file,log,index-worker,images}.ts`, `src/core/config/schema.ts`, `src/core/lang/markdown/live-preview.ts`, `src/preview/{server,assets}.ts`, `src/app/preview-host.ts`, `scripts/bench-gate.ts`; initiative design `rm261003abzp-design.md`.
- **Open Questions:** None.
