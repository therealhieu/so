# P2-G1 Verification Report

## Scope

- **Group:** `P2-G1`
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`, `P2-G1-T6`, `P2-G1-T7`, `P2-G1-T8`
- **Report:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p2-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p2-g1-implementation-report.md`

Verified range: `git diff 1b3511e..59f4f65` (22 files, +4065/−6). Every assigned chain is implemented as designed. The group fails because `bun run test:ci` failed in this pass: `test/integration/lsp-host.test.ts` asserts the order of log lines written by two separate fake-server processes, and that order is not deterministic (VER1). A second test timed out once (VER2). `stop()` also resolves a few milliseconds before probe children and still-starting servers are reaped, which breaks a stated design invariant (VER3).

## Status

`Failed`

## Assigned Traceability

- **System Design:** `REQ4@R1, REQ12@R2, REQ15@R1 → DES1 → S7, S32 → V46`; `REQ9@R2, REQ10@R2, REQ14@R2 → DES1, DES10, DES12, DES18, DES19 → S7, S16, S19, S37, S39 → V33, V45, V57, V64`; `REQ12@R2 → DES4, DES20 → S22, S23 → V27, V28`; `REQ15@R1 → DES17 → S32` (fake server); `REQ1@R2 → DES2, DES3 → S1, S2 → V2`; `REQ2@R2, REQ12@R2 → DES3, DES20 → S4, S22 → V30, V31`; `REQ1@R2, REQ2@R2 → DES2, DES3 → S33, S34 → V51, V52`; `REQ3@R2, REQ12@R2 → DES3, DES15 → S35 → V53`; `REQ12@R2 → DES3 → S25 → V34`; `REQ14@R2 → DES4 → S30 → V41`; `REQ6@R2, REQ7@R2, REQ14@R2 → DES19 → S36 → V54, V55, V56`; `REQ12@R2 → DES3 → S24 → V29, V61`; `REQ3@R2 → DES15 → S5, S6 → V7`; `REQ4@R1, REQ10@R2 → DES12, DES16 → S7, S17, S40 → V32, V48, V63`; `REQ15@R1 → DES17 → S7, S32 → V44`
- **UI Design:** None

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ4@R1, REQ12@R2, REQ15@R1 → DES1 → S7, S32 → V46` | None | Protocol packages pinned exactly and importable only from `src/workspace/lsp/` | `package.json` `"vscode-jsonrpc": "9.0.3"`, `"vscode-languageserver-protocol": "3.18.4"`; `test/boundaries.test.ts:57-58` `PACKAGE_HOMES`; `grep -rl vscode- src` → only `src/workspace/lsp/*` (plus a command string in `src/core/config/lsp.ts:133`) | `Satisfied` |
| `REQ9@R2, REQ10@R2, REQ14@R2 → DES1, DES10, DES12, DES18, DES19 → S7, S16, S19, S37, S39 → V33, V45, V57, V64` | None | Converters and client capabilities match design §7 | `src/workspace/lsp/capabilities.ts:clientCapabilities` (snippetSupport by option, `resourceOperations: []`, codeAction `resolveSupport ["edit"]`, `diagnostic.dynamicRegistration false`, `diagnostics.refreshSupport true`, no `failureHandling`/`changeAnnotationSupport`/`willSaveWaitUntil`); `src/workspace/lsp/convert.ts` (`flattenSnippet`, `toErrorResult`, `toHover`, `toCodeEdit`, `toServerView`) | `Satisfied` |
| `REQ12@R2 → DES4, DES20 → S22, S23 → V27, V28` | None | Ordered-marker roots inside the workspace; `lineChange` rebuilds text exactly | `src/workspace/lsp/roots.ts:findRoot` (injected `exists`, no fs); `src/workspace/lsp/sync.ts:lineChange` (common prefix/suffix lines, one range) | `Satisfied` |
| `REQ15@R1 → DES17 → S32` (fake server) | None | Scripted stdio fake server that logs every message and exits with its stdin | `test/fixtures/fake-lsp.ts` (all script modes in `FakeScript`; `conn.onClose` and `stdin.on("close")` exit); `test/support/lsp.ts` (`fakeServerConfig`, `lspConfig`, `fakeTsc`, `readServerLog`, `waitForMessage`, `killServers`) | `Satisfied` |
| `REQ1@R2 → DES2, DES3 → S1, S2 → V2` | None | Nothing spawns while off; reload starts and stops servers | `src/app/lsp-host.ts:observe` → `reconcile` (`!next.enabled` → `forgetAll`), `launchFields` restart rule matches design §5 Config reload (command, initOptions, fileTypes, rootMarkers, rootSearch, snippets); settings-only change → `client.configure` | `Satisfied` |
| `REQ2@R2, REQ12@R2 → DES3, DES20 → S4, S22 → V30, V31` | None | One process per (server, root); `name@<root>` / `name@` keys; stacked servers both attach | `src/app/lsp-host.ts:attach` (`key = root === undefined ? \`${spec.name}@\` : \`${spec.name}@${root}\``, root/binary/probe caches per (spec, folder)); `sync` iterates every matching spec | `Satisfied` (behaviour); its test is flaky, see VER1 |
| `REQ1@R2, REQ2@R2 → DES2, DES3 → S33, S34 → V51, V52` | None | Local `node_modules/.bin` before `PATH`; `tsc --version` gate; settings by `workspace/configuration`, one `didChangeConfiguration` after `initialized`, `initOptions` | `lsp-host.ts:findBinary`, `resolveBinary`, `probeFor` (probe resolved with the same local-first rule, cached per root, `PENDING` attaches nothing, settle → `resync`), `gateAllows`; `client.ts:sectionValue`, `workspace/configuration` handler, `initialize` → `initialized` → `didChangeConfiguration` | `Satisfied` |
| `REQ3@R2, REQ12@R2 → DES3, DES15 → S35 → V53` | None | Exit before `initialize` → `unavailable` with the first stderr line; no toast, no restart | `client.ts:672-681` (`!settled` → `fail(firstStderr ?? reason)`; `exited` event only when `ready && !stopping`); `lsp-host.ts:launch` reject → `record(..."unavailable", reason)`; `stoppedViews` blocks re-attach until config change or `lspRestart` | `Satisfied` |
| `REQ12@R2 → DES3 → S25 → V34` | None | `shutdown` → `exit` at reply or `bound − 100`; kill at bound; lifecycle bounded | `client.ts:stop` (race shutdown with 400 ms, `exit`, wait remainder, SIGKILL, ≤ 100 ms reap); `lifecycle.ts` races `stopLsp` with `LSP_STOP_BOUND_MS + 100` after the preview stop | `Satisfied` (server stop); see VER3 for probes and starting servers |
| `REQ14@R2 → DES4 → S30 → V41` | None | 150 ms trailing debounce; flush before a request | `lsp-host.ts:track` (`SYNC_DEBOUNCE_MS` timer restarted per text change), `handle` case `lsp` → `flush(server, doc)` before `client.request` | `Satisfied` |
| `REQ6@R2, REQ7@R2, REQ14@R2 → DES19 → S36 → V54, V55, V56` | None | Pull after `didOpen` and each sent `didChange`; re-pull on refresh; push/pull slots kept; close clears only pulled | `lsp-host.ts:open`, `flush`, `pull` (only when `view.pullDiagnostics`), `refreshDiagnostics`, `close` (dispatches `source:"pull", items: []`); `client.ts:pullDiagnostics` (cancels older pull per path, `previousResultId`, `unchanged`) | `Satisfied` |
| `REQ12@R2 → DES3 → S24 → V29, V61` | None | Restart until the fifth crash within 180 s; in-flight answered `server restarted` | `lsp-host.ts:crashed` (one `now()` per crash, `at - t < CRASH_WINDOW_MS`, `< CRASH_LIMIT` → `starting` + `launch`, else `failed` + `resync`) | `Satisfied` |
| `REQ3@R2 → DES15 → S5, S6 → V7` | None | ≤ 1 progress dispatch per 100 ms per server; info/log only logged | `lsp-host.ts:events.progress` (one trailing 100 ms timer; the next timer starts only after the previous one fired); `events.message` (error/warning → `lspMessage`, else `logger.info("lsp.message", {server, level})` without text) | `Satisfied` |
| `REQ4@R1, REQ10@R2 → DES12, DES16 → S7, S17, S40 → V32, V48, V63` | None | Watched files by registered globs, debounced 100 ms; runner reports each `applyEdits` write | `client.ts` `client/registerCapability`/`unregisterCapability`, `toWatcher`, `watched` (kind bits, base-relative match, 100 ms debounce, last-wins per URI); `effects.ts` `applyEdits` case `d.lsp?.notify(...)` next to `d.index?.notify`; `main.ts` watcher callback `lspHost.notify(event)` | `Satisfied` |
| `REQ15@R1 → DES17 → S7, S32 → V44` | None | Real rust-analyzer smoke test, skipped without the binary | `test/integration/lsp-real.test.ts` (`test.skipIf(Bun.which("rust-analyzer") === null)`) | `Satisfied` |

Focus points from the plan, checked against the code:

| Focus | Evidence | Result |
|---|---|---|
| `lspServer` before `lspAttached` | `sync` → `attach` → `start` queues `lspServer{starting}` through `send`, then `report` queues `lspAttached`; both are deferred in order with `queueMicrotask` (`lsp-host.ts:248-252`) | Correct |
| `lspResult.now` set by the host | `lsp-host.ts:404`, `:742`, `:751` pass `now: now()` | Correct |
| No store re-entry from `observe` | `observing` flag routes every dispatch made during `observe` through `queueMicrotask`; `run` defers `handle` with `queueMicrotask`; client events fire from I/O callbacks only | Correct |
| Argv-only spawn | `client.ts:213` `run(o.binary, [...o.spec.command.slice(1)], {cwd, stdio})`; `probeMajor` `spawn(cmd, args, {cwd, stdio})`; no `shell` option anywhere | Correct |
| Stderr cap; no note text in logs | `STDERR_LINES = 200` (`client.ts:119`); events log server name, level, method, code, reason, or count only. Server stderr lines are logged by design ("Stderr is drained into the debug log"). The crash test asserts `secret_name` from the note never reaches `so.log` | Correct |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| Fast gate (`V46`) | `S32` | `DES1`, `DES17` | `bun run check` | Biome clean, tsc clean, knip zero findings; 1203 pass, 0 fail, 108 files (6.69 s) | `Passed` |
| CI suites | `S32` | `DES17` | `bun run test:ci` | 247 pass, **1 fail** of 248 (57.4 s): "one process serves a Cargo workspace…" at `test/integration/lsp-host.test.ts:142`; received `[other, repo]` for expected `[repo, other]` | `Failed` |
| Flakiness — serial repeats | `S32` | `DES17` | `bun test test/integration/lsp-host.test.ts test/integration/lsp-edits.test.ts` ×8 | 7 runs 18/18 pass; run 3: "a project's own tsc is used…" timed out at 5000 ms ("timed out waiting for textDocument/didOpen in tsc-7.0.0.jsonl") | `Failed` |
| Flakiness — concurrent repeats | `S22`, `S33` | `DES3`, `DES20` | 6 concurrent `bun test … -t "own tsc\|Cargo workspace"` | 5/6 pass; 1 failure of the Cargo test at the same `:142` order assertion. The tsc test alone ×5 serial: 5/5 pass at ~2.0 s | `Failed` |
| Real server (`V44`) | `S7`, `S32` | `DES17` | `bun test test/integration/lsp-real.test.ts` ×2 | **Ran** (rust-analyzer 1.96.0 at `~/.cargo/bin/rust-analyzer`): 1 pass in 1.92 s and 1.12 s; no new rust-analyzer process afterwards | `Passed` |
| Process hygiene | `S32` | `DES17` | `pgrep -fl fake-lsp` after every suite run | Empty each time | `Passed` |
| Work-process ids | None | None | `rg "W261005GWLY\|REQ[0-9]\|DES[0-9]\|P2-G1\|\bV[0-9]+\b\|\bS[0-9]+\b"` over the 22 changed files | No matches | `Passed` |
| `V27`, `V28` | `S22`, `S23` | `DES4`, `DES20` | `roots.test.ts`, `sync.test.ts` in `bun run check` | Pass (500 seeded sequences; layouts as listed) | `Passed` |
| `V33`, `V45`, `V57`, `V64` | `S7`, `S16`, `S19`, `S37`, `S39` | `DES1`, `DES10`, `DES12`, `DES18`, `DES19` | `convert.test.ts` in `bun run check` | Pass; assertions match design §8 cases one to one | `Passed` |
| `V2` | `S1`, `S2` | `DES2`, `DES3` | `lsp-host.test.ts` "servers start only when enabled…" | Pass in every run | `Passed` |
| `V30` | `S22` | `DES3`, `DES20` | "one process serves a Cargo workspace…" | Behaviour correct (2 rs processes, `py@` with `rootUri null`), but the test fails intermittently on order (VER1) | `Failed` |
| `V31` | `S4` | `DES3` | "a second server on the same file type…" | Pass; both `didOpen`, shown = 3 | `Passed` |
| `V51` | `S33` | `DES2`, `DES3` | "a project's own tsc is used…" | Pass 12 of 13 runs; one 5 s timeout (VER2) | `Insufficient` |
| `V52` | `S34` | `DES2` | "settings reach servers…" | Pass; `[{x:1}, null]`, `didChangeConfiguration` right after `initialized`, `initializationOptions` from `settings["rust-analyzer"]` | `Passed` |
| `V53` | `S35` | `DES3`, `DES15` | "a server that exits before initializing…" | Pass; reason = stderr line, 1 process, 0 toasts, one `lsp.unavailable` log line | `Passed` |
| `V34` | `S25` | `DES3` | "stopping kills a server that ignores shutdown…" | Pass; ≤ 700 ms, pid gone, last method `exit` | `Passed` |
| `V41` | `S30` | `DES4` | "keys typed within the debounce…" | Pass; `[didOpen, didChange, hover]`, version + 10, one range change | `Passed` |
| `V54`, `V55`, `V56` | `S36` | `DES19` | pull, refresh, push/pull-slot tests | Pass; `previousResultId` `[undefined, r1, r2, r3]`; 2 extra pulls on refresh; `{push:[…]}` after close | `Passed` |
| `V29`, `V61` | `S24` | `DES3` | crash-window tests (15 s timeouts) | Pass; 5 × `initialize`+`didOpen`, one toast `rs stopped: exited with code 1`; spaced crashes never `failed` | `Passed` |
| `V7` | `S5`, `S6` | `DES15` | "progress is throttled…" | Pass; dispatches ≤ 5 (plan: ≤ 3), 1 warning toast, info logged without text | `Passed` |
| `V32`, `V48`, `V63` | `S7`, `S17`, `S40` | `DES12`, `DES16` | watched-file test; `lsp-edits.test.ts` | Pass; one `didChangeWatchedFiles` `{lib.rs, type 2}`; `b.ts` written, `a.ts` dirty, toast `2 files changed`, `{b.ts, type 2}` reported | `Passed` |
| `main` wiring | `S25`, `S32` | `DES3`, `DES14`, `DES16` | Throwaway script driving `bin/so main.rs` in a PTY (`test/e2e/pty.ts:runInPty`) with an isolated `XDG_CONFIG_HOME` holding a fake-server `[lsp]` config; deleted afterwards | Exit 0; server log `initialize, initialized, didChangeConfiguration, didOpen, shutdown, exit`; `:q` took 38 ms; server pid gone | `Passed` |
| Stop leaves no child (design invariant, `lsp-host.ts` §7) | `S25`, `S32` | `DES3` | Throwaway integration test (deleted afterwards): `node_modules/.bin/tsc` probe that `exec sleep 30`; a server command that never answers `initialize`; `kill(pid, 0)` right after `await app.stop()` and 50 ms later | Both pids **alive** right after `stop()` resolved, gone 50 ms later (VER3) | `Failed` |

## Findings

### P2-G1-VER1 — Major — Test reliability — The Cargo-root test depends on the order two processes write their logs

- **System Design:** `REQ2@R2, REQ12@R2, DES3, DES20, S22, V30`
- **UI Design:** None
- **Evidence:** `test/integration/lsp-host.test.ts:139-142`:

  ```ts
  const rsInit = messages(rs.log, "initialize").map(
    (m) => (m.params as { rootUri: string | null }).rootUri,
  );
  expect(rsInit).toEqual([uri(join(root, "repo")), uri(join(root, "other"))]);
  ```

  Both `rs` processes (roots `repo` and `other`) append to the same log, so the line order depends on process start and scheduling. `bun run test:ci` failed at this line in this pass (received `[other, repo]`), and 1 of 6 concurrent runs failed the same way.
- **Impact:** The `test` job on `ubuntu-24.04`/`macos-15` fails intermittently with no product defect, so CI cannot be trusted as a gate for this work.
- **Required resolution:** The assertion compares the set of `rootUri` values without depending on order (for example, sort both sides), and still asserts exactly two `rs` processes and one `py@` process with `rootUri null` and no folders.
- **Required proof:** `bun run test:ci` passes, and the test passes in 20 repeated runs, including several run concurrently, e.g. `for i in $(seq 20); do bun test test/integration/lsp-host.test.ts -t "Cargo workspace"; done`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G1-VER2 — Minor — Test reliability — The local-tsc test can exceed the default 5 s test timeout

- **System Design:** `REQ1@R2, REQ2@R2, DES2, DES3, S33, V51`
- **UI Design:** None
- **Evidence:** In 1 of 8 serial runs of `lsp-host.test.ts` + `lsp-edits.test.ts`, "a project's own tsc is used and picks the TypeScript server by version" failed with `this test timed out after 5000ms` and `timed out waiting for textDocument/didOpen in tsc-7.0.0.jsonl`. The test runs two full app lifecycles, each with a shell-script probe and a Bun-started fake server. It has no explicit timeout, while `waitForMessage` alone defaults to 5000 ms. It normally takes about 2.0 s, and 5 isolated reruns passed. The root cause was not confirmed. One candidate is a probe slower than `PROBE_BOUND_MS` (2000 ms): it returns `undefined`, so `gateAllows` admits only `typescript` and `tsc` never gets `didOpen`.
- **Impact:** Intermittent CI failures on slower runners. If the cause is a slow probe, a project with TypeScript 7 could also get the wrong server on a loaded machine. That would be the documented fallback, but it is not visible in the test failure.
- **Required resolution:** Give the test an explicit timeout that fits two app lifecycles (for example 15 s, like the crash tests). On failure, the test reports which server attached and the probe outcome, so a slow-probe fallback can be told apart from a slow start.
- **Required proof:** The test passes 20 repeated serial runs and several concurrent runs. The failure message, if any, names the attached key.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G1-VER3 — Minor — Process lifecycle — `stop()` resolves before probe children and starting servers have exited

- **System Design:** `REQ12@R2, DES3, S25, S32, V34`; design §7 `src/app/lsp-host.ts` invariant "After `stop()` resolves, no child process started by the host is alive, including probes."
- **UI Design:** None
- **Evidence:** `src/app/lsp-host.ts:783-789` sends SIGKILL to probes but awaits only `stopping`:

  ```ts
  async stop() {
    if (stopped) return;
    stopped = true;
    for (const child of probeChildren) child.kill("SIGKILL");
    for (const server of [...servers.values()]) stopServer(server);
    await Promise.allSettled([...stopping]);
  },
  ```

  For a server that is still starting, `stopServer` awaits `server.starting` (`lsp-host.ts:279`). That settles when `createLspClient` rejects on abort (`client.ts:682-685` → `fail("stopped")`), before the child's `close`. A throwaway test confirmed both cases: a hanging `node_modules/.bin/tsc --version` probe and a server that never answers `initialize` were each alive (`process.kill(pid, 0)` succeeded) right after `await app.stop()`, and gone 50 ms later.
- **Impact:** The contract that `stop()` leaves no child is not met. Tests that check pids right after `stop()` would be flaky, and on shutdown the lifecycle bound is spent before these children are reaped. The practical risk is low because SIGKILL is already sent.
- **Required resolution:** `stop()` resolves only after every probe child and every starting server process has emitted `close`, still within `LSP_STOP_BOUND_MS` (+ the lifecycle margin). For example: track each probe's close promise, and make the aborted client's settle wait for the child's `close`, bounded.
- **Required proof:** An integration test with a hanging version probe and a server that never answers `initialize` asserts both pids are gone immediately after `await app.stop()`, and `stop()` takes ≤ 700 ms.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:** opt-in and reload (V2); per-root keys, Cargo workspace sharing, marker-less `name@` (V30); stacked servers (V31); local `tsc` and the version gate both ways (V51); configuration answers, push settings, `initOptions` (V52); `unavailable` without toast or restart (V53); bounded stop of a server that ignores `shutdown` (V34); debounce and flush-before-request (V41); pull after open/change, `previousResultId`, refresh, push/pull slots, close (V54–V56); crash window with the real clock and injected `now`, in-flight `server restarted` (V29, V61); progress throttle and message routing (V7); watcher glob filter and runner-written files (V32, V63); rename over open and closed files (V48); converters, snippets, capabilities, quiet errors, hover fences (V33, V45, V57, V64); `lineChange` property and `findRoot` table (V27, V28); real rust-analyzer hover (V44).
- **Missing:**
  - Children left alive right after `stop()` (VER3): no test covers a probe or a still-starting server at stop.
  - Failed or timed-out version probe: `gateAllows` with an unknown major is covered in Part 1, but no integration test asserts that a failing `tsc --version` attaches `typescript` and not `tsc` (S33 "including a failed probe").
  - Server-initiated `workspace/applyEdit` answered through `lspReply` → `client.reply`: the fake supports `applyEdit`, but no integration test asserts that the server receives one `{applied, failureReason}` response (S19/S40). The reducer side belongs to Part 1, and this group only adds the routing.
  - V7's progress test uses ≤ 5 dispatches where the plan says ≤ 3. It still tells throttled from unthrottled (50), but it does not measure the 100 ms spacing that S5 states.

## Scope Changes

The implementation report records these deviations. Each is judged below.

| Deviation | Judgement |
|---|---|
| `LspClient.request(id, path, op)` instead of `request(id, op)` | Accepted. `LspOp` carries no document, so the client needs the path for the URI. The host passes `Effect.path`. Internal contract only. |
| `createLspClient({ signal?: AbortSignal })` | Accepted. It lets `stopServer` kill a process that is still starting, and an abort also sets `stopping`, so the exit is not treated as a crash. Its settle timing is the cause of VER3. |
| Extra log events `lsp.stderr` (≤ 200 lines per client) and `lsp.dropped` (count) | Accepted. `lsp.stderr` is the stderr drain that design §7 requires. `lsp.dropped` logs only method and count. Neither logs document text. Server stderr is the server's own output, as the design intends. |
| Progress test bound ≤ 5 instead of ≤ 3 | Accepted as a test tolerance. The throttle itself satisfies S5: one trailing 100 ms timer, and the next timer starts only after the previous one fired (`lsp-host.ts:355-377`). See Test Coverage for the weaker proof. |
| 15 s timeouts on the crash tests | Accepted. Each test starts 5–6 processes. |
| Watcher `changed` sent as `Changed (2)`, including creations | Accepted. The workspace `FileEvent` has no create kind (`src/core/state/types.ts:59-60`). A consequence: a watcher that registered `kind: Create` only (bit 1) is never notified, because `watched` tests the Change bit for `changed` events (`client.ts:617`). No built-in server registers that way. |
| `LspHost.run` defers every effect with `queueMicrotask` | Accepted. A request then runs after `observe` has seen the action that emitted it, which the flush-before-request rule needs. |
| `startApp` temp config folders (`so-config-*`) are not removed | Accepted. This follows the existing `tmpWorkspace` pattern (`so-it-*`), which also leaves temp folders. |

## Unverified Items

- **Root cause of VER2's timeout:** seen once in 8 serial runs and not reproduced in 5 isolated or 6 concurrent runs. The slow-probe hypothesis is unconfirmed.
- **Linux CI behaviour:** this pass ran on macOS (Darwin 23.4.0) only. The VER1 order race is platform-independent. Timing margins on `ubuntu-24.04` were not measured.

## Blockers

None
