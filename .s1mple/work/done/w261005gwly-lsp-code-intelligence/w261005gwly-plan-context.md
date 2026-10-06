# W261005GWLY Plan Context

## Status

`Ready`

The finalized system design is the single governing design. It covers all fifteen current requirement revisions with full `REQ → DES → S → V` chains, its code references match the repository at `e5ca9a3`, and the two gaps found (test-helper wiring and the location of `V47`) resolve from project evidence.

## 1. Sources

| Source | Path | Use |
|---|---|---|
| s1mple instructions | `.s1mple/S1MPLE.md` | Workflow behavior and required context |
| Project document | `.s1mple/docs/project.md` | Reusable project baseline |
| System design | `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-system-design.md` | Technical authority (`Finalized System Design`, DES1–DES20, S1–S40, V1–V64) |
| UI design | Not applicable — no UI design was authored; the system design covers the UI surfaces technically and reuses existing tokens and overlays | Technical authority when present |
| System requirements | `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-requirements.md` | Required system behavior (`REQ1`–`REQ15`, current revisions listed in section 4) |
| UI requirements | Not applicable — none authored | Required UI behavior when present |
| Research | `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-research.md` | Findings `RF1`–`RF15`, reconciled in requirements section 6 |
| Discussion context | `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-discuss-context.md` | Work-specific findings and constraints; Roadmap Binding: None — standalone work |
| UI context | Not applicable — none authored | Existing UI code and pattern evidence |
| Roadmap sources | Not applicable | Standalone work |
| Additional project files | `package.json`, `.github/workflows/ci.yml`, `test/boundaries.test.ts`, `scripts/bench-gate.ts`, `src/core/state/types.ts`, `src/core/state/completion.ts`, `src/core/state/keys.ts`, `src/core/features/links/rename.ts`, `src/app/effects.ts`, `src/app/main.ts`, `src/app/lifecycle.ts`, `src/ui/editors/text-view.ts`, `src/ui/input.ts`, `test/integration/helpers.ts`, `test/support/*.ts`, `test/ui/editor-options.test.ts`, `test/e2e/pty.ts` | Spot-check the design's current-shape references and resolve test-placement gaps |

## 2. Governing Design Handoff

### Source Authority

- **System design:** `w261005gwly-system-design.md` — authoritative for architecture, files, symbols, contracts, flows, wiring, success criteria, and verification for all LSP work, including the technical side of the UI surfaces (float, statusline segment, cmdline fallback, completion rows, diagnostic theme tokens, `<C-Space>`).
- **UI design:** Not applicable — the design's Design Boundary defers visual treatment beyond existing tokens to `s1mple-discuss-ui`; none was requested.
- **Alignment:** Single governing design

### Approved Direction

Add LSP code intelligence for code file types in one PR while `src/core` stays protocol-free (DES1). The core owns `AppState.lsp`, request routing, staleness, and result handling as pure reducers that emit `lsp*` effects (DES5, DES6). A new app-layer host (`src/app/lsp-host.ts`) observes the store to reconcile servers and sync documents, runs effects on per-`(server, root)` clients, and dispatches results (DES3, DES4, DES19, DES20). A workspace-layer client (`src/workspace/lsp/*`) speaks JSON-RPC over stdio via `vscode-jsonrpc` and converts between protocol and core types (DES1, DES10, DES18). Features reuse existing surfaces: a kernel diagnostic decoration (DES7), pickers and jumps (DES9), the completion popup in a new `code` mode (DES10), the prompt for rename and one workspace-edit path through `applyBufferEdits`/`applyEdits` (DES12), format-on-save on `:w` only (DES13), generated Neovim-style bindings (DES14), statusline and toasts (DES15), and watched-file forwarding (DES16). A scripted fake server makes every feature testable without real servers (DES17). Canonical detail: system design sections 2–7.

### Design Coverage

| Source | Chain | Planning meaning | Canonical detail |
|---|---|---|---|
| System design | `REQ1@R2 → DES2, DES3 → S1, S2, S33 → V1, V2, V51` | Opt-in `[lsp]`, XDG-only definitions, `localBin` resolution, reconcile on reload | §1 Requirement Coverage; §7 `src/core/config/lsp.ts`, `src/app/lsp-host.ts` |
| System design | `REQ2@R2 → DES2, DES3, DES6, DES20 → S3, S4, S33, S34 → V3, V4, V5, V31, V50, V52` | Seven-entry built-in table, version gates, stacking, configuration delivery, first-capable routing | §7 `src/core/config/lsp.ts`, `client.ts`, `lsp.ts` |
| System design | `REQ3@R2 → DES15, DES3 → S5, S6, S35 → V6, V7, V8, V53` | Statusline segment, throttled progress, message toasts, `:LspInfo`, `unavailable` state | §7 `status.ts`/`statusline.ts`, `lsp.ts`, `lsp-pickers.ts` |
| System design | `REQ4@R1 → DES5, DES6, DES14, DES16 → S7, S8 → V9, V10, V32` | Every feature as `LspOp`/`LspResult`; not-supported message; watched files | §6 `LspOp`/`LspResult`; §7 `lsp-types.ts` |
| System design | `REQ5@R1 → DES2, DES14 → S9 → V11, V39` | `LSP_FILE_TYPES` excludes markdown; no Markdown bindings | §7 `src/core/config/lsp.ts`, `lsp-commands.ts` |
| System design | `REQ6@R2 → DES7, DES8, DES19 → S10, S11, S12, S36 → V12–V16, V54` | Signs and underlines, insert freeze, cursor diagnostic, push and pull slots | §7 `diagnostics.ts`, `lsp.ts`, `lsp-host.ts` |
| System design | `REQ7@R2 → DES7, DES9, DES19 → S13, S36 → V17, V56` | Workspace diagnostics picker; pulled slot cleared on close | §7 `lsp-pickers.ts` |
| System design | `REQ8@R1 → DES10, DES6 → S14, S15 → V18, V19, V20` | Auto completion (trigger chars, 150 ms timer), client-side ranking | §7 `code-completion.ts`, `completion.ts`, `keys.ts` |
| System design | `REQ9@R2 → DES10, DES3, DES6 → S16, S37, S38 → V21, V33, V57, V58, V59` | Plain-text completion, snippet flattening, bounded resolve, one-undo auto-imports, item command | §7 `capabilities.ts`, `convert.ts`, `code-completion.ts` |
| System design | `REQ10@R2 → DES12, DES16 → S17, S18, S19, S40 → V22, V23, V24, V33, V48, V62, V63` | One workspace-edit path; version refusal; exactly-once `applyEdit` reply; watched-file notify of own writes | §7 `lsp-edits.ts`, `rename.ts`, `link-edits.ts`, `effects.ts` |
| System design | `REQ11@R1 → DES13 → S20, S21 → V25, V26, V33` | `:Format`, range format, format-on-save with 1000 ms bound | §7 `lsp-commands.ts`, `commands.ts` |
| System design | `REQ12@R2 → DES3, DES4, DES20 → S22–S25, S35 → V27–V30, V34, V53, V61` | Ordered-marker roots, incremental debounced sync, crash window, bounded stop | §7 `roots.ts`, `sync.ts`, `client.ts`, `lsp-host.ts`, `lifecycle.ts` |
| System design | `REQ13@R1 → DES8, DES9, DES14, DES18 → S26, S27, S28 → V35–V39, V49` | Neovim keys, jumps/pickers, floats, `<C-Space>`, outside-workspace counting | §7 `lsp-commands.ts`, `lsp.ts`, `input.ts`, `lsp-float.ts` |
| System design | `REQ14@R2 → DES4, DES6, DES10, DES19 → S29, S30, S31, S36, S38, S39 → V40, V41, V42, V54, V59, V60, V64` | Stale drops, cancellation, 5 s timeouts, quiet errors, `lspKeystrokeP95` | §7 `lsp.ts`, `convert.ts`, `lsp-host.ts`; bench |
| System design | `REQ15@R1 → DES17 → S32 → V43, V44` (+ `V45`–`V48` non-test/boundary cases) | Fake server, support helpers, local-only real-server test, no orphans | §4 tree `test/`; §8 |
| UI design | Not applicable | No UI design artifact | None |

### Applicable Code Shapes

| Source shape | Target | Planning use |
|---|---|---|
| §7 `src/core/config/lsp.ts` | `LspConfigSchema`, `ServerSpec`, `RootMarker`, `VersionGate`, `BUILTIN_SERVERS`, `LSP_FILE_TYPES`, `resolveServers`, `gateAllows` | Config foundation task; V1, V3, V4, V11, V50 |
| §7 `src/core/config/schema.ts` | `ConfigSchema.lsp` | Wire section into config |
| §7 `src/core/kernel/view/diagnostics.ts` | `Diagnostic`, `DiagnosticSeverity`, `diagnosticMarks`, `severityRank` | Kernel decoration; V13, V14 |
| §7 `src/core/state/lsp-types.ts` | `ServerKey`, `LspFeature`, `ServerView`, `LspOp`, `LspResult`, `CodeLocation`, `CodeSymbol`, `CodeAction`, `CodeEdit`, `CodeCompletionItem`, `LspFloat`, `PendingRequest`, `DiagnosticSlots`, `CodeAccept`, `LspState` | Shared core contract consumed by every later layer |
| §7 `src/core/state/types.ts` | `AppState.lsp`, `Action` (lsp*), `Effect` (lsp*), `CompletionState` code mode, `PromptState` rename, `TimerId` (`completion`, `lspResolve`, `lsp:<id>`, `lspFormat:<id>`) | Protocol extension; `init.ts` default |
| §7 `src/core/state/lsp.ts`, `update.ts` | `request`, `pickServer`, `onLsp*`, `syncDiagnostics`, `syncFloat`, `cursorDiagnostic`; `createUpdate` cases and post-steps | Core reducers; V5, V8–V10, V15, V16, V35–V37, V40, V49, V60 |
| §7 `code-completion.ts`, `completion.ts`, `keys.ts` | `codeCompletionStep`, `acceptCode`, `applyCompletion`, `onResolveTimeout`, `rankCode`; `maybeOpenCompletion → maybeCompletion` | Completion; V18–V21, V58, V59; obsolete-reference check |
| §7 `lsp-edits.ts`, `rename.ts`, `link-edits.ts` | `startCodeEdit`, `onCodeEditApplied`, `SpanEdit.expected?`, `applySpanEdits`, `onEditsApplied` routing | Workspace edits; V22–V24, V62 |
| §7 `lsp-commands.ts`, `commands.ts` | `lspCommands`, `lspBindings`, `lspGroups`, `formattingOptions`, `writeActive`, `EX_ALIASES` | Commands, keys, format; V25, V26, V39 |
| §7 `lsp-pickers.ts`, `picker.ts` | `lspPickerSources`, `pickerSources` | Pickers; V17, V36, V8 |
| §7 `status.ts`, `statusline.ts`, `cmdline.ts` | `StatusSegments.lsp`, `lspSegment`, cmdline fallback | Status UI; V6, V16 |
| §7 UI entry (`text-view.ts`, `theme.ts`, `lsp-float.ts`, `host.ts`, `completion.ts`, `input.ts`) | provider lists, diagnostic tokens, `LspFloatView`, `OverlayHost`, code rows, `toKey` | UI tasks; V38, V47 |
| §7 `src/workspace/lsp/client.ts`, `capabilities.ts`, `convert.ts` | `LspClient`, `ClientEvents`, `createLspClient`, `sectionValue`, `clientCapabilities`, converters, `flattenSnippet`, `toErrorResult` | Protocol layer; V33, V45, V57, V64 |
| §7 `sync.ts`, `roots.ts`, `language-id.ts` | `lineChange`, `findRoot`, `languageIdFor` | V27, V28 |
| §7 `src/app/lsp-host.ts` | `LspHost`, `createLspHost`, `resolveBinary`, `probeMajor`, constants | Host; integration suites |
| §7 `effects.ts`, `lifecycle.ts`, `main.ts` | `RunnerDeps.lsp?`, runner cases, `applyEdits` notify, `stopLsp`, `registries`, `main` wiring | Wiring; V34, V63 |
| §7 `test/boundaries.test.ts`, `package.json`, `scripts/bench-gate.ts` | `PACKAGE_HOMES`, pins, `TARGETS.lspKeystrokeP95` | Policy and bench; V42, V46 |

### Runtime Flow

```text
key → ui → store.dispatch → createUpdate (core lsp reducers) → { state, effects }
   effects {kind:"lsp"|"lspCancel"|"lspReply"|"lspRestart"} → createEffectRunner → lspHost.run → LspClient (vscode-jsonrpc, stdio) → server
   store.subscribe(lspHost.observe) → reconcile clients (config, open code buffers, roots, binaries, gates)
                                    → didOpen / debounced didChange (150 ms, flushed before requests) / didSave / didClose → pull if pull server
   server responses, diagnostics, progress, applyEdit, configuration → client events → host → dispatch lsp* actions → reducers
   watcher events + runner applyEdits writes → lspHost.notify → didChangeWatchedFiles (registered globs)
   shutdown → installLifecycle → lspHost.stop (shutdown → exit at 400 ms → kill at 500 ms)
```

Canonical flows: system design §5 (Startup and attach, Document sync, Request and result, Diagnostics, Completion, Workspace edit, Format on save, Crash and restart, Server messages and progress, Watched files, Shutdown, Config reload, Failure and Recovery Rules, Construction and Wiring Flow).

### Roadmap Validation

None — standalone work

### Cross-Work Dependency Gates

None

## 3. Binding Constraints

| Constraint | Source | Planning implication |
|---|---|---|
| Plan behavior: not established beyond the skill | `.s1mple/S1MPLE.md` §3 Plan | Follow the s1mple-plan skill as written |
| Implementation: keep it lean and simple | `.s1mple/S1MPLE.md` §3 Implementation | Implement exactly the designed symbols; no speculative abstractions |
| No work-process identifiers (work, REQ, DES, S, V, phase, goal ids) in comments, doc comments, identifiers, test names, SQL comments, or log messages | `.s1mple/S1MPLE.md` §3 Implementation; `docs/languages/typescript.md` Coding Conventions | Test names describe behavior (the design's `V`/`S` ids stay in plan documents only); log events use domain names (`lsp.start`, `lsp.crashed`, …) |
| Verification: not established beyond the design | `.s1mple/S1MPLE.md` §3 Verification | Use the design's §8 verification tree and `bun run check` / `bun run test:ci` / `bun run bench` |
| Delivery: open a PR, make CI pass, resolve conflicts with base | `.s1mple/S1MPLE.md` §3 Delivery step 1 | Final group ends with PR to `main` and green CI (`check` job; `test` matrix ubuntu-24.04 + macos-15; bench on Linux) |
| Delivery: move work folder `work/active/` → `work/done/` and update `.s1mple/` references | `.s1mple/S1MPLE.md` §3 Delivery step 2 | Delivery task after PR is green; also update `project.md` baseline for new contracts |
| Delivery: push again; CI must pass on the new head | `.s1mple/S1MPLE.md` §3 Delivery step 3 | Re-verify CI after the move commit |
| Never force-push or merge without the user's approval | `.s1mple/S1MPLE.md` §3 Delivery | Delivery stops at a green PR |
| Every delegated agent reads `.s1mple/S1MPLE.md` and its required references | s1mple-plan Principle 1 | Include in every execution prompt |
| `src/core` free of I/O, runtime, and `@opentui` imports; layer rules | `.s1mple/docs/project.md` Constraints/Boundaries; `test/boundaries.test.ts` | Protocol types only in `src/workspace/lsp/`; core uses its own protocol-free types |
| Exact npm pins; `bun.lock` committed, `--frozen-lockfile` | `.s1mple/docs/project.md` Technology Stack; `test/repo.test.ts` | `bun add vscode-jsonrpc@9.0.3 vscode-languageserver-protocol@3.18.4` (exact) |
| No tool depends on the TypeScript compiler API | `.s1mple/docs/project.md` Constraints | Not affected (servers are external processes) |
| `bun run check` requires zero knip findings | `docs/languages/typescript.md` | Every new export must be used; land exports together with their consumers or in the same group |
| Type-only imports use `import type`; `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` | `docs/languages/typescript.md` | Optional fields such as `SpanEdit.expected?` and `RunnerDeps.lsp?` must be omitted, not set to `undefined` |
| Colocated unit tests `src/**/*.test.ts`; `bun:test`; behavior names | `docs/languages/typescript.md` | Unit cases next to new modules |
| Suites that start processes stop them in `afterEach`; no orphans | System design §8 Test Quality Rules; user feedback on subagent process cleanup | Fake-server suites and implementer agents kill every process they start; check for orphan `fake-lsp` processes before benches |
| Bench gates do not block development | User feedback (perf gates don't block) | If `lspKeystrokeP95` misses, apply quick speedups or relax the threshold rather than stall |
| CI runs on pull requests only; no release unless asked; work on the feature branch | User feedback; `.github/workflows/ci.yml:3` | Branch `feat/w261005gwly-lsp-code-intelligence` already exists; no tags or releases |

## 4. Supporting Evidence

### Requirements

| Requirement | Design coverage | Required outcome |
|---|---|---|
| `W261005GWLY-REQ1@R2` | DES2, DES3 | No server starts unless `[lsp] enabled`; definitions only from XDG config and the built-in table; project-local binaries for `tsc`, `typescript`, `json` |
| `W261005GWLY-REQ2@R2` | DES2, DES3, DES6, DES20 | Seven built-ins in routing order, overridable and stackable; settings delivered by `workspace/configuration` and `didChangeConfiguration` |
| `W261005GWLY-REQ3@R2` | DES15, DES3 | Statusline state and progress, message toasts/log lines, `:LspInfo`, `unavailable` servers quiet |
| `W261005GWLY-REQ4@R1` | DES5, DES6, DES14, DES16 | Full feature set in one PR with a not-supported message and watched files |
| `W261005GWLY-REQ5@R1` | DES2, DES14 | Code file types only; Markdown keys untouched |
| `W261005GWLY-REQ6@R2` | DES7, DES8, DES19 | Gutter signs, underlines, insert freeze, cursor diagnostic, `]d`/`[d`/`<C-w>d`, pull diagnostics |
| `W261005GWLY-REQ7@R2` | DES7, DES9, DES19 | `:Diagnostics` picker over all published diagnostics |
| `W261005GWLY-REQ8@R1` | DES10, DES6 | Automatic completion on triggers and after 150 ms; local narrowing |
| `W261005GWLY-REQ9@R2` | DES10, DES3, DES6 | Plain-text inserts, snippet support only for `json`, resolve ≤ 500 ms, one-undo auto-imports, item command |
| `W261005GWLY-REQ10@R2` | DES12, DES16 | Rename/code actions/`applyEdit` through one path; version refusal; exact reply; watched-file notify |
| `W261005GWLY-REQ11@R1` | DES13 | `:Format`, range format, format-on-save on `:w` bounded at 1000 ms |
| `W261005GWLY-REQ12@R2` | DES3, DES4, DES20 | One process per server and root, incremental debounced sync, crash window, bounded shutdown |
| `W261005GWLY-REQ13@R1` | DES8, DES9, DES14, DES18 | Neovim 0.11 keys + `gd`, floats, jumps, pickers, outside-workspace counting |
| `W261005GWLY-REQ14@R2` | DES4, DES6, DES10, DES19 | Keystrokes off the protocol path, stale drops, cancellation, timeouts, quiet errors, `lspKeystrokeP95 ≤ 16` |
| `W261005GWLY-REQ15@R1` | DES17 | All suites pass without real servers; local-only real rust-analyzer test |

### Research Findings

| Finding | Relevance | Planning implication |
|---|---|---|
| `RF1` | TypeScript 7 has no tsserver | Two gated TS entries (`tsc --lsp` for ≥7, `typescript-language-server` below) on one `tsc --version` probe; `node_modules/.bin` lookup |
| `RF2` | Launch facts for pyright, gopls, rust-analyzer, clangd, json | Built-in table commands and the `unavailable` path for rustup proxies |
| `RF3` | Settings delivery | `workspace/configuration` by dotted path, one `didChangeConfiguration`, rust-analyzer `initOptions` |
| `RF4` | Nearest-marker roots split workspaces | Ordered markers with `nearest`/`topmost` search (`findRoot`) |
| `RF5` | Protocol packages current, LSP 3.18 final | Pin `vscode-jsonrpc 9.0.3`, `vscode-languageserver-protocol 3.18.4` |
| `RF6` | TS 7 diagnostics are pull-only | Host-driven pull after each sent change and on refresh; separate push/pull slots |
| `RF7` | No snippets disables JSON completion | Per-spec `snippets` flag; `flattenSnippet`; resolve and `command` |
| `RF8` | Completion timing | 150 ms timer, trigger chars, 500 ms resolve bound |
| `RF9` | Workspace edits and resource operations | `resourceOperations: []`, lazy code-action resolve, version refusal, `RequestFailed` message |
| `RF10` | Watched files and own writes | Runner `applyEdits` reports writes to `lspHost.notify` |
| `RF11` | Formatting | 1000 ms bound, never on autosave, `formattingOptions` |
| `RF12` | Lifecycle and restarts | Crash window (5 in 180 s), shutdown/exit/kill timing, `utf-16` only |
| `RF13` | Neovim keys and progress | `lspBindings` set; progress throttle |
| `RF14` | didChange debounce | Trailing 150 ms debounce flushed before requests; quiet `ContentModified` |
| `RF15` | Fake-server testing | Scripted `test/fixtures/fake-lsp.ts` modes |

## 5. Project Implementation Context

### Relevant Structure

```text
src/
├── app/            main.ts (registries :131, subscribe :242, runner :326, lifecycle :349, watcher :363) · effects.ts · lifecycle.ts · [A] lsp-host.ts
├── core/
│   ├── config/     schema.ts · [A] lsp.ts
│   ├── features/links/rename.ts   (SpanEdit :8, applySpanEdits :134)
│   ├── kernel/view/  decorations.ts · hit.ts · [A] diagnostics.ts
│   └── state/      types.ts (TimerId :59) · init.ts · update.ts · completion.ts (maybeOpenCompletion :182) · keys.ts (:25, :60)
│                   save.ts · commands.ts · explorer.ts · link-edits.ts · picker.ts · status.ts · [A] lsp*.ts · [A] code-completion.ts
├── ui/             input.ts (toKey :42) · theme.ts · editors/text-view.ts (providers :218-224, :667-672) · overlays/{host,completion,[A] lsp-float}.ts · views/{statusline,cmdline}.ts
└── workspace/      watcher.ts · fs.ts · [A] lsp/{client,capabilities,convert,sync,roots,language-id}.ts
test/
├── boundaries.test.ts (PACKAGE_HOMES :45-57) · repo.test.ts
├── fixtures/ [A] fake-lsp.ts      support/ [A] lsp.ts (+ state.ts, ui.ts, notes.ts)
├── integration/ helpers.ts (startApp) · [A] lsp-host.test.ts · [A] lsp-edits.test.ts · [A] lsp-real.test.ts
├── ui/ (mountShell component tests) · e2e/ pty.ts · [A] lsp.test.ts · bench/ [A] lsp-keystroke.bench.ts
scripts/bench-gate.ts (TARGETS :8-18, BENCHES :21-)
```

### Established Patterns

| Pattern | Evidence | Planning use |
|---|---|---|
| Supervised background host with crash detection and answering unanswered requests | `src/app/index-host.ts:33-103` | Model `createLspHost` supervision (restart policy differs: time window) |
| Reducer throw keeps previous state + error toast | `src/core/state/update.ts:198-215` | Malformed data degrades to one toast |
| Effects routed by the runner to optional deps (`d.index?.notify`) | `src/app/effects.ts:256-296`, `:282` | `d.lsp?.run`, `d.lsp?.notify` |
| Integration harness mirrors `main` minus UI, with optional hosts (`index?`) | `test/integration/helpers.ts:62-140` | Add an `lsp` option the same way |
| Component tests mount the shell with config text | `test/support/ui.ts:34-185` (`mountShell`, `cellStyle`), `test/ui/editor-options.test.ts:1-20` | Place `V47` gutter-sign case under `test/ui` |
| PTY e2e helpers | `test/e2e/pty.ts:115-204` (`runInPty`, `statusRow`, `ready`) | `test/e2e/lsp.test.ts` |
| Bench targets keyed to bench files | `scripts/bench-gate.ts:8-27` | Add `lspKeystrokeP95` + bench path |
| Package homes per package name | `test/boundaries.test.ts:45-57` | Add the two protocol packages homed at `src/workspace/lsp/` |

### Code Surfaces

| Path | Current symbol or wiring | Intended change | Evidence |
|---|---|---|---|
| `package.json`, `bun.lock` | dependencies | Add two exact pins | `package.json` (no `vscode-*` today) |
| `test/boundaries.test.ts` | `PACKAGE_HOMES` | Home both protocol packages | `test/boundaries.test.ts:45-57` |
| `src/core/config/schema.ts` | `ConfigSchema` | Add `lsp: LspConfigSchema` with defaults | design §7 |
| `src/core/state/types.ts` | `TimerId`, `Action`, `Effect`, `CompletionState`, `PromptState`, `AppState` | Add LSP variants and timers (`completion` timer is new) | `src/core/state/types.ts:59-65`, `:454`, `:524` |
| `src/core/state/completion.ts`, `keys.ts` | `maybeOpenCompletion` (2 callers) | Replace with `maybeCompletion` returning `Result` | `completion.ts:182,213`; `keys.ts:25,60` |
| `src/core/features/links/rename.ts` | `SpanEdit.expected: string` | Make optional; `applySpanEdits` skips the check when absent | `rename.ts:8`, `:154` |
| `src/app/effects.ts` | `RunnerDeps`, `run` switch, `applyEdits` case | Add `lsp?`, route `lsp*` effects, notify written files | `effects.ts:38-62`, `:256-296`, `:282` |
| `src/app/lifecycle.ts` | `installLifecycle` deps | Add bounded `stopLsp` | `lifecycle.ts:22-31` |
| `src/app/main.ts` | `registries`, `main` | Register LSP commands/bindings/groups; construct host; subscribe; watcher notify; lifecycle | `main.ts:131`, `:242`, `:326`, `:349`, `:363-366` |
| `src/ui/editors/text-view.ts` | provider lists | Append `diagnosticMarks` in both layout paths | `text-view.ts:218-224`, `:667-672` |
| `src/ui/input.ts` | `toKey` | Map ctrl+space to `<C-Space>` | `input.ts:42` |
| `test/integration/helpers.ts` | `startApp` (`index?` option, `configPath: .no-config.toml`) | Add an LSP host option and config text so suites run the real host with the fake server and `:ConfigReload` | `helpers.ts:86-140`; design §7 `RunnerDeps` consumer "test helpers" |
| `scripts/bench-gate.ts` | `TARGETS`, `BENCHES` | Add `lspKeystrokeP95: 16` | `bench-gate.ts:8-27` |
| New modules | — | `src/core/config/lsp.ts`, `src/core/kernel/view/diagnostics.ts`, `src/core/state/{lsp-types,lsp,lsp-commands,lsp-pickers,lsp-edits,code-completion}.ts`, `src/workspace/lsp/*`, `src/app/lsp-host.ts`, `src/ui/overlays/lsp-float.ts`, test fixtures/suites | design §4 tree |

### Verification Surfaces

| Suite or check | Location or command | Required verification |
|---|---|---|
| Unit (config) | `src/core/config/lsp.test.ts` | V1, V3, V4, V11, V50 |
| Unit (kernel) | `src/core/kernel/view/diagnostics.test.ts` | V13, V14 |
| Unit (core state) | `src/core/state/{lsp,code-completion,lsp-edits,lsp-commands}.test.ts` | V5, V8–V10, V15, V16, V35–V37, V39, V40, V49, V60; V18–V21, V58, V59; V22–V24, V62; V25, V26 |
| Unit (workspace) | `src/workspace/lsp/{sync,roots,convert}.test.ts` | V28, V27, V33, V45, V57, V64 |
| Unit (ui) | `src/ui/input.test.ts` (modified) | V38 |
| Component | `test/ui/` (new or extended case) | V47 gutter sign painted |
| Integration | `test/integration/lsp-host.test.ts`, `lsp-edits.test.ts`, `lsp-real.test.ts` | V2, V7, V29–V32, V34, V41, V51–V56, V61; V48, V63; V44 (skipIf no rust-analyzer) |
| E2E (PTY) | `test/e2e/lsp.test.ts` | V6, V12, V17, V43 |
| Benchmark | `test/bench/lsp-keystroke.bench.ts` via `bun run bench` | V42 |
| Fast gate | `bun run check` | V46: biome, tsc, knip, unit suites, boundaries |
| CI suites | `bun run test:ci` | Component, integration, e2e |
| Obsolete reference | `rg "maybeOpenCompletion" src test` | No matches |
| Orphan check | `pgrep -f fake-lsp` after suites | No processes remain (S32) |

## 6. Additional Inspections

| Planning question | Files inspected | Finding |
|---|---|---|
| Do the design's current-shape line references still match? | `types.ts`, `completion.ts`, `keys.ts`, `rename.ts`, `effects.ts`, `lifecycle.ts`, `main.ts`, `text-view.ts`, `input.ts`, `boundaries.test.ts`, `bench-gate.ts` | Yes at `e5ca9a3`; `PACKAGE_HOMES` also holds `@resvg/resvg-wasm` (`boundaries.test.ts:56`), already noted in the discussion context and irrelevant here |
| Are the protocol packages already installed? | `package.json` | No; the plan must add them |
| Where can V47 ("text-view.test.ts or test/ui") live? | `src/ui/editors/`, `test/ui/`, `test/support/ui.ts` | No colocated text-view test exists; `test/ui` mounts the real shell with `mountShell` and inspects cells, so V47 belongs in `test/ui` (runs in `test:ci`) |
| How do integration suites get a real host and config? | `test/integration/helpers.ts:62-140` | `startApp` wires the runner like `main` with an optional `index`, and a fixed missing `configPath`; it needs an `lsp` option and a config path or text to run the LSP host and `:ConfigReload` |
| Does `test/support/lsp.ts` collide with anything? | `test/support/` | No; `bases.ts`, `markdown.ts`, `notes.ts`, `state.ts`, `ui.ts` only |
| Is the `completion` timer already a `TimerId`? | `src/core/state/types.ts:59-65` | No; the design adds it |

## 7. Planning Gaps

| Gap | Classification | Evidence or blocker |
|---|---|---|
| `test/integration/helpers.ts` is not in the design's §4 tree, but integration suites need the host wired into `startApp` | `Resolved from project evidence` | Design §7 lists "test helpers" as a `RunnerDeps` consumer; `helpers.ts` already models optional hosts (`index?`). Modify `startApp` to accept an LSP host option and config, mirroring `main` wiring |
| V47 location is "text-view.test.ts or test/ui" | `Resolved from project evidence` | No colocated text-view test; `test/ui` + `mountShell` is the established painted-cell pattern |
| `.s1mple/docs/project.md` must describe the new LSP contracts after delivery | `Resolved from project evidence` | Delivery step 2 updates `.s1mple/` references; prior works updated `project.md` when delivered |

## 8. Planning Handoff

- **Scope:** Everything in system design §4 (added and modified files), the §8 verification tree (V1–V64), the test-helper extension above, and delivery per `.s1mple/S1MPLE.md`.
- **Primary boundaries:** `src/core/config` (schema, table) · `src/core/kernel/view` (diagnostic decoration) · `src/core/state` (LSP types, reducers, commands, pickers, edits, completion, protocol extension) · `src/workspace/lsp` (protocol client and converters) · `src/app` (host, runner, lifecycle, main wiring) · `src/ui` (float, statusline, cmdline, completion rows, theme, input, text view) · `test` (fake server, helpers, suites, bench).
- **Likely sequence:**
  1. Foundation: pins + boundary homes; `config/lsp.ts` + schema; kernel `diagnostics.ts`; `lsp-types.ts` + `types.ts`/`init.ts` protocol extension.
  2. Workspace protocol layer: `convert`, `capabilities`, `sync`, `roots`, `language-id`, `client` (unit-testable without the host).
  3. Core reducers: `lsp.ts` + `update.ts` routing/post-steps; pickers; commands/bindings/format (`commands.ts`, `save.ts` timers); edits (`rename.ts`, `link-edits.ts`, `explorer.ts` prompt); completion (`completion.ts`, `keys.ts`, `code-completion.ts`); `status.ts`.
  4. App host and wiring: `lsp-host.ts`, `effects.ts`, `lifecycle.ts`, `main.ts`.
  5. UI surfaces: `text-view`, `theme`, `lsp-float` + overlay host, completion overlay, statusline, cmdline, `input`.
  6. Test infrastructure and system suites: `fake-lsp.ts`, `test/support/lsp.ts`, `helpers.ts`, integration, e2e, real-server test, bench + `bench-gate.ts`.
  7. Delivery: PR, CI green, work folder move, `project.md` update, push.
  Groups may combine steps when knip requires new exports to land with their consumers.
- **Verification focus:** pure routing/staleness/freeze/edit/completion units on `createUpdate`; host lifecycle, sync ordering, pull diagnostics, crash window, bounded stop, and edits against the fake server; no orphan processes; `lspKeystrokeP95`; `bun run check` (boundary + knip) after every group.
- **Excluded scope:** requirements §3 Out of Scope — semantic tokens, inlay hints, tree-sitter, DAP; servers on Markdown and `.base`; snippet tabstop navigation; resource operations in workspace edits; server config from workspace files; installing servers; `workspace/diagnostic`; Neovim 0.12 additions; `workspace/symbol`, hierarchies, document highlights. Also UI/UX treatment beyond existing tokens (`s1mple-discuss-ui`), persisted LSP state, and releases.
- **Blocking items:** None
