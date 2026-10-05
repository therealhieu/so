# W261005GWLY: lsp-code-intelligence — System Design

**Design Status:** Finalized System Design

**Context Source:** `w261005gwly-discuss-context.md`

**Requirements Source:** `w261005gwly-requirements.md`

**Research Source:** None

**Current Requirement Revisions:** `W261005GWLY-REQ1@R1`, `W261005GWLY-REQ2@R1`, `W261005GWLY-REQ3@R1`, `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ5@R1`, `W261005GWLY-REQ6@R1`, `W261005GWLY-REQ7@R1`, `W261005GWLY-REQ8@R1`, `W261005GWLY-REQ9@R1`, `W261005GWLY-REQ10@R1`, `W261005GWLY-REQ11@R1`, `W261005GWLY-REQ12@R1`, `W261005GWLY-REQ13@R1`, `W261005GWLY-REQ14@R1`, `W261005GWLY-REQ15@R1`

**Research Reconciliation:** None — research skipped

**Unresolved Items:** None

**Approval:** The design decisions were made by the agent under the self-drive authority the user delegated for the rest of this discussion on 2026-10-05.

**Design Boundary:** This artifact is authoritative for whole-system architecture and technical design, including UI/frontend applications, routes, modules, components, state ownership, contracts, files, symbols, boundaries, wiring, and verification when material. UI/UX look and feel, visual composition, concrete interaction treatment, responsive presentation, accessibility realization, mockups, and accepted UI-design authority belong to `s1mple-discuss-ui`.

**Finalized System Design Checklist:**

- [x] Every current qualified requirement revision has exactly one valid system-design coverage outcome: `System design required`, `No system design change`, or `No system design applicable`.
- [x] Every `System design required` outcome has the full `REQ → DES → S → V` chain.
- [x] Every `No system design change` outcome cites the existing system mechanism, exact current source, and existing verification evidence. (None used.)
- [x] Every `No system design applicable` outcome explains why the requirement creates no system architecture or technical-design obligation and omits invented `DES`, `S`, and `V` records. (None used.)
- [x] For roadmap-linked work, the accepted baseline has been checked against current parent definitions, every assigned parent obligation has valid child coverage, and gates due before design approval have evidence. (Not applicable — standalone work.)
- [x] Historical requirement revisions are excluded from current design coverage.
- [x] When research exists, every RF-to-evaluated-revision relationship is reconciled and evaluated-versus-informed lineage is accurate; a finding that evaluated no requirement has one `None` relationship row. (Not applicable — no research.)
- [x] When any requirement requires changed system design, the design progresses from system context and architecture to concrete files and symbols; otherwise sections 2–8 record explicit non-applicability without inventing system changes.
- [x] Every focal component, when any, has an existing target or proposed location and clear ownership.
- [x] The proposed project tree accounts for every affected source, wiring, configuration, migration, and test file as added, modified, renamed/moved, or deleted, or states why no system file changes apply.
- [x] Every changed or proposed logical contract, data model, and state item has a canonical section 7 detailed-shape reference; every unchanged item cites its exact current source and identifies affected section 7 consumers when relevant.
- [x] Every changed boundary has a contract, state rule, or signature.
- [x] Every modified symbol has an exact current source, current → final delta, and affected callers or consumers.
- [x] Detailed code design covers every important changed type, class, function, dependency, invariant, focused control flow, construction point, registration, and export; each code preview is immediately followed by an explanation of the definitions shown and how they interact.
- [x] Changed runtime flows name the participating symbols and define relevant failure policies.
- [x] Every cross-cutting, migration, and delivery concern is resolved with a concrete design location or `None — <reason>`.
- [x] Every `System design required` requirement, every design decision, and every changed invariant maps to an observable success criterion and an exact verification case and assertion.
- [x] Test suites and nested cases form one verification tree; every case names its unique risk and uses the lowest sufficient test level.
- [x] Unit and integration tests follow the section 8 quality rules without duplicating the same proof across levels.
- [x] Traceability is complete for every `System design required` outcome: `current REQ revision → DES → affected file → affected symbol → caller or wiring → runtime flow → success criterion → suite or check → exact verification case and assertion`; other outcomes have their required evidence instead of fabricated links.
- [x] UI/frontend technical design stays within the Design Boundary; UI/UX realization is deferred to `s1mple-discuss-ui`.
- [x] Every omitted structure, code preview, test level, or non-test check explains why it does not apply.

# Table of Contents

1. [Design Goals, Constraints, and Requirement Coverage](#1-design-goals-constraints-and-requirement-coverage)
2. [System Context and Architecture](#2-system-context-and-architecture)
3. [Components and Boundaries](#3-components-and-boundaries)
4. [Project Structure Changes](#4-project-structure-changes)
5. [Runtime Flows and Error Policies](#5-runtime-flows-and-error-policies)
6. [Logical Contracts, Data Models, and State](#6-logical-contracts-data-models-and-state)
7. [Detailed Code Design](#7-detailed-code-design)
8. [Testing and Verification](#8-testing-and-verification)
9. [Finalized Design Decisions](#9-finalized-design-decisions)
   - [W261005GWLY-DES1: Protocol-free core, client in the workspace layer](#w261005gwly-des1-protocol-free-core-client-in-the-workspace-layer)
   - [W261005GWLY-DES2: `[lsp]` config and the built-in server table](#w261005gwly-des2-lsp-config-and-the-built-in-server-table)
   - [W261005GWLY-DES3: One host, one client per server and root](#w261005gwly-des3-one-host-one-client-per-server-and-root)
   - [W261005GWLY-DES4: Document sync by observing the store](#w261005gwly-des4-document-sync-by-observing-the-store)
   - [W261005GWLY-DES5: LSP state, effects, and actions in the core](#w261005gwly-des5-lsp-state-effects-and-actions-in-the-core)
   - [W261005GWLY-DES6: Request routing, staleness, cancellation, and timeouts](#w261005gwly-des6-request-routing-staleness-cancellation-and-timeouts)
   - [W261005GWLY-DES7: Diagnostics as a language-neutral kernel decoration](#w261005gwly-des7-diagnostics-as-a-language-neutral-kernel-decoration)
   - [W261005GWLY-DES8: Non-modal info float](#w261005gwly-des8-non-modal-info-float)
   - [W261005GWLY-DES9: Location results through jumps and pickers](#w261005gwly-des9-location-results-through-jumps-and-pickers)
   - [W261005GWLY-DES10: Code completion as a completion mode](#w261005gwly-des10-code-completion-as-a-completion-mode)
   - [W261005GWLY-DES11: Signature help](#w261005gwly-des11-signature-help)
   - [W261005GWLY-DES12: One workspace-edit path](#w261005gwly-des12-one-workspace-edit-path)
   - [W261005GWLY-DES13: Formatting and format-on-save](#w261005gwly-des13-formatting-and-format-on-save)
   - [W261005GWLY-DES14: Commands and generated key bindings](#w261005gwly-des14-commands-and-generated-key-bindings)
   - [W261005GWLY-DES15: Server status and messages](#w261005gwly-des15-server-status-and-messages)
   - [W261005GWLY-DES16: Watched-file notifications](#w261005gwly-des16-watched-file-notifications)
   - [W261005GWLY-DES17: Fake server and verification layers](#w261005gwly-des17-fake-server-and-verification-layers)
   - [W261005GWLY-DES18: Locations outside the workspace](#w261005gwly-des18-locations-outside-the-workspace)

# 1. Design Goals, Constraints, and Requirement Coverage

## Goals

- Give code file types LSP features while `src/core` stays pure and imports no protocol types (REQ4, REQ12).
- Start servers only on opt-in, from XDG config, with a small built-in table that can be stacked (REQ1, REQ2, REQ5).
- Reuse existing surfaces (decorations, pickers, completion popup, prompt, jumps, `applyEdits`) instead of building new ones (REQ6–REQ13).
- Keep keystrokes off the protocol path and drop stale results (REQ14).
- Make every feature testable without a real server (REQ15).

## Requirement Coverage

- `W261005GWLY-REQ1@R1` — Opt-in, XDG-only servers.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES2`, `W261005GWLY-DES3`
  - **How Addressed:** `LspConfigSchema` adds `[lsp] enabled` (default `false`) to the XDG config schema. `createLspHost` starts nothing while it is off and reconciles running clients whenever `state.config` changes, including after `:ConfigReload`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/config/lsp.ts` — `LspConfigSchema`; `src/core/config/schema.ts` — `ConfigSchema.lsp`; `src/app/lsp-host.ts` — `createLspHost`, `reconcile`
  - **Callers and Wiring:** `src/app/main.ts` constructs the host and subscribes it to the store.
  - **Runtime Flow:** Startup and attach; Config reload
  - **Success Criteria:** `S1`, `S2`
  - **Verification:** `V1`, `V2`
  - **Research Support:** None

- `W261005GWLY-REQ2@R1` — Small built-in table, stackable servers.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES2`, `W261005GWLY-DES6`
  - **How Addressed:** `BUILTIN_SERVERS` holds six definitions, and `resolveServers` merges overrides and additions in table order. The host attaches every enabled match whose binary `Bun.which` finds. `pickServer` routes each request to the first attached server with the feature, and diagnostics are stored per server.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/config/lsp.ts` — `BUILTIN_SERVERS`, `resolveServers`, `ServerSpec`; `src/core/state/lsp.ts` — `pickServer`; `src/app/lsp-host.ts` — `attach`
  - **Callers and Wiring:** `createLspHost` calls `resolveServers(state.config)`; core commands call `pickServer`.
  - **Runtime Flow:** Startup and attach; Request and result
  - **Success Criteria:** `S3`, `S4`
  - **Verification:** `V3`, `V4`, `V5`, `V31`
  - **Research Support:** None

- `W261005GWLY-REQ3@R1` — Server state visibility.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES15`
  - **How Addressed:** The host dispatches `lspServer` for state and progress, throttled to one dispatch per server every 100 ms. `statusSegments` derives `lsp` from the active buffer's attached servers, and the statusline paints it. `lspMessage` turns error and warning messages into toasts and info messages into log lines. `:LspInfo` opens an `lspInfo` picker.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/status.ts` — `StatusSegments.lsp`; `src/ui/views/statusline.ts` — `lspSegment`; `src/core/state/lsp.ts` — `onLspServer`, `onLspMessage`; `src/app/lsp-host.ts` — progress throttle; `src/core/state/lsp-pickers.ts` — `lspInfo`
  - **Callers and Wiring:** `createUpdate` routes the new actions.
  - **Runtime Flow:** Startup and attach; Server messages and progress
  - **Success Criteria:** `S5`, `S6`
  - **Verification:** `V6`, `V7`, `V8`
  - **Research Support:** None

- `W261005GWLY-REQ4@R1` — Full feature set in one PR.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES5`, `W261005GWLY-DES6`, `W261005GWLY-DES14`, `W261005GWLY-DES16`
  - **How Addressed:** Every feature is an `LspOp` variant with a matching `LspResult` variant, run through one request path. A feature no attached server supports reports `<feature>: not supported by <servers>`. Watcher events reach servers that registered file watchers.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/lsp-types.ts` — `LspOp`, `LspResult`, `LspFeature`; `src/core/state/lsp.ts` — `request`; `src/workspace/lsp/client.ts` — `LspClient.request`, watched files
  - **Callers and Wiring:** `lspCommands` (registered in `main.ts`); `main.ts` forwards watcher events to `lspHost.notify`.
  - **Runtime Flow:** Request and result; Watched files
  - **Success Criteria:** `S7`, `S8`
  - **Verification:** `V9`, `V10`, `V32`
  - **Research Support:** None

- `W261005GWLY-REQ5@R1` — Code file types only.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES2`, `W261005GWLY-DES14`
  - **How Addressed:** `LspConfigSchema` accepts only ids in `LSP_FILE_TYPES` (every `CODE_LANGUAGES` id except `markdown`), so `markdown`, `base`, and `text` fail with the key's line. `lspBindings` is generated only for code file types, so Markdown keys are untouched.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/config/lsp.ts` — `LSP_FILE_TYPES`; `src/core/state/lsp-commands.ts` — `lspBindings`
  - **Callers and Wiring:** `parseConfig` (unchanged) reports schema issues with lines; `main.ts` adds `lspBindings`.
  - **Runtime Flow:** None — validation and registration only
  - **Success Criteria:** `S9`
  - **Verification:** `V11`, `V39`
  - **Research Support:** None

- `W261005GWLY-REQ6@R1` — Diagnostic display.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES7`, `W261005GWLY-DES8`
  - **How Addressed:** The kernel `Diagnostic` type and `diagnosticMarks` provider produce one `line` sign per line (highest severity) and one `mark` per range. The text view appends the provider. `syncDiagnostics` freezes what is shown while in insert mode. The command line shows `cursorDiagnostic`. `diag.next`/`diag.prev`/`diag.float` commands provide `]d`/`[d`/`<C-w>d`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/kernel/view/diagnostics.ts` — `Diagnostic`, `diagnosticMarks`; `src/ui/editors/text-view.ts` — provider lists; `src/core/state/lsp.ts` — `syncDiagnostics`, `cursorDiagnostic`; `src/ui/views/cmdline.ts`
  - **Callers and Wiring:** `createUpdate` post-step; text view provider list.
  - **Runtime Flow:** Diagnostics
  - **Success Criteria:** `S10`, `S11`, `S12`
  - **Verification:** `V12`, `V13`, `V14`, `V15`, `V16`
  - **Research Support:** None

- `W261005GWLY-REQ7@R1` — Workspace diagnostics picker.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES7`, `W261005GWLY-DES9`
  - **How Addressed:** `s.lsp.diagnostics` keeps every published path (open or not). The `diagnostics` picker source lists all entries sorted by severity, then path, then position, and accepts through `goTo`. A stopped server's entries are removed.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/lsp-pickers.ts` — `diagnosticsSource`; `src/core/state/picker.ts` — `pickerSources`
  - **Callers and Wiring:** `diag.list` command bound to `<leader>xd` in code file types and in the palette.
  - **Runtime Flow:** Diagnostics
  - **Success Criteria:** `S13`
  - **Verification:** `V17`
  - **Research Support:** None

- `W261005GWLY-REQ8@R1` — Automatic completion.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES10`, `W261005GWLY-DES6`
  - **How Addressed:** `CompletionState` gains a `code` mode. `maybeCompletion` (replacing `maybeOpenCompletion`, now returning a `Result`) starts the `completion` timer (150 ms) or requests at once on a trigger character. Results are ranked on the client with `rankBy` over `filterText`, and a new request goes out only on `isIncomplete` or when the word start moves.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/types.ts` — `CompletionState`, `TimerId`; `src/core/state/completion.ts` — `maybeCompletion`, `completionKey`; `src/core/state/code-completion.ts` — new; `src/core/state/keys.ts` — `handleKeyAction`
  - **Callers and Wiring:** `handleKeyAction`, `onTimer`.
  - **Runtime Flow:** Completion
  - **Success Criteria:** `S14`, `S15`
  - **Verification:** `V18`, `V19`, `V20`
  - **Research Support:** None

- `W261005GWLY-REQ9@R1` — Plain-text completion with auto-import edits.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES10`, `W261005GWLY-DES3`
  - **How Addressed:** `clientCapabilities()` advertises `snippetSupport: false` and `resolveSupport` for `additionalTextEdits`. Accepting resolves when supported, then `applyCompletion` applies the main edit and `additionalTextEdits` in one `applyBufferEdits` call (one undo step).
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/workspace/lsp/capabilities.ts` — `clientCapabilities`; `src/core/state/code-completion.ts` — `applyCompletion`
  - **Callers and Wiring:** `completionKey` on accept.
  - **Runtime Flow:** Completion
  - **Success Criteria:** `S16`
  - **Verification:** `V21`, `V33`
  - **Research Support:** None

- `W261005GWLY-REQ10@R1` — Server workspace edits.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES12`
  - **How Addressed:** Rename, code actions, and `workspace/applyEdit` all produce a `CodeEdit` that `startCodeEdit` applies. Open buffers go through `applyBufferEdits` (one undo step each). Closed files become `applyEdits` effects with `SpanEdit.expected` omitted, and the batch is tracked in `s.lsp.edit`. A version mismatch refuses everything. One summary toast is shown, and the reply goes out once the batch finishes.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/lsp-edits.ts` — `startCodeEdit`, `onCodeEditApplied`; `src/core/features/links/rename.ts` — `SpanEdit.expected?`, `applySpanEdits`; `src/core/state/types.ts` — `PromptState` rename variant; `src/core/state/link-edits.ts` — `onEditsApplied` batch routing
  - **Callers and Wiring:** `lsp.rename` prompt submit, `lspActions` picker accept, `lspApplyEdit` action.
  - **Runtime Flow:** Workspace edit
  - **Success Criteria:** `S17`, `S18`, `S19`
  - **Verification:** `V22`, `V23`, `V24`, `V33`
  - **Research Support:** None

- `W261005GWLY-REQ11@R1` — Formatting.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES13`
  - **How Addressed:** `lsp.format` sends `formatting`/`rangeFormatting` with `formattingOptions`. With `formatOnSave`, `writeActive` (`:w` only) first requests formatting, sets `s.lsp.format`, and starts the `lspFormat:<bufferId>` timer (1000 ms). The result or the timeout continues to `writeBuffer`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/lsp-commands.ts` — `formatCommand`, `formattingOptions`; `src/core/state/commands.ts` — `writeActive`; `src/core/state/lsp.ts` — format result handling
  - **Callers and Wiring:** `file.save` command; `onTimer`.
  - **Runtime Flow:** Format on save
  - **Success Criteria:** `S20`, `S21`
  - **Verification:** `V25`, `V26`
  - **Research Support:** None

- `W261005GWLY-REQ12@R1` — Server lifecycle and project roots.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES3`, `W261005GWLY-DES4`
  - **How Addressed:** `findRoot` searches upward for root markers, stopping at the workspace root. The host keeps one `LspClient` per `ServerKey` (`name@root`). `lineChange` builds incremental changes, and sync is debounced (150 ms) and flushed before requests. The crash policy restarts once, then marks the server unavailable. `stop()` runs `shutdown`/`exit` within 500 ms, then kills; `installLifecycle` awaits it.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/workspace/lsp/roots.ts` — `findRoot`; `src/workspace/lsp/client.ts` — `createLspClient`; `src/workspace/lsp/sync.ts` — `lineChange`; `src/app/lsp-host.ts` — `createLspHost`; `src/app/lifecycle.ts` — `stopLsp`
  - **Callers and Wiring:** `main.ts` constructs the host and passes `stopLsp` to `installLifecycle`.
  - **Runtime Flow:** Startup and attach; Document sync; Crash and restart; Shutdown
  - **Success Criteria:** `S22`, `S23`, `S24`, `S25`
  - **Verification:** `V27`, `V28`, `V29`, `V30`, `V34`
  - **Research Support:** None

- `W261005GWLY-REQ13@R1` — Navigation keys and views.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES8`, `W261005GWLY-DES9`, `W261005GWLY-DES14`, `W261005GWLY-DES18`
  - **How Addressed:** `lspBindings` generates Neovim 0.11 keys per code file type, and the existing config merge allows overrides. `toKey` learns `<C-Space>`. Hover, signature, and diagnostic floats use `s.lsp.float`. One location jumps (`recordJump` + `goTo`); several open the `lspLocations` picker. Locations outside the workspace are skipped and counted.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/lsp-commands.ts`; `src/core/state/lsp.ts` — `onLocations`; `src/ui/input.ts` — `toKey`; `src/ui/overlays/lsp-float.ts`
  - **Callers and Wiring:** `main.ts` registers commands and bindings; `OverlayHost` hosts the float.
  - **Runtime Flow:** Request and result
  - **Success Criteria:** `S26`, `S27`, `S28`
  - **Verification:** `V35`, `V36`, `V37`, `V38`, `V39`, `V49`
  - **Research Support:** None

- `W261005GWLY-REQ14@R1` — Responsiveness and stale results.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES4`, `W261005GWLY-DES6`
  - **How Addressed:** Reducers only emit `lsp` effects. The host does all I/O asynchronously. Every `PendingRequest` keeps `version`, and `onLspResult` drops mismatches. Hover, completion, and signature cancel their predecessor. User-triggered requests time out after 5 s through `lsp:<id>` timers. The new `lspKeystrokeP95` benchmark guards the 16 ms target.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `src/core/state/lsp.ts` — `request`, `onLspResult`, `onLspTimeout`; `src/app/lsp-host.ts` — debounce; `test/bench/lsp-keystroke.bench.ts`; `scripts/bench-gate.ts` — `TARGETS`
  - **Callers and Wiring:** `bench-gate.ts` runs the new bench.
  - **Runtime Flow:** Request and result; Document sync
  - **Success Criteria:** `S29`, `S30`, `S31`
  - **Verification:** `V40`, `V41`, `V42`
  - **Research Support:** None

- `W261005GWLY-REQ15@R1` — Verification without real servers.
  - **Coverage Outcome:** System design required
  - **System Design:** `W261005GWLY-DES17`
  - **How Addressed:** `test/fixtures/fake-lsp.ts` is a scripted LSP server that logs every message it receives. Integration and e2e suites start it through config. `test/integration/lsp-real.test.ts` uses `test.skipIf(!Bun.which("rust-analyzer"))`.
  - **Existing Evidence:** None — system change required
  - **Affected Files and Symbols:** `test/fixtures/fake-lsp.ts`; `test/support/lsp.ts`; suites in section 8
  - **Callers and Wiring:** `knip.json` already treats `test/**/*.ts` as entries.
  - **Runtime Flow:** None — test infrastructure
  - **Success Criteria:** `S32`
  - **Verification:** `V43`, `V44`
  - **Research Support:** None

## Assigned Parent Obligation Coverage

None — standalone work

## Binding Constraints

- `.s1mple/docs/project.md` Constraints — `src/core` stays free of I/O, runtime, and UI imports. Effect: every process, file, and protocol detail lives in `src/app` or `src/workspace`.
- `test/boundaries.test.ts:16-57` — layer rules and package homes, with type-only imports counted (`:60-62`). Effect: `vscode-jsonrpc` and `vscode-languageserver-protocol` are homed in `src/workspace/lsp/`.
- `test/repo.test.ts:20` — exact npm pins. Effect: `vscode-jsonrpc` `9.0.3`, `vscode-languageserver-protocol` `3.18.4`.
- `.s1mple/S1MPLE.md:63` — no work-process identifiers in code or tests.
- `src/core/kernel/text/pos.ts:1` — UTF-16 columns. Effect: the client offers only `utf-16` and converts nothing.
- `src/core/state/update.ts:198-215` — a throwing reducer keeps the previous state. Effect: malformed server data converted in the workspace layer can at worst cause one error toast.
- `src/app/index-host.ts:33-103` — the restart-once crash policy, which the LSP host mirrors.

## Cross-Cutting Applicability

| Concern | Applicability | Design Location or Reason |
|---|---|---|
| Security and privacy | Applicable | Opt-in and XDG-only config (`LspConfigSchema`, DES2). Commands run as `argv` arrays without a shell (`spawn(cmd[0], cmd.slice(1))`, DES3). Note text is never logged (`client.ts` logs method names and ids only). `V1`, `V11`, `V29` |
| Configuration | Applicable | `[lsp]` section, `formatOnSave`, `[lsp.servers.<name>]` (section 7 `src/core/config/lsp.ts`). `V2`, `V3`, `V11` |
| Observability | Applicable | Statusline segment, `:LspInfo`, debug-log events `lsp.start`, `lsp.crashed`, `lsp.message`, `lsp.stop` (DES15). `V6`, `V7`, `V8` |
| Performance and scalability | Applicable | Debounced incremental sync, client-side completion filtering, progress throttle, `lspKeystrokeP95` (DES4, DES6, DES10, DES15). `V40`, `V42` |
| Concurrency | Applicable | One serial queue for closed-file edits (existing). The host serializes `didChange` before requests per document. Results are version-checked (DES4, DES6, DES12). `V22`, `V41` |
| Retry and idempotency | Applicable | Crash restart once (DES3). No automatic request retries: a failed request reports once. `applyEdit` replies exactly once per request (DES12). `V24`, `V29` |
| Migration and rollout | None | None — a new optional config section. With no `[lsp]` section nothing starts, and no persisted state changes (`PersistedState` stays `version: 1`) |

## Focused Code Surface

- **Existing:** `src/core/state/types.ts` — `AppState`, `Action`, `Effect`, `CompletionState`, `PromptState`, `TimerId` — the one-way protocol LSP extends.
- **Existing:** `src/core/state/update.ts` — `createUpdate` — routes actions and runs post-steps.
- **Existing:** `src/core/state/completion.ts` — `maybeOpenCompletion`, `completionKey` — the popup that gains a code mode.
- **Existing:** `src/core/features/links/rename.ts` — `SpanEdit`, `applySpanEdits` — the closed-file edit primitive.
- **Existing:** `src/app/effects.ts` — `RunnerDeps`, `createEffectRunner` — routes the new effects.
- **Existing:** `src/app/lifecycle.ts` — `installLifecycle` — gains a bounded LSP stop.
- **Existing:** `src/ui/editors/text-view.ts` — provider lists at `:218-224` and `:667-672`.
- **Proposed:** `src/workspace/lsp/` — `createLspClient`, `findRoot`, `lineChange`, `toCore`/`toLsp` converters, `clientCapabilities` — Traces to `W261005GWLY-DES1`, `W261005GWLY-DES3`, `W261005GWLY-DES4`
- **Proposed:** `src/app/lsp-host.ts` — `createLspHost` — Traces to `W261005GWLY-DES3`, `W261005GWLY-DES4`, `W261005GWLY-DES15`, `W261005GWLY-DES16`
- **Proposed:** `src/core/state/lsp*.ts`, `src/core/state/code-completion.ts` — reducers, commands, pickers, edits — Traces to `W261005GWLY-DES5`–`W261005GWLY-DES14`
- **Proposed:** `src/core/kernel/view/diagnostics.ts` — `Diagnostic`, `diagnosticMarks` — Traces to `W261005GWLY-DES7`
- **Proposed:** `src/core/config/lsp.ts` — schema and built-in table — Traces to `W261005GWLY-DES2`

# 2. System Context and Architecture

## System Context

```text
             ┌──────────────────────────── so (one Bun process) ───────────────────────────┐
 user ──keys─┤ ui → store → core update → effects → app runner ─┬─ workspace fs adapters   │
             │                                                   └─ app/lsp-host ──────────┼── stdio JSON-RPC ──► language server processes
 XDG config ─┤ [lsp] enabled, servers                                  ▲                   │   (typescript-language-server, pyright,
             │                                                         └── actions ◄───────┼──  gopls, rust-analyzer, clangd, json, user-added)
 watcher ────┤ fileChanged → store + index host + lsp host                                 │
             └─────────────────────────────────────────────────────────────────────────────┘
```

Language servers are trusted external programs the user installs and turns on. They read and sometimes build the project. `so` sends them only open buffer text and file events, and accepts only edits, locations, diagnostics, and display text back.

## Proposed Architecture

```text
src/core (pure, protocol-free)
  config/lsp.ts ........ LspConfigSchema · BUILTIN_SERVERS · resolveServers(config) → ServerSpec[]
  kernel/view/diagnostics.ts ... Diagnostic · diagnosticMarks (DecorationProvider)
  state/lsp-types.ts ... ServerKey · LspFeature · LspOp · LspResult · CodeLocation · CodeEdit · CodeCompletionItem
  state/lsp.ts ......... request · pickServer · onLspResult · onLspServer · onLspDiagnostics · onLspMessage
                         onLspTimeout · syncDiagnostics · syncFloat · cursorDiagnostic
  state/lsp-commands.ts  lspCommands · lspBindings (generated per code file type)
  state/lsp-pickers.ts . diagnostics · lspLocations · lspSymbols · lspActions · lspInfo sources
  state/lsp-edits.ts ... startCodeEdit · onCodeEditApplied
  state/code-completion.ts  codeCompletionStep · applyCompletion
        │ Effect {kind:"lsp"|"lspCancel"|"lspReply"|"lspRestart"}        ▲ Action {type:"lsp*"}
        ▼                                                                │
src/app/effects.ts → d.lsp.run(effect)                                   │
src/app/lsp-host.ts  createLspHost: store.subscribe → reconcile + sync; run(effect); notify(FileEvent); stop()
        │ owns Map<ServerKey, LspClient>, per-document sync state, crash counts, progress throttle
        ▼
src/workspace/lsp/
  client.ts ........ createLspClient(spec, root): spawn → vscode-jsonrpc connection → initialize → requests
  capabilities.ts .. clientCapabilities() (utf-16, snippetSupport false, resourceOperations [])
  convert.ts ....... LSP ↔ core (uri ↔ workspace path, Diagnostic, Location, CompletionItem, WorkspaceEdit)
  sync.ts .......... lineChange(prev, next) → one incremental change
  roots.ts ......... findRoot(file, markers, root, exists)
  language-id.ts ... languageIdFor(fileType, path)
        ▼
src/ui: text-view appends diagnosticMarks · statusline lspSegment · cmdline cursor diagnostic
        overlays/lsp-float.ts paints s.lsp.float · completion overlay shows code items · input.ts <C-Space>
```

The core decides what to ask and what to show. The host decides which process gets it and when the text is synced. The workspace layer speaks the protocol. This keeps one direction of data flow (`update` stays pure), confines protocol churn to `src/workspace/lsp/`, and follows the shape the v1 design reserved (`rm261003abzp-design.md:849`).

The main tradeoff: document sync is driven by observing state rather than by explicit effects from every edit site. That means no reducer changes for sync and no edit path can be missed. The cost is that the host compares buffer versions after every dispatch, which is O(open code buffers) and cheap because buffers are immutable.

# 3. Components and Boundaries

## Core LSP state and reducers

- **Target:** `src/core/state/lsp.ts`, `src/core/state/lsp-types.ts`
- **Kind:** Pure reducer module and types
- **Responsibilities:**
  - Own `AppState.lsp`: servers, attachments, diagnostics (published and shown), pending requests, float, location list, edit batch, format wait.
  - Choose the server for a feature, record pending requests with buffer versions, and drop stale results.
  - Turn results into state changes (jumps, pickers, floats, edits, completion).
- **Collaborators:**

  ```text
  lspCommands.run → request(s, feature, op) → Effect{kind:"lsp"}
  createUpdate → onLspResult / onLspServer / onLspDiagnostics / onLspMessage / onLspApplyEdit
  createUpdate post-step → syncDiagnostics → syncFloat
  ```

- **Boundary Contract:** section 6 `LspState`, `LspOp`/`LspResult`, LSP effects and actions
- **Detailed Design:** section 7 `src/core/state/lsp-types.ts`, `src/core/state/lsp.ts`
- **Must Not Own:**
  - Protocol JSON, URIs, processes, or timers beyond `startTimer` effects.

## LSP host

- **Target:** `src/app/lsp-host.ts`
- **Kind:** Application adapter (process supervisor)
- **Responsibilities:**
  - Compare state after each dispatch: start, attach, and stop clients for the config and the open code buffers.
  - Sync documents (`didOpen`/debounced `didChange`/`didSave`/`didClose`).
  - Run `lsp*` effects on the right client and dispatch results as actions.
  - Apply the crash policy, throttle progress, forward watcher events, and stop all clients within a bound.
- **Collaborators:**

  ```text
  store.subscribe → createLspHost.observe(state)
  createEffectRunner → lspHost.run(effect)
  watchWorkspace callback → lspHost.notify(event)
  installLifecycle → lspHost.stop()
  createLspHost → createLspClient · findRoot · Bun.which · resolveServers
  ```

- **Boundary Contract:** `LspHost` (section 7 `src/app/lsp-host.ts`)
- **Detailed Design:** section 7 `src/app/lsp-host.ts`
- **Must Not Own:**
  - Feature decisions (which result to show, stale checks); those are core.
  - Protocol message shapes; those are in `src/workspace/lsp/convert.ts`.

## LSP client

- **Target:** `src/workspace/lsp/client.ts` (+ `capabilities.ts`, `convert.ts`, `sync.ts`, `roots.ts`, `language-id.ts`)
- **Kind:** Workspace I/O adapter
- **Responsibilities:**
  - Spawn one server process and run the LSP lifecycle over `vscode-jsonrpc`.
  - Send document notifications and feature requests, and convert to and from core types.
  - Answer server requests: `workspace/configuration`, `client/registerCapability`, `window/workDoneProgress/create`, `workspace/workspaceFolders`, and `workspace/applyEdit` (forwarded as an event).
- **Collaborators:**

  ```text
  createLspHost → createLspClient(spec, root, events) → LspClient
  LspClient → vscode-jsonrpc MessageConnection → child process stdio
  ```

- **Boundary Contract:** `LspClient`, `ClientEvents` (section 7 `src/workspace/lsp/client.ts`)
- **Detailed Design:** section 7 `src/workspace/lsp/*`
- **Must Not Own:**
  - Store access or app state; it reports through `ClientEvents` only.

## Config and built-in table

- **Target:** `src/core/config/lsp.ts`
- **Kind:** Schema and pure resolver
- **Responsibilities:**
  - Validate `[lsp]`, own `BUILTIN_SERVERS`, and resolve the effective `ServerSpec[]` in table order.
- **Collaborators:**

  ```text
  ConfigSchema.lsp → LspConfigSchema ; createLspHost → resolveServers(config.lsp)
  ```

- **Boundary Contract:** `LspConfig`, `ServerSpec`
- **Detailed Design:** section 7 `src/core/config/lsp.ts`
- **Must Not Own:**
  - `PATH` lookup or root search (I/O).

## Diagnostics decoration

- **Target:** `src/core/kernel/view/diagnostics.ts`
- **Kind:** Kernel decoration provider
- **Responsibilities:**
  - Language-neutral `Diagnostic` and the provider that turns shown diagnostics into signs and underlines for visible lines.
- **Collaborators:**

  ```text
  text-view providers → diagnosticMarks(shown) → Decoration[]
  ```

- **Boundary Contract:** `Diagnostic`, `DiagnosticSeverity`
- **Detailed Design:** section 7 `src/core/kernel/view/diagnostics.ts`
- **Must Not Own:**
  - Which diagnostics are shown (insert freeze); that is `syncDiagnostics`.

## UI surfaces

- **Target:** `src/ui/overlays/lsp-float.ts`, `src/ui/views/statusline.ts`, `src/ui/views/cmdline.ts`, `src/ui/overlays/completion.ts`, `src/ui/editors/text-view.ts`, `src/ui/input.ts`, `src/ui/theme.ts`
- **Kind:** OpenTUI views
- **Responsibilities:**
  - Paint the float, the statusline segment, the cursor diagnostic message, code completion rows, and diagnostic styles. Normalize `<C-Space>`.
- **Collaborators:**

  ```text
  OverlayHost → LspFloat.update(s) ; Statusline → statusSegments(s).lsp ; Cmdline → cursorDiagnostic(s)
  ```

- **Boundary Contract:** state read-only, the same as existing views
- **Detailed Design:** section 7 UI entries
- **Must Not Own:**
  - Any LSP logic. The views read state only. Visual treatment beyond reusing existing tokens is open to `s1mple-discuss-ui`.

# 4. Project Structure Changes

**Proposed Structure — not an actual Git diff.**

**Legend:** `[A] Added` · `[M] Modified` · `[R] Renamed/Moved` · `[D] Deleted`

```text
./
├── [M] package.json
│       Contains: exact pins vscode-jsonrpc 9.0.3, vscode-languageserver-protocol 3.18.4
│       Decisions: DES1
├── [M] bun.lock
│       Contains: lockfile for the two packages
│       Decisions: DES1
├── scripts/
│   └── [M] bench-gate.ts
│           Symbols: TARGETS.lspKeystrokeP95 = 16, BENCHES entry
│           Decisions: DES6, DES17
├── src/
│   ├── app/
│   │   ├── [A] lsp-host.ts
│   │   │       Contains: process supervisor, sync, effect routing, crash policy, bounded stop
│   │   │       Symbols: LspHost, createLspHost, LSP_STOP_BOUND_MS, SYNC_DEBOUNCE_MS
│   │   │       Decisions: DES3, DES4, DES15, DES16
│   │   ├── [M] effects.ts
│   │   │       Symbols: RunnerDeps.lsp, run() cases lsp/lspCancel/lspReply/lspRestart
│   │   │       Decisions: DES5
│   │   ├── [M] lifecycle.ts
│   │   │       Symbols: installLifecycle deps.stopLsp
│   │   │       Decisions: DES3
│   │   └── [M] main.ts
│   │           Symbols: registries() (lspCommands, lspBindings, lspGroups, picker sources), main() wiring
│   │           Decisions: DES3, DES14, DES16
│   ├── core/
│   │   ├── config/
│   │   │   ├── [A] lsp.ts
│   │   │   │       Symbols: LspConfigSchema, LspConfig, ServerSpec, BUILTIN_SERVERS, LSP_FILE_TYPES, resolveServers
│   │   │   │       Decisions: DES2
│   │   │   └── [M] schema.ts
│   │   │           Symbols: ConfigSchema.lsp
│   │   │           Decisions: DES2
│   │   ├── features/links/
│   │   │   └── [M] rename.ts
│   │   │           Symbols: SpanEdit.expected?, applySpanEdits
│   │   │           Decisions: DES12
│   │   ├── kernel/view/
│   │   │   └── [A] diagnostics.ts
│   │   │           Symbols: Diagnostic, DiagnosticSeverity, diagnosticMarks, severityRank
│   │   │           Decisions: DES7
│   │   └── state/
│   │       ├── [A] lsp-types.ts
│   │       │       Symbols: ServerKey, LspFeature, ServerView, LspOp, LspResult, CodeLocation, CodeSymbol,
│   │       │                CodeAction, CodeEdit, CodeCompletionItem, LspFloat, PendingRequest, LspState
│   │       │       Decisions: DES5
│   │       ├── [A] lsp.ts
│   │       │       Symbols: request, pickServer, onLspServer, onLspAttached, onLspDiagnostics, onLspResult,
│   │       │                onLspMessage, onLspApplyEdit, onLspTimeout, syncDiagnostics, syncFloat, cursorDiagnostic
│   │       │       Decisions: DES5, DES6, DES7, DES8, DES9, DES11, DES15
│   │       ├── [A] lsp-commands.ts
│   │       │       Symbols: lspCommands, lspBindings, lspGroups, formattingOptions
│   │       │       Decisions: DES13, DES14
│   │       ├── [A] lsp-pickers.ts
│   │       │       Symbols: lspPickerSources (diagnostics, lspLocations, lspSymbols, lspActions, lspInfo)
│   │       │       Decisions: DES7, DES9, DES12, DES15
│   │       ├── [A] lsp-edits.ts
│   │       │       Symbols: startCodeEdit, onCodeEditApplied
│   │       │       Decisions: DES12
│   │       ├── [A] code-completion.ts
│   │       │       Symbols: codeCompletionStep, applyCompletion, rankCode
│   │       │       Decisions: DES10
│   │       ├── [M] types.ts
│   │       │       Symbols: AppState.lsp, Action (lsp*), Effect (lsp*), CompletionState.mode "code" + code,
│   │       │                PromptState (RenamePrompt), TimerId (completion, lsp:<id>, lspFormat:<id>)
│   │       │       Decisions: DES5, DES10, DES12, DES13
│   │       ├── [M] init.ts
│   │       │       Symbols: initialState().lsp
│   │       │       Decisions: DES5
│   │       ├── [M] update.ts
│   │       │       Symbols: createUpdate step cases, post-steps syncDiagnostics/syncFloat
│   │       │       Decisions: DES5, DES7, DES8
│   │       ├── [M] completion.ts
│   │       │       Symbols: maybeOpenCompletion → maybeCompletion (Result), completionKey code accept
│   │       │       Decisions: DES10
│   │       ├── [M] keys.ts
│   │       │       Symbols: handleKeyAction
│   │       │       Decisions: DES10, DES11
│   │       ├── [M] save.ts
│   │       │       Symbols: onTimer (completion, lsp:, lspFormat: timers)
│   │       │       Decisions: DES6, DES10, DES13
│   │       ├── [M] commands.ts
│   │       │       Symbols: writeActive (format on save), EX_ALIASES (Format, Diagnostics, LspInfo, LspRestart)
│   │       │       Decisions: DES13
│   │       ├── [M] explorer.ts
│   │       │       Symbols: promptKey submit for RenamePrompt
│   │       │       Decisions: DES12
│   │       ├── [M] link-edits.ts
│   │       │       Symbols: onEditsApplied (routes LSP batches to onCodeEditApplied)
│   │       │       Decisions: DES12
│   │       ├── [M] picker.ts
│   │       │       Symbols: pickerSources (spreads lspPickerSources)
│   │       │       Decisions: DES9
│   │       └── [M] status.ts
│   │               Symbols: StatusSegments.lsp, statusSegments
│   │               Decisions: DES15
│   ├── ui/
│   │   ├── [M] input.ts
│   │   │       Symbols: toKey (<C-Space>)
│   │   │       Decisions: DES14
│   │   ├── [M] theme.ts
│   │   │       Symbols: tokens diagnosticError/Warn/Info/Hint, float
│   │   │       Decisions: DES7, DES8
│   │   ├── editors/
│   │   │   └── [M] text-view.ts
│   │   │           Symbols: provider lists (+ diagnosticMarks)
│   │   │           Decisions: DES7
│   │   ├── overlays/
│   │   │   ├── [A] lsp-float.ts
│   │   │   │       Symbols: LspFloatView
│   │   │   │       Decisions: DES8
│   │   │   ├── [M] host.ts
│   │   │   │       Symbols: OverlayHost (adds LspFloatView above windows, below modal overlays)
│   │   │   │       Decisions: DES8
│   │   │   └── [M] completion.ts
│   │   │           Symbols: rows for code items (kind · label · detail)
│   │   │           Decisions: DES10
│   │   └── views/
│   │       ├── [M] statusline.ts
│   │       │       Symbols: lspSegment
│   │       │       Decisions: DES15
│   │       └── [M] cmdline.ts
│   │               Symbols: message fallback to cursorDiagnostic
│   │               Decisions: DES7
│   └── workspace/lsp/
│       ├── [A] client.ts
│       │       Symbols: LspClient, ClientEvents, createLspClient
│       │       Decisions: DES1, DES3, DES16
│       ├── [A] capabilities.ts
│       │       Symbols: clientCapabilities
│       │       Decisions: DES3, DES10, DES12
│       ├── [A] convert.ts
│       │       Symbols: pathToUri, uriToPath, toDiagnostic, toLocation, toSymbols, toCompletion, toCodeEdit,
│       │                toHover, toSignature, toLspPosition
│       │       Decisions: DES1, DES18
│       ├── [A] sync.ts
│       │       Symbols: lineChange
│       │       Decisions: DES4
│       ├── [A] roots.ts
│       │       Symbols: findRoot
│       │       Decisions: DES3
│       └── [A] language-id.ts
│               Symbols: languageIdFor
│               Decisions: DES3
└── test/
    ├── [M] boundaries.test.ts
    │       Symbols: PACKAGE_HOMES (+ two packages)
    │       Decisions: DES1
    ├── fixtures/
    │   └── [A] fake-lsp.ts
    │           Contains: scripted LSP server over stdio; logs received messages to a file
    │           Decisions: DES17
    ├── support/
    │   └── [A] lsp.ts
    │           Symbols: fakeServerConfig, readServerLog, waitForMessage
    │           Decisions: DES17
    ├── bench/
    │   └── [A] lsp-keystroke.bench.ts
    │           Decisions: DES6, DES17
    ├── integration/
    │   ├── [A] lsp-host.test.ts
    │   ├── [A] lsp-edits.test.ts
    │   └── [A] lsp-real.test.ts
    │           Decisions: DES3, DES4, DES12, DES16, DES17
    ├── e2e/
    │   └── [A] lsp.test.ts
    │           Decisions: DES7, DES10, DES14
    └── (colocated unit suites) src/**/[A] *.test.ts for every new src module, and [M] tests of modified modules
            Decisions: see section 8
```

`knip.json` needs no change: `test/**/*.ts` is already an entry, and every new `src` module is reached from `main.ts`. The build scripts and `release.yml` need no change because language servers are external processes, not compile entrypoints.

# 5. Runtime Flows and Error Policies

## Startup and attach

**Participating Symbols:** `createLspHost`, `resolveServers`, `findRoot`, `Bun.which`, `createLspClient`, `lspServer`, `lspAttached`

**Illustrative Flow:**

```text
store dispatch → subscriber observe(s)
  → s.config.lsp.enabled? no → stop all clients → done
  → for each listed buffer with a file type in LSP_FILE_TYPES:
       for each ServerSpec in resolveServers(s.config.lsp) matching the file type:
         Bun.which(spec.command[0])? no → dispatch lspServer{missing} once (for :LspInfo) → next
         root = findRoot(dir(path), spec.rootMarkers, workspaceRoot)
         key = `${spec.name}@${root}` → client exists? no → createLspClient → dispatch lspServer{key, state:"starting"}
            → initialize → initialized → dispatch lspServer{key, state:"ready", features, triggers}
         dispatch lspAttached{path, keys} when the set changes
         client.didOpen(path, languageIdFor(ft, path), version, text)
```

1. `observe` runs after every dispatch. It returns at once when neither `config.lsp`, the buffer set, nor any buffer version changed (identity checks).
2. Root search and `PATH` lookup run once per (spec, folder) and are cached in the host. A missing binary is dispatched once as `lspServer{key: "<name>@", view: {state: "missing"}}`.
3. `didOpen` is queued until `initialized` completes. The client buffers notifications before then.
4. Every `dispatch` the host makes from inside `observe` is deferred with `queueMicrotask`, so a store subscriber never re-enters `store.dispatch`. Dispatches from client events and request promises already run outside the subscriber and go straight through.

**Detailed Control Flow:** section 7 `src/app/lsp-host.ts` — `observe`, `attach`

## Document sync

**Participating Symbols:** `createLspHost.observe`, `lineChange`, `LspClient.didChange`, `SYNC_DEBOUNCE_MS`

**Illustrative Flow:**

```text
edit → BufferState.text (version n+1) → observe → doc.pending = text; schedule flush in 150 ms
flush → change = lineChange(doc.sent, doc.pending) → client.didChange(uri, version, [change]) → doc.sent = pending
request for path → flush(path) first → then request
saved (savedVersion advanced) → didSave ; buffer removed or file type changed → didClose
```

1. The host keeps `{sent: TextBuffer, pending?: TextBuffer, timer}` per (key, path).
2. `lineChange` compares lines from the start and the end and returns one change covering the differing middle. Identical buffers produce no notification.
3. `didChange` versions are the buffer's `text.version`, so they increase strictly per document.

**Detailed Control Flow:** section 7 `src/workspace/lsp/sync.ts`, `src/app/lsp-host.ts`

## Request and result

**Participating Symbols:** `lspCommands`, `request`, `pickServer`, `Effect lsp`, `LspHost.run`, `LspClient.request`, `lspResult`, `onLspResult`

**Illustrative Flow:**

```text
K → lsp.hover.run → request(s, "hover", {kind:"hover", pos})
   → pickServer(s, path, "hover") → none? → message "no language server for <ft>" / "hover: not supported by …"
   → pending[id] = {feature, path, version, window, pos}; effects: lspCancel(prev hover), startTimer lsp:id 5000, lsp{id, key, path, op}
host.run(lsp) → flush(path) → client.request(op) → convert → dispatch lspResult{id, result}
onLspResult → pending missing or version ≠ current → drop
            → hover → s.lsp.float ; definition 1 → recordJump + goTo ; n → lspLocations picker ; …
timer lsp:id fires first → onLspTimeout → drop pending + message "<feature>: timed out"
```

**Detailed Control Flow:** section 7 `src/core/state/lsp.ts` — `request`, `onLspResult`

## Diagnostics

**Participating Symbols:** `ClientEvents.diagnostics`, `lspDiagnostics`, `onLspDiagnostics`, `syncDiagnostics`, `diagnosticMarks`, `cursorDiagnostic`

**Illustrative Flow:**

```text
server publishDiagnostics → convert (clamp ranges later) → dispatch lspDiagnostics{key, path, items}
onLspDiagnostics → lsp.diagnostics[path][key] = items (empty → delete)
post-step syncDiagnostics → active window in insert mode on that path? keep lsp.shown[path] : shown[path] = merged published
text view → diagnosticMarks(shown[path], visible lines) → signs + underlines
cmdline (no message) → cursorDiagnostic(s) → "E rust-analyzer: mismatched types"
```

**Detailed Control Flow:** section 7 `src/core/state/lsp.ts` — `syncDiagnostics`; `src/core/kernel/view/diagnostics.ts`

## Completion

**Participating Symbols:** `handleKeyAction`, `maybeCompletion`, `codeCompletionStep`, `TimerId "completion"`, `request`, `onLspResult`, `completionKey`, `applyCompletion`

**Illustrative Flow:**

```text
insert key in code buffer → maybeCompletion
   typed trigger char → request completion now (trigger)
   identifier char → startTimer completion 150 ms
   timer → request completion (word start, prefix)
result (version matches) → overlay completion{mode:"code", code:{items, incomplete, wordStart}}
more typing → same word start & !incomplete → rankCode(items, prefix) locally ; else → new request
Enter/Tab → resolve? (completionItem/resolve) → applyCompletion → applyBufferEdits([main, ...additional]) one undo step
Esc → leaves insert mode, which closes the popup (as link completion does today)
```

**Detailed Control Flow:** section 7 `src/core/state/code-completion.ts`

## Workspace edit

**Participating Symbols:** `startCodeEdit`, `applyBufferEdits`, `Effect applyEdits`, `onEditsApplied`, `onCodeEditApplied`, `lspReply`

**Illustrative Flow:**

```text
CodeEdit {files: [{path, version?, edits}]} (from rename, code action, or applyEdit)
 → any versioned file whose open buffer version ≠ version → refuse all → toast + reply applied:false
 → open buffers: applyBufferEdits per buffer (one undo step each)
 → closed files: effects applyEdits{batch, edit:{path, edits (expected omitted)}} on the serial queue
 → s.lsp.edit = {batch, pending, updated, skipped, reply?}
editsApplied{batch} → onEditsApplied → batch is LSP? → onCodeEditApplied → pending empty → toast "N files changed" (+ skipped) → reply
```

**Detailed Control Flow:** section 7 `src/core/state/lsp-edits.ts`

## Format on save

**Participating Symbols:** `writeActive`, `formatOnSave`, `request`, `TimerId lspFormat:<id>`, `onLspResult`, `onTimer`, `writeBuffer`

**Illustrative Flow:**

```text
:w → writeActive → code buffer & config.lsp.formatOnSave & formatting server?
   → yes: request formatting; s.lsp.format = {bufferId, requestId}; startTimer lspFormat:<bufferId> 1000
   → result first: apply edits (one undo step) → writeBuffer ; timer first: drop pending → writeBuffer + warning toast
autosave timer → writeBuffer directly (never formats)
```

**Detailed Control Flow:** section 7 `src/core/state/lsp-commands.ts` — `formatCommand`; `src/core/state/commands.ts` — `writeActive`

## Crash and restart

**Participating Symbols:** `LspClient` `exited`/`error` events, `createLspHost` crash map, `lspServer`, `lsp.restart`

**Illustrative Flow:**

```text
process exits unexpectedly or the transport errors → host: crashes[key]++
  → 1st: dispatch lspServer{key, state:"starting"}; unanswered requests → lspResult{id, error:"server restarted"}
         → new client → initialize → didOpen every attached open buffer
  → 2nd: dispatch lspServer{key, state:"failed"} → onLspServer → toast "<name> stopped: <reason>"; diagnostics of key removed
:LspRestart → Effect lspRestart{keys} → host: stop clients, crashes[key] = 0, attach again
```

## Server messages and progress

**Participating Symbols:** `ClientEvents.message`, `ClientEvents.progress`, `lspMessage`, `lspServer`, progress throttle

**Illustrative Flow:**

```text
window/showMessage {type} → error|warning → dispatch lspMessage → toast ; info|log → logger.info("lsp.message") only
$/progress begin/report/end → host keeps latest per key → at most one lspServer dispatch per key per 100 ms
```

## Watched files

**Participating Symbols:** `watchWorkspace` callback, `LspHost.notify`, `LspClient.watched`, `Bun.Glob`

**Illustrative Flow:**

```text
FileEvent → host.notify → each client with registered watchers → glob match (relative to its root) → workspace/didChangeWatchedFiles (debounced 100 ms per client)
```

## Shutdown

**Participating Symbols:** `installLifecycle`, `LspHost.stop`, `LspClient.stop`, `LSP_STOP_BOUND_MS`

**Illustrative Flow:**

```text
shutdown → flush writes (≤ 2000 ms) → save session → stop preview (≤ 250 ms) → lspHost.stop():
   all clients in parallel: shutdown request → exit notification → wait exit; race 500 ms → SIGKILL survivors
 → restore terminal
```

## Config reload

**Participating Symbols:** `onConfigLoaded`, `createLspHost.observe`, `reconcile`

**Illustrative Flow:**

```text
:ConfigReload → configLoaded → s.config replaced → observe sees new config.lsp
  → enabled false → stop all ; a spec changed (command, settings, initOptions, fileTypes, rootMarkers) → stop its clients → attach again
  → only settings changed → workspace/didChangeConfiguration instead of restart
```

## Failure and Recovery Rules

- **Binary missing** — detected by `Bun.which` in `attach`; represented as a `ServerView` with state `missing` (for `:LspInfo`); not attached, no toast.
- **Spawn or `initialize` fails** — detected by `createLspClient` rejecting; counted as a crash.
- **Request error response** — detected by `LspClient.request` rejection; represented as `lspResult{id, error}`; `onLspResult` shows `<feature>: <message>` for user-triggered features and ignores errors from automatic ones (auto-completion, auto-signature).
- **Request timeout** — `lsp:<id>` timer; `onLspTimeout` drops the pending entry, shows a message for user-triggered features, and emits `lspCancel`.
- **Stale result** — `onLspResult` compares `pending.version` with the buffer's current `text.version` (and cursor for completion); a mismatch is dropped silently.
- **Malformed server data** — `convert.ts` validates the fields it reads and drops items it cannot convert (one log line). A throw in a reducer keeps the previous state (`update.ts:198-215`).
- **Edit refused** — a version mismatch or an out-of-range edit; represented in `s.lsp.edit.skipped`; summary toast; `applyEdit` replies `{applied:false, failureReason}`.
- **Server ignores `shutdown`** — the bounded stop kills it after 500 ms.

## Construction and Wiring Flow

```text
src/app/main.ts → registries(): commands.register(...lspCommands); bindings += lspBindings; groups += lspGroups
                → createLspHost({root, dispatch, logger, which: Bun.which, spawn?})
                ├→ deps.lsp = lspHost                         (effect runner routes lsp effects)
                ├→ store.subscribe(lspHost.observe)           (after createStore, before shell.attach)
                ├→ watchWorkspace(..., e => { …; lspHost.notify(e) })
                └→ installLifecycle({…, stopLsp: lspHost.stop})
```

- **Construction:** `src/app/main.ts` — `main` — creates the host with the workspace root, dispatch, logger, and `Bun.which`.
- **Registration:** `src/app/main.ts` — `registries` — registers `lspCommands`, `lspBindings`, and `lspGroups` (`<leader>x` → "diagnostics" in code file types). `src/core/state/picker.ts` — `pickerSources` includes `lspPickerSources`.
- **Exports:** `src/app/lsp-host.ts` — `createLspHost`, `LspHost`; `src/workspace/lsp/client.ts` — `createLspClient`, `LspClient`, `ClientEvents`; `src/core/config/lsp.ts` — `LspConfigSchema`, `resolveServers`, `BUILTIN_SERVERS`, `LSP_FILE_TYPES`, `ServerSpec`.
- **Configuration:** `src/core/config/schema.ts` — `lsp` — read at startup and on `:ConfigReload`; the host reacts through `observe`.

# 6. Logical Contracts, Data Models, and State

| Item | Kind | Purpose | Used By |
|---|---|---|---|
| `LspConfig` / `ServerSpec` | Schema / Data Model | The validated `[lsp]` section and resolved server definitions | `ConfigSchema` → `resolveServers` → `createLspHost` |
| `Diagnostic` | Data Model | Language-neutral diagnostic | `convert.ts` → `onLspDiagnostics` → `diagnosticMarks`, pickers |
| `LspState` | State Model | All LSP state in `AppState.lsp` | core reducers; UI read-only |
| `LspOp` / `LspResult` | Contract | Request kinds and their results | core `request` → host → client → `lspResult` |
| LSP effects | Message | Core → host instructions | reducers → `createEffectRunner` → `LspHost.run` |
| LSP actions | Message | Host → core events | `LspHost` → `store.dispatch` → `createUpdate` |
| `CodeEdit` | Data Model | Protocol-free workspace edit | `convert.toCodeEdit` → `startCodeEdit` |
| `CompletionState` (code mode) | State Model | Popup state for code items | `codeCompletionStep` → completion overlay |
| `RenamePrompt` | State Model | Prompt for `grn` | `lsp.rename` → `promptKey` |
| `SpanEdit.expected?` | Contract | Closed-file edit without expected text | `startCodeEdit` → `applyEdits` runner → `applySpanEdits` |
| `LspHost` / `LspClient` | Contract | App and workspace adapter interfaces | `main.ts`, runner, lifecycle |

## `LspConfig` / `ServerSpec` — Schema / Data Model

**Purpose:** Defines what the user can configure and the effective server list.

**Includes:**

- `enabled` — default `false`; nothing starts while false.
- `formatOnSave` — default `false`.
- `servers` — record by name of `{enabled?, command?, fileTypes?, rootMarkers?, settings?, initOptions?}`.
- `ServerSpec` — `{name, command, fileTypes, rootMarkers, settings, initOptions}` after merging.

**Usage:**

```text
config.toml → parseConfig → ConfigSchema.lsp (LspConfigSchema) → resolveServers → ServerSpec[] (table order) → createLspHost
```

**Rules:**

- **Compatibility:** optional section; existing files stay valid.
- **Invariants:** every `fileTypes` entry is in `LSP_FILE_TYPES`; an added (non-built-in) server has `command` (non-empty) and `fileTypes` (non-empty); `command` is an argv array, never a shell string.
- **Ownership and Lifecycle:** owned by `AppState.config`; replaced on reload.

**Location:** `src/core/config/lsp.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/config/lsp.ts`

## `Diagnostic` — Data Model

**Purpose:** A protocol-free diagnostic that the kernel can draw.

**Includes:**

- `range: Range` — UTF-16 positions in buffer lines.
- `severity: 1 | 2 | 3 | 4` — error, warning, info, hint (the LSP numbering, kept because it orders naturally).
- `message`, `source?`, `code?`.

**Usage:**

```text
convert.toDiagnostic → lspDiagnostics → LspState.diagnostics → syncDiagnostics → LspState.shown → diagnosticMarks
```

**Rules:**

- **Compatibility:** None — new type.
- **Invariants:** `diagnosticMarks` clamps ranges to existing lines and columns, and never throws on out-of-range data.
- **Ownership and Lifecycle:** replaced per publish (server, path); removed when the server stops or publishes an empty list.

**Location:** `src/core/kernel/view/diagnostics.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/kernel/view/diagnostics.ts`

## `LspState` — State Model

**Purpose:** The core's whole view of language servers.

**Includes:**

- `servers: Record<ServerKey, ServerView>` — name, root, state (`starting`/`ready`/`failed`), progress text, features, trigger characters.
- `attached: Record<path, ServerKey[]>` — table order.
- `diagnostics: Record<path, Record<ServerKey, Diagnostic[]>>` — published.
- `shown: Record<path, Diagnostic[]>` — what views draw (frozen during insert).
- `pending: Record<number, PendingRequest>`, `nextId: number`.
- `float?: LspFloat`, `list?: {title, locations}`, `symbols?`, `actions?`, `edit?: CodeEditBatch`, `format?: {bufferId, requestId}`.

**Usage:**

```text
host actions → onLsp* reducers → LspState → statusSegments, text view, float view, pickers
```

**Rules:**

- **Compatibility:** not persisted; `PersistedState` is unchanged.
- **Invariants:** every `pending` id has a `lsp:<id>` timer or belongs to an automatic request; `shown[path]` equals the merge of `diagnostics[path]` whenever the active window is not in insert mode on `path`; `attached[path]` lists only keys present in `servers`.
- **Ownership and Lifecycle:** created empty by `initialState`; entries for a server are removed when it fails or stops.

**Location:** `src/core/state/lsp-types.ts`, `AppState.lsp` in `src/core/state/types.ts:379-428` — None — proposed item

**Detailed Shape:** section 7 `src/core/state/lsp-types.ts`

## `LspOp` / `LspResult` — Contract

**Purpose:** One closed set of operations and results shared by core and host, without protocol types.

**Includes:**

- `LspOp`: `hover`, `definition`, `implementation`, `references`, `symbols`, `completion`, `resolveCompletion`, `signature`, `prepareRename`, `rename`, `codeActions`, `resolveAction`, `executeCommand`, `format`.
- `LspResult`: `hover{text}`, `locations{items}`, `symbols{items}`, `completion{items, incomplete}`, `completionItem{item}`, `signature{label, params, active}`, `prepareRename{range, placeholder}`, `edit{CodeEdit}`, `actions{items}`, `none`, and `error{message}`.

**Usage:**

```text
request(s, feature, op) → Effect lsp{id, key, path, op} → host → client → convert → lspResult{id, result}
```

**Rules:**

- **Compatibility:** internal; may change freely.
- **Invariants:** each op maps to exactly one LSP method in `client.ts`; results reference workspace-relative paths only.
- **Ownership and Lifecycle:** request ids come from `LspState.nextId`.

**Location:** `src/core/state/lsp-types.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/state/lsp-types.ts`

## LSP effects and actions — Message

**Purpose:** The only channel between the pure core and the host.

**Includes:**

- Effects: `lsp{id, key, path, op}`, `lspCancel{id, key}`, `lspReply{key, requestId, applied, failureReason?}`, `lspRestart{keys}`.
- Actions: `lspServer{key, view}`, `lspAttached{path, keys}`, `lspDiagnostics{key, path, items}`, `lspResult{id, result}`, `lspMessage{key, level, text}`, `lspApplyEdit{key, requestId, edit}`.

**Usage:**

```text
reducers → effects → createEffectRunner → LspHost.run ; LspHost → dispatch(actions) → createUpdate
```

**Rules:**

- **Compatibility:** internal.
- **Invariants:** `lspReply` is emitted exactly once per `lspApplyEdit`.
- **Ownership and Lifecycle:** None — messages are transient.

**Location:** `src/core/state/types.ts:430-571` (unions extended) — None — proposed variants

**Detailed Shape:** section 7 `src/core/state/types.ts`

## `CodeEdit` — Data Model

**Purpose:** A protocol-free workspace edit with an optional document version per file.

**Includes:** `files: {path, version?: number, edits: {range: Range, text: string}[]}[]`, `outside: number` (files outside the workspace, refused).

**Usage:** `convert.toCodeEdit` → `lspResult{edit}` or `lspApplyEdit` → `startCodeEdit`.

**Rules:**

- **Compatibility:** None — new type.
- **Invariants:** edits within a file do not overlap (LSP guarantees this; an overlap refuses that file); `outside > 0` refuses the whole edit.
- **Ownership and Lifecycle:** transient; the batch progress lives in `LspState.edit`.

**Location:** `src/core/state/lsp-types.ts` — None — proposed item

**Detailed Shape:** section 7 `src/core/state/lsp-types.ts`

## `CompletionState` (code mode) — State Model

**Purpose:** Lets the existing popup show code items.

**Includes:** `mode: "code"`; `code: {key, wordStart: Pos, items: CodeCompletionItem[], incomplete: boolean, version}`; the existing `items` holds the ranked display rows `{insert, label, detail}`, and `CodeCompletionItem.index` links a row to its source item.

**Usage:** `codeCompletionStep` → `overlay.completion` → completion overlay; `completionKey` accept → `applyCompletion`.

**Rules:**

- **Compatibility:** link modes (`notes`/`headings`/`blocks`) unchanged.
- **Invariants:** `code` is present exactly when `mode === "code"`.
- **Ownership and Lifecycle:** closed on `Esc`, on leaving insert, or when the cursor leaves the word.

**Location:** `src/core/state/types.ts:176-185`

**Detailed Shape:** section 7 `src/core/state/types.ts`

## `RenamePrompt` — State Model

**Purpose:** The prompt `grn` opens.

**Includes:** `PromptBase & { rename: { key, path, pos, version } }`.

**Usage:** `lsp.rename` → overlay prompt → `promptKey` Enter → `request(rename)`.

**Rules:**

- **Compatibility:** `ExplorerPrompt` and `NewNotePrompt` unchanged.
- **Invariants:** `invalid` is set while `value` is empty or equals the current name.
- **Ownership and Lifecycle:** closed on Enter or Esc.

**Location:** `src/core/state/types.ts:146-163`

**Detailed Shape:** section 7 `src/core/state/types.ts`

## `SpanEdit.expected?` — Contract

**Purpose:** Lets LSP edits to closed files reuse the runner's `applyEdits`, where no expected text is known.

**Includes:** `expected?: string` — when absent, only range bounds are checked.

**Usage:** `startCodeEdit` → `applyEdits` effect → runner → `applySpanEdits`.

**Rules:**

- **Compatibility:** link rename always sets `expected`, so its behaviour is unchanged.
- **Invariants:** an out-of-range span still returns `null` (refuse the file).
- **Ownership and Lifecycle:** None.

**Location:** `src/core/features/links/rename.ts:8`, `:132-158`

**Detailed Shape:** section 7 `src/core/features/links/rename.ts`

## `LspHost` / `LspClient` — Contract

**Purpose:** The app and workspace adapter interfaces.

**Includes:** `LspHost{observe(s), run(e), notify(event), stop()}`; `LspClient{ready, didOpen, didChange, didSave, didClose, request(op), cancel(id), notifyWatched(events), changeConfiguration(settings), stop(boundMs)}`, plus `ClientEvents` callbacks.

**Usage:** `main.ts` → host; host → clients.

**Rules:**

- **Compatibility:** None — new.
- **Invariants:** `stop()` resolves within `LSP_STOP_BOUND_MS` plus kill time; no client outlives `stop()`.
- **Ownership and Lifecycle:** the host owns clients; `main.ts` owns the host.

**Location:** `src/app/lsp-host.ts`, `src/workspace/lsp/client.ts` — None — proposed items

**Detailed Shape:** section 7 `src/app/lsp-host.ts`, `src/workspace/lsp/client.ts`

# 7. Detailed Code Design

## `src/core/config/lsp.ts`

- **Change:** Add
- **Decisions:** DES2
- **Requirements:** `W261005GWLY-REQ1@R1`, `W261005GWLY-REQ2@R1`, `W261005GWLY-REQ5@R1`, `W261005GWLY-REQ11@R1`
- **Responsibilities:** `[lsp]` schema, built-in table, and resolution.
- **Affected Callers/Consumers:** `src/core/config/schema.ts` (`ConfigSchema.lsp`), `src/app/lsp-host.ts`, `src/core/state/lsp-commands.ts` (`formatOnSave`)
- **Construction/Wiring:** None — pure module.
- **Dependencies:** `zod`, `CODE_LANGUAGES` (`src/core/lang/code/file-types.ts:17`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `LspConfigSchema` | None — new symbol | strict object `{enabled, formatOnSave, servers}` | `ConfigSchema` |
| `BUILTIN_SERVERS` | None — new symbol | six `ServerSpec`s in fixed order | `resolveServers` |
| `LSP_FILE_TYPES` | None — new symbol | `CODE_LANGUAGES` ids minus `markdown` | schema, `lspBindings` |
| `resolveServers` | None — new symbol | `(c: LspConfig) => ServerSpec[]` | `createLspHost`, `lspInfo` |

**Existing Shape:** None — new file or symbol

**Proposed Shape:**

```ts
export const LSP_FILE_TYPES: readonly string[] = CODE_LANGUAGES
  .map((l) => l.id).filter((id) => id !== "markdown");

const ServerEntry = z.strictObject({
  enabled: z.boolean().optional(),
  command: z.array(z.string().min(1)).min(1).optional(),
  fileTypes: z.array(z.enum(LSP_FILE_TYPES)).min(1).optional(),
  rootMarkers: z.array(z.string().min(1)).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  initOptions: z.record(z.string(), z.unknown()).optional(),
});

export const LspConfigSchema = z.strictObject({
  enabled: z.boolean().default(false),
  formatOnSave: z.boolean().default(false),
  servers: z.record(z.string().min(1), ServerEntry).default({}),
}).superRefine((c, ctx) => {
  for (const [name, s] of Object.entries(c.servers))
    if (!BUILTIN_NAMES.has(name) && (s.command === undefined || s.fileTypes === undefined))
      ctx.addIssue({ code: "custom", path: ["servers", name], message: "a new server needs command and fileTypes" });
});

export type ServerSpec = {
  name: string; command: readonly string[]; fileTypes: readonly string[];
  rootMarkers: readonly string[]; settings: Record<string, unknown>; initOptions?: Record<string, unknown>;
};

export const BUILTIN_SERVERS: readonly ServerSpec[] = [
  { name: "typescript", command: ["typescript-language-server", "--stdio"], fileTypes: ["typescript", "javascript"],
    rootMarkers: ["tsconfig.json", "jsconfig.json", "package.json"], settings: {} },
  { name: "pyright", command: ["pyright-langserver", "--stdio"], fileTypes: ["python"],
    rootMarkers: ["pyproject.toml", "pyrightconfig.json", "setup.py", "setup.cfg", "requirements.txt"], settings: {} },
  { name: "gopls", command: ["gopls"], fileTypes: ["go"], rootMarkers: ["go.work", "go.mod"], settings: {} },
  { name: "rust-analyzer", command: ["rust-analyzer"], fileTypes: ["rust"], rootMarkers: ["Cargo.toml"], settings: {} },
  { name: "clangd", command: ["clangd"], fileTypes: ["c", "cpp", "objectivec"],
    rootMarkers: ["compile_commands.json", "compile_flags.txt", ".clangd"], settings: {} },
  { name: "json", command: ["vscode-json-language-server", "--stdio"], fileTypes: ["json"], rootMarkers: [],
    settings: {}, initOptions: { provideFormatter: true } },
];

/** Built-ins in table order with overrides applied and disabled ones removed, then added servers in config order. */
export function resolveServers(c: LspConfig): ServerSpec[];
```

`LSP_FILE_TYPES` comes from the code language table, so the schema rejects `markdown`, `base`, `text`, and typos with zod's enum message on the key's line (`parseConfig` already maps issue paths to lines, `src/core/config/toml.ts:35-43`). `ServerEntry` is a partial definition: for a built-in it is an override, and for a new name it must be complete, which `superRefine` enforces. `resolveServers` walks `BUILTIN_SERVERS` in order, applies a same-named entry field by field, and drops `enabled: false`. It then appends added servers in the order `Object.entries` returns them, which is TOML key order. That order is the routing order `pickServer` uses. The json server needs `provideFormatter: true` to offer formatting.

- **Invariants:**
  - A resolved spec always has a non-empty `command` and `fileTypes`.
  - `enabled: false` in `[lsp]` keeps `resolveServers` pure; the host checks `enabled` before using it.
- **Verification Coverage:** `S1`, `S3`, `S9` — `V1`, `V3`, `V4`, `V11`

## `src/core/config/schema.ts`

- **Change:** Modify
- **Decisions:** DES2
- **Requirements:** `W261005GWLY-REQ1@R1`
- **Responsibilities:** Add the `lsp` section.
- **Affected Callers/Consumers:** `AppConfig` users; `defaults`
- **Construction/Wiring:** None — schema.
- **Dependencies:** `LspConfigSchema`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `ConfigSchema` | `src/core/config/schema.ts:46-105`, no `lsp` key | adds `lsp: LspConfigSchema.prefault({})` | `AppConfig`, `parseConfig`, host |

**Existing Shape:** `src/core/config/schema.ts:52-58`

```ts
  autosave: z
    .strictObject({
      enabled: z.boolean().default(true),
      delayMs: z.number().int().min(0).default(1000),
    })
    .prefault({}),
```

Each section is a strict object with defaults and `.prefault({})`, so a missing section takes its defaults.

**Proposed Shape:**

```ts
  lsp: LspConfigSchema.prefault({}),
```

The `lsp` key follows the same pattern, so `defaults.lsp.enabled === false` and every existing config file stays valid.

- **Invariants:**
  - Unknown keys under `[lsp]` remain errors (strict).
- **Verification Coverage:** `S1` — `V1`, `V11`

## `src/core/kernel/view/diagnostics.ts`

- **Change:** Add
- **Decisions:** DES7
- **Requirements:** `W261005GWLY-REQ6@R1`
- **Responsibilities:** Language-neutral diagnostic type and decoration provider.
- **Affected Callers/Consumers:** `src/ui/editors/text-view.ts`, `src/core/state/lsp.ts`, `src/workspace/lsp/convert.ts`
- **Construction/Wiring:** None — pure.
- **Dependencies:** `Decoration`, `DecorationProvider`, `Range`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `Diagnostic` | None — new symbol | `{range, severity, message, source?, code?}` | converters, reducers, provider |
| `diagnosticMarks` | None — new symbol | `(shown: readonly Diagnostic[]) => DecorationProvider` | text view |

**Existing Shape:** None — new file or symbol

**Proposed Shape:**

```ts
export type DiagnosticSeverity = 1 | 2 | 3 | 4;
export type Diagnostic = { range: Range; severity: DiagnosticSeverity; message: string; source?: string; code?: string };

const SIGN: Record<DiagnosticSeverity, Sign> = {
  1: { text: "E", style: "diagnosticError" }, 2: { text: "W", style: "diagnosticWarn" },
  3: { text: "I", style: "diagnosticInfo" }, 4: { text: "H", style: "diagnosticHint" },
};

/** Signs (highest severity per line) and underlines for the visible lines; ranges are clamped to the buffer. */
export function diagnosticMarks(shown: readonly Diagnostic[]): DecorationProvider {
  return (v) => { /* filter by v.visible, clamp to v.buf, one line decoration per line, one mark per range */ };
}
```

`diagnosticMarks` closes over the shown list and returns an ordinary provider, so `layoutText` needs no change. A `line` decoration sets the sign, and since the last sign wins (`src/core/kernel/view/text-view.ts:95-100`), the provider emits only one per line, using the lowest severity number. A zero-width range is widened to one character, or to the line end at end of line, so it stays visible.

- **Invariants:**
  - Never throws for ranges outside the buffer.
  - Reads only `v.visible` lines.
- **Verification Coverage:** `S10`, `S11` — `V13`, `V14`

## `src/core/state/lsp-types.ts`

- **Change:** Add
- **Decisions:** DES5, DES6, DES9, DES10, DES12
- **Requirements:** `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ12@R1`, `W261005GWLY-REQ14@R1`
- **Responsibilities:** All protocol-free LSP types.
- **Affected Callers/Consumers:** `types.ts`, every `lsp*` module, `src/workspace/lsp/convert.ts`, `src/app/lsp-host.ts`
- **Construction/Wiring:** None.
- **Dependencies:** `Pos`, `Range`, `Diagnostic`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| all listed | None — new symbol | below | as above |

**Existing Shape:** None — new file or symbol

**Proposed Shape:**

```ts
export type ServerKey = string; // `${name}@${root}`
export type LspFeature = "hover" | "definition" | "implementation" | "references" | "symbols" | "completion"
  | "completionResolve" | "signature" | "rename" | "prepareRename" | "codeActions" | "codeActionResolve"
  | "format" | "rangeFormat";

export type ServerView = {
  name: string; root: string; state: "missing" | "starting" | "ready" | "failed";
  progress?: string; features: readonly LspFeature[];
  completionTriggers: readonly string[]; signatureTriggers: readonly string[];
};

export type CodeLocation = { path: string; range: Range };
export type CodeSymbol = { name: string; kind: string; range: Range; depth: number };
export type CodeTextEdit = { range: Range; text: string };
export type CodeEdit = { files: { path: string; version?: number; edits: CodeTextEdit[] }[]; outside: number };
export type CodeCompletionItem = {
  label: string; detail?: string; kind?: string; filterText: string; sortText: string;
  edit?: CodeTextEdit; insertText?: string; additional: CodeTextEdit[]; resolved: boolean; data: unknown;
};
export type CodeAction = { title: string; kind?: string; edit?: CodeEdit; command?: unknown; resolved: boolean; data: unknown };

export type LspOp =
  | { kind: "hover" | "definition" | "implementation" | "references" | "signature" | "prepareRename"; pos: Pos }
  | { kind: "symbols" }
  | { kind: "completion"; pos: Pos; trigger?: string }
  | { kind: "resolveCompletion"; item: CodeCompletionItem }
  | { kind: "rename"; pos: Pos; newName: string }
  | { kind: "codeActions"; range: Range; diagnostics: readonly Diagnostic[] }
  | { kind: "resolveAction"; action: CodeAction }
  | { kind: "executeCommand"; command: unknown }
  | { kind: "format"; range?: Range; options: { tabSize: number; insertSpaces: boolean } };

export type LspResult =
  | { kind: "hover"; text: string } | { kind: "locations"; items: CodeLocation[]; outside: number }
  | { kind: "symbols"; items: CodeSymbol[] } | { kind: "completion"; items: CodeCompletionItem[]; incomplete: boolean }
  | { kind: "completionItem"; item: CodeCompletionItem }
  | { kind: "signature"; label: string; active?: { start: number; end: number } }
  | { kind: "prepareRename"; placeholder: string } | { kind: "edit"; edit: CodeEdit }
  | { kind: "actions"; items: CodeAction[] } | { kind: "action"; action: CodeAction }
  | { kind: "none" } | { kind: "error"; message: string };

export type PendingRequest = {
  feature: LspFeature; key: ServerKey; path: string; version: number; window: number; pos?: Pos; auto: boolean;
};
export type LspFloat = { kind: "hover" | "signature" | "diagnostics"; window: number; at: Pos; lines: string[]; active?: { line: number; start: number; end: number } };
export type CodeEditBatch = { batch: number; pending: string[]; updated: string[]; skipped: { path: string; reason: string }[]; reply?: { key: ServerKey; requestId: number | string } };

export type LspState = {
  servers: Record<ServerKey, ServerView>;
  attached: Record<string, ServerKey[]>;
  diagnostics: Record<string, Record<ServerKey, Diagnostic[]>>;
  shown: Record<string, Diagnostic[]>;
  pending: Record<number, PendingRequest>;
  nextId: number;
  float?: LspFloat;
  list?: { title: string; items: CodeLocation[] };
  symbols?: { path: string; items: CodeSymbol[] };
  actions?: { key: ServerKey; path: string; items: CodeAction[] };
  edit?: CodeEditBatch;
  format?: { bufferId: number; requestId: number };
};
```

A `missing` view (key `name@`, no root) records a configured server whose binary is not on `PATH`; it is never attached and only `:LspInfo` shows it. `ServerView.features` is computed by `convert.ts` from the server's `ServerCapabilities` (and dynamic registrations), so the core can route requests without protocol types. `CodeCompletionItem.data` and `CodeAction.data`/`command` carry server data the core never reads; they go back to the server unchanged on resolve or execute. `PendingRequest.auto` marks requests the user didn't ask for (auto-completion, auto-signature), whose errors are silent and which have no timeout message. `CodeEdit.outside` counts files outside the workspace, which refuse the edit (DES18).

- **Invariants:**
  - All paths are workspace-relative; the host never sends a core value containing a URI.
- **Verification Coverage:** `S7`, `S29` — `V9`, `V40`

## `src/core/state/types.ts`

- **Change:** Modify
- **Decisions:** DES5, DES10, DES12, DES13
- **Requirements:** `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ8@R1`, `W261005GWLY-REQ10@R1`, `W261005GWLY-REQ11@R1`
- **Responsibilities:** Extend the app protocol.
- **Affected Callers/Consumers:** `createUpdate` (exhaustive switch), `createEffectRunner` (exhaustive switch), `initialState`, `completion.ts`, `promptKey` (`explorer.ts`), `onTimer`
- **Construction/Wiring:** None.
- **Dependencies:** `lsp-types.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `AppState` | `:379-428`, no `lsp` | adds `lsp: LspState` | `initialState`, reducers, UI |
| `Action` | `:430-516` | adds `lspServer`, `lspAttached`, `lspDiagnostics`, `lspResult`, `lspMessage`, `lspApplyEdit` | `createUpdate`, host |
| `Effect` | `:518-571` | adds `lsp`, `lspCancel`, `lspReply`, `lspRestart` | `createEffectRunner` |
| `CompletionState` | `:176-185`, `mode: "notes" \| "headings" \| "blocks"` | adds `"code"` mode and `code?` payload | `completion.ts`, completion overlay |
| `PromptState` | `:163`, `ExplorerPrompt \| NewNotePrompt` | adds `RenamePrompt` | prompt key handling, prompt overlay |
| `TimerId` | `:59-65` | adds `"completion"`, `` `lsp:${number}` ``, `` `lspFormat:${BufferId}` `` | `onTimer` |

**Existing Shape:** `src/core/state/types.ts:176-185`

```ts
export type CompletionState = {
  /** The position just after "[[". */
  anchor: Pos;
  mode: "notes" | "headings" | "blocks";
  /** The resolved note whose headings or blocks are listed. */
  target?: string;
  query: string;
  items: { insert: string; label: string; detail?: string }[];
  selected: number;
};
```

The popup state holds the anchor, the mode, the typed query, the ranked display rows, and the selection.

**Proposed Shape:**

```ts
export type CompletionState = {
  anchor: Pos;
  mode: "notes" | "headings" | "blocks" | "code";
  target?: string;
  query: string;
  items: { insert: string; label: string; detail?: string; source?: number }[];
  selected: number;
  /** Code completion: the server's items, kept for local re-ranking and accept. */
  code?: { key: ServerKey; items: CodeCompletionItem[]; incomplete: boolean; version: number };
};

type RenamePrompt = PromptBase & { rename: { key: ServerKey; path: string; pos: Pos; version: number }; op?: never; newNote?: never };
export type PromptState = ExplorerPrompt | NewNotePrompt | RenamePrompt;

// Action additions
  | { type: "lspServer"; key: ServerKey; view: ServerView | undefined }   // undefined: stopped
  | { type: "lspAttached"; path: string; keys: ServerKey[] }
  | { type: "lspDiagnostics"; key: ServerKey; path: string; items: Diagnostic[] }
  | { type: "lspResult"; id: number; result: LspResult }
  | { type: "lspMessage"; key: ServerKey; level: "error" | "warning"; text: string }
  | { type: "lspApplyEdit"; key: ServerKey; requestId: number | string; edit: CodeEdit }
// Effect additions
  | { kind: "lsp"; id: number; key: ServerKey; path: string; op: LspOp }
  | { kind: "lspCancel"; id: number; key: ServerKey }
  | { kind: "lspReply"; key: ServerKey; requestId: number | string; applied: boolean; failureReason?: string }
  | { kind: "lspRestart"; keys: ServerKey[] }
```

`source` on a display row is the index into `code.items`, so a ranked row leads back to its full item. `anchor` is the word start in code mode. `RenamePrompt` follows the `never` discriminating pattern the two existing prompts use. `lspServer` with `view: undefined` means the client was stopped (config change or restart), which removes its diagnostics and attachments.

- **Invariants:**
  - The `never` checks in `createUpdate` (`update.ts:194`) and the runner force every new variant to be handled.
- **Verification Coverage:** `V46` (type check)

## `src/core/state/lsp.ts`

- **Change:** Add
- **Decisions:** DES5, DES6, DES7, DES8, DES9, DES11, DES15, DES18
- **Requirements:** `W261005GWLY-REQ2@R1`, `W261005GWLY-REQ3@R1`, `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ6@R1`, `W261005GWLY-REQ13@R1`, `W261005GWLY-REQ14@R1`
- **Responsibilities:** LSP reducers and post-steps.
- **Affected Callers/Consumers:** `createUpdate`, `lspCommands`, `code-completion.ts`, `lsp-edits.ts`, `status.ts`, cmdline view
- **Construction/Wiring:** imported by `update.ts`.
- **Dependencies:** `buffers.ts` (`activeBuffer`, `activeWindow`), `jumps.ts` (`recordJump`, `goTo`), `picker.ts` (`openPicker`), `result.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| all listed | None — new symbol | below | as above |

**Existing Shape:** None — new file or symbol

**Proposed Shape:**

```ts
/** The first attached, ready server with `feature`, in table order. */
export function pickServer(s: AppState, path: string, feature: LspFeature): ServerKey | undefined;

/** Record a pending request and emit it; `undefined` reason → a message explaining why nothing was sent. */
export function request(s: AppState, feature: LspFeature, op: LspOp, o: { auto?: boolean; replace?: boolean } = {}): Result;
//  no buffer/attached → message "no language server for <ft>"; no capable server → "<feature>: not supported by <names>"
//  replace (hover, completion, signature) → lspCancel previous pending of the same feature
//  effects: [lspCancel?, startTimer lsp:<id> 5000 (unless auto), lsp{id, key, path, op}]

export function onLspResult(s: AppState, a: { id: number; result: LspResult }): Result;
//  p = pending[id]; delete it; cancelTimer lsp:<id>
//  p missing → none ; buffer(p.path).text.version !== p.version → none (stale)
//  error → auto ? none : message("<feature>: <message>", "error")
//  hover → float{kind:"hover", lines} ; locations → onLocations ; symbols → lspSymbols picker
//  completion / completionItem → codeCompletionResult ; signature → float{kind:"signature"}
//  prepareRename → open RenamePrompt ; edit → startCodeEdit ; actions → lspActions picker ; action → runAction

export function onLspTimeout(s: AppState, id: number): Result;
export function onLspServer(s: AppState, a: Extract<Action, { type: "lspServer" }>): Result;     // failed → toast once; undefined → remove key
export function onLspAttached(s: AppState, a: Extract<Action, { type: "lspAttached" }>): Result;
export function onLspDiagnostics(s: AppState, a: Extract<Action, { type: "lspDiagnostics" }>): Result;
export function onLspMessage(s: AppState, a: Extract<Action, { type: "lspMessage" }>): Result;  // toast
export function onLspApplyEdit(s: AppState, a: Extract<Action, { type: "lspApplyEdit" }>): Result; // startCodeEdit with reply

/** Post-step: shown = merged published diagnostics, except the path the active window is in insert mode on. */
export function syncDiagnostics(prev: AppState, r: Result): Result;
/** Post-step: drop the float when its window, buffer version, cursor (hover, diagnostics), or mode (signature: leaving insert) changed. */
export function syncFloat(prev: AppState, r: Result): Result;
/** The shown diagnostic under the cursor of the active window, highest severity first. */
export function cursorDiagnostic(s: AppState): { severity: DiagnosticSeverity; text: string } | undefined;

/** One location → recordJump + goTo; several → lsp.list + lspLocations picker; none → message; outside > 0 noted. */
function onLocations(s: AppState, r: Extract<LspResult, { kind: "locations" }>, title: string, now: number): Result;
```

`request` is the single entry for every feature. It finds the server, allocates `nextId`, records a `PendingRequest` with the buffer's current version and window, and emits the effects. The timeout timer reuses the existing `startTimer` effect, so time stays outside the reducer. `onLspResult` is where staleness is enforced: a result for a different buffer version is dropped before it can touch state. `syncDiagnostics` and `syncFloat` run as post-steps in `createUpdate` (next to `syncEmbeds`), so they react to any action that changes mode, cursor, or buffer, without changes to vim or mouse code. `onLocations` uses the existing jump machinery, so `<C-o>` returns after `gd`. Its `now` comes from the triggering timer or zero, as `onNoteCreated` does (`update.ts:189-190`).

- **Invariants:**
  - `onLspResult` never applies a result whose `PendingRequest` is gone or stale.
  - Toasts for a failed server are emitted once per transition into `failed`.
- **Verification Coverage:** `S4`–`S8`, `S12`, `S26`–`S31` — `V5`–`V10`, `V15`, `V16`, `V35`–`V41`

## `src/core/state/update.ts`

- **Change:** Modify
- **Decisions:** DES5, DES7, DES8
- **Requirements:** `W261005GWLY-REQ6@R1`, `W261005GWLY-REQ14@R1`
- **Responsibilities:** Route new actions; add post-steps.
- **Affected Callers/Consumers:** every dispatch
- **Construction/Wiring:** None.
- **Dependencies:** `lsp.ts`, `lsp-edits.ts`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `createUpdate` `step` | `:129-196` switch over current actions | adds six `lsp*` cases | store |
| `createUpdate` wrapper | `:197-215` `syncEmbeds(state, followShownNote(state, syncEditorKinds(step(...))))` | wraps with `syncFloat(state, syncDiagnostics(state, …))` | store |

**Existing Shape:** `src/core/state/update.ts:197-203`

```ts
  return (state, action) => {
    try {
      const r = syncEmbeds(
        state,
        followShownNote(state, syncEditorKinds(step(state, action), reg)),
        reg,
      );
```

Every action's result passes through post-steps that keep derived state consistent: editor kinds, the shown note, and embed loads.

**Proposed Shape:**

```ts
      const r = syncFloat(state, syncDiagnostics(state, syncEmbeds(
        state,
        followShownNote(state, syncEditorKinds(step(state, action), reg)),
        reg,
      )));
```

The two LSP post-steps run last, so they see the final mode, cursor, and buffers of the action. Both return `r` unchanged (same object) when nothing relevant changed, which keeps the post-step cost to a few identity checks per dispatch.

- **Invariants:**
  - Post-steps never emit effects.
- **Verification Coverage:** `S12`, `S27` — `V15`, `V37`

## `src/core/state/code-completion.ts`, `src/core/state/completion.ts`, `src/core/state/keys.ts`

- **Change:** Add (`code-completion.ts`), Modify (`completion.ts`, `keys.ts`)
- **Decisions:** DES10, DES11
- **Requirements:** `W261005GWLY-REQ8@R1`, `W261005GWLY-REQ9@R1`, `W261005GWLY-REQ13@R1`
- **Responsibilities:** Trigger, rank, accept code completion; auto signature help.
- **Affected Callers/Consumers:** `handleKeyAction` (`keys.ts:49-62`), `insertItem` (`completion.ts:199-215`), `onTimer`
- **Construction/Wiring:** None.
- **Dependencies:** `request`, `rankBy` (`src/core/kernel/text/fuzzy.ts`), `applyBufferEdits` (`buffers.ts:182`)

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `maybeOpenCompletion` | `completion.ts:182-197`, `(s) => AppState`, links only | renamed `maybeCompletion(r: Result, reg) => Result`; links unchanged; code buffers delegate to `codeCompletionStep` | `handleKeyAction`, `insertItem` |
| `completionKey` | `completion.ts:230+`, Enter/Tab insert link text | code mode: Enter/Tab → `acceptCode` (resolve if needed, then `applyCompletion`); `Esc` closes the popup and also leaves insert, as today | `handleKeyAction` |
| `handleKeyAction` | `keys.ts:49-62` calls `maybeOpenCompletion(r.state)` | closes an open float on `<Esc>` before routing; calls `maybeCompletion(r, reg)` and `maybeSignature(r)` | `createUpdate` |
| `codeCompletionStep` | None — new symbol | decides request now / timer / local re-rank / close | `maybeCompletion` |
| `applyCompletion` | None — new symbol | one `applyBufferEdits` with main + additional edits; cursor after main edit | `completionKey`, `onLspResult` |

**Existing Shape:** `src/core/state/keys.ts:49-62`

```ts
export function handleKeyAction(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  if (s.overlay.kind === "completion") {
    const r = completionKey(s, a, reg);
    if (r !== undefined) return r;
  }
  const r = routeKey(s, a, reg);
  return r.state.overlay.kind === "completion" || r.state.vim.mode === "insert"
    ? { ...r, state: maybeOpenCompletion(r.state) }
    : r;
}
```

Popup keys go first. Every other key routes normally, and afterwards, in insert mode, the link popup may open or update.

**Proposed Shape:**

```ts
  // An open info float closes on <Esc>; the key still routes, so Esc also leaves insert mode.
  const from = a.key === "<Esc>" && s.lsp.float !== undefined ? withoutFloat(s) : s;
  const r = routeKey(from, a, reg);
  return r.state.overlay.kind === "completion" || r.state.vim.mode === "insert"
    ? maybeSignature(from, maybeCompletion(r, reg), a.key)
    : r;

// code-completion.ts
/** In a code buffer in insert mode: the word before the cursor, the typed key, and the open popup decide the next step. */
export function codeCompletionStep(r: Result, key: Key): Result;
//  key ∈ completionTriggers → request("completion", {pos, trigger:key}, {auto:true, replace:true})
//  identifier char → open popup with same wordStart & !incomplete ? re-rank locally : startTimer "completion" 150
//  non-identifier, cursor left word → close popup, cancelTimer "completion"
export function onCompletionTimer(s: AppState): Result;   // request at the current word start
export function applyCompletion(s: AppState, item: CodeCompletionItem, now: number, reg: Registries): Result;
```

`maybeCompletion` now returns a `Result` because code completion emits effects (timer, request). For Markdown it still returns the link popup result with no effects, so link behaviour is unchanged. `maybeSignature` opens signature help on a signature trigger character in a code buffer, and `syncFloat` closes it on leaving insert mode. `applyCompletion` replaces the range from the word start to the cursor (or the item's `textEdit` range) and applies `additionalTextEdits` in the same `applyBufferEdits` call, so one `u` undoes all of it.

- **Invariants:**
  - Link completion state and keys are unchanged for `mode !== "code"`.
  - A completion result is shown only when the buffer version and the word start still match.
- **Verification Coverage:** `S14`–`S16`, `S28` — `V18`–`V21`, `V38`, `V49`

## `src/core/state/lsp-edits.ts`, `src/core/features/links/rename.ts`, `src/core/state/link-edits.ts`

- **Change:** Add (`lsp-edits.ts`), Modify (`rename.ts`, `link-edits.ts`)
- **Decisions:** DES12
- **Requirements:** `W261005GWLY-REQ10@R1`, `W261005GWLY-REQ11@R1`
- **Responsibilities:** Apply a `CodeEdit` across open and closed files and report once.
- **Affected Callers/Consumers:** `onLspResult` (edit), `onLspApplyEdit`, format result; runner `applyEdits` (`effects.ts:256-291`)
- **Construction/Wiring:** None.
- **Dependencies:** `applyBufferEdits` (`buffers.ts:182`), `bufferForPath`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `SpanEdit` | `rename.ts:8` `{ range; expected: string; text }` | `{ range; expected?: string; text }` | `applySpanEdits`, link rename (always sets it) |
| `applySpanEdits` | `rename.ts:132-158`, rejects when `slice !== expected` | checks `expected` only when present | runner `applyEdits` |
| `onEditsApplied` | `link-edits.ts:265-285`, link rewrite batches only | first checks `s.lsp.edit?.batch === a.batch` → `onCodeEditApplied` | `createUpdate` |
| batch allocation | `link-edits.ts:161` `Math.max(now, (s.index.rewrite?.batch ?? 0) + 1)` | `nextEditBatch(s, now)` shared with LSP edits | link rewrite, `startCodeEdit` |
| `startCodeEdit` | None — new symbol | below | `onLspResult`, `onLspApplyEdit` |

**Existing Shape:** `src/core/features/links/rename.ts:150-157`

```ts
  for (const { from, to, e } of spans) {
    if (from < 0 || to < from || to > limit) return null;
    if (text.slice(from, to) !== e.expected) return null;
    out = out.slice(0, from) + e.text + out.slice(to);
    limit = from;
  }
```

Spans are applied from the end. Any out-of-range or overlapping span, or a span whose current text differs from `expected`, refuses the whole file.

**Proposed Shape:**

```ts
    if (e.expected !== undefined && text.slice(from, to) !== e.expected) return null;

// lsp-edits.ts
/** Apply `edit`; `reply` answers a server's applyEdit request once the batch is done. */
export function startCodeEdit(s: AppState, edit: CodeEdit, o: { title: string; reply?: { key: ServerKey; requestId: number | string }; then?: (s: AppState) => Result }): Result;
//  outside > 0 or a versioned file whose open buffer version ≠ version → refuse all (message + reply false)
//  open buffers → applyBufferEdits (one undo step each); closed files → applyEdits{batch} effects
//  no closed files → finish now; else s.lsp.edit = {batch, pending, …}
export function onCodeEditApplied(s: AppState, a: Extract<Action, { type: "editsApplied" }>): Result;
//  move path from pending to updated/skipped; pending empty → toast "N files changed" (+ skipped), lspReply, then?
```

Making `expected` optional lets closed-file LSP edits reuse the runner's read → apply → atomic write path, including its rename/move following. Link rename always sets `expected`, so its stale-text protection is unchanged. Batch ids come from one helper, `nextEditBatch(s, now)` = `max(now, rewrite.batch + 1, lsp.edit.batch + 1)`, which both the link rewrite (`link-edits.ts:161`) and `startCodeEdit` use, so one `editsApplied` is never claimed by both. `then` lets format-on-save continue to `writeBuffer` after the edit.

- **Invariants:**
  - `lspReply` is emitted exactly once per reply-carrying edit, including when refused.
  - Open buffers never receive edits through the file queue.
- **Verification Coverage:** `S17`–`S19` — `V22`–`V24`

## `src/core/state/lsp-commands.ts`, `src/core/state/commands.ts`

- **Change:** Add (`lsp-commands.ts`), Modify (`commands.ts`)
- **Decisions:** DES13, DES14
- **Requirements:** `W261005GWLY-REQ5@R1`, `W261005GWLY-REQ7@R1`, `W261005GWLY-REQ11@R1`, `W261005GWLY-REQ13@R1`
- **Responsibilities:** Commands, generated bindings, and format on save.
- **Affected Callers/Consumers:** `main.ts` `registries()` (`main.ts:150-166`); `writeActive` (`commands.ts:241-248`)
- **Construction/Wiring:** registered in `main.ts`.
- **Dependencies:** `request`, `LSP_FILE_TYPES`, `openPicker`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `writeActive` | `commands.ts:241-248` → `writeBuffer` | when `config.lsp.formatOnSave` and a `format` server is attached: `formatCommand(…, {then: writeBuffer})` with `lspFormat:<id>` timer; else unchanged | `file.save` |
| `lspCommands` | None — new symbol | below | `main.ts` |
| `lspBindings` | None — new symbol | generated for every id in `LSP_FILE_TYPES` | `main.ts` |

**Existing Shape:** `src/core/state/commands.ts:241-248`

```ts
function writeActive(ctx: CommandContext): Result {
  const b = activeBuffer(ctx.state);
  if (b === undefined) return message(ctx.state, "E32: No file name", "error");
  if (b.readOnly === true) return message(ctx.state, READ_ONLY_FILE, "error");
  return writeBuffer(ctx.state, b.id, ctx.now, {
    recreate: b.disk === "deleted",
  });
}
```

`:w` writes the active buffer; autosave uses `writeBuffer` directly from timers (`save.ts:111-131`), so changing `writeActive` affects only explicit saves.

**Proposed Shape:**

```ts
export const lspCommands: readonly AppCommand[] = [
  { id: "lsp.hover", title: "Hover", filetypes: LSP_FILE_TYPES, run: (c) => atCursor(c, "hover") },
  { id: "lsp.definition", …"definition" }, { id: "lsp.implementation", … }, { id: "lsp.references", … },
  { id: "lsp.symbols", title: "Document symbols", … }, { id: "lsp.rename", title: "Rename symbol", … },
  { id: "lsp.codeAction", title: "Code action", … }, { id: "lsp.signature", title: "Signature help", … },
  { id: "lsp.complete", title: "Complete", … }, { id: "lsp.format", title: "Format", run: formatCommand },
  { id: "diag.next", … }, { id: "diag.prev", … }, { id: "diag.float", … },
  { id: "diag.list", title: "Diagnostics", run: (c) => openPicker(c, "diagnostics") },  // every file type
  { id: "lsp.info", title: "Language servers", run: (c) => openPicker(c, "lspInfo") },
  { id: "lsp.restart", title: "Restart language servers", filetypes: LSP_FILE_TYPES, run: restartAttached },
];
// EX_ALIASES additions: Format, Diagnostics, LspInfo, LspRestart

const KEYS: readonly [Mode, string, string][] = [
  ["normal", "K", "lsp.hover"], ["normal", "gd", "lsp.definition"], ["normal", "grr", "lsp.references"],
  ["normal", "gri", "lsp.implementation"], ["normal", "gO", "lsp.symbols"], ["normal", "grn", "lsp.rename"],
  ["normal", "gra", "lsp.codeAction"], ["visual", "gra", "lsp.codeAction"], ["normal", "]d", "diag.next"],
  ["normal", "[d", "diag.prev"], ["normal", "<C-w>d", "diag.float"], ["insert", "<C-s>", "lsp.signature"],
  ["insert", "<C-Space>", "lsp.complete"], ["normal", "<leader>xd", "diag.list"],
];
export const lspBindings: readonly Binding[] = LSP_FILE_TYPES.flatMap((filetype) =>
  KEYS.map(([mode, seq, id]) => ({ scope: { mode, filetype }, seq, id })));

export function formattingOptions(b: BufferState, tabWidth: number): { tabSize: number; insertSpaces: boolean };
```

Commands carry `filetypes: LSP_FILE_TYPES`, so the palette offers them only in code buffers. `diag.list` and `lsp.info` work everywhere. Bindings are generated per file type because `KeyScope` holds one file type (`src/core/kernel/commands/keymap.ts:7`). That keeps Markdown's `gd` and `<leader>x` untouched, and config overrides under `[filetypes.<id>.keys.<mode>]` replace them through the existing `effectiveBindings` merge (`src/core/state/keymap.ts:30-44`). `lsp.rename` sends `prepareRename` when the server supports it and opens `RenamePrompt` from its placeholder; otherwise it opens the prompt prefilled with the word under the cursor. `formatCommand` with a visual selection sends `range`. Its result goes through `startCodeEdit` with `then` set for the save path.

- **Invariants:**
  - No binding is generated for `markdown`.
  - Autosave never formats.
- **Verification Coverage:** `S9`, `S20`, `S21`, `S26` — `V12`, `V25`, `V26`, `V35`, `V39`

## `src/core/state/lsp-pickers.ts`, `src/core/state/picker.ts`

- **Change:** Add, Modify
- **Decisions:** DES7, DES9, DES12, DES15
- **Requirements:** `W261005GWLY-REQ3@R1`, `W261005GWLY-REQ7@R1`, `W261005GWLY-REQ10@R1`, `W261005GWLY-REQ13@R1`
- **Responsibilities:** Picker sources over LSP state.
- **Affected Callers/Consumers:** `openPicker` (`picker.ts:613-641`)
- **Construction/Wiring:** `pickerSources` spreads `lspPickerSources`.
- **Dependencies:** `PickerSource` (`picker.ts:57-80`), `goTo`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `pickerSources` | `picker.ts:315+` static record | `{ …existing, …lspPickerSources }` | `openPicker` |
| `lspPickerSources` | None — new symbol | `diagnostics`, `lspLocations`, `lspSymbols`, `lspActions`, `lspInfo` | `pickerSources` |

**Existing Shape:** `src/core/state/picker.ts:57-80` — `PickerSource` with `items(s, reg, query, arg)`, `accept(s, item, now, reg)`, `preview?(item)`.

**Proposed Shape:**

```ts
export const lspPickerSources: Readonly<Record<string, PickerSource>> = {
  diagnostics: { id: "diagnostics", title: "Diagnostics", items: (s, _r, q) => ranked(allDiagnostics(s), q),
    accept: acceptLocation, preview: previewLocation },
  lspLocations: { id: "lspLocations", title: "References", titleFor: (t) => t, items: (s, _r, q) => ranked(s.lsp.list?.items …),
    accept: acceptLocation, preview: previewLocation },
  lspSymbols: { …, items from s.lsp.symbols (indented by depth), accept: goTo symbol range start },
  lspActions: { …, items from s.lsp.actions, action: "apply", accept: runAction },
  lspInfo: { …, items from resolveServers + s.lsp.servers (+ host-reported missing), accept: none },
};
```

Each source reads a list the reducer stored in `LspState`, which fits the existing contract where `items` is a pure function of state. `allDiagnostics` sorts by severity, then path, then position. `previewLocation` reuses the file preview for `path`/`line`. `lspInfo` lists `name · root · state · binary`, where `binary` is `not on PATH` for servers whose view state is `missing`.

- **Invariants:**
  - Picker items are rebuilt from state only.
- **Verification Coverage:** `S6`, `S13`, `S27` — `V8`, `V17`, `V36`

## `src/core/state/status.ts`, `src/ui/views/statusline.ts`, `src/ui/views/cmdline.ts`

- **Change:** Modify
- **Decisions:** DES7, DES15
- **Requirements:** `W261005GWLY-REQ3@R1`, `W261005GWLY-REQ6@R1`
- **Responsibilities:** Server segment and cursor diagnostic message.
- **Affected Callers/Consumers:** `Statusline.renderSelf`, cmdline painter
- **Construction/Wiring:** None.
- **Dependencies:** `cursorDiagnostic`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `StatusSegments` | `status.ts:12-32` | adds `lsp?: { text: string; state: "starting" \| "ready" \| "failed" }[]` | statusline |
| `statusSegments` | `status.ts:81+` | fills `lsp` from `s.lsp.attached[b.path]` | statusline |
| `lspSegment` | None — new symbol | `◌ name progress` / `◆ name` / `✗ name` with `statusDim`/`statusError` | `Statusline.renderSelf` |
| cmdline message | `cmdline.ts:18` shows the latest message | falls back to `cursorDiagnostic(s)` in normal mode when no message is set | cmdline view |

**Existing Shape:** `src/ui/views/statusline.ts:30-40` — `indexSegment` returns `{ text, token }` for the index state with the same glyphs.

**Proposed Shape:**

```ts
function lspSegment(l: NonNullable<StatusSegments["lsp"]>[number]): Seg {
  if (l.state === "ready") return { text: `◆ ${l.text}`, token: "statusDim" };
  if (l.state === "failed") return { text: `✗ ${l.text}`, token: "statusError" };
  return { text: `◌ ${l.text}`, token: "statusDim" };
}
```

The segment uses the glyph language of `indexSegment`. It is dropped first on narrow terminals, alongside the preview segment, following the existing drop order. Visual polish is open to UI discussion.

- **Invariants:**
  - Segments show only servers attached to the active buffer.
- **Verification Coverage:** `S5`, `S12` — `V6`, `V16`

## `src/ui/editors/text-view.ts`, `src/ui/theme.ts`, `src/ui/overlays/lsp-float.ts`, `src/ui/overlays/host.ts`, `src/ui/overlays/completion.ts`, `src/ui/input.ts`

- **Change:** Modify; Add (`lsp-float.ts`)
- **Decisions:** DES7, DES8, DES10, DES14
- **Requirements:** `W261005GWLY-REQ6@R1`, `W261005GWLY-REQ8@R1`, `W261005GWLY-REQ13@R1`
- **Responsibilities:** Draw LSP state.
- **Affected Callers/Consumers:** `EditorView`, `OverlayHost`, key normalizer
- **Construction/Wiring:** `OverlayHost` constructs `LspFloatView`.
- **Dependencies:** `diagnosticMarks`, theme tokens

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| window providers | `text-view.ts:667-672` `[highlight, …spec, search, selection]` | `[highlight, …spec, diagnosticMarks(s.lsp.shown[b.path] ?? []), search, selection]` | `EditorView` |
| embed providers | `text-view.ts:218-224` | unchanged (embeds are Markdown-only) | — |
| `toKey` | `input.ts:41-48`, ctrl+space → `" "` | `e.ctrl && e.name === "space"` → `"<C-Space>"` (legacy NUL included) | normalizer |
| theme | tokens per name | adds `diagnosticError`, `diagnosticWarn`, `diagnosticInfo`, `diagnosticHint` (underline + colour), `float`, `floatActive` | painters |
| `LspFloatView` | None — new symbol | paints `s.lsp.float` next to its window cursor, clamped to the screen, max 12 rows and 80 columns, wrapped | `OverlayHost` |
| completion rows | link rows `label · detail` | code rows `kind label · detail` | completion overlay |

**Existing Shape:** `src/ui/editors/text-view.ts:667-672`

```ts
      const providers = [
        highlightMarks(ft?.highlighter),
        ...(spec?.decorations ?? []),
        searchMarks(s.vim.search),
        selectionMarks(selection),
      ];
```

The window view assembles language-neutral providers after the file type's own decorations.

**Proposed Shape:**

```ts
      const providers = [
        highlightMarks(ft?.highlighter),
        ...(spec?.decorations ?? []),
        diagnosticMarks(s.lsp.shown[b.path] ?? NO_DIAGNOSTICS),
        searchMarks(s.vim.search),
        selectionMarks(selection),
      ];
```

Diagnostics sit below search and selection marks, so a search match or selection stays visible over an underline. `NO_DIAGNOSTICS` is a shared empty array, so buffers without diagnostics allocate nothing. `LspFloatView` is non-modal: it never takes keys and sits above windows but below the modal overlays (picker, prompt, completion), so the completion popup and signature float can both show. It reports `{kind: "inert"}` to the mouse router so a click on it does nothing.

- **Invariants:**
  - The float never captures keys.
- **Verification Coverage:** `S10`, `S27`, `S28` — `V13`, `V37`, `V38`, `V47`

## `src/workspace/lsp/client.ts`, `capabilities.ts`, `convert.ts`

- **Change:** Add
- **Decisions:** DES1, DES3, DES10, DES12, DES16, DES18
- **Requirements:** `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ9@R1`, `W261005GWLY-REQ10@R1`, `W261005GWLY-REQ12@R1`
- **Responsibilities:** One server process and the protocol.
- **Affected Callers/Consumers:** `createLspHost`
- **Construction/Wiring:** constructed by the host.
- **Dependencies:** `vscode-jsonrpc/node` (`createMessageConnection`, `StreamMessageReader`, `StreamMessageWriter`), `vscode-languageserver-protocol` (types only), `node:child_process` `spawn`, `Bun.Glob`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| all listed | None — new symbol | below | host |

**Existing Shape:** None — new file or symbol

**Proposed Shape:**

```ts
export type ClientEvents = {
  diagnostics(path: string, items: Diagnostic[]): void;
  progress(text: string | undefined): void;
  message(level: "error" | "warning" | "info" | "log", text: string): void;
  applyEdit(requestId: number | string, edit: CodeEdit): void;
  exited(reason: string): void;            // unexpected exit or transport error
};

export type LspClient = {
  readonly view: ServerView;               // after ready
  didOpen(path: string, languageId: string, version: number, text: string): void;
  didChange(path: string, version: number, change: LineChange): void;
  didSave(path: string): void;
  didClose(path: string): void;
  request(id: number, op: LspOp): Promise<LspResult>;
  cancel(id: number): void;
  reply(requestId: number | string, applied: boolean, failureReason?: string): void;
  watched(events: FileEvent[]): void;      // filtered by registered globs
  configure(settings: Record<string, unknown>): void;
  stop(boundMs: number): Promise<void>;
};

export function createLspClient(o: {
  spec: ServerSpec; root: string; workspaceRoot: string; events: ClientEvents; logger: Logger;
  spawn?: typeof spawn;
}): Promise<LspClient>;    // resolves after initialize + initialized; rejects on spawn or initialize failure

export function clientCapabilities(): ClientCapabilities;   // capabilities.ts
// general.positionEncodings ["utf-16"]; textDocument.synchronization {didSave:true, dynamicRegistration:false};
// completion {completionItem:{snippetSupport:false, resolveSupport:{properties:["additionalTextEdits","detail","documentation"]}}, contextSupport:true};
// hover {contentFormat:["plaintext","markdown"]}; signatureHelp; definition; implementation; references; documentSymbol {hierarchicalDocumentSymbolSupport:true};
// rename {prepareSupport:true}; codeAction {resolveSupport:{properties:["edit"]}, codeActionLiteralSupport}; formatting; rangeFormatting;
// publishDiagnostics; workspace {applyEdit:true, workspaceEdit:{documentChanges:true, resourceOperations:[]}, configuration:true,
//   didChangeConfiguration, didChangeWatchedFiles:{dynamicRegistration:true}, workspaceFolders:true}; window {workDoneProgress:true, showMessage}
```

`createLspClient` spawns `spec.command` as an argv array with `stdio: ["pipe", "pipe", "pipe"]` and no shell. Stderr is drained into the debug log, capped at 200 lines per client so a chatty server can't fill the log. The spike showed this transport works under Bun 1.4.2 from source and compiled. Requests map one to one: `hover` → `textDocument/hover`, …, `format` → `textDocument/formatting` or `rangeFormatting`. Each request passes a `CancellationToken` that `cancel(id)` triggers, and `vscode-jsonrpc` sends `$/cancelRequest`. Server requests are answered inside the client: `workspace/configuration` from `spec.settings` by section path, `client/registerCapability` (watchers and dynamic features update `view`), `window/workDoneProgress/create`, and `workspace/workspaceFolders`. `workspace/applyEdit` is forwarded through `events.applyEdit` and answered later through `reply`. `convert.ts` does every LSP ↔ core mapping in one place: URIs to workspace paths (DES18), `MarkupContent` and `MarkedString` to plain lines (Markdown fences dropped, text kept), `DocumentSymbol` trees flattened with depth, and `WorkspaceEdit.changes` or `documentChanges` to `CodeEdit`.

- **Invariants:**
  - The client never logs document text, hover text, or diagnostics messages; only methods, ids, timings, and reasons.
  - `stop(boundMs)` sends `shutdown` then `exit`, and kills the process if it has not exited by `boundMs`.
- **Verification Coverage:** `S16`, `S19`, `S22`–`S25` — `V27`–`V30`, `V33`, `V34`, `V45`

## `src/workspace/lsp/sync.ts`, `roots.ts`, `language-id.ts`

- **Change:** Add
- **Decisions:** DES3, DES4
- **Requirements:** `W261005GWLY-REQ12@R1`
- **Responsibilities:** Pure helpers for incremental changes, roots, and language ids.
- **Affected Callers/Consumers:** host, client
- **Construction/Wiring:** None.
- **Dependencies:** `TextBuffer`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `lineChange` | None — new symbol | `(prev: TextBuffer, next: TextBuffer) => LineChange \| undefined` | host |
| `findRoot` | None — new symbol | `(dir, markers, workspaceRoot, exists) => string` | host |
| `languageIdFor` | None — new symbol | `(fileType, path) => string` | host |

**Existing Shape:** None — new file or symbol

**Proposed Shape:**

```ts
export type LineChange = { range: Range; text: string };
/** The single change from `prev` to `next`: lines equal at both ends are skipped; undefined when equal. */
export function lineChange(prev: TextBuffer, next: TextBuffer): LineChange | undefined;

/** Nearest folder from `dir` up to `workspaceRoot` containing a marker; else `workspaceRoot`. Paths are absolute. */
export function findRoot(dir: string, markers: readonly string[], workspaceRoot: string, exists: (p: string) => boolean): string;

const BY_EXTENSION: Record<string, string> = { ".tsx": "typescriptreact", ".jsx": "javascriptreact" };
const BY_TYPE: Record<string, string> = { objectivec: "objective-c" };
export function languageIdFor(fileType: string, path: string): string;   // BY_EXTENSION, then BY_TYPE, else the file type id
```

`lineChange` compares `line(i)` from the start and from the end until they differ, then returns a range over the old middle lines with the new middle text. Immutable buffers share line strings, so most comparisons are cheap. The worst case is O(lines) for one change, which is acceptable at 150 ms intervals. `findRoot` takes `exists` so it can be tested without a filesystem. `languageIdFor` covers the cases where `so`'s lowlight ids differ from LSP language ids. The other built-in ids (`typescript`, `javascript`, `python`, `go`, `rust`, `c`, `cpp`, `json`) already match LSP language ids. `objectivec` maps to `objective-c` through `BY_TYPE`, and `.h` stays `c`, as its file type says.

- **Invariants:**
  - Applying `lineChange(prev, next)` to `prev` yields `next` exactly.
  - `findRoot` never returns a folder outside `workspaceRoot`.
- **Verification Coverage:** `S22`, `S23` — `V27`, `V28`

## `src/app/lsp-host.ts`

- **Change:** Add
- **Decisions:** DES3, DES4, DES15, DES16
- **Requirements:** `W261005GWLY-REQ1@R1`, `W261005GWLY-REQ2@R1`, `W261005GWLY-REQ3@R1`, `W261005GWLY-REQ12@R1`, `W261005GWLY-REQ14@R1`
- **Responsibilities:** Supervise clients and bridge store and clients.
- **Affected Callers/Consumers:** `main.ts`, `createEffectRunner`, `installLifecycle`
- **Construction/Wiring:** constructed in `main.ts`.
- **Dependencies:** `createLspClient`, `resolveServers`, `findRoot`, `lineChange`, `languageIdFor`, `Logger`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `LspHost`, `createLspHost` | None — new symbol | below | `main.ts`, runner, lifecycle |

**Existing Shape:** `src/app/index-host.ts:33-103` — the pattern followed: `launch`, `crashed` with a counter, a restart on the first crash, `final` on the second, and unanswered requests answered empty.

**Proposed Shape:**

```ts
export const SYNC_DEBOUNCE_MS = 150;
export const LSP_STOP_BOUND_MS = 500;

export type LspHost = {
  observe(s: AppState): void;
  run(e: Extract<Effect, { kind: "lsp" | "lspCancel" | "lspReply" | "lspRestart" }>): void;
  notify(e: FileEvent): void;
  stop(): Promise<void>;
};

export function createLspHost(d: {
  root: string; dispatch: (a: Action) => void; logger: Logger;
  which?: (cmd: string) => string | null; exists?: (p: string) => boolean;
  connect?: typeof createLspClient;
}): LspHost;
// state: clients Map<ServerKey, {spec, client?, starting?: Promise, crashes, docs: Map<path, Doc>, missing}>
// observe: (config.lsp, buffers) identity unchanged → return; else reconcile(config) then sync(buffers)
// run lsp: client ready? flush(path) → client.request(id, op).then(r → dispatch lspResult) ; not ready → lspResult{error:"starting"}
// crash: crashes++ → 1: relaunch + reopen docs + answer in-flight with error ; 2: dispatch lspServer{failed}
// stop: Promise.allSettled(clients.map(c => c.stop(LSP_STOP_BOUND_MS)))
```

`observe` is the only path from state to processes. It is cheap when nothing relevant changed: identity checks on `s.config.lsp` and `s.buffers`, then a per-buffer `text` identity check. `reconcile` computes the wanted (spec, root) set for open code buffers and starts the missing clients. It stops a client only when its spec changed or was removed, LSP was turned off, or `:LspRestart` asked. A client whose files are all closed keeps running until then, matching Neovim's default. `sync` keeps per-document `Doc{sent, pending, timer}`. `flush(path)` is called before every request on that path, so a request always sees the text the user sees. Progress events are coalesced per key and dispatched at most every 100 ms.

- **Invariants:**
  - A client receives `didOpen` before any `didChange` or request for a path.
  - After `stop()` resolves, no child process started by the host is alive.
- **Verification Coverage:** `S2`–`S5`, `S22`–`S25`, `S30` — `V2`, `V5`, `V7`, `V27`–`V31`, `V34`, `V41`

## `src/app/effects.ts`, `src/app/lifecycle.ts`, `src/app/main.ts`

- **Change:** Modify
- **Decisions:** DES3, DES5, DES14, DES16
- **Requirements:** `W261005GWLY-REQ1@R1`, `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ12@R1`
- **Responsibilities:** Wiring.
- **Affected Callers/Consumers:** startup and shutdown
- **Construction/Wiring:** as below.
- **Dependencies:** `createLspHost`

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `RunnerDeps` | `effects.ts:38-62` | adds `lsp?: Pick<LspHost, "run">` | runner, test helpers |
| `createEffectRunner` `run` | `effects.ts:104+` switch | `case "lsp" \| "lspCancel" \| "lspReply" \| "lspRestart": d.lsp?.run(e)`; without a host, `lsp` answers `lspResult{error:"language servers off"}` | store |
| `installLifecycle` | `lifecycle.ts:22-31` deps | adds `stopLsp?: () => Promise<void>`, awaited after the preview stop, raced with `LSP_STOP_BOUND_MS + 100` | `main.ts` |
| `registries` | `main.ts:150-166` | adds `lspCommands`, `lspBindings`, `lspGroups` | `createUpdate` |
| `main` | `main.ts:294-366` | constructs host; `deps.lsp`; `store.subscribe(lspHost.observe)`; watcher calls `lspHost.notify`; `stopLsp` | — |

**Existing Shape:** `src/app/main.ts:363-366`

```ts
    watchWorkspace(ws.root, ownOps, matcher, (event) => {
      store.dispatch({ type: "fileChanged", event });
      indexHost.notify(event);
    });
```

Watcher events go to the store and the index host.

**Proposed Shape:**

```ts
    watchWorkspace(ws.root, ownOps, matcher, (event) => {
      store.dispatch({ type: "fileChanged", event });
      indexHost.notify(event);
      lspHost.notify(event);
    });
```

The LSP host joins as a third consumer of watcher events. `store.subscribe(lspHost.observe)` is registered right after `createStore`, so the first startup `configLoaded` already reaches it. Servers start only after the first file opens, which happens after the first frame, so `firstFrame` is unaffected. The runner's own writes are silent to the watcher (`ownOps`), and the runner already reports them to the index (`effects.ts:247`). For servers that rely on `didChangeWatchedFiles`, the host also observes `saved` through state (`savedVersion` changes) and sends `didSave`.

- **Invariants:**
  - `stopLsp` cannot block shutdown beyond its bound.
- **Verification Coverage:** `S25` — `V34`

## `test/boundaries.test.ts`, `package.json`, `scripts/bench-gate.ts`

- **Change:** Modify
- **Decisions:** DES1, DES6, DES17
- **Requirements:** `W261005GWLY-REQ14@R1`, `W261005GWLY-REQ15@R1`
- **Responsibilities:** Policy and benchmark wiring.
- **Affected Callers/Consumers:** `bun run check`, `bun run bench`
- **Construction/Wiring:** None.
- **Dependencies:** None.

**Symbol Changes:**

| Symbol | Current Shape or Behavior | Final Shape or Behavior | Callers/Consumers Affected |
|---|---|---|---|
| `PACKAGE_HOMES` | `boundaries.test.ts:45-57` | adds `"vscode-jsonrpc": ["src/workspace/lsp/"]`, `"vscode-languageserver-protocol": ["src/workspace/lsp/"]` | boundary test |
| `dependencies` | `package.json:19-35` | adds `"vscode-jsonrpc": "9.0.3"`, `"vscode-languageserver-protocol": "3.18.4"` | install |
| `TARGETS` / `BENCHES` | `bench-gate.ts:8-27` | adds `lspKeystrokeP95: 16` → `test/bench/lsp-keystroke.bench.ts` | bench gate |

**Existing Shape:** `test/boundaries.test.ts:45-57` — a record of package name → allowed source prefixes, checked for value and type-only imports.

**Proposed Shape:**

```ts
  "vscode-jsonrpc": ["src/workspace/lsp/"],
  "vscode-languageserver-protocol": ["src/workspace/lsp/"],
```

Homing both packages in `src/workspace/lsp/` makes the "protocol-free core" decision enforceable. Any import of protocol types elsewhere in `src` fails `bun run check`.

- **Invariants:**
  - `test/fixtures/fake-lsp.ts` may import `vscode-jsonrpc`; the boundary test scans `src/**` only (`boundaries.test.ts:116-123`).
- **Verification Coverage:** `S32` — `V46`, `V48`

## Migration and Delivery

- **Database or Schema Migration:** None — no database. The config schema gains an optional section with defaults.
- **Data Backfill:** None — no stored data changes.
- **Mixed-Version Compatibility:** None — one process; `PersistedState` stays `version: 1`, and LSP state is never persisted.
- **Feature Flags:** `[lsp] enabled` (default `false`) is the user-facing switch, not a temporary flag. It stays permanently.
- **Rollout Constraints:** None — ships in one PR; no server starts unless the user opts in.
- **Rollback:** Turn `[lsp] enabled` off, or install the previous release binary. No data compatibility concerns.

# 8. Testing and Verification

## Design Success Criteria

| ID | Observable Success Condition | Traceability |
|---|---|---|
| `S1` | With `[lsp]` absent or `enabled = false`, no process is spawned for any file | REQ1, DES2, DES3 |
| `S2` | Turning `enabled` on or off through `:ConfigReload` starts servers for open buffers or stops all of them | REQ1, DES3 |
| `S3` | `resolveServers` returns built-ins in table order with overrides applied, disabled ones removed, additions appended | REQ2, DES2 |
| `S4` | With two servers attached, diagnostics from both are shown and a request goes to the first capable server | REQ2, DES6 |
| `S5` | The statusline shows `◌`/`◆`/`✗` per attached server, and progress dispatches are at most one per 100 ms per server | REQ3, DES15 |
| `S6` | `showMessage` error/warning → one toast; info/log → none; `:LspInfo` lists missing binaries as `not on PATH` | REQ3, DES15 |
| `S7` | Every `LspOp` maps to its LSP method and its result converts to the matching `LspResult` | REQ4, DES1, DES5, DES16 |
| `S8` | A feature no attached server supports reports `<feature>: not supported by <servers>` | REQ4, DES6 |
| `S9` | `fileTypes` naming `markdown`, `base`, `text`, or an unknown id is a line-numbered error; no LSP binding exists for `markdown` | REQ5, DES2, DES14 |
| `S10` | Diagnostics draw one highest-severity sign per line and an underline per range, clamped to the buffer | REQ6, DES7 |
| `S11` | `]d`/`[d` move to the next or previous diagnostic and wrap | REQ6, DES7, DES14 |
| `S12` | Diagnostics published during insert mode show only after leaving insert mode; the command line shows the cursor diagnostic | REQ6, DES7 |
| `S13` | `:Diagnostics` lists every published diagnostic sorted by severity, path, position, and `Enter` opens it | REQ7, DES7, DES9 |
| `S14` | Completion opens on trigger characters and after a 150 ms pause, and narrows locally without a new request when complete | REQ8, DES10 |
| `S15` | A completion result for an older version or word start opens nothing; link completion is unchanged | REQ8, DES6, DES10 |
| `S16` | Accepting an item applies its edit and `additionalTextEdits` as one undo step; `snippetSupport` is `false` | REQ9, DES10 |
| `S17` | A rename over an open and a closed file changes both: one undo step in the buffer, an atomic write for the file | REQ10, DES12 |
| `S18` | A versioned edit for an older buffer version applies nothing and reports why | REQ10, DES12 |
| `S19` | `workspace/applyEdit` is applied and answered exactly once; `resourceOperations` is `[]` | REQ10, DES12 |
| `S20` | `:Format` applies server edits as one undo step | REQ11, DES13 |
| `S21` | `formatOnSave` formats on `:w` only, never on autosave, and a silent server delays `:w` by at most 1000 ms | REQ11, DES13 |
| `S22` | One process per (server, root): files under one marker folder share it; separate marker folders get separate ones | REQ12, DES3 |
| `S23` | Incremental `didChange` notifications rebuild exactly the buffer text | REQ12, DES4 |
| `S24` | A crash restarts once and reopens documents; a second crash marks `failed` with one toast | REQ12, DES3 |
| `S25` | Shutdown stops every server within the bound, killing one that ignores `shutdown` | REQ12, DES3 |
| `S26` | Neovim 0.11 keys run their features in code buffers and are overridable per file type | REQ13, DES14 |
| `S27` | One definition jumps (and `<C-o>` returns); several open a picker; locations outside the workspace are counted, not opened | REQ13, DES9, DES18 |
| `S28` | Hover and signature floats show next to the cursor and close on cursor move or leaving insert; `<C-Space>` reaches the keymap | REQ13, DES8, DES11, DES14 |
| `S29` | A stale hover or definition result changes nothing | REQ14, DES6 |
| `S30` | Keys typed within 150 ms produce one `didChange`, sent before a following request | REQ14, DES4 |
| `S31` | `lspKeystrokeP95` ≤ 16 ms (gate: 2× target) with the fake server attached and publishing diagnostics | REQ14, DES6, DES17 |
| `S32` | `bun run check` and `bun run test:ci` pass without language servers installed, and leave no child processes | REQ15, DES17, DES1 |

## Test Suites and Cases

```text
src/
├── core/config/lsp.test.ts [Unit]
│   Purpose: schema and resolution rules
│   SUT: LspConfigSchema via parseConfig, resolveServers
│   Infra: None
│   Doubles: None
│   ├── V1 no [lsp] section → defaults.lsp.enabled === false and formatOnSave === false
│   │   ├── Expect: parsed config has lsp {enabled:false, formatOnSave:false, servers:{}} [S1]
│   │   └── Unique risk: opt-in default flips to on
│   ├── V3 override rust-analyzer settings, disable pyright, add eslint → resolveServers order and fields
│   │   ├── Expect: names [typescript, gopls, rust-analyzer, clangd, json, eslint]; rust-analyzer.command unchanged, settings replaced [S3]
│   │   └── Unique risk: override replaces whole spec or wrong routing order
│   ├── V4 added server without command → error on its line
│   │   ├── Expect: errors [{line: <[lsp.servers.x] line>, message contains "needs command and fileTypes"}] [S3]
│   │   └── Unique risk: incomplete user server accepted and crashes at spawn
│   └── V11 fileTypes = ["markdown"], ["base"], ["text"], ["rustt"] → enum error on the fileTypes line
│       ├── Expect: ok false; error line equals the fileTypes key line [S9]
│       └── Unique risk: servers attach to notes, or typos are silently ignored
├── core/kernel/view/diagnostics.test.ts [Unit]
│   Purpose: decoration output
│   SUT: diagnosticMarks
│   Infra: None
│   Doubles: None
│   ├── V13 error + warning on line 12, range cols 13–16 → one sign E and two marks
│   │   ├── Expect: line decoration {line:12, sign:{text:"E"}} once; marks with diagnosticError/diagnosticWarn ranges [S10]
│   │   └── Unique risk: last-sign-wins shows W over E
│   └── V14 range past line end and on a deleted line → clamped / skipped, no throw
│       ├── Expect: mark end col = line length; no decoration for missing lines [S10]
│       └── Unique risk: stale diagnostics crash the layout after an edit
├── core/state/lsp.test.ts [Unit]
│   Purpose: routing, staleness, timeouts, post-steps, location handling
│   SUT: createUpdate with lsp actions; request; syncDiagnostics; syncFloat
│   Infra: None
│   Doubles: None (pure state)
│   ├── V5 attached [a(ready, no hover), b(ready, hover)] → K emits lsp effect to b; diagnostics from a and b both shown
│   │   ├── Expect: effects contain {kind:"lsp", key:"b@…"}; shown[path].length = 2 [S4]
│   │   └── Unique risk: first-server routing ignores capabilities
│   ├── V9 each LspFeature has a command path emitting op.kind
│   │   ├── Expect: table of command id → op.kind matches [S7]
│   │   └── Unique risk: a feature wired to the wrong op
│   ├── V10 K with attached servers lacking hover → message "hover: not supported by a"
│   │   ├── Expect: notifications.message.text === "hover: not supported by a" [S8]
│   │   └── Unique risk: silent no-op
│   ├── V15 lspDiagnostics while insert mode on that path → shown unchanged; <Esc> → shown updated
│   │   ├── Expect: shown before Esc equals old list; after equals new [S12]
│   │   └── Unique risk: diagnostics flicker while typing
│   ├── V16 cursor on diagnostic in normal mode, no message → cursorDiagnostic text "E srv: msg"
│   │   ├── Expect: cursorDiagnostic(s) = {severity:1, text:"srv: msg"} [S12]
│   │   └── Unique risk: message missing or shown over a real message
│   ├── V35 gd with one location in other file → recordJump + goTo; <C-o> returns
│   │   ├── Expect: active buffer path = target, cursor = range.start; after <C-o> back at origin [S26, S27]
│   │   └── Unique risk: definition jump not in the jump list
│   ├── V36 locations result with 3 items and outside = 2 → lspLocations picker with 3 rows; message notes "2 outside the workspace"
│   │   ├── Expect: overlay picker source "lspLocations", items.length 3; message contains "2 outside" [S27]
│   │   └── Unique risk: out-of-workspace paths opened or silently dropped
│   ├── V37 hover float then cursor move → float removed; signature float then <Esc> → removed
│   │   ├── Expect: s.lsp.float undefined after each [S28]
│   │   └── Unique risk: floats stick and cover text
│   ├── V49 hover float in normal mode then <Esc> → float removed, cursor and mode unchanged
│   │   ├── Expect: s.lsp.float undefined; cursor and vim.mode equal before and after [S28]
│   │   └── Unique risk: Esc in normal mode changes nothing syncFloat sees, so the float would stay
│   ├── V39 lspBindings: no binding has filetype "markdown"; gd in markdown still resolves link.followOrTag
│   │   ├── Expect: lspBindings.every(b => b.scope.filetype !== "markdown"); keymap lookup → link.followOrTag [S9, S26]
│   │   └── Unique risk: LSP keys shadow note keys
│   ├── V40 hover result after an edit (version changed) → no float
│   │   ├── Expect: s.lsp.float undefined, pending cleared [S29]
│   │   └── Unique risk: stale result applied to changed text
│   └── V8 lspServer failed → one toast; repeated failed view → no second toast; lspInfo items show "not on PATH" for missing
│       ├── Expect: toasts.length 1; lspInfo row detail contains "not on PATH" [S6]
│       └── Unique risk: toast spam or missing servers hidden
├── core/state/code-completion.test.ts [Unit]
│   Purpose: trigger, local re-rank, accept
│   SUT: handleKeyAction in a code buffer; applyCompletion
│   Infra: None
│   Doubles: None
│   ├── V18 typing "." → completion request with trigger "."; typing "fo" → startTimer completion 150
│   │   ├── Expect: effects include lsp{op.kind:"completion", trigger:"."}; then startTimer {id:"completion", ms:150} [S14]
│   │   └── Unique risk: no auto-open, or a request per keystroke
│   ├── V19 complete result then typing "o" → items re-ranked, no new lsp effect; incomplete → new request
│   │   ├── Expect: no lsp effect when incomplete=false; one when true [S14]
│   │   └── Unique risk: network request per keystroke
│   ├── V20 completion result with stale version → overlay none; [[ in markdown → link popup as before
│   │   ├── Expect: overlay.kind "none"; markdown overlay completion mode "notes" [S15]
│   │   └── Unique risk: popup on wrong text; link completion regression
│   └── V21 accept item with additionalTextEdits import → both applied; one u restores original
│       ├── Expect: line 0 = import; cursor line contains label; after "u" text equals original [S16]
│       └── Unique risk: auto-import split into two undo steps or lost
├── core/state/lsp-edits.test.ts [Unit]
│   Purpose: edit planning and batch completion
│   SUT: startCodeEdit, onCodeEditApplied via createUpdate
│   Infra: None
│   Doubles: None
│   ├── V22 edit over open a.ts and closed b.ts → a.ts edited (one undo step), applyEdits effect for b.ts with no expected
│   │   ├── Expect: buffer text changed; effects [{kind:"applyEdits", edit:{path:"b.ts", edits:[{expected: undefined}]}}] [S17]
│   │   └── Unique risk: open buffer written through the queue or closed file skipped
│   ├── V23 versioned edit version 3, buffer version 5 → nothing applied, message, reply applied:false
│   │   ├── Expect: text unchanged; effect lspReply{applied:false} [S18]
│   │   └── Unique risk: edits applied to shifted text
│   └── V24 applyEdit with closed file → reply only after editsApplied; exactly one reply
│       ├── Expect: no lspReply before editsApplied; one after; toast "1 file changed" [S19]
│       └── Unique risk: early, missing, or duplicate reply
├── core/state/lsp-commands.test.ts [Unit]
│   Purpose: format and save interaction
│   SUT: file.save, lsp.format via createUpdate
│   Infra: None
│   Doubles: None
│   ├── V25 :Format result edits → applied; u restores
│   │   ├── Expect: text formatted; after u original [S20]
│   │   └── Unique risk: format not undoable
│   └── V26 formatOnSave: :w → format request + timer lspFormat 1000; autosave timer → write effect, no format; timer fires → write + warning
│       ├── Expect: first effects lack "write"; autosave effects include write and no lsp; on timeout write + toast [S21]
│       └── Unique risk: autosave formats mid-edit; slow server blocks save
├── workspace/lsp/sync.test.ts [Unit]
│   Purpose: incremental change correctness
│   SUT: lineChange
│   Infra: None
│   Doubles: None
│   └── V28 property: random edit sequences → applying each lineChange to prev text gives next text
│       ├── Expect: rebuilt === fullText(next) for 500 seeded sequences [S23]
│       └── Unique risk: server text drifts from buffer text
├── workspace/lsp/roots.test.ts [Unit]
│   Purpose: root search bounds
│   SUT: findRoot
│   Infra: None
│   Doubles: exists() stub
│   └── V27 a/Cargo.toml and a/b/Cargo.toml → files in a/b use a/b; marker above workspace ignored → workspace root
│       ├── Expect: findRoot results as listed [S22]
│       └── Unique risk: roots outside the workspace or wrong nesting
├── workspace/lsp/convert.test.ts [Unit]
│   Purpose: protocol mapping
│   SUT: toCodeEdit, toLocation, toHover, toCompletion, uriToPath
│   Infra: None
│   Doubles: None
│   ├── V33 documentChanges with versions → CodeEdit files with version; file outside root → outside 1; clientCapabilities snippetSupport false, resourceOperations []
│   │   ├── Expect: CodeEdit matches; capabilities flags as stated [S16, S19, S27]
│   │   └── Unique risk: version dropped; capabilities advertise unsupported features
│   └── V45 hover MarkupContent markdown with fenced code → plain lines without fences
│       ├── Expect: lines equal the inner text [S7]
│       └── Unique risk: raw markdown noise in the float
├── ui/input.test.ts [Unit] (modified)
│   └── V38 ctrl+space event → "<C-Space>"; plain space → " "
│       ├── Expect: toKey results [S28]
│       └── Unique risk: <C-Space> types a space
└── ui/editors/text-view.test.ts or test/ui [Unit] (modified)
    └── V47 window with shown diagnostics paints sign "E" in the gutter sign cell
        ├── Expect: rendered gutter cell at the line row equals "E" [S10]
        └── Unique risk: provider not wired into the window path

test/
├── integration/lsp-host.test.ts [Integration]
│   Purpose: host + client + fake server collaboration over real stdio
│   Real: createLspHost, createLspClient, createStore/createUpdate, createEffectRunner
│   Infra: filesystem (temp workspace), child processes (fake server)
│   Doubles: fake-lsp.ts server
│   ├── V2 enabled false → open file → no spawn; reload with enabled true → fake server log shows initialize + didOpen; reload false → server exits
│   │   ├── Expect: spawn count 0, then 1; after disable process gone [S1, S2]
│   │   └── Unique risk: config changes not reconciled
│   ├── V29 fake server exits after initialize (script crash) → restarted and receives didOpen again; second crash → lspServer failed, one toast
│   │   ├── Expect: log shows two initialize; state servers[key].state "failed"; toasts 1 [S24]
│   │   └── Unique risk: restart loop or no restart
│   ├── V30 two files under one marker → one process; second marker folder → second process
│   │   ├── Expect: distinct roots in fake logs = 2 for the nested layout, 1 for the flat one [S22]
│   │   └── Unique risk: one process per file or roots merged
│   ├── V31 eslint-like second fake server on the same file type → both get didOpen; diagnostics merged
│   │   ├── Expect: both logs contain didOpen; shown length = sum [S4]
│   │   └── Unique risk: only the first matching server attached
│   ├── V41 10 keys within 150 ms then K → one didChange before the hover request
│   │   ├── Expect: log order [didChange(version n+10), textDocument/hover]; didChange count 1 [S30]
│   │   └── Unique risk: request before sync, or a notification per key
│   ├── V7 fake server sends 50 progress reports in 200 ms → ≤ 3 lspServer dispatches; showMessage info → no toast
│   │   ├── Expect: dispatch count ≤ 3; toasts 0 [S5, S6]
│   │   └── Unique risk: repaint storm
│   ├── V32 watcher change of a file matching a registered glob → didChangeWatchedFiles; non-matching → none
│   │   ├── Expect: log contains one didChangeWatchedFiles with the path [S7]
│   │   └── Unique risk: git checkout leaves server stale
│   └── V34 fake server ignoring shutdown → host.stop() resolves ≤ 700 ms and the pid is gone
│       ├── Expect: elapsed ≤ 700; process.kill(pid, 0) throws [S25]
│       └── Unique risk: orphan server or slow exit
├── integration/lsp-edits.test.ts [Integration]
│   Purpose: rename through the real runner writes closed files atomically
│   Real: store, runner serial queue, fake server
│   Infra: filesystem
│   Doubles: fake-lsp.ts
│   └── V48 grn over open a.ts + closed b.ts → b.ts on disk changed, a.ts buffer changed, toast "2 files changed"
│       ├── Expect: disk b.ts content equals expected; buffer a.ts dirty with new name [S17]
│       └── Unique risk: queue path with optional expected broken
├── integration/lsp-real.test.ts [Integration, local only]
│   Purpose: protocol details against a real server
│   Real: everything, rust-analyzer
│   Infra: filesystem, rust-analyzer process
│   Doubles: None
│   └── V44 skipIf(!Bun.which("rust-analyzer")): open src/main.rs in a Cargo project → ready, hover on a std fn returns text
│       ├── Expect: servers[key].state "ready"; hover float lines non-empty [S7, S32]
│       └── Unique risk: fake server diverges from real servers
├── e2e/lsp.test.ts [PTY e2e]
│   Purpose: keys, rendering, and the compiled-process path end to end
│   Real: so process in a PTY, config.toml in a temp XDG dir pointing at fake-lsp.ts
│   Infra: PTY, filesystem, child process
│   Doubles: fake-lsp.ts
│   ├── V6 open foo.rs → statusline shows "◌ fake" then "◆ fake"
│   │   ├── Expect: screen text contains "◆ fake" within 5 s [S5]
│   │   └── Unique risk: segment never painted
│   ├── V12 published diagnostic → "E" in the gutter; ]d moves cursor to it; :Diagnostics lists it
│   │   ├── Expect: gutter cell "E"; statusline Ln matches; picker row text [S10, S11, S13]
│   │   └── Unique risk: key bindings or picker wiring broken in the real app
│   ├── V17 diagnostic for an unopened file appears in :Diagnostics and Enter opens it
│   │   ├── Expect: active path becomes that file [S13]
│   │   └── Unique risk: unopened-file diagnostics dropped
│   └── V43 after quitting, no fake-lsp process remains (pgrep by unique arg)
│       ├── Expect: no process found [S32]
│       └── Unique risk: e2e leaves orphans
├── bench/lsp-keystroke.bench.ts [Benchmark]
│   Purpose: typing cost with a server attached
│   Real: mounted shell, store, host, fake server publishing 200 diagnostics on each change
│   └── V42 200 keys in a 5,000-line .ts file → p95 ≤ 2 × 16 ms gate
│       ├── Expect: {"metric":"lspKeystrokeP95","ms":p95} within gate [S31]
│       └── Unique risk: LSP work on the keystroke path
└── Non-test verification
    ├── V46 Type/build check — bun run check (biome, tsc, knip, unit suites) passes; exhaustive never checks compile [S7, S32]
    │   └── Unique risk: unhandled Action/Effect variant, unused export
    ├── Boundary check — included in V46: PACKAGE_HOMES forbids protocol imports outside src/workspace/lsp
    ├── Obsolete-reference check — rg "maybeOpenCompletion" src test returns nothing [S15]
    │   └── Unique risk: old helper still called somewhere
    ├── Migration: None — no stored data changes
    ├── Configuration: covered by V1, V3, V4, V11
    └── Observability: V7 asserts log line "lsp.message" for info messages; V29 asserts "lsp.crashed" with reason and no note text
```

## Coverage Balance

Pure decisions (routing, staleness, freezing, edit planning, completion steps) are proven once at unit level on `createUpdate`. Process, transport, timing, and filesystem behaviour is proven once at integration level with the real host, client, runner, and the fake server over stdio. E2e covers only what needs the real terminal app: painted gutter and statusline, key bindings in a real PTY, and no orphan processes. The real-server test exists only to catch drift between the fake server and a real one. No case repeats a unit proof at a higher level. For example, stale results are unit-only (V40), while debounce ordering needs real timing (V41).

## Test Quality Rules

- **Unit:** Verify one public behavior or invariant per case; keep it deterministic and isolated; use doubles only at true boundaries; assert outputs or meaningful side effects. Do not test private methods, mock every collaborator, duplicate implementation logic, or assert internal call order unless order is contractual.
- **Integration/Contract:** Verify real collaboration, wiring, or boundary behavior; keep the components under examination real and list any actual database, queue, cache, filesystem, or external service under `Infra`. Replace only slow or external dependencies when necessary and list them under `Doubles`. Verify serialization, persistence, registration, transactions, and error translation only when applicable; assert observable results or durable side effects; keep setup and cleanup deterministic. Every suite that starts a process stops it in `afterEach`.
- **Non-test:** Covered by V46 and the obsolete-reference search. Migration has no meaningful check (no stored data changes).

# 9. Finalized Design Decisions

## W261005GWLY-DES1: Protocol-free core, client in the workspace layer

**Question:** Where does protocol code live, and which library speaks it?

**Decision:** `vscode-jsonrpc` `9.0.3` over `node:child_process` stdio, plus `vscode-languageserver-protocol` `3.18.4` types, both used only in `src/workspace/lsp/` and enforced by `PACKAGE_HOMES`. The core uses its own `Diagnostic`, `LspOp`, `LspResult`, and `Code*` types.

**Requirements Addressed:** `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ12@R1`, `W261005GWLY-REQ15@R1`

**Research Support:** None (the spike evidence in the discussion context)

**Rationale:** The reference implementation by the protocol's authors handles byte-length framing, ids, and cancellation, and the spike showed it working in both run modes. Homing it keeps protocol churn in one folder and the core pure.

**Code Impact:**

- `src/workspace/lsp/*` — new modules — protocol and conversion.
- `test/boundaries.test.ts` — `PACKAGE_HOMES` — two entries.
- `package.json` — two exact pins.

**Detailed Design:** section 7 `src/workspace/lsp/client.ts`, `capabilities.ts`, `convert.ts`; `test/boundaries.test.ts`

**Tradeoffs:**

- Rejected a hand-written transport: less dependency, but `so` would own framing and cancellation.
- Rejected `vscode-languageclient`: requires the VS Code extension host.

**Success Criteria:** `S7`, `S32`

**Verification Impact:**

- `V46` — the boundary test rejects protocol imports outside `src/workspace/lsp/`.
- `V44` — a real server works through this stack.

## W261005GWLY-DES2: `[lsp]` config and the built-in server table

**Question:** How are servers configured and validated?

**Decision:** `LspConfigSchema` (`enabled`, `formatOnSave`, `servers`) inside `ConfigSchema`. Six `BUILTIN_SERVERS`, field-wise overrides, and additions that require `command` and `fileTypes`. `fileTypes` is an enum of `LSP_FILE_TYPES`. `resolveServers` defines the routing order.

**Requirements Addressed:** `W261005GWLY-REQ1@R1`, `W261005GWLY-REQ2@R1`, `W261005GWLY-REQ5@R1`, `W261005GWLY-REQ11@R1`

**Research Support:** None

**Rationale:** Reuses strict zod sections and line-numbered errors. An enum of code file types enforces REQ5 at parse time.

**Code Impact:**

- `src/core/config/lsp.ts` — new.
- `src/core/config/schema.ts` — `ConfigSchema.lsp`.

**Detailed Design:** section 7 `src/core/config/lsp.ts`, `src/core/config/schema.ts`

**Tradeoffs:**

- Built-in commands may change upstream; each entry is one line to update.

**Success Criteria:** `S1`, `S3`, `S9`

**Verification Impact:**

- `V1`, `V3`, `V4`, `V11`.

## W261005GWLY-DES3: One host, one client per server and root

**Question:** Who owns processes, and how many?

**Decision:** `createLspHost` in `src/app` owns a `Map<ServerKey, client>` keyed `name@root`. Roots come from `findRoot`, and binaries from `Bun.which`. Crashes restart once, then the server is marked `failed`. `stop()` sends `shutdown`/`exit` within 500 ms, then kills; `installLifecycle` awaits it. `languageIdFor` maps the language ids that differ.

**Requirements Addressed:** `W261005GWLY-REQ1@R1`, `W261005GWLY-REQ2@R1`, `W261005GWLY-REQ9@R1`, `W261005GWLY-REQ12@R1`

**Research Support:** None

**Rationale:** Mirrors the index host's supervision pattern and Neovim's per-root model. Bounded shutdown keeps exit fast.

**Code Impact:**

- `src/app/lsp-host.ts`, `src/workspace/lsp/{client,roots,language-id,capabilities}.ts` — new.
- `src/app/lifecycle.ts`, `src/app/main.ts` — wiring.

**Detailed Design:** section 7 `src/app/lsp-host.ts`, `src/workspace/lsp/client.ts`, `sync.ts`/`roots.ts`/`language-id.ts`, `src/app/effects.ts`/`lifecycle.ts`/`main.ts`

**Tradeoffs:**

- Clients stay alive until config change, restart, or exit, even after their last file closes. Simpler, and it matches Neovim, but an idle server keeps its memory.

**Success Criteria:** `S1`, `S2`, `S22`, `S24`, `S25`

**Verification Impact:**

- `V2`, `V27`, `V29`, `V30`, `V34`.

## W261005GWLY-DES4: Document sync by observing the store

**Question:** How do servers learn about edits?

**Decision:** The host subscribes to the store and compares each attached buffer's `TextBuffer` with the last one it sent. It sends one incremental `lineChange`, debounced 150 ms per document, and flushes before any request for that document. `didSave` follows `savedVersion`, and `didClose` follows buffer removal.

**Requirements Addressed:** `W261005GWLY-REQ12@R1`, `W261005GWLY-REQ14@R1`

**Research Support:** None

**Rationale:** No reducer changes, and no edit path (vim, undo, mouse, link edits, disk reload) can be missed. Immutable buffers make the comparison cheap.

**Code Impact:**

- `src/app/lsp-host.ts` — `observe`, `flush`.
- `src/workspace/lsp/sync.ts` — `lineChange`.

**Detailed Design:** section 7 `src/workspace/lsp/sync.ts`, `src/app/lsp-host.ts`

**Tradeoffs:**

- One change per flush can cover more lines than the edit touched. That costs some bytes but stays correct.

**Success Criteria:** `S23`, `S30`

**Verification Impact:**

- `V28`, `V41`.

## W261005GWLY-DES5: LSP state, effects, and actions in the core

**Question:** How do the core and the host communicate?

**Decision:** `AppState.lsp: LspState`, four effects (`lsp`, `lspCancel`, `lspReply`, `lspRestart`), and six actions (`lspServer`, `lspAttached`, `lspDiagnostics`, `lspResult`, `lspMessage`, `lspApplyEdit`), handled in `createUpdate` and the runner with exhaustive switches.

**Requirements Addressed:** `W261005GWLY-REQ4@R1`

**Research Support:** None

**Rationale:** The same one-way protocol every adapter uses (`project.md` Architecture).

**Code Impact:**

- `src/core/state/types.ts`, `lsp-types.ts`, `init.ts`, `update.ts`, `src/app/effects.ts`.

**Detailed Design:** section 7 `src/core/state/lsp-types.ts`, `types.ts`, `update.ts`, `src/app/effects.ts`

**Tradeoffs:**

- More union variants, in exchange for compile-time exhaustiveness.

**Success Criteria:** `S7`

**Verification Impact:**

- `V9`, `V46`.

## W261005GWLY-DES6: Request routing, staleness, cancellation, and timeouts

**Question:** Which server answers, and what happens to late answers?

**Decision:** `pickServer` returns the first attached, ready server with the feature. `request` records the buffer version and replaces older hover, completion, or signature requests with `lspCancel`. `onLspResult` drops stale results. User requests time out after 5 s via `lsp:<id>` timers; automatic requests fail silently. The `lspKeystrokeP95` benchmark guards typing.

**Requirements Addressed:** `W261005GWLY-REQ2@R1`, `W261005GWLY-REQ4@R1`, `W261005GWLY-REQ8@R1`, `W261005GWLY-REQ14@R1`

**Research Support:** None

**Rationale:** Version checks are the simplest complete guard against applying results to changed text. Timers use the existing effect.

**Code Impact:**

- `src/core/state/lsp.ts` — `pickServer`, `request`, `onLspResult`, `onLspTimeout`.
- `src/core/state/save.ts` — `onTimer` routes `lsp:` timers.
- `scripts/bench-gate.ts`, `test/bench/lsp-keystroke.bench.ts`.

**Detailed Design:** section 7 `src/core/state/lsp.ts`; `scripts/bench-gate.ts`

**Tradeoffs:**

- A result is dropped even when an edit elsewhere in the file would not affect it. Simple, and the user can repeat the key.

**Success Criteria:** `S4`, `S8`, `S15`, `S29`, `S31`

**Verification Impact:**

- `V5`, `V10`, `V20`, `V40`, `V42`.

## W261005GWLY-DES7: Diagnostics as a language-neutral kernel decoration

**Question:** How are diagnostics stored and drawn?

**Decision:** The kernel `Diagnostic` type and `diagnosticMarks` provider are added to the window provider list. Published diagnostics are kept per path and server, and `shown` is derived by the `syncDiagnostics` post-step (frozen while the active window is in insert mode on that path). `cursorDiagnostic` feeds the command line. The commands `diag.next`/`diag.prev`/`diag.float`/`diag.list` complete the feature.

**Requirements Addressed:** `W261005GWLY-REQ6@R1`, `W261005GWLY-REQ7@R1`

**Research Support:** None

**Rationale:** Diagnostics aren't LSP-specific, and later sources (linters, Markdown checks) can reuse them. A post-step keeps the freeze rule in one place.

**Code Impact:**

- `src/core/kernel/view/diagnostics.ts`, `src/core/state/lsp.ts`, `src/ui/editors/text-view.ts`, `src/ui/views/cmdline.ts`, `src/ui/theme.ts`, `src/core/state/lsp-pickers.ts`.

**Detailed Design:** section 7 `src/core/kernel/view/diagnostics.ts`, `src/core/state/lsp.ts`, UI entries

**Tradeoffs:**

- Only the active window freezes. A second window on the same file in normal mode also keeps the frozen list until insert mode ends. Acceptable and simpler.

**Success Criteria:** `S10`, `S11`, `S12`, `S13`

**Verification Impact:**

- `V12`, `V13`, `V14`, `V15`, `V16`, `V17`, `V47`.

## W261005GWLY-DES8: Non-modal info float

**Question:** Where do hover, signature, and diagnostic details appear?

**Decision:** `LspState.float` is drawn by `LspFloatView` in `OverlayHost` below modal overlays. It never takes keys. `syncFloat` closes it when the window, version, cursor, or mode changes, and `handleKeyAction` closes it on `<Esc>` before routing the key.

**Requirements Addressed:** `W261005GWLY-REQ6@R1`, `W261005GWLY-REQ13@R1`

**Research Support:** None

**Rationale:** The existing `Overlay` union is modal, while hover must not steal keys. A separate state field keeps both concepts clean.

**Code Impact:**

- `src/core/state/lsp.ts` — `syncFloat`; `src/core/state/keys.ts` — `handleKeyAction` (`<Esc>`).
- `src/ui/overlays/lsp-float.ts`, `src/ui/overlays/host.ts`.

**Detailed Design:** section 7 `src/core/state/lsp.ts`, UI entries

**Tradeoffs:**

- No scrolling or focusing the float. Long hovers are truncated at 12 rows. Neovim's "press K again to enter" is not included.

**Success Criteria:** `S28`

**Verification Impact:**

- `V37`, `V49`.

## W261005GWLY-DES9: Location results through jumps and pickers

**Question:** How are definition, implementation, references, and symbols shown?

**Decision:** One location → `recordJump` + `goTo`. Several → `LspState.list` + the `lspLocations` picker. Symbols → the `lspSymbols` picker. Diagnostics → the `diagnostics` picker. Sources are spread into `pickerSources`.

**Requirements Addressed:** `W261005GWLY-REQ7@R1`, `W261005GWLY-REQ13@R1`

**Research Support:** None

**Rationale:** Reuses the jump list (`<C-o>`) and the picker with previews.

**Code Impact:**

- `src/core/state/lsp.ts` — `onLocations`; `src/core/state/lsp-pickers.ts`; `src/core/state/picker.ts`.

**Detailed Design:** section 7 `src/core/state/lsp.ts`, `src/core/state/lsp-pickers.ts`

**Tradeoffs:**

- No quickfix list. Pickers are the existing list surface.

**Success Criteria:** `S13`, `S27`

**Verification Impact:**

- `V17`, `V35`, `V36`.

## W261005GWLY-DES10: Code completion as a completion mode

**Question:** How does code completion fit the existing popup?

**Decision:** `CompletionState.mode: "code"` with a `code` payload. `maybeCompletion` returns a `Result`. `codeCompletionStep` handles trigger characters, the 150 ms `completion` timer, and local `rankBy` re-ranking. Accepting resolves when supported, then `applyCompletion` applies the main edit and `additionalTextEdits` in one undo step. The client advertises `snippetSupport: false`.

**Requirements Addressed:** `W261005GWLY-REQ8@R1`, `W261005GWLY-REQ9@R1`

**Research Support:** None

**Rationale:** One popup, one key scheme, and no snippet engine.

**Code Impact:**

- `src/core/state/code-completion.ts`, `completion.ts`, `keys.ts`, `types.ts`, `save.ts` (timer); `src/ui/overlays/completion.ts`; `src/workspace/lsp/capabilities.ts`.

**Detailed Design:** section 7 code-completion entry, `types.ts`, capabilities

**Tradeoffs:**

- No automatic parentheses or placeholders.

**Success Criteria:** `S14`, `S15`, `S16`

**Verification Impact:**

- `V18`, `V19`, `V20`, `V21`, `V33`.

## W261005GWLY-DES11: Signature help

**Question:** When is signature help shown?

**Decision:** `<C-s>` in insert mode, or the server's signature trigger characters typed in a code buffer (`maybeSignature`), opens `float{kind:"signature"}` with the active parameter range. It closes on leaving insert mode.

**Requirements Addressed:** `W261005GWLY-REQ13@R1`

**Research Support:** None

**Rationale:** Signature help is how parameters are shown when completion inserts plain names (REQ9).

**Code Impact:**

- `src/core/state/keys.ts` — `handleKeyAction`; `src/core/state/lsp.ts`.

**Detailed Design:** section 7 code-completion entry, `src/core/state/lsp.ts`

**Tradeoffs:**

- Only the active signature is shown, not the full overload list.

**Success Criteria:** `S28`

**Verification Impact:**

- `V37`.

## W261005GWLY-DES12: One workspace-edit path

**Question:** How do server edits change files?

**Decision:** `CodeEdit` → `startCodeEdit`. Open buffers go through `applyBufferEdits`, and closed files through `applyEdits` with `SpanEdit.expected` made optional. The batch is tracked in `LspState.edit` and routed from `onEditsApplied`. A version mismatch or outside path refuses everything. One summary toast is shown, with one reply. `RenamePrompt` handles `grn`, and the `lspActions` picker handles `gra`.

**Requirements Addressed:** `W261005GWLY-REQ10@R1`, `W261005GWLY-REQ11@R1`

**Research Support:** None

**Rationale:** Reuses the link-safe rename machinery (serial queue, atomic write, rename following), and keeps link rename's protection unchanged.

**Code Impact:**

- `src/core/state/lsp-edits.ts`, `src/core/features/links/rename.ts`, `src/core/state/link-edits.ts`, `src/core/state/types.ts`, `src/core/state/explorer.ts` (`promptKey`).

**Detailed Design:** section 7 lsp-edits entry

**Tradeoffs:**

- Closed-file edits have no stale-text check beyond range bounds, because servers send no expected text. The server's view of closed files is the disk, which is what is edited.

**Success Criteria:** `S17`, `S18`, `S19`

**Verification Impact:**

- `V22`, `V23`, `V24`, `V48`.

## W261005GWLY-DES13: Formatting and format-on-save

**Question:** How does formatting integrate with saving?

**Decision:** `lsp.format` (`:Format`, range in visual mode) applies edits through `startCodeEdit`. When `formatOnSave` is on, `writeActive` requests formatting first, with the `lspFormat:<bufferId>` 1000 ms timer as a fallback, and then always calls `writeBuffer`. Autosave never formats. `formattingOptions` derives `insertSpaces` from the buffer's indentation.

**Requirements Addressed:** `W261005GWLY-REQ11@R1`

**Research Support:** None

**Rationale:** `writeActive` is the only explicit-save entry, so autosave is unaffected by construction.

**Code Impact:**

- `src/core/state/lsp-commands.ts`, `src/core/state/commands.ts`, `src/core/state/save.ts`.

**Detailed Design:** section 7 lsp-commands entry

**Tradeoffs:**

- `:wa` or quitting with unsaved buffers does not format. Only `:w` does.

**Success Criteria:** `S20`, `S21`

**Verification Impact:**

- `V25`, `V26`.

## W261005GWLY-DES14: Commands and generated key bindings

**Question:** How are keys bound without touching Markdown?

**Decision:** `lspCommands` with `filetypes: LSP_FILE_TYPES` (except `diag.list` and `lsp.info`). `lspBindings` is generated per code file type from the Neovim 0.11 key table, plus `<C-Space>` and `<leader>xd`. Ex aliases are `Format`, `Diagnostics`, `LspInfo`, `LspRestart`. `toKey` learns `<C-Space>`.

**Requirements Addressed:** `W261005GWLY-REQ5@R1`, `W261005GWLY-REQ13@R1`

**Research Support:** None

**Rationale:** `KeyScope` holds one file type, so generation is the existing pattern. Overrides work through `effectiveBindings`.

**Code Impact:**

- `src/core/state/lsp-commands.ts`, `src/app/main.ts`, `src/ui/input.ts`, `src/core/state/commands.ts` (`EX_ALIASES`).

**Detailed Design:** section 7 lsp-commands entry, UI entry

**Tradeoffs:**

- About 450 generated bindings, cheap in the keymap trie. The `gr`, `]`, and `[` prefixes delay vim's own `gr{char}`, `]]`, and `[[` in code buffers by the which-key prefix path, as in Neovim.

**Success Criteria:** `S9`, `S11`, `S26`, `S28`

**Verification Impact:**

- `V12`, `V35`, `V38`, `V39`.

## W261005GWLY-DES15: Server status and messages

**Question:** How are server state, progress, and messages surfaced?

**Decision:** `lspServer` carries `ServerView` (state, progress text, features), throttled to 100 ms per server. `statusSegments().lsp` and `lspSegment` paint it. `showMessage` error and warning → `lspMessage` → toast; info and log → debug log. `:LspInfo` uses the `lspInfo` picker, including missing binaries.

**Requirements Addressed:** `W261005GWLY-REQ3@R1`

**Research Support:** None

**Rationale:** Same glyph language as the index segment. Throttling avoids repaint storms.

**Code Impact:**

- `src/app/lsp-host.ts`, `src/core/state/lsp.ts`, `src/core/state/status.ts`, `src/ui/views/statusline.ts`, `src/core/state/lsp-pickers.ts`.

**Detailed Design:** section 7 status entry, lsp-host entry, lsp-pickers entry

**Tradeoffs:**

- No `window/showMessageRequest` choices; such requests are answered with no action.

**Success Criteria:** `S5`, `S6`

**Verification Impact:**

- `V6`, `V7`, `V8`.

## W261005GWLY-DES16: Watched-file notifications

**Question:** How do servers learn about changes made outside `so`?

**Decision:** The watcher callback calls `lspHost.notify(event)`. Each client matches events against its registered `DidChangeWatchedFilesRegistrationOptions` globs (`Bun.Glob`) relative to its root, and sends `workspace/didChangeWatchedFiles` debounced 100 ms.

**Requirements Addressed:** `W261005GWLY-REQ4@R1`

**Research Support:** None

**Rationale:** Uses the existing watcher, so there are no new file-system watches.

**Code Impact:**

- `src/app/main.ts`, `src/app/lsp-host.ts`, `src/workspace/lsp/client.ts`.

**Detailed Design:** section 7 client entry, main entry

**Tradeoffs:**

- Only paths the workspace watcher sees (respecting ignore rules) are reported.

**Success Criteria:** `S7`

**Verification Impact:**

- `V32`.

## W261005GWLY-DES17: Fake server and verification layers

**Question:** How is all of this tested without real servers?

**Decision:** `test/fixtures/fake-lsp.ts` (run with `bun`) answers from a JSON script given as an argument, records every message it receives to a log file, and can crash, ignore `shutdown`, publish diagnostics, or send progress on cue. Unit tests cover pure logic, integration tests cover host, client, and runner, e2e covers the PTY app, one test runs against rust-analyzer locally, and the `lspKeystrokeP95` benchmark covers typing.

**Requirements Addressed:** `W261005GWLY-REQ14@R1`, `W261005GWLY-REQ15@R1`

**Research Support:** None

**Rationale:** Deterministic on both CI runners. The real-server test catches drift.

**Code Impact:**

- `test/fixtures/fake-lsp.ts`, `test/support/lsp.ts`, the suites in section 8, `scripts/bench-gate.ts`.

**Detailed Design:** section 8 tree

**Tradeoffs:**

- The fake server can diverge from real servers; the local real-server test reduces this but does not run in CI.

**Success Criteria:** `S31`, `S32`

**Verification Impact:**

- `V42`, `V43`, `V44`, `V46`.

## W261005GWLY-DES18: Locations outside the workspace

**Question:** What happens when a result points outside the opened folder (standard libraries, toolchain sources)?

**Decision:** `convert.ts` maps only `file:` URIs under the workspace root to paths, and counts the rest in `outside`. Location results skip them and say `N outside the workspace`. A `gd` whose only result is outside shows `definition is outside the workspace: <path>`. Workspace edits touching outside files are refused as a whole.

**Requirements Addressed:** `W261005GWLY-REQ10@R1`, `W261005GWLY-REQ13@R1`

**Research Support:** None

**Rationale:** Buffers, saves, and the watcher are all workspace-relative, so opening files outside the workspace would be a new capability with its own safety questions. Reporting keeps behaviour explicit.

**Code Impact:**

- `src/workspace/lsp/convert.ts` — `uriToPath`, `toLocation`, `toCodeEdit`.
- `src/core/state/lsp.ts` — `onLocations` messages.

**Detailed Design:** section 7 client/convert entry, `src/core/state/lsp.ts`

**Tradeoffs:**

- `gd` into the Rust or Go standard library doesn't open the file. Future trigger: a request to open read-only files outside the workspace.

**Success Criteria:** `S27`

**Verification Impact:**

- `V33`, `V36`.
