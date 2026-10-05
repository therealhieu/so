# P1-G1 Implementation Report

## Scope

- **Goal:** `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-goal.md`
- **Plan Part:** `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-1-core.md`
- **Group:** `P1-G1` — git algorithms and change-sign channel
- **Tasks:** `P1-G1-T1`, `P1-G1-T2`, `P1-G1-T3`, `P1-G1-T4`, `P1-G1-T5`, `P1-G1-T6`, `P1-G1-T7`
- **Report:** `.s1mple/work/done/w261005f2a7-git-integration/reports/p1-g1-implementation-report.md`

Report commit SHAs are returned to the orchestrator and recorded in the execution goal; they are not written into this file because doing so would require a self-referential follow-up commit.

## Initial Implementation

Written by the implementer after the initial implementation turn and before returning to the orchestrator.

### Status

`Completed`

### Tasks

| Task | Changes | Verification | Commit evidence | Result |
|---|---|---|---|---|
| `P1-G1-T1` | `src/core/kernel/view/types.ts:RenderLine.changeSign`; `src/core/kernel/view/decorations.ts:Decoration` (line kind `changeSign`); `src/core/kernel/view/text-view.ts:layoutLine`, `layoutText`, module-local `lastChangeSignIn`; `src/core/kernel/view/text-view.test.ts` (2 cases) | RED: 2 new cases failed on the missing field and inheritance. GREEN: `bun test src/core/kernel/view` → 30 pass, 0 fail; `bun test test/ui` → 157 pass, 63 snapshots unchanged; `bun run check` → 1099 pass, 0 fail | `9d0c701` | `Completed` |
| `P1-G1-T2` | `src/core/features/git/diff.ts:HunkKind`, `Hunk`, `MAX_EDIT`, `diffLines` (private `hunk`, `kindOf`, `shareLine`, `editScript`); `src/core/features/git/diff.test.ts` (7 cases) | RED: module missing. GREEN: `bun test src/core/features/git/diff.test.ts` → 7 pass, 0 fail; the bounded cases run well under 50 ms (local probe: 5,000 lines with 5,000 edits 19.9 ms, exactly 2,000 edits 11.3 ms, one edit 0.06 ms); `bun run check` → 1106 pass | `2e8e0d0` | `Completed` |
| `P1-G1-T3` | `src/core/features/git/index-text.ts:IndexText`, `normalizeIndexText`; `src/core/features/git/index-text.test.ts` (3 cases) | RED: module missing. GREEN: `bun test src/core/features/git/index-text.test.ts` → 3 pass, 0 fail; `bun run check` → 1109 pass | `568ec51` | `Completed` |
| `P1-G1-T4` | `src/core/features/git/patch.ts:hunkPatch` (private `Cur`, `range`, `patchLine`); `src/core/features/git/patch.test.ts` (6 cases) | RED: module missing. GREEN: `bun test src/core/features/git/patch.test.ts` → 6 pass, 0 fail; extra check: patches for 7 shapes (LF change + add, no final newline on one or both sides, CRLF, delete, top delete, BOM) applied with real `git apply --cached --unidiff-zero` in a temp repo, and every staged blob equalled the target text; `bun run check` → 1115 pass | `d40c9ea` | `Completed` |
| `P1-G1-T5` | `src/core/features/git/status.ts:RepoHead`, `FileStatus`, `RepoStatus`, `Marker`, `parseStatus`, `explorerMarkers` (WeakMap memo); `src/core/features/git/status.test.ts` (5 cases) | RED: module missing. GREEN: `bun test src/core/features/git/status.test.ts` → 5 pass, 0 fail; extra check: real `git status --porcelain=v2 -z --branch -uall` output (unborn, rename with a space in the path, worktree delete, untracked folder, detached) parsed as expected in a temp repo; `bun run check` → 1120 pass | `7f4a5da` | `Completed` |
| `P1-G1-T6` | `src/core/features/git/blame.ts:BlameLine`, `parseBlame`; `src/core/features/git/blame.test.ts` (3 cases) | RED: module missing. GREEN: `bun test src/core/features/git/blame.test.ts` → 3 pass, 0 fail; fixtures follow real Git 2.51 `blame --porcelain` output, including `--contents -` (`External file (--contents)`, `<external.file>`); `bun run check` → 1123 pass | `1cce9a3` | `Completed` |
| `P1-G1-T7` | `src/core/features/git/signs.ts:GIT_SIGNS`, `hunkSigns`, `hunkAt`, `nextHunkLine`, `prevHunkLine` (private shared `linesOf`, `isDelete`); `src/core/features/git/signs.test.ts` (6 cases) | RED: module missing. GREEN: `bun test src/core/features/git/signs.test.ts` → 6 pass, 0 fail; `bun run check` → 1129 pass | `0c4d9f9` | `Completed` |

### Group Change Range

- **Starting commit:** `6e3eba5`
- **Final commit:** `0c4d9f9`
- **Remaining group changes:** None. `.gitignore` has an unstaged `.worktrees/` entry. It was not there at the start, it is not from this group, and it was left unstaged and uncommitted.

### Group Verification

- `bun test src/core/features/git src/core/kernel/view` → `Passed` — 60 pass, 0 fail, 9 files (V1–V9, V14, V16, V17, V22, V24, V63 cases included).
- `bun test test/boundaries.test.ts` → `Passed` — 2 pass, 0 fail; `src/core/features/git/*` imports only `src/core/kernel/view` and sibling feature modules, with no packages.
- `bun run check` → `Passed` — biome clean (337 files), tsc clean, knip zero findings, 1129 unit tests pass. knip flagged no exports: test files are knip entries, so exports used only by colocated tests count as used.
- `bun test test/ui` → `Passed` — 157 pass, 0 fail, 63 snapshots; `git diff --stat 6e3eba5..HEAD` touches no `test/` file, so no snapshot changed.
- `grep -rnE "W261005F2A7|\b(REQ|DES|UDES|UV)[0-9]" src test` → `Passed` — no matches. An extra grep for `S`/`V`/`US`/`UREQ`/group ids in the new and changed modules also found none.
- Process hygiene → `Passed` — temp repos and scratch scripts removed. No process started by this group is still running. The `bun run sandbox` and `bun run tui` processes that are running already existed and do not belong to this group.

### Deviations and Remaining Issues

Decisions a fresh remediator must keep:

1. **The 0-based convention for an empty side (`Hunk`).** A side with `count` 0 starts at its insertion point, which is the number of lines before the gap. So a `delete` that removes old line 7 in the V1 fixture is `new: { start: 8, count: 0 }`, and its anchor (the line before the gap) is line 7. A `topdelete` is exactly `new.start === 0`. The plan preview showed `new.start: 7` but said to "adjust start values to the documented 0-based convention". System design §6 says both "anchors at `new.start`" and "`topdelete` when `new.start = 0`". Those two rules agree only under this convention, because otherwise a deletion after line 0 could not be told apart from a top deletion. It also lines up with the other contracts:
   - `hunkPatch` writes git-diff numbering directly (`count 0 → start`, otherwise `start + 1`), as in `@@ -4,0 +5,1 @@`.
   - The UI float's "after line N" uses the 1-based anchor line, which equals `new.start`.
   - The anchor itself is derived in one place: `linesOf` in `signs.ts`.
2. **`changedelete` signs follow the UI design.** UI design §7 Component: Git sign column puts `≃` on the *last* changed line only, so the earlier lines of a `changedelete` hunk get `~` (`GIT_SIGNS.change`). The system design §7 sketch reads as `GIT_SIGNS[h.kind]` on every hunk line. The UI design governs glyphs, so its rule was used.
3. **`prevHunkLine` from inside a hunk.** It returns the first line of the nearest hunk that starts above the cursor. From a line inside a hunk (not its first line), that is the current hunk's first line, the same as Vim `[c` and gitsigns. From a hunk's first line, it is the previous hunk. Neither direction wraps around.
4. **`explorerMarkers` returns `ReadonlyMap<string, Marker>`.** The design says `Map`. The result is memoized and shared per `RepoStatus`, so the read-only type stops consumers from mutating the cached value. `.get` and `.has` work the same.
5. **Rename origins.** When the origin path is under the prefix, `parseStatus` records it as a deleted entry `{ index: "D", worktree: "." }`. This applies the §6 rule that the origin "counts as deleted", and it lets `explorerMarkers` mark the origin's folders. A real record for the same path replaces it, and it never replaces a real record. `RepoHead` is exported from `status.ts` so that `RepoInfo.head` in `src/core/state/types.ts` (P1-G2) can reuse it without features importing state.
6. **Commit bodies.** Each task commit body has a `Work: W261005F2A7 — git-integration` line under the plan's `Task:` line. The plan's messages do not specify that line. It is traceability metadata in commit bodies only, which project rules allow.

Remaining issues: None.

## Remediation

Append remediation evidence here after verifier findings. This is not a separate report. Preserve the Initial Implementation section unchanged.

- **Verification reports:** `.s1mple/work/done/w261005f2a7-git-integration/reports/p1-g1-verification-report.md` (commit `f38b422`, status `Failed`, one finding)
- **Status:** `Completed`

### Finding Closure

| Finding | Change and verification evidence | Commit evidence | Result |
|---|---|---|---|
| `P1-G1-VER1` — Stage patch fails for an empty index entry | See the closure detail below | `a4d613c` | `Fixed` |

#### P1-G1-VER1 — Stage patch fails for an empty index entry

**Change evidence.** The root cause was in the line model, not in the patch writer. Callers pass `index.lines` straight into `diffLines` (system design §5 flows: `diffLines(index.lines, buffer lines)`), and both a zero-byte entry (`""`) and a one-empty-line entry (`"\n"`) normalized to `[""]`. So `diffLines` could not tell "the file is empty" from "the file has one empty line", and it classified typed text as `change`. The fix gives a zero-byte entry no lines. That matches the design's `normalizeIndexText` sketch ("split; drop trailing `""`") and the existing untracked case, which already passes `[]`. With no lines on the old side, the existing whole-middle path in `diffLines` and the existing `range` rule in `hunkPatch` (`count 0 → start`) give an `add` hunk and an `@@ -0,0 +1,n @@` header without a `-` line. `patch.ts` needed no change. No signature changed.

| Path and symbol | Change |
|---|---|
| `src/core/features/git/index-text.ts:normalizeIndexText` | `lines: text === "" ? [] : …`. A `"\n"` entry and a BOM-only entry keep `[""]`, because Git sees one line in each. The `IndexText` doc comment states the zero-byte rule. |
| `src/core/features/git/diff.ts:diffLines` | `old.length === 0 && cur` is `[""]` returns `[]`. A buffer always has one line, so an empty buffer matches an empty entry. |
| `src/core/features/git/diff.test.ts` | "text typed into a note committed empty is one add hunk": `[] → ["hello"]` and `[] → ["", "hello"]` are exact `add` hunks `old {0,0}`; `[] → [""]` is `[]`. |
| `src/core/features/git/patch.test.ts` | "a note committed empty gains lines with an empty old side": exact `@@ -0,0 +1,1 @@\n+hello\n\\ No newline at end of file\n` without a final newline, and `@@ -0,0 +1,1 @@\n+hello\n` with one. |
| `src/core/features/git/index-text.test.ts` | `""` → `[]`, `"\n"` → `[""]`, BOM-only → `[""]`; BOM-only added to the round-trip list. |

**Verification evidence.**

- RED: with the two source files restored to `HEAD` (`0c4d9f9` content) and the new tests in place, `bun test src/core/features/git` → 29 pass, 3 fail (the three cases above). GREEN after restoring the fix → 32 pass, 0 fail.
- One-time real `git apply --cached --unidiff-zero -` (git 2.51.0) in a scratch repo per case. Each case commits `f.txt`, builds the patch with `normalizeIndexText`, `diffLines`, and `hunkPatch`, applies it, and compares `git show :f.txt` with the buffer text:

  | Committed `f.txt` | Buffer | Kind | Header | Applied | Staged equals buffer |
  |---|---|---|---|---|---|
  | empty (0 bytes) | `hello` | `add` | `@@ -0,0 +1,1 @@` | yes | yes |
  | empty (0 bytes) | `hello\n` | `add` | `@@ -0,0 +1,1 @@` | yes | yes |
  | empty (0 bytes) | `\nhello\n` | `add` | `@@ -0,0 +1,2 @@` | yes | yes |
  | `\n` (regression) | `hello\n` | `change` | `@@ -1,1 +1,1 @@` | yes | yes |
  | BOM only (regression) | `hello` | `change` | `@@ -1,1 +1,1 @@` | yes | yes |

  An empty buffer against an empty entry gave `[]`. The scratch script and temp repos were removed. No process is left running.
- Signs: `linesOf` in `src/core/features/git/signs.ts` marks an `add` hunk's new lines `[new.start, new.start + count)`, so the typed lines show `+` (`GIT_SIGNS.add`).

**Completion Checklist:**

- [x] Required resolution is implemented — a zero-byte entry gives an `add` hunk and an `-0,0` patch with no `-` line that stages exactly the added lines; empty against empty gives no hunk; the code stays pure; the `Hunk`, `IndexText`, and `hunkPatch` signatures are unchanged.
- [x] Required proof passes — new exact-string cases in `patch.test.ts` and `diff.test.ts` (one line with and without a final newline, empty against empty `[]`); real `git apply` on a committed empty file recorded above; `bun test src/core/features/git` and `bun run check` pass.
- [x] Change evidence is recorded.
- [x] Verification evidence is recorded.

**Note for later parts.** The design says `git.ts` (P1-G2) marks a final-newline difference by passing the last line with a sentinel suffix. Against a zero-byte entry there is no old last line. An empty buffer that ends in a newline (`"\n"`) therefore diffs as `[] → [""]`, which has no hunk unless that caller adds its sentinel to the buffer's line. This is caller behavior and is outside this group.

### Remediation Group Verification

- `bun test src/core/features/git src/core/kernel/view` → `Passed` — 62 pass, 0 fail, 9 files.
- `bun test test/boundaries.test.ts` → `Passed` — 2 pass, 0 fail. The changed files add no imports apart from a sibling `./index-text` import in `diff.test.ts`.
- `bun run check` → `Passed` — biome clean (337 files), tsc clean, knip zero findings, 1131 pass, 0 fail.
- `bun test test/ui` → `Passed` — 157 pass, 0 fail, 63 snapshots unchanged; no `test/` file changed.
- `grep -rnE "W261005F2A7|\b(REQ|DES|UDES|UV)[0-9]" src test` → `Passed` — no matches. An extra grep for `S`/`V`/`US`/`UREQ`/group/finding ids in the remediation diff also found none.
- Self-review of `6e3eba5..a4d613c` → no new issue. `normalizeIndexText` has no caller outside `src/core/features/git` yet, so the zero-byte rule changes nothing elsewhere.

## Final Status

`Completed`

### Final Evidence

- **Final report status:** `Completed` — every group task is complete and `P1-G1-VER1` is `Fixed`.
- **Final report commit:** Returned to the orchestrator after this report is committed.
- **Final commits:** `9d0c701`, `2e8e0d0`, `568ec51`, `d40c9ea`, `7f4a5da`, `1cce9a3`, `0c4d9f9`; remediation `a4d613c`.
- **Final checks:** `bun run check` → passed (1131 pass); `bun test src/core/features/git src/core/kernel/view` → 62 pass; `bun test test/boundaries.test.ts` → 2 pass; `bun test test/ui` → 157 pass, 63 snapshots unchanged; process-id grep → no matches; real `git apply --cached --unidiff-zero` on a committed empty file → applied and staged exactly the buffer text.
- **Remaining issues:** None. The unstaged `.gitignore` change (`.worktrees/`) does not belong to this group and was left untouched.
