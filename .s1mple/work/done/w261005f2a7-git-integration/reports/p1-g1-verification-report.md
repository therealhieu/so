# P1-G1 Verification Report

## Scope

- **Group:** `P1-G1` — git algorithms and change-sign channel
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`, `P1-G1-T6`, `P1-G1-T7`
- **Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p1-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261005f2a7-git-integration/reports/p1-g1-implementation-report.md` (report commit `1445ceb`; change range `6e3eba5..0c4d9f9`, commits `9d0c701`, `2e8e0d0`, `568ec51`, `d40c9ea`, `7f4a5da`, `1cce9a3`, `0c4d9f9`)

## Status

`Failed`

Every assigned `V` case and group check passes, and six of the seven chains are satisfied. One Major defect remains: `hunkPatch` builds a patch that `git apply --cached --unidiff-zero` rejects when the index entry is an empty file, so the DES4 invariant fails for a valid input (P1-G1-VER1).

## Assigned Traceability

- **System Design:** `REQ4@R3 → DES12 → S8, S32 → V9, V63`; `REQ5@R2 → DES2 → S7, S19 → V1–V4`; `REQ5@R2 → DES3 → S18 → V7, V8`; `REQ1@R2 → DES4 → S1, S5 → V22`; `REQ4@R3, REQ7@R2 → DES6, DES10 → S9, S24 → V14, V16, V17`; `REQ4@R3 → DES11 → S11 → V24`; `REQ4@R3 → DES10 → S7 → V5, V6`
- **UI Design:** `UREQ1@R1 → UDES1@R1 → US1@R1` (data side); `UREQ2@R1 → UDES2@R1 → US2@R1` (kinds and glyph map); `UREQ5@R1 → UDES5@R1 → US5@R1` (data side); `UREQ8@R1 → UDES8@R1 → US8@R1` (parse side). No `UV` case is assigned to this group.

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ4@R3 → DES12 → S8, S32 → V9, V63` | `UREQ1@R1 → UDES1@R1 → US1@R1` (data) | `changeSign` merges independently of `sign`, last provider wins per channel; a block-replace row carries the last `changeSign` in its range and no `sign`; rows without it keep today's shape | `src/core/kernel/view/types.ts:RenderLine.changeSign`; `src/core/kernel/view/decorations.ts:Decoration` line kind; `src/core/kernel/view/text-view.ts:layoutLine` (separate `changeSign` accumulator, attached only when defined), `layoutText` replace branch with module-local `lastChangeSignIn` (decoration order, so the later provider wins); `sign` not inherited | `Satisfied` |
| `REQ5@R2 → DES2 → S7, S19 → V1–V4` | `UREQ2@R1 → UDES2@R1 → US2@R1` (kinds) | Sorted, non-overlapping hunks with the six kinds; prefix/suffix trim, common-line `Set` check, Myers capped at `MAX_EDIT = 2000` | `src/core/features/git/diff.ts:diffLines`, `kindOf`, `shareLine`, `editScript` | `Satisfied` — except the empty-index case in P1-G1-VER1, where the hunk is `change` instead of `add` |
| `REQ5@R2 → DES3 → S18 → V7, V8` | None | Index text in the buffer's line model; round-trip for `lf`/`crlf`; equal content gives zero hunks across CRLF/LF | `src/core/features/git/index-text.ts:normalizeIndexText` mirrors `splitFile` (`src/core/state/buffers.ts:305-312`) with BOM strip and `eol` from `eolAttr`; no `src/core/state` import | `Satisfied` (the BOM-only "line 0" rule of S18 belongs to `git.ts`, P1-G2) |
| `REQ1@R2 → DES4 → S1, S5 → V22` | None | Exact zero-context patch in the index EOL form, no-newline markers per side, BOM on line 0, git-diff header numbering; applying it stages exactly one hunk | `src/core/features/git/patch.ts:hunkPatch`, `range`, `patchLine` | `Mismatch` — P1-G1-VER1: an empty index entry yields `@@ -1,1 +1,1 @@` with a `-` line for a line that does not exist, and `git apply` rejects it |
| `REQ4@R3, REQ7@R2 → DES6, DES10 → S9, S24 → V14, V16, V17` | `UREQ5@R1 → UDES5@R1 → US5@R1` (data) | Workspace-relative paths under the prefix; rename keeps the new path and consumes the origin; one marker per row by conflict > untracked > modified > staged; `contains` on every ancestor, including deleted tracked files; no key for a deleted file | `src/core/features/git/status.ts:parseStatus` (`FIELDS` counts 7/8/9/0 match porcelain v2 records `1`/`2`/`u`/`?`; origin consumed before the prefix check), `explorerMarkers` (WeakMap memo), `markerOf` | `Satisfied` |
| `REQ4@R3 → DES11 → S11 → V24` | `UREQ8@R1 → UDES8@R1 → US8@R1` (parse) | Committed fields, or `{ committed: false }` for zero SHA, `Not Committed Yet`, and `<external.file>` | `src/core/features/git/blame.ts:parseBlame` (header fields stop at the tab-prefixed content line) | `Satisfied` |
| `REQ4@R3 → DES10 → S7 → V5, V6` | `UREQ2@R1 → UDES2@R1 → US2@R1` (glyph map) | `GIT_SIGNS` glyphs `+ ~ _ ‾ ≃ ┆` with `git*` tokens; `changeSign`-only decorations for visible lines on anchor lines; change wins over a delete anchor; navigation stops at the ends | `src/core/features/git/signs.ts:GIT_SIGNS` (equals UI design §7 Component: Git sign column and system design §7 exactly), `hunkSigns`, `hunkAt`, `nextHunkLine`, `prevHunkLine`, shared `linesOf` | `Satisfied` |

**Recorded deviations, judged against the governing designs:**

| Deviation | Judgment | Reason |
|---|---|---|
| Empty-side start = insertion point (`delete` of old line 7 → `new.start: 8`, anchor 7; `topdelete` ⇔ `new.start === 0`) | Accepted | It is the only convention under which system design §6 "anchors at `new.start`" (as the 1-based line before the gap) and "`topdelete` when `new.start = 0`" both hold. It matches git-diff numbering in `hunkPatch` (`count 0 → start`) and was confirmed with real `git apply` (delete at EOF, top delete). |
| `changedelete`: `≃` on the last changed line, `~` on earlier lines | Accepted | UI design §7 Component: Git sign column ("Last changed line of a change that also removed lines") governs glyph placement. |
| `prevHunkLine` from inside a hunk returns that hunk's first line | Accepted | Matches V6 ("first line of adjacent hunk", no wrap) and the UI "Navigate hunks" flow; same as Vim `[c`. |
| `explorerMarkers` returns `ReadonlyMap` | Accepted | A narrower read-only type over the same `Map`; `.get`/`.has` consumers in the UI design code shape are unaffected, and it protects the memoized value. |
| Synthetic `{ index: "D", worktree: "." }` entry for a rename origin under the prefix | Accepted | Implements §6 "the original path counts as deleted only when it is under `prefix`"; a real record for the path replaces it. |
| `RepoHead` exported from `status.ts` | Accepted | Plan T5 allows defining the head type in features for `RepoInfo.head` reuse; its shape equals system design §6 `RepoInfo.head`; knip reports zero findings. |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V1` | `S7` | `DES2` | `bun test src/core/features/git` — `diff.test.ts` "one change, one add, and one delete…" | Exact `toEqual` on all fields (`change@2`, `add@5`, `delete` `new.start 8` = anchor 7) plus revert equals old | `Passed` |
| `V2` | `S7` | `DES2` | `diff.test.ts` "a deletion at the top and a change that also removes lines…" | `topdelete` and `changedelete` with exact ranges; revert equals old | `Passed` |
| `V3` | `S7` | `DES2` | `diff.test.ts` "an untracked file is one untracked hunk…" | One `untracked` hunk `new {0,3}` | `Passed` |
| `V4` | `S19` | `DES2` | `diff.test.ts` "diffs with nothing in common or too many edits…" | 5,000 disjoint lines and 5,000 lines with ~5,000 edits each return one change hunk over the trimmed middle, each under 50 ms | `Passed` |
| `V5` | `S7` | `DES10`, `DES12` | `signs.test.ts` glyph set, anchor lines, visible-only, change-over-delete cases | Exact decoration lists; no decoration sets `sign` | `Passed` |
| `V6` | `S7` | `DES10` | `signs.test.ts` "next and previous hunk move between first lines and stop at the ends" | Inside/before/after cases; `undefined` at both ends and on empty input | `Passed` |
| `V7` | `S18` | `DES3` | `index-text.test.ts` round-trip case | CRLF, no final newline, BOM, `""`, `"\n"` round-trip exactly | `Passed` |
| `V8` | `S18` | `DES3` | `index-text.test.ts` "equal content in an LF index and a CRLF buffer has no hunks" | `[]` | `Passed` |
| `V9` | `S8` | `DES12` | `bun test src/core/kernel/view` — `text-view.test.ts` block-replace case | Replace row 3–6 carries `changeSign` `~` from line 5 and no `sign`; rows 0 and 7 equal today's shape | `Passed` |
| `V63` | `S32` (kernel side) | `DES12` | `text-view.test.ts` "sign and change sign merge independently…" | Row has `sign ▕` and later `changeSign +`; a plain row's keys are exactly `sourceLine`, `spans` | `Passed` |
| `V14` | `S24`, `S9` | `DES6` | `status.test.ts` fixture case | Workspace-relative keys only; rename origin consumed (inside origin as deleted, outside ignored); submodule single entry; detached head `1234567`; paths with spaces kept | `Passed` |
| `V16` | `S9` | `DES10` | `status.test.ts` "each row gets one marker…" | One marker per path; `MM` → `modified` | `Passed` |
| `V17` | `S9` | `DES10` | `status.test.ts` "ancestor folders contain changes…" | `old`, `trash`, `trash/deep` → `contains`; no `old/gone.md` key; memo returns the same map | `Passed` |
| `V22` | `S5` (patch text), `S1` (one-hunk invariant) | `DES4` | `patch.test.ts` six exact-string cases | Insert `@@ -4,0 +5,1 @@`, delete numbering, EOF no-newline on either side, CRLF `\r\n` on both sides, BOM on line 0, untracked `@@ -0,0 +1,2 @@` all match | `Passed` for the listed shapes; the invariant fails for an empty index entry (P1-G1-VER1) |
| `V24` | `S11` | `DES11` | `blame.test.ts` three cases | Committed fields; zero SHA, `Not Committed Yet`, and `<external.file>` each read `{ committed: false }` | `Passed` |
| Feature and kernel units | V1–V9, V14, V16, V17, V22, V24, V63 | `DES2`–`DES4`, `DES6`, `DES10`–`DES12` | `bun test src/core/features/git src/core/kernel/view` | 60 pass, 0 fail, 9 files | `Passed` |
| Boundaries | None | Layer rules | `bun test test/boundaries.test.ts`; import inspection | 2 pass; `src/core/features/git/*` imports only `../../kernel/view/*` and siblings, no packages; `index-text.ts` does not import `src/core/state` | `Passed` |
| Static and unit gate | None | TypeScript rules | `bun run check` | biome clean (337 files), tsc clean, knip zero findings, 1129 pass | `Passed` |
| Existing rendering unchanged | `S32` (no change outside a repo) | `DES12` | `bun test test/ui`; `git diff --stat 6e3eba5..0c4d9f9 -- test` | 157 pass, 63 snapshots; no `test/` file changed | `Passed` |
| No process ids in code | None | `.s1mple/S1MPLE.md` Implementation | `grep -rnE "W261005F2A7\|\b(REQ\|DES\|UDES\|UV)[0-9]" src test`; extra grep for `S`/`V`/`US`/`UREQ`/group ids in the changed files | No matches in either grep | `Passed` |
| Extra: diff and navigation fuzz | `S7` | `DES2`, `DES10` | Scratch script, 3 seeds × 20,000 random pairs (≤ 12 lines, 1–5 symbols) against an LCS oracle | Revert reproduces `old`; `oldLines` equal `old` ranges; constant offset between hunks; minimal edit count whenever a line is shared; kinds follow the §7 rules; signs sorted; `next`/`prev` walks agree | `Passed` |
| Extra: real `git apply --cached --unidiff-zero` | `S1`, `S5` | `DES4` | Scratch temp repo, 7 shapes | Applied: second of two hunks only, delete at EOF, file emptied, top delete + delete, CRLF add without final newline. Rejected: empty index entry gaining text, with or without a final newline (`error: patch failed: f.txt:1`) | `Failed` (P1-G1-VER1) |

Observation, not a finding: a `topdelete` and a `delete` with `new.start 1` both anchor on line 0 (the only shared-anchor pair the fuzz produced, 628 of 50,000 pairs). Line 0 then shows `‾`, `hunkAt(0)` returns the `topdelete`, and `]h` reaches the second hunk only after the first is staged or reset. This follows from the design's one-sign-per-line rule and line-anchored navigation (gitsigns behaves the same way), so no change is required in this group.

## Findings

### P1-G1-VER1 — Major — Specification / technical correctness — Stage patch fails for an empty index entry

- **System Design:** `REQ1@R2`, `REQ4@R3`; `DES4` (patch invariant), `DES2` (classification); `S1`, `S7`; `V22`, `V2`
- **UI Design:** `UREQ2@R1 → UDES2@R1 → US2@R1` (kind glyph)
- **Evidence:** `normalizeIndexText("", "lf")` returns `{ lines: [""], finalNewline: false }` (`src/core/features/git/index-text.ts:27`), which matches the buffer model of an empty file. `diffLines([""], ["hello"])` therefore returns `{ kind: "change", old: { start: 0, count: 1 }, new: { start: 0, count: 1 }, oldLines: [""] }`. `hunkPatch` (`src/core/features/git/patch.ts:22-32`) writes that as:

  ```text
  @@ -1,1 +1,1 @@
  -
  \ No newline at end of file
  +hello
  \ No newline at end of file
  ```

  In a temp repo with a committed empty `f.txt`, `git apply --cached --unidiff-zero -` rejects it: `error: patch failed: f.txt:1` / `patch does not apply`. The same happens when the buffer has a final newline. The equivalent zero-line form `@@ -0,0 +1,1 @@\n+hello\n\ No newline at end of file\n` applies and stages `hello`. The hunk is also classified `change`, so the line shows `~` instead of the add glyph `+`.
- **Impact:** For a note that was committed empty (a common way to start a note), every stage-hunk attempt fails with a Git error until the index changes some other way. The §7 `patch.ts` invariant "applying the patch … to an index holding `index` stages exactly one hunk" fails for that input, and the sign misreports added lines as changed.
- **Required resolution:** When the index entry is empty (zero bytes: `lines` is `[""]`, no final newline, no BOM), adding text produces an `add` hunk (`+` sign) and a patch that `git apply --cached --unidiff-zero` accepts (old side `-0,0`, no `-` line), staging exactly the added lines. An empty buffer against an empty index still gives no hunk. The fix may live in `diffLines`, `hunkPatch`, or both, but it must stay pure and must not change the `Hunk`, `IndexText`, or `hunkPatch` signatures.
- **Required proof:** New exact-string cases in `src/core/features/git/patch.test.ts` and `diff.test.ts` for an empty index gaining one line with and without a final newline, plus empty-vs-empty giving `[]`; a one-time real `git apply --cached --unidiff-zero` check on a committed empty file recorded in the remediation evidence; `bun test src/core/features/git` and `bun run check` pass.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:** `changeSign` merge and block-replace inheritance, and unchanged plain rows (V9, V63); every hunk kind, exact ranges, revert property, scattered edits, and both bounded fallbacks with timing (V1–V4); normalization round-trip and LF/CRLF equality (V7, V8); patch text for insert, delete, EOF no-newline on each side, CRLF, BOM, and untracked (V22); status prefix filtering, rename origins in and out of the prefix, unmerged, untracked, submodule, branch/unborn/detached heads, marker precedence, ancestor `contains`, deleted files, and memoization (V14, V16, V17); committed blame and each sentinel alone (V24); glyph map, anchors, visible range, change-over-delete, `hunkAt`, and navigation ends (V5, V6).
- **Missing:** Empty index entry (zero bytes) against a non-empty buffer in `diff.test.ts` and `patch.test.ts`: assert an `add` hunk and the `@@ -0,0 +1,n @@` patch with no `-` line (P1-G1-VER1).

## Scope Changes

None beyond the six recorded deviations, all judged acceptable above. The `Work: W261005F2A7 — git-integration` line in commit bodies is traceability metadata outside the codebase, which `.s1mple/S1MPLE.md` allows. The unstaged `.gitignore` change (`.worktrees/`) predates this group and was not touched.

## Unverified Items

- `S1` and `S5` end to end (stage through the reducer and adapter, `autocrlf=true`) belong to `V10`, `V11`, and Part 2 adapter tests; this group verifies only the pure patch text and a direct `git apply` of it.
- `S32` gutter width and painting, and `US1@R1`/`US2@R1`/`US5@R1`/`US8@R1` painted output, belong to Part 3; only their data side is verified here.

## Blockers

None
