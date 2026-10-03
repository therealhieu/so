# P2-G2 Verification Report

## Scope

- **Group:** `P2-G2` — Navigation, session, discovery, and link UI
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`, `P2-G2-T3`, `P2-G2-T4`, `P2-G2-T5`, `P2-G2-T6`, `P2-G2-T7`
- **Report:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p2-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p2-g2-implementation-report.md` (report commit `961f9c5`)

Inspected change range: `d1f8f67` → `8a358ce` (commits `dac97f9`, `d54b648`, `78f7ae4`, `6e033f9`, `cc57d9f`, `6b53486`, `46b4384`, `e2c0ed3`, `8a358ce`; 75 files, +6,075/−169).

## Status

`Failed`

Every group check passes and most chains are satisfied, but two Major defects remain. First, which-key breaks Vim `g` commands in notes after a 300 ms pause (P2-G2-VER1). Second, the backlinks panel shows no context line for linked mentions in closed notes (P2-G2-VER2). Four Minor findings are also open.

## Assigned Traceability

- **System Design:** `W261003FX70-REQ1, REQ7, REQ8, REQ9 → DES1, DES3 (link-at, commands), DES7 (discovery bindings, groups), DES8, DES9 → S1, S9 (panel), S15, S16, S17, S18 → V20 (",ff"), V21, V22 (except ":w"), V23, V25 (outline), V26, V27, V28, V29, V30 (jump), V32, V38 (mention cases), V40, V42, V43, V44, V46, V59 (picker preview)`
- **UI Design:** `None` (UI design not applicable to this work). The parent `RM261003ABZP-UV4@R2` and `RM261003ABZP-UV5@R1` records, the panel, indexing, theme and 80×24 states of `M1@R1`, `M3@R1`, `M4@R1`, and `AD4` are asserted through V42–V44 and V46.

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ8 → DES1, DES8 → S1, S16 → V26` | None | Jump list capped at 100, same-line replace, forward truncation, back-at-end records current, `jump i/n`; recents MRU, deduped, capped | `src/core/state/jumps.ts:pushJump, jumpBack, jumpForward, jumpSegment`; `src/core/state/recent.ts:touchRecent`; `src/core/state/buffers.ts:openPath, onFileLoaded` (touchRecent) | `Satisfied` |
| `REQ8 → DES8 → S16 → V27` | None | Recorded jump motions equal Neovim 0.11 | `src/core/kernel/vim/engine.ts:JUMP_MOTIONS, moveCursor, cmdlineKey` (`jumped` effect); `src/core/state/keys.ts:applyVimEffects` (`jumped` → `pushJump`); `test/vim/cases.ts` (6 cases) | `Satisfied` |
| `REQ8 → DES8 → S16 → V28, V32, V40` | None | Snapshot without text; restore on folder start only; one debounce in `update`; `0600` state file outside the workspace; corrupt → empty; save on every shutdown path | `src/core/state/session.ts:parsePersisted, snapshotSession, sessionChanged, onStateLoaded, fillRestored, dropRestored`; `src/core/state/update.ts:createUpdate` (single `saveState` debounce); `src/workspace/state-file.ts:statePath, saveStateFile, saveStateFileSync`; `src/app/lifecycle.ts:installLifecycle` (`saveSession` before `shell.destroy`); `src/app/main.ts:sessionSaver`, `restore: ws.file === undefined` | `Satisfied` |
| `REQ1 → DES1, DES7, DES9 → S15 → V21` | None | Which-key after 300 ms idle; direct actions before groups; `<BS>`; unmapped notice; DI2 groups | `src/core/state/whichkey.ts:armWhichKey, onWhichKeyTimer, whichKeyKey, whichKeyRows`; `src/core/kernel/commands/defaults.ts:defaultGroups`; `src/ui/overlays/whichkey.ts:WhichKeyView` | `Mismatch` — P2-G2-VER1 (a popup on a non-leader prefix swallows Vim `g` commands) |
| `REQ9 → DES4, DES9 → S17 → V29, V59 (preview)` | None | One search per settled query; stale ids dropped; `1000+`; preview only at ≥ 100 columns; preview wraps | `src/core/state/picker.ts:setQuery, onSearchTimer, onSearchResults, requestPreview, onPreviewLoaded`; `src/app/index-host.ts:search`; `src/app/effects.ts` (`search`, `readPreview`); `src/ui/editors/text-view.ts:paintPreview` | `Mismatch` — P2-G2-VER4 (lost search on worker crash), P2-G2-VER5 (no preview after a resize to ≥ 100) |
| `REQ7 → DES7 → S13 → V20 (",ff")` | None | Leader `,` maps `,ff` to `file.find` | `src/core/kernel/commands/defaults.ts:defaultBindings` (`<leader>ff`); `src/core/state/config.test.ts` "leader comma maps ,ff to find files" | `Satisfied` |
| `REQ1 → DES3, DES7, DES9 → S15 → V22 (except ":w")` | None | Note keys only in Markdown scope; `:link.follow` notice in `sync.ts`; palette and `:` completion scoped; overrides per scope | `src/core/state/link-commands.ts:linkCommands, linkBindings` (all `filetype: "markdown"`); `src/core/state/keymap.ts:keyScope`; `src/core/state/picker.ts:commandBindings` | `Satisfied` |
| `REQ1, REQ6 → DES3, DES9 → S18 → V23` | None | Follow to heading with a jump; create prompt; off-link no-op; completion notes → headings, one undo block | `src/core/features/links/link-at.ts:linkAt`; `src/core/state/link-commands.ts:followLink, targetLine, newNotePath`; `src/core/state/completion.ts:maybeOpenCompletion, completionKey, insertItem` (via `keys.ts:typeKeys`) | `Satisfied` |
| `REQ5, REQ6 → DES5, DES6, DES9 → S9, S12, S18 → V25 (outline), V38 (mentions)` | None | Outline from the live scan before save; mention linked in an open dirty buffer and a closed file, then moves to Linked | `src/core/state/side-panel.ts:sidePanelRows, linkMentionAtPanel`; `src/core/state/link-edits.ts:startMentionEdit` (D2 refusal, `beginRewrite`); `src/app/effects.ts` (own writes notify the index) | `Satisfied` |
| `REQ1 → DES8, DES9 → S16, S18 → V30 (jump)` | None | `jump 2/2` segment | `src/core/state/status.ts:statusSegments` (`jump`); `src/ui/views/statusline.ts` | `Satisfied` |
| `REQ1 → DES9 → S15, S17, S18 → V42, V43, V44, V46` | Parent `UV4@R2`, `UV5@R1`; `M1@R1` S10/S11, `M3@R1`, `M4@R1` S2/S6/S7, `AD4` | All UI assertions hold; panels render linked mentions with context lines | `test/ui/{discovery,links,shell.golden,theme.golden}.test.ts`; `src/ui/views/side-panel.ts:SidePanelView`; `src/ui/overlays/{picker,completion,whichkey}.ts` | `Mismatch` — P2-G2-VER2 (linked rows show the raw link, not the context line) |
| `REQ1 → DES9 → S17, S18` (narrow layout) | `M4@R1` S18 / `M3@R1` S8 | Below 100 columns `<leader>lb` opens a backlinks picker that lists `backlinksOf(arg) + unlinked hits` (design section 7) | `src/core/state/picker.ts:pickerSources.backlinks` (linked only) | `Mismatch` — P2-G2-VER5 |
| `REQ8 → DES8 → S16` (jump to unreadable file) | None | A jump to an unreadable file shows the open-policy refusal | `src/core/state/jumps.ts:goTo, awaitLoad` reuse `windows.restore`; `src/core/state/buffers.ts:onFileRefused` → `dropRestored` | `Mismatch` — P2-G2-VER3 |
| `REQ1 → DES1 → S1` | None | Exhaustive switch compiles; each new fallible effect answers exactly one action; no DI3/DI4 field | `src/core/state/types.ts` (Action/Effect/Overlay/TimerId additions); `src/core/state/update.ts:step` (`never` check); `tsc` clean | `Mismatch` — P2-G2-VER4 (`search` can go unanswered) |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| Fast gate | `S1`, `S19` | `DES1` | `bun run check` | exit 0 in 7.2 s wall; biome 186 files clean; `tsc` clean; knip clean; 610 pass, 0 fail | `Passed` |
| Units and vim | `S13`, `S15`–`S18` | `DES7`–`DES9` | `bun test src test/vim` | 604 pass, 0 fail across 51 files | `Passed` |
| Integration and component | `S9`, `S16`, `S18`, `S20`, `S21` | `DES6`, `DES8`, `DES9` | `bun run test:ci` | 113 pass, 0 fail, 25 snapshots across 19 files | `Passed` |
| Build and binary | `S11` | `DES4` | `bun run build`; `bun test test/e2e/binary-index.test.ts` | `dist/so` compiled (main + index worker); 1 pass | `Passed` |
| `V20` (",ff") | `S13` | `DES7` | `src/core/state/config.test.ts` "leader comma maps ,ff to find files" | passes in the units run | `Passed` |
| `V21` | `S15` | `DES9` | `src/core/state/whichkey.test.ts` (5 tests); probe: Markdown note, `G`, `g`, `whichKey` timer, `g` | Tests pass. Probe: overlay opens on `g`; the second `g` gives "no mapping for gg" and the cursor stays on line 3 (a fast `gg` reaches line 1) | `Failed` — P2-G2-VER1 |
| `V22` (except `:w`) | `S15` | `DES3`, `DES7`, `DES9` | `src/core/state/keys.test.ts` (5 new tests) | pass: note vs `sync.ts`, `:link.follow` notice, scoped lists, `<leader>w` per scope, every link binding Markdown-scoped | `Passed` |
| `V23` | `S18` | `DES3`, `DES9` | `src/core/state/links.test.ts` (6 tests) | pass, including `<Esc>u` removing the whole insertion (one undo block) and the `Create projects/plan.md? [y/N]` prompt | `Passed` |
| `V25` (outline) | `S12` | `DES5` | `src/core/state/index.test.ts` "the outline shows a new heading before saving" | passes | `Passed` |
| `V26` | `S16` | `DES8` | `src/core/state/jumps.test.ts` (11 tests) | passes | `Passed` |
| `V27` | `S16` | `DES8` | `bun test test/vim`; re-recorded with Neovim 0.11.7 (`NVIM=… bun run record:vim`), diffed, then restored `test/vim/expected.json` | 295 cases recorded; the only diff is `recordedAt`; earlier cases unchanged in the group diff | `Passed` |
| `V28` | `S16` | `DES8` | `src/core/state/session.test.ts` (7 tests) | passes: no text, restore true/false, one missing-file toast, version 2/garbage → undefined, debounce only for persisted changes | `Passed` |
| `V29` | `S17`, `S16` | `DES9` | `src/core/state/picker.test.ts` (9 tests) | passes: one search per settled query, stale id dropped, `1000+`, empty query, preview at 120 not 99, recent hides removed | `Passed` |
| `V30` (jump) | `S18` | `DES9` | `src/core/state/status.test.ts` "the statusline shows the jump position" | passes | `Passed` |
| `V32` | `S16` | `DES8` | `src/workspace/state-file.test.ts` (4 tests) | passes: `<state>/so/<16 hex>/state.json`, never under the workspace, mode `0600`, corrupt → undefined | `Passed` |
| `V38` (mentions) | `S9`, `S8` | `DES6` | `test/integration/rename.test.ts` "linking a mention edits an open dirty buffer in memory and a closed file atomically" | passes | `Passed` |
| `V40` | `S16` | `DES8` | `test/integration/session.test.ts` (2 tests); `test/e2e/quit.test.ts` ":q saves the session…" | pass: run 2 restores windows, cursors, recents and jumps; run 3 keeps only the file; no new workspace file; `:q` writes `0600`. Run 1 opens files but follows no link (P2-G2-VER6) | `Insufficient` — P2-G2-VER6 |
| `V42` | `S15`, `S17` | `DES9` | `test/ui/discovery.test.ts` (7 tests) | every `UV4@R2` action and assertion passes, including 120 vs 99 preview, `●` overrides, and no `+links` in `sync.ts` | `Passed` |
| `V43` | `S18` | `DES9` | `test/ui/links.test.ts` (5 tests) | every `UV5@R1` assertion passes (popup above the cursor row, `[[plan#Goals]]`, `jump 2/2 → 1/2`, create prompt, Linked before Unlinked, `l` moves the mention, impact before Enter, `12 files updated`) | `Passed` |
| `V44` | `S18` | `DES9` | `test/ui/shell.golden.test.ts` (5 new goldens); visual review against `M1@R1` S10/S11 and `M4@R1` S6 | Goldens match. Indexing, ready toast, outline, and `sync.ts` statusline agree with the mockups. The backlinks golden shows `◇ log/day-01:3` / `[[plan]]` instead of a context line | `Failed` — P2-G2-VER2 |
| `V46` | `S18` | `DES9` | `test/ui/theme.golden.test.ts` (3 tests) | pass: no colour SGR under NO_COLOR, `▸` plus reverse, light golden, title and counter unclipped at 80×24 | `Passed` |
| `V59` (picker preview) | `S21` | `DES11` | `test/ui/editor-options.test.ts` "a picker preview wraps the long paragraph" | passes | `Passed` |
| Deviations D1/D2 | `S15`, `S10` | `DES6`, `DES9` | Inspected command titles and `startMentionEdit` | Titles: "Search backlinks of this note", "Jump to older/newer position"; no title ties "Toggle backlinks panel" on `back`. `startMentionEdit` calls `refuseWhileRewriting` first | `Passed` |
| Process identifiers | None | None | `git diff d1f8f67 8a358ce -- src test scripts` grep for REQ/DES/V/S/phase/work IDs in added lines | no match | `Passed` |
| Boundaries | `S1` | `DES1` | `test/boundaries.test.ts` (in `check`) | passes; link commands moved to `src/core/state/link-commands.ts` to respect the `core/features → state` ban | `Passed` |

## Findings

### P2-G2-VER1 — Major — Correctness — Which-key on a non-leader prefix breaks Vim `g` commands in notes

- **System Design:** `REQ1, DES9, S15, V21`; `REQ8, DES8, S16` (Neovim parity)
- **UI Design:** None
- **Evidence:** In Markdown, `linkBindings` maps `gd`, so `g` is a keymap prefix. `src/core/state/keys.ts:routeKey` arms which-key for every prefix (`armWhichKey(setVim(s, { pending: seq }), scope)`). Once the overlay opens, `src/core/state/whichkey.ts:whichKeyKey` resolves `[g, g]` as unmapped and calls `noMapping`, so the key never reaches the engine. Probe on a 3-line note, cursor on the last line: `g`, `timer whichKey`, `g` → message `no mapping for gg`, cursor still `{ line: 2, col: 0 }`. The same keys typed within 300 ms move to line 0. This affects every unbound `g` command in notes (`gg`, `ge`, `gj`, `gu…`, `gJ`, `gv`, `gi`). Neovim runs the built-in `g` command after the mapping timeout.
- **Impact:** A user who pauses more than 300 ms after `g` in a note loses the command. Vim behaviour then differs between notes and code files.
- **Required resolution:** When the popup is open for a prefix that is not the leader and the next key has no mapping, feed the pending keys and that key to the Vim engine, exactly as `routeKey` does without the popup. Alternatively, do not open which-key for prefixes that the engine also accepts. Leader prefixes keep the "no mapping for …" notice.
- **Required proof:** A unit test in `src/core/state/whichkey.test.ts` or `keys.test.ts`: in a note, `G`, `g`, the `whichKey` timer, then `g` moves the cursor to line 0 with no notice. The V21 cases and `bun test test/vim` still pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER2 — Major — UI acceptance — Linked mentions in closed notes show the link, not a context line

- **System Design:** `REQ1, REQ6, DES9, S18, V44` (backlinks panel)
- **UI Design:** Parent `M4@R1` S6 ("linked mentions with context lines"), `M1@R1` S10, `rm261003abzp-ui-requirements.md:113`, parent `rm261003abzp-requirements.md:138` ("lists linked and unlinked mentions with context lines")
- **Evidence:** `src/core/state/side-panel.ts:sidePanelRows` sets `text: bufferForPath(s, b.from)?.text.line(b.link.line) ?? b.link.raw`, so every closed note shows only the raw link. The committed golden `test/ui/__snapshots__/shell.golden.test.ts.snap` "the backlinks panel shows Linked then Unlinked mentions 2" paints `◇ log/day-01:3` / `[[plan]]` for all 31 linked rows. The implementation report lists this as a known difference.
- **Impact:** For closed notes, which are most backlinks, the panel cannot show the surrounding sentence, so the accepted state and the parent requirement are not met. The golden locks the wrong presentation in place.
- **Required resolution:** Give linked rows the full source line for closed notes, for example through a context request answered by the worker's text cache, or by carrying the line text in summaries. Then re-record the backlinks golden after a visual review against M4 S6.
- **Required proof:** A side-panel unit test showing a closed note's linked row text equal to its source line. The updated `shell.golden` backlinks snapshot shows context lines. `bun run test:ci` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER3 — Minor — Failure behavior — A jump to an unreadable file reports a session-restore toast

- **System Design:** `REQ8, DES8, S16`; design section 5 "Failure and Recovery Rules" (open refusals use the message line)
- **UI Design:** None
- **Evidence:** `src/core/state/jumps.ts:goTo` parks the target in `windows.restore` through `awaitLoad`, and `src/core/state/buffers.ts:onFileRefused` routes any pending path to `dropRestored`. Probe: jump list `[gone.md]`, `<C-o>`, `fileRefused gone.md io` → toast `1 files from the last session were not found`, no `cannot read file — not opened (gone.md)` message. The same path serves `gd`, picker accept with a line, and panel Enter, so following a link to a binary or oversized file hides the refusal reason.
- **Impact:** Users get a misleading message about the last session and lose the actual refusal reason.
- **Required resolution:** Restore and navigation report misses differently. A navigation miss shows the normal open-policy message, and only session restore counts toward the session toast.
- **Required proof:** A unit test where `<C-o>` to a refused file shows the `REFUSED` message and no session toast. Session V28 tests still pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER4 — Minor — Failure behavior — A search in flight when the worker crashes is never answered

- **System Design:** `REQ1, REQ9, DES1, DES4, S1` ("every new fallible effect answers with exactly one action"), `S17`
- **UI Design:** None
- **Evidence:** `src/app/index-host.ts:search` posts to the current worker. When that worker crashes, `crashed` only dispatches `indexFailed`, and `src/core/state/index.ts:onIndexFailed` does not settle `picker.search` or `panels.side.mentions`. The picker keeps `search.pending` (`searching…`, `src/ui/overlays/picker.ts:163`) until the query changes, and the panel's unlinked list stays pending.
- **Impact:** Grep or the mentions list can hang after a worker crash, which is the case S11 is designed to survive.
- **Required resolution:** Answer every outstanding search with an empty `searchResults`, or with an error row such as `index unavailable`, when the worker crashes or stops.
- **Required proof:** A test in `test/integration/index-host.test.ts` that crashes the worker during a search and observes exactly one `searchResults` for that id.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER5 — Minor — Specification — Narrow backlinks picker omits unlinked hits, and the preview is not requested after a resize

- **System Design:** `REQ1, REQ9, DES9, S17, S18`; design section 7 `pickerSources` ("backlinks: backlinksOf(arg) + unlinked hits"); section 7 `side-panel.ts` (cols < 100 → picker, M4 S18)
- **UI Design:** Parent `M3@R1` S8, `M4@R1` S18
- **Evidence:** `src/core/state/picker.ts:pickerSources.backlinks.items` lists only `backlinksOf`, so below 100 columns no unlinked mention is listed or linkable. `src/core/state/update.ts:onResize` changes `terminal` only. A picker opened below 100 columns and then resized to ≥ 100 paints the preview pane (`src/ui/overlays/picker.ts:89`) with no `preview` requested until the selection moves. The implementation report lists both items.
- **Impact:** The designed narrow fallback loses unlinked mentions. S17 "previews appear at ≥ 100 columns" fails after a widening resize.
- **Required resolution:** Add unlinked hits to the backlinks source as designed. If the M3 S8 linked-only list is preferred, record it as a deviation for orchestrator approval. Request a preview for an open picker when a resize crosses `PREVIEW_MIN_COLS`.
- **Required proof:** `src/core/state/picker.test.ts` cases: the backlinks source includes unlinked hits (or the approved deviation is recorded), and a `resize` from 99 to 120 with a picker open emits one `readPreview`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P2-G2-VER6 — Minor — Test coverage — V40 run 1 does not follow a link

- **System Design:** `REQ8, DES8, S16, V40` ("run 1: open two files in splits, follow a link, quit")
- **UI Design:** None
- **Evidence:** `test/integration/session.test.ts` run 1 uses `app.open("a.md")`, `:vs`, `app.open("b.md")`, `Gk`. `a.md` contains `[[b]]`, but no `gd` is sent, so the restored jump list only proves `file.edit` pushes, not cross-file link follows across runs.
- **Impact:** The planned evidence that a followed link's jump survives the session round trip is missing.
- **Required resolution:** Follow `[[b]]` with `gd` in run 1, and assert that the restored jump list contains the source position of that follow.
- **Required proof:** `bun test test/integration/session.test.ts` passes with the added `gd` step and assertion.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - **Jumps and recents:** jump-list rules and recents; Neovim parity for six recorded jump motions.
  - **Session:** snapshot, restore, debounce, corrupt and versioned state files; state-file location and mode; cross-run restore; `:q` save in a PTY.
  - **Which-key:** timing, rows, `<BS>`, unmapped notice, scoped groups.
  - **Pickers:** grep debounce, stale ids, cap, preview width gating, recent filtering, palette title ranking, help listing, unavailable index.
  - **Links:** link-at (code excluded); follow, create, completion, alias completion, popup closing.
  - **Note scope:** note-key scoping and overrides.
  - **Side panel:** docking, focus, rows, mention linking in open and closed files.
  - **Statusline:** outline before save; jump segment.
  - **Component and goldens:** every `UV4@R2`/`UV5@R1` assertion; index, panel, and theme goldens; picker preview wrapping.
- **Missing:**
  - Which-key popup followed by a Vim `g` command in a note (P2-G2-VER1).
  - Linked-row context text for closed notes (P2-G2-VER2).
  - Navigation to a refused file (P2-G2-VER3).
  - Search answered after a worker crash (P2-G2-VER4).
  - Preview after a widening resize, and unlinked hits in the backlinks picker (P2-G2-VER5).
  - The `gd` follow in V40 run 1 (P2-G2-VER6).

## Scope Changes

The implementer's deviations were assessed on their merits:

- **Link command location:** link commands live in `src/core/state/link-commands.ts`, not `src/core/features/links/commands.ts`. This is justified: `test/boundaries.test.ts` forbids `core/features` from importing `core/state`, and the symbols match the design.
- **Follow records only the source:** this is justified. `UV5@R1` and M4 S2 require `jump 2/2` after one `gd` and `jump 1/2` after `<C-o>`. `test/ui/links.test.ts` proves both.
- **`statePath` may return `undefined`:** the design returns `string`. Falling back to `~/.local/state` and disabling the session when both locations are inside the workspace preserves the V32 invariant (never inside the workspace). Accepted.
- **Smaller UI choices:** completion details (alias `name|Alias`, `#` continues to headings, popup above the cursor when fewer than 10 rows remain), editor-driven `file.rename`/`file.move` on the active file, own writes notifying the index worker, the `:jumps` message line, 24-cell which-key columns, and the outline hint `q close`. These are consistent with the parent UI design and add no DI3/DI4 scope. Accepted.
- **Unplanned additions:**
  - `<leader>st` is bound in `defaultBindings` to `search.tags`, a command registered by `linkCommands`.
  - Picker selection moves write `n/total label` to the message line. This matches the UI design's announcement rule (`rm261003abzp-ui-design.md:701`).
- **Not accepted:** the linked-only backlinks picker (P2-G2-VER5) and context-free linked rows (P2-G2-VER2) are deviations from the design or the accepted mockups without approval.
- **Orchestrator deviations:** D1 and D2 hold. Command titles satisfy the D1 rule, and `startMentionEdit` applies the D2 refusal.

## Unverified Items

- **Concurrent state-file saves:** a `saveState` write in flight while the shutdown sync save runs was inspected, not exercised. Both use `<path>.<pid>.tmp`, and the sync save runs last before exit.
- **Picker freshness during indexing:** picker items do not refresh on a later `indexBatch`. The design does not specify this behaviour, so it was not treated as a defect.
- **Cross-work gates:** none are due in this group, and none were checked. The G2/G3 outputs are handed to P3-G1.

## Blockers

None
