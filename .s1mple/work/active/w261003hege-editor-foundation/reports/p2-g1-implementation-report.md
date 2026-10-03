# P2-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-2-core-state-and-workspace.md`
- **Group:** `P2-G1` — Protocol, Store, and Reducers
- **Tasks:** `P2-G1-T1`, `P2-G1-T2`, `P2-G1-T3`, `P2-G1-T4`, `P2-G1-T5`
- **Report:** `.s1mple/work/active/w261003hege-editor-foundation/reports/p2-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G1-T1` | `src/core/state/types.ts`: the DI1 protocol (`AppState`, `BufferState`, `SaveState`, `WindowState`, `TerminalState`, `ExplorerState`, `PromptState`, `Overlay`, `Toast`, `MouseEvent`, `Action`, `Effect`, `FsOp`, `FileEvent`, `Stamp`, `TextFile`, `DirEntry`, `TimerId`, `Result`). `src/core/config/schema.ts`: `ConfigSchema`, `AppConfig`, `defaults`. `src/core/state/init.ts`: `initialState`. `src/core/state/store.ts`: `createStore`, `Store`. `src/core/state/update.ts`: `createUpdate`, `Update`, `Registries`, try/catch containment, and the temporary `default`. `src/core/state/result.ts`: `none`, `chain`, `message`, `toast`, `notifyError`. `src/core/state/commands.ts`: `CommandContext`, `CommandResult`. Test support is in `test/support/state.ts`. | RED: `bun test src/core/state/update.test.ts` → 1 error (module `./store` missing). GREEN: 2 pass. `bun test test/boundaries.test.ts` → 2 pass. biome and tsc pass. | `d4937a7` | `Completed` |
| `P2-G1-T2` | `src/core/state/save.ts`: `scheduleAutosave`, `writeBuffer`, `onTimer`, `onSaved`, `onSaveFailed`, `requestQuit`, `closeBuffer`, `pendingWrites`, private `writable`, `retryDelay`, `advanceQuit`. `src/core/state/buffers.ts`: `saveText`, `setBuffer`, `bufferForPath`, `removeBuffer`, `closeActiveWindow`, window helpers. `update.ts` routes `timer`, `saved`, and `saveFailed`. | RED: `bun test src/core/state/save.test.ts` → 1 error (module missing). GREEN: 10 pass. biome and tsc pass. | `579fb73` | `Completed` |
| `P2-G1-T3` | `src/core/state/disk.ts`: `onFileChanged`, `onDiskLoaded`, `resolveConflict`, `markDeleted`, and the shared private `reload`. `buffers.ts` adds `openPath`, `onFileLoaded`, `onFileRefused`, `showBuffer`, `splitFile`, `buffersUnder`. `save.ts` adds `autosaveNow`. `explorer.ts` adds `relist`, `pruneTree`, and `dirname`. `update.ts` routes `fileChanged`, `fileLoaded`, and `fileRefused`. | RED: `bun test src/core/state/disk.test.ts` → 1 error (module missing). GREEN: 9 pass. All `src/core/state` tests (21) pass. | `e47b9de` | `Completed` |
| `P2-G1-T4` | `src/core/state/explorer.ts`: `explorerOp`, `onFsResult`, `onDirListed`, `toggleExplorer`, `createTarget`, `withTrash`, private `repathBuffers`. `update.ts` routes `dirListed`, `fsResult`, and `trashAvailable`. | RED: `bun test src/core/state/explorer.test.ts` → 1 error (exports missing). GREEN: 7 pass. All `src/core/state` tests (28) pass. | `6cc2eb0` | `Completed` |
| `P2-G1-T5` | `src/core/state/keys.ts`: `handleKeyAction`, `onClipboardText`, and private `applyVimEffects`, `cmdlineKey`, `conflictKey`, `runVim`, `paste`. `src/core/state/commands.ts`: `registerBuiltins`, `EX_ALIASES`, `runCommand`, `executeEx` (with `:s`/`:%s` and E492), and private `AppCommand`. `src/core/state/status.ts`: `statusSegments`, `StatusSegments`, private `countWords`. `explorer.ts` adds tree navigation and prompts. The temporary `default` is removed from `update.ts`; a `const unhandled: never = action` check now follows the switch. `test/vim/vim.test.ts` replays every case through `createUpdate`. | RED: `bun test src/core/state test/vim` → 272 fail. GREEN: `bun test src/core/state test/vim` → 334 pass, 0 fail. After the knip tidy and `status.test.ts`: `bun test src/core test/vim` → 369 pass. `grep -n default src/core/state/update.ts` → no match. tsc exit 0. | `6d97b00` | `Completed` |

Each verification case maps to a test file, test name, and command. Tests are named by behavior, per the no-process-ID rule. Every row passes.

| Case | Test file → test name | Command |
|---|---|---|
| V7.3 (purity) | `src/core/state/update.test.ts` → `the same action on a deep-frozen state gives equal results`, plus `the store runs effects in order, then notifies subscribers once` | `bun test src/core/state/update.test.ts` |
| V7.3 (thrown command) | `src/core/state/update.test.ts` → `a throwing command keeps the previous state and reports the error` | `bun test src/core/state/update.test.ts -t "throwing command"` |
| V3.3 | `src/core/state/save.test.ts` → `an edit autosaves once after the delay and failed saves back off`; status: `src/core/state/status.test.ts` → `status shows a failed save and its retry time` | `bun test src/core/state -t "autosaves once\|failed save"` |
| V3.5 | `save.test.ts` → `typing during a write keeps the buffer dirty and writes again` | `bun test src/core/state/save.test.ts -t "typing during a write"` |
| V4.1 | `save.test.ts` → `:q flushes dirty buffers, then exits`, `:q with nothing to save exits at once` | `bun test src/core/state/save.test.ts -t ":q"` |
| V4.2 | `save.test.ts` → `:q stays open when the flush fails` | same |
| V4.3 | `save.test.ts` → `:q is blocked by a conflicted or a dirty deleted-on-disk buffer` | same |
| V4.4 | `save.test.ts` → `:q! exits without writing`, `:q with two windows closes only the window`, `:bd! closes a dirty buffer without writing`; also `:bd flushes first and closes only after the write succeeds` (REQ5 `:bd`) | `bun test src/core/state/save.test.ts -t ":q\|:bd"` |
| V5.2 | `src/core/state/disk.test.ts` → `a clean buffer deleted on disk is never autosaved and comes back on reappearance` | `bun test src/core/state/disk.test.ts -t "deleted on disk"` |
| V5.3 | `disk.test.ts` → `a dirty buffer deleted on disk blocks :q and :w recreates it` | same |
| V5.4 | `disk.test.ts` → `an external change reloads a clean buffer as one undo step`, `an external change to a dirty buffer opens a conflict and writes nothing`, `a save conflict reads the disk version back`; keys: `keys.test.ts` → `conflict keys keep, take, or diff` | `bun test src/core/state -t "external change\|save conflict\|conflict keys"` |
| V13.2 | `src/core/state/explorer.test.ts` → `rename flushes a dirty buffer first, then follows it to the new path`, `moving a folder re-paths every buffer below it` | `bun test src/core/state/explorer.test.ts` |
| V13.3 | `explorer.test.ts` → `trash flushes a dirty buffer, then closes it or keeps it if the flush failed` | same |
| V13.5 | `explorer.test.ts` → `create adds .md only without an extension; a trailing slash makes a folder`, `a failed operation reports its reason; a failed trash turns trash off` | same |
| V7.5 | `src/core/state/keys.test.ts` → `a bound key sequence runs its command and never reaches the vim engine`, `explorer keys resolve in explorer mode and never edit the buffer`, `a filetype binding wins over the global binding for the same keys` | `bun test src/core/state/keys.test.ts -t "bound key sequence\|explorer keys resolve\|filetype binding"` |
| V10.3 | `keys.test.ts` → `"+ copies to the clipboard and reports a clipboard failure`, `"+p pastes the clipboard text, or registers["+"] when the clipboard fails` | `bun test src/core/state/keys.test.ts -t '"\+'` |
| V2.1 (all cases) | `test/vim/vim.test.ts` → `matches Neovim: <case id>` (289 cases, including `ex-substitute-line`, `ex-substitute-line-global`, `ex-substitute-all`, `ex-substitute-all-global`), all through `createUpdate` | `bun test test/vim` → 291 pass, 0 todo |
| E486 handoff (P1-G2 remediation) | `keys.test.ts` → `a search with no match shows E486 on the message line` (`applyVimEffects` maps `search` → `searchError` → message line, level `error`) | `bun test src/core/state/keys.test.ts -t "E486"` |
| Exhaustiveness | No `default` in `update.ts`; `const unhandled: never = action` follows the switch | `bun --bun run tsc --noEmit -p .` → exit 0 |

The remaining tests in `keys.test.ts` cover the rest of the T5 outcome: leaving Insert saves; `:w` shares the command path with `buffer.write`; E492; `:e` paths relative to the root; Tab completion; explorer prompts; `:bn`/`:bp`. `status.test.ts` proves that `words` appears only for Markdown buffers.

### Group Change Range

- **Starting commit:** `4baa076` (clean tree)
- **Final commit:** `6d97b00`
- **Remaining group changes:** None

### Group Verification

- `bun test src/core test/vim` → `Passed` — 369 pass, 0 fail, 0 todo (13 files).
- `bun test test/boundaries.test.ts` → `Passed` — 2 pass. `core/state` and `core/config` import only core and `zod`.
- `bunx biome check .` → `Passed` — 63 files, no findings.
- `bun --bun run tsc --noEmit -p .` → `Passed` — exit 0, with no `default` branch in `update.ts`.
- `bun run check` → `Failed` (expected under the interim knip rule). biome and tsc pass; knip exits 1 with only the findings listed below. The unit stage, run directly as `bun test src test/boundaries.test.ts test/repo.test.ts test/vim`, gives 374 pass and 0 fail (15 files).
- Process-ID scan: `grep -rnE '\b(REQ|DES|RF|UREQ|UDES|US|UV)[0-9]+|\b[SV][0-9]+(\.[0-9]+)?\b|\bP[0-9]+-G[0-9]+|W26[0-9]|RM26|\bDI[0-9]|\bPH[0-9]\b|\bG1\b|VER[0-9]|\b(task|goal|roadmap)\b' src test scripts --include='*.ts'` → `Passed` (no match, exit 1).
- Purity scan: `grep -rnE "Date\.now|performance\.|process\.|setTimeout|Math\.random" src/core/state src/core/config` → `Passed` (no match).
- Self-review of `git diff 4baa076..6d97b00` (21 files, +3331/−16) → no issue needs a follow-up commit. Before the T5 commit, `isConflicted`, `retryDelay`, `applyVimEffects`, `countWords`, and `AppCommand` were made module-private because nothing outside their module uses them.

Interim knip findings at the final commit:

| Finding | Kind | Interim status | Later consumer |
|---|---|---|---|
| `WindowId`, `DirEntry`, `TimerId`, `Overlay` (`src/core/state/types.ts`) | unused exported types | G1 protocol (`types.ts`) | effect runner (P2-G2), UI views and overlays (P3-G1) |
| `pendingWrites` (`src/core/state/save.ts`) | unused export | Plan-listed output | `src/app/lifecycle.ts` shutdown flush (P3-G1) |
| `ConfigSchema` (`src/core/config/schema.ts`) | unused export | **Not** a G1 symbol; §4 lists it | Config-file loading (`RM261003ABZP-DI2`, outside this work). See deviation 9 |
| `ViewSpec`, `WhichKeyItem` | unused exported types | Carried over from P1-G2 | Markdown views; which-key UI |
| `@opentui/core`, `ignore`, `@xterm/headless` | unused dependencies | Accepted in P1-G1 | UI, workspace, UI tests |

This group cleared the earlier P1-G2 findings for `kernel/vim/ex.ts`, `kernel/commands/{registry,defaults}.ts`, and `Keymap`/`KeyScope`. They are now used by `core/state`.

### Deviations and Remaining Issues

A fresh remediator must preserve these decisions:

1. **`SaveState.writing` is `{ kind: "writing"; version; at; attempt }`, not `{ version }`.** `saveFailed` and `saved` carry no time, so the design's `retryAt = now + retryDelay` had no `now`. A retry also replaces `failed` with `writing`, which would lose the backoff count. `at` is the time the write was requested. `attempt` counts the failures before it. `writeBuffer(s, id, now, { recreate? })` therefore takes `now`, and so do `requestQuit(s, opts, now)`, `closeBuffer(s, id, opts, now)`, `explorerOp(s, op, now)`, and `resolveConflict(s, choice, now)`. A re-write from `onSaved` reuses the previous `at`.
2. **`BufferState.closing?: true`.** REQ5 says `:bd` closes only after its flush succeeds. The design has a continuation for quit (`terminal.quit`) but none for `:bd`. `onSaved` closes a clean `closing` buffer; `onSaveFailed` clears the flag.
3. **`registers` live in `AppState.vim`** (`vim: VimState & { registers; pendingPaste? }`). §6 lists registers under `vim`, but the §7 type omits them. No new top-level field was added.
4. **Shapes the design leaves open:**
   - `PromptState` is `{ kind: "confirm" | "input" | "typed"; title; value; op: FsOp }`. For `create`, `op.from` is the target folder.
   - `Toast` is `{ id; level: "info" | "error"; text }`. Info toasts expire through `toast:<id>` after 3 s; error toasts stay. The next id is the highest current id + 1.
   - `MouseEvent` is `{ kind: "scroll"; delta }`, which scrolls the active window. Clicks are left to P3.
5. **An empty window has no `windows.byId` entry.** The UI empty state ("nothing open") needs a window without a buffer, and `WindowState.content` requires a `bufferId`. `initialState` starts with one empty window and the explorer open and focused.
6. **Key routing details:**
   - The `":"` command line is edited in `core/state` (`cmdlineKey`), not in the engine, so `:e` works with nothing open or from the explorer. `/` and `?` still go through the engine.
   - The keymap lookup passes `filetype` (the design snippet shows only `{ mode }`), because V7.5 requires the filetype binding to win.
   - In explorer mode, unbound keys never reach the engine.
   - `runVim` keeps the cursor on screen: `scroll` follows the cursor with `rows = terminal.rows − 2`.
7. **`"+p` fallback.** The paste runs the engine's own `p`/`P` against a scratch unnamed register, then restores the registers and sets `lastChange` to `"+p`/`"+P`. A paste is applied only while the pending buffer is active and the mode is Normal. Because the reply has no time, the paste's autosave uses `now = 0`, so it is due at the next autosave timer.
8. **Message texts not fixed by the design:**
   - `cannot read file — not opened (<path>)` for the `io` refusal.
   - `E32: No file name` for `:e` and `:w` with nothing to write.
   - `outside the workspace: <arg>` for `:e`.
   - `cannot list <dir>: <reason>`.
   - `deleted on disk — :w to recreate` uses level `info`.
   - The `:bd` block reuses the `E37` text, per "same block/flush rules".
9. **`ConfigSchema` stays exported.** §4 names it, and its consumer is DI2 config loading, outside this work. P3-G1-T6 (zero knip findings) must either un-export it or accept it.
10. **Files beyond the §4 list:**
    - `src/core/state/result.ts` holds the shared Result helpers (the T1 REFACTOR allows helpers inside `src/core/state`).
    - `test/support/state.ts` holds the shared test registries and fixtures.
    - `src/core/state/status.test.ts` is a colocated unit test for the Markdown-only `words` rule.
11. **Smaller rules:**
    - `:wq` maps to `app.quit`, because `:q` already flushes every dirty buffer.
    - `:q` and `:q!` with more than one window close only the active window (inside `requestQuit`).
    - A trash `fsResult` for a buffer that is still dirty uses `markDeleted`. This also cancels its retry timer and shows the deleted message.
    - A watcher removal also relists the parent folder.
12. **Module import cycles.** `buffers` ↔ `save` ↔ `disk` ↔ `explorer` import each other's functions, as the design's call graph implies. Only function declarations cross the cycles, so module evaluation is safe.

## Remediation

All three findings are fixed in two code commits; the V-case commands are corrected below.

- **Verification reports:** `.s1mple/work/active/w261003hege-editor-foundation/reports/p2-g1-verification-report.md` (commit `1959b23`, `Failed`; unchanged)
- **Status:** `Completed`

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G1-VER1` | **Cause:** `onSaved` re-wrote text typed during a write at once, so the follow-up write targeted the old path behind a queued rename and its reply never resolved. **Change:** `src/core/state/save.ts` `onSaved` now follows the design's own autosave flow (system design "Save and autosave": typed during write → `scheduleAutosave`). Text typed during a write is autosaved after the delay, at the buffer's path at that time, so a rename or move queued behind the write lands first. With autosave off, a pending `:q` or `:bd` still writes at once. No new state, protocol member, or gate: `writable` stays the single gate. **Proof:** `src/core/state/explorer.test.ts` → `a rename during a write, after typing during it, autosaves the newest text to the new path` drives the verifier's sequence through `createUpdate` (edit → autosave timer → edit during the write → explorer keys `r…c.md<CR>` → `saved(a.md)` → `fsResult ok` → autosave timer → `:q` → `saved(c.md)`). It asserts the buffer is `scheduled`, not `writing`, after `saved`, and at `c.md` and not `writing` after `fsResult`. It also asserts that `:q` exits after `saved(c.md)` and that the only disk effects are, in order, `write a.md "xhello"`, `rename a.md→c.md`, and `write c.md "xxhello"`. RED against the old `save.ts` (`git stash` of the fix): 1 fail at the `scheduled` assertion. GREEN: 1 pass. `save.test.ts` → `typing during a write keeps the buffer dirty and writes again` now expects `startTimer autosave:1`, then the write on the timer. The new test `:q with autosave off writes text typed during its flush at once` covers the remaining branch. `bun test src/core test/vim` → 371 pass, 0 fail | `35f40c6` | `Fixed` |
| `P2-G1-VER2` | `src/core/config/schema.ts`: `ConfigSchema` is no longer exported; it still defines `AppConfig` and `defaults`. `bun run check` → knip lists only the interim items (`@opentui/core`, `ignore`, `@xterm/headless`, `pendingWrites`, `ViewSpec`, `WhichKeyItem`, `WindowId`, `DirEntry`, `TimerId`, `Overlay`); no `ConfigSchema`. `bun --bun run tsc --noEmit -p .` → exit 0 | `b08110a` | `Fixed` |
| `P2-G1-VER3` | Report-only correction: the V-case commands in Corrected V-Case Commands use a bare pipe (JS-regex alternation) instead of a backslash-escaped pipe, in a code block so they run as written. Each was run as written: V3.3 → 2 pass; V4.1–V4.4 → 9 pass (8 before plus the new autosave-off `:q` test); V5.4 → 4 pass; V7.5 → 3 pass; 0 fail each | No code change — report correction recorded in this section (report commit) | `Fixed` |

**`P2-G1-VER1` Completion Checklist:**

- [x] Required resolution is implemented.
- [x] Required proof passes.
- [x] Change evidence is recorded.
- [x] Verification evidence is recorded.

**`P2-G1-VER2` Completion Checklist:**

- [x] Required resolution is implemented.
- [x] Required proof passes.
- [x] Change evidence is recorded.
- [x] Verification evidence is recorded.

**`P2-G1-VER3` Completion Checklist:**

- [x] Required resolution is implemented.
- [x] Required proof passes.
- [x] Change evidence is recorded.
- [x] Verification evidence is recorded.

### Corrected V-Case Commands

These replace the four `\|` commands in the Initial Implementation mapping table. They are listed in a code block, not a table, so each can be copied and run exactly as written; `|` is JS-regex alternation for `bun test -t`. The other rows' commands were rerun unchanged and still select tests.

```sh
bun test src/core/state -t "autosaves once|failed save"                    # V3.3 → 2 pass, 0 fail
bun test src/core/state/save.test.ts -t "typing during a write"            # V3.5 → 1 pass, 0 fail
bun test src/core/state/save.test.ts -t ":q"                               # V4.1–V4.3 → 7 pass, 0 fail
bun test src/core/state/save.test.ts -t ":q|:bd"                           # V4.4 plus :bd → 9 pass, 0 fail
bun test src/core/state/disk.test.ts -t "deleted on disk"                  # V5.2, V5.3 → 2 pass, 0 fail
bun test src/core/state -t "external change|save conflict|conflict keys"   # V5.4 → 4 pass, 0 fail
bun test src/core/state/explorer.test.ts                                   # V13.2, V13.3, V13.5 → 8 pass, 0 fail
bun test src/core/state/explorer.test.ts -t "rename during a write"        # V13.2 in-flight write → 1 pass, 0 fail
bun test src/core/state/update.test.ts -t "throwing command"               # V7.3 → 1 pass, 0 fail
bun test src/core/state/keys.test.ts -t "bound key sequence|explorer keys resolve|filetype binding"  # V7.5 → 3 pass, 0 fail
bun test src/core/state/keys.test.ts -t '"\+'                              # V10.3 → 2 pass, 0 fail
bun test src/core/state/keys.test.ts -t "E486"                             # E486 handoff → 1 pass, 0 fail
bun test test/vim                                                          # V2.1 → 291 pass, 0 fail
```

`V4.4` gains one test (the autosave-off `:q` test) and `V13.x` gains one (the rename-during-write test) over the initial counts of 8 and 7.

### Remediation Notes

- **Behavior change kept within the design:** text typed during a write is now written on the next autosave timer (default 1 s) instead of at once. The system design's autosave flow specifies this; its §7 `onSaved` comment ("writeBuffer again") disagreed, and the flow version is the one that keeps queued file operations ordered. V3.5 still holds: the buffer stays dirty and a second write with the newer text follows.
- **Residual timing assumption:** a pure reducer cannot tell whether a rename is still queued. Two paths can still emit a write to the old path before `fsResult` arrives. The first is an autosave timer that fires before the rename completes, which needs a rename to take longer than the autosave delay while it sits directly behind the write. The second is a write the user starts (`:w`, leaving Insert, `:q`) within the rename's latency. No reply-driven write reaches the old path any more. Closing those timing paths by construction would need a new "operation pending" buffer field, which this remediation must not add.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. Every verifier finding is `Fixed`, and every group check passes except knip, which reports only the interim items.
- **Final report commit:** returned to the orchestrator.
- **Final commits:** `d4937a7`, `579fb73`, `e47b9de`, `6cc2eb0`, `6d97b00`; remediation `35f40c6` (`P2-G1-VER1`), `b08110a` (`P2-G1-VER2`).
- **Final checks:**
  - `bun test src/core test/vim` → 371 pass, 0 fail (13 files).
  - `bun test test/boundaries.test.ts` → 2 pass.
  - `bunx biome check .` → 63 files, no findings.
  - `bun --bun run tsc --noEmit -p .` → exit 0.
  - `bun run check` → biome and tsc pass; knip exits 1 on the interim items only (no `ConfigSchema`). The unit stage, run directly as `bun test src test/boundaries.test.ts test/repo.test.ts test/vim`, gives 376 pass, 0 fail (15 files).
  - The process-ID scan over `src test scripts` (`*.ts`) and `.github` finds no match.
- **Remaining issues:** the residual timing assumption in Remediation Notes. Parent synchronization of the protocol refinements in deviations 1–4 stays pending with the main orchestrator.
