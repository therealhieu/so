# RM261003ABZP: so v1 — UI Design

## Status

`Ready for Planning`

## Sources

- **History:** `rm261003abzp-ui-design-revisions.md`

- **UI context:** `rm261003abzp-ui-context.md@R2`
- **UI requirements:** `rm261003abzp-ui-requirements.md`; history: `rm261003abzp-ui-requirements-revisions.md`
- **Current UI requirement revisions:** RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ3@R2, RM261003ABZP-UREQ4@R1, RM261003ABZP-UREQ5@R2, RM261003ABZP-UREQ6@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1, RM261003ABZP-UREQ10@R1, RM261003ABZP-UREQ11@R1
- **Requirements and system design:** `rm261003abzp-requirements.md` — RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 … RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R3; `rm261003abzp-design.md` — RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES14@R1 … RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
- **Mockup manifest:** `ui-mockups/manifest.md`
- **Accepted mockups:** RM261003ABZP-M1@R1, RM261003ABZP-M2@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1 (shared R1) — delegated acceptance; the user's explicit review is pending (manifest Acceptance)
- **Accepted feedback and decisions:** manifest Accepted Decisions (AD1 help key, AD2 config key `[daily] format`, AD3 Assumptions accepted as v1 baseline, AD4 non-Markdown file states reuse accepted visuals), Feedback Ledger cycles 1 and 2, Assumptions

Notation: "A:<topic>" is a manifest Assumptions entry accepted by the Assumptions decision; `M<n> S<k>` is a mockup state. Code previews are TypeScript shapes for `src/ui/*` (the only layer allowed to import `@opentui/*`, RM261003ABZP-DES1@R2); OpenTUI calls are illustrative until confirmed against the pinned version (RM261003ABZP-DES10@R2 Detailed Code Design).

## Ready for Planning Checklist

- [x] Every current `UREQ` is supported by source evidence, a current accepted mockup revision, and accepted feedback or decision evidence.
- [x] Every current accepted parent and child has `UREQ`/`UDES` coverage or an explicit exclusion; parent links agree with the mockups (M1–M7 have `Parent` `None`).
- [x] Every current `UREQ` revision has one or more current `UDES` decisions.
- [x] Every current `UREQ` and `UDES` maps to an accepted mockup and a canonical detailed surface or component entry.
- [x] The design progresses from experience architecture through surfaces, flows, policies, components, and detailed specifications.
- [x] Navigation, entry, exit, and cross-surface transitions are explicit.
- [x] Every affected surface defines hierarchy, states, interactions, responsive behavior, accessibility behavior, and component composition.
- [x] Every new focal component has a complete specification; every existing or adapted component cites its current contract and specifies only changed behavior and boundaries (all components are new — greenfield).
- [x] Every material UI code shape uses the affected codebase's language, framework, naming, and established patterns; cites its target file, symbol, and relevant system-design authority; and is immediately explained.
- [x] Every omitted UI code shape explains why a concrete preview would duplicate an existing contract or add no review value.
- [x] Accepted mockups remain the visual authority; states added by the scope change (non-Markdown source view, refused files, file-type filtering) reuse accepted visuals under manifest AD4.
- [x] Source system contracts and technical boundaries are referenced rather than redefined.
- [x] Every required system support entry cites current `REQ` and `DES` coverage or states that no current coverage exists.
- [x] Every `US` has one or more supporting `UV` records.
- [x] Every `UV` references the `US` records it proves and defines exact observable assertions and one unique risk.
- [x] Proposed verification is not presented as executed evidence.
- [x] Historical revisions remain in the companion and are excluded from current roadmap inputs.
- [x] Every omitted state, surface, component, responsive condition, or verification method explains why it does not apply.
- [x] Unresolved items are `None` — system-support gaps resolved in step 10.

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
10. [Acceptance](#10-acceptance)

# 1. Goals, Scope, and Requirement Coverage

## Goal and Scope

- **Goal:** Realize the accepted mockups as one LazyVim-style terminal shell whose every surface is keyboard-first, theme- and NO_COLOR-safe, and works at 80×24, plus a read-only browser page — using only the system contracts in `rm261003abzp-design.md`.
- **In scope:** application shell and status feedback; vim mode presentation and command line; live-preview presentation; source view for non-Markdown text files and refused-file messages; interactive blocks and image tiers; which-key, pickers, palette, completion, help; link interactions; explorer file operations and disk-change resolution; daily-note calendar and template flows; Bases table and Kanban views; browser preview page; themes, NO_COLOR, narrow layout, input, accessibility.
- **Out of scope:** mockup review chrome (state sidebar, toggles, captions, `index.html`); offline MathML/SVG stand-ins in M7 (the product uses KaTeX and Mermaid, RM261003ABZP-DES13@R3); AI, vault, and Git surfaces (RM261003ABZP-REQ1@R3 scope); code-intelligence UI (diagnostics, hovers, go-to-definition) and notebook UI (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3 deferrals); Cards/List/Map Bases layouts beyond the table fallback (RM261003ABZP-REQ7@R2 deferral).
- **Unresolved items:** None — every Required System Support row has current REQ/DES coverage.

## Users and Tasks

- **User:** one person who writes and links Markdown notes in a terminal, fluent in vim/LazyVim conventions or learning them through which-key.
- **Task:** open a notes folder, write and edit notes, navigate by links, capture daily notes from templates, manage structured notes in Bases, read a note in the browser, and edit the folder's other text files (config, scripts) in source view.
- **Success:** every task completes from the keyboard without leaving the shell; mode, focus, save state, and background work are always visible; nothing renders broken at 80×24 or under NO_COLOR.

## UI Requirement Coverage

| Source Evidence | Accepted Mockup | Feedback Evidence | UI Requirement | UI Design | Detailed Design | Success Criteria | Verification | Status |
|---|---|---|---|---|---|---|---|---|
| RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-M1@R1 | Acceptance; AD3 (A:Leader map, A:Behaviour details); AD4 | RM261003ABZP-UREQ1@R2 | RM261003ABZP-UDES1@R2, RM261003ABZP-UDES11@R1 | Surface: Application shell; Component: Statusline; Component: Toast stack | RM261003ABZP-US1@R2 | RM261003ABZP-UV1@R2 | Covered |
| RM261003ABZP-REQ2@R2, RM261003ABZP-DES4@R1 | RM261003ABZP-M1@R1 | Acceptance; AD3 (A:Visual language) | RM261003ABZP-UREQ2@R1 | RM261003ABZP-UDES2@R1 | Surface: Application shell; Component: Command line | RM261003ABZP-US1@R2 | RM261003ABZP-UV2@R1 | Covered |
| RM261003ABZP-REQ5@R2, RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-DES9@R3, RM261003ABZP-DES17@R1 | RM261003ABZP-M2@R1, RM261003ABZP-M1@R1 | Acceptance; AD3 (A:Visual language); AD4 | RM261003ABZP-UREQ3@R2 | RM261003ABZP-UDES3@R2 | Surface: Editor window | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 | Covered |
| RM261003ABZP-REQ5@R2, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1 | RM261003ABZP-M2@R1 | Acceptance; AD3 (A:Extra keys) | RM261003ABZP-UREQ4@R1 | RM261003ABZP-UDES4@R1 | Surface: Editor window | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 | Covered |
| RM261003ABZP-REQ3@R4, RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3 | RM261003ABZP-M3@R1 | Acceptance; AD1; AD3 (A:Leader map, A:`:` command line); AD4 | RM261003ABZP-UREQ5@R2 | RM261003ABZP-UDES5@R2 | Surface: Overlays; Component: Which-key; Component: Picker; Component: Command line | RM261003ABZP-US3@R2 | RM261003ABZP-UV4@R2 | Covered |
| RM261003ABZP-REQ4@R3, RM261003ABZP-DES7@R3 | RM261003ABZP-M3@R1, RM261003ABZP-M4@R1 | Acceptance; AD3 (A:Extra keys, A:Behaviour details) | RM261003ABZP-UREQ6@R1 | RM261003ABZP-UDES6@R1 | Surface: Links and backlinks; Component: Completion popup; Component: Prompt | RM261003ABZP-US4@R1 | RM261003ABZP-UV5@R1 | Covered |
| RM261003ABZP-REQ1@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-M4@R1, RM261003ABZP-M1@R1 | Acceptance; AD3 (A:Extra keys, A:Behaviour details); AD4 | RM261003ABZP-UREQ7@R2 | RM261003ABZP-UDES7@R2 | Surface: File operations and disk changes; Component: Prompt; Component: Conflict dialog and diff | RM261003ABZP-US5@R2 | RM261003ABZP-UV6@R2 | Covered |
| RM261003ABZP-REQ6@R2, RM261003ABZP-DES11@R1 | RM261003ABZP-M5@R2 | Acceptance; feedback cycle 1; AD2; AD3 (A:Extra keys, A:Behaviour details) | RM261003ABZP-UREQ8@R2 | RM261003ABZP-UDES8@R1 | Surface: Daily notes and templates; Component: Calendar; Component: Picker | RM261003ABZP-US6@R1 | RM261003ABZP-UV7@R1 | Covered |
| RM261003ABZP-REQ7@R2, RM261003ABZP-DES12@R2 | RM261003ABZP-M6@R1 | Acceptance; AD3 (A:Extra keys, A:Behaviour details) | RM261003ABZP-UREQ9@R1 | RM261003ABZP-UDES9@R1 | Surface: Bases views; Component: Base table; Component: Kanban board | RM261003ABZP-US7@R1 | RM261003ABZP-UV8@R1 | Covered |
| RM261003ABZP-REQ8@R2, RM261003ABZP-DES13@R3 | RM261003ABZP-M7@R1 | Acceptance; AD3 (A:Browser preview page) | RM261003ABZP-UREQ10@R1 | RM261003ABZP-UDES10@R2 | Surface: Browser preview page | RM261003ABZP-US8@R1 | RM261003ABZP-UV9@R2 | Covered |
| RM261003ABZP-REQ11@R3, RM261003ABZP-DES10@R2 | RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (M5@R2) | Acceptance; AD3 (A:Visual language, A:Accessibility) | RM261003ABZP-UREQ11@R1 | RM261003ABZP-UDES11@R1 | Section 5 policies; Component: Theme | RM261003ABZP-US9@R1 | RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R2 | Covered |

## Constraints and Dependencies

- **System constraints:** RM261003ABZP-DES1@R2 (only `src/ui` imports OpenTUI), RM261003ABZP-DES2@R2 (UI reads `AppState`, dispatches `Action`s; never mutates state), RM261003ABZP-DES5@R2 (every action is a named command; keys bind through the keymap trie), RM261003ABZP-DES9@R3 (`layoutText` returns `RenderLine[]` for visible rows only from text plus decorations; `StyleToken` names, never colours), RM261003ABZP-DES10@R2 (shell regions, editor views by editor kind, widget painters by type, input normalization, image tiers, restore), RM261003ABZP-DES17@R1 (file type per buffer; refused binary and oversized files), RM261003ABZP-DES16@R1 (no whole-document work per keystroke).
- **Content constraints:** English UI copy; vim-style error codes (`E492`); toasts and logs carry paths, never note content (UREQ1@R2); dates in the configured format; refused-file messages use the exact system texts `binary file — not opened` and `file too large — not opened (limit 16 MiB)` (RM261003ABZP-REQ1@R3).
- **Platform constraints:** monospace cell grid; 16/256/truecolor; minimum 80×24; kitty keyboard protocol optional; mouse optional (RM261003ABZP-REQ11@R3). Browser page: evergreen browsers, ≥ 375 px.
- **Existing design-system constraints:** None in the codebase (greenfield). Visual authority: `ui-mockups/shared/terminal.css` (shared R1) token set — dark (tokyonight-like), light, nocolor.
- **Accepted assumptions:** A:Leader map, A:`:` command line, A:Extra keys, A:Visual language, A:Behaviour details, A:Browser preview page, A:Accessibility (manifest Assumptions, accepted by AD3). Mockup sample data and clock are illustrative only.

## Required System Support

| UI Design | Required System Support | Current Coverage |
|---|---|---|
| RM261003ABZP-UDES1@R2 | `AppState` windows (split tree, active, content by editor kind), panels (explorer, side-panel kind), notifications, index status, preview status; active buffer's `fileType` and `view` (statusline segments); outline from `Doc` headings; backlinks count from `NoteIndex`; save failure and retry state | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ9@R3; RM261003ABZP-DES2@R2 (AppState), RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1 (save failure flow), RM261003ABZP-DES10@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES17@R1 |
| RM261003ABZP-UDES2@R1 | Mode in `AppState.vim`; keymap modes incl. `explorer`, `picker`, `base`; ex-command errors; cursor shape | RM261003ABZP-REQ2@R2; RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2 (`Mode` union), RM261003ABZP-DES10@R2 |
| RM261003ABZP-UDES3@R2 | `layoutText` over the view's decoration providers (Markdown `livePreview` with reveal rules and block renderers; highlighter `mark` decorations), `line` decorations carrying the `▕` sign, `StyleToken`s, selection-aware reveal; the buffer's file type and highlighter; note-only commands limited by `filetypes` | RM261003ABZP-REQ5@R2, RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4; RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES17@R1 |
| RM261003ABZP-UDES4@R1 | Task toggle command; callout fold and embed expand state per window passed into layout; image tier selection; `preview.embedMaxRows`, `preview.images` config | RM261003ABZP-REQ5@R2; RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1; `windows[].content.folds` and `TextView.folds` (RM261003ABZP-DES2@R2, RM261003ABZP-DES9@R3) |
| RM261003ABZP-UDES5@R2 | Command registry `list(activeFiletype)` with titles, ids, bindings, and override flags; keymap `lookup({mode, filetype})` prefix items merged across scopes, with each binding's scope for help; workspace file list over all non-excluded files; worker full-text search over notes and text files; recent files from state file; headings, tags, backlinks from index | RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3; RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1 |
| RM261003ABZP-UDES6@R1 | `[[` completion data (names, aliases, headings, block ids); `resolveLink`; jump list persisted; unlinked mentions via full-text search; `planRename` impact before confirm; link an unlinked mention by writing a span edit to another file; create-on-unresolved | RM261003ABZP-REQ4@R3, RM261003ABZP-REQ3@R4; RM261003ABZP-DES7@R3 (resolve, rename, search), RM261003ABZP-DES8@R1 (write), RM261003ABZP-DES14@R1 (jumps); `link.linkMention` (RM261003ABZP-REQ4@R3, RM261003ABZP-DES7@R3) |
| RM261003ABZP-UDES7@R2 | Explorer create/rename/move/delete effects; trash availability result; `planRename` for move preview; conflict state with keep/take/diff; line diff of buffer vs disk; autosave paused while a conflict is open; undoable reload; `readTextFile` refusal (`fileRefused` with `binary` or `tooLarge`) and its notification | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ4@R3; RM261003ABZP-DES2@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1 (conflict rules, trash, view diff), RM261003ABZP-DES17@R1 (open policy) |
| RM261003ABZP-UDES8@R1 | `note.today/yesterday/tomorrow/pickDate`, `template.insert`, `note.new`; existing daily notes for calendar marks from `NoteIndex` paths; template preview via `expandTemplate`; `[daily] format` | RM261003ABZP-REQ6@R2; RM261003ABZP-DES11@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1; overlay variants `calendar` and `completion` (RM261003ABZP-DES2@R2) |
| RM261003ABZP-UDES9@R1 | `TableModel`/`KanbanModel`, sort/group/filter toggles, cell write-back with frontmatter patch (diff for toast), move restrictions, layout fallback notice, base embed renderer | RM261003ABZP-REQ7@R2, RM261003ABZP-REQ5@R2; RM261003ABZP-DES12@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES8@R1 |
| RM261003ABZP-UDES10@R2 | Routes `/`, `/events`, `/render`, `/file/*`, `/assets/*`; `doc` SSE events with the cursor `line`; Host check; KaTeX/Mermaid served locally under a Content Security Policy that allows code, styles, fonts and connections only from the server's own origin, and images also from the web, with a render error showing that block's source; a server-sent signal distinguishing an intentional `:PreviewStop` from a lost connection (`Stopped` badge) | RM261003ABZP-REQ8@R2; RM261003ABZP-DES13@R3; `stopped` SSE event (RM261003ABZP-DES13@R3) |
| RM261003ABZP-UDES11@R1 | Theme tokens and `NO_COLOR` handling, `theme`/`color` config, narrow-layout decisions from terminal size, mouse events normalized to actions | RM261003ABZP-REQ11@R3, RM261003ABZP-REQ3@R4; RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES2@R2 (`resize`, `mouse` actions) |

# 2. Experience Architecture

## Information Architecture

```text
so (terminal)
├── Shell (always present)
│   ├── Bufferline
│   ├── Explorer (docked | floating at 80×24)
│   ├── Editor windows (split tree) ── each with winbar
│   │   ├── Note in live | source | reading
│   │   ├── Other text file in source (syntax colouring when recognized)
│   │   └── Base view (table | kanban)
│   ├── Side panel (backlinks | outline) (docked | picker at 80×24)
│   ├── Statusline
│   └── Command / message line
├── Overlays (one at a time, modal)
│   ├── Which-key
│   ├── Picker family: files · recent · grep · headings · tags · backlinks · commands · templates · move-target
│   ├── Help (keymap)
│   ├── Prompt: confirm · input · typed confirm · rename impact
│   ├── Conflict dialog → Diff view
│   └── Calendar
├── Inline popups (non-modal, Insert mode)
│   ├── [[ completion
│   └── : command completion
└── Toast stack (non-modal, top-right)

Browser (only while :Preview runs)
└── Preview page: header (path, connection badge, theme toggle) · rendered note · follow banner
```

## Experience Model

```text
open folder (so ~/notes)
    → shell with last layout restored, first frame immediately, index in background
    → write in live preview (Normal ⇄ Insert), autosave
    → navigate: gd / [[ / pickers / backlinks / calendar / Bases
    → feedback: statusline segments, toasts, prompts for anything destructive
    → next: follow, split, :Preview for reading, or :q (state persisted)
```

## Navigation Model

- **Primary navigation:** buffers in editor windows. Switch by picker (`<leader>ff`, `<leader>fr`), link (`gd`/`Enter`), explorer `Enter`, bufferline click, or `:bn`/`:bp`.
- **Secondary navigation:** side panel (backlinks/outline), calendar, Bases views, help.
- **Context preservation:** every buffer keeps cursor, scroll, view mode, and folds per window (non-Markdown buffers have one view, `source`); the jump list records cross-note jumps and persists per workspace (RM261003ABZP-DES14@R1); closing an overlay restores the exact previous focus.
- **Back and dismissal behavior:** `Esc` closes the topmost overlay or popup, cancels a pending key prefix, or leaves Insert/Visual/Command; `Ctrl-o`/`Ctrl-i` move through jumps; `q` leaves diff, help, and side-panel focus.
- **Deep-link behavior:** `so <path>` opens a folder or a file in its folder (RM261003ABZP-REQ1@R3). Browser: the URL path follows the shown note; reloading the page shows that note.

# 3. Surfaces and Navigation

## Surface Inventory

| Surface | Purpose | Entry | Exit | Accepted Mockup | Detailed Design |
|---|---|---|---|---|---|
| Application shell | Host every feature; show mode, save, index, preview status | `so [path]` | `:q` on last window, `:qa` | RM261003ABZP-M1@R1 | Surface: Application shell |
| Editor window | Edit and render a note | open a note | close window/buffer | RM261003ABZP-M2@R1, RM261003ABZP-M1@R1 | Surface: Editor window |
| Overlays | Discover and run commands; find notes | `Space`, `<leader>f*`/`s*`, `:`, `<leader>?` | `Esc`, `Enter` | RM261003ABZP-M3@R1 | Surface: Overlays |
| Links and backlinks | Complete, follow, inspect, rename links | `[[`, `gd`, `<leader>lb`, `<leader>lr` | `Esc`, `Ctrl-o` | RM261003ABZP-M3@R1, RM261003ABZP-M4@R1 | Surface: Links and backlinks |
| File operations and disk changes | Manage files; resolve external changes | explorer `a r m d`; watcher event | prompt answer | RM261003ABZP-M4@R1, RM261003ABZP-M1@R1 | Surface: File operations and disk changes |
| Daily notes and templates | Daily capture and templating | `<leader>nd/np/nt/nn`, `:Today` | note opened, `Esc` | RM261003ABZP-M5@R2 | Surface: Daily notes and templates |
| Bases views | Structured notes as table/Kanban | open `.base`, `Enter` on embed | switch buffer | RM261003ABZP-M6@R1 | Surface: Bases views |
| Browser preview page | Full-fidelity read-only reading | `:Preview` | `:PreviewStop`, close tab | RM261003ABZP-M7@R1 | Surface: Browser preview page |

## Surface Relationships

```text
Application shell
├── Space (pause) → Which-key → command → any surface
├── <leader>ff / fr / sg / sb / sc → Picker → Enter → Editor window
├── gd / Enter on link → Editor window (target) ── unresolved → Prompt (create)
├── <leader>lb → Side panel (backlinks) ── 80×24 → Picker (backlinks)
├── explorer a/r/m/d → Prompt ── m → Picker (move target) → Prompt (impact)
├── watcher conflict → Conflict dialog → d → Diff view → k/t → Editor window
├── <leader>np → Calendar → Enter → Editor window (daily note)
├── open .base / Enter on base embed → Bases views
└── :Preview → Browser preview page (follows the active note; a non-Markdown buffer leaves the last note shown)
```

## Content Priority

| Surface | Primary Content | Supporting Content | Primary Action | Secondary Actions |
|---|---|---|---|---|
| Application shell | active note | tree, buffers, status segments | edit | split, toggle panels |
| Editor window | rendered note text | sign column, winbar | edit/navigate | fold, toggle task, follow link |
| Overlays | result list | query, preview pane, key hints | open selection | move selection, refine query |
| Links and backlinks | link targets / mentions | context lines, jump index | open target | link mention, rename |
| File operations | prompt question with impact | target path | confirm | cancel |
| Daily notes and templates | calendar / template preview | existing-note marks | open/insert | page month, today |
| Bases views | rows / cards | toolbar, summary row | edit cell / move card | sort, group, filter, switch view |
| Browser preview page | rendered note | path, connection badge | read, follow wikilink | theme toggle, follow terminal |

# 4. Interaction Flows and State Transitions

## Primary Flows

### Startup and first edit

```text
so ~/notes
    → first frame: shell + last layout + opened note; statusline "◌ indexing 0/10,000"
    → user types (i … Esc) → ● dirty → autosave ~1 s → ● cleared
    ├→ index completes → toast "✓ Index ready · 10,000 notes · 2.4 s"; backlinks count appears
    └→ index worker fails → error toast "index unavailable — restarting"; link features show "index unavailable"; editing unaffected
```

### Discover and run a command

```text
Space → (300 ms) which-key root → n → +notes → d
    → note.today runs → daily note opens
    └→ Esc at any level → overlay closes, focus restored
```

### Find a note

```text
<leader>ff → picker (query empty, recent first) → type "srd" → ranked, matches highlighted
    → Ctrl-n/↓ → preview updates → Enter → note opens in active window, jump recorded
    └→ no results → "No matches" row; Enter does nothing
```

### Open a non-Markdown file

```text
<leader>ff → type "sync" → Enter on scripts/sync.ts → source view, TypeScript colouring
    → statusline "NORMAL │ source │ scripts/sync.ts │ … │ Ln:Col" (no backlinks or words)
    → edit, autosave as for notes; <leader>: lists no note-only commands
    ├→ :link.follow → message line "not available for typescript files"; nothing changes
    └→ Enter on photo.png in the explorer → message line "binary file — not opened"; active buffer unchanged
```

### Follow, complete, and rename links

```text
Insert: [[ → completion (notes/aliases) → # → headings → Enter inserts [[note#Heading]]
Normal: gd on [[plan#Goals]] → target opens at heading → statusline "jump 3/3" → Ctrl-o back
    └→ unresolved → prompt "Create projects/plan.md? [y/N]" → y creates and opens; other key cancels
<leader>lr → prompt with impact "31 links in 12 files" → Enter → renamed → toast "12 files updated"
    └→ some writes fail → error toast listing failed paths (RM261003ABZP-DES7@R3 failure rule)
```

### Resolve an external change

```text
watcher: file changed on disk
    ├→ buffer clean → reload → notice "Reloaded from disk — u to undo"
    └→ buffer dirty → conflict dialog (autosave paused for that note)
          ├→ k keep mine → save buffer over disk
          ├→ t take disk → reload (undoable)
          └→ d diff → side-by-side → k/t resolve, q back to dialog
```

### Daily note and template

```text
<leader>nd → daily/<date>.md exists? open : create from template, cursor in first task
<leader>np → calendar (today underlined, • existing) → h/j/k/l, H/L → Enter → open or create
<leader>nt → template picker (source above expanded preview) → Enter → inserted at cursor (one undo step)
<leader>nn → title prompt → template picker ((blank note) first) → note opens in Insert at first empty bullet
```

### Edit a Base

```text
open tasks.base → table (toolbar, grouped rows) → i on cell → editor by type → Enter
    → write property → toast with frontmatter diff
    └→ invalid value → inline error in cell editor; Esc restores old value
v / Tab / 1–4 → Kanban → H/L moves card → property written → toast diff
    └→ grouped by formula → "⊘ moves off" + explanation toast
```

### Preview in the browser

```text
:Preview → browser opens 127.0.0.1:<port>/<path> → badge "Live"
    → edit in so → changed blocks highlighted briefly (< 300 ms)
    → click wikilink → page shows target + banner "Following so paused — Follow so"
    ├→ SSE drops → "Reconnecting…" (last version kept) → reconnect → "Live"
    ├→ :PreviewStop → "Stopped" + message (`stopped` SSE event, RM261003ABZP-DES13@R3)
    └→ so not running → "Offline" + last copy, navigation disabled
```

## Cross-Surface Transitions

| From | Trigger | To | Preserved Context | Focus or Scroll Result |
|---|---|---|---|---|
| Editor window | `Space` pause | Which-key | pending prefix | which-key bottom; editor cursor unchanged |
| Any overlay | `Esc` | previous surface | everything | focus returns to the element focused before opening |
| Picker | `Enter` | Editor window | picker query discarded; jump recorded | cursor at match line (grep/headings) or last position (files) |
| Editor window | `gd` | Editor window (target) | source position pushed to jump list | cursor at heading/block, scrolled to ⅓ from top |
| Editor window | `Ctrl-o` | previous jump | jump index | cursor and scroll restored |
| Explorer | `Enter`/`l` | Editor window | explorer selection | focus moves to editor |
| Side panel | `Enter` | Editor window | panel stays open | cursor at mention line |
| Watcher event | dirty conflict | Conflict dialog | buffer text and disk text | dialog focus; editor input blocked |
| Calendar | `Enter` | Editor window | — | cursor in first task of daily note |
| Base embed | `Enter` | Bases views | view name | focus on first row/card of that view |
| Editor window | `:Preview` | Browser page | active buffer | page scrolled near cursor's heading |

## State Model

```text
shell
├── normal ── i/a/o → insert ── Esc → normal
│          ── v/V → visual ── Esc/op → normal
│          ── : → command ── Enter/Esc → normal
│          ── Space → pending(prefix) ── key → command | Esc → normal
├── overlay(open) ── Enter → action → overlay(closed) | Esc → overlay(closed)
├── conflict(open) ── k | t → resolved ;  d → diff ── q → conflict(open)
└── background: index(empty → indexing n/total → ready | unavailable), save(clean ⇄ dirty → saving → clean | failed(retry))
```

## State Policies

- **Default:** shell with explorer docked (≥ 100 cols), editor focused in Normal mode, live preview.
- **Loading:** never blocks input; shown as statusline segments (`◌ indexing n/total`, `◌ saving`) and picker rows (`searching…` with spinner glyph `◌`), never a full-screen spinner.
- **Empty:** pickers show `No matches` (or `No backlinks`, `No templates in templates/`) as a dim row; an empty folder shows the explorer root with `a to create a note`; an empty note shows `-- empty --` dim in reading mode only.
- **Error:** command errors in the message line (vim style, red, persists until next key); background errors as error toasts that stay until dismissed (`Esc` in message focus or `:messages clear`); save failure in the statusline until resolved.
- **Success:** brief info toasts (3 s) for multi-file results (rename, move, Bases writes); single saves are silent (● clears).
- **Disabled:** disabled actions are visible with a reason (Kanban `⊘ moves off`, typed-confirm `Enter` disabled until match, reading-mode edit hint); never silently ignored.
- **Overflow:** lists scroll with the selection kept visible and a `n/total` counter; long paths middle-truncate (`projects/…/plan.md`); table columns that do not fit show `› +N cols`; Kanban columns show `↓ N more`.

# 5. Cross-Cutting UI Policies

## Responsive Strategy

| Viewport or Condition | Layout Strategy | Content Priority | Navigation | Interaction Change |
|---|---|---|---|---|
| ≥ 120 cols | explorer (30 cols) + editor + optional side panel (36 cols) | editor first | all regions docked | None |
| 100–119 cols | explorer docked; side panel replaces part of editor only when toggled | editor | docked | None |
| < 100 cols (incl. 80×24) | explorer and side panel become floating overlays over the editor | editor fills width | `<leader>e` toggles float; backlinks open as picker | statusline drops view/words/preview segments; pickers drop preview pane |
| < 24 rows | overlays cap height to rows − 4; which-key wraps columns | active line | same | None |
| Bases at < 100 cols | hide overflowing columns behind `› +N cols`; Kanban truncates column names | key columns (title, status) | `l`/`h` scroll columns | None |
| Browser < 640 px | header wraps; margins 16 px; wide tables/code scroll inside their box | note body | same | None |

Thresholds derive from the accepted 120×36 and 80×24 mockups (M1 S12, M3 S16, M4 S18, M5 S14, M6 S15–S16) and M7 S10.

## Visual System

- **Tokens:** theme tokens named after RM261003ABZP-DES9@R3 `StyleToken`s plus chrome tokens, with values from `ui-mockups/shared/terminal.css` (shared R1): `fg fg-dim fg-muted bg bg-dark bg-float bg-hl bg-sel cursorline border border-hl h1…h6 h1-bg…h3-bg link wikilink tag code code-bg kw str num fn type cmt quote note tip warning danger hl-bg hl-fg match-bg add-fg add-bg del-fg del-bg mode-normal mode-insert mode-visual mode-cmd mode-fg error warn info ok`.
- **Typography:** terminal font; emphasis by bold/italic/underline/strikethrough attributes; headings by glyph prefix (`█ ▊ ▌ ▏` for H1–H4, H5–H6 bold) plus background band for H1–H3 (A:Visual language).
- **Color:** dark (tokyonight-like) default, light (tokyonight-day-like); truecolor with 256-colour fallback mapping; `NO_COLOR` collapses all colours to fg/bg (policy below).
- **Spacing and layout:** cell grid; 1-cell padding inside floats; borders with rounded box-drawing (`╭╮╰╯`) for floats, single lines for splits.
- **Shape and elevation:** floats use `bg-float` and a border; the focused float border uses `border-hl`; nothing else has elevation.
- **Iconography and imagery:** plain Unicode glyphs only (no Nerd Font requirement): `● ◌ ✓ ⚠ ✗ ▸ ▾ ☐ ☑ ▕ › ↓ ⊘ •`; images per tier (RM261003ABZP-UDES4@R1).
- **Motion:** None in the terminal (instant redraw); browser page: 600 ms background fade on changed blocks, disabled under `prefers-reduced-motion`.

## Content and Feedback

- **Terminology:** "note", "folder", "workspace" (never "vault"); "backlinks", "unlinked mentions"; "daily note"; "template"; "base", "view", "table", "board"/"Kanban"; "Trash".
- **Labels and actions:** keys shown in angle brackets for chords (`<C-o>`), plain for letters; which-key and palette show the command title in sentence case; prompts end with the default in brackets (`[y/N]`).
- **Validation:** inline in the active editor (cell editor, prompt input) on each keystroke; message stays until the value is valid or `Esc`.
- **Status and feedback:** statusline for persistent state (mode, dirty, index, preview, save failure, jump index); message line for command results and errors; toasts for background results and multi-file effects; dialogs only for destructive or conflicting actions.
- **Truncation and overflow:** middle-truncate paths, end-truncate titles with `…`, never truncate the mode badge or dirty marker; toast text wraps up to 4 lines.
- **Localization:** None — English only in v1; dates follow `[daily] format`.

## Accessibility

- **Semantics:** terminal UI has no DOM semantics; meaning is carried by text labels (mode badge text, `[y/N]`, `⊘ moves off`) and glyphs, never colour alone.
- **Keyboard and focus:** every action has a keyboard path (mouse optional, RM261003ABZP-DES10@R2); the hardware cursor is placed on the focused row or cell in lists, tables, and calendars so screen readers and magnifiers follow focus; overlays trap focus until closed; focus restores on close.
- **Contrast:** dark and light token pairs keep body text ≥ 4.5:1 and UI glyphs ≥ 3:1 against their background; NO_COLOR relies on terminal defaults.
- **Motion and zoom:** no terminal animation; layout reflows on resize (`resize` action) at any terminal font size; browser page reflows at 200% zoom without horizontal scroll.
- **Assistive technology:** state changes that matter are written as text to the message line or statusline (e.g. `Reloaded from disk — u to undo`), which terminal screen readers read; the browser page uses semantic headings, `aria-live="polite"` on the connection badge, real `<a>` links, and disabled `<input type=checkbox>`.

# 6. Component System

## Component Inventory

| Component | Responsibility | States | Existing or New | Accepted Mockup | Detailed Design |
|---|---|---|---|---|---|
| Shell | region layout, focus routing, overlay stacking | wide, medium, narrow | new | RM261003ABZP-M1@R1 | Surface: Application shell |
| Explorer | folder tree, file ops entry | docked, floating, focused, empty | new | RM261003ABZP-M1@R1, RM261003ABZP-M4@R1 | Surface: File operations and disk changes |
| Bufferline | open buffers, modified marker | default, overflow | new | RM261003ABZP-M1@R1 | Surface: Application shell |
| EditorView + winbar | paint `RenderLine[]`, cursor, widgets (image, embed, base, rule) | live, source, reading, revealed, selection, non-Markdown source | new | RM261003ABZP-M2@R1 | Surface: Editor window |
| Side panel | backlinks, outline | backlinks, outline, empty | new | RM261003ABZP-M1@R1, RM261003ABZP-M4@R1 | Surface: Links and backlinks |
| Statusline | persistent state segments | full, narrow, save-failed, indexing | new | RM261003ABZP-M1@R1 | Component: Statusline |
| Command line | ex/named commands, completion, messages | idle, typing, completing, error | new | RM261003ABZP-M1@R1, RM261003ABZP-M3@R1 | Component: Command line |
| Which-key | prefix hints | root, group, wrapped | new | RM261003ABZP-M3@R1 | Component: Which-key |
| Picker | fuzzy list with preview, many sources | empty query, filtering, no matches, narrow | new | RM261003ABZP-M3@R1, RM261003ABZP-M5@R2 | Component: Picker |
| Help | keymap listing | default, filtered | new (Picker source with grouped rows) | RM261003ABZP-M3@R1 | Surface: Overlays |
| Completion popup | `[[` completion | notes, headings, blocks | new | RM261003ABZP-M3@R1 | Component: Completion popup |
| Prompt | confirm, input, typed confirm, impact | default, invalid, disabled | new | RM261003ABZP-M4@R1, RM261003ABZP-M5@R2 | Component: Prompt |
| Conflict dialog + Diff | external-change resolution | dialog, diff | new | RM261003ABZP-M4@R1 | Component: Conflict dialog and diff |
| Toast stack | background feedback | info, warn, error, stacked | new | RM261003ABZP-M1@R1 | Component: Toast stack |
| Calendar | month grid date picker | current, paged, narrow | new | RM261003ABZP-M5@R2 | Component: Calendar |
| Base toolbar | base name, views, filter/sort, count | default, moves off, notice | new | RM261003ABZP-M6@R1 | Surface: Bases views |
| Base table + cell editor | grid, sort, group, cell edit | default, editing, invalid, overflow | new | RM261003ABZP-M6@R1 | Component: Base table |
| Kanban board | columns, cards, moves | default, moving, moves off, overflow | new | RM261003ABZP-M6@R1 | Component: Kanban board |
| Theme | tokens → terminal attributes | dark, light, nocolor | new | RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 | Component: Theme |
| Preview page | read-only browser rendering | live, reconnecting, stopped, offline, paused-follow | new | RM261003ABZP-M7@R1 | Surface: Browser preview page |

## Composition Model

```text
Shell (src/ui/shell.ts)
├── Bufferline (src/ui/views/bufferline.ts)
├── Body
│   ├── Explorer (src/ui/views/explorer.ts) — docked or floating
│   ├── WindowTree → editorViews[content.editor]: EditorView + Winbar (src/ui/editors/text-view.ts) | BaseView (src/ui/editors/base-view.ts)
│   │   └── widget rows painted by widgetPainters[type] (src/ui/widgets/)
│   └── SidePanel (src/ui/views/side-panel.ts)
├── Statusline (src/ui/views/statusline.ts)
├── CommandLine (src/ui/views/cmdline.ts)
├── OverlayHost (src/ui/overlays/host.ts)
│   └── one of: WhichKey | Picker | Prompt | Conflict/Diff | Calendar | Help
├── InlinePopup: CompletionPopup (src/ui/overlays/completion.ts)
└── ToastStack (src/ui/overlays/notify.ts)
Theme (src/ui/theme.ts) — consumed by every painter
```

# 7. Detailed UI Design

This section is the canonical implementation-facing UI specification. Higher-level sections reference these entries instead of repeating their details.

Code previews are proposed design shapes, not production-complete implementations or task instructions. They use TypeScript in `src/ui/*` and read `AppState` / dispatch `Action`s as defined by RM261003ABZP-DES2@R2.

## Surface: Application shell

- **Purpose:** host all regions and route focus and overlays.
- **Users and tasks:** every user task starts here.
- **Requirements:** RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ11@R1
- **UI decisions:** RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES11@R1
- **Accepted mockups:** RM261003ABZP-M1@R1 (S1–S14)
- **System dependencies:** RM261003ABZP-DES2@R2 (AppState, Action), RM261003ABZP-DES10@R2 (shell), RM261003ABZP-DES7@R3 (index status), RM261003ABZP-DES8@R1 (save failure)
- **Success criteria:** RM261003ABZP-US1@R2, RM261003ABZP-US9@R1
- **Verification:** RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1, RM261003ABZP-UV10@R1
- **Entry:** `so [path]`; restored layout from state file (RM261003ABZP-DES14@R1).
- **Exit:** `:q` on the last window or `:qa` → autosave flush → terminal restored.

### Region Hierarchy

```text
Shell
├── Bufferline (row 1)
├── Body (rows 2 … h−2)
│   ├── Explorer (left, 30 cols) — floating when < 100 cols
│   ├── WindowTree (center) — splits with winbars
│   └── SidePanel (right, 36 cols, when toggled) — picker when < 100 cols
├── Statusline (row h−1)
└── CommandLine / messages (row h)
Overlays and toasts paint above Body.
```

### Content and Action Hierarchy

1. Active window text and cursor.
2. Mode badge, dirty marker, save failure (statusline).
3. Explorer tree and bufferline (navigation).
4. Side panel, index/preview/word segments.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | explorer, editor, statusline | all keymaps | None | editor focused |
| Loading | first frame + `◌ indexing n/total` | editing; link features show "index unavailable" until ready | `✓ Index ready` toast | message line text on completion |
| Empty | explorer root + hint `a to create a note`; editor shows welcome text with `<leader>ff`, `<leader>nd` hints | create, open | None | explorer focused |
| Error | statusline `save failed: <reason> · retry in 4s`; error toasts | `:w` retry, `Esc` dismiss toast | persistent until resolved | message line text |
| Success | ● clears after save | — | silent | None |
| Disabled | None — shell never disables globally | — | — | — |
| Overflow | bufferline scrolls with `‹ ›`; winbar title middle-truncated | `:bn`/`:bp` | — | — |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| `<leader>e` | any | toggle explorer (docked or float) | panels.explorer toggled | focus to explorer when shown as float | — |
| `<leader>o` / `<leader>lb` | note buffer | side panel shows outline / backlinks | panels.side = kind | stays in editor | index not ready → panel shows `index unavailable` |
| `:vs` / `:sp` | any | split active window | new window with same buffer | new window focused | — |
| `Ctrl-w h/j/k/l` | ≥ 2 windows or panel | move focus | active window changes | cursor in target | no neighbour → no-op |
| mouse click on explorer row / buffer | mouse reporting on | select/open | as keyboard | as keyboard | — |
| terminal resize | — | re-layout using thresholds | responsive class changes | focus kept | — |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| ≥ 120×36 | bufferline, explorer │ editor │ panel, statusline, cmdline | all docked | editor | None |
| 80×24 | bufferline, editor, statusline, cmdline | explorer/panel float on demand; statusline keeps `MODE │ path ● │ backlinks │ index │ Ln:Col` | editor | backlinks via picker |

### Accessibility Specification

- **Landmarks and headings:** None — terminal; regions are separated by borders and labelled by their first row (`NOTES ~/notes`, winbar title).
- **Names and descriptions:** mode badge text names the mode; segments use text, not icons alone.
- **Keyboard sequence:** `Ctrl-w` moves between explorer, windows, and panel; `<leader>e` returns from explorer.
- **Focus entry, movement, and restoration:** hardware cursor always at the focused element; closing explorer float restores the editor cursor.
- **Announcements:** completion and failure text written to the message line.
- **Zoom and reflow:** reflows on every `resize`.

### Components

- Bufferline — open buffers — see Surface: Application shell (this entry)
- Explorer — navigation and file ops — see Surface: File operations and disk changes
- EditorView — see Surface: Editor window
- SidePanel — see Surface: Links and backlinks
- Statusline — see Component: Statusline
- Command line — see Component: Command line
- Toast stack — see Component: Toast stack

### Applicable Code Shape

- **Target:** `src/ui/shell.ts` — `createShell`
- **Language and framework:** TypeScript, OpenTUI (`@opentui/core`)
- **System-design authority:** RM261003ABZP-DES10@R2 (`createShell`), RM261003ABZP-DES2@R2 (`Store`)

```ts
export type LayoutClass = "wide" | "medium" | "narrow";
export const layoutClass = (cols: number): LayoutClass => (cols >= 120 ? "wide" : cols >= 100 ? "medium" : "narrow");

export function createShell(renderer: CliRenderer, store: Store) {
  const views = {
    bufferline: new Bufferline(renderer), explorer: new Explorer(renderer), windows: new WindowTree(renderer),
    side: new SidePanel(renderer), status: new Statusline(renderer), cmd: new CommandLine(renderer),
    overlays: new OverlayHost(renderer), toasts: new ToastStack(renderer),
  };
  store.subscribe((s) => {
    const lc = layoutClass(s.terminal.cols);
    views.explorer.place(s.panels.explorer, lc === "narrow" ? "float" : "dock");
    views.side.place(s.panels.side, lc === "narrow" ? "hidden" : "dock");
    for (const v of Object.values(views)) v.update(s, lc);
    renderer.requestRender();                     // coalesced to one frame per input burst (DES16)
  });
  renderer.keyInput.on("keypress", (e) => store.dispatch({ type: "key", key: normalizeKey(e) }));
}
```

`layoutClass` is the only place thresholds live; each view receives the same state and class and decides its own placement. The shell never changes state itself — narrow-mode backlinks become a picker because the `link.backlinks` command checks the layout class passed in its context, not because the view intercepts keys.

## Surface: Editor window

- **Purpose:** edit and render one buffer.
- **Users and tasks:** writing and reading notes; editing other text files in source view.
- **Requirements:** RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ3@R2, RM261003ABZP-UREQ4@R1
- **UI decisions:** RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1
- **Accepted mockups:** RM261003ABZP-M2@R1 (S1–S16), RM261003ABZP-M1@R1 (S2–S5)
- **System dependencies:** RM261003ABZP-DES9@R3 (`layoutText`, `TextView`, `Decoration`, `RenderLine`), RM261003ABZP-DES6@R1, RM261003ABZP-DES10@R2 (`EditorView`, `widgetPainters`, images), RM261003ABZP-DES17@R1 (file type, highlighter), RM261003ABZP-DES5@R2 (Markdown-scoped keys), RM261003ABZP-DES14@R1 (`preview.*`)
- **Success criteria:** RM261003ABZP-US2@R2
- **Verification:** RM261003ABZP-UV3@R2
- **Entry:** open a buffer in a window.
- **Exit:** `:bd`, `:q`, switch buffer.

### Region Hierarchy

```text
EditorView
├── Winbar (title, ● dirty, view mode when split)
├── Gutter: line numbers (relative optional) + sign column (▕ revealed line/block)
└── Text area: RenderLine rows, widgets (image, embed, base, rule) reserving rows
```

### Content and Action Hierarchy

1. Text at the cursor (revealed source on the cursor line/block).
2. Rendered surrounding text.
3. Sign column and numbers.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default (live) | rendered; cursor line inline source; ▕ in sign column | vim keys, `Enter`, `za`, `<leader>x`, `<leader>m` | None | cursor |
| Default (non-Markdown file) | every line raw, as Markdown source mode; syntax colouring when the language is recognized, plain text otherwise; no ▕ marks (AD4) | vim keys | None | cursor |
| Loading | None — buffers open synchronously (< 50 ms in source view and < 80 ms in live preview, RM261003ABZP-REQ9@R3); images show reserved rows with `◌` until decoded | all | — | — |
| Empty | empty buffer shows one empty line; reading mode shows `-- empty --` dim | edit | — | — |
| Error | block that failed to render shows its source with `⚠` in the sign column | edit | — | message line on hover-cursor: `render error: <kind>` |
| Success | — | — | — | — |
| Disabled | reading mode: edit keys refused | navigation | message `reading mode — <leader>m to edit` | — |
| Overflow | long lines soft-wrap (config `editor.wrap`), else horizontal scroll with `›` marker | — | — | — |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| `j`/`k` | any | reveal moves with cursor line; entering a multi-line block reveals the whole block | cursor moved | scroll keeps cursor ≥ 3 rows from edges | — |
| `v`/`V` | Normal | every selected line reveals source | visual | — | — |
| `Enter` / `<leader>x` on task | task line | `☐` ⇄ `☑` | buffer edited, autosave | — | — |
| `Enter` on link | link under cursor | follow (Links surface) | — | — | — |
| `za` | callout title or embed | fold/unfold callout; expand/collapse embed beyond `preview.embedMaxRows` | window fold set updated | cursor stays on title row | — |
| `<leader>m` | Markdown note | live → source → reading | buffer view mode | cursor kept | — |
| `<leader>m`, `gd`, `Enter` on link text, `<leader>x` | non-Markdown file | not bound: no view change, no link follow, no task toggle; `gd` does nothing in v1 | unchanged | — | — |
| `:view.cycle`, `:link.follow`, `:task.toggle` | non-Markdown file | message line `not available for <type> files` (e.g. `typescript`) | unchanged | focus back to editor | — |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| any width | gutter, text | tables wider than the window scroll horizontally inside the table block with `›`; images scale to window width (max 80% rows) | text | None |
| graphics tier | — | kitty/sixel image → block approximation → `[image: name]` | — | `preview.images` config |

### Accessibility Specification

- **Landmarks and headings:** heading lines carry level glyphs (`█ ▊ ▌ ▏`) so level is readable without colour.
- **Names and descriptions:** images show alt text in the placeholder tier and in the message line when the cursor is on the image row.
- **Keyboard sequence:** vim keys only.
- **Focus entry, movement, and restoration:** hardware cursor = text cursor; cursor shape bar in Insert, block in Normal (RM261003ABZP-REQ2@R2).
- **Announcements:** mode changes appear in the statusline badge.
- **Zoom and reflow:** soft wrap reflows on resize.

### Components

- EditorView — paints rows — see this entry (code shape below)
- Theme — token mapping — see Component: Theme

### Applicable Code Shape

- **Target:** `src/ui/editors/text-view.ts` — `EditorView`, `paintLine`
- **Language and framework:** TypeScript, OpenTUI
- **System-design authority:** RM261003ABZP-DES10@R2 (`EditorView`, `widgetPainters`), RM261003ABZP-DES9@R3 (`layoutText`, `TextView`, `RenderLine`)

```ts
export class EditorView extends Renderable {
  constructor(ctx: RenderContext, private getView: () => TextViewInput) { super(ctx, { flexGrow: 1 }); }
  protected renderSelf(buf: OptimizedBuffer) {
    const { view, providers, analysis } = this.getView();     // providers: highlighter marks + the view's providers (Markdown live: livePreview)
    layoutText(view, providers, analysis).forEach((line, row) => {
      paintGutter(buf, row, line.sourceLine, line.sign);      // ▕ reveal, ⚠ render error; none for plain source
      if (line.widget) widgetPainters[line.widget.type](buf, row, line.widget, theme); // image tiers: kitty | sixel | blocks | placeholder
      else paintSpans(buf, row, line.spans, theme);           // StyleToken → attributes via Theme
    });
  }
}
```

The view asks core for visible rows only and maps `StyleToken`s through the Theme; it never parses Markdown or any other language, so a TypeScript file and a note in source mode take the same paint path. `TextView.folds` (RM261003ABZP-DES9@R3) carries the window's fold/expand set from `AppState.windows[].content.folds` (RM261003ABZP-DES2@R2), as UDES4 requires.

## Surface: Overlays

- **Purpose:** discovery and search without leaving the keyboard.
- **Users and tasks:** find notes and files, find text, run commands, learn keys.
- **Requirements:** RM261003ABZP-UREQ5@R2
- **UI decisions:** RM261003ABZP-UDES5@R2
- **Accepted mockups:** RM261003ABZP-M3@R1 (S1–S11, S15, S16)
- **System dependencies:** RM261003ABZP-DES5@R2 (registry `list(filetype)`, keymap `lookup({mode, filetype})`), RM261003ABZP-DES7@R3 (file list, search, index), RM261003ABZP-DES14@R1 (recent files, overrides)
- **Success criteria:** RM261003ABZP-US3@R2
- **Verification:** RM261003ABZP-UV4@R2
- **Entry:** `Space` pause, `<leader>ff/fr/sg/sb/sc/:`, `:`, `<leader>?`, `:help`.
- **Exit:** `Esc`, `Enter`.

### Region Hierarchy

```text
Which-key: bottom float ── direct actions │ +groups (columns)
Picker:    centered float ── title │ query line │ results (n/total) │ preview pane (wide only) │ key hints
Help:      Picker layout with grouped rows (group header, key, title, scope label for file-type bindings, ● override)
```

### Content and Action Hierarchy

1. Results / key list.
2. Query line.
3. Preview pane and key hints.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | recent-first list over every non-excluded file; palette lists the commands available for the active file type | type, move, Enter, Esc | — | cursor on query; selection highlighted |
| Loading | grep: `◌ searching…` row; partial results stream in | type to refine | — | — |
| Empty | `No matches` (or source-specific empty text) | edit query, Esc | — | — |
| Error | grep worker error: `search unavailable — <reason>` row | Esc | error toast | — |
| Success | `Enter` closes and opens target | — | — | focus to target |
| Disabled | None — no disabled rows | — | — | — |
| Overflow | list scrolls with selection visible; counter `12/340` | `Ctrl-d/u` page | — | — |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| `Space` then pause 300 ms | Normal | which-key root | overlay whichKey | — | key before 300 ms → no popup, sequence continues |
| letter in which-key | group exists | descend; `Backspace` up | — | — | unknown key → popup closes, message `no mapping` |
| type in picker | — | re-filter ≤ 1 frame (files) / streamed (grep) | query updated | selection resets to top | — |
| `Ctrl-n`/`↓`, `Ctrl-p`/`↑` | results | move selection; preview updates | — | — | — |
| `Tab` in `:` line | completions | cycle | — | — | — |
| `Space` pause / `<leader>:` / `:` | non-Markdown buffer | which-key, palette, and completion omit Markdown-scoped keys and commands | — | — | — |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| ≥ 100 cols | query, results │ preview | 60/40 split | results | None |
| < 100 cols | query, results | preview dropped; full-width results (M3 S16) | results | None |

### Accessibility Specification

- **Landmarks and headings:** float title names the picker (`Find files`, `Grep`, `Commands`).
- **Names and descriptions:** each row shows title plus path/id; matched characters underlined in addition to colour.
- **Keyboard sequence:** query → results via `Ctrl-n/p`; no Tab trap.
- **Focus entry, movement, and restoration:** hardware cursor on query; on close, focus returns to prior element.
- **Announcements:** counter text `n/total` updates as text.
- **Zoom and reflow:** float sizes are percentages of the terminal, clamped to min 60×12.

### Components

- Which-key — see Component: Which-key
- Picker — see Component: Picker
- Command line — see Component: Command line

### Applicable Code Shape

None — composition is the Picker and Which-key component shapes below; a surface-level preview would repeat them.

## Surface: Links and backlinks

- **Purpose:** complete, follow, inspect, and rename links.
- **Users and tasks:** linking notes and navigating the graph.
- **Requirements:** RM261003ABZP-UREQ6@R1
- **UI decisions:** RM261003ABZP-UDES6@R1
- **Accepted mockups:** RM261003ABZP-M3@R1 (S12–S14), RM261003ABZP-M4@R1 (S1–S9, S18)
- **System dependencies:** RM261003ABZP-DES7@R3 (`resolveLink`, `planRename`, search), RM261003ABZP-DES14@R1 (jumps)
- **Success criteria:** RM261003ABZP-US4@R1
- **Verification:** RM261003ABZP-UV5@R1
- **Entry:** `[[` in Insert, `gd`/`Enter` on a link, `<leader>lb`, `<leader>lr`, `:jumps`.
- **Exit:** `Esc`, `Ctrl-o`, `q` from panel.

### Region Hierarchy

```text
Completion popup (below cursor line, above if no room)
Side panel: "BACKLINKS (7)" ── Linked mentions: path → context line(s) ── Unlinked mentions: path → context
Rename prompt: input with new name ── impact line "31 links in 12 files"
Jump indicator: statusline segment "jump i/n"; :jumps list in the message area
```

### Content and Action Hierarchy

1. Target or mention list.
2. Context lines / impact.
3. Key hints.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | panel with linked then unlinked | `j/k`, `Enter`, `l`, `q` | — | panel cursor on first mention |
| Loading | index not ready: panel `index unavailable — indexing n/total` | — | — | — |
| Empty | `No backlinks` / `No unlinked mentions` | — | — | — |
| Error | unresolved link in error colour (+ undercurl/underline under NO_COLOR) | `gd` → create prompt | — | — |
| Success | rename → toast `12 files updated` | — | toast | focus stays on renamed note |
| Disabled | rename prompt `Enter` disabled while name invalid (empty, exists, contains `/` outside folders) with reason | edit | inline message | — |
| Overflow | long mention lists scroll; context lines end-truncate | — | — | — |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| `[[` | Insert | popup with notes and aliases | completion open | popup never covers cursor line | — |
| `#` / `#^` after target | popup open | switch to headings / block ids of that target | — | — | target unresolved → `No headings` |
| `gd`/`Enter` | link under cursor | open target at heading/block; push jump | — | target at ⅓ | unresolved → prompt `Create <path>? [y/N]` |
| `Ctrl-o`/`Ctrl-i` | jumps exist | move in jump list; statusline `jump i/n` | — | restore cursor/scroll | end of list → no-op |
| `l` on unlinked mention | panel focus | rewrite mention as wikilink in that file | file written | mention moves to Linked | write fails → error toast; nothing changed |
| `<leader>lr` | note buffer | prompt with impact computed before Enter | — | prompt focus | partial failures listed in toast |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| ≥ 100 cols | panel docked right | — | mentions | None |
| < 100 cols | backlinks as picker (M4 S18) | panel hidden | mentions | `Enter` opens and closes picker |

### Accessibility Specification

- **Landmarks and headings:** panel sections titled `Linked mentions`, `Unlinked mentions` as text.
- **Names and descriptions:** each mention shows path and line number.
- **Keyboard sequence:** `<leader>lb` focuses panel; `q` returns.
- **Focus entry, movement, and restoration:** returning from a followed link with `Ctrl-o` restores the exact source cursor.
- **Announcements:** rename results and failures in toasts and message line.
- **Zoom and reflow:** context lines wrap to 2 rows max.

### Components

- Completion popup — see Component: Completion popup
- Prompt (create, rename) — see Component: Prompt
- Side panel — this entry

### Applicable Code Shape

None — panel rows are `NoteIndex` backlinks plus search results rendered as list rows; the Picker/Prompt shapes cover the interaction code.

## Surface: File operations and disk changes

- **Purpose:** manage files from the explorer and resolve external edits safely.
- **Users and tasks:** create, rename, move, delete; handle files changed by other programs; learn why a file did not open.
- **Requirements:** RM261003ABZP-UREQ7@R2
- **UI decisions:** RM261003ABZP-UDES7@R2
- **Accepted mockups:** RM261003ABZP-M4@R1 (S10–S17), RM261003ABZP-M1@R1 (S9)
- **System dependencies:** RM261003ABZP-DES8@R1 (atomic write, watcher, trash, conflict rules), RM261003ABZP-DES7@R3 (`planRename` for move/rename impact), RM261003ABZP-DES17@R1 (`readTextFile` refusal)
- **Success criteria:** RM261003ABZP-US5@R2
- **Verification:** RM261003ABZP-UV6@R2
- **Entry:** explorer focus (`<leader>e`, click) then `a r m d`; watcher events.
- **Exit:** prompt answers; `Esc`.

### Region Hierarchy

```text
Explorer: root label ── tree rows (▾/▸ folder, file glyph, name, ● dirty) ── inline input row (a/r)
Move: Picker (folders) with preview "→ projects/archive/plan.md · 31 links rewritten"
Delete: Prompt "Move to Trash? [y/N]" | typed-confirm "Permanently delete plan.md? Type the file name:"
Conflict: centered dialog (path, both modified times, k/t/d) → Diff (buffer │ disk, +/- lines)
Reload notice: message line "Reloaded from disk — u to undo"
Refused open: message line "binary file — not opened" | "file too large — not opened (limit 16 MiB)"
```

### Content and Action Hierarchy

1. The question and its consequence (impact, permanence).
2. The target path.
3. Key choices with default.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | tree | `j/k`, `Enter`/`l`, `h` collapse, `a r m d` | — | cursor on row |
| Loading | None — file ops complete before prompt closes (< 50 ms typical); large move shows `◌ rewriting links 4/12` in statusline | — | — | — |
| Empty | root only + `a to create a note` | `a` | — | — |
| Error | op fails → error toast with path and reason; tree unchanged. Open refused (binary, invalid UTF-8, > 16 MiB) → message line text; no buffer opens; active buffer and explorer selection unchanged | retry | toast / message line | — |
| Success | tree updates; rename/move toast with counts | — | toast | selection follows renamed item |
| Disabled | typed confirm: `Enter` disabled until exact name typed (M4 S14) | type, Esc | hint text | — |
| Overflow | deep trees scroll; names end-truncate with `…` | — | — | — |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| `a` | folder or file selected | inline input under that folder; trailing `/` = folder; `.md` added when the name has no extension, kept otherwise (`sync.ts`) | — | input focus | name exists → inline error |
| `r` | item selected | inline rename with impact line | renamed + links rewritten | selection on item | as above |
| `m` | item selected | folder picker with destination preview | moved | selection follows | — |
| `d` | item selected | trash prompt, or typed confirm when trash unavailable | deleted | selection to neighbour | trash fails → typed confirm offered |
| watcher change, buffer dirty | — | conflict dialog; autosave paused for that note | conflict open | dialog focus | — |
| `d` in dialog | — | diff view | — | diff focus | `q` back |
| watcher change, buffer clean | — | reload + notice | — | cursor kept on same line number | `u` undoes reload |
| `Enter`/`l` on a file, picker accept, `:e` | file is binary or > 16 MiB | message line refusal text | nothing opens; nothing written | focus stays | open another file |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| ≥ 100 cols | docked explorer; diff side by side | — | — | None |
| < 100 cols | floating explorer; diff stacked (buffer above disk) | — | changed lines | None |

### Accessibility Specification

- **Landmarks and headings:** dialogs titled `File changed on disk`, `Delete`.
- **Names and descriptions:** prompts state consequence in words (`permanently`, `to Trash`).
- **Keyboard sequence:** single-key answers; `Esc` = safe default (cancel / keep dialog open for conflicts).
- **Focus entry, movement, and restoration:** dialogs take focus; on resolve focus returns to the buffer.
- **Announcements:** message line text for reload and results.
- **Zoom and reflow:** diff switches to stacked below 100 cols.

### Components

- Explorer — this entry
- Prompt — see Component: Prompt
- Conflict dialog and diff — see Component: Conflict dialog and diff
- Picker (move target) — see Component: Picker

### Applicable Code Shape

None — explorer rows mirror `AppState.workspace.tree`; the interactive pieces are covered by the Prompt and Conflict component shapes.

## Surface: Daily notes and templates

- **Purpose:** daily capture and template insertion.
- **Users and tasks:** open today/adjacent days, pick a date, insert a template, create a templated note.
- **Requirements:** RM261003ABZP-UREQ8@R2
- **UI decisions:** RM261003ABZP-UDES8@R1
- **Accepted mockups:** RM261003ABZP-M5@R2 (S1–S14)
- **System dependencies:** RM261003ABZP-DES11@R1 (commands, `expandTemplate`, `formatDate`), RM261003ABZP-DES14@R1 (`[daily] folder/format/template`, `templates.folder`), RM261003ABZP-DES7@R3 (existing note paths)
- **Success criteria:** RM261003ABZP-US6@R1
- **Verification:** RM261003ABZP-UV7@R1
- **Entry:** `<leader>nd`/`:Today`, `:Yesterday`, `:Tomorrow`, `<leader>np`, `<leader>nt`, `<leader>nn`.
- **Exit:** note opened; `Esc`.

### Region Hierarchy

```text
Calendar float (36 cols fixed): month title ‹ › ── Mo Tu We Th Fr Sa Su ── day grid (• has note, today underlined, selection reversed) ── hints
Template picker: list │ preview (source with {{vars}} highlighted ▸ expanded result)
New note: Prompt (title → file name preview) → Template picker with "(blank note)" first
```

### Content and Action Hierarchy

1. Day grid / template list.
2. Preview of expanded template / target path.
3. Hints.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | current month, today selected | `h/j/k/l`, `H/L`, `t`, `Enter`, `Esc` | — | cursor on selected day |
| Loading | None — marks come from the in-memory index | — | — | — |
| Empty | no templates → picker `No templates in templates/` with hint to create one; daily created from built-in minimal template `# {{date}}` | — | — | — |
| Error | template file unreadable → error toast; daily note created empty | — | toast | — |
| Success | daily note created → toast `Created daily/2026-10-03.md from templates/daily.md` | — | toast | cursor in first task |
| Disabled | None | — | — | — |
| Overflow | None — calendar fixed size | — | — | — |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| `:Today` | — | open or create | buffer opened | first task / end of file | — |
| `:Yesterday`/`:Tomorrow` | — | relative to the open daily note, else today | — | — | — |
| `H`/`L` in calendar | — | page month keeping day number (clamped to month length) | — | — | — |
| `Enter` in calendar | — | open or create that day | — | — | — |
| `Enter` in template picker | buffer editable | insert expanded template at cursor (one undo step) | — | cursor after insertion | — |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| any (≥ 80×24) | calendar float centered | none (fixed 36×12) | grid | None |
| < 100 cols | template picker | preview dropped; source/expanded shown on `Tab` toggle | list | `Tab` toggles preview |

### Accessibility Specification

- **Landmarks and headings:** month title `October 2026` as text.
- **Names and descriptions:** existing-note days marked with `•` (glyph, not colour); today underlined.
- **Keyboard sequence:** grid navigation only; `t` today.
- **Focus entry, movement, and restoration:** hardware cursor on selected day.
- **Announcements:** message line shows `Sat 2026-10-03 · note exists` for the selected day.
- **Zoom and reflow:** fixed size fits 80×24.

### Components

- Calendar — see Component: Calendar
- Picker (templates) — see Component: Picker
- Prompt (title) — see Component: Prompt

### Applicable Code Shape

None — the Calendar component shape covers the only new interaction; template picking reuses Picker with a preview renderer.

## Surface: Bases views

- **Purpose:** structured notes as table or Kanban.
- **Users and tasks:** review and edit properties; move tasks across statuses.
- **Requirements:** RM261003ABZP-UREQ9@R1
- **UI decisions:** RM261003ABZP-UDES9@R1
- **Accepted mockups:** RM261003ABZP-M6@R1 (S1–S16)
- **System dependencies:** RM261003ABZP-DES12@R2 (`TableModel`, `KanbanModel`, write-back, fallback, move rules), RM261003ABZP-DES9@R3 (base embed renderer)
- **Success criteria:** RM261003ABZP-US7@R1
- **Verification:** RM261003ABZP-UV8@R1
- **Entry:** open a `.base` file; `Enter` on `![[x.base#View]]`.
- **Exit:** switch buffer; `Enter` on a row/card opens its note.

### Region Hierarchy

```text
BaseView
├── Toolbar: base name · view tabs (1 All tasks │ 2 Board …) · filter/sort summary · row count · notices (⊘ moves off, diagnostics)
├── Body: Table (header with sort arrow, group headers, rows, summary row, › +N cols) | Kanban (columns with counts, cards, ↓ N more)
└── Hint row: context keys
```

### Content and Action Hierarchy

1. Focused cell or card.
2. Rows/cards in view.
3. Toolbar status and notices.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default | table or Kanban per view | navigate, edit, sort, group, filter, switch view | — | cursor on focused cell/card |
| Loading | index not ready: `◌ waiting for index` in toolbar, empty body | switch view | — | — |
| Empty | `No notes match this view's filters` + filter summary | `f` toggle filter | — | — |
| Error | diagnostics notice for unsupported syntax (base still renders what it can); write failure toast | — | toast | — |
| Success | write toast with frontmatter diff (`- status: todo` / `+ status: doing`) | — | toast | focus stays on cell/card |
| Disabled | Kanban grouped by formula/file property: `⊘ moves off`; `H/L` explain why | navigate | toast explanation | — |
| Overflow | table `› +N cols` scroll with `l/h`; Kanban `↓ N more` scroll with `j/k` | — | — | — |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| `i` on cell | editable property | cell editor by type (text+suggestions, number with `Ctrl-a/x`, date `YYYY-MM-DD` with `Ctrl-a/x`, list chips) | editing | in cell | invalid → inline error; `Esc` restores |
| `x` on checkbox cell | boolean | toggle + write | — | — | write fails → toast, value restored |
| `s` / `g` / `f` | table | cycle sort / toggle grouping / toggle filter | view model re-evaluated | focus kept on same note | — |
| `H`/`L` on card | moves allowed | move to adjacent column, write property (`None` removes it) | — | card stays focused | disabled → explanation |
| `v` / `Tab` / `1–4` | — | view list / next / direct | view switched | first row/card | `cards`/`list`/`map` → table + notice, file untouched |
| `Enter` | row/card | open note | — | — | — |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| ≥ 100 cols | toolbar, body | all fitting columns | title, status | None |
| < 100 cols | toolbar (wraps tabs), body | hide overflow columns; Kanban column names truncate; cards 1-line | title | None |

### Accessibility Specification

- **Landmarks and headings:** toolbar names base and view as text.
- **Names and descriptions:** focused cell shows `column: value` in the message line; sort direction by `↑/↓` glyph.
- **Keyboard sequence:** `h/j/k/l` grid; `Tab` cycles views.
- **Focus entry, movement, and restoration:** hardware cursor on focused cell/card; returning from an opened note restores focus.
- **Announcements:** write toasts as text diff.
- **Zoom and reflow:** column hiding on resize.

### Components

- Base table — see Component: Base table
- Kanban board — see Component: Kanban board
- Toast stack — see Component: Toast stack

### Applicable Code Shape

None — view selection is a switch over `BaseViewModel` kinds produced by RM261003ABZP-DES12@R2; the table and board component shapes cover the UI.

## Surface: Browser preview page

- **Purpose:** read the current note at full fidelity in a browser.
- **Users and tasks:** reading, presenting, checking images/math/diagrams.
- **Requirements:** RM261003ABZP-UREQ10@R1, RM261003ABZP-UREQ11@R1
- **UI decisions:** RM261003ABZP-UDES10@R2, RM261003ABZP-UDES11@R1
- **Accepted mockups:** RM261003ABZP-M7@R1 (S1–S10)
- **System dependencies:** RM261003ABZP-DES13@R3 (routes, SSE, Host check, `renderHtml`)
- **Success criteria:** RM261003ABZP-US8@R1, RM261003ABZP-US9@R1
- **Verification:** RM261003ABZP-UV9@R2
- **Entry:** `:Preview` opens `http://127.0.0.1:<port>/<path>`.
- **Exit:** close tab; `:PreviewStop`.

### Region Hierarchy

```text
<body>
├── <header> path · connection badge (aria-live) · theme toggle
├── <div role="status"> follow banner (only when reader navigated away)
└── <main> <article> rendered note (callouts, tables, code, embeds, images, KaTeX, Mermaid, disabled task checkboxes)
```

### Content and Action Hierarchy

1. Article.
2. Connection badge and path.
3. Theme toggle, follow banner.

### State Matrix

| State | Visible Content | Available Actions | Feedback | Focus or Announcement |
|---|---|---|---|---|
| Default (Live) | current note; badge `Live` | read, click wikilinks, toggle theme | changed blocks fade-highlight | badge announced politely on change |
| Loading | first load: article skeleton text `Loading <path>…` | — | — | — |
| Empty | empty note: `This note is empty.` | — | — | — |
| Error | KaTeX/Mermaid render error: that block's source shown in a code block with a render-error label | — | inline label | — |
| Success | note switch swaps article ≤ 300 ms; URL path follows | — | — | focus stays at top of article |
| Disabled | `Offline`: navigation disabled, last copy shown with notice; `Stopped`: updates stop with message | theme toggle | badge text | announced |
| Overflow | wide tables/code scroll inside their box | — | — | — |

### Interaction Contract

| Trigger | Preconditions | Interface Response | Resulting State | Focus or Scroll | Failure Recovery |
|---|---|---|---|---|---|
| SSE `doc` event | following | fetch `/render`, swap, highlight changed blocks | — | scroll to the block containing the cursor line | fetch fails → keep last version, badge `Reconnecting…` |
| click wikilink | Live | navigate preview only; banner `Following so paused — Follow so` | paused-follow | top of target | unresolved → explain `create it in so with gd` |
| click `Follow so` | paused | resume following active buffer | Live | to the block containing the cursor line | — |
| SSE closes | — | `Reconnecting…` (EventSource retries) | — | — | server gone → `Offline` |
| `stopped` signal | — | badge `Stopped`, message | — | — | RM261003ABZP-DES13@R3 `stopped` event |
| theme toggle | — | override `prefers-color-scheme`, stored in `localStorage` (try/catch) | — | — | storage blocked → session only |

### Responsive Specification

| Viewport or Condition | Region Order | Layout Change | Content Priority | Control Change |
|---|---|---|---|---|
| ≥ 900 px | header, article (max 760 px centered) | — | article | None |
| 375–899 px | header wraps (path on its own line), article full width with 16 px margins | tables/code `overflow-x: auto` | article | None |

### Accessibility Specification

- **Landmarks and headings:** `<header>`, `<main>`, `<article>`; note headings map to `h1–h6`.
- **Names and descriptions:** badge has text (`Live`, `Reconnecting…`, `Stopped`, `Offline`), not colour alone; images use alt text.
- **Keyboard sequence:** Tab: theme toggle → banner button (when shown) → links in reading order.
- **Focus entry, movement, and restoration:** content swaps do not move focus.
- **Announcements:** badge in `aria-live="polite"`; banner `role="status"`.
- **Zoom and reflow:** reflows to 200% without horizontal page scroll.

### Components

- Preview page — this entry

### Applicable Code Shape

- **Target:** `src/preview/page.html` — inline module script `follow()`
- **Language and framework:** HTML + browser TypeScript-compatible JavaScript (served as a static page; no framework, RM261003ABZP-DES13@R3)
- **System-design authority:** RM261003ABZP-DES13@R3 (Preview HTTP routes)

```js
const badge = document.querySelector("[data-badge]");
let following = true;
const es = new EventSource("/events");
es.addEventListener("doc", async (e) => {
  const { path, line } = JSON.parse(e.data);
  if (!following) return;
  const html = await fetch(`/render?path=${encodeURIComponent(path)}`).then((r) => r.text());
  swapArticle(html, line); history.replaceState(null, "", `/${path}`); setBadge("Live");
});
es.addEventListener("stopped", () => { es.close(); setBadge("Stopped"); }); // server event per RM261003ABZP-DES13@R3
es.onerror = () => setBadge(es.readyState === EventSource.CLOSED ? "Offline" : "Reconnecting…");
```

The page is a passive renderer of `/render` fragments; `swapArticle` diffs top-level blocks to apply the brief highlight. No control posts to the server, satisfying the read-only rule.

## Component: Statusline

- **Responsibility:** show persistent state segments.
- **Requirements:** RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ11@R1
- **UI decisions:** RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1
- **Accepted mockups:** RM261003ABZP-M1@R1 (S1–S6, S12, S14)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** surface
- **System contract:** RM261003ABZP-DES2@R2 (AppState)
- **Success criteria:** RM261003ABZP-US1@R2
- **Verification:** RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1

### Anatomy

```text
[MODE] │ view │ path ● │ ← N backlinks │ W words │ preview │ ◆ index │ Ln:Col
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| full | wide terminals | all segments | none | — |
| narrow | < 100 cols | MODE, path ●, backlinks, index, Ln:Col | none | dropped segments |
| indexing | startup | `◌ indexing n/total` | none | dim spinner glyph |
| save failed | write error | `save failed: <reason> · retry in Ns` replaces words/preview | `:w` | error token |
| jump | after jump | `jump i/n` segment | none | — |
| non-Markdown | code or text file active | view shows `source`; backlinks and words hidden (AD4) | none | fewer segments |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| mode | yes | `AppState.vim.mode` / overlay mode | badge text uppercase | — |
| path, dirty | yes | active buffer | middle-truncate path; ● when dirty | `[No Name]` |
| backlinks | no | `NoteIndex` | `← N backlinks` | hidden while indexing and for non-Markdown files |
| words | no | active buffer | computed on visible change, cached per version | hidden for non-Markdown files |
| preview | no | `AppState.preview` | `preview :8731` / `preview off` | — |
| index | yes | index status | `◌ indexing n/total` / `◆ index ready` / `✗ index unavailable` | — |
| save failure | no | buffer save state | as variant | — |

### Interaction and Focus Contract

- **Activation:** None — display only.
- **Keyboard behavior:** None.
- **Focus behavior:** never focusable.
- **Feedback:** reflects state changes within the same frame.
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** segment drop order: preview → words → view.
- **Token references:** `mode-normal/insert/visual/cmd`, `mode-fg`, `fg-dim`, `error`, `bg-dark`.
- **Content overflow:** path middle-truncates first.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** text row.
- **Accessible name and description:** badge text names mode (works under NO_COLOR).
- **State exposure:** text glyphs (`●`, `◌`, `✗`).
- **Assistive-technology behavior:** readable as plain text.

### Implementation Boundaries

- **Must own:** segment formatting and dropping.
- **Must not own:** computing backlinks or index state.
- **Composes:** None.
- **Used by:** Shell.

### Applicable Code Shape

- **Target:** `src/ui/views/statusline.ts` — `statusSegments`
- **Language and framework:** TypeScript (pure formatting used by an OpenTUI view)
- **System-design authority:** RM261003ABZP-DES2@R2
- **Existing shape:** None — new component

```ts
export type Segment = { text: string; token: StyleToken; drop?: number };   // higher drop = removed first
export function statusSegments(s: AppState, lc: LayoutClass): Segment[] {
  const note = activeBuffer(s)?.fileType === "markdown";        // other file types: view reads `source`, no backlinks/words
  const segs = [modeSeg(s), viewSeg(s, 3), pathSeg(s), note && backlinksSeg(s), note && wordsSeg(s, 2), previewSeg(s, 1), indexSeg(s), posSeg(s)]
    .filter((x): x is Segment => !!x);
  return lc === "narrow" ? segs.filter((x) => !x.drop) : segs;
}
```

A pure function keeps the statusline testable as data; the view only paints segments.

## Component: Command line

- **Responsibility:** ex and named-command entry with completion; message display.
- **Requirements:** RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ5@R2
- **UI decisions:** RM261003ABZP-UDES2@R1, RM261003ABZP-UDES5@R2
- **Accepted mockups:** RM261003ABZP-M1@R1 (S6), RM261003ABZP-M3@R1 (S11)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** surface
- **System contract:** RM261003ABZP-DES4@R1 (ex table), RM261003ABZP-DES5@R2 (registry, `filetypes`)
- **Success criteria:** RM261003ABZP-US1@R2, RM261003ABZP-US3@R2
- **Verification:** RM261003ABZP-UV2@R1, RM261003ABZP-UV4@R2

### Anatomy

```text
completion list (above, max 8 rows): name · title · binding
:typed text▏
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| idle/message | show last message | text | — | error token for errors |
| typing | entering command | `:` + text | edit keys | cursor bar |
| completing | Tab pressed or ≥ 1 char | list of ex + command ids | `Tab`/`S-Tab` cycle | selection reversed |
| error | unknown command | `E492: Not an editor command: <text>` | any key clears | error token |
| unavailable | command excluded for the active file type | `not available for <type> files` | any key clears | message token |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| ex commands | yes | DES4 ex table | names | — |
| named commands | yes | `CommandRegistry.list(activeFiletype)` | id, title, binding | commands excluded for the file type are not listed |
| message | no | `AppState.notifications` (latest line) | single line, ends with `…` + `:messages` hint when long | — |

### Interaction and Focus Contract

- **Activation:** `:` from Normal/Visual.
- **Keyboard behavior:** `Enter` run, `Esc` cancel, `Tab` complete, `Ctrl-p/n` history.
- **Focus behavior:** takes focus; returns to editor on run/cancel.
- **Feedback:** result or error on the same row.
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** completion list width ≤ terminal width − 2.
- **Token references:** `mode-cmd`, `bg-float`, `bg-sel`, `error`.
- **Content overflow:** horizontal scroll of typed text.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** input line.
- **Accessible name and description:** `:` prefix and mode badge `COMMAND`.
- **State exposure:** error code text.
- **Assistive-technology behavior:** plain text.

### Implementation Boundaries

- **Must own:** text entry, completion list, history.
- **Must not own:** executing commands (dispatches `Action`).
- **Composes:** None.
- **Used by:** Shell.

### Applicable Code Shape

None — completion is a filtered list over `CommandRegistry.list()` plus the ex table; the Picker filtering shape applies unchanged.

## Component: Which-key

- **Responsibility:** show next keys for a pending prefix.
- **Requirements:** RM261003ABZP-UREQ5@R2
- **UI decisions:** RM261003ABZP-UDES5@R2
- **Accepted mockups:** RM261003ABZP-M3@R1 (S1, S2)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** shared
- **System contract:** RM261003ABZP-DES5@R2 (`Keymap.lookup` → `WhichKeyItem[]`)
- **Success criteria:** RM261003ABZP-US3@R2
- **Verification:** RM261003ABZP-UV4@R2

### Anatomy

```text
╭ <leader> ───────────────────────────────╮
│ e  Explorer     f  +find      n  +notes │
│ o  Outline      s  +search    l  +links │
│ …                                       │
╰ Backspace back · Esc close ─────────────╯
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| root | after `Space` | direct actions then `+groups` | letter | — |
| group | after group key | group items | letter, Backspace | title shows path `<leader>n` |
| wrapped | small terminal | more columns, fewer rows | same | — |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| items | yes | `lookup(mode, pending).next` | direct actions first, then groups (`+name`), alphabetical within | empty → popup not shown |
| delay | yes | 300 ms (A:Leader map) | — | — |

### Interaction and Focus Contract

- **Activation:** pending prefix longer than 300 ms.
- **Keyboard behavior:** letter descends/executes; `Backspace` up; `Esc` cancel.
- **Focus behavior:** does not take text focus; key input continues the sequence.
- **Feedback:** unknown key → `no mapping for <leader>q` message.
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** columns = floor((cols − 4) / 24).
- **Token references:** `bg-float`, `border-hl`, `kw` (keys), `fn` (groups).
- **Content overflow:** titles end-truncate.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** hint list.
- **Accessible name and description:** title shows the prefix.
- **State exposure:** `+` marks groups textually.
- **Assistive-technology behavior:** plain text.

### Implementation Boundaries

- **Must own:** layout of items.
- **Must not own:** keymap resolution.
- **Composes:** None.
- **Used by:** OverlayHost.

### Applicable Code Shape

None — rendering a column grid from `WhichKeyItem[]` (RM261003ABZP-DES5@R2) adds no review value beyond the anatomy.

## Component: Picker

- **Responsibility:** fuzzy-filtered list with optional preview for any source.
- **Requirements:** RM261003ABZP-UREQ5@R2, RM261003ABZP-UREQ6@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ8@R2
- **UI decisions:** RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES8@R1
- **Accepted mockups:** RM261003ABZP-M3@R1 (S3–S10, S16), RM261003ABZP-M4@R1 (S12, S18), RM261003ABZP-M5@R2 (S7, S11)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** shared
- **System contract:** RM261003ABZP-DES7@R3 (fuzzy matching, search), RM261003ABZP-DES5@R2 (commands source)
- **Success criteria:** RM261003ABZP-US3@R2
- **Verification:** RM261003ABZP-UV4@R2

### Anatomy

```text
╭ Find files ─────────────────────── 12/340 ╮╭ preview ───────────────╮
│ > srd▏                                    ││ # so roadmap           │
│ ▸ projects/so-roadmap.md                  ││ …                      │
│   areas/side-projects.md                  ││                        │
╰ ↑↓ move · Enter open · Esc close ─────────╯╰────────────────────────╯
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| files / recent | open files | paths of every non-excluded file | Enter opens; a refused file shows the refusal text and the picker stays open | recent: last-opened first |
| grep | find text in notes and text files | `path:line` + match context | Enter opens at line | match highlighted |
| headings / tags / backlinks | navigate | heading text / `#tag (count)` / mention | Enter jumps | tags show counts |
| commands | palette | title · id · binding · ● override; only commands available for the active file type | Enter runs | — |
| templates / move-target | flows | template names / folders | Enter selects | preview shows expansion / destination impact |
| no matches | feedback | `No matches` | edit query | dim |
| narrow | < 100 cols | no preview | same | full width |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| source | yes | `PickerSource` | — | — |
| query | yes | user | fuzzy; consecutive and word-start matches rank first | empty → source default order |
| preview | no | `source.preview(item)` | renders via EditorView (reading view for notes, source view for other text files) or text | unavailable or refused file → `No preview` |

### Interaction and Focus Contract

- **Activation:** command opens overlay with a source.
- **Keyboard behavior:** type filters; `Ctrl-n/p`, `↓/↑`; `Ctrl-d/u` page; `Enter`; `Esc`.
- **Focus behavior:** query has the cursor; selection is a highlighted row; close restores focus.
- **Feedback:** counter `n/total`; streaming sources show `◌`.
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** preview pane only ≥ 100 cols; float 80% × 70% clamped to ≥ 60×12.
- **Token references:** `bg-float`, `border-hl`, `bg-sel`, `match-bg`, `fg-dim`.
- **Content overflow:** paths middle-truncate; list scrolls.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** list with selection.
- **Accessible name and description:** float title names the source.
- **State exposure:** `▸` marks selection in addition to highlight; matches underlined.
- **Assistive-technology behavior:** hardware cursor stays in the query; selection also echoed in message line when it changes by key (`3/12 projects/so-roadmap.md`).

### Implementation Boundaries

- **Must own:** filtering UI, list rendering, preview layout.
- **Must not own:** search execution (worker), command execution, file writes.
- **Composes:** EditorView (preview, reading mode).
- **Used by:** Overlays, Links, File operations, Daily notes and templates.

### Applicable Code Shape

- **Target:** `src/ui/overlays/picker.ts` — `PickerSource`, `Picker`
- **Language and framework:** TypeScript, OpenTUI
- **System-design authority:** RM261003ABZP-DES7@R3 (fuzzy/search), RM261003ABZP-DES2@R2 (overlay state, actions), RM261003ABZP-DES9@R3 (`TextViewInput`)
- **Existing shape:** None — new component

```ts
export interface PickerSource<T> {
  id: string;                                                  // "files", "recent", "grep", "headings", "tags", "backlinks", "commands", "templates", "moveTarget", …
  title: string;
  items(query: string, s: AppState): T[] | { pending: true };   // grep returns pending; results arrive as an Action
  row(item: T, matches: number[]): Span[];
  preview?(item: T, s: AppState): TextViewInput | string;     // same input EditorView paints
  accept(item: T): Action;                                     // dispatched on Enter
}
export class Picker<T> extends Renderable { constructor(ctx: RenderContext, private source: PickerSource<T>) { super(ctx, {}); } }
```

One component serves every list overlay; sources differ only in data, row rendering, preview, and the `Action` dispatched on accept, keeping new pickers a registration (RM261003ABZP-REQ11@R3).

## Component: Completion popup

- **Responsibility:** `[[` link completion in Insert mode.
- **Requirements:** RM261003ABZP-UREQ6@R1
- **UI decisions:** RM261003ABZP-UDES6@R1
- **Accepted mockups:** RM261003ABZP-M3@R1 (S12–S14)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** feature
- **System contract:** RM261003ABZP-DES7@R3 (index names, aliases, headings, blocks)
- **Success criteria:** RM261003ABZP-US4@R1
- **Verification:** RM261003ABZP-UV5@R1

### Anatomy

```text
[[so-r▏
╭──────────────────────────────╮
│ ▸ so-roadmap      projects/  │
│   so (alias) → so-roadmap    │
╰──────────────────────────────╯
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| notes | after `[[` | names + aliases (`alias → target`) | type, `Ctrl-n/p`, `Enter`, `Esc` | — |
| headings | after `#` | headings with level glyph | same | — |
| blocks | after `#^` | block ids with text | same | — |
| empty | no match | `No matches — Enter keeps text` | — | dim |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| query | yes | text after `[[` | fuzzy | — |
| candidates | yes | `NoteIndex` | max 8 rows | index not ready → `index unavailable` |

### Interaction and Focus Contract

- **Activation:** typing `[[` in Insert mode.
- **Keyboard behavior:** `Ctrl-n/p` move, `Enter`/`Tab` accept (inserts `name]]`, or `#Heading]]`), `Esc` closes popup but stays in Insert.
- **Focus behavior:** text cursor stays in buffer.
- **Feedback:** None.
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** placed below cursor line; above when < 10 rows remain; never covers the cursor line (M3 S12).
- **Token references:** `bg-float`, `bg-sel`, `wikilink`, `fg-dim`.
- **Content overflow:** names end-truncate.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** suggestion list.
- **Accessible name and description:** None beyond content.
- **State exposure:** `▸` selection glyph.
- **Assistive-technology behavior:** selected candidate echoed in message line.

### Implementation Boundaries

- **Must own:** popup placement and list.
- **Must not own:** link resolution.
- **Composes:** None.
- **Used by:** Editor window (Insert).

### Applicable Code Shape

None — the placement rule and list reuse Picker row rendering; a preview would duplicate it.

## Component: Prompt

- **Responsibility:** confirm, input, typed-confirm, and impact prompts.
- **Requirements:** RM261003ABZP-UREQ6@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ8@R2
- **UI decisions:** RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES8@R1
- **Accepted mockups:** RM261003ABZP-M4@R1 (S5, S8, S10, S11, S13, S14), RM261003ABZP-M5@R2 (S10)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** shared
- **System contract:** RM261003ABZP-DES2@R2 (overlay `prompt`)
- **Success criteria:** RM261003ABZP-US4@R1, RM261003ABZP-US5@R2
- **Verification:** RM261003ABZP-UV5@R1, RM261003ABZP-UV6@R2

### Anatomy

```text
╭ Rename note ─────────────────────────────╮
│ New name: roadmap▏                       │
│ 31 links in 12 files will be updated     │
╰ Enter rename · Esc cancel ───────────────╯
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| confirm | yes/no | question `[y/N]` | `y` / any other key | — |
| input | name entry | label + field + preview line | type, `Enter`, `Esc` | — |
| impact | rename/move | input + impact line | as input | impact in `warn` |
| typed confirm | permanent delete | consequence + field | `Enter` enabled only when field equals name | disabled hint |
| invalid | bad input | inline reason | edit | `error` token |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| question/label | yes | command | sentence case, default in brackets | — |
| impact | no | `planRename` count | `N links in M files` | 0 → `No links to update` |
| validator | no | command | runs per keystroke | message shown inline |

### Interaction and Focus Contract

- **Activation:** command opens prompt.
- **Keyboard behavior:** as variants; `Esc` always cancels.
- **Focus behavior:** traps focus; restores on close.
- **Feedback:** invalid reason inline.
- **Disabled behavior:** typed confirm `Enter` disabled with `type "plan.md" to confirm`.

### Responsive and Visual Rules

- **Responsive behavior:** width min(60, cols − 4).
- **Token references:** `bg-float`, `border-hl`, `warn`, `error`, `danger`.
- **Content overflow:** wraps.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** dialog.
- **Accessible name and description:** title and consequence text.
- **State exposure:** `[y/N]` default; disabled reason text.
- **Assistive-technology behavior:** plain text.

### Implementation Boundaries

- **Must own:** prompt rendering and input.
- **Must not own:** the action performed on confirm.
- **Composes:** None.
- **Used by:** Links, File operations, Daily notes and templates.

### Applicable Code Shape

- **Target:** `src/ui/overlays/prompt.ts` — `PromptSpec`
- **Language and framework:** TypeScript
- **System-design authority:** RM261003ABZP-DES2@R2 (overlay state)
- **Existing shape:** None — new component

```ts
export type PromptSpec =
  | { kind: "confirm"; title: string; question: string; onYes: Action }
  | { kind: "input"; title: string; label: string; initial?: string; impact?: (v: string) => string; validate?: (v: string) => string | null; onSubmit: (v: string) => Action }
  | { kind: "typedConfirm"; title: string; consequence: string; expected: string; onConfirm: Action };
```

Prompts are data inside the overlay state; the UI renders the spec and dispatches the stored action, so destructive behavior lives in core commands.

## Component: Conflict dialog and diff

- **Responsibility:** resolve buffer-vs-disk conflicts.
- **Requirements:** RM261003ABZP-UREQ7@R2
- **UI decisions:** RM261003ABZP-UDES7@R2
- **Accepted mockups:** RM261003ABZP-M4@R1 (S15, S16)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** feature
- **System contract:** RM261003ABZP-DES8@R1 (conflict rules), RM261003ABZP-DES2@R2 (overlay `conflict`)
- **Success criteria:** RM261003ABZP-US5@R2
- **Verification:** RM261003ABZP-UV6@R2

### Anatomy

```text
╭ File changed on disk ──────────────────────────╮
│ projects/plan.md changed outside so.           │
│ Your buffer has unsaved edits (autosave paused)│
│  k keep mine   t take disk   d view diff       │
╰────────────────────────────────────────────────╯
Diff: buffer │ disk with − / + lines (del-*/add-* tokens), q back
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| dialog | choose | message + keys | `k t d` | — |
| diff (wide) | inspect | side by side | `j/k`, `k t`, `q` | add/del tokens; `+`/`−` prefixes |
| diff (narrow) | inspect | stacked | same | — |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| buffer text, disk text | yes | conflict state | line diff | identical → dialog closes, reload silently |

### Interaction and Focus Contract

- **Activation:** watcher conflict.
- **Keyboard behavior:** `k` keep, `t` take, `d` diff, `q` back from diff; `Esc` leaves dialog open (must choose).
- **Focus behavior:** modal until resolved.
- **Feedback:** result in message line (`Kept your version — saved`, `Took disk version — u to undo`).
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** diff stacked below 100 cols.
- **Token references:** `add-fg/add-bg`, `del-fg/del-bg`, `warning`.
- **Content overflow:** diff scrolls.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** dialog.
- **Accessible name and description:** title + path.
- **State exposure:** `+`/`−` prefixes, not colour alone.
- **Assistive-technology behavior:** plain text.

### Implementation Boundaries

- **Must own:** presentation of the choice and diff.
- **Must not own:** conflict detection or the write.
- **Composes:** None.
- **Used by:** File operations surface.

### Applicable Code Shape

None — the dialog is a fixed layout over the conflict state owned by RM261003ABZP-DES8@R1; the diff renderer is a list of `+`/`−` rows.

## Component: Toast stack

- **Responsibility:** non-modal background feedback.
- **Requirements:** RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ9@R1
- **UI decisions:** RM261003ABZP-UDES1@R2, RM261003ABZP-UDES9@R1
- **Accepted mockups:** RM261003ABZP-M1@R1 (S1, S13), RM261003ABZP-M6@R1 (S2–S10)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** shared
- **System contract:** RM261003ABZP-DES2@R2 (`notifications`)
- **Success criteria:** RM261003ABZP-US1@R2, RM261003ABZP-US7@R1
- **Verification:** RM261003ABZP-UV1@R2, RM261003ABZP-UV8@R1

### Anatomy

```text
╭───────────────────────────────╮
│ ✓ Moved to doing              │  title (icon by level)
│ tasks/esc-timeout.md          │  path line (dim)
│ − status: todo  + status: doing│  optional detail (diff), ≤ 4 lines
╰───────────────────────────────╯
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| info | success | `✓` title | auto-expire 3 s | `ok` border |
| warn | attention | `⚠` title | auto-expire 6 s | `warn` border |
| error | failure | `✗` title | stays until dismissed | `error` border |
| stacked | many | newest on top, max 3 visible + `+N more` | `:messages` lists all | — |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| level, title | yes | notification | — | — |
| path, detail | no | notification | detail wraps ≤ 4 lines; never note body text | truncated with `…` |

### Interaction and Focus Contract

- **Activation:** notification added.
- **Keyboard behavior:** `:messages` shows history; `Esc` in Normal with no pending state dismisses the newest error toast.
- **Focus behavior:** never takes focus.
- **Feedback:** —
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** width min(40, cols / 2); top-right inside Body.
- **Token references:** `bg-float`, `ok`, `warn`, `error`, `add-*`, `del-*`.
- **Content overflow:** wrap ≤ 4 lines.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** status message.
- **Accessible name and description:** title text with level glyph.
- **State exposure:** glyph `✓ ⚠ ✗`.
- **Assistive-technology behavior:** the title is also written to the message line.

### Implementation Boundaries

- **Must own:** stacking and expiry presentation (expiry timers are core `startTimer` effects per RM261003ABZP-DES2@R2).
- **Must not own:** deciding what to notify.
- **Composes:** None.
- **Used by:** Shell.

### Applicable Code Shape

None — a list painter over `AppState.notifications`; behavior is fully specified above.

## Component: Calendar

- **Responsibility:** month grid date picker for daily notes.
- **Requirements:** RM261003ABZP-UREQ8@R2
- **UI decisions:** RM261003ABZP-UDES8@R1
- **Accepted mockups:** RM261003ABZP-M5@R2 (S5, S6, S14)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** feature
- **System contract:** RM261003ABZP-DES11@R1 (`note.pickDate`, daily paths), RM261003ABZP-DES7@R3 (existing paths)
- **Success criteria:** RM261003ABZP-US6@R1
- **Verification:** RM261003ABZP-UV7@R1

### Anatomy

```text
╭ ‹ October 2026 › ────────────────╮
│ Mo Tu We Th Fr Sa Su             │
│           1• 2• [3]  4           │
│  5  6  7  8  9 10 11             │
│ …                                │
╰ hjkl move · H/L month · t today ─╯
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| current month | default | today selected and underlined | grid keys | — |
| paged | other month | same day number clamped | `H`/`L` | — |
| has note | existing daily note | `•` after day | — | glyph |
| narrow | 80×24 | unchanged fixed 36 cols | — | — |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| today | yes | clock action | underline | — |
| existing dates | yes | daily paths in `NoteIndex` parsed with `[daily] format` | `•` | index not ready → no marks, hint `indexing` |

### Interaction and Focus Contract

- **Activation:** `<leader>np`.
- **Keyboard behavior:** `h/j/k/l` day/week, `H/L` month, `t` today, `Enter` open/create, `Esc` close.
- **Focus behavior:** hardware cursor on selected day.
- **Feedback:** message line `Sat 2026-10-03 · note exists` / `· will be created`.
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** fixed size, centered.
- **Token references:** `bg-float`, `bg-sel`, `fg-dim` (other-month days), `tag` (`•`).
- **Content overflow:** None.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** grid.
- **Accessible name and description:** month title.
- **State exposure:** `[ ]` brackets around selection plus reverse video; `•` for existing notes; underline for today.
- **Assistive-technology behavior:** message line echoes selected date.

### Implementation Boundaries

- **Must own:** grid layout and navigation state.
- **Must not own:** creating notes (dispatches `note.open` for the date).
- **Composes:** None.
- **Used by:** Daily notes and templates.

### Applicable Code Shape

- **Target:** `src/ui/overlays/calendar.ts` — `monthGrid`
- **Language and framework:** TypeScript (pure helper used by an OpenTUI view)
- **System-design authority:** RM261003ABZP-DES11@R1
- **Existing shape:** None — new component

```ts
export type DayCell = { date: string /* YYYY-MM-DD */; inMonth: boolean; today: boolean; hasNote: boolean };
export function monthGrid(year: number, month: number, today: string, existing: ReadonlySet<string>): DayCell[][] {
  // 6 rows × 7 columns, Monday first (A:Behaviour details)
}
```

A pure grid function makes Monday-first layout, month paging, and existing-note marks unit-testable; the view paints cells and moves the cursor.

## Component: Base table

- **Responsibility:** tabular Bases view with in-place editing.
- **Requirements:** RM261003ABZP-UREQ9@R1
- **UI decisions:** RM261003ABZP-UDES9@R1
- **Accepted mockups:** RM261003ABZP-M6@R1 (S1–S7, S13, S15)
- **Specification mode:** new
- **Existing contract:** None — new component (Alfred `BaseGrid.tsx`/`CellEditor.tsx` are porting references only)
- **Reuse scope:** feature
- **System contract:** RM261003ABZP-DES12@R2 (`TableModel`, write-back)
- **Success criteria:** RM261003ABZP-US7@R1
- **Verification:** RM261003ABZP-UV8@R1

### Anatomy

```text
toolbar
 title ↑        status      due         tags
 ▾ so-roadmap (6)
   bases-kanban  doing      2026-10-12  #so #bases
 Σ               4 todo     —           —
 › +2 cols
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| default | browse | rows by view order | `h/j/k/l` | focused cell reversed |
| grouped | groups | group headers with counts | `g` toggle | header bold |
| sorted | order | `↑`/`↓` on header | `s` cycle | — |
| editing | edit cell | type-specific editor | `Enter` save, `Esc` cancel | border on cell |
| invalid | bad value | inline error under cell | edit | `error` token |
| overflow | many columns | `› +N cols` | `l` scrolls | — |
| fallback notice | `cards`/`list`/`map` | notice in toolbar | — | `info` token |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| model | yes | `TableModel` | columns from view `order` | diagnostics → notice |
| cell value | no | property | formatted by type | empty → dim `—` |

### Interaction and Focus Contract

- **Activation:** open base / switch to table view.
- **Keyboard behavior:** see Bases views interaction contract.
- **Focus behavior:** one focused cell; hardware cursor there.
- **Feedback:** write toast with diff.
- **Disabled behavior:** formula columns read-only (`i` shows `formula — read only`).

### Responsive and Visual Rules

- **Responsive behavior:** hide right-most non-key columns first.
- **Token references:** `border`, `bg-sel`, `fn` (headers), `tag`, `fg-dim`.
- **Content overflow:** cells end-truncate; focused cell shows full value in message line.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** grid.
- **Accessible name and description:** toolbar title.
- **State exposure:** sort glyph, read-only text.
- **Assistive-technology behavior:** message line echoes `column: value`.

### Implementation Boundaries

- **Must own:** grid painting, cell editors, focus.
- **Must not own:** evaluation or YAML patching.
- **Composes:** cell editors.
- **Used by:** Bases views.

### Applicable Code Shape

None — the grid paints `TableModel` rows (RM261003ABZP-DES12@R2); cell editors dispatch `base.setCell` actions; the anatomy and interaction tables fully specify the UI.

## Component: Kanban board

- **Responsibility:** cards in columns by a group-by property with moves.
- **Requirements:** RM261003ABZP-UREQ9@R1
- **UI decisions:** RM261003ABZP-UDES9@R1
- **Accepted mockups:** RM261003ABZP-M6@R1 (S8–S12, S14, S16)
- **Specification mode:** new
- **Existing contract:** None — new component (Alfred `CardLayout.tsx` porting reference only)
- **Reuse scope:** feature
- **System contract:** RM261003ABZP-DES12@R2 (`KanbanModel`, move rules)
- **Success criteria:** RM261003ABZP-US7@R1
- **Verification:** RM261003ABZP-UV8@R1

### Anatomy

```text
● todo 4        ● doing 4       ● done 2       ● None 2
╭────────────╮  ╭────────────╮
│ title      │  │ title      │   card: title (bold), meta line (dim), tags
│ meta · due │  │ …          │
╰────────────╯  ╰────────────╯
                ↓ 2 more
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| default | browse | columns + cards | `h/j/k/l` | focused card border `border-hl` |
| moved | after move | card in new column + toast | — | — |
| moves off | formula/file grouping | toolbar `⊘ moves off` | `H/L` explain | — |
| overflow | many cards | `↓ N more` | `j/k` scroll | — |
| narrow | < 100 cols | truncated column names, 1-line cards | same | — |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| model | yes | `KanbanModel` | column order from model, `None` last | — |
| card fields | yes | note properties | title + up to 2 meta fields + tags | missing → omitted |

### Interaction and Focus Contract

- **Activation:** switch to Kanban view.
- **Keyboard behavior:** `h/j/k/l` focus, `H/L` move, `Enter` open.
- **Focus behavior:** focused card keeps focus after move.
- **Feedback:** toast with frontmatter diff.
- **Disabled behavior:** moves off with explanation.

### Responsive and Visual Rules

- **Responsive behavior:** column width = (cols − gaps) / visible columns, min 18; extra columns scroll horizontally with `‹ ›` markers.
- **Token references:** `border`, `border-hl`, `bg-hl`, column dot colours from `info/warn/ok/fg-dim`.
- **Content overflow:** titles end-truncate.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** grid of lists.
- **Accessible name and description:** column title + count.
- **State exposure:** focused border + reverse title; column dots plus names (not colour alone).
- **Assistive-technology behavior:** message line echoes `doing · esc-timeout`.

### Implementation Boundaries

- **Must own:** column/card layout, focus, move keys.
- **Must not own:** move legality and writes (core).
- **Composes:** None.
- **Used by:** Bases views; base embeds (read-only rendering through the base block renderer).

### Applicable Code Shape

None — layout over `KanbanModel` with moves dispatched as `base.moveCard`; the tables above cover it.

## Component: Theme

- **Responsibility:** map `StyleToken`s and chrome tokens to terminal attributes per theme, honoring `NO_COLOR`.
- **Requirements:** RM261003ABZP-UREQ11@R1
- **UI decisions:** RM261003ABZP-UDES11@R1
- **Accepted mockups:** RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (theme toggle)
- **Specification mode:** new
- **Existing contract:** None — new component
- **Reuse scope:** shared
- **System contract:** RM261003ABZP-DES10@R2 (`theme.ts`, `NO_COLOR`), RM261003ABZP-DES14@R1 (`theme`, `color`)
- **Success criteria:** RM261003ABZP-US9@R1
- **Verification:** RM261003ABZP-UV10@R1

### Anatomy

```text
Theme = { name: "dark" | "light" | "nocolor"; token(t: StyleToken | ChromeToken) → { fg?, bg?, bold?, italic?, underline?, reverse?, strike?, dim? } }
```

### Variants and States

| Variant or State | Purpose | Content | Interaction | Visual Difference |
|---|---|---|---|---|
| dark | default | tokyonight-like | — | — |
| light | user choice | tokyonight-day-like | — | — |
| nocolor | `NO_COLOR` non-empty and config `color` unset | attributes only | — | bold/underline/reverse/dim/glyphs |

### Input and Content Contract

| Input or Content | Required | Source | Display Rule | Missing or Invalid Behavior |
|---|---|---|---|---|
| `NO_COLOR` env | no | process env | non-empty → nocolor unless `color = true` | — |
| `theme` config | no | config | `dark` default | unknown → config error, default |

### Interaction and Focus Contract

- **Activation:** startup and `:ConfigReload`.
- **Keyboard behavior:** `<leader>ut` toggles dark/light (A:Leader map `u` group).
- **Focus behavior:** None.
- **Feedback:** None.
- **Disabled behavior:** None.

### Responsive and Visual Rules

- **Responsive behavior:** None.
- **Token references:** all tokens listed in Section 5 Visual System.
- **Content overflow:** None.
- **Motion:** None.

### Accessibility Contract

- **Semantic role:** None.
- **Accessible name and description:** None.
- **State exposure:** nocolor mapping guarantees every state has a non-colour attribute: mode (badge text), selection (reverse), cursorline (underline), dirty (`●`), error (bold + `✗`), focused cell/card (reverse), unresolved link (underline + `?` suffix glyph).
- **Assistive-technology behavior:** None.

### Implementation Boundaries

- **Must own:** token → attribute mapping.
- **Must not own:** deciding tokens (core layout and views assign tokens).
- **Composes:** None.
- **Used by:** every painter.

### Applicable Code Shape

- **Target:** `src/ui/theme.ts` — `resolveTheme`
- **Language and framework:** TypeScript
- **System-design authority:** RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1
- **Existing shape:** None — new component

```ts
export function resolveTheme(env: Record<string, string | undefined>, cfg: { theme?: "dark" | "light"; color?: boolean }): Theme {
  const noColor = (env.NO_COLOR ?? "") !== "" && cfg.color !== true;   // REQ11: non-empty disables colour unless config re-enables
  return noColor ? nocolorTheme : cfg.theme === "light" ? lightTheme : darkTheme;
}
```

The single resolution point implements the NO_COLOR rule from RM261003ABZP-REQ11@R3; every painter asks the resolved theme for attributes, so no view hard-codes colour.

# 8. UI Success and Implementation Verification

## UI Success Criteria

### RM261003ABZP-US1@R2: Shell, modes, and status are always legible

- **Requirements:** RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1
- **UI Design:** RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1
- **Observable Success:** at 120×36 and 80×24 the shell regions, mode badge, dirty marker, index progress, toasts, and save-failure status render as in M1 for each state; with a non-Markdown file active the statusline shows `source` and no backlinks or words; mode/command-line interactions behave as specified.
- **Detailed Design:** Surface: Application shell; Component: Statusline; Component: Command line; Component: Toast stack
- **Mockups:** RM261003ABZP-M1@R1
- **Supported By:** RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1

### RM261003ABZP-US2@R2: Live preview looks and reveals like the accepted mockup; other files stay plain source

- **Requirements:** RM261003ABZP-UREQ3@R2, RM261003ABZP-UREQ4@R1
- **UI Design:** RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1
- **Observable Success:** the tour note paints heading glyphs, hidden markers, sign-column reveal, block reveal, tasks, folds, embeds, and each image tier as in M2; a TypeScript file paints raw lines with syntax colouring and no note rendering, and note-only keys do nothing there.
- **Detailed Design:** Surface: Editor window
- **Mockups:** RM261003ABZP-M2@R1
- **Supported By:** RM261003ABZP-UV3@R2

### RM261003ABZP-US3@R2: Commands, notes, and files are discoverable from the keyboard

- **Requirements:** RM261003ABZP-UREQ5@R2
- **UI Design:** RM261003ABZP-UDES5@R2
- **Observable Success:** which-key, every picker kind, palette, `:` completion, and help behave as in M3, including narrow layout; the files picker finds non-Markdown files; the palette, completion, and which-key show only what applies to the active file type; help labels file-type-scoped bindings.
- **Detailed Design:** Surface: Overlays; Component: Which-key; Component: Picker; Component: Command line
- **Mockups:** RM261003ABZP-M3@R1
- **Supported By:** RM261003ABZP-UV4@R2

### RM261003ABZP-US4@R1: Link interactions are predictable and show impact first

- **Requirements:** RM261003ABZP-UREQ6@R1
- **UI Design:** RM261003ABZP-UDES6@R1
- **Observable Success:** completion placement, follow + jump indicator, unresolved create prompt, backlinks panel, and rename impact behave as in M3/M4.
- **Detailed Design:** Surface: Links and backlinks; Component: Completion popup; Component: Prompt
- **Mockups:** RM261003ABZP-M3@R1, RM261003ABZP-M4@R1
- **Supported By:** RM261003ABZP-UV5@R1

### RM261003ABZP-US5@R2: File operations, refused files, and disk changes never surprise the user

- **Requirements:** RM261003ABZP-UREQ7@R2
- **UI Design:** RM261003ABZP-UDES7@R2
- **Observable Success:** explorer prompts, trash and typed-confirm, conflict dialog, diff, and reload notice behave as in M4; opening a binary or oversized file shows its refusal text and leaves the active buffer unchanged; `a` keeps an explicit extension.
- **Detailed Design:** Surface: File operations and disk changes; Component: Prompt; Component: Conflict dialog and diff
- **Mockups:** RM261003ABZP-M4@R1
- **Supported By:** RM261003ABZP-UV6@R2

### RM261003ABZP-US6@R1: Daily notes and templates take one or two keystrokes

- **Requirements:** RM261003ABZP-UREQ8@R2
- **UI Design:** RM261003ABZP-UDES8@R1
- **Observable Success:** `:Today`, calendar navigation, template preview/insertion, and new-note-from-template behave as in M5.
- **Detailed Design:** Surface: Daily notes and templates; Component: Calendar
- **Mockups:** RM261003ABZP-M5@R2
- **Supported By:** RM261003ABZP-UV7@R1

### RM261003ABZP-US7@R1: Bases editing is keyboard-fast and shows every write

- **Requirements:** RM261003ABZP-UREQ9@R1
- **UI Design:** RM261003ABZP-UDES9@R1
- **Observable Success:** table and Kanban interactions, write toasts with diffs, moves-off state, fallbacks, and embeds behave as in M6.
- **Detailed Design:** Surface: Bases views; Component: Base table; Component: Kanban board; Component: Toast stack
- **Mockups:** RM261003ABZP-M6@R1
- **Supported By:** RM261003ABZP-UV8@R1

### RM261003ABZP-US8@R1: The browser page is a faithful, read-only, connection-aware mirror

- **Requirements:** RM261003ABZP-UREQ10@R1
- **UI Design:** RM261003ABZP-UDES10@R2
- **Observable Success:** page states (Live, Reconnecting, Stopped, Offline, paused-follow), read-only controls, and 375 px layout behave as in M7.
- **Detailed Design:** Surface: Browser preview page
- **Mockups:** RM261003ABZP-M7@R1
- **Supported By:** RM261003ABZP-UV9@R2

### RM261003ABZP-US9@R1: Every surface works under NO_COLOR, in light theme, and at 80×24

- **Requirements:** RM261003ABZP-UREQ11@R1
- **UI Design:** RM261003ABZP-UDES11@R1
- **Observable Success:** each terminal surface's key states remain distinguishable with NO_COLOR and render without clipping at 80×24; the browser page has semantic structure and contrast in both themes.
- **Detailed Design:** Section 5 policies; Component: Theme
- **Mockups:** RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (M5@R2)
- **Supported By:** RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R2

## Implementation Verifications

### RM261003ABZP-UV1@R2: Shell golden screens

- **Supports:** RM261003ABZP-US1@R2
- **Level or Method:** visual (golden text-grid snapshots via OpenTUI test renderer)
- **Target:** Application shell, Statusline, Toast stack
- **Setup:** `test/fixtures` workspace (includes `scripts/sync.ts`); test renderer at 120×36 and 80×24; dark theme; fixed clock.
- **Action:** render startup (indexing 4,210/10,000), index-ready toast, explorer hidden, outline and backlinks panel, `:vs` split, save-failed state; open `scripts/sync.ts`.
- **Assertions:** text grid equals committed goldens; statusline segment order is `MODE │ view │ path ● │ ← N backlinks │ W words │ preview │ index │ Ln:Col` at 120 cols and drops view/words/preview at 80 cols; with `sync.ts` active the statusline at 120 cols is `MODE │ source │ scripts/sync.ts │ preview │ index │ Ln:Col`; error toast persists after 10 s simulated time while info toast is gone after 3 s.
- **Unique Risk:** region layout or segment order regressing silently, or note-only segments shown for code files.
- **Expected Evidence:** passing `bun test test/ui/shell.golden.test.ts` with goldens.
- **Status:** Proposed

### RM261003ABZP-UV2@R1: Mode and command-line interaction

- **Supports:** RM261003ABZP-US1@R2
- **Level or Method:** interaction (component test with mock input)
- **Target:** mode badge, cursor shape request, command line
- **Setup:** test renderer 120×36, note open.
- **Action:** press `i`, type, `Esc`; `v` `j`; `V`; `:foo` `Enter`; `:` `vs` `Tab`.
- **Assertions:** badge text sequence `INSERT → NORMAL → VISUAL → V-LINE → COMMAND`; cursor-shape escape requested bar in Insert and block after `Esc`; `E492: Not an editor command: foo` appears; `Tab` completes `vs` to `vsplit` and lists `:vsplit` first.
- **Unique Risk:** mode feedback or ex-error text diverging from vim conventions.
- **Expected Evidence:** passing component test.
- **Status:** Proposed

### RM261003ABZP-UV3@R2: Editor painting goldens, image tiers, and non-Markdown source view

- **Supports:** RM261003ABZP-US2@R2
- **Level or Method:** visual (golden text grid + attribute map) and component test
- **Target:** EditorView with Theme and widget painters
- **Setup:** `test/fixtures/tour.md` and `test/fixtures/scripts/sync.ts`; widths 120 and 80; image capability mocked kitty / sixel / none / `images="off"`.
- **Action:** paint `tour.md` with cursor on blank line, bold line, inside table, inside callout; toggle a task; `za` on folded callout and embed; cycle `<leader>m`. Open `sync.ts`; paint; press `<leader>m`, `gd` on an identifier, `Enter` on a line; run `:link.follow`.
- **Assertions:** H1–H4 rows start with `█ ▊ ▌ ▏`; markers hidden except on the cursor line; sign column shows `▕` only on revealed rows; whole table shows pipes when cursor inside; `☐` becomes `☑`; folded callout shows one row with `▸`; embed shows `… N more lines` at `embedMaxRows`; image tiers produce kitty placement / sixel placement / block characters / `[image: diagram.png]` respectively; reading mode rejects `x` with the hint message. For `sync.ts`: every text row equals the file's raw line; keywords and strings carry distinct style tokens; the sign column is empty; `<leader>m` and `gd` leave buffer, view, and cursor unchanged and `Enter` only moves the cursor; `:link.follow` shows `not available for typescript files`.
- **Unique Risk:** painter mis-mapping tokens, glyphs, or widget types even when core `RenderLine` output is correct (system RM261003ABZP-V7@R2 covers layout data, not paint), or note painting leaking into code files.
- **Expected Evidence:** passing golden tests.
- **Status:** Proposed

### RM261003ABZP-UV4@R2: Discovery overlays behavior

- **Supports:** RM261003ABZP-US3@R2
- **Level or Method:** interaction (component tests)
- **Target:** Which-key, Picker (files, grep, commands), Command line completion, Help
- **Setup:** fixture workspace indexed, including `scripts/sync.ts`; config override `"<leader>w" = "file.save"`.
- **Action:** `Space` wait 300 ms; `Space` then `f` within 100 ms; `Space l`; `<leader>ff` type `srd`; `Ctrl-n`; `<leader>ff` type `sync`; `<leader>sg` query; `<leader>:`; `<leader>?`; resize to 80×24 with picker open. With `sync.ts` active: `Space` wait 300 ms; `<leader>:` type `follow`; `:` type `link` `Tab`.
- **Assertions:** no popup before 300 ms; root lists direct actions before `+groups`; `+links` shows `b` and `r` items; `projects/so-roadmap.md` ranks first for `srd`; `scripts/sync.ts` ranks first for `sync`; grep rows formatted `path:line` with match highlighted and include a `sync.ts` row for a query found there; palette shows `●` next to `file.save`; help lists `<leader>?`, marks the override, and labels `gd` with `markdown`; preview pane absent at 80 cols. In `sync.ts`: which-key root shows no `+links` group; the palette lists no `link.follow`; `:` completion offers no `link.*` ids.
- **Unique Risk:** discoverability breaking (timing, ranking, override markers) or note commands offered where they cannot run, without any data-layer failure.
- **Expected Evidence:** passing component tests.
- **Status:** Proposed

### RM261003ABZP-UV5@R1: Link interaction flow

- **Supports:** RM261003ABZP-US4@R1
- **Level or Method:** interaction (component tests)
- **Target:** Completion popup, link follow, backlinks panel, rename prompt
- **Setup:** fixture workspace with `plan.md` referenced 31 times in 12 files; cursor near the bottom of the window.
- **Action:** Insert `[[pl`, `#`, `Enter`; `gd` on `[[plan#Goals]]`; `Ctrl-o`; `gd` on unresolved link; `<leader>lb`; `l` on an unlinked mention; `<leader>lr` type `roadmap`.
- **Assertions:** popup rendered above the cursor line when < 10 rows remain and never on the cursor row; inserted text `[[plan#Goals]]`; statusline `jump 2/2` then `jump 1/2`; prompt text `Create projects/plan.md? [y/N]`; panel lists `Linked mentions` before `Unlinked mentions`; after `l` the mention moves to Linked; rename prompt shows `31 links in 12 files` before `Enter` and toast `12 files updated` after.
- **Unique Risk:** popup occlusion or impact shown only after the irreversible action.
- **Expected Evidence:** passing component tests.
- **Status:** Proposed

### RM261003ABZP-UV6@R2: File-safety prompts and refused files

- **Supports:** RM261003ABZP-US5@R2
- **Level or Method:** interaction (component tests with workspace adapters stubbed at the effect boundary)
- **Target:** Explorer prompts, Conflict dialog and diff, reload notice, refused-open message
- **Setup:** fixture tree; trash available / unavailable variants; conflict and clean-reload `fileChanged` actions; `fileRefused` results for `photo.png` (`binary`) and `big.log` (`tooLarge`).
- **Action:** `a` `ideas/`; `a` `draft`; `a` `sync.ts`; `r`; `m`; `d` with trash; `d` without trash typing partial then full name; dispatch conflict, press `d`, `q`, `k`; dispatch clean reload, press `u`; `Enter` on `photo.png`; `:e big.log`.
- **Assertions:** trailing `/` creates a folder row; `draft` creates `draft.md` and `sync.ts` creates `sync.ts`; delete prompt text `Move to Trash? [y/N]`; typed-confirm `Enter` ignored until the exact name; conflict dialog shows `autosave paused`; diff shows `+`/`−` prefixes; `k` closes dialog with `Kept your version — saved`; reload notice text `Reloaded from disk — u to undo` and `u` restores prior text; `photo.png` shows `binary file — not opened` and `big.log` shows `file too large — not opened (limit 16 MiB)` in the message line, with the active buffer, bufferline, and explorer selection unchanged and no write effect emitted.
- **Unique Risk:** destructive UI path reachable without the specified confirmation, or a refused file silently opening an empty buffer.
- **Expected Evidence:** passing component tests.
- **Status:** Proposed

### RM261003ABZP-UV7@R1: Calendar and template flows

- **Supports:** RM261003ABZP-US6@R1
- **Level or Method:** unit (`monthGrid`) + interaction
- **Target:** Calendar, template picker, new-note flow
- **Setup:** fixed clock 2026-10-03; daily notes for 10-01 and 10-02; templates folder with `daily.md`, `meeting.md`.
- **Action:** `monthGrid(2026, 10, …)`; `<leader>np` `l` `L` `t` `Enter`; `<leader>nt` select `meeting`; `<leader>nn` title `Garden plan` choose `(blank note)`.
- **Assertions:** first grid column is Monday and Oct 1 2026 sits in column 4; 10-01/10-02 carry `•`; `L` from 3 Oct lands on 3 Nov; `t` returns to 3 Oct; template preview shows source above expanded text; insertion is undone by one `u`; new note `garden-plan.md` opens in Insert mode.
- **Unique Risk:** off-by-one week layout or month paging errors.
- **Expected Evidence:** passing tests.
- **Status:** Proposed

### RM261003ABZP-UV8@R1: Bases table and Kanban interaction

- **Supports:** RM261003ABZP-US7@R1
- **Level or Method:** interaction (component tests) with write effects captured
- **Target:** Base table, Kanban board, toolbar, toasts
- **Setup:** `tasks.base` fixture with table, Kanban (by `status`), formula-grouped view, and `cards` view.
- **Action:** `i` on number cell `Ctrl-a`; invalid date entry; `x` checkbox; `s` ×3; `g`; switch to Kanban; `L` on a card; move into `None`; switch to formula view and press `L`; switch to `cards` view.
- **Assertions:** number increments by 1; invalid date shows inline error and `Esc` restores; toast shows `− status: todo` / `+ status: doing`; moving into `None` produces a write removing `status`; formula view toolbar shows `⊘ moves off` and `L` produces an explanation toast and no write; `cards` view renders a table with a notice and produces no write.
- **Unique Risk:** UI allowing an illegal move or writing on a read-only fallback.
- **Expected Evidence:** passing component tests.
- **Status:** Proposed

### RM261003ABZP-UV9@R2: Browser page structure, states, and read-only guarantee

- **Supports:** RM261003ABZP-US8@R1, RM261003ABZP-US9@R1
- **Level or Method:** integration (HTML assertions on `page.html` + `renderHtml` output in `bun test`) and manual visual check
- **Target:** Browser preview page
- **Setup:** preview server on a fixture workspace (as in system RM261003ABZP-V11@R3); tour note.
- **Action:** fetch `/` and `/render?path=tour.md`; inspect page script state handling with a stubbed `EventSource`; manual: open in a browser at 1200 px and 375 px, light and dark, and toggle offline.
- **Assertions:** page contains `<header>`, `<main>`, `<article>`; badge element has `aria-live="polite"`; no `<form>`, `<textarea>`, or enabled `<input>`; task checkboxes are `disabled`; tables and `pre` are wrapped with `overflow-x: auto`; stubbed events drive badge text `Live` → `Reconnecting…` → `Offline`, and `Stopped` on a `stopped` event; manual check confirms no page-level horizontal scroll at 375 px, readable contrast in both themes, and, offline, that math and diagrams still render and scripts, styles, fonts, and connections come only from the page's own origin.
- **Unique Risk:** an editing control or broken connection state shipping in the page.
- **Expected Evidence:** passing test plus a recorded manual checklist in the delivery PR.
- **Status:** Proposed

### RM261003ABZP-UV10@R1: NO_COLOR, light theme, and 80×24 across surfaces

- **Supports:** RM261003ABZP-US9@R1
- **Level or Method:** visual (golden attribute maps) + accessibility (attribute-only distinguishability check)
- **Target:** Theme and every terminal surface
- **Setup:** test renderer; `NO_COLOR=1`; light theme; 80×24.
- **Action:** render one key state per surface: Normal/Insert badge, visual selection, cursorline, dirty buffer, error toast, focused Base cell, focused Kanban card, unresolved link, picker selection, calendar selection.
- **Assertions:** with NO_COLOR, no truecolor or 256-colour SGR codes are emitted; each listed state differs from its neighbour by at least one of bold/underline/reverse/dim or a glyph; at 80×24 no surface clips its title row, statusline, or prompt text; light theme goldens match.
- **Unique Risk:** a state that is distinguishable only by colour.
- **Expected Evidence:** passing golden tests.
- **Status:** Proposed

## Coverage Balance

- Pure helpers (`statusSegments`, `monthGrid`, `resolveTheme`) are unit-tested; painting is checked by golden text grids; interaction by component tests with mock input; the browser page by HTML assertions plus one manual visual pass (no Playwright, per RM261003ABZP-DES15@R1).
- System-level behavior (layout data, file-type resolution and open policy, link resolution, writes, server safety) is proven by system V records (RM261003ABZP-V1@R1 … RM261003ABZP-V18@R1, with RM261003ABZP-V4@R2, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2); UI verifications assert only presentation and interaction risks those records do not cover.

# 9. Finalized UI Design Decisions

### RM261003ABZP-UDES1@R2: LazyVim-style shell with three layout classes and status-first feedback

- **Requirements:** RM261003ABZP-UREQ1@R2
- **Decision:** fixed regions (bufferline, explorer, window tree, side panel, statusline, command line) with layout classes wide/medium/narrow; persistent state in the statusline, background results in toasts, destructive questions in dialogs; statusline segments depend on the active file type (non-Markdown: view `source`, no backlinks or words).
- **Rationale:** matches M1 and LazyVim muscle memory; one feedback channel per kind of information keeps the screen quiet; hiding note-only segments avoids showing meaningless counts for code files (AD4).
- **Mockups:** RM261003ABZP-M1@R1
- **Surfaces or Components:** Surface: Application shell; Component: Statusline; Component: Toast stack
- **Success Criteria:** RM261003ABZP-US1@R2
- **Tradeoffs:** no tabs/workspaces UI; rejected a dashboard start screen (adds a surface without value for a folder editor); rejected a file-type segment (the path extension and the `source` view already identify the file, and it would need a mockup revision).

### RM261003ABZP-UDES2@R1: Text-labelled mode badges, cursor shapes, and a single `:` line for ex and named commands

- **Requirements:** RM261003ABZP-UREQ2@R1
- **Decision:** badges `NORMAL INSERT VISUAL V-LINE COMMAND EXPLORER BASE`; bar cursor in Insert; `:` completes ex commands and every command id; vim-style error codes.
- **Rationale:** text badges survive NO_COLOR; one command line avoids a second syntax to learn (A:`:` command line).
- **Mockups:** RM261003ABZP-M1@R1, RM261003ABZP-M3@R1
- **Surfaces or Components:** Surface: Application shell; Component: Command line
- **Success Criteria:** RM261003ABZP-US1@R2
- **Tradeoffs:** command ids appear in `:` completion alongside ex names; mitigated by grouping ex commands first.

### RM261003ABZP-UDES3@R2: Glyph-led live-preview rendering with sign-column reveal marker; one source path for every file type

- **Requirements:** RM261003ABZP-UREQ3@R2
- **Decision:** heading prefixes `█ ▊ ▌ ▏` with H1–H3 bands; markers hidden except on the cursor line; whole multi-line block revealed when the cursor is inside; `▕` sign-column marker on revealed rows; source mode = syntax colouring only; reading mode never reveals. Non-Markdown files use the same source painting (raw lines plus highlighter colours) and get no note keys; note commands run by name explain that they are unavailable.
- **Rationale:** glyph levels and the sign marker keep structure and reveal visible without colour (M2, A:Visual language); one paint path for note source mode and code keeps the UI language-neutral (RM261003ABZP-DES9@R3).
- **Mockups:** RM261003ABZP-M2@R1, RM261003ABZP-M1@R1
- **Surfaces or Components:** Surface: Editor window
- **Success Criteria:** RM261003ABZP-US2@R2
- **Tradeoffs:** block reveal shifts more text than Obsidian's per-span reveal (accepted in RM261003ABZP-DES9@R3); code files get colouring only — no folding, outline, or definitions until a later roadmap.

### RM261003ABZP-UDES4@R1: Interactive blocks and predictable image tiers

- **Requirements:** RM261003ABZP-UREQ4@R1
- **Decision:** `Enter`/`<leader>x` toggle tasks; `za` folds callouts and expands embeds; embeds capped at `preview.embedMaxRows`; images reserve rows and degrade kitty/sixel → blocks → `[image: name]`.
- **Rationale:** reserved rows keep scrolling stable across tiers; one fold key matches vim.
- **Mockups:** RM261003ABZP-M2@R1
- **Surfaces or Components:** Surface: Editor window
- **Success Criteria:** RM261003ABZP-US2@R2
- **Tradeoffs:** fold/expand state is per window (`windows[].folds`, RM261003ABZP-DES2@R2) and is not persisted across restarts.

### RM261003ABZP-UDES5@R2: One Picker component for every list overlay, plus which-key and help, filtered by file type

- **Requirements:** RM261003ABZP-UREQ5@R2
- **Decision:** `PickerSource` abstraction for files (every non-excluded file), recent, grep (notes and text files), headings, tags, backlinks, commands, templates, move targets; which-key after 300 ms with direct actions first; help is a grouped picker with override markers and file-type scope labels; preview pane only ≥ 100 cols; palette, `:` completion, and which-key show only commands and keys available for the active file type.
- **Rationale:** one component keeps behavior consistent and new pickers a registration (RM261003ABZP-REQ11@R3); filtering by file type means a listed command always runs (AD4).
- **Mockups:** RM261003ABZP-M3@R1
- **Surfaces or Components:** Surface: Overlays; Component: Which-key; Component: Picker; Component: Command line
- **Success Criteria:** RM261003ABZP-US3@R2
- **Tradeoffs:** sources with special layouts (calendar) stay separate components; a user looking for a note command while in a code file must switch buffers to see it.

### RM261003ABZP-UDES6@R1: Link interactions show context before consequences

- **Requirements:** RM261003ABZP-UREQ6@R1
- **Decision:** `[[` popup that never covers the cursor line; `gd`/`Enter` follow with `jump i/n` indicator; create prompt for unresolved links; backlinks panel (linked then unlinked, `l` links a mention); rename prompt shows impact before `Enter`.
- **Rationale:** M3/M4 and A:Behaviour details; showing impact first prevents surprise multi-file edits.
- **Mockups:** RM261003ABZP-M3@R1, RM261003ABZP-M4@R1
- **Surfaces or Components:** Surface: Links and backlinks; Component: Completion popup; Component: Prompt
- **Success Criteria:** RM261003ABZP-US4@R1
- **Tradeoffs:** `l` edits another note's text from the panel (`link.linkMention`, RM261003ABZP-REQ4@R3, RM261003ABZP-DES7@R3); the edit goes through the normal save path and is undoable in that note.

### RM261003ABZP-UDES7@R2: Explorer operations, refused files, and conflict resolution as explicit, single-key prompts

- **Requirements:** RM261003ABZP-UREQ7@R2
- **Decision:** neo-tree keys `a r m d` (`a` adds `.md` only when the name has no extension); trash prompt with typed-confirm fallback; conflict dialog `k/t/d` with autosave paused and a side-by-side (stacked when narrow) diff; undoable reload notice; binary and oversized files refused with one message-line text and no buffer.
- **Rationale:** M4; single keys stay fast while destructive steps stay explicit; refusing in the message line (M1 S6 visuals) never risks a text save over a binary file (RM261003ABZP-DES17@R1).
- **Mockups:** RM261003ABZP-M4@R1, RM261003ABZP-M1@R1
- **Surfaces or Components:** Surface: File operations and disk changes; Component: Prompt; Component: Conflict dialog and diff
- **Success Criteria:** RM261003ABZP-US5@R2
- **Tradeoffs:** `Esc` does not dismiss the conflict dialog (must choose), slightly slower but safe; refused files offer no hex or external-open action in v1.

### RM261003ABZP-UDES8@R1: Fixed-size Monday-first calendar and preview-first template picking

- **Requirements:** RM261003ABZP-UREQ8@R2
- **Decision:** 36-column calendar float with `•` marks, `H/L` month paging, `t` today; template picker previews source above expansion; new note = title prompt → template picker with `(blank note)` first.
- **Rationale:** M5@R2; fixed size fits 80×24 unchanged.
- **Mockups:** RM261003ABZP-M5@R2
- **Surfaces or Components:** Surface: Daily notes and templates; Component: Calendar; Component: Picker; Component: Prompt
- **Success Criteria:** RM261003ABZP-US6@R1
- **Tradeoffs:** week start fixed to Monday in v1 (no config).

### RM261003ABZP-UDES9@R1: Bases views with visible write-back and explained restrictions

- **Requirements:** RM261003ABZP-UREQ9@R1
- **Decision:** toolbar with view tabs and counts; table with sort/group/filter keys and type-specific cell editors; Kanban with `H/L` moves; every write toasts its frontmatter diff; disabled moves and fallback layouts explain themselves.
- **Rationale:** M6; visible diffs make in-place edits trustworthy.
- **Mockups:** RM261003ABZP-M6@R1
- **Surfaces or Components:** Surface: Bases views; Component: Base table; Component: Kanban board; Component: Toast stack
- **Success Criteria:** RM261003ABZP-US7@R1
- **Tradeoffs:** no drag-and-drop; mouse limited to view tabs.

### RM261003ABZP-UDES10@R2: Passive, connection-aware browser page with paused-follow navigation

- **Requirements:** RM261003ABZP-UREQ10@R1
- **Decision:** static page with header badge (`Live`, `Reconnecting…`, `Stopped`, `Offline`), article swaps from `/render`, changed-block highlight, wikilink navigation that pauses following with a banner, OS-scheme theme with toggle, overflow scrolling inside wide blocks, no editing controls; KaTeX and Mermaid come from the page's own origin, so math and diagrams render offline, and a render error shows that block's source with a label.
- **Rationale:** M7; the page never fails silently and never offers edits.
- **Mockups:** RM261003ABZP-M7@R1
- **Surfaces or Components:** Surface: Browser preview page
- **Success Criteria:** RM261003ABZP-US8@R1
- **Tradeoffs:** `Stopped` relies on the `stopped` SSE event (RM261003ABZP-DES13@R3); a crash without the event shows `Reconnecting…` then `Offline`.

### RM261003ABZP-UDES11@R1: Token-based themes with an attribute-only NO_COLOR mapping and keyboard-first input

- **Requirements:** RM261003ABZP-UREQ11@R1, RM261003ABZP-UREQ1@R2
- **Decision:** dark/light/nocolor themes over named tokens; NO_COLOR resolution per RM261003ABZP-REQ11@R3; every state has a non-colour attribute; narrow layout rules from Section 5; hardware cursor follows focus; mouse optional.
- **Rationale:** accessibility and terminal portability are requirements, not polish.
- **Mockups:** RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (M5@R2)
- **Surfaces or Components:** Section 5; Component: Theme
- **Success Criteria:** RM261003ABZP-US9@R1
- **Tradeoffs:** truecolor fidelity of the mockups is approximated in 256-colour terminals.

# 10. Acceptance

## Acceptance

- **Accepted mockup revisions:** RM261003ABZP-M1@R1, RM261003ABZP-M2@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1 (shared R1)
- **Acceptance evidence:** Delegated acceptance recorded in `ui-mockups/manifest.md` Acceptance (2026-10-03; M5@R2 re-accepted after edit cycle 1). Not explicit user acceptance — the user's own mockup review is pending.

## Open Questions and Blockers

- None — the four system-support gaps were resolved by RM261003ABZP-REQ4@R3, RM261003ABZP-DES2@R2, RM261003ABZP-DES7@R2 (current RM261003ABZP-DES7@R3), RM261003ABZP-DES9@R2 (current RM261003ABZP-DES9@R3), and RM261003ABZP-DES13@R2 (current RM261003ABZP-DES13@R3).
