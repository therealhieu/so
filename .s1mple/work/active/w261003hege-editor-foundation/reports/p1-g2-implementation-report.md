# P1-G2 Implementation Report

## Scope

- **Goal:** `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-goal.md`
- **Plan Part:** `.s1mple/work/active/w261003hege-editor-foundation/w261003hege-plan-1-toolchain-and-kernel.md`
- **Group:** `P1-G2` — Kernel, File Types, and Recorded Vim Table
- **Tasks:** `P1-G2-T1`, `P1-G2-T2`, `P1-G2-T3`, `P1-G2-T4`, `P1-G2-T5`, `P1-G2-T6`
- **Report:** `.s1mple/work/active/w261003hege-editor-foundation/reports/p1-g2-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G2-T1` | `src/core/kernel/text/{pos,text-buffer}.ts`: `Pos`, `Range`, `Edit`, `TextBuffer`, `createTextBuffer`. `src/core/kernel/editor/undo.ts`: `UndoBlock`, `UndoHistory`. `src/core/kernel/editor/registers.ts`: `RegisterName`, `Register`, `Registers`. `src/core/kernel/editor/windows.ts`: `WindowTree`, `splitWindow`, `closeWindow`, `focusDirection`. `src/core/kernel/vim/keys.ts`: `Key`, `splitKeys`. Tests are in `text-buffer.test.ts` and `windows.test.ts`. | `bun test src/core/kernel` → 8 pass (at T1). Boundaries, biome, and tsc pass. | `cf6bff4` | `Completed` |
| `P1-G2-T2` | `src/core/kernel/commands/registry.ts`: `CommandRegistry`. `src/core/kernel/commands/keymap.ts`: `Mode`, `KeyScope`, `WhichKeyItem`, `Keymap`. `src/core/kernel/commands/defaults.ts`: `defaultBindings`. | tsc and `bun test test/boundaries.test.ts` pass. Keymap lookup, prefix, and which-key behavior were checked with a scratchpad script that was not committed, because the plan's T2 file list has no test file. | `2ba5137` | `Completed` |
| `P1-G2-T3` | `scripts/record-vim.ts` drives Neovim over RPC: version guard, `-n`, readiness loop, and `redraw` before keys. Also adds `scripts/record-vim.test.ts`, `test/vim/cases.ts` (279 cases), and `test/vim/expected.json` (`nvim: "0.11.7"`). | `NVIM=<scratchpad>/nvim-macos-arm64/bin/nvim bun run record:vim` → "recorded 279 cases with Neovim 0.11.7". `nvim --version` → `NVIM v0.11.7` (official macOS arm64 release in the session scratchpad; the system 0.12.4 install was not changed). Three runs gave identical output. `bun test scripts/record-vim.test.ts` → pass: the stub, the real 0.12.4, and a missing binary all exit 1. In the follow-up, `git diff` of `expected.json` changed only the 3 edited cases and `recordedAt`. | `b1cfdc3`; follow-up `36bc56e` changes three cases to targets that actually test their behavior: `f-missing` `fz`→`fq` and `df-missing` `dfz`→`dfq` (`baz` contains `z`), and `multiline-delete-numbered` `d2w`→`d3w` (`d2w` never crossed a line). Both were then re-recorded with 0.11.7. | `Completed` |
| `P1-G2-T4` | Files under `src/core/kernel/vim/`: `types.ts` (`VimState`, `BufferVim`, `VimEnv`, `VimEffect` with `paste`, `LastChange`, `SearchState`); `parser.ts` (`parseKeys`, `ParsedCommand`); `motions.ts` (`motions` table); `text-objects.ts` (`textObjects` table); `operators.ts` (`operators` table, `Run`, `applyEdit`, `VimSession`); `search.ts` (`searchPattern`, `findMatch`); `ex.ts` (`parseEx`, `exCompletions`); `engine.ts` (`handleKey`). Test: `test/vim/vim.test.ts`. | RED: `bun test test/vim` → 1 error (engine module missing). GREEN: `bun test test/vim` → 276 pass, 4 todo (the ex cases `:s` and `:%s`, via `test.todo`), 0 fail. `bun test test/vim -t "recording metadata matches cases"` → pass. Biome, tsc, and boundaries pass. | `76f2814` | `Completed` |
| `P1-G2-T5` | Files under `src/core/kernel/view/`: `types.ts` (`StyleToken`, `Span`, `Sign`, `LineRange`, `Widget`, `TextView`, `RenderLine`, `Highlighter`); `decorations.ts` (`Decoration`, `DecorationProvider`); `text-view.ts` (`layoutText`); `marks.ts` (`highlightMarks`, `searchMarks`, `selectionMarks`); `text-view.test.ts`. `search.ts` exports `matchesInLine` again for `searchMarks`. | RED: `bun test src/core/kernel/view` → 1 error (modules missing). GREEN: 11 pass, 0 fail. Biome, tsc, and boundaries pass. | `ed29491` | `Completed` |
| `P1-G2-T6` | `src/core/filetypes/registry.ts`: `EditorKind`, `ViewSpec`, `EditorKindSpec`, `EditorKindRegistry`, `FileType`, `FileTypeRegistry`, `textFileType`. `src/core/lang/code/file-types.ts`: `CODE_LANGUAGES` (34), `codeFileTypes`. `src/core/lang/code/highlight.ts`: `lowlightHighlighter`, with the internal `HLJS_TOKENS`. `src/core/lang/markdown/file-type.ts`: `markdownFileType`. Tests: `registry.test.ts`, `file-types.test.ts`, `highlight.test.ts`. | RED: `bun test src/core/filetypes src/core/lang` → 3 errors (modules missing). GREEN: 11 pass, 0 fail. Biome and tsc pass. `bun test test/boundaries.test.ts` → 2 pass (only `lang/code` imports `lowlight`). | `a17718b` | `Completed` |

Verification case → test mapping (tests are named by behavior, per the no-process-ID rule):

| Case | Test file → test name | Command |
|---|---|---|
| V2.1 (non-ex) | `test/vim/vim.test.ts` → `matches Neovim: <case id>` (276 cases; 4 ex cases are `test.todo` for P2-G1-T5) | `bun test test/vim` |
| V2.2 | `test/vim/vim.test.ts` → `recording metadata matches cases` | `bun test test/vim -t "recording metadata matches cases"` |
| V2.3 | `scripts/record-vim.test.ts` → `recorder refuses Neovim 0.12` | `bun test scripts/record-vim.test.ts` |
| V2.4 | `src/core/kernel/text/text-buffer.test.ts` → `<kind> round-trip` (multi-line, empty, surrogate pair, …) | `bun test src/core/kernel/text` |
| V6.1 | `src/core/filetypes/registry.test.ts` → `forPath matches extension, then file name, then falls back to text` (all eight paths), plus `forPath ignores extension case and directories`, `duplicate id, extension, or file name throws`, `editor kinds register once` | `bun test src/core/filetypes` |
| V6.2 | `src/core/lang/code/file-types.test.ts` → `language table covers the bundled grammars`, `every file type registers without a clash` | `bun test src/core/lang/code/file-types.test.ts` |
| V6.3 | `src/core/lang/code/highlight.test.ts` → `highlights only the requested lines`, `look-back carries state from above the window`, `highlight marks use code tokens for the visible lines`, `the same buffer is highlighted once`, `an unknown grammar yields no marks` | `bun test src/core/lang/code/highlight.test.ts` |
| V7.4 | `src/core/kernel/view/text-view.test.ts` → `no providers lays out raw lines`, `mark styles a range and keeps span offsets equal to source columns`, `later providers win where marks overlap`, `inline replace hides text and inserts its spans`, `block replace swaps whole lines for a widget row`, `block widget inserts rows below its line`, `widget rows count toward the visible rows`, `line decoration sets the line style and sign`, `viewport only`, `a failing highlighter yields no marks`, `search and selection marks cover visible lines only` | `bun test src/core/kernel/view` |
| V7.1 / V7.2 | `test/boundaries.test.ts` → `src respects LAYER_RULES`, `violation fixtures are reported` | `bun test test/boundaries.test.ts` |

### Group Change Range

- **Starting commit:** `0285acddae6a62e81db06b774743c20e9f51768b` (clean tree)
- **Final commit:** `a17718b`
- **Remaining group changes:** None

### Group Verification

- `bun test src test/vim scripts/record-vim.test.ts` → `Passed`: 311 pass (4 todo), 0 fail, 8 files.
- `bun test test/boundaries.test.ts` → `Passed`: 2 pass, 0 fail.
- `bunx biome check .` → `Passed`: 43 files, no findings.
- Process-ID scan (no work-process IDs in code), `grep -rnE '\b(REQ|DES)[0-9]+|\bV[0-9]+\.[0-9]+\b|\bP[0-9]-G[0-9]|W26[0-9]|RM26[0-9]' src test scripts` → `Passed`: no matches (exit 1).
- Self-review of `git diff 0285acd..a17718b` → no issues needing a follow-up commit. Stray exports and unused helpers were removed before the T4 commit.
- `bun --bun run tsc --noEmit -p .` → `Passed`: exit 0.
- `bun run check` → `Failed` (expected under the interim knip rule): biome and tsc pass, but knip exits 1 with the findings below. The unit-test stage after knip, run directly as `bun test src test/boundaries.test.ts test/repo.test.ts test/vim`, gives 315 tests: 0 fail, 4 todo.

Interim knip findings (each has a consumer in a later group):

| Finding | Kind | G1 symbol | Later consumer |
|---|---|---|---|
| `src/core/kernel/commands/registry.ts` | unused file | yes (`CommandRegistry`) | `core/state` keys and `app/main` (Part 2/3) |
| `Keymap`, `KeyScope`, `WhichKeyItem` (`keymap.ts`) | unused export and types | yes (`Keymap` + `KeyScope`) | `core/state` key dispatch, which-key UI |
| `ViewSpec` (`filetypes/registry.ts`) | unused exported type | yes (part of the `FileTypeRegistry`/`FileType` contract) | Markdown live and reading views, `core/state` view input |
| `src/core/kernel/commands/defaults.ts` | unused file | **no** (`defaultBindings`) | `app/main` / `core/state` keymap wiring (Part 2) |
| `src/core/kernel/vim/ex.ts` | unused file | **no** (`parseEx`, `exCompletions`) | `core/state` ex execution and cmdline completion (P2-G1-T5) |
| `@opentui/core`, `zod`, `ignore`, `@xterm/headless` | unused dependencies | n/a (accepted in P1-G1) | UI, config, workspace, UI tests (Parts 2–3) |

### Deviations and Remaining Issues

1. **Interim knip rule exceeded by two non-G1 files.** `defaults.ts` and `ex.ts` are plan-listed kernel outputs whose only consumers are Part 2 groups. Wiring them early, or adding tests only to satisfy knip, would be speculative, so they stay listed above. The orchestrator should accept them or direct otherwise.
2. **Kernel shapes extended beyond the design text.** A remediator must preserve these, because the recorded Neovim behavior depends on them:
   - `VimState` drops `count?`/`register?` (they are parsed per command) and adds `insert` (an Insert session), `lastFind`, and `wantCol`.
   - Visual linewise is the mode `"visualLine"`.
   - `VimEnv` is `{ topLine, rows }`.
   - `LastChange` carries `keys` (without the count), `count?`, and `visual?` (the selection size, so `.` can rebuild the selection).
   - `InsertSession` is internal to `types.ts`.
3. **Other kernel shape details:**
   - `TextObject` returns `Range & { linewise?: true }`.
   - `Registers` adds `isName` and `entries`. `UndoBlock` stores `inverses` and has no `cursorAfter`.
   - `ExCommand` is a union with a `substitute` variant (`:s` and `:%s`, parsed here, executed by `core/state`).
   - `searchPattern` returns `RegExp | undefined`. Surfacing `E486: Pattern not found` is left to `core/state` (P2).
   - `keys.ts` adds `splitKeys`. `<leader>` maps to space.
   - Window command ids are `window.focush/j/k/l`. Explorer default bindings add `explorer.down/up/collapse` (UI design line 825).
4. **Engine semantics taken from the recording:**
   - Undo returns the cursor to where the operated text starts, as Vim's `u_save` does: `visual-undo`.
   - A delete with `{ } n N * #` also writes `"1`. A delete with `%` does not: `d-percent` recorded no `"1`.
   - An exclusive motion that ends in column 0 of a later line ends on the line before. It becomes linewise when it starts inside the indent, as Vim's `exclusive-linewise` rule does: `di{` across lines.
   - `Y` is `y$` (a Neovim default).
   - Counted `O` stacks the repeats below the first new line.
   - `paste` is emitted only for `"+`. Every other register is applied inside the engine.
5. **Recorder.** The `"+` register is excluded from cases. The recorder does not clear registers, because each case runs in a fresh process. The Neovim binary is not committed. Recording needs `NVIM=<path to 0.11.x>`.
6. **Text view interpretations (the parent gives shapes, not layout rules):**
   - A span is `{ text, style, link? }` with no column field. Text outside `replace` decorations is copied verbatim, so a span's offset is its source column, which is the cursor ↔ column invariant.
   - Unstyled text uses the style `"text"`.
   - Where providers overlap, the later one wins.
   - A block widget goes above its line at column 0 and below it otherwise.
   - A block `replace` without spans or a widget hides its lines.
   - `folds` lists hidden source lines.
   - Output stops after `v.rows` rows. A widget-only row counts as `widget.rows` rows.
7. **The language table includes `markdown`.** `CODE_LANGUAGES` has 34 entries: the 37 `common` grammars minus `shell`, `python-repl`, and `plaintext`. `codeFileTypes` skips `markdown` because `lang/markdown/file-type.ts` registers it, which avoids a duplicate id and a duplicate `.md`. Together the 33 code file types and `markdownFileType` cover all 34 grammars; `file-types.test.ts` checks this.
8. **Highlighter cache.** The highlighter returns the same cached array for the same buffer and range, which is what the plan's "same array" check requires. A range inside the cached one returns a slice. `HLJS_TOKENS` is module-private because it has no outside consumer.
9. **No T2 unit test file.** The plan lists no test file for T2, so its behavior was checked with an uncommitted scratchpad script. P2 key dispatch tests will cover it end to end.
10. **Ex cases.** `ex-substitute-*` are `test.todo` in `test/vim/vim.test.ts`, which P2-G1-T5 will replay through `createUpdate`.

## Remediation

All three findings are fixed in three follow-up commits on top of `a17718b`. The verification report (`Failed`) is unchanged.

- **Verification reports:** `.s1mple/work/active/w261003hege-editor-foundation/reports/p1-g2-verification-report.md` (commit `4f078dd`)
- **Status:** `Completed`

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P1-G2-VER1` | **Root cause:** `beginInsert` stored `cursorBefore: run.before`, the cursor before `A`/`a`/`I` moved it. **Change:** `src/core/kernel/vim/engine.ts` `beginInsert` now uses `run.s.cursor`, the insertion point, when the session has no edit yet. Sessions that already edited (`o`, `O`, `c…`) keep `run.before`, so their recorded cases still pass. **Cases:** `test/vim/cases.ts` adds 10 cases: `undo-append-end` (`A!<Esc>u`), `redo-append-end` (`A!<Esc>u<C-r>`), `redo-append-end-after-move` (`A!<Esc>u0<C-r>`), `redo-append-end-two-chars` (`A!!<Esc>u0<C-r>` at (1,2)), `undo-append` (`aZ<Esc>u`), `redo-append` (`aZ<Esc>u0<C-r>`), `undo-insert-at-indent` (`IZ<Esc>u`), `redo-insert-at-indent` (`IZ<Esc>u$<C-r>` on `"   foo bar"`), `redo-append-end-after-dot` (`A!<Esc>j.uu<C-r>`), and `undo-dot-append-end` (`A!<Esc>j0.u`). These cover all 7 probe sequences in the verification report. **Proof:** `NVIM=<scratchpad>/nvim-macos-arm64/bin/nvim bun run record:vim` (`NVIM v0.11.7`, the official macOS arm64 release; the system 0.12.4 binary was not used, and no binary was committed) → "recorded 289 cases with Neovim 0.11.7". In the `expected.json` diff, the only removed line is the old `recordedAt`, and the only added `id`s are the 10 new cases. A script compared all 279 previous cases with their re-recorded entries and found them byte-equal (`old cases unchanged: true 279 289 0.11.7`). Before the fix, `bun test test/vim` gave 276 pass, 10 fail (all new cases); after it, 286 pass, 4 todo, 0 fail. | `bdc03cb` | `Fixed` |
| `P1-G2-VER2` | **Change:** `src/core/kernel/view/text-view.ts` `layoutText` matches a block `replace` on every line it covers (`range.start.line <= line <= range.end.line`), not only on its start line. A block that starts above `visible.from` therefore hides its covered visible lines and emits its row or widget once, at the first visible covered line (`sourceLine` stays inside the viewport). Widget rows still count against `v.rows`. `layoutLine` hides an inline `replace` on every line it covers and inserts its spans or widget once, on the range's start line. **Tests:** `src/core/kernel/view/text-view.test.ts` adds `block replace that starts above the viewport hides its visible lines` (the verifier's probe buffer, `visible {2,5}` → widget row at line 2, then `b`; no raw `\| - \|` or `\| r \|`) and `inline replace across a line break hides both parts`. Before the fix: 11 pass, 2 fail. After: `bun test src/core/kernel/view` → 13 pass, 0 fail. **Contract note:** the widget is emitted whole. Neither the parent design nor DES7 defines what `TextView.topRow` means, so `layoutText` does not clip a widget's rows that scroll above the window. That clipping belongs to whoever defines `topRow`'s scroll semantics (`EditorView` scroll math, DI3). | `0723afc` | `Fixed` |
| `P1-G2-VER3` | **Carrier:** the fixed `VimEffect` contract has no message variant. Its existing `search{pattern, dir}` effect, which the engine emits on success and on failure, carries the pattern to `core/state`. **Change:** `src/core/kernel/vim/search.ts` adds `searchError(buf, pattern)`, the kernel-side producer of the planned `search.ts` E486 text. It returns `E486: Pattern not found: <pattern>` for an invalid pattern or a pattern with no match in the buffer, and `undefined` otherwise. It reuses `searchPattern` and `findMatch` and adds no `VimEffect` variant. **Test:** `test/vim/vim.test.ts` → `a failed search reports E486 for its pattern` drives `handleKey` through `/dog<CR>`, `/\(<CR>`, and `/cat<CR>`, takes the emitted `search` effect, and asserts `E486: Pattern not found: dog`, `E486: Pattern not found: \(` (cursor unchanged in both), and `undefined` with the cursor at (0,4). It failed before the export existed (1 error) and now passes. **Handoff (written down):** displaying the message is `P2-G1-T5 — Route keys, ex commands, clipboard paste, and status`, whose `applyVimEffects` consumes `VimEffect`s. It must map `search` → `searchError(text, pattern)` → message line (`level: "error"`), proved in `src/core/state/keys.test.ts`. The Part 2 plan does not yet name this, so the orchestrator must add it to that task. | `8ffe88b` | `Fixed` |

**Completion checklists:**

- `P1-G2-VER1`:
  - [x] Required resolution is implemented.
  - [x] Required proof passes.
  - [x] Change evidence is recorded.
  - [x] Verification evidence is recorded.
- `P1-G2-VER2`:
  - [x] Required resolution is implemented. Widget clipping by `topRow` is recorded above as a contract note.
  - [x] Required proof passes.
  - [x] Change evidence is recorded.
  - [x] Verification evidence is recorded.
- `P1-G2-VER3`:
  - [x] Required resolution is implemented: a kernel producer and a written handoff to `P2-G1-T5`.
  - [x] Required proof passes.
  - [x] Change evidence is recorded.
  - [x] Verification evidence is recorded.

**Remediation notes:**

- Commit `bdc03cb` also changes `test/vim/cases.ts` and `test/vim/expected.json`, which are `P1-G2-T3` files. Its body names only `Task: P1-G2-T4`. History was not amended, as the rules require.
- Self-review covered the full group diff `0285acd..HEAD`, with close attention to the three remediation diffs. One `undoRedo` path serves both undo and redo, so the `cursorBefore` change covers both. The `layoutText` loop still skips to `range.end.line` after a block, so no block is emitted twice. No issue needed a further commit.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed`. All three verification findings are fixed and committed, and every group check passes. As before, knip still fails under the interim rule (see deviation 1).
- **Final report commit:** returned to the orchestrator.
- **Final commits:** `cf6bff4`, `2ba5137`, `b1cfdc3`, `36bc56e`, `76f2814`, `ed29491`, `a17718b`; remediation `bdc03cb`, `0723afc`, `8ffe88b`
- **Final checks** (Bun `1.4.2`):
  - `bun test src test/vim scripts/record-vim.test.ts test/boundaries.test.ts` → 322 pass, 4 todo, 0 fail (326 tests, 9 files).
  - `bun test test/vim` → 287 pass, 4 todo, 0 fail (289 recorded cases plus metadata and E486).
  - `bunx biome check .` → 43 files, no fixes applied.
  - `bun --bun run tsc --noEmit -p .` → exit 0.
  - `bun run check` → biome and tsc pass. knip exits 1 with exactly the earlier interim findings: unused files `defaults.ts`, `registry.ts`, `ex.ts`; exports `Keymap`, `ViewSpec`, `KeyScope`, `WhichKeyItem`; the accepted dependencies. `searchError` is not reported. The unit stage, run directly as `bun test src test/boundaries.test.ts test/repo.test.ts test/vim`, gives 0 fail and 4 todo (328 tests).
  - The process-ID scan over `src test scripts` (`*.ts`), using the verifier's patterns plus `VER[0-9]` and `task|goal|roadmap`, finds no match.
- **Remaining issues:**
  - The knip findings for `defaults.ts` and `ex.ts` (deviation 1) remain.
  - The orchestrator must add the E486 message display to `P2-G1-T5`.
  - Widget clipping by `topRow` waits for `topRow` scroll semantics.
