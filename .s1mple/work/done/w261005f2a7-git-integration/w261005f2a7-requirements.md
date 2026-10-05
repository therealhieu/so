# W261005F2A7: git-integration — Requirements

**Document Status:** Ready for System Design

**Context Source:** `w261005f2a7-discuss-context.md`

**Research Source:** `w261005f2a7-research.md` (commit `430187e`)

**Unresolved Items:** None

**Ready for System Design Checklist:**

- [x] Every active topic is covered.
- [x] Every current requirement has a stable, unique ID and exact current revision.
- [x] Every current requirement includes its question, answer, rationale, acceptance criteria, and dependencies.
- [x] Scope, constraints, assumptions, risks, and compatibility boundaries are explicit.
- [x] For roadmap-linked work, the accepted parent baseline has been checked, assigned scope is covered by current requirements, and gates due before requirements approval have evidence; unresolved parent impacts prevent readiness. (Not applicable — standalone work.)
- [x] Revised and replaced requirements preserve append-only lineage and complete prior revisions.
- [x] When research exists, every RF-to-evaluated-revision relationship has one reconciliation outcome; a finding that evaluated no requirement has one `None` relationship row.
- [x] Deferred decisions are outside the current-requirements ledger.
- [x] `Unresolved Items` is `None`.

# Table of Contents

1. [Problem and Desired Outcome](#1-problem-and-desired-outcome)
2. [Current and Expected State](#2-current-and-expected-state)
3. [Scope](#3-scope)
4. [Standards and Constraints](#4-standards-and-constraints)
5. [Current Requirements](#5-current-requirements)
   - [W261005F2A7-REQ1@R2: Native Git writes are limited to hunk stage and reset](#w261005f2a7-req1r2-native-git-writes-are-limited-to-hunk-stage-and-reset)
   - [W261005F2A7-REQ2@R2: The Git tool runs full screen with so suspended](#w261005f2a7-req2r2-the-git-tool-runs-full-screen-with-so-suspended)
   - [W261005F2A7-REQ3@R1: The Git tool is configurable and fails with a clear notice](#w261005f2a7-req3r1-the-git-tool-is-configurable-and-fails-with-a-clear-notice)
   - [W261005F2A7-REQ4@R3: Native Git display scope](#w261005f2a7-req4r3-native-git-display-scope)
   - [W261005F2A7-REQ5@R2: Gutter signs compare the live buffer against the index](#w261005f2a7-req5r2-gutter-signs-compare-the-live-buffer-against-the-index)
   - [W261005F2A7-REQ6@R2: Git state refreshes on events, including a narrow git-dir watch](#w261005f2a7-req6r2-git-state-refreshes-on-events-including-a-narrow-git-dir-watch)
   - [W261005F2A7-REQ7@R2: Git works for a workspace anywhere inside one repository](#w261005f2a7-req7r2-git-works-for-a-workspace-anywhere-inside-one-repository)
   - [W261005F2A7-REQ8@R1: Dirty buffers are saved before the Git tool opens](#w261005f2a7-req8r1-dirty-buffers-are-saved-before-the-git-tool-opens)
   - [W261005F2A7-REQ9@R1: Stage hunk saves the buffer before staging](#w261005f2a7-req9r1-stage-hunk-saves-the-buffer-before-staging)
6. [Research Impact Review](#6-research-impact-review)
7. [Historical Requirement Revisions](#7-historical-requirement-revisions)

# 1. Problem and Desired Outcome

## Problem Statement

so is blind to Git. Notes workspaces are often Git repositories, so the user leaves the editor to see what changed, to stage or discard a change, and to commit or sync.

## Desired Outcome

so behaves like LazyVim. Light Git awareness and hunk actions are native, in the style of gitsigns: gutter signs, hunk navigation, preview, stage, reset, statusline, explorer markers, and line blame. One key hands the terminal to lazygit for everything else and returns to an editor that reflects the new disk and Git state.

# 2. Current and Expected State

## Current State

```text
so ──► notes on disk ◄── git (outside so: separate terminal / lazygit)
 │
 └─ ignore.ts:13 hides .git/ → watcher drops .git events → so never sees commits, branch switches
    checkout rewriting a note → arrives as external "changed" → reload / conflict dialog
```

so spawns external commands only for clipboard, trash, and opening a browser (`src/workspace/system.ts`), and nothing runs inside the workspace. There is no branch, file status, or line-change display, so every Git action happens outside the editor.

## Expected State

```text
                 ┌──────────────────── native (gitsigns-like) ─────────────────────┐
so ── git CLI ──►│ gutter + ~ _ ‾ ~_ untracked · ]h/[h · preview · stage / reset   │
  (lock-free     │ statusline branch +a ~c -d · explorer M/A/?/D/U · line blame    │
   reads, ≥2.31) └──────────────────────────────────────────────────────────────────┘
                     ▲ refresh: own writes · stage/reset · tool exit · workspace changes
                     │          · gitdir + commondir + branch ref dir, minus *.lock  (debounced)

<leader>gg ──► save dirty buffers → renderer.suspend() → ignore SIGINT → git.tool (lazygit) full screen
                                                                              │ exit / killed
               refresh Git state + re-check open files ◄── renderer.resume() ◄── reset foreign modes
```

so reads Git state with the `git` CLI and performs only two Git writes of its own: stage hunk and reset hunk. Commit, sync, branches, stash, and history stay in the configured Git tool, so so needs no credential or network handling.

# 3. Scope

## In Scope

- Repository and `git` discovery for a workspace anywhere inside one repository.
- Live gutter hunk signs, hunk navigation, hunk preview, stage hunk, and reset hunk.
- A statusline Git segment, explorer status markers, and cursor-line blame.
- Launching a configurable full-screen Git tool (default lazygit) with so suspended, then refreshing on return.
- Event-driven refresh, including a narrow watch on the resolved git directory.
- A `git` config section following existing schema conventions.

## Out of Scope

- Native commit, push, pull, fetch, branch, stash, rebase, and history views. These are delegated to the Git tool (REQ1).
- Unstaging a hunk natively. lazygit covers it. Future trigger: frequent requests to undo a stage without leaving so.
- An embedded floating terminal window for lazygit. It would need VT emulation and a new dependency. Future trigger: so gains a terminal emulator for another reason.
- Multiplexer popups (tmux `display-popup`). Future trigger: user demand for keeping so visible under tmux.
- Several repositories inside one workspace. Future trigger: a multi-repo workspace becomes a supported layout.
- Configuring lazygit's edit behaviour (for example `LG_CONFIG_FILE` with an `os.editPreset`) so that editing a file from lazygit opens it in the running so. The tool stays an opaque argv. Future trigger: so gains a way to open files on request from another process (RF10).
- Honouring `.git-blame-ignore-revs` in line blame. Future trigger: user demand for skipping formatting commits (RF13).
- Polling as a fallback when the git-dir watcher cannot start. Future trigger: reports of stale Git state on filesystems where `fs.watch` fails (RF7).
- Hosting-provider features (pull requests, issues), non-Git VCS, and changes to the link index or note format.

## Roadmap Assignment

None — standalone work

## Affected Interfaces and Actors

- User — new `<leader>g…` keys, `]h`/`[h`, and palette commands.
- `src/core/state/types.ts` `Effect`/`Action` — new Git read, stage, launch, and result variants.
- `src/core/kernel/view` render rows and the editor gutter — Git signs get their own gutter column inside a repository.
- `src/core/state/status.ts` `StatusSegments` and `src/ui/views/statusline.ts` — new Git segment that competes for width.
- `src/ui/views/explorer.ts` — status markers on rows.
- `src/ui/shell.ts` renderer — `suspend()` / `resume()` around the Git tool.
- `src/workspace` — new Git adapter and git-dir watcher.
- `src/core/config/schema.ts` — new `git` section.

# 4. Standards and Constraints

## Binding Standards

- `.s1mple/docs/project.md` Boundaries, enforced by `test/boundaries.test.ts:16-30` — `src/core` stays pure. Git processes, file reads, and watchers live in `src/workspace`, wiring lives in `src/app`, and only `src/ui` touches the renderer.
- `.s1mple/docs/project.md` Architecture — `update` is pure and synchronous. Git results reach state only as actions from the effect runner.
- `.s1mple/docs/project.md` Startup, `src/app/main.ts:361-391` — no Git work before the first frame. Discovery runs in the deferred startup block.
- `.s1mple/docs/project.md` Pins — any new dependency is an exact pin.
- `src/core/config/schema.ts:62-93` — the strict schema gets its own `git` section, and unknown keys are errors.
- `.s1mple/S1MPLE.md` Implementation — no work-process identifiers in code.

## Constraints

- External commands run as argv via `Bun.spawn` with no shell, following `src/workspace/system.ts:17-45`.
- The single `bun build --compile` binary must not gain a native Git library.
- Git 2.31 or later (`rev-parse --path-format`, RF8). Apple Git 2.39.3 at `/usr/bin/git` qualifies.
- Every Git read uses `--no-optional-locks` and never writes the index (RF6).
- Typing latency and first frame must not regress. The live hunk diff is debounced off the keystroke path, and status and blame reads are async.
- `.git/` remains hidden from the explorer, index, search, and the workspace watcher (`src/workspace/ignore.ts:13-14`). Git-dir watching is a separate, narrow watcher.

## Accepted Assumptions

- so reads Git state through the `git` CLI, not a JS library. lazygit already requires `git`, and the binary stays unchanged.
- `git` and the Git tool may be absent, or `git` may be older than 2.31. Their absence disables features without errors (REQ3, REQ7).
- Reset hunk restores the index version of the hunk, gitsigns semantics, consistent with REQ5.
- Hunk boundaries may differ slightly from `git diff` in ambiguous spots, because Myers implementations break ties differently from Git's xdiff. Staging stays correct because patches come from so's own hunks (RF14).
- Default keys follow LazyVim: `<leader>gg` tool, `]h`/`[h` hunks, `<leader>ghp` preview, `<leader>ghs` stage, `<leader>ghr` reset, `<leader>ghb` blame. `<leader>g` is unused today.

## Dependencies

- `git` executable on `PATH` — the source of all Git state and the stage write.
- Configured Git tool (default `lazygit`) — owns every Git write other than hunk stage and reset.
- OpenTUI `CliRenderer.suspend()` / `resume()` (`node_modules/@opentui/core/renderer.d.ts:590-591`) — hands the terminal to the tool.
- Existing save path and disk-change path (reload / conflict dialog) — reused by REQ2, REQ8, and REQ9.

## Risks and Compatibility

- **Gutter cell contention** — fold markers and the reveal and error signs already use the one sign cell (`src/core/lang/markdown/live-preview.ts:86-141`). REQ4@R3 gives Git signs their own column, so neither signal is lost; the gutter is one cell wider inside a repository.
- **Index feedback loops** — a plain `git status` rewrites `.git/index`. Every read uses `--no-optional-locks` (REQ6). Lock-free reads skip refreshing stale stat data, so status can stay slower (about 206 ms vs 47 ms on 20,000 files) until another tool refreshes the index. That cost is accepted (RF6).
- **Interrupts during the hand-off** — so's `SIGINT` handler (`src/app/lifecycle.ts:66-67`) must not end so while the tool runs (REQ2, RF12).
- **Terminal state after a killed tool** — verifying that foreign modes are cleared after `SIGKILL` needs a real-terminal test in Ghostty, kitty, and tmux. The research could not run it (RF11 open question).
- **Large repositories** — status is limited to the workspace path (REQ7). Explorer markers must not need a full-repo walk per refresh.
- **Statusline width** — the Git segment must yield to higher-priority segments on narrow terminals (`src/ui/views/statusline.ts:45-50`).

# 5. Current Requirements

## W261005F2A7-REQ1@R2: Native Git writes are limited to hunk stage and reset

**Requirement ID:** `W261005F2A7-REQ1`

**Revision:** `R2`

**Previous Revision:** `W261005F2A7-REQ1@R1`

**Replaces:** None

**Research Relationship:** `RF2`, `RF3`, `RF4`, `RF5` evaluated `W261005F2A7-REQ1@R1` and informed this revision

**Revision Summary:** Stage hunk now registers an untracked file with intent-to-add (RF2). It refuses on conflicted files (RF2), and it re-checks the index entry before applying so it never stages at a wrong position (RF3). Patches use the index's line-ending form, and reset text uses the buffer's (RF4). Resetting an end-of-file hunk restores the index's trailing-newline state (RF5).

**Question:** Should so itself ever change Git state (index or working tree), or should every Git write go through lazygit?

**Answer:** so reads Git status and diffs. Its only Git-related writes are staging the hunk under the cursor into the index and resetting a hunk.

- **Staging an untracked file:** stage first records the file with intent-to-add.
- **Conflicted file:** stage refuses with a notice.
- **Stale index:** if the file's index entry changed since its hunks were computed, stage re-reads and re-diffs instead of applying.
- **Reset:** applied as an ordinary, undoable buffer edit, including the index's trailing-newline state at end of file, and saved through the normal path.

Commit, push/pull, branches, stash, and history belong to the configured Git tool.

**Rationale:** This is the LazyVim/gitsigns split the user wants. Single-hunk staging needs zero-context patches (`git apply --cached --unidiff-zero`). Those carry no context Git can verify, so a stale index copy would silently place a line wrongly (RF3). Checking the index entry just before applying shrinks that window to milliseconds. Making reset a buffer edit keeps it undoable and keeps the file under so's save path.

```text
cursor on hunk → stage hunk → save (REQ9) → untracked? git add --intent-to-add
              → index entry still matches? ─ no → re-read index blob, re-diff, notice
                                          └ yes → git apply --cached --unidiff-zero <patch in index EOL form>
cursor on hunk → reset hunk → buffer edit with index lines (+ final-newline state) → one `u` undoes it
everything else → <leader>gg → Git tool
```

**Acceptance Criteria:**

- [ ] Stage hunk adds exactly the hunk under the cursor to the index. Other hunks in the file stay unstaged.
- [ ] Staging a hunk of an untracked file works, and that file then shows as added in Git status.
- [ ] If the index entry changes between the hunk computation and staging, for example a line staged in another terminal, so does not stage at a wrong position. It refreshes the hunks and tells the user.
- [ ] Staging a hunk in a conflicted file is refused with a notice.
- [ ] In a CRLF note, or with `core.autocrlf=true`, staging one edited line stages only that line.
- [ ] Reset hunk replaces the hunk's lines in the buffer with the index version, and one `u` restores them.
- [ ] Resetting a final-line hunk where only one side has a trailing newline restores the index's trailing-newline state.
- [ ] so never invokes a Git command that commits, changes branches, stashes, or contacts a remote.

**Depends On:** `W261005F2A7-REQ5@R2`

## W261005F2A7-REQ2@R2: The Git tool runs full screen with so suspended

**Requirement ID:** `W261005F2A7-REQ2`

**Revision:** `R2`

**Previous Revision:** `W261005F2A7-REQ2@R1`

**Replaces:** None

**Research Relationship:** `RF11`, `RF12` evaluated `W261005F2A7-REQ2@R1` and informed this revision; `RF10` evaluated `W261005F2A7-REQ2@R1` and supported it

**Revision Summary:** An interrupt while the tool runs no longer ends so (RF12). After any tool exit, terminal modes the tool may have left behind are reset before so restores its own, and images reappear (RF11).

**Question:** How should so run lazygit?

**Answer:** The Git tool command suspends so's renderer and runs the tool with inherited stdio in the repository top level. While the tool runs, an interrupt such as Ctrl-C does not end so. When the tool exits for any reason, so resets terminal modes it does not use and resumes its renderer, which restores its own modes and repaints fully, images included. It then refreshes Git state and re-checks open files against disk.

**Rationale:** It needs no new UI, works in every terminal, and gives the tool the real terminal. The Helix recipe and micro use the same hand-off (RF10, RF12). OpenTUI's `suspend()`/`resume()` restore the modes so uses (RF11). Two gaps remain. so's `SIGINT` handler would shut so down when a cooked-mode child (pager, hook, `$EDITOR`) gets Ctrl-C (`src/app/lifecycle.ts:66-67`). A killed tool can also leave modes so never enables.

```text
<leader>gg → save dirty buffers → renderer.suspend() → ignore SIGINT → spawn(git.tool, stdio: inherit, cwd: repoTop)
                                                                          │ exit (any code / signal)
  refresh Git state + re-check open files ◄── renderer.resume() ◄── restore SIGINT ◄── reset foreign terminal modes
```

**Acceptance Criteria:**

- [ ] While the tool runs, so draws nothing and reads no input.
- [ ] Ctrl-C delivered while the tool, or a program it starts, is running does not exit so. so returns after the tool exits.
- [ ] After the tool exits with any status or is killed by a signal, so restores the alt screen, raw mode, kitty keyboard, and mouse reporting. It repaints, including images.
- [ ] After a killed tool that had enabled a mouse or keyboard mode so does not use, that mode is off once so resumes.
- [ ] A file rewritten by the tool, through checkout, pull, or discard, shows its new content after return.
- [ ] Git signs, statusline, and explorer markers reflect the post-tool state after return.

**Depends On:** `W261005F2A7-REQ3@R1`, `W261005F2A7-REQ8@R1`

## W261005F2A7-REQ3@R1: The Git tool is configurable and fails with a clear notice

**Requirement ID:** `W261005F2A7-REQ3`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF8` evaluated and retained this exact revision; `RF10` evaluated it and its consideration was deferred

**Revision Summary:** None — initial revision

**Question:** What should happen when the lazygit command can't run, because lazygit isn't installed or the workspace isn't in a Git repo?

**Answer:** The tool is the `git.tool` argv, `["lazygit"]` by default. If its executable is not found or the workspace is not inside a Git repository, so does not suspend and shows a statusline notice naming the cause.

**Rationale:** The behavior is predictable and never leaves the user in an unexpected screen. An argv lets the user substitute `gitui`, `tig`, or lazygit with flags.

```jsonc
"git": { "tool": ["lazygit"] }       // or ["gitui"], ["lazygit", "--use-config-file", "~/.config/lazygit/notes.yml"]
```

**Acceptance Criteria:**

- [ ] With `git.tool = ["gitui"]`, the command runs `gitui`.
- [ ] With the tool missing from `PATH`, the command shows a notice naming the tool and `git.tool`, and so stays active.
- [ ] Outside a repository, the command shows "not a git repository" and so stays active.
- [ ] An empty or non-string `git.tool` is a config error.

**Depends On:** None

## W261005F2A7-REQ4@R3: Native Git display scope

**Requirement ID:** `W261005F2A7-REQ4`

**Revision:** `R3`

**Previous Revision:** `W261005F2A7-REQ4@R2`

**Replaces:** None

**Research Relationship:** `RF1`, `RF8`, `RF9`, `RF13` evaluated `W261005F2A7-REQ4@R1` and informed `W261005F2A7-REQ4@R2`; `RF6` evaluated `W261005F2A7-REQ4@R1` with no impact. No finding evaluated this revision.

**Revision Summary:** The accepted UI mockups `W261005F2A7-M1@R3` and `W261005F2A7-M2@R3` (accepted by the user on 2026-10-05) change three display obligations:

- **Gutter:** Git signs get their own gutter column, so they never hide the other gutter signs on the same line.
- **Statusline:** an untracked file or a repository with no commits shows the ref without counts.
- **Explorer:** there is no deleted-file marker. A deleted file has no explorer row, so it only marks its folders as containing changes.

**Question:** Which native Git features ship in this work?

**Answer:** The native features are:

- **Gutter:** hunk signs for added, changed, deleted, top-of-file-deleted, changed-and-deleted, and untracked lines, in a Git column of their own that appears only inside a repository.
- **Hunks:** next and previous navigation, preview, stage, and reset.
- **Statusline:** a segment with the branch, a short commit for detached HEAD, the branch name for an unborn branch, a `rebasing` or `merging` suffix while one is in progress, and the active file's added/changed/deleted counts. An untracked file and a repository with no commits show no counts.
- **Explorer:** markers on rows for modified, staged, untracked (per file, including inside new folders), and conflicted files. A folder shows that it contains changes, including deleted tracked files below it.
- **Blame:** on-demand blame for the cursor line, computed against the buffer text. It shows "not committed yet" for uncommitted lines, untracked files, and repositories with no commits.

**Rationale:** The user chose gitsigns parity plus file-level visibility and line provenance, displayed the way LazyVim does. A separate conflict marker matters because porcelain v2 reports unmerged entries as their own type (RF9). Blame must use the buffer text (`--contents -`) so line numbers match unsaved edits. It must also recognise both the pre-2.41 and post-2.41 "not committed" markers (RF13). During mockup review the user found that a Git sign sharing the single sign cell touches the text and competes with the reveal and error signs, so Git signs take their own column. Counts for a file with no index base would only repeat its line count, so they are left out.

```text
explorer          editor                                         statusline
 M inbox.md   │ ‾   1  # Inbox             ‾ deleted at top       NORMAL inbox.md  ⎇ main +1 ~1 -1
 ? ideas.md   │ ~   3 ▕- [x] buy milk      ~ changed              NORMAL inbox.md  ⎇ a1b2c3d rebasing +1
 U plan.md    │ +   4  - [ ] call bank     + added                NORMAL ideas.md  ⎇ main   (untracked: no counts)
 ▾ new/ •     │ _   5  - [ ] email         _ deleted below
   ? x.md     │ ≃   6  - [ ] pay rent      ≃ changed + deleted
 ▸ old/ •     │   (old/gone.md deleted: no row, its folder shows •)
```

**Acceptance Criteria:**

- [ ] Each sign type (added, changed, deleted, top-deleted, changed-and-deleted, untracked) appears on the right lines and is visually distinct.
- [ ] A Git sign and another gutter sign on the same line are both visible. Outside a repository the gutter is unchanged.
- [ ] Next and previous hunk navigation moves the cursor to the first line of the adjacent hunk and stops at the ends.
- [ ] Hunk preview shows the index lines the hunk replaces.
- [ ] The statusline shows the branch, a short commit when detached, the branch name in a repository with no commits, and a `rebasing`/`merging` suffix during those operations, plus the active file's counts. An untracked file and a repository with no commits show no counts. It yields on narrow terminals.
- [ ] Explorer rows show modified, staged, untracked, and conflicted states with distinct markers. Files inside a new untracked folder each show the untracked marker. A folder shows that it contains changes, including when the only change below it is a deleted tracked file.
- [ ] Line blame on an unsaved buffer reports the line as it appears in the buffer. It shows author, relative date, and summary for committed lines and "not committed yet" otherwise, on Git 2.31 and later.
- [ ] Blame in an untracked file or a repository with no commits shows "not committed yet" without an error.
- [ ] Outside a repository, none of these surfaces render Git content.

**Depends On:** `W261005F2A7-REQ5@R2`, `W261005F2A7-REQ7@R2`

## W261005F2A7-REQ5@R2: Gutter signs compare the live buffer against the index

**Requirement ID:** `W261005F2A7-REQ5`

**Revision:** `R2`

**Previous Revision:** `W261005F2A7-REQ5@R1`

**Replaces:** None

**Research Relationship:** `RF1`, `RF2`, `RF4`, `RF14` evaluated `W261005F2A7-REQ5@R1` and informed this revision

**Revision Summary:**

- **Normalisation:** both sides of the diff use the same BOM, line-ending, and final-newline form (RF4).
- **Bounded cost:** a diff where nothing matches is capped so it cannot stall typing (RF14).
- **Untracked files:** shown with the untracked sign rather than "added" (RF1, user decision).
- **Staging untracked hunks:** possible through REQ1's intent-to-add step (RF2).

**Question:** What should the gutter signs compare against: the live buffer or the saved file, and the index or HEAD?

**Answer:** Hunks are computed in-process between the current buffer text and the file's index version, debounced while typing. Both sides are normalised to the same BOM, line-ending, and final-newline form before diffing. The diff's cost is bounded: when the texts share no lines, or the edit is too large, the result is a single changed hunk instead of a long computation. A hunk that has been staged no longer shows a sign. An untracked file shows every line with the untracked sign. Stage, reset, preview, navigation, and statusline counts all use these same hunks.

**Rationale:** Signs stay live with autosave on or off, and stage hunk has a visible effect. This matches gitsigns (RF1). Without normalisation, a CRLF note against an LF index shows every line changed. That is also the input that makes Myers diff slow: 0.3–5 s on 5,000 lines (RF4, RF14). Normal edits cost 0.02–6 ms.

```text
type → debounce → normalise(indexBlob), normalise(buffer) → trim common prefix/suffix
     → no common line or over edit cap? → one "changed" hunk
     → else Myers diff → hunks → signs / counts
index changed (stage, tool, external) → re-read indexBlob → re-diff
```

**Acceptance Criteria:**

- [ ] An unsaved edit shows its sign before any save.
- [ ] After staging a hunk, its sign disappears and the other hunks keep theirs.
- [ ] An untracked file shows every line with the untracked sign. A file ignored by Git shows no signs.
- [ ] A CRLF note, or `core.autocrlf=true`, with one edited line shows exactly one changed line. A BOM present in only one of the two forms does not mark every line changed.
- [ ] Typing in a 5,000-line note does not run a Git process per keystroke.
- [ ] A 5,000-line note whose every line differs from the index does not push typing past the keystroke budget (`.s1mple/docs/project.md` Benchmarks).

**Depends On:** `W261005F2A7-REQ6@R2`

## W261005F2A7-REQ6@R2: Git state refreshes on events, including a narrow git-dir watch

**Requirement ID:** `W261005F2A7-REQ6`

**Revision:** `R2`

**Previous Revision:** `W261005F2A7-REQ6@R1`

**Replaces:** None

**Research Relationship:** `RF6`, `RF7` evaluated `W261005F2A7-REQ6@R1` and informed this revision; `RF9` evaluated it and supported it; `RF3` evaluated it with no impact

**Revision Summary:**

- **Lock-free reads:** every Git read is lock-free, not only status (RF6).
- **Watch targets:** the git dir and common dir at first level, plus the current branch's ref directory, ignoring lock and cookie files (RF7).
- **Watcher failure:** refresh falls back to the other event triggers without polling (RF7, user decision).

**Question:** When should so refresh repo-wide Git state (branch, explorer markers, index blobs)?

**Answer:** A refresh runs one async status read, coalesced over a short window of about 200 ms. It is triggered by:

- so's own writes;
- stage or reset;
- the Git tool exiting;
- workspace file changes;
- first-level changes in the resolved git dir and common dir, and in the current branch's ref directory. Lock files (`*.lock`) and `.watchman-cookie*` are ignored, and the branch ref directory follows branch switches.

Every Git read so performs (status, file info, blob, blame) is lock-free and never writes the index. If the git-dir watcher cannot start, refresh continues on the other triggers. There is no polling.

**Rationale:** Commits and checkouts made elsewhere show up promptly without polling. gitsigns uses the same 200 ms window and target set, and VS Code and Zed filter the same lock files (RF7). A plain `git status` writes `index` and would re-trigger the watcher. `--no-optional-locks` produced zero watcher events in local tests (RF6). A plain `refs/` watch misses branch names containing `/`.

```text
own write / stage / reset / tool exit ─┐
workspace file changed ────────────────┤
<gitdir>/* , <commondir>/* ────────────┼─► drop *.lock, .watchman-cookie* ─► debounce ~200 ms
<commondir>/refs/heads/<branch dir>/* ─┘       ─► git --no-optional-locks status (async) ─► state
```

**Acceptance Criteria:**

- [ ] A commit made in another terminal updates the statusline and explorer within one second without user input.
- [ ] A branch switch made outside so, including to a branch named `feature/x`, updates the branch and the open buffers' signs.
- [ ] A burst of index changes produces a bounded number of status runs, not one per event.
- [ ] No Git read by so modifies `.git/index` or triggers a further refresh.
- [ ] If the git-dir watcher fails to start, so keeps working and refreshes on its own writes, stage/reset, and tool exit.

**Depends On:** `W261005F2A7-REQ7@R2`

## W261005F2A7-REQ7@R2: Git works for a workspace anywhere inside one repository

**Requirement ID:** `W261005F2A7-REQ7`

**Revision:** `R2`

**Previous Revision:** `W261005F2A7-REQ7@R1`

**Replaces:** None

**Research Relationship:** `RF7`, `RF8` evaluated `W261005F2A7-REQ7@R1` and informed this revision; `RF9` evaluated it and supported it

**Revision Summary:**

- **Worktrees:** a linked worktree watches both its private git dir and the common dir (RF7).
- **No commits yet:** a repository with no commits is supported (RF8).
- **Minimum Git:** Git 2.31 is the minimum, and older Git disables Git features with a notice (RF8, user decision).

**Question:** Which repository layouts must work?

**Answer:** so finds the repository from the workspace with Git. Supported layouts are the repository top level, a subfolder, a linked worktree (watching both its own git dir and the shared common dir), and a repository with no commits yet. Status reads are limited to the workspace path, a submodule appears as a single entry, and the Git tool runs at the repository top level. Git 2.31 or later is required. With an older Git, Git features are off and one notice names the found version. With no repository or no `git` executable, Git display is off with no errors.

**Rationale:** This covers the common layouts while keeping status cost proportional to the notes (20 ms for a 100-file folder in a 20,000-file repo, RF9). One `rev-parse --path-format=absolute` call yields the top level, git dir, common dir, and workspace prefix, and `--path-format` needs Git 2.31 (RF8). That minimum still covers Apple Git 2.39.3, which ships at `/usr/bin/git`.

```text
~/dotfiles/          ← repo top level (Git tool cwd)
└── notes/           ← so workspace → git status -- notes/
    ├── inbox.md  M
    └── todo.md
linked worktree: <wt>/.git → gitdir …/.git/worktrees/wt (HEAD, index)  +  commondir …/.git (refs, packed-refs)
```

**Acceptance Criteria:**

- [ ] Opening a repo subfolder shows markers and signs with correct paths relative to that workspace.
- [ ] In a linked worktree, a commit made from that worktree and a branch update made from the main checkout both refresh so.
- [ ] A freshly `git init`ed repository with no commits shows signs, untracked markers, and the branch name without errors.
- [ ] Changes outside the workspace path do not appear in counts or markers.
- [ ] With Git older than 2.31, so starts normally, shows one notice naming the version, and renders no Git UI.
- [ ] Without `git` on `PATH`, or outside a repository, so starts normally and shows no Git UI or error.

**Depends On:** None

## W261005F2A7-REQ8@R1: Dirty buffers are saved before the Git tool opens

**Requirement ID:** `W261005F2A7-REQ8`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF10` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** What should happen to unsaved buffers when you open lazygit?

**Answer:** Before suspending, every dirty buffer is written through the normal save path. If any write fails, the tool does not launch and the notice names the file. On return, Git rewrites of the now-clean buffers reload through the existing disk-change path.

**Rationale:** The tool reads disk, so saving first means it stages and commits what the user typed. Clean buffers make checkout or pull reload silently instead of opening a conflict dialog per file. This matches autosave being on by default.

```text
<leader>gg → save inbox.md, todo.md ✓ → suspend → tool → exit
           → resume → todo.md rewritten by checkout → clean → reload, no dialog
```

**Acceptance Criteria:**

- [ ] With two dirty buffers, both are on disk before the tool starts.
- [ ] If a save fails, for example on a read-only file, the tool does not start and the notice names that file.
- [ ] After a checkout in the tool that rewrites an open file, the buffer shows the new content with no conflict dialog.

**Depends On:** None

## W261005F2A7-REQ9@R1: Stage hunk saves the buffer before staging

**Requirement ID:** `W261005F2A7-REQ9`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** `RF2`, `RF3` evaluated and retained this exact revision

**Revision Summary:** None — initial revision

**Question:** If the buffer has unsaved edits, what does stage hunk put into the index?

**Answer:** Stage hunk first saves the active buffer through the normal save path, then stages the hunk computed from the saved text against the index. If the save fails, nothing is staged and the notice names the file.

**Rationale:** The index never holds text that was never written to disk, which avoids a confusing staged-versus-disk split in lazygit. It is consistent with REQ8.

```text
dirty buffer → stage hunk → save ✓ → patch(saved text vs index) → git apply --cached → sign gone
```

**Acceptance Criteria:**

- [ ] Staging in a dirty buffer leaves the buffer clean and the hunk staged with the typed text.
- [ ] After staging, `git diff --cached` contains the hunk and `git diff` for that hunk is empty.
- [ ] A failed save stages nothing.

**Depends On:** `W261005F2A7-REQ1@R2`, `W261005F2A7-REQ5@R2`

# 6. Research Impact Review

The user approved every outcome on 2026-10-05, including the Q1–Q3 decisions on untracked and conflict display, minimum Git version, and watcher failure.

`W261005F2A7-REQ4@R3` was revised later from the accepted UI mockups, not from research. The rows below keep the revision each finding informed and name the current revision in brackets.

| Finding | Evaluated Revision | Assessment | Outcome | Current Requirement(s) | Rationale |
|---|---|---|---|---|---|
| `RF1` | `W261005F2A7-REQ5@R1` | Supports buffer-vs-index diff and blob caching; adds untracked-sign and large-file considerations | Revised | `W261005F2A7-REQ5@R2` | Untracked lines use the untracked sign by user decision. Size is bounded through the diff cap (RF14) rather than a line cut-off. |
| `RF1` | `W261005F2A7-REQ4@R1` | Adds LazyVim's untracked, top-delete, and change-delete sign types | Revised | `W261005F2A7-REQ4@R2` (now `W261005F2A7-REQ4@R3`) | The user chose LazyVim-style signs. |
| `RF2` | `W261005F2A7-REQ1@R1` | Supports `git apply --cached --unidiff-zero`; untracked files need intent-to-add; conflicted files need handling | Revised | `W261005F2A7-REQ1@R2` | Without intent-to-add, untracked hunks cannot be staged. Refusing on conflicts keeps the write set small. |
| `RF2` | `W261005F2A7-REQ9@R1` | Save-then-stage is a deliberate, coherent departure from gitsigns | Retained | `W261005F2A7-REQ9@R1` | The mechanism works on saved text. Keeping the index a subset of disk content was the user's choice. |
| `RF2` | `W261005F2A7-REQ5@R1` | Untracked hunks are stageable only after intent-to-add | Revised | `W261005F2A7-REQ5@R2` | The stage step lives in REQ1@R2, and REQ5@R2 names the untracked sign. |
| `RF3` | `W261005F2A7-REQ1@R1` | Challenges "exactly the hunk": zero-context patches apply silently against a changed index | Revised | `W261005F2A7-REQ1@R2` | Checking the index entry before staging prevents silent misplacement. |
| `RF3` | `W261005F2A7-REQ9@R1` | The `git diff --cached` criterion is at risk under the same race | Retained | `W261005F2A7-REQ9@R1` | REQ1@R2's freshness check covers the race, and REQ9's obligation is unchanged. |
| `RF3` | `W261005F2A7-REQ6@R1` | The debounce leaves a window with a stale cached blob | No impact | `W261005F2A7-REQ6@R2` | The stage-time check in REQ1@R2 handles it, and refresh timing can stay as it is. |
| `RF4` | `W261005F2A7-REQ5@R1` | Adds an EOL/BOM normalisation constraint; a mismatch shows every line changed | Revised | `W261005F2A7-REQ5@R2` | Normalising both sides is required for correct signs and bounded cost. |
| `RF4` | `W261005F2A7-REQ1@R1` | Patches must use the index's line-ending form; a CR-bearing patch fails on an LF index | Revised | `W261005F2A7-REQ1@R2` | A CRLF staging criterion was added. |
| `RF5` | `W261005F2A7-REQ1@R1` | Supports reset as a buffer edit; adds restoring the end-of-file newline | Revised | `W261005F2A7-REQ1@R2` | Folded into the same REQ1 revision as RF2–RF4, with an EOF criterion added. |
| `RF6` | `W261005F2A7-REQ6@R1` | Supports "no index writes"; every read, not only status, must be lock-free | Revised | `W261005F2A7-REQ6@R2` | Blame, `ls-files`, and blob reads also go through Git and must not write the index. |
| `RF6` | `W261005F2A7-REQ4@R1` | Stale-stat files slow lock-free status until something refreshes the index | No impact | `W261005F2A7-REQ4@R2` (now `W261005F2A7-REQ4@R3`) | About 206 ms worst case on 20,000 files stays within the one-second refresh criterion. Recorded as an accepted risk. |
| `RF7` | `W261005F2A7-REQ6@R1` | Supports ~200 ms coalescing; a plain `refs/` watch misses nested branch names; lock files must be filtered; poll fallback exists in gitsigns | Revised | `W261005F2A7-REQ6@R2` | The trigger set was reworded to match gitsigns. On watcher failure, refresh falls back to the other triggers without polling, by user decision. Polling is deferred. |
| `RF7` | `W261005F2A7-REQ7@R1` | Worktree HEAD/index live in the private git dir and refs in the common dir | Revised | `W261005F2A7-REQ7@R2` | Both directories must be watched. |
| `RF8` | `W261005F2A7-REQ7@R1` | One rev-parse covers all layouts; unborn HEAD and the Git version need stating | Revised | `W261005F2A7-REQ7@R2` | No-commit repos are supported. Git ≥ 2.31 by user decision. |
| `RF8` | `W261005F2A7-REQ4@R1` | Adds statusline cases for unborn, detached, and rebase/merge | Revised | `W261005F2A7-REQ4@R2` (now `W261005F2A7-REQ4@R3`) | The statusline content for each case is now defined. |
| `RF8` | `W261005F2A7-REQ3@R1` | Supports the "not a git repository" notice | Retained | `W261005F2A7-REQ3@R1` | Discovery failure maps directly to the notice. |
| `RF9` | `W261005F2A7-REQ4@R1` | Supports the marker set; unmerged is its own type; the `-u` mode decides per-file untracked markers | Revised | `W261005F2A7-REQ4@R2` (now `W261005F2A7-REQ4@R3`) | Separate conflict marker and per-file untracked markers (`-uall`), by user decision. |
| `RF9` | `W261005F2A7-REQ7@R1` | Supports pathspec scoping and single-entry submodules | Retained | `W261005F2A7-REQ7@R2` | No change from RF9. REQ7 was revised for RF7 and RF8. |
| `RF9` | `W261005F2A7-REQ6@R1` | Supports one cheap status call per refresh (20–48 ms on 20,000 files) | Retained | `W261005F2A7-REQ6@R2` | No change from RF9. REQ6 was revised for RF6 and RF7. |
| `RF10` | `W261005F2A7-REQ2@R1` | Supports the full-screen hand-off at the git root (Helix recipe, LazyVim cwd) | Retained | `W261005F2A7-REQ2@R2` | No change from RF10. REQ2 was revised for RF11 and RF12. |
| `RF10` | `W261005F2A7-REQ3@R1` | lazygit's `e` spawns `$EDITOR`, which may nest an editor; snacks sets `nvim-remote` | Deferred | `W261005F2A7-REQ3@R1` | The tool stays an opaque argv. Future trigger: so can open files on request from another process. |
| `RF10` | `W261005F2A7-REQ8@R1` | Supports save-before-launch (Helix `:write-all`) | Retained | `W261005F2A7-REQ8@R1` | This matches established practice. |
| `RF11` | `W261005F2A7-REQ2@R1` | Supports suspend/resume covering so's modes; a killed tool can leave foreign modes; images are deleted on suspend | Revised | `W261005F2A7-REQ2@R2` | Added a reset of foreign modes before resume and an image repaint criterion. |
| `RF12` | `W261005F2A7-REQ2@R1` | Challenges "any exit": SIGINT reaches so's shutdown handler | Revised | `W261005F2A7-REQ2@R2` | so must survive an interrupt during the hand-off, as micro does. |
| `RF13` | `W261005F2A7-REQ4@R1` | Supports on-demand blame; needs `--contents -`, both sentinels, untracked/unborn handling | Revised | `W261005F2A7-REQ4@R2` (now `W261005F2A7-REQ4@R3`) | Blame criteria now cover unsaved, untracked, and no-commit cases. `.git-blame-ignore-revs` is deferred. |
| `RF14` | `W261005F2A7-REQ5@R1` | Supports in-process Myers for normal edits; the worst case is 0.3–5 s | Revised | `W261005F2A7-REQ5@R2` | A bounded-cost criterion was added. |

# 7. Historical Requirement Revisions

## W261005F2A7-REQ1@R1: Native Git writes are limited to hunk stage and reset

**Requirement ID:** `W261005F2A7-REQ1`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005F2A7-REQ1@R2`

**Research Relationship:** `RF2`, `RF3`, `RF4`, `RF5` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** Should so itself ever change Git state (index or working tree), or should every Git write go through lazygit?

**Answer:** so reads Git status and diffs. Its only Git-related writes are staging the hunk under the cursor into the index and resetting a hunk. Reset is applied as an ordinary, undoable buffer edit that saves through the normal path. Commit, push/pull, branches, stash, and history belong to the configured Git tool.

**Rationale:** This is the LazyVim/gitsigns split the user wants. It covers the frequent "keep or discard this change" loop in place, while credentials, network, hooks, and history stay in a dedicated tool. Making reset a buffer edit means it is undoable and never rewrites a file behind the editor.

```text
cursor on hunk → stage hunk → git apply --cached <patch> → signs refresh
cursor on hunk → reset hunk → buffer edit (undo works) → normal save path
everything else → <leader>gg → Git tool
```

**Acceptance Criteria:**

- [ ] Stage hunk adds exactly the hunk under the cursor to the index. Other hunks in the file stay unstaged.
- [ ] Reset hunk replaces the hunk's lines in the buffer with the index version, and one `u` restores them.
- [ ] so never invokes a Git command that commits, changes branches, stashes, or contacts a remote.

**Depends On:** None

## W261005F2A7-REQ2@R1: The Git tool runs full screen with so suspended

**Requirement ID:** `W261005F2A7-REQ2`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005F2A7-REQ2@R2`

**Research Relationship:** `RF10`, `RF11`, `RF12` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** How should so run lazygit?

**Answer:** The Git tool command suspends so's renderer and runs the tool with inherited stdio in the repository top level. When the tool exits, so resumes its renderer, refreshes Git state, and re-checks open files against disk.

**Rationale:** It needs no new UI, works in every terminal, and gives the tool the real terminal, so its mouse, colors, and keys behave as standalone. An embedded float would need VT emulation and a new dependency, and a tmux popup works only under tmux.

```text
<leader>gg → save dirty buffers → renderer.suspend() → spawn(git.tool, stdio: inherit, cwd: repoTop)
                                                          │ await exit (any code)
             refresh Git state + re-check open files ◄── renderer.resume()
```

**Acceptance Criteria:**

- [ ] While the tool runs, so draws nothing and reads no input.
- [ ] After the tool exits with any status, including a crash, so restores the alt screen, raw mode, and mouse reporting, and repaints.
- [ ] A file rewritten by the tool, through checkout, pull, or discard, shows its new content after return.
- [ ] Git signs, statusline, and explorer markers reflect the post-tool state after return.

**Depends On:** `W261005F2A7-REQ3@R1`, `W261005F2A7-REQ8@R1`

## W261005F2A7-REQ4@R2: Native Git display scope

**Requirement ID:** `W261005F2A7-REQ4`

**Revision:** `R2`

**Previous Revision:** `W261005F2A7-REQ4@R1`

**Replaces:** None

**Status:** Revised by `W261005F2A7-REQ4@R3`

**Research Relationship:** `RF1`, `RF8`, `RF9`, `RF13` evaluated `W261005F2A7-REQ4@R1` and informed this revision; `RF6` evaluated `W261005F2A7-REQ4@R1` with no impact

**Revision Summary:** The changes follow LazyVim style:

- **Gutter:** distinct untracked, top-delete, and change-delete signs (RF1, user decision).
- **Explorer:** per-file untracked markers and a separate conflict marker (RF9, user decision).
- **Statusline:** defined content for an unborn branch, a detached HEAD, and a rebase or merge in progress (RF8).
- **Blame:** defined behaviour for unsaved buffers, untracked files, and a repository with no commits (RF13).

**Question:** Which native Git features ship in this work?

**Answer:** The native features are:

- **Gutter:** hunk signs for added, changed, deleted, top-of-file-deleted, changed-and-deleted, and untracked lines.
- **Hunks:** next and previous navigation, preview, stage, and reset.
- **Statusline:** a segment with the branch, a short commit for detached HEAD, the branch name for an unborn branch, a `rebasing` or `merging` suffix while one is in progress, and the active file's added/changed/deleted counts.
- **Explorer:** markers on rows for modified, staged, untracked (per file, including inside new folders), deleted, and conflicted files. A folder shows that it contains changes.
- **Blame:** on-demand blame for the cursor line, computed against the buffer text. It shows "not committed yet" for uncommitted lines, untracked files, and repositories with no commits.

**Rationale:** The user chose gitsigns parity plus file-level visibility and line provenance, displayed the way LazyVim does. A separate conflict marker matters because porcelain v2 reports unmerged entries as their own type (RF9). Blame must use the buffer text (`--contents -`) so line numbers match unsaved edits. It must also recognise both the pre-2.41 and post-2.41 "not committed" markers (RF13).

```text
explorer          editor                                         statusline
 M inbox.md   │ 1 ▔                    ‾ deleted at top          NORMAL inbox.md  main +1 ~1 -1
 ? ideas.md   │ 3 ▎- [x] buy milk      ~ changed                 NORMAL inbox.md  a1b2c3d (rebasing) +1
 U plan.md    │ 4 ▎- [ ] call bank     + added
 ▸ new/  ?    │ 5 ▁                    _ deleted below
   ? x.md     │ 6 ▎- [ ] email         ~_ changed + deleted
              │   ↳ hieu, 2 days ago · daily note (a1b2)      ← blame on demand
```

**Acceptance Criteria:**

- [ ] Each sign type (added, changed, deleted, top-deleted, changed-and-deleted, untracked) appears on the right lines and is visually distinct.
- [ ] Next and previous hunk navigation moves the cursor to the first line of the adjacent hunk and stops at the ends.
- [ ] Hunk preview shows the index lines the hunk replaces.
- [ ] The statusline shows the branch, a short commit when detached, the branch name in a repository with no commits, and a `rebasing`/`merging` suffix during those operations, plus the active file's counts. It yields on narrow terminals.
- [ ] Explorer rows show modified, staged, untracked, deleted, and conflicted states with distinct markers. Files inside a new untracked folder each show the untracked marker, and a folder shows that it contains changes.
- [ ] Line blame on an unsaved buffer reports the line as it appears in the buffer. It shows author, relative date, and summary for committed lines and "not committed yet" otherwise, on Git 2.31 and later.
- [ ] Blame in an untracked file or a repository with no commits shows "not committed yet" without an error.
- [ ] Outside a repository, none of these surfaces render Git content.

**Depends On:** `W261005F2A7-REQ5@R2`, `W261005F2A7-REQ7@R2`

## W261005F2A7-REQ4@R1: Native Git display scope

**Requirement ID:** `W261005F2A7-REQ4`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005F2A7-REQ4@R2`

**Research Relationship:** `RF1`, `RF6`, `RF8`, `RF9`, `RF13` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** Which native Git features ship in this work?

**Answer:** The native features are:

- gutter hunk signs for added, changed, and deleted lines;
- next and previous hunk navigation;
- hunk preview;
- stage hunk and reset hunk;
- a statusline segment with the branch and added/changed/deleted line counts;
- Git status markers on explorer rows;
- on-demand blame for the cursor line.

**Rationale:** The user chose gitsigns parity plus file-level visibility, to see which notes changed without opening them, and line provenance, to see who or when a line came from. Each is read-only except the two REQ1 writes.

```text
explorer          editor                                      statusline
 M inbox.md   │ 3 ▎- [x] buy milk     ~ changed           NORMAL inbox.md  main +1 ~1 -1
 ? ideas.md   │ 4 ▎- [ ] call bank    + added
   todo.md    │ 5 ▁                   _ deleted below
              │   ↳ hieu, 2 days ago · daily note (a1b2)   ← blame on demand
```

**Acceptance Criteria:**

- [ ] Added, changed, and deleted hunks each show a distinct gutter sign on the right lines.
- [ ] Next and previous hunk navigation moves the cursor to the first line of the adjacent hunk and stops at the ends.
- [ ] Hunk preview shows the index lines the hunk replaces.
- [ ] The statusline shows the branch, or a short detached-HEAD ref, plus the active file's added/changed/deleted counts, and yields on narrow terminals.
- [ ] Explorer rows show modified, added/staged, untracked, and deleted-or-conflicted states for files under the workspace, and a folder shows that it contains changes.
- [ ] Line blame shows author, relative date, and summary for the cursor line, and states "not committed yet" for uncommitted lines.
- [ ] Outside a repository, none of these surfaces render Git content.

**Depends On:** `W261005F2A7-REQ5@R1`, `W261005F2A7-REQ7@R1`

## W261005F2A7-REQ5@R1: Gutter signs compare the live buffer against the index

**Requirement ID:** `W261005F2A7-REQ5`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005F2A7-REQ5@R2`

**Research Relationship:** `RF1`, `RF2`, `RF4`, `RF14` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** What should the gutter signs compare against: the live buffer or the saved file, and the index or HEAD?

**Answer:** Hunks are computed in-process between the current buffer text and the file's index version, debounced while typing. A hunk that has been staged no longer shows a sign. Stage, reset, preview, navigation, and statusline counts all use these same hunks.

**Rationale:** Signs stay live with autosave on or off, and stage hunk has a coherent visible effect because the hunk disappears. This matches gitsigns. The index blob is read once per file and per index change, not per keystroke.

```text
type → debounce → diff(buffer lines, indexBlob lines) → hunks → signs / counts
index changed (stage, tool, external) → re-read indexBlob → re-diff
untracked file → whole file is one "added" hunk
```

**Acceptance Criteria:**

- [ ] An unsaved edit shows its sign before any save.
- [ ] After staging a hunk, its sign disappears and the other hunks keep theirs.
- [ ] A file that is untracked shows every line as added. A file ignored by Git shows no signs.
- [ ] Typing in a 5,000-line note does not run a Git process per keystroke.

**Depends On:** `W261005F2A7-REQ6@R1`

## W261005F2A7-REQ6@R1: Git state refreshes on events, including a narrow git-dir watch

**Requirement ID:** `W261005F2A7-REQ6`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005F2A7-REQ6@R2`

**Research Relationship:** `RF3`, `RF6`, `RF7`, `RF9` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** When should so refresh repo-wide Git state (branch, explorer markers, index blobs)?

**Answer:** Refresh runs one async status read, coalesced over a short window of about 200 ms. Triggers are so's own writes, stage or reset, the Git tool exiting, workspace file changes, and changes to `HEAD`, `index`, or `refs/` in the resolved git directory. There is no polling, and the status read must not modify the index itself.

**Rationale:** Commits and checkouts made in another terminal or split show up promptly without polling. Coalescing and lock-free reads prevent bursts and self-triggered loops.

```text
own write / stage / reset / tool exit ─┐
workspace file changed ────────────────┼─► debounce ~200 ms ─► git status (async, no optional locks) ─► state
<gitdir>/HEAD | index | refs/** ───────┘
```

**Acceptance Criteria:**

- [ ] A commit made in another terminal updates the statusline and explorer within one second without user input.
- [ ] A branch switch made outside so updates the branch and the open buffers' signs.
- [ ] A burst of index changes produces a bounded number of status runs, not one per event.
- [ ] so's own status reads do not trigger further refreshes.

**Depends On:** `W261005F2A7-REQ7@R1`

## W261005F2A7-REQ7@R1: Git works for a workspace anywhere inside one repository

**Requirement ID:** `W261005F2A7-REQ7`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Status:** Revised by `W261005F2A7-REQ7@R2`

**Research Relationship:** `RF7`, `RF8`, `RF9` evaluated this exact revision

**Revision Summary:** None — initial revision

**Question:** Which repository layouts must work?

**Answer:** so finds the repository from the workspace with Git. The workspace may be the repository top level, a subfolder, or a linked worktree. Status reads are limited to the workspace path, a submodule appears as a single entry, and the Git tool runs at the repository top level. If no repository or no `git` executable is found, Git display is off with no errors.

**Rationale:** This covers the common layouts, including notes inside a dotfiles or monorepo, while keeping status cost proportional to the notes rather than the whole repository.

```text
~/dotfiles/          ← repo top level (Git tool cwd)
└── notes/           ← so workspace → git status -- notes/
    ├── inbox.md  M
    └── todo.md
```

**Acceptance Criteria:**

- [ ] Opening a repo subfolder shows markers and signs with correct paths relative to that workspace.
- [ ] Opening a linked worktree resolves its own git directory, so `.git` is a file, and watches it.
- [ ] Changes outside the workspace path do not appear in counts or markers.
- [ ] Without `git` on `PATH`, or outside a repository, so starts normally and shows no Git UI or error.

**Depends On:** None
