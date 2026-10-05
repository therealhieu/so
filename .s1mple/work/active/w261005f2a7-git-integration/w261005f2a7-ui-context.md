# UI Context

## Status

`Ready`

## User Input

`continue the /s1mple-discuss … i am thinking about lazygit and git integration in nvim/lazyvim` — then self-drive delegated by the user on 2026-10-05 for the system design and for this UI discussion.

## Project and UI Baseline

- **Project guidance:** `.s1mple/S1MPLE.md`
- **Project context:** `.s1mple/docs/project.md`
- **Relevant surfaces:** editor gutter sign cell, statusline, explorer rows, message line (notices), a new floating overlay for hunk preview, and the which-key popup for the new `<leader>g` / `<leader>gh` groups.
- **Existing UI patterns:**
  - **Floats:** drawn with `drawFrame`/`centered` (`src/ui/overlays/host.ts:14-50`).
  - **Statusline:** segments drop by priority on narrow terminals (`src/ui/views/statusline.ts:129-139`).
  - **Explorer:** rows are `indent + icon + name + " ●"` for dirty buffers (`src/ui/views/explorer.ts:299-315`).
  - **Notices:** last-row message line (`src/ui/views/cmdline.ts:92-100`), cleared on the next key (`src/core/state/update.ts:133`).
  - **Toasts:** float notices that expire after 3 s (`src/core/state/result.ts:33-53`).
- **Existing design system:**
  - **Theme tokens:** semantic, as `token → [fg, bg, attributes, NO_COLOR attributes]` (`src/ui/theme.ts:125`). Dark and light palettes (`src/ui/theme.ts:64`, `:117`). `color = "never"` maps to the `nocolor` theme (`src/ui/theme.ts:296-299`). The rule "carry meaning without colour" holds for headings, callouts, and Bases lanes (`src/ui/theme.ts:209-210`, `:235`).
  - **Existing diff tokens:** `diffAdd`, `diffDel` (`src/ui/theme.ts:206-207`). Sign tokens: `signReveal`, `signError` (`src/ui/theme.ts:231-232`).
  - **Accepted v1 UI design:** `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-ui-design.md`.
  - **v1 mockup framework:** `.s1mple/work/done/rm261003abzp-so-v1/ui-mockups/shared/{terminal.css,term.js,content.js}` (terminal grid, dark/light/NO_COLOR tokens, statusline, floats, explorer helpers).

## Current Experience

so shows no Git information. The gutter has a line-number column and one sign cell that today shows only `▕` (revealed source) and `⚠` (block render error) in live view (`src/core/lang/markdown/live-preview.ts:86-141`).

```text
statusline  [view]  [path]  [saveError]  [deletedOnDisk]  [jump]  [backlinks]  [words]  [preview]  [index]
```

The statusline carries the segments above in this order (`src/ui/views/statusline.ts:89-140`). On terminals under 100 columns, `preview`, `words`, and `view` drop first (`src/ui/shell.ts:53-54`, `src/ui/views/statusline.ts:129-139`).

Explorer rows show a file-type icon, the name, and `●` for unsaved buffers. Notices appear on the bottom message line. The user must leave so for any Git action and opens lazygit in another terminal.

## Desired Outcome

LazyVim-like Git awareness inside so, readable at a glance in colour and without colour:

- Each changed line has a distinct gutter sign by kind: added, changed, deleted below, deleted at top, changed + deleted, untracked.
- The statusline shows the branch, or a detached SHA, an unborn branch name, and rebasing/merging, plus line counts.
- Explorer marks modified, staged, untracked, deleted, and conflicted files, and folders show that they contain changes.
- A hunk preview float shows what a hunk replaced.
- Blame and every Git notice read clearly on the message line.
- `<leader>gg` hands off to lazygit full screen and comes back unchanged.

## Affected UI

- **Surface:** Editor gutter sign cell
  - **Current role:** A one-cell column after line numbers. The last decoration's sign wins.
  - **Affected code:** `src/ui/editors/text-view.ts:540-557` (`gutter`); `src/core/kernel/view/text-view.ts:98-101` (merge rule)
  - **Expected impact:** Six new sign kinds with glyph and token. Git signs override `▕`/`⚠` on the same line (`W261005F2A7-DES10`).
- **Surface:** Statusline
  - **Current role:** Mode badge, segments, Ln:Col.
  - **Affected code:** `src/ui/views/statusline.ts:89-140`; `src/core/state/status.ts:12-32`
  - **Expected impact:** A new Git segment (`ref`, `op`, counts), dropped first when narrow (`W261005F2A7-DES10`).
- **Surface:** Explorer rows
  - **Current role:** Tree of workspace files.
  - **Affected code:** `src/ui/views/explorer.ts:273-315`
  - **Expected impact:** A one-cell status marker after the name and dirty dot, plus folder "contains changes" (`W261005F2A7-DES10`).
- **Surface:** Hunk preview float (new)
  - **Current role:** None.
  - **Affected code:** proposed `src/ui/overlays/hunk.ts`; `src/ui/overlays/host.ts:14-50`
  - **Expected impact:** A new float showing index lines (removed) and buffer lines (added). It closes on Esc, `q`, or a click outside (`W261005F2A7-DES11`).
- **Surface:** Message line notices and blame
  - **Current role:** Info and error messages.
  - **Affected code:** `src/ui/views/cmdline.ts:92-100`; `src/core/state/result.ts:12-21`
  - **Expected impact:** Wording for blame, tool missing, not a repository, save-gated failures, stale stage, conflicted stage, and the Git version notice (`W261005F2A7-REQ3@R1`, `REQ4@R2`, `REQ8@R1`, `REQ9@R1`, `REQ1@R2`, `REQ7@R2`).
- **Surface:** Which-key popup
  - **Current role:** Lists leader groups and commands.
  - **Affected code:** `src/core/state/whichkey.ts:115-138`; `src/core/kernel/commands/defaults.ts:48-55`
  - **Expected impact:** New `+git` and `+hunk` groups with command titles (`W261005F2A7-DES11`).
- **Surface:** Tool hand-off
  - **Current role:** None.
  - **Affected code:** `src/ui/shell.ts:85-92`, `:189-203`
  - **Expected impact:** A full-screen switch to lazygit and back. so shows no screen of its own during the switch (`W261005F2A7-REQ2@R2`).

## Constraints

- The sign cell is exactly one terminal cell wide (`src/ui/editors/text-view.ts:549-556`). The gutter width stays unchanged (`W261005F2A7-DES10`).
- Meaning must survive `color = "never"` and `NO_COLOR` (`src/ui/theme.ts:125`, `:290-299`). Sign kinds and markers therefore need distinct glyphs, not only colours.
- Glyphs must be single-width in common terminal fonts (Ghostty, kitty, iTerm2, Terminal.app) without requiring a Nerd Font. v1 file icons have a text fallback set (`src/ui/views/explorer.ts:280-282`).
- The statusline must yield to higher-priority segments under 100 columns (`src/ui/shell.ts:53-54`).
- The message line is one row. Long notices are truncated by the existing painter (`src/ui/views/cmdline.ts:92-100`).
- No visual change outside a repository (`W261005F2A7-DES10` invariant).
- Mockups must follow the v1 mockup framework and theme tokens for consistency.

## Evidence

- One sign cell per row; text starts after it — `src/ui/editors/text-view.ts:540-557`
- Later providers' signs win — `src/core/kernel/view/text-view.ts:98-101`
- Reveal and error signs in live view — `src/core/lang/markdown/live-preview.ts:86-141`
- Theme token shape with NO_COLOR attributes — `src/ui/theme.ts:125`
- Diff tokens exist — `src/ui/theme.ts:206-207`
- Dirty marker in explorer — `src/ui/views/explorer.ts:315`, `src/ui/theme.ts:172`
- Statusline drop order — `src/ui/views/statusline.ts:129-139`
- Message line painter — `src/ui/views/cmdline.ts:92-100`
- Float frame helpers — `src/ui/overlays/host.ts:14-50`
- Placeholder glyphs `+ ~ _ ‾ ≃ ┆` and markers in the system design, marked as presentation defaults — `w261005f2a7-system-design.md` §7 `src/core/features/git/signs.ts`, §9 DES10
- LazyVim's gitsigns glyphs (`▎` add/change/changedelete/untracked, triangle delete) rely on colour plus a Nerd Font — `w261005f2a7-research.md` RF1

## Assumptions

- Users mostly run with colour. NO_COLOR must remain readable but need not be as pretty.
- Notes are prose, so the gutter signs must stay quiet and must not distract from reading.
- The v1 statusline and explorer visual language (`rm261003abzp-ui-design.md`) remains the authority. This work adds to it without restyling.

## Unknowns

- Whether bar-style signs (LazyVim `▎`) or symbol-style signs (`+ ~ _`) read better in prose notes, with and without colour.
- The exact Git segment format and position relative to `path` and `backlinks`.
- Explorer marker glyphs and position: after the name, or right-aligned.
- The hunk float's layout: header content, size limits for long hunks, and whether it offers stage/reset keys.
- The blame line format and relative-date wording.

## Likely Mockup Scope

- Editor with each sign kind, in dark, light, and NO_COLOR, at 120×36 and 80×24.
- Statusline Git segment states: branch with counts, detached plus rebasing, unborn, narrow drop.
- Explorer with markers, including a nested untracked folder, a conflict, and staged versus modified.
- The hunk preview float for change, delete, and a long hunk.
- Message-line notices and blame, plus the which-key `+git` / `+hunk` popup.

## Non-UI Blockers

- None

## Sources

- `src/ui/editors/text-view.ts:540-557`
- `src/core/kernel/view/text-view.ts:98-101`
- `src/core/lang/markdown/live-preview.ts:86-141`
- `src/ui/theme.ts:64`, `:117`, `:125`, `:172`, `:206-207`, `:231-232`, `:290-299`
- `src/ui/views/statusline.ts:89-140`
- `src/ui/views/explorer.ts:273-315`
- `src/ui/views/cmdline.ts:92-100`
- `src/ui/overlays/host.ts:14-50`
- `src/core/state/whichkey.ts:115-138`
- `src/ui/shell.ts:53-54`, `:85-92`, `:189-203`
- `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-ui-design.md`
- `.s1mple/work/done/rm261003abzp-so-v1/ui-mockups/shared/`
- `w261005f2a7-system-design.md` §7, §9
- `w261005f2a7-research.md` RF1
