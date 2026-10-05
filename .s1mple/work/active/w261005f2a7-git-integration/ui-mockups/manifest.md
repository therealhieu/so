# UI Mockup Manifest

## Status

`In Review`

## Shared Files

| Revision | Purpose | Path |
|---|---|---|
| R1 | Terminal look and theme tokens: dark, light, NO_COLOR. Copied unchanged from `RM261003ABZP` shared R2. | `shared/terminal.css` |
| R1 | Mockup framework, copied from `RM261003ABZP` shared R2. It adds three render hooks: `st.signs` puts a sign cell in every view and lets a Git sign override `▕`; `o.git` adds the statusline segment, dropped under 100 columns; `r.git` and `r.ghost` add explorer markers. | `shared/term.js` |
| R1 | Sample notes folder and app shell. Copied unchanged from `RM261003ABZP` shared R2. | `shared/content.js` |
| R1 | `git*` tokens for signs, markers, the statusline segment, and the hunk float. In NO_COLOR, meaning comes from glyphs alone. | `shared/git.css` |
| R1 | Git helpers and the interactive Git workspace shared by M1–M3. Helpers: sign variants A/B, the index-vs-buffer hunk model, markers, the hunk float, notices, which-key groups. Samples: a sample repository and a lazygit stand-in. | `shared/git.js` |
| R1 | Hub page linking M1–M3 | `index.html` |

## Mockups

| ID | Parent | Revision | Surface | State | Viewport | Source Evidence | Shared Revision | Status | Path |
|---|---|---|---|---|---|---|---|---|---|
| W261005F2A7-M1 | None | R1 | Editor gutter sign cell; statusline Git segment | S1–S5 sign kinds and views; S6–S10 navigate, stage, reset; S11–S13 detached, rebasing, merging, unborn; S14 narrow; S15 no repository | 120×36, 80×24; dark, light, NO_COLOR | `W261005F2A7-REQ1@R2`, `REQ4@R2`, `REQ5@R2`, `REQ7@R2`, `REQ9@R1`; `DES10`, `DES11`; UI context | R1 | Draft | `m1-editor-git.html` |
| W261005F2A7-M2 | None | R1 | Explorer rows | S1–S6 marker kinds, position, collapsed new folder, dirty + modified, conflict selection, deleted ghost row; S7 narrow float; S8 no repository | 120×36, 80×24; dark, light, NO_COLOR | `W261005F2A7-REQ4@R2`; `DES10`; `RF9`; UI context | R1 | Draft | `m2-explorer-git.html` |
| W261005F2A7-M3 | None | R1 | Hunk preview float; which-key `+git`/`+hunk`; message-line blame and notices; lazygit hand-off | S1–S4 preview (change + delete, delete, long, narrow); S5–S6 which-key; S7–S8 blame; S9–S15 notices; S16–S18 save → lazygit → resume | 120×36, 80×24; dark, light, NO_COLOR | `W261005F2A7-REQ1@R2`, `REQ2@R2`, `REQ3@R1`, `REQ4@R2`, `REQ7@R2`, `REQ8@R1`; `DES8`, `DES9`, `DES11`; `RF13` | R1 | Draft | `m3-git-floats-notices.html` |

## Accepted Decisions

- None

## Assumptions

- **Sign variants:** variant A (`+ ~ _ ‾ ≃ ┆`) is the system-design default. Variant B uses LazyVim-like bars without a Nerd Font (`▎ ▁ ▔`), so `add`, `change`, `changedelete`, and `untracked` share `▎` and differ only by colour.
- **Statusline segment:** the format is `⎇ <ref> [op] +a ~c -r`. It sits after the path, and zero counts are hidden. `⎇` (U+2387) renders single-width without a Nerd Font.
- **Explorer markers:** the letters are `M S ? D U`, with `•` for "contains". A marker sits one cell after the name and after `●` when the file is unsaved.
- **Untracked and unborn files:** no counts in the statusline.
- **Deleted tracked files:** shown as struck-through ghost rows at their old position.
- **Hunk float position:** opens below the cursor line, or above it when there is no room. The diff body is capped at 12 lines (8 under 100 columns), followed by an `… N more lines` row. Only Esc, `q`, or a click outside closes it; the float offers no stage or reset keys of its own.
- **Notice wording:** follows the system design. Additions for the mockup: `no hunk at cursor`, `no next hunk`/`no previous hunk`, `hunk n/m`, `staged hunk n/m`, `reset hunk n/m`, and `<path> has conflicts; resolve them in lazygit`.
- **Blame:** the sample author, date, and commit are mockup data.
- **lazygit screen:** a stand-in drawing. so draws nothing while it is suspended.

## Feedback Ledger

| Cycle | Feedback | Mockups Before | Mockups After | Shared Before | Shared After | Accepted Decision |
|---|---|---|---|---|---|---|

## Acceptance

- **Accepted revisions:** None
- **Evidence:** None

## Open Items

- **Sign style:** choose variant A (symbols) or B (bars). B fails the NO_COLOR rule unless its glyphs are differentiated.
- **Explorer marker position:** after the name (M2 S1) or right-aligned (M2 S2).
- **Deleted tracked files:** keep ghost rows (M2 S6), or mark only the parent folder `•`. Ghost rows need explorer rows that come from Git status as well as the filesystem, so they have a system impact.
- **Hunk float:** confirm the line cap, and that it has no stage or reset keys inside.
- **Statusline segment:** confirm its position after the path and the `⎇` glyph.
- **Block-replace sign inheritance:** a sign on a hidden line inside a mermaid or math block moves to that block's rendered row (DES10). The mockups do not show this.
