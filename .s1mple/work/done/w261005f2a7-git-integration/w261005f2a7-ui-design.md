# UI Design

## Status

`Ready for Planning`

## Sources

- **UI context:** `w261005f2a7-ui-context.md`
- **UI requirements:** `w261005f2a7-ui-requirements.md`
- **Current UI requirement revisions:** `W261005F2A7-UREQ1@R1`, `UREQ2@R1`, `UREQ3@R1`, `UREQ4@R1`, `UREQ5@R1`, `UREQ6@R1`, `UREQ7@R1`, `UREQ8@R1`, `UREQ9@R1`, `UREQ10@R1`, `UREQ11@R1`, `UREQ12@R1`
- **Requirements and system design:** `w261005f2a7-requirements.md` (`W261005F2A7-REQ1@R2`, `REQ2@R2`, `REQ3@R1`, `REQ4@R3`, `REQ5@R2`, `REQ6@R2`, `REQ7@R2`, `REQ8@R1`, `REQ9@R1`); `w261005f2a7-system-design.md` (`W261005F2A7-DES1`–`DES13`, `S1`–`S36`, `V1`–`V69`)
- **Mockup manifest:** `ui-mockups/manifest.md`
- **Accepted mockups:** `W261005F2A7-M1@R3`, `W261005F2A7-M2@R3`, `W261005F2A7-M3@R3`
- **Accepted feedback and decisions:** manifest "Accepted Decisions", "Assumptions", "Feedback Ledger" cycles 1–2, "Acceptance"

## Assigned Roadmap UI Coverage

None — standalone work

## Ready for Planning Checklist

- [x] Every current `UREQ` is supported by source evidence, accepted mockups, and accepted feedback or decision evidence.
- [x] Every current accepted parent and child has `UREQ`/`UDES` coverage or an explicit exclusion; parent links agree with the mockups.
- [x] Every current `UREQ` revision has one or more current `UDES` decisions.
- [x] Every current `UREQ` and `UDES` maps to an accepted mockup and a canonical detailed surface or component entry.
- [x] The design progresses from experience architecture through surfaces, flows, policies, components, and detailed specifications.
- [x] Navigation, entry, exit, and cross-surface transitions are explicit.
- [x] Every affected surface defines hierarchy, states, interactions, responsive behavior, accessibility behavior, and component composition.
- [x] Every new focal component has a complete specification; every existing or adapted component cites its current contract and specifies only changed behavior and boundaries.
- [x] Every material UI code shape uses the affected codebase's language, framework, naming, and established patterns; cites its target file, symbol, and relevant system-design authority; and is immediately explained.
- [x] Every omitted UI code shape explains why a concrete preview would duplicate an existing contract or add no review value.
- [x] Accepted mockups remain the visual authority.
- [x] Source system contracts and technical boundaries are referenced rather than redefined.
- [x] Every required system support entry cites current `REQ` and `DES` coverage or states that no current coverage exists.
- [x] Every `US` has one or more supporting `UV` records.
- [x] Every `UV` references the `US` records it proves and defines exact observable assertions and one unique risk.
- [x] Proposed verification is not presented as executed evidence.
- [x] Historical revisions are excluded from current planning inputs.
- [x] Every omitted state, surface, component, responsive condition, or verification method explains why it does not apply.
- [x] Unresolved items are `None`.

## Table of Contents

1. [Goals, Scope, and Requirement Coverage](#1-goals-scope-and-requirement-coverage)
2. [Experience Architecture](#2-experience-architecture)
3. [Surfaces and Navigation](#3-surfaces-and-navigation)
4. [Interaction Flows and State Transitions](#4-interaction-flows-and-state-transitions)
5. [Cross-Cutting UI Policies](#5-cross-cutting-ui-policies)
6. [Component System](#6-component-system)
7. [Detailed UI Design](#7-detailed-ui-design)
8. [UI Success and Implementation Verification](#8-ui-success-and-implementation-verification)
9. [Finalized UI Design Decisions](#9-finalized-ui-design-decisions)
10. [Historical Revisions and Acceptance](#10-historical-revisions-and-acceptance)

# 1. Goals, Scope, and Requirement Coverage

## Goal and Scope

- **Goal:** Give so LazyVim-style Git awareness that reads at a glance with and without colour — gutter signs, a statusline Git segment, explorer markers, a hunk preview float, one-line blame and notices — plus a full-screen lazygit hand-off that returns to an unchanged screen.
- **In scope:**
  - Editor gutter: a new leftmost Git sign column (repository only) and six sign glyphs.
  - Statusline: the `⎇ <ref> [op] +a ~c -r` segment.
  - Explorer rows: `M S ? U` markers and folder `•`.
  - Hunk preview float (new overlay view).
  - Which-key `+git` / `+hunk` rows.
  - Message-line wording and levels for navigation, stage, reset, blame, and every Git notice.
  - Hand-off presentation: the pre-suspend message, the blank-so rule while suspended, and the restored screen.
  - Theme tokens for dark, light, and NO_COLOR.
- **Out of scope:**
  - The lazygit screen itself (stand-in in M3 S17).
  - Bar-style signs (`▎`), right-aligned explorer markers, a `D` explorer marker, and ghost rows for deleted files (rejected in feedback cycles 1–2).
  - Inline (virtual-text) blame; `.git-blame-ignore-revs` (deferred by `W261005F2A7-DES11`).
  - Stage or reset keys inside the hunk float.
- **Unresolved items:** None

## Users and Tasks

- **User:** A so user writing Markdown notes inside a Git repository, used to LazyVim's gitsigns and `<leader>gg`.
- **Task:**
  - See which lines and files changed, and the branch or in-progress operation.
  - Jump between hunks, preview what a hunk replaced, stage or reset one hunk.
  - Ask who last changed a line.
  - Hand off to lazygit for everything else and return.
- **Success:** Each task completes without leaving so or moving the layout; every outcome or refusal is stated on the message line; users outside a repository see v1 unchanged.

## UI Requirement Coverage

| Source Evidence | Accepted Mockup | Feedback Evidence | UI Requirement | UI Design | Detailed Design | Success Criteria | Verification | Status |
|---|---|---|---|---|---|---|---|---|
| `REQ4@R3`, `REQ5@R2`, `DES10` | `W261005F2A7-M1@R3` S1, S2, S14, S15 | Cycle 2; "Git sign column" | `W261005F2A7-UREQ1@R1` | `W261005F2A7-UDES1@R1` | §7 Surface: Editor gutter; Component: Git sign column | `W261005F2A7-US1@R1` | `W261005F2A7-UV1@R1`, `UV2@R1` | Covered |
| `REQ4@R3`, `REQ5@R2`, `DES2`, `DES10` | `W261005F2A7-M1@R3` S1–S5, S13 | Cycle 1 item 1; "Sign glyphs" | `W261005F2A7-UREQ2@R1` | `W261005F2A7-UDES2@R1` | §7 Component: Git sign column | `W261005F2A7-US2@R1` | `W261005F2A7-UV3@R1`, `UV4@R1`, `UV16@R1` | Covered |
| `REQ1@R2`, `REQ4@R3`, `REQ9@R1`, `DES4`, `DES5`, `DES11` | `W261005F2A7-M1@R3` S6–S10 | Assumptions "Notice wording" | `W261005F2A7-UREQ3@R1` | `W261005F2A7-UDES3@R1` | §7 Surface: Message line; Component: Git message catalogue | `W261005F2A7-US3@R1` | `W261005F2A7-UV5@R1`, `UV6@R1` | Covered |
| `REQ4@R3`, `REQ7@R2`, `DES10`, `RF8` | `W261005F2A7-M1@R3` S1, S7, S9, S11–S14 | Cycle 1 item 5; "Statusline segment" | `W261005F2A7-UREQ4@R1` | `W261005F2A7-UDES4@R1` | §7 Surface: Statusline; Component: Statusline Git segment | `W261005F2A7-US4@R1` | `W261005F2A7-UV7@R1`, `UV16@R1` | Covered |
| `REQ4@R3`, `DES10`, `RF9` | `W261005F2A7-M2@R3` S1–S6 | Cycles 1 (items 2, 3) and 2; "Explorer marker position", "Deleted tracked files" | `W261005F2A7-UREQ5@R1` | `W261005F2A7-UDES5@R1` | §7 Surface: Explorer rows; Component: Explorer Git marker | `W261005F2A7-US5@R1` | `W261005F2A7-UV8@R1` | Covered |
| `REQ4@R3`, `DES11` | `W261005F2A7-M3@R3` S1–S4 | Cycle 1 item 4; "Hunk float" | `W261005F2A7-UREQ6@R1` | `W261005F2A7-UDES6@R1` | §7 Surface: Hunk preview float; Component: HunkView | `W261005F2A7-US6@R1` | `W261005F2A7-UV9@R1`, `UV10@R1` | Covered |
| `DES11` | `W261005F2A7-M3@R3` S5, S6 | Acceptance | `W261005F2A7-UREQ7@R1` | `W261005F2A7-UDES7@R1` | §7 Surface: Which-key popup | `W261005F2A7-US7@R1` | `W261005F2A7-UV11@R1` | Covered |
| `REQ4@R3`, `DES11`, `RF13` | `W261005F2A7-M3@R3` S7, S8 | Assumptions "Blame" | `W261005F2A7-UREQ8@R1` | `W261005F2A7-UDES8@R1` | §7 Surface: Message line; Component: Git message catalogue | `W261005F2A7-US8@R1` | `W261005F2A7-UV12@R1` | Covered |
| `REQ1@R2`, `REQ3@R1`, `REQ7@R2`, `REQ8@R1`, `DES8`, `DES9` | `W261005F2A7-M3@R3` S9–S15 | Cycle 1 item 6; "Busy notice"; Assumptions "Notice wording" | `W261005F2A7-UREQ9@R1` | `W261005F2A7-UDES9@R1` | §7 Surface: Message line; Component: Git message catalogue | `W261005F2A7-US9@R1` | `W261005F2A7-UV13@R1` | Covered |
| `REQ2@R2`, `REQ6@R2`, `REQ8@R1`, `DES9` | `W261005F2A7-M3@R3` S16–S18 | Assumptions "lazygit screen" | `W261005F2A7-UREQ10@R1` | `W261005F2A7-UDES10@R1` | §7 Surface: Tool hand-off | `W261005F2A7-US10@R1` | `W261005F2A7-UV14@R1`, `UV15@R1` | Covered |
| `REQ4@R3`, `REQ7@R2`, `DES8`, `DES10` | `W261005F2A7-M1@R3` S15; `M2@R3` S7; `M3@R3` S10, S14 | "Git sign column" | `W261005F2A7-UREQ11@R1` | `W261005F2A7-UDES11@R1` | §7 Surfaces: Editor gutter, Statusline, Explorer rows (No repository state) | `W261005F2A7-US11@R1` | `W261005F2A7-UV17@R1` | Covered |
| `DES10`, UI context | `W261005F2A7-M1@R3`, `M2@R3`, `M3@R3` | Shared `git.css` R3 | `W261005F2A7-UREQ12@R1` | `W261005F2A7-UDES12@R1` | §7 Component: Git theme tokens | `W261005F2A7-US12@R1` | `W261005F2A7-UV18@R1` | Covered |

## Constraints and Dependencies

- **System constraints:**
  - Git state, hunks, markers, and the pending-operation gate are owned by core (`W261005F2A7-DES1`, `DES6`, `DES10`). Views only paint them (§3 "Display surfaces (ui)": must not own hunk computation or Git calls).
  - `Hunk` shape (`kind`, `old`, `new`, `oldLines`) and the `gitHunk` overlay `{ kind; bufferId; hunk }` are system contracts (§6 `Hunk`, git `Overlay` member).
  - `StatusSegments.git` `{ ref; op?; added; changed; removed }` (§6).
  - Suspend/resume and the paint guard are owned by the shell (`W261005F2A7-DES9`, §7 `src/ui/shell.ts`).
- **Content constraints:** English, lower-case notice text without a trailing period, matching existing notices (`E37: …`, `not written: …`); paths are workspace-relative; the program name in the tool-missing notice is `git.tool[0]`.
- **Platform constraints:**
  - Terminal grid only; every glyph is one cell wide without a Nerd Font in Ghostty, kitty, iTerm2, and Terminal.app (UI context constraints).
  - `color = "never"` and `NO_COLOR` select the `nocolor` theme (`src/ui/theme.ts:290-299`).
  - Layout classes: `narrow` under 100 columns (`src/ui/shell.ts:50-54`).
- **Existing design-system constraints:**
  - Token shape `token → [fg, bg, attributes, NO_COLOR attributes]` (`src/ui/theme.ts:125-131`); existing token values do not change.
  - Floats use `drawFrame` (`src/ui/overlays/host.ts:14-34`) with `floatBorder` / `float` / `floatTitle`.
  - Statusline segments are joined by ` │ ` (`src/ui/views/statusline.ts:153-157`).
  - Explorer `put` paints every run of a selected row in the row's base token (`src/ui/views/explorer.ts:286-296`).
  - Which-key labels are command titles (`src/core/state/whichkey.ts:128-137`).
- **Accepted assumptions:**
  - Users mostly run with colour; NO_COLOR must stay readable (UI context).
  - Blame sample data in M3 is illustrative; the format is the requirement.
  - A block-replace row carries the last Git sign of its covered range (`W261005F2A7-DES12`; manifest Open Items).

## Required System Support

| UI Design | Required System Support | Current Coverage |
|---|---|---|
| `W261005F2A7-UDES1@R1` | A Git sign carried per render row separately from the existing `sign` (`▕`/`⚠`), so both paint on the same line; block-replace rows inherit the Git sign from their covered range; the gutter widens by one cell only when `git.repo` is set, consistently for paint, mouse hit-testing, and cursor placement (`src/ui/editors/text-view.ts:335`, `:457`, `:520`). | `W261005F2A7-REQ4@R3`, `REQ5@R2`; `W261005F2A7-DES12` (`RenderLine.changeSign`, `gutterWidth(lineCount, change)`; `S8`, `S32`, `S33`; `V9`, `V63`–`V65`) |
| `W261005F2A7-UDES2@R1` | Six hunk kinds with delete anchors (`delete` on the line before the gap, `topdelete` on line 0), one `untracked` hunk for untracked and unborn files, at most one Git sign per line. | `W261005F2A7-REQ4@R3`, `REQ5@R2`; `W261005F2A7-DES2`, `DES10` (§7 `src/core/features/git/signs.ts` `GIT_SIGNS`, `hunkSigns`) |
| `W261005F2A7-UDES3@R1` | `gotoHunk` reports `hunk n/m`, `no next hunk`, `no previous hunk`; stage success reports `staged hunk n/m`, prefixed by `"<path>" written · ` when the stage saved first; reset reports `reset hunk n/m · buffer changed, autosave pending`; stage, reset, and preview with no hunk at the cursor report `no hunk at cursor`. | `W261005F2A7-REQ1@R2`, `REQ4@R3`, `REQ9@R1`; `W261005F2A7-DES4`, `DES5`, `DES13` (catalogue; `S34`; `V66`) |
| `W261005F2A7-UDES4@R1` | `StatusSegments.git` with `ref`, `op`, and counts; counts are zero for untracked files and unborn repositories. | `W261005F2A7-REQ4@R3`, `REQ7@R2`; `W261005F2A7-DES10` (§6 `StatusSegments.git`; `S10`; `V15`) |
| `W261005F2A7-UDES5@R1` | Explorer markers `conflict`, `untracked`, `modified`, `staged` per file row, by precedence `conflict > untracked > modified > staged`; `contains` on every ancestor folder of a changed path, including deleted tracked files; per-file untracked inside new folders; no `deleted` row marker. | `W261005F2A7-REQ4@R3`; `W261005F2A7-DES10`, `RF9` (§7 `src/core/features/git/status.ts` `Marker`; `S9`; `V16`, `V17`) |
| `W261005F2A7-UDES6@R1` | A `gitHunk` overlay carrying `bufferId` and `hunk`; Esc and `q` close it, a click outside closes it, any other key closes it and re-dispatches; opening with no hunk at the cursor sets `no hunk at cursor` and opens nothing. | `W261005F2A7-REQ4@R3`; `W261005F2A7-DES11` (§6 `Overlay` `gitHunk`; §7 `keys.ts`/`mouse.ts` gates), `DES13` (`no hunk at cursor`; `S34`; `V66`) |
| `W261005F2A7-UDES7@R1` | `gitCommands` titles `Lazygit (full screen)`, `Stage hunk`, `Reset hunk`, `Preview hunk`, `Blame line` (which-key prints command titles); groups `git` and `hunk`. | `W261005F2A7-REQ4@R3`, `REQ2@R2`; `W261005F2A7-DES11` (§7 `src/core/state/git-commands.ts`; `S36`; `V69`) |
| `W261005F2A7-UDES8@R1` | Blame result as `<author>, <relative date> · <summary> (<short sha>)` at info level, or `not committed yet` at info level; relative date formatted from `time` and `now`. | `W261005F2A7-REQ4@R3`; `W261005F2A7-DES11` (§5 Blame flow; §7 `src/core/features/git/blame.ts`). Relative-date buckets are defined here (§7 Git message catalogue). |
| `W261005F2A7-UDES9@R1` | A third message level `warn` (`message()` accepts only `info` and `error`, `src/core/state/result.ts:12-21`) used for `index changed; hunks refreshed` and the Git-version notice; conflicted-stage notice `<path> has conflicts; resolve them in lazygit`; blocked and failed saves before the tool both read `git tool not started: <path> could not be saved` (error); busy notice `git: another operation is running` on every pending path. | `W261005F2A7-REQ1@R2`, `REQ3@R1`, `REQ7@R2`, `REQ8@R1`; `W261005F2A7-DES8`, `DES9`, `DES13` (`warn` level, catalogue; `S34`; `V66`) |
| `W261005F2A7-UDES10@R1` | When `openTool` saved dirty buffers, the message `"<path>" written · opening lazygit` (or `N files written · opening lazygit`) is set and painted once before `shell.suspend()`; nothing is painted while suspended; on resume the full frame, including images, repaints and Git state refreshes. | `W261005F2A7-REQ2@R2`, `REQ6@R2`, `REQ8@R1`; `W261005F2A7-DES9` (`Shell.flush()` before `suspend`, paint guard; `S12`, `S14`, `S31`, `S35`), `DES13` (pre-suspend message; `V30`, `V67`, `V68`) |
| `W261005F2A7-UDES11@R1` | `git.repo === null` outside a repository, with Git missing, or below 2.31; then every Git surface renders as v1. | `W261005F2A7-REQ4@R3`, `REQ7@R2`; `W261005F2A7-DES8`, `DES10`, `DES12` (no change column when `git.repo === null`; `S32`; `V64`) |
| `W261005F2A7-UDES12@R1` | None beyond `UDES9@R1` (the `warn` level that selects `messageWarn`). Tokens live in `src/ui/theme.ts`, a UI file. | `W261005F2A7-REQ4@R3`; `W261005F2A7-DES10` (per-surface token names), `DES13` (`warn` → `messageWarn`; `S34`; `V66`) |

# 2. Experience Architecture

## Information Architecture

```text
so (inside a Git repository)
├── Editor window
│   ├── Git sign column (new, leftmost)     ← hunk kind per line
│   ├── line numbers + ▕/⚠ cell (v1)
│   └── text
├── Statusline
│   └── ⎇ ref [op] +a ~c -r (new, after path)
├── Explorer
│   └── row: name [●] [M|S|?|U] · folder [•]
├── Overlays
│   ├── Which-key: +git → g Lazygit, +hunk → s r p b
│   └── Hunk preview float (new)
├── Message line
│   └── nav / stage / reset results, blame, Git notices
└── Tool hand-off (so suspended → lazygit full screen → so resumed)
```

## Experience Model

```text
user edits a note
    → signs, counts, markers update within 100 ms of quiet typing / 200 ms after a refresh trigger
    → ]h / [h to a hunk → "hunk n/m"
    → Space g h p → float shows what the hunk replaced → Esc / q
    → Space g h s (stage) or r (reset) → message + signs/counts/markers update
    → Space g h b → blame on the message line
    → Space g g → buffers saved → lazygit full screen → q → same screen, refreshed
```

## Navigation Model

- **Primary navigation:** Normal-mode keys. `]h` / `[h` move the cursor between hunk first lines; leader keys reach commands (`Space g g`, `Space g h s|r|p|b`), discoverable through which-key.
- **Secondary navigation:** Explorer selection (`Ctrl-h`, `Enter`) opens a marked file; the `:git.*` command-line fallback (`src/core/state/commands.ts:120-127`).
- **Context preservation:** Buffer, cursor, scroll, window layout, and explorer state survive the hunk float and the tool hand-off unchanged.
- **Back and dismissal behavior:** The hunk float closes on Esc, `q`, a click outside, or any other key (which then runs). Which-key closes per v1. Leaving lazygit returns to so.
- **Deep-link behavior:** None — so has no URL or deep-link surface.

# 3. Surfaces and Navigation

## Surface Inventory

| Surface | Purpose | Entry | Exit | Accepted Mockup | Detailed Design |
|---|---|---|---|---|---|
| Editor gutter | Show the hunk kind per line | Open a file inside a repository | Close the buffer | `W261005F2A7-M1@R3` | §7 Surface: Editor gutter |
| Statusline | Show ref, operation, and active-file counts | Always visible | — | `W261005F2A7-M1@R3` | §7 Surface: Statusline |
| Explorer rows | Show per-file Git state and folders with changes | `Ctrl-h` / explorer visible | Focus the editor | `W261005F2A7-M2@R3` | §7 Surface: Explorer rows |
| Hunk preview float | Show what the hunk at the cursor replaced | `Space g h p` | Esc, `q`, click outside, other key | `W261005F2A7-M3@R3` S1–S4 | §7 Surface: Hunk preview float |
| Which-key popup | Discover Git commands | `Space g`, `Space g h` | Pick a key, Esc, `⌫` | `W261005F2A7-M3@R3` S5–S6 | §7 Surface: Which-key popup |
| Message line | Report results, blame, notices | Any Git command | Next key (v1) | `W261005F2A7-M1@R3` S6–S10; `M3@R3` S7–S16 | §7 Surface: Message line |
| Tool hand-off | Run lazygit full screen | `Space g g` | Tool exits | `W261005F2A7-M3@R3` S16–S18 | §7 Surface: Tool hand-off |

## Surface Relationships

```text
Editor (cursor on hunk)
├── ]h / [h ─────────────► Editor (next hunk) + Message "hunk n/m"
├── Space g ─────────────► Which-key +git ── h ──► Which-key +hunk
│                                │                    ├── p ──► Hunk preview float ── Esc/q ──► Editor
│                                │                    ├── s/r ─► Message + Gutter/Statusline/Explorer update
│                                │                    └── b ──► Message (blame)
│                                └── g ──► Tool hand-off ── exit ──► Editor (refreshed)
└── failure / refusal ───► Message notice (editor unchanged)
```

## Content Priority

| Surface | Primary Content | Supporting Content | Primary Action | Secondary Actions |
|---|---|---|---|---|
| Editor gutter | Note text | Git sign, line number, `▕`/`⚠` | Edit | `]h`, `[h` |
| Statusline | Mode, path | `⎇` ref, op, counts | None | None |
| Explorer rows | File name | `●`, Git marker, `•` | Open file | — |
| Hunk preview float | Removed and added lines | Header (kind, range, `n/m`), overflow row, footer | Close | None |
| Which-key popup | Keys and titles | Group labels | Run command | Back, close |
| Message line | Result or notice text | — | None | None |
| Tool hand-off | lazygit | Pre-suspend message | Use lazygit | — |

# 4. Interaction Flows and State Transitions

## Primary Flows

### Navigate hunks

```text
Normal mode, file with hunks
    → ]h
    ├→ a later hunk exists → cursor to its first line (anchor line for deletes) → "hunk n/m"
    └→ none → cursor stays → "no next hunk"          ([h: "no previous hunk")
```

### Preview a hunk

```text
cursor on a hunk line (or a delete anchor)
    → Space g h p
    ├→ hunk found → float below the cursor (above when no room) → Esc / q / click outside → editor, cursor unchanged
    └→ no hunk → "no hunk at cursor", no float
```

### Stage a hunk

```text
cursor on a hunk
    → Space g h s
    ├→ clean buffer → staged → "staged hunk n/m" → hunk's signs vanish, counts drop, marker M→S when none remain
    ├→ dirty buffer → save → stage → "\"<path>\" written · staged hunk n/m", ● clears
    ├→ conflicted file → "<path> has conflicts; resolve them in lazygit" (error), nothing changes
    ├→ index changed → "index changed; hunks refreshed" (warn), signs recomputed
    ├→ save failed → existing save failure notice, nothing staged
    ├→ another op pending → "git: another operation is running"
    └→ no hunk → "no hunk at cursor"
```

### Reset a hunk

```text
cursor on a hunk → Space g h r
    ├→ hunk found → index lines replace the hunk (one undo step) → "reset hunk n/m · buffer changed, autosave pending" → sign gone, ● shows
    └→ no hunk → "no hunk at cursor"
```

### Blame a line

```text
Space g h b
    ├→ committed → "<author>, <relative date> · <summary> (<sha7>)"
    └→ uncommitted / untracked / unborn → "not committed yet" (info)
```

### Hand off to lazygit

```text
Space g g
    ├→ not a repository → "not a git repository"
    ├→ tool missing → "lazygit not found (git.tool)", no suspend, no flicker
    ├→ save blocked or failed → "git tool not started: <path> could not be saved" (error)
    └→ saved (or nothing dirty) → "\"<path>\" written · opening lazygit" painted once (only when something was saved)
         → so suspended, paints nothing → lazygit full screen
         → tool exits → same screen restored (images re-drawn) → signs, counts, markers refresh
```

## Cross-Surface Transitions

| From | Trigger | To | Preserved Context | Focus or Scroll Result |
|---|---|---|---|---|
| Editor | `Space g` | Which-key `+git` | Editor state | Focus to popup; editor unchanged |
| Which-key `+hunk` | `p` | Hunk preview float | Cursor, scroll | Float takes keys; no cursor shown inside it |
| Hunk preview float | Esc / `q` / click outside | Editor | Everything | Focus back to the editor; same cursor and scroll |
| Hunk preview float | any other key | Editor + that key's effect | Everything | Key runs in the editor (e.g. `j` moves) |
| Editor | `Space g g` | Tool hand-off | Buffers (saved), layout | so paints nothing; terminal owned by the tool |
| Tool hand-off | tool exits | Editor | Buffer, cursor, scroll, layout, images | Same focus as before suspend |
| Explorer | `Enter` on a marked row | Editor | Explorer state | Focus to the editor (v1) |

## State Model

```text
no repository / git off ── (v1 screen, commands → "not a git repository")
repository
├── clean file → no signs, ⎇ ref only
├── changed file → signs + counts + M
│   ├── stage → pending → staged | stale (warn) | conflict (error) | save failed (error)
│   └── reset → buffer changed (dirty ●, autosave)
├── untracked / unborn → ┆ on every line, no counts, ?
└── tool hand-off → pending save → suspended → resumed → refresh
```

## State Policies

- **Default:** Git UI derives from core Git state each frame (`W261005F2A7-DES10`); no spinner or placeholder.
- **Loading:** None — discovery runs after the first frame (`W261005F2A7-DES8`); until it answers, the screen is the v1 screen (no Git column), then the column appears once. Signs lag edits by the 100 ms debounce, with no loading indicator.
- **Empty:** A clean tracked file shows a blank Git column, `⎇ <ref>` without counts, and no explorer marker.
- **Error:** One message-line notice per failure at `error` level, or `warn` for recoverable index races and the version gate (§7 Git message catalogue). No toast, no modal.
- **Success:** One `info` message-line notice; visual state (signs, counts, markers) updates in the same frame as the message where the system delivers both together (stage after `gitReadIndex`, reset immediately).
- **Disabled:** Outside a repository or with Git off, Git commands remain bound and answer `not a git repository` (or nothing after the version notice); no Git visual shows.
- **Overflow:** Long notices and blame truncate at the terminal width via the existing painter; the statusline drops the Git segment first; the hunk float caps its body and adds an overflow row.

# 5. Cross-Cutting UI Policies

## Responsive Strategy

| Viewport or Condition | Layout Strategy | Content Priority | Navigation | Interaction Change |
|---|---|---|---|---|
| ≥ 100 columns (`wide`/`medium`) | Docked explorer; full statusline | Git segment after path | Unchanged | None |
| < 100 columns (`narrow`) | Floating explorer (v1); statusline drops `git`, `preview`, `words`, `view` | Path and mode first | Unchanged | Hunk float body caps at 8 lines and spans the editor text width |
| Row too short for the float below the cursor | Float opens above the cursor line | Diff lines | Unchanged | None |
| Editor shorter than the capped float | Float height clips to the editor area; body keeps the overflow row last | Header, first diff lines, overflow row, footer | Unchanged | None |

Thresholds follow the existing `layoutClass` (`src/ui/shell.ts:50-54`) and the accepted mockups at 120×36 and 80×24.

## Visual System

- **Tokens:** New semantic tokens per §7 "Component: Git theme tokens"; reuse `diffAdd`, `diffDel`, `float*`, `statusDim`, `explorerDim`.
- **Typography:** Terminal monospace; emphasis only through bold, underline, dim, or reverse.
- **Color:** All Git colours reuse existing palette keys (`ok`, `fn`, `error`, `fg-muted`, `mode-visual`, `warn`, `fg-dim`), so no palette entry changes:

  | Meaning | Palette key | Dark | Light |
  |---|---|---|---|
  | added, staged | `ok` | `#9ece6a` | `#587539` |
  | changed, modified | `fn` | `#7aa2f7` | `#2e7de9` |
  | deleted, conflict | `error` | `#f7768e` | `#c64343` |
  | untracked | `fg-muted` | `#737aa2` | `#6172b0` |
  | ref | `mode-visual` | `#bb9af7` | `#7847bd` |
  | op, warn notice | `warn` | `#e0af68` | `#8c6c3e` |
  | contains `•` | `fg-dim` | `#565f89` | `#8990b3` |

- **Spacing and layout:** One-cell Git column at x = 0 of each editor window; one space before each explorer marker; the Git segment is a single statusline segment with single spaces between its parts.
- **Shape and elevation:** The hunk float uses the v1 rounded frame (`drawFrame`) at the overlay host's z-order.
- **Iconography and imagery:** Text glyphs only: `+ ~ _ ‾ ≃ ┆` (signs), `M S ? U •` (markers), `⎇` (ref). No Nerd Font glyph.
- **Motion:** None — terminal UI; changes appear on the next frame.

## Content and Feedback

- **Terminology:** "hunk", "stage", "reset", "index", "git", "lazygit" (the configured program name `git.tool[0]`). Do not use "chunk", "revert", "discard", or "unstage".
- **Labels and actions:** Which-key titles are sentence case without the `Git:` prefix (`Stage hunk`); groups lower case (`+git`, `+hunk`).
- **Validation:** None — no input fields.
- **Status and feedback:** Message line only, one notice per action; levels `info`, `warn`, `error` (§7 Git message catalogue). The message clears on the next key (v1, `src/core/state/update.ts:133`).
- **Truncation and overflow:** Message line truncates at the terminal width (`src/ui/views/cmdline.ts:92-100`); float lines truncate at the float's inner width; statusline drops then middle-cuts the path (v1).
- **Localization:** None — so is English-only; counts use plain integers.

## Accessibility

- **Semantics:** Each Git state has a distinct glyph or letter; colour is never the only carrier (`src/ui/theme.ts:125-131` rule).
- **Keyboard and focus:** Every Git action is reachable by keyboard; the float traps no key — Esc and `q` close it, others close and run.
- **Contrast:** Colours reuse palette keys already used for foreground text on the same backgrounds (`bg`, `bg-dark`, `bg-float`); NO_COLOR uses terminal defaults with attributes.
- **Motion and zoom:** None — no motion; terminal font zoom reflows by the existing layout classes.
- **Assistive technology:** Notices are plain text on the last row, readable by terminal screen readers; signs are single printable characters.

# 6. Component System

## Component Inventory

| Component | Responsibility | States | Existing or New | Accepted Mockup | Detailed Design |
|---|---|---|---|---|---|
| Git sign column | Paint one Git sign cell per row before the line number | absent, blank, six kinds | new (in `EditorView`) | `W261005F2A7-M1@R3` | §7 Component: Git sign column |
| Editor gutter | Line numbers and `▕`/`⚠` cell | v1 states; width +1 in a repository | adapted | `W261005F2A7-M1@R3` | §7 Surface: Editor gutter |
| Statusline Git segment | Paint `⎇ ref [op] counts` | branch, detached, unborn, op, counts, dropped | new (in `Statusline`) | `W261005F2A7-M1@R3` | §7 Component: Statusline Git segment |
| Explorer Git marker | Paint one marker cell after the name | M, S, ?, U, •, none, selected | new (in `Explorer`) | `W261005F2A7-M2@R3` | §7 Component: Explorer Git marker |
| HunkView | Paint the hunk preview float | change, delete, long, narrow, above | new | `W261005F2A7-M3@R3` | §7 Component: HunkView |
| WhichKeyView | Paint group rows | v1 | existing (labels change via command titles) | `W261005F2A7-M3@R3` | §7 Surface: Which-key popup |
| Message line (cmdline) | Paint notices | info, warn (new), error | adapted | `W261005F2A7-M3@R3` | §7 Surface: Message line |
| Git message catalogue | Exact notice wording and levels | per case | new (content contract) | `W261005F2A7-M1@R3`, `M3@R3` | §7 Component: Git message catalogue |
| Git theme tokens | Semantic tokens for every Git visual | dark, light, nocolor | new | `W261005F2A7-M1@R3`, `M2@R3`, `M3@R3` | §7 Component: Git theme tokens |

## Composition Model

```text
Shell
├── EditorView
│   └── gutter = [Git sign column][line number][space][▕/⚠ cell] + text
├── Statusline
│   └── segs = [view] [path ●] [Git segment] … [index]  Ln:Col
├── Explorer
│   └── row = indent icon name [●] [Git marker]
├── OverlayHost
│   ├── WhichKeyView (+git / +hunk rows)
│   └── HunkView (gitHunk)
└── Cmdline (message line: info | warn | error)
```

# 7. Detailed UI Design

This section is the canonical implementation-facing UI specification. Higher-level sections reference these entries instead of repeating their details.

Code previews are proposed design shapes, not production-complete implementations or task instructions. They use the codebase's TypeScript, OpenTUI `Renderable` views, `drawCells`, and `themeOf`. Data, Git calls, and state transitions stay in core per the system design.

## Surface: Editor gutter

- **Purpose:** Show per-line Git change kind without touching the text column.
- **Users and tasks:** Note writers scanning what changed since the index.
- **Requirements:** `W261005F2A7-UREQ1@R1`, `UREQ2@R1`, `UREQ11@R1`
- **UI decisions:** `W261005F2A7-UDES1@R1`, `UDES2@R1`, `UDES11@R1`
- **Accepted mockups:** `W261005F2A7-M1@R3` S1–S5, S13–S15
- **System dependencies:** `W261005F2A7-DES10` (`GIT_SIGNS`, `hunkSigns`, block-replace sign rule); `W261005F2A7-DES2` (`Hunk`); Git sign channel per row — required system support for `UDES1@R1`
- **Success criteria:** `W261005F2A7-US1@R1`, `US2@R1`, `US11@R1`
- **Verification:** `W261005F2A7-UV1@R1`, `UV2@R1`, `UV3@R1`, `UV4@R1`, `UV16@R1`, `UV17@R1`
- **Entry:** A buffer opens in a window while `git.repo` is set.
- **Exit:** Buffer closes or `git.repo` becomes `null`.

### Region Hierarchy

```text
editor row (inside a repository)
├── cell 0: Git sign column  (+ ~ _ ‾ ≃ ┆ or blank)
├── cells 1…n: line number, right-aligned (≥ 4 digits)
├── 1 space
├── 1 cell: ▕ / ⚠ (v1 sign cell)
└── text
```

Example (M1 S1, S2): `+  18 ▕- [ ] Git signs in the gutter`; outside a repository (M1 S15): `  18 ▕- [ ] Git signs in the gutter`.

### Content and Action Hierarchy

1. Text.
2. Git sign (quiet, one cell, far left).
3. Line number and `▕`/`⚠`.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | Git column with signs on changed lines; blank cell elsewhere | Edit, `]h`, `[h`, `Space g h …` | None | Cursor in text column |
| Loading | None — discovery pending: v1 gutter until `gitDetected` sets a repository | Same as v1 | None | Unchanged |
| Empty | Clean file: Git column present, all blank | Same | None | Unchanged |
| Error | None — Git failures report on the message line; gutter keeps the last good signs | Same | Message line | Unchanged |
| Success | After stage or reset, the affected hunk's signs vanish in the next frame | Same | Message line | Unchanged |
| Disabled | Outside a repository / Git off: no Git column, v1 width | Same as v1 | None | Unchanged |
| Overflow | Wrapped line: sign on its first screen row only; continuation rows blank in the Git column. Block-replaced region (mermaid, math): the rendered row shows the last Git sign in its covered range. Widget rows: sign on the first widget row. | Same | None | Unchanged |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| Typing | Repository | Signs update after 100 ms quiet (`W261005F2A7-REQ5@R2`) | New signs | Unchanged | None |
| Click in Git column | Repository | Same as a click on the line-number gutter (v1 behaviour unchanged) | Cursor moved | Unchanged | None |
| `Space m` | Any | Same signs in live, source, reading | Same | Unchanged | None |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| Any width | Git, number, space, sign, text | None — the Git column is always one cell | Text | None |
| Split windows | Each window has its own Git column for its buffer | None | Text | None |

### Accessibility Specification

- **Landmarks and headings:** None — terminal grid.
- **Names and descriptions:** The glyph is the name: `+` added, `~` changed, `_` deleted below, `‾` deleted at top, `≃` changed + deleted, `┆` untracked.
- **Keyboard sequence:** `]h` / `[h`; no gutter focus.
- **Focus entry, movement, and restoration:** Unchanged — the gutter takes no focus.
- **Announcements:** None — results go to the message line.
- **Zoom and reflow:** One cell regardless of font size.

### Components

- Git sign column — paints cell 0 — see §7 Component: Git sign column
- Git theme tokens — sign colours — see §7 Component: Git theme tokens

### Applicable Code Shape

- **Target:** `src/ui/editors/text-view.ts` — `gutterWidth`, `EditorView.renderSelf` `gutter`
- **Language and framework:** TypeScript, OpenTUI `Renderable`
- **System-design authority:** `W261005F2A7-DES12` (`RenderLine.changeSign`, `gutterWidth(lineCount, change)`); `W261005F2A7-DES10` (`GIT_SIGNS`)

```ts
/** A Git sign cell when the workspace is in a repository, line numbers, a space, and the sign cell. */
const gutterWidth = (lineCount: number, change: boolean) =>
  (change ? 1 : 0) + Math.max(4, String(lineCount).length) + 2;

const change = s.git.repo !== null;
const gw = gutterWidth(b?.text.lineCount ?? 0, change);
const gutter = (text: string, at: number, sign?: Sign, changeSign?: Sign) => {
  if (change)
    drawCells(buf, theme.style(changeSign?.style ?? "gutter"), this.x, y + at, changeSign?.text ?? "", 1);
  const nx = this.x + (change ? 1 : 0);
  drawCells(buf, theme.style(isCursor && text !== "" ? "gutterCursor" : "gutter"), nx, y + at, `${text.padStart(gw - (change ? 3 : 2))} `, gw - (change ? 2 : 1));
  drawCells(buf, theme.style(sign?.style ?? "gutter"), this.x + gw - 1, y + at, sign?.text ?? "", 1);
};
// first screen row of a line: gutter(number(), i, row.sign, row.changeSign); continuation rows: gutter("", i)
```

`gutterWidth` gains the `change` flag of `W261005F2A7-DES12`, and every caller (`renderSelf` at `:520`, the hit-test at `:457`, and the cursor/scroll width at `:335`) passes the same `s.git.repo !== null`, so a click or cursor never lands one cell off. `gutter` paints the change cell first, then the v1 number and sign cells shifted right by one. `row.changeSign` is the per-row Git sign that `layoutText` fills separately from `row.sign`, including block-replace inheritance (`W261005F2A7-DES12`). Outside a repository `change` is false and the function draws exactly the v1 cells, which keeps the "byte-identical" invariant of `W261005F2A7-DES10` and `DES12`.

## Surface: Statusline

- **Purpose:** Show ref, in-progress operation, and active-file change size.
- **Users and tasks:** Glancing at branch and change size while writing.
- **Requirements:** `W261005F2A7-UREQ4@R1`, `UREQ11@R1`
- **UI decisions:** `W261005F2A7-UDES4@R1`, `UDES11@R1`
- **Accepted mockups:** `W261005F2A7-M1@R3` S1, S7, S9, S11–S15
- **System dependencies:** `W261005F2A7-DES10` §6 `StatusSegments.git`; required system support for `UDES4@R1` (no counts for untracked)
- **Success criteria:** `W261005F2A7-US4@R1`, `US11@R1`
- **Verification:** `W261005F2A7-UV7@R1`, `UV16@R1`, `UV17@R1`
- **Entry:** Always painted.
- **Exit:** None.

### Region Hierarchy

```text
statusline
├── mode badge
├── [view] │ path ● │ ⎇ ref [op] +a ~c -r │ [save error] │ … │ [index]
└── Ln:Col (right)
```

### Content and Action Hierarchy

1. Mode and path.
2. Git segment.
3. Other v1 segments.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | `⎇ main +2 ~2 -3` | None | None | None |
| Loading | None — before discovery the segment is absent | None | None | None |
| Empty | Clean file or no active buffer: `⎇ main` | None | None | None |
| Error | None — Git errors do not change the segment; last status stays | None | None | None |
| Success | Counts update after stage/reset/refresh | None | None | None |
| Disabled | No repository: no segment (`UDES11@R1`) | None | None | None |
| Overflow | Narrow: segment dropped first; wide but too long: dropped before `preview`, `words`, `view` | None | None | None |

Ref variants: branch `⎇ main`; detached `⎇ a1b2c3d`; unborn `⎇ main` (no counts); op appended `⎇ a1b2c3d rebasing +2 ~2 -3`, `⎇ main merging`. Untracked file: no counts.

### Interaction Contract

None — the statusline takes no input (`Statusline.targetAt` returns `inert`).

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| ≥ 100 columns | badge, view, path, git, … | None | All | None |
| < 100 columns | badge, path, … | `git` dropped with `preview`, `words`, `view` | Path | None |
| ≥ 100 columns, row too long | — | Drop order `git`, `preview`, `words`, `view`, then middle-cut path | Path | None |

### Accessibility Specification

- **Landmarks and headings:** None.
- **Names and descriptions:** `⎇` marks the ref; `+`, `~`, `-` name the counts; `rebasing` / `merging` are words.
- **Keyboard sequence:** None.
- **Focus entry, movement, and restoration:** None.
- **Announcements:** None.
- **Zoom and reflow:** Narrow rule above.

### Components

- Statusline Git segment — see §7 Component: Statusline Git segment

### Applicable Code Shape

None — the composition is defined in the component entry below; the surface adds only the drop-order change shown there.

## Surface: Explorer rows

- **Purpose:** Show each file's Git state and which folders contain changes.
- **Users and tasks:** Scanning the workspace for changed, staged, new, and conflicted files.
- **Requirements:** `W261005F2A7-UREQ5@R1`, `UREQ11@R1`
- **UI decisions:** `W261005F2A7-UDES5@R1`, `UDES11@R1`
- **Accepted mockups:** `W261005F2A7-M2@R3` S1–S7
- **System dependencies:** `W261005F2A7-DES10` (`explorerMarkers`); required system support for `UDES5@R1` (no `deleted` marker)
- **Success criteria:** `W261005F2A7-US5@R1`, `US11@R1`
- **Verification:** `W261005F2A7-UV8@R1`, `UV17@R1`
- **Entry:** Explorer visible (docked or floating).
- **Exit:** Explorer hidden.

### Region Hierarchy

```text
explorer row
├── indent
├── icon + space
├── name
├── " ●" (dirty, v1)
└── " M|S|?|U" (file) or " •" (folder)
```

Examples: `so-roadmap.md ● M`, `2026-10-02.md S`, `ideas.md ?`, `linh.md U`, `daily •`.

### Content and Action Hierarchy

1. Name.
2. Dirty dot.
3. Git marker.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | Markers per file, `•` on folders containing any change | v1 explorer actions | None | v1 selection |
| Loading | None — markers appear on the first `gitStatus` | v1 | None | v1 |
| Empty | Clean repository: no markers | v1 | None | v1 |
| Error | None — a failed status keeps the last markers (`W261005F2A7-DES6`) | v1 | None | v1 |
| Success | Markers change after stage/refresh (`M` → `S` when all hunks staged) | v1 | None | v1 |
| Disabled | No repository: no markers or `•` | v1 | None | v1 |
| Overflow | Narrow row: the name is cut by the row width before the marker cells (v1 `put` room rule); collapsed new folder shows only `•`; deleted tracked file has no row, its ancestors show `•` | v1 | None | v1 |

### Interaction Contract

Unchanged — see `src/ui/views/explorer.ts` (v1 explorer keys and clicks).

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| Docked (≥ 100 columns) | as above | None | Name | None |
| Floating (< 100 columns) | as above | Same markers inside the float (M2 S6) | Name | None |

### Accessibility Specification

- **Landmarks and headings:** Unchanged.
- **Names and descriptions:** Marker letters: `M` modified, `S` staged, `?` untracked, `U` conflicted; `•` contains changes.
- **Keyboard sequence:** Unchanged.
- **Focus entry, movement, and restoration:** Unchanged.
- **Announcements:** None.
- **Zoom and reflow:** Unchanged.

### Components

- Explorer Git marker — see §7 Component: Explorer Git marker

### Applicable Code Shape

None — shown in the component entry.

## Surface: Hunk preview float

- **Purpose:** Show the index lines a hunk replaced and the buffer lines that replaced them.
- **Users and tasks:** Checking a change or delete before staging or resetting.
- **Requirements:** `W261005F2A7-UREQ6@R1`
- **UI decisions:** `W261005F2A7-UDES6@R1`
- **Accepted mockups:** `W261005F2A7-M3@R3` S1–S4
- **System dependencies:** `W261005F2A7-DES11` (`gitHunk` overlay, `keys.ts`/`mouse.ts` gates); §6 `Hunk`
- **Success criteria:** `W261005F2A7-US6@R1`
- **Verification:** `W261005F2A7-UV9@R1`, `UV10@R1`
- **Entry:** `Space g h p` with a hunk at the cursor.
- **Exit:** Esc, `q`, click outside, any other key.

### Region Hierarchy

```text
╭─ hunk preview ──────────────────────────────╮
│ ≃ changed + deleted · line 31 · hunk 3/4     │  header
│ - Signs should be quiet.                     │  removed (diffDel)
│ - They must not distract.                    │
│ - Prose first.                               │
│ + Signs stay quiet so prose reads first.     │  added (diffAdd)
│   … N more lines (r removed, a added)        │  overflow row (only when capped)
╰─ esc / q close ──────────────────────────────╯  footer on the bottom border
```

The header reads `<glyph> <kind label> · <range> · hunk <n>/<m>`. Range: `line N` (one buffer line), `lines N–M` (several), `after line N` (`delete`, `N` = 1-based anchor line), `at top` (`topdelete`). Kind labels: `added`, `changed`, `deleted below`, `deleted at top`, `changed + deleted`, `untracked`.

### Content and Action Hierarchy

1. Removed and added lines.
2. Header.
3. Overflow row and footer.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | Header, `-` lines then `+` lines | Esc, `q`, click outside, other keys | None | Keys go to the float gate |
| Loading | None — the hunk is in the overlay state when it opens | — | — | — |
| Empty | None — no float opens without a hunk; message `no hunk at cursor` | — | Message line | Editor keeps focus |
| Error | None — the float paints state only; if its buffer closed, it paints nothing (the overlay closes per system gate) | — | — | — |
| Success | None — read-only float | — | — | — |
| Disabled | None — outside a repository the command answers `not a git repository` | — | Message line | — |
| Overflow | Body over the cap (12, or 8 when `narrow`): first cap lines, then `… N more lines (r removed, a added)`; long lines truncate at the inner width; height clips to the editor area | Same | None | Same |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| `Space g h p` | Hunk at cursor | Float opens below the cursor row, or above when it does not fit | `gitHunk` open | Editor cursor hidden behind no part of the float (never covers the cursor row) | `no hunk at cursor` |
| Esc / `q` | Float open | Float closes | `none` | Editor focus, unchanged cursor | None |
| Click outside | Float open | Float closes | `none` | Unchanged | None |
| Click inside | Float open | Nothing | Same | Same | None |
| Other key | Float open | Float closes and the key runs | Per key | Per key | None |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| `wide` / `medium` | header, body, overflow, footer | x = editor text start; width = min(72, editor right edge − x); cap 12 | Diff lines | None |
| `narrow` | same | x = editor text start; width = editor right edge − x (spans the editor); cap 8 | Diff lines | None |
| Not enough rows below | same | Opens above the cursor row | Diff lines | None |

### Accessibility Specification

- **Landmarks and headings:** Title ` hunk preview ` on the top border.
- **Names and descriptions:** Header names kind, range, and position.
- **Keyboard sequence:** Esc or `q` closes; nothing else is focusable.
- **Focus entry, movement, and restoration:** Focus returns to the editor with the same cursor.
- **Announcements:** None.
- **Zoom and reflow:** Responsive rules above.

### Components

- HunkView — see §7 Component: HunkView

### Applicable Code Shape

None — shown in the component entry.

## Surface: Which-key popup

- **Purpose:** Make Git commands discoverable under `Space g`.
- **Users and tasks:** LazyVim users finding `gg` and `gh*`.
- **Requirements:** `W261005F2A7-UREQ7@R1`
- **UI decisions:** `W261005F2A7-UDES7@R1`
- **Accepted mockups:** `W261005F2A7-M3@R3` S5, S6
- **System dependencies:** `W261005F2A7-DES11` (`gitCommands`, `gitBindings`, `gitGroups`); required system support for `UDES7@R1` (command titles)
- **Success criteria:** `W261005F2A7-US7@R1`
- **Verification:** `W261005F2A7-UV11@R1`
- **Entry:** `Space g`, `Space g h`.
- **Exit:** v1 (key, `⌫`, Esc).

### Region Hierarchy

```text
╭─ ␣g ─────────────────────────────────╮       ╭─ ␣gh ──────────────────────────────────────╮
│   g → Lazygit (full screen)  h → +hunk│       │ b → Blame line  p → Preview hunk  r → Reset hunk  s → Stage hunk │
╰─ ⌫ back · esc close ──────────────────╯       ╰─ ⌫ back · esc close ────────────────────────╯
```

Order follows v1: direct actions first, then `+groups`, each alphabetical by key (`src/core/state/whichkey.ts:111-140`).

### Content and Action Hierarchy

1. Keys.
2. Titles.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | `+git`: `g → Lazygit (full screen)`, `h → +hunk`; `+hunk`: `b → Blame line`, `p → Preview hunk`, `r → Reset hunk`, `s → Stage hunk` | v1 | None | v1 |
| Loading | None — static | — | — | — |
| Empty | None — groups always have entries | — | — | — |
| Error | None — static | — | — | — |
| Success | None — runs the command | — | — | — |
| Disabled | Outside a repository the rows still show; commands answer `not a git repository` | v1 | Message line | v1 |
| Overflow | v1 column layout | v1 | None | v1 |

`]h` and `[h` are Normal-mode bindings and do not appear in the leader tree.

### Interaction Contract

Unchanged — see `src/ui/overlays/whichkey.ts` and `src/core/state/whichkey.ts`.

### Responsive Specification

Unchanged — see `src/ui/overlays/whichkey.ts` `layout`.

### Accessibility Specification

Unchanged — see `src/ui/overlays/whichkey.ts`.

### Components

- WhichKeyView — existing; labels come from command titles.

### Applicable Code Shape

- **Target:** `src/core/state/git-commands.ts` — `gitCommands` (proposed by the system design)
- **Language and framework:** TypeScript
- **System-design authority:** `W261005F2A7-DES11`; required system support for `UDES7@R1`

```ts
export const gitCommands: AppCommand[] = [
  { id: "git.tool", title: "Lazygit (full screen)", run: openTool },
  { id: "git.stageHunk", title: "Stage hunk", run: stageHunk },
  { id: "git.resetHunk", title: "Reset hunk", run: resetHunk },
  { id: "git.previewHunk", title: "Preview hunk", run: previewHunk },
  { id: "git.blameLine", title: "Blame line", run: blameLine },
  // git.nextHunk / git.prevHunk keep their titles: they are not in the leader tree
];
```

The titles match `W261005F2A7-DES11`; ids, handlers, bindings, and groups are as `DES11` defines. `whichKeyRows` prints `title` as the label, which yields M3 S5–S6.

## Surface: Message line

- **Purpose:** Report every Git result, blame, and notice in one row.
- **Users and tasks:** Confirming an action or learning why it was refused.
- **Requirements:** `W261005F2A7-UREQ3@R1`, `UREQ8@R1`, `UREQ9@R1`
- **UI decisions:** `W261005F2A7-UDES3@R1`, `UDES8@R1`, `UDES9@R1`
- **Accepted mockups:** `W261005F2A7-M1@R3` S6–S10; `W261005F2A7-M3@R3` S7–S16
- **System dependencies:** `message()` (`src/core/state/result.ts:12-21`); `W261005F2A7-DES4`, `DES5`, `DES8`, `DES9`, `DES11`; required system support for `UDES3@R1`, `UDES9@R1`
- **Success criteria:** `W261005F2A7-US3@R1`, `US8@R1`, `US9@R1`
- **Verification:** `W261005F2A7-UV5@R1`, `UV6@R1`, `UV12@R1`, `UV13@R1`
- **Entry:** A Git command answers.
- **Exit:** Next key (v1).

### Region Hierarchy

```text
last row: <notice text, truncated at cols>   [pending keys, right]
```

### Content and Action Hierarchy

1. Notice text.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | Empty or last notice | Any key clears | — | — |
| Loading | None — Git commands answer with one final notice; no progress text | — | — | — |
| Empty | v1 | — | — | — |
| Error | `messageError` text (bold `error`; bold in NO_COLOR) | Any key clears | — | — |
| Success | `message` text (info) | Any key clears | — | — |
| Disabled | `not a git repository` (info) | — | — | — |
| Overflow | Truncated at terminal width (v1) | — | — | — |

Warn level (new): `messageWarn` (`warn` colour; plain in NO_COLOR).

### Interaction Contract

Unchanged — see `src/ui/views/cmdline.ts:92-100`.

### Responsive Specification

Unchanged — one row at every width; truncation per v1.

### Accessibility Specification

- **Landmarks and headings:** None.
- **Names and descriptions:** The text is self-describing; levels never rely on colour alone — error is bold in NO_COLOR, and warn notices name the condition in words.
- **Keyboard sequence:** None.
- **Focus entry, movement, and restoration:** None.
- **Announcements:** Plain text on the last row.
- **Zoom and reflow:** v1.

### Components

- Git message catalogue — see §7 Component: Git message catalogue

### Applicable Code Shape

- **Target:** `src/ui/views/cmdline.ts` — message painter; `src/core/state/result.ts` — `message`
- **Language and framework:** TypeScript, OpenTUI
- **System-design authority:** `W261005F2A7-DES13` (`message()` `warn` level, Git message catalogue)

```ts
const MESSAGE_TOKEN = { info: "message", warn: "messageWarn", error: "messageError" } as const;

const m = s.notifications.message;
drawCells(buf, theme.style(MESSAGE_TOKEN[m?.level ?? "info"]), 0, y, m?.text ?? "", cols);
```

The painter's two-way ternary (`src/ui/views/cmdline.ts:94-96`) becomes a lookup over three levels. The level itself is a core contract: `message()` must accept `"warn"`, which the system design owns.

## Surface: Tool hand-off

- **Purpose:** Run lazygit full screen and return to an unchanged so.
- **Users and tasks:** Committing, branching, pushing, resolving conflicts.
- **Requirements:** `W261005F2A7-UREQ10@R1`, `UREQ9@R1`
- **UI decisions:** `W261005F2A7-UDES10@R1`
- **Accepted mockups:** `W261005F2A7-M3@R3` S9, S13, S16–S18
- **System dependencies:** `W261005F2A7-DES9` (`openTool`, `runTool`, `Shell.suspend`/`resume`, paint guard, image re-issue); required system support for `UDES10@R1` (pre-suspend message paint)
- **Success criteria:** `W261005F2A7-US10@R1`
- **Verification:** `W261005F2A7-UV14@R1`, `UV15@R1`
- **Entry:** `Space g g`.
- **Exit:** Tool exits (any code or signal).

### Region Hierarchy

```text
before:  so screen + message "\"<path>\" written · opening lazygit"
during:  tool owns the whole terminal; so draws nothing
after:   so screen as before (buffer, cursor, scroll, layout, images), Git state refreshed
```

### Content and Action Hierarchy

1. The tool.
2. The pre-suspend message.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | so screen | `Space g g` | — | — |
| Loading | Saving: v1 save indicators; then the pre-suspend message for one frame | None | Message line | — |
| Empty | Nothing dirty: no pre-suspend message; suspend directly | — | — | — |
| Error | Tool missing: `lazygit not found (git.tool)`, no suspend; save failed: `git tool not started: <path> could not be saved` | Retry | Message line | Editor |
| Success | Resumed screen; the message line is cleared on resume (the pre-suspend message no longer applies) | All | Signs, counts, markers refresh | Same focus |
| Disabled | Not a repository: `not a git repository` | — | Message line | — |
| Overflow | Many dirty files: `N files written · opening lazygit` | — | Message line | — |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| `Space g g` | Repository, tool on PATH | Save, message, suspend, tool runs | Suspended | Terminal to the tool | Notices above |
| Tool exit | Suspended | Full repaint, images re-drawn, refresh | Running | Restored | None |
| Ctrl-C in tool | Suspended | The tool handles it; so stays running (`W261005F2A7-DES9`) | Suspended | — | — |

### Responsive Specification

None — the tool owns the terminal; so's resumed layout follows the terminal size at resume (a resize during the tool is applied on resume, v1 resize handling).

### Accessibility Specification

- **Landmarks and headings:** None.
- **Names and descriptions:** The pre-suspend message names what was saved and what opens.
- **Keyboard sequence:** `Space g g`; the tool's own keys.
- **Focus entry, movement, and restoration:** Focus returns to the window that was active.
- **Announcements:** Message line.
- **Zoom and reflow:** None.

### Components

- Git message catalogue — wording — see §7 Component: Git message catalogue

### Applicable Code Shape

None — suspend, resume, and the paint guard are system-design shapes (§7 `src/ui/shell.ts`, `src/app/tool-host.ts`); the UI adds only message wording and the "paint once before suspend" support entry.

## Component: Git sign column

- **Responsibility:** Paint one Git sign cell at x = 0 of each editor row inside a repository.
- **Requirements:** `W261005F2A7-UREQ1@R1`, `UREQ2@R1`, `UREQ11@R1`
- **UI decisions:** `W261005F2A7-UDES1@R1`, `UDES2@R1`, `UDES11@R1`
- **Accepted mockups:** `W261005F2A7-M1@R3`
- **Specification mode:** new
- **Existing contract:** None — new component (adjacent v1 sign cell: `src/ui/editors/text-view.ts:540-557`)
- **Reuse scope:** surface
- **System contract:** `W261005F2A7-DES10` `GIT_SIGNS`; `W261005F2A7-DES12` `RenderLine.changeSign`, `gutterWidth`
- **Success criteria:** `W261005F2A7-US1@R1`, `US2@R1`, `US11@R1`
- **Verification:** `W261005F2A7-UV1@R1`, `UV2@R1`, `UV3@R1`, `UV4@R1`, `UV16@R1`, `UV17@R1`

### Anatomy

```text
Git sign column
└── one cell: glyph or space
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| add | Added lines | `+` | None | `gitAdd` |
| change | Changed lines | `~` | None | `gitChange` |
| delete | Lines deleted below this line | `_` on the line before the gap | None | `gitDelete` |
| topdelete | Lines deleted before line 1 | `‾` on line 1 | None | `gitTopDelete` |
| changedelete | Last changed line of a change that also removed lines | `≃` | None | `gitChangeDelete` |
| untracked | Every line of an untracked file or any file in an unborn repository | `┆` | None | `gitUntracked` |
| blank | No change | space | None | `gutter` |
| absent | No repository / Git off | no cell | None | v1 gutter |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| repository flag | yes | `s.git.repo !== null` | Column present iff true | Absent |
| Git sign per row | no | per-row Git sign (system support) from `GIT_SIGNS` | Paint on the first screen row of the source line or block | Blank cell |

### Interaction and Focus Contract

- **Activation:** None — click maps like the line-number gutter (v1).
- **Keyboard behavior:** None.
- **Focus behavior:** None.
- **Feedback:** None.
- **Disabled behavior:** Absent outside a repository.

### Responsive and Visual Rules

- **Responsive behavior:** Always one cell.
- **Token references:** `gitAdd`, `gitChange`, `gitDelete`, `gitTopDelete`, `gitChangeDelete`, `gitUntracked`, `gutter`.
- **Content overflow:** None — one glyph.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** Glyph.
- **Accessible name and description:** The glyph itself (see variants).
- **State exposure:** Glyph differs per kind in every theme.
- **Assistive-technology behavior:** Read as a character.

### Implementation Boundaries

- **Must own:** Painting the cell, gutter-width offset.
- **Must not own:** Hunk computation, sign selection per line, block-replace inheritance (system design).
- **Composes:** None.
- **Used by:** Editor gutter.

### Applicable Code Shape

- **Target:** `src/core/features/git/signs.ts` — `GIT_SIGNS`
- **Language and framework:** TypeScript
- **System-design authority:** `W261005F2A7-DES10`
- **Existing shape:** §7 `src/core/features/git/signs.ts` proposed shape

None — the system design's `GIT_SIGNS` already maps each kind to the accepted glyph and a `git*` token; the painting shape is in §7 Surface: Editor gutter.

## Component: Statusline Git segment

- **Responsibility:** Paint `⎇ <ref> [op] [+a] [~c] [-r]` as one segment after the path.
- **Requirements:** `W261005F2A7-UREQ4@R1`, `UREQ11@R1`
- **UI decisions:** `W261005F2A7-UDES4@R1`
- **Accepted mockups:** `W261005F2A7-M1@R3` S1, S7, S9, S11–S14
- **Specification mode:** new
- **Existing contract:** None — new component (host `Statusline`, `src/ui/views/statusline.ts:27`, `:85-158`)
- **Reuse scope:** surface
- **System contract:** §6 `StatusSegments.git`
- **Success criteria:** `W261005F2A7-US4@R1`
- **Verification:** `W261005F2A7-UV7@R1`, `UV16@R1`

### Anatomy

```text
⎇ main rebasing +2 ~2 -3
│ │    │        └─ counts: +added ~changed -removed (zeros hidden)
│ │    └─ op (optional)
│ └─ ref: branch | unborn name | 7-char sha
└─ ref glyph
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| branch | On a branch | `⎇ main +2 ~2 -3` | None | ref `statusGitRef` |
| clean | No changes | `⎇ main` | None | — |
| detached | Detached HEAD | `⎇ a1b2c3d` | None | — |
| unborn | No commits | `⎇ main` (no counts) | None | — |
| op | Rebase/merge | `⎇ a1b2c3d rebasing …`, `⎇ main merging` | None | `statusGitOp` bold; underline in NO_COLOR |
| untracked file | Active file untracked | `⎇ main` (no counts) | None | — |
| dropped | Narrow or no room | absent | None | — |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| `git` | no | `StatusSegments.git` | Segment iff present | Absent |
| `ref` | yes | `git.ref` | Verbatim after `⎇ ` | — |
| `op` | no | `git.op` | After ref, one space | Omitted |
| `added`, `changed`, `removed` | yes | `git.*` | `+n`, `~n`, `-n`, each only when > 0 | Omitted when 0 |

### Interaction and Focus Contract

- **Activation:** None.
- **Keyboard behavior:** None.
- **Focus behavior:** None.
- **Feedback:** None.
- **Disabled behavior:** Absent without a repository.

### Responsive and Visual Rules

- **Responsive behavior:** First in the drop list `[git, preview, words, view]`; always dropped when `narrow`.
- **Token references:** `statusGitRef`, `statusGitOp`, `statusGitAdd`, `statusGitChange`, `statusGitDelete`, separators `statusDim`.
- **Content overflow:** Never truncated; dropped whole.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** Text.
- **Accessible name and description:** `⎇` and the count prefixes.
- **State exposure:** Op as a word; underline in NO_COLOR.
- **Assistive-technology behavior:** Read as text.

### Implementation Boundaries

- **Must own:** Formatting and colouring the parts; drop order.
- **Must not own:** Counting (core `statusSegments`), ref resolution.
- **Composes:** None.
- **Used by:** Statusline.

### Applicable Code Shape

- **Target:** `src/ui/views/statusline.ts` — `Seg`, `gitSegment`, drop loop
- **Language and framework:** TypeScript, OpenTUI
- **System-design authority:** §6 `StatusSegments.git`; `W261005F2A7-DES10`
- **Existing shape:** `src/ui/views/statusline.ts:27` (`type Seg = { text; token }`), `:136-140` (drop loop)

```ts
type Seg = { text: string; token: string; parts?: readonly { text: string; token: string }[] };

function gitSegment(g: NonNullable<StatusSegments["git"]>): Seg {
  const parts = [{ text: `⎇ ${g.ref}`, token: "statusGitRef" }];
  if (g.op !== undefined) parts.push({ text: ` ${g.op}`, token: "statusGitOp" });
  if (g.added > 0) parts.push({ text: ` +${g.added}`, token: "statusGitAdd" });
  if (g.changed > 0) parts.push({ text: ` ~${g.changed}`, token: "statusGitChange" });
  if (g.removed > 0) parts.push({ text: ` -${g.removed}`, token: "statusGitDelete" });
  return { text: parts.map((p) => p.text).join(""), token: "statusline", parts };
}

const git = seg.git === undefined ? undefined : gitSegment(seg.git);
segs.push(path);
if (git !== undefined) segs.push(git);
for (const optional of [git, preview, words, view]) { /* v1 drop rule */ }
// paint: g.parts ? g.parts.forEach((p) => put(p.text, p.token)) : put(g.text, g.token)
```

`Seg` gains optional `parts`, so one segment can carry several tokens while `text` still drives the width calculation (`fixedWidth`). The Git segment is pushed right after `path` and leads the existing drop list, which gives the v1 narrow rule and the "drops first" rule with no new layout code.

## Component: Explorer Git marker

- **Responsibility:** Paint one marker cell after a row's name (after `●`).
- **Requirements:** `W261005F2A7-UREQ5@R1`, `UREQ11@R1`
- **UI decisions:** `W261005F2A7-UDES5@R1`
- **Accepted mockups:** `W261005F2A7-M2@R3`
- **Specification mode:** new
- **Existing contract:** None — new component (row painter `src/ui/views/explorer.ts:273-315`)
- **Reuse scope:** surface
- **System contract:** `W261005F2A7-DES10` `explorerMarkers`, `Marker`
- **Success criteria:** `W261005F2A7-US5@R1`
- **Verification:** `W261005F2A7-UV8@R1`

### Anatomy

```text
name [ ●] [ X]     X ∈ { M, S, ?, U, • }
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| modified | Worktree differs from index | ` M` | None | `explorerGitModified` |
| staged | Index differs from HEAD, worktree clean | ` S` | None | `explorerGitStaged` |
| untracked | New file | ` ?` | None | `explorerGitUntracked` |
| conflict | Unmerged | ` U` | None | `explorerGitConflict` bold; underline in NO_COLOR |
| contains | Folder with any changed descendant (incl. deleted tracked files) | ` •` | None | `explorerGitContains` |
| none | Clean | nothing | None | — |
| selected | Selected row | same glyph | v1 | Row base token (reverse/underline) for every run (v1 `put`) |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| marker map | no | `explorerMarkers(s.git.status)` | Lookup by row path | No marker |
| row path | yes | explorer row | Workspace-relative | — |

### Interaction and Focus Contract

- **Activation:** None — the row's v1 actions apply.
- **Keyboard behavior:** Unchanged.
- **Focus behavior:** Unchanged.
- **Feedback:** None.
- **Disabled behavior:** No markers without a repository.

### Responsive and Visual Rules

- **Responsive behavior:** Same in docked and floating explorers.
- **Token references:** `explorerGitModified`, `explorerGitStaged`, `explorerGitUntracked`, `explorerGitConflict`, `explorerGitContains`.
- **Content overflow:** Painted only while room remains (v1 `put`).
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** Letter.
- **Accessible name and description:** `M` modified, `S` staged, `?` untracked, `U` conflicted, `•` contains changes.
- **State exposure:** Letter differs per state.
- **Assistive-technology behavior:** Read as text.

### Implementation Boundaries

- **Must own:** Glyph and token per marker.
- **Must not own:** Marker precedence, folder aggregation (core).
- **Composes:** None.
- **Used by:** Explorer rows.

### Applicable Code Shape

- **Target:** `src/ui/views/explorer.ts` — row painter
- **Language and framework:** TypeScript, OpenTUI
- **System-design authority:** `W261005F2A7-DES10`
- **Existing shape:** `src/ui/views/explorer.ts:314-315`

```ts
const GIT_MARKERS = {
  modified: ["M", "explorerGitModified"],
  staged: ["S", "explorerGitStaged"],
  untracked: ["?", "explorerGitUntracked"],
  conflict: ["U", "explorerGitConflict"],
  contains: ["•", "explorerGitContains"],
} as const;

const markers = s.git.status === null ? undefined : explorerMarkers(s.git.status);
// per row, after the name:
if (dirty.has(row.path)) put(" ●", "explorerDirty");
const m = markers?.get(row.path);
if (m !== undefined) put(` ${GIT_MARKERS[m][0]}`, GIT_MARKERS[m][1]);
```

The marker is painted with the existing `put`, so a selected row keeps its reversed base token (M2 S4) and a narrow row cuts the marker last. `GIT_MARKERS` lists exactly the accepted set; there is no entry for a deleted file because such a file has no explorer row (required system support for `UDES5@R1` removes `deleted` from the row-marker set).

## Component: HunkView

- **Responsibility:** Paint the `gitHunk` overlay as a float anchored to the cursor row.
- **Requirements:** `W261005F2A7-UREQ6@R1`
- **UI decisions:** `W261005F2A7-UDES6@R1`
- **Accepted mockups:** `W261005F2A7-M3@R3` S1–S4
- **Specification mode:** new
- **Existing contract:** None — new component (pattern: `src/ui/overlays/whichkey.ts` `WhichKeyView`, `src/ui/overlays/conflict.ts` diff lines)
- **Reuse scope:** feature
- **System contract:** `W261005F2A7-DES11` (`gitHunk` overlay, `HunkView` registered in `shell.ts`); §6 `Hunk`
- **Success criteria:** `W261005F2A7-US6@R1`
- **Verification:** `W261005F2A7-UV9@R1`, `UV10@R1`

### Anatomy

```text
HunkView
├── frame (title " hunk preview ", footer "esc / q close")
├── header row
├── body: removed rows (diffDel, "- "), then added rows (diffAdd, "+ ")
└── overflow row (optional, floatDim)
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| change / changedelete | Replaced lines | `-` rows then `+` rows | Close keys | — |
| add / untracked | New lines | `+` rows only | Close keys | — |
| delete / topdelete | Removed lines | `-` rows only; range `after line N` / `at top` | Close keys | — |
| capped | Body over cap | first cap rows + overflow row | Close keys | `floatDim` overflow row |
| above | No room below | Same, placed above the cursor row | Close keys | Position only |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| `overlay.hunk` | yes | `gitHunk` overlay | Kind, ranges, `oldLines` | Paint nothing |
| `overlay.bufferId` | yes | `gitHunk` overlay | Added lines read from the buffer at `hunk.new` | Paint nothing when the buffer is gone |
| `n/m` | yes | index of `hunk` in `s.git.files[path].hunks` (matched by `new.start`), and its length | `hunk n/m` | Omit ` · hunk n/m` when not found |
| editor anchor | yes | active editor text rect and cursor row, supplied by the shell | Placement rules | Centre in the editor area |
| cap | yes | `lc === "narrow" ? 8 : 12` | Body rows | — |

### Interaction and Focus Contract

- **Activation:** Opened by core (`previewHunk`); the view never opens itself.
- **Keyboard behavior:** Handled by the core gate (`W261005F2A7-DES11`): Esc/`q` close; others close and re-dispatch.
- **Focus behavior:** No cursor inside the float; `cursor()` returns `undefined`.
- **Feedback:** None.
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** §7 Surface: Hunk preview float, Responsive Specification.
- **Token references:** `floatBorder`, `float`, `floatTitle`, `floatDim` (header and overflow), `diffDel`, `diffAdd`.
- **Content overflow:** Lines truncate at the inner width; body capped; height ≤ editor area.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** Read-only float.
- **Accessible name and description:** Title `hunk preview`; header names kind, range, and position.
- **State exposure:** `-`/`+` prefixes carry removed/added in NO_COLOR (`diffAdd`/`diffDel` have no NO_COLOR attribute).
- **Assistive-technology behavior:** Plain text rows.

### Implementation Boundaries

- **Must own:** Layout, placement, header text, capping, painting.
- **Must not own:** Finding the hunk, closing rules, Git calls.
- **Composes:** `drawFrame`.
- **Used by:** `OverlayHost` (registered in `src/ui/shell.ts`).

### Applicable Code Shape

- **Target:** `src/ui/overlays/hunk.ts` — `HunkView` (new)
- **Language and framework:** TypeScript, OpenTUI `Renderable`
- **System-design authority:** `W261005F2A7-DES11`; §6 `Hunk`, `Overlay` `gitHunk`
- **Existing shape:** None — new component

```ts
const KIND_LABEL: Record<HunkKind, string> = {
  add: "added", change: "changed", delete: "deleted below",
  topdelete: "deleted at top", changedelete: "changed + deleted", untracked: "untracked",
};

/** The hunk at the cursor in a float: index lines removed, buffer lines added. */
export class HunkView extends Renderable {
  private s: AppState | undefined;
  private lc: LayoutClass = "wide";
  private box: { x: number; y: number; w: number; h: number } | undefined;

  constructor(
    ctx: RenderContext,
    private readonly anchor: () => { text: { x: number; y: number; w: number; h: number }; cursorY: number } | undefined,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState, lc: LayoutClass): void {
    this.s = s;
    this.lc = lc;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.visible = s.overlay.kind === "gitHunk";
  }

  /** Any cell of the float, which takes no click; a click elsewhere closes it. */
  itemAt(x: number, y: number): MouseTarget | undefined {
    const b = this.box;
    return b && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h ? { kind: "overlay" } : undefined;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    // rows = [header, ...oldLines as "- ", ...buffer lines in hunk.new as "+ "] capped (12 | 8), + overflow row
    // box below anchor.cursorY when it fits in anchor.text, else above; width per the responsive rules
    // drawFrame(buf, theme, box, { border: "floatBorder", fill: "float", title: "hunk preview", footer: "esc / q close" })
  }
}
```

`HunkView` follows `WhichKeyView`: `update` stores state and visibility, `itemAt` answers only inside the float so `OverlayHost.targetAt` turns every other cell into `outside`, which the core mouse gate treats as "close" (`W261005F2A7-DES11`). `anchor` is a shell-supplied callback returning the active editor's text rectangle and cursor screen row, which the float needs for "below the cursor, else above" and for the narrow "spans the editor" width; it is UI wiring only and reads no Git data. Removed lines come from `hunk.oldLines` and added lines from the buffer's `hunk.new` range, so the view computes no diff.

## Component: Git message catalogue

- **Responsibility:** Fix the exact text and level of every Git message-line notice.
- **Requirements:** `W261005F2A7-UREQ3@R1`, `UREQ8@R1`, `UREQ9@R1`, `UREQ10@R1`
- **UI decisions:** `W261005F2A7-UDES3@R1`, `UDES8@R1`, `UDES9@R1`, `UDES10@R1`
- **Accepted mockups:** `W261005F2A7-M1@R3` S6–S10; `W261005F2A7-M3@R3` S7–S16
- **Specification mode:** new
- **Existing contract:** None — new content contract (painter `src/ui/views/cmdline.ts:92-100`; `message()` `src/core/state/result.ts:12-21`)
- **Reuse scope:** feature
- **System contract:** `W261005F2A7-DES4`, `DES5`, `DES8`, `DES9`, `DES11`, `DES13` (the system design's catalogue table follows this one)
- **Success criteria:** `W261005F2A7-US3@R1`, `US8@R1`, `US9@R1`, `US10@R1`
- **Verification:** `W261005F2A7-UV5@R1`, `UV12@R1`, `UV13@R1`, `UV14@R1`

### Anatomy

```text
<text>   one row, no trailing period, workspace-relative paths, " · " joins two facts
```

### Variants and States

| Case | Text | Level | Mockup |
|---|---|---|---|
| Navigate | `hunk n/m` | info | M1 S6 |
| Navigate at end | `no next hunk` / `no previous hunk` | info | M1 S6 |
| No hunk at cursor (stage, reset, preview) | `no hunk at cursor` | info | M1 assumptions |
| Stage | `staged hunk n/m` | info | M1 S7, S9 |
| Stage after save | `"<path>" written · staged hunk n/m` | info | M1 S8 |
| Reset | `reset hunk n/m · buffer changed, autosave pending` | info | M1 S10 |
| Blame committed | `<author>, <relative date> · <summary> (<sha7>)` | info | M3 S7 |
| Blame uncommitted | `not committed yet` | info | M3 S8 |
| Tool missing | `<git.tool[0]> not found (git.tool)` | error | M3 S9 |
| Not a repository | `not a git repository` | info | M3 S10 |
| Conflicted stage | `<path> has conflicts; resolve them in <git.tool[0]>` (`lazygit` by default) | error | M3 S11 |
| Stale index | `index changed; hunks refreshed` | warn | M3 S12 |
| Save failed / blocked before tool | `git tool not started: <path> could not be saved` | error | M3 S13 |
| Git too old (once, startup) | `git <version> is older than 2.31; git features off` | warn | M3 S14 |
| Busy | `git: another operation is running` | info | M3 S15 |
| Before suspend | `"<path>" written · opening <git.tool[0]>`; `N files written · opening <git.tool[0]>` when N > 1 (`lazygit` by default) | info | M3 S16 |

`n/m` is the 1-based position of the acted-on hunk among the file's hunks before the action. Relative date buckets for blame, from `now − time`: `just now` (< 1 minute), `N minute(s) ago` (< 1 hour), `N hour(s) ago` (< 1 day), `N day(s) ago` (< 30 days), `N month(s) ago` (< 365 days), `N year(s) ago`; singular for 1 (e.g. `1 day ago`, `2 days ago`).

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| `<path>` | yes | buffer path | Workspace-relative | — |
| `<author>`, `<summary>` | yes | `BlameLine` | Verbatim | — |
| `<sha7>` | yes | `BlameLine.sha` | First 7 characters | — |
| `<version>` | yes | `git --version` | As reported (e.g. `2.20.1`) | — |
| level | yes | reducer | `info` / `warn` / `error` | `info` |

### Interaction and Focus Contract

- **Activation:** Set by core reducers.
- **Keyboard behavior:** Cleared on the next key (v1).
- **Focus behavior:** None.
- **Feedback:** Is the feedback.
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** Truncated at the terminal width.
- **Token references:** `message`, `messageWarn`, `messageError`.
- **Content overflow:** Truncate (v1); no wrapping.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** Status text.
- **Accessible name and description:** The text.
- **State exposure:** Error bold in NO_COLOR; warn and info plain, distinguished by wording.
- **Assistive-technology behavior:** Read as text.

### Implementation Boundaries

- **Must own:** Exact strings and levels.
- **Must not own:** When each case triggers (system design).
- **Composes:** None.
- **Used by:** Message line, Tool hand-off.

### Applicable Code Shape

None — the strings are a content contract consumed by core reducers that the system design owns; a code shape would restate the table.

## Component: Git theme tokens

- **Responsibility:** Provide every Git visual's token for dark, light, and NO_COLOR.
- **Requirements:** `W261005F2A7-UREQ12@R1`, `UREQ2@R1`
- **UI decisions:** `W261005F2A7-UDES12@R1`
- **Accepted mockups:** `W261005F2A7-M1@R3`, `M2@R3`, `M3@R3`
- **Specification mode:** new
- **Existing contract:** None — new tokens in `TOKENS` (`src/ui/theme.ts:125-240`)
- **Reuse scope:** shared
- **System contract:** `W261005F2A7-DES10` (per-surface token names), `DES13` (`messageWarn`)
- **Success criteria:** `W261005F2A7-US12@R1`, `US2@R1`
- **Verification:** `W261005F2A7-UV18@R1`, `UV3@R1`

### Anatomy

```text
token → [fg palette key, bg palette key, attributes, NO_COLOR attributes]
```

### Variants and States

| Token | fg | bg | attrs | NO_COLOR attrs | Used by |
|---|---|---|---|---|---|
| `gitAdd` | `ok` | `bg` | 0 | 0 | sign `+` |
| `gitChange` | `fn` | `bg` | 0 | 0 | sign `~` |
| `gitDelete` | `error` | `bg` | 0 | 0 | sign `_` |
| `gitTopDelete` | `error` | `bg` | 0 | 0 | sign `‾` |
| `gitChangeDelete` | `fn` | `bg` | 0 | 0 | sign `≃` |
| `gitUntracked` | `fg-muted` | `bg` | 0 | 0 | sign `┆` |
| `statusGitRef` | `mode-visual` | `bg-dark` | 0 | 0 | `⎇ ref` |
| `statusGitOp` | `warn` | `bg-dark` | BOLD | BOLD \| UNDERLINE | `rebasing`, `merging` |
| `statusGitAdd` | `ok` | `bg-dark` | 0 | 0 | `+n` |
| `statusGitChange` | `fn` | `bg-dark` | 0 | 0 | `~n` |
| `statusGitDelete` | `error` | `bg-dark` | 0 | 0 | `-n` |
| `explorerGitModified` | `fn` | `bg-dark` | 0 | 0 | `M` |
| `explorerGitStaged` | `ok` | `bg-dark` | 0 | 0 | `S` |
| `explorerGitUntracked` | `fg-muted` | `bg-dark` | 0 | 0 | `?` |
| `explorerGitConflict` | `error` | `bg-dark` | BOLD | BOLD \| UNDERLINE | `U` |
| `explorerGitContains` | `fg-dim` | `bg-dark` | 0 | DIM | `•` |
| `messageWarn` | `warn` | `bg` | 0 | 0 | warn notices |

The float reuses `diffAdd`, `diffDel`, `float`, `floatDim`, `floatBorder`, `floatTitle` unchanged. Each surface has its own background (`bg` for the gutter, `bg-dark` for statusline and explorer), so tokens are named per surface, following the v1 split (`explorerDirty` vs `statusDirty`); `W261005F2A7-DES10` uses the same names.

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| theme | yes | `themeOf(s)` | dark / light / nocolor | v1 fallback |

### Interaction and Focus Contract

None — tokens have no interaction.

### Responsive and Visual Rules

- **Responsive behavior:** None.
- **Token references:** Above.
- **Content overflow:** None.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** None.
- **Accessible name and description:** None — meaning lives in glyphs.
- **State exposure:** NO_COLOR attributes only add emphasis (conflict, op); glyphs carry kind.
- **Assistive-technology behavior:** None.

### Implementation Boundaries

- **Must own:** Token values.
- **Must not own:** Palette changes (none).
- **Composes:** Existing palette keys.
- **Used by:** All Git components.

### Applicable Code Shape

- **Target:** `src/ui/theme.ts` — `TOKENS`
- **Language and framework:** TypeScript, OpenTUI `TextAttributes`
- **System-design authority:** `W261005F2A7-DES10`
- **Existing shape:** `src/ui/theme.ts:206-207` (`diffAdd`, `diffDel`), `:231-232` (`signReveal`, `signError`)

```ts
  // Git: each sign kind and marker has its own glyph, so colour only adds emphasis.
  gitAdd: ["ok", "bg", 0, 0],
  gitChange: ["fn", "bg", 0, 0],
  gitDelete: ["error", "bg", 0, 0],
  gitTopDelete: ["error", "bg", 0, 0],
  gitChangeDelete: ["fn", "bg", 0, 0],
  gitUntracked: ["fg-muted", "bg", 0, 0],
  statusGitRef: ["mode-visual", "bg-dark", 0, 0],
  statusGitOp: ["warn", "bg-dark", BOLD, BOLD | UNDERLINE],
  statusGitAdd: ["ok", "bg-dark", 0, 0],
  statusGitChange: ["fn", "bg-dark", 0, 0],
  statusGitDelete: ["error", "bg-dark", 0, 0],
  explorerGitModified: ["fn", "bg-dark", 0, 0],
  explorerGitStaged: ["ok", "bg-dark", 0, 0],
  explorerGitUntracked: ["fg-muted", "bg-dark", 0, 0],
  explorerGitConflict: ["error", "bg-dark", BOLD, BOLD | UNDERLINE],
  explorerGitContains: ["fg-dim", "bg-dark", 0, DIM],
  messageWarn: ["warn", "bg", 0, 0],
```

All entries add keys to `TOKENS` and reuse existing palette keys, so no current token or palette value changes; the colours match `ui-mockups/shared/git.css` R3 for dark and light.

# 8. UI Success and Implementation Verification

## UI Success Criteria

### W261005F2A7-US1@R1: Git signs sit in their own leftmost column

- **Requirements:** `W261005F2A7-UREQ1@R1`
- **UI Design:** `W261005F2A7-UDES1@R1`
- **Observable Success:** Inside a repository a changed line renders `+  18 ▕…` with the Git sign in cell 0, unchanged lines have a blank cell 0, a revealed line in a hunk shows both `+` and `▕`, and clicks and the cursor land on the same text columns as before.
- **Detailed Design:** §7 Surface: Editor gutter; Component: Git sign column
- **Mockups:** `W261005F2A7-M1@R3` S1, S2, S14
- **Supported By:** `W261005F2A7-UV1@R1`, `UV2@R1`

### W261005F2A7-US2@R1: Six distinct glyphs in every view and theme

- **Requirements:** `W261005F2A7-UREQ2@R1`, `UREQ12@R1`
- **UI Design:** `W261005F2A7-UDES2@R1`, `UDES12@R1`
- **Observable Success:** Each hunk kind shows its glyph on the right line in live, source, and reading views, in dark, light, and NO_COLOR; block rows show the covered sign; glyphs are one cell wide in target terminals.
- **Detailed Design:** §7 Component: Git sign column; Component: Git theme tokens
- **Mockups:** `W261005F2A7-M1@R3` S1–S5, S13
- **Supported By:** `W261005F2A7-UV3@R1`, `UV4@R1`, `UV16@R1`

### W261005F2A7-US3@R1: Navigation, stage, and reset report and update at once

- **Requirements:** `W261005F2A7-UREQ3@R1`
- **UI Design:** `W261005F2A7-UDES3@R1`
- **Observable Success:** `]h`/`[h`, stage, and reset show the catalogue text; after stage the staged hunk's signs vanish, counts drop, and the marker becomes `S` once no hunks remain.
- **Detailed Design:** §7 Surface: Message line; Component: Git message catalogue
- **Mockups:** `W261005F2A7-M1@R3` S6–S10
- **Supported By:** `W261005F2A7-UV5@R1`, `UV6@R1`

### W261005F2A7-US4@R1: Statusline Git segment

- **Requirements:** `W261005F2A7-UREQ4@R1`
- **UI Design:** `W261005F2A7-UDES4@R1`
- **Observable Success:** The segment reads per the variants table right after the path, hides zero counts, shows no counts for untracked or unborn, and is dropped first under 100 columns.
- **Detailed Design:** §7 Surface: Statusline; Component: Statusline Git segment
- **Mockups:** `W261005F2A7-M1@R3` S1, S7, S9, S11–S14
- **Supported By:** `W261005F2A7-UV7@R1`, `UV16@R1`

### W261005F2A7-US5@R1: Explorer markers

- **Requirements:** `W261005F2A7-UREQ5@R1`
- **UI Design:** `W261005F2A7-UDES5@R1`
- **Observable Success:** Rows show `M S ? U` after the name and `●`, folders `•`; collapsed new folders show only `•`; deleted tracked files add `•` to ancestors and no row; selected and floating explorer rows keep markers; no `D` appears.
- **Detailed Design:** §7 Surface: Explorer rows; Component: Explorer Git marker
- **Mockups:** `W261005F2A7-M2@R3` S1–S6
- **Supported By:** `W261005F2A7-UV8@R1`

### W261005F2A7-US6@R1: Hunk preview float

- **Requirements:** `W261005F2A7-UREQ6@R1`
- **UI Design:** `W261005F2A7-UDES6@R1`
- **Observable Success:** The float shows header, `-`/`+` rows with `diffDel`/`diffAdd`, caps at 12 (8 narrow) with the overflow row, sits below or above the cursor inside the editor area, and closes on Esc, `q`, click outside, or another key; with no hunk it does not open.
- **Detailed Design:** §7 Surface: Hunk preview float; Component: HunkView
- **Mockups:** `W261005F2A7-M3@R3` S1–S4
- **Supported By:** `W261005F2A7-UV9@R1`, `UV10@R1`

### W261005F2A7-US7@R1: Which-key Git groups

- **Requirements:** `W261005F2A7-UREQ7@R1`
- **UI Design:** `W261005F2A7-UDES7@R1`
- **Observable Success:** `Space g` lists `g → Lazygit (full screen)` and `h → +hunk`; `Space g h` lists `b → Blame line`, `p → Preview hunk`, `r → Reset hunk`, `s → Stage hunk`; `]h`/`[h` are absent.
- **Detailed Design:** §7 Surface: Which-key popup
- **Mockups:** `W261005F2A7-M3@R3` S5, S6
- **Supported By:** `W261005F2A7-UV11@R1`

### W261005F2A7-US8@R1: Blame line

- **Requirements:** `W261005F2A7-UREQ8@R1`
- **UI Design:** `W261005F2A7-UDES8@R1`
- **Observable Success:** Blame shows the catalogue format with the relative-date buckets at info level, or `not committed yet` at info level; the editor layout is unchanged.
- **Detailed Design:** §7 Component: Git message catalogue
- **Mockups:** `W261005F2A7-M3@R3` S7, S8
- **Supported By:** `W261005F2A7-UV12@R1`

### W261005F2A7-US9@R1: Git notices

- **Requirements:** `W261005F2A7-UREQ9@R1`
- **UI Design:** `W261005F2A7-UDES9@R1`
- **Observable Success:** Each notice case shows its exact text at its level; warn uses `messageWarn`; tool-missing causes no suspend.
- **Detailed Design:** §7 Surface: Message line; Component: Git message catalogue
- **Mockups:** `W261005F2A7-M3@R3` S9–S15
- **Supported By:** `W261005F2A7-UV13@R1`

### W261005F2A7-US10@R1: Lazygit hand-off

- **Requirements:** `W261005F2A7-UREQ10@R1`
- **UI Design:** `W261005F2A7-UDES10@R1`
- **Observable Success:** With unsaved edits the pre-suspend message is painted once, nothing is painted while suspended, and after exit the same screen (including images) returns with refreshed Git visuals.
- **Detailed Design:** §7 Surface: Tool hand-off
- **Mockups:** `W261005F2A7-M3@R3` S16–S18
- **Supported By:** `W261005F2A7-UV14@R1`, `UV15@R1`

### W261005F2A7-US11@R1: No Git UI outside a repository

- **Requirements:** `W261005F2A7-UREQ11@R1`
- **UI Design:** `W261005F2A7-UDES11@R1`
- **Observable Success:** Outside a repository, with Git missing, or below 2.31, the gutter, statusline, and explorer render exactly as v1.
- **Detailed Design:** §7 Surfaces: Editor gutter, Statusline, Explorer rows (Disabled state)
- **Mockups:** `W261005F2A7-M1@R3` S15; `M2@R3` S7; `M3@R3` S10, S14
- **Supported By:** `W261005F2A7-UV17@R1`

### W261005F2A7-US12@R1: Git tokens in every theme

- **Requirements:** `W261005F2A7-UREQ12@R1`
- **UI Design:** `W261005F2A7-UDES12@R1`
- **Observable Success:** Every Git token resolves in dark, light, and nocolor with the specified palette keys and NO_COLOR attributes, and no pre-existing token's value changes.
- **Detailed Design:** §7 Component: Git theme tokens
- **Mockups:** `W261005F2A7-M1@R3`, `M2@R3`, `M3@R3`
- **Supported By:** `W261005F2A7-UV18@R1`

## Implementation Verifications

### W261005F2A7-UV1@R1: Gutter layout snapshot in a repository

- **Supports:** `W261005F2A7-US1@R1`
- **Level or Method:** UI snapshot (mounted shell, `test/ui/git.test.ts`)
- **Target:** Editor gutter
- **Setup:** 120×36, repository state with an `add` hunk on line 18 and the cursor on line 18 in live view (reveal active); a wrapped long added line.
- **Action:** Render one frame.
- **Assertions:** Row of line 18 starts `+  18 ▕`; an unchanged row starts with a space then the number; the wrapped continuation row has a space in cell 0; text starts one cell later than the no-repo snapshot.
- **Unique Risk:** The Git sign replaces or collides with `▕`, or continuation rows repeat the sign.
- **Expected Evidence:** Snapshot diff in the test run.
- **Status:** Proposed

### W261005F2A7-UV2@R1: Hit-testing and cursor with the wider gutter

- **Supports:** `W261005F2A7-US1@R1`
- **Level or Method:** UI integration (mounted shell, mouse event)
- **Target:** `EditorView` hit-test and cursor placement
- **Setup:** Repository state, 120×36, a line `abcdef` at line 5.
- **Action:** Click the cell showing `c`; read the reported terminal cursor position.
- **Assertions:** Cursor moves to column 2 of line 5; `cursor().x` equals the screen x of `c`.
- **Unique Risk:** `gutterWidth` callers disagree on the `git` flag, so clicks and the cursor land one cell off.
- **Expected Evidence:** Test assertion output.
- **Status:** Proposed

### W261005F2A7-UV3@R1: Every sign kind in every view and theme

- **Supports:** `W261005F2A7-US2@R1`
- **Level or Method:** UI snapshot
- **Target:** Git sign column, tokens
- **Setup:** Buffer whose hunks cover add, change, delete, topdelete, changedelete; a second untracked buffer; themes dark, light, `color = "never"`.
- **Action:** Render in live, source, and reading views for each theme.
- **Assertions:** Cell 0 shows `+ ~ _ ‾ ≃ ┆` on the specified lines in all nine renders; style of each cell equals its `git*` token; nocolor cells carry no colour and the six glyphs differ.
- **Unique Risk:** A view or theme drops or swaps a sign kind.
- **Expected Evidence:** Snapshot set.
- **Status:** Proposed

### W261005F2A7-UV4@R1: Block-replaced row carries the Git sign

- **Supports:** `W261005F2A7-US2@R1`
- **Level or Method:** UI snapshot
- **Target:** Editor gutter in live view
- **Setup:** A mermaid block whose third hidden line changed.
- **Action:** Render live view with the cursor outside the block.
- **Assertions:** The block's rendered first row shows `~` in cell 0 and its v1 sign cell is unchanged.
- **Unique Risk:** Signs on hidden lines disappear when the Git sign uses its own channel.
- **Expected Evidence:** Snapshot.
- **Status:** Proposed

### W261005F2A7-UV5@R1: Navigation, stage, reset, and no-hunk messages

- **Supports:** `W261005F2A7-US3@R1`
- **Level or Method:** Reducer unit (`src/core/state/git.test.ts`)
- **Target:** `gotoHunk`, `stageHunk`/`onGitStaged`, `resetHunk`, `previewHunk`
- **Setup:** State with four hunks; cursor before hunk 2; a dirty-buffer variant; a cursor on a clean line.
- **Action:** Dispatch `]h`, `]h` at the last hunk, `[h` at the first, stage (clean and dirty), reset, and each of stage/reset/preview on a clean line.
- **Assertions:** Messages equal `hunk 2/4`, `no next hunk`, `no previous hunk`, `staged hunk 2/4`, `"projects/so-roadmap.md" written · staged hunk 2/4`, `reset hunk 3/4 · buffer changed, autosave pending`, `no hunk at cursor`; levels are info; cursor unchanged at the ends.
- **Unique Risk:** Wrong or missing wording, or a wrong `n/m`.
- **Expected Evidence:** Test output.
- **Status:** Proposed

### W261005F2A7-UV6@R1: Stage updates every surface in one frame

- **Supports:** `W261005F2A7-US3@R1`
- **Level or Method:** UI integration (mounted shell with a fake Git adapter)
- **Target:** Gutter, statusline, explorer after stage
- **Setup:** `so-roadmap.md` with four hunks, statusline `⎇ main +2 ~2 -3`, explorer `M`.
- **Action:** Stage hunk 2, then stage the rest.
- **Assertions:** After the first stage: no `+` on its lines, statusline `⎇ main ~2 -3`, explorer `M`; after all: no signs, `⎇ main`, explorer `S`.
- **Unique Risk:** One surface updates later than the message or not at all.
- **Expected Evidence:** Frame snapshots.
- **Status:** Proposed

### W261005F2A7-UV7@R1: Statusline segment variants and drop order

- **Supports:** `W261005F2A7-US4@R1`
- **Level or Method:** UI snapshot
- **Target:** Statusline Git segment
- **Setup:** `StatusSegments.git` for branch with counts, clean, detached + rebasing, branch + merging, unborn, untracked active file; widths 120 and 80; a 100-column row with a long path.
- **Action:** Render the statusline.
- **Assertions:** Texts `⎇ main +2 ~2 -3`, `⎇ main`, `⎇ a1b2c3d rebasing +2 ~2 -3`, `⎇ main merging`, `⎇ main`, `⎇ main` appear right after the path; at 80 columns no `⎇`; on the long-path row `⎇` drops before `preview`; `rebasing` styled `statusGitOp` (underline in nocolor).
- **Unique Risk:** Wrong position, zero counts shown, or wrong drop order.
- **Expected Evidence:** Snapshot set.
- **Status:** Proposed

### W261005F2A7-UV8@R1: Explorer marker states

- **Supports:** `W261005F2A7-US5@R1`
- **Level or Method:** UI snapshot
- **Target:** Explorer rows
- **Setup:** Status with staged, modified + dirty buffer, untracked files in a new folder (collapsed and expanded), a conflict (selected), a deleted tracked file under `daily/`; docked at 120×36 and floating at 80×24; nocolor.
- **Action:** Render the explorer.
- **Assertions:** `2026-10-02.md S`, `so-roadmap.md ● M`, `ideas.md ?` (expanded) and `ideas •` (collapsed), selected `linh.md U` in the row's base style, `daily •` and no `2026-10-03.md` row; no `D` anywhere; floating explorer identical markers.
- **Unique Risk:** A marker is mis-ordered with `●`, hidden on selection, or a `D` row appears.
- **Expected Evidence:** Snapshot set.
- **Status:** Proposed

### W261005F2A7-UV9@R1: Hunk float layout

- **Supports:** `W261005F2A7-US6@R1`
- **Level or Method:** UI snapshot
- **Target:** HunkView
- **Setup:** `gitHunk` overlays for a changedelete (3 removed, 1 added) at hunk 3/4, a delete after line 35, a 22-line add, each at 120×36 and 80×24; a cursor near the bottom.
- **Action:** Render.
- **Assertions:** Header `≃ changed + deleted · line 31 · hunk 3/4`; three `- ` rows in `diffDel` then one `+ ` row in `diffAdd`; delete header contains `after line 35`; long hunk shows 12 rows (8 at 80×24) then `… 10 more lines (0 removed, 22 added)` (`… 14 more lines …` at 80×24); footer `esc / q close`; near the bottom the float sits above the cursor row; float never covers the cursor row and stays inside the editor area; at 80×24 its width reaches the editor's right edge.
- **Unique Risk:** Wrong cap, placement, or header text.
- **Expected Evidence:** Snapshot set.
- **Status:** Proposed

### W261005F2A7-UV10@R1: Hunk float dismissal

- **Supports:** `W261005F2A7-US6@R1`
- **Level or Method:** UI integration (keys and mouse through the shell)
- **Target:** HunkView with core gates
- **Setup:** Float open; separately, cursor on a clean line.
- **Action:** Press Esc; reopen and press `q`; reopen and click outside; reopen and click inside; reopen and press `j`; press `Space g h p` on the clean line.
- **Assertions:** Esc, `q`, outside click close it with the cursor unchanged; inside click keeps it open; `j` closes it and moves the cursor down; the clean-line case opens nothing and shows `no hunk at cursor`.
- **Unique Risk:** `itemAt` bounds or the key gate leave the float stuck open or swallow a key.
- **Expected Evidence:** Test output.
- **Status:** Proposed

### W261005F2A7-UV11@R1: Which-key rows

- **Supports:** `W261005F2A7-US7@R1`
- **Level or Method:** Core unit (`whichKeyRows` with production registries)
- **Target:** Which-key popup content
- **Setup:** Registries from `registries()` including `gitCommands`, `gitGroups`.
- **Action:** Open which-key at `<leader>g` and `<leader>gh`.
- **Assertions:** Rows `g Lazygit (full screen)`, `h +hunk`; then `b Blame line`, `p Preview hunk`, `r Reset hunk`, `s Stage hunk`; no `]`/`[` rows.
- **Unique Risk:** Command titles keep a `Git:` prefix or the group label is wrong.
- **Expected Evidence:** Test output.
- **Status:** Proposed

### W261005F2A7-UV12@R1: Blame text and relative dates

- **Supports:** `W261005F2A7-US8@R1`
- **Level or Method:** Reducer unit
- **Target:** `onGitBlamed`, `blameLine`
- **Setup:** `BlameLine` committed with `time` = `now` − 30 s, − 5 min, − 1 h, − 2 days, − 40 days, − 400 days; uncommitted; untracked file; unborn repository.
- **Action:** Dispatch.
- **Assertions:** Texts `hieu, just now · …`, `5 minutes ago`, `1 hour ago`, `2 days ago`, `1 month ago`, `1 year ago`, each `<author>, <date> · <summary> (<sha7>)`; others `not committed yet`; all info level.
- **Unique Risk:** Wrong bucket boundary, plural, or error level for uncommitted lines.
- **Expected Evidence:** Test output.
- **Status:** Proposed

### W261005F2A7-UV13@R1: Notice wording and levels

- **Supports:** `W261005F2A7-US9@R1`
- **Level or Method:** Reducer unit plus one cmdline snapshot
- **Target:** Git message catalogue; message line painter
- **Setup:** Each notice case from the catalogue (tool missing, not a repository, conflicted stage, stale, save failed, blocked buffer, version, busy).
- **Action:** Dispatch the triggering action; render the message line for one warn and one error case in dark and nocolor.
- **Assertions:** Exact text per catalogue; levels error/warn/info as listed; warn row painted with `messageWarn`; tool missing produces no `runTool` suspend effect beyond the `missing` answer.
- **Unique Risk:** Wording drift between the flow and reducer, or warn painted as info.
- **Expected Evidence:** Test output and snapshot.
- **Status:** Proposed

### W261005F2A7-UV14@R1: Hand-off frames

- **Supports:** `W261005F2A7-US10@R1`
- **Level or Method:** UI integration (mounted shell with a fake `ToolHost` and recording renderer)
- **Target:** Tool hand-off
- **Setup:** One dirty buffer; an image widget visible.
- **Action:** `Space g g`; fake tool exits with code 0.
- **Assertions:** The last frame before `suspend()` shows `"projects/so-roadmap.md" written · opening lazygit`; no frame is painted between `suspend()` and `resume()`; the first frame after resume equals the pre-hand-off frame except for refreshed Git visuals and a cleared message line; the image draw is re-issued.
- **Unique Risk:** The pre-suspend message never paints, or the resumed frame differs.
- **Expected Evidence:** Recorded frame list.
- **Status:** Proposed

### W261005F2A7-UV15@R1: Manual hand-off in Ghostty

- **Supports:** `W261005F2A7-US10@R1`
- **Level or Method:** Manual (Ghostty, tui-test monitor sized to the window)
- **Target:** Real lazygit hand-off
- **Setup:** A note with an unsaved edit and an image; lazygit on PATH.
- **Action:** `Space g g`, stage a hunk in lazygit, quit.
- **Assertions:** No so content shows while lazygit runs; on return the same note, cursor, and image show; the staged hunk's signs are gone.
- **Unique Risk:** Real-terminal artefacts (stray mouse modes, missing image) not visible to recorded frames.
- **Expected Evidence:** Written observation in the delivery notes; no recording unless requested.
- **Status:** Proposed

### W261005F2A7-UV16@R1: Glyph width in target terminals

- **Supports:** `W261005F2A7-US2@R1`, `US4@R1`
- **Level or Method:** Manual (Ghostty, kitty, iTerm2, Terminal.app without a Nerd Font)
- **Target:** `+ ~ _ ‾ ≃ ┆`, `•`, `⎇`
- **Setup:** A note showing all six signs, an explorer with `•`, the statusline segment.
- **Action:** Open in each terminal with its default font.
- **Assertions:** Each glyph occupies exactly one cell; line numbers and statusline separators stay aligned.
- **Unique Risk:** A glyph renders double-width or as a fallback box in one terminal.
- **Expected Evidence:** Written observation per terminal.
- **Status:** Proposed

### W261005F2A7-UV17@R1: v1-identical rendering outside a repository

- **Supports:** `W261005F2A7-US11@R1`
- **Level or Method:** UI snapshot (existing v1 snapshots plus Git-off states)
- **Target:** Gutter, statusline, explorer
- **Setup:** `git.repo = null` for: no repository, Git missing, Git 2.20.
- **Action:** Render the existing v1 snapshot scenes.
- **Assertions:** Frames are byte-identical to the pre-change snapshots; no `⎇`, no Git column, no markers.
- **Unique Risk:** The Git column or segment leaks into non-repository rendering.
- **Expected Evidence:** Unchanged v1 snapshot files.
- **Status:** Proposed

### W261005F2A7-UV18@R1: Token table

- **Supports:** `W261005F2A7-US12@R1`
- **Level or Method:** Unit (`src/ui/theme.test.ts`)
- **Target:** Git theme tokens
- **Setup:** `themes.dark`, `themes.light`, `themes.nocolor`; a copy of every pre-existing token's resolved style.
- **Action:** Resolve each Git token and each pre-existing token.
- **Assertions:** Each Git token resolves to its specified palette colours and attributes; nocolor resolves to default colours with the listed NO_COLOR attributes; every pre-existing token equals its copy.
- **Unique Risk:** A missing token falls back silently, or an edit changes an existing token.
- **Expected Evidence:** Test output.
- **Status:** Proposed

## Coverage Balance

- Pure wording and levels are proven by reducer units (`UV5`, `UV12`, `UV13`); layout and colour by mounted-shell snapshots (`UV1`, `UV3`, `UV4`, `UV7`–`UV9`, `UV17`); interaction by integration (`UV2`, `UV6`, `UV10`, `UV14`); real-terminal risks by manual checks (`UV15`, `UV16`).
- These complement, not repeat, the system design's `V44`–`V47`, `V50`, `V60`, `V61`: those prove data and shell mechanics, these prove accepted appearance and wording.
- Every `UV` names one unique risk and exact assertions.

# 9. Finalized UI Design Decisions

### W261005F2A7-UDES1@R1: Dedicated leftmost Git sign column

- **Requirements:** `W261005F2A7-UREQ1@R1`
- **Decision:** Inside a repository each editor row is `[Git sign][line number][space][▕/⚠][text]`; the gutter is one cell wider only then; the Git sign paints on the first screen row of a line or block.
- **Rationale:** A sign next to the text read as Markdown (`18 +- [ ]`); a separate column keeps prose clean and lets Git and reveal/error marks coexist.
- **Mockups:** `W261005F2A7-M1@R3` S1, S2, S14, S15
- **Surfaces or Components:** §7 Surface: Editor gutter; Component: Git sign column
- **Success Criteria:** `W261005F2A7-US1@R1`
- **Tradeoffs:** Text shifts right by one cell inside repositories; rejected: sharing the `▕`/`⚠` cell (collides with text and hides reveal/error marks).

### W261005F2A7-UDES2@R1: One glyph per sign kind

- **Requirements:** `W261005F2A7-UREQ2@R1`
- **Decision:** `+` add, `~` change, `_` delete below, `‾` delete at top, `≃` change + delete, `┆` untracked, in every view.
- **Rationale:** Distinct glyphs keep kinds readable in NO_COLOR and need no Nerd Font.
- **Mockups:** `W261005F2A7-M1@R3` S1–S5, S13
- **Surfaces or Components:** §7 Component: Git sign column
- **Success Criteria:** `W261005F2A7-US2@R1`
- **Tradeoffs:** Busier than LazyVim's single bar; rejected: `▎` bars (kinds differ only by colour).

### W261005F2A7-UDES3@R1: Hunk action feedback wording

- **Requirements:** `W261005F2A7-UREQ3@R1`
- **Decision:** Navigation, stage, reset, and no-hunk cases use the catalogue texts with 1-based `n/m`; a save before stage prefixes `"<path>" written · `.
- **Rationale:** The user always learns which hunk was acted on and that the write happened.
- **Mockups:** `W261005F2A7-M1@R3` S6–S10
- **Surfaces or Components:** §7 Component: Git message catalogue
- **Success Criteria:** `W261005F2A7-US3@R1`
- **Tradeoffs:** Messages clear on the next key (v1), so they are easy to miss after fast typing.

### W261005F2A7-UDES4@R1: Statusline Git segment

- **Requirements:** `W261005F2A7-UREQ4@R1`
- **Decision:** One segment `⎇ <ref> [op] +a ~c -r` right after the path, zero counts hidden, no counts for untracked or unborn, first to drop.
- **Rationale:** Matches LazyVim's at-a-glance facts while yielding space on narrow terminals.
- **Mockups:** `W261005F2A7-M1@R3` S1, S7, S9, S11–S14
- **Surfaces or Components:** §7 Component: Statusline Git segment
- **Success Criteria:** `W261005F2A7-US4@R1`
- **Tradeoffs:** Multi-token segment needs `Seg.parts`; rejected: separate segments per part (adds ` │ ` separators the mockup does not show).

### W261005F2A7-UDES5@R1: Explorer markers `M S ? U •`

- **Requirements:** `W261005F2A7-UREQ5@R1`
- **Decision:** One marker after the name and `●`; folders `•`; deleted tracked files have no row and only mark ancestors; no `D`.
- **Rationale:** The explorer lists disk entries; separating the dirty dot from the Git marker keeps two facts distinct.
- **Mockups:** `W261005F2A7-M2@R3` S1–S6
- **Surfaces or Components:** §7 Component: Explorer Git marker
- **Success Criteria:** `W261005F2A7-US5@R1`
- **Tradeoffs:** A deleted file is only visible as a folder `•` (lazygit shows the rest); rejected: ghost rows and right-aligned markers.

### W261005F2A7-UDES6@R1: Read-only hunk preview float

- **Requirements:** `W261005F2A7-UREQ6@R1`
- **Decision:** `HunkView` float anchored below (else above) the cursor row, header `<glyph> <kind> · <range> · hunk n/m`, `-` then `+` rows, cap 12 (8 narrow) with overflow row, footer `esc / q close`, no action keys.
- **Rationale:** Shows what a change or delete replaced without new modal behaviour.
- **Mockups:** `W261005F2A7-M3@R3` S1–S4
- **Surfaces or Components:** §7 Surface: Hunk preview float; Component: HunkView
- **Success Criteria:** `W261005F2A7-US6@R1`
- **Tradeoffs:** Long hunks need lazygit for full review; rejected: stage/reset keys inside the float.

### W261005F2A7-UDES7@R1: Which-key titles without a `Git:` prefix

- **Requirements:** `W261005F2A7-UREQ7@R1`
- **Decision:** Command titles `Lazygit (full screen)`, `Stage hunk`, `Reset hunk`, `Preview hunk`, `Blame line`; groups `+git`, `+hunk`.
- **Rationale:** Which-key prints titles; the group already says "git".
- **Mockups:** `W261005F2A7-M3@R3` S5, S6
- **Surfaces or Components:** §7 Surface: Which-key popup
- **Success Criteria:** `W261005F2A7-US7@R1`
- **Tradeoffs:** In the command picker the titles lack the `Git:` context; acceptable because ids read `git.*`.

### W261005F2A7-UDES8@R1: Blame as one info line

- **Requirements:** `W261005F2A7-UREQ8@R1`
- **Decision:** `<author>, <relative date> · <summary> (<sha7>)` or `not committed yet`, both info, painted in the single `message` token with the catalogue's relative-date buckets.
- **Rationale:** One row answers "who and why" without moving the layout.
- **Mockups:** `W261005F2A7-M3@R3` S7, S8
- **Surfaces or Components:** §7 Component: Git message catalogue
- **Success Criteria:** `W261005F2A7-US8@R1`
- **Tradeoffs:** The mockup dims author/date and sha; the message line paints one token per notice, so the dim emphasis is not reproduced — UREQ8 requires the format, not the emphasis.

### W261005F2A7-UDES9@R1: Notice wording and three levels

- **Requirements:** `W261005F2A7-UREQ9@R1`
- **Decision:** Catalogue texts; `warn` level (painted `messageWarn`) for the stale index and Git-version notices; `error` for tool missing, conflicted stage, and save-gated failures; blocked and failed saves share one wording.
- **Rationale:** A recoverable race is not an error, and users need one consistent sentence per refusal.
- **Mockups:** `W261005F2A7-M3@R3` S9–S15
- **Surfaces or Components:** §7 Surface: Message line; Component: Git message catalogue
- **Success Criteria:** `W261005F2A7-US9@R1`
- **Tradeoffs:** Adds a message level; warn is plain in NO_COLOR, so it relies on wording there.

### W261005F2A7-UDES10@R1: Hand-off presentation

- **Requirements:** `W261005F2A7-UREQ10@R1`
- **Decision:** When buffers were saved, paint `"<path>" written · opening lazygit` (or `N files written · …`) once before suspending; paint nothing while suspended; on resume repaint the full prior screen, clear the message line, and show refreshed Git visuals.
- **Rationale:** Feels like LazyVim `<leader>gg`, tells the user the save happened, leaves no stray screen state.
- **Mockups:** `W261005F2A7-M3@R3` S16–S18
- **Surfaces or Components:** §7 Surface: Tool hand-off
- **Success Criteria:** `W261005F2A7-US10@R1`
- **Tradeoffs:** The pre-suspend message is visible only briefly.

### W261005F2A7-UDES11@R1: No Git UI outside a repository

- **Requirements:** `W261005F2A7-UREQ11@R1`
- **Decision:** With `git.repo === null`, every surface renders exactly as v1; commands stay bound and answer `not a git repository`.
- **Rationale:** Users without Git see no change.
- **Mockups:** `W261005F2A7-M1@R3` S15; `M2@R3` S7; `M3@R3` S10, S14
- **Surfaces or Components:** §7 Surfaces: Editor gutter, Statusline, Explorer rows
- **Success Criteria:** `W261005F2A7-US11@R1`
- **Tradeoffs:** Which-key still lists Git groups outside a repository.

### W261005F2A7-UDES12@R1: Per-surface Git tokens on existing palette keys

- **Requirements:** `W261005F2A7-UREQ12@R1`
- **Decision:** The token table in §7 Component: Git theme tokens; reuse `diffAdd`/`diffDel` for the float; no existing token or palette value changes.
- **Rationale:** Follows the v1 token shape and per-background split; colours match the accepted mockups.
- **Mockups:** `W261005F2A7-M1@R3`, `M2@R3`, `M3@R3`
- **Surfaces or Components:** §7 Component: Git theme tokens
- **Success Criteria:** `W261005F2A7-US12@R1`
- **Tradeoffs:** Seventeen new tokens instead of the system design's nine presentation defaults.

# 10. Historical Revisions and Acceptance

## Historical Revisions

- **UI Design:** None — first revision
- **Success Criteria:** None — first revision
- **Implementation Verifications:** None — first revision

## Acceptance

- **Accepted mockup revisions:** `W261005F2A7-M1@R3`, `W261005F2A7-M2@R3`, `W261005F2A7-M3@R3`
- **Acceptance evidence:** Accepted by the user on 2026-10-05 (manifest "Acceptance").

## Open Questions and Blockers

None — the system-support conflicts and gaps of the draft (`UDES1@R1`, `UDES3@R1`, `UDES4@R1`, `UDES5@R1`, `UDES7@R1`, `UDES9@R1`, `UDES10@R1`) are covered by `W261005F2A7-REQ4@R3` and `W261005F2A7-DES9`–`DES13`.
