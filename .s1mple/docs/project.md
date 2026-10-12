# so

- **Last Modified:** 2026-10-12

Use this as the reusable baseline for discussion and plan inspection. Keep change-specific details in work documents. Cite important claims, distinguish rules from observations, and link authoritative sources instead of duplicating them.

## Purpose and Scope

`so` is a terminal editor for a folder of Markdown notes, run as `so [path]`. It is one Bun process with a pure TypeScript core: a language-neutral editor kernel (text, vim, commands, view) plus registered file types, driven by one-way state flow, thin I/O adapters, and an OpenTUI shell that draws only visible lines. A worker thread scans the workspace into a link index (NoteIndex), so links, backlinks, link-safe renames, pickers, and search work without blocking typing. Markdown notes open in a read-only `reading` view by default, and `<leader>m` cycles to an Obsidian-style `live` view (rendered blocks, with source shown on the cursor's lines) and a `source` view; a note opened to write in (a new note or a daily note) opens in `live`; images, note embeds, math, and Mermaid draw in the terminal. `:Preview` mirrors the active note in a read-only browser page served on `127.0.0.1`. Daily notes (`:Today`, `:Yesterday`, `:Tomorrow`, a calendar picker) and templates are created from Obsidian-compatible templates and never overwrite a file; Obsidian `.base` files open as read-only table and Kanban views whose cell edits and card moves write one frontmatter key back to the note, and `![[x.base#View]]` embeds render inline. The mouse (wheel, click, double- and triple-click, drag, Ctrl+click) works on every TUI surface and always runs the same path as a keyboard action, and a pointer resting on a word in a code file hovers it like `K`; the `mouse` setting turns terminal mouse reporting off. Inside a Git repository (Git ≥ 2.31), a change column beside the line numbers marks lines that differ from the index, the statusline shows the branch, operation, and change counts, the explorer marks changed files, hunks can be previewed, staged, reset, and jumped between, the cursor line can be blamed, and `<leader>gg` hands the terminal to a configured tool (default lazygit); outside a repository, or without a usable Git, every surface is the same as without the feature. Code files get language-server features unless `[lsp] enabled = false` turns them off (default on); a request no server answers says why (off, none configured for the file type, or each server's binary or crash state): diagnostics as gutter signs, underlines, and the message after the line, inlay hints drawn between characters, highlighted uses of the symbol under the cursor, hover and signature floats, go-to (definition, declaration, type definition, implementation), reference and workspace-symbol pickers, rename and code actions through one workspace-edit path, formatting (optionally on save), and code completion; one process runs per server and project root, servers are found on `PATH` (the TypeScript and JSON servers first in the root's `node_modules/.bin`), and every server stops when `so` exits. Opening a code file directly (`so src/main.rs`) makes its nearest `.git` folder the workspace when a server serves its file type, so the server sees the whole project. Sources: `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md` (initiative design), `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-system-design.md` (editor foundation), `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md` (navigation and links), `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md` (live and browser preview), `.s1mple/work/done/w26100423lx-daily-notes-templates-and-bases/w26100423lx-system-design.md` (daily notes, templates, and Bases), `.s1mple/work/done/w261005h4xz-tui-mouse-support/w261005h4xz-system-design.md` (mouse support), `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-system-design.md` (LSP code intelligence), `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-system-design.md` (git integration), `.s1mple/work/done/w261006e33m-statusline-at-bottom/w261006e33m-plan.md` (statusline on the last row).

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
| `vscode-jsonrpc`, `vscode-languageserver-protocol` | Language-server transport and protocol types (`src/workspace/lsp` only) | `9.0.3`, `3.18.4` |
| `@types/bun` | Bun type definitions | `1.4.2` (dev) |
| `@biomejs/biome` | Formatter and linter | `2.5.15` (dev) — `biome.json` |
| `knip` | Unused files, exports, and dependencies | `6.39.0` (dev) — `knip.json` |
| `@xterm/headless` | Terminal emulator for PTY end-to-end tests | `6.0.0` (dev) |

## Repository and Component Map

Default branch: `master`. One package, no monorepo.

| Path | Role |
|---|---|
| `bin/so` | Executable entry: `#!/usr/bin/env bun` → `src/app/main.ts` |
| `src/app` | Composition root: wiring, workspace resolution (`workspace.ts`), effect runner, index host, language-server host (`lsp-host.ts`), process lifecycle |
| `src/ui` | OpenTUI shell, input normalization, views, overlays, widget painters (`widgets/`), terminal image tiers and cache (`images.ts`) |
| `src/workspace` | File-system, watcher, trash, clipboard (text and files), config-file, state-file, log, and image-loading (`images.ts`) adapters; the index worker (`index-worker.ts`); the language-server client (`lsp/`) |
| `src/preview` | Browser preview server (`server.ts`) and the page, KaTeX, and Mermaid files embedded into the binary (`assets.ts`) |
| `src/core` | Pure product logic: `kernel`, `filetypes`, `lang`, `features` (`links`, `notes`, `bases`, `git`), `time` (local calendar fields and a Moment-compatible formatter), `state`, `config` |
| `scripts` | Developer tools (`record-vim.ts`, `bench-gate.ts`, `sandbox.ts` with its profiles in `sandbox/`) |
| `test` | Policy, boundary, vim, component, integration, e2e, and benchmark suites |
| `.github/workflows` | `ci.yml`, `release.yml` |

Git integration spans the layers: `src/core/features/git` (pure diff, signs, status and blame parsing, index text, hunk patches), `src/core/state/git.ts` and `git-commands.ts` (reducers, notices, commands, keys), `src/workspace/git.ts` (the only Git process runner; `MIN_GIT` is 2.31.0) and `git-watcher.ts`, `src/app/tool-host.ts` (terminal hand-off), and `src/ui/overlays/hunk.ts` (hunk preview float).

## Architecture and Key Flows

```text
key → src/ui (normalize) → store.dispatch(action) → core update(state, action) → { state, effects }
                                                                                    │
                     src/ui repaints visible lines ◄── state        effects ──► src/app effect runner
                                                                                    │
                                              result actions ◄── src/workspace (fs, trash, clipboard)
```

Mouse input enters through one full-screen, paint-free `MouseLayer` and one router (`src/ui/mouse.ts`); views translate a cell into a model-level `MouseTarget` from the geometry of their last layout, and the pure `onMouse` reducer (`src/core/state/mouse.ts`) replays the matching keyboard path:

```text
SGR mouse (any-motion tracking) → MouseLayer → router: drop when off / right / middle button; a move only when its target changes; Shift turns a vertical wheel notch sideways
   → first source in z-order with a target (overlays → toasts (wheel only) → cmdline popup and message → statusline → side panel → explorer → bufferline → windows)
   → click count (same cell ≤ 500 ms) · drag capture to the press window
   → store.dispatch({type:"mouse", event, now}) → onMouse: overlay gate → focus → keys / commands / exported reducers
```

A move with no button held reaches `onMouse` before the overlay gate: resting 500 ms (timer `lspPointer`) on a word of the active window's code buffer, in Normal mode with no overlay open, sends an automatic hover marked `pointer`. That float hangs under the pointer (the router keeps its last cell), stays while the pointer is on it, and closes when the pointer leaves the word; an answer that arrives after the pointer left shows nothing, and a float opened with `K` is not closed by the pointer.

A rendered span can carry `fold` (a block id); the text view reports a press on it as the `fold` window spot, and `onMouse` flips that block's fold in the window like `za`, without moving the cursor. Callouts with `+`/`-` tag their `▸`/`▾` marker this way. A repeated click on one cell keeps the first click's target, because that click can reveal source and move the text under the pointer. A double click on a tag (inline, or a frontmatter chip, whose span carries `tag`) opens the `tagNotes` picker instead of selecting the word; `gd` (`link.followOrTag`) does the same when there is no link under the cursor.

`update` is pure and synchronous; adapters only execute effects and report results as actions. Saves are atomic (private `0600` temp file, fsync, rename) and keep mode, BOM, line endings, and the trailing newline; the watcher ignores the app's own operations.

Startup reads `config.toml` and the state file synchronously, paints the first frame, and only then starts the watcher and the index worker (`setImmediate` in `src/app/main.ts`), so the first frame does not depend on the workspace size:

```text
src/workspace/index-worker.ts ──batch{summaries, done, total, removed?}*──► src/app/index-host.ts ──indexBatch──► store
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

Language servers follow the same one-way flow. The core holds `LspState` and emits `lsp` effects; the host observes the store to start servers and sync documents, and answers with actions:

```text
store change → lspHost.observe: attach (spec by file type, root by markers) → spawn or reuse client → didOpen / didChange (150 ms debounce) / didClose
key (K, gd, grn, …) → core request → lsp effect → runner → lspHost.run → client request → lspResult → float, jump, picker, or workspace edit
server → publishDiagnostics | $/progress | showMessage → lspDiagnostics | lspServer (100 ms throttle) | lspMessage → state → views
didOpen / didChange / workspace/inlayHint/refresh → lspHost: textDocument/inlayHint → lspInlayHints → state → views
cursor rests 250 ms (Normal) → lspHighlight timer → documentHighlight request → highlights → views
exit → lspHost.stop(): shutdown → exit → SIGKILL survivors at 500 ms; resolves only after every server and version probe has exited
```

A crash restarts the server and resends open documents; the fifth crash within 3 minutes leaves it `failed`. A server that exits before `initialize` completes is `unavailable` and stays silent; a missing binary is `missing`; both show only in `:LspInfo`, which lists every wanted server with its state and, once started, the binary it runs from (`ServerView.binary`, e.g. a project's own `node_modules/.bin/tsc`).

Notes are created only through the `createNote` effect, whose adapter expands the template and calls `createExclusive` (temp file + `link()`, `wx` fallback), so an existing path is never replaced:

```text
:Today | calendar Enter | <leader>nn → note-commands → (index hit) openPath{after} | createNote effect
   → runner (serial): read template → expandTemplate → createExclusive → noteCreated → open, cursor on first unchecked task
```

`.base` files are file type and editor kind `base` by registration only (`src/core/features/bases/file-type.ts`): the buffer is `readOnly` (the save gate refuses it), keys never reach vim, and `EditorKindSpec.open` creates the window's `kindState`. `baseViewModel` (`src/core/state/base-model.ts`) derives the table or board from the index's candidates and memoizes it. A table column's width (`TableColumn.width`, cells) is the window's resized width, else the view's `columnSize` (Obsidian pixels ÷ 8; keys with or without `note.`), else its widest header or cell up to 24, never under 3; `>`/`<` widen or narrow the focused column by 4, `=` returns it, and a drag on a header separator (the `baseEdge` window spot) resizes the column to its left, a double click returning it. `layoutBaseTable` (`src/ui/widgets/base.ts`) shows every column when they fit; otherwise the first column stays pinned (at most half the width), the columns after it start `BaseWindowState.scroll.col` columns in (moved so the focused column shows whole), the next column is drawn clipped when 6 or more cells are left (it has no resize edge, and focusing it scrolls it in), and the header shows `‹ +N` after the pinned column and `+N cols ›` at the right edge; `BaseView` reports the columns it shows scrolled off (the `baseScrolled` action, after the frame and only when it differs, like `zoomFill`), so `scroll.col` follows focus moves; `H`/`L` (and a sideways or Shift wheel notch) scroll the columns after the pinned one, taking the focus along unless it is on the pinned column, and the hint shows `H/L scroll` while columns are hidden. `o` (`base.newRow`) asks for a new note's name in a "New row" prompt prefilled with the folder the filters ask for (`newNoteSeed`, `src/core/features/bases/new-note.ts`: the first `file.inFolder`, else the base's folder), and Enter creates it blank (no template picker) through `createNote` with `frontmatter` and `reason: "row"`: the properties the filters in effect require (`file.hasTag`, `file.hasProperty`, `property == literal` in `and` lists and `&&` chains; `or`, `not`, and other comparisons add nothing), the window's pins, and the focused group or lane; then the view's other note-property columns, empty (`[]` for list types), with a `created_at` column (by name, or base type `created_at`/`created_time`) set to the local `YYYY-MM-DDTHH:mm:ss` of Enter and an `updated_at` column (or `last_edited` type) left out so it shows the file's modified time; all set by `seedFrontmatter` over the template text so they win; the answer carries the written text, which the index takes at once, and the base window focuses the new row (`focus.path`) instead of opening the note. Date cells (`src/core/features/bases/dates.ts`) show as local `YYYY-MM-DD HH:mm:ss` however they are written (file times; `T` or a space; with or without seconds, fraction, `Z`, or offset; no zone means local time), a date alone as `YYYY-MM-DD`, and sort and summarize by instant; a note without `created_at`/`updated_at` shows its file's ctime/mtime there. Resized widths live only in the window state (`BaseWindowState.widths`), are dropped when the view changes, and never reach the file; likewise `/` filters rows by text (rows with a cell containing it, ignoring case) and `F` pins the focused cell's value (stacking across properties; `c` clears both): `BaseWindowState.query` and `pins` reach the evaluator as `BaseUi`, apply after the base and view filters and before `limit`, and are dropped when the view changes; embeds use `columnSize` and content widths. A cell edit or card move writes one frontmatter key:

```text
open note   → applyBufferEdits (one undo step)
closed note → patchFrontmatter effect (serial queue) → read → refuse if stale → patch → atomic write → frontmatterPatched
```

Git starts after the first frame. Every Git call runs through `src/workspace/git.ts` as an argv (never a shell) with `--no-optional-locks` and `--literal-pathspecs`, with patch and buffer contents only on stdin; its output is decoded keeping a leading BOM, so index text compares with the buffer exactly. The core only sees results:

```text
first frame → detect (git missing → inert; < 2.31 → warn notice, inert; no repo → inert)
   → gitDetected → watch the git dirs → status (coalesced 200 ms) → index read per open file whose status entry changed
     (every open tracked file after a git-dir change, e.g. an outside checkout)
   → buffer edit → 100 ms diff timer → hunks → change column, statusline counts, explorer markers
<leader>ghs / <leader>gg → save gate (unsaved buffers are written first; a failed save stops) → stage patch | tool hand-off
tool hand-off → flush frame → hold interrupts → suspend shell → tool runs → reset foreign modes → resume → re-read buffers, status, and index
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

Package homes, enforced by the same test (`PACKAGE_HOMES`, keyed by package name): the five Markdown tree packages and `beautiful-mermaid` are imported only from `src/core/lang/markdown/`; `yaml` only from `src/core/lang/markdown/` and `src/core/features/bases/`; `katex` and `mermaid` only from `src/preview/`; `toml-eslint-parser` only from `src/core/config/`; and `vscode-jsonrpc` and `vscode-languageserver-protocol` only from `src/workspace/lsp/`, so the core stays protocol-free.

## Data and Contracts

- **Data Ownership and Storage:** Notes are plain files in the user's workspace folder, read and written as-is. No database.

| Contract | Source of truth |
|---|---|
| App state, actions, effects (one-way protocol) | `src/core/state/types.ts` — `AppState`, `Action`, `Effect`, `FsOp`; `createUpdate` in `src/core/state/update.ts`, `createStore` in `src/core/state/store.ts` |
| Editor kernel | `src/core/kernel/{text,editor,vim,commands,view}` — text buffer, vim engine (`handleKey`), `CommandRegistry`, `Keymap`, `layoutText` and decorations |
| File types and highlighting | `src/core/filetypes/registry.ts` (`FileTypeRegistry`), `src/core/lang/code` (language table, `lowlightHighlighter`), `src/core/lang/markdown/file-type.ts` |
| Effect execution | `src/app/effects.ts` — one serial file-system queue; writes queued behind a rename, move, or trash of their path follow it; `createNote`, `patchFrontmatter`, and `copy` run on it; `createExclusive`, `copyEntry`, and `moveInto` in `src/workspace/fs.ts` never replace an entry |
| Explorer clipboard | `y`/`x`/`p` (`explorer.copy`/`cut`/`paste`; `takeSelected`, `startPaste`, `onFileClip`, `freeName` in `src/core/state/explorer.ts`). `y`/`x` keep `ExplorerState.clip` (a cut entry is dimmed) and emit `fileClipboardWrite` with absolute paths; `p` emits `fileClipboardRead`, and the runner answers `fileClip` with paths inside the workspace spelled from its root (through `realpath`) and the folders marked. The system clipboard's files win, but the explorer's cut decides when they are the paths `x` took (Finder has no cut); with none there, `clip` is pasted. Workspace entries copy (`FsOp` `copy`) or move through the link-safe path (`pasteMove` in `link-edits.ts`; several cut entries move without link edits); outside entries copy, or move in when a Linux file manager cut them (`FsOp.outside`, absolute `from`). A taken name gets ` copy`, ` copy 2`, … (folders keep dots); a folder never goes into itself. A copy runs on the serial queue (saves wait behind it); one still running after 300 ms reports `copyProgress` at most every 100 ms (`Copying pics… 120/3400`, entries counted by `copyEntry`), and every finished paste says `Pasted <name>`. `FileClipboard`/`detectFileClipboard` in `src/workspace/system.ts`: `osascript` (JXA, paths as argv) on macOS, `wl-copy`/`wl-paste` on Wayland, `xclip` on X11, reading `x-special/gnome-copied-files` or `text/uri-list` with `application/x-kde-cutselection`, and writing GNOME's list, or a URI list when `XDG_CURRENT_DESKTOP` names KDE; otherwise `noFileClipboard` and pastes stay inside so |
| Markdown model | `src/core/lang/markdown/{blocks,scan,doc,mdast}.ts` — block split and fast scan (links, tags, headings, block ids, frontmatter) with a per-block cache; the mdast tree only on demand |
| Live preview (extension points used by later work) | `src/core/lang/markdown/live-preview.ts` — `PreviewCtx`, `MarkdownViewInput`, `livePreview`, `BlockRenderer`, `registerBlockRenderer`; `src/ui/widgets/registry.ts` — `registerWidgetPainter` (painters by widget type); `src/core/state/view-context.ts` — `ViewContextRegistry` (view-context builders by file type) |
| Editor kinds | `src/core/filetypes/registry.ts` (`EditorKindRegistry`, `EditorKindSpec.open`, `FileType.readOnly`); `WindowState.content.editor` follows the file type's registered kind, else `"text"`, and `kindState` holds the kind's window state; `src/ui/editors/registry.ts` (`registerEditorView`, `WindowView`) — `text` (`EditorView`) and `base` (`BaseView`) |
| Browser preview | `src/preview/server.ts` (routes `/`, `/assets/*`, `/render`, `/file/*`, SSE `/events`); `PreviewState` in `src/core/state/types.ts`; `renderHtml` in `src/core/lang/markdown/html.ts` (escaped HTML) |
| Link index | `src/core/features/links/{note-index,resolve,rename,mentions}.ts` — `NoteIndex`, `resolveLink`, `planRename`; worker messages `ToWorker`/`FromWorker` in `src/workspace/index-worker.ts` |
| Config file | `src/core/config/{schema,toml}.ts` — `ConfigSchema` (strict: unknown keys are errors; the settings picker (`<leader>us`, also in the explorer, or `:Settings`; `SETTINGS` in `src/core/state/settings.ts`) changes twelve choice settings (`explorer.position`, `explorer.icons`, `explorer.dotfiles`, `explorer.gitignored`, `theme`, `color`, `mouse`, `editor.wrap`, `editor.relativeNumbers`, `preview.mode`, `preview.images`, `autosave.enabled`), six number settings (`autosave.delayMs`, `editor.tabWidth`, `editor.keyTimeout`, `explorer.width`, `preview.embedMaxRows`, `escTimeoutMs`), and four text settings (`daily.folder`, `daily.format`, `daily.template`, `templates.folder`): Enter on a number or text setting opens a prompt (`SettingPrompt`, handled by `settingPromptKey`) whose value `parseSettingValue` checks against `ConfigSchema` alone, Enter saving the value the config holds (paths normalized) and Esc returning to the picker; saving `explorer.width` drops a resized width; Enter on a choice setting applies the next choice at once and emits `writeSetting`, which the runner serializes and turns into an in-place edit by `setConfigValue` (`src/core/config/toml-edit.ts`: replaces the value keeping comments, else adds it to its table, inline table, or dotted siblings, else appends the table; never edits a file with errors) and an `atomicWrite`; a failure dispatches `settingFailed`, which restores the previous value and toasts the reason; top-level `theme` (`THEME_NAMES`) is `dark` (default) or `light` (Tokyo Night night and day, palettes in `src/ui/theme.ts`) or `catppuccin-latte`/`-frappe`/`-macchiato`/`-mocha` (`src/ui/catppuccin.ts` maps each flavor's 26 colours to the same palette keys; `DIAGRAM_COLORS` in `src/core/lang/markdown/renderers/mermaid.ts` gives Mermaid zoom colours per theme); top-level `mouse` (default `true`) switches terminal mouse reporting, synced to `renderer.useMouse` on every paint, off after every exit; a `[keys.<mode>]` value starting with `<` (`jj = "<Esc>"`) is a key sequence typed into the vim engine past the keymap, allowed only in `normal`, `insert`, `visual`, and `visualLine` (`isKeySequence` in `src/core/state/keymap.ts`); in Insert mode a binding's first keys are held (shown as pending keys, no which-key popup) until it completes, the next key misses (the held keys are typed, then that key is looked up afresh), or `editor.keyTimeout` (default 1000 ms, 50–10000) fires the `keyTimeout` timer and types them; a `[keys.<mode>]` value of `""` unbinds the built-in binding on those keys (`effectiveBindings` drops it); the keymap picker (`<leader>?`, `help.keymap`; `src/core/state/keymap-edit.ts`) edits bindings in every mode and lists built-in ones switched off as `off`: Enter changes a binding's keys, `C-a` adds one (mode, keys, then a command id or key sequence, each checked by `validateBindings`), `C-x` unbinds (`""` over a built-in, else your line goes), `C-r` restores a built-in by removing your lines for its keys; a change to a built-in binding in effect waits for `y` at a confirmation that says what changes and how to undo it; the `writeBindings` effect sets or removes the entries in one `config.toml` write (`setConfigValue`, `removeConfigValue`), and a failure dispatches `bindingsFailed`, which restores the previous keymaps; `[explorer]` sets `position` `right` (default) or `left`, and the docked side panel takes the other edge, with `<C-w>` toward it entering it, and `<C-w>h`/`<C-w>l` toward the open explorer's edge enters the explorer the same way (toward the windows leaves it; `Enter`/`l` on a note that is already open focuses its window), and `icons` `nerd` (default; Nerd Font file-type icons by exact name, then extension, from `src/ui/icons.ts`) or `unicode` (`▸`/`▾` folders, `◇` notes, `▦` bases, `◩` images, `≡` other files), `dotfiles` (default `false`) lists dot entries other than `.git` in the explorer only (`H` in the explorer toggles it and saves it like the picker; `listDir` effects carry `dotfiles`, the watcher passes dot paths only while it is on; while it is on dot paths are indexed and searchable like any other except names in `[index] exclude` (`indexSkips` in `src/app/index-host.ts`), and the index host's `observe` rescans when either setting changes, the scan's first batch carrying `removed` for files no longer found; dot paths never reach language servers; `.git` and `node_modules` stay hidden in `src/workspace/ignore.ts`), `gitignored` (default `true`) lists names a `.gitignore` matches in the explorer only, dimmed (`I` in the explorer toggles it like `H`; `listDir` effects carry `gitignored` and listed entries carry `ignored`; hiding them collapses gitignored folders; the watcher passes a gitignored path only when the explorer lists its folder and marks gitignored events, and dot events while `dotfiles` is off, `explorerOnly`, which never reach the index or search; dot and gitignored events never reach language servers; the runner reads one folder at a time, folding listings asked for meanwhile into one more), and `width` (default 30, 15–200) the tree's columns until it is resized: `<C-w>>`/`<C-w><` (5 columns) and `<C-w>=` (back to `width`) in the explorer, or a drag on the docked separator, set `panels.explorer.width`, which `explorerWidth` in `src/core/state/explorer.ts` clamps to 15 columns and half the terminal and the session file keeps as `explorer.width`; `[preview]` sets `mode` `reading` (default)/`live`/`source`, `embedMaxRows`, `images` `auto`/`blocks`/`off`; `[daily]` sets `folder` (default `daily`), `format` (Moment tokens, default `YYYY-MM-DD`), `template` (default `templates/daily.md`); `[templates]` sets `folder` (default `templates`); `[index]` sets `exclude` (default `[".obsidian", ".trash"]`), entry names (no `/`) the index and search skip at any depth while the explorer still lists them, so Obsidian's settings, plugin code, and deleted notes stay out of search and link resolution (`hasNamedSegment` in `src/workspace/ignore.ts`); `[git]` sets `tool`, a non-empty argv list (default `["lazygit"]`) run at the repository top for `<leader>gg`, with `~` passed literally), `parseConfig` |
| Daily notes and templates | `src/core/time/{local,format}.ts` (`localDateTime`, `addDays`, `formatDate` — Moment 2.29.4 output); `src/core/features/notes/{daily,template}.ts` (`dailyPath`, `parseDailyDate`, `expandTemplate` — Obsidian's `{{date}}`/`{{time}}`/`{{title}}` rules); `src/core/state/{note-commands,calendar}.ts` |
| Frontmatter patch | `src/core/lang/markdown/frontmatter-patch.ts` — `patchFrontmatter` changes one key and keeps comments, order, quoting, line endings, and the body; `mergeFrontmatter` (template insert); `yamlScalar` |
| Bases | `src/core/features/bases/*` — `parseBase`, `evaluateBase` (Obsidian `inFolder`/`hasTag`, `filter_hides_rows` diagnostics), `summarize` (15 default summaries), `propertyType` (`.obsidian/types.json`, else inference), `candidatesFrom` (every `file.*` field from index facts), `tableModel`, `kanbanModel`, `BaseLayoutRegistry`, `KANBAN_TYPE`; `src/core/state/base-{model,commands,write}.ts`; painters in `src/ui/widgets/base.ts` |
| Embed models | `src/core/state/embed-models.ts` (`EmbedModelRegistry` by file type; `PreviewCtx.embedModel`); `base` registers `baseEmbedModel` |
| Git | `GitState`, `RepoInfo`, `IndexEntry`, `GitPending`, `StageReport`, `ToolResult` and the git actions and effects in `src/core/state/types.ts`; reducers and the notice catalogue in `src/core/state/git.ts`; `Git`/`createGit` (`detect`, `status`, `readIndex`, `stage` with an index-oid guard, `blame`) in `src/workspace/git.ts`; `watchGitDirs` in `src/workspace/git-watcher.ts`; `createToolHost` in `src/app/tool-host.ts`; `Shell.flush/suspend/resume/resetForeignModes` in `src/ui/shell.ts` |
| Screen layout | `src/core/state/layout.ts` — `statusRow` (the last row) and `bodyRows` (between the bufferline on row 0 and the statusline); the core viewport and every view and float take their rows from them. `src/ui/views/statusline.ts` shows the pending keys before `Ln:Col`; `src/ui/views/cmdline.ts` draws the `:`/`/`/`?` popup just above the statusline (completions above it) and, otherwise, the latest message right-aligned on the row above the statusline; toasts stay at the top right |
| Buffers | `AppState.bufferOrder` (bufferline order, pinned buffers first) and `AppState.bufferMru` (most recently shown first; the second is the alternate), kept in step with the listed buffers by `syncBufferLists` in `src/core/state/buffers.ts` after every action; `BufferState.pinned`; `WindowState.views` (the cursor and scroll a window last had in each buffer, restored by `showBuffer`; never persisted); `removeBuffer` falls back to the most recently shown buffer. Commands and bindings in `src/core/state/buffer-commands.ts` (`]b`/`[b`, `<C-^>`/`:b#`, `:b N\|name`, `:ls`, `:wa`, `<leader>b…` closes and pins, `]B`/`[B`, `<leader>1`–`9`); the `buffers` picker source closes the selected buffer with `C-x` (`PickerSource.remove`) |
| Session state | `PersistedState` in `src/core/state/types.ts` (`"version": 1`; `buffers` in bufferline order with an optional `pinned`); `snapshotSession`/`parsePersisted` in `src/core/state/session.ts`. A folder start reads each window's file and, in the background (`windows.restore.background`), every other saved buffer; those open listed but unshown, and the saved order and pins apply once every read has answered |
| Mouse | `MouseEvent`, `MouseTarget`, `WindowSpot` in `src/core/state/types.ts` (model values only, no screen coordinates or button numbers; a middle press is its own `middle` event, which closes a bufferline tab); `onMouse` and `pressStops` in `src/core/state/mouse.ts`; `rowAt`, `displayColAt`, `sourceColAt` in `src/core/kernel/view/hit.ts` (screen row and display column → source column, using `Span.col`/`Span.inserted` set by `spansOf`); `createMouseRouter`, `MouseSource`, `MouseLayer`, `CLICK_MS` in `src/ui/mouse.ts`; each view's `targetAt`/`dragAt`/`itemAt`. Prompt and conflict dialogs ignore the mouse; toasts pass clicks through |
| `[lsp]` config | `src/core/config/lsp.ts` — `LspConfigSchema` (`enabled` default `false`, `formatOnSave` default `false`, `inlayHints` default `true`, `endOfLineDiagnostics` default `true`, `servers.<name>` overrides a built-in or defines a new server with `command` and `fileTypes`; also `enabled`, `rootMarkers`, `rootSearch` `nearest`/`topmost`, `settings`, `initOptions`, `snippets`), `BUILTIN_SERVERS` (`tsc` gated on version ≥ 7, `typescript`, `pyright`, `gopls`, `rust-analyzer`, `clangd`, `json`; the TypeScript servers and `gopls` carry the settings that make them send inlay hints), `resolveServers`, `gateAllows` |
| LSP state | `src/core/state/lsp-types.ts` — `LspState` (`servers`, `attached`, `diagnostics` per server with push and pull slots, `shown` (frozen for the buffer being typed into), `inlayHints` per path and server, `highlights`, `pending`, `float`, `list`, `symbols`, `workspaceSymbols`, `actions`, `edit`, `format`), `ServerView`, `LspOp`, `LspResult`, `CodeEdit`, `CodeCompletionItem`; reducers in `src/core/state/lsp.ts` (`request`, `onLspResult`, `syncDiagnostics`, `syncFloat`, `cursorDiagnostic`), `lsp-commands.ts` (`lspCommands`, `lspBindings` per code file type: `K`, `gd`, `gD`, `grt`, `grr`, `gri`, `gO`, `grn`, `gra`, `]d`/`[d`, `<C-w>d`, `<leader>xd`, `<leader>xs`, Insert `<C-s>` and `<C-Space>`; `:Format`, `:Diagnostics`, `:WorkspaceSymbols`, `:LspInfo`, `:LspRestart`); `syncHighlight` and `onHighlightTimer` in `lsp.ts`, `lsp-edits.ts`, `code-completion.ts`, `lsp-pickers.ts`; diagnostics drawn by `diagnosticMarks` and `endOfLineDiagnosticMarks` in `src/core/kernel/view/diagnostics.ts`, hints by `inlayHintMarks` (`inlay-hints.ts`), and symbol uses by `referenceMarks` (`marks.ts`); text not in the buffer is a `Span` with `virtual` (`inline` moves the cursor along via `displayColOf` in `hit.ts`, `eol` is left out of wrapping by `wrapText`) |
| LSP host and client | `src/app/lsp-host.ts` — `createLspHost` (`observe`, `run`, `notify`, `stop`), `LSP_STOP_BOUND_MS` 500, `SYNC_DEBOUNCE_MS` 150, `PROBE_BOUND_MS` 2000, `CRASH_LIMIT` 5 in `CRASH_WINDOW_MS` 180000; `src/workspace/lsp/client.ts` — `createLspClient` (one process per server and root, `ClientEvents`, watched-file registrations); `convert.ts` (protocol ↔ core values), `capabilities.ts`, `sync.ts`, `roots.ts` (`findRoot`), `language-id.ts`; UI in `src/ui/overlays/lsp-float.ts` (`LspFloatView`, non-modal, mouse-inert), the statusline server segment, and code completion rows; `test/fixtures/fake-lsp.ts` is the scripted test server |
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

- **Local Setup:** install Bun `1.4.2`, then `bun install --frozen-lockfile`. Run with `bun run dev` (no build step), or `bun run sandbox [--profile <name>]` for a demo vault with isolated config and state (`--list` names the profiles, `--journeys` prints a profile's manual checks). `NO_COLOR` disables colour. `so --version` prints `package.json` `version`, or `SO_VERSION` when set at build time (release builds). PTY tests set `SO_TEST=1`, which alone enables the test-only hooks `SO_TEST_SLOW_WRITE` and `SO_TEST_THROW` in `src/app/main.ts`.
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
  | `check` | `biome check . && bun --bun run tsc --noEmit -p . && bun --bun run knip && bun test src scripts test/boundaries.test.ts test/repo.test.ts test/vim` | Fast local gate: format, lint, types, unused code, unit suites (< 30 s) |
  | `test:ci` | `bun test test/ui test/integration test/e2e` | Component, integration, and PTY e2e suites |
  | `bench` | `bun scripts/bench-gate.ts` | Benchmark gate (median of 5 runs, 2× target) |
  | `build` | `bun build --compile src/app/main.ts src/workspace/index-worker.ts --outfile dist/so` | Single binary; the worker is a second compile entrypoint; the preview page, KaTeX (with fonts), and Mermaid are embedded, so the binary needs no `node_modules` |
  | `record:vim` | `bun scripts/record-vim.ts` | Record vim expectations from Neovim 0.11.x (local only) |
  | `sandbox` | `bun scripts/sandbox.ts` | Launch so on a profile (`scripts/sandbox/profiles/`, default `tour`): a vault, optional `config.toml`, and journeys to check by hand, staged once under `.sandbox/<profile>/` with its own config and state (`--reset` restages that profile; other args go to so) |

- **Test Layers:**

  | Layer | Location | Runs in |
  |---|---|---|
  | Unit | colocated `src/**/*.test.ts`, `scripts/*.test.ts`, `test/vim`, `test/boundaries.test.ts`, `test/repo.test.ts` | `check` |
  | Component | `test/ui` | `test:ci` |
  | Integration | `test/integration` | `test:ci` |
  | End-to-end (PTY) | `test/e2e` | `test:ci` |
  | Benchmark | `test/bench` | `bench` (Linux CI only) |

  Language-server suites run against `test/fixtures/fake-lsp.ts`, whose command line carries a unique `fake-lsp-<log>` tag; every suite stops its servers, so `pgrep -f fake-lsp` is empty after a run. `test/integration/lsp-real.test.ts` runs only where `rust-analyzer --version` succeeds; GitHub runners have only rustup's proxy without the component, so CI skips it.

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
  | `lspKeystrokeP95` | 16 | `lsp-keystroke.bench.ts` — the source key mix in a 5,000-line TypeScript file with the real host attached to the fake server, which publishes 200 diagnostics on every change |
  | `gitDiffKeystrokeP95` | 24 | `git-diff.bench.ts` — 200 keys in a 5,000-line note whose every line differs from the index, each followed by the 100 ms diff |

- **CI Checks:** `.github/workflows/ci.yml` runs on `pull_request` to `master` only (no `push` trigger), with per-PR concurrency and `cancel-in-progress`. Job `check` (`ubuntu-24.04`) runs `bun run check`; job `test` (matrix `ubuntu-24.04`, `macos-15`) runs `bun run test:ci`, plus `bun run bench` on Linux.
- **Release:** Nothing is released automatically; a release happens only when the user asks. A pushed `v*` tag runs `release.yml`, which builds four binaries on one runner, smoke-tests each on its native runner (`macos-15`, `macos-15-intel`, `ubuntu-24.04`, `ubuntu-24.04-arm`), and publishes a GitHub Release with generated notes only after every smoke job passes. Tags containing `-` publish as prereleases. A manual run (`gh workflow run release.yml`) is a dry run: the same build and smoke tests with version `0.0.0-dev+<short sha>`, publish skipped. Phase exits use the dry run.

## Sources and Open Questions

- **Sources:** `package.json`, `bunfig.toml`, `tsconfig.json`, `biome.json`, `knip.json`, `.github/workflows/*`, `test/repo.test.ts`, `test/boundaries.test.ts`, `src/core/state/types.ts`, `src/app/{main,effects,index-host,lsp-host,workspace}.ts`, `src/workspace/lsp/*`, `src/core/config/lsp.ts`, `src/core/state/lsp*.ts`, `src/workspace/{config-file,state-file,log,index-worker,images,system}.ts`, `src/core/config/schema.ts`, `src/core/state/mouse.ts`, `src/ui/mouse.ts`, `src/core/lang/markdown/live-preview.ts`, `src/preview/{server,assets}.ts`, `src/app/preview-host.ts`, `src/app/tool-host.ts`, `src/workspace/{git,git-watcher}.ts`, `src/core/state/{git,git-commands}.ts`, `src/ui/overlays/hunk.ts`, `scripts/bench-gate.ts`; initiative design `rm261003abzp-design.md`.
- **Open Questions:** None.
