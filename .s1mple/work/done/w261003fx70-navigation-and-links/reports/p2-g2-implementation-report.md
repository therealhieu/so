# P2-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-goal.md`
- **Plan Part:** `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-plan-2-runtime-index-navigation-ui.md`
- **Group:** `P2-G2` — Navigation, session, discovery, and link UI
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`, `P2-G2-T3`, `P2-G2-T4`, `P2-G2-T5`, `P2-G2-T6`, `P2-G2-T7`
- **Report:** `.s1mple/work/done/w261003fx70-navigation-and-links/reports/p2-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P2-G2-T1` — Jump list and recents | `src/core/state/jumps.ts:pushJump, recordJump, jumpBack, jumpForward, jumpSegment, showJumps`; `src/core/state/recent.ts`; `src/core/kernel/vim/engine.ts` (`jumped` effect for jump motions); `src/core/kernel/commands/defaults.ts` (`<C-o>`, `<C-i>`, `<Tab>`); `test/vim/cases.ts`, `test/vim/expected.json` (6 jump cases) | `bun test src/core/state/jumps.test.ts test/vim` → 307 pass, 0 fail; the 6 new cases were recorded with Neovim 0.11.7 (`NVIM=… bun run record:vim`); earlier recorded cases unchanged | `dac97f9` | `Completed` |
| `P2-G2-T2` — Session persistence and restore | `src/core/state/session.ts:snapshotSession, parsePersisted, onStateLoaded, sessionChanged`; `src/workspace/state-file.ts:statePath, readStateFile, saveStateFileSync` (mode `0600`, outside the workspace); `src/app/{main,lifecycle,effects}.ts`; `test/integration/session.test.ts`; `test/e2e/quit.test.ts` | session and state-file unit tests pass; `bun test test/integration/session.test.ts` → 2 pass, 5 runs in a row; e2e quit and restore → 9 pass | `d54b648` (the V40 integration suite is part of this commit; no follow-up was needed) | `Completed` |
| `P2-G2-T3` — Which-key | `src/core/state/whichkey.ts:armWhichKey, whichKeyKey, whichKeyRows, noMapping`; `src/ui/overlays/whichkey.ts:WhichKeyView`; `src/core/kernel/commands/defaults.ts:defaultGroups` | `bun test src/core/state/whichkey.test.ts` → 5 pass; `bun run check` exit 0 | `78f7ae4` | `Completed` |
| `P2-G2-T4` — Pickers, grep, and preview | `src/core/state/picker.ts:pickerSources, openPicker, pickerKey, onSearchResults, onPreviewLoaded`; `src/ui/overlays/picker.ts:PickerView`; `src/app/{effects,index-host}.ts` (`search`, `readPreview`) | `bun test src/core/state/picker.test.ts src/core/state/config.test.ts` → 16 pass; `test/ui/editor-options.test.ts` → 8 pass; `test/integration/index-host.test.ts` → 4 pass; `bun run check` exit 0 | `6e033f9` | `Completed` |
| `P2-G2-T5` — Link commands and completion | `src/core/features/links/link-at.ts:linkAt`; `src/core/state/link-commands.ts:linkCommands, linkBindings, linkGroups, anchorsOf`; `src/core/state/completion.ts:maybeOpenCompletion, completionKey, COMPLETION_ROWS`; `src/core/state/types.ts:CompletionState, Overlay.completion`; `src/core/state/keys.ts:handleKeyAction, typeKeys`; `src/core/state/jumps.ts:goTo`; `src/ui/overlays/completion.ts:CompletionView`; `src/ui/overlays/prompt.ts` (create confirm); `src/app/main.ts:registries`, `test/support/state.ts:testRegistries`; `<leader>st` in `defaultBindings` | RED: `bun test src/core/state/links.test.ts` → 1 pass, 5 fail before the implementation; GREEN: links 6 pass, `src/core/state/keys.test.ts` 22 pass (V22 cases), `src/core/features/links/link-at.test.ts` 1 pass; `bun run check` exit 0 | `cc57d9f`; follow-up `46b4384` (follow records only the source; popup above the cursor when < 10 rows remain), found by the T7 suites | `Completed` |
| `P2-G2-T6` — Side panel, mentions, and jump segment | `src/core/state/side-panel.ts:toggleSidePanel, requestMentions, sidePanelRows, sidePanelKey, linkMentionAtPanel, followShownNote, panelDocked, panelFocused`; `src/core/state/link-edits.ts:startMentionEdit`; `src/core/state/types.ts:SidePanelState, panels.side`; `src/core/state/status.ts:StatusSegments.jump`; `src/ui/views/side-panel.ts:SidePanelView`; `src/ui/views/{window-tree,statusline}.ts`; `src/core/state/commands.ts:focus`; `src/app/effects.ts` (own writes notify the index) | RED: `bun test src/core/state/side-panel.test.ts src/core/state/index.test.ts src/core/state/status.test.ts` → 3 fail (missing module, missing `jump`); GREEN: `bun test src/core/state` → 133 pass; `bun test test/integration/rename.test.ts` → 2 pass, 4 runs; `bun run check` exit 0 | `6b53486`; follow-up `8a358ce` (keys and `<C-w>l` reach the panel only while it is docked), found in the group self-review | `Completed` |
| `P2-G2-T7` — DI2 UI acceptance suites | `test/ui/discovery.test.ts`, `test/ui/links.test.ts`, `test/ui/theme.golden.test.ts`, `test/ui/shell.golden.test.ts` (index and panel goldens) and `__snapshots__`; `test/support/notes.ts` (link fixture and effect answers); `test/support/ui.ts:cellStyle` | `bun test test/ui` → 66 pass, 25 snapshots; earlier snapshots unchanged (snapshot diff is additions only) | `e2c0ed3` | `Completed` |

### Group Change Range

- **Starting commit:** `d1f8f6761d9408575b07d4eff1a6171407129b33`
- **Final commit:** `8a358ce`
- **Remaining group changes:** None. `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-goal.md` has an orchestrator modification that predates this group and was never staged.

Commits in order: `dac97f9`, `d54b648`, `78f7ae4`, `6e033f9`, `cc57d9f`, `6b53486`, `46b4384`, `e2c0ed3`, `8a358ce`.

### Group Verification

- `bun run check` → `Passed` — exit 0 in 3 s; biome, `tsc`, knip clean; 610 tests pass.
- `bun test src test/vim` → `Passed` — 604 pass, 0 fail; recorded vim cases match.
- `bun run test:ci` → `Passed` — 113 pass, 0 fail on each of 5 runs (3 before and 2 after the last fix).
- `bun run build` → `Passed` — `dist/so` compiled with the index worker.
- `bun test test/e2e/binary-index.test.ts` → `Passed` — 1 pass; the binary reaches index ready.
- Work-process identifiers → `Passed` — no `REQ`/`DES`/`V`/task IDs in the added lines of the group diff.

#### Golden visual review (V44, V46) against M1@R1, M3@R1, M4@R1

| State | Golden | Mockup reference | Result |
|---|---|---|---|
| Indexing progress | `shell.golden` "indexing progress shows in the statusline" | M1 statusline `◌ indexing n/total` | Matches: `◌ indexing 4,210/10,000` after the word count |
| Index ready | "the index-ready toast and the statusline segments" | M1 toast and `◆ index ready` | Matches: toast `✓ index ready`; segments `NORMAL │ source │ notes/plan.md │ ← 31 backlinks │ 14 words │ ◆ index ready │ 1:1` |
| Outline panel | "the outline panel marks the current heading" | M1 S11 | Matches: docked right, 36 columns with a `│` separator, title `OUTLINE`, headings indented by level, `▸` on the current heading. Hint reads `⏎ jump · q close` (mockup: `esc close`) |
| Backlinks panel | "the backlinks panel shows Linked then Unlinked mentions" (2 goldens) | M4 S6/S7, M1 | Matches layout: `BACKLINKS · <note>`, `▾ Linked mentions (N)` before `▾ Unlinked mentions (N)`, `◇ path:line` rows with a context line, the mention marked, focused hints `j/k move · ⏎ open · l link it` / `C-w h back to the editor`. Differences: linked context lines show the link itself for closed notes; long lists scroll instead of `+N more` |
| `sync.ts` statusline | "a code file shows source, path, index, and position only" | AD4 | Matches: `NORMAL │ source │ scripts/sync.ts │ ◆ index ready │ 1:1`; no backlinks or words |
| Picker under NO_COLOR | `theme.golden` "stays visible without colour" | M3, AD4 | Matches: every span uses default colours; the selected row has `▸` and reverse video |
| Picker in the light theme | "matches the light theme golden" | M3 | Matches: selection on `bg-sel`, other rows on the float background |
| Picker at 80×24 | "keeps its title and counter unclipped" | M3 S16 | Matches: `Find files` title and `18/18` counter unclipped; no preview pane |

### Deviations and Remaining Issues

Non-obvious decisions a remediator must preserve:

1. **Link commands live in `src/core/state/link-commands.ts`, not `src/core/features/links/commands.ts`.** `test/boundaries.test.ts` forbids `src/core/features` from importing `src/core/state`, and the commands call state reducers. The symbols (`linkCommands`, `linkBindings`, `linkGroups`) match the design.
2. **Follow records only the source as a jump.** The design flow lists `pushJump(target)` too, but UV5 and M4 S2 require `jump 2/2` after one `gd` and `jump 1/2` after `<C-o>`, as in Vim.
3. **Completion details:** Enter/Tab insert `name]]` through the Insert engine (`typeKeys`), so the whole insertion is one undo step and `.`-repeatable. In notes mode, `#` accepts the selected note without `]]` and continues with its headings. Esc is not intercepted: it leaves Insert, which closes the popup. The popup sits under the cursor row unless fewer than 10 rows remain below it; then it sits above. An alias item inserts `name|Alias`.
4. **Missing link target:** `Create <path>? [y/N]` puts the note beside the source note, or root-relative when the target names folders (`[[projects/plan]]` → `projects/plan.md`). The op is `{ kind: "create", from, dir: false }`, so the explorer create path opens it.
5. **Editor-driven rename/move:** `file.rename`/`file.move` act on the explorer selection when the explorer has focus, else on the active file. `treeField` edits in the tree only when the prompt's file is the explorer selection; otherwise the float prompt shows.
6. **Mention linking** goes through `beginRewrite` (one `N files updated` toast, D2 refusal while a rewrite is in flight). A stale mention in an open buffer gives the error toast `mention changed — not linked` and no edit.
7. **Own writes notify the index worker** (`src/app/effects.ts`, after `saved` and successful `applyEdits`). The watcher keeps own writes silent, so without this the worker's text cache stayed stale for grep and mentions after a save. Unlinked rows also drop hits that overlap a link in the live scan or the summary, so a linked mention leaves the list at once.
8. **Side panel focus:** the panel takes focus when opened (system design), and it gets keys only while docked (≥ 100 columns). `<C-w>l` past the last window enters it, `<C-w>h` and Esc leave it, `q` closes it. Below 100 columns `<leader>lb`/`<leader>o` open the backlinks/headings picker instead.
9. **Earlier tasks** (from T1–T4): `:jumps` prints one message line rather than a float; `statePath` returns `undefined` (session off) when both state locations are inside the workspace; restored windows do not touch recents; which-key columns are 24 cells wide (UI design) rather than the mockup's 30; picker selection uses `▸` plus `floatSel`.
10. **Fixture location:** the 31-links-in-12-files fixture is in memory in `test/support/notes.ts` (component tests never read disk), not in `test/fixtures/workspace/notes/*`, which `test/integration/open-save.test.ts` copies wholesale. The rename test types `roadmap.md`, because the rename field holds the file name with its extension.

Remaining issues for the verifier:

- Linked context lines show the link source text for closed notes (summaries carry no line text). Open notes show the full line.
- The backlinks picker lists linked notes only (M3 S8), so below 100 columns there is no way to link an unlinked mention.
- The picker does not request a new preview when a resize crosses 100 columns, and its items do not refresh on a later `indexBatch`.
- A jump to a file that the session restore refuses shows the "files from the last session" toast.

## Remediation

All six findings of the P2-G2 verification report are fixed in seven follow-up commits on top of `3ce604a`. Every group gate passes on the final head `aec8689`. Two fixes add an optional field to a designed shape. These are recorded below as deviations for orchestrator acceptance and design synchronization.

- **Verification reports:** `.s1mple/work/done/w261003fx70-navigation-and-links/reports/p2-g2-verification-report.md` (commit `3ce604a`, status `Failed`; unchanged)
- **Status:** `Completed`

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P2-G2-VER1` | **Change:** `src/core/state/whichkey.ts:whichKeyKey` now returns `undefined` for an unbound key after a non-leader prefix when the engine accepts the sequence in the popup's scope mode (`vimContinues` uses `parseKeys`; Insert and command-line modes consume every key; the explorer has no engine). `src/core/state/keys.ts:routeKey` then closes the popup and sends the key through the new `bindingOrVim`, with the pending `g` kept. Leader prefixes and keys with no keymap or Vim meaning still get `no mapping for …`. The 300 ms timer and `<leader>` handling are unchanged. **Proof:** `src/core/state/whichkey.test.ts` "a vim key after the popup opens on g still reaches the editor" (`G`, `g`, timer, `g` → `{ line: 0, col: 0 }`, no message), "a key bound under g still runs from the popup" (`gd` → create prompt), "a key that neither the keymap nor vim knows after g gets a notice" (`no mapping for gZ`), "an unbound key after an explorer prefix gets a notice"; UI case `test/ui/discovery.test.ts` "gg after the g popup opens still goes to the first line". Both `g` cases fail with the source reverted (2 fail), and the explorer case fails against `af2d40c`. `bun test src/core/state/whichkey.test.ts` → 9 pass. `bun test test/vim` → 297 pass. The V21 tests are unchanged and pass. | `af2d40c`, `aec8689` (`P2-G2-T3`) | `Fixed` |
| `P2-G2-VER2` | **Change:** `src/core/features/links/summarize.ts:LinkRef.context?` (new optional field) and `summarize(path, mtime, scan, lines?)`: each link carries its trimmed source line, cut to `CONTEXT_MAX` = 160 characters. The worker (`src/workspace/index-worker.ts:summarizeFile`) and the notes `so` writes (`src/core/state/index.ts:summarizeSaved, summarizeWritten`) pass their lines, so the main thread never reads or scans other notes. `src/core/state/side-panel.ts:sidePanelRows` uses the open buffer's line, then `link.context`, then `link.raw`. **Proof:** `src/core/state/side-panel.test.ts` "a linked row in a closed note shows its source line" (`see [[plan]]`, only `plan.md` open) and "a link's context is its trimmed line, cut for long lines". `test/ui/links.test.ts` asserts `Next: [[plan#Goals]] and` and, after `l`, `The [[plan]] is to keep files`. **Golden:** `shell.golden` "the backlinks panel shows Linked then Unlinked mentions 2" was re-recorded deliberately. Its diff is 14 lines, each `[[plan…]]` row becoming `- [[plan]] today` / `- [[plan#Goals]] today` / `- [[plan\|the plan]] today`. Reviewed against parent M4@R1 S6 (`◇ path:line` then the source line, cut at the panel width, e.g. `- [ ] Review [[so-roadmap]] milestones`): it matches. No other snapshot changed. `bun run test:ci` → 115 pass, 25 snapshots. | `0821c58` (`P2-G2-T6`, `P2-G2-T7`) | `Fixed` |
| `P2-G2-VER3` | **Change:** `src/core/state/types.ts` `windows.restore.pending[*].navigated?: true` (new optional field) is set by `src/core/state/jumps.ts:awaitLoad`, which serves jumps, `gd`, picker accept, and panel Enter. `src/core/state/session.ts:dropRestored` counts a path as missing only when a restored window waited for it. The new `awaitsNavigation` lets `src/core/state/buffers.ts:onFileRefused` show the `REFUSED` message for a navigation wait. `snapshotSession` copies only `path`, `cursor` and `scroll`, so the marker never reaches the state file. **Self-review fix with the same cause:** `onFileLoaded` now touches recents for a navigation wait; restored windows still do not. Before this, a file first opened by `gd` or `<C-o>` never entered recents. **Proof:** `src/core/state/jumps.test.ts` "jumping back to a file that cannot be read shows why, not a session notice" (`cannot read file — not opened (gone.md)`, level `error`, no toasts, `restore` cleared) and the extended "jumping back to a file that is not open…" (recent `["a.md", "b.md"]`). `src/core/state/session.test.ts` "a window waiting for a jump target saves without the wait marker". The V28 session tests are unchanged and pass (8 pass). | `80005b4` (`P2-G2-T1`, `P2-G2-T2`) | `Fixed` |
| `P2-G2-VER4` | **Change:** `src/app/index-host.ts:createIndexHost` keeps `searching`, the ids posted to the current worker and not yet answered. A `results` message removes its id. On a crash or exit (`crashed`), every unanswered id is answered with an empty `searchResults` after `indexFailed`, before any restart. This covers grep and the mentions search. `stop()` (app shutdown) dispatches nothing, because no state consumer remains. **Proof:** `test/integration/index-host.test.ts` "a search in flight when the worker crashes is answered once": the first worker drops `search` messages, and the test waits for the posted `search` effect, terminates the worker, and observes exactly `[{ type: "searchResults", id, hits: [], capped: false }]` with `picker.search.pending === false`. It fails with the source reverted (1 fail). It passed 3 runs in a row → 5 pass each. | `4549967` (`P2-G2-T4`) | `Fixed` |
| `P2-G2-VER5` | **Change (unlinked hits, as designed):** `src/core/state/picker.ts:backlinkCandidates` lists `backlinksOf(arg)` and then the unlinked hits, with detail `unlinked mention` and `total` over both lists. The new `src/core/state/side-panel.ts:openBacklinksPicker` serves `link.backlinks` below 100 columns and `search.backlinks`. It opens the picker and calls `requestMentions`. `onMentionResults` calls the new `refreshPicker`, which re-lists the open picker and keeps its query. The unlinked filter moved to the new `src/core/state/mentions.ts:unlinkedHits` and is shared with `sidePanelRows`. **Change (resize):** `src/core/state/update.ts:onResize` → `picker.ts:onPickerResize` requests or drops the preview when cols cross `PREVIEW_MIN_COLS`. **Proof:** `src/core/state/picker.test.ts` "a resize across 100 columns shows or drops the open picker's preview" (99 → 120 emits exactly one `readPreview`; 120 → 130 emits nothing; → 99 drops the preview) and "the backlinks picker lists linking notes, then unlinked mentions" (at 80 and 120 columns: `a.md:1`, then `b.md:1` `unlinked mention`; a hit inside `[[plan]]` is dropped; `total` 2). `bun test src/core/state/picker.test.ts` → 11 pass. | `33f85bf` (`P2-G2-T4`, `P2-G2-T6`) | `Fixed` |
| `P2-G2-VER6` | **Change:** `test/integration/session.test.ts` run 1 starts the real index (`index: {}`) and waits for `ready`. In the second split it moves to `[[c]]` in `b.md` (`Gkw`) and follows it with `gd`, then waits until `c.md` is active. Run 2 asserts windows `a.md` (3,0) and `c.md` (0,0), recent `["c.md", "b.md", "a.md"]`, and jumps `{ entries: [a.md:3:0, b.md:0:0, b.md:2:3], at: 3 }`, where `b.md:2:3` is the follow's source. **Proof:** `bun test test/integration/session.test.ts` → 2 pass, 5 runs in a row. | `dddab1c` (`P2-G2-T2`) | `Fixed` |

### Remediation Deviations

These are decisions a fresh remediator or the orchestrator must preserve or accept.

1. **`LinkRef.context?: string`** (VER2) is an optional field the design section 7 `LinkRef` shape does not list. The design expected `raw` to serve as the backlinks context, which the parent requirement and M4 S6 contradict. The field is filled only where the source text is already in hand: the worker, written notes, and saved buffers. It is capped at 160 characters to keep long paragraph lines out of the index. **Impact:** an additive optional field in the worker summary protocol; the index stays in memory only. Report it for Work design synchronization.
2. **`windows.restore.pending[*].navigated?: true`** (VER3) is an optional sub-field of the designed `types.ts` shape. The design routes jump waits through `windows.restore` (section 7 `jumps.ts`), and that shape cannot otherwise tell a navigation wait from a session-restore wait. **Impact:** an additive optional field; it is never persisted. Report it for Work design synchronization.
3. **New module `src/core/state/mentions.ts`** (`unlinkedHits`, `hitRange`) is shared by the panel and the picker. It avoids an import cycle, because `side-panel.ts` already imports `picker.ts`.
4. **Backlinks picker rows:** unlinked rows read `path:line` with detail `unlinked mention`, and Enter opens the line. Linking a mention stays a panel action (`l`), because the picker uses letters for its query.
5. **Which-key hand-back** is decided by the popup's scope mode, not `s.vim.mode`. The explorer keeps the notice for every unbound key.
6. **V27 recorder** was not re-run. No remediation commit touches the engine, `test/vim/cases.ts`, or `expected.json`, and `bun test test/vim` passes (297).

### Remediation Self-Review

I reviewed the complete remediation diff `3ce604a..aec8689` (26 files, +555/−135). For the group diff `d1f8f67..8a358ce`, I re-read the files each finding touches: `keys.ts`, `whichkey.ts`, `jumps.ts`, `session.ts`, `buffers.ts`, `picker.ts`, `side-panel.ts`, `update.ts`, `index-host.ts`, `summarize.ts`, and `index.ts`. The review found two issues, both fixed and committed. First, the which-key hand-back used `s.vim.mode`, which would have dropped the explorer notice (`aec8689`). Second, navigation loads skipped recents (`80005b4`). Searching the added lines of `src`, `test`, and `scripts` for work-process identifiers finds 0 matches.

### Remediation Group Verification

- `bun run check` → `Passed` — exit 0 in 3 s; biome checked 187 files; `tsc` and knip are clean; 620 pass, 0 fail.
- `bun test src test/vim` → `Passed` — 614 pass, 0 fail.
- `bun run test:ci` → `Passed` — 115 pass, 0 fail, 25 snapshots on each of 5 runs (3 after `dddab1c` and 2 on `aec8689`).
- `bun run build` → `Passed` — exit 0; `dist/so` compiled with the index worker.
- `bun test test/e2e/binary-index.test.ts` → `Passed` — 1 pass.
- Verification report → unchanged (`git diff --quiet 3ce604a HEAD` on the file).
- Uncommitted group changes → None. `w261003fx70-goal.md` holds only the orchestrator edit, which was never staged.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — every verification finding is fixed and committed, and every group check passes on `aec8689`.
- **Final report commit:** returned to the orchestrator
- **Final commits:** `dac97f9`, `d54b648`, `78f7ae4`, `6e033f9`, `cc57d9f`, `6b53486`, `46b4384`, `e2c0ed3`, `8a358ce`; remediation `af2d40c`, `0821c58`, `80005b4`, `4549967`, `33f85bf`, `dddab1c`, `aec8689`
- **Final checks:** `bun run check` exit 0 (3 s, 620 pass); `bun test src test/vim` 614 pass; `bun run test:ci` 115 pass ×5; `bun run build` exit 0; `bun test test/e2e/binary-index.test.ts` 1 pass
- **Remaining issues:** two optional shape additions need orchestrator acceptance and design synchronization: `LinkRef.context?` and `windows.restore.pending[*].navigated?` (Remediation Deviations 1–2). The verification report's unverified items still stand: concurrent state-file saves, and picker items not refreshing on a later `indexBatch`.
