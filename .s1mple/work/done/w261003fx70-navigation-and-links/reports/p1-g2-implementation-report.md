# P1-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-goal.md`
- **Plan Part:** `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-plan-1-core-models-and-config.md`
- **Group:** `P1-G2` — Configuration, keymap, and display options
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`, `P1-G2-T6`, `P1-G2-T7`
- **Report:** `.s1mple/work/done/w261003fx70-navigation-and-links/reports/p1-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

Each task followed its approach. The RED runs failed for the stated reason, and `bun run check` exited 0 before every commit; the exit code was read directly, not through a pipe.

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G2-T1` | `src/core/config/schema.ts:ConfigSchema` (strict; `leader`, `editor`, `keys`, `filetypes`), `AppConfig`, `defaults`, `KeyBindingsSchema` (module-local); `src/core/config/toml.ts:parseConfig`, `ConfigResult`, `ConfigError`, `BindingSource`, `keyLines`, `issueErrors`, `bindingSources`; `src/core/config/toml.test.ts`; `toml-eslint-parser@1.0.3` pinned in `package.json` and `bun.lock` | RED: `Cannot find module './toml'`. GREEN: `bun test src/core/config/toml.test.ts` → 6 pass (V17 line 7; V18 lines `[1, 3, 4, 6]` with the leader on line 1; V19 valid file with binding lines 13 and 15, and the empty file giving `editor {8, true, true}`). `bun test test/repo.test.ts test/boundaries.test.ts` → 5 pass. `bun install --frozen-lockfile` → exit 0. `bun run check` → exit 0, 489 pass | `c0c13b3` | `Completed` |
| `P1-G2-T2` | `src/core/kernel/vim/keys.ts:splitKeys(seq, leader = " ")` (the `<leader>` entry is removed from `NAMED`); `src/core/kernel/commands/keymap.ts:Keymap` constructor `{ leader }`; `src/core/kernel/commands/defaults.ts:Binding`, `defaultBindings: readonly Binding[]`, `defaultGroups`; `src/core/state/keymap.ts:effectiveBindings`, `keymapFor`; `src/core/state/update.ts:Registries` (`bindings`, `groups`); `src/core/state/keys.ts:handleKeyAction` looks up through `keymapFor`; `src/app/main.ts:registries`; `test/support/state.ts:testRegistries`; `update.test.ts` and `keys.test.ts` bind through `bindings`; new `src/core/state/keymap.test.ts` and `src/core/kernel/commands/keymap.test.ts` | RED: `Cannot find module './keymap'`, and the leader parameter had no effect. GREEN: `bun test src/core/state/keymap.test.ts src/core/kernel/commands` → 7 pass (leader `,`, memo by object identity, scope overrides marked `overridden: true`, default trie unchanged). `bun test src/core/state/keys.test.ts test/vim` → 313 pass. `bun run check` → exit 0, 496 pass | `b7dc38c` | `Completed` |
| `P1-G2-T3` | `src/core/state/types.ts:Action` (`configLoaded`), `Effect` (`loadConfig`); `src/core/state/config.ts:validateBindings`, `onConfigLoaded`, `reloadConfig`; `src/core/state/update.ts:createUpdate` (`configLoaded` case); `src/core/state/commands.ts:EX_ALIASES` (`w`/`write` → `file.save`, `ConfigReload` → `config.reload`), `executeEx` (a typed registered id runs that command), `builtins` (`buffer.write` → `file.save` "Save file", adds `config.reload` "Reload config"); `src/core/state/config.test.ts`; `src/core/state/keys.test.ts` | RED: `Cannot find module './config'`, and the `:w`, `:write`, and `:ConfigReload` tests failed. GREEN: `bun test src/core/state` → 65 pass. The toast reads `config.toml:4: unknown command id "no.such.command" (+2 more)`; at startup `config` is `defaults`, and on reload it is the previous object. `rg '"buffer.write"' src test scripts` → no matches. `bun test test/ui test/integration` → 57 pass. `bun run check` → exit 0, 504 pass | `c0d6895` | `Completed` |
| `P1-G2-T4` | `src/workspace/config-file.ts:xdgDir`, `configPath`, `readConfigTextSync`, `readConfigText`; `src/workspace/log.ts:Logger`, `createLogger`; `src/workspace/config-file.test.ts`; `src/workspace/log.test.ts` | RED: `Cannot find module './log'` and `'./config-file'`. GREEN: `bun test src/workspace/config-file.test.ts src/workspace/log.test.ts` → 6 pass (V31: unset, `""`, and `relative/path` give `~/.config/so/config.toml`, `/abs` gives `/abs/so/config.toml`, a missing file gives `undefined`. V33: no file without `SO_LOG=debug` or with `SO_LOG=info`; with debug, JSON lines in `$XDG_STATE_HOME/so/so.log`, mode `0600`, and a relative `XDG_STATE_HOME` falls back to `~/.local/state`). `bun run check` → exit 0, 510 pass | `02806c5` | `Completed` |
| `P1-G2-T5` | `src/core/kernel/vim/types.ts:VimEnv.tabWidth`; `src/core/kernel/vim/operators.ts:Run.tab`, `atWant`, `shift`; `src/core/kernel/vim/motions.ts:cursorDisplayCol`, `colForDisplay`, `vertical` (all take `tabWidth`; `TABSTOP` removed); `src/core/kernel/vim/engine.ts:handleKey` (sets `run.tab`), `execute`, `cmdlineKey`; `src/core/state/keys.ts:envOf`; `test/vim/vim.test.ts` (`ENV.tabWidth = 8`); `src/ui/editors/text-view.ts` (the `cursorDisplayCol` caller); `src/core/kernel/vim/tab-width.test.ts` | RED: the width-4 cases failed with width 8 behaviour. GREEN: `bun test src/core/kernel/vim/tab-width.test.ts test/vim` → 294 pass. V58 width 4: `j` from `x` lands on `e` (col 4); `>>` on `a` gives `\ta`; `<<` on `\t\ta` gives `\ta`. Width 8: col 5, `\ta`, `\ta`. `rg TABSTOP src/core` → no matches. `bun run check` → exit 0, 513 pass | `e23fd81` | `Completed` |
| `P1-G2-T6` | `src/core/kernel/view/wrap.ts:cellWidth`, `displayWidth`, `wrapLine`, `rowOf`; `src/core/kernel/view/wrap.test.ts`; `src/ui/editors/text-view.ts:gutterWidth`, `paintLine` (`{ leftCol, endCol?, tabWidth, cursorline }`), `EditorView.show` (wrap `topLine`/`skipRows`), `EditorView.renderSelf` (wrapped rows, number modes, `›`), `layout` (text width); `TABSTOP` and `GUTTER` removed; `test/support/ui.ts:MountOptions.config` (dispatches `configLoaded` before attach); `test/ui/editor-options.test.ts` | RED: `Cannot find module './wrap'`, confirmed by hiding the module after it was written first (see Deviations, item 7). The six `editor-options` cases failed before the view change. GREEN: `bun test src/core/kernel/view/wrap.test.ts` → 7 pass (V57: `[0]` for a short line, rows ending after a space and ≤ 80, a 200-character word at `[0, 80, 160]`, no tab straddling at widths 8–11, a lone wide tab, `rowOf`, rejoin). `bun test test/ui/editor-options.test.ts` → 7 pass (V59 without the preview: 4+ wrapped rows with a blank continuation gutter, cursor on the last row after `$`, `j` onto `next`; wrap off gives one row with `›` and scrolls to the cursor; absolute numbers; `12000` unclipped; width-4 `x` at text column 4; a line taller than the window). `bun test test/ui` → 42 pass, 15 snapshots unchanged. `bun run check` → exit 0, 520 pass | `9549dda` | `Completed` |
| `P1-G2-T7` | `src/app/effects.ts:RunnerDeps` (`logger`, `configPath`), `run` (`loadConfig` case; failures logged with paths and reasons); `src/app/main.ts:loadStartupConfig`, `main` (logger, `configPath`, startup `configLoaded` before `shell.attach`); `src/ui/shell.ts:createShell` (`escTimeoutMs: () => …`); `src/ui/input.ts:createKeyNormalizer` (`number \| (() => number)`, read per Esc); `src/ui/theme.ts:themeOf` (`color = "never"` → `nocolor`); `test/integration/helpers.ts`, `src/app/effects.test.ts` (new deps); `src/ui/input.test.ts`; `test/integration/config.test.ts` | RED: reloads timed out because the runner had no `loadConfig` case; four of six failed. GREEN: `bun test test/integration/config.test.ts` → 7 pass (V39: (b) `<leader>w` saves to disk; (c) `config.toml:7:` toast and `defaults`; (f) per scope; reload applies the binding, leader `,`, `escTimeoutMs` 300 (Esc ≥ 280 ms), theme `light`, and wrap off with `›` in both windows; an invalid reload keeps the config object and the previous binding; a missing file on reload gives the defaults; `color = "never"` paints only default colours). `bun test src/app/effects.test.ts` → 14 pass (one `configLoaded` for a file, a missing file, or a read error). `bun test src/ui/input.test.ts` → 7 pass. `bun run test:ci` → 79 pass. `bun run check` → exit 0, 522 pass | `3ae5716` | `Completed` |

### Group Change Range

- **Starting commit:** `0d17997`
- **Final commit:** `3ae5716`
- **Remaining group changes:** None. `git status --short` was empty after `3ae5716`. The range is `0d17997..3ae5716`: 44 files changed, 1834 insertions, 123 deletions.

### Group Verification

- `bun run check` → `Passed` — exit 0 in 2.8 s wall time; Biome, `tsc`, and knip are clean (zero knip findings, so `toml-eslint-parser` is used); 522 pass, 0 fail across 41 files.
- `bun test src/core/config src/core/state src/workspace src/core/kernel` → `Passed` — 154 pass, 0 fail across 24 files. This covers V17–V19, V20 without `,ff`, V22 (`:w`), V31, V33, V57, and V58.
- `bun test test/integration/config.test.ts test/ui/editor-options.test.ts` → `Passed` — 14 pass, 0 fail. This covers V39 and V59 without the picker preview.
- `bun run test:ci` → `Passed` — exit 0; 79 pass, 0 fail across 11 files, 17.3 s.
- `bun test test/vim` → `Passed` — 291 pass. The recorded cases are unchanged: `git diff 0d17997..HEAD -- test/vim/expected.json test/vim/cases.ts` is empty.
- `bun test test/repo.test.ts` → `Passed` — 3 pass.
- `bun install --frozen-lockfile` → `Passed` — exit 0, "Checked 112 installs across 188 packages (no changes)". This covers V55.
- Obsolete-reference sweep over `src`, `test`, and `scripts` → `Passed` — no `Bun.TOML`, no `reg.keymap` or `keymap: Keymap`, no `"<leader>": " "`, no `"buffer.write"`, and no `TABSTOP` or `GUTTER`.
- Group diff self-review (`git diff 0d17997..HEAD`) → `Passed`:
  - no work-process identifiers on added lines in `src`, `test`, or `scripts`;
  - `toml-eslint-parser` is imported only by `src/core/config/toml.ts`;
  - `@opentui/*` is imported only under `src/ui`;
  - `src/core/kernel` imports no packages;
  - `update` stays pure, and every failure path of `loadConfig` dispatches exactly one `configLoaded`.

### Deviations and Remaining Issues

1. **`ConfigResult` uses `bindings`, not `sources`.** Design section 6 names the field `sources`, but section 7 (`toml.ts`) and the plan name it `bindings`. The section 7 shape is implemented.
2. **The leader is stored as its key.** The schema keeps the design's `refine` and adds `.transform((k) => splitKeys(k)[0])`, so `leader = "<space>"` is stored as `" "`. `Keymap` and `splitKeys` take a `Key`, and the design's `new Keymap({ leader: config.leader })` needs the key itself rather than the notation. `defaults.leader` is `" "`.
3. **`defaultGroups` is `{}`.**
   - The plan limits it to existing groups, and DI1 has no labelled prefix: `<leader>` holds only the direct `e`.
   - The design's final groups (`<leader>f/s/b/w/u`) belong with the DI2 commands that P2-G2 adds.
4. **`Logger` has `info` and `error` only.** This follows the design's section 7 shape. The plan's preview also listed `debug`. The log lines carry `time`, `level`, and `event` plus scalar fields; `time`, `level`, and `event` cannot be overwritten by a field.
5. **Unreadable config files.** A config file that exists but cannot be read (for example `EACCES`, or a directory) becomes `{ ok: false, errors: [{ line: 1, message }] }`.
   - At startup this happens in `main.ts:loadStartupConfig`, and in the `loadConfig` runner case on reload.
   - The defaults apply at startup (reload keeps the current config), with one error toast, so `loadConfig` always answers with exactly one action.
   - A missing file is still not an error. At startup the defaults stay with no action; on reload the defaults apply, because `parseConfig("")` gives them.
6. **V39 scenario (f) uses `window.vsplit` as the markdown-scope override.**
   - The parent scenario binds `link.backlinks`, which is registered only by P2-G2 (`linkCommands`). `validateBindings` would reject it here.
   - The per-scope mechanism under test is the same: the note runs the markdown binding, and `sync.ts` saves through the global one.
   - P2-G2-T5/T7 cover V22 with `link.backlinks`.
   - V20's `,ff → file.find` case is left to P2-G2-T4, as assigned. The leader cases here use `,e` and `,w`.
7. **TDD order slip in T6.** `wrap.ts` was written before its test was run. The RED state was then confirmed by temporarily moving `wrap.ts` aside: `Cannot find module './wrap'`, 0 pass, 1 fail. Then it was restored and passed with 7 tests. The UI tests were run RED before the view change.
8. **Test corrections during RED.** These expectations were wrong, not the code, and the design text decided each one:
   - `toml.test.ts`: a dotted key placed after `[preview]` belongs to that table.
   - `tab-width.test.ts`: with width 4, `>>` on `a` gives `\ta`, per REQ10.
   - `editor-options.test.ts`: the cursor starts on the tab, so the test presses `l` first, per V58's "cursor on x".
   - `config.test.ts`: a vsplit tree is `"row"`.
9. **Decisions later groups must preserve:**
   - `validateBindings` accepts the modes `normal`, `insert`, `visual`, `visualLine`, `cmdline`, and `explorer`, and reports every problem of a binding, ordered by line.
   - `effectiveBindings` compares sequences after `splitKeys(seq, config.leader)`, so `" e"` replaces `<leader>e`.
   - `keymapFor` memoizes per `(Registries, AppConfig)` object pair.
   - `RunnerDeps` gained only `logger` and `configPath`. `index` and `statePath` come with their effects in P2.
   - `createUpdate` keeps its DI1 structure plus the `configLoaded` case. The `step`/`sessionChanged` wrapper and `onTimerAction` belong to P2-G2.
   - With wrap on, `EditorView.show` places an Insert cursor that sits just past a full row at the start of the next row.
10. **`src/core/state/keys.test.ts` was touched by T2 and T3.** T2 moved the file-type binding test to `bindings`. T3 updated the `:w` test and added the `:write`/`:file.save` and `:ConfigReload` tests.

## Remediation

- **Verification reports:** None yet.
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all seven tasks are committed and every group check passed.
- **Final report commit:** Returned to the orchestrator.
- **Final commits:** `c0c13b3`, `b7dc38c`, `c0d6895`, `02806c5`, `e23fd81`, `9549dda`, `3ae5716`
- **Final checks:**
  - `bun run check` exit 0 (522 pass, 2.8 s, zero knip findings);
  - unit suites 154 pass;
  - `config` and `editor-options` suites 14 pass;
  - `bun run test:ci` 79 pass;
  - `test/vim` 291 pass with recordings unchanged;
  - `test/repo.test.ts` 3 pass;
  - frozen install no changes.
- **Remaining issues:** None in scope. These are handed off as assigned: V20 `,ff → file.find` (P2-G2-T4), V59 picker preview (P2-G2-T4), V22 apart from `:w` (P2-G2-T5), and the design's final `defaultGroups` (P2-G2).
