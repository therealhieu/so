# P1-G2 Verification Report

## Scope

- **Group:** `P1-G2`
- **Tasks:** `P1-G2-T1, P1-G2-T2, P1-G2-T3, P1-G2-T4, P1-G2-T5, P1-G2-T6`
- **Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p1-g2-verification-report.md`
- **Implementation Report:** `.s1mple/work/done/w261003hege-editor-foundation/reports/p1-g2-implementation-report.md` (commit `074f392`)

Verified range: `0285acd..a17718b` on `feat/rm261003abzp-di1-editor-foundation`. The group commits are `cf6bff4`, `2ba5137`, `b1cfdc3`, `36bc56e`, `76f2814`, `ed29491`, and `a17718b`. Commits `074f392` (implementation report) and `78b814f` (orchestrator goal update) touch only `.s1mple/` and are not group work. The working tree was clean at the start of verification, and Bun is `1.4.2`.

## Status

`Failed`

Every assigned check passes, every non-ex recorded case replays equal, and an independent re-recording with Neovim 0.11.7 reproduces `expected.json` exactly. The group still fails because the engine's undo and redo cursor diverges from Neovim 0.11.7 after Insert sessions entered with `A`, `a`, or `I` (`P1-G2-VER1`, Major). The recorded case set does not cover that path. Two Minor findings follow: `layoutText` shows the hidden lines of a block `replace` that starts above the viewport (`P1-G2-VER2`), and the planned `E486` search failure has no producer and no later owner (`P1-G2-VER3`).

## Assigned Traceability

- **System Design:** `REQ1@R3, REQ3@R1 → DES3 → S2 → V2.1 (non-ex), V2.2, V2.3, V2.4`; `REQ1@R3, REQ10@R2 → DES3, DES13 (explorer default bindings) → S7 → V7.5 (contract only; proved in P2-G1-T5)`; `REQ1@R3 → DES7 → S7, S17 → V7.4`; `REQ11@R2 → DES6 → S6, S17 → V6.1, V6.2, V6.3`; `REQ1@R3 → DES3, DES6, DES7 → S7 → V7.1`. Roadmap: binding `w261003hege-discuss-context.md` Roadmap Binding (RM261003ABZP, PH1@R2, DI1@R2). Parent coverage rows in system design §1: "TextBuffer and undo" (RM261003ABZP-DES3@R1), "Table-driven vim engine" (DES4@R1), "Registry and keymap with `KeyScope`" (DES5@R2), "Kernel text view" (DES9@R3), "File types, highlighter, open policy" (DES17@R1), "Neovim-equal vim" (S2@R1 / V2@R1), and "Any text file opens safely" (S12@R1 / V18@R1, file-type part). Gate G1 is at `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`.
- **UI Design:** `None`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1@R3 → DES3 → S2 → V2.4` | `None` | `TextBuffer`/`createTextBuffer`, `Pos`/`Range`/`Edit` at parent shape (`rm261003abzp-design.md:537-542`); edits and inverses round-trip, including surrogates | `src/core/kernel/text/text-buffer.ts:7-13` matches the parent interface exactly (`version`, `lineCount`, `line`, `apply → {buffer, inverse}`, `slice`); `src/core/kernel/text/pos.ts`; `text-buffer.test.ts` `%s round-trip` (multi-line join, empty, empty insert, surrogate pair), `apply rejects a range outside the buffer` | `Satisfied` |
| `REQ1@R3 → DES3 → S2` (T1 primitives) | `None` | `UndoHistory` blocks with cursor; `Registers` `"`, `0-9`, `a-z`, `+`, `-`; `WindowTree` with `splitWindow`, `closeWindow`, `focusDirection` | `src/core/kernel/editor/undo.ts:7-11` (`cursorBefore`), `registers.ts:8` (`RegisterName`), `windows.ts:10,29,65`; `windows.test.ts`. The undo cursor is wrong for `A`/`a`/`I` sessions (`P1-G2-VER1`) | `Mismatch` |
| `REQ3@R1 → DES3 → S2 → V2.2, V2.3` | `None` | Recorder refuses non-0.11 Neovim; records over RPC with `--clean --headless --listen`; fixture records the version; recorder never runs in `check` or CI | `scripts/record-vim.ts` `assertNvim011`, `recordCase` (`nvim_input`, `blocking` wait, `json_encode`), `main`; `test/vim/expected.json` `nvim: "0.11.7"`, 279 cases; `scripts/record-vim.test.ts` `recorder refuses Neovim 0.12`; `package.json` `check` and `.github/workflows/*` never call `record:vim` | `Satisfied` |
| `REQ1@R3, REQ3@R1 → DES3 → S2 → V2.1` (non-ex) | `None` | Every non-ex recorded case replays equal through `handleKey`; ex cases (`:s`, `:%s`) are `test.todo` until P2-G1-T5; cases cover REQ2's command list | `test/vim/vim.test.ts` `matches Neovim: <id>`: 275 equal, 4 `ex-substitute-*` todo. `test/vim/cases.ts` covers every REQ2 motion (`h j k l w b e W B E 0 ^ $ gg G f F t T ; , % { } H M L <C-d> <C-u>`, counts), operator (`d c y > <`), text object (`iw aw iW aW i" a" i' a' i( a( i[ a[ i{ a{ ip ap`), `dd cc yy x X p P J r ~ o O A I`, registers `"`, `"0`–`"9`, `"a`–`"z`, `"-`, `u`, `<C-r>`, `.`, search `/ ? n N * #`, Visual char and line, and `:s`/`:%s`. `"+` is excluded by design (P2-G1). Undo/redo after `A`/`a`/`I` is not covered and diverges (`P1-G2-VER1`) | `Mismatch` |
| `REQ1@R3, REQ10@R2 → DES3, DES13 → S7 → V7.5` (contract) | `None` | `CommandRegistry`, `Command`, `Mode`, `KeyScope`, `Keymap` (`command`/`prefix`/`none`, `{mode, filetype}` before `{mode}`), `WhichKeyItem`, `defaultBindings` (`<leader>e`, `Ctrl-w h/j/k/l`, explorer `a r m d Enter l h`) | `src/core/kernel/commands/registry.ts` equals `rm261003abzp-design.md:493-510` (duplicate id throws); `keymap.ts:4,7,22` (`bind(scope, seq: string, id)`, `lookup`); `defaults.ts:7-29`. Ids match the `registerBuiltins` list in §7 (`window.focus{h,j,k,l}` → `window.focush` … `window.focusl`, `window.split`, `window.vsplit`, `explorer.*`) | `Satisfied` |
| `REQ1@R3 → DES7 → S7, S17 → V7.4` | `None` | `TextView`, `RenderLine`, `Span`, `StyleToken`, `Widget`, `Decoration`, `DecorationProvider`, `Highlighter`, `layoutText`, `highlightMarks`, `searchMarks`, `selectionMarks` at parent shape; all four decoration kinds lay out; providers see only viewport rows | `src/core/kernel/view/types.ts`, `decorations.ts` equal `rm261003abzp-design.md:607-620, 385`; `text-view.ts:18` `layoutText`; `marks.ts:19,42,59`; 11 tests in `text-view.test.ts`. A block `replace` that starts above `visible.from` leaves its hidden lines visible (`P1-G2-VER2`) | `Mismatch` |
| `REQ11@R2 → DES6 → S6, S17 → V6.1, V6.2, V6.3` | `None` | `FileTypeRegistry` (extension → file name → `text`; duplicates throw), `EditorKindRegistry`, `textFileType`, `CODE_LANGUAGES` (34), `codeFileTypes`, `lowlightHighlighter` (200-line look-back, `WeakMap<TextBuffer>` cache, failure → no marks), `markdownFileType` (source only) | `src/core/filetypes/registry.ts` equals `rm261003abzp-design.md:654-676` (plus the `fallback` constructor argument from the §5 wiring, `new FileTypeRegistry(textFileType)`); `src/core/lang/code/file-types.ts` 34 entries = lowlight `common` minus `shell`, `python-repl`, `plaintext`; `.sh`→`bash`, `.toml`→`ini`, `.html/.xml/.svg`→`xml`, `Makefile`/`GNUmakefile`/`.mk`→`makefile`; `highlight.ts` `LOOK_BACK = 200`, `WeakMap` cache; `marks.ts:24-28` catches highlighter errors; `src/core/lang/markdown/file-type.ts` equals the §7 shape | `Satisfied` |
| `REQ1@R3 → DES3, DES7, DES6 → S7 → V7.1` | `None` | Kernel imports only kernel; no language code in `core/kernel`; `lowlight` only under `core/lang/code` | `test/boundaries.test.ts` passes; no `markdown`, `lowlight`, `hljs`, or language identifier under `src/core/kernel`; every kernel import is relative within `src/core/kernel` | `Satisfied` |
| DES3 §7 search (`P1-G2-T4` GREEN) | `None` | Vim regex → `RegExp` (`\<`, `\>`, `\{n,m}`); an invalid pattern yields `E486: Pattern not found` | `src/core/kernel/vim/search.ts:28` `searchPattern` returns `undefined` on an invalid pattern; nothing in `src/` produces `E486`, `VimEffect` has no message variant, and no Part 2 or Part 3 task names `E486` (`P1-G2-VER3`) | `Mismatch` |
| DEV1 — no work-process identifiers in code | `None` | No Work/REQ/DES/S/V/phase/goal/task identifiers in comments, identifiers, test names, or log messages in `src/`, `test/`, `scripts/` | Test names are behavioral (`matches Neovim: <case id>`, `recording metadata matches cases`, `recorder refuses Neovim 0.12`, …). Two identifier scans over `src test scripts` (`\b(REQ\|DES\|RF\|UREQ\|UDES\|US\|UV)[0-9]+`, `\b[SV][0-9]+(\.[0-9]+)?\b`, `\bP[0-9]+-G[0-9]+`, `W26[0-9]`, `RM26`, `\bDI[0-9]`, `\bPH[0-9]\b`, `\bG1\b`, `phase [0-9]`, `part [0-9]`, `task`, `goal`, `roadmap`) found no match | `Satisfied` |
| Roadmap G1 (producer DI1, consumer DI2@R2) | `None` | `CommandRegistry`, `Keymap` with `KeyScope`, `layoutText`, `Decoration`, `FileTypeRegistry` (`text`, code, `markdown` source), and `lowlightHighlighter` exist at parent shapes with no contract change; G1 is not due within this goal | Shapes compared with `rm261003abzp-design.md:493-510, 607-620, 654-681`; all equal, apart from internal additions that do not change the contract (see Scope Changes). V7.4 and V6.1–V6.3 pass locally. `P1-G2-VER2` concerns `layoutText` behaviour, not its shape. Merge and CI evidence stay with P3-G1-T6 | `Satisfied` |

Roadmap baseline: `git log -- .s1mple/work/active/rm261003abzp-so-v1/` → only `d00d3a3`, so the parent files are unchanged and still the accepted baseline. `git diff --stat 0285acd..HEAD -- .s1mple` touches only the implementation report and the goal file. Parent synchronization stays pending with the main orchestrator. This verification wrote no parent file.

### Assessment of implementer deviations 2–5

Classes: (a) an internal detail the design leaves open; (b) a refinement forced by recorded Neovim behaviour; (c) a material change to a G1 or parent contract, or symbols beyond the design. No item is (c).

| Item | Class | Reason |
|---|---|---|
| `VimState` drops `count?`/`register?`; adds `insert`, `lastFind`, `wantCol` | (a)/(b) | `VimState` is not a G1 output, and the parent gives no field list. `lastFind` (`;` `,`), `wantCol` (`j-keeps-column`, `dollar-j-sticks-to-end`), and `insert` (one undo block per Insert session, `count-i`, `count-o`) are needed by recorded cases. Count and register are parsed per command |
| Mode `"visualLine"` | (b) | REQ2 requires Visual linewise; the parent `Mode` is open (`(string & {})`). P2-G1 key routing must treat it as a Visual mode |
| `VimEnv = { topLine, rows }` | (a) | The design names `VimEnv` without a shape; `H M L <C-d> <C-u>` need exactly these values |
| `LastChange { keys, count?, visual? }` | (b) | `dot-new-count`, `dot-keeps-count`, and `visual-dot` need the count and the Visual size |
| `ExCommand` union with `substitute` | (a) | §7 says `:s`/`:%s` are parsed in `ex.ts`; the plain variant keeps `{cmd, bang, arg}` |
| `searchPattern` returns `RegExp \| undefined` | (a) for the shape | The return type is internal. The missing `E486` behavior is reported separately as `P1-G2-VER3` |
| `Registers.isName`, `Registers.entries` | (a) | The design gives `Registers` no method list. `isName` is used by `parser.ts:93`, and `entries` only by `test/vim/vim.test.ts:50` |
| `TextObject` returns `Range & { linewise?: true }` | (a) | A compatible superset of the parent `Range \| null` (`ip`/`ap` are linewise) |
| `UndoBlock` has `inverses`, no `cursorAfter` | (a) | The plan preview mentions `cursorAfter`; the design says only "undo blocks with cursor" |
| Cross-file helper exports in `vim/{motions,operators,parser,search}.ts`, `keys.ts` `splitKeys`, `operators.ts` `VimSession` | (a) | They follow from the design's mandated file split. `VimSession` names the design's own `BufferVim & { vim: VimState }` parameter. knip reports none of them as unused |
| Command ids `window.focush/j/k/l` | (a) | The literal expansion of §7 `window.focus{h,j,k,l}` |
| Explorer `j`/`k` → `explorer.down/up`, `h` → `explorer.collapse` | (b) | Parent UI design state matrix (`rm261003abzp-ui-design.md:825`): `j/k`, `Enter`/`l`, `h` collapse. Without `j`/`k` bindings, explorer keys would reach the vim engine |
| Extra bindings `<C-w>s`, `<C-w>v`, explorer-mode `<leader>e` | (a) | They map to command ids that §7 `registerBuiltins` already defines (`window.split`, `window.vsplit`, `explorer.toggle`) and fall under "global vim/ex/window/explorer bindings". They add no symbol |
| Deviation 4: engine semantics taken from the recording | (b) | Every listed rule is pinned by a recorded case that passes. `P1-G2-VER1` is a further undo-cursor rule that the recording does not yet cover |
| Deviation 5: recorder does not clear registers | (b) | `--clean` starts each case in a fresh process without ShaDa. The independent re-recording matched |
| Deviation 6: layout rules | (a), except where noted | The parent fixes shapes, not layout rules. "Later provider wins", the `"text"` default style, widget placement, `folds` as hidden lines, and the row budget are reasonable and tested. The block-replace viewport case is reported as `P1-G2-VER2` |
| Deviation 7: 34-entry table includes `markdown`; `codeFileTypes` skips it | Consistent with REQ11 and DES6 | REQ11 counts 37 grammars minus 3 = 34 and requires `.md` → `markdown` with one `source` view. The design's `codeFileTypes = CODE_LANGUAGES.map(...)` would register `markdown` twice next to `markdownFileType`. Filtering it out resolves that inconsistency, and `file-types.test.ts` proves 33 + 1 = 34 with no clash |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V2.4` | `S2` | `DES3` | `bun test src/core/kernel/text` (within the group run) | 4 round-trip cases plus 2 apply tests pass; version + 2 and `lineCount ≥ 1` asserted | `Passed` |
| `V2.1` (non-ex) | `S2` | `DES3` | `bun test test/vim` | 276 pass (275 `matches Neovim: <id>` + metadata), 4 todo (`ex-substitute-line`, `-line-global`, `-all`, `-all-global`), 0 fail | `Passed` |
| `V2.1` independent re-recording | `S2` | `DES3` | Copied `scripts/record-vim.ts` and `test/vim/cases.ts` to the scratchpad; `NVIM=<scratchpad>/nvim-macos-arm64/bin/nvim` (`NVIM v0.11.7`) `bun scripts/record-vim.ts`; compared `cases` with the committed `expected.json` | "recorded 279 cases with Neovim 0.11.7"; the `cases` arrays are byte-equal after `JSON.stringify` (`true`). Nothing was committed | `Passed` |
| `V2.1` generalization probe (beyond the recorded set) | `S2` | `DES3` | 36 extra case runs (35 distinct key sequences) recorded with Neovim 0.11.7 in the scratchpad and replayed through `handleKey` with the same harness | 28 equal (`<j`, `ct(`, `ci"`, `dd` on a single line, `yi[P`, `ca{`, `dL`, `/two<CR>dw.`, `2cw` + `.`, `d2$`, `3~.`, `50%`, `ox<Esc>2.`, `i<BS><BS>`, redo after `x`/`dw`/`o`/`cw`/`p`/`J`/`r`/`>>`, …). 8 runs (7 distinct sequences) differ, all undo or redo cursors after `A`/`a`/`I` sessions (`P1-G2-VER1`) | `Failed` |
| `V2.2` | `S2` | `DES3` | `bun test test/vim -t "recording metadata matches cases"` | 1 pass, 2 `expect()` calls, 279 filtered out | `Passed` |
| `V2.3` | `S2` | `DES3` | `bun test scripts/record-vim.test.ts` (within the group run) | `recorder refuses Neovim 0.12` passes: stub `NVIM v0.12.4` → exit 1, stderr contains `requires Neovim 0.11.x` | `Passed` |
| `V6.1` | `S6` | `DES6` | `bun test src/core/filetypes` | 4 pass: all eight paths (`scripts/sync.ts`→typescript, `config.yaml`→yaml, `notes.txt`→text, `Makefile`→makefile, `a.md`→markdown with views `["source"]`, `run.sh`→bash, `pyproject.toml`→ini, `Dockerfile`→text), case and directory handling, duplicate throws, editor kinds | `Passed` |
| `V6.2` | `S6` | `DES6` | `bun test src/core/lang/code/file-types.test.ts` | 2 pass: 34 unique ids ⊂ `common`; the complement is exactly `plaintext`, `python-repl`, `shell`; all 33 code types plus `markdownFileType` register without a clash | `Passed` |
| `V6.3` | `S6, S17` | `DES6` | `bun test src/core/lang/code/highlight.test.ts` | 5 pass: lines 400–440 of 5,000 give `codeKeyword`/`codeString`/`codeComment`; look-back carries a block comment; same buffer → same array (`toBe`); edited buffer → new array; unknown grammar → `[]` | `Passed` |
| `V7.4` | `S7, S17` | `DES7` | `bun test src/core/kernel/view` | 11 pass, including `viewport only` (5,000 lines, `visible` 100–130 → highlighter and provider requests are exactly `{from:100,to:130}`). A block `replace` across the viewport top is not tested (`P1-G2-VER2`) | `Passed` |
| `V7.1` / `V7.2` | `S7` | `DES3, DES6, DES7, DES14` | `bun test test/boundaries.test.ts` (within the group run) | `src respects LAYER_RULES` and `violation fixtures are reported` pass | `Passed` |
| Kernel and file-type units (group check) | `S2, S6, S7` | `DES3, DES6, DES7` | `bun test src test/vim scripts/record-vim.test.ts test/boundaries.test.ts` | 309 pass, 4 todo, 0 fail, 1232 `expect()` calls, 313 tests across 9 files | `Passed` |
| Fast check (group check) | `S1` | `DES1` | `bun run check` | `biome check .` → "Checked 43 files … No fixes applied"; `tsc` exit 0 (the chain reached knip); knip exits 1 with the findings below. The unit stage, run directly as `bun test src test/boundaries.test.ts test/repo.test.ts test/vim`, gives 311 pass, 4 todo, 0 fail (315 tests) | `Passed` (interim knip rule) |
| Interim knip rule | `S1` | `DES1` | Compared knip output with plan index Cross-Part Coordination and the Part 2/3 plans | Unused files `commands/registry.ts` (G1, consumed by `main` and `keys.ts`), `commands/defaults.ts` (consumed by `main` per §5 wiring, P3-G1-T3, and V7.5 routing in P2-G1-T5), `vim/ex.ts` (`executeEx` and completion, P2-G1-T5). Unused exports: `Keymap` (G1); types `KeyScope` (G1), `WhichKeyItem` (part of the `Keymap.lookup` contract), `ViewSpec` (part of the `FileType` contract). Unused dependencies `@opentui/core`, `zod`, `ignore`, `@xterm/headless` were accepted in P1-G1. The configuration hint for `src/app/main.ts` is not a finding. Nothing else is reported, and every item has a later-group consumer | `Passed` |
| DEV1 identifier scan | `None` | `None` | `grep -rnE` (patterns above) over `src test scripts --include=*.ts` | No match | `Passed` |
| Recorder isolation | `S2` | `DES3` | `grep -rn record .github/workflows package.json` | Only `package.json` `record:vim`; neither `check` nor any workflow invokes Neovim | `Passed` |

## Findings

### P1-G2-VER1 — Major — Correctness — Undo and redo after `A`, `a`, or `I` put the cursor where Neovim does not

- **System Design:** `W261003HEGE-REQ1@R3`, `W261003HEGE-REQ3@R1`; `W261003HEGE-DES3`; `S2`; `V2.1`
- **UI Design:** `None`
- **Evidence:** Probe cases were recorded with Neovim 0.11.7 (scratchpad, `PROSE = ["foo bar baz", "one two three", "alpha beta gamma"]`) and replayed through `handleKey`:

  | Keys (start) | Neovim cursor | Engine cursor |
  |---|---|---|
  | `A!<Esc>u` (0,0) | (0,10) | (0,0) |
  | `A!<Esc>u<C-r>` (0,0) | (0,11) | (0,0) |
  | `A!<Esc>u0<C-r>` (0,0) | (0,11) | (0,0) |
  | `A!!<Esc>u0<C-r>` (1,2) | (1,13) | (1,2) |
  | `aZ<Esc>u0<C-r>` (0,4) | (0,5) | (0,4) |
  | `IZ<Esc>u$<C-r>` on `"   foo bar"` (0,8) | (0,3) | (0,8) |
  | `A!<Esc>j.uu<C-r>` (0,0) | (0,11) | (0,0) |

  Text and registers match in every case; only the cursor differs. Root cause: `src/core/kernel/vim/engine.ts:497-501` `beginInsert` stores `cursorBefore: run.before`, the cursor before `A`/`a`/`I` moved it, rather than the insertion point. `engine.ts:419-423` `undoRedo` then restores that position. The recorded set has no undo or redo after `A`, `a`, or `I` (`test/vim/cases.ts:267-298`; `undo-insert-session` uses `i`, whose insertion point equals the start cursor), so V2.1 passes.
- **Impact:** S2 requires every REQ2 command, including `u` and `<C-r>`, to produce Neovim's cursor. Appending with `A` and then undoing is everyday editing, and today it jumps the cursor to the column where the user started. G1 consumers inherit the engine through `handleKey`.
- **Required resolution:** Undo and redo of an Insert session put the cursor where Neovim 0.11.7 does for `A`, `a`, `I`, and their `.` repeats (at the start of the changed text, clamped in Normal mode). Add recorded cases for these paths to `test/vim/cases.ts` and re-record `expected.json` with Neovim 0.11.7.
- **Required proof:** `NVIM=<0.11.7> bun run record:vim` with new cases covering at least `A…<Esc>u`, `A…<Esc>u<C-r>`, `a…<Esc>u<C-r>`, `I…<Esc>u<C-r>`, and `A…<Esc>j.uu<C-r>`; the `expected.json` diff contains only the new cases and `recordedAt`; `bun test test/vim` passes with 0 fail.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G2-VER2 — Minor — Correctness — `layoutText` shows the hidden lines of a block `replace` that starts above the viewport

- **System Design:** `W261003HEGE-REQ1@R3`; `W261003HEGE-DES7`; `S7, S17`; `V7.4`
- **UI Design:** `None`
- **Evidence:** `src/core/kernel/view/text-view.ts:37-39` matches a block `replace` only when `d.range.start.line === line`, and the loop starts at `v.visible.from` (`:35`). Probe: buffer `["a","| t |","| - |","| r |","b"]` with a block `replace` over lines 1–3 (widget, 3 rows). With `visible {from: 0, to: 5}` the output is `a`, the widget row, `b` (correct). With `visible {from: 2, to: 5}` it is the raw rows `| - |`, `| r |`, `b`, so the lines the decoration hides are painted. Likewise, an inline `replace` whose range crosses a line break hides only its first line's part (`:107` skips lines other than `range.start.line`). `TextView.topRow` is never read, so a viewport that starts partway through a block's rows cannot be expressed. No test covers either case.
- **Impact:** DES7 ships every decoration kind now "so DI3 adds only providers", and the parent defines `replace` as hiding whole lines. A DI3 table or callout scrolled partly above the window would show its raw source under the rendered rows above it. Fixing that later means changing the frozen G1 `layoutText` behaviour. DI1 production emits only `mark`, so users are not affected today.
- **Required resolution:** A block `replace` whose range intersects the visible lines hides every covered visible line, whatever its start line. Its replacement row or widget is emitted once, positioned and clipped per the parent row model (`topRow`, widget rows counted in scroll math). An inline `replace` hides its range on each line it covers. If the orchestrator prefers to defer the multi-line inline case, record that limit as a documented contract note before DI3.
- **Required proof:** New `src/core/kernel/view/text-view.test.ts` cases: (1) a block `replace` starting above `visible.from` produces no raw rows for its covered lines; (2) an inline `replace` spanning two lines hides both parts. `bun test src/core/kernel/view` passes.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P1-G2-VER3 — Minor — Missing Behavior — The planned `E486: Pattern not found` has no producer and no later owner

- **System Design:** `W261003HEGE-REQ1@R3`; `W261003HEGE-DES3`; `S2`; `V2.1`
- **UI Design:** `None`
- **Evidence:** System design §7 (`w261003hege-system-design.md:1771`) says "an invalid pattern yields `E486: Pattern not found`", and plan task `P1-G2-T4` GREEN (`w261003hege-plan-1-toolchain-and-kernel.md:720`) assigns it to `search.ts`. In the code, `src/core/kernel/vim/search.ts:28-64` returns `undefined`, and `engine.ts:638-646` emits `{kind: "search"}` and leaves the cursor unchanged for both missing and invalid patterns. `grep -rn E486 src` finds nothing. The implementation report (deviation 3) defers the message to `core/state` (P2), but neither `w261003hege-plan-2-core-state-and-workspace.md` nor `w261003hege-plan-3-ui-shell-app-and-delivery.md` mentions `E486`, and `VimEffect` (fixed as "adds only `paste`") has no message variant to carry it.
- **Impact:** `/dog<CR>` and an invalid `/\(<CR>` fail silently, unlike Neovim's message line. The obligation could be lost between parts, because no later task is required to implement it.
- **Required resolution:** Either the engine path produces `E486: Pattern not found: <pattern>` for a failed or invalid search, within the fixed `VimEffect` contract (for example, `core/state` checks the `search` effect with the kernel's `searchPattern`/`findMatch`), or the orchestrator records an explicit owning task and test in Part 2 for the message. Whichever path is chosen, the handoff is written down and not implicit.
- **Required proof:** A unit test (kernel or `core/state`) asserting the `E486` text for a missing and an invalid pattern, or a plan or goal update naming the owning task and its verification.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:** Buffer apply and inverse at line joins, empty text, and surrogate pairs, plus range rejection. Window split, close, and focus (`windows.test.ts`). 275 Neovim-recorded cases for motions, counts, operators, text objects, registers (unnamed, numbered shift, small delete, named, count before register), undo/redo after deletes, `o`/`O`, `cw`, `J`, Visual, `.` repeat (counts, change, append, put, Visual), and search (`/ ? n N * #`, wrap, missing, count, `<Esc>`, `<BS>`, `\<…\>`, `\{n}`). Fixture metadata and the recorder version guard. Every decoration kind with synthetic providers, viewport-only provider requests, and highlighter failure. File-type resolution, table integrity, windowed highlighting, look-back, and cache identity.
- **Missing:** Undo and redo cursors after `A`, `a`, `I` sessions (`P1-G2-VER1`). A block `replace` intersecting the viewport top, and a multi-line inline `replace` (`P1-G2-VER2`). `E486` for missing and invalid patterns (`P1-G2-VER3`). `Keymap.lookup` precedence and `CommandRegistry.list` filtering have no unit test in this group. The plan defers that proof to V7.5 in P2-G1-T5, so it is not a finding here.

## Scope Changes

- Added bindings `<C-w>s` → `window.split`, `<C-w>v` → `window.vsplit`, and explorer-mode `<leader>e` → `explorer.toggle` (`src/core/kernel/commands/defaults.ts:17-18,28`). They are not listed in the design's binding examples but map to command ids that §7 `registerBuiltins` defines. Accepted as (a).
- Explorer `j`/`k`/`h` → `explorer.down`/`explorer.up`/`explorer.collapse` (`defaults.ts:19-20,23`) come from the parent UI design state matrix (`rm261003abzp-ui-design.md:825`). P2-G1 must register these ids, which the §7 `explorer.*` wildcard covers.
- `codeFileTypes` excludes `markdown` while `CODE_LANGUAGES` keeps all 34 grammars. This resolves the design's double registration (see deviation 7 above).
- `test/vim/expected.json` has 279 cases; the follow-up commit `36bc56e` changed three case inputs and re-recorded. The independent re-recording confirms the committed fixture.
- No other unplanned additions or omissions were found. Every planned file exists, and no later-DI file was added.

## Unverified Items

- Neovim equality for the 4 ex cases (`:s`, `:%s`) is planned for P2-G1-T5 (`test.todo`), and `"+` paste routing for P2-G1. Neither is in this group's scope.
- `V7.5` keymap precedence through routing is proved in P2-G1-T5, so this group verified only the contract shape and command ids.
- Keystroke and highlight budget (`V17.1`, S17) is not assigned to this group. Only the viewport-bound requests (V7.4, V6.3) were verified.

## Blockers

None
