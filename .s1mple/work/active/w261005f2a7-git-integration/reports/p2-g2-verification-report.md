# P2-G2 Verification Report

## Scope

- **Group:** `P2-G2`
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`, `P2-G2-T3`, `P2-G2-T4`
- **Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p2-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p2-g2-implementation-report.md`

Verified range: `ac457af..03f421d` (commits `20d68f2`, `5f94619`, `a56003b`, `03f421d`; 12 files). Verified at HEAD `8e90b6a`.

## Status

`Failed`

Every assigned chain is implemented, and every task and group check passes. One Minor finding stays open: a throw from the first restore step in the tool host's `finally` skips `resume` and `release`. That breaks the design invariant that both run exactly once per `suspend`. The `writeSync(1, …)` deviation adds a realistic way for that step to throw.

## Assigned Traceability

- **System Design:**
  - `REQ2@R2 → DES9 → S13 → V42`
  - `REQ2@R2 → DES9 → S14, S15, S31, S35 → V60, V67`
  - `REQ2@R2, REQ3@R1 → DES9 → S12, S14, S16, S35 → V30, V33, V59`
  - `REQ2@R2 → DES9 → S12, S27 → V41 (runTool), V58`
- **UI Design:** `UREQ10@R1 → UDES10@R1 → US10@R1` (mechanics)

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ2@R2 → DES9 → S13 → V42` | None | SIGINT is ignored while held. SIGTERM and SIGHUP still shut down. Release is idempotent, and holds nest. | `src/app/lifecycle.ts:69-87`: the handler returns early when `signal === "SIGINT" && held > 0`. `holdInterrupts` uses a counter plus a `released` flag for each hold. Shutdown body, order, and exit codes are unchanged (diff shows only the handler wrapper and return value). | `Satisfied` |
| `REQ2@R2 → DES9 → S14, S15, S31, S35 → V60, V67` | `UREQ10@R1 → UDES10@R1 → US10@R1` (mechanics) | The pre-suspend frame is rendered before `suspend`. Nothing is painted or written while suspended. Images are drawn again after `resume`. The foreign-mode reset bytes live in `shell.ts`. | `src/ui/shell.ts:55-56` `FOREIGN_MODES_RESET` (byte-identical to system design §7). `shell.ts:218` `if (suspended) return;` in `paint`. `shell.ts:250-267` `flush` (repaint → `renderer.idle()`), `suspend` (guard, then `renderer.suspend()`), `resume` (`renderer.resume()`, guard off, `repaint()`), and `resetForeignModes`. OpenTUI `resume()` sets `forceFullRepaintRequested`, re-enables mouse only if it was on, and `requestRender()` is a no-op while `explicit_suspended` (`node_modules/@opentui/core/chunk-bun-j2z63cdy.js`). | `Satisfied` |
| `REQ2@R2, REQ3@R1 → DES9 → S12, S14, S16, S35 → V30, V33, V59` | None | The order is `which` → flush → hold → suspend → spawn(cwd) → reset → resume → release, with `finally` on a throw, rejection, or kill. A missing tool never suspends. The structural screen means no UI import. | `src/app/tool-host.ts:45-69` follows that order. `bunToolSpawn` (`:24-28`) passes an argv array with `stdio: inherit` and no shell. The structural `Screen` type is at `:16-21`. The only imports are `core/state/types` and `workspace/log`. Restore steps run one after another in `finally` (`:64-68`), so a throw in one skips the rest. See `P2-G2-VER1`. | `Mismatch` |
| `REQ2@R2 → DES9 → S12, S27 → V41 (runTool), V58` | None | `runTool` dispatches `toolExited` with the host result. `deps.tool` is late-bound like `deps.exit`. A post-tool re-read reloads the clean buffer with no conflict. No temporary no-op case remains. | `src/app/effects.ts:577-586`: `d.tool.run(...)` maps fulfilled → `toolExited {result}` and rejected → `toolExited {failed}`. `RunnerDeps.tool: ToolHost` is required (`effects.ts:69-70`). In `src/app/main.ts:332-334` the initial `failed` double resolves to "git tool not ready". `main.ts:366-372` binds `createToolHost({ screen: shell, holdInterrupts: lifecycle.holdInterrupts, which, logger })` right after `deps.exit`. The "not wired yet" comment is gone. `test/integration/helpers.ts` `startApp({ tool })`. | `Satisfied` |

Constraint checks:

| Constraint | Evidence | Result |
|---|---|---|
| Only `src/ui` imports `@opentui` | `grep -rln "@opentui" src \| grep -v ^src/ui/` → no output; `test/boundaries.test.ts` passes inside `bun run check` | `Satisfied` |
| The app takes a structural screen | `tool-host.ts:16-21` `type Screen`; `main.ts` passes `shell` | `Satisfied` |
| Escape bytes stay in `shell.ts` | `grep -rn '\x1b[?100\|\x1b[<99u' src \| grep -v ^src/ui/` → no output | `Satisfied` |
| argv spawn | `Bun.spawn(argv, { cwd, stdio: [...] })`; no `sh -c` or shell option | `Satisfied` |
| No temporary no-op Git effect case in `effects.ts` | All six cases (`:510`, `:521`, `:533`, `:551`, `:571`, `:577`) have real bodies that dispatch | `Satisfied` |
| No work-process IDs in code | `grep` for REQ/DES/UDES/UV/UREQ/US/V/S/P-G/W ids, `TODO`, `FIXME`, `console.`, `.only(` over added lines in `src`/`test` → no matches | `Satisfied` |

Judgment of the recorded deviations:

| Deviation | Judgment | Reason |
|---|---|---|
| `writeSync(1, …)` for the foreign-mode reset | Accepted, with `P2-G2-VER1` | OpenTUI `resume()` writes so's modes natively to fd 1 right away. A buffered `process.stdout.write` could land after them and turn them off. `lifecycle.ts` already uses `writeSync` the same way. The tradeoff is that `writeSync` can throw synchronously (for example `EAGAIN` on a non-blocking tty), and it runs as the first `finally` step. |
| Real shell in `mountShell` instead of recorders | Accepted | The design's "recorders" compatibility note served testability. Running the real `createShell` on the OpenTUI test renderer exercises the real guard and the real `renderer.suspend/resume/idle`, which is stronger evidence. `ShellDeps.write` keeps the bytes off the test terminal. |
| No image cache change | Accepted | The plan says to "use the existing `ImageCache`/image painter mechanics, not a new cache". V60 proves `drawImage` (kitty tier) is not called while suspended and is called again once after `resume`. Whether images reappear on a real terminal stays with manual check `V61` (Part 3). |
| `ToolSpawn` resolves `{code, signal?}` | Accepted | §7 allows an optional `spawn?: ToolSpawn` seam. The resolved shape keeps tests free of fake subprocesses. `bunToolSpawn` is tested against a real `sh` that kills itself with SIGKILL. |
| `git.tool.exit` at `info`/`error` | Accepted | `Logger` (`src/workspace/log.ts:11-14`) has only `info` and `error`. No note text is logged. |
| Runner turns a rejected `run` into `toolExited {failed}` | Accepted | This keeps the §7 runner invariant "each git effect dispatches exactly one action". `effects.test.ts` covers it. |
| Narrowed `installLifecycle` params (`Pick<Shell,"destroy">`, `Pick<EffectRunner,"flush">`) | Accepted | These are the only members used. The change is type-only and compatible with `main.ts`. It lets the V42 test avoid casts. |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V42` | `S13` | `DES9` | `bun test src/app/lifecycle.test.ts` | 3 pass, 0 fail, 7 expects. Covers SIGINT held → no exit; double release then a new hold still ignores SIGINT; nested holds; SIGINT after the last release → `[0]`; SIGTERM and SIGHUP while held → `[0]`. Every listener added for the five events is removed in `finally`. | `Passed` |
| `V30` | `S12`, `S14`, `S35` | `DES9` | `bun test src/app/tool-host.test.ts` | 4 pass, 0 fail, 19 expects. The order is `flushed, hold, suspend, spawn lazygit -p x @ /repo, reset, resume, release`, with a flush double that resolves on the next tick. The result is `exited 0`. | `Passed` |
| `V33` | `S14` | `DES9` | same file | A sync throw → `failed`. A rejected spawn → `failed`. SIGKILL → `exited {137, SIGKILL}`. reset, resume, and release each run once. A real `sh -c "kill -9 $$"` → `signal: "SIGKILL"`. A throwing restore step is not covered (see `P2-G2-VER1`). | `Insufficient` |
| `V59` | `S16` | `DES9` | same file | `which` → null → `{missing, tool: "gitui"}`; `calls` is `[]` | `Passed` |
| `V41` (runTool) | `S12` | `DES9` | `bun test src/app/effects.test.ts` | 22 pass, 0 fail. `toolExited {exited 0}` is dispatched once with the argv/cwd passed through. A rejected `run` dispatches `toolExited {failed, "no tool here"}` once. | `Passed` |
| `V58` | `S12`, `S27` | `DES9` | `bun test test/integration/git.test.ts` | 3 pass, 0 fail. A real `git checkout other -- a.md` runs from the stub tool. The buffer then reads `from other`, hunks go from >0 to 0, the tool ran at `<root>`, `toolExited {exited 0}` is dispatched, there is no conflict overlay, and the buffer is clean. | `Passed` |
| `V67` | `S35`, `S15` | `DES9`, `UDES10@R1` | `bun test test/ui/git.test.ts` | 3 pass, 0 fail, 14 expects. The last frame before suspend contains `"notes/plan.md" written · opening lazygit`. After `suspend`, a `resize` and a `dirListed` render no frame, `useMouse` stays `false`, and `writes` stays `[]`. `resetForeignModes` writes exactly `FOREIGN_MODES_RESET`. After `resume`, frames render and mouse comes back on. | `Passed` |
| `V60` | `S31`, `S15` | `DES9` | same file | Kitty tier. `drawImage` is called before suspend, not called while suspended (after a resize), and called exactly once after `resume`, with tier `"kitty"`. | `Passed` |
| Destroy while suspended | `S14` | `DES9` (Failure rule "Shutdown during the tool") | same file | `suspend()` then `destroy()` twice → `renderer.isDestroyed === true`, no throw | `Passed` |
| App units | — | — | `bun test src/app` | 30 pass, 0 fail, 101 expects | `Passed` |
| Shell | — | — | `bun test test/ui`; `git diff --stat ac457af..03f421d -- '*.snap'` | 160 pass, 0 fail, 63 snapshots. No snapshot file changed in the range, so the v1 snapshots are byte-identical. | `Passed` |
| Integration | — | — | `bun test test/integration` | 62 pass, 0 fail, 310 expects (`V56`–`V58` included) | `Passed` |
| Static and unit gate | — | — | `bun run check` | exit 0. Biome checked 351 files with no fixes. tsc and knip are clean. 1201 pass, 0 fail, 18 snapshots (includes boundaries). | `Passed` |
| `test:ci` | — | — | `bun run test:ci` | exit 0; 235 pass, 0 fail, 63 snapshots | `Passed` |
| No temporary runner cases | — | — | `grep -nE 'case "(gitStatus\|gitReadIndex\|gitStage\|gitBlame\|gitWatch\|runTool)"' src/app/effects.ts` | 6 cases, each with a dispatching body. No "not wired" comment remains. | `Passed` |
| Restore guarantee under a throwing restore step | `S14` | `DES9` (§7 `tool-host.ts` invariant) | Scratch probe test (removed afterwards): `createToolHost` with a `resetForeignModes` that throws `EAGAIN` | `calls = ["hold","suspend","reset"]`; `run` rejected with the EAGAIN error; `resume` and `release` never ran | `Failed` |
| Process hygiene | — | — | `pgrep -fl "bun .*so\|git \|lazygit"` before and after | Only PID 49530 (pre-existing sandbox) and other sessions' `ugrep` | `Passed` |
| Temp-dir hygiene | — | — | `ls $TMPDIR` diff around the group's five test files | No new entries. The full `test:ci`/integration runs left `so-it-*`, `so-e2e-*`, and `so-quit-*` dirs from suites outside this group. The verifier removed the ones from the last 45 minutes. | `Passed` |

## Findings

### P2-G2-VER1 — Minor — Failure Behavior — A throwing restore step leaves so suspended with interrupts held

- **System Design:** `REQ2@R2`; `DES9`; `S14`; `V33`
- **UI Design:** None
- **Evidence:** `src/app/tool-host.ts:64-68` runs the restore steps one after another in a single `finally`:

  ```ts
  } finally {
    d.screen.resetForeignModes();
    d.screen.resume();
    release();
  }
  ```

  `resetForeignModes` writes with `writeSync(1, FOREIGN_MODES_RESET)` (`src/ui/shell.ts:266`). This was the deliberate deviation from `process.stdout.write`. `writeSync` throws synchronously on `EAGAIN` (non-blocking tty with a full buffer) or `EIO`. A probe with a throwing `resetForeignModes` recorded `["hold","suspend","reset"]`: `resume` and `release` never ran, and `run` rejected. System design §7 `src/app/tool-host.ts` states the invariant "`resume` and `release` run exactly once per `suspend`". §5 Failure and Recovery Rules says "`finally` always resets modes, resumes, and releases interrupts".
- **Impact:** If that write throws, the runner still dispatches `toolExited {failed}`. But the renderer stays in `explicit_suspended` with stdin paused and raw mode off, and SIGINT stays held. so stops responding: it never repaints, keys never arrive, and Ctrl-C is ignored. The user must kill the process. This is the "terminal left suspended after crash" risk that V33 guards. The trigger is unlikely, but nothing recovers from it.
- **Required resolution:** Make each restore step independent, so a throw in one still runs the others. For example, nest `try/finally` as reset → resume → release, or catch and log the reset failure. `resume` and `release` must each run exactly once even when `resetForeignModes` or `resume` throws. The error should still be logged (`git.tool.exit` or a dedicated event) without note text.
- **Required proof:** A `src/app/tool-host.test.ts` case where `resetForeignModes` throws asserts that `resume` and `release` each run once, plus a case where `resume` throws asserts that `release` runs once. `bun test src/app/tool-host.test.ts` and `bun run check` pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - SIGINT hold, nesting, idempotent release, and SIGTERM/SIGHUP while held (V42), with signal handlers cleaned up after each case.
  - Hand-off order with an asynchronous flush (V30).
  - Spawn throw, spawn rejection, SIGKILL exit, and a real child's code and signal (V33).
  - A missing tool never holds or suspends (V59).
  - Runner `runTool` result and rejection mapping (V41).
  - Real checkout reload with no conflict and hunks recomputed (V58).
  - Pre-suspend frame, no frames, mouse, or writes while suspended, the exact reset bytes, and repaint and mouse on resume (V67).
  - Kitty image re-issue after resume (V60).
  - Destroy while suspended.
  - v1 snapshots unchanged.
- **Missing:** A restore step that throws (`resetForeignModes` or `resume`) is not tested. The test must assert that the remaining restore steps still run exactly once (see `P2-G2-VER1`). That keys do not reach the store while suspended (`S12`) is shown here only through OpenTUI's `suspend()` removing its stdin listener. A direct check is the Part 3 PTY case `V50`, as planned.

## Scope Changes

- `installLifecycle` parameter types narrowed to `Pick<Shell, "destroy">` and `Pick<EffectRunner, "flush">` (`src/app/lifecycle.ts:26-27`). This is unplanned but explained, type-only, and behavior-neutral.
- `ShellDeps.write` was added (`src/ui/shell.ts:83`) as a test seam for bytes written outside the renderer. It is unplanned but explained, and it defaults to `writeSync(1, …)`.
- `bunToolSpawn` and `ToolSpawn` are exported from `src/app/tool-host.ts` and tested directly. This is within §7's optional `spawn` seam.
- `test/integration/helpers.ts`: `gitOff()` also supplies a shared `noTool` double. This is required because `RunnerDeps.tool` is now required.

Each one is recorded in the implementation report's deviations and is consistent with the governing designs.

## Unverified Items

- That the terminal actually shows the images again after resume on Ghostty or kitty (`V61`, manual, Part 3).
- Real-PTY hand-off with a tool that enables `?1003h` and kills itself (`V50`, Part 3).
- Behavior under a real `EAGAIN`/`EIO` from the foreign-mode write was only simulated with a throwing double. No real non-blocking tty was set up.

## Blockers

None
