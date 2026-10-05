# W261005F2A7: Git Integration — UI Requirements

**Status:** `Ready for UI Design`

**UI Context:** `w261005f2a7-ui-context.md`

**Source Requirements and Design:** `W261005F2A7-REQ1@R2`, `REQ2@R2`, `REQ3@R1`, `REQ4@R2`, `REQ5@R2`, `REQ6@R2`, `REQ7@R2`, `REQ8@R1`, `REQ9@R1` (`w261005f2a7-requirements.md`); `W261005F2A7-DES8`, `DES9`, `DES10`, `DES11` (`w261005f2a7-system-design.md`); `RF8`, `RF9`, `RF13` (`w261005f2a7-research.md`)

**Mockup Manifest:** `ui-mockups/manifest.md`

**Accepted Mockups:** `W261005F2A7-M1@R3`, `W261005F2A7-M2@R3`, `W261005F2A7-M3@R3`

**Current UI Requirement Revisions:** `W261005F2A7-UREQ1@R1`, `UREQ2@R1`, `UREQ3@R1`, `UREQ4@R1`, `UREQ5@R1`, `UREQ6@R1`, `UREQ7@R1`, `UREQ8@R1`, `UREQ9@R1`, `UREQ10@R1`, `UREQ11@R1`, `UREQ12@R1`

**Unresolved Items:** `None`

## Current UI Requirements

### W261005F2A7-UREQ1@R1: Git signs sit in a dedicated leftmost gutter column

- **Requirement:** Inside a repository, the editor gutter gains one leftmost cell for the Git sign, before the line number: `[git sign][line number][space][▕/⚠ cell][text]`. The existing `▕`/`⚠` cell stays next to the text.
- **Rationale:** A sign in the cell next to the text read as part of the text (`18 +- [ ]`). A separate column keeps prose readable and lets a line show a Git sign and a reveal or error mark together.
- **Acceptance Criteria:**
  - A changed line renders as `+ 18 ▕- [ ] …`: Git sign in cell 0, then the line number, then the existing sign cell.
  - A line with no Git change shows a blank cell in the Git column, so line numbers stay aligned.
  - A revealed or error line inside a hunk shows both the Git sign and `▕`/`⚠`; neither replaces the other.
  - Outside a repository, or when Git is off, the Git column is absent and the gutter width matches v1.
- **Source Evidence:** `W261005F2A7-REQ4@R2`, `REQ5@R2`; `W261005F2A7-DES10`; UI context "Affected UI: Editor gutter sign cell"
- **Accepted Mockups:** `W261005F2A7-M1@R3` S1, S2, S14, S15
- **Feedback or Decision Evidence:** Manifest Feedback Ledger cycle 2; Accepted Decision "Git sign column"
- **Dependencies:** Conflicts with `W261005F2A7-DES10`, which reuses the existing sign cell and keeps the gutter width unchanged. To be resolved in the UI system-impact assessment.

### W261005F2A7-UREQ2@R1: One distinct glyph per sign kind, in every view

- **Requirement:** Each hunk kind has its own glyph: `+` added, `~` changed, `_` deleted below, `‾` deleted at top, `≃` changed + deleted, `┆` untracked. Signs show in live, source, and reading views.
- **Rationale:** Distinct glyphs keep meaning under NO_COLOR (`src/ui/theme.ts:209-210`). Bar signs (`▎`) share one glyph across kinds and were rejected.
- **Acceptance Criteria:**
  - Each of the six kinds renders with its glyph and a distinct colour token in dark and light themes.
  - Under `color = "never"` or `NO_COLOR`, the six glyphs remain distinct and readable.
  - A pure delete below line N shows `_` on line N; a delete before line 1 shows `‾` on line 1.
  - Every line of an untracked file, and of every file in an unborn repository, shows `┆`.
  - Switching views (live → source → reading) keeps the same signs on the same lines.
  - Glyphs are single-width without a Nerd Font.
- **Source Evidence:** `W261005F2A7-REQ4@R2`, `REQ5@R2`; `W261005F2A7-DES10`; UI context constraints (NO_COLOR, single-width glyphs)
- **Accepted Mockups:** `W261005F2A7-M1@R3` S1–S5, S13
- **Feedback or Decision Evidence:** Manifest Feedback Ledger cycle 1 item 1; Accepted Decision "Sign glyphs"
- **Dependencies:** `W261005F2A7-UREQ1@R1`

### W261005F2A7-UREQ3@R1: Hunk navigation, stage, and reset give message-line feedback

- **Requirement:** `]h` / `[h` move to the first line of the next or previous hunk. `Space g h s` stages the hunk at the cursor and `Space g h r` resets it. Each action reports its result on the message line, and the signs, counts, and markers update at once.
- **Rationale:** The user needs to see which hunk they are on and that a write took effect, without opening another tool.
- **Acceptance Criteria:**
  - Navigation shows `hunk n/m`. At the ends it shows `no next hunk` or `no previous hunk` and the cursor does not move.
  - Stage shows `staged hunk n/m`. The staged hunk's signs disappear, the other hunks keep theirs, and the statusline counts drop.
  - Stage on a dirty buffer saves first and shows `"<path>" written · staged hunk n/m`; the dirty marks clear.
  - Reset restores the index lines into the buffer, removes that hunk's sign, and shows `reset hunk n/m · buffer changed, autosave pending`.
  - Stage or reset with no hunk at the cursor shows `no hunk at cursor`.
  - When every hunk is staged, the file shows no signs and its explorer marker changes from `M` to `S`.
- **Source Evidence:** `W261005F2A7-REQ1@R2`, `REQ4@R2`, `REQ9@R1`; `W261005F2A7-DES4`, `DES5`, `DES11`
- **Accepted Mockups:** `W261005F2A7-M1@R3` S6–S10
- **Feedback or Decision Evidence:** Manifest Assumptions "Notice wording"
- **Dependencies:** `W261005F2A7-UREQ9@R1` for failure notices

### W261005F2A7-UREQ4@R1: Statusline Git segment

- **Requirement:** Inside a repository, the statusline shows `⎇ <ref> [op] +a ~c -r` right after the path.
- **Rationale:** Branch, in-progress operation, and change size are the at-a-glance Git facts LazyVim shows.
- **Acceptance Criteria:**
  - On a branch: `⎇ main +2 ~3 -1`. Zero counts are hidden; with no changes the segment is `⎇ main`.
  - Detached HEAD shows the 7-character short SHA: `⎇ a1b2c3d`.
  - A rebase or merge in progress appends `rebasing` or `merging`, bold in colour themes and underlined in NO_COLOR.
  - An unborn branch shows its name with no counts. An untracked file shows no counts.
  - Under 100 columns, the Git segment drops first, together with `view`, `words`, and `preview`.
  - `⎇` renders single-width without a Nerd Font.
- **Source Evidence:** `W261005F2A7-REQ4@R2`, `REQ7@R2`; `W261005F2A7-DES10`; `RF8`
- **Accepted Mockups:** `W261005F2A7-M1@R3` S1, S7, S9, S11–S14
- **Feedback or Decision Evidence:** Manifest Feedback Ledger cycle 1 item 5; Accepted Decision "Statusline segment"
- **Dependencies:** None

### W261005F2A7-UREQ5@R1: Explorer file markers and folder "contains changes"

- **Requirement:** Explorer rows show one Git marker cell right after the name, after the dirty `●` when present: `M` modified, `S` staged, `?` untracked, `U` conflicted. Folders that contain any change show `•`.
- **Rationale:** The explorer is where users scan the workspace; the marker shows Git state without opening files. The unsaved dot and the Git marker are separate facts.
- **Acceptance Criteria:**
  - Each marker letter renders with its own colour token and stays readable under NO_COLOR.
  - An unsaved, modified file shows `name ● M`, dot first.
  - Each file in an untracked folder shows its own `?` when expanded; a collapsed untracked folder shows only `•`.
  - A deleted tracked file has no row; each of its ancestor folders shows `•`.
  - The marker stays readable inside the selected (reversed) row.
  - The floating explorer at 80×24 renders markers the same way.
  - There is no `D` marker.
- **Source Evidence:** `W261005F2A7-REQ4@R2`; `W261005F2A7-DES10`; `RF9`
- **Accepted Mockups:** `W261005F2A7-M2@R3` S1–S6
- **Feedback or Decision Evidence:** Manifest Feedback Ledger cycles 1 (items 2, 3) and 2; Accepted Decisions "Explorer marker position", "Deleted tracked files"
- **Dependencies:** Conflicts with the `W261005F2A7-DES10` marker set, which includes `D`. To be resolved in the UI system-impact assessment.

### W261005F2A7-UREQ6@R1: Hunk preview float

- **Requirement:** `Space g h p` opens a float that shows the hunk at the cursor: removed index lines prefixed `-` and added buffer lines prefixed `+`.
- **Rationale:** The sign shows that something changed; the preview shows what was replaced, which is the main need for changed and deleted hunks.
- **Acceptance Criteria:**
  - The header names the kind, the buffer range (or `after line N` for a pure delete), and `hunk n/m`.
  - Removed lines use the `diffDel` background and added lines `diffAdd`; the `-`/`+` prefixes carry the meaning in NO_COLOR.
  - The body caps at 12 diff lines (8 at 80×24), then shows `… N more lines (r removed, a added)`.
  - The float opens below the cursor line, or above it when there is no room, and never exceeds the editor area.
  - At 80×24 the float spans the editor width.
  - The footer lists only `esc / q close`. The float has no stage or reset keys. Esc, `q`, or a click outside closes it.
  - With no hunk at the cursor, no float opens and `no hunk at cursor` shows.
- **Source Evidence:** `W261005F2A7-REQ4@R2`; `W261005F2A7-DES11`; UI context "Affected UI: Hunk preview float"
- **Accepted Mockups:** `W261005F2A7-M3@R3` S1–S4
- **Feedback or Decision Evidence:** Manifest Feedback Ledger cycle 1 item 4; Accepted Decision "Hunk float"
- **Dependencies:** None

### W261005F2A7-UREQ7@R1: Which-key `+git` and `+hunk` groups

- **Requirement:** `Space g` opens a `+git` which-key group with `g` Lazygit (full screen) and the `h` `+hunk` subgroup. `+hunk` lists `s` Stage hunk, `r` Reset hunk, `p` Preview hunk, `b` Blame line.
- **Rationale:** LazyVim users expect `<leader>g` / `<leader>gh`; which-key makes the commands discoverable.
- **Acceptance Criteria:**
  - `Space g` shows `g  Lazygit (full screen)` and `h  +hunk`.
  - `Space g h` shows the four hunk commands with the titles above.
  - `]h` / `[h` are Normal-mode keys and do not appear in the leader tree.
  - Outside a repository the groups still show; running a command gives `not a git repository`.
- **Source Evidence:** `W261005F2A7-DES11`; UI context "Affected UI: Which-key popup"
- **Accepted Mockups:** `W261005F2A7-M3@R3` S5, S6
- **Feedback or Decision Evidence:** Manifest acceptance (accepted by the user on 2026-10-05)
- **Dependencies:** None

### W261005F2A7-UREQ8@R1: Blame on the message line

- **Requirement:** `Space g h b` shows the cursor line's blame on the message line: `<author>, <relative date> · <summary> (<short sha>)`.
- **Rationale:** One-line blame answers "who changed this and why" without moving the layout.
- **Acceptance Criteria:**
  - A committed line shows, for example, `hieu, 2 days ago · plan the git integration (3f2a9c1)`.
  - An uncommitted line, any line of an untracked file, or any line in a repository with no commits shows `not committed yet`, styled as info, not error.
  - Nothing is added inline; the editor layout does not move.
  - Long blame text is truncated by the existing message-line painter.
- **Source Evidence:** `W261005F2A7-REQ4@R2`; `W261005F2A7-DES11`; `RF13`
- **Accepted Mockups:** `W261005F2A7-M3@R3` S7, S8
- **Feedback or Decision Evidence:** Manifest Assumptions "Blame"
- **Dependencies:** None

### W261005F2A7-UREQ9@R1: Git notices

- **Requirement:** Git failures and refusals show one clear message-line notice each, with the wording below.
- **Rationale:** Every refused or failed Git action must tell the user what happened and what to do next.
- **Acceptance Criteria:**
  - Tool missing: `lazygit not found (git.tool)` (the configured program name). so is not suspended and the screen does not flicker.
  - Outside a repository: `not a git repository`.
  - Stage in a conflicted file: `<path> has conflicts; resolve them in lazygit`. The file is not changed.
  - Stale index: `index changed; hunks refreshed`, as a warning (yellow; plain in NO_COLOR).
  - Save failure before the tool: `git tool not started: <path> could not be saved`, as an error.
  - Git older than 2.31: `git <version> is older than 2.31; git features off`, shown once at startup, as a warning.
  - A second Git command while one is pending: `git: another operation is running`.
- **Source Evidence:** `W261005F2A7-REQ1@R2`, `REQ3@R1`, `REQ7@R2`, `REQ8@R1`; `W261005F2A7-DES8`, `DES9`
- **Accepted Mockups:** `W261005F2A7-M3@R3` S9–S15
- **Feedback or Decision Evidence:** Manifest Feedback Ledger cycle 1 item 6; Accepted Decision "Busy notice"; Assumptions "Notice wording"
- **Dependencies:** None

### W261005F2A7-UREQ10@R1: Full-screen lazygit hand-off

- **Requirement:** `Space g g` saves dirty buffers, suspends so, and runs the configured tool full screen. When the tool exits, so resumes on the same screen and refreshes Git state.
- **Rationale:** lazygit is the full Git client; the hand-off must feel like LazyVim's `<leader>gg` and must not leave stray screen state.
- **Acceptance Criteria:**
  - With unsaved edits, the message line briefly shows `"<path>" written · opening lazygit` before the switch.
  - While the tool runs, so paints nothing; the tool owns the whole terminal.
  - After exit, the same buffer, cursor, scroll, and layout return, including images.
  - Changes made in the tool (for example a staged hunk) show at once in signs, counts, and markers.
- **Source Evidence:** `W261005F2A7-REQ2@R2`, `REQ6@R2`, `REQ8@R1`; `W261005F2A7-DES9`
- **Accepted Mockups:** `W261005F2A7-M3@R3` S16–S18
- **Feedback or Decision Evidence:** Manifest Assumptions "lazygit screen"
- **Dependencies:** `W261005F2A7-UREQ9@R1` for the tool-missing and save-failure notices

### W261005F2A7-UREQ11@R1: No Git UI outside a repository

- **Requirement:** Outside a repository, or when Git is off (missing or older than 2.31), so shows no Git column, statusline segment, or explorer markers; the screen matches v1.
- **Rationale:** Users of so without Git must see no change.
- **Acceptance Criteria:**
  - The gutter starts with the line number, and `▕`/`⚠` keep their v1 cell.
  - The statusline has no `⎇` segment.
  - Explorer rows have no markers or `•`.
  - Git commands report `not a git repository` (or nothing, after the version notice) and change nothing.
- **Source Evidence:** `W261005F2A7-REQ4@R2`, `REQ7@R2`; `W261005F2A7-DES8`, `DES10` invariant
- **Accepted Mockups:** `W261005F2A7-M1@R3` S15; `W261005F2A7-M2@R3` S7; `W261005F2A7-M3@R3` S10, S14
- **Feedback or Decision Evidence:** Manifest Accepted Decision "Git sign column" (column exists only inside a repository)
- **Dependencies:** `W261005F2A7-UREQ1@R1`

### W261005F2A7-UREQ12@R1: Git theme tokens for dark, light, and NO_COLOR

- **Requirement:** Every new Git visual (six sign kinds, four markers plus `•`, the statusline segment and op, and the float's removed and added lines) uses a semantic theme token with dark, light, and NO_COLOR entries.
- **Rationale:** The v1 theme shape `token → [fg, bg, attributes, NO_COLOR attributes]` is the authority (`src/ui/theme.ts:125`); meaning must survive without colour.
- **Acceptance Criteria:**
  - Each element renders with its token in dark and light themes.
  - Under NO_COLOR, meaning comes from glyphs, letters, prefixes, and attributes (bold, underline, reverse) alone.
  - The float reuses `diffAdd` / `diffDel`.
  - No existing token changes value.
- **Source Evidence:** `W261005F2A7-DES10`; UI context "Existing design system" and constraints
- **Accepted Mockups:** `W261005F2A7-M1@R3`, `W261005F2A7-M2@R3`, `W261005F2A7-M3@R3` (dark, light, NO_COLOR)
- **Feedback or Decision Evidence:** Manifest Shared Files `git.css` R3
- **Dependencies:** None

## Historical Revisions

None — no prior revisions

## Assumptions, Exclusions, and Deferrals

- **Assumption:** A sign on a hidden line inside a block-replaced region (mermaid, math) moves to that block's rendered row, as `W261005F2A7-DES10` defines. The mockups do not show this (manifest Open Items); the UI design keeps the DES10 rule.
- **Assumption:** Blame author, date, and commit in the mockups are sample data; the format is the requirement.
- **Exclusion:** The lazygit screen itself; so draws nothing while suspended (stand-in drawing only).
- **Exclusion:** Bar-style signs (`▎`) and right-aligned explorer markers; rejected in cycle 1.
- **Exclusion:** A `D` explorer marker and struck-through rows for deleted files; deleted files have no row (cycle 1 item 3, cycle 2).
- **Deferral:** None

## Traceability

| Source Evidence | Accepted Mockup | Feedback or Decision | UI Requirement |
|---|---|---|---|
| `REQ4@R2`, `REQ5@R2`, `DES10` | `W261005F2A7-M1@R3` | Cycle 2; "Git sign column" | `W261005F2A7-UREQ1@R1` |
| `REQ4@R2`, `REQ5@R2`, `DES10` | `W261005F2A7-M1@R3` | Cycle 1 item 1; "Sign glyphs" | `W261005F2A7-UREQ2@R1` |
| `REQ1@R2`, `REQ4@R2`, `REQ9@R1`, `DES4`, `DES5`, `DES11` | `W261005F2A7-M1@R3` | Assumptions "Notice wording" | `W261005F2A7-UREQ3@R1` |
| `REQ4@R2`, `REQ7@R2`, `DES10`, `RF8` | `W261005F2A7-M1@R3` | Cycle 1 item 5; "Statusline segment" | `W261005F2A7-UREQ4@R1` |
| `REQ4@R2`, `DES10`, `RF9` | `W261005F2A7-M2@R3` | Cycles 1 and 2; "Explorer marker position", "Deleted tracked files" | `W261005F2A7-UREQ5@R1` |
| `REQ4@R2`, `DES11` | `W261005F2A7-M3@R3` | Cycle 1 item 4; "Hunk float" | `W261005F2A7-UREQ6@R1` |
| `DES11` | `W261005F2A7-M3@R3` | Acceptance | `W261005F2A7-UREQ7@R1` |
| `REQ4@R2`, `DES11`, `RF13` | `W261005F2A7-M3@R3` | Assumptions "Blame" | `W261005F2A7-UREQ8@R1` |
| `REQ1@R2`, `REQ3@R1`, `REQ7@R2`, `REQ8@R1`, `DES8`, `DES9` | `W261005F2A7-M3@R3` | Cycle 1 item 6; "Busy notice" | `W261005F2A7-UREQ9@R1` |
| `REQ2@R2`, `REQ6@R2`, `REQ8@R1`, `DES9` | `W261005F2A7-M3@R3` | Assumptions "lazygit screen" | `W261005F2A7-UREQ10@R1` |
| `REQ4@R2`, `REQ7@R2`, `DES8`, `DES10` | `W261005F2A7-M1@R3`, `M2@R3`, `M3@R3` | "Git sign column" | `W261005F2A7-UREQ11@R1` |
| `DES10`, UI context | `W261005F2A7-M1@R3`, `M2@R3`, `M3@R3` | Shared `git.css` R3 | `W261005F2A7-UREQ12@R1` |

## Readiness

- [x] Every current accepted parent and child mockup and material decision is represented by a current UI requirement or explicit exclusion; parent links agree with the mockups.
- [x] Every current requirement has observable acceptance criteria.
- [x] Every current requirement links to source evidence and one or more accepted mockup revisions.
- [x] Historical revisions are excluded from UI-design inputs.
- [x] Unresolved items are `None`.
