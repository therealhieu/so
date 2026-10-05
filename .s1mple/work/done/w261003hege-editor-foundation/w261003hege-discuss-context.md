# W261003HEGE: editor-foundation

## Sources

| Source | Use |
|---|---|
| `.s1mple/S1MPLE.md` | Discuss behavior and required context |
| `.s1mple/docs/project.md` | Reusable project baseline |
| `.s1mple/docs/communication.md`, `.s1mple/docs/languages/typescript.md` | Chat and document rules; TypeScript rules (toolchain and conventions `Not established`) |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md` | Roadmap status, DI1 row (Work and PR `Pending`), Work Progress, delivery constraints, UI coverage |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-roadmap-phase-1-daily-usable-editor.md` | PH1@R2 definition, gate G1, Phase Design, DI1@R2 definition, Unresolved Items, Approval |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-roadmap-context.md` | Context R2: empty repository, Alfred porting references, scope change ("Apply all six") |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-requirements.md` | REQ1@R3, REQ2@R2, REQ9@R2, REQ10@R2, REQ11@R3 definitions and acceptance criteria |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-design.md` | DES1–DES17 decisions, architecture, project structure, runtime flows, contracts, code shapes, S/V definitions |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-research.md` | RF1, RF3, RF5, RF6, RF11, RF13, RF14 evidence for DI1 choices |
| `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-ui-requirements.md`, `rm261003abzp-ui-design.md` | UREQ/UDES/US/UV records assigned to DI1 |
| `.s1mple/work/done/rm261003abzp-so-v1/ui-mockups/manifest.md` | Accepted mockups M1@R1, M4@R1, AD4; cycle 3 drafts M1@R2, M3@R2 awaiting review |
| Repository root (`.gitignore`, `AGENTS.md`, `CLAUDE.md`, `git log`) | Current repository state: only `.s1mple/` guidance, one commit `d00d3a3` |
| `../alfred/apps/tui/src/terminal/shutdown.ts`, `../alfred/apps/tui/src/view/editor/vim.ts`, `../alfred/apps/tui/src/view/markdown/code-highlight.ts`, `../alfred/packages/view-model/src/knowledge/autosave-queue.ts` | Porting references named by the parent design; all four files exist |
| Local toolchain (`bun --version`, `nvim --version`) | Bun 1.3.10 and Neovim 0.12.4 installed on the developer machine (2026-10-03) |

## Roadmap Binding

- **Roadmap:** RM261003ABZP — `.s1mple/work/done/rm261003abzp-so-v1/rm261003abzp-roadmap-index.md` (Status `Approved`, line 3)
- **Phase:** RM261003ABZP-PH1@R2 — Daily-usable editor; definition in `rm261003abzp-roadmap-phase-1-daily-usable-editor.md` (Phase Definition, lines 10–36; Phase Design, lines 100–319)
- **Delivery item:** RM261003ABZP-DI1@R2 — Editor foundation; definition in `rm261003abzp-roadmap-phase-1-daily-usable-editor.md` (Delivery Items, lines 323–424); index row `rm261003abzp-roadmap-index.md:131`
- **Accepted upstream baseline:**
  - Context: `rm261003abzp-roadmap-context.md@R2`.
  - Requirements (`rm261003abzp-requirements.md`, Requirement Details): RM261003ABZP-REQ1@R3 (line 59), RM261003ABZP-REQ2@R2 (line 83), RM261003ABZP-REQ9@R2 (line 226; harness and gate mechanism only), RM261003ABZP-REQ10@R2 (line 248), RM261003ABZP-REQ11@R3 (line 270).
  - Design (`rm261003abzp-design.md`, Design Decisions and Traceability, lines 1115–1300): RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2, RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3 (kernel text view only), RM261003ABZP-DES10@R2, RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1, RM261003ABZP-DES17@R1. The phase design also pins RM261003ABZP-DES14@R1 for the DI1 part `src/core/config/schema.ts` (zod schema and defaults used directly, phase file line 139).
  - Success and verification (`rm261003abzp-design.md`, Success and Verification, lines 855–1113): RM261003ABZP-S1@R1, RM261003ABZP-S2@R1, RM261003ABZP-S10@R1, RM261003ABZP-S11@R1 (boundary and restore part), RM261003ABZP-S12@R1; RM261003ABZP-V1@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1, RM261003ABZP-V14@R1, RM261003ABZP-V15@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1.
  - UI: accepted mockups RM261003ABZP-M1@R1 and RM261003ABZP-M4@R1 (S10–S17 explorer and conflict states), RM261003ABZP-M2@R1 source-mode visuals reused for non-Markdown files, manifest AD4 (`ui-mockups/manifest.md:35`); UI requirements (`rm261003abzp-ui-requirements.md`) RM261003ABZP-UREQ1@R2 (line 23), RM261003ABZP-UREQ2@R1 (line 42), RM261003ABZP-UREQ3@R2 non-Markdown source view only (line 56), RM261003ABZP-UREQ7@R2 (line 120), RM261003ABZP-UREQ11@R1 (line 184); UI design (`rm261003abzp-ui-design.md`, Status `Ready for Planning`) RM261003ABZP-UDES1@R2 (line 2271), RM261003ABZP-UDES2@R1 (line 2281), RM261003ABZP-UDES3@R2 non-Markdown part (line 2291), RM261003ABZP-UDES7@R2 (line 2331), RM261003ABZP-UDES11@R1 (line 2371); RM261003ABZP-US1@R2 (line 2061), RM261003ABZP-US5@R2 (line 2097), RM261003ABZP-US9@R1 (line 2133); RM261003ABZP-UV1@R2 (line 2144, PH1 states), RM261003ABZP-UV2@R1 (line 2156), RM261003ABZP-UV6@R2 (line 2204), RM261003ABZP-UV10@R1 (line 2252, DI1 states).
- **Assigned parent obligations:**
  - Requirements: RM261003ABZP-REQ1@R3, RM261003ABZP-REQ2@R2, RM261003ABZP-REQ10@R2, RM261003ABZP-REQ11@R3, RM261003ABZP-REQ9@R2 (benchmark harness and CI gate mechanism only; DI2 and DI3 deliver the measured targets) — phase file lines 324–329.
  - Design: RM261003ABZP-DES1@R2, RM261003ABZP-DES2@R2, RM261003ABZP-DES3@R1, RM261003ABZP-DES4@R1, RM261003ABZP-DES5@R2 (registry and keymap core with `KeyScope`, global bindings only), RM261003ABZP-DES8@R1, RM261003ABZP-DES9@R3 (kernel text view and decorations, no live-preview provider), RM261003ABZP-DES10@R2, RM261003ABZP-DES17@R1, RM261003ABZP-DES15@R1, RM261003ABZP-DES16@R1 — phase file lines 374–385; DI1 parts of the Phase Design component rows and code shapes (lines 128–249).
  - Success: RM261003ABZP-S1@R1, RM261003ABZP-S2@R1, RM261003ABZP-S10@R1, RM261003ABZP-S11@R1 (boundary and restore part), RM261003ABZP-S12@R1 — phase file lines 397–402.
  - Verification: RM261003ABZP-V1@R1, RM261003ABZP-V2@R1, RM261003ABZP-V3@R1, RM261003ABZP-V14@R1, RM261003ABZP-V15@R2, RM261003ABZP-V17@R1, RM261003ABZP-V18@R1 — phase file lines 403–411.
  - UI: RM261003ABZP-M1@R1, RM261003ABZP-M4@R1 (S10–S17), AD4; RM261003ABZP-UREQ1@R2, RM261003ABZP-UREQ2@R1, RM261003ABZP-UREQ7@R2, RM261003ABZP-UREQ11@R1, RM261003ABZP-UREQ3@R2 (non-Markdown source view); RM261003ABZP-UDES1@R2, RM261003ABZP-UDES2@R1, RM261003ABZP-UDES7@R2, RM261003ABZP-UDES11@R1, RM261003ABZP-UDES3@R2 (non-Markdown source view); RM261003ABZP-US1@R2 via RM261003ABZP-UV1@R2 (startup frame, explorer hidden, `:vs` split, save-failed, toasts, partial `sync.ts` statusline) and RM261003ABZP-UV2@R1; RM261003ABZP-US5@R2 via RM261003ABZP-UV6@R2; RM261003ABZP-US9@R1 via RM261003ABZP-UV10@R1 (Normal/Insert badge, visual selection, cursorline, dirty buffer, error toast) — phase file lines 386–390, 412–415.
  - Downstream work boundary: pin Bun and `@opentui/core`; confirm OpenTUI paint, buffer, and test-renderer APIs, recursive `fs.watch`, and Finder trash automation; may not add AppState fields for later DIs, weaken atomic-save, restore, or boundary rules, change the command, registry, file-type, or `layoutText` contracts consumed by DI2 and DI3, or add language-specific code to `core/kernel`; a material mismatch in `fs.watch` or OpenTUI returns to roadmap design clarification — phase file lines 416–423.
- **Dependency gates:** RM261003ABZP-DI1@R2 has no prerequisites (phase file line 395, "Dependencies: None"); no gate is due before DI1 work. DI1 is the producer of **G1** (phase file "Cross-Work Dependency Gates", line 73): the store, `CommandRegistry` and `Keymap` with `KeyScope`, `layoutText` and `Decoration`, `FileTypeRegistry` with `text`, code, and `markdown` (source view), `lowlightHighlighter`, the OpenTUI shell with `editorViews`, `OverlayHost`, and `Prompt`, `readTextFile`, `atomicWrite`, the watcher, the effect runner, `bun run check`, CI, and the bench harness; evidence: DI1 PR merged to `main` with CI green and V1, V2, V15@R2, V17, V18 passing. Phase entry conditions (phase file lines 64–67) require the DI1 discussion to pin exact `@opentui/core` and Bun versions.
- **Accepted at:** 2026-10-03, this discussion (W261003HEGE registration). Parent approval evidence: index Approval (`rm261003abzp-roadmap-index.md:262–271`) and phase Approval (phase file lines 637–649) — R1 delegated self-drive ("you self-drive and decide all … don't raise any question to me"); R2 "Apply all six (Recommended)". Work-level self-drive for this run: user input "self drive /s1mple-discuss about this DI".

Use revision-qualified parent PH/DI/REQ/DES/S/V and applicable M/UREQ/UDES/US/UV references. Reference definitions instead of copying them; if paths move, resolve the same IDs and revisions. Check current index/phase assignments and existing W bindings before accepting a new assignment.

### Previous Accepted Bindings

None

### Parent Synchronization

- **Registration or discussion update:** `Pending parent synchronization` — proposed changes for RM261003ABZP-DI1@R2 → W261003HEGE:
  - `rm261003abzp-roadmap-index.md`, Delivery Items row DI1 (line 131): Work `Pending` → `W261003HEGE`; PR stays `Pending`.
  - `rm261003abzp-roadmap-index.md`, Work Progress row DI1 (line 142): Work stage `Not started` → `Discussing`; Next gate → DI1 requirements and system design; Evidence → this context document's commit.
  - `rm261003abzp-roadmap-phase-1-daily-usable-editor.md`, Progress row DI1 (line 623): Work `Pending` → `W261003HEGE`; Delivery status `Not started` → `In discussion`.
  - Evidence: work folder `.s1mple/work/done/w261003hege-editor-foundation/`; no other W bound to DI1 in `.s1mple/work/active/` or `.s1mple/work/done/`. Parent writes are not authorized in this run.

The main orchestrator owns this receipt. It does not replace parent W/PR assignments or the index's work-progress view; update the parent only with explicit authorization. Later stages record their synchronization receipts in their own artifacts.

## 1. User Input

### Original Input

"read @.s1mple/work/done/rm261003abzp-so-v1/ self drive /s1mple-discuss about this DI - follow the requirementzs - choose options/designs/options that are stable, simple, easy to maintain and extend with industry compliance"

### Consolidated Requirement or Problem

Deliver RM261003ABZP-DI1@R2 (Editor foundation) of RM261003ABZP-PH1@R2 as one Work and one PR. `so [path]` opens a folder in an OpenTUI shell. The user edits notes and any UTF-8 text file in source view with lowlight syntax colouring, using vim-modal editing (the core command set, splits, and buffers). Binary and over-16 MiB files are refused. Saves are atomic autosaves that keep BOM and line endings; a recursive watcher with own-write stamps gives undoable reloads and keep/take/diff conflicts; the explorer creates, renames, moves, and trashes files.

Underneath, the PR lays the language-neutral kernel (`FileTypeRegistry`, `EditorKindRegistry`, `layoutText` with `mark` decorations, the `Highlighter` interface), the store with a pure reducer and data effects, the command registry with the `KeyScope` keymap trie, and terminal restore on every exit path. It also lands the toolchain (Bun, TypeScript 7, Biome, knip), `bun run check`, two-job CI, release-please with a four-target release exercised on `v0.1.0-rc.1`, the import-boundary test with the kernel rule, and the bench harness.

The discussion pins the Bun and `@opentui/core` versions. The OpenTUI paint, buffer, and test-renderer APIs, recursive `fs.watch`, Finder trash, and the lowlight language set are delivery confirmations recorded as unknowns. The user asked to self-drive and to choose stable, simple, maintainable, extensible, industry-compliant options.

### Constraints and Assumptions

- Self-drive applies to this run only: the agent decides sub-decisions without per-stage approval and records the user's words as approval evidence (user input above; memory `s1mple-self-drive`).
- The parent baseline is binding: DI1 refines file-level module splits and test layouts but may not change the contracts consumed by DI2 and DI3, add later-DI AppState fields, weaken safety, restore, or boundary rules, or put language-specific code in `core/kernel` (phase file lines 416–423).
- "Keep it lean and simple" is the only established implementation rule (`.s1mple/S1MPLE.md:59`).
- No TypeScript toolchain, tests, or checks exist yet; DI1 establishes them, so `.s1mple/docs/project.md` and `.s1mple/docs/languages/typescript.md` gain their first concrete values from this work.
- Releases are cut only at phase exit; DI1 exercises the release workflow on a manually pushed `v0.1.0-rc.1` tag only (phase file line 132; index line 64).
- Assumption: Alfred code is a porting reference only and is not a dependency (`rm261003abzp-roadmap-context.md`, Sources; phase file line 40).
- Assumption: the accepted UI baseline is M1@R1 and M4@R1 with AD4. The cycle 3 drafts M1@R2 and M3@R2 await user review and are not part of the binding (`ui-mockups/manifest.md:91–92`).

## 2. Project Structure

- `.s1mple/` — the only tracked content; guidance, roadmap, and this work folder.
- `.gitignore` — already ignores `node_modules/`, `dist/`, `build/`, `out/`, `*.tsbuildinfo`, `coverage/`, `.cache/`, `.tmp/`, and `.playwright-mcp/`; DI1 build output and caches fit these entries.
- `AGENTS.md`, `CLAUDE.md` — both contain only `@.s1mple/S1MPLE.md`.
- `git log` — one commit, `d00d3a3 chore: initialize s1mple workspace and so v1 roadmap`; current branch `feat/rm261003abzp-di1-editor-foundation` from `main`.
- No `package.json`, `tsconfig.json`, `src/`, `test/`, or `.github/` exists. The planned tree is `rm261003abzp-design.md:156–219` (Project Structure); DI1 creates every layer folder except `src/preview` (phase file line 110) and the DI1 rows of Components and files (phase file lines 130–148).
- `../alfred/` — porting references: `apps/tui/src/terminal/shutdown.ts` (restore coordinator), `apps/tui/src/view/editor/vim.ts` (two-mode vim core), `apps/tui/src/view/markdown/code-highlight.ts` (lowlight), `packages/view-model/src/knowledge/autosave-queue.ts` (autosave queue).

## 3. Standards and Patterns

### Applicable Standards

- `.s1mple/S1MPLE.md:59` — Implementation: keep it lean and simple (user decision, 2026-10-03).
- `.s1mple/S1MPLE.md:41-42` — do not use the native `Explore` subagent; inspect directly or use `s1mple-explore`.
- `rm261003abzp-requirements.md:270-294` (RM261003ABZP-REQ11@R3) — tool-enforced layer and kernel boundaries; extension by registration; CommonMark 0.31.2 + GFM, XDG Base Directory 0.8, `NO_COLOR`, Conventional Commits 1.0.0, Semantic Versioning 2.0.0, strict TypeScript ESM; terminal restore on every exit path; macOS and Linux support.
- `rm261003abzp-requirements.md:248-269` (RM261003ABZP-REQ10@R2) — `bun run check` < 30 s with no tool depending on the TypeScript compiler API; CI < 3 min; four-target `bun build --compile` release with SHA-256 checksums and smoke tests; exact `@opentui/core` pin; `bun run dev` without a build step.
- `rm261003abzp-requirements.md:59-82` (RM261003ABZP-REQ1@R3) — atomic save sequence (same-directory temp, fsync, permission bits, rename, symlink target); BOM, line separator, and trailing newline preserved; directory watching; the 8 KiB NUL, UTF-8, and 16 MiB refusal rules with exact message texts; freedesktop trash on Linux.
- `rm261003abzp-requirements.md:83-105` (RM261003ABZP-REQ2@R2) — the exact motion, operator, text-object, register, undo-block, Esc-timeout, search, and ex-command set.
- `rm261003abzp-design.md:27-29` — binding constraints: only `src/ui/` imports `@opentui/*`; `src/core/` imports no I/O, UI, or runtime APIs; `src/core/kernel/` imports nothing from `filetypes/`, `lang/`, or `features/`; no TS-API-dependent tool.
- `rm261003abzp-design.md:1257-1266` (RM261003ABZP-DES15@R1) — Bun exact version in `packageManager`, TS 7 `tsc --noEmit` strict, Biome, knip, `bun test`; `check` = biome + tsc + knip + boundary test + unit tests; CI `check` ∥ `test`; release-please; single-runner cross-compile with `OPENTUI_LIBC=glibc` for Linux.
- `rm261003abzp-design.md:1063-1097` (RM261003ABZP-V15@R2, RM261003ABZP-V17@R1) — boundary test via `Bun.Transpiler.scanImports` with two violation fixtures; PTY restore test on `:q`, `SIGTERM`, `SIGINT`, uncaught exception, and `NO_COLOR=1`.
- `rm261003abzp-research.md:354-366` (RF1) — pin OpenTUI exactly (research named `0.5.14` as of 2026-09-30) and contain it in `src/ui`.
- `rm261003abzp-research.md:516-536` (RF11) — temp + fsync + rename in the same directory; watch directories, not files; ignore own writes; undoable reload.
- `rm261003abzp-research.md:548-565` (RF13) — TypeScript 7.0 ships no compiler API; Biome, knip (oxc), and a `bun test` import scan avoid it.

### Existing Patterns

- `.s1mple/docs/project.md:39` — no project-wide engineering standards are established yet; DI1 sets the first ones.
- `.s1mple/docs/languages/typescript.md` (Toolchain and Configuration) — `Not established`; no `tsconfig`, formatter, linter, or test runner exists.
- `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:200-226` — the DI1 `Action` and `Effect` unions; every failing effect answers with a result action; `key` and `timer` carry `now`; no `Date.now()` in core.
- `rm261003abzp-roadmap-phase-1-daily-usable-editor.md:228-249` — DI1 registers `text`, code file types, and `markdown` (source view only); window providers are highlighter marks, then search and selection marks; highlighter look-back is 200 lines.
- `rm261003abzp-design.md:431-480` — `update` routes a closed Action union; `createStore` is the only mutable cell.
- `rm261003abzp-design.md:482-523` — `Command<Ctx, R>` generic so the kernel never imports `core/state`; `KeyScope { mode, filetype? }`; duplicate ids throw at startup.
- `rm261003abzp-design.md:525-560` — `TextBuffer` interface and table-driven `handleKey` returning `VimEffect[]`.
- `rm261003abzp-design.md:600-650` and `rm261003abzp-design.md:650-700` — `Decoration`, `layoutText`, `Highlighter` (kernel-owned), `FileType`, `FileTypeRegistry.forPath` (extension → file name → `text`), `EditorKindRegistry`.
- `../alfred/apps/tui/src/view/editor/vim.ts:15` — Alfred's pure vim core already returns effects instead of performing them (two modes only).
- `../alfred/apps/tui/src/terminal/shutdown.ts` — Alfred's terminal-restore coordinator, named as the reference for RM261003ABZP-DES10@R2.

## 4. Architecture

```text
Proposed DI1 architecture (no code exists; from rm261003abzp-design.md System Architecture and phase file View)

bin/so → src/app/main.ts ──► createStore(update) ◄── dispatch ── src/ui/shell (input, editorViews, views, overlays)
               │                   │ effects                          ▲ subscribe
               ▼                   ▼                                   │
         src/app/effects.ts ──► src/workspace/{fs, watcher, trash, system}
               │
               ▼
         src/core/{state, config(schema+defaults),
                   kernel/{text, editor, vim, commands, view},   ← imports only kernel
                   filetypes, lang/code, lang/markdown/file-type.ts (source view only)}

Allowed imports: app → ui, workspace, core │ ui → core │ workspace → core │ core → core + allowed parsing libs
                 core/kernel → core/kernel only │ only src/ui imports @opentui/*
```

- `src/app` — composition root: CLI args, file-type and command registration, store, effect runner, adapters, UI, process lifecycle and exit codes.
- `src/core/state` — `AppState` (DI1 fields only), `Action`/`Effect` unions, pure `update`, autosave policy, conflict rules, open-as-buffer.
- `src/core/kernel` — language-neutral TextBuffer, undo blocks, registers, window tree, vim engine, ex commands, command registry, `KeyScope` keymap trie, `layoutText` and decorations.
- `src/core/filetypes` — `FileType`, `FileTypeRegistry` with the `text` fallback, `EditorKindRegistry` with the built-in `text` kind.
- `src/core/lang/code`, `src/core/lang/markdown/file-type.ts` — lowlight `Highlighter`, code file types, and the `markdown` file type with one `source` view.
- `src/core/config/schema.ts` — zod schema and defaults used directly (no file loading in DI1).
- `src/workspace` — `readTextFile`, `atomicWrite`, create/rename/move, trash adapters, recursive watcher with own-write stamps, clipboard.
- `src/ui` — OpenTUI renderer lifecycle, input normalization with kitty keyboard protocol and Esc timeout, shell regions, `EditorView` painting `RenderLine[]`, bufferline, explorer, statusline, command line, prompts, conflict and diff, toasts, theme with `NO_COLOR`, restore.
- `test/` — boundary test, PTY e2e, bench harness, fixtures.

## 5. Code Flow

```text
Current: none — the repository has no source code.

Proposed (rm261003abzp-roadmap-phase-1-daily-usable-editor.md:161-172; rm261003abzp-design.md:221-312):
so [path] → resolve (folder | file's parent | missing → stderr, exit 2) → first frame (shallow readdir + opened file)
key → normalizeKey → dispatch(key, now) → update → keymap {mode} → command | vim.handleKey → TextBuffer' + undo block
    → store.notify → shell.render → layoutText(visible rows, [highlightMarks, searchMarks, selectionMarks]) → paint
open(path) → effect read → readTextFile → binary | > 16 MiB → fileRefused → message line, no buffer
                                        └─ ok → fileLoaded → forPath → buffer {fileType, bom, eol, view: source}
edit → autosave(1 s) | leave Insert | switch | :w | exit → effect write → atomicWrite (realpath → tmp → fsync → chmod → rename)
     └─ fail → dirty + "save failed: <reason>" → retry 1/2/4…30 s
watcher → own write? ignore : clean → undoable reload : dirty → conflict (autosave paused) → keep | take | diff
:q / SIGTERM / SIGINT / uncaught error → restore terminal (main screen, cursor, mouse + kitty keyboard off)
```

1. `bin/so` runs `src/app/main.ts`, which resolves the path, registers file types and commands, creates the store, starts the shell, and starts the watcher.
2. UI input becomes `key`, `resize`, and `mouse` actions; `update` resolves keymap bindings first, then the vim engine.
3. Every side effect is an `Effect` run by `src/app/effects.ts`; each fallible effect answers with a result action.
4. Each frame lays out only visible rows from the buffer plus `mark` decorations from the highlighter, search, and selection.
5. Saves and watcher events go through `atomicWrite` and own-write stamps; conflicts and reloads are pure reducer decisions.
6. Every exit path restores the terminal.

## 6. Boundaries

### In Scope

- Tooling and delivery: `package.json` scripts (`dev`, `check`, `test`, `bench`, `build`) with exact pins; `tsconfig.json` (TS 7 strict ESM); `biome.json`; `knip.json`; CI `check` ∥ `test`; release-please config and manifest; release workflow (four targets, `SHA256SUMS`, smoke `so --version`) exercised on `v0.1.0-rc.1`; `bin/so`.
- Core: store and reducer; DI1 Action/Effect variants and AppState fields only; command registry and `KeyScope` keymap trie (global bindings); TextBuffer, undo blocks, registers including `"+`; the full RM261003ABZP-REQ2@R2 vim set, search highlight, `:s`/`:%s`, ex commands with completion; window tree and `Ctrl-w h/j/k/l`; `layoutText` with `mark` decorations; `FileTypeRegistry`, `EditorKindRegistry`, `lowlightHighlighter`, `text`, code, and `markdown` (source) file types; config schema and defaults.
- Workspace: path resolution; `readTextFile`; explorer tree excluding hidden folders and `.gitignore` matches; create (`.md` added only when the name has no extension), rename, move (file only), trash (freedesktop, Finder, typed confirmation); `atomicWrite`; autosave and backoff; recursive watcher; undoable reload; conflict keep/take/diff.
- UI: shell regions and layout classes; bufferline; explorer (docked and floating); `editorViews` with the text view; statusline (mode, view = `source`, path, dirty, words for notes only, Ln:Col); command line and message line; prompts; conflict and diff; toasts; theme (dark, light, `NO_COLOR`); cursor shape; kitty keyboard protocol with 50 ms Esc timeout; restore.
- Verification: V1, V2, V3, V14, V15@R2, V17, V18; UV1 (PH1 DI1 states), UV2, UV6, UV10 (DI1 states); bench harness and CI gate (median of 5, 2× target) with source-view keystroke and open benchmarks on the 5,000-line fixture.

### Out of Scope

- DI2: config file loading, which-key popup, pickers, palette, help, Markdown-scoped keys, state persistence, links, index and worker, link-impact text on move.
- DI3: Markdown live and reading views, widgets, `src/ui/widgets/`, `src/preview`, keystroke p95 benchmark in live preview.
- DI4: daily notes, templates, Bases, the `base` editor kind.
- Index Deferred Scope: vim macros, Visual block, Ex ranges, code intelligence, notebooks, plugin API, macOS signing.
- Cutting a real release (`v0.1.0` happens at PH1 exit).
- Writing parent roadmap files in this run.

### Interfaces and Dependencies

- G1 outputs consumed by DI2 (phase file line 73): store (`update`, `createStore`, Action and Effect unions), `CommandRegistry`, `Keymap`, `KeyScope`, `layoutText`, `Decoration`, `FileTypeRegistry` (`text`, code, `markdown` source), `lowlightHighlighter`, the shell with `editorViews`, `OverlayHost`, `Prompt`, `readTextFile`, `atomicWrite`, watcher, effect runner, `bun run check`, CI, bench harness.
- Contracts frozen for DI2 and DI3: `RenderLine`, `TextView`, `Decoration`, and `layoutText` ship at their final RM261003ABZP-DES9@R3 shapes (phase file line 137); `Command`, `KeyScope`, `FileType`, `ViewSpec`, `EditorKindSpec` at their RM261003ABZP-DES5@R2 and RM261003ABZP-DES17@R1 shapes.
- External packages named by the parent design: `@opentui/core` (exact pin), `lowlight`, `zod`, Biome, knip, TypeScript 7, release-please (GitHub Action).
- Platform services: POSIX file system with `fsync` and `rename`; Bun recursive `fs.watch` on macOS and Linux; freedesktop trash (`$XDG_DATA_HOME/Trash`); macOS Finder via `osascript`; system clipboard; GitHub Actions runners (`ubuntu`, `macos-latest`).

## 7. Unknowns

- **Bun version pin** — exact Bun version for `packageManager` and CI. Bun 1.3.10 is installed locally; the parent research did not name a Bun version.
- **`@opentui/core` version pin** — exact version. RF1 named `0.5.14` as the latest as of 2026-09-30; a newer release may exist on 2026-10-03.
- **OpenTUI paint, buffer, and test-renderer APIs** — the `EditorView` renderable shape in the parent design is illustrative (`rm261003abzp-design.md:780-800`); the real custom-renderable, cell-buffer, cursor-shape, kitty-keyboard, and test-renderer APIs must be confirmed at the pinned version. A material mismatch returns to roadmap design clarification.
- **Recursive `fs.watch`** — Bun's `fs.watch(root, {recursive: true})` behavior on macOS and Linux (event coverage after rename-based saves, debounce needs) is confirmed by V1 in CI on both platforms. No fallback is designed; failure returns to design.
- **Finder trash automation** — `osascript` delete-to-Trash may be blocked by macOS automation permissions; confirmed by a manual macOS check recorded in the DI1 PR, with the typed-confirmation fallback verified by UV6.
- **lowlight language set and pin** — which lowlight bundle (common vs. selected grammars) and which code file types DI1 registers. The design lists TypeScript, JavaScript, JSON, YAML, TOML, shell, Python, CSS, HTML, "…"; V18 needs at least `.ts`, `.yaml`, `Makefile` → `makefile` by file name, and `notes.txt` → `text`. The binary-size and startup cost of the chosen set is unmeasured.
- **release-please-action config keys** — the phase requires confirming them against current docs (phase file line 132): `release-type`, `initial-version`, manifest mode, and how the binary job triggers on `release_created` versus a `v*` tag push.
- **TypeScript 7 with Bun** — the npm package name and invocation for TS 7 native `tsc` (`typescript@7` vs. a preview package), and whether it typechecks Bun types (`@types/bun` / `bun-types`) cleanly.
- **Clipboard backend** — the `"+` register needs a system clipboard adapter in `src/workspace/system.ts`. Not decided: OSC 52 through the terminal, platform commands (`pbcopy`/`pbpaste`, `wl-copy`/`xclip`), or both; `clipboardRead` over OSC 52 is not supported by all terminals.
- **Neovim reference version for V2** — V2 records expected values from Neovim 0.11 `--clean`; the local machine has Neovim 0.12.4. How expected values are produced and stored (generated by a script against a pinned Neovim, or hand-recorded tables) is not decided.
- **PTY e2e tooling** — V17 needs a real PTY and a headless terminal emulator; whether `Bun.spawn` supports a pseudo-terminal at the pinned Bun version, and which headless emulator parses the screen state (for example `@xterm/headless`), is not decided.
- **Bench harness in CI** — runner type for the fixed-runner requirement, how the 2× gate reads targets for DI1-only benchmarks (source-view keystroke and open on the 5,000-line fixture), and whether CI stays under 3 min with the bench job.
- **Partial UV1 statusline in DI1** — the phase refinement checks `MODE │ source │ scripts/sync.ts │ index │ Ln:Col` for PH1 (phase file line 314), but the `index` segment arrives in DI2; the DI1 golden presumably omits it. Similarly, UV1's startup "indexing 4,210/10,000" state belongs to DI2.
- **DI1 config defaults without a config file** — `escTimeoutMs`, autosave, and `theme`/`color` come from schema defaults only; `NO_COLOR` must still apply. How the `color` override interacts before config loading exists is to be settled in design.
- **Project-doc staleness** — `.s1mple/docs/project.md:9` says branch `master` with no commits; the repository is on `main` with one commit. DI1 will also establish the first toolchain facts for `project.md` and `typescript.md`.
- **Draft mockups** — M1@R2 and M3@R2 (cycle 3) await user review (`ui-mockups/manifest.md:92`). If accepted, they supersede M1@R1 and would require a binding reconciliation before DI1 UI verification is finalized.
