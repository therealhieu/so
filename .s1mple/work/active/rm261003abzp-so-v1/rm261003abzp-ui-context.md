# RM261003ABZP: so v1 — UI Context

- **Revision:** `R2`
- **History:** `rm261003abzp-ui-context-revisions.md`
- **Approved system baseline:** `rm261003abzp-roadmap-context.md@R2; RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 … RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R3; RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R1 … RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1`

## Status

`Ready`

## User Input

"so is neovim/lazyvim for markdown, follow obsidian style; no AI, no chat, no LLM, no vault, no git … UI/UX: fast and smooth … designs must be stable, simple, easy to maintain and extend + meet industry standards … just stop when finish the skill workflow then I will review via mockups. So mockups have enough UI/UX/interactions/views/features." (2026-10-03)

Scope change (2026-10-03, `rm261003abzp-roadmap-context.md@R2`): "may be not only for markdown, notebook in the future => we should design in a way that it can develop into a code editor => should leave room for this"; the user selected "Apply all six (Recommended)", including opening any UTF-8 text file in source view and scoping note keys to Markdown.

## Project and UI Baseline

- **Project guidance:** `.s1mple/S1MPLE.md`
- **Project context:** `.s1mple/docs/project.md`
- **Relevant surfaces:** terminal application shell (explorer, bufferline, editor windows, side panel, statusline, command line), overlays (which-key, pickers, palette, prompts, help, notifications), Bases views (table, Kanban), daily-note and template flows, read-only browser preview page.
- **Existing UI patterns:** None in `so`. External conventions the user named: Neovim/LazyVim (leader + which-key, Telescope-style pickers, neo-tree explorer, bufferline, lualine statusline) and Obsidian (live preview, callouts, backlinks pane, Bases).
- **Existing design system:** None — greenfield. Theme tokens are defined by RM261003ABZP-DES10@R2 (`StyleToken` names in RM261003ABZP-DES9@R3) without concrete colours.

## Current Experience

None — no existing UI.

## Desired Outcome

A keyboard-first terminal editor that looks and feels like LazyVim — fast, quiet, discoverable through which-key and pickers — while rendering notes like Obsidian's live preview, plus a clean read-only browser page that mirrors the current note. Markdown comes first; other text files open in the same editor as highlighted source without note features, and binary files are refused with a clear message.

## Affected UI

- **Surface:** Application shell
  - **Current role:** None — proposed surface
  - **Affected code:** None — proposed surface (`src/ui/shell.ts`, `src/ui/views/*` per RM261003ABZP-DES10@R2)
  - **Expected impact:** primary layout for every feature, including status for non-Markdown files (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4)
- **Surface:** Editor window (Markdown live / source / reading; other text files source only)
  - **Current role:** None — proposed surface
  - **Affected code:** None — proposed surface (`src/ui/editors/*`, `src/ui/widgets/*`, `src/core/kernel/view/*`, `src/core/lang/markdown/*`)
  - **Expected impact:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ11@R3
- **Surface:** Overlays (which-key, pickers, palette, completion, prompts, help, notifications)
  - **Current role:** None — proposed surface
  - **Affected code:** None — proposed surface (`src/ui/overlays/*`)
  - **Expected impact:** RM261003ABZP-REQ3@R4 (all-file picker, file-type-filtered commands), RM261003ABZP-REQ4@R3, RM261003ABZP-REQ1@R3 (conflict, delete confirm, refused-open messages)
- **Surface:** Side panel (backlinks, outline, tags)
  - **Current role:** None — proposed surface
  - **Affected code:** None — proposed surface (`src/ui/views/side-panel.ts`)
  - **Expected impact:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ3@R4
- **Surface:** Daily notes and templates (date picker, template picker)
  - **Current role:** None — proposed surface
  - **Affected code:** None — proposed surface
  - **Expected impact:** RM261003ABZP-REQ6@R2
- **Surface:** Bases views (table, Kanban, embeds)
  - **Current role:** None — proposed surface
  - **Affected code:** None — proposed surface (`src/ui/editors/` `base` editor view)
  - **Expected impact:** RM261003ABZP-REQ7@R2, RM261003ABZP-REQ11@R3 (editor kind by registration)
- **Surface:** Browser preview page
  - **Current role:** None — proposed surface
  - **Affected code:** None — proposed surface (`src/preview/page.html`, `src/core/lang/markdown/html.ts`)
  - **Expected impact:** RM261003ABZP-REQ8@R2

## Constraints

- Terminal cell grid: monospace cells, 16/256/truecolor; layouts must work at 80×24 and scale to wide terminals (RM261003ABZP-REQ11@R3 platform support).
- `NO_COLOR` must leave every state distinguishable without colour (RM261003ABZP-REQ11@R3).
- Keyboard-first; mouse is optional enhancement (RM261003ABZP-DES10@R2).
- Note-only keys and commands (`gd`/`Enter` link follow, `<leader>m`, task toggle) apply to Markdown only; other file types show source and refuse note commands with a message (RM261003ABZP-REQ3@R4, RM261003ABZP-DES5@R2).
- No new visual language for non-Markdown files: they reuse source view, statusline, message line, and picker visuals (manifest AD4).
- Images: kitty/sixel full graphics, Unicode blocks elsewhere, text placeholder when off (RM261003ABZP-REQ5@R2).
- Performance budget: no UI element may require whole-document layout per keystroke (RM261003ABZP-REQ9@R2, RM261003ABZP-DES16@R1).
- Preview page is read-only with no editing controls (RM261003ABZP-REQ8@R2).
- Out of scope: AI/chat surfaces, vault switchers, Git panels, code-intelligence UI (diagnostics, hovers), notebooks (RM261003ABZP-REQ1@R3 scope and deferrals).

## Evidence

- Alfred TUI layout precedent (explorer + note pane, View/Live/Raw modes, zoom dialog, help overlay) — `alfred/apps/tui/src/app/screens/KnowledgeScreen.tsx`, `alfred/apps/tui/src/app/components/HelpOverlay.tsx`, `alfred/packages/view-model/src/knowledge/document-mode.ts:2`
- Alfred Bases terminal views (grid, cards, toolbar, cell editor) — `alfred/apps/tui/src/app/knowledge/base/BaseView.tsx`, `BaseGrid.tsx`, `CardLayout.tsx`, `CellEditor.tsx`
- Proposed shell regions and overlays — `rm261003abzp-design.md` Components and Boundaries "UI shell" (RM261003ABZP-DES10@R2)
- Open-a-file flow with binary and size refusal — `rm261003abzp-design.md` Runtime Flows "Open a file" (RM261003ABZP-DES17@R1)

## Assumptions

- LazyVim's default key layout (`<leader>e`, `<leader>ff`, `<leader>sg`, `<leader>:`, `gd`, `Ctrl-o`) is the expected muscle memory; `so` adds an `n` (notes) group for daily notes and templates.
- A dark theme is the default; a light theme and `NO_COLOR` variant are required for accessibility.

## Unknowns

- None blocking — concrete colours and glyph choices are mockup decisions.

## Likely Mockup Scope

- Application shell at 120×36 and 80×24 with explorer, bufferline, editor, side panel, statusline, command line; mode states (Normal, Insert, Visual, Command-line); splits.
- Editor rendering: live preview with cursor-line and block reveal, source, reading; callouts, tables, code, checkboxes, embeds, images (kitty / blocks / placeholder), math, Mermaid, frontmatter properties.
- Overlays: which-key, file picker with preview, full-text search, headings, tags, backlinks, recent, command palette, `[[` completion, help, notifications.
- Links and files: backlinks panel (linked/unlinked), follow link + jump list, unresolved-link create prompt, rename result, explorer create/rename/move/delete prompts, external-change conflict prompt with diff, save failure.
- Daily notes and templates: `:Today`, date picker, template picker, new note from template.
- Bases: table with cell navigation and editing, sort and group, Kanban with card moves and disabled-move state, view switcher, unsupported-layout notice, embedded base in a note.
- Browser preview page: rendered note, live-update indicator, wikilink navigation, math and Mermaid, offline fallback.
- Accessibility variants: `NO_COLOR`, light theme, narrow terminal.

## Non-UI Blockers

- None

## Sources

- `rm261003abzp-roadmap-context.md@R2` (scope change)
- `rm261003abzp-requirements.md` (current revisions listed in the baseline above)
- `rm261003abzp-design.md` (current revisions listed in the baseline above)
- `alfred/apps/tui/src/app/screens/KnowledgeScreen.tsx`, `alfred/apps/tui/src/app/knowledge/base/BaseView.tsx`
