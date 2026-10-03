# P1-G2 Verification Report

## Scope

- **Group:** `P1-G2` — Configuration, keymap, and display options
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`, `P1-G2-T6`, `P1-G2-T7`
- **Report:** `.s1mple/work/done/w261003fx70-navigation-and-links/reports/p1-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261003fx70-navigation-and-links/reports/p1-g2-implementation-report.md`

Verified range `0d17997..3ae5716` (task commits `c0c13b3`, `b7dc38c`, `c0d6895`, `02806c5`, `e23fd81`, `9549dda`, `3ae5716`; 44 files, +1834/−123). Each commit body carries its `Task:` trailer. Checks ran once at `HEAD` `5ac78dd` (the implementation report commit; no code change after `3ae5716`).

## Status

`Passed`

Every assigned `REQ → DES → S → V` chain maps to code and to a test that proves it. All seven group checks pass, and there are no findings. The cases handed to later groups are excluded as assigned: V20 `,ff → file.find` and the V59 picker preview go to P2-G2-T4, and V22 apart from `:w` goes to P2-G2-T5.

## Assigned Traceability

- **System Design:** `REQ1, REQ2, REQ7@R2, REQ10 → DES1 (configLoaded, loadConfig), DES7, DES11 → S13, S14, S19, S21 → V17, V18, V19, V20 (except ",ff → file.find"), V22 (":w → file.save" only), V31, V33, V39, V55, V57, V58, V59 (except the picker preview)` (W261003FX70-prefixed; plan part 1, P1-G2 Traceability)
- **UI Design:** `None`
- **Roadmap binding:** RM261003ABZP-PH1@R2, DI2@R2 (`w261003fx70-discuss-context.md`, Roadmap Binding).
  - No cross-work gate is due for this group. The plan's P1-G2 Cross-Work Gates says "None": G1 was confirmed before P1-G1, and G2/G3 are handled in P3-G1.
  - Shared contracts are intact. `test/boundaries.test.ts` passes inside `bun run check`, and `toml-eslint-parser` is confined to `src/core/config/` (`PACKAGE_HOMES`, line 52). The DI1 suites pass unchanged (`bun run test:ci`: 79 pass, 15 snapshots). The recorded vim cases are unchanged: `git diff 0d17997..3ae5716 -- test/vim/expected.json test/vim/cases.ts` is empty.
  - Parent sources and bindings were read only.

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ2, REQ7 → DES7 → S13 → V17` | None | A TOML syntax error names its line | `src/core/config/toml.ts:parseConfig` maps the `toml-eslint-parser` error's `lineNumber` to the line (minimum 1) | `Satisfied` |
| `REQ7, REQ10 → DES7, DES11 → S13, S21 → V18` | None | Unknown keys and bad values give line-numbered errors in source order, and the leader must be one key | `src/core/config/schema.ts:ConfigSchema` uses `z.strictObject` at every level, `editor.tabWidth` 1–16, and a `leader` `refine` through `splitKeys`. `toml.ts:keyLines`, `issueErrors` (one error per unrecognized key) and the sort by line. A probe also confirmed the lines for `[[keys]]`, an empty record key, an inline table and a duplicate key | `Satisfied` |
| `REQ7, REQ10 → DES7, DES11 → S13, S21 → V19` | None | A valid file parses with binding lines, and an empty file gives the defaults (`editor` 8/true/true) | `schema.ts:defaults = ConfigSchema.parse({})`; `toml.ts:bindingSources`. `ConfigResult` uses `bindings` (section 7 and the plan) rather than section 6's `sources` | `Satisfied` |
| `REQ7 → DES7 → S13 → V20` (except `,ff`) | None | Bindings to an unknown command id, file type or mode are rejected. One toast shows the first error and `(+N more)`. Startup falls back to the defaults and a reload keeps the current config. The leader is configurable, and `keymapFor` memoizes per config | `src/core/state/config.ts:validateBindings` (modes: the vim modes plus `explorer`), `onConfigLoaded`; `src/core/state/keymap.ts:effectiveBindings` (a config entry replaces the same scope and sequence after leader expansion, with `overridden: true`), `keymapFor` (`WeakMap<Registries, WeakMap<AppConfig, Keymap>>`); `src/core/kernel/vim/keys.ts:splitKeys(seq, leader)` (the `NAMED` `<leader>` entry is removed); `src/core/kernel/commands/keymap.ts:Keymap({ leader })` | `Satisfied` |
| `REQ1 → DES7 → S15 → V22` (`:w` only) | None | `:w` and `:write` run `file.save`, and a typed registered id runs that command | `src/core/state/commands.ts:EX_ALIASES` (`w`/`write` → `file.save`, `ConfigReload` → `config.reload`), the exact-match id path in `executeEx` (E492 kept for unknown words), and `builtins` (`file.save` "Save file", `config.reload`). No `"buffer.write"` remains | `Satisfied` |
| `REQ1 → DES1 → S1` (`configLoaded`, `loadConfig`) | None | The protocol additions compile under the exhaustive switch, and `loadConfig` answers with exactly one action | `src/core/state/types.ts:Action`, `Effect`; `src/core/state/update.ts:createUpdate` case `configLoaded`. In `src/app/effects.ts:run`, the `loadConfig` case maps a read error to `{ ok: false, errors: [{ line: 1 }] }` and dispatches once | `Satisfied` |
| `REQ7 → DES7 → S13 → V31` | None | The config path follows XDG: an empty or relative value is ignored, and a missing file reads as `undefined` | `src/workspace/config-file.ts:xdgDir`, `configPath`, `readConfigTextSync`, `readConfigText` (ENOENT → `undefined`; other errors throw) | `Satisfied` |
| `REQ7 → DES7 → S14 → V33` | None | Only `SO_LOG=debug` writes JSON lines to `$XDG_STATE_HOME/so/so.log` (mode 0600), with no note text | `src/workspace/log.ts:createLogger` (otherwise a no-op; directory 0700, file 0600; scalar fields only). The call sites in `effects.ts` and `main.ts` log only paths, op kinds, error counts and reasons | `Satisfied` |
| `REQ7, REQ10 → DES7, DES11 → S13, S21 → V39` | None | Startup and reload apply bindings, `escTimeoutMs`, theme, `color = "never"` and wrap. An invalid file gives defaults at startup and keeps the previous config on reload | `src/app/main.ts:loadStartupConfig` dispatches `configLoaded` before `shell.attach`, and dispatches nothing for a missing file. `src/ui/shell.ts` passes `escTimeoutMs: () => store.get().config.escTimeoutMs`. `src/ui/input.ts:createKeyNormalizer` reads `number \| (() => number)` at each Esc. `src/ui/theme.ts:themeOf` gives `nocolor` for `color = "never"` | `Satisfied` |
| `REQ2 → DES7 → S19 → V55` | None | `toml-eslint-parser` is pinned exactly, imported only from its home, and used, with a frozen lockfile | `package.json` `"toml-eslint-parser": "1.0.3"`; `bun.lock` entry; imported only by `src/core/config/toml.ts`; knip is clean | `Satisfied` |
| `REQ10 → DES11 → S21 → V57` | None | Row starts break after whitespace, or at the width when no blank fits. No character straddles two rows, and `rowOf` finds the row holding a column | `src/core/kernel/view/wrap.ts:cellWidth`, `displayWidth`, `wrapLine`, `rowOf` (no imports, so the kernel rule holds). A probe at widths 1–3 with tab widths 8 and 16 terminates with valid starts | `Satisfied` |
| `REQ10 → DES11 → S21 → V58` | None | The tab width drives `j`/`k` display columns and the `>>`/`<<` shifts, and `TABSTOP` is gone | `src/core/kernel/vim/types.ts:VimEnv.tabWidth`; `operators.ts:Run.tab`, `shift`, `atWant`; `motions.ts:cursorDisplayCol`, `colForDisplay`, `vertical`; `engine.ts:handleKey` sets `run.tab`; `src/core/state/keys.ts:envOf` reads `s.config.editor.tabWidth` | `Satisfied` |
| `REQ10 → DES11 → S21 → V59` (except preview) | None | Painted frames honour wrap with a blank continuation gutter, the `›` overflow marker, absolute or relative numbers, a gutter that never clips, and tab width. Frames with default options equal DI1's | `src/ui/editors/text-view.ts`: `gutterWidth`, `paintLine` (`leftCol`, `endCol`, `tabWidth`), `EditorView.show` (wrap-aware `topLine`/`skipRows`), `EditorView.renderSelf` (one or more rows per `RenderLine`, number on row 0 only, `›` when wrap is off). `TABSTOP` and `GUTTER` are removed. The existing UI goldens are unchanged and pass | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V17` | `S13` | `DES7` | `bun test src/core/config` (in the units run); `toml.test.ts` "a syntax error names its line" | `e = = 5` on line 7 gives one error with `line: 7` | `Passed` |
| `V18` | `S13, S21` | `DES7, DES11` | `toml.test.ts` "unknown keys and bad values name their lines in order" and "unknown top-level tables…" | Lines `[1, 3, 4, 6]` with the leader first and `unknown key "editor.tabwidth"`. `daily`, `preview` and `filetypes.markdown.colour` are reported at lines 2, 3 and 7 | `Passed` |
| `V19` | `S13, S21` | `DES7, DES11` | `toml.test.ts` "a valid file parses with binding lines", "an empty file gives the defaults" | The full expected config. Bindings sit at lines 13 and 15, and the markdown one carries its file type. `""` gives `defaults`, and `defaults.editor` is `{8, true, true}` | `Passed` |
| `V20` (except `,ff`) | `S13` | `DES7` | `src/core/state/config.test.ts`, `src/core/state/keymap.test.ts`, `src/core/kernel/commands/keymap.test.ts` | The toast reads `config.toml:4: unknown command id "no.such.command" (+2 more)`. Startup gives `toBe(defaults)`, and a reload keeps `toBe(loaded.config)`. The bad file type and bad mode are reported at their binding lines (7 and 9 in the fixture). Leader `,` maps `,e`/`,w`. `keymapFor` returns the same object for the same config and a new one for a new config. Overrides are marked `overridden: true` | `Passed` |
| `V22` (`:w`) | `S15` | `DES7` | `src/core/state/keys.test.ts` ":w saves through file.save", ":write and a typed command id…", ":ConfigReload requests a reload" | The `:w`, `:write` and `:file.save` effects equal `runCommand(s, "file.save")`. `:ConfigReload` and `:config.reload` both give `[{ kind: "loadConfig" }]`. E492 is unchanged | `Passed` |
| `V31` | `S13` | `DES7` | `src/workspace/config-file.test.ts` | Unset, `""` and `relative/path` give `/home/u/.config/so/config.toml`; `/abs` gives `/abs/so/config.toml`; a missing file gives `undefined` (sync and async) | `Passed` |
| `V33` | `S14` | `DES7` | `src/workspace/log.test.ts` | Without debug (and with `SO_LOG=info`) no state directory is created. With debug, JSON lines `{time, level, event, …}` are written to `so/so.log` with mode `0600`. A relative `XDG_STATE_HOME` falls back to `~/.local/state` | `Passed` |
| `V39` | `S13, S21` | `DES7, DES11` | `bun test test/integration/config.test.ts` | (b) `<leader>w` saves to disk. (c) The toast starts `config.toml:7: `, the config is `toBe(defaults)`, and the toast is painted. (f) The markdown override and the global `file.save` apply per scope. A reload applies leader `,`, the new binding, Esc ≥ 280 ms with 300, theme `light`, and wrap off (two windows, two `›`). An invalid reload keeps the config object and the previous binding still saves. A missing file on reload gives the defaults. `color = "never"` paints only `default` intents. `src/app/effects.test.ts` adds one `configLoaded` for a file, a missing file, and a read error | `Passed` |
| `V55` | `S19` | `DES7` | `bun test test/repo.test.ts`; `bun install --frozen-lockfile` | 3 pass; "Checked 112 installs across 188 packages (no changes)", exit 0 | `Passed` |
| `V57` | `S21` | `DES11` | `src/core/kernel/view/wrap.test.ts` | A 30-character line gives `[0]`. In the 300-character paragraph every non-final row is ≤ 80 cells and ends after a space, and the rows rejoin to the text. The 200-character word gives `[0, 80, 160]`. No tab straddles two rows at widths 8–11 with tab width 4. A lone wide tab takes a row by itself. `rowOf` is correct at each start and end | `Passed` |
| `V58` | `S21` | `DES11` | `src/core/kernel/vim/tab-width.test.ts` | Width 4: `j` lands on col 4 (`e`), `>>` gives `\ta`, `<<` on `\t\ta` gives `\ta`. Width 8: col 5 (the last column of `abcdef`), `\ta`, `\ta` | `Passed` |
| `V59` (except preview) | `S21` | `DES11` | `bun test test/ui/editor-options.test.ts` | At 80×24 the paragraph takes 4+ rows with a blank 5-cell continuation gutter. After `$` the cursor is on the last row, and `j` lands on `next` (col 3). With wrap off the line takes one row with `›` and scrolls to the cursor after `$`. Numbers are absolute on every row. `12000` is unclipped (6-cell gutter, cursor x 6). Tab width 4 paints `x` at text column 4. A line taller than the window shows the cursor's rows | `Passed` |
| Fast gate | `S19` | `DES7` | `/usr/bin/time -p bun run check` | Exit 0, real 2.83 s (< 30 s). Biome, `tsc` and knip are clean (zero knip findings). 522 pass, 0 fail across 41 files | `Passed` |
| Config and keys units | `S13, S14, S15, S21` | `DES1, DES7, DES11` | `bun test src/core/config src/core/state src/workspace src/core/kernel` | 154 pass, 0 fail, 24 files | `Passed` |
| Integration and component | `S13, S21` | `DES7, DES11` | `bun test test/integration/config.test.ts test/ui/editor-options.test.ts` | 14 pass, 0 fail | `Passed` |
| DI1 regression | `S20`, `S21` (defaults keep DI1) | `DES11` | `bun run test:ci`; `bun test test/vim`; `git diff 0d17997..3ae5716 -- test/vim/expected.json test/vim/cases.ts` | test:ci 79 pass, 0 fail, 15 snapshots, 17.4 s. vim 291 pass. The recording diff is empty. No existing `test/ui` or `test/e2e` file changed, and only `editor-options.test.ts` was added | `Passed` |
| Pins | `S19` | `DES7` | `bun test test/repo.test.ts`; `bun install --frozen-lockfile` | Both pass (see V55) | `Passed` |
| Obsolete references | `S13, S21` | `DES7, DES11` | `rg 'Bun\.TOML\|"buffer\.write"\|"<leader>": " "\|TABSTOP\|\bGUTTER\b\|reg\.keymap\|keymap: Keymap' src test scripts` | No matches | `Passed` |
| No work-process ids in code | None | None | `git diff 0d17997..3ae5716 -- src test scripts` added lines grepped for W/RM ids, `REQ`, `DES`, `P<n>-G<n>`, `V<n>`, `S1x/S2x` | No matches | `Passed` |

## Findings

None

## Test Coverage

- **Covered:** These changed behaviours are protected by tests:
  - strict parsing, with line-numbered errors in source order for syntax errors, unknown keys and tables, bad values and the leader;
  - defaults, and binding source lines;
  - binding validation (command id, file type, mode), the one-toast format, startup defaults versus reload keep;
  - the configurable leader in `splitKeys`/`Keymap`, scope overrides with `overridden`, `keymapFor` memoization;
  - `:w`/`:write`/typed ids/`:ConfigReload`;
  - XDG config path rules and missing files;
  - debug-log gating, location and mode;
  - exactly one `configLoaded` per `loadConfig` (file, missing, read error);
  - per-Esc timeout reads;
  - `color = "never"`;
  - tab width in `j`/`k` and shifts;
  - wrap row starts and `rowOf`;
  - painted wrap, overflow, numbers, wide gutter, tab width and tall lines;
  - startup and reload wiring end to end.
- **Missing:** None required by the assigned cases. The Insert cursor just past an exactly full wrapped row moves to the next screen row (`text-view.ts:EditorView.show`), which no test covers. The implementation report records this as an intended behaviour, and no assigned V case asserts it.

## Scope Changes

These deviations are all recorded in the implementation report, all are justified by the governing sources, and none changes a contract:

- **`ConfigResult.bindings`:** section 7 and the plan use `bindings`; design section 6 says `sources`. Section 7, which is authoritative for code, is followed.
- **The leader is stored as its key:** `.transform((k) => splitKeys(k)[0])`, so `"<space>"` becomes `" "`. This matches the `Keymap({ leader: Key })` shape.
- **`defaultGroups` is `{}`:** the plan limits it to existing groups, and the DI2 groups arrive with their commands in P2-G2.
- **`Logger` has only `info` and `error`:** this follows the design's section 7 shape; the plan's preview also listed `debug`.
- **Unreadable config files:** a file that exists but cannot be read becomes a line-1 error, both at startup and on reload. This keeps the rule that `loadConfig` answers with exactly one action.
- **V39 scenario (f) binds `window.vsplit`:** the parent scenario uses `link.backlinks`, which P2-G2 registers. The per-scope mechanism under test is identical, and the `link.backlinks` case is owned by V22 in P2-G2-T5.
- **Fixture lines in V20:** in this fixture the unknown file type and the unknown mode are reported at their binding lines (7 and 9). The design's V20 sketch lists lines 6 and 8. The behaviour, an error at the binding's own line, matches section 7, `toml.ts` (`bindingSources`).

## Unverified Items

None

## Blockers

None
