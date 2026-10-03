# RM261003ABZP: Daily-usable editor — Roadmap Phase

- **Phase:** RM261003ABZP-PH1@R2
- **Approval status:** Approved
- **Index:** `rm261003abzp-roadmap-index.md`
- **History:** `rm261003abzp-roadmap-phase-1-daily-usable-editor-revisions.md`

Phase Design separates inherited decisions from phase-specific refinements. Progress records describe delivery, not definition changes. No Work, PR, implementation, or verification result exists yet.

## Phase Definition

- **Outcome:** A terminal user can run `so ~/notes` and use it as a daily editor:
  - browse and manage notes and other files in the explorer;
  - open any UTF-8 text file — code, config, plain text — in source view with syntax colouring, while binary and oversized files are refused;
  - edit with the core vim command set and safe autosave;
  - discover every command through the leader key, which-key, pickers, palette, and help;
  - override options in a TOML config;
  - follow, complete, and inspect Obsidian links, tags, and backlinks;
  - rename or move notes without breaking links.

  This ships as `v0.1.0`.
- **Rationale:** These two DIs form the requirements' "Minimum valuable release". DI1 alone is a usable vim editor for a folder. DI2 makes the folder a linked knowledge base. Splitting further would ship internal layers (store, parser, index) with no user value. Merging DI1 and DI2 would make one PR carry tooling, the editor core, and the knowledge features together, and stop the editor from being verified before links depend on it. DI1 also lays the language-neutral kernel (file-type registry, decorations-based text view, highlighter), so links, live preview, and Bases later land as registrations instead of kernel changes.
- **In scope:**
  - Tooling, CI, the release workflow, the boundary test with the kernel rule, and the bench harness (RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R3).
  - The language-neutral kernel: file-type registry, decorations-based text view, and lowlight highlighter, so any UTF-8 text file opens in source view and binary or oversized files are refused (RM261003ABZP-REQ1@R3, RM261003ABZP-REQ11@R3).
  - The folder workspace, explorer file operations, atomic save with BOM and line endings kept, autosave, watching, conflicts, and trash (RM261003ABZP-REQ1@R3).
  - Vim modes, motions, operators, text objects, registers, undo, search, ex commands, splits, and buffers (RM261003ABZP-REQ2@R2).
  - Leader and which-key, pickers over all files, text search, palette, help, file-type-scoped keymaps, config, and persisted recents and jumps (RM261003ABZP-REQ3@R4).
  - Links, embeds as link targets, tags, backlinks with link-mention, `[[` completion, rename, and move (RM261003ABZP-REQ4@R3).
  - The startup and index performance targets (RM261003ABZP-REQ9@R2, via RM261003ABZP-V13@R1).
- **Out of scope:**
  - Live preview rendering, images, embeds rendered inline, and the browser preview — PH2 / RM261003ABZP-DI3@R2. PH1 shows notes and every other text file in source view with syntax colouring and search highlights.
  - Daily notes, templates, and Bases — PH2 / RM261003ABZP-DI4@R2.
  - Everything in the index's Deferred Scope.
- **Delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2
- **Predecessors:** RM261003ABZP-PH1@R1

## Baseline and Dependencies

- **Context:** `rm261003abzp-roadmap-context.md@R2` - The repository is empty apart from `.s1mple/`. Alfred code is a porting reference only (vim core, Markdown parse, Obsidian syntax, terminal restore, fenced-code highlighting). The approved scope change keeps v1 Markdown-first on a language-neutral core that opens any text file.
- **Requirements:** `rm261003abzp-requirements.md`:
  - RM261003ABZP-REQ1@R3
  - RM261003ABZP-REQ2@R2
  - RM261003ABZP-REQ3@R4
  - RM261003ABZP-REQ4@R3
  - RM261003ABZP-REQ9@R2 (startup and index targets)
  - RM261003ABZP-REQ10@R2
  - RM261003ABZP-REQ11@R3 (boundaries including the kernel rule, restore, standards, registries for commands, syntax, file types, highlighters, decoration providers, and editor kinds)
- **Design:** `rm261003abzp-design.md` - RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3 (kernel text view and decorations; the live-preview provider is PH2), RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1
- **Research:** `rm261003abzp-research.md`
- **UI baseline:**
  - Accepted mockups (`ui-mockups/manifest.md`): RM261003ABZP-M1@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1, RM261003ABZP-M2@R1 (source-mode visuals only, reused for non-Markdown files); manifest AD4 (non-Markdown states reuse accepted visuals).
  - UI requirements (`rm261003abzp-ui-requirements.md`): RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ5@R2, RM261003ABZP-UREQ6@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ11@R1 (PH1 surfaces); RM261003ABZP-UREQ3@R2 (non-Markdown source view only).
  - UI design and verification (`rm261003abzp-ui-design.md`): RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view only); RM261003ABZP-US1@R2, RM261003ABZP-US3@R2, RM261003ABZP-US4@R1, RM261003ABZP-US5@R2, RM261003ABZP-US9@R1; RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1, RM261003ABZP-UV4@R2, RM261003ABZP-UV5@R1, RM261003ABZP-UV6@R2, RM261003ABZP-UV10@R1.
- **Research lineage:**
  - RM261003ABZP-RF5: evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2.
  - RM261003ABZP-RF6: evaluated RM261003ABZP-REQ2@R1 → informed RM261003ABZP-REQ2@R2.
  - RM261003ABZP-RF8: evaluated RM261003ABZP-REQ4@R1 → informed RM261003ABZP-REQ4@R2 (current RM261003ABZP-REQ4@R3).
  - RM261003ABZP-RF11: evaluated RM261003ABZP-REQ1@R1 → informed RM261003ABZP-REQ1@R2 (current RM261003ABZP-REQ1@R3).
  - RM261003ABZP-RF13 and RM261003ABZP-RF14: evaluated RM261003ABZP-REQ10@R1 and RM261003ABZP-REQ11@R1 → informed RM261003ABZP-REQ10@R2 and RM261003ABZP-REQ11@R2 (current RM261003ABZP-REQ11@R3).
  - RM261003ABZP-RF15: evaluated RM261003ABZP-REQ3@R1 → informed RM261003ABZP-REQ3@R2 (current RM261003ABZP-REQ3@R4).
  - RM261003ABZP-RF1, RM261003ABZP-RF2, RM261003ABZP-RF3: evaluated RM261003ABZP-REQ10@R1 and RM261003ABZP-REQ11@R1 (and RM261003ABZP-REQ9@R1 for RF1 and RF2) → informed their R2 revisions.
- **Prerequisite phases:** None
- **Entry conditions:**
  - The requirements, design, and UI design baselines above are approved, with UI design `Ready for Planning`.
  - The repository is on `main` with only `.s1mple/`.
  - DI1's later `s1mple-discuss` pins the exact `@opentui/core` and Bun versions.

### Cross-Work Dependency Gates

| Producer DI | Consumer DI | Required output | Required before | Required evidence | Integration owner |
|---|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | RM261003ABZP-DI2@R2 | **G1:** the store (`update`, `createStore`, the Action and Effect unions), `CommandRegistry` and `Keymap` with `KeyScope`, the kernel text view (`layoutText`, `Decoration`), `FileTypeRegistry` with the `text`, code, and `markdown` (source view) file types, `lowlightHighlighter`, the OpenTUI shell with `editorViews`, `OverlayHost`, and `Prompt`, `readTextFile`, `atomicWrite`, and the watcher, the effect runner, `bun run check`, CI, and the bench harness | DI2 execution (DI2 discussion and planning may start earlier against the DI1 plan) | DI1 PR merged to `main` with CI green; RM261003ABZP-V1@R1, RM261003ABZP-V2@R1, RM261003ABZP-V15@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 passing | RM261003ABZP-DI2@R2 |

## Delivery Flow

```text
RM261003ABZP-PH1@R2 — Daily-usable editor
├── RM261003ABZP-DI1@R2 — Editor foundation
│     so [path] → shell → vim edit → atomic autosave/conflicts → explorer a/r/m/d → restore on exit
│     + kernel: file types, layoutText + decorations, highlighter → any text file in source view
│       (binary or > 16 MiB refused)
│     + check/CI/release workflow, boundary test (kernel rule), PTY e2e, bench harness
│            │ G1 (merged DI1)
│            ▼
└── RM261003ABZP-DI2@R2 — Navigation and links
      worker index → pickers (all files, text grep)/which-key/palette/help/config/state
      → Markdown-scoped keys → [[ completion, gd, jumps, backlinks + link-mention, tags,
      rename/move with link rewrite
                         │
                         ▼
               PH1 exit evidence → merge release-please PR → v0.1.0
```

- **Parallel opportunities:**
  - DI2 discussion and planning may run while DI1 executes.
  - Inside DI1, the tooling and CI setup, the vim engine (pure tables), and the workspace adapters have no code dependency on each other until the store wires them. These stay inside the one DI1 PR.
- **Usable result:** After DI1 the editor is usable for a folder, notes and code alike, without link features. After DI2 the folder is a linked knowledge base. Only both together meet the phase outcome and the `v0.1.0` release.

## Phase Design

- **Architecture and boundaries**
  - **Design:** RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES10@R2; Design, System Architecture and Components and Boundaries.
  - **Inherited:**
    - Four layers (`core` pure; `workspace`, `ui`, `preview` adapters) are wired only in `src/app`.
    - One store with a pure `update`; effects are data.
    - Only `src/ui` imports `@opentui/*`.
    - `src/core/kernel/**` imports only the kernel; languages and features plug in through registries (commands, keymaps, file types, highlighters, decoration providers, editor kinds).
  - **Phase refinement:**
    - DI1 creates every layer folder except `src/preview`, which DI3 adds. Inside core it creates `kernel/`, `filetypes/`, `lang/code/`, and `lang/markdown/file-type.ts` (the `markdown` file type with its `source` view only). It also creates the boundary test with the kernel rule, so all later code lands under enforcement.
    - DI2 adds `core/lang/markdown` parsing and `core/features/links`, and the worker as a second entry point. `src/workspace/index-worker.ts` runs in a Bun `Worker` and may import `core/lang/markdown` and `core/features/links`, the same rule as for `workspace`.
    - The boundary test treats the worker file like any other `workspace` module.
  - **View:**

    ```text
    Proposed PH1 components (DI1 plain, DI2 marked +)

    src/app/main.ts ──► createStore(update) ◄── dispatch ── src/ui/shell (input, views, overlays)
          │                  │ effects                         ▲ subscribe
          ▼                  ▼                                  │
    src/app/effects.ts ──► src/workspace/{fs,watcher,trash,system, +config-file, +state-file}
          │                                                   └─► +index-worker (Bun Worker)
          ▼                                                             │ messages
    src/core/{state, config, kernel/{text,editor,vim,commands,view}, filetypes, lang/code,
              lang/markdown (file type; +parse), +features/links}
    ```

- **Components and files**

  | Location | Change and responsibility | Phase-specific detail | Upstream design |
  |---|---|---|---|
  | `package.json`, `tsconfig.json`, `biome.json`, `knip.json`, `release-please-config.json` (`"initial-version": "0.1.0"`), `.release-please-manifest.json` (`{ ".": "0.0.0" }`), `.github/workflows/{ci,release}.yml`, `bin/so` | Add (DI1). Toolchain, two CI jobs, release on tag | `check` job: `bun run check`. `test` job: component, e2e, and bench. The release workflow is exercised once on a manually pushed pre-release tag (`v0.1.0-rc.1`; release-please does not create rc tags) for RM261003ABZP-V14@R1. DI1 discussion confirms the release-please-action config keys against current docs. | RM261003ABZP-DES15@R1; Design, Project Structure |
  | `test/boundaries.test.ts` | Add (DI1). Import rules, including the kernel rule | Two deliberate-violation fixtures under `test/fixtures/boundary-violation/`: a core file importing `node:fs`, and a `core/kernel` file importing `core/lang/markdown` | RM261003ABZP-DES1@R2; RM261003ABZP-V15@R2 |
  | `src/core/state/{types,update,store}.ts` | Add (DI1); Modify (DI2) | The unions and AppState grow per DI (Contracts, data, and state below) | RM261003ABZP-DES2@R2; Design, Action and Effect protocol, AppState |
  | `src/core/kernel/commands/{registry,keymap,defaults}.ts` | Add (DI1); Modify (DI2) | DI1: registry with `filetypes?`, trie keyed by `KeyScope` (DI1 binds globally only), vim/ex/explorer/file bindings, `<leader>e`. DI2: Markdown-scoped `gd` and `Enter`, `list(filetype)` for palette and `:` completion, which-key items merged across scopes, help rows with scope labels, config overrides (`[keys.<mode>]`, `[filetypes.<id>.keys.<mode>]`) with an `overridden` flag, the `not available for <type> files` notice | RM261003ABZP-DES5@R2; Design, `src/core/kernel/commands/registry.ts` |
  | `src/core/kernel/{text,editor,vim}/*` | Add (DI1) | TextBuffer, undo blocks, registers, window tree; engine tables; ex commands with completion | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1 |
  | `src/core/kernel/view/{types,text-view}.ts` | Add (DI1) | `RenderLine`, `TextView`, `Decoration`, and `layoutText` at their final shapes. DI1 providers emit only `mark` decorations (highlighter, search match, selection); `replace`, `widget`, and `line` decorations are first produced by the DI3 live-preview provider (Code shapes below). | RM261003ABZP-DES9@R3 (kernel view; the live-preview provider is DI3) |
| `src/core/filetypes/registry.ts`, `src/core/lang/code/{highlight,file-types}.ts`, `src/core/lang/markdown/file-type.ts` | Add (DI1); Modify (DI2, DI3) | DI1: `FileTypeRegistry` with the `text` fallback and `EditorKindRegistry`; code file types; `lowlightHighlighter` (200-line look-back, cached per buffer version); `markdown` with the `source` view and Markdown highlighting. DI2 adds Markdown `analyze` (`parseDoc`). DI3 adds the `live` and `reading` views. | RM261003ABZP-DES17@R1, RM261003ABZP-DES9@R3; Design, `src/core/filetypes/registry.ts` |
  | `src/core/config/schema.ts` | Add (DI1); Modify (DI2) | DI1: zod schema and defaults used directly. DI2: loaded from file with errors that carry file and line. | RM261003ABZP-DES14@R1; Design, AppConfig |
  | `src/core/lang/markdown/{doc,blocks,syntax}.ts` | Add (DI2) | `parseDoc` with block cache and Obsidian syntax extensions (`syntaxExtensions` registry). Used by the index, link-at-cursor, and the `markdown` file type's `analyze` in PH1, and by the live-preview provider in DI3. | RM261003ABZP-DES6@R1; Design, `src/core/lang/markdown/doc.ts` |
  | `src/core/features/links/{note-index,summarize,resolve,rename,mentions,fuzzy,commands}.ts` | Add (DI2) | `mentions.ts` holds the `link.linkMention` span edit (Code shapes below); `commands.ts` registers link commands with `filetypes: ["markdown"]` | RM261003ABZP-DES7@R3; Design, `resolve.ts` and `rename.ts` |
  | `src/workspace/{fs,watcher,trash,system}.ts` | Add (DI1) | `fs.ts` holds `readTextFile` (16 MiB limit, NUL in the first 8 KiB, fatal UTF-8 decode; BOM and line ending kept for save). Recursive `fs.watch` is confirmed on macOS and Linux in the DI1 integration test. A fallback is not designed here; a failure returns to design. | RM261003ABZP-DES8@R1, RM261003ABZP-DES17@R1; Design, `src/workspace/fs.ts` |
  | `src/workspace/{config-file,state-file}.ts` | Add (DI2) | The state file carries `"version": 1` (Migration below) | RM261003ABZP-DES14@R1 |
  | `src/workspace/index-worker.ts` | Add (DI2) | Message protocol in Code shapes below. Lists every non-excluded file; summarizes notes; searches notes and text files within the 16 MiB limit, skipping binary files | RM261003ABZP-DES7@R3 |
  | `src/ui/{shell,input,theme}.ts`, `src/ui/editors/{registry,text-view}.ts`, `src/ui/views/{bufferline,explorer,statusline,cmdline}.ts`, `src/ui/overlays/{host,prompt,conflict,notify}.ts` | Add (DI1) | `EditorView` paints `RenderLine[]` from `layoutText`. `editorViews` maps only `text` in DI1 (`base` arrives in DI4); `src/ui/widgets/` arrives with the first widget in DI3. The statusline hides backlinks and words for non-Markdown files. OpenTUI paint and buffer APIs are confirmed at the pinned version. | RM261003ABZP-DES10@R2; UI design Composition Model |
  | `src/ui/overlays/{whichkey,picker,completion}.ts`, `src/ui/views/side-panel.ts` | Add (DI2) | One `Picker` serves the sources files (every non-excluded file), recent, grep (notes and text files), headings, tags, backlinks, commands (filtered by file type), and help (with scope labels) | RM261003ABZP-DES10@R2, RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1 |
  | `src/app/{main,effects}.ts` | Add (DI1); Modify (DI2) | DI2 adds worker start and restart, config and state loading, and the `search` and `saveState` effects | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2 |
  | `test/e2e/`, `test/bench/`, `test/fixtures/` | Add (DI1); Modify (DI2) | DI1: PTY restore test, bench harness, 5,000-line note, code, CRLF + BOM, and binary fixtures, and the 17 MiB file generated at test time for RM261003ABZP-V18@R1. DI2: 10,000-note generator and the RM261003ABZP-V13@R1 bench. DI3: the 5,000-line TypeScript fixture for RM261003ABZP-V12@R2. | RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1 |

- **Runtime and failure flow**
  - **Design:** RM261003ABZP-DES2@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1; Design, Runtime Flows (Keystroke to frame, Startup, Open a file, Save and external change, Follow, complete, and rename links).
  - **Phase refinement:**
    - DI1 startup has no index. The first frame comes from a shallow `readdir` and the opened file, so the DI1 first frame already meets the < 200 ms budget.
    - Every open (`so <file>`, explorer, `:e`, and from DI2 pickers and link follow) goes through `readTextFile` from DI1; a refused file never creates a buffer.
    - DI2 starts the worker after the first frame.
    - Until the worker reports `ready`, link features answer from the partial index and the statusline shows `◌ indexing n/total`.
    - A worker crash restarts the worker once. A second crash shows `index unavailable` while editing continues.
    - Between the DI1 and DI2 merges, explorer rename and move change only the file. DI2 routes `file.rename` and `file.move` through `planRename`. No release is cut in between.
  - **Flow:**

    ```text
    so [path] → resolve (missing → stderr, exit 2) → [DI2] load config (invalid → defaults + toast) → [DI2] load state
             → first frame (DI1) → [DI2] spawn worker → scan + summarize → indexBatch* → ready
                                                       └─ crash → restart once → crash → "index unavailable"
    open(path) → readTextFile → binary | > 16 MiB → message line, no buffer
                              └─ ok → forPath → buffer {fileType, bom, eol, view: source} → highlighter marks
    edit → autosave(1 s) | leave Insert | switch | :w | exit → restore BOM + EOL → atomicWrite
         └─ fail → dirty + "save failed: <reason>" → retry 1/2/4…30 s
    watcher → own write? ignore : clean → undoable reload : dirty → conflict (autosave paused)
    [DI2] <leader>lr → planRename → prompt "31 links in 12 files" → Enter → in-memory edits + write effects + fs rename
                                                             └─ some writes fail → toast lists paths (no revert)
    ```

  - **Verification:**
    - RM261003ABZP-V1@R1 - partial-write safety, reload, conflict, and own-write suppression.
    - RM261003ABZP-V13@R1 - first frame and index with 10,000 notes.
    - RM261003ABZP-V6@R2 - rename and link-mention writes.
    - RM261003ABZP-V18@R1 - open policy and BOM/EOL-preserving save.

- **Contracts, data, and state**
  - **Design:** RM261003ABZP-DES2@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES14@R1, RM261003ABZP-DES17@R1; Design, Action and Effect protocol, AppState, NoteSummary and NoteIndex, AppConfig, FileType and Decoration model.
  - **Inherited:**
    - `update` is pure and synchronous, and time arrives in actions.
    - Every failing effect returns a success or failure action.
    - The NoteIndex is never persisted.
    - The config file is invalid as a whole or applied as a whole.
  - **Phase refinement:**
    - The AppState fields and the Action and Effect variants are introduced by the DI that first uses them. DI1 does not add placeholder fields for later features.
      - **DI1:** `workspace`, `buffers` (`fileType`, `bom`, `eol`, `view` = `source`; no `analysis`), `windows` (content `{editor: "text", bufferId, cursor, scroll}` without `folds`), `vim`, `panels.explorer`, `overlay` (`none | prompt | conflict`), `notifications`, `config`, `terminal`.
      - **DI2:** `buffers[].analysis` (Markdown `Doc`), `index`, `jumps`, `recent`, `panels.side` (`backlinks | outline`), and the `overlay` variants `picker | whichKey | palette | help | completion`.
      - **PH2 additions:** see `rm261003abzp-roadmap-phase-2-obsidian-experience.md` Contracts, data, and state.
    - The final shape equals RM261003ABZP-DES2@R2.
  - **Shape:** Code shapes and wiring, `src/core/state/types.ts` and `src/workspace/index-worker.ts` below.
  - **Verification:**
    - RM261003ABZP-V15@R2 - core stays pure.
    - RM261003ABZP-V4@R2 - config errors and fallback; file-type keymaps.
    - RM261003ABZP-V5@R1 - resolution order.

- **Code shapes and wiring**
  - **`src/core/state/types.ts` — DI1 unions**
    - **Design:** RM261003ABZP-DES2@R2; Design, Action and Effect protocol.
    - **Phase refinement:** The concrete variants that DI1 needs. DI2 extends the same unions.
    - **Shape:**

      ```ts
      export type Action =
        | { type: "key"; key: Key; now: number } | { type: "resize"; cols: number; rows: number }
        | { type: "fileLoaded"; path: string; file: TextFile } | { type: "fileRefused"; path: string; reason: "binary" | "tooLarge" }
        | { type: "saved"; path: string; stamp: Stamp } | { type: "saveFailed"; path: string; reason: string }
        | { type: "fileChanged"; event: FileEvent } | { type: "fsResult"; op: FsOp; ok: boolean; reason?: string }
        | { type: "trashAvailable"; available: boolean } | { type: "timer"; id: TimerId; now: number }
        | { type: "clipboardText"; text: string } | { type: "mouse"; event: MouseEvent };
      export type Effect =
        | { kind: "read"; path: string } | { kind: "write"; path: string; text: string; expected?: Stamp }
        | { kind: "create" | "rename" | "move" | "trash"; op: FsOp }
        | { kind: "startTimer"; id: TimerId; ms: number } | { kind: "cancelTimer"; id: TimerId }
        | { kind: "clipboardWrite"; text: string } | { kind: "clipboardRead" } | { kind: "exit"; code: number };
      // DI2 adds: Action indexBatch | indexReady | searchResults | configLoaded | stateLoaded;
      //           Effect search | saveState
      ```

      Every effect that can fail answers with a result action (`fileLoaded`/`fileRefused`, `saved`/`saveFailed`, `fsResult`). `key` and `timer` carry `now`, so autosave and which-key timing are pure functions of the actions.

    - **Callers and wiring:** `src/app/effects.ts` `runEffect` switches on `kind`. UI input produces `key`, `resize`, and `mouse` actions.
    - **Invariants:** no callbacks inside effects, and no `Date.now()` in core.
    - **Verification:** RM261003ABZP-V1@R1 - conflict and autosave reducers are tested as pure functions. RM261003ABZP-V15@R2 - core imports.

  - **`src/core/kernel/view/text-view.ts` and `src/core/filetypes/registry.ts` — DI1 language-neutral source view**
    - **Design:** RM261003ABZP-DES9@R3, RM261003ABZP-DES17@R1; Design, `src/core/kernel/view/text-view.ts`, `src/core/filetypes/registry.ts` and `src/core/lang/code/highlight.ts`.
    - **Phase refinement:**
      - DI1 ships `layoutText`, `TextView`, `Decoration`, and `RenderLine` at their final RM261003ABZP-DES9@R3 shapes. Its only providers emit `mark` decorations, so every file — note or code — renders as source.
      - DI1 registers `text`, the code file types, and `markdown` with one `source` view. DI2 adds Markdown `analyze`. DI3 adds the `live` and `reading` views and their `livePreview` provider without changing `layoutText`, `EditorView`, or `RenderLine`.
    - **Shape:**

      ```ts
      // src/app/main.ts — DI1 registrations
      fileTypes.register(textFileType);                          // fallback: no highlighter
      for (const ft of codeFileTypes) fileTypes.register(ft);    // typescript, javascript, json, yaml, toml, shell, … via lowlightHighlighter
      fileTypes.register(markdownFileType);                      // DI1 views: [source]; DI2: + analyze; DI3: + live, reading

      // DI1 window providers: the file type's highlighter marks, then search-match and selection marks
      layoutText(view, [highlightMarks(ft.highlighter), searchMarks(s.vim.search), selectionMarks(win)], undefined);
      ```

      Rows outside the viewport are never produced, and the highlighter reads at most 200 lines above the viewport, so the keystroke path is viewport-bound from the first PR for notes and code alike.

    - **Callers and wiring:** `src/ui/editors/text-view.ts` per frame; `update` calls `fileTypes.forPath` on `fileLoaded`. In DI3 the same call site appends the active view's providers.
    - **Invariants:** cursor column ↔ source column mapping through span offsets (RenderLine model); `layoutText` with no providers returns raw lines; a highlighter error drops that range to plain text.
    - **Verification:** RM261003ABZP-V18@R1 - file types, refusal, BOM/EOL save; RM261003ABZP-V15@R2 - kernel imports; DI1 bench harness (keystroke and open in source view; an early guard, not S9 evidence); RM261003ABZP-UV1@R2 goldens.

  - **`src/workspace/index-worker.ts` — DI2 worker protocol**
    - **Design:** RM261003ABZP-DES7@R3; Design, NoteSummary and NoteIndex, Startup flow.
    - **Phase refinement:** The message set between the main thread and the worker.
    - **Shape:**

      ```ts
      export type ToWorker =
        | { t: "scan"; root: string; ignore: string[] }                 // hidden dirs + .gitignore patterns
        | { t: "changed"; paths: string[] } | { t: "removed"; paths: string[] }
        | { t: "search"; id: number; query: string; limit: number };   // full-text and unlinked mentions
      export type FromWorker =
        | { t: "batch"; summaries: NoteSummary[]; done: number; total: number }
        | { t: "ready" } | { t: "results"; id: number; hits: SearchHit[] } | { t: "error"; message: string };
      ```

      The app forwards each `FromWorker` message as an action (`indexBatch`, `indexReady`, `searchResults`). The watcher's `fileChanged` events become `changed` and `removed` messages. Search ids let `update` drop stale results when the query has changed.

    - **Callers and wiring:** `src/app/main.ts` spawns the worker after the first frame. The `search` effect posts `search`. The worker owns file reading for summaries and text search.
    - **Invariants:** the main thread never scans or reads every note. The worker never writes files.
    - **Verification:** RM261003ABZP-V13@R1 - typing during indexing still meets the keystroke budget. RM261003ABZP-UV4@R2 - files and grep picker rows, including non-Markdown files.

  - **`src/core/features/links/mentions.ts` — DI2 `link.linkMention`**
    - **Design:** RM261003ABZP-DES7@R3 (`link.linkMention`); UI design RM261003ABZP-UDES6@R1.
    - **Phase refinement:** The span edit and how it reaches open and closed notes.
    - **Shape:**

      ```ts
      export function linkMentionEdit(ix: NoteIndex, target: string, hit: MentionHit): FileEdit {
        const name = basenameNoExt(target);
        const link = hit.text === name ? `[[${shortestUnique(ix, target)}]]`
                                       : `[[${shortestUnique(ix, target)}|${hit.text}]]`;
        return { path: hit.path, edits: [{ range: hit.range, text: link }] };
      }
      ```

      The command applies the `FileEdit` in memory when `hit.path` is open (the buffer becomes dirty and one `u` reverts it). Otherwise it emits a `write` effect through `atomicWrite`. The backlinks panel then refreshes from the updated summary.

    - **Callers and wiring:** the side panel `l` key → `link.linkMention`. In the narrow layout the backlinks picker uses the same command.
    - **Invariants:** only the mention span changes, and the hit is re-validated against current text before editing (stale hit → toast, no edit).
    - **Verification:** RM261003ABZP-V6@R2 case (b); RM261003ABZP-UV5@R1 - the mention moves to Linked.

- **Migration and compatibility**
  - **Design:** RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R1; Design, Cross-cutting and Evolution (no prior data format).
  - **Phase refinement:**
    - No migration exists. Notes stay plain Obsidian-compatible files, and `.obsidian/` is never read or written.
    - The state file starts with `"version": 1`. A missing, corrupt, or unknown-version file loads as empty state, so a later format change needs no migration code.
  - **Transition:** empty repo → DI1 merged (editor, no links) → DI2 merged (links) → release `v0.1.0`. Rollback before `v0.1.0`: revert the PR on `main`. After `v0.1.0`: install a previous release binary. Notes need no rollback.
  - **Verification:** RM261003ABZP-V14@R1 - release dry run and smoke. RM261003ABZP-V4@R2 (d) - XDG path rules.

- **UI realization:**
  - **DI1:**
    - RM261003ABZP-UDES1@R2 - Application shell, Statusline, Toast stack.
    - RM261003ABZP-UDES2@R1 - mode badges, cursor shape, Command line with ex and command-id completion.
    - RM261003ABZP-UDES7@R2 - explorer `a r m d`, trash with typed-confirm fallback, Conflict dialog and diff, undoable reload.
    - RM261003ABZP-UDES11@R1 - Theme tokens with dark, light, and nocolor, layout classes, mouse optional.
    - RM261003ABZP-UDES3@R2 (non-Markdown part) - source view for code and text files with syntax colouring; statusline `source` view without backlinks or words (RM261003ABZP-UDES1@R2); refused-file message line (RM261003ABZP-UDES7@R2).
    - Accepted mockups: RM261003ABZP-M1@R1 and RM261003ABZP-M4@R1 (explorer and conflict states); manifest AD4.
  - **DI2:**
    - RM261003ABZP-UDES5@R2 - Which-key (300 ms), Picker sources over all files and text grep, palette `●` override markers, file-type filtering, Help with scope labels.
    - RM261003ABZP-UDES6@R1 - Completion popup never on the cursor row, `jump i/n`, create prompt, backlinks panel, rename impact prompt.
    - RM261003ABZP-UDES7@R2 - move prompt with link impact.
    - Side panel outline and backlinks.
    - Accepted mockups: RM261003ABZP-M3@R1 and RM261003ABZP-M4@R1.
  - **Refinement:** statusline segments render only for state that exists. `view` ships in DI1 (always `source` until DI3 adds `live` and `reading`), `index` and backlinks in DI2, and `preview` in DI3, so UV1's full segment-order assertion, including its `sync.ts` row, completes in DI3. PH1 checks the `sync.ts` statusline as a partial UV1 (`MODE │ source │ scripts/sync.ts │ index │ Ln:Col`, no backlinks or words). The non-Markdown source view ships in DI1 and is proven in PH1 by RM261003ABZP-V18@R1; RM261003ABZP-UV3@R2's `sync.ts` painting assertions run with the rest of UV3 in DI3.
- **Consistency:**
  - These refinements implement the pinned DES and UDES revisions without changing any requirement.
  - Introducing state per DI ends at the exact RM261003ABZP-DES2@R2 shape.
  - DI1's kernel view is the final RM261003ABZP-DES9@R3 contract; later DIs add providers and file-type registrations only.
  - The worker protocol and `linkMentionEdit` make RM261003ABZP-DES7@R3 concrete without adding responsibilities.

## Delivery Items

- **RM261003ABZP-DI1@R2 — Editor foundation**
  - **Requirements:**
    - RM261003ABZP-REQ1@R3 - Folder workspace, any text file in source view, and safe file management.
    - RM261003ABZP-REQ2@R2 - Vim-modal editing with a core command set.
    - RM261003ABZP-REQ10@R2 - Fast development, CI, and release.
    - RM261003ABZP-REQ11@R3 - Pure core with enforced boundaries including the kernel rule, file-type and highlighter registration, Conventional Commits and SemVer, terminal restore, `NO_COLOR`, platform support.
    - RM261003ABZP-REQ9@R2 - The benchmark harness and CI gate mechanism only; DI2 and DI3 deliver the measured targets.
  - **Outcome:** `so ~/notes` opens a folder in a LazyVim-style shell where the user edits notes and any other text file with real vim keys, splits, and buffers; code and config files show syntax colouring, and binary or oversized files are refused with a message. Autosave never corrupts or silently overwrites a file, and keeps its BOM and line endings. Explorer file operations, including trash, work, and the terminal is always restored. From this PR onward every change runs through `bun run check` (< 30 s), CI (< 3 min), the boundary test, and the bench gate, and a tag produces four release binaries.
  - **Explanation:**

    ```text
    so ~/notes/plan.md → shell (explorer │ editor │ statusline) → ci( inside (url) → type → Esc
       → 1 s idle → atomicWrite (tmp → fsync → rename) → "● " clears
    external edit while dirty → Conflict: [k]eep mine  [t]ake disk  [d]iff   (autosave paused)
    explorer: a "ideas/" → folder; d → "Move to Trash? [y/N]" (no trash → type the name)
    :e scripts/sync.ts → source view, TypeScript colours │ :e photo.png → "binary file — not opened"
    :q / SIGTERM / crash → main screen, cursor visible, kitty keyboard + mouse off
    ```

  - **Scope:**
    - Tooling and delivery:
      - `package.json` scripts (`dev`, `check`, `test`, `bench`, `build`) with an exact `@opentui/core` pin.
      - TS 7 strict, Biome, knip, the boundary test.
      - CI `check` ∥ `test` jobs.
      - release-please and the release workflow (4 targets, `SHA256SUMS`, smoke `so --version`), exercised on a manually pushed `v0.1.0-rc.1` tag.
    - Core:
      - store and reducer; command registry and keymap trie;
      - kernel boundary: `core/kernel/{text,editor,vim,commands,view}` importing only the kernel;
      - TextBuffer, undo blocks, and registers (including `"+` through clipboard effects);
      - the vim engine for the full RM261003ABZP-REQ2@R2 command set, search highlight, `:s`/`:%s`, and ex commands `:w :q :wq :q! :e :sp :vs :bn :bp :bd` with completion;
      - window tree with `Ctrl-w h/j/k/l`;
      - `layoutText` with `mark` decorations (highlighter, search, selection);
      - `FileTypeRegistry` with `text`, code file types, and `markdown` (source view); `EditorKindRegistry` with the built-in `text` kind; `lowlightHighlighter`; `KeyScope` and `filetypes?` in the registry (global bindings only).
    - Workspace:
      - path resolution (folder, file's parent, missing → exit 2);
      - `readTextFile` (binary and 16 MiB refusal; BOM and line ending kept and restored on save);
      - explorer tree that excludes hidden folders and `.gitignore` matches;
      - create (`a` adds `.md` only when the name has no extension), rename, move (file only; links in DI2), and trash (freedesktop / Finder / typed confirm);
      - `atomicWrite` with permission and symlink handling;
      - autosave policy and backoff retry;
      - recursive watcher with own-write stamps; undoable reload; conflict keep/take/diff.
    - UI:
      - shell regions and layout classes; bufferline, explorer (docked/floating), `editorViews` with the text editor view, statusline (mode, view = `source`, path, dirty, words for notes only, Ln:Col), command line and message line (including refusal texts), prompts, conflict and diff, toasts;
      - theme (dark, light, `NO_COLOR` attribute mapping); cursor shape; kitty keyboard protocol with Esc timeout (default 50 ms from config defaults);
      - restore on `:q`, signals, and uncaught errors.
    - Performance: frame coalescing; bench harness and CI gate (median of 5, 2× target) with source-view keystroke and open benchmarks on the 5,000-line fixture, highlighting included.
  - **Exclusions:**
    - Config file loading, which-key popup, pickers, palette, help, Markdown-scoped keys, state persistence, links, and index (DI2).
    - Markdown live and reading views, widgets, and the browser preview (DI3).
    - Code intelligence and notebooks (index Deferred Scope).
    - Daily notes and Bases (DI4).
  - **Design:**
    - RM261003ABZP-DES1@R2 - four layers, the kernel rule, and the boundary test; Design, System Architecture.
    - RM261003ABZP-DES2@R2 - store and effects; Design, `src/core/state/update.ts`.
    - RM261003ABZP-DES3@R1 - TextBuffer and undo; Design, TextBuffer model.
    - RM261003ABZP-DES4@R1 - table-driven vim engine; Design, `src/core/kernel/vim/engine.ts`.
    - RM261003ABZP-DES5@R2 - registry and keymap core with `KeyScope`; Design, `src/core/kernel/commands/registry.ts`.
    - RM261003ABZP-DES8@R1 - atomic save, watcher, trash; Design, Save and external change flow.
    - RM261003ABZP-DES9@R3 - kernel text view and decorations (no live-preview provider); Design, `src/core/kernel/view/text-view.ts`.
    - RM261003ABZP-DES10@R2 - OpenTUI shell, editor views, input, restore; Design, `src/ui/editors/text-view.ts` and `src/ui/input.ts`.
    - RM261003ABZP-DES17@R1 - file-type registry, highlighter, text-file open policy; Design, Open a file flow, `src/core/filetypes/registry.ts`, `src/workspace/fs.ts`.
    - RM261003ABZP-DES15@R1 - toolchain, CI, release; Design, Project Structure.
    - RM261003ABZP-DES16@R1 - frame coalescing and bench gates; Design, Keystroke to frame flow.
  - **UI scope:**
    - RM261003ABZP-M1@R1, RM261003ABZP-M4@R1 (S10–S17 explorer and conflict states); manifest AD4.
    - RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ11@R1, RM261003ABZP-UREQ3@R2 (non-Markdown source view).
    - RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view).
    - UI design surfaces: Application shell, Editor window (non-Markdown file states), File operations and disk changes. Components: Statusline, Command line, Prompt, Conflict dialog and diff, Toast stack, Theme.
  - **Phase design:**
    - Architecture and boundaries; Components and files (DI1 rows).
    - Runtime and failure flow (startup, save, and watcher branches).
    - Code shapes `src/core/state/types.ts` and `src/core/kernel/view/text-view.ts` with `src/core/filetypes/registry.ts`; Migration and compatibility.
  - **Dependencies:** None
  - **Cross-work gates:** Producer of G1 (this phase, Cross-Work Dependency Gates).
  - **Success:**
    - RM261003ABZP-S1@R1 - notes are never lost or silently overwritten.
    - RM261003ABZP-S2@R1 - vim behaves like Neovim.
    - RM261003ABZP-S10@R1 - check < 30 s, CI < 3 min, four binaries.
    - RM261003ABZP-S11@R1 (boundary and restore part).
    - RM261003ABZP-S12@R1 - any text file opens safely on a language-neutral core.
  - **Verification:**
    - RM261003ABZP-V1@R1 - atomic save and external change.
    - RM261003ABZP-V2@R1 - vim table tests against Neovim 0.11.
    - RM261003ABZP-V3@R1 - Esc latency.
    - RM261003ABZP-V14@R1 - check timing, CI timing, release dry run on `v0.1.0-rc.1`.
    - RM261003ABZP-V15@R2 - import boundary, including the kernel violation fixture.
    - RM261003ABZP-V17@R1 - PTY restore and `NO_COLOR`.
    - RM261003ABZP-V18@R1 - open text, code, binary, and oversized files; BOM and CRLF save.
    - All definitions are owned by `rm261003abzp-design.md`.
  - **UI success and verification:**
    - RM261003ABZP-US1@R2 via RM261003ABZP-UV1@R2 (startup frame, explorer hidden, `:vs` split, save-failed, toasts, partial `sync.ts` statusline) and RM261003ABZP-UV2@R1 (badges, cursor shape, `E492`, `:vs` Tab → `vsplit`).
    - RM261003ABZP-US5@R2 via RM261003ABZP-UV6@R2 (create with extension rule, rename, move, trash and typed-confirm, conflict, diff, reload undo, refused binary and oversized files).
    - RM261003ABZP-US9@R1 via RM261003ABZP-UV10@R1 for these states: Normal/Insert badge, visual selection, cursorline, dirty buffer, error toast.
  - **Downstream work boundary:**
    - The DI1 `s1mple-discuss` pins the Bun and `@opentui/core` versions. It confirms the OpenTUI paint, buffer, and test-renderer APIs, recursive `fs.watch`, and Finder trash automation, and records the results.
    - It chooses file-level module splits and test layouts. It may not:
      - add AppState fields for later DIs;
      - weaken atomic-save, restore, or boundary rules;
      - change the command, registry, file-type, or `layoutText` contracts consumed by DI2 and DI3;
      - add language-specific code to `core/kernel`.
    - If recursive `fs.watch` or the OpenTUI APIs differ materially from the design, the work returns to roadmap design clarification.
  - **Predecessors:** RM261003ABZP-DI1@R1

- **RM261003ABZP-DI2@R2 — Navigation and links**
  - **Requirements:**
    - RM261003ABZP-REQ3@R4 - Leader and which-key, pickers over all files, text search, palette, help, file-type-scoped keymaps, config, persisted recents and jumps.
    - RM261003ABZP-REQ4@R3 - Obsidian links, backlinks with link-mention, tags, completion, rename and move.
    - RM261003ABZP-REQ9@R2 - Cold start < 200 ms with 10,000 notes and index < 3 s without blocking input.
    - RM261003ABZP-REQ11@R3 - `syntaxExtensions` registration for Obsidian syntax.
  - **Outcome:** The folder becomes a navigable, linked knowledge base: `Space` reveals every command, `Space f f` finds any file, `Space s g` searches notes and text files, and `gd` follows `[[links]]` in notes while note keys stay out of code files. Backlinks show who links here and can link unlinked mentions. Renames keep every link intact. This completes the requirements' minimum valuable release, so PH1 can ship `v0.1.0`.
  - **Explanation:**

    ```text
    Space (300 ms) → which-key: f +find  n +notes  l +links …   → f f "srd" → projects/so-roadmap.md
    Insert "[[pl" → popup (never on cursor row) → "#" → headings → Enter → [[plan#Goals]]
    gd → plan.md at "Goals", statusline "jump 2/2" → Ctrl-o → "jump 1/2"
    <leader>lb → Linked mentions (12) … Unlinked mentions (3) → l → "[[plan|Plan]]" written in that note
    <leader>lr "roadmap" → "31 links in 12 files" → Enter → toast "12 files updated"
    in sync.ts: gd → nothing │ :link.follow → "not available for typescript files"
    ```

  - **Scope:**
    - `core/lang/markdown`: `parseDoc` with block cache and the Obsidian syntax extensions (wikilink, embed, tag, highlight, comment, callout, blockId, footnote, math) via the `syntaxExtensions` registry.
    - `core/features/links`:
      - summaries, NoteIndex, the resolution rule, `planRename`, `linkMentionEdit`, fuzzy matching;
      - tags (inline, nested, frontmatter) and aliases;
      - Markdown-link URL decoding.
    - Index worker:
      - scan with hidden-folder and `.gitignore` exclusion; the list of every non-excluded file; note summaries in batches; full-text search over notes and text files within 16 MiB, skipping binary files;
      - updates from watcher events;
      - restart-once policy.
    - Commands and UI:
      - which-key (300 ms), with direct actions before `+groups`;
      - pickers: files (all non-excluded files), recent, grep (notes and text files), headings, tags with counts, backlinks, commands;
      - palette (`<leader>:`) and `:` completion of command ids, both listing only commands available for the active file type; help (`<leader>?`, `:help`) with override markers and scope labels;
      - Markdown-scoped bindings (`gd`, `Enter` follow) and the `not available for <type> files` notice for note commands run elsewhere;
      - outline (`<leader>o`) and backlinks side panel, which become pickers at 80×24.
    - Links:
      - `gd`/`Enter` follow to heading or block; `Ctrl-o`/`Ctrl-i` jumps with the `jump i/n` indicator;
      - create prompt for unresolved links; `[[` completion for notes, aliases, `#` headings, and `#^` blocks;
      - rename and move with impact prompt and link rewrite across open (in memory) and closed (atomic write) notes.
    - Config and state:
      - XDG TOML loading with file and line errors and fallback to defaults;
      - keymap overrides (`[keys.<mode>]` and `[filetypes.<id>.keys.<mode>]`) and option overrides, including `escTimeoutMs`, autosave, and `theme`/`color`;
      - state file with recents, jumps, open buffers, and window layout (`"version": 1`, debounced 2 s and on exit).
    - Statusline: index progress and backlinks count segments (backlinks for notes only).
    - Performance: 10,000-note generator and the RM261003ABZP-V13@R1 benchmark in CI.
  - **Exclusions:**
    - Rendering links as styled text, and the unresolved-link error colour in the editor (DI3 layout).
    - Inline embeds (DI3).
    - Calendar and template pickers (DI4).
    - Reading or writing `.obsidian/`.
  - **Design:**
    - RM261003ABZP-DES5@R2 - which-key, palette, help, and overrides read one registry; file-type-scoped keys and commands; Design, `src/core/kernel/commands/registry.ts`.
    - RM261003ABZP-DES6@R1 - block-cached Doc and syntax extensions; Design, `src/core/lang/markdown/doc.ts`.
    - RM261003ABZP-DES7@R3 - worker index, file list, text search, resolution order, rename, link-mention; Design, NoteSummary and NoteIndex, `resolve.ts` and `rename.ts`.
    - RM261003ABZP-DES17@R1 - `markdown` file type `analyze`; search respects the open policy limits.
    - RM261003ABZP-DES8@R1 - writes for rename and link-mention through `atomicWrite`.
    - RM261003ABZP-DES10@R2 - overlays and side panel.
    - RM261003ABZP-DES14@R1 - TOML config and XDG state; Design, AppConfig.
    - RM261003ABZP-DES16@R1 - worker keeps indexing off the input path; Design, Startup flow.
  - **UI scope:**
    - RM261003ABZP-M3@R1, RM261003ABZP-M4@R1 (S1–S9, S18), RM261003ABZP-M1@R1 (panel and indexing states).
    - RM261003ABZP-UREQ5@R2, RM261003ABZP-UREQ6@R1, RM261003ABZP-UREQ1@R2 (index, backlinks, panels), RM261003ABZP-UREQ7@R2 (move impact), RM261003ABZP-UREQ11@R1.
    - RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES1@R2, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1.
    - UI design surfaces: Overlays, Links and backlinks. Components: Which-key, Picker, Completion popup, Prompt, Command line.
  - **Phase design:** Components and files (DI2 rows); Runtime and failure flow (worker and rename branches); Code shapes `src/workspace/index-worker.ts` and `src/core/features/links/mentions.ts`; Contracts, data, and state (DI2 additions); Migration (state file version).
  - **Dependencies:** RM261003ABZP-DI1@R2 - store, registry with `KeyScope`, file types, shell, overlays, write path, CI, bench harness.
  - **Cross-work gates:** Consumer of G1 (this phase); producer of G2 and G3 (`rm261003abzp-roadmap-phase-2-obsidian-experience.md`, Cross-Work Dependency Gates).
  - **Success:**
    - RM261003ABZP-S3@R1 - discoverable and configurable.
    - RM261003ABZP-S4@R1 - deterministic links and intact rename.
    - RM261003ABZP-S9@R1 (startup and index part).
  - **Verification:**
    - RM261003ABZP-V4@R2 - which-key, override binding, config error at line 7, XDG relative path, palette ranking, file-type keymaps, palette filtering, and the unavailable-command notice.
    - RM261003ABZP-V5@R1 - resolution rule.
    - RM261003ABZP-V6@R2 - rename and link-mention.
    - RM261003ABZP-V13@R1 - startup and index benchmarks.
    - All definitions are owned by `rm261003abzp-design.md`.
  - **UI success and verification:**
    - RM261003ABZP-US3@R2 via RM261003ABZP-UV4@R2.
    - RM261003ABZP-US4@R1 via RM261003ABZP-UV5@R1.
    - RM261003ABZP-US1@R2 via RM261003ABZP-UV1@R2 (indexing segment, index-ready toast, outline and backlinks panel).
    - RM261003ABZP-US5@R2 via RM261003ABZP-UV6@R2 (move with link impact).
    - RM261003ABZP-US9@R1 via RM261003ABZP-UV10@R1 for the picker selection state.
  - **Downstream work boundary:** The DI2 discussion refines the fuzzy scoring constants, picker preview content, and search result limits. It may not:
    - change the resolution order or rename format preservation;
    - change the worker protocol semantics consumed by DI3 and DI4;
    - persist the index;
    - write files into the workspace other than the user's files;
    - bind note keys or commands outside the `markdown` file type.
  - **Predecessors:** RM261003ABZP-DI2@R1

## Success and Verification

All records are reused. System records are owned by `rm261003abzp-design.md`, Success and Verification; UI records by `rm261003abzp-ui-design.md`, UI Success Criteria and Implementation Verifications. No definition is copied or revised here.

- **RM261003ABZP-S1@R1 — Notes are never lost or silently overwritten**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V1@R1 — Atomic save and external-change handling** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S2@R1 — The core vim command set behaves like Neovim**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V2@R1 — Vim command table tests** — **Definition:** `rm261003abzp-design.md`
    - **RM261003ABZP-V3@R1 — Esc latency on legacy terminals** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S3@R1 — Commands are discoverable and configurable**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V4@R2 — Keymap, which-key, palette, file-type scope, and config** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S4@R1 — Links resolve deterministically and rename keeps the graph intact**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V5@R1 — Resolution rule** — **Definition:** `rm261003abzp-design.md`
    - **RM261003ABZP-V6@R2 — Rename and link-mention preserve link formats** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S9@R1 — Performance targets hold** (PH1 part)
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V13@R1 — Startup and index benchmarks** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S10@R1 — Development, CI, and release are fast and automatic**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V14@R1 — Check timing, CI timing, and release dry run** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S11@R1 — Foundations stay clean and the terminal is always restored** (PH1 part)
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V15@R2 — Import boundary test** — **Definition:** `rm261003abzp-design.md`
    - **RM261003ABZP-V17@R1 — Terminal restore on every exit path** — **Definition:** `rm261003abzp-design.md`
- **RM261003ABZP-S12@R1 — Any text file opens safely on a language-neutral core**
  - **Definition:** `rm261003abzp-design.md`, Success and Verification
  - **Verification:**
    - **RM261003ABZP-V18@R1 — Open text, code, binary, and oversized files** — **Definition:** `rm261003abzp-design.md`
- **UI:**
  - RM261003ABZP-US1@R2 (RM261003ABZP-UV1@R2 PH1 states, RM261003ABZP-UV2@R1)
  - RM261003ABZP-US3@R2 (RM261003ABZP-UV4@R2)
  - RM261003ABZP-US4@R1 (RM261003ABZP-UV5@R1)
  - RM261003ABZP-US5@R2 (RM261003ABZP-UV6@R2)
  - RM261003ABZP-US9@R1 (RM261003ABZP-UV10@R1 PH1 states)
  - All definitions are owned by `rm261003abzp-ui-design.md`.

## Release and Exit Criteria

- **Release approach:** RM261003ABZP-DES15@R1:
  - release-please accumulates Conventional Commits on `main`.
  - The release PR is merged only after the PH1 exit evidence below passes, which tags `v0.1.0`.
  - The release workflow cross-compiles four binaries, publishes `SHA256SUMS`, and smoke-tests `so --version` on macOS and Linux.
- **Compatibility:** Notes stay valid Obsidian files, other text files keep their BOM and line endings, and `so` writes nothing into the workspace except the user's files. `.obsidian/` is never touched.
- **Rollback:**
  - Before `v0.1.0`, revert the offending PR on `main`.
  - After `v0.1.0`, users reinstall a previous binary (RM261003ABZP-DES15@R1). A corrupt or unknown-version state file loads as empty.
- **Exit criteria:**
  - RM261003ABZP-S1@R1 - complete old-or-new files, no silent overwrite; verified by RM261003ABZP-V1@R1
  - RM261003ABZP-S2@R1 - Neovim-equal results; verified by RM261003ABZP-V2@R1, RM261003ABZP-V3@R1
  - RM261003ABZP-S3@R1 - discoverable and safely configurable; verified by RM261003ABZP-V4@R2
  - RM261003ABZP-S4@R1 - deterministic links, format-preserving rename and link-mention; verified by RM261003ABZP-V5@R1, RM261003ABZP-V6@R2
  - RM261003ABZP-S9@R1 (PH1 part) - first frame < 200 ms, index < 3 s, responsive during indexing; verified by RM261003ABZP-V13@R1
  - RM261003ABZP-S10@R1 - check < 30 s, CI < 3 min, release with four started binaries; verified by RM261003ABZP-V14@R1
  - RM261003ABZP-S11@R1 (PH1 part) - boundary enforced including the kernel rule, terminal restored; verified by RM261003ABZP-V15@R2, RM261003ABZP-V17@R1
  - RM261003ABZP-S12@R1 - any text file opens in source view, binary and oversized files refused, BOM and line endings kept; verified by RM261003ABZP-V18@R1
  - RM261003ABZP-US1@R2 (PH1 states), RM261003ABZP-US3@R2, RM261003ABZP-US4@R1, RM261003ABZP-US5@R2, RM261003ABZP-US9@R1 (PH1 states) - as in M1, M3, M4; verified by RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1, RM261003ABZP-UV4@R2, RM261003ABZP-UV5@R1, RM261003ABZP-UV6@R2, RM261003ABZP-UV10@R1
- **Completion evidence required:**
  - Passing results for every listed V and UV record in CI on the merged DI1 and DI2 PRs.
  - The RM261003ABZP-V14@R1 timing readings.
  - The `v0.1.0` GitHub Release with four binaries, `SHA256SUMS`, and green smoke jobs.
  - A recorded manual run of `so` on a real notes folder on macOS and Linux.
- **Cross-work integration verification:** RM261003ABZP-DI2@R2 owns integration. Its CI run on top of merged DI1 must re-pass RM261003ABZP-V1@R1, RM261003ABZP-V17@R1, and RM261003ABZP-V18@R1, alongside its own records.

Completed child works do not establish phase completion without the required integration, release, and exit evidence. The checks listed here are obligations, not passing results.

## Coverage

| Requirement | Design | Delivery item | Success | Verification |
|---|---|---|---|---|
| RM261003ABZP-REQ1@R3 - folder workspace, text files, safe files | RM261003ABZP-DES8@R1, RM261003ABZP-DES2@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-DI1@R2 | RM261003ABZP-S1@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V1@R1, RM261003ABZP-V18@R1 |
| RM261003ABZP-REQ2@R2 - vim editing | RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES10@R2 | RM261003ABZP-DI1@R2 | RM261003ABZP-S2@R1 | RM261003ABZP-V2@R1, RM261003ABZP-V3@R1 |
| RM261003ABZP-REQ3@R4 - navigation, config, state, file-type scope | RM261003ABZP-DES5@R2, RM261003ABZP-DES7@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES17@R1 | RM261003ABZP-DI2@R2 (registry core in RM261003ABZP-DI1@R2) | RM261003ABZP-S3@R1 | RM261003ABZP-V4@R2 |
| RM261003ABZP-REQ4@R3 - links | RM261003ABZP-DES7@R3, RM261003ABZP-DES6@R1 | RM261003ABZP-DI2@R2 | RM261003ABZP-S4@R1 | RM261003ABZP-V5@R1, RM261003ABZP-V6@R2 |
| RM261003ABZP-REQ9@R2 - performance (startup, index; harness) | RM261003ABZP-DES16@R1 | RM261003ABZP-DI1@R2 (harness), RM261003ABZP-DI2@R2 | RM261003ABZP-S9@R1 | RM261003ABZP-V13@R1 |
| RM261003ABZP-REQ10@R2 - development, CI, release | RM261003ABZP-DES15@R1, RM261003ABZP-DES1@R2 | RM261003ABZP-DI1@R2 | RM261003ABZP-S10@R1 | RM261003ABZP-V14@R1 |
| RM261003ABZP-REQ11@R3 - foundations (boundary and kernel rule, restore, file-type registration) | RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES5@R2, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1 | RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2 (syntax registry) | RM261003ABZP-S11@R1, RM261003ABZP-S12@R1 | RM261003ABZP-V15@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 |

### UI Coverage

| Accepted mockup / feedback | UI requirement | UI design | Delivery item | UI success | UI verification |
|---|---|---|---|---|---|
| RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ1@R2 | RM261003ABZP-UDES1@R2 - Surface: Application shell; Statusline; Toast stack | RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2 (index and panel states) | RM261003ABZP-US1@R2 | RM261003ABZP-UV1@R2 (PH1 states) |
| RM261003ABZP-M1@R1; Acceptance; AD3 | RM261003ABZP-UREQ2@R1 | RM261003ABZP-UDES2@R1 - Surface: Application shell; Command line | RM261003ABZP-DI1@R2 | RM261003ABZP-US1@R2 | RM261003ABZP-UV2@R1 |
| RM261003ABZP-M3@R1; Acceptance; AD1; AD3; AD4 | RM261003ABZP-UREQ5@R2 | RM261003ABZP-UDES5@R2 - Surface: Overlays; Which-key; Picker; Command line | RM261003ABZP-DI2@R2 | RM261003ABZP-US3@R2 | RM261003ABZP-UV4@R2 |
| RM261003ABZP-M3@R1, RM261003ABZP-M4@R1; Acceptance; AD3 | RM261003ABZP-UREQ6@R1 | RM261003ABZP-UDES6@R1 - Surface: Links and backlinks; Completion popup; Prompt | RM261003ABZP-DI2@R2 | RM261003ABZP-US4@R1 | RM261003ABZP-UV5@R1 |
| RM261003ABZP-M4@R1, RM261003ABZP-M1@R1; Acceptance; AD3; AD4 | RM261003ABZP-UREQ7@R2 | RM261003ABZP-UDES7@R2 - Surface: File operations and disk changes; Prompt; Conflict dialog and diff | RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2 (move impact) | RM261003ABZP-US5@R2 | RM261003ABZP-UV6@R2 |
| RM261003ABZP-M2@R1 (source-mode visuals); AD4 | RM261003ABZP-UREQ3@R2 (non-Markdown source view) | RM261003ABZP-UDES3@R2 - Surface: Editor window | RM261003ABZP-DI1@R2 (source view), RM261003ABZP-DI2@R2 (note keys scoped) | RM261003ABZP-S12@R1 (system) in PH1; RM261003ABZP-US2@R2 in PH2 | RM261003ABZP-V18@R1, RM261003ABZP-V4@R2 in PH1; RM261003ABZP-UV3@R2 in DI3 |
| RM261003ABZP-M1@R1, RM261003ABZP-M3@R1, RM261003ABZP-M4@R1; Acceptance; AD3 | RM261003ABZP-UREQ11@R1 (PH1 surfaces) | RM261003ABZP-UDES11@R1 - Section 5 policies; Theme | RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2 | RM261003ABZP-US9@R1 | RM261003ABZP-UV10@R1 (PH1 states) |

## Progress

- **Phase delivery status:** Not started
- **Phase evidence:** None

| DI | Delivery status | Work | PR | Evidence / blocker |
|---|---|---|---|---|
| RM261003ABZP-DI1@R2 | Not started | Pending | Pending | None |
| RM261003ABZP-DI2@R2 | Not started | Pending | Pending | None |

## Unresolved Items

None. The DI1 discussion must confirm four things; none is an open decision:

- Recursive `fs.watch`, verified by RM261003ABZP-V1@R1 on macOS and Linux.
- The OpenTUI paint and test-renderer APIs, exercised by RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1, and the DI1 bench harness.
- Finder-trash automation, by a manual macOS check recorded in the DI1 PR. The typed-confirmation fallback is verified by RM261003ABZP-UV6@R2.
- The `lowlight` language set and version pin, exercised by RM261003ABZP-V18@R1 and the DI1 bench harness.

A material mismatch returns to roadmap design clarification.

## Approval

- **Approved phase:** RM261003ABZP-PH1@R2
- **Approved delivery items:** RM261003ABZP-DI1@R2, RM261003ABZP-DI2@R2
- **Approved phase design:** This document's Phase Design, from Architecture and boundaries through UI realization. Pinned upstream:
  - RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES6@R1, RM261003ABZP-DES7@R3, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3, RM261003ABZP-DES10@R2, RM261003ABZP-DES14@R1, RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1;
  - RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view), RM261003ABZP-UDES5@R2, RM261003ABZP-UDES6@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1.
- **Success and verification baseline:**
  - Design-owned: RM261003ABZP-S1@R1, RM261003ABZP-S2@R1, RM261003ABZP-S3@R1, RM261003ABZP-S4@R1, RM261003ABZP-S9@R1, RM261003ABZP-S10@R1, RM261003ABZP-S11@R1, RM261003ABZP-S12@R1; RM261003ABZP-V1@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1, RM261003ABZP-V4@R2, RM261003ABZP-V5@R1, RM261003ABZP-V6@R2, RM261003ABZP-V13@R1, RM261003ABZP-V14@R1, RM261003ABZP-V15@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1.
  - UI-design-owned: RM261003ABZP-US1@R2, RM261003ABZP-US3@R2, RM261003ABZP-US4@R1, RM261003ABZP-US5@R2, RM261003ABZP-US9@R1; RM261003ABZP-UV1@R2, RM261003ABZP-UV2@R1, RM261003ABZP-UV4@R2, RM261003ABZP-UV5@R1, RM261003ABZP-UV6@R2, RM261003ABZP-UV10@R1.
- **Approval evidence:**
  - R1: the user delegated all decisions on 2026-10-03 ("you self-drive and decide all … don't raise any question to me"; "prevent many DIs and phases split"). Under that delegation the agent approved this phase and its two DIs, the per-DI state introduction, the source-only DI1 layout, the worker protocol, `linkMentionEdit`, the state-file version, and the `v0.1.0` release at phase exit.
  - R2: on 2026-10-03 the user asked to leave room for a code editor and notebooks and selected "Apply all six (Recommended)" (`rm261003abzp-roadmap-context.md@R2`). Under the standing delegation the agent approved the PH1@R2 refinements: the kernel, file-type registry, highlighter, and text-file open policy in DI1; file-type-scoped keys, all-file pickers, and text search in DI2; the same phase split and `v0.1.0` release.
