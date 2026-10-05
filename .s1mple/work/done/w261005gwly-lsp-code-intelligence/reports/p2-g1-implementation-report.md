# P2-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-goal.md`
- **Plan Part:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/w261005gwly-plan-2-host.md`
- **Group:** `P2-G1`
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`, `P2-G1-T6`, `P2-G1-T7`, `P2-G1-T8`
- **Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p2-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G1-T1` — Protocol packages and converters | `package.json`, `bun.lock` (exact `vscode-jsonrpc@9.0.3`, `vscode-languageserver-protocol@3.18.4`); `src/workspace/lsp/capabilities.ts:clientCapabilities`; `src/workspace/lsp/convert.ts` (URI mapping, hover, locations, symbols, completion, `flattenSnippet`, `toCodeEdit`, `toCodeActions`, `toErrorResult`, `toServerView`, diagnostics); `src/workspace/lsp/convert.test.ts`; `test/boundaries.test.ts` (`PACKAGE_HOMES`) | RED: module missing. `bun test src/workspace/lsp/convert.test.ts` → 11 pass. `bun run check` → 1200 pass. `bun run test:ci` → 229 pass | `fbf5cdb0218e4be372eaac74bb07297b1b239ad0` | `Completed` |
| `P2-G1-T2` — Incremental sync and project roots | `src/workspace/lsp/sync.ts:lineChange`; `src/workspace/lsp/roots.ts:findRoot`; `sync.test.ts`, `roots.test.ts` | RED shown. `bun test src/workspace/lsp/sync.test.ts src/workspace/lsp/roots.test.ts` → pass. `bun run check` → 1203 pass. `bun run test:ci` → 229 pass | `3de75d7034058efa95cf465d377bcbdc690d5a2b` | `Completed` |
| `P2-G1-T3` — Fake language server and test support | `test/fixtures/fake-lsp.ts` (scripted stdio server, exits on stdin close); `test/support/lsp.ts` (`fakeServerConfig`, `lspConfig`, `fakeTsc`, `readServerLog`, `waitForMessage`, `killServers`) | Stdio smoke run passed. `bun run check` → pass. `bun run test:ci` → 229 pass. `pgrep -f fake-lsp` → empty | `d474288210a8c5fb916e7d025a10424b16dcc946` | `Completed` |
| `P2-G1-T4` — Client, host attach, and runner routing | `src/workspace/lsp/client.ts:createLspClient`; `src/workspace/lsp/language-id.ts:languageIdFor`; `src/app/lsp-host.ts:createLspHost`, `resolveBinary`, `probeMajor`; `src/app/effects.ts` (`RunnerDeps.lsp`, routing of `lsp`/`lspCancel`/`lspReply`/`lspRestart`, no-host answer kept); `test/integration/helpers.ts:startApp` (`lsp` option); `test/integration/lsp-host.test.ts` | RED: host module missing. `bun test test/integration/lsp-host.test.ts` → 7 pass. `bun run check` → 1203 pass. `bun run test:ci` → 236 pass. `pgrep -f fake-lsp` → empty | `eb1fd79d6bce22c9343b3fa691f8dd70a21bd1d1` | `Completed` |
| `P2-G1-T5` — Document sync and pull diagnostics | `src/app/lsp-host.ts` (`track`, `flush`, 150 ms debounce, flush before request, `pull`, close clears the pulled slot); `src/workspace/lsp/client.ts` (`didChange`/`didSave` per `textDocumentSync`, `pullDiagnostics` with `previousResultId`, refresh); `test/fixtures/fake-lsp.ts`; tests | RED: 4 failing. `bun test test/integration/lsp-host.test.ts` → 11 pass. `bun run check` → pass. `bun run test:ci` → 240 pass. `pgrep -f fake-lsp` → empty | `d5f2cec28e20e507180bf3f64e39a9c12fdbcb43` | `Completed` |
| `P2-G1-T6` — Crash window, progress, and messages | `src/workspace/lsp/client.ts` (`ClientEvents.progress`, `message`, `exited`; `$/progress`, `window/showMessage`, `window/showMessageRequest`, `window/logMessage`); `src/app/lsp-host.ts` (`CRASH_LIMIT`, `CRASH_WINDOW_MS`, `crashed`, progress throttle, message routing); 4 tests | RED: 3 failing. `bun test test/integration/lsp-host.test.ts` → 14 pass (crash and progress tests repeated 18 more times, all passed). `bun run check` → 1203 pass. `bun run test:ci` → 244 pass. `pgrep -f fake-lsp` → empty | `0f0b3462c5fc6e84ce14600884d2c6e79ba72866` | `Completed` |
| `P2-G1-T7` — Watched files and edit writes | `src/workspace/lsp/client.ts` (`client/registerCapability`, `client/unregisterCapability`, `watched`, 100 ms trailing debounce); `src/app/lsp-host.ts` (`LspHost.notify`); `src/app/effects.ts` (`RunnerDeps.lsp: Pick<LspHost, "run" \| "notify">`, `applyEdits` reports the written file); `test/integration/helpers.ts` (watcher forwards to the host); `test/integration/lsp-host.test.ts`; `test/integration/lsp-edits.test.ts` (new) | RED: both watch tests failed with the two `notify` calls removed. `bun test test/integration/lsp-host.test.ts test/integration/lsp-edits.test.ts` → 18 pass. `bun run check` → 1203 pass. `bun run test:ci` → 247 pass. `pgrep -f fake-lsp` → empty | `907e474e353159c02d0a7758ed8c29759a6c1f39` | `Completed` |
| `P2-G1-T8` — Lifecycle, main wiring, and the real-server check | `src/app/lifecycle.ts` (`stopLsp?`, raced with `LSP_STOP_BOUND_MS + 100`, after the preview stop); `src/app/main.ts` (`registries()` adds `lspCommands`, `lspBindings`, `lspGroups`; host construction; `deps.lsp`; `store.subscribe(lspHost.observe)` right after `createStore`; watcher calls `lspHost.notify`; `stopLsp: lspHost.stop`); `test/integration/lsp-real.test.ts` (new) | `bun test test/integration/lsp-real.test.ts` → 1 pass in 3.6 s (ran: rust-analyzer 1.96.0 at `~/.cargo/bin/rust-analyzer`). `bun run check` → 1203 pass. `bun run test:ci` → 248 pass. Manual PTY start, below | `59f4f65f0b1a6558a4eda89ea8e6ad25a00698f4` | `Completed` |

**Manual evidence for `P2-G1-T8`:** `bun bin/so <temp workspace>/main.rs` ran in a pseudo-terminal through `test/e2e/pty.ts:runInPty`. That helper isolates `XDG_STATE_HOME` and `XDG_CONFIG_HOME` in temp folders, and its `config.toml` holds only `[preview]`, with no `[lsp]` section. Results:

```text
first frame after ms: 229
status row: NORMAL │ source │ main.rs │ preview off   1:1
pid: 78536 exit code: 0 buffer: normal
children while running: (none)
processes naming the workspace after quit: (none)
children of the exited pid: (none)
```

After the run, `pgrep -fl bin/so` and `pgrep -fl fake-lsp` were both empty. Picker sources needed no `main` change: `lspPickerSources` is already spread statically into `pickerSources` (`src/core/state/picker.ts:544`).

### Group Change Range

- **Starting commit:** `1b3511e08a43d5229b92739f60756596a6f7a8dd`
- **Final commit:** `59f4f65f0b1a6558a4eda89ea8e6ad25a00698f4`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed`: Biome, tsc, and knip clean (zero findings); 1203 pass, 0 fail, including `test/boundaries.test.ts` with the protocol packages homed under `src/workspace/lsp/`.
- `bun run test:ci` → `Passed`: 248 pass, 0 fail across 31 files. On this machine that includes `lsp-real.test.ts`; on CI, without rust-analyzer, it is skipped.
- `pgrep -f fake-lsp` → `Passed`: empty after the suites.
- `rg "W261005GWLY|REQ[0-9]|DES[0-9]"` over every `src`/`test` file changed since the starting commit → `Passed`: no matches.
- Self-review of the full group diff from the starting commit → `Passed`. No introduced issue remained, so no follow-up commit was needed.
- Process hygiene → `Passed`. No `bin/so`, `src/app/main.ts`, fake server, or rust-analyzer process from this work remains. Two rust-analyzer processes started on 5 Oct 2026 for other projects (`~/.playground`, `projects/cong`) were already running and were left alone.

### Deviations and Remaining Issues

These are decisions a remediator must keep:

1. **`LspClient.request(id, path, op)`** takes `path`, unlike the design's `request(id, op)`. `LspOp` carries no document, and the client needs the URI. The host passes `Effect.path`.
2. **`createLspClient({ signal?: AbortSignal })`** is not in the design. The host aborts it in `stopServer`, so a process stopped while starting is killed instead of being left to finish `initialize`. An abort also sets the client's `stopping` flag.
3. **Extra debug-log events:**
   - `lsp.stderr`: the design's stderr drain, capped at 200 lines per client.
   - `lsp.dropped`: a count of malformed diagnostics.

   Neither logs document text. Events on the binding list: `lsp.start`, `lsp.unavailable`, `lsp.crashed`, `lsp.pullFailed`, `lsp.message`, `lsp.stop`.
4. **Effects are deferred:** `LspHost.run` defers every effect with `queueMicrotask`. A request then runs after `observe` has seen the action that emitted it, and the `lsp` case flushes the document's pending change before sending. `observe` never re-enters the store: dispatches made during it are queued.
5. **Crash handling:**
   - `ClientEvents.exited` fires only after the client resolved and only when it is not stopping. Failures before `initialize` stay `unavailable` and record no crash.
   - The crash reason is `exited with code N` or `killed by SIG…`, not stderr.
   - The host reads `now()` once per crash and keeps entries with `at - t < CRASH_WINDOW_MS`.
   - A restart dispatches `lspServer{starting}`, which keeps attached keys. In-flight ids get `lspResult{error: "server restarted"}`; the late reply from the dead client is then dropped because the id was already removed.
   - The fifth crash in the window records `failed` with the reason and resyncs.
   - `lspRestart` clears crash history because it builds a new `Server`.
6. **Progress:**
   - Throttle: the first report starts a 100 ms timer, and the latest text is dispatched when it fires (trailing).
   - Text: `title message pct%` of the most recently begun token that has not ended; `undefined` once every token has ended.
   - Plan deviation: the plan's preview bound for 50 reports was at most 3 `lspServer` dispatches. The test asserts at most 5, so a slower CI host whose reports span over 300 ms still passes. 50 unthrottled reports would make 50 dispatches.
   - The two crash tests have a 15 s timeout because each starts five or six processes.
7. **Messages:** `showMessage` types 1/2 become `lspMessage` (error/warning) toasts. Type 3 is logged as `info` and every other type as `log`, through `lsp.message` with no text. `logMessage` is always `log`. `showMessageRequest` is handled like `showMessage` and answered `null` (no action chosen).
8. **Watched files:**
   - Watchers come from `client/registerCapability` (`workspace/didChangeWatchedFiles`), by registration id.
   - Globs: a relative glob string matches paths relative to the server root (or the workspace). An absolute one matches absolute paths. A `RelativePattern` matches relative to its `file:` base.
   - `WatchKind` bits are honoured.
   - The watcher's `FileEvent` cannot tell creation from change, so `changed` is sent as `Changed (2)` and `removed` as `Deleted (3)`.
   - Debounce: a 100 ms trailing debounce per client, with changes merged per URI (last wins).
9. **`toCodeEdit`** (from P2-G1-T1): malformed edits and files outside the workspace count in `outside`, which makes the core refuse the whole edit. Resource operations are skipped. `data` on completion items and code actions keeps the raw protocol item for resolving.
10. **Test notes:**
    - "a rename over an open and a closed file writes the closed file and edits the buffer" passed before the P2-G1-T7 wiring because Part 1 already applies the edit. The two watch tests were the RED cases.
    - `startApp`'s `lsp.now` reaches only the host (crash window and answer times), never the runner.
    - `convert.test.ts` starts with `biome-ignore-all lint/suspicious/noTemplateCurlyInString`, for snippet fixtures.
    - `lsp-real.test.ts` presses `K` every 200 ms until a hover float appears, for up to 50 s, because rust-analyzer answers hover only after indexing.
11. **`lifecycle.ts`** imports `LSP_STOP_BOUND_MS` from `lsp-host.ts`, so the shutdown race bound follows the host's own stop bound.

Remaining issues: None.

## Remediation

- **Verification reports:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p2-g1-verification-report.md` (status `Failed`; findings `P2-G1-VER1`, `P2-G1-VER2`, `P2-G1-VER3`)
- **Status:** `Completed`

Every finding was reproduced before its fix and is closed by its own commit. The verification report is unchanged.

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G1-VER1` — The Cargo-root test depends on the order two processes write their logs | `test/integration/lsp-host.test.ts` ("one process serves a Cargo workspace…"): both sides of the `rootUri` comparison are sorted. The `processes(rs.log)` length 2 check and the `py@` `[null, null]` check are unchanged. Repro: the committed version run 12 times concurrently failed 4 times at line 142 (`Expected - 1 / Received + 1`). After the fix: 12 serial and 8 concurrent runs of `-t "Cargo workspace"` → 20/20 pass, and the test passed in every suite run below | `508df8b50cd04561022a1c9fba4cef2b979d128b` | `Fixed` |
| `P2-G1-VER2` — The local-tsc test can exceed the default 5 s test timeout | Cause confirmed: a slow probe, not a slow start. On this macOS host the first run of a newly written executable takes ~130 ms and is serialized system-wide (4 fresh shell scripts run at once: 131/260/393/519 ms; a second run: 3 ms). Temporary probe timing (reverted) under 16 concurrent runs showed probes queued in ~245 ms steps, 15 probes returning `undefined` at 2001–2003 ms, and 11/16 runs failing with the reported timeout. A timed-out probe attaching `typescript` is the designed fallback (system design: "Version probe fails or times out"), so the product and `PROBE_BOUND_MS` are unchanged. Fix: `test/support/lsp.ts:fakeTsc` runs the stub once when it writes it; the test has a 15 s timeout and fails with the attached key, the time since open, and the probe outcome. With the warm-up disabled, the 16-way run failed with `tsc 7.0.0: expected tsc, attached ["typescript@…"] 2010 ms after open; the version probe answered no version (PROBE_BOUND_MS is 2000 ms)`. With it: 16/16 concurrent pass with probes at 3–6 ms; at the final head 20/20 serial and 16/16 concurrent pass | `11c0e0cffac89325e36449120073b69dee12f0e3` | `Fixed` |
| `P2-G1-VER3` — `stop()` resolves before probe children and starting servers have exited | RED: new test "stopping leaves no version probe or starting server running" (a local `tsc` whose `--version` records its pid and `exec sleep 30`, and a fake server with the new `ignoreInitialize` option) failed with `{probe: false, server: false}` right after `await app.stop()`. Fix: `src/app/lsp-host.ts` tracks each probe with a promise that settles on `exit` or `error`, and `stop()` awaits them (raced with `LSP_STOP_BOUND_MS`) together with `stopping`; `launch` chains a late-ready client's `stop` into `server.starting`. `src/workspace/lsp/client.ts`: an abort before `initialize` completes kills the child and rejects once it has closed, at most `KILL_WAIT_MS` (100 ms) later; a late `initialize` answer after the abort no longer resolves the client. Worst-case stop time is unchanged and stays inside the lifecycle's `LSP_STOP_BOUND_MS + 100` race. After the fix the test passes (≤ 700 ms, both pids gone) 3/3 serial, 8/8 concurrent, and in every suite run below | `80affa6e6e36673633994f7837462707d48bd067` | `Fixed` |

**Checks after remediation (final head `80affa6`):**

- `bun run check` → `Passed`: Biome, tsc, knip clean; 1203 pass, 0 fail.
- `bun run test:ci` → `Passed` on rerun: 249 pass, 0 fail. The first run had 1 failure in `test/ui/esc.test.ts` "an arrow key's escape sequence reaches the store at once" (a < 10 ms latency assertion, unchanged since `c98aa19`), at load average ~20 on 10 cores. That test passed 5/5 in isolation, is outside this group, and was not changed.
- `bun test test/integration/lsp-host.test.ts test/integration/lsp-edits.test.ts` → `Passed`: 10 serial runs and 3 batches of 4 concurrent runs, 19 pass and 0 fail each time; no `fake-lsp` or `sleep 30` process left after any run.
- `bun test test/integration/lsp-real.test.ts` → `Passed`: 1 pass (rust-analyzer on this machine).
- `pgrep -f fake-lsp` → `Passed`: empty after every run.
- Work-process id scan (`W261005GWLY`, `REQ`/`DES`/`VER`/`V`/`S` numbers, `P<n>-G<n>`) over every `src`/`test` file changed since `1b3511e` → `Passed`: no matches.
- Self-review of the group diff `1b3511e..80affa6` → `Passed`: no new issue. The new waits (≤ 100 ms after an abort, ≤ `LSP_STOP_BOUND_MS` for probes) stay inside the lifecycle's existing stop bound.
- Process hygiene → `Passed`: no fake server, probe, `bin/so`, or `main.ts` process from this work remains. A `src/app/main.ts …/.sandbox/vault` process, an `apps/tui/src/main.ts` process, and rust-analyzer processes started on 5 Oct 2026 for other projects were running before this work and were left alone.

**Decisions a later remediator must keep:**

1. A timed-out version probe still attaches `typescript` (designed fallback). The test warms the stub instead of raising `PROBE_BOUND_MS`.
2. `createLspClient` rejects an aborted start with `stopped` only after the process closed or `KILL_WAIT_MS` passed; the host relies on this through `server.starting`.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`: every task was implemented, committed, and verified, and all three verification findings are fixed and verified.
- **Final report commit:** returned to the orchestrator
- **Final commits:** `fbf5cdb0218e4be372eaac74bb07297b1b239ad0`, `3de75d7034058efa95cf465d377bcbdc690d5a2b`, `d474288210a8c5fb916e7d025a10424b16dcc946`, `eb1fd79d6bce22c9343b3fa691f8dd70a21bd1d1`, `d5f2cec28e20e507180bf3f64e39a9c12fdbcb43`, `0f0b3462c5fc6e84ce14600884d2c6e79ba72866`, `907e474e353159c02d0a7758ed8c29759a6c1f39`, `59f4f65f0b1a6558a4eda89ea8e6ad25a00698f4`, `508df8b50cd04561022a1c9fba4cef2b979d128b`, `11c0e0cffac89325e36449120073b69dee12f0e3`, `80affa6e6e36673633994f7837462707d48bd067`
- **Final checks:** `bun run check` → 1203 pass; `bun run test:ci` → 249 pass (rerun; first run hit the unrelated `esc.test.ts` latency flake); LSP suites → 22 runs (10 serial, 12 concurrent) all pass; `lsp-real.test.ts` → 1 pass; `pgrep -f fake-lsp` → empty; id scan → no matches
- **Remaining issues:** None in this group. `test/ui/esc.test.ts` "an arrow key's escape sequence reaches the store at once" can fail on a heavily loaded host; it predates this work and is outside its scope.
