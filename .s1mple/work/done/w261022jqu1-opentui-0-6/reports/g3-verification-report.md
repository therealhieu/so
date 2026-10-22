# W261022JQU1 G3 Verification Report

## Scope

- **Scope:** `G3`
- **Tasks:** `G3-T1`, `G3-T2`
- **Change range:** `f751f27..bf6ca37`
- **Report:** `.s1mple/work/active/w261022jqu1-opentui-0-6/reports/g3-verification-report.md`

## Status

`Failed`

Every assigned row is met and every check passes, but one Minor finding remains: a rejected suspend leaves interrupts held and the shell never paints again (`G3-VER1`).

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ3` | `DES5` | `V4` | `src/ui/shell.ts:393` `suspend` sets `suspended`, clears image slots, awaits `renderer.suspend()`; `src/ui/shell.ts:400` `resume` awaits `renderer.resume()`, then clears `suspended`, invalidates sized text, repaints; `src/app/tool-host.ts:createToolHost` awaits flush → hold → suspend → tool → reset → resume → release; a failed restore step is logged as `git.tool.restore` and rethrown | `Met` |
| `REQ3` | `DES7` | `V4` | `test/support/ui.ts:112` `await t.renderer.setupTerminal()`; `test/ui/git.test.ts` and `test/ui/sized-text.test.ts` await `shell.suspend()`/`resume()`; `src/app/tool-host.test.ts` doubles are async | `Met` |
| `REQ3` | `DES5` | `V5` | Hand-off in the PTY: "the editor returns intact after the git tool is killed" passes | `Met` |
| `REQ3` | `DES6` | `V5` | `src/ui/shell.ts:418` `closed()` maps `renderer.closed` to resolve, logging a rejection as `terminal.closeFailed`; `src/app/lifecycle.ts:82` awaits it after `destroy()` and before stderr and `exit` on the single `shutdown` path that signals, uncaught errors, unhandled rejections, and `exitNow` all share; `src/app/main.ts` passes `logger` | `Met` |

## Checks

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| G3 group check | `bun test --timeout=20000 test/ui/git.test.ts test/ui/sized-text.test.ts test/integration` | 157 pass, 0 fail, 23 files | `Passed` |
| `V4` | `bun test --timeout=20000 test/ui/git.test.ts` | 22 pass, 0 fail | `Passed` |
| `V5` | `bun test --timeout=20000 test/e2e` | 34 pass, 0 fail | `Passed` |
| G3 group check | `bun run check` | Biome (1 warning, 2 infos in files G3 did not touch), tsc, and knip clean; 2014 pass, 5 fail. The 5 failures are the watcher tests in `src/workspace/watcher.test.ts` (3) and `src/workspace/git-watcher.test.ts` (2), expected under `A10` | `Passed` |
| `G3-T1`/`G3-T2` task check | `bun test src/app` | 61 pass, 0 fail | `Passed` |
| Exit bound | Read `@opentui/core` 0.6.6 `NativeSession` and `CliRenderer.destroy` | `closeTimeoutMs` defaults to 1000 (`chunk-bun-6qjat6qa.js:17073`); after the deadline `turn()` throws "graceful close timed out", which rejects `closed`, and `Shell.closed()` logs it. `so` does not override `closeTimeoutMs`. Scratch measurement: `closed` settled 1 ms after destroying while suspended and 23 ms after destroying while running | `Passed` |
| Exit timing | Scratch PTY run of the NO_COLOR scenario, 25 runs | `:q` to process exit took 107–134 ms, against 84–97 ms before G3 | `Passed` |
| DES6 proof | `test/e2e/restore.test.ts` on the pre-G3 tree (`git archive f751f27`) | "a failure before the first frame restores the terminal and says why" fails there (`so: Error: …` lost to the alternate screen), so the e2e suite protects the new await | `Passed` |

## Integration

Not applicable — group scope

## Findings

### G3-VER1 — Minor — failure behavior — A rejected suspend leaves interrupts held and the shell frozen

- **Builds:** `REQ3`, `DES5`, `G3-T1`
- **Evidence:** `src/app/tool-host.ts:52` holds interrupts and then awaits the suspend outside the `try` whose `finally` runs `restore(release)`:

  ```ts
  const release = d.holdInterrupts();
  await d.screen.suspend();
  try {
  ```

  `src/ui/shell.ts:394` sets `suspended = true` before `await renderer.suspend()` and never clears it on rejection. On 0.6.6, `renderer.suspend()` throws when the terminal is not set up or a transition is pending, and its returned promise rejects when `nativeSession.suspend()` fails. A scratch test (`.tmp/`, removed) with a suspend that rejects recorded `hold → suspend` and no `release`; on a mounted shell whose `renderer.suspend` threw at its guard, the renderer stayed running (`_controlState` `idle`) but typing `:echo` painted nothing, while the control case painted `:echo`.
- **Impact:** After a failed suspend, `run` rejects and `toolExited` reports the failure, but no frame is ever painted again and SIGINT is ignored for the rest of the process. The user sees a frozen editor and must type `:q` blind or kill `so`. The path is rare in production, because hand-offs are serialized and each resume is awaited, but 0.6 made suspend a fallible async step and the hand-off has no test for it.
- **Resolution:** A suspend that throws or rejects releases interrupts exactly once and leaves the shell painting. Put the suspend inside the guarded block or release on its failure, and have `Shell.suspend` clear `suspended` when `renderer.suspend()` throws before suspending. A suspend that rejects after the renderer suspended may also need a resume attempt.
- **Proof to close:** A `src/app/tool-host.test.ts` case with a rejecting `suspend` shows `release` once and the run rejecting or failing. A component case shows that the shell paints a store change after `renderer.suspend` throws. `bun test src/app` and the G3 group check pass.

## Test Coverage

- **Covered:** The four hand-off cases in `test/ui/git.test.ts` (pre-suspend frame then silence, images redrawn once after resume, destroy while suspended) and the sized-text resume case now run real 0.6 transitions on a set-up test renderer. `src/app/tool-host.test.ts` pins step order and restore failures. The e2e exit paths cover the restore and the stderr-after-restore order: the startup-failure case fails without the new await. The config integration suite covers the "no paint after destroy" guard, which is needed because `setCursorPosition` calls the closed native session (`chunk-bun-6qjat6qa.js:23757`) and `lifecycle.ts` now awaits after `destroy()` while the store can still change. `requestRender` already returns on a destroyed renderer.
- **Missing:** A failing or rejecting suspend (`G3-VER1`). "destroying the shell while suspended restores the terminal once" asserts only `isDestroyed`, not the restore bytes or that the restore happens once. It was the same before G3, and the Test Strategy keeps existing suites unchanged. `src/app/lifecycle.test.ts` does not check that `closed()` is awaited before `exit`; the e2e startup-failure case covers that order instead.
- **Low-value:** None

## Scope Changes

- **Unplanned:** The paint skips once the shell is destroyed (`src/ui/shell.ts:333`). It is sound and needed for the reasons in Test Coverage.
- **Logger seam:** `ShellDeps.logger` is an optional structural `{ error }`, so `src/ui` does not import `src/workspace`, which follows the import boundaries. When it is omitted, a close failure is silent; production passes it.
- **Test mount:** `mountShell` now calls `setupTerminal()`. This turns on the renderer's native capability query, pixel-resolution query, and 5 s capability timer on test streams. The test renderer stays in `main-screen` mode, and tests still inject `capabilities`. G3 changed no component assertion except to await suspend and resume, and the suites pass, so the component tests prove the same behaviour plus the real transition order.
- **Teardowns:** `mountShell().destroy()`, `test/ui/sized-text.test.ts:223`, and `test/ui/shell.golden.test.ts` still destroy without awaiting `closed()`. Every production caller awaits suspend, resume, and close. OpenTUI attaches a catch to `nativeClosed`, so these teardowns raise no unhandled rejection, and no suite showed a leak.

## Blockers and Unverified Items

- The intermittent e2e "NO_COLOR output has no colour escape sequences" failure is not caused by G3. It failed 4 of 55 runs at `bf6ca37` and 3 of 40 scratch runs on the pre-G3 tree. Both trees show the same signature: the first frame after the kitty probe is painted with `ESC[38;2;255;255;255m` on 30 cells, before any suspend or exit. A `--rerun-each` run of the pre-G3 tree passed 55 of 55, so the startup race shows only under some timing.
- The real-terminal hand-off (`V7`) belongs to overall verification and was not run.
