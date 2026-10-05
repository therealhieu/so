# P1-G3 Verification Report

## Scope

- **Group:** `P1-G3`
- **Tasks:** `P1-G3-T1`, `P1-G3-T2`, `P1-G3-T3`, `P1-G3-T4`, `P1-G3-T5`
- **Report:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g3-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261005gwly-lsp-code-intelligence/reports/p1-g3-implementation-report.md`

## Status

`Failed`

The group fails on one Major correctness defect: a completion accepted while its resolve is pending is applied at a moved cursor after `<Esc>`, which corrupts the buffer (`P1-G3-VER1`). Every assigned V case, `bun run check`, `bun test src/core`, and the `bun run test:ci` regression run pass. Two Minor findings cover a zero write time on format-on-save writes and missing tests for the shared `applyBufferEdits` changes.

## Assigned Traceability

- **System Design:** `REQ10@R2 → DES12 → S17 → V22`; `REQ10@R2 → DES12 → S18 → V23`; `REQ10@R2 → DES12 → S19, S40 → V24, V62`; `REQ11@R1 → DES13 → S20, S21 → V25, V26`; `REQ8@R1 → DES10 → S14, S15 → V18, V19, V20`; `REQ9@R2 → DES10 → S16, S37 → V21, V58`; `REQ9@R2, REQ14@R2 → DES10 → S38 → V59`; `REQ13@R1 → DES11 → S28`; S15 obsolete-reference check; `V46`
- **UI Design:** `None`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ10@R2 → DES12 → S17 → V22` | `None` | Open buffer edited in one undo step; closed file queued as `applyEdits` without `expected` | `src/core/state/lsp-edits.ts:78` `startCodeEdit` (open → `applyBufferEdits`, closed → `applyEdits{batch}`); `src/core/features/links/rename.ts:135` `applySpanEdits` checks `expected` only when present; test `an edit over an open and a closed file edits the buffer and queues the file` | `Satisfied` |
| `REQ10@R2 → DES12 → S18 → V23` | `None` | Version mismatch refuses everything and replies `applied:false` | `src/core/state/lsp-edits.ts:41` `refusal` (busy, outside, moved version); refusal emits message and `lspReply{applied:false, failureReason:"refused: …"}`; tests `a versioned edit for an older buffer applies nothing and says why`, `an edit with files outside the workspace is refused whole` | `Satisfied` |
| `REQ10@R2 → DES12 → S19, S40 → V24, V62` | `None` | Exactly one reply after `editsApplied`; skipped file named in `failureReason` | `src/core/state/link-edits.ts:291` `onEditsApplied` routes `s.lsp.edit.batch` to `onCodeEditApplied` (`lsp-edits.ts:130`); `finish` (`lsp-edits.ts:162`) emits one toast and one reply; `nextEditBatch` (`link-edits.ts:182`) keeps batch ids apart; `runAction` (`lsp.ts:333`) resolves actions lazily; tests `a server edit is answered once after the closed files are written`, `a skipped file is named in the reply`, `a second edit while closed files are still written is refused`, `server edit batches and link rewrite batches never share an id` | `Satisfied` |
| `REQ11@R1 → DES13 → S20, S21 → V25, V26` | `None` | `:Format` undoable; `:w` formats with a 1000 ms bound; autosave never formats | `src/core/state/commands.ts:252` `writeActive`; `src/core/state/lsp-commands.ts:173` `formatThenSave` (`lspFormat:<id>` 1000 ms); `src/core/state/lsp.ts:196` `formattedSave`, `:224` `onFormatTimeout`; autosave path in `save.ts:onTimer` untouched; tests in `lsp-commands.test.ts` | `Satisfied` (write time defect in `P1-G3-VER2`) |
| `REQ8@R1 → DES10 → S14, S15 → V18, V19, V20` | `None` | Trigger requests at once; identifier starts 150 ms timer; local re-rank; stale result opens nothing; link completion unchanged | `src/core/state/code-completion.ts:152` `codeCompletionStep`, `:203` `onCompletionResult` (path, window, line, word start); version checked in `onLspResult`; `src/core/state/completion.ts:203` `maybeCompletion` dispatches Markdown to unchanged `linkCompletion`; `rg "maybeOpenCompletion" src test` → no matches | `Satisfied` |
| `REQ9@R2 → DES10 → S16, S37 → V21, V58` | `None` | Main and additional edits in one undo step; cursor at `$0`; command after edits | `src/core/state/code-completion.ts:360` `applyCompletion` (one `applyBufferEdits` call, cursor from `item.cursor`, then automatic `executeCommand` pinned to `key`); Insert-merge in `buffers.ts:204` keeps one undo step after `<Esc>` | `Satisfied` |
| `REQ9@R2, REQ14@R2 → DES10 → S38 → V59` | `None` | Resolve bounded at 500 ms; item applied exactly once; none after a version change; never at a moved cursor | `acceptCode` (`code-completion.ts:251`), `onResolvedItem` (`:302`), `onResolveTimeout` (`:338`); exactly-once and version rules hold, but `stillAccepting` (`:296`) checks only path and version, so a cursor move or `<Esc>` during the wait applies the item at the moved cursor | `Mismatch` (`P1-G3-VER1`) |
| `REQ13@R1 → DES11 → S28` | `None` | A signature trigger character in a code buffer asks for signature help | `src/core/state/code-completion.ts:424` `maybeSignature` (`auto`, `replace`); wired at `keys.ts:66`; test `a signature trigger character asks for signature help` | `Satisfied` |
| S15 obsolete reference | `None` | No `maybeOpenCompletion` references remain | `rg "maybeOpenCompletion" src test` → exit 1, no matches | `Satisfied` |
| `V46` | `None` | `bun run check` passes with zero knip findings | Biome, tsc, knip, and unit suites pass | `Satisfied` |

### Deviation Assessment

The 14 recorded deviations were judged against DES10–DES13, design §6/§7, and the plan.

| Deviation | Assessment |
|---|---|
| 1. `applyBufferEdits` changes for all callers | Accepted. The Insert-change merge uses the same `merge` rule as the vim engine (`src/core/kernel/vim/engine.ts:79`), so inverses replay in order; same-position insert order and overlap refusal match LSP rules; cursor shifting improves link rewrites. `bun run check` (1184 pass) and `bun run test:ci` (229 pass) show no regression. Two gaps remain: the overlap refusal and the shift of cursors in other windows have no direct test (`P1-G3-VER3`), and code completion text joins the undo block but not `typed`, so `.` does not repeat an accepted completion (not required by the design). |
| 2. `startCodeEdit` without `then` | Accepted. A format edit touches only the saved open buffer and finishes synchronously, so `formattedSave` chaining `writeBuffer` is equivalent and keeps functions out of state. |
| 3. One LSP edit batch at a time | Accepted. The second edit is refused with exactly one reply, which protects the first batch's reply. |
| 4. Message and reply texts | Accepted. `failureReason` names refused or skipped paths, matching S40. |
| 5. `RenamePrompt.rename.name` | Accepted. Needed for the design's `invalid` rule after the value changes. |
| 6. `CodeAccept.key` and `applyCompletion(…, key, …)` | Accepted. The timeout path needs the producing server after the pending request is gone. |
| 7. Code actions; `none` silenced for `executeCommand`/`format`/`rangeFormat` | Accepted. Command after edit matches the design flow; `null` answers to these requests are normal. |
| 8. Format-on-save edge rules | Accepted. `:w` in the waiting buffer is a no-op and the wait is bounded; warnings use `info` because the toast type has no warning level. The write time is wrong (`P1-G3-VER2`). |
| 9. Completion request positions and matching | Accepted. Pause at word start (design), trigger and manual at the cursor; word-start match is stricter than the design's rule. |
| 10. Re-ranking | Accepted. Matches S14. |
| 11. Timer cleanup | Partly accepted. Pause, format, and resolve timers are cancelled or guarded on every path checked, but the pending accept is not dropped when Insert ends (`P1-G3-VER1`). |
| 12. `applyCompletion` details | Accepted, except that the main range is derived from the cursor at apply time (`P1-G3-VER1`). |
| 13. `onTimer(s, a, reg)` | Accepted. |
| 14. Out-of-scope items | Accepted. Runner notify belongs to P2-G1-T7; row painting to P3-G1-T3. |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V22` | `S17` | `DES12` | `bun test src/core/state/lsp-edits.test.ts` (in the 46-test run below) | Buffer edited, one `u` restores, `applyEdits` for `src/b.ts` with edits lacking `expected` | `Passed` |
| `V23` | `S18` | `DES12` | same | Text unchanged; message `edit: refused, src/a.ts changed in the editor`; one `lspReply{applied:false}` | `Passed` |
| `V24` | `S19` | `DES12` | same | No reply before `editsApplied`; one `applied:true` after; repeat `editsApplied` adds none; toast `1 file changed` | `Passed` |
| `V62` | `S40` | `DES12` | same | `failureReason: "skipped: src/c.ts (edit out of range)"`; toasts list the skipped file | `Passed` |
| T1/T2 regression | `S17`, `S19` | `DES12` | `bun test src/core/state/lsp-edits.test.ts src/core/state/link-edits.test.ts src/core/features/links src/core/state/explorer.test.ts` | 46 pass / 0 fail | `Passed` |
| `V25` | `S20` | `DES13` | `bun test src/core/state/lsp-commands.test.ts src/core/state/save.test.ts` | 24 pass / 0 fail; `:Format` result applied and `u` restores | `Passed` |
| `V26` | `S21` | `DES13` | same | `:w` emits `lsp format` and `lspFormat` 1000 ms with no `write`; autosave writes with no `lsp`; timeout writes, emits `lspCancel`, toasts `format timed out; saved without formatting` | `Passed` |
| `V18`, `V19`, `V20` | `S14`, `S15` | `DES10`, `DES6` | `bun test src/core/state/code-completion.test.ts src/core/state/keys.test.ts src/core/state/links.test.ts` | 41 pass / 0 fail | `Passed` |
| `V21`, `V58` | `S16`, `S37` | `DES10` | same | Import on line 0, label on cursor line, `<Esc>u` restores; cursor at `(1, 12)`; last effect automatic `executeCommand` without a request timer | `Passed` |
| `V59` | `S38` | `DES10` | same, plus an inspection probe (deleted afterwards) | Assigned test passes: exactly one apply, late result ignored, version change drops the accept. Probe: `ofo`, accept unresolved, `<Esc>`, `lspResolve` timer → `"const value = obj\nformato\nlet n = 1;"` | `Failed` (`P1-G3-VER1`) |
| `S28` signature trigger | `S28` | `DES11` | `code-completion.test.ts` signature case | `A(` → one automatic `signature` request; none without the feature | `Passed` |
| `V46` fast gate | `S32` | `DES1` | `bun run check` | Biome 339 files clean, tsc clean, knip clean, 1184 pass / 0 fail across 105 files | `Passed` |
| Core units | None | None | `bun test src/core` | 758 pass / 0 fail across 83 files | `Passed` |
| Shared-path regression | None | `DES12` | `bun run test:ci` | 229 pass / 0 fail across 28 files (`test/ui`, `test/integration`, `test/e2e`) | `Passed` |
| Obsolete reference | `S15` | `DES10` | `rg "maybeOpenCompletion" src test` | No matches | `Passed` |
| Work-process ids | None | None | `git diff --name-only 8519213..b3d1ccb \| xargs rg -n "W261005GWLY\|REQ[0-9]\|DES[0-9]\|\bV[0-9]+\b\|\bS[0-9]+\b\|P[0-9]-G[0-9]"` | No matches in the 20 changed files | `Passed` |
| One undo step | `S16`, `S17`, `S20` | `DES10`, `DES12`, `DES13` | Inspection of `applyBufferEdits` and tests | One `undo.push` per buffer, or one merge into the Insert block | `Passed` |
| Exactly-once reply including refusals | `S19`, `S40` | `DES12` | Inspection of `startCodeEdit`/`finish` and tests | Each path emits `replied` once; refusal and busy paths covered | `Passed` |
| Link rename protection | `S17` | `DES12` | `link-edits.test.ts`, `src/core/features/links` tests; inspection | Link rename always sets `expected`; check kept; new bounds only stricter | `Passed` |
| `:w`-only formatting | `S21` | `DES13` | Inspection; `autosave never formats` test | Only `writeActive` calls `formatThenSave` | `Passed` |
| 150 / 500 / 1000 ms bounds | `S14`, `S38`, `S21` | `DES10`, `DES13` | Tests and constants `PAUSE_MS`, `RESOLVE_MS`, `FORMAT_ON_SAVE_MS` | All asserted by tests | `Passed` |
| Timer cleanup | `S14`, `S21`, `S38` | `DES6`, `DES10`, `DES13` | Inspection of every exit path | Pause cancelled on close and guarded in `onCompletionTimer`; `lspFormat` cancelled on answer; `lspResolve` cancelled on resolved answer and harmless when it fires late; the pending accept survives `<Esc>` (`P1-G3-VER1`) | `Failed` |
| No snippet syntax in core | `S37` | `DES10` | `rg` over `src/core` for `$0`/`${n}` handling | None; core only reads `item.cursor` | `Passed` |
| Markdown link completion unchanged | `S15` | `DES10` | `keys.test.ts`, `links.test.ts`; inspection of `maybeCompletion` and `typedLink` | Markdown goes to `linkCompletion`, which already required `fileType === "markdown"` | `Passed` |
| Process cleanup | None | None | `pgrep -fl "fake-lsp\|bin/so"` after `test:ci` | No processes | `Passed` |

## Findings

### P1-G3-VER1 — Major — Correctness — A pending completion accept applies at a moved cursor after `<Esc>`

- **System Design:** `REQ9@R2, REQ14@R2, DES10, S38, V59`
- **UI Design:** `None`
- **Evidence:** `src/core/state/code-completion.ts:296` checks only path and version:

  ```ts
  function stillAccepting(s: AppState, a: CodeAccept): boolean {
    const b = activeBuffer(s);
    return b?.path === a.path && b.text.version === a.version;
  }
  ```

  `applyCompletion` (`:371-378`) then derives the main range from the cursor at apply time. `<Esc>` leaves Insert and moves the cursor one column left without changing the version. A unit probe through `createUpdate`: `ofo` → completion answer `format` (unresolved, server lists `completionResolve`) → `<CR>` → `<Esc>` → timer `lspResolve` gives `"const value = obj\nformato\nlet n = 1;"` with the cursor at `(1, 6)` in Normal mode. The resolved-answer path (`onResolvedItem`, `:302`) uses the same check. Design §7 states the check exists "so a key typed during the wait drops the accept instead of inserting at a moved cursor", and V59 names "inserted … at a moved cursor" as the unique risk.
- **Impact:** Typing a prefix, pressing Enter, and then `<Esc>` within 500 ms is a common Vim sequence. With a resolving server such as typescript-language-server, items without a `textEdit` range are inserted over the wrong span and corrupt the buffer. The item also lands as a separate undo step outside the Insert change.
- **Required resolution:** A pending accept applies only while the active window, Insert mode, and cursor position are what they were at accept time. Otherwise the accept is dropped and its resolve cancelled. Applying the item at the range recorded at accept time is an acceptable alternative. In both cases the buffer is never edited at a moved cursor.
- **Required proof:** A unit test in `src/core/state/code-completion.test.ts`: accept an unresolved item, send `<Esc>` (and, separately, a cursor-moving key), then fire `lspResolve` and send a late `completionItem` result. Assert that the text is exactly the typed text, or the item at the original word, that `lsp.accept` is undefined, and that at most one apply happened. `bun run check` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G3-VER2 — Minor — Correctness — Writes started from an LSP answer are stamped at time 0

- **System Design:** `REQ11@R1, DES13, S21, V26`
- **UI Design:** `None`
- **Evidence:** `src/core/state/lsp.ts:196` `formattedSave` calls `save(st, f.bufferId, 0)` because `lspResult` carries no time. A probe of `:w` with format on save, then a format `edit` answer, then `saveFailed{reason:"EACCES"}`, leaves the buffer at `{"kind":"failed","reason":"EACCES","attempt":1,"retryAt":1000}`. `src/ui/views/statusline.ts:103-106` computes the countdown as `max(0, ceil((retryAt - now()) / 1000))`, so it shows `retry in 0s` for the whole backoff. The `edit`, `action`, and `completionItem` branches also pass `0` to autosave scheduling. That case is harmless because the timer fires after the delay and `save.at <= a.now` holds.
- **Impact:** After a failed format-on-save write, the statusline shows the wrong retry countdown. Any later logic that compares `writing.at` with real time sees a 1970 timestamp.
- **Required resolution:** A write started from a format-on-save answer records a real time, for example from a `now` field on `lspResult`, so `retryAt` after a failure lies in the future.
- **Required proof:** A unit test where `:w` with format on save is answered by an edit and the write then fails asserts `retryAt` greater than the answer's time. `bun run check` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G3-VER3 — Minor — Test coverage — Shared `applyBufferEdits` changes lack direct tests

- **System Design:** `REQ10@R2, DES12, S17`
- **UI Design:** `None`
- **Evidence:** `src/core/state/buffers.ts:204` now refuses overlapping spans, orders same-position inserts by array order, and moves every window's cursor through the edits (`shifted`, `:181`). These changes affect every caller: link rewrite, mention linking, base cell edits, and server edits. `rg "overlap|same position|shifted" src/core --glob "*.test.ts"` finds no `applyBufferEdits` test. Only `applySpanEdits` has the overlap and insert-order assertions (`rename.test.ts` `span edits without expected text check only their bounds`). The V21 cursor assertion passes through `applyCompletion`'s explicit cursor placement, not through `shifted`.
- **Impact:** A regression in overlap refusal or cursor shifting, such as a cursor left on the wrong line after an import is added above it in a second window, would pass the suite.
- **Required resolution:** Unit tests cover `applyBufferEdits` overlap refusal (`stale`, text unchanged), insert order at one position, and the cursor shift of a non-active window showing the edited buffer.
- **Required proof:** `bun test src/core/state` with the new cases passing; `bun run check` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:** Open and closed file edit split and one undo step (V22); version, outside, and busy refusals with one reply (V23); reply after `editsApplied` only, with no duplicates (V24); skipped-file `failureReason` (V62); out-of-range open buffer skip; batch id separation from link rewrites; server edit joining the Insert change; rename prompt `invalid` rule and submit; code-action resolve, apply, and command order; command-only action; resolve error message; `:Format` undo (V25); format on save request, timer, answer, timeout, late answer, double `:w`, and failure (V26); autosave without formatting; trigger and pause (V18); local re-rank and incomplete re-request (V19); stale result and Markdown link popup (V20); popup close on leaving the word or Insert; manual empty result; auto-import undo (V21); cursor stop and automatic command (V58); resolve timeout, late result, resolved-first, and version change (V59); signature trigger; `applySpanEdits` without `expected`, line-end bound, insert order, and overlap.
- **Missing:** Accept dropped or applied at the original word after `<Esc>` or a cursor move during the resolve wait (`P1-G3-VER1`); real write time after a format-on-save answer (`P1-G3-VER2`); `applyBufferEdits` overlap refusal, same-position insert order, and non-active window cursor shift (`P1-G3-VER3`).

## Scope Changes

- `src/core/state/buffers.ts` (`applyBufferEdits`, exported `shifted`) is not among the planned main files. Its broader behaviour is recorded as deviation 1 and assessed above.
- `startMentionEdit` (`link-edits.ts`) now takes `nextEditBatch` instead of `now`, and `followMove` also follows `lsp.edit.pending`. Both are needed for shared batch ids and move following.
- `src/core/state/lsp-types.ts` adds `CodeAccept.key`; `src/core/state/types.ts` adds `RenamePrompt.rename.name` (deviations 5 and 6).
- `handleKeyAction` also calls `maybeCompletion` on the key that leaves Insert, so the pause timer is cancelled on `<Esc>`.

## Unverified Items

- Parts of the assigned chains owned by other groups were not verified: client capabilities (`resourceOperations: []`, code-action `resolveSupport`, `snippetSupport`; V33), `didChangeWatchedFiles` after closed-file writes (S40 second half, V63, P2-G1-T7), host routing of `lspApplyEdit` and `lspReply`, signature float display and closing (S28 UI, P1-G2/P3), and completion row painting (P3-G1-T3).
- No real language server was exercised. All evidence comes from reducer-level unit tests, inspection, and the `test:ci` regression run.

## Blockers

None
