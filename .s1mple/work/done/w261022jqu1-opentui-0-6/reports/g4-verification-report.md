# W261022JQU1 G4 Verification Report

## Scope

- **Scope:** `G4`
- **Tasks:** `G4-T1`
- **Change range:** `fa23a8d..0d0832f`
- **Report:** `.s1mple/work/active/w261022jqu1-opentui-0-6/reports/g4-verification-report.md`

## Status

`Failed`

Every assigned row is met and every group check passes apart from watcher failures that fail the same way on master (`A10`). The NO_COLOR fix works: 0/30 failures on this tree. Two Minor findings remain, both in `createRenderer`. First, the backdrop now makes OpenTUI paint one extra full-screen frame before attach on every start, in every colour mode, and neither the code comment nor the implementer's return says so. Second, the error path drops OpenTUI's guard around `destroy()`.

## Coverage

| REQ | UDES or DES | V | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1` | `DES1` | `V1` | `package.json` pins `"@opentui/core": "0.6.6"`, `"@types/bun": "1.4.3"`, `"knip": "6.41.0"`; `.s1mple/docs/languages/typescript.md` tool table matches; `test/ui/editor-options.test.ts` reads cells through `buf.withBuffers` | `Met` |
| `REQ1` | `DES1` | `V6` | `src/ui/shell.ts:createRenderer`, `Backdrop`, `createShell().attach`; `bun run test:ci` and the build pass apart from master-shared watcher cases | `Met` |
| `REQ4` | `DES1` | `V6` | Every `test/ui` and `test/e2e` case passes. The six failures are watcher or external-change cases; four of them fail by the same name on master, and two pass alone on both trees | `Met` |

## Checks

| Check | Command or method | Actual result | Result |
|---|---|---|---|
| `V1` / group check | `bun run check` | Biome clean (one `noFlatMapIdentity` info, not an error), tsc clean, knip clean; unit tests 2019 pass, 1 fail: `src/workspace/watcher.test.ts` "dot entries other than .git are reported while dotfiles are shown". This is one of the watcher tests `A10` excludes | `Passed` |
| `V6` / group check | `bun run test:ci` | 432 pass, 6 fail: pdf "changed on disk", save-safety "external edit reloads", gitignored "collapsed … never reach the app" and "expanded … follows its changes", bases-write "card move after an external edit", integration git "external commit refreshes". All are watcher or external-change cases; every `test/ui` and `test/e2e` case passed | `Passed` |
| `A10` spot check | Same suite on `.tmp/base` (master `55b3044`, OpenTUI 0.5.14), `bun test --parallel --timeout=20000 test/ui test/integration test/e2e` | 429 pass, 6 fail. Four have the same names as here: "expanded gitignored folder", "external edit reloads", "card move after an external edit", "external commit refreshes". The others are the "H lists dot entries" watcher case and the "stopping kills a server" LSP timing case | `Passed` |
| `A10` spot check | `bun test --timeout=20000` on `pdf`, `save-safety`, `gitignored`, and integration `git` suites, run alone on both trees | 18 pass, 0 fail on this tree and on `.tmp/base`, so the two failures that only show up here ("PDF changed on disk", "collapsed gitignored folder") are parallel-load timing, not 0.6 | `Passed` |
| Group check | `bun run build && dist/so --version` | `so 0.0.0` | `Passed` |
| NO_COLOR case | `.tmp/nocolor-loop.sh <tree> 30` | `0/30 failed` | `Passed` |
| Startup frames | `.tmp/g4v-frames.ts`: PTY run at 100×30 that counts synchronized frames before the first frame showing `NOTES`; master `.tmp/base`, pre-fix `832e2f1` archive, HEAD | Frames painted before attach: master 0/10, pre-fix 0/12, HEAD 12/12 (colour and NO_COLOR), each 3533 bytes with 0 colour escapes. Total startup bytes in colour mode were 9537 before the fix and 12829 after | `Passed` (see `G4-VER1`) |
| `firstFrame` bench | `bun test/bench/startup.bench.ts --metric firstFrame`, run 5 times per tree | HEAD median 238.1 ms, pre-fix 237.7 ms; target 300 ms | `Passed` |

**Is constructing the renderer directly equivalent to `createCliRenderer`?** Compared with OpenTUI 0.6.6's `createCliRenderer2` (`node_modules/@opentui/core/chunk-bun-6qjat6qa.js:21172`):

| Aspect | `createCliRenderer` | `createRenderer` | Same? |
|---|---|---|---|
| stdin/stdout | `config.stdin ?? process.stdin` / `stdout` | `process.stdin` / `process.stdout` | Yes, since so passes neither |
| Size | `stdout.columns \|\| config.width \|\| 80` | `process.stdout.columns \|\| 80` | Yes, since `RENDERER_OPTIONS` has no width or height |
| Options | `config` as given | `RENDERER_OPTIONS`, `exitSignals: []`, `kittyImageTransport: "file"` when `imageFiles` is set | Yes |
| Process listeners | Registered in the `CliRenderer` constructor (`:21604`–`:21650`) | The same constructor | Yes |
| Setup failure | `destroy()` inside `try/catch`, then `await closed.catch(...)`, then rethrow | `destroy()` unguarded, then `await closed.catch(...)`, then rethrow | No (`G4-VER2`) |
| `--delay-start` | Waits 5 s | Dropped | Unused by so; recorded by the implementer |

**Does `loop()` wait for the setup transition?** Yes. `setupTerminal()` calls `trackNativeTerminalTransition(...)` synchronously before its first `await`, so `nativeTerminalTransition` is already set when `Backdrop` is added (`:22968`, `:23041`). `loop()` then waits on it before painting the scene (`:24239`, and again at `:24285`).

**Simpler fixes:** OpenTUI 0.6.6's `CliRendererConfig` has only `backgroundColor` and no foreground option, so no renderer option removes the white clear foreground. Attaching the views before setup ends would mean moving `createShell` and the store wiring in `src/app/main.ts` ahead of the `await`, which is a larger change. The backdrop is the smallest fix that is reliable.

## Integration

Not applicable — group scope

## Findings

### G4-VER1 — Minor — behaviour/documentation — The backdrop adds a pre-attach frame on every start, which nothing records

- **Builds:** `G4-T1`, `REQ1`, `V6`
- **Evidence:** `src/ui/shell.ts:103`–`106`, the doc comment on `createRenderer`:

  ```ts
  * A capability reply during terminal setup requests a frame that paints as
  * soon as setup ends, before the shell attaches. ... so that frame paints the
  * backdrop.
  ```

  The comment says only a capability reply causes this frame. In fact `renderer.root.add(new Backdrop(renderer))` (`src/ui/shell.ts:124`) requests a frame itself, so a full-screen frame of default-colour spaces paints before attach on every start. Measured at 100×30: 12/12 HEAD runs (colour and NO_COLOR) painted a 3533-byte pre-attach frame, against 0/12 on `832e2f1` and 0/10 on master. Colour-mode startup output grew from 9537 to 12829 bytes. The implementer's "Deviations and Remaining Issues" does not mention it.
- **Impact:** Nothing visible changes. The frame is blank in default colours on an already-cleared alternate screen, and `firstFrame` is unchanged at a 238 ms median. But every start in every colour mode now sends one extra screen of output (about 3.5 KB at 100×30, growing with terminal size), which departs from the Goal's "same bytes", and the comment misleads anyone who works on the startup path next.
- **Resolution:** Correct the `createRenderer` doc comment: adding the backdrop requests a frame, so one blank default-colour frame paints before attach on every start. Then record this byte difference as a deviation in the ship's evidence. Another valid fix is to add the backdrop only when the startup colour mode is `nocolor`, if that mode is known before `createRenderer`.
- **Proof to close:** The comment matches the measured behaviour, and the deviation is listed in the ship evidence, or a PTY run shows no pre-attach frame in colour mode. The NO_COLOR loop still shows 0 failures in 20 or more runs.

### G4-VER2 — Minor — failure behaviour — The setup-failure path calls `destroy()` without OpenTUI's guard

- **Builds:** `G4-T1`, `REQ1`
- **Evidence:** `src/ui/shell.ts:127`–`131`:

  ```ts
  } catch (e) {
    renderer.destroy();
    await renderer.closed.catch(() => {});
    throw e;
  }
  ```

  OpenTUI's `createCliRenderer` (`chunk-bun-6qjat6qa.js:21184`–`21191`) wraps `renderer.destroy()` in `try { … } catch (destroyError) { console.error(...) }` before awaiting `closed`.
- **Impact:** If `destroy()` throws on a partly set-up renderer, its error replaces the setup error that `main` reports. `closed` is then never awaited, so the process can exit before the terminal is restored, which `DES6` exists to prevent. The case is unlikely, but the fix was written to match `createCliRenderer` and this is the one place where it does not.
- **Resolution:** Wrap `renderer.destroy()` in `try/catch` as OpenTUI does, and keep the `await renderer.closed.catch(() => {})` and the rethrow of the original error.
- **Proof to close:** Review shows the guarded call; `bun run check` stays clean.

## Test Coverage

- **Covered:** NO_COLOR startup through `test/e2e/restore.test.ts` "NO_COLOR output has no colour escape sequences" (0/30 failures). The backdrop is removed before the views appear, shown by every `test/ui` and `test/e2e` screen assertion passing. Wide-character wrapping is covered through `withBuffers` in `test/ui/editor-options.test.ts`.
- **Missing:** No test asserts there is no frame (or only a blank one) before attach in colour mode. The setup-failure path of `createRenderer` (destroy, then wait for `closed`) is not tested. Both are low risk.
- **Low-value:** None

## Scope Changes

`createRenderer` now builds `CliRenderer` itself instead of calling `createCliRenderer`, and it adds a `Backdrop` renderable. This is in scope for `G4-T1` ("fix what the full suites still show broken"). The NO_COLOR flake is owned by G4 in the ship's Blockers, Deviations, and Replacements section. Dropping `--delay-start` is recorded by the implementer. The extra startup frame is not recorded (`G4-VER1`).

## Blockers and Unverified Items

- The first frame was not checked by eye on a real terminal (kitty, Ghostty, herdr). The pre-attach frame was checked byte by byte in a headless xterm PTY only. `V7` (live smoke) is outside G4's assigned rows.
- `color = "never"` was not run end to end, because the PTY harness writes extra config under its `[preview]` table, so a top-level `color` key cannot be added. It uses the same `nocolor` theme as `NO_COLOR` (`src/ui/theme.ts:364`), and the backdrop always paints in default colours whatever the theme.
