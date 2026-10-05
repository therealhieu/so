# W261005F2A7: git-integration — Requirements

**Document Status:** Ready for System Design

**Context Source:** `w261005f2a7-discuss-context.md`

**Research Source:** None

**Unresolved Items:** None

**Ready for System Design Checklist:**

- [x] Every active topic is covered.
- [x] Every current requirement has a stable, unique ID and exact current revision.
- [x] Every current requirement includes its question, answer, rationale, acceptance criteria, and dependencies.
- [x] Scope, constraints, assumptions, risks, and compatibility boundaries are explicit.
- [x] For roadmap-linked work, the accepted parent baseline has been checked, assigned scope is covered by current requirements, and gates due before requirements approval have evidence; unresolved parent impacts prevent readiness. (Not applicable — standalone work.)
- [x] Revised and replaced requirements preserve append-only lineage and complete prior revisions.
- [x] When research exists, every RF-to-evaluated-revision relationship has one reconciliation outcome; a finding that evaluated no requirement has one `None` relationship row. (Not applicable — no research yet.)
- [x] Deferred decisions are outside the current-requirements ledger.
- [x] `Unresolved Items` is `None`.

# Table of Contents

1. [Problem and Desired Outcome](#1-problem-and-desired-outcome)
2. [Current and Expected State](#2-current-and-expected-state)
3. [Scope](#3-scope)
4. [Standards and Constraints](#4-standards-and-constraints)
5. [Current Requirements](#5-current-requirements)
   - [W261005F2A7-REQ1@R1: Native Git writes are limited to hunk stage and reset](#w261005f2a7-req1r1-native-git-writes-are-limited-to-hunk-stage-and-reset)
   - [W261005F2A7-REQ2@R1: The Git tool runs full screen with so suspended](#w261005f2a7-req2r1-the-git-tool-runs-full-screen-with-so-suspended)
   - [W261005F2A7-REQ3@R1: The Git tool is configurable and fails with a clear notice](#w261005f2a7-req3r1-the-git-tool-is-configurable-and-fails-with-a-clear-notice)
   - [W261005F2A7-REQ4@R1: Native Git display scope](#w261005f2a7-req4r1-native-git-display-scope)
   - [W261005F2A7-REQ5@R1: Gutter signs compare the live buffer against the index](#w261005f2a7-req5r1-gutter-signs-compare-the-live-buffer-against-the-index)
   - [W261005F2A7-REQ6@R1: Git state refreshes on events, including a narrow git-dir watch](#w261005f2a7-req6r1-git-state-refreshes-on-events-including-a-narrow-git-dir-watch)
   - [W261005F2A7-REQ7@R1: Git works for a workspace anywhere inside one repository](#w261005f2a7-req7r1-git-works-for-a-workspace-anywhere-inside-one-repository)
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
so ── git CLI ──►│ gutter + ~ _ signs · ]h/[h · hunk preview · stage / reset hunk  │
  (workspace     │ statusline branch +a ~c -d · explorer M/A/? · cursor-line blame │
   adapter)      └──────────────────────────────────────────────────────────────────┘
                     ▲ refresh: own writes · stage/reset · tool exit · workspace changes
                     │          · .git HEAD / index / refs  (debounced)

<leader>gg ──► save dirty buffers → renderer.suspend() → git.tool (lazygit) full screen
                                                              │ exit
               refresh Git state + re-check open files ◄── renderer.resume()
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
- Hosting-provider features (pull requests, issues), non-Git VCS, and changes to the link index or note format.

## Roadmap Assignment

None — standalone work

## Affected Interfaces and Actors

- User — new `<leader>g…` keys, `]h`/`[h`, and palette commands.
- `src/core/state/types.ts` `Effect`/`Action` — new Git read, stage, launch, and result variants.
- `src/core/kernel/view` `Sign` gutter cell — Git signs share the single cell with fold markers.
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
- Typing latency and first frame must not regress. The live hunk diff is debounced off the keystroke path, and status and blame reads are async.
- `.git/` remains hidden from the explorer, index, search, and the workspace watcher (`src/workspace/ignore.ts:13-14`). Git-dir watching is a separate, narrow watcher.

## Accepted Assumptions

- so reads Git state through the `git` CLI, not a JS library. lazygit already requires `git`, and the binary stays unchanged.
- `git` and the Git tool may be absent. Their absence disables features without errors (REQ3, REQ7).
- Reset hunk restores the index version of the hunk, gitsigns semantics, consistent with REQ5.
- Default keys follow LazyVim: `<leader>gg` tool, `]h`/`[h` hunks, `<leader>ghp` preview, `<leader>ghs` stage, `<leader>ghr` reset, `<leader>ghb` blame. `<leader>g` is unused today.

## Dependencies

- `git` executable on `PATH` — the source of all Git state and the stage write.
- Configured Git tool (default `lazygit`) — owns every Git write other than hunk stage and reset.
- OpenTUI `CliRenderer.suspend()` / `resume()` (`node_modules/@opentui/core/renderer.d.ts:590-591`) — hands the terminal to the tool.
- Existing save path and disk-change path (reload / conflict dialog) — reused by REQ2, REQ8, and REQ9.

## Risks and Compatibility

- **Gutter cell contention** — fold markers already use the one sign cell on headings (`src/core/lang/markdown/live-preview.ts:86-90`). System design must define precedence or a layout so neither signal is lost.
- **Index feedback loops** — Git reads can touch `.git/index`. Reads must not take optional locks or rewrite the index (for example `--no-optional-locks`), and refresh is coalesced.
- **Large repositories** — status is limited to the workspace path (REQ7). Explorer markers must not need a full-repo walk per refresh.
- **Terminal state on suspend** — mouse reporting, alt screen, and raw mode must be restored after the tool exits, including when the tool crashes or is killed.
- **Statusline width** — the Git segment must yield to higher-priority segments on narrow terminals (`src/ui/views/statusline.ts:45-50`).

# 5. Current Requirements

## W261005F2A7-REQ1@R1: Native Git writes are limited to hunk stage and reset

**Requirement ID:** `W261005F2A7-REQ1`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

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

**Research Relationship:** None — not research-informed

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

## W261005F2A7-REQ3@R1: The Git tool is configurable and fails with a clear notice

**Requirement ID:** `W261005F2A7-REQ3`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

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

## W261005F2A7-REQ4@R1: Native Git display scope

**Requirement ID:** `W261005F2A7-REQ4`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

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

**Research Relationship:** None — not research-informed

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

**Research Relationship:** None — not research-informed

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

**Research Relationship:** None — not research-informed

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

## W261005F2A7-REQ8@R1: Dirty buffers are saved before the Git tool opens

**Requirement ID:** `W261005F2A7-REQ8`

**Revision:** `R1`

**Previous Revision:** None — initial revision

**Replaces:** None

**Research Relationship:** None — not research-informed

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

**Research Relationship:** None — not research-informed

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

**Depends On:** `W261005F2A7-REQ1@R1`, `W261005F2A7-REQ5@R1`

# 6. Research Impact Review

None — research was skipped

# 7. Historical Requirement Revisions

None — no requirement has been revised or replaced
