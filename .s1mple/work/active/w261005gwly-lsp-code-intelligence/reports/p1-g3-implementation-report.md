# P1-G3 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-goal.md`
- **Plan Part:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/w261005gwly-plan-1-core.md`
- **Group:** `P1-G3` — Edits and completion
- **Tasks:** `P1-G3-T1`, `P1-G3-T2`, `P1-G3-T3`, `P1-G3-T4`, `P1-G3-T5`
- **Report:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g3-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G3-T1` | `src/core/features/links/rename.ts`: `SpanEdit.expected?`; `applySpanEdits` checks `expected` only when present, refuses a column past the line end (`\r` excluded), and keeps same-position inserts in array order. `src/core/state/buffers.ts:applyBufferEdits`: optional `expected`, overlap refusal, same-position insert order, cursors shifted through the edits (`shifted`), and edits join a running Insert change. `src/core/state/link-edits.ts`: `nextEditBatch` (submit rename and mention edits use it), `onEditsApplied` routes LSP batches to `onCodeEditApplied`, `followMove` also repaths `lsp.edit.pending`. `src/core/state/lsp-edits.ts`: `startCodeEdit`, `onCodeEditApplied`. `src/core/state/types.ts`: action `lspApplyEdit`. `src/core/state/lsp.ts`: `edit` result branch, `onLspApplyEdit`. `src/core/state/update.ts`: `lspApplyEdit` case. Tests: `src/core/state/lsp-edits.test.ts` (9 cases), `src/core/features/links/rename.test.ts` (+1 case) | RED: `bun test src/core/state/lsp-edits.test.ts` → 0 pass / 8 fail. GREEN: same → 9 pass / 0 fail. `bun test src/core/state/lsp-edits.test.ts src/core/state/link-edits.test.ts src/core/features/links` → 34 pass / 0 fail. `bun run check` → Passed (1167 pass / 0 fail) | `05b4b6027ffafc7a86bc5b10d83c27149f3e75c9` | `Completed` |
| `P1-G3-T2` | `src/core/state/types.ts`: `RenamePrompt.rename.name`. `src/core/state/lsp.ts`: `openRenamePrompt` records `name`; `actions` branch opens `lspActions`; `action` branch → `runAction`; exported `runAction`; a `codeActionResolve` error shows `<server>: <message>`; `none` for `executeCommand` is silent. `src/core/state/explorer.ts`: `renamePromptKey` (typing, `invalid` rule, Enter → `request("rename", …, {key})`), shared `typed` helper. `src/core/state/lsp-pickers.ts`: `lspActions` source. Tests: `src/core/state/lsp-edits.test.ts` (+4 cases) | RED (implementation files reverted, tests kept): `bun test src/core/state/lsp-edits.test.ts` → 9 pass / 4 fail (the four new cases). GREEN: same → 13 pass / 0 fail. `bun test src/core/state/lsp-edits.test.ts src/core/state/explorer.test.ts` → 21 pass / 0 fail. `bun run check` → Passed (1171 pass / 0 fail) | `9258d59b9662b8063acd6d1b4059d8341c4408de` | `Completed` |
| `P1-G3-T3` | `src/core/state/lsp-commands.ts`: `formatThenSave` (format request, `s.lsp.format`, `lspFormat:<bufferId>` 1000 ms timer). `src/core/state/commands.ts:writeActive`: formats first when `formatOnSave` and a `format` server is attached. `src/core/state/lsp.ts`: `onLspResult` routes the format-on-save answer to `formattedSave`; `onFormatTimeout`; `none` for `format`/`rangeFormat` is silent. `src/core/state/save.ts:onTimer`: `lspFormat` → `onFormatTimeout`. Tests: `src/core/state/lsp-commands.test.ts` (+4 cases) | RED: `bun test src/core/state/lsp-commands.test.ts` → 11 pass / 2 fail (format on save, failed format on save); `:Format` undo and autosave cases already passed through the T1 `edit` branch and the unchanged autosave path. GREEN: same → 13 pass / 0 fail. `bun test src/core/state/lsp-commands.test.ts src/core/state/save.test.ts` → 24 pass / 0 fail. `bun run check` → Passed (1175 pass / 0 fail) | `9ccf3408037c4c206da7835ee17376b19cc70cbf` | `Completed` |
| `P1-G3-T4` | `src/core/state/code-completion.ts` (new): `codeCompletionStep`, `onCompletionTimer`, `onCompletionResult`; private `typing`, `wordStart`, `rankCode`, `shown`, `closed`, `ask`. `src/core/state/completion.ts`: `maybeOpenCompletion` → private `linkCompletion`; exported `maybeCompletion(r, key)`; `insertItem` calls `linkCompletion`. `src/core/state/keys.ts:handleKeyAction`: calls `maybeCompletion` also on the key that leaves Insert. `src/core/state/lsp.ts`: `completion` branch. `src/core/state/save.ts:onTimer`: `completion` timer. Tests: `src/core/state/code-completion.test.ts` (5 cases) | RED: `bun test src/core/state/code-completion.test.ts` → 1 pass / 4 fail (the link-completion regression case already passed). GREEN: same → 5 pass / 0 fail. `bun test src/core/state/code-completion.test.ts src/core/state/keys.test.ts src/core/state/links.test.ts` → 37 pass / 0 fail. `rg "maybeOpenCompletion" src test` → no matches. `bun run check` → Passed (1180 pass / 0 fail) | `d14872c82d6fca18c8e4f53b88695d4711068e72` | `Completed` |
| `P1-G3-T5` | `src/core/state/code-completion.ts`: `acceptCode`, `onResolvedItem`, `onResolveTimeout`, `applyCompletion`, `maybeSignature`; private `withoutAccept`, `endResolve`, `stillAccepting`. `src/core/state/completion.ts:completionKey`: code rows accept through `acceptCode`. `src/core/state/keys.ts`: `maybeSignature(maybeCompletion(r, key), key)`. `src/core/state/lsp.ts`: `completionItem` branch; `applyResult` takes the request id. `src/core/state/lsp-types.ts`: `CodeAccept.key`. `src/core/state/buffers.ts`: `shifted` exported. `src/core/state/save.ts:onTimer` takes `reg`; `lspResolve` → `onResolveTimeout`. `src/core/state/update.ts`: passes `reg` to `onTimer`. Tests: `src/core/state/code-completion.test.ts` (+4 cases) | RED: `bun test src/core/state/code-completion.test.ts` → 5 pass / 4 fail. GREEN: same → 9 pass / 0 fail. `bun run check` → Passed (1184 pass / 0 fail) | `b3d1ccb62363c30c3649cf39ee7f87a3b84b370d` | `Completed` |

### Group Change Range

- **Starting commit:** `85192134e087137a38280c85b9906bf9098889ed` (clean tree, no staged or unstaged changes)
- **Final commit:** `b3d1ccb62363c30c3649cf39ee7f87a3b84b370d`
- **Remaining group changes:** None

### Group Verification

- `bun run check` → `Passed` — biome clean, tsc clean, knip zero findings, 1184 pass / 0 fail across 105 files
- `bun test src/core` → `Passed` — 758 pass / 0 fail across 83 files
- `rg "maybeOpenCompletion" src test` → `Passed` — no matches
- `rg -n "W261005GWLY|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P1-G[0-9]"` over the 20 files changed in `8519213..b3d1ccb` → `Passed` — no matches
- `pgrep -f fake-lsp` → `Passed` — empty; this group started no processes
- `test:ci` suites (`test/ui`, `test/integration`, `test/e2e`) were not run: they are outside the group checks, and the e2e layer starts PTY processes, which this group must not start

### Deviations and Remaining Issues

1. **`applyBufferEdits` changed beyond optional `expected`.** Three changes, all needed for correct server edits and shared by every caller (link rewrite, mention linking, base cell edits):
   - While the active window is in Insert on the edited buffer, the edits join `vim.insert.block` instead of pushing their own undo block, as the vim engine does for typed text. Without this, a completion accepted mid-Insert (or an auto-import `applyEdit` arriving then) pushes a block before the Insert block, and `u` after `<Esc>` replays the typed text's inverses at shifted positions and corrupts the buffer. With it, `ofo` + accept + `<Esc>u` restores the original text (V21).
   - Window cursors move through the edits (`shifted`): an edit ending at or before the cursor moves it; an edit after or around it leaves it, then the cursor is clamped. An import added above the cursor no longer leaves the cursor on the wrong line.
   - Spans that overlap are refused (`stale`), and inserts at one position keep their array order, as LSP requires. `applySpanEdits` got the same insert order and a column bound at the line end.
2. **`startCodeEdit` signature.** Design §7 shows `startCodeEdit(s, edit, {title, reply?, then?})`. The implementation takes `(s, edit, {title, reply?}, now, reg)`: `applyBufferEdits` needs `now` (autosave) and `reg` (analysis). There is no `then`; format on save chains `writeBuffer` after `startCodeEdit` in `formattedSave`, because a format edit only touches the open buffer being saved and finishes synchronously. Storing a callback in `LspState` would put a function in state.
3. **One LSP edit batch at a time.** A `CodeEdit` arriving while `s.lsp.edit` still waits for closed files is refused with `refused: another edit is still being applied` (and a reply when one is owed), so a second batch can never overwrite the first one's reply.
4. **Message and reply texts.** Refusal: message `<title>: refused, <text>` (error) and `failureReason` `refused: <paths> (changed in the editor)` or `refused: N file(s) outside the workspace`. Finish: info toast `N file(s) changed` only when N > 0; error toast `skipped: <paths> (<reason>); …` grouped by reason, and the same text as `failureReason`. An out-of-range open-buffer edit is skipped with reason `edit out of range`. Files with no edits are ignored.
5. **`RenamePrompt.rename.name`** (not in design §6). The `invalid` rule needs the current name after the user edits the value; `openRenamePrompt` stores the initial value there. `invalid` is `name is empty` for a blank value and `type a new name` for the current name. Enter while invalid does nothing; otherwise the prompt closes and `rename` goes to the pinned server.
6. **`CodeAccept.key`** (not in design §6). The resolve timeout must send the item's command to the server that produced it after the pending request is gone, so the accept carries the key. `applyCompletion` also takes `key` (design §7 shows `(s, item, now, reg)`), and `acceptCode` takes `key` from `CompletionState.code.key`.
7. **Code actions.** `runAction` applies the edit, then sends the command (non-auto, pinned key), as Neovim does, even when the edit was refused. An unresolved action without an edit is resolved only when the server lists `codeActionResolve`; otherwise its command runs. An action with neither shows `codeAction: <title> has nothing to apply`. A `codeActionResolve` error shows `<server name>: <message>`. `none` answers to `executeCommand`, `format`, and `rangeFormat` are silent instead of `nothing found`.
8. **Format on save.** `writeActive` formats only when `formatOnSave`, no format wait is running, and `pickServer(…, "format")` finds a server. `:w` in the buffer that waits changes nothing; `:w` in another buffer while one waits writes unformatted. The answer clears `s.lsp.format`, cancels `lspFormat:<id>`, applies edits, and writes; a stale answer writes unformatted with no toast; a non-quiet error writes and toasts `format failed (<message>); saved without formatting`. The timeout drops the pending request (`lspCancel` + `cancelTimer lsp:<id>`), writes, and toasts `format timed out; saved without formatting`. Warnings use the `info` toast level (the toast type has only `info`/`error`, matching `onLspMessage`).
9. **Completion request position and matching.** The pause timer asks at the word start (design); the trigger request and manual `<C-Space>` ask at the cursor. A result opens the popup only when Insert mode, path, window, and line still match and the current word start equals the word start of the request position; the buffer version is checked first by `onLspResult`. An empty result closes the popup, and a manual one says `completion: nothing found`.
10. **Re-ranking.** With the popup open on the same word start, every key re-ranks locally (including `<BS>`); an identifier key on an incomplete list also asks again at once with `replace` (cancelling the pending one), instead of waiting for the pause. Without a query, rows follow `sortText`; with one, `rankBy` on `filterText`. Rows keep `source` as the index into `code.items`; at most 50 rows.
11. **Timer cleanup.** Every close in a code buffer whose server completes emits `cancelTimer completion`, including the `<Esc>` that leaves Insert (`handleKeyAction` now also calls `maybeCompletion` on that key; Markdown link completion is unaffected). `onCompletionTimer` still checks Insert mode and the word, so a missed cancel cannot send a request. A new accept cancels a previous resolve; both accept paths check `accept.version` and the path; the timer drops the pending resolve with `lspCancel`.
12. **`applyCompletion` details.** The main range runs from `item.edit.range.start` (else the word start) to the cursor, or to the edit's end when that lies after the cursor. Text is `edit.text ?? insertText ?? label`. The cursor goes to the main start, shifted by extra edits that start before it, plus `item.cursor` (else the text length). An extra edit at exactly the main start follows the item text. A stale apply shows `completion: <label> no longer fits here`.
13. **`onTimer(s, a, reg)`.** `save.ts:onTimer` now takes `reg`, because the resolve timeout applies edits.
14. **Out of scope, unchanged:** runner `applyEdits` reporting to `lspHost.notify` (P2-G1-T7); completion row painting (P3-G1-T3). The completion popup UI still paints `label`/`detail`/`insert` rows as before.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g3-verification-report.md` (status `Failed`, commit `bf999c9`)
- **Status:** `Completed`

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P1-G3-VER1` | `src/core/state/lsp-types.ts:CodeAccept` adds `window` and `cursor`; `src/core/state/code-completion.ts:acceptCode` records the active window and its Insert-mode cursor; `stillAccepting` now also requires the same active window, Insert mode, and that cursor, so both `onResolvedItem` and `onResolveTimeout` drop the accept otherwise (the timeout also sends `lspCancel` for the resolve). New test `a key that moves the cursor during a resolve drops the accept` (`src/core/state/code-completion.test.ts`) runs `<Esc>` and `<Esc>hi` after an unresolved accept, each through resolved-answer-then-timer and timer-then-late-answer, and asserts the text stays `"const value = obj\nfo\nlet n = 1;"`, `lsp.accept` is undefined, and the timeout emits `lspCancel{id: 2}`. RED: `bun test src/core/state/code-completion.test.ts` → 9 pass / 1 fail (received `import … formato`, the verifier's corruption). GREEN: 10 pass / 0 fail. `bun run check` → Passed (1185 pass / 0 fail) | `a2776a0a2dc3d020035efd01ceef2ff435a072d2` | `Fixed` |
| `P1-G3-VER2` | `src/core/state/types.ts`: action `lspResult` gains a required `now: number`; `src/app/effects.ts` stamps it with the runner clock. `src/core/state/lsp.ts:onLspResult` passes `a.now` to `formattedSave` (format edits and the write) and `applyResult` (`edit`, `action`, `completionItem` branches); `src/core/state/code-completion.ts:onResolvedItem` takes `now`. Every `0` time for writes and autosave started from an answer is gone. Existing test dispatches add `now: 0` (`code-completion`, `lsp`, `lsp-commands`, `lsp-edits` tests). New test `a write after a format answer that then fails retries in the future` (`src/core/state/lsp-commands.test.ts`): `:w` with format on save, format edit answer at `now: 2000`, then `saveFailed{EACCES}` → `retryAt > 2000`. RED: `bun test src/core/state/lsp-commands.test.ts` → 13 pass / 1 fail (`retryAt` 1000). GREEN: `bun test src/core/state` → 386 pass / 0 fail. `bun run check` → Passed (1186 pass / 0 fail) | `c77186cea33f290c82b1e082cfc7d0a0dc01f93d` | `Fixed` |
| `P1-G3-VER3` | `src/core/state/buffers.test.ts`: `overlapping edits change nothing` (`stale: true`, no effects, same state, text unchanged), `inserts at one position keep their order` (`first second let b = 2;`), `edits move the cursor of every window showing the buffer` (after `jjlll<C-w>vgg`, the non-active window's cursor `(2,3)` moves to `(3,4)` through an import line above and a widening edit before it on its line, while an edit after it on the same line leaves its column). Tests only; no source change. The behavior already existed, so RED was shown by mutation: removing the overlap check, reversing the same-position tie-break, and replacing `edits.reduce(shifted, …)` with the old cursor each fail exactly the matching test (6 pass / 1 fail each); source restored, `git status` clean for `buffers.ts`. GREEN: `bun test src/core/state` → 389 pass / 0 fail. `bun run check` → Passed (1189 pass / 0 fail) | `e482a73b6455368a4a9e5e1a1bce6e6c3b365abc` | `Fixed` |

#### Completion Checklists

- `P1-G3-VER1`: [x] Required resolution is implemented. [x] Required proof passes. [x] Change evidence is recorded. [x] Verification evidence is recorded.
- `P1-G3-VER2`: [x] Required resolution is implemented. [x] Required proof passes. [x] Change evidence is recorded. [x] Verification evidence is recorded.
- `P1-G3-VER3`: [x] Required resolution is implemented. [x] Required proof passes. [x] Change evidence is recorded. [x] Verification evidence is recorded.

#### Remediation Deviations

1. **`CodeAccept.window` and `CodeAccept.cursor`** (not in design §6, which lists `{id, item, path, version}`). The accept applies only while the window, Insert mode, and cursor match the accept. The verifier's alternative (apply at the recorded range) was not taken: dropping keeps the item out of a changed context and keeps `applyCompletion` unchanged.
2. **`lspResult.now`** (not in design §6, which shows `lspResult{id, result}`). Required rather than optional, so every dispatcher, including the P2 language-server host, must stamp the answer time. Picker opens (`now: 0` in `applyResult`) and `goTo` in `onLocations` start no write and are unchanged.
3. Checks touched files outside the original group range only where the type change required it: `src/app/effects.ts` (one dispatch) and `src/core/state/lsp.test.ts` (one dispatch helper).

#### Remediation Verification

- `bun run check` → `Passed` — biome clean, tsc clean, knip zero findings, 1189 pass / 0 fail across 105 files
- `bun test src/core` → `Passed` — 763 pass / 0 fail across 83 files
- `bun run test:ci` → `Passed` — 229 pass / 0 fail across 28 files (`test/ui`, `test/integration`, `test/e2e`)
- `rg "maybeOpenCompletion" src test` → `Passed` — no matches
- `rg -n "W261005GWLY|REQ[0-9]|DES[0-9]|\bV[0-9]+\b|P1-G[0-9]|VER[0-9]"` over the 23 `src`/`test` files changed in `8519213..e482a73` → `Passed` — no matches
- `pgrep -f fake-lsp` → `Passed` — empty after `test:ci`; no `bin/so` process remains. One `bun src/app/main.ts …/.sandbox/vault` process (started 17:15, before this remediation) belongs to a user sandbox session on the main checkout and was left running
- Self-review of `8519213..e482a73`: no issues found beyond the three findings

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — all three findings are fixed and committed, and every group check passes
- **Final report commit:** Returned to the orchestrator; not written here because it would need a self-referential commit
- **Final commits:** `05b4b6027ffafc7a86bc5b10d83c27149f3e75c9`, `9258d59b9662b8063acd6d1b4059d8341c4408de`, `9ccf3408037c4c206da7835ee17376b19cc70cbf`, `d14872c82d6fca18c8e4f53b88695d4711068e72`, `b3d1ccb62363c30c3649cf39ee7f87a3b84b370d`, `a2776a0a2dc3d020035efd01ceef2ff435a072d2`, `c77186cea33f290c82b1e082cfc7d0a0dc01f93d`, `e482a73b6455368a4a9e5e1a1bce6e6c3b365abc`
- **Final checks:** `bun run check` → Passed (1189 pass / 0 fail); `bun test src/core` → Passed (763 pass / 0 fail); `bun run test:ci` → Passed (229 pass / 0 fail); `rg "maybeOpenCompletion" src test` → no matches; work-process id search over changed files → no matches; `pgrep -f fake-lsp` → empty
- **Remaining issues:** None
