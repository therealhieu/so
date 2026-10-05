# RM261003ABZP: so v1 — UI Requirements

**Status:** `Ready for UI Design`

**UI Context:** `rm261003abzp-ui-context.md@R2`

**History:** `rm261003abzp-ui-requirements-revisions.md`

**Approved Requirements and System Design:** `rm261003abzp-requirements.md` — RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ6@R2, RM261003ABZP-REQ7@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R3, RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R3; `rm261003abzp-design.md` — RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES14@R1 … RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1

**Mockup Manifest:** `ui-mockups/manifest.md`

**Accepted Mockups:** RM261003ABZP-M1@R1, RM261003ABZP-M2@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1 (shared R1) — delegated acceptance by the agent on 2026-10-03; the user's explicit review is pending (manifest Acceptance).

**Current UI Requirement Revisions:** RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ3@R2, RM261003ABZP-UREQ4@R1, RM261003ABZP-UREQ5@R2, RM261003ABZP-UREQ6@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1, RM261003ABZP-UREQ10@R1, RM261003ABZP-UREQ11@R1

**Unresolved Items:** None

Below, "Acceptance" means the manifest Acceptance section (delegated acceptance, 2026-10-03), "AD" means a manifest Accepted Decision (AD4: non-Markdown file states reuse existing visuals), and "A:<topic>" means a manifest Assumptions entry accepted as the v1 UI baseline by AD3. Mockup states are cited as `M<n> S<k>`.

## Current UI Requirements

### RM261003ABZP-UREQ1@R2: Application shell layout and status feedback

- **Requirement:** The terminal app shows a LazyVim-style shell — docked explorer, bufferline, one or more editor windows, optional right side panel, global statusline, and a command/message line — and reports startup indexing, notifications, and save failures without blocking editing.
- **Rationale:** One stable frame hosts every feature; status feedback makes background work and failures visible without interrupting typing.
- **Acceptance Criteria:**
  - At 120×36 the default layout shows, left to right, the explorer (folder tree with fold arrows, dirty ●), the editor window, and — when toggled — the side panel; the bufferline lists open buffers with a modified marker and the active buffer highlighted (M1 S2).
  - The statusline shows, in order: mode badge │ view mode (live/source/reading) │ workspace-relative path with ● when dirty │ backlinks count │ word count │ preview status │ index status │ `Ln:Col` (M1 S2).
  - For a non-Markdown file the view segment shows `source`, and the backlinks and word-count segments are hidden; every other segment keeps its order and form (AD4; RM261003ABZP-REQ1@R3).
  - On startup the first frame is editable while the statusline shows `◌ indexing <n>/<total>`; when indexing finishes a toast reports `Index ready` with note count and duration (M1 S1).
  - `<leader>e` hides and shows the explorer; the editor takes the freed width (M1 S8). Focusing the explorer enters EXPLORER mode where `j`/`k` move, `Enter`/`l` open, `Esc` returns (M1 S9).
  - `<leader>lb` shows backlinks and `<leader>o` shows the heading outline in the right side panel; the outline marks the current heading with `▸` and follows the cursor (M1 S10, S11).
  - `:vs`/`:sp` split the editor; each window has a winbar with the active title bold; `Ctrl-w h/j/k/l` move focus; `:q` closes the active window (M1 S7).
  - Toasts stack top-right; info and warning toasts expire, error toasts stay until dismissed; toast text contains paths but never note content (M1 S13).
  - A failed save keeps the buffer dirty, shows the reason in the statusline (e.g. `save failed: disk full`), and states the retry backoff; `:w` retries immediately (M1 S14).
- **Source Evidence:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ9@R3; RM261003ABZP-DES2@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES10@R2, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; `rm261003abzp-ui-context.md@R2` Affected UI "Application shell"
- **Accepted Mockups:** RM261003ABZP-M1@R1
- **Feedback or Decision Evidence:** Acceptance; AD3 with A:Leader map (`<leader>lb` backlinks, `b` = buffer group), A:Behaviour details; AD4 and Feedback Ledger cycle 2 (non-Markdown statusline)
- **Dependencies:** RM261003ABZP-UREQ11@R1

### RM261003ABZP-UREQ2@R1: Vim modes, cursor, and command line

- **Requirement:** Each vim mode is visibly distinct, the cursor shape follows the mode, Visual selections reveal source, and the command line runs ex commands and named commands with vim-style errors.
- **Rationale:** Mode clarity is the core usability property of a modal editor.
- **Acceptance Criteria:**
  - Mode badges: `NORMAL`, `INSERT` (green, bar cursor), `VISUAL`, `V-LINE`, `COMMAND`, `EXPLORER`, `BASE`; under NO_COLOR the badge text alone identifies the mode (M1 S2–S6, M6 S8).
  - In Insert mode, typing marks the buffer dirty (● in bufferline, explorer, statusline); autosave clears it about 1 s after typing stops and again on `Esc` (M1 S3).
  - A Visual or Visual-line selection reveals the raw syntax of every selected line; `y` yanks, `d` deletes, `Esc` leaves (M1 S4, S5).
  - `:` opens the command line at the bottom; `Enter` runs; an unknown command shows `E492: Not an editor command: <text>` (M1 S6).
- **Source Evidence:** RM261003ABZP-REQ1@R3 (autosave), RM261003ABZP-REQ2@R2 (modes, cursor shape, ex commands), RM261003ABZP-REQ5@R2 (selection reveal); RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2
- **Accepted Mockups:** RM261003ABZP-M1@R1
- **Feedback or Decision Evidence:** Acceptance; AD3 with A:Visual language
- **Dependencies:** RM261003ABZP-UREQ1@R2

### RM261003ABZP-UREQ3@R2: Live preview rendering, reveal, view modes, and non-Markdown source view

- **Requirement:** Notes render Obsidian-style in live preview, revealing inline source only on the cursor line and the full source of a multi-line block while the cursor is inside it; `<leader>m` cycles live → source → reading. Other text files open in source view only, with syntax colouring when their language is recognized, and without note behaviour.
- **Rationale:** Live preview is the product's signature view; consistent reveal rules prevent half-rendered blocks.
- **Acceptance Criteria:**
  - With the cursor on a blank line, headings render with level prefixes (█ ▊ ▌ ▏) and bands, inline styles render without markers, links show link text only, tags are coloured, `%%comment%%` lines are hidden, footnote references render as superscripts, and `^block-id` markers are hidden (M2 S1).
  - The cursor line shows its raw inline markers (`** * ~~ == \``) and is marked `▕` in the sign column; adjacent lines stay rendered; `j`/`k` move the reveal (M2 S2, M1 S2).
  - Inside a table, callout, fenced code block, frontmatter, or Mermaid fence, every line of that block shows source; leaving re-renders it (tables re-align with box drawing; code keeps highlighting in both states) (M2 S3–S6, S16).
  - Frontmatter renders as a Properties block (tags as chips, aliases as a list) when the cursor is outside it (M2 S6).
  - Source mode shows every line raw with syntax colouring only (M2 S7). Reading mode never reveals, refuses edit keys with a hint, and still lets the cursorline navigate (M2 S8).
  - Inline and block math render as Unicode text; Mermaid renders as box-drawing art with a zoom hint (M2 S15).
  - A non-Markdown text file (e.g. `sync.ts`, `config.yaml`) opens in source view, drawn like Markdown source mode: every line raw, syntax colouring when the language is recognized, plain text otherwise (M2 S7 visuals; AD4).
  - In a non-Markdown file, `<leader>m`, `Enter` and `gd` link following, and the task toggle are not bound; running a note-only command by name on the `:` line shows `not available for <type> files` in the message line and changes nothing (AD4).
- **Source Evidence:** RM261003ABZP-REQ5@R2, RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4; RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES5@R2, RM261003ABZP-DES17@R1
- **Accepted Mockups:** RM261003ABZP-M2@R1, RM261003ABZP-M1@R1
- **Feedback or Decision Evidence:** Acceptance; AD3 with A:Visual language (heading prefixes, `▕` sign column); AD4 and Feedback Ledger cycle 2 (non-Markdown source view)
- **Dependencies:** RM261003ABZP-UREQ11@R1

### RM261003ABZP-UREQ4@R1: Rich blocks, embeds, and images

- **Requirement:** Tasks, foldable callouts, note embeds, and images are interactive and degrade predictably across terminal graphics tiers.
- **Rationale:** These are the Obsidian blocks users act on daily; images must never break layout on weaker terminals.
- **Acceptance Criteria:**
  - Tasks render as `☐`/`☑`; `Enter` or `<leader>x` on a task toggles it and the change autosaves (M2 S9).
  - A callout written `> [!tip]-` renders folded with `▸` and only its title row; `za` unfolds and folds (M2 S10).
  - `![[note#Heading]]` renders the target section inline, capped at `preview.embedMaxRows` with `… N more lines`; `za` expands; `Enter` opens the target note (M2 S11).
  - Images: with kitty graphics or sixel the picture sits in the text flow with reserved rows so scrolling stays stable (M2 S12); otherwise a Unicode half-block approximation is drawn (M2 S13); with `preview.images = "off"` or no graphics a text placeholder `[image: <name>]` keeps layout (M2 S14).
- **Source Evidence:** RM261003ABZP-REQ5@R2, RM261003ABZP-REQ11@R3; RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1 (`preview.embedMaxRows`, `preview.images`)
- **Accepted Mockups:** RM261003ABZP-M2@R1
- **Feedback or Decision Evidence:** Acceptance; AD3 with A:Extra keys (`Enter` toggles a task, `za` folds callouts and expands embeds)
- **Dependencies:** RM261003ABZP-UREQ3@R2

### RM261003ABZP-UREQ5@R2: Discovery overlays — which-key, pickers, palette, command completion, help

- **Requirement:** Every command is discoverable through which-key, a family of fuzzy pickers with previews, a command palette, a completing command line, and a keymap help view.
- **Rationale:** LazyVim-style discoverability makes the modal editor learnable.
- **Acceptance Criteria:**
  - Pausing after `Space` opens which-key at the bottom listing direct actions first, then `+groups` (`f` find, `s` search, `n` notes, `l` links, `b` buffer, `w` window, `u` ui); a letter descends, `Backspace` goes back, `Esc` cancels (M3 S1); `Space n` shows daily note, date picker, template, new note (M3 S2).
  - Pickers share one layout: query line, result list, preview pane; typing filters fuzzily with matched characters highlighted and consecutive matches ranked first; `Ctrl-n`/`Ctrl-p` or `↓`/`↑` move, `Enter` opens, `Esc` closes (M3 S3, S4).
  - Picker kinds: files (`<leader>ff`, every non-excluded workspace file, not only notes), recent (`<leader>fr`, persisted per workspace), grep (`<leader>sg`, over Markdown notes and other text files; results as `path:line` with the match in context, preview marks the line), headings in note, tags with counts including nested tags, backlinks (`<leader>sb`) (M3 S3–S9; AD4).
  - The command palette (`<leader>:`, `<leader>sc`) lists command titles, ids, and current bindings, marking user overrides with `●`; it lists only commands available for the active buffer's file type (M3 S10; AD4).
  - `:` lists completions covering ex commands and every named command id available for the active file type; `Tab` cycles, `Enter` runs (M3 S11; AD4).
  - `<leader>?` or `:help` shows the active keymap grouped, with config overrides marked `●` and file-type-scoped bindings labelled with their file type (e.g. `markdown`); `?` stays backward search (M3 S15; AD4).
  - At 80×24 pickers drop the preview pane and use the full width for results (M3 S16).
- **Source Evidence:** RM261003ABZP-REQ3@R4, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ6@R2; RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1
- **Accepted Mockups:** RM261003ABZP-M3@R1
- **Feedback or Decision Evidence:** Acceptance; AD1 (help key); AD3 with A:Leader map, A:`:` command line; AD4 and Feedback Ledger cycle 2 (all-file picker, file-type filtering, help scope)
- **Dependencies:** RM261003ABZP-UREQ11@R1

### RM261003ABZP-UREQ6@R1: Links — completion, following, jump list, backlinks, and rename

- **Requirement:** Users complete, follow, and inspect links from the keyboard, return through a persisted jump list, see linked and unlinked mentions, and rename with the impact shown before confirming.
- **Rationale:** Links are the core of an Obsidian-style knowledge base; showing impact before rename keeps the graph trustworthy.
- **Acceptance Criteria:**
  - Typing `[[` in Insert mode opens completion over notes and aliases; after `#` it lists the target's headings; after `#^` it lists block ids with their text; the popup never covers the cursor line (M3 S12–S14).
  - `gd` or `Enter` on a wikilink opens the target, at the heading or block when given; the statusline shows `jump <i>/<n>`; `Ctrl-o`/`Ctrl-i` move back and forward (M4 S1–S3). `:jumps` lists positions with `>` at the current one (M4 S4).
  - Unresolved links render in the error colour (with a distinct style under NO_COLOR); following one prompts `Create <path>? [y/N]` next to the source note; `y` creates and opens, anything else cancels (M4 S5).
  - The backlinks panel (`<leader>lb`) lists linked mentions with context lines, then unlinked mentions; `j`/`k` move, `Enter` opens; `l` on an unlinked mention turns it into a wikilink in that file (M4 S6, S7). At 80×24 the panel opens as a picker instead (M4 S18).
  - `<leader>lr` opens a rename prompt that states the impact (e.g. `31 links in 12 files`) before `Enter`; after renaming, buffer, bufferline, and tree show the new name and a toast reports `12 files updated` (M4 S8, S9).
- **Source Evidence:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ3@R4 (jump history persists; link keys scoped to Markdown); RM261003ABZP-DES7@R3, RM261003ABZP-DES5@R2
- **Accepted Mockups:** RM261003ABZP-M3@R1, RM261003ABZP-M4@R1
- **Feedback or Decision Evidence:** Acceptance; AD3 with A:Extra keys (`:jumps`, `l` links an unlinked mention), A:Behaviour details (impact before Enter; narrow backlinks as picker)
- **Dependencies:** RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ5@R2

### RM261003ABZP-UREQ7@R2: Explorer file operations, refused files, and disk-change handling

- **Requirement:** The explorer creates, renames, moves, and deletes files and folders with inline prompts, files that cannot be opened as text are refused visibly, and external disk changes are resolved visibly without silent overwrites.
- **Rationale:** File safety must be visible and reversible at the UI level.
- **Acceptance Criteria:**
  - In the explorer, `a` adds an inline name field under the selected folder (a name without an extension gets `.md`; a name with one, such as `sync.ts`, keeps it; trailing `/` makes a folder); `r` renames in place and rewrites links; `m` opens a folder picker whose preview shows the destination and link rewrite; `d` asks `Move to Trash? [y/N]` (M4 S10–S13).
  - When the trash is unavailable, deletion is labelled permanent and `Enter` stays disabled until the file name is typed exactly (M4 S14).
  - When a note with unsaved edits changes on disk, a conflict prompt offers `k` keep mine, `t` take disk, `d` view diff; autosave pauses for that note until resolved (M4 S15). The diff shows buffer and disk side by side; `k`/`t` resolve, `q` returns to the prompt (M4 S16).
  - When a clean buffer changes on disk, it reloads and a notice says `Reloaded from disk — u to undo`; `u` restores the previous text (M4 S17).
  - Opening a binary file (NUL byte in the first 8 KiB or invalid UTF-8) from the explorer, a picker, or `:e` shows `binary file — not opened` in the message line; a file over 16 MiB shows `file too large — not opened (limit 16 MiB)`; no buffer opens, the active buffer stays, and nothing is written (M1 S6 message-line visuals; AD4).
- **Source Evidence:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ4@R3; RM261003ABZP-DES8@R1, RM261003ABZP-DES17@R1
- **Accepted Mockups:** RM261003ABZP-M4@R1, RM261003ABZP-M1@R1
- **Feedback or Decision Evidence:** Acceptance; AD3 with A:Extra keys (explorer `a`/`r`/`m`/`d`), A:Behaviour details (conflict pauses autosave); AD4 and Feedback Ledger cycle 2 (refused files, extension rule)
- **Dependencies:** RM261003ABZP-UREQ1@R2

### RM261003ABZP-UREQ8@R2: Daily notes, date picker, and templates

- **Requirement:** Daily notes open or are created from a template by command or calendar, templates insert with expanded variables, and new notes can start from a template.
- **Rationale:** Daily notes and templates are core Obsidian workflows selected for v1.
- **Acceptance Criteria:**
  - `:Today` (`<leader>nd`) creates `daily/<date>.md` from `templates/daily.md` when missing, expanding `{{date}}`, `{{date:dddd, MMMM D}}`, and `{{time}}`, and places the cursor in the first task (M5 S1, S2).
  - `:Yesterday` and `:Tomorrow` are relative to the open daily note; a missing note is created from the daily template (M5 S3, S4).
  - `<leader>np` opens a Monday-first month calendar: `•` marks days with notes, today is underlined, `h/j/k/l` move, `H`/`L` page months keeping the day number, `t` jumps to today, `Enter` opens or creates; it fits 80×24 as a fixed 36-column float (M5 S5, S6, S14).
  - `<leader>nt` lists `templates/`; the preview shows the template source with variables highlighted above the expanded result; unsupported tokens stay literal and `[...]` escapes print literally; insertion lands at the cursor and one `u` undoes it (M5 S7–S9).
  - `<leader>nn` asks for a title (file name derived from it), then offers templates with `(blank note)` first; the created note opens in Insert mode at the first empty bullet (M5 S10–S12).
  - A daily date format containing `/` creates subfolders, e.g. `daily/2026/10/2026-10-03.md` (M5 S13).
- **Source Evidence:** RM261003ABZP-REQ6@R2, RM261003ABZP-REQ3@R4; RM261003ABZP-DES11@R1, RM261003ABZP-DES14@R1 (`[daily] folder/format/template`)
- **Accepted Mockups:** RM261003ABZP-M5@R2
- **Feedback or Decision Evidence:** Acceptance; feedback cycle 1 (config key `[daily] format`); AD2; AD3 with A:Extra keys (calendar `H`/`L`/`t`), A:Behaviour details (Monday-first, relative `:Yesterday`/`:Tomorrow`, create from template)
- **Dependencies:** RM261003ABZP-UREQ5@R2

### RM261003ABZP-UREQ9@R1: Bases table and Kanban views

- **Requirement:** `.base` files open in a keyboard-driven table or Kanban view with a toolbar, in-place property editing that shows its frontmatter write, defined fallbacks, and inline embeds.
- **Rationale:** Bases turn notes into structured data; visible write-back keeps edits trustworthy.
- **Acceptance Criteria:**
  - The toolbar shows base name, numbered view tabs, filter and sort summary, and row count; diagnostics for unsupported syntax appear as a notice without failing (M6 S1).
  - Table: header arrow shows the active sort; rows group under group headers; a summary row shows configured summaries; `s` cycles sort ascending → descending → off; `g` toggles grouping; columns that do not fit show `› +N cols` and scroll into view with `l` (M6 S1, S7, S15).
  - Cell editing: `i` edits in place — text with suggestions, numbers validated with `Ctrl-a`/`Ctrl-x` stepping, dates as `YYYY-MM-DD` with `Ctrl-a`/`Ctrl-x` stepping a day, lists as chips; `x` toggles a checkbox; every write shows a toast with the exact frontmatter diff (M6 S2–S6).
  - Kanban: cards in columns by the group-by property, with a `None` column; `h/j/k/l` move focus; `H`/`L` move a card and write the property; moving into `None` removes the property; columns at 80×24 truncate names and show `↓ N more` (M6 S8–S10, S16).
  - When grouping by a formula, the toolbar shows `⊘ moves off` and `H`/`L` explain why moving is unavailable (M6 S11).
  - `v` lists views with their layout; `Enter`, `1`–`4`, or `Tab` switch (M6 S12). A `cards` view opens as a table with a notice and the file is not modified (M6 S13).
  - `![[tasks.base#Board]]` renders the view inline in live preview; on the embed line its source is revealed and `Enter` opens the base at that view (M6 S14).
- **Source Evidence:** RM261003ABZP-REQ7@R2, RM261003ABZP-REQ5@R2; RM261003ABZP-DES12@R2, RM261003ABZP-DES9@R3
- **Accepted Mockups:** RM261003ABZP-M6@R1
- **Feedback or Decision Evidence:** Acceptance; AD3 with A:Extra keys (Bases keys), A:Behaviour details (`None` removes the property)
- **Dependencies:** RM261003ABZP-UREQ3@R2, RM261003ABZP-UREQ11@R1

### RM261003ABZP-UREQ10@R1: Browser preview page

- **Requirement:** The read-only browser page mirrors the note open in `so`, shows connection state, lets the reader navigate wikilinks within the preview, and stays readable on light, dark, and phone-width screens.
- **Rationale:** Full-fidelity reading without a web app; connection state must never fail silently.
- **Acceptance Criteria:**
  - The header shows the note path and a connection badge: `Live` (connected), `Reconnecting…` (amber, last version kept), `Stopped` (after `:PreviewStop`, updates stop with a message), `Offline` (last rendered copy with a notice; navigation disabled) (M7 S1, S7–S9).
  - The page renders callouts, tables, code, embeds, images, KaTeX math, and Mermaid diagrams; task checkboxes are disabled; there are no editing controls (M7 S1).
  - A note switch in the terminal swaps the page within 300 ms and the URL path follows; an incoming edit highlights the changed blocks briefly (M7 S2, S6).
  - Clicking a wikilink navigates the preview only and shows a banner offering to follow the terminal again; unresolved links are styled as unresolved and explain how to create them in `so` (M7 S3).
  - The page follows the OS colour scheme with a toggle override; system fonts and GitHub-like Markdown styling (M7 S4, S5).
  - At 375 px the header wraps, margins shrink, and wide tables and code scroll inside their box without page-level horizontal scroll (M7 S10).
- **Source Evidence:** RM261003ABZP-REQ8@R2, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ9@R3; RM261003ABZP-DES13@R3
- **Accepted Mockups:** RM261003ABZP-M7@R1
- **Feedback or Decision Evidence:** Acceptance; AD3 with A:Browser preview page
- **Dependencies:** None

### RM261003ABZP-UREQ11@R1: Themes, NO_COLOR, narrow terminals, input, and accessibility

- **Requirement:** Every terminal surface works in dark, light, and NO_COLOR themes and at 80×24, is fully keyboard-operable with optional mouse support, and the browser page meets basic accessibility.
- **Rationale:** RM261003ABZP-REQ11@R3 requires NO_COLOR and broad terminal support; narrow terminals and keyboard-only use are common for vim users.
- **Acceptance Criteria:**
  - Dark (tokyonight-like, default) and light themes use the design's style tokens; under NO_COLOR every state (mode, selection, cursor line, dirty, error, focused cell/card, unresolved link) is distinguishable by bold, underline, reverse video, or glyphs alone (all terminal mockups, theme toggle).
  - At 80×24 the explorer and side panel become floating overlays, the statusline drops view/words/preview segments, pickers drop previews, backlinks open as a picker, Bases hide overflowing columns, and the calendar fits unchanged (M1 S12, M3 S16, M4 S18, M5 S14, M6 S15–S16).
  - Every action has a keyboard path; mouse clicks on explorer rows, buffers, Bases view tabs, and preview links are optional extras, and the wheel scrolls (A:Accessibility; RM261003ABZP-DES10@R2).
  - The browser page uses semantic headings, readable contrast in both themes, and keyboard-reachable links (M7 S4, S5, S10).
- **Source Evidence:** RM261003ABZP-REQ11@R3 (NO_COLOR, terminal support); RM261003ABZP-DES10@R2 (theme tokens, mouse optional); `rm261003abzp-ui-context.md@R2` Constraints
- **Accepted Mockups:** RM261003ABZP-M1@R1, RM261003ABZP-M2@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1
- **Feedback or Decision Evidence:** Acceptance; AD3 with A:Visual language, A:Accessibility
- **Dependencies:** None

## Assumptions, Exclusions, and Deferrals

- **Assumption:** Mockup content (sample `~/notes`, clock Saturday 2026-10-03 08:12, 10,000-note counts, `view.zen` override example) is illustrative data, not product behavior (A:Mockup clock and data).
- **Assumption:** Colours, glyphs, and spacing approximate an OpenTUI render; exact cell metrics and image placement come from the real renderer (manifest Open Items "Visual fidelity").
- **Exclusion:** The browser mockup's MathML and inline SVG are offline stand-ins; the product uses KaTeX and Mermaid per RM261003ABZP-REQ8@R2 and RM261003ABZP-DES13@R3 (A:Browser preview page).
- **Exclusion:** Code-intelligence UI (diagnostics, hovers, go-to-definition) and notebook UI — deferred by RM261003ABZP-REQ1@R3 and RM261003ABZP-REQ11@R3; v1 binds no keys for them.
- **Exclusion:** Mockup-only review chrome (state sidebar, viewport and theme toggles, captions, the `index.html` hub) is not product UI.
- **Deferral:** Kanban `type` string confirmation — owned by RM261003ABZP-REQ7@R2 and RM261003ABZP-DES12@R2; the UI does not depend on it (manifest Open Items). Trigger: before Kanban ships.

## Traceability

| Source Evidence | Accepted Mockup | Feedback or Decision | UI Requirement |
|---|---|---|---|
| RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-M1@R1 (S1, S2, S7–S14) | Acceptance; AD3; AD4; Feedback Ledger cycle 2 | RM261003ABZP-UREQ1@R2 |
| RM261003ABZP-REQ2@R2, RM261003ABZP-REQ1@R3, RM261003ABZP-DES4@R1 | RM261003ABZP-M1@R1 (S2–S6) | Acceptance; AD3 | RM261003ABZP-UREQ2@R1 |
| RM261003ABZP-REQ5@R2, RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-DES9@R3, RM261003ABZP-DES17@R1 | RM261003ABZP-M2@R1 (S1–S8, S15, S16); RM261003ABZP-M1@R1 (S2) | Acceptance; AD3; AD4; Feedback Ledger cycle 2 | RM261003ABZP-UREQ3@R2 |
| RM261003ABZP-REQ5@R2, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1 | RM261003ABZP-M2@R1 (S9–S14) | Acceptance; AD3 | RM261003ABZP-UREQ4@R1 |
| RM261003ABZP-REQ3@R4, RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3 | RM261003ABZP-M3@R1 (S1–S11, S15, S16) | Acceptance; AD1; AD3; AD4; Feedback Ledger cycle 2 | RM261003ABZP-UREQ5@R2 |
| RM261003ABZP-REQ4@R3, RM261003ABZP-DES7@R3 | RM261003ABZP-M3@R1 (S12–S14); RM261003ABZP-M4@R1 (S1–S9, S18) | Acceptance; AD3 | RM261003ABZP-UREQ6@R1 |
| RM261003ABZP-REQ1@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-M4@R1 (S10–S17); RM261003ABZP-M1@R1 (S6, S9) | Acceptance; AD3; AD4; Feedback Ledger cycle 2 | RM261003ABZP-UREQ7@R2 |
| RM261003ABZP-REQ6@R2, RM261003ABZP-DES11@R1 | RM261003ABZP-M5@R2 (S1–S14) | Acceptance; feedback cycle 1; AD2; AD3 | RM261003ABZP-UREQ8@R2 |
| RM261003ABZP-REQ7@R2, RM261003ABZP-DES12@R2 | RM261003ABZP-M6@R1 (S1–S16) | Acceptance; AD3 | RM261003ABZP-UREQ9@R1 |
| RM261003ABZP-REQ8@R2, RM261003ABZP-DES13@R3 | RM261003ABZP-M7@R1 (S1–S10) | Acceptance; AD3 | RM261003ABZP-UREQ10@R1 |
| RM261003ABZP-REQ11@R3, RM261003ABZP-DES10@R2 | RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (theme/viewport variants) | Acceptance; AD3 | RM261003ABZP-UREQ11@R1 |

## Readiness

- [x] Every current accepted parent and child mockup and material decision is represented by a current UI requirement or explicit exclusion; parent links agree with the mockups (all M1–M7 have `Parent` `None`).
- [x] Every current requirement has observable acceptance criteria.
- [x] Every current requirement links to source evidence and one or more accepted mockup revisions.
- [x] Historical revisions remain in the companion and are excluded from UI-design inputs.
- [x] New states introduced by the system scope change (non-Markdown statusline, source view, refused files, file-type filtering) reuse accepted mockup visuals and are covered by manifest AD4 and Feedback Ledger cycle 2; no mockup revision changed.
- [x] Unresolved items are `None`.
