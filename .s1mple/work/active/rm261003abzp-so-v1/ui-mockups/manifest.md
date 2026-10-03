# UI Mockup Manifest

## Status

`Draft` — edit cycle 3 revised RM261003ABZP-M1 and RM261003ABZP-M3 to R2 and the shared files to R2; they await the user's review. The other mockups keep their accepted revisions (see Acceptance).

## Shared Files

| Revision | Purpose | Path |
|---|---|---|
| R2 | Review page shell, terminal grid, the dark/light/NO_COLOR theme tokens, chrome (bufferline, statusline, floats, toasts), the Bases/diff/selection styles, icons for text and binary files, and the review-only extension-point caption note (AD5) | `shared/terminal.css` |
| R2 | Mockup framework (`Mock.create` with a per-mockup revision label, state list, keyboard routing, leader + which-key, toasts), UI helpers (explorer with text/binary file icons, picker, float, statusline), Markdown model + live-preview renderer (reveal, callouts, tables, code, embeds, image tiers, math, Mermaid), and non-Markdown source lines coloured by a highlighter per language (TypeScript, YAML, plain) | `shared/term.js` |
| R2 | Sample notes folder (tree, notes, embeds), a tree with every file type and sample non-Markdown files (`scripts/sync.ts`, `scripts/crontab`, `config.yaml`), the app-shell layout `Mock.shell`, backlinks/outline panels, and a shared minimal vim interaction `Mock.vim` | `shared/content.js` |
| R2 | Review hub linking M1–M7, with review instructions, the cross-mockup keymap, open items, and the extension-point note | `index.html` |

## Mockups

| ID | Parent | Revision | Surface | State | Viewport | Source Evidence | Shared Revision | Status | Path |
|---|---|---|---|---|---|---|---|---|---|
| RM261003ABZP-M1 | `None` | R2 | `Application shell` | `S1–S19: startup indexing; Normal, Insert, Visual, V-line, Command-line; split; explorer hidden or focused; backlinks and outline panels; 80×24; notifications; save failed; scripts/sync.ts in source view with TypeScript colouring; plain-text fallback (scripts/crontab); refused binary file; refused file over 16 MiB; non-Markdown file at 80×24` | `120×36, 80×24` | `RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-DES2@R2, RM261003ABZP-DES7@R2, RM261003ABZP-DES8@R1, RM261003ABZP-DES10@R1, RM261003ABZP-DES14@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1, rm261003abzp-ui-context.md@R1 (Application shell)` | R2 | `Draft` | `m1-app-shell.html` |
| RM261003ABZP-M2 | `None` | R1 | `Editor live preview` | `S1–S16: cursor-line and block reveal (inline line, table, callout, code, frontmatter); source and reading modes; tasks; folded callout; embed; images as kitty, Unicode blocks, or off; math and Mermaid` | `120×36, 80×24` | `RM261003ABZP-REQ5@R2, RM261003ABZP-REQ4@R3, RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES14@R1, rm261003abzp-ui-context.md@R1 (Editor rendering)` | R1 | `Accepted` | `m2-live-preview.html` |
| RM261003ABZP-M3 | `None` | R2 | `Overlays` | `S1–S21: which-key root and +notes; file picker (empty, fuzzy query) over every file type; grep; headings; tags with counts; backlinks; recent; command palette; ':' line with completion; [[ completion for notes, #headings, and #^blocks; keymap help with overrides and [markdown] scope labels; picker at 80×24; files picker 'sync' with a TypeScript preview; which-key, command palette, and keymap help in a .ts buffer; ':link.follow' in a .ts buffer → not available for typescript files` | `120×36, 80×24` | `RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-DES5@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES17@R1, rm261003abzp-ui-context.md@R1 (Overlays)` | R2 | `Draft` | `m3-overlays.html` |
| RM261003ABZP-M4 | `None` | R1 | `Links and files` | `S1–S18: cursor on a link; after gd; heading link; :jumps; unresolved-link create prompt; backlinks panel (linked and unlinked); link an unlinked mention; rename preview and "12 files updated"; explorer create, rename, and move; delete to Trash; typed-confirmation fallback; conflict prompt; diff; reload with undo; 80×24` | `120×36, 80×24` | `RM261003ABZP-REQ1@R2, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ3@R3, RM261003ABZP-DES7@R2, RM261003ABZP-DES8@R1, rm261003abzp-ui-context.md@R1 (Links and files)` | R1 | `Accepted` | `m4-links-files.html` |
| RM261003ABZP-M5 | `None` | R2 | `Daily notes and templates` | `S1–S14: :Today before and after; :Yesterday; :Tomorrow creating 10-04; calendar picker (current and previous month); template picker showing source and expanded; literal unsupported tokens; template inserted; new note title, template choice, and result; subfolder date format; calendar at 80×24` | `120×36, 80×24` | `RM261003ABZP-REQ6@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-DES11@R1, RM261003ABZP-DES14@R1, rm261003abzp-ui-context.md@R1 (Daily notes and templates)` | R1 | `Accepted` | `m5-daily-templates.html` |
| RM261003ABZP-M6 | `None` | R1 | `Bases views` | `S1–S16: grouped and sorted table with summary and diagnostics; edit text, number, date, and list cells; toggle a checkbox; sort descending and ungrouped; Kanban by status; card move with frontmatter diff; move to None; moves disabled for formula grouping; view switcher; cards opened as a table with a notice; embedded ![[tasks.base#Board]]; table and board at 80×24` | `120×36, 80×24` | `RM261003ABZP-REQ7@R2, RM261003ABZP-REQ5@R2, RM261003ABZP-DES12@R1, rm261003abzp-ui-context.md@R1 (Bases views)` | R1 | `Accepted` | `m6-bases.html` |
| RM261003ABZP-M7 | `None` | R1 | `Browser preview page` | `S1–S10: live tour note; follows a note switch; clicked wikilink with a "follow so" banner; dark and light; simulated incoming edit; reconnecting; stopped; offline fallback; 375 px` | `1200 px, 375 px` | `RM261003ABZP-REQ8@R2, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ9@R2, RM261003ABZP-DES13@R2, rm261003abzp-ui-context.md@R1 (Browser preview page)` | R1 | `Accepted` | `m7-web-preview.html` |

The Source Evidence column records the REQ/DES/context revisions each mockup was accepted against; the current baseline is in `rm261003abzp-ui-requirements.md` and `rm261003abzp-ui-design.md`. Every state is reachable from the mockup's state list. Each state shows a caption and the exact REQ/DES it traces to. All terminal mockups switch between 120×36 and 80×24 and between the dark, light, and NO_COLOR themes. M7 switches between desktop and 375 px. M2 and M4–M7 load shared R2 but keep Shared Revision R1: R2 only adds to the shared files (text and binary file icons, non-Markdown source lines, the caption note style, sample files, a mixed-type tree, a revision label that defaults to R1), and their rendering is unchanged, so their revisions and acceptance stand.

## Accepted Decisions

- **AD1** — Help opens with `<leader>?` or `:help`; `?` stays vim backward search (RM261003ABZP-REQ3@R3).
- **AD2** — Config key is `[daily] format` per DES14@R1 (edit cycle 1).
- **AD3** — Leader groups, extra keys, visual language, and behaviour details listed under Assumptions are accepted as the v1 UI baseline.
- **AD4** — Non-Markdown text files reuse accepted visuals; no mockup or shared revision changes (cycle 2). Source view paints like M2 source mode, with syntax colouring when the language is recognized. The statusline (M1) shows `source` in the view segment and hides the backlinks and words segments. Refused files (`binary file — not opened`, `file too large — not opened (limit 16 MiB)`) and `not available for <type> files` use the M1 S6 message line. The files picker, grep, palette, `:` completion, which-key, and help keep their M3 layouts: they list all files and only the commands and keys available for the active file type, and help labels file-type-scoped bindings. Explorer `a` adds `.md` only when the name has no extension (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-DES17@R1). Cycle 3 draws these states in RM261003ABZP-M1@R2 and RM261003ABZP-M3@R2 (AD5); the reused visuals above are unchanged.
- **AD5** — The mockups draw the AD4 states and leave visible room for later file types, marked only as review notes (user decision "States + extension points (Recommended)", cycle 3). A caption block labelled "Extension point" names each generic area later features plug into: the sign column (▕ and ⚠ today; later markers such as diagnostics) in M1 S2; window content by editor kind (text view, Bases view) in M1 S7; the generic text view with decoration providers (Markdown live preview, a language highlighter) and statusline segments chosen by file type in M1 S15; and commands and keys scoped by file type across which-key, the palette, `:` completion, and help in M3 S19. The terminal grid never draws future features (diagnostics, language servers, notebooks, plugins). Non-Markdown text files use the `≡` glyph in the explorer and the files picker; the message names the file type id, e.g. `not available for typescript files` (ui-design flow "Open a non-Markdown file"). In a Markdown buffer, help labels file-type-scoped bindings `[markdown]` (`md` at 80×24); in other file types those bindings are hidden (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-DES17@R1).

## Assumptions

- **Leader map (LazyVim style):**
  - `e` explorer, `o` outline, `m` mode cycle, `x` task toggle, `:` palette, `?` help.
  - Groups: `f` find, `s` search, `n` notes (`nd`, `np`, `nt`, `nn`), `l` links, `b` buffer, `w` window, `u` ui toggles.
  - The backlinks panel is `<leader>lb`, not `<leader>b`, because `b` is LazyVim's buffer group.
  - UI toggles live under `u` because REQ5@R2 fixes `<leader>x` as the task toggle.
  - Help is `<leader>?` (LazyVim) plus `:help`.
- **`:` command line:** one line serves both ex commands (REQ2@R2) and every named command id, with a completion list. This is how M3 meets REQ3@R3's "palette (`<leader>:` and `:`) … with completion". The full-screen palette is `<leader>:` and `<leader>sc`.
- **Extra keys:**
  - `Enter` on a link follows it and on a task toggles it.
  - `za` folds callouts and expands embeds.
  - `:jumps` lists the jump history.
  - In the backlinks panel, `l` links an unlinked mention.
  - Explorer `a`/`r`/`m`/`d` follow neo-tree.
  - In the calendar, `H`/`L` change month and `t` jumps to today.
  - In Bases, `i` edits a cell, `x` toggles a checkbox, `s` sorts, `g` toggles grouping, `f` toggles the filter, `H`/`L` move a card, `v`/`Tab`/`1–4` switch views, and `Ctrl-a`/`Ctrl-x` step numbers and dates.
- **Visual language:**
  - Tokyonight-like dark default with a light variant.
  - Headings use █▊▌▏ prefixes with bands.
  - Tasks use ☐/☑; the sign column marks revealed lines with ▕; the Mermaid text view uses box-drawing characters.
  - Under NO_COLOR, state shows through bold, underline, reverse video, and glyphs.
- **Behaviour details:**
  - Rename and move show their impact ("31 links in 12 files") before Enter.
  - The conflict prompt pauses autosave for that note.
  - Moving a card into `None` removes the property.
  - The calendar week starts on Monday.
  - `:Yesterday` and `:Tomorrow` are relative to the open daily note.
  - Missing daily notes are created from the daily template, also from `:Tomorrow` and the date picker.
  - On narrow terminals the side panel is hidden and backlinks open as a picker.
- **Browser preview page:**
  - Uses system fonts and GitHub-like Markdown styling.
  - The page has a light/dark toggle that defaults to the OS setting.
  - A "follow so again" banner appears after the reader clicks a wikilink.
  - An offline copy is shown when so is not running.
  - The mockup draws math with MathML and the diagram with inline SVG so it stays offline; the product uses KaTeX and Mermaid as REQ8@R2 states.
- **Mockup clock and data:** Saturday 2026-10-03 08:12; a sample `~/notes` folder with 10,000 notes implied for the counts.
- **Accessibility:**
  - Every view is keyboard first, and the terminal region has `role="application"` and a label.
  - Captions use `aria-live`.
  - NO_COLOR, light, and 80×24 variants are available everywhere.
  - Mouse clicks on the tree, buffers, view tabs, and preview links are optional extras (DES10@R2).

## Feedback Ledger

| Cycle | Feedback | Mockups Before | Mockups After | Shared Before | Shared After | Accepted Decision |
|---|---|---|---|---|---|---|
| 1 | `In m5-daily-templates.html state S13 (subfolder date format), the config snippet uses [daily] date_format; the approved config contract (rm261003abzp-design.md, AppConfig, RM261003ABZP-DES14@R1) names it [daily] format. Change the mockup to format everywhere it appears.` (main orchestrator under user delegation, found during UI-requirements synthesis) | `RM261003ABZP-M5@R1` | `RM261003ABZP-M5@R2` | `R1` | `Unchanged` | Config key is `[daily] format` per DES14@R1 |
| 2 | `so may be not only for markdown, notebook in the future => we should design in a way that it can develop into a code editor => should leave room for this.` (user scope change; the "Apply all six" decision in `rm261003abzp-roadmap-context.md@R2`). No mockup edit: the new states reuse accepted visuals. | `RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (M5@R2)` | `Unchanged` | `R1` | `Unchanged` | AD4 |
| 3 | `the mockup designs must support the new requirements/designs — not fully but it should leave rooms for updates/extensiblity` (user, 2026-10-03; scope decision: "States + extension points (Recommended)"). Applied: M1 S15–S19 (TypeScript source view, plain-text fallback, refused binary, refused too large, 80×24); explorer lists every file type; statusline shows the buffer's view and drops note segments for non-Markdown files; note-only keys unbound in non-Markdown buffers. M3 S17–S21 (files picker over every file type with a code preview, which-key, palette, and help filtered by file type, `not available for typescript files`); S3 and S15 captions and S15 help scope labels updated. Extension-point notes on M1 S2, S7, S15 and M3 S19. Index hub: M1/M3 cards, status, shared revision, and the stale M5 card revision (R1 → R2) corrected. M2 and M4–M7 unchanged. | `RM261003ABZP-M1@R1, RM261003ABZP-M3@R1` | `RM261003ABZP-M1@R2, RM261003ABZP-M3@R2` | `R1` | `R2` | AD5 |

## Acceptance

- **Accepted revisions:** RM261003ABZP-M1@R1, RM261003ABZP-M2@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1 (shared R1)
- **Awaiting review (cycle 3):** RM261003ABZP-M1@R2, RM261003ABZP-M3@R2 (shared R2), status `Draft`. Accepting them supersedes RM261003ABZP-M1@R1 and RM261003ABZP-M3@R1; RM261003ABZP-M2@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, and RM261003ABZP-M7@R1 stay accepted against shared R1.
- **Evidence:** Delegated acceptance on 2026-10-03. The user instructed "you self-drive and decide all … don't raise any question to me … just stop when finish the skill workflow then I will review via mockups". The agent reviewed the Playwright validation and screenshots and accepted these revisions under that delegation. RM261003ABZP-M5@R2 was re-accepted after edit cycle 1 under the same delegation (M5@R1 acceptance withdrawn). Cycle 2 (AD4) was accepted by the agent on 2026-10-03 under the user's delegation for the scope change ("you self-drive everything"); no mockup or shared revision changed, so every accepted revision above still stands. The user's explicit review is pending; any feedback starts an edit cycle, sets affected rows to `Draft`, and requires UREQ/UDES/PH/DI reconciliation.

## Open Items

- **Caption references:** some state captions inside the mockups cite `REQ3@R2` or other earlier revisions; the current requirements are RM261003ABZP-REQ1@R3 and RM261003ABZP-REQ3@R4. Mockup behavior matches them for Markdown notes, and AD4 covers the other file types; captions are review chrome, so they are left unchanged to avoid revision churn.
- **Help key conflict (resolved):** RM261003ABZP-REQ3@R3 specified `<leader>?` or `:help` (kept in current RM261003ABZP-REQ3@R4); mockups already match.
- **Kanban `type` value:** the value is unverified until it is checked against a `.base` file saved by Obsidian 1.14 or later (REQ7@R2, DES12@R2). M6 is unaffected because it shows the layout, not the string.
- **Visual fidelity:** colours, glyphs, and spacing approximate an OpenTUI render. Exact cell metrics and image placement come from the real renderer (DES10@R2).
