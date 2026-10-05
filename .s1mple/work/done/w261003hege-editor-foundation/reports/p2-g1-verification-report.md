# P2-G1 Verification Report

## Scope

- **Group:** `P2-G1`
- **Tasks:** `P2-G1-T1, P2-G1-T2, P2-G1-T3, P2-G1-T4, P2-G1-T5`
- **Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p2-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p2-g1-implementation-report.md` (commit `3525c0a`)

Verified range: `4baa076..6d97b00` on `feat/rm261003abzp-di1-editor-foundation`. The group commits are `d4937a7`, `579fb73`, `e47b9de`, `6cc2eb0`, and `6d97b00`. Each commit body names its task and plan title. Commits `3525c0a` (implementation report) and `16935e5` (orchestrator goal update) touch only `.s1mple/` and are not group work. `HEAD` was `16935e5`, the working tree was clean, and Bun is `1.4.2`. Every changed file is inside `src/core/state/`, `src/core/config/schema.ts`, `test/support/state.ts`, or `test/vim/vim.test.ts`.

## Status

`Failed`

Every assigned check passes, and all 289 recorded vim cases replay equal through `createUpdate`. The protocol has exactly the five allowed additions, and `update` is exhaustive with no `default` branch. The group still fails on three findings:

- **`P2-G1-VER1`** (Major): a rename or move that runs while a buffer has a write in flight, after the user typed during that write, leaves the buffer stuck in `save.kind === "writing"`. Autosave then stops for that buffer, and `:q` waits forever.
- **`P2-G1-VER2`** (Minor): the exported `ConfigSchema` breaks the interim `knip` rule.
- **`P2-G1-VER3`** (Minor): four of the implementation report's V-case commands select zero tests.

The implementer's flagged deviations are acceptable refinements; none is a finding (see Scope Changes).

## Assigned Traceability

- **System Design:** `REQ1@R3 → DES2 → S7 → V7.3`; `REQ1@R3 → DES3, DES2 → S7 → V7.5`; `REQ1@R3, REQ3@R1 → DES3 → S2 → V2.1 (all cases, through createUpdate)`; `REQ1@R3 → DES4 → S3 → V3.3, V3.5`; `REQ5@R1 → DES4 → S4 → V4.1–V4.4`; `REQ6@R1 → DES5 → S5 → V5.2–V5.4`; `REQ10@R2, REQ8@R2 → DES13 → S13, S11 → V13.2, V13.3, V13.5`; `REQ7@R2 → DES10 → S10 → V10.3`; `REQ1@R3 → DES2 → S7 → V7.1`; `REQ11@R2 → DES6 → S6` (open and refuse through `buffers.ts`). Roadmap: binding `w261003hege-discuss-context.md` Roadmap Binding (RM261003ABZP, PH1@R2, DI1@R2). Parent coverage rows in system design §1 include "Store and data effects" (RM261003ABZP-DES2@R2), "Config schema defaults" (DES14@R1, DI1 part), "Notes never lost" (S1@R1 / V1@R1), and "Neovim-equal vim" (V2@R1 ↔ V2.1). Gate G1 is defined at `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`.
- **UI Design:** `None`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1@R3 → DES2` (protocol, G1) | `None` | `Action`/`Effect` equal the parent DI1 variants (`…phase-1…md:205-217`) plus exactly `listDir`, `dirListed`, `clipboardText.error`, `FsOp.permanent`, and `fileRefused` `"io"`; `write`/`saved` unchanged | `src/core/state/types.ts:139-168`: 12 parent actions and 9 parent effect kinds, unchanged apart from `fileRefused.reason` + `"io"` (`:143`) and `clipboardText.error?` (`:156`); `dirListed` (`:147-152`), `listDir` (`:163`), and `FsOp.permanent?: true` (`:30`). `saved` stays `{path, stamp}` (`:144`) | `Satisfied` |
| `REQ1@R3 → DES2` (AppState) | `None` | Only DI1 top-level fields (`…phase-1…md:189`), with §7 sub-shapes | `types.ts:114-137`: `workspace`, `buffers`, `nextBufferId` (§7), `windows`, `vim`, `panels.explorer`, `overlay` (`none \| prompt \| conflict`), `notifications`, `config`, `terminal`. There is no DI2+ field. The sub-shape refinements `SaveState.writing.{at,attempt}`, `BufferState.closing?`, and `vim.registers` are assessed under Scope Changes | `Satisfied` |
| `REQ1@R3 → DES2 → S7 → V7.3` | `None` | `createStore(initial, update, run)`, `createUpdate(registries)`; pure on frozen state; exhaustive `never` check; thrown command keeps state, adds an error notification, zero effects | `store.ts:11-31` matches §7. `update.ts:29-66` routes all 13 actions; `:60` `const unhandled: never = action`; `grep -n default src/core/state/update.ts` → no match; `try/catch` → `notifyError` (`result.ts:49-51`). `update.test.ts` covers both halves | `Satisfied` |
| `REQ1@R3 → DES2` (config) | `None` | `ConfigSchema`, `AppConfig`, `defaults` = `{escTimeoutMs: 50, autosave: {enabled: true, delayMs: 1000}, theme: "dark", color: "auto"}`; `initialState(boot)` reads no env | `src/core/config/schema.ts:3-17`; `init.ts:6-43` takes `{root, cols, rows, color}`. `ConfigSchema` is exported without a consumer in this goal (`P2-G1-VER2`) | `Satisfied` (tooling finding separate) |
| `REQ1@R3 → DES4 → S3 → V3.3, V3.5` | `None` | One write per autosave stage; backoff 1, 2, 4, 8, 16, 30, 30 s; status `saveError`; a re-write after typing during a write; `writable` is the single gate | `save.ts:24-25` `writable` (one predicate, used by `scheduleAutosave`, `writeBuffer`, `requestQuit`, `closeBuffer`, `pendingWrites`); `:37-38` `retryDelay`; `:116-119` stale-timer guard; `:142` re-write when still dirty; `status.ts:45-46` | `Satisfied` |
| `REQ5@R1 → DES4 → S4 → V4.1–V4.4` | `None` | `:q` sets `terminal.quit` and exits after the last `saved`; a failure cancels the quit; conflicted or dirty deleted buffers get E37; `:q!`; `:q` with two windows closes the window only; `:bd` flushes then closes; `:bd!` discards | `save.ts:148-159` `advanceQuit`; `:169` quit cleared on every `saveFailed`; `:28-32` `blocked`/E37; `:208-231` `requestQuit`; `:234-249` `closeBuffer` with `closing`. The continuation breaks when a rename re-paths a buffer during its write (`P2-G1-VER1`) | `Mismatch` |
| `REQ6@R1 → DES5 → S5 → V5.2–V5.4` | `None` | Removal marks the buffer `deleted` and cancels saves; no resurrection; `:w` recreates without `expected`; clean reload is one undo step plus a message; dirty → conflict; keep/take/diff | `disk.ts:35-57` `onFileChanged`/`markDeleted`; `:60-70` `onDiskLoaded`; `:73-133` `reload` (one `undo.push`); `:139-156` `resolveConflict`; `commands.ts:206-212` `:w` → `recreate`; `save.ts:82-84` write without `expected` | `Satisfied` |
| `REQ11@R2 → DES6 → S6` (open path) | `None` | `openPath` → `read`; `fileLoaded` → buffer of `fileTypes.forPath`, first view; `fileRefused` → binary, tooLarge, or io text; no buffer created | `buffers.ts:167-235`; `disk.test.ts` tests "a loaded file opens…" and "a refused file opens nothing and says why" | `Satisfied` |
| `REQ10@R2, REQ8@R2 → DES13 → S13, S11 → V13.2, V13.3, V13.5` | `None` | Flush writes, then the op, in one ordered list; re-path keeps text, undo, dirty, and stamp; trash closes clean buffers and keeps dirty ones as `deleted`; create-target rules; E13 message; trash failure → `unavailable` plus an error toast | `explorer.ts:81-90` `explorerOp`; `:97-154` `onFsResult`; `:157-162` `repathBuffers`; `:72-75` `createTarget`. Buffers do not stay consistent when a write is in flight during the re-path (`P2-G1-VER1`) | `Mismatch` |
| `REQ1@R3 → DES3, DES2 → S7 → V7.5` | `None` | Keymap beats vim; explorer focus resolves in mode `explorer` and never reaches the engine; `{mode, filetype}` beats `{mode}` | `keys.ts:27-51`: overlay → cmdline → `Keymap.lookup(scope, seq)` → `runCommand`, or the prefix sets `pending`, or `runVim`. `inExplorer` never reaches `runVim` (`:49`). The scope carries `filetype` (`:39-40`) | `Satisfied` |
| `REQ1@R3, REQ3@R1 → DES3 → S2 → V2.1` | `None` | Every recorded case, including `:s`/`:%s`, is equal through `createUpdate`; no `test.todo` | `test/vim/vim.test.ts:48-110` dispatches `{type:"key", key, now}` through `createUpdate(testRegistries())`; no `todo` or `skip` in the file; `expected.json` has 289 case ids; `commands.ts:118-177` `substitute` | `Satisfied` |
| `REQ1@R3, REQ5@R1 → DES2, DES4` (ex) | `None` | `EX_ALIASES` `w q wq q! e sp vs bn bp bd bd!` plus long forms; unknown → `E492: Not an editor command: <cmd>`; `:e` relative to the root; completion lists ex names, then command ids; `:w` and `buffer.write` share one path | `commands.ts:45-67`, `:92-106` `executeEx` → `runCommand`; `:180-204` `workspacePath`; `keys.ts:79-89` Tab completion; `keys.test.ts` "ex commands run through the same command path as their ids" | `Satisfied` |
| `REQ7@R2 → DES10 → S10 → V10.3` | `None` | `"+y` → `clipboardWrite`; a failure shows `clipboard unavailable`; `"+p` → `pendingPaste` plus `clipboardRead`; the reply pastes its text, or `registers["+"]` when empty or failed | `keys.ts:178-191` and `:213-259` `onClipboardText`/`paste` | `Satisfied` |
| DEV2 — E486 handoff from P1-G2 | `None` | `search` effect → `searchError` → message line, level `error`, tested in `keys.test.ts` | `keys.ts:199-202`; `keys.test.ts` "a search with no match shows E486 on the message line" | `Satisfied` |
| `REQ1@R3 → DES2` (status) | `None` | `statusSegments` is pure; `words` only for `markdown` | `status.ts:32-48` (memoized per immutable `TextBuffer` in a `WeakMap`, so the result is observably pure); `status.test.ts` | `Satisfied` |
| DEV1 — no work-process identifiers in code | `None` | No Work/REQ/DES/S/V/phase/goal/task IDs in `src/`, `test/`, `scripts/`, or workflow files | The scan `\b(REQ\|DES\|RF\|UREQ\|UDES\|US\|UV\|DEV)[0-9]+`, `\b[SV][0-9]+(\.[0-9]+)?\b`, `\bP[0-9]+-G[0-9]+`, `\bT[0-9]+\b`, `W26[0-9]`, `RM26`, `\bDI[0-9]`, `\bPH[0-9]\b`, `\bG[0-9]\b`, `VER[0-9]`, `\b(task\|goal\|roadmap\|phase)\b`, `w261003`, `rm261003` over `src test scripts` (`*.ts`) and `.github` found no match. Test names are behavioral | `Satisfied` |
| Roadmap G1 (producer DI1, consumer DI2@R2) | `None` | `createUpdate`, `createStore`, and `Action`/`Effect` at parent shapes plus only the five additions; no G1 contract change; not due within this goal | Protocol compared above. The `MouseEvent` payload (`types.ts:112`) was left open by the parent and is now `{kind:"scroll"; delta}`, an open-detail refinement. Merge and CI evidence stay with P3-G1-T6/T7 | `Satisfied` |

Roadmap baseline: `git log -- .s1mple/work/done/rm261003abzp-so-v1/` → only `d00d3a3`. `git diff --stat 4baa076..HEAD -- .s1mple` touches only the implementation report and the goal file. Parent synchronization stays pending with the main orchestrator, and this verification wrote no parent file.

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| Reducer units (group) | `S2, S3, S4, S5, S7, S10, S13` | `DES2, DES3, DES4, DES5, DES10, DES13` | `bun test src/core test/vim` | 369 pass, 0 fail, 1773 expects, 13 files | `Passed` |
| `V7.3` (purity) | `S7` | `DES2` | `bun test src/core/state/update.test.ts`; independent probe: 16 key sequences (edits, `:w`, `:s`, `"+yy`, `"+p`, `u`, `/`, `:q`, `:bd`, `<leader>e`, `<C-w>v`, `.`, Visual) on a deep-frozen state, each run twice | 3 pass. Probe: no mutation error (no error toast) and equal results by content. A plain `toEqual` differs only because the kernel `TextBuffer` is closure-based, so identical text has different method identities | `Passed` |
| `V7.3` (thrown command) | `S7` | `DES2` | `bun test src/core/state/update.test.ts -t "throwing command"` | 1 pass: previous state plus one error toast, `effects: []` | `Passed` |
| Exhaustiveness | `S7` | `DES2` | `bun --bun run tsc --noEmit -p .`; `grep -n default src/core/state/update.ts` | tsc exit 0; grep finds nothing | `Passed` |
| `V3.3` | `S3` | `DES4` | `bun test src/core/state -t "autosaves once\|failed save"` (JS regex `\|`) | 2 pass. The delays are `[1000, 2000, 4000, 8000, 16000, 30000, 30000]`; status `saveError` is `{reason, retryAt: 2000}` | `Passed` |
| `V3.5` | `S3` | `DES4` | `bun test src/core/state/save.test.ts -t "typing during a write"` | 1 pass | `Passed` |
| `V4.1`–`V4.4` | `S4` | `DES4` | `bun test src/core/state/save.test.ts -t ":q\|:bd"` (JS regex `\|`) | 8 pass | `Passed` |
| `V5.2`, `V5.3` | `S5` | `DES5` | `bun test src/core/state/disk.test.ts -t "deleted on disk"` | 2 pass | `Passed` |
| `V5.4` | `S5` | `DES5` | `bun test src/core/state -t "external change\|save conflict\|conflict keys"` (JS regex `\|`); probe: reload, then key `u` | 4 pass. Probe: `u` restores `one\ntwo` and marks the buffer dirty | `Passed` |
| `V13.2`, `V13.3`, `V13.5` | `S13, S11` | `DES13` | `bun test src/core/state/explorer.test.ts` | 7 pass | `Passed` |
| `V13.2` robustness (in-flight write) | `S13, S4` | `DES13, DES4` | Probe: edit → autosave timer (writing) → edit → `explorerOp(rename a.md→c.md)` → `saved(a.md)` → `fsResult ok` → `saveFailed(a.md, conflict)` → edit → timer → `:q` | The `explorerOp` effects are `[rename]` only. `saved` emits `write a.md` (queued behind the rename). After the re-path the buffer is `c.md` with `save: {kind:"writing", version:2, …}` permanently. A later edit and timer emit `[]`; `:q` sets `waiting: [1]` with no effects and never exits | `Failed` (`P2-G1-VER1`) |
| `V7.5` | `S7` | `DES3, DES2` | `bun test src/core/state/keys.test.ts -t "bound key sequence\|explorer keys resolve\|filetype binding"` (JS regex `\|`) | 3 pass | `Passed` |
| `V10.3` | `S10` | `DES10` | `bun test src/core/state/keys.test.ts -t '"\+'` | 2 pass | `Passed` |
| `V2.1` (all cases) | `S2` | `DES3` | `bun test test/vim`; `bun test test/vim -t "ex-"` | 291 pass (289 cases + metadata + E486), 0 todo; the 4 `ex-substitute-*` cases pass | `Passed` |
| DEV2 E486 | `S2` | `DES3` | `bun test src/core/state/keys.test.ts -t "E486"` | 1 pass | `Passed` |
| `V7.1` | `S7` | `DES2` | `bun test test/boundaries.test.ts`; `grep -rnE "Date\.now\|performance\.\|process\.\|setTimeout\|setInterval\|Math\.random\|crypto\|Bun\.\|node:" src/core/state src/core/config` | 2 pass; grep finds nothing | `Passed` |
| Format and lint | `S1` | `DES1` | `bunx biome check .` | 63 files, no findings | `Passed` |
| Fast check (interim `knip` rule) | `S1` | `DES1` | `bun run check`; unit stage run directly: `bun test src test/boundaries.test.ts test/repo.test.ts test/vim` | knip exits 1 with: unused dependencies `@opentui/core`, `ignore`, `@xterm/headless` (accepted in P1-G1); exports `ConfigSchema`, `pendingWrites`; types `ViewSpec`, `WhichKeyItem` (accepted in P1-G2), `WindowId`, `DirEntry`, `TimerId`, `Overlay`. Every item except `ConfigSchema` is a G1 or plan-listed symbol with a later-group consumer. Unit stage: 374 pass, 0 fail, 15 files | `Failed` (`P2-G1-VER2`) |
| Report V-case commands | `S7` | `DES2` | Ran each command in the implementation report's mapping table exactly | 4 rows (V3.3, V4.1–V4.4, V5.4, V7.5) use `\|`. Bun reads `-t` as a JS regex, so each prints `error: regex … matched 0 tests` and exits 0 | `Failed` (`P2-G1-VER3`) |
| Process-ID scan (DEV1) | `None` | `None` | Scan listed in Specification Verification | No match | `Passed` |

## Findings

### P2-G1-VER1 — Major — Correctness — A rename during an in-flight write leaves the buffer stuck in `writing`

- **System Design:** `REQ10@R2, REQ5@R1, REQ1@R3 → DES13, DES4 → S13, S4, S3 → V13.2, V4.1`
- **UI Design:** `None`
- **Evidence:** `explorerOp` skips the flush when a write is already in flight, because `writeBuffer` is a no-op in that state (`src/core/state/save.ts:73`):

  ```ts
  if (b === undefined || b.save.kind === "writing" || isConflicted(s, id))
    return none(s);
  ```

  When that write's `saved` arrives and the user typed during it, `onSaved` emits a second write to the old path (`save.ts:142`). The serial queue holds that write behind the rename. `fsResult` then re-paths the buffer (`explorer.ts:157-162`) but keeps its `writing` save state. The reply for the old path finds no buffer and returns early (`save.ts:127-128` and `:171-172`):

  ```ts
  const b = bufferForPath(s, a.path);
  if (b === undefined) return none(s);
  ```

  The probe sequence (edit, autosave timer, edit, rename `a.md`→`c.md`, `saved(a.md)`, `fsResult ok`, `saveFailed(a.md, "conflict")`) ends with buffer 1 at `c.md` in `{kind:"writing", version:2, at:1000, attempt:0}`. A later edit and autosave timer then emit no effects. `:q` sets `terminal.quit.waiting: [1]`, emits nothing, and never exits.
- **Impact:** Autosave stops without any message for a renamed or moved buffer that still has unsaved typing. `:q` hangs with no feedback, so the user must use `:q!` or a signal. This breaks the §6 invariants: `terminal.quit` is set only while writes are in flight, and `writing` is followed by a `saved` or `saveFailed`. It also breaks S13 ("keep open buffers consistent"). If the adapter writes a missing target, the newest text also lands at the old path while the new path keeps the older text.
- **Required resolution:** A rename or move must never leave a buffer in `writing` with no write in flight for its current path. After `fsResult ok`, the buffer's newest text must reach the new path through a write or a resumed autosave, and a pending or later `:q` must complete. The fix must not write to the vanished old path. It must keep the single `writable` gate and the protocol unchanged.
- **Required proof:** A unit test in `src/core/state/explorer.test.ts` that drives the probe sequence above through `createUpdate`. It asserts that after `fsResult ok`, the buffer is not stuck in `writing`, a write to `c.md` with the newest text is emitted (immediately or on the next autosave timer), and `:q` then exits after `saved(c.md)`. `bun test src/core test/vim` must pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G1-VER2 — Minor — Tooling — `ConfigSchema` export violates the interim `knip` rule

- **System Design:** `REQ1@R3, REQ2@R2 → DES2, DES1 → S1 → V1.3`
- **UI Design:** `None`
- **Evidence:** `bun run check` → knip `Unused exports: ConfigSchema src/core/config/schema.ts:3:14`. The plan index Plan Overview allows interim knip findings "only [for] G1 symbols whose consumer is a later group". `ConfigSchema` is not a G1 symbol. Its only consumer is DI2 config loading, which is outside this goal; the implementation report says so in deviation 9.
- **Impact:** `bun run check` reports a finding that the interim rule does not allow. P3-G1-T6 requires zero knip findings, so this would block it.
- **Required resolution:** `ConfigSchema` keeps defining `AppConfig` and `defaults` but is no longer exported, so knip stops reporting it. DI2 can export it when it adds config loading. No other knip finding is added.
- **Required proof:** `bun run check` → knip lists no `ConfigSchema` item and only the interim items above; `bun --bun run tsc --noEmit -p .` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G1-VER3 — Minor — Evidence — Four V-case commands in the implementation report select zero tests

- **System Design:** `REQ1@R3, REQ5@R1, REQ6@R1 → DES3, DES4, DES5 → S3, S4, S5, S7 → V3.3, V4.1–V4.4, V5.4, V7.5`
- **UI Design:** `None`
- **Evidence:** The mapping table uses grep-style alternation, e.g. `bun test src/core/state/save.test.ts -t ":q\|:bd"`. Bun reads `-t` as a JavaScript regex, and running it prints `error: regex ":q\|:bd" matched 0 tests. Searched 1 file (skipping 10 tests)` with exit code 0. The same happens for the V3.3, V5.4, and V7.5 rows. With `|` the same filters select 2, 8, 4, and 3 passing tests.
- **Impact:** Anyone who reruns the recorded evidence (for example the P3-G1-T6 G1 evidence list) gets a zero-test run that looks successful, so the evidence proves nothing.
- **Required resolution:** The finalized implementation report records commands that select the mapped tests, using `|` instead of `\|`.
- **Required proof:** Each corrected command, run as written, reports a non-zero pass count and 0 fail.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - The protocol shape, through type checking.
  - Purity on frozen state (`resize`) and error containment.
  - Autosave delay, stale-timer suppression, backoff, and status `saveError`.
  - Typing during a write.
  - Every `:q`/`:q!`/`:bd`/`:bd!` rule, including the `:bd` continuation and its failure path.
  - Deleted-on-disk (clean and dirty), recreate with `:w`, reload as one undo step, conflict keep/take/diff, and save-conflict read-back.
  - Open and refuse.
  - Explorer re-path, trash close/keep, create targets, E13, trash failure, listing errors, toggle, and prompts.
  - Keymap precedence, explorer mode, and filetype scope.
  - `"+` copy and paste fallback, E486, E492, `:e` path rules, Tab completion, `:bn`/`:bp`.
  - Markdown-only `words`.
  - All 289 recorded vim cases through `createUpdate`.
- **Missing:**
  - A rename or move while a write is in flight, after typing during that write (`P2-G1-VER1`). The test must assert the post-`fsResult` save state, the write to the new path, and `:q` completion.
  - `V7.3` purity is tested only with `resize`. The verifier's probe covered key, edit, ex, clipboard, undo, and window actions on frozen state, and all passed. A test that replays an edit sequence on a deep-frozen state and compares results by content would protect the rest of the reducer surface. This is advisory and not a finding, because the plan preview specifies `resize`.

## Scope Changes

The implementation report flags seven deviations. Each one was judged against the design's own requirements, the lean rule, and the G1/parent contracts.

1. **`SaveState.writing = {version, at, attempt}` and a `now` argument on `writeBuffer`, `requestQuit`, `closeBuffer`, `explorerOp`, and `resolveConflict`.** This is necessary. Only `key` and `timer` carry `now` (§6 Action/Effect invariant, parent `…phase-1…md:222`), and `saved`/`saveFailed` keep their parent shapes without a time. So the §7 `onSaveFailed` rule `failed(attempt+1, now+retryDelay)` has no `now` unless the write carries its request time. The §7 shape `writing{version}` also drops the attempt count on each retry, which would reset the backoff to 1 s and break V3.3. The change is internal to `BufferState` (not a top-level field, not an `Action`/`Effect` member, not a G1 symbol), and the functions take the `now` that arrives in `key` and `timer` actions, so core stays clock-free. Caveat (cosmetic, not a finding): `retryAt` counts from the write request, not from the failure. The status countdown can therefore run ahead of the real retry timer by the write's latency.
2. **`BufferState.closing?: true`.** This is necessary. REQ5@R1 says `:bd` closes "only when all writes succeed", and §5 says "`:bd` → same block/flush rules … then close", but the design gives `:bd` no continuation (only `terminal.quit` for `:q`). It is a sub-field of the DI1 `buffers` field, not a new AppState field, and `onSaveFailed` clears it.
3. **`registers` under `AppState.vim`.** This conforms. §6 and the parent (`rm261003abzp-design.md:355`) list registers under `vim`. The kernel `VimState` has none (`kernel/vim/types.ts:33-45`), so §7's `VimState & {pendingPaste?}` omitted them by mistake.
4. **`PromptState`, `Toast`, `MouseEvent`.** These are acceptable open-detail refinements. §7 references all three without defining them, and the parent leaves `MouseEvent` undefined. `MouseEvent = {kind:"scroll"; delta}` is part of the G1 `Action` payload. If P3-G1 needs explorer-row clicks (parent UI design row "mouse click on explorer row / buffer"), it must widen this type within this work, before G1 is due.
5. **Files outside the §4 list.**
   - `src/core/state/result.ts` is sanctioned by the T1 REFACTOR ("allowed: shared Result helpers inside src/core/state").
   - `test/support/state.ts` is the test fixture module that the plan previews assume (`testRegistries`, `deepFreeze`, `boot`).
   - `src/core/state/status.test.ts` is a colocated unit test, which §4 allows (`src/**/*.test.ts`), and it proves the T5 `words` rule.

   None of these adds a product abstraction.
6. **`ConfigSchema` knip finding.** This is not acceptable under the interim rule; see `P2-G1-VER2`.
7. **Parent-sync proposal.** It belongs to the orchestrator and needs no group change. The shapes above are work-level refinements; none changes a parent contract. The work system design §7 text (`writeBuffer(s, id)`, `writing{version}`, `VimState & {pendingPaste?}`) now differs from the code. The orchestrator should record the accepted refinements against §7 when it accepts the group.

Other unplanned details in the implementation report (empty window without a `byId` entry, cmdline edited in `core/state`, `:wq` → `app.quit`, message texts, module cycles) are consistent with §5/§7 and REQ5. They add no AppState field or protocol member.

## Unverified Items

- Timer and clock interplay with the real effect runner is unverified. Autosave fires only when `save.at <= timer.now` (`save.ts:116`), as §5 specifies, and §7's runner does not clear an earlier timer on `startTimer`. Correct autosave therefore depends on P2-G2 giving `key` and `timer` the same monotonic `now`, with timers that never fire early. P2-G2 integration tests (V3.x) must prove this; it cannot be observed in pure reducers.
- The `saveFailed` reason string `"conflict"` (`save.ts:179`) must match what P2-G2's `atomicWrite`/runner sends. The adapter does not exist yet.

## Blockers

None
