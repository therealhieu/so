# W261005F2A7 Plan Part 1 — core

## Status

`Ready`

## Objective

Every Git decision exists in pure core and is proven by unit tests: hunks, index normalization, patches, status and blame parsing, sign decorations, the kernel `changeSign` channel, `GitState` with its reducers and save-gated pending operation, the notice catalogue with a `warn` level, the commands, bindings, and groups, the statusline segment data, and the `git` config section. Nothing here spawns a process or paints a cell; Part 2 and Part 3 consume these contracts unchanged.

## Coverage Summary

- **System Design:** `W261005F2A7-REQ1@R2`, `REQ3@R1`, `REQ4@R3`, `REQ5@R2`, `REQ6@R2`, `REQ7@R2`, `REQ8@R1`, `REQ9@R1` (core side; `REQ2@R2` core side via `openTool`/`onToolExited`); `DES1`–`DES13` (core side); `S1`–`S12`, `S16`–`S20`, `S22` (core side), `S24`, `S26` (notice), `S27`–`S29`, `S32`, `S34`–`S36` (core side); `V1`–`V27`, `V31`, `V32`, `V34`, `V35`, `V43`, `V63`, `V66`, `V68`, `V69`
- **UI Design:** `W261005F2A7-UREQ1@R1`–`UREQ10@R1` (core side); `UDES1@R1`–`UDES10@R1` (data and wording); `US1@R1`–`US10@R1` (data and gate side; painted in Part 3); `UV5@R1`, `UV10@R1` (core gate), `UV11@R1`, `UV12@R1`, `UV13@R1` (reducer part)

## Sources

- Plan index: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-plan-index.md`
- Plan context: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-plan-context.md`
- System design: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-system-design.md`
- UI design: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-ui-design.md`
- System requirements: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-requirements.md`
- UI requirements: `.s1mple/work/active/w261005f2a7-git-integration/w261005f2a7-ui-requirements.md`

## Dependencies

- None. Work happens on `feat/w261005f2a7-git-integration` (never `main`).

**Execution rules for every task and every delegated agent:**

- Read and follow `.s1mple/S1MPLE.md` and its required references (`docs/communication.md`, `docs/project.md`, `docs/languages/typescript.md`) before editing.
- No work-process identifiers (`REQ`, `DES`, `S`, `V`, `UDES`, `UV`, part, group, task ids) in code, comments, identifiers, test names, or log messages. Test names describe behavior; ids appear only in commit bodies and `.s1mple/` documents.
- Canonical verification ids follow system design §8 "Test Suites and Cases" (plan context §7).
- Kill every process you start (test apps, watchers, PTYs, temp repos) before finishing.
- `bun run check` passes before each commit.

## Execution Flow

```text
P1-G1: git algorithms and change-sign channel → P1-G2: git state, reducers, and commands
```

## Groups

### P1-G1 — git algorithms and change-sign channel

#### Goal

The pure modules in `src/core/features/git/` compute hunks, normalize index text, build one-hunk patches, parse status and blame, derive explorer markers, and emit `changeSign` decorations; the kernel carries `changeSign` per row, including block-replace inheritance, without changing any existing row.

#### Coverage Summary

- **System Design:** `REQ1@R2`, `REQ4@R3`, `REQ5@R2`, `REQ6@R2`, `REQ7@R2`; `DES2`, `DES3`, `DES4`, `DES6`, `DES10`, `DES11`, `DES12`; `S1`, `S5`, `S7`, `S8`, `S9`, `S11`, `S18`, `S19`, `S24`, `S32`; `V1`–`V9`, `V14`, `V16`, `V17`, `V22`, `V24`, `V63`
- **UI Design:** `UREQ1@R1`, `UREQ2@R1`, `UREQ5@R1`, `UREQ8@R1`; `UDES1@R1`, `UDES2@R1`, `UDES5@R1`, `UDES8@R1` (change-sign channel, glyphs, marker precedence, and blame parse as data); `US1@R1`, `US2@R1`, `US5@R1`, `US8@R1` (data side; painted in Part 3)

#### Scope

- Included: the six feature modules and their colocated tests; `changeSign` on `RenderLine` and line `Decoration`; `layoutLine` merge and `layoutText` block-replace inheritance with `text-view.test.ts` cases.
- Excluded: state, reducers, effects, adapters, UI painting, theme tokens (the `git*` token names used in `GIT_SIGNS` are strings resolved in Part 3).
- Main files: `src/core/kernel/view/{types,decorations,text-view}.ts`, `src/core/kernel/view/text-view.test.ts`, `src/core/features/git/{diff,index-text,patch,status,blame,signs}.ts` and `*.test.ts`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ4@R3 → DES12 → S8, S32 → V9, V63` | `UREQ1@R1 → UDES1@R1 → US1@R1` (data side) | `changeSign` merges independently of `sign`; block-replace row carries the last `changeSign`; rows without it are unchanged |
| `REQ5@R2 → DES2 → S7, S19 → V1–V4` | `UREQ2@R1 → UDES2@R1 → US2@R1` (kinds) | Sorted hunks with correct kinds; bounded cost |
| `REQ5@R2 → DES3 → S18 → V7, V8` | None | Index text compares equal to the buffer across BOM/CRLF |
| `REQ1@R2 → DES4 → S1, S5 → V22` | None | Exact zero-context patch text |
| `REQ4@R3, REQ7@R2 → DES6, DES10 → S9, S24 → V14, V16, V17` | `UREQ5@R1 → UDES5@R1 → US5@R1` (data side) | Workspace-relative status; one marker per row; `contains` on ancestors incl. deleted files |
| `REQ4@R3 → DES11 → S11 → V24` | `UREQ8@R1 → UDES8@R1 → US8@R1` (parse side) | Both not-committed sentinels detected |
| `REQ4@R3 → DES10 → S7 → V5, V6` | `UREQ2@R1 → UDES2@R1 → US2@R1` (glyph map) | `GIT_SIGNS` glyphs on anchor lines; navigation stops at ends |

#### Cross-Work Gates

None

#### Tasks

##### P1-G1-T1 — Kernel change-sign channel

- **Outcome:** `RenderLine` and line `Decoration` carry an optional `changeSign`; `layoutLine` keeps the last one independently of `sign`; a block-replace row carries the last `changeSign` in its covered range and no inherited `sign`.
- **System Design:** `REQ4@R3`; `DES12`; `S8`, `S32`; `V9`, `V63`
- **UI Design:** `UREQ1@R1`, `UDES1@R1` (data side)
- **Canonical Shapes:** System design §6 `changeSign` on `RenderLine` and line `Decoration`; §7 `src/core/kernel/view/types.ts`, `decorations.ts`; §7 `src/core/kernel/view/text-view.ts`
- **Files:** `src/core/kernel/view/types.ts` — `RenderLine`; `src/core/kernel/view/decorations.ts` — line `Decoration`; `src/core/kernel/view/text-view.ts` — `layoutLine`, `layoutText`, local `lastChangeSignIn`; `src/core/kernel/view/text-view.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V9`, `V63`:** `src/core/kernel/view/text-view.test.ts` — a block replace over lines 3–6 with `changeSign` on lines 4 and 5 and `sign` on 5: the replace row has the line-5 `changeSign` and no `sign`; two providers on one line (`sign` "▕" and `changeSign` "~") yield both; two providers setting `changeSign` yield the later one.

   **Preview:**

   ```ts
   test("a block-replaced row carries the last change sign in its range", () => {
     // decorations: block replace lines 3..6 (spans set); line 4 changeSign "+"; line 5 changeSign "~" and sign "▕"
     const rows = layoutText(view, decos);
     const row = rows.find((r) => r.sourceLine === 3);
     expect(row?.changeSign?.text).toBe("~");
     expect(row?.sign).toBeUndefined();
   });

   test("sign and change sign merge independently, later provider wins per channel", () => {
     // provider A: { kind: "line", line: 0, sign: reveal }; provider B: { kind: "line", line: 0, changeSign: change }
     // provider C (after B): { kind: "line", line: 0, changeSign: add }
     // expect row.sign === reveal and row.changeSign === add; a row with neither field equals today's shape (toEqual without the keys)
   });
   ```

   - Run `bun test src/core/kernel/view/text-view.test.ts` and confirm the new cases fail on the missing field and inheritance.

2. **GREEN:** `src/core/kernel/view/{types,decorations,text-view}.ts` — `RenderLine.changeSign`, line `Decoration.changeSign`, `layoutLine`, `layoutText`

   **Preview:**

   ```ts
   // types.ts — RenderLine gains:
   /** The sign in the change column, left of the line number. */
   changeSign?: Sign;
   // decorations.ts — line kind gains `changeSign?: Sign`
   // text-view.ts layoutLine: track `changeSign` beside `sign` in the same loop; attach only when defined
   // text-view.ts layoutText replace branch: const changeSign = lastChangeSignIn(decos, line, block.range.end.line);
   //   spread `...(changeSign && { changeSign })` into the emitted row; `sign` is not inherited
   ```

   - Rows without a `changeSign` must stay structurally identical (no `changeSign: undefined` key — `exactOptionalPropertyTypes`).
   - Keep the existing "last provider wins" rule for `sign` untouched.

3. **REFACTOR:** Keep `lastChangeSignIn` module-local; no other kernel changes.

   **Preview:**

   ```text
   allowed: naming and loop tidy-up inside layoutLine / layoutText
   prohibited: changing sign merge, span layout, or exporting the helper
   ```

   - Keep all affected checks passing, including existing `test/ui` snapshots untouched by this task.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(view): add a change-sign channel to render rows

   Task: P1-G1-T1 — Kernel change-sign channel
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V9`, `V63` — `bun test src/core/kernel/view/text-view.test.ts` → new and existing cases pass.
- `bun run check` → passes.

##### P1-G1-T2 — Bounded line diff

- **Outcome:** `diffLines` returns sorted, non-overlapping hunks classified as `add`, `change`, `delete`, `topdelete`, `changedelete`, or `untracked`, and stays bounded by the common-line check and `MAX_EDIT`.
- **System Design:** `REQ5@R2`, `REQ4@R3`; `DES2`; `S7`, `S19`; `V1`–`V4`
- **UI Design:** `UREQ2@R1`, `UDES2@R1` (kind set)
- **Canonical Shapes:** System design §6 `Hunk`; §7 `src/core/features/git/diff.ts`; §9 `DES2`
- **Files:** `src/core/features/git/diff.ts` — `Hunk`, `HunkKind`, `diffLines`, `MAX_EDIT`; `src/core/features/git/diff.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V1`–`V4`:** `src/core/features/git/diff.test.ts` — one changed, one added, one deleted line in a 10-line text; top deletion and change-with-extra-deletion; the untracked option; 5,000 lines with nothing in common and 5,000 lines with D > `MAX_EDIT`.

   **Preview:**

   ```ts
   test("one change, one add, and one delete become three hunks with exact ranges", () => {
     // old = l0..l9; cur: l2 edited, new line after l4, l7 removed
     expect(diffLines(old, cur)).toEqual([
       { kind: "change", old: { start: 2, count: 1 }, new: { start: 2, count: 1 }, oldLines: ["l2"] },
       { kind: "add", old: { start: 5, count: 0 }, new: { start: 5, count: 1 }, oldLines: [] },
       { kind: "delete", old: { start: 7, count: 1 }, new: { start: 7, count: 0 }, oldLines: ["l7"] },
     ]); // adjust start values to the documented 0-based convention; assert every field
   });
   test("a deletion at the top and a change that also removes lines are classified", () => { /* "topdelete", "changedelete" */ });
   test("an untracked file is one untracked hunk over every line", () => { /* opts.untracked */ });
   test("diffs with nothing in common or too many edits fall back to one change hunk quickly", () => {
     // 5,000 distinct lines each side; then 5,000 lines with > MAX_EDIT scattered edits
     // expect one change hunk covering the trimmed middle and elapsed < 50 ms
   });
   ```

   - Run `bun test src/core/features/git/diff.test.ts` and confirm failure (module missing).

2. **GREEN:** `src/core/features/git/diff.ts` — `diffLines`, `MAX_EDIT`

   **Preview:**

   ```ts
   export function diffLines(old: readonly string[], cur: readonly string[], opts?: { untracked?: boolean }): Hunk[] {
     // untracked → [{ kind: "untracked", old: {0,0}, new: {0, cur.length}, oldLines: [] }]
     // trim common prefix/suffix; middle with no shared line (Set) → one change hunk
     // Myers O(ND) on the middle, aborting past MAX_EDIT → one change hunk
     // group the edit script into hunks; classify per §7 rules
   }
   ```

   - Follow the §6 `Hunk` invariants (sorted, non-overlapping, `oldLines` reproduce `old`).
   - No dependency added; no import outside `src/core/features`/`kernel`.

3. **REFACTOR:** Extract only local helpers (trim, classify) inside the module.

   **Preview:**

   ```text
   allowed: module-private helpers for trimming, grouping, classification
   prohibited: exporting extra symbols (knip), changing the Hunk shape
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): compute bounded line hunks

   Task: P1-G1-T2 — Bounded line diff
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V1`–`V4` — `bun test src/core/features/git/diff.test.ts` → all pass; the bounded cases finish under 50 ms.

##### P1-G1-T3 — Index text normalization

- **Outcome:** `normalizeIndexText` puts index bytes into the buffer's LF, BOM-free, final-newline-split model and records `bom`, `finalNewline`, and the index `eol`; equal content diffs to zero hunks across CRLF/LF.
- **System Design:** `REQ5@R2`, `REQ1@R2`; `DES3`; `S18`; `V7`, `V8`
- **UI Design:** None
- **Canonical Shapes:** System design §6 `IndexText`; §7 `src/core/features/git/index-text.ts`
- **Files:** `src/core/features/git/index-text.ts` — `IndexText`, `normalizeIndexText`; `src/core/features/git/index-text.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V7`, `V8`:** `src/core/features/git/index-text.test.ts` — CRLF with final newline, LF without final newline, a BOM: fields equal expected and rejoin equals input; LF index vs the same content as a CRLF buffer (split like `splitFile`) through `diffLines` gives `[]`.

   **Preview:**

   ```ts
   test("index text round-trips CRLF, missing final newline, and BOM", () => {
     const t = normalizeIndexText("﻿a\r\nb\r\n", "crlf");
     expect(t).toEqual({ lines: ["a", "b"], finalNewline: true, bom: true, eol: "\r\n" });
     // rejoin: (bom ? "﻿" : "") + lines.join(eol) + (finalNewline ? eol : "") === input
   });
   test("equal content in LF index and CRLF buffer has no hunks", () => {
     // expect(diffLines(normalizeIndexText("a\nb\n", "lf").lines, bufferLinesFromCrlf)).toEqual([])
   });
   ```

   - Run `bun test src/core/features/git/index-text.test.ts` and confirm failure.

2. **GREEN:** `src/core/features/git/index-text.ts` — `normalizeIndexText`

   **Preview:**

   ```ts
   export function normalizeIndexText(text: string, eolAttr: "lf" | "crlf" | "mixed" | "none"): IndexText {
     // mirror splitFile (src/core/state/buffers.ts:305-312): strip U+FEFF, replaceAll("\r\n", "\n"),
     // finalNewline = endsWith("\n"), split, drop the trailing "" ; eol from eolAttr
   }
   ```

   - Do not import `src/core/state` (features may not import state); duplicate the tiny split rule.

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```text
   allowed: naming only
   prohibited: sharing code with src/core/state/buffers.ts (layer rule)
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): normalize index text to the buffer line model

   Task: P1-G1-T3 — Index text normalization
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V7`, `V8` — `bun test src/core/features/git/index-text.test.ts` → pass.

##### P1-G1-T4 — Zero-context hunk patch

- **Outcome:** `hunkPatch` produces exact git-diff text for one hunk in the index EOL form, with `\ No newline at end of file` markers and BOM handling.
- **System Design:** `REQ1@R2`; `DES4`; `S1`, `S5`; `V22`
- **UI Design:** None
- **Canonical Shapes:** System design §7 `src/core/features/git/patch.ts`; §9 `DES4`
- **Files:** `src/core/features/git/patch.ts` — `hunkPatch`; `src/core/features/git/patch.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V22`:** `src/core/features/git/patch.test.ts` — a change hunk at EOF with no final newline on the index side; a CRLF index; an insert hunk header.

   **Preview:**

   ```ts
   test("an insert hunk uses git-diff numbering", () => {
     // add hunk after line 4 → header "@@ -4,0 +5,1 @@"
     expect(hunkPatch("notes/a.md", "100644", h, index, cur)).toBe(
       "diff --git a/notes/a.md b/notes/a.md\nindex 0000000..0000000 100644\n--- a/notes/a.md\n+++ b/notes/a.md\n@@ -4,0 +5,1 @@\n+new\n",
     );
   });
   test("an EOF change without a final newline marks the index side", () => { /* "\\ No newline at end of file\n" */ });
   test("CRLF index lines end with \\r\\n on both sides", () => { /* "-old\r\n+new\r\n" */ });
   ```

   - Run `bun test src/core/features/git/patch.test.ts` and confirm failure.

2. **GREEN:** `src/core/features/git/patch.ts` — `hunkPatch`

   **Preview:**

   ```ts
   export function hunkPatch(repoPath: string, mode: string, h: Hunk, index: IndexText, cur: Cur): string {
     // header lines per §7; "@@ -a,b +c,d @@" (count 0 → start = line before)
     // "-" + old + index.eol; "+" + new + index.eol; no-newline markers per side; BOM on line 0 of the side with bom
   }
   ```

   - New lines come from `cur.lines` at `h.new`; the function stays pure.

3. **REFACTOR:** Local header/line helpers only.

   **Preview:**

   ```text
   allowed: module-private formatting helpers
   prohibited: changing the signature defined in system design §7
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): build a zero-context patch for one hunk

   Task: P1-G1-T4 — Zero-context hunk patch
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V22` — `bun test src/core/features/git/patch.test.ts` → exact strings match.

##### P1-G1-T5 — Porcelain status and explorer markers

- **Outcome:** `parseStatus` keeps only workspace-relative paths under the prefix with rename, unmerged, untracked, submodule, and detached-head handling; `explorerMarkers` gives one marker per existing row by conflict > untracked > modified > staged, `contains` on every ancestor (deleted tracked files included), and no key for a deleted file.
- **System Design:** `REQ4@R3`, `REQ6@R2`, `REQ7@R2`; `DES6`, `DES10`; `S9`, `S24`; `V14`, `V16`, `V17`
- **UI Design:** `UREQ5@R1`, `UDES5@R1` (marker set and precedence)
- **Canonical Shapes:** System design §6 `RepoStatus`; §7 `src/core/features/git/status.ts`
- **Files:** `src/core/features/git/status.ts` — `RepoStatus`, `FileStatus`, `parseStatus`, `Marker`, `explorerMarkers`; `src/core/features/git/status.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V14`, `V16`, `V17`:** `src/core/features/git/status.test.ts` — the §8 V14 fixture (`1 .M`, `2 R.` with orig path, `u`, `? notes/new/x.md`, submodule `S.M.`, out-of-prefix paths, `# branch.head (detached)`); precedence with a staged-and-modified file; ancestors of marked files and of deleted `old/gone.md`.

   **Preview:**

   ```ts
   const Z = ["# branch.oid abc…", "# branch.head (detached)", "1 .M N... … notes/a.md", "2 R. N... … notes/b.md", "notes/old-b.md", /* u, ?, S.M., outside */].join("\0");
   test("status keeps workspace-relative paths and consumes rename origins", () => {
     const st = parseStatus(Z, "notes/");
     expect([...st.files.keys()].sort()).toEqual(["a.md", "b.md", /* … */]);
     expect(st.head).toEqual({ kind: "detached", short: expect.any(String) });
   });
   test("each row gets one marker and staged-and-modified reads modified", () => { /* … */ });
   test("ancestor folders contain changes, including a deleted tracked file", () => {
     const m = explorerMarkers(stWithDeleted);
     expect(m.get("old")).toBe("contains");
     expect(m.has("old/gone.md")).toBe(false);
   });
   ```

   - Run `bun test src/core/features/git/status.test.ts` and confirm failure.

2. **GREEN:** `src/core/features/git/status.ts` — `parseStatus`, `explorerMarkers` (memoized per `RepoStatus` via `WeakMap`)

   **Preview:**

   ```ts
   export function parseStatus(z: string, prefix: string): RepoStatus { /* split on \0; record kinds 1, 2 (+orig), u, ?; # branch.* headers; prefix filter/strip */ }
   export function explorerMarkers(st: RepoStatus): Map<string, Marker> { /* precedence; ancestors → "contains"; deleted → ancestors only */ }
   ```

   - `op` is not set here (the adapter adds it in Part 2).
   - The `head` shape matches `RepoInfo.head` from system design §7 `types.ts`; define the head type here or in a shared core type the state module re-exports, without importing `src/core/state` from features.

3. **REFACTOR:** Local parse helpers only.

   **Preview:**

   ```text
   allowed: record-type helpers inside status.ts
   prohibited: repo walks, I/O, extra exports
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): parse porcelain status and derive explorer markers

   Task: P1-G1-T5 — Porcelain status and explorer markers
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V14`, `V16`, `V17` — `bun test src/core/features/git/status.test.ts` → pass.

##### P1-G1-T6 — Porcelain blame parse

- **Outcome:** `parseBlame` returns committed fields, or `{ committed: false }` for the zero SHA, `Not Committed Yet`, and `<external.file>` / `External file (--contents)` sentinels.
- **System Design:** `REQ4@R3`; `DES11`; `S11`; `V24`
- **UI Design:** `UREQ8@R1`, `UDES8@R1` (parse side)
- **Canonical Shapes:** System design §7 `src/core/features/git/blame.ts`
- **Files:** `src/core/features/git/blame.ts` — `BlameLine`, `parseBlame`; `src/core/features/git/blame.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V24`:** `src/core/features/git/blame.test.ts` — a committed line; a zero-SHA `Not Committed Yet`; a post-2.41 `External file (--contents)` / `<external.file>` line.

   **Preview:**

   ```ts
   test("a committed blame line exposes author, time, summary, and sha", () => {
     expect(parseBlame(COMMITTED)).toEqual({ committed: true, sha: "a1b2c3d…", author: "hieu", time: 1759600000, summary: "Add notes" });
   });
   test("both not-committed sentinels read as uncommitted", () => {
     expect(parseBlame(ZERO_SHA)).toEqual({ committed: false });
     expect(parseBlame(EXTERNAL_FILE)).toEqual({ committed: false });
   });
   ```

   - Run `bun test src/core/features/git/blame.test.ts` and confirm failure.

2. **GREEN:** `src/core/features/git/blame.ts` — `parseBlame`

   **Preview:**

   ```ts
   export function parseBlame(out: string): BlameLine {
     // first line "<sha> …"; zero sha | author "Not Committed Yet" | author-mail "<external.file>" → { committed: false }
     // else author, author-time, summary
   }
   ```

   - Pure; no date formatting here (the reducer formats relative dates).

3. **REFACTOR:** None beyond naming.

   **Preview:**

   ```text
   allowed: naming
   prohibited: formatting relative dates in this module
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): parse porcelain blame

   Task: P1-G1-T6 — Porcelain blame parse
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V24` — `bun test src/core/features/git/blame.test.ts` → pass.

##### P1-G1-T7 — Git sign provider and hunk navigation

- **Outcome:** `GIT_SIGNS` maps each kind to its accepted glyph and `git*` token; `hunkSigns` emits `changeSign`-only line decorations for visible lines on each hunk's anchor lines; `hunkAt`, `nextHunkLine`, `prevHunkLine` find hunks and stop at the ends.
- **System Design:** `REQ4@R3`; `DES10`, `DES12`; `S7`, `S32`; `V5`, `V6`
- **UI Design:** `UREQ2@R1`; `UDES2@R1` (glyphs `+ ~ _ ‾ ≃ ┆`); `US2@R1` (data side)
- **Canonical Shapes:** System design §7 `src/core/features/git/signs.ts`; UI design §7 Component: Git sign column (Variants)
- **Files:** `src/core/features/git/signs.ts` — `GIT_SIGNS`, `hunkSigns`, `hunkAt`, `nextHunkLine`, `prevHunkLine`; `src/core/features/git/signs.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V5`, `V6`:** `src/core/features/git/signs.test.ts` — each kind's `GIT_SIGNS` entry on its anchor line, visible lines only, `sign` never set, change wins over a coinciding delete anchor; next/prev from inside, before, and after hunks, `undefined` at ends.

   **Preview:**

   ```ts
   test("each hunk kind marks its anchor lines with its glyph, visible lines only", () => {
     const decos = hunkSigns(hunks)(viewShowing(10, 30), undefined);
     expect(decos).toEqual([{ kind: "line", line: 12, changeSign: GIT_SIGNS.add }, /* topdelete → line 0 only when visible, delete → line before gap */]);
     expect(decos.some((d) => d.kind === "line" && d.sign !== undefined)).toBe(false);
   });
   test("next and previous hunk stop at the ends", () => {
     expect(nextHunkLine(hunks, lastHunkStart)).toBeUndefined();
     expect(prevHunkLine(hunks, 0)).toBeUndefined();
   });
   ```

   - Run `bun test src/core/features/git/signs.test.ts` and confirm failure.

2. **GREEN:** `src/core/features/git/signs.ts`

   **Preview:**

   ```ts
   export const GIT_SIGNS: Record<HunkKind, Sign> = { /* exactly the system design §7 map */ };
   export const hunkSigns = (hunks: readonly Hunk[]): DecorationProvider => (v) => { /* visible range only; changeSign only */ };
   export function hunkAt(hunks: readonly Hunk[], line: number): Hunk | undefined { /* delete anchors match their anchor line */ }
   export function nextHunkLine(hunks: readonly Hunk[], line: number): number | undefined { /* first line of the next hunk */ }
   export function prevHunkLine(hunks: readonly Hunk[], line: number): number | undefined { /* first line of the previous hunk */ }
   ```

   - Glyphs and token names must equal UI design §7 Component: Git sign column; do not invent tokens.

3. **REFACTOR:** Share one anchor-line helper between `hunkSigns` and `hunkAt`.

   **Preview:**

   ```text
   allowed: module-private anchor helper
   prohibited: setting `sign`, wrap-around navigation
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): add the change-column sign provider and hunk navigation

   Task: P1-G1-T7 — Git sign provider and hunk navigation
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V5`, `V6` — `bun test src/core/features/git/signs.test.ts` → pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Feature and kernel units | `bun test src/core/features/git src/core/kernel/view` | `V1`–`V9`, `V14`, `V16`, `V17`, `V22`, `V24`, `V63` pass |
| Boundaries | `bun test test/boundaries.test.ts` | `src/core/features/git/*` imports only kernel/features; no package imports |
| Static and unit gate | `bun run check` | biome, tsc, knip zero findings, unit suites pass. New exports whose only consumer so far is a colocated test must still pass knip; if knip flags one, report it instead of adding dead wiring, and resolve it in the part that adds the real consumer |
| Existing rendering unchanged | `bun run test:ci -- test/ui` (or `bun test test/ui`) | All existing snapshots pass unchanged |
| No process ids in code | `grep -rnE "W261005F2A7\|\\b(REQ\|DES\|UDES\|UV)[0-9]" src test` | No matches |

#### Review and Verification Focus

- **Specification:** Hunk kinds and anchors per §6 `Hunk`; glyphs and token names exactly per UI design; marker precedence and deleted-file rule per `DES10`; both blame sentinels; patch header numbering per RF2.
- **Technical:** Bounded diff cost; `exactOptionalPropertyTypes`-safe optional fields; kernel rows without `changeSign` byte-identical; layer rules (features never import state); knip-clean exports.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

### P1-G2 — git state, reducers, and commands

#### Goal

`AppState.git` and every Git transition live in `src/core/state/git.ts`: discovery, coalesced refresh, index reads, debounced live diff, save-gated stage, reset as one undo step, the save-gated tool launch, navigation, preview overlay, blame, the statusline segment, and the notice catalogue at its levels; commands, bindings, and groups are registered in `testRegistries()`; `ConfigSchema.git.tool` parses with defaults.

#### Coverage Summary

- **System Design:** `REQ1@R2`, `REQ2@R2` (core side), `REQ3@R1`, `REQ4@R3`, `REQ5@R2`, `REQ6@R2`, `REQ7@R2`, `REQ8@R1`, `REQ9@R1`; `DES1`–`DES11` (core side), `DES13`; `S1`–`S4`, `S6`, `S7` (navigation), `S10`, `S11`, `S12` (core side), `S16`–`S20`, `S22` (core side), `S26` (notice), `S27`–`S29`, `S34`–`S36`; `V10`–`V13`, `V15`, `V18`–`V21`, `V23`, `V25`–`V27`, `V31`, `V32`, `V34`, `V35`, `V43`, `V66`, `V68`, `V69`
- **UI Design:** `UREQ3@R1`, `UREQ4@R1` (data), `UREQ6@R1` (gate), `UREQ7@R1`, `UREQ8@R1`, `UREQ9@R1`, `UREQ10@R1` (message); `UDES3@R1`, `UDES4@R1` (count rules), `UDES6@R1` (open/close rules), `UDES7@R1`, `UDES8@R1`, `UDES9@R1`, `UDES10@R1` (message text); `US3@R1`, `US7@R1`, `US8@R1`, `US9@R1`; `UV5@R1`, `UV10@R1` (core gate), `UV11@R1`, `UV12@R1`, `UV13@R1` (reducer part)

#### Scope

- Included: state unions and types, `MessageLevel`, `initialGit`, all Git reducers and catalogue constants, update routing and the diff-timer wrapper, save/disk hooks, `blocked` export, statusline segment data, `gitHunk` key and mouse gates, config section, `git-commands.ts`, `testRegistries()` merge, and a temporary no-op group for the six Git effect kinds in `src/app/effects.ts` so the exhaustive switch compiles (replaced in Part 2).
- Excluded: Git process execution, watcher, tool host, shell, all painting, production `registries()` in `main.ts` (Part 3).
- Main files: `src/core/state/{types,result,init,git,git-commands,update,save,disk,status,keys,mouse}.ts`, `src/core/config/schema.ts`, `test/support/state.ts`, `src/app/effects.ts` (temporary cases only); tests `src/core/state/{git,git-commands,status}.test.ts`, `src/core/config/schema.test.ts`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ3@R1 → DES11 → S17 → V43` | None | `git.tool` non-empty string array, default `["lazygit"]` |
| `REQ5@R2, REQ6@R2, REQ7@R2 → DES1, DES2, DES6, DES8 (core), DES13 → S18–S20 → V18, V19, V25–V27; V66 (version row)` | `UREQ9@R1 → UDES9@R1 → US9@R1 → UV13@R1` (version notice) | Debounced diff, coalesced refresh, re-read rules, late results dropped, warn version notice |
| `REQ1@R2, REQ9@R1 → DES4, DES5, DES13 → S1–S4, S6, S29, S34 → V10–V13, V20, V21, V23; V66 (stage/reset rows)` | `UREQ3@R1 → UDES3@R1 → US3@R1 → UV5@R1` (stage/reset) | Fresh-hunk stage with oid and report, save gate, conflict refusal, busy refusal, undoable reset |
| `REQ2@R2, REQ3@R1, REQ8@R1 → DES9, DES13 → S12, S16, S27, S28, S35 → V31, V32, V34, V35, V68; V66 (tool rows)` | `UREQ10@R1 → UDES10@R1 → US10@R1` (message); `UREQ9@R1 → UV13@R1` | Tool gate saves first, cancels on failure, pre-suspend message, refresh and re-read after exit |
| `REQ4@R3 → DES10, DES11, DES13 → S10, S11, S34 → V15; V66 (nav/preview rows)` | `UREQ3@R1, UREQ4@R1, UREQ6@R1, UREQ8@R1 → UDES3@R1, UDES4@R1, UDES6@R1, UDES8@R1 → US3@R1, US4@R1, US6@R1, US8@R1 → UV5@R1, UV10@R1 (core), UV12@R1` | Navigation text, statusline counts rule, preview opens/closes, blame text with date buckets |
| `REQ4@R3 → DES11 → S36 → V69` | `UREQ7@R1 → UDES7@R1 → US7@R1 → UV11@R1` | Which-key rows under `+git` and `+hunk` |

#### Cross-Work Gates

None

#### Tasks

##### P1-G2-T1 — Git state model, message level, and config section

- **Outcome:** `AppState.git` (initialized by `initialGit`), the Git `Action`/`Effect`/`TimerId`/`Overlay` members, `RepoInfo`, `IndexEntry`, `GitPending`, `StageReport`, `ToolResult`, `MessageLevel` with `warn`, and `ConfigSchema.git` exist; the project compiles with `update.ts` handling the new actions as no-ops until later tasks and `src/app/effects.ts` holding one temporary no-op group for the six Git effect kinds.
- **System Design:** `REQ3@R1`; `DES1`, `DES11`, `DES13`; `S17`; `V43`; `V52` (typecheck)
- **UI Design:** `UREQ9@R1`, `UDES9@R1` (level)
- **Canonical Shapes:** System design §6 (all State/Message models); §7 `src/core/state/types.ts`, `src/core/state/result.ts`, `src/core/config/schema.ts`
- **Files:** `src/core/state/types.ts`; `src/core/state/result.ts` — `MessageLevel`, `message`; `src/core/state/git.ts` — `initialGit`; `src/core/state/init.ts` — `initialState`; `src/core/state/update.ts` — switch cases (temporary `none` returns); `src/core/config/schema.ts` — `git`; `src/core/config/schema.test.ts`; `src/app/effects.ts` — temporary case group
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V43`:** `src/core/config/schema.test.ts` — `git.tool` `["gitui"]` ok; `[]` error; `[1]` error; missing section defaults to `["lazygit"]`.

   **Preview:**

   ```ts
   test("git.tool takes a non-empty list of strings and defaults to lazygit", () => {
     expect(parseConfig('[git]\ntool = ["gitui"]\n').config.git.tool).toEqual(["gitui"]);
     expect(parseConfig("[git]\ntool = []\n").errors).toHaveLength(1);
     expect(parseConfig("[git]\ntool = [1]\n").errors).toHaveLength(1);
     expect(parseConfig("").config.git.tool).toEqual(["lazygit"]);
   }); // use the project's actual parseConfig result shape
   ```

   - Run `bun test src/core/config/schema.test.ts` and confirm failure.

2. **GREEN:** state types, level, schema, temporary routing

   **Preview:**

   ```ts
   // schema.ts
   git: z.strictObject({ tool: z.array(z.string().min(1)).min(1).default(["lazygit"]) }).prefault({}),
   // result.ts
   export type MessageLevel = "info" | "warn" | "error";
   export function message(s: AppState, text: string, level: MessageLevel = "info"): Result { /* unchanged body */ }
   // types.ts — add the §7 types and union members verbatim; notifications.message.level: MessageLevel
   // git.ts
   export const initialGit: GitState = { repo: null, status: null, files: {} };
   // init.ts — initialState adds git: initialGit
   // update.ts — case "gitDetected" … "gitDirChanged": return none(state); (replaced by T2–T5)
   // effects.ts — case "gitStatus": case "gitReadIndex": case "gitStage": case "gitBlame": case "gitWatch": case "runTool": return;
   ```

   - `ToolResult` lives in core `types.ts` (app imports it later).
   - System design §7 `src/app/effects.ts` requires the runner to read the `RepoInfo` the adapter needs "from the effect payload" while holding no Git state, but the §7 effect members carry only paths. Carry `repo: RepoInfo` on `gitStatus`, `gitReadIndex`, `gitStage`, and `gitBlame` (plain data; the adapter needs `top` as cwd and `gitDir` for `op`). Reducer tests in T2–T5 assert effects with this field.
   - The `effects.ts` no-op group is the only app change in Part 1; Part 2 replaces every member (see index Cross-Part Coordination).
   - `saveState`/session snapshot ignores `git`.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   allowed: import ordering
   prohibited: behavior in reducers or runner beyond the no-op routing
   ```

   - Keep all affected checks passing (`save.test.ts`, existing suites).

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): add git state, message warn level, and git config

   Task: P1-G2-T1 — Git state model, message level, and config section
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V43` — `bun test src/core/config/schema.test.ts` → pass.
- `V52` (partial) — `bun run check` → tsc and knip pass with the new unions.

##### P1-G2-T2 — Discovery, refresh, index reads, and live diff

- **Outcome:** `onGitDetected` stores the repo, emits `gitWatch` and the refresh timer, and shows the version notice at `warn`; every refresh trigger restarts `gitRefresh` (200 ms) and the timer emits one `gitStatus`; `onGitStatus` emits `gitWatch` on head change and `gitReadIndex` only for changed open paths; `onGitIndexRead` stores the entry and diffs; the update wrapper starts `gitDiff:<id>` (100 ms) on text-version change inside a repo; `files` tracks open buffers; late results after `repo` became `null` are dropped; BOM-only differences mark line 0.
- **System Design:** `REQ5@R2`, `REQ6@R2`, `REQ7@R2`; `DES1`, `DES2`, `DES3`, `DES6`, `DES7` (watch dirs), `DES8` (core), `DES13`; `S18`, `S19`, `S20`, `S22` (core side), `S26` (notice); `V18`, `V19`, `V25`, `V26`, `V27`; `V66` (gitDetected version row)
- **UI Design:** `UREQ9@R1`; `UDES9@R1`; `UV13@R1` (version notice, reducer part)
- **Canonical Shapes:** System design §5 Discovery, Live Hunks, Refresh; §7 `src/core/state/git.ts`, `update.ts`, `save.ts` (`onSaved` refresh), `disk.ts`
- **Files:** `src/core/state/git.ts` — `onGitDetected`, `requestRefresh`, `onGitRefreshTimer`, `onGitStatus`, `onGitIndexRead`, `onGitDiffTimer`, `trackOpenBuffer`, `dropClosedBuffer`, watch-dir helper; `src/core/state/update.ts` — cases, `withGitDiffTimers`, `onTimerAction`; `src/core/state/save.ts` — `onSaved` chains `requestRefresh`; `src/core/state/disk.ts` — `onFileChanged`; `src/core/state/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V18`, `V19`, `V25`, `V26`, `V27`, `V66` (version row):** `src/core/state/git.test.ts` with `createUpdate(testRegistries())` and a seeded repo state helper.

   **Preview:**

   ```ts
   const update = createUpdate(testRegistries());
   const inRepo = (s: AppState): AppState => ({ ...s, git: { ...s.git, repo: REPO } });

   test("typing debounces the diff and runs no git effect", () => {
     // each keystroke → effects include { kind: "startTimer", id: "gitDiff:1", ms: 100 } and no git* effect
     // timer gitDiff:1 → state.git.files["a.md"].hunks updated
   });
   test("saves, file changes, git-dir changes, and tool exits coalesce into one status run", () => {
     // each of saved | fileChanged | gitDirChanged | toolExited → startTimer gitRefresh 200; timer → one { kind: "gitStatus", prefix }
   });
   test("a head change retargets the watch and an index change re-reads only that file", () => { /* gitWatch with refs/heads/feature; one gitReadIndex */ });
   test("a status result after the repository is gone changes nothing", () => { /* repo null → state toBe prev */ });
   test("a BOM-only difference is one change hunk on line 0", () => { /* … */ });
   test("an old git shows a warning and keeps git off", () => {
     const r = update(fresh(), { type: "gitDetected", repo: null, notice: "git 2.20.1 is older than 2.31; git features off" });
     expect(r.state.notifications.message).toEqual({ text: "git 2.20.1 is older than 2.31; git features off", level: "warn" });
   });
   ```

   - Run `bun test src/core/state/git.test.ts` and confirm failure.

2. **GREEN:** reducers and routing

   **Preview:**

   ```ts
   export function requestRefresh(s: AppState): Result {
     return s.git.repo ? { state: s, effects: [{ kind: "startTimer", id: "gitRefresh", ms: 200 }] } : none(s);
   }
   export function onGitStatus(s: AppState, a: Extract<Action, { type: "gitStatus" }>): Result { /* drop when repo null; set status; head change → gitWatch; changed open paths → gitReadIndex */ }
   // update.ts: route the seven actions; onTimerAction: id.startsWith("gitDiff:") → onGitDiffTimer, "gitRefresh" → onGitRefreshTimer
   // wrapper: return withGitDiffTimers(state, withSession) — see system design §7 update.ts
   // save.ts onSaved: … chain(…, requestRefresh)   (stage/tool advance is added in T3/T4)
   // disk.ts onFileChanged: chain(result, requestRefresh)
   ```

   - `fileLoaded` in a repo emits `gitReadIndex`; a closed buffer's `files` entry is dropped in the same transition (§6 `GitState` invariants).
   - No git timer outside a repository.

3. **REFACTOR:** Collect watch-dir derivation (`[gitDir, commonDir, refs/heads/<dirname(branch)>]`, deduplicated) in one helper used by `onGitDetected` and `onGitStatus`.

   **Preview:**

   ```text
   allowed: module-private helpers in git.ts
   prohibited: touching the existing saveState debounce or quit continuation
   ```

   - Keep all affected checks passing (`save.test.ts`, `disk.test.ts`, `update.test.ts`).

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): track repo state, refresh, and live hunks in core

   Task: P1-G2-T2 — Discovery, refresh, index reads, and live diff
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V18`, `V19`, `V25`, `V26`, `V27`, `V66` (version row) — `bun test src/core/state/git.test.ts` → pass.
- `bun test src/core/state` → existing suites unchanged.

##### P1-G2-T3 — Stage and reset hunk

- **Outcome:** `stageHunk` refuses without a repo, while pending, without a hunk, on conflict, and for blocked buffers; a dirty buffer is saved first via `git.pending`; a clean buffer emits one `gitStage` with fresh hunks, `expectedOid` (or `null` for untracked), `hunkPatch`, and `report`; `onGitStaged` writes the catalogue text and always emits `gitReadIndex` and a refresh; `onSaveFailed` cancels with `not staged: <path> could not be saved`; `resetHunk` applies one undoable edit, restores `finalNewline`, and runs no Git; `git.stageHunk`/`git.resetHunk` commands and bindings exist in `git-commands.ts` and `testRegistries()`.
- **System Design:** `REQ1@R2`, `REQ9@R1`; `DES4`, `DES5`, `DES13`; `S1`–`S4`, `S6`, `S29`, `S34`; `V10`–`V13`, `V20`, `V21`, `V23`; `V66` (stage, staged, stale, failed, reset, no-hunk rows)
- **UI Design:** `UREQ3@R1`, `UREQ9@R1`; `UDES3@R1`, `UDES9@R1`; `US3@R1`; `UV5@R1` (stage/reset rows), `UV13@R1` (conflict, stale, busy rows)
- **Canonical Shapes:** System design §5 Stage Hunk, Reset Hunk; §7 `src/core/state/git.ts` (`stageNow`, `resetHunk`, `advanceGitPending`, `cancelGitPending`), `save.ts`, `git-commands.ts`; §9 `DES13` catalogue
- **Files:** `src/core/state/git.ts` — `stageHunk`, `stageNow`, `currentHunks`, `resetHunk`, `onGitStaged`, `advanceGitPending`, `cancelGitPending`, catalogue constants/helpers; `src/core/state/save.ts` — export `blocked`, `onSaved`/`onSaveFailed` chaining; `src/core/state/git-commands.ts` — `gitCommands`, `gitBindings` (stage/reset entries); `test/support/state.ts` — `testRegistries()` merge; `src/core/state/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V10`–`V13`, `V20`, `V21`, `V23`, `V66`, `UV5`, `UV13`:** `src/core/state/git.test.ts` — via `<leader>ghs` / `<leader>ghr` keys (or `git.stageHunk` command) on seeded states.

   **Preview:**

   ```ts
   test("staging a clean tracked hunk sends its patch with the index oid", () => {
     // expect one { kind: "gitStage", path, repoPath, expectedOid: ENTRY.oid, patch: hunkPatch(...), report: { n: 2, m: 4, saved: false } }
   });
   test("staging an untracked file asks for intent-to-add", () => { /* expectedOid: null */ });
   test("a stale index warns and refreshes", () => {
     // gitStaged result "stale" → message { text: "index changed; hunks refreshed", level: "warn" } + gitReadIndex + startTimer gitRefresh
   });
   test("a conflicted file is never staged", () => {
     // no gitStage; message { text: "notes/a.md has conflicts; resolve them in lazygit", level: "error" }
   });
   test("a dirty buffer is saved before staging, and a failed save stages nothing", () => { /* write first; saved → gitStage with report.saved true; saveFailed → "not staged: notes/a.md could not be saved" error, pending cleared */ });
   test("a second git operation while one is pending is refused", () => { /* "git: another operation is running" info, no effects */ });
   test("reset restores index lines in one undo step and the final-newline flag", () => { /* no git effect; `u` restores lines */ });
   test("hunk action messages read as the accepted catalogue", () => {
     // rows: "staged hunk 2/4"; '"projects/so-roadmap.md" written · staged hunk 2/4'; "reset hunk 3/4 · buffer changed, autosave pending";
     //       "no hunk at cursor" for stage and reset; failed → first stderr line at error
   });
   ```

   - Run `bun test src/core/state/git.test.ts` and confirm the new cases fail.

2. **GREEN:** reducers, save hooks, commands

   **Preview:**

   ```ts
   export function stageHunk(ctx: CommandContext): Result { /* order: NOT_A_REPO → BUSY → blocked "cannot save <path>" → dirty → pending stage + writeBuffer → else stageNow(…, false) */ }
   export function advanceGitPending(s: AppState, id: BufferId, now: number): Result { /* remove id; re-write if dirty again; empty → continue */ }
   export function cancelGitPending(s: AppState, id: BufferId): Result { /* stage → "not staged: <path> could not be saved" error */ }
   // save.ts: export function blocked(...); onSaved: chain(advanceQuit) → chain(advanceGitPending) → chain(requestRefresh); onSaveFailed: chain(cancelGitPending)
   // git-commands.ts: local `type AppCommand = Command<CommandContext, CommandResult>`; entries git.stageHunk "Stage hunk", git.resetHunk "Reset hunk"; bindings <leader>ghs, <leader>ghr (normal)
   // test/support/state.ts: merge gitCommands and gitBindings like noteCommands/noteBindings
   ```

   - Text and levels come only from module constants and helpers matching the DES13 table; quit continuation order stays first.
   - `pending` is cleared on continue, save failure, buffer close, and `gitDetected`.

3. **REFACTOR:** Keep the catalogue in one block of constants and small functions at the top of `git.ts`.

   **Preview:**

   ```text
   allowed: grouping catalogue strings, sharing hunkIndexAt between stage and reset
   prohibited: new message wording, changing save.ts quit behavior
   ```

   - Keep all affected checks passing (`save.test.ts` unchanged).

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): stage and reset hunks from core

   Task: P1-G2-T3 — Stage and reset hunk
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V10`–`V13`, `V20`, `V21`, `V23`, `V66` (stage/reset rows), `UV5@R1` (stage/reset), `UV13@R1` (conflict/stale/busy) — `bun test src/core/state/git.test.ts` → pass.
- `bun test src/core/state/save.test.ts` → unchanged pass.

##### P1-G2-T4 — Save-gated tool launch

- **Outcome:** `openTool` refuses without a repo or while pending, refuses a blocked dirty buffer with `git tool not started: <path> could not be saved`, saves every dirty buffer first, then sets the pre-suspend message (one path or `N files written · opening <tool>`) and emits one `runTool { argv: config.git.tool, cwd: repo.top }`; with nothing dirty it emits `runTool` with no message; `onToolExited` clears the message and emits a refresh plus `read` and `gitReadIndex` per open buffer on `exited`, and `<tool> not found (git.tool)` on `missing`; `git.tool` command and `<leader>gg` binding exist.
- **System Design:** `REQ2@R2` (core side), `REQ3@R1`, `REQ8@R1`; `DES9`, `DES13`; `S12` (core side), `S16`, `S27`, `S28`, `S35`; `V31`, `V32`, `V34`, `V35`, `V68`; `V66` (openTool blocked/saveFailed, toolExited missing rows)
- **UI Design:** `UREQ9@R1`, `UREQ10@R1`; `UDES9@R1`, `UDES10@R1`; `US9@R1`, `US10@R1` (message part); `UV13@R1` (tool rows)
- **Canonical Shapes:** System design §5 Tool Hand-off; §7 `src/core/state/git.ts` (`openTool`, `runTool`, `onToolExited`); §9 `DES9`, `DES13`
- **Files:** `src/core/state/git.ts` — `openTool`, local `runTool`, `onToolExited`, tool-gate branch of `advanceGitPending`/`cancelGitPending`; `src/core/state/update.ts` — `toolExited` case; `src/core/state/git-commands.ts` — `git.tool` "Lazygit (full screen)", `<leader>gg`; `src/core/state/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V31`, `V32`, `V34`, `V35`, `V68`, `V66`, `UV13`:** `src/core/state/git.test.ts`.

   **Preview:**

   ```ts
   test("opening the tool writes every dirty buffer first and then runs it at the repo top", () => {
     // two dirty → two write effects; after both saved → one { kind: "runTool", argv: ["lazygit"], cwd: REPO.top }
     // same result sets message { text: "2 files written · opening lazygit", level: "info" }
   });
   test("one dirty buffer names the file before opening the tool", () => { /* '"notes/a.md" written · opening lazygit' */ });
   test("a failed or blocked save cancels the tool", () => { /* no runTool; "git tool not started: notes/a.md could not be saved" error */ });
   test("without a repository or tool the user is told why", () => { /* "not a git repository" info; toolExited missing → "lazygit not found (git.tool)" error */ });
   test("after the tool exits buffers and git state are refreshed and the message is cleared", () => {
     // startTimer gitRefresh; one read + one gitReadIndex per open buffer; notifications.message undefined
   });
   ```

   - Run `bun test src/core/state/git.test.ts` and confirm failure.

2. **GREEN:** tool gate

   **Preview:**

   ```ts
   export function openTool(ctx: CommandContext): Result { /* exactly the §7 proposed shape */ }
   function runTool(s: AppState, saved: readonly string[]): Result { /* saved.length → message(openingTool(saved, tool(s))); effect runTool */ }
   export function onToolExited(s: AppState, a: Extract<Action, { type: "toolExited" }>): Result { /* missing → error notice; exited/failed → clear + refresh + read/gitReadIndex per open buffer */ }
   ```

   - `tool(s)` is `s.config.git.tool[0]`.

3. **REFACTOR:** Share `dirtyIds` and the pending continue/cancel switch between stage and tool.

   **Preview:**

   ```text
   allowed: unify continue/cancel branches by `pending.op`
   prohibited: changing stage behavior verified in T3
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): gate the git tool launch on saved buffers

   Task: P1-G2-T4 — Save-gated tool launch
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V31`, `V32`, `V34`, `V35`, `V68`, `V66` (tool rows), `UV13@R1` (tool rows) — `bun test src/core/state/git.test.ts` → pass.

##### P1-G2-T5 — Navigation, preview, blame, and statusline segment

- **Outcome:** `gotoHunk` moves to adjacent hunk starts with `hunk n/m`, `no next hunk`, `no previous hunk`; `previewHunk` opens `{ kind: "gitHunk", bufferId, hunk }` or answers `no hunk at cursor`; the `gitHunk` overlay closes on Esc/`q` (cursor unchanged), closes and re-dispatches any other key, and closes on a press outside; `blameLine` answers `not committed yet` in core for untracked or unborn files or emits `gitBlame` with `saveText`; `onGitBlamed` formats `<author>, <relative date> · <summary> (<sha7>)` with the accepted buckets; `statusSegments` adds `git` with gitsigns counts, 0 for untracked and unborn, absent without a repo; commands and bindings for preview, next, prev, blame exist.
- **System Design:** `REQ4@R3`; `DES10`, `DES11`, `DES13`; `S7` (navigation), `S10`, `S11`, `S34`; `V15`; `V66` (navigation, preview rows)
- **UI Design:** `UREQ3@R1`, `UREQ4@R1`, `UREQ6@R1`, `UREQ8@R1`; `UDES3@R1`, `UDES4@R1`, `UDES6@R1`, `UDES8@R1`; `US3@R1`, `US4@R1` (data), `US6@R1` (gate), `US8@R1`; `UV5@R1` (navigation, preview rows), `UV10@R1` (core gate), `UV12@R1`
- **Canonical Shapes:** System design §5 Blame; §6 `StatusSegments.git`; §7 `src/core/state/git.ts` (`gotoHunk`), `disk.ts`/`status.ts`/`keys.ts`/`mouse.ts`; UI design §7 Component: Git message catalogue (date buckets), Surface: Hunk preview float (Interaction Contract)
- **Files:** `src/core/state/git.ts` — `gotoHunk`, `previewHunk`, `blameLine`, `onGitBlamed`, relative-date helper; `src/core/state/status.ts` — `StatusSegments.git`, `statusSegments`; `src/core/state/keys.ts` — `routeKey` `gitHunk`; `src/core/state/mouse.ts` — `gitHunk` press gate (confirm the generic `pressStops`/`overlayGate` path already closes it; change only if a case fails); `src/core/state/git-commands.ts` — `git.previewHunk`, `git.nextHunk`, `git.prevHunk`, `git.blameLine`, bindings `<leader>ghp`, `<leader>ghb`, `]h`, `[h`; `src/core/state/{git,status}.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V15`, `V66`, `UV5`, `UV10` (core), `UV12`:** `src/core/state/status.test.ts` and `src/core/state/git.test.ts`.

   **Preview:**

   ```ts
   // status.test.ts
   test("git segment counts follow the gitsigns summary and stay zero without a base", () => {
     // change 3→1 lines → { changed: 1, removed: 2, added: 0 }; untracked file → all 0; unborn head → all 0; repo null → git undefined
   });
   // git.test.ts
   test("navigation reports the hunk position and stops at the ends", () => {
     // "]h" → "hunk 2/4"; at last → "no next hunk", cursor unchanged; "[h" at first → "no previous hunk"
   });
   test("preview opens the hunk float and closes on escape, q, other keys, and outside presses", () => {
     // <leader>ghp → overlay { kind: "gitHunk", bufferId, hunk }; <Esc> / q → none, cursor unchanged; j → none and cursor moved
     // mouse press with target outside → none; clean line → "no hunk at cursor", overlay none
   });
   test("blame reads as author, relative date, summary, and short sha", () => {
     // now − 30 s → "hieu, just now · Add notes (a1b2c3d)"; − 5 min "5 minutes ago"; − 1 h "1 hour ago";
     // − 2 days "2 days ago"; − 40 days "1 month ago"; − 400 days "1 year ago"; uncommitted / untracked / unborn → "not committed yet"; all info
   });
   ```

   - Run `bun test src/core/state/status.test.ts src/core/state/git.test.ts` and confirm failure.

2. **GREEN:** reducers, segment, gates, commands

   **Preview:**

   ```ts
   export function gotoHunk(ctx: CommandContext, dir: 1 | -1): Result { /* nextHunkLine / prevHunkLine on currentHunks; move cursor; catalogue text */ }
   export function previewHunk(ctx: CommandContext): Result { /* hunkAt → overlay gitHunk | message(NO_HUNK) */ }
   export function blameLine(ctx: CommandContext): Result { /* untracked | unborn → "not committed yet"; else effect gitBlame { path, repoPath, line, contents: saveText(b) } */ }
   // status.ts: git?: { ref; op?; added; changed; removed } derived from repo.head, repo.op, files[path].hunks
   // keys.ts routeKey: case "gitHunk": Esc | q → close; else close and continue routing the key
   ```

   - Command titles exactly: `Preview hunk`, `Blame line`, `Git: next hunk`, `Git: previous hunk`.
   - Relative date buckets and singular/plural per UI design §7 Component: Git message catalogue.

3. **REFACTOR:** Keep the date helper module-private in `git.ts`.

   **Preview:**

   ```text
   allowed: helper extraction inside git.ts / status.ts
   prohibited: UI formatting (separators, tokens) in core; status.ts only supplies numbers and ref
   ```

   - Keep all affected checks passing (`keys.test.ts`, `mouse.test.ts`, `status.test.ts`).

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): navigate, preview, and blame hunks; add the statusline segment

   Task: P1-G2-T5 — Navigation, preview, blame, and statusline segment
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V15` — `bun test src/core/state/status.test.ts` → pass.
- `V66` (navigation/preview rows), `UV5@R1`, `UV10@R1` (core gate), `UV12@R1` — `bun test src/core/state/git.test.ts` → pass.

##### P1-G2-T6 — Which-key git groups

- **Outcome:** `gitGroups` labels `<leader>g` as `git` and `<leader>gh` as `hunk` and is merged in `testRegistries()`; `whichKeyRows` lists `g Lazygit (full screen)`, `+hunk`, then `b Blame line`, `p Preview hunk`, `r Reset hunk`, `s Stage hunk`, and no `]`/`[` rows; every binding id exists in `gitCommands`.
- **System Design:** `REQ4@R3`, `REQ2@R2`; `DES11`; `S36`; `V69`
- **UI Design:** `UREQ7@R1`; `UDES7@R1`; `US7@R1`; `UV11@R1`
- **Canonical Shapes:** System design §7 `src/core/state/git-commands.ts`; UI design §7 Surface: Which-key popup
- **Files:** `src/core/state/git-commands.ts` — `gitGroups`; `test/support/state.ts` — groups merge; `src/core/state/git-commands.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V69`, `UV11`:** `src/core/state/git-commands.test.ts` — rows for `<leader>g` and `<leader>gh` with `testRegistries()`; every binding id resolves.

   **Preview:**

   ```ts
   test("which-key lists the git and hunk groups with plain titles", () => {
     const reg = testRegistries();
     expect(rowsText(whichKeyRows(stateAt("<leader>g"), reg))).toEqual(["g Lazygit (full screen)", "h +hunk"]);
     expect(rowsText(whichKeyRows(stateAt("<leader>gh"), reg))).toEqual(["b Blame line", "p Preview hunk", "r Reset hunk", "s Stage hunk"]);
   }); // use the whichKeyRows signature and row shape from src/core/state/whichkey.ts
   test("every git binding names a registered git command", () => { /* gitBindings.every(b => gitCommands.some(c => c.id === b.id)) */ });
   ```

   - Run `bun test src/core/state/git-commands.test.ts` and confirm failure.

2. **GREEN:** `src/core/state/git-commands.ts`, `test/support/state.ts`

   **Preview:**

   ```ts
   export const gitGroups = { "<leader>g": "git", "<leader>gh": "hunk" } as const;
   // test/support/state.ts: groups: { ...defaultGroups, ...linkGroups, ...noteGroups, ...gitGroups }
   ```

   - Production `registries()` in `src/app/main.ts` is merged in Part 3 (`P3-G1`).

3. **REFACTOR:** None.

   **Preview:**

   ```text
   allowed: ordering of command entries
   prohibited: changing titles defined by the UI design
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): add which-key groups for git and hunk commands

   Task: P1-G2-T6 — Which-key git groups
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V69`, `UV11@R1` — `bun test src/core/state/git-commands.test.ts` → pass.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| Reducer, status, commands, config units | `bun test src/core/state src/core/config` | `V10`–`V13`, `V15`, `V18`–`V21`, `V23`, `V25`–`V27`, `V31`, `V32`, `V34`, `V35`, `V43`, `V66`, `V68`, `V69`, `UV5`, `UV10` (core), `UV11`, `UV12`, `UV13` (reducer) pass; existing suites unchanged |
| Static and unit gate | `bun run check` | biome, tsc, knip zero, unit suites pass |
| Existing rendering unchanged | `bun test test/ui test/integration` | All existing UI snapshots and integration suites pass (git state is inert with `repo: null`) |
| Temporary runner cases | `grep -n "case \"gitStatus\"" src/app/effects.ts` | Exactly the one no-op group added in `P1-G2-T1`, to be replaced in Part 2 |
| No process ids in code | `grep -rnE "W261005F2A7\|\\b(REQ\|DES\|UDES\|UV)[0-9]" src test` | No matches |

#### Review and Verification Focus

- **Specification:** Every notice text and level equals the DES13 catalogue and UI catalogue; pending gate clears on every terminal path; stage recomputes hunks; reset is one undo step with no Git; counts rule (untracked/unborn 0); which-key titles; `git.tool` default.
- **Technical:** `update` stays pure and synchronous; exhaustive switches stay exhaustive; quit continuation unchanged; no git timer outside a repo; `files` stays a subset of open buffers; knip-clean exports; no layer violations.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ4@R3 → DES12 → S8, S32 → V9, V63` | `UREQ1@R1 → UDES1@R1` (data) | `P1-G1` | `P1-G1-T1` |
| `REQ5@R2 → DES2 → S7, S19 → V1–V4` | `UREQ2@R1 → UDES2@R1` | `P1-G1` | `P1-G1-T2` |
| `REQ5@R2 → DES3 → S18 → V7, V8` | None | `P1-G1` | `P1-G1-T3` |
| `REQ1@R2 → DES4 → S1, S5 → V22` | None | `P1-G1` | `P1-G1-T4` |
| `REQ4@R3, REQ7@R2 → DES6, DES10 → S9, S24 → V14, V16, V17` | `UREQ5@R1 → UDES5@R1` (data) | `P1-G1` | `P1-G1-T5` |
| `REQ4@R3 → DES11 → S11 → V24` | `UREQ8@R1 → UDES8@R1` (parse) | `P1-G1` | `P1-G1-T6` |
| `REQ4@R3 → DES10 → S7 → V5, V6` | `UREQ2@R1 → UDES2@R1 → US2@R1` (data) | `P1-G1` | `P1-G1-T7` |
| `REQ3@R1 → DES11 → S17 → V43` | None | `P1-G2` | `P1-G2-T1` |
| `REQ5@R2, REQ6@R2, REQ7@R2 → DES2, DES6, DES8, DES13 → S18–S20, S26 → V18, V19, V25–V27, V66` | `UREQ9@R1 → UDES9@R1 → US9@R1 → UV13@R1` | `P1-G2` | `P1-G2-T2` |
| `REQ1@R2, REQ9@R1 → DES4, DES5, DES13 → S1–S4, S6, S29, S34 → V10–V13, V20, V21, V23, V66` | `UREQ3@R1 → UDES3@R1 → US3@R1 → UV5@R1`; `UREQ9@R1 → UV13@R1` | `P1-G2` | `P1-G2-T3` |
| `REQ2@R2, REQ3@R1, REQ8@R1 → DES9, DES13 → S12, S16, S27, S28, S35 → V31, V32, V34, V35, V68, V66` | `UREQ10@R1 → UDES10@R1 → US10@R1`; `UREQ9@R1 → UV13@R1` | `P1-G2` | `P1-G2-T4` |
| `REQ4@R3 → DES10, DES11, DES13 → S7, S10, S11, S34 → V15, V66` | `UREQ3@R1, UREQ4@R1, UREQ6@R1, UREQ8@R1 → UDES3, UDES4, UDES6, UDES8 → US3, US4, US6, US8 → UV5@R1, UV10@R1, UV12@R1` | `P1-G2` | `P1-G2-T5` |
| `REQ4@R3 → DES11 → S36 → V69` | `UREQ7@R1 → UDES7@R1 → US7@R1 → UV11@R1` | `P1-G2` | `P1-G2-T6` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.
- Outputs handed to later parts: the `Action`/`Effect`/`TimerId`/`Overlay` git members, `GitState`, `RepoInfo`, `IndexEntry`, `StageReport`, `ToolResult` (`src/core/state/types.ts`); `parseStatus`, `parseBlame`, `normalizeIndexText`, `hunkPatch`, `RepoStatus`, `BlameLine`, `IndexText`; `hunkSigns`, `GIT_SIGNS`, `RenderLine.changeSign`, `explorerMarkers`, `Marker`, `StatusSegments.git`; `MessageLevel`; catalogue constants; `gitCommands`, `gitBindings`, `gitGroups` (merged in `testRegistries()`); `ConfigSchema.git.tool`; the temporary no-op group for the six Git effect kinds in `src/app/effects.ts`.

## Planning Gaps

None
