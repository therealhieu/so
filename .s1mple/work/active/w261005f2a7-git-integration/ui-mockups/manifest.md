# UI Mockup Manifest

## Status

`In Review`

## Shared Files

| Revision | Purpose | Path |
|---|---|---|
| R1 | Terminal look and theme tokens: dark, light, NO_COLOR. Copied unchanged from `RM261003ABZP` shared R2. | `shared/terminal.css` |
| R2 | Mockup framework, copied from `RM261003ABZP` shared R2. It adds three render hooks: `st.signs` puts a sign cell in every view and lets a Git sign override `▕`; `o.git` adds the statusline segment, dropped under 100 columns; `r.git` adds explorer markers. | `shared/term.js` |
| R1 | Sample notes folder and app shell. Copied unchanged from `RM261003ABZP` shared R2. | `shared/content.js` |
| R2 | `git*` tokens for signs, markers, the statusline segment, and the hunk float. In NO_COLOR, meaning comes from glyphs alone. | `shared/git.css` |
| R2 | Git helpers and the interactive Git workspace shared by M1–M3. Helpers: sign glyphs, the index-vs-buffer hunk model, markers, the hunk float, notices, which-key groups. Samples: a sample repository and a lazygit stand-in. | `shared/git.js` |
| R2 | Hub page linking M1–M3 | `index.html` |

## Mockups

| ID | Parent | Revision | Surface | State | Viewport | Source Evidence | Shared Revision | Status | Path |
|---|---|---|---|---|---|---|---|---|---|
| W261005F2A7-M1 | None | R2 | Editor gutter sign cell; statusline Git segment | S1–S5 sign kinds and views; S6–S10 navigate, stage, reset; S11–S13 detached, rebasing, merging, unborn; S14 narrow; S15 no repository | 120×36, 80×24; dark, light, NO_COLOR | `W261005F2A7-REQ1@R2`, `REQ4@R2`, `REQ5@R2`, `REQ7@R2`, `REQ9@R1`; `DES10`, `DES11`; UI context | R2 | Draft | `m1-editor-git.html` |
| W261005F2A7-M2 | None | R2 | Explorer rows | S1–S5 marker kinds, collapsed new folder, dirty + modified, conflict selection, deleted tracked file (no row, folder `•`); S6 narrow float; S7 no repository | 120×36, 80×24; dark, light, NO_COLOR | `W261005F2A7-REQ4@R2`; `DES10`; `RF9`; UI context | R2 | Draft | `m2-explorer-git.html` |
| W261005F2A7-M3 | None | R2 | Hunk preview float; which-key `+git`/`+hunk`; message-line blame and notices; lazygit hand-off | S1–S4 preview (change + delete, delete, long, narrow); S5–S6 which-key; S7–S8 blame; S9–S15 notices; S16–S18 save → lazygit → resume | 120×36, 80×24; dark, light, NO_COLOR | `W261005F2A7-REQ1@R2`, `REQ2@R2`, `REQ3@R1`, `REQ4@R2`, `REQ7@R2`, `REQ8@R1`; `DES8`, `DES9`, `DES11`; `RF13` | R2 | Draft | `m3-git-floats-notices.html` |

## Accepted Decisions

- **Sign glyphs:** one glyph per kind: `+` add, `~` change, `_` delete below, `‾` delete at top, `≃` change + delete, `┆` untracked. Bar signs (`▎`) are rejected because several kinds share one glyph and differ only by colour, which breaks the NO_COLOR rule (`src/ui/theme.ts:209-210`). Shown in M1.
- **Explorer marker position:** one cell right after the name, after `●` when the file is unsaved. Shown in M2 S1 and S3.
- **Deleted tracked files:** no explorer row, because the explorer lists disk entries only; ancestor folders show `•`. Shown in M2 S5.
- **Hunk float:** the diff body is capped at 12 lines (8 at 80×24), followed by an `… N more lines` row. The float has no stage or reset keys; its footer lists only `esc / q close`, and a click outside also closes it. Shown in M3 S1–S4.
- **Statusline segment:** `⎇ <ref> [op] +a ~c -r`, placed right after the path. Shown in M1 S1 and S11–S13.
- **Busy notice:** a second Git command while one is pending reads `git: another operation is running`. Shown in M3 S15.

## Assumptions

- **Statusline segment:** the format is `⎇ <ref> [op] +a ~c -r`. It sits after the path, and zero counts are hidden. `⎇` (U+2387) renders single-width without a Nerd Font.
- **Explorer markers:** the letters are `M S ? D U`, with `•` for "contains".
- **Untracked and unborn files:** no counts in the statusline.
- **Hunk float position:** opens below the cursor line, or above it when there is no room.
- **Notice wording:** follows the system design. Additions for the mockup: `no hunk at cursor`, `no next hunk`/`no previous hunk`, `hunk n/m`, `staged hunk n/m`, `reset hunk n/m`, and `<path> has conflicts; resolve them in lazygit`.
- **Blame:** the sample author, date, and commit are mockup data.
- **lazygit screen:** a stand-in drawing. so draws nothing while it is suspended.

## Feedback Ledger

| Cycle | Feedback | Mockups Before | Mockups After | Shared Before | Shared After | Accepted Decision |
|---|---|---|---|---|---|---|
| 1 | Self-drive review decisions (delegated by the user on 2026-10-05): (1) adopt sign variant A only; remove the variant-B control and states, because B's shared `▎` breaks the NO_COLOR rule (`src/ui/theme.ts:209-210`). (2) Keep explorer markers right after the name (after `●`); remove the right-aligned control and state. (3) Remove struck-through ghost rows; a deleted tracked file shows no row and its ancestor folders show `•`. (4) Keep the hunk float's 12-line cap (8 at 80×24) and no stage/reset keys inside it; the footer lists only Esc / q. (5) Keep the statusline segment after the path with `⎇`; confirm consistency only. (6) Replace the `busy` notice with `git: another operation is running`. | M1 R1, M2 R1, M3 R1 | M1 R2, M2 R2 (states renumbered S1–S7), M3 R2 | `term.js` R1, `git.css` R1, `git.js` R1, `index.html` R1 | `term.js` R2, `git.css` R2, `git.js` R2, `index.html` R2 | Sign glyphs; explorer marker position; deleted tracked files; hunk float; statusline segment; busy notice |

## Acceptance

- **Accepted revisions:** None
- **Evidence:** None

## Open Items

- **`D` explorer marker:** with no rows for deleted files, `D` never renders in the explorer. Reconcile DES10's marker set and precedence with the system design.
- **Block-replace sign inheritance:** a sign on a hidden line inside a mermaid or math block moves to that block's rendered row (DES10). The mockups do not show this.
