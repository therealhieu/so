# RM261003ABZP: so v1 — Requirements Revisions

- **Current requirements:** `rm261003abzp-requirements.md`
- **Purpose:** Append-only history of prior definitions and reconciliation decisions; not current planning inputs.
- **Revision scope:** Individual requirements, not this document.

## Archived Changes

- **RM261003ABZP-REQ1@R1 … RM261003ABZP-REQ11@R1 — Research reconciliation**
  - Archived at: 2026-10-03T01:52:30Z
  - Change type: Reconciliation update
  - Reason: Research `rm261003abzp-research.md` found under-specified safety, compatibility, measurement, and release criteria.
  - Changes: Acceptance criteria revised for all eleven requirements; REQ5, REQ7, and REQ9 requirement statements revised; persistent state folded into REQ3; macOS signing deferred; reconciliation recorded.
  - Requirement transitions:
    - RM261003ABZP-REQ1@R1 → RM261003ABZP-REQ1@R2 - revision change (atomic write, directory watching, undoable reload, trash standard)
    - RM261003ABZP-REQ2@R1 → RM261003ABZP-REQ2@R2 - revision change (undo block, Esc timeout)
    - RM261003ABZP-REQ3@R1 → RM261003ABZP-REQ3@R2 - revision change (XDG relative-path rule, state location)
    - RM261003ABZP-REQ4@R1 → RM261003ABZP-REQ4@R2 - revision change (resolution rule, chained headings, format-preserving rename)
    - RM261003ABZP-REQ5@R1 → RM261003ABZP-REQ5@R2 - revision change (block reveal, kitty/sixel/blocks, comments)
    - RM261003ABZP-REQ6@R1 → RM261003ABZP-REQ6@R2 - revision change (time variable, token subset, subfolder formats)
    - RM261003ABZP-REQ7@R1 → RM261003ABZP-REQ7@R2 - revision change (Kanban board, layout fallbacks, move rules)
    - RM261003ABZP-REQ8@R1 → RM261003ABZP-REQ8@R2 - revision change (Host check, realpath containment)
    - RM261003ABZP-REQ9@R1 → RM261003ABZP-REQ9@R2 - revision change (reference machine, in-process metric, CI median)
    - RM261003ABZP-REQ10@R1 → RM261003ABZP-REQ10@R2 - revision change (no TS API, release recipe, checksums, pinning)
    - RM261003ABZP-REQ11@R1 → RM261003ABZP-REQ11@R2 - revision change (exact standards, OpenTUI containment, terminal support)
  - Evidence: `rm261003abzp-research.md` Requirement Assessment
  - Research provenance:
    - `RM261003ABZP-RF1`–`RM261003ABZP-RF15` - see Research Reconciliation in the current requirements; each evaluated REQ@R1 → informed REQ@R2
  - Affected reconciliation: Research Reconciliation status Pending → Complete
  - Approval evidence: User delegated all decisions on 2026-10-03 ("you self-drive and decide all … don't raise any question to me"); agent approved the dispositions under that delegation.
  - Downstream impact: None — no design or roadmap artifacts exist yet.

`````markdown
# RM261003ABZP: so v1 — Requirements

- **Status:** Approved
- **Outcome:** `so` is a fast, vim-modal terminal Markdown editor for a plain folder of notes, with Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, built as one lean Bun/TypeScript process with fast development and CI.
- **History:** `rm261003abzp-requirements-revisions.md`

Use `None` for empty sections and fields.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R1` - empty repository with `.s1mple/` guidance only; Alfred provides portable Markdown, Obsidian syntax, vim, terminal graphics, and Bases code.
- **User input:** Neovim/LazyVim for Markdown in Obsidian style; no AI, chat, LLM, vault, or Git; fast and smooth UI/UX; fast development, CI, and CD; stable, simple, maintainable, extensible design that meets industry standards; TypeScript, lean and simple; own vim engine; OpenTUI; read-only `Bun.serve` preview without Next.js; v1 scope Links core + Live preview + Daily notes/templates + Bases; few phases and delivery items.
- **Research:** `rm261003abzp-research.md`
- **Binding constraints:** `.s1mple/S1MPLE.md` Implementation "Keep it lean and simple"; TypeScript (`.s1mple/docs/project.md`); user exclusions (AI, chat, LLM, vault registry, Git, Next.js, web editing).

## Scope

- **In scope**
  - Opening a folder as the workspace and managing its Markdown files.
  - Vim-modal editing with a core vim command set.
  - LazyVim-style navigation: leader keys, which-key hints, fuzzy pickers, command palette, configuration.
  - Obsidian-compatible links, backlinks, tags, and link-safe rename.
  - Obsidian-style live preview, including inline images.
  - Daily notes and templates.
  - Obsidian Bases table and board views.
  - Read-only local browser preview.
  - Performance targets, fast development and CI, release binaries, and enforced maintainability standards.

- **Out of scope**
  - AI, chat, and LLM features — user exclusion.
  - Vault registry and multi-vault management — user exclusion; the workspace is the opened folder.
  - Git integration and sync — user exclusion.
  - Next.js, a full web app, and web editing — user decision; the preview is read-only.
  - Reading or writing Obsidian's `.obsidian/` settings — keeps `so` independent of Obsidian's internal config formats (agent decision under delegated authority).
  - Plugin API, graph view, Canvas, mobile, and Windows — not requested; see Deferred Considerations.

- **Minimum valuable release**
  - Open a folder, browse and manage notes, edit them with vim keys and autosave, jump between notes through wikilinks and the quick switcher.

## Current Requirements

| Reference | Requirement | Dependencies |
|---|---|---|
| RM261003ABZP-REQ1@R1 | Folder workspace and safe file management | None |
| RM261003ABZP-REQ2@R1 | Vim-modal editing with a core command set | RM261003ABZP-REQ1@R1 |
| RM261003ABZP-REQ3@R1 | LazyVim-style navigation, commands, and configuration | RM261003ABZP-REQ1@R1, RM261003ABZP-REQ2@R1 |
| RM261003ABZP-REQ4@R1 | Obsidian-compatible links, backlinks, tags, and rename | RM261003ABZP-REQ1@R1, RM261003ABZP-REQ3@R1 |
| RM261003ABZP-REQ5@R1 | Obsidian-style live preview | RM261003ABZP-REQ2@R1, RM261003ABZP-REQ4@R1 |
| RM261003ABZP-REQ6@R1 | Daily notes and templates | RM261003ABZP-REQ1@R1, RM261003ABZP-REQ3@R1 |
| RM261003ABZP-REQ7@R1 | Obsidian Bases table and board views | RM261003ABZP-REQ1@R1, RM261003ABZP-REQ3@R1 |
| RM261003ABZP-REQ8@R1 | Read-only local browser preview | RM261003ABZP-REQ4@R1, RM261003ABZP-REQ5@R1 |
| RM261003ABZP-REQ9@R1 | Fast and smooth performance targets | RM261003ABZP-REQ2@R1, RM261003ABZP-REQ5@R1 |
| RM261003ABZP-REQ10@R1 | Fast development, CI, and release | None |
| RM261003ABZP-REQ11@R1 | Maintainable, standards-based foundations | None |

## Requirement Details

- **RM261003ABZP-REQ1@R1 — Folder workspace and safe file management**
  - **Question:** What does `so` open, and how are notes kept safe?
  - **Requirement:** A user runs `so [path]`; a folder path (default: current directory) becomes the workspace, and a file path opens that file with its parent folder as the workspace. The user browses the folder tree and creates, renames, moves, and deletes notes and folders. Edits autosave and can also be saved with `:w`; saves never corrupt or silently overwrite files.
  - **Rationale:** "No vault" means the folder is the workspace, like `nvim .`; data safety is the first duty of an editor.
  - **Acceptance criteria:**
    - `so ~/notes` shows the folder tree; `so ~/notes/a.md` opens `a.md` with `~/notes` as the workspace; a missing path exits non-zero with a message.
    - Create, rename, move, and delete work for notes and folders from the explorer; delete asks for confirmation and moves the item to the OS trash when available, otherwise requires a typed confirmation.
    - Autosave writes about 1 s after typing stops, on leaving Insert mode, on switching notes, and on exit; `:w` saves immediately.
    - Writes are atomic (temp file + rename); a crash mid-write leaves the old or new file, never a partial one.
    - When a file changes on disk while open and unmodified, the buffer reloads; when it also has unsaved edits, the user sees a conflict prompt (keep mine, take disk, view diff) and nothing is overwritten silently.
    - Hidden folders (`.git`, `.obsidian`, `node_modules`) and files matched by `.gitignore` are excluded from the tree and index.
  - **Dependencies:** None
  - **Predecessors:** None
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "no vault"; folder opened as the workspace.
    - `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - existing autosave queue to port.
  - **Research links:** None
  - **Example:** `so ~/notes/projects/plan.md` opens `plan.md`; the explorer shows `~/notes`; typing then pausing saves the note without `:w`.

- **RM261003ABZP-REQ2@R1 — Vim-modal editing with a core command set**
  - **Question:** How much of vim must the editor support?
  - **Requirement:** The editor provides Normal, Insert, Visual (characterwise and linewise), and Command-line modes with the core vim command set, window splits, and multiple open buffers.
  - **Rationale:** "Neovim for Markdown" requires real modal editing; the core set covers daily editing without the cost of full vim parity.
  - **Acceptance criteria:**
    - Motions: `h j k l w b e W B E 0 ^ $ gg G f F t T ; , % { } H M L`, `Ctrl-d Ctrl-u`, counts on all motions.
    - Operators `d c y > <` with motions and text objects `iw aw iW aW i" a" i' a' i( a( i[ a[ i{ a{ ip ap`; `dd cc yy`, `x X p P J r ~ o O A I`.
    - Registers: unnamed, `"0`–`"9`, named `"a`–`"z`, and `"+` for the system clipboard.
    - Undo and redo (`u`, `Ctrl-r`) per change; `.` repeats the last change.
    - Search `/ ? n N * #` with match highlighting; `:s/pat/rep/[g]` on the current line and `:%s` on the whole buffer.
    - Ex commands `:w :q :wq :q! :e <path> :sp :vs :bn :bp :bd`; window navigation `Ctrl-w h/j/k/l`.
    - Mode is shown in the status line; the cursor changes shape between Normal and Insert where the terminal supports it.
  - **Dependencies:** RM261003ABZP-REQ1@R1 - Folder workspace and safe file management
  - **Predecessors:** None
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - own vim engine decision.
    - `alfred/apps/tui/src/view/editor/vim.ts:15` - current engine supports only Normal and Insert.
  - **Research links:** None
  - **Example:** `ci(` inside `[[link](url)` replaces the URL; `.` on the next link repeats it.

- **RM261003ABZP-REQ3@R1 — LazyVim-style navigation, commands, and configuration**
  - **Question:** How does the user find notes and trigger commands?
  - **Requirement:** Commands are reachable through a leader key with which-key hints, a fuzzy picker family, and a command palette; every command has a name. Users override options and keymaps in a configuration file, and a help view lists keys.
  - **Rationale:** LazyVim's discoverability (leader + which-key + pickers) is what makes a modal editor learnable.
  - **Acceptance criteria:**
    - `Space` is the default leader; pausing after it shows a which-key popup of next keys grouped by prefix.
    - Pickers: files (quick switcher), full-text search, headings in the current note, tags, backlinks, recent notes, commands. Each filters with fuzzy matching as the user types and previews the selection.
    - A side explorer toggles with `<leader>e`; an outline of headings toggles with `<leader>o`.
    - The command palette (`<leader>:` and `:`) runs any named command with completion.
    - Configuration lives at `$XDG_CONFIG_HOME/so/config.toml` (default `~/.config/so/config.toml`); invalid config shows a clear error and falls back to defaults without crashing.
    - `?` or `:help` shows the active keymap, including user overrides.
  - **Dependencies:** RM261003ABZP-REQ1@R1, RM261003ABZP-REQ2@R1
  - **Predecessors:** None
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "neovim/lazyvim for markdown".
  - **Research links:** None
  - **Example:** `Space f f`, type `pln`, Enter opens `projects/plan.md`.

- **RM261003ABZP-REQ4@R1 — Obsidian-compatible links, backlinks, tags, and rename**
  - **Question:** Which Obsidian linking features are required?
  - **Requirement:** The user writes, completes, follows, and inspects Obsidian links and tags; renaming a note updates every link to it. Files remain valid for Obsidian.
  - **Rationale:** Links are the core of an Obsidian-style knowledge base.
  - **Acceptance criteria:**
    - Recognized syntax: `[[note]]`, `[[note|alias]]`, `[[note#Heading]]`, `[[note#^block-id]]`, `![[embed]]`, Markdown links to `.md` files, `#tag` and nested `#tag/sub`, frontmatter `tags` and `aliases`.
    - Link resolution follows Obsidian's shortest-unique-path rule; aliases resolve.
    - `gd` or `Enter` on a link opens its target at the heading or block; `Ctrl-o`/`Ctrl-i` move back and forward through jump history.
    - Following an unresolved link offers to create the note.
    - Typing `[[` opens completion over note names, aliases, headings (after `#`), and block ids (after `#^`).
    - A backlinks panel lists linked and unlinked mentions with context lines; a tags picker lists tags with counts and opens matching notes.
    - Renaming or moving a note updates all links to it across the workspace and reports the count of changed files.
    - `.obsidian/` is never read or written.
  - **Dependencies:** RM261003ABZP-REQ1@R1, RM261003ABZP-REQ3@R1
  - **Predecessors:** None
  - **Evidence:**
    - `alfred/packages/view-model/src/markdown/obsidian-syntax.ts` - existing Obsidian syntax corpus.
  - **Research links:** None
  - **Example:** renaming `plan.md` to `roadmap.md` rewrites `[[plan]]` to `[[roadmap]]` in 12 files and reports "12 files updated".

- **RM261003ABZP-REQ5@R1 — Obsidian-style live preview**
  - **Question:** How is Markdown rendered while editing?
  - **Requirement:** By default, notes render in live preview: Markdown syntax is hidden and rendered except on the cursor line (or selection), where the source is shown. Users toggle to source mode and to a read-only reading mode.
  - **Rationale:** Live preview is Obsidian's defining editing experience; `so` controls rendering because it owns the editor.
  - **Acceptance criteria:**
    - Rendered: headings, emphasis, strikethrough, highlights `==x==`, inline code, links (as link text), lists, task checkboxes (toggle with `Enter` or `<leader>x`), block quotes, callouts with type icon and fold, tables aligned to columns, fenced code with syntax highlighting, horizontal rules, footnotes, frontmatter as a properties block.
    - The line or selection under the cursor shows its raw source; moving away re-renders it.
    - Note embeds `![[note]]` and `![[note#Heading]]` render inline, collapsed beyond a configurable height.
    - Images render inline using the best available terminal graphics protocol (kitty, iTerm2, sixel) with a half-block fallback and a text placeholder when graphics are unavailable or disabled.
    - Math (`$…$`, `$$…$$`) and Mermaid blocks render as text approximations, with source shown on the cursor line.
    - `<leader>m` cycles live preview → source → reading.
  - **Dependencies:** RM261003ABZP-REQ2@R1, RM261003ABZP-REQ4@R1
  - **Predecessors:** None
  - **Evidence:**
    - `alfred/apps/tui/src/view/editor/reveal-units.ts`, `alfred/apps/tui/src/terminal/capabilities.ts:3-6` - existing reveal units and graphics tiers.
  - **Research links:** None
  - **Example:** `**bold**` shows as bold text; moving the cursor onto the line shows the asterisks.

- **RM261003ABZP-REQ6@R1 — Daily notes and templates**
  - **Question:** How are daily notes and templates created?
  - **Requirement:** One command opens today's daily note, creating it from a template when missing; users insert templates into any note; new notes can start from a template.
  - **Rationale:** Daily notes and templates are core Obsidian workflows the user selected for v1.
  - **Acceptance criteria:**
    - `<leader>nd` or `:Today` opens `<daily folder>/<YYYY-MM-DD>.md`, creating it from the daily template if missing; `:Yesterday`, `:Tomorrow`, and a date picker open adjacent days.
    - Daily folder, date format, and template path are configurable; defaults are `daily/`, `YYYY-MM-DD`, and `templates/daily.md`.
    - `<leader>nt` picks a template from the templates folder (default `templates/`) and inserts it at the cursor.
    - Template variables `{{title}}`, `{{date}}`, `{{time}}`, and `{{date:FORMAT}}` expand on insert, matching Obsidian's core Templates plugin.
    - Creating a new note (`<leader>nn`) optionally starts from a chosen template.
  - **Dependencies:** RM261003ABZP-REQ1@R1, RM261003ABZP-REQ3@R1
  - **Predecessors:** None
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "Daily notes and templates" in v1.
  - **Research links:** None
  - **Example:** on 2026-10-03, `:Today` creates `daily/2026-10-03.md` with the template's `# {{date}}` expanded to `# 2026-10-03`.

- **RM261003ABZP-REQ7@R1 — Obsidian Bases table and board views**
  - **Question:** What Bases support is required?
  - **Requirement:** Opening a `.base` file shows its views as a table or board over notes selected by its filters; users sort, filter, and edit properties in place, and `![[file.base]]` embeds render in notes.
  - **Rationale:** The user selected Bases for v1; Alfred's engine already evaluates the Obsidian Bases format.
  - **Acceptance criteria:**
    - `.base` YAML with `filters`, `formulas`, `properties`, and `views` (types `table` and `cards`/board) is parsed and evaluated with the expression subset Alfred supports; unsupported syntax shows a diagnostic instead of failing.
    - Table view: columns from view `order`, sort, grouping, keyboard cell navigation, and in-place editing of frontmatter properties that writes back to the note.
    - Board view: cards grouped by a property; moving a card between columns updates that property.
    - Switching between a base's views and opening a row's note work from the keyboard.
    - `![[file.base]]` and `![[file.base#View]]` render the view inline in live preview.
    - Files edited through Bases stay valid for Obsidian.
  - **Dependencies:** RM261003ABZP-REQ1@R1, RM261003ABZP-REQ3@R1
  - **Predecessors:** None
  - **Evidence:**
    - `alfred/packages/vault/src/domain/bases/parser.ts:19`, `alfred/packages/vault/src/domain/bases/evaluator.ts:164` - existing Bases parser and evaluator.
  - **Research links:** None
  - **Example:** a `tasks.base` board grouped by `status`; moving a card from `todo` to `done` sets `status: done` in that note's frontmatter.

- **RM261003ABZP-REQ8@R1 — Read-only local browser preview**
  - **Question:** What does the web preview do?
  - **Requirement:** `:Preview` serves the current note as rendered HTML on `127.0.0.1` and opens the browser; the page follows note switches and edits live and is read-only.
  - **Rationale:** Browser rendering gives full-fidelity images, math, and diagrams without a web app.
  - **Acceptance criteria:**
    - `:Preview` starts a local server bound to `127.0.0.1` on a free port and opens the default browser; `:PreviewStop` stops it.
    - The page updates within 300 ms of an edit or note switch, keeping scroll position near the cursor's heading.
    - Rendering covers the same Obsidian syntax as live preview, with real images, KaTeX math, and Mermaid diagrams.
    - Wikilinks in the page navigate the preview to the linked note; the page has no editing controls.
    - Only files inside the workspace are served; path traversal attempts return 404.
  - **Dependencies:** RM261003ABZP-REQ4@R1, RM261003ABZP-REQ5@R1
  - **Predecessors:** None
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - read-only preview with `Bun.serve`, no Next.js.
  - **Research links:** None
  - **Example:** editing a heading in the terminal updates the open browser tab without a manual reload.

- **RM261003ABZP-REQ9@R1 — Fast and smooth performance targets**
  - **Question:** What does "fast and smooth" mean measurably?
  - **Requirement:** `so` meets the performance targets below on a 2021-or-newer laptop.
  - **Rationale:** The user requires fast and smooth UI/UX; targets make it testable.
  - **Acceptance criteria:**
    - Keypress to rendered frame: p95 < 16 ms while editing a 5,000-line note in live preview.
    - Cold start to first interactive frame: < 200 ms for a 10,000-note folder (indexing continues in the background).
    - Opening a note: < 50 ms for a 5,000-line note.
    - Workspace index of 10,000 notes completes in < 3 s without blocking input.
    - Scrolling holds 60 frames per second without dropped input.
    - Benchmarks for these targets run in CI and fail on a regression above 2× the target.
  - **Dependencies:** RM261003ABZP-REQ2@R1, RM261003ABZP-REQ5@R1
  - **Predecessors:** None
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - user-approved proposal targets.
  - **Research links:** None
  - **Example:** holding `j` in a 5,000-line note scrolls without visible lag.

- **RM261003ABZP-REQ10@R1 — Fast development, CI, and release**
  - **Question:** What does fast development, CI, and CD mean measurably?
  - **Requirement:** A developer runs all checks locally in under 30 s; CI finishes in under 3 min per push; tagged releases publish installable binaries automatically.
  - **Rationale:** The user requires fast development and CI/CD.
  - **Acceptance criteria:**
    - One command (`bun run check`) runs format, lint, typecheck, dead-code, boundary checks, and unit tests in < 30 s on a developer laptop.
    - CI on every push and pull request completes in < 3 min wall clock.
    - Pushing a `v*` tag builds and publishes macOS (arm64, x64) and Linux (x64, arm64) binaries to a GitHub Release.
    - No build step is needed to run from source (`bun run dev`).
  - **Dependencies:** None
  - **Predecessors:** None
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - local check < 30 s, CI < 3 min.
  - **Research links:** None
  - **Example:** `git tag v0.1.0 && git push --tags` produces a release with four binaries.

- **RM261003ABZP-REQ11@R1 — Maintainable, standards-based foundations**
  - **Question:** How are stability, simplicity, extensibility, and standards enforced?
  - **Requirement:** The codebase keeps a pure core separate from I/O and UI with tool-enforced boundaries, extends through registries rather than edits, follows named industry standards, and always leaves the terminal usable.
  - **Rationale:** The user requires stable, simple, maintainable, extensible designs that meet industry standards.
  - **Acceptance criteria:**
    - Layer boundaries (core imports no I/O, UI, or runtime APIs) fail CI when violated.
    - New commands, keymaps, Markdown syntax extensions, and block renderers are added by registration without editing dispatch code.
    - Standards: CommonMark 0.31 + GFM, Obsidian Flavored Markdown, XDG Base Directory, `NO_COLOR`, Conventional Commits, Semantic Versioning, strict TypeScript ESM.
    - The terminal is restored (alternate screen, cursor, mouse modes) on every exit path, including crashes and `SIGTERM`.
    - Supported platforms are macOS and Linux; terminals kitty, Ghostty, WezTerm, and iTerm2 get full graphics, others get the half-block fallback.
  - **Dependencies:** None
  - **Predecessors:** None
  - **Evidence:**
    - `alfred/apps/tui/src/terminal/shutdown.ts` - existing terminal-restore coordinator.
  - **Research links:** None
  - **Example:** a contributor adds a `:Wordcount` command by registering it; no switch statement changes.

## Research Reconciliation

- **Status:** Pending

## Deferred Considerations

- **Vim macros, Visual block mode, and Ex ranges**
  - **Reason:** Outside the core set; adds engine scope without being needed for daily Markdown editing.
  - **Resolution trigger:** User demand after v1.
  - **Related references:** RM261003ABZP-REQ2@R1 - core vim command set

- **Plugin API**
  - **Reason:** No demonstrated need; registries cover internal extension.
  - **Resolution trigger:** A concrete third-party extension request.
  - **Related references:** RM261003ABZP-REQ11@R1 - registries

- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** Not requested for v1.
  - **Resolution trigger:** Explicit user request.
  - **Related references:** None

## Unresolved Items

None

## Approval

- **Approved baseline:** RM261003ABZP-REQ1@R1 through RM261003ABZP-REQ11@R1
- **Research dispositions:** Pending
- **Approval evidence:** User delegated all decisions on 2026-10-03: "you self-drive and decide all based on the proposal and these criteria … don't raise any question to me"; the agent approved this ledger under that delegation.
`````

- **RM261003ABZP-REQ3@R2 — Help key conflict with backward search**
  - Archived at: 2026-10-03T02:37:31Z
  - Change type: Revised
  - Reason: Mockup initialization (`ui-mockups/manifest.md` Open Items) found REQ3@R2's `?` help key conflicts with REQ2@R2's `?` backward search.
  - Changes: REQ3 help criterion `?` or `:help` → `<leader>?` or `:help`; dependency pointers in REQ4, REQ6, REQ7 updated to REQ3@R3 (their revisions retained).
  - Requirement transitions:
    - RM261003ABZP-REQ3@R2 → RM261003ABZP-REQ3@R3 - revision change
  - Evidence: `ui-mockups/manifest.md` Open Items "Help key conflict"; RM261003ABZP-REQ2@R2 search criterion.
  - Research provenance:
    - None
  - Affected reconciliation: None
  - Approval evidence: User delegated all decisions on 2026-10-03; agent approved under that delegation (vim keeps `?` as backward search, LazyVim uses `<leader>?`).
  - Downstream impact: `rm261003abzp-design.md` requirement baseline (coverage update, DES revisions retained); `rm261003abzp-ui-context.md` baseline pointer; `ui-mockups/manifest.md` open item resolved — mockups already implement `<leader>?`.

`````markdown
# RM261003ABZP: so v1 — Requirements

- **Status:** Approved
- **Outcome:** `so` is a fast, vim-modal terminal Markdown editor for a plain folder of notes, with Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, built as one lean Bun/TypeScript process with fast development and CI.
- **History:** `rm261003abzp-requirements-revisions.md`

Use `None` for empty sections and fields.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R1` - empty repository with `.s1mple/` guidance only; Alfred provides portable Markdown, Obsidian syntax, vim, terminal graphics, and Bases code.
- **User input:** Neovim/LazyVim for Markdown in Obsidian style; no AI, chat, LLM, vault, or Git; fast and smooth UI/UX; fast development, CI, and CD; stable, simple, maintainable, extensible design that meets industry standards; TypeScript, lean and simple; own vim engine; OpenTUI; read-only `Bun.serve` preview without Next.js; v1 scope Links core + Live preview + Daily notes/templates + Bases; few phases and delivery items; agent decides all choices.
- **Research:** `rm261003abzp-research.md`
- **Binding constraints:** `.s1mple/S1MPLE.md` Implementation "Keep it lean and simple"; TypeScript (`.s1mple/docs/project.md`); user exclusions (AI, chat, LLM, vault registry, Git, Next.js, web editing).

## Scope

- **In scope**
  - Opening a folder as the workspace and managing its Markdown files.
  - Vim-modal editing with a core vim command set.
  - LazyVim-style navigation: leader keys, which-key hints, fuzzy pickers, command palette, configuration, persisted recent notes and jump history.
  - Obsidian-compatible links, backlinks, tags, and link-safe rename.
  - Obsidian-style live preview, including inline images.
  - Daily notes and templates.
  - Obsidian Bases table and Kanban views.
  - Read-only local browser preview.
  - Performance targets, fast development and CI, release binaries, and enforced maintainability standards.

- **Out of scope**
  - AI, chat, and LLM features — user exclusion.
  - Vault registry and multi-vault management — user exclusion; the workspace is the opened folder.
  - Git integration and sync — user exclusion.
  - Next.js, a full web app, and web editing — user decision; the preview is read-only.
  - Reading or writing Obsidian's `.obsidian/` settings — keeps `so` independent of Obsidian's internal config formats (agent decision under delegated authority).
  - Plugin API, graph view, Canvas, mobile, Windows, and macOS signing — see Deferred Considerations.

- **Minimum valuable release**
  - Open a folder, browse and manage notes, edit them with vim keys and autosave, jump between notes through wikilinks and the quick switcher.

## Current Requirements

| Reference | Requirement | Dependencies |
|---|---|---|
| RM261003ABZP-REQ1@R2 | Folder workspace and safe file management | None |
| RM261003ABZP-REQ2@R2 | Vim-modal editing with a core command set | RM261003ABZP-REQ1@R2 |
| RM261003ABZP-REQ3@R2 | LazyVim-style navigation, commands, configuration, and state | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2 |
| RM261003ABZP-REQ4@R2 | Obsidian-compatible links, backlinks, tags, and rename | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R2 |
| RM261003ABZP-REQ5@R2 | Obsidian-style live preview | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R2 |
| RM261003ABZP-REQ6@R2 | Daily notes and templates | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R2 |
| RM261003ABZP-REQ7@R2 | Obsidian Bases table and Kanban views | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R2 |
| RM261003ABZP-REQ8@R2 | Read-only local browser preview | RM261003ABZP-REQ4@R2, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ9@R2 | Fast and smooth performance targets | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ10@R2 | Fast development, CI, and release | None |
| RM261003ABZP-REQ11@R2 | Maintainable, standards-based foundations | None |

## Requirement Details

- **RM261003ABZP-REQ1@R2 — Folder workspace and safe file management**
  - **Question:** What does `so` open, and how are notes kept safe?
  - **Requirement:** A user runs `so [path]`; a folder path (default: current directory) becomes the workspace, and a file path opens that file with its parent folder as the workspace. The user browses the folder tree and creates, renames, moves, and deletes notes and folders. Edits autosave and can also be saved with `:w`; saves never corrupt or silently overwrite files.
  - **Rationale:** "No vault" means the folder is the workspace, like `nvim .`; data safety is the first duty of an editor.
  - **Acceptance criteria:**
    - `so ~/notes` shows the folder tree; `so ~/notes/a.md` opens `a.md` with `~/notes` as the workspace; a missing path exits non-zero with a message.
    - Create, rename, move, and delete work for notes and folders from the explorer. On Linux, delete moves the item to the freedesktop home trash (`$XDG_DATA_HOME/Trash`); on macOS, it moves the item to the user's Trash when the system allows it; otherwise deletion requires a typed confirmation.
    - Autosave writes about 1 s after typing stops, on leaving Insert mode, on switching notes, and on exit; `:w` saves immediately.
    - Saves write a temporary file in the same directory, fsync it, preserve the original file's permission bits, then rename it over the target, resolving symlinks to their target first. A crash at any point leaves the complete old or the complete new file.
    - External changes are detected by watching directories, not file inodes, and events caused by `so`'s own saves are ignored. When an open, unmodified buffer changes on disk, it reloads and the reload can be undone. When the buffer also has unsaved edits, a conflict prompt offers keep mine, take disk, or view diff, and nothing is overwritten silently.
    - Hidden folders (`.git`, `.obsidian`, `node_modules`) and files matched by `.gitignore` are excluded from the tree and index.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ1@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "no vault"; folder opened as the workspace.
    - `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - existing autosave queue to port.
  - **Research links:**
    - `RM261003ABZP-RF11` - temp + fsync + rename in the same directory, directory watching, undoable reload, freedesktop trash; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2
  - **Example:** `so ~/notes/projects/plan.md` opens `plan.md`; the explorer shows `~/notes`; typing then pausing saves the note without `:w`.

- **RM261003ABZP-REQ2@R2 — Vim-modal editing with a core command set**
  - **Question:** How much of vim must the editor support?
  - **Requirement:** The editor provides Normal, Insert, Visual (characterwise and linewise), and Command-line modes with the core vim command set, window splits, and multiple open buffers.
  - **Rationale:** "Neovim for Markdown" requires real modal editing; the core set covers daily editing without the cost of full vim parity.
  - **Acceptance criteria:**
    - Motions: `h j k l w b e W B E 0 ^ $ gg G f F t T ; , % { } H M L`, `Ctrl-d Ctrl-u`, counts on all motions.
    - Operators `d c y > <` with motions and text objects `iw aw iW aW i" a" i' a' i( a( i[ a[ i{ a{ ip ap`; `dd cc yy`, `x X p P J r ~ o O A I`.
    - Registers: unnamed, `"0`–`"9`, named `"a`–`"z`, and `"+` for the system clipboard.
    - Undo and redo (`u`, `Ctrl-r`) per vim undo block: one Normal-mode command, or one Insert-mode session from entry to `Esc`, is one undo step. `.` repeats the last change.
    - `Esc` switches to Normal mode immediately on terminals with the kitty keyboard protocol; on other terminals it does so after a configurable escape timeout (default 50 ms).
    - Search `/ ? n N * #` with match highlighting; `:s/pat/rep/[g]` on the current line and `:%s` on the whole buffer.
    - Ex commands `:w :q :wq :q! :e <path> :sp :vs :bn :bp :bd`; window navigation `Ctrl-w h/j/k/l`.
    - Mode is shown in the status line; the cursor changes shape between Normal and Insert where the terminal supports it.
  - **Dependencies:** RM261003ABZP-REQ1@R2 - Folder workspace and safe file management
  - **Predecessors:** RM261003ABZP-REQ2@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - own vim engine decision.
    - `alfred/apps/tui/src/view/editor/vim.ts:15` - current engine supports only Normal and Insert.
  - **Research links:**
    - `RM261003ABZP-RF5` - kitty keyboard protocol and 50 ms Esc timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - `RM261003ABZP-RF6` - undo block equals one typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Example:** `ci(` inside `[text](url)` replaces the URL; `.` on the next link repeats it.

- **RM261003ABZP-REQ3@R2 — LazyVim-style navigation, commands, configuration, and state**
  - **Question:** How does the user find notes and trigger commands, and what persists?
  - **Requirement:** Commands are reachable through a leader key with which-key hints, a fuzzy picker family, and a command palette; every command has a name. Users override options and keymaps in a configuration file, a help view lists keys, and recent notes and jump history persist outside the workspace.
  - **Rationale:** LazyVim's discoverability (leader + which-key + pickers) is what makes a modal editor learnable.
  - **Acceptance criteria:**
    - `Space` is the default leader; pausing after it shows a which-key popup of next keys grouped by prefix.
    - Pickers: files (quick switcher), full-text search, headings in the current note, tags, backlinks, recent notes, commands. Each filters with fuzzy matching as the user types and previews the selection.
    - A side explorer toggles with `<leader>e`; an outline of headings toggles with `<leader>o`.
    - The command palette (`<leader>:` and `:`) runs any named command with completion.
    - Configuration lives at `$XDG_CONFIG_HOME/so/config.toml`; `~/.config/so/config.toml` is used when the variable is unset, empty, or relative. Invalid TOML or unknown keys show a clear error naming the file and line, and `so` falls back to defaults without crashing.
    - `?` or `:help` shows the active keymap, including user overrides.
    - Recent notes and jump history persist per workspace under `$XDG_STATE_HOME/so/` (default `~/.local/state/so/`); `so` writes no files into the workspace other than the user's notes.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2
  - **Predecessors:** RM261003ABZP-REQ3@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "neovim/lazyvim for markdown".
  - **Research links:**
    - `RM261003ABZP-RF15` - TOML via Bun, XDG relative-path rule, `$XDG_STATE_HOME`; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2; evaluated None (persistent state) → informed RM261003ABZP-REQ3@R2
  - **Example:** `Space f f`, type `pln`, Enter opens `projects/plan.md`.

- **RM261003ABZP-REQ4@R2 — Obsidian-compatible links, backlinks, tags, and rename**
  - **Question:** Which Obsidian linking features are required?
  - **Requirement:** The user writes, completes, follows, and inspects Obsidian links and tags; renaming a note updates every link to it. Files remain valid for Obsidian.
  - **Rationale:** Links are the core of an Obsidian-style knowledge base.
  - **Acceptance criteria:**
    - Recognized syntax: `[[note]]`, `[[note|alias]]`, `[[note#Heading]]`, chained `[[note#H1#H2]]`, `[[note#^block-id]]` (block ids of Latin letters, digits, and dashes), `![[embed]]`, Markdown links to `.md` files, `#tag` and nested `#tag/sub`, frontmatter `tags` and `aliases`.
    - Links resolve by a vault-root path (`[[folder/note]]`), by bare name, or by name with `.md`; Markdown-link destinations are URL-decoded. When a bare name matches several files, `so` picks deterministically: same folder as the source, then shortest path, then alphabetical; the rule is documented and tested. Aliases resolve.
    - `gd` or `Enter` on a link opens its target at the heading or block; `Ctrl-o`/`Ctrl-i` move back and forward through jump history.
    - Following an unresolved link offers to create the note.
    - Typing `[[` opens completion over note names, aliases, headings (after `#`), and block ids (after `#^`).
    - A backlinks panel lists linked and unlinked mentions with context lines; a tags picker lists tags with counts and opens matching notes.
    - Renaming or moving a note updates all links and embeds to it, including frontmatter links, preserves each link's format (wikilink or Markdown), alias, and heading or block subpath, writes new paths in the shortest unique form, and reports the count of changed files.
    - `.obsidian/` is never read or written.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R2
  - **Predecessors:** RM261003ABZP-REQ4@R1
  - **Evidence:**
    - `alfred/packages/view-model/src/markdown/obsidian-syntax.ts` - existing Obsidian syntax corpus.
  - **Research links:**
    - `RM261003ABZP-RF8` - shortest path is a generation format; duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2
  - **Example:** renaming `plan.md` to `roadmap.md` rewrites `[[plan|Plan]]` to `[[roadmap|Plan]]` in 12 files and reports "12 files updated".

- **RM261003ABZP-REQ5@R2 — Obsidian-style live preview**
  - **Question:** How is Markdown rendered while editing?
  - **Requirement:** By default, notes render in live preview: Markdown syntax is hidden and rendered except where the cursor or selection is. There, inline syntax is shown on the cursor line, and multi-line blocks (tables, callouts, fenced code, math blocks, frontmatter) show their full source while the cursor is inside them. Users toggle to source mode and to a read-only reading mode.
  - **Rationale:** Live preview is Obsidian's defining editing experience; `so` controls rendering because it owns the editor. Line and block reveal is a deliberate simplification of Obsidian's per-element reveal for a cell grid.
  - **Acceptance criteria:**
    - Rendered: headings, emphasis, strikethrough, highlights `==x==`, inline code, links (as link text), lists, task checkboxes (toggle with `Enter` or `<leader>x`), block quotes, callouts with type icon and fold, tables aligned to columns, fenced code with syntax highlighting, horizontal rules, footnotes, frontmatter as a properties block; `%%comments%%` are hidden.
    - The cursor line shows its raw inline syntax, and a multi-line block shows its full source while the cursor is inside it; moving away re-renders it.
    - Note embeds `![[note]]` and `![[note#Heading]]` render inline, collapsed beyond a configurable height.
    - Images render inline using the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel; otherwise they use Unicode-block rendering (including Terminal.app and tmux), or a text placeholder when graphics are disabled.
    - Math (`$…$`, `$$…$$`) and Mermaid blocks render as text approximations, with source shown while the cursor is inside.
    - `<leader>m` cycles live preview → source → reading.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R2
  - **Predecessors:** RM261003ABZP-REQ5@R1
  - **Evidence:**
    - `alfred/apps/tui/src/view/editor/reveal-units.ts`, `alfred/apps/tui/src/terminal/capabilities.ts:3-6` - existing reveal units and graphics tiers.
  - **Research links:**
    - `RM261003ABZP-RF4` - kitty and sixel cover all targets; Unicode blocks fallback; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - `RM261003ABZP-RF7` - per-element reveal in Obsidian, block reparse, comments; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Example:** `**bold**` shows as bold text; moving the cursor onto the line shows the asterisks; entering a table shows its pipes on every row.

- **RM261003ABZP-REQ6@R2 — Daily notes and templates**
  - **Question:** How are daily notes and templates created?
  - **Requirement:** One command opens today's daily note, creating it from a template when missing; users insert templates into any note; new notes can start from a template.
  - **Rationale:** Daily notes and templates are core Obsidian workflows the user selected for v1.
  - **Acceptance criteria:**
    - `<leader>nd` or `:Today` opens `<daily folder>/<formatted date>.md`, creating it from the daily template if missing; `:Yesterday`, `:Tomorrow`, and a date picker open adjacent days.
    - Daily folder, date format, and template path are configurable; defaults are `daily/`, `YYYY-MM-DD`, and `templates/daily.md`. A date format containing `/` creates subfolders (`YYYY/MM/YYYY-MM-DD` → `daily/2026/10/2026-10-03.md`).
    - `<leader>nt` picks a template from the templates folder (default `templates/`) and inserts it at the cursor.
    - Template variables `{{title}}`, `{{date}}` (default `YYYY-MM-DD`), `{{time}}` (default `HH:mm`), `{{date:FORMAT}}`, and `{{time:FORMAT}}` expand on insert. FORMAT supports the Moment.js tokens `YYYY YY M MM MMM MMMM D DD Do d ddd dddd H HH h hh m mm s ss A a` and `[literal]` escapes; unsupported tokens stay literal.
    - Creating a new note (`<leader>nn`) optionally starts from a chosen template.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R2
  - **Predecessors:** RM261003ABZP-REQ6@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "Daily notes and templates" in v1.
  - **Research links:**
    - `RM261003ABZP-RF10` - `{{time:FORMAT}}`, Moment.js tokens, subfolder formats; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Example:** on 2026-10-03, `:Today` creates `daily/2026-10-03.md` with the template's `# {{date:dddd, MMMM D}}` expanded to `# Saturday, October 3`.

- **RM261003ABZP-REQ7@R2 — Obsidian Bases table and Kanban views**
  - **Question:** What Bases support is required?
  - **Requirement:** Opening a `.base` file shows its views as a table or Kanban board over notes selected by its filters. Users sort, filter, and edit properties in place, and `![[file.base]]` embeds render in notes.
  - **Rationale:** The user selected Bases for v1; Alfred's engine already evaluates the Obsidian Bases format; Obsidian's board layout is Kanban.
  - **Acceptance criteria:**
    - `.base` YAML with `filters` (`and`/`or`/`not`), `formulas`, `properties`, `summaries`, and `views` is parsed and evaluated with Alfred's expression subset; unsupported syntax shows a diagnostic instead of failing. View types `table` and Kanban are rendered; other types (`cards`, `list`, `map`, plugin types) open as a table with a notice.
    - Table view: columns from view `order`, sort, grouping, keyboard cell navigation, and in-place editing of frontmatter properties that writes back to the note.
    - Kanban view: cards in columns by the view's single group-by property; moving a card between columns updates that property in the note; moving is disabled when grouping by a formula or file property; notes without the property appear in a `None` column.
    - Switching between a base's views and opening a row's note work from the keyboard.
    - `![[file.base]]` and `![[file.base#View]]` render the view inline in live preview.
    - Files edited through Bases stay valid for Obsidian; the Kanban `type` value is confirmed against a `.base` file saved by Obsidian 1.14 or later before release.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R2
  - **Predecessors:** RM261003ABZP-REQ7@R1
  - **Evidence:**
    - `alfred/packages/vault/src/domain/bases/parser.ts:19`, `alfred/packages/vault/src/domain/bases/evaluator.ts:164` - existing Bases parser and evaluator.
  - **Research links:**
    - `RM261003ABZP-RF9` - five official layouts; board is Kanban; move restrictions; type value undocumented; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
    - `RM261003ABZP-RF10` - Bases `date.format()` shares Moment.js tokens; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ7@R2 (shared formatter)
  - **Example:** a `tasks.base` Kanban grouped by `status`; moving a card from `todo` to `done` sets `status: done` in that note's frontmatter.

- **RM261003ABZP-REQ8@R2 — Read-only local browser preview**
  - **Question:** What does the web preview do?
  - **Requirement:** `:Preview` serves the current note as rendered HTML on `127.0.0.1` and opens the browser; the page follows note switches and edits live and is read-only.
  - **Rationale:** Browser rendering gives full-fidelity images, math, and diagrams without a web app.
  - **Acceptance criteria:**
    - `:Preview` starts a server explicitly bound to `127.0.0.1` on a free port (port 0), rejects requests whose `Host` header is not `127.0.0.1:<port>` or `localhost:<port>`, and opens the default browser; `:PreviewStop` stops it.
    - The page updates within 300 ms of an edit or note switch, keeping scroll position near the cursor's heading.
    - Rendering covers the same Obsidian syntax as live preview, with real images, KaTeX math, and Mermaid diagrams.
    - Wikilinks in the page navigate the preview to the linked note; the page has no editing controls.
    - Only files whose resolved real path lies inside the workspace, and outside hidden or excluded folders, are served; path traversal, including percent-encoded and symlinked escapes, returns 404.
  - **Dependencies:** RM261003ABZP-REQ4@R2, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ8@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - read-only preview with `Bun.serve`, no Next.js.
  - **Research links:**
    - `RM261003ABZP-RF7` - one parse feeds terminal and HTML; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
    - `RM261003ABZP-RF12` - explicit binding, Host check, realpath containment, SSE or WebSocket; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Example:** editing a heading in the terminal updates the open browser tab without a manual reload.

- **RM261003ABZP-REQ9@R2 — Fast and smooth performance targets**
  - **Question:** What does "fast and smooth" mean measurably?
  - **Requirement:** `so` meets the performance targets below on the reference machine (Apple M1 or newer, 8 GB RAM, macOS), measured in-process from input event to composed frame.
  - **Rationale:** The user requires fast and smooth UI/UX; targets make it testable; terminal-emulator display latency cannot be observed from inside `so`.
  - **Acceptance criteria:**
    - Keypress to composed frame (input event received → OpenTUI frame complete): p95 < 16 ms over 200 keystrokes while editing a 5,000-line fixture note in live preview.
    - Cold start to first interactive frame: < 200 ms for a 10,000-note folder (indexing continues in the background).
    - Opening a note: < 50 ms for a 5,000-line note.
    - Workspace index of 10,000 notes completes in < 3 s without blocking input.
    - Scrolling holds 60 frames per second without dropped input.
    - Benchmarks for these targets run in CI on a fixed runner type through the OpenTUI test renderer; the median of 5 runs fails the build when it exceeds 2× the target.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ9@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - user-approved proposal targets.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI to keep baselines stable; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF2` - in-process frame stats and test renderer; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF6` - line array sufficient at 5,000 lines; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF7` - block-level reparse; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Example:** holding `j` in a 5,000-line note scrolls without visible lag.

- **RM261003ABZP-REQ10@R2 — Fast development, CI, and release**
  - **Question:** What does fast development, CI, and CD mean measurably?
  - **Requirement:** A developer runs all checks locally in under 30 s; CI finishes in under 3 min per push; releases publish installable, checksummed binaries automatically.
  - **Rationale:** The user requires fast development and CI/CD.
  - **Acceptance criteria:**
    - `bun run check` runs Biome format and lint, TypeScript `tsc --noEmit`, dead-code detection, boundary checks, and unit tests in < 30 s on the reference machine; no check depends on the TypeScript compiler's JavaScript API.
    - CI on every push and pull request completes in < 3 min wall clock.
    - A release tag (created by release-please from Conventional Commits, or pushed manually as `v*`) cross-compiles macOS (arm64, x64) and Linux glibc (x64, arm64) binaries with `bun build --compile` after installing all OpenTUI native packages, publishes them with a SHA-256 checksum file to the GitHub Release, and a smoke test runs `so --version` on macOS and Linux runners.
    - `@opentui/core` is pinned to an exact version and upgraded deliberately.
    - No build step is needed to run from source (`bun run dev`).
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ10@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - local check < 30 s, CI < 3 min.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI exactly; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF2` - test renderer enables headless UI tests; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF3` - compile embeds the native library; cross-compile recipe; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF13` - TS 7 native tsc, no TS API dependency; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF14` - release-please; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - **Example:** merging the release-please PR tags `v0.2.0` and produces a release with four binaries and `SHA256SUMS`.

- **RM261003ABZP-REQ11@R2 — Maintainable, standards-based foundations**
  - **Question:** How are stability, simplicity, extensibility, and standards enforced?
  - **Requirement:** The codebase keeps a pure core separate from I/O and UI with tool-enforced boundaries, extends through registries rather than edits, follows named industry standards, and always leaves the terminal usable.
  - **Rationale:** The user requires stable, simple, maintainable, extensible designs that meet industry standards.
  - **Acceptance criteria:**
    - Layer boundaries fail CI when violated: core imports no I/O, UI, or runtime APIs, and only the UI layer imports `@opentui/*`.
    - New commands, keymaps, Markdown syntax extensions, and block renderers are added by registration without editing dispatch code.
    - Standards: CommonMark 0.31.2 + GFM, Obsidian Flavored Markdown, XDG Base Directory 0.8, `NO_COLOR` (a non-empty value disables colour unless config re-enables it), Conventional Commits 1.0.0, Semantic Versioning 2.0.0, strict TypeScript ESM.
    - The terminal is restored (alternate screen, cursor, mouse and keyboard modes) on every exit path, including crashes and `SIGTERM`.
    - Supported platforms are macOS and Linux. Terminals with the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel get full graphics; others, including Terminal.app and tmux sessions, get Unicode-block images. Terminals with the kitty keyboard protocol get unambiguous key input.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ11@R1
  - **Evidence:**
    - `alfred/apps/tui/src/terminal/shutdown.ts` - existing terminal-restore coordinator.
  - **Research links:**
    - `RM261003ABZP-RF1` - OpenTUI containment; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF4` - graphics support statement; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF5` - keyboard protocol support; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF6` - pure TS text model; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF13` - no TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF14` - Conventional Commits and SemVer automation; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF15` - exact XDG, NO_COLOR, CommonMark versions; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Example:** a contributor adds a `:Wordcount` command by registering it; no switch statement changes.

## Research Reconciliation

- **Status:** Complete

Dispositions per finding–evaluated-requirement relationship. All decisions were made by the agent under the user's delegation (see Approval).

| Finding | Evaluated requirement | Impact | Disposition | Resulting requirements |
|---|---|---|---|---|
| RM261003ABZP-RF1 — pin OpenTUI, contain to UI | RM261003ABZP-REQ9@R1 | Adds consideration | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF1 | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF1 | RM261003ABZP-REQ11@R1 | Supports | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF2 — in-process frame metrics | RM261003ABZP-REQ9@R1 | Supports | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF2 | RM261003ABZP-REQ10@R1 | Supports | Retained (no criterion change beyond REQ10@R2 revision) | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF3 — compile embeds native lib | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF3 | None — macOS signing | Adds consideration | Deferred | None — see "macOS signing and notarization" |
| RM261003ABZP-RF4 — kitty/sixel/blocks | RM261003ABZP-REQ5@R1 | Challenges | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF4 | RM261003ABZP-REQ11@R1 | Challenges | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF5 — Esc and kitty keyboard | RM261003ABZP-REQ2@R1 | Adds consideration | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF5 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF6 — line array, undo block | RM261003ABZP-REQ2@R1 | Supports | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF7 — parsers, block reparse, reveal | RM261003ABZP-REQ5@R1 | Adds consideration | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ8@R1 | Supports | Retained | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF8 — link resolution | RM261003ABZP-REQ4@R1 | Challenges | Revised | RM261003ABZP-REQ4@R2 |
| RM261003ABZP-RF9 — Bases layouts, Kanban | RM261003ABZP-REQ7@R1 | Challenges | Revised | RM261003ABZP-REQ7@R2 |
| RM261003ABZP-RF10 — template tokens | RM261003ABZP-REQ6@R1 | Challenges | Revised | RM261003ABZP-REQ6@R2 |
| RM261003ABZP-RF11 — atomic save, watching | RM261003ABZP-REQ1@R1 | Challenges | Revised | RM261003ABZP-REQ1@R2 |
| RM261003ABZP-RF12 — preview server safety | RM261003ABZP-REQ8@R1 | Challenges | Revised | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF13 — TS 7, no TS API | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF13 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF14 — release-please | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF14 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF15 — TOML, XDG, state | RM261003ABZP-REQ3@R1 | Supports | Revised | RM261003ABZP-REQ3@R2 |
| RM261003ABZP-RF15 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF15 | None — persistent state | Adds consideration | Added (folded into REQ3) | RM261003ABZP-REQ3@R2 |

- **Key decisions and rationale**
  - **Kanban (RF9):** target Obsidian's Kanban layout because the user selected a board and Kanban is Obsidian's official board. Stability guard: the `type` value must be confirmed against an Obsidian-saved file before release, and unknown layouts fall back to a table.
  - **State location (RF15):** persist under `$XDG_STATE_HOME/so/` so the notes folder stays clean (standard, simple).
  - **Signing (RF3):** defer; unsigned binaries with checksums keep CD fast and lean.
  - **Duplicate-name resolution (RF8):** a documented `so` rule replaces an untestable Obsidian-parity claim.
  - **iTerm2 protocol (RF4):** dropped; kitty graphics and sixel cover every target terminal with less code.

## Deferred Considerations

- **Vim macros, Visual block mode, and Ex ranges**
  - **Reason:** Outside the core set; adds engine scope without being needed for daily Markdown editing.
  - **Resolution trigger:** User demand after v1.
  - **Related references:** RM261003ABZP-REQ2@R2 - core vim command set

- **Plugin API**
  - **Reason:** No demonstrated need; registries cover internal extension.
  - **Resolution trigger:** A concrete third-party extension request.
  - **Related references:** RM261003ABZP-REQ11@R2 - registries

- **macOS signing and notarization**
  - **Reason:** Needs a paid Apple Developer identity, CI secrets, and notarization latency, contrary to lean and fast CD.
  - **Resolution trigger:** Distribution beyond the author.
  - **Related references:** `RM261003ABZP-RF3`; RM261003ABZP-REQ10@R2

- **Cards, List, and Map Bases layouts**
  - **Reason:** Low terminal value (image gallery, map) or not requested; they open as a table with a notice.
  - **Resolution trigger:** User request.
  - **Related references:** `RM261003ABZP-RF9`; RM261003ABZP-REQ7@R2

- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** Not requested for v1.
  - **Resolution trigger:** Explicit user request.
  - **Related references:** None

## Unresolved Items

None

## Approval

- **Approved baseline:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R2, RM261003ABZP-REQ4@R2, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ6@R2, RM261003ABZP-REQ7@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2, RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R2
- **Research dispositions:** Approved
- **Approval evidence:** User delegated all decisions on 2026-10-03: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … don't raise any question to me". The agent approved R1 and the R2 reconciliation under that delegation.
`````

- **RM261003ABZP-REQ4@R2 — Link an unlinked mention (system-impact assessment)**
  - Archived at: 2026-10-03T03:41:02Z
  - Change type: Revised
  - Reason: Step 10 system-impact assessment: RM261003ABZP-UDES6@R1 (accepted mockup RM261003ABZP-M4@R1, A:Extra keys `l`) converts an unlinked mention into a wikilink; no requirement named it.
  - Changes: REQ4 backlinks criterion adds "converting an unlinked mention into a wikilink in its source note"; dependants' pointers updated to REQ4@R3 (their revisions retained).
  - Requirement transitions:
    - RM261003ABZP-REQ4@R2 → RM261003ABZP-REQ4@R3 - revision change
  - Evidence: `rm261003abzp-ui-design.md` Required System Support (UDES6 gap); `ui-mockups/m4-links-files.html` backlinks states.
  - Research provenance:
    - None
  - Affected reconciliation: None
  - Approval evidence: User delegation of 2026-10-03; agent approved.
  - Downstream impact: `rm261003abzp-design.md` RM261003ABZP-DES7@R1 → RM261003ABZP-DES7@R2 and coverage pointers; UI context, UI requirements, UI design, and manifest pointers updated (non-semantic).

`````markdown
# RM261003ABZP: so v1 — Requirements

- **Status:** Approved
- **Outcome:** `so` is a fast, vim-modal terminal Markdown editor for a plain folder of notes, with Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, built as one lean Bun/TypeScript process with fast development and CI.
- **History:** `rm261003abzp-requirements-revisions.md`

Use `None` for empty sections and fields.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R1` - empty repository with `.s1mple/` guidance only; Alfred provides portable Markdown, Obsidian syntax, vim, terminal graphics, and Bases code.
- **User input:** Neovim/LazyVim for Markdown in Obsidian style; no AI, chat, LLM, vault, or Git; fast and smooth UI/UX; fast development, CI, and CD; stable, simple, maintainable, extensible design that meets industry standards; TypeScript, lean and simple; own vim engine; OpenTUI; read-only `Bun.serve` preview without Next.js; v1 scope Links core + Live preview + Daily notes/templates + Bases; few phases and delivery items; agent decides all choices.
- **Research:** `rm261003abzp-research.md`
- **Binding constraints:** `.s1mple/S1MPLE.md` Implementation "Keep it lean and simple"; TypeScript (`.s1mple/docs/project.md`); user exclusions (AI, chat, LLM, vault registry, Git, Next.js, web editing).

## Scope

- **In scope**
  - Opening a folder as the workspace and managing its Markdown files.
  - Vim-modal editing with a core vim command set.
  - LazyVim-style navigation: leader keys, which-key hints, fuzzy pickers, command palette, configuration, persisted recent notes and jump history.
  - Obsidian-compatible links, backlinks, tags, and link-safe rename.
  - Obsidian-style live preview, including inline images.
  - Daily notes and templates.
  - Obsidian Bases table and Kanban views.
  - Read-only local browser preview.
  - Performance targets, fast development and CI, release binaries, and enforced maintainability standards.

- **Out of scope**
  - AI, chat, and LLM features — user exclusion.
  - Vault registry and multi-vault management — user exclusion; the workspace is the opened folder.
  - Git integration and sync — user exclusion.
  - Next.js, a full web app, and web editing — user decision; the preview is read-only.
  - Reading or writing Obsidian's `.obsidian/` settings — keeps `so` independent of Obsidian's internal config formats (agent decision under delegated authority).
  - Plugin API, graph view, Canvas, mobile, Windows, and macOS signing — see Deferred Considerations.

- **Minimum valuable release**
  - Open a folder, browse and manage notes, edit them with vim keys and autosave, jump between notes through wikilinks and the quick switcher.

## Current Requirements

| Reference | Requirement | Dependencies |
|---|---|---|
| RM261003ABZP-REQ1@R2 | Folder workspace and safe file management | None |
| RM261003ABZP-REQ2@R2 | Vim-modal editing with a core command set | RM261003ABZP-REQ1@R2 |
| RM261003ABZP-REQ3@R3 | LazyVim-style navigation, commands, configuration, and state | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2 |
| RM261003ABZP-REQ4@R2 | Obsidian-compatible links, backlinks, tags, and rename | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3 |
| RM261003ABZP-REQ5@R2 | Obsidian-style live preview | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R2 |
| RM261003ABZP-REQ6@R2 | Daily notes and templates | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3 |
| RM261003ABZP-REQ7@R2 | Obsidian Bases table and Kanban views | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3 |
| RM261003ABZP-REQ8@R2 | Read-only local browser preview | RM261003ABZP-REQ4@R2, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ9@R2 | Fast and smooth performance targets | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ10@R2 | Fast development, CI, and release | None |
| RM261003ABZP-REQ11@R2 | Maintainable, standards-based foundations | None |

## Requirement Details

- **RM261003ABZP-REQ1@R2 — Folder workspace and safe file management**
  - **Question:** What does `so` open, and how are notes kept safe?
  - **Requirement:** A user runs `so [path]`; a folder path (default: current directory) becomes the workspace, and a file path opens that file with its parent folder as the workspace. The user browses the folder tree and creates, renames, moves, and deletes notes and folders. Edits autosave and can also be saved with `:w`; saves never corrupt or silently overwrite files.
  - **Rationale:** "No vault" means the folder is the workspace, like `nvim .`; data safety is the first duty of an editor.
  - **Acceptance criteria:**
    - `so ~/notes` shows the folder tree; `so ~/notes/a.md` opens `a.md` with `~/notes` as the workspace; a missing path exits non-zero with a message.
    - Create, rename, move, and delete work for notes and folders from the explorer. On Linux, delete moves the item to the freedesktop home trash (`$XDG_DATA_HOME/Trash`); on macOS, it moves the item to the user's Trash when the system allows it; otherwise deletion requires a typed confirmation.
    - Autosave writes about 1 s after typing stops, on leaving Insert mode, on switching notes, and on exit; `:w` saves immediately.
    - Saves write a temporary file in the same directory, fsync it, preserve the original file's permission bits, then rename it over the target, resolving symlinks to their target first. A crash at any point leaves the complete old or the complete new file.
    - External changes are detected by watching directories, not file inodes, and events caused by `so`'s own saves are ignored. When an open, unmodified buffer changes on disk, it reloads and the reload can be undone. When the buffer also has unsaved edits, a conflict prompt offers keep mine, take disk, or view diff, and nothing is overwritten silently.
    - Hidden folders (`.git`, `.obsidian`, `node_modules`) and files matched by `.gitignore` are excluded from the tree and index.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ1@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "no vault"; folder opened as the workspace.
    - `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - existing autosave queue to port.
  - **Research links:**
    - `RM261003ABZP-RF11` - temp + fsync + rename in the same directory, directory watching, undoable reload, freedesktop trash; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2
  - **Example:** `so ~/notes/projects/plan.md` opens `plan.md`; the explorer shows `~/notes`; typing then pausing saves the note without `:w`.

- **RM261003ABZP-REQ2@R2 — Vim-modal editing with a core command set**
  - **Question:** How much of vim must the editor support?
  - **Requirement:** The editor provides Normal, Insert, Visual (characterwise and linewise), and Command-line modes with the core vim command set, window splits, and multiple open buffers.
  - **Rationale:** "Neovim for Markdown" requires real modal editing; the core set covers daily editing without the cost of full vim parity.
  - **Acceptance criteria:**
    - Motions: `h j k l w b e W B E 0 ^ $ gg G f F t T ; , % { } H M L`, `Ctrl-d Ctrl-u`, counts on all motions.
    - Operators `d c y > <` with motions and text objects `iw aw iW aW i" a" i' a' i( a( i[ a[ i{ a{ ip ap`; `dd cc yy`, `x X p P J r ~ o O A I`.
    - Registers: unnamed, `"0`–`"9`, named `"a`–`"z`, and `"+` for the system clipboard.
    - Undo and redo (`u`, `Ctrl-r`) per vim undo block: one Normal-mode command, or one Insert-mode session from entry to `Esc`, is one undo step. `.` repeats the last change.
    - `Esc` switches to Normal mode immediately on terminals with the kitty keyboard protocol; on other terminals it does so after a configurable escape timeout (default 50 ms).
    - Search `/ ? n N * #` with match highlighting; `:s/pat/rep/[g]` on the current line and `:%s` on the whole buffer.
    - Ex commands `:w :q :wq :q! :e <path> :sp :vs :bn :bp :bd`; window navigation `Ctrl-w h/j/k/l`.
    - Mode is shown in the status line; the cursor changes shape between Normal and Insert where the terminal supports it.
  - **Dependencies:** RM261003ABZP-REQ1@R2 - Folder workspace and safe file management
  - **Predecessors:** RM261003ABZP-REQ2@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - own vim engine decision.
    - `alfred/apps/tui/src/view/editor/vim.ts:15` - current engine supports only Normal and Insert.
  - **Research links:**
    - `RM261003ABZP-RF5` - kitty keyboard protocol and 50 ms Esc timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - `RM261003ABZP-RF6` - undo block equals one typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Example:** `ci(` inside `[text](url)` replaces the URL; `.` on the next link repeats it.

- **RM261003ABZP-REQ3@R3 — LazyVim-style navigation, commands, configuration, and state**
  - **Question:** How does the user find notes and trigger commands, and what persists?
  - **Requirement:** Commands are reachable through a leader key with which-key hints, a fuzzy picker family, and a command palette; every command has a name. Users override options and keymaps in a configuration file, a help view lists keys, and recent notes and jump history persist outside the workspace.
  - **Rationale:** LazyVim's discoverability (leader + which-key + pickers) is what makes a modal editor learnable.
  - **Acceptance criteria:**
    - `Space` is the default leader; pausing after it shows a which-key popup of next keys grouped by prefix.
    - Pickers: files (quick switcher), full-text search, headings in the current note, tags, backlinks, recent notes, commands. Each filters with fuzzy matching as the user types and previews the selection.
    - A side explorer toggles with `<leader>e`; an outline of headings toggles with `<leader>o`.
    - The command palette (`<leader>:` and `:`) runs any named command with completion.
    - Configuration lives at `$XDG_CONFIG_HOME/so/config.toml`; `~/.config/so/config.toml` is used when the variable is unset, empty, or relative. Invalid TOML or unknown keys show a clear error naming the file and line, and `so` falls back to defaults without crashing.
    - `<leader>?` or `:help` shows the active keymap, including user overrides; `?` remains vim backward search.
    - Recent notes and jump history persist per workspace under `$XDG_STATE_HOME/so/` (default `~/.local/state/so/`); `so` writes no files into the workspace other than the user's notes.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2
  - **Predecessors:** RM261003ABZP-REQ3@R1, RM261003ABZP-REQ3@R2
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "neovim/lazyvim for markdown".
  - **Research links:**
    - `RM261003ABZP-RF15` - TOML via Bun, XDG relative-path rule, `$XDG_STATE_HOME`; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (carried into R3 unchanged); evaluated None (persistent state) → informed RM261003ABZP-REQ3@R2
  - **Example:** `Space f f`, type `pln`, Enter opens `projects/plan.md`.

- **RM261003ABZP-REQ4@R2 — Obsidian-compatible links, backlinks, tags, and rename**
  - **Question:** Which Obsidian linking features are required?
  - **Requirement:** The user writes, completes, follows, and inspects Obsidian links and tags; renaming a note updates every link to it. Files remain valid for Obsidian.
  - **Rationale:** Links are the core of an Obsidian-style knowledge base.
  - **Acceptance criteria:**
    - Recognized syntax: `[[note]]`, `[[note|alias]]`, `[[note#Heading]]`, chained `[[note#H1#H2]]`, `[[note#^block-id]]` (block ids of Latin letters, digits, and dashes), `![[embed]]`, Markdown links to `.md` files, `#tag` and nested `#tag/sub`, frontmatter `tags` and `aliases`.
    - Links resolve by a vault-root path (`[[folder/note]]`), by bare name, or by name with `.md`; Markdown-link destinations are URL-decoded. When a bare name matches several files, `so` picks deterministically: same folder as the source, then shortest path, then alphabetical; the rule is documented and tested. Aliases resolve.
    - `gd` or `Enter` on a link opens its target at the heading or block; `Ctrl-o`/`Ctrl-i` move back and forward through jump history.
    - Following an unresolved link offers to create the note.
    - Typing `[[` opens completion over note names, aliases, headings (after `#`), and block ids (after `#^`).
    - A backlinks panel lists linked and unlinked mentions with context lines; a tags picker lists tags with counts and opens matching notes.
    - Renaming or moving a note updates all links and embeds to it, including frontmatter links, preserves each link's format (wikilink or Markdown), alias, and heading or block subpath, writes new paths in the shortest unique form, and reports the count of changed files.
    - `.obsidian/` is never read or written.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3
  - **Predecessors:** RM261003ABZP-REQ4@R1
  - **Evidence:**
    - `alfred/packages/view-model/src/markdown/obsidian-syntax.ts` - existing Obsidian syntax corpus.
  - **Research links:**
    - `RM261003ABZP-RF8` - shortest path is a generation format; duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2
  - **Example:** renaming `plan.md` to `roadmap.md` rewrites `[[plan|Plan]]` to `[[roadmap|Plan]]` in 12 files and reports "12 files updated".

- **RM261003ABZP-REQ5@R2 — Obsidian-style live preview**
  - **Question:** How is Markdown rendered while editing?
  - **Requirement:** By default, notes render in live preview: Markdown syntax is hidden and rendered except where the cursor or selection is. There, inline syntax is shown on the cursor line, and multi-line blocks (tables, callouts, fenced code, math blocks, frontmatter) show their full source while the cursor is inside them. Users toggle to source mode and to a read-only reading mode.
  - **Rationale:** Live preview is Obsidian's defining editing experience; `so` controls rendering because it owns the editor. Line and block reveal is a deliberate simplification of Obsidian's per-element reveal for a cell grid.
  - **Acceptance criteria:**
    - Rendered: headings, emphasis, strikethrough, highlights `==x==`, inline code, links (as link text), lists, task checkboxes (toggle with `Enter` or `<leader>x`), block quotes, callouts with type icon and fold, tables aligned to columns, fenced code with syntax highlighting, horizontal rules, footnotes, frontmatter as a properties block; `%%comments%%` are hidden.
    - The cursor line shows its raw inline syntax, and a multi-line block shows its full source while the cursor is inside it; moving away re-renders it.
    - Note embeds `![[note]]` and `![[note#Heading]]` render inline, collapsed beyond a configurable height.
    - Images render inline using the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel; otherwise they use Unicode-block rendering (including Terminal.app and tmux), or a text placeholder when graphics are disabled.
    - Math (`$…$`, `$$…$$`) and Mermaid blocks render as text approximations, with source shown while the cursor is inside.
    - `<leader>m` cycles live preview → source → reading.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R2
  - **Predecessors:** RM261003ABZP-REQ5@R1
  - **Evidence:**
    - `alfred/apps/tui/src/view/editor/reveal-units.ts`, `alfred/apps/tui/src/terminal/capabilities.ts:3-6` - existing reveal units and graphics tiers.
  - **Research links:**
    - `RM261003ABZP-RF4` - kitty and sixel cover all targets; Unicode blocks fallback; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - `RM261003ABZP-RF7` - per-element reveal in Obsidian, block reparse, comments; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Example:** `**bold**` shows as bold text; moving the cursor onto the line shows the asterisks; entering a table shows its pipes on every row.

- **RM261003ABZP-REQ6@R2 — Daily notes and templates**
  - **Question:** How are daily notes and templates created?
  - **Requirement:** One command opens today's daily note, creating it from a template when missing; users insert templates into any note; new notes can start from a template.
  - **Rationale:** Daily notes and templates are core Obsidian workflows the user selected for v1.
  - **Acceptance criteria:**
    - `<leader>nd` or `:Today` opens `<daily folder>/<formatted date>.md`, creating it from the daily template if missing; `:Yesterday`, `:Tomorrow`, and a date picker open adjacent days.
    - Daily folder, date format, and template path are configurable; defaults are `daily/`, `YYYY-MM-DD`, and `templates/daily.md`. A date format containing `/` creates subfolders (`YYYY/MM/YYYY-MM-DD` → `daily/2026/10/2026-10-03.md`).
    - `<leader>nt` picks a template from the templates folder (default `templates/`) and inserts it at the cursor.
    - Template variables `{{title}}`, `{{date}}` (default `YYYY-MM-DD`), `{{time}}` (default `HH:mm`), `{{date:FORMAT}}`, and `{{time:FORMAT}}` expand on insert. FORMAT supports the Moment.js tokens `YYYY YY M MM MMM MMMM D DD Do d ddd dddd H HH h hh m mm s ss A a` and `[literal]` escapes; unsupported tokens stay literal.
    - Creating a new note (`<leader>nn`) optionally starts from a chosen template.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3
  - **Predecessors:** RM261003ABZP-REQ6@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "Daily notes and templates" in v1.
  - **Research links:**
    - `RM261003ABZP-RF10` - `{{time:FORMAT}}`, Moment.js tokens, subfolder formats; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Example:** on 2026-10-03, `:Today` creates `daily/2026-10-03.md` with the template's `# {{date:dddd, MMMM D}}` expanded to `# Saturday, October 3`.

- **RM261003ABZP-REQ7@R2 — Obsidian Bases table and Kanban views**
  - **Question:** What Bases support is required?
  - **Requirement:** Opening a `.base` file shows its views as a table or Kanban board over notes selected by its filters. Users sort, filter, and edit properties in place, and `![[file.base]]` embeds render in notes.
  - **Rationale:** The user selected Bases for v1; Alfred's engine already evaluates the Obsidian Bases format; Obsidian's board layout is Kanban.
  - **Acceptance criteria:**
    - `.base` YAML with `filters` (`and`/`or`/`not`), `formulas`, `properties`, `summaries`, and `views` is parsed and evaluated with Alfred's expression subset; unsupported syntax shows a diagnostic instead of failing. View types `table` and Kanban are rendered; other types (`cards`, `list`, `map`, plugin types) open as a table with a notice.
    - Table view: columns from view `order`, sort, grouping, keyboard cell navigation, and in-place editing of frontmatter properties that writes back to the note.
    - Kanban view: cards in columns by the view's single group-by property; moving a card between columns updates that property in the note; moving is disabled when grouping by a formula or file property; notes without the property appear in a `None` column.
    - Switching between a base's views and opening a row's note work from the keyboard.
    - `![[file.base]]` and `![[file.base#View]]` render the view inline in live preview.
    - Files edited through Bases stay valid for Obsidian; the Kanban `type` value is confirmed against a `.base` file saved by Obsidian 1.14 or later before release.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3
  - **Predecessors:** RM261003ABZP-REQ7@R1
  - **Evidence:**
    - `alfred/packages/vault/src/domain/bases/parser.ts:19`, `alfred/packages/vault/src/domain/bases/evaluator.ts:164` - existing Bases parser and evaluator.
  - **Research links:**
    - `RM261003ABZP-RF9` - five official layouts; board is Kanban; move restrictions; type value undocumented; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
    - `RM261003ABZP-RF10` - Bases `date.format()` shares Moment.js tokens; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ7@R2 (shared formatter)
  - **Example:** a `tasks.base` Kanban grouped by `status`; moving a card from `todo` to `done` sets `status: done` in that note's frontmatter.

- **RM261003ABZP-REQ8@R2 — Read-only local browser preview**
  - **Question:** What does the web preview do?
  - **Requirement:** `:Preview` serves the current note as rendered HTML on `127.0.0.1` and opens the browser; the page follows note switches and edits live and is read-only.
  - **Rationale:** Browser rendering gives full-fidelity images, math, and diagrams without a web app.
  - **Acceptance criteria:**
    - `:Preview` starts a server explicitly bound to `127.0.0.1` on a free port (port 0), rejects requests whose `Host` header is not `127.0.0.1:<port>` or `localhost:<port>`, and opens the default browser; `:PreviewStop` stops it.
    - The page updates within 300 ms of an edit or note switch, keeping scroll position near the cursor's heading.
    - Rendering covers the same Obsidian syntax as live preview, with real images, KaTeX math, and Mermaid diagrams.
    - Wikilinks in the page navigate the preview to the linked note; the page has no editing controls.
    - Only files whose resolved real path lies inside the workspace, and outside hidden or excluded folders, are served; path traversal, including percent-encoded and symlinked escapes, returns 404.
  - **Dependencies:** RM261003ABZP-REQ4@R2, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ8@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - read-only preview with `Bun.serve`, no Next.js.
  - **Research links:**
    - `RM261003ABZP-RF7` - one parse feeds terminal and HTML; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
    - `RM261003ABZP-RF12` - explicit binding, Host check, realpath containment, SSE or WebSocket; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Example:** editing a heading in the terminal updates the open browser tab without a manual reload.

- **RM261003ABZP-REQ9@R2 — Fast and smooth performance targets**
  - **Question:** What does "fast and smooth" mean measurably?
  - **Requirement:** `so` meets the performance targets below on the reference machine (Apple M1 or newer, 8 GB RAM, macOS), measured in-process from input event to composed frame.
  - **Rationale:** The user requires fast and smooth UI/UX; targets make it testable; terminal-emulator display latency cannot be observed from inside `so`.
  - **Acceptance criteria:**
    - Keypress to composed frame (input event received → OpenTUI frame complete): p95 < 16 ms over 200 keystrokes while editing a 5,000-line fixture note in live preview.
    - Cold start to first interactive frame: < 200 ms for a 10,000-note folder (indexing continues in the background).
    - Opening a note: < 50 ms for a 5,000-line note.
    - Workspace index of 10,000 notes completes in < 3 s without blocking input.
    - Scrolling holds 60 frames per second without dropped input.
    - Benchmarks for these targets run in CI on a fixed runner type through the OpenTUI test renderer; the median of 5 runs fails the build when it exceeds 2× the target.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ9@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - user-approved proposal targets.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI to keep baselines stable; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF2` - in-process frame stats and test renderer; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF6` - line array sufficient at 5,000 lines; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF7` - block-level reparse; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Example:** holding `j` in a 5,000-line note scrolls without visible lag.

- **RM261003ABZP-REQ10@R2 — Fast development, CI, and release**
  - **Question:** What does fast development, CI, and CD mean measurably?
  - **Requirement:** A developer runs all checks locally in under 30 s; CI finishes in under 3 min per push; releases publish installable, checksummed binaries automatically.
  - **Rationale:** The user requires fast development and CI/CD.
  - **Acceptance criteria:**
    - `bun run check` runs Biome format and lint, TypeScript `tsc --noEmit`, dead-code detection, boundary checks, and unit tests in < 30 s on the reference machine; no check depends on the TypeScript compiler's JavaScript API.
    - CI on every push and pull request completes in < 3 min wall clock.
    - A release tag (created by release-please from Conventional Commits, or pushed manually as `v*`) cross-compiles macOS (arm64, x64) and Linux glibc (x64, arm64) binaries with `bun build --compile` after installing all OpenTUI native packages, publishes them with a SHA-256 checksum file to the GitHub Release, and a smoke test runs `so --version` on macOS and Linux runners.
    - `@opentui/core` is pinned to an exact version and upgraded deliberately.
    - No build step is needed to run from source (`bun run dev`).
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ10@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - local check < 30 s, CI < 3 min.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI exactly; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF2` - test renderer enables headless UI tests; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF3` - compile embeds the native library; cross-compile recipe; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF13` - TS 7 native tsc, no TS API dependency; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF14` - release-please; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - **Example:** merging the release-please PR tags `v0.2.0` and produces a release with four binaries and `SHA256SUMS`.

- **RM261003ABZP-REQ11@R2 — Maintainable, standards-based foundations**
  - **Question:** How are stability, simplicity, extensibility, and standards enforced?
  - **Requirement:** The codebase keeps a pure core separate from I/O and UI with tool-enforced boundaries, extends through registries rather than edits, follows named industry standards, and always leaves the terminal usable.
  - **Rationale:** The user requires stable, simple, maintainable, extensible designs that meet industry standards.
  - **Acceptance criteria:**
    - Layer boundaries fail CI when violated: core imports no I/O, UI, or runtime APIs, and only the UI layer imports `@opentui/*`.
    - New commands, keymaps, Markdown syntax extensions, and block renderers are added by registration without editing dispatch code.
    - Standards: CommonMark 0.31.2 + GFM, Obsidian Flavored Markdown, XDG Base Directory 0.8, `NO_COLOR` (a non-empty value disables colour unless config re-enables it), Conventional Commits 1.0.0, Semantic Versioning 2.0.0, strict TypeScript ESM.
    - The terminal is restored (alternate screen, cursor, mouse and keyboard modes) on every exit path, including crashes and `SIGTERM`.
    - Supported platforms are macOS and Linux. Terminals with the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel get full graphics; others, including Terminal.app and tmux sessions, get Unicode-block images. Terminals with the kitty keyboard protocol get unambiguous key input.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ11@R1
  - **Evidence:**
    - `alfred/apps/tui/src/terminal/shutdown.ts` - existing terminal-restore coordinator.
  - **Research links:**
    - `RM261003ABZP-RF1` - OpenTUI containment; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF4` - graphics support statement; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF5` - keyboard protocol support; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF6` - pure TS text model; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF13` - no TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF14` - Conventional Commits and SemVer automation; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF15` - exact XDG, NO_COLOR, CommonMark versions; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Example:** a contributor adds a `:Wordcount` command by registering it; no switch statement changes.

## Research Reconciliation

- **Status:** Complete

Dispositions per finding–evaluated-requirement relationship. All decisions were made by the agent under the user's delegation (see Approval).

| Finding | Evaluated requirement | Impact | Disposition | Resulting requirements |
|---|---|---|---|---|
| RM261003ABZP-RF1 — pin OpenTUI, contain to UI | RM261003ABZP-REQ9@R1 | Adds consideration | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF1 | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF1 | RM261003ABZP-REQ11@R1 | Supports | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF2 — in-process frame metrics | RM261003ABZP-REQ9@R1 | Supports | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF2 | RM261003ABZP-REQ10@R1 | Supports | Retained (no criterion change beyond REQ10@R2 revision) | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF3 — compile embeds native lib | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF3 | None — macOS signing | Adds consideration | Deferred | None — see "macOS signing and notarization" |
| RM261003ABZP-RF4 — kitty/sixel/blocks | RM261003ABZP-REQ5@R1 | Challenges | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF4 | RM261003ABZP-REQ11@R1 | Challenges | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF5 — Esc and kitty keyboard | RM261003ABZP-REQ2@R1 | Adds consideration | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF5 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF6 — line array, undo block | RM261003ABZP-REQ2@R1 | Supports | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF7 — parsers, block reparse, reveal | RM261003ABZP-REQ5@R1 | Adds consideration | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ8@R1 | Supports | Retained | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF8 — link resolution | RM261003ABZP-REQ4@R1 | Challenges | Revised | RM261003ABZP-REQ4@R2 |
| RM261003ABZP-RF9 — Bases layouts, Kanban | RM261003ABZP-REQ7@R1 | Challenges | Revised | RM261003ABZP-REQ7@R2 |
| RM261003ABZP-RF10 — template tokens | RM261003ABZP-REQ6@R1 | Challenges | Revised | RM261003ABZP-REQ6@R2 |
| RM261003ABZP-RF11 — atomic save, watching | RM261003ABZP-REQ1@R1 | Challenges | Revised | RM261003ABZP-REQ1@R2 |
| RM261003ABZP-RF12 — preview server safety | RM261003ABZP-REQ8@R1 | Challenges | Revised | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF13 — TS 7, no TS API | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF13 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF14 — release-please | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF14 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF15 — TOML, XDG, state | RM261003ABZP-REQ3@R1 | Supports | Revised | RM261003ABZP-REQ3@R2 (current: RM261003ABZP-REQ3@R3) |
| RM261003ABZP-RF15 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF15 | None — persistent state | Adds consideration | Added (folded into REQ3) | RM261003ABZP-REQ3@R2 (current: RM261003ABZP-REQ3@R3) |

- **Key decisions and rationale**
  - **Kanban (RF9):** target Obsidian's Kanban layout because the user selected a board and Kanban is Obsidian's official board. Stability guard: the `type` value must be confirmed against an Obsidian-saved file before release, and unknown layouts fall back to a table.
  - **State location (RF15):** persist under `$XDG_STATE_HOME/so/` so the notes folder stays clean (standard, simple).
  - **Signing (RF3):** defer; unsigned binaries with checksums keep CD fast and lean.
  - **Duplicate-name resolution (RF8):** a documented `so` rule replaces an untestable Obsidian-parity claim.
  - **iTerm2 protocol (RF4):** dropped; kitty graphics and sixel cover every target terminal with less code.

## Deferred Considerations

- **Vim macros, Visual block mode, and Ex ranges**
  - **Reason:** Outside the core set; adds engine scope without being needed for daily Markdown editing.
  - **Resolution trigger:** User demand after v1.
  - **Related references:** RM261003ABZP-REQ2@R2 - core vim command set

- **Plugin API**
  - **Reason:** No demonstrated need; registries cover internal extension.
  - **Resolution trigger:** A concrete third-party extension request.
  - **Related references:** RM261003ABZP-REQ11@R2 - registries

- **macOS signing and notarization**
  - **Reason:** Needs a paid Apple Developer identity, CI secrets, and notarization latency, contrary to lean and fast CD.
  - **Resolution trigger:** Distribution beyond the author.
  - **Related references:** `RM261003ABZP-RF3`; RM261003ABZP-REQ10@R2

- **Cards, List, and Map Bases layouts**
  - **Reason:** Low terminal value (image gallery, map) or not requested; they open as a table with a notice.
  - **Resolution trigger:** User request.
  - **Related references:** `RM261003ABZP-RF9`; RM261003ABZP-REQ7@R2

- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** Not requested for v1.
  - **Resolution trigger:** Explicit user request.
  - **Related references:** None

## Unresolved Items

None

## Approval

- **Approved baseline:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ4@R2, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ6@R2, RM261003ABZP-REQ7@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2, RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R2
- **Research dispositions:** Approved
- **Approval evidence:** User delegated all decisions on 2026-10-03: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … don't raise any question to me". The agent approved R1, the R2 reconciliation, and the REQ3@R3 help-key revision under that delegation.
`````

- **RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ11@R2 — Markdown-first, language-neutral editor core**
  - Archived at: 2026-10-03T04:08:12Z
  - Change type: Revised
  - Reason: Scope change on 2026-10-03 (`rm261003abzp-roadmap-context.md@R2` User Input): `so` must be able to grow into a code editor and a notebook editor later, so the v1 editor core must not be Markdown-specific and the seam must be proven by a second file type.
  - Changes: Outcome and Scope now describe a Markdown-first editor on a language-neutral core. REQ1 opens any UTF-8 text file (source view, highlighting), refuses binary and oversized files, and preserves a UTF-8 BOM. REQ3 lists all workspace files in the file picker, extends full-text search to text files, and scopes keymaps and commands by file type. REQ11 adds the kernel boundary and registration of file types, highlighters, decoration providers, and editor kinds. Two deferrals added: code intelligence; notebooks. Research reconciliation rows gain `current:` pointers.
  - Requirement transitions:
    - RM261003ABZP-REQ1@R2 → RM261003ABZP-REQ1@R3 - revision change (any text file, binary/size guard, BOM)
    - RM261003ABZP-REQ3@R3 → RM261003ABZP-REQ3@R4 - revision change (file-type-scoped keymaps and commands; all-file picker; text-file search)
    - RM261003ABZP-REQ11@R2 → RM261003ABZP-REQ11@R3 - revision change (language-neutral kernel boundary; file-type registration)
  - Evidence: `rm261003abzp-roadmap-context.md@R2` User Input - scope change and the "Apply all six" decision.
  - Research provenance:
    - None - no new research; the revisions keep every existing finding's criteria (RF11 atomic save in REQ1, RF15 XDG config in REQ3, RF1/RF4/RF5/RF6/RF13/RF14/RF15 in REQ11).
  - Affected reconciliation: Rows whose resulting requirement was RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R2 (current R3), or RM261003ABZP-REQ11@R2 now also name the current R3/R4 revision; dispositions unchanged.
  - Approval evidence: User selected "Apply all six (Recommended)" in `AskUserQuestion` on 2026-10-03, after the chat proposal listing all six changes and the non-goals. The user then delegated every remaining sub-decision on 2026-10-03 ("you self-drive everything. Everything is good now, don't need to stop"), covering the 16 MiB limit, binary check, BOM preservation, all-file picker and text-file search, `[filetypes.<id>.keys.<mode>]` config, no statusline file-type segment, S12/V18, the TypeScript benchmark, and the lowlight look-back.
  - Downstream impact: `rm261003abzp-design.md` (DES1, DES5, DES7, DES9, DES10, DES12 revised; DES17 added); `rm261003abzp-ui-requirements.md` and `rm261003abzp-ui-design.md` (non-Markdown file states); `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, `rm261003abzp-roadmap-index.md` (input baseline and DI revisions). No Work or PR exists yet.

``````markdown
# RM261003ABZP: so v1 — Requirements

- **Status:** Approved
- **Outcome:** `so` is a fast, vim-modal terminal Markdown editor for a plain folder of notes, with Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, built as one lean Bun/TypeScript process with fast development and CI.
- **History:** `rm261003abzp-requirements-revisions.md`

Use `None` for empty sections and fields.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R1` - empty repository with `.s1mple/` guidance only; Alfred provides portable Markdown, Obsidian syntax, vim, terminal graphics, and Bases code.
- **User input:** Neovim/LazyVim for Markdown in Obsidian style; no AI, chat, LLM, vault, or Git; fast and smooth UI/UX; fast development, CI, and CD; stable, simple, maintainable, extensible design that meets industry standards; TypeScript, lean and simple; own vim engine; OpenTUI; read-only `Bun.serve` preview without Next.js; v1 scope Links core + Live preview + Daily notes/templates + Bases; few phases and delivery items; agent decides all choices.
- **Research:** `rm261003abzp-research.md`
- **Binding constraints:** `.s1mple/S1MPLE.md` Implementation "Keep it lean and simple"; TypeScript (`.s1mple/docs/project.md`); user exclusions (AI, chat, LLM, vault registry, Git, Next.js, web editing).

## Scope

- **In scope**
  - Opening a folder as the workspace and managing its Markdown files.
  - Vim-modal editing with a core vim command set.
  - LazyVim-style navigation: leader keys, which-key hints, fuzzy pickers, command palette, configuration, persisted recent notes and jump history.
  - Obsidian-compatible links, backlinks, tags, and link-safe rename.
  - Obsidian-style live preview, including inline images.
  - Daily notes and templates.
  - Obsidian Bases table and Kanban views.
  - Read-only local browser preview.
  - Performance targets, fast development and CI, release binaries, and enforced maintainability standards.

- **Out of scope**
  - AI, chat, and LLM features — user exclusion.
  - Vault registry and multi-vault management — user exclusion; the workspace is the opened folder.
  - Git integration and sync — user exclusion.
  - Next.js, a full web app, and web editing — user decision; the preview is read-only.
  - Reading or writing Obsidian's `.obsidian/` settings — keeps `so` independent of Obsidian's internal config formats (agent decision under delegated authority).
  - Plugin API, graph view, Canvas, mobile, Windows, and macOS signing — see Deferred Considerations.

- **Minimum valuable release**
  - Open a folder, browse and manage notes, edit them with vim keys and autosave, jump between notes through wikilinks and the quick switcher.

## Current Requirements

| Reference | Requirement | Dependencies |
|---|---|---|
| RM261003ABZP-REQ1@R2 | Folder workspace and safe file management | None |
| RM261003ABZP-REQ2@R2 | Vim-modal editing with a core command set | RM261003ABZP-REQ1@R2 |
| RM261003ABZP-REQ3@R3 | LazyVim-style navigation, commands, configuration, and state | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2 |
| RM261003ABZP-REQ4@R3 | Obsidian-compatible links, backlinks, tags, and rename | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3 |
| RM261003ABZP-REQ5@R2 | Obsidian-style live preview | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R3 |
| RM261003ABZP-REQ6@R2 | Daily notes and templates | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3 |
| RM261003ABZP-REQ7@R2 | Obsidian Bases table and Kanban views | RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3 |
| RM261003ABZP-REQ8@R2 | Read-only local browser preview | RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ9@R2 | Fast and smooth performance targets | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ10@R2 | Fast development, CI, and release | None |
| RM261003ABZP-REQ11@R2 | Maintainable, standards-based foundations | None |

## Requirement Details

- **RM261003ABZP-REQ1@R2 — Folder workspace and safe file management**
  - **Question:** What does `so` open, and how are notes kept safe?
  - **Requirement:** A user runs `so [path]`; a folder path (default: current directory) becomes the workspace, and a file path opens that file with its parent folder as the workspace. The user browses the folder tree and creates, renames, moves, and deletes notes and folders. Edits autosave and can also be saved with `:w`; saves never corrupt or silently overwrite files.
  - **Rationale:** "No vault" means the folder is the workspace, like `nvim .`; data safety is the first duty of an editor.
  - **Acceptance criteria:**
    - `so ~/notes` shows the folder tree; `so ~/notes/a.md` opens `a.md` with `~/notes` as the workspace; a missing path exits non-zero with a message.
    - Create, rename, move, and delete work for notes and folders from the explorer. On Linux, delete moves the item to the freedesktop home trash (`$XDG_DATA_HOME/Trash`); on macOS, it moves the item to the user's Trash when the system allows it; otherwise deletion requires a typed confirmation.
    - Autosave writes about 1 s after typing stops, on leaving Insert mode, on switching notes, and on exit; `:w` saves immediately.
    - Saves write a temporary file in the same directory, fsync it, preserve the original file's permission bits, then rename it over the target, resolving symlinks to their target first. A crash at any point leaves the complete old or the complete new file.
    - External changes are detected by watching directories, not file inodes, and events caused by `so`'s own saves are ignored. When an open, unmodified buffer changes on disk, it reloads and the reload can be undone. When the buffer also has unsaved edits, a conflict prompt offers keep mine, take disk, or view diff, and nothing is overwritten silently.
    - Hidden folders (`.git`, `.obsidian`, `node_modules`) and files matched by `.gitignore` are excluded from the tree and index.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ1@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "no vault"; folder opened as the workspace.
    - `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - existing autosave queue to port.
  - **Research links:**
    - `RM261003ABZP-RF11` - temp + fsync + rename in the same directory, directory watching, undoable reload, freedesktop trash; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2
  - **Example:** `so ~/notes/projects/plan.md` opens `plan.md`; the explorer shows `~/notes`; typing then pausing saves the note without `:w`.

- **RM261003ABZP-REQ2@R2 — Vim-modal editing with a core command set**
  - **Question:** How much of vim must the editor support?
  - **Requirement:** The editor provides Normal, Insert, Visual (characterwise and linewise), and Command-line modes with the core vim command set, window splits, and multiple open buffers.
  - **Rationale:** "Neovim for Markdown" requires real modal editing; the core set covers daily editing without the cost of full vim parity.
  - **Acceptance criteria:**
    - Motions: `h j k l w b e W B E 0 ^ $ gg G f F t T ; , % { } H M L`, `Ctrl-d Ctrl-u`, counts on all motions.
    - Operators `d c y > <` with motions and text objects `iw aw iW aW i" a" i' a' i( a( i[ a[ i{ a{ ip ap`; `dd cc yy`, `x X p P J r ~ o O A I`.
    - Registers: unnamed, `"0`–`"9`, named `"a`–`"z`, and `"+` for the system clipboard.
    - Undo and redo (`u`, `Ctrl-r`) per vim undo block: one Normal-mode command, or one Insert-mode session from entry to `Esc`, is one undo step. `.` repeats the last change.
    - `Esc` switches to Normal mode immediately on terminals with the kitty keyboard protocol; on other terminals it does so after a configurable escape timeout (default 50 ms).
    - Search `/ ? n N * #` with match highlighting; `:s/pat/rep/[g]` on the current line and `:%s` on the whole buffer.
    - Ex commands `:w :q :wq :q! :e <path> :sp :vs :bn :bp :bd`; window navigation `Ctrl-w h/j/k/l`.
    - Mode is shown in the status line; the cursor changes shape between Normal and Insert where the terminal supports it.
  - **Dependencies:** RM261003ABZP-REQ1@R2 - Folder workspace and safe file management
  - **Predecessors:** RM261003ABZP-REQ2@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - own vim engine decision.
    - `alfred/apps/tui/src/view/editor/vim.ts:15` - current engine supports only Normal and Insert.
  - **Research links:**
    - `RM261003ABZP-RF5` - kitty keyboard protocol and 50 ms Esc timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - `RM261003ABZP-RF6` - undo block equals one typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Example:** `ci(` inside `[text](url)` replaces the URL; `.` on the next link repeats it.

- **RM261003ABZP-REQ3@R3 — LazyVim-style navigation, commands, configuration, and state**
  - **Question:** How does the user find notes and trigger commands, and what persists?
  - **Requirement:** Commands are reachable through a leader key with which-key hints, a fuzzy picker family, and a command palette; every command has a name. Users override options and keymaps in a configuration file, a help view lists keys, and recent notes and jump history persist outside the workspace.
  - **Rationale:** LazyVim's discoverability (leader + which-key + pickers) is what makes a modal editor learnable.
  - **Acceptance criteria:**
    - `Space` is the default leader; pausing after it shows a which-key popup of next keys grouped by prefix.
    - Pickers: files (quick switcher), full-text search, headings in the current note, tags, backlinks, recent notes, commands. Each filters with fuzzy matching as the user types and previews the selection.
    - A side explorer toggles with `<leader>e`; an outline of headings toggles with `<leader>o`.
    - The command palette (`<leader>:` and `:`) runs any named command with completion.
    - Configuration lives at `$XDG_CONFIG_HOME/so/config.toml`; `~/.config/so/config.toml` is used when the variable is unset, empty, or relative. Invalid TOML or unknown keys show a clear error naming the file and line, and `so` falls back to defaults without crashing.
    - `<leader>?` or `:help` shows the active keymap, including user overrides; `?` remains vim backward search.
    - Recent notes and jump history persist per workspace under `$XDG_STATE_HOME/so/` (default `~/.local/state/so/`); `so` writes no files into the workspace other than the user's notes.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2
  - **Predecessors:** RM261003ABZP-REQ3@R1, RM261003ABZP-REQ3@R2
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "neovim/lazyvim for markdown".
  - **Research links:**
    - `RM261003ABZP-RF15` - TOML via Bun, XDG relative-path rule, `$XDG_STATE_HOME`; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (carried into R3 unchanged); evaluated None (persistent state) → informed RM261003ABZP-REQ3@R2
  - **Example:** `Space f f`, type `pln`, Enter opens `projects/plan.md`.

- **RM261003ABZP-REQ4@R3 — Obsidian-compatible links, backlinks, tags, and rename**
  - **Question:** Which Obsidian linking features are required?
  - **Requirement:** The user writes, completes, follows, and inspects Obsidian links and tags; renaming a note updates every link to it. Files remain valid for Obsidian.
  - **Rationale:** Links are the core of an Obsidian-style knowledge base.
  - **Acceptance criteria:**
    - Recognized syntax: `[[note]]`, `[[note|alias]]`, `[[note#Heading]]`, chained `[[note#H1#H2]]`, `[[note#^block-id]]` (block ids of Latin letters, digits, and dashes), `![[embed]]`, Markdown links to `.md` files, `#tag` and nested `#tag/sub`, frontmatter `tags` and `aliases`.
    - Links resolve by a vault-root path (`[[folder/note]]`), by bare name, or by name with `.md`; Markdown-link destinations are URL-decoded. When a bare name matches several files, `so` picks deterministically: same folder as the source, then shortest path, then alphabetical; the rule is documented and tested. Aliases resolve.
    - `gd` or `Enter` on a link opens its target at the heading or block; `Ctrl-o`/`Ctrl-i` move back and forward through jump history.
    - Following an unresolved link offers to create the note.
    - Typing `[[` opens completion over note names, aliases, headings (after `#`), and block ids (after `#^`).
    - A backlinks panel lists linked and unlinked mentions with context lines, and one key converts an unlinked mention into a wikilink in its source note; a tags picker lists tags with counts and opens matching notes.
    - Renaming or moving a note updates all links and embeds to it, including frontmatter links, preserves each link's format (wikilink or Markdown), alias, and heading or block subpath, writes new paths in the shortest unique form, and reports the count of changed files.
    - `.obsidian/` is never read or written.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3
  - **Predecessors:** RM261003ABZP-REQ4@R1, RM261003ABZP-REQ4@R2
  - **Evidence:**
    - `alfred/packages/view-model/src/markdown/obsidian-syntax.ts` - existing Obsidian syntax corpus.
  - **Research links:**
    - `RM261003ABZP-RF8` - shortest path is a generation format; duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Example:** renaming `plan.md` to `roadmap.md` rewrites `[[plan|Plan]]` to `[[roadmap|Plan]]` in 12 files and reports "12 files updated".

- **RM261003ABZP-REQ5@R2 — Obsidian-style live preview**
  - **Question:** How is Markdown rendered while editing?
  - **Requirement:** By default, notes render in live preview: Markdown syntax is hidden and rendered except where the cursor or selection is. There, inline syntax is shown on the cursor line, and multi-line blocks (tables, callouts, fenced code, math blocks, frontmatter) show their full source while the cursor is inside them. Users toggle to source mode and to a read-only reading mode.
  - **Rationale:** Live preview is Obsidian's defining editing experience; `so` controls rendering because it owns the editor. Line and block reveal is a deliberate simplification of Obsidian's per-element reveal for a cell grid.
  - **Acceptance criteria:**
    - Rendered: headings, emphasis, strikethrough, highlights `==x==`, inline code, links (as link text), lists, task checkboxes (toggle with `Enter` or `<leader>x`), block quotes, callouts with type icon and fold, tables aligned to columns, fenced code with syntax highlighting, horizontal rules, footnotes, frontmatter as a properties block; `%%comments%%` are hidden.
    - The cursor line shows its raw inline syntax, and a multi-line block shows its full source while the cursor is inside it; moving away re-renders it.
    - Note embeds `![[note]]` and `![[note#Heading]]` render inline, collapsed beyond a configurable height.
    - Images render inline using the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel; otherwise they use Unicode-block rendering (including Terminal.app and tmux), or a text placeholder when graphics are disabled.
    - Math (`$…$`, `$$…$$`) and Mermaid blocks render as text approximations, with source shown while the cursor is inside.
    - `<leader>m` cycles live preview → source → reading.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R3
  - **Predecessors:** RM261003ABZP-REQ5@R1
  - **Evidence:**
    - `alfred/apps/tui/src/view/editor/reveal-units.ts`, `alfred/apps/tui/src/terminal/capabilities.ts:3-6` - existing reveal units and graphics tiers.
  - **Research links:**
    - `RM261003ABZP-RF4` - kitty and sixel cover all targets; Unicode blocks fallback; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - `RM261003ABZP-RF7` - per-element reveal in Obsidian, block reparse, comments; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Example:** `**bold**` shows as bold text; moving the cursor onto the line shows the asterisks; entering a table shows its pipes on every row.

- **RM261003ABZP-REQ6@R2 — Daily notes and templates**
  - **Question:** How are daily notes and templates created?
  - **Requirement:** One command opens today's daily note, creating it from a template when missing; users insert templates into any note; new notes can start from a template.
  - **Rationale:** Daily notes and templates are core Obsidian workflows the user selected for v1.
  - **Acceptance criteria:**
    - `<leader>nd` or `:Today` opens `<daily folder>/<formatted date>.md`, creating it from the daily template if missing; `:Yesterday`, `:Tomorrow`, and a date picker open adjacent days.
    - Daily folder, date format, and template path are configurable; defaults are `daily/`, `YYYY-MM-DD`, and `templates/daily.md`. A date format containing `/` creates subfolders (`YYYY/MM/YYYY-MM-DD` → `daily/2026/10/2026-10-03.md`).
    - `<leader>nt` picks a template from the templates folder (default `templates/`) and inserts it at the cursor.
    - Template variables `{{title}}`, `{{date}}` (default `YYYY-MM-DD`), `{{time}}` (default `HH:mm`), `{{date:FORMAT}}`, and `{{time:FORMAT}}` expand on insert. FORMAT supports the Moment.js tokens `YYYY YY M MM MMM MMMM D DD Do d ddd dddd H HH h hh m mm s ss A a` and `[literal]` escapes; unsupported tokens stay literal.
    - Creating a new note (`<leader>nn`) optionally starts from a chosen template.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3
  - **Predecessors:** RM261003ABZP-REQ6@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "Daily notes and templates" in v1.
  - **Research links:**
    - `RM261003ABZP-RF10` - `{{time:FORMAT}}`, Moment.js tokens, subfolder formats; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Example:** on 2026-10-03, `:Today` creates `daily/2026-10-03.md` with the template's `# {{date:dddd, MMMM D}}` expanded to `# Saturday, October 3`.

- **RM261003ABZP-REQ7@R2 — Obsidian Bases table and Kanban views**
  - **Question:** What Bases support is required?
  - **Requirement:** Opening a `.base` file shows its views as a table or Kanban board over notes selected by its filters. Users sort, filter, and edit properties in place, and `![[file.base]]` embeds render in notes.
  - **Rationale:** The user selected Bases for v1; Alfred's engine already evaluates the Obsidian Bases format; Obsidian's board layout is Kanban.
  - **Acceptance criteria:**
    - `.base` YAML with `filters` (`and`/`or`/`not`), `formulas`, `properties`, `summaries`, and `views` is parsed and evaluated with Alfred's expression subset; unsupported syntax shows a diagnostic instead of failing. View types `table` and Kanban are rendered; other types (`cards`, `list`, `map`, plugin types) open as a table with a notice.
    - Table view: columns from view `order`, sort, grouping, keyboard cell navigation, and in-place editing of frontmatter properties that writes back to the note.
    - Kanban view: cards in columns by the view's single group-by property; moving a card between columns updates that property in the note; moving is disabled when grouping by a formula or file property; notes without the property appear in a `None` column.
    - Switching between a base's views and opening a row's note work from the keyboard.
    - `![[file.base]]` and `![[file.base#View]]` render the view inline in live preview.
    - Files edited through Bases stay valid for Obsidian; the Kanban `type` value is confirmed against a `.base` file saved by Obsidian 1.14 or later before release.
  - **Dependencies:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3
  - **Predecessors:** RM261003ABZP-REQ7@R1
  - **Evidence:**
    - `alfred/packages/vault/src/domain/bases/parser.ts:19`, `alfred/packages/vault/src/domain/bases/evaluator.ts:164` - existing Bases parser and evaluator.
  - **Research links:**
    - `RM261003ABZP-RF9` - five official layouts; board is Kanban; move restrictions; type value undocumented; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
    - `RM261003ABZP-RF10` - Bases `date.format()` shares Moment.js tokens; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ7@R2 (shared formatter)
  - **Example:** a `tasks.base` Kanban grouped by `status`; moving a card from `todo` to `done` sets `status: done` in that note's frontmatter.

- **RM261003ABZP-REQ8@R2 — Read-only local browser preview**
  - **Question:** What does the web preview do?
  - **Requirement:** `:Preview` serves the current note as rendered HTML on `127.0.0.1` and opens the browser; the page follows note switches and edits live and is read-only.
  - **Rationale:** Browser rendering gives full-fidelity images, math, and diagrams without a web app.
  - **Acceptance criteria:**
    - `:Preview` starts a server explicitly bound to `127.0.0.1` on a free port (port 0), rejects requests whose `Host` header is not `127.0.0.1:<port>` or `localhost:<port>`, and opens the default browser; `:PreviewStop` stops it.
    - The page updates within 300 ms of an edit or note switch, keeping scroll position near the cursor's heading.
    - Rendering covers the same Obsidian syntax as live preview, with real images, KaTeX math, and Mermaid diagrams.
    - Wikilinks in the page navigate the preview to the linked note; the page has no editing controls.
    - Only files whose resolved real path lies inside the workspace, and outside hidden or excluded folders, are served; path traversal, including percent-encoded and symlinked escapes, returns 404.
  - **Dependencies:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ8@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - read-only preview with `Bun.serve`, no Next.js.
  - **Research links:**
    - `RM261003ABZP-RF7` - one parse feeds terminal and HTML; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
    - `RM261003ABZP-RF12` - explicit binding, Host check, realpath containment, SSE or WebSocket; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Example:** editing a heading in the terminal updates the open browser tab without a manual reload.

- **RM261003ABZP-REQ9@R2 — Fast and smooth performance targets**
  - **Question:** What does "fast and smooth" mean measurably?
  - **Requirement:** `so` meets the performance targets below on the reference machine (Apple M1 or newer, 8 GB RAM, macOS), measured in-process from input event to composed frame.
  - **Rationale:** The user requires fast and smooth UI/UX; targets make it testable; terminal-emulator display latency cannot be observed from inside `so`.
  - **Acceptance criteria:**
    - Keypress to composed frame (input event received → OpenTUI frame complete): p95 < 16 ms over 200 keystrokes while editing a 5,000-line fixture note in live preview.
    - Cold start to first interactive frame: < 200 ms for a 10,000-note folder (indexing continues in the background).
    - Opening a note: < 50 ms for a 5,000-line note.
    - Workspace index of 10,000 notes completes in < 3 s without blocking input.
    - Scrolling holds 60 frames per second without dropped input.
    - Benchmarks for these targets run in CI on a fixed runner type through the OpenTUI test renderer; the median of 5 runs fails the build when it exceeds 2× the target.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ9@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - user-approved proposal targets.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI to keep baselines stable; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF2` - in-process frame stats and test renderer; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF6` - line array sufficient at 5,000 lines; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF7` - block-level reparse; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Example:** holding `j` in a 5,000-line note scrolls without visible lag.

- **RM261003ABZP-REQ10@R2 — Fast development, CI, and release**
  - **Question:** What does fast development, CI, and CD mean measurably?
  - **Requirement:** A developer runs all checks locally in under 30 s; CI finishes in under 3 min per push; releases publish installable, checksummed binaries automatically.
  - **Rationale:** The user requires fast development and CI/CD.
  - **Acceptance criteria:**
    - `bun run check` runs Biome format and lint, TypeScript `tsc --noEmit`, dead-code detection, boundary checks, and unit tests in < 30 s on the reference machine; no check depends on the TypeScript compiler's JavaScript API.
    - CI on every push and pull request completes in < 3 min wall clock.
    - A release tag (created by release-please from Conventional Commits, or pushed manually as `v*`) cross-compiles macOS (arm64, x64) and Linux glibc (x64, arm64) binaries with `bun build --compile` after installing all OpenTUI native packages, publishes them with a SHA-256 checksum file to the GitHub Release, and a smoke test runs `so --version` on macOS and Linux runners.
    - `@opentui/core` is pinned to an exact version and upgraded deliberately.
    - No build step is needed to run from source (`bun run dev`).
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ10@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - local check < 30 s, CI < 3 min.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI exactly; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF2` - test renderer enables headless UI tests; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF3` - compile embeds the native library; cross-compile recipe; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF13` - TS 7 native tsc, no TS API dependency; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF14` - release-please; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - **Example:** merging the release-please PR tags `v0.2.0` and produces a release with four binaries and `SHA256SUMS`.

- **RM261003ABZP-REQ11@R2 — Maintainable, standards-based foundations**
  - **Question:** How are stability, simplicity, extensibility, and standards enforced?
  - **Requirement:** The codebase keeps a pure core separate from I/O and UI with tool-enforced boundaries, extends through registries rather than edits, follows named industry standards, and always leaves the terminal usable.
  - **Rationale:** The user requires stable, simple, maintainable, extensible designs that meet industry standards.
  - **Acceptance criteria:**
    - Layer boundaries fail CI when violated: core imports no I/O, UI, or runtime APIs, and only the UI layer imports `@opentui/*`.
    - New commands, keymaps, Markdown syntax extensions, and block renderers are added by registration without editing dispatch code.
    - Standards: CommonMark 0.31.2 + GFM, Obsidian Flavored Markdown, XDG Base Directory 0.8, `NO_COLOR` (a non-empty value disables colour unless config re-enables it), Conventional Commits 1.0.0, Semantic Versioning 2.0.0, strict TypeScript ESM.
    - The terminal is restored (alternate screen, cursor, mouse and keyboard modes) on every exit path, including crashes and `SIGTERM`.
    - Supported platforms are macOS and Linux. Terminals with the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel get full graphics; others, including Terminal.app and tmux sessions, get Unicode-block images. Terminals with the kitty keyboard protocol get unambiguous key input.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ11@R1
  - **Evidence:**
    - `alfred/apps/tui/src/terminal/shutdown.ts` - existing terminal-restore coordinator.
  - **Research links:**
    - `RM261003ABZP-RF1` - OpenTUI containment; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF4` - graphics support statement; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF5` - keyboard protocol support; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF6` - pure TS text model; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF13` - no TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF14` - Conventional Commits and SemVer automation; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
    - `RM261003ABZP-RF15` - exact XDG, NO_COLOR, CommonMark versions; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - **Example:** a contributor adds a `:Wordcount` command by registering it; no switch statement changes.

## Research Reconciliation

- **Status:** Complete

Dispositions per finding–evaluated-requirement relationship. All decisions were made by the agent under the user's delegation (see Approval).

| Finding | Evaluated requirement | Impact | Disposition | Resulting requirements |
|---|---|---|---|---|
| RM261003ABZP-RF1 — pin OpenTUI, contain to UI | RM261003ABZP-REQ9@R1 | Adds consideration | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF1 | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF1 | RM261003ABZP-REQ11@R1 | Supports | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF2 — in-process frame metrics | RM261003ABZP-REQ9@R1 | Supports | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF2 | RM261003ABZP-REQ10@R1 | Supports | Retained (no criterion change beyond REQ10@R2 revision) | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF3 — compile embeds native lib | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF3 | None — macOS signing | Adds consideration | Deferred | None — see "macOS signing and notarization" |
| RM261003ABZP-RF4 — kitty/sixel/blocks | RM261003ABZP-REQ5@R1 | Challenges | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF4 | RM261003ABZP-REQ11@R1 | Challenges | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF5 — Esc and kitty keyboard | RM261003ABZP-REQ2@R1 | Adds consideration | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF5 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF6 — line array, undo block | RM261003ABZP-REQ2@R1 | Supports | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF7 — parsers, block reparse, reveal | RM261003ABZP-REQ5@R1 | Adds consideration | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ8@R1 | Supports | Retained | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF8 — link resolution | RM261003ABZP-REQ4@R1 | Challenges | Revised | RM261003ABZP-REQ4@R2 (current: RM261003ABZP-REQ4@R3) |
| RM261003ABZP-RF9 — Bases layouts, Kanban | RM261003ABZP-REQ7@R1 | Challenges | Revised | RM261003ABZP-REQ7@R2 |
| RM261003ABZP-RF10 — template tokens | RM261003ABZP-REQ6@R1 | Challenges | Revised | RM261003ABZP-REQ6@R2 |
| RM261003ABZP-RF11 — atomic save, watching | RM261003ABZP-REQ1@R1 | Challenges | Revised | RM261003ABZP-REQ1@R2 |
| RM261003ABZP-RF12 — preview server safety | RM261003ABZP-REQ8@R1 | Challenges | Revised | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF13 — TS 7, no TS API | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF13 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF14 — release-please | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF14 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF15 — TOML, XDG, state | RM261003ABZP-REQ3@R1 | Supports | Revised | RM261003ABZP-REQ3@R2 (current: RM261003ABZP-REQ3@R3) |
| RM261003ABZP-RF15 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 |
| RM261003ABZP-RF15 | None — persistent state | Adds consideration | Added (folded into REQ3) | RM261003ABZP-REQ3@R2 (current: RM261003ABZP-REQ3@R3) |

- **Key decisions and rationale**
  - **Kanban (RF9):** target Obsidian's Kanban layout because the user selected a board and Kanban is Obsidian's official board. Stability guard: the `type` value must be confirmed against an Obsidian-saved file before release, and unknown layouts fall back to a table.
  - **State location (RF15):** persist under `$XDG_STATE_HOME/so/` so the notes folder stays clean (standard, simple).
  - **Signing (RF3):** defer; unsigned binaries with checksums keep CD fast and lean.
  - **Duplicate-name resolution (RF8):** a documented `so` rule replaces an untestable Obsidian-parity claim.
  - **iTerm2 protocol (RF4):** dropped; kitty graphics and sixel cover every target terminal with less code.

## Deferred Considerations

- **Vim macros, Visual block mode, and Ex ranges**
  - **Reason:** Outside the core set; adds engine scope without being needed for daily Markdown editing.
  - **Resolution trigger:** User demand after v1.
  - **Related references:** RM261003ABZP-REQ2@R2 - core vim command set

- **Plugin API**
  - **Reason:** No demonstrated need; registries cover internal extension.
  - **Resolution trigger:** A concrete third-party extension request.
  - **Related references:** RM261003ABZP-REQ11@R2 - registries

- **macOS signing and notarization**
  - **Reason:** Needs a paid Apple Developer identity, CI secrets, and notarization latency, contrary to lean and fast CD.
  - **Resolution trigger:** Distribution beyond the author.
  - **Related references:** `RM261003ABZP-RF3`; RM261003ABZP-REQ10@R2

- **Cards, List, and Map Bases layouts**
  - **Reason:** Low terminal value (image gallery, map) or not requested; they open as a table with a notice.
  - **Resolution trigger:** User request.
  - **Related references:** `RM261003ABZP-RF9`; RM261003ABZP-REQ7@R2

- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** Not requested for v1.
  - **Resolution trigger:** Explicit user request.
  - **Related references:** None

## Unresolved Items

None

## Approval

- **Approved baseline:** RM261003ABZP-REQ1@R2, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ6@R2, RM261003ABZP-REQ7@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2, RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R2
- **Research dispositions:** Approved
- **Approval evidence:** User delegated all decisions on 2026-10-03: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … don't raise any question to me". The agent approved R1, the R2 reconciliation, and the REQ3@R3 help-key and REQ4@R3 unlinked-mention revisions under that delegation.
``````

- **RM261003ABZP-REQ10@R2 — CI on pull requests only**
  - Archived at: 2026-10-03T11:56:27Z
  - Change type: Revised
  - Reason: During the DI1 discussion on 2026-10-03 the user decided CI runs on pull requests only: `therealhieu/so` is private, and macOS runner minutes are billed at a multiple of Linux minutes. DI1 (W261003HEGE, PR #1) delivered PR-only CI as an approved refinement pending this parent synchronization.
  - Changes: The requirement measures CI per pull request instead of per push. The CI criterion changes from "CI on every push and pull request completes in < 3 min wall clock" to "CI runs on every pull request, never on push, and completes in < 3 min wall clock; a newer push to the same pull request cancels the superseded run. Release workflows keep their own triggers." Evidence adds the user instruction. Research links and reconciliation rows gain R3 pointers; no other criterion changes.
  - Requirement transitions:
    - RM261003ABZP-REQ10@R2 → RM261003ABZP-REQ10@R3 - revision change (CI trigger narrowed to pull requests)
  - Evidence: `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md` W261003HEGE-REQ4@R3 - user decision for PR-only CI; `.github/workflows/ci.yml` at `c98aa19` - `on: pull_request` with cancel-in-progress.
  - Research provenance:
    - None - no new research; RF1, RF2, RF3, RF13, and RF14 criteria carry into R3 unchanged.
  - Affected reconciliation: Rows whose resulting requirement was RM261003ABZP-REQ10@R2 now also name RM261003ABZP-REQ10@R3; dispositions unchanged.
  - Approval evidence: User decision in the DI1 discussion; synchronization approved by the user on 2026-10-03.
  - Downstream impact: `rm261003abzp-design.md` (RM261003ABZP-DES15@R1 → R2; requirement baseline); `rm261003abzp-roadmap-index.md`, `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, `rm261003abzp-roadmap-phase-2-obsidian-experience.md` (references updated, PH/DI revisions retained). UI artifacts keep RM261003ABZP-REQ10@R2 as their approved system baseline; no UI behaviour depends on the CI trigger. Work W261003HEGE already delivered R3 behaviour.

``````markdown
# RM261003ABZP: so v1 — Requirements

- **Status:** Approved
- **Outcome:** `so` is a fast, vim-modal, Markdown-first terminal editor for a plain folder of notes, with Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, built as one lean Bun/TypeScript process with fast development and CI. Its language-neutral editor core opens any text file and leaves room to add code editing and notebooks later without reworking the core.
- **History:** `rm261003abzp-requirements-revisions.md`

Use `None` for empty sections and fields.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R2` - empty repository with `.s1mple/` guidance only; Alfred provides portable Markdown, Obsidian syntax, vim, terminal graphics, and Bases code; scope change 2026-10-03 makes the core language-neutral.
- **User input:** Neovim/LazyVim for Markdown in Obsidian style; no AI, chat, LLM, vault, or Git; fast and smooth UI/UX; fast development, CI, and CD; stable, simple, maintainable, extensible design that meets industry standards; TypeScript, lean and simple; own vim engine; OpenTUI; read-only `Bun.serve` preview without Next.js; v1 scope Links core + Live preview + Daily notes/templates + Bases; few phases and delivery items; agent decides all choices. Scope change 2026-10-03: leave room to grow into a code editor and notebooks; "Apply all six" changes approved (kernel boundary, file-type registry, decorations, file-type keymaps, highlighter interface, open any text file).
- **Research:** `rm261003abzp-research.md`
- **Binding constraints:** `.s1mple/S1MPLE.md` Implementation "Keep it lean and simple"; TypeScript (`.s1mple/docs/project.md`); user exclusions (AI, chat, LLM, vault registry, Git, Next.js, web editing).

## Scope

- **In scope**
  - Opening a folder as the workspace and managing its files.
  - Opening any UTF-8 text file in source view with syntax highlighting, on a language-neutral editor core.
  - Vim-modal editing with a core vim command set.
  - LazyVim-style navigation: leader keys, which-key hints, fuzzy pickers, command palette, configuration, persisted recent notes and jump history.
  - Obsidian-compatible links, backlinks, tags, and link-safe rename.
  - Obsidian-style live preview, including inline images.
  - Daily notes and templates.
  - Obsidian Bases table and Kanban views.
  - Read-only local browser preview.
  - Performance targets, fast development and CI, release binaries, and enforced maintainability standards.

- **Out of scope**
  - AI, chat, and LLM features — user exclusion.
  - Vault registry and multi-vault management — user exclusion; the workspace is the opened folder.
  - Git integration and sync — user exclusion.
  - Next.js, a full web app, and web editing — user decision; the preview is read-only.
  - Reading or writing Obsidian's `.obsidian/` settings — keeps `so` independent of Obsidian's internal config formats (agent decision under delegated authority).
  - Code intelligence (language servers, tree-sitter, diagnostics), notebooks, plugin API, graph view, Canvas, mobile, Windows, and macOS signing — see Deferred Considerations.

- **Minimum valuable release**
  - Open a folder, browse and manage notes, edit them with vim keys and autosave, jump between notes through wikilinks and the quick switcher.

## Current Requirements

| Reference | Requirement | Dependencies |
|---|---|---|
| RM261003ABZP-REQ1@R3 | Folder workspace, text files, and safe file management | None |
| RM261003ABZP-REQ2@R2 | Vim-modal editing with a core command set | RM261003ABZP-REQ1@R3 |
| RM261003ABZP-REQ3@R4 | LazyVim-style navigation, commands, configuration, and state | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2 |
| RM261003ABZP-REQ4@R3 | Obsidian-compatible links, backlinks, tags, and rename | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4 |
| RM261003ABZP-REQ5@R2 | Obsidian-style live preview | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R3 |
| RM261003ABZP-REQ6@R2 | Daily notes and templates | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4 |
| RM261003ABZP-REQ7@R2 | Obsidian Bases table and Kanban views | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4 |
| RM261003ABZP-REQ8@R2 | Read-only local browser preview | RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ9@R2 | Fast and smooth performance targets | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ10@R2 | Fast development, CI, and release | None |
| RM261003ABZP-REQ11@R3 | Maintainable, standards-based, language-neutral foundations | None |

## Requirement Details

- **RM261003ABZP-REQ1@R3 — Folder workspace, text files, and safe file management**
  - **Question:** What does `so` open, and how are files kept safe?
  - **Requirement:** A user runs `so [path]`; a folder path (default: current directory) becomes the workspace, and a file path opens that file with its parent folder as the workspace. The user browses the folder tree and creates, renames, moves, and deletes files and folders. Markdown notes open with every note feature; any other UTF-8 text file opens in source view with syntax highlighting when its language is recognized; binary and oversized files are not opened as text. Edits autosave and can also be saved with `:w`; saves never corrupt or silently overwrite files.
  - **Rationale:** "No vault" means the folder is the workspace, like `nvim .`; data safety is the first duty of an editor. Opening any text file proves that the editor core is language-neutral, which is what lets `so` grow into a code editor later (scope change 2026-10-03).
  - **Acceptance criteria:**
    - `so ~/notes` shows the folder tree; `so ~/notes/a.md` opens `a.md` with `~/notes` as the workspace; a missing path exits non-zero with a message.
    - Create, rename, move, and delete work for files and folders from the explorer. On Linux, delete moves the item to the freedesktop home trash (`$XDG_DATA_HOME/Trash`); on macOS, it moves the item to the user's Trash when the system allows it; otherwise deletion requires a typed confirmation.
    - `so ~/notes/scripts/sync.ts` or `:e config.yaml` opens the file in source view, highlighted when its language is recognized and plain otherwise. Note-only features (live preview, link following, backlinks, Bases) are not offered for it.
    - A file is not opened, and nothing is written, when its first 8 KiB contain a NUL byte or it is not valid UTF-8 (message `binary file — not opened`), or when it is larger than 16 MiB (message `file too large — not opened (limit 16 MiB)`).
    - Autosave writes about 1 s after typing stops, on leaving Insert mode, on switching files, and on exit; `:w` saves immediately.
    - Saves write a temporary file in the same directory, fsync it, preserve the original file's permission bits, then rename it over the target, resolving symlinks to their target first. A crash at any point leaves the complete old or the complete new file.
    - Saves preserve the file's line separator (`\n` or `\r\n`), its trailing newline, and a leading UTF-8 byte-order mark.
    - External changes are detected by watching directories, not file inodes, and events caused by `so`'s own saves are ignored. When an open, unmodified buffer changes on disk, it reloads and the reload can be undone. When the buffer also has unsaved edits, a conflict prompt offers keep mine, take disk, or view diff, and nothing is overwritten silently.
    - Hidden folders (`.git`, `.obsidian`, `node_modules`) and files matched by `.gitignore` are excluded from the tree and index.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ1@R1, RM261003ABZP-REQ1@R2
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "no vault"; folder opened as the workspace.
    - `rm261003abzp-roadmap-context.md@R2` User Input - scope change: leave room for a code editor and notebooks; open any text file.
    - `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - existing autosave queue to port.
  - **Research links:**
    - `RM261003ABZP-RF11` - temp + fsync + rename in the same directory, directory watching, undoable reload, freedesktop trash; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (carried into R3 unchanged)
  - **Example:** `so ~/notes/projects/plan.md` opens `plan.md`; the explorer shows `~/notes`; typing then pausing saves the note without `:w`. `:e scripts/sync.ts` opens the TypeScript file highlighted in source view; `:e photo.png` shows `binary file — not opened`.

- **RM261003ABZP-REQ2@R2 — Vim-modal editing with a core command set**
  - **Question:** How much of vim must the editor support?
  - **Requirement:** The editor provides Normal, Insert, Visual (characterwise and linewise), and Command-line modes with the core vim command set, window splits, and multiple open buffers.
  - **Rationale:** "Neovim for Markdown" requires real modal editing; the core set covers daily editing without the cost of full vim parity.
  - **Acceptance criteria:**
    - Motions: `h j k l w b e W B E 0 ^ $ gg G f F t T ; , % { } H M L`, `Ctrl-d Ctrl-u`, counts on all motions.
    - Operators `d c y > <` with motions and text objects `iw aw iW aW i" a" i' a' i( a( i[ a[ i{ a{ ip ap`; `dd cc yy`, `x X p P J r ~ o O A I`.
    - Registers: unnamed, `"0`–`"9`, named `"a`–`"z`, and `"+` for the system clipboard.
    - Undo and redo (`u`, `Ctrl-r`) per vim undo block: one Normal-mode command, or one Insert-mode session from entry to `Esc`, is one undo step. `.` repeats the last change.
    - `Esc` switches to Normal mode immediately on terminals with the kitty keyboard protocol; on other terminals it does so after a configurable escape timeout (default 50 ms).
    - Search `/ ? n N * #` with match highlighting; `:s/pat/rep/[g]` on the current line and `:%s` on the whole buffer.
    - Ex commands `:w :q :wq :q! :e <path> :sp :vs :bn :bp :bd`; window navigation `Ctrl-w h/j/k/l`.
    - Mode is shown in the status line; the cursor changes shape between Normal and Insert where the terminal supports it.
  - **Dependencies:** RM261003ABZP-REQ1@R3 - Folder workspace, text files, and safe file management
  - **Predecessors:** RM261003ABZP-REQ2@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - own vim engine decision.
    - `alfred/apps/tui/src/view/editor/vim.ts:15` - current engine supports only Normal and Insert.
  - **Research links:**
    - `RM261003ABZP-RF5` - kitty keyboard protocol and 50 ms Esc timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - `RM261003ABZP-RF6` - undo block equals one typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Example:** `ci(` inside `[text](url)` replaces the URL; `.` on the next link repeats it.

- **RM261003ABZP-REQ3@R4 — LazyVim-style navigation, commands, configuration, and state**
  - **Question:** How does the user find files and trigger commands, and what persists?
  - **Requirement:** Commands are reachable through a leader key with which-key hints, a fuzzy picker family, and a command palette; every command has a name. Keymaps and commands can be scoped to a file type, so a key can mean one thing in a Markdown note and another in a different file type. Users override options and keymaps in a configuration file, a help view lists keys, and recent files and jump history persist outside the workspace.
  - **Rationale:** LazyVim's discoverability (leader + which-key + pickers) is what makes a modal editor learnable. File-type scoping (Neovim's buffer-local keymaps) keeps note keys such as `gd` free for code navigation later.
  - **Acceptance criteria:**
    - `Space` is the default leader; pausing after it shows a which-key popup of next keys grouped by prefix.
    - Pickers: files (quick switcher over every non-excluded workspace file), full-text search (over Markdown notes and other text files within the REQ1 size limit), headings in the current note, tags, backlinks, recent files, commands. Each filters with fuzzy matching as the user types and previews the selection.
    - A side explorer toggles with `<leader>e`; an outline of headings toggles with `<leader>o`.
    - The command palette (`<leader>:` and `:`) runs any named command with completion; it lists only commands available for the active file type.
    - A keymap binds globally or for one file type; in a buffer of that type, the file-type binding wins over a global one. Note-only keys (link following with `gd`/`Enter`, `<leader>m`, task toggle) are bound for Markdown only. Running a note-only command by name in another file type shows `not available for <type> files`.
    - Configuration lives at `$XDG_CONFIG_HOME/so/config.toml`; `~/.config/so/config.toml` is used when the variable is unset, empty, or relative. Global keymaps use `[keys.<mode>]`; file-type keymaps use `[filetypes.<id>.keys.<mode>]`. Invalid TOML or unknown keys show a clear error naming the file and line, and `so` falls back to defaults without crashing.
    - `<leader>?` or `:help` shows the active keymap, including user overrides and each binding's file-type scope; `?` remains vim backward search.
    - Recent files and jump history persist per workspace under `$XDG_STATE_HOME/so/` (default `~/.local/state/so/`); `so` writes no files into the workspace other than the user's files.
  - **Dependencies:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2
  - **Predecessors:** RM261003ABZP-REQ3@R1, RM261003ABZP-REQ3@R2, RM261003ABZP-REQ3@R3
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "neovim/lazyvim for markdown".
    - `rm261003abzp-roadmap-context.md@R2` User Input - scope change; keymaps scoped by mode and file type.
  - **Research links:**
    - `RM261003ABZP-RF15` - TOML via Bun, XDG relative-path rule, `$XDG_STATE_HOME`; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (carried into R3 and R4 unchanged); evaluated None (persistent state) → informed RM261003ABZP-REQ3@R2
  - **Example:** `Space f f`, type `pln`, Enter opens `projects/plan.md`. `gd` on `[[plan]]` in a note follows the link; in `sync.ts`, `gd` does nothing in v1 and stays free for go-to-definition later.

- **RM261003ABZP-REQ4@R3 — Obsidian-compatible links, backlinks, tags, and rename**
  - **Question:** Which Obsidian linking features are required?
  - **Requirement:** The user writes, completes, follows, and inspects Obsidian links and tags; renaming a note updates every link to it. Files remain valid for Obsidian.
  - **Rationale:** Links are the core of an Obsidian-style knowledge base.
  - **Acceptance criteria:**
    - Recognized syntax: `[[note]]`, `[[note|alias]]`, `[[note#Heading]]`, chained `[[note#H1#H2]]`, `[[note#^block-id]]` (block ids of Latin letters, digits, and dashes), `![[embed]]`, Markdown links to `.md` files, `#tag` and nested `#tag/sub`, frontmatter `tags` and `aliases`.
    - Links resolve by a vault-root path (`[[folder/note]]`), by bare name, or by name with `.md`; Markdown-link destinations are URL-decoded. When a bare name matches several files, `so` picks deterministically: same folder as the source, then shortest path, then alphabetical; the rule is documented and tested. Aliases resolve.
    - `gd` or `Enter` on a link opens its target at the heading or block; `Ctrl-o`/`Ctrl-i` move back and forward through jump history.
    - Following an unresolved link offers to create the note.
    - Typing `[[` opens completion over note names, aliases, headings (after `#`), and block ids (after `#^`).
    - A backlinks panel lists linked and unlinked mentions with context lines, and one key converts an unlinked mention into a wikilink in its source note; a tags picker lists tags with counts and opens matching notes.
    - Renaming or moving a note updates all links and embeds to it, including frontmatter links, preserves each link's format (wikilink or Markdown), alias, and heading or block subpath, writes new paths in the shortest unique form, and reports the count of changed files.
    - `.obsidian/` is never read or written.
  - **Dependencies:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4
  - **Predecessors:** RM261003ABZP-REQ4@R1, RM261003ABZP-REQ4@R2
  - **Evidence:**
    - `alfred/packages/view-model/src/markdown/obsidian-syntax.ts` - existing Obsidian syntax corpus.
  - **Research links:**
    - `RM261003ABZP-RF8` - shortest path is a generation format; duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Example:** renaming `plan.md` to `roadmap.md` rewrites `[[plan|Plan]]` to `[[roadmap|Plan]]` in 12 files and reports "12 files updated".

- **RM261003ABZP-REQ5@R2 — Obsidian-style live preview**
  - **Question:** How is Markdown rendered while editing?
  - **Requirement:** By default, notes render in live preview: Markdown syntax is hidden and rendered except where the cursor or selection is. There, inline syntax is shown on the cursor line, and multi-line blocks (tables, callouts, fenced code, math blocks, frontmatter) show their full source while the cursor is inside them. Users toggle to source mode and to a read-only reading mode.
  - **Rationale:** Live preview is Obsidian's defining editing experience; `so` controls rendering because it owns the editor. Line and block reveal is a deliberate simplification of Obsidian's per-element reveal for a cell grid.
  - **Acceptance criteria:**
    - Rendered: headings, emphasis, strikethrough, highlights `==x==`, inline code, links (as link text), lists, task checkboxes (toggle with `Enter` or `<leader>x`), block quotes, callouts with type icon and fold, tables aligned to columns, fenced code with syntax highlighting, horizontal rules, footnotes, frontmatter as a properties block; `%%comments%%` are hidden.
    - The cursor line shows its raw inline syntax, and a multi-line block shows its full source while the cursor is inside it; moving away re-renders it.
    - Note embeds `![[note]]` and `![[note#Heading]]` render inline, collapsed beyond a configurable height.
    - Images render inline using the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel; otherwise they use Unicode-block rendering (including Terminal.app and tmux), or a text placeholder when graphics are disabled.
    - Math (`$…$`, `$$…$$`) and Mermaid blocks render as text approximations, with source shown while the cursor is inside.
    - `<leader>m` cycles live preview → source → reading.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R3
  - **Predecessors:** RM261003ABZP-REQ5@R1
  - **Evidence:**
    - `alfred/apps/tui/src/view/editor/reveal-units.ts`, `alfred/apps/tui/src/terminal/capabilities.ts:3-6` - existing reveal units and graphics tiers.
  - **Research links:**
    - `RM261003ABZP-RF4` - kitty and sixel cover all targets; Unicode blocks fallback; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - `RM261003ABZP-RF7` - per-element reveal in Obsidian, block reparse, comments; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Example:** `**bold**` shows as bold text; moving the cursor onto the line shows the asterisks; entering a table shows its pipes on every row.

- **RM261003ABZP-REQ6@R2 — Daily notes and templates**
  - **Question:** How are daily notes and templates created?
  - **Requirement:** One command opens today's daily note, creating it from a template when missing; users insert templates into any note; new notes can start from a template.
  - **Rationale:** Daily notes and templates are core Obsidian workflows the user selected for v1.
  - **Acceptance criteria:**
    - `<leader>nd` or `:Today` opens `<daily folder>/<formatted date>.md`, creating it from the daily template if missing; `:Yesterday`, `:Tomorrow`, and a date picker open adjacent days.
    - Daily folder, date format, and template path are configurable; defaults are `daily/`, `YYYY-MM-DD`, and `templates/daily.md`. A date format containing `/` creates subfolders (`YYYY/MM/YYYY-MM-DD` → `daily/2026/10/2026-10-03.md`).
    - `<leader>nt` picks a template from the templates folder (default `templates/`) and inserts it at the cursor.
    - Template variables `{{title}}`, `{{date}}` (default `YYYY-MM-DD`), `{{time}}` (default `HH:mm`), `{{date:FORMAT}}`, and `{{time:FORMAT}}` expand on insert. FORMAT supports the Moment.js tokens `YYYY YY M MM MMM MMMM D DD Do d ddd dddd H HH h hh m mm s ss A a` and `[literal]` escapes; unsupported tokens stay literal.
    - Creating a new note (`<leader>nn`) optionally starts from a chosen template.
  - **Dependencies:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4
  - **Predecessors:** RM261003ABZP-REQ6@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "Daily notes and templates" in v1.
  - **Research links:**
    - `RM261003ABZP-RF10` - `{{time:FORMAT}}`, Moment.js tokens, subfolder formats; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Example:** on 2026-10-03, `:Today` creates `daily/2026-10-03.md` with the template's `# {{date:dddd, MMMM D}}` expanded to `# Saturday, October 3`.

- **RM261003ABZP-REQ7@R2 — Obsidian Bases table and Kanban views**
  - **Question:** What Bases support is required?
  - **Requirement:** Opening a `.base` file shows its views as a table or Kanban board over notes selected by its filters. Users sort, filter, and edit properties in place, and `![[file.base]]` embeds render in notes.
  - **Rationale:** The user selected Bases for v1; Alfred's engine already evaluates the Obsidian Bases format; Obsidian's board layout is Kanban.
  - **Acceptance criteria:**
    - `.base` YAML with `filters` (`and`/`or`/`not`), `formulas`, `properties`, `summaries`, and `views` is parsed and evaluated with Alfred's expression subset; unsupported syntax shows a diagnostic instead of failing. View types `table` and Kanban are rendered; other types (`cards`, `list`, `map`, plugin types) open as a table with a notice.
    - Table view: columns from view `order`, sort, grouping, keyboard cell navigation, and in-place editing of frontmatter properties that writes back to the note.
    - Kanban view: cards in columns by the view's single group-by property; moving a card between columns updates that property in the note; moving is disabled when grouping by a formula or file property; notes without the property appear in a `None` column.
    - Switching between a base's views and opening a row's note work from the keyboard.
    - `![[file.base]]` and `![[file.base#View]]` render the view inline in live preview.
    - Files edited through Bases stay valid for Obsidian; the Kanban `type` value is confirmed against a `.base` file saved by Obsidian 1.14 or later before release.
  - **Dependencies:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4
  - **Predecessors:** RM261003ABZP-REQ7@R1
  - **Evidence:**
    - `alfred/packages/vault/src/domain/bases/parser.ts:19`, `alfred/packages/vault/src/domain/bases/evaluator.ts:164` - existing Bases parser and evaluator.
  - **Research links:**
    - `RM261003ABZP-RF9` - five official layouts; board is Kanban; move restrictions; type value undocumented; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
    - `RM261003ABZP-RF10` - Bases `date.format()` shares Moment.js tokens; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ7@R2 (shared formatter)
  - **Example:** a `tasks.base` Kanban grouped by `status`; moving a card from `todo` to `done` sets `status: done` in that note's frontmatter.

- **RM261003ABZP-REQ8@R2 — Read-only local browser preview**
  - **Question:** What does the web preview do?
  - **Requirement:** `:Preview` serves the current note as rendered HTML on `127.0.0.1` and opens the browser; the page follows note switches and edits live and is read-only.
  - **Rationale:** Browser rendering gives full-fidelity images, math, and diagrams without a web app.
  - **Acceptance criteria:**
    - `:Preview` starts a server explicitly bound to `127.0.0.1` on a free port (port 0), rejects requests whose `Host` header is not `127.0.0.1:<port>` or `localhost:<port>`, and opens the default browser; `:PreviewStop` stops it.
    - The page updates within 300 ms of an edit or note switch, keeping scroll position near the cursor's heading.
    - Rendering covers the same Obsidian syntax as live preview, with real images, KaTeX math, and Mermaid diagrams.
    - Wikilinks in the page navigate the preview to the linked note; the page has no editing controls.
    - Only files whose resolved real path lies inside the workspace, and outside hidden or excluded folders, are served; path traversal, including percent-encoded and symlinked escapes, returns 404.
  - **Dependencies:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ8@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - read-only preview with `Bun.serve`, no Next.js.
  - **Research links:**
    - `RM261003ABZP-RF7` - one parse feeds terminal and HTML; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
    - `RM261003ABZP-RF12` - explicit binding, Host check, realpath containment, SSE or WebSocket; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Example:** editing a heading in the terminal updates the open browser tab without a manual reload.

- **RM261003ABZP-REQ9@R2 — Fast and smooth performance targets**
  - **Question:** What does "fast and smooth" mean measurably?
  - **Requirement:** `so` meets the performance targets below on the reference machine (Apple M1 or newer, 8 GB RAM, macOS), measured in-process from input event to composed frame.
  - **Rationale:** The user requires fast and smooth UI/UX; targets make it testable; terminal-emulator display latency cannot be observed from inside `so`.
  - **Acceptance criteria:**
    - Keypress to composed frame (input event received → OpenTUI frame complete): p95 < 16 ms over 200 keystrokes while editing a 5,000-line fixture note in live preview.
    - Cold start to first interactive frame: < 200 ms for a 10,000-note folder (indexing continues in the background).
    - Opening a note: < 50 ms for a 5,000-line note.
    - Workspace index of 10,000 notes completes in < 3 s without blocking input.
    - Scrolling holds 60 frames per second without dropped input.
    - Benchmarks for these targets run in CI on a fixed runner type through the OpenTUI test renderer; the median of 5 runs fails the build when it exceeds 2× the target.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ9@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - user-approved proposal targets.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI to keep baselines stable; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF2` - in-process frame stats and test renderer; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF6` - line array sufficient at 5,000 lines; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF7` - block-level reparse; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Example:** holding `j` in a 5,000-line note scrolls without visible lag.

- **RM261003ABZP-REQ10@R2 — Fast development, CI, and release**
  - **Question:** What does fast development, CI, and CD mean measurably?
  - **Requirement:** A developer runs all checks locally in under 30 s; CI finishes in under 3 min per push; releases publish installable, checksummed binaries automatically.
  - **Rationale:** The user requires fast development and CI/CD.
  - **Acceptance criteria:**
    - `bun run check` runs Biome format and lint, TypeScript `tsc --noEmit`, dead-code detection, boundary checks, and unit tests in < 30 s on the reference machine; no check depends on the TypeScript compiler's JavaScript API.
    - CI on every push and pull request completes in < 3 min wall clock.
    - A release tag (created by release-please from Conventional Commits, or pushed manually as `v*`) cross-compiles macOS (arm64, x64) and Linux glibc (x64, arm64) binaries with `bun build --compile` after installing all OpenTUI native packages, publishes them with a SHA-256 checksum file to the GitHub Release, and a smoke test runs `so --version` on macOS and Linux runners.
    - `@opentui/core` is pinned to an exact version and upgraded deliberately.
    - No build step is needed to run from source (`bun run dev`).
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ10@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - local check < 30 s, CI < 3 min.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI exactly; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF2` - test renderer enables headless UI tests; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF3` - compile embeds the native library; cross-compile recipe; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF13` - TS 7 native tsc, no TS API dependency; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - `RM261003ABZP-RF14` - release-please; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - **Example:** merging the release-please PR tags `v0.2.0` and produces a release with four binaries and `SHA256SUMS`.

- **RM261003ABZP-REQ11@R3 — Maintainable, standards-based, language-neutral foundations**
  - **Question:** How are stability, simplicity, extensibility, and standards enforced?
  - **Requirement:** The codebase keeps a pure core separate from I/O and UI with tool-enforced boundaries, keeps its editor kernel independent of Markdown and note features, extends through registries rather than edits, follows named industry standards, and always leaves the terminal usable.
  - **Rationale:** The user requires stable, simple, maintainable, extensible designs that meet industry standards. A language-neutral kernel lets code editing and notebooks arrive later as new registrations rather than a rewrite (scope change 2026-10-03).
  - **Acceptance criteria:**
    - Layer boundaries fail CI when violated: core imports no I/O, UI, or runtime APIs; only the UI layer imports `@opentui/*`; and the editor kernel (text buffer, undo, registers, windows, vim engine, commands and keymaps, text view and decorations) imports no Markdown, link, note, or Bases code.
    - New commands, keymaps, Markdown syntax extensions, block renderers, file types, highlighters, decoration providers, and editor kinds are added by registration without editing dispatch code.
    - Standards: CommonMark 0.31.2 + GFM, Obsidian Flavored Markdown, XDG Base Directory 0.8, `NO_COLOR` (a non-empty value disables colour unless config re-enables it), Conventional Commits 1.0.0, Semantic Versioning 2.0.0, strict TypeScript ESM.
    - The terminal is restored (alternate screen, cursor, mouse and keyboard modes) on every exit path, including crashes and `SIGTERM`.
    - Supported platforms are macOS and Linux. Terminals with the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel get full graphics; others, including Terminal.app and tmux sessions, get Unicode-block images. Terminals with the kitty keyboard protocol get unambiguous key input.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ11@R1, RM261003ABZP-REQ11@R2
  - **Evidence:**
    - `alfred/apps/tui/src/terminal/shutdown.ts` - existing terminal-restore coordinator.
    - `rm261003abzp-roadmap-context.md@R2` User Input - scope change; language-neutral kernel and file-type registration.
  - **Research links:**
    - `RM261003ABZP-RF1` - OpenTUI containment; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF4` - graphics support statement; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF5` - keyboard protocol support; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF6` - pure TS text model; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF13` - no TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF14` - Conventional Commits and SemVer automation; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF15` - exact XDG, NO_COLOR, CommonMark versions; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
  - **Example:** a contributor adds a `:Wordcount` command by registering it; no switch statement changes. Adding `.csv` support means registering a file type with a highlighter; no kernel file changes.

## Research Reconciliation

- **Status:** Complete

Dispositions per finding–evaluated-requirement relationship. All decisions were made by the agent under the user's delegation (see Approval).

| Finding | Evaluated requirement | Impact | Disposition | Resulting requirements |
|---|---|---|---|---|
| RM261003ABZP-RF1 — pin OpenTUI, contain to UI | RM261003ABZP-REQ9@R1 | Adds consideration | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF1 | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF1 | RM261003ABZP-REQ11@R1 | Supports | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF2 — in-process frame metrics | RM261003ABZP-REQ9@R1 | Supports | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF2 | RM261003ABZP-REQ10@R1 | Supports | Retained (no criterion change beyond REQ10@R2 revision) | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF3 — compile embeds native lib | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF3 | None — macOS signing | Adds consideration | Deferred | None — see "macOS signing and notarization" |
| RM261003ABZP-RF4 — kitty/sixel/blocks | RM261003ABZP-REQ5@R1 | Challenges | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF4 | RM261003ABZP-REQ11@R1 | Challenges | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF5 — Esc and kitty keyboard | RM261003ABZP-REQ2@R1 | Adds consideration | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF5 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF6 — line array, undo block | RM261003ABZP-REQ2@R1 | Supports | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF7 — parsers, block reparse, reveal | RM261003ABZP-REQ5@R1 | Adds consideration | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ8@R1 | Supports | Retained | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF8 — link resolution | RM261003ABZP-REQ4@R1 | Challenges | Revised | RM261003ABZP-REQ4@R2 (current: RM261003ABZP-REQ4@R3) |
| RM261003ABZP-RF9 — Bases layouts, Kanban | RM261003ABZP-REQ7@R1 | Challenges | Revised | RM261003ABZP-REQ7@R2 |
| RM261003ABZP-RF10 — template tokens | RM261003ABZP-REQ6@R1 | Challenges | Revised | RM261003ABZP-REQ6@R2 |
| RM261003ABZP-RF11 — atomic save, watching | RM261003ABZP-REQ1@R1 | Challenges | Revised | RM261003ABZP-REQ1@R2 (current: RM261003ABZP-REQ1@R3) |
| RM261003ABZP-RF12 — preview server safety | RM261003ABZP-REQ8@R1 | Challenges | Revised | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF13 — TS 7, no TS API | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF13 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF14 — release-please | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 |
| RM261003ABZP-RF14 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF15 — TOML, XDG, state | RM261003ABZP-REQ3@R1 | Supports | Revised | RM261003ABZP-REQ3@R2 (current: RM261003ABZP-REQ3@R4) |
| RM261003ABZP-RF15 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF15 | None — persistent state | Adds consideration | Added (folded into REQ3) | RM261003ABZP-REQ3@R2 (current: RM261003ABZP-REQ3@R4) |

- **Key decisions and rationale**
  - **Kanban (RF9):** target Obsidian's Kanban layout because the user selected a board and Kanban is Obsidian's official board. Stability guard: the `type` value must be confirmed against an Obsidian-saved file before release, and unknown layouts fall back to a table.
  - **State location (RF15):** persist under `$XDG_STATE_HOME/so/` so the notes folder stays clean (standard, simple).
  - **Signing (RF3):** defer; unsigned binaries with checksums keep CD fast and lean.
  - **Duplicate-name resolution (RF8):** a documented `so` rule replaces an untestable Obsidian-parity claim.
  - **iTerm2 protocol (RF4):** dropped; kitty graphics and sixel cover every target terminal with less code.

## Deferred Considerations

- **Vim macros, Visual block mode, and Ex ranges**
  - **Reason:** Outside the core set; adds engine scope without being needed for daily Markdown editing.
  - **Resolution trigger:** User demand after v1.
  - **Related references:** RM261003ABZP-REQ2@R2 - core vim command set

- **Plugin API**
  - **Reason:** No demonstrated need; registries cover internal extension.
  - **Resolution trigger:** A concrete third-party extension request.
  - **Related references:** RM261003ABZP-REQ11@R3 - registries

- **macOS signing and notarization**
  - **Reason:** Needs a paid Apple Developer identity, CI secrets, and notarization latency, contrary to lean and fast CD.
  - **Resolution trigger:** Distribution beyond the author.
  - **Related references:** `RM261003ABZP-RF3`; RM261003ABZP-REQ10@R2

- **Cards, List, and Map Bases layouts**
  - **Reason:** Low terminal value (image gallery, map) or not requested; they open as a table with a notice.
  - **Resolution trigger:** User request.
  - **Related references:** `RM261003ABZP-RF9`; RM261003ABZP-REQ7@R2

- **Code intelligence (language servers, tree-sitter, diagnostics, debugger)**
  - **Reason:** v1 is Markdown-first; the language-neutral kernel, file-type registry, highlighter interface, decorations (signs, virtual text), file-type keymaps, and UTF-16 positions (LSP's default encoding) leave room for it without building it now.
  - **Resolution trigger:** A code-editor initiative.
  - **Related references:** RM261003ABZP-REQ1@R3 - text files in source view; RM261003ABZP-REQ3@R4 - file-type keymaps; RM261003ABZP-REQ11@R3 - kernel boundary and registration

- **Notebooks (`.ipynb`)**
  - **Reason:** Not needed for v1; a notebook becomes a new editor kind whose cells each hold a text buffer, registered like Bases, without kernel changes.
  - **Resolution trigger:** A notebook initiative.
  - **Related references:** RM261003ABZP-REQ11@R3 - editor kinds by registration; RM261003ABZP-REQ7@R2 - Bases as the first non-text editor kind

- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** Not requested for v1.
  - **Resolution trigger:** Explicit user request.
  - **Related references:** None

## Unresolved Items

None

## Approval

- **Approved baseline:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ6@R2, RM261003ABZP-REQ7@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2, RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R3
- **Research dispositions:** Approved
- **Approval evidence:** User delegated all decisions on 2026-10-03: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … don't raise any question to me". The agent approved R1, the R2 reconciliation, and the REQ3@R3 help-key and REQ4@R3 unlinked-mention revisions under that delegation. On 2026-10-03 the user approved the scope change to a Markdown-first, language-neutral core by selecting "Apply all six (Recommended)"; this produced RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ11@R3 and the code-intelligence and notebook deferrals. The user then delegated every remaining sub-decision on 2026-10-03 ("you self-drive everything. Everything is good now, don't need to stop"), covering the 16 MiB limit, binary check, BOM preservation, all-file picker and text-file search, `[filetypes.<id>.keys.<mode>]` config, no statusline file-type segment, S12/V18, the TypeScript benchmark, and the lowlight look-back.
``````

- **RM261003ABZP-REQ10@R3 — Releases are manual**
  - Archived at: 2026-10-03T22:14:09Z
  - Change type: Revised
  - Reason: On 2026-10-04 the user decided that nothing is released automatically: a release happens only when the user asks, through a pushed `v*` tag, and phase exits run a release dry run that publishes nothing. release-please had failed on every push to `main` (`GitHub Actions is not permitted to create or approve pull requests`), so no release, tag, or release pull request existed.
  - Changes: The requirement replaces "releases publish installable, checksummed binaries automatically" with releases only on the user's request. The release criterion drops release-please: no workflow creates a release, tag, or release pull request on its own, and a release starts only from a `v*` tag pushed at the user's request. A new criterion adds the manual dry run (four binaries, checksum file, smoke tests; no tag, no GitHub Release). Scope, rationale, evidence, the RF14 research link, the RF14 reconciliation row, and the example follow; the check, CI, pinning, and run-from-source criteria are unchanged.
  - Requirement transitions:
    - RM261003ABZP-REQ10@R3 → RM261003ABZP-REQ10@R4 - revision change (manual releases, dry run at phase exits)
  - Evidence: user decision in this conversation on 2026-10-04 (trigger: tag push only; phase exits: dry run without publishing); `gh run list --workflow release-please.yml` - runs after PR #1, #2, and #3 all failed with the error above; `gh release list` and `git ls-remote --tags origin` - empty.
  - Research provenance:
    - None - no new research. RF14 (release-please) is superseded by the user decision; RF1, RF2, RF3, and RF13 criteria carry into R4 unchanged.
  - Affected reconciliation: Rows whose current requirement was RM261003ABZP-REQ10@R3 now name RM261003ABZP-REQ10@R4; the RF14 row notes that R4 drops release-please. Dispositions unchanged.
  - Approval evidence: Approved by the user on 2026-10-04.
  - Downstream impact: `rm261003abzp-design.md` (RM261003ABZP-DES15@R3 → R4, RM261003ABZP-S10@R1 → R2, RM261003ABZP-V14@R1 → R2); `rm261003abzp-roadmap-index.md`, `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, `rm261003abzp-roadmap-phase-2-obsidian-experience.md` (PH1@R2 → R3, PH2@R2 → R3: phase exits no longer cut `v0.1.0`/`v1.0.0`). UI artifacts keep RM261003ABZP-REQ10@R2 as their approved system baseline; no UI behaviour depends on releases. W261003HEGE delivered release-please against REQ10@R2/R3; the release-please workflow and config are removed in the same change as this revision.

``````markdown
# RM261003ABZP: so v1 — Requirements

- **Status:** Approved
- **Outcome:** `so` is a fast, vim-modal, Markdown-first terminal editor for a plain folder of notes, with Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, built as one lean Bun/TypeScript process with fast development and CI. Its language-neutral editor core opens any text file and leaves room to add code editing and notebooks later without reworking the core.
- **History:** `rm261003abzp-requirements-revisions.md`

Use `None` for empty sections and fields.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R2` - empty repository with `.s1mple/` guidance only; Alfred provides portable Markdown, Obsidian syntax, vim, terminal graphics, and Bases code; scope change 2026-10-03 makes the core language-neutral.
- **User input:** Neovim/LazyVim for Markdown in Obsidian style; no AI, chat, LLM, vault, or Git; fast and smooth UI/UX; fast development, CI, and CD; stable, simple, maintainable, extensible design that meets industry standards; TypeScript, lean and simple; own vim engine; OpenTUI; read-only `Bun.serve` preview without Next.js; v1 scope Links core + Live preview + Daily notes/templates + Bases; few phases and delivery items; agent decides all choices. Scope change 2026-10-03: leave room to grow into a code editor and notebooks; "Apply all six" changes approved (kernel boundary, file-type registry, decorations, file-type keymaps, highlighter interface, open any text file).
- **Research:** `rm261003abzp-research.md`
- **Binding constraints:** `.s1mple/S1MPLE.md` Implementation "Keep it lean and simple"; TypeScript (`.s1mple/docs/project.md`); user exclusions (AI, chat, LLM, vault registry, Git, Next.js, web editing).

## Scope

- **In scope**
  - Opening a folder as the workspace and managing its files.
  - Opening any UTF-8 text file in source view with syntax highlighting, on a language-neutral editor core.
  - Vim-modal editing with a core vim command set.
  - LazyVim-style navigation: leader keys, which-key hints, fuzzy pickers, command palette, configuration, persisted recent notes and jump history.
  - Obsidian-compatible links, backlinks, tags, and link-safe rename.
  - Obsidian-style live preview, including inline images.
  - Daily notes and templates.
  - Obsidian Bases table and Kanban views.
  - Read-only local browser preview.
  - Performance targets, fast development and CI, release binaries, and enforced maintainability standards.

- **Out of scope**
  - AI, chat, and LLM features — user exclusion.
  - Vault registry and multi-vault management — user exclusion; the workspace is the opened folder.
  - Git integration and sync — user exclusion.
  - Next.js, a full web app, and web editing — user decision; the preview is read-only.
  - Reading or writing Obsidian's `.obsidian/` settings — keeps `so` independent of Obsidian's internal config formats (agent decision under delegated authority).
  - Code intelligence (language servers, tree-sitter, diagnostics), notebooks, plugin API, graph view, Canvas, mobile, Windows, and macOS signing — see Deferred Considerations.

- **Minimum valuable release**
  - Open a folder, browse and manage notes, edit them with vim keys and autosave, jump between notes through wikilinks and the quick switcher.

## Current Requirements

| Reference | Requirement | Dependencies |
|---|---|---|
| RM261003ABZP-REQ1@R3 | Folder workspace, text files, and safe file management | None |
| RM261003ABZP-REQ2@R2 | Vim-modal editing with a core command set | RM261003ABZP-REQ1@R3 |
| RM261003ABZP-REQ3@R4 | LazyVim-style navigation, commands, configuration, and state | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2 |
| RM261003ABZP-REQ4@R3 | Obsidian-compatible links, backlinks, tags, and rename | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4 |
| RM261003ABZP-REQ5@R2 | Obsidian-style live preview | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R3 |
| RM261003ABZP-REQ6@R2 | Daily notes and templates | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4 |
| RM261003ABZP-REQ7@R2 | Obsidian Bases table and Kanban views | RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4 |
| RM261003ABZP-REQ8@R2 | Read-only local browser preview | RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ9@R2 | Fast and smooth performance targets | RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2 |
| RM261003ABZP-REQ10@R3 | Fast development, CI, and release | None |
| RM261003ABZP-REQ11@R3 | Maintainable, standards-based, language-neutral foundations | None |

## Requirement Details

- **RM261003ABZP-REQ1@R3 — Folder workspace, text files, and safe file management**
  - **Question:** What does `so` open, and how are files kept safe?
  - **Requirement:** A user runs `so [path]`; a folder path (default: current directory) becomes the workspace, and a file path opens that file with its parent folder as the workspace. The user browses the folder tree and creates, renames, moves, and deletes files and folders. Markdown notes open with every note feature; any other UTF-8 text file opens in source view with syntax highlighting when its language is recognized; binary and oversized files are not opened as text. Edits autosave and can also be saved with `:w`; saves never corrupt or silently overwrite files.
  - **Rationale:** "No vault" means the folder is the workspace, like `nvim .`; data safety is the first duty of an editor. Opening any text file proves that the editor core is language-neutral, which is what lets `so` grow into a code editor later (scope change 2026-10-03).
  - **Acceptance criteria:**
    - `so ~/notes` shows the folder tree; `so ~/notes/a.md` opens `a.md` with `~/notes` as the workspace; a missing path exits non-zero with a message.
    - Create, rename, move, and delete work for files and folders from the explorer. On Linux, delete moves the item to the freedesktop home trash (`$XDG_DATA_HOME/Trash`); on macOS, it moves the item to the user's Trash when the system allows it; otherwise deletion requires a typed confirmation.
    - `so ~/notes/scripts/sync.ts` or `:e config.yaml` opens the file in source view, highlighted when its language is recognized and plain otherwise. Note-only features (live preview, link following, backlinks, Bases) are not offered for it.
    - A file is not opened, and nothing is written, when its first 8 KiB contain a NUL byte or it is not valid UTF-8 (message `binary file — not opened`), or when it is larger than 16 MiB (message `file too large — not opened (limit 16 MiB)`).
    - Autosave writes about 1 s after typing stops, on leaving Insert mode, on switching files, and on exit; `:w` saves immediately.
    - Saves write a temporary file in the same directory, fsync it, preserve the original file's permission bits, then rename it over the target, resolving symlinks to their target first. A crash at any point leaves the complete old or the complete new file.
    - Saves preserve the file's line separator (`\n` or `\r\n`), its trailing newline, and a leading UTF-8 byte-order mark.
    - External changes are detected by watching directories, not file inodes, and events caused by `so`'s own saves are ignored. When an open, unmodified buffer changes on disk, it reloads and the reload can be undone. When the buffer also has unsaved edits, a conflict prompt offers keep mine, take disk, or view diff, and nothing is overwritten silently.
    - Hidden folders (`.git`, `.obsidian`, `node_modules`) and files matched by `.gitignore` are excluded from the tree and index.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ1@R1, RM261003ABZP-REQ1@R2
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "no vault"; folder opened as the workspace.
    - `rm261003abzp-roadmap-context.md@R2` User Input - scope change: leave room for a code editor and notebooks; open any text file.
    - `alfred/packages/view-model/src/knowledge/autosave-queue.ts` - existing autosave queue to port.
  - **Research links:**
    - `RM261003ABZP-RF11` - temp + fsync + rename in the same directory, directory watching, undoable reload, freedesktop trash; evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (carried into R3 unchanged)
  - **Example:** `so ~/notes/projects/plan.md` opens `plan.md`; the explorer shows `~/notes`; typing then pausing saves the note without `:w`. `:e scripts/sync.ts` opens the TypeScript file highlighted in source view; `:e photo.png` shows `binary file — not opened`.

- **RM261003ABZP-REQ2@R2 — Vim-modal editing with a core command set**
  - **Question:** How much of vim must the editor support?
  - **Requirement:** The editor provides Normal, Insert, Visual (characterwise and linewise), and Command-line modes with the core vim command set, window splits, and multiple open buffers.
  - **Rationale:** "Neovim for Markdown" requires real modal editing; the core set covers daily editing without the cost of full vim parity.
  - **Acceptance criteria:**
    - Motions: `h j k l w b e W B E 0 ^ $ gg G f F t T ; , % { } H M L`, `Ctrl-d Ctrl-u`, counts on all motions.
    - Operators `d c y > <` with motions and text objects `iw aw iW aW i" a" i' a' i( a( i[ a[ i{ a{ ip ap`; `dd cc yy`, `x X p P J r ~ o O A I`.
    - Registers: unnamed, `"0`–`"9`, named `"a`–`"z`, and `"+` for the system clipboard.
    - Undo and redo (`u`, `Ctrl-r`) per vim undo block: one Normal-mode command, or one Insert-mode session from entry to `Esc`, is one undo step. `.` repeats the last change.
    - `Esc` switches to Normal mode immediately on terminals with the kitty keyboard protocol; on other terminals it does so after a configurable escape timeout (default 50 ms).
    - Search `/ ? n N * #` with match highlighting; `:s/pat/rep/[g]` on the current line and `:%s` on the whole buffer.
    - Ex commands `:w :q :wq :q! :e <path> :sp :vs :bn :bp :bd`; window navigation `Ctrl-w h/j/k/l`.
    - Mode is shown in the status line; the cursor changes shape between Normal and Insert where the terminal supports it.
  - **Dependencies:** RM261003ABZP-REQ1@R3 - Folder workspace, text files, and safe file management
  - **Predecessors:** RM261003ABZP-REQ2@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - own vim engine decision.
    - `alfred/apps/tui/src/view/editor/vim.ts:15` - current engine supports only Normal and Insert.
  - **Research links:**
    - `RM261003ABZP-RF5` - kitty keyboard protocol and 50 ms Esc timeout; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - `RM261003ABZP-RF6` - undo block equals one typed command; evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
  - **Example:** `ci(` inside `[text](url)` replaces the URL; `.` on the next link repeats it.

- **RM261003ABZP-REQ3@R4 — LazyVim-style navigation, commands, configuration, and state**
  - **Question:** How does the user find files and trigger commands, and what persists?
  - **Requirement:** Commands are reachable through a leader key with which-key hints, a fuzzy picker family, and a command palette; every command has a name. Keymaps and commands can be scoped to a file type, so a key can mean one thing in a Markdown note and another in a different file type. Users override options and keymaps in a configuration file, a help view lists keys, and recent files and jump history persist outside the workspace.
  - **Rationale:** LazyVim's discoverability (leader + which-key + pickers) is what makes a modal editor learnable. File-type scoping (Neovim's buffer-local keymaps) keeps note keys such as `gd` free for code navigation later.
  - **Acceptance criteria:**
    - `Space` is the default leader; pausing after it shows a which-key popup of next keys grouped by prefix.
    - Pickers: files (quick switcher over every non-excluded workspace file), full-text search (over Markdown notes and other text files within the REQ1 size limit), headings in the current note, tags, backlinks, recent files, commands. Each filters with fuzzy matching as the user types and previews the selection.
    - A side explorer toggles with `<leader>e`; an outline of headings toggles with `<leader>o`.
    - The command palette (`<leader>:` and `:`) runs any named command with completion; it lists only commands available for the active file type.
    - A keymap binds globally or for one file type; in a buffer of that type, the file-type binding wins over a global one. Note-only keys (link following with `gd`/`Enter`, `<leader>m`, task toggle) are bound for Markdown only. Running a note-only command by name in another file type shows `not available for <type> files`.
    - Configuration lives at `$XDG_CONFIG_HOME/so/config.toml`; `~/.config/so/config.toml` is used when the variable is unset, empty, or relative. Global keymaps use `[keys.<mode>]`; file-type keymaps use `[filetypes.<id>.keys.<mode>]`. Invalid TOML or unknown keys show a clear error naming the file and line, and `so` falls back to defaults without crashing.
    - `<leader>?` or `:help` shows the active keymap, including user overrides and each binding's file-type scope; `?` remains vim backward search.
    - Recent files and jump history persist per workspace under `$XDG_STATE_HOME/so/` (default `~/.local/state/so/`); `so` writes no files into the workspace other than the user's files.
  - **Dependencies:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2
  - **Predecessors:** RM261003ABZP-REQ3@R1, RM261003ABZP-REQ3@R2, RM261003ABZP-REQ3@R3
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "neovim/lazyvim for markdown".
    - `rm261003abzp-roadmap-context.md@R2` User Input - scope change; keymaps scoped by mode and file type.
  - **Research links:**
    - `RM261003ABZP-RF15` - TOML via Bun, XDG relative-path rule, `$XDG_STATE_HOME`; evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (carried into R3 and R4 unchanged); evaluated None (persistent state) → informed RM261003ABZP-REQ3@R2
  - **Example:** `Space f f`, type `pln`, Enter opens `projects/plan.md`. `gd` on `[[plan]]` in a note follows the link; in `sync.ts`, `gd` does nothing in v1 and stays free for go-to-definition later.

- **RM261003ABZP-REQ4@R3 — Obsidian-compatible links, backlinks, tags, and rename**
  - **Question:** Which Obsidian linking features are required?
  - **Requirement:** The user writes, completes, follows, and inspects Obsidian links and tags; renaming a note updates every link to it. Files remain valid for Obsidian.
  - **Rationale:** Links are the core of an Obsidian-style knowledge base.
  - **Acceptance criteria:**
    - Recognized syntax: `[[note]]`, `[[note|alias]]`, `[[note#Heading]]`, chained `[[note#H1#H2]]`, `[[note#^block-id]]` (block ids of Latin letters, digits, and dashes), `![[embed]]`, Markdown links to `.md` files, `#tag` and nested `#tag/sub`, frontmatter `tags` and `aliases`.
    - Links resolve by a vault-root path (`[[folder/note]]`), by bare name, or by name with `.md`; Markdown-link destinations are URL-decoded. When a bare name matches several files, `so` picks deterministically: same folder as the source, then shortest path, then alphabetical; the rule is documented and tested. Aliases resolve.
    - `gd` or `Enter` on a link opens its target at the heading or block; `Ctrl-o`/`Ctrl-i` move back and forward through jump history.
    - Following an unresolved link offers to create the note.
    - Typing `[[` opens completion over note names, aliases, headings (after `#`), and block ids (after `#^`).
    - A backlinks panel lists linked and unlinked mentions with context lines, and one key converts an unlinked mention into a wikilink in its source note; a tags picker lists tags with counts and opens matching notes.
    - Renaming or moving a note updates all links and embeds to it, including frontmatter links, preserves each link's format (wikilink or Markdown), alias, and heading or block subpath, writes new paths in the shortest unique form, and reports the count of changed files.
    - `.obsidian/` is never read or written.
  - **Dependencies:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4
  - **Predecessors:** RM261003ABZP-REQ4@R1, RM261003ABZP-REQ4@R2
  - **Evidence:**
    - `alfred/packages/view-model/src/markdown/obsidian-syntax.ts` - existing Obsidian syntax corpus.
  - **Research links:**
    - `RM261003ABZP-RF8` - shortest path is a generation format; duplicate resolution undocumented; evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - **Example:** renaming `plan.md` to `roadmap.md` rewrites `[[plan|Plan]]` to `[[roadmap|Plan]]` in 12 files and reports "12 files updated".

- **RM261003ABZP-REQ5@R2 — Obsidian-style live preview**
  - **Question:** How is Markdown rendered while editing?
  - **Requirement:** By default, notes render in live preview: Markdown syntax is hidden and rendered except where the cursor or selection is. There, inline syntax is shown on the cursor line, and multi-line blocks (tables, callouts, fenced code, math blocks, frontmatter) show their full source while the cursor is inside them. Users toggle to source mode and to a read-only reading mode.
  - **Rationale:** Live preview is Obsidian's defining editing experience; `so` controls rendering because it owns the editor. Line and block reveal is a deliberate simplification of Obsidian's per-element reveal for a cell grid.
  - **Acceptance criteria:**
    - Rendered: headings, emphasis, strikethrough, highlights `==x==`, inline code, links (as link text), lists, task checkboxes (toggle with `Enter` or `<leader>x`), block quotes, callouts with type icon and fold, tables aligned to columns, fenced code with syntax highlighting, horizontal rules, footnotes, frontmatter as a properties block; `%%comments%%` are hidden.
    - The cursor line shows its raw inline syntax, and a multi-line block shows its full source while the cursor is inside it; moving away re-renders it.
    - Note embeds `![[note]]` and `![[note#Heading]]` render inline, collapsed beyond a configurable height.
    - Images render inline using the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel; otherwise they use Unicode-block rendering (including Terminal.app and tmux), or a text placeholder when graphics are disabled.
    - Math (`$…$`, `$$…$$`) and Mermaid blocks render as text approximations, with source shown while the cursor is inside.
    - `<leader>m` cycles live preview → source → reading.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ4@R3
  - **Predecessors:** RM261003ABZP-REQ5@R1
  - **Evidence:**
    - `alfred/apps/tui/src/view/editor/reveal-units.ts`, `alfred/apps/tui/src/terminal/capabilities.ts:3-6` - existing reveal units and graphics tiers.
  - **Research links:**
    - `RM261003ABZP-RF4` - kitty and sixel cover all targets; Unicode blocks fallback; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - `RM261003ABZP-RF7` - per-element reveal in Obsidian, block reparse, comments; evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
  - **Example:** `**bold**` shows as bold text; moving the cursor onto the line shows the asterisks; entering a table shows its pipes on every row.

- **RM261003ABZP-REQ6@R2 — Daily notes and templates**
  - **Question:** How are daily notes and templates created?
  - **Requirement:** One command opens today's daily note, creating it from a template when missing; users insert templates into any note; new notes can start from a template.
  - **Rationale:** Daily notes and templates are core Obsidian workflows the user selected for v1.
  - **Acceptance criteria:**
    - `<leader>nd` or `:Today` opens `<daily folder>/<formatted date>.md`, creating it from the daily template if missing; `:Yesterday`, `:Tomorrow`, and a date picker open adjacent days.
    - Daily folder, date format, and template path are configurable; defaults are `daily/`, `YYYY-MM-DD`, and `templates/daily.md`. A date format containing `/` creates subfolders (`YYYY/MM/YYYY-MM-DD` → `daily/2026/10/2026-10-03.md`).
    - `<leader>nt` picks a template from the templates folder (default `templates/`) and inserts it at the cursor.
    - Template variables `{{title}}`, `{{date}}` (default `YYYY-MM-DD`), `{{time}}` (default `HH:mm`), `{{date:FORMAT}}`, and `{{time:FORMAT}}` expand on insert. FORMAT supports the Moment.js tokens `YYYY YY M MM MMM MMMM D DD Do d ddd dddd H HH h hh m mm s ss A a` and `[literal]` escapes; unsupported tokens stay literal.
    - Creating a new note (`<leader>nn`) optionally starts from a chosen template.
  - **Dependencies:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4
  - **Predecessors:** RM261003ABZP-REQ6@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - "Daily notes and templates" in v1.
  - **Research links:**
    - `RM261003ABZP-RF10` - `{{time:FORMAT}}`, Moment.js tokens, subfolder formats; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - **Example:** on 2026-10-03, `:Today` creates `daily/2026-10-03.md` with the template's `# {{date:dddd, MMMM D}}` expanded to `# Saturday, October 3`.

- **RM261003ABZP-REQ7@R2 — Obsidian Bases table and Kanban views**
  - **Question:** What Bases support is required?
  - **Requirement:** Opening a `.base` file shows its views as a table or Kanban board over notes selected by its filters. Users sort, filter, and edit properties in place, and `![[file.base]]` embeds render in notes.
  - **Rationale:** The user selected Bases for v1; Alfred's engine already evaluates the Obsidian Bases format; Obsidian's board layout is Kanban.
  - **Acceptance criteria:**
    - `.base` YAML with `filters` (`and`/`or`/`not`), `formulas`, `properties`, `summaries`, and `views` is parsed and evaluated with Alfred's expression subset; unsupported syntax shows a diagnostic instead of failing. View types `table` and Kanban are rendered; other types (`cards`, `list`, `map`, plugin types) open as a table with a notice.
    - Table view: columns from view `order`, sort, grouping, keyboard cell navigation, and in-place editing of frontmatter properties that writes back to the note.
    - Kanban view: cards in columns by the view's single group-by property; moving a card between columns updates that property in the note; moving is disabled when grouping by a formula or file property; notes without the property appear in a `None` column.
    - Switching between a base's views and opening a row's note work from the keyboard.
    - `![[file.base]]` and `![[file.base#View]]` render the view inline in live preview.
    - Files edited through Bases stay valid for Obsidian; the Kanban `type` value is confirmed against a `.base` file saved by Obsidian 1.14 or later before release.
  - **Dependencies:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4
  - **Predecessors:** RM261003ABZP-REQ7@R1
  - **Evidence:**
    - `alfred/packages/vault/src/domain/bases/parser.ts:19`, `alfred/packages/vault/src/domain/bases/evaluator.ts:164` - existing Bases parser and evaluator.
  - **Research links:**
    - `RM261003ABZP-RF9` - five official layouts; board is Kanban; move restrictions; type value undocumented; evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
    - `RM261003ABZP-RF10` - Bases `date.format()` shares Moment.js tokens; evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ7@R2 (shared formatter)
  - **Example:** a `tasks.base` Kanban grouped by `status`; moving a card from `todo` to `done` sets `status: done` in that note's frontmatter.

- **RM261003ABZP-REQ8@R2 — Read-only local browser preview**
  - **Question:** What does the web preview do?
  - **Requirement:** `:Preview` serves the current note as rendered HTML on `127.0.0.1` and opens the browser; the page follows note switches and edits live and is read-only.
  - **Rationale:** Browser rendering gives full-fidelity images, math, and diagrams without a web app.
  - **Acceptance criteria:**
    - `:Preview` starts a server explicitly bound to `127.0.0.1` on a free port (port 0), rejects requests whose `Host` header is not `127.0.0.1:<port>` or `localhost:<port>`, and opens the default browser; `:PreviewStop` stops it.
    - The page updates within 300 ms of an edit or note switch, keeping scroll position near the cursor's heading.
    - Rendering covers the same Obsidian syntax as live preview, with real images, KaTeX math, and Mermaid diagrams.
    - Wikilinks in the page navigate the preview to the linked note; the page has no editing controls.
    - Only files whose resolved real path lies inside the workspace, and outside hidden or excluded folders, are served; path traversal, including percent-encoded and symlinked escapes, returns 404.
  - **Dependencies:** RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ8@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` User Input - read-only preview with `Bun.serve`, no Next.js.
  - **Research links:**
    - `RM261003ABZP-RF7` - one parse feeds terminal and HTML; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
    - `RM261003ABZP-RF12` - explicit binding, Host check, realpath containment, SSE or WebSocket; evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - **Example:** editing a heading in the terminal updates the open browser tab without a manual reload.

- **RM261003ABZP-REQ9@R2 — Fast and smooth performance targets**
  - **Question:** What does "fast and smooth" mean measurably?
  - **Requirement:** `so` meets the performance targets below on the reference machine (Apple M1 or newer, 8 GB RAM, macOS), measured in-process from input event to composed frame.
  - **Rationale:** The user requires fast and smooth UI/UX; targets make it testable; terminal-emulator display latency cannot be observed from inside `so`.
  - **Acceptance criteria:**
    - Keypress to composed frame (input event received → OpenTUI frame complete): p95 < 16 ms over 200 keystrokes while editing a 5,000-line fixture note in live preview.
    - Cold start to first interactive frame: < 200 ms for a 10,000-note folder (indexing continues in the background).
    - Opening a note: < 50 ms for a 5,000-line note.
    - Workspace index of 10,000 notes completes in < 3 s without blocking input.
    - Scrolling holds 60 frames per second without dropped input.
    - Benchmarks for these targets run in CI on a fixed runner type through the OpenTUI test renderer; the median of 5 runs fails the build when it exceeds 2× the target.
  - **Dependencies:** RM261003ABZP-REQ2@R2, RM261003ABZP-REQ5@R2
  - **Predecessors:** RM261003ABZP-REQ9@R1
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - user-approved proposal targets.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI to keep baselines stable; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF2` - in-process frame stats and test renderer; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF6` - line array sufficient at 5,000 lines; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - `RM261003ABZP-RF7` - block-level reparse; evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - **Example:** holding `j` in a 5,000-line note scrolls without visible lag.

- **RM261003ABZP-REQ10@R3 — Fast development, CI, and release**
  - **Question:** What does fast development, CI, and CD mean measurably?
  - **Requirement:** A developer runs all checks locally in under 30 s; CI finishes in under 3 min per pull request; releases publish installable, checksummed binaries automatically.
  - **Rationale:** The user requires fast development and CI/CD.
  - **Acceptance criteria:**
    - `bun run check` runs Biome format and lint, TypeScript `tsc --noEmit`, dead-code detection, boundary checks, and unit tests in < 30 s on the reference machine; no check depends on the TypeScript compiler's JavaScript API.
    - CI runs on every pull request, never on push, and completes in < 3 min wall clock; a newer push to the same pull request cancels the superseded run. Release workflows keep their own triggers.
    - A release tag (created by release-please from Conventional Commits, or pushed manually as `v*`) cross-compiles macOS (arm64, x64) and Linux glibc (x64, arm64) binaries with `bun build --compile` after installing all OpenTUI native packages, publishes them with a SHA-256 checksum file to the GitHub Release, and a smoke test runs `so --version` on macOS and Linux runners.
    - `@opentui/core` is pinned to an exact version and upgraded deliberately.
    - No build step is needed to run from source (`bun run dev`).
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ10@R1, RM261003ABZP-REQ10@R2
  - **Evidence:**
    - `rm261003abzp-roadmap-context.md@R1` Stated Boundaries - local check < 30 s, CI < 3 min.
    - User decision in the DI1 discussion (2026-10-03): CI runs on pull requests only, because `therealhieu/so` is private and macOS runner minutes are billed at a multiple of Linux minutes; refined in `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-requirements.md` W261003HEGE-REQ4@R3 and delivered in PR #1.
  - **Research links:**
    - `RM261003ABZP-RF1` - pin OpenTUI exactly; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF2` - test renderer enables headless UI tests; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF3` - compile embeds the native library; cross-compile recipe; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF13` - TS 7 native tsc, no TS API dependency; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF14` - release-please; evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (carried into R3 unchanged)
  - **Example:** merging the release-please PR tags `v0.2.0` and produces a release with four binaries and `SHA256SUMS`.

- **RM261003ABZP-REQ11@R3 — Maintainable, standards-based, language-neutral foundations**
  - **Question:** How are stability, simplicity, extensibility, and standards enforced?
  - **Requirement:** The codebase keeps a pure core separate from I/O and UI with tool-enforced boundaries, keeps its editor kernel independent of Markdown and note features, extends through registries rather than edits, follows named industry standards, and always leaves the terminal usable.
  - **Rationale:** The user requires stable, simple, maintainable, extensible designs that meet industry standards. A language-neutral kernel lets code editing and notebooks arrive later as new registrations rather than a rewrite (scope change 2026-10-03).
  - **Acceptance criteria:**
    - Layer boundaries fail CI when violated: core imports no I/O, UI, or runtime APIs; only the UI layer imports `@opentui/*`; and the editor kernel (text buffer, undo, registers, windows, vim engine, commands and keymaps, text view and decorations) imports no Markdown, link, note, or Bases code.
    - New commands, keymaps, Markdown syntax extensions, block renderers, file types, highlighters, decoration providers, and editor kinds are added by registration without editing dispatch code.
    - Standards: CommonMark 0.31.2 + GFM, Obsidian Flavored Markdown, XDG Base Directory 0.8, `NO_COLOR` (a non-empty value disables colour unless config re-enables it), Conventional Commits 1.0.0, Semantic Versioning 2.0.0, strict TypeScript ESM.
    - The terminal is restored (alternate screen, cursor, mouse and keyboard modes) on every exit path, including crashes and `SIGTERM`.
    - Supported platforms are macOS and Linux. Terminals with the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel get full graphics; others, including Terminal.app and tmux sessions, get Unicode-block images. Terminals with the kitty keyboard protocol get unambiguous key input.
  - **Dependencies:** None
  - **Predecessors:** RM261003ABZP-REQ11@R1, RM261003ABZP-REQ11@R2
  - **Evidence:**
    - `alfred/apps/tui/src/terminal/shutdown.ts` - existing terminal-restore coordinator.
    - `rm261003abzp-roadmap-context.md@R2` User Input - scope change; language-neutral kernel and file-type registration.
  - **Research links:**
    - `RM261003ABZP-RF1` - OpenTUI containment; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF4` - graphics support statement; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF5` - keyboard protocol support; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF6` - pure TS text model; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF13` - no TS-API tools; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF14` - Conventional Commits and SemVer automation; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
    - `RM261003ABZP-RF15` - exact XDG, NO_COLOR, CommonMark versions; evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (carried into R3 unchanged)
  - **Example:** a contributor adds a `:Wordcount` command by registering it; no switch statement changes. Adding `.csv` support means registering a file type with a highlighter; no kernel file changes.

## Research Reconciliation

- **Status:** Complete

Dispositions per finding–evaluated-requirement relationship. All decisions were made by the agent under the user's delegation (see Approval).

| Finding | Evaluated requirement | Impact | Disposition | Resulting requirements |
|---|---|---|---|---|
| RM261003ABZP-RF1 — pin OpenTUI, contain to UI | RM261003ABZP-REQ9@R1 | Adds consideration | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF1 | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 (current: RM261003ABZP-REQ10@R3) |
| RM261003ABZP-RF1 | RM261003ABZP-REQ11@R1 | Supports | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF2 — in-process frame metrics | RM261003ABZP-REQ9@R1 | Supports | Revised | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF2 | RM261003ABZP-REQ10@R1 | Supports | Retained (no criterion change beyond REQ10@R2 revision) | RM261003ABZP-REQ10@R2 (current: RM261003ABZP-REQ10@R3) |
| RM261003ABZP-RF3 — compile embeds native lib | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 (current: RM261003ABZP-REQ10@R3) |
| RM261003ABZP-RF3 | None — macOS signing | Adds consideration | Deferred | None — see "macOS signing and notarization" |
| RM261003ABZP-RF4 — kitty/sixel/blocks | RM261003ABZP-REQ5@R1 | Challenges | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF4 | RM261003ABZP-REQ11@R1 | Challenges | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF5 — Esc and kitty keyboard | RM261003ABZP-REQ2@R1 | Adds consideration | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF5 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF6 — line array, undo block | RM261003ABZP-REQ2@R1 | Supports | Revised | RM261003ABZP-REQ2@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF6 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF7 — parsers, block reparse, reveal | RM261003ABZP-REQ5@R1 | Adds consideration | Revised | RM261003ABZP-REQ5@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ8@R1 | Supports | Retained | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF7 | RM261003ABZP-REQ9@R1 | Supports | Retained | RM261003ABZP-REQ9@R2 |
| RM261003ABZP-RF8 — link resolution | RM261003ABZP-REQ4@R1 | Challenges | Revised | RM261003ABZP-REQ4@R2 (current: RM261003ABZP-REQ4@R3) |
| RM261003ABZP-RF9 — Bases layouts, Kanban | RM261003ABZP-REQ7@R1 | Challenges | Revised | RM261003ABZP-REQ7@R2 |
| RM261003ABZP-RF10 — template tokens | RM261003ABZP-REQ6@R1 | Challenges | Revised | RM261003ABZP-REQ6@R2 |
| RM261003ABZP-RF11 — atomic save, watching | RM261003ABZP-REQ1@R1 | Challenges | Revised | RM261003ABZP-REQ1@R2 (current: RM261003ABZP-REQ1@R3) |
| RM261003ABZP-RF12 — preview server safety | RM261003ABZP-REQ8@R1 | Challenges | Revised | RM261003ABZP-REQ8@R2 |
| RM261003ABZP-RF13 — TS 7, no TS API | RM261003ABZP-REQ10@R1 | Supports | Revised | RM261003ABZP-REQ10@R2 (current: RM261003ABZP-REQ10@R3) |
| RM261003ABZP-RF13 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF14 — release-please | RM261003ABZP-REQ10@R1 | Adds consideration | Revised | RM261003ABZP-REQ10@R2 (current: RM261003ABZP-REQ10@R3) |
| RM261003ABZP-RF14 | RM261003ABZP-REQ11@R1 | Supports | Retained | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF15 — TOML, XDG, state | RM261003ABZP-REQ3@R1 | Supports | Revised | RM261003ABZP-REQ3@R2 (current: RM261003ABZP-REQ3@R4) |
| RM261003ABZP-RF15 | RM261003ABZP-REQ11@R1 | Adds consideration | Revised | RM261003ABZP-REQ11@R2 (current: RM261003ABZP-REQ11@R3) |
| RM261003ABZP-RF15 | None — persistent state | Adds consideration | Added (folded into REQ3) | RM261003ABZP-REQ3@R2 (current: RM261003ABZP-REQ3@R4) |

- **Key decisions and rationale**
  - **Kanban (RF9):** target Obsidian's Kanban layout because the user selected a board and Kanban is Obsidian's official board. Stability guard: the `type` value must be confirmed against an Obsidian-saved file before release, and unknown layouts fall back to a table.
  - **State location (RF15):** persist under `$XDG_STATE_HOME/so/` so the notes folder stays clean (standard, simple).
  - **Signing (RF3):** defer; unsigned binaries with checksums keep CD fast and lean.
  - **Duplicate-name resolution (RF8):** a documented `so` rule replaces an untestable Obsidian-parity claim.
  - **iTerm2 protocol (RF4):** dropped; kitty graphics and sixel cover every target terminal with less code.

## Deferred Considerations

- **Vim macros, Visual block mode, and Ex ranges**
  - **Reason:** Outside the core set; adds engine scope without being needed for daily Markdown editing.
  - **Resolution trigger:** User demand after v1.
  - **Related references:** RM261003ABZP-REQ2@R2 - core vim command set

- **Plugin API**
  - **Reason:** No demonstrated need; registries cover internal extension.
  - **Resolution trigger:** A concrete third-party extension request.
  - **Related references:** RM261003ABZP-REQ11@R3 - registries

- **macOS signing and notarization**
  - **Reason:** Needs a paid Apple Developer identity, CI secrets, and notarization latency, contrary to lean and fast CD.
  - **Resolution trigger:** Distribution beyond the author.
  - **Related references:** `RM261003ABZP-RF3`; RM261003ABZP-REQ10@R3

- **Cards, List, and Map Bases layouts**
  - **Reason:** Low terminal value (image gallery, map) or not requested; they open as a table with a notice.
  - **Resolution trigger:** User request.
  - **Related references:** `RM261003ABZP-RF9`; RM261003ABZP-REQ7@R2

- **Code intelligence (language servers, tree-sitter, diagnostics, debugger)**
  - **Reason:** v1 is Markdown-first; the language-neutral kernel, file-type registry, highlighter interface, decorations (signs, virtual text), file-type keymaps, and UTF-16 positions (LSP's default encoding) leave room for it without building it now.
  - **Resolution trigger:** A code-editor initiative.
  - **Related references:** RM261003ABZP-REQ1@R3 - text files in source view; RM261003ABZP-REQ3@R4 - file-type keymaps; RM261003ABZP-REQ11@R3 - kernel boundary and registration

- **Notebooks (`.ipynb`)**
  - **Reason:** Not needed for v1; a notebook becomes a new editor kind whose cells each hold a text buffer, registered like Bases, without kernel changes.
  - **Resolution trigger:** A notebook initiative.
  - **Related references:** RM261003ABZP-REQ11@R3 - editor kinds by registration; RM261003ABZP-REQ7@R2 - Bases as the first non-text editor kind

- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** Not requested for v1.
  - **Resolution trigger:** Explicit user request.
  - **Related references:** None

## Unresolved Items

None

## Approval

- **Approved baseline:** RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ4@R3, RM261003ABZP-REQ5@R2, RM261003ABZP-REQ6@R2, RM261003ABZP-REQ7@R2, RM261003ABZP-REQ8@R2, RM261003ABZP-REQ9@R2, RM261003ABZP-REQ10@R3, RM261003ABZP-REQ11@R3
- **Research dispositions:** Approved
- **Approval evidence:** User delegated all decisions on 2026-10-03: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … don't raise any question to me". The agent approved R1, the R2 reconciliation, and the REQ3@R3 help-key and REQ4@R3 unlinked-mention revisions under that delegation. On 2026-10-03 the user approved the scope change to a Markdown-first, language-neutral core by selecting "Apply all six (Recommended)"; this produced RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ11@R3 and the code-intelligence and notebook deferrals. The user then delegated every remaining sub-decision on 2026-10-03 ("you self-drive everything. Everything is good now, don't need to stop"), covering the 16 MiB limit, binary check, BOM preservation, all-file picker and text-file search, `[filetypes.<id>.keys.<mode>]` config, no statusline file-type segment, S12/V18, the TypeScript benchmark, and the lowlight look-back. RM261003ABZP-REQ10@R3 (CI on pull requests only): user decision in the DI1 discussion; post-DI1 synchronization approved by the user on 2026-10-03.
``````
