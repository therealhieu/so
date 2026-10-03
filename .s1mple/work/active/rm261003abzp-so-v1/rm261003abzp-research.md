# RM261003ABZP: so v1 — Research

- **Status:** Ready for Reconciliation
- **Researched at:** 2026-10-03T01:46:58Z
- **Conclusion:** All eleven requirements fit the user's goals and are feasible with Bun, OpenTUI, and existing standards; none should be dropped. Ten need sharper wording. The material corrections are listed below. Two uncovered needs are recorded: where persistent state lives, and macOS binary signing.
  1. REQ7's "cards/board" mixes up two different Obsidian layouts. "Board" corresponds to Obsidian's official `Kanban` layout (Obsidian 1.14, early access).
  2. REQ5 and REQ11 name an iTerm2 image protocol that `so` does not need. iTerm2 implements the kitty graphics protocol and sixel, and OpenTUI's image pipeline is kitty → sixel → Unicode blocks.
  3. REQ8 lacks DNS-rebinding and symlink protections. Bun.serve listens on `0.0.0.0` by default.
  4. REQ1 needs fsync, directory-level watching, and own-write suppression. Without them, atomic saves and external-change detection fail.
  5. REQ9 and REQ10 need a defined way to measure targets and a defined release build recipe for OpenTUI's native library.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R1` - The repository is empty except for `.s1mple/` guidance. The user has decided on OpenTUI (pre-1.0), its own vim engine, a read-only `Bun.serve` preview, and a v1 Obsidian scope of Links core, Live preview, Daily notes/templates, and Bases. Unknowns listed there: OpenTUI stability, whether `bun build --compile` works with OpenTUI's native library, whether the performance targets are achievable, and the Bases compatibility level.
- **Requirements:** `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-requirements.md` (Status: Approved; ledger REQ1–REQ11 at R1)
- **History:** `.s1mple/work/active/rm261003abzp-so-v1/rm261003abzp-requirements-revisions.md` (Archived Changes: None — supplied revisions match the current ledger)
- **Evaluated requirements:**
  - `RM261003ABZP-REQ1@R1` - Folder workspace and safe file management: `so [path]` opens a folder or file workspace; tree browsing; create/rename/move/delete; autosave plus `:w`; atomic writes; external-change reload and conflict prompt; hidden and `.gitignore` files excluded.
  - `RM261003ABZP-REQ2@R1` - Vim-modal editing with a core command set: Normal, Insert, Visual (char/line), and Command-line modes; listed motions, operators, text objects, registers, undo/redo, `.`, search, `:s`, Ex commands, splits, buffers; mode display and cursor shape.
  - `RM261003ABZP-REQ3@R1` - LazyVim-style navigation, commands, and configuration: `Space` leader with which-key; picker family; explorer and outline; command palette; `$XDG_CONFIG_HOME/so/config.toml` with fallback on invalid config; keymap help.
  - `RM261003ABZP-REQ4@R1` - Obsidian-compatible links, backlinks, tags, and rename: wikilink, embed, heading, block, and Markdown link syntax; tags and frontmatter; shortest-unique-path resolution; follow, jump history, create-on-follow, `[[` completion, backlinks, tags picker; link-updating rename; `.obsidian/` never touched.
  - `RM261003ABZP-REQ5@R1` - Obsidian-style live preview: syntax hidden except on the cursor line or selection; listed elements rendered; note embeds; inline images via kitty, iTerm2, or sixel with half-block and text fallbacks; math and Mermaid as text; mode cycling.
  - `RM261003ABZP-REQ6@R1` - Daily notes and templates: `:Today`/`:Yesterday`/`:Tomorrow`/date picker; configurable folder, format, and template; template insert; `{{title}} {{date}} {{time}} {{date:FORMAT}}` matching Obsidian's core Templates plugin; new note from a template.
  - `RM261003ABZP-REQ7@R1` - Obsidian Bases table and board views: `.base` `filters`, `formulas`, `properties`, and `views` (`table` and `cards`/board) evaluated with Alfred's expression subset and diagnostics; table editing; board grouping and card moves; keyboard view switching; `.base` embeds; files stay valid for Obsidian.
  - `RM261003ABZP-REQ8@R1` - Read-only local browser preview: `:Preview` on `127.0.0.1` with a free port; updates within 300 ms; same syntax coverage plus real images, KaTeX, and Mermaid; wikilink navigation; no editing; workspace-only serving with 404 on traversal.
  - `RM261003ABZP-REQ9@R1` - Fast and smooth performance targets: keypress→frame p95 < 16 ms (5,000-line note, live preview); cold start < 200 ms (10,000 notes); open < 50 ms; index < 3 s without blocking; 60 fps scrolling; CI benchmarks fail above 2× target.
  - `RM261003ABZP-REQ10@R1` - Fast development, CI, and release: `bun run check` (format, lint, typecheck, dead code, boundaries, unit tests) < 30 s; CI < 3 min; `v*` tag publishes macOS and Linux arm64/x64 binaries; `bun run dev` with no build step.
  - `RM261003ABZP-REQ11@R1` - Maintainable, standards-based foundations: pure core with CI-enforced boundaries; registries for commands, keymaps, syntax, and renderers; named standards (CommonMark 0.31 + GFM, OFM, XDG, `NO_COLOR`, Conventional Commits, SemVer, strict TS ESM); terminal restored on every exit path; macOS and Linux; full graphics in kitty, Ghostty, WezTerm, and iTerm2, half-block elsewhere.
- **Binding constraints:** `.s1mple/S1MPLE.md` Implementation "Keep it lean and simple" (user decision, 2026-10-03); TypeScript (`.s1mple/docs/project.md`); user decisions: own vim engine, OpenTUI, read-only `Bun.serve` preview, v1 Obsidian scope; user exclusions: AI, chat, LLM, vault registry, Git, Next.js, web editing; out-of-scope `.obsidian/` read/write; few phases and delivery items.

## Research Coverage

- **OpenTUI suitability**
  - **Question:** Are OpenTUI's maturity, rendering model, keyboard and image support, test tooling, and single-binary packaging adequate for `so`, and what do they imply for the requirements?
  - **Requirements:** `RM261003ABZP-REQ5@R1`, `RM261003ABZP-REQ9@R1`, `RM261003ABZP-REQ10@R1`, `RM261003ABZP-REQ11@R1`
  - **Searches:** Context7 `/anomalyco/opentui`: test renderer, kitty keyboard, rendering pipeline, standalone executables, image protocols, EditBuffer, terminal capabilities and lifecycle, MarkdownRenderable/tree-sitter, render statistics. `gh api repos/anomalyco/opentui`; `gh release list`/`view` (v0.5.0, v0.5.14); README via WebFetch.
  - **Findings:** RM261003ABZP-RF1 - pre-1.0 but production-used with a fast cadence, so the version should be pinned and kept behind the UI layer; RM261003ABZP-RF2 - native diff renderer plus stats and a test renderer make frame targets measurable in-process; RM261003ABZP-RF3 - `bun build --compile` embeds the native library, and cross-compiling needs every native package installed plus a libc define; RM261003ABZP-RF4 - image protocols are kitty → sixel → blocks, with no iTerm2 protocol.
  - **Evidence gaps:** OpenTUI performance on a 5,000-line live-preview document was not measured. The docs give no frame-time numbers, so this needs a spike. No published API-stability policy was found.

- **Editor core**
  - **Question:** Which text-buffer and undo models fit a TypeScript vim engine at the target note size, and how should vim scope be bounded?
  - **Requirements:** `RM261003ABZP-REQ2@R1`, `RM261003ABZP-REQ9@R1`, `RM261003ABZP-REQ11@R1`
  - **Searches:** VS Code text buffer blog post; Neovim `undo.txt`, `options.txt` (`ttimeoutlen`), and `message.txt` from the neovim repository; kitty keyboard protocol spec; OpenTUI EditBuffer docs; VSCodeVim `ROADMAP.md` via `gh api` and raw URL; codemirror-vim README.
  - **Findings:** RM261003ABZP-RF5 - the kitty keyboard protocol removes Esc ambiguity, and other terminals need a timeout fallback; RM261003ABZP-RF6 - a line array is adequate at 5,000 lines, and an undo block equals one typed command.
  - **Evidence gaps:** VSCodeVim's roadmap no longer exists (HTTP 404; the file was removed from the repository root). The codemirror-vim README gives no feature list. The vim scope comparison therefore rests on Neovim docs and agent knowledge, and is labeled as such. `neovim.io` was unreachable through WebFetch, so the same docs were read from `raw.githubusercontent.com/neovim/neovim`.

- **Markdown parsing and live preview**
  - **Question:** Which parsing approach supports fast live preview and HTML preview, and how does Obsidian's live preview actually reveal syntax?
  - **Requirements:** `RM261003ABZP-REQ5@R1`, `RM261003ABZP-REQ8@R1`, `RM261003ABZP-REQ9@R1`
  - **Searches:** micromark README; `@lezer/markdown` README; OpenTUI MarkdownRenderable and TreeSitterClient docs; Obsidian help source `Views and editing mode.md` and `Obsidian Flavored Markdown.md`; CommonMark spec index.
  - **Findings:** RM261003ABZP-RF7 - micromark is fully conformant but not incremental, Lezer is incremental with documented gaps, OpenTUI ships tree-sitter Markdown, and Obsidian reveals syntax per formatted element.
  - **Evidence gaps:** No benchmark compares full-document micromark reparse time against block-level reparse at 5,000 lines. The design stage should measure this.

- **Obsidian links**
  - **Question:** What are Obsidian's documented link formats, heading and block rules, and link resolution and rename rules?
  - **Requirements:** `RM261003ABZP-REQ4@R1`
  - **Searches:** `obsidianmd/obsidian-help` (`en/Linking notes and files/Internal links.md`, `en/User interface/Settings.md`, `en/Files and folders/Manage notes.md`) via `gh api`.
  - **Findings:** RM261003ABZP-RF8 - "shortest path when possible" is a link-generation setting, and resolution of duplicate names is undocumented.
  - **Evidence gaps:** Obsidian does not document how it resolves a basename shared by several files. Matching it exactly would need empirical testing against Obsidian.

- **Obsidian Bases**
  - **Question:** Which view types and syntax does the official Bases format define, and how do they compare with REQ7's "table and cards/board"?
  - **Requirements:** `RM261003ABZP-REQ7@R1`
  - **Searches:** `obsidianmd/obsidian-help` `en/Bases/` (syntax, Views, Functions, Layouts/Table, Cards, Kanban, List, Map) and commit dates; `obsidian-api` `obsidian.d.ts` grep for view ids; Alfred `packages/view-model/src/base/board.ts` and `packages/vault/src/domain/bases/parser.ts:118`.
  - **Findings:** RM261003ABZP-RF9 - Bases has five layouts, and "board" is the new Kanban layout, not Cards.
  - **Evidence gaps:** The YAML `type` value for a Kanban view is not documented in the help or in `obsidian.d.ts`. Verify it by creating a Kanban view in Obsidian 1.14 and reading the saved `.base` file.

- **Terminal graphics and input**
  - **Question:** Which image and keyboard protocols do the target terminals support, and what are the colour and restoration standards?
  - **Requirements:** `RM261003ABZP-REQ2@R1`, `RM261003ABZP-REQ5@R1`, `RM261003ABZP-REQ11@R1`
  - **Searches:** kitty graphics protocol and keyboard protocol docs; arewesixelyet.com; no-color.org; OpenTUI image, capabilities, and lifecycle docs.
  - **Findings:** RM261003ABZP-RF4 - kitty graphics and sixel cover every target terminal except Terminal.app and tmux; RM261003ABZP-RF5 - kitty keyboard is supported by Ghostty, iTerm2, WezTerm, and kitty, but not Terminal.app.
  - **Evidence gaps:** Terminal.app's lack of kitty keyboard support is inferred from its absence on kitty's adopter list. No Apple statement was found.

- **File safety**
  - **Question:** How should `so` save atomically, detect external changes, handle conflicts, and trash files on macOS and Linux?
  - **Requirements:** `RM261003ABZP-REQ1@R1`
  - **Searches:** POSIX `rename()` (IEEE Std 1003.1-2024); LWN "ext4 and data loss"; Node `fs.md` watch caveats (source docs); Bun file I/O docs; Neovim W11/W12 and `autoread`; freedesktop Trash spec; VS Code editing docs; local check for `/usr/bin/trash` on macOS 14.4.
  - **Findings:** RM261003ABZP-RF11 - save with temp + fsync + rename in the same directory, watch directories rather than files, make reload undoable, and use the freedesktop Trash on Linux.
  - **Evidence gaps:** The VS Code page did not describe save-conflict behavior (failed lookup). Bun docs say nothing on whether `Bun.write` is atomic or fsyncs, so assume it is neither. macOS 14.4 has no `/usr/bin/trash`. No official macOS trash CLI source was opened.

- **Daily notes and templates**
  - **Question:** What variables and format tokens do Obsidian's Templates and Daily notes plugins use?
  - **Requirements:** `RM261003ABZP-REQ6@R1`
  - **Searches:** `obsidianmd/obsidian-help` `en/Plugins/Templates.md` and `en/Plugins/Daily notes.md`; Moment.js project status.
  - **Findings:** RM261003ABZP-RF10 - `{{time:FORMAT}}` is missing from REQ6, formats are Moment.js tokens, and a `/` in the date format creates subfolders.
  - **Evidence gaps:** None

- **Preview server**
  - **Question:** Which live-reload transport and local-server protections suit a read-only preview?
  - **Requirements:** `RM261003ABZP-REQ8@R1`
  - **Searches:** Context7 `/websites/bun` (Bun.serve hostname/port, WebSocket pub/sub); MDN "Using server-sent events"; Vite `server.allowedHosts`; OWASP Path Traversal.
  - **Findings:** RM261003ABZP-RF12 - bind explicitly, check the Host header, contain paths by realpath, and use either SSE or WebSocket for one-way push.
  - **Evidence gaps:** None

- **Dev/CI speed and release**
  - **Question:** Which current tools meet the < 30 s local and < 3 min CI targets, and how should releases be produced?
  - **Requirements:** `RM261003ABZP-REQ10@R1`, `RM261003ABZP-REQ11@R1`
  - **Searches:** TypeScript 7.0 announcement; `npm view` for typescript, @biomejs/biome, @opentui/core, knip, dependency-cruiser, release-please; Bun releases; Biome `noRestrictedImports` docs; dependency-cruiser and knip issue searches for "typescript 7"; Bun Transpiler `scanImports`; Bun executables (targets, codesign); setup-bun README; release-please README; Conventional Commits 1.0.0.
  - **Findings:** RM261003ABZP-RF13 - TypeScript 7 native `tsc` is the fast typecheck but ships no API, so boundary and dead-code tools must not depend on that API; RM261003ABZP-RF14 - Conventional Commits plus release-please automate SemVer releases; RM261003ABZP-RF3 - release build recipe.
  - **Evidence gaps:** No measurements of `bun test`, Biome, or `tsc` timings were taken because no code exists yet. Their speed claims come from vendor sources. setup-bun does not document which directories it caches.

- **Configuration format**
  - **Question:** Is TOML at an XDG path the right config choice, and does Bun support it natively?
  - **Requirements:** `RM261003ABZP-REQ3@R1`, `RM261003ABZP-REQ11@R1`
  - **Searches:** XDG Base Directory spec 0.8; Context7 `/websites/bun` `Bun.TOML.parse`; Bun file-types docs; Helix configuration docs.
  - **Findings:** RM261003ABZP-RF15 - TOML through `Bun.TOML.parse` fits, relative XDG paths must be ignored, and state belongs in `$XDG_STATE_HOME`.
  - **Evidence gaps:** None

## Sources

- **S1 — OpenTUI documentation (Context7 `/anomalyco/opentui`)**
  - **Publisher:** anomalyco (OpenTUI maintainers)
  - **URL:** https://github.com/anomalyco/opentui/tree/main/packages/web/src/content/docs (pages: core-concepts/testing.mdx, core-concepts/rendering-pipeline.mdx, core-concepts/lifecycle.mdx, reference/standalone-executables.mdx, ship/deploy.mdx, components/image.mdx, extend/editing.mdx, components/markdown.mdx, reference/tree-sitter.mdx, test-and-debug/rendering-diagnostics.mdx, reference/terminal-capabilities.mdx)
  - **Published or updated:** Not stated (main branch, queried 2026-10-03)
  - **Version and scope:** `@opentui/core` 0.5.x docs
  - **Accessed:** 2026-10-03
  - **Supporting passage:** rendering-pipeline: "The native renderer compares current and next rows. It skips equal rows… An unchanged frame can emit no terminal bytes." standalone-executables: "Bun can embed OpenTUI's native library, parser worker, default grammars, and Tree-sitter WASM in `bun build --compile` executables." deploy: "The matching optional Core native package must exist on the build machine. Set `process.env.OPENTUI_LIBC`…" image: "`auto` | Global override, then Kitty, then Sixel, then Unicode blocks"; rendering-pipeline: "Automatic mode uses blocks under tmux." lifecycle: "The native shutdown sequence… exits the alternate screen, resets the terminal title and cursor style, and shows the cursor." testing: "`createTestRenderer()`… a real `CliRenderer` with in-memory output… `captureCharFrame()`." diagnostics: "`renderer.getStats()` with `gatherStats: true`… `frameTimes`." editing: EditBuffer "History | `undo`, `redo`… `debugLogRope` writes the native rope structure." markdown: "`conceal: true` to hide markdown markers."

- **S2 — OpenTUI repository and releases**
  - **Publisher:** anomalyco
  - **URL:** https://github.com/anomalyco/opentui ; https://github.com/anomalyco/opentui/releases
  - **Published or updated:** Repo created 2025-07-21; last push 2026-10-02; latest release v0.5.14 on 2026-09-30
  - **Version and scope:** MIT; ~105 releases in about 14 months; v0.5.0 (2026-08-03) "feat(core): add native image rendering"
  - **Accessed:** 2026-10-03
  - **Supporting passage:** README: "OpenCode uses OpenTUI in production for millions of users." Release list: 15 releases from v0.4.5 (2026-07-17) to v0.5.14 (2026-09-30).

- **S3 — Text Buffer Reimplementation**
  - **Publisher:** Microsoft (VS Code team)
  - **URL:** https://code.visualstudio.com/blogs/2018/03/23/text-buffer-reimplementation
  - **Published or updated:** 2018-03-23
  - **Version and scope:** VS Code 1.21 piece-tree design; applies to editor buffer choice
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "the line array used around 600MB memory to store the document"; piece tree "behaves in a stable fashion as each edit is just a string append and a couple red-black tree operations," while line arrays "start to choke when the file has many lines (100k+)."

- **S4 — Neovim runtime documentation (`undo.txt`, `message.txt`, `options.txt`)**
  - **Publisher:** Neovim project
  - **URL:** https://raw.githubusercontent.com/neovim/neovim/master/runtime/doc/undo.txt ; …/message.txt ; …/options.txt
  - **Published or updated:** Not stated (master, 2026-10-03)
  - **Version and scope:** Neovim nightly docs
  - **Accessed:** 2026-10-03
  - **Supporting passage:** undo-blocks: "One undo command normally undoes a typed command, no matter how many changes that command makes." W11: "Warning: File "{filename}" has changed since editing started… "OK"… "Load File"." `'autoread'` (default on): "When a file was changed outside of Nvim, automatically read it again… you can |undo| to see the previous contents." `'ttimeoutlen'` "(default 50) Time in milliseconds to wait for a key code sequence to complete."

- **S5 — kitty keyboard protocol**
  - **Publisher:** Kovid Goyal (kitty)
  - **URL:** https://sw.kovidgoyal.net/kitty/keyboard-protocol/
  - **Published or updated:** Not stated
  - **Version and scope:** Current spec; terminal adoption list
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "No reliable way to distinguish single `Esc` key presses from the start of a escape sequence. Currently, client programs use fragile timing related hacks for this." Adopters include "Alacritty, foot, ghostty, iTerm2, Microsoft Terminal, Rio, WezTerm, and xterm.js."

- **S6 — kitty terminal graphics protocol**
  - **Publisher:** Kovid Goyal (kitty)
  - **URL:** https://sw.kovidgoyal.net/kitty/graphics-protocol/
  - **Published or updated:** Not stated
  - **Version and scope:** Current spec
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "Other terminals that have implemented the graphics protocol: AbsoluteTelnet/SSH, Ghostty, Konsole, Mobile SSH, st (with a patch), Warp, wayst, WezTerm, iTerm2, xterm.js."

- **S7 — Are We Sixel Yet?**
  - **Publisher:** arewesixelyet.com (community tracker)
  - **URL:** https://www.arewesixelyet.com/
  - **Published or updated:** © 2026; no exact date
  - **Version and scope:** Sixel support per terminal
  - **Accessed:** 2026-10-03
  - **Supporting passage:** iTerm2 supported "since version 3.3.0"; WezTerm supported; kitty, Ghostty, Apple Terminal, and Alacritty not supported.

- **S8 — NO_COLOR**
  - **Publisher:** no-color.org
  - **URL:** https://no-color.org/
  - **Published or updated:** Not stated
  - **Version and scope:** Informal standard
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "should check for a `NO_COLOR` environment variable that, when present and not an empty string (regardless of its value), prevents the addition of ANSI color." "User-level configuration files and per-instance command-line arguments should override the `NO_COLOR` environment variable."

- **S9 — XDG Base Directory Specification**
  - **Publisher:** freedesktop.org
  - **URL:** https://specifications.freedesktop.org/basedir/latest/
  - **Published or updated:** Version 0.8
  - **Version and scope:** Config, state, and cache paths
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "If `$XDG_STATE_HOME` is either not set or empty, a default equal to `$HOME`/.local/state should be used"; state "should persist between (application) restarts." "All paths set in these environment variables must be absolute… consider the path invalid and ignore it."

- **S10 — freedesktop Trash Specification**
  - **Publisher:** freedesktop.org
  - **URL:** https://specifications.freedesktop.org/trash/latest/
  - **Published or updated:** Version 1.0, 2014-01-02
  - **Version and scope:** Linux desktop trash
  - **Accessed:** 2026-10-03
  - **Supporting passage:** Home trash is "`$XDG_DATA_HOME/Trash`" with `files/` and `info/`; `.trashinfo` holds `Path` and `DeletionDate`.

- **S11 — Obsidian Help: Bases (syntax, Views, Functions, Kanban, Cards)**
  - **Publisher:** Obsidian (obsidianmd/obsidian-help)
  - **URL:** https://help.obsidian.md/bases/syntax ; https://help.obsidian.md/bases/views ; https://help.obsidian.md/bases/views/kanban ; https://help.obsidian.md/bases/views/cards (source read from https://github.com/obsidianmd/obsidian-help/tree/master/en/Bases)
  - **Published or updated:** `Bases syntax.md` last commit 2026-03-26; `Kanban view.md` last commit 2026-09-04
  - **Version and scope:** Obsidian 1.9–1.14
  - **Accessed:** 2026-10-03
  - **Supporting passage:** Views: layouts "Table… 1.9 | Cards… 1.9 | List… 1.10 | Kanban… 1.14 | Map… Requires the Maps plugin… 1.10"; "Currently, Obsidian supports grouping by only one property." Kanban: "Requires Obsidian 1.14 which is currently in early access"; "Drag a card to another column to update the grouped property in that note"; "If you group by a formula or file property, you can't move cards." Cards: "a gallery-like grid layout with optional cover images." Syntax: "`type` selects from the built-in and plugin-added view types"; filters "may contain one of `and`, `or`, or `not`"; top-level `summaries`. Functions: `date.format()` "formatted as specified by a Moment.js format string."

- **S12 — Obsidian Help: links, settings, notes, editing modes, OFM**
  - **Publisher:** Obsidian (obsidianmd/obsidian-help)
  - **URL:** https://help.obsidian.md/links ; https://help.obsidian.md/settings ; https://help.obsidian.md/manage-notes ; https://help.obsidian.md/edit-and-read ; https://help.obsidian.md/obsidian-flavored-markdown (sources under https://github.com/obsidianmd/obsidian-help/tree/master/en)
  - **Published or updated:** Not stated per page (master, 2026-10-03)
  - **Version and scope:** Current Obsidian help
  - **Accessed:** 2026-10-03
  - **Supporting passage:** Internal links: "Folder paths start at the vault root"; Markdown format "make sure to URL encode the link destination"; "`[[Help and support#Questions and advice#Report bugs and request features]]`"; "Block identifiers can only consist of Latin letters, numbers, and dashes"; invalid link characters "`# | ^ : %% [[ ]]`". Settings, New link format: "**Shortest path when possible** — Uses the shortest unique path to the linked file." Manage notes: "When you rename a file, Obsidian automatically updates all the links to that file." Editing modes: Live Preview "hid[es] most Markdown syntax. When your cursor enters formatted content, the underlying syntax becomes visible." OFM table lists `%%Text%%` comments and `==Text==` highlights; "Obsidian supports CommonMark, GitHub Flavored Markdown, and LaTeX."

- **S13 — Obsidian Help: Templates and Daily notes plugins**
  - **Publisher:** Obsidian (obsidianmd/obsidian-help)
  - **URL:** https://help.obsidian.md/plugins/templates ; https://help.obsidian.md/plugins/daily-notes
  - **Published or updated:** Not stated
  - **Version and scope:** Core plugins
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "`{{title}}`… `{{date}}`… **Default format:** `YYYY-MM-DD`… `{{time}}`… **Default format:** `HH:mm`." "Both `{{date}}` and `{{time}}` allow you to change the default format… a colon (`:`) followed by a string of Moment.js format tokens." Daily notes: "if you set the date format as `YYYY/MMMM/YYYY-MMM-DD`, your notes will be created as `2023/January/2023-Jan-01`."

- **S14 — Moment.js project status**
  - **Publisher:** Moment.js
  - **URL:** https://momentjs.com/docs/#/-project-status/
  - **Published or updated:** Not stated
  - **Version and scope:** Library status
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "Moment.js is a legacy project in maintenance mode."

- **S15 — micromark README**
  - **Publisher:** unified collective
  - **URL:** https://github.com/micromark/micromark
  - **Published or updated:** Not stated
  - **Version and scope:** micromark 4.x
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "100% to CommonMark"; "100% GFM" via `micromark-extension-gfm`; tokens with "positional info." No incremental reparsing is mentioned.

- **S16 — @lezer/markdown README**
  - **Publisher:** Marijn Haverbeke (Lezer/CodeMirror)
  - **URL:** https://github.com/lezer-parser/markdown
  - **Published or updated:** Not stated
  - **Version and scope:** @lezer/markdown 1.x
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "an incremental Markdown parser"; "to be single-pass and incremental, it doesn't do some things that a conforming CommonMark parser is expected to do—specifically, it doesn't validate link references"; it "doesn't help with outputting HTML."

- **S17 — CommonMark Spec index**
  - **Publisher:** CommonMark
  - **URL:** https://spec.commonmark.org/
  - **Published or updated:** 0.31.2 on 2024-01-28
  - **Version and scope:** Latest spec
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "Latest version (0.31.2) (2024-01-28)."

- **S18 — POSIX `rename()`**
  - **Publisher:** The Open Group / IEEE
  - **URL:** https://pubs.opengroup.org/onlinepubs/9799919799/functions/rename.html
  - **Published or updated:** IEEE Std 1003.1-2024
  - **Version and scope:** POSIX.1-2024
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "a directory entry named *new* shall remain visible to other threads throughout the renaming operation and refer either to the file referred to by *new* or *old* before the operation began."

- **S19 — ext4 and data loss**
  - **Publisher:** LWN.net
  - **URL:** https://lwn.net/Articles/322823/
  - **Published or updated:** 2009-03-11
  - **Version and scope:** Linux filesystem durability
  - **Accessed:** 2026-10-03
  - **Supporting passage:** It describes ext4 delayed allocation producing zero-length files after crashes, and says applications can use `fsync()`/`fdatasync()` to ensure durability.

- **S20 — Node.js `fs.watch` caveats**
  - **Publisher:** Node.js project
  - **URL:** https://raw.githubusercontent.com/nodejs/node/main/doc/api/fs.md (rendered: https://nodejs.org/api/fs.html#caveats)
  - **Published or updated:** main branch (Node v26 docs)
  - **Version and scope:** `fs.watch`, which Bun implements for compatibility
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "On Linux and macOS systems, `fs.watch()` resolves the path to an inode and watches the inode. If the watched path is deleted and recreated, it is assigned a new inode… Events for the new inode will not be emitted."

- **S21 — Bun documentation (Context7 `/websites/bun`)**
  - **Publisher:** Oven (Bun)
  - **URL:** https://bun.com/docs/bundler/executables ; https://bun.com/docs/runtime/toml ; https://bun.com/docs/runtime/http/server ; https://bun.com/docs/runtime/http/websockets ; https://bun.com/docs/runtime/transpiler ; https://bun.com/docs/runtime/file-io
  - **Published or updated:** Not stated; latest Bun release v1.4.2 (2026-09-05)
  - **Version and scope:** Bun 1.4.x
  - **Accessed:** 2026-10-03
  - **Supporting passage:** Compile targets "bun-darwin-x64 | bun-darwin-arm64 | bun-linux-x64 | bun-linux-arm64 | …-musl"; "To codesign a standalone executable on macOS (which fixes Gatekeeper warnings)…". `Bun.TOML.parse`: "Supports the full TOML v1.1.0 specification and throws a SyntaxError on invalid input." Bun.serve: "hostname defaults to "0.0.0.0""; "Setting port to 0 makes Bun choose an available port." WebSocket "native publish-subscribe API… `server.publish()`." Transpiler: "`.scanImports()`… faster than `.scan()`… but marginally less accurate." File I/O: no statement on atomic writes or fsync.

- **S22 — MDN: Using server-sent events**
  - **Publisher:** Mozilla
  - **URL:** https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
  - **Published or updated:** 2026-09-03
  - **Version and scope:** Web platform
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "if the connection between the client and server closes, the connection is restarted." "When not used over HTTP/2, SSE suffers from a limitation to the maximum number of open connections… (6)." "This is a one-way connection."

- **S23 — Vite server options (`server.allowedHosts`)**
  - **Publisher:** Vite
  - **URL:** https://vite.dev/config/server-options
  - **Published or updated:** Not stated
  - **Version and scope:** Dev-server security precedent
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "Setting `server.allowedHosts` to `true` allows any website to send requests to your dev server through DNS rebinding attacks, allowing them to download your source code and content."

- **S24 — OWASP Path Traversal**
  - **Publisher:** OWASP Foundation
  - **URL:** https://community.owasp.org/attacks/Path_Traversal
  - **Published or updated:** Not stated
  - **Version and scope:** Web security guidance
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "Normalize the input before using in file io API's"; encoded variants "`%2e%2e%2f`… `..%2f`… `%252e%252e%255c`."

- **S25 — Announcing TypeScript 7.0**
  - **Publisher:** Microsoft TypeScript team
  - **URL:** https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - **Published or updated:** 2026-07-08; npm `latest` = 7.0.2 (checked 2026-10-03)
  - **Version and scope:** TypeScript 7.0 native compiler
  - **Accessed:** 2026-10-03
  - **Supporting passage:** Full builds 8x–12x faster (vscode 11.9x). "TypeScript 7.0 does not ship with an API. We expect TypeScript 7.1 to ship with a new (and different) API."

- **S26 — Biome `noRestrictedImports`**
  - **Publisher:** Biome
  - **URL:** https://biomejs.dev/linter/rules/no-restricted-imports/
  - **Published or updated:** Not stated; `@biomejs/biome` latest 2.5.15 (npm, 2026-10-03)
  - **Version and scope:** Biome 2.2+
  - **Accessed:** 2026-10-03
  - **Supporting passage:** `patterns` "allows you to specify multiple modules to restrict using gitignore-style patterns" (since 2.2.0). The page's examples use package specifiers only. Relative-path imports are not addressed.

- **S27 — Tool compatibility signals (npm and GitHub)**
  - **Publisher:** npm registry; GitHub issues
  - **URL:** https://www.npmjs.com/package/knip ; https://github.com/sverweij/dependency-cruiser/issues/1069
  - **Published or updated:** knip 6.39.0; issue opened 2026-07-07
  - **Version and scope:** Dead-code and boundary tools under TypeScript 7
  - **Accessed:** 2026-10-03
  - **Supporting passage:** knip dependencies include `oxc-parser` and `oxc-resolver`, not the TypeScript API. dependency-cruiser issue: "not-to-unresolvable false positives with tsx and typescript 7" (dependency-cruiser 18.0.0, TypeScript 7.0.1-rc).

- **S28 — release-please README and Conventional Commits 1.0.0**
  - **Publisher:** Google (googleapis); conventionalcommits.org
  - **URL:** https://github.com/googleapis/release-please ; https://www.conventionalcommits.org/en/v1.0.0/
  - **Published or updated:** release-please 17.11.2 (npm); Conventional Commits 1.0.0
  - **Version and scope:** Release automation
  - **Accessed:** 2026-10-03
  - **Supporting passage:** release-please "parses your git history, looking for Conventional Commit messages, and creating release PRs… When the Release PR is merged… Tags the commit… Creates a GitHub Release." Conventional Commits: "fix… PATCH… feat… MINOR… BREAKING CHANGE… MAJOR."

- **S29 — setup-bun README**
  - **Publisher:** Oven (oven-sh/setup-bun)
  - **URL:** https://github.com/oven-sh/setup-bun
  - **Published or updated:** Not stated
  - **Version and scope:** GitHub Actions
  - **Accessed:** 2026-10-03
  - **Supporting passage:** `bun-version-file` reads `package.json`, `.bun-version`, or `.tool-versions`; `no-cache` (default `false`) to "Disable caching of the downloaded executable."

- **S30 — Helix configuration**
  - **Publisher:** Helix editor
  - **URL:** https://docs.helix-editor.com/configuration.html
  - **Published or updated:** Not stated
  - **Version and scope:** Precedent for TOML editor config
  - **Accessed:** 2026-10-03
  - **Supporting passage:** "Linux and Mac: `~/.config/helix/config.toml`."

## Findings

- **RM261003ABZP-RF1 — OpenTUI is production-used but pre-1.0, so pin it and keep it behind the UI layer**
  - **Requirements:** `RM261003ABZP-REQ9@R1` - Fast and smooth performance targets; `RM261003ABZP-REQ10@R1` - Fast development, CI, and release; `RM261003ABZP-REQ11@R1` - Maintainable, standards-based foundations
  - **Conclusion:** OpenTUI is a reasonable renderer for `so`. It has a native Zig core, has shipped OpenCode to "millions of users", is MIT-licensed, and is actively developed (S2). It is still 0.x, though, and releases arrive every few days: 15 releases between 2026-07-17 and 2026-09-30, with features like native images landing in a minor release (v0.5.0). Maintenance cost stays bounded if `so` pins an exact version and confines OpenTUI imports to the UI layer.
  - **Explanation:**
    The pace of change is the main risk:

    ```text
    v0.4.5 (2026-07-17) → v0.5.0 (2026-08-03, native images) → … → v0.5.14 (2026-09-30)
    ```

    A caret range (`^0.5.0`) in 0.x semver allows only patch updates within 0.5, but every minor bump may break. Pinning `"@opentui/core": "0.5.14"` and upgrading deliberately keeps CI deterministic. REQ11's pure-core boundary already limits the damage. If only `ui/` imports `@opentui/*`, an API break touches one layer.
    Counterevidence: no API-stability policy was found, and a production user at scale (OpenCode) reduces but does not remove the risk of abandonment or breakage.

- **RM261003ABZP-RF2 — OpenTUI's native diff renderer and diagnostics make frame targets measurable in-process**
  - **Requirements:** `RM261003ABZP-REQ9@R1` - Fast and smooth performance targets; `RM261003ABZP-REQ10@R1` - Fast development, CI, and release
  - **Conclusion:** The 16 ms keypress→frame target can be measured and gated, but only as time-to-composed-frame inside the process. The terminal emulator's own display latency cannot be measured from inside `so`. OpenTUI double-buffers, diffs rows natively, and emits no bytes for unchanged frames. It exposes `getStats()` frame times, `TimeToFirstDrawRenderable`, and an in-memory `createTestRenderer()` with mock input (S1).
  - **Explanation:**
    A CI benchmark could drive input through the test renderer and read frame times (illustrative, not verified):

    ```ts
    const { renderer, mockInput, renderOnce } = await createTestRenderer({ width: 120, height: 40 })
    renderer.setGatherStats(true)
    // open 5,000-line fixture, then for 200 iterations:
    mockInput.pressKey("j"); await renderOnce()
    const p95 = percentile(renderer.getStats().frameTimes, 95)
    ```

    This measures the JavaScript pass plus native composition, which `so` controls. GitHub-hosted runners have variable CPU speed (agent knowledge), so an absolute-threshold gate needs margin. REQ9's 2× rule already provides it. Taking the median of several runs reduces flakiness further.
    Caveat: OpenTUI's docs warn that its statistics "use [different] unit[s]" and should not be compared directly, so the design must pick one metric per target.

- **RM261003ABZP-RF3 — `bun build --compile` embeds OpenTUI's native library, and cross-compiling needs every native package installed plus a libc define**
  - **Requirements:** `RM261003ABZP-REQ10@R1` - Fast development, CI, and release; None - macOS binary signing
  - **Conclusion:** This answers the roadmap context's packaging unknown. A single binary works without asset extraction (S1). One Linux runner can build all four REQ10 targets because Bun cross-compiles to `bun-darwin-{arm64,x64}` and `bun-linux-{x64,arm64}` (S21). It needs two conditions: every platform's optional native package must be installed (`bun install --os="*" --cpu="*"`), and `process.env.OPENTUI_LIBC` must be defined as `"glibc"` for Linux builds (S1). Unsigned macOS binaries trigger Gatekeeper warnings. Signing requires an Apple Developer identity (S21).
  - **Explanation:**

    ```text
    tag push → ubuntu runner → bun install --os="*" --cpu="*"
             → Bun.build compile × 4 targets (define OPENTUI_LIBC=glibc for linux)
             → sha256sums → GitHub Release
    ```

    Tradeoff: building everything on one runner is faster and cheaper than a macOS matrix, but nothing smoke-tests the macOS binary unless a macOS job runs it. A short `so --version` run on `macos-latest` would cover that (agent knowledge).

- **RM261003ABZP-RF4 — Kitty graphics and sixel cover every target terminal, so the iTerm2 inline-image protocol is unnecessary**
  - **Requirements:** `RM261003ABZP-REQ5@R1` - Obsidian-style live preview; `RM261003ABZP-REQ11@R1` - Maintainable, standards-based foundations
  - **Conclusion:** OpenTUI's `auto` image protocol tries kitty, then sixel, then Unicode quadrant blocks. It always keeps a block fallback and uses blocks under tmux (S1). iTerm2 now implements the kitty graphics protocol (S6) and sixel since 3.3.0 (S7). Ghostty and WezTerm implement kitty graphics, and Terminal.app supports neither (S6, S7). Requiring a separate iTerm2 inline-image (OSC 1337) path, as REQ5 does, would duplicate a protocol OpenTUI does not ship, for no gain in coverage.
  - **Explanation:**

    | Terminal | kitty graphics | sixel | OpenTUI `auto` result |
    |---|---|---|---|
    | kitty | ✅ | ❌ | kitty |
    | Ghostty | ✅ | ❌ | kitty |
    | WezTerm | ✅ | ✅ | kitty |
    | iTerm2 | ✅ | ✅ (3.3.0+) | kitty |
    | Terminal.app | ❌ | ❌ | Unicode blocks |
    | any, inside tmux | — | — | Unicode blocks |

    Caveat: capability replies arrive after startup, so the first frame may use blocks and then repaint (S1). REQ5's "half-block" fallback is really OpenTUI's quadrant "blocks", so the requirement should name the result rather than the technique.

- **RM261003ABZP-RF5 — The kitty keyboard protocol removes Esc ambiguity, and other terminals need a timeout fallback**
  - **Requirements:** `RM261003ABZP-REQ2@R1` - Vim-modal editing with a core command set; `RM261003ABZP-REQ11@R1` - Maintainable, standards-based foundations
  - **Conclusion:** A modal editor presses Esc constantly. Legacy terminal encoding cannot tell a lone Esc from the start of an escape sequence without "fragile timing related hacks" (S5). Ghostty, iTerm2, WezTerm, and kitty support the kitty keyboard protocol, and OpenTUI detects and uses it (S1, S5). Terminal.app is not on kitty's adopter list, so `so` needs a short Esc timeout there. Neovim uses `ttimeoutlen` with a default of 50 ms (S4).
  - **Explanation:**

    ```text
    kitty-protocol terminal:  Esc → CSI 27 u        → Normal mode immediately
    legacy terminal:          Esc → 0x1b … wait ≤ ttimeout → Normal mode
    ```

    REQ2 does not state Esc latency, yet this is the most visible "smoothness" property of a vim editor on legacy terminals. Adding a configurable timeout defaulting to 50 ms matches Neovim and keeps the behavior testable.

- **RM261003ABZP-RF6 — A line array is adequate for 5,000-line notes, and an undo block equals one typed command**
  - **Requirements:** `RM261003ABZP-REQ2@R1` - Vim-modal editing with a core command set; `RM261003ABZP-REQ9@R1` - Fast and smooth performance targets; `RM261003ABZP-REQ11@R1` - Maintainable, standards-based foundations
  - **Conclusion:** VS Code moved from a line array to a piece tree because of 13.7-million-line files and edits that "start to choke… (100k+)" lines (S3). REQ9's ceiling is 5,000 lines, two orders of magnitude below that, so a pure TypeScript line array or simple piece table is sufficient. Which one to use is a design choice, not a requirement. OpenTUI offers a native rope `EditBuffer` with undo/redo (S1). Making it the source of truth would put the text model inside the UI dependency and work against REQ11's pure core. It fits better as a render target. Vim's undo unit is "a typed command, no matter how many changes that command makes" (S4). One Insert session is one undo step, and REQ2's "per change" should say so.
  - **Explanation:**

    | Buffer | Fit at ≤ 5,000 lines | Purity (REQ11) | Cost |
    |---|---|---|---|
    | TS line array | ✅ (agent knowledge: O(lines) splice is microseconds at this size) | ✅ | Lowest |
    | TS piece table | ✅ | ✅ | More code |
    | OpenTUI EditBuffer (native rope) | ✅ | ❌ core depends on UI lib | Coupled to 0.x API |

    The timing claim for line arrays is agent knowledge and was not measured. The design spike in RF2 should confirm it.

- **RM261003ABZP-RF7 — micromark is fully conformant but not incremental, Lezer is incremental with gaps, OpenTUI ships tree-sitter Markdown, and Obsidian reveals syntax per element**
  - **Requirements:** `RM261003ABZP-REQ5@R1` - Obsidian-style live preview; `RM261003ABZP-REQ8@R1` - Read-only local browser preview; `RM261003ABZP-REQ9@R1` - Fast and smooth performance targets
  - **Conclusion:** The parser options trade conformance against incrementality:
    - micromark (which Alfred already uses) passes all CommonMark tests and offers 100% GFM, but documents no incremental mode (S15).
    - `@lezer/markdown`, which CodeMirror and therefore Obsidian use, is incremental but skips link-reference validation (S16).
    - OpenTUI bundles tree-sitter Markdown in a worker, plus a `MarkdownRenderable` with `conceal` (S1).

    Any of these meets REQ5/REQ9 if `so` reparses only the edited block. Markdown blocks are mostly separated by blank lines. Fenced code and lists need care (agent knowledge). The same parser output can feed the HTML preview (REQ8). Obsidian reveals syntax "when your cursor enters formatted content" (S12), which is per element. REQ5's cursor-line reveal is a simplification that suits a cell grid but should be stated as such. REQ5 also omits Obsidian `%%comments%%` (S12).
  - **Explanation:**

    ```text
    keystroke → edit line 2,400 → find enclosing block (blank-line bounded)
              → reparse that block only → splice into block list → re-layout visible rows
    ```

    Obsidian behavior compared with REQ5:

    | Element | Obsidian (S12) | REQ5@R1 |
    |---|---|---|
    | `**bold**` mid-line | reveals when cursor enters the span | reveals the whole cursor line |
    | Table, callout, code fence | reveals the block | unspecified for multi-line blocks |
    | `%%comment%%` | hidden in Live Preview (agent knowledge) | not listed |

    Revealing the whole block for multi-line constructs avoids half-rendered tables (agent knowledge). The tradeoff is more visual jump when the cursor enters a large block.

- **RM261003ABZP-RF8 — "Shortest path when possible" is a link-generation setting, and resolving duplicate names is undocumented**
  - **Requirements:** `RM261003ABZP-REQ4@R1` - Obsidian-compatible links, backlinks, tags, and rename
  - **Conclusion:** REQ4 says resolution follows Obsidian's "shortest-unique-path rule". In Obsidian's docs, "Shortest path when possible" is the format used when generating links (S12). For resolving links, the docs give these rules:
    - Folder paths start at the vault root.
    - `.md` is optional.
    - Markdown-link destinations are URL-encoded.
    - Headings can chain (`[[note#H1#H2]]`).
    - Block ids use only Latin letters, digits, and dashes.
    - Rename updates all links.

    How Obsidian picks a target when two files share a basename is not documented. `so` must define and test its own deterministic rule.
  - **Explanation:**

    ```text
    vault: a/plan.md, b/plan.md
    [[plan]]   → ambiguous → so rule (proposed): same folder as source → shortest path → alphabetical
    [[b/plan]] → b/plan.md (vault-root path)
    generate link to a/plan.md from anywhere → [[a/plan]] (shortest unique)
    ```

    The ambiguity rule above is an agent proposal, not Obsidian behavior. Matching Obsidian exactly would need empirical tests against Obsidian, which is outside "lean" unless users report mismatches.

- **RM261003ABZP-RF9 — Bases has five layouts, and "board" is Obsidian's new Kanban layout, not Cards**
  - **Requirements:** `RM261003ABZP-REQ7@R1` - Obsidian Bases table and board views
  - **Conclusion:** Official layouts are Table (1.9), Cards (1.9, a "gallery-like grid" with cover images), List (1.10), Kanban (1.14, early access, "cards organized into columns" by a grouped property), and Map (1.10, requires a plugin) (S11). REQ7's "`cards`/board" treats Cards as a board. Obsidian's board is Kanban. A Cards gallery adds little in a terminal because its value is cover images. Kanban's documented rules match REQ7's board criteria:
    - Moving a card updates the grouped property.
    - Grouping is by one property.
    - Cards cannot move when grouping by a formula or file property.
  - **Explanation:**

    | Layout | Obsidian version | Terminal value | Recommendation |
    |---|---|---|---|
    | table | 1.9 | High | Required |
    | kanban | 1.14 (early access) | High (REQ7 board) | Required |
    | list | 1.10 | Medium, cheap | Fallback rendering |
    | cards | 1.9 | Low (image gallery) | Fallback to table with notice |
    | map | 1.10 + plugin | None in terminal | Fallback to table with notice |

    Evidence gap: the YAML `type` string for Kanban is undocumented (S11; not in `obsidian.d.ts`). Alfred's board (`packages/view-model/src/base/board.ts`) is Alfred's own concept and predates Kanban. Its `type` value must be checked against a Kanban `.base` saved by Obsidian 1.14 before claiming compatibility.

- **RM261003ABZP-RF10 — REQ6 is missing `{{time:FORMAT}}`, formats use Moment.js tokens, and a `/` in the date format creates subfolders**
  - **Requirements:** `RM261003ABZP-REQ6@R1` - Daily notes and templates
  - **Conclusion:** Obsidian's Templates plugin defines `{{title}}`, `{{date}}` (default `YYYY-MM-DD`), and `{{time}}` (default `HH:mm`). Both `date` and `time` accept `:FORMAT` with Moment.js tokens (S13). REQ6 lists only `{{date:FORMAT}}`. Daily notes' date format may contain `/`, which produces subfolders such as `2023/January/2023-Jan-01` (S13). Bases' `date.format()` also uses Moment.js strings (S11). Moment.js is in maintenance mode (S14). A small token formatter shared by templates, daily notes, and Bases avoids adding Moment as a dependency.
  - **Explanation:**

    ```text
    template: "# {{date:dddd, MMMM D}} — {{time:HH:mm}}"
    2026-10-03 09:05 → "# Saturday, October 3 — 09:05"
    daily format "YYYY/MM/YYYY-MM-DD" → daily/2026/10/2026-10-03.md
    ```

    Tradeoff: a token subset is lean but may diverge on rare tokens such as locale-specific or ISO week tokens. Leaving unknown tokens literal and documenting the subset keeps the behavior predictable.

- **RM261003ABZP-RF11 — Save with temp + fsync + rename in the same directory, watch directories rather than files, and make reload undoable**
  - **Requirements:** `RM261003ABZP-REQ1@R1` - Folder workspace and safe file management
  - **Conclusion:** REQ1's "temp file + rename" needs three precise conditions:
    - **Same directory as the target.** POSIX `rename` keeps the new name visible as either the old or new file throughout (S18), but only within one filesystem.
    - **fsync before rename.** ext4 delayed allocation can otherwise leave zero-length files after a crash (S19).
    - **Explicit atomic write in code.** Bun docs make no atomicity or fsync claim for `Bun.write` (S21).

    External-change detection must watch the parent directory. `fs.watch` on a file follows the inode, and any atomic save, including `so`'s own, replaces that inode, so events stop (S20). `so` must also ignore events caused by its own writes. Neovim's model gives the UX pattern: reload silently when unmodified, keeping the previous text undoable; warn with OK or Load File when both sides changed (W11/W12, `autoread`) (S4). On Linux, "OS trash" has a standard, the freedesktop Trash spec (S10). macOS 14.4 has no `trash` CLI (local check), so macOS trash needs Finder automation or the typed-confirmation fallback REQ1 already defines.
  - **Explanation:**

    ```text
    save(note):
      write  dir/.note.md.so-tmp-<pid>   (copy mode bits of note.md)
      fsync  tmp → rename tmp → note.md → record (mtime, size, hash) as "own write"
    watcher(dir) event → stat note.md → matches own write? ignore
                                       → differs & buffer clean → reload (undoable)
                                       → differs & buffer dirty → conflict prompt
    ```

    Caveat: rename-based saves replace hard links and change ownership in some cases (agent knowledge; Vim's `backupcopy` exists for this). For a plain notes folder this is acceptable, but writing through symlinks should resolve the link target first.

- **RM261003ABZP-RF12 — Bind explicitly, check the Host header, contain paths by realpath, and push updates with SSE or WebSocket**
  - **Requirements:** `RM261003ABZP-REQ8@R1` - Read-only local browser preview
  - **Conclusion:** Bun.serve's `hostname` defaults to `"0.0.0.0"` (S21), so REQ8's `127.0.0.1` binding must be set explicitly, and a test should cover it. Loopback binding alone does not stop DNS rebinding: a malicious page can resolve its own domain to 127.0.0.1 and read served notes. Vite blocks this with a Host allowlist (S23). Path containment must normalize decoded and double-encoded `../` (S24). It must also resolve symlinks, which is agent knowledge, so a symlink inside the workspace cannot expose files outside it. For live updates, SSE is one-way with automatic reconnect (S22), which matches a read-only preview. Bun also has native WebSocket pub/sub (S21). SSE's six-connection limit on HTTP/1.1 (S22) only matters with more than six preview tabs. Either transport meets the 300 ms target, so the choice belongs to design.
  - **Explanation:**

    ```text
    request → Host ∈ {127.0.0.1:<port>, localhost:<port>}? else 403
            → decode path → resolve(root, path) → realpath → startsWith(realpath(root)+sep)? else 404
            → hidden (.git, .obsidian) or excluded? 404 → serve
    ```

- **RM261003ABZP-RF13 — TypeScript 7's native `tsc` is the fast typecheck, but it ships no API, so other tools must not depend on that API**
  - **Requirements:** `RM261003ABZP-REQ10@R1` - Fast development, CI, and release; `RM261003ABZP-REQ11@R1` - Maintainable, standards-based foundations
  - **Conclusion:** TypeScript 7.0 (2026-07-08; npm `latest` 7.0.2) builds 8–12× faster than 6.0 but "does not ship with an API" until 7.1 (S25). This makes REQ10's < 30 s check realistic with `tsc --noEmit`. It also rules out tools that load the TypeScript compiler API, such as typescript-eslint, and creates risk for dependency-cruiser's TypeScript path: a TS 7 false-positive issue was reported against 18.0.0 (S27). Tools that do not use the TypeScript API include:
    - Biome 2.5 (format and lint), whose `noRestrictedImports` `patterns` exist since 2.2 but whose docs do not show relative-path matching (S26);
    - knip for dead code, which uses `oxc-parser` (S27);
    - a ~30-line boundary test using `Bun.Transpiler.scanImports` (S21).
  - **Explanation:**

    | Check | Candidate | Depends on TS API | Note |
    |---|---|---|---|
    | Format + lint | Biome 2.5 | No | One binary |
    | Typecheck | `tsc` 7 (native) | — | 8–12× faster |
    | Dead code | knip 6 | No (oxc) | |
    | Boundaries | Biome `noRestrictedImports` + overrides, or `bun test` scanning imports | No | Relative-path matching in Biome unverified |
    | Boundaries | dependency-cruiser 18 | Partly | TS 7 issue reported |

    Speed figures are vendor claims for large codebases. `so`'s check time is unmeasured until code exists.

- **RM261003ABZP-RF14 — Conventional Commits and release-please automate SemVer releases that the compile step then publishes**
  - **Requirements:** `RM261003ABZP-REQ10@R1` - Fast development, CI, and release; `RM261003ABZP-REQ11@R1` - Maintainable, standards-based foundations
  - **Conclusion:** Conventional Commits map `fix`→PATCH, `feat`→MINOR, and breaking→MAJOR (S28). release-please turns those commits into a maintained release PR. Merging that PR tags the commit and creates the GitHub Release (S28). This satisfies REQ11's Conventional Commits and SemVer standards without manual version edits. The `v*` tag trigger in REQ10 still works: release-please creates the tag, and the binary job either runs on it or on release-please's `release_created` output (agent knowledge).
  - **Explanation:**

    ```text
    feat: commits → release-please PR (CHANGELOG, version) → merge → tag v0.2.0 + GitHub Release
                                                                  → compile job uploads 4 binaries + sha256sums
    ```

    Tradeoff: release-please adds one workflow file and a bot PR. Plain manual tagging is simpler but leaves the changelog and version bump manual.

- **RM261003ABZP-RF15 — TOML through `Bun.TOML.parse` fits, relative XDG paths must be ignored, and state belongs in `$XDG_STATE_HOME`**
  - **Requirements:** `RM261003ABZP-REQ3@R1` - LazyVim-style navigation, commands, and configuration; `RM261003ABZP-REQ11@R1` - Maintainable, standards-based foundations; None - persistent state location
  - **Conclusion:** TOML is a sound choice:
    - Bun parses TOML 1.1 natively and throws `SyntaxError` on invalid input (S21), which supports REQ3's "clear error and fall back".
    - Editors such as Helix use `~/.config/<app>/config.toml` (S30).
    - A TypeScript config would execute user code, which is agent knowledge, and is unnecessary for options and keymaps.

    XDG 0.8 requires ignoring relative values of `$XDG_CONFIG_HOME` (S9). REQ3's recent-notes picker and REQ4's jump history need persistence across restarts. XDG defines `$XDG_STATE_HOME` (default `~/.local/state`) for exactly this (S9). No requirement names a location, and the user excluded a vault, so state must not be written into the notes folder. `NO_COLOR` has a precise rule: non-empty disables colour, and user config overrides it (S8). REQ11 should cite CommonMark 0.31.2 (S17).
  - **Explanation:**

    ```toml
    # ~/.config/so/config.toml (illustrative)
    leader = " "
    [daily]
    folder = "daily"
    format = "YYYY-MM-DD"
    [keys.normal]
    "<leader>w" = "write"
    ```

    State: `~/.local/state/so/<workspace-hash>/recent.json`. This keeps the notes folder free of `so` files. The tradeoff is that state does not travel with the folder.

## Requirement Assessment

- **RM261003ABZP-REQ1@R1 — Folder workspace and safe file management**
  - **Assessment:** The outcome, scope, and testability are good. The safety criteria are under-specified. "Temp file + rename" without fsync or a same-directory temp can still lose data. External-change detection as worded may be implemented with per-file watches that silently stop after the first atomic save. "OS trash when available" has a standard on Linux but no simple CLI on macOS 14.
  - **Recommendation:** Modify
  - **Rationale:** Data safety is the requirement's stated "first duty". The research shows concrete failure modes that the current criteria would let pass.
  - **Proposed requirement:** Unchanged
  - **Acceptance criteria impact:**
    - Replace the atomic-write criterion with: "Saves write a temporary file in the same directory, fsync it, preserve the original file's permission bits, then rename it over the target (resolving symlinks to their target first). A crash at any point leaves the complete old or the complete new file."
    - Replace the external-change criterion with: "External changes are detected by watching directories, not file inodes, and events caused by `so`'s own saves are ignored. When an open, unmodified buffer changes on disk, it reloads and the reload can be undone. When the buffer also has unsaved edits, a conflict prompt offers keep mine, take disk, or view diff, and nothing is overwritten silently."
    - Refine the delete criterion: "On Linux, delete moves the item to the freedesktop home trash (`$XDG_DATA_HOME/Trash`). On macOS, it moves the item to the user's Trash when the system allows it. Otherwise, deletion requires a typed confirmation."
  - **Benefit and tradeoff:** This closes crash and missed-reload holes and makes them testable, for example by simulating rename-replace in a test. The cost is a small amount of extra I/O code and an fsync of about a millisecond per save (agent knowledge).
  - **Finding impacts:**
    - `RM261003ABZP-RF11` - Challenges - The current atomic-write and reload criteria allow known failure modes. Adds the trash standard and Neovim's undoable-reload pattern.
  - **Reconciliation question:** None

- **RM261003ABZP-REQ2@R1 — Vim-modal editing with a core command set**
  - **Assessment:** The command scope is well bounded (macros, Visual block, and ranges are deferred) and testable. Two smoothness-critical behaviors are missing: Esc latency on legacy terminals, and what "per change" means for undo. The buffer model correctly stays out of the requirement.
  - **Recommendation:** Modify
  - **Rationale:** Esc handling and undo granularity are user-visible and differ between implementations. Stating them prevents a correct-looking engine that feels wrong.
  - **Proposed requirement:** Unchanged
  - **Acceptance criteria impact:**
    - Replace "Undo and redo (`u`, `Ctrl-r`) per change" with "Undo and redo (`u`, `Ctrl-r`) per vim undo block: one Normal-mode command, or one Insert-mode session from entry to `Esc`, is one undo step."
    - Add: "`Esc` switches to Normal mode immediately on terminals with the kitty keyboard protocol. On other terminals, it does so after a configurable escape timeout (default 50 ms)."
  - **Benefit and tradeoff:** This matches Neovim behavior that users expect (S4, S5). The cost is one more config option.
  - **Finding impacts:**
    - `RM261003ABZP-RF5` - Adds consideration - Esc ambiguity on legacy terminals needs a stated timeout.
    - `RM261003ABZP-RF6` - Supports - The core scope is feasible with a simple TS buffer at ≤ 5,000 lines. Adds the undo-block definition.
  - **Reconciliation question:** None

- **RM261003ABZP-REQ3@R1 — LazyVim-style navigation, commands, and configuration**
  - **Assessment:** Clear and testable. The TOML-at-XDG choice is confirmed by Bun's native parser and editor precedent. Two gaps: the spec rule for relative XDG paths, and where the "recent notes" picker's history persists.
  - **Recommendation:** Modify
  - **Rationale:** These are small edits that align the requirement with the XDG standard it cites and make "recent notes" implementable without writing into the user's folder.
  - **Proposed requirement:** Unchanged
  - **Acceptance criteria impact:**
    - Amend the configuration criterion: "Configuration lives at `$XDG_CONFIG_HOME/so/config.toml`. `~/.config/so/config.toml` is used when the variable is unset, empty, or a relative path. Invalid TOML or unknown keys show a clear error naming the file and line, and `so` falls back to defaults without crashing."
    - Add: "Recent notes and jump history persist per workspace under `$XDG_STATE_HOME/so/` (default `~/.local/state/so/`). `so` writes no files into the workspace other than the user's notes."
  - **Benefit and tradeoff:** Standards compliance, and the notes folder stays clean. The tradeoff is that state does not travel with the folder.
  - **Finding impacts:**
    - `RM261003ABZP-RF15` - Supports - TOML and XDG fit. Adds the relative-path rule and the state location.
  - **Reconciliation question:** None

- **RM261003ABZP-REQ4@R1 — Obsidian-compatible links, backlinks, tags, and rename**
  - **Assessment:** Good coverage of Obsidian syntax. "Link resolution follows Obsidian's shortest-unique-path rule" misstates Obsidian, where that is the link-generation format. Resolution of duplicate basenames is undocumented, so as written the criterion cannot be tested. Multi-level heading links and Markdown-link URL encoding are missing.
  - **Recommendation:** Modify
  - **Rationale:** Compatibility claims must be testable against documented behavior. Where Obsidian is silent, `so` must state its own deterministic rule.
  - **Proposed requirement:** Unchanged
  - **Acceptance criteria impact:**
    - Replace the resolution criterion with: "Links resolve by a vault-root path (`[[folder/note]]`), by bare name, or by name with `.md`. Markdown-link destinations are URL-decoded. When a bare name matches several files, `so` picks deterministically: same folder as the source, then shortest path, then alphabetical. The rule is documented and tested. Aliases resolve."
    - Add to recognized syntax: "chained heading links `[[note#H1#H2]]`; block ids of Latin letters, digits, and dashes."
    - Amend the rename criterion: "Renaming or moving a note updates all links and embeds to it, including frontmatter links. It preserves each link's format (wikilink or Markdown), alias, and heading or block subpath, and writes new paths in the shortest unique form. It reports the count of changed files."
  - **Benefit and tradeoff:** Testable and honest about compatibility. The tradeoff is that duplicate-name resolution may differ from Obsidian in edge cases.
  - **Finding impacts:**
    - `RM261003ABZP-RF8` - Challenges - Corrects the resolution claim and adds documented syntax and rename details.
  - **Reconciliation question:** None

- **RM261003ABZP-REQ5@R1 — Obsidian-style live preview**
  - **Assessment:** The outcome is right and the element list is mostly complete. Three issues:
    - The graphics criterion names an iTerm2 protocol that is unnecessary, because iTerm2 supports kitty graphics and sixel, and that OpenTUI does not ship.
    - Line-based reveal is a deliberate deviation from Obsidian's per-element reveal, and it is unspecified for multi-line blocks.
    - `%%comments%%` are missing.
  - **Recommendation:** Modify
  - **Rationale:** Aligning with OpenTUI's protocol pipeline removes a redundant code path. Stating block reveal and comments makes the behavior testable.
  - **Proposed requirement:** "By default, notes render in live preview. Markdown syntax is hidden and rendered except where the cursor or selection is. There, inline syntax is shown on the cursor line, and multi-line blocks (tables, callouts, fenced code, math blocks, frontmatter) show their full source while the cursor is inside them. Users toggle to source mode and to a read-only reading mode."
  - **Acceptance criteria impact:**
    - Replace the image criterion with: "Images render inline using the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel. Otherwise they use Unicode-block rendering, including Terminal.app and tmux, or a text placeholder when graphics are disabled."
    - Add `%%comments%%` (hidden) to the rendered-elements list.
    - Replace "The line or selection under the cursor shows its raw source" with "The cursor line shows its raw inline syntax, and a multi-line block shows its full source while the cursor is inside it. Moving away re-renders it."
  - **Benefit and tradeoff:** Less code and clearer tests. The tradeoff is that block reveal causes a larger visual shift than Obsidian's per-span reveal.
  - **Finding impacts:**
    - `RM261003ABZP-RF4` - Challenges - The iTerm2 protocol is unnecessary. The fallback is Unicode blocks, also used under tmux.
    - `RM261003ABZP-RF7` - Adds consideration - Obsidian reveals per element. Multi-line blocks and comments need stating. Block-level reparse supports the performance target.
  - **Reconciliation question:** None

- **RM261003ABZP-REQ6@R1 — Daily notes and templates**
  - **Assessment:** Matches Obsidian's workflows, but the variable list is incomplete (`{{time:FORMAT}}`). "Matching Obsidian" implies full Moment.js parity without saying so. Subfolder date formats are a documented Obsidian behavior that the requirement omits.
  - **Recommendation:** Modify
  - **Rationale:** The requirement claims Obsidian compatibility, so it should include the documented variables and state the token subset to keep scope lean.
  - **Proposed requirement:** Unchanged
  - **Acceptance criteria impact:**
    - Replace the variables criterion with: "Template variables `{{title}}`, `{{date}}` (default `YYYY-MM-DD`), `{{time}}` (default `HH:mm`), `{{date:FORMAT}}`, and `{{time:FORMAT}}` expand on insert. FORMAT supports the Moment.js tokens `YYYY YY M MM MMM MMMM D DD Do d ddd dddd H HH h hh m mm s ss A a` and `[literal]` escapes. Unsupported tokens stay literal."
    - Add: "A daily date format containing `/` creates subfolders (for example `YYYY/MM/YYYY-MM-DD` → `daily/2026/10/2026-10-03.md`)."
  - **Benefit and tradeoff:** Documented compatibility without a Moment dependency. The tradeoff is possible divergence on rare tokens.
  - **Finding impacts:**
    - `RM261003ABZP-RF10` - Challenges - Adds the missing variable, the token subset, and subfolder formats.
  - **Reconciliation question:** None

- **RM261003ABZP-REQ7@R1 — Obsidian Bases table and board views**
  - **Assessment:** The core is sound and Alfred's engine reduces cost. The view naming is wrong: Obsidian's board is the `Kanban` layout (1.14, early access), while `cards` is an image gallery. Behavior for the other official layouts (cards, list, map) is unspecified. Kanban's documented card-move restrictions are missing.
  - **Recommendation:** Modify
  - **Rationale:** Compatibility depends on matching Obsidian's actual view types. Kanban is now official, so "board" should mean Kanban.
  - **Proposed requirement:** "Opening a `.base` file shows its views as a table or Kanban board over notes selected by its filters. Users sort, filter, and edit properties in place, and `![[file.base]]` embeds render in notes."
  - **Acceptance criteria impact:**
    - Replace the parsing criterion with: "`.base` YAML with `filters` (`and`/`or`/`not`), `formulas`, `properties`, `summaries`, and `views` is parsed and evaluated with Alfred's expression subset. Unsupported syntax shows a diagnostic instead of failing. View types `table` and Kanban are rendered. Other types (`cards`, `list`, `map`, plugin types) open as a table with a notice."
    - Replace the board criterion with: "Kanban view: cards in columns by the view's single group-by property. Moving a card between columns updates that property in the note. Moving is disabled when grouping by a formula or file property. Notes without the property appear in a `None` column."
    - Add a verification note: "The Kanban `type` value is confirmed against a `.base` file saved by Obsidian 1.14 or later."
  - **Benefit and tradeoff:** Real Obsidian compatibility and defined fallbacks. The tradeoff is depending on an early-access Obsidian layout whose format may still change.
  - **Finding impacts:**
    - `RM261003ABZP-RF9` - Challenges - Board corresponds to Kanban, not Cards. Adds fallback behavior and documented move rules. The Kanban YAML type is unverified.
  - **Reconciliation question:** Should v1 target Obsidian's early-access Kanban layout (Recommended: yes, it is the official board and matches the user's "board" scope), or limit board support to `table` with `groupBy` until Kanban reaches public release?

- **RM261003ABZP-REQ8@R1 — Read-only local browser preview**
  - **Assessment:** Clear and testable. It misses two standard local-server protections: DNS rebinding (Host check) and symlink escape. Bun's `0.0.0.0` default makes the explicit binding criterion more important. The live-update transport is correctly left to design.
  - **Recommendation:** Modify
  - **Rationale:** A local server that serves personal notes must resist DNS rebinding and symlink traversal. These are low-cost checks with established precedent (Vite, OWASP).
  - **Proposed requirement:** Unchanged
  - **Acceptance criteria impact:**
    - Amend the server criterion: "`:Preview` starts a server explicitly bound to `127.0.0.1` on a free port (port 0) and rejects requests whose `Host` header is not `127.0.0.1:<port>` or `localhost:<port>`."
    - Replace the path criterion with: "Only files whose resolved real path lies inside the workspace, and outside hidden or excluded folders, are served. Path traversal, including percent-encoded and symlinked escapes, returns 404."
  - **Benefit and tradeoff:** This closes known attack paths for a few lines of code. No user-visible cost.
  - **Finding impacts:**
    - `RM261003ABZP-RF7` - Supports - One parse feeds both terminal and HTML rendering, keeping the syntax coverage consistent.
    - `RM261003ABZP-RF12` - Challenges - Adds the Host check, explicit binding, and realpath containment. Either SSE or WebSocket meets 300 ms.
  - **Reconciliation question:** None

- **RM261003ABZP-REQ9@R1 — Fast and smooth performance targets**
  - **Assessment:** The targets are concrete, but some cannot be reproduced or measured as written. "A 2021-or-newer laptop" is not a reference machine. "Keypress to rendered frame" includes terminal display latency that `so` cannot observe. CI runners are not laptops, so the CI gate needs its own baseline. OpenTUI's stats and test renderer make in-process measurement feasible.
  - **Recommendation:** Modify
  - **Rationale:** A target is useful only if it is measured the same way everywhere. Defining the metric and the reference machine prevents disputes and flaky CI.
  - **Proposed requirement:** "`so` meets the performance targets below on the reference machine (Apple M1 or newer, 8 GB RAM, macOS), measured in-process from input event to composed frame."
  - **Acceptance criteria impact:**
    - Replace the first criterion with: "Keypress to composed frame (input event received → OpenTUI frame complete): p95 < 16 ms over 200 keystrokes while editing a 5,000-line fixture note in live preview."
    - Replace the CI criterion with: "Benchmarks for these targets run in CI on a fixed runner type through the OpenTUI test renderer. The median of 5 runs fails the build when it exceeds 2× the target."
    - Other targets: Unchanged.
  - **Benefit and tradeoff:** Reproducible and gateable. The tradeoff is that terminal-emulator latency is excluded from the guarantee.
  - **Finding impacts:**
    - `RM261003ABZP-RF1` - Adds consideration - OpenTUI version pinning keeps benchmark baselines stable.
    - `RM261003ABZP-RF2` - Supports - In-process measurement is feasible. Adds metric precision and CI noise handling.
    - `RM261003ABZP-RF6` - Supports - The 5,000-line target is within line-array capability (agent knowledge; to be measured).
    - `RM261003ABZP-RF7` - Supports - Block-level reparse is the established route to per-keystroke budgets.
  - **Reconciliation question:** None

- **RM261003ABZP-REQ10@R1 — Fast development, CI, and release**
  - **Assessment:** The targets are realistic with TypeScript 7's native `tsc`, Biome, knip, and `bun test`, although no timing has been measured. The release criterion is feasible from one Linux runner, but only with OpenTUI's documented recipe. Three things are unspecified: integrity checksums, macOS signing status, and how the tag is produced, which matters for Conventional Commits and SemVer.
  - **Recommendation:** Modify
  - **Rationale:** The release path has a non-obvious prerequisite (installing all native packages and defining the libc). Without it, binaries build but fail at runtime on other platforms.
  - **Proposed requirement:** Unchanged
  - **Acceptance criteria impact:**
    - Amend the check criterion: "`bun run check` runs Biome format and lint, TypeScript `tsc --noEmit`, dead-code detection, boundary checks, and unit tests in < 30 s. No check depends on the TypeScript compiler's JavaScript API."
    - Replace the release criterion with: "A release tag (created by release-please from Conventional Commits, or pushed manually as `v*`) cross-compiles macOS (arm64, x64) and Linux glibc (x64, arm64) binaries with `bun build --compile` after installing all OpenTUI native packages. It publishes them with a SHA-256 checksum file to the GitHub Release, and a smoke test runs `so --version` on macOS and Linux runners."
    - Add: "`@opentui/core` is pinned to an exact version and upgraded deliberately."
  - **Benefit and tradeoff:** Deterministic, verifiable releases. The cost is one release-please workflow and a short macOS smoke job.
  - **Finding impacts:**
    - `RM261003ABZP-RF1` - Adds consideration - Pin OpenTUI exactly.
    - `RM261003ABZP-RF2` - Supports - The test renderer enables fast headless UI tests in `bun test`.
    - `RM261003ABZP-RF3` - Supports - Single-binary packaging works. Adds the cross-compile recipe and the signing gap.
    - `RM261003ABZP-RF13` - Supports - TS 7, Biome, and knip fit < 30 s. Adds the no-TS-API constraint.
    - `RM261003ABZP-RF14` - Adds consideration - release-please automates tag and changelog creation.
  - **Reconciliation question:** None

- **RM261003ABZP-REQ11@R1 — Maintainable, standards-based foundations**
  - **Assessment:** Strong and aligned with the user's criteria. Corrections needed:
    - The CommonMark version is imprecise; it should be 0.31.2.
    - `NO_COLOR` semantics are not stated.
    - The graphics-terminal sentence should follow RF4 (kitty or sixel, then Unicode blocks, including tmux).
    - The boundary tooling must avoid TypeScript-API-dependent tools.
    - Containing OpenTUI to the UI layer is the main maintainability lever and should be explicit.
  - **Recommendation:** Modify
  - **Rationale:** Precise standard references and an explicit OpenTUI containment rule turn general intent into checkable criteria.
  - **Proposed requirement:** Unchanged
  - **Acceptance criteria impact:**
    - Amend the boundary criterion: "Layer boundaries fail CI when violated: core imports no I/O, UI, or runtime APIs, and only the UI layer imports `@opentui/*`."
    - Amend the standards criterion: "CommonMark 0.31.2 + GFM, Obsidian Flavored Markdown, XDG Base Directory 0.8, `NO_COLOR` (a non-empty value disables colour unless config re-enables it), Conventional Commits 1.0.0, Semantic Versioning 2.0.0, strict TypeScript ESM."
    - Amend the platform criterion: "Supported platforms are macOS and Linux. Terminals with the kitty graphics protocol (kitty, Ghostty, WezTerm, iTerm2) or sixel get full graphics. Others, including Terminal.app and tmux sessions, get Unicode-block images. Terminals with the kitty keyboard protocol get unambiguous key input."
  - **Benefit and tradeoff:** Testable standards and a bounded blast radius for OpenTUI changes. The cost is a boundary rule to maintain.
  - **Finding impacts:**
    - `RM261003ABZP-RF1` - Supports - The OpenTUI containment rule limits pre-1.0 churn.
    - `RM261003ABZP-RF4` - Challenges - Corrects the graphics-terminal statement.
    - `RM261003ABZP-RF5` - Adds consideration - Keyboard protocol support belongs in the terminal support statement.
    - `RM261003ABZP-RF6` - Supports - A pure TS text model keeps the core free of UI dependencies.
    - `RM261003ABZP-RF13` - Adds consideration - Boundary and dead-code tools must not require the TS 7 API.
    - `RM261003ABZP-RF14` - Supports - Conventional Commits and SemVer are automatable with release-please.
    - `RM261003ABZP-RF15` - Adds consideration - Exact XDG, `NO_COLOR`, and CommonMark versions.
  - **Reconciliation question:** None

## Uncovered Needs

- **Persistent per-user state outside the workspace**
  - **Evaluated requirement:** None
  - **Finding impacts:**
    - `RM261003ABZP-RF15` - The recent-notes picker (REQ3) and jump history (REQ4) need state that survives restarts. XDG defines `$XDG_STATE_HOME` for it, and no requirement names a location.
  - **Recommendation:** Fold into REQ3 as the added criterion in its assessment rather than creating a new requirement.
  - **Rationale and tradeoff:** This prevents `so` from writing hidden files into the user's notes folder, which would conflict with "no vault", at the cost of one acceptance criterion. State does not move with the folder.
  - **Reconciliation question:** Accept storing recent notes and jump history under `$XDG_STATE_HOME/so/` (Recommended), or keep no persistence in v1 and drop "recent notes" from the picker list?

- **macOS binary signing and notarization**
  - **Evaluated requirement:** None
  - **Finding impacts:**
    - `RM261003ABZP-RF3` - Unsigned macOS binaries trigger Gatekeeper warnings. Bun supports `codesign`, but notarization needs an Apple Developer identity.
  - **Recommendation:** Do not expand v1 scope. Publish unsigned binaries with SHA-256 checksums and document the first-run step. Record signing and notarization as a deferred consideration, triggered by distribution beyond the author.
  - **Rationale and tradeoff:** Signing adds a paid account, secrets in CI, and notarization latency, all contrary to "lean" and "fast CD". The cost is first-run friction for macOS users who download through a browser.
  - **Reconciliation question:** Defer macOS signing and notarization to after v1 (Recommended), or require signed and notarized macOS binaries in v1?

## Blockers

None
