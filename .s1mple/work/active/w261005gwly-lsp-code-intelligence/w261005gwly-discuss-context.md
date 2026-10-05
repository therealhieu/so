# W261005GWLY: lsp-code-intelligence

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-requirements.md:36`, `:366-369` | v1 put code intelligence out of scope and deferred it until "a code-editor initiative" |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md:849` | v1 design's intended shape for an LSP client |
| `src/core/kernel/text/{pos,text-buffer}.ts` | Position encoding, immutable versioned buffer |
| `src/core/kernel/view/{decorations,types}.ts` | Decoration kinds, `Highlighter`, `Span` |
| `src/core/filetypes/registry.ts`, `src/core/lang/code/file-types.ts` | File-type ids and code file types |
| `src/core/state/{store,types,completion,link-commands,keymap}.ts` | Store subscription, effects, completion state, file-type-scoped keys |
| `src/ui/editors/text-view.ts`, `src/ui/views/statusline.ts` | Decoration provider lists, statusline segments |
| `src/app/{main,index-host,effects,lifecycle}.ts` | Wiring, child-process host pattern, serial edit queue, shutdown bound |
| `src/core/config/schema.ts` | Strict config schema |
| `test/boundaries.test.ts`, `test/repo.test.ts` | Layer rules, package homes, exact pins |
| Spike in this conversation (scratchpad, not committed) | `vscode-jsonrpc` under Bun and in a compiled binary |

## Roadmap Binding

None — standalone work

## 1. User Input

### Original Input

"I want 'so' has code intellegence/lsp support for languages. Inspect and provide the solution: stable, simple, easy to maintain and extend; follow industry standards."

Follow-up decisions from the user:

- Language servers start only when the user opts in. Setting `[lsp] enabled = true` in the XDG `config.toml` turns on a small built-in server table, and each built-in server starts only when its binary is on `PATH`. The user can override built-in servers or add their own.
- Deliver this as one work item (one PR), not as a roadmap.

### Consolidated Requirement or Problem

Add Language Server Protocol code intelligence to `so`'s code (source-view) file types as one work item. The LSP client is opt-in and is configured only from the user's XDG config. It provides diagnostics, hover, definition, completion, signature help, references, implementation, symbols, rename, code actions, and formatting. `src/core` must stay pure and free of protocol types, and typing must stay responsive.

### Constraints and Assumptions

- Server commands come only from the user's XDG config (`project.md` "Files outside the workspace"), never from a file inside the workspace.
- The only outbound network use today is fetching images, and "config is data (TOML), never executed" (`rm261003abzp-design.md:841`). This work is the first to start external programs from configuration, and some servers run project code (build scripts, `go list`).
- `src/core` stays free of I/O, runtime, and `@opentui` imports, and type-only imports count toward the layer rules (`test/boundaries.test.ts:60-62`).
- Every npm version is an exact pin (`test/repo.test.ts:20`). A new package needs a `PACKAGE_HOMES` entry to be limited to one place (`test/boundaries.test.ts:45`).
- No tool may depend on the TypeScript compiler API (`project.md` Constraints).
- The keystroke benchmark target for source views is 16 ms p95 (`project.md` Benchmarks, `sourceKeystrokeP95`).
- CI runs on Linux and macOS without language servers installed. Tests therefore cannot rely on real servers being present (`project.md` CI Checks).
- The user's machine has `rust-analyzer` 1.96.0 on `PATH`. `typescript-language-server`, `gopls`, `pyright-langserver`, `basedpyright`, `vtsls`, and `marksman` were not found (checked in this conversation).
- Spike evidence (this conversation): `vscode-jsonrpc` `9.0.3` with `vscode-languageserver-protocol` `3.18.4` types, over `node:child_process` stdio, ran under Bun `1.4.2` both from source and from a `bun build --compile` binary. Against rust-analyzer, `initialize` took 15 ms, returned `positionEncoding: "utf-16"` with hover and definition providers, and `shutdown`/`exit` ended the process with code 0. `vscode-languageserver-protocol` `3.18.4` depends on `vscode-jsonrpc` `9.0.3` and `vscode-languageserver-types` `3.18.4` (npm registry).

## 2. Project Structure

- `src/core/kernel/text/pos.ts` — `Pos`, `Range`, `Edit`; columns are UTF-16 code units.
- `src/core/kernel/text/text-buffer.ts` — immutable `TextBuffer` with `version`, `line(i)`, `apply`.
- `src/core/kernel/view/decorations.ts` — `Decoration` (`mark`, `replace`, `widget`, `line` with `sign`), `DecorationProvider`.
- `src/core/kernel/view/types.ts` — `Span`, `Sign`, `Highlighter`, `TextView`.
- `src/core/filetypes/registry.ts` — `FileType`, `ViewSpec`, `FileTypeRegistry.forPath`.
- `src/core/lang/code/file-types.ts` — `CODE_LANGUAGES` (lowlight grammar ids such as `typescript` for `.ts`/`.tsx`) and `codeFileTypes` (one `source` view, no decorations).
- `src/core/state/types.ts` — `AppState`, `BufferState`, `Effect`, `CompletionState`, overlays.
- `src/core/state/completion.ts` — the `[[` link completion, limited to Markdown.
- `src/core/state/link-commands.ts` — Markdown-scoped `gd` and `<leader>l*` bindings.
- `src/core/state/keymap.ts` — merges `[keys.<mode>]` and `[filetypes.<id>.keys.<mode>]` overrides.
- `src/core/config/schema.ts` — strict `ConfigSchema` (no `[lsp]` section yet).
- `src/ui/editors/text-view.ts` — builds decoration provider lists (embed/zoom path and window path).
- `src/ui/views/statusline.ts` — statusline segments, including the index segment.
- `src/app/main.ts` — registers file types and commands, subscribes to the store, starts the watcher and index host.
- `src/app/index-host.ts` — a child worker's lifecycle: restart once, then unavailable.
- `src/app/effects.ts` — effect runner with one serial file-system queue, including `applyEdits`.
- `src/app/lifecycle.ts` — shutdown sequence with `FLUSH_BOUND_MS` and `PREVIEW_STOP_BOUND_MS`.
- `src/workspace/` — I/O adapters; no LSP module exists yet.
- `test/boundaries.test.ts`, `test/repo.test.ts` — policy suites a new package and module must pass.

## 3. Standards and Patterns

### Applicable Standards

- `.s1mple/S1MPLE.md:63` — no work-process identifiers in code, comments, test names, or logs.
- `.s1mple/docs/languages/typescript.md` — `import type` for types, colocated `*.test.ts`, behavior-named tests, `bun run check` before commits.
- `test/boundaries.test.ts:16-42` — `LAYER_RULES`: `src/workspace` may import `src/core` and non-UI packages; `src/core` is pure.
- `test/boundaries.test.ts:45-57` — `PACKAGE_HOMES` limits named packages to their listed source prefixes.
- `test/repo.test.ts:20` — exact npm pins.
- `src/core/kernel/text/pos.ts:1` — positions use UTF-16 code units, which is LSP's default `positionEncoding`.
- LSP 3.17/3.18 specification — the `initialize` → `initialized` → `textDocument/did*` → `shutdown` → `exit` lifecycle. The client offers `general.positionEncodings` and the server picks one.
- Neovim 0.11 built-in LSP — key defaults (`K`, `grn`, `gra`, `grr`, `gri`, `gO`, `[d`/`]d`, `<C-w>d`, insert `<C-s>`) and config fields (`cmd`, `filetypes`, `root_markers`). Helix `languages.toml` — `[language-server.<name>]` with `command`, `args`, `config`, `environment`, and per-language `language-servers` lists.

### Existing Patterns

- `src/app/index-host.ts:33-103` — a host that turns child messages into actions. An `error` or unexpected exit is a crash: the first restarts, the second sets the state to "unavailable". Requests left unanswered by a crashed child are answered empty.
- `src/core/state/store.ts:11-31` — `createStore` runs effects, then notifies every subscriber once per dispatch. `src/app/main.ts:242` already subscribes to watch state.
- `src/core/kernel/text/text-buffer.ts:7-13` — immutable buffer; `version` increments on every `apply`.
- `src/ui/editors/text-view.ts:667-672` — language-neutral providers (`searchMarks`, `selectionMarks`) are appended next to the file type's own providers. `:218-224` is the embed/zoom path with the same shape.
- `src/core/state/link-commands.ts:196-201` — bindings are scoped by file type (`{ mode, filetype: "markdown" }`), so `gd` is free in code file types.
- `src/core/state/keymap.ts:9-21` — config overrides per file type via `[filetypes.<id>.keys.<mode>]`.
- `src/app/effects.ts:256-260` — `applyEdits` runs on the serial queue with `FileEdit` (`{ path, edits: SpanEdit[] }`, `SpanEdit = { range, expected, text }`, `src/core/features/links/rename.ts:8-9`).
- `src/ui/views/statusline.ts:30-40` — the index state as a statusline segment with `◆`/`◌`/`✗` glyphs.
- `src/core/config/schema.ts:46` — `z.strictObject` sections with defaults; camelCase keys (`embedMaxRows`).
- `src/app/lifecycle.ts:9-17` — shutdown flushes writes within `FLUSH_BOUND_MS` (2000 ms) and stops the preview within `PREVIEW_STOP_BOUND_MS` (250 ms).

## 4. Architecture

```text
key → src/ui (normalize) → store.dispatch(action) → core update(state, action) → { state, effects }
                                                                                    │
                     src/ui repaints visible lines ◄── state        effects ──► src/app effect runner
                                                                                    │
                                              result actions ◄── src/workspace (fs, trash, clipboard)

store.subscribe ──► src/app observers (session save, test hooks)
src/app/index-host.ts ◄──messages──► src/workspace/index-worker.ts   (crash: restart once → unavailable)
src/app/preview-host.ts ──► src/preview/server.ts                     (stopped within a bound on exit)

file type (codeFileTypes) → highlighter (lowlight) + views[source].decorations = []
text view providers = highlightMarks + file-type decorations + searchMarks + selectionMarks
```

- `src/core/state` — pure reducers; every outside effect is an `Effect` value, and every result is an `Action`.
- `src/app` — composition root and hosts for long-lived children (index worker, preview server).
- `src/workspace` — I/O adapters; the place where external packages with I/O live.
- `src/ui/editors/text-view.ts` — the only place that assembles decoration providers for a window.
- `src/core/lang/code` — code file types; the source of the file-type ids a server would attach to.

## 5. Code Flow

```text
edit (vim, undo, mouse, link edits, disk reload)
  → reducer replaces BufferState.text (TextBuffer.apply → version + 1)
  → store notifies subscribers
  → text view lays out visible lines with providers → paint

gd in a Markdown buffer → keymap {mode: normal, filetype: markdown} → link.followOrTag
gd in a code buffer     → no binding today

startup → config + state read synchronously → first frame
        → setImmediate: watcher → fileChanged + indexHost.notify; indexHost.start

exit → lifecycle: flush writes (≤ 2000 ms) → save session → stop preview (≤ 250 ms) → restore terminal
```

1. Every buffer change produces a new `TextBuffer` with a higher `version` in `BufferState.text` (`src/core/kernel/text/text-buffer.ts:57-79`, `src/core/state/types.ts:78-103`).
2. The store calls every subscriber after effects run (`src/core/state/store.ts:20-25`).
3. The window view builds its provider list and calls `layoutText` for visible lines only (`src/ui/editors/text-view.ts:645-680`).
4. Key sequences resolve through file-type-scoped bindings, so a binding for `typescript` does not affect `markdown` (`src/core/state/link-commands.ts:196`).
5. Watcher events reach both the store and the index host (`src/app/main.ts:363-366`).
6. Completion today opens only for `[[` in Markdown insert mode, and its items are `{ insert, label, detail? }` (`src/core/state/completion.ts:23-43`, `src/core/state/types.ts:176-185`).

## 6. Boundaries

### In Scope

- An opt-in LSP client for code file types in the source view, configured only from the XDG `config.toml`: a built-in server table plus user overrides and additions.
- Server lifecycle: start, project root detection, document sync, crash handling, restart, and shutdown on exit.
- Features: diagnostics, hover, definition, completion, signature help, references, implementation, document symbols, rename, code actions, and formatting.
- Key bindings for code file types, server status in the statusline, and inspection and restart commands.
- Tests that need no real language server, and a keystroke benchmark with a server attached.

### Out of Scope

- Semantic tokens, inlay hints, tree-sitter, and debugging (DAP) — excluded in this conversation.
- Diagnostics in Markdown `live`/`reading` views — excluded in this conversation.
- Server configuration from any file inside the workspace — user decision (opt-in, XDG config only).
- Installing or downloading language servers — the binary must already be on `PATH`.
- A roadmap or multi-PR delivery — user decision (one work item).

### Interfaces and Dependencies

- New packages under consideration: `vscode-jsonrpc` `9.0.3` (runtime) and `vscode-languageserver-protocol` `3.18.4` (types). Each needs an exact pin and a `PACKAGE_HOMES` entry.
- `Effect` / `Action` unions in `src/core/state/types.ts` — the only channel between pure core and a server host.
- `Decoration` `mark` and `line` (`sign`) — the existing surface for underlines and gutter signs.
- `CompletionState` and the completion overlay — currently Markdown-link specific.
- `applyEdits` effect and `FileEdit` — the existing multi-file edit path that rename and code actions could reuse.
- Picker overlay (`src/core/state/picker.ts`, `src/ui/overlays/picker.ts`) — candidate surface for references and symbols.
- `ConfigSchema` — needs a new strict section.
- `src/app/lifecycle.ts` — shutdown bounds for stopping server processes.
- File-type ids from `CODE_LANGUAGES` — lowlight grammar names, mapped to LSP `languageId`s.

## 7. Unknowns

- File-type ids do not always match LSP `languageId`s. `.tsx` and `.jsx` belong to the `typescript` and `javascript` file types, but servers expect `typescriptreact` and `javascriptreact`. `.h` is in the `c` file type.
- Which servers make up the built-in table, and their exact commands and root markers. The candidates named so far are typescript, python, go, rust, clangd, and json.
- How a language-neutral diagnostic decoration reaches the text view. Code file types have no `input`/view context today (`src/core/lang/code/file-types.ts:60-70`).
- How completion generalizes beyond `[[` links without changing link completion behavior.
- How the main thread handles large server responses (such as big completion lists) within the 16 ms keystroke target. Unmeasured.
- How server progress (`$/progress`) and messages (`window/showMessage`) are shown, if at all.
- `project.md` `PACKAGE_HOMES` text omits `@resvg/resvg-wasm` (`test/boundaries.test.ts:56`). This is a small stale point in the baseline and does not affect this work.
