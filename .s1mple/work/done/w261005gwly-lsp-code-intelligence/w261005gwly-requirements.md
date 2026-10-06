# W261005GWLY: lsp-code-intelligence — Requirements

**Document Status:** Ready for System Design

**Context Source:** `w261005gwly-discuss-context.md`

**Research Source:** `w261005gwly-research.md`

**Unresolved Items:** None

**Ready for System Design Checklist:**

- [x] Every active topic is covered.
- [x] Every current requirement has a stable, unique ID and exact current revision.
- [x] Every current requirement includes its question, answer, rationale, acceptance criteria, and dependencies.
- [x] Scope, constraints, assumptions, risks, and compatibility boundaries are explicit.
- [x] For roadmap-linked work, the accepted parent baseline has been checked, assigned scope is covered by current requirements, and gates due before requirements approval have evidence; unresolved parent impacts prevent readiness. (Not applicable — standalone work.)
- [x] Revised and replaced requirements preserve append-only lineage and complete prior revisions.
- [x] When research exists, every RF-to-evaluated-revision relationship has one reconciliation outcome; a finding that evaluated no requirement has one `None` relationship row.
- [x] Deferred decisions are outside the current-requirements ledger.
- [x] `Unresolved Items` is `None`.

**Approval:** REQ1–REQ8 were chosen by the user on 2026-10-05. REQ9–REQ15@R1 were decided by the agent under the self-drive authority the user delegated for the rest of this discussion on 2026-10-05. The research impact outcomes and the resulting revisions (REQ1, REQ2, REQ3, REQ6, REQ7, REQ9, REQ10, REQ12, and REQ14 at R2; clarifications to REQ4, REQ11, and REQ13) were chosen by the user on 2026-10-05.

# Table of Contents

1. [Problem and Desired Outcome](#1-problem-and-desired-outcome)
2. [Current and Expected State](#2-current-and-expected-state)
3. [Scope](#3-scope)
4. [Standards and Constraints](#4-standards-and-constraints)
5. [Current Requirements](#5-current-requirements)
   - [W261005GWLY-REQ1@R2: Opt-in, XDG-only server definitions](#w261005gwly-req1r2-opt-in-xdg-only-server-definitions)
   - [W261005GWLY-REQ2@R2: Small built-in table, stackable servers](#w261005gwly-req2r2-small-built-in-table-stackable-servers)
   - [W261005GWLY-REQ3@R2: Server state visibility](#w261005gwly-req3r2-server-state-visibility)
   - [W261005GWLY-REQ4@R1: Full feature set in one PR](#w261005gwly-req4r1-full-feature-set-in-one-pr)
   - [W261005GWLY-REQ5@R1: Code file types only](#w261005gwly-req5r1-code-file-types-only)
   - [W261005GWLY-REQ6@R2: Diagnostic display](#w261005gwly-req6r2-diagnostic-display)
   - [W261005GWLY-REQ7@R2: Workspace diagnostics picker](#w261005gwly-req7r2-workspace-diagnostics-picker)
   - [W261005GWLY-REQ8@R1: Automatic completion](#w261005gwly-req8r1-automatic-completion)
   - [W261005GWLY-REQ9@R2: Plain-text completion with auto-import edits](#w261005gwly-req9r2-plain-text-completion-with-auto-import-edits)
   - [W261005GWLY-REQ10@R2: Server workspace edits](#w261005gwly-req10r2-server-workspace-edits)
   - [W261005GWLY-REQ11@R1: Formatting](#w261005gwly-req11r1-formatting)
   - [W261005GWLY-REQ12@R2: Server lifecycle and project roots](#w261005gwly-req12r2-server-lifecycle-and-project-roots)
   - [W261005GWLY-REQ13@R1: Navigation keys and views](#w261005gwly-req13r1-navigation-keys-and-views)
   - [W261005GWLY-REQ14@R2: Responsiveness and stale results](#w261005gwly-req14r2-responsiveness-and-stale-results)
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
[lsp] enabled = true → open foo.rs → root (topmost Cargo.toml) → rust-analyzer (one per server and root)
   edits → didChange (debounced) → publishDiagnostics or diagnostic pull → signs, underlines, cursor message, :Diagnostics
   K · gd · grr · gri · gO · grn · gra · <C-s> · completion · :Format → request → result (stale → dropped)
statusline: ◌ rust-analyzer indexing 42% → ◆ rust-analyzer
```

Servers start only when the user opts in. Requests never block typing, and every feature degrades to a short message when no server is attached.

# 3. Scope

## In Scope

- The opt-in `[lsp]` config section, a seven-server built-in table (TypeScript 7 and TypeScript 6 servers chosen by project version), and user overrides and additions (REQ1, REQ2).
- Server lifecycle: project roots, document sync, crash handling, `:LspRestart`, `:LspInfo`, and shutdown on exit (REQ12).
- Server state in the statusline and server messages as toasts or log lines (REQ3).
- Diagnostics in the source view, pushed or pulled per document, and a workspace diagnostics picker (REQ6, REQ7, REQ14).
- Hover, definition, references, implementation, document symbols, and signature help (REQ4, REQ13).
- Completion with auto-import edits, and snippets flattened to plain text for servers that need snippet support (REQ8, REQ9).
- Rename, code actions, server-initiated edits, and formatting (REQ10, REQ11).
- `workspace/didChangeWatchedFiles` from the existing watcher (REQ4).
- Tests that need no real language server, and a keystroke benchmark with a server attached (REQ14, REQ15).

## Out of Scope

- Semantic tokens, inlay hints, tree-sitter, and debugging (DAP) — excluded by the user on 2026-10-05.
- Language servers on Markdown and `.base` files, including diagnostics in `live`/`reading` views (REQ5). Future trigger: a request for prose linting in notes.
- Snippet tabstop navigation and placeholder editing; snippets are only flattened to plain text, and only for servers with `snippets = true` (REQ9). Future trigger: a request for snippet completion.
- Workspace edits that create, rename, or delete files (`resourceOperations`) (REQ10). Future trigger: a server feature the user needs that depends on them.
- Server configuration from any file inside the workspace (REQ1).
- Installing or downloading language servers; binaries must already be on `PATH`, or in the project's `node_modules/.bin` for the `tsc`, `typescript`, and `json` built-ins.
- Workspace-wide pull diagnostics (`workspace/diagnostic`). Few servers implement it (RF6). Future trigger: a built-in server that reports unopened files only that way.
- Neovim 0.12 additions `grt` (type definition), `grx` (code lens), and `]D`/`[D`. `so` follows Neovim 0.11 (RF13). Future trigger: the project moves its vim baseline to Neovim 0.12.
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

- Server definitions come only from the XDG `config.toml` and the built-in table, never from a workspace file. The `tsc`, `typescript`, and `json` built-ins may run the project's own binary from `node_modules/.bin`.
- Server processes are the first external programs `so` starts from configuration. Some run project code, which is why startup is opt-in.
- CI has no language servers installed.
- `sourceKeystrokeP95` target is 16 ms (`project.md` Benchmarks).
- No dependency on the TypeScript compiler API.

## Accepted Assumptions

- `vscode-jsonrpc` `9.0.3` and `vscode-languageserver-protocol` `3.18.4` work under Bun `1.4.2` from source and in a compiled binary. A spike on 2026-10-05 confirmed this against rust-analyzer 1.96.0 (see the discussion context).
- Users install the server binaries themselves, on `PATH` or as project dependencies in `node_modules/.bin`.
- One `so` process opens one workspace folder, and every project root lies inside it.

## Dependencies

- `vscode-jsonrpc` `9.0.3` — JSON-RPC framing and request handling over stdio.
- `vscode-languageserver-protocol` `3.18.4` — protocol types (type-only use).
- Existing completion popup, pickers, prompt overlay, toasts, statusline, and `applyEdits` — the surfaces LSP results reuse.
- Existing watcher events — the source of `didChangeWatchedFiles`.

## Risks and Compatibility

- **Untrusted folders** — some servers run project code, and the TypeScript and JSON built-ins may run the project's own binaries. Protection: opt-in startup and XDG-only server definitions (REQ1).
- **Large responses on the main thread** — big completion lists or diagnostics could stall frames. Protection: client-side filtering, debounced sync, and a benchmark with a server attached (REQ14).
- **Edits to closed files** — rename and code actions can write files that aren't open. Protection: the serial queue, atomic writes, refusal on out-of-range edits, and a summary toast (REQ10).
- **Orphan processes** — a crash of `so` could leave servers running. Protection: `processId` in `initialize`, bounded shutdown, and kill on exit (REQ12).
- **Existing behaviour** — Markdown `gd`, `[[` completion, and every existing view stay unchanged (REQ5, REQ8).
- **Config compatibility** — `[lsp]` is a new optional section. Existing config files stay valid, and with no `[lsp]` section no server ever starts.

# 5. Current Requirements

## W261005GWLY-REQ1@R2: Opt-in, XDG-only server definitions

**Requirement ID:** `W261005GWLY-REQ1`

**Revision:** `R2`

**Previous Revision:** `W261005GWLY-REQ1@R1`

**Replaces:** None

**Research Relationship:** `RF1` informed this revision. It evaluated `W261005GWLY-REQ2@R1` and `W261005GWLY-REQ6@R1`, not a revision of this requirement.

**Revision Summary:** The `tsc`, `typescript`, and `json` built-ins now look for their binary in the project's `node_modules/.bin` before `PATH`, so a project's own TypeScript serves it (RF1). Server definitions and settings still come only from the built-in table and the XDG config.

**Question:** When do language servers start, and where does their configuration come from?

**Answer:** Servers start only when the user sets `[lsp] enabled = true` in the XDG `config.toml` (default `false`). Server definitions (command, file types, root markers, settings) come only from the built-in table and that file, never from any file inside the workspace. The `tsc`, `typescript`, and `json` built-ins resolve their binary from `<root>/node_modules/.bin` first, then from `PATH`.

**Rationale:** Some servers run project code (rust-analyzer build scripts and proc macros, `gopls` running `go list`). Opt-in keeps `so`'s current rule that opening a folder runs nothing, and costs one config line. Running the project's own `tsc` is project code of the same kind the opt-in already covers. No workspace file can change which command runs or with which arguments. nvim-lspconfig resolves the same three servers from `node_modules/.bin` first.

```toml
[lsp]
enabled = true
```

**Acceptance Criteria:**

- [ ] With no `[lsp]` section, or `enabled = false`, opening any file starts no process.
- [ ] With `enabled = true`, opening a matching code file starts its server.
- [ ] No code path reads server definitions or settings from a workspace file. The only workspace lookup is the binary of the `tsc`, `typescript`, and `json` built-ins in `<root>/node_modules/.bin`.
- [ ] With `<root>/node_modules/.bin/tsc` present, the `tsc` built-in runs that binary, not the one on `PATH`.
- [ ] `:ConfigReload` that turns `enabled` off stops running servers. Turning it on starts servers for buffers already open.

**Depends On:** None

## W261005GWLY-REQ2@R2: Small built-in table, stackable servers

**Requirement ID:** `W261005GWLY-REQ2`

**Revision:** `R2`

**Previous Revision:** `W261005GWLY-REQ2@R1`

**Replaces:** None

**Research Relationship:** `RF1`, `RF3`, `RF4`, `RF6`, and `RF7` evaluated `W261005GWLY-REQ2@R1` and informed this revision.

**Revision Summary:** A `tsc` built-in serves TypeScript 7 projects and `typescript-language-server` serves TypeScript 6 and older, chosen by the project's `tsc --version` (RF1, RF6). Settings delivery is specified (RF3). `rootMarkers` order means priority, and a `rootSearch` field is added (RF4). A `snippets` field is added, on for the `json` built-in (RF7). The `json` built-in sends `provideFormatter` (RF3).

**Question:** How does the built-in server table work, and can one file type use more than one server?

**Answer:** `so` has seven built-in servers, in this order: `tsc` (`tsc --lsp --stdio`), `typescript` (`typescript-language-server --stdio`), `pyright` (`pyright-langserver --stdio`), `gopls`, `rust-analyzer`, `clangd`, and `json` (`vscode-json-language-server --stdio` with `initOptions = { provideFormatter = true }` and `snippets = true`). For a TypeScript or JavaScript root, `so` runs the resolved `tsc --version` once per root. Major version 7 or later attaches `tsc`; an older or missing `tsc` attaches `typescript`. The two never attach to the same root.

`[lsp.servers.<name>]` can turn a built-in off (`enabled = false`), override its fields (`command`, `fileTypes`, `rootMarkers`, `rootSearch`, `settings`, `initOptions`, `snippets`), or add a new server, which must then give `command` and `fileTypes`. `rootMarkers` is ordered by priority, and an entry that is itself a list holds markers of equal priority. `rootSearch` is `nearest` (default) or `topmost` (REQ12).

Settings reach a server two ways. The client answers `workspace/configuration` by looking up each requested section as a dotted path in `settings`, and sends `settings` once with `workspace/didChangeConfiguration` after `initialized`. The `rust-analyzer` built-in sends `settings["rust-analyzer"]` as its initialization options when `initOptions` is not set.

Every enabled server whose `fileTypes` match the buffer and whose binary resolves attaches. Diagnostics from every attached server are merged, and each is labelled with its server. Each request goes to the first attached server that supports the method, in table order: built-ins first in the order listed above, then added servers in config order.

**Rationale:** Seven servers cover the languages most users edit while keeping the table small enough to maintain. TypeScript 7 removed `tsserver` and ships its own server, so TypeScript 6 and TypeScript 7 projects need different servers. The version check follows nvim-lspconfig's `tsc` config (RF1). The settings rules match how each server reads settings: pyright and gopls ask through `workspace/configuration`, while rust-analyzer reads initialization options (RF3). Several servers per file type support the usual main-server-plus-linter setup (ts + eslint, python + ruff). Both Neovim and Helix allow this.

```toml
[lsp.servers.rust-analyzer]
settings = { "rust-analyzer" = { check = { command = "clippy" } } }

[lsp.servers.pyright]
enabled = false

[lsp.servers.eslint]
command = ["vscode-eslint-language-server", "--stdio"]
fileTypes = ["typescript", "javascript"]
rootMarkers = [["eslint.config.js", "eslint.config.mjs"], "package.json"]
```

**Acceptance Criteria:**

- [ ] Each built-in starts with its listed command for its file types when its binary resolves.
- [ ] In a root whose `tsc --version` reports 7.x, `tsc --lsp --stdio` attaches and `typescript-language-server` does not. With TypeScript 6 the reverse holds.
- [ ] A built-in whose binary is missing starts nothing and causes no error.
- [ ] `enabled = false` on a built-in stops it from attaching. An override replaces only the fields it sets.
- [ ] An added server without `command` or `fileTypes`, or naming an unknown file type, is a line-numbered config error.
- [ ] A `workspace/configuration` request for section `python.analysis` receives `settings.python.analysis`. rust-analyzer's `initialize` carries `settings["rust-analyzer"]` as its initialization options.
- [ ] With two servers attached, diagnostics from both appear, and hover goes to the first one that supports it.

**Depends On:** `W261005GWLY-REQ1@R2`, `W261005GWLY-REQ5@R1`

## W261005GWLY-REQ3@R2: Server state visibility

**Requirement ID:** `W261005GWLY-REQ3`

**Revision:** `R2`

**Previous Revision:** `W261005GWLY-REQ3@R1`

**Replaces:** None

**Research Relationship:** `RF2` evaluated `W261005GWLY-REQ3@R1` and informed this revision.

**Revision Summary:** A server that exits before `initialize` completes is shown as `unavailable` in `:LspInfo`, with no toast and no statusline segment, instead of going through crash handling (RF2).

**Question:** How visible are server state and server messages?

**Answer:** The statusline shows the servers attached to the active buffer: `◌ <name>` while starting, `◌ <name> <title> <percent>%` while `$/progress` reports work, `◆ <name>` when ready, and `✗ <name>` after the final failure. A built-in whose binary is missing is silent and is listed in `:LspInfo`. A server that exits before `initialize` completes is treated the same way: no toast, no statusline segment, and `:LspInfo` shows `unavailable` with the first line of its error output. An example is rustup's `rust-analyzer` proxy when the component isn't installed. `window/showMessage` errors and warnings become toasts, and info and log messages go to the debug log only. `:LspInfo` lists every configured server with its state, root, and resolved binary path or `not on PATH`.

**Rationale:** Long indexing (rust-analyzer can take tens of seconds) would otherwise look like a broken `gd`. Opting in to the full table shouldn't cause a toast for every server that isn't installed. A binary that is on `PATH` but can't run is the same situation as a missing one.

**Acceptance Criteria:**

- [ ] The statusline segment changes from `◌` to `◆` when a server finishes initializing and reports no work in progress.
- [ ] Progress updates repaint the statusline at most once per frame.
- [ ] A `showMessage` of type error or warning shows one toast; info and log types create no toast.
- [ ] `:LspInfo` lists a missing built-in as `not on PATH`.
- [ ] A fake server that exits before answering `initialize` creates no toast and no statusline segment. `:LspInfo` shows it as `unavailable` with its first line of error output.

**Depends On:** `W261005GWLY-REQ2@R2`, `W261005GWLY-REQ12@R2`

## W261005GWLY-REQ4@R1: Full feature set in one PR

**Requirement ID:** `W261005GWLY-REQ4`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF5` and `RF10` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** Which features ship in this work?

**Answer:** Diagnostics, hover, definition, completion, signature help, references, implementation, document symbols, `workspace/didChangeWatchedFiles`, rename, code actions, and formatting, all in one PR.

**Rationale:** The user asked for one work item with the full feature set. Every feature after diagnostics, hover, and definition reuses the same client, and earlier single PRs were of similar size (DI4 #8 added about 22k lines to `src` and `test`).

**Acceptance Criteria:**

- [ ] Each listed feature works against the fake server in tests (REQ15).
- [ ] A feature whose method the attached servers don't support shows `<feature>: not supported by <servers>` instead of failing silently.
- [ ] Changes to files on disk reported by the watcher reach every running server as `workspace/didChangeWatchedFiles` when the server registered for them. Paths the watcher excludes (dot paths, `node_modules`, and gitignored paths) are not reported.

**Depends On:** `W261005GWLY-REQ12@R2`

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

## W261005GWLY-REQ6@R2: Diagnostic display

**Requirement ID:** `W261005GWLY-REQ6`

**Revision:** `R2`

**Previous Revision:** `W261005GWLY-REQ6@R1`

**Replaces:** None

**Research Relationship:** `RF1` and `RF6` evaluated `W261005GWLY-REQ6@R1` and informed this revision. `RF13` evaluated it and supports the unchanged display rules.

**Revision Summary:** Diagnostics also come from `textDocument/diagnostic` pull requests for servers that offer them, because the TypeScript 7 server sends per-file diagnostics only that way (RF1, RF6).

**Question:** How do diagnostics appear in the source view?

**Answer:** Diagnostics come from `textDocument/publishDiagnostics` and, for servers that declare a `diagnosticProvider`, from `textDocument/diagnostic` pull requests (REQ14 says when they are sent). Both kinds are shown the same way.

The sign cell shows the line's highest severity (`E`, `W`, `I`, `H`) in a severity colour. The diagnostic range is underlined in the same colour. In normal mode, the command line shows `<severity> <server>: <message>` for the diagnostic under the cursor when no other message is showing. `<C-w>d` opens a float with every diagnostic at the cursor, and `]d`/`[d` move to the next or previous diagnostic in the buffer. While in insert mode the displayed diagnostics don't change; new ones show when you leave insert mode, matching Neovim's default `update_in_insert = false`.

**Rationale:** Uses only existing decoration kinds and the existing sign cell, so wrapping and column maths are unchanged. These are Neovim's defaults. Neovim and Helix both support pull diagnostics, and without them the TypeScript 7 server would show no type errors.

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
- [ ] A server that offers only pull diagnostics shows its errors for an open file after the file opens and after each change.

**Depends On:** `W261005GWLY-REQ12@R2`, `W261005GWLY-REQ14@R2`

## W261005GWLY-REQ7@R2: Workspace diagnostics picker

**Requirement ID:** `W261005GWLY-REQ7`

**Revision:** `R2`

**Previous Revision:** `W261005GWLY-REQ7@R1`

**Replaces:** None

**Research Relationship:** `RF6` evaluated `W261005GWLY-REQ7@R1` and informed this revision.

**Revision Summary:** Diagnostics for files that aren't open come only from servers that push them. Pulled diagnostics cover open files and are removed when the file closes (RF6).

**Question:** Is there a list of diagnostics across files?

**Answer:** `:Diagnostics` (bound to `<leader>xd`) opens a picker over every diagnostic currently held, sorted by severity and then by path and position. `Enter` opens the file at the diagnostic. Diagnostics for files that aren't open appear when a server pushes them. Pulled diagnostics cover open files only, because the client doesn't send `workspace/diagnostic`, and they are removed when their file closes. The explorer is unchanged.

**Rationale:** Push servers publish diagnostics for files the user hasn't opened. Few servers implement workspace-wide pull (rust-analyzer, gopls, and the JSON server declare it off), so it is out of scope. The picker reuses an existing surface, while explorer markers would change explorer rows and mouse hit-testing.

**Acceptance Criteria:**

- [ ] A diagnostic pushed for an unopened file appears in `:Diagnostics`, and `Enter` opens that file at its position.
- [ ] An empty publish for a path removes that path's entries.
- [ ] When a server stops, its diagnostics are removed.
- [ ] Closing a file removes its pulled diagnostics. Pushed diagnostics stay until the server replaces them.

**Depends On:** `W261005GWLY-REQ6@R2`

## W261005GWLY-REQ8@R1: Automatic completion

**Requirement ID:** `W261005GWLY-REQ8`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF7` and `RF8` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** When does code completion open?

**Answer:** In insert mode in a code buffer, the popup opens when you type one of the server's completion trigger characters, after a 150 ms typing pause on an identifier of at least one character, or with `<C-Space>`. It uses the same keys as link completion: `<C-n>`/`<C-p>` and the arrows move, `Enter`/`Tab` accept, `Esc` closes the popup. Results are filtered and ranked on the client as you keep typing. A new request goes out only when the server marked the list `isIncomplete` or the typed word starts again. Link completion behaviour is unchanged.

**Rationale:** Automatic completion is what most users expect from code editors (VS Code, Helix). Filtering on the client keeps keystrokes off the request path.

**Acceptance Criteria:**

- [ ] Typing `.` after an identifier opens the popup with the server's items.
- [ ] Typing more letters narrows the items without a new request when the list is complete.
- [ ] A response for an older buffer version or cursor position is dropped and doesn't open the popup.
- [ ] `[[` completion in Markdown passes its existing tests unchanged.

**Depends On:** `W261005GWLY-REQ12@R2`, `W261005GWLY-REQ14@R2`

## W261005GWLY-REQ9@R2: Plain-text completion with auto-import edits

**Requirement ID:** `W261005GWLY-REQ9`

**Revision:** `R2`

**Previous Revision:** `W261005GWLY-REQ9@R1`

**Replaces:** None

**Research Relationship:** `RF7` evaluated `W261005GWLY-REQ9@R1` and informed this revision. `RF8` informed the resolve bound through `W261005GWLY-REQ14@R2`.

**Revision Summary:** Servers with `snippets = true` (by default only `json`, which offers no completion without snippets) get snippet support, and their snippets are inserted as plain text. An item's `command` runs after its edits. The resolvable properties are named, and resolve waits at most 500 ms (RF7, RF8).

**Question:** How are snippet completions and extra completion edits handled?

**Answer:** The client advertises `snippetSupport: false` to every server except those with `snippets = true`. By default that is only the `json` built-in. For those servers, a snippet is inserted as plain text:

- tabstops are removed;
- placeholders keep their default text;
- choices keep their first option;
- variables become their default text or nothing;
- the cursor lands at `$0`, else at the end.

Accepting an item applies its `textEdit` (or `insertText`, else `label`) and its `additionalTextEdits` (such as an auto-import line) as one undo step. Then the item's `command`, if any, is sent with `workspace/executeCommand`. Edits that the command causes arrive through `workspace/applyEdit` (REQ10).

When the server supports `completionItem/resolve`, the client resolves the selected item before applying it, waiting at most 500 ms (REQ14). The client advertises `additionalTextEdits`, `detail`, and `documentation` as properties a server may send lazily.

**Rationale:** Plain text stays the most stable choice: there is no placeholder state across edits. Auto-imports, the most useful extra edit, still work, and signature help shows parameters once you type `(`. The JSON server registers no completion at all without snippet support, so flattening its snippets keeps schema completion (`package.json`, `tsconfig.json`) without a snippet engine. typescript-language-server sends auto-imports for other files as an item `command`, which Neovim also runs after accepting.

```text
JSON item  insertText "\"name\": \"$1\""  →  inserts  "name": "|"   (cursor at |)
```

**Acceptance Criteria:**

- [ ] Accepting an item with an `additionalTextEdits` import inserts both the item and the import, and one `u` undoes both.
- [ ] The `initialize` request reports `completionItem.snippetSupport: false` for servers without `snippets = true`, and `true` for the `json` built-in.
- [ ] In a JSON buffer, accepting the snippet item `"name": "$1"` inserts `"name": ""` with the cursor between the quotes.
- [ ] Accepting an item with a `command` sends `workspace/executeCommand` after its edits are applied.

**Depends On:** `W261005GWLY-REQ8@R1`, `W261005GWLY-REQ10@R2`, `W261005GWLY-REQ14@R2`

## W261005GWLY-REQ10@R2: Server workspace edits

**Requirement ID:** `W261005GWLY-REQ10`

**Revision:** `R2`

**Previous Revision:** `W261005GWLY-REQ10@R1`

**Replaces:** None

**Research Relationship:** `RF9` and `RF10` evaluated `W261005GWLY-REQ10@R1` and informed this revision.

**Revision Summary:** The client advertises lazy code-action edits, so one action that needs a file operation fails alone instead of failing the whole list (RF9). `workspace/applyEdit` replies report partial failure. No `failureHandling` or change-annotation support is advertised (RF9). Closed files that an LSP edit writes are reported to servers, because the watcher ignores `so`'s own writes (RF10).

**Question:** How do rename, code actions, and server-requested edits change files?

**Answer:** `grn` opens the prompt prefilled with the symbol name (using `textDocument/prepareRename` when supported) and sends `textDocument/rename`. `gra` lists code actions at the cursor or selection in a picker. The client advertises code-action `resolveSupport` for `edit`, so servers may list actions without their edits. Choosing an action resolves it when its edit is missing, applies its edit, then sends its command with `workspace/executeCommand`. If resolving fails, the server's message is shown and the other actions still work. For example, a rust-analyzer action that must create a file fails this way.

Edits from these requests and from server `workspace/applyEdit` requests follow one rule. An open buffer gets its edits as one undo step. A closed file is read, edited, and written atomically on the serial file queue. A versioned document edit whose version doesn't match the open buffer refuses the whole edit. An edit range outside a closed file's current text skips that file.

The client advertises no resource operations (create, rename, delete), no `failureHandling`, and no change-annotation support. A `workspace/applyEdit` reply is `applied: true` only when every file changed. Otherwise it is `applied: false`, with a `failureReason` naming the refused or skipped files. Each closed file an edit writes is reported to running servers through the same `workspace/didChangeWatchedFiles` path as watcher events (REQ4). One toast reports `N files changed`, plus one listing skipped files.

**Rationale:** Reuses the paths link-safe rename already uses: buffer edits for open notes and the serial queue for closed files. Refusing mismatched versions follows the LSP specification and Helix, and avoids applying edits to text that has changed. With no resource operations and no lazy edits, rust-analyzer fails the whole code-action request when any listed action creates a file. Lazy edits confine the failure to that one action. The workspace watcher drops `so`'s own writes, so without the explicit report a server would keep the old contents of files a rename changed.

**Acceptance Criteria:**

- [ ] A rename touching one open and one closed file changes both. One `u` restores the open buffer, and the closed file is written atomically.
- [ ] A versioned edit for an older buffer version applies nothing and reports why.
- [ ] A code action with only a command sends `workspace/executeCommand`, and an edit the server then requests through `workspace/applyEdit` is applied and answered `applied: true`.
- [ ] An `applyEdit` that skips a file is answered `applied: false` with a `failureReason`.
- [ ] `initialize` reports `workspaceEdit.resourceOperations: []` and code-action `resolveSupport.properties` containing `edit`.
- [ ] After a rename writes closed `b.ts`, a server that registered a watcher matching `b.ts` receives `workspace/didChangeWatchedFiles` with it as changed.

**Depends On:** `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ12@R2`, `W261005GWLY-REQ13@R1`

## W261005GWLY-REQ11@R1: Formatting

**Requirement ID:** `W261005GWLY-REQ11`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF3` and `RF11` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** How does formatting work?

**Answer:** `:Format` formats the active code buffer with `textDocument/formatting`, or `textDocument/rangeFormatting` for a visual selection, as one undo step. `[lsp] formatOnSave` (default `false`) also formats before an explicit `:w`, never before an autosave. Formatting on save waits at most 1000 ms; on timeout or error the buffer is saved unformatted and one warning toast is shown. Formatting options send `tabSize` from `editor.tabWidth` and `insertSpaces` from the buffer's indentation (tabs when an indented line starts with a tab, else spaces). `textDocument/willSaveWaitUntil` is not sent. Range formatting on a server without it, such as gopls, shows REQ4's not-supported message.

**Rationale:** Autosave runs about one second after typing stops, so formatting then would rewrite text while you are still editing. Explicit `:w` is the moment users expect formatting. The time limit means a slow server can never block a save.

**Acceptance Criteria:**

- [ ] `:Format` applies the server's edits and one `u` restores the original.
- [ ] With `formatOnSave = true`, `:w` formats then saves; an autosave does not format.
- [ ] A server that never answers delays `:w` by at most 1000 ms, and the file is saved unformatted with a warning.

**Depends On:** `W261005GWLY-REQ10@R2`

## W261005GWLY-REQ12@R2: Server lifecycle and project roots

**Requirement ID:** `W261005GWLY-REQ12`

**Revision:** `R2`

**Previous Revision:** `W261005GWLY-REQ12@R1`

**Replaces:** None

**Research Relationship:** `RF2`, `RF4`, and `RF12` evaluated `W261005GWLY-REQ12@R1` and informed this revision. `RF14` evaluated it and supports the unchanged sync rules.

**Revision Summary:**

- Roots use ordered markers with a per-server `nearest` or `topmost` search, so one Cargo workspace gets one rust-analyzer and `go.work` wins over `go.mod`. A file with no marker runs without a workspace folder (RF4).
- Crashes restart until the fifth crash within 3 minutes (RF12).
- An exit before `initialize` completes is not a crash (RF2).
- Shutdown sends `exit` after the `shutdown` reply or when the bound runs short (RF12).

**Question:** How are servers started, attached, synced, restarted, and stopped?

**Answer:** A buffer's project root comes from the server's ordered `rootMarkers`, searched from the file's folder up to the workspace root and never above it:

- **`rootSearch = "nearest"` (the default):** markers are tried in priority order, and the first one found in any ancestor wins at its nearest ancestor. Markers grouped in one list have equal priority.
- **`rootSearch = "topmost"`:** the highest ancestor inside the workspace that contains any marker wins.

The `gopls` built-in puts `go.work` before `go.mod`. The `rust-analyzer` built-in uses `topmost` with `Cargo.toml`. A file with no marker gets no project root. Its server runs without a workspace folder (`rootUri` null), and all of that server's marker-less files share one process.

One process runs per server and root, started on the first matching buffer, with `processId`, `rootUri`, and one workspace folder when a root exists. Open listed buffers are synced with `didOpen`, `didChange` (incremental, debounced), `didSave`, and `didClose`.

A crash is an unexpected exit or transport error after `initialize` completed. A crash restarts that process and resends open documents. The fifth crash within 3 minutes marks it unavailable for the session (`✗`) with one toast. An exit before `initialize` completes is not a crash (REQ3). `:LspRestart` restarts every server attached to the active buffer and clears its crash history.

On exit, `so` sends `shutdown` to every server. It sends `exit` when the reply arrives or when the bound is about to run out, and kills any server still running after 500 ms in total.

**Rationale:** Ordered markers are Neovim's `root_markers` rule. Searching for the topmost `Cargo.toml` matches Helix and gives one rust-analyzer per Cargo workspace without running `cargo metadata`. "Nearest of any marker" would start one rust-analyzer per member crate and ignore `go.work`. Starting marker-less files without a workspace folder matches Neovim and keeps a stray `.py` in a notes vault from indexing the whole vault. The restart window is the `vscode-languageclient` default and follows the specification's guidance, so an occasional crash in a long session doesn't disable a server. The bounded shutdown follows Helix's send-then-kill pattern and leaves no orphan processes.

```text
repo/Cargo.toml  [workspace] members = ["a", "b"]
repo/a/src/lib.rs, repo/b/src/lib.rs  →  one rust-analyzer, root repo
```

**Acceptance Criteria:**

- [ ] In a Cargo workspace with members `a` and `b`, files in both share one rust-analyzer rooted at the workspace. Two separate, non-nested Cargo projects get two.
- [ ] A Go file in a module under a `go.work` folder uses the `go.work` folder as its root.
- [ ] A `.py` file with no marker up to the workspace root starts pyright without a workspace folder.
- [ ] The fake server receives the buffer's full text in `didOpen` and incremental changes that rebuild the same text.
- [ ] A crashed server is restarted and receives `didOpen` again for open buffers. The fifth crash within 3 minutes leaves it `✗` with one toast. Crashes spread over more than 3 minutes keep restarting it.
- [ ] Quitting `so` with a server that ignores `shutdown` exits within the lifecycle bound plus 500 ms, and the server process is gone.

**Depends On:** `W261005GWLY-REQ1@R2`, `W261005GWLY-REQ2@R2`

## W261005GWLY-REQ13@R1: Navigation keys and views

**Requirement ID:** `W261005GWLY-REQ13`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF9` and `RF13` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** Which keys run LSP features, and how are the results shown?

**Answer:** In code file types, Neovim 0.11's default LSP keys and the common `gd` convention: `K` hover, `gd` definition, `grr` references, `gri` implementation, `gO` document symbols, `grn` rename, `gra` code action, `]d`/`[d`, `<C-w>d`, insert `<C-s>` signature help, plus `<C-Space>` completion and `<leader>xd` diagnostics. They are overridable through the existing `[filetypes.<id>.keys.<mode>]` config. Hover, signature help, and diagnostics open in a float next to the cursor that closes on cursor move, `Esc`, or mode change. Signature help also opens automatically on the server's signature trigger characters (such as `(` and `,`). A single definition or implementation jumps there and records the jump. Several results, references, and symbols open a picker. With no server attached, a key shows `no language server for <file type>`.

**Rationale:** `so`'s vim behaviour follows Neovim 0.11, so its LSP keys do too. `gd` is not a Neovim default (Neovim reaches definition through `CTRL-]` and `'tagfunc'`), but it is the usual mapping in Neovim configs, and `so` already uses `gd` to follow links in Markdown. Pickers and the jump list already exist.

**Acceptance Criteria:**

- [ ] `gd` on a symbol with one definition in another file opens it at the definition, and `<C-o>` returns.
- [ ] `grr` opens a picker listing every reference with path and line.
- [ ] `K` shows hover text in a float that closes when the cursor moves.
- [ ] `gd` in a code buffer with no server shows `no language server for rust`.
- [ ] A user binding under `[filetypes.rust.keys.normal]` replaces the default.

**Depends On:** `W261005GWLY-REQ5@R1`, `W261005GWLY-REQ12@R2`

## W261005GWLY-REQ14@R2: Responsiveness and stale results

**Requirement ID:** `W261005GWLY-REQ14`

**Revision:** `R2`

**Previous Revision:** `W261005GWLY-REQ14@R1`

**Replaces:** None

**Research Relationship:** `RF6`, `RF8`, and `RF14` evaluated `W261005GWLY-REQ14@R1` and informed this revision.

**Revision Summary:**

- The debounce is defined as trailing (RF14).
- Pull-diagnostic timing is added (RF6).
- Completion resolve waits at most 500 ms (RF8).
- `ContentModified` and `RequestCancelled` errors are never shown (RF14).

**Question:** How does LSP work stay out of the typing path, and what happens to results that arrive late?

**Answer:** No LSP request, response, or process event runs inside a keystroke's dispatch beyond turning it into an effect.

Document changes are sent as a trailing debounce: one `didChange` per buffer 150 ms after the last edit, and right before any request for that buffer. For servers with pull diagnostics, the client sends `textDocument/diagnostic` for an open document after its `didOpen` and after each `didChange` it sends. On `workspace/diagnostic/refresh` it pulls every open document again. A newer pull for a document cancels the older one.

Every request records the buffer version it was made for, and its result is dropped if the buffer has changed since. Diagnostics are the exception: they are kept until that server's next publish or pull result for the document. A newer hover, completion, or signature request cancels the older one with `$/cancelRequest`. `completionItem/resolve` on accept waits at most 500 ms, then the item is applied unresolved.

User-triggered requests time out after 5 s with a message. `ContentModified` and `RequestCancelled` errors are never shown. `sourceKeystrokeP95` keeps its 16 ms target with a server attached.

**Rationale:** The editor's single-threaded store must stay responsive. Version-checked results guarantee nothing lands on text that has changed. A trailing debounce sends one change per typing burst. Neovim's leading-edge rate limit would send the first key at once, at the cost of a second message. The LSP specification says `ContentModified` should not be shown to users. Re-pulling after each change is how Neovim keeps pulled diagnostics current. The resolve bound follows blink.cmp's resolve timeout, raised so typical auto-import resolves still finish.

**Acceptance Criteria:**

- [ ] The source keystroke benchmark with the fake server attached and publishing diagnostics meets its target.
- [ ] A hover result for an older buffer version opens no float.
- [ ] Ten keys typed within 150 ms produce one `didChange`, sent before any following request.
- [ ] For a pull server, each sent `didChange` is followed by one `textDocument/diagnostic` for that document.
- [ ] A request answered with `ContentModified` produces no message or toast.
- [ ] A resolve slower than 500 ms doesn't delay accepting; the item is applied without the resolved fields.

**Depends On:** `W261005GWLY-REQ12@R2`

## W261005GWLY-REQ15@R1: Verification without real servers

**Requirement ID:** `W261005GWLY-REQ15`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF5` and `RF15` evaluated and retained this exact revision

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

Research source: `w261005gwly-research.md` (commit `9408b4d`), which evaluated `W261005GWLY-REQ1@R1` to `W261005GWLY-REQ15@R1` against baseline commit `3558947`. Every finding evaluated at least one requirement, so no row has `Evaluated Revision` set to `None`.

| Finding | Evaluated Revision | Assessment | Outcome | Current Requirement(s) | Rationale |
|---|---|---|---|---|---|
| `RF1` | `W261005GWLY-REQ2@R1` | Challenges: `typescript-language-server` can't serve TypeScript 7 projects, including `so`'s own repository | Revised | `W261005GWLY-REQ2@R2`, `W261005GWLY-REQ1@R2` | Adds the `tsc` built-in chosen by `tsc --version`, and project-local binary lookup (REQ1@R2) |
| `RF1` | `W261005GWLY-REQ6@R1` | Adds consideration: `tsc --lsp` needs pull diagnostics | Revised | `W261005GWLY-REQ6@R2` | Diagnostics also come from pull requests |
| `RF2` | `W261005GWLY-REQ2@R1` | Supports: the other five commands match nvim-lspconfig and Helix; basedpyright is a viable alternative | No impact | `W261005GWLY-REQ2@R2` | Commands kept. basedpyright stays a user-config addition |
| `RF2` | `W261005GWLY-REQ3@R1` | Adds consideration: rustup's proxy is on `PATH` but exits at once | Revised | `W261005GWLY-REQ3@R2` | An exit before `initialize` is shown as `unavailable`, silently |
| `RF2` | `W261005GWLY-REQ12@R1` | Adds consideration: the same proxy would count as a crash | Revised | `W261005GWLY-REQ12@R2` | An exit before `initialize` completes is not a crash |
| `RF3` | `W261005GWLY-REQ2@R1` | Adds consideration: servers read settings by `workspace/configuration` or initialization options | Revised | `W261005GWLY-REQ2@R2` | Specifies settings delivery, rust-analyzer initialization options, and JSON `provideFormatter` |
| `RF3` | `W261005GWLY-REQ11@R1` | Supports: JSON formatting needs `provideFormatter` | No impact | `W261005GWLY-REQ11@R1` | Covered by the `json` built-in's `initOptions` in REQ2@R2 |
| `RF4` | `W261005GWLY-REQ12@R1` | Challenges: nearest-of-any marker splits Cargo workspaces and ignores `go.work` | Revised | `W261005GWLY-REQ12@R2` | Ordered markers, `topmost` for rust-analyzer, no workspace folder without a marker |
| `RF4` | `W261005GWLY-REQ2@R1` | Adds consideration: `rootMarkers` meaning is unspecified | Revised | `W261005GWLY-REQ2@R2` | `rootMarkers` order is priority; `rootSearch` field added |
| `RF5` | `W261005GWLY-REQ4@R1` | Adds consideration: unhandled server requests are answered `MethodNotFound` | No impact | `W261005GWLY-REQ4@R1` | The client answers the four required server requests by design; no requirement change |
| `RF5` | `W261005GWLY-REQ15@R1` | Supports: pinned packages are current, LSP 3.18 is final, and nothing blocks Bun | Retained | `W261005GWLY-REQ15@R1` | Test approach and pins stand |
| `RF6` | `W261005GWLY-REQ6@R1` | Challenges: push-only shows no TypeScript 7 file diagnostics | Revised | `W261005GWLY-REQ6@R2` | Pull diagnostics where the server offers them |
| `RF6` | `W261005GWLY-REQ7@R1` | Constrains: pulled diagnostics cover open files only | Revised | `W261005GWLY-REQ7@R2` | Unopened-file diagnostics come from push servers; pulled ones go when the file closes |
| `RF6` | `W261005GWLY-REQ2@R1` | Challenges: the TypeScript built-in choice decides whether pull is needed | Revised | `W261005GWLY-REQ2@R2` | Same revision as the `RF1` row |
| `RF6` | `W261005GWLY-REQ14@R1` | Adds consideration: pull needs a re-request after changes and on refresh | Revised | `W261005GWLY-REQ14@R2` | Pull after each sent `didChange` and on `workspace/diagnostic/refresh` |
| `RF7` | `W261005GWLY-REQ9@R1` | Challenges: without snippets the JSON server offers no completion; TypeScript auto-imports for other files arrive as an item `command` | Revised | `W261005GWLY-REQ9@R2` | Per-server `snippets` flag with flattening; run `command` after accept |
| `RF7` | `W261005GWLY-REQ8@R1` | Constrains: automatic completion works on five of six servers | No impact | `W261005GWLY-REQ8@R1` | JSON is handled by REQ9@R2; the trigger rules stand |
| `RF7` | `W261005GWLY-REQ2@R1` | Adds consideration: the JSON built-in needs snippet support | Revised | `W261005GWLY-REQ2@R2` | `snippets = true` on the `json` built-in |
| `RF8` | `W261005GWLY-REQ8@R1` | Supports: 150 ms and one character sit between Helix and nvim-cmp defaults | Retained | `W261005GWLY-REQ8@R1` | Trigger timing stands |
| `RF8` | `W261005GWLY-REQ14@R1` | Adds consideration: an unbounded resolve can delay accepting an item | Revised | `W261005GWLY-REQ14@R2` | Resolve waits at most 500 ms |
| `RF9` | `W261005GWLY-REQ10@R1` | Constrains: version refusal is supported; with no resource operations, rust-analyzer fails the whole code-action list unless edits resolve lazily | Revised | `W261005GWLY-REQ10@R2` | Advertise lazy code-action edits, report partial failure, no change-annotation support |
| `RF9` | `W261005GWLY-REQ13@R1` | Supports: `grn` and `gra` are unaffected | No impact | `W261005GWLY-REQ13@R1` | Keys stand |
| `RF10` | `W261005GWLY-REQ4@R1` | Constrains: the watcher excludes dot paths, `node_modules`, and ignored paths | Clarified | `W261005GWLY-REQ4@R1` | States the existing limit of "reported by the watcher" |
| `RF10` | `W261005GWLY-REQ10@R1` | Challenges: `so`'s own writes never reach servers | Revised | `W261005GWLY-REQ10@R2` | Closed files an edit writes are reported through `didChangeWatchedFiles` |
| `RF11` | `W261005GWLY-REQ11@R1` | Supports: the 1000 ms limit and explicit-save-only rule match Neovim, conform.nvim, and VS Code | Clarified | `W261005GWLY-REQ11@R1` | States that `willSaveWaitUntil` is not sent and that range formatting on gopls is reported as not supported |
| `RF12` | `W261005GWLY-REQ12@R1` | Adds consideration: VS Code allows four restarts in 3 minutes; Helix sends `exit` without waiting | Revised | `W261005GWLY-REQ12@R2` | Fifth crash within 3 minutes marks the server failed; `exit` follows the reply or the bound |
| `RF12` | `W261005GWLY-REQ3@R1` | Supports: `✗` after the final failure | No impact | `W261005GWLY-REQ3@R2` | Display rule unchanged by this finding |
| `RF13` | `W261005GWLY-REQ13@R1` | Clarifies: `gd` is a convention, not a Neovim default; Neovim 0.12 adds `grt`, `grx`, `]D`/`[D` | Clarified | `W261005GWLY-REQ13@R1` | Wording corrected; keys follow the project's Neovim 0.11 baseline, and the 0.12 additions are out of scope |
| `RF13` | `W261005GWLY-REQ3@R1` | Supports: progress needs `window/workDoneProgress/create` answered | No impact | `W261005GWLY-REQ3@R2` | Answering it is part of the client design |
| `RF13` | `W261005GWLY-REQ6@R1` | Supports: Neovim defaults are wrap on, no update in insert, signs and underline on | No impact | `W261005GWLY-REQ6@R2` | Display rules unchanged by this finding |
| `RF14` | `W261005GWLY-REQ14@R1` | Supports 150 ms and flush-before-request; adds that `ContentModified` should not be shown | Revised | `W261005GWLY-REQ14@R2` | Trailing debounce stated; `ContentModified` and `RequestCancelled` hidden |
| `RF14` | `W261005GWLY-REQ12@R1` | Supports: every built-in uses incremental sync | No impact | `W261005GWLY-REQ12@R2` | Sync rule unchanged by this finding |
| `RF15` | `W261005GWLY-REQ15@R1` | Supports: Neovim tests its client with the same scripted stdio fake-server pattern | Retained | `W261005GWLY-REQ15@R1` | Test approach stands |

Every recommended outcome was chosen by the user on 2026-10-05.

# 7. Historical Requirement Revisions

## W261005GWLY-REQ1@R1: Opt-in, XDG-only servers

**Requirement ID:** `W261005GWLY-REQ1`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005GWLY-REQ1@R2`

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

**Status:** Revised by `W261005GWLY-REQ2@R2`

**Research Relationship:** `RF1`, `RF2`, `RF3`, `RF4`, `RF6`, and `RF7` evaluated this exact revision

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

**Status:** Revised by `W261005GWLY-REQ3@R2`

**Research Relationship:** `RF2`, `RF12`, and `RF13` evaluated this exact revision

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

## W261005GWLY-REQ6@R1: Diagnostic display

**Requirement ID:** `W261005GWLY-REQ6`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005GWLY-REQ6@R2`

**Research Relationship:** `RF1`, `RF6`, and `RF13` evaluated this exact revision

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

**Status:** Revised by `W261005GWLY-REQ7@R2`

**Research Relationship:** `RF6` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** Is there a list of diagnostics across files?

**Answer:** `:Diagnostics` (bound to `<leader>xd`) opens a picker over every diagnostic currently published, including files that aren't open, sorted by severity and then by path and position. `Enter` opens the file at the diagnostic. The explorer is unchanged.

**Rationale:** Servers publish diagnostics for files the user hasn't opened. The picker reuses an existing surface, while explorer markers would change explorer rows and mouse hit-testing.

**Acceptance Criteria:**

- [ ] A diagnostic published for an unopened file appears in `:Diagnostics`, and `Enter` opens that file at its position.
- [ ] An empty publish for a path removes that path's entries.
- [ ] When a server stops, its diagnostics are removed.

**Depends On:** `W261005GWLY-REQ6@R1`

## W261005GWLY-REQ9@R1: Plain-text completion with auto-import edits

**Requirement ID:** `W261005GWLY-REQ9`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005GWLY-REQ9@R2`

**Research Relationship:** `RF7` evaluated this exact revision

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

**Status:** Revised by `W261005GWLY-REQ10@R2`

**Research Relationship:** `RF9` and `RF10` evaluated this exact revision

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

## W261005GWLY-REQ12@R1: Server lifecycle and project roots

**Requirement ID:** `W261005GWLY-REQ12`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005GWLY-REQ12@R2`

**Research Relationship:** `RF2`, `RF4`, `RF12`, and `RF14` evaluated this exact revision

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

## W261005GWLY-REQ14@R1: Responsiveness and stale results

**Requirement ID:** `W261005GWLY-REQ14`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005GWLY-REQ14@R2`

**Research Relationship:** `RF6`, `RF8`, and `RF14` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** How does LSP work stay out of the typing path, and what happens to results that arrive late?

**Answer:** No LSP request, response, or process event runs inside a keystroke's dispatch beyond turning it into an effect. Document changes are sent at most every 150 ms per buffer (Neovim's default debounce) and right before any request for that buffer. Every request records the buffer version it was made for, and its result is dropped if the buffer has changed since, except for diagnostics, which are kept until the next publish. A newer hover, completion, or signature request cancels the older one with `$/cancelRequest`. User-triggered requests time out after 5 s with a message. `sourceKeystrokeP95` keeps its 16 ms target with a server attached.

**Rationale:** The editor's single-threaded store must stay responsive. Version-checked results guarantee nothing lands on text that has changed.

**Acceptance Criteria:**

- [ ] The source keystroke benchmark with the fake server attached and publishing diagnostics meets its target.
- [ ] A hover result for an older buffer version opens no float.
- [ ] Ten keys typed within 150 ms produce one `didChange`, sent before any following request.

**Depends On:** `W261005GWLY-REQ12@R1`
