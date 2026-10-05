# W261005GWLY: lsp-code-intelligence — Requirements

**Document Status:** Ready for System Design

**Context Source:** `w261005gwly-discuss-context.md`

**Research Source:** None

**Unresolved Items:** None

**Ready for System Design Checklist:**

- [x] Every active topic is covered.
- [x] Every current requirement has a stable, unique ID and exact current revision.
- [x] Every current requirement includes its question, answer, rationale, acceptance criteria, and dependencies.
- [x] Scope, constraints, assumptions, risks, and compatibility boundaries are explicit.
- [x] For roadmap-linked work, the accepted parent baseline has been checked, assigned scope is covered by current requirements, and gates due before requirements approval have evidence; unresolved parent impacts prevent readiness. (Not applicable — standalone work.)
- [x] Revised and replaced requirements preserve append-only lineage and complete prior revisions.
- [x] When research exists, every RF-to-evaluated-revision relationship has one reconciliation outcome; a finding that evaluated no requirement has one `None` relationship row. (Not applicable — no research.)
- [x] Deferred decisions are outside the current-requirements ledger.
- [x] `Unresolved Items` is `None`.

**Approval:** REQ1–REQ8 were chosen by the user on 2026-10-05. REQ9–REQ15 were decided by the agent under the self-drive authority the user delegated for the rest of this discussion on 2026-10-05.

# Table of Contents

1. [Problem and Desired Outcome](#1-problem-and-desired-outcome)
2. [Current and Expected State](#2-current-and-expected-state)
3. [Scope](#3-scope)
4. [Standards and Constraints](#4-standards-and-constraints)
5. [Current Requirements](#5-current-requirements)
   - [W261005GWLY-REQ1@R1: Opt-in, XDG-only servers](#w261005gwly-req1r1-opt-in-xdg-only-servers)
   - [W261005GWLY-REQ2@R1: Small built-in table, stackable servers](#w261005gwly-req2r1-small-built-in-table-stackable-servers)
   - [W261005GWLY-REQ3@R1: Server state visibility](#w261005gwly-req3r1-server-state-visibility)
   - [W261005GWLY-REQ4@R1: Full feature set in one PR](#w261005gwly-req4r1-full-feature-set-in-one-pr)
   - [W261005GWLY-REQ5@R1: Code file types only](#w261005gwly-req5r1-code-file-types-only)
   - [W261005GWLY-REQ6@R1: Diagnostic display](#w261005gwly-req6r1-diagnostic-display)
   - [W261005GWLY-REQ7@R1: Workspace diagnostics picker](#w261005gwly-req7r1-workspace-diagnostics-picker)
   - [W261005GWLY-REQ8@R1: Automatic completion](#w261005gwly-req8r1-automatic-completion)
   - [W261005GWLY-REQ9@R1: Plain-text completion with auto-import edits](#w261005gwly-req9r1-plain-text-completion-with-auto-import-edits)
   - [W261005GWLY-REQ10@R1: Server workspace edits](#w261005gwly-req10r1-server-workspace-edits)
   - [W261005GWLY-REQ11@R1: Formatting](#w261005gwly-req11r1-formatting)
   - [W261005GWLY-REQ12@R1: Server lifecycle and project roots](#w261005gwly-req12r1-server-lifecycle-and-project-roots)
   - [W261005GWLY-REQ13@R1: Navigation keys and views](#w261005gwly-req13r1-navigation-keys-and-views)
   - [W261005GWLY-REQ14@R1: Responsiveness and stale results](#w261005gwly-req14r1-responsiveness-and-stale-results)
   - [W261005GWLY-REQ15@R1: Verification without real servers](#w261005gwly-req15r1-verification-without-real-servers)
6. [Research Impact Review](#6-research-impact-review)
7. [Historical Requirement Revisions](#7-historical-requirement-revisions)

# 1. Problem and Desired Outcome

## Problem Statement

`so` opens code files in a source view with lowlight highlighting only. It has no diagnostics, navigation, completion, or refactoring for code, even though the v1 kernel was built to allow them (`rm261003abzp-design.md:849`).

## Desired Outcome

When the user turns it on, code files get language-server diagnostics, hover, definition, completion, signature help, references, implementation, symbols, rename, code actions, and formatting. The servers are configured only from the user's XDG config. `src/core` stays free of protocol types, and typing stays within the source-keystroke target.

# 2. Current and Expected State

## Current State

```text
open foo.rs → file type "rust" → lowlight highlighter → source view (no decorations)
gd / K / completion in foo.rs → nothing (gd and completion exist only for Markdown links)
```

The kernel already has UTF-16 positions, `mark`/`line` decorations, a sign cell, file-type-scoped keymaps, pickers, a completion popup, and the `applyEdits` multi-file edit path. Nothing connects them to a language server.

## Expected State

```text
[lsp] enabled = true → open foo.rs → root (nearest Cargo.toml) → rust-analyzer (one per server and root)
   edits → didChange (debounced) → publishDiagnostics → signs, underlines, cursor message, :Diagnostics
   K · gd · grr · gri · gO · grn · gra · <C-s> · completion · :Format → request → result (stale → dropped)
statusline: ◌ rust-analyzer indexing 42% → ◆ rust-analyzer
```

Servers start only when the user opts in. Requests never block typing, and every feature degrades to a short message when no server is attached.

# 3. Scope

## In Scope

- The opt-in `[lsp]` config section, a six-server built-in table, and user overrides and additions (REQ1, REQ2).
- Server lifecycle: project roots, document sync, crash handling, `:LspRestart`, `:LspInfo`, and shutdown on exit (REQ12).
- Server state in the statusline and server messages as toasts or log lines (REQ3).
- Diagnostics in the source view and a workspace diagnostics picker (REQ6, REQ7).
- Hover, definition, references, implementation, document symbols, and signature help (REQ4, REQ13).
- Completion with auto-import edits (REQ8, REQ9).
- Rename, code actions, server-initiated edits, and formatting (REQ10, REQ11).
- `workspace/didChangeWatchedFiles` from the existing watcher (REQ4).
- Tests that need no real language server, and a keystroke benchmark with a server attached (REQ14, REQ15).

## Out of Scope

- Semantic tokens, inlay hints, tree-sitter, and debugging (DAP) — excluded by the user on 2026-10-05.
- Language servers on Markdown and `.base` files, including diagnostics in `live`/`reading` views (REQ5). Future trigger: a request for prose linting in notes.
- Snippet expansion and tabstop navigation (REQ9). Future trigger: a request for snippet completion.
- Workspace edits that create, rename, or delete files (`resourceOperations`) (REQ10). Future trigger: a server feature the user needs that depends on them.
- Server configuration from any file inside the workspace (REQ1).
- Installing or downloading language servers; binaries must already be on `PATH`.
- Workspace symbol search (`workspace/symbol`), call and type hierarchy, and document highlights. They were not requested and are not part of Neovim 0.11's default key set. Future trigger: user request.

## Roadmap Assignment

None — standalone work

## Affected Interfaces and Actors

- User — writes `[lsp]` config, edits code files, and uses the new keys and commands.
- Language server processes — new external child processes started by `so`.
- `config.toml` schema (`src/core/config/schema.ts`) — gains a strict `[lsp]` section.
- `AppState`, `Action`, `Effect` (`src/core/state/types.ts`) — gain LSP state, actions, and effects.
- Source text view (`src/ui/editors/text-view.ts`) — gains diagnostic decorations.
- Statusline, command line, completion popup, pickers, and float overlays — gain LSP content.
- Effect runner and lifecycle (`src/app/effects.ts`, `src/app/lifecycle.ts`) — route LSP effects, apply edits, and stop servers on exit.
- Policy suites (`test/boundaries.test.ts`, `test/repo.test.ts`) — new packages get exact pins and a package home.

# 4. Standards and Constraints

## Binding Standards

- `.s1mple/S1MPLE.md:63` — no work-process identifiers in code, comments, identifiers, test names, or logs.
- `.s1mple/docs/project.md` Constraints — `src/core` stays free of I/O, runtime, and UI imports, so protocol types and processes live outside it.
- `test/boundaries.test.ts:16-57` — layer rules and package homes. New packages need an entry that limits them to one source prefix.
- `test/repo.test.ts:20` — exact npm pins; upgrades are deliberate PRs.
- `src/core/kernel/text/pos.ts:1` — positions are UTF-16 code units, which is LSP's default position encoding.
- `.s1mple/docs/languages/typescript.md` — `import type`, colocated behaviour-named tests, `bun run check` before commits.
- LSP 3.17/3.18 specification — lifecycle (`initialize` → `initialized` → document sync → `shutdown` → `exit`) and capability negotiation.
- Neovim 0.11 built-in LSP — default keys and update-in-insert behaviour, because `so`'s vim behaviour is recorded from Neovim 0.11 (`project.md` Data and Contracts).

## Constraints

- Server commands come only from the XDG `config.toml` and the built-in table, never from the workspace.
- Server processes are the first external programs `so` starts from configuration. Some run project code, which is why startup is opt-in.
- CI has no language servers installed.
- `sourceKeystrokeP95` target is 16 ms (`project.md` Benchmarks).
- No dependency on the TypeScript compiler API.

## Accepted Assumptions

- `vscode-jsonrpc` `9.0.3` and `vscode-languageserver-protocol` `3.18.4` work under Bun `1.4.2` from source and in a compiled binary. A spike on 2026-10-05 confirmed this against rust-analyzer 1.96.0 (see the discussion context).
- Users install the server binaries themselves and put them on `PATH`.
- One `so` process opens one workspace folder, and every project root lies inside it.

## Dependencies

- `vscode-jsonrpc` `9.0.3` — JSON-RPC framing and request handling over stdio.
- `vscode-languageserver-protocol` `3.18.4` — protocol types (type-only use).
- Existing completion popup, pickers, prompt overlay, toasts, statusline, and `applyEdits` — the surfaces LSP results reuse.
- Existing watcher events — the source of `didChangeWatchedFiles`.

## Risks and Compatibility

- **Untrusted folders** — some servers run project code. Protection: opt-in startup and XDG-only config (REQ1).
- **Large responses on the main thread** — big completion lists or diagnostics could stall frames. Protection: client-side filtering, debounced sync, and a benchmark with a server attached (REQ14).
- **Edits to closed files** — rename and code actions can write files that aren't open. Protection: the serial queue, atomic writes, refusal on out-of-range edits, and a summary toast (REQ10).
- **Orphan processes** — a crash of `so` could leave servers running. Protection: `processId` in `initialize`, bounded shutdown, and kill on exit (REQ12).
- **Existing behaviour** — Markdown `gd`, `[[` completion, and every existing view stay unchanged (REQ5, REQ8).
- **Config compatibility** — `[lsp]` is a new optional section. Existing config files stay valid, and with no `[lsp]` section no server ever starts.

# 5. Current Requirements

## W261005GWLY-REQ1@R1: Opt-in, XDG-only servers

**Requirement ID:** `W261005GWLY-REQ1`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** When do language servers start, and where does their configuration come from?

**Answer:** Servers start only when the user sets `[lsp] enabled = true` in the XDG `config.toml` (default `false`). Server definitions come only from the built-in table and that file, never from any file inside the workspace.

**Rationale:** Some servers run project code (rust-analyzer build scripts and proc macros, `gopls` running `go list`). Opt-in keeps `so`'s current rule that opening a folder runs nothing, and costs one config line.

```toml
[lsp]
enabled = true
```

**Acceptance Criteria:**

- [ ] With no `[lsp]` section, or `enabled = false`, opening any file starts no process.
- [ ] With `enabled = true`, opening a matching code file starts its server.
- [ ] No code path reads server commands or settings from the workspace folder.
- [ ] `:ConfigReload` that turns `enabled` off stops running servers. Turning it on starts servers for buffers already open.

**Depends On:** None

## W261005GWLY-REQ2@R1: Small built-in table, stackable servers

**Requirement ID:** `W261005GWLY-REQ2`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does the built-in server table work, and can one file type use more than one server?

**Answer:** `so` has six built-in servers: `typescript` (`typescript-language-server --stdio`), `pyright` (`pyright-langserver --stdio`), `gopls`, `rust-analyzer`, `clangd`, and `json` (`vscode-json-language-server --stdio`). `[lsp.servers.<name>]` can turn a built-in off (`enabled = false`), override its fields (`command`, `fileTypes`, `rootMarkers`, `settings`, `initOptions`), or add a new server, which must then give `command` and `fileTypes`. Every enabled server whose `fileTypes` match the buffer and whose binary is on `PATH` attaches. Diagnostics from every attached server are merged, and each is labelled with its server. Each request goes to the first attached server that supports the method, in table order: built-ins first in the order listed above, then added servers in config order.

**Rationale:** Six servers cover the languages most users edit while keeping the table small enough to maintain. Allowing several servers per file type supports the usual main-server-plus-linter setup (ts + eslint, python + ruff) without changing the config contract later. Both Neovim 0.11 and Helix allow this.

```toml
[lsp.servers.rust-analyzer]
settings = { "rust-analyzer" = { check = { command = "clippy" } } }

[lsp.servers.pyright]
enabled = false

[lsp.servers.eslint]
command = ["vscode-eslint-language-server", "--stdio"]
fileTypes = ["typescript", "javascript"]
rootMarkers = ["eslint.config.js", "package.json"]
```

**Acceptance Criteria:**

- [ ] Each built-in starts with its listed command for its file types when its binary is on `PATH`.
- [ ] A built-in whose binary is missing starts nothing and causes no error.
- [ ] `enabled = false` on a built-in stops it from attaching. An override replaces only the fields it sets.
- [ ] An added server without `command` or `fileTypes`, or naming an unknown file type, is a line-numbered config error.
- [ ] With two servers attached, diagnostics from both appear, and hover goes to the first one that supports it.

**Depends On:** `W261005GWLY-REQ1@R1`, `W261005GWLY-REQ5@R1`

## W261005GWLY-REQ3@R1: Server state visibility

**Requirement ID:** `W261005GWLY-REQ3`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How visible are server state and server messages?

**Answer:** The statusline shows the servers attached to the active buffer: `◌ <name>` while starting, `◌ <name> <title> <percent>%` while `$/progress` reports work, `◆ <name>` when ready, and `✗ <name>` after the final failure. A built-in whose binary is missing is silent and is listed in `:LspInfo`. `window/showMessage` errors and warnings become toasts, and info and log messages go to the debug log only. `:LspInfo` lists every configured server with its state, root, and resolved binary path or `not on PATH`.

**Rationale:** Long indexing (rust-analyzer can take tens of seconds) would otherwise look like a broken `gd`. Opting in to the full table shouldn't cause a toast for every server that isn't installed.

**Acceptance Criteria:**

- [ ] The statusline segment changes from `◌` to `◆` when a server finishes initializing and reports no work in progress.
- [ ] Progress updates repaint the statusline at most once per frame.
- [ ] A `showMessage` of type error or warning shows one toast; info and log types create no toast.
- [ ] `:LspInfo` lists a missing built-in as `not on PATH`.

**Depends On:** `W261005GWLY-REQ2@R1`, `W261005GWLY-REQ12@R1`

## W261005GWLY-REQ4@R1: Full feature set in one PR

**Requirement ID:** `W261005GWLY-REQ4`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which features ship in this work?

**Answer:** Diagnostics, hover, definition, completion, signature help, references, implementation, document symbols, `workspace/didChangeWatchedFiles`, rename, code actions, and formatting, all in one PR.

**Rationale:** The user asked for one work item with the full feature set. Every feature after diagnostics, hover, and definition reuses the same client, and earlier single PRs were of similar size (DI4 #8 added about 22k lines to `src` and `test`).

**Acceptance Criteria:**

- [ ] Each listed feature works against the fake server in tests (REQ15).
- [ ] A feature whose method the attached servers don't support shows `<feature>: not supported by <servers>` instead of failing silently.
- [ ] Changes to files on disk reported by the watcher reach every running server as `workspace/didChangeWatchedFiles` when the server registered for them.

**Depends On:** `W261005GWLY-REQ12@R1`

## W261005GWLY-REQ5@R1: Code file types only

**Requirement ID:** `W261005GWLY-REQ5`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Can servers attach to Markdown notes?

**Answer:** No. `fileTypes` may name any registered code file type but not `markdown`, `base`, or `text`. Config validation rejects them with a line-numbered error. LSP keys bind only in code file types.

**Rationale:** Markdown already owns `gd` and `[[` completion through `so`'s own index, and notes are read in `reading`/`live` views where diagnostics would need new decoration work. Lifting the rule later means removing one validation and adding a view decision.

**Acceptance Criteria:**

- [ ] `fileTypes = ["markdown"]` produces `config.toml:<line>: …` and the server is not used.
- [ ] `gd` in a Markdown buffer still runs `link.followOrTag` with LSP enabled.

**Depends On:** None

## W261005GWLY-REQ6@R1: Diagnostic display

**Requirement ID:** `W261005GWLY-REQ6`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How do diagnostics appear in the source view?

**Answer:** The sign cell shows the line's highest severity (`E`, `W`, `I`, `H`) in a severity colour. The diagnostic range is underlined in the same colour. In normal mode, the command line shows `<severity> <server>: <message>` for the diagnostic under the cursor when no other message is showing. `<C-w>d` opens a float with every diagnostic at the cursor, and `]d`/`[d` move to the next or previous diagnostic in the buffer. While in insert mode the displayed diagnostics don't change; new ones show when you leave insert mode, matching Neovim's default `update_in_insert = false`.

**Rationale:** Uses only existing decoration kinds and the existing sign cell, so wrapping and column maths are unchanged. These are Neovim 0.11's defaults.

```text
  12 E   let x: u32 = "a";          E rust-analyzer: mismatched types
                      ~~~
```

**Acceptance Criteria:**

- [ ] A published error on line 12 shows `E` in line 12's sign cell and underlines its range.
- [ ] With an error and a warning on one line, the sign is `E`.
- [ ] `]d` from before the first diagnostic moves to it; `]d` after the last one wraps to the first, like Neovim.
- [ ] Diagnostics published during insert mode appear only after `<Esc>`.
- [ ] A diagnostic range past the end of its line is clamped to the line, never thrown.

**Depends On:** `W261005GWLY-REQ12@R1`

## W261005GWLY-REQ7@R1: Workspace diagnostics picker

**Requirement ID:** `W261005GWLY-REQ7`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Is there a list of diagnostics across files?

**Answer:** `:Diagnostics` (bound to `<leader>xd`) opens a picker over every diagnostic currently published, including files that aren't open, sorted by severity and then by path and position. `Enter` opens the file at the diagnostic. The explorer is unchanged.

**Rationale:** Servers publish diagnostics for files the user hasn't opened. The picker reuses an existing surface, while explorer markers would change explorer rows and mouse hit-testing.

**Acceptance Criteria:**

- [ ] A diagnostic published for an unopened file appears in `:Diagnostics`, and `Enter` opens that file at its position.
- [ ] An empty publish for a path removes that path's entries.
- [ ] When a server stops, its diagnostics are removed.

**Depends On:** `W261005GWLY-REQ6@R1`

## W261005GWLY-REQ8@R1: Automatic completion

**Requirement ID:** `W261005GWLY-REQ8`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** When does code completion open?

**Answer:** In insert mode in a code buffer, the popup opens when you type one of the server's completion trigger characters, after a 150 ms typing pause on an identifier of at least one character, or with `<C-Space>`. It uses the same keys as link completion: `<C-n>`/`<C-p>` and the arrows move, `Enter`/`Tab` accept, `Esc` closes the popup. Results are filtered and ranked on the client as you keep typing. A new request goes out only when the server marked the list `isIncomplete` or the typed word starts again. Link completion behaviour is unchanged.

**Rationale:** Automatic completion is what most users expect from code editors (VS Code, Helix). Filtering on the client keeps keystrokes off the request path.

**Acceptance Criteria:**

- [ ] Typing `.` after an identifier opens the popup with the server's items.
- [ ] Typing more letters narrows the items without a new request when the list is complete.
- [ ] A response for an older buffer version or cursor position is dropped and doesn't open the popup.
- [ ] `[[` completion in Markdown passes its existing tests unchanged.

**Depends On:** `W261005GWLY-REQ12@R1`, `W261005GWLY-REQ14@R1`

## W261005GWLY-REQ9@R1: Plain-text completion with auto-import edits

**Requirement ID:** `W261005GWLY-REQ9`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How are snippet completions and extra completion edits handled?

**Answer:** The client advertises `snippetSupport: false`, so servers send plain insert text. Accepting an item applies its `textEdit` (or `insertText`, else `label`) and its `additionalTextEdits` (such as an auto-import line) as one undo step. When the server supports `completionItem/resolve`, the client resolves the selected item before applying it, so lazily sent edits are included.

**Rationale:** The most stable choice: nothing to parse, and no hidden placeholder state across edits. Auto-imports, the most useful extra edit, still work, and signature help shows parameters once you type `(`.

**Acceptance Criteria:**

- [ ] Accepting an item with an `additionalTextEdits` import inserts both the item and the import, and one `u` undoes both.
- [ ] The `initialize` request reports `completionItem.snippetSupport: false`.

**Depends On:** `W261005GWLY-REQ8@R1`

## W261005GWLY-REQ10@R1: Server workspace edits

**Requirement ID:** `W261005GWLY-REQ10`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How do rename, code actions, and server-requested edits change files?

**Answer:** `grn` opens the prompt prefilled with the symbol name (using `textDocument/prepareRename` when supported) and sends `textDocument/rename`. `gra` lists code actions at the cursor or selection in a picker. Choosing one resolves it when needed, applies its edit, then sends its command with `workspace/executeCommand`. Edits from these requests and from server `workspace/applyEdit` requests follow one rule: an open buffer gets its edits as one undo step, and a closed file is read, edited, and written atomically on the serial file queue. A versioned document edit whose version doesn't match the open buffer refuses the whole edit. An edit range outside a closed file's current text skips that file. The client advertises no resource operations (create, rename, delete). One toast reports `N files changed`, plus one listing skipped files.

**Rationale:** Reuses the paths link-safe rename already uses: buffer edits for open notes and the serial queue for closed files. Refusing mismatched versions follows the LSP specification and avoids applying edits to text that has changed.

**Acceptance Criteria:**

- [ ] A rename touching one open and one closed file changes both. One `u` restores the open buffer, and the closed file is written atomically.
- [ ] A versioned edit for an older buffer version applies nothing and reports why.
- [ ] A code action with only a command sends `workspace/executeCommand`, and an edit the server then requests through `workspace/applyEdit` is applied and answered `applied: true`.
- [ ] `initialize` reports `workspaceEdit.resourceOperations: []`.

**Depends On:** `W261005GWLY-REQ12@R1`, `W261005GWLY-REQ13@R1`

## W261005GWLY-REQ11@R1: Formatting

**Requirement ID:** `W261005GWLY-REQ11`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does formatting work?

**Answer:** `:Format` formats the active code buffer with `textDocument/formatting`, or `textDocument/rangeFormatting` for a visual selection, as one undo step. `[lsp] formatOnSave` (default `false`) also formats before an explicit `:w`, never before an autosave. Formatting on save waits at most 1000 ms; on timeout or error the buffer is saved unformatted and one warning toast is shown. Formatting options send `tabSize` from `editor.tabWidth` and `insertSpaces` from the buffer's indentation (tabs when an indented line starts with a tab, else spaces).

**Rationale:** Autosave runs about one second after typing stops, so formatting then would rewrite text while you are still editing. Explicit `:w` is the moment users expect formatting. The time limit means a slow server can never block a save.

**Acceptance Criteria:**

- [ ] `:Format` applies the server's edits and one `u` restores the original.
- [ ] With `formatOnSave = true`, `:w` formats then saves; an autosave does not format.
- [ ] A server that never answers delays `:w` by at most 1000 ms, and the file is saved unformatted with a warning.

**Depends On:** `W261005GWLY-REQ10@R1`

## W261005GWLY-REQ12@R1: Server lifecycle and project roots

**Requirement ID:** `W261005GWLY-REQ12`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How are servers started, attached, synced, restarted, and stopped?

**Answer:** A buffer's project root is the nearest ancestor folder containing one of the server's `rootMarkers`, searched from the file's folder up to the workspace root, else the workspace root. One process runs per server and root, started on the first matching buffer, with `processId`, `rootUri`, and one workspace folder. Open listed buffers are synced with `didOpen`, `didChange` (incremental, debounced), `didSave`, and `didClose`. A crash (unexpected exit or transport error) restarts that process once and resends open documents. A second crash marks it unavailable for the session (`✗`) with one toast. `:LspRestart` restarts every server attached to the active buffer and clears its crash count. On exit, `so` sends `shutdown` and `exit` to every server within 500 ms in total, then kills any still running.

**Rationale:** Same model as Neovim 0.11 `root_markers`. The crash rule mirrors the index host's existing restart-once policy (`src/app/index-host.ts:33-103`). The bounded shutdown keeps exit fast and leaves no orphan processes.

**Acceptance Criteria:**

- [ ] Two files under one `Cargo.toml` share one process. Files under two separate `Cargo.toml` folders get two.
- [ ] The fake server receives the buffer's full text in `didOpen` and incremental changes that rebuild the same text.
- [ ] A server that crashes once is restarted and receives `didOpen` again for open buffers. A second crash leaves it `✗` with one toast.
- [ ] Quitting `so` with a server that ignores `shutdown` exits within the lifecycle bound plus 500 ms, and the server process is gone.

**Depends On:** `W261005GWLY-REQ1@R1`, `W261005GWLY-REQ2@R1`

## W261005GWLY-REQ13@R1: Navigation keys and views

**Requirement ID:** `W261005GWLY-REQ13`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** Which keys run LSP features, and how are the results shown?

**Answer:** In code file types, Neovim 0.11's defaults: `K` hover, `gd` definition, `grr` references, `gri` implementation, `gO` document symbols, `grn` rename, `gra` code action, `]d`/`[d`, `<C-w>d`, insert `<C-s>` signature help, plus `<C-Space>` completion and `<leader>xd` diagnostics. They are overridable through the existing `[filetypes.<id>.keys.<mode>]` config. Hover, signature help, and diagnostics open in a float next to the cursor that closes on cursor move, `Esc`, or mode change. Signature help also opens automatically on the server's signature trigger characters (such as `(` and `,`). A single definition or implementation jumps there and records the jump. Several results, references, and symbols open a picker. With no server attached, a key shows `no language server for <file type>`.

**Rationale:** `so`'s vim behaviour follows Neovim 0.11, so its LSP keys do too. Pickers and the jump list already exist.

**Acceptance Criteria:**

- [ ] `gd` on a symbol with one definition in another file opens it at the definition, and `<C-o>` returns.
- [ ] `grr` opens a picker listing every reference with path and line.
- [ ] `K` shows hover text in a float that closes when the cursor moves.
- [ ] `gd` in a code buffer with no server shows `no language server for rust`.
- [ ] A user binding under `[filetypes.rust.keys.normal]` replaces the default.

**Depends On:** `W261005GWLY-REQ5@R1`, `W261005GWLY-REQ12@R1`

## W261005GWLY-REQ14@R1: Responsiveness and stale results

**Requirement ID:** `W261005GWLY-REQ14`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How does LSP work stay out of the typing path, and what happens to results that arrive late?

**Answer:** No LSP request, response, or process event runs inside a keystroke's dispatch beyond turning it into an effect. Document changes are sent at most every 150 ms per buffer (Neovim's default debounce) and right before any request for that buffer. Every request records the buffer version it was made for, and its result is dropped if the buffer has changed since, except for diagnostics, which are kept until the next publish. A newer hover, completion, or signature request cancels the older one with `$/cancelRequest`. User-triggered requests time out after 5 s with a message. `sourceKeystrokeP95` keeps its 16 ms target with a server attached.

**Rationale:** The editor's single-threaded store must stay responsive. Version-checked results guarantee nothing lands on text that has changed.

**Acceptance Criteria:**

- [ ] The source keystroke benchmark with the fake server attached and publishing diagnostics meets its target.
- [ ] A hover result for an older buffer version opens no float.
- [ ] Ten keys typed within 150 ms produce one `didChange`, sent before any following request.

**Depends On:** `W261005GWLY-REQ12@R1`

## W261005GWLY-REQ15@R1: Verification without real servers

**Requirement ID:** `W261005GWLY-REQ15`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

**Revision Summary:** None — initial revision

**Question:** How is the client tested when CI has no language servers?

**Answer:** A scripted fake language server in `test/fixtures` speaks LSP over stdio and answers from a per-test script. Unit, integration, and PTY end-to-end tests use it, so CI needs no real server. One local-only smoke test against `rust-analyzer` runs when that binary is on `PATH` and is skipped otherwise.

**Rationale:** Deterministic tests on both CI runners. A real-server smoke test checks that the protocol details match a real implementation.

**Acceptance Criteria:**

- [ ] `bun run check` and `bun run test:ci` pass on a machine with no language server installed.
- [ ] The fake server records every message it receives, so tests can assert sync and lifecycle.
- [ ] Every test that starts a server process stops it, leaving no child processes behind.

**Depends On:** None

# 6. Research Impact Review

None — research was skipped

# 7. Historical Requirement Revisions

None — no requirement has been revised or replaced
