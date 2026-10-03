# W261003HEGE Plan Part 2 — Core State and Workspace

## Status

`Ready`

## Objective

Land the DI1 protocol and the pure reducers that make every data-safety rule a state decision (autosave, retry, quit and close, disk events, conflicts, explorer operations, key routing, clipboard paste), then the workspace adapters (atomic file I/O, exclusion, watcher with own-operation suppression, trash, clipboard detection) behind one effect runner whose serial queue orders every mutating file-system effect. At the end of this part the full save, reload, conflict, delete, and explorer flows are proven against a real file system and real `fs.watch`.

## Coverage Summary

- **System Design:** `W261003HEGE-REQ1@R3, REQ3@R1, REQ5@R1, REQ6@R1, REQ7@R2, REQ8@R2, REQ9@R1, REQ10@R2, REQ11@R2 → DES2, DES3, DES4, DES5, DES6, DES8, DES10, DES11, DES12, DES13 → S2, S3, S4, S5, S6, S7, S10, S11, S12, S13 → V2.1 (ex cases), V3.1–V3.5, V4.1–V4.4, V5.1–V5.5, V6.4, V6.5, V7.3, V7.5, V10.1–V10.4, V11.1–V11.3, V12.1–V12.4, V13.1–V13.5`
- **UI Design:** `None — reducers and adapters; UI states that render this state are verified in Part 3`

## Sources

- Plan index: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-index.md`
- Plan context: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-context.md`
- System design: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-system-design.md`
- UI design: `Not applicable — no work-level UI design; parent rm261003abzp-ui-design.md is consumed in Part 3`
- System requirements: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-requirements.md`
- UI requirements: `Not applicable — parent UREQs bound through W261003HEGE-REQ1@R3 and verified in Part 3`
- Research: `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-research.md`
- Roadmap binding: `w261003hege-discuss-context.md`, Roadmap Binding (RM261003ABZP-PH1@R2, RM261003ABZP-DI1@R2)

## Dependencies

- Part 1 complete and verified: `bun run check`, `test/boundaries.test.ts`, kernel contracts (`TextBuffer`, `UndoHistory`, `Registers`, `WindowTree`, `VimState`, `BufferVim`, `VimEffect`, `handleKey`, `parseEx`, `exCompletions`, `CommandRegistry`, `Keymap`, `KeyScope`, `defaultBindings`), `FileTypeRegistry`, `EditorKindRegistry`, `textFileType`, `codeFileTypes`, `markdownFileType`, and the `test/vim` replay harness with ex cases pending.

## Execution Rules for Every Group

- Every delegated agent reads and follows `.s1mple/S1MPLE.md` and its required references (`.s1mple/docs/communication.md`, `.s1mple/docs/project.md`, `.s1mple/docs/languages/typescript.md`) before acting.
- Subagents do not spawn subagents. Do not use the native `Explore` subagent; inspect directly or use `s1mple-explore`.
- Implementation is lean and simple: no AppState field outside the phase file's DI1 list (`…phase-1…md:188-192`); protocol additions are exactly `listDir`, `dirListed`, `clipboardText.error`, `FsOp.permanent`, `fileRefused` `"io"` (`W261003HEGE-REQ1@R3`); no `Date.now()` or I/O in `src/core` (time arrives in `key`/`timer` actions).
- The system design is the authority; previews show only task-owned deltas.
- Do not edit parent roadmap files; parent synchronization is pending.
- **Interim `knip` rule** (Part 1): findings are allowed only for G1 symbols consumed by P3-G1 (e.g., `createEffectRunner`, `watchWorkspace`, `detectTrash`, `detectClipboard`, `pendingWrites`, `statusSegments`); list them in the group report.

## Execution Flow

```text
P2-G1: Protocol, store, and reducers → P2-G2: Workspace adapters, effect runner, and integration
```

## Groups

The user's command to execute the goal includes planned commits, subject to binding project instructions and any limits in the command; do not request separate permission. Commit each task after its checks and self-review pass and before starting the next task. Follow the repository's Conventional Commits convention with task IDs and exact plan titles in the body. Task commits are checkpoints, not group acceptance. Record no-change evidence instead of an empty commit.

### P2-G1 — Protocol, Store, and Reducers

#### Goal

`src/core/state/types.ts` defines the DI1 protocol at the designed shape; `createStore(initial, update, run)` and `createUpdate(registries)` give a pure, exhaustive, error-contained reducer; and the save, disk, explorer, key-routing, command, buffer, and status reducers satisfy every unit case with effects inspected as data. All recorded vim cases, including ex cases, replay equal through `createUpdate`.

#### Coverage Summary

- **System Design:** `REQ1@R3, REQ3@R1, REQ5@R1, REQ6@R1, REQ7@R2, REQ8@R2, REQ10@R2, REQ11@R2 → DES2, DES3, DES4, DES5, DES6, DES10, DES13 → S2, S3, S4, S5, S7, S10, S11, S13 → V2.1 (ex cases), V3.3, V3.5, V4.1–V4.4, V5.2–V5.4, V7.3, V7.5, V10.3, V13.2, V13.3, V13.5`
- **UI Design:** `None — pure reducers`

#### Scope

- Included: `src/core/state/{types,store,update,init,keys,buffers,save,disk,explorer,commands,status}.ts`, `src/core/config/schema.ts`, colocated unit tests, switching `test/vim/vim.test.ts` replay to `createUpdate`.
- Excluded: any I/O, timers, or OpenTUI; adapters and runner (P2-G2); UI (P3-G1); config file loading and `SO_LOG` (DI2).
- Main files: system design §4 lines 304–339.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ1@R3 → DES2 → S7 → V7.3` | None | Pure, exhaustive reducer; thrown command keeps state and notifies |
| `REQ1@R3 → DES3, DES2 → S7 → V7.5` | None | Keymap beats vim; explorer mode; filetype scope wins |
| `REQ1@R3, REQ3@R1 → DES3 → S2 → V2.1` | None | Every recorded case (incl. `:s`, `:%s`) equal through `createUpdate` |
| `REQ1@R3 → DES4 → S3 → V3.3, V3.5` | None | One write per stage; backoff 1,2,4…30 s; re-write after typing during a write |
| `REQ5@R1 → DES4 → S4 → V4.1–V4.4` | None | Quit continuation, failure cancels quit, E37 blocks, `!` semantics |
| `REQ6@R1 → DES5 → S5 → V5.2–V5.4` | None | Deleted-on-disk without resurrection; undoable reload; conflict on dirty |
| `REQ10@R2, REQ8@R2 → DES13 → S13, S11 → V13.2, V13.3, V13.5` | None | Flush-then-op effects; re-path; close/keep; create target rules; trash failure |
| `REQ7@R2 → DES10 → S10 → V10.3` | None | Clipboard failure message; paste falls back to `registers["+"]` |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G1 — `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`; producer DI1, consumer RM261003ABZP-DI2@R2 | P2-G1 produces the G1 store outputs (`update` via `createUpdate`, `createStore`, `Action`/`Effect` unions); due before DI2 execution | Protocol equals system design §7 `types.ts` with only the five allowed additions; V7.3 passes; parent V2@R1 ↔ V2.1 complete here; evidence collected in P3-G1-T6 | RM261003ABZP-DI2@R2 |

#### Tasks

##### P2-G1-T1 — Define the DI1 protocol, store, and reducer shell

- **Outcome:** `types.ts`, `config/schema.ts` (`ConfigSchema`, `defaults`, `AppConfig`), `init.ts` (`initialState`), `store.ts` (`createStore`, `Store`), and `update.ts` (`createUpdate`, `Update`, `Registries`, try/catch containment) exist; `update` is pure on deep-frozen state.
- **System Design:** `W261003HEGE-REQ1@R3` → `W261003HEGE-DES2` → `S7` → `V7.3` (purity half; thrown-command half in T5)
- **UI Design:** `None — core state`
- **Canonical Shapes:** System design §7 `src/core/state/types.ts` (lines 1325–1407); `store.ts` and `update.ts` (lines 1409–1475); §5 Construction and Wiring, Configuration bullet (line 918); §6 State models (lines 964–1050)
- **Files:** `src/core/state/{types,store,update,init}.ts`, `src/core/config/schema.ts`, `src/core/state/update.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V7.3` (purity):** `src/core/state/update.test.ts`

   **Preview:**

   ```ts
   test("V7.3 same (state, action) twice on a deep-frozen state", () => {
     const s = deepFreeze(initialState(boot)); const update = createUpdate(testRegistries());
     const a = { type: "resize", cols: 100, rows: 30 } as const;
     expect(update(s, a)).toEqual(update(s, a));     // no mutation error thrown
   });
   ```

   - Run `bun test src/core/state/update.test.ts` and confirm failure.

2. **GREEN:** protocol, defaults, init, store, update shell

   **Preview:**

   ```ts
   // types.ts: §7 lines 1356–1389 verbatim shapes, parent DI1 variants from …phase-1…md:205-217 plus the five additions
   // schema.ts: defaults = { escTimeoutMs: 50, autosave: { enabled: true, delayMs: 1000 }, theme: "dark", color: "auto" } (zod)
   // update.ts: §7 lines 1441–1461. Temporary scaffold until T5: action types whose handler module lands in a
   //            later task of this group fall to `default: return { state, effects: [] }`; T5 removes the default
   //            and restores the exhaustive `never` check.
   ```

   - `initialState(boot)` takes `{root, cols, rows, color}` from `main`; no `process.env` read in core.

3. **REFACTOR:** Keep `Result`, `none`, `chain`, `message` helpers in one small module-local place used by reducers.

   **Preview:**

   ```ts
   // allowed: shared Result helpers inside src/core/state; prohibited: new top-level AppState fields or new Action/Effect members
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): add DI1 protocol, store, and reducer shell

   Task: P2-G1-T1 — Define the DI1 protocol, store, and reducer shell
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V7.3` (purity) — `bun test src/core/state/update.test.ts` → equal results, no mutation error.
- `V7.1` — `bun test test/boundaries.test.ts` → `core/state` imports no I/O or runtime.

##### P2-G1-T2 — Implement autosave, retry, quit, and close reducers

- **Outcome:** `save.ts` (`scheduleAutosave`, `onTimer`, `writeBuffer`, `onSaved`, `onSaveFailed`, `requestQuit`, `closeBuffer`, `pendingWrites`, `retryDelay`) and `buffers.saveText` satisfy autosave, retry, quit continuation, and close rules with the single `writable` gate.
- **System Design:** `W261003HEGE-REQ1@R3, REQ5@R1, REQ6@R1` → `W261003HEGE-DES4` → `S3, S4` → `V3.3, V3.5, V4.1, V4.2, V4.3, V4.4`
- **UI Design:** `None — core state`
- **Canonical Shapes:** System design §7 `src/core/state/save.ts` (lines 1477–1549); §5 Save and autosave, Quit and close (lines 721–758)
- **Files:** `src/core/state/save.ts`, `src/core/state/buffers.ts` (`saveText` only here), `src/core/state/save.test.ts`, `update.ts` (route `timer`, `saved`, `saveFailed`)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V3.3`, `V3.5`, `V4.1`–`V4.4`:** `src/core/state/save.test.ts`

   **Preview:**

   ```ts
   test("V3.3 autosave and backoff", () => {
     // edit at t=0 → startTimer autosave:1 1000; timer at 1000 → exactly one write;
     // saveFailed ×N → startTimer retry ms 1000, 2000, 4000, 8000, 16000, 30000, 30000; message saveError set
   });
   test("V3.5 typing during write", () => { /* saved for older version → dirty stays true; second write with newer text */ });
   test("V4.1 :q flushes then exits", () => { /* terminal.quit.waiting [id]; saved → Effect exit(0) */ });
   test("V4.2 :q with saveFailed", () => { /* no exit; quit cleared; message "save failed: EACCES…" */ });
   test("V4.3 :q blocked", () => { /* conflicted and dirty deleted-on-disk → "E37: No write since last change (<path>)"; [] */ });
   test("V4.4 :q!, two windows, :bd!", () => { /* exit(0) no write; closeWindow only; buffer removed no write */ });
   ```

   - Drive through `createUpdate` with `timer`/`saved`/`saveFailed` actions and direct calls to `requestQuit`/`closeBuffer` where ex routing (T5) is not yet present. Confirm failure.

2. **GREEN:** `save.ts` and `buffers.saveText`

   **Preview:**

   ```ts
   // §7 lines 1500–1535: writable, scheduleAutosave, writeBuffer, onSaved, onSaveFailed, requestQuit, pendingWrites, retryDelay
   // closeBuffer(s, id, { force }): window-vs-buffer distinction per REQ5 (`:q` with two windows closes the window only)
   // saveText(b): b.text joined with b.eol, BOM and finalNewline restored (rm261003abzp-design.md:367)
   ```

   - Invariants: no `write` for conflicted or deleted-on-disk buffers; `saveFailed` never leaves `terminal.quit` set.

3. **REFACTOR:** Collapse duplicated quit-advance logic between `onSaved` and `onSaveFailed`.

   **Preview:**

   ```ts
   // allowed: private advanceQuit helper; prohibited: a second "writable" predicate
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): add autosave, retry, quit, and close reducers

   Task: P2-G1-T2 — Implement autosave, retry, quit, and close reducers
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V3.3`, `V3.5`, `V4.1`–`V4.4` — `bun test src/core/state/save.test.ts` → pass.

##### P2-G1-T3 — Implement disk events and conflict resolution

- **Outcome:** `disk.ts` (`onFileChanged`, `onDiskLoaded`, `resolveConflict`) and `buffers.ts` open/load/refuse (`openPath`, `onFileLoaded`, `onFileRefused`, `bufferForPath`) apply watcher events and read-backs: deleted-on-disk marking without resurrection, one-undo-step reloads, conflict on dirty buffers, keep/take/diff.
- **System Design:** `W261003HEGE-REQ1@R3, REQ6@R1, REQ11@R2` → `W261003HEGE-DES5, DES2, DES6` → `S5, S6` → `V5.2, V5.3, V5.4`
- **UI Design:** `None — core state`
- **Canonical Shapes:** System design §7 `src/core/state/disk.ts` (lines 1551–1601); `buffers.ts` symbols (§4 line 319–321); §5 Open a file, External change (lines 706–719, 777–796)
- **Files:** `src/core/state/{disk,buffers}.ts`, `src/core/state/disk.test.ts`, `update.ts` (route `fileChanged`, `fileLoaded`, `fileRefused`)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V5.2`, `V5.3`, `V5.4`:** `src/core/state/disk.test.ts`

   **Preview:**

   ```ts
   test("V5.2 removed on clean buffer", () => {
     // disk "deleted", message "deleted on disk — :w to recreate"; timer(autosave) → no write; :q → exit(0);
     // reappearance: changed → read → fileLoaded → normal reload rule; disk "present"
   });
   test("V5.3 removed on dirty buffer then :w", () => { /* :q → E37; :w → write with no expected stamp; saved → present */ });
   test("V5.4 reload and conflict", () => { /* clean: one undo block + "Reloaded from disk — u to undo"; u restores; dirty: conflict overlay, no write */ });
   ```

   - Confirm failure.

2. **GREEN:** `disk.ts`, `buffers.ts`

   **Preview:**

   ```ts
   // disk.ts: §7 lines 1577–1588
   // buffers.ts: openPath emits Effect read; onFileLoaded → new buffer via fileTypes.forPath (view = first view)
   //   or onDiskLoaded for an open path; onFileRefused → "binary file — not opened" |
   //   "file too large — not opened (limit 16 MiB)" | io reason; no buffer created
   ```

   - `:w` on a deleted buffer writes without `expected` (recreate rule, REQ6@R1).

3. **REFACTOR:** Share `reload` between `onDiskLoaded` and `resolveConflict("take")`.

   **Preview:**

   ```ts
   // allowed: one reload helper; prohibited: carrying file content in FileEvent
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): add disk-event, reload, and conflict reducers

   Task: P2-G1-T3 — Implement disk events and conflict resolution
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V5.2`, `V5.3`, `V5.4` — `bun test src/core/state/disk.test.ts` → pass.

##### P2-G1-T4 — Implement explorer operations reducer

- **Outcome:** `explorer.ts` (`explorerOp`, `onDirListed`, `onFsResult`, `toggleExplorer`, `createTarget`) emits flush writes before move/rename/trash, re-paths buffers, closes or keeps buffers after delete, applies create-target rules, and handles E13 and trash failures.
- **System Design:** `W261003HEGE-REQ10@R2, REQ8@R2, REQ1@R3` → `W261003HEGE-DES13` → `S13, S11` → `V13.2, V13.3, V13.5`
- **UI Design:** `None — core state (UV6 rendering verified in P3-G1-T3)`
- **Canonical Shapes:** System design §7 `src/core/state/explorer.ts` (lines 1603–1660); §5 Explorer listing and operation (lines 798–818)
- **Files:** `src/core/state/explorer.ts`, `src/core/state/explorer.test.ts`, `update.ts` (route `dirListed`, `fsResult`, `trashAvailable`)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V13.2`, `V13.3`, `V13.5`:** `src/core/state/explorer.test.ts`

   **Preview:**

   ```ts
   test("V13.2 rename dirty a.md → c.md", () => { /* effects [write a.md, rename a.md→c.md]; fsResult ok → path c.md, dirty, undo kept */ });
   test("V13.3 trash dirty buffer", () => { /* [write, trash]; ok after saved → closed; ok after saveFailed → kept, disk "deleted" */ });
   test("V13.5 create targets and failures", () => {
     // "draft"→draft.md, "sync.ts"→sync.ts, "ideas/"→dir ideas, "projects/new/idea"→projects/new/idea.md;
     // fsResult fail "E13: File exists (b.md)" → message; trash failure → trash "unavailable" + error toast
   });
   ```

   - Confirm failure.

2. **GREEN:** `explorer.ts`

   **Preview:**

   ```ts
   // §7 lines 1628–1650 (explorerOp, onFsResult, createTarget); permanent delete rides on "trash" with op.permanent
   // onDirListed: entries → panels.explorer.entries[dir]; null → error message with reason
   ```

   - Buffers follow renames; a delete closes only buffers clean after the flush.

3. **REFACTOR:** Keep `buffersUnder`/`repathBuffers` as module-private helpers.

   **Preview:**

   ```ts
   // allowed: helper extraction; prohibited: overwrite checks in the reducer (they live in fs.ts)
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): add explorer operations reducer

   Task: P2-G1-T4 — Implement explorer operations reducer
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V13.2`, `V13.3`, `V13.5` — `bun test src/core/state/explorer.test.ts` → pass.

##### P2-G1-T5 — Route keys, ex commands, clipboard paste, and status

- **Outcome:** `keys.ts` (`handleKeyAction`, `applyVimEffects`), `commands.ts` (`AppCommand`, `CommandContext`, `registerBuiltins`, `EX_ALIASES`, `executeEx` incl. `:s`/`:%s`, E492), and `status.ts` (`statusSegments`, `countWords`) are wired; `update.ts` drops the temporary default and is exhaustive; every recorded vim case replays through `createUpdate`.
- **System Design:** `W261003HEGE-REQ1@R3, REQ3@R1, REQ5@R1, REQ7@R2` → `W261003HEGE-DES2, DES3, DES4, DES10` → `S2, S4, S7, S10` → `V2.1 (all cases), V7.3 (thrown command), V7.5, V10.3`
- **UI Design:** `None — core state (E492 and completion rendering verified by V14.2 in P3-G1)`
- **Canonical Shapes:** System design §7 `keys.ts`, `commands.ts`, `buffers.ts`, `status.ts`, `init.ts`, `schema.ts` (lines 1662–1722); §5 Keystroke to frame (lines 687–704); §5 Clipboard (lines 820–833)
- **Files:** `src/core/state/{keys,commands,status,update}.ts`, `src/core/state/keys.test.ts`, `src/core/state/update.test.ts`, `test/vim/vim.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V7.5`, `V10.3`, `V7.3`, `V2.1`:** tests

   **Preview:**

   ```ts
   test("V7.5 keymap precedence", () => {
     // bound sequence runs its command and never reaches handleKey; explorer focused → mode "explorer";
     // {mode, filetype} binding beats {mode} binding
   });
   test('V10.3 "+ failures', () => {
     // "+yy then clipboardText{text:"", error} → message "clipboard unavailable";
     // "+p then clipboardText{text:"", error} → inserts registers["+"] at cursor
   });
   test("V7.3 thrown command", () => { /* registered command throws → previous state, error notification, zero effects */ });
   // test/vim/vim.test.ts: replay(c) now dispatches { type: "key", key, now } through createUpdate(testRegistries());
   // remove the test.todo markers so ex cases (:s, :%s) run
   ```

   - Confirm failure.

2. **GREEN:** `keys.ts`, `commands.ts`, `status.ts`, exhaustive `update.ts`

   **Preview:**

   ```ts
   // handleKeyAction, statusSegments: §7 lines 1689–1711
   // registerBuiltins ids: buffer.write, app.quit, app.quitForce, buffer.delete, buffer.deleteForce, buffer.next,
   //   buffer.prev, file.edit, window.split, window.vsplit, window.focus{h,j,k,l}, explorer.* (§7 line 1679)
   // EX_ALIASES: w q wq q! e sp vs bn bp bd bd! + long forms; unknown → "E492: Not an editor command: <cmd>"
   // completion: ex names first, then command ids (UDES2@R1)
   // update.ts: remove the T1 default; `const _: never = action` exhaustiveness restored
   ```

   - `:e <path>` resolves relative to `workspace.root`; `words` only for `fileType === "markdown"`.

3. **REFACTOR:** Ensure `:w` and running `buffer.write` from `:` share one code path.

   **Preview:**

   ```ts
   // allowed: single runCommand path; prohibited: UI-specific branching on file type
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(state): route keys, ex commands, clipboard paste, and status

   Task: P2-G1-T5 — Route keys, ex commands, clipboard paste, and status
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V7.5`, `V10.3` — `bun test src/core/state/keys.test.ts` → pass.
- `V7.3` — `bun test src/core/state/update.test.ts` → both halves pass.
- `V2.1` — `bun test test/vim` → every recorded case equal, no todo left.
- Exhaustiveness — `bun --bun run tsc --noEmit -p .` → exit 0 with no `default` branch in `update.ts`.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Reducer units | `bun test src/core test/vim` | V2.1, V3.3, V3.5, V4.1–V4.4, V5.2–V5.4, V7.3, V7.5, V10.3, V13.2, V13.3, V13.5 pass |
| Boundaries | `bun test test/boundaries.test.ts` | V7.1, V7.2 pass |
| Fast check | `bun run check` | Exit 0 except interim `knip` findings listed in the report |

#### Review and Verification Focus

- **Specification:** only DI1 AppState fields; exactly five protocol additions; `writable` is the single save gate; ex aliases and E492 text match vim; status `words` only for Markdown.
- **Technical:** purity (no `Date.now()`, no mutation); exhaustive switch; effect order equals intended disk order; undo-preserving reload and re-path; error containment.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P2-G2 — Workspace Adapters, Effect Runner, and Integration

#### Goal

The workspace adapters perform atomic, permission-preserving, conflict-checked writes; list folders with exclusion and symlink safety; watch with own-operation suppression; trash per platform without orphans or injection; and detect the clipboard in Neovim order. `createEffectRunner` serializes every mutating effect and answers each fallible effect exactly once. Integration suites prove parent V1 a–d and V18 b–e plus explorer safety on a real file system with real `fs.watch`.

#### Coverage Summary

- **System Design:** `REQ1@R3, REQ6@R1, REQ7@R2, REQ8@R2, REQ9@R1, REQ10@R2 → DES4, DES5, DES8, DES10, DES11, DES12, DES13 → S3, S5, S6, S10, S11, S12, S13 → V3.1, V3.2, V3.4, V5.1, V5.5, V6.4, V6.5, V10.1, V10.2, V10.4, V11.1–V11.3, V12.1–V12.4, V13.1, V13.4`
- **UI Design:** `None — adapters`

#### Scope

- Included: `src/workspace/{ignore,fs,watcher,trash,system}.ts` with tests, `src/app/effects.ts` with test, `test/fixtures/{workspace/,generate.ts}`, `test/integration/{save-safety,open-save,explorer-ops}.test.ts`.
- Excluded: `main` wiring, lifecycle, `SO_TEST_*` hooks in `main.ts` (P3-G1); OSC 52 terminal output (provider receives a callback; shell wiring in P3-G1); manual macOS trash check V11.4 (P3-G1-T7).
- Main files: system design §4 lines 298–300, 364–378, 405–417.

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ9@R1 → DES12 → S12 → V12.1–V12.4` | None | Hidden, `node_modules`, nested `.gitignore` with git precedence; symlink loops safe |
| `REQ1@R3 → DES8 → S3, S6 → V3.1, V3.2, V6.4, V6.5` | None | Atomic write, no temp leak, mode kept; open policy refusals; BOM/EOL kept |
| `REQ1@R3, REQ6@R1, REQ10@R2 → DES5 → S5 → V5.1, V5.5, V3.2 (d)` | None | Own writes/moves suppressed; external edits reported; excluded paths silent |
| `REQ8@R2 → DES11 → S11 → V11.1–V11.3` | None | Freedesktop spec compliance; no collision; no orphan; no injection |
| `REQ7@R2 → DES10 → S10 → V10.1, V10.2, V10.4` | None | Provider order; OSC 52 copy; runner reports failures once |
| `REQ1@R3, REQ10@R2 → DES4, DES13 → S3, S13 → V3.4, V13.1, V13.4` | None | Expected-stamp conflict; no overwrite; write-then-rename ordering |

#### Cross-Work Gates

| Gate source | Affected task or group boundary | Required evidence | Integration owner |
|---|---|---|---|
| G1 — `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`; producer DI1, consumer RM261003ABZP-DI2@R2 | P2-G2 produces G1 outputs `readTextFile`, `atomicWrite`, the watcher, and the effect runner; due before DI2 execution | Parent V1@R1 a–d ↔ V3.1–V3.4 and V18@R1 b–e ↔ V6.4–V6.5 pass locally here and on both CI platforms in P3-G1-T7; evidence collected in P3-G1-T6 | RM261003ABZP-DI2@R2 |

#### Tasks

##### P2-G2-T1 — Implement the exclusion matcher

- **Outcome:** `createExclusionMatcher(root, read)` with `isExcluded(rel, isDir)` and `isExcludedPath(rel)`, `ALWAYS_HIDDEN`, per-scope `ignore` instances, deeper negation wins.
- **System Design:** `W261003HEGE-REQ9@R1` → `W261003HEGE-DES12` → `S12` → `V12.1, V12.2, V12.3`
- **UI Design:** `None — adapter`
- **Canonical Shapes:** System design §7 `src/workspace/ignore.ts` (lines 2060–2110)
- **Files:** `src/workspace/ignore.ts`, `src/workspace/ignore.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V12.1`, `V12.2`, `V12.3`:** `src/workspace/ignore.test.ts` with in-memory `read`

   **Preview:**

   ```ts
   test("V12.1 always and gitignored", () => { /* .git, .obsidian, .env, node_modules, build/ (root), pkg/dist/ (pkg/.gitignore) → excluded */ });
   test("V12.2 cross-scope precedence", () => { /* "*.log"+"!keep.log" → keep.log shown; root "*.tmp" + pkg "!x.tmp" → pkg/x.tmp shown */ });
   test("V12.3 directory-only pattern", () => { /* "build/": dir excluded, file named build shown */ });
   ```

   - Confirm failure.

2. **GREEN:** `ignore.ts`

   **Preview:**

   ```ts
   // §7 lines 2088–2102; .gitignore files only (no .git/info/exclude)
   ```

   - Paths tested relative to each scope's folder; directories get a trailing `/` (RF14).

3. **REFACTOR:** Cache scopes per directory once.

   **Preview:**

   ```ts
   // allowed: lazy load memoization; prohibited: re-reading .gitignore per call
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(workspace): add exclusion matcher with git precedence

   Task: P2-G2-T1 — Implement the exclusion matcher
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V12.1`–`V12.3` — `bun test src/workspace/ignore.test.ts` → pass.

##### P2-G2-T2 — Implement the workspace file adapter and fixtures

- **Outcome:** `fs.ts` (`readTextFile` with open policy and `io` refusal, `atomicWrite` with expected-stamp check, `0600` temp then `chmod`, temp removal on failure; `listDir` with exclusion and symlink handling; `createEntry`, `moveEntry` (E13), `removeEntry`; `stampOf`, `FsError`) plus `test/fixtures/workspace/` and `test/fixtures/generate.ts`.
- **System Design:** `W261003HEGE-REQ1@R3, REQ9@R1, REQ10@R2` → `W261003HEGE-DES8, DES12, DES13` → `S3, S6, S12, S13` → `V12.4`
- **UI Design:** `None — adapter`
- **Canonical Shapes:** System design §7 `src/workspace/fs.ts` (lines 1941–2000); parent `rm261003abzp-design.md:734-751`; §4 fixtures (lines 407–413)
- **Files:** `src/workspace/fs.ts`, `src/workspace/fs.test.ts`, `test/fixtures/workspace/**`, `test/fixtures/generate.ts` (`makeLargeFile`, `make5000LineNote`)
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V12.4`:** `src/workspace/fs.test.ts` on a tmp workspace

   **Preview:**

   ```ts
   test("V12.4 listing with symlinks and loops", async () => {
     // listDir(root): symlinks listed with target kind; link-to-dir lists only when expanded;
     // folder containing a loop returns without recursion; readTextFile(".env") opens by path though hidden
   });
   ```

   - Confirm failure.

2. **GREEN:** `fs.ts`, fixtures

   **Preview:**

   ```ts
   // atomicWrite, moveEntry, createEntry: §7 lines 1966–1982
   // readTextFile: parent policy (NUL in first 8 KiB or invalid UTF-8 → binary; > 16 MiB → tooLarge; read error → io)
   // fixtures: notes, scripts/sync.ts, config.yaml, notes.txt, Makefile, photo.png, nul-at-100.bin, invalid-utf8.txt,
   //   crlf-bom.md, root and pkg/ .gitignore, .env, node_modules/, build/, pkg/dist/, keep.log
   // generate.ts: makeLargeFile (17 MiB) and make5000LineNote write into a tmp dir at test time (not committed)
   ```

   - Never overwrite in create/move; old-or-new file on any write failure.

3. **REFACTOR:** Share stamp computation between read and write.

   **Preview:**

   ```ts
   // allowed: stampOfBytes/stampOfFile helpers; prohibited: following symlinks recursively in listDir
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(workspace): add atomic file adapter, listing, and fixtures

   Task: P2-G2-T2 — Implement the workspace file adapter and fixtures
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V12.4` — `bun test src/workspace/fs.test.ts` → pass.

##### P2-G2-T3 — Implement the watcher with own-operation suppression

- **Outcome:** `watchWorkspace(root, ownOps, matcher, emit)` with 50 ms per-path debounce and `lstat` classification; `createOwnOps` suppresses own writes by stamp and own moves/removals by path prefix for 1 s.
- **System Design:** `W261003HEGE-REQ1@R3, REQ6@R1, REQ10@R2` → `W261003HEGE-DES5` → `S5, S12` → `V5.1`
- **UI Design:** `None — adapter`
- **Canonical Shapes:** System design §7 `src/workspace/watcher.ts` (lines 2002–2058)
- **Files:** `src/workspace/watcher.ts`, `src/workspace/watcher.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V5.1`:** `src/workspace/watcher.test.ts` (real fs, clock double for OwnOps)

   **Preview:**

   ```ts
   test("V5.1 classification and suppression", async () => {
     // own write noted by stamp → no event; external write same file → changed; excluded path write → none;
     // symlink loop present → watchWorkspace returns in < 100 ms; wait debounce + 300 ms (no fixed sleeps elsewhere)
   });
   ```

   - Confirm failure.

2. **GREEN:** `watcher.ts`

   **Preview:**

   ```ts
   // createOwnOps, watchWorkspace: §7 lines 2026–2049; stop() closes the watcher and clears timers
   ```

   - Event types ignored; only `lstat` decides (RF8).

3. **REFACTOR:** None beyond naming; keep the module minimal.

   **Preview:**

   ```ts
   // allowed: rename locals; prohibited: content in FileEvent, following symlinks
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(workspace): add watcher with own-operation suppression

   Task: P2-G2-T3 — Implement the watcher with own-operation suppression
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V5.1` — `bun test src/workspace/watcher.test.ts` → pass on the local platform (both CI platforms in P3-G1-T7).

##### P2-G2-T4 — Implement trash adapters

- **Outcome:** `trash.ts` (`Trash`, `detectTrash`, `freedesktopTrash`, `macTrash`, `trashInfo`) follows the freedesktop spec on Linux and non-prompting macOS paths, with no orphan metadata and no script injection.
- **System Design:** `W261003HEGE-REQ8@R2` → `W261003HEGE-DES11` → `S11` → `V11.1, V11.2, V11.3`
- **UI Design:** `None — adapter`
- **Canonical Shapes:** System design §7 `src/workspace/trash.ts` (lines 2112–2169)
- **Files:** `src/workspace/trash.ts`, `src/workspace/trash.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V11.1`, `V11.2`, `V11.3`:** `src/workspace/trash.test.ts` (tmp `XDG_DATA_HOME`)

   **Preview:**

   ```ts
   test("V11.1 spec info file", …);   // "My draft.md" at fixed Date → files/My draft.md; info = "[Trash Info]\nPath=/…/My%20draft.md\nDeletionDate=<local ISO>\n"
   test("V11.2 collisions", …);       // two draft.md → files/draft.md and files/draft.md.2, two info files
   test("V11.3 failures and injection", …); // rename EXDEV → no orphan info, source intact, rejects;
                                            // JXA stub prints "failed" exit 0 → rejects; path "'); doShellScript('x" is one argv element
   ```

   - Confirm failure.

2. **GREEN:** `trash.ts`

   **Preview:**

   ```ts
   // trashInfo, freedesktopTrash, JXA, macTrash: §7 lines 2140–2160
   // detectTrash: Linux home trash dirs creatable and st_dev(root) === st_dev(trash); macOS /usr/bin/trash or osascript present
   ```

   - Fixed argv only; never a shell.

3. **REFACTOR:** Inject `spawn` for tests without widening the public API beyond §7.

   **Preview:**

   ```ts
   // allowed: optional spawn parameter defaulting to Bun.spawn; prohibited: shell strings
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(workspace): add freedesktop and macOS trash adapters

   Task: P2-G2-T4 — Implement trash adapters
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V11.1`–`V11.3` — `bun test src/workspace/trash.test.ts` → pass.

##### P2-G2-T5 — Implement clipboard provider detection

- **Outcome:** `system.ts` (`ClipboardProvider`, `SysDeps`, `detectClipboard`, `commandProvider`, `osc52Provider`) picks providers in Neovim 0.11 order and falls back to OSC 52 copy without paste.
- **System Design:** `W261003HEGE-REQ7@R2` → `W261003HEGE-DES10` → `S10` → `V10.1, V10.2`
- **UI Design:** `None — adapter`
- **Canonical Shapes:** System design §7 `src/workspace/system.ts` (lines 2171–2215)
- **Files:** `src/workspace/system.ts`, `src/workspace/system.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V10.1`, `V10.2`:** `src/workspace/system.test.ts` with `SysDeps` doubles

   **Preview:**

   ```ts
   test.each([
     ["darwin+pbcopy", "pbcopy"], ["wayland", "wl-copy"], ["DISPLAY xsel ok", "xsel"],
     ["DISPLAY xsel failing", "xclip"], ["TMUX only", "tmux"], ["nothing", "osc52"],
   ])("V10.1 %s", async (_, expected) => { /* detectClipboard(deps, osc52).name === expected */ });
   test("V10.2 osc52 copy", async () => { /* callback receives "héllo"; provider.paste is undefined */ });
   ```

   - Confirm failure.

2. **GREEN:** `system.ts`

   **Preview:**

   ```ts
   // detectClipboard: §7 lines 2196–2205; commandProvider writes stdin / reads stdout via Bun.spawn argv (no shell)
   ```

   - No `@opentui/*` import; OSC 52 arrives as a callback.

3. **REFACTOR:** None required beyond naming.

   **Preview:**

   ```ts
   // allowed: rename locals; prohibited: changing provider order
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(workspace): add clipboard provider detection

   Task: P2-G2-T5 — Implement clipboard provider detection
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V10.1`, `V10.2` — `bun test src/workspace/system.test.ts` → pass.

##### P2-G2-T6 — Implement the serial effect runner

- **Outcome:** `createEffectRunner(deps)` returns `{ run, flush }`; mutating effects (`write`, `create`, `rename`, `move`, `trash` incl. `permanent` → `removeEntry`) share one promise chain and note own operations; reads/listings run in parallel; timers and clipboard effects dispatch exactly one result; `exit` calls the late-bound `deps.exit`.
- **System Design:** `W261003HEGE-REQ1@R3, REQ5@R1, REQ7@R2, REQ8@R2, REQ10@R2` → `W261003HEGE-DES4, DES10, DES11, DES13` → `S3, S10, S13` → `V10.4`
- **UI Design:** `None — app runner`
- **Canonical Shapes:** System design §7 `src/app/effects.ts` (lines 2217–2270)
- **Files:** `src/app/effects.ts` — `createEffectRunner`, `EffectRunner`, `RunnerDeps`; `src/app/effects.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V10.4`:** `src/app/effects.test.ts`

   **Preview:**

   ```ts
   test("V10.4 clipboard failure reported once", async () => {
     // provider.copy rejects; run({ kind: "clipboardWrite", text: "x" }) → exactly one dispatch clipboardText{ text: "", error }
   });
   ```

   - Confirm failure.

2. **GREEN:** `effects.ts`

   **Preview:**

   ```ts
   // §7 lines 2240–2257; runFsOp: create → createEntry; rename/move → moveEntry; trash → op.permanent ? removeEntry : trash.move;
   // each notes OwnOps (noteMove/noteRemove) and dispatches one fsResult; d.now = performance.timeOrigin + performance.now()
   ```

   - `flush(writes)` reuses the same queue (used by lifecycle in P3-G1).

3. **REFACTOR:** Keep `msg(x)` error normalization in one place.

   **Preview:**

   ```ts
   // allowed: private helpers; prohibited: concurrent mutating effects or a second queue
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(app): add serial effect runner

   Task: P2-G2-T6 — Implement the serial effect runner
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V10.4` — `bun test src/app/effects.test.ts` → one dispatch with `error`.
- `V7.1` — `bun test test/boundaries.test.ts` → `src/app` may import workspace; core still clean.

##### P2-G2-T7 — Prove save, open, and explorer safety end to end

- **Outcome:** integration suites drive the real store (`createStore` + `createUpdate`), real runner, real `atomicWrite`, real `watchWorkspace` on tmp folders and prove parent V1 a–d, V18 b–e, and explorer safety.
- **System Design:** `W261003HEGE-REQ1@R3, REQ6@R1, REQ10@R2` → `W261003HEGE-DES4, DES5, DES8, DES13` → `S3, S5, S6, S13` → `V3.1, V3.2, V3.4, V6.4, V6.5, V13.1, V13.4, V5.5`
- **UI Design:** `None — integration`
- **Canonical Shapes:** System design §8 `test/integration/*` cases; Test Quality Rules (lines 2952–2957)
- **Files:** `test/integration/{save-safety,open-save,explorer-ops}.test.ts`
- **Execution Approach:** `TDD`

**Steps:**

1. **RED — `V3.1`, `V3.2`, `V3.4`, `V6.4`, `V6.5`, `V13.1`, `V13.4`, `V5.5`:** three suites, one tmp folder per suite, watcher stopped in `afterAll`

   **Preview:**

   ```ts
   // save-safety: V3.1 throw after fsync (fault injected by wrapping atomicWrite in the runner deps used by the test —
   //   no production fault path) → original bytes, no ".so-tmp-"; V3.2 (b) clean reload + u, (c) dirty conflict,
   //   (d) own save → no fileChanged within 500 ms, mode 0640 kept; V3.4 queued autosave + external write → saveFailed conflict
   // open-save: V6.4 photo.png, NUL at 100, invalid UTF-8 → "binary file — not opened"; 17 MiB → "file too large — not opened
   //   (limit 16 MiB)"; no buffer, no write; V6.5 crlf-bom.md with/without trailing newline → EF BB BF, \r\n, newline kept
   // explorer-ops: V13.1 rename onto b.md / create existing → "E13: File exists (b.md)", bytes identical;
   //   V13.4 rename dirty a.md → c.md then autosave → c.md new text, a.md absent, no notices within 1 s;
   //   V5.5 move notes/ (two open buffers) → archive/notes/ → paths updated, zero fileChanged for own paths
   ```

   - Run `bun test test/integration`; confirm failures point at missing wiring, not test bugs.

2. **GREEN:** fix any adapter, runner, or reducer defect exposed, within the files of this part

   **Preview:**

   ```ts
   // allowed: corrections inside src/core/state/*, src/workspace/*, src/app/effects.ts that keep their §7 contracts
   // prohibited: weakening an assertion, adding sleeps beyond debounce + 300 ms, new production hooks
   ```

   - Report any contract change need instead of making it.

3. **REFACTOR:** Share a tmp-workspace helper inside `test/integration`.

   **Preview:**

   ```ts
   // allowed: test/integration/helpers.ts if needed by ≥ 2 suites; prohibited: shared global state between suites
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(integration): prove save, open, and explorer safety

   Task: P2-G2-T7 — Prove save, open, and explorer safety end to end
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V3.1`, `V3.2`, `V3.4` — `bun test test/integration/save-safety.test.ts` → pass.
- `V6.4`, `V6.5` — `bun test test/integration/open-save.test.ts` → pass.
- `V13.1`, `V13.4`, `V5.5` — `bun test test/integration/explorer-ops.test.ts` → pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Adapter units and integration | `bun test src/workspace src/app test/integration` | V3.1, V3.2, V3.4, V5.1, V5.5, V6.4, V6.5, V10.1, V10.2, V10.4, V11.1–V11.3, V12.1–V12.4, V13.1, V13.4 pass |
| Reducers unchanged | `bun test src/core test/vim` | Still pass |
| Boundaries | `bun test test/boundaries.test.ts` | V7.1, V7.2 pass |
| Fast check | `bun run check` | Exit 0 except interim `knip` findings listed in the report |

#### Review and Verification Focus

- **Specification:** serial queue for every mutating effect; one result per fallible effect; no overwrite; temp `0600` then original mode; trash spec order; Neovim provider order; no shell interpretation anywhere.
- **Technical:** race windows (expected-stamp check, write-then-rename), watcher suppression scope (exact stamp vs 1 s prefix), symlink loops, test isolation and no fixed sleeps, cross-platform `fs.watch` differences (RF8).

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ1@R3 → DES2 → S7 → V7.3` | None | `P2-G1` | `P2-G1-T1, P2-G1-T5` |
| `REQ1@R3 → DES4 → S3 → V3.3, V3.5` | None | `P2-G1` | `P2-G1-T2` |
| `REQ5@R1 → DES4 → S4 → V4.1–V4.4` | None | `P2-G1` | `P2-G1-T2` |
| `REQ6@R1 → DES5 → S5 → V5.2–V5.4` | None | `P2-G1` | `P2-G1-T3` |
| `REQ10@R2, REQ8@R2 → DES13 → S13, S11 → V13.2, V13.3, V13.5` | None | `P2-G1` | `P2-G1-T4` |
| `REQ1@R3, REQ3@R1 → DES3 → S2 → V2.1` (all cases) | None | `P2-G1` | `P2-G1-T5` |
| `REQ1@R3 → DES3, DES2 → S7 → V7.5` | None | `P2-G1` | `P2-G1-T5` |
| `REQ7@R2 → DES10 → S10 → V10.3` | None | `P2-G1` | `P2-G1-T5` |
| `REQ9@R1 → DES12 → S12 → V12.1–V12.4` | None | `P2-G2` | `P2-G2-T1, P2-G2-T2` |
| `REQ1@R3, REQ6@R1, REQ10@R2 → DES5 → S5 → V5.1` | None | `P2-G2` | `P2-G2-T3` |
| `REQ8@R2 → DES11 → S11 → V11.1–V11.3` | None | `P2-G2` | `P2-G2-T4` |
| `REQ7@R2 → DES10 → S10 → V10.1, V10.2, V10.4` | None | `P2-G2` | `P2-G2-T5, P2-G2-T6` |
| `REQ1@R3 → DES8, DES4, DES5 → S3, S5 → V3.1, V3.2, V3.4` | None | `P2-G2` | `P2-G2-T7` |
| `REQ1@R3, REQ11@R2 → DES8, DES6 → S6, S3 → V6.4, V6.5` | None | `P2-G2` | `P2-G2-T7` |
| `REQ10@R2 → DES13, DES4, DES5 → S13, S5 → V13.1, V13.4, V5.5` | None | `P2-G2` | `P2-G2-T7` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly. G1 is not due here; its Part 2 outputs are handed to P3-G1-T6 for the evidence list.
- Every source obligation is covered.

## Outputs for Later Parts

- Protocol and store: `AppState`, `Action`, `Effect`, `FsOp`, `FileEvent`, `Stamp`, `TextFile`, `DirEntry`, `TimerId`, `createStore`, `Store`, `createUpdate`, `Registries`, `initialState`, `defaults`, `AppConfig`.
- Reducer exports consumed by UI and lifecycle: `statusSegments`, `pendingWrites`, `registerBuiltins`, `CommandContext`, `CommandResult`, `EX_ALIASES`.
- Adapters and runner for `main`: `createEffectRunner` (`run`, `flush`; late-bound `exit`), `RunnerDeps`, `createOwnOps`, `watchWorkspace`, `createExclusionMatcher`, `detectTrash`, `detectClipboard` (OSC 52 callback), `readTextFile`, `atomicWrite`.
- Fixtures: `test/fixtures/workspace/**`, `test/fixtures/generate.ts` (`make5000LineNote`, `makeLargeFile`) for UI goldens, e2e, and bench.

## Planning Gaps

`None`
