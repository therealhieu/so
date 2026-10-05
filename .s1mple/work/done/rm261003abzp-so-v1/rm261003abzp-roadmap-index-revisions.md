# RM261003ABZP: so v1 — Roadmap Index Revisions

- **Current index:** `rm261003abzp-roadmap-index.md`
- **Purpose:** Append-only history of prior delivery arrangements and approved baselines; not current planning inputs.
- **Revision scope:** The index records exact PH/DI/S/V revisions, not a separate document revision. Complete record definitions and their transitions remain in their owning phase or design histories.

## Archived Changes

- **RM261003ABZP-PH1@R1, RM261003ABZP-PH2@R1, RM261003ABZP-DI1@R1 … RM261003ABZP-DI4@R1 — Scope change: language-neutral core, any text file**
  - **Archived at:** 2026-10-03T04:30:49Z
  - **Change type:** Baseline update
  - **Reason:** The user asked to leave room for growing `so` into a code editor and notebook host, and selected "Apply all six (Recommended)" (`rm261003abzp-roadmap-context.md@R2`). Requirements, system design, UI artifacts, and both phases were revised.
  - **Changes:** Outcome and context mention the language-neutral core; approved inputs and UI baseline move to current revisions and add RM261003ABZP-DES17@R1 and manifest AD4; PH1 exit adds RM261003ABZP-S12@R1 / RM261003ABZP-V18@R1; DI ledger outcomes describe the kernel, file types, file-type keymaps, the decoration-provider live preview, and Bases as an editor kind; coverage adds DES17, S12, and V18; Deferred Scope adds code intelligence and notebooks. Phase order, DI split, dependencies, gates, and releases are unchanged.
  - **Input baseline:** `rm261003abzp-roadmap-context.md@R1` → `@R2`; `rm261003abzp-ui-context.md@R1` → `@R2`; RM261003ABZP-REQ1@R2, RM261003ABZP-REQ3@R3, RM261003ABZP-REQ11@R2 → RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ11@R3; RM261003ABZP-DES1@R1, RM261003ABZP-DES5@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1, RM261003ABZP-DES12@R1 → RM261003ABZP-DES1@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2; added RM261003ABZP-DES17@R1; RM261003ABZP-UREQ1/3/5/7@R1 → @R2; RM261003ABZP-UDES1/3/5/7@R1 → @R2; RM261003ABZP-US1/2/3/5@R1 → @R2; RM261003ABZP-UV1/3/4/6@R1 → @R2; mockup revisions unchanged; manifest AD4 added.
  - **Phase order:** Unchanged (RM261003ABZP-PH1 → RM261003ABZP-PH2; revisions R1 → R2)
  - **Baseline transitions:**
    - RM261003ABZP-PH1@R1, RM261003ABZP-DI1@R1, RM261003ABZP-DI2@R1 → RM261003ABZP-PH1@R2, RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2 - `rm261003abzp-roadmap-phase-1-daily-usable-editor.md` and its revisions file
    - RM261003ABZP-PH2@R1, RM261003ABZP-DI3@R1, RM261003ABZP-DI4@R1 → RM261003ABZP-PH2@R2, RM261003ABZP-DI3@R2, RM261003ABZP-DI4@R2 - `rm261003abzp-roadmap-phase-2-obsidian-experience.md` and its revisions file
    - None → RM261003ABZP-S12@R1, RM261003ABZP-V18@R1; RM261003ABZP-V4@R1, RM261003ABZP-V7@R1, RM261003ABZP-V12@R1, RM261003ABZP-V15@R1, RM261003ABZP-V16@R1 → @R2; RM261003ABZP-V11@R2 → RM261003ABZP-V11@R3 - `rm261003abzp-design.md` and `rm261003abzp-design-revisions.md`
  - **Evidence:** `rm261003abzp-roadmap-context.md@R2` - "Apply all six" decision.
  - **Research provenance:** None — no new research; lineage annotated with current revisions.
  - **Approval evidence:** User selected "Apply all six (Recommended)" on 2026-10-03 under the standing delegation of 2026-10-03; the agent approved PH1@R2 and PH2@R2.
  - **Downstream impact:** No Work or PR bindings exist; Work Progress rows are re-checked against the R2 baseline (DI references bumped to R2, checked-at refreshed).

````markdown
# RM261003ABZP: so v1 — Roadmap Index

- **Status:** Approved
- **Outcome:** `so` ships as a fast, vim-modal terminal Markdown editor for a plain notes folder. It has Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, and is released as checksummed binaries for macOS and Linux.
- **History:** `rm261003abzp-roadmap-index-revisions.md`

Phase files hold the complete PH and DI definitions. This index holds their current references and the delivery order. `Approved` describes the roadmap baseline, not delivered work. No Work, PR, implementation, or verification result exists yet.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R1` - The repository is empty apart from the `.s1mple/` guidance. Alfred (`../alfred`) supplies code that can be ported for Markdown parsing, Obsidian syntax, the vim core, terminal graphics, and Bases.
- **Requirements:** `rm261003abzp-requirements.md` (Approved); history: `rm261003abzp-requirements-revisions.md`
- **Design:** `rm261003abzp-design.md` (Approved); history: `rm261003abzp-design-revisions.md`
- **Research:** `rm261003abzp-research.md` (immutable; reconciliation Complete in the requirements)
- **UI baseline:**
  - UI context: `rm261003abzp-ui-context.md@R1`.
  - Accepted mockups (`ui-mockups/manifest.md`, shared R1, delegated acceptance): RM261003ABZP-M1@R1, RM261003ABZP-M2@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1.
  - UI requirements (`Ready for UI Design`, `rm261003abzp-ui-requirements.md`): RM261003ABZP-UREQ1@R1 … RM261003ABZP-UREQ7@R1, RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1 … RM261003ABZP-UREQ11@R1.
  - UI design (`Ready for Planning`, `rm261003abzp-ui-design.md`): RM261003ABZP-UDES1@R1 … RM261003ABZP-UDES11@R1, RM261003ABZP-US1@R1 … RM261003ABZP-US9@R1, and RM261003ABZP-UV1@R1 … RM261003ABZP-UV10@R1.
- **Approved inputs:**
  - RM261003ABZP-REQ1@R2 - Folder workspace and safe file management
  - RM261003ABZP-REQ2@R2 - Vim-modal editing with a core command set
  - RM261003ABZP-REQ3@R3 - LazyVim-style navigation, commands, configuration, and state
  - RM261003ABZP-REQ4@R3 - Obsidian-compatible links, backlinks, tags, and rename
  - RM261003ABZP-REQ5@R2 - Obsidian-style live preview
  - RM261003ABZP-REQ6@R2 - Daily notes and templates
  - RM261003ABZP-REQ7@R2 - Obsidian Bases table and Kanban views
  - RM261003ABZP-REQ8@R2 - Read-only local browser preview
  - RM261003ABZP-REQ9@R2 - Fast and smooth performance targets
  - RM261003ABZP-REQ10@R2 - Fast development, CI, and release
  - RM261003ABZP-REQ11@R2 - Maintainable, standards-based foundations
  - RM261003ABZP-DES1@R1 - One process, one package, four layers with a tested import boundary
  - RM261003ABZP-DES2@R2 - One store with a pure reducer and data-only effects
  - RM261003ABZP-DES3@R1 - Line-array TextBuffer with vim undo blocks
  - RM261003ABZP-DES4@R1 - Table-driven vim engine
  - RM261003ABZP-DES5@R1 - Command registry and keymap trie as the single extension point for actions
  - RM261003ABZP-DES6@R1 - micromark/mdast with Obsidian extensions and block-level reparse
  - RM261003ABZP-DES7@R2 - Worker-built in-memory index with a documented resolution rule
  - RM261003ABZP-DES8@R1 - Atomic saves, directory watching, own-write stamps, and trash adapters
  - RM261003ABZP-DES9@R2 - Viewport-only live-preview layout with reveal and registered block renderers
  - RM261003ABZP-DES10@R1 - OpenTUI shell with a custom editor renderable, normalized input, and guaranteed terminal restore
  - RM261003ABZP-DES11@R1 - Moment-subset formatter, template expansion, and daily-note commands
  - RM261003ABZP-DES12@R1 - Ported Bases engine with table and Kanban view models and YAML-preserving write-back
  - RM261003ABZP-DES13@R2 - `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering
  - RM261003ABZP-DES14@R1 - TOML config at the XDG path; per-workspace state at the XDG state path
  - RM261003ABZP-DES15@R1 - Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile
  - RM261003ABZP-DES16@R1 - Performance by construction plus benchmark gates
  - RM261003ABZP-UREQ1@R1 … RM261003ABZP-UREQ11@R1 (RM261003ABZP-UREQ8@R2) and RM261003ABZP-UDES1@R1 … RM261003ABZP-UDES11@R1 - the accepted terminal and browser experience (titles in UI Coverage below)

## Delivery Overview

- **First valuable release:** PH1 ships as `v0.1.0`. The user opens a folder, browses and manages notes, edits with vim keys and safe autosave, and finds and jumps between notes through the leader key, pickers, and wikilinks, with links kept intact on rename. This is the requirements' "Minimum valuable release".
- **Delivery approach:** There are two phases and four substantial DIs, following the user instruction to avoid splitting work into many DIs and phases.
  - PH1 (DI1 + DI2) delivers the daily-usable editor.
  - PH2 (DI3 + DI4) adds the Obsidian experience on top of it.
  - Each DI ships one user-visible capability with its own tests.
  - Internal layers (tooling, store, parser, index) ship inside the DI that first needs them, not as separate "foundation" items. The exception is DI1, which by design (RM261003ABZP-DES1@R1, Delivery constraints) must land the boundary test and CI before any feature code.
- **Key constraints:**
  - The import boundary test and the CI gates exist from the first PR (RM261003ABZP-DES1@R1, RM261003ABZP-DES15@R1).
  - DI1 confirms the `@opentui/core` paint and image APIs at the pinned version and checks recursive `fs.watch` on macOS and Linux before later DIs depend on them (RM261003ABZP-DES10@R1, RM261003ABZP-DES8@R1).
  - DI4 confirms the Kanban `type` constant against an Obsidian 1.14+ file before Kanban ships (RM261003ABZP-DES12@R1).
  - Releases are cut only at phase exit: release-please accumulates commits, and its release PR is merged after the phase exit evidence passes.
- **Dependencies and parallel opportunities:**

```text
RM261003ABZP-PH1@R1 — Daily-usable editor  (release v0.1.0)
├── RM261003ABZP-DI1@R1 — Editor foundation: open folder → vim edit → safe autosave → explorer file ops
└── RM261003ABZP-DI2@R1 — Navigation and links: leader/which-key/pickers/palette/config → links, backlinks, rename
        (DI2 depends on DI1)

RM261003ABZP-PH2@R1 — Obsidian experience  (release v1.0.0; depends on PH1)
├── RM261003ABZP-DI3@R1 — Live preview + browser preview  (depends on DI2)
└── RM261003ABZP-DI4@R1 — Daily notes, templates + Bases   (depends on DI2; gate on DI3 for the `base` embed renderer)

Parallel: DI3 and DI4 run in parallel once DI2 is merged. DI4 waits for DI3 only before
executing its `![[file.base]]` embed renderer (PH2 Cross-Work Dependency Gates).
```

## Phase Sequence

1. **RM261003ABZP-PH1@R1 — Daily-usable editor**
   - **Outcome:** A terminal user can open a notes folder and edit it daily with vim keys, safe autosave, explorer file management, LazyVim-style discovery (leader, which-key, pickers, palette, help, config), and Obsidian-compatible links, backlinks, tags, and link-safe rename.
   - **Dependencies:** None
   - **Delivery items:** RM261003ABZP-DI1@R1, RM261003ABZP-DI2@R1
   - **Exit criteria:**
     - RM261003ABZP-S1@R1 - Notes are never lost or silently overwritten; verified by RM261003ABZP-V1@R1
     - RM261003ABZP-S2@R1 - The core vim command set behaves like Neovim; verified by RM261003ABZP-V2@R1, RM261003ABZP-V3@R1
     - RM261003ABZP-S3@R1 - Commands are discoverable and configurable; verified by RM261003ABZP-V4@R1
     - RM261003ABZP-S4@R1 - Links resolve deterministically, and rename and link-mention keep the graph intact; verified by RM261003ABZP-V5@R1, RM261003ABZP-V6@R2
     - RM261003ABZP-S9@R1 (startup and index part) - First frame < 200 ms and index < 3 s on 10,000 notes, with input staying responsive during indexing; verified by RM261003ABZP-V13@R1
     - RM261003ABZP-S10@R1 - Check < 30 s, CI < 3 min, release produces four checksummed binaries that start; verified by RM261003ABZP-V14@R1
     - RM261003ABZP-S11@R1 (boundary and restore part) - Boundary violations fail CI, and the terminal is restored on every exit path; verified by RM261003ABZP-V15@R1, RM261003ABZP-V17@R1
     - RM261003ABZP-US1@R1 (PH1 states) - Shell, modes, and status are legible for every state delivered by DI1 and DI2; verified by RM261003ABZP-UV1@R1 (PH1 states), RM261003ABZP-UV2@R1
     - RM261003ABZP-US3@R1 - Commands and notes are discoverable from the keyboard; verified by RM261003ABZP-UV4@R1
     - RM261003ABZP-US4@R1 - Link interactions show impact first; verified by RM261003ABZP-UV5@R1
     - RM261003ABZP-US5@R1 - File operations and disk changes never surprise the user; verified by RM261003ABZP-UV6@R1
     - RM261003ABZP-US9@R1 (PH1 surfaces) - NO_COLOR, light theme, and 80×24 hold for the shell, explorer, prompts, overlays, and side panel; verified by RM261003ABZP-UV10@R1 (PH1 states)
   - **Delivery status:** Not started
   - **Progress evidence:** None
   - **Details:** `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`

2. **RM261003ABZP-PH2@R1 — Obsidian experience**
   - **Outcome:** Notes render in Obsidian-style live preview with inline images, and `:Preview` mirrors them read-only in the browser. Daily notes and templates take one or two keystrokes. Bases open as editable tables and Kanban boards and embed in notes. Together this completes the v1 scope.
   - **Dependencies:** RM261003ABZP-PH1@R1 - the editor, store, command registry, Doc parser, index, pickers, and prompts
   - **Delivery items:** RM261003ABZP-DI3@R1, RM261003ABZP-DI4@R1
   - **Exit criteria:**
     - RM261003ABZP-S5@R1 - Live preview renders Obsidian syntax and reveals source at the cursor; verified by RM261003ABZP-V7@R1, RM261003ABZP-V8@R1
     - RM261003ABZP-S6@R1 - Daily notes and templates match Obsidian output; verified by RM261003ABZP-V9@R1
     - RM261003ABZP-S7@R1 - Bases views evaluate and edit `.base` files; verified by RM261003ABZP-V10@R1
     - RM261003ABZP-S8@R1 - Preview is live, read-only, and local-only; verified by RM261003ABZP-V11@R2
     - RM261003ABZP-S9@R1 - All performance targets hold, including keystroke p95 < 16 ms in live preview; verified by RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 (re-run)
     - RM261003ABZP-S10@R1 - Fast checks, CI, and release still hold at full scope; verified by RM261003ABZP-V14@R1 (re-run for `v1.0.0`)
     - RM261003ABZP-S11@R1 - Foundations stay clean, and extension is registration-only; verified by RM261003ABZP-V15@R1, RM261003ABZP-V16@R1, RM261003ABZP-V17@R1
     - RM261003ABZP-US1@R1 - Complete statusline segment order, including the `view` and `preview` segments; verified by RM261003ABZP-UV1@R1 (full)
     - RM261003ABZP-US2@R1 - Live preview looks and reveals like the accepted mockup; verified by RM261003ABZP-UV3@R1
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
| RM261003ABZP-DI1@R1 | `so [path]` opens a folder in an OpenTUI shell. The user edits with the core vim command set, splits, and buffers, and saves atomically with autosave, external-change handling, and explorer create/rename/move/trash. Tooling, CI, release binaries, the boundary test, and the bench harness ship with it. | RM261003ABZP-PH1@R1 | None | Pending | Pending |
| RM261003ABZP-DI2@R1 | Leader with which-key, the picker family, palette, help, TOML config, and persisted recents and jumps. Obsidian links, tags, backlinks with link-mention, `[[` completion, and link-safe rename/move, all over a worker-built index. | RM261003ABZP-PH1@R1 | RM261003ABZP-DI1@R1 | Pending | Pending |
| RM261003ABZP-DI3@R1 | Live preview with reveal, rich blocks, folds, embeds, image tiers, and live/source/reading modes. `:Preview` shows a read-only browser mirror over SSE. Final keystroke benchmarks and registration-only extension proof. | RM261003ABZP-PH2@R1 | RM261003ABZP-DI2@R1 | Pending | Pending |
| RM261003ABZP-DI4@R1 | `:Today`/`:Yesterday`/`:Tomorrow`, the calendar picker, template insertion, and new-note-from-template. `.base` files open as editable table and Kanban views with frontmatter write-back, plus `![[file.base]]` embeds. | RM261003ABZP-PH2@R1 | RM261003ABZP-DI2@R1; RM261003ABZP-DI3@R1 (embed gate only) | Pending | Pending |

Each DI maps to exactly one future Work and one PR. No W or PR is assigned yet.

## Work Progress

| DI | Work stage | Contract health | Next gate / blocker | Evidence | Checked at |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R1 | Not started | Not assessed | Start `s1mple-discuss` for DI1 | None | 2026-10-03T03:46:40Z (roadmap approval) |
| RM261003ABZP-DI2@R1 | Not started | Not assessed | DI1 merged (PH1 gate G1) | None | 2026-10-03T03:46:40Z (roadmap approval) |
| RM261003ABZP-DI3@R1 | Not started | Not assessed | PH1 exit and DI2 merged (PH2 gate G2) | None | 2026-10-03T03:46:40Z (roadmap approval) |
| RM261003ABZP-DI4@R1 | Not started | Not assessed | PH1 exit and DI2 merged (PH2 gate G3); DI3 embed gate G4 before embed execution | None | 2026-10-03T03:46:40Z (roadmap approval) |

These rows are evidence-backed snapshots, not live telemetry. Delivery status stays in Phase Sequence and in each phase's Progress. Resolve W and PR identities through the Delivery Items ledger. A row stays `Not assessed` until its relevant baseline and coverage have been checked.

The main orchestrator updates authorized index and phase links, and progress, together after re-reading both. Without parent-write authorization, it records the exact pending changes and evidence in the current W artifact's synchronization receipt instead of modifying this index.

## Coverage

| Requirement | Research support | Design | Phase / DI | Success | Verification |
|---|---|---|---|---|---|
| RM261003ABZP-REQ1@R2 - folder workspace, safe file management | RM261003ABZP-RF11 - atomic save, directory watching, undoable reload | RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R2 | RM261003ABZP-PH1@R1 / RM261003ABZP-DI1@R1 | RM261003ABZP-S1@R1 | RM261003ABZP-V1@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-RF5 - Esc timeout, kitty keyboard; RM261003ABZP-RF6 - line array, undo block | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R1 | RM261003ABZP-PH1@R1 / RM261003ABZP-DI1@R1 | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R3 - navigation, commands, config, state | RM261003ABZP-RF15 - TOML, XDG, state home | RM261003ABZP-DES5@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES10@R1, RM261003ABZP-DES14@R1 | RM261003ABZP-PH1@R1 / RM261003ABZP-DI2@R1 (registry and keymap core in RM261003ABZP-DI1@R1) | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R1 |
| RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename | RM261003ABZP-RF8 - documented resolution rule | RM261003ABZP-DES7@R2, RM261003ABZP-DES6@R1 | RM261003ABZP-PH1@R1 / RM261003ABZP-DI2@R1 | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-RF4 - kitty/sixel/blocks; RM261003ABZP-RF7 - block reparse, reveal | RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1 | RM261003ABZP-PH2@R1 / RM261003ABZP-DI3@R1 | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R1, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-RF10 - Moment tokens, `{{time:F}}`, subfolders | RM261003ABZP-DES11@R1 | RM261003ABZP-PH2@R1 / RM261003ABZP-DI4@R1 | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-RF9 - layouts, Kanban rules | RM261003ABZP-DES12@R1, RM261003ABZP-DES11@R1 | RM261003ABZP-PH2@R1 / RM261003ABZP-DI4@R1 | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - browser preview | RM261003ABZP-RF12 - binding, Host check, containment, SSE | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R1 | RM261003ABZP-PH2@R1 / RM261003ABZP-DI3@R1 | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R2 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-RF2 - in-process frame metrics | RM261003ABZP-DES16@R1 | RM261003ABZP-PH1@R1 / RM261003ABZP-DI1@R1 (harness), RM261003ABZP-DI2@R1 (V13); RM261003ABZP-PH2@R1 / RM261003ABZP-DI3@R1 (V12) | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R1, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R2 - development, CI, release | RM261003ABZP-RF3 - compile embeds native lib; RM261003ABZP-RF13 - TS 7, no TS API; RM261003ABZP-RF14 - release-please | RM261003ABZP-DES15@R1, RM261003ABZP-DES1@R1 | RM261003ABZP-PH1@R1 / RM261003ABZP-DI1@R1 | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R2 - foundations | RM261003ABZP-RF1 - contain OpenTUI; RM261003ABZP-RF4; RM261003ABZP-RF5; RM261003ABZP-RF6; RM261003ABZP-RF13; RM261003ABZP-RF14; RM261003ABZP-RF15 | RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R1, RM261003ABZP-DES10@R1 | RM261003ABZP-PH1@R1 / RM261003ABZP-DI1@R1 (V15, V17); RM261003ABZP-PH2@R1 / RM261003ABZP-DI3@R1 (V16) | RM261003ABZP-S11@R1 | RM261003ABZP-V15@R1, RM261003ABZP-V16@R1, RM261003ABZP-V17@R1 |

- **Research lineage:**
  - RM261003ABZP-RF1:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - RM261003ABZP-RF2:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - RM261003ABZP-RF3:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - evaluated None → informed None (macOS signing deferred)
  - RM261003ABZP-RF4:
    - evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - RM261003ABZP-RF5:
    - evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - RM261003ABZP-RF6:
    - evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - RM261003ABZP-RF7:
    - evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
  - RM261003ABZP-RF8: evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - RM261003ABZP-RF9: evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - RM261003ABZP-RF10: evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - RM261003ABZP-RF11: evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2
  - RM261003ABZP-RF12: evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - RM261003ABZP-RF13:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - RM261003ABZP-RF14:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
  - RM261003ABZP-RF15:
    - evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R3)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2
- **Success and verification definitions:**
  - RM261003ABZP-S1@R1 … RM261003ABZP-S11@R1 and RM261003ABZP-V1@R1 … RM261003ABZP-V17@R1 (with RM261003ABZP-V6@R2 and RM261003ABZP-V11@R2) are owned by `rm261003abzp-design.md`, Success and Verification.
  - RM261003ABZP-US1@R1 … RM261003ABZP-US9@R1 and RM261003ABZP-UV1@R1 … RM261003ABZP-UV10@R1 are owned by `rm261003abzp-ui-design.md`, UI Success Criteria and Implementation Verifications.
  - The phases define no new S or V records.

### UI Coverage

| Accepted mockup / feedback | UI requirement | UI design | Phase / DI | UI success | UI verification |
|---|---|---|---|---|---|
| RM261003ABZP-M1@R1; Acceptance; AD3 | RM261003ABZP-UREQ1@R1 - Application shell layout and status feedback | RM261003ABZP-UDES1@R1, RM261003ABZP-UDES11@R1 - Surface: Application shell; Component: Statusline, Toast stack | RM261003ABZP-PH1@R1 / RM261003ABZP-DI1@R1 (index and side-panel states: RM261003ABZP-DI2@R1); RM261003ABZP-PH2@R1 / RM261003ABZP-DI3@R1 (view and preview segments) | RM261003ABZP-US1@R1 | RM261003ABZP-UV1@R1 |
| RM261003ABZP-M1@R1; Acceptance; AD3 | RM261003ABZP-UREQ2@R1 - Vim modes, cursor, and command line | RM261003ABZP-UDES2@R1 - Surface: Application shell; Component: Command line | RM261003ABZP-PH1@R1 / RM261003ABZP-DI1@R1 | RM261003ABZP-US1@R1 | RM261003ABZP-UV2@R1 |
| RM261003ABZP-M2@R1, RM261003ABZP-M1@R1; Acceptance; AD3 | RM261003ABZP-UREQ3@R1 - Live preview rendering, reveal, and view modes | RM261003ABZP-UDES3@R1 - Surface: Editor window | RM261003ABZP-PH2@R1 / RM261003ABZP-DI3@R1 | RM261003ABZP-US2@R1 | RM261003ABZP-UV3@R1 |
| RM261003ABZP-M2@R1; Acceptance; AD3 | RM261003ABZP-UREQ4@R1 - Rich blocks, embeds, and images | RM261003ABZP-UDES4@R1 - Surface: Editor window | RM261003ABZP-PH2@R1 / RM261003ABZP-DI3@R1 | RM261003ABZP-US2@R1 | RM261003ABZP-UV3@R1 |
| RM261003ABZP-M3@R1; Acceptance; AD1; AD3 | RM261003ABZP-UREQ5@R1 - Discovery overlays | RM261003ABZP-UDES5@R1 - Surface: Overlays; Component: Which-key, Picker, Command line | RM261003ABZP-PH1@R1 / RM261003ABZP-DI2@R1 | RM261003ABZP-US3@R1 | RM261003ABZP-UV4@R1 |
| RM261003ABZP-M3@R1, RM261003ABZP-M4@R1; Acceptance; AD3 | RM261003ABZP-UREQ6@R1 - Links: completion, following, jump list, backlinks, rename | RM261003ABZP-UDES6@R1 - Surface: Links and backlinks; Component: Completion popup, Prompt | RM261003ABZP-PH1@R1 / RM261003ABZP-DI2@R1 (unresolved-link styling: RM261003ABZP-DI3@R1) | RM261003ABZP-US4@R1 | RM261003ABZP-UV5@R1 |
| RM261003ABZP-M4@R1, RM261003ABZP-M1@R1; Acceptance; AD3 | RM261003ABZP-UREQ7@R1 - Explorer file operations and disk-change handling | RM261003ABZP-UDES7@R1 - Surface: File operations and disk changes; Component: Prompt, Conflict dialog and diff | RM261003ABZP-PH1@R1 / RM261003ABZP-DI1@R1 (link-impact text on move: RM261003ABZP-DI2@R1) | RM261003ABZP-US5@R1 | RM261003ABZP-UV6@R1 |
| RM261003ABZP-M5@R2; Acceptance; feedback cycle 1; AD2; AD3 | RM261003ABZP-UREQ8@R2 - Daily notes, date picker, and templates | RM261003ABZP-UDES8@R1 - Surface: Daily notes and templates; Component: Calendar, Picker | RM261003ABZP-PH2@R1 / RM261003ABZP-DI4@R1 | RM261003ABZP-US6@R1 | RM261003ABZP-UV7@R1 |
| RM261003ABZP-M6@R1; Acceptance; AD3 | RM261003ABZP-UREQ9@R1 - Bases table and Kanban views | RM261003ABZP-UDES9@R1 - Surface: Bases views; Component: Base table, Kanban board | RM261003ABZP-PH2@R1 / RM261003ABZP-DI4@R1 | RM261003ABZP-US7@R1 | RM261003ABZP-UV8@R1 |
| RM261003ABZP-M7@R1; Acceptance; AD3 | RM261003ABZP-UREQ10@R1 - Browser preview page | RM261003ABZP-UDES10@R1 - Surface: Browser preview page | RM261003ABZP-PH2@R1 / RM261003ABZP-DI3@R1 | RM261003ABZP-US8@R1 | RM261003ABZP-UV9@R1 |
| RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (RM261003ABZP-M5@R2); Acceptance; AD3 | RM261003ABZP-UREQ11@R1 - Themes, NO_COLOR, narrow terminals, input, accessibility | RM261003ABZP-UDES11@R1 - Section 5 policies; Component: Theme | RM261003ABZP-PH1@R1 / RM261003ABZP-DI1@R1, RM261003ABZP-DI2@R1; RM261003ABZP-PH2@R1 / RM261003ABZP-DI3@R1, RM261003ABZP-DI4@R1 (each DI for its own surfaces) | RM261003ABZP-US9@R1 | RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R1 |

## Deferred Scope

- **Vim macros, Visual block mode, and Ex ranges**
  - **Reason:** They are outside the core command set that v1 needs.
  - **Revisit trigger:** User demand after `v1.0.0`.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-DES4@R1 Tradeoffs
- **Plugin API**
  - **Reason:** Registries cover the known extension needs; a public API would be speculative.
  - **Revisit trigger:** A concrete third-party extension need.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-REQ11@R2
- **macOS signing and notarization**
  - **Reason:** Unsigned binaries with checksums keep CD fast and lean.
  - **Revisit trigger:** Gatekeeper friction reported by users, or distribution through Homebrew cask.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-RF3; RM261003ABZP-DES15@R1 Tradeoffs
- **Cards, List, and Map Bases layouts**
  - **Reason:** v1 renders table and Kanban; other layouts open as a table with a notice.
  - **Revisit trigger:** Obsidian stabilizes these layouts and users request them.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-REQ7@R2
- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** These are outside the terminal editor's v1 scope.
  - **Revisit trigger:** A new initiative.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations

## Unresolved Items

None. The pinned OpenTUI paint and image APIs, recursive `fs.watch`, and the Kanban `type` value are delivery confirmations owned by DI1 and DI4, with named verification. They are not open decisions. The user's own review of the mockups is pending: acceptance was delegated, and the user said they will review via the mockups. Feedback from that review enters through the revision rules (mockup edit cycle → UREQ/UDES revisions → affected PH/DI revisions).

## Approval

- **Approved phases:** RM261003ABZP-PH1@R1, RM261003ABZP-PH2@R1
- **Approved delivery items:** RM261003ABZP-DI1@R1, RM261003ABZP-DI2@R1, RM261003ABZP-DI3@R1, RM261003ABZP-DI4@R1
- **Approved phase designs:**
  - `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Phase Design (RM261003ABZP-PH1@R1). Upstream: RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R1, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R2, RM261003ABZP-DES8@R1, RM261003ABZP-DES10@R1, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1; RM261003ABZP-UDES1@R1, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES5@R1, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R1, RM261003ABZP-UDES11@R1.
  - `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Phase Design (RM261003ABZP-PH2@R1). Upstream: RM261003ABZP-DES1@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R2, RM261003ABZP-DES10@R1, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R1, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1; RM261003ABZP-UDES1@R1, RM261003ABZP-UDES3@R1, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R1, RM261003ABZP-UDES11@R1.
- **Approval evidence:** On 2026-10-03 the user delegated all decisions: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … just stop when finish the skill workflow then I will review via mockups … don't raise any question to me". The user also asked to "prevent many DIs and phases split". Under that delegation the agent approved:
  - the two-phase, four-DI arrangement planned in the proposal (PH1 DI1 + DI2; PH2 DI3 + DI4);
  - releases at phase exit (`v0.1.0`, `v1.0.0`);
  - the phase refinements in both phase files.
````

- **RM261003ABZP-PH1@R2, RM261003ABZP-PH2@R2, RM261003ABZP-DI1@R2 … RM261003ABZP-DI4@R2 — Post-DI1 baseline update and DI1 delivery**
  - **Archived at:** 2026-10-03T11:56:27Z
  - **Change type:** Baseline update
  - **Reason:** DI1 merged (W261003HEGE, PR #1, `c98aa19`). Its approved refinements moved upstream to RM261003ABZP-REQ10@R3, RM261003ABZP-DES8@R2, and RM261003ABZP-DES15@R2.
  - **Changes:** Approved inputs, coverage, research lineage (`current` pointers), key constraints, and approval upstream lists cite the new revisions. The OpenTUI confirmation constraint records DI1's results and leaves the image API with DI3, matching the PH2 file. PH1 delivery status In progress; DI1 Work W261003HEGE and PR #1; Work Progress rows for DI1 (delivered, aligned) and DI2 (G1 met, aligned); Unresolved Items record which confirmations are done.
  - **Input baseline:** RM261003ABZP-REQ10@R2, RM261003ABZP-DES8@R1, RM261003ABZP-DES15@R1 → RM261003ABZP-REQ10@R3, RM261003ABZP-DES8@R2, RM261003ABZP-DES15@R2; UI baseline unchanged
  - **Phase order:** Unchanged
  - **Baseline transitions:**
    - None - PH1@R2, PH2@R2, DI1@R2 … DI4@R2 retained; see the phase revision files and `rm261003abzp-design-revisions.md`, `rm261003abzp-requirements-revisions.md`
  - **Evidence:** `.s1mple/work/done/w261003hege-editor-foundation/w261003hege-system-design.md` Parent Synchronization items 1–7; `reports/overall-verification-report.md`; `gh pr list` - PR #1 MERGED 2026-10-03T11:00:09Z.
  - **Research provenance:** None
  - **Approval evidence:** Synchronization approved by the user on 2026-10-03; phase design baselines PH1@R2 and PH2@R2 retained.
  - **Downstream impact:** W261003HEGE is delivered against DI1@R2 and needs no reconciliation. UI artifacts keep REQ10@R2, DES8@R1, and DES15@R1 as their approved system baseline; the parts they depend on did not change. DI2's discussion binds this baseline.

````markdown
# RM261003ABZP: so v1 — Roadmap Index

- **Status:** Approved
- **Outcome:** `so` ships as a fast, vim-modal, Markdown-first terminal editor for a plain notes folder. It has Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, and is released as checksummed binaries for macOS and Linux. Its language-neutral editor core opens any text file in source view and leaves room for code editing and notebooks later.
- **History:** `rm261003abzp-roadmap-index-revisions.md`

Phase files hold the complete PH and DI definitions. This index holds their current references and the delivery order. `Approved` describes the roadmap baseline, not delivered work. No Work, PR, implementation, or verification result exists yet.

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
  - RM261003ABZP-REQ10@R2 - Fast development, CI, and release
  - RM261003ABZP-REQ11@R3 - Maintainable, standards-based, language-neutral foundations
  - RM261003ABZP-DES1@R2 - One process, one package, four layers, and a language-neutral kernel, with a tested import boundary
  - RM261003ABZP-DES2@R2 - One store with a pure reducer and data-only effects
  - RM261003ABZP-DES3@R1 - Line-array TextBuffer with vim undo blocks
  - RM261003ABZP-DES4@R1 - Table-driven vim engine
  - RM261003ABZP-DES5@R2 - Command registry and file-type-scoped keymap trie as the single extension point for actions
  - RM261003ABZP-DES6@R1 - micromark/mdast with Obsidian extensions and block-level reparse
  - RM261003ABZP-DES7@R3 - Worker-built in-memory index with a documented resolution rule
  - RM261003ABZP-DES8@R1 - Atomic saves, directory watching, own-write stamps, and trash adapters
  - RM261003ABZP-DES9@R3 - Viewport-only text view with decorations; Markdown live preview as a decoration provider
  - RM261003ABZP-DES10@R2 - OpenTUI shell with editor-kind views, widget painters, normalized input, and guaranteed terminal restore
  - RM261003ABZP-DES11@R1 - Moment-subset formatter, template expansion, and daily-note commands
  - RM261003ABZP-DES12@R2 - Ported Bases engine as a registered `base` editor kind, with table and Kanban view models and YAML-preserving write-back
  - RM261003ABZP-DES13@R2 - `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering
  - RM261003ABZP-DES14@R1 - TOML config at the XDG path; per-workspace state at the XDG state path
  - RM261003ABZP-DES15@R1 - Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile
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
  - The import boundary test (including the kernel rule) and the CI gates exist from the first PR (RM261003ABZP-DES1@R2, RM261003ABZP-DES15@R1).
  - The kernel stays language-neutral: later DIs add Markdown views, links, and Bases as registrations (file types, decoration providers, commands, editor kinds), never as kernel changes (RM261003ABZP-DES17@R1).
  - DI1 confirms the `@opentui/core` paint and image APIs at the pinned version and checks recursive `fs.watch` on macOS and Linux before later DIs depend on them (RM261003ABZP-DES10@R2, RM261003ABZP-DES8@R1).
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
   - **Delivery status:** Not started
   - **Progress evidence:** None
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
| RM261003ABZP-DI1@R2 | `so [path]` opens a folder in an OpenTUI shell. The user edits notes and any other UTF-8 text file (source view with syntax colouring; binary and over-16 MiB files refused) with the core vim command set, splits, and buffers, and saves atomically with autosave, BOM and line endings kept, external-change handling, and explorer create/rename/move/trash. The language-neutral kernel (file-type registry, `layoutText` with decorations, highlighter), tooling, CI, release binaries, the boundary test, and the bench harness ship with it. | RM261003ABZP-PH1@R2 | None | Pending | Pending |
| RM261003ABZP-DI2@R2 | Leader with which-key, the picker family (all files, text search), palette and help filtered by file type, file-type-scoped keymaps, TOML config, and persisted recents and jumps. Obsidian links, tags, backlinks with link-mention, `[[` completion, and link-safe rename/move, all over a worker-built index. | RM261003ABZP-PH1@R2 | RM261003ABZP-DI1@R2 | Pending | Pending |
| RM261003ABZP-DI3@R2 | Live preview as a decoration provider with reveal, rich blocks, folds, embeds, image tiers, and live/source/reading modes. `:Preview` shows a read-only browser mirror over SSE. Final keystroke benchmarks and registration-only extension proof. | RM261003ABZP-PH2@R2 | RM261003ABZP-DI2@R2 | Pending | Pending |
| RM261003ABZP-DI4@R2 | `:Today`/`:Yesterday`/`:Tomorrow`, the calendar picker, template insertion, and new-note-from-template. `.base` files open as a registered editor kind with editable table and Kanban views and frontmatter write-back, plus `![[file.base]]` embeds. | RM261003ABZP-PH2@R2 | RM261003ABZP-DI2@R2; RM261003ABZP-DI3@R2 (embed gate only) | Pending | Pending |

Each DI maps to exactly one future Work and one PR. No W or PR is assigned yet.

## Work Progress

| DI | Work stage | Contract health | Next gate / blocker | Evidence | Checked at |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | Not started | Not assessed | Start `s1mple-discuss` for DI1 | None | 2026-10-03T04:30:49Z (baseline R2 approval) |
| RM261003ABZP-DI2@R2 | Not started | Not assessed | DI1 merged (PH1 gate G1) | None | 2026-10-03T04:30:49Z (baseline R2 approval) |
| RM261003ABZP-DI3@R2 | Not started | Not assessed | PH1 exit and DI2 merged (PH2 gate G2) | None | 2026-10-03T04:30:49Z (baseline R2 approval) |
| RM261003ABZP-DI4@R2 | Not started | Not assessed | PH1 exit and DI2 merged (PH2 gate G3); DI3 embed gate G4 before embed execution | None | 2026-10-03T04:30:49Z (baseline R2 approval) |

These rows are evidence-backed snapshots, not live telemetry. Delivery status stays in Phase Sequence and in each phase's Progress. Resolve W and PR identities through the Delivery Items ledger. A row stays `Not assessed` until its relevant baseline and coverage have been checked.

The main orchestrator updates authorized index and phase links, and progress, together after re-reading both. Without parent-write authorization, it records the exact pending changes and evidence in the current W artifact's synchronization receipt instead of modifying this index.

## Coverage

| Requirement | Research support | Design | Phase / DI | Success | Verification |
|---|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-RF11 - atomic save, directory watching, undoable reload | RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-RF5 - Esc timeout, kitty keyboard; RM261003ABZP-RF6 - line array, undo block | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, commands, config, state, file-type scope | RM261003ABZP-RF15 - TOML, XDG, state home | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI2@R2 (registry and keymap core in RM261003ABZP-DI1@R2) | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename | RM261003ABZP-RF8 - documented resolution rule | RM261003ABZP-DES7@R3, RM261003ABZP-DES6@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI2@R2 | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-RF4 - kitty/sixel/blocks; RM261003ABZP-RF7 - block reparse, reveal | RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-RF10 - Moment tokens, `{{time:F}}`, subfolders | RM261003ABZP-DES11@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI4@R2 | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-RF9 - layouts, Kanban rules | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI4@R2 | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - browser preview | RM261003ABZP-RF12 - binding, Host check, containment, SSE | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-RF2 - in-process frame metrics | RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1 (highlighting look-back) | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 (harness), RM261003ABZP-DI2@R2 (V13); RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 (V12) | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R2 - development, CI, release | RM261003ABZP-RF3 - compile embeds native lib; RM261003ABZP-RF13 - TS 7, no TS API; RM261003ABZP-RF14 - release-please | RM261003ABZP-DES15@R1, RM261003ABZP-DES1@R2 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-RF1 - contain OpenTUI; RM261003ABZP-RF4; RM261003ABZP-RF5; RM261003ABZP-RF6; RM261003ABZP-RF13; RM261003ABZP-RF14; RM261003ABZP-RF15 | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 (V15, V17, V18); RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 (V16), RM261003ABZP-DI4@R2 (`base` editor kind) | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

- **Research lineage:**
  - RM261003ABZP-RF1:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF2:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
  - RM261003ABZP-RF3:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
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
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF14:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2
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
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-RF3; RM261003ABZP-DES15@R1 Tradeoffs
- **Cards, List, and Map Bases layouts**
  - **Reason:** v1 renders table and Kanban; other layouts open as a table with a notice.
  - **Revisit trigger:** Obsidian stabilizes these layouts and users request them.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-REQ7@R2
- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** These are outside the terminal editor's v1 scope.
  - **Revisit trigger:** A new initiative.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations

## Unresolved Items

None. The pinned OpenTUI paint and image APIs, recursive `fs.watch`, the `lowlight` language set, and the Kanban `type` value are delivery confirmations owned by DI1 and DI4, with named verification. They are not open decisions. The user's own review of the mockups is pending: acceptance was delegated, and the user said they will review via the mockups. Feedback from that review enters through the revision rules (mockup edit cycle → UREQ/UDES revisions → affected PH/DI revisions); it also covers the AD4 states, which reuse accepted visuals without their own mockup.

## Approval

- **Approved phases:** RM261003ABZP-PH1@R2, RM261003ABZP-PH2@R2
- **Approved delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2, RM261003ABZP-DI3@R2, RM261003ABZP-DI4@R2
- **Approved phase designs:**
  - `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Phase Design (RM261003ABZP-PH1@R2). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view), RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1.
  - `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Phase Design (RM261003ABZP-PH2@R2). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R1, RM261003ABZP-UDES11@R1.
- **Approval evidence:**
  - R1 baseline: on 2026-10-03 the user delegated all decisions: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … just stop when finish the skill workflow then I will review via mockups … don't raise any question to me". The user also asked to "prevent many DIs and phases split". Under that delegation the agent approved the two-phase, four-DI arrangement, releases at phase exit (`v0.1.0`, `v1.0.0`), and the phase refinements in both phase files.
  - Current baseline: on 2026-10-03 the user asked to leave room for a code editor and notebooks ("The design should be stable, simple, easy to maintain and extend + meet industry standards") and selected "Apply all six (Recommended)" (`rm261003abzp-roadmap-context.md@R2`). Under the standing delegation the agent approved the revised baselines PH1@R2 and PH2@R2 with the same phase order, DI split, gates, and releases.
````

- **RM261003ABZP-PH1@R2, RM261003ABZP-PH2@R2, RM261003ABZP-DI1@R2 … RM261003ABZP-DI4@R2 — Post-DI2 baseline update and DI2 delivery**
  - **Archived at:** 2026-10-03T21:59:02Z
  - **Change type:** Baseline update
  - **Reason:** DI2 merged (W261003FX70, PR #2, `9adb285`). Its approved refinements moved upstream to RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, and RM261003ABZP-DES15@R3.
  - **Changes:** Approved inputs, key constraints, coverage, and approval upstream lists cite the new revisions. PH1 progress evidence names both merges and keeps the PH1 exit record and `v0.1.0` pending. DI2 Work W261003FX70 and PR #2. Work Progress: DI2 delivered and aligned, with the open V13 evidence decision and the ungated max indexing keystroke latency; DI3 and DI4 aligned, their G2 and G3 outputs merged, and both waiting for the PH1 exit record.
  - **Input baseline:** RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R2 → RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R3; requirements and UI baseline unchanged
  - **Phase order:** Unchanged
  - **Baseline transitions:**
    - None - PH1@R2, PH2@R2, DI1@R2 … DI4@R2 retained; see the phase revision files and `rm261003abzp-design-revisions.md`
  - **Evidence:** `.s1mple/work/done/w261003fx70-navigation-and-links/w261003fx70-system-design.md` section 1, Parent Synchronization rows 1–9; `w261003fx70-goal.md` deviations D1–D4; `reports/overall-verification-report.md`; `gh pr view 2` - merged 2026-10-03T21:50:57Z with `check`, `test (ubuntu-24.04)`, and `test (macos-15)` succeeded.
  - **Research provenance:** None
  - **Approval evidence:** Synchronization approved by the user on 2026-10-04; phase design baselines PH1@R2 and PH2@R2 retained.
  - **Downstream impact:** W261003FX70 is delivered against DI2@R2 and needs no reconciliation; W261003HEGE is unaffected. UI artifacts keep DES6@R1, DES7@R3, DES14@R1, and DES15@R1 as their approved system baseline; the behaviour they depend on did not change. The DI3 and DI4 discussions bind this baseline.

````markdown
# RM261003ABZP: so v1 — Roadmap Index

- **Status:** Approved
- **Outcome:** `so` ships as a fast, vim-modal, Markdown-first terminal editor for a plain notes folder. It has Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, and is released as checksummed binaries for macOS and Linux. Its language-neutral editor core opens any text file in source view and leaves room for code editing and notebooks later.
- **History:** `rm261003abzp-roadmap-index-revisions.md`

Phase files hold the complete PH and DI definitions. This index holds their current references and the delivery order. `Approved` describes the roadmap baseline, not delivered work. DI1 is delivered by W261003HEGE in PR #1; see Work Progress.

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
  - RM261003ABZP-DES6@R1 - micromark/mdast with Obsidian extensions and block-level reparse
  - RM261003ABZP-DES7@R3 - Worker-built in-memory index with a documented resolution rule
  - RM261003ABZP-DES8@R2 - Atomic saves, directory watching, own-write stamps, and trash adapters
  - RM261003ABZP-DES9@R3 - Viewport-only text view with decorations; Markdown live preview as a decoration provider
  - RM261003ABZP-DES10@R2 - OpenTUI shell with editor-kind views, widget painters, normalized input, and guaranteed terminal restore
  - RM261003ABZP-DES11@R1 - Moment-subset formatter, template expansion, and daily-note commands
  - RM261003ABZP-DES12@R2 - Ported Bases engine as a registered `base` editor kind, with table and Kanban view models and YAML-preserving write-back
  - RM261003ABZP-DES13@R2 - `Bun.serve` preview with Host allowlist, SSE, and pure HTML rendering
  - RM261003ABZP-DES14@R1 - TOML config at the XDG path; per-workspace state at the XDG state path
  - RM261003ABZP-DES15@R2 - Bun-native toolchain, two-job CI, release-please, and single-runner cross-compile
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
  - The import boundary test (including the kernel rule) and the CI gates exist from the first PR (RM261003ABZP-DES1@R2, RM261003ABZP-DES15@R2).
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
   - **Progress evidence:** RM261003ABZP-DI1@R2 merged to `main` as `c98aa19` (PR #1) with CI green; DI2 and the PH1 exit evidence are pending.
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
| RM261003ABZP-DI2@R2 | Leader with which-key, the picker family (all files, text search), palette and help filtered by file type, file-type-scoped keymaps, TOML config, and persisted recents and jumps. Obsidian links, tags, backlinks with link-mention, `[[` completion, and link-safe rename/move, all over a worker-built index. | RM261003ABZP-PH1@R2 | RM261003ABZP-DI1@R2 | Pending | Pending |
| RM261003ABZP-DI3@R2 | Live preview as a decoration provider with reveal, rich blocks, folds, embeds, image tiers, and live/source/reading modes. `:Preview` shows a read-only browser mirror over SSE. Final keystroke benchmarks and registration-only extension proof. | RM261003ABZP-PH2@R2 | RM261003ABZP-DI2@R2 | Pending | Pending |
| RM261003ABZP-DI4@R2 | `:Today`/`:Yesterday`/`:Tomorrow`, the calendar picker, template insertion, and new-note-from-template. `.base` files open as a registered editor kind with editable table and Kanban views and frontmatter write-back, plus `![[file.base]]` embeds. | RM261003ABZP-PH2@R2 | RM261003ABZP-DI2@R2; RM261003ABZP-DI3@R2 (embed gate only) | Pending | Pending |

Each DI maps to exactly one Work and one PR. RM261003ABZP-DI1@R2 is assigned W261003HEGE and PR #1; the others are pending.

## Work Progress

| DI | Work stage | Contract health | Next gate / blocker | Evidence | Checked at |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | Deliver (merged) | Aligned | None — G1 closed; open, not blocking: manual macOS Trash check (W261003HEGE V11.4) and the `v0.1.0-rc.1` release dry run (RM261003ABZP-V14@R1) | `.s1mple/work/done/w261003hege-editor-foundation/reports/overall-verification-report.md` (all groups accepted, no findings); PR #1 merged 2026-10-03T11:00:09Z; checked against REQ10@R3, DES8@R2, DES15@R2 | 2026-10-03T11:56:27Z |
| RM261003ABZP-DI2@R2 | Not started | Aligned | Start `s1mple-discuss` for DI2 (G1 met) | G1 outputs exist at `c98aa19` (W261003HEGE overall verification, Roadmap Contract Evidence); branch `feat/rm261003abzp-di2-navigation-and-links` | 2026-10-03T11:56:27Z |
| RM261003ABZP-DI3@R2 | Not started | Not assessed | PH1 exit and DI2 merged (PH2 gate G2) | None | 2026-10-03T04:30:49Z (baseline R2 approval) |
| RM261003ABZP-DI4@R2 | Not started | Not assessed | PH1 exit and DI2 merged (PH2 gate G3); DI3 embed gate G4 before embed execution | None | 2026-10-03T04:30:49Z (baseline R2 approval) |

These rows are evidence-backed snapshots, not live telemetry. Delivery status stays in Phase Sequence and in each phase's Progress. Resolve W and PR identities through the Delivery Items ledger. A row stays `Not assessed` until its relevant baseline and coverage have been checked.

The main orchestrator updates authorized index and phase links, and progress, together after re-reading both. Without parent-write authorization, it records the exact pending changes and evidence in the current W artifact's synchronization receipt instead of modifying this index.

## Coverage

| Requirement | Research support | Design | Phase / DI | Success | Verification |
|---|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-RF11 - atomic save, directory watching, undoable reload | RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-RF5 - Esc timeout, kitty keyboard; RM261003ABZP-RF6 - line array, undo block | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, commands, config, state, file-type scope | RM261003ABZP-RF15 - TOML, XDG, state home | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI2@R2 (registry and keymap core in RM261003ABZP-DI1@R2) | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename | RM261003ABZP-RF8 - documented resolution rule | RM261003ABZP-DES7@R3, RM261003ABZP-DES6@R1 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI2@R2 | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-RF4 - kitty/sixel/blocks; RM261003ABZP-RF7 - block reparse, reveal | RM261003ABZP-DES6@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-RF10 - Moment tokens, `{{time:F}}`, subfolders | RM261003ABZP-DES11@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI4@R2 | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-RF9 - layouts, Kanban rules | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI4@R2 | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - browser preview | RM261003ABZP-RF12 - binding, Host check, containment, SSE | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R1 | RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-RF2 - in-process frame metrics | RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1 (highlighting look-back) | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 (harness), RM261003ABZP-DI2@R2 (V13); RM261003ABZP-PH2@R2 / RM261003ABZP-DI3@R2 (V12) | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R3 - development, CI, release | RM261003ABZP-RF3 - compile embeds native lib; RM261003ABZP-RF13 - TS 7, no TS API; RM261003ABZP-RF14 - release-please | RM261003ABZP-DES15@R2, RM261003ABZP-DES1@R2 | RM261003ABZP-PH1@R2 / RM261003ABZP-DI1@R2 | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
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
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-RF3; RM261003ABZP-DES15@R2 Tradeoffs
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
  - `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Phase Design (RM261003ABZP-PH1@R2). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R2, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view), RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1.
  - `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Phase Design (RM261003ABZP-PH2@R2). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R2, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R1, RM261003ABZP-UDES11@R1.
- **Approval evidence:**
  - R1 baseline: on 2026-10-03 the user delegated all decisions: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … just stop when finish the skill workflow then I will review via mockups … don't raise any question to me". The user also asked to "prevent many DIs and phases split". Under that delegation the agent approved the two-phase, four-DI arrangement, releases at phase exit (`v0.1.0`, `v1.0.0`), and the phase refinements in both phase files.
  - Current baseline: on 2026-10-03 the user asked to leave room for a code editor and notebooks ("The design should be stable, simple, easy to maintain and extend + meet industry standards") and selected "Apply all six (Recommended)" (`rm261003abzp-roadmap-context.md@R2`). Under the standing delegation the agent approved the revised baselines PH1@R2 and PH2@R2 with the same phase order, DI split, gates, and releases.
  - Post-DI1 synchronization: approved by the user on 2026-10-03. The input baseline moved to RM261003ABZP-REQ10@R3, RM261003ABZP-DES8@R2, and RM261003ABZP-DES15@R2 with PH1@R2, PH2@R2, and DI1@R2 … DI4@R2 retained; DI1 progress, Work, and PR were recorded.
````

- **RM261003ABZP-PH1@R2, RM261003ABZP-PH2@R2 — Manual releases with a non-publishing dry run at phase exits**
  - **Archived at:** 2026-10-03T22:14:09Z
  - **Change type:** Scope change
  - **Reason:** On 2026-10-04 the user decided that nothing is released automatically: a release happens only when the user asks, through a pushed `v*` tag, and phase exits run a release dry run that publishes nothing. release-please had failed on every push to `main`, so no tag, release, or release pull request existed.
  - **Changes:** The outcome, first valuable release, key constraint on releases, dependency tree labels, PH1 and PH2 S10 exit criteria, PH1 progress evidence, the DI1 Work Progress note (the `v0.1.0-rc.1` dry run is superseded by the V14@R2 dry run; release-please is removed), the REQ10 coverage row, the success and verification definition list, and the approval section cite REQ10@R4, DES15@R4, S10@R2, V14@R2, PH1@R3, and PH2@R3.
  - **Input baseline:** RM261003ABZP-REQ10@R3, RM261003ABZP-DES15@R3 → RM261003ABZP-REQ10@R4, RM261003ABZP-DES15@R4; RM261003ABZP-S10@R1, RM261003ABZP-V14@R1 → RM261003ABZP-S10@R2, RM261003ABZP-V14@R2; UI baseline unchanged
  - **Phase order:** Unchanged
  - **Baseline transitions:**
    - RM261003ABZP-PH1@R2 → RM261003ABZP-PH1@R3; RM261003ABZP-PH2@R2 → RM261003ABZP-PH2@R3 - see the phase revision files
    - RM261003ABZP-DI1@R2 … RM261003ABZP-DI4@R2 - Revision retained
  - **Evidence:** user decision in this conversation on 2026-10-04; `gh run list --workflow release-please.yml` (every run failed with `GitHub Actions is not permitted to create or approve pull requests`); `gh release list` and remote tags empty.
  - **Research provenance:** None - RF14 (release-please) is superseded by the user decision.
  - **Approval evidence:** Approved by the user on 2026-10-04.
  - **Downstream impact:** W261003HEGE and W261003FX70 are delivered and need no reconciliation; release-please (delivered by W261003HEGE) is removed in the same pull request as this revision. The PH1 exit record needs the non-publishing dry run instead of a `v0.1.0` release. The DI3 and DI4 discussions bind PH2@R3.

````markdown
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
````

- **RM261003ABZP-PH2@R3, RM261003ABZP-DI3@R2 — DI3 design synchronization and DI3 work registration**
  - **Archived at:** 2026-10-03T23:53:33Z
  - **Change type:** Baseline update
  - **Reason:** The DI3 system design (W261003S6BQ, finalized at `7b9bfa6`, web images at `302bd9d`) records user decisions of 2026-10-04: KaTeX and Mermaid are served from the binary, and web images load in the terminal and in the browser preview. They revise RM261003ABZP-DES13, RM261003ABZP-UDES10, RM261003ABZP-UV9, RM261003ABZP-PH2, and RM261003ABZP-DI3. W261003S6BQ is assigned to DI3.
  - **Changes:** Approved inputs, the UI baseline, PH2 exit criteria, coverage, and approval cite the new revisions; the DES13 summary names the locally served KaTeX and Mermaid. PH2 delivery status In progress. DI3 Work W261003S6BQ (PR pending). Work Progress: DI3 in Discuss with `Needs reconciliation` until W261003S6BQ accepts the new baseline.
  - **Input baseline:** RM261003ABZP-DES13@R2, RM261003ABZP-UDES10@R1, RM261003ABZP-UV9@R1 → RM261003ABZP-DES13@R3, RM261003ABZP-UDES10@R2, RM261003ABZP-UV9@R2; requirements and the rest of the UI baseline unchanged
  - **Phase order:** Unchanged
  - **Baseline transitions:**
    - RM261003ABZP-PH2@R3 → RM261003ABZP-PH2@R4 - `rm261003abzp-roadmap-phase-2-obsidian-experience.md` and its revisions file
    - RM261003ABZP-DI3@R2 → RM261003ABZP-DI3@R3 - `rm261003abzp-roadmap-phase-2-obsidian-experience.md` and its revisions file
    - RM261003ABZP-PH1@R3, RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2, RM261003ABZP-DI4@R2 - Revision retained
  - **Evidence:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md` Assigned Parent Obligation Coverage, Pending parent synchronization items 1–9; `w261003s6bq-discuss-context.md` registration receipt; `rm261003abzp-design-revisions.md` and `rm261003abzp-ui-design-revisions.md` entries of this date.
  - **Research provenance:** None
  - **Approval evidence:** Approved by the user on 2026-10-04, including the PH2@R4 phase-design refinements.
  - **Downstream impact:** W261003S6BQ is bound to PH2@R3/DI3@R2 with DES13@R2, UDES10@R1, UV9@R1 and must accept PH2@R4/DI3@R3, DES13@R3, UDES10@R2, UV9@R2 through its own reconciliation history; its system design already matches. DI4@R2 and gate G4 are unaffected. `rm261003abzp-roadmap-phase-1-daily-usable-editor.md` (completed) keeps its out-of-scope pointer to DI3@R2.

````markdown
# RM261003ABZP: so v1 — Roadmap Index

- **Status:** Approved
- **Outcome:** `so` ships as a fast, vim-modal, Markdown-first terminal editor for a plain notes folder. It has Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, and can be released as checksummed binaries for macOS and Linux whenever the user asks. Its language-neutral editor core opens any text file in source view and leaves room for code editing and notebooks later.
- **History:** `rm261003abzp-roadmap-index-revisions.md`

Phase files hold the complete PH and DI definitions. This index holds their current references and the delivery order. `Approved` describes the roadmap baseline, not delivered work. DI1 is delivered by W261003HEGE in PR #1 and DI2 by W261003FX70 in PR #2, and PH1 is complete; see Work Progress.

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
  - RM261003ABZP-REQ10@R4 - Fast development, CI, and release
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
  - RM261003ABZP-DES15@R4 - Bun-native toolchain, two-job CI, manual tag releases, and single-runner cross-compile
  - RM261003ABZP-DES16@R1 - Performance by construction plus benchmark gates
  - RM261003ABZP-DES17@R1 - File-type registry, highlighter interface, and text-file open policy
  - The UI requirement and UI design revisions listed under UI baseline - the accepted terminal and browser experience (titles in UI Coverage below)

## Delivery Overview

- **First valuable release:** PH1 is the first release-ready state (a release such as `v0.1.0` is published only when the user asks). The user opens a folder, browses and manages notes and other text files, edits with vim keys and safe autosave, and finds and jumps between notes through the leader key, pickers, and wikilinks, with links kept intact on rename. This is the requirements' "Minimum valuable release".
- **Delivery approach:** There are two phases and four substantial DIs, following the user instruction to avoid splitting work into many DIs and phases.
  - PH1 (DI1 + DI2) delivers the daily-usable editor.
  - PH2 (DI3 + DI4) adds the Obsidian experience on top of it.
  - Each DI ships one user-visible capability with its own tests.
  - Internal layers (tooling, store, parser, index) ship inside the DI that first needs them, not as separate "foundation" items. The exception is DI1, which by design (RM261003ABZP-DES1@R2, Delivery constraints) must land the boundary test and CI before any feature code.
- **Key constraints:**
  - The import boundary test (including the kernel rule) and the CI gates exist from the first PR (RM261003ABZP-DES1@R2, RM261003ABZP-DES15@R4).
  - The kernel stays language-neutral: later DIs add Markdown views, links, and Bases as registrations (file types, decoration providers, commands, editor kinds), never as kernel changes (RM261003ABZP-DES17@R1).
  - DI1 confirmed the `@opentui/core` paint, buffer, and test-renderer APIs at 0.5.14 and recursive `fs.watch` on macOS and Linux (RM261003ABZP-DES10@R2, RM261003ABZP-DES8@R2). The image API was not exercised by DI1; the DI3 discussion confirms it before DI3 relies on it.
  - DI4 confirms the Kanban `type` constant against an Obsidian 1.14+ file before Kanban ships (RM261003ABZP-DES12@R2).
  - Nothing is released automatically. A release is published only when the user asks, from a pushed `v*` tag. Each phase exit runs the release workflow manually as a dry run that builds and smoke-tests the four binaries and publishes nothing (RM261003ABZP-REQ10@R4, RM261003ABZP-DES15@R4).
- **Dependencies and parallel opportunities:**

```text
RM261003ABZP-PH1@R3 — Daily-usable editor  (release-ready; v0.1.0 on request)
├── RM261003ABZP-DI1@R2 — Editor foundation: open folder → kernel + file types → vim edit any text file → safe autosave → explorer file ops
└── RM261003ABZP-DI2@R2 — Navigation and links: leader/which-key/pickers/palette/config, file-type keymaps → links, backlinks, rename
        (DI2 depends on DI1)

RM261003ABZP-PH2@R3 — Obsidian experience  (release-ready; v1.0.0 on request; depends on PH1)
├── RM261003ABZP-DI3@R2 — Live preview + browser preview  (depends on DI2)
└── RM261003ABZP-DI4@R2 — Daily notes, templates + Bases   (depends on DI2; gate on DI3 for the `base` embed renderer)

Parallel: DI3 and DI4 run in parallel once DI2 is merged. DI4 waits for DI3 only before
executing its `![[file.base]]` embed renderer (PH2 Cross-Work Dependency Gates).
```

## Phase Sequence

1. **RM261003ABZP-PH1@R3 — Daily-usable editor**
   - **Outcome:** A terminal user can open a notes folder and edit it daily — notes and any other text file — with vim keys, safe autosave, explorer file management, LazyVim-style discovery (leader, which-key, pickers, palette, help, config), and Obsidian-compatible links, backlinks, tags, and link-safe rename.
   - **Dependencies:** None
   - **Delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2
   - **Exit criteria:**
     - RM261003ABZP-S1@R1 - Notes are never lost or silently overwritten; verified by RM261003ABZP-V1@R1
     - RM261003ABZP-S2@R1 - The core vim command set behaves like Neovim; verified by RM261003ABZP-V2@R1, RM261003ABZP-V3@R1
     - RM261003ABZP-S3@R1 - Commands are discoverable and configurable; verified by RM261003ABZP-V4@R2
     - RM261003ABZP-S4@R1 - Links resolve deterministically, and rename and link-mention keep the graph intact; verified by RM261003ABZP-V5@R1, RM261003ABZP-V6@R2
     - RM261003ABZP-S9@R1 (startup and index part) - First frame < 200 ms and index < 3 s on 10,000 notes, with input staying responsive during indexing; verified by RM261003ABZP-V13@R1
     - RM261003ABZP-S10@R2 - Check < 30 s, CI < 3 min, a non-publishing release dry run produces four checksummed binaries that start; verified by RM261003ABZP-V14@R2
     - RM261003ABZP-S11@R1 (boundary and restore part) - Boundary violations, including kernel imports of language code, fail CI, and the terminal is restored on every exit path; verified by RM261003ABZP-V15@R2, RM261003ABZP-V17@R1
     - RM261003ABZP-S12@R1 - Any text file opens safely on a language-neutral core: source view with highlighting, binary and oversized files refused, BOM and line endings kept; verified by RM261003ABZP-V18@R1
     - RM261003ABZP-US1@R2 (PH1 states) - Shell, modes, and status are legible for every state delivered by DI1 and DI2; verified by RM261003ABZP-UV1@R2 (PH1 states), RM261003ABZP-UV2@R1
     - RM261003ABZP-US3@R2 - Commands, notes, and files are discoverable from the keyboard; verified by RM261003ABZP-UV4@R2
     - RM261003ABZP-US4@R1 - Link interactions show impact first; verified by RM261003ABZP-UV5@R1
     - RM261003ABZP-US5@R2 - File operations, refused files, and disk changes never surprise the user; verified by RM261003ABZP-UV6@R2
     - RM261003ABZP-US9@R1 (PH1 surfaces) - NO_COLOR, light theme, and 80×24 hold for the shell, explorer, prompts, overlays, and side panel; verified by RM261003ABZP-UV10@R1 (PH1 states)
   - **Delivery status:** Completed
   - **Progress evidence:** RM261003ABZP-DI1@R2 merged to `main` as `c98aa19` (PR #1) and RM261003ABZP-DI2@R2 as `9adb285` (PR #2), both with CI green. The PH1 exit record (phase file, Progress) holds the release dry run, the V13 and V14 readings, and the manual runs on macOS and Linux. `v0.1.0` is released only when the user asks.
   - **Details:** `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`

2. **RM261003ABZP-PH2@R3 — Obsidian experience**
   - **Outcome:** Notes render in Obsidian-style live preview with inline images, and `:Preview` mirrors them read-only in the browser. Daily notes and templates take one or two keystrokes. Bases open as editable tables and Kanban boards and embed in notes. Together this completes the v1 scope.
   - **Dependencies:** RM261003ABZP-PH1@R3 - the editor, store, command registry, kernel text view, file-type registry, highlighter, Doc parser, index, pickers, and prompts
   - **Delivery items:** RM261003ABZP-DI3@R2, RM261003ABZP-DI4@R2
   - **Exit criteria:**
     - RM261003ABZP-S5@R1 - Live preview renders Obsidian syntax and reveals source at the cursor; verified by RM261003ABZP-V7@R2, RM261003ABZP-V8@R1
     - RM261003ABZP-S6@R1 - Daily notes and templates match Obsidian output; verified by RM261003ABZP-V9@R1
     - RM261003ABZP-S7@R1 - Bases views evaluate and edit `.base` files; verified by RM261003ABZP-V10@R1
     - RM261003ABZP-S8@R1 - Preview is live, read-only, and local-only; verified by RM261003ABZP-V11@R3
     - RM261003ABZP-S9@R1 - All performance targets hold, including keystroke p95 < 16 ms in live preview and in a 5,000-line TypeScript file; verified by RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 (re-run)
     - RM261003ABZP-S10@R2 - Fast checks, CI, and the release dry run still hold at full scope; verified by RM261003ABZP-V14@R2 (dry run re-run at the PH2 exit)
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
| RM261003ABZP-DI1@R2 | `so [path]` opens a folder in an OpenTUI shell. The user edits notes and any other UTF-8 text file (source view with syntax colouring; binary and over-16 MiB files refused) with the core vim command set, splits, and buffers, and saves atomically with autosave, BOM and line endings kept, external-change handling, and explorer create/rename/move/trash. The language-neutral kernel (file-type registry, `layoutText` with decorations, highlighter), tooling, CI, release binaries, the boundary test, and the bench harness ship with it. | RM261003ABZP-PH1@R3 | None | W261003HEGE | PR #1 |
| RM261003ABZP-DI2@R2 | Leader with which-key, the picker family (all files, text search), palette and help filtered by file type, file-type-scoped keymaps, TOML config, and persisted recents and jumps. Obsidian links, tags, backlinks with link-mention, `[[` completion, and link-safe rename/move, all over a worker-built index. | RM261003ABZP-PH1@R3 | RM261003ABZP-DI1@R2 | W261003FX70 | PR #2 |
| RM261003ABZP-DI3@R2 | Live preview as a decoration provider with reveal, rich blocks, folds, embeds, image tiers, and live/source/reading modes. `:Preview` shows a read-only browser mirror over SSE. Final keystroke benchmarks and registration-only extension proof. | RM261003ABZP-PH2@R3 | RM261003ABZP-DI2@R2 | Pending | Pending |
| RM261003ABZP-DI4@R2 | `:Today`/`:Yesterday`/`:Tomorrow`, the calendar picker, template insertion, and new-note-from-template. `.base` files open as a registered editor kind with editable table and Kanban views and frontmatter write-back, plus `![[file.base]]` embeds. | RM261003ABZP-PH2@R3 | RM261003ABZP-DI2@R2; RM261003ABZP-DI3@R2 (embed gate only) | Pending | Pending |

Each DI maps to exactly one Work and one PR. RM261003ABZP-DI1@R2 is assigned W261003HEGE and PR #1, and RM261003ABZP-DI2@R2 W261003FX70 and PR #2; the others are pending.

## Work Progress

| DI | Work stage | Contract health | Next gate / blocker | Evidence | Checked at |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | Deliver (merged) | Aligned | None — G1 closed; open, not blocking: manual macOS Trash check (W261003HEGE V11.4); the `v0.1.0-rc.1` release dry run (RM261003ABZP-V14@R1) is superseded by the PH1 exit's non-publishing dry run (RM261003ABZP-V14@R2), and the release-please workflow DI1 delivered is removed | `.s1mple/work/done/w261003hege-editor-foundation/reports/overall-verification-report.md` (all groups accepted, no findings); PR #1 merged 2026-10-03T11:00:09Z; checked against REQ10@R3, DES8@R2, DES15@R2 | 2026-10-03T11:56:27Z |
| RM261003ABZP-DI2@R2 | Deliver (merged) | Aligned | None — G2 and G3 outputs merged; RM261003ABZP-V13@R1 is read on the reference machine, as RM261003ABZP-REQ9@R2 requires (PH1 exit record); open, not blocking: the ungated max keystroke latency while indexing (20–45 ms) | `.s1mple/work/done/w261003fx70-navigation-and-links/reports/overall-verification-report.md` (Passed; all five groups accepted, no findings); PR #2 merged 2026-10-03T21:50:57Z as `9adb285`; checked against DES6@R2, DES7@R4, DES14@R2, DES15@R3 | 2026-10-03T21:59:02Z |
| RM261003ABZP-DI3@R2 | Not started | Aligned | None — PH1 exit recorded and G2 outputs merged; next: the DI3 discussion, which confirms the OpenTUI image API | G2 outputs on `main` at `9adb285` (W261003FX70 overall verification, G2 table); PH1 exit record; PH2 baseline cites DES6@R2 | 2026-10-04T05:40:00Z |
| RM261003ABZP-DI4@R2 | Not started | Aligned | None — PH1 exit recorded and G3 outputs merged; DI3 embed gate G4 before embed execution; next: the DI4 discussion, which confirms the Kanban `type` value | G3 outputs on `main` at `9adb285` (W261003FX70 overall verification, G3 table); PH1 exit record | 2026-10-04T05:40:00Z |

These rows are evidence-backed snapshots, not live telemetry. Delivery status stays in Phase Sequence and in each phase's Progress. Resolve W and PR identities through the Delivery Items ledger. A row stays `Not assessed` until its relevant baseline and coverage have been checked.

The main orchestrator updates authorized index and phase links, and progress, together after re-reading both. Without parent-write authorization, it records the exact pending changes and evidence in the current W artifact's synchronization receipt instead of modifying this index.

## Coverage

| Requirement | Research support | Design | Phase / DI | Success | Verification |
|---|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-RF11 - atomic save, directory watching, undoable reload | RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-RF5 - Esc timeout, kitty keyboard; RM261003ABZP-RF6 - line array, undo block | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, commands, config, state, file-type scope | RM261003ABZP-RF15 - TOML, XDG, state home | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 (registry and keymap core in RM261003ABZP-DI1@R2) | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename | RM261003ABZP-RF8 - documented resolution rule | RM261003ABZP-DES7@R4, RM261003ABZP-DES6@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-RF4 - kitty/sixel/blocks; RM261003ABZP-RF7 - block reparse, reveal | RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2 | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-RF10 - Moment tokens, `{{time:F}}`, subfolders | RM261003ABZP-DES11@R1 | RM261003ABZP-PH2@R3 / RM261003ABZP-DI4@R2 | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-RF9 - layouts, Kanban rules | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R3 / RM261003ABZP-DI4@R2 | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - browser preview | RM261003ABZP-RF12 - binding, Host check, containment, SSE | RM261003ABZP-DES13@R2, RM261003ABZP-DES6@R2 | RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2 | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-RF2 - in-process frame metrics | RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1 (highlighting look-back) | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (harness), RM261003ABZP-DI2@R2 (V13); RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2 (V12) | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R4 - development, CI, release | RM261003ABZP-RF3 - compile embeds native lib; RM261003ABZP-RF13 - TS 7, no TS API; RM261003ABZP-RF14 - release-please (superseded by the manual-release decision) | RM261003ABZP-DES15@R4, RM261003ABZP-DES1@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-S10@R2 | RM261003ABZP-V14@R2 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-RF1 - contain OpenTUI; RM261003ABZP-RF4; RM261003ABZP-RF5; RM261003ABZP-RF6; RM261003ABZP-RF13; RM261003ABZP-RF14; RM261003ABZP-RF15 | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (V15, V17, V18); RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2 (V16), RM261003ABZP-DI4@R2 (`base` editor kind) | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

- **Research lineage:**
  - RM261003ABZP-RF1:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF2:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
  - RM261003ABZP-RF3:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
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
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF14:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF15:
    - evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
- **Success and verification definitions:**
  - RM261003ABZP-S1@R1 … RM261003ABZP-S12@R1 (with RM261003ABZP-S10@R2) and RM261003ABZP-V1@R1 … RM261003ABZP-V18@R1 (with RM261003ABZP-V4@R2, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V14@R2, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2) are owned by `rm261003abzp-design.md`, Success and Verification.
  - RM261003ABZP-US1@R2 … RM261003ABZP-US9@R1 and RM261003ABZP-UV1@R2 … RM261003ABZP-UV10@R1 (current revisions as listed under UI baseline) are owned by `rm261003abzp-ui-design.md`, UI Success Criteria and Implementation Verifications.
  - The phases define no new S or V records.

### UI Coverage

| Accepted mockup / feedback | UI requirement | UI design | Phase / DI | UI success | UI verification |
|---|---|---|---|---|---|
| RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ1@R2 - Application shell layout and status feedback | RM261003ABZP-UDES1@R2, RM261003ABZP-UDES11@R1 - Surface: Application shell; Component: Statusline, Toast stack | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (index and side-panel states: RM261003ABZP-DI2@R2); RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2 (view and preview segments) | RM261003ABZP-US1@R2 | RM261003ABZP-UV1@R2 |
| RM261003ABZP-M1@R1; Acceptance; AD3 | RM261003ABZP-UREQ2@R1 - Vim modes, cursor, and command line | RM261003ABZP-UDES2@R1 - Surface: Application shell; Component: Command line | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-US1@R2 | RM261003ABZP-UV2@R1 |
| RM261003ABZP-M2@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ3@R2 - Live preview rendering, reveal, view modes, and non-Markdown source view | RM261003ABZP-UDES3@R2 - Surface: Editor window | RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2 (non-Markdown source view: RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2; note keys scoped: RM261003ABZP-DI2@R2) | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M2@R1; Acceptance; AD3 | RM261003ABZP-UREQ4@R1 - Rich blocks, embeds, and images | RM261003ABZP-UDES4@R1 - Surface: Editor window | RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2 | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M3@R1; Acceptance; AD1; AD3; AD4 | RM261003ABZP-UREQ5@R2 - Discovery overlays | RM261003ABZP-UDES5@R2 - Surface: Overlays; Component: Which-key, Picker, Command line | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 | RM261003ABZP-US3@R2 | RM261003ABZP-UV4@R2 |
| RM261003ABZP-M3@R1, RM261003ABZP-M4@R1; Acceptance; AD3 | RM261003ABZP-UREQ6@R1 - Links: completion, following, jump list, backlinks, rename | RM261003ABZP-UDES6@R1 - Surface: Links and backlinks; Component: Completion popup, Prompt | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 (unresolved-link styling: RM261003ABZP-DI3@R2) | RM261003ABZP-US4@R1 | RM261003ABZP-UV5@R1 |
| RM261003ABZP-M4@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ7@R2 - Explorer file operations, refused files, and disk-change handling | RM261003ABZP-UDES7@R2 - Surface: File operations and disk changes; Component: Prompt, Conflict dialog and diff | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (link-impact text on move: RM261003ABZP-DI2@R2) | RM261003ABZP-US5@R2 | RM261003ABZP-UV6@R2 |
| RM261003ABZP-M5@R2; Acceptance; feedback cycle 1; AD2; AD3 | RM261003ABZP-UREQ8@R2 - Daily notes, date picker, and templates | RM261003ABZP-UDES8@R1 - Surface: Daily notes and templates; Component: Calendar, Picker | RM261003ABZP-PH2@R3 / RM261003ABZP-DI4@R2 | RM261003ABZP-US6@R1 | RM261003ABZP-UV7@R1 |
| RM261003ABZP-M6@R1; Acceptance; AD3 | RM261003ABZP-UREQ9@R1 - Bases table and Kanban views | RM261003ABZP-UDES9@R1 - Surface: Bases views; Component: Base table, Kanban board | RM261003ABZP-PH2@R3 / RM261003ABZP-DI4@R2 | RM261003ABZP-US7@R1 | RM261003ABZP-UV8@R1 |
| RM261003ABZP-M7@R1; Acceptance; AD3 | RM261003ABZP-UREQ10@R1 - Browser preview page | RM261003ABZP-UDES10@R1 - Surface: Browser preview page | RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2 | RM261003ABZP-US8@R1 | RM261003ABZP-UV9@R1 |
| RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (RM261003ABZP-M5@R2); Acceptance; AD3 | RM261003ABZP-UREQ11@R1 - Themes, NO_COLOR, narrow terminals, input, accessibility | RM261003ABZP-UDES11@R1 - Section 5 policies; Component: Theme | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2; RM261003ABZP-PH2@R3 / RM261003ABZP-DI3@R2, RM261003ABZP-DI4@R2 (each DI for its own surfaces) | RM261003ABZP-US9@R1 | RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R1 |

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
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-RF3; RM261003ABZP-DES15@R4 Tradeoffs
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

- **Approved phases:** RM261003ABZP-PH1@R3, RM261003ABZP-PH2@R3
- **Approved delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2, RM261003ABZP-DI3@R2, RM261003ABZP-DI4@R2
- **Approved phase designs:**
  - `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Phase Design (RM261003ABZP-PH1@R3). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R4, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view), RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1.
  - `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Phase Design (RM261003ABZP-PH2@R3). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R4, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R1, RM261003ABZP-UDES11@R1.
- **Approval evidence:**
  - R1 baseline: on 2026-10-03 the user delegated all decisions: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … just stop when finish the skill workflow then I will review via mockups … don't raise any question to me". The user also asked to "prevent many DIs and phases split". Under that delegation the agent approved the two-phase, four-DI arrangement, releases at phase exit (`v0.1.0`, `v1.0.0`), and the phase refinements in both phase files.
  - Current baseline: on 2026-10-03 the user asked to leave room for a code editor and notebooks ("The design should be stable, simple, easy to maintain and extend + meet industry standards") and selected "Apply all six (Recommended)" (`rm261003abzp-roadmap-context.md@R2`). Under the standing delegation the agent approved the revised baselines PH1@R2 and PH2@R2 with the same phase order, DI split, gates, and releases.
  - Post-DI1 synchronization: approved by the user on 2026-10-03. The input baseline moved to RM261003ABZP-REQ10@R3, RM261003ABZP-DES8@R2, and RM261003ABZP-DES15@R2 with PH1@R2, PH2@R2, and DI1@R2 … DI4@R2 retained; DI1 progress, Work, and PR were recorded.
  - Post-DI2 synchronization: approved by the user on 2026-10-04. The input baseline moved to RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, and RM261003ABZP-DES15@R3 with PH1@R2, PH2@R2, and DI1@R2 … DI4@R2 retained; DI2 progress, Work, and PR were recorded.
  - Manual releases: on 2026-10-04 the user decided that releases are manual (a `v*` tag pushed only on request) and that phase exits run a non-publishing release dry run. This produced RM261003ABZP-REQ10@R4, RM261003ABZP-DES15@R4, RM261003ABZP-S10@R2, RM261003ABZP-V14@R2, RM261003ABZP-PH1@R3, and RM261003ABZP-PH2@R3, with DI1@R2 … DI4@R2 retained.
````

- **RM261003ABZP-PH2@R4, RM261003ABZP-DI3@R3 — DI3 delivery synchronization and DI3 delivery**
  - **Archived at:** 2026-10-04T05:55:53Z
  - **Change type:** Baseline update
  - **Reason:** DI3 (W261003S6BQ, PR #6) merged to `main` as `e228bb5` on 2026-10-04. The user approved relaxed live-view and startup targets, and DI3's refinements moved upstream: RM261003ABZP-REQ9@R3, RM261003ABZP-DES17@R2, RM261003ABZP-V12@R3, and RM261003ABZP-V13@R2, producing RM261003ABZP-PH2@R5 and RM261003ABZP-DI3@R4.
  - **Changes:** Approved inputs, the PH2 exit criteria (S9 keystroke p95 < 24 ms in live preview and < 16 ms in the TypeScript file), the delivery flow, delivery items, coverage, research lineage (current REQ9@R3 noted), the success and verification list, and approval cite the new revisions. DI3 is delivered: PR #6 in the Delivery Items ledger; Work Progress DI3 `Deliver (merged)`; the DI4 row records G4 as satisfied. PH2 progress evidence records the DI3 merge. The key constraints and Unresolved Items record that DI3 confirmed the OpenTUI image API.
  - **Input baseline:** RM261003ABZP-REQ9@R2, RM261003ABZP-DES17@R1, RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 → RM261003ABZP-REQ9@R3, RM261003ABZP-DES17@R2, RM261003ABZP-V12@R3, RM261003ABZP-V13@R2; the UI baseline unchanged
  - **Phase order:** Unchanged
  - **Baseline transitions:**
    - RM261003ABZP-PH2@R4 → RM261003ABZP-PH2@R5 - `rm261003abzp-roadmap-phase-2-obsidian-experience.md` and its revisions file
    - RM261003ABZP-DI3@R3 → RM261003ABZP-DI3@R4 - `rm261003abzp-roadmap-phase-2-obsidian-experience.md` and its revisions file
    - RM261003ABZP-PH1@R3, RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2, RM261003ABZP-DI4@R2 - Revision retained
  - **Evidence:** `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-goal.md` (Completion Summary, Parent Synchronization); `reports/overall-verification-report.md`; PR #6 (merged 2026-10-04T05:41:17Z as `e228bb5`); `rm261003abzp-requirements-revisions.md`, `rm261003abzp-design-revisions.md`, `rm261003abzp-roadmap-phase-2-obsidian-experience-revisions.md`, `rm261003abzp-ui-requirements-revisions.md`, and `rm261003abzp-ui-design-revisions.md` entries of this date.
  - **Research provenance:** None
  - **Approval evidence:** Approved by the user on 2026-10-04.
  - **Downstream impact:** The PH1 exit criterion (S9 startup and index part, V13@R1), the DI1 and DI2 Work Progress rows, and the PH1 approved upstream list keep their delivered baselines. W261003S6BQ delivered against PH2@R4/DI3@R3 with the approved relaxation that PH2@R5/DI3@R4 record. DI4@R2 may execute its `![[file.base]]` embed renderer now that G4 is satisfied.

````markdown
# RM261003ABZP: so v1 — Roadmap Index

- **Status:** Approved
- **Outcome:** `so` ships as a fast, vim-modal, Markdown-first terminal editor for a plain notes folder. It has Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, and can be released as checksummed binaries for macOS and Linux whenever the user asks. Its language-neutral editor core opens any text file in source view and leaves room for code editing and notebooks later.
- **History:** `rm261003abzp-roadmap-index-revisions.md`

Phase files hold the complete PH and DI definitions. This index holds their current references and the delivery order. `Approved` describes the roadmap baseline, not delivered work. DI1 is delivered by W261003HEGE in PR #1 and DI2 by W261003FX70 in PR #2, and PH1 is complete. DI3 is in progress as W261003S6BQ; see Work Progress.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R2` - The repository is empty apart from the `.s1mple/` guidance. The user's scope change (R2) keeps v1 Markdown-first on a language-neutral core. Alfred (`../alfred`) supplies code that can be ported for Markdown parsing, Obsidian syntax, the vim core, terminal graphics, and Bases.
- **Requirements:** `rm261003abzp-requirements.md` (Approved); history: `rm261003abzp-requirements-revisions.md`
- **Design:** `rm261003abzp-design.md` (Approved); history: `rm261003abzp-design-revisions.md`
- **Research:** `rm261003abzp-research.md` (immutable; reconciliation Complete in the requirements)
- **UI baseline:**
  - UI context: `rm261003abzp-ui-context.md@R2`.
  - Accepted mockups (`ui-mockups/manifest.md`, shared R1, delegated acceptance): RM261003ABZP-M1@R1, RM261003ABZP-M2@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1; manifest AD4 (non-Markdown states reuse accepted visuals, Feedback Ledger cycle 2).
  - UI requirements (`Ready for UI Design`, `rm261003abzp-ui-requirements.md`): RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ3@R2, RM261003ABZP-UREQ4@R1, RM261003ABZP-UREQ5@R2, RM261003ABZP-UREQ6@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1 … RM261003ABZP-UREQ11@R1.
  - UI design (`Ready for Planning`, `rm261003abzp-ui-design.md`): RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R2, RM261003ABZP-UDES11@R1; RM261003ABZP-US1@R2, RM261003ABZP-US2@R2, RM261003ABZP-US3@R2, RM261003ABZP-US4@R1, RM261003ABZP-US5@R2, RM261003ABZP-US6@R1 … RM261003ABZP-US9@R1; RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1, RM261003ABZP-UV3@R2, RM261003ABZP-UV4@R2, RM261003ABZP-UV5@R1, RM261003ABZP-UV6@R2, RM261003ABZP-UV7@R1, RM261003ABZP-UV8@R1, RM261003ABZP-UV9@R2, RM261003ABZP-UV10@R1.
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
  - RM261003ABZP-REQ10@R4 - Fast development, CI, and release
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
  - RM261003ABZP-DES13@R3 - `Bun.serve` preview with Host allowlist, SSE, pure HTML rendering, and KaTeX and Mermaid served from the binary
  - RM261003ABZP-DES14@R2 - TOML config at the XDG path; per-workspace state at the XDG state path
  - RM261003ABZP-DES15@R4 - Bun-native toolchain, two-job CI, manual tag releases, and single-runner cross-compile
  - RM261003ABZP-DES16@R1 - Performance by construction plus benchmark gates
  - RM261003ABZP-DES17@R1 - File-type registry, highlighter interface, and text-file open policy
  - The UI requirement and UI design revisions listed under UI baseline - the accepted terminal and browser experience (titles in UI Coverage below)

## Delivery Overview

- **First valuable release:** PH1 is the first release-ready state (a release such as `v0.1.0` is published only when the user asks). The user opens a folder, browses and manages notes and other text files, edits with vim keys and safe autosave, and finds and jumps between notes through the leader key, pickers, and wikilinks, with links kept intact on rename. This is the requirements' "Minimum valuable release".
- **Delivery approach:** There are two phases and four substantial DIs, following the user instruction to avoid splitting work into many DIs and phases.
  - PH1 (DI1 + DI2) delivers the daily-usable editor.
  - PH2 (DI3 + DI4) adds the Obsidian experience on top of it.
  - Each DI ships one user-visible capability with its own tests.
  - Internal layers (tooling, store, parser, index) ship inside the DI that first needs them, not as separate "foundation" items. The exception is DI1, which by design (RM261003ABZP-DES1@R2, Delivery constraints) must land the boundary test and CI before any feature code.
- **Key constraints:**
  - The import boundary test (including the kernel rule) and the CI gates exist from the first PR (RM261003ABZP-DES1@R2, RM261003ABZP-DES15@R4).
  - The kernel stays language-neutral: later DIs add Markdown views, links, and Bases as registrations (file types, decoration providers, commands, editor kinds), never as kernel changes (RM261003ABZP-DES17@R1).
  - DI1 confirmed the `@opentui/core` paint, buffer, and test-renderer APIs at 0.5.14 and recursive `fs.watch` on macOS and Linux (RM261003ABZP-DES10@R2, RM261003ABZP-DES8@R2). The image API was not exercised by DI1; the DI3 discussion confirms it before DI3 relies on it.
  - DI4 confirms the Kanban `type` constant against an Obsidian 1.14+ file before Kanban ships (RM261003ABZP-DES12@R2).
  - Nothing is released automatically. A release is published only when the user asks, from a pushed `v*` tag. Each phase exit runs the release workflow manually as a dry run that builds and smoke-tests the four binaries and publishes nothing (RM261003ABZP-REQ10@R4, RM261003ABZP-DES15@R4).
- **Dependencies and parallel opportunities:**

```text
RM261003ABZP-PH1@R3 — Daily-usable editor  (release-ready; v0.1.0 on request)
├── RM261003ABZP-DI1@R2 — Editor foundation: open folder → kernel + file types → vim edit any text file → safe autosave → explorer file ops
└── RM261003ABZP-DI2@R2 — Navigation and links: leader/which-key/pickers/palette/config, file-type keymaps → links, backlinks, rename
        (DI2 depends on DI1)

RM261003ABZP-PH2@R4 — Obsidian experience  (release-ready; v1.0.0 on request; depends on PH1)
├── RM261003ABZP-DI3@R3 — Live preview + browser preview  (depends on DI2)
└── RM261003ABZP-DI4@R2 — Daily notes, templates + Bases   (depends on DI2; gate on DI3 for the `base` embed renderer)

Parallel: DI3 and DI4 run in parallel once DI2 is merged. DI4 waits for DI3 only before
executing its `![[file.base]]` embed renderer (PH2 Cross-Work Dependency Gates).
```

## Phase Sequence

1. **RM261003ABZP-PH1@R3 — Daily-usable editor**
   - **Outcome:** A terminal user can open a notes folder and edit it daily — notes and any other text file — with vim keys, safe autosave, explorer file management, LazyVim-style discovery (leader, which-key, pickers, palette, help, config), and Obsidian-compatible links, backlinks, tags, and link-safe rename.
   - **Dependencies:** None
   - **Delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2
   - **Exit criteria:**
     - RM261003ABZP-S1@R1 - Notes are never lost or silently overwritten; verified by RM261003ABZP-V1@R1
     - RM261003ABZP-S2@R1 - The core vim command set behaves like Neovim; verified by RM261003ABZP-V2@R1, RM261003ABZP-V3@R1
     - RM261003ABZP-S3@R1 - Commands are discoverable and configurable; verified by RM261003ABZP-V4@R2
     - RM261003ABZP-S4@R1 - Links resolve deterministically, and rename and link-mention keep the graph intact; verified by RM261003ABZP-V5@R1, RM261003ABZP-V6@R2
     - RM261003ABZP-S9@R1 (startup and index part) - First frame < 200 ms and index < 3 s on 10,000 notes, with input staying responsive during indexing; verified by RM261003ABZP-V13@R1
     - RM261003ABZP-S10@R2 - Check < 30 s, CI < 3 min, a non-publishing release dry run produces four checksummed binaries that start; verified by RM261003ABZP-V14@R2
     - RM261003ABZP-S11@R1 (boundary and restore part) - Boundary violations, including kernel imports of language code, fail CI, and the terminal is restored on every exit path; verified by RM261003ABZP-V15@R2, RM261003ABZP-V17@R1
     - RM261003ABZP-S12@R1 - Any text file opens safely on a language-neutral core: source view with highlighting, binary and oversized files refused, BOM and line endings kept; verified by RM261003ABZP-V18@R1
     - RM261003ABZP-US1@R2 (PH1 states) - Shell, modes, and status are legible for every state delivered by DI1 and DI2; verified by RM261003ABZP-UV1@R2 (PH1 states), RM261003ABZP-UV2@R1
     - RM261003ABZP-US3@R2 - Commands, notes, and files are discoverable from the keyboard; verified by RM261003ABZP-UV4@R2
     - RM261003ABZP-US4@R1 - Link interactions show impact first; verified by RM261003ABZP-UV5@R1
     - RM261003ABZP-US5@R2 - File operations, refused files, and disk changes never surprise the user; verified by RM261003ABZP-UV6@R2
     - RM261003ABZP-US9@R1 (PH1 surfaces) - NO_COLOR, light theme, and 80×24 hold for the shell, explorer, prompts, overlays, and side panel; verified by RM261003ABZP-UV10@R1 (PH1 states)
   - **Delivery status:** Completed
   - **Progress evidence:** RM261003ABZP-DI1@R2 merged to `main` as `c98aa19` (PR #1) and RM261003ABZP-DI2@R2 as `9adb285` (PR #2), both with CI green. The PH1 exit record (phase file, Progress) holds the release dry run, the V13 and V14 readings, and the manual runs on macOS and Linux. `v0.1.0` is released only when the user asks.
   - **Details:** `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`

2. **RM261003ABZP-PH2@R4 — Obsidian experience**
   - **Outcome:** Notes render in Obsidian-style live preview with inline images, and `:Preview` mirrors them read-only in the browser. Daily notes and templates take one or two keystrokes. Bases open as editable tables and Kanban boards and embed in notes. Together this completes the v1 scope.
   - **Dependencies:** RM261003ABZP-PH1@R3 - the editor, store, command registry, kernel text view, file-type registry, highlighter, Doc parser, index, pickers, and prompts
   - **Delivery items:** RM261003ABZP-DI3@R3, RM261003ABZP-DI4@R2
   - **Exit criteria:**
     - RM261003ABZP-S5@R1 - Live preview renders Obsidian syntax and reveals source at the cursor; verified by RM261003ABZP-V7@R2, RM261003ABZP-V8@R1
     - RM261003ABZP-S6@R1 - Daily notes and templates match Obsidian output; verified by RM261003ABZP-V9@R1
     - RM261003ABZP-S7@R1 - Bases views evaluate and edit `.base` files; verified by RM261003ABZP-V10@R1
     - RM261003ABZP-S8@R1 - Preview is live, read-only, and local-only; verified by RM261003ABZP-V11@R3
     - RM261003ABZP-S9@R1 - All performance targets hold, including keystroke p95 < 16 ms in live preview and in a 5,000-line TypeScript file; verified by RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 (re-run)
     - RM261003ABZP-S10@R2 - Fast checks, CI, and the release dry run still hold at full scope; verified by RM261003ABZP-V14@R2 (dry run re-run at the PH2 exit)
     - RM261003ABZP-S11@R1 - Foundations stay clean, and extension is registration-only; verified by RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1
     - RM261003ABZP-US1@R2 - Complete statusline segment order, including the `view` and `preview` segments; verified by RM261003ABZP-UV1@R2 (full)
     - RM261003ABZP-US2@R2 - Live preview looks and reveals like the accepted mockup; other files stay plain source; verified by RM261003ABZP-UV3@R2
     - RM261003ABZP-US6@R1 - Daily notes and templates take one or two keystrokes; verified by RM261003ABZP-UV7@R1
     - RM261003ABZP-US7@R1 - Bases editing is keyboard-fast and shows every write; verified by RM261003ABZP-UV8@R1
     - RM261003ABZP-US8@R1 - The browser page is a faithful, read-only, connection-aware mirror; verified by RM261003ABZP-UV9@R2
     - RM261003ABZP-US9@R1 - Every surface works under NO_COLOR, in light theme, and at 80×24; verified by RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R2
   - **Delivery status:** In progress
   - **Progress evidence:** None yet; RM261003ABZP-DI3@R3 is in discussion as W261003S6BQ (system design finalized)
   - **Details:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md`

## Delivery Items

| DI | Valuable outcome | Phase | Dependencies | Work | PR |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | `so [path]` opens a folder in an OpenTUI shell. The user edits notes and any other UTF-8 text file (source view with syntax colouring; binary and over-16 MiB files refused) with the core vim command set, splits, and buffers, and saves atomically with autosave, BOM and line endings kept, external-change handling, and explorer create/rename/move/trash. The language-neutral kernel (file-type registry, `layoutText` with decorations, highlighter), tooling, CI, release binaries, the boundary test, and the bench harness ship with it. | RM261003ABZP-PH1@R3 | None | W261003HEGE | PR #1 |
| RM261003ABZP-DI2@R2 | Leader with which-key, the picker family (all files, text search), palette and help filtered by file type, file-type-scoped keymaps, TOML config, and persisted recents and jumps. Obsidian links, tags, backlinks with link-mention, `[[` completion, and link-safe rename/move, all over a worker-built index. | RM261003ABZP-PH1@R3 | RM261003ABZP-DI1@R2 | W261003FX70 | PR #2 |
| RM261003ABZP-DI3@R3 | Live preview as a decoration provider with reveal, rich blocks, folds, embeds, image tiers, and live/source/reading modes. `:Preview` shows a read-only browser mirror over SSE. Final keystroke benchmarks and registration-only extension proof. | RM261003ABZP-PH2@R4 | RM261003ABZP-DI2@R2 | W261003S6BQ | Pending |
| RM261003ABZP-DI4@R2 | `:Today`/`:Yesterday`/`:Tomorrow`, the calendar picker, template insertion, and new-note-from-template. `.base` files open as a registered editor kind with editable table and Kanban views and frontmatter write-back, plus `![[file.base]]` embeds. | RM261003ABZP-PH2@R4 | RM261003ABZP-DI2@R2; RM261003ABZP-DI3@R3 (embed gate only) | Pending | Pending |

Each DI maps to exactly one Work and one PR. RM261003ABZP-DI1@R2 is assigned W261003HEGE and PR #1, RM261003ABZP-DI2@R2 W261003FX70 and PR #2, and RM261003ABZP-DI3@R3 W261003S6BQ with its PR pending; the others are pending.

## Work Progress

| DI | Work stage | Contract health | Next gate / blocker | Evidence | Checked at |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | Deliver (merged) | Aligned | None — G1 closed; open, not blocking: manual macOS Trash check (W261003HEGE V11.4); the `v0.1.0-rc.1` release dry run (RM261003ABZP-V14@R1) is superseded by the PH1 exit's non-publishing dry run (RM261003ABZP-V14@R2), and the release-please workflow DI1 delivered is removed | `.s1mple/work/done/w261003hege-editor-foundation/reports/overall-verification-report.md` (all groups accepted, no findings); PR #1 merged 2026-10-03T11:00:09Z; checked against REQ10@R3, DES8@R2, DES15@R2 | 2026-10-03T11:56:27Z |
| RM261003ABZP-DI2@R2 | Deliver (merged) | Aligned | None — G2 and G3 outputs merged; RM261003ABZP-V13@R1 is read on the reference machine, as RM261003ABZP-REQ9@R2 requires (PH1 exit record); open, not blocking: the ungated max keystroke latency while indexing (20–45 ms) | `.s1mple/work/done/w261003fx70-navigation-and-links/reports/overall-verification-report.md` (Passed; all five groups accepted, no findings); PR #2 merged 2026-10-03T21:50:57Z as `9adb285`; checked against DES6@R2, DES7@R4, DES14@R2, DES15@R3 | 2026-10-03T21:59:02Z |
| RM261003ABZP-DI3@R3 | Discuss | Aligned | None due — G2 met; W261003S6BQ binds PH2@R4/DI3@R3 (reconciled after `da4739d`); next: Plan | `.s1mple/work/active/w261003s6bq-live-and-browser-preview/w261003s6bq-system-design.md` (Finalized System Design, `7b9bfa6`, web images `302bd9d`); requirements `d00aef6`, `2358cb6`, `80dc193`, `588a78d`, `f8f6611`; binding reconciled in `w261003s6bq-discuss-context.md` (Previous Accepted Bindings); checked against PH2@R4, DI3@R3, DES13@R3, UDES10@R2, UV9@R2 | 2026-10-04T00:03:17Z |
| RM261003ABZP-DI4@R2 | Not started | Aligned | None — PH1 exit recorded and G3 outputs merged; DI3 embed gate G4 before embed execution; next: the DI4 discussion, which confirms the Kanban `type` value | G3 outputs on `main` at `9adb285` (W261003FX70 overall verification, G3 table); PH1 exit record | 2026-10-04T05:40:00Z |

These rows are evidence-backed snapshots, not live telemetry. Delivery status stays in Phase Sequence and in each phase's Progress. Resolve W and PR identities through the Delivery Items ledger. A row stays `Not assessed` until its relevant baseline and coverage have been checked.

The main orchestrator updates authorized index and phase links, and progress, together after re-reading both. Without parent-write authorization, it records the exact pending changes and evidence in the current W artifact's synchronization receipt instead of modifying this index.

## Coverage

| Requirement | Research support | Design | Phase / DI | Success | Verification |
|---|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-RF11 - atomic save, directory watching, undoable reload | RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-RF5 - Esc timeout, kitty keyboard; RM261003ABZP-RF6 - line array, undo block | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, commands, config, state, file-type scope | RM261003ABZP-RF15 - TOML, XDG, state home | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 (registry and keymap core in RM261003ABZP-DI1@R2) | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename | RM261003ABZP-RF8 - documented resolution rule | RM261003ABZP-DES7@R4, RM261003ABZP-DES6@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-RF4 - kitty/sixel/blocks; RM261003ABZP-RF7 - block reparse, reveal | RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3 | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-RF10 - Moment tokens, `{{time:F}}`, subfolders | RM261003ABZP-DES11@R1 | RM261003ABZP-PH2@R4 / RM261003ABZP-DI4@R2 | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-RF9 - layouts, Kanban rules | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-PH2@R4 / RM261003ABZP-DI4@R2 | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - browser preview | RM261003ABZP-RF12 - binding, Host check, containment, SSE | RM261003ABZP-DES13@R3, RM261003ABZP-DES6@R2 | RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3 | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R2 - performance | RM261003ABZP-RF2 - in-process frame metrics | RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1 (highlighting look-back) | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (harness), RM261003ABZP-DI2@R2 (V13); RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3 (V12) | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R2, RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R4 - development, CI, release | RM261003ABZP-RF3 - compile embeds native lib; RM261003ABZP-RF13 - TS 7, no TS API; RM261003ABZP-RF14 - release-please (superseded by the manual-release decision) | RM261003ABZP-DES15@R4, RM261003ABZP-DES1@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-S10@R2 | RM261003ABZP-V14@R2 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-RF1 - contain OpenTUI; RM261003ABZP-RF4; RM261003ABZP-RF5; RM261003ABZP-RF6; RM261003ABZP-RF13; RM261003ABZP-RF14; RM261003ABZP-RF15 | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (V15, V17, V18); RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3 (V16), RM261003ABZP-DI4@R2 (`base` editor kind) | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

- **Research lineage:**
  - RM261003ABZP-RF1:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF2:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
  - RM261003ABZP-RF3:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
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
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF14:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF15:
    - evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
- **Success and verification definitions:**
  - RM261003ABZP-S1@R1 … RM261003ABZP-S12@R1 (with RM261003ABZP-S10@R2) and RM261003ABZP-V1@R1 … RM261003ABZP-V18@R1 (with RM261003ABZP-V4@R2, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V11@R3, RM261003ABZP-V12@R2, RM261003ABZP-V14@R2, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2) are owned by `rm261003abzp-design.md`, Success and Verification.
  - RM261003ABZP-US1@R2 … RM261003ABZP-US9@R1 and RM261003ABZP-UV1@R2 … RM261003ABZP-UV10@R1 (current revisions as listed under UI baseline) are owned by `rm261003abzp-ui-design.md`, UI Success Criteria and Implementation Verifications.
  - The phases define no new S or V records.

### UI Coverage

| Accepted mockup / feedback | UI requirement | UI design | Phase / DI | UI success | UI verification |
|---|---|---|---|---|---|
| RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ1@R2 - Application shell layout and status feedback | RM261003ABZP-UDES1@R2, RM261003ABZP-UDES11@R1 - Surface: Application shell; Component: Statusline, Toast stack | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (index and side-panel states: RM261003ABZP-DI2@R2); RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3 (view and preview segments) | RM261003ABZP-US1@R2 | RM261003ABZP-UV1@R2 |
| RM261003ABZP-M1@R1; Acceptance; AD3 | RM261003ABZP-UREQ2@R1 - Vim modes, cursor, and command line | RM261003ABZP-UDES2@R1 - Surface: Application shell; Component: Command line | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-US1@R2 | RM261003ABZP-UV2@R1 |
| RM261003ABZP-M2@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ3@R2 - Live preview rendering, reveal, view modes, and non-Markdown source view | RM261003ABZP-UDES3@R2 - Surface: Editor window | RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3 (non-Markdown source view: RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2; note keys scoped: RM261003ABZP-DI2@R2) | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M2@R1; Acceptance; AD3 | RM261003ABZP-UREQ4@R1 - Rich blocks, embeds, and images | RM261003ABZP-UDES4@R1 - Surface: Editor window | RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3 | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M3@R1; Acceptance; AD1; AD3; AD4 | RM261003ABZP-UREQ5@R2 - Discovery overlays | RM261003ABZP-UDES5@R2 - Surface: Overlays; Component: Which-key, Picker, Command line | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 | RM261003ABZP-US3@R2 | RM261003ABZP-UV4@R2 |
| RM261003ABZP-M3@R1, RM261003ABZP-M4@R1; Acceptance; AD3 | RM261003ABZP-UREQ6@R1 - Links: completion, following, jump list, backlinks, rename | RM261003ABZP-UDES6@R1 - Surface: Links and backlinks; Component: Completion popup, Prompt | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 (unresolved-link styling: RM261003ABZP-DI3@R3) | RM261003ABZP-US4@R1 | RM261003ABZP-UV5@R1 |
| RM261003ABZP-M4@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ7@R2 - Explorer file operations, refused files, and disk-change handling | RM261003ABZP-UDES7@R2 - Surface: File operations and disk changes; Component: Prompt, Conflict dialog and diff | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (link-impact text on move: RM261003ABZP-DI2@R2) | RM261003ABZP-US5@R2 | RM261003ABZP-UV6@R2 |
| RM261003ABZP-M5@R2; Acceptance; feedback cycle 1; AD2; AD3 | RM261003ABZP-UREQ8@R2 - Daily notes, date picker, and templates | RM261003ABZP-UDES8@R1 - Surface: Daily notes and templates; Component: Calendar, Picker | RM261003ABZP-PH2@R4 / RM261003ABZP-DI4@R2 | RM261003ABZP-US6@R1 | RM261003ABZP-UV7@R1 |
| RM261003ABZP-M6@R1; Acceptance; AD3 | RM261003ABZP-UREQ9@R1 - Bases table and Kanban views | RM261003ABZP-UDES9@R1 - Surface: Bases views; Component: Base table, Kanban board | RM261003ABZP-PH2@R4 / RM261003ABZP-DI4@R2 | RM261003ABZP-US7@R1 | RM261003ABZP-UV8@R1 |
| RM261003ABZP-M7@R1; Acceptance; AD3 | RM261003ABZP-UREQ10@R1 - Browser preview page | RM261003ABZP-UDES10@R2 - Surface: Browser preview page | RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3 | RM261003ABZP-US8@R1 | RM261003ABZP-UV9@R2 |
| RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (RM261003ABZP-M5@R2); Acceptance; AD3 | RM261003ABZP-UREQ11@R1 - Themes, NO_COLOR, narrow terminals, input, accessibility | RM261003ABZP-UDES11@R1 - Section 5 policies; Component: Theme | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2; RM261003ABZP-PH2@R4 / RM261003ABZP-DI3@R3, RM261003ABZP-DI4@R2 (each DI for its own surfaces) | RM261003ABZP-US9@R1 | RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R2 |

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
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-RF3; RM261003ABZP-DES15@R4 Tradeoffs
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

- **Approved phases:** RM261003ABZP-PH1@R3, RM261003ABZP-PH2@R4
- **Approved delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2, RM261003ABZP-DI3@R3, RM261003ABZP-DI4@R2
- **Approved phase designs:**
  - `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Phase Design (RM261003ABZP-PH1@R3). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R4, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view), RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1.
  - `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Phase Design (RM261003ABZP-PH2@R4). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R4, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R2, RM261003ABZP-UDES11@R1.
- **Approval evidence:**
  - R1 baseline: on 2026-10-03 the user delegated all decisions: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … just stop when finish the skill workflow then I will review via mockups … don't raise any question to me". The user also asked to "prevent many DIs and phases split". Under that delegation the agent approved the two-phase, four-DI arrangement, releases at phase exit (`v0.1.0`, `v1.0.0`), and the phase refinements in both phase files.
  - Current baseline: on 2026-10-03 the user asked to leave room for a code editor and notebooks ("The design should be stable, simple, easy to maintain and extend + meet industry standards") and selected "Apply all six (Recommended)" (`rm261003abzp-roadmap-context.md@R2`). Under the standing delegation the agent approved the revised baselines PH1@R2 and PH2@R2 with the same phase order, DI split, gates, and releases.
  - Post-DI1 synchronization: approved by the user on 2026-10-03. The input baseline moved to RM261003ABZP-REQ10@R3, RM261003ABZP-DES8@R2, and RM261003ABZP-DES15@R2 with PH1@R2, PH2@R2, and DI1@R2 … DI4@R2 retained; DI1 progress, Work, and PR were recorded.
  - Post-DI2 synchronization: approved by the user on 2026-10-04. The input baseline moved to RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, and RM261003ABZP-DES15@R3 with PH1@R2, PH2@R2, and DI1@R2 … DI4@R2 retained; DI2 progress, Work, and PR were recorded.
  - Manual releases: on 2026-10-04 the user decided that releases are manual (a `v*` tag pushed only on request) and that phase exits run a non-publishing release dry run. This produced RM261003ABZP-REQ10@R4, RM261003ABZP-DES15@R4, RM261003ABZP-S10@R2, RM261003ABZP-V14@R2, RM261003ABZP-PH1@R3, and RM261003ABZP-PH2@R3, with DI1@R2 … DI4@R2 retained.
  - DI3 design synchronization: approved by the user on 2026-10-04. The input baseline moved to RM261003ABZP-DES13@R3, RM261003ABZP-UDES10@R2, and RM261003ABZP-UV9@R2 (KaTeX and Mermaid served from the binary, web images in the terminal and the browser preview), producing RM261003ABZP-PH2@R4 and RM261003ABZP-DI3@R3 with PH1@R3, DI1@R2, DI2@R2, and DI4@R2 retained; DI3 Work W261003S6BQ and progress were recorded.
````

- **Roadmap index at RM261003ABZP-PH2@R5 — Kanban type verification moved to follow-up work**
  - **Archived at:** 2026-10-05T10:37:48Z
  - **Change type:** Revised
  - **Reason:** On 2026-10-05 the user decided to close v1 with Kanban lanes moved to follow-up work.
  - **Changes:** RM261003ABZP-PH2@R5 → RM261003ABZP-PH2@R6; S7/V10 references → R2; DI4 Work and PR recorded; PH2 marked complete; Kanban lanes added to deferred items.

`````markdown
# RM261003ABZP: so v1 — Roadmap Index

- **Status:** Approved
- **Outcome:** `so` ships as a fast, vim-modal, Markdown-first terminal editor for a plain notes folder. It has Obsidian-compatible links, live preview, daily notes, templates, Bases, and a read-only browser preview, and can be released as checksummed binaries for macOS and Linux whenever the user asks. Its language-neutral editor core opens any text file in source view and leaves room for code editing and notebooks later.
- **History:** `rm261003abzp-roadmap-index-revisions.md`

Phase files hold the complete PH and DI definitions. This index holds their current references and the delivery order. `Approved` describes the roadmap baseline, not delivered work. DI1 is delivered by W261003HEGE in PR #1 and DI2 by W261003FX70 in PR #2, and PH1 is complete. DI3 is delivered by W261003S6BQ in PR #6; see Work Progress.

## Baseline

- **Context:** `rm261003abzp-roadmap-context.md@R2` - The repository is empty apart from the `.s1mple/` guidance. The user's scope change (R2) keeps v1 Markdown-first on a language-neutral core. Alfred (`../alfred`) supplies code that can be ported for Markdown parsing, Obsidian syntax, the vim core, terminal graphics, and Bases.
- **Requirements:** `rm261003abzp-requirements.md` (Approved); history: `rm261003abzp-requirements-revisions.md`
- **Design:** `rm261003abzp-design.md` (Approved); history: `rm261003abzp-design-revisions.md`
- **Research:** `rm261003abzp-research.md` (immutable; reconciliation Complete in the requirements)
- **UI baseline:**
  - UI context: `rm261003abzp-ui-context.md@R2`.
  - Accepted mockups (`ui-mockups/manifest.md`, shared R1, delegated acceptance): RM261003ABZP-M1@R1, RM261003ABZP-M2@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M5@R2, RM261003ABZP-M6@R1, RM261003ABZP-M7@R1; manifest AD4 (non-Markdown states reuse accepted visuals, Feedback Ledger cycle 2).
  - UI requirements (`Ready for UI Design`, `rm261003abzp-ui-requirements.md`): RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ3@R2, RM261003ABZP-UREQ4@R1, RM261003ABZP-UREQ5@R2, RM261003ABZP-UREQ6@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ8@R2, RM261003ABZP-UREQ9@R1 … RM261003ABZP-UREQ11@R1.
  - UI design (`Ready for Planning`, `rm261003abzp-ui-design.md`): RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R2, RM261003ABZP-UDES11@R1; RM261003ABZP-US1@R2, RM261003ABZP-US2@R2, RM261003ABZP-US3@R2, RM261003ABZP-US4@R1, RM261003ABZP-US5@R2, RM261003ABZP-US6@R1 … RM261003ABZP-US9@R1; RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1, RM261003ABZP-UV3@R2, RM261003ABZP-UV4@R2, RM261003ABZP-UV5@R1, RM261003ABZP-UV6@R2, RM261003ABZP-UV7@R1, RM261003ABZP-UV8@R1, RM261003ABZP-UV9@R2, RM261003ABZP-UV10@R1.
- **Approved inputs:**
  - RM261003ABZP-REQ1@R3 - Folder workspace, text files, and safe file management
  - RM261003ABZP-REQ2@R2 - Vim-modal editing with a core command set
  - RM261003ABZP-REQ3@R4 - LazyVim-style navigation, commands, configuration, and state
  - RM261003ABZP-REQ4@R3 - Obsidian-compatible links, backlinks, tags, and rename
  - RM261003ABZP-REQ5@R2 - Obsidian-style live preview
  - RM261003ABZP-REQ6@R2 - Daily notes and templates
  - RM261003ABZP-REQ7@R2 - Obsidian Bases table and Kanban views
  - RM261003ABZP-REQ8@R2 - Read-only local browser preview
  - RM261003ABZP-REQ9@R3 - Fast and smooth performance targets
  - RM261003ABZP-REQ10@R4 - Fast development, CI, and release
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
  - RM261003ABZP-DES13@R3 - `Bun.serve` preview with Host allowlist, SSE, pure HTML rendering, and KaTeX and Mermaid served from the binary
  - RM261003ABZP-DES14@R2 - TOML config at the XDG path; per-workspace state at the XDG state path
  - RM261003ABZP-DES15@R4 - Bun-native toolchain, two-job CI, manual tag releases, and single-runner cross-compile
  - RM261003ABZP-DES16@R1 - Performance by construction plus benchmark gates
  - RM261003ABZP-DES17@R2 - File-type registry, highlighter interface, and text-file open policy
  - The UI requirement and UI design revisions listed under UI baseline - the accepted terminal and browser experience (titles in UI Coverage below)

## Delivery Overview

- **First valuable release:** PH1 is the first release-ready state (a release such as `v0.1.0` is published only when the user asks). The user opens a folder, browses and manages notes and other text files, edits with vim keys and safe autosave, and finds and jumps between notes through the leader key, pickers, and wikilinks, with links kept intact on rename. This is the requirements' "Minimum valuable release".
- **Delivery approach:** There are two phases and four substantial DIs, following the user instruction to avoid splitting work into many DIs and phases.
  - PH1 (DI1 + DI2) delivers the daily-usable editor.
  - PH2 (DI3 + DI4) adds the Obsidian experience on top of it.
  - Each DI ships one user-visible capability with its own tests.
  - Internal layers (tooling, store, parser, index) ship inside the DI that first needs them, not as separate "foundation" items. The exception is DI1, which by design (RM261003ABZP-DES1@R2, Delivery constraints) must land the boundary test and CI before any feature code.
- **Key constraints:**
  - The import boundary test (including the kernel rule) and the CI gates exist from the first PR (RM261003ABZP-DES1@R2, RM261003ABZP-DES15@R4).
  - The kernel stays language-neutral: later DIs add Markdown views, links, and Bases as registrations (file types, decoration providers, commands, editor kinds), never as kernel changes (RM261003ABZP-DES17@R2).
  - DI1 confirmed the `@opentui/core` paint, buffer, and test-renderer APIs at 0.5.14 and recursive `fs.watch` on macOS and Linux (RM261003ABZP-DES10@R2, RM261003ABZP-DES8@R2). DI3 confirmed the image API at the same pin (W261003S6BQ V43 terminal spike, PR #6).
  - DI4 confirms the Kanban `type` constant against an Obsidian 1.14+ file before Kanban ships (RM261003ABZP-DES12@R2).
  - Nothing is released automatically. A release is published only when the user asks, from a pushed `v*` tag. Each phase exit runs the release workflow manually as a dry run that builds and smoke-tests the four binaries and publishes nothing (RM261003ABZP-REQ10@R4, RM261003ABZP-DES15@R4).
- **Dependencies and parallel opportunities:**

```text
RM261003ABZP-PH1@R3 — Daily-usable editor  (release-ready; v0.1.0 on request)
├── RM261003ABZP-DI1@R2 — Editor foundation: open folder → kernel + file types → vim edit any text file → safe autosave → explorer file ops
└── RM261003ABZP-DI2@R2 — Navigation and links: leader/which-key/pickers/palette/config, file-type keymaps → links, backlinks, rename
        (DI2 depends on DI1)

RM261003ABZP-PH2@R5 — Obsidian experience  (release-ready; v1.0.0 on request; depends on PH1)
├── RM261003ABZP-DI3@R4 — Live preview + browser preview  (depends on DI2)
└── RM261003ABZP-DI4@R2 — Daily notes, templates + Bases   (depends on DI2; gate on DI3 for the `base` embed renderer)

Parallel: DI3 and DI4 run in parallel once DI2 is merged. DI4 waits for DI3 only before
executing its `![[file.base]]` embed renderer (PH2 Cross-Work Dependency Gates).
```

## Phase Sequence

1. **RM261003ABZP-PH1@R3 — Daily-usable editor**
   - **Outcome:** A terminal user can open a notes folder and edit it daily — notes and any other text file — with vim keys, safe autosave, explorer file management, LazyVim-style discovery (leader, which-key, pickers, palette, help, config), and Obsidian-compatible links, backlinks, tags, and link-safe rename.
   - **Dependencies:** None
   - **Delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2
   - **Exit criteria:**
     - RM261003ABZP-S1@R1 - Notes are never lost or silently overwritten; verified by RM261003ABZP-V1@R1
     - RM261003ABZP-S2@R1 - The core vim command set behaves like Neovim; verified by RM261003ABZP-V2@R1, RM261003ABZP-V3@R1
     - RM261003ABZP-S3@R1 - Commands are discoverable and configurable; verified by RM261003ABZP-V4@R2
     - RM261003ABZP-S4@R1 - Links resolve deterministically, and rename and link-mention keep the graph intact; verified by RM261003ABZP-V5@R1, RM261003ABZP-V6@R2
     - RM261003ABZP-S9@R1 (startup and index part) - First frame < 200 ms and index < 3 s on 10,000 notes, with input staying responsive during indexing; verified by RM261003ABZP-V13@R1
     - RM261003ABZP-S10@R2 - Check < 30 s, CI < 3 min, a non-publishing release dry run produces four checksummed binaries that start; verified by RM261003ABZP-V14@R2
     - RM261003ABZP-S11@R1 (boundary and restore part) - Boundary violations, including kernel imports of language code, fail CI, and the terminal is restored on every exit path; verified by RM261003ABZP-V15@R2, RM261003ABZP-V17@R1
     - RM261003ABZP-S12@R1 - Any text file opens safely on a language-neutral core: source view with highlighting, binary and oversized files refused, BOM and line endings kept; verified by RM261003ABZP-V18@R1
     - RM261003ABZP-US1@R2 (PH1 states) - Shell, modes, and status are legible for every state delivered by DI1 and DI2; verified by RM261003ABZP-UV1@R2 (PH1 states), RM261003ABZP-UV2@R1
     - RM261003ABZP-US3@R2 - Commands, notes, and files are discoverable from the keyboard; verified by RM261003ABZP-UV4@R2
     - RM261003ABZP-US4@R1 - Link interactions show impact first; verified by RM261003ABZP-UV5@R1
     - RM261003ABZP-US5@R2 - File operations, refused files, and disk changes never surprise the user; verified by RM261003ABZP-UV6@R2
     - RM261003ABZP-US9@R1 (PH1 surfaces) - NO_COLOR, light theme, and 80×24 hold for the shell, explorer, prompts, overlays, and side panel; verified by RM261003ABZP-UV10@R1 (PH1 states)
   - **Delivery status:** Completed
   - **Progress evidence:** RM261003ABZP-DI1@R2 merged to `main` as `c98aa19` (PR #1) and RM261003ABZP-DI2@R2 as `9adb285` (PR #2), both with CI green. The PH1 exit record (phase file, Progress) holds the release dry run, the V13 and V14 readings, and the manual runs on macOS and Linux. `v0.1.0` is released only when the user asks.
   - **Details:** `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`

2. **RM261003ABZP-PH2@R5 — Obsidian experience**
   - **Outcome:** Notes render in Obsidian-style live preview with inline images, and `:Preview` mirrors them read-only in the browser. Daily notes and templates take one or two keystrokes. Bases open as editable tables and Kanban boards and embed in notes. Together this completes the v1 scope.
   - **Dependencies:** RM261003ABZP-PH1@R3 - the editor, store, command registry, kernel text view, file-type registry, highlighter, Doc parser, index, pickers, and prompts
   - **Delivery items:** RM261003ABZP-DI3@R4, RM261003ABZP-DI4@R2
   - **Exit criteria:**
     - RM261003ABZP-S5@R1 - Live preview renders Obsidian syntax and reveals source at the cursor; verified by RM261003ABZP-V7@R2, RM261003ABZP-V8@R1
     - RM261003ABZP-S6@R1 - Daily notes and templates match Obsidian output; verified by RM261003ABZP-V9@R1
     - RM261003ABZP-S7@R1 - Bases views evaluate and edit `.base` files; verified by RM261003ABZP-V10@R1
     - RM261003ABZP-S8@R1 - Preview is live, read-only, and local-only; verified by RM261003ABZP-V11@R3
     - RM261003ABZP-S9@R1 - All performance targets hold, including keystroke p95 < 24 ms in live preview and < 16 ms in a 5,000-line TypeScript file; verified by RM261003ABZP-V12@R3, RM261003ABZP-V13@R2 (re-run)
     - RM261003ABZP-S10@R2 - Fast checks, CI, and the release dry run still hold at full scope; verified by RM261003ABZP-V14@R2 (dry run re-run at the PH2 exit)
     - RM261003ABZP-S11@R1 - Foundations stay clean, and extension is registration-only; verified by RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1
     - RM261003ABZP-US1@R2 - Complete statusline segment order, including the `view` and `preview` segments; verified by RM261003ABZP-UV1@R2 (full)
     - RM261003ABZP-US2@R2 - Live preview looks and reveals like the accepted mockup; other files stay plain source; verified by RM261003ABZP-UV3@R2
     - RM261003ABZP-US6@R1 - Daily notes and templates take one or two keystrokes; verified by RM261003ABZP-UV7@R1
     - RM261003ABZP-US7@R1 - Bases editing is keyboard-fast and shows every write; verified by RM261003ABZP-UV8@R1
     - RM261003ABZP-US8@R1 - The browser page is a faithful, read-only, connection-aware mirror; verified by RM261003ABZP-UV9@R2
     - RM261003ABZP-US9@R1 - Every surface works under NO_COLOR, in light theme, and at 80×24; verified by RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R2
   - **Delivery status:** In progress
   - **Progress evidence:** RM261003ABZP-DI3@R4 merged to `main` as `e228bb5` (PR #6) with CI green; RM261003ABZP-DI4@R2 has not started, and the PH2 exit record is pending.
   - **Details:** `rm261003abzp-roadmap-phase-2-obsidian-experience.md`

## Delivery Items

| DI | Valuable outcome | Phase | Dependencies | Work | PR |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | `so [path]` opens a folder in an OpenTUI shell. The user edits notes and any other UTF-8 text file (source view with syntax colouring; binary and over-16 MiB files refused) with the core vim command set, splits, and buffers, and saves atomically with autosave, BOM and line endings kept, external-change handling, and explorer create/rename/move/trash. The language-neutral kernel (file-type registry, `layoutText` with decorations, highlighter), tooling, CI, release binaries, the boundary test, and the bench harness ship with it. | RM261003ABZP-PH1@R3 | None | W261003HEGE | PR #1 |
| RM261003ABZP-DI2@R2 | Leader with which-key, the picker family (all files, text search), palette and help filtered by file type, file-type-scoped keymaps, TOML config, and persisted recents and jumps. Obsidian links, tags, backlinks with link-mention, `[[` completion, and link-safe rename/move, all over a worker-built index. | RM261003ABZP-PH1@R3 | RM261003ABZP-DI1@R2 | W261003FX70 | PR #2 |
| RM261003ABZP-DI3@R4 | Live preview as a decoration provider with reveal, rich blocks, folds, embeds, image tiers, and live/source/reading modes. `:Preview` shows a read-only browser mirror over SSE. Final keystroke benchmarks and registration-only extension proof. | RM261003ABZP-PH2@R5 | RM261003ABZP-DI2@R2 | W261003S6BQ | PR #6 |
| RM261003ABZP-DI4@R2 | `:Today`/`:Yesterday`/`:Tomorrow`, the calendar picker, template insertion, and new-note-from-template. `.base` files open as a registered editor kind with editable table and Kanban views and frontmatter write-back, plus `![[file.base]]` embeds. | RM261003ABZP-PH2@R5 | RM261003ABZP-DI2@R2; RM261003ABZP-DI3@R4 (embed gate only) | Pending | Pending |

Each DI maps to exactly one Work and one PR. RM261003ABZP-DI1@R2 is assigned W261003HEGE and PR #1, RM261003ABZP-DI2@R2 W261003FX70 and PR #2, and RM261003ABZP-DI3@R4 W261003S6BQ and PR #6; RM261003ABZP-DI4@R2 is pending.

## Work Progress

| DI | Work stage | Contract health | Next gate / blocker | Evidence | Checked at |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | Deliver (merged) | Aligned | None — G1 closed; open, not blocking: manual macOS Trash check (W261003HEGE V11.4); the `v0.1.0-rc.1` release dry run (RM261003ABZP-V14@R1) is superseded by the PH1 exit's non-publishing dry run (RM261003ABZP-V14@R2), and the release-please workflow DI1 delivered is removed | `.s1mple/work/done/w261003hege-editor-foundation/reports/overall-verification-report.md` (all groups accepted, no findings); PR #1 merged 2026-10-03T11:00:09Z; checked against REQ10@R3, DES8@R2, DES15@R2 | 2026-10-03T11:56:27Z |
| RM261003ABZP-DI2@R2 | Deliver (merged) | Aligned | None — G2 and G3 outputs merged; RM261003ABZP-V13@R1 is read on the reference machine, as RM261003ABZP-REQ9@R2 requires (PH1 exit record); open, not blocking: the ungated max keystroke latency while indexing (20–45 ms) | `.s1mple/work/done/w261003fx70-navigation-and-links/reports/overall-verification-report.md` (Passed; all five groups accepted, no findings); PR #2 merged 2026-10-03T21:50:57Z as `9adb285`; checked against DES6@R2, DES7@R4, DES14@R2, DES15@R3 | 2026-10-03T21:59:02Z |
| RM261003ABZP-DI3@R4 | Deliver (merged) | Aligned | None — G4 outputs merged; W261003S6BQ delivered against PH2@R4/DI3@R3 with the relaxed live and startup targets approved by the user on 2026-10-04, which REQ9@R3, V12@R3, V13@R2, PH2@R5, and DI3@R4 record, and its design refinements are recorded in DES17@R2 and the PH2@R5 phase design; open, not blocking: the V43 terminal-image evidence is byte-level, not visual; next: DI4 | `.s1mple/work/done/w261003s6bq-live-and-browser-preview/w261003s6bq-goal.md` (Completion Summary; Blockers and Deviations); `.s1mple/work/done/w261003s6bq-live-and-browser-preview/reports/overall-verification-report.md` (all five groups accepted; OVR-VER1 fixed in `7c0b6a2`, `e3c551a`); PR #6 merged 2026-10-04T05:41:17Z as `e228bb5` with `check`, `test (ubuntu-24.04)`, and `test (macos-15)` green; checked against PH2@R5, DI3@R4, REQ9@R3, DES13@R3, DES17@R2, UDES10@R2, UV9@R2 | 2026-10-04T05:55:53Z |
| RM261003ABZP-DI4@R2 | Not started | Aligned | None — PH1 exit recorded, G3 outputs merged, and G4 satisfied by the DI3 merge; next: the DI4 discussion, which confirms the Kanban `type` value; `base` is the first editor kind to create its window state through `EditorKindSpec.open` (DES17@R2) | G3 outputs on `main` at `9adb285` (W261003FX70 overall verification, G3 table); PH1 exit record; G4 `Satisfied`: `PreviewCtx`, `MarkdownViewInput`, `livePreview`, `BlockRenderer`, and `registerBlockRenderer` in `src/core/lang/markdown/live-preview.ts`, `registerWidgetPainter` in `src/ui/widgets/registry.ts`, and embed targets as unlisted buffers in `src/core/state/embeds.ts`, merged in `e228bb5` (PR #6), with W261003S6BQ V4 (RM261003ABZP-V7@R2), V5, V38, and V41 (RM261003ABZP-V16@R2) passing | 2026-10-04T05:55:53Z |

These rows are evidence-backed snapshots, not live telemetry. Delivery status stays in Phase Sequence and in each phase's Progress. Resolve W and PR identities through the Delivery Items ledger. A row stays `Not assessed` until its relevant baseline and coverage have been checked.

The main orchestrator updates authorized index and phase links, and progress, together after re-reading both. Without parent-write authorization, it records the exact pending changes and evidence in the current W artifact's synchronization receipt instead of modifying this index.

## Coverage

| Requirement | Research support | Design | Phase / DI | Success | Verification |
|---|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe file management | RM261003ABZP-RF11 - atomic save, directory watching, undoable reload | RM261003ABZP-DES8@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-RF5 - Esc timeout, kitty keyboard; RM261003ABZP-RF6 - line array, undo block | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, commands, config, state, file-type scope | RM261003ABZP-RF15 - TOML, XDG, state home | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES17@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 (registry and keymap core in RM261003ABZP-DI1@R2) | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links, backlinks, tags, rename | RM261003ABZP-RF8 - documented resolution rule | RM261003ABZP-DES7@R4, RM261003ABZP-DES6@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ5@R2 - live preview | RM261003ABZP-RF4 - kitty/sixel/blocks; RM261003ABZP-RF7 - block reparse, reveal | RM261003ABZP-DES6@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R2 | RM261003ABZP-PH2@R5 / RM261003ABZP-DI3@R4 | RM261003ABZP-S5@R1 | RM261003ABZP-V7@R2, RM261003ABZP-V8@R1 |
| RM261003ABZP-REQ6@R2 - daily notes, templates | RM261003ABZP-RF10 - Moment tokens, `{{time:F}}`, subfolders | RM261003ABZP-DES11@R1 | RM261003ABZP-PH2@R5 / RM261003ABZP-DI4@R2 | RM261003ABZP-S6@R1 | RM261003ABZP-V9@R1 |
| RM261003ABZP-REQ7@R2 - Bases | RM261003ABZP-RF9 - layouts, Kanban rules | RM261003ABZP-DES12@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES17@R2 | RM261003ABZP-PH2@R5 / RM261003ABZP-DI4@R2 | RM261003ABZP-S7@R1 | RM261003ABZP-V10@R1 |
| RM261003ABZP-REQ8@R2 - browser preview | RM261003ABZP-RF12 - binding, Host check, containment, SSE | RM261003ABZP-DES13@R3, RM261003ABZP-DES6@R2 | RM261003ABZP-PH2@R5 / RM261003ABZP-DI3@R4 | RM261003ABZP-S8@R1 | RM261003ABZP-V11@R3 |
| RM261003ABZP-REQ9@R3 - performance | RM261003ABZP-RF2 - in-process frame metrics | RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R2 (highlighting look-back) | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (harness), RM261003ABZP-DI2@R2 (V13); RM261003ABZP-PH2@R5 / RM261003ABZP-DI3@R4 (V12) | RM261003ABZP-S9@R1 | RM261003ABZP-V12@R3, RM261003ABZP-V13@R2 |
| RM261003ABZP-REQ10@R4 - development, CI, release | RM261003ABZP-RF3 - compile embeds native lib; RM261003ABZP-RF13 - TS 7, no TS API; RM261003ABZP-RF14 - release-please (superseded by the manual-release decision) | RM261003ABZP-DES15@R4, RM261003ABZP-DES1@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-S10@R2 | RM261003ABZP-V14@R2 |
| RM261003ABZP-REQ11@R3 - foundations, language-neutral kernel | RM261003ABZP-RF1 - contain OpenTUI; RM261003ABZP-RF4; RM261003ABZP-RF5; RM261003ABZP-RF6; RM261003ABZP-RF13; RM261003ABZP-RF14; RM261003ABZP-RF15 | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES12@R2, RM261003ABZP-DES17@R2 | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (V15, V17, V18); RM261003ABZP-PH2@R5 / RM261003ABZP-DI3@R4 (V16), RM261003ABZP-DI4@R2 (`base` editor kind) | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V16@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

- **Research lineage:**
  - RM261003ABZP-RF1:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2 (current RM261003ABZP-REQ9@R3)
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF2:
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2 (current RM261003ABZP-REQ9@R3)
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
  - RM261003ABZP-RF3:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated None → informed None (macOS signing deferred)
  - RM261003ABZP-RF4:
    - evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF5:
    - evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF6:
    - evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2 (current RM261003ABZP-REQ9@R3)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF7:
    - evaluated RM261003ABZP-REQ5@R1 → informed RM261003ABZP-REQ5@R2
    - evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
    - evaluated RM261003ABZP-REQ9@R1 → informed RM261003ABZP-REQ9@R2 (current RM261003ABZP-REQ9@R3)
  - RM261003ABZP-RF8: evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3)
  - RM261003ABZP-RF9: evaluated RM261003ABZP-REQ7@R1 → informed RM261003ABZP-REQ7@R2
  - RM261003ABZP-RF10: evaluated RM261003ABZP-REQ6@R1 → informed RM261003ABZP-REQ6@R2
  - RM261003ABZP-RF11: evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (current RM261003ABZP-REQ1@R3)
  - RM261003ABZP-RF12: evaluated RM261003ABZP-REQ8@R1 → informed RM261003ABZP-REQ8@R2
  - RM261003ABZP-RF13:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF14:
    - evaluated RM261003ABZP-REQ10@R1 → informed RM261003ABZP-REQ10@R2 (current RM261003ABZP-REQ10@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
  - RM261003ABZP-RF15:
    - evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4)
    - evaluated RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3)
- **Success and verification definitions:**
  - RM261003ABZP-S1@R1 … RM261003ABZP-S12@R1 (with RM261003ABZP-S10@R2) and RM261003ABZP-V1@R1 … RM261003ABZP-V18@R1 (with RM261003ABZP-V4@R2, RM261003ABZP-V6@R2, RM261003ABZP-V7@R2, RM261003ABZP-V11@R3, RM261003ABZP-V12@R3, RM261003ABZP-V13@R2, RM261003ABZP-V14@R2, RM261003ABZP-V15@R2, RM261003ABZP-V16@R2) are owned by `rm261003abzp-design.md`, Success and Verification.
  - RM261003ABZP-US1@R2 … RM261003ABZP-US9@R1 and RM261003ABZP-UV1@R2 … RM261003ABZP-UV10@R1 (current revisions as listed under UI baseline) are owned by `rm261003abzp-ui-design.md`, UI Success Criteria and Implementation Verifications.
  - The phases define no new S or V records.

### UI Coverage

| Accepted mockup / feedback | UI requirement | UI design | Phase / DI | UI success | UI verification |
|---|---|---|---|---|---|
| RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ1@R2 - Application shell layout and status feedback | RM261003ABZP-UDES1@R2, RM261003ABZP-UDES11@R1 - Surface: Application shell; Component: Statusline, Toast stack | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (index and side-panel states: RM261003ABZP-DI2@R2); RM261003ABZP-PH2@R5 / RM261003ABZP-DI3@R4 (view and preview segments) | RM261003ABZP-US1@R2 | RM261003ABZP-UV1@R2 |
| RM261003ABZP-M1@R1; Acceptance; AD3 | RM261003ABZP-UREQ2@R1 - Vim modes, cursor, and command line | RM261003ABZP-UDES2@R1 - Surface: Application shell; Component: Command line | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 | RM261003ABZP-US1@R2 | RM261003ABZP-UV2@R1 |
| RM261003ABZP-M2@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ3@R2 - Live preview rendering, reveal, view modes, and non-Markdown source view | RM261003ABZP-UDES3@R2 - Surface: Editor window | RM261003ABZP-PH2@R5 / RM261003ABZP-DI3@R4 (non-Markdown source view: RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2; note keys scoped: RM261003ABZP-DI2@R2) | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M2@R1; Acceptance; AD3 | RM261003ABZP-UREQ4@R1 - Rich blocks, embeds, and images | RM261003ABZP-UDES4@R1 - Surface: Editor window | RM261003ABZP-PH2@R5 / RM261003ABZP-DI3@R4 | RM261003ABZP-US2@R2 | RM261003ABZP-UV3@R2 |
| RM261003ABZP-M3@R1; Acceptance; AD1; AD3; AD4 | RM261003ABZP-UREQ5@R2 - Discovery overlays | RM261003ABZP-UDES5@R2 - Surface: Overlays; Component: Which-key, Picker, Command line | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 | RM261003ABZP-US3@R2 | RM261003ABZP-UV4@R2 |
| RM261003ABZP-M3@R1, RM261003ABZP-M4@R1; Acceptance; AD3 | RM261003ABZP-UREQ6@R1 - Links: completion, following, jump list, backlinks, rename | RM261003ABZP-UDES6@R1 - Surface: Links and backlinks; Component: Completion popup, Prompt | RM261003ABZP-PH1@R3 / RM261003ABZP-DI2@R2 (unresolved-link styling: RM261003ABZP-DI3@R4) | RM261003ABZP-US4@R1 | RM261003ABZP-UV5@R1 |
| RM261003ABZP-M4@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ7@R2 - Explorer file operations, refused files, and disk-change handling | RM261003ABZP-UDES7@R2 - Surface: File operations and disk changes; Component: Prompt, Conflict dialog and diff | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2 (link-impact text on move: RM261003ABZP-DI2@R2) | RM261003ABZP-US5@R2 | RM261003ABZP-UV6@R2 |
| RM261003ABZP-M5@R2; Acceptance; feedback cycle 1; AD2; AD3 | RM261003ABZP-UREQ8@R2 - Daily notes, date picker, and templates | RM261003ABZP-UDES8@R1 - Surface: Daily notes and templates; Component: Calendar, Picker | RM261003ABZP-PH2@R5 / RM261003ABZP-DI4@R2 | RM261003ABZP-US6@R1 | RM261003ABZP-UV7@R1 |
| RM261003ABZP-M6@R1; Acceptance; AD3 | RM261003ABZP-UREQ9@R1 - Bases table and Kanban views | RM261003ABZP-UDES9@R1 - Surface: Bases views; Component: Base table, Kanban board | RM261003ABZP-PH2@R5 / RM261003ABZP-DI4@R2 | RM261003ABZP-US7@R1 | RM261003ABZP-UV8@R1 |
| RM261003ABZP-M7@R1; Acceptance; AD3 | RM261003ABZP-UREQ10@R1 - Browser preview page | RM261003ABZP-UDES10@R2 - Surface: Browser preview page | RM261003ABZP-PH2@R5 / RM261003ABZP-DI3@R4 | RM261003ABZP-US8@R1 | RM261003ABZP-UV9@R2 |
| RM261003ABZP-M1@R1 … RM261003ABZP-M7@R1 (RM261003ABZP-M5@R2); Acceptance; AD3 | RM261003ABZP-UREQ11@R1 - Themes, NO_COLOR, narrow terminals, input, accessibility | RM261003ABZP-UDES11@R1 - Section 5 policies; Component: Theme | RM261003ABZP-PH1@R3 / RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2; RM261003ABZP-PH2@R5 / RM261003ABZP-DI3@R4, RM261003ABZP-DI4@R2 (each DI for its own surfaces) | RM261003ABZP-US9@R1 | RM261003ABZP-UV10@R1, RM261003ABZP-UV9@R2 |

## Deferred Scope

- **Vim macros, Visual block mode, and Ex ranges**
  - **Reason:** They are outside the core command set that v1 needs.
  - **Revisit trigger:** User demand after `v1.0.0`.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-DES4@R1 Tradeoffs
- **Code intelligence (language servers, tree-sitter, diagnostics, debugger)**
  - **Reason:** v1 is Markdown-first; the language-neutral kernel, file-type registry, highlighter interface, decorations, file-type keymaps, and UTF-16 positions leave room for it without building it now.
  - **Revisit trigger:** A code-editor initiative.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-REQ1@R3, RM261003ABZP-REQ3@R4, RM261003ABZP-REQ11@R3; RM261003ABZP-DES17@R2
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
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-RF3; RM261003ABZP-DES15@R4 Tradeoffs
- **Cards, List, and Map Bases layouts**
  - **Reason:** v1 renders table and Kanban; other layouts open as a table with a notice.
  - **Revisit trigger:** Obsidian stabilizes these layouts and users request them.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations; RM261003ABZP-REQ7@R2
- **Graph view, Canvas, mobile, and Windows**
  - **Reason:** These are outside the terminal editor's v1 scope.
  - **Revisit trigger:** A new initiative.
  - **Source:** `rm261003abzp-requirements.md`, Deferred Considerations

## Unresolved Items

None. The pinned OpenTUI paint and image APIs, recursive `fs.watch`, the `lowlight` language set, and the Kanban `type` value are delivery confirmations with named verification, not open decisions. DI1 confirmed the paint API, recursive `fs.watch`, and the `lowlight` `common` set; DI3 confirmed the image API (W261003S6BQ V43 terminal spike, PR #6); the Kanban `type` value remains with DI4. The user's own review of the mockups is pending: acceptance was delegated, and the user said they will review via the mockups. Feedback from that review enters through the revision rules (mockup edit cycle → UREQ/UDES revisions → affected PH/DI revisions); it also covers the AD4 states, which reuse accepted visuals without their own mockup.

## Approval

- **Approved phases:** RM261003ABZP-PH1@R3, RM261003ABZP-PH2@R5
- **Approved delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2, RM261003ABZP-DI3@R4, RM261003ABZP-DI4@R2
- **Approved phase designs:**
  - `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Phase Design (RM261003ABZP-PH1@R3). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R4, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view), RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1.
  - `rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Phase Design (RM261003ABZP-PH2@R5). Upstream: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R2, RM261003ABZP-DES8@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES11@R1, RM261003ABZP-DES12@R2, RM261003ABZP-DES13@R3, RM261003ABZP-DES14@R2, RM261003ABZP-DES15@R4, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R2; RM261003ABZP-UDES1@R2, RM261003ABZP-UDES3@R2, RM261003ABZP-UDES4@R1, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES8@R1, RM261003ABZP-UDES9@R1, RM261003ABZP-UDES10@R2, RM261003ABZP-UDES11@R1.
- **Approval evidence:**
  - R1 baseline: on 2026-10-03 the user delegated all decisions: "you self-drive and decide all based on the proposal and these criteria: stable, simple, easy to maintain and extend; meet industry standards … just stop when finish the skill workflow then I will review via mockups … don't raise any question to me". The user also asked to "prevent many DIs and phases split". Under that delegation the agent approved the two-phase, four-DI arrangement, releases at phase exit (`v0.1.0`, `v1.0.0`), and the phase refinements in both phase files.
  - Current baseline: on 2026-10-03 the user asked to leave room for a code editor and notebooks ("The design should be stable, simple, easy to maintain and extend + meet industry standards") and selected "Apply all six (Recommended)" (`rm261003abzp-roadmap-context.md@R2`). Under the standing delegation the agent approved the revised baselines PH1@R2 and PH2@R2 with the same phase order, DI split, gates, and releases.
  - Post-DI1 synchronization: approved by the user on 2026-10-03. The input baseline moved to RM261003ABZP-REQ10@R3, RM261003ABZP-DES8@R2, and RM261003ABZP-DES15@R2 with PH1@R2, PH2@R2, and DI1@R2 … DI4@R2 retained; DI1 progress, Work, and PR were recorded.
  - Post-DI2 synchronization: approved by the user on 2026-10-04. The input baseline moved to RM261003ABZP-DES6@R2, RM261003ABZP-DES7@R4, RM261003ABZP-DES14@R2, and RM261003ABZP-DES15@R3 with PH1@R2, PH2@R2, and DI1@R2 … DI4@R2 retained; DI2 progress, Work, and PR were recorded.
  - Manual releases: on 2026-10-04 the user decided that releases are manual (a `v*` tag pushed only on request) and that phase exits run a non-publishing release dry run. This produced RM261003ABZP-REQ10@R4, RM261003ABZP-DES15@R4, RM261003ABZP-S10@R2, RM261003ABZP-V14@R2, RM261003ABZP-PH1@R3, and RM261003ABZP-PH2@R3, with DI1@R2 … DI4@R2 retained.
  - DI3 design synchronization: approved by the user on 2026-10-04. The input baseline moved to RM261003ABZP-DES13@R3, RM261003ABZP-UDES10@R2, and RM261003ABZP-UV9@R2 (KaTeX and Mermaid served from the binary, web images in the terminal and the browser preview), producing RM261003ABZP-PH2@R4 and RM261003ABZP-DI3@R3 with PH1@R3, DI1@R2, DI2@R2, and DI4@R2 retained; DI3 Work W261003S6BQ and progress were recorded.
  - DI3 delivery synchronization: approved by the user on 2026-10-04. The input baseline moved to RM261003ABZP-REQ9@R3 (relaxed live-view and startup targets), RM261003ABZP-DES17@R2 (window editor kind derived from the buffer's file type), RM261003ABZP-V12@R3, and RM261003ABZP-V13@R2, producing RM261003ABZP-PH2@R5 and RM261003ABZP-DI3@R4 with PH1@R3, DI1@R2, DI2@R2, and DI4@R2 retained; DI3 delivery (PR #6, `e228bb5`) and gate G4 were recorded.
`````
