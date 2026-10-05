# P1-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-goal.md`
- **Plan Part:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-1-core.md`
- **Group:** `P1-G2` — Requests, diagnostics, and commands
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`
- **Report:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G2-T1` | `src/core/state/lsp-types.ts`: `LspOp`, `LspResult`. `src/core/state/types.ts`: actions `lspServer`, `lspAttached`, `lspResult`, `lspMessage`; effects `lsp`, `lspCancel`, `lspReply`, `lspRestart`. `src/core/state/lsp.ts`: `pickServer`, `request`, `onLspResult`, `onLocations`, `onLspTimeout`, `onLspServer`, `onLspAttached`, `onLspMessage`, `openRenamePrompt`; private `dropPending`, `takePending`, `applyResult`, `detached`, `withoutServerDiagnostics`. `src/core/state/update.ts`: four `step` cases. `src/core/state/save.ts:onTimer`: `lsp:` → `onLspTimeout`. `src/app/effects.ts:run`: no-host answer for `lsp`, no-ops for `lspCancel`/`lspReply`/`lspRestart`. `src/core/state/lsp.test.ts` (19 cases, then 1 more in the follow-up) | RED: `bun test src/core/state/lsp.test.ts` → `Cannot find module './lsp'`. GREEN: same → 19 pass / 0 fail. `bun run check` → biome, tsc, knip clean; 1129 pass / 0 fail. Follow-up RED: new case failed (`hover: not supported by a`); GREEN: 36 pass; `bun run check` → 1154 pass / 0 fail | `814e6c7b2d05b13c9ce4212921d48227f4491b01`; follow-up `ccea2bdbade26e30f2c92e1f729f4a0e1d91b009` | `Completed` |
| `P1-G2-T2` | `src/core/state/types.ts`: action `lspDiagnostics`. `src/core/state/lsp.ts`: `onLspDiagnostics`, `mergedDiagnostics`, `syncDiagnostics`, `syncFloat`, `withoutFloat`, `cursorDiagnostic`; private `frozenPath`, `sameItems`, `covers`. `src/core/state/update.ts`: `lspDiagnostics` case; wrapper `syncFloat(state, syncDiagnostics(state, syncEmbeds(…)))`. `src/core/state/keys.ts:handleKeyAction`: `<Esc>` drops the float before `routeKey` (`maybeOpenCompletion` line kept). `src/core/state/lsp.test.ts` (+8 cases) | RED: `bun test src/core/state/lsp.test.ts` → failed, `cursorDiagnostic` export missing. GREEN: same → 27 pass / 0 fail. `bun test src/core/state/keys.test.ts` → 22 pass / 0 fail. `bun run check` → 1137 pass / 0 fail | `2514f0e9ad1c6f3dade71bad1dc89ce5f3a5b6d2` | `Completed` |
| `P1-G2-T3` | `src/core/state/lsp-pickers.ts`: `lspPickerSources` (`diagnostics`, `lspLocations`, `lspSymbols`, `lspInfo`; no `lspActions`); private `ranked`, `locationKey`, `acceptLocation`, `previewLocation`, `diagnosticRows`, `serverRows`, `serverDetail`. `src/core/state/picker.ts:pickerSources`: `...lspPickerSources`. `src/core/state/lsp.test.ts` (+3 cases; the several-locations case gains picker rows and `Enter`) | RED: `bun test src/core/state/lsp.test.ts` → 4 fail (sources missing). GREEN: same → 30 pass / 0 fail. `bun test src/core/state/picker.test.ts` → 15 pass / 0 fail. `bun run check` → 1140 pass / 0 fail | `e392c2a0d0141db722671e58f53d6e4f8293d705` | `Completed` |
| `P1-G2-T4` | `src/core/state/lsp-commands.ts`: `lspCommands` (16 commands), `lspBindings` (from private `KEYS`), `lspGroups`, `formattingOptions`; private `atCursor`, `selection`, `leaveVisual`, `codeAction`, `rename`, `wordAt`, `formatCommand` (request side only), `sortedDiagnostics`, `diagnosticJump`, `diagnosticFloat`, `restartAttached`. `src/core/state/commands.ts:EX_ALIASES`: `Format`, `Diagnostics`, `LspInfo`, `LspRestart`. `test/support/state.ts:testRegistries`: registers `lspCommands`, `lspBindings`, `lspGroups`. `src/core/kernel/vim/keys.ts:NAMED`: `<C-Space>`. `src/core/state/lsp.test.ts` (+5 cases), `src/core/state/lsp-commands.test.ts` (8 cases) | RED: `bun test src/core/state/lsp.test.ts src/core/state/lsp-commands.test.ts` → `Cannot find module './lsp-commands'`. GREEN: same → 43 pass / 0 fail. With the `<C-Space>` key name removed, "no language binding exists for notes…" fails; restored, it passes. `bun run check` (includes `test/vim`) → 1153 pass / 0 fail | `27d323c6953c7546ef232def9d2f3df2021be583` | `Completed` |

### Group Change Range

- **Starting commit:** `32a520fe694591a691969992a3f8c58d8f890980` (clean tree, no staged or unstaged changes)
- **Final commit:** `ccea2bdbade26e30f2c92e1f729f4a0e1d91b009`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed` — biome clean (335 files), tsc clean, knip zero findings, 1154 pass / 0 fail across 103 files (includes `test/vim`, `test/boundaries.test.ts`, `test/repo.test.ts`)
- `bun test src/core/state` → `Passed` — 354 pass / 0 fail across 31 files
- `rg "W261005GWLY|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P1-G"` over the 15 files changed in `32a520f..ccea2bd` → `Passed` — no matches
- `pgrep -f fake-lsp` → `Passed` — empty; this group started no processes

### Deviations and Remaining Issues

1. **`onLspResult` takes `reg`.** Design §7 shows `onLspResult(s, a)`, but the symbols and locations branches open pickers through `openPicker`, whose `CommandContext` requires `Registries`. `update.ts` passes `reg`, as it does for `onNoteCreated`. P1-G3 result branches can use it.
2. **The outside-only definition message has no path.** The plan says `definition is outside the workspace: <path>`, but `LspResult.locations` carries only a count (`outside: number`) and design §6 keeps core values workspace-relative. The message is `<feature> is outside the workspace` for one, `<feature>: N outside the workspace` for more. Adding the path would need a contract change in `lsp-types.ts` and `convert.ts`.
3. **`<C-Space>` key name in `src/core/kernel/vim/keys.ts` (outside the T4 file list).** `splitKeys` had no name for it, so `Keymap.bind` split the binding into `<`, `C`, `-`, … and made `<` a prefix in Insert mode for every code file type. That would have stalled typing generics. One `NAMED` entry fixes it; the test `km.lookup({mode:"insert", filetype:"rust"}, ["<"]).kind === "none"` guards it. P3-G1 `toKey` must emit exactly `"<C-Space>"`.
4. **`openRenamePrompt` exported from `lsp.ts`.** It is not in design §7. Both the `prepareRename` result and `lsp.rename` without prepare support open the same `RenamePrompt`, so one helper serves both. The prompt starts with `invalid: "type a new name"`, since the value starts as the current name. P1-G3-T2 owns the typing and submit rule.
5. **`withoutFloat` exported from `lsp.ts`.** The design's `keys.ts` preview calls it. It is a no-op without a float, so `handleKeyAction` calls it on every `<Esc>`.
6. **`lspGroups` is not scoped by file type.** `Registries.groups` is `Record<prefix, label>` with no scope, so `<leader>x` → `diagnostics` is a global label, like `linkGroups`.
7. **Request messages.** These only explain why nothing was sent, at info level: `no language server for <ft>`, `<feature>: not supported by <names>`, and, when every attached server is `starting` (features not known yet), `<feature>: <names> is starting`. Request failures use error level: `<feature>: <message>` and `<feature>: timed out`. A non-auto `none` result, or empty hover or symbols, gives `<feature>: nothing found`.
8. **Decisions to preserve in the reducers:**
   - `request` with `key` uses that server only while it is `ready`; otherwise it reports `no language server for <ft>`. `replace` emits `lspCancel` (and `cancelTimer` for non-auto) for every pending request of the same feature.
   - `onLspResult` emits `cancelTimer lsp:<id>` for non-auto requests even when the result is stale. Staleness compares only the buffer version.
   - `onLspServer`: a view not in `starting`/`ready` (including `undefined`) detaches the key, drops its diagnostics, and ends its pending requests (`lspCancel` plus `cancelTimer`). The failed toast is `<name> stopped: <reason ?? "crashed">`, sent once per transition into `failed`.
   - `onLspAttached` drops keys whose view is not `starting`/`ready`. The host (P2-G1) must dispatch `lspServer` before `lspAttached`.
   - `onLspMessage`: `error` → error toast, `warning` → info toast, text `<server name>: <text>`.
   - `onLspDiagnostics` keeps each server's position in `diagnostics[path]` when it replaces a slot, so the merge order is stable. `mergedDiagnostics` gives push then pull per server.
   - `syncDiagnostics` recomputes only when `lsp.diagnostics` or the frozen path (Insert mode on the active buffer's path) changed. Otherwise, and when no path changed, it returns the same `Result`.
   - `syncFloat` closes any float whose window is no longer active. A `signature` float lives only in Insert mode, so it survives typing. `hover` and `diagnostics` floats close on a buffer, version, or cursor change compared with the previous state, except in the action that set them.
   - `cursorDiagnostic` matches the cursor inside the range (end exclusive; an empty range covers its start). It returns the most severe match, as `<source>: <first message line>`, or just the message when there is no source.
   - Picker row keys are `<line>:<col>:<n>:<path>`; `acceptLocation` parses them to `goTo` the exact column after `recordJump`. `lspInfo` lists every server view (`name · root|(no project) · state`), then configured specs with no view (`name · not started`). `Enter` closes it. `lsp-pickers.ts` imports only types from `picker.ts`, so the `pickerSources` spread cannot meet an uninitialized binding.
   - `formattingOptions`: tabs when the first indented line starts with a tab (`tabSize = tabWidth`); otherwise spaces with `tabSize` set to the narrowest leading-space indent (`tabWidth` when nothing is indented). This avoids re-indenting a 2- or 4-space file to the default `tabWidth` of 8.
   - `lsp.format` uses feature `rangeFormat` with `range` in Visual mode, and `format` otherwise. `lsp.codeAction` sends the selection or an empty range at the cursor, with the shown diagnostics whose lines overlap the range. Both leave Visual mode.
   - `]d`/`[d` move to the next or previous diagnostic start in the active file and wrap; with none they show `no diagnostics`. `<C-w>d` opens a `diagnostics` float with the cursor line's diagnostics, most severe first.
   - `lsp.restart` sends the attached keys, plus the stopped views (`failed`/`unavailable`/`missing`) whose spec file types include the active file type.
9. **Out of scope, unchanged:** `edit`, `actions`, `action`, `completion`, `completionItem` results clear the pending request and return `none` (P1-G3). No `lspActions` source, no format result handling or format on save, no `lspApplyEdit` (P1-G3). No host routing and no `main.ts` registration (P2-G1). `maybeOpenCompletion` still exists (P1-G3-T4).

## Remediation

- **Verification reports:** `Pending verification`
- **Status:** `Pending verification`

### Finding Closure

Pending verification.

## Final Status

`Pending verification`

### Final Evidence

- **Final report status:** `Pending verification` — initial implementation completed
- **Final report commit:** `Pending verification`
- **Final commits:** `814e6c7b2d05b13c9ce4212921d48227f4491b01`, `2514f0e9ad1c6f3dade71bad1dc89ce5f3a5b6d2`, `e392c2a0d0141db722671e58f53d6e4f8293d705`, `27d323c6953c7546ef232def9d2f3df2021be583`, `ccea2bdbade26e30f2c92e1f729f4a0e1d91b009`
- **Final checks:** `bun run check` → Passed (1154 / 0); `bun test src/core/state` → Passed (354 / 0)
- **Remaining issues:** None
