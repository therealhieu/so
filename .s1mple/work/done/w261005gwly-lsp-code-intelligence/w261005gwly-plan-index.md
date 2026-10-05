# W261005GWLY Implementation Plan Index

## Status

`Ready`

## Sources

- Plan context: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-context.md`
- System design: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-system-design.md`
- UI design: Not applicable — no UI design was authored; the system design covers the UI surfaces with existing tokens and overlays
- System requirements: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-requirements.md`
- UI requirements: Not applicable — none authored
- Research: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-research.md`
- Discussion context: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-discuss-context.md`
- UI context: Not applicable — none authored

## Roadmap Contract

None — standalone work

## Plan Overview

Build LSP code intelligence inside out, following the design's layer direction (system design §2 Proposed Architecture):

```text
pure core contracts and reducers (Part 1) → protocol client, host, and wiring against a fake server (Part 2) → UI surfaces, end-to-end proof, bench, and delivery (Part 3)
```

- **Part 1** is protocol-free and process-free. Every reducer is proven with `createUpdate` unit tests. Knip treats `test/**` as an entry, so exports used by unit tests pass `bun run check` before their production consumer exists.
- **Part 2** adds everything that speaks JSON-RPC or owns a process: `src/workspace/lsp/*`, `src/app/lsp-host.ts`, runner, lifecycle, and `main` wiring. It is proven against the scripted fake server through `startApp`.
- **Part 3** paints the state Part 1 owns, proves the whole flow in a PTY, adds the `lspKeystrokeP95` bench, and runs delivery.

`.s1mple/S1MPLE.md` carry-over:

- **Implementation:** keep it lean. Implement the designed symbols only. No work-process ids (work, REQ, DES, S, V, phase, goal) in code, test names, or log messages.
- **Verification:** run `bun run check` after every group. Run `bun run test:ci` from Part 2 on. Run `bun run bench` in Part 3. Every agent kills every process it starts and checks `pgrep -f fake-lsp` is empty. A missed bench gate gets quick speedups or a relaxed threshold, not a stall.
- **Delivery:** open a PR to `main`, make CI pass, move the work folder to `work/done/`, update `.s1mple/` references and `project.md`, push again, and confirm CI is green. Never force-push, merge, tag, or release without the user's approval.
- Every delegated agent reads `.s1mple/S1MPLE.md` and its required references first.

## Execution Flow

```text
Plan 1: core → Plan 2: host → Plan 3: ui-and-delivery
```

## Plan Parts

| Part | File | Scope | Dependencies | System design | UI design | Verification focus |
|---|---|---|---|---|---|---|
| 1 | `w261005gwly-plan-1-core.md` | `[lsp]` config and built-in table; kernel diagnostic decoration; `lsp-types.ts` and the `types.ts`/`init.ts` protocol extension; core reducers for requests, routing, staleness, diagnostics, floats, pickers, commands, bindings, format, workspace edits, and code completion; the runner's no-host answer | None | REQ1–REQ11, REQ13, REQ14 (core side); DES2, DES5–DES14, DES18, DES19 (core side); S1, S3, S4, S6–S21, S26–S29, S33–S40 (core side); V1, V3–V5, V8–V11, V13–V16, V18–V26, V35–V37, V39, V40, V46, V49, V50, V58–V60, V62 | None | `createUpdate` units; `bun run check` (boundaries, knip); `rg "maybeOpenCompletion" src test` empty |
| 2 | `w261005gwly-plan-2-host.md` | Exact protocol package pins and `PACKAGE_HOMES`; `src/workspace/lsp/*` (convert, capabilities, sync, roots, language-id, client); `src/app/lsp-host.ts`; runner, lifecycle, and `main` wiring; fake server, `test/support/lsp.ts`, `startApp` LSP option; integration and local-only real-server suites | 1 | REQ1–REQ4, REQ6, REQ7, REQ9, REQ10, REQ12, REQ14, REQ15; DES1–DES4, DES6, DES10, DES12, DES16–DES20; S1, S2, S4–S7, S16, S17, S19, S22–S25, S30, S32–S37, S39, S40; V2, V7, V27–V34, V41, V44–V46, V48, V51–V57, V61, V63, V64 | None | Workspace units; integration against the fake server; no orphan processes |
| 3 | `w261005gwly-plan-3-ui-and-delivery.md` | Text-view providers, theme tokens, `lsp-float` overlay, completion rows, statusline segment, cmdline fallback, `<C-Space>`; PTY e2e; bench and gate; delivery | 1, 2 | REQ3, REQ6, REQ7, REQ8, REQ13, REQ14, REQ15; DES6–DES11, DES14, DES15, DES17; S5, S10–S13, S28, S31, S32; V6, V12, V17, V38, V42, V43, V46, V47 | None | `test/ui` painted cells; e2e; `bun run bench`; CI green on the PR and after the move |

## Group Layout

| Group | Shared context | Split rule |
|---|---|---|
| `P1-G1` — Contracts | `src/core/config/{lsp,schema}.ts`; `src/core/kernel/view/diagnostics.ts`; `src/core/state/{lsp-types,types,init}.ts`; unit tests for config and kernel | `First group` |
| `P1-G2` — Requests, diagnostics, and commands | `src/core/state/{lsp-types,types,lsp,update,save,keys,lsp-pickers,picker,lsp-commands,commands}.ts`, `src/app/effects.ts` (no-host answer), `test/support/state.ts` (`testRegistries`), and the tests `lsp.test.ts`, `lsp-commands.test.ts`: `request`, `pickServer`, `onLsp*`, staleness, timeouts, diagnostics slots and freeze, floats and `<Esc>` close, jumps and pickers, generated bindings, `lsp.format` request | `Too large` — with P1-G3 the core reducers exceed 15 changed files; split at the seam where `onLspResult` hands edit and completion results off |
| `P1-G3` — Edits and completion | `src/core/state/{lsp-edits,code-completion,completion,keys,link-edits,explorer,lsp-pickers,commands,save,lsp-commands,types,update}.ts`, `src/core/features/links/rename.ts` (`SpanEdit.expected?`) and the tests `lsp-edits.test.ts`, `code-completion.test.ts`, `lsp-commands.test.ts`; result hand-off cases in `lsp.ts`; `lspActions` source; format results and format on save; `completion`, `lspResolve`, `lspFormat:` timers | `Too large` — see P1-G2; edits and completion share `applyBufferEdits`, one-undo, and resolve timers |
| `P2-G1` — Client, host, and wiring | `package.json`, `bun.lock`, `test/boundaries.test.ts` (pins land with their first importer); `src/workspace/lsp/*` and tests; `src/app/{lsp-host,effects,lifecycle,main}.ts`; `test/fixtures/fake-lsp.ts`, `test/support/lsp.ts`, `test/integration/{helpers,lsp-host.test,lsp-edits.test,lsp-real.test}.ts` | `Ordered phase` — processes and protocol need the Part 1 contracts and reducers verified first. Over 15 files; one context because client, host, and the fake-server suites share the same protocol behaviour, and the 5-group limit leaves no further split |
| `P3-G1` — UI, end-to-end, and delivery | `src/ui/editors/text-view.ts`, `src/ui/theme.ts`, `src/ui/overlays/{lsp-float,host,completion}.ts`, `src/ui/views/{statusline,cmdline}.ts`, `src/core/state/status.ts`, `src/core/state/status.test.ts`, `src/ui/input.ts`, `src/ui/input.test.ts`; `test/ui/lsp.test.ts`; `test/e2e/lsp.test.ts`; `test/bench/lsp-keystroke.bench.ts`, `scripts/bench-gate.ts`; `.s1mple/docs/project.md`; PR and CI | `Ordered phase` — painting and PTY proof need the running host; delivery needs every group verified |

## Cross-Part Coordination

| Boundary | Producing part | Consuming part | Coordination requirement |
|---|---|---|---|
| `LspConfig`, `ServerSpec`, `resolveServers`, `gateAllows`, `LSP_FILE_TYPES` | 1 | 2 | Host reconcile uses exactly these; no second table or schema |
| `LspOp`, `LspResult`, `ServerKey`, `CodeEdit`, `CodeCompletionItem`, `Diagnostic` | 1 | 2 | `convert.ts` maps protocol ↔ these types only; core never imports protocol types |
| `Effect` `lsp`/`lspCancel`/`lspReply`/`lspRestart` and `Action` `lsp*` | 1 | 2 | Runner routes every effect kind to `d.lsp?.run`; host dispatches every action the reducers handle |
| `TimerId` `completion`, `lspResolve`, `lsp:<id>`, `lspFormat:<id>` | 1 | 2 | Existing timer runner fires them; no host-side timers for these |
| `SpanEdit.expected?` / `applySpanEdits` / `onEditsApplied` routing | 1 | 2 | Runner `applyEdits` writes closed files and reports written paths to `lspHost.notify` |
| `lspCommands`, `lspBindings`, `lspGroups`, `lspPickerSources` | 1 | 2 | Registered in `main` `registries` exactly as `testRegistries` registers them in Part 1 |
| Runner no-host answer for `lsp` effects | 1 | 2 | Kept when `RunnerDeps.lsp` is absent; `d.lsp.run` takes over when present |
| `AppState.lsp` (`servers`, `diagnostics`, `float`, completion code mode) | 1 | 3 | UI reads state only; `StatusSegments.lsp` and `lspSegment` follow design §7 |
| `startApp` LSP option and fake server | 2 | 3 | e2e and bench reuse the fake server and support helpers |

## Coverage

| Source item | Covered by parts | Expected outcome |
|---|---|---|
| `W261005GWLY-REQ1@R2` | 1, 2 | `[lsp]` opt-in; XDG-only definitions; `localBin`; reconcile on `:ConfigReload` |
| `W261005GWLY-REQ2@R2` | 1, 2 | Seven built-ins with gates, overrides, stacking, settings delivery, first-capable routing |
| `W261005GWLY-REQ3@R2` | 1, 2, 3 | Status segment, throttled progress, message toasts, `:LspInfo`, quiet `unavailable` |
| `W261005GWLY-REQ4@R1` | 1, 2 | Every feature as `LspOp`/`LspResult`; not-supported message; watched files |
| `W261005GWLY-REQ5@R1` | 1 | Code file types only; no Markdown bindings |
| `W261005GWLY-REQ6@R2` | 1, 2, 3 | Signs, underlines, insert freeze, cursor diagnostic, `]d`/`[d`/`<C-w>d`, push and pull |
| `W261005GWLY-REQ7@R2` | 1, 2, 3 | `:Diagnostics` picker; pulled slot cleared on close |
| `W261005GWLY-REQ8@R1` | 1, 3 | Auto completion on triggers and 150 ms pause; local narrowing; stale drop |
| `W261005GWLY-REQ9@R2` | 1, 2 | Plain-text inserts, per-server snippets, bounded resolve, one-undo auto-imports, item command |
| `W261005GWLY-REQ10@R2` | 1, 2 | One workspace-edit path; version refusal; exactly-once `applyEdit` reply; own writes notified |
| `W261005GWLY-REQ11@R1` | 1 | `:Format`, range format, format-on-save on `:w` bounded at 1000 ms |
| `W261005GWLY-REQ12@R2` | 2 | Ordered-marker roots, incremental debounced sync, crash window, bounded stop |
| `W261005GWLY-REQ13@R1` | 1, 3 | Neovim 0.11 keys, jumps, pickers, floats, `<C-Space>`, outside-workspace counting |
| `W261005GWLY-REQ14@R2` | 1, 2, 3 | Stale drops, cancellation, timeouts, quiet errors, `lspKeystrokeP95 ≤ 16` |
| `W261005GWLY-REQ15@R1` | 2, 3 | All suites pass without real servers; local-only real-server test; no orphans |
| `DES1`–`DES20`, `S1`–`S40`, `V1`–`V64` | 1, 2, 3 | Every case in system design §8 Test Suites and Cases is implemented at its listed location (V47 in `test/ui/lsp.test.ts`, per plan context §7) |
| `.s1mple/S1MPLE.md` Implementation, Verification, Delivery | 1, 2, 3 | No work-process ids in code; checks after every group; PR, CI, folder move, push |

## Overall Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | biome, tsc, knip (zero findings), unit suites, boundaries, repo pins pass |
| CI suites | `bun run test:ci` | Component, integration, and e2e suites pass without language servers installed |
| Bench | `bun run bench` | `lspKeystrokeP95` ≤ gate (2× the 16 ms target) |
| Obsolete reference | `rg "maybeOpenCompletion" src test` | No matches |
| Process hygiene | `pgrep -f fake-lsp` after suites | No processes |
| Work-process ids | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]" src test scripts` | No matches |
| Delivery | PR to `main`; CI on the PR head and after the work-folder move | All CI jobs green on both heads |

## Completion Criteria

- Every listed plan part is implemented and verified.
- Every system and applicable UI design chain and binding constraint has complete coverage.
- Cross-part coordination is integrated and verified.
- For roadmap-linked work, assigned parent obligations and cross-work checks have actual evidence, and all gates due within this execution scope are satisfied. Report later delivery gates separately; do not infer roadmap delivery from work completion.
- All overall verification checks pass.

## Planning Gaps

None
