# W261005F2A7: git-integration — Research

**Context Source:** `w261005f2a7-discuss-context.md`

**Requirements Source:** `w261005f2a7-requirements.md`

**Requirements Baseline Commit:** `62421b1`

**Evaluated Requirement Revisions:** `W261005F2A7-REQ1@R1`, `W261005F2A7-REQ2@R1`, `W261005F2A7-REQ3@R1`, `W261005F2A7-REQ4@R1`, `W261005F2A7-REQ5@R1`, `W261005F2A7-REQ6@R1`, `W261005F2A7-REQ7@R1`, `W261005F2A7-REQ8@R1`, `W261005F2A7-REQ9@R1`

**Research Policy:** One substantive research pass; immutable after acceptance and commit.

# Table of Contents

1. [Research Objective](#1-research-objective)
2. [Research Findings](#2-research-findings)
   - [RF1: gitsigns diffs the buffer against the index blob in-process](#rf1-gitsigns-diffs-the-buffer-against-the-index-blob-in-process)
   - [RF2: Hunk staging is a zero-context patch piped to git apply --cached](#rf2-hunk-staging-is-a-zero-context-patch-piped-to-git-apply---cached)
   - [RF3: Zero-context patches apply silently against a changed index](#rf3-zero-context-patches-apply-silently-against-a-changed-index)
   - [RF4: Line endings, BOM, and encoding must match the index form](#rf4-line-endings-bom-and-encoding-must-match-the-index-form)
   - [RF5: gitsigns reset hunk is an ordinary buffer edit](#rf5-gitsigns-reset-hunk-is-an-ordinary-buffer-edit)
   - [RF6: Lock-free reads prevent index writes and watcher loops](#rf6-lock-free-reads-prevent-index-writes-and-watcher-loops)
   - [RF7: Editors watch the git dir non-recursively and filter lock files](#rf7-editors-watch-the-git-dir-non-recursively-and-filter-lock-files)
   - [RF8: One rev-parse call resolves top level, git dir, common dir, and prefix](#rf8-one-rev-parse-call-resolves-top-level-git-dir-common-dir-and-prefix)
   - [RF9: Porcelain v2 status is root-relative, NUL-safe, and cheap when scoped](#rf9-porcelain-v2-status-is-root-relative-nul-safe-and-cheap-when-scoped)
   - [RF10: LazyVim and Helix save before lazygit and reload after it](#rf10-lazyvim-and-helix-save-before-lazygit-and-reload-after-it)
   - [RF11: OpenTUI suspend and resume reset and restore every terminal mode](#rf11-opentui-suspend-and-resume-reset-and-restore-every-terminal-mode)
   - [RF12: Ctrl-C during the hand-off reaches so's shutdown handler](#rf12-ctrl-c-during-the-hand-off-reaches-sos-shutdown-handler)
   - [RF13: Single-line blame uses -L with --contents for unsaved text](#rf13-single-line-blame-uses--l-with---contents-for-unsaved-text)
   - [RF14: Pure-JS Myers diff is fast on 5,000 lines except when nothing matches](#rf14-pure-js-myers-diff-is-fast-on-5000-lines-except-when-nothing-matches)
3. [Sources](#3-sources)
4. [Confidence and Open Questions](#4-confidence-and-open-questions)

# 1. Research Objective

The baseline requirements commit so to the LazyVim split: native gitsigns-style awareness with two Git writes (stage hunk, reset hunk) and a full-screen lazygit hand-off. They were written without research (`w261005f2a7-requirements.md:7`, `:482`). This pass checks the mechanisms they assume against how gitsigns.nvim, LazyVim, lazygit, VS Code, Zed, Helix, and micro actually work, and against the pinned OpenTUI `0.5.14` source. Its findings can inform the post-research reconciliation of REQ1–REQ9 and give system design proven patterns, measured costs, and known pitfalls. It does not choose an implementation.

Every local experiment ran on macOS (Darwin 23.4.0) with Git `2.51.0` and Bun `1.4.2` in the session scratchpad. Timings are single-machine medians and indicate scale only.

**Research Questions:**

- How does gitsigns.nvim compute hunks (diff algorithm, index blob source, debounce, untracked/ignored handling) and stage and reset a hunk (exact `git apply` flags, patch construction, zero-context handling, unsaved buffers)? Which pitfalls are documented (CRLF, no trailing newline, encoding, large files)?
- How do gitsigns and other editors detect external Git changes (watching `.git`, `HEAD`/`index`/refs, worktrees where `.git` is a file, `--no-optional-locks`, `GIT_OPTIONAL_LOCKS`), and what feedback-loop or performance problems are reported?
- How do LazyVim, snacks.nvim, and lazygit.nvim launch lazygit and refresh after exit; how do terminal editors without an embedded terminal (Helix, micro) hand off the terminal; what do OpenTUI's `CliRenderer.suspend()`/`resume()` do for alt screen, raw mode, mouse, the kitty keyboard protocol, and stdin listeners; and what happens when the child crashes or is killed?
- What is the most efficient, correct way to get repo-wide file status for explorer markers and the statusline (porcelain v2 `-z`, `--untracked-files`, pathspec scoping, submodules, renames), and what performance numbers exist for large repositories (fsmonitor, untracked cache)?
- How do gitsigns and others implement single-line blame (`--porcelain`/`--incremental`, `-L`, `--contents -`, "Not Committed Yet"), and what does it cost?
- Which TypeScript line-diff algorithms and libraries give gitsigns-quality hunks under Bun, with what size, license, and performance on ~5,000-line files, and do they survive `bun build --compile`?

# 2. Research Findings

## RF1: gitsigns diffs the buffer against the index blob in-process

**Question:** How does gitsigns.nvim compute hunks, including the blob source, algorithm, debounce, and untracked/ignored handling?

**Finding:** gitsigns reads each file's index entry with one `git ls-files --stage --others --exclude-standard --eol <file>` call. It caches the index blob text from `git show <blob-oid>`, then diffs it against the live buffer in-process on a worker thread after a 100 ms trailing debounce. This matches REQ5's model. Two gitsigns defaults differ from the baseline: untracked files are not attached unless `attach_to_untracked = true`, and buffers over 40,000 lines are skipped. Untracked files get their own sign type in LazyVim, separate from "added".

**Requirements Evaluated:**

- `W261005F2A7-REQ5@R1` — Gutter signs compare the live buffer against the index, debounced; untracked shows all lines as added; ignored shows nothing.
- `W261005F2A7-REQ4@R1` — Native display scope, including distinct signs and statusline counts.

**Potential Requirement Impact:** The evidence supports REQ5's comparison base, the caching of the blob per index change, and debouncing. It adds three considerations. First, the untracked behaviour REQ5 requires is opt-in in gitsigns, but LazyVim shows untracked lines with a dedicated `untracked` sign. Second, both tools set a large-file cut-off that REQ5 does not state. Third, gitsigns separates `changedelete` and `topdelete` signs, while REQ4 names only three types.

**Evidence:**

- The file-info read is `ls-files --stage --others --exclude-standard --eol <file>`. Its comment says ignored files "won't return info, but untracked files will". Stage > 1 marks a conflict, and `--eol` yields `i/crlf`/`w/crlf` — [gitsigns `git/repo.lua` L794–850](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/repo.lua#L794-L850).
- The index text comes from `git show <object>` with `text = false` and is cached in `bcache.compare_text`. The diff runs `run_diff(bcache.compare_text, buftext)` — [gitsigns `git/repo.lua` L448–458](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/repo.lua#L448-L458), [gitsigns `manager.lua` L171–184](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/manager.lua#L171-L184).
- The diff is Neovim's built-in xdiff (`vim.text.diff`/`vim.diff`, `result_type = 'indices'`). It runs on a libuv worker thread when `_threaded_diff` is true, which is the default. The algorithm comes from `'diffopt'`, whose Neovim default is `internal,filler,closeoff,indent-heuristic,inline:char,linematch:40`, with `myers` as the default algorithm — [gitsigns `diff_int.lua` L50–66](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/diff_int.lua#L50-L66), [gitsigns `config.lua` L141–175, L892–898](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/config.lua#L141-L175), [Neovim `options.txt` 'diffopt'](https://github.com/neovim/neovim/blob/master/runtime/doc/options.txt).
- Defaults are `update_debounce = 100`, `max_file_length = 40000`, and `attach_to_untracked = false`. Attach refuses untracked files unless that flag or `force` is set — [gitsigns `config.lua` L589–634](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/config.lua#L589-L634), [gitsigns `attach.lua` L362–367](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/attach.lua#L362-L367).
- Statusline counts use `get_summary`. For a `change` hunk, `min(added, removed)` lines count as changed, and the remainder counts as added or removed — [gitsigns `hunks.lua` L385–403](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/hunks.lua#L385-L403).
- LazyVim configures `add`/`change`/`changedelete`/`untracked` as `▎` and `delete`/`topdelete` as a Nerd Font triangle. It also defines separate `signs_staged` — [LazyVim `plugins/editor.lua` L134–150](https://github.com/LazyVim/LazyVim/blob/999700997f72227187d49d8b92667183dc7fc809/lua/lazyvim/plugins/editor.lua#L134-L150).

**Rationale and Examples:** The gitsigns flow maps directly onto so's one-way protocol. The blob read is an effect in `src/workspace`, and the diff of two string arrays is pure, so it fits in `src/core`. The per-keystroke cost is only the diff (RF14).

```text
open / index changed → ls-files -s --others --exclude-standard --eol <path>  (oid, mode, eol, untracked?, conflict?)
                     → git show <oid> (or cat-file blob) → cache indexLines
keystroke → debounce 100 ms → diff(indexLines, bufferLines) → hunks → signs / counts / nav
```

**Tradeoffs and Limitations:**

- The gitsigns thread offload has no direct equivalent on so's main thread. RF14 shows typical diffs take well under 1 ms, and the worst case is RF14's main risk.
- gitsigns' 40,000-line cut-off is a gitsigns choice, not a measured threshold. so already refuses text files over 16 MiB (`src/workspace/fs.ts:50-63`).

**Reconciliation Considerations:**

- Decide whether untracked files use the "added" sign (REQ5 as written) or a distinct untracked sign as in LazyVim.
- Consider stating a line-count or size limit above which signs are off.
- Decide whether REQ4's "deleted" sign must tell a deletion at the top of the file (`topdelete`) and a change that also deletes lines (`changedelete`) apart from a plain deletion.

## RF2: Hunk staging is a zero-context patch piped to git apply --cached

**Question:** How does gitsigns stage a hunk: exact flags, patch construction, zero-context handling, untracked files, and unsaved buffers?

**Finding:** gitsigns builds a zero-context unified patch for the one hunk. The patch has a fake `index 000000..000000 <mode>` line and `\ No newline at end of file` markers. gitsigns pipes it to `git apply --whitespace=nowarn --cached --unidiff-zero -`. Before applying, it runs `git add --intent-to-add` for a file not yet in the index. gitsigns stages the hunk computed from the *unsaved* buffer text without saving, so REQ9's save-first rule is a deliberate departure from gitsigns. Local tests confirmed every header form REQ1 needs.

**Requirements Evaluated:**

- `W261005F2A7-REQ1@R1` — Native writes limited to stage and reset; stage adds exactly the hunk under the cursor.
- `W261005F2A7-REQ9@R1` — Stage saves the buffer first, then stages from saved text.
- `W261005F2A7-REQ5@R1` — Untracked files show as one added hunk; stage uses the same hunks.

**Potential Requirement Impact:** The evidence supports REQ1's `git apply --cached` mechanism and constrains it. It needs `--unidiff-zero`, a no-newline marker on final-line hunks, and an intent-to-add step for untracked files. Without that step, REQ5's untracked "added" hunk cannot be staged at all. REQ9 is consistent with the mechanism, but it differs from gitsigns, which never saves.

**Evidence:**

- The exact command is `apply --whitespace=nowarn --cached --unidiff-zero -` with the patch on stdin. After it, gitsigns sleeps 100 ms because "staging operations cause IO of the git directory" — [gitsigns `git.lua` L260–293](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git.lua#L260-L293).
- Patch construction writes `diff --git a/p b/p` and `index 000000..000000 <mode_bits>`, then `@@ -start,pre +start+offset,now @@` (an `add` hunk uses `start + 1`) and `\ No newline at end of file` after the side that reaches EOF — [gitsigns `hunks.lua` L329–381](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/hunks.lua#L329-L381), [gitsigns `diff_int.lua` L76–103](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/diff_int.lua#L76-L103).
- `ensure_file_in_index` runs `add --intent-to-add <file>` when there is no index object. For conflicted files it writes the stage-1 entry. Staging refuses a file that does not exist on disk — [gitsigns `git.lua` L226–241](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git.lua#L226-L241), [gitsigns `actions.lua` L296–346](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/actions.lua#L296-L346).
- `stage_hunk` takes the hunk from `bcache` (buffer versus index). After staging, it patches the cached index text in place (`Hunks.apply_to_text`) instead of re-reading it — [gitsigns `actions.lua` L313–340](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/actions.lua#L313-L340).
- Git's documentation says `--unidiff-zero` bypasses the "at least one line of context" safety checks and that "the usage of context-free patches is discouraged" — [git-apply documentation](https://git-scm.com/docs/git-apply).
- Local test (Git 2.51.0) results:
  - Staging one of two hunks left the other unstaged.
  - The same patch without `--unidiff-zero` failed with `patch does not apply`.
  - Pure-insertion headers `-4,0` (git-diff style) and `-5,0` (gitsigns `start+1` style) produced identical results, and so did `-0,0` and `-1,0` at the top of the file.
  - A final-line change with `\ No newline at end of file` on both sides applied correctly.
  - On an untracked file, `git apply --cached` failed with `new.md: does not exist in index` until `git add --intent-to-add`. Then staging only line 1 worked, and the status became `AM`.

**Rationale and Examples:** The patch is small and deterministic. It is built from pure hunk data, and only the adapter pipes it into Git.

```text
diff --git a/notes/inbox.md b/notes/inbox.md
index 000000..000000 100644
--- a/notes/inbox.md
+++ b/notes/inbox.md
@@ -3,1 +3,1 @@
-- [ ] buy milk
+- [x] buy milk
```

**Tradeoffs and Limitations:**

- `--unidiff-zero` gives up Git's context check, and RF3 shows a consequence.
- gitsigns' design (stage unsaved text) and REQ9 (save then stage) are both coherent. REQ9 avoids a staged-but-unsaved state, but the cost is a save on every stage.

**Reconciliation Considerations:**

- REQ1 and REQ5 together imply the intent-to-add step for untracked files. Decide whether that write is an acceptable part of "stage hunk", because it creates an index entry for the file.
- Consider stating how stage behaves on a conflicted file (stage > 1). gitsigns rewrites the index entry there, which REQ1 does not list.

## RF3: Zero-context patches apply silently against a changed index

**Question:** What pitfalls follow from `--unidiff-zero` patches when the index blob so diffed against is stale?

**Finding:** A zero-context pure insertion carries no lines that Git can verify. If the index changed after so read the blob (staging in lazygit, another terminal, a hook), `git apply --cached` still succeeds and puts the line at the wrong position. The fake `index <oid>..` line is not checked. Change and delete hunks are partly protected, because their `-` lines must match.

**Requirements Evaluated:**

- `W261005F2A7-REQ1@R1` — Stage adds exactly the hunk under the cursor.
- `W261005F2A7-REQ9@R1` — `git diff --cached` contains the hunk after staging.
- `W261005F2A7-REQ6@R1` — Index blobs refresh on index changes, debounced about 200 ms.

**Potential Requirement Impact:** This challenges REQ1's "exactly the hunk" criterion under concurrency. REQ6's debounced refresh leaves a window of about 200 ms or more in which the cached blob can be stale. Reconciliation could consider a freshness check before stage, such as comparing the index oid just before applying, or an alternative write path.

**Evidence:**

- Local test results:
  - The index held `a b c` and the patch was `@@ -2,0 +3,1 @@ +NEW`.
  - Rewriting the index to `x a b c` before applying gave `x a NEW b c`, with exit 0.
  - Writing the real old oid in the `index <oid>..0000000` line did not change the result.
- gitsigns does not re-check the index before applying. It serialises operations per file with `git_obj:lock` and relies on the watcher refresh — [gitsigns `actions.lua` L313–340](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/actions.lua#L313-L340).
- Git warns that context-free patches lose "good safety measures" — [git-apply documentation](https://git-scm.com/docs/git-apply).

**Rationale and Examples:**

```text
so reads index blob (oid A) ──► user stages a line in lazygit/other terminal (oid B)
   └─ watcher debounce not yet fired ──► stage hunk: patch vs A applied to B → wrong line, exit 0
```

One cheap guard is a single `ls-files -s -- <path>` (about 18 ms locally, RF6) just before applying. A mismatching oid means re-read and re-diff. A second pattern also exists in gitsigns: `stage_lines` writes a complete blob through `hash-object` and `update-index --cacheinfo`. It suits a design that applies the hunk to the index text in-process. It replaces the index entry as a whole, so it still needs the same oid check — [gitsigns `git.lua` L243–251](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git.lua#L243-L251).

**Tradeoffs and Limitations:**

- The race needs a concurrent index change within the debounce window, so it is rare for a single user. The scenario is still realistic when lazygit runs in another split, and the failure is silent.
- The guard itself is not atomic. A change between the oid check and `git apply` remains possible, but the window shrinks to milliseconds.

**Reconciliation Considerations:**

- Consider adding an acceptance criterion: if the index entry changed since the hunks were computed, stage refreshes or refuses instead of staging at the wrong position.

## RF4: Line endings, BOM, and encoding must match the index form

**Question:** Which CRLF, no-trailing-newline, and encoding pitfalls affect diffing and staging?

**Finding:** The index blob can use different line endings from the working file (`core.autocrlf`, `.gitattributes eol`). A patch that keeps `\r` from the working text fails to apply to an LF index. gitsigns handles exactly the case `i/lf` + `w/crlf`: it appends `\r` to blob lines for diffing and strips `\r` from the patch. It also converts non-UTF-8 buffers with iconv. so's reader already strips the BOM and records `eol`, so so's buffer lines and the raw blob can differ in BOM and CR even when the content is unchanged.

**Requirements Evaluated:**

- `W261005F2A7-REQ5@R1` — Buffer-versus-index hunks.
- `W261005F2A7-REQ1@R1` — Stage applies exactly the hunk; reset restores the index version.

**Potential Requirement Impact:** This adds a correctness constraint REQ5 and REQ1 do not state. Both sides of the diff must be normalised the same way: BOM, CRLF, and the final newline. The patch and any reset text must then be written back in the index's and the buffer's own forms respectively. Without this, a CRLF note shows every line as changed (RF14's worst case) or fails to stage.

**Evidence:**

- gitsigns reads `i/crlf`/`w/crlf` from `ls-files --eol`. For `not i_crlf and w_crlf` it adds `\r` to each blob line except the last when diffing, and removes `\r$` from each patch line before `git apply` — [gitsigns `git.lua` L127–134, L267–272](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git.lua#L127-L134), [gitsigns `git/repo.lua` L838–845](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/repo.lua#L838-L845).
- gitsigns converts blob text from the buffer's `fileencoding` with `vim.iconv` and skips UTF-16/32 — [gitsigns `git/repo.lua` L435–458](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/repo.lua#L435-L458).
- Local test with `core.autocrlf=true` (`ls-files --eol` → `i/lf w/crlf`): a patch with `-b\r`/`+B\r` failed (`patch does not apply`). The same patch with CR stripped staged `a\nB\nc\n`.
- so reads UTF-8 only, strips a BOM into `bom`, and sets `eol` to `"\r\n"` when any CRLF exists (`src/workspace/fs.ts:76-86`, `src/core/state/types.ts:29-33`).

**Rationale and Examples:**

```text
index blob (i/lf):   "a\nb\nc\n"          so buffer: lines [a, b, c], eol "\r\n", bom false
compare:             split blob on \n (strip one \r per line if i/crlf) vs buffer lines
patch to apply:      lines in the index form (no \r for i/lf; with \r for i/crlf)
```

**Tradeoffs and Limitations:**

- The raw blob from `git show <oid>`/`cat-file blob` is the "clean" form. Other `.gitattributes` filters (for example `git-lfs` pointers or `ident`) make the worktree differ from the blob for reasons gitsigns does not handle. This research found no editor handling them beyond EOL.
- so refuses non-UTF-8 files (`src/workspace/fs.ts:72-79`), so gitsigns' encoding branch does not apply. The index blob could still be non-UTF-8 for a file whose working copy is UTF-8, a case this research did not test.

**Reconciliation Considerations:**

- Consider an acceptance criterion: a CRLF note (or `autocrlf=true`) with one edited line shows exactly one changed line and stages cleanly.
- Consider how a BOM in the blob but not the buffer, or the reverse, is treated: as a first-line change or ignored.

## RF5: gitsigns reset hunk is an ordinary buffer edit

**Question:** How does gitsigns reset a hunk?

**Finding:** gitsigns resets a hunk by replacing the buffer lines with the hunk's index lines (`removed.lines`) through a normal buffer edit. It never touches Git or disk directly. When the hunk changes the final-newline state, it also sets `endofline`. This is what REQ1 specifies.

**Requirements Evaluated:**

- `W261005F2A7-REQ1@R1` — Reset is an undoable buffer edit saved through the normal path.

**Potential Requirement Impact:** The evidence supports REQ1's reset semantics as written. It adds one consideration: a hunk at EOF must restore the index's trailing-newline state, which so tracks per buffer as `eol`/final newline.

**Evidence:**

- `reset_hunk` computes the range from `hunk.added`. For a `delete` hunk it inserts at `added.start`, for others it replaces `added.count` lines, and it calls `util.set_lines(bufnr, lstart, lend, hunk.removed.lines)`. When `removed.no_nl_at_eof ~= added.no_nl_at_eof`, it sets `endofline`/`fixendofline` — [gitsigns `actions.lua` L355–374](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/actions.lua#L355-L374).
- LazyVim maps it as `<leader>ghr` → `:Gitsigns reset_hunk` — [LazyVim `plugins/editor.lua` L176–182](https://github.com/LazyVim/LazyVim/blob/999700997f72227187d49d8b92667183dc7fc809/lua/lazyvim/plugins/editor.lua#L176-L182).

**Rationale and Examples:** In so the reset becomes one `applyBufferEdits` step (one `u`), and the existing save path writes it, so neither the watcher nor the conflict dialog is involved.

**Tradeoffs and Limitations:**

- None material beyond the EOF newline case.

**Reconciliation Considerations:**

- Consider an acceptance criterion for resetting a final-line hunk where only one side has a trailing newline.

## RF6: Lock-free reads prevent index writes and watcher loops

**Question:** How do editors keep Git reads from writing the index, and what does that cost?

**Finding:** `git status` refreshes the index's stat cache by default and writes it through `index.lock`. A git-dir watcher sees that write as an index change and starts another status run. gitsigns passes `--no-optional-locks` on every command, and VS Code sets `GIT_OPTIONAL_LOCKS=0` for status. Locally, a lock-free status wrote nothing and produced zero watcher events, while a plain status produced `index.lock` + `index` events. The cost: lock-free reads never refresh stale stat data. After 10,000 files were touched, every lock-free status took about 206 ms instead of about 47 ms until some locking command (lazygit, a plain `git status`) refreshed the index.

**Requirements Evaluated:**

- `W261005F2A7-REQ6@R1` — Status reads must not modify the index and must not trigger further refreshes.
- `W261005F2A7-REQ4@R1` — Statusline and explorer state from status reads.

**Potential Requirement Impact:** The evidence supports REQ6's "must not modify the index" rule and its "own reads do not trigger refreshes" criterion, and names the exact mechanism. It adds a performance consideration: stat-dirty files (after a mass touch, checkout, or sync tool) make every refresh slower until something else refreshes the index.

**Evidence:**

- gitsigns' base argv for every command is `git --no-pager --no-optional-locks --literal-pathspecs -c gc.auto=0 -c core.quotepath=off -c color.ui=false -c color.diff=false` — [gitsigns `git/cmd.lua` L21–34](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/cmd.lua#L21-L34).
- VS Code's `getStatus` sets `env = { GIT_OPTIONAL_LOCKS: '0' }` and runs `status -z -uall` (or `-uno`) — [VS Code `extensions/git/src/git.ts` L2794–2817](https://github.com/microsoft/vscode/blob/dae0d5919e9b1f53260f547f20e55a99db97c7a4/extensions/git/src/git.ts#L2794-L2817).
- Git's documentation: status "will automatically refresh the index … and writing out the result … Scripts running `status` in the background should consider using `git --no-optional-locks status`". `--no-optional-locks` "is equivalent to setting the `GIT_OPTIONAL_LOCKS` to `0`" — [git-status documentation](https://git-scm.com/docs/git-status), [git documentation](https://git-scm.com/docs/git).
- Several 2026 projects report the same loop or lock contention and fix it with `GIT_OPTIONAL_LOCKS=0` — [zai-org/feedback #552](https://github.com/zai-org/feedback/issues/552), [open-gsd/gsd-core #5048](https://github.com/open-gsd/gsd-core/issues/5048), [ned2/dashpot #537](https://github.com/ned2/dashpot/issues/537).
- Local tests:
  - The index mtime was unchanged across three lock-free status runs and changed after one plain `git status`.
  - A Bun `fs.watch` on `.git` saw 0 events for lock-free status and blame, and `rename index.lock | rename index` for plain status.
  - Over 20,000 tracked files with all 10,000 notes touched, lock-free status took 206/211/212 ms. It dropped to 47 ms after one plain `git status`.

**Rationale and Examples:**

```text
plain status → writes .git/index → watcher "index" → status → (stat still racy) → writes index → …   loop
lock-free status → no write → no event → done
```

**Tradeoffs and Limitations:**

- `--no-optional-locks` also stops status from updating the untracked cache and fsmonitor token stored in the index. Those caches speed up only when other commands write the index (see RF9).
- so's own atomic saves change mtime and inode, so each saved file stays stat-dirty, and lock-free status re-hashes it, until something refreshes the index. The cost per file is small, but it grows with the number of files saved.

**Reconciliation Considerations:**

- Consider whether REQ6 should state that every Git read (status, `ls-files`, `cat-file`/`show`, blame) is lock-free, not only status.
- Consider whether the stale-stat slowdown matters enough to need a budget in REQ6, since so must not refresh the index itself under REQ6.

## RF7: Editors watch the git dir non-recursively and filter lock files

**Question:** Which git-dir paths do editors watch, how do they debounce, and how do they handle worktrees?

**Finding:** gitsigns watches, non-recursively, the git dir, the common dir (when different, as in a linked worktree), `<commondir>/reftable`, and the directory of the current branch ref. It ignores `index.lock` and `.watchman-cookie*` events, coalesces with a 200 ms trailing debounce, and falls back to 200 ms polling of `HEAD`, `index`, `packed-refs`, and the branch ref when `fs_event` fails. VS Code and Zed refresh on any first-level git-dir change except `index.lock`, with worktree-aware filters. VS Code also uses a 1,000 ms debounce. Local event traces show commits and branch switches touch `HEAD`, `index`, `packed-refs`, and `refs/heads/<branch>` in the common dir, which matches REQ6's trigger list. Branch names containing `/` live in subdirectories that a plain `refs/` watch does not cover.

**Requirements Evaluated:**

- `W261005F2A7-REQ6@R1` — Triggers include `HEAD`, `index`, `refs/` in the resolved git dir, about 200 ms coalescing, no polling.
- `W261005F2A7-REQ7@R1` — Linked worktree resolves its own git dir (`.git` is a file) and watches it.

**Potential Requirement Impact:** This supports REQ6's about-200 ms window, which equals the gitsigns value. It constrains REQ7's worktree criterion: a linked worktree's `HEAD` and `index` are in its private git dir, while branch refs and `packed-refs` are in the common dir, so both must be watched. It challenges "no polling" as an absolute rule, because gitsigns keeps a poll fallback for platforms or filesystems where `fs_event` fails.

**Evidence:**

- Watch targets: `_fs_event_targets` returns `gitdir`, `commondir/reftable`, `commondir` (if different), and `commondir/<dirname(head_ref)>`. `_fs_poll_targets` returns `HEAD`, `index`, `packed-refs`, `reftable`, and the head ref — [gitsigns `git/repo/watcher.lua` L341–375](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/repo/watcher.lua#L341-L375).
- Event filtering ignores names starting with `.watchman-cookie` or `index.lock`. The debounce is `debounce_trailing(200, …)`, and the poll interval is 200 ms — [gitsigns `git/repo/watcher.lua` L10, L79–84, L131](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/repo/watcher.lua#L79-L84).
- VS Code ignores `/.git/index.lock`, `/.git/worktrees/*/index.lock`, and `.watchman-cookie-` paths. It triggers status on "any change within the first level of the `.git` folder, except … `index.lock`", debounced 1,000 ms — [VS Code `repository.ts` L477–479, L947–951, L3355](https://github.com/microsoft/vscode/blob/dae0d5919e9b1f53260f547f20e55a99db97c7a4/extensions/git/src/repository.ts#L477-L479).
- Zed "reloads a lot of data … any time any file changes inside of the `.git` directory, with the exception of … `index.lock` and `COMMIT_MESSAGE`". In May 2026 it fixed that filter for linked worktrees — [zed-industries/zed PR #57763](https://github.com/zed-industries/zed/pull/57763).
- Local Bun `fs.watch` trace on `.git` and `.git/refs/heads`:
  - `git add`: `index.lock`, `index`.
  - `git commit`: `index.lock`, `index`, `COMMIT_EDITMSG`, `HEAD.lock`, `AUTO_MERGE.lock`, `packed-refs.lock`, `heads/main.lock`, `heads/main`.
  - `git switch -c topic`: `HEAD.lock`, `HEAD`, `AUTO_MERGE.lock`, `packed-refs.lock`, `heads/topic.lock`, `heads/topic`.
- Local linked worktree: `.git` contains `gitdir: <main>/.git/worktrees/wt-linked`. That dir holds `HEAD`, `index`, `commondir`, and `refs`, and `--git-common-dir` is the main `.git`.

**Rationale and Examples:**

```text
linked worktree
  <wt>/.git                 (file: "gitdir: …/.git/worktrees/wt")
  …/.git/worktrees/wt/      HEAD, index           ← watch (gitdir)
  …/.git/                   packed-refs, refs/heads/<branch dir>, reftable/  ← watch (commondir)
filter: *.lock, .watchman-cookie*, COMMIT_EDITMSG → drop; anything else → debounce 200 ms → refresh
```

**Tradeoffs and Limitations:**

- Watching the branch's ref directory must be updated after a branch switch (gitsigns `set_head_ref`). Watching only `refs/` non-recursively misses `refs/heads/feature/x`.
- Repositories using the `reftable` ref format (Git 2.45+) store refs under `reftable/`, and gitsigns watches it. This research did not test reftable locally.
- `fs.watch` reliability differs across platforms and network filesystems. gitsigns' poll fallback and VS Code's "legacy API" fallback both exist for that reason.

**Reconciliation Considerations:**

- Consider rewording REQ6's trigger set to "first-level changes in the git dir and the common dir, plus the current branch's ref directory, excluding lock and cookie files".
- Decide whether "no polling" allows a poll fallback when the watcher cannot start.

## RF8: One rev-parse call resolves top level, git dir, common dir, and prefix

**Question:** How do tools discover the repository for a workspace that may be a subfolder or a linked worktree?

**Finding:** gitsigns resolves a repository with one `git rev-parse --show-toplevel --absolute-git-dir --abbrev-ref HEAD`, run in the file's directory. It treats "ambiguous HEAD" (no commits yet) as success, reads the common dir from `<gitdir>/commondir`, and shows a short SHA for detached HEAD, with `(rebasing)` added during a rebase. Locally, `--git-common-dir` printed a relative path (`../../.git`) from a subfolder unless `--path-format=absolute` was given. `--show-prefix` gives the workspace's repo-relative prefix (`sub/notes/`), which is what pathspec scoping needs.

**Requirements Evaluated:**

- `W261005F2A7-REQ7@R1` — Discovery for top level, subfolder, linked worktree; status limited to the workspace; tool runs at top level; silent when absent.
- `W261005F2A7-REQ4@R1` — Branch or short detached-HEAD ref in the statusline.
- `W261005F2A7-REQ3@R1` — "not a git repository" notice outside a repository.

**Potential Requirement Impact:** The evidence supports REQ7's layouts with one discovery call. It adds two edge cases REQ4 and REQ7 do not mention: a repository with no commits (HEAD unborn, so `rev-parse` fails and blame has no base) and an in-progress rebase or merge.

**Evidence:**

- The rev-parse argv, the handling of `errors.e.ambiguous_head` as success, and the "outside worktree" check — [gitsigns `git/repo.lua` L620–720](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/repo.lua#L620-L720).
- The common dir is read from the `commondir` file in the git dir. The detached head is `rev-parse --short HEAD`, with `(rebasing)` added when `rebase-merge`/`rebase-apply` exists — [gitsigns `git/repo.lua` L30–45, L127–135, L600–617](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/repo.lua#L127-L135).
- Git's documentation says `--git-dir`/`GIT_DIR` "turns off the repository discovery" and assumes the top level unless `--work-tree` is given — [git documentation](https://git-scm.com/docs/git). so's discovery is affected if the user's shell exports `GIT_DIR`.
- Local test from `<repo>/sub/notes`: `rev-parse --show-toplevel --absolute-git-dir --git-common-dir --show-prefix --abbrev-ref HEAD` printed the top level, the absolute git dir, `../../.git`, `sub/notes/`, and `main`. `--path-format=absolute --git-common-dir` printed an absolute path. The call took about 15 ms.

**Rationale and Examples:**

```text
git -C <workspace> rev-parse --path-format=absolute --show-toplevel --git-dir --git-common-dir --show-prefix --abbrev-ref HEAD
→ /home/u/dotfiles · /home/u/dotfiles/.git · /home/u/dotfiles/.git · notes/ · main
```

**Tradeoffs and Limitations:**

- `--path-format` needs Git 2.31 or later. The minimum supported Git version is not stated anywhere in the baseline.
- Inherited `GIT_DIR`/`GIT_WORK_TREE` change discovery. gitsigns reads them explicitly, and other tools inherit them silently.

**Reconciliation Considerations:**

- Consider stating the statusline content for an unborn branch, a detached HEAD, and a rebase or merge in progress.
- Consider whether so states a minimum Git version.

## RF9: Porcelain v2 status is root-relative, NUL-safe, and cheap when scoped

**Question:** How should repo-wide file status be read for explorer markers and the statusline, and what does it cost on large repositories?

**Finding:**

- **Format.** `git status --porcelain=v2 -z --branch` gives machine-stable entries (`1`, `2` rename/copy, `u` unmerged, `?` untracked, `!` ignored), branch headers, NUL-separated rename paths, and a 4-character submodule field.
- **Paths.** Locally, paths stayed repo-root-relative even with a subfolder cwd, so the workspace prefix (RF8) must be stripped.
- **Renames.** A rename appears only when staged; an unstaged move shows as a deletion plus an untracked file.
- **Untracked directories.** `--untracked-files=normal`, the default, collapses a new folder to `? dir/`; `all` lists every file.
- **Cost.** On a 20,000-file repository, a full lock-free status took about 48 ms, and scoping to a 100-file folder took about 20 ms.
- **Large repositories.** Published fsmonitor and untracked-cache numbers show multi-second scans dropping below 1 s, but those caches live in the index (RF6).

**Requirements Evaluated:**

- `W261005F2A7-REQ4@R1` — Explorer markers for modified, added/staged, untracked, deleted-or-conflicted; folders show contained changes; statusline branch.
- `W261005F2A7-REQ7@R1` — Status limited to the workspace path; a submodule is a single entry.
- `W261005F2A7-REQ6@R1` — One async status read per coalesced refresh.

**Potential Requirement Impact:** The evidence supports REQ7's pathspec scoping and its single-entry submodule rule, since porcelain v2 already reports a submodule as one `S…` entry. It supports REQ4's marker set: XY codes cover modified, staged, untracked, deleted, and unmerged, and one `--branch` call also supplies the statusline branch. Choosing `-uall` or `normal` affects whether new folders show per-file markers.

**Evidence:**

- The line formats `1 <XY> <sub> …`, `2 <XY> <sub> … <X><score> <path><sep><origPath>`, `u …`, `? <path>`, `! <path>` and the headers `# branch.oid`, `# branch.head <branch> | (detached)`, `# branch.upstream`, `# branch.ab`. With `-z`, rename paths are NUL-separated. `<sub>` is `N...` or `S<c><m><u>`. `--ignore-submodules=none|untracked|dirty|all`. `-u` modes `no|normal|all`, with `normal` the default — [git-status documentation](https://git-scm.com/docs/git-status).
- Git's documentation says `core.untrackedCache=true` with `core.fsmonitor` lets status "only search directories that have been modified since the previous `git status`", and caches "may take a few `git status` commands … to warm up" — [git-status documentation](https://git-scm.com/docs/git-status).
- GitHub (Hostetler, 2022) measured `git status` at 17.6 s → 0.827 s on Chromium (393K files) and 41.1 s → 0.590 s on a synthetic 1M-file repository, both with FSMonitor and the untracked cache. The first run after the daemon starts may be as slow as before — [Improve Git monorepo performance with a file system monitor](https://github.blog/engineering/infrastructure/improve-git-monorepo-performance-with-a-file-system-monitor/).
- The built-in fsmonitor daemon refuses network-mounted repositories by default — [git-fsmonitor--daemon documentation](https://git-scm.com/docs/git-fsmonitor--daemon).
- VS Code uses `status -z -uall` and caps results with `git.statusLimit` (default 10,000). gitsigns uses porcelain v1 `--ignore-submodules --untracked-files=all` only for its file lists — [VS Code `git.ts` L2801–2811](https://github.com/microsoft/vscode/blob/dae0d5919e9b1f53260f547f20e55a99db97c7a4/extensions/git/src/git.ts#L2801-L2811), [VS Code `repository.ts` L3115](https://github.com/microsoft/vscode/blob/dae0d5919e9b1f53260f547f20e55a99db97c7a4/extensions/git/src/repository.ts#L3115), [gitsigns `git/repo.lua` L360–400](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/repo.lua#L360-L400).
- Local tests (Git 2.51.0):
  - Run from `notes/` with pathspec `.`, every path printed with the `notes/` prefix: `1 .M N... … notes/a.md`, `2 R. N... … R100 notes/new.md\0notes/old.md`, `1 .M S.M. 160000 … notes/sm`, and `? notes/newdir/`. With `-uall`, `? notes/newdir/x.md` and `y.md` printed instead. The ignored file did not print.
  - On 20,000 tracked files: full lock-free status took 48–49 ms, `-uno` took 35 ms, `-uall` took 48 ms, and `-- notes/d1` (100 files) took 20–21 ms.

**Rationale and Examples:** One call per refresh can feed the statusline branch and every explorer marker. Folder markers derive from the entries in pure core logic, so no full-repo walk is needed.

```text
git --no-optional-locks status --porcelain=v2 -z --branch --untracked-files=all -- <prefix>
  # branch.head main        → statusline
  1 .M N... … notes/a.md    → explorer "M" on a.md, "changed" on notes/
  ? notes/newdir/x.md       → "?" on x.md and newdir/
```

**Tradeoffs and Limitations:**

- `-uall` lists every untracked file. A workspace with a large untracked folder pays the cost of listing it on every refresh, and `normal` avoids that at the price of coarser markers.
- The published numbers depend on the hardware and platform, so they show the effect of the caches but are not targets for so.
- `--porcelain=v2` was added in Git 2.11.

**Reconciliation Considerations:**

- Decide whether untracked folders show one folder marker (`normal`) or per-file markers (`all`).
- Decide whether REQ4's "deleted-or-conflicted" marker should separate unmerged (`u`) entries, since porcelain v2 reports them on their own line type.
- Consider an explicit large-repository behaviour (an entry cap like VS Code's, or none), given RF6's stale-stat cost.

## RF10: LazyVim and Helix save before lazygit and reload after it

**Question:** How do LazyVim, snacks.nvim, lazygit.nvim, and editors without an embedded terminal launch lazygit and refresh after it exits?

**Finding:** LazyVim binds `<leader>gg` to `Snacks.lazygit({ cwd = LazyVim.root.git() })`, which runs lazygit in an embedded floating terminal at the Git root. It configures lazygit through `LG_CONFIG_FILE` (a theme and `os.editPreset = "nvim-remote"`, so files edited from lazygit open in the parent Neovim). Refresh after exit is generic: a `checktime` autocmd on `TermClose`/`TermLeave`/`FocusGained` reloads changed buffers, and gitsigns' git-dir watcher updates signs. lazygit.nvim calls `checktime` in `on_exit`. Helix has no embedded terminal and uses the same full-screen hand-off as REQ2. Its widely shared recipe is `:write-all` → run lazygit → `:redraw` → `:reload-all`, which is REQ8 plus REQ2. Users of that recipe reported leftover lazygit output, mangled keys in kitty, foot, and Ghostty, and lost mouse state.

**Requirements Evaluated:**

- `W261005F2A7-REQ2@R1` — Full-screen tool with so suspended; refresh and re-check files on exit.
- `W261005F2A7-REQ3@R1` — Configurable tool argv; clear notice when missing.
- `W261005F2A7-REQ8@R1` — Save dirty buffers before the tool opens.

**Potential Requirement Impact:** The evidence supports REQ2's hand-off shape and REQ8's save-first rule, both of which match the Helix recipe. It supports running the tool at the Git root, which LazyVim does. It adds one consideration: when the user edits a file from inside lazygit (`e`), lazygit spawns `$EDITOR` itself. Without an editor preset, that may start a nested editor.

**Evidence:**

- LazyVim defines `map("n", "<leader>gg", function() Snacks.lazygit({ cwd = LazyVim.root.git() }) end)`, registered only `if vim.fn.executable("lazygit") == 1` — [LazyVim `config/keymaps.lua` L167–170](https://github.com/LazyVim/LazyVim/blob/999700997f72227187d49d8b92667183dc7fc809/lua/lazyvim/config/keymaps.lua#L167-L170).
- LazyVim runs `checktime` on `FocusGained`, `TermClose`, and `TermLeave` — [LazyVim `config/autocmds.lua` L7–15](https://github.com/LazyVim/LazyVim/blob/999700997f72227187d49d8b92667183dc7fc809/lua/lazyvim/config/autocmds.lua#L7-L15).
- snacks' defaults are `config = { os = { editPreset = "nvim-remote" }, … }`. It writes a theme file and appends it to `LG_CONFIG_FILE` (comma-separated) — [snacks.nvim `lazygit.lua` L28–40, L84–104](https://github.com/folke/snacks.nvim/blob/882c996cf28183f4d63640de0b4c02ec886d01f2/lua/snacks/lazygit.lua#L28-L40).
- lazygit.nvim's `on_exit` runs `silent! :checktime` and an optional user callback — [lazygit.nvim `lua/lazygit.lua` L17–43](https://github.com/kdheepak/lazygit.nvim/blob/9ffc6103926718f7070fb4017694543cd7dc9718/lua/lazygit.lua#L17-L43).
- lazygit merges comma-separated config files from `--use-config-file` or `LG_CONFIG_FILE`. `nvim-remote` lets lazygit "open the file from within the parent process rather than spawning a new one" — [lazygit `docs/Config.md`](https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md).
- The Helix recipe is ``C-g = [":write-all", ":new", ":insert-output lazygit", ":buffer-close!", ":redraw", ":reload-all"]`` (2024-11-09). Replies report terminal remnants, mangled input in kitty, foot, and Ghostty, mouse needing a re-toggle, and incomplete reload — [helix-editor/helix discussion #12045](https://github.com/helix-editor/helix/discussions/12045).

**Rationale and Examples:**

```text
LazyVim:  <leader>gg → float terminal (cwd = git root) → exit → TermClose → checktime; gitdir watcher → signs
Helix:    C-g → :write-all → lazygit owns tty → exit → :redraw → :reload-all
so (REQ2/REQ8): <leader>gg → save dirty → suspend → spawn(tool, inherit, cwd = top) → exit → resume → refresh + re-check
```

**Tradeoffs and Limitations:**

- The Helix problem reports come from user discussion, not maintainers. They show typical failures but do not identify their causes. RF11 shows OpenTUI handles the kitty keyboard stack that Helix users reported.

**Reconciliation Considerations:**

- Decide whether so sets lazygit's edit behaviour when it launches the default tool (for example through `LG_CONFIG_FILE`) or leaves lazygit's `$EDITOR` handling unchanged. REQ3 treats the tool as an opaque argv.

## RF11: OpenTUI suspend and resume reset and restore every terminal mode

**Question:** What do OpenTUI `0.5.14` `CliRenderer.suspend()`/`resume()` do to the alt screen, raw mode, mouse, kitty keyboard, and stdin?

**Finding:** In `0.5.14`, `suspend()` does the following:

- stops the render loop;
- disables the mouse and remembers whether it was on;
- removes its exit listeners and its stdin `data` listener;
- resets the stdin parser;
- runs the native shutdown sequence: show the cursor, reset SGR, pop the kitty keyboard flags, turn off modifyOtherKeys, mouse modes, bracketed paste, focus tracking, and colour-scheme updates, leave the alt screen, and delete kitty images;
- leaves raw mode and pauses stdin.

`resume()` reverses these steps:

- re-enters raw mode;
- feeds any bytes still buffered on stdin to its listener;
- re-attaches the listener and resumes stdin;
- re-enters the alt screen and re-pushes the detected features, including kitty keyboard and bracketed paste;
- re-enables the mouse if it was on;
- forces a full repaint.

While suspended, key events are dropped and resizes are recorded. In a PTY test, Bun `1.4.2` handed stdin cleanly to an inherited child after the same pause sequence.

**Requirements Evaluated:**

- `W261005F2A7-REQ2@R1` — so draws nothing and reads no input while the tool runs; after any exit it restores the alt screen, raw mode, and mouse and repaints.

**Potential Requirement Impact:** The evidence supports REQ2's assumption that `suspend()`/`resume()` cover alt screen, raw mode, mouse, and kitty keyboard, and its "reads no input" criterion. It adds three considerations. Bytes typed after the child exits but before `resume()` reach so as keys. so's own `mouse` setting is re-applied on each paint (`src/ui/shell.ts:192-193`), so mouse state comes back even if the tool changed it. A child killed mid-run can leave modes that so never enables, such as any-motion mouse tracking. `resume()` does not clear those, because it re-sends only so's own modes.

**Evidence:**

- JS `suspend()`/`resume()` are in `node_modules/@opentui/core/chunk-bun-j2z63cdy.js:9743-9822`:
  - `suspend()` calls `disableMouse()`, `removeExitListeners()`, `stdin.removeListener("data", …)`, `lib.suspendRenderer`, `stdin.setRawMode(false)`, and `stdin.pause()`.
  - `resume()` calls `setRawMode(true)`, drains with `while ((drained = this.stdin.read()) !== null) this.stdinListener(drained)`, re-attaches the listener, calls `lib.resumeRenderer` (or `setupTerminal`) and `enableMouse()` if it was enabled, and sets `forceFullRepaintRequested = true`.
- While suspended, input events other than pixel-resolution replies are dropped (`chunk-bun-j2z63cdy.js:9182-9187`). `processResize` skips terminal writes and defers the pixel-resolution query until resume (`:9531-9547`). `getPalette` throws while suspended (`:10462`).
- Native `performShutdownSequence` deletes kitty images and calls `terminal.resetState`, which writes `showCursor`, `reset`, `setKittyKeyboard(false)`, `setModifyOtherKeys(false)`, `forceDisableMouseMode`, `setBracketedPaste(false)`, `setFocusTracking(false)`, `exitAltScreen`, and `setColorSchemeUpdates(false)`. Afterwards it shows the cursor twice, with 10 ms sleeps, as a Ghostty workaround. `resumeRenderer` calls `setupTerminalWithoutDetection` (enter alt screen, `enableDetectedFeatures` including kitty keyboard) — [OpenTUI v0.5.14 `packages/native/src/renderer.zig` L578–656](https://github.com/anomalyco/opentui/blob/v0.5.14/packages/native/src/renderer.zig#L578-L656), [OpenTUI v0.5.14 `packages/native/src/terminal.zig` L282–330, L399–440](https://github.com/anomalyco/opentui/blob/v0.5.14/packages/native/src/terminal.zig#L282-L330).
- so's renderer runs `screenMode: "alternate-screen"` and `useKittyKeyboard: {}` with mouse initially off (`src/ui/shell.ts:37-45`).
- Bun once lost child stdin characters after `process.stdin.pause()` ([oven-sh/bun #13978](https://github.com/oven-sh/bun/issues/13978), Bun 1.1.27). This was fixed by [oven-sh/bun PR #23341](https://github.com/oven-sh/bun/pull/23341), merged 2025-10-10, before Bun 1.4.2.
- Local PTY test (Bun 1.4.2): raw mode on, `ab` read by the parent, then listener removal, raw mode off, and pause. A `Bun.spawn(["bash","-c","read -r x; …"], { stdio: ["inherit","inherit","inherit"] })` child received the full `hello world`, and the parent saw only `ab`.

**Rationale and Examples:**

```text
suspend: stop loop → mouse off → drop stdin listener → [CSI <u pop, ?1049l, ?2004l, ?1004l, mouse off, cursor on] → cooked mode → stdin.pause
resume:  raw mode → drain buffered stdin → listener on → [?1049h, CSI >flags u, ?2004h …] → mouse on (if was) → full repaint
```

**Tradeoffs and Limitations:**

- This research did not test the native shutdown or resume against a crashing or `SIGKILL`ed lazygit in a real terminal. The claim that leftover child modes persist is an inference from the code: `resetState` acts only on modes recorded in so's terminal state.
- Kitty images are deleted on suspend. Whether so's next full repaint re-sends them was not verified. `src/ui/widgets/image.ts:50` draws images per frame through `drawImage`.

**Reconciliation Considerations:**

- Consider adding to REQ2's crash criterion: after an abnormal tool exit, terminal modes the tool set and so does not use are reset too, for example with a mode-reset sequence before resume.
- Consider whether images must reappear after return as an explicit criterion.

## RF12: Ctrl-C during the hand-off reaches so's shutdown handler

**Question:** What known pitfalls exist when a child runs on the inherited terminal and is interrupted, crashes, or is killed?

**Finding:** The child runs in so's foreground process group, so a terminal-generated SIGINT reaches both. In a PTY test, a Bun parent with a `SIGINT` handler received the signal while an inherited `sleep` child died with code 130. so installs `SIGINT` → `shutdown` (`src/app/lifecycle.ts:66-67`), so Ctrl-C in any cooked-mode program lazygit starts (a hook, a pager, an editor) could shut so down. micro traps `os.Interrupt` around its interactive shell for exactly this reason.

**Requirements Evaluated:**

- `W261005F2A7-REQ2@R1` — After the tool exits with any status, including a crash, so restores and repaints.

**Potential Requirement Impact:** This challenges REQ2's "any status, including a crash" criterion. As wired today, a SIGINT during the hand-off may end so instead of returning to it. Reconciliation could add an explicit criterion that so survives an interrupt delivered while the tool runs.

**Evidence:**

- micro's `RunInteractiveShell` calls `screen.TempFini()`, then runs the command with `os.Stdin`/`os.Stdout`/`os.Stderr`. Its comment reads "This is a trap for Ctrl-C so that it doesn't kill micro" (`signal.Reset(os.Interrupt); signal.Notify(c, os.Interrupt)`), and afterwards it calls `screen.TempStart` and restores its handler — [micro `internal/shell/shell.go` L72–122](https://github.com/zyedidia/micro/blob/02164788bd29c90456e39f976a566899d39579e4/internal/shell/shell.go#L72-L122).
- so's lifecycle registers `for (const signal of ["SIGTERM", "SIGHUP", "SIGINT"]) process.on(signal, () => void shutdown(0, true))` (`src/app/lifecycle.ts:66-67`). OpenTUI's own exit signals are disabled (`src/ui/shell.ts:39`).
- Local PTY test (Bun 1.4.2): writing `\x03` while a `sleep 3` child ran printed `PARENT got SIGINT`, and the child reported `code=130 signal=SIGINT`.

**Rationale and Examples:** lazygit itself runs in raw mode, so Ctrl-C is a key there and sends no signal. The risk is in the cooked-mode programs it starts, which include the `$EDITOR` it suspends itself for, hooks, and credential prompts. It also applies to a user-configured `git.tool` such as `tig` that may run in cooked mode.

**Tradeoffs and Limitations:**

- This research did not test lazygit's own subprocesses against so. The test shows signal delivery to the parent in general.
- SIGTSTP (Ctrl-Z) inside the child and SIGHUP on terminal close while the tool runs were not tested.

**Reconciliation Considerations:**

- Consider adding a REQ2 criterion: an interrupt sent while the tool runs does not exit so, and a tool killed by a signal still returns to a restored so.

## RF13: Single-line blame uses -L with --contents for unsaved text

**Question:** How do gitsigns and others implement single-line blame, handle uncommitted lines, and what does it cost?

**Finding:** gitsigns runs `git blame --incremental [--contents -] [-w] -L <n>,+1 [--ignore-revs-file <top>/.git-blame-ignore-revs] [<rev>] -- <relpath>`, with the buffer text on stdin when it is modified. Uncommitted lines appear with the all-zero SHA. Their author is `Not Committed Yet` for working-tree changes, and since Git 2.41 it is `External file (--contents)` / `<external.file>` for `--contents` input, which gitsigns maps back to "Not Committed Yet". Untracked files and unborn HEAD have no blame base. gitsigns reports every line as uncommitted there without running Git, because Git fails (`no such path … in HEAD`). Locally, a one-line blame took 17–82 ms on a 5,000-line file with 300 commits; the cost depends on how far back the line's last change is.

**Requirements Evaluated:**

- `W261005F2A7-REQ4@R1` — On-demand blame shows author, relative date, and summary, and "not committed yet" for uncommitted lines.

**Potential Requirement Impact:** The evidence supports REQ4's on-demand blame and its "not committed yet" case. It constrains three things. Unsaved buffers need `--contents -` for line numbers to match. Detecting "not committed yet" must accept both the old and the post-2.41 sentinel. Untracked files and unborn HEAD must be handled before calling Git. `.git-blame-ignore-revs` is an optional refinement that gitsigns honours.

**Evidence:**

- The blame argv is built from `'blame', '--incremental', contents and {'--contents','-'}, … '-L', lnum..',+1', … '--ignore-revs-file', ignore_file, revision, '--', relpath` with `stdin = contents_str`. Untracked files and missing HEAD return `not_committed` for all lines — [gitsigns `git/blame.lua` L220–290](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/blame.lua#L220-L290).
- The comment "New in git 2.41: … contents taken from the file specified by the `--contents` option shows it differently" maps `<external.file>`/`External file (--contents)` to Not Committed Yet — [gitsigns `git/blame.lua` L134–142](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/git/blame.lua#L134-L142).
- Automatic current-line blame waits `delay = 1000` ms. LazyVim maps on-demand `<leader>ghb` to `blame_line({ full = true })` — [gitsigns `config.lua` L647–656](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/config.lua#L647-L656), [LazyVim `plugins/editor.lua` L182](https://github.com/LazyVim/LazyVim/blob/999700997f72227187d49d8b92667183dc7fc809/lua/lazyvim/plugins/editor.lua#L182).
- Local tests (Git 2.51.0):
  - A working-tree change printed `0000…0000 2 2 1`, `author Not Committed Yet`, `summary Version of n.md from n.md`.
  - With `--contents -`, it printed `author External file (--contents)`, `author-mail <external.file>`, `summary Version of n.md from standard input`.
  - On an untracked file: `fatal: no such path 'u.md' in HEAD`. Past EOF: `fatal: file n.md has only 5001 lines`.
  - Timings: `-L 13,+1` took 82 ms (the line was last edited in an early commit), `-L 3900,+1` took 17 ms, a full-file blame took 91 ms, and `--incremental` took the same as porcelain.

**Rationale and Examples:**

```text
dirty buffer, cursor line 42 → git --no-optional-locks blame --porcelain --contents - -L 42,+1 -- notes/inbox.md  (stdin = buffer text)
→ sha 0000… → "not committed yet"   |   sha a1b2… → author, author-time → "2 days ago", summary
```

**Tradeoffs and Limitations:**

- The blame cost grows with history depth. The measured values come from a 300-commit file, and long-lived notes repositories with thousands of commits on one file were not measured.
- The `--contents -` input must use the working file's line endings and BOM form, as in RF4. This research did not test that.

**Reconciliation Considerations:**

- Consider stating REQ4's blame behaviour for untracked files and for a repository with no commits (show "not committed yet" without running Git).
- Decide whether `.git-blame-ignore-revs` is honoured.

## RF14: Pure-JS Myers diff is fast on 5,000 lines except when nothing matches

**Question:** Which TypeScript line-diff libraries or algorithms give gitsigns-quality hunks under Bun, at what size, license, and performance, and do they survive `bun build --compile`?

**Finding:** Bun has no built-in line diff. Three dependency-free npm packages implement O(ND) Myers and were measured on 5,000-line inputs: `diff` 9.0.0 (BSD-3-Clause), `fast-myers-diff` 3.2.0 (MIT), and `diff-sequences` 29.6.3 (MIT). With realistic edits (1–200 changes), each takes 0.02–6 ms after prefix/suffix trimming, well inside a 100 ms debounce. All three slow down sharply when no line matches, as with a CRLF mismatch or a full rewrite: `diff` took about 5 s, `fast-myers-diff` about 396 ms, and `diff-sequences` about 321 ms. `diff`'s `timeout`/`maxEditLength` options give up and return `undefined`, and a common-line pre-check detects the case in under 0.1 ms. All three survive `bun build --compile`. `diff-sequences` is CommonJS: its default import is a function under `bun run` but `{ default: fn }` in the compiled binary.

**Requirements Evaluated:**

- `W261005F2A7-REQ5@R1` — In-process, debounced diff; typing in a 5,000-line note runs no Git process per keystroke.

**Potential Requirement Impact:** The evidence supports REQ5's in-process diff within the keystroke budget (`liveKeystrokeP95` 24 ms, `.s1mple/docs/project.md` Benchmarks) for normal edits. It adds a constraint: the worst case must be bounded, by a cap, an early "everything changed" exit, or EOL normalisation (RF4), or one debounced diff could block a frame for 0.3–5 s. A dependency is optional. so already has a trimmed `lineDiff` in `src/ui/overlays/conflict.ts:19`, but it lives in `src/ui` and cannot be imported by `src/core`.

**Evidence:**

- npm registry metadata (accessed 2026-10-05):
  - `diff` 9.0.0: BSD-3-Clause, no dependencies, published 2026-04-13, ESM and CJS. Minified bundle 23,878 B (8,349 B gzip).
  - `fast-myers-diff` 3.2.0: MIT, no dependencies, published 2024-01-12. 4,157 B (1,874 B gzip).
  - `diff-sequences` 29.6.3: MIT, no dependencies, published 2023-08-21 as part of Jest. 4,862 B (1,981 B gzip).
  - Sources: [npm `diff`](https://www.npmjs.com/package/diff), [npm `fast-myers-diff`](https://www.npmjs.com/package/fast-myers-diff), [npm `diff-sequences`](https://www.npmjs.com/package/diff-sequences).
- gitsigns uses xdiff Myers by default, with patience and histogram available, and Neovim's default `indent-heuristic` and `linematch:40` — [gitsigns `config.lua` L466–510](https://github.com/lewis6991/gitsigns.nvim/blob/851a051e2bd2caba97e23314c68d69f1b1cf5d19/lua/gitsigns/config.lua#L466-L510), [Neovim `options.txt` 'diffopt'](https://github.com/neovim/neovim/blob/master/runtime/doc/options.txt).
- Local benchmark (Bun 1.4.2, 5,000 lines, median of 7 runs after common prefix/suffix trimming; times in ms):

  | Scenario | `diff` 9.0.0 | `fast-myers-diff` 3.2.0 | `diff-sequences` 29.6.3 |
  |---|---|---|---|
  | 1 edit | 0.03 | 0.02 | 0.02 |
  | 10 edits | 0.10 | 0.23 | 0.15 |
  | 200 edits | 5.62 | 1.17 | 1.15 |
  | every line differs (CR added) | 4,995 | 396 | 321 |
  | every line differs, lines interned to `Int32Array` | — | 214 | 137 |
  | `diff` with `timeout: 50` / `maxEditLength: 2000` | 50 / 359 → `undefined` | — | — |

- Local compile test: a file importing all three built with `bun build --compile` and ran with `node_modules` removed. `typeof` of the `diff-sequences` default import was `function` under `bun i.ts` and `object` (with a `.default` function) in the compiled binary. Its build sets `exports.__esModule` and `exports.default`.

**Rationale and Examples:** For notes, edits are local, so trimming plus Myers is effectively free. The danger is the "nothing matches" input, which RF4's EOL mismatch can cause on an unchanged file.

```text
diff(indexLines, bufferLines):
  trim common prefix/suffix → if middle has no common line → one "change" hunk (O(n))
                            → else Myers on the middle (bounded by maxEditLength / timeout)
```

**Tradeoffs and Limitations:**

- Myers implementations break ties differently from Git's xdiff, so hunk boundaries in ambiguous spots (repeated blank lines) may differ from `git diff`. Staging stays correct, because the patch comes from so's own hunks (RF2). Signs may differ slightly from lazygit's view.
- Patience and histogram diffs (better alignment for code) have no maintained, widely used pure-JS package among those checked. `histogram-diff` 0.1.1 exists but is a 2026 0.x package and was not evaluated.
- BSD-3-Clause and MIT both require keeping the copyright notice in binary redistributions. so's release binary already bundles MIT dependencies.

**Reconciliation Considerations:**

- Consider adding a REQ5 acceptance criterion for the worst case: a 5,000-line note whose every line differs from the index does not stall typing beyond the keystroke budget.
- If a CJS dependency is chosen, the compiled-binary smoke test must exercise the diff path, because module interop differs between `bun run` and `bun build --compile`.

# 3. Sources

## External Sources

1. **gitsigns.nvim source (`lua/gitsigns/{git.lua, git/cmd.lua, git/repo.lua, git/repo/watcher.lua, git/blame.lua, hunks.lua, diff.lua, diff_int.lua, config.lua, actions.lua, manager.lua, attach.lua}`)** — Lewis Russell (lewis6991)
   - URL: https://github.com/lewis6991/gitsigns.nvim/tree/851a051e2bd2caba97e23314c68d69f1b1cf5d19
   - Published or updated: commit `851a051` 2026-10-05
   - Accessed: 2026-10-05
   - Supports: `RF1`, `RF2`, `RF3`, `RF4`, `RF5`, `RF6`, `RF7`, `RF8`, `RF9`, `RF13`, `RF14`
   - Authority: Primary source code of the reference plugin, by its maintainer.
2. **git-status documentation** — Git project
   - URL: https://git-scm.com/docs/git-status
   - Published or updated: Unknown (current docs)
   - Accessed: 2026-10-05
   - Supports: `RF6`, `RF9`
   - Authority: Official Git reference.
3. **git documentation (options and environment)** — Git project
   - URL: https://git-scm.com/docs/git
   - Published or updated: Unknown (current docs)
   - Accessed: 2026-10-05
   - Supports: `RF6`, `RF8`
   - Authority: Official Git reference.
4. **git-apply documentation** — Git project
   - URL: https://git-scm.com/docs/git-apply
   - Published or updated: Unknown (current docs)
   - Accessed: 2026-10-05
   - Supports: `RF2`, `RF3`
   - Authority: Official Git reference.
5. **git-fsmonitor--daemon documentation** — Git project
   - URL: https://git-scm.com/docs/git-fsmonitor--daemon
   - Published or updated: Unknown (current docs)
   - Accessed: 2026-10-05
   - Supports: `RF9`
   - Authority: Official Git reference.
6. **Improve Git monorepo performance with a file system monitor** — Jeff Hostetler, GitHub
   - URL: https://github.blog/engineering/infrastructure/improve-git-monorepo-performance-with-a-file-system-monitor/
   - Published or updated: 2022-06-29 (updated 2022-06-30)
   - Accessed: 2026-10-05
   - Supports: `RF9`
   - Authority: Written by the author of Git's built-in fsmonitor, with measured results.
7. **VS Code Git extension source (`extensions/git/src/git.ts`, `repository.ts`)** — Microsoft
   - URL: https://github.com/microsoft/vscode/tree/dae0d5919e9b1f53260f547f20e55a99db97c7a4/extensions/git/src
   - Published or updated: commit `dae0d59` 2026-10-05
   - Accessed: 2026-10-05
   - Supports: `RF6`, `RF7`, `RF9`
   - Authority: Primary source of a widely used editor's Git integration.
8. **Fix the filtering of index.lock + COMMIT_MESSAGE FS events to work in linked worktrees (PR #57763)** — Max Brunsfeld, Zed Industries
   - URL: https://github.com/zed-industries/zed/pull/57763
   - Published or updated: merged 2026-05-27
   - Accessed: 2026-10-05
   - Supports: `RF7`
   - Authority: Maintainer PR in Zed's repository.
9. **Feedback-loop and lock-contention reports (`GIT_OPTIONAL_LOCKS=0`)** — zai-org/feedback #552, open-gsd/gsd-core #5048, ned2/dashpot #537
   - URL: https://github.com/zai-org/feedback/issues/552, https://github.com/open-gsd/gsd-core/issues/5048, https://github.com/ned2/dashpot/issues/537
   - Published or updated: Unknown (2026 issues)
   - Accessed: 2026-10-05
   - Supports: `RF6`
   - Authority: Secondary; independent practitioner reports that agree with Git's documentation.
10. **LazyVim source (`config/keymaps.lua`, `config/autocmds.lua`, `plugins/editor.lua`)** — LazyVim (Folke Lemaitre)
    - URL: https://github.com/LazyVim/LazyVim/tree/999700997f72227187d49d8b92667183dc7fc809/lua/lazyvim
    - Published or updated: commit `9997009` 2026-09-08
    - Accessed: 2026-10-05
    - Supports: `RF1`, `RF5`, `RF10`, `RF13`
    - Authority: Primary source of the distribution whose behaviour the requirements target.
11. **snacks.nvim `lua/snacks/lazygit.lua`** — Folke Lemaitre
    - URL: https://github.com/folke/snacks.nvim/blob/882c996cf28183f4d63640de0b4c02ec886d01f2/lua/snacks/lazygit.lua
    - Published or updated: commit `882c996` 2026-05-25
    - Accessed: 2026-10-05
    - Supports: `RF10`
    - Authority: Primary source of LazyVim's lazygit launcher.
12. **lazygit.nvim `lua/lazygit.lua`** — kdheepak
    - URL: https://github.com/kdheepak/lazygit.nvim/blob/9ffc6103926718f7070fb4017694543cd7dc9718/lua/lazygit.lua
    - Published or updated: commit `9ffc610` 2026-09-20
    - Accessed: 2026-10-05
    - Supports: `RF10`
    - Authority: Primary source of a popular alternative launcher.
13. **lazygit `docs/Config.md`** — Jesse Duffield and contributors
    - URL: https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md
    - Published or updated: Unknown (master)
    - Accessed: 2026-10-05
    - Supports: `RF10`
    - Authority: Official lazygit documentation.
14. **Helix doesn't need "Git integration", just use the following keymap (discussion #12045)** — helix-editor community
    - URL: https://github.com/helix-editor/helix/discussions/12045
    - Published or updated: 2024-11-09
    - Accessed: 2026-10-05
    - Supports: `RF10`
    - Authority: Secondary; user reports in the official Helix repository. They show common problems but do not diagnose them.
15. **micro `internal/shell/shell.go`** — Zachary Yedidia and contributors
    - URL: https://github.com/zyedidia/micro/blob/02164788bd29c90456e39f976a566899d39579e4/internal/shell/shell.go
    - Published or updated: commit `0216478` 2026-09-29
    - Accessed: 2026-10-05
    - Supports: `RF12`
    - Authority: Primary source of a terminal editor's interactive hand-off.
16. **OpenTUI v0.5.14 native sources (`packages/native/src/renderer.zig`, `terminal.zig`)** — anomalyco/opentui
    - URL: https://github.com/anomalyco/opentui/tree/v0.5.14/packages/native/src
    - Published or updated: tag `v0.5.14`
    - Accessed: 2026-10-05
    - Supports: `RF11`
    - Authority: Primary source at the exact pinned version.
17. **STDIN of child process is skipping some characters (issue #13978) and fix PR #23341** — oven-sh/bun
    - URL: https://github.com/oven-sh/bun/issues/13978, https://github.com/oven-sh/bun/pull/23341
    - Published or updated: issue 2024-09-15; PR merged 2025-10-10
    - Accessed: 2026-10-05
    - Supports: `RF11`
    - Authority: Bun maintainers' issue tracker.
18. **Neovim `runtime/doc/options.txt` ('diffopt')** — Neovim project
    - URL: https://github.com/neovim/neovim/blob/master/runtime/doc/options.txt
    - Published or updated: Unknown (master)
    - Accessed: 2026-10-05
    - Supports: `RF1`, `RF14`
    - Authority: Official Neovim documentation.
19. **npm registry entries for `diff`, `fast-myers-diff`, `diff-sequences`** — npm
    - URL: https://www.npmjs.com/package/diff, https://www.npmjs.com/package/fast-myers-diff, https://www.npmjs.com/package/diff-sequences
    - Published or updated: 2026-04-13, 2024-01-12, 2023-08-21 (latest versions)
    - Accessed: 2026-10-05
    - Supports: `RF14`
    - Authority: Package registry metadata (license, dependencies, dates).

## Project Evidence

- `node_modules/@opentui/core/chunk-bun-j2z63cdy.js:9743-9822` — Supports `RF11` by establishing the JS `suspend()`/`resume()` steps at the pinned version.
- `node_modules/@opentui/core/chunk-bun-j2z63cdy.js:9182-9187`, `:9531-9547`, `:10462` — Supports `RF11` by establishing that input is dropped, resize writes are deferred, and palette detection throws while suspended.
- `node_modules/@opentui/core/renderer.d.ts:590-591` — Supports `RF11` by establishing the public `suspend()`/`resume()` API.
- `src/ui/shell.ts:37-45`, `:192-193` — Supports `RF11` and `RF12` by establishing alternate-screen mode, kitty keyboard, OpenTUI exit signals off, and mouse re-sync on paint.
- `src/app/lifecycle.ts:66-69` — Supports `RF12` by establishing that `SIGINT` triggers so's shutdown.
- `src/workspace/fs.ts:50-86`, `src/core/state/types.ts:29-33` — Supports `RF4` and `RF1` by establishing that the 16 MiB, binary, and UTF-8 refusal, BOM stripping, and `eol` detection happen on read.
- `src/ui/overlays/conflict.ts:19` — Supports `RF14` by establishing that an existing `lineDiff` lives in `src/ui` only.
- `src/ui/widgets/image.ts:50` — Supports `RF11` by establishing that images are drawn per frame through `drawImage`.
- `.s1mple/docs/project.md` Benchmarks — Supports `RF14` by establishing the 24 ms live and 16 ms source keystroke P95 targets.

# 4. Confidence and Open Questions

**Confidence:** High — on gitsigns' mechanisms, lock-free reads, git-dir event patterns, porcelain v2 semantics, and OpenTUI `0.5.14` suspend/resume. These rest on primary source at pinned commits or versions, and local experiments on Git 2.51.0 and Bun 1.4.2 confirm them. Medium — on terminal behaviour after a crashed or killed tool, on large-repository costs, and on blame cost. The first is inferred from code, and the others come from one machine and synthetic repositories.

**Open Questions:**

- Does a `SIGKILL`ed or crashing lazygit leave terminal modes (any-motion mouse, extra kitty keyboard pushes) that persist after `resume()` in kitty, Ghostty, and tmux? This needs a real-terminal test.
- Do kitty or sixel images re-render after `resume()` without extra work in so?
- How do SIGTSTP (Ctrl-Z) and SIGHUP behave while the tool runs?
- What is the minimum Git version so supports? `--path-format` needs 2.31, porcelain v2 needs 2.11, and the blame `--contents` sentinel changed in 2.41.
- How does an index blob behave when it differs from the working file through `.gitattributes` filters other than EOL (LFS, `ident`)?

**Immutability Note:** This artifact records evidence against the stated baseline commit and exact evaluated revisions. Later requirements may cite these findings as informing a new revision, but this artifact must not be changed to claim that it evaluated that later revision.
