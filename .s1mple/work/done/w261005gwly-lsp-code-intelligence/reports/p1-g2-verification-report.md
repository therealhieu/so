# P1-G2 Verification Report

## Scope

- **Group:** `P1-G2` — Requests, diagnostics, and commands
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`
- **Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p1-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261005gwly-lsp-code-intelligence/reports/p1-g2-implementation-report.md`

Verified range: `32a520f..ccea2bd` (task commits `814e6c7`, `2514f0e`, `e392c2a`, `27d323c`, follow-up `ccea2bd`), 15 files.

## Status

`Failed`

Every assigned V case passes and every group check is clean. The group still fails on one Major finding: `formattingOptions` sends `tabSize: 1` for any TypeScript or JavaScript file that has a JSDoc block (P1-G2-VER1). Two Minor findings remain: the command-line diagnostic matches one cell past the end of a range (VER2), and hover floats stay open on a mode change, which DES8 and REQ13 say should close them (VER3).

## Assigned Traceability

- **System Design:** `REQ2@R2 → DES6 → S4 → V5`; `REQ4@R1 → DES5, DES14 → S7 → V9`; `REQ4@R1 → DES6 → S8 → V10`; `REQ6@R2 → DES7 → S12 → V15, V16`; `REQ13@R1 → DES9 → S26, S27 → V35, V36`; `REQ13@R1 → DES8, DES11 → S28 → V37, V49`; `REQ5@R1, REQ13@R1 → DES14 → S9, S26 → V39`; `REQ14@R2 → DES6 → S29, S39 → V40, V60`; `REQ3@R2 → DES15 → S6, S35 → V8`; `REQ7@R2 → DES7, DES9, DES19 → S13, S36 → V17` (core source only; end-to-end proof is P3-G1); `S11` (`]d`/`[d` wrap); `V46` (`bun run check`)
- **UI Design:** `None`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ2@R2 → DES6 → S4 → V5` | `None` | Request goes to the first ready server with the feature; diagnostics from both servers shown | `src/core/state/lsp.ts:pickServer` (`state === "ready" && features.includes`, attached order); `request` effects `[startTimer lsp:<id> 5000, lsp{…}]`; `mergedDiagnostics` + `syncDiagnostics` | `Satisfied` |
| `REQ4@R1 → DES5, DES14 → S7 → V9` | `None` | Each command emits its `op.kind` | `src/core/state/lsp-commands.ts:lspCommands` (16 commands; `atCursor`, `rename`, `codeAction`, `formatCommand`) | `Satisfied` |
| `REQ4@R1 → DES6 → S8 → V10` | `None` | `hover: not supported by a`; `no language server for <ft>` | `src/core/state/lsp.ts:request` lines 101-115 | `Satisfied` |
| `REQ6@R2 → DES7 → S12 → V15, V16` | `None` | Insert freeze; cursor diagnostic text | `src/core/state/lsp.ts:syncDiagnostics` (`frozenPath`: Insert mode on the active buffer's path); `cursorDiagnostic` | `Satisfied` for the freeze. The cursor diagnostic shows the right text but matches one extra cell (P1-G2-VER2) |
| `REQ13@R1 → DES9 → S26, S27 → V35, V36` | `None` | One location jumps (`<C-o>` returns); several open `lspLocations`; outside counted (`N outside the workspace`) | `src/core/state/lsp.ts:onLocations` (`goTo(recordJump(s), …)`, `openPicker(…, "lspLocations", title)`, `outsideNote`) | `Satisfied` (accepted message deviation, see Scope Changes) |
| `REQ13@R1 → DES8, DES11 → S28 → V37, V49` | `None` | Floats close on cursor move, leaving Insert, and `<Esc>` in Normal mode | `src/core/state/lsp.ts:syncFloat`; `src/core/state/keys.ts:handleKeyAction` (`withoutFloat` on `<Esc>` before `routeKey`); `<C-Space>` in `src/core/kernel/vim/keys.ts:NAMED` | `Satisfied` for S28. DES8/REQ13 also say a mode change closes the float, and that is not implemented (P1-G2-VER3) |
| `REQ5@R1, REQ13@R1 → DES14 → S9, S26 → V39` | `None` | No Markdown binding; Markdown `gd` still `link.followOrTag` | `src/core/state/lsp-commands.ts:lspBindings` (`LSP_FILE_TYPES.flatMap`), `KEYS` matches design §7 exactly | `Satisfied` |
| `REQ14@R2 → DES6 → S29, S39 → V40, V60` | `None` | Stale and quiet results change nothing | `src/core/state/lsp.ts:onLspResult` (version compare against `bufferForPath`), `applyResult` `error` branch (`quiet === true \|\| p.auto` → `none`) | `Satisfied` |
| `REQ3@R2 → DES15 → S6, S35 → V8` | `None` | One toast per failure; none for unavailable/missing; `lspInfo` rows | `src/core/state/lsp.ts:onLspServer` (`view.state === "failed" && prev?.state !== "failed"`), `onLspMessage`; `src/core/state/lsp-pickers.ts:serverRows`, `serverDetail` | `Satisfied` |
| `REQ7@R2 → DES7, DES9, DES19 → S13, S36 → V17` | `None` | `diagnostics` source sorted by severity, path, position; `Enter` opens it (core source only) | `src/core/state/lsp-pickers.ts:diagnosticRows` (sort severity → path → line → col), `acceptLocation` | `Satisfied` (core part; end-to-end in P3-G1) |
| `S11` | `None` | `]d`/`[d` move and wrap | `src/core/state/lsp-commands.ts:diagnosticJump` (`find … ?? list[0]`, `findLast … ?? list.at(-1)`) | `Satisfied` |
| `DES13` (T4 `formattingOptions`) | `None` | `insertSpaces` and `tabSize` from the buffer's indentation | `src/core/state/lsp-commands.ts:formattingOptions` | `Mismatch` (P1-G2-VER1) |

Exact messages were checked against the source:

| Message | Source | Result |
|---|---|---|
| `no language server for <ft>` | `lsp.ts:104-107` | Matches. A test checks `no language server for rust`, and REQ13's acceptance criterion is met |
| `<feature>: not supported by <names>` | `lsp.ts:114` | Matches; `<names>` joins every attached server name with `, ` |
| `<feature>: timed out` | `lsp.ts:onLspTimeout` (error level, plus `lspCancel`) | Matches |
| `N outside the workspace` | `lsp.ts:outsideNote`, `onLocations` | Matches |
| `<feature>: <names> is starting` | `lsp.ts:113` (follow-up `ccea2bd`) | Not in the design; accepted (see Scope Changes) |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V5` | `S4` | `DES6`, `DES7` | `bun test src/core/state/lsp.test.ts` — "a request goes to the first attached server that supports the feature", "diagnostics from two servers are both shown", "K in a code file asks the first server for hover" | Effects are `[startTimer lsp:1 5000, lsp{key:"b@/ws"}]`; `shown["src/a.rs"]` has length 2; `K` reaches `lsp.hover` | `Passed` |
| `V9` | `S7` | `DES5`, `DES14` | `lsp.test.ts` — "each language feature command sends its operation" | The 10-row table from command id to `op.kind` matches, with `lsp.rename` → `prepareRename` | `Passed` |
| `V10` | `S8` | `DES6` | `lsp.test.ts` — "a feature no attached server supports explains why" | Message is `hover: not supported by a`; no effects; `pending` is empty | `Passed` |
| `V15` | `S12` | `DES7` | `lsp.test.ts` — "diagnostics published in insert mode show after leaving insert mode", "diagnostics of another file still show while inserting" | In Insert, `shown` is `["old"]`; after `<Esc>` it is `["new"]`; another path updates during Insert | `Passed` |
| `V16` | `S12` | `DES7` | `lsp.test.ts` — "the command line diagnostic is the one under the cursor" | Returns `{severity:1, text:"srv: msg"}`; `undefined` on another line | `Passed` (P1-G2-VER2 is an edge case this test does not cover) |
| `V35` | `S26`, `S27` | `DES9` | `lsp.test.ts` — "one definition jumps and <C-o> returns" | `read src/b.rs` is emitted; after load, cursor is at `(2,0)`; `<C-o>` returns to `src/a.rs` `(1,4)` | `Passed` |
| `V36` | `S27` | `DES9`, `DES18` | `lsp.test.ts` — "several locations open a picker and outside ones are counted", "a definition only outside the workspace is reported, not opened" | Picker source is `lspLocations` with 3 rows; message contains `2 outside the workspace`; `Enter` reads `src/c.rs`; an outside-only result opens nothing | `Passed` |
| `V37` | `S28` | `DES8`, `DES11` | `lsp.test.ts` — "hover closes on cursor move and signature help on leaving insert mode" | Hover closes after `l`; signature survives typing `x` and closes on `<Esc>` | `Passed` |
| `V49` | `S28` | `DES8` | `lsp.test.ts` — "<Esc> in normal mode closes a hover float without moving" | Float is `undefined`; cursor and mode unchanged | `Passed` |
| `V39` | `S9`, `S26` | `DES14` | `lsp.test.ts` — "no language binding exists for notes and gd in a note still follows links" | No `markdown` binding; Markdown `gd` → `link.followOrTag`; Rust `gd` → `lsp.definition`; `<C-Space>` → `lsp.complete`; Insert `<` → `none` | `Passed` |
| `V40` | `S29` | `DES6` | `lsp.test.ts` — "a result for an older buffer version changes nothing", "a result nobody waits for changes nothing" | No float, `pending` empty, no message; an unknown id returns the same state object | `Passed` |
| `V60` | `S39` | `DES6` | `lsp.test.ts` — "quiet errors show nothing" | No message; `pending[1]` is `undefined` | `Passed` |
| `V8` | `S6`, `S35` | `DES15` | `lsp.test.ts` — "a failed server toasts once and an unavailable one never", "server messages become toasts", "the server list shows missing binaries and unavailable servers with their reason" | Exactly one toast, `a stopped: exit code 1`; `lspInfo` rows show `not on PATH`, `unavailable: error: component not installed`, `(no project)`, `tsc · not started` | `Passed` |
| `V17` (core part) | `S13` | `DES7`, `DES9` | `lsp.test.ts` — "the diagnostics picker lists every diagnostic by severity, path, and position" | Rows are sorted E/a, E/z, W/a, W/b; `Enter` reads unopened `src/z.rs`, and after load the cursor is at `(1,0)` | `Passed` (end-to-end is P3-G1) |
| `S11` wrap | `S11` | `DES7`, `DES14` | `bun test src/core/state/lsp-commands.test.ts` — "]d after the last diagnostic wraps to the first", "[d before the first diagnostic wraps to the last", "]d without diagnostics says so" | All pass | `Passed` |
| `V46` | `S7`, `S32` | `DES1`, `DES5` | `bun run check` | biome: 335 files clean; tsc clean; knip: zero findings; 1154 pass / 0 fail across 103 files (includes `test/vim`, `test/boundaries.test.ts`, `test/repo.test.ts`) | `Passed` |
| Core state units | None | None | `bun test src/core/state` | 355 pass / 0 fail across 31 files | `Passed` |
| Assigned suites | None | None | `bun test src/core/state/lsp.test.ts src/core/state/lsp-commands.test.ts src/core/state/keys.test.ts src/core/state/picker.test.ts test/vim` | 378 pass / 0 fail | `Passed` |
| Work-process ids | None | None | `rg -n "W261005GWLY\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|P1-G"` over the 15 changed files | No matches | `Passed` |
| Reducer purity, no protocol imports | None | `DES1` | `rg` for `Date`, `setTimeout`, `Math.random`, `performance`, `node:`, `bun`, `vscode-` in `lsp*.ts`; `rg vscode-languageserver\|vscode-jsonrpc src/core` | No matches. Time enters only through `startTimer`/`cancelTimer` effects and `timer` actions | `Passed` |
| Exhaustive switches | None | `DES5` | Inspection of `update.ts` `step` and `effects.ts` `run`, plus tsc | Five `lsp*` action cases and four effect cases; the `never` checks compile | `Passed` |
| Post-steps return the same object when idle | None | `DES5`, `DES7`, `DES8` | Inspection of `syncDiagnostics`/`syncFloat`; test "an action that touches neither diagnostics nor floats keeps the language state" | Both return `r` on the idle path; `s.lsp` is identical after `j` and `resize`; neither emits effects | `Passed` |
| Formatting options on a TypeScript file with JSDoc | None | `DES13` | Throwaway probe (deleted): `formattingOptions` on `"/**\n * doc\n */\nfunction a() {\n    b();\n}\n"`, `tabWidth` 8 | `{"tabSize":1,"insertSpaces":true}` | `Failed` (P1-G2-VER1) |
| Cursor diagnostic at range end | `S12` | `DES7` | Throwaway probe (deleted): diagnostic `(0,0)–(1,0)`, cursor at `(1,0)` | `cursorDiagnostic` returns `line0` | `Failed` (P1-G2-VER2) |
| Hover float on mode change | `S28` | `DES8` | Throwaway probe (deleted): hover float, then `i` or `v` | Mode becomes `insert` / `visual`; float is still `hover` | `Failed` (P1-G2-VER3) |
| Process cleanup | None | None | `pgrep -f fake-lsp` | Empty; this verification started no long-lived processes | `Passed` |

## Findings

### P1-G2-VER1 — Major — correctness — `formattingOptions` sends `tabSize: 1` for files with JSDoc or block comments

- **System Design:** `REQ11@R1, DES13` (task `P1-G2-T4`)
- **UI Design:** `None`
- **Evidence:** `src/core/state/lsp-commands.ts:120-137` takes the narrowest leading-space indent of any line:

  ```ts
  const n = line.length - line.trimStart().length;
  if (n > 0 && n < line.length && line[0] === " ")
    narrowest = Math.min(narrowest, n);
  ```

  A JSDoc continuation line ` * doc` has one leading space. The probe gave `{"tabSize":1,"insertSpaces":true}` for a 4-space TypeScript file with one `/** … */` block. Aligned continuation lines lower it too: `f(a,\n  b);` in a 4-space file gave `tabSize: 2`. The only test, "formatting options follow the buffer's indentation", covers uniform 4-space, tab, and unindented files.
- **Impact:** `:Format` sends this value as `FormattingOptions.tabSize`. `typescript-language-server` and the JSON server, two of the seven built-ins, use it as the indent size. Formatting a normal TypeScript or JavaScript file with doc comments could re-indent the whole file to one space. The implementer recorded this rule as a deliberate deviation to avoid the default `tabWidth` of 8, but the rule fails for the most common TypeScript layout.
- **Required resolution:** Derive `tabSize` from the indentation step the file actually uses, and ignore comment continuations and alignment. For example: take the most common positive difference between consecutive indented lines, or skip lines whose trimmed text starts with `*`, and fall back to `tabWidth`. A 4-space file with JSDoc or aligned arguments must give `tabSize: 4`, and a 2-space file must give `2`.
- **Required proof:** Extend "formatting options follow the buffer's indentation" in `src/core/state/lsp-commands.test.ts` with a 4-space file containing a JSDoc block (expect `{tabSize: 4, insertSpaces: true}`) and a 2-space file with an aligned continuation line (expect `tabSize: 2`). Then run `bun test src/core/state/lsp-commands.test.ts` and `bun run check`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G2-VER2 — Minor — correctness — `cursorDiagnostic` matches the exclusive end of a multi-line range

- **System Design:** `REQ6@R2, DES7, S12, V16`
- **UI Design:** `None`
- **Evidence:** `src/core/state/lsp.ts:496-502`:

  ```ts
  const from = line === start.line ? start.col : 0;
  const to = line === end.line ? end.col : Number.POSITIVE_INFINITY;
  return col >= from && (col < to || (to <= from && col === from));
  ```

  On the end line of a multi-line range ending at column 0, `from = 0` and `to = 0`, so the "empty range covers its start" clause is true at `(end.line, 0)`. The probe used a diagnostic `(0,0)–(1,0)` with the cursor at `(1,0)`, and `cursorDiagnostic` returned `line0`. The implementation report itself says the end is exclusive.
- **Impact:** Whole-line diagnostics often end at the next line's column 0. For them, the command line shows the diagnostic of the previous line when the cursor is at the start of the next line.
- **Required resolution:** Apply the empty-range rule only when `start` equals `end`. Every other range must exclude `end`.
- **Required proof:** Add a case to "the command line diagnostic is the one under the cursor" in `src/core/state/lsp.test.ts`: a `(0,0)–(1,0)` diagnostic gives `undefined` at `(1,0)`, and an empty range `(1,2)–(1,2)` still matches at `(1,2)`. Then run `bun test src/core/state/lsp.test.ts`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G2-VER3 — Minor — specification — Hover and diagnostic floats stay open on a mode change

- **System Design:** `REQ13@R1, DES8, S28, V37`
- **UI Design:** `None`
- **Evidence:** DES8 says "`syncFloat` closes it when the window, version, cursor, or mode changes". REQ13@R1 says floats close "on cursor move, `Esc`, or mode change". `src/core/state/lsp.ts:475-493` checks mode only for `signature`. For `hover` and `diagnostics` it compares window, buffer, version, and cursor. The probe showed a hover float, then `i` → mode `insert` with the float still `hover`, and `v` → mode `visual` with the float still `hover`.
- **Impact:** After `K` then `i`, or `K` then `v`, the hover covers text until the next cursor move or edit. This does not match the agreed behaviour.
- **Required resolution:** `syncFloat` closes a `hover` or `diagnostics` float when `vim.mode` differs from the previous state, except in the action that set the float. Signature behaviour is unchanged.
- **Required proof:** Add to `src/core/state/lsp.test.ts` a case where a hover float followed by `i` and a hover float followed by `v` both give `s.lsp.float === undefined`. Then run `bun test src/core/state/lsp.test.ts` and `bun run check`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:** routing order, starting servers passed over, pinned `key`; `not supported by`, `no language server for rust`, `is starting`; hover float and `replace` cancel; stale, unknown, quiet, user-error, and auto-error results; timeout message plus `lspCancel`, and a late result after timeout; one-location jump with `<C-o>`, outside-only report, several-location picker with outside count and `Enter`; failed toast once, unavailable/missing silent, stopped server forgotten; server message toasts; two-server diagnostics, push/pull slots and pruning, Insert freeze, other-path updates during Insert; cursor diagnostic; float close on cursor move, signature on leaving Insert, `<Esc>` in Normal mode; idle post-step identity; symbols picker by depth with `Enter`; `lspInfo` rows; diagnostics picker sort and `Enter` on an unopened path; command → op table; rename prompt without prepare; Visual code action range and diagnostics; Markdown key isolation, `<C-Space>`, Insert `<`; `]d`/`[d` wrap and empty case; `<C-w>d` float; formatting options for uniform indents; `:Format` request; `:LspRestart` keys; `:Diagnostics`/`:LspInfo` in any file.
- **Missing:**
  - `formattingOptions` with comment continuations and aligned lines (P1-G2-VER1).
  - `cursorDiagnostic` at the exclusive end of a multi-line range (P1-G2-VER2).
  - Hover float on a mode change (P1-G2-VER3).
  - `lspServer` turning a server `failed` while a request is pending: no test asserts `lspCancel` plus `cancelTimer` for the dropped request (`dropPending` in `onLspServer`).

## Scope Changes

The implementer's recorded deviations, judged against the design and plan:

| Deviation | Judgment | Reason |
|---|---|---|
| Outside-only definition message has no `<path>` (`definition is outside the workspace`) | Accepted | DES18 and the plan ask for `: <path>`. The canonical §7 contract `LspResult.locations{items, outside: number}` cannot carry it, and the §7 invariant says results reference workspace-relative paths only. The design contradicts itself, and the implementation follows the binding contract. The orchestrator should align the DES18 text, or change the contract in P2-G1 `convert.ts`. |
| `onLspResult(s, a, reg)` | Accepted | `openPicker` needs `Registries`. This follows `onNoteCreated`. |
| `<C-Space>` added to `src/core/kernel/vim/keys.ts:NAMED` | Accepted | Without it, `splitKeys` makes `<` an Insert-mode prefix in every code file type. DES14 already requires `<C-Space>` to reach the keymap. A test guards it, and `test/vim` passes. |
| Exports `openRenamePrompt`, `withoutFloat` | Accepted | `withoutFloat` is the helper the design's `keys.ts` shape calls. `openRenamePrompt` is shared by both rename paths. knip is clean. |
| `<feature>: <names> is starting` message | Accepted | The design does not cover the case where every attached server is starting, and `not supported by` would be wrong there. Info level; tested. |
| `formattingOptions` narrowest-indent `tabSize` rule | Rejected as written | The goal is valid: it avoids the default `tabWidth` of 8. The rule itself is wrong for common files (P1-G2-VER1). |
| `lspGroups` not scoped by file type | Accepted | `Registries.groups` has no scope. Markdown's `<leader>x` is a leaf command (`task.toggle`), and `whichKeyRows` labels leaves by command title, so the global group label never shows in notes. |
| `lspInfo` puts the binary or state detail in `detail` instead of a fourth label field | Accepted | V8's expected texts (`not on PATH`, `unavailable: <reason>`, `(no project)`) are present. |

No other unplanned additions or omissions. P1-G3 and P2-G1 exclusions are respected: `edit`/`actions`/`action`/`completion`/`completionItem` return `none` after clearing the pending entry, there is no `lspActions` source, and there is no `main.ts` registration.

## Unverified Items

- V17 end to end (a real unopened file through `:Diagnostics` in the TUI) belongs to P3-G1. Only the core source was verified here.
- The effect on real formatters for P1-G2-VER1 is inferred from how `typescript-language-server` and the JSON server use `FormattingOptions.tabSize`. No server was run, because format result handling is P1-G3 and the host is P2-G1.

## Blockers

None
