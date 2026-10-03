# RM261003ABZP: so v1 — Roadmap Index

- **Status:** Approved
- **Outcome:** `so` ships as a fast, vim-modal, Markdown-first terminal editor for a plain notes folder. It has Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, and is released as checksummed binaries for macOS and Linux. Its language-neutral editor core opens any text file in source view and leaves room for code editing and notebooks later.
- **History:** `rm261003abzp-roadmap-index-revisions.md`

Phase files hold the complete PH and DI definitions. This index holds their current references and the delivery order. `Approved` describes the roadmap baseline, not delivered work. DI1 is delivered by W261003HEGE in PR #1 and DI2 by W261003FX70 in PR #2; see Work Progress.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R2` - The repository is empty apart from the `.s1mple/` guidance. The user's scope change (R2) keeps v1 Markdown-first on a language-neutral core. Alfred (`../alfred`) supplies code that can be ported for Markdown parsing, Obsidian syntax, the vim core, terminal graphics, and Bases.
- **Requirements:** `rm261003abzp-requirements.md` (Approved); history: `rm261003abzp-requirements-revisions.md`
- **Design:** `rm261003abzp-design.md` (Approved); history: `rm261003abzp-design-revisions.md`
- **Research:** `rm261003abzp-research.md` (immutable; reconciliation Complete in the requirements)
- **UI baseline:**
  - UI context: `rm261003abzp-ui-context.md@R2`.
  - Accepted mockups (`ui-mockups/manifest.md`, shared R1, delegated acceptance): RM261003ABZP-M1@R1, RM261003ABZP-M2@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1; manifest AD4 (non-Markdown states reuse accepted visuals, Feedback Ledger cycle 2).
  - UI requirements (`Ready for UI Design`, `rm261003abzp-ui-requirements.md`): RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ3@R2, RM261003ABZP-UREQ4@R1, RM261003ABZP-UREQ5@R2, RM261003ABZP-UREQ6@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1 … RM261003ABZP-UREQ11@R1.
  - UI design (`Ready for Planning`, `rm261003abzp-ui-design.md`): RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES8@R1 … RM261003ABZP-UDES11@R1; RM261003ABZP-US1@R2, RM261003ABZP-US2@R2, RM261003ABZP-US3@R2, RM261003ABZP-US4@R1, RM261003ABZP-US5@R2, RM261003ABZP-US6@R1 … RM261003ABZP-US9@R1; RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1, RM261003ABZP-UV3@R2, RM261003ABZP-UV4@R2, RM261003ABZP-UV5@R1, RM261003ABZP-UV6@R2, RM261003ABZP-UV7@R1 … RM261003ABZP-UV10@R1.
- **Approved inputs:**
  - RM261003ABZP-REQ1@R3 - Folder workspace, text files, and safe file management
  - RM261003ABZP-REQ2@R2 - Vim-modal editing with a core command set
  - RM261003ABZP-REQ3@R4 - LazyVim-style navigation, commands, configuration, and state
  - RM261003ABZP-REQ4@R3 - Obsidian-compatible links, backlinks, tags, and rename
  - RM261003ABZP-REQ5@R2 - Obsidian-style live preview
  - RM261003ABZP-REQ6@R2 - Daily notes and templates
  - RM261003ABZP-REQ7@R2 - Obsidian Bases table and Kanban views
  - RM261003ABZP-REQ8@R2 - Read-only local browser preview
  - RM261003ABZP-REQ9@R2 - Fast and smooth performance targets
  - RM261003ABZP-REQ10@R3 - Fast development, CI, and release
  - RM261003ABZP-REQ11@R3 - Maintainable, standards-based, language-neutral foundations
  - RM261003ABZP-DES1@R2 - One process, one package, four layers, and a language-neutral kernel, with a tested import boundary
  - RM261003ABZP-DES2@R2 - One store with a pure reducer and data-only effects
  - RM261003ABZP-DES3@R1 - Line-array TextBuffer with vim undo blocks
  - RM261003ABZP-DES4@R1 - Table-driven vim engine
  - RM261003ABZP-DES5@R2 - Command registry and file-type-scoped keymap trie as the single extension point for actions
  - RM261003ABZP-DES6@R2 - micromark/mdast with Obsidian extensions and block-level reparse
  - RM261003ABZP-DES7@R4 - Worker-built in-memory index with a documented resolution rule
  - RM261003ABZP-DES8@R2 - Atomic saves, directory watching, own-write stamps, and trash adapters
  - RM261003ABZP-DES9@R3 - Viewport-only text view with decorations; Markdown live preview as a decoration provider
  - RM261003ABZP-DES10@R2 - OpenTUI shell with editor-kind views, widget painters, normalized input, and guaranteed terminal restore
  - RM261003ABZP-DES11@R1 - Moment-subset formatter, template expansion, and daily-note commands
  - RM261003ABZP-DES12@R2 - Ported Bases engine as a registered `base` editor kind, with table and Kanban view models and YAML-preserving write-back
  - RM261003ABZP-DES13@R2 - `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering
  - RM261003ABZP-DES14@R2 - TOML config at the XDG path; per-workspace state at the XDG state path
  - RM261003ABZP-DES15@R3 - Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile
  - RM261003ABZP-DES16@R1 - Performance by construction plus benchmark gates
  - RM261003ABZP-DES17@R1 - File-type registry, highlighter interface, and text-file open policy
  - The UI requirement and UI design revisions listed under UI baseline - the accepted terminal and browser experience (titles in UI Coverage below)

## Delivery Overview

- **First valuable release:** PH1 ships as `v0.1.0`. The user opens a folder, browses and manages notes and other text files, edits with vim keys and safe autosave, and finds and jumps between notes through the leader key, pickers, and wikilinks, with links kept intact on rename. This is the requirements' "Minimum valuable release".
- **Delivery approach:** There are two phases and four substantial DIs, following the user instruction to avoid splitting work into many DIs and phases.
  - PH1 (DI1 + DI2) delivers the daily-usable editor.
  - PH2 (DI3 + DI4) adds the Obsidian experience on top of it.
  - Each DI ships one user-visible capability with its own tests.
  - Internal layers (tooling, store, parser, index) ship inside the DI that first needs them, not as separate "foundation" items. The exception is DI1, which by design (RM261003ABZP-DES1@R2, Delivery constraints) must land the boundary test and CI before any feature code.
- **Key constraints:**
  - The import boundary test (including the kernel rule) and the CI gates exist from the first PR (RM261003ABZP-DES1@R2, RM261003ABZP-DES15@R3).
  - The kernel stays language-neutral: later DIs add Markdown views, links, and Bases as registrations (file types, decoration providers, commands, editor kinds), never as kernel changes (RM261003ABZP-DES17@R1).
  - DI1 confirmed the `@opentui/core` paint, buffer, and test-renderer APIs at 0.5.14 and recursive `fs.watch` on macOS and Linux (RM261003ABZP-DES10@R2, RM261003ABZP-DES8@R2). The image API was not exercised by DI1; the DI3 discussion confirms it before DI3 relies on it.
  - DI4 confirms the Kanban `type` constant against an Obsidian 1.14+ file before Kanban ships (RM261003ABZP-DES12@R2).
  - Releases are cut only at phase exit: release-please accumulates commits, and its release PR is merged after the phase exit evidence passes.
- **Dependencies and parallel opportunities:**

```text
RM261003ABZP-PH1@R2 — Daily-usable editor  (release v0.1.0)
├── RM261003ABZP-DI1@R2 — Editor foundation: open folder → kernel + file types → vim edit any text file → safe autosave → explorer file ops
└── RM261003ABZP-DI2@R2 — Navigation and links: leader/which-key/pickers/palette/config, file-type keymaps → links, backlinks, rename
        (DI2 depends on DI1)

RM261003ABZP-PH2@R2 — Obsidian experience  (release v1.0.0; depends on PH1)
├── RM261003ABZP-DI3@R2 — Live preview + browser preview  (depends on DI2)
└── RM261003ABZP-DI4@R2 — Daily notes, templates + Bases   (depends on DI2; gate on DI3 for the `base` embed renderer)

Parallel: DI3 and DI4 run in parallel once DI2 is merged. DI4 waits for DI3 only before
executing its `![[file.base]]` embed renderer (PH2 Cross-Work Dependency Gates).
```

## Phase Sequence

1. **RM261003ABZP-PH1@R2 — Daily-usable editor**
   - **Outcome:** A terminal user can open a notes folder and edit it daily — notes and any other text file — with vim keys, safe autosave, explorer file management, LazyVim-style discovery (leader, which-key, pickers, palette, help, config), and Obsidian-compatible links, backlinks, tags, and link-safe rename.
   - **Dependencies:** None
   - **Delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2
   - **Exit criteria:**
     - RM261003ABZP-S1@R1 - Notes are never lost or silently overwritten; verified by RM261003ABZP-V1@R1
     - RM261003ABZP-S2@R1 - The core vim command set behaves like Neovim; verified by RM261003ABZP-V2@R1, RM261003ABZP-V3@R1
     - RM261003ABZP-S3@R1 - Commands are discoverable and configurable; verified by RM261003ABZP-V4@R2
     - RM261003ABZP-S4@R1 - Links resolve deterministically, and rename and link-mention keep the graph intact; verified by RM261003ABZP-V5@R1, RM261003ABZP-V6@R2
     - RM261003ABZP-S9@R1 (startup and index part) - First frame < 200 ms and index < 3 s on 10,000 notes, with input staying responsive during indexing; verified by RM261003ABZP-V13@R1
     - RM261003ABZP-S10@R1 - Check < 30 s, CI < 3 min, release produces four checksummed binaries that start; verified by RM261003ABZP-V14@R1
     - RM261003ABZP-S11@R1 (boundary and restore part) - Boundary violations, including kernel imports of language code, fail CI, and the terminal is restored on every exit path; verified by RM261003ABZP-V15@R2, RM261003ABZP-V17@R1
     - RM261003ABZP-S12@R1 - Any text file opens safely on a language-neutral core: source view with highlighting, binary and oversized files refused, BOM and line endings kept; verified by RM261003ABZP-V18@R1
     - RM261003ABZP-US1@R2 (PH1 states) - Shell, modes, and status are legible for every state delivered by DI1 and DI2; verified by RM261003ABZP-UV1@R2 (PH1 states), RM261003ABZP-UV2@R1
     - RM261003ABZP-US3@R2 - Commands, notes, and files are discoverable from the keyboard; verified by RM261003ABZP-UV4@R2
     - RM261003ABZP-US4@R1 - Link interactions show impact first; verified by RM261003ABZP-UV5@R1
     - RM261003ABZP-US5@R2 - File operations, refused files, and disk changes never surprise the user; verified by RM261003ABZP-UV6@R2
     - RM261003ABZP-US9@R1 (PH1 surfaces) - NO_COLOR, light theme, and 80×24 hold for the shell, explorer, prompts, overlays, and side panel; verified by RM261003ABZP-UV10@R1 (PH1 states)
   - **Delivery status:** In progress
   - **Progress evidence:** RM261003ABZP-DI1@R2 merged to `main` as `c98aa19` (PR #1) and RM261003ABZP-DI2@R2 as `9adb285` (PR #2), both with CI green. The PH1 exit record and the `v0.1.0` release are pending.
   - **Details:** `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`

2. **RM261003ABZP-PH2@R2 — Obsidian experience**
   - **Outcome:** Notes render in Obsidian-style live preview with inline images, and `:Preview` mirrors them read-only in the browser. Daily notes and templates take one or two keystrokes. Bases open as editable tables and Kanban boards and embed in notes. Together this completes the v1 scope.
   - **Dependencies:** RM261003ABZP-PH1@R2 - the editor, store, command registry, kernel text view, file-type registry, highlighter, Doc parser, index, pickers, and prompts
   - **Delivery items:** RM261003ABZP-DI3@R2, RM261003ABZP-DI4@R2
   - **Exit criteria:**
     - RM261003ABZP-S5@R1 - Live preview renders Obsidian syntax and reveals source at the cursor; verified by RM261003ABZP-V7@R2, RM261003ABZP-V8@R1
     - RM261003ABZP-S6@R1 - Daily notes and templates match Obsidian output; verified by RM261003ABZP-V9@R1
     - RM261003ABZP-S7@R1 - Bases views evaluate and edit `.base` files; verified by RM261003ABZP-V10@R1
     - RM261003ABZP-S8@R1 - Preview is live, read-only, and local-only; verified by RM261003ABZP-V11@R3
     - RM261003ABZP-S9@R1 - All performance targets hold, including keystroke p95 < 16 ms in live preview and in a 5,000-line TypeScript file; verified by RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 (re-run)
     - RM261003ABZP-S10@R1 - Fast checks, CI, and release still hold at full scope; verified by RM261003ABZP-V14@R1 (re-run for `v1.0.0`)
     - RM261003ABZP-S11@R1 - Foundations stay clean, and extension is registration-only; verified by RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1
     - RM261003ABZP-US1@R2 - Complete statusline segment order, including the `view` and `preview` segments; verified by RM261003ABZP-UV1@R2 (full)
     - RM261003ABZP-US2@R2 - Live preview looks and reveals like the accepted mockup; other files stay plain source; verified by RM261003ABZP-UV3@R2
     - RM261003ABZP-US6@R1 - Daily notes and templates take one or two keystrokes; verified by RM261003ABZP-UV7@R1
     - RM261003ABZP-US7@R1 - Bases editing is keyboard-fast and shows every write; verified by RM261003ABZP-UV8@R1
     - RM261003ABZP-US8@R1 - The browser page is a faithful, read-only, connection-aware mirror; verified by RM261003ABZP-UV9@R1
     - RM261003ABZP-US9@R1 - Every surface works under NO_COLOR, in light theme, and at 80×24; verified by RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R1
   - **Delivery status:** Not started
   - **Progress evidence:** None
   - **Details:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md`

## Delivery Items

| DI | Valuable outcome | Phase | Dependencies | Work | PR |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | `so [path]` opens a folder in an OpenTUI shell. The user edits notes and any other UTF-8 text file (source view with syntax colouring; binary and over-16 MiB files refused) with the core vim command set, splits, and buffers, and saves atomically with autosave, BOM and line endings kept, external-change handling, and explorer create/rename/move/trash. The language-neutral kernel (file-type registry, `layoutText` with decorations, highlighter), tooling, CI, release binaries, the boundary test, and the bench harness ship with it. | RM261003ABZP-PH1@R2 | None | W261003HEGE | PR #1 |
| RM261003ABZP-DI2@R2 | Leader with which-key, the picker family (all files, text search), palette and help filtered by file type, file-type-scoped keymaps, TOML config, and persisted recents and jumps. Obsidian links, tags, backlinks with link-mention, `[[` completion, and link-safe rename/move, all over a worker-built index. | RM261003ABZP-PH1@R2 | RM261003ABZP-DI1@R2 | W261003FX70 | PR #2 |
| RM261003ABZP-DI3@R2 | Live preview as a decoration provider with reveal, rich blocks, folds, embeds, image tiers, and live/source/reading modes. `:Preview` shows a read-only browser mirror over SSE. Final keystroke benchmarks and registration-only extension proof. | RM261003ABZP-PH2@R2 | RM261003ABZP-DI2@R2 | Pending | Pending |
| RM261003ABZP-DI4@R2 | `:Today`/`:Yesterday`/`:Tomorrow`, the calendar picker, template insertion, and new-note-from-template. `.base` files open as a registered editor kind with editable table and Kanban views and frontmatter write-back, plus `![[file.base]]` embeds. | RM261003ABZP-PH2@R2 | RM261003ABZP-DI2@R2; RM261003ABZP-DI3@R2 (embed gate only) | Pending | Pending |

Each DI maps to exactly one Work and one PR. RM261003ABZP-DI1@R2 is assigned W261003HEGE and PR #1, and RM261003ABZP-DI2@R2 W261003FX70 and PR #2; the others are pending.

## Work Progress

| DI | Work stage | Contract health | Next gate / blocker | Evidence | Checked at |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | Deliver (merged) | Aligned | None — G1 closed; open, not blocking: manual macOS Trash check (W261003HEGE V11.4) and the `v0.1.0-rc.1` release dry run (RM261003ABZP-V14@R1) | `.s1mple/work/done/w261003hege-editor-foundation/reports/overall-verification-report.md` (all groups accepted, no findings); PR #1 merged 2026-10-03T11:00:09Z; checked against REQ10@R3, DES8@R2, DES15@R2 | 2026-10-03T11:56:27Z |
| RM261003ABZP-DI2@R2 | Deliver (merged) | Aligned | None — G2 and G3 outputs merged; open, not blocking: whether one Linux CI bench run below every target is enough RM261003ABZP-V13@R1 evidence for the PH1 exit (earlier runs swung about 1.7×), and the ungated max keystroke latency while indexing (20–45 ms) | `.s1mple/work/done/w261003fx70-navigation-and-links/reports/overall-verification-report.md` (Passed; all five groups accepted, no findings); PR #2 merged 2026-10-03T21:50:57Z as `9adb285`; checked against DES6@R2, DES7@R4, DES14@R2, DES15@R3 | 2026-10-03T21:59:02Z |
| RM261003ABZP-DI3@R2 | Not started | Aligned | PH1 exit record (PH2 gate G2; DI2 merged); the DI3 discussion may start and confirms the OpenTUI image API | G2 outputs on `main` at `9adb285` (W261003FX70 overall verification, G2 table); PH2 baseline cites DES6@R2 | 2026-10-03T21:59:02Z |
| RM261003ABZP-DI4@R2 | Not started | Aligned | PH1 exit record (PH2 gate G3; DI2 merged); DI3 embed gate G4 before embed execution; the DI4 discussion may start and confirms the Kanban `type` value | G3 outputs on `main` at `9adb285` (W261003FX70 overall verification, G3 table) | 2026-10-03T21:59:02Z |

These rows are evidence-backed snapshots, not live telemetry. Delivery status stays in Phase Sequence and in each phase's Progress. Resolve W and PR identities through the Delivery Items ledger. A row stays `Not assessed` until its relevant baseline and coverage have been checked.

The main orchestrator updates authorized index and phase links, and progress, together after re-reading both. Without parent-write authorization, it records the exact pending changes and evidence in the current W artifact's synchronization receipt instead of modifying this index.

## Coverage

| Requirement | Research support | Design | Phase / DI | Success | Verification |
|---|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-RF11 - atomic save, directory watching, undoable reload | RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-RF5 - Esc timeout, kitty keyboard; RM261003ABZP-RF6 - line array, undo block | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, commands, config, state, file-type scope | RM261003ABZP-RF15 - TOML, XDG, state home | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI2@R2 (registry and keymap core in RM261003ABZP-DI1@R2) | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename | RM261003ABZP-RF8 - documented resolution rule | RM261003ABZP-DES7@R4, RM261003ABZP-DES6@R2 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI2@R2 | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-RF4 - kitty/sixel/blocks; RM261003ABZP-RF7 - block reparse, reveal | RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-RF10 - Moment tokens, `{{time:F}}`, subfolders | RM261003ABZP-DES11@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI4@R2 | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-RF9 - layouts, Kanban rules | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI4@R2 | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - browser preview | RM261003ABZP-RF12 - binding, Host check, containment, SSE | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R2 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-RF2 - in-process frame metrics | RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1 (highlighting look-back) | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 (harness), RM261003ABZP-DI2@R2 (V13); RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 (V12) | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R3 - development, CI, release | RM261003ABZP-RF3 - compile embeds native lib; RM261003ABZP-RF13 - TS 7, no TS API; RM261003ABZP-RF14 - release-please | RM261003ABZP-DES15@R3, RM261003ABZP-DES1@R2 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-RF1 - contain OpenTUI; RM261003ABZP-RF4; RM261003ABZP-RF5; RM261003ABZP-RF6; RM261003ABZP-RF13; RM261003ABZP-RF14; RM261003ABZP-RF15 | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 (V15, V17, V18); RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 (V16), RM261003ABZP-DI4@R2 (`base` editor kind) | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

- **Research lineage:**
  - RM261003ABZP-RF1:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R3)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF2:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R3)
  - RM261003ABZP-RF3:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R3)
    - evaluated None → informed None (macOS signing deferred)
  - RM261003ABZP-RF4:
    - evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF5:
    - evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF6:
    - evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF7:
    - evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - RM261003ABZP-RF8: evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - RM261003ABZP-RF9: evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - RM261003ABZP-RF10: evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - RM261003ABZP-RF11: evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (current RM261003ABZP-REQ1@R3)
  - RM261003ABZP-RF12: evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - RM261003ABZP-RF13:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R3)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF14:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R3)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF15:
    - evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
- **Success and verification definitions:**
  - RM261003ABZP-S1@R1 … RM261003ABZP-S12@R1 and RM261003ABZP-V1@R1 … RM261003ABZP-V18@R1 (with RM261003ABZP-V4@R2, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2) are owned by `rm261003abzp-design.md`, Success and Verification.
  - RM261003ABZP-US1@R2 … RM261003ABZP-US9@R1 and RM261003ABZP-UV1@R2 … RM261003ABZP-UV10@R1 (current revisions as listed under UI baseline) are owned by `rm261003abzp-ui-design.md`, UI Success Criteria and Implementation Verifications.
  - The phases define no new S or V records.

### UI Coverage

| Accepted mockup / feedback | UI requirement | UI design | Phase / DI | UI success | UI verification |
|---|---|---|---|---|---|
| RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ1@R2 - Application shell layout and status feedback | RM261003ABZP-UDES1@R2, RM261003ABZP-UDES11@R1 - Surface: Application shell; Component: Statusline, Toast stack | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 (index and side-panel states: RM261003ABZP-DI2@R2); RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 (view and preview segments) | RM261003ABZP-US1@R2 | RM261003ABZP-UV1@R2 |
| RM261003ABZP-M1@R1; Acceptance; AD3 | RM261003ABZP-UREQ2@R1 - Vim modes, cursor, and command line | RM261003ABZP-UDES2@R1 - Surface: Application shell; Component: Command line | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-US1@R2 | RM261003ABZP-UV2@R1 |
| RM261003ABZP-M2@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ3@R2 - Live preview rendering, reveal, view modes, and non-Markdown source view | RM261003ABZP-UDES3@R2 - Surface: Editor window | RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 (non-Markdown source view: RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2; note keys scoped: RM261003ABZP-DI2@R2) | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M2@R1; Acceptance; AD3 | RM261003ABZP-UREQ4@R1 - Rich blocks, embeds, and images | RM261003ABZP-UDES4@R1 - Surface: Editor window | RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M3@R1; Acceptance; AD1; AD3; AD4 | RM261003ABZP-UREQ5@R2 - Discovery overlays | RM261003ABZP-UDES5@R2 - Surface: Overlays; Component: Which-key, Picker, Command line | RM261003ABZP-PH1@R2 / RM261003ABZP-DI2@R2 | RM261003ABZP-US3@R2 | RM261003ABZP-UV4@R2 |
| RM261003ABZP-M3@R1, RM261003ABZP-M4@R1; Acceptance; AD3 | RM261003ABZP-UREQ6@R1 - Links: completion, following, jump list, backlinks, rename | RM261003ABZP-UDES6@R1 - Surface: Links and backlinks; Component: Completion popup, Prompt | RM261003ABZP-PH1@R2 / RM261003ABZP-DI2@R2 (unresolved-link styling: RM261003ABZP-DI3@R2) | RM261003ABZP-US4@R1 | RM261003ABZP-UV5@R1 |
| RM261003ABZP-M4@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ7@R2 - Explorer file operations, refused files, and disk-change handling | RM261003ABZP-UDES7@R2 - Surface: File operations and disk changes; Component: Prompt, Conflict dialog and diff | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 (link-impact text on move: RM261003ABZP-DI2@R2) | RM261003ABZP-US5@R2 | RM261003ABZP-UV6@R2 |
| RM261003ABZP-M5@R2; Acceptance; feedback cycle 1; AD2; AD3 | RM261003ABZP-UREQ8@R2 - Daily notes, date picker, and templates | RM261003ABZP-UDES8@R1 - Surface: Daily notes and templates; Component: Calendar, Picker | RM261003ABZP-PH2@R2 / RM261003ABZP-DI4@R2 | RM261003ABZP-US6@R1 | RM261003ABZP-UV7@R1 |
| RM261003ABZP-M6@R1; Acceptance; AD3 | RM261003ABZP-UREQ9@R1 - Bases table and Kanban views | RM261003ABZP-UDES9@R1 - Surface: Bases views; Component: Base table, Kanban board | RM261003ABZP-PH2@R2 / RM261003ABZP-DI4@R2 | RM261003ABZP-US7@R1 | RM261003ABZP-UV8@R1 |
| RM261003ABZP-M7@R1; Acceptance; AD3 | RM261003ABZP-UREQ10@R1 - Browser preview page | RM261003ABZP-UDES10@R1 - Surface: Browser preview page | RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 | RM261003ABZP-US8@R1 | RM261003ABZP-UV9@R1 |
| RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (RM261003ABZP-M5@R2); Acceptance; AD3 | RM261003ABZP-UREQ11@R1 - Themes, NO_COLOR, narrow terminals, input, accessibility | RM261003ABZP-UDES11@R1 - Section 5 policies; Component: Theme | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2; RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2, RM261003ABZP-DI4@R2 (each DI for its own surfaces) | RM261003ABZP-US9@R1 | RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R1 |

## Deferred Scope

- **Vim macros, Visual block mode, and Ex ranges**
  - **Reason:** They are outside the core command set that v1 needs.
  - **Revisit trigger:** User demand after `v1.0.0`.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-DES4@R1 Tradeoffs
- **Code intelligence (language servers, tree-sitter, diagnostics, debugger)**
  - **Reason:** v1 is Markdown-first; the language-neutral kernel, file-type registry, highlighter interface, decorations, file-type keymaps, and UTF-16 positions leave room for it without building it now.
  - **Revisit trigger:** A code-editor initiative.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ11@R3; RM261003ABZP-DES17@R1
- **Notebooks (`.ipynb`)**
  - **Reason:** Not needed for v1; a notebook becomes a new editor kind whose cells each hold a text buffer, registered like Bases.
  - **Revisit trigger:** A notebook initiative.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-REQ11@R3, RM261003ABZP-REQ7@R2
- **Plugin API**
  - **Reason:** Registries cover the known extension needs; a public API would be speculative.
  - **Revisit trigger:** A concrete third-party extension need.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-REQ11@R3
- **macOS signing and notarization**
  - **Reason:** Unsigned binaries with checksums keep CD fast and lean.
  - **Revisit trigger:** Gatekeeper friction reported by users, or distribution through Homebrew cask.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-RF3; RM261003ABZP-DES15@R3 Tradeoffs
- **Cards, List, and Map Bases layouts**
  - **Reason:** v1 renders table and Kanban; other layouts open as a table with a notice.
  - **Revisit trigger:** Obsidian stabilizes these layouts and users request them.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-REQ7@R2
- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** These are outside the terminal editor's v1 scope.
  - **Revisit trigger:** A new initiative.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations

## Unresolved Items

None. The pinned OpenTUI paint and image APIs, recursive `fs.watch`, the `lowlight` language set, and the Kanban `type` value are delivery confirmations with named verification, not open decisions. DI1 confirmed the paint API, recursive `fs.watch`, and the `lowlight` `common` set; the image API remains with DI3 and the Kanban `type` value with DI4. The user's own review of the mockups is pending: acceptance was delegated, and the user said they will review via the mockups. Feedback from that review enters through the revision rules (mockup edit cycle → UREQ/UDES revisions → affected PH/DI revisions); it also covers the AD4 states, which reuse accepted visuals without their own mockup.

## Approval

- **Approved phases:** RM261003ABZP-PH1@R2, RM261003ABZP-PH2@R2
- **Approved delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2, RM261003ABZP-DI3@R2, RM261003ABZP-DI4@R2
- **Approved phase designs:**
  - `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Phase Design (RM261003ABZP-PH1@R2). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R3, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view), RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1.
  - `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Phase Design (RM261003ABZP-PH2@R2). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R3, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R1, RM261003ABZP-UDES11@R1.
- **Approval evidence:**
  - R1 baseline: on 2026-10-03 the user delegated all decisions: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … just stop when finish the skill workflow then I will review via mockups … don't raise any question to me". The user also asked to "prevent many DIs and phases split". Under that delegation the agent approved the two-phase, four-DI arrangement, releases at phase exit (`v0.1.0`, `v1.0.0`), and the phase refinements in both phase files.
  - Current baseline: on 2026-10-03 the user asked to leave room for a code editor and notebooks ("The design should be stable, simple, easy to maintain and extend + meet industry standards") and selected "Apply all six (Recommended)" (`rm261003abzp-roadmap-context.md@R2`). Under the standing delegation the agent approved the revised baselines PH1@R2 and PH2@R2 with the same phase order, DI split, gates, and releases.
  - Post-DI1 synchronization: approved by the user on 2026-10-03. The input baseline moved to RM261003ABZP-REQ10@R3, RM261003ABZP-DES8@R2, and RM261003ABZP-DES15@R2 with PH1@R2, PH2@R2, and DI1@R2 … DI4@R2 retained; DI1 progress, Work, and PR were recorded.
  - Post-DI2 synchronization: approved by the user on 2026-10-04. The input baseline moved to RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, and RM261003ABZP-DES15@R3 with PH1@R2, PH2@R2, and DI1@R2 … DI4@R2 retained; DI2 progress, Work, and PR were recorded.
