# W261005GWLY Plan Part 2 — host

## Status

`Ready`

## Objective

`so` runs real language-server processes for open code buffers: the workspace layer speaks JSON-RPC over stdio and converts protocol data to Part 1's core types, `createLspHost` reconciles clients with config and buffers, syncs documents, pulls diagnostics, supervises crashes, forwards watched files, and stops within its bound, and `main` wires it all. Every behaviour is proven against the scripted fake server through `startApp`, with no real server needed and no process left behind.

## Coverage Summary

- **System Design:** `REQ1@R2, REQ2@R2, REQ3@R2, REQ4@R1, REQ6@R2, REQ7@R2, REQ9@R2, REQ10@R2, REQ12@R2, REQ14@R2, REQ15@R1; DES1, DES2, DES3, DES4, DES6, DES10, DES12, DES16, DES17, DES18, DES19, DES20; S1, S2, S4, S5, S6, S7, S16, S17, S19, S22, S23, S24, S25, S30, S32, S33, S34, S35, S36, S37, S39, S40; V2, V7, V27, V28, V29, V30, V31, V32, V33, V34, V41, V44, V45, V46, V48, V51, V52, V53, V54, V55, V56, V57, V61, V63, V64`
- **UI Design:** `None`

## Sources

- Plan index: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-index.md`
- Plan context: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-context.md`
- System design: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-system-design.md`
- UI design: Not applicable — no UI design was authored; the system design covers the UI surfaces with existing tokens and overlays
- System requirements: `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-requirements.md`
- UI requirements: Not applicable — none authored

## Dependencies

- Part 1 verified (P1-G1, P1-G2, P1-G3 accepted). Consumed outputs: `LspConfig`, `ServerSpec`, `resolveServers`, `gateAllows`, `LSP_FILE_TYPES` (`src/core/config/lsp.ts`); `Diagnostic` (`src/core/kernel/view/diagnostics.ts`); `LspOp`, `LspResult`, `ServerView`, `CodeEdit`, `CodeCompletionItem`, `ServerKey` (`src/core/state/lsp-types.ts`); the six `lsp*` actions and four effects (`src/core/state/types.ts`); `lspCommands`, `lspBindings`, `lspGroups`, `lspPickerSources`; `SpanEdit.expected?`; the runner's no-host answer for `lsp` effects (`src/app/effects.ts`).
- Every agent reads `.s1mple/S1MPLE.md` and its required references before editing.

## Execution Flow

```text
P2-G1: Client, host, and wiring
```

## Groups

### P2-G1 — Client, host, and wiring

#### Goal

With `[lsp] enabled = true` and a fake server in config, opening a code file through `startApp` spawns one process per (server, root), syncs text incrementally, shows pushed and pulled diagnostics, answers requests through the runner, applies and reports edits, restarts within the crash window, and stops every child within 500 ms; `main` constructs and wires the same host.

#### Coverage Summary

- **System Design:** `REQ1@R2, REQ2@R2, REQ3@R2, REQ4@R1, REQ6@R2, REQ7@R2, REQ9@R2, REQ10@R2, REQ12@R2, REQ14@R2, REQ15@R1; DES1–DES4, DES6, DES10, DES12, DES16–DES20; S1, S2, S4–S7, S16, S17, S19, S22–S25, S30, S32–S37, S39, S40; V2, V7, V27–V34, V41, V44, V45, V46, V48, V51–V57, V61, V63, V64`
- **UI Design:** `None`

#### Scope

- Included: exact pins and `PACKAGE_HOMES`; `convert.ts`, `capabilities.ts`, `sync.ts`, `roots.ts`, `language-id.ts`, `client.ts`; `lsp-host.ts`; `RunnerDeps.lsp`, runner routing, `applyEdits` notify; `stopLsp`; `main` registration and wiring; fake server and support helpers; `startApp` LSP option; integration suites `lsp-host.test.ts`, `lsp-edits.test.ts`, `lsp-real.test.ts`.
- Excluded: UI painting, PTY e2e, bench (P3-G1); any change to Part 1 reducer contracts (a needed change stops the group for reconciliation).
- Main files: `package.json`, `bun.lock`, `test/boundaries.test.ts`, `src/workspace/lsp/{convert,capabilities,sync,roots,language-id,client}.ts`, `src/workspace/lsp/{convert,sync,roots}.test.ts`, `src/app/lsp-host.ts`, `src/app/effects.ts`, `src/app/lifecycle.ts`, `src/app/main.ts`, `test/fixtures/fake-lsp.ts`, `test/support/lsp.ts`, `test/integration/helpers.ts`, `test/integration/{lsp-host,lsp-edits,lsp-real}.test.ts`
- Rules: read `.s1mple/S1MPLE.md` first; no work-process ids in code, test names, or logs; log events use domain names only (`lsp.start`, `lsp.unavailable`, `lsp.crashed`, `lsp.pullFailed`, `lsp.message`, `lsp.stop`) and never note text; run `bun run check` and `bun run test:ci` before every commit and at group end; every suite stops its processes in `afterEach`; every agent kills every process it starts (fake servers, `so` instances, watchers) and confirms `pgrep -f fake-lsp` is empty before finishing a task.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ4@R1, REQ12@R2, REQ15@R1 → DES1 → S7, S32 → V46` | `None` | Protocol packages pinned and importable only from `src/workspace/lsp/` |
| `REQ9@R2, REQ10@R2, REQ14@R2 → DES1, DES10, DES12, DES18, DES19 → S7, S16, S19, S37, S39 → V33, V45, V57, V64` | `None` | Converters and capabilities match the design |
| `REQ12@R2 → DES4, DES20 → S22, S23 → V27, V28` | `None` | Ordered-marker roots; `lineChange` rebuilds text exactly |
| `REQ1@R2 → DES2, DES3 → S1, S2 → V2` | `None` | Nothing spawns while off; reload starts and stops servers |
| `REQ2@R2, REQ12@R2 → DES3, DES20 → S4, S22 → V30, V31` | `None` | One process per (server, root); stacked servers both attach |
| `REQ1@R2, REQ2@R2 → DES2, DES3 → S33, S34 → V51, V52` | `None` | Local `tsc` and version gate; settings by configuration and `initOptions` |
| `REQ3@R2, REQ12@R2 → DES3, DES15 → S35 → V53` | `None` | Exit before `initialize` → `unavailable`, no toast, no restart |
| `REQ12@R2 → DES3 → S25 → V34` | `None` | Bounded stop kills a server that ignores `shutdown` |
| `REQ14@R2 → DES4 → S30 → V41` | `None` | One debounced `didChange` before a following request |
| `REQ6@R2, REQ7@R2, REQ14@R2 → DES19 → S36 → V54, V55, V56` | `None` | Pull after open and each change; re-pull on refresh; slots kept; close clears pulled |
| `REQ12@R2 → DES3 → S24 → V29, V61` | `None` | Restart until the fifth crash within 180 s |
| `REQ3@R2 → DES15 → S5, S6 → V7` | `None` | Progress throttled; info messages only logged |
| `REQ4@R1, REQ10@R2 → DES16, DES12 → S7, S17, S40 → V32, V48, V63` | `None` | Watched files by registered globs; rename writes closed files and reports them |
| `REQ15@R1 → DES17 → S7, S32 → V44` | `None` | Real rust-analyzer smoke test, skipped without the binary |

#### Cross-Work Gates

None

#### Tasks

##### P2-G1-T1 — Protocol packages and converters

- **Outcome:** `vscode-jsonrpc@9.0.3` and `vscode-languageserver-protocol@3.18.4` are exact pins homed in `src/workspace/lsp/`, and `convert.ts`/`capabilities.ts` map protocol data to core types as designed.
- **System Design:** `REQ4@R1, REQ9@R2, REQ10@R2, REQ14@R2; DES1, DES10, DES12, DES18, DES19; S7, S16, S19, S27, S36, S37, S39; V33, V45, V46, V57, V64`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `client.ts`/`capabilities.ts`/`convert.ts` (`clientCapabilities`, `flattenSnippet`, `toErrorResult`, converter list in §4), §7 `test/boundaries.test.ts`/`package.json`
- **Files:** `package.json`, `bun.lock`, `test/boundaries.test.ts` (`PACKAGE_HOMES`), `src/workspace/lsp/convert.ts` (`pathToUri`, `uriToPath`, `toDiagnostic`, `toLocation`, `toSymbols`, `toCompletion`, `flattenSnippet`, `toCodeEdit`, `toHover`, `toSignature`, `toLspPosition`, `toErrorResult`, capability → `LspFeature[]`), `src/workspace/lsp/capabilities.ts` (`clientCapabilities`), `src/workspace/lsp/convert.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V33, V45, V57, V64`:** `src/workspace/lsp/convert.test.ts` — cases per design §8 `workspace/lsp/convert.test.ts`.

   **Preview:**

   ```ts
   test("versioned document changes keep their versions and files outside the workspace are counted", () => {
     // documentChanges with versions → CodeEdit.files[].version; uri outside root → outside 1
   });
   test("client capabilities advertise only supported features", () => {
     // snippetSupport false/true by option; workspaceEdit.resourceOperations []; codeAction.resolveSupport.properties ["edit"];
     // textDocument.diagnostic.dynamicRegistration false; workspace.diagnostics.refreshSupport true;
     // no failureHandling, changeAnnotationSupport, or willSaveWaitUntil
   });
   test("snippets become plain text with the cursor at the final stop", () => {
     // "foo(${1:a}, $2)$0" → {text:"foo(a, )", cursor:8}; "${1|x,y|}" → "x"; "\\$1" → "$1"; "$TM_FILENAME" → ""
   });
   test("content-modified and cancelled errors are quiet", () => { /* -32801, -32800 → quiet true; -32603 → no quiet; message kept */ });
   test("markdown hover text drops code fences", () => { /* lines equal the inner text */ });
   ```

   - Run `bun test src/workspace/lsp/convert.test.ts` and confirm failure.

2. **GREEN:** packages, boundary entries, `convert.ts`, `capabilities.ts`

   **Preview:**

   ```text
   bun add vscode-jsonrpc@9.0.3 vscode-languageserver-protocol@3.18.4
   └── Expect: package.json dependencies gain both exact versions; bun.lock updated
   ```

   ```ts
   // test/boundaries.test.ts PACKAGE_HOMES — design §7
   "vscode-jsonrpc": ["src/workspace/lsp/"],
   "vscode-languageserver-protocol": ["src/workspace/lsp/"],
   ```

   - Protocol types are `import type` from `vscode-languageserver-protocol`; `ResponseError` codes come from `vscode-jsonrpc`.
   - Converters validate the fields they read and drop unconvertible items with one log line; no document text is logged.

3. **REFACTOR:** Keep converters as plain functions in one file; no class wrappers.

   **Preview:**

   ```ts
   // allowed: private helpers in convert.ts; not allowed: protocol types leaking into src/core
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(workspace): add protocol packages and LSP converters

   Task: P2-G1-T1 — Protocol packages and converters
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V33, V45, V57, V64` — `bun test src/workspace/lsp/convert.test.ts` → pass
- `V46` — `bun run check` → pass (exact pins, boundary homes, zero knip findings)

##### P2-G1-T2 — Incremental sync and project roots

- **Outcome:** `lineChange` produces one change that rebuilds the next text exactly, and `findRoot` resolves ordered markers with `nearest`/`topmost` inside the workspace.
- **System Design:** `REQ12@R2; DES4, DES20; S22, S23; V27, V28`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `sync.ts`/`roots.ts`, §9 DES20
- **Files:** `src/workspace/lsp/sync.ts` (`LineChange`, `lineChange`), `src/workspace/lsp/roots.ts` (`findRoot`), `src/workspace/lsp/sync.test.ts`, `src/workspace/lsp/roots.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V27, V28`:** `roots.test.ts`, `sync.test.ts`

   **Preview:**

   ```ts
   test("random edit sequences rebuild the same text from incremental changes", () => {
     // 500 seeded sequences: apply lineChange(prev, next) to prev text → equals fullText(next)
   });
   test("project roots follow marker priority and search mode", () => {
     // topmost: repo/Cargo.toml + repo/a/Cargo.toml, file in repo/a/src → repo
     // nearest: repo/go.work + repo/m/go.mod → repo; without go.work → repo/m
     // nested list [x, y] with y nearer → y's folder; marker only above workspace → undefined; none → undefined
   });
   ```

   - Run both suites and confirm failure.

2. **GREEN:** `sync.ts`, `roots.ts`

   **Preview:**

   ```ts
   export function lineChange(prev: TextBuffer, next: TextBuffer): LineChange | undefined {
     // skip equal lines from the start and the end; range over prev's middle; text = next's middle
   }
   export function findRoot(dir, markers, search, workspaceRoot, exists): string | undefined {
     // walk dir → workspaceRoot only; nearest: per priority level, first ancestor with a match; topmost: highest match
   }
   ```

   - `exists` is injected; no filesystem access in these modules.

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```ts
   // allowed: naming; not allowed: reading the filesystem in roots.ts
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(workspace): add incremental sync and project root search

   Task: P2-G1-T2 — Incremental sync and project roots
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V27, V28` — `bun test src/workspace/lsp/sync.test.ts src/workspace/lsp/roots.test.ts` → pass

##### P2-G1-T3 — Fake language server and test support

- **Outcome:** `test/fixtures/fake-lsp.ts` speaks LSP over stdio from a JSON script, logs every received message and its argv, and supports every scripted mode the suites need; `test/support/lsp.ts` builds configs and reads logs.
- **System Design:** `REQ15@R1; DES17; S32`
- **UI Design:** `None`
- **Canonical Shapes:** system design §4 `test/fixtures/fake-lsp.ts`, `test/support/lsp.ts`; §9 DES17
- **Files:** `test/fixtures/fake-lsp.ts`, `test/support/lsp.ts` (`fakeServerConfig`, `fakeTsc`, `readServerLog`, `waitForMessage`)
- **Execution Approach:** `Direct verification — test infrastructure with no design case of its own; it is proven by every integration and e2e case that drives it`

**Steps:**

1. `test/fixtures/fake-lsp.ts`, `test/support/lsp.ts`

   **Preview:**

   ```ts
   // fake-lsp.ts — run as `bun test/fixtures/fake-lsp.ts <script.json> <log.jsonl> <unique-tag>`
   // vscode-jsonrpc/node over process.stdin/stdout; append {method, params, id} of every message to the log
   // script fields: capabilities, diagnostics (push), pull {resultId, items}, progress, messages, crash {afterInitialize},
   //   exitBeforeInitialize {stderr}, ignoreShutdown, completion {requiresSnippets, command}, resolveActionFails,
   //   contentModified, configurationRequest {sections}, registerWatchers {globs}, refresh, applyEdit
   // support/lsp.ts
   export function fakeServerConfig(o: { name: string; fileTypes: string[]; script: object; log: string; rootMarkers?: unknown[] }): string; // [lsp] TOML
   export function fakeTsc(root: string, version: string, script: object, log: string): string; // node_modules/.bin/tsc stub
   export function readServerLog(log: string): { method?: string; params?: unknown; id?: unknown }[];
   export function waitForMessage(log: string, method: string, ms?: number): Promise<void>;
   ```

   - Importing `vscode-jsonrpc` from `test/` is allowed; the boundary test scans `src/**` only.
   - The fake never outlives its stdin: it exits when the pipe closes.

2. **VERIFY — `S32`:**

   **Preview:**

   ```text
   bun run check && pgrep -f fake-lsp
   └── Expect: check passes; pgrep prints nothing
   ```

   - Run `bun run check`; confirm knip and biome accept the new test files.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(lsp): add a scripted fake language server

   Task: P2-G1-T3 — Fake language server and test support
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `S32` — `bun run check` → pass; `pgrep -f fake-lsp` → empty

##### P2-G1-T4 — Client, host attach, and runner routing

- **Outcome:** `createLspClient` runs the LSP lifecycle over stdio; `createLspHost` reconciles clients with config and open code buffers (roots, binaries, gates, keys, `unavailable`), routes runner effects, and stops within its bound; `startApp` runs the real host with config text.
- **System Design:** `REQ1@R2, REQ2@R2, REQ3@R2, REQ12@R2; DES2, DES3, DES20; S1, S2, S4, S22, S25, S33, S34, S35; V2, V30, V31, V34, V51, V52, V53`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `client.ts` (`ClientEvents`, `LspClient`, `createLspClient`, `sectionValue`), §7 `language-id.ts`, §7 `src/app/lsp-host.ts` (`LspHost`, `createLspHost`, `resolveBinary`, `probeMajor`, constants), §7 `effects.ts` (`RunnerDeps.lsp`, `run`), §5 Startup and attach, Config reload, Shutdown
- **Files:** `src/workspace/lsp/client.ts`, `src/workspace/lsp/language-id.ts`, `src/app/lsp-host.ts`, `src/app/effects.ts` (`RunnerDeps.lsp?`, `run` routes to `d.lsp?.run(e)`, keeping the no-host answer), `test/integration/helpers.ts` (`startApp` `lsp?: { config: string; now?: () => number }` and a written config path), `test/integration/lsp-host.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V2, V30, V31, V34, V51, V52, V53`:** `test/integration/lsp-host.test.ts` — cases per design §8 `integration/lsp-host.test.ts`; `afterEach` stops the app and kills any logged pid.

   **Preview:**

   ```ts
   afterEach(async () => { await app?.stop(); /* kill every pid the fake logged; assert none alive */ });

   test("servers start only when enabled and stop when disabled again", async () => {
     // enabled false → open foo.rs → spawn count 0; :ConfigReload with enabled true → log initialize, didOpen; reload false → process gone
   });
   test("one process serves a Cargo workspace and marker-less files share one without a folder", async () => { /* rootUri values as listed */ });
   test("a second server on the same file type also attaches and both diagnostics show", async () => { /* both logs didOpen; shown length = sum */ });
   test("a project's own tsc is used and picks the TypeScript server by version", async () => { /* 7.0.0 → tsc from node_modules/.bin; 5.9.0 → typescript */ });
   test("settings reach servers by configuration requests and initialization options", async () => { /* [{x:1}, null]; didChangeConfiguration after initialized; rust-analyzer initOptions */ });
   test("a server that exits before initializing is unavailable without a toast or restart", async () => { /* reason = stderr line; toasts 0; spawn count stays 1 */ });
   test("stopping kills a server that ignores shutdown within the bound", async () => { /* ≤ 700 ms; pid gone; exit logged before kill */ });
   ```

   - Run `bun test test/integration/lsp-host.test.ts` and confirm failure.

2. **GREEN:** `client.ts`, `language-id.ts`, `lsp-host.ts`, `effects.ts`, `helpers.ts`

   **Preview:**

   ```ts
   // effects.ts
   export type RunnerDeps = { /* existing */ lsp?: Pick<LspHost, "run" | "notify"> };
   case "lsp": case "lspCancel": case "lspReply": case "lspRestart":
     if (d.lsp !== undefined) { d.lsp.run(e); return; }
     // keep the no-host answer from P1-G2-T1 for "lsp"; ignore the rest

   // lsp-host.ts — reconcile and attach from design §7 / §5 Startup and attach
   // observe: identity checks on config.lsp, buffers, text; dispatches from observe go through queueMicrotask
   // attach: findRoot → key → resolveBinary → gate? probeMajor (cached per root) → gateAllows → connect or record view
   // stop: Promise.allSettled(clients.map(c => c.stop(LSP_STOP_BOUND_MS))); kill running probes
   ```

   - `createLspClient` spawns `binary` with `spec.command.slice(1)`, no shell, stderr capped at 200 lines, first stderr line kept as the rejection reason; `initialize` carries `processId`, `rootUri`/one folder or `null`/none, `initOptions`; one `didChangeConfiguration` after `initialized`.
   - Document sync in this task is `didOpen` only; debounced `didChange`, `didSave`, `didClose`, and pulls land in P2-G1-T5.
   - `startApp` writes `opts.lsp.config` to a temp config path and passes the host as `deps.lsp`, subscribing `observe` after `createStore`, like `main`.

3. **REFACTOR:** Split host internals into private functions (`reconcile`, `attach`) inside `lsp-host.ts`.

   **Preview:**

   ```ts
   // allowed: private functions; not allowed: feature decisions (staleness, which result to show) in the host
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(app): start and stop language servers per project root

   Task: P2-G1-T4 — Client, host attach, and runner routing
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V2, V30, V31, V34, V51, V52, V53` — `bun test test/integration/lsp-host.test.ts` → pass
- Process hygiene — `pgrep -f fake-lsp` → empty
- `V46` — `bun run check` → pass

##### P2-G1-T5 — Document sync and pull diagnostics

- **Outcome:** Edits reach servers as one trailing 150 ms `didChange`, flushed before requests; `didSave`/`didClose` follow state; pull servers are pulled after each `didOpen` and sent `didChange` and on refresh; closing a file clears only its pulled slot.
- **System Design:** `REQ6@R2, REQ7@R2, REQ12@R2, REQ14@R2; DES4, DES19; S23, S30, S36; V41, V54, V55, V56`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `lsp-host.ts` (sync, `flush`, `pull`), §7 `client.ts` (`pullDiagnostics`, `PullResult`), §5 Document sync, Diagnostics
- **Files:** `src/app/lsp-host.ts`, `src/workspace/lsp/client.ts` (`didChange`, `didSave`, `didClose`, `pullDiagnostics`, `refreshDiagnostics` event), `test/integration/lsp-host.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V41, V54, V55, V56`:** `test/integration/lsp-host.test.ts`

   **Preview:**

   ```ts
   test("keys typed within the debounce produce one change sent before the next request", async () => {
     // 10 keys within 150 ms then K → log order [didChange(version n+10), textDocument/hover]; didChange count 1
   });
   test("a pull server is pulled after opening and after each sent change", async () => { /* order; shown holds pulled items; previousResultId echoed */ });
   test("a refresh pulls every open document again", async () => { /* one more textDocument/diagnostic per open file */ });
   test("pushed and pulled lists are both kept and closing clears only the pulled one", async () => { /* {push:[…]} after close */ });
   ```

   - Run the suite and confirm the new cases fail.

2. **GREEN:** `lsp-host.ts`, `client.ts`

   **Preview:**

   ```ts
   // per (key, path): Doc { sent: TextBuffer; pending?: TextBuffer; timer?: Timer }
   // observe: text changed → pending = text; restart SYNC_DEBOUNCE_MS timer
   // flush(path): change = lineChange(sent, pending) → client.didChange(path, version, change) → sent = pending → pull?(path)
   // run lsp: flush(path) before client.request
   // savedVersion advanced → didSave; buffer gone or file type changed → didClose + dispatch lspDiagnostics{source:"pull", items:[]}
   ```

   - At most one pull per path in flight; a pull error logs `lsp.pullFailed` once per (key, path) and changes nothing.

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```ts
   // allowed: naming; not allowed: reducer changes for sync
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(app): sync documents and pull diagnostics

   Task: P2-G1-T5 — Document sync and pull diagnostics
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V41, V54, V55, V56` — `bun test test/integration/lsp-host.test.ts` → pass
- Process hygiene — `pgrep -f fake-lsp` → empty

##### P2-G1-T6 — Crash window, progress, and messages

- **Outcome:** A crash after `initialize` restarts the server and reopens documents until the fifth crash within 180 s, which marks it `failed` with one toast; progress dispatches are throttled to one per 100 ms per server; info and log messages go to the debug log only.
- **System Design:** `REQ3@R2, REQ12@R2; DES3, DES15; S5, S6, S24; V7, V29, V61`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `lsp-host.ts` (crash history, `CRASH_LIMIT`, `CRASH_WINDOW_MS`, progress throttle), §5 Crash and restart, Server messages and progress
- **Files:** `src/app/lsp-host.ts`, `src/workspace/lsp/client.ts` (`exited`, `progress`, `message` events), `test/integration/lsp-host.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V7, V29, V61`:** `test/integration/lsp-host.test.ts` (injected `now`)

   **Preview:**

   ```ts
   test("a crashing server restarts until the fifth crash within three minutes", async () => {
     // five initialize, each followed by didOpen; state "failed"; toasts 1; log "lsp.crashed" with reason and no note text
   });
   test("crashes spread over more than three minutes keep restarting", async () => { /* now advanced 50 s per crash → never failed */ });
   test("progress is throttled and info messages do not toast", async () => { /* 50 reports in 200 ms → ≤ 3 lspServer; toasts 0; "lsp.message" logged */ });
   ```

   - Run the suite and confirm failure.

2. **GREEN:** `lsp-host.ts`, `client.ts`

   **Preview:**

   ```ts
   // exited(reason): crashes = [...crashes.filter(t => now() - t < CRASH_WINDOW_MS), now()]
   //   length < CRASH_LIMIT → dispatch lspServer{starting}; answer in-flight with lspResult{error:"server restarted"}; relaunch; reopen docs
   //   else → dispatch lspServer{failed, reason}
   // progress: keep latest per key; dispatch at most every 100 ms
   // message: error|warning → dispatch lspMessage; info|log → logger.info("lsp.message", {key, level})
   ```

   - `lspRestart` clears crash history and unavailable marks for its keys, then attaches again.

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```ts
   // allowed: naming; not allowed: retrying unavailable servers automatically
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(app): restart crashed servers and throttle progress

   Task: P2-G1-T6 — Crash window, progress, and messages
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V7, V29, V61` — `bun test test/integration/lsp-host.test.ts` → pass
- Process hygiene — `pgrep -f fake-lsp` → empty

##### P2-G1-T7 — Watched files and edit writes

- **Outcome:** Watcher events and every closed file the runner writes for `applyEdits` reach clients that registered matching globs as one debounced `didChangeWatchedFiles`; a rename over open and closed files writes the closed file atomically and changes the open buffer.
- **System Design:** `REQ4@R1, REQ10@R2; DES12, DES16; S7, S17, S40; V32, V48, V63`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `client.ts` (`watched`, `registerCapability`), §7 `effects.ts` (`applyEdits` case), §5 Watched files, Workspace edit
- **Files:** `src/workspace/lsp/client.ts` (`watched`, registered globs via `Bun.Glob`), `src/app/lsp-host.ts` (`notify`), `src/app/effects.ts` (`applyEdits` case calls `d.lsp?.notify`), `test/integration/lsp-host.test.ts`, `test/integration/lsp-edits.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V32, V48, V63`:**

   **Preview:**

   ```ts
   // lsp-host.test.ts
   test("a watched file change reaches a server only when it matches a registered glob", async () => { /* one didChangeWatchedFiles; none for non-matching */ });
   // lsp-edits.test.ts
   test("a rename over an open and a closed file writes the closed file and edits the buffer", async () => { /* disk b.ts updated; a.ts dirty; toast "2 files changed" */ });
   test("a closed file written by a rename is reported to watching servers", async () => { /* didChangeWatchedFiles {uri: b.ts, type: Changed} */ });
   ```

   - Run both suites and confirm failure.

2. **GREEN:** `client.ts`, `lsp-host.ts`, `effects.ts`

   **Preview:**

   ```ts
   // effects.ts applyEdits case — next to the existing index report (effects.ts:282)
   d.index?.notify(event);
   d.lsp?.notify(event);
   // client.watched(events): match each path relative to root against registered globs; debounce 100 ms per client
   ```

   - Every file the runner writes for `applyEdits` is reported to both the index and the host.

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```ts
   // allowed: naming; not allowed: new file-system watches
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(app): forward watched files and edit writes to servers

   Task: P2-G1-T7 — Watched files and edit writes
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V32, V48, V63` — `bun test test/integration/lsp-host.test.ts test/integration/lsp-edits.test.ts` → pass
- Process hygiene — `pgrep -f fake-lsp` → empty

##### P2-G1-T8 — Lifecycle, main wiring, and the real-server check

- **Outcome:** `main` registers LSP commands, bindings, groups, and picker sources, constructs the host, subscribes it, forwards watcher events, and passes a bounded `stopLsp` to `installLifecycle`; a local-only test drives a real rust-analyzer when installed.
- **System Design:** `REQ1@R2, REQ12@R2, REQ15@R1; DES3, DES14, DES16, DES17; S25, S32; V44, V46`
- **UI Design:** `None`
- **Canonical Shapes:** system design §7 `effects.ts`/`lifecycle.ts`/`main.ts`, §5 Construction and Wiring Flow, Shutdown
- **Files:** `src/app/lifecycle.ts` (`stopLsp?`, raced with `LSP_STOP_BOUND_MS + 100`), `src/app/main.ts` (`registries`, host construction, `deps.lsp`, `store.subscribe(lspHost.observe)`, watcher `lspHost.notify`, `stopLsp`), `test/integration/lsp-real.test.ts`
- **Execution Approach:** `Direct verification — composition-root wiring is exercised end to end by the PTY suite in P3-G1-T5 (V6, V12, V17, V43); here the fast gate, the CI suites, and the local real-server case prove it`

**Steps:**

1. `src/app/lifecycle.ts`, `src/app/main.ts`, `test/integration/lsp-real.test.ts`

   **Preview:**

   ```ts
   // main.ts — design §5 Construction and Wiring Flow
   const lspHost = createLspHost({ root: ws.root, dispatch: (a) => store.dispatch(a), logger, which: Bun.which });
   // runner deps: lsp: lspHost; store.subscribe(lspHost.observe) right after createStore
   watchWorkspace(ws.root, ownOps, matcher, (event) => {
     store.dispatch({ type: "fileChanged", event });
     indexHost.notify(event);
     lspHost.notify(event);
   });
   // installLifecycle({ …, stopLsp: lspHost.stop }) — awaited after the preview stop

   // lsp-real.test.ts
   test.skipIf(!Bun.which("rust-analyzer"))("a real rust-analyzer becomes ready and answers hover", async () => {
     // temp Cargo project; open src/main.rs; servers[key].state "ready"; hover float lines non-empty; stop app in afterEach
   });
   ```

   - `registries()` adds `lspCommands`, `lspBindings`, `lspGroups` exactly as `testRegistries` already does.

2. **VERIFY — `V44, V46`:**

   **Preview:**

   ```text
   bun run check && bun run test:ci && bun test test/integration/lsp-real.test.ts && pgrep -f fake-lsp
   └── Expect: all pass (lsp-real skipped when rust-analyzer is absent, run when present); pgrep prints nothing
   ```

   - Also start `bun bin/so <temp workspace>` once with no `[lsp]` section, confirm the first frame and a clean quit, then confirm no child process remains.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(app): wire the language server host into startup and shutdown

   Task: P2-G1-T8 — Lifecycle, main wiring, and the real-server check
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V44` — `bun test test/integration/lsp-real.test.ts` → pass or skipped without rust-analyzer
- `V46` — `bun run check` → pass

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Fast gate | `bun run check` | Pass with zero knip findings; boundary test rejects protocol imports outside `src/workspace/lsp/` |
| CI suites | `bun run test:ci` | Pass without any language server installed |
| Process hygiene | `pgrep -f fake-lsp` after the suites | No processes |
| Work-process ids | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]" src test` | No matches in changed files |

#### Review and Verification Focus

- **Specification:** opt-in and reload behaviour, key naming (`name@<root>`, `name@`), local binary and gate selection, settings delivery, `unavailable` vs crash, 150 ms debounce and flush-before-request, pull timing and slots, crash window, progress throttle, glob filtering, bounded stop.
- **Technical:** no store re-entry from `observe` (`queueMicrotask`), argv-only spawn, stderr cap, no note text in logs, every child (servers and probes) gone after `stop()`, deterministic integration setup and cleanup.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ4@R1, REQ12@R2, REQ15@R1 → DES1 → S7, S32 → V46` | `None` | `P2-G1` | `P2-G1-T1, P2-G1-T8` |
| `REQ9@R2, REQ10@R2, REQ14@R2 → DES10, DES12, DES18, DES19 → S16, S19, S37, S39 → V33, V45, V57, V64` | `None` | `P2-G1` | `P2-G1-T1` |
| `REQ12@R2 → DES4, DES20 → S22, S23 → V27, V28` | `None` | `P2-G1` | `P2-G1-T2` |
| `REQ15@R1 → DES17 → S32` (fake server) | `None` | `P2-G1` | `P2-G1-T3` |
| `REQ1@R2 → DES2, DES3 → S1, S2 → V2` | `None` | `P2-G1` | `P2-G1-T4` |
| `REQ2@R2, REQ12@R2 → DES3, DES20 → S4, S22 → V30, V31` | `None` | `P2-G1` | `P2-G1-T4` |
| `REQ1@R2, REQ2@R2 → DES2, DES3 → S33, S34 → V51, V52` | `None` | `P2-G1` | `P2-G1-T4` |
| `REQ3@R2, REQ12@R2 → DES3, DES15 → S35 → V53` | `None` | `P2-G1` | `P2-G1-T4` |
| `REQ12@R2 → DES3 → S25 → V34` | `None` | `P2-G1` | `P2-G1-T4, P2-G1-T8` |
| `REQ14@R2 → DES4 → S30 → V41` | `None` | `P2-G1` | `P2-G1-T5` |
| `REQ6@R2, REQ7@R2, REQ14@R2 → DES19 → S36 → V54, V55, V56` | `None` | `P2-G1` | `P2-G1-T5` |
| `REQ12@R2 → DES3 → S24 → V29, V61` | `None` | `P2-G1` | `P2-G1-T6` |
| `REQ3@R2 → DES15 → S5, S6 → V7` | `None` | `P2-G1` | `P2-G1-T6` |
| `REQ4@R1, REQ10@R2 → DES12, DES16 → S7, S17, S40 → V32, V48, V63` | `None` | `P2-G1` | `P2-G1-T7` |
| `REQ15@R1 → DES17 → S7, S32 → V44` | `None` | `P2-G1` | `P2-G1-T8` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.

Outputs consumed by Part 3: `createLspHost` wired in `main`; `test/fixtures/fake-lsp.ts` and `test/support/lsp.ts` (`fakeServerConfig`, `readServerLog`, `waitForMessage`); `startApp` LSP option.

## Planning Gaps

None
