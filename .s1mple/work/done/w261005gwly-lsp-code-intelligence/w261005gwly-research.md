# W261005GWLY: lsp-code-intelligence — Research

**Context Source:** `w261005gwly-discuss-context.md`

**Requirements Source:** `w261005gwly-requirements.md`

**Requirements Baseline Commit:** `3558947`

**Evaluated Requirement Revisions:** `W261005GWLY-REQ1@R1`, `W261005GWLY-REQ2@R1`, `W261005GWLY-REQ3@R1`, `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ5@R1`, `W261005GWLY-REQ6@R1`, `W261005GWLY-REQ7@R1`, `W261005GWLY-REQ8@R1`, `W261005GWLY-REQ9@R1`, `W261005GWLY-REQ10@R1`, `W261005GWLY-REQ11@R1`, `W261005GWLY-REQ12@R1`, `W261005GWLY-REQ13@R1`, `W261005GWLY-REQ14@R1`, `W261005GWLY-REQ15@R1`

**Research Policy:** One substantive research pass; immutable after acceptance and commit.

# Table of Contents

1. [Research Objective](#1-research-objective)
2. [Research Findings](#2-research-findings)
   - [RF1: TypeScript built-in targets a superseded server](#rf1-typescript-built-in-targets-a-superseded-server)
   - [RF2: Python, Go, Rust, C, and JSON launch facts](#rf2-python-go-rust-c-and-json-launch-facts)
   - [RF3: Settings need workspace/configuration and init options](#rf3-settings-need-workspaceconfiguration-and-init-options)
   - [RF4: Nearest-marker roots split Cargo and Go workspaces](#rf4-nearest-marker-roots-split-cargo-and-go-workspaces)
   - [RF5: Protocol packages are current and LSP 3.18 is final](#rf5-protocol-packages-are-current-and-lsp-318-is-final)
   - [RF6: Push-only diagnostics miss TypeScript 7 file diagnostics](#rf6-push-only-diagnostics-miss-typescript-7-file-diagnostics)
   - [RF7: No snippets disables JSON completion; resolve and command matter](#rf7-no-snippets-disables-json-completion-resolve-and-command-matter)
   - [RF8: Completion trigger timing in mature clients](#rf8-completion-trigger-timing-in-mature-clients)
   - [RF9: Workspace edits, versions, and missing resource operations](#rf9-workspace-edits-versions-and-missing-resource-operations)
   - [RF10: Watched files and the app's own writes](#rf10-watched-files-and-the-apps-own-writes)
   - [RF11: Formatting timeouts, autosave, and options](#rf11-formatting-timeouts-autosave-and-options)
   - [RF12: Lifecycle, restart, and position encoding](#rf12-lifecycle-restart-and-position-encoding)
   - [RF13: Neovim 0.12 keys, gd, and progress display](#rf13-neovim-012-keys-gd-and-progress-display)
   - [RF14: didChange debounce is a rate limit with flush](#rf14-didchange-debounce-is-a-rate-limit-with-flush)
   - [RF15: Fake-server testing patterns](#rf15-fake-server-testing-patterns)
3. [Sources](#3-sources)
4. [Confidence and Open Questions](#4-confidence-and-open-questions)

# 1. Research Objective

The baseline requirements were decided from project evidence plus Neovim and Helix conventions recalled from memory, with no external check (`w261005gwly-requirements.md:7`, "Research Source: None"). This pass checks those decisions against current (2025–2026) primary sources: the LSP 3.18 specification, the source code of the six built-in servers, and the clients Neovim 0.12.5, nvim-lspconfig, Helix (master), and VS Code's `vscode-languageclient`. It reports where the evidence supports, constrains, or challenges each requirement revision, so the post-research requirement review can decide what to change. It does not choose an implementation.

The most consequential results are:

```text
RF1  TypeScript 7 (the version so itself pins) has no tsserver → typescript-language-server cannot serve TS 7 projects
RF6  TS 7's own server (tsc --lsp) sends per-file diagnostics only by pull → push-only REQ6/REQ7 would show none
RF7  vscode-json-language-server offers no completion when snippetSupport is false → REQ9 disables JSON completion
RF4  "nearest marker" roots start one rust-analyzer per Cargo workspace member and ignore go.work
RF9  rust-analyzer fails the whole codeAction list / module rename when resourceOperations is [] and resolve is not used
```

**Research Questions:**

- Built-in server table (REQ2, REQ12): current launch commands, root markers, required init options and settings for typescript-language-server, pyright (or basedpyright), gopls, rust-analyzer, clangd, and vscode-json-language-server; which are unmaintained or superseded?
- Protocol stack (REQ4, REQ15): current versions and maintenance of `vscode-jsonrpc` and `vscode-languageserver-protocol`; is LSP 3.18 final; known Bun incompatibilities?
- Diagnostics model (REQ6, REQ7): do any built-in servers rely on pull diagnostics; how do Neovim and Helix support them; would push-only miss diagnostics?
- Completion without snippets (REQ8, REQ9): how do the servers behave with `snippetSupport: false`; how are auto-imports delivered; what trigger and debounce timing do Neovim, Helix, blink.cmp, and nvim-cmp use?
- Workspace edits (REQ10): how do Neovim and Helix apply edits to closed files, version mismatches, change annotations, and resource operations; what breaks when the client advertises none?
- Formatting (REQ11): format-on-save timeouts and autosave behaviour in Neovim, conform.nvim, Helix, and VS Code; relevance of `willSaveWaitUntil`; derivation of `tabSize`/`insertSpaces`.
- Lifecycle and roots (REQ12): shutdown timing, crash-restart policies, root detection, single-file mode, `processId`, and position-encoding negotiation.
- Keys and UX (REQ13, REQ3): Neovim 0.11/0.12 default LSP mappings; whether `gd` is a default; how Neovim and Helix show progress.
- Performance and sync (REQ14): Neovim's didChange debounce, sync kind defaults, and cancellation; typing-latency evidence.
- Testing (REQ15): how Neovim and the vscode-languageserver-node ecosystem test LSP clients without real servers.

# 2. Research Findings

## RF1: TypeScript built-in targets a superseded server

**Question:** Built-in server table — is `typescript-language-server --stdio` still the right TypeScript built-in?

**Finding:** No longer as the only choice. TypeScript 7 (`typescript@7.0.2`, npm `latest`) is the native Go compiler, ships no `tsserver`, and has its own language server started as `tsc --lsp --stdio`. `typescript-language-server` (6.0.1, maintained) only works with TypeScript ≤ 6: its README installs `typescript@6`, and with a TS 7 workspace it previously fell back silently to an unrelated global TypeScript (fixed in 6.0.0 to notify instead). nvim-lspconfig now ships a `tsc` config, marks `tsgo` deprecated in its favour, and states `ts_ls` "will likely eventually be replaced". Helix master still defaults to `typescript-language-server`. `so` itself pins TypeScript 7.0.2 (`project.md:18`), so the REQ2 built-in would not work on `so`'s own repository.

**Requirements Evaluated:**

- `W261005GWLY-REQ2@R1` — six built-ins, including `typescript` = `typescript-language-server --stdio`, attached when the binary is on `PATH`.
- `W261005GWLY-REQ6@R1` — diagnostics shown from published diagnostics (see RF6 for the TS 7 consequence).

**Potential Requirement Impact:** Challenges REQ2's TypeScript entry. A later revision could (a) replace or add a `tsc --lsp --stdio` built-in for TS 7 projects, (b) keep `typescript-language-server` for TS ≤ 6 projects, or (c) both, with a selection rule. "Binary on `PATH`" is not a sufficient attach test for `tsc`: a TypeScript ≤ 6 `tsc` exists on many machines and has no `--lsp` flag. Choosing `tsc` also makes RF6 (pull diagnostics) mandatory for REQ6.

**Evidence:**

- `typescript` npm `latest` is `7.0.2` (dist-tag checked 2026-10-05); TypeScript release `v7.0.2` published 2026-08-20 — [npm: typescript](https://www.npmjs.com/package/typescript), [microsoft/TypeScript releases](https://github.com/microsoft/TypeScript/releases).
- lspconfig `tsc`: "The language server (`--lsp`) is only available in the native compiler, TypeScript 7.0 and newer"; it runs `{ cmd, '--lsp', '--stdio' }` and probes `tsc --version` for major ≥ 7 before attaching, searching `node_modules/.bin` then `PATH` — [nvim-lspconfig lsp/tsc.lua L11-13, L66, L97](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/tsc.lua#L11-L13); `tsgo` is "Deprecated in favor of tsc" — [lsp/tsgo.lua L3](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/tsgo.lua#L3).
- lspconfig `ts_ls`: "will likely eventually be replaced by tsc"; "you will need to install a `typescript` version < 7 for now"; `init_options = { hostInfo = 'neovim' }`; command `typescript-language-server --stdio`, preferring `node_modules/.bin`; root markers are lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`, `bun.lock`) at equal priority, then `.git`, and Deno projects are excluded — [lsp/ts_ls.lua L7-12, L51-73](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/ts_ls.lua#L7-L73).
- typescript-language-server README installs `typescript-language-server typescript@6` and says TypeScript 7 "will hopefully supersede this project"; 6.0.0 (2026-08-20) requires Node ≥ 22.22.2 and adds "notify when typescript with no tsserver API found" — [README L43-48](https://github.com/typescript-language-server/typescript-language-server/blob/d11657d1b6996158a64c680516fe2c31a14d9803/README.md), [CHANGELOG 6.0.0](https://github.com/typescript-language-server/typescript-language-server/blob/d11657d1b6996158a64c680516fe2c31a14d9803/CHANGELOG.md), [issue #1110](https://github.com/typescript-language-server/typescript-language-server/issues/1110).
- Helix master: `[language-server.typescript-language-server] command = "typescript-language-server", args = ["--stdio"], config.hostInfo = "helix"`; TypeScript roots `["package.json", "tsconfig.json"]`; `.tsx` uses `language-id = "typescriptreact"` — [helix languages.toml L255-258, L1044, L1077](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/languages.toml#L255-L258).
- The TS 7 server negotiates UTF-8 or UTF-16, uses incremental sync, offers completion with `resolveProvider: true`, and starts a watchdog on `processId` — [typescript-go internal/lsp/server.go L1534-1587](https://github.com/microsoft/typescript-go/blob/89d5d5b2849a0db0957065889ca58536fa6d2e4a/internal/lsp/server.go#L1534-L1587).

**Rationale and Examples:** A user who opts in and opens `src/core/state/update.ts` in `so`'s own repository has `typescript@7.0.2` in `node_modules`. `typescript-language-server` finds no `tsserver` there and either notifies or uses a different TypeScript than the project's. `tsc --lsp --stdio` from `node_modules/.bin` would serve the project's own compiler.

```text
project TS ≤ 6 → typescript-language-server --stdio   (tsserver wrapper, push diagnostics)
project TS ≥ 7 → tsc --lsp --stdio                    (native server, pull diagnostics — RF6)
```

**Tradeoffs and Limitations:**

- Helix still defaults to `typescript-language-server`; the move to `tsc` is led by nvim-lspconfig and the TypeScript team, not universal.
- `tsc --lsp` is new (7.0 released 2026-08-20); feature parity with `tsserver` (for example, every refactor) was not measured here.
- Version probing (`tsc --version`) adds a process spawn per root, which nvim-lspconfig caches.

**Reconciliation Considerations:**

- Decide whether the TypeScript built-in is `tsc` (TS 7), `typescript-language-server` (TS ≤ 6), or both, and how a missing `--lsp` flag is detected and reported in `:LspInfo` (REQ3).
- Decide whether built-ins prefer `<root>/node_modules/.bin/<cmd>` over `PATH`, as nvim-lspconfig does for `ts_ls`, `tsc`, and `jsonls`. This executes a binary from the workspace, which touches REQ1's "nothing from the workspace" rule.
- REQ2's acceptance criterion "Each built-in starts with its listed command" would need a TS-version condition if both are kept.

## RF2: Python, Go, Rust, C, and JSON launch facts

**Question:** Built-in server table — current canonical commands, root markers, and maintenance status for the other five built-ins; is basedpyright now the better Python default?

**Finding:** REQ2's commands for the other five match nvim-lspconfig and Helix exactly. Root-marker lists differ from what a "nearest of any marker" rule assumes (RF4). Neither pyright nor basedpyright is superseded: both release often and share the command shape (`<name>-langserver --stdio`) and root markers. basedpyright can be installed from PyPI with a bundled Node runtime, while Helix's default Python list has moved to `ty` (beta) and `ruff`. Two operational traps affect REQ2's "binary on PATH" rule: rustup installs a `rust-analyzer` proxy on `PATH` that exits with an error when the component is missing, and `vscode-langservers-extracted` (the JSON server's distribution) was last published in May 2024.

**Requirements Evaluated:**

- `W261005GWLY-REQ2@R1` — built-in commands and "a built-in whose binary is missing starts nothing and causes no error".
- `W261005GWLY-REQ3@R1` — missing built-ins are silent and listed in `:LspInfo`; final failure shows `✗`.
- `W261005GWLY-REQ12@R1` — crash handling (a failing proxy looks like a crash).

**Potential Requirement Impact:** Supports REQ2's commands for pyright, gopls, rust-analyzer, clangd, and JSON. Adds a consideration for REQ2/REQ3/REQ12: a rustup proxy passes the `PATH` check and then fails at once, which under REQ12 is a crash, a restart, a second crash, `✗`, and a toast. That is the noisy outcome REQ3 tries to avoid for missing servers. It also adds an option to name basedpyright as a fallback or alternative Python built-in.

**Evidence:**

- pyright: `cmd = { 'pyright-langserver', '--stdio' }`, root markers `pyrightconfig.json, pyproject.toml, setup.py, setup.cfg, requirements.txt, Pipfile, .git`, settings `python.analysis.diagnosticMode = 'openFilesOnly'` — [lsp/pyright.lua L37-57](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/pyright.lua#L37-L57); basedpyright uses `basedpyright-langserver --stdio` with the same markers — [lsp/basedpyright.lua L29-45](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/basedpyright.lua#L29-L45).
- Release activity (checked 2026-10-05): pyright 1.1.414 (2026-09-09, PyPI "Production/Stable"); basedpyright 1.40.2 (2026-10-04), whose PyPI package depends on `nodejs-wheel-binaries`; ty 0.0.84 (2026-09-24, "Beta") — [npm: pyright](https://www.npmjs.com/package/pyright), [PyPI: basedpyright](https://pypi.org/project/basedpyright/), [PyPI: ty](https://pypi.org/project/ty/).
- Helix defines `pyright` and `basedpyright` (`args = ["--stdio"]`) but the Python default list is `["ty", "ruff", "jedi", "pylsp", "zuban"]` — [helix languages.toml L122-124, L1179](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/languages.toml#L1179).
- gopls: `cmd = { 'gopls' }`, root `go.work`, else `go.mod`, else `.git` — [lsp/gopls.lua L101-106](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/gopls.lua#L101-L106); Helix `command = "gopls"`, roots `["go.work", "go.mod"]` — [languages.toml L224, L892](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/languages.toml#L892).
- rust-analyzer: `cmd = { 'rust-analyzer' }`; root from `cargo metadata ... workspace_root`, else the crate's `Cargo.toml` folder, else `rust-project.json`, else `.git` — [lsp/rust_analyzer.lua L105-134](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/rust_analyzer.lua#L105-L134); Helix roots `["Cargo.toml", "Cargo.lock"]` — [languages.toml L346](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/languages.toml#L346).
- rustup's `rust-analyzer` proxy on `PATH` prints "error: Unknown binary 'rust-analyzer' in official toolchain …" and exits until `rustup component add rust-analyzer` — [helix discussion #10851](https://github.com/helix-editor/helix/discussions/10851).
- clangd: `cmd = { 'clangd' }`, root markers `.clangd, .clang-tidy, .clang-format, compile_commands.json, compile_flags.txt, configure.ac, .git`; language ids `objective-c`, `objective-cpp`, `cuda-cpp` — [lsp/clangd.lua L66-82](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/clangd.lua#L66-L82); Helix `clangd = { command = "clangd" }` with no C/C++ `roots` — [languages.toml L28](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/languages.toml#L28).
- JSON: `vscode-json-language-server --stdio`, `init_options = { provideFormatter = true }`, root `.git` — [lsp/jsonls.lua L29-40](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/jsonls.lua#L29-L40); Helix passes `config = { provideFormatter = true, json = { validate = { enable = true } } }` — [languages.toml L173](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/languages.toml#L173); `vscode-langservers-extracted` latest 4.10.0, last published 2024-05-08 — [npm: vscode-langservers-extracted](https://www.npmjs.com/package/vscode-langservers-extracted).

**Rationale and Examples:** On a default rustup install, `which rust-analyzer` succeeds even when the component is missing. The user's machine has a working rust-analyzer 1.96.0 (`w261005gwly-discuss-context.md:49`), so the spike could not show this failure.

**Tradeoffs and Limitations:**

- The JSON server source is maintained inside `microsoft/vscode` (last change to `jsonServer.ts` 2026-04-13); only the extracted npm bundle is stale.
- No independent evidence was found that basedpyright is "better" for `so`'s scope; its extra features (inlay hints, semantic tokens) are out of scope here.

**Reconciliation Considerations:**

- Decide whether an immediate exit before `initialize` completes should count as "not available" (shown in `:LspInfo` with its stderr) rather than as a crash with a toast.
- Decide whether basedpyright is a second Python built-in, an alternative, or left to user config.
- Record the exact per-server root markers (RF4) and language ids in the requirement or design.

## RF3: Settings need workspace/configuration and init options

**Question:** Built-in server table — which servers need `initializationOptions` or settings, and how do servers read them?

**Finding:** REQ2's `settings` and `initOptions` fields only work if the client delivers them the way each server reads them. pyright and gopls pull settings with the server-to-client `workspace/configuration` request. rust-analyzer reads its settings from `initializationOptions`, so nvim-lspconfig copies `settings["rust-analyzer"]` there. The JSON server reads `provideFormatter` from `initializationOptions` and other settings from `workspace/didChangeConfiguration`. Neovim and Helix both advertise and answer `workspace/configuration`. REQ2 names the fields but not how they reach the server.

**Requirements Evaluated:**

- `W261005GWLY-REQ2@R1` — `[lsp.servers.<name>]` overrides `settings` and `initOptions`.
- `W261005GWLY-REQ11@R1` — formatting (JSON formatting requires `provideFormatter`).

**Potential Requirement Impact:** Adds a consideration to REQ2: settings delivery (answer `workspace/configuration` by section path from `settings`, send `didChangeConfiguration` after init) and per-built-in default init options (`provideFormatter = true` for JSON) belong in the requirement or design. Without `provideFormatter`, `:Format` on JSON shows "not supported".

**Evidence:**

- pyright reads settings with `this.connection.workspace.getConfiguration(item)` when the client has the configuration capability, else from a default config — [pyright languageServerBase.ts L435-449](https://github.com/microsoft/pyright/blob/3a024b2f4fb1949d44ee6c575ec6e73def9ae529/packages/pyright-internal/src/languageServerBase.ts#L435-L449).
- rust-analyzer config is taken from `initializationOptions`; lspconfig: "do not set `init_options` … it will be automatically populated by the contents of settings["rust-analyzer"]" and `before_init` sets `init_params.initializationOptions = config.settings['rust-analyzer']` — [lsp/rust_analyzer.lua L20-22, L172-175](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/rust_analyzer.lua#L172-L175).
- JSON server: `documentFormattingProvider: initializationOptions.provideFormatter === true` and settings arrive through `connection.onDidChangeConfiguration` — [vscode jsonServer.ts L186-193, L258](https://github.com/microsoft/vscode/blob/cd97b0dff8f0b661089d2e2524aad22710b3c695/extensions/json-language-features/server/src/jsonServer.ts#L186-L193).
- Neovim advertises `workspace.configuration = true` and `didChangeConfiguration` — [protocol.lua L594-597](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/protocol.lua#L594-L597); Helix advertises `configuration: Some(true)` and treats a server's `config` as initialization options — [helix-lsp client.rs L588-589](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/helix-lsp/src/client.rs#L588), [book languages.md L193](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/book/src/languages.md).
- `workspace/configuration` is a server-to-client request returning one value per requested section — [LSP 3.18: workspace/configuration](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#workspace_configuration).

**Rationale and Examples:** REQ2's example `settings = { "rust-analyzer" = { check = { command = "clippy" } } }` (`w261005gwly-requirements.md:222`) only takes effect if the client copies it into `initializationOptions` or answers rust-analyzer's configuration pull. The same `settings` table must answer pyright's `workspace/configuration` request for section `python.analysis`.

**Tradeoffs and Limitations:**

- `vscode-jsonrpc` answers unhandled server requests with `MethodNotFound` (RF5), so a missing handler degrades to server defaults rather than a hang. The settings are then silently ignored.

**Reconciliation Considerations:**

- Specify how `settings` is served (section lookup by dotted path) and whether `initOptions` defaults to the server's settings for servers like rust-analyzer.
- Give the JSON built-in default `initOptions = { provideFormatter = true }`.

## RF4: Nearest-marker roots split Cargo and Go workspaces

**Question:** Lifecycle and roots — how do mature clients detect project roots, and does "nearest ancestor with any marker" match them?

**Finding:** It does not match for Rust, Go, and JavaScript monorepos. Neovim's `root_markers` treats list order as priority: it searches upward for the first marker before trying the next (nested lists give equal priority). Helix keeps the *topmost* directory with a marker inside the workspace. nvim-lspconfig asks `cargo metadata` for the Cargo workspace root and prefers `go.work` over `go.mod`. REQ12's "nearest ancestor containing one of the `rootMarkers`" would start one rust-analyzer per member crate of a Cargo workspace, and one gopls per module under a `go.work`. That duplicates indexing and splits cross-crate navigation.

**Requirements Evaluated:**

- `W261005GWLY-REQ12@R1` — nearest-ancestor root rule, one process per server and root, and the criterion "Files under two separate `Cargo.toml` folders get two".
- `W261005GWLY-REQ2@R1` — `rootMarkers` override field.

**Potential Requirement Impact:** Challenges REQ12's root rule and one acceptance criterion. Alternatives a later revision could weigh: ordered-priority markers (Neovim), topmost marker within the workspace (Helix), or per-server root logic for rust-analyzer (Cargo workspace root) and gopls (`go.work` first). REQ12's "else the workspace root" fallback differs from both clients when no marker is found (see Tradeoffs).

**Evidence:**

- Neovim: "The list order decides priority. To indicate 'equal priority', specify names in a nested list … search stops at the first directory containing that marker" — [lsp.txt L904-924](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/lsp.txt#L904-L924); a client is reused when name and `root_dir` match — [lsp.txt L889-893](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/lsp.txt#L889-L893).
- Helix: "Helix starts at the file, walks upward, and remembers the *topmost* i.e. *last* directory that contains a marker file" — [book languages.md L61](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/book/src/languages.md); code keeps `top_marker` and, when nothing matches and the workspace is the cwd, returns `None` "to let the LSP decide" — [helix-lsp lib.rs L1000-1029](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/helix-lsp/src/lib.rs#L1000-L1029).
- lspconfig rust-analyzer runs `cargo metadata --no-deps --format-version 1 --manifest-path <crate>/Cargo.toml` and uses `workspace_root`; library files under `~/.cargo/registry` or the toolchain reuse the existing client's root — [lsp/rust_analyzer.lua L105-134](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/rust_analyzer.lua#L105-L134).
- lspconfig gopls: `vim.fs.root(fname, 'go.work') or vim.fs.root(fname, 'go.mod') or vim.fs.root(fname, '.git')` — [lsp/gopls.lua L101](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/gopls.lua#L101).
- Neovim: when no root is found, the client starts without workspace folders ("single file"); `workspace_required` marks servers that need one — [lsp.txt L1930-1939](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/lsp.txt#L1930-L1939).

**Rationale and Examples:**

```text
repo/Cargo.toml            [workspace] members = ["a", "b"]
repo/a/Cargo.toml  repo/a/src/lib.rs
repo/b/Cargo.toml  repo/b/src/lib.rs

REQ12 nearest-marker   a/src/lib.rs → root repo/a ; b/src/lib.rs → root repo/b   → 2 rust-analyzers, each loading the whole workspace
Neovim lspconfig        cargo metadata → root repo   → 1 rust-analyzer
Helix (topmost marker)  → root repo                  → 1 rust-analyzer
```

**Tradeoffs and Limitations:**

- Topmost-marker can over-merge: a `package.json` at a monorepo root plus nested packages yields one root, which is what `tsc` wants but not what every server wants.
- Calling `cargo metadata` runs Cargo, which can run build-script resolution and network fetches; it is also project-code execution that REQ1's opt-in already covers.
- The workspace-root fallback means a stray `.py` file in a notes vault starts a server rooted at the whole vault. Helix declines a root in that case; Neovim starts without a workspace folder.

**Reconciliation Considerations:**

- Replace or qualify the REQ12 criterion "Files under two separate `Cargo.toml` folders get two" with one that distinguishes separate Cargo workspaces from members of one workspace.
- Decide whether `rootMarkers` order means priority (Neovim) or whether the topmost match wins (Helix), and state it in REQ2/REQ12.
- Decide the no-marker fallback: workspace root, no workspace folder, or no server.

## RF5: Protocol packages are current and LSP 3.18 is final

**Question:** Protocol stack — are `vscode-jsonrpc` 9.0.3 and `vscode-languageserver-protocol` 3.18.4 current and maintained, is LSP 3.18 final, and are there known Bun problems?

**Finding:** Yes on all three. Both packages are the npm `latest` versions (published 2026-09-25) from an active Microsoft repository. LSP 3.18.0 was released on 2026-06-04 and is the "current" specification; 3.19 exists only as a draft. No open Bun issue affects the stdio transport. The one open Bun bundler issue involving `vscode-jsonrpc` needs `"sideEffects": false` in the importing package, which `so`'s `package.json` does not set. The `vscode-jsonrpc/node` entry is exported only under the `node` condition, so it relies on Bun resolving that condition, which the 2026-10-05 spike confirmed from source and from a compiled binary.

**Requirements Evaluated:**

- `W261005GWLY-REQ4@R1` — full feature set over the chosen protocol stack.
- `W261005GWLY-REQ15@R1` — tests run the client against a fake server under Bun.

**Potential Requirement Impact:** Supports the accepted assumption and dependencies (`w261005gwly-requirements.md:144-151`) for REQ4 and REQ15. Adds one consideration: an unhandled server-to-client request is answered with `MethodNotFound` automatically, so REQ4's handler list should name the requests the client must answer (`workspace/configuration`, `client/registerCapability`, `window/workDoneProgress/create`, `workspace/applyEdit`).

**Evidence:**

- npm (checked 2026-10-05): `vscode-jsonrpc` latest `9.0.3` (2026-09-25); `vscode-languageserver-protocol` latest `3.18.4` (2026-09-25), depending on exactly `vscode-jsonrpc 9.0.3` and `vscode-languageserver-types 3.18.4`; exports map `./node` → `{ "node": "./lib/node/main.js", "types": … }`, `engines.node >= 14` — [npm: vscode-jsonrpc](https://www.npmjs.com/package/vscode-jsonrpc), [npm: vscode-languageserver-protocol](https://www.npmjs.com/package/vscode-languageserver-protocol).
- Repository activity: last commit 2026-10-02 — [microsoft/vscode-languageserver-node](https://github.com/microsoft/vscode-languageserver-node).
- LSP 3.18 page "describes the current 3.18.x version"; change log entry "3.18.0 (06/04/2026)"; a 3.19 folder exists — [LSP 3.18 specification](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/), [spec source 3.18/specification.md L734](https://github.com/microsoft/language-server-protocol/blob/f8c4bc9834703b7317c98c8e8053a28fa4b6b997/_specifications/lsp/3.18/specification.md).
- Bun issue #4635 "Cannot work with vscode-jsonrpc package" closed 2023; issue #18008 (open) concerns `bun build` dropping re-exports from `vscode-jsonrpc` when the importer sets `"sideEffects": false` — [oven-sh/bun#4635](https://github.com/oven-sh/bun/issues/4635), [oven-sh/bun#18008](https://github.com/oven-sh/bun/issues/18008).
- Unhandled request → `replyError(new ResponseError(ErrorCodes.MethodNotFound, "Unhandled method …"))` — [jsonrpc connection.ts L904](https://github.com/microsoft/vscode-languageserver-node/blob/2d1773893617b1b9d585d5ba527578b196433839/jsonrpc/src/common/connection.ts#L904).

**Rationale and Examples:** `so`'s `package.json` sets `"type": "module"` and no `sideEffects` (`package.json:4`), so #18008's trigger is absent.

**Tradeoffs and Limitations:**

- The npm `next` tags (`vscode-languageserver-protocol` `3.17.6-next.18`) are older than `latest`; pinning `latest` exact versions per `test/repo.test.ts:20` is unaffected.
- Absence of open issues is weak evidence; the spike is the stronger evidence for Bun compatibility.

**Reconciliation Considerations:**

- Keep the pins; note the `node` export condition as a reason the compiled-binary smoke test must keep covering the LSP host.

## RF6: Push-only diagnostics miss TypeScript 7 file diagnostics

**Question:** Diagnostics model — do any built-in servers rely on pull diagnostics, how do Neovim and Helix support them, and would push-only miss diagnostics?

**Finding:** For the six REQ2 servers, push-only works: rust-analyzer, pyright, and the JSON server fall back to `publishDiagnostics` when the client does not advertise `textDocument.diagnostic`; gopls enables pull only with `pullDiagnostics: true` (off by default); clangd offers no pull provider. The TypeScript 7 server (RF1) differs: it computes per-file diagnostics only through `textDocument/diagnostic` and pushes only `tsconfig`/project-level diagnostics. A push-only client would show no type errors for `.ts` files with `tsc --lsp`. Neovim (0.10+, extended in 0.12 with `workspace/diagnostic`) and Helix both implement pull. Few servers implement `workspace/diagnostic` (rust-analyzer, gopls, and JSON declare `workspaceDiagnostics: false`), so a pull model reports open documents only.

**Requirements Evaluated:**

- `W261005GWLY-REQ6@R1` — diagnostics from `publishDiagnostics`, held during insert mode.
- `W261005GWLY-REQ7@R1` — `:Diagnostics` lists every published diagnostic, including unopened files.
- `W261005GWLY-REQ2@R1` — built-in table (TypeScript choice from RF1).
- `W261005GWLY-REQ14@R1` — diagnostics kept until the next publish.

**Potential Requirement Impact:** Supports push-only for the current six built-ins. Challenges REQ6 if the TypeScript built-in becomes `tsc --lsp`, and constrains REQ7: pulled diagnostics cover open documents, so "including files that aren't open" holds only for push servers. If pull is added, REQ14's "diagnostics are kept until the next publish" needs a pull equivalent (re-pull after `didChange`/`didOpen`, `workspace/diagnostic/refresh`).

**Evidence:**

- TypeScript 7 server advertises `DiagnosticProvider{Identifier: "typescript", InterFileDependencies: true}` and handles `textDocument/diagnostic`; `publishProjectDiagnostics` sends only `tsconfig` diagnostics to the config file URI — [typescript-go server.go L1579-1584](https://github.com/microsoft/typescript-go/blob/89d5d5b2849a0db0957065889ca58536fa6d2e4a/internal/lsp/server.go#L1579-L1584), [session.go L1993-2008](https://github.com/microsoft/typescript-go/blob/89d5d5b2849a0db0957065889ca58536fa6d2e4a/internal/project/session.go#L1993-L2008).
- rust-analyzer always advertises `diagnostic_provider` (`workspace_diagnostics: false`) but calls `update_diagnostics()` (push) when `!self.config.text_document_diagnostic()`; flycheck results are always published — [capabilities.rs L167-175](https://github.com/rust-lang/rust-analyzer/blob/667b817189625f373f0e29e4cc12dee18eed07e6/crates/rust-analyzer/src/lsp/capabilities.rs#L167-L175), [main_loop.rs L567-603](https://github.com/rust-lang/rust-analyzer/blob/667b817189625f373f0e29e4cc12dee18eed07e6/crates/rust-analyzer/src/main_loop.rs#L567-L603).
- pyright uses pull only when `textDocument.diagnostic.dynamicRegistration` is true and `disablePullDiagnostics` is not set — [pyright languageServerBase.ts L628-633](https://github.com/microsoft/pyright/blob/3a024b2f4fb1949d44ee6c575ec6e73def9ae529/packages/pyright-internal/src/languageServerBase.ts#L628-L633).
- JSON server: `supportsDiagnosticPull === undefined` → `registerDiagnosticsPushSupport`, else pull — [jsonServer.ts L177-182](https://github.com/microsoft/vscode/blob/cd97b0dff8f0b661089d2e2524aad22710b3c695/extensions/json-language-features/server/src/jsonServer.ts#L177-L182).
- gopls: `diagnosticProvider` only `if options.PullDiagnostics`, "we don't support workspace/diagnostic"; docs: "This feature is off by default" — [gopls general.go L111-119](https://github.com/golang/tools/blob/3f3efb7c3b31192232c67403b23a00bfcdbc3eec/gopls/internal/server/general.go#L111-L119), [gopls diagnostics.md](https://github.com/golang/tools/blob/3f3efb7c3b31192232c67403b23a00bfcdbc3eec/gopls/doc/features/diagnostics.md).
- clangd's initialize result has no `diagnosticProvider` (inspected capability list) — [ClangdLSPServer.cpp L580-702](https://github.com/llvm/llvm-project/blob/c525b47caabb9c461caddcf5791ba38fde580437/clang-tools-extra/clangd/ClangdLSPServer.cpp#L580-L702).
- Neovim advertises `textDocument.diagnostic` (dynamic registration, related documents) and re-pulls on every `didOpen`/`didChange` notification; 0.12 news adds `workspace/diagnostic` and `workspace/diagnostic/refresh` — [protocol.lua L354-361](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/protocol.lua#L354-L361), [lsp/diagnostic.lua L436-465](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/diagnostic.lua#L436-L465), [news.txt L240-279](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/news.txt#L240-L279).
- Helix advertises `textDocument.diagnostic` (`related_document_support`) and lists `pull-diagnostics` as a selectable server feature — [helix-lsp client.rs L712-715](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/helix-lsp/src/client.rs#L712-L715), [book languages.md L263](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/book/src/languages.md).

**Rationale and Examples:**

```text
push server   didChange → (server decides) → publishDiagnostics{uri, diagnostics}        REQ6/REQ7 as written
pull server   didChange → client: textDocument/diagnostic{uri, previousResultId}
                        ← {kind: "full", items} | {kind: "unchanged", resultId}          per open document
              server → workspace/diagnostic/refresh → client re-pulls open documents
```

**Tradeoffs and Limitations:**

- Advertising `textDocument.diagnostic` switches rust-analyzer's native diagnostics and the JSON server to pull. Supporting pull is all-or-nothing per server and adds a request per change per open document.
- Whether the TS 7 server ever pushes file diagnostics with an initialization option was checked only for `disablePushDiagnostics`, which disables the project-level push; no option to push per-file diagnostics was found.

**Reconciliation Considerations:**

- If `tsc --lsp` becomes a built-in (RF1), add pull diagnostics to REQ6's scope or exclude TS 7 diagnostics explicitly.
- Qualify REQ7's "including files that aren't open" as push-server behaviour.

## RF7: No snippets disables JSON completion; resolve and command matter

**Question:** Completion without snippets — how do the servers behave with `snippetSupport: false`, and how are auto-imports delivered?

**Finding:** Five of six servers still complete without snippets, but the JSON server registers no `completionProvider` at all when `snippetSupport` is false, so REQ9 removes JSON completion entirely. Auto-import delivery varies:

| Server | Without snippets | Auto-import edits | Resolve |
|---|---|---|---|
| typescript-language-server | Drops snippet entries; no call-paren snippets | Only in `completionItem/resolve`, plus a `command` for edits in other files | Yes |
| tsc --lsp (TS 7) | Not checked in detail | Not checked | Yes |
| rust-analyzer | Snippet completions not offered | Eager, or deferred to resolve if the client lists `additionalTextEdits` in `resolveSupport.properties` | Conditional |
| pyright / basedpyright | Plain items | Eager, or deferred if the client lists `additionalTextEdits` | Yes |
| gopls | Plain items | Eager | No |
| clangd | Plain items; snippets off | Header insertion eager | No |
| vscode-json-language-server | **No completion provider** | — | — |

REQ9 does not mention `CompletionItem.command`, which typescript-language-server uses to apply edits outside the current file. Neovim runs it after accepting an item.

**Requirements Evaluated:**

- `W261005GWLY-REQ9@R1` — `snippetSupport: false`; apply `textEdit`/`insertText`/`label` plus `additionalTextEdits`; resolve the selected item when supported.
- `W261005GWLY-REQ8@R1` — automatic completion in every code buffer with a server.
- `W261005GWLY-REQ2@R1` — JSON as a built-in.

**Potential Requirement Impact:** Challenges REQ9 for the JSON built-in. Options for reconciliation: accept no JSON completion (hover, diagnostics, symbols, and formatting still work), advertise `snippetSupport: true` and strip or flatten snippet syntax (`$1`, `${1:x}`, `$0`) on insert, or drop JSON from the built-ins. Supports REQ9's resolve-before-apply rule, which typescript-language-server needs for auto-imports. Adds a consideration that REQ9 should run `item.command` after applying the edits, and that the advertised `resolveSupport.properties` decides whether rust-analyzer and pyright send imports eagerly or lazily.

**Evidence:**

- JSON server: `clientSnippetSupport = getClientCapability('textDocument.completion.completionItem.snippetSupport', false)`; `completionProvider: clientSnippetSupport ? {…} : undefined` — [jsonServer.ts L171, L186-189](https://github.com/microsoft/vscode/blob/cd97b0dff8f0b661089d2e2524aad22710b3c695/extensions/json-language-features/server/src/jsonServer.ts#L171-L189); lspconfig: "`vscode-json-language-server` only provides completions when snippet support is enabled" — [lsp/jsonls.lua L12](https://github.com/neovim/nvim-lspconfig/blob/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp/jsonls.lua#L12).
- typescript-language-server: `if (isSnippet && !features.completionSnippets) return null`; resolve sets `item.additionalTextEdits` and `item.command` from `details.codeActions` — [completion.ts L130-137, L366-370](https://github.com/typescript-language-server/typescript-language-server/blob/d11657d1b6996158a64c680516fe2c31a14d9803/src/completion.ts#L130-L137).
- rust-analyzer reads `completion_snippet()` from `snippetSupport`; `resolve_provider` depends on the client's `resolveSupport` properties — [capabilities.rs L50-55, L488-500](https://github.com/rust-lang/rust-analyzer/blob/667b817189625f373f0e29e4cc12dee18eed07e6/crates/rust-analyzer/src/lsp/capabilities.rs#L50-L55).
- pyright: `completionSupportsSnippet = !!…snippetSupport`; `completionItemResolveSupportsAdditionalTextEdits = …resolveSupport?.properties.some(p => p === 'additionalTextEdits')` — [languageServerBase.ts L609, L624-627](https://github.com/microsoft/pyright/blob/3a024b2f4fb1949d44ee6c575ec6e73def9ae529/packages/pyright-internal/src/languageServerBase.ts#L609-L627).
- gopls: `CompletionProvider{TriggerCharacters: ["."]}` with no resolve — [general.go L204-206](https://github.com/golang/tools/blob/3f3efb7c3b31192232c67403b23a00bfcdbc3eec/gopls/internal/server/general.go#L204-L206).
- clangd: `Opts.CodeComplete.EnableSnippets = Params.capabilities.CompletionSnippets`; `"resolveProvider", false` — [ClangdLSPServer.cpp L518, L609](https://github.com/llvm/llvm-project/blob/c525b47caabb9c461caddcf5791ba38fde580437/clang-tools-extra/clangd/ClangdLSPServer.cpp#L518).
- Neovim advertises `snippetSupport = true` — [protocol.lua L477](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/protocol.lua#L477); after accepting it applies `additionalTextEdits` (resolving if absent) and runs `client:exec_cmd(item.command)` — [lsp/completion.lua L889-918](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/completion.lua#L889-L918); Helix exposes a `snippets` option, default `true` — [book editor.md L177](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/book/src/editor.md).

**Rationale and Examples:** With REQ9 as written, typing `"` in `package.json` opens nothing, because the server never registered completion; REQ4's "not supported" message would appear on `<C-Space>`.

**Tradeoffs and Limitations:**

- Advertising snippets and flattening them keeps REQ9's "no placeholder state" goal but means parsing snippet grammar (tabstops, placeholders, choices, variables, escapes).
- The TS 7 server's snippet behaviour was not examined.

**Reconciliation Considerations:**

- Decide JSON completion: none, flattened snippets, or no JSON built-in.
- Add `item.command` execution after accept to REQ9, or state that it is ignored.
- State the exact `resolveSupport.properties` the client advertises (for example `documentation`, `detail`, `additionalTextEdits`).

## RF8: Completion trigger timing in mature clients

**Question:** Completion — what debounce and trigger behaviour do Neovim, Helix, blink.cmp, and nvim-cmp use?

**Finding:** REQ8's 150 ms pause and one-character minimum sit inside the range used by mature clients. Neovim's built-in LSP autotrigger fires only on server trigger characters by default (identifier typing needs extra setup) and debounces adaptively from measured round-trip time. Helix waits 250 ms after a word character with a two-character minimum. nvim-cmp debounces 60 ms and throttles 30 ms. blink.cmp shows on every keyword character with no debounce and caps resolve at 100 ms.

**Requirements Evaluated:**

- `W261005GWLY-REQ8@R1` — trigger characters, 150 ms pause on ≥ 1 identifier char, `<C-Space>`, client-side filtering, re-request on `isIncomplete`.
- `W261005GWLY-REQ14@R1` — completion requests cancelled when superseded.

**Potential Requirement Impact:** Supports REQ8's timing as a reasonable middle value. Supports filtering on the client and re-requesting only on `isIncomplete`, which Neovim also does.

**Evidence:**

- Neovim: autotrigger on "any of the server-defined `triggerCharacters`"; to trigger on every keypress, extend trigger characters or call `get()` from `InsertCharPre` — [lsp/completion.lua L1-31](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/completion.lua#L1-L31); `adaptive_debounce` derives the delay from request round-trip time — [L135-146](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/completion.lua#L135-L146); 0.12 adds the `'autocomplete'` option — [news.txt L325](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/news.txt#L325).
- Helix: `completion-timeout` 250 ms ("after typing a word character"), `completion-trigger-len` 2, `idle-timeout` 250 ms — [book editor.md L47-50](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/book/src/editor.md).
- nvim-cmp defaults: `debounce = 60`, `throttle = 30`, `fetching_timeout = 500`, `keyword_length = 1` — [nvim-cmp config/default.lua L20-47](https://github.com/hrsh7th/nvim-cmp/blob/2ffe79f1f021def8dd1fcd81deb16f1bb0d989f3/lua/cmp/config/default.lua#L20-L47).
- blink.cmp defaults: `show_on_keyword = true`, `show_on_trigger_character = true`, `resolve_timeout_ms = 100` — [blink.cmp reference.md L70-73, L143](https://github.com/saghen/blink.cmp/blob/8219b58f1c11a2fb1644d3c7116c509fa8348ec0/doc/configuration/reference.md).

**Rationale and Examples:** None — the comparison above is the finding.

**Tradeoffs and Limitations:**

- None of these sources measures user preference; the values are maintainers' defaults.

**Reconciliation Considerations:**

- Consider a resolve timeout (blink.cmp: 100 ms) so a slow `completionItem/resolve` cannot delay accepting an item; REQ9 currently waits for resolve without a bound.

## RF9: Workspace edits, versions, and missing resource operations

**Question:** Workspace edits — how do Neovim and Helix apply edits to closed files and handle version mismatches, change annotations, and resource operations; what happens when the client advertises none?

**Finding:** REQ10's version rule matches the specification and Helix (refuse when the version differs). Its closed-file handling differs from both clients: Neovim and Helix load closed files into buffers and leave them unsaved, while REQ10 writes them atomically. That is a defensible choice, but undo then covers only open buffers. Both clients advertise all three resource operations. With `resourceOperations: []`, rust-analyzer fails the whole `textDocument/rename` when renaming a module whose file must move. It also fails the whole `textDocument/codeAction` list if any listed action creates or moves a file, unless the client advertises code-action `resolveSupport` for `edit` so edits are computed lazily.

**Requirements Evaluated:**

- `W261005GWLY-REQ10@R1` — buffer edits for open files, atomic writes for closed files, refuse mismatched versions, `resourceOperations: []`, one summary toast.
- `W261005GWLY-REQ13@R1` — `grn`/`gra` keys.

**Potential Requirement Impact:** Supports REQ10's version refusal. Constrains `resourceOperations: []`: REQ10's "Choosing one resolves it when needed" should be tied to advertising `codeAction.resolveSupport.properties = ["edit"]`, or `gra` can fail entirely in Rust files. Module rename in Rust will fail with the server's message. Adds considerations on `failureHandling` (REQ10 behaves like `abort` for version mismatch but "skip that file" for out-of-range closed files, which is neither `abort` nor `transactional`) and on `changeAnnotations` with `needsConfirmation`.

**Evidence:**

- Spec: `documentChanges` are preferred when the client supports versioned edits; each `TextDocumentEdit` addresses a version so clients can check it; `failureHandling` is one of `abort`, `transactional`, `textOnlyTransactional`, `undo`; `ApplyWorkspaceEditResult` has `applied`, `failureReason`, `failedChange` — [LSP 3.18: WorkspaceEdit](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#workspaceEdit), [TextDocumentEdit](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#textDocumentEdit), [workspace/applyEdit](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#workspace_applyEdit).
- Neovim: `uri_to_bufnr` loads closed files as buffers; a version check skips a document edit with "Buffer … newer than edits." (only for the first edit in a list); resource operations `rename`/`create`/`delete` are executed — [lsp/util.lua L535-547, L718-753](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/util.lua#L535-L547); capabilities `resourceOperations = { 'rename', 'create', 'delete' }`, `changeAnnotationSupport = { groupsOnLabel = true }` — [protocol.lua L599-603](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/protocol.lua#L599-L603); 0.12 adds "Support for annotated text edits" — [news.txt L271](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/news.txt#L271).
- Helix: opens the file (`Action::Load`), returns `DocumentChanged` when `version != doc.version()`, and notes "TODO make this transactional"; advertises `document_changes`, resource ops `Create`/`Rename`/`Delete`, `failure_handling: Abort`, no change-annotation support — [helix-view handlers/lsp.rs L104-139](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/helix-view/src/handlers/lsp.rs#L104-L139), [helix-lsp client.rs L606-616](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/helix-lsp/src/client.rs#L606-L616).
- rust-analyzer: `resource_ops_supported` returns `RequestFailed` "Client does not support {create|rename|delete} capability."; called for every change in `handle_rename` and for each action's edit in `handle_code_action` (edits are only built there when the client lacks code-action resolve) — [handlers/request.rs L1421-1427, L1540-1554, L2710-2726](https://github.com/rust-lang/rust-analyzer/blob/667b817189625f373f0e29e4cc12dee18eed07e6/crates/rust-analyzer/src/handlers/request.rs#L2710-L2726).
- Neovim advertises code-action `resolveSupport.properties = { 'edit', 'command' }`, and Helix does the same — [protocol.lua L445-447](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/protocol.lua#L445-L447), [helix-lsp client.rs L707-709](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/helix-lsp/src/client.rs#L707-L709).

**Rationale and Examples:**

```text
gra in foo.rs, client: resourceOperations [], no codeAction resolveSupport
  → rust-analyzer builds every assist's edit; "Extract module to file" needs CreateFile
  → whole request errors "Client does not support create capability." → no actions shown

same, with codeAction resolveSupport ["edit"]
  → list returns without edits → user picks an action that only edits text → resolve → applies
  → user picks "Extract module to file" → resolve errors → one action fails, the rest still work
```

**Tradeoffs and Limitations:**

- Advertising resource operations would require file create/rename/delete through the serial queue and index updates, which REQ10 deliberately excludes.
- The per-server impact was confirmed in rust-analyzer source only; TypeScript "Move to file" and other servers' behaviour without resource operations were not traced.

**Reconciliation Considerations:**

- Make code-action `resolveSupport` with `edit` part of REQ10, so `[]` resource operations fail per action, not per list.
- State the failure mode: one atomic all-or-nothing apply (`transactional`) or per-file skip, and report it in the `workspace/applyEdit` response (`applied`, `failureReason`).
- Decide how `changeAnnotations` with `needsConfirmation: true` are treated (advertise no support, or confirm).

## RF10: Watched files and the app's own writes

**Question:** Workspace edits and REQ4's `didChangeWatchedFiles` — how do clients feed file events to servers?

**Finding:** Servers learn about disk changes through `workspace/didChangeWatchedFiles`, after registering glob watchers with `client/registerCapability`. Neovim advertises dynamic registration on macOS and Windows only, because its Linux watcher backends were "too limited". Two project facts limit what REQ4 can deliver. First, `so`'s watcher drops events for `so`'s own writes, so the closed files that REQ10 writes atomically would never reach servers as changes. Second, the watcher excludes dot entries, `node_modules`, and gitignored paths, so changes to `.clangd`, `.clang-format`, or `node_modules/*/package.json` are never reported.

**Requirements Evaluated:**

- `W261005GWLY-REQ4@R1` — watcher changes reach every server that registered for them.
- `W261005GWLY-REQ10@R1` — closed files written on the serial queue.

**Potential Requirement Impact:** Adds a consideration to REQ10/REQ4: after writing a closed file, the client must notify servers itself, through `didChangeWatchedFiles` or by syncing the file as a document, or servers keep stale contents for it. Constrains REQ4: "changes reported by the watcher" excludes hidden and ignored paths, so registered patterns for such paths will not fire.

**Evidence:**

- Spec: servers should register file-system watchers dynamically; `relativePatternSupport` exists — [LSP 3.18: didChangeWatchedFiles](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#workspace_didChangeWatchedFiles).
- Neovim: `didChangeWatchedFiles.dynamicRegistration = sysname == 'Darwin' or sysname == 'Windows_NT'` with a TODO noting Linux backends are "too limited" — [protocol.lua L608-614](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/protocol.lua#L608-L614); docs: enabled "(except on Linux)" — [lsp.txt L101-110](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/lsp.txt#L101-L110).
- Helix configures rust-analyzer with `files.watcher = "server"` (the server watches itself) — [languages.toml L252-253](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/languages.toml#L252-L253).
- Project: `watchWorkspace` drops "Excluded paths and `so`'s own operations" (`src/workspace/watcher.ts:61-87`); exclusions include any dot segment or `node_modules` (`src/workspace/ignore.ts:12-14`, `:37`).

**Rationale and Examples:**

```text
grn in a.ts renames symbol used in closed b.ts
  → serial queue writes b.ts atomically → watcher: own op → dropped
  → server still holds old b.ts → diagnostics in a.ts reference the old name until restart
```

**Tradeoffs and Limitations:**

- Servers such as rust-analyzer can watch files themselves when told to; this shifts work to the server and is configurable per server.

**Reconciliation Considerations:**

- Add to REQ10 that every closed file written by an LSP edit is announced to running servers.
- State REQ4's coverage limits (hidden and ignored paths) or decide whether LSP watching uses a different exclusion rule.

## RF11: Formatting timeouts, autosave, and options

**Question:** Formatting — how do mature clients handle format on save, timeouts, autosave, `willSaveWaitUntil`, and `FormattingOptions`?

**Finding:** REQ11 matches current practice. Neovim's synchronous format and conform.nvim both default to 1000 ms. VS Code removed its 750 ms format-on-save timeout in 1.42 (January 2020) in favour of a cancellable progress notification, and does not format saves made by "after delay" autosave. Neovim derives `tabSize` from the effective tabstop and `insertSpaces` from `expandtab`. Neovim sends `willSaveWaitUntil` with a 1000 ms timeout, but none of the inspected servers (TS 7, gopls, clangd, rust-analyzer) advertises it. gopls has no range formatting, and the JSON server formats only with `provideFormatter` (RF3).

**Requirements Evaluated:**

- `W261005GWLY-REQ11@R1` — `:Format`/range format as one undo step, `formatOnSave` only on explicit `:w`, 1000 ms bound, `tabSize`/`insertSpaces` derivation.

**Potential Requirement Impact:** Supports REQ11's 1000 ms bound, explicit-save-only rule, and option derivation. Adds two considerations: visual-range `:Format` reports "not supported" for gopls (REQ4's message), and `willSaveWaitUntil` can be left out without losing server features.

**Evidence:**

- Neovim `vim.lsp.buf.format`: `local timeout_ms = opts.timeout_ms or 1000` — [lsp/buf.lua L684](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/buf.lua#L684); `make_formatting_params`: `tabSize = M.get_effective_tabstop(), insertSpaces = vim.bo.expandtab` — [lsp/util.lua L2251-2256](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/util.lua#L2251-L2256); `willSaveWaitUntil` via `request_sync(…, 1000, …)` — [lsp.lua L927-929](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp.lua#L927-L929).
- conform.nvim: `timeout_ms` "Defaults to 1000"; its example `format_on_save` uses 500 — [conform.txt L47, L177-178](https://github.com/stevearc/conform.nvim/blob/016802de402556da54c36bd7359b441266b01cdd/doc/conform.txt).
- VS Code 1.22 added a 750 ms format-on-save timeout; 1.42 removed timeouts for save participants and shows a cancellable progress notification — [VS Code 1.22 release notes](https://code.visualstudio.com/updates/v1_22), [VS Code 1.42 release notes](https://code.visualstudio.com/updates/v1_42).
- VS Code `editor.formatOnSave`: "the file must not be saved after delay, and the editor must not be shutting down" — [microsoft/vscode#230051](https://github.com/microsoft/vscode/issues/230051).
- Helix: `auto-format` (format on save) default `true`; per-server request `timeout` default 20 s — [book editor.md L46](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/book/src/editor.md), [book languages.md L193](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/book/src/languages.md).
- gopls advertises `DocumentFormattingProvider` but no range provider — [general.go L210](https://github.com/golang/tools/blob/3f3efb7c3b31192232c67403b23a00bfcdbc3eec/gopls/internal/server/general.go#L210); clangd advertises range formatting and `rangesFormatting` — [ClangdLSPServer.cpp L593, L1690](https://github.com/llvm/llvm-project/blob/c525b47caabb9c461caddcf5791ba38fde580437/clang-tools-extra/clangd/ClangdLSPServer.cpp#L593).
- Project: autosave runs after `autosave.delayMs`, default 1000 (`src/core/config/schema.ts:54-57`).

**Rationale and Examples:** None — the comparison above is the finding.

**Tradeoffs and Limitations:**

- `willSaveWaitUntil` support was checked by grepping server capability code for four servers; pyright and the JSON server were not checked.

**Reconciliation Considerations:**

- Optionally state that `willSaveWaitUntil` is not sent (or is bounded by the same 1000 ms).
- REQ11's "tabs when an indented line starts with a tab" is a heuristic; Neovim uses the buffer's `expandtab`. `so` has no per-buffer `expandtab`, so the heuristic stands unless such a setting exists.

## RF12: Lifecycle, restart, and position encoding

**Question:** Lifecycle and roots — shutdown timing, crash-restart policies, `processId` semantics, and position-encoding negotiation.

**Finding:** REQ12's lifecycle is consistent with the spec and stricter than VS Code on restarts. The spec recommends restarting a crashed server but not endlessly, citing VS Code's "5 times in 180 seconds" (`vscode-languageclient` default `maxRestartCount` 4 within 3 minutes). Neovim does not auto-restart. Helix sends `shutdown` and `exit` without waiting for the reply, waits at most 1000 ms for the writes to flush, then kills. Neovim's `exit_timeout` defaults to `false` (no force-kill). `processId` lets servers exit when the parent dies, and the TS 7 server runs a watchdog on it. Every built-in accepts UTF-16; rust-analyzer and the TS 7 server prefer UTF-8 when offered, and clangd's `offsetEncoding` extension is deprecated in favour of `general.positionEncodings`.

**Requirements Evaluated:**

- `W261005GWLY-REQ12@R1` — restart once then unavailable; `processId`; shutdown and exit within 500 ms, then kill.
- `W261005GWLY-REQ3@R1` — `✗` after the final failure.

**Potential Requirement Impact:** Supports REQ12's bounded shutdown (Helix uses the same fire-and-kill pattern with a 1000 ms cap) and the use of `processId`. Restart-once is stricter than VS Code's 4 restarts in 3 minutes. That suits a terminal app and mirrors the index host, but a server that crashes twice in a long session (for example, once per day) is then disabled; a time window is the industry pattern. Supports advertising only `utf-16`, which matches `Pos` (`src/core/kernel/text/pos.ts:1-2`).

**Evidence:**

- Spec: "Clients must not send any requests or notifications other than `exit` to a server to which they have sent a shutdown request"; server exits with 0 if `shutdown` was received, else 1; "if a client notices that a server exits unexpectedly, it should try to restart the server … VS Code … doesn't restart a server which has crashed 5 times in the last 180 seconds"; `processId`: "If the parent process is not alive then the server should exit" — [LSP 3.18: shutdown](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#shutdown), [exit](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#exit), [Implementation Considerations](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#implementationConsiderations), [initialize](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#initialize).
- `vscode-languageclient` `DefaultErrorHandler`: restarts while `restarts.length <= maxRestartCount`; message "crashed {max+1} times in the last 3 minutes. The server will not be restarted."; default `maxRestartCount ?? 4`; `stop(timeout = 2000)` — [client.ts L450-475, L1181, L1591](https://github.com/microsoft/vscode-languageserver-node/blob/2d1773893617b1b9d585d5ba527578b196433839/client/src/common/client.ts#L450-L475).
- Neovim: `exit_timeout` default `false` ("Nvim will not force-stop LSP server(s)"); on `VimLeavePre` it calls `client:stop(exit_timeout)` and waits up to the largest timeout; a crashed client only notifies "quit with exit code …" — [lsp.txt L1855-1865](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/lsp.txt#L1855-L1865), [lsp.lua L1178-1207](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp.lua#L1178-L1207), [lsp/client.lua L1427-1456](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/client.lua#L1427-L1456); `processId = uv.os_getpid()` — [client.lua L548](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/client.lua#L548).
- Helix `force_shutdown` sends `shutdown` then `exit` "without waiting for the shutdown response", and `close_language_servers` caps the flush wait at `timeout.unwrap_or(1000)` ms before `kill_on_drop` — [helix-lsp client.rs L795-804](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/helix-lsp/src/client.rs#L795-L804), [helix-view editor.rs L2440-2466](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/helix-view/src/editor.rs#L2440-L2466).
- Encodings: spec says UTF-16 is mandatory and the default — [LSP 3.18: positionEncodings](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#clientCapabilities); rust-analyzer "intentionally prefer just about anything else to utf-16" but falls back to it — [capabilities.rs L292-308](https://github.com/rust-lang/rust-analyzer/blob/667b817189625f373f0e29e4cc12dee18eed07e6/crates/rust-analyzer/src/lsp/capabilities.rs#L292-L308); TS 7 server picks UTF-8 if offered, else UTF-16 — [server.go L1534-1537](https://github.com/microsoft/typescript-go/blob/89d5d5b2849a0db0957065889ca58536fa6d2e4a/internal/lsp/server.go#L1534-L1537); clangd: "offsetEncoding capability is a deprecated clangd extension that'll go away with clangd 23" — [clangd Protocol.cpp](https://github.com/llvm/llvm-project/blob/c525b47caabb9c461caddcf5791ba38fde580437/clang-tools-extra/clangd/Protocol.cpp); Neovim offers `utf-8, utf-16, utf-32`, Helix `UTF8, UTF32, UTF16` — [protocol.lua L347-351](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/protocol.lua#L347-L351), [helix-lsp client.rs L757-761](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/helix-lsp/src/client.rs#L757-L761).

**Rationale and Examples:** REQ12's "within 500 ms in total, then kill" is half Helix's cap. Strictly following the spec ("wait with sending `exit` until … received a response") is only possible within the bound; Helix knowingly skips the wait.

**Tradeoffs and Limitations:**

- Neovim's "no force-kill" default relies on servers exiting on stdin EOF or `processId`; that is not a guarantee, which is why REQ12's kill step is reasonable.
- Offering UTF-8 would avoid server-side conversion in rust-analyzer but would require converting `so`'s UTF-16 columns; UTF-16-only has no correctness cost.

**Reconciliation Considerations:**

- Decide whether restart-once becomes "N restarts within a time window" (VS Code: 4 in 3 minutes).
- Decide whether `exit` is sent right after `shutdown` (Helix) or after its reply within the 500 ms bound.

## RF13: Neovim 0.12 keys, gd, and progress display

**Question:** Keys and UX — what are the Neovim 0.11/0.12 default LSP mappings, is `gd` one of them, and how do Neovim and Helix show progress?

**Finding:** REQ13's key list matches Neovim's global defaults except in two ways. `gd` is not an LSP default: Neovim sets `'tagfunc'` so `CTRL-]` goes to definition, and `gd` stays Vim's "go to local declaration". Neovim 0.12 (current stable, 0.12.5) adds `grt` (type definition), `grx` (code lens), and `]D`/`[D` (last and first diagnostic). `K` is buffer-local and only set when no `K` mapping or custom `keywordprg` exists. Neovim 0.12's default statusline shows diagnostic counts and LSP progress. Helix hides progress messages by default and shows a spinner. To receive server progress, the client must advertise `window.workDoneProgress` and answer `window/workDoneProgress/create`.

**Requirements Evaluated:**

- `W261005GWLY-REQ13@R1` — "Neovim 0.11's defaults: `K`, `gd`, `grr`, `gri`, `gO`, `grn`, `gra`, `]d`/`[d`, `<C-w>d`, insert `<C-s>`".
- `W261005GWLY-REQ3@R1` — statusline progress from `$/progress`.
- `W261005GWLY-REQ6@R1` — `]d` wraps; held in insert mode.

**Potential Requirement Impact:** Supports REQ13's set as a description of Neovim's defaults, with `gd` labelled as a convention rather than a default (it is a common `LspAttach` mapping, and the project already binds `gd` in Markdown). Adds an optional consideration for `grt` (type definition is not in REQ4's feature list) and `]D`/`[D`. Supports REQ6: `wrap` defaults to `true`, `update_in_insert` defaults to `false`, `virtual_text` is off, and signs and underline are on. Supports REQ3's statusline approach and adds the `workDoneProgress/create` handling requirement.

**Evidence:**

- Neovim 0.12.5 global maps: `grn` rename, `gra` (n, x) code action, `grx` codelens, `grr` references, `gri` implementation, `grt` type definition, `gO` document symbols, `<C-S>` (i, s) signature help; `]d`/`[d`, `]D`/`[D`, `<C-W>d` — [_core/defaults.lua L204-235, L263-287](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/_core/defaults.lua#L204-L287); docs list the same — [lsp.txt L77-97](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/lsp.txt#L77-L97).
- Buffer-local: `'tagfunc'` set for go-to-definition via `CTRL-]`; `K` mapped to hover "unless 'keywordprg' is customized or a custom keymap for `K` exists" — [lsp.txt L113-122](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/lsp.txt#L113-L122).
- 0.12 news: `grt`, `grx` mappings; default statusline shows `vim.diagnostic.status()` and `vim.ui.progress_status()` — [news.txt L143-152](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/news.txt#L143-L152).
- Diagnostic defaults: `wrap` true, `update_in_insert` false ("updated on InsertLeave"), `virtual_text` false, `signs` true, `underline` true — [diagnostic.txt L519, L553-568](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/diagnostic.txt#L519).
- Neovim advertises `window.workDoneProgress = true` — [protocol.lua L636](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/protocol.lua#L636); Helix `display-progress-messages` default `false`, `display-messages` (showMessage) default `true` — [book editor.md L169-170](https://github.com/helix-editor/helix/blob/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc/book/src/editor.md).
- Spec: server-initiated progress uses `window/workDoneProgress/create` before `$/progress` — [LSP 3.18: WorkDoneProgress](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#serverInitiatedProgress).
- Project: `so`'s vim behaviour is recorded from Neovim 0.11.x (`project.md:147`), and Markdown `gd` is file-type scoped (`src/core/state/link-commands.ts:196-201`, per `w261005gwly-discuss-context.md:93`).

**Rationale and Examples:** None — the evidence above is the finding.

**Tradeoffs and Limitations:**

- `so` follows Neovim 0.11 for vim keys; 0.12 additions are optional, not binding.

**Reconciliation Considerations:**

- Reword REQ13's rationale so `gd` is described as a convention, not a Neovim default.
- Decide whether `grt` and type definition join the feature list; if not, keep them in Out of Scope.
- Add `window.workDoneProgress` and the `create` request to REQ3.

## RF14: didChange debounce is a rate limit with flush

**Question:** Performance and sync — Neovim's didChange debounce, sync kind defaults, request cancellation, and typing-latency evidence.

**Finding:** REQ14's 150 ms and "send before any request" match Neovim, but Neovim's debounce is a rate limit: the first change after 150 ms of quiet is sent at once, and later changes are batched until 150 ms after that send. Neovim flushes pending changes before every request and every other notification, and uses incremental sync by default. The spec recommends cancelling a request whose result became useless, and says `ContentModified` errors should not be shown to users. No authoritative typing-latency budget for LSP clients was found beyond `so`'s own 16 ms target.

**Requirements Evaluated:**

- `W261005GWLY-REQ14@R1` — changes sent at most every 150 ms and before any request; version-checked results; `$/cancelRequest`; 5 s timeout with a message; acceptance "Ten keys typed within 150 ms produce one `didChange`".
- `W261005GWLY-REQ12@R1` — incremental, debounced `didChange`.

**Potential Requirement Impact:** Supports REQ14's interval, flush-before-request, and cancellation. Challenges the acceptance criterion only if the design copies Neovim's leading-edge rate limit, which would produce two `didChange` for ten keys after idle; a trailing debounce produces one. Adds a consideration that `ContentModified` (and `RequestCancelled`) errors should not produce the 5 s timeout message or any toast.

**Evidence:**

- Neovim: `debounce_text_changes` default 150; `allow_incremental_sync` default `true` — [lsp.txt L1866-1873](https://github.com/neovim/neovim/blob/v0.12.5/runtime/doc/lsp.txt#L1866-L1873); `next_debounce` returns `max(debounce - ms_since_last_flush, 0)`, "This turns the debounce into a kind of client rate limiting" — [_changetracking.lua L272-291](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/_changetracking.lua#L272-L291); `Client:request` calls `changetracking.flush` first ("so that the server doesn't operate on a stale state"), and `Client:notify` flushes for any method except `didChange` — [client.lua L731-732, L830-833](https://github.com/neovim/neovim/blob/v0.12.5/runtime/lua/vim/lsp/client.lua#L731-L732).
- Spec Implementation Considerations: cancel and ignore results that are no longer useful; "If clients receive a `ContentModified` error, they generally should not show it in the UI" — [LSP 3.18: Implementation Considerations](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#implementationConsiderations).
- All six servers, and the TS 7 server, advertise incremental sync (rust-analyzer, gopls, clangd, JSON, TS 7 verified in source) — [capabilities.rs L36-38](https://github.com/rust-lang/rust-analyzer/blob/667b817189625f373f0e29e4cc12dee18eed07e6/crates/rust-analyzer/src/lsp/capabilities.rs#L36-L38), [general.go L232-233](https://github.com/golang/tools/blob/3f3efb7c3b31192232c67403b23a00bfcdbc3eec/gopls/internal/server/general.go#L232-L233), [ClangdLSPServer.cpp L589](https://github.com/llvm/llvm-project/blob/c525b47caabb9c461caddcf5791ba38fde580437/clang-tools-extra/clangd/ClangdLSPServer.cpp#L589), [jsonServer.ts L185](https://github.com/microsoft/vscode/blob/cd97b0dff8f0b661089d2e2524aad22710b3c695/extensions/json-language-features/server/src/jsonServer.ts#L185), [typescript-go server.go L1558](https://github.com/microsoft/typescript-go/blob/89d5d5b2849a0db0957065889ca58536fa6d2e4a/internal/lsp/server.go#L1558).

**Rationale and Examples:**

```text
t=0     key 1 (idle before)  → Neovim: didChange sent now         trailing debounce: timer starts
t=10…90 keys 2–10            → batched                            batched
t=150                        → Neovim: second didChange           trailing: one didChange
```

**Tradeoffs and Limitations:**

- A leading edge gives servers the first change sooner (faster first diagnostics); a trailing debounce sends fewer messages.

**Reconciliation Considerations:**

- Pick leading-edge rate limit or trailing debounce explicitly, and align the REQ14 acceptance criterion with it.
- Exclude `ContentModified`/`RequestCancelled` from user-visible errors.

## RF15: Fake-server testing patterns

**Question:** Testing — how do Neovim and the vscode-languageserver-node ecosystem test LSP clients without real servers?

**Finding:** REQ15's scripted stdio fake server is the pattern Neovim itself uses. Neovim runs `test/functional/fixtures/fake-lsp-server.lua`, a stdio server that selects a script by test name and asserts the exact sequence of requests and notifications (`expect_request`, `expect_notification`). It also has an in-process server definition that records every message it receives and answers `initialize` and `shutdown` by default. The vscode-languageserver-node project tests `vscode-jsonrpc` over in-memory duplex streams. Helix was not found to have an equivalent fake-server suite.

**Requirements Evaluated:**

- `W261005GWLY-REQ15@R1` — scripted fake server over stdio, message recording, no leftover processes, local-only real-server smoke test.

**Potential Requirement Impact:** Supports REQ15 as written. Adds an option: in-memory streams for unit tests of the host and protocol mapping, with the stdio fake kept for integration and PTY tests.

**Evidence:**

- Neovim fixtures list `fake-lsp-server.lua` (1,102 lines) with `read_message`, `respond`, `notify`, `expect_notification`, `expect_request`, and a `skeleton` that expects `initialize` — [fake-lsp-server.lua](https://github.com/neovim/neovim/blob/v0.12.5/test/functional/fixtures/fake-lsp-server.lua); test util `create_server_definition` stores `server.messages` and answers `initialize`/`shutdown`; `fake_lsp_server_setup(test_name, …)` — [plugin/lsp/testutil.lua L67-143](https://github.com/neovim/neovim/blob/v0.12.5/test/functional/plugin/lsp/testutil.lua#L67-L143).
- `vscode-jsonrpc` tests create connections over `TestDuplex` streams — [jsonrpc/src/node/test/connection.test.ts](https://github.com/microsoft/vscode-languageserver-node/blob/2d1773893617b1b9d585d5ba527578b196433839/jsonrpc/src/node/test/connection.test.ts).
- Project: CI has no language servers (`w261005gwly-discuss-context.md:48`), and only rust-analyzer exists locally (`:49`).

**Rationale and Examples:** None — REQ15 already matches the pattern.

**Tradeoffs and Limitations:**

- A fake server proves the client follows its own reading of the protocol; RF6, RF7, and RF9 show real servers branch on client capabilities. The local smoke test covers only rust-analyzer.

**Reconciliation Considerations:**

- Consider fake-server scripts that reproduce the real behaviours found here: pull-only diagnostics (TS 7), no completion without snippets (JSON), and `RequestFailed` on missing resource operations (rust-analyzer).

# 3. Sources

## External Sources

1. **nvim-lspconfig `lsp/*.lua` (ts_ls, tsc, tsgo, pyright, basedpyright, gopls, rust_analyzer, clangd, jsonls)** — Neovim project
   - URL: https://github.com/neovim/nvim-lspconfig/tree/910f0c4d46aa186641518395bc7e6fffb4d23baf/lsp
   - Published or updated: commit 910f0c4, 2026-10-05
   - Accessed: 2026-10-05
   - Supports: `RF1`, `RF2`, `RF3`, `RF4`, `RF7`, `RF12`
   - Authority: the maintained default server configs for Neovim's built-in client

2. **Neovim runtime (`lsp.txt`, `diagnostic.txt`, `news.txt`, `_core/defaults.lua`, `lsp/*.lua`) and functional tests** — Neovim project
   - URL: https://github.com/neovim/neovim/tree/v0.12.5/runtime
   - Published or updated: v0.12.5, 2026-08-23
   - Accessed: 2026-10-05
   - Supports: `RF3`, `RF4`, `RF6`, `RF7`, `RF8`, `RF9`, `RF10`, `RF11`, `RF12`, `RF13`, `RF14`, `RF15`
   - Authority: source and reference docs of the current stable Neovim release

3. **Helix `languages.toml`, book (`editor.md`, `languages.md`), `helix-lsp`, `helix-view`** — Helix project
   - URL: https://github.com/helix-editor/helix/tree/ba40e547426b0f9896c8bdc699a4ab11f2b37dbc
   - Published or updated: commit ba40e54, 2026-09-29 (latest release 25.07.1)
   - Accessed: 2026-10-05
   - Supports: `RF1`, `RF2`, `RF3`, `RF4`, `RF6`, `RF7`, `RF8`, `RF9`, `RF10`, `RF11`, `RF12`, `RF13`
   - Authority: source and docs of a mature built-in LSP client

4. **Language Server Protocol Specification 3.18** — Microsoft
   - URL: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/
   - Published or updated: 3.18.0 released 2026-06-04; source commit f8c4bc9 (2026-10-01)
   - Accessed: 2026-10-05
   - Supports: `RF3`, `RF5`, `RF9`, `RF10`, `RF12`, `RF13`, `RF14`
   - Authority: the normative protocol specification

5. **microsoft/typescript-go `internal/lsp/server.go`, `internal/project/session.go`** — Microsoft
   - URL: https://github.com/microsoft/typescript-go/tree/89d5d5b2849a0db0957065889ca58536fa6d2e4a/internal
   - Published or updated: commit 89d5d5b, 2026-08-20
   - Accessed: 2026-10-05
   - Supports: `RF1`, `RF6`, `RF12`, `RF14`
   - Authority: source of the TypeScript 7 language server

6. **typescript-language-server README, CHANGELOG, `src/completion.ts`, issue #1110** — typescript-language-server maintainers
   - URL: https://github.com/typescript-language-server/typescript-language-server
   - Published or updated: 6.0.1, 2026-09-24
   - Accessed: 2026-10-05
   - Supports: `RF1`, `RF7`
   - Authority: the server's own repository

7. **npm registry metadata** (`typescript`, `typescript-language-server`, `pyright`, `vscode-jsonrpc`, `vscode-languageserver-protocol`, `vscode-languageserver-types`, `vscode-langservers-extracted`) — npm, Inc.
   - URL: https://www.npmjs.com/
   - Published or updated: per package, as listed in the findings
   - Accessed: 2026-10-05 (`npm view`)
   - Supports: `RF1`, `RF2`, `RF5`
   - Authority: the publishing registry

8. **PyPI JSON metadata** (`basedpyright`, `pyright`, `ty`, `ruff`) — Python Software Foundation
   - URL: https://pypi.org/
   - Published or updated: per package, as listed in RF2
   - Accessed: 2026-10-05
   - Supports: `RF2`
   - Authority: the publishing registry

9. **rust-analyzer `lsp/capabilities.rs`, `main_loop.rs`, `handlers/request.rs`** — rust-lang
   - URL: https://github.com/rust-lang/rust-analyzer/tree/667b817189625f373f0e29e4cc12dee18eed07e6/crates/rust-analyzer/src
   - Published or updated: commit 667b817, accessed tip
   - Accessed: 2026-10-05
   - Supports: `RF6`, `RF7`, `RF9`, `RF12`, `RF14`
   - Authority: server source

10. **pyright `languageServerBase.ts`** — Microsoft
    - URL: https://github.com/microsoft/pyright/blob/3a024b2f4fb1949d44ee6c575ec6e73def9ae529/packages/pyright-internal/src/languageServerBase.ts
    - Published or updated: commit 3a024b2
    - Accessed: 2026-10-05
    - Supports: `RF3`, `RF6`, `RF7`
    - Authority: server source

11. **gopls `internal/server/general.go`, `doc/features/diagnostics.md`** — Go team
    - URL: https://github.com/golang/tools/tree/3f3efb7c3b31192232c67403b23a00bfcdbc3eec/gopls
    - Published or updated: commit 3f3efb7
    - Accessed: 2026-10-05
    - Supports: `RF6`, `RF7`, `RF11`, `RF14`
    - Authority: server source and docs

12. **clangd `ClangdLSPServer.cpp`, `Protocol.cpp`** — LLVM project
    - URL: https://github.com/llvm/llvm-project/tree/c525b47caabb9c461caddcf5791ba38fde580437/clang-tools-extra/clangd
    - Published or updated: commit c525b47
    - Accessed: 2026-10-05
    - Supports: `RF6`, `RF7`, `RF11`, `RF12`, `RF14`
    - Authority: server source

13. **vscode JSON language server `jsonServer.ts`** — Microsoft
    - URL: https://github.com/microsoft/vscode/blob/cd97b0dff8f0b661089d2e2524aad22710b3c695/extensions/json-language-features/server/src/jsonServer.ts
    - Published or updated: file last changed 2026-04-13
    - Accessed: 2026-10-05
    - Supports: `RF3`, `RF6`, `RF7`, `RF14`
    - Authority: server source

14. **vscode-languageserver-node (`client/src/common/client.ts`, `jsonrpc/src/common/connection.ts`, jsonrpc tests)** — Microsoft
    - URL: https://github.com/microsoft/vscode-languageserver-node/tree/2d1773893617b1b9d585d5ba527578b196433839
    - Published or updated: last commit 2026-10-02
    - Accessed: 2026-10-05
    - Supports: `RF5`, `RF12`, `RF15`
    - Authority: reference client and JSON-RPC implementation

15. **Bun issues #4635 and #18008** — oven-sh/bun
    - URL: https://github.com/oven-sh/bun/issues/4635, https://github.com/oven-sh/bun/issues/18008
    - Published or updated: #4635 closed 2023-10-16; #18008 updated 2026-09-13
    - Accessed: 2026-10-05
    - Supports: `RF5`
    - Authority: runtime issue tracker

16. **Helix discussion #10851: "Unknown binary 'rust-analyzer' in official toolchain"** — Helix community
    - URL: https://github.com/helix-editor/helix/discussions/10851
    - Published or updated: Unknown
    - Accessed: 2026-10-05
    - Supports: `RF2`
    - Authority: user report in a client project, consistent with several other projects' issues found in the same search

17. **nvim-cmp `config/default.lua`** — hrsh7th
    - URL: https://github.com/hrsh7th/nvim-cmp/blob/2ffe79f1f021def8dd1fcd81deb16f1bb0d989f3/lua/cmp/config/default.lua
    - Published or updated: commit 2ffe79f
    - Accessed: 2026-10-05
    - Supports: `RF8`
    - Authority: plugin source defaults

18. **blink.cmp configuration reference** — saghen
    - URL: https://github.com/saghen/blink.cmp/blob/8219b58f1c11a2fb1644d3c7116c509fa8348ec0/doc/configuration/reference.md
    - Published or updated: commit 8219b58
    - Accessed: 2026-10-05
    - Supports: `RF8`
    - Authority: plugin's own reference docs

19. **conform.nvim `doc/conform.txt`** — stevearc
    - URL: https://github.com/stevearc/conform.nvim/blob/016802de402556da54c36bd7359b441266b01cdd/doc/conform.txt
    - Published or updated: commit 016802d
    - Accessed: 2026-10-05
    - Supports: `RF11`
    - Authority: plugin's own docs

20. **VS Code release notes 1.22 (March 2018) and 1.42 (January 2020)** — Microsoft
    - URL: https://code.visualstudio.com/updates/v1_22, https://code.visualstudio.com/updates/v1_42
    - Published or updated: 2018-04, 2020-02
    - Accessed: 2026-10-05 (via search results)
    - Supports: `RF11`
    - Authority: official release notes

21. **microsoft/vscode#230051: "Confusing settings descriptions about actions and auto save"** — Microsoft
    - URL: https://github.com/microsoft/vscode/issues/230051
    - Published or updated: Unknown
    - Accessed: 2026-10-05 (via search results)
    - Supports: `RF11`
    - Authority: quotes the shipped `editor.formatOnSave` setting description

## Project Evidence

- `.s1mple/docs/project.md:18` — Supports `RF1` by establishing that `so` pins `typescript` `7.0.2`.
- `.s1mple/docs/project.md:147` — Supports `RF13` by establishing that vim behaviour is recorded from Neovim 0.11.x.
- `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-discuss-context.md:48-50` — Supports `RF2`, `RF5`, `RF15` by establishing that CI has no servers, only rust-analyzer 1.96.0 is installed locally, and the Bun spike result.
- `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-requirements.md:144-151` — Supports `RF5` by establishing the accepted protocol-stack assumption and pinned dependencies.
- `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-requirements.md:222` — Supports `RF3` by establishing the example rust-analyzer `settings` override.
- `package.json:4` — Supports `RF5` by establishing `"type": "module"` with no `sideEffects` field.
- `src/workspace/watcher.ts:61-87` — Supports `RF10` by establishing that the watcher drops excluded paths and `so`'s own operations.
- `src/workspace/ignore.ts:12-14`, `:37` — Supports `RF10` by establishing that any path with a dot segment or `node_modules` is excluded.
- `src/core/kernel/text/pos.ts:1-2` — Supports `RF12` by establishing UTF-16 columns.
- `src/core/config/schema.ts:54-57` — Supports `RF11` by establishing autosave's 1000 ms default delay.

# 4. Confidence and Open Questions

**Confidence:** High — almost every finding comes from pinned source code or official docs of the servers and clients themselves, read on 2026-10-05. Medium for two claims: TS 7 completion behaviour without snippets (not examined) and the absence of Bun/vscode-jsonrpc runtime issues (absence of evidence, backed by the project's own spike).

**Open Questions:**

- Does `tsc --lsp` (TypeScript 7) offer completion, auto-imports, and refactors without snippet support, and does it support rename and "Move to file" without resource operations?
- Do pyright and the JSON server advertise `willSaveWaitUntil` (not checked)?
- Which TypeScript code actions (for example "Move to a new file") need resource operations in `typescript-language-server` and in `tsc --lsp`?
- Does Helix's current release (25.07.1) already ship pull diagnostics, or only master (checked on master only)?

**Immutability Note:** This artifact records evidence against the stated baseline commit and exact evaluated revisions. Later requirements may cite these findings as informing a new revision, but this artifact must not be changed to claim that it evaluated that later revision.
