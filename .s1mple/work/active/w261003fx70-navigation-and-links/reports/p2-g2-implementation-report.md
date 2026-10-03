# P2-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-plan-2-runtime-index-navigation-ui.md`
- **Group:** `P2-G2` — Navigation, session, discovery, and link UI
- **Tasks:** `P2-G2-T1`, `P2-G2-T2`, `P2-G2-T3`, `P2-G2-T4`, `P2-G2-T5`, `P2-G2-T6`, `P2-G2-T7`
- **Report:** `.s1mple/work/active/w261003fx70-navigation-and-links/reports/p2-g2-implementation-report.md`

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
- **Remaining group changes:** None. `.s1mple/work/active/w261003fx70-navigation-and-links/w261003fx70-goal.md` has an orchestrator modification that predates this group and was never staged.

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

- **Verification reports:** None yet
- **Status:** `Not required`

### Finding Closure

None

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — every task is implemented and committed, and every group check passes.
- **Final report commit:** returned to the orchestrator
- **Final commits:** `dac97f9`, `d54b648`, `78f7ae4`, `6e033f9`, `cc57d9f`, `6b53486`, `46b4384`, `e2c0ed3`, `8a358ce`
- **Final checks:** `bun run check` exit 0 (3 s); `bun test src test/vim` 604 pass; `bun run test:ci` 113 pass ×5; `bun run build` exit 0; `bun test test/e2e/binary-index.test.ts` 1 pass
- **Remaining issues:** the items listed under Deviations and Remaining Issues
