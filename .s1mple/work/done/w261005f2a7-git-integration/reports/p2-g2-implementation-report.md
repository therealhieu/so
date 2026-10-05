# P2-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-goal.md`
- **Plan Part:** `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-plan-2-adapters-and-handoff.md`
- **Group:** `P2-G2`
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`, `P2-G2-T3`, `P2-G2-T4`
- **Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p2-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G2-T1` | `src/app/lifecycle.ts`: `installLifecycle` returns `holdInterrupts` (a counter; each release is idempotent). The SIGINT handler returns early while the count is above 0. SIGTERM, SIGHUP, and the shutdown body are unchanged. `shell` and `runner` params narrowed to `Pick<Shell, "destroy">` and `Pick<EffectRunner, "flush">`, the only members used, so the test needs no casts. `src/app/lifecycle.test.ts` (new; V42): installs on the real process, emits signals with `process.emit`, and removes every listener it added in `finally` | RED: `bun test src/app/lifecycle.test.ts` → 0 pass, 3 fail (`l.holdInterrupts is not a function`). GREEN → 3 pass, 7 expects. Covered: SIGINT ignored while held; double release followed by a new hold still ignores SIGINT, so the count never goes negative; nested holds; SIGINT after the last release shuts down (exit `[0]`); SIGTERM and SIGHUP shut down while held. `bun run check` → exit 0, 1196 pass. | `20d68f2` | `Completed` |
| `P2-G2-T2` | `src/ui/shell.ts`: `FOREIGN_MODES_RESET` (the exact design bytes); `Shell.flush` (repaint, then `renderer.idle()`), `suspend` (guard on, then `renderer.suspend()`), `resume` (`renderer.resume()`, guard off, repaint), `resetForeignModes`; `paint` returns early while suspended; optional `ShellDeps.write` (default `writeSync(1, …)`). `test/support/ui.ts`: `mountShell` records `writes` and adds `record()` (an OpenTUI `TestRecorder` of rendered frames). `test/ui/git.test.ts` (new): V67, V60, and destroy-while-suspended | RED: suite failed to load (`FOREIGN_MODES_RESET` not exported). GREEN: 3 pass, 14 expects. Mutation check: with the `if (suspended) return;` guard removed, V67 fails (`renderer.useMouse` Expected `false`, Received `true`); with the guard back it passes. `bun test test/ui` → 160 pass, 0 fail, 63 snapshots; no `.snap` file changed. `bun run check` → exit 0, 1196 pass. | `5f94619` | `Completed` |
| `P2-G2-T3` | `src/app/tool-host.ts` (new): `ToolSpawn`, `ToolHost`, `bunToolSpawn` (argv with inherited stdio, never a shell; reports `signalCode`), `createToolHost` with a structural `Screen` type (no UI import). Order: `which` → `flush` → `holdInterrupts` → `suspend` → `spawn` → `finally { resetForeignModes; resume; release }`. Logs `git.tool.exit` (`info` with `code`/`signal`, `error` with `reason`). `src/app/tool-host.test.ts` (new; V30, V33, V59, plus the real default spawn) | RED: module not found → 0 pass, 1 fail. GREEN: 4 pass. V30: the call order with a flush double that resolves on the next tick is exactly `flushed, hold, suspend, spawn lazygit -p x @ /repo, reset, resume, release`, and the result is `exited 0`. V33: a sync throw → `failed`, a rejected spawn → `failed`, SIGKILL → `exited {137, SIGKILL}`; reset, resume, and release each run once. V59: `which` → null → `missing`, no calls. Real `sh -c "kill -9 $$"` → `signal: "SIGKILL"`. `bun run check` → exit 0, 1200 pass. | `a56003b` | `Completed` |
| `P2-G2-T4` | `src/app/effects.ts`: `RunnerDeps.tool: ToolHost` (required); the `runTool` case dispatches `toolExited` with the host result, or `failed` with the reason if `run` rejects. The last temporary no-op case and its comment are gone. `src/app/main.ts`: `deps.tool` starts as a "git tool not ready" `failed` double and is late-bound after `installLifecycle`, next to `deps.exit`: `createToolHost({ screen: shell, holdInterrupts: lifecycle.holdInterrupts, which: Bun.which, logger })`. `test/integration/helpers.ts`: `startApp({ tool })` and a shared `noTool` double, also used by `gitOff()`. `src/app/effects.test.ts`: V41 (runTool part). `test/integration/git.test.ts`: V58 | RED: effects 21 pass, 1 fail; integration 2 pass, 1 fail (both timed out waiting). GREEN: `bun test src/app/effects.test.ts` → 22 pass; `bun test test/integration/git.test.ts` → 3 pass. In V58 a stub tool runs a real `git checkout other -- a.md` on a clean open buffer that has a working-tree hunk. Then the buffer reads `from other`, hunks go from >0 to 0, `toolExited { exited 0 }` is dispatched, there is no conflict overlay, and the buffer stays clean. The tool ran at the repo top (`lazygit @ <root>`). `bun run check` → exit 0, 1201 pass. `bun test test/integration` → 62 pass. | `03f421d` | `Completed` |

### Group Change Range

- **Starting commit:** `ac457af`
- **Final commit:** `03f421d`
- **Remaining group changes:** None. The unstaged `.gitignore` change (`.worktrees/`) was already there before this group. It is not this group's change and was left untouched.

### Group Verification

- `bun test src/app` → `Passed`: 30 pass, 0 fail (V30, V33, V41, V42, V59; the existing suites pass).
- `bun test test/ui` → `Passed`: 160 pass, 0 fail, 63 snapshots (V60, V67). `git status test/ui/__snapshots__` shows no change.
- `bun test test/integration` → `Passed`: 62 pass, 0 fail (V56, V57, V58).
- `bun run check` → `Passed`: exit 0. Biome clean, tsc clean, knip zero findings, 1201 pass, 0 fail. This includes `test/boundaries.test.ts`: `src/app/tool-host.ts` imports only `src/core` and `src/workspace` types.
- `bun run test:ci` → `Passed`: exit 0, 235 pass, 0 fail, 63 snapshots (component, integration, and PTY e2e).
- `grep -nE 'case "(gitStatus|gitReadIndex|gitStage|gitBlame|gitWatch|runTool)"' src/app/effects.ts` → `Passed`: six cases (lines 510, 521, 533, 551, 571, 577), each with a real body. No "not wired" comment remains.
- `grep -nE "W261005F2A7|\b(REQ|DES|UDES|UV|UREQ|US)[0-9]|\bV[0-9]+\b|\bS[0-9]+\b|P[0-9]-G[0-9]"` over `git diff ac457af -- src test` → `Passed`: no matches. No `TODO`, `FIXME`, `console.`, `debugger`, or `.only(` was added.
- Process hygiene (`pgrep -fl "bun .*so|git |lazygit"`) → `Passed`: no process from this group remains. The matches are PID 49530 (the pre-existing `.sandbox/vault` instance, left running as instructed) and `ugrep`/`zsh` processes from other sessions and projects.
- Temp dirs → `Passed`: no `so-git-*` or `so-effects-*` dirs remain in `os.tmpdir()`. The V58 test's repo and app are cleaned up by the suite's `afterEach`.
- Self-review of `ac457af..03f421d` (12 files, excluding `.gitignore`) → `Passed`. The hand-off order matches the design. `finally` covers a sync throw, a rejection, and a signal. Escape bytes exist only in `src/ui/shell.ts`. `deps.tool` is late-bound like `deps.exit`. `paint` is unchanged apart from the guard.

### Deviations and Remaining Issues

Decisions a fresh remediator must keep:

1. **Synchronous foreign-mode write.** `resetForeignModes` writes with `writeSync(1, …)`, not `process.stdout.write` as the design sketch shows. The renderer's `resume()` writes so's own modes natively to fd 1 right after. A buffered JS write could land after those modes and turn them off again. `lifecycle.ts` already uses `writeSync` for the same reason. Tests inject `ShellDeps.write`, so the bytes are recorded and never reach the test terminal.
2. **`ShellDeps.write` and `mountShell` observability.** The design says the test shell's methods are "recorders". `mountShell` instead runs the real `createShell` on the OpenTUI test renderer, so V60 and V67 exercise the real guard and the real `renderer.suspend/resume/idle`. Observation uses `writes` (bytes written outside the renderer), `record()` (frames from OpenTUI's `TestRecorder`), and `renderer.useMouse`.
3. **No terminal write while suspended.** OpenTUI's `requestRender()` already does nothing in the explicit-suspended state. The shell guard closes the remaining leak: `paint` would set `renderer.useMouse = true`, and that enables mouse tracking natively at once. V67 asserts that `useMouse` stays `false`, that no frame renders, and that `writes` stays empty after `suspend` while actions dispatch.
4. **Image re-issue.** `resume()` relies on OpenTUI's own `forceFullRepaintRequested` plus the shell's `repaint()`. The image painter calls `drawImage` on every frame where the image is visible, so no `ImageCache` change was needed. V60 proves that `drawImage` (kitty tier) is not called while suspended and is called again once after `resume`. Whether the terminal actually shows the image again stays with the manual check V61 (Part 3).
5. **Tool-host details.** `ToolSpawn` resolves `{ code, signal? }` rather than returning the Bun subprocess, so tests need no fake process. `bunToolSpawn` is exported and tested against a real `sh`. A missing `argv[0]` is treated as the tool `""`, which `which` reports as missing. `git.tool.exit` is logged at `info` for an exit and at `error` (with `reason`) for a spawn failure. The `Logger` has no `warn` level.
6. **Runner rejection path.** `ToolHost.run` never rejects by design. The `runTool` case still maps a rejection to `toolExited { failed }`, so the effect always dispatches exactly one action.
7. **Lifecycle parameter narrowing.** `installLifecycle` now takes `Pick<Shell, "destroy">` and `Pick<EffectRunner, "flush">`. `main.ts` is unaffected, and shutdown order and exit codes are unchanged.
8. **Pre-tool `deps.tool`.** Until `installLifecycle` runs, `deps.tool` resolves to `{ kind: "failed", reason: "git tool not ready" }`. No `runTool` can be emitted before the shell attaches and the first keys arrive, so this value is never seen in practice.

Remaining issues: None. PTY e2e `V50` and the manual image check `V61` belong to Part 3, as the plan says.

## Remediation

The one verifier finding, `P2-G2-VER1`, is fixed in `1858b88`. Every restore step in the tool host now runs on its own, so a throw from the foreign-mode write or from `resume` cannot leave so suspended with interrupts held.

- **Verification reports:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p2-g2-verification-report.md` (commit `1695ded`, status `Failed`, one Minor finding). That report and its verdict are unchanged.
- **Status:** `Completed`

### Finding Closure

#### P2-G2-VER1 — A throwing restore step leaves so suspended with interrupts held — `Fixed`

- **Inspection:** The finding is confirmed. Before the fix, `src/app/tool-host.ts:64-68` ran `resetForeignModes(); resume(); release();` one after another in a single `finally`. The new test made `resetForeignModes` throw and recorded calls ending `suspend, spawn lazygit @ /repo, reset`, with no `resume` and no `release`.
- **Change evidence:** In `src/app/tool-host.ts`, `finally` now calls `restore(release)`. Each step sits in nested `try/finally` blocks (reset → resume → release), so a throw from one step still lets the later steps run, and each runs exactly once. An outer `catch` logs `git.tool.restore` with `{ reason }` (the error message only, no note text) and rethrows. `run` then rejects, and the existing `runTool` case turns that rejection into exactly one `toolExited { failed, reason }`. The happy path, the spawn-failure path, the order, and the `git.tool.exit` logging are unchanged. `src/app/tool-host.test.ts` adds a `failing` option to the screen double and the test `a failing restore step still resumes and releases once`.
- **Verification evidence:**
  - RED: before the fix, `bun test src/app/tool-host.test.ts` → 4 pass, 1 fail. The received calls ended `[…, "reset"]`, not `reset, resume, release`.
  - GREEN: `bun test src/app/tool-host.test.ts` → 5 pass, 0 fail, 31 expects. With `resetForeignModes` throwing `EAGAIN: write`, and again with `resume` throwing `renderer gone`, the test checks three things. `run` rejects with that error. The last three calls are `reset, resume, release`, and each appears exactly once. `git.tool.restore { reason }` is logged.
  - `bun run check` → exit 0. Biome checked 351 files with no fixes. tsc and knip are clean. 1202 pass, 0 fail.
- **Commit evidence:** `1858b88` `fix(app): restore the terminal even when a restore step throws` (task `P2-G2-T3`). It contains only `src/app/tool-host.ts` and `src/app/tool-host.test.ts`.

**Completion Checklist:**

- [x] Required resolution is implemented.
- [x] Required proof passes.
- [x] Change evidence is recorded.
- [x] Verification evidence is recorded.

### Remediation Group Verification

| Check | Command or method | Result |
|---|---|---|
| App units | `bun test src/app` | `Passed`: exit 0, 31 pass, 0 fail |
| Shell | `bun test test/ui`; `git status --short -- '*.snap'` | `Passed`: exit 0, 160 pass, 0 fail, 63 snapshots. No snapshot changed. |
| Integration | `bun test test/integration` | `Passed`: exit 0, 62 pass, 0 fail |
| Static and unit gate | `bun run check` | `Passed`: exit 0, 1202 pass, 0 fail. Boundaries are included. |
| `test:ci` | `bun run test:ci` | `Passed`: exit 0, 235 pass, 0 fail, 63 snapshots |
| No temporary runner cases | `grep -nE 'case "(gitStatus\|gitReadIndex\|gitStage\|gitBlame\|gitWatch\|runTool)"' src/app/effects.ts` | `Passed`: 6 cases, each with a real body |
| No work-process IDs | `grep` over the added `src` lines for work, requirement, design, verification, and group ids, plus `TODO`, `FIXME`, `console.`, `.only(` | `Passed`: no matches |
| Process hygiene | `pgrep -fl "bun .*so\|git \|lazygit"` before and after | `Passed`: only PID 49530 (the pre-existing sandbox) and `ugrep` processes from other sessions |
| Temp-dir hygiene | Compare `$TMPDIR` listings from before and after the runs | `Passed`: the integration, e2e, and quit suites created `so-it-*`, `so-e2e-*`, and `so-quit-*` dirs during this run. All of them were removed, and no new entries remain. |
| Self-review | `git diff ac457af..1858b88` | `Passed`: the fix changes only how restore runs. The hand-off order, the escape-byte location, `deps.tool` late binding, and the lifecycle and shell changes are as originally reported. |

### Blockers and Unverified Checks

- Blockers: none.
- `V50` (real-PTY hand-off) and `V61` (manual image check after resume) belong to Part 3, as planned.
- A real `EAGAIN` or `EIO` from a non-blocking tty was not reproduced. The failure was simulated with a throwing screen double.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. All four tasks are implemented and committed, `P2-G2-VER1` is fixed, and every task and group check passes.
- **Final report commit:** Returned to the orchestrator after this report is committed.
- **Final commits:** `20d68f2`, `5f94619`, `a56003b`, `03f421d`, `1858b88`
- **Final checks:** `bun run check` → exit 0, 1202 pass; `bun run test:ci` → exit 0, 235 pass; `bun test src/app` → 31 pass; `bun test test/ui` → 160 pass, snapshots unchanged; `bun test test/integration` → 62 pass.
- **Remaining issues:** None in this group. `V50` and `V61` belong to Part 3.
