# RM261003ABZP: so v1 — Roadmap Context

- **Document**
  - Revision: `R2`
  - Status: Ready for Clarification
  - History: `rm261003abzp-roadmap-context-revisions.md`
  - Blockers: None

## Sources

- **Project Guidance**
  - `.s1mple/S1MPLE.md` — persona (simplest robust design, small end-to-end increments), required context (communication, project, TypeScript rules), workflow `s1mple-discuss → s1mple-plan → execute`; Implementation rule "Keep it lean and simple" (user decision, 2026-10-03); Discuss, Plan, Verification, Delivery `Not established`.
  - `.s1mple/docs/project.md` — project `so`; TypeScript is the primary language (user decision); purpose, runtime, tooling, components, contracts, and checks all `Not established`.
  - `.s1mple/docs/languages/typescript.md` — applies to `**/*.ts`, `**/*.tsx`; toolchain and conventions `Not established`.
  - `.s1mple/docs/communication.md` — chat and document rules.

- **Initiative Evidence**
  - `so` repository (`git log`, branch `chore/s1mple-init`, commit `dd19cbe`) — the only content is `.s1mple/` guidance; no source, manifest, or CI exists.
  - `../alfred/.s1mple/docs/project.md` — Alfred's architecture, stack, boundaries, and CI; reusable-capability reference only.
  - `../alfred/package.json:5,13`, `:packageManager` — Biome `2.4.13`, TypeScript `6.0.3`, Bun `1.3.10`.
  - `../alfred/apps/tui/package.json:24` — Alfred's TUI uses Ink `7.1.1`.
  - Context7 `/anomalyco/opentui` (queried 2026-10-03) — OpenTUI is a TypeScript library over a native Zig core, ships `TextareaRenderable` with `keyBindings`, and `CodeRenderable` with tree-sitter highlighting; its description labels it "currently in development".

## User Input

- **Original Input**
  - "so is neovim/lazyvim for markdown, follow obsidian style; no AI, no chat, no LLM, no vault, no git; techstack may differ from alfred; read ../alfred — it already built a good TUI for markdown CRUD + web view, good material but so's architecture differs because scope differs."
  - "Requirements: UI/UX fast and smooth; development/CI/CD must be fast; designs stable, simple, easy to maintain and extend, meeting industry standards."
  - "TypeScript project, keep it lean and simple."
  - Answered decisions (2026-10-03): own vim engine; OpenTUI renderer; read-only web preview (`Bun.serve`, no Next.js); v1 Obsidian scope = Links core + Live preview + Daily notes/templates + Bases.
  - Roadmap instruction: keep phases few and delivery items few.
  - Scope change (2026-10-03, after roadmap approval): "may be not only for markdown, notebook in the future => we should design in a way that it can develop into a code editor => should leave room for this. The design should be stable, simple, easy to maintain and extend + meet industry standards."
  - Answered decision (2026-10-03): "Apply all six (Recommended)" — (1) language-neutral editor kernel separated from Markdown and note features by the boundary test; (2) a file-type registry; (3) a generic text view with decorations, with Markdown live preview as one provider; (4) keymaps scoped by mode and file type; (5) a highlighter interface keyed by language; (6) any UTF-8 text file opens in source view with highlighting and binary files are refused. Code intelligence, notebooks, a plugin API, a piece table, and multi-cursor stay out of v1.

- **Problem and Outcome**
  - Problem: Build `so`, a fast, keyboard-driven, vim-modal terminal Markdown editor for a plain folder of notes with Obsidian-style features (wikilinks/backlinks/tags, live preview, daily notes/templates, Bases) and a read-only local browser preview — as a single lean Bun/TypeScript process with fast development and CI.
  - Desired outcome: A terminal editor that feels like Neovim/LazyVim for Markdown and behaves like Obsidian for notes, without AI, vaults, or Git. It is Markdown-first, and its editor core is language-neutral so that code editing and notebooks can be added later without reworking the core.

- **Stated Boundaries**
  - Included:
    - Vim-modal editing of Markdown in the terminal, LazyVim-style keymaps.
    - Opening a plain folder (or file) as the workspace.
    - Links core: wikilinks, backlinks, tags, heading and block links, quick switcher, rename that updates links.
    - Live preview: hidden Markdown syntax except on the cursor line; callouts, tables, checkboxes, embeds, inline images.
    - Daily notes and templates.
    - Obsidian Bases (`.base` table and board views).
    - Read-only local browser preview that follows the current note.
    - Opening any UTF-8 text file in source view with syntax highlighting, on a language-neutral editor core (scope change 2026-10-03).
  - Excluded:
    - AI, chat, LLM features.
    - Vault registry or multi-vault management.
    - Git integration or sync.
    - Next.js or a full web application; web editing.
    - In v1: code intelligence (language servers, tree-sitter, diagnostics), notebooks (`.ipynb`), a plugin API — later initiatives the design must leave room for (scope change 2026-10-03).
  - Constraints:
    - TypeScript; lean and simple (user decision).
    - UI/UX fast and smooth.
    - Development, CI, and CD fast.
    - Designs stable, simple, maintainable, extensible, and aligned with industry standards.
    - User-approved proposal targets, pending verification:

      | Target | Value |
      |---|---|
      | Keypress → frame | p95 < 16 ms on a 5,000-line note |
      | Cold start → first frame | < 200 ms |
      | Open note | < 50 ms |
      | Local full check | < 30 s |
      | CI wall clock per push | < 3 min |

## Current System

- **Structure and Responsibilities**
  - `so/.s1mple/` — s1mple guidance only; no application code; source: repository inspection at `dd19cbe`.

- **Contracts and Data Ownership**
  - None — no code, data, or interfaces exist yet.

- **Dependencies**
  - None — no manifest exists.

**Architecture**

```text
Not established — empty repository
```

**Control and Data Flow**

```text
Not established — empty repository
```

## Standards and Existing Capabilities

- **Binding Standards**
  - Lean and simple implementation — all `so` code; source: `.s1mple/S1MPLE.md` Implementation.
  - TypeScript — all `so` source; source: `.s1mple/docs/project.md` Technology Stack.
  - Communication rules — chat and documents; source: `.s1mple/docs/communication.md`.

- **Existing Patterns and Capabilities** (Alfred, reusable by port; Alfred's architecture is not binding on `so`)
  - Markdown parse to mdast with GFM and math, Obsidian extensions, heading slugs — `alfred/apps/tui/src/view/markdown/parse.ts` (1,176 lines; imports `mdast-util-from-markdown`, `micromark-extension-gfm`, `micromark-extension-math` at `:40-44`); terminal layout `layout.ts` (1,533 lines); `math.ts` (289), `mermaid.ts` (225, `beautiful-mermaid`), `code-highlight.ts` (96, `lowlight`).
  - Obsidian syntax corpus — `alfred/packages/view-model/src/markdown/obsidian-syntax.ts` (75 lines: `WIKILINK_RE`, `EMBED_RE`, `TAG_RE`, `HIGHLIGHT_RE`, `BLOCK_ID_RE`, `CALLOUT_RE`, footnote regexes); `embeds.ts` (149), `footnotes.ts` (123), `frontmatter.ts` (570).
  - Vim core — `alfred/apps/tui/src/view/editor/vim.ts` (535 lines; `VimMode = "normal" | "insert"` at `:15`; pure state with effects); `text-buffer.ts` (186; single string with grapheme-aligned UTF-16 cursor); `reveal-units.ts` (107; partitions source into units Live mode reveals together).
  - Terminal support — `alfred/apps/tui/src/terminal/`: `capabilities.ts` (277; graphics tiers `kitty`, `iterm2`, `sixel`, `half-block` at `:3-6`), `compositor.ts` (522), `graphics.ts` (159), `mouse.ts` (179; SGR mouse), `shutdown.ts` (113; terminal restore), `theme.ts`, `hyperlinks.ts`, `opener.ts`.
  - Bases engine — `alfred/packages/vault/src/domain/bases/` (`parser.ts` `parseBaseSource` at `:19`, `evaluator.ts` `evaluateBase` at `:164`, `expression.ts`, `yaml-patcher.ts`, `types.ts`; ~2,190 lines; no filesystem or Bun imports); Base view rules `alfred/packages/view-model/src/base/` (`rows.ts`, `board.ts`, `column-editor.ts`, others; ~1,360 lines).
  - Alfred components with no counterpart in `so` scope — kernel (Hono HTTP), `@alfred/client`, `@alfred/protocol` (Zod/OpenAPI), chat (ACP), vault MCP server, Git sync, SQLite index and session store, Next.js web app; source: `alfred/.s1mple/docs/project.md` Repository and Component Map.

- **Compatibility Obligations**
  - Obsidian Markdown conventions (wikilinks, embeds, callouts, tags, block ids, frontmatter properties) — user-stated "follow obsidian style"; level of fidelity `Not established`.
  - Obsidian `.base` files — user-selected Bases scope; spec compatibility level `Not established`.
  - Notes remain plain Markdown files in a user folder — implied by "no vault"; source: user input.

## Delivery Environment

- **Constraints**
  - Few phases and few delivery items — user roadmap instruction.
  - Deadline, capacity, and team size — `Not established`.

- **Existing Work**
  - Alfred TUI (`alfred/apps/tui`, merged in `5fde89b0`) — overlapping Markdown viewing and editing capability; `so` is a separate project, not a migration.

- **External Dependencies**
  - OpenTUI (`/anomalyco/opentui`) — renderer chosen by the user; pre-1.0 per its own description.
  - Bun — runtime implied by `Bun.serve` decision and Alfred precedent; version for `so` `Not established`.

## Evidence Gaps

- **Assumptions**
  - Alfred code may be ported into `so` — same author (`therealhieu`); Alfred has no `LICENSE` file or `license` field; confirm with the user.
  - Alfred's Bases domain is portable as pure code — no filesystem or Bun imports found in `packages/vault/src/domain/bases/*.ts`; verify during porting.

- **Unknowns**
  - OpenTUI API stability before 1.0 — affects maintenance cost of the UI layer; consult OpenTUI releases and changelog.
  - `bun build --compile` compatibility with OpenTUI's native Zig library — affects binary distribution; verify with a spike.
  - Achievability of the proposed performance targets with OpenTUI and a TypeScript vim engine — affects design; verify by measurement.
  - Obsidian Bases spec compatibility level required — affects Bases scope; decide during requirements.
  - Bun and TypeScript versions, test runner, and CI host for `so` — not yet recorded in `.s1mple/docs`.

- **Conflicts**
  - None

- **Inspection Limits**
  - OpenTUI inspected only via Context7 documentation, not by running code — confidence in rendering performance and packaging is low until measured.
  - Alfred code read by file size and header only, not executed — reuse effort estimates are approximate.

## Completion Check

- **Evidence**
  - [x] Relevant guidance, current system, and delivery constraints are covered.
  - [x] Verified facts cite sources; user statements, assumptions, and unknowns are distinguished.
  - [x] Missing information is marked `Not established`; empty categories use `None`.
  - [x] No requirement, design, phase, or delivery item is proposed.

- **Revision Integrity**
  - [x] The current revision is explicit; new context started at `R1` and is now `R2`.
  - [x] Prior revisions are preserved in the history file before semantic changes.
  - [x] All placeholders are replaced and the document status matches its blockers.
